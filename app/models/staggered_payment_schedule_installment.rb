# frozen_string_literal: true

class StaggeredPaymentScheduleInstallment < ApplicationRecord
  include TenantScoped

  belongs_to :club
  enum :status, {
    pending: "pending",
    scheduled: "scheduled",
    processing: "processing",
    paid: "paid",
    failed: "failed",
    cancelled: "cancelled"
  }, prefix: true

  belongs_to :schedule,
             class_name: "StaggeredPaymentSchedule",
             foreign_key: :staggered_payment_schedule_id,
             inverse_of: :installments
  belongs_to :payment_transaction, optional: true

  monetize :amount_cents, with_model_currency: :amount_currency, allow_nil: false

  validates :percentage,
            numericality: {
              greater_than: 0,
              less_than_or_equal_to: 100
            }
  validates :amount_cents,
            numericality: {
              greater_than_or_equal_to: 0
            }
  validates :amount_currency, presence: true
  validates :position,
            numericality: {
              greater_than_or_equal_to: 0,
              only_integer: true
            }
  validates :due_at, presence: true

  before_validation :default_amount_currency
  before_validation :sync_club

  delegate :order, to: :schedule

  scope :upcoming, -> { where(status: :pending).where("due_at >= ?", Time.current) }

  after_commit :enqueue_whatsapp_order_confirmation, if: :notify_whatsapp_order_confirmation?

  def mark_paid!(time = Time.current)
    update!(
      status: :paid,
      paid_at: time
    )
    schedule.complete_if_settled!
  end

  def overdue?
    status_pending? && due_at < Time.current
  end

  def due_on
    due_at&.to_date
  end

  def enqueue_whatsapp_order_confirmation
    return unless order

    SendOrderConfirmationJob.perform_later(order.id, payment_transaction_id, id)
  end
  private

  def notify_whatsapp_order_confirmation?
    saved_change_to_status? && status_paid? && order.present?
  end


  def default_amount_currency
    self.amount_currency ||= order&.total_currency || schedule&.club&.settings&.dig("finance", "currency") || "ZAR"
  end

  def sync_club
    self.club ||= schedule&.club
  end
end
