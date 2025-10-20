# frozen_string_literal: true

class MembershipQuestion < ApplicationRecord
  ANSWER_TYPES = %w[short_text long_text number date checkbox radio select].freeze
  CHOICE_ANSWER_TYPES = %w[radio select].freeze

  belongs_to :club, inverse_of: :membership_questions
  has_many :responses, class_name: "MembershipQuestionResponse", dependent: :destroy, inverse_of: :membership_question

  attribute :answer_type, :string, default: "short_text"
  attribute :required, :boolean, default: true

  validates :prompt, presence: true
  validates :answer_type, inclusion: { in: ANSWER_TYPES }
  validates :options, absence: true, unless: :choice_based?
  validate :options_presence_for_choice_based_questions

  before_validation :set_default_position, on: :create
  before_validation :normalize_options

  scope :ordered, -> { order(:position, :created_at) }

  def options_text
    Array(options).join("\n")
  end

  def options_text=(value)
    parsed = value.to_s.split(/\r?\n/).map { |line| line.strip }.reject(&:blank?)
    self.options = parsed
  end

  def options=(value)
    coerced =
      case value
      when String
        value.split(/\r?\n/).map(&:strip).reject(&:blank?)
      when Array
        value.map { |item| item.to_s.strip }.reject(&:blank?)
      when nil
        []
      else
        Array(value).map { |item| item.to_s.strip }.reject(&:blank?)
      end

    super(coerced)
  end

  def choice_based?
    CHOICE_ANSWER_TYPES.include?(answer_type)
  end

  private

  def set_default_position
    return if position.present?
    return unless club

    if club_id.present?
      self.position = (club.membership_questions.maximum(:position) || -1) + 1
    else
      existing_positions = club.membership_questions.reject { |question| question.equal?(self) }.map(&:position).compact
      self.position = existing_positions.max.to_i + 1
    end
  end

  def normalize_options
    self.options = [] unless choice_based?
  end

  def options_presence_for_choice_based_questions
    return unless choice_based?

    parsed = Array(options).map { |option| option.to_s.strip }.reject(&:blank?)
    self.options = parsed

    if parsed.length < 2
      errors.add(:options, "must include at least two choices")
    end
  end
end
