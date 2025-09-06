# 氷河期世代向け 趣味×ECコミュニティプラットフォーム - HyJack

## プロダクト目的・背景
就職氷河期世代（40〜50代）は、SNSやECの利用に敷居を感じていることが多く、既存サービスは若年層中心で炎上リスクや操作の複雑さが障壁となっていると考えます。
HyJackは「安心・簡単・同世代とつながる」をテーマに、趣味を発信・販売できる場所として私自身が構想したプロダクトです。

主な特徴：
- 年代特化による安心感と文化的共感
- スマホだけで完結する商品販売
- 趣味別サークルでの交流・集客
- EC・ブログ・コミュニティがシームレスに連動
- メール/パスワード認証と主要SNS認証（Google, GitHub, X）
- JWTによるセキュアな認証管理
- Next.js + Laravelによるフロント・バックエンド分離構成
- Dockerによる開発環境の統一

---

## 起動コマンド

### フロントエンド（Next.js）

```bash
cd frontend
npm install
npm run dev
# または
yarn install
yarn dev
```

### バックエンド（Laravel）

```bash
cd backend
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate
```

---
フロントエンド: http://localhost:3000  
バックエンドAPI: http://localhost:8000/api
## HyJack プロダクト概要

HyJackは「多様な認証方式（メール・Google・GitHub・X）を統合し、ユーザーが安心して利用できるWebサービス基盤」を目指したプロジェクトです。
主な特徴：
- メール/パスワード認証と主要SNS認証（Google, GitHub, X）
- JWTによるセキュアな認証管理
- ユーザー情報の一元管理
- Next.js + Laravelによるフロント・バックエンド分離構成
- Dockerによる開発環境の統一

---

## 起動コマンド

### フロントエンド（Next.js）

```bash
cd frontend
npm install
npm run dev
# または
yarn install
yarn dev
```

### バックエンド（Laravel）

```bash
cd backend
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate
```

---
フロントエンド: http://localhost:3000  
バックエンドAPI: http://localhost:8000/api

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
