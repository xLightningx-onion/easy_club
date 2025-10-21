# frozen_string_literal: true

module MembershipRegistrations
  class Finalize
    Result = Struct.new(:member, :cart, :cart_item, keyword_init: true)

    def initialize(club:, user:, form:)
      @club = club
      @user = user
      @form = form
    end

    def call
      ActiveRecord::Base.transaction do
        member = find_or_build_member
        membership_type = resolve_membership_type

        member.assign_attributes(member_attributes(membership_type))
        member.save!

        ensure_guardianship(member)
        persist_membership_question_responses(member)
        persist_term_acceptances(member)

        plan = ensure_plan(membership_type)
        cart = ensure_cart
        cart_item = ensure_cart_item(cart, member, plan)

        Result.new(member:, cart:, cart_item:)
      end
    end

    private

    attr_reader :club, :user, :form

    def resolve_membership_type
      return @membership_type if defined?(@membership_type)

      @membership_type = club.membership_types.find(form.membership_type_id)
    end

    def find_or_build_member
      return @member if defined?(@member)

      if form.member_id.present?
        @member = club.members.find(form.member_id)
      else
        @member = club.members.build
      end
    end

    def member_attributes(membership_type)
    {
      first_name: form.first_name,
      last_name: form.last_name,
      dob: form.date_of_birth,
      gender: form.gender,
      role: "player",
      status: "unpaid",
      user: user,
      membership_type: membership_type,
      medical_info_encrypted: build_medical_info,
      emergency_contacts_encrypted: build_emergency_contacts
    }
    end

    def build_medical_info
      info = {}
      info["medical_aid_name"] = form.medical_aid_name if form.medical_aid_name.present?
      info["medical_aid_number"] = form.medical_aid_number if form.medical_aid_number.present?
      info["medical_notes"] = form.medical_notes if form.medical_notes.present?

      medical_questions = club.medical_questions.active.index_by { |q| q.id.to_s }
      form.survey_responses.each do |question_id, value|
        next unless medical_questions.key?(question_id)

        info["medical_question_#{question_id}"] = value
      end

      info
    end

    def build_emergency_contacts
      return {} if form.emergency_contact_name.blank? && form.emergency_contact_number.blank?

      {
        "primary" => {
          "name" => form.emergency_contact_name,
          "number" => form.emergency_contact_number
        }
      }
    end

    def ensure_guardianship(member)
      return unless user

      guardianship = Guardianship.find_or_initialize_by(club:, member:, guardian: user)
      guardianship.relationship ||= "guardian"
      guardianship.save!
    end

    def persist_membership_question_responses(member)
      questions = club.membership_questions.index_by { |q| q.id.to_s }

      form.survey_responses.each do |question_id, value|
        question = questions[question_id]
        next unless question

        if value.blank?
          if question.required?
            value = ""
          else
            MembershipQuestionResponse.where(club:, membership_question: question, member: member).delete_all
            next
          end
        end

        response = MembershipQuestionResponse.find_or_initialize_by(
          club: club,
          membership_question: question,
          member: member
        )
        response.value = value.is_a?(Array) ? value.to_json : value.to_s
        response.save!
      end
    end

    def persist_term_acceptances(member)
      club_terms = club.club_terms.active.index_by(&:id)

      club_terms.each_value do |term|
        accepted = form.accepted_term?(term)
        acceptance = ClubTermAcceptance.find_by(club_term: term, member: member)

        if accepted
          acceptance ||= ClubTermAcceptance.new(club_term: term, member: member)
          acceptance.accepted_at ||= Time.current
          acceptance.accepted_by ||= user
          acceptance.save!
        elsif acceptance
          acceptance.destroy!
        end
      end
    end

    def ensure_cart
      @cart ||= Cart.unpaid.find_by(user:, club:) || Cart.create!(user:, club:)
    end

    def ensure_cart_item(cart, member, plan)
      item = cart.cart_items.find_or_initialize_by(member:, plan:)
      product = plan.product

      item.quantity = 1 if item.new_record? || item.quantity.to_i.zero?
      item.unit_price_cents = product.price_cents
      item.unit_price_currency = product.price_currency
      item.save!
      item
    end

    def ensure_plan(membership_type)
      plan = membership_type.plan
      price = membership_type.current_price

      product = if plan&.product
                  plan.product
      else
                  club.products.find_or_initialize_by(sku: product_sku(membership_type))
      end

      product.name = membership_type.label
      product.price_cents = price.cents
      product.price_currency = price.currency.iso_code
      product.category ||= "membership"
      product.metadata ||= {}
      product.save!

      if plan
        plan.update!(product: product)
      else
        plan = club.plans.create!(product:, plan_type: :once_off)
        membership_type.update!(plan: plan)
      end

      plan
    end

    def product_sku(membership_type)
      "membership-type-#{membership_type.id}"
    end
  end
end
