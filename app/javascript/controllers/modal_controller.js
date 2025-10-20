import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["wrapper", "frame", "title"]

  connect() {
    if (this.hasTitleTarget) {
      this.defaultTitle = this.titleTarget.textContent
    }
  }

  open(event) {
    event.preventDefault()
    this.previousFocus = document.activeElement
    const url = event.currentTarget?.dataset.modalUrl
    const title = event.currentTarget?.dataset.modalTitle
    if (title && this.hasTitleTarget) {
      this.titleTarget.textContent = title
    } else {
      this.resetTitle()
    }
    this.show()
    if (url) {
      this.loadFrame(url)
    }
  }

  close(event) {
    if (event) event.preventDefault()
    if (!this.hasWrapperTarget) return

    this.wrapperTarget.classList.add("hidden")
    this.wrapperTarget.setAttribute("aria-hidden", "true")
    document.body.classList.remove("overflow-hidden")
    this.clearFrame()

    if (this.previousFocus && typeof this.previousFocus.focus === "function") {
      this.previousFocus.focus()
    }
    this.previousFocus = null
    this.resetTitle()
  }

  handleSubmitEnd(event) {
    if (!event.detail.success) return
    if (!this.hasWrapperTarget || this.wrapperTarget.classList.contains("hidden")) return
    if (this.shouldIgnoreSubmit(event)) return
    this.close()
  }

  show() {
    if (!this.hasWrapperTarget) return

    this.wrapperTarget.classList.remove("hidden")
    this.wrapperTarget.setAttribute("aria-hidden", "false")
    document.body.classList.add("overflow-hidden")

    this.wrapperTarget.focus()
    const initialFocus = this.wrapperTarget.querySelector("[data-modal-initial-focus]")
    if (initialFocus) {
      initialFocus.focus()
    }
  }

  loadFrame(url) {
    if (!this.hasFrameTarget) return

    const current = this.frameTarget.getAttribute("src")
    const frameId = this.frameTarget.id
    const finalUrl = this.buildUrlWithFrame(url, frameId)

    if (current === finalUrl) {
      this.frameTarget.removeAttribute("src")
      this.frameTarget.innerHTML = ""
    }
    this.frameTarget.src = finalUrl
  }

  clearFrame() {
    if (!this.hasFrameTarget) return

    this.frameTarget.innerHTML = ""
    this.frameTarget.removeAttribute("src")
  }

  disconnect() {
    document.body.classList.remove("overflow-hidden")
  }

  buildUrlWithFrame(url, frameId) {
    try {
      const fullUrl = new URL(url, window.location.href)
      if (frameId) {
        fullUrl.searchParams.set("frame_id", frameId)
      }
      return fullUrl.toString()
    } catch (_error) {
      if (!frameId) return url
      const separator = url.includes("?") ? "&" : "?"
      return `${url}${separator}frame_id=${encodeURIComponent(frameId)}`
    }
  }

  resetTitle() {
    if (!this.hasTitleTarget) return
    if (!this.defaultTitle) {
      this.defaultTitle = this.titleTarget.textContent
    }
    this.titleTarget.textContent = this.defaultTitle
  }

  shouldIgnoreSubmit(event) {
    const form = event.target
    if (!form) return false
    if (form.dataset.modalStay === "true") return true
    if (form.closest("[data-modal-stay]")) return true
    return false
  }
}
