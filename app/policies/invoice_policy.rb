# frozen_string_literal: true

class InvoicePolicy < ApplicationPolicy
  def index?
    staff? || club_admin? || finance?
  end

  def show?
    staff? || club_admin? || finance? || member_or_guardian?
  end

  def pay?
    show?
  end

  def reconcile?
    staff? || finance?
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

  private

  def member_or_guardian?
    return false unless user && record

    record.member.user_id == user.id || guardian_of?(record.member)
  end
end
