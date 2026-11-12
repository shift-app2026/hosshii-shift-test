# バックアップ公開前修正・照合用資料

本番未反映のレビュー用ブランチです。main・PR #8・PR #9・公開アプリ・本番DBは変更していません。

- [単一ファイル版 Edge Function](hosshii-backup.single.ts)
- [修正内容と互換性](README.md)
- [38項目のテスト結果](test-results.txt)
- [単一ファイル版の追加3項目](single-file-results.txt)
- [反映前の確認・手順](RELEASE_CHECKLIST.md)
- [最新の引き渡し状態](SERVER_HANDOFF.md)
- [秘密値を表示しない設定確認方法](SECRET_CHECK.md)

実キー・実トークン・実利用者データなし。テストは明示的な架空の認証文字列・利用者・データのみです。参照ソースはPR #9の固定コミットからの公開コードです。

デザイン側の期限切れ操作制限は対応済みとの報告を受けています。client-guard.patchは旧PR #9向け参考資料です。対応済みの隔離版へ重複適用しないでください。

実LINE/Supabase接続、Deno実ランタイム検証、本番デプロイは未実施。ローカルNodeの模擬試験と、実環境確認を混同しないでください。

テスト実行（Node 24）：node --test tests/*.test.mjs

manifest.jsonは元の18ファイルのチェックサムです。この共有案内は後から加えた19番目のファイルのため対象外です。
