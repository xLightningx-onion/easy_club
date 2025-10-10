# frozen_string_literal: true

require "csv"

module Reports
  class Participation
    def initialize(club:)
      @club = club
    end

    def summary
      {
        total_members: members.count,
        by_role: members.group(:role).count,
        by_age_band: team_counts
      }
    end

    def to_csv
      CSV.generate(headers: true) do |csv|
        csv << ["Member", "Role", "Teams"]
        members.includes(:teams).find_each do |member|
          csv << [member.full_name, member.role, member.teams.map(&:name).join("; ")]
        end
      end
    end

    private

    attr_reader :club

    def members
      club.members
    end

    def team_counts
      club.teams.includes(:members).each_with_object({}) do |team, memo|
        memo[team.name] = team.members.count
      end
    end
  end
end
