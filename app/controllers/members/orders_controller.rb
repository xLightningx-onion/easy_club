# frozen_string_literal: true

class Members::OrdersController < Members::ApplicationController
  include Members::OrderSummary

  def show
    @order = find_order

    unless @order
      redirect_to members_dashboards_path, alert: "We couldn't find that order."
      return
    end

    authorize! @order, :show?
    prepare_order_summary(@order)
  end

  private

  def find_order
    identifier = params[:id].to_s
    return if identifier.blank?

    scope = policy_scope(Order)
              .includes(
                :club,
                :payment_method,
                :user,
                { payment_transactions: :payment_method },
                { order_items: [:member, { plan: :product }] },
                { staggered_payment_schedule: :installments }
              )

    scope.find_by(id: identifier) ||
      scope.find_by("UPPER(orders.number) = ?", identifier.upcase)
  end
end
