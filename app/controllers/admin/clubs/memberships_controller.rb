# frozen_string_literal: true

class Admin::Clubs::MembershipsController < Admin::BaseController
  before_action :set_club
  before_action :set_membership, only: :show

  def index
    authorize! Order, :index?
    @purchases = OrderItem
                   .includes(:member, plan: :product, order: :payment_method)
                   .joins(:order)
                   .where(orders: { club_id: @club.id })
                   .order("order_items.created_at DESC")
  end

  def show
    authorize! @order
    @transactions = @order.payment_transactions.includes(:payment_method).order(processed_at: :desc, created_at: :desc)
    @guardians = @member&.guardianships&.includes(:guardian) || []
    @question_responses = @member&.membership_question_responses&.includes(:membership_question) || []
  end

  private

  def set_club
    @club = Club.find(params[:club_id])
    authorize! @club, :update?
  end

  def set_membership
    @order_item = OrderItem
                    .includes(:member, plan: :product, order: :payment_method)
                    .joins(:order)
                    .where(orders: { club_id: @club.id })
                    .find(params[:id])
    @order = @order_item.order
    @member = @order_item.member
  end
end
