# frozen_string_literal: true

class ClubRole < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :user

  enum :role, {
    parent: "parent",
    coach: "coach",
    manager: "manager",
    finance: "finance",
    admin: "admin"
  }, prefix: true
end
