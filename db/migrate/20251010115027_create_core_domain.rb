# frozen_string_literal: true

class CreateCoreDomain < ActiveRecord::Migration[8.0]
  def change
    enable_extension "pgcrypto" unless extension_enabled?("pgcrypto")

    create_table :clubs, id: :uuid do |t|
      t.string :name, null: false
      t.string :subdomain
      t.string :primary_domain
      t.string :sender_email
      t.jsonb :color_palette, default: {}
      t.jsonb :settings, default: {}
      t.string :logo
      t.timestamps
    end

    create_table :users, id: :uuid do |t|
      t.string :email, null: false
      t.string :encrypted_password, null: false
      t.boolean :staff, null: false, default: false
      t.string :role, null: false, default: "parent"
      t.string :reset_password_token
      t.datetime :reset_password_sent_at
      t.datetime :remember_created_at
      t.string :otp_secret
      t.boolean :otp_required_for_login, null: false, default: false
      t.integer :consumed_timestep
      t.text :otp_backup_codes
      t.timestamps
    end
    add_index :users, :email, unique: true
    add_index :users, :reset_password_token, unique: true

    create_table :club_roles, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.string :role, null: false, default: "parent"
      t.timestamps
    end
    add_index :club_roles, %i[club_id user_id], unique: true

    create_table :members, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :user, type: :uuid, foreign_key: true
      t.string :first_name
      t.string :last_name
      t.date :dob
      t.string :gender
      t.string :role, null: false, default: "player"
      t.jsonb :medical_info_encrypted, default: {}
      t.jsonb :emergency_contacts_encrypted, default: {}
      t.boolean :safeguarding_flag, default: false
      t.string :safeguarding_reason
      t.timestamps
    end

    create_table :guardianships, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :guardian, type: :uuid, null: false, foreign_key: { to_table: :users }
      t.references :member, type: :uuid, null: false, foreign_key: { to_table: :members }
      t.string :relationship
      t.timestamps
    end
    add_index :guardianships, %i[club_id guardian_id member_id], unique: true, name: "idx_guardianships_unique"

    create_table :consent_types, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.string :key, null: false
      t.integer :version, default: 1
      t.text :body_markdown
      t.timestamps
    end
    add_index :consent_types, %i[club_id key version], unique: true, name: "idx_consent_types_unique"

    create_table :consents, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :member, type: :uuid, null: false, foreign_key: true
      t.references :consent_type, type: :uuid, null: false, foreign_key: true
      t.boolean :accepted, null: false
      t.datetime :accepted_at
      t.references :accepted_by, type: :uuid, foreign_key: { to_table: :users }
      t.timestamps
    end
    add_index :consents, %i[club_id member_id consent_type_id], unique: true, name: "idx_consents_unique"

    create_table :age_bands, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :min_age_years
      t.integer :max_age_years
      t.date :dob_cutoff
      t.timestamps
    end

    create_table :products, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.string :name, null: false
      t.boolean :vat_applicable, default: true
      t.string :sku
      t.integer :price_cents, null: false, default: 0
      t.string :price_currency, null: false, default: "ZAR"
      t.string :category
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    create_table :plans, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :product, type: :uuid, null: false, foreign_key: true
      t.string :plan_type, null: false
      t.integer :interval_months, default: 1
      t.integer :installments_count
      t.timestamps
    end

    create_table :price_rules, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.string :rule_type, null: false
      t.jsonb :config, null: false, default: {}
      t.datetime :starts_at
      t.datetime :ends_at
      t.boolean :active, default: true
      t.timestamps
    end

    create_table :invoices, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :member, type: :uuid, null: false, foreign_key: true
      t.references :family_account, type: :uuid, foreign_key: { to_table: :users }
      t.string :status, null: false, default: "open"
      t.string :number, null: false
      t.integer :subtotal_cents, default: 0
      t.string :subtotal_currency, null: false, default: "ZAR"
      t.integer :discount_cents, default: 0
      t.string :discount_currency, null: false, default: "ZAR"
      t.integer :vat_cents, default: 0
      t.string :vat_currency, null: false, default: "ZAR"
      t.integer :total_cents, default: 0
      t.string :total_currency, null: false, default: "ZAR"
      t.datetime :due_at
      t.timestamps
    end
    add_index :invoices, :number, unique: true

    create_table :invoice_items, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :invoice, type: :uuid, null: false, foreign_key: true
      t.references :product, type: :uuid, foreign_key: true
      t.string :description
      t.integer :quantity, null: false, default: 1
      t.integer :unit_price_cents, default: 0
      t.string :unit_price_currency, null: false, default: "ZAR"
      t.integer :amount_cents, default: 0
      t.string :amount_currency, null: false, default: "ZAR"
      t.jsonb :applied_rules, default: {}
      t.timestamps
    end

    create_table :payments, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :invoice, type: :uuid, null: false, foreign_key: true
      t.string :provider
      t.string :method
      t.string :provider_ref
      t.string :status, null: false, default: "pending"
      t.integer :amount_cents, default: 0
      t.string :amount_currency, null: false, default: "ZAR"
      t.jsonb :raw
      t.timestamps
    end

    create_table :dunning_attempts, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :invoice, type: :uuid, null: false, foreign_key: true
      t.string :status, null: false, default: "scheduled"
      t.datetime :run_at
      t.string :reason
      t.timestamps
    end

    create_table :vouchers, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.string :code, null: false
      t.integer :balance_cents, default: 0
      t.string :balance_currency, null: false, default: "ZAR"
      t.datetime :expires_at
      t.boolean :single_use, default: false
      t.timestamps
    end
    add_index :vouchers, %i[club_id code], unique: true

    create_table :wallets, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.integer :balance_cents, default: 0
      t.string :balance_currency, null: false, default: "ZAR"
      t.timestamps
    end
    add_index :wallets, %i[club_id user_id], unique: true

    create_table :wallet_entries, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :wallet, type: :uuid, null: false, foreign_key: true
      t.string :entry_type
      t.integer :amount_cents, default: 0
      t.string :amount_currency, null: false, default: "ZAR"
      t.references :payment, type: :uuid, foreign_key: true
      t.jsonb :meta, default: {}
      t.timestamps
    end

    create_table :seasons, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.string :name, null: false
      t.date :starts_on
      t.date :ends_on
      t.date :dob_cutoff
      t.timestamps
    end

    create_table :competitions, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :season, type: :uuid, null: false, foreign_key: true
      t.string :name, null: false
      t.timestamps
    end

    create_table :divisions, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :competition, type: :uuid, null: false, foreign_key: true
      t.string :name, null: false
      t.timestamps
    end

    create_table :teams, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :season, type: :uuid, null: false, foreign_key: true
      t.string :name, null: false
      t.references :age_band, type: :uuid, foreign_key: true
      t.timestamps
    end

    create_table :team_memberships, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :team, type: :uuid, null: false, foreign_key: true
      t.references :member, type: :uuid, null: false, foreign_key: true
      t.string :role, default: "player"
      t.timestamps
    end
    add_index :team_memberships, %i[club_id team_id member_id], unique: true, name: "idx_team_memberships_unique"

    create_table :fixtures, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :team, type: :uuid, null: false, foreign_key: true
      t.date :match_date
      t.string :opponent
      t.string :venue
      t.string :status, default: "scheduled"
      t.timestamps
    end

    create_table :availabilities, id: :uuid do |t|
      t.references :club, type: :uuid, null: false, foreign_key: true
      t.references :fixture, type: :uuid, null: false, foreign_key: true
      t.references :member, type: :uuid, null: false, foreign_key: true
      t.string :status, null: false, default: "unknown"
      t.datetime :responded_at
      t.timestamps
    end
    add_index :availabilities, %i[club_id fixture_id member_id], unique: true, name: "idx_availabilities_unique"
  end
end
