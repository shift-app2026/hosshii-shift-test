# Official static faces only. Zen Maru Gothic has no official 600 face.
from pathlib import Path
import subprocess,json,hashlib,re
out=Path('/workspace/pr8-zen-maru-fonts');out.mkdir(exist_ok=True)
base='https://raw.githubusercontent.com/google/fonts/main/ofl/zenmarugothic/'
meta=subprocess.check_output(['curl','-fsSL','--max-time','30',base+'METADATA.pb'],text=True)
weights=list(map(int,re.findall(r'weight: (\d+)',meta)));assert weights==[300,400,500,700,900]
(out/'METADATA.pb').write_text(meta);faces=[];css=''
for weight,face in [(500,'Medium'),(700,'Bold')]:
 n='ZenMaruGothic-'+face+'.ttf';u=base+n;p=out/n
 if not p.exists():subprocess.run(['curl','-fsSL','--max-time','60',u,'-o',str(p)],check=True)
 faces.append({'weight':weight,'source':u,'filename':n,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
 css+=f'@font-face{{font-family:"Zen Maru Gothic";font-style:normal;font-weight:{weight};font-display:swap;src:url("/zen-maru-fonts/{n}") format("truetype");}}\n'
(out/'fonts.css').write_text(css)
(out/'source.json').write_text(json.dumps({'metadataSource':base+'METADATA.pb','officialWeights':weights,'faces':faces,'requested600Available':False,'approvedAlternative':'User approved 500/700 comparison; no app adoption'},indent=2)+'\n')
print('Official 500 and 700 faces ready; 600 unavailable')
