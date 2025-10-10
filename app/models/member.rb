# frozen_string_literal: true

class Member < ApplicationRecord
  include TenantScoped
  audited associated_with: :club

  belongs_to :club
  belongs_to :user, optional: true

  has_many :guardianships, dependent: :destroy
  has_many :guardians, through: :guardianships, source: :guardian
  has_many :consents, dependent: :destroy
  has_many :team_memberships, dependent: :destroy
  has_many :teams, through: :team_memberships
  has_many :invoices, dependent: :destroy
  has_many :availabilities, dependent: :destroy

  def full_name
    [first_name, last_name].compact.join(" ").strip
  end
end
