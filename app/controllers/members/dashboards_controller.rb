class Members::DashboardsController < Members::ApplicationController
  def index
    direct_members = current_user.members.includes(:club).status_active
    guardian_members = current_user.guarded_members.includes(:club).status_active

    @membership_profiles = (direct_members.to_a + guardian_members.to_a).uniq { |member| member.id }
    @known_clubs = (@membership_profiles.map(&:club) + current_user.clubs.to_a).compact.uniq { |club| club.id }
    @open_carts = Cart
                    .where(user: current_user, status: %i[unpaid pending_payment partially_paid])
                    .joins(:cart_items)
                    .distinct
                    .includes(
                      :club,
                      :staggered_payment_plan,
                      { cart_items: { member: :membership_type } },
                      { order: { staggered_payment_schedule: :installments } }
                    )
                    .order(updated_at: :desc)
  end

  def show
    direct_members = current_user.members.includes(:club).status_active
    guardian_members = current_user.guarded_members.includes(:club).status_active

    @membership_profiles = (direct_members.to_a + guardian_members.to_a).uniq { |member| member.id }
    @known_clubs = (@membership_profiles.map(&:club) + current_user.clubs.to_a).compact.uniq { |club| club.id }
    @open_carts = Cart
                    .where(user: current_user, status: %i[unpaid pending_payment partially_paid])
                    .joins(:cart_items)
                    .distinct
                    .includes(
                      :club,
                      :staggered_payment_plan,
                      { cart_items: { member: :membership_type } },
                      { order: { staggered_payment_schedule: :installments } }
                    )
                    .order(updated_at: :desc)

    render :index
  end
end
