# frozen_string_literal: true

class PaymentTransaction < ApplicationRecord
  belongs_to :order
  belongs_to :payment_method, optional: true

  enum :status, {
    initialized: "initialized",
    pending: "pending",
    succeeded: "succeeded",
    failed: "failed",
    cancelled: "cancelled"
  }, prefix: true

  validates :gateway, presence: true
  validates :status, presence: true
  validates :amount_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :amount_currency, presence: true

  validate :ensure_payment_method_matches_order

  scope :recent, -> { order(created_at: :desc) }

  private

  def ensure_payment_method_matches_order
    return unless payment_method

    errors.add(:payment_method, "must match order club") if payment_method.club_id != order.club_id
    errors.add(:payment_method, "must belong to order user") if payment_method.user_id != order.user_id
  end
end
