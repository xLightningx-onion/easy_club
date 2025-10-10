# frozen_string_literal: true

class Club::ReportsController < Club::BaseController
  before_action :authorize_action

  def index
    @finance_metrics = Reports::Finance.new(club: current_club).summary
    @participation_metrics = Reports::Participation.new(club: current_club).summary
    @compliance_metrics = Reports::Compliance.new(club: current_club).summary
  end

  def finance
    csv = Reports::Finance.new(club: current_club).to_csv
    send_data csv, filename: "finance-#{Time.current.to_date}.csv"
  end

  def participation
    csv = Reports::Participation.new(club: current_club).to_csv
    send_data csv, filename: "participation-#{Time.current.to_date}.csv"
  end

  def compliance
    csv = Reports::Compliance.new(club: current_club).to_csv
    send_data csv, filename: "compliance-#{Time.current.to_date}.csv"
  end

  def ar_aging
    csv = Reports::ArAging.new(club: current_club).to_csv
    send_data csv, filename: "ar-aging-#{Time.current.to_date}.csv"
  end

  private

  def authorize_action
    authorize! :reports, to: ReportPolicy, query: "#{action_name}?"
  end
end
