# frozen_string_literal: true

class Club::CartsController < Club::BaseController
  def show
    @cart = current_cart
    authorize! @cart, :show?
    @cart_items = @cart.cart_items.includes(member: :club, plan: :product)
    @available_members = manageable_members
    @payment_methods = policy_scope(PaymentMethod)
                         .where(club: current_club)
                         .usable
                         .order(default: :desc, created_at: :desc)
    @selected_payment_mode = @cart.payment_mode.presence || "full"
    @selected_payment_plan_id = @cart.staggered_payment_plan_id
    @selected_payment_plan = current_club.staggered_payment_plans.find_by(id: @selected_payment_plan_id)
    unless @selected_payment_plan
      @selected_payment_plan_id = nil
      @selected_payment_mode = "full"
    end

    @base_price = resolve_base_price
    @cart_total_money = Money.new(@cart.total_cents, @cart.total_currency)
    @selected_plan_breakdown = build_plan_breakdown(@selected_payment_plan, @base_price)
  end

  private

  def resolve_base_price
    membership_type = @cart.cart_items.includes(member: :membership_type).map { |item| item.member.membership_type }.compact.first
    membership_type&.base_price
  end

  def build_plan_breakdown(plan, base_price)
    return [] unless plan && base_price

    plan.ordered_installments.map do |installment|
      amount_cents = (base_price.cents * installment.percentage.to_f / 100.0).round
      amount = Money.new(amount_cents, base_price.currency.iso_code)
      [installment, amount]
    end
  end
end
