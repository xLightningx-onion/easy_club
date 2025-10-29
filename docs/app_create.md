# Sports Club Platform — Build Docs (Rails 8 + Stimulus + StimulusReflex + CableReady)

> This document is written for a **code-gen agent** (Codex-style) working inside a modern editor. It is **executable guidance**: folder layout, gems, generators, migrations, models, services, jobs, UI components, and acceptance checks.
> Assumptions: Rails 8 app already created; Stimulus, StimulusReflex, and CableReady installed; Postgres, Redis available.
> Namespaces:
>
> 1. `Club` (club-facing interface for admins/managers/coaches/parents/members)
> 2. `Admin` (staff super-admin, full oversight & support)

---

## 0) System Goals (MVP scope)

* **Membership & People**: profiles (player/coach/official/volunteer), guardians, age-banding, consents, safeguarding, digital cards.
* **Fees, Billing, Payments**: products, plans (once-off/recurring/installments), pricing rules (family/early-bird/sibling caps/scholarships), VAT invoices & statements, dunning & retries, payment methods (Card, Instant EFT, Vouchers), reconciliation & exports, fraud & sanity rules, wallet/credits.
* **Teams, Fixtures & Ops**: seasons, competitions, divisions/pools; eligibility; squads; match sheets (PDF); availability pings.
* **Comms & Content**: role-targeted broadcasts (WhatsApp + email), templates & approvals.
* **Reporting**: finance metrics, AR aging, participation, compliance dashboards, CSV/Excel export.
* **Multi-club SaaS**: tenant per club, white-label (domain, colors, logo, sender ID).
* **Access/Privacy/Compliance**: authorization, audit logs, POPIA-aligned data handling, retention + RTBF, 2FA, backups/DR.

---

## 1) Tech Foundations

### 1.1 Gems

```ruby
# Gemfile (key gems only)
ruby "~> 3.4"

# AuthN/Z & security
gem "devise"
gem "devise-two-factor"
gem "pwned"                     # optional password pwned check for staff/admins
gem "rack-attack"               # throttling (admin, login, webhook)
gem "action_policy"             # authorization (or pundit if preferred)
gem "attr_encrypted", require: false # optional, we’ll use Rails encrypted attributes first

# Realtime
gem "stimulus_reflex"
gem "cable_ready"
gem "redis", "~> 5.0"

# Money & invoicing
gem "money-rails"
gem "eu_central_bank", require: false # optional; we can hard-code ZAR for now
gem "roo"                             # Excel export
gem "axlsx_rails"                     # optional Excel building
gem "prawn"                           # PDF (receipts/match sheets) OR use grover
gem "grover"                          # HTML->PDF via Puppeteer

# Background
# Rails 8 ships with Solid Queue/Cache; we’ll use them
gem "good_job", group: :development # optional local testing; not needed if using Solid Queue
gem "sidekiq", "~> 7.3"
gem "sidekiq-unique-jobs", "~> 8.0"     # avoid duplicate enqueues (webhooks, dunning)
gem "redis", "~> 5.0"


# Multi-tenancy & Auditing
gem "apartment", require: false      # NOT using schemas for v1; row-scoped recommended. Keep off.
gem "audited", "~> 5.4"              # audit logs
gem "discard"                        # soft deletes where needed

# CSV/Import/Export
gem "csv"
gem "pg"

# Testing
group :development, :test do
  gem "rspec-rails"
  gem "factory_bot_rails"
  gem "database_cleaner-active_record"
  gem "faker"
end

# API/HTTP
gem "httpx"                          # robust client; or faraday
```

> If you prefer schema-per-tenant later, keep `apartment` in reserve; **for MVP use row-level tenanting (`club_id`)**.

### 1.2 Initializers & environment

* **Postgres** 15+, **Redis** for ActionCable.
* **Rails 8**: enable Solid Queue & Solid Cache (default).
* ENV keys (set via credentials or ENV):

  ```
  APP_HOST, APP_PROTOCOL
  REDIS_URL
  # Payments
  PAYMENTS_PROVIDER=“example”
  PAYFAST_*/YOCO_*/STRIPE_* (choose one stack)
  # WhatsApp (if enabling early)
  WA_API_BASE, WA_TOKEN, WA_PHONE_ID, WA_BUSINESS_ID
  # Mail
  MAIL_FROM_DOMAIN, MAIL_FROM_DEFAULT
  # Encryption
  RAILS_MASTER_KEY
  ```

