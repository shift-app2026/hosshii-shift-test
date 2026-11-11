const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const root=__dirname,src=require('path').resolve(__dirname,'../../..'),site=process.env.PREVIEW_DIR||'/workspace/pr8-modal-list-preview-verified';
const {execFileSync}=require('child_process');const beforeHTML=execFileSync('git',['show','c6ca41b:index.html'],{cwd:src,encoding:'utf8',maxBuffer:2e6}),beforeCSS=execFileSync('git',['show','c6ca41b:bordeaux-rose.css'],{cwd:src,encoding:'utf8'});const a=fs.readFileSync(src+'/index.html','utf8'),b=fs.readFileSync(site+'/index.html','utf8');
const modal=s=>s.slice(s.indexOf('<div id="shiftInputModal"'),s.indexOf('<!-- ワンタッチ時間登録画面 -->'));
assert.equal(modal(a),modal(b),'Modal HTML exactly equal');
assert.equal(fs.readFileSync(src+'/bordeaux-rose.css','utf8'),fs.readFileSync(site+'/bordeaux-rose.css','utf8'));
const styles=s=>[...s.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(x=>x[1]);assert.deepEqual(styles(a),styles(b),'All inline CSS identical');
const report={sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:src,encoding:'utf8'}).trim(),baselineCommit:'c6ca41b6912ff8b74d605910f4edf5d4751f97f4',modalHtmlIdentical:true,designCssIdentical:true,inlineStylesIdentical:true,applicationHashes:Object.fromEntries(['index.html','bordeaux-rose.css'].map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(src+'/'+n)).digest('hex')])),states:[],shots:[],checks:[],errors:[]};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
 for(const width of [320,375]){
  let fixtures;
  for(const variant of ['preview-after','before','after']){
   const c=await browser.newContext({viewport:{width,height:width===320?568:812},isMobile:true,hasTouch:true,deviceScaleFactor:2,timezoneId:'Asia/Tokyo'});
   if(variant!=='preview-after'){
    const wages=JSON.parse(fixtures.wages);if(variant==='before'){await c.route('http://127.0.0.1:8781/',r=>r.fulfill({contentType:'text/html',body:beforeHTML}));await c.route('**/bordeaux-rose.css',r=>r.fulfill({contentType:'text/css',body:beforeCSS}));}
    await c.addInitScript(data=>{localStorage.setItem('mybasket_wages_v77',JSON.stringify(data.wages));localStorage.setItem('mybasket_shifts_v23',data.shifts);localStorage.setItem('mybasket_last_backup',String(Date.now()));},{wages,shifts:fixtures.shifts});
    await c.route('https://static.line-scdn.net/**',r=>r.fulfill({contentType:'application/javascript',body:'window.liff={init:async()=>{},isLoggedIn:()=>true,getIDToken:()=>"mock-inspection-only"}'}));
    await c.route('https://*.supabase.co/**',r=>r.fulfill({json:{status:'trialing',trialActive:true,trialExpiresAt:'2026-12-02T00:00:00Z'}}));
    await c.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:fs.readFileSync(site+'/fonts/fonts.css','utf8').replaceAll('url(./','url(http://127.0.0.1:8781/preview-fonts/')}));
    await c.route('**/preview-fonts/*',r=>r.fulfill({contentType:'font/woff2',body:fs.readFileSync(site+'/fonts/'+r.request().url().split('/').pop())}));
   }
   const p=await c.newPage();p.on('pageerror',e=>report.errors.push({width,variant,message:e.message}));await p.clock.setFixedTime(new Date('2026-11-11T12:00:00+09:00'));
   await p.goto(variant==='preview-after'?'http://127.0.0.1:8787/':'http://127.0.0.1:8781/');
   if(variant==='preview-after'){await p.waitForFunction(()=>window.previewReady);fixtures=await p.evaluate(()=>({wages:previewStorage.getItem('mybasket_wages_v77'),shifts:previewStorage.getItem('mybasket_shifts_v23')}));}
   else await p.waitForFunction(()=>window.hosshiiReadOnly===false&&document.getElementById('lineAuthGate').hidden);
   await p.evaluate(()=>document.fonts.ready);await p.locator('#btn-calendar').click();await p.evaluate(()=>openShiftInputModal('2026-11-11',true));await p.evaluate(()=>document.fonts.ready);
   const data=await p.evaluate(()=>{
    const sc=document.getElementById('shiftInputScrollArea'),sr=sc.getBoundingClientRect();
    const selectors=['.shift-preset-section .preset-inline-heading','.shift-time-heading:not(.preset-inline-heading)','#modalShiftListHeading'];
    return {readOnlyNotice:(()=>{const e=document.getElementById('hosshiiModalReadOnlyNotice');return e?{display:getComputedStyle(e).display,hiddenAttribute:e.hasAttribute('hidden')}:null})(),firstSectionMargin:getComputedStyle(document.querySelector('.shift-preset-section')).marginTop,presets:configData.job1.presets.length,scrollViewportHeight:sr.height,scrollHeight:sc.scrollHeight,headings:selectors.map(sel=>{
     const el=document.querySelector(sel),s=getComputedStyle(el),r=el.getBoundingClientRect(),parent=el.parentElement.getBoundingClientRect();
     const rules=[];function visit(rs){for(const rule of rs){if(rule.type===CSSRule.MEDIA_RULE){if(matchMedia(rule.conditionText).matches)visit(rule.cssRules)}else if(rule.type===CSSRule.STYLE_RULE){if(el.matches(rule.selectorText)){let declarations={};for(const prop of ['font-family','font-size','font-weight','line-height','letter-spacing'])if(rule.style.getPropertyValue(prop))declarations[prop]={value:rule.style.getPropertyValue(prop),priority:rule.style.getPropertyPriority(prop)};if(Object.keys(declarations).length)rules.push({selector:rule.selectorText,declarations});}}}}
     for(const sheet of document.styleSheets)try{visit(sheet.cssRules)}catch{}
     return {selector:sel,text:el.textContent,family:s.fontFamily,size:s.fontSize,weight:s.fontWeight,color:s.color,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,contentTop:r.top-sr.top+sc.scrollTop,parentDisplay:getComputedStyle(el.parentElement).display,parentJustify:getComputedStyle(el.parentElement).justifyContent,rules};
    })};
   });
   if(variant==='after'){
    const prev=report.states.find(x=>x.width===width&&x.variant==='preview-after');assert.deepEqual(data.headings,prev.data.headings,'PR and preview: identical headings, typography and content coordinates');assert.equal(data.scrollHeight,prev.data.scrollHeight);assert.equal(data.scrollViewportHeight,prev.data.scrollViewportHeight);assert.equal(data.firstSectionMargin,'0px');
   }
   report.states.push({width,variant,data});
   if(variant!=='before')for(const h of data.headings){assert(h.family.includes('Noto Serif JP'));assert.equal(h.size,'16px');assert.equal(h.weight,'800');assert.equal(h.lineHeight,'24px');assert.equal(h.color,'rgb(48, 32, 39)');}

   const timeFits=await p.evaluate(()=>['new_preset_start','new_preset_end'].map(id=>{const el=document.getElementById(id),s=getComputedStyle(el),c=document.createElement('canvas').getContext('2d');c.font=s.fontWeight+' '+s.fontSize+' '+s.fontFamily;return {id,available:el.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),maxTextWidth:Math.max(...['00:00','09:00','18:00','23:59'].map(v=>c.measureText(v).width)),font:s.fontSize,indent:s.textIndent};}));
   if(variant!=='before')for(const t of timeFits)assert(t.maxTextWidth<=t.available,'Full time value fits: '+JSON.stringify(t));
   report.checks.push({width,variant,timeFits});
   async function checkShot(name){
    await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(100);
    const geometry=await p.evaluate(()=>{
     const sc=document.getElementById('appScroll'),nav=document.getElementById('hosshiiBottomNav'),modal=document.getElementById('shiftInputModal');
     const scope=modal.classList.contains('hidden')?document.getElementById('appCard'):modal;
     const buttons=[...scope.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length&&getComputedStyle(b).visibility!=='hidden').map(b=>{let a=b.getBoundingClientRect(),r={left:Math.max(0,a.left),right:Math.min(innerWidth,a.right),top:Math.max(0,a.top),bottom:Math.min(innerHeight,a.bottom)};for(let el=b.parentElement;el;el=el.parentElement)if(/hidden|auto|scroll|clip/.test(getComputedStyle(el).overflow)){let q=el.getBoundingClientRect();r={left:Math.max(r.left,q.left),right:Math.min(r.right,q.right),top:Math.max(r.top,q.top),bottom:Math.min(r.bottom,q.bottom)}}return{b,r}}).filter(x=>x.r.right-x.r.left>3&&x.r.bottom-x.r.top>3);
     const blocked=buttons.filter(({b,r})=>!b.contains(document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2))).map(({b})=>b.textContent);
     const overlaps=[];for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){let a=buttons[i],b=buttons[j];if(Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left)>2&&Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top)>2)overlaps.push([a.b.textContent,b.b.textContent])}
     return {overflow:document.documentElement.scrollWidth>innerWidth||sc.scrollWidth>sc.clientWidth+1,blocked,overlaps,navOverScroll:sc.getBoundingClientRect().bottom>nav.getBoundingClientRect().top+1};
    });assert(!geometry.overflow&&!geometry.navOverScroll,name+' overflow');assert.deepEqual(geometry.blocked,[],name+' blocked');assert.deepEqual(geometry.overlaps,[],name+' overlaps');
    await p.screenshot({path:`${root}/${width}-${variant}-${name}.png`});report.shots.push({width,variant,name,...geometry});
   }

   for(const position of ['top','middle','bottom']){
    await p.locator('#shiftInputScrollArea').evaluate((el,pos)=>el.scrollTop=pos==='top'?0:pos==='middle'?Math.max(0,document.querySelector('.shift-time-heading:not(.preset-inline-heading)').getBoundingClientRect().top-el.getBoundingClientRect().top+el.scrollTop):el.scrollHeight,position);await checkShot('shift-'+position);
   }

   await p.evaluate(()=>closeShiftInputModal());
   const dateStyles=await p.evaluate(()=>[...document.querySelectorAll('.standalone-date,.luxe-day-number,.luxe-day-week')].map(e=>{const s=getComputedStyle(e);return [e.textContent,s.fontFamily,s.fontSize,s.fontWeight,s.color]}));
   if(variant==='after')assert.deepEqual(dateStyles,report.states.find(x=>x.width===width&&x.variant==='before').dateStyles,'Date and weekday typography unchanged');
   report.states[report.states.length-1].dateStyles=dateStyles;
   for(const tab of ['clock','calendar','settings','guide']){
    await p.locator('#btn-'+tab).click();await p.evaluate(()=>{document.getElementById('appScroll').scrollTop=0;window.scrollTo(0,0)});
    if(tab==='clock')await p.waitForFunction(()=>salaryMarbleState==='idle');
    if(variant!=='preview-after')await checkShot(tab);
   }
   await p.locator('#btn-list').click();await p.evaluate(()=>{document.getElementById('appScroll').scrollTop=0;document.getElementById('standaloneShiftListContainer').scrollTop=0;window.scrollTo(0,0)});
   if(variant!=='before'){
    assert.equal(await p.locator('#standaloneJobLegend').count(),0);assert(await p.locator('#standaloneCopyCard').isVisible());
    assert.equal(await p.locator('#standaloneShiftListContainer .hosshii-calendar-mark,#standaloneShiftListContainer .job-color-dot').count(),0);
    assert((await p.locator('#standaloneShiftListContainer .standalone-workplace-name').allTextContents()).some(t=>t.includes('（有給）')));
    const times=await p.locator('#standaloneShiftListContainer .standalone-shift-line .job-time').evaluateAll(els=>els.map(e=>{const s=getComputedStyle(e),n=e.nextElementSibling,c=getComputedStyle(n);return {size:parseFloat(s.fontSize),weight:s.fontWeight,nameSize:parseFloat(c.fontSize),name:n.textContent,time:e.textContent}}));
    assert(times.length);for(const t of times){assert.equal(t.size,16);assert.equal(t.weight,'600');assert.equal(t.nameSize,t.size-2);assert(t.name.length>0)}
    const paydays=await p.locator('#standaloneShiftListContainer .luxe-payday-label').allTextContents();assert(paydays.includes('♡ローズカフェお給料日'));assert(paydays.every(t=>/^♡.+お給料日$/.test(t)));
    report.checks.push({width,variant,times,paydays});
   }
   if(variant!=='preview-after'){
    await checkShot('list-top');
    for(const [label,date] of [['today','2026-11-11'],['payday','2026-11-10'],['paid','2026-11-14']]){await p.locator('#list-row-'+date).scrollIntoViewIfNeeded();await checkShot('list-'+label);}
   }

   if(variant==='after'){
    // Copy from the view actually invoking the existing algorithm, including year rollover.
    for(const view of ['list','calendar']){
     await p.locator('#btn-'+view).click();
     const seed=await p.evaluate(view=>{
      currentPeriodDate=view==='calendar'?new Date(2027,0,1):new Date(2026,10,1);
      currentListDate=view==='list'?new Date(2027,0,1):new Date(2026,10,1);
      const k=(y,m,d)=>formatDateKey(new Date(y,m,d));
      shiftsData={};
      shiftsData[k(2026,11,4)]={job1:[{start:'09:00',end:'17:00',breakMins:60,isPaidLeave:false}],job2:[{hours:8,isPaidLeave:true}]};
      shiftsData[k(2026,11,5)]={job1:[{start:'09:00',end:'17:00',breakMins:60,isPaidLeave:false}]};
      shiftsData[k(2026,11,6)]={job1:[{hours:8,isPaidLeave:true}]};
      shiftsData[k(2027,0,2)]={job1:[{start:'06:00',end:'08:00',breakMins:0,isPaidLeave:false}]};
      refreshAll();return {source:JSON.stringify(shiftsData[k(2026,11,4)]),target:JSON.stringify(shiftsData[k(2027,0,2)])};
     },view);
     const button=view==='list'?p.locator('#standaloneCopyCard button'):p.locator('#tab-calendar button[onclick="copyLastMonthShifts()"]');await button.scrollIntoViewIfNeeded();await button.click();assert(await p.locator('#confirmModal').isVisible());await p.evaluate(()=>closeConfirmModal(true));
     const result=await p.evaluate(()=>{const k=(y,m,d)=>formatDateKey(new Date(y,m,d));return {copied:shiftsData[k(2027,0,1)],target:JSON.stringify(shiftsData[k(2027,0,2)]),paidOnly:shiftsData[k(2027,0,3)],source:JSON.stringify(shiftsData[k(2026,11,4)]),calendarMonth:currentPeriodDate.getMonth(),listMonth:currentListDate.getMonth()};});
     assert.equal(result.copied.job1[0].start,'09:00');assert.equal(result.copied.job2,undefined);assert.equal(result.paidOnly,undefined);assert.equal(result.target,seed.target);assert.equal(result.source,seed.source);assert.equal(result.calendarMonth,view==='calendar'?0:10);assert.equal(result.listMonth,view==='list'?0:10);
     report.checks.push({width,view,copyYearRollover:true,usesViewMonth:true,existingEntriesPreserved:true,paidLeaveExcluded:true,sourceUnchanged:true,otherViewMonthUnchanged:true});
    }
    await p.locator('#btn-list').click();await p.evaluate(()=>{currentListDate=new Date(2027,0,1);configData.job1.name='<x&"';renderStandaloneShiftList('keep')});
    assert((await p.locator('.standalone-workplace-name').first().innerText()).includes('<x&"'));assert.equal(await p.locator('#standaloneShiftListContainer x,#standaloneShiftListContainer img').count(),0);
    const beforeBlock=await p.evaluate(()=>JSON.stringify(shiftsData));await p.evaluate(()=>{window.hosshiiReadOnly=true;copyLastMonthShifts()});assert.equal(await p.evaluate(()=>JSON.stringify(shiftsData)),beforeBlock);assert(await p.locator('#hosshiiListCopyNotice').isVisible());
    report.checks.push({width,escapingSafe:true,expiredCopyBlocked:true});
   }
   await c.close();console.log(width,variant,'passed');

  }
 }
 await browser.close();assert.deepEqual(report.errors,[]);fs.writeFileSync(root+'/results.json',JSON.stringify(report,null,2));console.log('All checks passed');
})().catch(e=>{console.error(e);process.exit(1)});
