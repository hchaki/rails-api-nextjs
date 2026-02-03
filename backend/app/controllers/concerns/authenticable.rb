module Authenticable
  extend ActiveSupport::Concern

  include do
    attr_reader :current_user
  end

  private

  def authenticate_request!
    @current_user = User.decode_jwt(token_from_header)

    unless @current_user
      render json: { error: '認証に失敗しました' }, status: :unauthorized
    end
  rescue StandardError => e
    render json: { error: '認証に失敗しました' }, status: :unauthorized
  end

  def token_from_header
    header = request.headers['Authorization']
    return nil unless header

    # "Bearer <token>" 形式から <token> を抽出
    header.split(' ').last if header.match(/^Bearer /)
  end
end