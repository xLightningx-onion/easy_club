# frozen_string_literal: true

class Members::SelectionsController < Members::ApplicationController
  before_action :set_frame_id

  def new
    @clubs = fetch_known_clubs
    render partial: "members/selections/modal", locals: { clubs: @clubs, frame_id: @frame_id, selected_club_id: selected_club_id }
  end

  def search
    @query = params[:query].to_s.strip
    @clubs = search_clubs(@query)
    if turbo_frame_results_request?
      render partial: "members/selections/results", locals: { clubs: @clubs, query: @query, selected_club_id: selected_club_id }
    else
      render partial: "members/selections/search", locals: { clubs: @clubs, frame_id: @frame_id, query: @query, selected_club_id: selected_club_id }
    end
  end

  private

  def set_frame_id
    @frame_id = params[:frame_id].presence || request.headers["Turbo-Frame"] || "members_selection_modal"
  end

  def fetch_known_clubs
    member_clubs = current_user.members.includes(:club).map(&:club)
    guardian_clubs = current_user.guarded_members.includes(:club).map(&:club)
    role_clubs = current_user.clubs.to_a

    (member_clubs + guardian_clubs + role_clubs).compact.uniq { |club| club.id }
  end

  def search_clubs(query)
    scope = Club.publicly_listed.order(:name)
    scope = scope.where("name ILIKE ?", "%#{sanitize_sql_like(query)}%") if query.present?
    scope.limit(50)
  end

  def sanitize_sql_like(string)
    ActiveRecord::Base.sanitize_sql_like(string)
  end

  def turbo_frame_results_request?
    request.headers["Turbo-Frame"] == "#{@frame_id}_results"
  end

  def selected_club_id
    session.dig(:membership_registration, current_user_session_key, :club_id)
  end

  def current_user_session_key
    "user_#{current_user.id}"
  end
end
