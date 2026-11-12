import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHandler,ORIGIN,MAX_BYTES,validateBackup} from '../hosshii-backup/handler.mjs';
const START='2026-11-01T03:06:42.846Z',END='2026-11-22T03:06:42.846Z';
const NOW=Date.parse('2026-11-12T12:00:00Z');
const copy=x=>structuredClone(x);
function v2(){const config={jobCount:1};for(const jk of ['job1','job2','job3'])config[jk]={name:jk==='job1'?'架空店舗':'',payHistory:[],payBaseline:null,wageSlots:[],paidHours:8};return {format:'hosshii-shift',schemaVersion:2,exportedAt:'2026-11-12T12:00:00Z',state:{schemaVersion:2,config,shifts:{'2026-11-12':{job1:[{start:'09:00',end:'17:00',breakMins:60}]}},monthlyGoal:50000}};}
const legacy=()=>({mybasket_shifts_v23:{'2026-11-12':{job1:[{start:'09:00',end:'17:00',breakMins:60}]}},mybasket_wages_v77:{jobCount:1,job1:{name:'架空店舗',wageSlots:[],paidHours:8}}});
function setup(options={}) {
 let clock=NOW;
 const user={id:'test-row-A',trial_started_at:START,trial_ends_at:END,consent_accepted_at:START,terms_version:'2026-10-29',privacy_version:'2026-10-29',...options.user};
 const rows=new Map(options.rows||[]);const calls=[];
 let validFetch=async (_url,request)=>{
   const token=request.body.get('id_token');
   const sub=token==='token-B'?'LINE-B':'LINE-A';
   assert.equal(request.body.get('client_id'),'2011929118');
   return Response.json({aud:'2011929118',sub,exp:2000000000});
 };
 const repo={
   async findUser(id){calls.push(['user',id]);if(options.userError)throw Error('SECRET_DB_DETAIL');return options.missing?null:copy(user);},
   async save(id,data,updatedAt){calls.push(['save',id]);if(options.saveError)throw Error('SECRET_DB_DETAIL');rows.set(id,{backup_data:copy(data),updated_at:updatedAt});},
   async load(id){calls.push(['load',id]);if(options.loadError)throw Error('SECRET_DB_DETAIL');if(options.expireOnLoad)clock=Date.parse(END);return rows.get(id)||null;}
 };
 const handler=createHandler({getRepository:()=>{if(options.configError)throw Error('SECRET_CONFIG');return repo;},
   fetchImpl:(...a)=>options.fetchImpl?options.fetchImpl(...a):validFetch(...a),now:()=>clock,verifyTimeoutMs:5});
 const request=(action='save',data=v2(),extra={},origin=ORIGIN)=>new Request('https://offline.invalid/hosshii-backup',{
   method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({action,idToken:'token-A',...(action==='save'?{backupData:data}:{}),...extra})});
 return {handler,request,rows,calls,setClock:v=>clock=v};
}
function parser(){
 const context=vm.createContext({configData:{},shiftsData:{},monthlyGoal:0});
 vm.runInContext(fs.readFileSync(new URL('./reference/prelaunch-model.js',import.meta.url),'utf8'),context);
 // Existing DOM-dependent config builder is replaced only by a history-normalizing test adapter.
 context.buildConfigData=config=>{const result=copy(config);for(const jk of ['job1','job2','job3'])if(result[jk])context.HosshiiPayModel.normalizeJobHistory(result[jk],config[jk]);return result;};
 vm.runInContext(fs.readFileSync(new URL('./reference/prelaunch-core.js',import.meta.url),'utf8'),context);
 return context;
}
test('schema v2 saves and loads without transforming history or state',async()=>{
 const a=setup();const data=v2();data.state.config.job1.payHistory=[{id:'h1',effectiveFrom:'2026-11-01',rates:{wageSlots:[],paid:1200,transMonth:0,transDay:0,allowanceMonth:0,allowanceDay:0,allowanceMemo:''}}];
 assert.equal((await a.handler(a.request('save',data))).status,200);
 const loaded=await (await a.handler(a.request('load'))).json();assert.deepEqual(loaded.backupData,data);
 const parsed=parser().prelaunchParseBackup(loaded.backupData);assert.equal(parsed.config.job1.payHistory[0].id,'h1');assert.equal(parsed.goal,50000);
});
test('real PR9 backup generator envelope accepted',()=>{const p=parser();p.configData=v2().state.config;p.shiftsData=v2().state.shifts;p.monthlyGoal=50000;assert.equal(validateBackup(p.prelaunchBackup()),'v2');});
test('legacy stored data loads unchanged and PR9 parser accepts',async()=>{
 const data=legacy();const a=setup({rows:[['LINE-A',{backup_data:data,updated_at:START}]]});const r=await a.handler(a.request('load'));
 assert.equal(r.status,200);const out=(await r.json()).backupData;assert.deepEqual(out,data);assert.equal(parser().prelaunchParseBackup(out).shifts['2026-11-12'].job1[0].start,'09:00');
 assert.equal(Object.keys(parser().prelaunchParseBackup(out).shifts).length,1);
});
test('legacy v21/v76 compatibility',async()=>{const data={mybasket_shifts_v21:{},mybasket_wages_v76:{}};const a=setup({rows:[['LINE-A',{backup_data:data,updated_at:START}]]});const r=await a.handler(a.request('load'));assert.equal(r.status,200);assert.doesNotThrow(()=>parser().prelaunchParseBackup((data)));});
test('active legacy save remains supported',async()=>{const a=setup();assert.equal((await a.handler(a.request('save',legacy()))).status,200);});
test('unsupported version cannot fall through to legacy',async()=>{const a=setup();const data={...legacy(),schemaVersion:3};assert.equal((await a.handler(a.request('save',data))).status,400);assert.equal(a.rows.size,0);});
test('missing history/config rejected without overwriting old data',async()=>{const old=legacy();const a=setup({rows:[['LINE-A',{backup_data:old,updated_at:START}]]});const data=v2();delete data.state.config.job1.payHistory;assert.equal((await a.handler(a.request('save',data))).status,400);assert.deepEqual(a.rows.get('LINE-A').backup_data,old);});
test('negative goal and array state rejected',async()=>{for(const modify of [d=>d.state.monthlyGoal=-1,d=>d.state=[],d=>d.state.shifts=[],d=>d.state.config.job1.payBaseline={}]){const a=setup();const data=v2();modify(data);assert.equal((await a.handler(a.request('save',data))).status,400);}});
test('expired save and load denied before backup access',async()=>{for(const action of ['save','load']){const a=setup();a.setClock(Date.parse(END));assert.equal((await a.handler(a.request(action))).status,403);assert.equal(a.calls.some(c=>c[0]==='save'||c[0]==='load'),false);}});
test('one millisecond before expiry allowed',async()=>{const a=setup();a.setClock(Date.parse(END)-1);assert.equal((await a.handler(a.request())).status,200);});
test('expires during read: backup is not returned',async()=>{const a=setup({expireOnLoad:true,rows:[['LINE-A',{backup_data:v2(),updated_at:START}]]});const r=await a.handler(a.request('load'));assert.equal(r.status,403);assert.equal(Object.hasOwn(await r.json(),'backupData'),false);});
test('purchased_at does not bypass free trial scope',async()=>{const a=setup({user:{purchased_at:START}});a.setClock(Date.parse(END));assert.equal((await a.handler(a.request())).status,403);});
test('unconsented / future / missing / malformed dates fail closed',async()=>{for(const user of [{consent_accepted_at:null},{terms_version:null},{trial_started_at:'2026-12-01T00:00:00Z',trial_ends_at:'2026-12-22T00:00:00Z'},{trial_ends_at:null},{trial_ends_at:'bad'},{trial_ends_at:'2026-11-23T03:06:42.846Z'}]){const a=setup({user});assert.equal((await a.handler(a.request())).status,403);}});
test('missing registration denied',async()=>{const a=setup({missing:true});assert.equal((await a.handler(a.request())).status,403);});
test('spoofed user IDs ignored in save and load',async()=>{const b=v2();b.state.monthlyGoal=99;const a=setup({rows:[['LINE-B',{backup_data:b,updated_at:START}]]});assert.equal((await a.handler(a.request('save',v2(),{line_user_id:'LINE-B',user_id:'B'}))).status,200);assert.equal(a.rows.get('LINE-B').backup_data.state.monthlyGoal,99);const r=await a.handler(a.request('load',null,{line_user_id:'LINE-B'}));assert.equal((await r.json()).backupData.state.monthlyGoal,50000);assert.ok(a.calls.every(c=>c[1]==='LINE-A'));});
test('different verified identity cannot read A',async()=>{const a=setup({rows:[['LINE-A',{backup_data:v2(),updated_at:START}]]});assert.equal((await a.handler(a.request('load',null,{idToken:'token-B'}))).status,404);assert.equal(a.calls.at(-1)[1],'LINE-B');});
test('invalid/expired/wrong channel identity does not access DB',async()=>{for(const identity of [{aud:'wrong',sub:'LINE-A',exp:2e9},{aud:'2011929118',sub:'',exp:2e9},{aud:'2011929118',sub:'LINE-A',exp:1},{aud:'2011929118',sub:'LINE-A'}]){const a=setup({fetchImpl:async()=>Response.json(identity)});assert.equal((await a.handler(a.request())).status,401);assert.deepEqual(a.calls,[]);}});
test('LINE rejection and service errors separated',async()=>{for(const [remote,expected] of [[400,401],[401,401],[429,502],[500,502]]){const a=setup({fetchImpl:async()=>new Response('',{status:remote})});assert.equal((await a.handler(a.request())).status,expected);assert.deepEqual(a.calls,[]);}});
test('LINE timeout fails closed',async()=>{const a=setup({fetchImpl:async(_url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted'))))});assert.equal((await a.handler(a.request())).status,504);assert.deepEqual(a.calls,[]);});
test('LINE network error fails closed',async()=>{const a=setup({fetchImpl:async()=>{throw Error('offline');}});assert.equal((await a.handler(a.request())).status,502);});
test('DB/config errors sanitized and no false save success',async()=>{for(const opts of [{configError:true},{userError:true},{saveError:true}]){const a=setup(opts);const r=await a.handler(a.request());assert.equal(r.status,500);assert.equal((await r.text()).includes('SECRET'),false);assert.equal(a.rows.size,0);}});
test('load DB error never leaks stored data',async()=>{const a=setup({loadError:true});assert.equal((await a.handler(a.request('load'))).status,500);});
test('stored invalid backup is not migrated or overwritten',async()=>{const old={unsupported:'opaque'};const a=setup({rows:[['LINE-A',{backup_data:old,updated_at:START}]]});assert.equal((await a.handler(a.request('load'))).status,409);assert.deepEqual(a.rows.get('LINE-A').backup_data,old);});
test('missing backup returns compatible 404',async()=>{const a=setup();const r=await a.handler(a.request('load'));assert.equal(r.status,404);assert.equal((await r.json()).ok,false);});
test('origin methods and preflight',async()=>{const a=setup();assert.equal((await a.handler(a.request('save',v2(),{},'https://other.invalid'))).status,403);assert.equal((await a.handler(new Request('https://offline.invalid',{method:'OPTIONS',headers:{origin:ORIGIN}}))).status,204);assert.equal((await a.handler(new Request('https://offline.invalid',{headers:{origin:ORIGIN}}))).status,405);assert.deepEqual(a.calls,[]);});
test('malformed JSON and missing token/action',async()=>{const a=setup();for(const body of ['{','null','[]',JSON.stringify({action:'save'}),JSON.stringify({idToken:'x',action:'delete'})]){const r=await a.handler(new Request('https://offline.invalid',{method:'POST',headers:{origin:ORIGIN},body}));assert.equal(r.status,400);}assert.deepEqual(a.calls,[]);});
test('UTF8 bytes limit, not UTF16 length',async()=>{const a=setup();const d=v2();d.note='あ'.repeat(120000);assert.equal((await a.handler(a.request('save',d))).status,413);assert.deepEqual(a.calls,[]);});
test('declared too-large content denied before reading',async()=>{const a=setup();const r=await a.handler(new Request('https://offline.invalid',{method:'POST',headers:{origin:ORIGIN,'content-length':String(MAX_BYTES+1)},body:'{}'}));assert.equal(r.status,413);});
test('dangerous keys / deeply nested data rejected',async()=>{for(const bad of [JSON.parse('{"__proto__":{}}'),{nested:{constructor:'bad'}}]){const a=setup();assert.equal((await a.handler(a.request('save',{...v2(),bad}))).status,400);}const a=setup();const d=v2();let p=d;for(let i=0;i<45;i++)p=p.child={};assert.equal((await a.handler(a.request('save',d))).status,400);});
test('responses have no-store and correct CORS',async()=>{const a=setup();const r=await a.handler(a.request());assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('access-control-allow-origin'),ORIGIN);});
