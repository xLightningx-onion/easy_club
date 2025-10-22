# frozen_string_literal: true

class StaggeredPaymentPlan < ApplicationRecord
  include TenantScoped

  belongs_to :club
  has_many :installments,
           -> { order(:position, :id) },
           class_name: "StaggeredPaymentInstallment",
           dependent: :destroy,
           inverse_of: :plan
  has_many :payment_schedules,
           class_name: "StaggeredPaymentSchedule",
           dependent: :restrict_with_exception,
           inverse_of: :staggered_payment_plan

  accepts_nested_attributes_for :installments,
                                allow_destroy: true,
                                reject_if: :reject_installment?

  validates :name, presence: true, uniqueness: { scope: :club_id }
  validates :active, inclusion: { in: [ true, false ] }
  validate :validate_schedule_dates
  validate :validate_installments_presence
  validate :validate_percentage_total
  validate :validate_installment_dates

  scope :active, -> { where(active: true) }

  def total_percentage
    installments.reject(&:marked_for_destruction?).sum { |inst| inst.percentage.to_f }
  end

  def ordered_installments
    installments.to_a.sort_by do |inst|
      [
        inst.due_on || Date.new(1900, 1, 1),
        inst.position || 0,
        inst.created_at || Time.current
      ]
    end
  end

  private

  def validate_schedule_dates
    return if starts_on.blank? && ends_on.blank?

    if starts_on.present? && ends_on.present? && ends_on < starts_on
      errors.add(:ends_on, "must be on or after the start date")
    end
  end

  def validate_installments_presence
    if installments.reject(&:marked_for_destruction?).empty?
      errors.add(:base, "Add at least one installment")
    end
  end

  def validate_percentage_total
    relevant = installments.reject(&:marked_for_destruction?)
    return if relevant.empty?

    total = relevant.sum { |inst| inst.percentage.to_f }
    if total <= 0 || (total - 100).abs > 0.01
      errors.add(:base, "Installments must total 100%")
    end
  end

  def validate_installment_dates
    relevant = installments.reject(&:marked_for_destruction?)
    return if relevant.empty?

    relevant.each do |installment|
      next if installment.due_on.blank?

      if starts_on.present? && installment.due_on < starts_on
        errors.add(:base, "Installment due dates must be on or after the plan start date")
        break
      end
    end
  end

  def reject_installment?(attributes)
    percentage = attributes["percentage"]
    due_on = attributes["due_on"]
    percentage.to_s.strip.blank? && due_on.to_s.strip.blank?
  end
end
