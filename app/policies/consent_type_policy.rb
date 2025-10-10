# frozen_string_literal: true

class ConsentTypePolicy < ApplicationPolicy
  def index?
    staff? || club_admin? || coach?
  end

  def show?
    index?
  end

  def create?
    staff? || club_admin?
  end

  alias update? create?
  alias destroy? create?

  scope_for :relation do |relation|
    if staff?
      relation
    elsif scoped_club
      relation.where(club_id: scoped_club.id)
    else
      relation.none
    end
  end
end
