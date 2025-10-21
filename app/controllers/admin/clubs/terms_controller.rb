# frozen_string_literal: true

class Admin::Clubs::TermsController < Admin::BaseController
  include ActionView::RecordIdentifier

  before_action :set_club
  before_action :set_term, only: %i[show edit update destroy]

  def new
    @term = @club.club_terms.build
    authorize! @term

    frame_id = frame_identifier(params[:frame_id])

    if params[:reset].present?
      render partial: "admin/clubs/terms/new_button", locals: { club: @club }
    else
      render partial: "admin/clubs/terms/form",
             locals: { club: @club, term: @term, frame_id: frame_id }
    end
  end

  def create
    @term = @club.club_terms.build(term_params)
    authorize! @term

    if @term.save
      @terms = terms_scope
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: [
            turbo_stream.replace(
              dom_id(@club, :club_terms),
              partial: "admin/clubs/terms/list",
              locals: { club: @club, terms: @terms }
            ),
            turbo_stream.replace(
              dom_id(@club, :new_club_term),
              partial: "admin/clubs/terms/new_button",
              locals: { club: @club }
            )
          ]
        end
        format.html { redirect_to admin_club_path(@club), notice: "Term added." }
      end
    else
      render_form_failure
    end
  end

  def show
    authorize! @term

    render partial: "admin/clubs/terms/term",
           locals: { club: @club, term: @term }
  end

  def edit
    authorize! @term

    render partial: "admin/clubs/terms/form",
           locals: { club: @club, term: @term, frame_id: frame_identifier(params[:frame_id]) }
  end

  def update
    authorize! @term

    if @term.update(term_params)
      @terms = terms_scope
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: turbo_stream.replace(
            dom_id(@club, :club_terms),
            partial: "admin/clubs/terms/list",
            locals: { club: @club, terms: @terms }
          )
        end
        format.html { redirect_to admin_club_path(@club), notice: "Term updated." }
      end
    else
      render_form_failure
    end
  end

  def destroy
    authorize! @term

    @term.destroy
    @terms = terms_scope

    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: [
          turbo_stream.remove(@term),
          turbo_stream.replace(
            dom_id(@club, :club_terms),
            partial: "admin/clubs/terms/list",
            locals: { club: @club, terms: @terms }
          ),
          turbo_stream.replace(
            dom_id(@club, :new_club_term),
            partial: "admin/clubs/terms/new_button",
            locals: { club: @club }
          )
        ]
      end
      format.html { redirect_to admin_club_path(@club), notice: "Term removed." }
    end
  end

  private

  def set_club
    @club = Club.find(params[:club_id])
    authorize! @club, to: :update?
  end

  def set_term
    @term = @club.club_terms.find(params[:id])
  end

  def term_params
    params.require(:club_term).permit(:title, :body, :required, :active, :position)
  end

  def terms_scope
    @club.club_terms.order(:position, :created_at)
  end

  def render_form_failure
    respond_to do |format|
      format.turbo_stream do
        render partial: "admin/clubs/terms/form",
               locals: { club: @club, term: @term, frame_id: frame_identifier(params[:frame_id]) },
               status: :unprocessable_entity
      end
      format.html do
        @terms = terms_scope
        render "admin/clubs/show", status: :unprocessable_entity
      end
    end
  end

  def frame_identifier(fallback = nil)
    fallback.presence || request.headers["Turbo-Frame"] || dom_id(@club, :club_term_modal)
  end
end