---

## 2) Repository Structure

```
app/
  controllers/
    admin/
    club/
    concerns/
  models/
    concerns/
    accounting/
    billing/
    comms/
    membership/
    ops/
    reporting/
    tenancy/
  policies/
  services/
    payments/
    pricing/
    dunning/
    whatsapp/
    exports/
    retention/
  views/
    admin/
    club/
  reflexes/
  javascript/
    controllers/       # Stimulus controllers
    channels/
  jobs/
  mailers/
  pdf/
config/
  initializers/
  routes.rb
  cable.yml
  storage.yml
db/
  migrate/
  seeds.rb
```

---

## 3) Routing & Namespacing

```ruby
# config/routes.rb
Rails.application.routes.draw do
  # Devise shared for staff and club users (scoped via roles)
  devise_for :users, controllers: {
    sessions: "auth/sessions",
    registrations: "auth/registrations"
  }

  # Club-facing namespace
  namespace :club do
    root "dashboard#show"
    resources :members do
      resources :consents, only: %i[index create update]
      member do
        get :card # QR code
      end
    end
    resources :guardianships, only: %i[create destroy]
    resources :products, only: %i[index show]
    resources :plans, only: %i[index]
    resources :invoices, only: %i[index show] do
      member { post :pay }  # take card/EFT/voucher
    end
    resources :vouchers, only: %i[create]
    resources :wallets, only: %i[show]
    resources :seasons, only: %i[index show]
    resources :teams, only: %i[index show] do
      resources :memberships, only: %i[create destroy]
      member do
        get :eligibility
        get :squad
        post :squad        # save drag-drop
        get :match_sheet   # pdf
      end
    end
    resources :fixtures, only: %i[index show] do
      member do
        post :availability # via UI (webhooks handled separately)
      end
    end
    resources :broadcasts, only: %i[new create]
    resources :reports, only: %i[index] do
      collection do
        get :finance
        get :participation
        get :compliance
        get :export
      end
    end
  end

  # Staff admin namespace
  namespace :admin do
    root "dashboard#show"
    resources :clubs do
      member do
        get :branding
        patch :branding
        get :domains
        patch :domains
      end
    end
    resources :users
    resources :members
    resources :invoices do
      collection { get :reconciliation }
    end
    resources :payments, only: %i[index show]
    resources :dunning_runs, only: %i[index show create]
    resources :broadcasts do
      member { post :approve }
    end
    resources :audits, only: %i[index show]
    resources :retention_jobs, only: %i[index create]
    resources :exports, only: %i[index create]
    resources :reports, only: %i[index] do
      collection do
        get :finance
        get :ar_aging
        get :dunning_funnel
        get :participation
        get :consent_status
      end
    end
    namespace :webhooks do
      post :payments # /admin/webhooks/payments
      post :whatsapp # /admin/webhooks/whatsapp
    end
  end
end
```

---

## 4) Multi-Tenancy (Row-Scoped)

* Add `club_id: uuid` to **every** tenant-owned table.
* Current club context via subdomain/domain mapping (e.g., `acmeclub.example.com` → `Club.current`).
* Controllers include `set_current_club` before_action using Host header / domain map.
* Policy scopes ensure `record.club_id == current_club.id`.
* Provide **Admin** namespace that can switch club context (impersonation).

```ruby
# app/models/concerns/tenant_scoped.rb
module TenantScoped
  extend ActiveSupport::Concern

  included do
    belongs_to :club
    validates :club_id, presence: true
    default_scope { where(club_id: Club.current_id) if Club.current_id }
  end
end
```

```ruby
# app/models/club.rb
class Club < ApplicationRecord
  # brand, domain, color_palette, logo, sender_email, settings (jsonb)
  thread_mattr_accessor :current_id

  def self.with_current(club, &blk)
    prev = current_id
    self.current_id = club.id
    yield
  ensure
    self.current_id = prev
  end
end
```

---

