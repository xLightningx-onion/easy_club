# frozen_string_literal: true

class Admin::Clubs::MembershipTypes::PriceTiersController < Admin::BaseController
  include ActionView::RecordIdentifier

  before_action :set_club
  before_action :set_membership_type
  before_action :set_price_tier, only: %i[edit update destroy]

  def new
    @price_tier = @membership_type.price_tiers.build

    if params[:reset].present?
      render partial: "admin/clubs/membership_types/price_tiers/new_button",
             locals: { club: @club, membership_type: @membership_type }
    else
      render_form
    end
  end

  def create
    @price_tier = @membership_type.price_tiers.build(price_tier_params)

    if @price_tier.save
      respond_to do |format|
        format.turbo_stream { render_success_stream }
        format.html { redirect_to admin_club_path(@club), notice: "Price tier added." }
      end
    else
      render_failure
    end
  end

  def edit
    render_form
  end

  def update
    if @price_tier.update(price_tier_params)
      respond_to do |format|
        format.turbo_stream { render_success_stream }
        format.html { redirect_to admin_club_path(@club), notice: "Price tier updated." }
      end
    else
      render_failure
    end
  end

  def destroy
    @price_tier.destroy

    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: [
          turbo_stream.remove(@price_tier),
          turbo_stream.replace(
            dom_id(@membership_type, :price_tiers),
            partial: "admin/clubs/membership_types/price_tiers/list",
            locals: { club: @club, membership_type: @membership_type, price_tiers: price_tiers_scope }
          ),
          turbo_stream.replace(
            dom_id(@membership_type, :new_price_tier),
            partial: "admin/clubs/membership_types/price_tiers/new_button",
            locals: { club: @club, membership_type: @membership_type }
          )
        ]
      end
      format.html { redirect_to admin_club_path(@club), notice: "Price tier removed." }
    end
  end

  private

  def set_club
    @club = Club.find(params[:club_id])
  end

  def set_membership_type
    @membership_type = @club.membership_types.find(params[:membership_type_id])
  end

  def set_price_tier
    @price_tier = @membership_type.price_tiers.find(params[:id])
  end

  def price_tier_params
    params.require(:membership_type_price_tier).permit(:label, :amount, :position)
  end

  def render_form
    render partial: "admin/clubs/membership_types/price_tiers/form",
           locals: {
             club: @club,
             membership_type: @membership_type,
             price_tier: @price_tier,
             frame_id: frame_identifier(params[:frame_id])
           }
  end

  def render_success_stream
    render turbo_stream: [
      turbo_stream.replace(
        dom_id(@membership_type, :price_tiers),
        partial: "admin/clubs/membership_types/price_tiers/list",
        locals: { club: @club, membership_type: @membership_type, price_tiers: price_tiers_scope }
      ),
      turbo_stream.replace(
        dom_id(@membership_type, :new_price_tier),
        partial: "admin/clubs/membership_types/price_tiers/new_button",
        locals: { club: @club, membership_type: @membership_type }
      )
    ]
  end

  def render_failure
    respond_to do |format|
      format.turbo_stream do
        render partial: "admin/clubs/membership_types/price_tiers/form",
               locals: {
                 club: @club,
                 membership_type: @membership_type,
                 price_tier: @price_tier,
                 frame_id: frame_identifier(params[:frame_id])
               },
               status: :unprocessable_entity
      end
      format.html do
        flash.now[:alert] = @price_tier.errors.full_messages.to_sentence
        @membership_types = @club.membership_types.includes(:price_tiers).order(:min_age_years, :label)
        render "admin/clubs/show", status: :unprocessable_entity
      end
    end
  end

  def price_tiers_scope
    @membership_type.price_tiers.order(:position, :created_at)
  end

  def frame_identifier(fallback = nil)
    fallback.presence || request.headers["Turbo-Frame"] || dom_id(@club, :membership_type_modal)
  end
end
