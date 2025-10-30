# frozen_string_literal: true

class Users::PasswordsController < Devise::PasswordsController
  before_action :set_club
  before_action :ensure_mobile_reset_session!, only: %i[verify_mobile confirm_mobile resend_mobile]
  skip_before_action :verify_authenticity_token, only: :confirm_mobile

  def new
    self.resource = resource_class.new
    @mobile_password_reset_form = MobilePasswordResetRequestForm.new
    respond_with(resource)
  end

  def create
    if mobile_reset_request?
      handle_mobile_reset_request
    else
      @mobile_password_reset_form = MobilePasswordResetRequestForm.new
      super
    end
  end

  def verify_mobile
    @mobile_password_reset_verification_form = MobilePasswordResetVerificationForm.new
    @mobile_reset_number = mobile_reset_number_for_display
  end

  def confirm_mobile
    @mobile_password_reset_verification_form =
      MobilePasswordResetVerificationForm.new(mobile_verification_params)
    @mobile_reset_number = mobile_reset_number_for_display

    if @mobile_password_reset_verification_form.valid?
      user = mobile_reset_user
      sanitized_code = @mobile_password_reset_verification_form.sanitized_code

      if sanitized_code.present? && (token = user.consume_mobile_password_reset_code!(sanitized_code))
        session.delete(:mobile_password_reset)
        redirect_to edit_user_password_path(reset_password_token: token),
                    notice: "Code confirmed. You can now reset your password."
      else
        flash.now[:alert] = "That code was invalid or has expired. Please try again."
        render :verify_mobile, status: :unprocessable_entity
      end
    else
      flash.now[:alert] = "Please enter the verification code we sent to your phone."
      render :verify_mobile, status: :unprocessable_entity
    end
  end

  def resend_mobile
    user = mobile_reset_user
    user.initiate_mobile_password_reset!(club: @club)
    redirect_to verify_user_password_mobile_path(club_id: @club&.to_param),
                notice: "We sent you a new verification code."
  rescue StandardError => error
    Rails.logger.error("[MobilePasswordReset] Failed to resend code: #{error.class} #{error.message}")
    redirect_to verify_user_password_mobile_path(club_id: @club&.to_param),
                alert: "We couldn't resend the code right now. Please try again shortly."
  end

  private

  def set_club
    club_param = params[:club_id].presence || session.dig(:mobile_password_reset, "club_id")
    @club = Club.find_by_param(club_param) if club_param.present?
  end

  def mobile_reset_request?
    params[:reset_method] == "mobile"
  end

  def handle_mobile_reset_request
    @mobile_password_reset_form = MobilePasswordResetRequestForm.new(mobile_reset_params)
    self.resource = resource_class.new

    if @mobile_password_reset_form.valid?
      user = find_user_for_mobile_reset

      if user
        user.initiate_mobile_password_reset!(club: @club)
        session[:mobile_password_reset] = {
          "user_id" => user.id,
          "country_code" => @mobile_password_reset_form.normalized_country_code,
          "mobile_number" => @mobile_password_reset_form.normalized_mobile_number,
          "club_id" => @club&.to_param
        }
        redirect_to verify_user_password_mobile_path(club_id: @club&.to_param),
                    notice: "We sent you a verification code. Enter it below to continue."
      else
        @mobile_password_reset_form.errors.add(:base, "We couldn't find an account with that mobile number.")
        respond_with_navigational(resource) { render :new, status: :unprocessable_entity }
      end
    else
      respond_with_navigational(resource) { render :new, status: :unprocessable_entity }
    end
  rescue StandardError => error
    Rails.logger.error("[MobilePasswordReset] Failed to initiate reset: #{error.class} #{error.message}")
    flash.now[:alert] = "We couldn't start the password reset right now. Please try again."
    respond_with_navigational(resource) { render :new, status: :unprocessable_entity }
  end

  def find_user_for_mobile_reset
    resource_class.find_by(
      country_code: @mobile_password_reset_form.normalized_country_code,
      mobile_number: @mobile_password_reset_form.normalized_mobile_number
    )
  end

  def ensure_mobile_reset_session!
    unless mobile_reset_user
      session.delete(:mobile_password_reset)
      redirect_to new_user_password_path(club_id: @club&.to_param),
                  alert: "Please start the password reset process again." and return
    end
  end

  def mobile_reset_session
    session[:mobile_password_reset] || {}
  end

  def mobile_reset_user
    user_id = mobile_reset_session["user_id"]
    return nil if user_id.blank?

    @mobile_reset_user ||= resource_class.find_by(id: user_id)
  end

  def mobile_reset_number_for_display
    mobile_number = mobile_reset_session["mobile_number"]

    if mobile_number.present?
      mobile_number
    else
      nil
    end
  end

  def mobile_reset_params
    params.require(:mobile_password_reset).permit(:country_code, :mobile_number)
  end

  def mobile_verification_params
    params.require(:mobile_password_reset_verification).permit(:code)
  end
end
