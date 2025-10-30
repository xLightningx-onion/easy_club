import { Controller } from "@hotwired/stimulus"

// Manages switching between mobile-based login and email login.
export default class extends Controller {
  static targets = [
    "mobileContainer",
    "mobileInput",
    "emailContainer",
    "emailInput",
    "toggleButton"
  ]

  static values = {
    mode: { type: String, default: "mobile" }
  }

  connect() {
    this.applyMode(this.modeValue)
  }

  toggle(event) {
    event.preventDefault()
    const nextMode = this.currentMode === "mobile" ? "email" : "mobile"
    this.applyMode(nextMode)
  }

  applyMode(mode) {
    this.currentMode = mode
    this.modeValue = mode

    const mobileActive = mode === "mobile"

    this.toggleVisibility(this.mobileContainerTarget, mobileActive)
    this.toggleVisibility(this.emailContainerTarget, !mobileActive)

    this.mobileInputTarget.disabled = !mobileActive
    this.emailInputTarget.disabled = mobileActive

    this.mobileInputTarget.name = mobileActive ? "user[login]" : "user[mobile_login]"
    this.emailInputTarget.name = mobileActive ? "user[email_login]" : "user[login]"

    if (this.hasToggleButtonTarget) {
      this.toggleButtonTarget.textContent = mobileActive ? "Log in via email" : "Log in via mobile number"
    }

    this.focusActiveInput()
  }

  toggleVisibility(element, shouldShow) {
    element.classList.toggle("hidden", !shouldShow)
  }

  focusActiveInput() {
    requestAnimationFrame(() => {
      if (this.currentMode === "mobile") {
        this.mobileInputTarget.focus()
      } else {
        this.emailInputTarget.focus()
      }
    })
  }
}
