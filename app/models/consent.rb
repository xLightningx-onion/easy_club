# frozen_string_literal: true

class Consent < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :member
  belongs_to :consent_type
  belongs_to :accepted_by, class_name: "User", optional: true

  scope :accepted, -> { where(accepted: true) }
end
