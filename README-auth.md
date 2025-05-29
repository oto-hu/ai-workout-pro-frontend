# Phase 5: Authentication & History Setup Guide

## 🔧 環境変数の設定

### 1. 環境変数ファイルの作成
```bash
cp .env.example .env.local
```

### 2. 認証設定

#### NextAuth Secret
```bash
# ランダムな文字列を生成
openssl rand -base64 32
```
生成された文字列を `NEXTAUTH_SECRET` に設定

#### Google OAuth設定
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成または選択
3. 「APIs & Services」→「Credentials」に移動
4. 「Create Credentials」→「OAuth 2.0 Client IDs」を選択
5. Application type: Web application
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Client IDとClient Secretを取得

#### GitHub OAuth設定
1. [GitHub Developer Settings](https://github.com/settings/developers) にアクセス
2. 「New OAuth App」をクリック
3. Application name: AI Workout Pro
4. Homepage URL: `http://localhost:3000`
5. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
6. Client IDとClient Secretを取得

### 3. Supabaseデータベース設定

#### Supabaseプロジェクト作成
1. [Supabase](https://supabase.com/) にアクセス
2. 新しいプロジェクトを作成
3. Project URLとAnon Keyを取得

#### データベーススキーマ作成
以下のSQLをSupabase SQL Editorで実行:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  image VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  fitness_level VARCHAR CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  goals TEXT[] DEFAULT '{}',
  available_equipment TEXT[] DEFAULT '{"bodyweight"}',
  available_time INTEGER DEFAULT 30,
  limitations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout sessions table
CREATE TABLE public.workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  target_muscles TEXT[] DEFAULT '{}',
  duration INTEGER, -- minutes
  exercises JSONB, -- workout data
  difficulty VARCHAR,
  calories_burned INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorite workouts table
CREATE TABLE public.favorite_workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_data JSONB NOT NULL,
  title VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, title)
);

-- Row Level Security Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view own sessions" ON public.workout_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own favorites" ON public.favorite_workouts
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_created_at ON public.workout_sessions(created_at);
CREATE INDEX idx_favorite_workouts_user_id ON public.favorite_workouts(user_id);

-- Update trigger for user_profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON public.user_profiles 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

## 🚀 アプリケーション起動

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 開発サーバー起動
```bash
npm run dev
```

### 3. アクセス
ブラウザで `http://localhost:3000` にアクセス

## 📱 使用方法

### 新規ユーザー
1. 「新規登録」ボタンをクリック
2. Google/GitHub OAuth または メール/パスワードで登録
3. プロフィール設定で基本情報を入力
4. ワークアウト生成を開始

### 既存ユーザー
1. 「ログイン」ボタンをクリック
2. 認証情報を入力
3. ダッシュボードにリダイレクト
4. 履歴、お気に入り、プロフィールにアクセス可能

## 🔒 セキュリティ設定

### Supabase RLS (Row Level Security)
- ユーザーは自分のデータのみアクセス可能
- 認証されたユーザーのみデータベース操作可能

### 認証フロー
- JWT トークンによるセッション管理
- OAuth プロバイダーとの安全な連携
- CSRF攻撃対策

## 🎯 機能概要

### 認証機能
- ✅ Google OAuth ログイン
- ✅ GitHub OAuth ログイン  
- ✅ メール/パスワード認証
- ✅ 自動ユーザー登録
- ✅ セッション管理

### ユーザー管理
- ✅ プロフィール設定
- ✅ フィットネスレベル設定
- ✅ 目標・器具・制限事項設定
- ✅ プロフィール更新

### ワークアウト履歴
- ✅ セッション記録
- ✅ 評価・メモ機能
- ✅ フィルタリング・ソート
- ✅ 統計表示

### お気に入り機能
- ✅ ワークアウト保存
- ✅ 検索・フィルタリング
- ✅ ワンクリック開始

### ダッシュボード
- ✅ 統計サマリー
- ✅ 進捗グラフ
- ✅ 最近のアクティビティ
- ✅ 達成バッジ

## 🐛 トラブルシューティング

### よくある問題

#### 認証エラー
- 環境変数の設定を確認
- OAuth設定のリダイレクトURLを確認
- Supabaseプロジェクト設定を確認

#### データベース接続エラー
- Supabase URLとキーを確認
- RLSポリシーが適切に設定されているか確認

#### ビルドエラー
- `npm install` で依存関係を再インストール
- Next.js キャッシュをクリア: `npm run build -- --clean`

### ログ確認
開発者ツールのコンソールとネットワークタブでエラーを確認