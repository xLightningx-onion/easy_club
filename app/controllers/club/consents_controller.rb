# frozen_string_literal: true

class Club::ConsentsController < Club::BaseController
  before_action :set_member

  def index
    authorize! @member, to: :show?
    @consents = @member.consents.includes(:consent_type)
  end

  def new
    @consent = @member.consents.build(club: current_club)
    authorize! @consent
    @consent_types = current_club.consent_types.order(:key)
  end

  def create
    consent_type = current_club.consent_types.find(consent_params[:consent_type_id])
    @consent = @member.consents.find_or_initialize_by(consent_type:, club: current_club)
    authorize! @consent

    accepted = ActiveModel::Type::Boolean.new.cast(consent_params[:accepted])
    @consent.assign_attributes(
      accepted: accepted,
      accepted_at: accepted ? Time.current : nil,
      accepted_by: current_user
    )

    if @consent.save
      redirect_to club_member_consents_path(@member), notice: "Consent updated."
    else
      @consent_types = current_club.consent_types.order(:key)
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_member
    @member = policy_scope(Member).find(params[:member_id])
  end

  def consent_params
    params.require(:consent).permit(:consent_type_id, :accepted)
  end
end
