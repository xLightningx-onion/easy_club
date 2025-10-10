# frozen_string_literal: true

class Admin::BaseController < ApplicationController
  layout "admin"
  helper Admin::NavigationHelper
  before_action :authenticate_user!
  before_action :require_staff!

  private

  def require_staff!
    return if current_user&.staff?

    redirect_to root_path, alert: "Staff access required."
  end
end
