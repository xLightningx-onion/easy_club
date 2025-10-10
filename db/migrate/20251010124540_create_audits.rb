# frozen_string_literal: true

class CreateAudits < ActiveRecord::Migration[8.0]
  def change
    create_table :audits, id: :uuid do |t|
      t.string :auditable_type
      t.uuid :auditable_id
      t.string :associated_type
      t.uuid :associated_id
      t.string :user_type
      t.uuid :user_id
      t.string :username
      t.string :action
      t.jsonb :audited_changes
      t.integer :version, default: 0
      t.string :comment
      t.string :remote_address
      t.string :request_uuid
      t.datetime :created_at
    end

    add_index :audits, %i[auditable_type auditable_id]
    add_index :audits, %i[associated_type associated_id]
    add_index :audits, %i[user_type user_id]
    add_index :audits, :request_uuid
  end
end
