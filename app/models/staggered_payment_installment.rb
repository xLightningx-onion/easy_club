# frozen_string_literal: true

class StaggeredPaymentInstallment < ApplicationRecord
  belongs_to :plan,
             class_name: "StaggeredPaymentPlan",
             foreign_key: :staggered_payment_plan_id,
             inverse_of: :installments

  monetize :amount_cents, allow_nil: true, with_currency: :amount_currency

  delegate :club, to: :plan

  validates :percentage,
            numericality: {
              greater_than: 0,
              less_than_or_equal_to: 100
            }
  validates :position,
            numericality: {
              greater_than_or_equal_to: 0,
              only_integer: true
            }
  validates :amount_currency, presence: true
  validates :due_on, presence: true

  before_validation :ensure_amount_currency
  before_validation :assign_position, on: :create
  before_validation :normalize_due_on
  before_validation :assign_default_due_on, on: :create

  private

  def ensure_amount_currency
    self.amount_currency ||= club&.settings&.dig("finance", "currency") || "ZAR"
  end

  def assign_position
    return if position.present?

    max_position = plan&.installments&.maximum(:position)
    self.position = max_position.to_i + 1
  end

  def normalize_due_on
    return if due_on.blank? || due_on.is_a?(Date)

    parsed = begin
      Date.parse(due_on.to_s)
    rescue ArgumentError
      nil
    end

    self.due_on = parsed
  end

  def assign_default_due_on
    return if due_on.present?

    existing_due_dates = plan&.installments&.reject { |inst| inst.equal?(self) || inst.marked_for_destruction? }&.map(&:due_on)&.compact
    base_date = existing_due_dates&.max || plan&.starts_on || Date.current
    offset = existing_due_dates&.any? ? 28.days : 0.days

    self.due_on = (base_date + offset).to_date
  end
end
