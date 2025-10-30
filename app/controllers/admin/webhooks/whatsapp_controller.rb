# frozen_string_literal: true

class Admin::Webhooks::WhatsappController < ActionController::Base
  protect_from_forgery with: :null_session

  def create
    club = resolve_club
    return head :not_found unless club

    InboundMessage.create!(club: club, channel: "whatsapp", payload: request.request_parameters)
    head :ok
  rescue StandardError => e
    Rails.logger.error("Whatsapp webhook error: #{e.message}")
    head :bad_request
  end

  private

  def resolve_club
    Club.find_by_param(params[:club_id]) || Club.find_by(primary_domain: request.host)
  end
end
