# 既存ツールの実現可能性を推定するアプリ（B2B向け） - HyJack Frontend

## プロダクト概要

HyJackは、顧客からの「このアプリでどこまでできるか？」という詳細問合せに対し、**根拠付きで迅速に実現可能性（％）と実装アプローチ**を返すことで、担当者の対応時間を削減し、コア業務へ集中させるB2B向けアプリケーションです。

### 背景・課題
- B2B企業で製品・アプリの問い合わせが頻発
- 社内の仕様書・要件定義・FAQ・導入事例など**100件以上のWord文書**を参照する必要
- 回答のばらつきとリードタイムが課題
- 社外提示可能な表現・根拠の線引きが難しい

### 解決策
- **RAG（Retrieval-Augmented Generation）**で社内文書から根拠を抽出
- **実現可能性スコア**と**推奨アプローチ**を自動生成
- **証拠リンク/抜粋**を並記し、人がすぐレビュー・編集
- **禁止/制約ルール**を判定に組み込み、誤約束を防ぐ

### 技術スタック
- **フロントエンド**: Next.js + TypeScript + React
- **バックエンド**: Laravel (PHP) API
- **AI**: Gemini API（埋め込みモデル + 生成モデル）
- **ストレージ**: PostgreSQL + pgvector（埋め込み）, S3互換（原本）
- **認証**: NextAuth.js / Auth0 / Laravel Sanctum
- **監査**: 永続ログ（質問, 返答, 参照ID, モデルver, プロンプトver）

---

## 主要機能

### ユーザーストーリー
1. **CSとして**、顧客要望を1文で投げると、**可否％と根拠**が3つ以内で返る
2. **セールスとして**、**非対応/要カスタム**の場合は**代替案**と**期待効果**が返る  
3. **PMとして**、回答に使われた**根拠文書のバージョン/日付**を確認できる

### 画面構成
- **ホーム**: 入力テキスト、過去質問、ドラフト回答一覧
- **回答画面**: ①可否％ + ラベル（対応/要カスタム/非対応）②根拠（ハイライト付）③推奨アプローチ（箇条書き）④期間レンジ ⑤リスク注意
- **文書管理**: アップロード履歴、インデックス状態、バージョン/有効・無効

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

### アクセスURL
- フロントエンド: http://localhost:3000  
- バックエンドAPI: http://localhost:8000/api

---

## 実現可能性スコア算出

### 出力項目
- `score_pct (0-100)`: 実現可能性パーセンテージ
- `band (High/Med/Low)`: 信頼度バンド
- `label (対応/要カスタム/非対応)`: 分類ラベル
- `rationale`: 根拠説明

### 算出要素
- **E1: 根拠カバレッジ**（該当セクション数/必要観点）
- **E2: ルール整合**（禁止/制約/サポートの一致度）
- **E3: 複雑度逆数**（必要コンポーネント数、依存、未知API）
- **E4: 類似成功事例の有無**（ナレッジ/FAQでの成功ケース）
- **P: 罰則**（根拠年代が古い、矛盾、OOS検知）

### 計算式
```
score = clamp( w1*E1 + w2*E2 + w3*E3 + w4*E4 - P , 0, 100 )
```
初期重み: w1=0.35, w2=0.25, w3=0.20, w4=0.20

---

## 開発・運用

### 非機能要件
- **性能**: 問合せ→初回回答 **≤ 8秒**（P95）
- **可用性**: 平日9-19時SLA 99.5%
- **セキュリティ**: テナント分離、PII最小化、転送/保存時暗号化

### 監査・ログ
- 入出力ログ、参照根拠、モデル/プロンプトバージョンの記録
- 質問, 返答, 参照ID, モデルver, プロンプトverの永続保存

---

## 参考リンク

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
