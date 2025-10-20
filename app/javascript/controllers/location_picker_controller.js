import { Controller } from "@hotwired/stimulus"
import { DEFAULT_CENTER, loadGoogleMaps } from "../lib/google_maps_loader"

export default class extends Controller {
  static targets = [
    "searchInput",
    "map",
    "locationName",
    "addressLine1",
    "addressLine2",
    "city",
    "region",
    "postalCode",
    "country",
    "latitudeDisplay",
    "longitudeDisplay",
    "locationNameField",
    "addressLine1Field",
    "addressLine2Field",
    "cityField",
    "regionField",
    "postalCodeField",
    "countryField",
    "latitudeField",
    "longitudeField",
    "placeIdField",
    "useCurrentLocationButton",
    "statusMessage"
  ]

  static values = {
    apiKey: String,
    latitude: Number,
    longitude: Number,
    locationName: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    region: String,
    postalCode: String,
    country: String,
    placeId: String
  }

  connect() {
    if (!this.hasMapTarget) return

    loadGoogleMaps(this.apiKeyValue)
      .then((google) => {
        this.google = google
        this.initializeMap()
        this.initializeAutocomplete()
        this.populateFieldsFromValues()
        this.setStatus("Search for a place or drag the marker to fine-tune.", "info")
        this.enableCurrentLocation()
      })
      .catch((error) => {
        console.error("Location picker failed to initialise:", error)
        this.setStatus("Map failed to load. Check your API key or reload the page.", "error")
      })
  }

  initializeMap() {
    const center = this.hasLatitudeValue && this.hasLongitudeValue
      ? { lat: this.latitudeValue, lng: this.longitudeValue }
      : DEFAULT_CENTER

    this.map = new this.google.maps.Map(this.mapTarget, {
      center,
      zoom: this.hasLatitudeValue ? 14 : 5,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true
    })

    this.marker = new this.google.maps.Marker({
      position: center,
      map: this.map,
      draggable: true
    })

    this.google.maps.event.addListener(this.marker, "dragend", (event) => {
      this.updateLatLngFields(event.latLng.lat(), event.latLng.lng())
      this.setStatus("Marker moved. Coordinates updated.", "success")
    })
  }

