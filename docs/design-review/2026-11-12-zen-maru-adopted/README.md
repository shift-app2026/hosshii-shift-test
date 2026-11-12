# PR #8：Zen Maru Gothic正式採用

正式採用の指定に従い、PR #8の `design/bordeaux-rose-champagne` に反映しました。反映前は `1e3f53f`。比較時のCSS注入ではなく、**本体のスタイルシートと同梱フォントだけで表示**しています。

|役割|採用書体|太さ|
|---|---|---:|
|見出し・勤務先名|Zen Maru Gothic|700|
|説明文・勤務時間・金額・数値入力|Zen Maru Gothic|500|
|下部5タブ|Zen Maru Gothic|700|
|登録・保存等の操作ボタン|Zen Maru Gothic|700|
|円グラフ中央|従来のまま|従来のまま|

無料お試しの見出し、見本の案内、給与内訳、設定の勤務先名・入力欄、予定表、はじめに、シフト登録・時間選択等へ反映しています。文字サイズ・文字色・行間・字間・余白・ボタン配置の指定は変えていません。ワインレッド／シャンパンゴールド、状態に応じた金／白の文字色、勤務先色・土日祝色も維持。

## 実装範囲

- `index.html` は新しい `zen-maru.css` の読み込み1行のみ追加。**JavaScript・既存のインラインCSS・文言・HTML構造はそのまま**です。
- `zen-maru.css` は採用済みの役割分けを反映。円グラフ本体・その子要素・そこへ書体を継承する祖先を除外して、既存の中央表示を保護しています。サイズ・色・行間・配置を変更する宣言は含みません。
- 公式の500（Medium）・700（Bold）をWOFF2形式で同梱し、アプリと同じ配信元から読み込みます。文字の形や太さを加工した600等は作成していません。[フォントの出典・ライセンス](../../../fonts/README.md)
- ローカル安全プレビューの生成処理も、このCSS・フォント・OFLライセンスをそのままコピーするよう対応。ZIPは作成していません。

## 320px・375pxの反映前後

左が反映前、右が正式採用後です。比較用にフォントを上書きする処理は使用していません。

|箇所|320px|375px|
|---|---|---|
|お給料・無料お試し・下部タブ|[比較](320-compare-salary-top.png)|[比較](375-compare-salary-top.png)|
|給与内訳・勤務時間・金額|[比較](320-compare-salary-breakdown.png)|[比較](375-compare-salary-breakdown.png)|
|設定・時給入力・勤務先名|[比較](320-compare-settings-wage.png)|[比較](375-compare-settings-wage.png)|
|交通費・その他の横並び|[比較](320-compare-settings-allowances.png)|[比較](375-compare-settings-allowances.png)|
|シフト登録ポップアップ|[比較](320-compare-shift.png)|[比較](375-compare-shift.png)|

正式採用後の単独画像：

|画面|320px|375px|
|---|---|---|
|お給料|[画像](320-after-salary-top.png)|[画像](375-after-salary-top.png)|
|シフト登録|[画像](320-after-calendar.png)|[画像](375-after-calendar.png)|
|予定表|[画像](320-after-list.png)|[画像](375-after-list.png)|
|設定|[画像](320-after-settings.png)|[画像](375-after-settings.png)|
|有給休暇|[画像](320-after-settings-paid.png)|[画像](375-after-settings-paid.png)|
|はじめに|[画像](320-after-guide.png)|[画像](375-after-guide.png)|
|シフト登録ポップアップ|[画像](320-after-shift.png)|[画像](375-after-shift.png)|
|時間選択|[画像](320-after-time-picker.png)|[画像](375-after-time-picker.png)|

## 検証結果

- Chromiumのモバイル設定・320×568／375×812・DPR 2。各幅16状態の反映前後、合計64画面で全5画面・勤務先選択・シフト登録上部／下部・時間選択等を確認。
- ブラウザが実際に使ったフォントをCDPで確認：給与金額は **ZenMaruGothic-Medium（500）**、下部タブは **ZenMaruGothic-Bold（700）**。フォントの通信をテスト用データへ差し替えず、同梱WOFF2を通常読み込みして確認しています。
- 見出し・勤務先名700、説明・勤務時間・金額500、タブ700を表示中の対象要素で検査。無料お試しの見出し700、直下の説明500も確認。
- 反映前後で文字サイズ・文字色・行間・字間が同一。横スクロール・文字の横切れ・表示領域内のボタンの重なり／中心の遮蔽なし。給与内訳見出し、勤務時間・勤務先名、修正済みの説明文・有給・コピー説明・年収見出しの改行も確認。
- 円グラフ全体の書体・サイズ・太さ・色・行間・背景・枠・余白は反映前と一致。中央文字の画像領域も両幅でピクセル一致。[中央表示の結果](ring-centre-results.json)（動く真珠部分はピクセル比較の対象外）
- 14 scriptの構文、承認済み表示差分を戻した既存スクリプトとの一致、既存ハンドラー、25件のレイアウト、給与・深夜計算、保存／再読込、設定自動保存、勤務先0件、認証・試用期限・バックアップ（モック）等が成功。[機能検証結果](functional-results.json)
- フォント含む必要な静的ファイルの読み込みエラー、JavaScript実行エラー、プレビュー操作時の外部リクエストは0件。架空データのみ使用。

[表示検証コード](verify.cjs)／[表示・実描画フォントの結果](results.json)／[変更範囲・同梱資材の一致](preservation-results.json)

Android実機での表示は未検証です。今回、ZIP作成・Cloudflareへのデプロイ・LINE本番反映・mainへのマージは行っていません。既存の携帯プレビューURL、配布ZIP、公開設定も更新していません。
