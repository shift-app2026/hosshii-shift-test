"""Copy only static allowlisted assets. No deployment, HTTP, credentials or DB access."""
import argparse, pathlib, shutil
parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);a=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[1];out=pathlib.Path(a.output).resolve()
if out==root or root in out.parents or out in root.parents:raise SystemExit('Output must be outside source tree')
if out.exists() and any(out.iterdir()):raise SystemExit('Use empty output directory')
files=['index.html','isolated-config.js','prelaunch-core.js','prelaunch-model.js','prelaunch-ui.js',
'prelaunch.css','bordeaux-rose.css','zen-maru.css','android-readability.css','icon-192.png','icon-512.png',
'icon-maskable-512.png','apple-touch-icon.png','terms.html','privacy.html','paid-terms.html']
# Validate all sources before creating anything.
for f in files:
 if not (root/f).is_file() or (root/f).is_symlink():raise SystemExit('Missing/unsafe source: '+f)
if not (root/'fonts').is_dir():raise SystemExit('Missing fonts')
html=(root/'index.html').read_text()
if "connect-src 'none'" not in html or "window.HOSSHII_ISOLATED_CONFIG" not in html:raise SystemExit('Isolation guard missing')
if 'https://urwmuafkmlgzanpiksfv.supabase.co' in html:raise SystemExit('Production URL found in app HTML')
out.mkdir(parents=True,exist_ok=True)
for f in files:shutil.copyfile(root/f,out/f)
shutil.copytree(root/'fonts',out/'fonts')
print('Prepared unconfigured static files only. No publish/deploy performed.')
