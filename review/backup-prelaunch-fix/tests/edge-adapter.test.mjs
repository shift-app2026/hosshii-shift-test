import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {ORIGIN} from '../hosshii-backup/handler.mjs';
const source=fs.readFileSync(new URL('../hosshii-backup/index.ts',import.meta.url),'utf8');
async function setup(keyPresent=true){
 const calls=[];let handler;
 const now=Date.now();const start=new Date(now-86400000).toISOString();const end=new Date(now+20*86400000).toISOString();
 const user={id:'fake-row',trial_started_at:start,trial_ends_at:end,consent_accepted_at:start,terms_version:'x',privacy_version:'x'};
 const legacy={mybasket_shifts_v23:{},mybasket_wages_v77:{}};
 const old={Deno:globalThis.Deno,fetch:globalThis.fetch,client:globalThis.__fakeCreateClient};
 globalThis.Deno={env:{get(name){if(name==='SUPABASE_URL')return 'https://offline.invalid';if(name==='SUPABASE_SECRET_KEYS')return keyPresent?'{"default":"FAKE-LOCAL-KEY"}':undefined;throw Error('unexpected env read');}},serve(value){handler=value;}};
 globalThis.fetch=async()=>Response.json({aud:'2011929118',sub:'VERIFIED-OWNER',exp:Math.floor(now/1000)+3600});
 globalThis.__fakeCreateClient=(url,key)=>{
  assert.equal(url,'https://offline.invalid');assert.equal(key,'FAKE-LOCAL-KEY');
  return {from(table){calls.push(['from',table]);return {
    select(columns){calls.push(['select',columns]);return this;},
    eq(field,id){calls.push(['eq',field,id]);return this;},
    async maybeSingle(){return {error:null,data:table==='app_users'?user:{backup_data:legacy,updated_at:start}};},
    async upsert(row,options){calls.push(['upsert',row,options]);return {error:null};}
  };}};
 };
 let code=stripTypeScriptTypes(source,{mode:'strip'});
 code=code.replace("import { createClient } from 'npm:@supabase/supabase-js@2';",'const createClient=globalThis.__fakeCreateClient;');
 code=code.replace("'./handler.mjs'",JSON.stringify(new URL('../hosshii-backup/handler.mjs',import.meta.url).href));
 await import('data:text/javascript;base64,'+Buffer.from(code+'\n// '+Math.random()).toString('base64'));
 return {handler,calls,legacy,restore(){globalThis.Deno=old.Deno;globalThis.fetch=old.fetch;globalThis.__fakeCreateClient=old.client;}};
}
const request=(action,data)=>new Request('https://offline.invalid',{method:'POST',headers:{origin:ORIGIN},body:JSON.stringify({action,idToken:'fake-token',backupData:data,line_user_id:'ATTACKER-SUPPLIED'})});
test('actual Edge adapter save uses verified owner and existing conflict key',async()=>{const a=await setup();try{assert.equal((await a.handler(request('save',a.legacy))).status,200);const write=a.calls.find(c=>c[0]==='upsert');assert.equal(write[1].line_user_id,'VERIFIED-OWNER');assert.equal(write[2].onConflict,'line_user_id');assert.ok(a.calls.find(c=>c[0]==='select')[1].includes('trial_ends_at'));}finally{a.restore();}});
test('actual Edge adapter load filters owner and retains response contract',async()=>{const a=await setup();try{const r=await a.handler(request('load'));assert.equal(r.status,200);assert.deepEqual((await r.json()).backupData,a.legacy);assert.ok(a.calls.filter(c=>c[0]==='eq').every(c=>c[1]==='line_user_id'&&c[2]==='VERIFIED-OWNER'));}finally{a.restore();}});
test('missing fake default key fails safely without DB call',async()=>{const a=await setup(false);try{assert.equal((await a.handler(request('save',a.legacy))).status,500);assert.deepEqual(a.calls,[]);}finally{a.restore();}});
