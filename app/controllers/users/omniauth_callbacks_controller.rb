class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def google_oauth2
    auth = request.env["omniauth.auth"]
    club_id = oauth_params["club_id"].presence

    @user = User.from_omniauth(auth)
    sign_in(@user)
    set_flash_message!(:notice, :success, kind: "Google") if is_navigational_format?

    redirect_path = redirect_path_for(@user, club_id)

    respond_to do |format|
      format.html { redirect_to redirect_path }
      format.turbo_stream { redirect_to redirect_path, status: :see_other }
    end
  rescue ActiveRecord::RecordInvalid => e
    session["devise.google_data"] = auth.except("extra") if defined?(auth) && auth.present?
    redirect_to new_user_registration_path(club_id: club_id),
                alert: e.record.errors.full_messages.to_sentence
  end

  def failure
    redirect_to new_user_session_path, alert: "Google sign in failed. Please try again or use your email and password."
  end

  private

  def oauth_params
    request.env.fetch("omniauth.params", {}).with_indifferent_access
  end

  def redirect_path_for(user, club_id)
    return membership_registration_path_for(user, club_id) if club_id.present?

    stored_location_for(user) || default_redirect_for(user)
  end

  def membership_registration_path_for(user, club_id)
    store_registration_club(user, club_id)
    main_app.members_membership_registration_path(
      step: Members::MembershipRegistrationsController::STEPS.first,
      club_id: club_id
    )
  end

  def default_redirect_for(user)
    if user.respond_to?(:staff?) && user.staff?
      main_app.admin_dashboard_path
    elsif user.respond_to?(:club_roles) && user.club_roles.exists?
      main_app.club_root_path
    else
      main_app.members_path
    end
  end

  def store_registration_club(user, club_id)
    return unless club_id.present?

    session[:membership_registration] ||= {}
    user_key = "user_#{user.id}"
    session[:membership_registration][user_key] ||= {}
    session[:membership_registration][user_key][:club_id] = club_id
  end
end
