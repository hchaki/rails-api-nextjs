# Rails API + Next.js JWT 認証 学習ドキュメント

このドキュメントは、Rails API モード + Next.js プロジェクトに JWT 認証機能を実装する過程で学んだことをまとめたものです。

## 📚 目次

1. [JWT 認証ガイド](./JWT-Authentication-Guide.md) - JWT 認証の仕組みと実装方法
2. [実装ステップ](./Implementation-Steps.md) - Phase 1-11 の詳細な実装手順
3. [トラブルシューティング](./Troubleshooting.md) - 遭遇したエラーと解決方法
4. [学習ポイント](./Learning-Points.md) - 今回の学習で得た知識とベストプラクティス

## 🎯 プロジェクト概要

- **バックエンド**: Rails 8.1.1 (API mode)
- **フロントエンド**: Next.js 15 (App Router)
- **認証方式**: JWT (JSON Web Token)
- **データベース**: PostgreSQL 16
- **コンテナ**: Docker Compose

## ✅ 実装完了機能

### バックエンド
- ✅ JWT トークンの生成・検証機能
- ✅ ユーザー登録 API (`POST /signup`)
- ✅ ログイン API (`POST /login`)
- ✅ 現在のユーザー取得 API (`GET /current_user`)
- ✅ メモ API の認証保護 (`before_action :authenticate_request!`)
- ✅ CORS 設定

### フロントエンド
- ✅ 認証状態管理 (AuthContext)
- ✅ ログイン画面 (`/login`)
- ✅ サインアップ画面 (`/signup`)
- ✅ 全メモページの認証統合 (`/memos`, `/memos/new`, `/memos/:id`, `/memos/:id/edit`)
- ✅ 自動ログイン (localStorage によるトークン永続化)
- ✅ 認証ヘルパー関数 (`fetchWithAuth`)

## 🔑 主要な技術コンセプト

### JWT 認証
- **ステートレス認証**: サーバー側でセッション情報を保持しない
- **トークンベース**: クライアントが JWT トークンを保持し、各リクエストに含める
- **有効期限**: 24時間で自動的に期限切れ
- **署名検証**: HS256 アルゴリズムで改ざん防止

### Rails の設計パターン
- **Concern**: 認証ロジックを再利用可能なモジュールとして分離
- **has_secure_password**: bcrypt によるパスワードハッシュ化
- **Strong Parameters**: パラメータの明示的な許可

### Next.js の設計パターン
- **Client Component vs Server Component**: 認証が必要なページは Client Component に
- **React Context API**: グローバルな認証状態の管理
- **カスタムフック**: データ取得ロジックの抽象化 (`useLoadContent`)
- **環境変数**: `NEXT_PUBLIC_` プレフィックスでクライアント側からアクセス可能に

## 📈 学習の進め方

このプロジェクトは以下の11フェーズで段階的に実装されました:

1. **Phase 1**: バックエンド環境準備
2. **Phase 2**: User モデルとマイグレーション
3. **Phase 3**: 認証 Concern 作成
4. **Phase 4**: ユーザー登録機能
5. **Phase 5**: ログイン機能
6. **Phase 6**: メモ API の認証必須化
7. **Phase 7**: フロントエンド認証ヘルパー
8. **Phase 8**: 認証状態管理 (AuthContext)
9. **Phase 9**: ログイン/サインアップ画面
10. **Phase 10**: メモページの認証統合
11. **Phase 11**: 動作確認とテスト

詳細は [実装ステップ](./Implementation-Steps.md) を参照してください。

## 🚀 今後の拡張案

以下の機能拡張が Issue として登録されています:

1. [ユーザーとメモの関連付け](https://github.com/hchaki/rails-api-nextjs/issues/2)
2. [プロフィール編集機能](https://github.com/hchaki/rails-api-nextjs/issues/3)
3. [パスワードリセット機能](https://github.com/hchaki/rails-api-nextjs/issues/4)
4. [トークンのリフレッシュ機能](https://github.com/hchaki/rails-api-nextjs/issues/5)
5. [ログアウト時のサーバー側処理](https://github.com/hchaki/rails-api-nextjs/issues/6)

## 🤝 コントリビューション

学習目的のプロジェクトですが、改善提案や質問は Issue で受け付けています。

## 📝 ライセンス

このプロジェクトは学習目的で作成されています。
