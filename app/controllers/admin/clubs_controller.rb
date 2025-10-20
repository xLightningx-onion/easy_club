# frozen_string_literal: true

class Admin::ClubsController < Admin::BaseController
  before_action :set_club, only: %i[show edit update destroy impersonate remove_file]

  def index
    @clubs = Club.includes(:members).order(:name)
  end

  def show
    @members_count = @club.members.count
    @invoices_count = @club.invoices.count
    @payments_total = Money.new(@club.payments.sum(:amount_cents), default_currency)
    @membership_questions = @club.membership_questions
    @membership_types = @club.membership_types.includes(:price_tiers).order(:min_age_years, :label)
  end

  def new
    @club = Club.new
  end

  def create
    @club = Club.new(club_params)
    if @club.save
      redirect_to admin_club_path(@club), notice: "Club created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit; end

  def update
    if @club.update(club_params)
      redirect_to admin_club_path(@club), notice: "Club updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @club.destroy
    redirect_to admin_clubs_path, notice: "Club deleted."
  end

  def impersonate
    session[:impersonated_club_id] = @club.id
    redirect_to root_path, notice: "Now impersonating #{@club.name}."
  end

  def remove_file
    case params[:file_name]
    when "logo"   then @club.update!(logo: nil)
    when "banner" then @club.update!(banner: nil)
    else
      return head :unprocessable_entity
    end

    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: turbo_stream.remove(params[:target_dom_id])
      end
      format.html do
        redirect_back fallback_location: edit_admin_club_path(@club),
                      notice: "#{params[:file_name].humanize} removed."
      end
    end
  end

  private

  def set_club
    @club = Club.find(params[:id])
  end

  def club_params
    params.require(:club).permit(
      :name,
      :subdomain,
      :primary_domain,
      :sender_email,
      :logo,
      :banner,
      :public_listing,
      :location_name,
      :address_line1,
      :address_line2,
      :city,
      :region,
      :postal_code,
      :country,
      :latitude,
      :longitude,
      :google_place_id,
      color_palette: {},
      settings: {},
      membership_questions_attributes: %i[
        id
        prompt
        answer_type
        required
        position
        help_text
        options_text
        _destroy
      ]
    )
  end

  def default_currency
    @club.settings.dig("finance", "currency") rescue "ZAR"
  end
end
