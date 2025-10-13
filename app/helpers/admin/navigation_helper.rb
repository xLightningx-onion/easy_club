# frozen_string_literal: true

module Admin::NavigationHelper
  def sidebar_link_classes(path, variant: :dark)
    base = if variant == :light
      "inline-flex items-center rounded px-3 py-2 text-xs font-medium transition-colors"
    else
      "block rounded px-3 py-2 text-sm font-medium transition-colors"
    end

    active, inactive = if variant == :light
      ["bg-slate-900 text-white", "text-slate-600 hover:bg-slate-200"]
    else
      ["bg-slate-900 text-white", "text-slate-200 hover:bg-slate-800"]
    end

    [base, current_page?(path) ? active : inactive].join(" ")
  end
end
