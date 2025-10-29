# frozen_string_literal: true

module Notifications
  class OrderConfirmationNotifier
    include ApplicationHelper

    attr_reader :order, :payment_transaction, :installment

    def initialize(order:, payment_transaction: nil, installment: nil)
      @order = order
      @payment_transaction = payment_transaction
      @installment = installment
    end

    def deliver
      return false unless order&.user
      return false unless recipient_number.present?

      channel =
        if send_via_whatsapp
          :whatsapp
        else
          :none
        end

      ActiveSupport::Notifications.instrument(
        "order.confirmation.sent",
        order_id: order.id,
        payment_transaction_id: payment_transaction&.id,
        installment_id: installment&.id,
        mobile_number: order.user.formatted_mobile_number,
        recipient_number: recipient_number,
        channel: channel,
        payment_amount: formatted_payment_amount,
        remaining_balance: formatted_remaining_balance
      )

      channel == :whatsapp
    end

    private

    def send_via_whatsapp
      client = whatsapp_client
      return false unless client&.ready?

      template_id = whatsapp_template_id

      if template_id.present?
        begin
          client.send_template_message_by_id(
            template_id: template_id,
            recipient_number: recipient_number,
            components: template_components
          )
          Rails.logger.info("[OrderConfirmation] Sent WhatsApp template #{template_id} to #{recipient_number} using #{client.credentials_label}")
          return true
        rescue Whatsapp::IntegrationError => error
          Rails.logger.warn("[OrderConfirmation] WhatsApp template delivery failed for order #{order.id}: #{error.message}. Falling back to text message.")
        end
      end

      client.send_text_message(
        recipient_number: recipient_number,
        message: message_body
      )
      Rails.logger.info("[OrderConfirmation] Sent WhatsApp text confirmation to #{recipient_number} using #{client.credentials_label}")
      true
    rescue Whatsapp::IntegrationError => error
      Rails.logger.warn("[OrderConfirmation] WhatsApp delivery failed for order #{order.id}: #{error.message}")
      false
    rescue StandardError => error
      Rails.logger.error("[OrderConfirmation] Unexpected WhatsApp error for order #{order.id}: #{error.class} #{error.message}")
      Rails.logger.debug { error.backtrace.join("\n") } if error.backtrace
      false
    end

    def message_body
      text = I18n.t(
        "notifications.order_confirmation.whatsapp_text",
        club: order.club&.name || "EasyClub",
        number: order.number,
        amount: formatted_payment_amount,
        remaining: formatted_remaining_balance.presence,
        default: "Thank you! We received a payment of #{formatted_payment_amount} for order #{order.number} at #{order.club&.name || 'EasyClub'}."
      )

      if formatted_remaining_balance.present?
        remainder = I18n.t("notifications.order_confirmation.whatsapp_remaining", remaining: formatted_remaining_balance, default: "Remaining balance: #{formatted_remaining_balance}.")
        "#{text} #{remainder}"
      else
        text
      end
    end

    def template_components
      parameter_formatted_total = WhatsappSdk::Resource::ParameterObject.new(type: "text", text: formatted_payment_amount)
      order_items = WhatsappSdk::Resource::ParameterObject.new(type: "text", text: membership_sentence(order))
      body_component = WhatsappSdk::Resource::Component.new(
        type: "body",
        parameters: [ parameter_formatted_total, order_items ]
      )
      [ body_component ]
    end

    def formatted_payment_amount
      @formatted_payment_amount ||= format_money(payment_amount_cents, payment_amount_currency)
    end

    def formatted_remaining_balance
      return @formatted_remaining_balance if defined?(@formatted_remaining_balance)

      remaining_cents = remaining_balance_cents
      @formatted_remaining_balance =
        if remaining_cents.positive?
          format_money(remaining_cents, order.total_currency)
        else
          nil
        end
    end

    def payment_amount_cents
      if payment_transaction&.amount_cents
        payment_transaction.amount_cents
      elsif installment&.amount_cents
        installment.amount_cents
      else
        order.total_cents
      end
    end

    def payment_amount_currency
      payment_transaction&.amount_currency.presence ||
        installment&.amount_currency.presence ||
        order.total_currency
    end

    def remaining_balance_cents
      return 0 unless order.total_cents

      paid_cents =
        if order.payment_transactions.loaded?
          order.payment_transactions
            .select(&:status_succeeded?)
            .sum { |tx| tx.amount_cents.to_i }
        else
          order.payment_transactions.status_succeeded.sum(:amount_cents).to_i
        end

      [ order.total_cents - paid_cents, 0 ].max
    end

    def format_money(cents, currency)
      Money.new(cents, currency).format
    rescue StandardError
      "#{currency} #{cents / 100.0}"
    end

    def whatsapp_client
      @whatsapp_client ||= Whatsapp::Client.new(club: order.club)
    rescue StandardError => error
      Rails.logger.error("[OrderConfirmation] Failed to initialize WhatsApp client for order #{order.id}: #{error.class} #{error.message}")
      nil
    end

    def whatsapp_template_id
      [
        order.club&.whatsapp_order_confirmation_template_id_with_fallback,
        Settings.try(:whatsapp)&.order_confirmation_template_id
      ].find(&:present?)
    end

    def recipient_number
      @recipient_number ||= order.user.mobile_number.gsub(/\D/, "")
    end

    def recipient_name
      [
        order.user.first_name,
        order.user.last_name
      ].compact_blank.join(" ").presence || order.user.email
    end
  end
end
