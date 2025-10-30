# frozen_string_literal: true

require "digest"

class User < ApplicationRecord
  MOBILE_VERIFICATION_CODE_LENGTH = 6
  MOBILE_VERIFICATION_CODE_TTL = 10.minutes

  devise :database_authenticatable, :registerable, :recoverable, :rememberable, :validatable,
         :two_factor_authenticatable,
         :two_factor_backupable,
         :omniauthable, omniauth_providers: [ :google_oauth2 ], otp_number_of_backup_codes: 10


  attr_accessor :terms_agreement, :skip_terms_validation

  before_validation :ensure_role_and_staff_defaults, on: :create

  has_many :club_roles, dependent: :destroy
  has_many :clubs, through: :club_roles
  has_many :members
  has_many :guardianships, foreign_key: :guardian_id, dependent: :destroy
  has_many :guarded_members, through: :guardianships, source: :member
  has_many :wallets, dependent: :destroy
  has_many :carts, dependent: :destroy
  has_many :orders, dependent: :restrict_with_exception
  has_many :payment_transactions, through: :orders
  has_many :payment_methods, dependent: :destroy

  enum :role, {
    member: "member",
    coach: "coach",
    manager: "manager",
    finance: "finance",
    admin: "admin"
  }, prefix: true

  # serialize :otp_backup_codes, Array

  validates :first_name, :last_name, presence: true
  validates :country_code, :mobile_number, presence: true, unless: -> { omniauth_profile? || Rails.env.development? }
  validates :terms_agreement, acceptance: true, on: :create, unless: :skip_terms_validation?

  def self.from_omniauth(auth)
    user = find_by(provider: auth.provider, uid: auth.uid) || find_by(email: auth.info.email)
    user ||= new

    user.provider = auth.provider
    user.uid = auth.uid
    user.skip_terms_validation = true
    user.terms_agreement = true

    user.assign_attributes(
      email: auth.info.email,
      first_name: auth.info.first_name.presence || auth.info.name.to_s.split.first,
      last_name: auth.info.last_name.presence || auth.info.name.to_s.split.drop(1).join(" "),
      oauth_data: auth.to_h
    )

    assign_phone_number_from_oauth(user, auth) if user.mobile_number.blank?

    user.password = Devise.friendly_token[0, 64] if user.encrypted_password.blank?

    user.save!
    user
  end

  def requires_otp_authentication?
    otp_required_for_login?
  end

  def mobile_details_missing?
    country_code.blank? || mobile_number.blank?
  end

  def mobile_verified?
    mobile_verified_at.present?
  end

  def initiate_mobile_verification!
    raise ArgumentError, "country_code and mobile_number are required" if mobile_details_missing?

    verification_code = generate_mobile_verification_code
    timestamp = Time.current
    update!(
      mobile_verification_code_digest: digest_for_code(verification_code, timestamp),
      mobile_verification_sent_at: timestamp,
      mobile_verified_at: nil
    )

    SendMobileVerificationJob.perform_later(id, verification_code)
    verification_code
  end

  def verify_mobile_code(submitted_code)
    return false if submitted_code.blank?
    return false if mobile_verification_code_digest.blank?
    return false if mobile_verification_sent_at.blank?
    return false if mobile_verification_sent_at.present? && mobile_verification_expired?

    if secure_compare_code(submitted_code)
      update!(
        mobile_verified_at: Time.current,
        mobile_verification_code_digest: nil,
        mobile_verification_sent_at: nil
      )
      true
    else
      false
    end
  end

  def mobile_verification_expired?
    return true if mobile_verification_sent_at.blank?

    mobile_verification_sent_at < MOBILE_VERIFICATION_CODE_TTL.ago
  end

  def formatted_mobile_number
    mobile_number.strip
  end

  private

  def skip_terms_validation?
    !!skip_terms_validation
  end

  def ensure_role_and_staff_defaults
    self.role = "member" if role.blank?
    self.staff = false if staff.nil?
  end

  def omniauth_profile?
    provider.present? && uid.present?
  end

  private_class_method def self.assign_phone_number_from_oauth(user, auth)
    phone_number = auth.info&.phone ||
                   auth.info&.phone_number ||
                   auth.extra&.raw_info&.[]("phone_number") ||
                   auth.extra&.raw_info&.[]("phoneNumber")

    return if phone_number.blank?

    normalized = phone_number.to_s.gsub(/\s+/, "")

    if (match = normalized.match(/\A\+(\d{1,3})(\d+)\z/))
      user.country_code = "+#{match[1]}"
      user.mobile_number = match[2]
    else
      user.mobile_number = normalized
      user.country_code ||= "+27"
    end
  end

  private

  def generate_mobile_verification_code
    Array.new(MOBILE_VERIFICATION_CODE_LENGTH) { rand(0..9) }.join
  end

  def secure_compare_code(code)
    expected = mobile_verification_code_digest
    actual_digest = digest_for_code(code, mobile_verification_sent_at)
    ActiveSupport::SecurityUtils.secure_compare(expected, actual_digest)
  rescue StandardError
    false
  end

  def digest_for_code(code, timestamp)
    ts = timestamp&.to_i || Time.current.to_i
    Digest::SHA256.hexdigest("--#{code}--#{id}--#{ts}--")
  end
end