## 5) Authentication, Roles, 2FA

* Single `User` model with `role` and `club_roles` if user belongs to multiple clubs (e.g., parent across two).
* Staff flag `staff: boolean` to grant **Admin** access across clubs.
* Devise modules: `database_authenticatable`, `two_factor_authenticatable` (TOTP for staff).
* SSO/magic-link optional later.

```ruby
# db/migrate/xxxx_create_users.rb
create_table :users, id: :uuid do |t|
  t.string :email, null: false
  t.string :encrypted_password, null: false
  t.boolean :staff, default: false, null: false
  t.string :role, null: false, default: "parent" # parent, coach, manager, finance, admin
  t.string :otp_secret
  t.boolean :otp_required_for_login, default: false
  t.timestamps
end
add_index :users, :email, unique: true
```

**Authorization** with ActionPolicy:

```ruby
# app/policies/application_policy.rb
class ApplicationPolicy < ActionPolicy::Base
  authorize :user, optional: true
  authorize :club, optional: true

  private

  def staff?
    user&.staff?
  end

  def club_admin?
    user&.role.in?(%w[admin manager finance])
  end
end
```

---

## 6) Domain Model (core tables)

> Each table includes `club_id: uuid` (except global/admin tables).

### 6.1 Membership

```ruby
create_table :members, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.references :user, type: :uuid                                  # parent/self account
  t.string :first_name, :last_name
  t.date   :dob
  t.string :gender
  t.string :role, null: false, default: "player"                    # player, coach, official, volunteer
  t.jsonb  :medical_info_encrypted                                  # encrypted (Rails attr_encrypted/lockbox optional)
  t.jsonb  :emergency_contacts_encrypted
  t.boolean :safeguarding_flag, default: false
  t.string :safeguarding_reason
  t.timestamps
end

create_table :guardianships, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.references :guardian, type: :uuid, null: false, foreign_key: {to_table: :users}
  t.references :member,   type: :uuid, null: false, foreign_key: {to_table: :members}
  t.string :relationship # mother/father/etc.
  t.timestamps
end

create_table :consent_types, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.string :key, null: false # e.g., "media", "code_of_conduct", "waiver"
  t.integer :version, default: 1
  t.text :body_markdown
  t.timestamps
end
add_index :consent_types, %i[club_id key version], unique: true

create_table :consents, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.references :member, type: :uuid, null: false
  t.references :consent_type, type: :uuid, null: false
  t.boolean :accepted, null: false
  t.datetime :accepted_at
  t.references :accepted_by, type: :uuid, foreign_key: {to_table: :users}
  t.timestamps
end
```

**Age-banding & eligibility**

```ruby
create_table :age_bands, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.string :name, null: false   # e.g., "U13"
  t.integer :min_age_years, :max_age_years
  t.date :dob_cutoff           # season cutoff
  t.timestamps
end
```

**Service**: `Eligibility::Engine.suggest(member, season) -> age_band`.

### 6.2 Fees, Products, Plans, Pricing Rules

```ruby
create_table :products, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.string :name, null: false           # membership fee, tournament fee, etc.
  t.boolean :vat_applicable, default: true
  t.string :sku
  t.monetize :price_cents, amount: { null: false, default: 0 }, currency: { present: true, default: "ZAR" }
  t.string :category # "membership","levy","tournament"
  t.jsonb :metadata
  t.timestamps
end

create_table :plans, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.references :product, type: :uuid, null: false
  t.string :plan_type, null: false # "once_off", "recurring", "installments"
  t.integer :interval_months, default: 1 # for recurring
  t.integer :installments_count
  t.timestamps
end

create_table :price_rules, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.string :rule_type, null: false # "family_discount","early_bird","sibling_cap","scholarship","voucher"
  t.jsonb :config, null: false, default: {}
  t.datetime :starts_at
  t.datetime :ends_at
  t.boolean :active, default: true
  t.timestamps
end
```

**Invoicing & Payments**

