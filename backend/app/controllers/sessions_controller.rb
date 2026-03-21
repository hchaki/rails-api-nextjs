class SessionsController < ApplicationController
  before_action :authenticate_request!, only: [:show]

  # POST /login
  def create
    user = User.find_by(email: params[:email]&.downcase)

    if user&.authenticate(params[:password])
      token = user.generate_jwt
      render json: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        token: token
      }, status: :ok
    else
      render json: { error: 'メールアドレスまたはパスワードが正しくありません' }, status: :unauthorized
    end
  end

  # GET /current_user
  def show
    render json: {
      id: current_user.id,
      email: current_user.email,
      created_at: current_user.created_at
    }
  end

  # DELETE /logout
  def destroy
    # クライアント側でトークンを削除することを想定
    head :no_content
  end
end