# 完成版ZIPに合わせたアイコン・書体・装飾の再調整

撮影対象：**`0a03de2a9492ddf2dcca9ebd20599cb76a2278c7`**。PR #8の `design/bordeaux-rose-champagne` ブランチのみを変更しました。今回の完成版ZIPとデザイン説明を参照し、既存の確定仕様・文言を優先しています。

## 今回の変更

| 対象 | 調整 |
| --- | --- |
| 内訳 | 🕒勤務時間・📋時給／有給・🚃交通費／手当の装飾アイコンを追加。ラベルの確定文言はそのままです |
| 予定表 | 日付と曜日を2段のタイルに分割。♥と›を追加し、勤務先のカラーマークと「お給料日」の文言は維持。TODAYバッジをゴールドのグラデーションにしました |
| 設定 | ☂有給・🚃交通費・⭐その他の装飾。既存の入力・保存・バックアップ操作は維持しています |
| はじめに | 🌸🌷を淡いローズのメダリオンに配置。📲🔄🧾を既存の案内見出しに追加。元の文章のまま導入カード・案内カードを装飾しました |
| ポップアップ | 日付ナビをボルドーの帯にし、白い日付・ゴールドの前日／翌日操作ラベルに調整しました |
| リング・真珠 | 金縁を細く控えめにし、中心を白に近づけました。ビー玉は白いハイライトと反射アークを残し、温かい金色のパールへ調整しています |
| 書体・余白 | Noto Serif JP・Noto Sans JP・Cinzelの役割を保ち、金額・内訳・案内のサイズ、太さ、字間・行間・カード余白を調整。入力欄の16px文字は維持しています |
| 完成版との整合 | 年月・設定見出しを両側の✦に戻しました。独自の見出しアイコンより、内容のそばの機能アイコンを優先しています |

採用済みの光沢ボルドーボタン、下部ナビのSVG、前回修正した閉じる操作とナビの領域確保は維持しています。320pxで3件の勤務マークが日付タイルをはみ出さないよう、マークのサイズと間隔も調整しています。

## 維持した仕様と検証方法

**表示項目・計算仕様・確定文言を変更せず、達成率表示は追加していません。** 予定表の勤務先名を復活させるなどの表示項目追加や、Stitchの仮の計算・自動加算・保存処理の移植は行っていません。

今回、日付の2段表示や装飾用spanのため、9か所の描画テンプレートだけを変更しています。これらを[レビュー済みの対応表](../../../tests/view-markup-changes.json)で逆変換すると、元HTMLのJavaScript全13ブロックと完全一致します。計算、日付判定、登録、保存、LINE認証、体験期間判定、Supabase・バックアップの処理はそのままです。イベント属性も元HTMLと一致しています。

- 動的テンプレート：装飾要素を除いた確定文言が9か所すべて一致することを自動確認。
- 静的本文：修正前`6c9403e`と比較し、装飾・空白を除いた確定文言の一致を確認。[結果](wording-results.json)
- 実Google Fontsで320×568 / 375×812 CSS pxの6画面と詳細を撮影（48枚、DPR 2）。横はみ出し、表示中ボタンの重なり・遮蔽、モーダルカードのはみ出しは0件でした。
- 時給説明の先頭・末尾から×と閉じるを操作し、給料内訳も含め28ケース合格。320×240 / 320×320 / 320×568 / 375×812 / 667×320 / 1024×768を確認しています。
- 時刻の全桁表示、有給説明と金額欄の非重複、本文とナビの分離、日付帯の背景、カレンダーマークがタイル内に収まることも確認しています。
- 構文、5画面×5サイズの25ケース、給与例（日またぎ・有給含む）、登録・再読み込み、設定・目標保存、ビー玉・時計、モックのバックアップ、同意・認証失敗・期限切れ制御の回帰テストが通過しました。
- 実フォント取得失敗0件、撮影時のJavaScript例外0件。LINE / Supabaseはモックで、本番データや実アカウントには接続していません。

