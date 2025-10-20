# frozen_string_literal: true

class Club::PlansController < Club::BaseController
  def index
    authorize! Plan, :index?
    @plans = policy_scope(Plan).includes(:product)
    @members = manageable_members
  end
end
