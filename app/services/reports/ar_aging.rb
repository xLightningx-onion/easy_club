# frozen_string_literal: true

require "csv"

module Reports
  class ArAging
    BUCKETS = {
      "Current" => 0..0,
      "1-30" => 1..30,
      "31-60" => 31..60,
      "61-90" => 61..90,
      "90+" => 91..365
    }.freeze

    def initialize(club:)
      @club = club
    end

    def summary
      totals = Hash.new(0)
      overdue_invoices.find_each do |invoice|
        bucket_label = bucket_for(invoice)
        totals[bucket_label] += invoice.total_cents
      end

      totals.transform_values { |cents| Money.new(cents, currency).format }
    end

    def to_csv
      CSV.generate(headers: true) do |csv|
        csv << ["Invoice", "Member", "Due", "Days overdue", "Total", "Bucket"]
        overdue_invoices.includes(:member).find_each do |invoice|
          csv << [
            invoice.number,
            invoice.member.full_name,
            invoice.due_at,
            days_overdue(invoice),
            Money.new(invoice.total_cents, currency).format,
            bucket_for(invoice)
          ]
        end
      end
    end

    private

    attr_reader :club

    def currency
      club.settings.dig("finance", "currency") rescue "ZAR"
    end

    def overdue_invoices
      club.invoices.where("due_at < ? AND status IN (?)", Date.today, %w[open past_due])
    end

    def days_overdue(invoice)
      (Date.today - (invoice.due_at || Date.today)).to_i
    end

    def bucket_for(invoice)
      days = days_overdue(invoice)
      BUCKETS.each do |label, range|
        return label if range.cover?(days)
      end
      "90+"
    end
  end
end
