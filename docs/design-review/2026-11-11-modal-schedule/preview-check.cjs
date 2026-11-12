const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),assert=require('assert/strict'),vm=require('vm');
const root=__dirname,origin=process.env.PREVIEW_URL||'http://127.0.0.1:8787',out=process.env.REVIEW_ARTIFACTS||path.join(require('os').tmpdir(),'hosshii-preview-check');fs.mkdirSync(out,{recursive:true});
const site=process.env.PREVIEW_DIR||'/workspace/pr8-modal-list-preview-verified';
const source=fs.readFileSync(site+'/index.html','utf8');for(const m of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
for(const n of ['preview-bootstrap.js','preview-ui.js'])new vm.Script(fs.readFileSync(site+'/'+n,'utf8'));
assert(!source.includes('line-auth-supabase-test-20261028'));assert(!source.includes('static.line-scdn.net'));assert(!source.includes('supabase.co'));assert(!source.includes('localStorage'));
const report={sourceCommit:JSON.parse(fs.readFileSync(site+'/preview-source.json')).sourceCommit,widths:[],requests:[],externalRequests:[],errors:[],httpErrors:[],storageAccesses:[],checks:[]};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
 for(const width of [320,375]){
  const c=await browser.newContext({viewport:{width,height:width===320?568:812},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'Asia/Tokyo'});
  await c.addInitScript(()=>{
   const nativeGet=Storage.prototype.getItem;
   localStorage.setItem('mybasket_wages_v77','CANARY_DO_NOT_READ');localStorage.setItem('mybasket_shifts_v23','CANARY_DO_NOT_READ');
   window.__storageAccess=[];window.__cspViolations=[];document.addEventListener('securitypolicyviolation',e=>window.__cspViolations.push({blockedURI:e.blockedURI,directive:e.effectiveDirective}));window.__canary=()=>nativeGet.call(localStorage,'mybasket_wages_v77');
   for(const op of ['getItem','setItem','removeItem','clear'])Storage.prototype[op]=function(){window.__storageAccess.push(op);throw new Error('Persistent storage access blocked in verification');};
  });
  const p=await c.newPage();p.on('pageerror',e=>report.errors.push({width,error:e.stack}));
  p.on('response',r=>{if(r.status()>=400)report.httpErrors.push({width,url:r.url(),status:r.status()});});
  p.on('request',r=>{const u=new URL(r.url());if(['http:','https:','ws:','wss:'].includes(u.protocol)){report.requests.push({width,url:r.url()});if(u.origin!==origin)report.externalRequests.push({width,url:r.url()});}});
  await c.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await p.clock.setFixedTime(new Date('2026-11-11T12:00:00+09:00'));
  const response=await p.goto(origin+'/');assert(response.headers()['content-security-policy'].includes("connect-src 'none'"));
  await p.waitForFunction(()=>window.previewReady===true);await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>salaryMarbleState==='idle');
  assert(await p.evaluate(()=>salaryMarbleEnabled&&Math.abs(test7MarblePercent-salaryMarbleTarget)<0.1),'Marble reaches the calculated demo target');
  assert.equal(await p.evaluate(()=>typeof liff),'undefined');assert.equal(await p.locator('#lineAuthGate').isVisible(),false);
  const original=await p.evaluate(()=>({wages:previewStorage.getItem('mybasket_wages_v77'),shifts:previewStorage.getItem('mybasket_shifts_v23')}));
  async function capture(name){
   await p.waitForTimeout(140);
   const audit=await p.evaluate(()=>{
    const sc=document.getElementById('appScroll'),nav=document.getElementById('hosshiiBottomNav');
    const buttons=[...document.querySelectorAll(document.getElementById('shiftInputModal').classList.contains('hidden')?'#appCard button':'#shiftInputModal button')].filter(b=>!b.disabled&&b.getClientRects().length&&getComputedStyle(b).visibility!=='hidden').map(b=>{let r=b.getBoundingClientRect();let box={left:Math.max(0,r.left),right:Math.min(innerWidth,r.right),top:Math.max(0,r.top),bottom:Math.min(innerHeight,r.bottom)};for(let a=b.parentElement;a;a=a.parentElement)if(/hidden|auto|scroll/.test(getComputedStyle(a).overflow)){let q=a.getBoundingClientRect();box={left:Math.max(box.left,q.left),right:Math.min(box.right,q.right),top:Math.max(box.top,q.top),bottom:Math.min(box.bottom,q.bottom)};}return {b,r:box};}).filter(o=>o.r.right-o.r.left>4&&o.r.bottom-o.r.top>4);
    const blocked=buttons.filter(({b,r})=>!b.contains(document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2))).map(({b})=>b.textContent.trim());
    const overlap=[];for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){const a=buttons[i],b=buttons[j];if(Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left)>2&&Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top)>2)overlap.push([a.b.textContent,b.b.textContent]);}
    return {pageOverflow:document.documentElement.scrollWidth>innerWidth,contentOverflow:sc.scrollWidth>sc.clientWidth+1,navOverScroll:sc.getBoundingClientRect().bottom>nav.getBoundingClientRect().top+1,blocked,overlap};
   });
   assert(!audit.pageOverflow&&!audit.contentOverflow&&!audit.navOverScroll,JSON.stringify({name,audit}));assert.deepEqual(audit.blocked,[],name+' blocked');assert.deepEqual(audit.overlap,[],name+' overlap');
   await p.screenshot({path:path.join(out,`${width}-${name}.png`)});report.checks.push({width,name,...audit});
  }
  for(const tab of ['clock','calendar','list','settings','guide']){
   await p.locator('#btn-'+tab).click();await p.evaluate(()=>document.getElementById('appScroll').scrollTop=0);assert(await p.locator('#tab-'+tab).isVisible());await capture(tab);
   if(tab==='calendar'){await p.locator('#tab-calendar .copy-label').scrollIntoViewIfNeeded();await capture('copy');}
   if(tab==='settings'||tab==='guide'){await p.evaluate(()=>{const s=document.getElementById('appScroll');s.scrollTop=s.scrollHeight});await capture(tab+'-bottom');}
  }
  // Backup buttons display a local notice; no request is mocked or fulfilled.
  await p.locator('#btn-settings').click();
  for(const fn of ['hosshiiCloudBackupSave','hosshiiCloudBackupLoad']){
   await p.locator(`button[onclick="${fn}(event)"]`).scrollIntoViewIfNeeded();await p.locator(`button[onclick="${fn}(event)"]`).click();assert(await p.locator('#alertModal').isVisible());assert((await p.locator('#alertModal').innerText()).includes('デザイン確認専用'));await p.evaluate(()=>closeAlertModal());
  }
  assert(await p.locator('#importFileInput').isDisabled());
  const key='2026-11-11';await p.locator('#btn-calendar').click();await p.evaluate(k=>openShiftInputModal(k,true),key);await capture('shift-modal');
  const count=await p.evaluate(k=>getDayShifts(k,'job1').length,key);
  await p.locator('#new_preset_start').evaluate(e=>e.value='06:00');await p.locator('#new_preset_end').evaluate(e=>e.value='08:00');await p.locator('#registerShiftButton').scrollIntoViewIfNeeded();await p.locator('#registerShiftButton').click();assert.equal(await p.evaluate(k=>getDayShifts(k,'job1').length,key),count+1);
  await p.evaluate(()=>closeShiftInputModal());
  await p.locator('#btn-settings').click();await p.locator('#set_transMonth').scrollIntoViewIfNeeded();await p.locator('#set_transMonth').fill('1234');await p.locator('#set_transMonth').dispatchEvent('change');await p.waitForTimeout(650);assert((await p.evaluate(()=>previewStorage.getItem('mybasket_wages_v77'))).includes('1234'));
  await p.locator('#btn-clock').click();await p.locator('#test28GoalEdit').click();assert(await p.locator('#t31GoalModal').isVisible());await p.evaluate(()=>closeMonthlyGoalDialog());
  assert.equal((await p.evaluate(()=>calculateJobShiftMinutesAndPay({start:'09:00',end:'17:00',breakMins:60},configData.job1,new Date(2026,10,9)))).totalPay,8400);
  assert.equal(await p.evaluate(()=>__canary()),'CANARY_DO_NOT_READ');report.storageAccesses.push(...await p.evaluate(()=>__storageAccess));
  assert.deepEqual(await p.evaluate(()=>__cspViolations),[],'No unexpected CSP violations');
  assert.deepEqual(await p.evaluate(()=>previewBlockedCalls),[],'Normal operations must not attempt blocked APIs');
  // Defences also reject explicit attempts, without any remote requests.
  const guards=await p.evaluate(async()=>{let fetchDenied=false,socketDenied=false;try{await fetch('https://example.invalid/')}catch{fetchDenied=true;}try{new WebSocket('wss://example.invalid/')}catch{socketDenied=true;}return {fetchDenied,socketDenied};});assert(guards.fetchDenied&&guards.socketDenied);
  await p.reload();await p.waitForFunction(()=>window.previewReady===true);await p.evaluate(()=>document.fonts.ready);
  assert.deepEqual(await p.evaluate(()=>({wages:previewStorage.getItem('mybasket_wages_v77'),shifts:previewStorage.getItem('mybasket_shifts_v23')})),original,'Reload resets all fixture data');
  await p.locator('#previewReset').click();await p.waitForFunction(()=>window.previewReady===true);assert.equal(await p.evaluate(()=>__canary()),'CANARY_DO_NOT_READ');
  assert.deepEqual(await p.evaluate(()=>__storageAccess),[]);
  report.widths.push({width,allFiveTabs:true,backupDisabled:true,importDisabled:true,shiftRegistration:true,settingsEditing:true,goalDialog:true,salaryCalculation:true,reloadReset:true,resetButton:true,nativeStorageCanaryUnchanged:true,networkGuards:guards});await c.close();
 }
 await browser.close();assert.deepEqual(report.httpErrors,[]);assert.deepEqual(report.externalRequests,[]);assert.deepEqual(report.errors,[]);assert.deepEqual(report.storageAccesses,[]);
 report.externalRequestCount=0;report.result='PASS';fs.writeFileSync(out+'/results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,screenshots:report.checks.length,externalRequests:0,persistentStorageAccess:0,errors:0}));
})().catch(e=>{console.error(e);fs.writeFileSync(out+'/failure.json',JSON.stringify(report,null,2));process.exit(1)});
