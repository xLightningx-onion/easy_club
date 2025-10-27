class SendMobileVerificationJob < ApplicationJob
  queue_as :default

  def perform(user_id, code)
    user = User.find_by(id: user_id)
    return unless user

    Notifications::MobileVerificationNotifier.new(user:, code:).deliver
  end
end

