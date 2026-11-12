# PR #8：ワンサイズ大きい文字と登録・保存ボタンの4状態

比較基準 `ed61199` → 修正実装 `aff762d`。320×568 / 375×812、Chromium、DPR 2。架空データのみで検証しています。比較画像は左が変更前、右が変更後です。

**今回はレビュー用の修正・比較画像だけです。ZIPを作成しておらず、既存の配布ZIPも更新していません。Cloudflareへのデプロイ・PRのマージ・本番反映は行っていません。**

## 文字の拡大と維持したもの

- Noto Serif JPを維持し、通常の文字・説明・数値・金額・勤務先名を基本1〜2px拡大。細い本文は600〜700、通常色は濃い焦げ茶ローズ #21151a を基準にしています。もともと極端に小さい補助表示は、読みやすい最小サイズまで拡大しています。
- 円グラフ下の説明文は14→16px・700。「締め日」「表しています。」などを途中で分断しないようにし、文言は維持しました。
- 給与内訳の項目と金額は320pxで13→14px、375pxで14→15px。各入金予定見出しは320pxで12→14px、375pxで14→15pxで、それぞれ1行です。カード内余白を先に減らし、列幅を広げて収めています。
- 数字入力は16→17px。時給・加算額は2段にし、320pxの交通費・手当の月額／日額も縦に配置。文字を小さく戻すことなく「10,000」「100,000」等の表示幅を確保しました。入力順・項目・機能は同じです。
- 予定表の勤務時間は320pxで14→15px、375pxで15→16px、勤務先は12→13px／13→14px。日付・曜日も1px拡大。勤務時間と勤務先名の各1行表示、有給の「有給・時間・勤務先」の順を維持。
- カレンダーの日付は18→19px。勤務先凡例は拡大した名前を詰め込まず、2列で表示。勤務先色・土日祝色・輪郭♡は維持。
- 下部タブは文字11→13px、アイコン320pxで19→21px、375pxで22→24px。線を太く、通常色を濃くしています。タイルは74px高、スクロール領域はナビの高さを確保し、重なりを防いでいます。
- 円グラフ中央を含むリング全体の書体・サイズ・色と、大きな見出しのデザインは維持。白文字・赤い強調・勤務先色・土日祝色・ワインレッドとシャンパンゴールド・光沢ボタンの表面も維持しています。

## 全5画面・時計・主なポップアップ

|対象|320px|375px|
|---|---|---|
|お給料・リング中央は維持|[比較](320-comparison-clock.png)|[比較](375-comparison-clock.png)|
|円グラフ下の説明文|[比較](320-comparison-salary-note.png)|[比較](375-comparison-salary-note.png)|
|給与内訳・1行見出し|[比較](320-comparison-salary-table.png)|[比較](375-comparison-salary-table.png)|
|シフト登録|[比較](320-comparison-calendar.png)|[比較](375-comparison-calendar.png)|
|予定表・上部|[比較](320-comparison-list-top.png)|[比較](375-comparison-list-top.png)|
|予定表・勤務時間と勤務先|[比較](320-comparison-list-today.png)|[比較](375-comparison-list-today.png)|
|予定表・給料日|[比較](320-comparison-list-payday.png)|[比較](375-comparison-list-payday.png)|
|予定表・有給|[比較](320-comparison-list-paid.png)|[比較](375-comparison-list-paid.png)|
|設定|[比較](320-comparison-settings.png)|[比較](375-comparison-settings.png)|
|はじめに|[比較](320-comparison-guide.png)|[比較](375-comparison-guide.png)|
|手順カード|[比較](320-comparison-guide-steps.png)|[比較](375-comparison-guide-steps.png)|
|シフトポップアップ上部|[比較](320-comparison-shift-top.png)|[比較](375-comparison-shift-top.png)|
|シフトポップアップ中央|[比較](320-comparison-shift-middle.png)|[比較](375-comparison-shift-middle.png)|
|シフトポップアップ下部|[比較](320-comparison-shift-bottom.png)|[比較](375-comparison-shift-bottom.png)|
|時間選択・時|[比較](320-comparison-clock-hours.png)|[比較](375-comparison-clock-hours.png)|
|時間選択・分|[比較](320-comparison-clock-minutes.png)|[比較](375-comparison-clock-minutes.png)|
|下部5タブの拡大|[比較](320-comparison-nav.png)|[比較](375-comparison-nav.png)|

[320px 数字入力の表示幅確認](320-after-settings-values.png) / [375px 数字入力の表示幅確認](375-after-settings-values.png)

