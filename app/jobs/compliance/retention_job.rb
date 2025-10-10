# frozen_string_literal: true

module Compliance
  class RetentionJob < ApplicationJob
    queue_as :low

    def perform(club_id)
      club = Club.find(club_id)
      # Placeholder: implement data minimisation.
      Rails.logger.info("Retention job executed for #{club.name}")
    end
  end
end
