# frozen_string_literal: true

class Club::MembersController < Club::BaseController
  before_action :set_member, only: %i[show edit update destroy]

  def index
    @members = policy_scope(Member).includes(:user).order(:last_name, :first_name)
    authorize! Member, :index?
  end

  def show
    authorize! @member

    @invoices = policy_scope(@member.invoices).includes(:invoice_items).order(due_at: :desc)
    @consents = @member.consents.includes(:consent_type)
    @team_memberships = @member.team_memberships.includes(:team)
  end

  def new
    @member = current_club.members.build
    authorize! @member
  end

  def create
    @member = current_club.members.build(member_params)
    authorize! @member

    if @member.save
      redirect_to club_member_path(@member), notice: "Member created successfully."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    authorize! @member
  end

  def update
    authorize! @member

    if @member.update(member_params)
      redirect_to club_member_path(@member), notice: "Member updated successfully."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    authorize! @member
    @member.destroy
    redirect_to club_members_path, notice: "Member removed."
  end

  private

  def set_member
    @member = policy_scope(Member).find(params[:id])
  end

  def member_params
    params.require(:member).permit(
      :first_name,
      :last_name,
      :dob,
      :gender,
      :role,
      :user_id,
      :safeguarding_flag,
      :safeguarding_reason,
      medical_info_encrypted: {},
      emergency_contacts_encrypted: {}
    )
  end
end
