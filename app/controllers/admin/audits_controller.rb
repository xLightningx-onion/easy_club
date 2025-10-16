# frozen_string_literal: true

class Admin::AuditsController < Admin::BaseController
  def index
    @audits = defined?(Audited::Audit) ? Audited::Audit.order(created_at: :desc).limit(200) : []
  end
end
