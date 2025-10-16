# frozen_string_literal: true

class Admin::RetentionJobsController < Admin::BaseController
  def index
    @report_runs = ReportRun.order(created_at: :desc).limit(50)
    @clubs = Club.order(:name)
  end

  def create
    ReportRun.create!(
      club: Club.find(params[:club_id]),
      report_name: "retention",
      status: :queued,
      params: { initiated_by: current_user.id }
    )
    redirect_to admin_retention_jobs_path, notice: "Retention job queued."
  end
end
