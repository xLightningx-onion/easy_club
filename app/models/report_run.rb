# frozen_string_literal: true

class ReportRun < ApplicationRecord
  include TenantScoped

  belongs_to :club

  enum :status, {
    queued: "queued",
    processing: "processing",
    ready: "ready",
    failed: "failed"
  }, prefix: true
end
