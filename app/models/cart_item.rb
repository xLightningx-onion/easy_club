# frozen_string_literal: true

class CartItem < ApplicationRecord
  belongs_to :cart
  belongs_to :member
  belongs_to :plan
  delegate :club, to: :cart

  validates :quantity, numericality: { greater_than: 0 }
  validates :unit_price_cents, :total_price_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :unit_price_currency, :total_price_currency, presence: true
  validate :ensure_member_belongs_to_cart_club
  validate :ensure_plan_belongs_to_cart_club

  before_validation :sync_pricing, if: :plan_changed?
  before_validation :sync_total_from_quantity_and_unit

  private

  def ensure_member_belongs_to_cart_club
    return if member&.club_id == cart&.club_id

    errors.add(:member, "must belong to the same club as the cart")
  end

  def ensure_plan_belongs_to_cart_club
    return if plan&.club_id == cart&.club_id

    errors.add(:plan, "must belong to the same club as the cart")
  end

  def sync_pricing
    product = plan&.product
    return unless product
    self.unit_price_cents = product.price_cents
    self.unit_price_currency = product.price_currency
  end

  def sync_total_from_quantity_and_unit
    return unless unit_price_cents && quantity

    self.total_price_cents = unit_price_cents * quantity
    self.total_price_currency = unit_price_currency.presence || plan&.product&.price_currency || "ZAR"
  end

  def plan_changed?
    plan.present? && (new_record? || will_save_change_to_plan_id?)
  end
end
