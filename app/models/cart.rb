# frozen_string_literal: true

class Cart < ApplicationRecord
  include TenantScoped

  enum :status, {
    unpaid: "unpaid",
    pending_payment: "pending_payment",
    partially_paid: "partially_paid",
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
  scope :partially_paid, -> { where(status: :partially_paid) }

  def total_cents
    cart_items.sum(:total_price_cents)
  end

  def total_currency
    cart_items.first&.total_price_currency || club.settings.dig("finance", "currency") || "ZAR"
  end

  def full_total_money
    Money.new(total_cents, total_currency)
  end

  def base_price_total(cart_items: nil)
    items = prepare_pricing_items(cart_items)
    return nil if items.blank?

    base_totals = items.map { |item| base_price_for_item(item) }.compact

    return nil if base_totals.blank?

    currency_code = base_totals.first.currency.iso_code
    Money.new(base_totals.sum(&:cents), currency_code)
  end

  def display_total_for_mode(mode: payment_mode, cart_items: nil)
    selected_mode = (mode.presence || payment_mode || "full").to_s
    full_total = full_total_money
    return full_total unless selected_mode == "staggered"

    base_total = base_price_total(cart_items:)
    base_total || full_total
  end

  def total_due_money
    if order&.total_cents
      Money.new(order.total_cents, order.total_currency)
    else
      display_total_for_mode(mode: payment_mode, cart_items: cart_items)
    end
  end

  def staggered_schedule
    order&.staggered_payment_schedule
  end

  def amount_paid_so_far
    schedule = staggered_schedule
    currency_code = schedule&.currency.presence || total_due_money.currency.iso_code
    return Money.new(0, currency_code) unless schedule

    cents = schedule.installments.select(&:status_paid?).sum(&:amount_cents)
    Money.new(cents, currency_code)
  end

  def next_installment
    schedule = staggered_schedule
    return nil unless schedule

    schedule.installments.order(:position, :id).detect do |installment|
      !installment.status_paid? && !installment.status_cancelled?
    end
  end

  def outstanding_balance
    balance = total_due_money - amount_paid_so_far
    balance.cents.positive? ? balance : Money.new(0, balance.currency.iso_code)
  end

  def mark_as_paid!(paid_time)
    paid_time ||= Time.current
    return if status_paid?

    transaction do
      update!(
        status: :paid,
        checked_out_at: paid_time
      )

      members.distinct.compact.each do |member|
        member.update!(status: :active)
        ActiveSupport::Notifications.instrument("membership.paid", member_id: member.id, club_id: club_id)
      end

      cart_items.destroy_all
    end
  end

  def mark_as_partially_paid!(checkout_time = Time.current)
    checkout_time ||= Time.current
    return if status_paid?

    transaction do
      update!(
        status: :partially_paid,
        checked_out_at: checkout_time
      )

      members.distinct.compact.each do |member|
        member.update!(status: :partially_paid)
      end
    end
  end

  alias_method :mark_as_pending_payment!, :mark_as_partially_paid!

  private

  def prepare_pricing_items(items = nil)
    if items
      Array.wrap(items)
    else
      association = self.cart_items.includes(member: :membership_type)
      association.to_a
    end
  end

  def base_price_for_item(item)
    membership_type = item.member&.membership_type
    quantity = item.quantity.to_i.nonzero? || 1

    if membership_type&.base_price
      membership_type.base_price * quantity
    else
      Money.new(item.total_price_cents, item.total_price_currency)
    end
  end

  public :base_price_for_item

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
