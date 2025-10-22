import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "input",
    "modeField",
    "planField",
    "summary",
    "toggle"
  ]

  static values = {
    mode: String,
    planId: String,
    previewUrl: String
  }

  connect() {
    this.syncInitialSelection()
    this.updateSummary()
    this.lastPreviewSignature = this.signature()
  }

  select(event) {
    const input = event.currentTarget
    const value = input.value

    if (value === "full") {
      this.modeValue = "full"
      this.planIdValue = ""
    } else {
      this.modeValue = "staggered"
      this.planIdValue = input.dataset.planId || ""
    }

    this.applySelectionStyles()
    this.updateHiddenFields()
    this.updateSummary()
    this.requestPreview()
  }

  syncInitialSelection() {
    const mode = this.modeValue || this.modeFieldTarget?.value || "full"
    const planId = this.planIdValue || this.planFieldTarget?.value || ""

    this.inputs.forEach((input) => {
      const isFull = input.value === "full"
      const matches =
        (mode === "full" && isFull) ||
        (mode === "staggered" && !isFull && input.dataset.planId === planId)

      if (matches) {
        input.checked = true
        this.modeValue = mode
        this.planIdValue = planId
      }
    })

    if (!this.modeValue) {
      this.modeValue = "full"
    }

    this.applySelectionStyles()
    this.updateHiddenFields()
    this.updateSummary()
    this.lastPreviewSignature = this.signature()
  }

  updateHiddenFields() {
    if (this.hasModeFieldTarget) {
      this.modeFieldTarget.value = this.modeValue || "full"
    }

    if (this.hasPlanFieldTarget) {
      this.planFieldTarget.value = this.modeValue === "staggered" ? this.planIdValue || "" : ""
    }
  }

  applySelectionStyles() {
    this.inputs.forEach((input) => {
      const container = input.closest("[data-payment-plan-selector-target='toggle']")
      if (!container) return

      const isFull = input.value === "full"
      const isActive =
        (this.modeValue === "full" && isFull) ||
        (this.modeValue === "staggered" && !isFull && input.dataset.planId === this.planIdValue)

      container.classList.toggle("border-slate-900", isActive)
      container.classList.toggle("shadow-sm", isActive)
      container.classList.toggle("border-slate-300", !isActive)
    })
  }

  updateSummary() {
    if (!this.hasSummaryTarget) return

    const activeInput = this.inputs.find((input) => input.checked)
    if (!activeInput) {
      this.summaryTarget.textContent = this.modeValue === "staggered" ? "Staggered payments selected" : "Pay in full"
      return
    }

    const label = activeInput.dataset.summaryLabel || activeInput.dataset.label || activeInput.nextElementSibling?.textContent || ""
    this.summaryTarget.textContent = label.trim()
  }

  requestPreview() {
    if (!this.hasPreviewUrlValue) return

    const signature = this.signature()
    if (signature === this.lastPreviewSignature) return

    const url = new URL(this.previewUrlValue, window.location.origin)
    url.searchParams.set("preview_payment_mode", this.modeValue || "full")

    if ((this.modeValue || "full") === "staggered") {
      url.searchParams.set("preview_staggered_payment_plan_id", this.planIdValue || "")
    } else {
      url.searchParams.delete("preview_staggered_payment_plan_id")
    }

    this.lastPreviewSignature = signature

    fetch(url.toString(), {
      headers: { Accept: "text/vnd.turbo-stream.html" },
      credentials: "include"
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Preview request failed with status ${response.status}`)
        return response.text()
      })
      .then((html) => {
        if (window.Turbo && typeof window.Turbo.renderStreamMessage === "function") {
          window.Turbo.renderStreamMessage(html)
        }
      })
      .catch((error) => {
        console.error(error)
        this.lastPreviewSignature = null
      })
  }

  signature() {
    const mode = this.modeValue || "full"
    const planId = mode === "staggered" ? (this.planIdValue || "") : ""
    return `${mode}:${planId}`
  }

  get inputs() {
    return this.inputTargets || []
  }
}
