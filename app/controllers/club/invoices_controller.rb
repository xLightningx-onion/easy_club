# frozen_string_literal: true

class Club::InvoicesController < Club::BaseController
  before_action :set_invoice, only: %i[show pay download]

  def index
    authorize! Invoice, :index?
    @invoices = policy_scope(Invoice).includes(:member).order(due_at: :asc)
  end

  def show
    authorize! @invoice
    @payments = @invoice.payments.order(created_at: :desc)
    @pricing = Pricing::Engine.price(invoice: @invoice)
  end

  def pay
    authorize! @invoice, :pay?

    result = Payments::Processor.new(club: current_club).pay(
      invoice: @invoice,
      method: payment_params[:method],
      source_token: payment_params[:token],
      voucher_code: payment_params[:voucher]
    )

    if result.success?
      redirect_to club_invoice_path(@invoice), notice: "Payment received."
    else
      redirect_to club_invoice_path(@invoice), alert: result.error || "Payment failed."
    end
  end

  def download
    authorize! @invoice
    pdf_data = InvoicePdfRenderer.render(@invoice)
    send_data pdf_data, filename: "#{@invoice.number}.pdf", type: "application/pdf"
  end

  private

  def set_invoice
    @invoice = policy_scope(Invoice).find(params[:id])
  end

  def payment_params
    params.require(:payment).permit(:method, :token, :voucher)
  end
end
