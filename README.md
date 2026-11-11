# PR #8 Android実機テスト用・静的プレビュー

[ZIPをダウンロード](https://github.com/shift-app2026/hosshii-shift-test/raw/refs/heads/download/pr8-device-test-dfbba2c/hosshii-pr8-device-test-dfbba2c.zip)

約13MiB。最新アプリのHTML/CSSと一致し、勤務先0件の修正を含みます。ソース実装 dfbba2c、PR #8 最新 c245543 との実装一致を確認済みです。

このブランチはZIP配布だけを行い、main・PR #8・既存の配布ブランチ・公開環境は変更しません。Cloudflareへのアップロードは実行していません。

## 安全確認

架空データのみ。LINE認証・Supabase・Square等の接続先は除外。フォント同梱、CSP connect-src none、変更はメモリー内のみ、再読込でリセット。通常モードと0件モードで外部通信・永続ストレージアクセス・実行エラー0件を確認。秘密鍵・認証情報の検出なし。265ファイルは専用ファイルのみ。ZIP CRCと全ファイルハッシュ検査に合格。

## 手動アップロード

1. CloudflareのWorkers & Pagesから新規のPagesプロジェクトを作成する。
2. Git連携をせず、Direct Upload / Drag and drop your filesを選ぶ。
3. 新しい名前（例 hosshii-pr8-device-test）を入力する。既存プロジェクトは選ばない。
4. このZIPをアップロードし、新規テスト用プロジェクトだけをDeploy siteする。
5. 発行されたpages.dev URLをAndroid Chromeで開く。0件から確認する場合は末尾に /?data=empty を付ける。

APIトークン・環境変数・カスタムドメイン・既存設定の変更は不要です。ZIP直下にindex.htmlがあります。通常のPages公開はURLを知る人が閲覧可能です。

SHA-256は同梱の .sha256 を参照してください。