```ruby
create_table :invoices, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.references :member, type: :uuid, null: false
  t.references :family_account, type: :uuid, foreign_key: {to_table: :users} # for statements
  t.string :status, null: false, default: "open" # open, paid, past_due, void
  t.string :number, null: false
  t.monetize :subtotal_cents, currency: { present: true, default: "ZAR" }
  t.monetize :discount_cents, currency: { present: true, default: "ZAR" }
  t.monetize :vat_cents,      currency: { present: true, default: "ZAR" }
  t.monetize :total_cents,    currency: { present: true, default: "ZAR" }
  t.datetime :due_at
  t.timestamps
end
add_index :invoices, :number, unique: true

create_table :invoice_items, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.references :invoice, type: :uuid, null: false
  t.references :product, type: :uuid
  t.string :description
  t.integer :quantity, null: false, default: 1
  t.monetize :unit_price_cents, currency: { present: true, default: "ZAR" }
  t.monetize :amount_cents,     currency: { present: true, default: "ZAR" }
  t.jsonb :applied_rules, default: {}
  t.timestamps
end

create_table :payments, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.references :invoice, type: :uuid, null: false
  t.string :provider # "payfast","yoco","stripe","eft"
  t.string :method   # "card","instant_eft","voucher","wallet"
  t.string :provider_ref
  t.string :status, null: false, default: "pending"
  t.monetize :amount_cents, currency: { present: true, default: "ZAR" }
  t.jsonb :raw
  t.timestamps
end

create_table :dunning_attempts, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.references :invoice, type: :uuid, null: false
  t.string :status, null: false, default: "scheduled" # scheduled, retried, failed, cancelled, succeeded
  t.datetime :run_at
  t.string :reason # "nsf","hardship_pause","holiday"
  t.timestamps
end

create_table :vouchers, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.string :code, null: false
  t.monetize :balance_cents, currency: { present: true, default: "ZAR" }
  t.datetime :expires_at
  t.boolean :single_use, default: false
  t.timestamps
end
add_index :vouchers, %i[club_id code], unique: true

create_table :wallets, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.references :user, type: :uuid, null: false
  t.monetize :balance_cents, currency: { present: true, default: "ZAR" }
  t.timestamps
end

create_table :wallet_entries, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.references :wallet, type: :uuid, null: false
  t.string :entry_type # "refund","topup","spend"
  t.monetize :amount_cents, currency: { present: true, default: "ZAR" }
  t.references :payment, type: :uuid
  t.jsonb :meta
  t.timestamps
end
```

### 6.3 Seasons, Teams, Fixtures

```ruby
create_table :seasons, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.string :name, null: false
  t.date :starts_on
  t.date :ends_on
  t.date :dob_cutoff
  t.timestamps
end

create_table :competitions, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.references :season, type: :uuid, null: false
  t.string :name, null: false
  t.timestamps
end

create_table :divisions, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.references :competition, type: :uuid, null: false
  t.string :name, null: false
  t.timestamps
end

create_table :teams, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.references :season, type: :uuid, null: false
  t.string :name, null: false
  t.references :age_band, type: :uuid
  t.timestamps
end

create_table :team_memberships, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.references :team, type: :uuid, null: false
  t.references :member, type: :uuid, null: false
  t.string :role, default: "player" # player/coach
  t.timestamps
end

create_table :fixtures, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.references :team, type: :uuid, null: false
  t.date :match_date
  t.string :opponent
  t.string :venue
  t.string :status, default: "scheduled"
  t.timestamps
end

create_table :availabilities, id: :uuid do |t|
  t.references :club, type: :uuid, null: false
  t.references :fixture, type: :uuid, null: false
  t.references :member, type: :uuid, null: false
  t.string :status, null: false, default: "unknown" # yes/no/maybe/unknown
  t.datetime :responded_at
  t.timestamps
end
```

---

## 7) Services & Engines

### 7.1 Eligibility Engine

```ruby
# app/services/eligibility/engine.rb
module Eligibility
  class Engine
    def self.suggest(member:, season:)
      cutoff = season.dob_cutoff || season.starts_on
      age = (cutoff - member.dob).to_i / 365.25
      band = AgeBand.where(club_id: member.club_id)
                    .where("min_age_years <= ? AND max_age_years >= ?", age, age)
                    .first
      band
    end

    def self.allowed?(member:, team:)
      band = suggest(member: member, season: team.season)
      band && team.age_band_id == band.id
    end
  end
end
```

