# frozen_string_literal: true

module Pricing
  class Vat
    DEFAULT_RATE = BigDecimal("0.15")

    def initialize(invoice:, taxable_amount_cents:)
      @invoice = invoice
      @taxable_amount_cents = taxable_amount_cents
    end

    def calculate
      (taxable_amount_cents * rate).to_i
    end

    private

    attr_reader :invoice, :taxable_amount_cents

    def rate
      (invoice.club.settings.dig("finance", "vat_rate") if invoice.club.respond_to?(:settings))
        &.to_d || DEFAULT_RATE
    rescue StandardError
      DEFAULT_RATE
    end
  end
end
