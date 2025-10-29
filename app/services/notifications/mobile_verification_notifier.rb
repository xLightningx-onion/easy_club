# frozen_string_literal: true

module Notifications
  class MobileVerificationNotifier
    attr_reader :user, :code, :club

    def initialize(user:, code:, club: nil)
      @user = user
      @code = code
      @club = club
    end

    def deliver
      channel =
        if send_via_whatsapp
          :whatsapp
        elsif send_via_sms
          :sms
        else
          :none
        end

      ActiveSupport::Notifications.instrument(
        "mobile_verification.sent",
        user_id: user.id,
        mobile_number: user.formatted_mobile_number,
        channel: channel
      )
    end

    private

    def send_via_whatsapp
      client = whatsapp_client

      return false unless client&.ready?

      recipient = whatsapp_recipient_number
      return false if recipient.blank?

      template_id = whatsapp_template_id

      if template_id.present?
        parameter_text = WhatsappSdk::Resource::ParameterObject.new(type: "text", text: code)

        text_component = WhatsappSdk::Resource::Component.new(
          type: "body",
          parameters: [ parameter_text ]
        )

        button_component = WhatsappSdk::Resource::Component.new(
          type: "button",
          index: 0,
          sub_type: "url",
          parameters: [
            WhatsappSdk::Resource::ButtonParameter.new(type: "text", text: code)
          ]
        )

        # components = [
        #   {
        #     type: "body",
        #     parameters: [
        #       { type: "text", text: code }
        #     ]
        #   },
        #   {
        #   type: "button",
        #   sub_type: "url",
        #   index: "0",
        #   parameters: [
        #       {
        #         type: "text",
        #         text: code
        #       }
        #     ]
        #   }
        # ]
        client.send_template_message_by_id(
          template_id: template_id,
          recipient_number: recipient,
          components: [ text_component, button_component ]
        )
      else
        client.send_text_message(
          recipient_number: recipient,
          message: message_body
        )
      end

      Rails.logger.info(
        "[MobileVerification] Sent WhatsApp OTP to #{recipient} using #{template_id.present? ? "template #{template_id}" : "text message"} with #{whatsapp_client_label(client)}"
      )
      true
    rescue Whatsapp::IntegrationError => error
      Rails.logger.warn("[MobileVerification] WhatsApp delivery failed: #{error.message}")
      false
    rescue StandardError => error
      Rails.logger.error("[MobileVerification] Unexpected WhatsApp error: #{error.class} #{error.message}")
      Rails.logger.debug { error.backtrace.join("\n") } if error.backtrace
      false
    end

    def send_via_sms
      if sms_callable.respond_to?(:call)
        sms_callable.call(user.formatted_mobile_number, message_body)
      else
        Rails.logger.info("[MobileVerification] Sending code #{code} to #{user.formatted_mobile_number}")
      end
      true
    rescue StandardError => error
      Rails.logger.error("[MobileVerification] SMS delivery failed: #{error.class} #{error.message}")
      Rails.logger.debug { error.backtrace.join("\n") } if error.backtrace
      false
    end

    def message_body
      I18n.t(
        "mobile_verification.message",
        code:,
        default: "Your Easyclub verification code is #{code}"
      )
    end

    def sms_callable
      Rails.configuration.respond_to?(:mobile_verification_sms_sender) &&
        Rails.configuration.mobile_verification_sms_sender
    end

    def whatsapp_client
      return @whatsapp_client if defined?(@whatsapp_client)

      @whatsapp_client = build_whatsapp_client
    end

    def whatsapp_recipient_number
     user.mobile_number.gsub(/\D/, "")
    end

    def whatsapp_template_id
      [
        club&.whatsapp_otp_template_id_with_fallback,
        Club.current&.whatsapp_otp_template_id_with_fallback,
        user_primary_club&.whatsapp_otp_template_id_with_fallback,
        default_whatsapp_template_id
      ].find(&:present?)
    end

    def default_whatsapp_template_id
      Settings.try(:whatsapp)&.otp_template_id.presence
    end

    def whatsapp_client_label(client)
      client.respond_to?(:credentials_label) ? client.credentials_label : "unknown credentials"
    end

    def build_whatsapp_client
      whatsapp_client_candidates.each do |candidate|
        client = instantiate_whatsapp_client(candidate)
        next unless client&.ready?

        return client
      rescue StandardError => error
        Rails.logger.error("[MobileVerification] Failed to initialize WhatsApp client for #{candidate_label(candidate)}: #{error.class} #{error.message}")
      end
      nil
    end

    def whatsapp_client_candidates
      @whatsapp_client_candidates ||= begin
        candidates = [ club, Club.current, user_primary_club ].compact.uniq
        candidates << :defaults
        candidates.uniq
      end
    end

    def instantiate_whatsapp_client(candidate)
      case candidate
      when :defaults
        Whatsapp::Client.new
      when Hash
        Whatsapp::Client.new(credentials: candidate)
      else
        Whatsapp::Client.new(club: candidate)
      end
    end

    def candidate_label(candidate)
      return "default WhatsApp settings" if candidate == :defaults
      return "club #{candidate.id}" if candidate.respond_to?(:id)

      candidate.to_s
    end

    def user_primary_club
      @user_primary_club ||= user.clubs.first
    end
  end
end
