# frozen_string_literal: true

module Whatsapp
  class IntegrationError < StandardError; end

  class Client
    attr_reader :club, :last_error

    def initialize(club: nil, credentials: nil)
      @club = club
      @credentials_override = credentials&.symbolize_keys
      @last_error = nil
      @credential_source = nil
    end

    def ready?
      # creds = credentials
      # creds.present? && creds.values.all?(&:present?)
      true
    end

    def templates
      return [] unless ready?

      @templates_cache ||= begin
        collection = fetch_templates
        flatten_templates(collection).map { |template| normalize_template(template) }
      end
    rescue IntegrationError => error
      @last_error = error
      Rails.logger.warn("[WhatsApp] #{error.message}")
      []
    rescue StandardError => error
      @last_error = error
      Rails.logger.error("[WhatsApp] Failed to load templates using #{credentials_label}: #{error.class} #{error.message}")
      Rails.logger.debug { error.backtrace.join("\n") } if error.backtrace
      []
    end

    def find_template(template_id)
      return nil if template_id.blank?

      templates.find { |template| template[:name].to_s == template_id.to_s }
    end

    def send_template_message_by_id(template_id:, recipient_number:, components: nil)
      template = find_template(template_id)
      raise IntegrationError, "Template #{template_id} was not found." unless template

      send_template_message(
        template_name: template[:name],
        template_language: template[:language],
        recipient_number: recipient_number,
        components: components
      )
    end

    def send_template_message(template_name:, template_language:, recipient_number:, components: nil)
      raise IntegrationError, "WhatsApp credentials are not ready." unless ready?

      messages_client.send_template(
        sender_id: credentials[:sender_id],
        recipient_number: sanitize_phone_number(recipient_number),
        name: template_name,
        language: template_language,
        components: components,
      )
    rescue StandardError => error
      raise IntegrationError, "Failed to send WhatsApp template #{template_name}: #{error.message}"
    end

    def send_text_message(recipient_number:, message:)
      raise IntegrationError, "WhatsApp credentials are not ready." unless ready?

      messages_client.send_text(
        sender_id: credentials[:sender_id],
        recipient_number: sanitize_phone_number(recipient_number),
        message: message
      )
    rescue StandardError => error
      raise IntegrationError, "Failed to send WhatsApp text message: #{error.message}"
    end

    private

    def credentials
      @credentials ||= begin
        if @credentials_override.present?
          @credential_source = :custom
          @credentials_override
        elsif club.respond_to?(:whatsapp_credentials)
          @credential_source = :club
          club.whatsapp_credentials.symbolize_keys
        else
          @credential_source = :defaults
          default_credentials
        end
      end
    end

    def credential_source
      credentials
      @credential_source || :unknown
    end

    def credentials_label
      case credential_source
      when :custom
        "custom credentials"
      when :club
        "club #{club&.id || 'unknown'}"
      when :defaults
        "default WhatsApp settings"
      else
        "unknown credentials"
      end
    end

    public :credentials_label

    def fetch_templates
      ensure_sdk!
      templates_client.list(
        business_id: credentials[:business_id]
      )
    end

    def flatten_templates(collection)
      Array(collection).flat_map do |entry|
        if entry.respond_to?(:records)
          flatten_templates(entry.records)
        elsif entry.respond_to?(:data)
          flatten_templates(entry.data)
        else
          [ entry ]
        end
      end
    end

    def ensure_sdk!
      return if defined?(WhatsappSdk)

      require "whatsapp_sdk"
    rescue LoadError => error
      raise IntegrationError, "whatsapp_sdk gem is not available: #{error.message}"
    end

    def default_credentials
      defaults = Settings.try(:whatsapp)
      return {} unless defaults

      {
        access_token: defaults.access_token.presence,
        sender_id: defaults.sender_id.presence,
        business_id: defaults.business_id.presence
      }.compact
    end

    def sdk_client
      ensure_sdk!
      @sdk_client ||= WhatsappSdk::Api::Client.new(credentials[:access_token])
    end

    def messages_client
      @messages_client ||= sdk_client.messages
    end

    def templates_client
      @templates_client ||= sdk_client.templates
    end

    def sanitize_phone_number(number)
      number.to_s.gsub(/\D/, "")
    end

    def normalize_template(template)
      hash =
        if template.respond_to?(:attributes)
          template.attributes
        elsif template.respond_to?(:as_json)
          template.as_json
        elsif template.respond_to?(:to_h)
          template.to_h
        else
          template.instance_variables.each_with_object({}) do |ivar, memo|
            memo[ivar.to_s.delete_prefix("@")] = template.instance_variable_get(ivar)
          end
        end

      hash = hash.with_indifferent_access if hash.respond_to?(:with_indifferent_access)

      language_value = hash[:language]
      language =
        case language_value
        when Hash
          language_value[:code] || language_value[:locale]
        else
          language_value
        end

      components =
        hash[:components] ||
        hash[:components_json] ||
        (template.respond_to?(:components) && template.public_send(:components)) ||
        (template.respond_to?(:components_json) && template.public_send(:components_json))

      {
        id: hash[:id],
        name: hash[:name],
        language: language,
        status: hash[:status] || hash.dig(:quality_score, :status),
        category: hash[:category],
        components: components
      }.compact
    rescue StandardError
      template
    end
  end
end
