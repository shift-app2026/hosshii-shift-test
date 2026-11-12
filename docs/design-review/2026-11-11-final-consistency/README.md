# PR #8：予定表の1行表示・フォント・手順番号の最終確認

比較基準 `ccaaabb` → 修正アプリ `ecfe7d5`。320×568 / 375×812、Chromium、DPR 2。比較画像は左が修正前、右が修正後です。架空データを使用しています。

## 依頼項目と対応

- **予定表**：勤務時間と勤務先名をそれぞれ改行禁止にし、矢印の領域を確保しました。320pxでは時間15px・勤務先13px、375pxでは16px・14pxです。「ローズカフェ」「月色ショップ」とも全文が1行に収まります。日付・曜日の書体、文字サイズは維持しました。有給表示は別の小さなラベルとして保持しています。
- **予定表の説明**：「日付をタップすると、」「シフトを修正できます♡」の指定2行に固定しました。
- **書体・数字**：見出し・年月・勤務先・勤務時間・時計の表示数字・ポップアップの日付帯は Noto Serif JP。入力欄と長い説明は Noto Sans JP を維持。各幅33箇所の適用書体を検査しました。通常色は #302027 を基本とし、識別色・強調色を保持しています。
- **不要な改行**：締め日・給料日ラベル、選択中勤務先の6文字名、手順カードの「登録します。」「設定します。」も確認・調整しました。長い説明文は画面幅に応じて自然に折り返します。
- **はじめに**：普通の数字 **1・2・3** をワインレッド #881337 で表示。丸付き数字・丸い背景・枠・影は削除しました。説明カードの枠、背景、余白、寸法、本文開始位置は修正前と同じです。
- **ハート**：カレンダーの給料日マーク・凡例と予定表のハートに光沢のグラデーション、ハイライト、影を適用しました。お給料画面の装飾は変更していません。
- **登録ボタン**：シフト・ワンタッチ時間・時給・勤務先登録を実際に編集して保存し、未保存時 #ffe082 → 保存成功後 #fff を確認しました。既存のボルドーの光沢背景は維持。勤務先保存成功時に未保存クラスが残る問題と、ワンタッチ登録の旧CSSが文字色を上書きする問題を修正しました。重複名で保存に失敗した場合は未保存色を維持します。
- **お給料画面**：修正前後で全表示文字の書体・サイズ・太さ・色・行間・背景・枠・余白が一致することを自動検証しました。

## 修正前後の比較画像

|対象|320px|375px|
|---|---|---|
|予定表・勤務時間と勤務先|[比較](320-comparison-list-today.png)|[比較](375-comparison-list-today.png)|
|予定表・上部|[比較](320-comparison-list-top.png)|[比較](375-comparison-list-top.png)|
|予定表・給料日|[比較](320-comparison-list-payday.png)|[比較](375-comparison-list-payday.png)|
|予定表・有給|[比較](320-comparison-list-paid.png)|[比較](375-comparison-list-paid.png)|
|はじめに・数字1/2/3|[比較](320-comparison-guide-steps.png)|[比較](375-comparison-guide-steps.png)|
|はじめに・上部|[比較](320-comparison-guide.png)|[比較](375-comparison-guide.png)|
|シフト登録|[比較](320-comparison-calendar.png)|[比較](375-comparison-calendar.png)|
|設定|[比較](320-comparison-settings.png)|[比較](375-comparison-settings.png)|
|お給料（維持確認）|[比較](320-comparison-clock.png)|[比較](375-comparison-clock.png)|
|ポップアップ・上部|[比較](320-comparison-shift-top.png)|[比較](375-comparison-shift-top.png)|
|ポップアップ・中央|[比較](320-comparison-shift-middle.png)|[比較](375-comparison-shift-middle.png)|
|ポップアップ・下部|[比較](320-comparison-shift-bottom.png)|[比較](375-comparison-shift-bottom.png)|
|時計・時|[比較](320-comparison-clock-hours.png)|[比較](375-comparison-clock-hours.png)|
|時計・分|[比較](320-comparison-clock-minutes.png)|[比較](375-comparison-clock-minutes.png)|

## 登録前後の文字色と光沢

こちらは左が未保存、右が保存成功後です。

|登録対象|320px|375px|
|---|---|---|
|シフト|[比較](320-registration-shift.png)|[比較](375-registration-shift.png)|
|ワンタッチ時間|[比較](320-registration-preset.png)|[比較](375-registration-preset.png)|
|時給|[比較](320-registration-wage.png)|[比較](375-registration-wage.png)|
|勤務先|[比較](320-registration-workplace.png)|[比較](375-registration-workplace.png)|

## 検証結果

- [比較テスト](compare.cjs) / [結果](results.json)：78枚を撮影、42枚の比較画像を作成。各行の文字領域が1行で表示領域内に収まること、説明が指定2行であること、表示中の操作ボタンが覆われていないことを検査。PR本体とローカル安全プレビューのポップアップは見出し座標・書体・余白・スクロール領域が一致しました。
- [フォント確認](checklist.cjs) / [結果](checklist-results.json)：各幅33箇所、手順カードの外観・本文位置の維持を確認。
- [既存機能の回帰結果](functional-results.json)：5画面×5幅の25状態、給与・深夜勤務・有給・登録と再読込・設定と目標の保存・時計・バックアップのモック・期限切れ時の編集制限を確認。13 JavaScriptブロックの構文検査に合格。表示に必要な8件の許可済みUI差分と既存10件の装飾差分を正規化し、元の処理との一致を確認しました。
- 前月コピーは月を独立して切り替えた場合、年越し、既存シフト・有給の重複回避、コピー元を変更しないことを確認。勤務先名のHTMLエスケープも検査しました。
- [安全プレビュー検証](preview-results.json)：18状態、外部通信0件、永続ストレージアクセス0件、実行エラー0件。架空データのみ、再読込で初期化。最新ソースからローカル生成して確認しました。

## 未検証・環境の扱い

実機スマートフォン、実際のLINE認証・Supabase・決済は実行していません。機能回帰テストは外部サービスをモックしています。既存の空ストレージ状態に起因する `getSettingsFormHtml` の `undefined.name` は元実装にも存在し、今回の修正範囲には含めていません。

Cloudflareの公開プレビューは従来の `c6ca41b` のままで、今回の修正は未デプロイです。PR #8の作業ブランチ以外、main、ダウンロード専用ブランチ、公開設定、本番環境は変更していません。給与計算・保存データ形式・認証処理の変更はありません。
