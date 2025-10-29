# frozen_string_literal: true

module StaggeredPayments
  class SchedulerJob < ApplicationJob
    queue_as :default

    BATCH_SIZE = 50

    def perform
      due_installments.find_in_batches(batch_size: BATCH_SIZE) do |installments|
        installments.each do |installment|
          next unless transition_to_processing!(installment)

          StaggeredPayments::ProcessInstallmentJob.perform_later(installment.id)
        end
      end
    end

    private

    def due_installments
      StaggeredPaymentScheduleInstallment
        .joins(:schedule)
        .merge(StaggeredPaymentSchedule.active)
        .where(status: %w[pending scheduled])
        .where("staggered_payment_schedule_installments.due_at <= ?", Time.current)
        .order(:due_at)
    end

    def transition_to_processing!(installment)
      installment.with_lock do
        return false unless installment.status_pending? || installment.status_scheduled?

        installment.update!(status: :processing)
      end
    rescue ActiveRecord::RecordInvalid, ActiveRecord::StaleObjectError
      false
    end
  end
end
