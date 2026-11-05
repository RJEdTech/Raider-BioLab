(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;

/* ---------- Data ---------- */
const LH=620;
/* T = two-point threshold in mm (Weinstein 1968 style values). dist = nerve path to the cortex in meters for a 1.7 m adult. */
const SITES={
  fingertip:{n:'Fingertip',T:3,glab:true,thick:true,dist:1.0,area:'hand',lm:'finger',view:'front'},
  lip:{n:'Lip',T:5,glab:true,thick:false,dist:0.15,area:'lips',lm:'mouth',view:'front',cranial:true},
  palm:{n:'Palm',T:10,glab:true,thick:true,dist:0.9,area:'hand',lm:'palm',view:'front'},
  handback:{n:'Back of hand',T:30,glab:false,thick:false,dist:0.9,area:'hand',lm:'palm',view:'back'},
  forearm:{n:'Forearm',T:38,glab:false,thick:false,dist:0.7,area:'arm',lm:'forearm',view:'front'},
  neck:{n:'Back of neck',T:40,glab:false,thick:false,dist:0.25,area:'neck',lm:'neck',view:'back'},
  sole:{n:'Sole of foot',T:22,glab:true,thick:true,dist:1.7,area:'foot',lm:'foot',view:'back'},
  calf:{n:'Back of calf',T:45,glab:false,thick:false,dist:1.4,area:'leg',lm:'calf',view:'back'}};
const REC={
  meissner:{n:'Meissner’s corpuscle',sh:'Meissner’s',ad:'fast',fib:'Aβ',v:50},
  merkel:{n:'Merkel cell',sh:'Merkel cell',ad:'slow',fib:'Aβ',v:50},
  pacinian:{n:'Pacinian corpuscle',sh:'Pacinian',ad:'fast',fib:'Aβ',v:50},
  hair:{n:'Hair follicle receptor',sh:'Hair follicle',ad:'fast',fib:'Aβ',v:50},
  ruffini:{n:'Ruffini ending',sh:'Ruffini',ad:'slow',fib:'Aβ',v:50,lvl:'ap'},
  heat:{n:'Free nerve ending (heat)',sh:'Free nerve: heat',ad:'partial',fib:'C',v:1},
  cold:{n:'Free nerve ending (cold)',sh:'Free nerve: cold',ad:'partial',fib:'Aδ',v:15},
  noci:{n:'Free nerve ending (pain)',sh:'Free nerve: pain',ad:'very slow',fib:'Aδ',v:15}};
/* [peak, sustained, adaptation time constant s, off-burst, off time constant s, threshold % of the strength slider] */
const RESP={
  touch:{meissner:[60,0,.15,30,.1,5],merkel:[50,12,1.5,0,0,8],hair:[70,0,.2,35,.1,5]},
  press:{pacinian:[200,0,.02,120,.02,10],merkel:[90,30,2,0,0,8],meissner:[80,0,.15,40,.1,5],hair:[70,0,.2,35,.1,5],ruffini:[30,20,3,0,0,15]},
  vib:{pacinian:{c:250,w:.6},meissner:{c:30,w:.45},hair:{c:30,w:.45},merkel:{c:8,w:.5}},
  heat:{heat:[40,12,6,0,0,8],noci:[45,30,20,0,0,79]},
  cold:{cold:[50,15,6,0,0,8],noci:[45,30,20,0,0,72]},
  pain:{noci:[45,30,20,0,0,10]}};
const STIM={touch:'Light touch',press:'Deep pressure',vib:'Vibration',heat:'Heat',cold:'Cold',pain:'Pain'};
const heatC=S=>34+S*0.14,coldC=S=>33-S*0.25;
const presentAt=(rid,site)=>{const S=SITES[site];if(rid==='meissner')return S.glab;if(rid==='hair')return !S.glab;return true;};
const shown=rid=>atLeast(REC[rid].lvl);
function tune(T,f){const x=Math.log10(f/T.c)/T.w;return Math.exp(-x*x);}
function vibRate(T,f,S){const g=clamp(S/100,0,1)*tune(T,f);return g<.1?0:f*clamp(g*1.5,0,1);}
function gain(T,S){return clamp((S-T[5])/(100-T[5]),0,1);}
/* the firing rate one receptor would have at its first instant */
function peakOf(p,rid){const T=RESP[p.stim][rid];if(!T||!presentAt(rid,p.site)||!shown(rid))return 0;return p.stim==='vib'?vibRate(T,p.f,p.S):T[0]*gain(T,p.S);}
function listFor(p){return Object.keys(RESP[p.stim]).filter(r=>presentAt(r,p.site)&&shown(r));}
function mainRec(p){let best=null,v=0;listFor(p).forEach(r=>{const q=peakOf(p,r);if(q>v){v=q;best=r;}});return best;}
function rateOf(sim,rid){const p=sim.p,s=sim.st,T=RESP[p.stim][rid];if(!T||!presentAt(rid,p.site))return 0;
  if(s.on){const a=sim.t-s.t0;if(a<0)return 0;if(p.stim==='vib')return vibRate(T,p.f,p.S);const g=gain(T,p.S);return g*(T[1]+(T[0]-T[1])*Math.exp(-a/T[2]));}
  if(p.stim==='vib'||!T[3]||s.tOff===null)return 0;const a=sim.t-s.tOff;if(a<0||a>2)return 0;return gain(T,p.S)*T[3]*Math.exp(-a/T[4]);}
function restart(sim){const s=sim.st;if(!s||s.B)return;if(s.on)s.onLog.push({a:s.t0,b:sim.t});s.on=true;s.t0=sim.t;s.tOff=null;}
function travelMs(p){const m=mainRec(p);if(!m)return 0;return SITES[p.site].dist/REC[m].v*1000;}

/* ---------- Theme-aware tissue colors ---------- */
function isDark(){const c=PAL['card']||'#fff',m=/^#(..)(..)(..)/.exec(c);if(!m)return false;return (parseInt(m[1],16)+parseInt(m[2],16)+parseInt(m[3],16))/3<110;}
const TL={corn:'#dcc0a2',epi:'#efd5bd',lower:'#e6c3a6',pap:'#f8e2dc',ret:'#f1cec8',hypo:'#f8edc3',fat:'#f4dd86',fats:'#d6b952',nerve:'#c99500',art:'#c8342f',vein:'#3a66b8',hair:'#3a2a20',foll:'#d2ad8c',seb:'#ecd97c',sebs:'#b09a3a',sweat:'#6fb0d6',sweats:'#3f7ea4',musc:'#b4534e',skin:'#e9c5a6',skins:'#c79b78',card:'#fbf6e6',cards:'#a89a70'};
const TD={corn:'#8d7560',epi:'#7f6553',lower:'#6d5444',pap:'#513a3e',ret:'#452f34',hypo:'#4c4329',fat:'#6e5f2d',fats:'#8e7d3e',nerve:'#f2c84c',art:'#e8635b',vein:'#7ba1e8',hair:'#d4c0aa',foll:'#8d7560',seb:'#b6a54a',sebs:'#d8c868',sweat:'#5c9cc4',sweats:'#8cc4e4',musc:'#d0706a',skin:'#a9836a',skins:'#c9a488',card:'#3a3628',cards:'#8d8260'};
const tc=()=>isDark()?TD:TL;

/* ---------- Text helpers ---------- */
function wrapLines(ctx,s,maxW,size,w){ctx.font=(w||400)+' '+size+'px '+FONT;const out=[];String(s).split('\n').forEach(par=>{let line='';par.split(' ').forEach(wd=>{const t=line?line+' '+wd:wd;if(ctx.measureText(t).width>maxW&&line){out.push(line);line=wd;}else line=t;});out.push(line);});return out;}
function wrapTxt(ctx,s,x,y,maxW,o){o=o||{};const size=o.s||13,lh=o.lh||size*1.25,L=wrapLines(ctx,s,maxW,size,o.w);L.forEach((l,i)=>txt(ctx,l,x,y+i*lh,{s:size,w:o.w,c:o.c,a:o.a}));return y+L.length*lh;}
function lcd(ctx,x,y,w,h,label,value,k){ctx.fillStyle='#1b2a22';rr(ctx,x,y,w,h,8);ctx.fill();txt(ctx,label,x+10,y+6+12*k,{s:12*k,c:'#9fd8b4',w:600});txt(ctx,value,x+w-12,y+h-10,{s:30*Math.min(k,1.5),w:700,c:'#6ff09e',a:'right'});}

/* ---------- Structures and the explorer's info ---------- */
const PARTS=[
 {id:'epidermis',n:'Epidermis',l:'Top layer of the skin',d:'Epithelial tissue with no blood vessels of its own (avascular). It gets nutrients from the capillaries just below. It has 5 strata, and it is thickest on the palms and soles.'},
 {id:'dermis',n:'Dermis',l:'Middle layer of the skin',d:'Connective tissue that holds the blood vessels, nerves, glands, hair follicles and most touch receptors. Its top fifth is the papillary layer and its bottom four-fifths is the reticular layer.'},
 {id:'hypodermis',n:'Hypodermis',l:'Under the skin, not part of it',d:'Also called the subcutaneous layer. It is mostly adipose (fat) tissue that insulates, stores energy and anchors the skin to the muscle below.'},
 {id:'corneum',n:'Stratum corneum',l:'Epidermis, top',d:'Many layers of dead, flat cells packed with keratin. They form the waterproof, tough surface and flake off constantly.'},
 {id:'lucidum',n:'Stratum lucidum',l:'Epidermis, thick skin only',d:'A thin clear band of dead cells. You only find it in thick skin: palms, fingertips and soles.'},
 {id:'granulosum',n:'Stratum granulosum',l:'Epidermis',d:'Keratinocytes fill with granules and start to flatten and die here, far from the blood supply.'},
 {id:'spinosum',n:'Stratum spinosum',l:'Epidermis',d:'Several layers of keratinocytes joined by strong connections that look spiny under a microscope.'},
 {id:'basale',n:'Stratum basale',l:'Epidermis, bottom',d:'One row of cells sitting on the dermis. Its cells divide constantly and push new keratinocytes upward. Melanocytes and Merkel cells sit here too.'},
 {id:'keratinocyte',n:'Keratinocyte',l:'Epidermis, about 90% of its cells',d:'Makes keratin. Each one starts in the stratum basale and is pushed upward until it flakes off. You get a whole new epidermis every 25 to 45 days.'},
 {id:'melanocyte',n:'Melanocyte',l:'Stratum basale',d:'Makes the pigment melanin and hands it to nearby keratinocytes, where it shields their DNA from UV light.'},
 {id:'langerhans',n:'Langerhans cell',l:'Epidermis, mostly stratum spinosum',lvl:'honors',d:'An immune cell. It catches invaders that get through the surface and shows them to the immune system.'},
 {id:'merkel',n:'Merkel cell',l:'Stratum basale',d:'Works with a nerve ending to sense light touch. It adapts slowly, so it keeps firing while the touch lasts and tells you about shape and edges.'},
 {id:'papillary',n:'Papillary layer',l:'Dermis, top 1/5',lvl:'honors',d:'Loose connective tissue with capillary loops, Meissner’s corpuscles and free nerve endings. It bulges up into the epidermis as dermal papillae.'},
 {id:'reticular',n:'Reticular layer',l:'Dermis, bottom 4/5',lvl:'honors',d:'Dense connective tissue full of collagen and elastic fibers. It gives skin its strength and stretch, and it holds the glands and follicles.'},
 {id:'papillae',n:'Dermal papillae',l:'Top of the dermis',lvl:'honors',d:'Bumps of dermis that push up into the epidermis. On fingertips they form the ridges that make your fingerprints.'},
 {id:'meissner',n:'Meissner’s corpuscle',l:'Dermal papilla',d:'Senses light touch. It adapts fast: it fires when a touch starts and stops, then goes quiet. Most sit in hairless skin such as fingertips, palms, lips and soles.'},
 {id:'caploop',n:'Capillary loop',l:'Dermal papilla',d:'A tiny hairpin of blood vessel that feeds the epidermis by diffusion. It also opens up to shed heat when you are hot.'},
 {id:'fne',n:'Free nerve endings',l:'Dermis, reaching into the epidermis',d:'Bare nerve branches with no capsule. They sense pain, heat, cold, itch and tickle.'},
 {id:'hair',n:'Hair follicle',l:'Dermis',d:'The tube that grows a hair. Nerve fibers wrap its base and fire when the hair bends. They adapt fast. Palms, fingertips and soles have no hair follicles.'},
 {id:'arrector',n:'Arrector pili',l:'Dermis',d:'A tiny smooth muscle attached to a hair follicle. When it contracts, the hair stands up and you get goosebumps.'},
 {id:'sebaceous',n:'Sebaceous gland',l:'Dermis',d:'Releases oil (sebum) into the hair follicle, which keeps skin and hair soft and slows water loss.'},
 {id:'sweat',n:'Sudoriferous gland',l:'Dermis',d:'A sweat gland. It sends sweat up a duct to a pore on the surface, and the evaporating sweat cools you.'},
 {id:'pacinian',n:'Pacinian corpuscle',l:'Deep dermis',d:'Layered like an onion. It senses deep pressure and vibration and adapts very fast, so it fires as pressure starts and stops, and follows fast vibration.'},
 {id:'ruffini',n:'Ruffini ending',l:'Dermis',lvl:'ap',d:'A spindle-shaped ending that senses skin stretch and steady deep pressure. It adapts slowly.'}];
const partBy=id=>PARTS.find(x=>x.id===id);
const SEC={x:10,y:10,w:505,h:600},SEC2={x:10,y:10,w:380,h:450},ZOOM={x:525,y:10,w:265,h:470};
function geom(R){const air=R.h*.085,ys=R.y+air,hh=R.h-air,y1=ys+.1*hh,y2=ys+.74*hh,pap=y1+(y2-y1)/5,tr=y2-.035*hh,per=R.w/6,a=.024*hh;
  const X=f=>R.x+f*R.w,ridge=x=>y1+a*Math.sin(2*Math.PI*(x-R.x)/per);
  return {R,air,ys,hh,y1,y2,pap,tr,X,ridge,a,
    at:{hair:[X(.3),y1+(y2-y1)*.72],arrector:[X(.37),y1+(y2-y1)*.47],sebaceous:[X(.345),y1+(y2-y1)*.28],merkel:[X(.208),ridge(X(.208))-4],meissner:[X(.625),ridge(X(.625))+16],
      caploop:[X(.458),ridge(X(.458))+16],fne:[X(.875),y1-4],sweat:[X(.53),y1+(y2-y1)*.66],pacinian:[X(.8),y2+.035*hh],ruffini:[X(.14),y1+(y2-y1)*.56],
      papillae:[X(.125),ridge(X(.125))+6]}};}
function layerAt(g,x,y){if(y<g.ys)return null;const r=g.ridge(x);if(y<r)return 'epidermis';if(y<g.y2){if(atLeast('honors'))return y<g.pap?'papillary':'reticular';return 'dermis';}return 'hypodermis';}

/* ---------- Drawing the cross-section ---------- */
function drawSkinBlock(sim,ctx,R,o,k,t){const g=geom(R),C=tc(),X=g.X,comp=o.composite,site=SITES[sim.p.site],hairOK=comp||!site.glab,meisOK=comp||site.glab,thick=comp?true:site.thick;
  ctx.save();rr(ctx,R.x,R.y,R.w,R.h,10);ctx.clip();ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(R.x,R.y,R.w,R.h);
  // hypodermis and fat
  ctx.fillStyle=C.hypo;ctx.fillRect(R.x,g.y2,R.w,R.y+R.h-g.y2);
  const v=sim.vis;if(!v.fat){const q=rng(7);v.fat=[];for(let i=0;i<70;i++)v.fat.push([q(),q(),.028+q()*.018]);}
  v.fat.forEach(f=>{const y=g.y2+6+f[1]*(R.y+R.h-g.y2-8),x=R.x+f[0]*R.w,r=f[2]*R.h*.62;ctx.fillStyle=C.fat;ctx.strokeStyle=C.fats;ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fill();ctx.stroke();});
  // dermis, papillary and reticular
  ctx.fillStyle=C.ret;ctx.fillRect(R.x,g.y1-g.a,R.w,g.y2-g.y1+g.a);
  ctx.fillStyle=C.pap;ctx.fillRect(R.x,g.y1-g.a,R.w,g.pap-g.y1+g.a);
  ctx.strokeStyle=C.cards;ctx.setLineDash([5,5]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(R.x,g.pap);ctx.lineTo(R.x+R.w,g.pap);ctx.stroke();ctx.setLineDash([]);
  // epidermis with a wavy lower edge (dermal papillae)
  const rid=()=>{ctx.beginPath();ctx.moveTo(R.x,g.ys);ctx.lineTo(R.x+R.w,g.ys);for(let x=R.x+R.w;x>=R.x-2;x-=4)ctx.lineTo(x,g.ridge(x));ctx.closePath();};
  rid();ctx.fillStyle=C.epi;ctx.fill();
  ctx.fillStyle=C.corn;ctx.fillRect(R.x,g.ys,R.w,(g.y1-g.ys)*.34);
  ctx.save();rid();ctx.clip();ctx.strokeStyle=C.lower;ctx.lineWidth=3;ctx.beginPath();for(let x=R.x;x<=R.x+R.w;x+=4){const y=g.ridge(x)-2;x===R.x?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();ctx.restore();
  // blood vessels: a plexus at the bottom of the dermis with branches to the loops
  const vy=g.y2+.012*g.hh;ctx.lineCap='round';ctx.strokeStyle=C.art;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(R.x,vy);ctx.lineTo(R.x+R.w,vy);ctx.stroke();ctx.strokeStyle=C.vein;ctx.beginPath();ctx.moveTo(R.x,vy+8);ctx.lineTo(R.x+R.w,vy+8);ctx.stroke();
  [.125,.458,.958].forEach(f=>{const x=X(f),top=g.ridge(x)+7;ctx.lineWidth=2.4;ctx.strokeStyle=C.art;ctx.beginPath();ctx.moveTo(x-4,vy);ctx.lineTo(x-4,top+4);ctx.arc(x,top+4,4,Math.PI,0);ctx.strokeStyle=C.art;ctx.stroke();ctx.strokeStyle=C.vein;ctx.beginPath();ctx.moveTo(x+4,top+4);ctx.lineTo(x+4,vy+8);ctx.stroke();});
  // sweat gland and duct
  {const sx=X(.53),sy=g.at.sweat[1];ctx.strokeStyle=C.sweats;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx,sy-12);for(let y=sy-12;y>g.ys;y-=2){ctx.lineTo(sx+3*Math.sin(y*.3),y);}ctx.stroke();
    ctx.fillStyle=C.sweat;ctx.strokeStyle=C.sweats;ctx.lineWidth=1.5;[[-9,0],[0,-5],[9,0],[-5,8],[5,8]].forEach(q=>{ctx.beginPath();ctx.arc(sx+q[0],sy+q[1],7,0,6.2832);ctx.fill();ctx.stroke();});}
  // nerve trunk and receptor branches
  const act=o.act||{},glow=(id)=>act[id]||0;
  ctx.strokeStyle=C.nerve;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(X(.08),g.tr);ctx.lineTo(R.x+R.w,g.tr);ctx.stroke();ctx.lineWidth=1.8;
  const branch=(x,y,xb)=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xb===undefined?x:xb,g.tr);ctx.stroke();};
  branch(X(.208),g.ridge(X(.208))+2);if(meisOK)branch(X(.625),g.ridge(X(.625))+26);branch(X(.875),g.ridge(X(.875)));
  if(atLeast('ap')||comp&&atLeast('ap'))branch(g.at.ruffini[0],g.at.ruffini[1]+12);
  // free nerve endings fan out into the epidermis
  {const x=X(.875),y=g.ridge(x);[[-16,-16],[-6,-24],[6,-22],[16,-14]].forEach(q=>{ctx.beginPath();ctx.moveTo(x,y+3);ctx.lineTo(x+q[0],y+q[1]);ctx.stroke();});
    ctx.fillStyle=C.nerve;[[-16,-16],[-6,-24],[6,-22],[16,-14]].forEach(q=>{ctx.beginPath();ctx.arc(x+q[0],y+q[1],2.2,0,6.2832);ctx.fill();});}
  // hair, follicle, sebaceous gland, arrector pili
  if(hairOK){const hx=X(.3),by=g.at.hair[1]+12;
    ctx.fillStyle=C.foll;rr(ctx,hx-8,g.y1-6,16,by-g.y1+8,7);ctx.fill();
    ctx.strokeStyle=C.hair;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(hx,by-6);ctx.lineTo(hx,g.ys);ctx.quadraticCurveTo(hx+2,R.y+g.air*.5,hx+22,R.y+6);ctx.stroke();
    ctx.fillStyle=C.hair;ctx.beginPath();ctx.ellipse(hx,by-3,8,7,0,0,6.2832);ctx.fill();
    ctx.strokeStyle=C.nerve;ctx.lineWidth=1.6;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(hx,by-16-i*7,10,3,0,0,6.2832);ctx.stroke();}ctx.beginPath();ctx.moveTo(hx+9,by-14);ctx.lineTo(hx+9,g.tr);ctx.stroke();
    const sb=g.at.sebaceous;ctx.fillStyle=C.seb;ctx.strokeStyle=C.sebs;ctx.lineWidth=1.2;[[-8,0],[4,-7],[6,6]].forEach(q=>{ctx.beginPath();ctx.arc(sb[0]+q[0],sb[1]+q[1],8.5,0,6.2832);ctx.fill();ctx.stroke();});
    ctx.strokeStyle=C.musc;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(hx+8,by-26);ctx.lineTo(X(.455),g.pap-2);ctx.stroke();}
  // Merkel cell
  {const q=g.at.merkel;ctx.fillStyle='#d6589a';ctx.beginPath();ctx.ellipse(q[0],q[1],7,4.5,0,0,6.2832);ctx.fill();ctx.fillStyle=C.nerve;ctx.beginPath();ctx.ellipse(q[0],q[1]+5,6,2.2,0,0,6.2832);ctx.fill();}
  // Meissner's corpuscle
  if(meisOK){const q=g.at.meissner;ctx.fillStyle='#7b68c4';ctx.beginPath();ctx.ellipse(q[0],q[1],7,12,0,0,6.2832);ctx.fill();ctx.strokeStyle='#e8e2ff';ctx.lineWidth=1;for(let i=-8;i<=8;i+=4){ctx.beginPath();ctx.moveTo(q[0]-6,q[1]+i);ctx.lineTo(q[0]+6,q[1]+i-2);ctx.stroke();}}
  // Pacinian corpuscle
  {const q=g.at.pacinian;ctx.strokeStyle=C.nerve;ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(q[0],g.tr);ctx.stroke();[1,.76,.52,.28].forEach((f,i)=>{ctx.fillStyle=i%2?'#a9d4c6':'#5a9e8f';ctx.beginPath();ctx.ellipse(q[0],q[1]+6,13*f+1,19*f+1,0,0,6.2832);ctx.fill();});}
  // Ruffini ending (deep dive)
  if(atLeast('ap')){const q=g.at.ruffini;ctx.fillStyle='#b5823f';ctx.beginPath();ctx.ellipse(q[0],q[1],6,14,.2,0,6.2832);ctx.fill();}
  // firing glows, one ring per recent spike
  ['meissner','merkel','hair','pacinian','ruffini','fne'].forEach(id=>{const a=glow(id);if(!a)return;const q=g.at[id];if(!q)return;const c=ctx.createRadialGradient(q[0],q[1],2,q[0],q[1],30);c.addColorStop(0,'rgba(255,206,64,'+(.9*a)+')');c.addColorStop(1,'rgba(255,206,64,0)');ctx.fillStyle=c;ctx.beginPath();ctx.arc(q[0],q[1],30,0,6.2832);ctx.fill();});
  // signal dots along the nerve
  (o.dots||[]).forEach(d=>{ctx.fillStyle='#ff9f1c';ctx.beginPath();ctx.arc(d.x,d.y,4,0,6.2832);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();});
  // selection
  const sel=o.sel;if(sel){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;
    if(sel==='epidermis'||sel==='corneum'||sel==='granulosum'||sel==='spinosum'||sel==='basale'||sel==='lucidum'||sel==='keratinocyte'||sel==='melanocyte'||sel==='langerhans'){ctx.strokeRect(R.x+2,g.ys,R.w-4,g.y1-g.ys+g.a);}
    else if(sel==='dermis')ctx.strokeRect(R.x+2,g.y1-g.a,R.w-4,g.y2-g.y1+g.a);
    else if(sel==='papillary')ctx.strokeRect(R.x+2,g.y1-g.a,R.w-4,g.pap-g.y1+g.a);
    else if(sel==='reticular')ctx.strokeRect(R.x+2,g.pap,R.w-4,g.y2-g.pap);
    else if(sel==='hypodermis')ctx.strokeRect(R.x+2,g.y2,R.w-4,R.y+R.h-g.y2-2);
    else{const q=g.at[sel==='arrector'?'arrector':sel];if(q){ctx.beginPath();ctx.arc(q[0],q[1],24,0,6.2832);ctx.stroke();}}}
  ctx.restore();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;rr(ctx,R.x,R.y,R.w,R.h,10);ctx.stroke();
  return g;}

