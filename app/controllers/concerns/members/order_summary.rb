# frozen_string_literal: true

module Members
  module OrderSummary
    extend ActiveSupport::Concern

    private

    def prepare_order_summary(order, payment_transaction: nil)
      @order = order
      @club ||= order.club

      @payment_transaction =
        payment_transaction ||
        order.payment_transactions.status_succeeded.order(processed_at: :desc, updated_at: :desc, created_at: :desc).first ||
        order.payment_transactions.order(processed_at: :desc, updated_at: :desc, created_at: :desc).first

      @schedule = order.staggered_payment_schedule
      @schedule_installments = if @schedule
                                 @schedule.installments.order(:position, :id).to_a
      else
                                 []
      end

      currency_code = order.total_currency

      if @schedule_installments.any?
        @completed_installments = @schedule_installments.select(&:status_paid?)
        @upcoming_installments = @schedule_installments.reject { |inst| inst.status_paid? || inst.status_cancelled? }
        @current_installment = @completed_installments.last
        @next_installment = @upcoming_installments.first
        paid_cents = @completed_installments.sum(&:amount_cents)
        outstanding_cents = @upcoming_installments.sum(&:amount_cents)
      else
        @completed_installments = []
        @upcoming_installments = []
        @current_installment = nil
        @next_installment = nil
        paid_cents = if order.status_paid?
                       order.total_cents
        else
                       order.payment_transactions.status_succeeded.sum(:amount_cents)
        end
        outstanding_cents = [ order.total_cents - paid_cents, 0 ].max
      end

      @amount_paid_so_far = Money.new(paid_cents, currency_code)
      @outstanding_amount = Money.new(outstanding_cents, currency_code)

      @amount_captured_now =
        if @payment_transaction
          Money.new(@payment_transaction.amount_cents, @payment_transaction.amount_currency)
        elsif @current_installment
          Money.new(@current_installment.amount_cents, @current_installment.amount_currency)
        else
          Money.new(0, currency_code)
        end
    end
  end
end
