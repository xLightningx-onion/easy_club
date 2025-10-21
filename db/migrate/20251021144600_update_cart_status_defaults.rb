# frozen_string_literal: true

class UpdateCartStatusDefaults < ActiveRecord::Migration[8.0]
  def change
    change_column_default :carts, :status, from: "active", to: "unpaid" if column_defaults?(:carts, :status, "active")

    reversible do |dir|
      dir.up do
        execute <<~SQL.squish
          UPDATE carts SET status = 'unpaid' WHERE status = 'active'
        SQL
      end
    end
  end

  private

  def column_defaults?(table, column, expected)
    current_default = connection.columns(table).find { |col| col.name == column.to_s }&.default
    current_default == expected
  end
end
