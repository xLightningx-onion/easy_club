import { Controller } from "@hotwired/stimulus"
import { DEFAULT_CENTER, loadGoogleMaps } from "../lib/google_maps_loader"

export default class extends Controller {
  static targets = ["map", "status", "locateButton"]

  static values = {
    apiKey: String,
    clubs: Array
  }

  connect() {
    if (!this.hasMapTarget) return

    loadGoogleMaps(this.apiKeyValue)
      .then((google) => {
        this.google = google
        this.renderMap()
        this.enableLocate()
      })
      .catch((error) => console.error("Failed to load public clubs map", error))
  }

  renderMap() {
    const clubs = this.clubsValue || []
    const hasLocations = clubs.some((club) => club.lat && club.lng)

    const primaryTarget = hasLocations ? { lat: clubs[0].lat, lng: clubs[0].lng } : DEFAULT_CENTER

    this.map = new this.google.maps.Map(this.mapTarget, {
      center: primaryTarget,
      zoom: hasLocations ? 6 : 4
    })

    if (!hasLocations) return

    const bounds = new this.google.maps.LatLngBounds()
    const singleClub = clubs.filter((club) => club.lat && club.lng).length === 1
    let firstPosition = null
    const infoWindow = new this.google.maps.InfoWindow()

    clubs.forEach((club) => {
      if (!club.lat || !club.lng) return

      const position = { lat: club.lat, lng: club.lng }
      if (!firstPosition) firstPosition = position

      const marker = new this.google.maps.Marker({
        position,
        map: this.map,
        title: club.name
      })

      const addressLines = [club.address_line1, club.city, club.region, club.country].filter(Boolean)
      const content = `
        <div class="text-sm">
          <strong>${club.name}</strong><br>
          ${addressLines.join("<br>")}
        </div>
      `

      marker.addListener("click", () => {
        infoWindow.setContent(content)
        infoWindow.open(this.map, marker)
      })

      bounds.extend(position)
    })

    if (singleClub && firstPosition) {
      this.map.setCenter(firstPosition)
      this.map.setZoom(14)
    } else if (!bounds.isEmpty()) {
      this.map.fitBounds(bounds)
      const listener = this.google.maps.event.addListenerOnce(this.map, "bounds_changed", () => {
        const currentZoom = this.map.getZoom()
        if (currentZoom > 12) {
          this.map.setZoom(12)
        }
      })
    }

    this.updateStatus(hasLocations ? "Click a marker for details or use your current location." : "No club locations to display yet.", "info")
  }

  enableLocate() {
    if (!this.hasLocateButtonTarget) return

    if (!navigator.geolocation) {
      this.locateButtonTarget.disabled = true
      this.locateButtonTarget.title = "Geolocation not supported."
      return
    }

    this.locateButtonTarget.disabled = false
  }

  locateMe() {
    if (!navigator.geolocation) return

    this.updateStatus("Locating…", "info")
    this.locateButtonTarget.disabled = true

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const location = { lat: latitude, lng: longitude }
        this.map.panTo(location)
        this.map.setZoom(14)
        new this.google.maps.Circle({
          strokeColor: "#3b82f6",
          strokeOpacity: 0.6,
          strokeWeight: 1,
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          map: this.map,
          center: location,
          radius: Math.min(position.coords.accuracy || 1000, 5000)
        })
        this.updateStatus("Showing clubs near your current position.", "success")
        this.locateButtonTarget.disabled = false
      },
      (error) => {
        console.warn("Geolocation error", error)
        let message = "Unable to get your location."
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission denied. Allow access to centre the map."
        }
        this.updateStatus(message, "error")
        this.locateButtonTarget.disabled = false
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  updateStatus(message, level = "info") {
    if (!this.hasStatusTarget) return

    const colour = {
      info: "text-slate-500",
      success: "text-emerald-600",
      error: "text-rose-600"
    }[level] || "text-slate-500"

    this.statusTarget.textContent = message
    this.statusTarget.className = `text-xs ${colour}`
  }
}
