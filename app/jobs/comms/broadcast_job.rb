# frozen_string_literal: true

module Comms
  class BroadcastJob < ApplicationJob
    queue_as :default

    def perform(broadcast_id)
      broadcast = Broadcast.find(broadcast_id)
      recipients_for(broadcast).each do |member|
        OutboundMessage.create!(
          club: broadcast.club,
          broadcast: broadcast,
          member: member,
          channel: broadcast.channel,
          status: :queued,
          metadata: { audience: broadcast.audience_type }
        )
      end
      broadcast.update!(status: :sent)
    end

    private

    def recipients_for(broadcast)
      case broadcast.audience_type
      when "role"
        role = broadcast.audience_filter["role"]
        broadcast.club.members.where(role: role)
      else
        broadcast.club.members
      end
    end
  end
end
