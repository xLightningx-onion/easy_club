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
    file_name = params[:file_name]
    if file_name == "logo"
      @club.update(logo: nil)
    elsif file_name == "banner"
      club.update(logo: nil)
    end
    render cable_ready: cable_car
                          .remove("##{params[:target_link]}")
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
      settings: {}
    )
  end

  def default_currency
    @club.settings.dig("finance", "currency") rescue "ZAR"
  end
end
