import { Controller } from "@hotwired/stimulus"
import StimulusReflex from "stimulus_reflex"

export default class extends Controller {
  static targets = ["pool", "squad"]

  connect() {
    StimulusReflex.register(this)
  }

  add(event) {
    const memberId = event.currentTarget.dataset.squadMemberId
    const teamId = this.element.dataset.teamId
    this.stimulate("SquadReflex#add_member", { member_id: memberId, team_id: teamId })
  }

  remove(event) {
    const teamMembershipId = event.currentTarget.dataset.squadTeamMembershipId
    this.stimulate("SquadReflex#remove_member", { team_membership_id: teamMembershipId })
  }
}