/* the labels for the explorer view */
function exploreLabels(sim,ctx,g,k){const big=k>1.35,sel=sim.p.part,R=g.R,L=(s,x,y)=>pill(ctx,s,x,y,PAL['card'],PAL['cv-ink'],12*k);
  const width=s=>{ctx.font='700 '+12*k+'px '+FONT;return ctx.measureText(s).width+13.2*k;};
  const lt=(s,y)=>L(s,R.x+6+width(s)/2,y);
  const rtEdge=(s,y)=>L(s,R.x+R.w-6-width(s)/2,y);
  if(big){lt('Epidermis',g.ys+14*k*.6);rtEdge('Dermis',g.pap+22);lt('Hypodermis',R.y+R.h-14-6*k);
    const s=partBy(sel);if(s&&g.at[sel]){const q=g.at[sel],w=width(s.n),x=clamp(q[0],R.x+w/2+4,R.x+R.w-w/2-4),y=q[1]+(q[1]>R.y+R.h*.6?-44:44);L(s.n,x,y);}return;}
  lt('Epidermis',g.ys+22);rtEdge(atLeast('honors')?'Papillary layer':'Dermis',g.pap-16);if(atLeast('honors'))rtEdge('Reticular layer',g.pap+22);lt('Hypodermis',R.y+R.h-20);
  const lead=(id,s,lx,ly)=>{const q=g.at[id];if(!q)return;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(lx,ly);ctx.stroke();L(s,lx,ly);};
  const X=g.X,dy=g.y2-g.y1;
  lead('hair','Hair follicle',X(.15),g.y1+dy*.84);lead('sebaceous','Sebaceous gland',X(.2),g.y1+dy*.36);lead('arrector','Arrector pili',X(.47),g.y1+dy*.40);
  lead('merkel','Merkel cell',X(.28),g.ys-20);lead('fne','Free nerve endings',X(.82),g.ys-20);lead('meissner','Meissner’s corpuscle',X(.72),g.y1+dy*.37);
  lead('sweat','Sudoriferous gland',X(.74),g.y1+dy*.6);lead('caploop','Capillary loop',X(.52),g.ys-20);lead('pacinian','Pacinian corpuscle',X(.7),g.y2+g.hh*.17);
  if(atLeast('honors'))lead('papillae','Dermal papillae',X(.13),g.y1+dy*.28);
  if(atLeast('ap'))lead('ruffini','Ruffini ending',X(.16),g.y1+dy*.68);
  txt(ctx,'Hair',X(.3)+26,R.y+16,{s:12*k,c:PAL['cv-soft']});
  lt('Arteriole and venule',g.y2+g.hh*.08);}

