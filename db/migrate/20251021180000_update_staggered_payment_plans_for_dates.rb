class UpdateStaggeredPaymentPlansForDates < ActiveRecord::Migration[7.1]
  def up
    migration_installment_klass = Class.new(ActiveRecord::Base) do
      self.table_name = "staggered_payment_installments"
    end

    unless column_exists?(:staggered_payment_plans, :starts_on)
      add_column :staggered_payment_plans, :starts_on, :date
    end

    unless column_exists?(:staggered_payment_plans, :ends_on)
      add_column :staggered_payment_plans, :ends_on, :date
    end

    unless column_exists?(:staggered_payment_installments, :due_on)
      add_column :staggered_payment_installments, :due_on, :date
      migration_installment_klass.reset_column_information
      migration_installment_klass.update_all(due_on: Date.current)
    end

    if column_exists?(:staggered_payment_installments, :interval_weeks)
      remove_column :staggered_payment_installments, :interval_weeks
    end
  end

  def down
    if column_exists?(:staggered_payment_installments, :due_on)
      remove_column :staggered_payment_installments, :due_on
    end

    unless column_exists?(:staggered_payment_installments, :interval_weeks)
      add_column :staggered_payment_installments, :interval_weeks, :integer, null: false, default: 4
    end

    if column_exists?(:staggered_payment_plans, :ends_on)
      remove_column :staggered_payment_plans, :ends_on
    end

    if column_exists?(:staggered_payment_plans, :starts_on)
      remove_column :staggered_payment_plans, :starts_on
    end
  end
end
