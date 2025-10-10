# frozen_string_literal: true

class ApplicationReflex < StimulusReflex::Reflex
  include ActionPolicy::Behaviour

  def current_club
    Club.current
  end
end
