class SendMobilePasswordResetCodeJob < ApplicationJob
  queue_as :default

  def perform(user_id, code, club_id = nil)
    user = User.find_by(id: user_id)
    return unless user

    club = club_id ? Club.find_by_param(club_id) : nil

    Notifications::MobileVerificationNotifier.new(user:, code:, club:).deliver
  end
end

