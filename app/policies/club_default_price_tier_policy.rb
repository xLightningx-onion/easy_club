# frozen_string_literal: true

class ClubDefaultPriceTierPolicy < ApplicationPolicy
  def index?
    staff? || club_admin?
  end

  alias show? index?
  alias create? index?
  alias update? index?
  alias destroy? index?

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
