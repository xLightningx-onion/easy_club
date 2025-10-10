# frozen_string_literal: true

class Competition < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :season

  has_many :divisions, dependent: :destroy
end
