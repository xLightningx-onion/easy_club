# frozen_string_literal: true

class Invoice < ApplicationRecord
  include TenantScoped
  audited associated_with: :club

  belongs_to :club
  belongs_to :member
  belongs_to :family_account, class_name: "User", optional: true

  has_many :invoice_items, dependent: :destroy
  has_many :payments, dependent: :destroy
  has_many :dunning_attempts, dependent: :destroy

  enum :status, {
    open: "open",
    paid: "paid",
    past_due: "past_due",
    void: "void"
  }, prefix: true

  monetize :subtotal_cents
  monetize :discount_cents
  monetize :vat_cents
  monetize :total_cents

  scope :past_due, -> { where(status: :past_due) }
end
