# frozen_string_literal: true

class AddDatesToMembershipTypePriceTiers < ActiveRecord::Migration[8.0]
  def change
    change_table :membership_type_price_tiers, bulk: true do |t|
      t.date :starts_on, null: false
      t.date :ends_on, null: false
    end

    add_check_constraint(
      :membership_type_price_tiers,
      "starts_on <= ends_on",
      name: "membership_type_price_tiers_starts_before_ends"
    )
  end
end
