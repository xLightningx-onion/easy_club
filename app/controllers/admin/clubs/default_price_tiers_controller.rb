# frozen_string_literal: true

class Admin::Clubs::DefaultPriceTiersController < Admin::BaseController
  include ActionView::RecordIdentifier

  before_action :set_club
  before_action :set_default_price_tier, only: %i[show edit update destroy]

  def new
    @default_price_tier = @club.default_price_tiers.build
    authorize! @default_price_tier
    frame_id = frame_identifier(params[:frame_id])

    if params[:reset].present?
      render partial: "admin/clubs/default_price_tiers/new_button", locals: { club: @club }
    else
      render partial: "admin/clubs/default_price_tiers/form",
             locals: { club: @club, default_price_tier: @default_price_tier, frame_id: frame_id }
    end
  end

  def create
    @default_price_tier = @club.default_price_tiers.build(default_price_tier_params)
    authorize! @default_price_tier

    if @default_price_tier.save
      @default_price_tiers = default_price_tiers_scope
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: [
            turbo_stream.replace(
              dom_id(@club, :default_price_tiers),
              partial: "admin/clubs/default_price_tiers/list",
              locals: { club: @club, default_price_tiers: @default_price_tiers }
            ),
            turbo_stream.replace(
              dom_id(@club, :new_default_price_tier),
              partial: "admin/clubs/default_price_tiers/new_button",
              locals: { club: @club }
            )
          ]
        end
        format.html { redirect_to admin_club_path(@club), notice: "Default tier added." }
      end
    else
      render_form_failure
    end
  end

  def show
    authorize! @default_price_tier
    render partial: "admin/clubs/default_price_tiers/default_price_tier",
           locals: { club: @club, default_price_tier: @default_price_tier }
  end

  def edit
    authorize! @default_price_tier
    render partial: "admin/clubs/default_price_tiers/form",
           locals: { club: @club, default_price_tier: @default_price_tier, frame_id: frame_identifier(params[:frame_id]) }
  end

  def update
    authorize! @default_price_tier
    if @default_price_tier.update(default_price_tier_params)
      @default_price_tiers = default_price_tiers_scope
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: turbo_stream.replace(
            dom_id(@club, :default_price_tiers),
            partial: "admin/clubs/default_price_tiers/list",
            locals: { club: @club, default_price_tiers: @default_price_tiers }
          )
        end
        format.html { redirect_to admin_club_path(@club), notice: "Default tier updated." }
      end
    else
      render_form_failure
    end
  end

  def destroy
    authorize! @default_price_tier
    @default_price_tier.destroy
    @default_price_tiers = default_price_tiers_scope

    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: [
          turbo_stream.remove(@default_price_tier),
          turbo_stream.replace(
            dom_id(@club, :default_price_tiers),
            partial: "admin/clubs/default_price_tiers/list",
            locals: { club: @club, default_price_tiers: @default_price_tiers }
          ),
          turbo_stream.replace(
            dom_id(@club, :new_default_price_tier),
            partial: "admin/clubs/default_price_tiers/new_button",
            locals: { club: @club }
          )
        ]
      end
      format.html { redirect_to admin_club_path(@club), notice: "Default tier removed." }
    end
  end

  private

  def set_club
    @club = Club.find(params[:club_id])
    authorize! @club, to: :update?
  end

  def set_default_price_tier
    @default_price_tier = @club.default_price_tiers.find(params[:id])
  end

  def default_price_tier_params
    params.require(:club_default_price_tier).permit(:label, :starts_on, :ends_on)
  end

  def default_price_tiers_scope
    @club.default_price_tiers.ordered
  end

  def render_form_failure
    respond_to do |format|
      format.turbo_stream do
        render partial: "admin/clubs/default_price_tiers/form",
               locals: {
                 club: @club,
                 default_price_tier: @default_price_tier,
                 frame_id: frame_identifier(params[:frame_id])
               },
               status: :unprocessable_entity
      end
      format.html do
        @default_price_tiers = default_price_tiers_scope
        render "admin/clubs/show", status: :unprocessable_entity
      end
    end
  end

  def frame_identifier(fallback = nil)
    fallback.presence || request.headers["Turbo-Frame"] || dom_id(@club, :default_price_tier_modal)
  end
end
