# frozen_string_literal: true

class ConsentPolicy < ApplicationPolicy
  def index?
    staff? || club_admin? || coach?
  end

  def new?
    manage?
  end

  def create?
    manage?
  end

  private

  def manage?
    staff? || club_admin? || guardian_of?(record.member)
  end
end