### 7.2 Pricing Rules Engine

A single composer service with **deterministic ordering**:

1. Scholarship → 2. Early-bird → 3. Family % → 4. Sibling cap → 5. Vouchers.

```ruby
# app/services/pricing/engine.rb
module Pricing
  class Engine
    Result = Struct.new(:subtotal, :discounts, :vat, :total, keyword_init: true)

    def self.price(invoice:)
      subtotal = invoice.invoice_items.sum(&:amount_cents)
      discounts = []
      ctx = { invoice: invoice, subtotal: subtotal, discounts: discounts }

      [Rules::Scholarship, Rules::EarlyBird, Rules::FamilyPercent, Rules::SiblingCap, Rules::Voucher]
        .each { |rule| rule.apply(ctx) }

      vat_cents = Vat.for(invoice).calculate(subtotal - discounts.sum)
      total = subtotal - discounts.sum + vat_cents
      Result.new(subtotal: subtotal, discounts: discounts, vat: vat_cents, total: total)
    end
  end
end
```

Implement each `Rules::*` class to read `price_rules` configs scoped to `club_id` and the member/family context.

### 7.3 Payments Adapter

Unified interface:

```ruby
# app/services/payments/processor.rb
module Payments
  class Processor
    def initialize(club:)
      @adapter = adapter_for(club)
    end

    def pay(invoice:, method:, source_token: nil, voucher_code: nil)
      case method
      when "card", "instant_eft" then @adapter.charge(invoice:, method:, source_token:)
      when "voucher"            then VoucherService.redeem(invoice:, code: voucher_code)
      when "wallet"             then WalletService.spend(invoice:)
      else raise "Unsupported method"
      end
    end

    def handle_webhook(params)
      @adapter.handle_webhook(params)
    end

    private

    def adapter_for(club)
      case club.settings["payments"]["provider"]
      when "payfast" then Adapters::Payfast.new(club:)
      when "yoco"    then Adapters::Yoco.new(club:)
      when "stripe"  then Adapters::Stripe.new(club:)
      else Adapters::Null.new
      end
    end
  end
end
```

Provide minimal adapter skeletons in `app/services/payments/adapters/*`.

### 7.4 Dunning & Retries

* Scheduler job scans `invoices.past_due` → create/update `dunning_attempts` → enqueue retry via adapter.
* Respect “fee holidays” and “hardship pauses” via flags on `invoice` or `member`.

```ruby
# app/jobs/dunning/scheduler_job.rb
class Dunning::SchedulerJob < ApplicationJob
  queue_as :default

  def perform
    Invoice.past_due.find_each do |inv|
      next if inv.hardship_paused?
      Dunning::AttemptJob.perform_later(inv.id)
    end
  end
end
```

### 7.5 WhatsApp Bridge (Transactional)

* **Webhook** in `Admin::Webhooks::WhatsappController#create`.
* **Outbound** via `Services::Whatsapp::Client` (Cloud API).
* **Account linking**: magic link or OTP; store `wa_phone_number` on `User`.

---

## 8) Realtime (StimulusReflex + CableReady)

### 8.1 Squad Builder

* Page: `Club::TeamsController#show` with a list of eligible/available players + selected squad.
* Drag-drop via Stimulus, persistence via Reflex.

```ruby
# app/reflexes/squad_reflex.rb
class SquadReflex < StimulusReflex::Reflex
  def add_member
    team = Team.find(element.dataset[:team_id])
    member = Member.find(element.dataset[:member_id])
    TeamMembership.find_or_create_by!(club_id: team.club_id, team:, member:)
    morph "#squad", ApplicationController.render(partial: "club/teams/squad", locals: { team: team })
  end

  def remove_member
    tm = TeamMembership.find(element.dataset[:team_membership_id])
    tm.destroy
    morph "#squad", ApplicationController.render(partial: "club/teams/squad", locals: { team: tm.team })
  end
end
```

### 8.2 Availability & Finance Board

* Availability updates stream to the fixture page when parents reply via web or WA webhook.
* Reconciliation dashboard in **Admin** streams webhook status rows to “cleared/failed”.

---

