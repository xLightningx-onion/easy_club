# frozen_string_literal: true

require "net/http"
require "uri"
require "json"
require "active_support/core_ext/hash/conversions"

module Paygate
  class PayHostClient
    class Error < StandardError; end

    Response = Struct.new(
      :http_status,
      :body,
      :parsed_body,
      :request_payload,
      :request_reference,
      :response_reference,
      :card_token,
      :card_last4,
      :card_brand,
      :card_expiry_month,
      :card_expiry_year,
      :successful?,
      keyword_init: true
    )

    attr_reader :merchant_id, :encryption_key, :endpoint

    def initialize(merchant_id:, encryption_key:, endpoint:)
      @merchant_id = merchant_id
      @encryption_key = encryption_key
      @endpoint = endpoint
    end

    def initiate_transaction(order:, transaction:, tokenize:, payment_method:, card_details:, return_url:, notify_url:)
      payload = build_payload(
        order:,
        transaction:,
        tokenize:,
        payment_method:,
        card_details:,
        return_url:,
        notify_url:
      )

      http_response = perform_request(payload)
      parsed = parse_body(http_response.body)

      Response.new(
        http_status: http_response.code.to_i,
        body: http_response.body,
        parsed_body: parsed,
        request_payload: payload,
        request_reference: parsed.dig("PayGate", "RequestTrace") || payload[:reference],
        response_reference: parsed.dig("PayGate", "ResponseTrace"),
        card_token: extract_token(parsed),
        card_last4: extract_card_last4(parsed),
        card_brand: extract_card_brand(parsed),
        card_expiry_month: extract_card_expiry_month(parsed),
        card_expiry_year: extract_card_expiry_year(parsed),
        successful?: success_from_response(http_response, parsed)
      )
    rescue StandardError => e
      raise Error, e.message
    end

    private

    def build_payload(order:, transaction:, tokenize:, payment_method:, card_details:, return_url:, notify_url:)
      {
        merchant_id:,
        encryption_key:,
        reference: order.number,
        amount_cents: order.total_cents,
        currency: order.total_currency,
        tokenize: tokenize,
        existing_token: payment_method&.external_reference,
        return_url:,
        notify_url:,
        customer: build_customer_hash(order.user),
        card: sanitize_card(card_details)
      }.compact
    end

    def build_customer_hash(user)
      {
        email: user.email
      }.compact
    end

    def sanitize_card(details)
      return if details.blank?

      {
        number: details[:number],
        expiry_month: details[:expiry_month],
        expiry_year: details[:expiry_year],
        cvv: details[:cvv],
        holder_name: details[:holder_name]
      }.compact
    end

    def perform_request(payload)
      uri = URI.parse(endpoint)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"

      request = Net::HTTP::Post.new(uri.request_uri)
      request["Content-Type"] = "application/json"
      request.body = payload.to_json

      http.request(request)
    end

    def parse_body(body)
      return {} if body.blank?

      JSON.parse(body)
    rescue JSON::ParserError
      begin
        Hash.from_xml(body)
      rescue StandardError
        { "raw" => body }
      end
    end

    def success_from_response(http_response, parsed)
      return true if http_response.code.to_i.between?(200, 299)

      status = parsed["Result"] || parsed.dig("PayGate", "Result") || parsed.dig("Envelope", "Body", "Result")
      status.to_s.casecmp("approved").zero?
    end

    def extract_token(parsed)
      parsed.dig("PayGate", "Token") ||
        parsed.dig("TokenResult", "Token") ||
        parsed.dig("Envelope", "Body", "TokenResult", "Token")
    end

    def extract_card_last4(parsed)
      parsed.dig("Card", "Last4") ||
        parsed.dig("PayGate", "Card", "Last4")
    end

    def extract_card_brand(parsed)
      parsed.dig("Card", "Brand") ||
        parsed.dig("PayGate", "Card", "Brand")
    end

    def extract_card_expiry_month(parsed)
      value = parsed.dig("Card", "ExpiryMonth") ||
              parsed.dig("PayGate", "Card", "ExpiryMonth")
      value.to_i if value
    end

    def extract_card_expiry_year(parsed)
      value = parsed.dig("Card", "ExpiryYear") ||
              parsed.dig("PayGate", "Card", "ExpiryYear")
      value.to_i if value
    end
  end
end
