# 実装ステップ詳細

JWT 認証機能の実装を11のフェーズに分けて段階的に進めました。各フェーズの詳細を記録します。

## Phase 1: バックエンド環境準備

### 実装内容

#### 1. bcrypt gem の有効化
**ファイル**: `backend/Gemfile` (line 15)

```ruby
# 変更前（コメントアウト状態）
# gem "bcrypt", "~> 3.1.7"

# 変更後
gem "bcrypt", "~> 3.1.7"
```

#### 2. bundle install

```bash
docker compose exec back bundle install
```

#### 3. JWT 設定ファイルの作成
**ファイル**: `backend/config/initializers/jwt.rb` (新規作成)

```ruby
JWT_SECRET = Rails.application.credentials.secret_key_base
JWT_EXPIRATION = 24.hours
JWT_ALGORITHM = 'HS256'
```

### 学習ポイント

- `bcrypt` は `has_secure_password` を使用するために必要
- Rails の initializers は起動時に読み込まれる
- `secret_key_base` は Rails が自動生成する秘密鍵

---

## Phase 2: User モデルとマイグレーション

### 実装内容

#### 1. User モデルの生成

```bash
docker compose exec back rails generate model User email:string password_digest:string
```

生成されたファイル:
- `backend/app/models/user.rb`
- `backend/db/migrate/[timestamp]_create_users.rb`

#### 2. マイグレーションファイルの修正
**ファイル**: `backend/db/migrate/[timestamp]_create_users.rb`

```ruby
class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest, null: false

      t.timestamps
    end

    # ⚠️ 重要: change メソッド内に配置
    add_index :users, :email, unique: true
  end
end
```

**エラーと修正**:
- 最初、`add_index` を `change` メソッドの外に配置してエラー
- `change` メソッド内に移動して解決

#### 3. User モデルの実装
**ファイル**: `backend/app/models/user.rb`

```ruby
class User < ApplicationRecord
  has_secure_password

  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :password, length: { minimum: 6 }, if: :password_digest_changed?

  before_save :downcase_email

  def generate_jwt
    payload = {
      user_id: id,
      exp: (Time.current + JWT_EXPIRATION).to_i
    }
    JWT.encode(payload, JWT_SECRET, JWT_ALGORITHM)
  end

  def self.decode_jwt(token)
    decoded = JWT.decode(token, JWT_SECRET, true, { algorithm: JWT_ALGORITHM })
    find(decoded[0]['user_id'])
  end

  private

  def downcase_email
    self.email = email.downcase
  end
end
```

#### 4. マイグレーションの実行

```bash
docker compose exec back rails db:migrate
```

### 学習ポイント

- `has_secure_password` は自動的に `password` と `password_confirmation` 仮想属性を追加
- `password_digest` カラムに bcrypt でハッシュ化されたパスワードが保存される
- `before_save` コールバックでメールアドレスを小文字に統一
- JWT の encode/decode メソッドをモデルに実装

---

## Phase 3: 認証 Concern 作成

### 実装内容

**ファイル**: `backend/app/controllers/concerns/authenticable.rb` (新規作成)

```ruby
module Authenticable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_request!, only: []
    attr_reader :current_user
  end

  private

  def authenticate_request!
    header = request.headers['Authorization']
    token = header.split(' ').last if header

    begin
      @current_user = User.decode_jwt(token)
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      render json: { error: '認証に失敗しました' }, status: :unauthorized
    end
  end
end
```

**エラーと修正**:
- 最初 `include do` と書いてしまい `ArgumentError`
- 正しくは `included do` (Rails Concern の DSL)

### 学習ポイント

- **Concern とは**: コントローラー間で共通のロジックを再利用可能にする仕組み
- `included do` ブロック内のコードは、このモジュールを include したクラスで実行される
- `attr_reader :current_user` で他のメソッドから `@current_user` にアクセス可能に
- `before_action` で認証が必要なアクションを指定可能

---

## Phase 4: ユーザー登録機能実装

### 実装内容

#### 1. UsersController の作成
**ファイル**: `backend/app/controllers/users_controller.rb` (新規作成)

```ruby
class UsersController < ApplicationController
  # POST /signup
  def create
    user = User.new(user_params)

    if user.save
      token = user.generate_jwt
      render json: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        token: token
      }, status: :created
    else
      render json: { errors: user.errors }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation)
  end
end
```

#### 2. ルーティングの追加
**ファイル**: `backend/config/routes.rb`

```ruby
Rails.application.routes.draw do
  post '/signup', to: 'users#create'
  # ...既存のルート
end
```

#### 3. I18n ロケール設定の修正
**ファイル**: `backend/config/application.rb` (line 35)

```ruby
# 変更前
config.i18n.default_locale = :ja

# 変更後
config.i18n.default_locale = :en
```