## 9) Controllers (high-level)

### 9.1 Club

* `Club::DashboardController#show`: show outstanding invoices, consents completeness, upcoming fixtures.
* `Club::MembersController` CRUD (members; strict policies for guardians).
* `Club::ConsentsController` to render consent types & post acceptance.
* `Club::InvoicesController#index/show/pay` — calls `Payments::Processor`.
* `Club::TeamsController#index/show/squad/match_sheet` — render PDF via Prawn/Grover.
* `Club::FixturesController#availability` — write `availabilities`.
* `Club::BroadcastsController#new/create` — role-targeted (parents U13 etc.).
* `Club::ReportsController` — finance, participation, compliance; CSV/Excel export.

### 9.2 Admin

* `Admin::DashboardController#show` — global KPIs across clubs.
* CRUD for clubs, users, members (impersonation).
* `Admin::InvoicesController#reconciliation` — board + export.
* `Admin::BroadcastsController` — approvals.
* `Admin::AuditsController` — audit trail viewer.
* `Admin::RetentionJobsController` — run RTBF/retention tasks.
* `Admin::Webhooks::PaymentsController#create` — handle payment webhooks.
* `Admin::Webhooks::WhatsappController#create` — WA webhooks.

---

## 10) Policies (ActionPolicy)

* **Rule of thumb**: all `Club::*` controllers require `record.club_id == Club.current_id`; `Admin::*` requires `user.staff?`; allow club-level admins where safe.
* Sensitive reads (medical info) require elevated role and **log audit**.

```ruby
# app/policies/member_policy.rb
class MemberPolicy < ApplicationPolicy
  def show?
    staff? || club_admin? || guardian_of?(record) || record.user_id == user&.id
  end

  def view_medical?
    staff? || user&.role == "coach" || user&.role == "manager"
  end

  private

  def guardian_of?(member)
    Guardianship.exists?(club_id: club.id, guardian_id: user.id, member_id: member.id)
  end
end
```

---

## 11) PDFs

* Use **Grover** (HTML→PDF) for receipts and match sheets (easier branding), or Prawn for stricter layout.
  `Club::TeamsController#match_sheet` renders an HTML partial and pipes to PDF.

---

## 12) Reporting

* **Solid Cache** cached queries (daily/hourly recompute).
* Finance: MRR/Recurring from active plans; AR aging bucketing SQL; Dunning funnel from `dunning_attempts`.
* Participation: `members` group by `gender`, calculated age band at season.
* Compliance: consents coverage (missing/expiring).

Export endpoints stream CSV:

```ruby
send_data Reporters::ArAging.new(club:).to_csv, filename: "ar_aging-#{Date.today}.csv"
```

---

## 13) Communications

* **Templates** table with `channel`, `subject`, `body`, `variables`.
* **Broadcast** flow: create → preview (merge variables) → approval (if > threshold) → enqueue send.
* Email via `ActionMailer`, WhatsApp via service client. Log outbound in `outbound_messages`.

---

## 14) Compliance & Privacy

* **Audit** every sensitive read/write (`audited` gem; manual custom logs for reads).
* **Encrypted attributes**: use Rails 7+/8 `encrypted_attribute` for `medical_info`, `emergency_contacts`.
* **Retention**: jobs to purge/minimize data after configured periods; keep financial records, anonymize PII link.
* **RTBF**: queue job to redact member/user PII; preserve invoice totals with anonymized subject.
* **2FA**: enforce for `staff` and `club admin/finance`.
* **Backups**: nightly `pg_dump` + object storage; weekly restore drill (staging).
* **DR targets**: RPO 24h, RTO 4h for MVP.

---

## 15) Admin: White-Label & Domains

* `clubs` table stores `logo`, `color_palette` (JSON), `sender_email`.
* Domain mapping table (optional) or columns on `clubs` for `primary_domain` and `subdomain`.
* Middleware to resolve `Club.current` by host; fallback to query param in Admin for impersonation.

---

## 16) Seed Data

