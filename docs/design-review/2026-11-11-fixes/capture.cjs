// Documentation-only capture harness. Run from repository root with Playwright installed.
// Real Google Fonts; isolated fixture data and mocked LINE/Supabase. No application edits.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const {execFile,execFileSync}=require('node:child_process');const {promisify}=require('node:util');
const run=promisify(execFile),root=__dirname;
const UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const cache=new Map(),fontFailures=[],fontDownloads=[];
async function fetchFont(url){if(!cache.has(url))cache.set(url,(async()=>{
 const {stdout}=await run('curl',['-fsSL','--max-time','30','-A',UA,url],{encoding:'buffer',maxBuffer:25*1024*1024});
 fontDownloads.push({url,bytes:stdout.length});return stdout;
})());return cache.get(url)}
const hashes=Object.fromEntries(['index.html','bordeaux-rose.css'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const report={sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),applicationHashes:hashes,fixtureDate:'2026-11-11 (Asia/Tokyo)',browser:'Chromium',fontMode:'Real Google Fonts via inherited HTTPS proxy; no font CSS substitution',captures:[],regressionChecks:[],textChecks:[],pageErrors:[],fontFailures,fontDownloads};
const key='2026-11-11',wages={jobCount:3,monthlyGoal:100000},shifts={};
for(let i=1;i<=3;i++)wages['job'+i]={name:['ほっしー本店','掛持ちカフェ','夜勤スタッフ'][i-1],closeDay:'月末',payDay:'10',paid:1200,paidHours:8,wageSlots:[{start:'00:00',end:'00:00',wage:1200,bType:'weekend',bVal:100}],presets:[{start:'09:00',end:'17:00',breakMins:60}]};
for(const day of ['04','06','09','11'])shifts['2026-11-'+day]={job1:[{start:'09:00',end:'17:00',breakMins:60,isPaidLeave:false}]};
shifts[key].job2=[{start:'18:00',end:'20:00',breakMins:0,isPaidLeave:false}];
shifts[key].job3=[{start:'21:00',end:'23:00',breakMins:0,isPaidLeave:true}];
async function audit(page,scope){return page.evaluate(scope=>{
 const root=document.querySelector(scope),clip=(r,a)=>({left:Math.max(r.left,a.left),top:Math.max(r.top,a.top),right:Math.min(r.right,a.right),bottom:Math.min(r.bottom,a.bottom)});
 function rect(el){let r=clip(el.getBoundingClientRect(),{left:0,top:0,right:innerWidth,bottom:innerHeight});for(let a=el.parentElement;a;a=a.parentElement){const s=getComputedStyle(a);if(/hidden|auto|scroll|clip/.test(s.overflowX+' '+s.overflowY))r=clip(r,a.getBoundingClientRect());}return r;}
 const buttons=[...root.querySelectorAll('button')].filter(el=>!el.disabled&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>({el,label:el.textContent.trim(),r:rect(el)})).filter(x=>x.r.right-x.r.left>3&&x.r.bottom-x.r.top>3);
 const overlaps=[],blocked=[];
 for(let i=0;i<buttons.length;i++){const a=buttons[i];for(let j=i+1;j<buttons.length;j++){const b=buttons[j],r=clip(a.r,b.r);if(r.right-r.left>2&&r.bottom-r.top>2)overlaps.push([a.label,b.label]);}
 const hit=document.elementFromPoint((a.r.left+a.r.right)/2,(a.r.top+a.r.bottom)/2);if(!a.el.contains(hit))blocked.push(a.label);}
 const panel=scope==='#appCard'?null:root.firstElementChild.getBoundingClientRect();
 return {scope,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,appScrollOverflow:document.getElementById('appScroll').scrollWidth>document.getElementById('appScroll').clientWidth+1,buttonOverlaps:overlaps,blockedButtonCenters:blocked,panelOutsideViewport:panel?panel.left<0||panel.right>innerWidth+1||panel.top<0||panel.bottom>innerHeight+1:false,panelRect:panel?{x:panel.x,y:panel.y,width:panel.width,height:panel.height}:null,outsideViewportButtons:scope==='#appCard'?[]:[...root.querySelectorAll('button')].filter(el=>!el.disabled&&el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect();return {label:el.textContent.trim(),y:r.y,bottom:r.bottom}}).filter(r=>r.y<0||r.bottom>innerHeight)};
},scope)}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
 for(const size of [{width:375,height:812},{width:320,height:568}]){
  const dir=path.join(root,String(size.width));fs.mkdirSync(dir,{recursive:true});
  const c=await browser.newContext({viewport:size,isMobile:true,hasTouch:true,deviceScaleFactor:2,timezoneId:'Asia/Tokyo'});
  await c.route('https://fonts.googleapis.com/**',async r=>{try{await r.fulfill({body:await fetchFont(r.request().url()),contentType:'text/css',headers:{'access-control-allow-origin':'*'}})}catch(e){fontFailures.push(String(e));await r.abort()}});
  await c.route('https://fonts.gstatic.com/**',async r=>{try{await r.fulfill({body:await fetchFont(r.request().url()),contentType:r.request().url().endsWith('.ttf')?'font/ttf':'font/woff2',headers:{'access-control-allow-origin':'*'}})}catch(e){fontFailures.push(String(e));await r.abort()}});
  await c.route('https://static.line-scdn.net/**',r=>r.fulfill({contentType:'application/javascript',body:'window.liff={init:async()=>{},isLoggedIn:()=>true,getIDToken:()=>"mock-screenshot-token"}'}));
  await c.route('https://*.supabase.co/**',r=>r.fulfill({json:{status:'trialing',trialActive:true,trialExpiresAt:'2026-12-02T00:00:00Z'}}));
  await c.addInitScript(({wages,shifts})=>{localStorage.setItem('mybasket_wages_v77',JSON.stringify(wages));localStorage.setItem('mybasket_shifts_v23',JSON.stringify(shifts));localStorage.setItem('mybasket_last_backup',String(Date.now()));},{wages,shifts});
  const page=await c.newPage();page.on('pageerror',e=>report.pageErrors.push({width:size.width,error:e.stack}));
  await page.clock.setFixedTime(new Date('2026-11-11T12:00:00+09:00'));
  await page.goto(process.env.REVIEW_URL||'http://127.0.0.1:8767/');await page.waitForFunction(()=>window.hosshiiReadOnly===false&&document.getElementById('lineAuthGate').hidden);
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>Promise.all([document.fonts.load('700 18px "Noto Serif JP"','来月のお給料目標円'),document.fonts.load('700 16px "Noto Sans JP"','シフト登録設定'),document.fonts.load('700 18px "Cinzel"','2026')]));
  async function capture(name,scope='#appCard'){
   await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(220);
   const check=await audit(page,scope);
   assert(!check.horizontalOverflow&&!check.appScrollOverflow&&!check.panelOutsideViewport, name+' viewport overflow');
   assert.equal(check.buttonOverlaps.length,0,name+' overlapping buttons');
   assert.equal(check.blockedButtonCenters.length,0,name+' blocked button');
   if(scope==='#appCard')assert(await page.evaluate(()=>document.getElementById('appScroll').getBoundingClientRect().bottom<=document.getElementById('hosshiiBottomNav').getBoundingClientRect().top+1),'Navigation covers scroll viewport');
   const fonts=await page.evaluate(()=>({serif:document.fonts.check('700 18px "Noto Serif JP"','来月のお給料目標円'),sans:document.fonts.check('700 16px "Noto Sans JP"','シフト登録設定'),cinzel:document.fonts.check('700 18px "Cinzel"','2026'),loadedFaces:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family+':'+f.weight)}));
   await page.screenshot({path:path.join(dir,name+'.png')});report.captures.push({width:size.width,height:size.height,name,...check,fonts});
   console.log(size.width,name,JSON.stringify(check));
  }
  for(const tab of ['clock','calendar','list','settings','guide']){
   await page.locator('#btn-'+tab).click();
   await page.evaluate(()=>{document.getElementById('appScroll').scrollTop=0;const list=document.getElementById('standaloneShiftListContainer');if(list)list.scrollTop=0});
   if(tab==='clock'){await page.waitForTimeout(600);await page.waitForFunction(()=>salaryMarbleState==='idle');}
   await capture(tab);
   if(tab==='calendar'){await page.locator('#calendarRegisterButton').scrollIntoViewIfNeeded();await page.locator('#calendarRegisterButton').click({trial:true});await capture('calendar-register-visible');}
   if(tab==='list'){await page.locator('#list-row-'+key).scrollIntoViewIfNeeded();await capture('list-today');}
   if(tab==='settings'){await page.locator('button[onclick="hosshiiCloudBackupSave(event)"]').scrollIntoViewIfNeeded();await capture('settings-backup');}
  }
  await page.locator('#btn-clock').click();await page.locator('#test28GoalEdit').click();await capture('goal-modal','#t31GoalModal');await page.evaluate(()=>closeMonthlyGoalDialog());
  await page.evaluate(()=>openBreakdownModal());await capture('breakdown-modal','#breakdownModal');await page.evaluate(()=>closeBreakdownModal());
  await page.evaluate(()=>document.getElementById('incomeWallHelp').classList.remove('hidden'));await capture('income-wall-modal','#incomeWallHelp');await page.evaluate(()=>document.getElementById('incomeWallHelp').classList.add('hidden'));
  await page.locator('#btn-calendar').click();await page.evaluate(k=>openShiftInputModal(k,true),key);
  await capture('shift-modal','#shiftInputModal');
  await page.locator('#registerShiftButton').scrollIntoViewIfNeeded();await capture('shift-register-button','#shiftInputModal');
  await page.evaluate(()=>openCustomTimePicker('new_preset_start'));await capture('clock-hours','#customTimePickerModal');
  await page.locator('#clockMinuteDisplay').click();await capture('clock-minutes','#customTimePickerModal');await page.evaluate(()=>closeCustomTimePicker());
  await page.evaluate(()=>openBreakSelectModal('new'));await capture('break-modal','#breakSelectModal');await page.evaluate(()=>closeBreakSelectModal());
  await page.evaluate(()=>openPresetRegisterModal());await page.locator('#pr_start').evaluate(el=>{el.value='08:00';el.dispatchEvent(new Event('input',{bubbles:true}))});await page.locator('#pr_end').evaluate(el=>{el.value='16:00';el.dispatchEvent(new Event('input',{bubbles:true}))});
  const timeFits=await page.evaluate(()=>['pr_start','pr_end'].map(id=>{const el=document.getElementById(id),s=getComputedStyle(el),c=document.createElement('canvas').getContext('2d');c.font=s.fontWeight+' '+s.fontSize+' '+s.fontFamily;return {id,value:el.value,textWidth:c.measureText(el.value).width,available:el.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),indent:parseFloat(s.textIndent)};}));
  for(const t of timeFits)assert(t.textWidth<=t.available&&t.indent===0,'Time text clips: '+JSON.stringify(t));
  report.textChecks.push({width:size.width,timeFits});
  await capture('preset-register-modal','#presetRegisterModal');await page.evaluate(()=>closePresetRegisterModal());
  await page.evaluate(()=>showShiftHelp());await capture('shift-help-modal','#shiftUsageHelpModal');await page.evaluate(()=>closeShiftHelp());await page.evaluate(()=>closeShiftInputModal());
  await page.locator('#btn-settings').click();await page.locator('#set_reg_btn_0').scrollIntoViewIfNeeded();await capture('settings-register-button');
  const paidFit=await page.evaluate(()=>{const el=document.querySelector('#settingsJobContentArea .paid-sub'),r=document.createRange();r.selectNodeContents(el);const t=r.getBoundingClientRect(),i=document.getElementById('set_wagePaid').getBoundingClientRect();return {labelRight:t.right,inputLeft:i.left,labelBottom:t.bottom,inputTop:i.top,overlap:t.right>i.left&&t.bottom>i.top};});
  assert(!paidFit.overlap,'Paid leave label overlaps input');report.textChecks.push({width:size.width,paidFit});
  await page.evaluate(()=>openOvertimeInfoModal());await capture('wage-help-modal','#overtimeInfoModal');
  const wageCloseChecks=[];for(const button of await page.locator('#overtimeInfoModal button').all()){
   try{await button.click({trial:true,timeout:1500});wageCloseChecks.push({label:await button.innerText(),clickable:true})}catch{wageCloseChecks.push({label:await button.innerText(),clickable:false})}
  }
  report.captures[report.captures.length-1].closeButtonTrial=wageCloseChecks;
  await page.evaluate(()=>closeOvertimeInfoModal());
  const sizes=size.width===320?[size,{width:320,height:320},{width:320,height:240},{width:667,height:320},{width:1024,height:768}]:[size];
  for(const viewport of sizes){
   await page.setViewportSize(viewport);
   for(const position of ['top','bottom'])for(const action of ['top','bottom']){
    await page.evaluate(()=>openOvertimeInfoModal());
    await page.locator('#overtimeInfoModal .wage-info-scroll').evaluate((el,p)=>el.scrollTop=p==='top'?0:el.scrollHeight,position);
    const check=await audit(page,'#overtimeInfoModal');assert(!check.panelOutsideViewport&&check.blockedButtonCenters.length===0);
    if(viewport.width===size.width&&viewport.height===size.height&&position==='bottom'&&action==='bottom')await capture('wage-help-scrolled','#overtimeInfoModal');
    await page.locator(action==='top'?'#overtimeInfoModal .wage-info-header button':'#overtimeInfoModal .wage-info-close').click();
    assert(await page.locator('#overtimeInfoModal').evaluate(el=>el.classList.contains('hidden')));
    report.regressionChecks.push({viewport,position,action,closed:true});
   }
  }
  await page.setViewportSize(size);
  for(const action of ['top','bottom']){
   await page.evaluate(()=>openBreakdownModal());
   await page.locator(action==='top'?'#breakdownModal button[onclick="closeBreakdownModal()"] >> nth=0':'#breakdownModal button[onclick="closeBreakdownModal()"] >> nth=1').click();
   assert(await page.locator('#breakdownModal').evaluate(el=>el.classList.contains('hidden')));
   report.regressionChecks.push({viewport:size,modal:'breakdown',action,closed:true});
  }
  await c.close();
 }
 await browser.close();
 report.applicationUnchanged=Object.entries(hashes).every(([p,h])=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')===h);
 fs.writeFileSync(path.join(root,'results.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({captures:report.captures.length,fontDownloads:fontDownloads.length,fontFailures,pageErrors:report.pageErrors,applicationUnchanged:report.applicationUnchanged}));
})().catch(e=>{console.error(e);process.exit(1)});
