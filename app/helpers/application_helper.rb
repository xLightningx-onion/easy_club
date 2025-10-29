module ApplicationHelper
  def serve_image_remote_url(blob, resize_spec: "resize_to_limit", size_curves: [ 128, 128 ], format: :webp, return_url: true)
    return asset_path("team_placeholder.png") if blob.blank?
    if resize_spec == "resize_to_limit"
      variant = blob.variant(resize_to_limit: size_curves, format: format, saver: { quality: 80, strip: true })
      return_url ? process_variant(variant) : variant.processed
    elsif resize_spec == "resize_to_fill"
      variant = blob.variant(resize_to_fill: size_curves, format: format, saver: { quality: 80, strip: true })
      return_url ? process_variant(variant) : variant.processed
    end
  end

  def rands(amount)
    number_to_currency(amount, unit: "R")
  end

  # style: :chicago (Ross’s) or :ap (Ross’)
  def possessive(name, style: :chicago)
    return "" if name.blank?
    apos = "’" # use "'" if you prefer straight apostrophes

    case style
    when :ap
      name.ends_with?(/[sS]/) ? "#{name}#{apos}" : "#{name}#{apos}s"
    else # :chicago (default)
      # Classical/ancient-name exceptions often take only apostrophe
      exceptions = /\A(Jesus|Moses|Achilles)\z/i
      exceptions.match?(name) ? "#{name}#{apos}" : "#{name}#{apos}s"
    end
  end

  def membership_sentence(order, style: :chicago, oxford_comma: true)
    names = Array.wrap(order.members)
                .map { |m| m.first_name.presence }
                .compact

    club = order.club&.name

    return "membership to #{club}" if names.empty?

    if names.length == 1
      "#{possessive(names.first, style:)} membership"
    else
      # Build the list, then make ONLY the last name possessive
      list =
        if names.length == 2
          "#{names.first} and #{names.last}"
        else
          head = names[0..-2].join(", ")
          connector = oxford_comma ? ", and " : " and "
          "#{head}#{connector}#{names.last}"
        end

      last_pos = possessive(names.last, style:)
      list_with_pos = list.sub(/#{Regexp.escape(names.last)}\z/, last_pos)

      "#{list_with_pos} membership"
    end
  end

  private

  def process_variant(variant)
    processed_variant = variant.processed
    variant_key = processed_variant.key
    brand_cdn_url = Settings.bunny.cdn
    # Direct Bunny CDN URL using Settings.bunny.cdn
    "#{brand_cdn_url}/#{variant_key}"
  end
end
