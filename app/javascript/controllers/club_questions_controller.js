import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["list", "template", "emptyState", "options"]

  connect() {
    this.updateEmptyState()
    this.refreshOptionVisibility()
  }

  add(event) {
    event.preventDefault()
    const uniqueId = this.generateUniqueId()
    const templateContent = this.templateTarget.innerHTML.replace(/NEW_RECORD/g, uniqueId)
    this.listTarget.insertAdjacentHTML("beforeend", templateContent)
    this.updateEmptyState()
    this.refreshOptionVisibility()
  }

  remove(event) {
    event.preventDefault()
    const wrapper = event.target.closest("[data-club-questions-item]")
    if (!wrapper) return

    const destroyInput = wrapper.querySelector("input[name$='[_destroy]']")
    const isNewRecord = wrapper.dataset.newRecord === "true"

    if (destroyInput && !isNewRecord) {
      destroyInput.value = "1"
      wrapper.classList.add("hidden")
    } else {
      wrapper.remove()
    }

    this.updateEmptyState()
    this.refreshOptionVisibility()
  }

  updateEmptyState() {
    if (!this.hasEmptyStateTarget) return
    const visibleItems = this.listTarget.querySelectorAll("[data-club-questions-item]:not(.hidden)")
    this.emptyStateTarget.classList.toggle("hidden", visibleItems.length > 0)
  }

  handleTypeChange(event) {
    const wrapper = event.target.closest("[data-club-questions-item]")
    if (!wrapper) return

    this.toggleOptionsVisibility(wrapper, event.target.value)
  }

  refreshOptionVisibility() {
    const items = this.listTarget.querySelectorAll("[data-club-questions-item]")
    items.forEach((item) => {
      const select = item.querySelector("select[name$='[answer_type]']")
      if (select) {
        this.toggleOptionsVisibility(item, select.value)
      }
    })
  }

  toggleOptionsVisibility(wrapper, answerType) {
    const optionsContainer = wrapper.querySelector("[data-club-questions-target='options']")
    if (!optionsContainer) return

    const choiceTypes = (optionsContainer.dataset.choiceTypes || "")
      .split(/\s+/)
      .map((type) => type.trim())
      .filter(Boolean)

    const shouldShow = choiceTypes.includes(answerType)
    optionsContainer.classList.toggle("hidden", !shouldShow)
  }

  generateUniqueId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID()
    }
    return `${Date.now()}${Math.floor(Math.random() * 1000)}`
  }
}
