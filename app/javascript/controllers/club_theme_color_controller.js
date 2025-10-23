import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "colorInput",
    "hexField",
    "oklchField",
    "oklchDisplay"
  ]

  connect() {
    const defaultHex = this.element.dataset.clubThemeColorDefaultHexValue || ""
    const storedOklch = this.oklchFieldTarget.value || this.element.dataset.clubThemeColorInitialOklchValue || ""

    if (storedOklch && !this.oklchFieldTarget.value) {
      this.oklchFieldTarget.value = storedOklch
    }

    let hexCandidate = (this.hexFieldTarget.value || this.element.dataset.clubThemeColorInitialHexValue || "").trim()

    if (!hexCandidate && storedOklch) {
      const convertedHex = this.oklchToHex(storedOklch)
      if (convertedHex) {
        hexCandidate = convertedHex
      }
    }

    if (!hexCandidate && defaultHex) {
      hexCandidate = defaultHex
    }

    if (hexCandidate) {
      this.updateFromHex(hexCandidate)
    } else {
      this.renderDisplay()
    }
  }

  pick(event) {
    const hex = event.target.value
    this.updateFromHex(hex)
  }

  oklchInput(event) {
    const value = event.target.value
    this.oklchFieldTarget.value = value
    const hex = this.oklchToHex(value)
    if (hex) {
      this.updateFromHex(hex)
    } else {
      this.renderDisplay()
    }
  }

  hexInput(event) {
    let value = event.target.value.trim()
    if (value && !value.startsWith("#")) {
      value = `#${value}`
    }
    this.hexFieldTarget.value = value
    if (value.length === 7) {
      this.updateFromHex(value)
    } else {
      this.renderDisplay()
    }
  }

  renderDisplay() {
    if (this.hasOklchDisplayTarget) {
      this.oklchDisplayTarget.textContent = this.oklchFieldTarget.value || "—"
    }
  }

  hexToOklch(hex) {
    if (!hex || typeof hex !== "string") return null
    const normalized = hex.trim().replace("#", "")
    if (normalized.length !== 6) return null

    const r = parseInt(normalized.slice(0, 2), 16) / 255
    const g = parseInt(normalized.slice(2, 4), 16) / 255
    const b = parseInt(normalized.slice(4, 6), 16) / 255

    const [lr, lg, lb] = [r, g, b].map((v) =>
      v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    )

    const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
    const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
    const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb

    const l_ = Math.cbrt(l)
    const m_ = Math.cbrt(m)
    const s_ = Math.cbrt(s)

    const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
    const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
    const bVal = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

    const C = Math.sqrt(a * a + bVal * bVal)
    let H = (Math.atan2(bVal, a) * 180) / Math.PI
    if (H < 0) H += 360

    return `oklch(${this.formatNumber(L)} ${this.formatNumber(C)} ${this.formatNumber(H, 2)})`
  }

  oklchToHex(oklchString) {
    if (!oklchString || typeof oklchString !== "string") return null
    const parsed = this.parseOklch(oklchString)
    if (!parsed) return null

    const { l, c, h } = parsed
    const hr = (h * Math.PI) / 180
    const a = Math.cos(hr) * c
    const b = Math.sin(hr) * c

    const l_ = l + 0.3963377774 * a + 0.2158037573 * b
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b
    const s_ = l - 0.0894841775 * a - 1.291485548 * b

    const l3 = l_ * l_ * l_
    const m3 = m_ * m_ * m_
    const s3 = s_ * s_ * s_

    let r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
    let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3
    let bVal = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3

    r = this.linearToSrgb(r)
    g = this.linearToSrgb(g)
    bVal = this.linearToSrgb(bVal)

    return `#${this.toHex(r)}${this.toHex(g)}${this.toHex(bVal)}`
  }

  updateFromHex(hex) {
    if (!hex) return
    let formatted = hex.trim()
    if (!formatted) return
    if (!formatted.startsWith("#")) {
      formatted = `#${formatted}`
    }
    if (formatted.length === 7) {
      formatted = formatted.toUpperCase()
    }
    this.hexFieldTarget.value = formatted
    if (this.colorInputTarget) {
      this.colorInputTarget.value = formatted
    }
    const oklch = this.hexToOklch(formatted)
    if (oklch) {
      this.oklchFieldTarget.value = oklch
    }
    this.renderDisplay()
  }

  parseOklch(value) {
    const cleaned = value.replace(/\s+/g, " ").trim()
    const match = cleaned.match(/^oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+)?\)$/i)
    if (!match) return null

    const l = parseFloat(match[1])
    const c = parseFloat(match[2])
    const h = parseFloat(match[3])

    if ([l, c, h].some((v) => Number.isNaN(v))) return null

    return {
      l: this.clamp(l, 0, 1),
      c: Math.max(0, c),
      h: ((h % 360) + 360) % 360
    }
  }

  linearToSrgb(value) {
    const v = this.clamp(value, 0, 1)
    if (v <= 0.0031308) {
      return 12.92 * v
    }
    return 1.055 * Math.pow(v, 1 / 2.4) - 0.055
  }

  formatNumber(number, precision = 4) {
    if (!Number.isFinite(number)) return "0"
    return Number(number.toFixed(precision)).toString()
  }

  toHex(component) {
    const value = Math.round(this.clamp(component, 0, 1) * 255)
    return value.toString(16).padStart(2, "0").toUpperCase()
  }

  clamp(value, min, max) {
    if (Number.isNaN(value)) return min
    return Math.min(Math.max(value, min), max)
  }
}
