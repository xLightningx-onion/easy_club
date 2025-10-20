# frozen_string_literal: true

class OrderPolicy < ApplicationPolicy
  def index?
    staff?
  end

  def show?
    staff?
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
