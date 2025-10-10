# frozen_string_literal: true

class BroadcastPolicy < ApplicationPolicy
  def index?
    staff? || club_admin?
  end

  def show?
    index?
  end

  def create?
    staff? || club_admin?
  end

  def approve?
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
