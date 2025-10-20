let googleMapsPromise

export const DEFAULT_CENTER = { lat: -26.2041, lng: 28.0473 } // Johannesburg as a sane default

export function loadGoogleMaps(apiKey) {
  if (!apiKey) {
    return Promise.reject(new Error("Missing Google Places API key"))
  }

  if (window.google && window.google.maps && window.google.maps.places) {
    return Promise.resolve(window.google)
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      window.__easyClubGoogleInit = () => resolve(window.google)

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=__easyClubGoogleInit&v=weekly`
      script.async = true
      script.defer = true
      script.onerror = () => reject(new Error("Failed to load Google Maps script"))
      document.head.appendChild(script)
    })
  }

  return googleMapsPromise
}
