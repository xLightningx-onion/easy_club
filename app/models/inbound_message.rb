# frozen_string_literal: true

class InboundMessage < ApplicationRecord
  include TenantScoped

  belongs_to :club
  belongs_to :user, optional: true
end
