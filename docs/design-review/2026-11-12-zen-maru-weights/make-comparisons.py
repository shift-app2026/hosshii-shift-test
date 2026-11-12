from pathlib import Path
from PIL import Image,ImageFont,ImageDraw
p=Path(__file__).resolve().parent
f=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',22)
labels={'salary-top':'お給料・無料お試し表示','salary-breakdown':'給与内訳・勤務時間・金額','salary-annual':'年間収入','calendar':'シフト登録','list':'予定表','settings':'設定上部','settings-wage':'設定・時給入力','settings-paid':'有給休暇','settings-allowances':'交通費・その他','guide':'はじめに','shift':'シフト登録ポップアップ','time-picker':'時間選択'}
for width in [320,375]:
 for scene,label in labels.items():
  a=Image.open(p/f'{width}-A-{scene}.png');b=Image.open(p/f'{width}-B-{scene}.png')
  im=Image.new('RGB',(a.width+b.width+12,a.height+108),'#fffafb');d=ImageDraw.Draw(im)
  d.text((10,2),f'{width}px・{label}',font=f,fill='#302027')
  d.text((10,37),'A：700中心',font=f,fill='#790b30')
  d.text((a.width+22,37),'B：見出し・勤務先名700／本文・金額500',font=f,fill='#790b30')
  d.text((10,71),'下部タブ700',font=f,fill='#302027')
  d.text((a.width+22,71),'下部タブ500（600の代替・ご承認済み）',font=f,fill='#302027')
  im.paste(a,(0,108));im.paste(b,(a.width+12,108));im.save(p/f'{width}-AB-{scene}.png')
 a=Image.open(p/f'{width}-tabs-500.png');b=Image.open(p/f'{width}-tabs-700.png')
 im=Image.new('RGB',(a.width+b.width+12,max(a.height,b.height)+70),'#fffafb');d=ImageDraw.Draw(im)
 d.text((10,5),f'{width}px・下部タブ500',font=f,fill='#302027');d.text((a.width+22,5),'下部タブ700',font=f,fill='#302027')
 d.text((10,36),'文字サイズ・色・SVGアイコンは共通',font=f,fill='#790b30')
 im.paste(a,(0,70));im.paste(b,(a.width+12,70));im.save(p/f'{width}-tabs-comparison.png')
