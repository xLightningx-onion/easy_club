# frozen_string_literal: true

class MobilePasswordResetVerificationForm
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :code, :string

  validates :code, presence: true
  validate :ensure_code_digits

  def sanitized_code
    digits = code.to_s.gsub(/\D+/, "")
    digits[0, User::MOBILE_VERIFICATION_CODE_LENGTH]
  end

  private

  def ensure_code_digits
    digits = code.to_s.gsub(/\D+/, "")
    if digits.blank?
      errors.add(:code, "can't be blank")
    elsif digits.length < User::MOBILE_VERIFICATION_CODE_LENGTH
      errors.add(:code, "must be #{User::MOBILE_VERIFICATION_CODE_LENGTH} digits")
    end
  end
end

