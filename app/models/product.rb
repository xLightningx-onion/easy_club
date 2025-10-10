# frozen_string_literal: true

class Product < ApplicationRecord
  include TenantScoped

  belongs_to :club

  has_many :plans, dependent: :destroy
  has_many :invoice_items

  validates :name, presence: true

  monetize :price_cents
end
