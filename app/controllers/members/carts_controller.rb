# frozen_string_literal: true

class Members::CartsController < Members::ApplicationController
  include Members::CartContext
  layout "membership_registration", only: [ :show ]


  def show
    @cart = current_cart
    authorize! @cart, :show?

    @cart_items = @cart.cart_items.includes(member: [ :club, :membership_type ], plan: :product)
    @available_members = manageable_members
    @payment_methods = policy_scope(PaymentMethod)
                         .where(club: @club)
                         .usable
                         .order(default: :desc, created_at: :desc)

    @selected_payment_mode = @cart.payment_mode.presence || "full"
    @selected_payment_plan_id = @cart.staggered_payment_plan_id
    @selected_payment_plan = @club.staggered_payment_plans.find_by(id: @selected_payment_plan_id)

    unless @selected_payment_plan
      @selected_payment_plan_id = nil
      @selected_payment_mode = "full"
    end

    @cart_total_money = @cart.full_total_money
    @base_price = @cart.base_price_total(cart_items: @cart_items)
    @staggered_total_money = @base_price || @cart_total_money
    @selected_plan_breakdown = build_plan_breakdown(@selected_payment_plan, @base_price)
    @staggered_schedule = @cart.order&.staggered_payment_schedule
    @installment_total_count = determine_installment_total(@staggered_schedule, @selected_plan_breakdown)
    @current_installment = determine_current_installment(@staggered_schedule, @selected_plan_breakdown)
  end

  private

  def build_plan_breakdown(plan, base_price)
    return [] unless plan && base_price

    plan.ordered_installments.map do |installment|
      amount_cents = (base_price.cents * installment.percentage.to_f / 100.0).round
      amount = Money.new(amount_cents, base_price.currency.iso_code)
      [ installment, amount ]
    end
  end

  def determine_installment_total(schedule, plan_breakdown)
    if schedule&.installments&.any?
      schedule.installments.count
    else
      plan_breakdown.size
    end
  end

  def determine_current_installment(schedule, plan_breakdown)
    if schedule&.installments&.any?
      installments = schedule.installments.order(:position, :id).to_a
      current = installments.find { |installment| !installment.status_paid? } || installments.last
      return nil unless current

      {
        number: installments.index(current).to_i + 1,
        amount: current.amount,
        due_at: current.due_at,
        status: current.status
      }
    elsif plan_breakdown.present?
      plan_installment, amount = plan_breakdown.first
      {
        number: 1,
        amount: amount,
        due_on: plan_installment.due_on
      }
    end
  end
end
