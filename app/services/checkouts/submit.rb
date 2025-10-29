# frozen_string_literal: true

module Checkouts
  class Submit
    Result = Struct.new(:order, :transaction, :response, :payment_method, :schedule, keyword_init: true)

    class Error < StandardError; end
    class EmptyCartError < Error; end
    class Failure < Error
      attr_reader :order, :transaction, :response, :installment, :payment_method, :amount_cents, :amount_currency

      def initialize(order:, transaction:, response:, installment:, payment_method:, amount_cents:, amount_currency:, message:)
        super(message)
        @order = order
        @transaction = transaction
        @response = response
        @installment = installment
        @payment_method = payment_method
        @amount_cents = amount_cents
        @amount_currency = amount_currency
      end
    end

    def initialize(cart:, user:, payment_method: nil, tokenize: false, card_details: {}, saved_card_cvv: nil, payment_mode: nil, staggered_payment_plan: nil, client: nil)
      @cart = cart
      @user = user
      @payment_method = payment_method
      @tokenize = tokenize
      card_hash = card_details || {}
      card_hash = card_hash.to_h if card_hash.respond_to?(:to_h)
      @card_details = card_hash.deep_symbolize_keys
      @saved_card_cvv = saved_card_cvv.to_s.gsub(/\D/, "")
      @payment_mode = (payment_mode.presence || cart.payment_mode || "full").to_s
      @staggered_payment_plan = staggered_payment_plan || cart.staggered_payment_plan
      @client = client || default_client
    end

    def call
      raise EmptyCartError, "Cart is empty" if cart.cart_items.empty?

      ActiveRecord::Base.transaction do
        order = build_order!
        schedule = nil
        installment_to_charge = nil

        charge_amount_cents = order.total_cents
        if staggered_payment?
          schedule, installment_to_charge = build_staggered_schedule!(order)
          raise Error, "All installments have already been settled." unless installment_to_charge

          charge_amount_cents = installment_to_charge.amount_cents
        end

        response = initiate_payment!(order, amount_cents: charge_amount_cents, payment_method: payment_method)

        unless response.successful?
          failure_message = response.error_message.presence || "Payment was declined."

          raise Failure.new(
            order:,
            transaction: nil,
            response:,
            installment: installment_to_charge,
            payment_method: payment_method,
            amount_cents: charge_amount_cents,
            amount_currency: order.total_currency,
            message: failure_message
          )
        end

        saved_payment_method = persist_tokenized_card(response) if tokenize? && response.card_token.present?
        applied_payment_method = saved_payment_method || payment_method

        payment_tx = create_payment_transaction!(
          order: order,
          payment_method: applied_payment_method,
          status: :succeeded,
          amount_cents: charge_amount_cents,
          amount_currency: order.total_currency,
          request_payload: response.request_payload || {},
          response_payload: response.parsed_body || {},
          request_reference: response.request_reference,
          response_reference: response.response_reference,
          processed_at: Time.current,
          metadata: { "result_code" => response.result_code }
        )

        if staggered_payment?
          finalize_staggered_order!(order, schedule, installment_to_charge, applied_payment_method, payment_tx)
        else
          order.update!(
            payment_method: applied_payment_method,
            submitted_at: Time.current
          )
          order.mark_paid!(Time.current)
        end

        Result.new(
          order:,
          transaction: payment_tx,
          response:,
          payment_method: applied_payment_method,
          schedule: order.staggered_payment_schedule
        )
      end
      rescue Failure => e
        persist_failed_transaction!(e)
        raise e
      rescue StandardError => e
        raise Error, e.message
    end

    private

    attr_reader :cart, :user, :payment_method, :tokenize, :card_details, :saved_card_cvv, :payment_mode, :staggered_payment_plan, :client

    def build_order!
      existing_order = cart.order

      full_total_money = cart.full_total_money
      base_total_money = cart.base_price_total

      order_total_money = if staggered_payment?
                            base_total_money || full_total_money
      else
                            full_total_money
      end

      subtotal_cents = order_total_money.cents
      currency = order_total_money.currency.iso_code
      selected_plan = payment_mode.to_s == "staggered" ? (staggered_payment_plan || cart.staggered_payment_plan) : nil

      order = existing_order || Order.new
      order.assign_attributes(
        club: cart.club,
        user:,
        cart:,
        payment_mode: payment_mode || cart.payment_mode || "full",
        staggered_payment_plan: selected_plan,
        subtotal_cents: subtotal_cents,
        subtotal_currency: currency,
        discount_cents: 0,
        discount_currency: currency,
        total_cents: subtotal_cents,
        total_currency: currency
      )
      order.status = :draft if order.new_record? || order.status_draft?
      order.save!

      order.order_items.destroy_all

      cart.cart_items.includes({ member: :membership_type }, plan: :product).each do |item|
        membership_type = item.member&.membership_type
        quantity = item.quantity.to_i.nonzero? || 1

        unit_money = if staggered_payment? && membership_type&.base_price
                        membership_type.base_price
        else
                        Money.new(item.unit_price_cents, item.unit_price_currency)
        end

        item_total_money = if staggered_payment?
                              unit_money * quantity
        else
                              Money.new(item.total_price_cents, item.total_price_currency)
        end

        item_total_money ||= Money.new(item.total_price_cents, item.total_price_currency)

        order.order_items.create!(
          member: item.member,
          plan: item.plan,
          product: item.plan.product,
          description: item.plan.product&.name,
          quantity: quantity,
          unit_price_cents: unit_money.cents,
          unit_price_currency: unit_money.currency.iso_code,
          total_price_cents: item_total_money.cents,
          total_price_currency: item_total_money.currency.iso_code
        )
      end

      order
    end

    def initiate_payment!(order, amount_cents:, payment_method:)
      return_url = Settings.paygate.pay_host.return_url
      notify_url = Settings.paygate.pay_host.notify_url

      if payment_method
        client.token_payment(
          order:,
          transaction: PaymentTransaction.new,
          payment_method:,
          cvv: saved_card_cvv.presence,
          return_url:,
          notify_url:,
          amount_cents:
        )
      else
        client.card_payment(
          order:,
          transaction: PaymentTransaction.new,
          card_details:,
          tokenize: tokenize?,
          return_url:,
          notify_url:,
          amount_cents:
        )
      end
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
      method.expiry_month = response.card_expiry_month.to_i if response.card_expiry_month
      method.expiry_year = response.card_expiry_year.to_i if response.card_expiry_year

      if PaymentMethod.where(club: cart.club, user:).where(default: true).where.not(id: method.id).empty?
        method.default = true
      end

      method.save!
      method
    end

    def tokenize?
      tokenize
    end

    def staggered_payment?
      payment_mode == "staggered" && staggered_payment_plan.present?
    end

    def build_staggered_schedule!(order)
      raise Error, "No payment plan selected" unless staggered_payment_plan

      schedule = order.staggered_payment_schedule

      if schedule && schedule.staggered_payment_plan_id != staggered_payment_plan.id
        if schedule.installments.none?(&:status_paid?)
          schedule.destroy!
          schedule = nil
        else
          raise Error, "Cannot change payment plan after installments have been paid."
        end
      end

      if schedule.nil?
        plan_installments = staggered_payment_plan.ordered_installments
        raise Error, "Selected payment plan has no installments configured." if plan_installments.empty?

        schedule = order.build_staggered_payment_schedule(
          club: order.club,
          staggered_payment_plan:,
          status: :active,
          activated_at: Time.current
        )

        total_cents = order.total_cents
        allocated_cents = 0

        plan_installments.each_with_index do |plan_installment, index|
          percentage = plan_installment.percentage.to_f
          raw_amount = total_cents * percentage / 100.0
          amount_cents =
            if index == plan_installments.length - 1
              total_cents - allocated_cents
            else
              raw_amount.round
            end
          allocated_cents += amount_cents

          due_time = if index.zero?
                       Time.current
          else
                       due_date = plan_installment.due_on || order.created_at&.to_date || Date.current
                       zone = Time.zone || ActiveSupport::TimeZone["UTC"]
                       zone.local(due_date.year, due_date.month, due_date.day, 23, 59, 59)
          end

          schedule.installments.build(
            position: index,
            percentage: percentage,
            amount_cents: amount_cents,
            amount_currency: order.total_currency,
            due_at: due_time,
            status: :pending,
            club: order.club
          )
        end

        schedule.save!
      end

      next_installment = schedule.installments.order(:position, :id).detect { |installment| !installment.status_paid? }
      [ schedule, next_installment ]
    end

    def finalize_staggered_order!(order, schedule, installment, payment_method, payment_tx)
      order.update!(
        payment_method:,
        submitted_at: Time.current,
        status: :pending_payment
      )

      if installment
        installment.update!(payment_transaction: payment_tx)
        installment.mark_paid!(Time.current)
      end

      schedule.reload
      if schedule.installments.all?(&:status_paid?)
        order.reload
      else
        order.cart&.mark_as_partially_paid!(Time.current)
      end
    end

    def club_currency
      cart.club.settings.dig("finance", "currency") || "ZAR"
    end

    def default_client
      Paygate::PayHostClient.new(
        merchant_id: Settings.paygate.pay_host.merchant_id,
        password: Settings.paygate.pay_host.password,
        endpoint: Settings.paygate.pay_host.endpoint
      )
    end

    def persist_failed_transaction!(failure)
      order = failure.order
      return unless order

      failed_tx = create_payment_transaction!(
        order: order,
        payment_method: failure.payment_method,
        status: :failed,
        amount_cents: failure.amount_cents,
        amount_currency: failure.amount_currency,
        request_payload: failure.response.request_payload || {},
        response_payload: failure.response.parsed_body || {},
        request_reference: failure.response.request_reference,
        response_reference: failure.response.response_reference,
        processed_at: Time.current,
        metadata: {
          "error" => failure.message,
          "result_code" => failure.response.result_code,
          "installment_id" => failure.installment&.id
        }
      )

      failure.instance_variable_set(:@transaction, failed_tx)

      SendPaymentFailedJob.perform_later(
        order.id,
        message: nil,
        payment_transaction_id: failed_tx.id
      ) rescue nil
    end

    def create_payment_transaction!(order:, payment_method:, status:, amount_cents:, amount_currency:, request_payload:, response_payload:, request_reference:, response_reference:, processed_at:, metadata: {})
      PaymentTransaction.transaction(requires_new: true) do
        order.payment_transactions.create!(
          status: status,
          gateway: "paygate",
          amount_cents: amount_cents,
          amount_currency: amount_currency,
          request_payload: request_payload,
          response_payload: response_payload,
          request_reference: request_reference,
          response_reference: response_reference,
          processed_at: processed_at,
          payment_method: payment_method,
          metadata: metadata.compact
        )
      end
    end
  end
end
