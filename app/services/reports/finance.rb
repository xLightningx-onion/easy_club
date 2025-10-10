# frozen_string_literal: true

require "csv"

module Reports
  class Finance
    def initialize(club:)
      @club = club
    end

    def summary
      {
        open_total: format_money(scope.open.sum(:total_cents)),
        past_due_total: format_money(scope.past_due.sum(:total_cents)),
        payments_last_30d: format_money(club.payments.status_succeeded.where("created_at >= ?", 30.days.ago).sum(:amount_cents))
      }
    end

    def to_csv
      CSV.generate(headers: true) do |csv|
        csv << ["Number", "Member", "Status", "Due", "Total"]
        scope.includes(:member).find_each do |invoice|
          csv << [
            invoice.number,
            invoice.member.full_name,
            invoice.status,
            invoice.due_at,
            format_money(invoice.total_cents)
          ]
        end
      end
    end

    private

    attr_reader :club

    def scope
      club.invoices
    end

    def format_money(cents)
      Money.new(cents || 0, club_default_currency).format
    end

    def club_default_currency
      club.settings.dig("finance", "currency") rescue "ZAR"
    end
  end
end
