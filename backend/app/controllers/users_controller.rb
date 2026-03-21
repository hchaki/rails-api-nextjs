class UsersController < ApplicationController
  # POST /signup
  def create
    user = User.new(user_params)

    if user.save
      token = user.generate_jwt
      render json: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        token: token
      }, status: :created
    else
      render json: { errors: user.errors }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation)
  end
end