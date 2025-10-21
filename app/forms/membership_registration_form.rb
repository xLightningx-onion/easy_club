# frozen_string_literal: true

class MembershipRegistrationForm
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :club_id, :string
  attribute :membership_type_id, :string
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
  attribute :medical_aid_name, :string
  attribute :medical_aid_number, :string
  attribute :emergency_contact_name, :string
  attribute :emergency_contact_number, :string
  attribute :medical_notes, :string
  attribute :survey_responses, default: -> { {} }
  attribute :terms_acceptances, default: -> { {} }
  attribute :member_id, :string
  attribute :cart_id, :string
  attribute :cart_item_id, :string

  attr_accessor :user

  def initialize(attributes = {})
    user = attributes.delete(:user)
    super(attributes)
    self.user = user
    apply_user_defaults if user
  end

  validates :club_id, presence: true

  DETAILS_REQUIRED_FIELDS = %i[
    first_name
    last_name
    id_number
    email
    mobile_country_code
    mobile_number
    accept_personal_terms
  ].freeze

  MEDICAL_REQUIRED_FIELDS = %i[
    emergency_contact_name
    emergency_contact_number
  ].freeze

  def submit_personal_details(params)
    attrs = indifferent_hash(params)
    permitted = attrs.slice(
      :first_name,
      :last_name,
      :id_number,
      :email,
      :mobile_country_code,
      :mobile_number,
      :accept_personal_terms
    )

    assign_attributes(permitted)
    clear_created_records!
    self.membership_type_id = nil
    derive_identity_details if permitted[:id_number].present?

    validate_personal_details
  end

  def submit_membership_choice(params, eligible_membership_types: [])
    attrs = indifferent_hash(params)

    unless personal_details_complete?
      errors.add(:base, "Please complete your personal details first.")
      return false
    end

    self.membership_type_id = attrs[:membership_type_id]
    clear_created_records!
    validate_membership_choice(eligible_membership_types)
  end

  def submit_medical_details(params)
    attrs = indifferent_hash(params)
    assign_attributes(attrs.slice(:medical_aid_name, :medical_aid_number, :emergency_contact_name, :emergency_contact_number, :medical_notes))
    assign_survey_responses(attrs[:survey_responses]) if attrs.key?(:survey_responses)
    clear_created_records!
    validate_medical_details
  end

  def submit_survey_responses(params, membership_questions: [])
    attrs = indifferent_hash(params)
    assign_survey_responses(attrs[:survey_responses]) if attrs.key?(:survey_responses)
    clear_created_records!
    validate_survey_responses(membership_questions)
  end

  def submit_terms_acceptances(params, terms: [])
    attrs = indifferent_hash(params)
    assign_terms_acceptances(attrs[:terms_acceptances]) if attrs.key?(:terms_acceptances)
    validate_terms_acceptances(terms)
  end

  def to_session
    {
      club_id: club_id,
      membership_type_id: membership_type_id,
      first_name: first_name,
      last_name: last_name,
      gender: gender,
      nationality: nationality,
      date_of_birth: date_of_birth,
      id_number: id_number,
      email: email,
      mobile_country_code: mobile_country_code,
      mobile_number: mobile_number,
      accept_personal_terms: accept_personal_terms,
      medical_aid_name: medical_aid_name,
      medical_aid_number: medical_aid_number,
      emergency_contact_name: emergency_contact_name,
      emergency_contact_number: emergency_contact_number,
      medical_notes: medical_notes,
      survey_responses: survey_responses.to_h,
      terms_acceptances: terms_acceptances.to_h,
      member_id: member_id,
      cart_id: cart_id,
      cart_item_id: cart_item_id
    }.compact
  end

  def personal_details_complete?
    DETAILS_REQUIRED_FIELDS.all? { |field| public_send(field).present? }
  end

  def eligible_membership_types(collection)
    collection.select { |membership_type| eligible_for_membership_type?(membership_type) }
  end

  def eligible_for_membership_type?(membership_type)
    return false unless personal_details_complete? && date_of_birth.present?

    age = age_at_year_end
    return false unless age

    rules_gender = membership_type.gender
    gender_value = gender.to_s.downcase
    gender_ok =
      case rules_gender
      when "unisex", nil
        true
      when "male", "female"
        gender_value == rules_gender
      else
        true
      end

    min_age = membership_type.min_age_years
    max_age = membership_type.max_age_years

    age_ok = true
    age_ok &&= age >= min_age if min_age
    age_ok &&= age <= max_age if max_age

    gender_ok && age_ok
  end

  def gender_label
    gender.to_s
  end

  def nationality_label
    nationality.to_s
  end

  def accepted_term?(term)
    ActiveModel::Type::Boolean.new.cast(terms_acceptances[term.id.to_s])
  end

  def clear_created_records!
    self.member_id = nil
    self.cart_id = nil
    self.cart_item_id = nil
  end

  private

  def validate_personal_details
    errors.clear

    DETAILS_REQUIRED_FIELDS.each do |field|
      errors.add(field, "can't be blank") if public_send(field).blank?
    end

    if id_number.present? && id_number.gsub(/\D/, "").length != 13
      errors.add(:id_number, "must be a 13-digit number")
    end

    errors.empty?
  end

  def validate_membership_choice(eligible_membership_types)
    errors.clear
    if membership_type_id.blank?
      errors.add(:membership_type_id, "Select a membership type")
      return false
    end

    unless eligible_membership_types.any? { |type| type.id == membership_type_id }
      errors.add(:membership_type_id, "is not available based on your personal details")
    end

    errors.empty?
  end

  def validate_medical_details
    errors.clear

    MEDICAL_REQUIRED_FIELDS.each do |field|
      errors.add(field, "can't be blank") if public_send(field).blank?
    end

    if emergency_contact_number.present? && emergency_contact_number.gsub(/\D/, "").length < 7
      errors.add(:emergency_contact_number, "looks too short")
    end

    errors.empty?
  end

  def validate_terms_acceptances(terms)
    errors.clear

    Array(terms).each do |term|
      next unless term.required?

      accepted = ActiveModel::Type::Boolean.new.cast(terms_acceptances[term.id.to_s])
      errors.add(:base, "Please accept '#{term.title}' to continue.") unless accepted
    end

    errors.empty?
  end

  def assign_terms_acceptances(raw)
    normalized = {}
    raw&.each do |key, value|
      normalized[key.to_s] = ActiveModel::Type::Boolean.new.cast(value)
    end
    self.terms_acceptances = normalized
  end

  def validate_survey_responses(membership_questions)
    errors.clear

    membership_questions.each do |question|
      next unless question.required?

      value = survey_responses[question.id.to_s]
      value_present =
        case question.answer_type
        when "checkbox"
          value.present?
        else
          value.is_a?(String) ? value.strip.present? : value.present?
        end

      errors.add(:base, "#{question.prompt} is required") unless value_present
    end

    errors.empty?
  end

  def assign_survey_responses(values)
    structured = values.is_a?(Hash) ? values : {}
    merged = survey_responses.merge(structured.stringify_keys)
    self.survey_responses = merged.with_indifferent_access
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
      return
    end

    gender_code = numeric_id[6, 4].to_i
    self.gender = gender_code >= 5000 ? "Male" : "Female"

    nationality_code = numeric_id[10].to_i
    self.nationality = nationality_code.zero? ? "South African" : "Non-South African"
  end

  def age_at_year_end
    return unless date_of_birth

    year_end = Date.new(Date.current.year, 12, 31)
    year_end.year - date_of_birth.year
  end

  def indifferent_hash(params)
    (params || {}).with_indifferent_access
  end
end
