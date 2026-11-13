-- Optional read-only metadata collection. NOT executed. No user row values.
BEGIN READ ONLY;
SELECT table_name,column_name,data_type,udt_name,is_nullable,column_default
FROM information_schema.columns WHERE table_schema='public'
AND table_name IN ('app_users','app_backups') ORDER BY table_name,ordinal_position;
SELECT c.relname AS table_name,x.conname,pg_get_constraintdef(x.oid) AS definition
FROM pg_constraint x JOIN pg_class c ON c.oid=x.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('app_users','app_backups');
SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN ('app_users','app_backups');
SELECT tablename,policyname,roles,cmd,qual,with_check FROM pg_policies
WHERE schemaname='public' AND tablename IN ('app_users','app_backups');
SELECT tgname,tgenabled,pg_get_triggerdef(t.oid) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
AND c.relname IN ('app_users','app_backups') AND NOT t.tgisinternal;
-- Function bodies are NOT printed automatically; inspect specified bodies for secrets before sharing.
SELECT routine_schema,routine_name,data_type FROM information_schema.routines
WHERE routine_schema='public' AND routine_name IN
('generate_application_code','prevent_trial_start_change','set_trial_end_date');
COMMIT;
