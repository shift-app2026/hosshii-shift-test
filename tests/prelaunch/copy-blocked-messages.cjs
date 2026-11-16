const assert=require('node:assert/strict'),fs=require('fs');
const{chromium,scenario}=require('./browser-helper.cjs');
const out=process.env.COPY_MESSAGE_RESULTS||'/workspace/output/copy-message-fix-20261116';fs.mkdirSync(out,{recursive:true});
const report={scope:'Mobile Chromium; mock LINE/status; real shared-context Web Locks and localStorage; no physical Android or live cloud',cases:[],errors:[]};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium'});try{for(const width of[320,375]){
 async function check(x,p,reason,pattern){
  for(const tab of['calendar','list']){
   await p.locator('#btn-'+tab).tap();
   const prior=await p.evaluate(()=>({raw:localStorage.getItem(PRELAUNCH_STATE_KEY),shifts:JSON.stringify(shiftsData)}));
   await p.locator(tab==='list'?'#standaloneCopyCard button':'#calendarCopyCard button').tap();
   const note=p.locator(tab==='list'?'#hosshiiListCopyNotice':'#hosshiiCopyNotice');assert(await note.isVisible());const text=await note.innerText();assert.match(text,pattern);
   if(reason!=='expired')assert(!text.includes('無料お試し期間が終了'),'Only verified expiry gets expiry text');
   assert.equal(await p.locator('#confirmModal').isVisible(),false,'Blocked copy never asks to execute');
   assert.deepEqual(await p.evaluate(()=>({raw:localStorage.getItem(PRELAUNCH_STATE_KEY),shifts:JSON.stringify(shiftsData)})),prior,'No partial save or in-memory change');
   if(width===320)await p.screenshot({path:`${out}/${width}-${reason}-${tab}.png`,animations:'disabled'});
   report.cases.push({width,reason,tab,text,unchanged:true});
  }
 }
 const busy=await scenario(b,{width,cachedFonts:true}),q=await busy.createPage();assert.equal(await q.evaluate(()=>window.hosshiiStatusReason),'local-storage');await check(busy,q,'busy',/別の画面.*編集中/);
 await busy.page.close();await q.waitForFunction(async()=>!(await navigator.locks.query()).held.some(l=>l.name==='hosshii-edit:'+PRELAUNCH_STATE_KEY));await q.evaluate(()=>window.hosshiiResolveStorageConflict());assert.equal(await q.evaluate(()=>window.hosshiiReadOnly),false);assert(await q.locator('#hosshiiListCopyNotice').isHidden());assert(await q.locator('#hosshiiCopyNotice').isHidden());
 await q.locator('#standaloneCopyCard button').tap();assert(await q.locator('#confirmModal').isVisible(),'Recovery permits copy confirmation');await q.locator('button[onclick="closeConfirmModal(false)"]').tap();report.cases.push({width,reason:'lock-recovered',staleNoticesHidden:true,copyConfirmation:true});report.errors.push(...busy.errors);await busy.context.close();
 const conflict=await scenario(b,{width,cachedFonts:true});await conflict.page.evaluate(()=>{const s=JSON.parse(localStorage.getItem(PRELAUNCH_STATE_KEY));s.storageRevision++;localStorage.setItem(PRELAUNCH_STATE_KEY,JSON.stringify(s));saveAllDataStorage()});await check(conflict,conflict.page,'conflict',/入力内容はこの画面に保持/);report.errors.push(...conflict.errors);await conflict.context.close();
 const expired=await scenario(b,{width,cachedFonts:true,status:{status:'expired',trialActive:false}});await check(expired,expired.page,'expired',/無料お試し期間が終了/);report.errors.push(...expired.errors);await expired.context.close();
 // Deterministic transient status simulation: avoid async refresh replacing state mid-assertion.
 const pending=await scenario(b,{width,cachedFonts:true});await pending.page.evaluate(()=>{window.hosshiiCheckEntitlementClock=()=>false});
 for(const[reason,pattern]of[['checking',/利用状況を確認しています/],['unavailable',/利用状況を確認できませんでした/],['unknown',/現在は編集できません/]]){
  await pending.page.evaluate(r=>window.hosshiiSetEntitlement(true,r),reason);await check(pending,pending.page,reason,pattern);
 }
 report.errors.push(...pending.errors);await pending.context.close();console.log(width,'all reasons and recovery passed');
}}finally{await b.close();fs.writeFileSync(out+'/results.json',JSON.stringify(report,null,2));}assert.deepEqual(report.errors,[]);})().catch(e=>{console.error(e);process.exitCode=1});
