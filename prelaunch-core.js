/* New versioned storage; legacy keys are read-only migration sources. */
const PRELAUNCH_STATE_KEY='hosshii_prelaunch_state_v2';
function validatePrelaunchEnvelope(state){
 if(state?.schemaVersion!==2||!state.config||typeof state.config!=='object'||Array.isArray(state.config)||!state.shifts||typeof state.shifts!=='object'||Array.isArray(state.shifts))throw Error('対応していない保存形式です。');
 if(!Number.isSafeInteger(state.monthlyGoal)||state.monthlyGoal<0)throw Error('目標金額を確認してください。');
 for(const jk of ['job1','job2','job3']){const j=state.config[jk];if(!j||!Object.prototype.hasOwnProperty.call(j,'payHistory')||!Object.prototype.hasOwnProperty.call(j,'payBaseline'))throw Error('設定履歴が不足しています。読み込みを中止しました。');}
 return true;
}
function prelaunchReadStored(){
 try {const raw=localStorage.getItem(PRELAUNCH_STATE_KEY);if(raw===null)return null;
  const state=JSON.parse(raw);validatePrelaunchEnvelope(state);
  state.shifts=HosshiiPayModel.normalizeShifts(state.shifts,state.config);buildConfigData(state.config);return state;
 } catch(error){storageWriteBlocked=true;storageProblems.push(PRELAUNCH_STATE_KEY);return {schemaVersion:2,config:{jobCount:0},shifts:{},monthlyGoal:0};}
}
function prelaunchState(config=configData,shifts=shiftsData,goal=monthlyGoal){return {schemaVersion:2,config:JSON.parse(JSON.stringify(config)),shifts:JSON.parse(JSON.stringify(shifts)),monthlyGoal:goal};}
function prelaunchWrite(state){
 if(hosshiiBlockEdit()||storageWriteBlocked){if(storageWriteBlocked)showStorageSafetyWarning();return false;}
 try {
  validatePrelaunchEnvelope(state);
  HosshiiPayModel.normalizeShifts(state.shifts,state.config);
  for(const jk of ['job1','job2','job3'])if(state.config[jk])HosshiiPayModel.normalizeJobHistory({...state.config[jk]},state.config[jk]);
  const raw=JSON.stringify(state);localStorage.setItem(PRELAUNCH_STATE_KEY,raw);
  if(localStorage.getItem(PRELAUNCH_STATE_KEY)!==raw){storageWriteBlocked=true;throw Error('保存内容の確認に失敗しました。');}
  return true;
 }catch(error){console.error('設定・シフトの保存に失敗しました',error);showStorageSafetyWarning();return false;}
}
function prelaunchBackup(){return {format:'hosshii-shift',schemaVersion:2,exportedAt:new Date().toISOString(),state:prelaunchState()};}
function prelaunchParseBackup(data){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('バックアップの形式を確認してください。');
 if(Object.prototype.hasOwnProperty.call(data,'schemaVersion')){
  if(data.schemaVersion!==2||data.state?.schemaVersion!==2||data.format!=='hosshii-shift'||!data.state?.config||!data.state.shifts)throw Error('このバックアップ形式には対応していません。');
  validatePrelaunchEnvelope(data.state);
  return {shifts:HosshiiPayModel.normalizeShifts(data.state.shifts,data.state.config),config:buildConfigData(data.state.config),goal:Number(data.state.monthlyGoal)||0};
 }
 const shifts=data.mybasket_shifts_v23||data.mybasket_shifts_v22||data.mybasket_shifts_v21;
 if(!shifts)throw Error('このファイルはバックアップとして読み込めません。');
 const config=data.mybasket_wages_v77||data.mybasket_wages_v76||{};
 return {shifts:HosshiiPayModel.normalizeShifts(shifts,config),config:buildConfigData(config),goal:Number(config.monthlyGoal)||0};
}
function settingsPayJob(jk){const j=configData[jk];return j?.payDraft?{...j,...HosshiiPayModel.clone(j.payDraft.rates)}:j;}
function hasPendingPay(jk){
 const j=configData[jk];if(!j?.name||!j.payDraft)return false;
 try{return !HosshiiPayModel.ratesEqual(HosshiiPayModel.validateRates(j.payDraft.rates),j);}catch(_){return true;}
}
function captureSettingsPayDraft(jk){
 const j=configData[jk];if(!j||!document.getElementById('set_closeDay'))return;
 const get=id=>document.getElementById(id)?.value||'',num=id=>parseFormattedNumber(get(id));
 j.closeDay=get('set_closeDay');j.payDay=get('set_payDay');
 const rates={paid:num('set_wagePaid'),transMonth:num('set_transMonth'),transDay:num('set_transDay'),allowanceMonth:num('set_allowanceMonth'),allowanceDay:num('set_allowanceDay'),allowanceMemo:get('set_allowanceMemo'),wageSlots:[...document.querySelectorAll('#setWageSlotsContainer [data-slot]')].map(r=>{const i=r.dataset.slot;return{start:get(`set_time_${i}_start`),end:get(`set_time_${i}_end`),wage:num(`set_wage_${i}`),bType:get(`set_btype_${i}`)||'weekday',bVal:num(`set_bval_${i}`)}})};
 j.payDraft={rates};
 if(HosshiiPayModel.ratesEqual(rates,j))delete j.payDraft;
}
function getMonthlyHistoryBenefits(job,start,end,any){return HosshiiPayModel.monthlyBenefits(job,formatDateKey(start),formatDateKey(end),any);}
function validateShiftInput(start,end,rest,isPaid=false,hours){
 try{HosshiiPayModel.validateShift({start,end,breakMins:rest,isPaidLeave:isPaid,hours});return true;}catch(error){showAlertModal(error.message);return false;}
}
