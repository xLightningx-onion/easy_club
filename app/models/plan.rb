# frozen_string_literal: true

class Plan < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :product
  has_many :cart_items, dependent: :destroy
  has_many :order_items, dependent: :restrict_with_exception

  enum :plan_type, {
    once_off: "once_off",
    recurring: "recurring",
    installments: "installments"
  }, prefix: true
end
