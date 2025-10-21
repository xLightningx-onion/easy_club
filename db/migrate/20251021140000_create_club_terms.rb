# frozen_string_literal: true

class CreateClubTerms < ActiveRecord::Migration[8.0]
  def change
    create_table :club_terms, id: :uuid do |t|
      t.uuid :club_id, null: false
      t.string :title, null: false
      t.text :body, null: false
      t.boolean :required, null: false, default: true
      t.boolean :active, null: false, default: true
      t.integer :position, null: false, default: 0

      t.timestamps
    end

    add_index :club_terms, :club_id
    add_index :club_terms, %i[club_id position]
    add_foreign_key :club_terms, :clubs
  end
end
