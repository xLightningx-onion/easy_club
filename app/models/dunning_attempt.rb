# frozen_string_literal: true

class DunningAttempt < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :invoice

  enum :status, {
    scheduled: "scheduled",
    retried: "retried",
    failed: "failed",
    cancelled: "cancelled",
    succeeded: "succeeded"
  }, prefix: true
end
