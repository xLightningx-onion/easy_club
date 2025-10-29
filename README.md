# README

This README would normally document whatever steps are necessary to get the
application up and running.

## Background jobs
- Set `WHATSAPP_PAYMENT_FAILURE_TEMPLATE_ID` if you want WhatsApp alerts for failed payments to use a custom template.
- Staggered installments are auto-charged via `StaggeredPayments::SchedulerJob`; ensure your recurring scheduler (e.g. `config/recurring.yml`) is running so Sidekiq picks it up.


- `bin/dev` now starts a Sidekiq worker alongside the Rails server (see `Procfile.dev`).
- You can run the worker directly with `bin/jobs`, which executes `bundle exec sidekiq -C config/sidekiq.yml`.
- Redis is required; configure the connection via `SIDEKIQ_REDIS_URL` or fallback `REDIS_URL`.
