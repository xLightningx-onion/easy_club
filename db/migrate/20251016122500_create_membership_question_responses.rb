# frozen_string_literal: true

class CreateMembershipQuestionResponses < ActiveRecord::Migration[8.0]
  def change
    create_table :membership_question_responses, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :club_id, null: false
      t.uuid :membership_question_id, null: false
      t.uuid :member_id, null: false
      t.text :value

      t.timestamps
    end

    add_index :membership_question_responses, :club_id
    add_index :membership_question_responses, [:membership_question_id, :member_id], unique: true, name: "idx_question_responses_member_once"

    add_foreign_key :membership_question_responses, :clubs
    add_foreign_key :membership_question_responses, :membership_questions
    add_foreign_key :membership_question_responses, :members
  end
end
