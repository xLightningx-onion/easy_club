# frozen_string_literal: true

class AddOptionsToMembershipQuestions < ActiveRecord::Migration[8.0]
  def change
    add_column :membership_questions, :options, :jsonb, null: false, default: []
    add_index :membership_questions, :answer_type
  end
end
