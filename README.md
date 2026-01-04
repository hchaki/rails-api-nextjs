# Rails API + Next.js プロジェクト

## 概要

Rails API バックエンドと Next.js フロントエンドを Docker Compose で統合した Web アプリケーション開発環境です。

## 技術スタック

### バックエンド

- Ruby 3.2.6
- Rails 8.1.1 (API モード)
- MySQL 8.0
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
- MySQL (永続化ボリューム使用)

## プロジェクト構成

```
.
├── backend/          # Rails API
│   ├── app/
│   ├── config/
│   ├── db/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   └── Gemfile
├── frontend/         # Next.js (TypeScript)
│   ├── app/
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
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

2. **バックエンドのセットアップ**

```bash
# Dockerイメージのビルド
docker compose build back

# データベースの作成
docker compose run --rm back rails db:create

# マイグレーション実行
docker compose run --rm back rails db:migrate
```

3. **フロントエンドのセットアップ**

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

- **フロントエンド**: http://localhost:8000
- **バックエンド API**: http://localhost:3003
- **MySQL**: localhost:3306

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

## データベース設定

### 開発環境

- データベース名: `llpp_db`
- ユーザー名: `user`
- パスワード: `password`
- ホスト: `db` (Docker 内部ネットワーク)

設定ファイル: `backend/config/database.yml`

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

## 参考資料

- [Rails API 開発ガイド](https://railsguides.jp/api_app.html)
- [Next.js ドキュメント](https://nextjs.org/docs)
- [Docker Compose ドキュメント](https://docs.docker.com/compose/)
- [参考記事](https://qiita.com/HERUESTA/items/a2b014b9995f0ef6cf08)
- [参考記事](https://qiita.com/miki-ymmt/items/31cbeb5ec63bb48f1a6b)

## ライセンス

このプロジェクトは、MIT ライセンスの下でライセンスされています。

## 更新履歴

- 2026/01/04: Docker 環境のセットアップ完了、README 大幅更新
- 2026/01/02: プロジェクト初期作成