[表示・操作の記録](results.json) / [機能回帰の記録](functional-results.json)

## 6画面の画像

画像は画面内の表示領域です。長い内容はスクロールして確認します。予定表は当日の勤務が見える位置です。

| 画面 | 375px | 320px |
| --- | --- | --- |
| お給料・リング・真珠 | [画像](375/clock.png) | [画像](320/clock.png) |
| シフト登録カレンダー | [画像](375/calendar.png) | [画像](320/calendar.png) |
| 予定表・日付タイル・ハート・矢印 | [画像](375/list-today.png) | [画像](320/list-today.png) |
| 設定 | [画像](375/settings.png) | [画像](320/settings.png) |
| はじめに・カードと花の装飾 | [画像](375/guide.png) | [画像](320/guide.png) |
| シフト登録ポップアップ・日付帯 | [画像](375/shift-modal.png) | [画像](320/shift-modal.png) |

## アイコン・操作の詳細画像

| 箇所 | 375px | 320px |
| --- | --- | --- |
| 内訳の🕒📋🚃 | [画像](375/clock-breakdown.png) | [画像](320/clock-breakdown.png) |
| 有給の☂と時給登録 | [画像](375/settings-register-button.png) | [画像](320/settings-register-button.png) |
| 交通費の🚃 | [画像](375/settings-transport.png) | [画像](320/settings-transport.png) |
| その他の⭐ | [画像](375/settings-other.png) | [画像](320/settings-other.png) |
| バックアップ | [画像](375/settings-backup.png) | [画像](320/settings-backup.png) |
| 時給説明・固定の閉じる | [画像](375/wage-help-modal.png) | [画像](320/wage-help-modal.png) |
| 時給説明・本文末尾 | [画像](375/wage-help-scrolled.png) | [画像](320/wage-help-scrolled.png) |
| ワンタッチ時刻 | [画像](375/preset-register-modal.png) | [画像](320/preset-register-modal.png) |
| 時計・時 | [画像](375/clock-hours.png) | [画像](320/clock-hours.png) |
| 時計・分 | [画像](375/clock-minutes.png) | [画像](320/clock-minutes.png) |

<details><summary>その他の画像</summary>

- calendar-register-visible：[375px](375/calendar-register-visible.png) / [320px](320/calendar-register-visible.png)
- list：[375px](375/list.png) / [320px](320/list.png)
- goal-modal：[375px](375/goal-modal.png) / [320px](320/goal-modal.png)
- breakdown-modal：[375px](375/breakdown-modal.png) / [320px](320/breakdown-modal.png)
- income-wall-modal：[375px](375/income-wall-modal.png) / [320px](320/income-wall-modal.png)
- shift-register-button：[375px](375/shift-register-button.png) / [320px](320/shift-register-button.png)
- break-modal：[375px](375/break-modal.png) / [320px](320/break-modal.png)
- shift-help-modal：[375px](375/shift-help-modal.png) / [320px](320/shift-help-modal.png)

</details>

## 検証範囲と再実行

Chromiumでの確認です。日付は2026年11月11日12:00（Asia/Tokyo）に固定したテストデータです。実機のLINE内ブラウザ、ソフトキーボード、実LINE認証・Supabaseへの保存・復元、サーバー側21日間体験は未検証です。保存領域が空の初回起動でgetSettingsFormHtmlが未定義設定を参照する既存問題は、元HTMLでも再現し、今回も機能処理は変更していません。

Node.js / Playwright / Chromium / curlがある環境でリポジトリルートから実行します。

```sh
python -m http.server 8767 --bind 127.0.0.1
# 別ターミナル
node docs/design-review/2026-11-11-complete/capture.cjs
node docs/design-review/2026-11-11-complete/check-wording.cjs
REVIEW_URL=http://127.0.0.1:8767/ node tests/design-review.cjs
```

mainへのマージ・自動マージ・公開、GitHub Pages設定、本番リポジトリ・LINE・Supabase設定への変更は行っていません。
