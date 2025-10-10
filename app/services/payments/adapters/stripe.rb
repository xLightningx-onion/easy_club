# frozen_string_literal: true

module Payments
  module Adapters
    class Stripe < Null
      def handle_webhook(params)
        Rails.logger.info("Stripe webhook: #{params.inspect}")
        true
      end
    end
  end
end
