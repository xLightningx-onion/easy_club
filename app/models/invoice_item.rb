# frozen_string_literal: true

class InvoiceItem < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :invoice
  belongs_to :product, optional: true

  monetize :unit_price_cents
  monetize :amount_cents
end
