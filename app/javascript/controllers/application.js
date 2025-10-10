import { Application } from "@hotwired/stimulus"
import StimulusReflex from "stimulus_reflex"
import consumer from "../channels/consumer"

const application = Application.start()

// Configure Stimulus development experience
application.debug = false
window.Stimulus   = application

StimulusReflex.initialize(application, { consumer, debug: false })

export { application }
