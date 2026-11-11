# PR #8：最終追加修正（④〜⑨）

比較基準 `9c5da2a` → アプリ修正 `200804b`。320×568 / 375×812、Chromium、DPR 2。架空データを使用。比較画像は左が修正前、右が修正後です。

## 対応内容

- **①〜③の承認済み内容**：予定表の文言・1行表示・文字サイズ・勤務先名と勤務時間・勤務先別の光沢♡を維持。⑧の全体方針に沿い、説明文などに残っていたゴシック体は明朝体に統一しています。
- **④ 有給**：「有給　8時間　バイト名」の順に変更。時刻を指定した有給も「有給　勤務時間　バイト名」の順。既存の有給の枠・淡い背景は維持し、値・計算・保存形式は変更していません。
- **⑤ シフト登録カレンダーの給料日**：勤務先の色や塗りを使わない、無彩色 #302027 の輪郭SVGに統一。日付数字の右側に1pxだけ重なる位置、数字より上寄りに配置し、数字を隠しません。3勤務先の給料日が同日でも♡は1つです。日付の操作を妨げないようマークのポインター操作は無効。凡例も同じ輪郭と Noto Serif JP に統一しました。①〜③が承認済みのため、予定表側の勤務先別光沢♡は変更していません。
- **⑥ 設定**：「※6文字以内で3件まで登録できます。」、締め日・給料日の選択肢、入力値、登録済み勤務先名、時給・有給・交通費・その他の数値と単位まで Noto Serif JP に統一。登録前後と勤務先切り替え後の動的な表示も検査しました。
- **⑦ シフト登録ポップアップ**：注意書きを下記の指定2行に変更。見出し、勤務先、入力値、選択肢、開始・終了・休憩の数字・単位、登録済みシフト、ワンタッチ時間、操作ラベルまで Noto Serif JP に統一しました。

```text
※有給の場合は「有給」を選択してから
　登録してね。
```

- **⑧ 総点検**：お給料画面は確定デザインを維持したまま、他の4画面・共通ナビ・固定見出し・全12種類のアプリ内ポップアップ・勤務先選択メニューを点検。入力欄や長文も基本書体を Noto Serif JP に統一しました。数字・記号・単位・登録済みデータ・非表示状態の内容も対象です。承認済み予定表の装飾♡は、形と光沢を維持するため既存の装飾用書体を保持。絵文字の実際の字形はOSの絵文字フォントに依存します。
- **時間選択の重点検証**：24時間文字盤と分の文字盤、選択中の数字、時／分の切り替え、確定操作、確定後の値を検査。シフト開始・終了、ワンタッチ開始・終了、設定の時給開始・終了の6入力それぞれで、実際に文字盤をクリックして **21:35** を確定し、値と書体を確認しました。数字サイズと太さは既存の読みやすい表示を保持。注意書きは行間1.7で指定2行に収めています。
- **⑨ 登録・保存ボタン**：既存の確定仕様である未保存 #ffe082（金色文字）→保存成功後 #fff（白文字）を、シフト・ワンタッチ時間・時給・勤務先の4種類で再検証。光沢ボルドー背景は同一。重複勤務先名などで保存に失敗した場合は未保存色を維持します。計算・永続保存処理の変更はありません。

## スマートフォン幅での比較

|対象|320px|375px|
|---|---|---|
|④ 有給の順序|[比較](320-comparison-list-paid.png)|[比較](375-comparison-list-paid.png)|
|⑤ カレンダーの輪郭♡・凡例|[比較](320-comparison-calendar.png)|[比較](375-comparison-calendar.png)|
|⑥ 設定|[比較](320-comparison-settings.png)|[比較](375-comparison-settings.png)|
|⑦ ポップアップ上部|[比較](320-comparison-shift-top.png)|[比較](375-comparison-shift-top.png)|
|⑦ ポップアップ中央|[比較](320-comparison-shift-middle.png)|[比較](375-comparison-shift-middle.png)|
|⑦ ポップアップ下部・注意書き|[比較](320-comparison-shift-bottom.png)|[比較](375-comparison-shift-bottom.png)|
|⑧ 時計・時の文字盤|[比較](320-comparison-clock-hours.png)|[比較](375-comparison-clock-hours.png)|
|⑧ 時計・分の文字盤|[比較](320-comparison-clock-minutes.png)|[比較](375-comparison-clock-minutes.png)|
|⑧ はじめに|[比較](320-comparison-guide.png)|[比較](375-comparison-guide.png)|
|⑧ 手順カード|[比較](320-comparison-guide-steps.png)|[比較](375-comparison-guide-steps.png)|
|承認済み予定表・1行説明|[比較](320-comparison-list-top.png)|[比較](375-comparison-list-top.png)|
|承認済み予定表・勤務時間と勤務先|[比較](320-comparison-list-today.png)|[比較](375-comparison-list-today.png)|
|承認済み予定表・給料日|[比較](320-comparison-list-payday.png)|[比較](375-comparison-list-payday.png)|
|確定済みお給料画面（維持確認）|[比較](320-comparison-clock.png)|[比較](375-comparison-clock.png)|

