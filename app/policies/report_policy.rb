# frozen_string_literal: true

class ReportPolicy < ApplicationPolicy
  authorize :record, optional: true

  def index?
    staff? || club_admin? || finance?
  end

  alias finance? index?
  alias participation? index?
  alias compliance? index?
  alias ar_aging? index?
end
