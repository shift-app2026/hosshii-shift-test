"""Build an owner-only, synthetic preview from this exact functional checkout.
No LINE SDK/status code, production endpoints or cloud/file restore is enabled.
Usage: python tools/build-design-preview.py OUTPUT --font-assets OLD_PREVIEW/dist
"""
from pathlib import Path
import argparse,base64,hashlib,json,re,shutil,subprocess
args=argparse.ArgumentParser();args.add_argument('output');args.add_argument('--font-assets',required=True);opt=args.parse_args()
root=Path(__file__).resolve().parents[1];out=Path(opt.output).resolve();assets=Path(opt.font_assets).resolve();out.mkdir(parents=True,exist_ok=True)
# Caller commits before publication; content hashes also identify every copied source file.
sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
s=(root/'index.html').read_text()
s,n=re.subn(r'<script id="line-auth-supabase-test-20261028">[\s\S]*?</script>','<!-- Preview only: real authentication and trial API excluded. -->',s);assert n==1
s,n=re.subn(r'<script src="https://static.line-scdn.net/[^>]+></script>','',s);assert n==1
s,n=re.subn(r'<script src="\./isolated-config.js"></script>','',s);assert n==1
s=re.sub(r'<meta[^>]+http-equiv="Content-Security-Policy"[^>]*>','',s)
s=re.sub(r'<link[^>]+(?:fonts\.googleapis\.com|fonts\.gstatic\.com|manifest\.webmanifest)[^>]*>','',s)
s=re.sub(r'<meta[^>]+property="og:(?:url|image)"[^>]*>','',s)
csp="default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'none'"
s=s.replace('<head>','<head>\n<meta http-equiv="Content-Security-Policy" content="'+csp+'">\n<meta name="robots" content="noindex,nofollow,noarchive">\n<link rel="stylesheet" href="./fonts/fonts.css">\n<script src="./preview-bootstrap.js"></script>',1)
s=s.replace('<title>ほっしーシフト</title>','<title>ほっしーシフト｜公開前修正の確認版（架空データ）</title>')
s=s.replace('</body>','<script src="./preview-ui.js"></script>\n</body>')
assert 'supabase.co' not in s and 'static.line-scdn.net' not in s
(out/'index.html').write_text(s)
copy=['bordeaux-rose.css','zen-maru.css','android-readability.css','prelaunch.css','prelaunch-model.js','prelaunch-core.js','prelaunch-ui.js','prelaunch-storage.js','icon-192.png','icon-512.png','apple-touch-icon.png','terms.html','privacy.html','paid-terms.html']
for name in copy:shutil.copy2(root/name,out/name)
shutil.copytree(assets/'fonts',out/'fonts',dirs_exist_ok=True)
sub='hosshii-synthetic-preview-only';ns='design-preview-r5';subject_hash=hashlib.sha256(sub.encode()).hexdigest()
def b64(x):return base64.urlsafe_b64encode(json.dumps(x,separators=(',',':')).encode()).decode().rstrip('=')
token=b64({'alg':'none','typ':'JWT'})+'.'+b64({'iss':'https://access.line.me','sub':sub})+'.synthetic-preview-not-a-line-token'
key='hosshii_prelaunch_state_v2:'+ns+':line:'+subject_hash
bootstrap=r'''/* Synthetic preview only. This token is NOT a signed LINE token. */
window.HOSSHII_DESIGN_PREVIEW=true;
window.HOSSHII_ISOLATED_CONFIG=Object.freeze({enabled:false,storageNamespace:__NS__,backupEndpoint:'',statusEndpoint:''});
window.hosshiiIsolatedReady=()=>false;window.hosshiiReadOnly=true;
window.HOSSHII_PREVIEW_TOKEN=__TOKEN__;
window.liff={getIDToken:()=>window.HOSSHII_PREVIEW_TOKEN};
window.HOSSHII_PREVIEW_KEY=__KEY__;
window.fetch=()=>Promise.reject(Error('確認版では外部通信を行いません。'));
for(const name of ['XMLHttpRequest','WebSocket','EventSource','WebTransport'])Object.defineProperty(window,name,{value:function(){throw Error('確認版では外部通信を行いません。')}});
Object.defineProperty(navigator,'sendBeacon',{value:()=>false});window.open=()=>null;
window.previewDisabled=function(){showAlertModal('架空データ専用の確認版です。LINE認証・無料体験の開始・クラウド保存や復元・ファイル読み込みは実行しません。変更はこのURL専用の端末内に保存します。');};
try{
 if(localStorage.getItem(window.HOSSHII_PREVIEW_KEY)===null){
  const now=new Date(),config={jobCount:3},shifts={};
  ['ローズカフェ','月色ショップ','星空キッチン'].forEach((name,i)=>{
   const rates={wageSlots:[{start:'00:00',end:'00:00',wage:1200+i*100,bType:'weekend',bVal:100}],paid:1200+i*100,transMonth:0,transDay:0,allowanceMonth:0,allowanceDay:0,allowanceMemo:''};
   config['job'+(i+1)]={name,closeDay:'月末',payDay:'10',paidHours:8,...rates,payBaseline:JSON.parse(JSON.stringify(rates)),payHistory:[],presets:[{start:'09:00',end:'17:00',breakMins:60},{start:'18:00',end:'22:00',breakMins:0}]};
  });
  const key=d=>`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  for(let back=0;back<=3;back++)for(const day of [4,6,9,11,14,18,22]){
   const d=new Date(now.getFullYear(),now.getMonth()-back,day);shifts[key(d)]={job1:[{start:'09:00',end:'17:00',breakMins:60,isPaidLeave:false}]};
   if(day%2===0)shifts[key(d)].job2=[{start:'18:00',end:'22:00',breakMins:0,isPaidLeave:false}];
   if(day===14)shifts[key(d)].job3=[{start:'',end:'',hours:8,breakMins:0,isPaidLeave:true}];
  }
  shifts[key(now)]={job1:[{start:'09:00',end:'17:00',breakMins:60,isPaidLeave:false}],job2:[{start:'18:00',end:'20:00',breakMins:0,isPaidLeave:false}]};
  localStorage.setItem(window.HOSSHII_PREVIEW_KEY,JSON.stringify({schemaVersion:2,config,shifts,monthlyGoal:100000,storageRevision:0}));
  localStorage.setItem(window.HOSSHII_PREVIEW_KEY+':meta:mybasket_last_backup',String(Date.now()));
 }
}catch(_){window.HOSSHII_PREVIEW_STORAGE_ERROR=true;}
'''.replace('__TOKEN__',json.dumps(token)).replace('__NS__',json.dumps(ns)).replace('__KEY__',json.dumps(key))
(out/'preview-bootstrap.js').write_text(bootstrap)
# Reuse the actual read-only UI function, including conflict/retry behaviour.
original=(root/'index.html').read_text();a=original.index('  function hosshiiSyncExpiredUI(){');b=original.index('\n  }',a)+4;sync=original[a:b]
driver='''/* Local synthetic fixture. No actual LINE/status/backup calls are executed. */
(function(){
 const inactiveMessage=()=>window.hosshiiStorageMessage();const hosshiiExpiredMessage=inactiveMessage;
 async function check(){await window.hosshiiResolveStorageConflict();}
'''+sync+'''
 window.hosshiiSyncExpiredUI=hosshiiSyncExpiredUI;
 window.hosshiiCheckEntitlementClock=()=>!window.hosshiiReadOnly;
 window.hosshiiRefreshEntitlement=()=>check();
 window.exportAppData=window.importAppData=window.processBackupText=window.hosshiiBackupExport=window.hosshiiCloudBackupSave=window.hosshiiCloudBackupLoad=window.previewDisabled;
 window.checkBackupReminder=function(){};
 document.addEventListener('submit',event=>{if(event.target.id!=='payHistoryForm')event.preventDefault()},true);
 document.addEventListener('click',event=>{const a=event.target.closest('a[href]');if(a){const u=new URL(a.href,location.href);if(u.origin!==location.origin||!['http:','https:'].includes(u.protocol)){event.preventDefault();previewDisabled()}}},true);
 const start=async()=>{
  const consent=document.getElementById('lineAuthConsent');if(consent)consent.hidden=true;
  const file=document.getElementById('importFileInput');if(file)file.disabled=true;
  const notice=document.createElement('aside');notice.id='previewNotice';notice.setAttribute('aria-label','架空データの確認版');
  notice.style.cssText="flex:none;display:flex;justify-content:space-between;align-items:center;gap:4px;padding:4px 10px;background:#fff0f4;color:#302027;font:500 11px/1.5 'Noto Sans JP',sans-serif;border-bottom:1px solid #eedde1;";
  const text=document.createElement('span');text.textContent='11/16 公開前修正の確認版・架空データ（端末内保存）';
  const reset=document.createElement('button');reset.type='button';reset.id='previewReset';reset.textContent='リセット';reset.style.cssText='padding:3px 7px;border:1px solid #d8b5bf;border-radius:6px;background:#fff;color:#302027;font:inherit;white-space:nowrap;';
  reset.onclick=()=>{if(!window.hosshiiStorageCanEdit())return;for(const key of Object.keys(localStorage))if(key.startsWith('hosshii_prelaunch_state_v2:design-preview-r5:'))localStorage.removeItem(key);location.reload();};
  notice.append(text,reset);document.getElementById('appCard').prepend(notice);
  const banner=document.createElement('div');banner.id='hosshiiTrialBanner';
  const first=document.createElement('div');first.className='hosshii-trial-status-line';first.textContent='無料お試し終了日 ♡ サンプル';
  const second=document.createElement('span');second.className='hosshii-payment-preparing';second.textContent='※架空データ・LINEやクラウドへ接続しません';banner.append(first,second);document.getElementById('tab-clock').prepend(banner);
  try{
   if(window.HOSSHII_PREVIEW_STORAGE_ERROR)throw Error('プレビュー専用データを端末に保存できません。Chromeの保存設定を確認してください。');
   await window.hosshiiActivateVerifiedStorage(window.HOSSHII_PREVIEW_TOKEN);
   window.hosshiiSetEntitlement(false,'active');document.getElementById('lineAuthGate').hidden=true;
   if(typeof window.updateItoStickyHeader==='function')window.updateItoStickyHeader('clock');
   requestSalaryMarbleReplay();window.previewReady=true;
   reset.disabled=!window.hosshiiStorageCanEdit();
  }catch(error){document.getElementById('lineAuthMessage').textContent=error.message;}
 };
 window.addEventListener('load',start,{once:true});
})();
'''
(out/'preview-ui.js').write_text(driver)
(out/'_headers').write_text('/*\n  Content-Security-Policy: '+csp+"; frame-ancestors 'none'\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n  Cache-Control: no-store\n")
(out/'robots.txt').write_text('User-agent: *\nDisallow: /\n')
meta={'sourceRepository':'shift-app2026/hosshii-shift-test','sourceBranch':'fix/trial-prelaunch-20261116','sourceCommit':sha,'sourceHashes':{n:hashlib.sha256((root/n).read_bytes()).hexdigest() for n in ['index.html',*copy] if (root/n).is_file()},'previewOnly':True,'identity':'synthetic unsigned JWT fixture; actual auth script and LINE SDK excluded','storage':'synthetic preview namespace on this origin only; original app storage keys not used','externalServices':'CSP connect-src none, network API blocked, backup/import disabled','notVerifiedHere':['real LINE','Supabase','21-day server lifecycle','Android hardware']}
(out/'preview-source.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
(out/'UPLOAD-README.txt').write_text('架空データ専用の確認版です。本番/LINE用にアップロードしないでください。ソースと試験範囲はpreview-source.json。\n')
(out/'file-integrity.json').write_text(json.dumps({str(p.relative_to(out)):hashlib.sha256(p.read_bytes()).hexdigest() for p in out.rglob('*') if p.is_file() and p.name!='file-integrity.json'},indent=2))
print(json.dumps({'sourceCommit':sha,'sourceBranch':meta['sourceBranch'],'files':len(list(out.rglob('*'))),'previewOnly':True}))
