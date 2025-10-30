# frozen_string_literal: true

require "test_helper"

class UsersRegistrationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(
      email: "mobile-check@example.com",
      password: "Password123!",
      password_confirmation: "Password123!",
      first_name: "Mobile",
      last_name: "Check",
      country_code: "+27",
      mobile_number: "831234567",
      terms_agreement: true,
      skip_terms_validation: true
    )
  end

  test "mobile lookup returns exists true for matching number" do
    get users_mobile_lookup_path, params: { country_code: "+27", mobile_number: "083 123 4567" }, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal true, body["exists"], "expected mobile lookup to report existing account"
  end

  test "mobile lookup returns exists false when not found" do
    get users_mobile_lookup_path, params: { country_code: "+1", mobile_number: "5550001234" }, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal false, body["exists"], "expected mobile lookup to report account missing"
  end
end
