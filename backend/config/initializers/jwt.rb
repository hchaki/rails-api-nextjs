# JWT (JSON Web Token) の設定
JWT_SECRET = Rails.application.credentials.secret_key_base
JWT_EXPIRATION = 24.hours
JWT_ALGORITHM = 'HS256'