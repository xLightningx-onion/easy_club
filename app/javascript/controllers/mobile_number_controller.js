import { Controller } from "@hotwired/stimulus"

const DEFAULT_CODE = "+27"
const MAX_DIGITS = 9
const GROUP_SIZES = [2, 3, 4]

export default class extends Controller {
  static targets = ["input"]
  static values = {
    code: String,
    countryInput: String
  }

  connect() {
    this.currentCode = this.codeValue || DEFAULT_CODE
    this.digits = this.extractDigits(this.inputTarget.value || "")
    this.digits = this.digits.slice(0, MAX_DIGITS)
    this.applyMask()
    this.inputTarget.addEventListener("input", this.handleInput)
    this.inputTarget.addEventListener("blur", this.handleBlur)
    window.addEventListener("country-code:changed", this.updateMask)
  }

  disconnect() {
    this.inputTarget.removeEventListener("input", this.handleInput)
    this.inputTarget.removeEventListener("blur", this.handleBlur)
    window.removeEventListener("country-code:changed", this.updateMask)
  }

  updateMask = event => {
    const { code, inputId } = event.detail || {}
    if (this.hasCountryInputValue && inputId && inputId !== this.countryInputValue) {
      return
    }
    if (code) {
      this.currentCode = code
      this.applyMask()
    }
  }

  handleInput = event => {
    this.digits = this.extractDigits(event.target.value)
    this.digits = this.digits.slice(0, MAX_DIGITS)
    this.applyMask()
  }

  handleBlur = () => {
    this.applyMask()
  }

  applyMask() {
    if (this.digits.length === 0) {
      this.inputTarget.value = ""
      return
    }

    const formattedDigits = this.groupDigits(this.digits)
    this.inputTarget.value = `${this.currentCode} ${formattedDigits}`.trim()
  }

  extractDigits(value) {
    let numeric = (value || "").replace(/\D+/g, "")
    const codeDigits = (this.currentCode || "").replace(/\D+/g, "")
    if (numeric.startsWith(codeDigits)) {
      numeric = numeric.slice(codeDigits.length)
    }
    return numeric
  }

  groupDigits(digits) {
    const parts = []
    let position = 0

    GROUP_SIZES.forEach(size => {
      if (position >= digits.length) return
      const chunk = digits.slice(position, position + size)
      parts.push(chunk)
      position += size
    })

    if (position < digits.length) {
      parts.push(digits.slice(position))
    }

    return parts.join(" ")
  }
}
