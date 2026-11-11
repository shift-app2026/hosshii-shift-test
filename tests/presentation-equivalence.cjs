// Only exact, reviewed view-template replacements may differ from the original scripts.
// Reversing these must reproduce the entire original script contents byte for byte.
const assert=require('node:assert/strict');
const changes=require('./view-markup-changes.json');
// Explicitly requested schedule rendering and copy-view routing changes.
const approvedUiChanges=require('./approved-ui-changes.json');
// Authorized empty-workplace rendering guards; calculation and storage stay exact.
const emptyStateFix=require('./approved-empty-state-fix.json');
const wording=s=>s.replace(/<span\b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/g,'').replace(/<[^>]+>/g,'').replace(/\s/g,'');
for(const {before,after} of changes)assert.equal(wording(after),wording(before),'View markup must preserve confirmed wording');
function normalizePresentation(source){
 for(const {before,after} of emptyStateFix)source=source.split(after).join(before);
 for(const {before,after} of approvedUiChanges)source=source.split(after).join(before);
 for(const {before,after} of changes)source=source.split(after).join(before);
 return source;
}
module.exports={normalizePresentation,changes,approvedUiChanges,emptyStateFix};
