# frozen_string_literal: true

module Pricing
  Result = Struct.new(:subtotal_cents, :discount_cents, :vat_cents, :total_cents, keyword_init: true)

  def self.price(invoice:)
    subtotal = invoice.invoice_items.sum(:amount_cents)
    context = {
      invoice: invoice,
      subtotal_cents: subtotal,
      discount_cents: 0,
      adjustments: []
    }

    rules.each { |rule| rule.apply(context) }

    taxable_amount = subtotal - context[:discount_cents]
    vat_total = Vat.new(invoice: invoice, taxable_amount_cents: taxable_amount).calculate
    total = taxable_amount + vat_total

    Result.new(
      subtotal_cents: subtotal,
      discount_cents: context[:discount_cents],
      vat_cents: vat_total,
      total_cents: total
    )
  end

  def self.rules
    [
      Pricing::Rules::Scholarship,
      Pricing::Rules::EarlyBird,
      Pricing::Rules::FamilyPercent,
      Pricing::Rules::SiblingCap,
      Pricing::Rules::Voucher
    ]
  end
  private_class_method :rules
end
