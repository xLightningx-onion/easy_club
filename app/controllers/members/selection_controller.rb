# frozen_string_literal: true

class Members::SelectionController < Members::ApplicationController
  before_action :authenticate_user!

  def new
    @clubs = fetch_known_clubs
    render partial: "memberships/selection/modal", locals: { clubs: @clubs }
  end

  private

  def fetch_known_clubs
    member_clubs = current_user.members.includes(:club).map(&:club)
    guardian_clubs = current_user.guarded_members.includes(:club).map(&:club)
    role_clubs = current_user.clubs.to_a

    (member_clubs + guardian_clubs + role_clubs).compact.uniq { |club| club.id }
  end
end
