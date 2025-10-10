# frozen_string_literal: true

module Payments
  module Adapters
    class Null
      def initialize(club:)
        @club = club
      end

      def charge(invoice:, method:, source_token: nil)
        payment = invoice.payments.create!(
          club: invoice.club,
          provider: "mock",
          method: method,
          status: "succeeded",
          amount_cents: invoice.total_cents,
          amount_currency: invoice.total_currency,
          provider_ref: SecureRandom.uuid,
          raw: { source_token: source_token }
        )
        invoice.update!(status: "paid")
        Payments::Result.new(success: true, payment: payment)
      end

      def handle_webhook(_params)
        true
      end
    end
  end
end
