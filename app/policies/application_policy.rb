# frozen_string_literal: true

class ApplicationPolicy < ActionPolicy::Base
  authorize :user, optional: true
  authorize :club, optional: true

  scope_for :relation do |relation|
    if scoped_club
      relation.where(club_id: scoped_club.id) if relation.column_names.include?("club_id")
    else
      relation
    end
  end

  private

  def scoped_club
    club || derive_club_from_record
  end

  def derive_club_from_record
    return record.club if record.respond_to?(:club)
    return Club.find_by_param(record.club_id) if record.respond_to?(:club_id)

    Club.current
  end

  def staff?
    user&.staff?
  end

  def club_admin?
    staff? || user&.role_admin? || club_role_in?(%w[admin manager finance])
  end

  def coach?
    club_role_in?(%w[coach manager])
  end

  def finance?
    club_role_in?(%w[finance admin])
  end

  def guardian_of?(member)
    return false unless user && member

    Guardianship.exists?(club_id: scoped_club&.id || member.club_id, guardian_id: user.id, member_id: member.id)
  end

  def club_role_in?(roles)
    return false unless user && scoped_club

    @club_role_cache ||= user.club_roles.where(club: scoped_club).pluck(:role)
    (roles & @club_role_cache).any?
  end
end