## その他のポップアップ

|対象|320px|375px|
|---|---|---|
|勤務先名の保存|[比較](320-comparison-popup-rename.png)|[比較](375-comparison-popup-rename.png)|
|休憩時間|[比較](320-comparison-popup-break.png)|[比較](375-comparison-popup-break.png)|
|ワンタッチ利用案内|[比較](320-comparison-popup-preset-help.png)|[比較](375-comparison-popup-preset-help.png)|
|シフト利用案内|[比較](320-comparison-popup-shift-help.png)|[比較](375-comparison-popup-shift-help.png)|
|時給入力の確認|[比較](320-comparison-popup-wage-help.png)|[比較](375-comparison-popup-wage-help.png)|
|ワンタッチ登録と一覧|[比較](320-comparison-popup-preset-register.png)|[比較](375-comparison-popup-preset-register.png)|
|給料内訳|[比較](320-comparison-popup-breakdown.png)|[比較](375-comparison-popup-breakdown.png)|
|目標金額|[比較](320-comparison-popup-goal.png)|[比較](375-comparison-popup-goal.png)|
|通知|[比較](320-comparison-popup-alert.png)|[比較](375-comparison-popup-alert.png)|
|確認|[比較](320-comparison-popup-confirm.png)|[比較](375-comparison-popup-confirm.png)|

## 登録・保存ボタンを11種類確認

以前は、新しいワンタッチ登録画面を開くだけで保存済みクラスを付ける処理と、初期状態を白文字にするCSSが残っていました。初期・再編集・失敗は金色、成功時だけ白に統一しました。状態はDOMのクラスで持ち、保存データには追加していません。

|状態|表示|
|---|---|
|新しい操作・未保存|光沢ワインレッド背景＋シャンパンゴールド #ffe082|
|保存・適用成功|同じ背景＋白 #fff|
|入力・日付・勤務先を変更|再び金色|
|保存失敗・入力不正|金色を維持し、白へ切り替えない|

「＋シフトを登録」「＋登録」も対象です。開くだけでは白にせず、その先の登録が成功した場合にだけ白へ変わります。保存済みの既存時給行は初期白、追加した空の時給行は初期金色です。

[新しい空の時給行：320px](320-fresh-wage-gold.png) / [375px](375-fresh-wage-gold.png) / [初期状態の検証結果](initial-wage-results.json)

### 未保存 → 保存・適用成功

成功すると閉じるダイアログは、右側に実際の遷移先を撮影しています。保存後の白状態は、下記の状態ログでも検査しています。画面を強制的に開き直す等の画像加工は行っていません。

|対象|320px|375px|
|---|---|---|
|勤務時間の登録|[比較](320-states-shift-success.png)|[比較](375-states-shift-success.png)|
|ワンタッチ時間の保存|[比較](320-states-preset-success.png)|[比較](375-states-preset-success.png)|
|時給の登録|[比較](320-states-wage-success.png)|[比較](375-states-wage-success.png)|
|勤務先の新規登録|[比較](320-states-workplace-success.png)|[比較](375-states-workplace-success.png)|
|勤務先名の保存|[比較](320-states-rename-success.png)|[比較](375-states-rename-success.png)|
|目標金額の登録|[比較](320-states-goal-success.png)|[比較](375-states-goal-success.png)|
|設定を保存して閉じる|[比較](320-states-settings-success.png)|[比較](375-states-settings-success.png)|
|時計の選択を適用|[比較](320-states-clock-success.png)|[比較](375-states-clock-success.png)|
|ワンタッチ一覧から登録|[比較](320-states-quick-success.png)|[比較](375-states-quick-success.png)|
|＋シフトを登録の入口|[比較](320-states-calendar-entry-success.png)|[比較](375-states-calendar-entry-success.png)|
|＋登録の入口|[比較](320-states-preset-entry-success.png)|[比較](375-states-preset-entry-success.png)|

### 再編集 → 保存・適用失敗

右側には実際のエラー表示や失敗後の画面を撮影しています。エラーに覆われるボタンの文字色も状態ログで検査しています。

