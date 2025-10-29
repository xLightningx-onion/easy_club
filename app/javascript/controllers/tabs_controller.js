import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="tabs"
export default class extends Controller {
  static targets = [ "trigger", "panel" ]
  static classes = [ "active", "inactive" ]
  static values = {
    defaultTab: String,
    activeTab: String
  }

  connect() {
    if (!this.hasActiveTabValue) {
      const firstTrigger = this.triggerTargets[0]
      const fallback = this.defaultTabValue || (firstTrigger && firstTrigger.dataset[this.tabDatasetKey])
      if (fallback) {
        this.activeTabValue = fallback
      }
    }

    this.update()
  }

  show(event) {
    event.preventDefault()
    const params = event.params || {}
    const tabParam = typeof params.tab === "string" ? params.tab : null
    const currentTarget = event.currentTarget
    const datasetTab = currentTarget && currentTarget.dataset ? currentTarget.dataset[this.tabDatasetKey] : null
    const tab = tabParam || datasetTab
    if (tab && tab !== this.activeTabValue) {
      this.activeTabValue = tab
      this.update()
    }
  }

  update() {
    const active = this.activeTabValue

    this.triggerTargets.forEach((trigger) => {
      const isActive = trigger.dataset[this.tabDatasetKey] === active
      trigger.setAttribute("aria-selected", isActive)
      trigger.setAttribute("tabindex", isActive ? "0" : "-1")

      this.activeClasses.forEach((className) => trigger.classList.toggle(className, isActive))
      this.inactiveClasses.forEach((className) => trigger.classList.toggle(className, !isActive))
    })

    this.panelTargets.forEach((panel) => {
      const isActive = panel.dataset[this.panelDatasetKey] === active
      panel.hidden = !isActive
      panel.setAttribute("aria-hidden", (!isActive).toString())
    })
  }

  get activeClasses() {
    if (!this.hasActiveClass) return []
    return this.activeClass.split(/\s+/).filter(Boolean)
  }

  get inactiveClasses() {
    if (!this.hasInactiveClass) return []
    return this.inactiveClass.split(/\s+/).filter(Boolean)
  }

  get identifierPrefix() {
    return this.identifier.replace(/-(\w)/g, (_match, char) => char.toUpperCase())
  }

  get tabDatasetKey() {
    return `${this.identifierPrefix}Tab`
  }

  get panelDatasetKey() {
    return `${this.identifierPrefix}Panel`
  }
}
