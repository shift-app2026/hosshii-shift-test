/* Pure business rules. No DOM, storage, identity or network access. */
(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const PAY_FIELDS=['wageSlots','paid','transMonth','transDay','allowanceMonth','allowanceDay','allowanceMemo'];
function isoDate(value){
 const m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(value||''));
 if(!m)throw Error('日付を選択してください。');
 const [y,n,d]=m.slice(1).map(Number),v=new Date(Date.UTC(y,n-1,d));
 if(y<1900||y>9999||v.getUTCFullYear()!==y||v.getUTCMonth()!==n-1||v.getUTCDate()!==d)throw Error('正しい日付を選択してください。');
 return `${y}-${String(n).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function dayNumber(value){return Date.parse(isoDate(value)+'T00:00:00Z')/86400000;}
function dayKey(value){const [y,m,d]=isoDate(value).split('-').map(Number);return `${y}-${m}-${d}`;}
function dateAt(number){return new Date(number*86400000).toISOString().slice(0,10);}
function clock(value){const m=/^(\d{1,2}):(\d{2})$/.exec(String(value||''));if(!m||+m[1]>23||+m[2]>59)throw Error('時刻を確認してください。');return +m[1]*60 + +m[2];}
function duration(start,end){const a=clock(start),b=clock(end);if(a===b)throw Error('開始と終了を同じ時刻にはできません。');return (b-a+1440)%1440;}
function validateShift(s){
 if(!s||typeof s!=='object'||Array.isArray(s))throw Error('シフトの形式を確認してください。');
 if(s.isPaidLeave&&!s.start&&!s.end){if(!Number.isFinite(Number(s.hours))||+s.hours<=0||+s.hours>24)throw Error('有給時間は0より大きく24以下で入力してください。');return true;}
 const mins=duration(s.start,s.end),rest=Number(s.breakMins||0);
 if(!Number.isInteger(rest)||rest<0||rest>=mins)throw Error('休憩時間は勤務時間より短くしてください。');
 return true;
}
function snapshot(job){const out={};for(const k of PAY_FIELDS)out[k]=clone(job[k]??(k==='wageSlots'?[]:k==='allowanceMemo'?'':0));return out;}
function ratesEqual(a,b){return JSON.stringify(snapshot(a))===JSON.stringify(snapshot(b));}
function validateRates(input){
 for(const key of ['paid','transMonth','transDay','allowanceMonth','allowanceDay']){const v=input[key];if(v===null||typeof v==='boolean'||v!==undefined&&(!Number.isSafeInteger(Number(v))||Number(v)<0))throw Error('単価・交通費・手当は0以上の整数で入力してください。');}
 if(Array.isArray(input.wageSlots))for(const s of input.wageSlots){if(s?.bVal===null||!Number.isFinite(Number(s?.bVal||0))||!Number.isFinite(Number(s?.wage||0)))throw Error('時給・加算額を確認してください。');}
 const r=snapshot(input);
 for(const k of ['paid','transMonth','transDay','allowanceMonth','allowanceDay'])if(!Number.isSafeInteger(Number(r[k]))||+r[k]<0)throw Error('単価・交通費・手当は0以上の整数で入力してください。');else r[k]=Number(r[k]);
 if(typeof r.allowanceMemo!=='string'||r.allowanceMemo.length>7)throw Error('手当の名称は7文字以内にしてください。');
 if(!Array.isArray(r.wageSlots))throw Error('時給の形式を確認してください。');
 r.wageSlots=r.wageSlots.filter(s=>s&&(s.start||s.end||Number(s.wage)||Number(s.bVal)));
 const intervals=[];
 for(const s of r.wageSlots){
  const a=clock(s.start),b=clock(s.end);
  if(!Number.isSafeInteger(Number(s.wage))||+s.wage<=0||!Number.isSafeInteger(Number(s.bVal||0))||+s.bVal<0||!['weekday','saturday','weekend','holiday'].includes(s.bType))throw Error('開始・終了時間と時給・加算額を確認してください。');
  const spans=a===b?[[0,1440]]:a<b?[[a,b]]:[[a,1440],[0,b]];
  if(intervals.some(v=>spans.some(w=>Math.max(v[0],w[0])<Math.min(v[1],w[1]))))throw Error('時間帯が重なっています。重ならないように入力してください。');
  intervals.push(...spans);s.wage=Number(s.wage);s.bVal=Number(s.bVal||0);
 }
 return r;
}
function normalizeJobHistory(job,saved){
 const explicit=saved&&Object.prototype.hasOwnProperty.call(saved,'payHistory');
 job.payBaseline=explicit?clone(saved.payBaseline??null):(saved&&job.name?snapshot(job):null);
 job.payHistory=explicit?clone(saved.payHistory):[];
 if(!Array.isArray(job.payHistory))throw Error('時給履歴の形式を確認してください。');
 const ids=new Set();
 for(const h of job.payHistory){if(ids.has(h.id))throw Error('履歴IDが重複しています。');ids.add(h.id);h.effectiveFrom=isoDate(h.effectiveFrom);h.rates=validateRates(h.rates);if(typeof h.id!=='string'||!h.id)throw Error('履歴IDがありません。');}
 if(job.payBaseline!==null&&(!job.payBaseline||!Array.isArray(job.payBaseline.wageSlots)))throw Error('移行前の設定を確認してください。');
 if(saved?.payDraft){
  const draft=saved.payDraft.rates;if(!draft||typeof draft!=='object'||!Array.isArray(draft.wageSlots))throw Error('下書きの形式を確認してください。');
  for(const key of ['paid','transMonth','transDay','allowanceMonth','allowanceDay'])if(!Number.isSafeInteger(Number(draft[key]))||Number(draft[key])<0)throw Error('下書きの金額を確認してください。');
  if(typeof draft.allowanceMemo!=='string'||draft.allowanceMemo.length>7)throw Error('手当の名称を確認してください。');
  for(const row of draft.wageSlots){if(!row||typeof row!=='object')throw Error('時給下書きの形式を確認してください。');for(const t of [row.start,row.end])if(t!==''&&typeof t!=='undefined')clock(t);if(!Number.isSafeInteger(Number(row.wage||0))||Number(row.wage)<0||!Number.isSafeInteger(Number(row.bVal||0))||Number(row.bVal)<0)throw Error('時給下書きの金額を確認してください。');}
  job.payDraft=clone(saved.payDraft);
 }
 return job;
}
function ratesFor(job,date){
 const day=isoDate(date);let chosen=null;
 for(const h of job.payHistory||[])if(h.effectiveFrom<=day&&(!chosen||h.effectiveFrom>=chosen.effectiveFrom))chosen=h;
 return chosen?clone(chosen.rates):job.payBaseline?clone(job.payBaseline):!Object.prototype.hasOwnProperty.call(job,'payHistory')?snapshot(job):{wageSlots:[],paid:0,transMonth:0,transDay:0,allowanceMonth:0,allowanceDay:0,allowanceMemo:''};
}
function normalizeShifts(data,config={}){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('シフトの形式を確認してください。');
 const out={};
 for(const [date,day]of Object.entries(data)){
  const key=dayKey(date);
  if(!day||typeof day!=='object'||Array.isArray(day))throw Error('日別シフトの形式を確認してください。');
  const next={};
  for(const jk of ['job1','job2','job3'])if(day[jk]){const entries=Array.isArray(day[jk])?day[jk]:[day[jk]];next[jk]=entries.map(s=>{const copy=clone(s);if(copy.isPaidLeave&&!copy.start&&!copy.end&&!(Number(copy.hours)>0)&&Number(config[jk]?.paidHours)>0)copy.hours=Number(config[jk].paidHours);validateShift(copy);return copy});}
  if(out[key]&&JSON.stringify(out[key])!==JSON.stringify(next))throw Error(`${date} の日付が重複しています。内容を確認してください。`);
  out[key]=next;
 }
 return out;
}
function monthlyBenefits(job,start,end,hasWork){
 if(!hasWork)return {trans:0,allow:0};
 const first=dayNumber(start),last=dayNumber(end),n=last-first+1;if(n<1||n>62)throw Error('給与期間を確認してください。');
 let trans=0,allow=0;for(let d=first;d<=last;d++){const r=ratesFor(job,dateAt(d));trans+=Number(r.transMonth)||0;allow+=Number(r.allowanceMonth)||0;}
 return {trans:trans/n,allow:allow/n};
}
const api={clone,PAY_FIELDS,isoDate,dayNumber,dayKey,dateAt,clock,duration,validateShift,snapshot,ratesEqual,validateRates,normalizeJobHistory,ratesFor,normalizeShifts,monthlyBenefits};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HosshiiPayModel=Object.freeze(api);
})(typeof globalThis==='undefined'?this:globalThis);
