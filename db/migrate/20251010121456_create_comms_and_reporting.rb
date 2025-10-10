# frozen_string_literal: true

class CreateCommsAndReporting < ActiveRecord::Migration[8.0]
  def change
    create_table :templates, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.string :name, null: false
      t.string :channel, null: false
      t.string :subject
      t.text :body
      t.jsonb :variables, default: []
      t.boolean :requires_approval, default: false
      t.timestamps
    end

    create_table :broadcasts, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :template, type: :uuid, foreign_key: true
      t.references :created_by, type: :uuid, foreign_key: { to_table: :users }
      t.references :approved_by, type: :uuid, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.string :channel, null: false, default: "email"
      t.text :body
      t.string :status, null: false, default: "draft"
      t.string :audience_type
      t.jsonb :audience_filter, default: {}
      t.datetime :approved_at
      t.datetime :scheduled_at
      t.timestamps
    end

    create_table :outbound_messages, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :broadcast, type: :uuid, null: false, foreign_key: true
      t.references :member, type: :uuid, foreign_key: true
      t.string :channel, null: false
      t.string :status, null: false, default: "queued"
      t.string :provider_id
      t.text :error_message
      t.jsonb :metadata, default: {}
      t.datetime :sent_at
      t.timestamps
    end

    create_table :inbound_messages, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :user, type: :uuid, foreign_key: true
      t.string :channel, null: false
      t.string :provider_id
      t.jsonb :payload, default: {}
      t.timestamps
    end

    create_table :report_runs, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.string :report_name, null: false
      t.string :status, null: false, default: "queued"
      t.jsonb :params, default: {}
      t.string :file
      t.timestamps
    end
  end
end
