class AddPaymentMethodIdToOrders < ActiveRecord::Migration[8.0]
  def change
    add_reference :orders, :payment_method, foreign_key: true, type: :uuid
  end
end
