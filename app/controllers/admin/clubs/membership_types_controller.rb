# frozen_string_literal: true

class Admin::Clubs::MembershipTypesController < Admin::BaseController
  include ActionView::RecordIdentifier

  before_action :set_club
  before_action :set_membership_type, only: %i[show edit update destroy]

  def new
    @membership_type = @club.membership_types.build
    frame_id = frame_identifier(params[:frame_id])

    if params[:reset].present?
      render partial: "admin/clubs/membership_types/new_button", locals: { club: @club }
    else
      render partial: "admin/clubs/membership_types/form",
             locals: { club: @club, membership_type: @membership_type, frame_id: frame_id }
    end
  end

  def create
    @membership_type = @club.membership_types.build(membership_type_params)

    if @membership_type.save
      @membership_types = membership_types_scope
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: [
            turbo_stream.replace(
              dom_id(@club, :membership_types),
              partial: "admin/clubs/membership_types/list",
              locals: { club: @club, membership_types: @membership_types }
            ),
            turbo_stream.replace(
              dom_id(@club, :new_membership_type),
              partial: "admin/clubs/membership_types/new_button",
              locals: { club: @club }
            )
          ]
        end
        format.html { redirect_to admin_club_path(@club), notice: "Membership type added." }
      end
    else
      render_failure
    end
  end

  def show
    render partial: "admin/clubs/membership_types/membership_type",
           locals: { club: @club, membership_type: @membership_type }
  end

  def edit
    render partial: "admin/clubs/membership_types/form",
           locals: {
             club: @club,
             membership_type: @membership_type,
             frame_id: frame_identifier(params[:frame_id])
           }
  end

  def update
    if @membership_type.update(membership_type_params)
      @membership_types = membership_types_scope
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: turbo_stream.replace(
            dom_id(@club, :membership_types),
            partial: "admin/clubs/membership_types/list",
            locals: { club: @club, membership_types: @membership_types }
          )
        end
        format.html { redirect_to admin_club_path(@club), notice: "Membership type updated." }
      end
    else
      render_failure
    end
  end

  def destroy
    @membership_type.destroy
    @membership_types = membership_types_scope

    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: [
          turbo_stream.remove(@membership_type),
          turbo_stream.replace(
            dom_id(@club, :membership_types),
            partial: "admin/clubs/membership_types/list",
            locals: { club: @club, membership_types: @membership_types }
          ),
          turbo_stream.replace(
            dom_id(@club, :new_membership_type),
            partial: "admin/clubs/membership_types/new_button",
            locals: { club: @club }
          )
        ]
      end
      format.html { redirect_to admin_club_path(@club), notice: "Membership type removed." }
    end
  end

  private

  def set_club
    @club = Club.find(params[:club_id])
  end

  def set_membership_type
    @membership_type = @club.membership_types.find(params[:id])
  end

  def membership_type_params
    params.require(:membership_type).permit(
      :label,
      :min_age_years,
      :max_age_years,
      :gender,
      :base_price
    )
  end

  def membership_types_scope
    @club.membership_types.includes(:price_tiers).order(:min_age_years, :label)
  end

  def render_failure
    respond_to do |format|
      format.turbo_stream do
        render partial: "admin/clubs/membership_types/form",
               locals: {
                 club: @club,
                 membership_type: @membership_type,
                 frame_id: frame_identifier(params[:frame_id])
               },
               status: :unprocessable_entity
      end
      format.html do
        @membership_types = membership_types_scope
        render "admin/clubs/show", status: :unprocessable_entity
      end
    end
  end

  def frame_identifier(fallback = nil)
    fallback.presence || request.headers["Turbo-Frame"] || dom_id(@club, :membership_type_modal)
  end
end