```ruby
# db/seeds.rb
staff = User.create!(email: "staff@example.com", password: "Password1!", staff: true, role: "admin")
club  = Club.create!(name: "Acme FC", color_palette: {primary: "#0EA5E9"}, sender_email: "noreply@acmefc.example")
Club.with_current(club) do
  # Consent types
  ConsentType.create!(club:, key: "media", version: 1, body_markdown: "...")

  # Age bands
  %w[U8 U10 U12 U13 U15 U17].each_with_index do |name, idx|
    AgeBand.create!(club:, name:, min_age_years: 6 + (idx*2), max_age_years: 7 + (idx*2), dob_cutoff: Date.new(Date.today.year, 1, 1))
  end

  # Products & plans
  reg = Product.create!(club:, name: "Registration Fee", vat_applicable: true, price_cents: 50000)
  Plan.create!(club:, product: reg, plan_type: "once_off")
end
```

---

## 17) UI Notes (Stimulus + Turbo + Reflex)

* Keep pages **SSR**; use Stimulus for micro-interactions; Reflex for realtime updates (roster, finance board).
* Components:

  * `Members#show`: “completeness meter” (consents, emergency contacts).
  * `Invoices#index`: filters, paid/past due chips; “Pay” modal integrates adapter tokenization.
  * `Teams#show`: roster lists (eligible pool vs selected), drag-drop to `#squad` target.
  * `Reports#index`: cards linking to CSV/Excel exports.

---

## 18) Webhooks

* `POST /admin/webhooks/payments` handles provider callbacks: verify signature, upsert `payments`, update `invoices.status`, broadcast reconciliation row via CableReady.
* `POST /admin/webhooks/whatsapp` handles inbound messages: resolve user by phone, create `inbound_messages`, route intent (link account, balance, pay link); log everything (audit trail).

---

## 19) Background Jobs (Solid Queue)

* `Dunning::SchedulerJob` hourly/day.
* `Reports::RefreshJob` nightly.
* `Compliance::RetentionJob` nightly.
* `Comms::BroadcastJob` fan-out.
* `Payments::ReconcileJob` on webhook.

---

## 20) Testing (RSpec)

* **Model specs**: pricing engine, eligibility, invoice totals (VAT/discounts), dunning.
* **Policy specs**: sensitive reads (medical info).
* **Request/system specs**: pay flow, squad builder, consent acceptance.
* **Jobs**: dunning, broadcast fan-out.

Sample spec:

```ruby
RSpec.describe Pricing::Engine do
  it "applies family discount then sibling cap" do
    # Build invoice with siblings in factory, assert discount ordering and totals
  end
end
```

---

## 21) Observability & Ops

* **Structured logs**: lograge or Rails tagged logging with `club_id`, `user_id`.
* **Healthchecks**: `/up` endpoint + DB/Redis checks.
* **Rack::Attack** throttling (login, webhooks).
* **CI**: run migrations, rspec, RuboCop; build Docker image; deploy.
* **Security**: CSP locked, secrets in credentials, rotate provider keys quarterly.

---

## 22) Admin Support Tools

* Impersonate user within a club (read-only banner; log start/stop).
* Quick search across members/invoices/payments.
* Manual adjustments: wallet top-up/refund; voucher creation (audited).
* Export center: AR aging, statements, reconciliation CSV.

---

## 23) Step-By-Step Build Plan (for the agent)

1. **Add gems & bundle**; configure Redis, Solid Queue/Cache, Devise.
2. **Generate models & migrations** (in the order above). Run migrations.
3. **Implement `Club.current` resolver** (host-based) and `TenantScoped` concern; add `club_id` to models.
4. **Seed**: staff user, sample club, consent types, age bands, product + plan.
5. **Policies**: ApplicationPolicy + MemberPolicy; add before_action hooks across controllers.
6. **Club namespace** controllers + basic CRUD views (SSR).
7. **Invoices UI** + `Payments::Processor` + one provider adapter (mock endpoints in dev).
8. **Reflex** squad builder; availability updates; reconciliation board.
9. **Admin namespace** dashboards, reconciliation, audits viewer.
10. **PDFs** (Grover) for receipts and match sheets.
11. **Comms**: templates, approval, broadcast → email + WA stub (log in dev).
12. **Reports** queries + CSV/Excel exports; nightly refresh job.
13. **Dunning** scheduler & attempt jobs; UI.
14. **Retention & RTBF** jobs; admin UI to trigger.
15. **Hardening**: 2FA for staff/admin; rack-attack; backups scripts; restore test.
16. **E2E system tests**: pay flow, squad builder, dunning retry, exports.

