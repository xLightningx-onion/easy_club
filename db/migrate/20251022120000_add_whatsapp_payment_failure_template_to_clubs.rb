class AddWhatsappPaymentFailureTemplateToClubs < ActiveRecord::Migration[7.1]
  def change
    add_column :clubs, :whatsapp_payment_failure_template_id, :string
  end
end
