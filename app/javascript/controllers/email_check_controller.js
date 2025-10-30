import { Controller } from "@hotwired/stimulus"

const WARNING_CLASSES = ["border-rose-500", "focus:border-rose-500", "focus:ring-rose-200"]

// Handles debounced email availability checks on the registration form.
export default class extends Controller {
  static targets = ["input", "message", "submit"]
  static values = {
    url: String,
    loginUrl: String
  }

  connect() {
    this.timeoutId = null
    this.lastCheckedValue = null
    this.lastResult = null

    this.clearWarning()
  }

  disconnect() {
    this.clearPendingTimeout()
  }

  queueCheck() {
    const email = this.inputTarget.value.trim()

    this.clearPendingTimeout()

    if (!email) {
      this.lastCheckedValue = null
      this.lastResult = null
      this.clearWarning()
      return
    }

    if (email === this.lastCheckedValue && this.lastResult !== null) {
      this.lastResult ? this.showWarning() : this.clearWarning()
      return
    }

    this.timeoutId = setTimeout(() => this.performLookup(email), 1000)
  }

  async performLookup(email) {
    this.clearPendingTimeout()
    this.lastCheckedValue = email

    if (!this.hasUrlValue) return

    try {
      const url = new URL(this.urlValue, window.location.origin)
      url.searchParams.set("email", email)

      const response = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      })

      if (!response.ok) throw new Error("Request failed")

      const { exists } = await response.json()
      this.lastResult = exists

      if (this.inputTarget.value.trim() !== email) return

      if (exists) {
        this.showWarning()
      } else {
        this.clearWarning()
      }
    } catch (_error) {
      this.lastResult = null
      this.clearWarning()
    }
  }

  showWarning() {
    if (this.hasInputTarget) {
      this.inputTarget.setAttribute("aria-invalid", "true")
      WARNING_CLASSES.forEach(className => this.inputTarget.classList.add(className))
    }

    if (this.hasMessageTarget) {
      const loginUrl = this.loginUrlValue || "#"
      this.messageTarget.innerHTML = `An account with this email already exists. <a href="${loginUrl}" class="font-semibold text-sky-600 underline">Log in here.</a>`
      this.messageTarget.classList.remove("hidden")
    }

    if (this.hasSubmitTarget) {
      this.submitTarget.disabled = true
      this.submitTarget.classList.add("opacity-50", "cursor-not-allowed")
      this.submitTarget.setAttribute("aria-disabled", "true")
    }
  }

  clearWarning() {
    if (this.hasInputTarget) {
      this.inputTarget.removeAttribute("aria-invalid")
      WARNING_CLASSES.forEach(className => this.inputTarget.classList.remove(className))
    }

    if (this.hasMessageTarget) {
      this.messageTarget.classList.add("hidden")
      this.messageTarget.textContent = ""
    }

    if (this.hasSubmitTarget) {
      this.submitTarget.disabled = false
      this.submitTarget.classList.remove("opacity-50", "cursor-not-allowed")
      this.submitTarget.removeAttribute("aria-disabled")
    }
  }

  clearPendingTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }
}
