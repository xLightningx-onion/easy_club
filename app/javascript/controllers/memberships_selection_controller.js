import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["club", "continue", "list"]
  static values = {
    selectedClass: String,
    selectedId: String,
    selectedName: String
  }

  connect() {
    this.restoreSelection()
    this.updateState()
  }

  choose(event) {
    // event.preventDefault()
    const button = event.currentTarget
    this.selectedIdValue = button.dataset.clubId
    this.selectedNameValue = button.dataset.clubName
    this.highlightSelection(button)
    this.updateState()
  }

  continue(event) {
    if (!this.hasSelectedIdValue) {
      event.preventDefault()
      return
    }

    this.dispatch("club-selected", {
      detail: {
        clubId: this.selectedIdValue,
        clubName: this.selectedNameValue
      }
    })
  }

  highlightSelection(selectedButton) {
    if (!this.hasClubTarget) return

    const classes = this.selectedClasses()
    this.clubTargets.forEach((button) => {
      button.classList.remove(...classes)
    })

    selectedButton.classList.add(...classes)
  }

  updateState() {
    if (this.hasContinueTarget) {
      this.continueTarget.disabled = !this.hasSelectedIdValue
    }
  }

  selectedClasses() {
    return (this.selectedClassValue || "border-slate-900 ring-2 ring-slate-200 shadow-md").split(/\s+/).filter(Boolean)
  }

  restoreSelection() {
    if (!this.hasSelectedIdValue || !this.hasClubTarget) return
    const selectedButton = this.clubTargets.find((button) => button.dataset.clubId === this.selectedIdValue)
    if (!selectedButton) return
    if (!this.hasSelectedNameValue || !this.selectedNameValue) {
      this.selectedNameValue = selectedButton.dataset.clubName
    }
    this.highlightSelection(selectedButton)
  }
}
