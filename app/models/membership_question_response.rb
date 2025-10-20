# frozen_string_literal: true

class MembershipQuestionResponse < ApplicationRecord
  belongs_to :club
  belongs_to :membership_question
  belongs_to :member

  validates :member_id, uniqueness: { scope: :membership_question_id }
  validates :value, presence: true, if: :question_required?

  before_validation :sync_club

  delegate :required?, to: :membership_question, allow_nil: true, prefix: :question

  private

  def sync_club
    self.club_id ||= membership_question&.club_id
  end
end
