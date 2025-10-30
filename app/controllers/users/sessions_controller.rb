# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  before_action :set_club
  before_action :configure_sign_in_params, only: :create
  respond_to :html, :turbo_stream

  def new
    super
  end

  def create
    normalize_login_params
    self.resource = warden.authenticate!(auth_options)
    set_flash_message!(:notice, :signed_in)
    sign_in(resource_name, resource)
    store_membership_registration_club(resource)
    yield resource if block_given?
    respond_with resource, location: after_sign_in_path_for(resource)
  end

  protected

  def after_sign_in_path_for(resource)
    return members_membership_registration_path(
      step: Members::MembershipRegistrationsController::STEPS.first,
      club_id: @club
    ) if @club&.id.present?

    super
  end

  private

  def set_club
    @club = Club.find_by_param(params[:club_id])
  end

  def store_membership_registration_club(user)
    return unless @club&.id.present?

    session[:membership_registration] ||= {}
    user_key = "user_#{user.id}"
    session[:membership_registration][user_key] ||= {}
    session[:membership_registration][user_key][:club_id] = @club.to_param
  end

  def configure_sign_in_params
    devise_parameter_sanitizer.permit(:sign_in, keys: [ :login ])
  end

  def normalize_login_params
    return unless params[:user].is_a?(ActionController::Parameters) || params[:user].is_a?(Hash)

    login_input = params[:user][:login].presence || params[:user][:email].presence
    login_input = login_input.to_s.strip

    params[:user][:login] = login_input if params[:user].respond_to?(:[]=)

    if login_input.blank?
      params[:user][:email] = login_input
      return
    end

    if login_input.include?("@")
      params[:user][:email] = login_input.downcase
    else
      user = User.find_by_full_mobile(login_input)
      params[:user][:email] = user&.email.presence || "__invalid_mobile__#{SecureRandom.hex(4)}"
    end
  end
end
