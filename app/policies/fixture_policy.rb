# frozen_string_literal: true

class FixturePolicy < ApplicationPolicy
  def index?
    staff? || club_admin? || coach?
  end

  def show?
    index?
  end

  def availability?
    staff? || club_admin? || coach? || member_of_team?
  end

  def update?
    staff? || club_admin? || coach?
  end

  private

  def member_of_team?
    return false unless user && record

    record.team.members.exists?(id: user.members.select(:id)) ||
      record.team.members.joins(:guardianships).where(guardianships: { guardian_id: user.id }).exists?
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
