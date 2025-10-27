# frozen_string_literal: true

module Notifications
  class MobileVerificationNotifier
    attr_reader :user, :code

    def initialize(user:, code:)
      @user = user
      @code = code
    end

    def deliver
      ActiveSupport::Notifications.instrument(
        "mobile_verification.sent",
        user_id: user.id,
        mobile_number: user.formatted_mobile_number
      )

      if sms_callable.respond_to?(:call)
        sms_callable.call(user.formatted_mobile_number, message_body)
      else
        Rails.logger.info("[MobileVerification] Sending code #{code} to #{user.formatted_mobile_number}")
      end
    end

    private

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
  end
end

