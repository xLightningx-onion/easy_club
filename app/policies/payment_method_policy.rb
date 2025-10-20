# frozen_string_literal: true

class PaymentMethodPolicy < ApplicationPolicy
  def show?
    owns_payment_method?
  end

  def update?
    owns_payment_method?
  end

  def destroy?
    owns_payment_method?
  end

  scope_for :relation do |relation|
    if user
      relation.where(user:)
    else
      relation.none
    end
  end

  private

  def owns_payment_method?
    user.present? && record.user_id == user.id
  end
end
