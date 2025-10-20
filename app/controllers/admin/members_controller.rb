# frozen_string_literal: true

class Admin::MembersController < Admin::BaseController
  before_action :set_member, only: :show

  def index
    @members = Member.includes(:club).order(:last_name, :first_name)
  end

  def show
    @team_memberships = @member.team_memberships.includes(:team).order(created_at: :desc)
    @consents = @member.consents.includes(:consent_type).order(created_at: :desc)
    @guardianships = @member.guardianships.includes(:guardian).order(created_at: :desc)
    @invoices = @member.invoices.includes(:payments, :invoice_items, :family_account).order(due_at: :desc)
    @payments = @invoices.flat_map(&:payments).sort_by(&:created_at).reverse
    @audit_entries = @member.audits.order(created_at: :desc).limit(10)
    @orders = @member.orders.includes(:payment_method, :payment_transactions).order(created_at: :desc)
  end

  private

  def set_member
    @member = Member.includes(:club, :user).find(params[:id])
  end
end
