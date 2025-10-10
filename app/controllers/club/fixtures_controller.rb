# frozen_string_literal: true

class Club::FixturesController < Club::BaseController
  before_action :set_team, only: %i[index create]
  before_action :set_fixture, only: %i[show update availability]

  def index
    authorize! @team, :show?
    @fixtures = @team.fixtures.order(match_date: :asc)
    @fixture = @team.fixtures.build
  end

  def create
    authorize! @team, :show?
    @fixture = @team.fixtures.build(fixture_params.merge(club: current_club))

    if @fixture.save
      redirect_to club_team_fixtures_path(@team), notice: "Fixture created."
    else
      @fixtures = @team.fixtures.order(match_date: :asc)
      render :index, status: :unprocessable_entity
    end
  end

  def show
    authorize! @fixture
    load_availability_context
  end

  def update
    authorize! @fixture

    if @fixture.update(fixture_params)
      redirect_to club_fixture_path(@fixture), notice: "Fixture updated."
    else
      load_availability_context
      render :show, status: :unprocessable_entity
    end
  end

  def availability
    authorize! @fixture, :availability?
    member = policy_scope(Member).find(availability_params[:member_id])

    availability = @fixture.availabilities.find_or_initialize_by(member: member, club: current_club)
    availability.status = availability_params[:status]
    availability.responded_at = Time.current

    if availability.save
      redirect_to club_fixture_path(@fixture), notice: "Availability updated."
    else
      load_availability_context
      render :show, status: :unprocessable_entity
    end
  end

  private

  def set_team
    @team = policy_scope(Team).find(params[:team_id])
  end

  def set_fixture
    @fixture = policy_scope(Fixture).find(params[:id])
  end

  def fixture_params
    params.require(:fixture).permit(:match_date, :opponent, :venue, :status, :team_id)
  end

  def availability_params
    params.require(:availability).permit(:member_id, :status)
  end

  def load_availability_context
    @team = @fixture.team
    @availability_records = @fixture.availabilities.includes(:member)
    @squad_members = @team.members
  end
end
