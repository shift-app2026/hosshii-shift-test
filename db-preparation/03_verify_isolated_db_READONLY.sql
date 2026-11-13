-- SELECT ONLY. Run after approved isolated creation. No user rows are read.
-- Text deparse formatting differences must be reviewed, not auto-fixed.

-- 1. Columns and identities (includes unexpected/missing columns).
WITH expected(table_name,column_order,column_name,column_type,not_null,default_expression,identity_kind,generated_kind) AS (VALUES
('app_backups','1','id','bigint','true',NULL,'a',''),
('app_backups','2','line_user_id','text','true',NULL,'',''),
('app_backups','3','backup_data','jsonb','true',NULL,'',''),
('app_backups','4','updated_at','timestamp with time zone','true','now()','',''),
('app_users','1','id','bigint','true',NULL,'d',''),
('app_users','2','created_at','timestamp with time zone','true','now()','',''),
('app_users','3','line_user_id','text','true',NULL,'',''),
('app_users','4','trial_started_at','timestamp with time zone','false',NULL,'',''),
('app_users','5','purchased_at','timestamp with time zone','false',NULL,'',''),
('app_users','6','square_payment_id','text','false',NULL,'',''),
('app_users','7','subscription_status','text','false',NULL,'',''),
('app_users','8','subscription_id','text','false',NULL,'',''),
('app_users','9','subscription_ends_at','timestamp with time zone','false',NULL,'',''),
('app_users','10','last_payment_at','timestamp with time zone','false',NULL,'',''),
('app_users','11','payment_status','text','false',NULL,'',''),
('app_users','12','trial_ends_at','timestamp with time zone','false',NULL,'',''),
('app_users','13','consent_accepted_at','timestamp with time zone','false',NULL,'',''),
('app_users','14','terms_version','text','false',NULL,'',''),
('app_users','15','privacy_version','text','false',NULL,'',''),
('app_users','16','application_code','text','true','generate_application_code()','',''),
('app_users','17','square_customer_id','text','false',NULL,'','')
), actual AS (
 SELECT c.relname::text table_name,a.attnum::text column_order,a.attname::text column_name,
 format_type(a.atttypid,a.atttypmod) column_type,a.attnotnull::text not_null,
 pg_get_expr(d.adbin,d.adrelid) default_expression,a.attidentity::text identity_kind,a.attgenerated::text generated_kind
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 JOIN pg_attribute a ON a.attrelid=c.oid LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
 WHERE n.nspname='public' AND c.relname IN ('app_users','app_backups') AND a.attnum>0 AND NOT a.attisdropped
)
SELECT coalesce(e.table_name,a.table_name) table_name,coalesce(e.column_name,a.column_name) column_name,
 (a.column_order,a.column_type,a.not_null,replace(a.default_expression,'public.',''),a.identity_kind,a.generated_kind)
 IS NOT DISTINCT FROM
 (e.column_order,e.column_type,e.not_null,replace(e.default_expression,'public.',''),e.identity_kind,e.generated_kind) AS matches
FROM expected e FULL JOIN actual a USING(table_name,column_name)
ORDER BY table_name,column_name;

-- 2. Constraints.
WITH expected(table_name,name,definition,validated,deferrable,initially_deferred) AS (VALUES
('app_backups','app_backups_line_user_id_key','UNIQUE (line_user_id)','true','false','false'),
('app_backups','app_backups_pkey','PRIMARY KEY (id)','true','false','false'),
('app_users','app_users_line_user_id_key','UNIQUE (line_user_id)','true','false','false'),
('app_users','app_users_pkey','PRIMARY KEY (id)','true','false','false'),
('app_users','app_users_square_payment_id_key','UNIQUE (square_payment_id)','true','false','false'),
('app_users','trial_dates_check','CHECK (trial_started_at IS NULL OR trial_ends_at IS NULL OR trial_ends_at = (trial_started_at + ''21 days''::interval))','true','false','false')
), actual AS (
 SELECT c.relname::text table_name,x.conname::text name,pg_get_constraintdef(x.oid,true) definition,
 x.convalidated::text validated,x.condeferrable::text deferrable,x.condeferred::text initially_deferred
 FROM pg_constraint x JOIN pg_class c ON c.oid=x.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname IN ('app_users','app_backups')
)
SELECT coalesce(e.table_name,a.table_name) table_name,coalesce(e.name,a.name) name,
 (a.definition,a.validated,a.deferrable,a.initially_deferred) IS NOT DISTINCT FROM
 (e.definition,e.validated,e.deferrable,e.initially_deferred) AS matches
