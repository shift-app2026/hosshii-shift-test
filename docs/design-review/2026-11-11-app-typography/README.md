# 全画面の書体・通常文字色の統一と一括コピー欄の強調

比較元はPR #8先端 `fdd2344`、変更後のアプリコードは `6b247ab` です。変更先は `design/bordeaux-rose-champagne` のみです。

## 変更内容

- シフト登録・予定表の年月、前月／翌月、カレンダーの日付、勤務先名、予定表の日付タイル・勤務時間、設定の主要見出し・勤務先名、はじめにの案内見出しをNoto Serif JPに統一しました。
- 長い説明文、入力欄・時刻入力、下部ナビなどの実用UIはNoto Sans JPを維持しています。説明カードなどは500以上の読みやすい太さを基本にしています。
- 通常の中立色の文字を#302027へ整理しました。ボタン内の白文字、赤い強調、土日祝の色、勤務先の識別マーク・背景色を維持しています。
- お給料画面は確認のみで、今回さらに書体・文字色を変更していません。円グラフ中央の書体・サイズ・太さ・色・行間も維持しています。お給料画面の文字色の最終判断はユーザーのスマートフォン確認後とします。
- 一括コピー欄の文字は14px・太さ800、アイコンは20pxに拡大。背景を淡いローズ#fff0f4にしました。長い指示文なので書体は読みやすいNoto Sans JPです。
- 「実行」ボタンの装飾・寸法・右寄せ・カード内中央配置を維持しました。文字の拡大に伴いカード本文は自然に折り返します。
- HTML・全JavaScriptは比較元と完全一致。確定文言・給与計算・保存・LINE認証・無料体験・Supabase処理には変更がありません。ボタン配置と5画面構成、採用済みの光沢ボルドー・シャンパンゴールドを維持しています。

## 変更前後の比較画像

画像左が変更前、右が変更後です。実Google Fontsを読み込んだChromium、DPR 2で撮影しています。

| 画面・箇所 | 375px | 320px |
| --- | --- | --- |
| お給料 | [比較](375/clock-comparison.png) | [比較](320/clock-comparison.png) |
| 給与内訳 | [比較](375/clock-breakdown-comparison.png) | [比較](320/clock-breakdown-comparison.png) |
| シフト登録 | [比較](375/calendar-comparison.png) | [比較](320/calendar-comparison.png) |
| 一括コピー欄 | [比較](375/calendar-copy-comparison.png) | [比較](320/calendar-copy-comparison.png) |
| 登録ボタン・選択日サマリー | [比較](375/calendar-register-visible-comparison.png) | [比較](320/calendar-register-visible-comparison.png) |
| 予定表 | [比較](375/list-comparison.png) | [比較](320/list-comparison.png) |
| 予定表・今日 | [比較](375/list-today-comparison.png) | [比較](320/list-today-comparison.png) |
| 設定 | [比較](375/settings-comparison.png) | [比較](320/settings-comparison.png) |
| 設定・交通費 | [比較](375/settings-transport-comparison.png) | [比較](320/settings-transport-comparison.png) |
| 設定・その他手当 | [比較](375/settings-other-comparison.png) | [比較](320/settings-other-comparison.png) |
| 設定・バックアップ | [比較](375/settings-backup-comparison.png) | [比較](320/settings-backup-comparison.png) |
| はじめに | [比較](375/guide-comparison.png) | [比較](320/guide-comparison.png) |
| シフト登録ポップアップ | [比較](375/shift-modal-comparison.png) | [比較](320/shift-modal-comparison.png) |
| ポップアップ・登録ボタン | [比較](375/shift-register-button-comparison.png) | [比較](320/shift-register-button-comparison.png) |

## 検証結果と制限

- 320×568・375×812で変更前後56状態を撮影し、左右比較28枚を作成しました。新たな文字切れ・横はみ出し・ボタンの重なりや遮蔽はありませんでした。
- 見出し・勤務先名・日付・勤務時間の書体を計算済みスタイルで確認しています。コピー欄は14px・800・アイコン20px、実行ボタンの寸法・右位置・中央配置の維持を自動確認しました。
- 赤い強調、白文字、土日祝・勤務先の識別色、円中央の書体・サイズ・色等、ボタンの背景・枠線・角丸・余白が変更前後で一致しました。
- 下部ナビ5画面切替、登録ボタンの操作可能性、カレンダーの勤務先マークが日付枠内に収まること、本文と下部ナビの分離も確認しました。
- 主要機能の回帰検証は25状態で通過。給与・日跨ぎ・有給の計算、登録後の再読込、設定と目標の保存、時計・ビー玉、モックでのバックアップ・認証エラー・同意・期限切れ制御を確認しました。JavaScript13スクリプトの構文と、元アプリから表示用変更のみであることも確認しています。
- 設定ヘッダーの長い勤務先名の「…」省略は変更前からの仕様を維持しています。空の保存データで設定描画が失敗する既知問題も元アプリと一致し、今回の変更対象外です。
- 実機LINEブラウザ、ソフトキーボード、実LINE認証・実Supabase接続は未検証です。撮影データは検証用で、認証・クラウドはモックです。

[画面検証詳細](results.json) / [機能検証詳細](functional-results.json) / [撮影スクリプト](capture.cjs)

## 再実行

```sh
REVIEW_URL=http://127.0.0.1:8781/ node docs/design-review/2026-11-11-app-typography/capture.cjs
REVIEW_URL=http://127.0.0.1:8781/ node tests/design-review.cjs
```

mainへのマージ・自動マージ・公開・GitHub Pages設定の変更は行っていません。
