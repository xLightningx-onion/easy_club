# frozen_string_literal: true

class AddPlanAndMembershipTypeRefs < ActiveRecord::Migration[8.0]
  def change
    change_table :membership_types, bulk: true do |t|
      t.references :plan, type: :uuid, foreign_key: true
    end

    change_table :members, bulk: true do |t|
      t.references :membership_type, type: :uuid, foreign_key: true
    end
  end
end