/* ---------- Epidermis zoom ---------- */
const ROWS=[['corneum','Stratum corneum',.3],['lucidum','Stratum lucidum',.08],['granulosum','Stratum granulosum',.14],['spinosum','Stratum spinosum',.3],['basale','Stratum basale',.18]];
function zoomRows(sim){const thick=SITES[sim.p.site].thick,list=ROWS.filter(r=>thick||r[0]!=='lucidum'),sum=list.reduce((a,r)=>a+r[2],0),H=ZOOM.h-52;let y=ZOOM.y+44;return list.map(r=>{const h=r[2]/sum*H,o={id:r[0],n:r[1],y,h};y+=h;return o;});}
function drawZoom(sim,ctx,k,t,sel){const C=tc(),Z=ZOOM,site=SITES[sim.p.site];ctx.save();rr(ctx,Z.x,Z.y,Z.w,Z.h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.clip();
  txt(ctx,site.thick?'Epidermis: thick skin':'Epidermis: thin skin',Z.x+Z.w/2,Z.y+8+13*k,{s:13*k,w:700,a:'center'});
  const rows=zoomRows(sim),x0=Z.x+8,w=Z.w-16,top=rows[0].y,bot=rows[rows.length-1].y+rows[rows.length-1].h,fill={corneum:C.corn,lucidum:isDark()?'#a48f7d':'#f4ecdf',granulosum:C.lower,spinosum:C.epi,basale:C.epi};
  rows.forEach(r=>{ctx.fillStyle=fill[r.id];ctx.fillRect(x0,r.y,w,r.h);ctx.strokeStyle=C.cards;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,r.y);ctx.lineTo(x0+w,r.y);ctx.stroke();});
  // keratinocytes rising: one second is about one day, a new epidermis about every 35 days
  const days=35,n=46,ph=RM?0:t/days,rc=sim.vis.zk||(sim.vis.zk=(()=>{const q=rng(3),a=[];for(let i=0;i<n;i++)a.push([q(),q()]);return a;})());
  rc.forEach((c,i)=>{const f=(c[1]+ph)%1,y=bot-6-f*(bot-top-10),xx=x0+8+c[0]*(w-16),flat=clamp((f-.4)/.5,0,1),wc=7+flat*8,hc=7-flat*5.2,dead=f>.62;
    ctx.fillStyle=dead?(isDark()?'#b39f8c':'#c9ab8c'):(isDark()?'#a18268':'#d9a884');ctx.strokeStyle=C.cards;ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(xx,y,wc,hc,0,0,6.2832);ctx.fill();ctx.stroke();
    if(!dead){ctx.fillStyle=isDark()?'#3a2b20':'#6a4a32';ctx.beginPath();ctx.arc(xx,y,2.2,0,6.2832);ctx.fill();}});
  // melanocyte, Merkel cell, Langerhans cell
  const by=rows[rows.length-1].y+rows[rows.length-1].h*.55,sy=rows.find(r=>r.id==='spinosum');
  const mx=Z.x+Z.w-60;ctx.strokeStyle='#4a2f18';ctx.lineWidth=2;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(mx,by);ctx.lineTo(mx+i*11,by-20);ctx.stroke();}ctx.fillStyle='#5e3c1e';ctx.beginPath();ctx.arc(mx,by,8,0,6.2832);ctx.fill();
  const merx=Z.x+Z.w-26;ctx.fillStyle='#d6589a';ctx.beginPath();ctx.ellipse(merx,by+2,7,5,0,0,6.2832);ctx.fill();
  if(atLeast('honors')){const lx=Z.x+Z.w-40,ly=sy.y+sy.h*.5;ctx.strokeStyle='#2a8276';ctx.lineWidth=2.4;for(let i=0;i<6;i++){const a=i*1.05;ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(lx+Math.cos(a)*13,ly+Math.sin(a)*13);ctx.stroke();}ctx.fillStyle='#2a8276';ctx.beginPath();ctx.arc(lx,ly,5,0,6.2832);ctx.fill();}
  rows.forEach(r=>{const on=sel===r.id,w2=(ctx.font='700 '+12*k+'px '+FONT,ctx.measureText(r.n).width+13*k);pill(ctx,r.n,x0+6+w2/2,r.y+r.h/2,on?PAL['rj']:PAL['card'],on?'#fff':PAL['cv-ink'],12*k);});
  if(k<=1.35){pill(ctx,'Melanocyte',Z.x+171,by+23,PAL['card'],PAL['cv-ink'],12*k);pill(ctx,'Merkel',Z.x+236,by+23,PAL['card'],PAL['cv-ink'],12*k);if(atLeast('honors'))pill(ctx,'Langerhans',Z.x+Z.w-48,sy.y+sy.h*.5+28,PAL['card'],PAL['cv-ink'],12*k);}
  {const ring=sel==='melanocyte'?[mx,by]:sel==='merkel'?[merx,by+2]:sel==='langerhans'?[Z.x+Z.w-40,sy.y+sy.h*.5]:null;if(ring){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(ring[0],ring[1],18,0,6.2832);ctx.stroke();}}
  ctx.restore();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;rr(ctx,Z.x,Z.y,Z.w,Z.h,10);ctx.stroke();}

/* ---------- Probes ---------- */
function drawProbe(sim,ctx,g,k,t){const p=sim.p,s=sim.st,x=g.X(.625),y0=g.ys;if(!s.on||sim.t<s.t0)return;const down=clamp((sim.t-s.t0)/.15,0,1);ctx.save();
  if(p.stim==='touch'){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+40,g.R.y+4);ctx.quadraticCurveTo(x+14,y0-16,x,y0+1);ctx.stroke();ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(x,y0+1,2.5,0,6.2832);ctx.fill();}
  else if(p.stim==='press'){ctx.fillStyle=PAL['cv-soft'];rr(ctx,x-34,y0-30+6*down,68,30,8);ctx.fill();}
  else if(p.stim==='vib'){const w=RM?0:Math.sin(t*60)*2.5;ctx.fillStyle=PAL['cv-soft'];rr(ctx,x-22+w,y0-26,8,26,3);ctx.fill();rr(ctx,x+14-w,y0-26,8,26,3);ctx.fill();rr(ctx,x-22,y0-8,44,8,3);ctx.fill();}
  else if(p.stim==='heat'){ctx.fillStyle='#c8342f';{const ph=12*k+6;rr(ctx,x-50,y0-ph,100,ph,6);ctx.fill();txt(ctx,heatC(p.S).toFixed(0)+' °C',x,y0-4,{s:12*k,w:700,c:'#fff',a:'center'});}}
  else if(p.stim==='cold'){ctx.fillStyle='#2f76b8';{const ph=12*k+6;rr(ctx,x-50,y0-ph,100,ph,6);ctx.fill();txt(ctx,coldC(p.S).toFixed(0)+' °C',x,y0-4,{s:12*k,w:700,c:'#fff',a:'center'});}}
  else{const px=g.X(.875);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px+18,g.R.y+4);ctx.lineTo(px,y0+7);ctx.stroke();}
  ctx.restore();}

