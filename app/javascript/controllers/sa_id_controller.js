import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "gender", "nationality", "dateOfBirth"]

  connect() {
    this.update()
  }

  inputTargetConnected() {
    this.inputTarget.addEventListener("input", () => this.update())
  }

  update() {
    if (!this.hasInputTarget) return
    const cleaned = this.inputTarget.value.replace(/\D/g, "")
    if (cleaned.length !== 13) {
      this.clearDerivedFields()
      return
    }

    const yy = parseInt(cleaned.slice(0, 2), 10)
    const mm = parseInt(cleaned.slice(2, 4), 10)
    const dd = parseInt(cleaned.slice(4, 6), 10)
    const currentYear = new Date().getFullYear() % 100
    const century = yy > currentYear ? 1900 : 2000

    const birthDate = new Date(century + yy, mm - 1, dd)
    if (Number.isNaN(birthDate.getTime())) {
      this.clearDerivedFields()
      return
    }

    const genderCode = parseInt(cleaned.slice(6, 10), 10)
    const nationalityCode = parseInt(cleaned.slice(10, 11), 10)

    if (this.hasGenderTarget) {
      const genderValue = genderCode >= 5000 ? "Male" : "Female"
      this.genderTarget.value = genderValue
    }

    if (this.hasNationalityTarget) {
      this.nationalityTarget.value = nationalityCode === 0 ? "South African" : "Non-South African"
    }

    if (this.hasDateOfBirthTarget) {
      const formatted = birthDate.toISOString().split("T")[0]
      this.dateOfBirthTarget.value = formatted
    }
  }

  clearDerivedFields() {
    if (this.hasGenderTarget) this.genderTarget.value = ""
    if (this.hasNationalityTarget) this.nationalityTarget.value = ""
    if (this.hasDateOfBirthTarget) this.dateOfBirthTarget.value = ""
  }
}
