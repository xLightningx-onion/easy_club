# frozen_string_literal: true

class Voucher < ApplicationRecord
  include TenantScoped

  belongs_to :club

  monetize :balance_cents

  validates :code, presence: true
end
