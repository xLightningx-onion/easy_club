# frozen_string_literal: true

class Admin::Webhooks::PaymentsController < ActionController::Base
  protect_from_forgery with: :null_session

  def create
    club = resolve_club
    return head :not_found unless club

    Payments::Processor.new(club: club).handle_webhook(request.request_parameters)
    head :ok
  rescue StandardError => e
    Rails.logger.error("Payments webhook error: #{e.message}")
    head :bad_request
  end

  private

  def resolve_club
    Club.find_by(id: params[:club_id]) || Club.find_by(primary_domain: request.host)
  end
end
