# frozen_string_literal: true

class AdminDashboardPolicy < ApplicationPolicy
  authorize :record, optional: true

  def show?
    staff?
  end
end
