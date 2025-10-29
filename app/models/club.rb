# frozen_string_literal: true

class Club < ApplicationRecord
  audited
  thread_mattr_accessor :current_id

  has_one_attached :logo
  has_one_attached :banner

  has_many :club_roles, dependent: :destroy
  has_many :users, through: :club_roles
  has_many :members, dependent: :destroy
  has_many :seasons, dependent: :destroy
  has_many :products, dependent: :destroy
  has_many :plans, dependent: :destroy
  has_many :price_rules, dependent: :destroy
  has_many :age_bands, dependent: :destroy
  has_many :age_band_price_tiers, dependent: :destroy
  has_many :membership_types, dependent: :destroy
  has_many :membership_type_price_tiers, dependent: :destroy
  has_many :invoices, dependent: :destroy
  has_many :payments, dependent: :destroy
  has_many :vouchers, dependent: :destroy
  has_many :wallets, dependent: :destroy
  has_many :carts, dependent: :destroy
  has_many :orders, dependent: :destroy
  has_many :payment_transactions, through: :orders
  has_many :payment_methods, dependent: :destroy
  has_many :staggered_payment_plans, dependent: :destroy
  has_many :teams, dependent: :destroy
  has_many :fixtures, dependent: :destroy
  has_many :templates, dependent: :destroy
  has_many :broadcasts, dependent: :destroy
  has_many :outbound_messages, dependent: :destroy
  has_many :report_runs, dependent: :destroy
  has_many :inbound_messages, dependent: :destroy

  has_many :membership_questions, -> { order(:position, :created_at) }, dependent: :destroy, inverse_of: :club
  has_many :membership_question_responses, dependent: :destroy
  has_many :club_terms, -> { order(:position, :created_at) }, dependent: :destroy
  has_many :club_term_acceptances, through: :club_terms
  has_many :medical_questions, dependent: :destroy
  has_many :default_price_tiers,
           -> { order(:position, :starts_on, :created_at) },
           class_name: "ClubDefaultPriceTier",
           dependent: :destroy,
           inverse_of: :club

  accepts_nested_attributes_for :membership_questions, allow_destroy: true, reject_if: proc { |attributes| attributes["prompt"].blank? }

  def self.with_current(club, &block)
    previous = current_id
    self.current_id = club&.id
    yield
  ensure
    self.current_id = previous
  end

  def self.current
    find_by(id: current_id) if current_id
  end

  scope :publicly_listed, -> { where(public_listing: true) }

  validates :latitude, numericality: true, allow_nil: true
  validates :longitude, numericality: true, allow_nil: true

  def location?
    latitude.present? && longitude.present?
  end

  def active_staggered_payment_plans
    today = Date.current

    staggered_payment_plans
      .active
      .where("starts_on IS NULL OR starts_on <= ?", today)
      .where("ends_on IS NULL OR ends_on >= ?", today)
      .includes(:installments)
      .order(:name)
  end

  def oklch_color
    color_palette["theme_oklch"]
  end

  def whatsapp_otp_template_id_with_fallback
    whatsapp_otp_template_id.presence || Settings.whatsapp.otp_template_id.presence
  end

  def whatsapp_order_confirmation_template_id_with_fallback
    whatsapp_order_confirmation_template_id.presence || Settings.whatsapp.order_confirmation_template_id.presence
  end

  def whatsapp_access_token_with_fallback
    whatsapp_access_token.presence || Settings.whatsapp.access_token.presence
  end

  def whatsapp_sender_id_with_fallback
    whatsapp_sender_id.presence || Settings.whatsapp.sender_id.presence
  end

  def whatsapp_business_id_with_fallback
    whatsapp_business_id.presence || Settings.whatsapp.business_id.presence
  end

  def whatsapp_credentials
    {
      access_token: whatsapp_access_token_with_fallback,
      sender_id: whatsapp_sender_id_with_fallback,
      business_id: whatsapp_business_id_with_fallback
    }.with_indifferent_access
  end

  def whatsapp_configured?
    whatsapp_credentials.values.all?(&:present?)
  end
end
