// Run with Playwright installed: node tests/design-review.cjs
// All LINE/Supabase traffic is mocked. No production login or backup is used.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const os = require('node:os');
const artifactDir=process.env.REVIEW_ARTIFACTS || path.join(os.tmpdir(),'hosshii-design-review');
fs.mkdirSync(artifactDir,{recursive:true});
const {execFileSync} = require('node:child_process');
const html=fs.readFileSync('index.html','utf8');
const {normalizePresentation,changes,approvedUiChanges}=require('./presentation-equivalence.cjs');
const original=execFileSync('git',['show','46908d4:index.html'],{encoding:'utf8',maxBuffer:2e6});
const scripts=s=>[...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.deepEqual(scripts(normalizePresentation(html)),scripts(original),'All scripts must match except reviewed view markup');
for(const s of scripts(html))new vm.Script(s);
const handlers=s=>[...s.matchAll(/\bon\w+="[^"]*"/g)].map(m=>m[0]);
assert.deepEqual(handlers(normalizePresentation(html)),handlers(original),'Existing handlers unchanged after reversing approved UI additions');
const errors=[], requests=[];
let status={status:'trialing',trialActive:true,trialExpiresAt:'2026-12-01T00:00:00Z'};
let backup;
let authFailure=false, consentMode=false;
const today=new Date();
const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dateKey=key(today);
const wages={jobCount:3,monthlyGoal:200000};
for(let i=1;i<=3;i++)wages['job'+i]={name:['ほっしー六文字','掛持ちカフェ','夜勤スタッフ'][i-1],closeDay:'月末',payDay:'10',paid:1200,paidHours:8,wageSlots:[{start:'00:00',end:'00:00',wage:1200,bType:'weekend',bVal:100}],presets:[{start:'09:00',end:'17:00',breakMins:60}]};
const shifts={[dateKey]:{job1:[{start:'09:00',end:'17:00',breakMins:60,isPaidLeave:false}],job2:[{start:'18:00',end:'20:00',breakMins:0,isPaidLeave:false}],job3:[{start:'21:00',end:'23:00',breakMins:0,isPaidLeave:false}]}};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.route('https://static.line-scdn.net/**',r=>r.fulfill({contentType:'application/javascript',body:`window.liff={init:async()=>{},isLoggedIn:()=>true,getIDToken:()=>"mock-review-token",login:()=>{throw Error("Unexpected real login")}};`}));
 await context.route('https://*.supabase.co/**',async r=>{
  const b=r.request().postDataJSON();requests.push({url:r.request().url(),action:b.action});
  if(r.request().url().includes('line-trial-status')){
   if(authFailure)return r.fulfill({status:401,json:{error:'mock unauthorized'}});
   return r.fulfill({json:consentMode&&!b.consentAccepted?{status:'new',consentRequired:true}:status});
  }
  if(b.action==='save'){backup=b.backupData;return r.fulfill({json:{ok:true}});}
  return r.fulfill({json:{ok:true,backupData:backup}});
 });
 // Fonts aren't required for the functional assertions and never block offline tests.
 await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''}));
 await context.route('https://fonts.gstatic.com/**',r=>r.abort());
 await context.addInitScript(({wages,shifts})=>{
  if(!sessionStorage.getItem('reviewSeeded')){
   localStorage.setItem('mybasket_wages_v77',JSON.stringify(wages));
   localStorage.setItem('mybasket_shifts_v23',JSON.stringify(shifts));
   localStorage.setItem('mybasket_last_backup',String(Date.now()));
   sessionStorage.setItem('reviewSeeded','1');
  }
 },{wages,shifts});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.stack));
 await page.goto(process.env.REVIEW_URL||'http://127.0.0.1:8765/');
 await page.waitForFunction(()=>document.getElementById('lineAuthGate').hidden || getComputedStyle(document.getElementById('lineAuthGate')).display==='none');
 const calc=await page.evaluate(()=>calculateJobShiftMinutesAndPay({start:'09:00',end:'17:00',breakMins:60},configData.job1,new Date(2026,10,9)));
 assert.deepEqual(calc,{totalMins:420,totalPay:8400});
 const overnight=await page.evaluate(()=>calculateJobShiftMinutesAndPay({start:'22:00',end:'02:00',breakMins:0},configData.job1,new Date(2026,10,9)));
 assert.equal(overnight.totalPay,4800);
 assert.equal(await page.evaluate(()=>paidLeaveAmount(configData.job1,{hours:8})),9600);
 const checks=[];
 for(const width of [320,375,390,430,768]){
  await page.setViewportSize({width,height:844});
  for(const tab of ['clock','calendar','list','settings','guide']){
   await page.locator('#btn-'+tab).click();
   const geometry=await page.evaluate(()=>{
    const nav=document.getElementById('hosshiiBottomNav').getBoundingClientRect();
    const buttons=[...document.querySelectorAll('#hosshiiBottomNav button')].map(b=>{const r=b.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
    return {overflow:document.documentElement.scrollWidth>innerWidth,buttons,navY:nav.y,visibleTabs:document.querySelectorAll('.tab-content:not(.hidden)').length,scrollOverflow:document.getElementById('appScroll').scrollWidth>document.getElementById('appScroll').clientWidth+1};
   });
   assert.equal(geometry.overflow,false,`${width} ${tab}: viewport overflow`);
   assert.equal(geometry.scrollOverflow,false,`${width} ${tab}: content overflow`);
   assert.equal(geometry.visibleTabs,1);
   assert(geometry.buttons.every(b=>Math.abs(b.y-geometry.buttons[0].y)<1 && b.h>=44 && b.w>=44));
   if(tab==='settings'){
    const save=await page.locator('#settingsFixedSave').boundingBox();assert(save.y+save.height<=geometry.navY+1,'save button overlaps navigation');
   }
   checks.push(`${width}:${tab}`);
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('#btn-calendar').click();
 await page.evaluate(k=>openShiftInputModal(k,true),dateKey);
 await page.locator('#new_preset_start').evaluate(el=>el.value='06:00');
 await page.locator('#new_preset_end').evaluate(el=>el.value='08:00');
 await page.locator('#registerShiftButton').click();
 assert.equal(await page.evaluate(k=>getDayShifts(k,'job1').length,dateKey),2);
 const saved=await page.evaluate(()=>localStorage.getItem('mybasket_shifts_v23'));
 await page.reload();await page.waitForFunction(()=>window.hosshiiReadOnly===false);
 assert.equal(await page.evaluate(()=>localStorage.getItem('mybasket_shifts_v23')),saved);
 await page.locator('#btn-list').click();assert((await page.locator('#standaloneShiftListContainer').innerText()).includes('06:00'));
 await page.locator('#btn-settings').click();
 // Real UI backup buttons, mocked server only.
 await page.locator('button[onclick="hosshiiCloudBackupSave(event)"]').click();
 await page.waitForFunction(()=>!hosshiiCloudBackupBusy);
 assert(backup && backup.mybasket_shifts_v23);
 if(await page.locator('#alertModal').isVisible())await page.evaluate(()=>closeAlertModal());
 await page.evaluate(k=>setDayShifts(k,'job2',[]),dateKey);
 await page.locator('button[onclick="hosshiiCloudBackupLoad(event)"]').click();
 await page.waitForTimeout(100);
 if(await page.locator('#confirmModal').isVisible())await page.evaluate(()=>closeConfirmModal(true));
 await page.waitForFunction(()=>!hosshiiCloudBackupBusy);
 assert.equal(await page.evaluate(k=>getDayShifts(k,'job2').length,dateKey),1,'Backup restores deleted shift');
 if(await page.locator('#alertModal').isVisible())await page.evaluate(()=>closeAlertModal());
 assert(requests.some(r=>r.action==='save'));assert(requests.some(r=>r.action==='load'));
 await page.locator('#btn-settings').click();
 await page.locator('#set_transMonth').fill('1500');
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('mybasket_wages_v77')).job1.transMonth===1500);
 await page.locator('#settingsFixedSave button').click();
 // Goal editor and settings continue to persist through original handlers.
 await page.locator('#btn-clock').click();await page.locator('#test28GoalEdit').click();
 await page.locator('#t31GoalInput').fill('250000');
 await page.locator('#t31GoalModal button[type=submit]').click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mybasket_wages_v77')).monthlyGoal),250000);
 // The existing progress/marble responds to salary and reduced-motion preferences.
 await page.evaluate(()=>{payPeriodOffset=0;initOverviewPage()});
 await page.emulateMedia({reducedMotion:'reduce'});
 assert(await page.evaluate(()=>salaryMarbleTarget>0));
 assert.equal(await page.locator('#test7Marble').evaluate(el=>el.style.display==='none'),false);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>requestSalaryMarbleReplay());
 await page.waitForFunction(()=>salaryMarbleState==='playing');
 const marbleStart=await page.evaluate(()=>test7MarblePercent);
 await page.waitForTimeout(200);
 assert(await page.evaluate(start=>test7MarblePercent>start,marbleStart));
 // Compact and landscape modal: visible card stays inside viewport; footer is clickable.
 for(const size of [{width:320,height:568},{width:667,height:375}]){
  await page.setViewportSize(size);await page.evaluate(k=>openShiftInputModal(k,true),dateKey);
  const card=await page.locator('#shiftInputModal > div').boundingBox();
  assert(card.x>=0 && card.x+card.width<=size.width+1 && card.y>=0 && card.y+card.height<=size.height+1);
  await page.screenshot({path:path.join(artifactDir,`shift-modal-${size.width}.png`)});
  await page.evaluate(()=>openCustomTimePicker('new_preset_start'));
  await page.locator('#customClockFace').click({position:{x:30,y:75}});
  await page.locator('#clockMinuteDisplay').click();
  await page.locator('#customClockFace').click({position:{x:80,y:30}});
  await page.locator('#customTimePickerModal .hclock-save').click();
  assert.match(await page.locator('#new_preset_start').inputValue(),/^\d{2}:\d{2}$/);
  await page.locator('#shiftInputModal button[onclick="closeShiftInputModal()"]').click();
 }
 await page.setViewportSize({width:390,height:844});
 // Capture representative mobile screens, including the original clock modal.
 fs.mkdirSync(artifactDir,{recursive:true});
 for(const tab of ['clock','calendar','list','settings','guide']){
  await page.locator('#btn-'+tab).click();await page.waitForTimeout(200);
  if(tab==='clock')await page.waitForFunction(()=>salaryMarbleState==='idle');
  if(tab==='list')await page.locator('#list-row-'+dateKey).scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(artifactDir,`${tab}.png`)});
 }
 await page.evaluate(k=>openShiftInputModal(k,true),dateKey);
 await page.screenshot({path:path.join(artifactDir,'shift-modal.png')});
 await page.evaluate(()=>openCustomTimePicker('new_preset_start'));
 await page.screenshot({path:path.join(artifactDir,'clock-modal.png')});
 await page.evaluate(()=>closeCustomTimePicker());
 await page.evaluate(()=>closeShiftInputModal());
 status={status:'expired',trialActive:false};await page.reload();await page.waitForFunction(()=>window.hosshiiReadOnly===true);
 const before=await page.evaluate(()=>localStorage.getItem('mybasket_shifts_v23'));
 assert.equal(await page.evaluate(k=>setDayShifts(k,'job1',[]),dateKey),false);
 assert.equal(await page.evaluate(()=>localStorage.getItem('mybasket_shifts_v23')),before);
 // Existing initial consent and authentication failure gate are still enforced.
 consentMode=true;status={status:'trialing',trialActive:true,trialExpiresAt:'2026-12-01T00:00:00Z'};
 await page.reload();await page.locator('#lineAuthConsent').waitFor({state:'visible'});
 const start=page.locator('#lineAuthStart');
 assert(await start.isDisabled());await page.locator('#lineAuthAgree').check();await page.locator('#lineAuthAgeAgree').check();
 await start.click();await page.waitForFunction(()=>window.hosshiiReadOnly===false);
 authFailure=true;await page.reload();await page.waitForFunction(()=>document.getElementById('lineAuthMessage').textContent.includes('401'));
 assert(await page.locator('#lineAuthGate').isVisible());
 authFailure=false;consentMode=false;
 await page.reload();await page.waitForFunction(()=>window.hosshiiReadOnly===false);
 await page.evaluate(()=>{configData.job1.wageSlots=[];refreshAll()});
 assert(await page.locator('#test5RingWarning').isVisible());
 assert.equal((await page.locator('#goalCurrentPay').innerText()).trim(),'—');
 assert.equal(errors.length,0,errors.join('\n'));
 await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForFunction(()=>window.hosshiiReadOnly===false);
 assert.equal(await page.evaluate(()=>getActiveJobKeys().length),0);
 for(const tab of ['clock','calendar','list','settings','guide'])await page.locator('#btn-'+tab).click();
 // Known pre-existing first-load error: reproduce on the exact original HTML as well.
 assert.equal(errors.length,1);assert(errors[0].includes('at getSettingsFormHtml'));
 await page.route(process.env.REVIEW_URL||'http://127.0.0.1:8765/',r=>r.fulfill({contentType:'text/html',body:original}));
 await page.reload();await page.waitForFunction(()=>window.hosshiiReadOnly===false);
 assert.equal(errors.length,2);
 // Presentation wrappers move script line numbers; compare the actual error and call chain.
 const withoutLocations=s=>s.replace(/:\d+:\d+/g,':line:column');
 assert.equal(withoutLocations(errors[0]),withoutLocations(errors[1]));
 console.log(JSON.stringify({syntaxBlocks:scripts(html).length,nonPresentationScriptsUnchanged:true,presentationMarkupChanges:changes.length,approvedUiChanges:approvedUiChanges.length,existingHandlersUnchanged:true,layoutChecks:checks.length,calculation:calc,overnight,registrationAndReload:true,mockedCloudBackup:true,expiredWriteBlocked:true,consentAndAuthFailure:true,clockInteraction:true,goalPersistence:true,settingsAutosave:true,missingWage:true,marbleAnimation:true,newPageErrors:0,knownBaselineIssue:'Empty storage: getSettingsFormHtml reads undefined.name; same error and call chain reproduced on original HTML'},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
