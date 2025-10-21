# frozen_string_literal: true

class Cart < ApplicationRecord
  include TenantScoped

  enum :status, {
    unpaid: "unpaid",
    pending_payment: "pending_payment",
    paid: "paid",
    expired: "expired"
  }, prefix: true

  belongs_to :club
  belongs_to :user
  has_many :cart_items, dependent: :destroy
  has_many :members, through: :cart_items
  has_one :order, dependent: :nullify

  validates :status, presence: true
  validate :ensure_single_active_cart_per_user, on: :create

  scope :unpaid, -> { where(status: :unpaid) }
  scope :active, -> { unpaid }
  scope :pending_payment, -> { where(status: :pending_payment) }

  def total_cents
    cart_items.sum(:total_price_cents)
  end

  def total_currency
    cart_items.first&.total_price_currency || club.settings.dig("finance", "currency") || "ZAR"
  end

  def mark_as_paid!(paid_time)
    paid_time ||= Time.current
    return if status_paid?

    transaction do
      update!(status: :paid, checked_out_at: paid_time)

      members.distinct.compact.each do |member|
        member.update!(status: :active)
        ActiveSupport::Notifications.instrument("membership.paid", member_id: member.id, club_id: club_id)
      end

      cart_items.destroy_all
    end
  end

  private

  def ensure_single_active_cart_per_user
    return unless status_unpaid?

    existing = Cart.unpaid.where(user:, club:).where.not(id: id).exists?
    errors.add(:base, "Active cart already exists for this user and club") if existing
  end
end
