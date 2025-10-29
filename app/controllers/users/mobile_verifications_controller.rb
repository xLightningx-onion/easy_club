# frozen_string_literal: true

class Users::MobileVerificationsController < ApplicationController
  before_action :authenticate_user!
  before_action :redirect_if_not_required, only: %i[new create verify confirm resend]
  before_action :ensure_verification_session, only: %i[verify confirm resend]

  def new
    @form = MobileVerificationForm.new(user: current_user)
  end

  def create
    @form = MobileVerificationForm.new(user: current_user)

    if @form.submit(mobile_verification_params.to_h)
      current_user.initiate_mobile_verification!
      redirect_to verify_users_mobile_verification_path,
                  notice: "We sent you a verification code. Please enter it below to confirm your number."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def verify
  end

  def confirm
    submitted_code = params.dig(:mobile_verification, :code).to_s.gsub(/\D+/, "")
    submitted_code = submitted_code[0, User::MOBILE_VERIFICATION_CODE_LENGTH] if submitted_code.present?

    if submitted_code.blank?
      flash.now[:alert] = "Please enter the verification code we sent to your phone."
      render :verify, status: :unprocessable_entity and return
    end

    if current_user.verify_mobile_code(submitted_code)
      redirect_to consume_post_mobile_capture_path(default_after_mobile_path),
                  notice: "Your mobile number is verified. Thank you!"
    else
      flash.now[:alert] = "That code was invalid or has expired. Please try again."
      render :verify, status: :unprocessable_entity
    end
  end

  def resend
    current_user.initiate_mobile_verification!
    redirect_to verify_users_mobile_verification_path,
                notice: "We sent you a new verification code."
  end

  private

  def mobile_verification_params
    params.require(:mobile_verification).permit(:country_code, :mobile_number)
  end

  def redirect_if_not_required
    return if current_user.mobile_details_missing?
    return if current_user.mobile_verification_code_digest.present?

    redirect_to consume_post_mobile_capture_path(default_after_mobile_path)
  end

  def ensure_verification_session
    if current_user.mobile_verification_code_digest.blank?
      current_user.initiate_mobile_verification!
    elsif current_user.mobile_verification_expired?
      current_user.initiate_mobile_verification!
      flash[:notice] = "We sent you a fresh verification code because the previous one expired."
    end
  end

  def default_after_mobile_path
    stored_location_for(current_user) || default_signed_in_path_for(current_user)
  end
end
