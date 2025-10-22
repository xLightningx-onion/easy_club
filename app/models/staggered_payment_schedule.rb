# frozen_string_literal: true

class StaggeredPaymentSchedule < ApplicationRecord
  include TenantScoped

  enum :status, {
    active: "active",
    completed: "completed",
    cancelled: "cancelled"
  }, prefix: true

  belongs_to :club
  belongs_to :order
  belongs_to :staggered_payment_plan

  has_many :installments,
           -> { order(:position, :id) },
           class_name: "StaggeredPaymentScheduleInstallment",
           dependent: :destroy,
           inverse_of: :schedule

  validates :order, :staggered_payment_plan, :status, presence: true
  validate :ensure_order_belongs_to_club
  validate :ensure_plan_belongs_to_club
  validate :validate_installment_total

  accepts_nested_attributes_for :installments, allow_destroy: true

  scope :active, -> { where(status: :active) }

  def total_percentage
    installments.sum(&:percentage)
  end

  def total_amount
    Money.new(installments.sum(&:amount_cents), currency)
  end

  def currency
    installments.first&.amount_currency || order.total_currency
  end

  def complete_if_settled!
    return unless installments.all?(&:status_paid?)

    update!(status: :completed, completed_at: Time.current)
  end

  private

  def ensure_order_belongs_to_club
    return if order.blank?
    return if order.club_id == club_id

    errors.add(:order, "must belong to the same club")
  end

  def ensure_plan_belongs_to_club
    return if staggered_payment_plan.blank?
    return if staggered_payment_plan.club_id == club_id

    errors.add(:staggered_payment_plan, "must belong to the same club")
  end

  def validate_installment_total
    return if installments.empty?

    total = installments.sum(&:percentage)
    return if (total - 100).abs <= 0.01

    errors.add(:installments, "must total 100%")
  end
end
