# frozen_string_literal: true

class PlanPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    index?
  end

  scope_for :relation do |relation|
    if scoped_club
      relation.where(club_id: scoped_club.id)
    else
      relation.none
    end
  end
end
