# 無料体験・実接続テストの作成準備

## 状態

**接続未設定・未公開・未デプロイ。** このブランチのコードを既存本番へ配置しない。

基準: verify/backup-contract-integration / ebfaae68d6726844da1a55f7dbd1767db0928e8c。
設定専用ブランチ: verify/trial-launch-real-connection。

- index.htmlのSupabase接続定数とLIFF IDをisolated-config.jsの空設定へ差し替え。
- enabled=false、端末編集不可、CSP connect-src 'none'で通信遮断。
- 本番プロジェクトと既存LIFFは準備ガードで明示拒否。無効設定のままLINEログイン・状態取得・バックアップを開始しない。
- 隔離用Edge FunctionsはISOLATED_TEST_MODE=trueとISOLATED_TEST_PROJECT_REFが未設定なら503。指定refとSUPABASE_URL不一致・本番refでも拒否。ガード段階で認証キーを読まない。
- supabase/config.tomlはローカル未リンクの隔離設定案。JWT検証OFF、関数内LINE検証は維持。実プロジェクトの設定変更はなし。

[DB確認事項](docs/DB_REQUIREMENTS.md) / [配置対象](docs/FILES.json) / [作成方法・費用・影響](docs/SETUP_PLAN.md) / [12テスト結果](docs/isolation-test-results.txt)

## ソースと配置対象

アプリ資産は基準コミットを継承。index.html以外の給与・保存・表示処理は変更しない。DBのデータや秘密値をソースに含めない。

supabase/functions/line-trial-status/index.tsはユーザー共有の実コードを基に隔離ガードだけ追加。既存のpurchased_at判定は維持し、Square対応はしない。hosshii-backup/index.tsは照合済みsingle.tsに隔離ガードを追加。共通ガードは_shared/isolation.ts。

静的サイトはtools/prepare-isolated-site.pyの許可リストから作る。リポジトリroot全体をそのまま公開しない。review/docs/tests/supabase、旧テストHTMLは配布対象外。manifestの実ファイルが基準コミットにないためindexの参照は省略。規約リンクは同じテストサイトのコピーへ向ける。

例（ファイル生成のみ、公開なし）:

```sh
python3 tools/prepare-isolated-site.py --output /tmp/hosshii-isolated-site
node --test tests/isolation-config.test.mjs
```

## 承認後に行うこと

1. 無料枠と使用可能なリポジトリ名を確認。新規Supabase/GitHub Pages/専用LIFFを承認後に作成。
2. 実定義と一致するDB定義を確定し、新規隔離DBにだけ作成（今回はSQL未実行）。
3. 新LIFF ID、新Supabase refを確認後に別の設定コミットで入力。CSPはその隔離SupabaseとLIFF動作に必要な通信先だけを許可する。今回のconnect-src noneは意図的な起動停止で、設定値を埋めただけでは接続しない。
4. 隔離側にISOLATED_TEST_MODE/ISOLATED_TEST_PROJECT_REFを設定。SUPABASE_URLとdefaultキーは新プロジェクト自身のものを使用。値はログ・GitHubに載せない。
5. Deno型/実行検査、プロジェクトのJWTとCORS照合後に隔離側だけへ配置。
6. 専用LINE利用者のテストデータのみで実接続。既存利用者データはコピーしない。
7. 結果報告。本番反映はさらに別途承認。

今回の12テストは設定・誤接続防止だけの新規ローカル試験。既存42テストや画面52項目は再実行しない。Nodeで型除去・偽Deno/偽SDKを用い、外部への認証・DB接続はなし。実Deno/Supabase/LINEの結合検証ではない。
