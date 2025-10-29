# frozen_string_literal: true

class SendOrderConfirmationJob < ApplicationJob
  queue_as :default

  def perform(order_id, payment_transaction_id = nil, installment_id = nil)
    order = Order.includes(:club, :user, :staggered_payment_schedule).find_by(id: order_id)
    return unless order&.user

    payment_transaction = resolve_payment_transaction(order, payment_transaction_id, installment_id)
    installment = resolve_installment(order, installment_id)

    Notifications::OrderConfirmationNotifier.new(
      order:,
      payment_transaction:,
      installment:
    ).deliver
  end

  private

  def resolve_payment_transaction(order, payment_transaction_id, installment_id)
    return PaymentTransaction.find_by(id: payment_transaction_id) if payment_transaction_id

    if installment_id
      installment = order_installment(order, installment_id)
      return installment.payment_transaction if installment&.payment_transaction_id.present?
    end

    order.payment_transactions.status_succeeded.order(processed_at: :desc, updated_at: :desc, created_at: :desc).first
  end

  def resolve_installment(order, installment_id)
    order_installment(order, installment_id)
  end

  def order_installment(order, installment_id)
    return nil unless installment_id

    schedule = order.staggered_payment_schedule || StaggeredPaymentSchedule.find_by(order:)
    inst = schedule&.installments&.find { |candidate| candidate.id == installment_id }
    inst ||= StaggeredPaymentScheduleInstallment.find_by(id: installment_id)
    inst if inst&.order == order
  end
end
