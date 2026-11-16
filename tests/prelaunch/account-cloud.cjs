const assert=require('node:assert/strict'),fs=require('fs');const{chromium,scenario,makeToken}=require('./browser-helper.cjs');
const report={kind:'mocked-cloud-with-real-browser-account-change-guards',cases:[],errors:[]};
const pass=name=>{report.cases.push(name);console.log(name,'passed')};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium'});try{
 const x=await scenario(b),p=x.page;const count=x.requests.filter(r=>r.type==='backup').length;
 await p.evaluate(token=>{window.__testToken=token;return hosshiiCloudBackupSave()},makeToken('test-line-account-b'));
 assert.equal(x.requests.filter(r=>r.type==='backup').length,count);assert.equal(await p.evaluate(()=>document.getElementById('lineAuthGate').hidden),false);assert.equal(await p.evaluate(()=>getComputedStyle(document.getElementById('appCard')).visibility),'hidden');
 report.errors.push(...x.errors);await x.context.close();pass('changed-account-cannot-send-old-local-backup');
 for(const action of ['save','load']){
  const y=await scenario(b,{shifts:{'2026-11-12':{job1:[{start:'09:00',end:'10:00',breakMins:0}]}}}),q=y.page;
  const before=await q.evaluate(()=>({stored:localStorage.getItem(PRELAUNCH_STATE_KEY),memory:JSON.stringify(prelaunchState())})),backup=await q.evaluate(()=>prelaunchBackup());backup.state.monthlyGoal=999999;
  let release,arrived;const started=new Promise(r=>arrived=r),wait=new Promise(r=>release=r);
  await y.context.route('**/functions/v1/hosshii-backup',async route=>{arrived();await wait;await route.fulfill({json:{ok:true,backupData:backup}})});
  await q.evaluate(action=>{window.__inflight=action==='save'?hosshiiCloudBackupSave():hosshiiCloudBackupLoad()},action);await started;
  await q.evaluate(token=>window.__testToken=token,makeToken('test-line-account-b'));release();await q.evaluate(()=>window.__inflight);
  assert.deepEqual(await q.evaluate(()=>({stored:localStorage.getItem(PRELAUNCH_STATE_KEY),memory:JSON.stringify(prelaunchState())})),before);
  assert.equal(await q.locator('#confirmModal').isVisible(),false);assert.equal(await q.evaluate(()=>getComputedStyle(document.getElementById('appCard')).visibility),'hidden');
  assert(!(await q.locator('#alertModalText').textContent()).includes('Supabaseに保存しました'));
  report.errors.push(...y.errors);await y.context.close();pass('account-change-during-'+action+'-blocks-completion-and-restore');
 }
 assert.deepEqual(report.errors,[]);
 }finally{await b.close();fs.writeFileSync('/workspace/output/prelaunch-fix-20261116/account-cloud.json',JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
