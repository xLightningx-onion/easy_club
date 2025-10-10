# frozen_string_literal: true

module Dunning
  class AttemptJob < ApplicationJob
    queue_as :default

    def perform(invoice_id)
      invoice = Invoice.find(invoice_id)
      attempt = invoice.dunning_attempts.create!(club: invoice.club, status: :scheduled, run_at: Time.current)

      result = Payments::Processor.new(club: invoice.club).pay(invoice: invoice, method: "card", source_token: "retry")

      attempt.update!(status: result.success? ? :succeeded : :failed, reason: result.error)
    end
  end
end
