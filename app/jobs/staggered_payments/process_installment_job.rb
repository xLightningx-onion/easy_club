# frozen_string_literal: true

module StaggeredPayments
  class ProcessInstallmentJob < ApplicationJob
    queue_as :default

    discard_on ActiveJob::DeserializationError

    def perform(installment_id)
      installment = StaggeredPaymentScheduleInstallment.find_by(id: installment_id)
      return unless installment

      installment.with_lock do
        return unless installment.status_processing?

        result = StaggeredPayments::ChargeInstallment.new(installment).call

        unless result.success?
          Rails.logger.warn("[StaggeredPayments] Installment #{installment.id} failed to process: #{result.error}")
        end
      end
    end
  end
end
