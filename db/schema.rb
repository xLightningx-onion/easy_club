# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_10_16_113906) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "active_storage_attachments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.uuid "record_id", null: false
    t.uuid "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "age_bands", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.string "name", null: false
    t.integer "min_age_years"
    t.integer "max_age_years"
    t.date "dob_cutoff"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_age_bands_on_club_id"
  end

  create_table "audits", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "auditable_type"
    t.uuid "auditable_id"
    t.string "associated_type"
    t.uuid "associated_id"
    t.string "user_type"
    t.uuid "user_id"
    t.string "username"
    t.string "action"
    t.jsonb "audited_changes"
    t.integer "version", default: 0
    t.string "comment"
    t.string "remote_address"
    t.string "request_uuid"
    t.datetime "created_at"
    t.index ["associated_type", "associated_id"], name: "index_audits_on_associated_type_and_associated_id"
    t.index ["auditable_type", "auditable_id"], name: "index_audits_on_auditable_type_and_auditable_id"
    t.index ["request_uuid"], name: "index_audits_on_request_uuid"
    t.index ["user_type", "user_id"], name: "index_audits_on_user_type_and_user_id"
  end

  create_table "availabilities", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "fixture_id", null: false
    t.uuid "member_id", null: false
    t.string "status", default: "unknown", null: false
    t.datetime "responded_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id", "fixture_id", "member_id"], name: "idx_availabilities_unique", unique: true
    t.index ["club_id"], name: "index_availabilities_on_club_id"
    t.index ["fixture_id"], name: "index_availabilities_on_fixture_id"
    t.index ["member_id"], name: "index_availabilities_on_member_id"
  end

  create_table "broadcasts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "template_id"
    t.uuid "created_by_id"
    t.uuid "approved_by_id"
    t.string "title", null: false
    t.string "channel", default: "email", null: false
    t.text "body"
    t.string "status", default: "draft", null: false
    t.string "audience_type"
    t.jsonb "audience_filter", default: {}
    t.datetime "approved_at"
    t.datetime "scheduled_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["approved_by_id"], name: "index_broadcasts_on_approved_by_id"
    t.index ["club_id"], name: "index_broadcasts_on_club_id"
    t.index ["created_by_id"], name: "index_broadcasts_on_created_by_id"
    t.index ["template_id"], name: "index_broadcasts_on_template_id"
  end

  create_table "cart_items", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "cart_id", null: false
    t.uuid "member_id", null: false
    t.uuid "plan_id", null: false
    t.integer "quantity", default: 1, null: false
    t.integer "unit_price_cents", default: 0, null: false
    t.string "unit_price_currency", default: "ZAR", null: false
    t.integer "total_price_cents", default: 0, null: false
    t.string "total_price_currency", default: "ZAR", null: false
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["cart_id", "member_id", "plan_id"], name: "idx_cart_items_unique", unique: true
    t.index ["cart_id"], name: "index_cart_items_on_cart_id"
    t.index ["member_id"], name: "index_cart_items_on_member_id"
    t.index ["plan_id"], name: "index_cart_items_on_plan_id"
  end

  create_table "carts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "user_id", null: false
    t.string "status", default: "active", null: false
    t.datetime "expires_at"
    t.datetime "checked_out_at"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id", "status"], name: "index_carts_on_club_id_and_status"
    t.index ["club_id"], name: "index_carts_on_club_id"
    t.index ["user_id", "club_id"], name: "idx_carts_unique_active", unique: true, where: "((status)::text = 'active'::text)"
    t.index ["user_id", "status"], name: "index_carts_on_user_id_and_status"
    t.index ["user_id"], name: "index_carts_on_user_id"
  end

  create_table "club_roles", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "user_id", null: false
    t.string "role", default: "parent", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id", "user_id"], name: "index_club_roles_on_club_id_and_user_id", unique: true
    t.index ["club_id"], name: "index_club_roles_on_club_id"
    t.index ["user_id"], name: "index_club_roles_on_user_id"
  end

  create_table "clubs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "subdomain"
    t.string "primary_domain"
    t.string "sender_email"
    t.jsonb "color_palette", default: {}
    t.jsonb "settings", default: {}
    t.string "logo"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "public_listing", default: true, null: false
    t.string "location_name"
    t.string "address_line1"
    t.string "address_line2"
    t.string "city"
    t.string "region"
    t.string "postal_code"
    t.string "country"
    t.decimal "latitude", precision: 10, scale: 6
    t.decimal "longitude", precision: 10, scale: 6
    t.string "google_place_id"
    t.index ["google_place_id"], name: "index_clubs_on_google_place_id", unique: true, where: "(google_place_id IS NOT NULL)"
    t.index ["public_listing"], name: "index_clubs_on_public_listing"
  end

  create_table "competitions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "season_id", null: false
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_competitions_on_club_id"
    t.index ["season_id"], name: "index_competitions_on_season_id"
  end

  create_table "consent_types", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.string "key", null: false
    t.integer "version", default: 1
    t.text "body_markdown"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id", "key", "version"], name: "idx_consent_types_unique", unique: true
    t.index ["club_id"], name: "index_consent_types_on_club_id"
  end

  create_table "consents", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "member_id", null: false
    t.uuid "consent_type_id", null: false
    t.boolean "accepted", null: false
    t.datetime "accepted_at"
    t.uuid "accepted_by_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["accepted_by_id"], name: "index_consents_on_accepted_by_id"
    t.index ["club_id", "member_id", "consent_type_id"], name: "idx_consents_unique", unique: true
    t.index ["club_id"], name: "index_consents_on_club_id"
    t.index ["consent_type_id"], name: "index_consents_on_consent_type_id"
    t.index ["member_id"], name: "index_consents_on_member_id"
  end

  create_table "divisions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "competition_id", null: false
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_divisions_on_club_id"
    t.index ["competition_id"], name: "index_divisions_on_competition_id"
  end

  create_table "dunning_attempts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "invoice_id", null: false
    t.string "status", default: "scheduled", null: false
    t.datetime "run_at"
    t.string "reason"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_dunning_attempts_on_club_id"
    t.index ["invoice_id"], name: "index_dunning_attempts_on_invoice_id"
  end

  create_table "fixtures", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "team_id", null: false
    t.date "match_date"
    t.string "opponent"
    t.string "venue"
    t.string "status", default: "scheduled"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_fixtures_on_club_id"
    t.index ["team_id"], name: "index_fixtures_on_team_id"
  end

  create_table "guardianships", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "guardian_id", null: false
    t.uuid "member_id", null: false
    t.string "relationship"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id", "guardian_id", "member_id"], name: "idx_guardianships_unique", unique: true
    t.index ["club_id"], name: "index_guardianships_on_club_id"
    t.index ["guardian_id"], name: "index_guardianships_on_guardian_id"
    t.index ["member_id"], name: "index_guardianships_on_member_id"
  end

  create_table "inbound_messages", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "user_id"
    t.string "channel", null: false
    t.string "provider_id"
    t.jsonb "payload", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_inbound_messages_on_club_id"
    t.index ["user_id"], name: "index_inbound_messages_on_user_id"
  end

  create_table "invoice_items", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "invoice_id", null: false
    t.uuid "product_id"
    t.string "description"
    t.integer "quantity", default: 1, null: false
    t.integer "unit_price_cents", default: 0
    t.string "unit_price_currency", default: "ZAR", null: false
    t.integer "amount_cents", default: 0
    t.string "amount_currency", default: "ZAR", null: false
    t.jsonb "applied_rules", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_invoice_items_on_club_id"
    t.index ["invoice_id"], name: "index_invoice_items_on_invoice_id"
    t.index ["product_id"], name: "index_invoice_items_on_product_id"
  end

  create_table "invoices", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "member_id", null: false
    t.uuid "family_account_id"
    t.string "status", default: "open", null: false
    t.string "number", null: false
    t.integer "subtotal_cents", default: 0
    t.string "subtotal_currency", default: "ZAR", null: false
    t.integer "discount_cents", default: 0
    t.string "discount_currency", default: "ZAR", null: false
    t.integer "vat_cents", default: 0
    t.string "vat_currency", default: "ZAR", null: false
    t.integer "total_cents", default: 0
    t.string "total_currency", default: "ZAR", null: false
    t.datetime "due_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_invoices_on_club_id"
    t.index ["family_account_id"], name: "index_invoices_on_family_account_id"
    t.index ["member_id"], name: "index_invoices_on_member_id"
    t.index ["number"], name: "index_invoices_on_number", unique: true
  end

  create_table "members", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "user_id"
    t.string "first_name"
    t.string "last_name"
    t.date "dob"
    t.string "gender"
    t.string "role", default: "player", null: false
    t.jsonb "medical_info_encrypted", default: {}
    t.jsonb "emergency_contacts_encrypted", default: {}
    t.boolean "safeguarding_flag", default: false
    t.string "safeguarding_reason"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_members_on_club_id"
    t.index ["user_id"], name: "index_members_on_user_id"
  end

  create_table "order_items", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "order_id", null: false
    t.uuid "member_id", null: false
    t.uuid "plan_id", null: false
    t.uuid "product_id"
    t.string "description"
    t.integer "quantity", default: 1, null: false
    t.integer "unit_price_cents", default: 0, null: false
    t.string "unit_price_currency", default: "ZAR", null: false
    t.integer "total_price_cents", default: 0, null: false
    t.string "total_price_currency", default: "ZAR", null: false
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["member_id"], name: "index_order_items_on_member_id"
    t.index ["order_id"], name: "index_order_items_on_order_id"
    t.index ["plan_id"], name: "index_order_items_on_plan_id"
    t.index ["product_id"], name: "index_order_items_on_product_id"
  end

  create_table "orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "user_id", null: false
    t.uuid "cart_id"
    t.string "status", default: "draft", null: false
    t.string "number", null: false
    t.string "external_reference"
    t.integer "subtotal_cents", default: 0, null: false
    t.string "subtotal_currency", default: "ZAR", null: false
    t.integer "discount_cents", default: 0, null: false
    t.string "discount_currency", default: "ZAR", null: false
    t.integer "total_cents", default: 0, null: false
    t.string "total_currency", default: "ZAR", null: false
    t.datetime "submitted_at"
    t.datetime "paid_at"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["cart_id"], name: "index_orders_on_cart_id"
    t.index ["club_id"], name: "index_orders_on_club_id"
    t.index ["number"], name: "index_orders_on_number", unique: true
    t.index ["user_id", "status"], name: "index_orders_on_user_id_and_status"
    t.index ["user_id"], name: "index_orders_on_user_id"
  end

  create_table "outbound_messages", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "broadcast_id", null: false
    t.uuid "member_id"
    t.string "channel", null: false
    t.string "status", default: "queued", null: false
    t.string "provider_id"
    t.text "error_message"
    t.jsonb "metadata", default: {}
    t.datetime "sent_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["broadcast_id"], name: "index_outbound_messages_on_broadcast_id"
    t.index ["club_id"], name: "index_outbound_messages_on_club_id"
    t.index ["member_id"], name: "index_outbound_messages_on_member_id"
  end

  create_table "payment_transactions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "order_id", null: false
    t.string "gateway", default: "paygate", null: false
    t.string "status", default: "initialized", null: false
    t.integer "amount_cents", default: 0, null: false
    t.string "amount_currency", default: "ZAR", null: false
    t.string "request_reference"
    t.string "response_reference"
    t.jsonb "request_payload", default: {}, null: false
    t.jsonb "response_payload", default: {}, null: false
    t.jsonb "metadata", default: {}, null: false
    t.datetime "processed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_payment_transactions_on_order_id"
    t.index ["request_reference"], name: "index_payment_transactions_on_request_reference"
    t.index ["response_reference"], name: "index_payment_transactions_on_response_reference"
  end

  create_table "payments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "invoice_id", null: false
    t.string "provider"
    t.string "method"
    t.string "provider_ref"
    t.string "status", default: "pending", null: false
    t.integer "amount_cents", default: 0
    t.string "amount_currency", default: "ZAR", null: false
    t.jsonb "raw"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_payments_on_club_id"
    t.index ["invoice_id"], name: "index_payments_on_invoice_id"
  end

  create_table "plans", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "product_id", null: false
    t.string "plan_type", null: false
    t.integer "interval_months", default: 1
    t.integer "installments_count"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_plans_on_club_id"
    t.index ["product_id"], name: "index_plans_on_product_id"
  end

  create_table "price_rules", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.string "rule_type", null: false
    t.jsonb "config", default: {}, null: false
    t.datetime "starts_at"
    t.datetime "ends_at"
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_price_rules_on_club_id"
  end

  create_table "products", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.string "name", null: false
    t.boolean "vat_applicable", default: true
    t.string "sku"
    t.integer "price_cents", default: 0, null: false
    t.string "price_currency", default: "ZAR", null: false
    t.string "category"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_products_on_club_id"
  end

  create_table "report_runs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.string "report_name", null: false
    t.string "status", default: "queued", null: false
    t.jsonb "params", default: {}
    t.string "file"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_report_runs_on_club_id"
  end

  create_table "seasons", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.string "name", null: false
    t.date "starts_on"
    t.date "ends_on"
    t.date "dob_cutoff"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_seasons_on_club_id"
  end

  create_table "team_memberships", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "team_id", null: false
    t.uuid "member_id", null: false
    t.string "role", default: "player"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id", "team_id", "member_id"], name: "idx_team_memberships_unique", unique: true
    t.index ["club_id"], name: "index_team_memberships_on_club_id"
    t.index ["member_id"], name: "index_team_memberships_on_member_id"
    t.index ["team_id"], name: "index_team_memberships_on_team_id"
  end

  create_table "teams", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "season_id", null: false
    t.string "name", null: false
    t.uuid "age_band_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["age_band_id"], name: "index_teams_on_age_band_id"
    t.index ["club_id"], name: "index_teams_on_club_id"
    t.index ["season_id"], name: "index_teams_on_season_id"
  end

  create_table "templates", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.string "name", null: false
    t.string "channel", null: false
    t.string "subject"
    t.text "body"
    t.jsonb "variables", default: []
    t.boolean "requires_approval", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_templates_on_club_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "email", null: false
    t.string "encrypted_password", null: false
    t.boolean "staff", default: false, null: false
    t.string "role", default: "parent", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.string "otp_secret"
    t.boolean "otp_required_for_login", default: false, null: false
    t.integer "consumed_timestep"
    t.text "otp_backup_codes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "vouchers", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.string "code", null: false
    t.integer "balance_cents", default: 0
    t.string "balance_currency", default: "ZAR", null: false
    t.datetime "expires_at"
    t.boolean "single_use", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id", "code"], name: "index_vouchers_on_club_id_and_code", unique: true
    t.index ["club_id"], name: "index_vouchers_on_club_id"
  end

  create_table "wallet_entries", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "wallet_id", null: false
    t.string "entry_type"
    t.integer "amount_cents", default: 0
    t.string "amount_currency", default: "ZAR", null: false
    t.uuid "payment_id"
    t.jsonb "meta", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id"], name: "index_wallet_entries_on_club_id"
    t.index ["payment_id"], name: "index_wallet_entries_on_payment_id"
    t.index ["wallet_id"], name: "index_wallet_entries_on_wallet_id"
  end

  create_table "wallets", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "club_id", null: false
    t.uuid "user_id", null: false
    t.integer "balance_cents", default: 0
    t.string "balance_currency", default: "ZAR", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["club_id", "user_id"], name: "index_wallets_on_club_id_and_user_id", unique: true
    t.index ["club_id"], name: "index_wallets_on_club_id"
    t.index ["user_id"], name: "index_wallets_on_user_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "age_bands", "clubs"
  add_foreign_key "availabilities", "clubs"
  add_foreign_key "availabilities", "fixtures"
  add_foreign_key "availabilities", "members"
  add_foreign_key "broadcasts", "clubs"
  add_foreign_key "broadcasts", "templates"
  add_foreign_key "broadcasts", "users", column: "approved_by_id"
  add_foreign_key "broadcasts", "users", column: "created_by_id"
  add_foreign_key "cart_items", "carts"
  add_foreign_key "cart_items", "members"
  add_foreign_key "cart_items", "plans"
  add_foreign_key "carts", "clubs"
  add_foreign_key "carts", "users"
  add_foreign_key "club_roles", "clubs"
  add_foreign_key "club_roles", "users"
  add_foreign_key "competitions", "clubs"
  add_foreign_key "competitions", "seasons"
  add_foreign_key "consent_types", "clubs"
  add_foreign_key "consents", "clubs"
  add_foreign_key "consents", "consent_types"
  add_foreign_key "consents", "members"
  add_foreign_key "consents", "users", column: "accepted_by_id"
  add_foreign_key "divisions", "clubs"
  add_foreign_key "divisions", "competitions"
  add_foreign_key "dunning_attempts", "clubs"
  add_foreign_key "dunning_attempts", "invoices"
  add_foreign_key "fixtures", "clubs"
  add_foreign_key "fixtures", "teams"
  add_foreign_key "guardianships", "clubs"
  add_foreign_key "guardianships", "members"
  add_foreign_key "guardianships", "users", column: "guardian_id"
  add_foreign_key "inbound_messages", "clubs"
  add_foreign_key "inbound_messages", "users"
  add_foreign_key "invoice_items", "clubs"
  add_foreign_key "invoice_items", "invoices"
  add_foreign_key "invoice_items", "products"
  add_foreign_key "invoices", "clubs"
  add_foreign_key "invoices", "members"
  add_foreign_key "invoices", "users", column: "family_account_id"
  add_foreign_key "members", "clubs"
  add_foreign_key "members", "users"
  add_foreign_key "order_items", "members"
  add_foreign_key "order_items", "orders"
  add_foreign_key "order_items", "plans"
  add_foreign_key "order_items", "products"
  add_foreign_key "orders", "carts"
  add_foreign_key "orders", "clubs"
  add_foreign_key "orders", "users"
  add_foreign_key "outbound_messages", "broadcasts"
  add_foreign_key "outbound_messages", "clubs"
  add_foreign_key "outbound_messages", "members"
  add_foreign_key "payment_transactions", "orders"
  add_foreign_key "payments", "clubs"
  add_foreign_key "payments", "invoices"
  add_foreign_key "plans", "clubs"
  add_foreign_key "plans", "products"
  add_foreign_key "price_rules", "clubs"
  add_foreign_key "products", "clubs"
  add_foreign_key "report_runs", "clubs"
  add_foreign_key "seasons", "clubs"
  add_foreign_key "team_memberships", "clubs"
  add_foreign_key "team_memberships", "members"
  add_foreign_key "team_memberships", "teams"
  add_foreign_key "teams", "age_bands"
  add_foreign_key "teams", "clubs"
  add_foreign_key "teams", "seasons"
  add_foreign_key "templates", "clubs"
  add_foreign_key "vouchers", "clubs"
  add_foreign_key "wallet_entries", "clubs"
  add_foreign_key "wallet_entries", "payments"
  add_foreign_key "wallet_entries", "wallets"
  add_foreign_key "wallets", "clubs"
  add_foreign_key "wallets", "users"
end
