# frozen_string_literal: true

class MembershipType < ApplicationRecord
  include TenantScoped

  GENDER_OPTIONS = {
    male: "male",
    female: "female",
    unisex: "unisex"
  }.freeze

  belongs_to :club
  has_many :price_tiers,
           -> { order(:position, :created_at) },
           class_name: "MembershipTypePriceTier",
           dependent: :destroy,
           inverse_of: :membership_type

  enum :gender, GENDER_OPTIONS

  monetize :base_price_cents, allow_nil: false, numericality: { greater_than_or_equal_to: 0 }

  after_initialize :set_default_gender, if: :new_record?

  validates :label, presence: true, uniqueness: { scope: :club_id }
  validates :min_age_years, :max_age_years, presence: true
  validates :min_age_years, :max_age_years,
            numericality: { greater_than_or_equal_to: 0, only_integer: true }
  validates :min_age_years, comparison: { less_than_or_equal_to: :max_age_years }

  private

  def set_default_gender
    self.gender ||= GENDER_OPTIONS[:unisex]
  end
end