## その他の全ポップアップ

|対象|320px|375px|
|---|---|---|
|バイト名の変更|[比較](320-comparison-popup-rename.png)|[比較](375-comparison-popup-rename.png)|
|休憩時間の選択|[比較](320-comparison-popup-break.png)|[比較](375-comparison-popup-break.png)|
|ワンタッチの利用案内|[比較](320-comparison-popup-preset-help.png)|[比較](375-comparison-popup-preset-help.png)|
|シフト登録の利用案内|[比較](320-comparison-popup-shift-help.png)|[比較](375-comparison-popup-shift-help.png)|
|時給入力の確認・案内|[比較](320-comparison-popup-wage-help.png)|[比較](375-comparison-popup-wage-help.png)|
|ワンタッチ時間の登録・登録済み一覧|[比較](320-comparison-popup-preset-register.png)|[比較](375-comparison-popup-preset-register.png)|
|給料内訳|[比較](320-comparison-popup-breakdown.png)|[比較](375-comparison-popup-breakdown.png)|
|目標金額|[比較](320-comparison-popup-goal.png)|[比較](375-comparison-popup-goal.png)|
|通知ダイアログ|[比較](320-comparison-popup-alert.png)|[比較](375-comparison-popup-alert.png)|
|確認ダイアログ|[比較](320-comparison-popup-confirm.png)|[比較](375-comparison-popup-confirm.png)|

## 登録前後のボタン

こちらは左が未保存、右が保存成功後です。

|対象|320px|375px|
|---|---|---|
|シフト|[比較](320-registration-shift.png)|[比較](375-registration-shift.png)|
|ワンタッチ|[比較](320-registration-preset.png)|[比較](375-registration-preset.png)|
|時給|[比較](320-registration-wage.png)|[比較](375-registration-wage.png)|
|勤務先|[比較](320-registration-workplace.png)|[比較](375-registration-workplace.png)|

## 検証結果

- [比較テスト](compare.cjs) / [結果](results.json)：118枚を撮影、62枚の比較画像を作成。全5画面と12種類のポップアップを開いて確認しました。文字切れ・1行指定の改行・横方向のはみ出し・表示中ボタンの重なり／中心の遮蔽は検出されませんでした。PR本体とローカル安全プレビューのシフト登録ポップアップも同じ書体・見出し位置・スクロール領域です。
- [全フォント点検](font-audit.cjs) / [結果](font-audit-results.json)：各幅21状態で、入力値・選択肢・登録済みデータ・文字盤・表示前のダイアログも走査。各状態のサンプルIDは `uniqueSamples` に対応します。給与確定部と承認済み装飾以外に旧書体は残っていません。指定注意書きの2行、有給の順序、給料日が3勤務先重なった場合の♡1個、日付のタップを検証しました。
- お給料画面は、タブ内に加えてDOM上で分離される固定見出し・無料体験バナーまで、文字・書体・サイズ・太さ・色・行間・背景・枠・余白が修正前と一致します。共通ナビは全体方針に沿って明朝体に統一しています。
- 予定表の日付・曜日のスタイルは修正前と一致。はじめにの説明カードも寸法・背景・枠・余白・本文開始位置が一致します。
- [既存機能回帰](functional-results.json)：13ブロックのJavaScript構文検査、5画面×5幅の25状態、給与・深夜・有給・登録と再読込・設定と目標の保存・時計・期限切れ時の編集制限・バックアップのモックに合格。11件の明示的な表示用差分と既存10件の装飾差分を正規化し、元の処理との一致を確認しました。
- [安全プレビュー検証](preview-results.json)：18状態で外部通信0件、永続ストレージアクセス0件、実行エラー0件。ローカルの架空データのみです。

## 未検証・公開環境

実機スマートフォン、Android等のOS固有の選択メニュー表示、実際のLINE認証・Supabase・決済は未検証です。外部サービスは機能検証時にモックしています。元の空ストレージ状態における `getSettingsFormHtml` の `undefined.name` は既存問題として記録し、今回の修正対象には含めていません。

変更はPR #8の作業ブランチのみです。mainへのマージ、Cloudflareへのデプロイ、本番公開、公開設定変更は行っていません。Cloudflareの公開プレビューは引き続き旧版 `c6ca41b` です。保存データ形式・給与計算・LINE認証・Supabase処理は維持しています。
