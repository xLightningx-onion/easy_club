class AddStaggeredPaymentSupportToOrders < ActiveRecord::Migration[7.1]
  def change
    add_column :carts, :payment_mode, :string, null: false, default: "full"
    add_reference :carts, :staggered_payment_plan, type: :uuid, foreign_key: { to_table: :staggered_payment_plans }

    add_column :orders, :payment_mode, :string, null: false, default: "full"
    add_reference :orders, :staggered_payment_plan, type: :uuid, foreign_key: { to_table: :staggered_payment_plans }

    create_table :staggered_payment_schedules, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :order, type: :uuid, null: false, foreign_key: true
      t.references :staggered_payment_plan, type: :uuid, null: false, foreign_key: true
      t.string :status, null: false, default: "active"
      t.datetime :activated_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.datetime :completed_at
      t.timestamps
    end

    create_table :staggered_payment_schedule_installments, id: :uuid do |t|
      t.references :staggered_payment_schedule, type: :uuid, null: false, foreign_key: true, index: { name: "index_schedule_installments_on_schedule_id" }
      t.string :status, null: false, default: "pending"
      t.integer :position, null: false, default: 0
      t.decimal :percentage, precision: 6, scale: 3, null: false
      t.integer :amount_cents, null: false, default: 0
      t.string :amount_currency, null: false, default: "ZAR"
      t.datetime :due_at, null: false
      t.datetime :paid_at
      t.references :payment_transaction, type: :uuid, foreign_key: true
      t.timestamps
    end

    add_index :staggered_payment_schedule_installments,
              [ :staggered_payment_schedule_id, :position ],
              unique: true,
              name: "index_schedule_installments_on_schedule_and_position"
  end
end
