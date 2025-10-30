# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  before_action :set_club
  respond_to :html, :turbo_stream

  def new
    super
  end

  def create
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
end
