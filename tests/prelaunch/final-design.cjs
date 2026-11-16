const fs=require('fs'),assert=require('node:assert/strict');const{chromium,scenario,legacy}=require('./browser-helper.cjs');
const out='/workspace/output/prelaunch-fix-20261116/design';fs.mkdirSync(out,{recursive:true});
const report={scope:'Functional-project Chromium screenshots, mocked services, same synthetic data. Not real Android/LINE.',screens:[],errors:[]};
const wages={...legacy,jobCount:3,job2:{...legacy.job1,name:'月色ショップ'},job3:{...legacy.job1,name:'星空キッチン'}};
const shifts={'2026-11-12':{job1:[{start:'09:00',end:'17:00',breakMins:60}],job2:[{start:'18:00',end:'22:00',breakMins:0}]}};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium'});try{for(const width of[320,375])for(const variant of['before','after']){
 const x=await scenario(b,{width,wages,shifts,cachedFonts:true,sourceRoot:variant==='before'?'/workspace/work/hosshii-microtune-proposal':undefined}),p=x.page;await p.evaluate(()=>document.fonts.ready);
 async function shot(scene){await p.waitForTimeout(120);await p.screenshot({path:`${out}/${width}-${variant}-${scene}.png`,animations:'disabled'});report.screens.push({width,variant,scene});}
 await p.waitForFunction(()=>salaryMarbleState==='idle');await shot('salary');
 await p.locator('#btn-calendar').click();assert.equal(await p.locator('#tab-calendar>.hosshii-expired-permanent').evaluateAll(es=>es.every(e=>e.hidden)),true);await shot('calendar');
 await p.locator('#btn-list').click();await shot('schedule');
 const copy=await p.locator('#standaloneCopyCard').evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth,label:e.querySelector('.copy-label').innerText,rect:e.getBoundingClientRect().toJSON(),button:e.querySelector('button').getBoundingClientRect().toJSON()}));
 await p.locator('#btn-settings').click();await shot('settings');
 const paid=await p.locator('.hosshii-paid-header').evaluate(e=>({gap:getComputedStyle(e).rowGap,titleBottom:e.firstElementChild.getBoundingClientRect().bottom,rowTop:e.lastElementChild.getBoundingClientRect().top}));
 await p.locator('.hosshii-paid-header').scrollIntoViewIfNeeded();await shot('settings-paid');
 await p.locator('#btn-guide').click();await shot('guide-top');
 await p.locator('.guide-calendar-help,.guide-extra').first().scrollIntoViewIfNeeded();await shot('guide-help');
 const help=await p.locator('.guide-extra').evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth,lines:[...e.querySelectorAll('.guide-help-line')].map(el=>({text:el.textContent,height:el.getBoundingClientRect().height,lineHeight:parseFloat(getComputedStyle(el).lineHeight),width:el.clientWidth,scroll:el.scrollWidth}))}));
 await p.locator('.guide-contained-title').last().scrollIntoViewIfNeeded();await shot('guide-backup-title');
 await p.evaluate(()=>document.getElementById('appScroll').scrollTop=999999);await shot('guide-bottom');
 if(variant==='after'){assert.equal(help.lines.length,5);assert(help.lines.every(l=>l.scroll<=l.width+1),'Guide lines horizontally contained');assert(help.lines.every(l=>l.height<=l.lineHeight+2),'Requested five guide lines each fit');assert.equal(paid.gap,'2px');assert(copy.label.includes('『一括コピー』'));assert(copy.scroll<=copy.width+1,'Copy card contained');}
 report.screens.push({width,variant,metrics:{copy,paid,help}});report.errors.push(...x.errors);await x.context.close();console.log(width,variant,'captured');
}assert.deepEqual(report.errors,[]);}finally{await b.close();fs.writeFileSync(out+'/results.json',JSON.stringify(report,null,2))}})().catch(e=>{console.error(e);process.exitCode=1});
