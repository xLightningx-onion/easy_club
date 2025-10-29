# frozen_string_literal: true

class OrderPolicy < ApplicationPolicy
  def index?
    staff?
  end

  def show?
    staff? || owns_order?
  end

  scope_for :relation do |relation|
    return relation if staff?
    return relation.none unless user

    rel = relation
    rel = rel.where(club_id: scoped_club.id) if scoped_club && rel.column_names.include?("club_id")
    rel.where(user_id: user.id)
  end

  private

  def owns_order?
    user && record.respond_to?(:user_id) && record.user_id == user.id
  end
end
