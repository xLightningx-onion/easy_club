import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { url: String }

  begin(event) {
    const { clubId } = event.detail || {}
    if (!clubId) return

    const basePath = this.urlValue || "/members/membership_registration"
    const url = new URL(basePath, window.location.origin)
    url.searchParams.set("club_id", clubId)
    url.searchParams.set("step", "personal")
    window.location = url.toString()
  }
}
