const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const root=__dirname,src=require('path').resolve(__dirname,'../../..'),site=process.env.PREVIEW_DIR||'/workspace/pr8-readable-approved';
const {execFileSync}=require('child_process');const beforeHTML=execFileSync('git',['show','c245543:index.html'],{cwd:src,encoding:'utf8',maxBuffer:2e6}),beforeCSS=execFileSync('git',['show','c245543:bordeaux-rose.css'],{cwd:src,encoding:'utf8'});const a=fs.readFileSync(src+'/index.html','utf8'),b=fs.readFileSync(site+'/index.html','utf8');
const modal=s=>s.slice(s.indexOf('<div id="shiftInputModal"'),s.indexOf('<!-- ワンタッチ時間登録画面 -->'));
assert.equal(modal(a),modal(b),'Modal HTML exactly equal');
assert.equal(fs.readFileSync(src+'/bordeaux-rose.css','utf8'),fs.readFileSync(site+'/bordeaux-rose.css','utf8'));
const styles=s=>[...s.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(x=>x[1]);assert.deepEqual(styles(a),styles(b),'All inline CSS identical');
const report={sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:src,encoding:'utf8'}).trim(),baselineCommit:'c2455432dafa505605ed59df46fec75f93eb1683',modalHtmlIdentical:true,designCssIdentical:true,inlineStylesIdentical:true,applicationHashes:Object.fromEntries(['index.html','bordeaux-rose.css'].map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(src+'/'+n)).digest('hex')])),states:[],shots:[],checks:[],errors:[]};
const sizeForWidth=w=>w<=359?14:15;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
 for(const width of [320,375]){
  let fixtures;
  for(const variant of ['preview-after','before','after']){
   const c=await browser.newContext({viewport:{width,height:width===320?568:812},isMobile:true,hasTouch:true,deviceScaleFactor:2,timezoneId:'Asia/Tokyo'});
   if(variant!=='preview-after'){
    const wages=JSON.parse(fixtures.wages);if(variant==='before'){await c.route('http://127.0.0.1:8791/',r=>r.fulfill({contentType:'text/html',body:beforeHTML}));await c.route('**/bordeaux-rose.css',r=>r.fulfill({contentType:'text/css',body:beforeCSS}));}
    await c.addInitScript(data=>{localStorage.setItem('mybasket_wages_v77',JSON.stringify(data.wages));localStorage.setItem('mybasket_shifts_v23',data.shifts);localStorage.setItem('mybasket_last_backup',String(Date.now()));},{wages,shifts:fixtures.shifts});
    await c.route('https://static.line-scdn.net/**',r=>r.fulfill({contentType:'application/javascript',body:'window.liff={init:async()=>{},isLoggedIn:()=>true,getIDToken:()=>"mock-inspection-only"}'}));
    await c.route('https://*.supabase.co/**',r=>r.fulfill({json:{status:'trialing',trialActive:true,trialExpiresAt:'2026-12-02T00:00:00Z'}}));
    await c.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:fs.readFileSync(site+'/fonts/fonts.css','utf8').replaceAll('url(./','url(http://127.0.0.1:8791/preview-fonts/')}));
    await c.route('**/preview-fonts/*',r=>r.fulfill({contentType:'font/woff2',body:fs.readFileSync(site+'/fonts/'+r.request().url().split('/').pop())}));
   }
   const p=await c.newPage();p.on('pageerror',e=>report.errors.push({width,variant,message:e.message}));await p.clock.setFixedTime(new Date('2026-11-11T12:00:00+09:00'));
   await p.goto(variant==='preview-after'?'http://127.0.0.1:8810/':'http://127.0.0.1:8791/');
   if(variant==='preview-after'){await p.waitForFunction(()=>window.previewReady);fixtures=await p.evaluate(()=>({wages:previewStorage.getItem('mybasket_wages_v77'),shifts:previewStorage.getItem('mybasket_shifts_v23')}));}
   else await p.waitForFunction(()=>window.hosshiiReadOnly===false&&document.getElementById('lineAuthGate').hidden);
   await p.evaluate(()=>document.fonts.ready);await p.locator('#btn-list').click();await p.evaluate(()=>openShiftInputModal('2026-11-11',false));await p.evaluate(()=>document.fonts.ready);
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
   const jobChoice=await p.locator('#modalJobSelectContainer .modal-job-trigger-name').evaluate(e=>{const c=getComputedStyle(e);return {font:c.fontFamily,size:c.fontSize,lineHeight:c.lineHeight,weight:c.fontWeight};});
   if(variant==='after'){const old=report.states.find(s=>s.width===width&&s.variant==='before').jobChoice;assert.equal(jobChoice.size,old.size);assert.equal(jobChoice.lineHeight,old.lineHeight);assert.equal(jobChoice.weight,old.weight);assert(jobChoice.font.includes('Noto Serif JP'));}
   report.states[report.states.length-1].jobChoice=jobChoice;

   if(variant!=='before')for(const h of data.headings){assert(h.family.includes('Noto Serif JP'));assert.equal(h.size,'16px');assert.equal(h.weight,'800');assert.equal(h.lineHeight,'24px');assert.equal(h.color,'rgb(48, 32, 39)');}

   if(variant!=='before')assert((await p.locator('#modalDateTitle').evaluate(e=>getComputedStyle(e).fontFamily)).includes('Noto Serif JP'),'Modal date numerals unified');
   const timeFits=await p.evaluate(()=>['new_preset_start','new_preset_end'].map(id=>{const el=document.getElementById(id),s=getComputedStyle(el),c=document.createElement('canvas').getContext('2d');c.font=s.fontWeight+' '+s.fontSize+' '+s.fontFamily;return {id,available:el.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),maxTextWidth:Math.max(...['00:00','09:00','18:00','23:59'].map(v=>c.measureText(v).width)),font:s.fontSize,indent:s.textIndent};}));
   if(variant!=='before')for(const t of timeFits)assert(t.maxTextWidth<=t.available,'Full time value fits: '+JSON.stringify(t));
   report.checks.push({width,variant,timeFits});
   async function checkShot(name){
    await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(100);
    // Inspect settled UI after the existing transient save notification finishes.
    await p.waitForFunction(()=>{const t=document.getElementById('toastMessage');return !t||t.classList.contains('opacity-0')||getComputedStyle(t).pointerEvents==='none';},null,{timeout:6000});
    const geometry=await p.evaluate(()=>{
     const sc=document.getElementById('appScroll'),nav=document.getElementById('hosshiiBottomNav'),modal=document.getElementById('shiftInputModal');
     const overlays=[...document.querySelectorAll('#customTimePickerModal,#presetRegisterModal,#breakSelectModal,#overtimeInfoModal,#alertModal,#confirmModal,#shiftInputModal,#renameJobModal,#presetHelpModal,#shiftUsageHelpModal,#breakdownModal,#t31GoalModal,#hosshiiJobMenu')].filter(e=>!e.classList.contains('hidden')&&!e.hidden&&e.getClientRects().length).sort((a,b)=>Number(getComputedStyle(b).zIndex)-Number(getComputedStyle(a).zIndex));const scope=overlays[0]||document.getElementById('appCard');
     const buttons=[...scope.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length&&getComputedStyle(b).visibility!=='hidden').map(b=>{let a=b.getBoundingClientRect(),r={left:Math.max(0,a.left),right:Math.min(innerWidth,a.right),top:Math.max(0,a.top),bottom:Math.min(innerHeight,a.bottom)};for(let el=b.parentElement;el;el=el.parentElement)if(/hidden|auto|scroll|clip/.test(getComputedStyle(el).overflow)){let q=el.getBoundingClientRect();r={left:Math.max(r.left,q.left),right:Math.min(r.right,q.right),top:Math.max(r.top,q.top),bottom:Math.min(r.bottom,q.bottom)}}return{b,r,cx:(a.left+a.right)/2,cy:(a.top+a.bottom)/2}}).filter(x=>x.r.right-x.r.left>3&&x.r.bottom-x.r.top>3&&x.cx>x.r.left+1&&x.cx<x.r.right-1&&x.cy>x.r.top+1&&x.cy<x.r.bottom-1);
     const blocked=buttons.filter(({b,cx,cy})=>!b.contains(document.elementFromPoint(cx,cy))).map(({b,cx,cy})=>({label:b.textContent,hit:document.elementFromPoint(cx,cy)?.id,hitClass:document.elementFromPoint(cx,cy)?.className}));
     const overlaps=[];for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){let a=buttons[i],b=buttons[j];if(Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left)>2&&Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top)>2)overlaps.push([a.b.textContent,b.b.textContent])}
     return {overflow:document.documentElement.scrollWidth>innerWidth||sc.scrollWidth>sc.clientWidth+1,blocked,overlaps,navOverScroll:sc.getBoundingClientRect().bottom>nav.getBoundingClientRect().top+1};
    });assert(!geometry.overflow&&!geometry.navOverScroll,name+' overflow');assert.deepEqual(geometry.blocked,[],name+' blocked');assert.deepEqual(geometry.overlaps,[],name+' overlaps');
    await p.screenshot({path:`${root}/${width}-${variant}-${name}.png`});report.shots.push({width,variant,name,...geometry});
   }

   for(const position of ['top','middle','bottom']){
    await p.locator('#shiftInputScrollArea').evaluate((el,pos)=>el.scrollTop=pos==='top'?0:pos==='middle'?Math.max(0,document.querySelector('.shift-time-heading:not(.preset-inline-heading)').getBoundingClientRect().top-el.getBoundingClientRect().top+el.scrollTop):el.scrollHeight,position);await checkShot('shift-'+position);
   }

   if(variant!=='preview-after'){
    await p.evaluate(()=>openCustomTimePicker('new_preset_start'));await checkShot('clock-hours');
    const clock=await p.locator('#customClockFace text,#customTimePickerModal .hclock-digital button').evaluateAll(es=>es.map(e=>getComputedStyle(e).fontFamily));
    if(variant==='after')assert(clock.every(f=>f.includes('Noto Serif JP')),'Display digits use serif');
    await p.locator('#clockMinuteDisplay').click();await checkShot('clock-minutes');await p.evaluate(()=>closeCustomTimePicker());
   }
   await p.evaluate(()=>closeShiftInputModal());
   if(variant!=='preview-after'){
    const popups=[
     ['rename','renameJobPrompt(\'job1\')','closeRenameJobModal()'],
     ['break','openBreakSelectModal(\'new\')','closeBreakSelectModal()'],
     ['preset-help','openPresetHelpModal()','closePresetHelpModal()'],
     ['shift-help','showShiftHelp()','closeShiftHelp()'],
     ['wage-help','openOvertimeInfoModal()','closeOvertimeInfoModal()'],
     ['preset-register','openPresetRegisterModal()','closePresetRegisterModal()'],
     ['breakdown','openBreakdownModal()','closeBreakdownModal()'],
     ['goal','editMonthlyGoal()','closeMonthlyGoalDialog()'],
     ['alert','showAlertModal(\'表示確認用の架空メッセージです。\')','closeAlertModal()'],
     ['confirm','askConfirm(\'表示を確認します。\',()=>{},\'確認\')','closeConfirmModal(false)']
    ];
    for(const [name,open,close] of popups){await p.evaluate(code=>(0,eval)(code),open);await checkShot('popup-'+name);await p.evaluate(code=>(0,eval)(code),close);}
   }

   const dateStyles=await p.evaluate(()=>[...document.querySelectorAll('.standalone-date,.luxe-day-number,.luxe-day-week')].map(e=>{const s=getComputedStyle(e);return [e.textContent,s.fontFamily,s.fontSize,s.fontWeight,s.color]}));
   if(variant==='after')assert.deepEqual(dateStyles.map(x=>x.slice(0,3)),report.states.find(x=>x.width===width&&x.variant==='before').dateStyles.map(x=>x.slice(0,3)),'Date and weekday family and sizes unchanged');
   report.states[report.states.length-1].dateStyles=dateStyles;
   for(const tab of ['clock','calendar','settings','guide']){
    await p.locator('#btn-'+tab).click();await p.evaluate(()=>{document.getElementById('appScroll').scrollTop=0;window.scrollTo(0,0)});
    if(tab==='clock'){
     await p.waitForFunction(()=>salaryMarbleState==='idle'&&Math.abs(test7MarblePercent-salaryMarbleTarget)<0.01);
     const pay=await p.evaluate(()=>[...document.querySelectorAll('#goalRing,#goalRing *')].map(e=>{const s=getComputedStyle(e);return [e.tagName,e.id,e.textContent,s.fontFamily,s.fontSize,s.fontWeight,s.color,s.lineHeight,s.background,s.border,s.padding]}));
     if(variant==='after')assert.deepEqual(pay,report.states.find(x=>x.width===width&&x.variant==='before').salaryStyles,'Ring design and centre text unchanged');
     report.states[report.states.length-1].salaryStyles=pay;
    }
    if(variant!=='preview-after')await checkShot(tab);
    if(tab==='clock'&&variant!=='preview-after'){
     await p.evaluate(()=>{const sc=document.getElementById('appScroll');sc.scrollTop+=document.getElementById('monthlyReceiveTitle').getBoundingClientRect().top-sc.getBoundingClientRect().top;});await checkShot('salary-table');
     const headings=await p.locator('.hc-cols strong').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e),r=document.createRange();r.selectNodeContents(e);return {text:e.textContent,lines:new Set([...r.getClientRects()].filter(r=>r.width>0).map(r=>r.top)).size,width:e.clientWidth,scroll:e.scrollWidth,size:s.fontSize,colour:s.color,weight:s.fontWeight};}));
     if(variant==='after')for(const h of headings){assert.equal(h.lines,1);assert(h.scroll<=h.width+1,'Receipt heading fits: '+JSON.stringify(h));assert.equal(h.colour,'rgb(36, 22, 28)');}
     const table=await p.locator('.hc-comparison .hc-row > span').evaluateAll(es=>es.map(e=>({text:e.textContent,colour:getComputedStyle(e).color,weight:getComputedStyle(e).fontWeight})));
     if(variant==='after')for(const t of table){assert.equal(t.colour,'rgb(36, 22, 28)');assert.equal(t.weight,'700');}
     report.checks.push({width,variant,headings,table});
    }

    if(tab==='guide'){
     const cards=await p.locator('.guide-steps p').evaluateAll(es=>es.map(e=>{const c=getComputedStyle(e),r=e.getBoundingClientRect(),t=e.querySelector('span').getBoundingClientRect();return {width:r.width,height:r.height,background:c.background,border:c.border,padding:c.padding,textOffset:t.left-r.left,textWidth:t.width};}));
     if(variant==='after')assert.deepEqual(cards,report.states.find(x=>x.width===width&&x.variant==='before').guideCards,'Guide card dimensions, surfaces, columns and padding retained');
     report.states[report.states.length-1].guideCards=cards;
    }
    if(tab==='guide'&&variant!=='preview-after') {await p.locator('.guide-steps').scrollIntoViewIfNeeded();await checkShot('guide-steps');}
    if(tab==='settings'&&variant==='after'){
     const short=await p.evaluate(()=>[...document.querySelectorAll('#settingsJobContentArea > .space-y-3 > .grid.grid-cols-2:first-child > div > span,.hosshii-pinned-trigger-name')].map(e=>{const s=getComputedStyle(e);const r=document.createRange();r.selectNodeContents(e);return {text:e.textContent,rects:[...r.getClientRects()].filter(r=>r.width>0).map(r=>r.top),scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,whiteSpace:s.whiteSpace};}));
     for(const x of short){assert(new Set(x.rects).size===1,'Short setting text in one line: '+x.text);assert(x.scrollWidth<=x.clientWidth+1,'Short setting text not clipped: '+x.text);}
     report.checks.push({width,shortSettings:short});
    }
   }
   await p.locator('#btn-list').click();await p.evaluate(()=>{document.getElementById('appScroll').scrollTop=0;document.getElementById('standaloneShiftListContainer').scrollTop=0;window.scrollTo(0,0)});
   if(variant!=='before'){
    assert.equal(await p.locator('#standaloneJobLegend').count(),0);assert(await p.locator('#standaloneCopyCard').isVisible());
    assert.equal(await p.locator('#standaloneShiftListContainer .hosshii-calendar-mark,#standaloneShiftListContainer .job-color-dot').count(),0);
    assert((await p.locator('#standaloneShiftListContainer .standalone-paid-status').allTextContents()).includes('有給'));
    const times=await p.locator('#standaloneShiftListContainer .standalone-shift-line .job-time').evaluateAll(els=>els.map(e=>{const s=getComputedStyle(e),n=e.parentElement.querySelector('.standalone-workplace-name'),c=getComputedStyle(n);return {size:parseFloat(s.fontSize),weight:s.fontWeight,nameSize:parseFloat(c.fontSize),name:n.textContent,time:e.textContent}}));
    assert(times.length);for(const t of times){assert.equal(t.size,sizeForWidth(width));assert.equal(t.weight,'700');assert.equal(t.nameSize,t.size-2);assert(t.name.length>0)}
    const paydays=await p.locator('#standaloneShiftListContainer .luxe-payday-label').allTextContents();assert(paydays.includes('♡ローズカフェお給料日'));assert(paydays.every(t=>/^♡.+お給料日$/.test(t)));
    report.checks.push({width,variant,times,paydays});
   }
   if(variant!=='preview-after'){
    await checkShot('list-top');
    for(const [label,date] of [['today','2026-11-11'],['payday','2026-11-10'],['paid','2026-11-14']]){await p.locator('#list-row-'+date).scrollIntoViewIfNeeded();await checkShot('list-'+label);}
   }

   if(variant==='after'){
    const single=await p.evaluate(()=>[...document.querySelectorAll('#standaloneShiftListContainer .job-time,#standaloneShiftListContainer .standalone-workplace-name')].map(e=>{const r=document.createRange();r.selectNodeContents(e);return {text:e.textContent,lines:new Set([...r.getClientRects()].filter(x=>x.width>0).map(x=>Math.round(x.top*10)/10)).size,scroll:e.scrollWidth,client:e.clientWidth,whiteSpace:getComputedStyle(e).whiteSpace};}));
    for(const x of single){assert.equal(x.lines,1,'Schedule text must be one line: '+x.text);assert(x.scroll<=x.client+1,'Schedule text must fit: '+x.text);assert.equal(x.whiteSpace,'nowrap');}
    const desc=await p.locator('.schedule-instructions').allTextContents();assert.deepEqual(desc,['日付をタップするとシフトの修正できます']);
    const descFit=await p.locator('.schedule-instructions').evaluateAll(es=>es.every(e=>e.scrollWidth<=e.clientWidth+1));assert(descFit);
    assert.deepEqual(await p.locator('#tab-guide .guide-steps b').allTextContents(),['1','2','3']);const guide=await p.locator('#tab-guide .guide-steps b').evaluateAll(es=>es.map(e=>{const c=getComputedStyle(e);return{color:c.color,fill:c.webkitTextFillColor,background:c.backgroundImage,bgColor:c.backgroundColor,border:c.borderWidth,shadow:c.boxShadow}}));for(const g of guide){assert.equal(g.color,'rgb(136, 19, 55)');assert.equal(g.fill,g.color);assert.equal(g.background,'none');assert.equal(g.bgColor,'rgba(0, 0, 0, 0)');assert.equal(g.border,'0px');assert.equal(g.shadow,'none');}
    const hearts=await p.locator('#standaloneShiftListContainer .luxe-payday-heart').evaluateAll(es=>es.map(e=>getComputedStyle(e).backgroundImage));assert(hearts.length&&hearts.every(x=>x.includes('linear-gradient')));
    report.checks.push({width,oneLineSchedule:single,instructions:desc,guideNumbers:['1','2','3'],glossyHearts:true});
    const requested=await p.evaluate(()=>{
     const rows=[...document.querySelectorAll('#standaloneShiftListContainer .standalone-shift-line > span')].filter(e=>e.querySelector('.standalone-paid-status')).map(e=>[...e.children].map(c=>c.textContent));
     const hearts=[...document.querySelectorAll('#standaloneShiftListContainer .luxe-payday-heart')].map(e=>({name:e.parentElement.textContent,colour:e.style.getPropertyValue('--payday-color'),gradient:getComputedStyle(e).backgroundImage,fill:getComputedStyle(e).webkitTextFillColor}));
     const e=document.querySelector('.schedule-instructions'),r=document.createRange();r.selectNodeContents(e);return{rows,hearts,instructionLines:new Set([...r.getClientRects()].filter(r=>r.width>0).map(r=>r.top)).size,instructionWidth:e.scrollWidth,instructionAvailable:e.clientWidth};
    });
    assert.equal(requested.instructionLines,1);assert(requested.instructionWidth<=requested.instructionAvailable+1);
    for(const r of requested.rows){assert.equal(r[0],'有給');assert(r[2].length>0);}
    assert.deepEqual([...new Set(requested.hearts.map(h=>h.colour))].sort(),['#2563EB','#4D8B37','#D97757'].sort());
    for(const h of requested.hearts){assert(h.gradient.includes('gradient'));assert.equal(h.fill,'rgba(0, 0, 0, 0)');}
    report.checks.push({width,requested});

   }
   if(variant==='after'){
    const states=[];
    async function buttonState(id,kind,state){
     const btn=p.locator(id);await btn.scrollIntoViewIfNeeded();
     const expected=state==='dirty'?'rgb(255, 224, 130)':'rgb(255, 255, 255)';
     await p.waitForFunction(({id,expected})=>{const e=document.querySelector(id),s=getComputedStyle(e);return s.color===expected&&s.webkitTextFillColor===expected;},{id,expected},{timeout:3000});
     const css=await btn.evaluate(e=>{const s=getComputedStyle(e);return {colour:s.color,fill:s.webkitTextFillColor,background:s.backgroundImage,classes:e.className};});
     assert.equal(css.colour,expected,kind+' '+state);assert.equal(css.fill,expected);assert(css.background.includes('linear-gradient'),kind+' keep gloss');
     await checkShot('button-'+kind+'-'+state);states.push({kind,state,...css});
    }
    await p.locator('#btn-list').click();await p.evaluate(()=>openShiftInputModal('2026-11-11',false));
    await p.locator('#new_preset_start').evaluate(e=>{e.value='06:00';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
    await p.locator('#new_preset_end').evaluate(e=>{e.value='08:00';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
    await buttonState('#registerShiftButton','shift','dirty');await p.locator('#registerShiftButton').click();await buttonState('#registerShiftButton','shift','saved');
    await p.evaluate(()=>openPresetRegisterModal());
    for(const [id,val] of [['pr_start','05:00'],['pr_end','07:00']])await p.locator('#'+id).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},val);
    await buttonState('#registerPresetButton','preset','dirty');await p.locator('#registerPresetButton').click();await buttonState('#registerPresetButton','preset','saved');await p.locator('#modalPresetContainer button').last().click({trial:true});
    await p.evaluate(()=>{closePresetRegisterModal();closeShiftInputModal()});
    await p.locator('#btn-settings').click();await p.evaluate(()=>switchSettingsJobTab('job1'));
    for(const [id,val] of [['set_time_0_start','09:00'],['set_time_0_end','17:00'],['set_wage_0','1300']])await p.locator('#'+id).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},val);
    await buttonState('#set_reg_btn_0','wage','dirty');await p.locator('#set_reg_btn_0').click();await buttonState('#set_reg_btn_0','wage','saved');
    await p.evaluate(()=>{configData.job3=createEmptyJobConfig();configData.jobCount=2;setHosshiiJobMode(false);renderSettingsJobTabs();});
    await p.locator('#newJobNameInput').fill('星カフェ');await buttonState('#tab-settings .ito-job-register-button','workplace','dirty');await p.locator('#tab-settings .ito-job-register-button').click();await buttonState('#tab-settings .ito-job-register-button','workplace','saved');
    await p.locator('#newJobNameInput').fill('星カフェ');const beforeInvalid=await p.evaluate(()=>localStorage.getItem('mybasket_wages_v77'));await p.locator('#tab-settings .ito-job-register-button').click();assert(await p.locator('#alertModal').isVisible());assert.equal(await p.evaluate(()=>localStorage.getItem('mybasket_wages_v77')),beforeInvalid);assert.equal(await p.locator('#tab-settings .ito-job-register-button').evaluate(e=>getComputedStyle(e).color),'rgb(255, 224, 130)');await p.evaluate(()=>closeAlertModal());
    for(const kind of ['shift','preset','wage','workplace']){const [a,b]=states.filter(s=>s.kind===kind);assert.equal(a.background,b.background,'Same gloss before/after saving');}
    report.checks.push({width,registrationStates:states,failedRegistrationRemainsDirty:true});
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
