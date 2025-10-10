# frozen_string_literal: true

class OutboundMessage < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :broadcast
  belongs_to :member, optional: true

  enum :status, {
    queued: "queued",
    sending: "sending",
    delivered: "delivered",
    failed: "failed"
  }, prefix: true
end
