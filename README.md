# Rails API + Next.js プロジェクト

## 概要

Rails API バックエンドと Next.js フロントエンドを Docker Compose で統合した Web アプリケーション開発環境です。

## 実装済み機能

- ✅ メモの一覧表示（Server Component で SSR）
- ✅ メモの詳細表示（Server Component で SSR）
- ✅ メモの新規作成（Client Component で CSR）
- ✅ メモの編集（Client Component で CSR）
- ✅ メモの削除（Client Component で CSR、確認ダイアログ付き）
- ✅ 完全な CRUD 操作
- ✅ CORS 設定による API アクセス制御
- ✅ 環境変数による設定管理
- ✅ Docker 内部ネットワークによるコンテナ間通信

## 技術スタック

### バックエンド

- Ruby 3.2.6
- Rails 8.1.1 (API モード)
- PostgreSQL 16
- Puma

### フロントエンド

- Next.js 16.1.1
- React 19.2.3
- TypeScript
- Tailwind CSS
- Node.js
- Yarn

### インフラ

- Docker & Docker Compose
- PostgreSQL (永続化ボリューム使用)

## プロジェクト構成

```
.
├── backend/          # Rails API
│   ├── app/
│   │   ├── controllers/  # MemosController など
│   │   └── models/       # Memo モデルなど
│   ├── config/
│   │   ├── database.yml
│   │   └── initializers/cors.rb
│   ├── db/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── Gemfile
│   ├── .env.example      # 環境変数のサンプル
│   └── .env              # 環境変数（gitignore）
├── frontend/         # Next.js (TypeScript)
│   ├── app/
│   │   ├── memos/        # メモ機能のページ
│   │   └── page.tsx
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.local.example  # 環境変数のサンプル
│   └── .env.local          # 環境変数（gitignore）
├── docker-compose.yml
├── .gitignore
└── README.md
```

## セットアップ

### 前提条件

- Docker Desktop がインストールされていること
- Git がインストールされていること

### 初回セットアップ手順

1. **リポジトリのクローン**

```bash
git clone <repository-url>
cd rails_api_nextjs
```

2. **環境変数ファイルの作成**

バックエンドとフロントエンドの環境変数ファイルをセットアップします：

```bash
# バックエンド: .env ファイルを作成
cp backend/.env.example backend/.env

# フロントエンド: .env.local ファイルを作成
cp frontend/.env.local.example frontend/.env.local
```

**重要**: 本番環境やステージング環境では、これらのファイルを適切な値で編集してください。

**環境変数の説明**:
- `backend/.env`
  - `CORS_ALLOWED_ORIGINS`: ブラウザからのアクセスを許可するオリジン（カンマ区切り）
- `frontend/.env.local`
  - `NEXT_PUBLIC_API_URL`: Client Component からアクセスする API の URL

3. **バックエンドのセットアップ**

```bash
# Dockerイメージのビルド
docker compose build back

# データベースの作成
docker compose run --rm back rails db:create

# マイグレーション実行
docker compose run --rm back rails db:migrate
```

4. **フロントエンドのセットアップ**

```bash
# Dockerイメージのビルド
docker compose build front

# 依存パッケージのインストール（初回のみ、通常は不要）
# docker compose run --rm front yarn install
```

**注意**: フロントエンドの依存パッケージは既にインストール済みです。`node_modules` が存在しない場合のみ実行してください。

## 使い方

### 開発サーバーの起動

全サービスを一括起動：

```bash
docker compose up
```

バックグラウンドで起動：

```bash
docker compose up -d
```

### アクセス先

- **フロントエンド (トップ)**: http://localhost:8000
- **メモ一覧**: http://localhost:8000/memos
- **メモ詳細**: http://localhost:8000/memos/:id
- **メモ作成**: http://localhost:8000/memos/new
- **メモ編集**: http://localhost:8000/memos/:id/edit
- **バックエンド API**: http://localhost:3003
  - メモ一覧 API: `GET /memos`
  - メモ詳細 API: `GET /memos/:id`
  - メモ作成 API: `POST /memos`
  - メモ更新 API: `PUT /memos/:id` または `PATCH /memos/:id`
  - メモ削除 API: `DELETE /memos/:id`
- **PostgreSQL**: localhost:5432

### 個別のサービス起動

バックエンドのみ：

