# frozen_string_literal: true

module Payments
  Result = Struct.new(:success, :error, :payment, keyword_init: true) do
    def success?
      success
    end
  end

  class Processor
    def initialize(club:)
      @club = club
      @adapter = adapter_for(club)
    end

    def pay(invoice:, method:, source_token: nil, voucher_code: nil)
      case method
      when "card", "instant_eft"
        adapter.charge(invoice: invoice, method: method, source_token: source_token)
      when "voucher"
        VoucherService.redeem(invoice: invoice, code: voucher_code)
      when "wallet"
        WalletService.spend(invoice: invoice)
      else
        Result.new(success: false, error: "Unsupported payment method")
      end
    end

    def handle_webhook(params)
      adapter.handle_webhook(params)
    end

    private

    attr_reader :adapter

    def adapter_for(club)
      provider = club.settings.dig("payments", "provider") rescue nil

      case provider
      when "payfast"
        Payments::Adapters::Payfast.new(club: club)
      when "yoco"
        Payments::Adapters::Yoco.new(club: club)
      when "stripe"
        Payments::Adapters::Stripe.new(club: club)
      else
        Payments::Adapters::Null.new(club: club)
      end
    end
  end
end
