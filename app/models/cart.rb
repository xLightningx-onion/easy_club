# frozen_string_literal: true

class Cart < ApplicationRecord
  include TenantScoped

  enum :status, {
    active: "active",
    checked_out: "checked_out",
    expired: "expired"
  }, prefix: true

  belongs_to :club
  belongs_to :user
  has_many :cart_items, dependent: :destroy
  has_many :members, through: :cart_items
  has_one :order, dependent: :nullify

  validates :status, presence: true
  validate :ensure_single_active_cart_per_user, on: :create

  scope :active, -> { where(status: :active) }

  def total_cents
    cart_items.sum(:total_price_cents)
  end

  def total_currency
    cart_items.first&.total_price_currency || club.settings.dig("finance", "currency") || "ZAR"
  end

  private

  def ensure_single_active_cart_per_user
    return unless status_active?

    existing = Cart.active.where(user:, club:).where.not(id: id).exists?
    errors.add(:base, "Active cart already exists for this user and club") if existing
  end
end
