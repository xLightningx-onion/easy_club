# frozen_string_literal: true

module Notifications
  class PaymentFailureNotifier
    def initialize(order:, payment_transaction:, message:)
      @order = order
      @message = message.presence || "your club membership"
      @payment_transaction = payment_transaction
    end

    def deliver
      return false unless order&.user
      return false if recipient_number.blank?

      send_via_whatsapp || send_fallback
    end

    private

    attr_reader :order, :message, :payment_transaction

    def send_via_whatsapp
      client = whatsapp_client
      return false unless client&.ready?

      template_id = whatsapp_template_id

      if template_id.present?
        client.send_template_message_by_id(template_id: template_id, recipient_number: recipient_number, components: template_components)
      else
        client.send_text_message(
          recipient_number: recipient_number,
          message: fallback_text
        )
      end

      true
    rescue Whatsapp::IntegrationError => error
      Rails.logger.warn("[PaymentFailureNotifier] WhatsApp delivery failed: #{error.message}")
      false
    rescue StandardError => error
      Rails.logger.error("[PaymentFailureNotifier] Unexpected WhatsApp error: #{error.class} #{error.message}")
      Rails.logger.debug { error.backtrace.join("\n") } if error.backtrace
      false
    end

    def template_components
      parameter_name = WhatsappSdk::Resource::ParameterObject.new(type: "text", text: recipient_name)

      parameter_amount = WhatsappSdk::Resource::ParameterObject.new(type: "text", text: formatted_amount)
      parameter_for = WhatsappSdk::Resource::ParameterObject.new(type: "text", text: message)
      body_component = WhatsappSdk::Resource::Component.new(
        type: "body",
        parameters: [ parameter_name, parameter_amount, parameter_for ]
      )
      [ body_component ]
    end

    def send_fallback
      Rails.logger.info("[PaymentFailureNotifier] Payment failed for order #{order.number}: #{message}")
      true
    end

    def whatsapp_client
      @whatsapp_client ||= Whatsapp::Client.new(club: order.club)
    rescue StandardError => error
      Rails.logger.error("[PaymentFailureNotifier] Failed to initialize WhatsApp client for order #{order.id}: #{error.class} #{error.message}")
      nil
    end

    def whatsapp_template_id
      [
        order.club&.whatsapp_payment_failure_template_id_with_fallback,
        Settings.try(:whatsapp)&.payment_failure_template_id,
        order.club&.whatsapp_order_confirmation_template_id_with_fallback,
        Settings.try(:whatsapp)&.order_confirmation_template_id
      ].find(&:present?)
    end

    def fallback_text
      "We could not process your payment of #{formatted_amount} for order #{order.number}. #{message}"
    end

    def formatted_amount
      Money.new(payment_amount_cents).format
    rescue StandardError
      "#{payment_amount_cents} #{payment_amount_cents / 100.0}"
    end

    def payment_amount_cents
      if payment_transaction&.amount_cents
        payment_transaction.amount_cents
      else
        order.total_cents
      end
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
