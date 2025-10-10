# frozen_string_literal: true

module Eligibility
  class Engine
    def self.suggest(member:, season:)
      cutoff = season&.dob_cutoff || season&.starts_on || Date.today
      return nil unless member.dob

      age_in_years = ((cutoff - member.dob).to_i / 365.25).floor
      AgeBand.where(club_id: member.club_id)
             .where("min_age_years <= ? AND max_age_years >= ?", age_in_years, age_in_years)
             .first
    end

    def self.allowed?(member:, team:)
      return true unless team.age_band

      band = suggest(member: member, season: team.season)
      band&.id == team.age_band_id
    end
  end
end
