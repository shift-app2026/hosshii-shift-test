const assert=require('node:assert/strict'),fs=require('fs');
const {chromium,scenario,input,makeToken}=require('./browser-helper.cjs');
const out='/workspace/output/prelaunch-fix-20261116';fs.mkdirSync(out,{recursive:true});
const report={kind:'real-Chromium-Web-Locks-and-storage-with-mocked-LINE-not-Android-hardware',cases:[],errors:[]};
const record=(name)=>{report.cases.push(name);console.log(name,'passed')};
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});try{
 // Same-origin, shared storage, two actual pages: only one editor.
 const a=await scenario(browser,{shifts:{'2026-11-12':{job1:[{start:'09:00',end:'10:00',breakMins:0}]}}}),p=a.page;
 assert.equal(await p.evaluate(()=>window.hosshiiReadOnly),false);
 assert(await p.evaluate(()=>setDayShifts('2026-11-17','job1',[{start:'09:00',end:'10:00',breakMins:0}])));
 const stored=await p.evaluate(()=>localStorage.getItem(PRELAUNCH_STATE_KEY));
 const q=await a.createPage();assert.equal(await q.evaluate(()=>window.hosshiiReadOnly),true);assert.equal(await q.evaluate(()=>window.hosshiiStatusReason),'local-storage');
 assert.equal(await q.evaluate(()=>setDayShifts('2026-11-18','job1',[{start:'09:00',end:'10:00',breakMins:0}])),false);
 assert.equal(await q.evaluate(()=>localStorage.getItem(PRELAUNCH_STATE_KEY)),stored);
 await q.locator('#btn-settings').click();await q.waitForFunction(()=>document.getElementById('set_wage_0').disabled);
 await p.close();await q.waitForFunction(async()=>!(await navigator.locks.query()).held.some(l=>l.name==='hosshii-edit:'+PRELAUNCH_STATE_KEY));
 await q.evaluate(()=>window.hosshiiRefreshEntitlement());await q.waitForFunction(()=>!window.hosshiiReadOnly);
 assert.equal(await q.evaluate(()=>getDayShifts('2026-11-17','job1').length),1);
 assert(await q.evaluate(()=>setDayShifts('2026-11-18','job1',[{start:'10:00',end:'11:00',breakMins:0}])));
 assert.equal(await q.evaluate(()=>getDayShifts('2026-11-17','job1').length),1);
 report.errors.push(...a.errors);await a.context.close();record('one-editor-lock-second-tab-read-only-and-recovery');
 // Account change during asynchronous activation must not bind/show the old identity.
 const race=await scenario(browser,{pauseHash:true,startOnly:true}),racePage=race.page;
 await racePage.waitForFunction(()=>window.__hashWaiting===true);
 await racePage.evaluate(token=>{window.__testToken=token;window.__releaseHash()},makeToken('test-line-account-b'));
 await racePage.waitForFunction(()=>!document.getElementById('lineAuthRetry').hidden);
 assert.equal(await racePage.evaluate(()=>getComputedStyle(document.getElementById('appCard')).visibility),'hidden');
 assert.equal(await racePage.evaluate(()=>Object.keys(shiftsData).length),0);
 assert.equal(await racePage.evaluate(()=>Object.keys(localStorage).some(k=>k.includes(':line:'))),false);
 report.errors.push(...race.errors);await race.context.close();record('account-change-during-activation-cannot-reveal-or-claim-old-data');
 // Unexpected writer simulates an old/non-cooperating page. Detect the raw
 // snapshot change before writing; retain DOM input and the pending draft.
 const c=await scenario(browser),r=c.page;await r.locator('#btn-settings').click();
 const newer=await r.evaluate(()=>{const value=JSON.parse(localStorage.getItem(PRELAUNCH_STATE_KEY));value.storageRevision++;value.shifts['2026-11-18']={job1:[{start:'09:00',end:'10:00',breakMins:0}]};const raw=JSON.stringify(value);localStorage.setItem(PRELAUNCH_STATE_KEY,raw);return raw});
 await input(r,'set_transDay','444');
 assert.equal(await r.evaluate(()=>window.hosshiiReadOnly),true);assert.equal(await r.locator('#set_transDay').inputValue(),'444');
 assert.equal(await r.evaluate(()=>configData.job1.payDraft.rates.transDay),444);
 assert.equal(await r.evaluate(()=>localStorage.getItem(PRELAUNCH_STATE_KEY)),newer);
 r.removeAllListeners('dialog');r.once('dialog',d=>d.dismiss());await r.evaluate(()=>window.hosshiiResolveStorageConflict());
 assert.equal(await r.locator('#set_transDay').inputValue(),'444');assert.equal(await r.evaluate(()=>window.hosshiiReadOnly),true);
 r.on('dialog',d=>d.accept());await r.evaluate(()=>window.hosshiiResolveStorageConflict());
 assert.equal(await r.evaluate(()=>window.hosshiiReadOnly),false);assert.equal(await r.evaluate(()=>getDayShifts('2026-11-18','job1').length),1);
 assert.equal(await r.locator('#set_transDay').inputValue(),'100');assert.equal(await r.locator('#set_transDay').isDisabled(),false);
 report.errors.push(...c.errors);await c.context.close();record('revision-conflict-preserves-input-cancel-keeps-input-explicit-reload');
 // Verified account switch: old screen is concealed, requests/exports blocked,
 // reload opens a separate account namespace without claiming the old data.
 const d=await scenario(browser,{shifts:{'2026-11-12':{job1:[{start:'09:00',end:'10:00',breakMins:0}]}}}),s=d.page;
 const keyA=await s.evaluate(()=>PRELAUNCH_STATE_KEY),rawA=await s.evaluate(()=>localStorage.getItem(PRELAUNCH_STATE_KEY));
 const tokenB=makeToken('test-line-account-b');d.setDefaultToken(tokenB);
 await s.evaluate(token=>{window.__testToken=token;return window.hosshiiRefreshEntitlement()},tokenB);
 assert.equal(await s.evaluate(()=>document.getElementById('lineAuthGate').hidden),false);
 assert.equal(await s.evaluate(()=>getComputedStyle(document.getElementById('appCard')).visibility),'hidden');
 const requests=d.requests.filter(x=>x.type==='backup').length;await s.evaluate(()=>hosshiiCloudBackupSave());assert.equal(d.requests.filter(x=>x.type==='backup').length,requests);
 assert.equal(await s.evaluate(()=>exportAppData()),false);
 await s.reload();await s.waitForFunction(()=>document.getElementById('lineAuthGate').hidden);
 const keyB=await s.evaluate(()=>PRELAUNCH_STATE_KEY);assert.notEqual(keyA,keyB);
 assert.equal(await s.evaluate(()=>getActiveJobKeys().length),0);assert.equal(await s.evaluate(()=>Object.keys(shiftsData).length),0);
 assert.equal(await s.evaluate(key=>localStorage.getItem(key),keyA),rawA);
 await s.locator('#btn-settings').click();await s.locator('#newJobNameInput').fill('別アカ');await s.locator('.ito-job-register-button').click();
 assert.equal(await s.evaluate(()=>configData.job1.name),'別アカ');assert.equal(await s.evaluate(key=>localStorage.getItem(key),keyA),rawA);
 d.setDefaultToken(makeToken());await s.reload();await s.waitForFunction(()=>document.getElementById('lineAuthGate').hidden);
 assert.equal(await s.evaluate(()=>PRELAUNCH_STATE_KEY),keyA);assert.equal(await s.evaluate(()=>getDayShifts('2026-11-12','job1').length),1);
 report.errors.push(...d.errors);await d.context.close();record('account-switch-conceals-old-data-blocks-export-and-isolates-storage');
 // No implicit first-login ownership of legacy data.
 const e=await scenario(browser,{acceptLegacy:false}),u=e.page;
 assert.equal(await u.evaluate(()=>getActiveJobKeys().length),0);assert.equal(await u.evaluate(()=>Object.keys(shiftsData).length),0);
 assert(await u.evaluate(()=>localStorage.getItem('mybasket_wages_v77')));assert(await u.evaluate(()=>localStorage.getItem('mybasket_shifts_v23')));
 report.errors.push(...e.errors);await e.context.close();record('unattributed-legacy-data-needs-explicit-owner-confirmation');
 // The initial migration can fail without changing legacy data, then retry.
 const f=await scenario(browser,{initialFailure:true,waitForReady:false}),v=f.page;
 const legacyBefore=await v.evaluate(()=>[localStorage.getItem('mybasket_wages_v77'),localStorage.getItem('mybasket_shifts_v23')]);
 assert.equal(await v.evaluate(()=>document.getElementById('lineAuthGate').hidden),false);
 await v.evaluate(()=>window.__failStore=false);await v.locator('#lineAuthRetry').click();await v.waitForFunction(()=>document.getElementById('lineAuthGate').hidden);
 assert.deepEqual(await v.evaluate(()=>[localStorage.getItem('mybasket_wages_v77'),localStorage.getItem('mybasket_shifts_v23')]),legacyBefore);
 assert.equal(await v.evaluate(()=>getActiveJobKeys().length),1);
 report.errors.push(...f.errors);await f.context.close();record('migration-write-failure-retains-original-and-retries');
 // Unsupported lock API is explicitly read-only, never an unsafe fallback writer.
 const g=await scenario(browser,{disableLocks:true}),w=g.page;
 assert.equal(await w.evaluate(()=>window.hosshiiReadOnly),true);assert((await w.evaluate(()=>window.hosshiiStorageMessage())).includes('制御できません'));
 assert.equal(await w.evaluate(()=>saveAllDataStorage()),false);
 report.errors.push(...g.errors);await g.context.close();record('no-Web-Locks-safe-read-only-fallback');
 assert.deepEqual(report.errors,[]);
 }finally{await browser.close();fs.writeFileSync(out+'/concurrency.json',JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
