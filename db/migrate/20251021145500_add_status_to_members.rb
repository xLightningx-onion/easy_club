# frozen_string_literal: true

class AddStatusToMembers < ActiveRecord::Migration[8.0]
  def change
    return if column_exists?(:members, :status)

    add_column :members, :status, :string, null: false, default: "unpaid"
    add_index :members, :status
  end
end
