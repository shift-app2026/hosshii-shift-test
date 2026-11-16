/* Per-account device storage and one editor per origin/account. No network or tokens stored. */
(function () {
  'use strict';
  const BASE = 'hosshii_prelaunch_state_v2';
  const namespace = window.HOSSHII_ISOLATED_CONFIG?.storageNamespace || 'hosshii-shift';
  const ownerKey = `${BASE}:${namespace}:legacy-owner`;
  const session = {subjectHash:null,subject:null,key:null,locked:false,reason:'pending',release:null,lockTask:null};
  let activation = null;
  window.hosshiiEntitlementReadOnly = true;
  window.hosshiiEntitlementStatusReason = 'checking';
  const messages = {
    pending:'端末の保存状態を確認しています。確認が終わるまで編集できません。',
    busy:'別の画面でこのアプリを編集中です。そちらを閉じてから「再確認」を押してください。この画面は閲覧できます。',
    conflict:'別の画面で保存内容が更新されています。入力内容はこの画面に保持しています。必要な入力を書き出してから「再確認」で保存済みデータを読み直してください。',
    unsupported:'このブラウザーでは安全な同時編集を制御できません。データは閲覧できます。最新版のChromeまたはLINEで開き直してください。',
    unavailable:'端末の保存領域を安全に利用できません。データを消去せず、通信・ブラウザーの設定を確認してください。',
    account:'LINEアカウントが変わったため画面を停止しました。未保存の入力がある場合は元のアカウントに戻して保存してください。別のアカウントで使う場合は再読み込みしてください。'
  };
  window.hosshiiStorageMessage = () => messages[session.reason] || messages.unavailable;
  function refresh() {
    window.hosshiiStorageReadOnly = !session.locked || session.reason !== 'ready';
    window.hosshiiReadOnly = window.hosshiiEntitlementReadOnly || window.hosshiiStorageReadOnly;
    window.hosshiiStatusReason = window.hosshiiEntitlementReadOnly
      ? window.hosshiiEntitlementStatusReason : window.hosshiiStorageReadOnly ? 'local-storage' : 'active';
    if (typeof window.hosshiiSyncExpiredUI === 'function') window.hosshiiSyncExpiredUI();
  }
  window.hosshiiSetEntitlement = function (readOnly, reason) {
    window.hosshiiEntitlementReadOnly = !!readOnly;
    window.hosshiiEntitlementStatusReason = reason;
    refresh();
  };
  window.hosshiiStorageCanEdit = () => {
    if(session.subject && !window.hosshiiCheckStorageIdentity())return false;
    return session.locked && session.reason === 'ready';
  };
  window.hosshiiMarkStorageConflict = function () { session.reason = 'conflict'; refresh(); };
  function conceal(concealed) {
    const app = document.getElementById('appCard');
    if (!app) return;
    if (concealed) {
      app.style.setProperty('visibility','hidden','important');
      app.setAttribute('aria-hidden','true'); app.inert = true;
    } else {
      app.style.removeProperty('visibility');app.removeAttribute('aria-hidden');app.inert = false;
    }
  }
  function subjectFromVerifiedToken(token) {
    // This is called ONLY after the server accepted this same token. Decoding is
    // for local namespacing, not a substitute for server signature verification.
    if (!token) throw Error(messages.account);
    const parts = token.split('.');
    if (parts.length !== 3) throw Error('本人確認済みのLINE情報を読み取れません。LINEから開き直してください。');
    let payload;
    try {
      const b64 = parts[1].replace(/-/g,'+').replace(/_/g,'/');
      const bytes = Uint8Array.from(atob(b64.padEnd(Math.ceil(b64.length/4)*4,'=')),c=>c.charCodeAt(0));
      payload = JSON.parse(new TextDecoder().decode(bytes));
    } catch (_) { throw Error('本人確認済みのLINE情報を読み取れません。LINEから開き直してください。'); }
    if (payload.iss !== 'https://access.line.me' || typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 200) {
      throw Error('LINEアカウントを識別できません。LINEから開き直してください。');
    }
    return payload.sub;
  }
  function accountChanged() {
    session.reason='account';conceal(true);refresh();
    const gate=document.getElementById('lineAuthGate');if(gate)gate.hidden=false;
    const message=document.getElementById('lineAuthMessage');if(message)message.textContent=messages.account;
    const consent=document.getElementById('lineAuthConsent');if(consent)consent.hidden=true;
    const error=Error(messages.account);error.code='ACCOUNT_CHANGED';return error;
  }
  window.hosshiiCheckStorageIdentity = function() {
    if(!session.subject)return true;
    try {if(subjectFromVerifiedToken(window.liff?.getIDToken?.())===session.subject)return true;}catch(_){}
    accountChanged();return false;
  };
  window.hosshiiStorageMatchesToken = function(token) {
    try {
      if(session.subject && subjectFromVerifiedToken(token)===session.subject && window.hosshiiCheckStorageIdentity())return true;
    }catch(_){}
    accountChanged();return false;
  };
  async function subjectHash(sub) {
    if (!globalThis.crypto?.subtle) throw Error('安全な保存領域を初期化できません。HTTPSで開き直してください。');
    const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sub));
    return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  async function acquire(key) {
    if (session.locked && session.key === key) return true;
    if (!navigator.locks?.request) { session.reason = 'unsupported'; return false; }
    let decide;
    const ready = new Promise(resolve=>{decide=resolve;});
    const held = new Promise(resolve=>{session.release=resolve;});
    session.lockTask = navigator.locks.request(`hosshii-edit:${key}`,{mode:'exclusive',ifAvailable:true},async lock=>{
      if (!lock) { session.reason='busy';decide(false);return; }
      session.locked=true;decide(true);
      // Hold the Web Lock for the document lifetime. A second tab is read-only.
      await held;
      session.locked=false;
    }).catch(()=>{session.locked=false;session.reason='unavailable';decide(false);refresh();});
    return ready;
  }
  function emptyState() { return {schemaVersion:2,config:buildConfigData({jobCount:0}),shifts:{},monthlyGoal:0}; }
  function legacyState() {
    const raw=localStorage.getItem(BASE);
    if(raw!==null){
      const state=JSON.parse(raw);validatePrelaunchEnvelope(state);
      return {schemaVersion:2,config:buildConfigData(state.config),shifts:HosshiiPayModel.normalizeShifts(state.shifts,state.config),monthlyGoal:state.monthlyGoal};
    }
    const wages=localStorage.getItem('mybasket_wages_v77'),shifts=localStorage.getItem('mybasket_shifts_v23');
    if(wages===null&&shifts===null)return null;
    const parsed=prelaunchParseBackup({mybasket_wages_v77:JSON.parse(wages||'{}'),mybasket_shifts_v23:JSON.parse(shifts||'{}')});
    return {schemaVersion:2,config:parsed.config,shifts:parsed.shifts,monthlyGoal:parsed.goal};
  }
  function containsData(state) {
    return state && (Object.keys(state.shifts).length || ['job1','job2','job3'].some(k=>!!state.config[k]?.name) || state.monthlyGoal>0);
  }
  async function initialiseOwnedState(hash,key,canWrite) {
    if(localStorage.getItem(key)!==null || !canWrite)return;
    // Claim legacy data across accounts under a separate exclusive lock. Original
    // keys are retained, and an unrecognised owner is NEVER auto-displayed.
    await navigator.locks.request(`hosshii-legacy-claim:${namespace}`,{mode:'exclusive'},async()=>{
      if(!window.hosshiiCheckStorageIdentity())throw accountChanged();
      if(localStorage.getItem(key)!==null)return;
      const owner=localStorage.getItem(ownerKey);
      if(owner!==null && !/^[a-f0-9]{64}$/.test(owner))throw Error('旧データの所有者記録を読み取れません。データを消去せずご相談ください。');
      if(owner && owner!==hash)return;
      const old=legacyState();
      if(!containsData(old))return;
      if(!owner){
        const accepted=window.confirm('この端末には以前のシフト・設定があります。以前と同じLINEアカウントのご本人であることを確認できる場合だけ「OK」で引き継いでください。\n別の方のデータや不明な場合はキャンセルしてください。旧データは削除しません。');
        if(!accepted){
          window.alert('旧データは削除せず保護しています。今回は空の領域で開始します。引き継ぐ場合は、編集を始める前に再読み込みして確認してください。');
          return;
        }
        localStorage.setItem(ownerKey,hash);
        if(localStorage.getItem(ownerKey)!==hash)throw Error('旧データの所有者を記録できませんでした。');
      }
      const raw=JSON.stringify({...old,storageRevision:0});
      localStorage.setItem(key,raw);
      if(localStorage.getItem(key)!==raw)throw Error('旧データの引き継ぎを保存できませんでした。');
      // Auxiliary preferences belong to the confirmed owner as well. Failure to
      // copy a timestamp must not turn a successful data migration into failure.
      for(const name of ['mybasket_last_backup','mybasket_backup_reminded','itoWallThreshold']){
        try {const value=localStorage.getItem(name);if(value!==null)localStorage.setItem(key+':meta:'+name,value);}catch(_){}
      }
    });
  }
  function hydrate() {
    const state=prelaunchReadStored() || emptyState();
    if(storageWriteBlocked)throw Error('保存済みデータを読み取れません。データを消去せずご相談ください。');
    configData=buildConfigData(state.config);shiftsData=HosshiiPayModel.normalizeShifts(state.shifts,configData);monthlyGoal=state.monthlyGoal;
    settingsDraftDirty=false;updateSettingsSaveStatus(true);
    if(typeof restoreItoWallSelection==='function')restoreItoWallSelection();
    ensureValidSelectedJob();renderSettingsJobTabs();renderSettingsJobContent(currentSettingsJobKey);refreshAll();
  }
  window.hosshiiActivateVerifiedStorage = async function(token) {
    let sub;
    try {
      sub=subjectFromVerifiedToken(token);
      if(subjectFromVerifiedToken(window.liff?.getIDToken?.())!==sub)throw Error(messages.account);
    } catch(_) { throw accountChanged(); }
    const hash=await subjectHash(sub);
    try {if(subjectFromVerifiedToken(window.liff?.getIDToken?.())!==sub)throw Error(messages.account);}
    catch(_) {throw accountChanged();}
    if(session.subjectHash && hash!==session.subjectHash){
      throw accountChanged();
    }
    if(session.subjectHash===hash && session.locked && session.reason==='account'){session.reason='ready';conceal(false);refresh();return;}
    if(session.subjectHash===hash && (session.reason==='ready'||session.reason==='conflict')){conceal(false);refresh();return;}
    if(activation)return activation;
    activation=(async()=>{
      session.subjectHash=hash;session.subject=sub;
      session.key=`${BASE}:${namespace}:line:${hash}`;
      const writable=await acquire(session.key);
      if(!window.hosshiiCheckStorageIdentity())throw accountChanged();
      PRELAUNCH_STATE_KEY=session.key;
      await initialiseOwnedState(hash,session.key,writable);
      if(!window.hosshiiCheckStorageIdentity())throw accountChanged();
      hydrate();
      if(writable)session.reason='ready';
      conceal(false);refresh();
    })();
    try { await activation; }
    catch(error){if(error.code==='ACCOUNT_CHANGED'){refresh();throw error;}session.reason='unavailable';refresh();if(['QuotaExceededError','SecurityError'].includes(error.name))throw Error('端末に保存できず、データの引き継ぎを完了できませんでした。旧データは削除していません。空き容量や保存設定を確認して再試行してください。');throw error;}
    finally {activation=null;}
  };
  window.hosshiiResolveStorageConflict = async function() {
    if(!session.subjectHash || !window.hosshiiCheckStorageIdentity())return;
    if(session.reason==='conflict' && !window.confirm('保存済みデータを読み直します。この画面の未保存の入力は読み直すと消えます。必要な入力を控えるか書き出した後で「OK」を押してください。'))return;
    try {
      const writable=session.locked || await acquire(session.key);
      if(!writable){refresh();return;}
      if(!window.hosshiiCheckStorageIdentity())return;
      hydrate();session.reason='ready';refresh();
    } catch(error){session.reason='unavailable';refresh();showAlertModal(error.message);}
  };
  window.addEventListener('storage',event=>{
    if(session.key && event.key===session.key && event.newValue!==prelaunchExpectedRaw){
      // Do not replace this page's input or memory with a newer snapshot.
      session.reason=session.locked?'conflict':'busy';refresh();
    }
  });
  refresh();
})();
