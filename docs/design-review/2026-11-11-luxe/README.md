# Stitch「ボルドー＆ローズシャンパン」仕上げと6画面の確認

撮影コード：**`aa60fd7d8a74cc2d8cdc5b43cf35a466c55b592e`**。作業ブランチは `design/bordeaux-rose-champagne`（PR #8）です。

## 今回の仕上げ

- **書体**：Noto Serif JPの見出し・金額、Noto Sans JPの時間・操作ラベル、Cinzelの年月という役割を明確にし、サイズ・太さ・字間・行間を調整しました。説明文には自然な折り返しと余白を確保しています。
- **ジュエルリング**：既存の立体ボルドーリングを活かし、シャンパンゴールドの細い内外周、陶器のような淡い中心面、ゴールドの目盛りを追加・調整しました。ビー玉は白いハイライトからクリーム・ゴールドへ変わる真珠調にしています。
- **6画面のアイコン**：財布、カレンダー、予定リスト、花、本の小さなSVGを各タブの固定見出しに追加。シフト登録ポップアップのカレンダーには淡いローズの枠を付けました。アイコンは装飾としてaria-hiddenにしています。
- **採用済みの光沢ボタン・ナビSVG**は維持しています。前回までのCSSを変更せず、仕上げ用の指定を追加しています。

Stitchの完成版HTML、DESIGN.md、CSS、chatgpt.mdを参考にしました。崩れたscreen.pngは完成デザインの基準にしていません。書体は最新の指定に合わせ、上記3種類を使用しています。

## 6画面（320px / 375px）

実Google Fontsを読み込んで撮影しています。端末相当の表示領域は375×812 / 320×568 CSS px、DPR 2です。画面の全内容を縦長の1枚に伸ばしてはいません。予定表は勤務データが見える当日へスクロールした画像です。

| 画面 | 375px | 320px |
| --- | --- | --- |
| お給料・ジュエルリング | [画像](375/clock.png) | [画像](320/clock.png) |
| シフト登録カレンダー | [画像](375/calendar.png) | [画像](320/calendar.png) |
| 予定表・当日の勤務 | [画像](375/list-today.png) | [画像](320/list-today.png) |
| 設定・光沢ボタン | [画像](375/settings.png) | [画像](320/settings.png) |
| はじめに | [画像](375/guide.png) | [画像](320/guide.png) |
| シフト登録ポップアップ | [画像](375/shift-modal.png) | [画像](320/shift-modal.png) |

## 互換性・操作性の確認

- 元のJavaScript全13ブロックと既存インラインイベント属性は元HTMLと完全一致しています。給与計算、保存、LINE認証、21日間無料体験の状態判定、Supabase・バックアップの処理は変更していません。Stitchの仮の計算・保存処理は移植していません。
- 元の進捗・アニメーション用IDは維持し、SVGの見た目のみを調整しました。ビー玉の移動・再生・動きを減らす設定への応答も既存回帰テストで確認しています。
- 320px / 375pxの全5画面と主要ポップアップを含む42状態で、横はみ出し、ボタン同士の重なり、表示中ボタン中心の遮蔽、モーダルカードの画面外はみ出しを検出していません。
- 前回修正した閉じる操作28ケースも合格しました。時給説明は320×240、320×320、320×568、375×812、667×320、1024×768で先頭・末尾から×と閉じるを実クリック。給料内訳は320px / 375pxで両方の閉じ方を確認しています。
- ワンタッチ時刻の全桁表示、有給欄と入力欄の非重複、本文とナビの分離も継続して確認しています。
- 構文、5画面×5サイズの25ケース、通常・日またぎ・有給の給与例、登録・再読み込み、設定・目標保存、モックのバックアップ・初回同意・認証失敗・期限切れ制御の回帰テストが通過しています。
- 今回は実フォント取得56件、取得失敗0件、撮影時のJavaScript例外0件でした。

[表示・操作・フォントの記録](results.json) / [機能回帰の記録](functional-results.json)

## 追加の確認画像

6画面以外にも時計、説明、時給の登録ボタン、バックアップ欄などを撮影しました。

| 状態 | 375px | 320px |
| --- | --- | --- |
| calendar-register-visible | [画像](375/calendar-register-visible.png) | [画像](320/calendar-register-visible.png) |
| list | [画像](375/list.png) | [画像](320/list.png) |
| settings-backup | [画像](375/settings-backup.png) | [画像](320/settings-backup.png) |
| goal-modal | [画像](375/goal-modal.png) | [画像](320/goal-modal.png) |
| breakdown-modal | [画像](375/breakdown-modal.png) | [画像](320/breakdown-modal.png) |
| income-wall-modal | [画像](375/income-wall-modal.png) | [画像](320/income-wall-modal.png) |
| shift-register-button | [画像](375/shift-register-button.png) | [画像](320/shift-register-button.png) |
| clock-hours | [画像](375/clock-hours.png) | [画像](320/clock-hours.png) |
| clock-minutes | [画像](375/clock-minutes.png) | [画像](320/clock-minutes.png) |
| break-modal | [画像](375/break-modal.png) | [画像](320/break-modal.png) |
| preset-register-modal | [画像](375/preset-register-modal.png) | [画像](320/preset-register-modal.png) |
| shift-help-modal | [画像](375/shift-help-modal.png) | [画像](320/shift-help-modal.png) |
| settings-register-button | [画像](375/settings-register-button.png) | [画像](320/settings-register-button.png) |
| wage-help-modal | [画像](375/wage-help-modal.png) | [画像](320/wage-help-modal.png) |
| wage-help-scrolled | [画像](375/wage-help-scrolled.png) | [画像](320/wage-help-scrolled.png) |

## 検証条件と制限

LINE / Supabaseはモックで、勤務先・金額・シフトは専用ブラウザのテストデータです。表示日は2026年11月11日12:00（Asia/Tokyo）に固定しています。Google Fontsは実ファイルを環境のHTTPSプロキシ経由で取得しています。

実機のiPhone / Android / LINE内ブラウザ、ソフトキーボード、実アカウントでの認証・保存は未検証です。初回の空保存領域でgetSettingsFormHtmlが未定義の設定を参照する既存問題は別途記録しており、今回も機能処理は変更していません。

再実行はリポジトリルートでローカルHTTPサーバーとPlaywrightを使用します（Node.js / Chromium / curlが必要）。

```sh
python -m http.server 8767 --bind 127.0.0.1
# 別ターミナル
node docs/design-review/2026-11-11-luxe/capture.cjs
REVIEW_URL=http://127.0.0.1:8767/ node tests/design-review.cjs
```

変更はPR #8のブランチのみです。mainへのマージ・自動マージ・公開、GitHub Pages設定変更、本番リポジトリ・LINE・Supabase設定への操作は行っていません。