FROM expected e FULL JOIN actual a USING(table_name,name) ORDER BY table_name,name;

-- 3. All 8 indexes; preserve the apparently redundant line_user_id index.
WITH expected(table_name,name,is_primary,is_unique,is_valid,definition) AS (VALUES
('app_backups','app_backups_line_user_id_key','false','true','true','CREATE UNIQUE INDEX app_backups_line_user_id_key ON public.app_backups USING btree (line_user_id)'),
('app_backups','app_backups_pkey','true','true','true','CREATE UNIQUE INDEX app_backups_pkey ON public.app_backups USING btree (id)'),
('app_users','app_users_application_code_unique','false','true','true','CREATE UNIQUE INDEX app_users_application_code_unique ON public.app_users USING btree (application_code)'),
('app_users','app_users_line_user_id_key','false','true','true','CREATE UNIQUE INDEX app_users_line_user_id_key ON public.app_users USING btree (line_user_id)'),
('app_users','app_users_line_user_id_unique','false','true','true','CREATE UNIQUE INDEX app_users_line_user_id_unique ON public.app_users USING btree (line_user_id)'),
('app_users','app_users_pkey','true','true','true','CREATE UNIQUE INDEX app_users_pkey ON public.app_users USING btree (id)'),
('app_users','app_users_square_customer_id_unique','false','true','true','CREATE UNIQUE INDEX app_users_square_customer_id_unique ON public.app_users USING btree (square_customer_id)'),
('app_users','app_users_square_payment_id_key','false','true','true','CREATE UNIQUE INDEX app_users_square_payment_id_key ON public.app_users USING btree (square_payment_id)')
), actual AS (
 SELECT t.relname::text table_name,i.relname::text name,x.indisprimary::text is_primary,
 x.indisunique::text is_unique,x.indisvalid::text is_valid,pg_get_indexdef(i.oid) definition
 FROM pg_index x JOIN pg_class t ON t.oid=x.indrelid JOIN pg_class i ON i.oid=x.indexrelid
 JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND t.relname IN ('app_users','app_backups')
)
SELECT coalesce(e.table_name,a.table_name) table_name,coalesce(e.name,a.name) name,
 (a.is_primary,a.is_unique,a.is_valid,a.definition) IS NOT DISTINCT FROM
 (e.is_primary,e.is_unique,e.is_valid,e.definition) AS matches
FROM expected e FULL JOIN actual a USING(table_name,name) ORDER BY table_name,name;

-- 4. Trigger definitions and enabled state.
WITH expected(table_name,name,definition) AS (VALUES
('app_users','protect_trial_start','CREATE TRIGGER protect_trial_start BEFORE UPDATE ON app_users FOR EACH ROW EXECUTE FUNCTION prevent_trial_start_change()'),
('app_users','set_trial_end_date_trigger','CREATE TRIGGER set_trial_end_date_trigger BEFORE INSERT OR UPDATE OF trial_started_at ON app_users FOR EACH ROW EXECUTE FUNCTION set_trial_end_date()')
), actual AS (
 SELECT c.relname::text table_name,t.tgname::text name,pg_get_triggerdef(t.oid,true) definition,t.tgenabled
 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname IN ('app_users','app_backups') AND NOT t.tgisinternal
)
SELECT coalesce(e.table_name,a.table_name) table_name,coalesce(e.name,a.name) name,
 a.definition IS NOT DISTINCT FROM e.definition AND a.tgenabled='O' AND e.name IS NOT NULL AS matches
