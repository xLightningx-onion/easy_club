# frozen_string_literal: true

class MedicalQuestion < ApplicationRecord
  include TenantScoped

  belongs_to :club

  validates :prompt, presence: true
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true

  scope :active, -> { where(active: true) }

  before_validation :set_position, on: :create

  enum :question_type, {
    short_text: "short_text",
    long_text: "long_text",
    boolean: "boolean"
  }

  private

  def set_position
    return if position.present?
    max_position = club&.medical_questions&.maximum(:position)
    self.position = max_position.to_i + 1
  end
end
