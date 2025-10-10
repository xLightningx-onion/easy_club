# frozen_string_literal: true

class WalletEntry < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :wallet
  belongs_to :payment, optional: true

  monetize :amount_cents
end
