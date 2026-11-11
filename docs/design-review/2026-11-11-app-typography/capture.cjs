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
 const baselineCommit='fdd2344a1f81159febcb38a9755023571b4b2f52';report.baselineCommit=baselineCommit;
 const beforeCSS=execFileSync('git',['show',baselineCommit+':bordeaux-rose.css'],{encoding:'utf8'}),afterCSS=fs.readFileSync('bordeaux-rose.css','utf8');
 assert.equal(fs.readFileSync('index.html','utf8'),execFileSync('git',['show',baselineCommit+':index.html'],{encoding:'utf8',maxBuffer:2e6}),'HTML/JavaScript unchanged');
 const protectedStyles=new Map();
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
 for(const size of [{width:375,height:812},{width:320,height:568}])for(const variant of ['before','after']){
  const dir=path.join(root,String(size.width));fs.mkdirSync(dir,{recursive:true});
  const c=await browser.newContext({viewport:size,isMobile:true,hasTouch:true,deviceScaleFactor:2,timezoneId:'Asia/Tokyo'});
  await c.route('**/bordeaux-rose.css',r=>r.fulfill({contentType:'text/css',body:variant==='before'?beforeCSS:afterCSS}));
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
   if(name==='shift-modal')assert(await page.locator('#shiftInputModal .shift-date-nav').evaluate(el=>getComputedStyle(el).backgroundImage.includes('linear-gradient')),'Date band must remain visibly Bordeaux');
   if(name==='calendar')assert(await page.locator('#calendarDays .hosshii-calendar-mark').evaluateAll(els=>els.every(el=>{const a=el.getBoundingClientRect(),b=el.parentElement.parentElement.getBoundingClientRect();return a.left>=b.left-1&&a.right<=b.right+1})), 'Workplace markers leave their calendar tile');
   if(name==='clock')assert(await page.locator('#goalPercentText').evaluate(el=>el.hidden),'Do not add achievement-rate display');
   assert(!check.horizontalOverflow&&!check.appScrollOverflow&&!check.panelOutsideViewport, name+' viewport overflow');
   assert.equal(check.buttonOverlaps.length,0,name+' overlapping buttons');
   assert.equal(check.blockedButtonCenters.length,0,name+' blocked button');
   if(scope==='#appCard')assert(await page.evaluate(()=>document.getElementById('appScroll').getBoundingClientRect().bottom<=document.getElementById('hosshiiBottomNav').getBoundingClientRect().top+1),'Navigation covers scroll viewport');
   const textAudit=await page.evaluate(()=>{
    const root=document.querySelector('#appScroll > .tab-content:not(.hidden)');
    const clipping=[...root.querySelectorAll('p,h2,h3,h4,label,button,.job-time,.copy-label,.hosshii-pinned-trigger-name')].filter(el=>el.getClientRects().length&&el.clientWidth>0&&el.scrollWidth>el.clientWidth+1).map(el=>[el.tagName,el.id,el.textContent.trim()]);
    const samples=[...document.querySelectorAll('#currentMonthLabel,#currentListMonthLabel,#calendarDays,.standalone-date,.standalone-shift-line .job-time,#hosshiiSettingsPinnedJob .hosshii-pinned-trigger-name,#tab-guide h4,.copy-label')].filter(el=>el.getClientRects().length).map(el=>{const c=getComputedStyle(el);return {text:el.textContent.trim().slice(0,45),family:c.fontFamily,size:c.fontSize,weight:c.fontWeight,color:c.color};});
    const label=document.querySelector('.copy-label'),btn=document.querySelector('button[onclick="copyLastMonthShifts()"]');let copy=null;
    if(root.id==='tab-calendar'){const a=btn.getBoundingClientRect(),b=btn.parentElement.getBoundingClientRect();copy={right:a.right-b.right,width:a.width,height:a.height,centerOffset:(a.top+a.bottom-b.top-b.bottom)/2,labelWeight:getComputedStyle(label).fontWeight,labelSize:getComputedStyle(label).fontSize,iconSize:getComputedStyle(label.previousElementSibling).fontSize,background:getComputedStyle(label.closest('.bg-white')).backgroundColor};}
    return {clipping,samples,copy};
   });
   const auditKey=size.width+':'+name+':text';
   if(variant==='before')protectedStyles.set(auditKey,textAudit);else {
    assert.deepEqual(textAudit.clipping,protectedStyles.get(auditKey).clipping,name+' no new clipped text');
    if(textAudit.copy){const a=textAudit.copy,b=protectedStyles.get(auditKey).copy;for(const k of ['right','width','height','centerOffset'])assert(Math.abs(a[k]-b[k])<1,'Keep execute button placement: '+k);assert.equal(a.labelSize,'14px');assert.equal(a.labelWeight,'800');assert.equal(a.iconSize,'20px');assert.equal(a.background,'rgb(255, 240, 244)');}
    for(const sample of textAudit.samples)assert(sample.family.includes(sample.text.startsWith('前月のシフト')?'Noto Sans JP':'Noto Serif JP'),'Display text uses intended family: '+JSON.stringify(sample));
   }
   report.textChecks.push({width:size.width,variant,name,...textAudit});
   const protectedState=await page.evaluate(()=>{
    const nodes=[...document.querySelectorAll('#appCard *,#shiftInputModal *')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
    const colours=nodes.filter(el=>{const s=getComputedStyle(el),v=s.color.match(/[\d.]+/g).map(Number);return el.closest('#goalRing')||v[0]-Math.min(v[1],v[2])>35||v[2]-v[0]>35||Math.min(...v.slice(0,3))>220;}).map(el=>{const c=getComputedStyle(el);return [el.tagName,el.id,el.className.baseVal??el.className,c.color,c.webkitTextFillColor,c.fill,c.stroke]});
    const ring=[...document.querySelectorAll('#goalRing,#goalRing *')].map(el=>{const s=getComputedStyle(el);return [s.fontFamily,s.fontSize,s.fontWeight,s.color,s.lineHeight]});
    const controls=nodes.filter(el=>el.tagName==='BUTTON').map(el=>{const s=getComputedStyle(el);return [el.id,el.textContent,s.background,s.color,s.border,s.padding,s.borderRadius]});
    const markers=nodes.filter(el=>el.matches('.job-color-dot,.glass-orb,.hc-dot,.hosshii-calendar-mark')).map(el=>{const c=getComputedStyle(el);return [c.background,c.fill,c.stroke]});return {colours,ring,controls,markers};
   });
   const stateKey=size.width+':'+name;
   if(variant==='before')protectedStyles.set(stateKey,protectedState);else assert.deepEqual(protectedState,protectedStyles.get(stateKey),name+' protected colours, ring and buttons');
   const fonts=await page.evaluate(()=>({serif:document.fonts.check('700 18px "Noto Serif JP"','来月のお給料目標円'),sans:document.fonts.check('700 16px "Noto Sans JP"','シフト登録設定'),cinzel:document.fonts.check('700 18px "Cinzel"','2026'),loadedFaces:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family+':'+f.weight)}));
   await page.screenshot({path:path.join(dir,name+'-'+variant+'.png')});report.captures.push({width:size.width,height:size.height,variant,name,...check,fonts});
   console.log(size.width,variant,name,'passed');
  }
  for(const tab of ['clock','calendar','list','settings','guide']){
   await page.locator('#btn-'+tab).click();
   await page.evaluate(()=>{document.getElementById('appScroll').scrollTop=0;const list=document.getElementById('standaloneShiftListContainer');if(list)list.scrollTop=0});
   if(tab==='clock'){await page.waitForTimeout(600);await page.waitForFunction(()=>salaryMarbleState==='idle');}
   await capture(tab);
   if(tab==='clock'){await page.evaluate(()=>{const sc=document.getElementById('appScroll'),el=document.getElementById('itoReceiveTable');sc.scrollTop+=el.getBoundingClientRect().top-sc.getBoundingClientRect().top;window.scrollTo(0,0)});await capture('clock-breakdown');}
   if(tab==='calendar'){await page.locator('.copy-label').scrollIntoViewIfNeeded();await capture('calendar-copy');await page.locator('#calendarRegisterButton').scrollIntoViewIfNeeded();await page.locator('#calendarRegisterButton').click({trial:true});await capture('calendar-register-visible');}
   if(tab==='list'){await page.locator('#list-row-'+key).scrollIntoViewIfNeeded();await capture('list-today');}
   if(tab==='settings'){await page.locator('#set_transMonth').scrollIntoViewIfNeeded();await capture('settings-transport');await page.locator('#set_allowanceMonth').scrollIntoViewIfNeeded();await capture('settings-other');await page.locator('button[onclick="hosshiiCloudBackupSave(event)"]').scrollIntoViewIfNeeded();await capture('settings-backup');}
  }
  await page.locator('#btn-calendar').click();await page.evaluate(k=>openShiftInputModal(k,true),key);
  await capture('shift-modal','#shiftInputModal');
  await page.locator('#registerShiftButton').scrollIntoViewIfNeeded();await capture('shift-register-button','#shiftInputModal');
  await page.locator('#registerShiftButton').click({trial:true});await page.evaluate(()=>closeShiftInputModal());
  await c.close();
 }
 await browser.close();assert.equal(fontFailures.length,0);assert.equal(report.pageErrors.length,0);
 report.applicationUnchanged=Object.entries(hashes).every(([p,h])=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')===h);
 fs.writeFileSync(path.join(root,'results.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({captures:report.captures.length,fontDownloads:fontDownloads.length,fontFailures,pageErrors:report.pageErrors,applicationUnchanged:report.applicationUnchanged}));
})().catch(e=>{console.error(e);process.exit(1)});