**エラーと修正**:
- 最初、`:ja` のままだと `I18n::InvalidLocale` エラー
- `:en` に変更して解決

### テスト方法

```bash
# 成功ケース
curl -X POST http://localhost:3003/signup \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "test@example.com",
      "password": "password123",
      "password_confirmation": "password123"
    }
  }'

# 失敗ケース（パスワード不一致）
curl -X POST http://localhost:3003/signup \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "test@example.com",
      "password": "password123",
      "password_confirmation": "different"
    }
  }'
```

### 学習ポイント

- **Strong Parameters**: `user_params` で許可するパラメータを明示的に指定
- `status: :created` は HTTP 201 を返す
- `user.errors` は ActiveModel::Errors オブジェクトで、JSON にシリアライズ可能

---

## Phase 5: ログイン機能実装

### 実装内容

#### 1. SessionsController の作成
**ファイル**: `backend/app/controllers/sessions_controller.rb` (新規作成)

```ruby
class SessionsController < ApplicationController
  include Authenticable

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
    # クライアント側でトークンを削除するだけなので、サーバー側では何もしない
    head :no_content
  end
end
```

**エラーと修正**:
- 最初 `class SessionsController < App::ApplicationController` と記述してエラー
- 正しくは `< ApplicationController` (名前空間不要)

#### 2. ルーティングの追加
**ファイル**: `backend/config/routes.rb`

```ruby
Rails.application.routes.draw do
  post '/signup', to: 'users#create'
  post '/login', to: 'sessions#create'
  get '/current_user', to: 'sessions#show'
  delete '/logout', to: 'sessions#destroy'
  # ...
end
```

### テスト方法

```bash
# 1. ログイン
curl -X POST http://localhost:3003/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# レスポンスからトークンを取得
# {"user":{...},"token":"eyJhbGciOiJIUzI1NiJ9..."}

# 2. トークンを使って現在のユーザー情報を取得
curl -X GET http://localhost:3003/current_user \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."

# 3. ログアウト
curl -X DELETE http://localhost:3003/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

### 学習ポイント

- `user&.authenticate(password)` は bcrypt によるパスワード検証
- `&.` は Safe Navigation Operator（user が nil の場合も安全）
- `head :no_content` は HTTP 204 No Content を返す（body なし）

---

## Phase 6: メモ API の認証必須化

### 実装内容

**ファイル**: `backend/app/controllers/memos_controller.rb` (line 2 に追加)

```ruby
class MemosController < ApplicationController
  include Authenticable
  before_action :authenticate_request!
  before_action :set_memo, only: %i[show update destroy]

  # ... 既存のアクション
end
```

### テスト方法

```bash
# トークンなしでアクセス → 401 Unauthorized
curl -X GET http://localhost:3003/memos

# トークンありでアクセス → 200 OK
curl -X GET http://localhost:3003/memos \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

### 学習ポイント

- `before_action :authenticate_request!` で全アクションに認証を適用
- Concern を include するだけでシンプルに実装
- `memo_params` などのプライベートメソッドも `authenticate_request!` の後に実行される

---

## Phase 7: フロントエンド認証ヘルパー作成

### 実装内容

**ファイル**: `frontend/lib/auth.ts` (新規作成)

```typescript
const TOKEN_KEY = "auth_token";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function getToken(): string | null {
  if (!hasWindow()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (!hasWindow()) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (!hasWindow()) return;
  localStorage.removeItem(TOKEN_KEY);
}

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

### 学習ポイント

- **hasWindow() ヘルパー**: SSR 環境で `window` が undefined の場合に対応
- **スプレッド構文**: 既存の headers を上書きせずにマージ
- TypeScript の `RequestInit` 型で型安全性を確保
- 条件付きスプレッドで、トークンがある場合のみ Authorization ヘッダーを追加

---

## Phase 8: 認証状態管理（AuthContext）実装

### 実装内容

**ファイル**: `frontend/contexts/AuthContext.tsx` (新規作成)

```typescript
"use client";

import { fetchWithAuth, getToken, removeToken, setToken } from "@/lib/auth";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

