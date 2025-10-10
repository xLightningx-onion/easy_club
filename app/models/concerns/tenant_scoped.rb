# frozen_string_literal: true

module TenantScoped
  extend ActiveSupport::Concern

  included do
    validates :club_id, presence: true
    default_scope { where(club_id: Club.current_id) if Club.current_id }
  end
end
