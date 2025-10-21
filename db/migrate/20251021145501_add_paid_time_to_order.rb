class AddPaidTimeToOrder < ActiveRecord::Migration[8.0]
  def change
    add_column :orders, :paid_time, :datetime, default: nil

    add_column :payment_transactions, :paid_time, :datetime, default: nil
  end
end
