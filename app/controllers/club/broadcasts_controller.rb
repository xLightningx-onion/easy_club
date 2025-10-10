# frozen_string_literal: true

class Club::BroadcastsController < Club::BaseController
  before_action :set_broadcast, only: :show

  def index
    authorize! Broadcast, :index?
    @broadcasts = policy_scope(Broadcast).order(created_at: :desc)
  end

  def new
    @broadcast = current_club.broadcasts.build(channel: "email", created_by: current_user)
    authorize! @broadcast
    load_templates
  end

  def create
    @broadcast = current_club.broadcasts.build(broadcast_params.merge(created_by: current_user))
    authorize! @broadcast
    @broadcast.status = @broadcast.requires_approval? ? :pending_approval : :approved

    if @broadcast.save
      Comms::BroadcastJob.perform_later(@broadcast.id) if @broadcast.status_approved?
      redirect_to club_broadcast_path(@broadcast), notice: "Broadcast queued."
    else
      load_templates
      render :new, status: :unprocessable_entity
    end
  end

  def show
    authorize! @broadcast
  end

  private

  def set_broadcast
    @broadcast = policy_scope(Broadcast).find(params[:id])
  end

  def broadcast_params
    attrs = params.require(:broadcast).permit(:title, :channel, :body, :template_id, :audience_type, :audience_filter)
    attrs[:audience_filter] = parse_filter(attrs[:audience_filter])
    attrs
  end

  def parse_filter(value)
    return {} if value.blank?

    JSON.parse(value)
  rescue JSON::ParserError
    {}
  end

  def load_templates
    @templates = current_club.templates.order(:name)
  end
end
