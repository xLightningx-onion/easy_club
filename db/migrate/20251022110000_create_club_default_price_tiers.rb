# frozen_string_literal: true

class CreateClubDefaultPriceTiers < ActiveRecord::Migration[7.1]
  def change
    create_table :club_default_price_tiers, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.string :label, null: false
      t.date :starts_on, null: false
      t.date :ends_on, null: false
      t.integer :position, null: false, default: 0

      t.timestamps
    end

    add_index :club_default_price_tiers, %i[club_id position]
  end
end
