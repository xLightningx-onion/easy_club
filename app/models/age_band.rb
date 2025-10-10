# frozen_string_literal: true

class AgeBand < ApplicationRecord
  include TenantScoped

  belongs_to :club
  has_many :teams
end
