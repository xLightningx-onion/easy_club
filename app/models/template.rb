# frozen_string_literal: true

class Template < ApplicationRecord
  include TenantScoped

  CHANNELS = %w[email whatsapp sms].freeze

  belongs_to :club
  has_many :broadcasts, dependent: :nullify

  validates :name, presence: true
  validates :channel, inclusion: { in: CHANNELS }
end
