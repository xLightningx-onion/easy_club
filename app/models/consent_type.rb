# frozen_string_literal: true

class ConsentType < ApplicationRecord
  include TenantScoped

  belongs_to :club
  has_many :consents, dependent: :destroy

  validates :key, presence: true
end
