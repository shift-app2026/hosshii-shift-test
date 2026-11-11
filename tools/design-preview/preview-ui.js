/* Preview-only I/O overrides; the source application is not modified. */
'use strict';
window.exportAppData=window.importAppData=window.processBackupText=window.previewDisabled;
window.checkBackupReminder=function(){};
document.addEventListener('submit',e=>e.preventDefault(),true);
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href]');if(!a)return;
  const u=new URL(a.href,location.href);
  if(u.origin!==location.origin||!['http:','https:'].includes(u.protocol)){e.preventDefault();previewDisabled();}
},true);
document.addEventListener('DOMContentLoaded',()=>{
  const gate=document.getElementById('lineAuthGate');if(gate)gate.hidden=true;
  const file=document.getElementById('importFileInput');if(file)file.disabled=true;
  const notice=document.createElement('aside');notice.id='previewNotice';notice.setAttribute('aria-label','デザイン確認専用');
  notice.style.cssText="flex:none;display:flex;justify-content:space-between;align-items:center;gap:4px;padding:4px 10px;background:#fff0f4;color:#302027;font:500 11px/1.5 'Noto Sans JP',sans-serif;border-bottom:1px solid #eedde1;";
  const text=document.createElement('span');text.textContent='デザイン確認専用・架空データ';
  const reset=document.createElement('button');reset.id='previewReset';reset.type='button';reset.textContent='リセット';reset.style.cssText='padding:3px 7px;border:1px solid #d8b5bf;border-radius:6px;background:#fff;color:#302027;font:inherit;white-space:nowrap;';reset.addEventListener('click',()=>location.reload());
  notice.append(text,reset);document.getElementById('appCard').prepend(notice);
  const banner=document.createElement('div');banner.id='hosshiiTrialBanner';
  const first=document.createElement('div');first.className='hosshii-trial-status-line';first.textContent='無料お試し終了日 ♡ サンプル';
  const second=document.createElement('span');second.className='hosshii-payment-preparing';second.textContent='※デザイン見本・認証や課金は行いません';
  banner.append(first,second);document.getElementById('tab-clock').prepend(banner);
  if(typeof window.updateItoStickyHeader==='function')window.updateItoStickyHeader('clock');
  window.previewReady=true;
});
// The production auth-success hook normally starts this purely visual replay.
// Start it after local fixture initialization, without executing auth/trial code.
window.addEventListener('load',()=>{
  if(typeof requestSalaryMarbleReplay==='function')requestSalaryMarbleReplay();
});
