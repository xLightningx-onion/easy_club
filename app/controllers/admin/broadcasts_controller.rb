# frozen_string_literal: true

class Admin::BroadcastsController < Admin::BaseController
  before_action :set_broadcast, only: %i[show update approve]

  def index
    @broadcasts = Broadcast.includes(:club).order(created_at: :desc).limit(100)
  end

  def show; end

  def update
    if @broadcast.update(broadcast_params)
      redirect_to admin_broadcast_path(@broadcast), notice: "Broadcast updated."
    else
      render :show, status: :unprocessable_entity
    end
  end

  def approve
    @broadcast.update!(
      status: :approved,
      approved_by: current_user,
      approved_at: Time.current
    )
    redirect_to admin_broadcast_path(@broadcast), notice: "Broadcast approved."
  end

  private

  def set_broadcast
    @broadcast = Broadcast.find(params[:id])
  end

  def broadcast_params
    params.require(:broadcast).permit(:status, :scheduled_at)
  end
end
