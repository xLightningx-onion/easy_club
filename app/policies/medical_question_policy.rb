# frozen_string_literal: true

class MedicalQuestionPolicy < ApplicationPolicy
  def index?
    staff? || club_admin? || coach?
  end

  alias show? index?
  alias create? index?
  alias new? create?
  alias update? index?
  alias edit? update?
  alias destroy? index?
  alias toggle? index?

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
