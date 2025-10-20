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

  has_many :order_items, dependent: :destroy
  has_many :payment_transactions, dependent: :destroy
  has_many :members, through: :order_items

  validates :number, presence: true, uniqueness: true
  validates :status, presence: true
  validates :total_cents, :subtotal_cents, :discount_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :total_currency, :subtotal_currency, :discount_currency, presence: true
  validate :ensure_related_records_match_club

  before_validation :assign_number, on: :create

  scope :recent, -> { order(created_at: :desc) }

  def mark_paid!(paid_time: Time.current)
    update!(status: :paid, paid_at: paid_time)
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
  end
end
