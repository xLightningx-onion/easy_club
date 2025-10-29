# frozen_string_literal: true

class AddWhatsappTemplateMappingsToClubs < ActiveRecord::Migration[7.1]
  def change
    add_column :clubs, :whatsapp_otp_template_id, :string
    add_column :clubs, :whatsapp_order_confirmation_template_id, :string
  end
end
