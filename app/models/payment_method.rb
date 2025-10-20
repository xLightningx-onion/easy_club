# frozen_string_literal: true

class PaymentMethod < ApplicationRecord
  include TenantScoped

  PROVIDERS = %w[paygate].freeze

  belongs_to :club
  belongs_to :user
  has_many :orders, dependent: :restrict_with_exception
  has_many :payment_transactions, dependent: :restrict_with_exception

  validates :provider, inclusion: { in: PROVIDERS }
  validates :external_reference, presence: true
  validates :last_four, length: { is: 4 }, allow_nil: true
  validates :expiry_month, numericality: { greater_than: 0, less_than_or_equal_to: 12 }, allow_nil: true
  validates :expiry_year, numericality: { greater_than_or_equal_to: 2000 }, allow_nil: true

  scope :for_user, ->(user) { where(user:) }

  def masked_label
    return "Saved card" unless last_four && brand

    "#{brand} ending •••• #{last_four}"
  end
end
