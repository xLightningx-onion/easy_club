# frozen_string_literal: true

class SendPaymentFailedJob < ApplicationJob
  queue_as :default

  def perform(order_id, message: nil, payment_transaction_id: nil)
    order = Order.includes(:club, :user, :staggered_payment_schedule).find_by(id: order_id)
    return unless order&.user

    payment_transaction = resolve_payment_transaction(order, payment_transaction_id)

    Notifications::PaymentFailureNotifier.new(order: order, payment_transaction: payment_transaction, message: message).deliver
  end

  private

  def resolve_payment_transaction(order, payment_transaction_id)
    return PaymentTransaction.find_by(id: payment_transaction_id) if payment_transaction_id

    order.payment_transactions.status_failed.order(processed_at: :asc, updated_at: :desc, created_at: :desc).last
  end
end
