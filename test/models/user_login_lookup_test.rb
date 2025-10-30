# frozen_string_literal: true

require "test_helper"

class UserLoginLookupTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(
      email: "lookup@example.com",
      password: "Password123!",
      password_confirmation: "Password123!",
      first_name: "Lookup",
      last_name: "Tester",
      country_code: "+27",
      mobile_number: "831234567",
      terms_agreement: true,
      skip_terms_validation: true
    )
  end

  test "find_by_full_mobile matches formatted number" do
    assert_equal @user, User.find_by_full_mobile("+27 83 123 4567")
  end

  test "find_by_full_mobile matches digits with country code" do
    assert_equal @user, User.find_by_full_mobile("27831234567")
  end

  test "find_by_full_mobile matches digits without country code" do
    assert_equal @user, User.find_by_full_mobile("0831234567")
  end

  test "find_by_full_mobile returns nil when not found" do
    assert_nil User.find_by_full_mobile("9999999999")
  end
end

