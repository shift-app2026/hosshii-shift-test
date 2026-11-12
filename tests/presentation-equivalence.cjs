// Only exact, reviewed view-template replacements may differ from the original scripts.
// Reversing these must reproduce the entire original script contents byte for byte.
const assert=require('node:assert/strict');
const changes=require('./view-markup-changes.json');
// Explicitly requested schedule rendering and copy-view routing changes.
const approvedUiChanges=require('./approved-ui-changes.json');
// Authorized empty-workplace rendering guards; calculation and storage stay exact.
const emptyStateFix=require('./approved-empty-state-fix.json');
const accessibleUi=require('./approved-accessible-ui.json');
const monthEndDisplay=require('./approved-month-end-display.json');
const androidReadability=require('./approved-android-readability.json');
const detailUi=require('./approved-detail-ui.json');
const sansDisplay=require('./approved-sans-display.json');
const wageStateFix=require('./approved-wage-state-fix.json');
const wording=s=>s.replace(/<span\b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/g,'').replace(/<[^>]+>/g,'').replace(/\s/g,'');
for(const {before,after} of changes)assert.equal(wording(after),wording(before),'View markup must preserve confirmed wording');
function normalizePresentation(source){
 for(const {before,after} of androidReadability)source=source.split(after).join(before);
 for(const {before,after} of detailUi)source=source.split(after).join(before);
 for(const {before,after} of sansDisplay)source=source.split(after).join(before);
 for(const {before,after} of wageStateFix)source=source.split(after).join(before);
 for(const {before,after} of monthEndDisplay)source=source.split(after).join(before);
 source=source.replace(/<script id="accessible-registration-ui">[\s\S]*?<\/script>\n/,'');
 for(const {before,after} of accessibleUi)source=source.split(after).join(before);
 for(const {before,after} of emptyStateFix)source=source.split(after).join(before);
 for(const {before,after} of approvedUiChanges)source=source.split(after).join(before);
 for(const {before,after} of changes)source=source.split(after).join(before);
 return source;
}
module.exports={normalizePresentation,changes,approvedUiChanges,emptyStateFix};
