# JWT 認証ガイド

## JWT (JSON Web Token) とは

JWT は、JSON 形式のデータを安全に送受信するための業界標準規格 (RFC 7519) です。主に認証・認可に使用されます。

### JWT の構造

JWT は3つの部分で構成されます（ドットで区切られる）:

```
xxxxx.yyyyy.zzzzz
```

1. **Header (ヘッダー)**: トークンのタイプとアルゴリズム
2. **Payload (ペイロード)**: クレーム（ユーザー情報など）
3. **Signature (署名)**: 改ざん検知用の署名

#### 例:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3MTA5ODc2MDB9.5k8yQ3XxN1B8F7u9qHZ2Lw3dT1mK9vJ2sP0aI4nU6oE
```

### Header の内容

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

- `alg`: 署名アルゴリズム（このプロジェクトでは HS256 = HMAC SHA256）
- `typ`: トークンタイプ（常に "JWT"）

### Payload の内容

```json
{
  "user_id": 1,
  "exp": 1710987600
}
```

- `user_id`: カスタムクレーム（ユーザーID）
- `exp`: 有効期限（Unix タイムスタンプ）- 標準クレーム

### Signature の生成方法

```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret_key
)
```

## このプロジェクトでの JWT 設定

### バックエンド設定 (`backend/config/initializers/jwt.rb`)

```ruby
JWT_SECRET = Rails.application.credentials.secret_key_base
JWT_EXPIRATION = 24.hours
JWT_ALGORITHM = 'HS256'
```

- **秘密鍵**: Rails の `secret_key_base` を使用（本番環境では適切に管理）
- **有効期限**: 24時間（86400秒）
- **アルゴリズム**: HS256（対称鍵暗号）

## JWT の生成フロー

### 1. ユーザー登録・ログイン

```ruby
# backend/app/models/user.rb
def generate_jwt
  payload = {
    user_id: id,
    exp: (Time.current + JWT_EXPIRATION).to_i
  }
  JWT.encode(payload, JWT_SECRET, JWT_ALGORITHM)
end
```

### 2. トークンの返却

```ruby
# backend/app/controllers/users_controller.rb (signup)
# backend/app/controllers/sessions_controller.rb (login)
render json: {
  user: { id: user.id, email: user.email, created_at: user.created_at },
  token: token
}, status: :created
```

### 3. フロントエンドでの保存

```typescript
// frontend/lib/auth.ts
export function setToken(token: string): void {
  if (!hasWindow()) return;
  localStorage.setItem(TOKEN_KEY, token);
}
```

## JWT の検証フロー

### 1. フロントエンドからのリクエスト

```typescript
// frontend/lib/auth.ts
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
```

リクエストヘッダーの例:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. バックエンドでの検証

```ruby
# backend/app/controllers/concerns/authenticable.rb
def authenticate_request!
  header = request.headers['Authorization']
  token = header.split(' ').last if header

  begin
    @current_user = User.decode_jwt(token)
  rescue JWT::DecodeError, ActiveRecord::RecordNotFound
    render json: { error: '認証に失敗しました' }, status: :unauthorized
  end
end
```

### 3. トークンのデコードと検証

```ruby
# backend/app/models/user.rb
def self.decode_jwt(token)
  decoded = JWT.decode(token, JWT_SECRET, true, { algorithm: JWT_ALGORITHM })
  find(decoded[0]['user_id'])
end
```

`JWT.decode` は以下をチェック:
- ✅ 署名が正しいか（改ざんされていないか）
- ✅ 有効期限が切れていないか
- ✅ アルゴリズムが一致するか

## JWT のライフサイクル

```
1. ユーザー登録/ログイン
   ↓
2. サーバーが JWT を生成
   ↓
3. クライアントが localStorage に保存
   ↓
4. API リクエストごとに Authorization ヘッダーに含める
   ↓
5. サーバーが JWT を検証
   ↓
6. 有効なら current_user にユーザー情報をセット
   ↓
7. 24時間後、トークンが自動的に期限切れ
   ↓
8. 期限切れの場合は再ログイン
```

## JWT のメリット

### ✅ ステートレス
- サーバー側でセッション情報を保持する必要がない
- 水平スケーリングが容易（どのサーバーでも検証可能）

### ✅ 自己完結型
- トークン自体にユーザー情報が含まれる
- データベースへの問い合わせ回数を削減できる（必要に応じて）

### ✅ モバイルフレンドリー
- Cookie に依存しないため、モバイルアプリでも使いやすい

### ✅ クロスドメイン対応
- CORS 設定で異なるドメイン間でも認証可能

## JWT のデメリットと対策

### ❌ トークンの無効化が困難
**問題**: JWT は自己完結型なので、発行後にサーバー側から無効化できない

**対策**:
- 短い有効期限（このプロジェクトでは24時間）
- トークンブラックリストの実装（Issue #6）
- リフレッシュトークンの導入（Issue #5）

### ❌ トークンサイズが大きい
**問題**: Cookie ベースのセッション ID よりもデータ量が多い

**対策**:
- ペイロードに必要最小限の情報のみ含める
- このプロジェクトでは `user_id` と `exp` のみ

### ❌ XSS 攻撃のリスク
**問題**: localStorage に保存すると JavaScript からアクセス可能

**対策**:
- CSP (Content Security Policy) の設定
- HttpOnly Cookie の使用も検討可能（ただし CSRF 対策が必要）
- 入力値のサニタイゼーション

## セキュリティのベストプラクティス

### ✅ 強力な秘密鍵を使用
```ruby
# Rails の secret_key_base を使用
JWT_SECRET = Rails.application.credentials.secret_key_base
```

### ✅ 適切な有効期限を設定
```ruby
# 24時間で期限切れ
JWT_EXPIRATION = 24.hours
```

### ✅ HTTPS を使用
- 本番環境では必ず HTTPS を使用してトークンの盗聴を防ぐ

### ✅ トークンを URL に含めない
```
# ❌ 悪い例
https://example.com/api/users?token=xxx

# ✅ 良い例
Authorization: Bearer xxx
```

## デバッグ方法

### JWT のデコード（検証なし）

オンラインツール: [jwt.io](https://jwt.io)

または Rails console:
```ruby
require 'jwt'
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
decoded = JWT.decode(token, nil, false)
puts decoded
```

### トークンの内容確認

```bash
# Rails console で
docker compose exec back rails console
> token = "your_token_here"
> JWT.decode(token, JWT_SECRET, true, { algorithm: JWT_ALGORITHM })
```

### 有効期限の確認

```ruby
# Rails console で
> decoded = JWT.decode(token, JWT_SECRET, true, { algorithm: JWT_ALGORITHM })
> exp = decoded[0]['exp']
> Time.at(exp)
=> 2026-03-22 10:00:00 +0000
```

## 参考資料

- [JWT 公式サイト](https://jwt.io)
- [RFC 7519 - JSON Web Token](https://tools.ietf.org/html/rfc7519)
- [jwt gem ドキュメント](https://github.com/jwt/ruby-jwt)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
