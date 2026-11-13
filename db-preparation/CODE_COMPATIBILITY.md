# コードと受領DB定義の整合

対象: verify/trial-launch-real-connection / 4a18cf848bd6f79bc423e61aa968d6a7bcfc86d6のSupabase関数。ローカル同一ソースと受領メタデータを比較。実DBアクセスはしない。

| 処理 | 判定 |
|---|---|
| line-trial-statusのSELECTカラム | 全項目がapp_users17列に存在 |
| 新規INSERTのid省略 | bigint BY DEFAULT IDENTITYで採番可能。UUIDを供給しない |
| application_code省略 | NOT NULL+generate_application_code()で採番。依存関数の存在/権限は追加確認 |
| 同意/文書版/体験開始保存 | nullable列と型が一致。BEFORE INSERTトリガーで終了日生成 |
| 同時INSERTの23505処理 | line_user_id一意性と整合。ただし番号衝突等の23505もあり得る。再取得失敗は安全なエラーになる |
| 体験開始の変更防止 | OLDが非NULLかつNEWが異なる場合に拒否。NULLから初回設定は許可 |
| 終了日時 | BEFORE INSERT/UPDATE OF trial_started_atで開始+21日。CHECKも一致。ただしNULL片側はCHECK許容で、Edge側の不整合拒否を維持 |
| app_users.id参照 | bigintで存在。値を本人認証やクライアント指定IDに流用しない |
| バックアップupsert | line_user_id UNIQUEがありonConflictに対応。idはALWAYS IDENTITYで省略できる |
| backup_data保存 | jsonb NOT NULL。schemaVersion2/旧形式のJSONオブジェクトを格納できる |
| updated_at | timestamptz NOT NULL DEFAULT now()。APIのISO日時指定とも整合 |
| 他人の行の排除 | DBのRLSだけに依存せず、検証済みLINE subでeq/upsertする。サービスキーはRLSを迂回し得る |
| RLS/ポリシー0 | クライアントへの直接DBアクセスを新たに開放する必要なし。サービスロールの実GRANTは未取得 |

構造上の明白な不一致は見当たらない。IDENTITY設定、依存拡張、実権限、Timezoneが未取得なので「同等DBを構築/接続試験できた」という結論ではない。

今回のDB準備でコードの変更は不要。既存の試験用billingスキーマ（UUID fixture）は採用しない。Squareの権限・テーブルも導入しない。