```bash
docker compose up back
```

フロントエンドのみ：

```bash
docker compose up front
```

### コンテナ内でコマンド実行

Rails コンソール：

```bash
docker compose run --rm back rails console
```

マイグレーション作成：

```bash
docker compose run --rm back rails g migration CreateUsers
```

Yarn コマンド実行：

```bash
docker compose run --rm front yarn add <package-name>
```

### サービスの停止

```bash
docker compose down
```

データベースも含めて完全に削除：

```bash
docker compose down -v
```

## 環境変数の設定

### バックエンド環境変数 (`backend/.env`)

| 変数名 | 説明 | デフォルト値 | 例 |
|--------|------|-------------|-----|
| `CORS_ALLOWED_ORIGINS` | CORS で許可するオリジン（カンマ区切り） | `localhost:8000,127.0.0.1:8000` | `example.com,sub.example.com` |

### フロントエンド環境変数 (`frontend/.env.local`)

| 変数名 | 説明 | デフォルト値 | 例 |
|--------|------|-------------|-----|
| `NEXT_PUBLIC_API_URL` | Client Component から API にアクセスする URL | `http://localhost:3003` | `https://api.example.com` |

**注意事項**:
- `NEXT_PUBLIC_` プレフィックスは、Next.js でブラウザ側にも公開される環境変数です
- Server Component（SSR）では `docker-compose.yml` の `API_URL` 環境変数を使用して Docker 内部ネットワーク経由でアクセスします
- `.env` と `.env.local` ファイルは `.gitignore` に含まれており、リポジトリには含まれません
- 本番環境では `.env.example` / `.env.local.example` を参考に適切な値を設定してください

## データベース設定

### 開発環境

- データベース: PostgreSQL 16
- データベース名: `llpp_db`
- ユーザー名: `user`
- パスワード: `password`
- ホスト: `db` (Docker 内部ネットワーク)
- ポート: 5432

設定ファイル: [backend/config/database.yml](backend/config/database.yml)

### 本番環境

本番環境では環境変数 `DATABASE_URL` を使用してPostgreSQLに接続します。
Neon、Render.com、Heroku などのマネージドデータベースサービスで提供される接続文字列をそのまま使用できます。

## トラブルシューティング

### ポートが既に使用されている場合

`docker-compose.yml` のポート設定を変更してください：

```yaml
services:
  back:
    ports:
      - "3003:3000" # 左側を変更
  front:
    ports:
      - "8000:4000" # 左側を変更
```

### データベース接続エラー

1. DB コンテナが起動しているか確認：

```bash
docker compose ps
```

2. データベースを再作成：

```bash
docker compose down -v
docker compose up -d db
docker compose run --rm back rails db:create
```

### Docker イメージの再ビルド

キャッシュを使わずに完全再ビルド：

```bash
docker compose build --no-cache
```

## 開発のヒント

### ログの確認

```bash
# 全サービスのログ
docker compose logs -f

# 特定サービスのログ
docker compose logs -f back
docker compose logs -f front
```

### コンテナに入る

```bash
# バックエンド
docker compose exec back bash

# フロントエンド
docker compose exec front sh
```

### Gemfile / package.json 更新後

依存関係を追加した場合は、イメージの再ビルドが必要です：

```bash
docker compose build back  # Gemfile更新時
docker compose build front # package.json更新時
```

## デプロイ

このプロジェクトは **Vercel (フロントエンド) + Render.com (バックエンド) + Neon (データベース)** の構成で無料デプロイが可能です。

### 推奨デプロイ構成

| サービス | プラットフォーム | プラン | 月額費用 |
|---------|-----------------|--------|---------|
| Next.js | Vercel | Hobby (無料) | $0 |
| Rails API | Render.com | Web Service (無料) | $0 |
| PostgreSQL | Neon | Free Tier | $0 |

**合計: 完全無料** 🎉

### デプロイ手順（詳細版）

このセクションでは、実際のデプロイで使用した設定例を示します。

#### 1. Neon でデータベースを作成

