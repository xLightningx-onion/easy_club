# frozen_string_literal: true

module Payments
  module Adapters
    class Payfast < Null
      def handle_webhook(params)
        Rails.logger.info("Payfast webhook: #{params.inspect}")
        true
      end
    end
  end
end
