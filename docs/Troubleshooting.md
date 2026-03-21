# トラブルシューティング

実装中に遭遇したエラーと解決方法をまとめました。同じエラーに遭遇した場合の参考にしてください。

## 目次

1. [データベース関連](#データベース関連)
2. [Rails エラー](#rails-エラー)
3. [TypeScript 型エラー](#typescript-型エラー)
4. [CORS エラー](#cors-エラー)
5. [Next.js 環境変数](#nextjs-環境変数)
6. [JWT トークン関連](#jwt-トークン関連)
7. [Docker 関連](#docker-関連)

---

## データベース関連

### エラー 1: データベース接続エラー

**エラーメッセージ**:
```
ActiveRecord::DatabaseConnectionError
```

**発生状況**:
Phase 4 のテスト時に発生

**原因**:
Docker コンテナが正しく起動していない、または DB との接続が切れている

**解決方法**:
```bash
# すべてのコンテナを停止して再起動
docker compose down
docker compose up -d
```

**学習ポイント**:
- Docker 環境では、コンテナの再起動で多くの問題が解決する
- `down` で完全に停止してから `up` するのが確実

---

### エラー 2: マイグレーション実行エラー（インデックス）

**エラーメッセージ**:
```
PG::UndefinedTable: ERROR: relation "users" does not exist
```

**発生状況**:
Phase 2 のマイグレーション実行時

**原因**:
`add_index` が `change` メソッドの外に記述されていた

**問題のコード**:
```ruby
class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.timestamps
    end
  end

  # ❌ ここに書くとエラー
  add_index :users, :email, unique: true
end
```

**修正後のコード**:
```ruby
class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.timestamps
    end

    # ✅ change メソッド内に配置
    add_index :users, :email, unique: true
  end
end
```

**学習ポイント**:
- マイグレーションのメソッドは `change` メソッド内に記述する
- `add_index` はテーブル作成後でないと実行できない

---

### エラー 3: メールアドレス重複エラー (422)

**エラーメッセージ**:
```
422 Unprocessable Content
```

**Rails ログ**:
```
User Exists? (3.4ms)  SELECT 1 AS one FROM "users" WHERE LOWER("users"."email") = LOWER('test@example.com') LIMIT 1
TRANSACTION (0.2ms)  ROLLBACK
```

**発生状況**:
Phase 11 のテスト時、同じメールアドレスで再度サインアップしようとした

**原因**:
Phase 4/5 のテストで既に `test@example.com` が登録されていた

**解決方法**:

方法 1: 別のメールアドレスを使用
```
test2@example.com, test3@example.com など
```

方法 2: 既存のユーザーを削除（推奨）
```bash
docker compose exec back rails runner "User.destroy_all"
```

**学習ポイント**:
- メールアドレスには `unique: true` 制約がある
- テスト環境では定期的にデータをクリアすると便利

---

## Rails エラー

### エラー 4: Concern の構文エラー

**エラーメッセージ**:
```
ArgumentError: wrong number of arguments (given 0, expected 1)
```

**発生場所**:
`backend/app/controllers/concerns/authenticable.rb:4`

**問題のコード**:
```ruby
module Authenticable
  extend ActiveSupport::Concern

  include do  # ❌ 間違い
    before_action :authenticate_request!, only: []
    attr_reader :current_user
  end
end
```

**修正後のコード**:
```ruby
module Authenticable
  extend ActiveSupport::Concern

  included do  # ✅ 正しい
    before_action :authenticate_request!, only: []
    attr_reader :current_user
  end
end
```

**学習ポイント**:
- Rails の Concern では `included do` を使用する
- `include` はモジュールを読み込むメソッド、`included` はコールバック

---

### エラー 5: I18n ロケールエラー

**エラーメッセージ**:
```
I18n::InvalidLocale: :ja is not a valid locale
```

**発生状況**:
Phase 4 のユーザー登録でバリデーションエラーを返す際

**原因**:
`config/application.rb` で `config.i18n.default_locale = :ja` と設定されているが、日本語のロケールファイルがない

**解決方法**:
`backend/config/application.rb` (line 35) を修正:

```ruby
# 変更前
config.i18n.default_locale = :ja

# 変更後
config.i18n.default_locale = :en
```

**学習ポイント**:
- Rails のエラーメッセージは I18n でローカライズされる
- デフォルトロケールのファイルが存在しない場合はエラーになる

---

### エラー 6: 名前空間エラー

**エラーメッセージ**:
```
NameError: uninitialized constant App::ApplicationController
```

**発生場所**:
`backend/app/controllers/sessions_controller.rb:1`

**問題のコード**:
```ruby
class SessionsController < App::ApplicationController  # ❌
```

**修正後のコード**:
```ruby
class SessionsController < ApplicationController  # ✅
```

**原因**:
Rails のコントローラーは `App::` 名前空間を使わない

**学習ポイント**:
- Rails のコントローラーは通常、名前空間なしで `ApplicationController` を継承する
- モジュール名（config/application.rb の `module App`）と混同しないこと

---

## TypeScript 型エラー

### エラー 7: fetch headers の型エラー

**エラーメッセージ**:
```
Type '{ Authorization: string; } | {}' is not assignable to type 'HeadersInit'
```

**発生場所**:
`frontend/lib/auth.ts` の `fetchWithAuth` 関数

**問題のコード**:
```typescript
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  ...options.headers,  // ❌ 型が合わない
};

if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

**修正後のコード**:
```typescript
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
```

**学習ポイント**:
- TypeScript では型を明示的に指定すると、かえって型エラーが発生することがある
- スプレッド構文で直接オブジェクトを構築する方が型推論がうまく働く
- 条件付きスプレッド `...(条件 ? obj : {})` は便利なパターン

---

## CORS エラー

### エラー 8: CORS ポリシー違反

**エラーメッセージ**:
```
Access to fetch at 'http://localhost:3003/login' from origin 'http://localhost:8000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**発生状況**:
Phase 9 でログイン画面からログインを試みた際

**原因**:
バックエンドの CORS 設定に `localhost:8000` が含まれていない

**解決方法**:

`backend/.env` を修正:
```env
# 変更前
CORS_ALLOWED_ORIGINS=localhost:3000,127.0.0.1:3000

# 変更後
CORS_ALLOWED_ORIGINS=localhost:3000,127.0.0.1:3000,localhost:8000,127.0.0.1:8000
```

バックエンドコンテナを再起動:
```bash
docker compose restart back
```

**学習ポイント**:
- CORS エラーはブラウザのセキュリティ機能
- 環境変数を変更した場合は、コンテナの再起動が必要
- `localhost` と `127.0.0.1` は異なる origin として扱われる

---

## Next.js 環境変数

### エラー 9: 環境変数が undefined

**症状**:
`process.env.API_URL` が Client Component で `undefined` になる

**発生状況**:
Phase 10 でメモページから API を呼び出そうとした際

**原因**:
Next.js の Client Component では `NEXT_PUBLIC_` プレフィックスがない環境変数はアクセスできない

**解決方法**:

`docker-compose.yml` を修正:
```yaml
# 変更前
environment:
  - API_URL=http://localhost:3003

# 変更後
environment:
  - NEXT_PUBLIC_API_URL=http://localhost:3003
```

コード内も修正:
```typescript
// 変更前
const API_URL = process.env.API_URL || "http://localhost:3003";

// 変更後
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
```

フロントエンドコンテナを再起動:
```bash
docker compose restart front
```

**学習ポイント**:
- **Server Component**: すべての環境変数にアクセス可能
- **Client Component**: `NEXT_PUBLIC_` で始まる環境変数のみアクセス可能
- これはセキュリティのための仕様（クライアントに秘密情報を送らないため）

---

## JWT トークン関連

### エラー 10: トークン期限切れ (401)

**エラーメッセージ**:
```
401 Unauthorized
{ error: "認証に失敗しました" }
```

**症状**:
正しいトークン形式なのに認証エラーになる

**原因**:
JWT の有効期限（24時間）が切れている

**確認方法**:
ブラウザのコンソールで:
```javascript
const token = localStorage.getItem('auth_token');
console.log(token);
```

[jwt.io](https://jwt.io) でデコードして `exp` (有効期限) を確認

**解決方法**:
```javascript
// ブラウザのコンソールで
localStorage.removeItem('auth_token');

// その後、再度ログイン
```

**学習ポイント**:
- JWT は自己完結型なので、サーバー側から無効化できない
- 有効期限が切れたら再ログインが必要
- 今後の改善: リフレッシュトークンの実装（Issue #5）

---

### エラー 11: トークンの検証エラー

**エラーメッセージ**:
```
JWT::DecodeError: Signature verification failed
```

**考えられる原因**:

1. **秘密鍵の不一致**
   ```ruby
   # 確認: Rails console で
   puts JWT_SECRET
   ```

2. **トークンの改ざん**
   - トークンが手動で編集された

3. **アルゴリズムの不一致**
   ```ruby
   # 確認
   puts JWT_ALGORITHM  # "HS256" であるべき
   ```

**解決方法**:
- 新しいトークンを生成（再ログイン）
- 秘密鍵とアルゴリズムが正しいことを確認

---

## Docker 関連

### エラー 12: lightningcss エラー

**エラーメッセージ**:
```
Error: Cannot find module '../lightningcss.linux-x64-gnu.node'
```

**発生状況**:
フロントエンドコンテナ起動時

**原因**:
macOS でインストールした node_modules が Linux Docker コンテナと互換性がない

**解決方法**:

`docker-compose.yml` を修正:
```yaml
front:
  build:
    context: ./frontend/
    dockerfile: Dockerfile
  volumes:
    - ./frontend:/app
    - /app/node_modules  # ← 追加: コンテナ内の node_modules を保護
  working_dir: /app
  command: sh -c "yarn install && yarn dev -p 4000"  # ← 起動時に install
```

コンテナを再ビルド:
```bash
docker compose down
docker compose up -d --build
```

**学習ポイント**:
- バイナリを含むパッケージは、OS ごとに異なるバージョンが必要
- Docker ボリュームマウントで `/app/node_modules` を除外すると、コンテナ内で生成された node_modules が保持される
- 起動時に `yarn install` を実行することで、常に正しいバージョンがインストールされる

---

## デバッグのコツ

### Rails のログを見る

```bash
# リアルタイムでログを表示
docker compose logs -f back

# 最新の50行を表示
docker compose logs back --tail 50
```

### Next.js のログを見る

```bash
docker compose logs -f front
```

### Rails Console でデバッグ

```bash
docker compose exec back rails console

# ユーザー一覧
> User.all

# トークンのデコード
> token = "eyJhbGciOiJIUzI1NiJ9..."
> JWT.decode(token, JWT_SECRET, true, { algorithm: JWT_ALGORITHM })

# ユーザーの削除
> User.destroy_all
```

### ブラウザの開発者ツール

- **Network タブ**: API リクエスト・レスポンスの確認
- **Console タブ**: JavaScript エラーの確認
- **Application タブ > Local Storage**: トークンの確認・削除

### curl でテスト

```bash
# ログイン
curl -X POST http://localhost:3003/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq .

# トークンを使ってメモ取得
curl -X GET http://localhost:3003/memos \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  | jq .
```

---

## よくある質問

### Q: ログアウトしてもトークンが有効なのはなぜ?

A: 現在の実装では、ログアウトはクライアント側でトークンを削除するだけです。JWT は自己完結型なので、サーバー側からは無効化できません。トークンブラックリストの実装（Issue #6）で改善できます。

### Q: トークンを安全に保存するには?

A: 現在は localStorage に保存していますが、XSS 攻撃のリスクがあります。代替案:
- HttpOnly Cookie（CSRF 対策も必要）
- セッションストレージ（タブを閉じると消える）
- メモリのみ（リロードで消える）

トレードオフを理解した上で、プロジェクトの要件に応じて選択してください。

### Q: パスワードの最小文字数を変更するには?

A: `backend/app/models/user.rb` の validates を修正:
```ruby
validates :password, length: { minimum: 8 }, if: :password_digest_changed?
```

---

## まとめ

エラーは学習の機会です。このドキュメントに記載されたエラーと解決方法を理解することで、以下のスキルが身につきます:

- Docker 環境のトラブルシューティング
- Rails のデバッグ手法
- TypeScript の型システムの理解
- CORS の仕組み
- JWT のライフサイクル

新しいエラーに遭遇したら、このドキュメントに追加してください！
