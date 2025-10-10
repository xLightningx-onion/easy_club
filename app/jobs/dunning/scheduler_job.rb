# frozen_string_literal: true

module Dunning
  class SchedulerJob < ApplicationJob
    queue_as :default

    def perform
      Invoice.past_due.includes(:club).find_each do |invoice|
        next if invoice.total_cents.zero?

        Dunning::AttemptJob.perform_later(invoice.id)
      end
    end
  end
end
