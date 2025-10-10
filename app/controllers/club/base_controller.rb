# frozen_string_literal: true

class Club::BaseController < ApplicationController
  before_action :authenticate_user!
  before_action :ensure_club_context

  private

  def ensure_club_context
    return if current_club.present?

    redirect_to new_user_session_path, alert: "We couldn't determine your club. Please sign in again."
  end
end
