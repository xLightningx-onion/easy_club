# frozen_string_literal: true

class MembershipRegistrationForm
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :club_id, :uuid
  attribute :plan_id, :uuid
  attribute :first_name, :string
  attribute :last_name, :string
  attribute :gender, :string
  attribute :nationality, :string
  attribute :date_of_birth, :date
  attribute :id_number, :string
  attribute :email, :string
  attribute :mobile_country_code, :string, default: "+27"
  attribute :mobile_number, :string
  attribute :accept_personal_terms, :boolean

  attr_accessor :user

  def initialize(attributes = {})
    user = attributes.delete(:user)
    super(attributes)
    self.user = user
    apply_user_defaults if user
  end

  validates :club_id, presence: true

  PERSONAL_REQUIRED_FIELDS = %i[
    plan_id
    first_name
    last_name
    id_number
    email
    mobile_country_code
    mobile_number
    accept_personal_terms
  ].freeze

  NATIONALITIES = {
    "ZA" => "South African",
    "Other" => "Non-South African"
  }.freeze

  GENDERS = {
    "male" => "Male",
    "female" => "Female"
  }.freeze

  def submit(step, params)
    assign_attributes(params)
    derive_identity_details if params[:id_number].present?

    case step
    when "personal"
      valid_personal_step?
    else
      true
    end
  end

  def to_session
    {
      club_id: club_id,
      plan_id: plan_id,
      first_name: first_name,
      last_name: last_name,
      gender: gender,
      nationality: nationality,
      date_of_birth: date_of_birth,
      id_number: id_number,
      email: email,
      mobile_country_code: mobile_country_code,
      mobile_number: mobile_number,
      accept_personal_terms: accept_personal_terms
    }.compact
  end

  def plans_for_select(plans)
    plans.map { |plan| [plan.name, plan.id] }
  end

  def gender_label
    GENDERS[gender] || gender&.titleize
  end

  def nationality_label
    NATIONALITIES[nationality] || nationality
  end

  private

  def valid_personal_step?
    PERSONAL_REQUIRED_FIELDS.each do |field|
      errors.add(field, "can't be blank") if public_send(field).blank?
    end

    if id_number.present? && id_number.gsub(/\D/, "").length != 13
      errors.add(:id_number, "must be a 13-digit number")
    end

    errors.empty?
  end

  def apply_user_defaults
    self.first_name ||= user.first_name
    self.last_name ||= user.last_name
    self.email ||= user.email
  end

  def derive_identity_details
    numeric_id = id_number.to_s.gsub(/\D/, "")
    return unless numeric_id.length == 13

    yy = numeric_id[0, 2].to_i
    mm = numeric_id[2, 2].to_i
    dd = numeric_id[4, 2].to_i

    current_year = Time.zone.today.year % 100
    century = yy > current_year ? 1900 : 2000

    begin
      self.date_of_birth = Date.new(century + yy, mm, dd)
    rescue Date::Error
      errors.add(:id_number, "contains an invalid birth date")
      self.date_of_birth = nil
    end

    gender_code = numeric_id[6, 4].to_i
    self.gender = gender_code >= 5000 ? "male" : "female"

    nationality_code = numeric_id[10].to_i
    self.nationality = nationality_code.zero? ? "ZA" : "Other"
  end
end