  initializeAutocomplete() {
    if (!this.hasSearchInputTarget) return

    const autocomplete = new this.google.maps.places.Autocomplete(this.searchInputTarget, {
      fields: ["place_id", "geometry", "name", "formatted_address", "address_components"],
      types: ["establishment", "geocode"]
    })

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace()
      if (!place.geometry || !place.geometry.location) {
        this.setStatus("Selected place has no map data. Try another search.", "error")
        return
      }

      const location = place.geometry.location
      this.map.panTo(location)
      this.map.setZoom(17)
      this.marker.setPosition(location)

      const addressComponents = this.extractAddressComponents(place.address_components || [])
      this.updateLocationFields({
        locationName: place.name || place.formatted_address || "",
        addressLine1: addressComponents.streetNumber && addressComponents.route
          ? `${addressComponents.streetNumber} ${addressComponents.route}`
          : addressComponents.route || place.formatted_address || "",
        addressLine2: addressComponents.sublocality || "",
        city: addressComponents.locality || addressComponents.administrativeAreaLevel2 || "",
        region: addressComponents.administrativeAreaLevel1 || "",
        postalCode: addressComponents.postalCode || "",
        country: addressComponents.country || "",
        placeId: place.place_id || ""
      })

      this.updateLatLngFields(location.lat(), location.lng())
      this.setStatus(`Location set to ${place.formatted_address || place.name}.`, "success")
    })
  }

  extractAddressComponents(components) {
    const result = {}
    components.forEach((component) => {
      if (component.types.includes("street_number")) {
        result.streetNumber = component.long_name
      }
      if (component.types.includes("route")) {
        result.route = component.long_name
      }
      if (component.types.includes("sublocality") || component.types.includes("sublocality_level_1")) {
        result.sublocality = component.long_name
      }
      if (component.types.includes("locality")) {
        result.locality = component.long_name
      }
      if (component.types.includes("administrative_area_level_2")) {
        result.administrativeAreaLevel2 = component.long_name
      }
      if (component.types.includes("administrative_area_level_1")) {
        result.administrativeAreaLevel1 = component.long_name
      }
      if (component.types.includes("postal_code")) {
        result.postalCode = component.long_name
      }
      if (component.types.includes("country")) {
        result.country = component.long_name
      }
    })
    return result
  }

  populateFieldsFromValues() {
    this.updateDisplayValue(this.locationNameTarget, this.locationNameValue)
    this.updateDisplayValue(this.addressLine1Target, this.addressLine1Value)
    this.updateDisplayValue(this.addressLine2Target, this.addressLine2Value)
    this.updateDisplayValue(this.cityTarget, this.cityValue)
    this.updateDisplayValue(this.regionTarget, this.regionValue)
    this.updateDisplayValue(this.postalCodeTarget, this.postalCodeValue)
    this.updateDisplayValue(this.countryTarget, this.countryValue)

    this.updateHiddenValue(this.locationNameFieldTarget, this.locationNameValue)
    this.updateHiddenValue(this.addressLine1FieldTarget, this.addressLine1Value)
    this.updateHiddenValue(this.addressLine2FieldTarget, this.addressLine2Value)
    this.updateHiddenValue(this.cityFieldTarget, this.cityValue)
    this.updateHiddenValue(this.regionFieldTarget, this.regionValue)
    this.updateHiddenValue(this.postalCodeFieldTarget, this.postalCodeValue)
    this.updateHiddenValue(this.countryFieldTarget, this.countryValue)
    this.updateHiddenValue(this.placeIdFieldTarget, this.placeIdValue)

    if (this.hasLatitudeValue && this.hasLongitudeValue) {
      this.updateLatLngDisplay(this.latitudeValue, this.longitudeValue)
      this.updateHiddenValue(this.latitudeFieldTarget, this.latitudeValue)
      this.updateHiddenValue(this.longitudeFieldTarget, this.longitudeValue)
      this.setStatus(`Loaded saved location: ${this.locationNameValue || "latitude/longitude set"}`, "info")
    } else {
      this.setStatus("Search for a place or click “Use current location”.", "info")
    }

    if (this.hasLocationNameValue && this.hasSearchInputTarget) {
      this.searchInputTarget.value = this.locationNameValue
    }
  }

  updateLocationFields(data) {
    const {
      locationName,
      addressLine1,
      addressLine2,
      city,
      region,
      postalCode,
      country,
      placeId
    } = data

    this.updateDisplayValue(this.locationNameTarget, locationName)
    this.updateDisplayValue(this.addressLine1Target, addressLine1)
    this.updateDisplayValue(this.addressLine2Target, addressLine2)
    this.updateDisplayValue(this.cityTarget, city)
    this.updateDisplayValue(this.regionTarget, region)
    this.updateDisplayValue(this.postalCodeTarget, postalCode)
    this.updateDisplayValue(this.countryTarget, country)

    this.updateHiddenValue(this.locationNameFieldTarget, locationName)
    this.updateHiddenValue(this.addressLine1FieldTarget, addressLine1)
    this.updateHiddenValue(this.addressLine2FieldTarget, addressLine2)
    this.updateHiddenValue(this.cityFieldTarget, city)
    this.updateHiddenValue(this.regionFieldTarget, region)
    this.updateHiddenValue(this.postalCodeFieldTarget, postalCode)
    this.updateHiddenValue(this.countryFieldTarget, country)
    this.updateHiddenValue(this.placeIdFieldTarget, placeId)
  }

  updateLatLngFields(lat, lng) {
    this.updateLatLngDisplay(lat, lng)
    this.updateHiddenValue(this.latitudeFieldTarget, lat)
    this.updateHiddenValue(this.longitudeFieldTarget, lng)
  }

  updateLatLngDisplay(lat, lng) {
    this.updateDisplayValue(this.latitudeDisplayTarget, lat.toFixed(6))
    this.updateDisplayValue(this.longitudeDisplayTarget, lng.toFixed(6))
  }

  updateDisplayValue(element, value) {
    if (!element) return
    element.value = value || ""
  }

  updateHiddenValue(element, value) {
    if (!element) return
    element.value = value || ""
  }

  enableCurrentLocation() {
    if (!this.hasUseCurrentLocationButtonTarget) return

    if (!navigator.geolocation) {
      this.useCurrentLocationButtonTarget.disabled = true
      this.useCurrentLocationButtonTarget.title = "Geolocation not supported in this browser."
      return
    }

    this.useCurrentLocationButtonTarget.disabled = false
  }

  useCurrentLocation() {
    if (!navigator.geolocation) {
      this.setStatus("Geolocation not supported. Try searching instead.", "error")
      return
    }

    this.useCurrentLocationButtonTarget.disabled = true
    this.setStatus("Retrieving your current position…", "info")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const location = { lat: latitude, lng: longitude }

        this.map.panTo(location)
        this.map.setZoom(17)
        this.marker.setPosition(location)
        this.updateLatLngFields(latitude, longitude)
        this.reverseGeocode(location)
        this.setStatus("Location updated from your current position.", "success")
        this.useCurrentLocationButtonTarget.disabled = false
      },
      (error) => {
        console.warn("Geolocation error", error)
        let message = "Could not fetch your current location."
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission denied. Please allow access or search manually."
        } else if (error.code === error.TIMEOUT) {
          message = "Timed out getting your location. Try again."
        }
        this.setStatus(message, "error")
        this.useCurrentLocationButtonTarget.disabled = false
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  reverseGeocode(location) {
    if (!this.google) return

    const geocoder = new this.google.maps.Geocoder()
    geocoder.geocode({ location }, (results, status) => {
      if (status === "OK" && results && results.length > 0) {
        const place = results[0]
        const addressComponents = this.extractAddressComponents(place.address_components || [])
        this.updateLocationFields({
          locationName: place.formatted_address || "",
          addressLine1: addressComponents.streetNumber && addressComponents.route
            ? `${addressComponents.streetNumber} ${addressComponents.route}`
            : addressComponents.route || place.formatted_address || "",
          addressLine2: addressComponents.sublocality || "",
          city: addressComponents.locality || addressComponents.administrativeAreaLevel2 || "",
          region: addressComponents.administrativeAreaLevel1 || "",
          postalCode: addressComponents.postalCode || "",
          country: addressComponents.country || "",
          placeId: place.place_id || ""
        })

        if (this.hasSearchInputTarget) {
          this.searchInputTarget.value = place.formatted_address || ""
        }
      }
    })
  }

  setStatus(message, level = "info") {
    if (!this.hasStatusMessageTarget) return

    const colourClass = {
      info: "text-slate-500",
      success: "text-emerald-600",
      error: "text-rose-600"
    }[level] || "text-slate-500"

    this.statusMessageTarget.textContent = message
    this.statusMessageTarget.className = `text-xs ${colourClass}`
  }
}
