import { lines } from './model';
import { mapHref } from './slide';

async function imageData(source) {
  if (source.startsWith('data:')) return source;
  const blob = await (await fetch(source)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function exportEditablePptx(data, fields) {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'NT Property Studio';
  pptx.subject = 'Property profile';
  const slide = pptx.addSlide();
  const dark = data.theme === 'premium-dark';
  const accent = ({'modern-navy':'245A92','clean-white':'7E93A9','premium-dark':'D7A842'})[data.theme] || 'FFC629';
  const ink = dark ? 'F5F1E8' : '102340';
  const muted = dark ? 'AFBBCA' : '64748B';
  const background = dark ? '101827' : 'FFFFFF';
  const stripe = dark ? '1F2C3E' : 'F3F6F9';
  slide.background = { color: background };
  const text = (value, x, y, w, h, options = {}) => slide.addText(String(value ?? ''), {
    x,y,w,h,fontFace:'Sarabun',fontSize:8.2,color:ink,margin:0,breakLine:false,
    valign:'mid',...options,
  });
  const rect = (x,y,w,h,color,extra={}) => slide.addShape(pptx.ShapeType.rect,{x,y,w,h,line:{color},fill:{color},...extra});
  rect(.27,.28,.055,.73,accent);
  text(data.category,.48,.28,5,.2,{fontFace:'Prompt',fontSize:8,color:muted,bold:true});
  text(data.title,.48,.49,6.2,.41,{fontFace:'Prompt',fontSize:20,bold:true,breakLine:false});
  text(data.district,.48,.92,5.4,.2,{fontSize:8,color:muted});
  text('กลุ่มธุรกิจเป้าหมาย',7.3,.28,3.5,.16,{fontSize:7,color:muted,align:'right'});
  let tagX = 7.2;
  for (let i=0;i<data.tags.length;i++) {
    const tag=String(data.tags[i]);
    const width=Math.min(2.2,Math.max(.56,tag.length*.067+.2));
    if(tagX+width>11.45)break;
    const filled=!!data.tagHighlights[i];
    slide.addShape(pptx.ShapeType.roundRect,{x:tagX,y:.53,w:width,h:.27,rectRadius:.13,fill:{color:filled?ink:background},line:{color:filled?ink:muted,width:.5}});
    text(tag,tagX+.04,.56,width-.08,.17,{fontFace:'Prompt',fontSize:6.5,color:filled?background:ink,align:'center',bold:filled});
    tagX+=width+.08;
  }
  text('nt',.46,7.09,.35,.23,{fontFace:'Prompt',fontSize:13,bold:true});
  rect(.27,1.12,12.79,.012,dark?'334155':'DEE5EC');
  const assets=await Promise.all([data.photo,data.photo1,data.photo2,data.photo3,data.logoPhoto].map(src=>src?imageData(src):Promise.resolve(null)));
  slide.addImage({data:assets[0],x:.28,y:1.24,w:5.04,h:3.08,sizingCrop:true});
  if(data.showDimensions){
    slide.addShape(pptx.ShapeType.rect,{x:.72,y:1.55,w:4.16,h:2.45,line:{color:accent,width:1.4},fill:{color:background,transparency:100}});
    text(data.dimTop,2.2,1.47,1.25,.19,{color:'102340',fontSize:6.5,align:'center',fill:{color:accent}});
    text(data.dimBottom,2.2,3.92,1.25,.19,{color:'102340',fontSize:6.5,align:'center',fill:{color:accent}});
    text(data.dimLeft,.54,2.7,1.15,.19,{color:'102340',fontSize:6.5,align:'center',fill:{color:accent}});
    text(data.dimRight,4.15,2.7,1.15,.19,{color:'102340',fontSize:6.5,align:'center',fill:{color:accent}});
  }
  for(let i=1;i<=3;i++){
    const x=.28+(i-1)*1.72;
    slide.addImage({data:assets[i],x,y:4.43,w:1.61,h:1.76,sizingCrop:true});
    text(data[`caption${i}`],x+.06,4.48,1.45,.15,{fontSize:6.5,color:'102340',fill:{color:'FFFFFF',transparency:10}});
  }
  rect(.28,6.31,5.04,.62,'102B4D');
  text(`${data.slideLabels?.locationHeading || 'พิกัดที่ตั้ง'}  ${data.lat}, ${data.lng}`,.44,6.45,3.75,.25,{fontFace:'Prompt',fontSize:9,color:'FFFFFF',bold:true,hyperlink:{url:mapHref(data)}});
  text('↗',4.86,6.44,.28,.24,{fontSize:13,color:accent,hyperlink:{url:mapHref(data)}});
  text(data.slideLabels?.profileHeading || 'ข้อมูลทรัพย์สิน',5.58,1.26,4.2,.25,{fontFace:'Prompt',fontSize:12,bold:true});
  rect(5.58,1.56,7.47,.018,ink);
  const rows=fields.flatMap(row=>row[0]==='ownership'?[['price',data.slideLabels?.priceHeading||'ราคา / อัตรา'],row]:[row]);
  let y=1.68;
  rows.forEach(([key,label],i)=>{
    const rowH=key==='building'?.66:.35;
    if(i%2===0)rect(5.58,y,7.47,rowH,stripe);
    text(data.slideLabels?.[`field-${key}`]||label,5.7,y+.04,1.65,rowH-.08,{fontSize:7.7,color:muted});
    text(data[key],7.42,y+.03,5.45,rowH-.06,{fontSize:data.density==='ultracompact'?7:8.3,breakLine:false,fit:'shrink',color:key==='zoning'?'C52C27':ink});
    y+=rowH+.035;
  });
  const cardY=5.55;
  rect(5.58,cardY,4.24,1.38,background,{line:{color:'D6E5F7',width:.6}});
  text(data.slideLabels?.pointsHeading || 'จุดขาย (Key Selling Points)',5.68,cardY+.08,4.04,.2,{fontFace:'Prompt',fontSize:9,bold:true});
  text(lines(data.points).map(point=>`• ${point}`).join('\n'),5.68,cardY+.34,4.04,.95,{fontSize:7.5,color:ink,valign:'top',fit:'shrink'});
  rect(9.95,cardY,3.1,1.38,dark?'2D2931':'FFF9E9',{line:{color:'F3D782',width:.6}});
  text(data.slideLabels?.caveatsHeading||'ข้อจำกัด / ข้อควรระวัง',10.05,cardY+.08,2.9,.2,{fontFace:'Prompt',fontSize:8,bold:true});
  text(lines(data.caveats).map(point=>`• ${point}`).join('\n'),10.05,cardY+.34,2.9,.95,{fontSize:7.5,color:ink,valign:'top',fit:'shrink'});
  if(assets[4]) slide.addImage({data:assets[4],x:.28,y:7.04,w:.72,h:.32});
  rect(.27,7.34,12.79,.04,accent);
  text(data.slideLabels?.footerLeft??'',1.1,7.13,5.8,.16,{fontSize:6.5,color:muted});
  text(data.slideLabels?.footerRight??'© National Telecom All Rights Reserved',8,7.13,5,.16,{fontSize:6.5,color:muted,align:'right'});
  await pptx.writeFile({fileName:`${data.title||'property-pitch'}.pptx`});
}
