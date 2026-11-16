# 実接続記録（読取と無効認証のみ）

提供された旧友だちURL https://lin.ee/rFOSyVU は301で https://line.me/R/ti/p/@213pakrn?oat_content=url&ts=10312331 へ遷移。デスクトップ200のQR友だち登録ページ。Android/Instagram UAでも同プロフィール、ボタンはLINEのti/p/@213pakrnへのintentです。友だち一覧のnv/friendsへのリダイレクトは観測されませんでした。ネイティブLINEの挙動を再現した検査ではなく、原因は未確定です。現在SNS設置URLとLステップ流入URLは不明。

友だち登録URLとアプリを開くLIFF URLは用途が違います。提案導線: 利用者が友だち登録ボタンを押す→LINEトーク→「無料お試し開始」LIFFボタン。既存友だち向けにもリッチメニュー/キーワードで同ボタンを表示。アプリ内ブラウザーで失敗した場合は標準ブラウザーで開いて明示ボタンを押す案内を用意。設定変更・公開は未実施です。

配信確認対象 https://shift-app2026.github.io/hosshii-shift-trial-verify/ 、LIFF https://liff.line.me/2011929118-NJGUu69C 。Pagesビルドはbuilt、commit1ef93b00274c62d45109098dd9fa06b7472d8066。HTMLとCSS/core/model/ui/configは当該commitとbyte一致。これはLINEチャンネル設定がこのURLを指すことの管理画面確認を代替しません。

隔離Supabase ssfjopzfzsuwcxwirggv のline-trial-status/hosshii-backupはOPTIONS204、Origin https://shift-app2026.github.io、POST/OPTIONS。無効ID tokenは両方401。利用規約/プライバシー文書は200。

有効LINEアカウント・実機・Lステップ管理画面・DBレコード参照環境なし。有効認証/友だち追加/配信/同意/DB保存/実アカウント切替/21日終了/解除再登録/ブラウザー削除は未実施。無効トークンの拒否を、正しい21日記録や本人のデータ保存の合格と扱わないでください。
