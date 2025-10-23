# frozen_string_literal: true

class Members::MembershipRegistrationsController < Members::ApplicationController
  layout "membership_registration"
  STEPS = %w[personal medical survey terms payment_option].freeze

  before_action :ensure_club_selected!
  before_action :reset_registration_if_requested
  before_action :set_step
  before_action :load_form
  before_action :prepare_personal_step, only: :show
  before_action :prepare_medical_step, only: :show
  before_action :prepare_survey_step, only: :show
  before_action :prepare_terms_step, only: :show
  before_action :prepare_payment_option_step, only: :show

  helper_method :current_cart

  def show
    if request.format.turbo_stream? && @step == "payment_option" && preview_request?
      render turbo_stream: turbo_stream.update(
        "payment_option_breakdown",
        partial: "members/membership_registrations/payment_option_breakdown",
        locals: breakdown_locals
      )
    else
      render template_for_step, formats: [:html]
    end
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
    elsif @step == "payment_option"
      process_payment_option_step
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
      :member_id,
      :phase,
      survey_responses: {},
      terms_acceptances: {}
    ).to_h
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

    @available_profiles = current_user.members.includes(:club).order(:first_name, :last_name, :created_at)

    requested_phase = params[:phase]
    selected_profile_id = params[:profile_member_id].presence

    if selected_profile_id
      profile = @available_profiles.find { |member| member.id.to_s == selected_profile_id }
      if profile
        @form.prefill_from_member(profile, guardian: current_user)
        store_registration_data(@form.to_session)
        requested_phase = "details"
      end
    end

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
      return unless ensure_membership_finalized!

      plans = @club.active_staggered_payment_plans
      if plans.blank?
        redirect_to members_cart_path(club_id: selected_club_id), status: :see_other and return
      end

      redirect_to members_membership_registration_path(step: "payment_option", club_id: selected_club_id), status: :see_other and return
    else
      @club_terms = terms
      render template_for_step, status: :unprocessable_entity
    end
  end

  def process_payment_option_step
    return unless ensure_membership_finalized!

    form_params = params.fetch(:membership_registration_form, {}).permit(:payment_mode, :staggered_payment_plan_id)
    payment_mode = form_params[:payment_mode].presence_in(%w[full staggered]) || "full"

    cart = @cart || current_cart
    selected_plan = nil

    if payment_mode == "staggered"
      selected_plan = available_payment_plans.find_by(id: form_params[:staggered_payment_plan_id])
      unless selected_plan
        flash.now[:alert] = "Please select a valid payment plan."
        prepare_payment_option_step
        render template_for_step, status: :unprocessable_entity
        return
      end
    end

    unless cart.update(payment_mode:, staggered_payment_plan: selected_plan)
      flash.now[:alert] = cart.errors.full_messages.to_sentence
      prepare_payment_option_step
      render template_for_step, status: :unprocessable_entity
      return
    end

    redirect_to members_cart_path(club_id: @club.id), status: :see_other
  end

  def prepare_payment_option_step
    return unless @step == "payment_option"

    return unless ensure_membership_finalized!

    @staggered_payment_plans = available_payment_plans

    if @staggered_payment_plans.blank?
      redirect_to members_cart_path(club_id: @club.id) and return
    end

    preview_mode = params[:preview_payment_mode].presence_in(%w[full staggered])
    preview_plan_id = params[:preview_staggered_payment_plan_id].presence

    @selected_payment_mode = @cart.payment_mode.presence || "full"
    plan_id = @cart.staggered_payment_plan_id
    unless @staggered_payment_plans.any? { |plan| plan.id.to_s == plan_id.to_s }
      plan_id = nil
      @selected_payment_mode = "full"
    end

    if preview_mode.present?
      @selected_payment_mode = preview_mode
      plan_id = if preview_mode == "staggered"
                  candidate = preview_plan_id
                  valid_plan = @staggered_payment_plans.find { |plan| plan.id.to_s == candidate.to_s }
                  valid_plan&.id
      end
      if @selected_payment_mode == "staggered" && plan_id.nil?
        @selected_payment_mode = "full"
      end
    end

    @selected_payment_plan_id = plan_id&.to_s

    @cart_items ||= @cart.cart_items.includes({ member: :membership_type }, plan: :product)
    @cart_item_summaries = build_cart_item_summaries(@cart_items)

    @cart_total_money = @cart.full_total_money
    @base_price = resolve_base_price_for_cart(@cart, cart_items: @cart_items)
    @staggered_total_money = @base_price || @cart_total_money
    @plan_pricing = build_plan_pricing(@staggered_payment_plans, @base_price)
    @payment_totals_by_mode = {
      "full" => @cart_total_money,
      "staggered" => @staggered_total_money
    }
    @selected_payment_summary_label = build_payment_summary_label(
      @selected_payment_mode,
      @selected_payment_plan_id,
      @plan_pricing,
      @staggered_payment_plans
    )
  end

  def reset_registration_if_requested
    return unless params[:restart].present?

    session[:membership_registration] ||= {}
    club_id = @club&.id || selected_club_id
    session[:membership_registration][current_user_session_key] = { club_id: club_id }
  end

  def breakdown_locals
    full_total = @payment_totals_by_mode["full"] || @cart_total_money
    staggered_total = @payment_totals_by_mode["staggered"] || full_total

    {
      selected_mode: @selected_payment_mode,
      full_total_money: full_total,
      staggered_total_money: staggered_total
    }
  end

  def current_cart
    @current_cart ||= Club.with_current(@club) do
      Cart.unpaid.find_by(user: current_user, club: @club) || Cart.create!(user: current_user, club: @club)
    end
  end

  def available_payment_plans
    @available_payment_plans ||= @club.active_staggered_payment_plans.includes(:installments)
  end

  def preview_request?
    params[:preview_payment_mode].present? || params[:preview_staggered_payment_plan_id].present?
  end

  def resolve_base_price_for_cart(cart, cart_items: nil)
    cart.base_price_total(cart_items: cart_items)
  end

  def build_plan_pricing(plans, base_price)
    return {} unless plans.present? && base_price

    plans.each_with_object({}) do |plan, map|
      map[plan.id] = plan.ordered_installments.map do |installment|
        amount_cents = (base_price.cents * installment.percentage.to_f / 100.0).round
        amount = Money.new(amount_cents, base_price.currency.iso_code)
        [ installment, amount ]
      end
    end
  end

  def build_cart_item_summaries(cart_items)
    return [] if cart_items.blank?

    cart_items.map do |item|
      member = item.member
      membership_type = member&.membership_type
      plan = item.plan
      product = plan&.product

      full_price = Money.new(item.total_price_cents, item.total_price_currency)
      base_price = base_price_for_cart_item(item) || full_price

      {
        cart_item: item,
        member: member,
        membership_type: membership_type,
        member_name: member&.display_name.presence || "Member #{item.id}",
        membership_label: membership_type&.label || product&.name || "Membership",
        full_price: full_price,
        base_price: base_price
      }
    end
  end

  def build_payment_summary_label(selected_mode, selected_plan_id, plan_pricing, plans)
    return "Pay in full" unless selected_mode == "staggered"

    plan = plans.find { |candidate| candidate.id.to_s == selected_plan_id.to_s }
    return "Staggered payments" unless plan

    breakdown = plan_pricing[plan.id] || []
    if breakdown.any?
      "#{plan.name} · #{breakdown.size} payment#{'s' unless breakdown.size == 1}"
    else
      plan.name
    end
  end

  def base_price_for_cart_item(item)
    membership_type = item.member&.membership_type
    return Money.new(item.total_price_cents, item.total_price_currency) unless membership_type&.base_price

    base_price = membership_type.base_price
    quantity = item.quantity.to_i.nonzero? || 1
    base_price * quantity
  end

  def ensure_membership_finalized!
    return true if defined?(@finalization_attempted) && @finalization_attempted

    existing_cart = nil

    if @form.cart_id.present?
      existing_cart = Cart.find_by(id: @form.cart_id, user: current_user)
      if existing_cart&.club_id == @club.id && existing_cart.status_unpaid?
        hydrate_cart_context(existing_cart)
        @finalization_attempted = true
        return true
      elsif existing_cart
        @form.cart_id = nil
        @form.cart_item_id = nil
        store_registration_data(@form.to_session)
        existing_cart = nil
      end
    end

    if existing_cart.nil? && params[:cart_id].present?
      existing_cart = Cart.find_by(id: params[:cart_id], user: current_user, club: @club)
      if existing_cart&.status_unpaid?
        @form.cart_id = existing_cart.id
        @form.cart_item_id ||= existing_cart.cart_items.first&.id
        store_registration_data(@form.to_session)
        hydrate_cart_context(existing_cart)
        @finalization_attempted = true
        return true
      end
    end

    result = Club.with_current(@club) do
      MembershipRegistrations::Finalize.new(club: @club, user: current_user, form: @form).call
    end

    @form.member_id = result.member.id
    @form.cart_id = result.cart.id
    @form.cart_item_id = result.cart_item.id
    store_registration_data(@form.to_session)

    hydrate_cart_context(result.cart, highlighted_item: result.cart_item)

    @finalization_attempted = true
    true
  rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotFound => e
    Rails.logger.error("Membership finalization failed: #{e.message}")
    redirect_to members_membership_registration_path(step: "terms", club_id: @club.id), alert: "We couldn't prepare your order. Please review the previous step."
    false
  end

  def hydrate_cart_context(cart, highlighted_item: nil)
    @current_cart = @cart = cart
    @cart_items = cart.cart_items.includes({ member: :membership_type }, plan: :product)
    @highlighted_cart_item = highlighted_item || cart.cart_items.find_by(id: @form.cart_item_id)
    @base_price = resolve_base_price_for_cart(cart, cart_items: @cart_items)
    @cart_total_money = cart.full_total_money
    @plan_pricing = build_plan_pricing(available_payment_plans, @base_price)
  end
end
