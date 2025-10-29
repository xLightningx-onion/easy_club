# frozen_string_literal: true

class ClubDefaultPriceTier < ApplicationRecord
  include TenantScoped

  belongs_to :club

  validates :label, :starts_on, :ends_on, presence: true
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :ends_on_not_before_start

  before_validation :assign_default_position, on: :create

  scope :ordered, -> { order(:position, :starts_on, :created_at) }

  private

  def assign_default_position
    return if position.present?

    max_position = club&.default_price_tiers&.maximum(:position)
    self.position = max_position.to_i + 1
  end

  def ends_on_not_before_start
    return if starts_on.blank? || ends_on.blank?
    return if ends_on >= starts_on

    errors.add(:ends_on, "must be on or after the start date")
  end
end
