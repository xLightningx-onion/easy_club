# frozen_string_literal: true

class Admin::InvoicesController < BaseController
  before_action :set_invoice, only: :show

  def index
    @invoices = Invoice.includes(:club, :member).order(created_at: :desc).limit(100)
  end

  def show; end

  def reconciliation
    @payments = Payment.includes(:invoice, :club).order(created_at: :desc).limit(100)
  end

  private

  def set_invoice
    @invoice = Invoice.find(params[:id])
  end
end
