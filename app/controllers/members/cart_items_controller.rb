# frozen_string_literal: true

class Members::CartItemsController < Members::ApplicationController
  include Members::CartContext

  before_action :set_cart
  before_action :set_cart_item, only: %i[update destroy]

  def create
    member = policy_scope(Member).find(member_and_plan_params[:member_id])
    authorize! member, :show?
    plan = policy_scope(Plan).find(member_and_plan_params[:plan_id])

    authorize! @cart, :update?

    @cart_item = @cart.cart_items.find_or_initialize_by(member:, plan:)
    @cart_item.quantity = [desired_quantity, 1].max

    if @cart_item.save
      redirect_to members_cart_redirect_path, notice: "Membership added to cart."
    else
      redirect_back fallback_location: members_cart_redirect_path, alert: @cart_item.errors.full_messages.to_sentence
    end
  end

  def update
    authorize! @cart, :update?

    quantity = desired_quantity
    if quantity <= 0
      @cart_item.destroy
      redirect_to members_cart_redirect_path, notice: "Item removed from cart."
    elsif @cart_item.update(quantity: [quantity, 1].max)
      redirect_to members_cart_redirect_path, notice: "Cart updated."
    else
      redirect_back fallback_location: members_cart_redirect_path, alert: @cart_item.errors.full_messages.to_sentence
    end
  end

  def destroy
    authorize! @cart, :update?
    @cart_item.destroy
    redirect_to members_cart_redirect_path, notice: "Item removed from cart."
  end

  private

  def set_cart
    @cart = current_cart
  end

  def set_cart_item
    @cart_item = @cart.cart_items.find(params[:id])
  end

  def member_and_plan_params
    {
      member_id: params.require(:member_id),
      plan_id: params.require(:plan_id)
    }
  end

  def desired_quantity
    params.fetch(:quantity, 1).to_i
  end
end
