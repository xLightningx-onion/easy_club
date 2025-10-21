# frozen_string_literal: true

class Club::PaymentMethodsController < Club::BaseController
  def destroy
    payment_method = policy_scope(PaymentMethod).find(params[:id])
    authorize! payment_method, :destroy?

    success = destroy_payment_method(payment_method)
    payment_methods = load_payment_methods
    selected_method_id = payment_methods.first&.id
    error_message = success ? nil : "We couldn't remove that card. It may still be linked to a recent order."

    respond_to do |format|
      format.turbo_stream do
        render :destroy,
               locals: {
                 payment_methods:,
                 selected_method_id:,
                 error_message:
               },
               status: success ? :ok : :unprocessable_entity
      end
      format.html do
        if turbo_frame_request?
          render partial: "club/carts/saved_payment_methods",
                 locals: {
                   payment_methods:,
                   selected_method_id:,
                   error_message:
                 },
                 status: success ? :ok : :unprocessable_entity
        elsif success
          redirect_to club_cart_path, notice: "Saved card removed.", status: :see_other
        else
          redirect_to club_cart_path,
                      alert: "We couldn't remove that card. It may still be linked to a recent order.",
                      status: :see_other
        end
      end
    end
  rescue ActiveRecord::RecordNotFound
    payment_methods = load_payment_methods
    selected_method_id = payment_methods.first&.id
    respond_to do |format|
      format.turbo_stream do
        render :destroy,
               locals: {
                 payment_methods:,
                 selected_method_id:,
                 error_message: "We couldn't find that saved card."
               },
               status: :not_found
      end
      format.html do
        if turbo_frame_request?
          render partial: "club/carts/saved_payment_methods",
                 locals: {
                   payment_methods:,
                   selected_method_id:,
                   error_message: "We couldn't find that saved card."
                 },
                 status: :not_found
        else
          redirect_to club_cart_path, alert: "We couldn't find that saved card.", status: :see_other
        end
      end
    end
  end

  private

  def destroy_payment_method(payment_method)
    payment_method.destroy
    payment_method.destroyed?
  rescue ActiveRecord::DeleteRestrictionError
    false
  end

  def load_payment_methods
    policy_scope(PaymentMethod)
      .where(club: current_club)
      .usable
      .order(default: :desc, created_at: :desc)
  end
end
