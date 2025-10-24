# frozen_string_literal: true

Devise.setup do |config|
  config.mailer_sender = ENV.fetch("MAIL_FROM_DEFAULT", "no-reply@example.com")

  require "devise/orm/active_record"

  config.case_insensitive_keys = [ :email ]
  config.strip_whitespace_keys = [ :email ]

  config.skip_session_storage = [ :http_auth ]

  config.stretches = Rails.env.test? ? 1 : 12

  config.reconfirmable = false
  config.password_length = 12..128
  config.reset_password_within = 6.hours

  config.sign_out_via = :delete

  google_client_id = ENV["GOOGLE_CLIENT_ID"].presence
  google_client_secret = ENV["GOOGLE_CLIENT_SECRET"].presence

  if google_client_id && google_client_secret
    scopes = [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ]

    if ENV["GOOGLE_ENABLE_PHONE_SCOPE"].to_s.casecmp("true").zero?
      scopes << "https://www.googleapis.com/auth/user.phonenumbers.read"
    end

    config.omniauth :google_oauth2,
                    google_client_id,
                    google_client_secret,
                    prompt: "select_account",
                    scope: scopes,
                    access_type: "offline",
                    image_aspect_ratio: "square",
                    image_size: 200,
                    callback_path: "/users/auth/google_oauth2/callback"
  end
end
