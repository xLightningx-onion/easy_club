# frozen_string_literal: true

module Admin::NavigationHelper
  def sidebar_link_classes(path)
    base = "block rounded px-3 py-2 text-sm font-medium transition-colors"
    active = current_page?(path) ? "bg-slate-900 text-white" : "text-slate-200 hover:bg-slate-800"
    [base, active].join(" ")
  end
end
