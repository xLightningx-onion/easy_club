# frozen_string_literal: true

class Fixture < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :team

  has_many :availabilities, dependent: :destroy
end
