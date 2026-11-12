// Release candidate only. Not deployed. Requires handler.mjs alongside this file.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHandler } from './handler.mjs';

function getRepository() {
  const url = Deno.env.get('SUPABASE_URL');
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS');
  const key = raw ? JSON.parse(raw)?.default : null;
  if (!url || typeof key !== 'string' || !key.trim()) {
    throw new Error('Supabase configuration missing');
  }
  const db = createClient(url, key, {auth:{persistSession:false,autoRefreshToken:false}});
  return {
    async findUser(lineUserId: string) {
      const {data,error} = await db.from('app_users')
        .select('id,trial_started_at,trial_ends_at,consent_accepted_at,terms_version,privacy_version')
        .eq('line_user_id',lineUserId).maybeSingle();
      if (error) throw error;
      return data;
    },
    async save(lineUserId: string, backupData: unknown, updatedAt: string) {
      const {error} = await db.from('app_backups').upsert({
        line_user_id:lineUserId,backup_data:backupData,updated_at:updatedAt
      },{onConflict:'line_user_id'});
      if (error) throw error;
    },
    async load(lineUserId: string) {
      const {data,error} = await db.from('app_backups').select('backup_data,updated_at')
        .eq('line_user_id',lineUserId).maybeSingle();
      if (error) throw error;
      return data;
    }
  };
}
Deno.serve(createHandler({getRepository}));
