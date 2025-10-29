# frozen_string_literal: true

class Admin::Clubs::MedicalQuestionsController < Admin::BaseController
  include ActionView::RecordIdentifier

  before_action :set_club
  before_action :set_medical_question, only: %i[show edit update destroy toggle]

  def new
    @medical_question = @club.medical_questions.build
    authorize! @medical_question
    frame_id = frame_identifier(params[:frame_id])

    if params[:reset].present?
      render partial: "admin/clubs/medical_questions/new_button", locals: { club: @club }
    else
      render partial: "admin/clubs/medical_questions/form",
             locals: { club: @club, medical_question: @medical_question, frame_id: frame_id }
    end
  end

  def create
    @medical_question = @club.medical_questions.build(medical_question_params)
    authorize! @medical_question

    if @medical_question.save
      @medical_questions = medical_questions_scope
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: [
            turbo_stream.replace(
              dom_id(@club, :medical_questions),
              partial: "admin/clubs/medical_questions/list",
              locals: { club: @club, medical_questions: @medical_questions }
            ),
            turbo_stream.replace(
              dom_id(@club, :new_medical_question),
              partial: "admin/clubs/medical_questions/new_button",
              locals: { club: @club }
            )
          ]
        end
        format.html { redirect_to admin_club_path(@club), notice: "Medical question added." }
      end
    else
      render_form_failure
    end
  end

  def show
    authorize! @medical_question
    render partial: "admin/clubs/medical_questions/question",
           locals: { club: @club, medical_question: @medical_question }
  end

  def edit
    authorize! @medical_question
    render partial: "admin/clubs/medical_questions/form",
           locals: { club: @club, medical_question: @medical_question, frame_id: frame_identifier(params[:frame_id]) }
  end

  def update
    authorize! @medical_question
    if @medical_question.update(medical_question_params)
      @medical_questions = medical_questions_scope
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: turbo_stream.replace(
            dom_id(@club, :medical_questions),
            partial: "admin/clubs/medical_questions/list",
            locals: { club: @club, medical_questions: @medical_questions }
          )
        end
        format.html { redirect_to admin_club_path(@club), notice: "Medical question updated." }
      end
    else
      render_form_failure
    end
  end

  def destroy
    authorize! @medical_question
    @medical_question.destroy
    @medical_questions = medical_questions_scope

    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: [
          turbo_stream.remove(@medical_question),
          turbo_stream.replace(
            dom_id(@club, :medical_questions),
            partial: "admin/clubs/medical_questions/list",
            locals: { club: @club, medical_questions: @medical_questions }
          ),
          turbo_stream.replace(
            dom_id(@club, :new_medical_question),
            partial: "admin/clubs/medical_questions/new_button",
            locals: { club: @club }
          )
        ]
      end
      format.html { redirect_to admin_club_path(@club), notice: "Medical question removed." }
    end
  end

  def toggle
    authorize! @medical_question, to: :toggle?
    @medical_question.update!(active: !@medical_question.active?)
    @medical_questions = medical_questions_scope

    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: turbo_stream.replace(
          dom_id(@club, :medical_questions),
          partial: "admin/clubs/medical_questions/list",
          locals: { club: @club, medical_questions: @medical_questions }
        )
      end
      format.html do
        notice = @medical_question.active? ? "Question activated." : "Question hidden."
        redirect_to admin_club_path(@club), notice: notice
      end
    end
  end


  def set_club
    @club = Club.find(params[:club_id])
    authorize! @club, to: :update?
  end

  def set_medical_question
    @medical_question = @club.medical_questions.find(params[:id])
  end
  private

  def medical_question_params
    params.require(:medical_question).permit(:prompt, :question_type, :position, :active, :required)
  end

  def medical_questions_scope
    @club.medical_questions.order(:position, :created_at)
  end

  def render_form_failure
    respond_to do |format|
      format.turbo_stream do
        render partial: "admin/clubs/medical_questions/form",
               locals: {
                 club: @club,
                 medical_question: @medical_question,
                 frame_id: frame_identifier(params[:frame_id])
               },
               status: :unprocessable_entity
      end
      format.html do
        @medical_questions = medical_questions_scope
        @default_price_tiers = @club.default_price_tiers.ordered
        render "admin/clubs/show", status: :unprocessable_entity
      end
    end
  end

  def frame_identifier(fallback = nil)
    fallback.presence || request.headers["Turbo-Frame"] || dom_id(@club, :medical_question_modal)
  end
end
