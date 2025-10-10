# frozen_string_literal: true

module Payments
  class ReconcileJob < ApplicationJob
    queue_as :low

    def perform(payment_id)
      payment = Payment.find(payment_id)
      return if payment.status_succeeded?

      # Stub: in a real integration call provider API.
      payment.update!(status: :succeeded)
      payment.invoice.update!(status: :paid)
    end
  end
end
