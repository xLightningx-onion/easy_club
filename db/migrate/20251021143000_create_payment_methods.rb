# frozen_string_literal: true

class CreatePaymentMethods < ActiveRecord::Migration[8.0]
  def change
    create_table :payment_methods, id: :uuid, if_not_exists: true do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.string :provider, null: false, default: "paygate"
      t.string :external_reference, null: false
      t.string :last_four
      t.string :brand
      t.integer :expiry_month
      t.integer :expiry_year
      t.boolean :default, null: false, default: false
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :payment_methods, %i[user_id provider external_reference],
              unique: true,
              name: "idx_payment_methods_unique_reference"
    add_index :payment_methods, %i[user_id default], name: "idx_payment_methods_user_default"
  end
end
