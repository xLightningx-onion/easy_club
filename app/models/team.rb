# frozen_string_literal: true

class Team < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :season
  belongs_to :age_band, optional: true

  has_many :team_memberships, dependent: :destroy
  has_many :members, through: :team_memberships
  has_many :fixtures, dependent: :destroy
end
