# frozen_string_literal: true

class Club::BaseController < ApplicationController
  before_action :authenticate_user!
  before_action :ensure_club_context
  helper_method :current_cart, :manageable_members

  private

  def ensure_club_context
    return if current_club.present?

    redirect_to new_user_session_path, alert: "We couldn't determine your club. Please sign in again."
  end

  def current_cart
    @current_cart ||= begin
      Cart.unpaid.find_by(user: current_user, club: current_club) ||
        Cart.create!(user: current_user, club: current_club)
    end
  end

  def manageable_members
    return Member.none unless current_user && current_club

    member_ids = current_user.members.where(club: current_club).pluck(:id)
    guardian_ids = current_user.guarded_members.where(club: current_club).pluck(:id)
    ids = (member_ids + guardian_ids).uniq

    return Member.none if ids.empty?

    policy_scope(Member).where(id: ids).includes(:club).order(:last_name, :first_name)
  end
end
