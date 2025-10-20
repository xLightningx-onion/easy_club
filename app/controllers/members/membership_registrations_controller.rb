# frozen_string_literal: true

class Members::MembershipRegistrationsController < Members::ApplicationController
  STEPS = %w[personal medical survey terms checkout].freeze

  before_action :ensure_club_selected!
  before_action :set_step
  before_action :load_form
  before_action :load_plan_options, only: :show

  def show
    render template_for_step
  end

  def update
    if @form.submit(@step, membership_registration_params)
      store_registration_data(@form.to_session)
      next_step = next_step_from(@step)
      redirect_to members_membership_registration_path(step: next_step, club_id: selected_club_id), status: :see_other
    else
      load_plan_options if @step == "personal"
      render template_for_step, status: :unprocessable_entity
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
    params.fetch(:membership_registration_form, {}).permit(
      :plan_id,
      :first_name,
      :last_name,
      :gender,
      :nationality,
      :date_of_birth,
      :id_number,
      :email,
      :mobile_country_code,
      :mobile_number,
      :accept_personal_terms
    )
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
    STEPS[[index + 1, STEPS.length - 1].min]
  end

  def template_for_step
    "members/membership_registrations/#{@step}"
  end

  def load_plan_options
    @plans = @club.plans.order(:name)
  end
end
