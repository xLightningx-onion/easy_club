# frozen_string_literal: true

class AddPublicListingAndLocationToClubs < ActiveRecord::Migration[8.0]
  def change
    add_column :clubs, :public_listing, :boolean, null: false, default: true
    add_column :clubs, :location_name, :string
    add_column :clubs, :address_line1, :string
    add_column :clubs, :address_line2, :string
    add_column :clubs, :city, :string
    add_column :clubs, :region, :string
    add_column :clubs, :postal_code, :string
    add_column :clubs, :country, :string
    add_column :clubs, :latitude, :decimal, precision: 10, scale: 6
    add_column :clubs, :longitude, :decimal, precision: 10, scale: 6
    add_column :clubs, :google_place_id, :string

    add_index :clubs, :public_listing
    add_index :clubs, :google_place_id, unique: true, where: "google_place_id IS NOT NULL"
  end
end
