import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["newCardSection", "tokenizeToggle", "sourceInput", "methodInput", "option", "cvvSection", "cvvInput"]
  static values = { selection: String }

  connect() {
    if (!this.selectionValue) {
      this.selectionValue = this.hasSourceInputTarget ? this.sourceInputTarget.value : "new"
    }
    this.toggle()
    const initialMethodId = this.hasMethodInputTarget ? this.methodInputTarget.value : ""
    this.highlightSelection(this.selectionValue, initialMethodId)
    this.updateCvvSections(this.selectionValue === "saved" ? initialMethodId : null)
  }

  choose(event) {
    const selection = event.params.selection
    const methodId = event.params.id || ""

    this.selectionValue = selection

    if (this.hasSourceInputTarget) {
      this.sourceInputTarget.value = selection
    }

    if (this.hasMethodInputTarget) {
      this.methodInputTarget.value = selection === "saved" ? methodId : ""
    }

    this.toggle()
    this.highlightSelection(selection, selection === "saved" ? methodId : "")
    this.updateCvvSections(selection === "saved" ? methodId : null)
  }

  refresh() {
    let selection = "new"
    let methodId = ""

    let checked = this.element.querySelector("input[name='checkout[payment_option]']:checked")

    if (!checked) {
      const fallbackSaved = this.element.querySelector("input[name='checkout[payment_option]'][data-payment-method-selection-param='saved']")
      if (fallbackSaved) {
        fallbackSaved.checked = true
        checked = fallbackSaved
      }
    }

    if (checked) {
      selection = checked.dataset.paymentMethodSelectionParam || (checked.value === "new" ? "new" : "saved")
      methodId = checked.dataset.paymentMethodIdParam || (selection === "saved" ? checked.value : "")
    } else {
      const newCardRadio = this.element.querySelector("input[name='checkout[payment_option]'][value='new']")
      if (newCardRadio) {
        newCardRadio.checked = true
      }
    }

    this.selectionValue = selection

    if (this.hasSourceInputTarget) {
      this.sourceInputTarget.value = selection
    }

    if (this.hasMethodInputTarget) {
      this.methodInputTarget.value = selection === "saved" ? methodId : ""
    }

    this.toggle()
    this.highlightSelection(selection, selection === "saved" ? methodId : "")
    this.updateCvvSections(selection === "saved" ? methodId : null)
  }

  toggle() {
    if (this.hasNewCardSectionTarget) {
      this.newCardSectionTarget.classList.toggle("hidden", this.selectionValue !== "new")
    }
    if (this.hasTokenizeToggleTarget) {
      const disabled = this.selectionValue !== "new"
      this.tokenizeToggleTarget.disabled = disabled
      if (disabled) {
        this.tokenizeToggleTarget.checked = false
      }
    }
  }

  highlightSelection(selection, methodId) {
    if (!this.hasOptionTarget) return

    this.optionTargets.forEach((label) => {
      const labelSelection = label.dataset.selection
      const labelMethodId = label.dataset.methodId
      const isActive =
        selection === "new" ? labelSelection === "new" : labelSelection === "saved" && labelMethodId === methodId

      label.classList.toggle("border-slate-900", isActive)
      label.classList.toggle("border-slate-300", !isActive)
      label.classList.toggle("shadow-sm", isActive)
    })
  }

  updateCvvSections(selectedMethodId) {
    if (!this.hasCvvSectionTarget) return

    this.cvvSectionTargets.forEach((section) => {
      const sectionMethodId = section.dataset.methodId
      const isActive = selectedMethodId && sectionMethodId === selectedMethodId
      section.classList.toggle("hidden", !isActive)

      const inputs = this.hasCvvInputTarget ? this.cvvInputTargets : []
      const input = inputs.find((target) => target.dataset.methodId === sectionMethodId)
      if (input) {
        input.disabled = !isActive
        if (!isActive) {
          input.value = ""
        }
        if (isActive) {
          requestAnimationFrame(() => {
            input.focus()
            input.select()
          })
        }
      }
    })
  }
}
