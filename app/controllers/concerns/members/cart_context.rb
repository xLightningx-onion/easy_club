# frozen_string_literal: true

module Members::CartContext
  extend ActiveSupport::Concern

  included do
    before_action :ensure_cart_club!
    around_action :with_cart_club_context
  end

  private

  def ensure_cart_club!
    @club = resolve_cart_club
    return if @club

    redirect_to members_dashboards_path, alert: "We couldn't find an active cart. Start a membership to begin checkout."
  end

  def with_cart_club_context
    return if performed?

    Club.with_current(@club) { yield }
  end

  def resolve_cart_club
    return Club.find_by(id: params[:club_id]) if params[:club_id].present?
    return current_club if current_club.present?

    Cart.where(user: current_user, status: %i[unpaid pending_payment partially_paid])
        .order(updated_at: :desc)
        .first&.club
  end

  def members_cart_redirect_path(**extra_params)
    if @club
      members_cart_path({ club_id: @club.id }.merge(extra_params))
    else
      members_cart_path(extra_params)
    end
  end
end
