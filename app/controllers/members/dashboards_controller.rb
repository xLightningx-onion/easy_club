class Members::DashboardsController < Members::ApplicationController
  def index
    direct_members = current_user.members.includes(:club)
    guardian_members = current_user.guarded_members.includes(:club)

    @membership_profiles = (direct_members.to_a + guardian_members.to_a).uniq { |member| member.id }
    @known_clubs = (@membership_profiles.map(&:club) + current_user.clubs.to_a).compact.uniq { |club| club.id }
  end
end
