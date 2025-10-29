# frozen_string_literal: true

class AddWhatsappFieldsToClubs < ActiveRecord::Migration[7.1]
  def change
    add_column :clubs, :whatsapp_access_token, :text
    add_column :clubs, :whatsapp_sender_id, :string
    add_column :clubs, :whatsapp_business_id, :string
  end
end
