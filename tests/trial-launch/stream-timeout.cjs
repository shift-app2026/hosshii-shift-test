// Loopback HTTP transport fixture. This is NOT the Supabase implementation.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'../..');let mode='complete',requests=0,origin;
const server=http.createServer((req,res)=>{
 if(req.url==='/status'){
  requests++;req.resume();res.writeHead(200,{'Content-Type':'application/json'});
  if(mode==='partial'){res.write('{');return;}
  res.end(JSON.stringify({status:'trialing',trialExpiresAt:'2026-12-03T03:00:00Z'}));return;
 }
 if(req.url==='/liff.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end("window.liff={init:async()=>{},isLoggedIn:()=>true,getIDToken:()=>'synthetic-test-token'}");return;}
 const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(p!==root&&!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 const file=p===root?path.join(root,'index.html'):p;
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 let data=fs.readFileSync(file);if(file.endsWith('index.html'))data=Buffer.from(data.toString().replace(/const STATUS_ENDPOINT = '[^']+';/,`const STATUS_ENDPOINT = '${origin}/status';`).replace(/https:\/\/static.line-scdn.net\/liff\/edge\/2\/sdk.js/g,origin+'/liff.js'));
 const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.png':'image/png'};res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);
});
(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}`;const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});try{
 const p=await browser.newPage();await p.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.fulfill({contentType:'text/css',body:''}));await p.clock.install({time:new Date('2026-11-12T03:00:00Z')});await p.clock.resume();await p.goto(origin);await p.waitForFunction(()=>document.getElementById('lineAuthGate').hidden);
 mode='partial';await p.evaluate(()=>{void window.hosshiiRefreshEntitlement()});await p.waitForFunction(()=>window.hosshiiStatusReason==='checking');while(requests<2)await new Promise(r=>setTimeout(r,10));await p.waitForTimeout(100);await p.clock.fastForward(11000);await p.waitForTimeout(200);
 const state=await p.evaluate(()=>({readOnly:window.hosshiiReadOnly,reason:window.hosshiiStatusReason}));assert.equal(state.readOnly,true);
 if(process.argv.includes('--expect-stuck')){assert.equal(state.reason,'checking');console.log('BEFORE: partial HTTP body bypasses the 10s timeout; checking remains stuck. Reproduced.');}
 else{assert.equal(state.reason,'unavailable');mode='complete';await p.evaluate(()=>window.hosshiiRefreshEntitlement());assert.equal(await p.evaluate(()=>window.hosshiiReadOnly),false);console.log('AFTER: partial HTTP body times out; readonly error and retry recover. Passed.');}
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1});
