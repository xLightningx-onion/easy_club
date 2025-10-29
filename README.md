# README

This README would normally document whatever steps are necessary to get the
application up and running.

## Background jobs

- `bin/dev` now starts a Sidekiq worker alongside the Rails server (see `Procfile.dev`).
- You can run the worker directly with `bin/jobs`, which executes `bundle exec sidekiq -C config/sidekiq.yml`.
- Redis is required; configure the connection via `SIDEKIQ_REDIS_URL` or fallback `REDIS_URL`.
