# frozen_string_literal: true

class TeamPolicy < ApplicationPolicy
  def index?
    staff? || club_admin? || coach?
  end

  def show?
    index?
  end

  def manage_squad?
    staff? || club_admin? || coach?
  end

  def update?
    staff? || club_admin?
  end

  def destroy?
    staff? || club_admin?
  end

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
