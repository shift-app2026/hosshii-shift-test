// Expired cloud access policy: mock services only, independent browser data.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,scenario}=require('../prelaunch/browser-helper.cjs');
const out='/workspace/trial-launch-verification/cloud-policy';fs.mkdirSync(out,{recursive:true});
const report={cases:[],errors:[]};const pass=(name,width)=>{report.cases.push({name,width});console.log(width,name,'passed')};
async function deviceExport(p){
 await p.locator('#btn-settings').click();await p.locator('button[onclick="hosshiiBackupExport(event)"]').click();
 assert(await p.locator('#hosshiiBackupDownloadArea').isVisible());
 await p.getByRole('button',{name:'📝 内容を表示して選択',exact:true}).click();
 const text=p.getByRole('textbox',{name:'バックアップデータ（長押しまたは選択ボタンでコピー）'});
 assert(await text.isVisible());assert(await text.isEnabled());assert.equal(await text.evaluate(e=>e.selectionEnd-e.selectionStart),await text.evaluate(e=>e.value.length));const backup=JSON.parse(await text.inputValue());assert.equal(backup.schemaVersion,2);assert.equal(backup.format,'hosshii-shift');assert(backup.state.config.job1.payHistory);
 await p.evaluate(()=>Object.defineProperty(window,'showSaveFilePicker',{configurable:true,value:undefined}));
 await p.getByRole('button',{name:'⬇️ 端末にファイル保存',exact:true}).click();
 assert((await p.locator('#hosshiiBackupDownloadArea').textContent()).includes('共有またはコピー'));
 return backup;
}
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});try{
for(const width of [320,375]){
 const x=await scenario(browser,{width,status:{status:'expired'}}),p=x.page;
 const before=await p.evaluate(()=>({config:JSON.stringify(configData),shifts:JSON.stringify(shiftsData),last:localStorage.getItem('mybasket_last_backup')}));
 await p.evaluate(async()=>{await hosshiiCloudBackupSave();await hosshiiCloudBackupLoad();for(const a of ['save','load'])try{await hosshiiBackupRequest(a,prelaunchBackup())}catch(_){}});
 assert.equal(x.requests.filter(r=>r.type==='backup').length,0);pass('expired-direct-and-low-level-cloud-refused',width);
 const exported=await deviceExport(p);assert.deepEqual(exported.state.config,JSON.parse(before.config));assert.deepEqual(exported.state.shifts,JSON.parse(before.shifts));assert.equal(x.requests.filter(r=>r.type==='backup').length,0);assert.equal(await p.evaluate(()=>localStorage.getItem('mybasket_last_backup')),before.last);pass('expired-device-export-exact-data-and-controls-usable',width);
 await p.screenshot({path:`${out}/${width}-device-export.png`});report.errors.push(...x.errors);await x.context.close();
 // The page stays open across the complete 21-day boundary; timers need not run for the write guard.
 const y=await scenario(browser,{width,status:{status:'trialing',trialExpiresAt:'2026-12-03T12:00:00+09:00'}}),q=y.page;
 y.setStatus({status:'expired'});await q.clock.setFixedTime(new Date('2026-12-03T12:00:00+09:00'));
 await q.evaluate(async()=>{await hosshiiCloudBackupSave();await hosshiiCloudBackupLoad()});assert.equal(y.requests.filter(r=>r.type==='backup').length,0);assert.equal(await q.evaluate(()=>window.hosshiiReadOnly),true);await deviceExport(q);assert.equal(y.requests.filter(r=>r.type==='backup').length,0);pass('open-21-days-exact-boundary-cloud-refused-local-export-works',width);report.errors.push(...y.errors);await y.context.close();
 // An actual scheduled deadline also changes permission without reload.
 const z=await scenario(browser,{width,realClock:true,status:{status:'trialing',trialExpiresAt:'2026-11-12T12:00:20+09:00'}});z.setStatus({status:'expired'});await z.page.clock.fastForward(21000);await z.page.waitForFunction(()=>window.hosshiiReadOnly===true);await z.page.evaluate(async()=>{await hosshiiCloudBackupSave();await hosshiiCloudBackupLoad()});assert.equal(z.requests.filter(r=>r.type==='backup').length,0);pass('deadline-timer-refuses-both-cloud-actions',width);report.errors.push(...z.errors);await z.context.close();
 // Delay each cloud response until after expiry. Do not apply a restore or mark a save successful.
 for(const action of ['save','load']){
  const a=await scenario(browser,{width,status:{status:'trialing',trialExpiresAt:'2026-11-12T12:01:00+09:00'}}),r=a.page;const snapshot=await r.evaluate(()=>({memory:JSON.stringify(prelaunchState()),stored:localStorage.getItem(PRELAUNCH_STATE_KEY),last:localStorage.getItem('mybasket_last_backup')}));const data=await r.evaluate(()=>prelaunchBackup());data.state.monthlyGoal=987654;
  let release,started=false;const wait=new Promise(resolve=>release=resolve);await a.context.route('**/functions/v1/hosshii-backup',async route=>{started=true;await wait;await route.fulfill({json:{ok:true,backupData:data}})});
  await r.evaluate(action=>{void(action==='save'?hosshiiCloudBackupSave():hosshiiCloudBackupLoad())},action);while(!started)await r.waitForTimeout(10);
  a.setStatus({status:'expired'});await r.clock.setFixedTime(new Date('2026-11-12T12:01:00+09:00'));release();await r.waitForFunction(()=>!hosshiiCloudBackupBusy);
  assert.deepEqual(await r.evaluate(()=>({memory:JSON.stringify(prelaunchState()),stored:localStorage.getItem(PRELAUNCH_STATE_KEY),last:localStorage.getItem('mybasket_last_backup')})),snapshot);assert(!(await r.locator('#alertModalText').textContent()).includes('Supabaseに保存しました'));assert(!(await r.locator('#alertModalText').textContent()).includes('バックアップから読み込みました'));assert(await r.locator('#confirmModal').isHidden());pass('inflight-'+action+'-expiry-no-success-or-restore',width);report.errors.push(...a.errors);await a.context.close();
 }
 // Valid users continue to use the unchanged cloud format and controls.
 const v=await scenario(browser,{width,status:{status:'trialing',trialExpiresAt:'2026-12-03T12:00:00+09:00'}});await v.page.locator('#btn-settings').click();await v.page.locator('button[onclick="hosshiiBackupExport(event)"]').click();await v.page.waitForFunction(()=>!hosshiiCloudBackupBusy);assert.equal(v.backup().schemaVersion,2);assert(v.requests.some(r=>r.type==='backup'&&r.action==='save'));pass('active-cloud-save-still-works',width);report.errors.push(...v.errors);await v.context.close();
}
assert.deepEqual(report.errors,[]);
}finally{await browser.close();fs.writeFileSync(`${out}/results.json`,JSON.stringify(report,null,2))}})().catch(e=>{console.error(e);process.exitCode=1});