---

## 24) Example Controllers (snippets)

```ruby
# app/controllers/club/invoices_controller.rb
class Club::InvoicesController < Club::BaseController
  def index
    @invoices = policy_scope(Invoice).order(due_at: :asc)
  end

  def show
    @invoice = authorize current_club.invoices.find(params[:id])
  end

  def pay
    @invoice = authorize current_club.invoices.find(params[:id])
    result = Payments::Processor.new(club: current_club).pay(
      invoice: @invoice,
      method: params[:method],
      source_token: params[:token],
      voucher_code: params[:voucher]
    )
    if result.success?
      redirect_to [:club, @invoice], notice: "Payment received"
    else
      redirect_to [:club, @invoice], alert: result.error
    end
  end
end
```

```ruby
# app/controllers/admin/webhooks/payments_controller.rb
class Admin::Webhooks::PaymentsController < Admin::BaseController
  skip_before_action :verify_authenticity_token

  def create
    processor = Payments::Processor.new(club: resolve_club_from_webhook)
    processor.handle_webhook(request.request_parameters)
    head :ok
  rescue => e
    Rails.logger.error("Payments webhook error: #{e.message}")
    head :bad_request
  end
end
```

---

## 25) Example Stimulus (drag-drop → Reflex)

```js
// app/javascript/controllers/squad_controller.js
import { Controller } from "@hotwired/stimulus"
import StimulusReflex from "stimulus_reflex"

export default class extends Controller {
  static targets = ["pool", "squad"]

  connect() {
    StimulusReflex.register(this)
  }

  add(event) {
    const memberId = event.params.memberId
    const teamId = this.element.dataset.teamId
    this.stimulate("SquadReflex#add_member", { member_id: memberId, team_id: teamId })
  }

  remove(event) {
    const tmId = event.params.teamMembershipId
    this.stimulate("SquadReflex#remove_member", { team_membership_id: tmId })
  }
}
```

---

## 26) Acceptance Test Checklist (MVP)

* Create club → set branding/domain → invite club admin.
* Create age bands, consent types; add member + guardian; accept consents.
* Create product/plan; generate invoice; apply early-bird & family discount; produce VAT receipt.
* Pay by card (sandbox) and via voucher; wallet refund flow.
* Schedule dunning retry on unpaid invoice; see timeline.
* Create season/team; roster builder enforces eligibility; match sheet exports to PDF.
* Availability update from WA webhook appears live on fixture page.
* Send broadcast to “Parents U13” (approval required if > threshold); WhatsApp + email logs.
* Generate AR aging CSV; finance dashboard shows collection rate.
* Run RTBF for a member; see anonymization while invoices remain.
* Staff enables 2FA; all admin logins behind TOTP.
* Backup/restore to staging succeeds.

---

## 27) Deployment Notes

* **Procfile** (if using)

  ```
  web: bundle exec puma -C config/puma.rb
  worker: bundle exec sidekiq -C config/sidekiq.yml
  cable: ./bin/rails action_cable:server
  ```
* Set `RAILS_ENV`, `DATABASE_URL`, `REDIS_URL`, payment keys, mail sender, WA keys.
* Nginx configured for **club subdomains** and **admin** root; force HTTPS; HSTS.
* Run `db:migrate`, `db:seed` (minimal).
* Apply cron/scheduler for nightly jobs (e.g., run `StaggeredPayments::SchedulerJob` every 10 minutes and `bin/rails runner "Dunning::SchedulerJob.perform_later"`).
* Observability hooks for errors (Sentry/Rollbar) and uptime.

---

### Done

This is everything your agent needs to scaffold, implement, and ship the MVP across the **Club** and **Admin** namespaces with Rails 8 + Stimulus/StimulusReflex/CableReady. If you want, I can generate **concrete generators** (rails g … commands) next, plus first-draft **view partials** for the high-traffic screens (Invoices, Squad Builder, Reconciliation, Reports) so the agent can paste and run.
