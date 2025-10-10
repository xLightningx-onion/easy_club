# frozen_string_literal: true

class Club::TeamsController < Club::BaseController
  before_action :set_team, only: %i[show edit update destroy squad match_sheet]

  def index
    authorize! Team, :index?
    @teams = policy_scope(Team).includes(:season, :age_band).order(:name)
  end

  def show
    authorize! @team
    load_roster_context
  end

  def new
    @team = current_club.teams.build
    authorize! @team
    load_form_sources
  end

  def create
    @team = current_club.teams.build(team_params)
    authorize! @team

    if @team.save
      redirect_to club_team_path(@team), notice: "Team created."
    else
      load_form_sources
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    authorize! @team
    load_form_sources
  end

  def update
    authorize! @team

    if @team.update(team_params)
      redirect_to club_team_path(@team), notice: "Team updated."
    else
      load_form_sources
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    authorize! @team
    @team.destroy
    redirect_to club_teams_path, notice: "Team deleted."
  end

  def squad
    authorize! @team, :manage_squad?
    load_roster_context
    render :show
  end

  def match_sheet
    authorize! @team
    pdf_data = MatchSheetPdfRenderer.render(@team)
    send_data pdf_data, filename: "match-sheet-#{@team.name.parameterize}.pdf", type: "application/pdf"
  end

  private

  def set_team
    @team = policy_scope(Team).find(params[:id])
  end

  def team_params
    params.require(:team).permit(:name, :season_id, :age_band_id)
  end

  def load_form_sources
    @seasons = policy_scope(Season).order(starts_on: :desc)
    @age_bands = policy_scope(AgeBand).order(:name)
  end

  def load_roster_context
    @team_memberships = @team.team_memberships.includes(:member)
    @squad_members = @team.members.order(:last_name)
    @eligible_members = policy_scope(Member)
                          .where(role: "player")
                          .where.not(id: @squad_members.pluck(:id))
                          .order(:last_name)
                          .select { |member| Eligibility::Engine.allowed?(member: member, team: @team) }
    @fixtures = @team.fixtures.order(match_date: :asc)
  end
end
