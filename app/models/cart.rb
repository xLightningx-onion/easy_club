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
  belongs_to :staggered_payment_plan, optional: true

  enum :payment_mode, {
    full: "full",
    staggered: "staggered"
  }, prefix: true

  validates :status, presence: true
  validates :payment_mode, presence: true
  validate :validate_payment_plan_belongs_to_club
  validate :validate_payment_mode_consistency
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
      update!(
        status: :paid,
        checked_out_at: paid_time,
        payment_mode: :full,
        staggered_payment_plan_id: nil
      )

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

  def validate_payment_plan_belongs_to_club
    return unless staggered_payment_plan_id.present?
    return if staggered_payment_plan&.club_id == club_id

    errors.add(:staggered_payment_plan, "must belong to the same club")
  end

  def validate_payment_mode_consistency
    if payment_mode_full? && staggered_payment_plan.present?
      errors.add(:staggered_payment_plan, "must be blank when paying in full")
    elsif payment_mode_staggered? && staggered_payment_plan.nil?
      errors.add(:staggered_payment_plan, "must be selected for staggered payments")
    end
  end
end
