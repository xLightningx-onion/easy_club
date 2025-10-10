# frozen_string_literal: true

class Division < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :competition

  has_many :teams
end
