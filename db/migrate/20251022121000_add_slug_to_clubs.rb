# frozen_string_literal: true

require "set"

class AddSlugToClubs < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  class MigrationClub < ApplicationRecord
    self.table_name = "clubs"
  end

  def up
    add_column :clubs, :slug, :string

    backfill_slugs

    add_index :clubs, :slug, unique: true, algorithm: :concurrently
  end

  def down
    remove_index :clubs, :slug
    remove_column :clubs, :slug
  end

  private

  def backfill_slugs
    say_with_time "Backfilling club slugs" do
      existing_slugs = Set.new

      MigrationClub.order(:created_at, :id).find_each do |club|
        slug = pick_slug_for(club, existing_slugs)
        next if slug.blank?

        club.update_columns(slug:)
        existing_slugs << slug
      end
    end
  end

  def pick_slug_for(club, existing_slugs)
    candidates = []
    candidates << parameterize(club.name)
    candidates << parameterize("#{club.city} #{club.name}") if club.city.present?
    candidates = candidates.compact.reject(&:blank?)

    last_candidate = nil
    candidates.each do |candidate|
      last_candidate = candidate
      return candidate unless existing_slugs.include?(candidate)
    end

    base_slug = last_candidate || candidates.first || parameterize(club.id)
    ensure_unique_slug(base_slug, existing_slugs)
  end

  def ensure_unique_slug(base, existing_slugs)
    slug = base
    counter = 2

    while existing_slugs.include?(slug)
      slug = "#{base}-#{counter}"
      counter += 1
    end

    slug
  end

  def parameterize(value)
    value.to_s.parameterize.presence
  end
end
