# frozen_string_literal: true

class Users::RegistrationsController < Devise::RegistrationsController
  before_action :set_club
  respond_to :html, :turbo_stream

  def create
    build_resource(sign_up_params)

    successfully_saved = resource.save
    yield resource if block_given?

    if successfully_saved
      handle_successful_signup(resource)
    else
      clean_up_passwords resource
      set_minimum_password_length
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: turbo_stream.replace(
            "registration_form",
            partial: "users/registrations/form_card",
            locals: { resource: resource, club: @club }
          ), status: :unprocessable_entity
        end
        format.html { render :new, status: :unprocessable_entity }
      end
    end
  end

  private

  def set_club
    @club = Club.find_by_id(params["club_id"])
  end

  def handle_successful_signup(resource)
    if resource.active_for_authentication?
      set_flash_message! :notice, :signed_up
      sign_up(resource_name, resource)
      redirect_path = after_sign_up_path_for(resource)
    else
      set_flash_message! :notice, :"signed_up_but_#{resource.inactive_message}"
      expire_data_after_sign_in!
      redirect_path = after_inactive_sign_up_path_for(resource)
    end

    store_registration_club(resource)

    respond_to do |format|
      format.html { redirect_to redirect_path }
      format.turbo_stream { redirect_to redirect_path, status: :see_other }
    end
  end

  def sign_up_params
    permitted = params
                .require(:user)
                .permit(:first_name, :last_name, :email, :country_code, :mobile_number,
                        :password, :password_confirmation, :terms_agreement)
    permitted.merge(role: User.roles.fetch(:member), staff: false)
  end

  def account_update_params
    params
      .require(:user)
      .permit(:first_name, :last_name, :email, :country_code, :mobile_number,
              :password, :password_confirmation, :current_password)
  end

  def after_sign_up_path_for(resource)
    return super unless @club&.id.present?

    members_membership_registration_path(
      step: Members::MembershipRegistrationsController::STEPS.first,
      club_id: @club.id
    )
  end

  def store_registration_club(resource)
    return unless @club&.id.present?

    session[:membership_registration] ||= {}
    user_key = "user_#{resource.id}"
    session[:membership_registration][user_key] ||= {}
    session[:membership_registration][user_key][:club_id] = @club.id
  end
end
