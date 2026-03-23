# JWT (JSON Web Token) の設定
JWT_SECRET = Rails.application.credentials.secret_key_base
JWT_EXPIRATION = 15.minutes
REFRESH_TOKEN_EXPIRATION = 30.days
JWT_ALGORITHM = 'HS256'