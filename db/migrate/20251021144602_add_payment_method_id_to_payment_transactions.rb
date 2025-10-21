class AddPaymentMethodIdToPaymentTransactions < ActiveRecord::Migration[8.0]
  def change
    add_reference :payment_transactions, :payment_method, foreign_key: true, type: :uuid
  end
end