FROM expected e FULL JOIN actual a USING(table_name,name) ORDER BY table_name,name;

-- 5. Function definitions. Return boolean comparison, not actual function body.
WITH expected(function_name,definition) AS (VALUES
('generate_application_code','CREATE OR REPLACE FUNCTION public.generate_application_code()
 RETURNS text
 LANGUAGE sql
 SET search_path TO ''''
AS $function$
  SELECT upper(encode(extensions.gen_random_bytes(12), ''hex''));
$function$
'),
('prevent_trial_start_change','CREATE OR REPLACE FUNCTION public.prevent_trial_start_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.trial_started_at IS NOT NULL
     AND NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at THEN
    RAISE EXCEPTION ''Trial start date cannot be changed'';
  END IF;

  RETURN NEW;
END;
$function$
'),
('set_trial_end_date','CREATE OR REPLACE FUNCTION public.set_trial_end_date()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''''
AS $function$
BEGIN
  IF NEW.trial_started_at IS NOT NULL THEN
    NEW.trial_ends_at := NEW.trial_started_at + INTERVAL ''21 days'';
  END IF;

  RETURN NEW;
END;
$function$
')
)
SELECT e.function_name,p.oid IS NOT NULL AS exists,
 replace(pg_get_functiondef(p.oid),chr(13),'')=e.definition AS definition_matches,
 NOT p.prosecdef AS security_invoker,p.proconfig AS settings
FROM expected e LEFT JOIN pg_proc p ON p.proname=e.function_name AND p.pronamespace='public'::regnamespace
 AND p.pronargs=0 AND p.prokind='f' ORDER BY e.function_name;

-- 6. RLS enabled, FORCE off, zero policies; missing tables appear as false.
WITH expected(name) AS (VALUES ('app_users'),('app_backups'))
SELECT e.name,c.oid IS NOT NULL AS exists,
 coalesce(c.relrowsecurity AND NOT c.relforcerowsecurity
 AND NOT EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid=c.oid),false) AS matches
FROM expected e LEFT JOIN pg_class c ON c.relname=e.name AND c.relnamespace='public'::regnamespace
ORDER BY e.name;

-- 7. Dependency metadata only. Does not call gen_random_bytes.
SELECT n.nspname schema_name,p.proname,pg_get_function_identity_arguments(p.oid) arguments,
 pg_get_function_result(p.oid) result_type,e.extname,e.extversion
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
LEFT JOIN pg_depend d ON d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e'
LEFT JOIN pg_extension e ON e.oid=d.refobjid AND d.refclassid='pg_extension'::regclass
WHERE n.nspname='extensions' AND p.proname='gen_random_bytes';

-- 8. Exact sequence settings still require the additional source export.
-- Never select last_value, is_called or user rows.
SELECT c.relname AS table_name,a.attidentity AS identity_kind,
 sn.nspname AS sequence_schema,sc.relname AS sequence_name,
 format_type(s.seqtypid,NULL) AS sequence_type,s.seqstart AS start_value,
 s.seqincrement AS increment_by,s.seqmin AS min_value,s.seqmax AS max_value,
 s.seqcache AS cache_size,s.seqcycle AS cycle
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
JOIN pg_attribute a ON a.attrelid=c.oid AND a.attname='id' AND NOT a.attisdropped
LEFT JOIN pg_class sc ON sc.oid=pg_get_serial_sequence(format('%I.%I',n.nspname,c.relname),'id')::regclass
LEFT JOIN pg_namespace sn ON sn.oid=sc.relnamespace
LEFT JOIN pg_sequence s ON s.seqrelid=sc.oid
WHERE n.nspname='public' AND c.relname IN ('app_users','app_backups') ORDER BY c.relname;

-- 9. Privileges/timezone metadata: compare with the additional source export.
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
