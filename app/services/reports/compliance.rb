# frozen_string_literal: true

require "csv"

module Reports
  class Compliance
    def initialize(club:)
      @club = club
    end

    def summary
      total_consent_types = club.consent_types.count
      compliant_members = club.members.count do |member|
        member.consents.where(accepted: true).distinct.count(:consent_type_id) == total_consent_types
      end

      {
        total_members: club.members.count,
        consent_types: total_consent_types,
        compliant_members: compliant_members
      }
    end

    def to_csv
      CSV.generate(headers: true) do |csv|
        csv << ["Member", "Accepted consents", "Total consents"]
        total = club.consent_types.count
        club.members.includes(:consents).find_each do |member|
          accepted = member.consents.where(accepted: true).distinct.count(:consent_type_id)
          csv << [member.full_name, accepted, total]
        end
      end
    end

    private

    attr_reader :club
  end
end
