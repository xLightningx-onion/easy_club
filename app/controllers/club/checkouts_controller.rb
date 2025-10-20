# frozen_string_literal: true

class Club::CheckoutsController < Club::BaseController
  def create
    cart = current_cart
    authorize! cart, :update?

    if cart.cart_items.empty?
      redirect_to club_cart_path, alert: "Your cart is empty."
      return
    end

    payment_method = find_payment_method
    tokenize = ActiveModel::Type::Boolean.new.cast(params[:save_card])

    result = Checkouts::Submit.new(
      cart:,
      user: current_user,
      payment_method:,
      tokenize:,
      card_details: card_params
    ).call

    flash[:notice] = "Checkout initiated. Complete the payment to confirm the memberships."
    redirect_to club_cart_path(reference: result.order.number)
  rescue Checkouts::Submit::EmptyCartError
    redirect_to club_cart_path, alert: "Your cart is empty."
  rescue Checkouts::Submit::Error => e
    Rails.logger.error("Checkout failed: #{e.message}")
    redirect_to club_cart_path, alert: "We couldn't start the payment. Please try again."
  end

  private

  def find_payment_method
    return unless params[:payment_method_id].present?

    method = policy_scope(PaymentMethod).find(params[:payment_method_id])
    authorize! method, :show?
    method
  end

  def card_params
    params.fetch(:card, {}).permit(:number, :expiry_month, :expiry_year, :cvv, :holder_name).to_h
  rescue ActionController::ParameterMissing
    {}
  end
end
