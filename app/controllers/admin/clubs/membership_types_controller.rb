# frozen_string_literal: true

require "bigdecimal"

class Admin::Clubs::MembershipTypesController < Admin::BaseController
  include ActionView::RecordIdentifier

  before_action :set_club
  before_action :set_membership_type, only: %i[show edit update destroy]

  def new
    @membership_type = @club.membership_types.build
    @membership_type.default_price_tier_amounts = {}
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
    @membership_type.default_price_tier_amounts = @default_price_tier_amounts

    created = false
    MembershipType.transaction do
      if @membership_type.save
        if create_default_price_tiers_for(@membership_type, @default_price_tier_amounts)
          created = true
        else
          raise ActiveRecord::Rollback
        end
      else
        raise ActiveRecord::Rollback
      end
    end

    if created
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
      @membership_type.default_price_tier_amounts = @default_price_tier_amounts
      render_failure
    end
  end

  def show
    render partial: "admin/clubs/membership_types/membership_type",
           locals: { club: @club, membership_type: @membership_type }
  end

  def edit
    @membership_type.default_price_tier_amounts = {}
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
    permitted = params.require(:membership_type).permit(
      :label,
      :min_age_years,
      :max_age_years,
      :gender,
      :base_price,
      default_price_tier_amounts: {}
    )
    @default_price_tier_amounts =
      permitted.delete(:default_price_tier_amounts).presence&.to_h&.transform_keys(&:to_s) || {}
    permitted
  end

  def membership_types_scope
    @club.membership_types.includes(:price_tiers).order(:min_age_years, :label)
  end

  def render_failure
    @membership_type.default_price_tier_amounts ||= @default_price_tier_amounts if defined?(@default_price_tier_amounts)
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
        @default_price_tiers = @club.default_price_tiers.ordered
        @membership_type.default_price_tier_amounts ||= @default_price_tier_amounts
        render "admin/clubs/show", status: :unprocessable_entity
      end
    end
  end

  def create_default_price_tiers_for(membership_type, amounts_hash)
    return true if amounts_hash.blank?

    currency_code = club_currency

    amounts_hash.each do |template_id, raw_amount|
      next if raw_amount.blank?

      template = @club.default_price_tiers.find_by(id: template_id)
      next unless template

      normalized_amount = raw_amount.to_s.strip.gsub(/[,\s]/, "")
      amount_decimal =
        begin
          BigDecimal(normalized_amount)
        rescue ArgumentError
          nil
        end

      unless amount_decimal
        membership_type.errors.add(:base, "Amount for #{template.label} is invalid.")
        return false
      end

      if amount_decimal.negative?
        membership_type.errors.add(:base, "Amount for #{template.label} must be zero or positive.")
        return false
      end

      price_tier = membership_type.price_tiers.build(
        label: template.label,
        starts_on: template.starts_on,
        ends_on: template.ends_on
      )
      price_tier.amount = Money.from_amount(amount_decimal, currency_code)

      unless price_tier.save
        membership_type.errors.merge!(price_tier.errors)
        return false
      end
    end

    true
  end

  def club_currency
    @club.settings.dig("finance", "currency").presence || "ZAR"
  rescue StandardError
    "ZAR"
  end

  def frame_identifier(fallback = nil)
    fallback.presence || request.headers["Turbo-Frame"] || dom_id(@club, :membership_type_modal)
  end
end
