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

  private

  def process_variant(variant)
    processed_variant = variant.processed
    variant_key = processed_variant.key
    brand_cdn_url = Settings.bunny.cdn
    # Direct Bunny CDN URL using Settings.bunny.cdn
    "#{brand_cdn_url}/#{variant_key}"
  end
end
