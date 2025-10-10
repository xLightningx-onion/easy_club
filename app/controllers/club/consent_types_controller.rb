# frozen_string_literal: true

class Club::ConsentTypesController < Club::BaseController
  def index
    @consent_types = policy_scope(ConsentType).order(:key)
    authorize! ConsentType, :index?
  end
end
