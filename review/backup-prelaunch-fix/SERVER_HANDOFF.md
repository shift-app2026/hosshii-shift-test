# サーバー候補の引き渡し状態

## 状態

schemaVersion:2対応・旧形式読込・同意/21日期限によるsave/load制限は隔離環境の候補で実装済み。今回、ローカルimport不足を避ける単一ファイルhosshii-backup.single.tsを作成。サーバー側のロジックは前段38テスト済みのhandler.mjsと同一。DB移行不要。

単一ファイルについて偽Supabase SDK/偽Deno/偽LINEで3スモークテスト成功（本人限定保存、本人限定読込、default未設定の安全な失敗）。旧38テストや画面側52項目は再実行していない。3テストは新しい単一ファイル成果物の配置構成確認であり、実Deno/Supabase接続の成功を意味しない。

## 画面側との対応

ユーザー報告: verify/trial-launch-isolated / d3f33a4で期限切れクラウド操作制限、通信中/開きっぱなし期限到来、端末書き出し維持が対応済み。

接続中のGitHub shift-app2026/hosshii-shift-testではd3f33a4が422、指定refのprelaunch-core.jsが404。ローカル未push等の可能性があるが原因は未確定。コードを直接照合できていない。既存PR #9 head 3a1e7748c4cef28a2bd4a056b150baa70679ac4dを基準に検証済み。最新の隔離版ソース共有で形式と応答を最終照合する。

client-guard.patchは旧PR #9向け参考差分。デザイン側が対応済みなので今回の統合には適用しない。同じ修正を重複適用しない。画面側コード・ブランチへの操作なし。

接続契約: POST {action:'save'|'load', idToken, backupData?}。save成功は{ok:true,message}、load成功は{ok:true,backupData,updatedAt}、未保存404、体験期間外403、LINE認証失敗401、DB設定不足/DBエラー500、認証サービス障害502、認証タイムアウト504。すべてno-store、公開予定GitHub Pages originのCORSを維持。端末書き出しはサーバーに依存しない。

## 承認前に残ること

- 最新のデザイン隔離版ソースを取得し、schemaVersion2と403処理・期限後の端末書き出しが維持されているかを差分確認。
- SUPABASE_SECRET_KEYS.defaultはSECRET_CHECK.mdに従い設定有無を確認する。今回取得/表示していない。
- Deno実ランタイム・Supabase実接続の隔離検証。今回実施していない。
- 専用テスト利用者による保存/復元は書き込みを伴うため承認後。既存利用者のバックアップで試さない。
- 本番デプロイは別途承認後。承認対象の候補はhosshii-backup.single.ts。2ファイル版と併用して二重起動しない。

本番デプロイ・DB変更・main/PR #8/PR #9・公開版・LINE設定の変更なし。Squareは保留。
