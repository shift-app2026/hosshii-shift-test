import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const functions=JSON.parse(fs.readFileSync(new URL('./reference/ui-functions.json',import.meta.url),'utf8'));
function context(expired){
 const calls=[];
 const c=vm.createContext({window:{hosshiiReadOnly:false,hosshiiCheckEntitlementClock(){this.hosshiiReadOnly=expired;}},
 hosshiiCloudBackupBusy:false,storageWriteBlocked:false,currentSettingsJobKey:'job1',
 hosshiiSyncExpiredUI(){calls.push('expired-ui');},showStorageSafetyWarning(){throw Error('unexpected');},
 syncSettingsFormToConfig(){},prelaunchBackup(){return {schemaVersion:2};},
 async hosshiiBackupRequest(action){calls.push(action);return {ok:true,backupData:{schemaVersion:2}};},
 processBackupText(){calls.push('restore');},localStorage:{setItem(){}},showAlertModal(){},console,Date});
 vm.runInContext([functions.hosshiiBlockEdit,functions.hosshiiCloudBackupSave,functions.hosshiiCloudBackupLoad].join('\n'),c);
 return {c,calls};
}
test('save checks current expiry before request',async()=>{const {c,calls}=context(true);await c.hosshiiCloudBackupSave();assert.equal(c.window.hosshiiReadOnly,true);assert.deepEqual(calls,['expired-ui']);});
test('load checks current expiry before request',async()=>{const {c,calls}=context(true);await c.hosshiiCloudBackupLoad();assert.deepEqual(calls,['expired-ui']);});
test('active save works through guard',async()=>{const {c,calls}=context(false);await c.hosshiiCloudBackupSave();assert.deepEqual(calls,['save']);assert.equal(c.hosshiiCloudBackupBusy,false);});
test('active load retains existing restore path',async()=>{const {c,calls}=context(false);await c.hosshiiCloudBackupLoad();assert.deepEqual(calls,['load','restore']);});
test('local export entry retains no read-only rejection',()=>{const prefix=functions.exportAppData.slice(0,functions.exportAppData.indexOf('const json'));assert.ok(prefix.includes('const payload = prelaunchBackup();'));assert.equal(prefix.includes('hosshiiBlockEdit()'),false);assert.equal(prefix.includes('if (window.hosshiiReadOnly === true)'),false);});
