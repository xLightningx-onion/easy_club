# frozen_string_literal: true

class CreateMembershipQuestions < ActiveRecord::Migration[8.0]
  def change
    create_table :membership_questions, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :club_id, null: false
      t.string :prompt, null: false
      t.string :answer_type, null: false, default: "short_text"
      t.boolean :required, null: false, default: true
      t.integer :position, null: false, default: 0
      t.text :help_text

      t.timestamps
    end

    add_index :membership_questions, :club_id
    add_index :membership_questions, [:club_id, :position]
    add_foreign_key :membership_questions, :clubs
  end
end
