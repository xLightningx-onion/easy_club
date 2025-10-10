# frozen_string_literal: true

class Guardianship < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :guardian, class_name: "User"
  belongs_to :member

  validates :relationship, presence: true
end
