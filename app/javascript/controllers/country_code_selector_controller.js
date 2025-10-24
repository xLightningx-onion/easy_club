import { Controller } from "@hotwired/stimulus"
import countryCodes from "../lib/country_codes"

export default class extends Controller {
  static targets = ["input", "button", "buttonLabel", "overlay", "list", "search"]
  static values = {
    initial: String
  }

  connect() {
    this.codes = countryCodes
    this.selectedCode = this.inputTarget.value || this.initialValue || "+27"
    if (!this.inputTarget.value) {
      this.inputTarget.value = this.selectedCode
    }
    this.updateButtonLabel()
    this.renderList(this.codes)
    this.dispatchChange()
  }

  open(event) {
    event.preventDefault()
    this.overlayTarget.classList.remove("hidden")
    this.overlayTarget.classList.add("flex")
    document.addEventListener("keydown", this.handleKeydown)
    if (this.hasSearchTarget) {
      this.searchTarget.value = ""
    }
    this.renderList(this.codes)
    if (this.hasSearchTarget) {
      requestAnimationFrame(() => {
        this.searchTarget.focus()
      })
    }
  }

  close(event) {
    if (event) event.preventDefault()
    this.overlayTarget.classList.add("hidden")
    this.overlayTarget.classList.remove("flex")
    document.removeEventListener("keydown", this.handleKeydown)
    this.buttonTarget.focus()
  }

  filter(event) {
    const term = event.target.value.trim().toLowerCase()
    if (term === "") {
      this.renderList(this.codes)
      return
    }

    const filtered = this.codes.filter(code => {
      return (
        code.name.toLowerCase().includes(term) ||
        code.dial_code.replace("+", "").includes(term.replace("+", "")) ||
        code.code.toLowerCase().includes(term)
      )
    })

    this.renderList(filtered)
  }

  choose(event) {
    event.preventDefault()
    const button = event.currentTarget
    const code = button.dataset.code
    const flag = button.dataset.flag
    this.selectedCode = code
    this.inputTarget.value = code
    this.updateButtonLabel(flag, code)
    this.dispatchChange()
    this.close()
  }

  overlayClick(event) {
    if (event.target === this.overlayTarget) {
      this.close()
    }
  }

  disconnect() {
    document.removeEventListener("keydown", this.handleKeydown)
  }

  handleKeydown = event => {
    if (event.key === "Escape") {
      this.close()
    }
  }

  updateButtonLabel(flag, code) {
    const current = this.codes.find(item => item.dial_code === this.selectedCode) || {}
    const displayFlag = flag || current.flag || "🌍"
    const displayCode = code || current.dial_code || this.selectedCode
    this.buttonLabelTarget.innerHTML = `
      <span class="text-xl leading-none">${displayFlag}</span>
      <span class="ml-2 text-sm font-semibold text-slate-900">${displayCode}</span>
    `
  }

  renderList(codes) {
    this.listTarget.innerHTML = ""

    if (codes.length === 0) {
      const empty = document.createElement("p")
      empty.className = "px-3 py-6 text-center text-sm text-slate-500"
      empty.textContent = "No matches found."
      this.listTarget.appendChild(empty)
      return
    }

    codes.forEach(code => {
      const button = document.createElement("button")
      button.type = "button"
      button.className = [
        "flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm transition",
        "hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-200",
        code.dial_code === this.selectedCode ? "bg-sky-50 text-sky-600" : "text-slate-700"
      ].join(" ")
      button.dataset.action = "country-code-selector#choose"
      button.dataset.code = code.dial_code
      button.dataset.name = code.name
      button.dataset.flag = code.flag
      button.innerHTML = `
        <span class="flex items-center gap-3">
          <span class="text-xl">${code.flag}</span>
          <span>
            <span class="block text-sm font-medium">${code.name}</span>
            <span class="block text-xs text-slate-400 uppercase tracking-wide">${code.code}</span>
          </span>
        </span>
        <span class="text-sm font-semibold">${code.dial_code}</span>
      `
      this.listTarget.appendChild(button)
    })
  }

  dispatchChange() {
    const detail = {
      code: this.selectedCode,
      inputId: this.inputTarget.id
    }

    const dispatchTarget = typeof window !== "undefined" ? window : this.element
    dispatchTarget.dispatchEvent(
      new CustomEvent("country-code:changed", {
        detail,
        bubbles: true
      })
    )
  }
}
