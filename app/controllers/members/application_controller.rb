class Members::ApplicationController < ApplicationController
  before_action :authenticate_user!
  helper_method :current_cart, :manageable_members

  private

  def current_cart
    return nil unless current_user

    club = current_club
    return nil unless club

    @current_carts ||= {}
    @current_carts[club.id] ||= Cart.unpaid.find_by(user: current_user, club:) || Cart.create!(user: current_user, club:)
  end

  def manageable_members
    return Member.none unless current_user

    club = current_club
    return Member.none unless club

    member_ids = current_user.members.where(club:).pluck(:id)
    guardian_ids = current_user.guarded_members.where(club:).pluck(:id)
    ids = (member_ids + guardian_ids).uniq

    return Member.none if ids.empty?

    policy_scope(Member)
      .where(id: ids)
      .includes(:club)
      .order(:last_name, :first_name)
  end
end
