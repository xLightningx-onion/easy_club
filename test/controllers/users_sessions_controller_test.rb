# frozen_string_literal: true

require "test_helper"

class UsersSessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(
      email: "login-check@example.com",
      password: "Password123!",
      password_confirmation: "Password123!",
      first_name: "Login",
      last_name: "Tester",
      country_code: "+27",
      mobile_number: "831234567",
      terms_agreement: true,
      skip_terms_validation: true
    )
  end

  test "signs in with email" do
    post user_session_path,
         params: {
           user: {
             login: @user.email,
             password: "Password123!",
             country_code: @user.country_code
           }
         }

    assert_response :redirect
    assert session.key?("warden.user.user.key"), "expected user session to be established"
  end

  test "signs in with mobile number" do
    post user_session_path,
         params: {
           user: {
             login: "+27 #{@user.mobile_number}",
             password: "Password123!",
             country_code: "+27"
           }
         }

    assert_response :redirect
    assert session.key?("warden.user.user.key"), "expected user session to be established"
  end
end
