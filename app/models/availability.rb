# frozen_string_literal: true

class Availability < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :fixture
  belongs_to :member

  enum :status, {
    unknown: "unknown",
    yes: "yes",
    no: "no",
    maybe: "maybe"
  }, prefix: true
end
