# frozen_string_literal: true

class MatchSheetPdfRenderer
  def self.render(team)
    new(team).render
  end

  def initialize(team)
    @team = team
  end

  def render
    Prawn::Document.new do |pdf|
      pdf.text "Match Sheet", size: 18, style: :bold
      pdf.move_down 10
      pdf.text "Team: #{@team.name}"
      pdf.text "Season: #{@team.season&.name || 'N/A'}"
      pdf.text "Age band: #{@team.age_band&.name || 'N/A'}"
      pdf.move_down 10
      pdf.text "Squad", style: :bold
      @team.team_memberships.includes(:member).each do |membership|
        pdf.text "- #{membership.member.full_name} (#{membership.role.titleize})"
      end
      pdf.move_down 10
      pdf.text "Upcoming Fixtures", style: :bold
      @team.fixtures.order(match_date: :asc).limit(5).each do |fixture|
        pdf.text "- #{fixture.match_date || 'TBC'} vs #{fixture.opponent} @ #{fixture.venue}"
      end
    end.render
  end
end
