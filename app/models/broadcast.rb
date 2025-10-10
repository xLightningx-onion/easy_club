# frozen_string_literal: true

class Broadcast < ApplicationRecord
  include TenantScoped

  STATUSES = %w[draft pending approval pending_approval approved sending sent failed].freeze

  belongs_to :club
  belongs_to :template, optional: true
  belongs_to :created_by, class_name: "User", optional: true
  belongs_to :approved_by, class_name: "User", optional: true

  has_many :outbound_messages, dependent: :destroy

  enum :status, {
    draft: "draft",
    pending: "pending",
    pending_approval: "pending_approval",
    approved: "approved",
    sending: "sending",
    sent: "sent",
    failed: "failed"
  }, prefix: true

  validates :title, presence: true
  validates :channel, presence: true

  def requires_approval?
    audience_size_estimate.to_i > 20 || template&.requires_approval?
  end

  def audience_size_estimate
    audience_filter.fetch("count", nil)
  end
end
