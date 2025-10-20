# frozen_string_literal: true

class Admin::DashboardsController < Admin::BaseController
  def show
    authorize! :admin_dashboard, :show?, with: AdminDashboardPolicy

    @clubs = Club.order(:name).limit(10)
    @recent_invoices = Invoice.order(created_at: :desc).limit(10)
    @recent_members = Member.order(created_at: :desc).limit(10)
  end
end
