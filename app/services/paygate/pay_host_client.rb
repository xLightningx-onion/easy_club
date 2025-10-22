# frozen_string_literal: true

require "net/http"
require "uri"
require "cgi"
require "active_support/core_ext/array/wrap"
require "active_support/core_ext/hash/conversions"
require "active_support/core_ext/hash/indifferent_access"
require "active_support/core_ext/object/blank"

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
      :error_message,
      keyword_init: true
    )

    attr_reader :merchant_id, :password, :endpoint

    def initialize(merchant_id:, password:, endpoint:, **)
      @merchant_id = merchant_id
      @password = password
      @endpoint = endpoint
    end

    def card_payment(order:, transaction:, card_details:, tokenize:, return_url:, notify_url:, amount_cents: nil)
      request_id = SecureRandom.uuid

      payload = build_single_payment_envelope(
        order:,
        card_details:,
        tokenize:,
        request_reference: request_id,
        return_url:,
        notify_url:,
        amount_cents: amount_cents
      )

      http_response = perform_request(payload)
      parsed = parse_single_payment_response(http_response.body)
      status = extract_status(parsed)

      card_response = parsed[:CardPaymentResponse] || {}
      vault_id = status[:vault_id] || card_response[:VaultId] || card_response.dig(:Status, :VaultId)
      pay_vault_data = status[:pay_vault_data] || {}

      card_number_mask = pay_vault_data[:cardNumber].to_s
      exp_date = pay_vault_data[:expDate].to_s

      card_last4 =
        if card_number_mask.present?
          digits = card_number_mask.gsub(/\D/, "")
          candidate = digits[-4, 4] if digits.present?
          candidate ||= card_number_mask[-4, 4]
          candidate
        else
          card_details[:number].to_s.gsub(/\D/, "")[-4, 4]
        end
      card_last4 ||= card_details[:number].to_s.gsub(/\D/, "")[-4, 4]

      expiry_month =
        if exp_date.length >= 6
          exp_date[0, 2].to_i
        else
          card_details[:expiry_month].to_i
        end

      expiry_year =
        if exp_date.length >= 6
          exp_date[2, 4].to_i
        else
          card_details[:expiry_year].to_i
        end

      payment_brand = status[:payment_brand].presence || brand_for_card(card_details[:number])

      Response.new(
        http_status: http_response.code.to_i,
        body: http_response.body,
        parsed_body: parsed,
        request_payload: { xml: payload },
        request_reference: request_id,
        response_reference: status[:transaction_id],
        card_token: vault_id,
        card_last4: card_last4,
        card_brand: payment_brand,
        card_expiry_month: expiry_month,
        card_expiry_year: expiry_year,
        successful?: status[:approved],
        error_message: status[:message]
      )
    end

    def token_payment(order:, transaction:, payment_method:, return_url:, notify_url:, cvv: nil, amount_cents: nil)
      request_id = SecureRandom.uuid

      payload = build_single_payment_envelope(
        order:,
        vault_id: payment_method.external_reference,
        tokenize: false,
        security_code: cvv,
        request_reference: request_id,
        return_url:,
        notify_url:,
        amount_cents: amount_cents
      )

      http_response = perform_request(payload)
      parsed = parse_single_payment_response(http_response.body)
      status = extract_status(parsed)

      card_response = parsed[:CardPaymentResponse] || {}

      Response.new(
        http_status: http_response.code.to_i,
        body: http_response.body,
        parsed_body: parsed,
        request_payload: { xml: payload },
        request_reference: request_id,
        response_reference: status[:transaction_id],
        card_token: payment_method.external_reference,
        card_last4: payment_method.last_four,
        card_brand: payment_method.brand,
        card_expiry_month: payment_method.expiry_month,
        card_expiry_year: payment_method.expiry_year,
        successful?: status[:approved],
        error_message: status[:message]
      )
    end

    private

    def build_single_payment_envelope(order:, request_reference:, return_url:, notify_url:, card_details: nil, vault_id: nil, tokenize: false, security_code: nil, amount_cents: nil)
      raise Error, "Either card details or vault ID must be provided" if card_details.blank? && vault_id.blank?

      user = order.user
      first_name = user&.first_name.to_s
      last_name = user&.last_name.to_s
      email = user&.email.to_s
      telephone = user.respond_to?(:phone) ? user.phone.to_s : ""
      amount = amount_cents.present? ? amount_cents.to_i : order.total_cents
      currency = order.total_currency

      xml = +"<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
      xml << "<SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\">"
      xml << "<SOAP-ENV:Header/>"
      xml << "<SOAP-ENV:Body>"
      xml << "<SinglePaymentRequest xmlns=\"http://www.paygate.co.za/PayHOST\">"
      xml << "<CardPaymentRequest>"
      xml << "<Account>"
      xml << "<PayGateId>#{merchant_id}</PayGateId>"
      xml << "<Password>#{password}</Password>"
      xml << "</Account>"
      xml << "<Customer>"
      xml << "<FirstName>#{CGI.escapeHTML(first_name)}</FirstName>"
      xml << "<LastName>#{CGI.escapeHTML(last_name)}</LastName>"
      xml << "<Telephone>#{CGI.escapeHTML(telephone)}</Telephone>" if telephone.present?
      xml << "<Email>#{CGI.escapeHTML(email)}</Email>"
      xml << "</Customer>"

      if vault_id.present?
        xml << "<VaultId>#{vault_id}</VaultId>"
        xml << "<CVV>#{security_code}</CVV>" if security_code.present?
      else
        card_number = card_details[:number].to_s.gsub(/\D/, "")
        expiry_month = card_details[:expiry_month].to_i.to_s.rjust(2, "0")
        expiry_year = card_details[:expiry_year].to_i
        cvv = card_details[:cvv].to_s.strip
        holder = card_details[:holder_name].presence || [first_name, last_name].reject(&:blank?).join(" ").presence || email.split("@").first

        xml << "<CardNumber>#{card_number}</CardNumber>"
        xml << "<CardExpiryDate>#{expiry_month}#{expiry_year}</CardExpiryDate>"
        xml << "<CVV>#{cvv}</CVV>"
        xml << "<Vault>#{tokenize ? 'true' : 'false'}</Vault>"
      end

      xml << "<BudgetPeriod>0</BudgetPeriod>"
      xml << "<Redirect>"
      xml << "<NotifyUrl>#{CGI.escapeHTML(notify_url.to_s)}</NotifyUrl>" if notify_url.present?
      xml << "<ReturnUrl>#{CGI.escapeHTML(return_url.to_s)}</ReturnUrl>" if return_url.present?
      xml << "</Redirect>"
      xml << "<Order>"
      xml << "<MerchantOrderId>#{CGI.escapeHTML(order.number)}</MerchantOrderId>"
      xml << "<Currency>#{currency}</Currency>"
      xml << "<Amount>#{amount}</Amount>"
      xml << "</Order>"
      xml << "</CardPaymentRequest>"
      xml << "</SinglePaymentRequest>"
      xml << "</SOAP-ENV:Body>"
      xml << "</SOAP-ENV:Envelope>"
      xml
    end

    def perform_request(body)
      uri = URI.parse(endpoint)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"

      request = Net::HTTP::Post.new(uri.request_uri)
      request["Content-Type"] = "text/xml"
      request["SOAPAction"] = "SinglePayment"
      request["Accept"] = "text/xml"
      request.body = body

      http.request(request)
    end

    def parse_single_payment_response(body)
      raise Error, "Empty response from PayHost" if body.blank?

      hash = Hash.from_xml(body).with_indifferent_access
      response = hash.dig(:Envelope, :Body, :SinglePaymentResponse)
      response ||= hash[:SinglePaymentResponse]
      raise Error, "Empty/invalid PayHost response" if response.blank?

      response.with_indifferent_access
    rescue REXML::ParseException => e
      raise Error, "Unable to parse PayHost response: #{e.message} – #{body.to_s[0, 200]}"
    end

    def extract_status(parsed_response)
      card_response = parsed_response[:CardPaymentResponse]
      raise Error, "Invalid PayHost response: missing CardPaymentResponse" if card_response.blank?

      card_response = card_response.with_indifferent_access
      status = card_response[:Status] || {}
      status = status.first if status.is_a?(Array)
      status = status.with_indifferent_access

      result_code = status[:ResultCode].to_s
      status_name = status[:StatusName].to_s
      status_code = status[:StatusCode].to_s

      approved = (%w[990017 0 1].include?(result_code) || %w[0 1].include?(status_code) || status_name.casecmp("completed").zero?)

      {
        approved: approved,
        message: status[:ResultDescription],
        transaction_id: status[:TransactionId] || card_response[:TransactionId],
        reference: status[:Reference] || card_response[:Reference],
        vault_id: status[:VaultId] || card_response[:VaultId],
        pay_vault_data: normalize_payvault_data(status[:PayVaultData] || card_response[:PayVaultData]),
        payment_brand: extract_payment_brand(status[:PaymentType] || card_response[:PaymentType])
      }
    end

    def brand_for_card(number)
      return nil if number.blank?

      case number.to_s
      when /^4/ then "Visa"
      when /^5[1-5]/ then "Mastercard"
      when /^3[47]/ then "American Express"
      when /^6/ then "Discover"
      else "Card"
      end
    end

    def normalize_payvault_data(raw_data)
      entries = Array.wrap(raw_data).compact
      return {} if entries.empty?

      entries.each_with_object({}.with_indifferent_access) do |entry, memo|
        next unless entry.respond_to?(:with_indifferent_access)

        entry_hash = entry.with_indifferent_access
        name = entry_hash[:name].presence
        value = entry_hash[:value]
        memo[name] = value if name
      end
    end

    def extract_payment_brand(raw_payment_type)
      payment_type =
        case raw_payment_type
        when Array then raw_payment_type.first
        else raw_payment_type
        end

      return nil unless payment_type.respond_to?(:with_indifferent_access)

      payment_type.with_indifferent_access[:Detail]
    end
  end
end
