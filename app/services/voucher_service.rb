# frozen_string_literal: true

class VoucherService
  def self.redeem(invoice:, code:)
    new(invoice: invoice, code: code).redeem
  end

  def initialize(invoice:, code:)
    @invoice = invoice
    @code = code
  end

  def redeem
    voucher = find_voucher
    return Payments::Result.new(success: false, error: "Invalid voucher") unless voucher
    return Payments::Result.new(success: false, error: "Voucher expired") if voucher.expires_at&.< Time.current
    return Payments::Result.new(success: false, error: "Voucher depleted") if voucher.balance_cents <= 0

    amount = [invoice.total_cents, voucher.balance_cents].min

    Voucher.transaction do
      voucher.update!(balance_cents: voucher.balance_cents - amount)
      payment = invoice.payments.create!(
        club: invoice.club,
        provider: "voucher",
        method: "voucher",
        status: "succeeded",
        amount_cents: amount,
        amount_currency: invoice.total_currency,
        provider_ref: voucher.code
      )
      invoice.update!(status: "paid") if amount >= invoice.total_cents
      Payments::Result.new(success: true, payment: payment)
    end
  rescue StandardError => e
    Payments::Result.new(success: false, error: e.message)
  end

  private

  attr_reader :invoice, :code

  def find_voucher
    invoice.club.vouchers.find_by(code: code)
  end
end
