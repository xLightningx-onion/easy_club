# frozen_string_literal: true

class ClubPolicy < ApplicationPolicy
  def show?
    staff? || club_admin? || coach? || member_of_club?
  end

  def update?
    staff? || club_admin?
  end

  private

  def member_of_club?
    return false unless user && scoped_club

    user.club_roles.where(club: scoped_club).exists?
  end
end
