# frozen_string_literal: true

staff = User.find_or_create_by!(email: "staff@example.com") do |user|
  user.password = "123456789012"
  user.password_confirmation = "123456789012"
  user.staff = true
  user.role = "admin"
  user.first_name = "Admin"
  user.last_name = "User"
  user.country_code = "+27"
  user.mobile_number = "0000000000"
end

club = Club.find_or_create_by!(name: "Acme FC") do |record|
  record.sender_email = "noreply@acmefc.example"
  record.color_palette = { "primary" => "#0EA5E9" }
  record.settings = {
    "finance" => { "currency" => "ZAR", "vat_rate" => 0.15 },
    "payments" => { "provider" => "mock" }
  }
end

club.update!(
  location_name: "Acme FC Training Ground",
  address_line1: "123 Main Road",
  city: "Johannesburg",
  region: "Gauteng",
  postal_code: "2000",
  country: "South Africa",
  latitude: -26.204100,
  longitude: 28.047300,
  google_place_id: club.google_place_id.presence || "sample-acme-fc-training-ground"
)

cape_club = Club.find_or_create_by!(name: "Cape Town Lightning") do |record|
  record.sender_email = "contact@capetownlightning.example"
  record.color_palette = { "primary" => "#2563EB" }
  record.settings = {
    "finance" => { "currency" => "ZAR", "vat_rate" => 0.15 },
    "payments" => { "provider" => "mock" }
  }
end

cape_club.update!(
  location_name: "Cape Town Lightning Clubhouse",
  address_line1: "45 Beach Road",
  city: "Cape Town",
  region: "Western Cape",
  postal_code: "8001",
  country: "South Africa",
  latitude: -33.924870,
  longitude: 18.424055,
  google_place_id: cape_club.google_place_id.presence || "sample-cape-town-lightning"
)

ClubRole.find_or_create_by!(club:, user: staff) do |role|
  role.role = :admin
end
ClubRole.find_or_create_by!(club: cape_club, user: staff) do |role|
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

  [
    { label: "Junior Player", min_age: 6, max_age: 12, base_price: Money.new(65_00, "ZAR") },
    { label: "Senior Player", min_age: 13, max_age: 18, base_price: Money.new(85_00, "ZAR") },
    { label: "Coach", min_age: 18, max_age: 65, base_price: Money.new(0, "ZAR") }
  ].each do |attributes|
    membership_type = MembershipType.find_or_initialize_by(club:, label: attributes[:label])
    membership_type.assign_attributes(
      min_age_years: attributes[:min_age],
      max_age_years: attributes[:max_age],
      gender: :unisex,
      base_price_cents: attributes[:base_price].cents,
      base_price_currency: attributes[:base_price].currency.iso_code
    )
    membership_type.save!

    product = club.products.find_or_initialize_by(sku: "membership-type-#{membership_type.id}")
    product.name = membership_type.label
    product.price_cents = attributes[:base_price].cents
    product.price_currency = attributes[:base_price].currency.iso_code
    product.category ||= "membership"
    product.save!

    plan = membership_type.plan || club.plans.find_or_initialize_by(product:, plan_type: :once_off)
    plan.product = product
    plan.plan_type ||= :once_off
    plan.save!

    membership_type.update!(plan: plan) unless membership_type.plan_id == plan.id
  end

  [
    { prompt: "Does the member have any allergies?", question_type: :long_text, required: true },
    { prompt: "Is an inhaler required during activity?", question_type: :boolean, required: false }
  ].each_with_index do |attributes, index|
    MedicalQuestion.find_or_create_by!(club:, prompt: attributes[:prompt]) do |question|
      question.question_type = attributes[:question_type]
      question.required = attributes[:required]
      question.position = index
      question.active = true
    end
  end

  [
    {
      title: "Parent/guardian consent",
      body: "I confirm I am the legal guardian of the participant and consent to their involvement in all club-sanctioned activities.",
      required: true
    },
    {
      title: "Photography release",
      body: "I grant the club permission to capture and use photographs or video for promotional purposes.",
      required: false
    }
  ].each_with_index do |attributes, index|
    ClubTerm.find_or_create_by!(club:, title: attributes[:title]) do |term|
      term.body = attributes[:body]
      term.required = attributes[:required]
      term.position = index
      term.active = true
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

  [
    {
      first_name: "Damian",
      last_name: "Giulietti",
      dob: Date.new(2010, 9, 12),
      gender: "male",
      role: :player
    },
    {
      first_name: "Naledi",
      last_name: "Mokoena",
      dob: Date.new(2008, 4, 3),
      gender: "female",
      role: :coach,
      safeguarding_flag: true,
      safeguarding_reason: "Awaiting updated background check."
    },
    {
      first_name: "Alex",
      last_name: "Pretorius",
      dob: Date.new(2012, 1, 27),
      gender: "non_binary",
      role: :player
    }
  ].each do |attributes|
    Member.find_or_create_by!(club:, first_name: attributes[:first_name], last_name: attributes[:last_name]) do |member|
      member.assign_attributes(attributes)
    end
  end
end
