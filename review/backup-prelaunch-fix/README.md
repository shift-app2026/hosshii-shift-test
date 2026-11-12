# 無料体験公開前・バックアップ最小修正候補

本番未反映。Supabase・LINEへ接続せず、架空のLINE検証応答・メモリ内保存で作成/検証したリリース候補です。DB変更はありません。GitHub main/PR #8/PR #9/公開版は変更していません。

## 成果物

- hosshii-backup/index.ts: Supabaseアダプターを含むEdge Functionエントリー。
- hosshii-backup/handler.mjs: 認証後の本人限定操作・期限判定・形式検証・HTTP処理。
- client-guard.patch: PR #9のクラウド保存・復元入口に現在時刻の利用判定を追加する差分案。未適用。
- tests/: 今回の修正に限定した38テストとPR #9固定参照ソース。
- test-results.txt: 全結果（38成功、0失敗）。前段の42項目は実行していません。
- SECRET_CHECK.md: 秘密値を表示しない設定確認手順。
- RELEASE_CHECKLIST.md: 承認後の手順と未検証事項。

Node 24のローカル実行:

```sh
node --test tests/*.test.mjs
```

外部サービスのキーは不要です。EdgeアダプターテストはTypeScriptをNode組込み機能で型除去し、Supabase SDKとDenoを偽物に差し替えます。実SDK/Denoの型検査・実接続試験とは異なります。

## 修正内容

1. PR #9のformat=hosshii-shift、schemaVersion=2、state.schemaVersion=2を受け入れる。
2. config/shifts/monthlyGoal、job1〜3の履歴保持用項目を検証。履歴・下書きを変換/削除せず保存。
3. 旧mybasket形式は読み込み時に元のまま返す。クライアント側の既存移行処理を使う。旧形式の保存も継続。
4. 検証済み本人のapp_usersを読み、同意あり・開始済み・21日期間内の場合だけsave/loadを許可。終了時刻と同時刻から403。
5. 期限切れ・同意なし・不正日付・未来の開始・未登録ではバックアップの保存/取得を行わない。load中に期限到来した場合も内容を返さない。
6. APIでの他人のID指定は使用しない。保存/読込とも検証済みsubを使う。
7. PR #9差分はhosshiiBlockEdit()を経由して期限を再確認。端末へのexportAppData関数は元ソースと同一で、書き出しを拒否する条件を追加しない。

付随する限定的な保護: LINE確認の8秒タイムアウト、aud/exp確認、本文のUTF-8 350000バイト上限、JSON異常の400、秘密情報を含むエラー本文/ログの抑止。容量上限は以前の文字数基準より厳しくなります。旧保存済みデータの読み込みにはこのリクエスト上限を適用しません。

## バックアップ互換性の範囲

PR #9 head 3a1e7748c4cef28a2bd4a056b150baa70679ac4dのprelaunch-core.js/prelaunch-model.jsを固定して参照。実prelaunchBackup/validatePrelaunchEnvelope/prelaunchParseBackup/モデル処理をテストで使用。DOMに依存するbuildConfigDataは履歴正規化のみ行うテストアダプターで代替。全画面/Android/完全な復元UIの結合試験ではありません。

サーバーは外枠・履歴項目・コンテナの型を検証し、給与計算の全ルールは複製していません。既存クライアントの復元検証を維持します。将来版schemaVersion=3などは旧形式として誤受理しません。不正な既存データは409で止め、上書き/自動移行/削除はしません。

## 利用期限と購入の扱い

今回は無料体験公開専用です。purchased_atだけでクラウド権限を解除しません。有料利用者への対応はSquare連携側の期限判定完成後に統合します。ユーザー共有ではpurchased_atあり0件。公開直前に前提が変わっていないことを確認します。

saveの認可は書込み呼出し直前のサーバー時刻で行います。認可後のDB処理中に時刻が境界を跨ぐ場合まで、コミット時刻を厳密に制約するものではありません。DB変更なしの今回の範囲では、開始前に認可した操作として扱います。

既存line-trial-statusは変更しません。バックアップ用のSELECTに既存の期限/同意カラムを加えるだけです。既存RLS・トリガーは変更せず、サービス権限でも検証済み本人の行だけを選びます。
