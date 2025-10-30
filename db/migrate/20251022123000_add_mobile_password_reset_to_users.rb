class AddMobilePasswordResetToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :mobile_password_reset_code_digest, :string
    add_column :users, :mobile_password_reset_sent_at, :datetime
  end
end

