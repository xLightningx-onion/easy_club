# frozen_string_literal: true

class CreateMembershipTypes < ActiveRecord::Migration[8.0]
  def change
    create_table :membership_types, id: :uuid do |t|
      t.uuid :club_id, null: false
      t.string :label, null: false
      t.integer :min_age_years, null: false
      t.integer :max_age_years, null: false
      t.string :gender, null: false, default: "unisex"
      t.integer :base_price_cents, null: false, default: 0
      t.string :base_price_currency, null: false, default: "ZAR"
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :membership_types, :club_id
    add_index :membership_types, %i[club_id label], unique: true

    add_foreign_key :membership_types, :clubs

    create_table :membership_type_price_tiers, id: :uuid do |t|
      t.uuid :club_id, null: false
      t.uuid :membership_type_id, null: false
      t.string :label, null: false
      t.integer :amount_cents, null: false, default: 0
      t.string :amount_currency, null: false, default: "ZAR"
      t.integer :position, null: false, default: 0
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :membership_type_price_tiers, :club_id
    add_index :membership_type_price_tiers, :membership_type_id

    add_foreign_key :membership_type_price_tiers, :clubs
    add_foreign_key :membership_type_price_tiers, :membership_types
  end
end
