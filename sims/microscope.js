(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,niceStep}=BioLab.h;
/* Optics: field number 18 mm with a 10× eyepiece, so field of view = 18 mm ÷ objective.
   Parfocal objectives with small focus offsets; depth of field shrinks at high power. */
const OBJ={4:{fov:4500,dof:50,off:0,wd:17,na:0.10,bright:1,len:30,band:'#d23a3a'},
           10:{fov:1800,dof:8,off:4,wd:7,na:0.25,bright:0.85,len:40,band:'#e0b020'},
           40:{fov:450,dof:1.5,off:10,wd:0.6,na:0.65,bright:0.6,len:52,band:'#3a7ad2'},
           100:{fov:180,dof:0.6,off:15,wd:0.15,na:1.25,bright:0.45,len:60,band:'#f2f2f2'}};
const SLIDES={onion:{name:'onion skin cells',unit:'onion cell',len:250},cheek:{name:'human cheek cells',unit:'cheek cell',len:60},
  elodea:{name:'Elodea leaf cells',unit:'leaf cell',len:75},blood:{name:'a human blood smear',unit:'red blood cell',len:7.5},e:{name:'a newspaper letter “e”',unit:'',len:NaN}};
const VX=255,VY=225,VR=200;
function H(a,b,c){let h=Math.imul(a|0,374761393)^Math.imul(b|0,668265263)^Math.imul((c|0)+1013,-2048144789);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function optics(sim){const p=sim.p,o=OBJ[p.obj]||OBJ[4],zf=p.coarse*20+p.fine,target=1000+o.off,noOil=p.obj===100&&!p.oil;
  const blur=Math.min(14,Math.abs(zf-target)/o.dof*1.2)+(noOil?4:0);
  const bright=p.light/100*o.bright*(noOil?0.55:1);
  return {o,zf,target,blur,bright,noOil,fov:o.fov,S:400/o.fov};}
function fmtInt(n){return Math.round(n).toLocaleString('en-US');}
/* ---- specimens, drawn in world micrometers ---- */
function rowsSpecimen(ctx,x0,x1,y0,y1,RH,CL,jit,wallColor,wallW,cb){const walls=new Path2D(),j0=Math.floor(y0/RH)-1,j1=Math.ceil(y1/RH);
  for(let j=j0;j<=j1;j++){const y=j*RH;walls.moveTo(x0,y);walls.lineTo(x1,y);const off=H(j,7,1)*CL,k0=Math.floor((x0-off)/CL)-1,k1=Math.ceil((x1-off)/CL)+1;let prev=null;
    for(let k=k0;k<=k1;k++){const x=off+k*CL+(H(j,k,2)-.5)*jit;walls.moveTo(x,y);walls.lineTo(x,y+RH);if(prev!==null&&cb)cb(prev,y,x-prev,RH,j,k);prev=x;}}
  ctx.strokeStyle=wallColor;ctx.lineWidth=wallW;ctx.stroke(walls);}
function drawOnion(ctx,x0,x1,y0,y1,S,t,lw){ctx.fillStyle='#f1dfa2';ctx.fillRect(x0,y0,x1-x0,y1-y0);const nucs=[];
  rowsSpecimen(ctx,x0,x1,y0,y1,60,250,90,'#8c6420',Math.max(3.5,1.2*lw),(x,y,w,h,j,k)=>nucs.push([x+w/2+(H(j,k,3)-.5)*w*.5,y+h/2+(H(j,k,4)-.5)*18]));
  if(13*S>=0.7){ctx.fillStyle='#8a5a17';ctx.beginPath();nucs.forEach(n=>{ctx.moveTo(n[0]+13,n[1]);ctx.ellipse(n[0],n[1],13,10,0,0,6.29);});ctx.fill();
    if(S>0.5){ctx.fillStyle='#5a370b';ctx.beginPath();nucs.forEach(n=>{ctx.moveTo(n[0]+6.5,n[1]-2);ctx.arc(n[0]+3,n[1]-2,3.5,0,6.29);});ctx.fill();}}}
function drawCheek(ctx,x0,x1,y0,y1,S,t,lw){ctx.fillStyle='#edf2f8';ctx.fillRect(x0,y0,x1-x0,y1-y0);const G=90,cells=new Path2D(),nucs=[];
  for(let i=Math.floor(x0/G)-1;i<=Math.ceil(x1/G);i++)for(let j=Math.floor(y0/G)-1;j<=Math.ceil(y1/G);j++){
    const d=0.3+0.26*Math.sin(i*0.09+1)*Math.cos(j*0.07);if(H(i,j,5)>d)continue;
    const cx=(i+H(i,j,6))*G,cy=(j+H(i,j,7))*G,r=25+H(i,j,8)*14,rot=H(i,j,9)*6.28;
    for(let m=0;m<9;m++){const a=rot+m/9*6.283,rad=r*(0.78+0.4*H(i,j,10+m));const x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad;m?cells.lineTo(x,y):cells.moveTo(x,y);}cells.closePath();
    nucs.push([cx+(H(i,j,30)-.5)*r*.3,cy+(H(i,j,31)-.5)*r*.3]);}
  ctx.fillStyle='rgba(140,172,212,0.38)';ctx.fill(cells);ctx.strokeStyle='#5a82b6';ctx.lineWidth=Math.max(0.8,1.1*lw);ctx.stroke(cells);
  if(4.5*S>=0.4){ctx.fillStyle='#2c4c98';ctx.beginPath();nucs.forEach(n=>{ctx.moveTo(n[0]+4.5,n[1]);ctx.ellipse(n[0],n[1],4.5,3.8,0,0,6.29);});ctx.fill();}}
function drawElodea(ctx,x0,x1,y0,y1,S,t,lw){ctx.fillStyle='#cde8b2';ctx.fillRect(x0,y0,x1-x0,y1-y0);const cells=[];
  rowsSpecimen(ctx,x0,x1,y0,y1,28,75,30,'#2f6b2a',Math.max(2.2,1.2*lw),(x,y,w,h,j,k)=>cells.push([x,y,w,h,j,k]));
  if(S>=0.5){ctx.fillStyle='#2b8a2b';ctx.beginPath();const sp=RM?2:6;
    cells.forEach(c=>{const [x,y,w,h,j,k]=c,iw=w-8,ih=h-8,P=2*(iw+ih),dir=H(j,k,5)<.5?1:-1;if(iw<4)return;
      for(let m=0;m<16;m++){let u=((H(j,k,20+m)*P+dir*t*sp)%P+P)%P,px,py;
        if(u<iw){px=x+4+u;py=y+4;}else if((u-=iw)<ih){px=x+4+iw;py=y+4+u;}else if((u-=ih)<iw){px=x+4+iw-u;py=y+4+ih;}else{u-=iw;px=x+4;py=y+4+ih-u;}
        ctx.moveTo(px+3.4,py);ctx.ellipse(px,py,3.4,2.6,0,0,6.29);}});ctx.fill();}}
function drawBlood(ctx,x0,x1,y0,y1,S,t,lw){ctx.fillStyle='#f6ebee';ctx.fillRect(x0,y0,x1-x0,y1-y0);
  if(S>=0.45){const G=9,o=new Path2D(),c=new Path2D();
    for(let i=Math.floor(x0/G)-1;i<=Math.ceil(x1/G);i++)for(let j=Math.floor(y0/G)-1;j<=Math.ceil(y1/G);j++){if(H(i,j,1)>0.6)continue;
      const cx=(i+H(i,j,2))*G,cy=(j+H(i,j,3))*G,r=3.75*(0.92+0.16*H(i,j,4));o.moveTo(cx+r,cy);o.arc(cx,cy,r,0,6.29);c.moveTo(cx+r*.4,cy);c.arc(cx,cy,r*.4,0,6.29);}
    ctx.fillStyle='#e2848f';ctx.fill(o);ctx.strokeStyle='#c45867';ctx.lineWidth=Math.max(0.25,0.8*lw);ctx.stroke(o);ctx.fillStyle='#f3c3c9';ctx.fill(c);
    const pl=new Path2D();for(let i=Math.floor(x0/22)-1;i<=Math.ceil(x1/22);i++)for(let j=Math.floor(y0/22)-1;j<=Math.ceil(y1/22);j++){if(H(i,j,40)>0.12)continue;const cx=(i+H(i,j,41))*22,cy=(j+H(i,j,42))*22;pl.moveTo(cx+1.3,cy);pl.arc(cx,cy,1.3,0,6.29);}
    ctx.fillStyle='#8e5bb5';ctx.fill(pl);}
  else{const G=Math.max(9,4/S),q=new Path2D();for(let i=Math.floor(x0/G)-1;i<=Math.ceil(x1/G);i++)for(let j=Math.floor(y0/G)-1;j<=Math.ceil(y1/G);j++){if(H(i,j,1)>0.7)continue;const cx=(i+H(i,j,2))*G,cy=(j+H(i,j,3))*G,r=G*0.32;q.rect(cx-r,cy-r,2*r,2*r);}
    ctx.fillStyle='#e6a0aa';ctx.fill(q);}
  for(let i=Math.floor(x0/160)-1;i<=Math.ceil(x1/160);i++)for(let j=Math.floor(y0/160)-1;j<=Math.ceil(y1/160);j++){if(H(i,j,30)>0.16)continue;const cx=(i+H(i,j,31))*160,cy=(j+H(i,j,32))*160;
    if(S>=0.45){ctx.fillStyle='#e9e0f1';ctx.beginPath();ctx.arc(cx,cy,6.5,0,6.29);ctx.fill();ctx.fillStyle='#6b3fa0';[[-2.2,-1],[0.8,-2.4],[2.4,1.2]].forEach(d=>{ctx.beginPath();ctx.arc(cx+d[0],cy+d[1],2.3,0,6.29);ctx.fill();});}
    else{ctx.fillStyle='#7b4fb0';ctx.beginPath();ctx.arc(cx,cy,Math.max(6.5,1.6/S),0,6.29);ctx.fill();}}}
function drawE(ctx,x0,x1,y0,y1,S,t,lw){ctx.fillStyle='#f3efe4';ctx.fillRect(x0,y0,x1-x0,y1-y0);const f=new Path2D();
  for(let i=Math.floor(x0/220)-1;i<=Math.ceil(x1/220);i++)for(let j=Math.floor(y0/220)-1;j<=Math.ceil(y1/220);j++)for(let m=0;m<3;m++){const cx=(i+H(i,j,m))*220,cy=(j+H(i,j,m+5))*220,a=H(i,j,m+9)*6.28,L=150+H(i,j,m+12)*250;f.moveTo(cx-Math.cos(a)*L/2,cy-Math.sin(a)*L/2);f.lineTo(cx+Math.cos(a)*L/2,cy+Math.sin(a)*L/2);}
  ctx.strokeStyle='rgba(140,128,105,0.35)';ctx.lineWidth=Math.max(6,lw);ctx.stroke(f);
  ctx.fillStyle='#1d1d1d';ctx.font='bold 1500px Georgia, "Times New Roman", serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('e',0,0);
  if(S>0.6){ctx.fillStyle='rgba(243,239,228,0.55)';const d=new Path2D();for(let i=Math.floor(x0/14);i<=Math.ceil(x1/14);i++)for(let j=Math.floor(y0/14);j<=Math.ceil(y1/14);j++){if(H(i,j,50)>0.25)continue;const cx=(i+H(i,j,51))*14,cy=(j+H(i,j,52))*14;d.moveTo(cx+2,cy);d.arc(cx,cy,2,0,6.29);}ctx.fill(d);}}
const DRAW={onion:drawOnion,cheek:drawCheek,elodea:drawElodea,blood:drawBlood,e:drawE};

const MIC={
  id:'microscope',hash:'microscope',apUnit:2,order:2,kind:'Lab skills',tab:'Virtual microscope',
  card:'Focus, change objectives and measure real cells: onion, cheek, Elodea and blood.',
  title:'Virtual microscope',
  lede:{bio:'Practice using a compound light microscope: find the specimen on low power, focus, switch to high power, and measure how big cells really are.',
        honors:'Use the field of view to estimate cell size, see why the image is flipped, and learn why you use only fine focus at high power.',
        ap:'Magnification is not resolution. Compare objectives by numerical aperture and resolution limit, and use oil immersion at 100×.'},
  scale:{bio:'You are looking through the eyepiece. At 4× the circle is 4.5 mm across, about the size of a grain of rice. At 40× it is only 0.45 mm.',
         ap:'Field of view = field number (18 mm) ÷ objective magnification. Resolution limit d = 0.61λ/NA, with λ = 0.55 µm green light.'},
  timeless:true,animated:true,chChange:1.5,chReveal:4,
  controls:[
    {id:'slide',label:'Slide',type:'select',def:'onion',lvl:'bio',options:[{v:'onion',l:'Onion skin (iodine stain)'},{v:'cheek',l:'Cheek cells (methylene blue)'},{v:'elodea',l:'Elodea leaf (living)'},{v:'blood',l:'Human blood smear (Wright stain)'},{v:'e',l:'Letter “e” from a newspaper'}]},
    {id:'obj',label:'Objective lens',type:'seg',def:4,lvl:'bio',options:[{v:4,l:'4×'},{v:10,l:'10×'},{v:40,l:'40×'},{v:100,l:'100× oil',lvl:'ap'}]},
    {id:'coarse',label:'Coarse focus',type:'range',min:0,max:100,step:1,def:49,unit:'',lvl:'bio',noTrial:true,help:'Big knob: moves the stage 20 µm per click',
     onChange(sim){if(sim.p.obj>=40)sim.st.warnAt=sim.t;}},
    {id:'fine',label:'Fine focus',type:'range',min:-25,max:25,step:0.5,def:0,unit:' µm',lvl:'bio',noTrial:true,help:'Small knob: tiny adjustments'},
    {id:'light',label:'Light (diaphragm)',type:'range',min:0,max:100,step:1,def:70,unit:'%',lvl:'bio'},
    {id:'sx',label:'Move slide left / right',type:'range',min:-2000,max:2000,step:10,def:0,unit:' µm',lvl:'bio',noTrial:true},
    {id:'sy',label:'Move slide forward / back',type:'range',min:-2000,max:2000,step:10,def:0,unit:' µm',lvl:'bio',noTrial:true},
    {id:'oil',label:'Immersion oil',help:'A drop of oil between the 100× lens and the slide',type:'toggle',def:false,lvl:'ap'}
  ],
  actions:[{id:'replace',label:'Replace cracked slide',lvl:'bio',run(sim){sim.st.crashed=false;BioLab.setValues(sim,{coarse:49,fine:0});sim.st.warnAt=-99;}}],
  init(){return {crashed:false,warnAt:-99,auto:null};},
  step(sim,dt){const s=sim.st,o=optics(sim);
    if(sim.p.obj>=40&&o.zf>o.target+400)s.crashed=true;
    if(s.auto){const upd={};let busy=false;s.auto.forEach(a=>{const cur=sim.p[a.id];if(Math.abs(cur-a.to)<1e-6)return;busy=true;const st=Math.sign(a.to-cur)*Math.min(Math.abs(a.to-cur),a.rate*dt);upd[a.id]=Math.round((cur+st)*100)/100;});
      if(busy)BioLab.setValues(sim,upd);else s.auto=null;}},
  metrics:[
    {id:'mag',label:'Total magnification',unit:'×',lvl:'bio',min:0,max:1000,d:0,get:s=>10*s.p.obj},
    {id:'fov',label:'Field of view',unit:'µm across',lvl:'bio',min:0,max:4500,d:0,get:s=>(OBJ[s.p.obj]||OBJ[4]).fov},
    {id:'across',label:'Cells across the field',unit:'',lvl:'bio',min:0,max:null,d:1,get:s=>(OBJ[s.p.obj]||OBJ[4]).fov/SLIDES[s.p.slide].len},
    {id:'focus',label:'Focus',unit:'',lvl:'bio',text:true,get:s=>{if(s.st.crashed)return 'Cracked slide!';const b=optics(s).blur;return b<1.2?'Sharp':b<4?'Slightly blurry':'Blurry';}},
    {id:'bright',label:'Brightness',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>Math.min(100,optics(s).bright*100)},
    {id:'wd',label:'Working distance',unit:'mm',lvl:'honors',min:0,max:17,d:2,get:s=>(OBJ[s.p.obj]||OBJ[4]).wd},
    {id:'res',label:'Smallest detail you can resolve',unit:'µm',lvl:'ap',min:0,max:4,d:2,get:s=>{const o=OBJ[s.p.obj]||OBJ[4];const na=s.p.obj===100&&!s.p.oil?0.95:o.na;return 0.61*0.55/na;}}
  ],
  graphs:[],defaultGraph:'fov',
  challenges:[
    {lvl:'bio',q:'You switch from the 10× to the 40× objective. What happens to the field of view (the width of the circle you see)?',
     choices:['It gets 4 times wider','It gets 4 times narrower','It stays the same'],correct:1,
     baseline:{obj:10,coarse:50},change:{obj:40},changeText:'Switched to the 40× objective',
     explain:{bio:'Magnifying 4 times more means you see a smaller piece of the slide: the field drops from 1,800 µm to 450 µm across. Each cell looks bigger, but fewer fit in the circle. Always find your target on low power first.',
              honors:'Field of view is inversely proportional to magnification: FOV = 18 mm ÷ objective. 4× the magnification means ¼ the width and 1/16 the area.'}},
    {lvl:'bio',q:'You push the slide to the right. Which way does the image of the letter “e” move?',
     choices:['To the right','To the left','It does not move'],correct:1,
     baseline:{slide:'e',obj:4},change:{sx:600},changeText:'Slide pushed 600 µm to the right',
     explain:{bio:'The lenses flip the image upside down and backward. That is why the “e” looks like “ə” rotated, and why the image moves the opposite way from the slide. With practice you move the slide the “wrong” way without thinking.'}},
    {lvl:'bio',q:'Which slide has cells with both chloroplasts and a cell wall?',
     choices:['Cheek cells','Elodea leaf','Human blood'],correct:1,instant:true,
     explain:{bio:'Elodea is a plant, so its cells have cell walls (the outlines) and chloroplasts (the green dots). Cheek and blood cells are animal cells: no walls, no chloroplasts. Onion skin cells have walls but no chloroplasts, because they grow underground.'}},
    {lvl:'honors',q:'At 10× the field of view is 1,800 µm. About 7 onion cells fit end to end across it. About how long is one onion cell?',
     choices:['About 26 µm','About 260 µm','About 2,600 µm'],correct:1,instant:true,
     explain:{honors:'Cell length ≈ field of view ÷ number of cells across = 1,800 µm ÷ 7 ≈ 260 µm, about a quarter of a millimeter. Check it: switch to Onion skin at 10× and compare with the readouts.'}},
    {lvl:'honors',q:'You are focused at 10× and switch to 40×. The image is slightly blurry. Which knob should you turn?',
     choices:['The coarse focus knob','The fine focus knob'],correct:1,
     baseline:{obj:10,coarse:50},change:{obj:40},changeText:'Switched to 40×. Try the fine focus knob',
     explain:{honors:'The objectives are parfocal: switching keeps the image nearly in focus. At 40× the depth of focus is only about 1.5 µm, but one click of the coarse knob moves the stage 20 µm. Only the fine knob can make that small an adjustment.'}},
    {lvl:'honors',q:'At 40× you crank the coarse focus knob from 50 up to 75. What happens?',
     choices:['The image gets sharper','The stage rises into the objective and cracks the slide'],correct:1,
     baseline:{obj:40,coarse:50,fine:10},change:{coarse:75},changeText:'Coarse focus turned up to 75',
     explain:{honors:'The 40× objective sits only 0.6 mm above the slide (its working distance). The coarse knob raises the stage 0.5 mm here, so the slide hits the lens. This is how real slides and lenses get broken.'}},
    {lvl:'ap',q:'At 100× the blood cells look dim and fuzzy even when focused. You add a drop of immersion oil. What happens?',
     choices:['The image gets sharper and brighter','Nothing; the oil only protects the lens','The image gets darker'],correct:0,
     baseline:{slide:'blood',obj:100,coarse:50,fine:15,oil:false,light:95},change:{oil:true},changeText:'Immersion oil added',
     explain:{ap:'Light bends as it leaves the glass slide into air, so the widest-angle rays miss the lens. Oil has the same refractive index as glass (about 1.52), so those rays get in. The numerical aperture rises to 1.25, giving a brighter image and a resolution limit near 0.27 µm.'}},
    {lvl:'ap',q:'The 100× oil lens magnifies 2.5 times more than the 40×. Why do you also see real new detail, rather than just a bigger blur?',
     choices:['Its higher numerical aperture improves resolution','More magnification always reveals more detail','The light is brighter at 100×'],correct:0,instant:true,
     explain:{ap:'Resolution depends on numerical aperture, not magnification: d = 0.61λ/NA. The 40× (NA 0.65) resolves about 0.52 µm; the 100× oil (NA 1.25) about 0.27 µm. Magnifying past what the optics can resolve is “empty magnification”: bigger, but no new detail.'}}
  ],
  narrate(sim){const p=sim.p,s=sim.st,o=optics(sim),sl=SLIDES[p.slide],mag=10*p.obj;
    if(s.crashed)return '<b>Cracked slide!</b> At '+p.obj+'× the objective sits only '+o.o.wd+' mm above the slide, and the coarse knob raised the stage into it. Press “Replace cracked slide”, and use only fine focus at high power.';
    if(p.obj>=40&&sim.t-s.warnAt<4)return '<b>Careful:</b> at '+p.obj+'× use only the fine focus knob. One click of coarse focus moves the stage 20 µm, more than 10 times the depth of focus.';
    if(o.noOil)return '<b>No immersion oil.</b> At 100× light bends away as it leaves the glass into air, so the image is dim and fuzzy. Add a drop of immersion oil.';
    if(o.blur>4)return '<b>Out of focus.</b> '+(p.obj<=10?'Turn the coarse focus knob slowly until the image sharpens.':'Turn only the fine focus knob to sharpen the image.');
    if(o.bright<0.3)return '<b>Too dark.</b> Turn up the light or open the diaphragm. Higher-power objectives always need more light.';
    if(p.slide==='e')return 'The letter looks <b>upside down and backward</b>: the lenses flip the image. Move the slide and the image moves the opposite way.';
    const n=o.fov/sl.len;
    if(p.slide==='elodea'&&p.obj>=40)return 'Watch the green chloroplasts circle around each cell. This <b>cytoplasmic streaming</b> only happens in living cells. Each cell is about '+sl.len+' µm long.';
    if(p.slide==='blood'&&p.obj<40)return 'At '+mag+'× the red blood cells are too small to see one by one (each is only 7.5 µm). Switch to 40× to see them. The purple dots are white blood cells.';
    return 'You are looking at '+sl.name+' at <b>'+mag+'× total</b>. The field is '+fmtInt(o.fov)+' µm across, about '+(n<10?n.toFixed(1):Math.round(n))+' cells wide, so each '+sl.unit+' is about '+sl.len+' µm long.';},
  tour:[
    {title:'Parts of the microscope',text:'Light from the bulb shines up through the slide. The objective lens just above the slide magnifies the image, and the eyepiece magnifies it again, 10×.',focus:[478,0,322,450],pause:true},
    {title:'Start on low power',text:'Always begin with the 4× objective, because its wide field makes the specimen easy to find. Watch the coarse knob bring the cells into focus.',focus:[[50,20,410,410],[730,270,60,60]],speed:1,setup(sim){BioLab.setValues(sim,{obj:4,coarse:42,fine:0});sim.st.auto=[{id:'coarse',to:50,rate:3}];}},
    {title:'Center your target',text:'Move the slide to put the area you want in the middle. The image moves the opposite way, because the lenses flip it upside down and backward.',focus:[50,20,410,410],speed:1,setup(sim){BioLab.setValues(sim,{coarse:50});sim.st.auto=[{id:'sx',to:-400,rate:200}];}},
    {title:'Switch to high power',text:'Turn the nosepiece to 40×. The image stays almost in focus (the objectives are parfocal), but you now see a circle only 450 µm across, magnified 400×.',focus:[[50,20,410,410],[620,140,100,115]],speed:1,setup(sim){sim.st.auto=null;BioLab.setValues(sim,{sx:-400,obj:40});}},
    {title:'Fine focus only',text:'At high power, use only the small fine focus knob. One click of the coarse knob moves the stage more than 10 times the depth of focus and could crack the slide.',focus:[[50,20,410,410],[738,328,44,44]],speed:1,setup(sim){sim.st.auto=[{id:'fine',to:10,rate:3}];}},
    {title:'Add light',text:'A higher-power lens collects light from a smaller area, so the image gets darker. Open the diaphragm to brighten it.',focus:[[50,20,410,410],[640,370,60,40]],speed:1,setup(sim){BioLab.setValues(sim,{fine:10,light:30});sim.st.auto=[{id:'light',to:90,rate:20}];}},
    {lvl:'honors',title:'Look for signs of life',text:'This is a living Elodea leaf at 400×. The green chloroplasts circle around the edge of each cell. This cytoplasmic streaming only happens in living cells.',focus:[50,20,410,410],speed:1,setup(sim){sim.st.auto=null;BioLab.setValues(sim,{slide:'elodea',obj:40,coarse:50,fine:10,light:85,sx:0});}},
    {lvl:'ap',title:'Oil immersion',text:'At 100×, a drop of immersion oil fills the gap between lens and slide, so wide-angle light is not lost. With a numerical aperture of 1.25 you can resolve details about 0.27 µm apart, like the lobed nuclei of white blood cells.',focus:[50,20,410,410],speed:1,setup(sim){sim.st.auto=null;BioLab.setValues(sim,{slide:'blood',obj:100,oil:true,coarse:50,fine:15,light:95,sx:-370,sy:-150});}}
  ],
  onTourExit(sim){sim.st.auto=null;},
  lab:{bio:'<p><b>Question:</b> Which cells are biggest: onion, cheek, Elodea or blood?</p><ol><li>For each slide: start at 4×, focus with coarse focus, then switch to 40× and focus with fine focus only.</li><li>Record a trial. It saves the field of view and how many cells fit across it.</li><li>Calculate cell length = field of view ÷ cells across.</li></ol><p>Rank the four cell types by size, and give one reason the biggest cells might be so big.</p>',
       honors:'<p><b>Question:</b> How does magnification affect the field of view?</p><ol><li>On any slide, record a trial at each objective (4×, 10×, 40×).</li><li>On the Trials graph, plot total magnification (x) against field of view (y).</li><li>Predict the field of view at 1,000×, then check it with the AP level.</li></ol><p>Describe the relationship in words and as an equation.</p>',
       ap:'<p><b>Question:</b> Is more magnification always better?</p><ol><li>Record a trial at every objective, including 100× with and without immersion oil.</li><li>Plot total magnification (x) against smallest resolvable detail (y).</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why resolution, not magnification, limits what you can see, and why 1000× is about the useful limit of a light microscope.</p>'},
  terms:[{t:'Eyepiece (ocular)',d:'The lens you look through. It magnifies 10×.'},{t:'Objective',d:'The lens just above the slide: 4×, 10× or 40× (100× with oil).'},{t:'Total magnification',d:'Eyepiece × objective, e.g. 10 × 40 = 400×.'},{t:'Field of view',d:'The width of the circle you see. It shrinks as magnification grows.'},{t:'Coarse / fine focus',d:'Knobs that move the stage a lot or a little.'},
    {lvl:'honors',t:'Parfocal',d:'Objectives stay nearly in focus when you switch between them.'},{lvl:'honors',t:'Working distance',d:'The gap between the objective and the slide. Only 0.6 mm at 40×.'},{lvl:'honors',t:'Diaphragm',d:'Controls how much light reaches the slide.'},
    {lvl:'ap',t:'Resolution',d:'The smallest distance between two points that you can still see as separate.'},{lvl:'ap',t:'Numerical aperture (NA)',d:'How wide a cone of light the objective collects. Higher NA gives better resolution.'},{lvl:'ap',t:'Immersion oil',d:'Oil matched to glass, so the 100× lens collects more light.'}],
  about:'<p>Field of view = 18 mm ÷ objective (field number 18 with a 10× eyepiece). Specimens are drawn at real size: onion cells about 250 × 60 µm, cheek cells about 60 µm, Elodea cells about 75 × 28 µm with 5 µm chloroplasts streaming at 6 µm/s, and red blood cells 7.5 µm. The image is drawn rotated 180°, as a compound microscope shows it.</p><p>Focus: the coarse knob moves the stage 20 µm per click, and fine focus moves it up to ±25 µm. Objectives are parfocal, within 4–15 µm of each other. Depth of field is about 50, 8, 1.5 and 0.6 µm, and blur grows with distance from the focal plane. The slide cracks if the stage rises more than 0.4 mm past focus at 40× or 100×.</p><p>Resolution = 0.61 × 0.55 µm ÷ NA, with NA 0.10, 0.25, 0.65 and 1.25 (0.95 at 100× without oil). Brightness falls with magnification. Simplification: real slides vary much more, and phase effects and staining artifacts are ignored.</p>',
  onClick(sim,x,y){if(x>615&&x<725&&y>140&&y<260){const list=[4,10,40].concat(atLeast('ap')?[100]:[]);const i=list.indexOf(sim.p.obj);BioLab.setValues(sim,{obj:list[(i+1)%list.length]});}},
  initVis(sim){sim.vis.oc=null;},
  draw(sim,ctx,vdt,k,t){
    const p=sim.p,s=sim.st,v=sim.vis,o=optics(sim),S=o.S,hon=atLeast('honors');
    ctx.fillStyle=PAL['card'];ctx.fillRect(0,0,800,450);
    // ---- eyepiece view
    ctx.fillStyle='#0d0d10';ctx.beginPath();ctx.arc(VX,VY,VR+12,0,6.29);ctx.fill();
    const sc=ctx.getTransform().a||1,N=Math.max(50,Math.ceil(400*sc));
    if(!v.oc)v.oc=document.createElement('canvas');if(v.oc.width!==N){v.oc.width=N;v.oc.height=N;}
    const oc=v.oc.getContext('2d');oc.setTransform(1,0,0,1,0,0);oc.clearRect(0,0,N,N);oc.setTransform(N/400,0,0,N/400,0,0);
    oc.save();oc.translate(200,200);oc.scale(-S,-S);oc.translate(p.sx,p.sy);const lw=1/S,hw=200/S;
    DRAW[p.slide](oc,-p.sx-hw,-p.sx+hw,-p.sy-hw,-p.sy+hw,S,t,lw);oc.restore();
    ctx.save();ctx.beginPath();ctx.arc(VX,VY,VR,0,6.29);ctx.clip();
    const canFilter='filter' in ctx;if(canFilter&&o.blur>0.3)ctx.filter='blur('+(o.blur*sc).toFixed(2)+'px)';
    ctx.drawImage(v.oc,VX-200,VY-200,400,400);ctx.filter='none';
    if(!canFilter&&o.blur>0.3){ctx.fillStyle='rgba(235,235,235,'+clamp(o.blur/16,0,.8)+')';ctx.fillRect(VX-200,VY-200,400,400);}
    const b=o.bright;if(b<1){ctx.fillStyle='rgba(0,0,0,'+clamp(1-b*1.6,0,0.93)+')';ctx.fillRect(VX-200,VY-200,400,400);}
    if(b>0.9){ctx.fillStyle='rgba(255,255,255,'+clamp((b-0.9)*1.5,0,.3)+')';ctx.fillRect(VX-200,VY-200,400,400);}
    const g=ctx.createRadialGradient(VX,VY,VR*0.72,VX,VY,VR);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,0.45)');ctx.fillStyle=g;ctx.fillRect(VX-200,VY-200,400,400);
    if(s.crashed){ctx.strokeStyle='rgba(255,255,255,0.9)';ctx.lineWidth=2.5;const cx=VX+30,cy=VY-20;ctx.beginPath();
      for(let i=0;i<7;i++){let x=cx,y=cy,a=i/7*6.283+0.3;ctx.moveTo(x,y);for(let m=0;m<6;m++){a+=Math.sin(i*3.1+m*1.7)*0.5;x+=Math.cos(a)*34;y+=Math.sin(a)*34;ctx.lineTo(x,y);}}ctx.stroke();}
    // scale bar
    let L=niceStep(o.fov/4,1);if(L*S>160)L/=2;const bpx=L*S;ctx.fillStyle='#fff';ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.fillRect(VX-bpx/2,VY+150,bpx,5);ctx.strokeRect(VX-bpx/2,VY+150,bpx,5);
    ctx.restore();
    txt(ctx,(L>=1000?(L/1000)+' mm':L+' µm'),VX,VY+172,{s:12*k,w:700,c:'#fff',a:'center'});
    if(s.crashed)pill(ctx,'Cracked slide!',VX,VY-150,'#c62828','#fff',14*k);
    txt(ctx,p.obj+'× objective',12,24,{s:14*k,w:700});txt(ctx,(10*p.obj)+'× total',12,44,{s:13*k,c:PAL['cv-soft']});
    txt(ctx,'Field of view',12,416,{s:12*k,c:PAL['cv-soft']});txt(ctx,fmtInt(o.fov)+' µm',12,438,{s:14*k,w:700});
    // ---- microscope diagram
    const C=670,metal='#5a616d',dark='#30353d';
    const yst=clamp(262-(o.zf-1000)*0.06,205,332),ol=o.o.len;
    ctx.fillStyle=metal;rr(ctx,575,404,205,24,6);ctx.fill();
    ctx.strokeStyle=metal;ctx.lineWidth=22;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(762,404);ctx.lineTo(762,150);ctx.quadraticCurveTo(762,88,705,72);ctx.stroke();ctx.lineCap='butt';
    ctx.fillStyle=metal;rr(ctx,635,52,85,40,10);ctx.fill();ctx.fillStyle=dark;rr(ctx,655,10,30,46,6);ctx.fill();ctx.fillStyle='#8fb7c9';ctx.beginPath();ctx.ellipse(670,11,13,3.5,0,0,6.29);ctx.fill();
    ctx.fillStyle=metal;ctx.fillRect(658,90,24,60);ctx.fillStyle=dark;ctx.beginPath();ctx.ellipse(C,156,44,13,0,0,6.29);ctx.fill();
    const objs=[4,10,40].concat(atLeast('ap')?[100]:[]),others=objs.filter(x=>x!==p.obj);
    others.forEach((ob,i)=>{const a=(i%2?1:-1)*(0.55+Math.floor(i/2)*0.35);ctx.save();ctx.translate(C,162);ctx.rotate(a);ctx.globalAlpha=.55;ctx.fillStyle='#9aa1ad';rr(ctx,-8,0,16,OBJ[ob].len-8,4);ctx.fill();ctx.fillStyle=OBJ[ob].band;ctx.fillRect(-8,OBJ[ob].len-20,16,4);ctx.restore();});
    ctx.globalAlpha=1;ctx.fillStyle='#b9bfc9';rr(ctx,C-10,164,20,ol,4);ctx.fill();ctx.fillStyle=o.o.band;ctx.fillRect(C-10,164+ol-14,20,5);ctx.strokeStyle=dark;ctx.lineWidth=1.2;rr(ctx,C-10,164,20,ol,4);ctx.stroke();
    if(p.oil&&p.obj===100){ctx.fillStyle='rgba(230,200,90,0.8)';ctx.beginPath();ctx.ellipse(C,164+ol+2,8,4,0,0,6.29);ctx.fill();}
    const bl=p.light/100;ctx.fillStyle='rgba(255,220,110,'+(0.08+bl*0.35)+')';ctx.fillRect(C-6,yst+12,12,392-(yst+12));
    ctx.fillStyle=dark;ctx.fillRect(C-14,yst+12,28,10);
    ctx.fillStyle='rgba(255,214,90,'+(0.3+bl*0.7)+')';ctx.beginPath();ctx.arc(C,392,10,0,6.29);ctx.fill();ctx.strokeStyle=dark;ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=dark;rr(ctx,600,yst,150,12,3);ctx.fill();ctx.fillRect(744,yst-6,18,26);
    ctx.fillStyle=s.crashed?'#e8a0a0':'#cfe6ee';ctx.fillRect(630+clamp(-p.sx/100,-20,20),yst-4,80,4);
    if(s.crashed){ctx.strokeStyle='#c62828';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(655,yst-8);ctx.lineTo(685,yst+2);ctx.moveTo(685,yst-8);ctx.lineTo(655,yst+2);ctx.stroke();}
    const knob=(x,y,r,rot)=>{ctx.fillStyle=dark;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();ctx.strokeStyle='#9aa1ad';ctx.lineWidth=2;for(let i=0;i<8;i++){const a=rot+i*Math.PI/4;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r*.45,y+Math.sin(a)*r*.45);ctx.lineTo(x+Math.cos(a)*r*.9,y+Math.sin(a)*r*.9);ctx.stroke();}};
    knob(762,300,21,p.coarse*0.25);knob(762,350,12,p.fine*0.4);
    // labels with leader lines
    const lab=(s_,x,y,tx,ty)=>{ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+ctx.measureText(s_).width+6,y-4);ctx.lineTo(tx,ty);ctx.stroke();};
    ctx.font='600 '+12*k+'px '+FONT;
    [['Eyepiece (10×)',486,34,654,32],['Objective',486,212,C-11,200],['Stage',486,yst+10,599,yst+6],['Light',486,396,C-11,392]].forEach(q=>{txt(ctx,q[0],q[1],q[2],{s:12*k,w:600,c:PAL['cv-soft']});ctx.font='600 '+12*k+'px '+FONT;lab(q[0],q[1],q[2],q[3],q[4]);});
    txt(ctx,'Coarse',736,286,{s:11.5*k,w:600,c:PAL['cv-soft'],a:'right'});txt(ctx,'Fine',746,354,{s:11.5*k,w:600,c:PAL['cv-soft'],a:'right'});
  }
};
BioLab.register(MIC);
})();
