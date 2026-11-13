# 隔離DB定義の確認状況（SQL未実行）

必要なのはapp_users/app_backupsの定義だけ。既存データ、Squareテーブル、既存秘密値はコピーしない。

確認済み（ユーザー報告）:

- app_users/app_backupsのline_user_id UNIQUE、両テーブルRLS有効、確認範囲でポリシーなし。
- trial_dates_check: 開始/終了が両方ある場合に開始+21日を要求。
- protect_trial_start: enabled O / BEFORE UPDATE / EACH ROW / prevent_trial_start_change。
- set_trial_end_date_trigger: enabled O / BEFORE INSERT OR UPDATE OF trial_started_at / EACH ROW / set_trial_end_date。
- application_code: text NOT NULL、generate_application_code()既定値。UNIQUEの有無は未確認。
- purchased_at、last_payment_at、subscription_ends_atはtimestamptz、subscription_status/payment_status/square ID群はtext。

実関数が使うカラム:

- line-trial-status: app_users.line_user_id/trial_started_at/trial_ends_at/purchased_at/consent_accepted_at/terms_version/privacy_version/application_code/subscription_id/subscription_status/payment_status。
- hosshii-backup: app_users.id/line_user_id/体験日時/同意日時/文書版、app_backups.line_user_id/backup_data/updated_at。

未取得（推測DDLで同等と扱わない）:

- app_users.idの型/既定値と全NOT NULL/デフォルト、日時カラムの完全な定義。
- app_backups.backup_dataの実型（json/jsonb等）、idなど付随必須項目/外部キー/更新トリガー。
- generate_application_code()、prevent_trial_start_change()、set_trial_end_date()の実定義全文と関数属性。
- RLSの全ポリシー、権限GRANT、全トリガーと全制約の実定義。

隔離DB作成は未承認のため、書込みSQL/推測スキーマは実行・投入しない。既存integration/01_preflight_readonly.sqlを参考にメタデータと重複件数だけ確認し、実値を含まないschema-only定義を承認前にレビューする。必要なら対象2表の権限/関数だけを抽出する。定義内に秘密が埋め込まれていないことも確認する。

app_usersの既存購入フラグ判定は今回の共有実コードを維持する。隔離テストでは購入済み行を作らず、Square連携は対象外。バックアップ側は無料体験内だけ許可する。
