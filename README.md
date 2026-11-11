# PR #8：文字を濃くした携帯テスト用プレビュー

[最新版ZIPをダウンロード](https://github.com/shift-app2026/hosshii-shift-test/raw/refs/heads/download/pr8-readable-23dffe8/hosshii-pr8-readable-23dffe8.zip)

実装23dffe8。全画面の通常文字を濃くし、明朝体の細い線を補強。給与内訳の来月入金予定／今月入金予定は各1行。320px・375pxで全5画面と12種類のポップアップを確認。円グラフ中央、白／金色ボタン文字、赤い強調、勤務先・土日祝の色を維持。HTMLとJavaScriptは前版から変更していません。

架空データのみ。外部通信・永続ストレージアクセス0件を確認。LINE・Supabase・Square接続なし、フォント同梱。再読込で初期化。勤務先0件はURL末尾 `/?data=empty` で確認できます。

CloudflareのWorkers & Pagesで新規のPagesプロジェクトを作成し、Direct Upload / Drag and dropでZIPをそのままアップロードしてください。既存プロジェクトは選ばないでください。Git連携・APIトークン・環境変数・ドメイン変更は不要です。

こちらからCloudflareへのデプロイは実行していません。ZIP配布専用の独立ブランチです。既存の配布ブランチとmainは変更しません。
