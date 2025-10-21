# frozen_string_literal: true

class CreateClubTermAcceptances < ActiveRecord::Migration[8.0]
  def change
    create_table :club_term_acceptances, id: :uuid do |t|
      t.uuid :club_term_id, null: false
      t.uuid :member_id, null: false
      t.datetime :accepted_at, null: false
      t.uuid :accepted_by_id

      t.timestamps
    end

    add_index :club_term_acceptances, %i[club_term_id member_id], unique: true, name: "idx_club_term_acceptances_unique"
    add_foreign_key :club_term_acceptances, :club_terms
    add_foreign_key :club_term_acceptances, :members
    add_foreign_key :club_term_acceptances, :users, column: :accepted_by_id
  end
end
