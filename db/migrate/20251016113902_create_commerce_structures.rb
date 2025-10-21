# frozen_string_literal: true

class CreateCommerceStructures < ActiveRecord::Migration[8.0]
  def change
    create_table :carts, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.string :status, null: false, default: "active"
      t.datetime :expires_at
      t.datetime :checked_out_at
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :carts, %i[user_id status]
    add_index :carts, %i[club_id status]
    add_index :carts, %i[user_id club_id], unique: true, where: "status = 'active'", name: "idx_carts_unique_active"

    create_table :cart_items, id: :uuid do |t|
      t.references :cart, type: :uuid, null: false, foreign_key: true
      t.references :member, type: :uuid, null: false, foreign_key: true
      t.references :plan, type: :uuid, null: false, foreign_key: true
      t.integer :quantity, null: false, default: 1
      t.integer :unit_price_cents, null: false, default: 0
      t.string :unit_price_currency, null: false, default: "ZAR"
      t.integer :total_price_cents, null: false, default: 0
      t.string :total_price_currency, null: false, default: "ZAR"
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :cart_items, %i[cart_id member_id plan_id], unique: true, name: "idx_cart_items_unique"

    create_table :orders, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.references :cart, type: :uuid, foreign_key: true
      t.references :payment_method, type: :uuid, foreign_key: true
      t.string :status, null: false, default: "draft"
      t.string :number, null: false
      t.string :external_reference
      t.integer :subtotal_cents, null: false, default: 0
      t.string :subtotal_currency, null: false, default: "ZAR"
      t.integer :discount_cents, null: false, default: 0
      t.string :discount_currency, null: false, default: "ZAR"
      t.integer :total_cents, null: false, default: 0
      t.string :total_currency, null: false, default: "ZAR"
      t.datetime :submitted_at
      t.datetime :paid_at
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :orders, :number, unique: true
    add_index :orders, %i[user_id status]

    create_table :order_items, id: :uuid do |t|
      t.references :order, type: :uuid, null: false, foreign_key: true
      t.references :member, type: :uuid, null: false, foreign_key: true
      t.references :plan, type: :uuid, null: false, foreign_key: true
      t.references :product, type: :uuid, foreign_key: true
      t.string :description
      t.integer :quantity, null: false, default: 1
      t.integer :unit_price_cents, null: false, default: 0
      t.string :unit_price_currency, null: false, default: "ZAR"
      t.integer :total_price_cents, null: false, default: 0
      t.string :total_price_currency, null: false, default: "ZAR"
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    create_table :payment_transactions, id: :uuid do |t|
      t.references :order, type: :uuid, null: false, foreign_key: true
      t.references :payment_method, type: :uuid, foreign_key: true
      t.string :gateway, null: false, default: "paygate"
      t.string :status, null: false, default: "initialized"
      t.integer :amount_cents, null: false, default: 0
      t.string :amount_currency, null: false, default: "ZAR"
      t.string :request_reference
      t.string :response_reference
      t.jsonb :request_payload, null: false, default: {}
      t.jsonb :response_payload, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.datetime :processed_at
      t.timestamps
    end
    add_index :payment_transactions, :request_reference
    add_index :payment_transactions, :response_reference
  end
end
