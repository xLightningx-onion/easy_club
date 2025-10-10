# frozen_string_literal: true

class Plan < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :product

  enum :plan_type, {
    once_off: "once_off",
    recurring: "recurring",
    installments: "installments"
  }, prefix: true
end
