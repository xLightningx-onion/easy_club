# frozen_string_literal: true

class User < ApplicationRecord
  devise :database_authenticatable, :registerable, :recoverable, :rememberable, :validatable,
         :two_factor_authenticatable,
         :two_factor_backupable, otp_number_of_backup_codes: 10

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

  validates :first_name, :last_name, :country_code, :mobile_number, presence: true
  validates :terms_agreement, acceptance: true, on: :create, unless: :skip_terms_validation?

  def requires_otp_authentication?
    otp_required_for_login?
  end

  private

  def skip_terms_validation?
    !!skip_terms_validation
  end

  def ensure_role_and_staff_defaults
    self.role = "member" if role.blank?
    self.staff = false if staff.nil?
  end
end
