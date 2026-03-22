class SessionsController < ApplicationController
  before_action :authenticate_request!, only: [:show]

  # POST /login
  def create
    user = User.find_by(email: params[:email]&.downcase)

    if user&.authenticate(params[:password])
      access_token = user.generate_jwt
      refresh_token = user.generate_refresh_token

      cookies[:refresh_token] = {
        value: refresh_token,
        httponly: true,
        secure: Rails.env.production?,
        expires: REFRESH_TOKEN_EXPIRATION.from_now,
        same_site: :none
      }

      render json: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        token: access_token
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
    token = cookies[:refresh_token]
    if token
      user = User.find_by_refresh_token(token)
      user&.invalidate_refresh_token!
    end

    cookies.delete(:refresh_token)
    head :no_content
  end

  def refresh
    token = cookies[:refresh_token]
    user = token && User.find_by_refresh_token(token)

    if user
      new_access_token = user.generate_jwt
      render json: { token: new_access_token}, status: :ok
    else
      cookies.delete(:refresh_token)
      render json: { error:
  'セッションが切れました。再度ログインしてください' }, status:
  :unauthorized
    end
  end
end