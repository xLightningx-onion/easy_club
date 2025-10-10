# frozen_string_literal: true

class Season < ApplicationRecord
  include TenantScoped

  belongs_to :club

  has_many :competitions, dependent: :destroy
  has_many :teams, dependent: :destroy
end
