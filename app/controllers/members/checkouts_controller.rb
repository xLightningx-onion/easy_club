# frozen_string_literal: true

class Members::CheckoutsController < Members::ApplicationController
  include Members::CartContext
  include Members::OrderSummary

  before_action :set_cart, only: :create

  def create
    authorize! @cart, :update?

    if @cart.cart_items.empty?
      redirect_to members_cart_redirect_path, alert: "Your cart is empty."
      return
    end

    checkout = checkout_params
    payment_source = checkout[:payment_source].presence || (policy_scope(PaymentMethod).usable.where(club: @club).exists? ? "saved" : "new")

    payment_mode = checkout[:payment_mode].presence_in(%w[full staggered]) || @cart.payment_mode.presence || "full"
    selected_plan = @cart.staggered_payment_plan if @cart.payment_mode == "staggered"

    if payment_mode == "staggered"
      plan_id = checkout[:staggered_payment_plan_id].presence || selected_plan&.id
      selected_plan = @club.staggered_payment_plans.find_by(id: plan_id)
      unless selected_plan
        redirect_to members_cart_redirect_path, alert: "Please select a valid staggered payment plan." and return
      end
    else
      selected_plan = nil
    end

    unless @cart.update(payment_mode:, staggered_payment_plan: selected_plan)
      redirect_to members_cart_redirect_path, alert: @cart.errors.full_messages.to_sentence and return
    end

    saved_card_cvv = nil

    if payment_source == "saved"
      payment_method = resolve_payment_method(checkout)
      if payment_method.nil?
        redirect_to members_cart_redirect_path, alert: "Please select a saved card or enter a new card." and return
      end

      saved_card_cvv = normalize_saved_card_cvv(checkout[:saved_card_cvv])
      if saved_card_cvv.blank?
        redirect_to members_cart_redirect_path, alert: "Please enter the CVV for your saved card." and return
      end
    else
      payment_method = nil
    end

    card_details = if payment_source == "new"
                     normalize_card_details(checkout[:card])
    else
                     {}
    end

    result = Checkouts::Submit.new(
      cart: @cart,
      user: current_user,
      payment_method:,
      tokenize: payment_source == "new",
      card_details: card_details,
      saved_card_cvv: saved_card_cvv,
      payment_mode:,
      staggered_payment_plan: selected_plan
    ).call

    redirect_to members_checkout_success_path(reference: result.order.number)
  rescue Checkouts::Submit::Failure => e
    Rails.logger.warn("Checkout payment failed: #{e.message}")

    # SendPaymentFailedJob.perform_later(e.order.id, message: nil, payment_transaction_id: e.payment_tx.id) rescue nil
    redirect_to members_checkout_failure_path(
                  transaction: e.transaction&.id,
                  reference: e.order&.number,
                  order_id: e.order&.id,
                  installment_id: e.installment&.id
                ),
                alert: e.message
  rescue Checkouts::Submit::EmptyCartError
    redirect_to members_cart_redirect_path, alert: "Your cart is empty."
  rescue Checkouts::Submit::Error => e
    Rails.logger.error("Checkout failed: #{e.message}")
    redirect_to members_cart_redirect_path, alert: "We couldn't start the payment. Please try again."
  end

  def success
    reference = params[:reference].to_s.strip
    if reference.blank?
      redirect_to members_cart_redirect_path, alert: "We couldn't find that payment confirmation."
      return
    end

    @order = policy_scope(Order)
              .includes(
                :payment_method,
                :user,
                { payment_transactions: :payment_method },
                { order_items: [ :member, { plan: :product } ] },
                { staggered_payment_schedule: :installments }
              )
              .find_by("UPPER(orders.number) = ?", reference.upcase)

    unless @order && (@order.status_paid? || @order.status_pending_payment?)
      redirect_to members_cart_redirect_path, alert: "We couldn't find that payment confirmation."
      return
    end

    authorize! @order, :show?

    payment_transaction = @order.payment_transactions.max_by { |tx| tx.processed_at || tx.created_at }
    prepare_order_summary(@order, payment_transaction:)
  end

  def failure
    transaction_id = params[:transaction]
    reference = params[:reference]

    @transaction = PaymentTransaction.find_by(id: transaction_id) if transaction_id.present?
    @order = @transaction&.order
    @order ||= policy_scope(Order).find_by(id: params[:order_id]) if params[:order_id].present?
    @order ||= policy_scope(Order).includes(:payment_transactions, :payment_method, :user, { order_items: [ :member, { plan: :product } ] }, { staggered_payment_schedule: :installments }).find_by("UPPER(orders.number) = ?", reference.to_s.upcase) if reference.present?

    unless @order
      redirect_to members_cart_redirect_path, alert: "We couldn't find that payment attempt."
      return
    end

    authorize! @order, :show?

    prepare_order_summary(@order, payment_transaction: @transaction)

    @failed_installment = find_failed_installment(params[:installment_id])
    @installment_details = build_installment_details(@failed_installment)

    @amount_attempted =
      if @transaction
        Money.new(@transaction.amount_cents, @transaction.amount_currency)
      elsif @installment_details&.dig(:amount).is_a?(Money)
        @installment_details[:amount]
      else
        Money.new(@order.total_cents, @order.total_currency)
      end
    @installment_count = @schedule_installments&.size.to_i

    @error_message = flash[:alert].presence || @transaction&.metadata&.fetch("error", nil).presence || "Payment could not be processed."
    flash.now[:alert] = @error_message
  end

  private

  def set_cart
    @cart = requested_cart || current_cart
    unless @cart&.user_id == current_user&.id
      redirect_to members_dashboards_path, alert: "We couldn't find an active cart. Start a membership to begin checkout." and return
    end
  end

  def checkout_params
    permitted = params.fetch(:checkout, {}).permit(
      :payment_source,
      :payment_method_id,
      :saved_card_cvv,
      :payment_mode,
      :staggered_payment_plan_id,
      :tokenize,
      card: %i[number expiry_month expiry_year cvv holder_name]
    ).to_h

    permitted.deep_symbolize_keys
  end

  def find_failed_installment(param_installment_id)
    return StaggeredPaymentScheduleInstallment.find_by(id: param_installment_id) if param_installment_id.present?
    return nil unless @order&.staggered_payment_schedule

    if (metadata_id = @transaction&.metadata&.fetch("installment_id", nil))
      return StaggeredPaymentScheduleInstallment.find_by(id: metadata_id)
    end

    @schedule_installments&.find do |installment|
      installment.status_failed? && installment.payment_transaction_id == @transaction&.id
    end
  end

  def build_installment_details(installment)
    return nil unless installment

    amount = Money.new(installment.amount_cents, installment.amount_currency)
    position = nil
    if @schedule_installments.present?
      idx = @schedule_installments.index { |inst| inst.id == installment.id }
      position = idx + 1 if idx
    end

    {
      installment: installment,
      number: position,
      amount: amount,
      due_at: installment.due_at
    }
  end

  def resolve_payment_method(checkout)
    return unless checkout[:payment_source] == "saved" && checkout[:payment_method_id].present?

    method = policy_scope(PaymentMethod).usable.find_by(id: checkout[:payment_method_id])
    return unless method

    if method.expired?
      method.update!(default: false)
      raise Checkouts::Submit::Error, "That saved card has expired. Please use a different card."
    end

    authorize! method, :show?
    method
  end

  def normalize_card_details(raw_details)
    details = (raw_details || {}).to_h.symbolize_keys

    number = details[:number].to_s.gsub(/\D/, "")
    expiry_month = details[:expiry_month].to_i
    expiry_year = details[:expiry_year].to_i
    cvv = details[:cvv].to_s.strip
    holder_name = details[:holder_name].to_s.strip

    if number.blank? || number.length < 12 || expiry_month.zero? || expiry_year.zero? || cvv.blank?
      raise Checkouts::Submit::Error, "Please provide complete card details."
    end

    if expiry_year < Time.current.year || (expiry_year == Time.current.year && expiry_month < Time.current.month)
      raise Checkouts::Submit::Error, "The card you entered is expired."
    end

    fallback_name = [ current_user.first_name.to_s, current_user.last_name.to_s ].reject(&:blank?).join(" ")
    fallback_name = current_user.email.split("@").first if fallback_name.blank?

    {
      number:,
      expiry_month:,
      expiry_year:,
      cvv:,
      holder_name: holder_name.presence || fallback_name
    }
  end

  def normalize_saved_card_cvv(raw_value)
    cleaned = raw_value.to_s.gsub(/\D/, "")
    return "" if cleaned.blank?

    return cleaned if cleaned.length.between?(3, 4)

    ""
  end
end
