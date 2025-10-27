class AddMobileVerificationToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :mobile_verification_code_digest, :string
    add_column :users, :mobile_verification_sent_at, :datetime
    add_column :users, :mobile_verified_at, :datetime
  end
end

