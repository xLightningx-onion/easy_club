# frozen_string_literal: true

class Admin::Clubs::MembershipQuestionsController < Admin::BaseController
  include ActionView::RecordIdentifier

  before_action :set_club
  before_action :set_membership_question, only: %i[show edit update destroy]

  def new
    @membership_question = @club.membership_questions.build
    frame_id = params[:frame_id].presence || request.headers["Turbo-Frame"] || dom_id(@club, :membership_question_modal)

    if params[:reset].present?
      render partial: "admin/clubs/membership_questions/new_button", locals: { club: @club }
    else
      render partial: "admin/clubs/membership_questions/form",
             locals: {
               club: @club,
               membership_question: @membership_question,
               frame_id:
                 frame_id
             }
    end
  end

  def create
    @membership_question = @club.membership_questions.build(membership_question_params)

    if @membership_question.save
      @membership_questions = @club.membership_questions
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: [
            turbo_stream.replace(
              dom_id(@club, :membership_questions),
              partial: "admin/clubs/membership_questions/list",
              locals: { club: @club, membership_questions: @membership_questions }
            ),
            turbo_stream.replace(
              dom_id(@club, :new_membership_question),
              partial: "admin/clubs/membership_questions/new_button",
              locals: { club: @club }
            )
          ]
        end
        format.html { redirect_to admin_club_path(@club), notice: "Question added." }
      end
    else
      respond_to do |format|
        format.turbo_stream do
          render partial: "admin/clubs/membership_questions/form",
                 locals: {
                   club: @club,
                   membership_question: @membership_question,
                   frame_id: params[:frame_id].presence || request.headers["Turbo-Frame"] || dom_id(@club, :membership_question_modal)
                 },
                 status: :unprocessable_entity
        end
        format.html do
          @membership_questions = @club.membership_questions
          render "admin/clubs/show", status: :unprocessable_entity
        end
      end
    end
  end

  def show
    position = @club.membership_questions.index(@membership_question)
    render partial: "admin/clubs/membership_questions/question",
           locals: {
             club: @club,
             membership_question: @membership_question,
             index: position ? position + 1 : nil
           }
  end

  def edit
    frame_id = params[:frame_id].presence || request.headers["Turbo-Frame"] || dom_id(@club, :membership_question_modal)
    render partial: "admin/clubs/membership_questions/form",
           locals: {
             club: @club,
             membership_question: @membership_question,
             frame_id: frame_id
           }
  end

  def update
    if @membership_question.update(membership_question_params)
      @membership_questions = @club.membership_questions
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: turbo_stream.replace(
            dom_id(@club, :membership_questions),
            partial: "admin/clubs/membership_questions/list",
            locals: { club: @club, membership_questions: @membership_questions }
          )
        end
        format.html { redirect_to admin_club_path(@club), notice: "Question updated." }
      end
    else
      respond_to do |format|
        format.turbo_stream do
          render partial: "admin/clubs/membership_questions/form",
                 locals: {
                   club: @club,
                   membership_question: @membership_question,
                   frame_id: params[:frame_id].presence || request.headers["Turbo-Frame"] || dom_id(@club, :membership_question_modal)
                 },
                 status: :unprocessable_entity
        end
        format.html do
          @membership_questions = @club.membership_questions
          render "admin/clubs/show", status: :unprocessable_entity
        end
      end
    end
  end

  def destroy
    @membership_question.destroy
    @membership_questions = @club.membership_questions

    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: [
          turbo_stream.remove(@membership_question),
          turbo_stream.replace(
            dom_id(@club, :membership_questions),
            partial: "admin/clubs/membership_questions/list",
            locals: { club: @club, membership_questions: @membership_questions }
          ),
          turbo_stream.replace(
            dom_id(@club, :new_membership_question),
            partial: "admin/clubs/membership_questions/new_button",
            locals: { club: @club }
          )
        ]
      end
      format.html { redirect_to admin_club_path(@club), notice: "Question removed." }
    end
  end

  private

  def set_club
    @club = Club.find(params[:club_id])
  end

  def set_membership_question
    @membership_question = @club.membership_questions.find(params[:id])
  end

  def membership_question_params
    params.require(:membership_question).permit(
      :prompt,
      :answer_type,
      :required,
      :help_text,
      :options_text
    )
  end
end
