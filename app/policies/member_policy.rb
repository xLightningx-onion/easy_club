# frozen_string_literal: true

class MemberPolicy < ApplicationPolicy
  def index?
    staff? || club_admin? || coach?
  end

  def show?
    staff? || club_admin? || coach? || guardian_of?(record) || record.user_id == user&.id
  end

  def new?
    create?
  end

  def create?
    staff? || club_admin?
  end

  def edit?
    update?
  end

  def update?
    staff? || club_admin? || coach?
  end

  def destroy?
    staff? || club_admin?
  end

  def view_medical?
    staff? || club_admin? || coach?
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
