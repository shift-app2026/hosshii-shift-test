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
 const baseline=execFileSync('git',['show','45ab3eb:bordeaux-rose.css'],{encoding:'utf8'}),current=fs.readFileSync('bordeaux-rose.css','utf8');
 const beforeHTML=execFileSync('git',['show','45ab3eb:index.html'],{encoding:'utf8',maxBuffer:2e6});
 const {normalizePresentation}=require('../../../tests/presentation-equivalence.cjs');
 assert.equal(fs.readFileSync('index.html','utf8'),execFileSync('git',['show','45ab3eb:index.html'],{encoding:'utf8',maxBuffer:2e6}),'Application HTML and scripts unchanged');
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
 report.baselineCommit='45ab3eb7959c43df41dcf39e4a251319b1719d24';report.fontChecks=[];report.otherTabs=[];report.textChecks=[];
 const states=new Map(),fonts=new Map();
 for(const size of [{width:375,height:812},{width:320,height:568}])for(const variant of ['before','after']){
  const dir=path.join(root,String(size.width));fs.mkdirSync(dir,{recursive:true});
  const c=await browser.newContext({viewport:size,isMobile:true,hasTouch:true,deviceScaleFactor:2,timezoneId:'Asia/Tokyo'});
  if(variant==='before')await c.route(process.env.REVIEW_URL||'http://127.0.0.1:8767/',r=>r.fulfill({contentType:'text/html',body:beforeHTML}));
  await c.route('**/bordeaux-rose.css',r=>r.fulfill({contentType:'text/css',body:variant==='before'?baseline:current}));
  await c.route('https://fonts.googleapis.com/**',async r=>{try{await r.fulfill({body:await fetchFont(r.request().url()),contentType:'text/css',headers:{'access-control-allow-origin':'*'}})}catch(e){fontFailures.push(String(e));await r.abort()}});
  await c.route('https://fonts.gstatic.com/**',async r=>{try{await r.fulfill({body:await fetchFont(r.request().url()),contentType:r.request().url().endsWith('.ttf')?'font/ttf':'font/woff2',headers:{'access-control-allow-origin':'*'}})}catch(e){fontFailures.push(String(e));await r.abort()}});
  await c.route('https://static.line-scdn.net/**',r=>r.fulfill({contentType:'application/javascript',body:'window.liff={init:async()=>{},isLoggedIn:()=>true,getIDToken:()=>"mock-font-review-token"}'}));
  await c.route('https://*.supabase.co/**',r=>r.fulfill({json:{status:'trialing',trialActive:true,trialExpiresAt:'2026-12-02T00:00:00Z'}}));
  await c.addInitScript(({wages,shifts})=>{localStorage.setItem('mybasket_wages_v77',JSON.stringify(wages));localStorage.setItem('mybasket_shifts_v23',JSON.stringify(shifts));localStorage.setItem('mybasket_last_backup',String(Date.now()));},{wages,shifts});
  const page=await c.newPage();page.on('pageerror',e=>report.pageErrors.push(e.stack));
  await page.clock.setFixedTime(new Date('2026-11-11T12:00:00+09:00'));
  await page.goto(process.env.REVIEW_URL||'http://127.0.0.1:8767/');await page.waitForFunction(()=>window.hosshiiReadOnly===false&&document.getElementById('lineAuthGate').hidden);
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(600);await page.waitForFunction(()=>salaryMarbleState==='idle');
  const state=await page.evaluate(()=>({shifts:localStorage.getItem('mybasket_shifts_v23'),wages:localStorage.getItem('mybasket_wages_v77'),pay:document.getElementById('goalCurrentPay').textContent,table:document.getElementById('itoReceiveTable').textContent}));
  if(variant==='before')states.set(size.width,state);else assert.deepEqual(state,states.get(size.width),'Values and stored data unchanged');
  const typography=await page.evaluate(()=>{
   const selectors=['#todayDate','#monthlyReceiveTitle','#itoReceiveTable .hc-cols strong','#itoReceiveTable .hc-row > span:first-child','#itoReceiveTable .hc-row > span:nth-child(2)','#yearlyTotalPay','#itoWallRemainingAmount','#itoReceiveTable .hc-grand-total > span:nth-child(2)','#goalCurrentPay','#test28GoalEdit','#itoWallThreshold','#tab-clock .ito-wall-note'];
   return Object.fromEntries(selectors.map(s=>{const el=document.querySelector(s),c=getComputedStyle(el);return [s,{family:c.fontFamily,size:c.fontSize,weight:c.fontWeight,spacing:c.letterSpacing,lineHeight:c.lineHeight}]}));
  });
  if(variant==='before')fonts.set(size.width,typography);else {
   assert.deepEqual(typography['#goalCurrentPay'],fonts.get(size.width)['#goalCurrentPay'],'Keep favourite central ring font exactly');
   for(const selector of ['#todayDate','#monthlyReceiveTitle','#itoReceiveTable .hc-cols strong','#itoReceiveTable .hc-row > span:first-child','#itoReceiveTable .hc-row > span:nth-child(2)','#yearlyTotalPay','#itoWallRemainingAmount'])assert(typography[selector].family.includes('Noto Serif JP'));
   for(const selector of ['#test28GoalEdit'])assert(typography[selector].family.includes('Noto Sans JP'));
  }
  if(variant==='after'){
   assert.equal(typography['#itoReceiveTable .hc-cols strong'].size,'14px');
   assert.equal(typography['#itoReceiveTable .hc-cols strong'].weight,'700');
   assert(parseFloat(typography['#itoReceiveTable .hc-row > span:first-child'].size)>=13);
   assert.equal(typography['#itoReceiveTable .hc-row > span:nth-child(2)'].weight,'600');
   assert.equal(typography['#tab-clock .ito-wall-note'].size,'14px');
  }
  report.fontChecks.push({width:size.width,variant,typography});
  const card=await page.evaluate(()=>[...document.querySelectorAll('#yearlyTitleLabel,#incomeWallBox,#incomeWallBox *')].map(el=>{const c=getComputedStyle(el);return {inkTarget:!!el.closest('.ito-wall-note,#itoWallThreshold'),tag:el.tagName,id:el.id,text:el.textContent.trim(),family:c.fontFamily,color:c.color,size:c.fontSize,weight:c.fontWeight,lineHeight:c.lineHeight,spacing:c.letterSpacing,margin:c.margin,padding:c.padding,background:c.background,border:c.border};}));
  const ck=`card:${size.width}`;
  if(variant==='before')states.set(ck,card);else {
   const old=states.get(ck);assert.equal(card.length,old.length);
   for(let i=0;i<card.length;i++){
    assert(card[i].family.includes('Noto Serif JP'),`Whole annual card is serif: ${card[i].tag} ${card[i].id} ${card[i].family} ${card[i].text.slice(0,30)}`);
    for(const k of ['tag','id','text','size','weight','lineHeight','spacing','margin','padding','background','border'])assert.deepEqual(card[i][k],old[i][k],`${card[i].text}: unchanged ${k}`);
    if(card[i].inkTarget)assert.equal(card[i].color,'rgb(48, 32, 39)');
    else assert.equal(card[i].color,old[i].color,'Preserve ordinary and red colours');
   }
  }
  report.fontChecks.push({width:size.width,variant,annualCard:card});

  const inventory=await page.evaluate(()=>{
   const els=[...document.querySelectorAll('#tab-clock *,#itoStickyHeaderHost *')].filter(el=>el.getClientRects().length&&[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&!el.closest('svg'));
   return els.map(el=>{const c=getComputedStyle(el);return {text:el.textContent.trim(),tag:el.tagName,id:el.id,cls:el.className,family:c.fontFamily,color:c.color,fill:c.webkitTextFillColor,size:c.fontSize,weight:c.fontWeight,spacing:c.letterSpacing,lineHeight:c.lineHeight,padding:c.padding,margin:c.margin,background:c.background,border:c.border,ring:!!el.closest('#goalRing'),control:!!el.closest('button,select,input'),inkTarget:!!el.closest('.ito-wall-note,#itoWallThreshold'),fontTarget:!!el.closest('#incomeWallBox')};});
  });
  const ik=`inventory:${size.width}`;
  if(variant==='before')states.set(ik,inventory);else {
   const before=states.get(ik);assert.equal(inventory.length,before.length);
   for(let i=0;i<before.length;i++){
    const a=before[i],b=inventory[i];
    for(const k of ['text','tag','id','cls','size','weight','spacing','lineHeight','padding','margin','background','border'])assert.deepEqual(b[k],a[k],`${a.text}: unchanged ${k}`);
    if(!a.fontTarget)assert.equal(b.family,a.family,`${a.text}: unchanged font`);
    else assert.equal(b.family,typography['#todayDate'].family,`${a.text}: month serif`);
    const rgb=a.color.match(/[\d.]+/g).map(Number),red=rgb[0]>rgb[1]*1.5&&rgb[0]-rgb[1]>35;
    if(!a.inkTarget){assert.equal(b.color,a.color,`${a.text}: preserve ring/control/red colour`);assert.equal(b.fill,a.fill);}
   }
   report.regressionChecks.push({width:size.width,checkedTextNodes:before.length,sizesSpacingBackgroundsUnchanged:true,ringControlRedColoursUnchanged:true});
  }
  report.textChecks.push({width:size.width,variant,inventory});

  for(const section of ['annual','notes']){
   await page.evaluate(section=>{const sc=document.getElementById('appScroll');window.scrollTo(0,0);if(section==='overview')sc.scrollTop=0;else {const target=section==='notes'?document.querySelector('#incomeWallBox .ito-wall-note'):document.getElementById('incomeWallBox').parentElement;sc.scrollTop+=target.getBoundingClientRect().top-sc.getBoundingClientRect().top;}},section);
   await page.waitForTimeout(220);const check=await audit(page,'#appCard');assert(!check.horizontalOverflow&&!check.appScrollOverflow&&!check.buttonOverlaps.length&&!check.blockedButtonCenters.length);
   await page.screenshot({path:path.join(dir,`${section}-${variant}.png`)});report.captures.push({width:size.width,variant,section,...check});
  }
  const clippedCard=await page.locator('#incomeWallBox p,#incomeWallBox p span,#incomeWallBox label,#itoWallRemainingLabel,#itoWallRemainingAmount').evaluateAll(els=>els.filter(el=>el.clientWidth&&el.scrollWidth>el.clientWidth+1).map(el=>el.textContent));assert.deepEqual(clippedCard,[],'No clipped annual card text');
  report.textChecks.push({width:size.width,variant,clippedCard});
  // Row labels and currency amounts must fit their allocated columns.
  const clipped=await page.locator('#itoReceiveTable .hc-row > span').evaluateAll(els=>els.filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>el.textContent));assert.deepEqual(clipped,[],'No clipped table text');
  assert.deepEqual(await page.locator('#itoReceiveTable .hc-cols strong').evaluateAll(els=>els.filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>el.textContent)),[],'No clipped column headings');
  const clippedSerifTargets=await page.locator('.oct23-sticky-pay button,#hosshiiTrialBanner .hosshii-trial-status-line,#itoReceiveTable .hc-job-title > span').evaluateAll(els=>els.filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>el.textContent));assert.deepEqual(clippedSerifTargets,[],'No clipping in serif font targets');
  report.textChecks.push({width:size.width,variant,clipped,clippedSerifTargets});
  for(const tab of ['calendar','list','settings','guide']){
   await page.locator('#btn-'+tab).click();await page.evaluate(()=>document.getElementById('appScroll').scrollTop=0);await page.waitForTimeout(180);
   const fingerprint=await page.evaluate(()=>[...document.querySelectorAll('#itoStickyHeaderHost h2,#itoStickyHeaderHost .wage-setting-title,#appScroll > .tab-content:not(.hidden) h3,#hosshiiBottomNav button')].map(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return [el.textContent,s.fontFamily,s.fontSize,s.fontWeight,s.lineHeight,s.letterSpacing,r.width,r.height]}));
   const k=`${size.width}:${tab}`;if(variant==='before')states.set(k,fingerprint);else assert.deepEqual(fingerprint,states.get(k),'Other tabs remain unchanged');report.otherTabs.push({width:size.width,variant,tab});
  }
  await c.close();console.log(size.width,variant,'passed');
 }
 await browser.close();assert.equal(fontFailures.length,0);assert.equal(report.pageErrors.length,0);
 fs.writeFileSync(path.join(root,'results.json'),JSON.stringify(report,null,2)+'\n');console.log('All comparison checks passed');
})().catch(e=>{console.error(e);process.exit(1)});
