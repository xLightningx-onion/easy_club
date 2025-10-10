# frozen_string_literal: true

class SquadReflex < ApplicationReflex
  def add_member(data)
    team = Team.find(data["team_id"])
    member = Member.find(data["member_id"])

    Club.with_current(team.club) do
      authorize! team, to: :manage_squad?
      authorize! member, to: :show?

      TeamMembership.find_or_create_by!(club: team.club, team:, member:)
      morph_squad(team)
    end
  end

  def remove_member(data)
    membership = TeamMembership.find(data["team_membership_id"])

    Club.with_current(membership.club) do
      authorize! membership.team, to: :manage_squad?
      membership.destroy
      morph_squad(membership.team)
    end
  end

  private

  def morph_squad(team)
    memberships = team.team_memberships.includes(:member).order("members.last_name")
    morph "#squad", ApplicationController.render(partial: "club/teams/squad", locals: { team_memberships: memberships })
  end
end
