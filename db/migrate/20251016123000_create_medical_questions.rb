# frozen_string_literal: true

class CreateMedicalQuestions < ActiveRecord::Migration[8.0]
  def change
    create_table :medical_questions, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :club_id, null: false
      t.string :prompt, null: false
      t.string :question_type, null: false, default: "short_text"
      t.boolean :active, null: false, default: true
      t.integer :position, null: false, default: 0
      t.boolean :required, null: false, default: false
      t.timestamps
    end

    add_index :medical_questions, :club_id
    add_foreign_key :medical_questions, :clubs
  end
end
