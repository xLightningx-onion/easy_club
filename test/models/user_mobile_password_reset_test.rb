# frozen_string_literal: true

require "test_helper"

class UserMobilePasswordResetTest < ActiveSupport::TestCase
  include ActiveJob::TestHelper
  include ActiveSupport::Testing::TimeHelpers

  setup do
    clear_enqueued_jobs
    @user = User.create!(
      email: "reset@example.com",
      password: "Password123!",
      password_confirmation: "Password123!",
      first_name: "Reset",
      last_name: "User",
      country_code: "+27",
      mobile_number: "831234567",
      terms_agreement: true,
      skip_terms_validation: true
    )
  end

  teardown { clear_enqueued_jobs }

  test "initiates mobile password reset and enqueues whatsapp job" do
    travel_to Time.current do
      assert_enqueued_with(job: SendMobilePasswordResetCodeJob) do
        code = @user.initiate_mobile_password_reset!
        assert_equal User::MOBILE_VERIFICATION_CODE_LENGTH, code.length
      end

      @user.reload
      assert_not_nil @user.mobile_password_reset_code_digest
      assert_not_nil @user.mobile_password_reset_sent_at

      assert_equal @user.id, enqueued_jobs.last[:args][0]
    end
  end

  test "consumes mobile password reset code and clears state" do
    travel_to Time.current do
      code = @user.initiate_mobile_password_reset!
      token = @user.consume_mobile_password_reset_code!(code)

      assert token.present?, "Expected reset token when code is valid"

      @user.reload
      assert_nil @user.mobile_password_reset_code_digest
      assert_nil @user.mobile_password_reset_sent_at
    end
  end

  test "rejects invalid or expired mobile password reset code" do
    travel_to Time.current do
      code = @user.initiate_mobile_password_reset!
      assert_not @user.verify_mobile_password_reset_code("000000"), "Should reject wrong code"

      travel User::MOBILE_PASSWORD_RESET_CODE_TTL + 1.minute do
        assert_not @user.verify_mobile_password_reset_code(code), "Should reject expired code"
      end
    end
  end
end
