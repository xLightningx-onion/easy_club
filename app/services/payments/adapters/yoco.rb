# frozen_string_literal: true

module Payments
  module Adapters
    class Yoco < Null
      def handle_webhook(params)
        Rails.logger.info("Yoco webhook: #{params.inspect}")
        true
      end
    end
  end
end
