# frozen_string_literal: true

class Public::ClubsController < ApplicationController
  skip_around_action :set_current_club_context

  def index
    @clubs = Club.publicly_listed.order(:name)
    @clubs_with_location = @clubs.select(&:location?)
  end

  def show
    @club = Club.publicly_listed.find(params[:id])
  end
end
