# frozen_string_literal: true

class Admin::UsersController < Admin::BaseController
  before_action :set_user, only: %i[show edit update destroy]

  def index
    @super_admins = User.where(staff: true).order(:email)
    @users = User.where(staff: false).order(:email)
  end

  def show
    @club_roles = @user.club_roles.includes(:club)
  end

  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    @user.skip_terms_validation = true
    if @user.save
      redirect_to admin_user_path(@user), notice: "User created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit; end

  def update
    attributes = user_params.dup
    @user.skip_terms_validation = true
    if attributes[:password].blank?
      attributes.delete(:password)
      attributes.delete(:password_confirmation)
    end

    if @user.update(attributes)
      redirect_to admin_user_path(@user), notice: "User updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @user.destroy
    redirect_to admin_users_path, notice: "User deleted."
  end

  private

  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    params.require(:user).permit(:first_name, :last_name, :email, :country_code, :mobile_number,
                                 :password, :password_confirmation, :staff, :role)
  end
end
