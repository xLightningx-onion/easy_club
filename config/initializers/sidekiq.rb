# frozen_string_literal: true

require "sidekiq"
require "sidekiq-unique-jobs"
require "sidekiq_unique_jobs/web"

redis_url = ENV.fetch("SIDEKIQ_REDIS_URL") do
  ENV.fetch("REDIS_URL", "redis://localhost:6379/2")
end

Sidekiq.configure_server do |config|
  config.redis = { url: redis_url }

  config.client_middleware do |chain|
    chain.add SidekiqUniqueJobs::Middleware::Client
  end

  config.server_middleware do |chain|
    chain.add SidekiqUniqueJobs::Middleware::Server
  end

  SidekiqUniqueJobs::Server.configure(config)
end

Sidekiq.configure_client do |config|
  config.redis = { url: redis_url }

  config.client_middleware do |chain|
    chain.add SidekiqUniqueJobs::Middleware::Client
  end
end
