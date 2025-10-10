# frozen_string_literal: true

module Reports
  class RefreshJob < ApplicationJob
    queue_as :default

    def perform(club_id)
      club = Club.find(club_id)
      Reports::Finance.new(club: club).summary
      Reports::Participation.new(club: club).summary
      Reports::Compliance.new(club: club).summary
    end
  end
end
