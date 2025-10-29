# frozen_string_literal: true

module Members::CartContext
  extend ActiveSupport::Concern

  included do
    before_action :ensure_cart_club!
    around_action :with_cart_club_context
  end

  private

  def ensure_cart_club!
    cart = requested_cart
    if cart
      @club = cart.club
      return
    end

    @club = resolve_cart_club
    return if @club

    redirect_to members_dashboards_path, alert: "We couldn't find an active cart. Start a membership to begin checkout."
  end

  def with_cart_club_context
    return if performed?

    Club.with_current(@club) { yield }
  end

  def resolve_cart_club
    return requested_cart.club if requested_cart
    return Club.find_by(id: params[:club_id]) if params[:club_id].present?
    return current_club if current_club.present?

    Cart.where(user: current_user, status: %i[unpaid pending_payment partially_paid])
        .order(updated_at: :desc)
        .first&.club
  end

  def requested_cart
    return @requested_cart if defined?(@requested_cart)

    cart = nil

    if params[:cart_id].present?
      cart = Cart.where(user: current_user).includes(:club).find_by(id: params[:cart_id])
    elsif params[:order_id].present?
      order = policy_scope(Order).find_by(id: params[:order_id])
      cart = order&.cart if order && order.user_id == current_user&.id
    end

    if cart && cart.user_id == current_user&.id
      @requested_cart = cart
    else
      @requested_cart = nil
    end
  end

  def members_cart_redirect_path(**extra_params)
    target_cart = requested_cart
    params_with_cart = extra_params.dup
    params_with_cart[:cart_id] ||= target_cart&.id if target_cart

    if @club
      members_cart_path({ club_id: @club.id }.merge(params_with_cart))
    else
      members_cart_path(params_with_cart)
    end
  end
end
