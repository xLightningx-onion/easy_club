# frozen_string_literal: true

class TeamMembership < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :team
  belongs_to :member

  enum :role, {
    player: "player",
    coach: "coach",
    manager: "manager"
  }, prefix: true
end
