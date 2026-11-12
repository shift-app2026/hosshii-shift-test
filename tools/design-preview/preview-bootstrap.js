/* PREVIEW ONLY. No persistent storage, real identity, trial or payment state. */
'use strict';
window.HOSSHII_DESIGN_PREVIEW = true;
window.hosshiiReadOnly = false;
window.previewBlockedCalls = [];
const previewValues = new Map();
const previewStoragePrefix = 'hosshii_pr8_synthetic_v4:';
let previewDeviceStorage = new URLSearchParams(location.search).get('device_test') === '1';
window.HOSSHII_PREVIEW_STORAGE_UNAVAILABLE = false;
if (previewDeviceStorage) {
  try {
    localStorage.setItem(previewStoragePrefix + '__probe__', '1');
    localStorage.removeItem(previewStoragePrefix + '__probe__');
  } catch (_) {
    previewDeviceStorage = false;
    window.HOSSHII_PREVIEW_STORAGE_UNAVAILABLE = true;
  }
}
window.HOSSHII_PREVIEW_DEVICE_STORAGE = previewDeviceStorage;
const previewDeviceKeys = () => Object.keys(localStorage).filter(k => k.startsWith(previewStoragePrefix));
window.previewStorage = Object.freeze({
  getItem: key => previewDeviceStorage ? localStorage.getItem(previewStoragePrefix + String(key)) : (previewValues.has(String(key)) ? previewValues.get(String(key)) : null),
  setItem: (key, value) => previewDeviceStorage ? localStorage.setItem(previewStoragePrefix + String(key), String(value)) : previewValues.set(String(key), String(value)),
  removeItem: key => previewDeviceStorage ? localStorage.removeItem(previewStoragePrefix + String(key)) : previewValues.delete(String(key)),
  clear: () => { if (previewDeviceStorage) previewDeviceKeys().forEach(k => localStorage.removeItem(k)); else previewValues.clear(); },
  key: i => previewDeviceStorage ? (previewDeviceKeys()[i]?.slice(previewStoragePrefix.length) ?? null) : ([...previewValues.keys()][i] ?? null),
  get length() { return previewDeviceStorage ? previewDeviceKeys().length : previewValues.size; }
});
(function seedFictionalData() {
  if (previewDeviceStorage && previewStorage.getItem('mybasket_wages_v77') !== null) return;
  const now = new Date(), wages = {jobCount:3, monthlyGoal:100000}, shifts = {};
  ['ローズカフェ','月色ショップ','星空キッチン'].forEach((name, i) => {
    wages['job'+(i+1)] = {name, closeDay:'月末', payDay:'10', paid:1200+i*100, paidHours:8,
      wageSlots:[{start:'00:00',end:'00:00',wage:1200+i*100,bType:'weekend',bVal:100}],
      presets:[{start:'09:00',end:'17:00',breakMins:60},{start:'18:00',end:'22:00',breakMins:0}]};
  });
  const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  for(let back=0; back<=3; back++) for(const day of [4,6,9,11,14,18,22]) {
    const d=new Date(now.getFullYear(),now.getMonth()-back,day);
    shifts[key(d)]={job1:[{start:'09:00',end:'17:00',breakMins:60,isPaidLeave:false}]};
    if(day%2===0)shifts[key(d)].job2=[{start:'18:00',end:'22:00',breakMins:0,isPaidLeave:false}];
    if(day===14)shifts[key(d)].job3=[{start:'',end:'',hours:8,breakMins:0,isPaidLeave:true}];
  }
  shifts[key(now)]={job1:[{start:'09:00',end:'17:00',breakMins:60,isPaidLeave:false}],job2:[{start:'18:00',end:'20:00',breakMins:0,isPaidLeave:false}]};
  // Preview-only empty fixture: no persistent state and no source-app flag.
  if (new URLSearchParams(location.search).get('data') === 'empty') {
    for (const key of ['job1','job2','job3']) delete wages[key];
    wages.jobCount = 0; wages.monthlyGoal = 0;
    for (const key of Object.keys(shifts)) delete shifts[key];
  }
  previewStorage.setItem('mybasket_wages_v77',JSON.stringify(wages));
  previewStorage.setItem('mybasket_shifts_v23',JSON.stringify(shifts));
  previewStorage.setItem('mybasket_last_backup',String(Date.now()));
})();
function previewDenied(api) {
  window.previewBlockedCalls.push(api);
  throw new Error('プレビューでは外部通信を禁止しています: '+api);
}
window.fetch = () => Promise.reject(new Error('プレビューではfetchを使用しません'));
for(const api of ['XMLHttpRequest','WebSocket','EventSource','RTCPeerConnection','WebTransport']) {
  Object.defineProperty(window,api,{value:function(){previewDenied(api)},writable:false,configurable:false});
}
Object.defineProperty(navigator,'sendBeacon',{value:()=>{previewBlockedCalls.push('sendBeacon');return false;}});
window.open = () => { previewBlockedCalls.push('window.open'); return null; };
window.previewDisabled = function() {
  const msg='デザイン確認専用のため、バックアップ・ファイルの読み込み・外部連携は実行しません。\n'+(previewDeviceStorage ? '架空データの変更は、このテスト専用URLの端末内だけに保存されます。' : '変更内容はこの画面内だけに反映され、再読み込みで架空データに戻ります。');
  if(typeof showAlertModal==='function')showAlertModal(msg);else alert(msg);
};
