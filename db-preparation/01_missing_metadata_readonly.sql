-- SELECT ONLY. No table rows, sequence current values or credentials.
-- A. Exact IDENTITY creation settings (not current counter values).
WITH identity_sequences AS (
 SELECT c.relname AS table_name,a.attidentity::text AS identity_kind,
 pg_get_serial_sequence(format('%I.%I',n.nspname,c.relname),a.attname)::regclass AS seq_oid
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 JOIN pg_attribute a ON a.attrelid=c.oid
 WHERE n.nspname='public' AND c.relname IN ('app_users','app_backups')
 AND a.attname='id' AND a.attnum>0 AND NOT a.attisdropped
)
SELECT jsonb_agg(jsonb_build_object(
 'table_name',i.table_name,'identity_kind',i.identity_kind,
 'sequence_schema',n.nspname,'sequence_name',c.relname,
 'sequence_type',format_type(s.seqtypid,NULL),
 'start_value',s.seqstart,'increment_by',s.seqincrement,
 'min_value',s.seqmin,'max_value',s.seqmax,'cache_size',s.seqcache,'cycle',s.seqcycle
) ORDER BY i.table_name) AS identity_settings
FROM identity_sequences i JOIN pg_class c ON c.oid=i.seq_oid
JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_sequence s ON s.seqrelid=c.oid;

-- B. Dependency owner extension/schema/version; function itself is not executed.
SELECT n.nspname AS function_schema,p.proname,
 pg_get_function_identity_arguments(p.oid) AS arguments,
 pg_get_function_result(p.oid) AS result_type,e.extname,e.extversion,en.nspname AS extension_schema
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
LEFT JOIN pg_depend d ON d.classid='pg_proc'::regclass AND d.objid=p.oid
 AND d.deptype='e' AND d.refclassid='pg_extension'::regclass
LEFT JOIN pg_extension e ON e.oid=d.refobjid
LEFT JOIN pg_namespace en ON en.oid=e.extnamespace
WHERE n.nspname='extensions' AND p.proname='gen_random_bytes';

-- C. Object ownership/grants and default privileges. Catalog metadata only.
SELECT c.relname AS object_name,c.relkind,c.relowner::regrole::text AS owner,
 c.relacl::text AS acl
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('app_users','app_backups')
ORDER BY object_name;

-- Sequence ownership/ACL using OIDs to avoid search_path-dependent names.
SELECT c.relname AS sequence_name,c.relowner::regrole::text AS owner,c.relacl::text AS acl
FROM pg_class c
WHERE c.oid IN (
 pg_get_serial_sequence('public.app_users','id')::regclass,
 pg_get_serial_sequence('public.app_backups','id')::regclass
);

SELECT p.proname AS function_name,p.proowner::regrole::text AS owner,p.proacl::text AS acl
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN
 ('generate_application_code','prevent_trial_start_change','set_trial_end_date') AND p.pronargs=0;

SELECT d.defaclrole::regrole::text AS role_name,n.nspname AS schema_name,
 d.defaclobjtype AS object_type,d.defaclacl::text AS default_acl
FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace
WHERE d.defaclnamespace=0 OR n.nspname='public';

SELECT table_name,column_name,grantee,privilege_type,is_grantable
FROM information_schema.column_privileges
WHERE table_schema='public' AND table_name IN ('app_users','app_backups')
ORDER BY table_name,column_name,grantee,privilege_type;

-- D. Session timezone affecting timestamptz + interval '21 days'.
SELECT current_setting('TimeZone') AS session_timezone,
 current_setting('server_version') AS postgres_version;

-- Only timezone-specific role/database overrides; no other settings printed.
SELECT CASE WHEN s.setdatabase=0 THEN 'all databases' ELSE d.datname END AS database_scope,
 CASE WHEN s.setrole=0 THEN 'all roles' ELSE r.rolname END AS role_scope,setting AS timezone_setting
FROM pg_db_role_setting s LEFT JOIN pg_database d ON d.oid=s.setdatabase
LEFT JOIN pg_roles r ON r.oid=s.setrole
CROSS JOIN LATERAL unnest(s.setconfig) setting
WHERE lower(split_part(setting,'=',1))='timezone';
