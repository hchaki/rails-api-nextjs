class User < ApplicationRecord
  has_secure_password

  # バリデーション
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP, message: "の形式が正しくありません" }
  validates :password, length: { minimum: 6 }, if: :password_required?

  # コールバック
  before_save :downcase_email

  # JWTトークン生成
  def generate_jwt
    payload = {
      user_id:id,
      exp: (Time.current + JWT_EXPIRATION).to_i
    }
    JWT.encode(payload, JWT_SECRET, JWT_ALGORITHM)
  end

  # JWTトークンからユーザーを取得
  def self.decode_jwt(token)
    decode = JWT.decode(token, JWT_SECRET, true, { algorithm: JWT_ALGORITHM })
    user_id = decode[0]['user_id']
    find_by(id: user_id)
  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end

  private

  def downcase_email
    self.email = email.downcase if email.present?
  end

  def password_required?
    password_digest.nil? || password.present?
  end
end