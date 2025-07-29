# ニュースWiki

インターネットから収集したニュースをWiki形式でカテゴリ別に表示するツールです。

## 機能

- ニュースURLの入力
- 自動記事解析とキャッチーなコメント生成
- カテゴリ別自動分類
- Markdown形式での蓄積
- ファイルダウンロード機能

## セットアップ

1. GitHubリポジトリを作成
2. このコードをプッシュ
3. GitHub Pagesを有効化（Settings > Pages > Source: Deploy from a branch > main）
4. OpenAI API キーをSecrets に設定（Settings > Secrets > Actions > `OPENAI_API_KEY`）

## 使用方法

1. デプロイされたサイトでニュースURLを入力
2. 自動でGitHub Actionsが記事を処理
3. カテゴリボタンで分類されたニュースを表示
4. Markdownファイルをダウンロード

## 必要なAPI

- OpenAI API（GPT-3.5-turbo）

## ディレクトリ構成

```
news-wiki/
├── index.html          # メインページ
├── script.js          # フロントエンド機能
├── style.css          # スタイル
├── .github/workflows/ # GitHub Actions
├── news/              # カテゴリ別Markdownファイル
└── data/              # 設定ファイル
```