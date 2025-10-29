# frozen_string_literal: true

require "ostruct"

module StaggeredPayments
  class ChargeInstallment
    Result = Struct.new(:success?, :payment_transaction, :error, keyword_init: true)

    def initialize(installment)
      @installment = installment
      @schedule = installment.schedule
      @order = @schedule&.order
      @club = @schedule&.club
    end

    def call
      return failure("Installment is not in processing state") unless installment.status_processing?
      return failure("No order associated with installment") unless order
      return failure("Order has no stored payment method") unless payment_method_present?

      payment_transaction = create_payment_transaction!
      response = execute_payment!(payment_transaction)

      if response.successful?
        finalize_success!(payment_transaction, response)
        SendOrderConfirmationJob.perform_later(order.id, payment_transaction.id, installment.id)
        success(payment_transaction)
      else
        finalize_failure!(payment_transaction, response.error_message, response)
        failure(response.error_message)
      end
    rescue StandardError => error
      finalize_failure!(payment_transaction, error.message) if defined?(payment_transaction) && payment_transaction.present?
      Rails.logger.error("[StaggeredPayments] Unexpected error while processing installment #{installment.id}: #{error.class} #{error.message}")
      Rails.logger.debug { error.backtrace.join("\n") } if error.backtrace
      failure(error.message)
    end

    private

    attr_reader :installment, :schedule, :order, :club

    def payment_method_present?
      order.payment_method.present?
    end

    def create_payment_transaction!
      order.payment_transactions.create!(
        status: :pending,
        payment_method: order.payment_method,
        amount_cents: installment.amount_cents,
        amount_currency: installment.amount_currency,
        gateway: "paygate"
      )
    end

    def execute_payment!(payment_transaction)
      client.token_payment(
        order:,
        transaction: payment_transaction,
        payment_method: order.payment_method,
        return_url: settings.return_url,
        notify_url: settings.notify_url,
        amount_cents: installment.amount_cents
      )
    end

    def finalize_success!(payment_transaction, response)
      timestamp = Time.current

      payment_transaction.update!(
        status: :succeeded,
        request_reference: response.request_reference,
        response_reference: response.response_reference,
        request_payload: response.request_payload || {},
        response_payload: response.parsed_body || {},
        processed_at: timestamp,
        metadata: payment_transaction.metadata.merge("auto_run" => true).compact
      )

      installment.update!(
        status: :paid,
        paid_at: timestamp,
        payment_transaction: payment_transaction
      )

      schedule.complete_if_settled!
    end

    def finalize_failure!(payment_transaction, error_message, response = nil)
      payload = {
        "auto_run" => true,
        "error" => error_message
      }
      payload["response_reference"] = response.response_reference if response&.response_reference
      payload["result_code"] = response.result_code if response&.respond_to?(:result_code)

      payment_transaction.update!(
        status: :failed,
        request_reference: response&.request_reference || payment_transaction.request_reference,
        response_reference: response&.response_reference || payment_transaction.response_reference,
        request_payload: response&.request_payload || payment_transaction.request_payload,
        response_payload: response&.parsed_body || payment_transaction.response_payload,
        processed_at: Time.current,
        metadata: payment_transaction.metadata.merge(payload.compact)
      )

      installment.update!(status: :failed)
      Notifications::PaymentFailureNotifier.new(order: order, message: error_message).deliver rescue nil
    end

    def client
      @client ||= Paygate::PayHostClient.new(
        merchant_id: settings.merchant_id,
        password: settings.password,
        endpoint: settings.endpoint
      )
    end

    def settings
      @settings ||= OpenStruct.new(
        merchant_id: Settings.paygate.pay_host.merchant_id,
        password: Settings.paygate.pay_host.password,
        endpoint: Settings.paygate.pay_host.endpoint,
        notify_url: Settings.paygate.pay_host.notify_url,
        return_url: Settings.paygate.pay_host.return_url
      )
    end

    def success(payment_transaction)
      Result.new(success?: true, payment_transaction:)
    end

    def failure(error)
      Result.new(success?: false, error:)
    end
  end
end
