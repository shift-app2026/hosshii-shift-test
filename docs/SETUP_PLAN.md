# 新規環境の作成方法・費用・既存環境への影響

**準備資料のみ。まだ作成しない。** 2026-11-13に公式資料確認。

## Supabase

案名: hosshii-shift-trial-verify。DashboardのNew projectでFreeの組織/枠を確認し、新しいDBパスワードを秘密管理して作成する。Pro組織へ追加すると料金が発生し得るのでFreeかを確認し、有料化・本番プロジェクトの停止で枠を空ける操作は行わない。

Freeは原則2つのactiveプロジェクト枠。残り枠は管理画面未確認。低活動で停止する制限あり。無料枠がなければ作成せず再相談する。既存プロジェクトの設定/データは変更しない。

新規project-ref決定後にURLを設定。2表の定義・必要関数/トリガー/UNIQUE/RLSだけを再現。既存データ・既存秘密値は移さない。認証はLINE公式へ実照合するが、DBは新規隔離プロジェクトのもののみ。テストデータには専用アカウントを使う。

費用: Freeの枠内なら追加月額0円。利用枠・停止制限を受け、無停止保証はない。

公式: https://supabase.com/docs/guides/platform/billing-faq
https://supabase.com/docs/guides/platform/free-project-pausing

## GitHubリポジトリ/Pages

案名: shift-app2026/hosshii-shift-trial-verify（未作成・名前使用可否未確認）。新規publicリポジトリを作成し、配置許可リストから生成した静的ファイルだけをコピー。既存mainをそのままミラーしない。秘密値を入れない。Actions/Pagesの自動公開は、公開承認までは有効化しない。

公開承認後に新規リポジトリのPagesだけを設定。予定URLはhttps://shift-app2026.github.io/hosshii-shift-trial-verify/。既存hosshii-shift-line/hosshii-shift-testのPagesソース・公開先は変更しない。

GitHub Freeはpublic repositoryのPages利用が可能。追加月額0円の構成案。URLは閲覧可能な公開ページになるため、利用者のデータ・秘密値・診断ログは置かない。GitHub Pages自体を認証保護する案ではない。

公式: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## LINE LIFF

SAkosan配下の既存LINEログインチャネル2011929118のLIFFタブで別アプリを追加する案。名前は「ほっしーシフト 接続検証」、Endpointは新規テストURL、Scopeはopenid/profile。IDは作成時に採番されるため現在は空欄。既存LIFF 2011929118-Fyk1pdlUのEndpoint/Scope/公開状態は変更しない。

チャネルは共用するためLINEユーザーIDは本番と同じプロバイダー単位になるが、保存先は新規DBに限定する。新LIFF追加は既存チャネルへの追加設定なので、既存LIFF無変更とは区別して承認する。Messaging API/Lステップ/Webhookの変更・通知送信は不要。

1チャネル最大30 LIFF。空き数は未確認。LIFF追加に新規の月額有料サービスは使わない。本試験でMessaging API配信枠は消費しない。

公式: https://developers.line.biz/en/docs/liff/registering-liff-apps/

## 管理者が承認する次の単位

- 新規無料Supabase・新規GitHubリポジトリ・テスト専用LIFFの作成。
- 新規隔離側だけのDB定義作成、関数/静的ファイル配置、Pages公開。
- 専用利用者によるテストデータ書込み。

これらは今回の設定ブランチ作成の承認に含めず、別途承認を得る。既存本番のDB更新・デプロイ、main/PR #8/PR #9の更新、LINE通知・実決済は対象外。