interface User {
  id: number;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    passwordConfirmation: string,
  ) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // アプリ起動時にトークンの検証
  useEffect(() => {
    const token = getToken();
    if (token) {
      (async () => {
        try {
          const res = await fetchWithAuth(`${API_URL}/current_user`);
          if (!res.ok) {
            removeToken();
            setUser(null);
          } else {
            const data = await res.json();
            setUser(data);
          }
        } catch (error) {
          console.error("Failed to fetch current user:", error);
          removeToken();
          setUser(null);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "ログインに失敗しました");
    }

    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
  }, []);

  const signup = useCallback(
    async (email: string, password: string, passwordConfirmation: string) => {
      const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: {
            email,
            password,
            password_confirmation: passwordConfirmation,
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "サインアップに失敗しました");
      }

      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

**ファイル**: `frontend/app/layout.tsx` に AuthProvider を追加

```typescript
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### 学習ポイント

- **React Context API**: グローバルな認証状態の管理
- **useCallback**: 関数の再生成を防ぎ、パフォーマンスを向上
- **カスタムフック useAuth**: Context の使用を簡潔に
- **自動ログイン**: アプリ起動時に localStorage のトークンを検証
- **TypeScript の型定義**: AuthContextType で型安全性を確保

---

## Phase 9: ログイン/サインアップ画面作成

### 実装内容

#### 1. ログインページ
**ファイル**: `frontend/app/login/page.tsx` (新規作成)

```typescript
"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // すでにログイン済みの場合はリダイレクト
  useEffect(() => {
    if (!loading && user) {
      router.push("/memos");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push("/memos");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-3xl font-bold mb-6">ログイン</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* フォームフィールド */}
      </form>

      <div className="mt-4 text-center">
        <Link href="/signup" className="text-blue-600 hover:underline">
          アカウントをお持ちでない方はこちら
        </Link>
      </div>
    </div>
  );
}
```

#### 2. サインアップページ
**ファイル**: `frontend/app/signup/page.tsx` (新規作成)

（同様の構造で signup 関数を使用）

### 学習ポイント

- **"use client" ディレクティブ**: Client Component として明示
- **useEffect でのリダイレクト**: すでにログイン済みならメモページへ
- **エラーハンドリング**: try-catch で非同期エラーをキャッチ
- **isSubmitting 状態**: ボタンの二重送信を防ぐ

---

## Phase 10: メモページの認証統合

### 実装内容

#### 1. メモ一覧ページ
**ファイル**: `frontend/app/memos/page.tsx`

Server Component から Client Component に変更し、認証チェックを追加:

```typescript
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
// ... 認証チェックと fetchWithAuth の使用
```

#### 2. メモ詳細ページ
**ファイル**: `frontend/app/memos/[id]/page.tsx`

同様に Client Component に変更し、`fetchWithAuth` でメモ取得:

```typescript
useEffect(() => {
  if (!user) return;

  (async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/memos/${id}`);
      if (!res.ok) {
        setError(true);
      } else {
        const data = await res.json();
        setMemo(data);
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  })();
}, [user, id]);
```

#### 3. メモ編集ページ
**ファイル**: `frontend/app/memos/[id]/edit/page.tsx`

認証チェックと `fetchWithAuth` を使用

#### 4. メモ新規作成ページ
**ファイル**: `frontend/app/memos/new/page.tsx`

認証チェックと `fetchWithAuth` を使用

#### 5. 削除ボタン
**ファイル**: `frontend/app/memos/[id]/DeleteButton.tsx`

`fetchWithAuth` で DELETE リクエスト

### 学習ポイント

- **Server Component vs Client Component**: 認証が必要な場合は Client Component
- **useEffect の依存配列**: user が null の場合は何もしない
- **NEXT_PUBLIC_ プレフィックス**: 環境変数をクライアント側で使用するために必須
- **docker-compose.yml の修正**: `API_URL` → `NEXT_PUBLIC_API_URL`

---

## Phase 11: 動作確認とテスト

### テストチェックリスト

#### ✅ ユーザー登録フロー
- サインアップページで新規ユーザー登録
- 登録後、自動的にログイン状態になる
- メモ一覧ページにリダイレクト

#### ✅ ログイン/ログアウト
- ログインページでログイン
- ログアウトボタンでログアウト
- ログアウト後、認証が必要なページにアクセスするとログインページにリダイレクト

#### ✅ 認証保護
- ログインしていない状態で `/memos` にアクセス → `/login` にリダイレクト
- トークンなしで API リクエスト → 401 エラー

#### ✅ メモ CRUD 操作
- ✅ メモ一覧表示
- ✅ メモ作成
- ✅ メモ詳細表示
- ✅ メモ編集
- ✅ メモ削除

#### ✅ エラーハンドリング
- 無効なメールアドレスでログイン → エラーメッセージ表示
- パスワード不一致でサインアップ → エラーメッセージ表示
- ネットワークエラー時のエラー表示

### トラブル時の対処

#### データベースのクリーンアップ
```bash
# 既存のユーザーを削除
docker compose exec back rails runner "User.destroy_all"
```

#### トークンのリセット
```javascript
// ブラウザのコンソールで
localStorage.removeItem('auth_token')
```

---

## まとめ

全11フェーズを通して、以下を実装しました:

- ✅ JWT 認証システム（バックエンド）
- ✅ 認証 API（signup, login, logout, current_user）
- ✅ メモ API の認証保護
- ✅ 認証状態管理（フロントエンド）
- ✅ ログイン/サインアップ UI
- ✅ 全メモページの認証統合

次のステップは [今後の拡張案](https://github.com/hchaki/rails-api-nextjs/issues) を参照してください。
