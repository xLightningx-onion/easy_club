# frozen_string_literal: true

class MobilePasswordResetRequestForm
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :country_code, :string, default: "+27"
  attribute :mobile_number, :string

  validates :country_code, presence: true
  validates :mobile_number, presence: true
  validate :ensure_country_code_format
  validate :ensure_mobile_number_digits

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

  def formatted_number
    "#{normalized_country_code} #{normalized_mobile_number}"
  end

  private

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

