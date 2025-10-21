# frozen_string_literal: true

class ClubTerm < ApplicationRecord
  include TenantScoped
  include TenantScoped

  belongs_to :club
  has_many :acceptances, class_name: "ClubTermAcceptance", dependent: :destroy

  scope :active, -> { where(active: true) }

  validates :title, presence: true
  validates :body, presence: true
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  before_validation :assign_position, on: :create

  private

  def assign_position
    return if position.present?

    max_position = club&.club_terms&.maximum(:position)
    self.position = max_position.to_i + 1
  end
end
