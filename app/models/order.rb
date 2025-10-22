# frozen_string_literal: true

class Order < ApplicationRecord
  include TenantScoped

  enum :status, {
    draft: "draft",
    pending_payment: "pending_payment",
    paid: "paid",
    cancelled: "cancelled"
  }, prefix: true

  belongs_to :club
  belongs_to :user
  belongs_to :cart, optional: true
  belongs_to :payment_method, optional: true
  belongs_to :staggered_payment_plan, optional: true

  has_many :order_items, dependent: :destroy
  has_many :payment_transactions, dependent: :destroy
  has_many :members, through: :order_items
  has_one :staggered_payment_schedule, dependent: :destroy

  validates :number, presence: true, uniqueness: true
  validates :status, presence: true
  validates :total_cents, :subtotal_cents, :discount_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :total_currency, :subtotal_currency, :discount_currency, presence: true
  validates :payment_mode, presence: true
  validate :ensure_related_records_match_club
  validate :validate_payment_mode_consistency

  before_validation :assign_number, on: :create

  scope :recent, -> { order(created_at: :desc) }

  enum :payment_mode, {
    full: "full",
    staggered: "staggered"
  }, prefix: true

  def mark_paid!(paid_time)
    paid_time ||= Time.current
    transaction do
      update!(status: :paid, paid_at: paid_time)
      cart&.mark_as_paid!(paid_time)
    end
  end

  private

  def assign_number
    return if number.present?

    self.number = "ORD-#{Time.current.utc.strftime("%Y%m%d")}-#{SecureRandom.hex(3).upcase}"
  end

  def ensure_related_records_match_club
    if cart_id.present? && cart&.club_id != club_id
      errors.add(:cart, "must belong to the same club as the order")
    end

    if payment_method_id.present? && payment_method&.club_id != club_id
      errors.add(:payment_method, "must belong to the same club as the order")
    end

    if staggered_payment_plan_id.present? && staggered_payment_plan&.club_id != club_id
      errors.add(:staggered_payment_plan, "must belong to the same club as the order")
    end
  end

  def validate_payment_mode_consistency
    if payment_mode_full? && staggered_payment_plan.present?
      errors.add(:staggered_payment_plan, "must be blank when paying in full")
    elsif payment_mode_staggered? && staggered_payment_plan.nil?
      errors.add(:staggered_payment_plan, "must be selected for staggered payments")
    end
  end
end
