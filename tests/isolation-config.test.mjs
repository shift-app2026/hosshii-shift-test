import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const config=fs.readFileSync(new URL('../isolated-config.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const isolation=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/_shared/isolation.ts',import.meta.url),'utf8'));
const helper=await import('data:text/javascript;base64,'+Buffer.from(isolation).toString('base64'));
const defaultContext=()=>{const c=vm.createContext({window:{},URL});vm.runInContext(config,c);return c;};
test('all connection values empty and disabled',()=>{const c=defaultContext();assert.equal(c.window.HOSSHII_ISOLATED_CONFIG.enabled,false);for(const k of ['liffId','statusEndpoint','backupEndpoint'])assert.equal(c.window.HOSSHII_ISOLATED_CONFIG[k],'');assert.equal(c.window.hosshiiReadOnly,true);assert.equal(c.window.hosshiiIsolatedReady(),false);});
test('unconfigured app has network-blocking CSP before SDK',()=>{assert.ok(html.includes("connect-src 'none'"));assert.ok(html.indexOf('isolated-config.js')<html.indexOf('static.line-scdn.net'));});
test('HTML has no production connection literals or existing LIFF ID',()=>{assert.equal(html.includes('https://urwmuafkmlgzanpiksfv.supabase.co'),false);assert.equal(html.includes('2011929118-Fyk1pdlU'),false);assert.equal(html.includes('href="./manifest.webmanifest"'),false);});
test('production endpoints and existing LIFF explicitly denied',()=>{const c=defaultContext();const valid={enabled:true,liffId:'2011929118-FAKETEST',statusEndpoint:'https://abcdefghijklmnopqrst.supabase.co/functions/v1/line-trial-status',backupEndpoint:'https://abcdefghijklmnopqrst.supabase.co/functions/v1/hosshii-backup'};for(const x of [{...valid,liffId:'2011929118-Fyk1pdlU'},{...valid,statusEndpoint:'https://urwmuafkmlgzanpiksfv.supabase.co/functions/v1/line-trial-status',backupEndpoint:'https://urwmuafkmlgzanpiksfv.supabase.co/functions/v1/hosshii-backup'},{...valid,backupEndpoint:'https://xxxxxxxxxxxxxxxxxxxx.supabase.co/functions/v1/hosshii-backup'}]){c.window.HOSSHII_ISOLATED_CONFIG=x;assert.equal(c.window.hosshiiIsolatedReady(),false);}});
test('LIFF initialization stops before consent or SDK access',async()=>{const c=defaultContext();const messages=[];c.showError=x=>messages.push(x);const start=html.indexOf('async function initialize(){');const end=html.indexOf('\n  }',start)+4;assert.ok(start>0);vm.runInContext(html.slice(start,end),c);await c.initialize();assert.equal(messages.length,1);});
test('backup request stops before token read or network',async()=>{const c=defaultContext();const start=html.indexOf('async function hosshiiBackupRequest(action, backupData) {');const end=html.indexOf('\n    }',start)+6;assert.ok(start>0);vm.runInContext(html.slice(start,end),c);await assert.rejects(c.hosshiiBackupRequest('save',{}),/未設定/);});
test('backend readiness never requests credentials',()=>{const names=[];assert.equal(helper.isolatedEnvironmentReady(name=>{names.push(name);return undefined;}),false);assert.ok(names.every(n=>!n.includes('SECRET')&&!n.includes('KEY')));});
test('backend denies production project and mismatched project URL',()=>{for(const e of [{ISOLATED_TEST_MODE:'true',ISOLATED_TEST_PROJECT_REF:'urwmuafkmlgzanpiksfv',SUPABASE_URL:'https://urwmuafkmlgzanpiksfv.supabase.co'},{ISOLATED_TEST_MODE:'true',ISOLATED_TEST_PROJECT_REF:'abcdefghijklmnopqrst',SUPABASE_URL:'https://urwmuafkmlgzanpiksfv.supabase.co'}])assert.equal(helper.isolatedEnvironmentReady(n=>e[n]),false);});
test('backend metadata can match only an explicitly enabled test project',()=>{const e={ISOLATED_TEST_MODE:'true',ISOLATED_TEST_PROJECT_REF:'abcdefghijklmnopqrst',SUPABASE_URL:'https://abcdefghijklmnopqrst.supabase.co'};assert.equal(helper.isolatedEnvironmentReady(n=>e[n]),true);});
for(const name of ['line-trial-status','hosshii-backup'])test(`${name}: unset config returns 503 without LINE/DB/secret access`,async()=>{
 let captured;const calls=[];const oldDeno=globalThis.Deno,oldFetch=globalThis.fetch;
 globalThis.Deno={env:{get(n){calls.push(n);if(/SECRET|KEY/.test(n))throw Error('unexpected credential access');return undefined;}},serve(fn){captured=fn;}};
 globalThis.fetch=async()=>{throw Error('NETWORK MUST NOT RUN');};
 try {
 let src=fs.readFileSync(new URL(`../supabase/functions/${name}/index.ts`,import.meta.url),'utf8');
 src=src.replace(/import "jsr:@supabase\/functions-js\/edge-runtime.d.ts";/,'');
 src=src.replace(/import \{ createClient \} from [^;]+;/,"const createClient=()=>{throw Error('DB MUST NOT RUN');};");
 src=src.replace("'../_shared/isolation.ts'",JSON.stringify('data:text/javascript;base64,'+Buffer.from(isolation).toString('base64')));
 const js=stripTypeScriptTypes(src);await import('data:text/javascript;base64,'+Buffer.from(js+'\n//'+name).toString('base64'));
 const response=await captured(new Request('https://offline.invalid',{method:'POST',body:'{}'}));assert.equal(response.status,503);assert.ok(calls.every(n=>!n.includes('SECRET')));
 }finally{globalThis.Deno=oldDeno;globalThis.fetch=oldFetch;}
});
test('static manifest includes required assets but excludes legacy test HTML',()=>{const m=JSON.parse(fs.readFileSync(new URL('../docs/FILES.json',import.meta.url)));for(const f of ['index.html','prelaunch-core.js','prelaunch-model.js','prelaunch-ui.js','terms.html','privacy.html'])assert.ok(m.sourceFiles.some(x=>x.path===f));assert.ok(m.exclude.includes('test_初回同意_連携版_index_20261029.html'));});
