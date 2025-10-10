# frozen_string_literal: true

class Wallet < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :user

  has_many :wallet_entries, dependent: :destroy

  monetize :balance_cents
end
