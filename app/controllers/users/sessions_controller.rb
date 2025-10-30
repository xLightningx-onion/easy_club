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
    self.resource = warden.authenticate(auth_options)

    unless resource
      self.resource = resource_class.new
      resource.login = @login_input if resource.respond_to?(:login=)
      resource.email = params[:user][:email] if resource.respond_to?(:email=)
      resource.errors.add(:base, "Invalid email/mobile number or password.")
      clean_up_passwords(resource)
      set_minimum_password_length
      return render(:new, status: :unauthorized)
    end

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
    devise_parameter_sanitizer.permit(:sign_in, keys: [ :login, :country_code ])
  end

  def normalize_login_params
    return unless params[:user].respond_to?(:[]) && params[:user].respond_to?(:[]=)

    country_code_digits = delete_user_param(:country_code).to_s.gsub(/\D+/, "")
    @login_country_code = country_code_digits.present? ? "+#{country_code_digits}" : nil

    raw_login = params[:user][:login].presence || params[:user][:email].presence
    raw_login = raw_login.to_s.strip
    write_user_param(:login, raw_login)
    @login_input = raw_login

    if raw_login.blank?
      write_user_param(:email, raw_login)
      return
    end

    if raw_login.include?("@")
      sanitized_email = raw_login.downcase
      write_user_param(:login, sanitized_email)
      write_user_param(:email, sanitized_email)
      @login_mode = :email
    else
      digits_only = raw_login.gsub(/\D+/, "")
      digits_only = digits_only.sub(/\A0+/, "")

      if country_code_digits.present? && digits_only.present? &&
         !digits_only.start_with?(country_code_digits)
        digits_only = "#{country_code_digits}#{digits_only}"
      end

      write_user_param(:login, digits_only)
      user = User.find_by_full_mobile(digits_only)

      if user&.email.present?
        write_user_param(:email, user.email.downcase)
      else
        delete_user_param(:email)
      end

      @login_mode = :mobile
    end
  end

  def write_user_param(key, value)
    params[:user][key] = value
    sync_request_user_param(key, value)
  end

  def delete_user_param(key)
    value = params[:user].delete(key)
    sync_request_user_param(key, nil, delete: true)
    value
  end

  def sync_request_user_param(key, value, delete: false)
    user_params = request_user_params
    return unless user_params

    key_string = key.to_s
    key_symbol = key.to_sym

    if delete
      user_params.delete(key_string)
      user_params.delete(key_symbol)
    else
      user_params[key_string] = value
      user_params[key_symbol] = value if user_params.key?(key_symbol)
    end
  end

  def request_user_params
    return unless request.respond_to?(:request_parameters)

    request_params = request.request_parameters
    return unless request_params.is_a?(Hash)

    user_params = request_params["user"] || request_params[:user]

    unless user_params.is_a?(Hash)
      user_params = {}
      request_params["user"] = user_params
    end

    user_params
  end
end
