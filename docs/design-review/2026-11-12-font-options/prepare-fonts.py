# Build-time downloads for comparison images only. Not linked from the app.
from pathlib import Path
import subprocess,re,hashlib,concurrent.futures,json
out=Path('/workspace/pr8-candidate-fonts');out.mkdir(exist_ok=True)
css_url='https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@600;700&family=Zen+Kaku+Gothic+New:wght@700&family=Zen+Maru+Gothic:wght@700&display=swap'
css=subprocess.check_output(['curl','-fsSL','--max-time','60','-A','Mozilla/5.0 Chrome/131.0.0.0 Safari/537.36',css_url],text=True)
urls=sorted(set(re.findall(r'url\((https://[^)]+)\)',css)))
def download(u):
 name=hashlib.sha256(u.encode()).hexdigest()[:20]+'.ttf';p=out/name
 if not p.exists():subprocess.run(['curl','-fsSL','--retry','2','--max-time','60',u,'-o',str(p)],check=True)
 return u,name
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 for u,n in pool.map(download,urls):css=css.replace(u,'/candidate-fonts/'+n)
(out/'fonts.css').write_text(css)
(out/'source.json').write_text(json.dumps({'cssSource':css_url,'fontFiles':len(urls),'weights':{'Noto Sans JP':[600,700],'Zen Kaku Gothic New':[700],'Zen Maru Gothic':[700]},'usage':'comparison only; not applied to source application'},indent=2)+'\n')
print('Candidate font files:',len(urls))