/* ---------- Spike raster on the stage ---------- */
function drawRaster(sim,ctx,x,y,w,h,k){const s=sim.st,p=sim.p,win=6,now=sim.t,C=PAL,list=listFor(p).sort((a,b)=>peakOf(p,b)-peakOf(p,a)).slice(0,3);
  ctx.fillStyle=C['card'];rr(ctx,x,y,w,h,10);ctx.fill();ctx.strokeStyle=C['line'];ctx.lineWidth=1.5;ctx.stroke();
  const L=x+10,W=w-20,T=y+8,X=q=>L+(q-(now-win))/win*W,axisH=8+12*k,stimH=10+14*k,rowH=(h-axisH-stimH-12)/Math.max(list.length,1);
  // stimulus bar
  txt(ctx,'Stimulus on',L,T+12*k-2,{s:12*k,w:700,c:C['cv-soft']});
  ctx.fillStyle=C['s3'];const barY=T+12*k+2,barH=6;const seg=(a,b)=>{const a1=Math.max(a,now-win),b1=Math.min(b,now);if(b1>a1)ctx.fillRect(X(a1),barY,X(b1)-X(a1),barH);};
  s.onLog.forEach(q=>seg(q.a,q.b));if(s.on&&now>s.t0)seg(s.t0,now);
  list.forEach((rid,i)=>{const yy=T+stimH+4+i*rowH,col=serColor(i);txt(ctx,REC[rid].sh,L,yy+12*k-2,{s:12*k,w:700,c:C['cv-ink']});
    const y0=yy+12*k+2,y1=yy+rowH-4;ctx.strokeStyle=col;ctx.lineWidth=1.4;ctx.beginPath();(s.sp[rid]||[]).forEach(q=>{if(q>=now-win){const xx=X(q);ctx.moveTo(xx,y0);ctx.lineTo(xx,y1);}});ctx.stroke();
    ctx.strokeStyle=C['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(L,y1+1);ctx.lineTo(L+W,y1+1);ctx.stroke();});
  if(!list.some(r=>peakOf(p,r)>0))txt(ctx,'Too weak: nothing fires',L+W/2,T+stimH+rowH*.6*Math.max(list.length,1),{s:12*k,c:C['cv-soft'],a:'center'});
  txt(ctx,'6 s ago',L,y+h-7,{s:12*k,c:C['cv-soft']});txt(ctx,'now',L+W,y+h-7,{s:12*k,c:C['cv-soft'],a:'right'});}

/* ---------- The four-part sensation chain ---------- */
function chainText(sim,big){const p=sim.p,site=SITES[p.site],m=mainRec(p),hon=atLeast('honors'),ap=atLeast('ap');
  const stim=STIM[p.stim]+(p.stim==='heat'?' ('+heatC(p.S).toFixed(0)+' °C)':p.stim==='cold'?' ('+coldC(p.S).toFixed(0)+' °C)':p.stim==='vib'?' ('+p.f+' Hz)':'');
  const thermal=m==='heat'||m==='cold'||m==='noci';
  let aff=big?'Afferent neuron':(site.cranial?'Afferent (sensory) neuron in a cranial nerve':'Afferent (sensory) neuron to the spinal cord, then the brain');
  if(!big&&hon)aff=site.cranial?'Afferent neuron, trigeminal nerve, then thalamus':'Afferent neuron, spinal cord'+(ap&&m?(thermal?' (spinothalamic tract)':' (dorsal column)'):'')+', then thalamus';
  return {stim:stim+(big?'':' on '+site.n.toLowerCase()),rec:m?REC[m].n:'None fires',aff:m?aff:'No signal',ctx:m?(big?'Sensory cortex, '+site.area:'Sensory cortex (parietal lobe), '+site.area+' area'):'Nothing to feel'};}
function drawChain(sim,ctx,k,t,vdt){const x0=10,y=470,bw=184,gap=14,h=LH-y-8,big=k>1.35,T=chainText(sim,big),heads=['1. Stimulus','2. Receptor','3. Afferent pathway','4. Sensory cortex'],vals=[T.stim,T.rec,T.aff,T.ctx],v=sim.vis,s=sim.st;
  const active=s.on&&sim.t>=s.t0?clamp((mainRec(sim.p)?rateOf(sim,mainRec(sim.p)):0)/40,0,1):0;
  heads.forEach((hd,i)=>{const x=x0+i*(bw+gap);ctx.fillStyle=PAL['card'];rr(ctx,x,y,bw,h,10);ctx.fill();ctx.strokeStyle=active>0.02?PAL['s3']:PAL['line'];ctx.lineWidth=active>0.02?2.5:1.5;ctx.stroke();
    const size=12*k;wrapTxt(ctx,big?hd.replace(/^\d\. /,'').replace('Afferent pathway','Pathway').replace('Sensory cortex','Cortex'):hd,x+10,y+6+size,bw-16,{s:size,w:700,c:PAL['rj']});
    wrapTxt(ctx,vals[i],x+10,y+12+size*2.1,bw-16,{s:size,c:PAL['cv-ink'],lh:size*1.14});
    if(i<3){ctx.fillStyle=PAL['cv-soft'];ctx.beginPath();const ax=x+bw+1,ay=y+h/2;ctx.moveTo(ax,ay-7);ctx.lineTo(ax+11,ay);ctx.lineTo(ax,ay+7);ctx.closePath();ctx.fill();}});
  if(!v.chain)v.chain=[];if(vdt>0&&!RM&&active>0.02){v.cacc=(v.cacc||0)+vdt*(1+active*5);while(v.cacc>=1){v.cacc--;v.chain.push(0);}}
  v.chain=v.chain.map(q=>q+vdt*.5).filter(q=>q<1);ctx.fillStyle='#ff9f1c';v.chain.forEach(q=>{ctx.beginPath();ctx.arc(x0+q*(800-2*x0),y+2,4.5,0,6.2832);ctx.fill();});}

/* ---------- Main drawing ---------- */
function updateFire(sim,vdt,g){const s=sim.st,v=sim.vis;v.act=v.act||{};const a=v.act,ids=['meissner','merkel','hair','pacinian','ruffini'],now=sim.t;
  const recent=id=>{const L=s.sp[id];if(!L||!L.length)return 0;return clamp(1-(now-L[L.length-1])/.12,0,1);};
  ids.forEach(id=>a[id]=recent(id));a.fne=Math.max(recent('heat'),recent('cold'),recent('noci'));
  v.seen=v.seen||{};v.dots=v.dots||[];
  if(!RM&&vdt>0){Object.keys(REC).forEach(id=>{const c=s.ct[id]||0,was=v.seen[id]||0;if(c>was&&v.dots.length<40){const q=g.at[id==='heat'||id==='cold'||id==='noci'?'fne':id];if(q)for(let i=0;i<Math.min(2,c-was);i++)v.dots.push({x:q[0],y:q[1],ph:0});}v.seen[id]=c;});
    v.dots.forEach(d=>{const sp=210*vdt;if(d.ph===0){const dy=g.tr-d.y;if(Math.abs(dy)<sp){d.y=g.tr;d.ph=1;}else{d.y+=Math.sign(dy)*sp;}}else d.x+=sp;});
    v.dots=v.dots.filter(d=>d.x<g.R.x+g.R.w-2);}else if(RM)v.dots=[];}
function drawSiteCard(sim,ctx,k,t){const p=sim.p,S=SITES[p.site],x=400,y=10,w=390,h=196;ctx.fillStyle=PAL['card'];rr(ctx,x,y,w,h,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  const o={cx:x+56,top:y+8,h:h-16,view:S.view};BioLab.body.draw(ctx,o);const q=BioLab.body.at(S.lm==='mouth'||S.lm==='neck'?S.lm:S.lm+'L',o)||{x:o.cx,y:y+60};
  ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(q.x,q.y,5,0,6.2832);ctx.fill();if(!RM){const r=6+((t*1.2)%1)*10;ctx.strokeStyle=PAL['s1'];ctx.lineWidth=1.5;ctx.globalAlpha=1-((t*1.2)%1);ctx.beginPath();ctx.arc(q.x,q.y,r,0,6.2832);ctx.stroke();ctx.globalAlpha=1;}
  const tx=x+118,tw=w-126;let yy=y+10+14*k;txt(ctx,S.n,tx,yy,{s:14*k,w:700});yy+=6;
  const size=12*k,lh=size*1.2;
  yy=wrapTxt(ctx,(S.glab?'Hairless':'Hairy')+', '+(S.thick?'thick skin':'thin skin'),tx,yy+size,tw,{s:size,c:PAL['cv-soft'],lh})+2;
  yy=wrapTxt(ctx,'Two-point threshold: about '+S.T+' mm',tx,yy+size-lh+lh,tw,{s:size,c:PAL['cv-ink'],lh})+2;
  if(k<=1.35)wrapTxt(ctx,'Touch receptors: '+(S.T<=5?'very dense':S.T<=12?'dense':S.T<=25?'sparse':'very sparse'),tx,yy+size,tw,{s:size,c:PAL['cv-ink'],lh});}
function drawFacts(sim,ctx,k){const x=525,y=490,w=265,h=120;ctx.fillStyle=PAL['card'];rr(ctx,x,y,w,h,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();const s=12*k;
  let yy=wrapTxt(ctx,'Skin: about 2.2 m² and 15% of body weight.',x+10,y+6+s,w-20,{s,w:700,lh:s*1.16});
  wrapTxt(ctx,(k>1.35?'':'New epidermis every 25 to 45 days. ')+'Here 1 s is about 1 day.',x+10,yy+2,w-20,{s,c:PAL['cv-soft'],lh:s*1.16});}
function draw(sim,ctx,vdt,k,t){if(sim.vlab&&sim.st&&sim.st.B){drawBench(sim,ctx,vdt,k,t);return;}
  const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,LH);
  if(p.view==='explore'){const g=geom(SEC);drawSkinBlock(sim,ctx,SEC,{composite:true,sel:p.part},k,t);exploreLabels(sim,ctx,g,k);
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(SEC.x+SEC.w,g.ys);ctx.lineTo(ZOOM.x,ZOOM.y+44);ctx.moveTo(SEC.x+SEC.w,g.y1+g.a);ctx.lineTo(ZOOM.x,ZOOM.y+ZOOM.h-8);ctx.stroke();ctx.setLineDash([]);
    drawZoom(sim,ctx,k,t,p.part);drawFacts(sim,ctx,k);return;}
  const g=geom(SEC2);updateFire(sim,vdt,g);drawSkinBlock(sim,ctx,SEC2,{act:sim.vis.act,dots:sim.vis.dots},k,t);drawProbe(sim,ctx,g,k,t);
  const m=mainRec(p);if(m){const q=g.at[m==='heat'||m==='cold'||m==='noci'?'fne':m];if(q){const w=(ctx.font='700 '+12*k+'px '+FONT,ctx.measureText(REC[m].sh).width+13*k),lx=clamp(q[0],SEC2.x+w/2+4,SEC2.x+SEC2.w-w/2-4),ly=q[1]<SEC2.y+SEC2.h*.4?q[1]+46:q[1]-40;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(lx,ly);ctx.stroke();pill(ctx,REC[m].sh,lx,ly,PAL['card'],PAL['cv-ink'],12*k);}}
  drawSiteCard(sim,ctx,k,t);drawRaster(sim,ctx,400,214,390,246,k);drawChain(sim,ctx,k,t,vdt);}

/* ---------- Virtual lab: Touch Sense ---------- */
const A_SITES=[{id:'handback',n:'Back of hand',T:30,lm:'palmL',view:'back'},{id:'palm',n:'Palm of hand',T:10,lm:'palmL',view:'front'},{id:'finger',n:'Index finger',T:3,lm:'fingerL',view:'front'},{id:'neck',n:'Back of neck',T:40,lm:'neck',view:'back'},{id:'sole',n:'Sole of foot',T:22,lm:'footL',view:'back'},{id:'calf',n:'Back of calf',T:45,lm:'calfL',view:'back'}];
const B_SITES=[{id:'palm',n:'Palm',E:5,lm:'palmL',view:'front'},{id:'handback',n:'Back of hand',E:8,lm:'palmL',view:'back'},{id:'forearmA',n:'Forearm, anterior',E:11,lm:'forearmL',view:'front'},{id:'forearmP',n:'Forearm, posterior',E:13,lm:'forearmL',view:'back'},{id:'sole',n:'Sole of foot',E:8,lm:'footL',view:'back'},{id:'calf',n:'Back of calf',E:16,lm:'calfL',view:'back'}];
const COIN={hand:{n:'Back of hand',T:20,S:12,lm:'palmL',view:'back'},arm:{n:'Forearm',T:16,S:10,lm:'forearmL',view:'front'}};
const isLab=s=>!!(s&&s.vlab&&s.st&&s.st.B);
const gauss=r=>Math.sqrt(-2*Math.log(Math.max(r(),1e-6)))*Math.cos(6.2832*r());
function benchInit(sim){const b=sim.vlab.bench;if(!b.log)b.log={};if(!b.loc)b.loc={};if(b.n===undefined)b.n=0;if(!b.coin)b.coin={hand:{one:[],stack:[]},arm:{one:[],stack:[]}};if(!b.rib)b.rib=[];if(!b.ex)b.ex='ready';return b;}
function personT(V,i,T){const a=gauss(V.rng(11)),c=gauss(V.rng(20+i));return T*Math.exp(.12*a+.1*c);}
function touch(sim,id,gap){const V=sim.vlab,b=V.bench,i=A_SITES.findIndex(q=>q.id===id),S=A_SITES[i];b.n++;let ans='one';if(gap>0){const T=personT(V,i,S.T),pr=1/(1+Math.exp(-(gap-T)/(.1*T+.5)));ans=V.rng(5000+b.n)()<pr?'two':'one';}
  (b.log[id]=b.log[id]||[]).push({g:gap,a:ans});b.last={site:id,g:gap,a:ans};}
function locPlace(sim){const V=sim.vlab,b=V.bench,id=sim.p.tSiteB,S=B_SITES.find(q=>q.id===id);b.n++;const r=V.rng(7000+b.n),spread=Math.exp(.38*gauss(r)),d=clamp(Math.round(S.E*spread*10)/10,1.5,46),ang=(r()-.5)*.24;
  (b.loc[id]=b.loc[id]||[]).push(d);b.cur={site:id,d,ang,mark:true,point:true};}
function benchStep(sim,dt){const V=sim.vlab;if(!V)return;const b=V.bench,R=b.run;if(R&&!R.done){R.el+=dt;if(R.el>=R.T){R.el=R.T;R.done=true;const v=Math.round(R.T*10)/10;if(R.k==='coin')b.coin[R.site][R.ph==='one'?'one':'stack'].push(v);else b.rib.push(v);}}}
function startCoin(sim,ph){const V=sim.vlab,b=V.bench,site=sim.p.tCoin,C=COIN[site];b.n++;const mean=ph==='one'?C.T:C.S,T=clamp(mean*Math.exp(.25*gauss(V.rng(9000+b.n))),3,60);b.run={k:'coin',site,ph,T,el:0,done:false};}
function startRib(sim){const V=sim.vlab,b=V.bench;b.n++;const T=clamp(3.5*Math.exp(.3*gauss(V.rng(9500+b.n))),1.2,9);b.run={k:'rib',T,el:0,done:false,trial:b.rib.length+1};}
const parseThr=v=>{const t=String(v).trim().replace(/\s+/g,'');let m;if((m=/^(\d+(?:\.\d+)?)\+$/.exec(t))||(m=/^>(\d+(?:\.\d+)?)$/.exec(t)))return {n:+m[1],plus:true};if(/^\d+(\.\d+)?$/.test(t))return {n:+t,plus:false};return null;};
function thrCheck(ext){return (sim,rv,v)=>{const S=A_SITES.find(q=>q.n===rv);if(!S)return null;const log=(sim.vlab.bench.log[S.id]||[]),p=parseThr(v);
  const card=ext?[30,40,50]:[0,5,10,15,20],top=ext?50:20;
  if(!p)return 'Type a spacing in mm, or '+top+'+ if your partner still reported one point at '+top+' mm.';
  if(p.plus){if(p.n!==top)return 'This card stops at '+top+' mm, so the only "more than" reading is '+top+'+.';return log.some(e=>e.g===top&&e.a==='one')?null:'Test the '+top+' mm spacing at this site first.';}
  if(!card.includes(p.n))return 'This card only has '+card.join(', ')+' mm spacings.';
  const at=log.filter(e=>e.g===p.n);if(!at.length)return 'Your bench log has no touch at '+p.n+' mm for this site yet.';
  if(!at.some(e=>e.a==='two'))return 'Your log shows one point at '+p.n+' mm. The threshold is the first spacing that felt like two.';
  if(!ext&&log.some(e=>e.g<p.n&&e.a==='two'))return 'Check your log: a smaller spacing was already reported as two points.';
  return null;};}
function locCheck(sim,rv,v){const S=B_SITES[['Palm','Hand','Arm A','Arm P','Sole','Calf'].indexOf(rv)];if(!S)return null;const L=sim.vlab.bench.loc[S.id]||[];if(!L.length)return 'Run this site on the bench first.';if(L.some(d=>Math.abs(d-v)<=1.5))return null;return 'That does not match the ruler. Read from the center of the blue dot to the center of the red dot.';}
function timeCheck(site,ph){return (sim,rv,v)=>{const L=sim.vlab.bench.coin[site][ph];if(!L.length)return 'Run this on the bench first.';return L.some(d=>Math.abs(d-v)<=.3)?null:'That does not match a stopwatch reading from this part. Look at the stopwatch again.';};}
function coinChk(ph){return (sim,rv,v)=>{const site=rv==='Back of hand'?'hand':'arm';return timeCheck(site,ph)(sim,rv,v);};}
function ribChk(sim,rv,v){const V=sim.vlab,b=V.bench,m=/^Trial (\d)$/.exec(rv);if(m){const i=+m[1]-1;if(b.rib[i]===undefined)return 'Run trial '+m[1]+' on the bench first.';return Math.abs(b.rib[i]-v)<=.15?null:'That does not match the stopwatch for this trial.';}
  const a=[0,1,2].map(i=>V.val('t2b','dur',i));if(a.some(x=>!Number.isFinite(x)))return 'Fill in all three trials first.';const avg=(a[0]+a[1]+a[2])/3;return Math.abs(avg-v)<=.11?null:'Add your three trials and divide by 3.';}
const filledA=(sim,t,c,n)=>{for(let i=0;i<n;i++){if(!sim.vlab.raw('c:'+t+':'+c+':'+i).trim())return i;}return -1;};
const LAB_TS={id:'touch-sense',title:'Physiology Lab: General Cutaneous Sensations',course:'Anatomy & Physiology',teachers:'McKeon',
  source:{label:'Touch Sense Lab-3.docx',href:'https://rjhs.instructure.com/courses/15586/assignments/574584'},
  purpose:'<p>Your skin does not sense touch equally everywhere. In this lab you map how sharply different body sites can tell two touches apart, how accurately they can tell where a touch landed, and how quickly touch receptors stop reporting a stimulus that does not change.</p>',
  background:'<p>Touch receptors each watch over a patch of skin called a receptive field. Where receptors are packed close together and their fields are small, two nearby touches land on different receptors and feel like two points. Where receptors are sparse and fields are large, the same two touches land in one field and feel like one.</p><p>Many receptors also share one path to the brain, which is called <b>neural convergence</b>. More convergence means a blurrier sense of exactly where a touch happened.</p><p><b>Adaptation</b> is a drop in a receptor’s firing while a stimulus stays the same. The stimulus is still there, but the signal to your brain fades.</p><p><b>About the virtual bench.</b> Your lab partner’s answers come from published adult averages, with differences between people and from touch to touch, so your numbers are your own. Your partner’s eyes stay closed for every test. The stopwatch reads to 0.1 s, and Speed under the bench makes the waiting shorter.</p>',
  materials:['An index card with pairs of toothpicks set 0, 5, 10, 15 and 20 mm apart','An extension card with pairs set 30, 40 and 50 mm apart (optional)','Two markers of different colors','A metric ruler','Three coins','A short piece of ribbon','A stopwatch','A lab partner, whose eyes stay closed'],
  setup(sim){benchInit(sim);},
  controls:[],
  steps:[
   {title:'Meet the bench',text:'<p>Your partner sits with eyes closed for the whole lab. You touch their skin, they tell you what they feel, and you record it. Your four exercises: two-point discrimination, tactile localization, touch adaptation and hair receptors.</p>',setup(sim){sim.vlab.bench.ex='ready';BioLab.setValues(sim,{tView:'bench'});}},
   {title:'1A: Two-point discrimination',controls:['tSiteA','tGap','t-touch'],setup(sim){sim.vlab.bench.ex='1A';BioLab.setValues(sim,{tView:'bench'});},
    text:'<p>Choose a site. Start at <b>0 mm</b> and press <b>Touch the skin</b>. Then raise the spacing one step at a time until your partner reports two points. Record that spacing in Table 1A as the two-point threshold.</p><p>If your partner still reports one point at 20 mm, the card has run out. Type <b>20+</b>.</p>',
    done:sim=>filledA(sim,'t1a','thr',6)<0,doneHint:sim=>'Test '+A_SITES[filledA(sim,'t1a','thr',6)].n.toLowerCase()+' and type its threshold in Table 1A.'},
   {title:'1A extension (optional)',controls:['tSiteA','tGapX','t-touchX'],setup(sim){sim.vlab.bench.ex='1X';BioLab.setValues(sim,{tView:'bench'});},
    text:'<p>Any site that read 20+ hit the limit of your instrument. You only know that its threshold is more than 20 mm. Use the extension card with 30, 40 and 50 mm spacings to find a real value and record it in the extension column. Type 50+ if it runs out too.</p><p>This goes beyond the handout. Skip it if your teacher does not ask for it.</p>'},
   {title:'1B: Tactile localization',controls:['tSiteB','t-mark','t-point'],setup(sim){sim.vlab.bench.ex='1B';BioLab.setValues(sim,{tView:'bench'});},
    text:'<p>Choose a site and press <b>Touch it with the marker</b>. Your partner, eyes still closed, tries to touch the same spot with a different color. Read the ruler from the blue dot to the red dot and record the distance in Table 1B, to the nearest mm.</p>',
    done:sim=>filledA(sim,'t1b','dist',6)<0,doneHint:sim=>'Test '+B_SITES[filledA(sim,'t1b','dist',6)].n.toLowerCase()+' and type the distance in Table 1B.'},
   {title:'2A: Touch adaptation, back of hand',controls:['t-coin','t-stack','t-clear'],setup(sim){const b=sim.vlab.bench;b.ex='2A';BioLab.setValues(sim,{tView:'bench',tCoin:'hand'});},
    text:'<p>Press <b>Place one coin</b>. The stopwatch runs until your partner says the feeling has faded. Record the time in Table 2A.</p><p>As soon as the feeling is gone, press <b>Stack two more coins</b> and time how long the new feeling lasts. Record that too.</p>',
    done:sim=>!!sim.vlab.raw('c:t2a:fade:0').trim()&&!!sim.vlab.raw('c:t2a:stack:0').trim(),doneHint:'Type both back-of-hand times in Table 2A.'},
   {title:'2A: Touch adaptation, forearm',controls:['t-coin','t-stack','t-clear'],setup(sim){const b=sim.vlab.bench;b.ex='2A';BioLab.setValues(sim,{tView:'bench',tCoin:'arm'});},
    text:'<p>Repeat on the forearm. Time one coin until the feeling fades, stack two more coins, and time again. Record both times in Table 2A.</p>',
    done:sim=>!!sim.vlab.raw('c:t2a:fade:1').trim()&&!!sim.vlab.raw('c:t2a:stack:1').trim(),doneHint:'Type both forearm times in Table 2A.'},
   {title:'2B: Hair receptors',controls:['t-rib','t-rib-off'],setup(sim){const b=sim.vlab.bench;b.ex='2B';BioLab.setValues(sim,{tView:'bench'});},
    text:'<p>Press <b>Bend the hairs with the ribbon</b>. Hold the ribbon still. The stopwatch runs until your partner stops feeling it. Do 3 trials, record them in Table 2B, and work out the average.</p>',
    done:sim=>filledA(sim,'t2b','dur',4)<0,doneHint:'Fill in all three trials and the average in Table 2B.'},
   {title:'Compare your sites',controls:['tView'],setup(sim){BioLab.setValues(sim,{tView:'compare'});},
    text:'<p>The bench now plots your Tables 1A and 1B side by side. An arrow on a bar means the card ran out, so the true value is higher than the bar. Look for the sites that are best and worst at each job.</p>'},
   {title:'Questions',controls:['tView'],text:'<p>Use your data to answer the questions below the bench, then save your report and turn it in.</p>'}],
  tables:[
   {id:'t1a',title:'Table 1A: Two-point discrimination',cols:[{id:'site',label:'Body site',rows:A_SITES.map(s=>s.n)},{id:'thr',label:'Two-point threshold on the card (mm, or 20+)',input:'text',check:thrCheck(false)},{id:'ext',label:'Extension card (mm, or 50+), optional',input:'text',check:thrCheck(true)}]},
   {id:'t1b',title:'Table 1B: Tactile localization',cols:[{id:'site',label:'Body site',rows:['Palm','Hand','Arm A','Arm P','Sole','Calf'],rowLabels:B_SITES.map(s=>s.n)},{id:'dist',label:'Distance from the mark (mm)',input:'number',dp:0,check:locCheck}]},
   {id:'t2a',title:'Table 2A: Touch adaptation',cols:[{id:'site',label:'Body site',rows:['Back of hand','Forearm']},{id:'fade',label:'One coin: time until the feeling fades (s)',input:'number',dp:1,check:coinChk('one')},{id:'stack',label:'Two coins added: time the feeling lasts (s)',input:'number',dp:1,check:coinChk('stack')}]},
   {id:'t2b',title:'Table 2B: Hair receptors (forearm)',cols:[{id:'trial',label:'Trial',rows:['Trial 1','Trial 2','Trial 3','Average']},{id:'dur',label:'Time the feeling lasts (s)',input:'number',dp:1,check:ribChk}]}],
  observations:[{id:'limit',label:'Which sites hit the limit of your 20 mm card? What can you honestly claim about those sites from the card alone?'}],
  graph:{type:'bar',title:'Distance from the mark by site',xl:'Body site (Hand = back of hand, Arm A and P = forearm anterior and posterior)',yl:'Distance (mm)',series:[{table:'t1b',x:'site',y:'dist',label:'Distance from the mark'}]},
  questions:[
   {id:'q1',n:'1',q:'<p>In your own words, define sensation. Then list the four things that must all be in place for a sensation to happen.</p>'},
   {id:'q2',n:'2',q:'<p>Which site had the smallest two-point threshold? What does that tell you about how many touch receptors are packed into that skin?</p>'},
   {id:'q3',n:'3',q:'<p>Fingertips and lips tell two points apart far better than the back of the calf or the sole of the foot. Explain why that difference exists.</p>'},
   {id:'q4',n:'4',q:'<p>Compare how well the palm and the forearm located a touch. Use the idea of neural convergence to explain the difference.</p>'},
   {id:'q5',n:'5',q:'<p>Describe how the feeling of the coin changed over time. What does adaptation do to a receptor’s signal?</p>'},
   {id:'q6',n:'6',q:'<p>Why do you adapt quickly to some stimuli but slowly to others? Give one example of each.</p>'},
   {id:'q7',n:'7',q:'<p>Imagine you never adapted to anything your skin touched. Describe one benefit and one drawback.</p>'},
   {id:'q8',n:'8',q:'<p>You are designing protective clothing for firefighters. How would you use what you know about adaptation in your design?</p>'}]};

/* bench art */
function patch(ctx,x,y,w,h,hairs){const C=tc();ctx.fillStyle=C.skin;rr(ctx,x,y,w,h,22);ctx.fill();ctx.strokeStyle=C.skins;ctx.lineWidth=2;ctx.stroke();
  if(hairs){ctx.strokeStyle=C.hair;ctx.lineWidth=1.3;const q=rng(5);for(let i=0;i<hairs;i++){const a=x+14+q()*(w-28),b=y+14+q()*(h-28);ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(a+7,b-9);ctx.stroke();}}}
function miniFig(ctx,x,top,h,lm,view,lab){const o={cx:x,top,h,view};BioLab.body.draw(ctx,o);const q=BioLab.body.at(lm,o)||{x,y:top+h/2};ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(q.x,q.y,6,0,6.2832);ctx.fill();}
function bubble(ctx,s,x,y,w,k,col){const size=14*k,L=wrapLines(ctx,s,w-24,size,600),h=L.length*size*1.25+16;ctx.fillStyle=PAL['card'];rr(ctx,x,y,w,h,12);ctx.fill();ctx.strokeStyle=col||PAL['rj'];ctx.lineWidth=2;ctx.stroke();L.forEach((l,i)=>txt(ctx,l,x+12,y+8+size+i*size*1.25-2,{s:size,w:600}));return h;}
function benchHead(ctx,s,k){txt(ctx,s,16,14+15*k,{s:15*k,w:700,c:PAL['cv-ink']});}
function drawCard(ctx,cx,y,gap,px,k){const C=tc(),w=330,h=74,half=gap*px/2;ctx.fillStyle=C.card;rr(ctx,cx-w/2,y,w,h,6);ctx.fill();ctx.strokeStyle=C.cards;ctx.lineWidth=1.5;ctx.stroke();
  ctx.strokeStyle='#a97c50';ctx.lineWidth=4;ctx.lineCap='round';[cx-half,cx+half].forEach(x=>{ctx.beginPath();ctx.moveTo(x,y+h-14);ctx.lineTo(x,y+h+70);ctx.stroke();});
  txt(ctx,gap===0?'0 mm: one toothpick':gap+' mm apart',cx,y+30,{s:15*k,w:700,c:isDark()?'#f4ecd8':'#3a3428',a:'center'});}
function drawBench(sim,ctx,vdt,k,t){const V=sim.vlab,b=V.bench,p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,LH);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,LH-16,800,16);
  if(p.tView==='compare'){drawCompare(sim,ctx,k);return;}
  const ex=b.ex;
  if(ex==='ready'){benchHead(ctx,'Your lab bench',k);miniFig(ctx,150,60,500,'palmL','front');bubble(ctx,'Eyes closed. Ready when you are.',300,120,440,k);
    const items=k>1.35?['Toothpick cards','Markers and ruler','Coins, ribbon, stopwatch']:['Toothpick cards: 0 to 20 mm, extension to 50 mm','Two markers and a metric ruler','Three coins, a ribbon and a stopwatch'];items.forEach((s,i)=>wrapTxt(ctx,s,300,250+i*44*Math.min(k,1.3),460,{s:13*k,c:PAL['cv-ink']}));return;}
  if(ex==='1A'||ex==='1X'){const id=p.tSiteA,S=A_SITES.find(q=>q.id===id),gap=ex==='1X'?+p.tGapX:+p.tGap,log=b.log[id]||[],last=b.last&&b.last.site===id?b.last:null;
    benchHead(ctx,ex==='1X'?'1A extension: two-point':'1A: Two-point discrimination',k);
    miniFig(ctx,88,50+14*k,300,S.lm,S.view);
    const cx=340,px=ex==='1X'?4.6:5.6,yC=90;drawCard(ctx,cx,yC,gap,px,k);const yP=yC+74+62;patch(ctx,cx-168,yP,336,130,/hand|neck|calf/.test(id)?22:0);pill(ctx,S.n,cx,yP+112,PAL['card'],PAL['cv-ink'],13*k);txt(ctx,'Eyes closed',88,50+14*k+300+18*k,{s:13*k,c:PAL['cv-soft'],a:'center'});
    const y2=yP+146;bubble(ctx,last?(last.a==='two'?'I feel two points.':'I feel one point.'):'Touch when you are ready.',cx-168,y2,336,k,last&&last.a==='two'?PAL['s3']:PAL['rj']);
    const x=530,w=258,size=13*k;ctx.fillStyle=PAL['card'];rr(ctx,x,50+6*k,w,LH-50-6*k-30,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();txt(ctx,'Your log: '+(k>1.35?'':S.n.toLowerCase()),x+12,50+6*k+8+size,{s:size,w:700});
    const rows=log.slice(-Math.floor((LH-140)/(size*1.42)));rows.forEach((e,i)=>{const y=50+6*k+14+size*2.2+i*size*1.42;txt(ctx,e.g+' mm:',x+12,y,{s:size,c:PAL['cv-soft']});txt(ctx,e.a==='two'?'two points':'one point',x+w-12,y,{s:size,w:e.a==='two'?700:400,a:'right',c:e.a==='two'?PAL['s3']:PAL['cv-ink']});});
    if(!rows.length)wrapTxt(ctx,'No touches yet at this site.',x+12,50+6*k+14+size*2.2,w-24,{s:size,c:PAL['cv-soft']});return;}
  if(ex==='1B'){const id=p.tSiteB,S=B_SITES.find(q=>q.id===id),c=b.cur&&b.cur.site===id?b.cur:null,mk=b.mark&&b.mark===id;benchHead(ctx,'1B: Tactile localization',k);
    const px=14,ax=74,ay=330;const C=tc();patch(ctx,16,170,768,330,/hand|forearm|calf/.test(id)?30:0);txt(ctx,S.n,30,170+14+13*k,{s:13*k,w:700,c:'#3a2a20'});
    miniFig(ctx,740,18,150,S.lm,S.view);
    if(mk||c){ctx.fillStyle='#2d6bd2';ctx.beginPath();ctx.arc(ax,ay,7,0,6.2832);ctx.fill();}
    if(c){ctx.save();ctx.translate(ax,ay);ctx.rotate(c.ang);const rl=47*px;ctx.fillStyle=isDark()?'#d8cda0':'#f4e9b8';ctx.strokeStyle='#8a7b45';ctx.lineWidth=1.2;ctx.beginPath();ctx.rect(-14,20,rl+28,44);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#2a2616';for(let mm=0;mm<=47;mm++){const x=mm*px;ctx.lineWidth=mm%5===0?1.6:1;ctx.beginPath();ctx.moveTo(x,20);ctx.lineTo(x,20+(mm%5===0?16:9));ctx.stroke();if(mm%(k>1.35?10:5)===0)txt(ctx,String(mm),x,20+17+12*k*.8,{s:12*k,w:600,c:'#2a2616',a:'center'});}
      ctx.setLineDash([3,4]);ctx.lineWidth=1;ctx.strokeStyle='#2a2616';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,20);ctx.moveTo(c.d*px,0);ctx.lineTo(c.d*px,20);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='#c8342f';ctx.beginPath();ctx.arc(c.d*px,0,7,0,6.2832);ctx.fill();ctx.restore();}
    bubble(ctx,c?'I tried to touch the same spot.':(mk?'I felt that. Let me try to find it.':'Eyes closed. Touch when ready.'),16,60+14*k,640,k);
    txt(ctx,'Ruler scale: 1 mm per tick',16,520+13*k,{s:13*k,c:PAL['cv-soft']});return;}
  if(ex==='2A'||ex==='2B'){const coin=ex==='2A',site=p.tCoin,S=coin?COIN[site]:{n:'Forearm',lm:'forearmL',view:'front'},R=b.run&&(coin?(b.run.k==='coin'&&b.run.site===site):b.run.k==='rib')?b.run:null;
    benchHead(ctx,coin?'2A: Touch adaptation':'2B: Hair receptors',k);miniFig(ctx,88,60+14*k,300,S.lm,S.view);
    const x=190,y=70+14*k,w=590,h=280;patch(ctx,x,y,w,h,(coin&&site==='hand')?26:(coin?30:0));txt(ctx,S.n,x+16,y+16+13*k,{s:13*k,w:700,c:'#3a2a20'});
    if(coin){const n=R?(R.ph==='one'?1:3):0;for(let i=0;i<n;i++){const cy=y+h/2+30-i*12;ctx.fillStyle='#b9bcc0';ctx.strokeStyle='#6d7176';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x+w/2,cy,60,24,0,0,6.2832);ctx.fill();ctx.stroke();}}
    else{const C=tc(),bend=R&&!R.done?1:(R?1:0);ctx.strokeStyle=C.hair;ctx.lineWidth=1.8;const q=rng(9);for(let i=0;i<70;i++){const a=x+18+q()*(w-36),bb=y+50+q()*(h-70),near=Math.abs(a-(x+w/2))<110&&Math.abs(bb-(y+h/2))<70;ctx.beginPath();ctx.moveTo(a,bb);ctx.lineTo(a+(near&&bend?18:5),bb-(near&&bend?4:13));ctx.stroke();}
      if(R){ctx.fillStyle='#c94f7c';ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(-.1);rr(ctx,-120,-14,240,28,6);ctx.fill();ctx.restore();}}
    const el=R?R.el:0;lcd(ctx,x+70,LH-190,240,90,'STOPWATCH (s)',el.toFixed(1),k);
    bubble(ctx,R?(R.done?(coin?'I can’t feel it anymore.':'I can’t feel the ribbon anymore.'):'I can still feel it.'):'Eyes closed. Ready.',x+324,LH-190,266,k,R&&R.done?PAL['s3']:PAL['rj']);
    if(!coin){const size=13*k;wrapTxt(ctx,'Trials finished: '+b.rib.length,x+70,LH-74,300,{s:size,c:PAL['cv-soft']});}return;}}
function drawCompare(sim,ctx,k){const V=sim.vlab,size=12*k;benchHead(ctx,'Your data, site by site',k);
  const panel=(title,y,h,rows,max,unit)=>{txt(ctx,title,16,y,{s:13*k,w:700,c:PAL['cv-ink']});const lw=k>1.35?200:150,x0=16+lw,w=800-x0-70,rh=(h-14)/rows.length;
    rows.forEach((r,i)=>{const yy=y+12+i*rh,mid=yy+rh/2;txt(ctx,r.n,16,mid+size*.35,{s:size,c:PAL['cv-ink']});ctx.fillStyle=PAL['line'];ctx.fillRect(x0,yy+rh-2,w,1);
      if(r.v===null){txt(ctx,'no data yet',x0+4,mid+size*.35,{s:size,c:PAL['cv-soft']});return;}
      const bw=clamp(r.v/max,0,1)*w;ctx.fillStyle=PAL['s2'];ctx.fillRect(x0,yy+3,bw,rh-8);
      if(r.plus){ctx.fillStyle=PAL['s1'];const ax=x0+bw;ctx.beginPath();ctx.moveTo(ax+2,mid-11);ctx.lineTo(ax+18,mid);ctx.lineTo(ax+2,mid+11);ctx.closePath();ctx.fill();}
      txt(ctx,(r.plus?'more than ':'')+r.v+' '+unit,clamp(x0+bw+(r.plus?24:6),x0,800-10),mid+size*.35,{s:size,w:600,c:PAL['cv-ink'],a:(x0+bw+(r.plus?24:6)>800-size*7)?'right':'left'});});};
  const rowsA=A_SITES.map((s,i)=>{const a=parseThr(V.raw('c:t1a:thr:'+i)),e=parseThr(V.raw('c:t1a:ext:'+i));if(e&&!(e.plus&&a&&!a.plus))return {n:s.n,v:e.n,plus:e.plus};if(a)return {n:s.n,v:a.n,plus:a.plus};return {n:s.n,v:null};});
  const rowsB=B_SITES.map((s,i)=>{const v=V.val('t1b','dist',i);return {n:s.n,v:Number.isFinite(v)?v:null};});
  panel('1A: Two-point threshold',46+15*k,250,rowsA,60,'mm');panel('1B: Distance from the mark',46+15*k+268,250,rowsB,40,'mm');}

/* ---------- Definition ---------- */
const SKIN={
  id:'skin',hash:'skin',apUnit:9,order:3,kind:'Simulation',tab:'Skin and touch',labs:[LAB_TS],next:['neuron'],
  card:'Open a skin cross-section, press on a fingertip or a calf, and watch which receptor fires and how fast it adapts.',
  title:'Skin and touch',
  lede:{bio:'Explore the layers of the skin, then touch it. See which receptor fires, how long it keeps firing, and how the message reaches your brain.',
        honors:'Follow one stimulus through the skin, into an afferent neuron and up to the sensory cortex. Compare fast-adapting and slow-adapting receptors at different body sites.',
        ap:'Tune vibration frequency across receptor types, push heat past the pain threshold, and calculate how long the signal takes to reach the cortex on different nerve fibers.'},
  scale:'A block of skin and the fat under it. Skin is about 1 to 4 mm thick. The epidermis is about 0.1 mm on most of the body, and up to about 1.5 mm on the soles.',
  aspect:800/LH,timeScale:1,dtMax:0.002,prewarm:0,sampleDt:0.05,window:12,unit:'s',timeLabel:'Time',chChange:0,chReveal:5,
  controls:[
    {id:'view',label:'View',type:'seg',def:'explore',noTrial:true,options:[{v:'explore',l:'Explore structures'},{v:'test',l:'Test a stimulus'}]},
    {id:'part',label:'Structure',type:'select',def:'epidermis',noTrial:true,options:PARTS.map(x=>({v:x.id,l:x.n,lvl:x.lvl})),onChange(sim){sim.infoDirty=true;}},
    {id:'stim',label:'Stimulus',type:'seg',def:'touch',options:Object.keys(STIM).map(v=>({v,l:STIM[v]})),onChange:restart},
    {id:'site',label:'Body site',type:'select',def:'palm',options:Object.keys(SITES).map(v=>({v,l:SITES[v].n})),onChange:restart},
    {id:'S',label:'Stimulus strength',type:'range',min:0,max:100,step:5,def:60,unit:'%',help:'Heat runs from 34 to 48 °C and cold from 33 to 8 °C.'},
    {id:'f',label:'Vibration frequency',type:'range',min:5,max:400,step:5,def:250,unit:' Hz',lvl:'honors',help:'Only changes the Vibration stimulus.'},
    // virtual lab bench only
    {id:'tView',label:'Bench view',type:'seg',def:'bench',vlab:true,noTrial:true,options:[{v:'bench',l:'Bench'},{v:'compare',l:'Compare sites'}]},
    {id:'tSiteA',label:'Body site',type:'select',def:'handback',vlab:true,noTrial:true,options:A_SITES.map(s=>({v:s.id,l:s.n}))},
    {id:'tGap',label:'Toothpick spacing',type:'seg',def:0,vlab:true,noTrial:true,options:[0,5,10,15,20].map(v=>({v,l:v+' mm'}))},
    {id:'tGapX',label:'Extension card spacing',type:'seg',def:30,vlab:true,noTrial:true,options:[30,40,50].map(v=>({v,l:v+' mm'}))},
    {id:'tSiteB',label:'Body site',type:'select',def:'palm',vlab:true,noTrial:true,options:B_SITES.map(s=>({v:s.id,l:s.n})),onChange(sim){if(sim.vlab&&sim.vlab.bench)sim.vlab.bench.mark=null;}},
    {id:'tCoin',label:'Site',type:'seg',def:'hand',vlab:true,noTrial:true,options:[{v:'hand',l:'Back of hand'},{v:'arm',l:'Forearm'}]}
  ],
  actions:[
    {id:'apply',label:'Apply stimulus',primary:true,run(sim){if(isLab(sim)||!sim.st||sim.st.B)return;restart(sim);}},
    {id:'remove',label:'Remove stimulus',run(sim){const s=sim.st;if(!s||s.B||!s.on)return;s.onLog.push({a:s.t0,b:sim.t});s.on=false;s.tOff=sim.t;}},
    {id:'t-touch',label:'Touch the skin',primary:true,vlab:true,run(s){if(isLab(s))touch(s,s.p.tSiteA,+s.p.tGap);}},
    {id:'t-touchX',label:'Touch with the extension card',primary:true,vlab:true,run(s){if(isLab(s))touch(s,s.p.tSiteA,+s.p.tGapX);}},
    {id:'t-mark',label:'Touch it with the marker',primary:true,vlab:true,run(s){if(!isLab(s))return;const b=s.vlab.bench;b.mark=s.p.tSiteB;b.cur=null;}},
    {id:'t-point',label:'Partner tries to touch the spot',primary:true,vlab:true,enabled:s=>isLab(s)&&s.vlab.bench.mark===s.p.tSiteB&&!(s.vlab.bench.cur&&s.vlab.bench.cur.site===s.p.tSiteB),run(s){if(!isLab(s))return;const b=s.vlab.bench;if(b.mark!==s.p.tSiteB||(b.cur&&b.cur.site===s.p.tSiteB))return;locPlace(s);}},
    {id:'t-coin',label:'Place one coin and start the stopwatch',primary:true,vlab:true,enabled:s=>isLab(s)&&!(s.vlab.bench.run&&!s.vlab.bench.run.done),run(s){if(!isLab(s)||(s.vlab.bench.run&&!s.vlab.bench.run.done))return;startCoin(s,'one');}},
    {id:'t-stack',label:'Stack two more coins and restart the stopwatch',vlab:true,enabled:s=>{if(!isLab(s))return false;const R=s.vlab.bench.run;return !!R&&R.k==='coin'&&R.done&&R.ph==='one'&&R.site===s.p.tCoin;},run(s){if(!isLab(s))return;const R=s.vlab.bench.run;if(!(R&&R.k==='coin'&&R.done&&R.ph==='one'))return;startCoin(s,'stack');}},
    {id:'t-clear',label:'Take the coins off',vlab:true,run(s){if(isLab(s))s.vlab.bench.run=null;}},
    {id:'t-rib',label:'Bend the hairs with the ribbon',primary:true,vlab:true,enabled:s=>isLab(s)&&!(s.vlab.bench.run&&!s.vlab.bench.run.done),run(s){if(!isLab(s)||(s.vlab.bench.run&&!s.vlab.bench.run.done))return;startRib(s);}},
    {id:'t-rib-off',label:'Lift the ribbon',vlab:true,run(s){if(isLab(s))s.vlab.bench.run=null;}}
  ],
  init(sim){if(sim&&sim.vlab)return {B:true,sp:{},ct:{},acc:{},onLog:[],h:[],mx:{},on:false,t0:0,tOff:null};return {on:true,t0:.5,tOff:null,onLog:[],sp:{},ct:{},acc:{},h:[],mx:{},nextS:0};},
  step(sim,dt){const s=sim.st;if(!s)return;if(s.B){benchStep(sim,dt);return;}
    const ids=Object.keys(RESP[sim.p.stim]);for(const id of ids){if(!shown(id))continue;const r=rateOf(sim,id);s.mx[id]=Math.max(s.mx[id]||0,r);s.acc[id]=(s.acc[id]||0)+r*dt;
      if(s.acc[id]>=1){s.acc[id]-=1;const L=s.sp[id]||(s.sp[id]=[]);L.push(sim.t);s.ct[id]=(s.ct[id]||0)+1;if(L.length&&sim.t-L[0]>7)L.shift();if(L.length>1400)L.shift();}}
    if(sim.t>=s.nextS){s.nextS=sim.t+.05;s.h.push({t:sim.t,r:s.mx});s.mx={};if(s.h.length&&sim.t-s.h[0].t>13)s.h.shift();}},
  metrics:[
    {id:'rec',label:'Main receptor',lvl:'bio',text:true,noTrial:false,get:s=>{if(s.st&&s.st.B)return '';const m=mainRec(s.p);return m?REC[m].n:'None (too weak)';}},
    {id:'rate',label:'Firing rate now',unit:'spikes/s',lvl:'bio',min:0,max:null,d:0,get:s=>{if(!s.st||s.st.B)return 0;const m=mainRec(s.p);return m?rateOf(s,m):0;}},
    {id:'peak',label:'Peak firing rate',unit:'spikes/s',lvl:'bio',min:0,max:null,d:0,get:s=>{if(!s.st||s.st.B)return 0;const m=mainRec(s.p);return m?peakOf(s.p,m):0;}},
    {id:'pct',label:'Rate now as a share of peak',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>{if(!s.st||s.st.B)return 0;const m=mainRec(s.p),q=m?peakOf(s.p,m):0;return q?clamp(rateOf(s,m)/q*100,0,100):0;}},
    {id:'on',label:'Time stimulus has been on',unit:'s',lvl:'bio',min:0,max:null,d:1,get:s=>{if(!s.st||s.st.B||!s.st.on)return 0;return Math.max(0,s.t-s.st.t0);}},
    {id:'two',label:'Two-point threshold at this site',unit:'mm',lvl:'bio',min:0,max:50,d:0,get:s=>SITES[s.p.site].T},
    {id:'ttime',label:'Time for the signal to reach the cortex',unit:'ms',lvl:'ap',min:0,max:null,d:0,get:s=>travelMs(s.p)},
    {id:'fib',label:'Nerve fiber',lvl:'ap',text:true,get:s=>{const m=mainRec(s.p);if(!m)return '-';const R=REC[m];return R.fib+' at about '+R.v+' m/s';}}
  ],
  graphs:[{id:'rates',label:'Firing rate of each receptor',custom:true}],defaultGraph:'rates',
  plot(sim,ctx,box){const s=sim.st;if(!s||s.B)return;const win=12,xmax=Math.max(win,sim.t),xmin=xmax-win,ids=listFor(sim.p);let top=20;
    s.h.forEach(h=>{ids.forEach(i=>{if(h.t>=xmin&&(h.r[i]||0)>top)top=h.r[i];});});
    box.T=34;box.H=box.ch-34-40;const ax=axes(ctx,box,{xmin,xmax,ymin:0,ymax:top*1.1,xl:'Time (s)',yl:'Firing rate (spikes/s)'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ids.forEach((id,i)=>{ctx.strokeStyle=serColor(i);ctx.lineWidth=2.2;ctx.lineJoin='round';ctx.beginPath();let first=true;s.h.forEach(h=>{if(h.t<xmin)return;const x=ax.X(h.t),y=ax.Y(h.r[id]||0);if(first){ctx.moveTo(x,y);first=false;}else ctx.lineTo(x,y);});ctx.stroke();});ctx.restore();
    legend(ctx,box.L,14,ids.slice(0,3).map((id)=>({label:REC[id].sh,color:serColor(ids.indexOf(id))})));},
  challenges:[
    {lvl:'bio',q:'A light touch lands on a fingertip and stays there. What does the Meissner’s corpuscle do?',choices:['Fires steadily the whole time','Fires a quick burst, then goes quiet while the touch continues','Never fires'],correct:1,
     baseline:{view:'test',site:'fingertip',stim:'touch',S:60},watch:'rates',at:0,reveal:4,changeText:'A steady light touch is on the fingertip',
     explain:'Meissner’s corpuscles adapt fast. They report that a touch started and then fall silent, even though the touch is still there. That is why you stop noticing a ring or a shirt.'},
    {lvl:'bio',q:'Same steady touch. What does the Merkel cell do?',choices:['Goes silent as fast as Meissner’s corpuscle','Fires a burst, then keeps firing at a lower rate','Fires only when the touch ends'],correct:1,
     baseline:{view:'test',site:'fingertip',stim:'touch',S:60},watch:'rates',at:0,reveal:6,changeText:'A steady light touch is on the fingertip',
     explain:'Merkel cells adapt slowly. They slow down but keep firing while the touch lasts, which is how you can tell you are still holding a pencil and feel its edges.'},
    {lvl:'bio',q:'Light touch on the back of the hand, which is hairy skin with few Meissner’s corpuscles. Which fast-adapting receptor reports the touch here?',choices:['Hair follicle receptor','Meissner’s corpuscle','Pacinian corpuscle'],correct:0,
     baseline:{view:'test',site:'handback',stim:'touch',S:60},watch:'rates',at:0,reveal:3,changeText:'A light touch on the back of the hand',
     explain:'Nerve fibers wrapped around each hair follicle fire when a hair bends. On hairy skin they play the fast-adapting role that Meissner’s corpuscles play on fingertips.'},
    {lvl:'honors',q:'Press deep and hold for 3 s, then let go. When does the Pacinian corpuscle fire?',choices:['Steadily for all 3 s','Only at the very start','At the start and again when you let go'],correct:2,
     baseline:{view:'test',site:'palm',stim:'press',S:80},changeAction:'remove',changeText:'The pressure was released',watch:'rates',at:3.5,reveal:5.5,
     explain:'Pacinian corpuscles respond to change. Pressure deforms the layers at the start, the layers slide and absorb it, and releasing deforms them again. In between they stay quiet.'},
    {lvl:'honors',q:'Vibrate the fingertip at 250 Hz, then drop to 30 Hz. What happens?',choices:['Pacinian corpuscle keeps leading','Meissner’s corpuscle takes over at 30 Hz','Merkel cell takes over at 30 Hz'],correct:1,
     baseline:{view:'test',site:'fingertip',stim:'vib',S:60,f:250},change:{f:30},changeText:'Vibration dropped from 250 to 30 Hz',watch:'rates',at:3,reveal:6,
     explain:'Each receptor has a best frequency. Pacinian corpuscles are most sensitive near 250 Hz. Meissner’s corpuscles work best at about 10 to 50 Hz, a slow flutter.'},
    {lvl:'ap',q:'Heat the palm from 42 °C to 47 °C. What changes?',choices:['Nothing changes, because heat fibers already fire','Pain free nerve endings start firing as well','Merkel cells take over'],correct:1,
     baseline:{view:'test',site:'palm',stim:'heat',S:60},change:{S:95},changeText:'Heat raised to about 47 °C',watch:'rates',at:3,reveal:6,
     explain:'Above about 45 °C heat becomes a threat to tissue, and nociceptors (pain free nerve endings) join in. That is why a hot shower can go from pleasant to painful with a small change.'},
    {lvl:'ap',instant:true,q:'A heat signal starts at the sole of the foot, on a path of 1.7 m, along a C fiber at 1 m/s. About how long until it reaches the cortex?',choices:['About 34 ms','About 113 ms','About 1.7 s','About 17 s'],correct:2,
     explain:'Time = distance ÷ speed = 1.7 m ÷ 1 m/s = 1.7 s. The same path on an Aβ touch fiber at 50 m/s takes about 34 ms, and an Aδ fiber at 15 m/s takes about 113 ms. This is why you feel a stubbed toe first and the slow ache a moment later.'}
  ],
  narrate(sim){if(isLab(sim)){const b=sim.vlab.bench,e=b.ex;if(sim.p.tView==='compare')return 'These bars come from <b>your own tables</b>. An arrow means the card ran out, so the true threshold is higher than the bar shows.';
      if(e==='1A'||e==='1X'){const last=b.last;return last&&last.site===sim.p.tSiteA?'<b>'+last.g+' mm:</b> your partner reported '+(last.a==='two'?'two points':'one point')+'. '+(last.a==='two'?'That spacing crossed the threshold at this site.':'Both toothpicks may be landing in one receptive field. Raise the spacing.'):'Set the spacing and touch the skin. Your partner’s eyes stay closed.';}
      if(e==='1B')return 'Read the ruler from the center of the blue dot to the center of the red dot. A big miss means the touch landed in a large receptive field.';
      if(e==='2A'||e==='2B'){const R=b.run;if(!R)return e==='2A'?'A coin is a steady stimulus. Watch how long the feeling lasts.':'A held ribbon bends the hairs and then stays still. Hair receptors report that change.';return R.done?'<b>Stopwatch stopped.</b> The stimulus is still on the skin, but the receptors have stopped reporting it. Read the time and record it.':'The stopwatch is running. Your partner speaks up when the feeling fades. Use Speed to shorten the wait.';}
      return 'Your lab partner is ready. Follow the steps beside the bench.';}
    const p=sim.p,s=sim.st,S=SITES[p.site];
    if(p.view==='explore'){const q=partBy(p.part);return '<b>'+q.n+'.</b> '+q.d;}
    const m=mainRec(p);if(!m)return 'This stimulus is too weak to reach any receptor’s threshold at the '+S.n.toLowerCase()+'. Raise the strength.';
    const R=REC[m],r=rateOf(sim,m),pk=peakOf(p,m);
    if(!s.on){return '<b>The stimulus is gone.</b> '+(p.stim!=='vib'&&RESP[p.stim][m][3]&&r>1?R.n+' fires again as the skin springs back. It reports the change.':'The receptors go quiet.');}
    if(sim.t<s.t0)return 'A '+STIM[p.stim].toLowerCase()+' stimulus is about to reach the '+S.n.toLowerCase()+'.';
    const a=sim.t-s.t0;
    if(p.stim==='vib')return '<b>'+R.n+'</b> follows the vibration: it fires about '+Math.round(r)+' spikes/s at '+p.f+' Hz, and it keeps firing because the skin keeps changing.';
    const frac=pk?r/pk:0;
    if(frac>.7)return '<b>'+R.n+'</b> just fired at about '+Math.round(r)+' spikes/s. A sudden change gives the strongest signal.';
    if(frac>.05)return '<b>'+R.n+' is adapting.</b> The stimulus has not changed for '+a.toFixed(1)+' s, so the rate has fallen to '+Math.round(frac*100)+'% of its peak.';
    const sl=listFor(p).filter(x=>x!==m&&REC[x].ad==='slow'&&rateOf(sim,x)>1);
    return '<b>'+R.n+' has adapted and gone quiet</b> while the stimulus stays on.'+(sl.length?' The '+REC[sl[0]].n+' keeps firing at '+Math.round(rateOf(sim,sl[0]))+' spikes/s, so you still know the touch is there.':'');},
  infoPanel(sim){if(isLab(sim))return '';const p=sim.p,q=partBy(p.part);if(p.view==='explore'&&q)return '<h3>'+q.n+'</h3><p><b>Where:</b> '+q.l+'</p><p>'+q.d+'</p><p class="muted">Tap the stage or use the Structure list to choose another.</p>';
    const m=mainRec(p);if(!m)return '<h3>No receptor is firing</h3><p>The stimulus is below threshold. Raise the strength.</p>';const R=REC[m],S=SITES[p.site];
    const fibers=atLeast('ap')?('<p><b>Signal:</b> '+R.fib+' fiber at about '+R.v+' m/s, '+S.dist+' m to the cortex, about '+Math.round(travelMs(p))+' ms.</p>'):'';
    return '<h3>'+R.n+'</h3><p><b>Adapts:</b> '+R.ad+'.</p><p><b>At this site:</b> '+S.n+' has a two-point threshold of about '+S.T+' mm. '+(S.T<=10?'Receptors are packed close together.':'Receptors are spread far apart.')+'</p>'+fibers+(sim.vis.tap&&partBy(sim.vis.tap)?'<p><b>You tapped '+partBy(sim.vis.tap).n+':</b> '+partBy(sim.vis.tap).d+'</p>':'');},
  onClick(sim,x,y){if(isLab(sim))return;const p=sim.p;
    if(p.view==='explore'){if(x>=ZOOM.x&&y<ZOOM.y+ZOOM.h){const rs=zoomRows(sim),bs=rs[rs.length-1],by=bs.y+bs.h*.55,ss=rs.find(o=>o.id==='spinosum'),near=(a,b)=>Math.hypot(a-x,b-y)<20;if(near(ZOOM.x+ZOOM.w-60,by)){BioLab.setValues(sim,{part:'melanocyte'});return;}if(near(ZOOM.x+ZOOM.w-26,by)){BioLab.setValues(sim,{part:'merkel'});return;}if(atLeast('honors')&&near(ZOOM.x+ZOOM.w-40,ss.y+ss.h*.5)){BioLab.setValues(sim,{part:'langerhans'});return;}const r=rs.find(o=>y>=o.y&&y<o.y+o.h);if(r)BioLab.setValues(sim,{part:r.id});return;}
      if(x<SEC.x+SEC.w){const g=geom(SEC);let best=null,dmin=26;Object.keys(g.at).forEach(id=>{if(id==='ruffini'&&!atLeast('ap'))return;if(id==='papillae'&&!atLeast('honors'))return;const q=g.at[id],d=Math.hypot(q[0]-x,q[1]-y);if(d<dmin){dmin=d;best=id;}});
        if(!best)best=layerAt(g,x,y);if(best)BioLab.setValues(sim,{part:best});}return;}
    const g=geom(SEC2);if(x<SEC2.x+SEC2.w){let best=null,dmin=26;Object.keys(g.at).forEach(id=>{if(id==='ruffini'&&!atLeast('ap'))return;if(id==='papillae'&&!atLeast('honors'))return;const q=g.at[id],d=Math.hypot(q[0]-x,q[1]-y);if(d<dmin){dmin=d;best=id;}});if(best){BioLab.setValues(sim,{part:best});sim.vis.tap=best;}}},
  tour:[
    {title:'Three layers',text:'Skin has an epidermis on top and a dermis below it. The hypodermis underneath is mostly fat and is not actually part of the skin. All together, your skin covers about 2.2 m² and makes up about 15% of your body weight.',focus:[10,10,505,600],pause:true,setup(sim){BioLab.setValues(sim,{view:'explore',part:'epidermis',site:'palm'});}},
    {title:'The epidermis rebuilds itself',text:'The stratum basale makes new keratinocytes, and they get pushed upward through the strata, flattening and dying on the way. Watch them rise. You grow a whole new epidermis every 25 to 45 days, with no blood vessels in this layer.',focus:[525,10,265,470],speed:1,setup(sim){BioLab.setValues(sim,{view:'explore',part:'basale',site:'palm'});}},
    {title:'What lives in the dermis',text:'The dermis holds the working parts: capillary loops, hair follicles with arrector pili and sebaceous glands, sudoriferous glands, and most of the touch receptors. Tap any of them.',focus:[10,60,505,420],pause:true,setup(sim){BioLab.setValues(sim,{view:'explore',part:'dermis'});}},
    {title:'A touch begins: fast adapters',text:'A steady touch lands on the fingertip. Meissner’s corpuscle fires a quick burst, then goes quiet, even though the touch has not stopped. It only reports the change. Look at the first row of spikes.',focus:[400,214,390,246],speed:.4,setup(sim){BioLab.setValues(sim,{view:'test',stim:'touch',site:'fingertip',S:60});BioLab.reset(sim);}},
    {title:'Slow adapters keep talking',text:'The Merkel cell fires too, but its rate falls slowly and never reaches zero while the touch lasts. Fast adapters tell you what just changed. Slow adapters tell you what is still there.',focus:[400,214,390,246],speed:1,setup(sim){BioLab.setValues(sim,{view:'test',stim:'touch',site:'fingertip',S:60});BioLab.reset(sim);}},
    {title:'Deep pressure and vibration',text:'The Pacinian corpuscle sits deep and is layered like an onion. It fires at each change in pressure and follows fast vibration. At 250 Hz it fires hundreds of spikes every second and does not adapt away, because the skin keeps changing.',focus:[10,10,780,450],speed:1,setup(sim){BioLab.setValues(sim,{view:'test',stim:'vib',site:'fingertip',f:250,S:80});BioLab.reset(sim);}},
    {title:'Heat, cold and pain',text:'Free nerve endings sense heat, cold, pain, itch and tickle. Heat adapts only partly, and pain adapts very little. Pain is a warning, so it keeps talking until the danger is gone.',focus:[10,10,780,450],speed:1,setup(sim){BioLab.setValues(sim,{view:'test',stim:'pain',site:'fingertip',S:70});BioLab.reset(sim);}},
    {title:'Four parts of a sensation',text:'Every sensation needs four things: a stimulus, a receptor that detects it, an afferent pathway that carries the signal to the central nervous system, and a sensory cortex that makes sense of it. Lose any one and you feel nothing.',focus:[0,464,800,156],speed:1,setup(sim){BioLab.setValues(sim,{view:'test',stim:'touch',site:'fingertip',S:60});BioLab.reset(sim);}},
    {title:'Why body site matters',text:'Now the stimulus moves to the back of the calf. There are far fewer touch receptors here, and the two-point threshold rises from about 3 mm at the fingertip to about 45 mm. Same touch, much blurrier picture.',focus:[400,10,390,196],speed:1,setup(sim){BioLab.setValues(sim,{view:'test',stim:'touch',site:'calf',S:60});BioLab.reset(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{view:'explore',stim:'touch',site:'palm',part:'epidermis',S:60,f:250});},
  lab:{bio:'<p><b>Question:</b> Which receptors adapt fast, and which adapt slowly?</p><ol><li>Choose <b>Test a stimulus</b> and the Palm.</li><li>Test Light touch, Deep pressure, Heat and Pain, one at a time. After 5 s, record a trial.</li><li>Compare <b>Rate now as a share of peak</b> for each main receptor.</li></ol><p>Which receptor falls silent fastest? Why would your body want some receptors to stop reporting a stimulus?</p>',
       honors:'<p><b>Question:</b> How does a receptor’s adaptation differ from a site’s sharpness?</p><ol><li>Apply Light touch at the Fingertip, Palm, Back of hand and Back of calf. Record the main receptor and two-point threshold at each.</li><li>Now apply Vibration at the Fingertip. Record the main receptor at 10, 30, 60, 120, 250 and 400 Hz.</li></ol><p>Explain why the main receptor changes with the site and with the frequency.</p>',
       ap:'<p><b>Question:</b> How long does each signal take to reach the cortex?</p><ol><li>At the Sole of foot, Fingertip and Lip, read the time for Light touch and for Heat.</li><li>Calculate each from time = distance ÷ speed and check it against the readout.</li></ol><p><b>Claim–evidence–reasoning:</b> A person steps on a tack. Explain why they pull back before the deep ache arrives, using fiber speeds from your data.</p>'},
  terms:[{t:'Epidermis',d:'The top layer of skin: epithelial tissue with no blood vessels and 5 strata in thick skin.'},{t:'Dermis',d:'The connective-tissue layer under the epidermis, with its top 1/5 papillary and bottom 4/5 reticular.'},{t:'Hypodermis',d:'The subcutaneous fat layer under the skin. It is not part of the skin.'},{t:'Keratinocyte',d:'The main cell of the epidermis, about 90% of its cells. It makes keratin.'},{t:'Receptor adaptation',d:'A drop in a receptor’s firing while a stimulus stays the same.'},{t:'Meissner’s corpuscle',d:'A fast-adapting light touch receptor in the dermal papillae of hairless skin.'},{t:'Merkel cell',d:'A slow-adapting light touch receptor in the stratum basale.'},{t:'Pacinian corpuscle',d:'A fast-adapting deep pressure and vibration receptor, layered like an onion.'},{t:'Free nerve endings',d:'Bare nerve branches that sense pain, heat, cold, itch and tickle.'},{t:'Afferent',d:'Carrying a signal toward the central nervous system.'},{t:'Two-point threshold',d:'The smallest spacing at which two touches feel like two.'},
    {lvl:'honors',t:'Receptive field',d:'The patch of skin one sensory neuron watches over.'},{lvl:'honors',t:'Neural convergence',d:'Many receptors feeding one path to the brain, which blurs where a touch happened.'},{lvl:'honors',t:'Dermal papillae',d:'Bumps of dermis that push into the epidermis and form fingerprint ridges.'},
    {lvl:'ap',t:'Aβ, Aδ and C fibers',d:'Afferent fibers that carry signals at about 50, 15 and 1 m/s.'},{lvl:'ap',t:'Nociceptor',d:'A free nerve ending that responds to stimuli strong enough to threaten tissue.'}],
  about:'<p><b>Model.</b> Each receptor’s firing rate follows rate = strength × (sustained + (peak − sustained) × e<sup>−t/τ</sup>). Time constants: Pacinian corpuscle 0.02 s, Meissner’s corpuscle 0.15 s, hair follicle receptor 0.2 s, Merkel cell about 1.5 to 2 s, heat and cold endings 6 s, pain endings 20 s. Fast adapters also fire a short burst when a stimulus ends. Vibration tuning uses a best frequency of about 250 Hz for Pacinian corpuscles, about 30 Hz for Meissner’s corpuscles and hair follicle receptors, and about 8 Hz for Merkel cells. Conduction speeds are typical values: Aβ 50, Aδ 15 and C 1 m/s.</p><p><b>What is simplified.</b> Rates are illustrative for one fiber, shaped to match the published pattern of each receptor type. Thermal adaptation is really slower and more complicated than one time constant. Some heat signals travel on Aδ fibers and pain on both Aδ and C fibers, and we show only one. Real receptors are not spread evenly, and a real block of skin never holds every structure at once: the explorer is a composite. Two-point thresholds are Weinstein-style adult averages, which vary between people and studies. Signal travel time ignores the short delays at synapses.</p><p><b>Virtual lab.</b> Your partner’s answers come from those same threshold averages plus random variation. Tactile localization values (about 5 mm on the palm to about 16 mm on the calf) are estimates for the marker method, which includes pointing error, and are larger than published point-localization thresholds. Coin and ribbon times are classroom-style estimates. Real class results vary a lot. The handout’s card stops at 20 mm, so we added an optional extension card. The suture lab stays hands-on in class.</p>',
  initVis(sim){},
  draw,
  thumbSetup(sim){sim.p.view='test';sim.p.site='fingertip';},thumbFrames:40
};
BioLab.register(SKIN);
})();
