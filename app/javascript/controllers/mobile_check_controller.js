import { Controller } from "@hotwired/stimulus"

const WARNING_CLASSES = ["border-rose-500", "focus:border-rose-500", "focus:ring-rose-200"]

// Mirrors the email availability check for mobile numbers on registration.
export default class extends Controller {
  static targets = ["input", "message", "submit", "country"]
  static values = {
    url: String,
    loginUrl: String
  }

  connect() {
    this.timeoutId = null
    this.lastCheckedValue = null
    this.lastResult = null
    this.clearWarning()
    window.addEventListener("country-code:changed", this.handleCountryChange)
  }

  disconnect() {
    this.clearPendingTimeout()
    window.removeEventListener("country-code:changed", this.handleCountryChange)
  }

  queueCheck() {
    const mobile = this.normalizedMobile()
    const countryCode = this.normalizedCountryCode()

    this.clearPendingTimeout()

    if (!mobile || mobile.length < 5 || !countryCode) {
      this.resetState()
      return
    }

    const cacheKey = `${countryCode}:${mobile}`

    if (cacheKey === this.lastCheckedValue && this.lastResult !== null) {
      this.lastResult ? this.showWarning() : this.clearWarning()
      return
    }

    this.timeoutId = setTimeout(() => this.performLookup(countryCode, mobile, cacheKey), 1000)
  }

  async performLookup(countryCode, mobile, cacheKey) {
    this.clearPendingTimeout()
    this.lastCheckedValue = cacheKey

    if (!this.hasUrlValue) return

    try {
      const url = new URL(this.urlValue, window.location.origin)
      url.searchParams.set("country_code", countryCode)
      url.searchParams.set("mobile_number", mobile)

      const response = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      })

      if (!response.ok) throw new Error("Request failed")

      const { exists } = await response.json()
      this.lastResult = exists

      if (this.normalizedMobile() !== mobile || this.normalizedCountryCode() !== countryCode) {
        return
      }

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
      this.messageTarget.innerHTML = `An account with this mobile number already exists. <a href="${loginUrl}" class="font-semibold text-sky-600 underline">Log in here.</a>`
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

  handleCountryChange = event => {
    if (!this.hasCountryTarget) return

    const { code, inputId } = event.detail || {}
    const targetId = this.countryTarget.id

    if (inputId && targetId && inputId !== targetId) return

    if (code) {
      this.countryTarget.value = code
      this.queueCheck()
    }
  }

  resetState() {
    this.lastCheckedValue = null
    this.lastResult = null
    this.clearWarning()
  }

  normalizedMobile() {
    if (!this.hasInputTarget) return ""
    let digits = this.inputTarget.value.replace(/\D+/g, "")
    const codeDigits = this.hasCountryTarget ? this.countryTarget.value.replace(/\D+/g, "") : ""

    if (codeDigits && digits.startsWith(codeDigits)) {
      digits = digits.slice(codeDigits.length)
    }

    return digits.replace(/^0+/, "")
  }

  normalizedCountryCode() {
    if (!this.hasCountryTarget) return ""
    const digits = this.countryTarget.value.replace(/\D+/g, "")
    return digits ? `+${digits}` : ""
  }
}
