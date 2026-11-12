/* Effective-date confirmation is the only new settings UI; existing screens are unchanged. */
let pendingPayConfirmation=null;
function ensurePayHistoryDialog(){
 if(document.getElementById('payHistoryDialog'))return;
 const overlay=document.createElement('div');overlay.id='payHistoryDialog';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','payHistoryTitle');
 overlay.innerHTML=`<form id="payHistoryForm"><header><h3 id="payHistoryTitle">設定の適用開始日</h3><button type="button" id="payHistoryClose" aria-label="適用日の確認を閉じる">×</button></header><div class="history-body"><p id="payHistoryJob"></p><p>時給・有給単価・交通費・その他の手当を、この日から適用します。入力途中の設定は下書きとして保存され、まだお給料には反映されません。</p><label for="payEffectiveFrom">適用開始日（必須）</label><input type="date" id="payEffectiveFrom" required><p id="payHistoryRange"></p><label id="payHistoryPastLabel" hidden><input type="checkbox" id="payHistoryPastConsent">対象となる登録済みのお給料が再計算されることを確認しました。</label><p id="payHistoryError" role="alert"></p></div><footer><button type="button" id="payHistoryLater">下書きのまま</button><button type="submit" id="payHistoryApply">適用する</button></footer></form>`;
 document.body.append(overlay);
 document.getElementById('payHistoryForm').addEventListener('submit',commitPayHistory);
 document.getElementById('payHistoryClose').addEventListener('click',closePayHistoryDialog);
 document.getElementById('payHistoryLater').addEventListener('click',closePayHistoryDialog);
 document.getElementById('payEffectiveFrom').addEventListener('input',()=>{document.getElementById('payHistoryPastConsent').checked=false;updatePayDatePreview();});
 document.getElementById('payHistoryPastConsent').addEventListener('change',updatePayDatePreview);
 overlay.addEventListener('click',e=>{if(e.target===overlay)closePayHistoryDialog()});
 document.addEventListener('keydown',e=>{if(overlay.hidden)return;if(e.key==='Escape'){e.preventDefault();closePayHistoryDialog()}if(e.key==='Tab'){const controls=[...overlay.querySelectorAll('button,input')].filter(e=>!e.disabled&&e.getClientRects().length),first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
}
function historyDateIsRetroactive(jk,date){
 const today=HosshiiPayModel.isoDate(formatDateKey(new Date()));if(date>today)return false;
 const job=configData[jk],next=(job.payHistory||[]).map(h=>h.effectiveFrom).filter(d=>d>date).sort()[0];
 const old=HosshiiPayModel.ratesFor(job,date),candidate=pendingPayConfirmation?.rates;
 const monthlyChanged=candidate&&(candidate.transMonth!==old.transMonth||candidate.allowanceMonth!==old.allowanceMonth);
 return Object.entries(shiftsData).some(([key,day])=>{
  const d=HosshiiPayModel.isoDate(key),entries=day[jk]||[];if(d>today||!entries.length)return false;
  const crosses=entries.some(sh=>sh.start&&sh.end&&HosshiiPayModel.clock(sh.end)<HosshiiPayModel.clock(sh.start));
  const last=crosses?HosshiiPayModel.dateAt(HosshiiPayModel.dayNumber(d)+1):d;
  if(last>=date&&(!next||d<next))return true;
  if(!monthlyChanged)return false;
  const work=HosshiiPayModel.dayNumber(d),now=new Date(),parts=d.split('-').map(Number),diff=(parts[0]-now.getFullYear())*12+parts[1]-1-now.getMonth();
  for(const offset of [diff-1,diff,diff+1,diff+2]){const period=getJobPayPeriodRangeForReceiveMonth(job,offset),start=HosshiiPayModel.isoDate(formatDateKey(period.start)),end=HosshiiPayModel.isoDate(formatDateKey(period.end));if(HosshiiPayModel.dayNumber(start)<=work&&work<=HosshiiPayModel.dayNumber(end)&&end>=date&&(!next||start<next))return true;}
  return false;
 });
}
function updatePayDatePreview(){
 const form=pendingPayConfirmation;if(!form)return;
 const apply=document.getElementById('payHistoryApply'),past=document.getElementById('payHistoryPastLabel'),error=document.getElementById('payHistoryError');
 try{
  if(form.invalid)throw Error(form.invalid);
  const date=HosshiiPayModel.isoDate(document.getElementById('payEffectiveFrom').value);
  const next=(configData[form.jk].payHistory||[]).map(h=>h.effectiveFrom).filter(d=>d>date).sort()[0];
  document.getElementById('payHistoryRange').textContent=next?`${date} から ${HosshiiPayModel.dateAt(HosshiiPayModel.dayNumber(next)-1)} まで適用します。`:`${date} 以降に適用します。`;
  const retro=historyDateIsRetroactive(form.jk,date);past.hidden=!retro;apply.disabled=retro&&!document.getElementById('payHistoryPastConsent').checked;error.textContent='';
 }catch(e){apply.disabled=true;past.hidden=true;error.textContent=document.getElementById('payEffectiveFrom').value||form.invalid?e.message:'';}
}
function openPayHistoryDialog(jk,after){
 if(hosshiiBlockEdit()||!configData[jk]?.name)return false;
 if(jk===currentSettingsJobKey)syncSettingsFormToConfig(jk);
 const job=configData[jk],raw=HosshiiPayModel.snapshot(job.payDraft?.rates||job);let rates,invalid='';
 try{rates=HosshiiPayModel.validateRates(raw)}catch(error){invalid=error.message;}
 ensurePayHistoryDialog();pendingPayConfirmation={jk,raw:JSON.stringify(raw),rates,invalid,after};
 document.getElementById('payHistoryJob').textContent=job.name;
 document.getElementById('payEffectiveFrom').value='';document.getElementById('payHistoryPastConsent').checked=false;
 document.getElementById('payHistoryRange').textContent='';document.getElementById('payHistoryError').textContent=invalid;
 document.getElementById('payHistoryDialog').hidden=false;updatePayDatePreview();
 return true;
}
function closePayHistoryDialog(){const next=pendingPayConfirmation?.after;pendingPayConfirmation=null;document.getElementById('payHistoryDialog').hidden=true;if(next)next();}
function commitPayHistory(event){
 event?.preventDefault();const pending=pendingPayConfirmation;if(!pending)return false;if(hosshiiBlockEdit()){document.getElementById('payHistoryError').textContent='利用状況を確認できるまで適用できません。通信を確認し、もう一度お試しください。';return false;}
 const error=document.getElementById('payHistoryError');
 try{
  const date=HosshiiPayModel.isoDate(document.getElementById('payEffectiveFrom').value),job=configData[pending.jk];
  if(pending.invalid)throw Error(pending.invalid);
  if(JSON.stringify(HosshiiPayModel.snapshot(job.payDraft?.rates||job))!==pending.raw)throw Error('設定内容が変わりました。確認画面を開き直してください。');
  if(historyDateIsRetroactive(pending.jk,date)&&!document.getElementById('payHistoryPastConsent').checked)throw Error('再計算の対象を確認してください。');
  const rates=HosshiiPayModel.validateRates(pending.rates),before=HosshiiPayModel.clone(job);
  const updated=HosshiiPayModel.clone(job);Object.assign(updated,rates);delete updated.payDraft;
  updated.payHistory.push({id:globalThis.crypto?.randomUUID?.()||`rate-${Date.now()}-${updated.payHistory.length}`,effectiveFrom:date,rates:HosshiiPayModel.clone(rates)});
  configData[pending.jk]=updated;
  if(!saveAllDataStorage()){configData[pending.jk]=before;closeAlertModal();throw Error('保存できませんでした。適用は完了していません。もう一度お試しください。');}
  window.hosshiiResetWageUi?.(pending.jk,true);updateSettingsSaveStatus(true);
  if(currentSettingsJobKey===pending.jk)renderSettingsJobContent(pending.jk);
  refreshAll();showToast('適用開始日付きで設定を登録しました');closePayHistoryDialog();return true;
 }catch(e){error.textContent=e.message;return false;}
}
