# PR #8：携帯で読みやすい濃い文字と1行の入金予定見出し

修正前 `c245543` → アプリ実装 `23dffe8`。320×568 / 375×812、Chromium、DPR 2。架空データを使用。画像は左が修正前、右が修正後です。

## 調整

- 明朝体を維持し、通常の文字色を濃い焦げ茶ローズ **#24161c** を基準に調整。薄いグレーの説明文、項目名、数値、設定やポップアップの注意書きも対象です。
- 本文・説明・勤務先名などの細い文字は600、給与内訳の項目名・時間・金額と予定表の勤務時間は700へ。入力値も700にし、もともと太い見出しやラベルは維持しています。
- 給与の「来月入金予定」「今月入金予定」はそれぞれ1行に変更。375pxでは14px、320pxでは12px・700で表示し、見出し間に4pxの空間を確保。表の金額・計算・表示文言は維持しています。
- 白いボタン文字、未保存の金色文字、保存成功後の白文字、赤い強調、勤務先の色、土日祝の色を維持。光沢ボタン・背景・アイコン・カード・ナビの配置は変更していません。
- 円グラフ中央の書体・サイズ・色を含むリング全体は修正前と同じです。
- **アプリの変更はCSSだけです。index.htmlは修正前とバイト単位で一致し、JavaScript・給与計算・保存・LINE認証・Supabase処理は変更していません。**

## 比較画像

|対象|320px|375px|
|---|---|---|
|給与内訳：濃い文字・1行見出し|[比較](320-comparison-salary-table.png)|[比較](375-comparison-salary-table.png)|
|お給料・円グラフ中央は維持|[比較](320-comparison-clock.png)|[比較](375-comparison-clock.png)|
|シフト登録|[比較](320-comparison-calendar.png)|[比較](375-comparison-calendar.png)|
|予定表・上部|[比較](320-comparison-list-top.png)|[比較](375-comparison-list-top.png)|
|予定表・勤務時間と勤務先|[比較](320-comparison-list-today.png)|[比較](375-comparison-list-today.png)|
|予定表・有給|[比較](320-comparison-list-paid.png)|[比較](375-comparison-list-paid.png)|
|設定|[比較](320-comparison-settings.png)|[比較](375-comparison-settings.png)|
|はじめに|[比較](320-comparison-guide.png)|[比較](375-comparison-guide.png)|
|手順カード|[比較](320-comparison-guide-steps.png)|[比較](375-comparison-guide-steps.png)|
|シフトポップアップ・上部|[比較](320-comparison-shift-top.png)|[比較](375-comparison-shift-top.png)|
|シフトポップアップ・中央|[比較](320-comparison-shift-middle.png)|[比較](375-comparison-shift-middle.png)|
|シフトポップアップ・下部|[比較](320-comparison-shift-bottom.png)|[比較](375-comparison-shift-bottom.png)|
|時計・時|[比較](320-comparison-clock-hours.png)|[比較](375-comparison-clock-hours.png)|
|時計・分|[比較](320-comparison-clock-minutes.png)|[比較](375-comparison-clock-minutes.png)|

## その他のポップアップ

|対象|320px|375px|
|---|---|---|
|勤務先名の修正|[比較](320-comparison-popup-rename.png)|[比較](375-comparison-popup-rename.png)|
|休憩時間|[比較](320-comparison-popup-break.png)|[比較](375-comparison-popup-break.png)|
|ワンタッチ案内|[比較](320-comparison-popup-preset-help.png)|[比較](375-comparison-popup-preset-help.png)|
|シフト利用案内|[比較](320-comparison-popup-shift-help.png)|[比較](375-comparison-popup-shift-help.png)|
|時給入力の確認|[比較](320-comparison-popup-wage-help.png)|[比較](375-comparison-popup-wage-help.png)|
|ワンタッチ時間登録|[比較](320-comparison-popup-preset-register.png)|[比較](375-comparison-popup-preset-register.png)|
|給料内訳|[比較](320-comparison-popup-breakdown.png)|[比較](375-comparison-popup-breakdown.png)|
|目標金額|[比較](320-comparison-popup-goal.png)|[比較](375-comparison-popup-goal.png)|
|通知|[比較](320-comparison-popup-alert.png)|[比較](375-comparison-popup-alert.png)|
|確認|[比較](320-comparison-popup-confirm.png)|[比較](375-comparison-popup-confirm.png)|

## 検証

- [比較テスト](compare.cjs) / [結果](results.json)：122枚を撮影、64枚の比較画像を作成。320px・375pxで全5画面・12種類のポップアップ・時計・登録4種類を検証。表示中ボタンの遮蔽・重なり、横方向のはみ出しなし。給与見出しは全勤務先カードを含め1行で表示領域内に収まります。
- 給与内訳の文字色 #24161c・太さ700、勤務先名や時間の1行表示を自動確認。円グラフ中央を含むリング全要素の書体・サイズ・色・背景・枠・余白は修正前と一致。
- [書体・時間選択検査](font-audit.cjs) / [結果](font-audit-results.json)：数字・単位・選択肢・登録済みデータを含め、全画面とダイアログを走査。開始／終了、ワンタッチ、設定の6入力で文字盤から21:35を選択し、確定後の値と書体を確認。
- [機能回帰](functional-results.json)：JavaScript13ブロックの構文、5画面×5幅の25状態、給与・深夜・有給・保存と再読込・設定・目標・時計・期限切れの制限・バックアップのモック・勤務先0件の起動に合格。
- [安全プレビュー](preview-results.json)：18状態、外部通信0件、永続ストレージアクセス0件、実行エラー0件。架空データのみ。`?data=empty` の0件モードも維持しています。

## 携帯で確認する最新版ZIP

[ZIPをダウンロード](https://github.com/shift-app2026/hosshii-shift-test/raw/refs/heads/download/pr8-readable-23dffe8/hosshii-pr8-readable-23dffe8.zip)

[専用配布ブランチ](https://github.com/shift-app2026/hosshii-shift-test/tree/download/pr8-readable-23dffe8) / [安全性とSHA-256](archive-safety.json)

265ファイルはプレビュー専用のみ。秘密鍵・認証情報・実サービスの接続先の検出なし。全ファイルのハッシュとZIP CRCを確認済み。既存配布ブランチは変更していません。

Cloudflareへはデプロイしていません。既存の公開URLにはこの変更は反映されません。最新版ZIPを新規テスト用Pagesプロジェクトへ手動アップロードし、そこで発行されたURLを開いてください。APIトークン・Git連携は不要です。

mainへのマージ・既存プロジェクト／公開設定の変更・LINE版／本番への反映は行っていません。実機Androidの見え方、OS固有の選択メニュー、実際の認証／Supabase／決済は未検証です。
