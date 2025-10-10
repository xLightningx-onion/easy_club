# frozen_string_literal: true

class Club < ApplicationRecord
  thread_mattr_accessor :current_id

  has_many :club_roles, dependent: :destroy
  has_many :users, through: :club_roles
  has_many :members, dependent: :destroy
  has_many :seasons, dependent: :destroy
  has_many :products, dependent: :destroy
  has_many :plans, dependent: :destroy
  has_many :price_rules, dependent: :destroy
  has_many :age_bands, dependent: :destroy
  has_many :invoices, dependent: :destroy
  has_many :payments, dependent: :destroy
  has_many :vouchers, dependent: :destroy
  has_many :wallets, dependent: :destroy
  has_many :teams, dependent: :destroy
  has_many :fixtures, dependent: :destroy
  has_many :templates, dependent: :destroy
  has_many :broadcasts, dependent: :destroy
  has_many :outbound_messages, dependent: :destroy
  has_many :report_runs, dependent: :destroy
  has_many :inbound_messages, dependent: :destroy

  def self.with_current(club, &block)
    previous = current_id
    self.current_id = club&.id
    yield
  ensure
    self.current_id = previous
  end

  def self.current
    find_by(id: current_id) if current_id
  end
end
