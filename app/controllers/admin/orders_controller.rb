# frozen_string_literal: true

class Admin::OrdersController < Admin::BaseController
  def index
    authorize! Order, :index?
    @orders = policy_scope(Order).includes(:club, :user, :payment_method).order(created_at: :desc).limit(100)
  end

  def show
    @order = policy_scope(Order).includes(:club, :user, :payment_method).find(params[:id])
    authorize! @order
    @order_items = @order.order_items.includes(:member, :plan, :product)
    @transactions = @order.payment_transactions.includes(:payment_method).order(created_at: :desc)
  end
end
