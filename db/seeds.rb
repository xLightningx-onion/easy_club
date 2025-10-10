# frozen_string_literal: true

staff = User.find_or_create_by!(email: "staff@example.com") do |user|
  user.password = "123456789012"
  user.password_confirmation = "123456789012"
  user.staff = true
  user.role = "admin"
end

club = Club.find_or_create_by!(name: "Acme FC") do |record|
  record.sender_email = "noreply@acmefc.example"
  record.color_palette = { "primary" => "#0EA5E9" }
  record.settings = {
    "finance" => { "currency" => "ZAR", "vat_rate" => 0.15 },
    "payments" => { "provider" => "mock" }
  }
end

ClubRole.find_or_create_by!(club:, user: staff) do |role|
  role.role = :admin
end

Club.with_current(club) do
  ConsentType.find_or_create_by!(club:, key: "media", version: 1) do |consent|
    consent.body_markdown = "Media consent placeholder"
  end

  %w[U8 U10 U12 U13 U15 U17].each_with_index do |name, index|
    AgeBand.find_or_create_by!(club:, name:) do |band|
      band.min_age_years = 6 + (index * 2)
      band.max_age_years = 7 + (index * 2)
      band.dob_cutoff = Date.new(Date.current.year, 1, 1)
    end
  end

  registration = Product.find_or_create_by!(club:, name: "Registration Fee") do |product|
    product.vat_applicable = true
    product.price_cents = 50_000
    product.price_currency = "ZAR"
  end

  Plan.find_or_create_by!(club:, product: registration, plan_type: :once_off)

  Template.find_or_create_by!(club:, name: "Payment Reminder") do |template|
    template.channel = "email"
    template.subject = "Invoice payment reminder"
    template.body = "Hello {{guardian_name}}, your invoice {{invoice_number}} is due on {{invoice_due_at}}."
    template.variables = %w[guardian_name invoice_number invoice_due_at]
  end
end
