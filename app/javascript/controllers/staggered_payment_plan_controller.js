import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "list",
    "template",
    "installment",
    "installmentLabel",
    "percentage",
    "position",
    "destroy",
    "totalDisplay",
    "submit"
  ]

  connect() {
    this.ensureAtLeastOneInstallment()
    this.renumber()
    this.recalculate()
  }

  addInstallment(event) {
    event.preventDefault()

    const templateContent = this.templateTarget?.innerHTML
    if (!templateContent) return

    const timestamp = Date.now().toString()
    const html = templateContent.replace(/NEW_RECORD/g, timestamp)

    this.listTarget.insertAdjacentHTML("beforeend", html)
    this.ensureAtLeastOneInstallment()
    requestAnimationFrame(() => {
      const newest = this.installmentTargets[this.installmentTargets.length - 1]
      this.prefillDueDate(newest)
      this.renumber()
      this.recalculate()
    })
  }

  removeInstallment(event) {
    event.preventDefault()

    const button = event.currentTarget
    const container = button.closest("[data-staggered-payment-plan-target='installment']")
    if (!container) return

    if (this.activeInstallmentCount() <= 1) return

    const destroyInput = container.querySelector("input[data-staggered-payment-plan-target='destroy']")
    const idInput = container.querySelector("input[name$='[id]']")

    if (idInput && idInput.value) {
      if (destroyInput) destroyInput.value = "1"
      container.classList.add("hidden")
      container.dataset.removed = "true"
    } else {
      container.remove()
    }

    requestAnimationFrame(() => {
      this.renumber()
      this.recalculate()
    })
  }

  recalculate() {
    let total = 0

    this.percentageTargets.forEach((input) => {
      if (this.isActiveInput(input)) {
        const value = parseFloat(input.value)
        if (!Number.isNaN(value)) {
          total += value
        }
      }
    })

    const totalRounded = Math.round((total + Number.EPSILON) * 100) / 100
    if (this.hasTotalDisplayTarget) {
      this.totalDisplayTarget.textContent = `${totalRounded.toFixed(2)}%`
      this.totalDisplayTarget.classList.toggle("bg-emerald-100", this.isValidTotal(totalRounded))
      this.totalDisplayTarget.classList.toggle("text-emerald-700", this.isValidTotal(totalRounded))
      this.totalDisplayTarget.classList.toggle("bg-rose-100", !this.isValidTotal(totalRounded))
      this.totalDisplayTarget.classList.toggle("text-rose-700", !this.isValidTotal(totalRounded))
    }

    if (this.hasSubmitTarget) {
      this.submitTarget.disabled = !this.isValidTotal(totalRounded)
      this.submitTarget.classList.toggle("opacity-60", !this.isValidTotal(totalRounded))
      this.submitTarget.classList.toggle("cursor-not-allowed", !this.isValidTotal(totalRounded))
    }
  }

  renumber() {
    let index = 1
    this.installmentTargets.forEach((container) => {
      const destroyInput = container.querySelector("input[data-staggered-payment-plan-target='destroy']")
      const isHidden = container.classList.contains("hidden") || container.dataset.removed === "true"
      if (destroyInput && destroyInput.value === "1") return
      if (isHidden) return

      const label = container.querySelector("[data-staggered-payment-plan-target='installmentLabel']")
      if (label) {
        label.textContent = `Installment ${index}`
      }

      const positionInput = container.querySelector("input[data-staggered-payment-plan-target='position']")
      if (positionInput) {
        positionInput.value = index - 1
      }

      index += 1
    })
  }

  handleSubmitEnd(event) {
    if (event?.detail?.success === false) {
      this.recalculate()
    }
  }

  // Private helpers
  ensureAtLeastOneInstallment() {
    if (this.installmentTargets.length === 0 && this.templateTarget) {
      const templateContent = this.templateTarget.innerHTML
      const timestamp = Date.now().toString()
      const html = templateContent.replace(/NEW_RECORD/g, `${timestamp}-seed`)
      this.listTarget.insertAdjacentHTML("beforeend", html)
      requestAnimationFrame(() => {
        const newest = this.installmentTargets[this.installmentTargets.length - 1]
        this.prefillDueDate(newest)
      })
    }
  }

  activeInstallmentCount() {
    let count = 0
    this.installmentTargets.forEach((container) => {
      const destroyInput = container.querySelector("input[data-staggered-payment-plan-target='destroy']")
      const hidden = container.classList.contains("hidden") || container.dataset.removed === "true"
      if (destroyInput && destroyInput.value === "1") {
        return
      }
      if (!hidden) {
        count += 1
      }
    })
    return count
  }

  isActiveInput(input) {
    const container = input.closest("[data-staggered-payment-plan-target='installment']")
    if (!container) return false
    const destroyInput = container.querySelector("input[data-staggered-payment-plan-target='destroy']")
    if (destroyInput && destroyInput.value === "1") return false
    if (container.classList.contains("hidden") || container.dataset.removed === "true") return false
    return true
  }

  isValidTotal(total) {
    if (this.activeInstallmentCount() === 0) return false
    return total > 0 && Math.abs(total - 100) <= 0.01
  }

  prefillDueDate(container) {
    if (!container) return

    const dueInput = container.querySelector("input[name$='[due_on]']")
    if (!dueInput || dueInput.value) return

    const otherDueInputs = Array.from(this.element.querySelectorAll("input[name$='[due_on]']"))
      .filter((input) => {
        if (input === dueInput || !input.value) return false
        const container = input.closest("[data-staggered-payment-plan-target='installment']")
        if (!container) return false
        const destroyInput = container.querySelector("input[data-staggered-payment-plan-target='destroy']")
        if (destroyInput && destroyInput.value === "1") return false
        if (container.classList.contains("hidden") || container.dataset.removed === "true") return false
        return true
      })

    let baseDate

    if (otherDueInputs.length > 0) {
      const latest = otherDueInputs
        .map((input) => new Date(input.value))
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((a, b) => a - b)
        .pop()

      baseDate = latest || new Date()
      baseDate = this.addDays(baseDate, 28)
    } else {
      const startsOnField = this.element.querySelector("input[name='staggered_payment_plan[starts_on]']")
      if (startsOnField && startsOnField.value) {
        const startDate = new Date(startsOnField.value)
        baseDate = Number.isNaN(startDate.getTime()) ? new Date() : startDate
      } else {
        baseDate = new Date()
      }
    }

    dueInput.value = this.formatDate(baseDate)
  }

  addDays(date, days) {
    const result = new Date(date.getTime())
    result.setDate(result.getDate() + days)
    return result
  }

  formatDate(date) {
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, "0")
    const day = `${date.getDate()}`.padStart(2, "0")
    return `${year}-${month}-${day}`
  }
}
