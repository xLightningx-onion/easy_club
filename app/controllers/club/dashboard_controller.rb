# frozen_string_literal: true

class Club::DashboardController < Club::BaseController
  def show
    authorize! current_club, :show?

    @members = policy_scope(Member).limit(5).includes(:user)
    @invoices = policy_scope(Invoice).order(due_at: :asc).limit(5)
    @fixtures = policy_scope(Fixture).order(match_date: :asc).limit(5)
  end
end
