source "https://rubygems.org"

ruby "~> 3.4.4"

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem "rails", "~> 8.0.2", ">= 8.0.2.1"
# The modern asset pipeline for Rails [https://github.com/rails/propshaft]
gem "propshaft"
# Use postgresql as the database for Active Record
gem "pg", "~> 1.1"
# Authentication & authorization
gem "devise"
gem "devise-two-factor"
gem "omniauth"
gem "omniauth-google-oauth2", "~> 1.1"
gem "omniauth-rails_csrf_protection"
gem "action_policy"
gem "pwned"
# Security & rate limiting
gem "rack-attack"
# Encryption helpers (optional)
gem "attr_encrypted", require: false
# Use the Puma web server [https://github.com/puma/puma]
gem "puma", ">= 5.0"
# Bundle and transpile JavaScript [https://github.com/rails/jsbundling-rails]
gem "jsbundling-rails"
# Hotwire's SPA-like page accelerator [https://turbo.hotwired.dev]
gem "turbo-rails"
# Hotwire's modest JavaScript framework [https://stimulus.hotwired.dev]
gem "stimulus-rails"
# Realtime interactions
gem "stimulus_reflex"
gem "cable_ready"
# Bundle and process CSS [https://github.com/rails/cssbundling-rails]
gem "cssbundling-rails"
# Build JSON APIs with ease [https://github.com/rails/jbuilder]
gem "jbuilder"

# Use Active Model has_secure_password [https://guides.rubyonrails.org/active_model_basics.html#securepassword]
# gem "bcrypt", "~> 3.1.7"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[ windows jruby ]

# Use the database-backed adapters for Rails.cache, Active Job, and Action Cable
gem "solid_cache"
gem "solid_queue"
gem "solid_cable"
# Redis client for ActionCable, caching, and queues
gem "redis", "~> 5.0"
# Soft delete and auditing
gem "discard"
gem "audited", "~> 5.4"

# Reduces boot times through caching; required in config/boot.rb
gem "bootsnap", require: false

# Money + billing helpers
gem "money-rails"
gem "eu_central_bank", require: false
# Reporting & exports
gem "roo"
gem "axlsx_rails"
gem "csv"
# PDFs and HTML rendering
gem "prawn"
gem "grover"

# Background processing & jobs
gem "sidekiq", "~> 8.0"
gem "sidekiq-unique-jobs", "~> 8.0"

# HTTP client for integrations
gem "httpx"

# WhatsApp Business API client
gem "whatsapp_sdk"

# Deploy this application anywhere as a Docker container [https://kamal-deploy.org]
gem "kamal", require: false

# Add HTTP asset caching/compression and X-Sendfile acceleration to Puma [https://github.com/basecamp/thruster/]
gem "thruster", require: false

# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
gem "image_processing", "~> 1.2"

group :development, :test do
  # See https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem "debug", platforms: %i[ mri windows ], require: "debug/prelude"

  # Static analysis for security vulnerabilities [https://brakemanscanner.org/]
  gem "brakeman", require: false

  # Omakase Ruby styling [https://github.com/rails/rubocop-rails-omakase/]
  gem "rubocop-rails-omakase", require: false

  # Test stack
  gem "rspec-rails"
  gem "factory_bot_rails"
  gem "database_cleaner-active_record"
  gem "faker"
  gem "annotate"
  gem "dotenv-rails", "~> 3.1", ">= 3.1.8"
end

group :development do
  # Use console on exceptions pages [https://github.com/rails/web-console]
  gem "web-console"

  # Optional background job dashboard/testing
  gem "good_job"
end

group :test do
  # Use system testing [https://guides.rubyonrails.org/testing.html#system-testing]
  gem "capybara"
  gem "selenium-webdriver"
end

# settings.yml
gem "config"

# Bunny CDN
gem "active_storage_bunny",
    git: "git@github.com:xLightningx-onion/active_storage_bunny.git",
    branch: "fix/direct-upload-and-upload_options"

gem "redis-session-store", "~> 0.11.5"
gem "friendly_id", "~> 5.5"
