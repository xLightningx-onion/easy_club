# frozen_string_literal: true

class InvoicePdfRenderer
  def self.render(invoice)
    new(invoice).render
  end

  def initialize(invoice)
    @invoice = invoice
  end

  def render
    # TODO: integrate Grover or Prawn for rich layout. Placeholder renders text-based PDF.
    Prawn::Document.new do |pdf|
      pdf.text "Invoice #{@invoice.number}", size: 18, style: :bold
      pdf.move_down 12
      pdf.text "Member: #{@invoice.member.full_name}", size: 12
      pdf.text "Status: #{@invoice.status.humanize}", size: 12
      pdf.text "Due: #{@invoice.due_at&.to_date || 'N/A'}", size: 12
      pdf.move_down 12
      pdf.text "Items", style: :bold
      @invoice.invoice_items.each do |item|
        pdf.text "- #{item.description || item.product&.name}: #{format_money(item.amount_cents, item.amount_currency)}"
      end
      pdf.move_down 12
      pdf.text "Total: #{format_money(@invoice.total_cents, @invoice.total_currency)}", style: :bold
    end.render
  end

  private

  def format_money(cents, currency)
    Money.new(cents, currency).format
  end
end
