// Client contract tests only. LINE and Supabase responses are simulated, never contacted.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const origin=process.env.TRIAL_TEST_ORIGIN||'http://127.0.0.1:8910';
assert.equal(new URL(origin).hostname,'127.0.0.1','Local copy only');
const out='/workspace/trial-launch-verification';fs.mkdirSync(out,{recursive:true});
const report={kind:'mock-client-contracts-not-live-integration',cases:[],unexpectedRequests:[],pageErrors:[]};
const now='2026-11-12T03:00:00.000Z',future='2026-12-03T03:00:00.000Z';
async function fixture(browser,width=375){
 const context=await browser.newContext({viewport:{width,height:812},timezoneId:'Asia/Tokyo',isMobile:true,hasTouch:true});
 const control={status:{status:'trialing',trialExpiresAt:future},http:200,raw:null,loggedIn:true,token:'synthetic-test-token',statusRequests:[],backupRequests:[],backup:null,backupHttp:200,backupOk:true};
 await context.route('**/*',async route=>{
  const req=route.request(),url=req.url();
  if(url.startsWith(origin+'/'))return route.continue();
  if(url.startsWith('https://static.line-scdn.net/'))return route.fulfill({contentType:'application/javascript',body:`window.liff={init:async()=>{if(window.__initError)throw Error('mock init failure')},isLoggedIn:()=>window.__loggedIn!==false,login:opts=>{window.__loginRedirect=opts.redirectUri},getIDToken:()=>window.__token===null?null:window.__token||'synthetic-test-token'}`});
  if(url==='https://urwmuafkmlgzanpiksfv.supabase.co/functions/v1/line-trial-status'){
   control.statusRequests.push(req.postDataJSON());
   if(control.hang)return;
   return route.fulfill({status:control.http,contentType:'application/json',body:control.raw??JSON.stringify(control.status)});
  }
  if(url==='https://urwmuafkmlgzanpiksfv.supabase.co/functions/v1/hosshii-backup'){
   const body=req.postDataJSON();control.backupRequests.push(body);
   if(control.backupOk&&control.backupHttp===200&&body.action==='save')control.backup=structuredClone(body.backupData);
   return route.fulfill({status:control.backupHttp,json:{ok:control.backupOk,backupData:control.backup,error:control.backupOk?undefined:'mock rejected'}});
  }
  if(url.startsWith('https://fonts.googleapis.com/'))return route.fulfill({contentType:'text/css',body:''});
  report.unexpectedRequests.push(url);return route.abort();
 });
 const page=await context.newPage();page.on('pageerror',e=>report.pageErrors.push(e.message));await page.clock.install({time:new Date(now)});await page.clock.resume();
 async function load(){await page.goto(origin);await page.waitForFunction(()=>window.liff&&window.hosshiiRefreshEntitlement);await page.waitForTimeout(80);}
 async function refresh(){await page.waitForTimeout(150);await page.evaluate(()=>window.hosshiiRefreshEntitlement());await page.waitForTimeout(100);}
 async function state(){return page.evaluate(()=>({readOnly:window.hosshiiReadOnly===true,gate:!document.getElementById('lineAuthGate').hidden}));}
 async function close(){await context.close();}
 return {page,context,control,load,refresh,state,close,width};
}
function pass(name,width){report.cases.push({name,width,passed:true});console.log(width||'',name,'passed');}
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
 try{
 for(const width of [320,375]){
  const f=await fixture(browser,width),{page:p,control:c}=f;await f.load();await p.waitForFunction(()=>document.getElementById('lineAuthGate').hidden);assert.equal((await f.state()).readOnly,false);pass('future-trial-allowed',width);
  for(const field of ['trialExpiresAt','trial_ends_at','trialEndsAt','trialEndAt']){c.status={status:'trialing',[field]:future};await f.refresh();assert.equal((await f.state()).readOnly,false);pass('expiry-field-'+field,width);}
  for(const [name,status] of Object.entries({exactExpiry:{status:'trialing',trialExpiresAt:now},missingExpiry:{status:'trialing'},invalidExpiry:{status:'active',trialExpiresAt:'invalid'},expiredConflict:{status:'expired',trialActive:true,trialExpiresAt:future},blocked:{status:'blocked',trialExpiresAt:future},pastDue:{status:'past_due',trialActive:true}})){
   c.status=status;await f.refresh();assert.equal((await f.state()).readOnly,true,name);assert.equal(await p.evaluate(()=>setDayShifts('2026-11-12','job1',[{start:'09:00',end:'17:00',breakMins:60}])),false);pass(name+'-denies-write',width);
  }
  c.status={status:'trialing',trialExpiresAt:future};await f.refresh();assert.equal((await f.state()).readOnly,false);pass('recover-with-valid-trial',width);
  c.status={status:'new',consentRequired:true};await f.refresh();assert.equal((await f.state()).gate,true);assert.equal((await f.state()).readOnly,true);assert(await p.locator('#lineAuthStart').isDisabled());await p.locator('#lineAuthAgree').check();assert(await p.locator('#lineAuthStart').isDisabled());await p.locator('#lineAuthAgeAgree').check();assert(await p.locator('#lineAuthStart').isEnabled());
  const before=c.statusRequests.length;c.status={status:'trialing',trialExpiresAt:future};await p.locator('#lineAuthStart').click();await p.waitForFunction(()=>document.getElementById('lineAuthGate').hidden);assert.equal(c.statusRequests.length,before+1);assert.deepEqual(c.statusRequests.at(-1),{idToken:'synthetic-test-token',consentAccepted:true,termsVersion:'2026-10-29',privacyVersion:'2026-10-29'});pass('explicit-consent-request-and-age-gate',width);
  for(const http of [401,403,500]){c.http=http;c.status={error:'mock authentication/server failure'};await f.refresh();assert.equal((await f.state()).readOnly,true);assert(await p.locator('[data-entitlement-retry]').first().isVisible());pass('status-http-'+http+'-denied',width);}
  c.http=200;c.raw='{';await f.refresh();assert.equal((await f.state()).readOnly,true);c.raw=null;c.status={status:'unknown'};await f.refresh();assert.equal((await f.state()).readOnly,true);pass('malformed-and-unknown-status-denied',width);
  c.status={status:'trialing',trialExpiresAt:future};await p.evaluate(()=>window.__token='synthetic-refreshed-token');await f.refresh();assert.equal(c.statusRequests.at(-1).idToken,'synthetic-refreshed-token');assert.equal((await f.state()).readOnly,false);pass('fresh-line-token-after-retry',width);
  await p.evaluate(()=>window.__token=null);const n=c.statusRequests.length;await f.refresh();assert.equal(c.statusRequests.length,n);assert.equal((await f.state()).readOnly,true);pass('missing-token-no-server-request',width);await p.evaluate(()=>window.__token='synthetic-test-token');await f.refresh();
  // Server ACK and preserved envelope, not real Supabase storage semantics.
  const backup=await p.evaluate(()=>prelaunchBackup());await p.evaluate(()=>hosshiiCloudBackupSave());assert.equal(c.backup.schemaVersion,2);assert.deepEqual(c.backup.state,backup.state);assert((await p.locator('#alertModalText').textContent()).includes('Supabaseに保存しました'));await p.evaluate(()=>closeAlertModal());pass('mock-save-preserves-v2-envelope',width);
  for(const http of [401,500]){c.backupHttp=http;c.backupOk=false;await p.evaluate(()=>hosshiiCloudBackupSave());assert(!(await p.locator('#alertModalText').textContent()).includes('Supabaseに保存しました'));assert((await p.locator('#alertModalText').textContent()).includes('保存できませんでした'));await p.evaluate(()=>closeAlertModal());pass('backup-failure-'+http+'-no-success',width);}
  c.backupHttp=200;c.backupOk=true;const stored=await p.evaluate(()=>localStorage.getItem(PRELAUNCH_STATE_KEY));const valid=structuredClone(c.backup);delete c.backup.state.config.job1.payHistory;await p.evaluate(()=>hosshiiCloudBackupLoad());assert((await p.locator('#alertModalText').textContent()).includes('履歴'));assert.equal(await p.evaluate(()=>localStorage.getItem(PRELAUNCH_STATE_KEY)),stored);await p.evaluate(()=>closeAlertModal());c.backup=valid;pass('stripped-history-rejected-without-overwrite',width);
  c.status={status:'expired'};await f.refresh();await p.locator('#btn-settings').click();const count=c.backupRequests.length;await p.locator('button[onclick="hosshiiCloudBackupSave(event)"]').click();await p.waitForFunction(()=>!hosshiiCloudBackupBusy);assert.equal(c.backupRequests.length,count+1);assert.equal(c.backupRequests.at(-1).action,'save');await p.evaluate(()=>closeAlertModal());const count2=c.backupRequests.length;await p.evaluate(()=>hosshiiCloudBackupLoad());assert.equal(c.backupRequests.length,count2);pass('expired-export-allowed-restore-denied',width);
  await p.screenshot({path:path.join(out,`${width}-expired.png`)});await f.close();
 }
 for(const which of ['logged-out','init-failure','missing-initial-token']){
  const x=await fixture(browser);await x.page.addInitScript(which=>{if(which==='logged-out')window.__loggedIn=false;if(which==='init-failure')window.__initError=true;if(which==='missing-initial-token')window.__token=null;},which);await x.load();assert.equal(x.control.statusRequests.length,0);assert.equal((await x.state()).gate,true);if(which==='logged-out')assert.equal(await x.page.evaluate(()=>window.__loginRedirect),origin+'/');else assert(await x.page.locator('#lineAuthRetry').isVisible());pass('line-'+which);await x.close();
 }
 const f=await fixture(browser);f.control.status={status:'new'};await f.load();await f.page.waitForFunction(()=>!document.getElementById('lineAuthConsent').hidden);await f.page.screenshot({path:path.join(out,'375-consent.png')});await f.close();
 const t=await fixture(browser);await t.load();await t.page.waitForFunction(()=>document.getElementById('lineAuthGate').hidden);t.control.hang=true;await t.page.evaluate(()=>{void window.hosshiiRefreshEntitlement()});await t.page.waitForTimeout(50);await t.page.clock.fastForward(10001);await t.page.waitForFunction(()=>window.hosshiiStatusReason==='unavailable');assert.equal((await t.state()).readOnly,true);t.control.hang=false;await t.refresh();assert.equal((await t.state()).readOnly,false);pass('status-timeout-and-retry');await t.close();
 assert.deepEqual(report.unexpectedRequests,[]);assert.deepEqual(report.pageErrors,[]);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'contracts.json'),JSON.stringify(report,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1});
