/** Isolated release candidate. No environment reads, listeners or real network by itself. */
export const CHANNEL_ID = '2011929118';
export const ORIGIN = 'https://shift-app2026.github.io';
export const MAX_BYTES = 350000;
const DAY = 86400000;
const own = (x,k) => Object.hasOwn(x,k);
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
class RequestError extends Error {
  constructor(status, code, message) { super(message); this.status=status; this.code=code; }
}
function error(status,code,message) { throw new RequestError(status,code,message); }
function date(value) {
  if(typeof value!=='string' || !/(Z|[+-]\d{2}:\d{2})$/.test(value)) return NaN;
  return Date.parse(value);
}
export function hasActiveTrial(user,now) {
  if(!user?.consent_accepted_at || !user.terms_version || !user.privacy_version) return false;
  const start=date(user.trial_started_at),end=date(user.trial_ends_at);
  return Number.isFinite(start) && Number.isFinite(end) && end-start===21*DAY && start<=now && now<end;
}
function guardTree(value,depth=0) {
  if(depth>40) error(400,'INVALID_BACKUP','バックアップの階層が深すぎます。');
  if(value && typeof value==='object') for(const [key,child] of Object.entries(value)) {
    if(['__proto__','prototype','constructor'].includes(key)) error(400,'INVALID_BACKUP','バックアップに使用できない項目があります。');
    guardTree(child,depth+1);
  }
}
export function validateBackup(data) {
  if(!object(data)) error(400,'INVALID_BACKUP','バックアップデータの形式が違います。');
  guardTree(data);
  if(own(data,'schemaVersion')) {
    const s=data.state;
    if(data.schemaVersion!==2 || data.format!=='hosshii-shift' || !object(s) || s.schemaVersion!==2
       || !object(s.config) || !object(s.shifts) || !Number.isSafeInteger(s.monthlyGoal) || s.monthlyGoal<0)
      error(400,'INVALID_BACKUP','対応していないバックアップ形式です。');
    // Match PR #9 envelope/history requirements. Payroll semantic validation stays in the client parser.
    for(const jk of ['job1','job2','job3']) {
      const job=s.config[jk];
      if(!object(job) || !own(job,'payHistory') || !Array.isArray(job.payHistory) || !own(job,'payBaseline')
        || (job.payBaseline!==null && (!object(job.payBaseline)||!Array.isArray(job.payBaseline.wageSlots))))
        error(400,'INVALID_BACKUP','設定履歴が不足しています。');
    }
    return 'v2';
  }
  // Legacy content is returned unchanged; only the client migrates it on restore.
  const shiftKey=['mybasket_shifts_v23','mybasket_shifts_v22','mybasket_shifts_v21'].find(k=>own(data,k));
  const wageKey=['mybasket_wages_v77','mybasket_wages_v76'].find(k=>own(data,k));
  if(!shiftKey || !wageKey || !object(data[shiftKey]) || !object(data[wageKey]))
    error(400,'INVALID_BACKUP','バックアップデータの形式が違います。');
  return 'legacy';
}
async function readJson(req) {
  const length=req.headers.get('content-length');
  if(length && /^\d+$/.test(length) && Number(length)>MAX_BYTES)
    error(413,'TOO_LARGE','バックアップの容量が大きすぎます。');
  const reader=req.body?.getReader();
  if(!reader) error(400,'INVALID_REQUEST','リクエストが不正です。');
  let bytes=0;const chunks=[];
  try {
    for(;;) {
      const {done,value}=await reader.read();if(done)break;
      bytes+=value.byteLength;
      if(bytes>MAX_BYTES) { await reader.cancel();error(413,'TOO_LARGE','バックアップの容量が大きすぎます。'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const all=new Uint8Array(bytes);let offset=0;
  for(const chunk of chunks) {all.set(chunk,offset);offset+=chunk.byteLength;}
  try {return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));}
  catch {error(400,'INVALID_REQUEST','リクエストが不正です。');}
}
export function createHandler({getRepository,fetchImpl=fetch,now=()=>Date.now(),verifyTimeoutMs=8000}) {
  return async function handler(req) {
    const origin=req.headers.get('origin')??'';
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
    if(origin===ORIGIN) Object.assign(headers,{'Access-Control-Allow-Origin':origin,
      'Access-Control-Allow-Headers':'authorization, apikey, content-type',
      'Access-Control-Allow-Methods':'POST, OPTIONS'});
    const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
    if(origin!==ORIGIN) return reply({error:'許可されていないアクセスです。',code:'ORIGIN_DENIED'},403);
    if(req.method==='OPTIONS') return new Response(null,{status:204,headers:{...headers,'Access-Control-Max-Age':'600'}});
    if(req.method!=='POST') return reply({error:'POSTのみ利用できます。',code:'METHOD_DENIED'},405);
    try {
      const body=await readJson(req);
      if(!object(body)||!['save','load'].includes(body.action)||typeof body.idToken!=='string'||!body.idToken)
        error(400,'INVALID_REQUEST','リクエストが不正です。');
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),verifyTimeoutMs);
      let identity;
      try {
        const verified=await fetchImpl('https://api.line.me/oauth2/v2.1/verify',{
          method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
          body:new URLSearchParams({id_token:body.idToken,client_id:CHANNEL_ID}),signal:controller.signal});
        if(!verified.ok) {
          if(verified.status>=500 || verified.status===429) error(502,'AUTH_UNAVAILABLE','本人確認サービスに接続できません。');
          error(401,'AUTH_FAILED','LINEの本人確認に失敗しました。');
        }
        identity=await verified.json();
      } catch(e) {
        if(e instanceof RequestError) throw e;
        if(controller.signal.aborted) error(504,'AUTH_TIMEOUT','LINEの本人確認がタイムアウトしました。');
        error(502,'AUTH_UNAVAILABLE','本人確認サービスに接続できません。');
      } finally {clearTimeout(timer);}
      if(identity?.aud!==CHANNEL_ID || typeof identity?.sub!=='string' || !identity.sub
        || !Number.isFinite(identity.exp) || now()>=identity.exp*1000)
        error(401,'AUTH_FAILED','LINEユーザーを確認できません。');
      const lineUserId=identity.sub; // Ignore all client-supplied owner IDs.
      const repo=getRepository();
      const user=await repo.findUser(lineUserId);
      if(!user) error(403,'NOT_REGISTERED','利用登録を確認できません。');
      const authorize=()=>{if(!hasActiveTrial(user,now())) error(403,'TRIAL_INACTIVE','無料体験期間外のためクラウド保存・復元は利用できません。端末への書き出しは引き続き利用できます。');};
      authorize();
      if(body.action==='save') {
        validateBackup(body.backupData);
        authorize();
        await repo.save(lineUserId,body.backupData,new Date(now()).toISOString());
        return reply({ok:true,message:'バックアップを保存しました。'});
      }
      const data=await repo.load(lineUserId);
      authorize(); // Do not return data if expiration occurs while reading.
      if(!data) return reply({ok:false,message:'保存済みのバックアップはありません。'},404);
      try {validateBackup(data.backup_data);}
      catch {error(409,'STORED_BACKUP_INVALID','保存済みバックアップの形式を確認できません。上書きせずお問い合わせください。');}
      return reply({ok:true,backupData:data.backup_data,updatedAt:data.updated_at});
    } catch(e) {
      // Never log raw token, request body, DB details or secret values.
      if(e instanceof RequestError) return reply({error:e.message,code:e.code},e.status);
      return reply({error:'処理に失敗しました。もう一度お試しください。',code:'INTERNAL_ERROR'},500);
    }
  };
}
