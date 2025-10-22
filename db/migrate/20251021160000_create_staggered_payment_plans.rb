class CreateStaggeredPaymentPlans < ActiveRecord::Migration[7.1]
  def change
    create_table :staggered_payment_plans, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.date :starts_on
      t.date :ends_on
      t.boolean :active, null: false, default: true
      t.timestamps
    end

    create_table :staggered_payment_installments, id: :uuid do |t|
      t.references :staggered_payment_plan, type: :uuid, null: false, foreign_key: true, index: { name: "index_payment_installments_on_plan_id" }
      t.integer :position, null: false, default: 0
      t.decimal :percentage, precision: 6, scale: 3, null: false
      t.integer :amount_cents
      t.string :amount_currency, default: "ZAR", null: false
      t.date :due_on
      t.timestamps
    end

    add_index :staggered_payment_installments, [ :staggered_payment_plan_id, :position ], name: "index_installments_on_plan_and_position"
  end
end
