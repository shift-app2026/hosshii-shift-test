// Read-only typography and guide-card checks on the isolated preview.
const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict'),{execFileSync}=require('child_process');
const site=process.env.PREVIEW_URL||'http://127.0.0.1:8801/',report=[];
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});try{
for(const width of [320,375]){
 const p=await browser.newPage({viewport:{width,height:width===320?568:812},isMobile:true});await p.goto(site);await p.waitForFunction(()=>window.previewReady);await p.evaluate(()=>document.fonts.ready);
 const samples=[];
 async function fonts(selectors,family){for(const sel of selectors){const data=await p.locator(sel).first().evaluate(e=>{const s=getComputedStyle(e);return {text:e.textContent.trim().slice(0,45),family:s.fontFamily,size:s.fontSize,weight:s.fontWeight};});assert(data.family.includes(family),sel+': '+data.family);samples.push({selector:sel,...data});}}
 await p.locator('#btn-calendar').click();await fonts(['#currentMonthLabel','#calendarDays','#calendarJobLegend .job-label-pill','#calendarTodayDateLabel'],'Noto Serif JP');
 await p.locator('#btn-list').click();await fonts(['#currentListMonthLabel','.luxe-day-number','.luxe-day-week','.standalone-workplace-name','.standalone-shift-line .job-time'],'Noto Serif JP');
 await p.locator('#btn-settings').click();await fonts(['.ito-job-register-label','.wage-head-title','.hosshii-allowance-section-title','.hosshii-pinned-trigger-name','#hosshiiSettingsPinnedJob > span','.paid-sub','#hosshiiRegisteredJobCount'],'Noto Serif JP');await fonts(['#newJobNameInput','#set_wage_0'],'Noto Sans JP');
 await p.locator('#btn-guide').click();await fonts(['#tab-guide h3','#tab-guide h4','#tab-guide .guide-steps b'],'Noto Serif JP');await fonts(['#tab-guide .luxe-welcome-card p'],'Noto Sans JP');
 const card=()=>p.locator('#tab-guide .guide-steps p').evaluateAll(es=>es.map(e=>{const c=getComputedStyle(e),r=e.getBoundingClientRect(),span=e.querySelector('span').getBoundingClientRect();return {width:r.width,height:r.height,padding:c.padding,border:c.border,bg:c.background,shadow:c.boxShadow,textOffset:span.left-r.left,textWidth:span.width};}));
 const after=await card();await p.addStyleTag({content:execFileSync('git',['show','1050521:bordeaux-rose.css'],{encoding:'utf8'})});const before=await card();assert.deepEqual(after,before,'Guide card geometry, border, background and text position unchanged');
 await p.reload();await p.waitForFunction(()=>window.previewReady);await p.locator('#btn-calendar').click();await p.evaluate(()=>openShiftInputModal('2026-11-11',false));await p.evaluate(()=>document.fonts.ready);
 await fonts(['#modalDateTitle','#modalJobSelectContainer .modal-job-trigger-name','#modalBreakDisplayVal','.shift-date-nav button','.shift-section-title','#modalInlinePresetContainer .job-time'],'Noto Serif JP');await fonts(['#new_preset_start','.ito-preset-desc'],'Noto Sans JP');
 await p.evaluate(()=>openCustomTimePicker('new_preset_start'));await fonts(['#customTimePickerTitle','#clockHourDisplay','#customClockFace text','#hclockDate','#hclockJobName'],'Noto Serif JP');await p.evaluate(()=>{closeCustomTimePicker();openPresetRegisterModal()});await fonts(['#presetRegisterModal h3','#presetRegisterJobName','#presetRegisterModal .border-t > p.font-bold'],'Noto Serif JP');await fonts(['#pr_start'],'Noto Sans JP');
 report.push({width,samples,guideCardsUnchanged:true,cards:after});await p.close();
}
fs.writeFileSync(__dirname+'/checklist-results.json',JSON.stringify(report,null,2)+'\n');console.log('Typography policy and guide-card geometry passed at 320px and 375px');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
