# frozen_string_literal: true

class UpdateUsersDefaultRole < ActiveRecord::Migration[8.0]
  def up
    change_column_default :users, :role, from: "parent", to: "member"

    execute <<~SQL.squish
      UPDATE users
      SET role = 'member'
      WHERE role IS NULL OR role = '' OR role = 'parent'
    SQL
  end

  def down
    execute <<~SQL.squish
      UPDATE users
      SET role = 'parent'
      WHERE role = 'member' AND staff = false
    SQL

    change_column_default :users, :role, from: "member", to: "parent"
  end
end
