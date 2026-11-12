from pathlib import Path
import re,subprocess,json,hashlib,concurrent.futures,argparse,shutil
parser=argparse.ArgumentParser(description='Build an isolated, offline-only design preview; never deploys.')
parser.add_argument('--output',type=Path,required=True)
parser.add_argument('--font-cache',type=Path)
args=parser.parse_args()
ROOT=Path(__file__).resolve().parents[2]; OUT=args.output.resolve()
assert OUT!=ROOT and ROOT not in OUT.parents, 'Output must be outside the application repository'
OUT.mkdir(parents=True,exist_ok=True)
assert not any(OUT.iterdir()), 'Use an empty output directory to avoid obsolete files'
for name in ['preview-bootstrap.js','preview-ui.js']:(OUT/name).write_bytes((Path(__file__).parent/name).read_bytes())
src=(ROOT/'index.html').read_text(); sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
assert subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()=='design/bordeaux-rose-champagne'
font_assets=['fonts/ZenMaruGothic-Medium.woff2','fonts/ZenMaruGothic-Bold.woff2','fonts/zenmarugothic-OFL.txt']
source_hashes={n:hashlib.sha256((ROOT/n).read_bytes()).hexdigest() for n in ['index.html','bordeaux-rose.css','zen-maru.css',*font_assets]}
s=src
s,n=re.subn(r'<script id="line-auth-supabase-test-20261028">[\s\S]*?</script>','<!-- Preview: real authentication and trial code excluded. -->',s);assert n==1
s,n=re.subn(r'<script src="https://static.line-scdn.net/[^>]+></script>','',s);assert n==1
start=s.index("    const HOSSHII_BACKUP_ENDPOINT =")
end=s.index('    // バックアップ: LINE内WebView',start)
s=s[:start]+'''    let hosshiiCloudBackupBusy = false;
    function hosshiiCloudBackupSave(event) { if(event)event.preventDefault(); previewDisabled(); }
    function hosshiiCloudBackupLoad(event) { if(event)event.preventDefault(); previewDisabled(); }
'''+s[end:]
s=s.replace('localStorage','previewStorage')
s=re.sub(r'<link[^>]+(?:fonts\.googleapis\.com|fonts\.gstatic\.com|manifest\.webmanifest)[^>]*>','',s)
s=re.sub(r'<meta[^>]+property="og:(?:url|image)"[^>]*>','',s)
s=re.sub(r'return `https://calendar\.google\.com/[^\n]+;',"return '#'; // Preview: no external calendar navigation",s)
s=s.replace('<title>', '<title>【デザイン確認専用】',1)
csp="default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'none'"
s=s.replace('<head>', '<head>\n<meta http-equiv="Content-Security-Policy" content="'+csp+'">\n<meta name="robots" content="noindex,nofollow,noarchive">\n<link rel="stylesheet" href="./fonts/fonts.css">\n<script src="./preview-bootstrap.js"></script>',1)
s=s.replace('</body>','<script src="./preview-ui.js"></script>\n</body>')
# Original application remains untouched. Only the isolated output has disabled I/O.
(OUT/'index.html').write_text(s)
for n in ['bordeaux-rose.css','zen-maru.css',*font_assets]:
 (OUT/n).parent.mkdir(parents=True,exist_ok=True)
 (OUT/n).write_bytes((ROOT/n).read_bytes())
for n in ['icon-192.png']:(OUT/n).write_bytes((ROOT/n).read_bytes())
(OUT/'_headers').write_text('/*\n  Content-Security-Policy: '+csp+"; frame-ancestors 'none'\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n  Cache-Control: no-store\n")
(OUT/'robots.txt').write_text('User-agent: *\nDisallow: /\n')
# Fetch and bundle original font families. These are build-time downloads only.
fdir=OUT/'fonts';fdir.mkdir(exist_ok=True)
if args.font_cache:
 for file in args.font_cache.iterdir():
  if file.is_file() and (re.fullmatch(r'[0-9a-f]{20}\.woff2',file.name) or file.name in ['fonts.css','notosansjp-OFL.txt','notoserifjp-OFL.txt','cinzel-OFL.txt']):shutil.copyfile(file,fdir/file.name)
 css=(fdir/'fonts.css').read_text()
 assert not re.search(r'url\([\"\']?https?://',css), 'Cache must contain local fonts only'
 urls=list(fdir.glob('*.woff2'))
 for family in ['notosansjp','notoserifjp','cinzel']:assert (fdir/(family+'-OFL.txt')).is_file()
else:
 url='https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Noto+Sans+JP:wght@400;500;700;800&family=Noto+Serif+JP:wght@600;700&display=swap'
 ua='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
 css=subprocess.check_output(['curl','-fsSL','--max-time','60','-A',ua,url],text=True)
 urls=sorted(set(re.findall(r'url\((https://[^)]+)\)',css)))
 def get(u):
  name=hashlib.sha256(u.encode()).hexdigest()[:20]+'.woff2';p=fdir/name
  if not p.exists():subprocess.run(['curl','-fsSL','--retry','2','--max-time','60',u,'-o',str(p)],check=True)
  return u,name
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
  for u,name in pool.map(get,urls):css=css.replace(u,'./'+name)
 (fdir/'fonts.css').write_text(css)
 for family in ['notosansjp','notoserifjp','cinzel']:
  subprocess.run(['curl','-fsSL','--retry','2','--max-time','40','https://raw.githubusercontent.com/google/fonts/main/ofl/'+family+'/OFL.txt','-o',str(fdir/(family+'-OFL.txt'))],check=True)
manifest={'sourceRepository':'shift-app2026/hosshii-shift-test','sourcePR':8,'sourceBranch':'design/bordeaux-rose-champagne','sourceCommit':sha,'sourceHashes':source_hashes,'fontFiles':len(list(fdir.glob('*.woff2'))),'previewOnly':True,'storage':'fresh in-memory fixtures per page load; no persistent storage','externalServices':'excluded; connect-src none'}
(OUT/'preview-source.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(manifest,ensure_ascii=False))

# Local terms placeholder; never navigate to production policy pages.
(OUT/'terms.html').write_text("""<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>デザイン確認専用</title></head><body><h1>デザイン確認専用の案内</h1><p>架空データを使ったデザイン見本です。認証・契約・決済・クラウド保存は実行しません。</p><a href="./">プレビューに戻る</a></body></html>""")
(OUT/'UPLOAD-README.txt').write_text('デザイン確認専用。架空データのみ、外部通信なし、変更はメモリ内のみ。再読込でリセット。\nCloudflareへの再デプロイはユーザーの別途許可が出るまで行わないでください。既存プロジェクトへの上書きは禁止です。\n')
files={p.relative_to(OUT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.rglob('*') if p.is_file()}
(OUT/'file-integrity.json').write_text(json.dumps(files,ensure_ascii=False,indent=2)+'\n')
