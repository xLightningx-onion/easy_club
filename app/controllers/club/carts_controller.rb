# frozen_string_literal: true

class Club::CartsController < Club::BaseController
  def show
    @cart = current_cart
    authorize! @cart, :show?
    @cart_items = @cart.cart_items.includes(member: :club, plan: :product)
    @available_members = manageable_members
    @payment_methods = policy_scope(PaymentMethod).where(club: current_club).order(default: :desc, created_at: :desc)
  end
end
