# frozen_string_literal: true

class OrderItem < ApplicationRecord
  belongs_to :order
  belongs_to :member
  belongs_to :plan
  belongs_to :product, optional: true

  delegate :club, to: :order

  validates :quantity, numericality: { greater_than: 0 }
  validates :unit_price_cents, :total_price_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :unit_price_currency, :total_price_currency, presence: true
  validate :ensure_member_belongs_to_order_club
  validate :ensure_plan_belongs_to_order_club

  before_validation :ensure_product_set
  before_validation :sync_pricing, if: :plan_changed?
  before_validation :calculate_totals

  private

  def ensure_member_belongs_to_order_club
    return if member&.club_id == order&.club_id

    errors.add(:member, "must belong to the same club as the order")
  end

  def ensure_plan_belongs_to_order_club
    return if plan&.club_id == order&.club_id

    errors.add(:plan, "must belong to the same club as the order")
  end

  def ensure_product_set
    self.product ||= plan&.product
  end

  def sync_pricing
    product = plan.product
    self.unit_price_cents = product.price_cents
    self.unit_price_currency = product.price_currency
  end

  def calculate_totals
    return unless unit_price_cents && quantity

    self.total_price_cents = unit_price_cents * quantity
    self.total_price_currency = unit_price_currency.presence || product&.price_currency || "ZAR"
  end

  def plan_changed?
    plan.present? && (new_record? || will_save_change_to_plan_id?)
  end
end
