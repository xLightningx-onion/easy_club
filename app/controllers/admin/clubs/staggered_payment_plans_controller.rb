# frozen_string_literal: true

class Admin::Clubs::StaggeredPaymentPlansController < Admin::BaseController
  include ActionView::RecordIdentifier

  before_action :set_club
  before_action :set_plan, only: %i[edit update destroy]

  def new
    @plan = @club.staggered_payment_plans.build(active: true)
    authorize! @plan
    @plan.starts_on ||= Date.current
    @plan.ends_on ||= (@plan.starts_on || Date.current) + 56.days
    build_default_installments(@plan)

    render_form_partial(plan: @plan, frame_id: frame_identifier(params[:frame_id]))
  end

  def create
    @plan = @club.staggered_payment_plans.build(plan_params)
    authorize! @plan

    if @plan.save
      respond_refresh_list(notice: "Staggered payment plan created.")
    else
      render_form_partial(plan: @plan, frame_id: frame_identifier(params[:frame_id]), status: :unprocessable_entity)
    end
  end

  def edit
    authorize! @plan
    render_form_partial(plan: @plan, frame_id: frame_identifier(params[:frame_id]))
  end

  def update
    authorize! @plan

    if @plan.update(plan_params)
      respond_refresh_list(notice: "Staggered payment plan updated.")
    else
      render_form(plan: @plan, frame_id: frame_identifier(params[:frame_id]), status: :unprocessable_entity)
    end
  end

  def destroy
    authorize! @plan
    @plan.destroy

    respond_refresh_list(notice: "Staggered payment plan removed.")
  end

  private

  def set_club
    @club = Club.find(params[:club_id])
    authorize! @club, to: :update?
  end

  def set_plan
    @plan = @club.staggered_payment_plans.find(params[:id])
  end

  def plan_params
    params.require(:staggered_payment_plan).permit(
      :name,
      :description,
      :active,
      :starts_on,
      :ends_on,
      installments_attributes: %i[
        id
        percentage
        amount
        due_on
        position
        _destroy
      ]
    )
  end

  def plans_scope
    policy_scope(@club.staggered_payment_plans.includes(:installments)).order(:name)
  end

  def render_form(plan:, frame_id:, status: :ok)
    respond_to do |format|
      format.turbo_stream do
        render partial: "admin/clubs/staggered_payment_plans/form",
               locals: { club: @club, plan: plan, frame_id: frame_id, plans: plans_scope },
               status: status
      end
      format.html do
        preload_club_overview
        render "admin/clubs/show", status: status
      end
    end
  end

  def render_form_partial(plan:, frame_id:)
    render partial: "admin/clubs/staggered_payment_plans/form",
           locals: { club: @club, plan: plan, frame_id: frame_id, plans: plans_scope }
  end

  def respond_refresh_list(notice:)
    @plans = plans_scope
    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: [
          turbo_stream.replace(
            dom_id(@club, :staggered_payment_plans),
            partial: "admin/clubs/staggered_payment_plans/list",
            locals: { club: @club, plans: @plans }
          ),
          turbo_stream.replace(
            dom_id(@club, :new_staggered_payment_plan),
            partial: "admin/clubs/staggered_payment_plans/new_button",
            locals: { club: @club }
          )
        ]
      end
      format.html { redirect_to admin_club_path(@club), notice: notice }
    end
  end

  def frame_identifier(fallback = nil)
    fallback.presence || request.headers["Turbo-Frame"] || dom_id(@club, :staggered_payment_plan_modal)
  end

  def build_default_installments(plan)
    return if plan.installments.any?

    base_date = plan.starts_on || Date.current
    plan.installments.build(percentage: 50, due_on: base_date)
    plan.installments.build(percentage: 50, due_on: (base_date + 28.days).to_date)
  end

  def preload_club_overview
    @plans = plans_scope
    @staggered_payment_plans = @plans
    @members_count = @club.members.count
    @invoices_count = @club.invoices.count
    payments_cents = @club.payments.sum(:amount_cents).to_i
    currency = @club.settings.dig("finance", "currency").presence || "ZAR"
    @payments_total = Money.new(payments_cents, currency)
    @payments_total ||= Money.new(0, currency)
    @membership_questions = @club.membership_questions
    @medical_questions = @club.medical_questions.order(:position, :created_at)
    @club_terms = @club.club_terms.order(:position, :created_at)
    @membership_types = @club.membership_types.includes(:price_tiers).order(:min_age_years, :label)
  end
end
