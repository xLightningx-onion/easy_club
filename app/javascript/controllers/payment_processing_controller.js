import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "overlay", "submit" ]

  show () {
    this.displayOverlay()
    this.disableSubmitButton()
  }

  toggleTestOverlay (event) {
    event.preventDefault()
    if (this.hasOverlayTarget) {
      this.overlayTarget.classList.toggle("hidden")
    }
  }

  displayOverlay () {
    if (!this.hasOverlayTarget) return

    this.overlayTarget.classList.remove("hidden")
  }

  disableSubmitButton () {
    if (!this.hasSubmitTarget) return

    const button = this.submitTarget
    button.disabled = true
    button.classList.add("opacity-60", "cursor-not-allowed")
    button.setAttribute("aria-busy", "true")
  }
}
