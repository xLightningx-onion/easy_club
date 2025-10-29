# frozen_string_literal: true

class MobileVerificationForm
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :country_code, :string
  attribute :mobile_number, :string

  attr_reader :user

  validates :country_code, presence: true
  validates :mobile_number, presence: true
  validate :ensure_country_code_format
  validate :ensure_mobile_number_digits

  def initialize(user:, attributes: {})
    @user = user
    defaults = {
      country_code: user.country_code.presence || "+27",
      mobile_number: user.mobile_number
    }
    super(defaults.merge(attributes || {}))
  end

  def submit(params)
    assign_attributes(params)

    return false unless valid?

    user.assign_attributes(
      country_code: normalized_country_code,
      mobile_number: normalized_mobile_number
    )

    if user.changed?
      user.mobile_verified_at = nil
      if user.save
        true
      else
        user.errors.each do |error|
          errors.add(error.attribute, error.message)
        end
        false
      end
    else
      true
    end
  end

  private

  def normalized_country_code
    digits = country_code.to_s.gsub(/\D+/, "")
    digits = "27" if digits.blank?
    "+#{digits}"
  end

  def normalized_mobile_number
    digits = mobile_number.to_s.gsub(/\D+/, "")
    digits = digits.sub(/\A0+/, "")
    digits
  end

  def ensure_country_code_format
    digits = country_code.to_s.gsub(/\D+/, "")
    if digits.blank?
      errors.add(:country_code, "is not valid")
    elsif digits.length > 4
      errors.add(:country_code, "must be a valid international dialling code")
    end
  end

  def ensure_mobile_number_digits
    digits = mobile_number.to_s.gsub(/\D+/, "")
    digits = digits.sub(/\A0+/, "")

    if digits.blank?
      errors.add(:mobile_number, "can't be blank")
    elsif digits.length < 5
      errors.add(:mobile_number, "must be at least 5 digits")
    end
  end
end
