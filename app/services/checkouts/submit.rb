# frozen_string_literal: true

module Checkouts
  class Submit
    Result = Struct.new(:order, :transaction, :response, :payment_method, keyword_init: true)

    class Error < StandardError; end
    class EmptyCartError < Error; end

    def initialize(cart:, user:, payment_method: nil, tokenize: false, card_details: {}, client: nil)
      @cart = cart
      @user = user
      @payment_method = payment_method
      @tokenize = tokenize
      card_hash = card_details || {}
      card_hash = card_hash.to_h if card_hash.respond_to?(:to_h)
      @card_details = card_hash.deep_symbolize_keys
      @client = client || default_client
    end

    def call
      raise EmptyCartError, "Cart is empty" if cart.cart_items.empty?

      ActiveRecord::Base.transaction do
        order = build_order!
        payment_tx = order.payment_transactions.create!(
          status: :initialized,
          gateway: "paygate",
          amount_cents: order.total_cents,
          amount_currency: order.total_currency,
          payment_method: payment_method
        )

        response = initiate_payment!(order, payment_tx)
        saved_payment_method = persist_tokenized_card(response) if tokenize? && response.card_token.present?

        order.update!(
          status: response.successful? ? :pending_payment : :cancelled,
          submitted_at: Time.current,
          payment_method: saved_payment_method || payment_method
        )

        payment_tx.update!(
          status: response.successful? ? :pending : :failed,
          request_payload: response.request_payload,
          response_payload: response.parsed_body,
          request_reference: response.request_reference,
          response_reference: response.response_reference,
          processed_at: Time.current,
          payment_method: saved_payment_method || payment_method
        )

        finalize_cart!

        Result.new(
          order:,
          transaction: payment_tx,
          response:,
          payment_method: saved_payment_method || payment_method
        )
      end
    rescue StandardError => e
      raise Error, e.message
    end

    private

    attr_reader :cart, :user, :payment_method, :tokenize, :card_details, :client

    def build_order!
      subtotal_cents = cart.cart_items.sum(:total_price_cents)
      currency = cart.cart_items.first&.total_price_currency || club_currency

      order = Order.create!(
        club: cart.club,
        user:,
        cart:,
        status: :draft,
        subtotal_cents: subtotal_cents,
        subtotal_currency: currency,
        discount_cents: 0,
        discount_currency: currency,
        total_cents: subtotal_cents,
        total_currency: currency
      )

      cart.cart_items.includes(:plan, :member, plan: :product).each do |item|
        order.order_items.create!(
          member: item.member,
          plan: item.plan,
          product: item.plan.product,
          description: item.plan.product&.name,
          quantity: item.quantity,
          unit_price_cents: item.unit_price_cents,
          unit_price_currency: item.unit_price_currency,
          total_price_cents: item.total_price_cents,
          total_price_currency: item.total_price_currency
        )
      end

      order
    end

    def initiate_payment!(order, payment_tx)
      response = client.initiate_transaction(
        order:,
        transaction: payment_tx,
        tokenize: tokenize?,
        payment_method:,
        card_details:,
        return_url: Settings.paygate.pay_host.return_url,
        notify_url: Settings.paygate.pay_host.notify_url
      )

      response
    end

    def finalize_cart!
      cart.update!(status: :checked_out, checked_out_at: Time.current)
      cart.cart_items.destroy_all
    end

    def persist_tokenized_card(response)
      method = PaymentMethod.find_or_initialize_by(
        club: cart.club,
        user:,
        provider: "paygate",
        external_reference: response.card_token
      )

      method.last_four = response.card_last4 if response.card_last4
      method.brand = response.card_brand if response.card_brand
      method.expiry_month = response.card_expiry_month if response.card_expiry_month
      method.expiry_year = response.card_expiry_year if response.card_expiry_year

      if PaymentMethod.where(club: cart.club, user:).where(default: true).where.not(id: method.id).empty?
        method.default = true
      end

      method.save!
      method
    end

    def tokenize?
      tokenize
    end

    def club_currency
      cart.club.settings.dig("finance", "currency") || "ZAR"
    end

    def default_client
      Paygate::PayHostClient.new(
        merchant_id: Settings.paygate.pay_host.merchant_id,
        encryption_key: Settings.paygate.pay_host.encryption_key,
        endpoint: Settings.paygate.pay_host.endpoint
      )
    end
  end
end
