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

  # リフレッシュトークン生成
  def generate_refresh_token
    raw_token = SecureRandom.hex(32)
    update!(
      refresh_token_digest: Digest::SHA256.hexdigest(raw_token),
      refresh_token_expires_at: 30.days.from_now
    )
    raw_token
  end

  # リフレッシュトークンからユーザーを検索
  def self.find_by_refresh_token(token)
    digest = Digest::SHA256.hexdigest(token)
    user = find_by(refresh_token_digest: digest)
    return nil unless user
    return nil if user.refresh_token_expires_at < Time.current
    user
  end

  # リフレッシュトークン無効化
  def invalidate_refresh_token!
    update!(refresh_token_digest: nil, refresh_token_expires_at: nil)
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