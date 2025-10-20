import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["answerType", "choiceFields"]
  static values = { choiceTypes: Array }

  connect() {
    this.toggle()
  }

  toggle() {
    if (!this.hasAnswerTypeTarget || !this.hasChoiceFieldsTarget) return

    const selectedType = this.answerTypeTarget.value
    const shouldShow = this.choiceTypesValue.includes(selectedType)

    this.choiceFieldsTarget.classList.toggle("hidden", !shouldShow)
  }
}