|対象|320px|375px|
|---|---|---|
|勤務時間の登録|[比較](320-states-shift-failure.png)|[比較](375-states-shift-failure.png)|
|ワンタッチ時間の保存|[比較](320-states-preset-failure.png)|[比較](375-states-preset-failure.png)|
|時給の登録|[比較](320-states-wage-failure.png)|[比較](375-states-wage-failure.png)|
|勤務先の新規登録|[比較](320-states-workplace-failure.png)|[比較](375-states-workplace-failure.png)|
|勤務先名の保存|[比較](320-states-rename-failure.png)|[比較](375-states-rename-failure.png)|
|目標金額の登録|[比較](320-states-goal-failure.png)|[比較](375-states-goal-failure.png)|
|設定を保存して閉じる|[比較](320-states-settings-failure.png)|[比較](375-states-settings-failure.png)|
|時計の選択を適用|[比較](320-states-clock-failure.png)|[比較](375-states-clock-failure.png)|
|ワンタッチ一覧から登録|[比較](320-states-quick-failure.png)|[比較](375-states-quick-failure.png)|
|＋シフトを登録の入口|[比較](320-states-calendar-entry-failure.png)|[比較](375-states-calendar-entry-failure.png)|
|＋登録の入口|[比較](320-states-preset-entry-failure.png)|[比較](375-states-preset-entry-failure.png)|

## 検証結果

- [画面比較テスト](compare.cjs) / [結果](results.json)：全5画面、12種類のポップアップ、給与注記・内訳、予定表、有給等で126枚を撮影。320px・375pxで横方向のはみ出し、表示中ボタンの重なり・操作中心の遮蔽なし。全勤務先の給与見出し、勤務時間と勤務先名、予定表説明文の1行表示を確認。リング全体と中央の文字スタイルは修正前と一致。
- [文字サイズ監査](size-audit.cjs) / [320px](size-audit-320.json) / [375px](size-audit-375.json)：同じ最新DOMへ修正前後のCSSを適用し、各幅665個の文字・入力・選択肢を比較。縮小された文字はありません。実際の修正前後アプリ比較は上記画面テストで別途実施しています。
- [文字と入力の収まり](text-fit.cjs) / [結果](text-fit-results.json)：表示中ボタンの文字幅、時給10,000・加算1,000・月額／日額100,000等の入力幅を実際のDOM文字計測で確認。文字切れなし。
- [ボタン4状態テスト](button-states.cjs) / [結果](button-state-results.json)：11種類×2幅＝22ケース。初期状態も含め110枚撮影。8種類の保存操作と2入口ではブラウザーの保存にQuotaExceededErrorを発生させ、失敗後に保存内容が変わらず金色を維持することを確認。時刻選択は永続保存ではないため、入力先への適用と、入力先不正時に未適用・金色を維持することを確認。
- 設定は従来どおり自動保存があります。登録・保存ボタンの白表示は明示操作の成功に合わせ、再編集では金色へ戻します。目標の保存失敗はダイアログを閉じず、その中に失敗理由を表示します。保存処理自体は既存関数を使っています。
- [書体・時計の操作検査](font-audit.cjs) / [結果](font-audit-results.json)：勤務先メニュー、数字、単位、選択肢、登録済みデータを走査。開始／終了・ワンタッチ・設定の6入力で文字盤から21:35を選び、確定後の値・書体を確認。
- [既存機能回帰](functional-results.json)：JavaScript14ブロックの構文、5画面×5幅の25状態、給与・深夜・有給・登録と再読込・設定と目標の保存・時計・無料体験期限切れの編集制限・バックアップのモック・勤務先0件の起動に合格。表示／状態制御の許可済み差分を逆変換し、元の処理との一致を確認しました。
- [ローカル安全プレビュー](preview-results.json)：18状態、外部通信0件、永続ストレージアクセス0件、実行エラー0件。
- 比較画像は112枚（PR本体とローカルプレビューの一致比較等を含む）。スクリーンショットの合成・切り出しのみで、描き直しはしていません。

## 機能・保存と未検証項目

変更したJavaScriptは、ボタンの状態、初期化、入力変更、保存結果を受けた表示、失敗時のダイアログ制御です。給与計算、保存キー・JSON形式、保存関数、LINE認証、無料体験判定、Supabase連携は維持。新しい保存データ項目はありません。

大きな文字のため、縦方向のスクロール量は増えます。実機Androidのキーボード表示やOS固有の選択メニュー、実際のLINE／Supabase／決済は未検証です。検証時の外部サービスはモックを使用しています。

**今回はZIPを作成しておらず、配布ブランチも更新していません。既存の携帯テストURLには未反映です。** 比較画像の確認後に、携帯テスト用ZIPを作成するか判断いただく段階です。Cloudflareへのデプロイ、LINE本番版への反映、PR #8のマージは行っていません。
