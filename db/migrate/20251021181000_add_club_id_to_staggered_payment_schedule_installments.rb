class AddClubIdToStaggeredPaymentScheduleInstallments < ActiveRecord::Migration[7.1]
  def up
    return if column_exists?(:staggered_payment_schedule_installments, :club_id)

    add_column :staggered_payment_schedule_installments, :club_id, :uuid
    add_index :staggered_payment_schedule_installments, :club_id

    execute <<-SQL.squish
      UPDATE staggered_payment_schedule_installments AS installments
      SET club_id = schedules.club_id
      FROM staggered_payment_schedules AS schedules
      WHERE installments.staggered_payment_schedule_id = schedules.id
        AND schedules.club_id IS NOT NULL
    SQL

    change_column_null :staggered_payment_schedule_installments, :club_id, false
  end

  def down
    return unless column_exists?(:staggered_payment_schedule_installments, :club_id)

    remove_column :staggered_payment_schedule_installments, :club_id
  end
end
