# frozen_string_literal: true

class MembershipTypePriceTier < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :membership_type, inverse_of: :price_tiers

  monetize :amount_cents, allow_nil: false, numericality: { greater_than_or_equal_to: 0 }

  validates :label, presence: true
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :starts_on, :ends_on, presence: true
  validate :ends_on_not_before_start

  before_validation :ensure_club_id
  before_validation :assign_default_position, on: :create

  private

  def ensure_club_id
    self.club_id ||= membership_type&.club_id
  end

  def assign_default_position
    return if position.present? || membership_type.blank?

    max_position = membership_type.price_tiers.maximum(:position)
    self.position = max_position.to_i + 1
  end

  def ends_on_not_before_start
    return if starts_on.blank? || ends_on.blank?
    return if ends_on >= starts_on

    errors.add(:ends_on, "must be on or after the start date")
  end
end
