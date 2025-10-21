# frozen_string_literal: true

class ClubTermAcceptance < ApplicationRecord
  belongs_to :club_term
  belongs_to :member
  belongs_to :accepted_by, class_name: "User", optional: true

  validates :accepted_at, presence: true
  validates :member_id, uniqueness: { scope: :club_term_id }
end
