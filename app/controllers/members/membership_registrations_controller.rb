# frozen_string_literal: true

class Members::MembershipRegistrationsController < Members::ApplicationController
  STEPS = %w[personal medical survey terms order_confirmation].freeze

  before_action :ensure_club_selected!
  before_action :reset_registration_if_requested
  before_action :set_step
  before_action :load_form
  before_action :prepare_personal_step, only: :show
  before_action :prepare_medical_step, only: :show
  before_action :prepare_survey_step, only: :show
  before_action :prepare_terms_step, only: :show
  before_action :prepare_order_confirmation_step, only: :show

  helper_method :current_cart

  def show
    render template_for_step
  end

  def update
    if @step == "personal"
      process_personal_step
    elsif @step == "medical"
      process_medical_step
    elsif @step == "survey"
      process_survey_step
    elsif @step == "terms"
      process_terms_step
    elsif @step == "order_confirmation"
      redirect_to club_cart_path
    else
      head :bad_request
    end
  end

  private

  def ensure_club_selected!
    session[:membership_registration] ||= {}
    session[:membership_registration][current_user_session_key] ||= {}

    if params[:club_id].present?
      session[:membership_registration][current_user_session_key][:club_id] = params[:club_id]
    end

    unless selected_club_id
      redirect_to members_dashboards_path, alert: "Please choose a club to start a membership." and return
    end

    @club = Club.find(selected_club_id)
  end

  def set_step
    requested_step = params[:step].presence
    @step = requested_step.in?(STEPS) ? requested_step : STEPS.first
  end

  def load_form
    @form = MembershipRegistrationForm.new(session_registration_data.merge(club_id: selected_club_id, user: current_user))
  end

  def membership_registration_params
    permitted = params.fetch(:membership_registration_form, {}).permit(
      :membership_type_id,
      :first_name,
      :last_name,
      :gender,
      :nationality,
      :date_of_birth,
      :id_number,
      :email,
      :mobile_country_code,
      :mobile_number,
      :accept_personal_terms,
      :medical_aid_name,
      :medical_aid_number,
      :emergency_contact_name,
      :emergency_contact_number,
      :medical_notes,
      survey_responses: {},
      terms_acceptances: {}
    ).to_h

    phase = params.dig(:membership_registration_form, :phase)
    permitted['phase'] = phase if phase.present?
    permitted
  end

  def store_registration_data(data)
    session[:membership_registration] ||= {}
    session[:membership_registration][current_user_session_key] = data
  end

  def session_registration_data
    session.dig(:membership_registration, current_user_session_key) || {}
  end

  def selected_club_id
    session.dig(:membership_registration, current_user_session_key, :club_id)
  end

  def current_user_session_key
    "user_#{current_user.id}"
  end

  def next_step_from(step)
    index = STEPS.index(step)
    STEPS[[ index + 1, STEPS.length - 1 ].min]
  end

  def template_for_step
    "members/membership_registrations/#{@step}"
  end

  def eligible_membership_types
    @eligible_membership_types ||= @form.eligible_membership_types(@club.membership_types.order(:min_age_years, :label))
  end

  def prepare_personal_step
    return unless @step == "personal"

    requested_phase = params[:phase]

    if requested_phase == "details"
      @phase = :details
    elsif requested_phase == "membership_type"
      @phase = :membership_type
    else
      @phase = @form.personal_details_complete? ? :membership_type : :details
    end

    if @phase == :membership_type
      @eligible_membership_types = eligible_membership_types
    end
  end

  def prepare_medical_step
    return unless @step == "medical"

    @medical_questions = @club.medical_questions.active.order(:position)
  end

  def prepare_survey_step
    return unless @step == "survey"

    @membership_questions = @club.membership_questions
  end

  def prepare_terms_step
    return unless @step == "terms"

    @club_terms = @club.club_terms.active.order(:position)
  end

  def process_personal_step
    attrs = membership_registration_params.with_indifferent_access
    phase = attrs[:phase]

    if phase == "membership_type"
      @eligible_membership_types = eligible_membership_types
      if @form.submit_membership_choice(attrs, eligible_membership_types: @eligible_membership_types)
        store_registration_data(@form.to_session)
        redirect_to members_membership_registration_path(step: next_step_from(@step), club_id: selected_club_id), status: :see_other
      else
        @phase = :membership_type
        render template_for_step, status: :unprocessable_entity
      end
    else
      if @form.submit_personal_details(attrs)
        store_registration_data(@form.to_session)
        redirect_to members_membership_registration_path(step: "personal", club_id: selected_club_id, phase: "membership_type"), status: :see_other
      else
        @phase = :details
        render template_for_step, status: :unprocessable_entity
      end
    end
  end

  def process_medical_step
    attrs = membership_registration_params.with_indifferent_access
    if @form.submit_medical_details(attrs)
      store_registration_data(@form.to_session)
      redirect_to members_membership_registration_path(step: next_step_from(@step), club_id: selected_club_id), status: :see_other
    else
      prepare_medical_step
      render template_for_step, status: :unprocessable_entity
    end
  end

  def process_survey_step
    attrs = membership_registration_params.with_indifferent_access
    questions = @club.membership_questions
    if @form.submit_survey_responses(attrs, membership_questions: questions)
      store_registration_data(@form.to_session)
      redirect_to members_membership_registration_path(step: next_step_from(@step), club_id: selected_club_id), status: :see_other
    else
      @membership_questions = questions
      render template_for_step, status: :unprocessable_entity
    end
  end

  def process_terms_step
    attrs = membership_registration_params.with_indifferent_access
    terms = @club.club_terms.active.order(:position)
    if @form.submit_terms_acceptances(attrs, terms: terms)
      store_registration_data(@form.to_session)
      redirect_to members_membership_registration_path(step: next_step_from(@step), club_id: selected_club_id), status: :see_other
    else
      @club_terms = terms
      render template_for_step, status: :unprocessable_entity
    end
  end

  def prepare_order_confirmation_step
    return unless @step == "order_confirmation"

    result = Club.with_current(@club) do
      MembershipRegistrations::Finalize.new(club: @club, user: current_user, form: @form).call
    end

    @form.member_id = result.member.id
    @form.cart_id = result.cart.id
    @form.cart_item_id = result.cart_item.id
    store_registration_data(@form.to_session)

    @current_cart = @cart = result.cart
    @highlighted_cart_item = result.cart_item
  rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotFound => e
    Rails.logger.error("Membership finalization failed: #{e.message}")
    redirect_to members_membership_registration_path(step: "terms", club_id: @club.id), alert: "We couldn't prepare your order. Please review the previous step." and return
  end

  def reset_registration_if_requested
    return unless params[:restart].present?

    session[:membership_registration] ||= {}
    club_id = @club&.id || selected_club_id
    session[:membership_registration][current_user_session_key] = { club_id: club_id }
  end

  def current_cart
    @current_cart ||= Club.with_current(@club) do
      Cart.unpaid.find_by(user: current_user, club: @club) || Cart.create!(user: current_user, club: @club)
    end
  end
end
