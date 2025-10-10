# frozen_string_literal: true

class PriceRule < ApplicationRecord
  include TenantScoped

  belongs_to :club

  enum :rule_type, {
    family_discount: "family_discount",
    early_bird: "early_bird",
    sibling_cap: "sibling_cap",
    scholarship: "scholarship",
    voucher: "voucher"
  }

  scope :active, -> { where(active: true) }
end