1. [Neon](https://neon.tech/) にアクセスしてGitHubアカウントでサインイン
2. 「Create a project」をクリック
3. プロジェクト名を入力（例: `rails-nextjs-db`）
4. リージョンを選択（Asia Pacific推奨）
5. 「Create project」をクリック
6. **Connection string** をコピー（後で使用）
   - 形式: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`
   - 例: `postgresql://user:pass123@ep-cool-forest-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

**Neon設定例:**
```
Project name: rails-nextjs-db
Region: Asia Pacific (Singapore) - AWS
Database name: neondb (デフォルト)
```

#### 2. Render.com で Rails API をデプロイ

1. [Render.com](https://render.com/) にGitHubアカウントでサインイン
2. 「New +」→「Web Service」を選択
3. GitHub リポジトリを接続
   - 「Configure account」でリポジトリへのアクセス権限を付与
4. 以下の設定を入力：

**基本設定:**
| 項目 | 設定値 |
|------|--------|
| Name | `rails-api-nextjs` (または任意の名前) |
| Region | `Singapore` (Neonと同じリージョン推奨) |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | `Docker` (Dockerfileを使用) |
| Instance Type | `Free` |

**重要**: Dockerfileがあるため、Runtime は **Docker** を選択してください。

**環境変数の設定:**

「Environment」タブで以下を設定：

| Key | Value | 説明 |
|-----|-------|------|
| `RAILS_ENV` | `production` | Rails環境 |
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | Neonからコピーした接続文字列 |
| `SECRET_KEY_BASE` | `rails secret` で生成した64文字のランダム文字列 | Railsのセッション暗号化キー |
| `RAILS_MASTER_KEY` | `backend/config/master.key` の内容 | Rails credentials暗号化キー |
| `CORS_ALLOWED_ORIGINS` | `localhost:8000,127.0.0.1:8000` | 初期値（後でVercel URLを追加） |

**SECRET_KEY_BASEの生成方法:**
```bash
# ローカルで実行
docker compose run --rm back bundle exec rails secret
# または
docker compose run --rm back rails secret
```

**RAILS_MASTER_KEYの確認方法:**
```bash
cat backend/config/master.key
```

5. 「Create Web Service」をクリック
6. デプロイが完了するまで待つ（5-10分程度）
7. デプロイ完了後、Render.comが提供するURLをメモ
   - 例: `https://rails-api-nextjs.onrender.com`

**トラブルシューティング（Render.com）:**

もしデプロイ時にエラーが発生した場合:

1. **Gemfile.lockのmysql2エラー**:
   ```bash
   docker compose run --rm back bundle install
   git add backend/Gemfile.lock
   git commit -m "fix: update Gemfile.lock"
   git push
   ```

2. **Host Authorizationエラー**:
   - `backend/config/environments/production.rb` に以下を追加:
   ```ruby
   config.hosts << "your-app-name.onrender.com"
   config.hosts << ENV["RENDER_EXTERNAL_HOSTNAME"] if ENV["RENDER_EXTERNAL_HOSTNAME"].present?
   ```

3. **Database Migration失敗**:
   - `backend/entrypoint.sh` でマイグレーションが自動実行されます
   - ログで `Running database migrations...` を確認

#### 3. Vercel で Next.js をデプロイ

1. [Vercel](https://vercel.com/) にGitHubアカウントでサインイン
2. 「Add New...」→「Project」を選択
3. GitHub リポジトリをインポート
   - リポジトリが表示されない場合は「Adjust GitHub App Permissions」から権限を付与
4. 「Import」をクリック後、以下の設定を入力：

**プロジェクト設定:**
| 項目 | 設定値 |
|------|--------|
| Project Name | `rails-api-nextjs` (または任意) |
| Framework Preset | `Next.js` (自動検出) |
| Root Directory | `frontend` ← **重要！必ず設定** |
| Build Command | デフォルト（自動） |
| Output Directory | デフォルト（自動） |
| Install Command | デフォルト（自動） |

**Root Directoryの設定方法:**
- 「Configure Project」セクションを見つける
- 「Root Directory」の横の「Edit」をクリック
- `frontend` と入力
- 「Continue」をクリック

**環境変数の設定:**

「Environment Variables」セクションで以下を追加：

| Key | Value | 説明 |
|-----|-------|------|
| `NEXT_PUBLIC_API_URL` | `https://rails-api-nextjs.onrender.com` | Client Component用API URL |
| `API_URL` | `https://rails-api-nextjs.onrender.com` | Server Component用API URL |

**重要:**
- `NEXT_PUBLIC_` プレフィックスは必須（ブラウザで使用するため）
- すべての環境（Production、Preview、Development）にチェックを入れる

5. 「Deploy」をクリック
6. デプロイ完了後、Vercel URLをメモ
   - 例: `https://rails-api-nextjs.vercel.app`

**Vercel設定例:**
```
Project: rails-api-nextjs
Domain: rails-api-nextjs.vercel.app
Preview URL: rails-api-nextjs-git-main-username.vercel.app
Root Directory: frontend
Environment Variables:
  - NEXT_PUBLIC_API_URL=https://rails-api-nextjs.onrender.com
  - API_URL=https://rails-api-nextjs.onrender.com
```

#### 4. CORS設定の更新（重要）

Vercel デプロイ完了後、Rails APIにVercel URLを許可する必要があります：

1. [Render.com Dashboard](https://dashboard.render.com/) を開く
2. デプロイしたWeb Serviceを選択
3. 左側メニューの **「Environment」** をクリック
4. `CORS_ALLOWED_ORIGINS` の値を更新:
   ```
   rails-api-nextjs.vercel.app,rails-api-nextjs-git-main-username.vercel.app
   ```
   - カンマ区切りで複数ドメイン対応
   - `https://` は不要（ドメイン名のみ）
   - Vercelの本番URLとプレビューURL両方を追加推奨

5. 「Save Changes」をクリック
6. 自動的に再デプロイされます（1-2分）

**CORS設定例:**
```env
CORS_ALLOWED_ORIGINS=rails-api-nextjs.vercel.app,rails-api-nextjs-git-main-username.vercel.app,localhost:8000,127.0.0.1:8000
```

### デプロイ後の確認

1. Vercel URL にアクセス
2. メモの作成・編集・削除が正常に動作することを確認
3. 初回は Render.com がスリープから復帰するため、読み込みに時間がかかる場合があります（30秒程度）

### 本番環境の制限事項

**無料プランの制限**:
- **Render.com**:
  - 非アクティブ時に自動スリープ（15分後）
  - 月750時間の稼働時間制限
  - スリープ解除に30秒程度かかる
- **Vercel**:
  - 月100GB の帯域幅制限
  - 個人・非商用プロジェクトのみ
- **Neon**:
  - 0.5GB ストレージ
  - 月間コンピュート時間制限あり

### トラブルシューティング (デプロイ)

#### Rails のマイグレーションエラー

Render.com のダッシュボードでログを確認：
```bash
# Build Command に以下を追加
bundle exec rails db:create RAILS_ENV=production || true
bundle exec rails db:migrate RAILS_ENV=production
```

#### CORS エラー

1. Render.com の `CORS_ALLOWED_ORIGINS` を確認
2. `https://` を含む完全なドメイン名を指定
3. カンマ区切りで複数ドメイン対応可能

#### API 接続エラー

1. Vercel の環境変数 `NEXT_PUBLIC_API_URL` が正しいか確認
2. Render.com の URL が `https://` で始まっているか確認
3. Render.com がスリープ中の場合は30秒待つ

## 参考資料

### 公式ドキュメント
- [Rails API 開発ガイド](https://railsguides.jp/api_app.html)
- [Next.js ドキュメント](https://nextjs.org/docs)
- [Docker Compose ドキュメント](https://docs.docker.com/compose/)

### デプロイプラットフォーム
- [Vercel ドキュメント](https://vercel.com/docs)
- [Render.com ドキュメント](https://render.com/docs)
- [Neon ドキュメント](https://neon.tech/docs/introduction)

### 参考記事
- [Rails + Render.com デプロイ方法](https://qiita.com/tomada/items/8be6e0df7ad74ef59207)
- [Docker開発環境構築](https://qiita.com/HERUESTA/items/a2b014b9995f0ef6cf08)
- [Rails API + Next.js 連携](https://qiita.com/miki-ymmt/items/31cbeb5ec63bb48f1a6b)

## ライセンス

このプロジェクトは、MIT ライセンスの下でライセンスされています。

## 更新履歴

- 2026/01/10: PostgreSQL移行完了、デプロイガイド追加
- 2026/01/05: 環境変数の整理、メモ CRUD 機能実装、CORS 設定
- 2026/01/04: Docker 環境のセットアップ完了、README 大幅更新
- 2026/01/02: プロジェクト初期作成
