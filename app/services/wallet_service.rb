# frozen_string_literal: true

class WalletService
  def self.spend(invoice:)
    new(invoice: invoice).spend
  end

  def initialize(invoice:)
    @invoice = invoice
  end

  def spend
    wallet = find_wallet
    return Payments::Result.new(success: false, error: "Wallet not found") unless wallet
    return Payments::Result.new(success: false, error: "Insufficient balance") if wallet.balance_cents < invoice.total_cents

    Wallet.transaction do
      wallet.update!(balance_cents: wallet.balance_cents - invoice.total_cents)
      entry = wallet.wallet_entries.create!(
        club: invoice.club,
        entry_type: "spend",
        amount_cents: invoice.total_cents,
        amount_currency: invoice.total_currency,
        payment: nil,
        meta: { invoice_id: invoice.id }
      )

      payment = invoice.payments.create!(
        club: invoice.club,
        provider: "wallet",
        method: "wallet",
        status: "succeeded",
        amount_cents: invoice.total_cents,
        amount_currency: invoice.total_currency,
        provider_ref: entry.id
      )

      invoice.update!(status: "paid")
      Payments::Result.new(success: true, payment: payment)
    end
  rescue StandardError => e
    Payments::Result.new(success: false, error: e.message)
  end

  private

  attr_reader :invoice

  def find_wallet
    owner = invoice.family_account || invoice.member.user
    return unless owner

    invoice.club.wallets.find_by(user: owner)
  end
end
