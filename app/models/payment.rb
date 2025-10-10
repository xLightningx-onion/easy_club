# frozen_string_literal: true

class Payment < ApplicationRecord
  include TenantScoped
  audited associated_with: :club

  belongs_to :club
  belongs_to :invoice

  enum :status, {
    pending: "pending",
    succeeded: "succeeded",
    failed: "failed",
    cancelled: "cancelled"
  }, prefix: true

  monetize :amount_cents
end
