(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,atLeast,PAL,FONT,RM,axes,legend}=BioLab.h;

/* Breathing and gas exchange.
   Ventilation: alveolar CO2 follows PaCO2 = 863 x VCO2 / VA (the alveolar ventilation equation).
   Alveolar O2 follows the alveolar gas equation, PAO2 = 0.2093 x (PB - 47) - PaCO2 / 0.8.
   Hemoglobin follows a Hill curve (P50 26.8 mmHg, n 2.7): 100 mmHg gives 97%, 40 mmHg gives 75%.
   Loading along the capillary: PO2(t) = PA - (PA - Pv) exp(-t/tau), with tau scaled by surface area and membrane thickness. */
const DEOX='#7c1f33',OXY='#e2363c',LUNG='#c98b90',MUS='#b4514f',O2C='#1793a8',CO2C='#c27a00';
const hex=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
const mix=(a,b,t)=>{const A=hex(a),B=hex(b);t=clamp(t,0,1);return 'rgb('+A.map((v,i)=>Math.round(lerp(v,B[i],t))).join(',')+')';};
const ALT={sea:{n:'Sea level',m:0,ft:0,pb:760,pco2:40},denver:{n:'Denver',m:1609,ft:5280,pb:630,pco2:36},fourteener:{n:'A Colorado 14er',m:4300,ft:14100,pb:455,pco2:30},everest:{n:'Summit of Everest',m:8849,ft:29032,pb:253,pco2:8}};
const ACT={rest:{n:'Resting',vco2:.2,ext:.224,tr:.75},walk:{n:'Walking',vco2:.8,ext:.35,tr:.5},run:{n:'Running',vco2:2.2,ext:.55,tr:.3}};
const VD=.15,TAU0=.06;
const hill=P=>{const a=Math.pow(Math.max(P,.1),2.7);return a/(a+Math.pow(26.8,2.7));};
const hillInv=S=>{S=clamp(S,.02,.995);return 26.8*Math.pow(S/(1-S),1/2.7);};
const piO2=a=>.2093*(a.pb-47);
const areaOf=p=>p.balloon?.16:p.area;
const tauOf=p=>TAU0*(70/areaOf(p))*(p.thick/.5);
function veOf(VA){let VE=Math.max(VA,1),TV=.42;for(let i=0;i<5;i++){TV=clamp(.42*Math.pow(VE/6.3,.6),.25,3.5);VE=VA/(1-VD/TV);}return {VE,TV,RR:VE/TV};}

function gas(sim,s,p,dt){const A=ALT[p.alt],C=ACT[p.act],Pset=A.pco2;
  s.vc+=(C.vco2-s.vc)*dt/30;
  const need=863*C.vco2/Pset,rest=863*.2/Pset,ffT=rest+.55*(need-rest);s.vaff+=(ffT-s.vaff)*dt/40;
  if(s.holding){s.holdT+=dt;s.Ps+=.1*(s.vc/.2)*dt;s.P+=((s.Ps+6)-s.P)*dt/8;s.PA=Math.max(20,s.PA-.4*(s.vc/.2)*dt);s.VA=0;
    if(s.P>=Pset+15){s.holding=false;s.broke=s.holdT;s.lastHold=s.holdT;s.minO2=s.PA;sim.infoDirty=true;}}
  else{const fb=clamp(1+.4*(s.P-Pset),.25,4);let VA=s.vaff*fb;const hv=s.hv>0;if(hv){VA=Math.max(VA,10);s.hv=Math.max(0,s.hv-dt);}
    s.VA=VA;s.P+=((863*s.vc/VA)-s.P)*dt/(hv?18:12);s.P=Math.max(5,s.P);s.Ps+=(s.P-s.Ps)*dt/(hv?30:60);
    const eq=Math.max(15,piO2(A)-s.P/.8);s.PA+=(eq-s.PA)*dt/4;}
  const v=veOf(Math.max(s.VA,.01));if(!s.holding){s.VE=v.VE;s.TV=v.TV;s.RR=v.RR;}else{s.VE=0;s.RR=0;}
  // gas exchange
  const tr=C.tr,tau=tauOf(p);s.Pc=s.PA-(s.PA-s.Pv)*Math.exp(-tr/tau);s.Sa=hill(s.Pc);
  const Sv=Math.max(.12,s.Sa-C.ext*(s.Sa>.5?1:s.Sa/.5));s.Sv=Sv;s.Pv+=(hillInv(Sv)-s.Pv)*dt/2;
  s.Pvc=s.P+5+(C.vco2-.2)*3;
  // breathing phase: inhale 0 to 0.4, exhale 0.4 to 1
  if(s.holding){s.ph+=(.4-s.ph)*Math.min(1,dt*3);}else{s.ph=(s.ph+dt*s.RR/60)%1;}}
function breath(s){const ph=s.ph;let V,Pa,dir;if(ph<.4){const u=ph/.4;V=Math.pow(Math.sin(u*Math.PI/2),2);Pa=-Math.sin(u*Math.PI);dir=1;}else{const u=(ph-.4)/.6;V=Math.pow(Math.cos(u*Math.PI/2),2);Pa=Math.sin(u*Math.PI);dir=-1;}
  if(s.holding){dir=0;Pa=0;}const sc=clamp(s.TV/.45,1,4);return {V,Pa:Pa*(s.TV>0?Math.sqrt(sc)*(s.RR/15>1?Math.sqrt(s.RR/15):1):1),dir};}

function sync(sim){if(!sim.ui||!sim.ui.tiles)return;const v=sim.p.view;
  sim.def.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const e=t.num.closest('.tile');if(e)e.hidden=!atLeast(m.lvl)||!m.views.includes(v);});
  sim.def.controls.forEach(c=>{if(!c.views)return;const w=sim.ui.ctlW&&sim.ui.ctlW[c.id];if(w)w.hidden=!atLeast(c.lvl)||!c.views.includes(v);});
  sim.def.actions.forEach(a=>{const b=sim.ui.actB&&sim.ui.actB[a.id];if(b)b.hidden=!atLeast(a.lvl)||!a.views.includes(v);});}
function wrap(ctx,s,x,y,maxW,o,lh){o=o||{};ctx.font=(o.w||400)+' '+(o.s||13)+'px '+FONT;const words=String(s).split(' ');let line='',yy=y;const out=[];words.forEach(w=>{const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){out.push(line);line=w;}else line=t;});if(line)out.push(line);out.forEach(l=>{txt(ctx,l,x,yy,o);yy+=lh||(o.s||13)*1.25;});return yy;}
const r0=v=>Math.round(v);
function panel(ctx,x,y,w,h){ctx.fillStyle=PAL['card'];rr(ctx,x,y,w,h,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}

function drawVent(sim,ctx,k,t){const s=sim.st,p=sim.p,B=breath(s),A=ALT[p.alt],amp=.5+.5*clamp((s.TV-.42)/1.6,0,1),u=(s.holding?1:B.V)*amp;
  const cx=235;ctx.save();ctx.beginPath();ctx.rect(0,0,470,600);ctx.clip();
  BioLab.body.draw(ctx,{cx,top:-200,h:1500,fill:PAL['card2'],stroke:PAL['cv-soft'],marks:false});
  const domeY=lerp(305,345,u),lift=u*16,wide=1+.07*u;
  // lungs
  [-1,1].forEach(d=>{ctx.save();ctx.translate(cx,0);ctx.scale(d*wide,1);ctx.fillStyle=LUNG;ctx.beginPath();ctx.moveTo(16,110);ctx.bezierCurveTo(50,70,120,86,142,170);ctx.bezierCurveTo(156,230,158,domeY-20,150,domeY+22);ctx.bezierCurveTo(110,domeY-14,60,domeY-30,26,domeY-22);ctx.bezierCurveTo(32,220,20,160,16,110);ctx.closePath();ctx.fill();ctx.strokeStyle='#8d5158';ctx.lineWidth=2;ctx.stroke();ctx.restore();});
  // airway
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=20;ctx.beginPath();ctx.moveTo(cx,-6);ctx.lineTo(cx,96);ctx.moveTo(cx-44,132);ctx.lineTo(cx,96);ctx.lineTo(cx+44,132);ctx.stroke();
  ctx.strokeStyle=PAL['cv-bg'];ctx.lineWidth=12;ctx.stroke();
  // air moving
  if(B.dir){const n=7;ctx.fillStyle=PAL['s6'];for(let i=0;i<n;i++){const f=((t*(B.dir>0?.6:-.6)*Math.min(3,s.RR/15+.2)+i/n)%1+1)%1,lane=i%2?-1:1,y=f*130,x=y<96?cx+(i%3-1)*2.5:cx+lane*(y-96)*1.3;ctx.beginPath();ctx.arc(x,y,3.4,0,6.29);ctx.fill();}}
  // ribs
  ctx.strokeStyle='#a8a08a';ctx.lineWidth=7;ctx.lineCap='round';for(let i=0;i<6;i++){const y0=110+i*38,yEnd=y0+36-lift*(1+i*.15);[-1,1].forEach(d=>{ctx.beginPath();ctx.moveTo(cx+d*22,y0);ctx.quadraticCurveTo(cx+d*(120*wide),y0-8,cx+d*(172*wide),yEnd);ctx.stroke();});}
  // diaphragm
  ctx.strokeStyle=MUS;ctx.lineWidth=11;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx-168*wide,domeY+42);ctx.quadraticCurveTo(cx-78,domeY-58+u*38,cx,domeY-22+u*22);ctx.quadraticCurveTo(cx+78,domeY-58+u*38,cx+168*wide,domeY+42);ctx.stroke();
  ctx.restore();
  txt(ctx,'Trachea',cx+22,34,{s:12.5*k,w:700,c:PAL['cv-ink']});
  txt(ctx,'Lung',cx-92,200,{s:13*k,w:800,c:'#fff',a:'center',b:'middle'});txt(ctx,'Lung',cx+92,200,{s:13*k,w:800,c:'#fff',a:'center',b:'middle'});
  txt(ctx,'Diaphragm',cx,domeY+52+10*k,{s:13*k,w:800,c:PAL['cv-ink'],a:'center'});
  txt(ctx,'Ribs',cx+182,226,{s:12.5*k,w:700,c:PAL['cv-ink']});
  // panel
  const px=478,pw=314;panel(ctx,px,10,pw,580);const inh=B.dir>0,exh=B.dir<0;
  let y=12+20*k;txt(ctx,s.holding?'Holding your breath':inh?'Breathing in':'Breathing out',px+14,y,{s:15*k,w:800,c:PAL['s1']});y+=20*k;
  const steps=s.holding?['Diaphragm held down','Lungs stay full','No air moving','Blood CO₂ climbing']:inh?['Diaphragm contracts, flattens','Rib muscles lift ribs','Chest volume goes up','Air pressure inside goes down','Air flows in']:['Diaphragm relaxes, domes up','Ribs drop','Chest volume goes down','Air pressure inside goes up','Air flows out'];
  steps.forEach((a,i)=>{const on=s.holding||(((inh?s.ph/.4:(s.ph-.4)/.6)*steps.length)>=i);y=wrap(ctx,(i+1)+'. '+a,px+14,y,pw-26,{s:12.5*k,w:on?700:400,c:on?PAL['cv-ink']:PAL['cv-soft']},15*k)+2;});
  y+=6;
  // pressure bar
  txt(ctx,atLeast('ap')?'Lung pressure vs outside air':'Pressure in the lungs',px+14,y,{s:12*k,w:700,c:PAL['cv-soft']});y+=8;
  const bx=px+14,bw=pw-28,mid=bx+bw/2,bh=14;ctx.fillStyle=PAL['card2'];rr(ctx,bx,y,bw,bh,5);ctx.fill();const pv=clamp(B.Pa/4,-1,1)*(bw/2);ctx.fillStyle=B.Pa<0?PAL['s2']:PAL['s4'];ctx.fillRect(Math.min(mid,mid+pv),y+1,Math.abs(pv),bh-2);ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(mid-1,y-3,2,bh+6);y+=bh+15*k;
  txt(ctx,'lower',bx,y-4,{s:12*k,c:PAL['cv-soft']});txt(ctx,'higher',bx+bw,y-4,{s:12*k,c:PAL['cv-soft'],a:'right'});if(atLeast('ap'))txt(ctx,(B.Pa>0?'+':'')+B.Pa.toFixed(1)+' mmHg',mid,y-4,{s:12*k,w:700,a:'center'});y+=8;
  // brain stem
  const room=k<1.3;if(room){y+=4;txt(ctx,'Lung volume: '+(2.4+s.TV*(s.holding?1:B.V)).toFixed(1)+' L',px+14,y+6,{s:12*k,w:700,c:PAL['cv-soft']});y+=14;ctx.fillStyle=PAL['card2'];rr(ctx,bx,y,bw,14,5);ctx.fill();ctx.fillStyle=PAL['s6'];rr(ctx,bx,y,Math.max(4,bw*clamp((2.4+s.TV*(s.holding?1:B.V))/6,0,1)),14,5);ctx.fill();y+=30;
    y=wrap(ctx,'Boyle’s law: more volume, less pressure. Air always flows from high pressure to low.',px+14,y,pw-28,{s:12*k,c:PAL['cv-soft']},15)+4;}
  const cy=room?y+4:Math.max(y,455);ctx.fillStyle=PAL['card2'];rr(ctx,px+10,cy,pw-20,Math.min(room?92:999,588-cy-8),8);ctx.fill();
  let yy=cy+16*k;yy=wrap(ctx,'Brain stem senses blood CO₂: '+s.P.toFixed(1)+' mmHg',px+20,yy,pw-40,{s:12*k,w:700},15*k);
  yy=wrap(ctx,s.holding?'Urge to breathe is growing':'Sets breathing at '+r0(s.RR)+' per minute',px+20,yy,pw-40,{s:12*k},15*k);
  if(atLeast('honors')&&room)wrap(ctx,'Air pressure at '+A.n.toLowerCase()+': '+A.pb+' mmHg',px+20,yy,pw-40,{s:12*k,c:PAL['cv-soft']},15*k);
}

function drawExch(sim,ctx,k,t,internal){const s=sim.st,p=sim.p,v=sim.vis,hon=atLeast('honors'),A=ALT[p.alt];
  const topO=internal?s.Pv:s.PA,topC=internal?s.Pvc:s.P,inO=internal?s.Pc:s.Pv,inC=internal?s.P:s.Pvc,outO=internal?s.Pv:s.Pc,outC=internal?s.Pvc:s.P,inS=internal?s.Sa:s.Sv,outS=internal?s.Sv:s.Sa;
  const x0=12,w=446,chamberTop=14,chamberH=282,capY=330,capH=84;
  // chamber
  if(internal){ctx.fillStyle='#b97a6b';rr(ctx,x0,chamberTop,w,chamberH,18);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=2;for(let i=1;i<3;i++){ctx.beginPath();ctx.moveTo(x0+i*w/3,chamberTop+8);ctx.lineTo(x0+i*w/3,chamberTop+chamberH-8);ctx.stroke();}}
  else{ctx.fillStyle=PAL['card2'];ctx.beginPath();ctx.moveTo(x0,chamberTop+chamberH);ctx.lineTo(x0,chamberTop+130);ctx.bezierCurveTo(x0,chamberTop-30,x0+w,chamberTop-30,x0+w,chamberTop+130);ctx.lineTo(x0+w,chamberTop+chamberH);ctx.closePath();ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2.5;ctx.stroke();}
  const inkTop=internal?'#fff':PAL['cv-ink'];
  txt(ctx,internal?'Body cells (muscle)':'Alveolus (air sac)',x0+w/2,chamberTop+26+12*k,{s:14*k,w:800,c:inkTop,a:'center'});
  if(hon)txt(ctx,'O₂ '+r0(topO)+' mmHg, CO₂ '+r0(topC)+' mmHg',x0+w/2,chamberTop+26+29*k,{s:12.5*k,w:700,c:inkTop,a:'center'});
  else txt(ctx,internal?'Low O₂, high CO₂':'High O₂, low CO₂',x0+w/2,chamberTop+26+29*k,{s:12.5*k,w:700,c:inkTop,a:'center'});
  // dots in chamber show concentration
  const nO=clamp(Math.round(topO/4),0,26),nC=clamp(Math.round(topC/4),0,14),yMin=chamberTop+36+32*k,yMax=chamberTop+chamberH-10;
  v.dots.slice(0,nO+nC).forEach((d,i)=>{const isO=i<nO,x=x0+22+d.x*(w-44),y=yMin+d.y*(yMax-yMin);const jx=RM?0:Math.sin(t*.9+d.p)*5,jy=RM?0:Math.cos(t*.8+d.p)*5;ctx.fillStyle=isO?O2C:CO2C;ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x+jx,y+jy,isO?4.6:4,0,6.29);ctx.fill();ctx.stroke();});
  // capillary
  const g=ctx.createLinearGradient(x0,0,x0+w,0);g.addColorStop(0,mix(DEOX,OXY,internal?1:(inS-.3)/.67));g.addColorStop(1,mix(DEOX,OXY,internal?(outS-.3)/.67:(outS-.3)/.67));ctx.fillStyle=g;rr(ctx,x0,capY,w,capH,20);ctx.fill();
  // wall
  ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(x0,capY-8,w,3);ctx.fillRect(x0,chamberTop+chamberH+6,w,3);
  txt(ctx,'Capillary (thin wall)',x0+w/2,capY+capH-10,{s:12*k,w:700,c:'#fff',a:'center'});
  // red cells
  v.rbc.forEach(c=>{c.x=(c.x+.0)%1;const f=((t*.09+c.o)%1),x=x0+20+f*(w-40),y=capY+30+c.j;const S=lerp(inS,outS,internal?f:1-Math.exp(-f*C_tr(p)/Math.max(.001,tauOf(p))));ctx.fillStyle=mix(DEOX,OXY,(S-.3)/.67);ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(x,y,15,10,0,0,6.29);ctx.fill();ctx.stroke();});
  // diffusion
  const dO=Math.abs(topO-(internal?inO:inO)),dC=Math.abs(topC-inC);const pO=clamp(Math.round(dO/4),0,12),pC=clamp(Math.round(dC*1.2),0,8);
  const y1=chamberTop+chamberH-30,y2=capY+16;
  for(let i=0;i<pO;i++){const f=((t*.45+i/pO)%1),x=x0+40+(i*67)%(w-80),yy=internal?lerp(y2,y1,f):lerp(y1,y2,f);ctx.fillStyle=O2C;ctx.strokeStyle='#fff';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(x,yy,5,0,6.29);ctx.fill();ctx.stroke();}
  for(let i=0;i<pC;i++){const f=((t*.45+i/pC+.3)%1),x=x0+70+(i*97)%(w-120),yy=internal?lerp(y1,y2,f):lerp(y2,y1,f);ctx.fillStyle=CO2C;ctx.strokeStyle='#fff';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(x,yy,4.6,0,6.29);ctx.fill();ctx.stroke();}
  // ends
  const ly=capY+capH+22*k;
  txt(ctx,'Blood arriving',x0,ly,{s:12.5*k,w:800});txt(ctx,'Blood leaving',x0+w,ly,{s:12.5*k,w:800,a:'right'});
  const sub=(a,b,x,al,yy)=>{if(hon){txt(ctx,'O₂ '+r0(a)+', CO₂ '+r0(b),x,yy,{s:12*k,a:al});}else txt(ctx,a>70?'Oxygen-rich':'Oxygen-poor',x,yy,{s:12*k,a:al});};
  sub(inO,inC,x0,'left',ly+16*k);sub(outO,outC,x0+w,'right',ly+16*k);
  // legend
  const lgy=590-10;ctx.fillStyle=O2C;ctx.beginPath();ctx.arc(x0+8,lgy-5,6,0,6.29);ctx.fill();txt(ctx,'O₂',x0+20,lgy,{s:12*k,w:700});ctx.fillStyle=CO2C;ctx.beginPath();ctx.arc(x0+50+26*k,lgy-5,6,0,6.29);ctx.fill();txt(ctx,'CO₂',x0+62+26*k,lgy,{s:12*k,w:700});
  txt(ctx,'Gases move high to low',x0+w,lgy,{s:12*k,a:'right',c:PAL['cv-soft']});
  // panel
  const px=470,pw=322;panel(ctx,px,10,pw,580);const c=px+pw/2;
  if(!internal){
    const cy=92,R=70;ctx.save();
    if(p.balloon){ctx.fillStyle=PAL['card2'];ctx.beginPath();ctx.arc(c,cy,R,0,6.29);ctx.fill();ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;ctx.stroke();}
    else{const n=clamp(Math.round(6+p.area*1.2),8,130),r=R/Math.sqrt(n)*1.02;ctx.strokeStyle=PAL['s1'];ctx.lineWidth=1.3;for(let i=0;i<n;i++){const a=i*2.39996,d=R*Math.sqrt((i+.5)/n);ctx.fillStyle=PAL['card2'];ctx.beginPath();ctx.arc(c+Math.cos(a)*d,cy+Math.sin(a)*d,r,0,6.29);ctx.fill();ctx.stroke();}}
    ctx.restore();
    let y=cy+R+18*k;y=wrap(ctx,p.balloon?'One big sac: 0.16 m²':areaOf(p)+' m² of alveolar surface',px+14,y,pw-28,{s:14*k,w:800},17*k);
    y=wrap(ctx,p.balloon?'Same air, almost no surface. Blood barely picks up oxygen.':'Roughly 300 to 500 million alveoli. Normal is about 70 m², the floor of a classroom.',px+14,y,pw-28,{s:12*k,c:PAL['cv-soft']},15*k)+8;
    y=wrap(ctx,'Hemoglobin full, leaving the lungs',px+14,y,pw-28,{s:12*k,w:700},15*k)-15*k+8;ctx.fillStyle=PAL['card2'];rr(ctx,px+14,y,pw-28,18,6);ctx.fill();ctx.fillStyle=s.Sa<.9?PAL['s1']:PAL['s3'];rr(ctx,px+14,y,Math.max(4,(pw-28)*s.Sa),18,6);ctx.fill();y+=18+15*k;
    txt(ctx,r0(s.Sa*100)+'%',px+14,y,{s:15*k,w:800,c:s.Sa<.9?PAL['s1']:PAL['cv-ink']});y+=14*k;
    wrap(ctx,A.n+(A.ft?' ('+A.ft.toLocaleString('en-US')+' ft)':'')+': air pressure '+A.pb+' mmHg',px+14,y,pw-28,{s:12*k,c:PAL['cv-soft']},15*k);
  }else{
    let y=12+20*k;y=wrap(ctx,ACT[p.act].n,px+14,y,pw-28,{s:15*k,w:800,c:PAL['s1']},18*k)+2;
    y=wrap(ctx,'Cells use oxygen and make carbon dioxide, so inside a cell O₂ stays low and CO₂ stays high.',px+14,y,pw-28,{s:12.5*k},15.5*k)+10;
    const drop=(lab,val,col)=>{y=wrap(ctx,lab,px+14,y,pw-28,{s:12*k,w:700},15*k)-15*k+8;ctx.fillStyle=PAL['card2'];rr(ctx,px+14,y,pw-28,18,6);ctx.fill();ctx.fillStyle=col;rr(ctx,px+14,y,Math.max(4,(pw-28)*val),18,6);ctx.fill();y+=18+15*k;txt(ctx,r0(val*100)+'%',px+14,y,{s:14*k,w:800});y+=18*k;};
    drop('Hemoglobin full, arriving',s.Sa,PAL['s1']);drop('Hemoglobin full, leaving',s.Sv,PAL['s2']);
    wrap(ctx,'Working muscle takes more oxygen, so blood leaves with less. Blood at rest keeps a reserve of about 75%.',px+14,y,pw-28,{s:12*k,c:PAL['cv-soft']},15*k);
  }
}
const C_tr=p=>ACT[p.act].tr;

function drawHb(ctx,cx,cy,R,n,lab,sub,k,t){ctx.fillStyle=PAL['card2'];ctx.beginPath();ctx.arc(cx,cy,R+6,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();
  const pos=[[-1,-1],[1,-1],[-1,1],[1,1]];pos.forEach((q,i)=>{const x=cx+q[0]*R*.46,y=cy+q[1]*R*.46;ctx.fillStyle=i<2?'#a24d58':'#8c3b4c';ctx.beginPath();ctx.arc(x,y,R*.44,0,6.29);ctx.fill();
    ctx.fillStyle='#d99a2b';ctx.beginPath();ctx.arc(x,y,R*.12,0,6.29);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.2;ctx.stroke();
    if(i<n){ctx.fillStyle=O2C;ctx.strokeStyle='#fff';ctx.lineWidth=1.4;[-1,1].forEach(a=>{ctx.beginPath();ctx.arc(x+a*R*.09,y-R*.2,R*.1,0,6.29);ctx.fill();ctx.stroke();});}});
  txt(ctx,lab,cx,cy+R+6+18*k,{s:13*k,w:800,a:'center'});txt(ctx,sub,cx,cy+R+6+34*k,{s:12*k,a:'center',c:PAL['cv-soft']});}
function drawTrans(sim,ctx,k,t){const s=sim.st,ap=atLeast('ap'),hon=atLeast('honors');
  const R=k<1.3?84:70,hbY=R+18;drawHb(ctx,210,hbY,R,Math.round(s.Sa*4),'Leaving the lungs',r0(s.Sa*100)+'% full',k,t);drawHb(ctx,590,hbY,R,Math.round(s.Sv*4),'Leaving the tissues',r0(s.Sv*100)+'% full',k,t);
  // arrow
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(320,hbY);ctx.lineTo(480,hbY);ctx.stroke();ctx.beginPath();ctx.moveTo(470,hbY-8);ctx.lineTo(482,hbY);ctx.lineTo(470,hbY+8);ctx.stroke();
  txt(ctx,'Hemoglobin',400,hbY-16,{s:12.5*k,w:800,a:'center'});txt(ctx,'4 iron, 4 O₂',400,hbY+22*k,{s:12*k,a:'center',c:PAL['cv-soft']});
  // scale
  const y0=hbY+R+6+44*k;panel(ctx,12,y0,776,28*k+22);
  wrap(ctx,'250 million hemoglobin × 4 O₂ = 1 billion O₂ in one red blood cell',24,y0+18*k,752,{s:13*k,w:700},16*k);
  // CO2
  const cy=y0+28*k+40;txt(ctx,'How carbon dioxide travels in blood',12,cy,{s:14*k,w:800});
  const bx=12,bw=776,by=cy+12,bh=56,seg=[['Bicarbonate 70%',.7,'#2f6e8f'],['Hemoglobin 23%',.23,'#a24d58'],['',.07,'#6d6a3a']];let x=bx;seg.forEach(g=>{const w=bw*g[1];ctx.fillStyle=g[2];ctx.fillRect(x,by,w-1,bh);if(g[0])txt(ctx,g[0],x+w/2,by+bh/2,{s:12.5*k,w:800,c:'#fff',a:'center',b:'middle'});x+=w;});
  txt(ctx,'Plasma 7%',bx+bw,by+bh+16*k,{s:12.5*k,w:800,a:'right'});
  let y=by+bh+16*k;
  if(hon)y=wrap(ctx,'Oxygen rides almost entirely on hemoglobin. CO₂ mostly dissolves into plasma as bicarbonate.',12,y+ (k>1.3?22:0),k>1.3?776:620,{s:12*k,c:PAL['cv-soft']},15*k);
  if(ap)y=(txt(ctx,'CO₂ + H₂O ⇌ H₂CO₃ ⇌ H⁺ + HCO₃⁻',400,Math.min(y+18*k,592),{s:13.5*k,w:800,a:'center'}),y+18*k);
  if(k<1.3){y+=26;txt(ctx,'How oxygen travels in blood',12,y,{s:14*k,w:800});y+=10;const w1=bw*.98;ctx.fillStyle='#a24d58';ctx.fillRect(bx,y,w1-1,40);ctx.fillStyle='#6d6a3a';ctx.fillRect(bx+w1,y,bw-w1,40);txt(ctx,'On hemoglobin, about 98%',bx+w1/2,y+20,{s:12.5*k,w:800,c:'#fff',a:'center',b:'middle'});txt(ctx,'Dissolved in plasma, about 2%',bx+bw,y+56,{s:12.5*k,w:800,a:'right'});}
}

const BREATHING={
  id:'breathing',hash:'breathing',apUnit:9,order:8,kind:'Simulation',tab:'Breathing and gas exchange',next:['heart','respiration'],
  card:'Watch the diaphragm pull air in, hold your breath until your brain stem makes you stop, and climb from sea level to Denver to Everest.',
  title:'Breathing and gas exchange',
  lede:{bio:'Follow oxygen from the air to your cells: air moves in, gas crosses into the blood, blood carries it, and cells take it out.',
        honors:'Work through pulmonary ventilation, external respiration, transport and internal respiration. Change activity, altitude and lung surface area.',
        ap:'Connect Boyle’s law, partial pressure gradients, the hemoglobin curve and CO₂ chemistry, using real pressures at real altitudes.'},
  scale:{bio:'From your whole chest down to one alveolus, about 0.2 mm across, wrapped in capillaries.'},
  aspect:4/3,timeScale:1,dtMax:.05,prewarm:180,sampleDt:.5,window:120,unit:'s',chChange:4,chReveal:60,
  controls:[
    {id:'view',label:'Step',type:'seg',def:'vent',lvl:'bio',noTrial:true,options:[{v:'vent',l:'Pulmonary ventilation'},{v:'ext',l:'External respiration'},{v:'trans',l:'Transport'},{v:'int',l:'Internal respiration'}],onChange(sim){sync(sim);sim.infoDirty=true;}},
    {id:'act',label:'Activity',type:'seg',def:'rest',lvl:'bio',options:[{v:'rest',l:'Rest'},{v:'walk',l:'Walk'},{v:'run',l:'Run'}],help:'Working muscles make more carbon dioxide.'},
    {id:'alt',label:'Where you are',type:'select',def:'sea',lvl:'bio',options:[{v:'sea',l:'Sea level (760 mmHg)'},{v:'denver',l:'Denver, 5,280 ft (630 mmHg)'},{v:'fourteener',l:'A Colorado 14er, 14,100 ft (455 mmHg)'},{v:'everest',l:'Summit of Everest, 29,032 ft (253 mmHg)'}]},
    {id:'area',label:'Alveolar surface area',type:'range',min:5,max:100,step:5,def:70,unit:' m²',lvl:'bio',views:['ext'],help:'Emphysema destroys alveolar walls and shrinks this.'},
    {id:'balloon',label:'One big sac, no alveoli',help:'Same air, in a single balloon: 0.16 m²',type:'toggle',def:false,lvl:'bio',views:['ext']},
    {id:'thick',label:'Membrane thickness',type:'range',min:.5,max:5,step:.5,def:.5,unit:' µm',lvl:'ap',views:['ext'],help:'Lung scarring (fibrosis) or fluid thickens it.'}
  ],
  actions:[
    {id:'hold',label:'Hold your breath',primary:true,views:['vent'],enabled:s=>!s.st.holding,run(sim){const s=sim.st;if(s.holding)return;s.holding=true;s.holdT=0;s.broke=0;s.minO2=null;}},
    {id:'breathe',label:'Breathe again',views:['vent'],enabled:s=>s.st.holding,run(sim){const s=sim.st;if(!s.holding)return;s.holding=false;s.lastHold=s.holdT;s.minO2=s.PA;}},
    {id:'hv',label:'Overbreathe for 30 s',lvl:'honors',views:['vent'],run(sim){const s=sim.st;s.hv=30;s.holding=false;}}
  ],
  init(){return {P:40,Ps:40,PA:100,Pv:40,Pc:100,Pvc:45,Sa:.97,Sv:.75,vc:.2,vaff:4.3,VA:4.3,VE:6.5,TV:.43,RR:15,ph:0,holding:false,holdT:0,hv:0,broke:0,lastHold:0,minO2:null};},
  step(sim,dt){gas(sim,sim.st,sim.p,dt);},
  onLevel(sim){sync(sim);},
  metrics:[
    {id:'rr',views:['vent'],label:'Breathing rate',unit:'per min',lvl:'bio',min:0,max:60,d:0,get:s=>s.st.RR},
    {id:'pco2',views:['vent','ext'],label:'Blood CO₂',unit:'mmHg',lvl:'bio',min:0,max:70,d:1,get:s=>s.st.P},
    {id:'hold',views:['vent'],label:'Time holding',unit:'s',lvl:'bio',min:0,max:200,d:0,get:s=>s.st.holding?s.st.holdT:s.st.lastHold,noTrial:true},
    {id:'day',views:['vent'],label:'Breaths per day at this rate',unit:'',lvl:'bio',min:0,max:90000,d:0,get:s=>s.st.RR*1440,noTrial:true},
    {id:'tv',views:['vent'],label:'Air per breath',unit:'L',lvl:'honors',min:0,max:4,d:2,get:s=>s.st.TV},
    {id:'ve',views:['vent'],label:'Air per minute',unit:'L/min',lvl:'honors',min:0,max:120,d:1,get:s=>s.st.VE},
    {id:'palv',views:['vent'],label:'Lung vs outside pressure',unit:'mmHg',lvl:'ap',min:-5,max:5,d:1,noTrial:true,get:s=>breath(s.st).Pa},
    {id:'pa',views:['ext','vent'],label:'Alveolar O₂',unit:'mmHg',lvl:'honors',min:0,max:130,d:0,get:s=>s.st.PA},
    {id:'sat',views:['vent','ext','trans','int'],label:'Hemoglobin full, leaving the lungs',unit:'%',lvl:'bio',min:0,max:100,fixed:true,d:0,get:s=>s.st.Sa*100},
    {id:'cap',views:['ext'],label:'Diffusing capacity',unit:'% of normal',lvl:'honors',min:0,max:150,d:0,get:s=>100*areaOf(s.p)/70*(.5/s.p.thick)},
    {id:'pv',views:['ext','int','trans'],label:'Venous O₂',unit:'mmHg',lvl:'honors',min:0,max:60,d:0,get:s=>s.st.Pv},
    {id:'pvc',views:['ext','int','trans'],label:'Venous CO₂',unit:'mmHg',lvl:'honors',min:0,max:80,d:0,get:s=>s.st.Pvc},
    {id:'sv',views:['trans','int'],label:'Hemoglobin full, leaving the tissues',unit:'%',lvl:'bio',min:0,max:100,fixed:true,d:0,get:s=>s.st.Sv*100}
  ],
  graphs:[{id:'pco2',label:'Blood CO₂',lines:['pco2']},{id:'rr',label:'Breathing rate',lines:['rr']},{id:'sat',label:'Hemoglobin full',lines:['sat']},{id:'capil',label:'O₂ along the lung capillary',lvl:'honors',custom:true},{id:'hbc',label:'Hemoglobin curve',lvl:'ap',custom:true}],defaultGraph:'pco2',
  plot(sim,ctx,box,id){const s=sim.st,p=sim.p;
    if(id==='capil'){const tr=ACT[p.act].tr,ax=axes(ctx,box,{xmin:0,xmax:.75,ymin:0,ymax:120,xl:'Time in the capillary (s)',yl:'O₂ in the blood (mmHg)'});const tau=tauOf(p);ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<=40;i++){const q=tr*i/40,y=s.PA-(s.PA-s.Pv)*Math.exp(-q/tau),X=ax.X(q),Y=ax.Y(y);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}ctx.stroke();
      ctx.strokeStyle=PAL['s2'];ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(s.PA));ctx.lineTo(ax.X(.75),ax.Y(s.PA));ctx.stroke();ctx.setLineDash([]);legend(ctx,box.L+10,box.T+14,[{label:'Blood',color:PAL['s1']},{label:'Alveolus',color:PAL['s2'],dash:true}]);return;}
    const ax=axes(ctx,box,{xmin:0,xmax:120,ymin:0,ymax:100,xl:'O₂ partial pressure (mmHg)',yl:'Hemoglobin full (%)'});ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();for(let q=1;q<=120;q+=2){const X=ax.X(q),Y=ax.Y(hill(q)*100);q===1?ctx.moveTo(X,Y):ctx.lineTo(X,Y);}ctx.stroke();
    const pt=(P,S,c,l,dy)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(ax.X(P),ax.Y(S*100),6,0,6.29);ctx.fill();txt(ctx,l,ax.X(P),ax.Y(S*100)+dy,{s:13,w:700,a:'center',c:PAL['fg']});};
    pt(s.Pc,s.Sa,PAL['s1'],'Lungs',18);pt(s.Pv,s.Sv,PAL['s2'],'Tissues',-12);},
  challenges:[
    {lvl:'bio',q:'You start running. Your muscles make more carbon dioxide. What does your breathing do?',choices:['It stays the same, because you still have oxygen','It speeds up, and blood CO₂ settles just a little above normal','It slows down, to save energy'],correct:1,baseline:{view:'vent',act:'rest'},change:{act:'run'},changeText:'Now running',watch:'rr',at:4,reveal:50,
      explain:'CO₂ from your muscles reaches your blood. Your brain stem senses it, and it raises your breathing rate from about 15 to about 30 per minute. Blood CO₂ only climbs a little because breathing keeps up.'},
    {lvl:'bio',instant:true,set:{view:'vent',act:'rest',alt:'sea'},q:'You hold your breath as long as you can. What finally forces you to breathe?',choices:['Your lungs run completely out of oxygen','Blood CO₂ climbs until your brain stem overrides you','Your diaphragm gets tired'],correct:1,
      explain:'CO₂ keeps building up because cells keep making it and you are not breathing it out. Near 55 mmHg your brain stem wins, and you gasp. Your hemoglobin is still about 90% full at that point. The urge comes mostly from CO₂, not from running out of oxygen. Press Hold your breath to watch it happen, about a minute and a half.'},
    {lvl:'bio',instant:true,q:'Your diaphragm contracts and flattens. What happens in your chest?',choices:['Volume goes up, pressure goes down, and air flows in','Volume goes down, pressure goes up, and air flows in','Volume goes up, pressure goes up, and air flows out'],correct:0,set:{view:'vent'},
      explain:'A bigger space gives the same air more room, so pressure falls below the air outside. Air flows from high pressure to low pressure, into your lungs. That is Boyle’s law.'},
    {lvl:'honors',q:'You move from sea level to Denver. What happens to alveolar O₂ and hemoglobin saturation?',choices:['Both stay exactly the same','Alveolar O₂ drops about 20%, but hemoglobin stays almost full (about 94%)','Both drop by about half'],correct:1,baseline:{view:'ext',alt:'sea'},change:{alt:'denver'},changeText:'Now in Denver',watch:'sat',at:4,reveal:25,
      explain:'Air in Denver is thinner, so there is less O₂ pressure in the alveoli, about 77 mmHg. Hemoglobin’s curve is flat near the top, so a person still loads about 94%. Everest is on the steep part of the curve, where saturation falls fast.'},
    {lvl:'honors',instant:true,q:'Blood arrives at the lungs with O₂ at 40 mmHg. Alveolar air has O₂ at 100 mmHg. Which way does O₂ move?',choices:['Blood to air, because blood is moving','Air to blood, from high to low','It does not move, because the wall blocks it'],correct:1,set:{view:'ext',alt:'sea',act:'rest'},
      explain:'Each gas moves down its own gradient. O₂ moves from 100 to 40, into the blood. CO₂ moves the other way, from 45 to 40.'},
    {lvl:'honors',q:'Emphysema has shrunk a person’s alveolar surface to 15 m². They are fine at rest. What happens when they run?',choices:['Hemoglobin stays full','Hemoglobin leaves the lungs less full, because blood moves through too fast to load','Hemoglobin leaves the lungs more full'],correct:1,baseline:{view:'ext',area:15,act:'rest'},change:{act:'run'},changeText:'Now running',watch:'sat',at:4,reveal:30,
      explain:'Fast blood spends only about 0.3 s in the capillary. With less surface area, oxygen does not have time to fill it. Compare the Hemoglobin full tile before and after. This is why lung disease often shows up first with exertion.'},
    {lvl:'ap',instant:true,q:'About how does most of the CO₂ in your blood travel?',choices:['As bicarbonate in plasma, about 70%','Dissolved in plasma, about 70%','On hemoglobin, about 70%'],correct:0,set:{view:'trans'},
      explain:'About 70% becomes bicarbonate, about 23% rides on hemoglobin, and about 7% stays dissolved. CO₂ + H₂O ⇌ H₂CO₃ ⇌ H⁺ + HCO₃⁻.'},
    {lvl:'ap',instant:true,q:'A swimmer overbreathes for 30 s, then holds their breath. Compared with a normal hold, what happens?',choices:['They feel the urge later, and alveolar O₂ runs lower before they notice','They feel the urge sooner','Nothing changes, because lungs are already full'],correct:0,set:{view:'vent',act:'rest',alt:'sea'},
      explain:'Overbreathing lowers blood CO₂, so the alarm takes longer to go off. It adds little oxygen, because hemoglobin is already nearly full. During a swim, oxygen can run out before the urge arrives, and the swimmer can black out underwater. Never overbreathe before swimming underwater.'}
  ],
  onChallenge(sim,ch,phase){if(ch&&ch.set&&phase==='ask')BioLab.setValues(sim,ch.set);},
  narrate(sim){const s=sim.st,p=sim.p,v=p.view,A=ALT[p.alt];
    if(v==='vent'){if(s.holding)return '<b>You are holding your breath.</b> Cells keep making CO₂, so blood CO₂ has climbed to '+s.P.toFixed(1)+' mmHg. Your brain stem forces a breath near '+r0(ALT[p.alt].pco2+15)+' mmHg.';
      if(s.broke&&sim.t-0>0&&s.P>ALT[p.alt].pco2+3)return '<b>Your brain stem took over after '+r0(s.broke)+' s.</b> Breathing is fast at '+r0(s.RR)+' per minute until blood CO₂ falls back to normal.';
      if(s.hv>0)return '<b>You are overbreathing.</b> Blood CO₂ is falling to '+s.P.toFixed(1)+' mmHg. Oxygen barely rises, because hemoglobin was already nearly full.';
      const inh=s.ph<.4;return (inh?'<b>Breathing in:</b> the diaphragm contracts and flattens and the rib muscles lift the ribs. Volume goes up, pressure goes down, and air flows in.':'<b>Breathing out:</b> the diaphragm and rib muscles relax. Volume goes down, pressure goes up, and air flows out.')+' Rate: '+r0(s.RR)+' per minute'+(p.act!=='rest'?', because '+ACT[p.act].n.toLowerCase()+' muscles make more CO₂.':'.');}
    if(v==='ext'){if(p.balloon)return '<b>One big sac has almost no surface.</b> Blood passes by with almost no time to load, so hemoglobin leaves only '+r0(s.Sa*100)+'% full. Millions of tiny alveoli solve this.';
      if(s.Sa<.88)return '<b>Hemoglobin leaves only '+r0(s.Sa*100)+'% full.</b> '+(s.PA<70?'At '+A.n.toLowerCase()+', alveolar O₂ is only '+r0(s.PA)+' mmHg.':'Blood does not have time to load through this surface.');
      return '<b>O₂ moves from the alveolus into the blood, and CO₂ moves out.</b> Each gas goes from high to low pressure. Hemoglobin leaves '+r0(s.Sa*100)+'% full.';}
    if(v==='trans')return '<b>Hemoglobin carries the oxygen:</b> it leaves the lungs '+r0(s.Sa*100)+'% full and leaves the tissues '+r0(s.Sv*100)+'% full. Most carbon dioxide rides back as bicarbonate.';
    return '<b>O₂ moves from the blood into your cells, and CO₂ moves from your cells into the blood.</b> Hemoglobin arrives '+r0(s.Sa*100)+'% full and leaves '+r0(s.Sv*100)+'% full'+(p.act!=='rest'?', because working muscle uses more oxygen.':', so there is a reserve left.');},
  infoPanel(sim){const v=sim.p.view,ap=atLeast('ap'),A=ALT[sim.p.alt],s=sim.st;
    const four='<p class="note">Four steps: pulmonary ventilation (air in and out), external respiration (lungs to blood), transport (blood), internal respiration (blood to cells).</p>';
    if(v==='vent')return '<h3>Pulmonary ventilation</h3><p>Air moves because of pressure. Muscles change chest volume, volume changes pressure, and air flows from high to low.</p><p>At rest you take 12 to 20 breaths a minute, about 22,000 a day. Your brain stem sets the rate mostly by sensing CO₂ in your blood.</p>'+(ap?'<p><b>Boyle’s law:</b> P₁V₁ = P₂V₂. A small volume rise is enough to drop lung pressure by about 1 mmHg, and that moves about half a liter.</p>':'')+four;
    if(v==='ext')return '<h3>External respiration</h3><p>Gases cross a wall about 0.5 µm thick between the alveolus and the capillary. Each gas moves from high to low partial pressure.</p><p><b>'+A.n+':</b> '+r0(.2093*A.pb)+' mmHg of O₂ in the air outside, '+r0(s.PA)+' mmHg in the alveoli.</p>'+(ap?'<p>Rate of diffusion rises with surface area and gradient, and falls with thickness. At rest, blood spends about 0.75 s here and usually fills in about 0.25 s, so there is time to spare.</p>':'')+four;
    if(v==='trans')return '<h3>Transport</h3><p>Hemoglobin has 4 iron atoms, and each one holds one O₂. A single red blood cell holds about 250 million hemoglobin, so about 1 billion O₂.</p><p>Almost all the oxygen in blood rides on hemoglobin. Carbon dioxide travels three ways: 70% as bicarbonate, 23% on hemoglobin, and 7% dissolved in plasma.</p>'+four;
    return '<h3>Internal respiration</h3><p>Blood delivers O₂ to cells for cellular respiration and picks up the CO₂ they make. Again, each gas moves from high to low.</p><p>At rest, venous blood returns with O₂ near 40 mmHg and CO₂ near 45 mmHg.</p>'+four;},
  tour:[
    {title:'Breathing in',text:'The diaphragm contracts and flattens, and the rib muscles lift the ribs. Chest volume goes up, so pressure inside falls below the outside air. Air flows in.',focus:[[0,0,470,600],[478,10,314,330]],speed:.5,setup(sim){BioLab.setValues(sim,{view:'vent',act:'rest',alt:'sea'});}},
    {title:'Your brain stem runs this',text:'Start running. Muscles make more CO₂, your brain stem senses it, and your breathing rate climbs. Watch the rate in the box.',focus:[478,250,314,340],speed:2,setup(sim){BioLab.setValues(sim,{view:'vent',act:'run'});}},
    {title:'External respiration',text:'In the alveolus, O₂ is high and blood’s O₂ is low, so O₂ crosses into the blood. CO₂ goes the other way. Each gas moves from high to low.',focus:[0,0,470,600],speed:1,setup(sim){BioLab.setValues(sim,{view:'ext',act:'rest'});}},
    {title:'Why alveoli matter',text:'Hundreds of millions of tiny air sacs make about 70 m² of surface. One big sac holding the same air would have just 0.16 m², far too little.',focus:[470,10,322,380],speed:1,setup(sim){BioLab.setValues(sim,{view:'ext',balloon:true});}},
    {title:'Transport',text:'Each hemoglobin has 4 iron atoms and holds 4 O₂. It leaves the lungs about 97% full. CO₂ rides back mostly as bicarbonate.',focus:[0,0,800,600],speed:1,setup(sim){BioLab.setValues(sim,{view:'trans',balloon:false,act:'rest'});}},
    {title:'Internal respiration',text:'At the tissues, blood’s O₂ is higher than the cell’s, so O₂ moves into cells. CO₂ moves into blood. The blood goes home about 75% full.',focus:[0,0,470,600],speed:1,setup(sim){BioLab.setValues(sim,{view:'int',act:'rest'});}},
    {title:'Now climb',text:'Air in Denver is thinner, so alveolar O₂ falls to about 77 mmHg. Hemoglobin still stays about 94% full. On Everest it would fall far lower.',focus:[470,10,322,580],speed:2,setup(sim){BioLab.setValues(sim,{view:'ext',alt:'denver'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{view:'vent',act:'rest',alt:'sea',balloon:false,area:70,thick:.5});},
  lab:{bio:'<p><b>Question:</b> Why is it harder to catch your breath at altitude?</p><ol><li>Choose <b>External respiration</b> and <b>Rest</b>.</li><li>Set <b>Where you are</b> to Sea level, wait 30 s, and record a trial. Repeat for Denver, a 14er and Everest.</li><li>Record Hemoglobin full and Blood CO₂ each time.</li></ol><p>Where does hemoglobin start to fall quickly? What does this mean for someone hiking in Colorado?</p>',
       honors:'<p><b>Question:</b> Why do your lungs need so much surface area?</p><ol><li>Choose <b>External respiration</b> and <b>Rest</b>.</li><li>Record Hemoglobin full at surface areas of 70, 40, 20, 10 and 5 m².</li><li>Repeat with <b>Run</b> selected. Look at O₂ along the lung capillary in the graph.</li><li>Turn on <b>One big sac</b> and record once more.</li></ol><p>Explain why a person with emphysema can feel fine sitting and struggle on the stairs.</p>',
       ap:'<p><b>Question:</b> What controls your urge to breathe?</p><ol><li>Choose <b>Pulmonary ventilation</b>. Press Hold your breath and record blood CO₂, alveolar O₂ and the time at the moment it ends.</li><li>Wait for recovery. Press Overbreathe, wait until it ends, and hold again. Record the same values.</li><li>Use the Hemoglobin curve graph to explain what the O₂ value means for saturation.</li></ol><p><b>Claim, evidence, reasoning:</b> Is your urge to breathe set more by O₂ or by CO₂? Why does overbreathing before an underwater swim put a swimmer at risk?</p>'},
  terms:[{t:'Pulmonary ventilation',d:'Moving air in and out of the lungs.'},{t:'External respiration',d:'Gas exchange between the alveoli and the blood.'},{t:'Transport',d:'Blood carrying O₂ and CO₂ between lungs and tissues.'},{t:'Internal respiration',d:'Gas exchange between the blood and body cells.'},{t:'Diaphragm',d:'The dome of muscle under the lungs. It flattens when it contracts.'},{t:'Alveolus',d:'A tiny air sac wrapped in capillaries.'},{t:'Hemoglobin',d:'The iron protein in red blood cells that carries oxygen.'},{t:'Diffusion',d:'Movement from high concentration or pressure to low.'},
    {lvl:'honors',t:'Boyle’s law',d:'At a fixed temperature, when volume goes up, gas pressure goes down.'},{lvl:'honors',t:'Partial pressure',d:'The share of air pressure from one gas. It sets which way that gas diffuses.'},{lvl:'honors',t:'Bicarbonate',d:'HCO₃⁻, the main form CO₂ takes in the blood.'},{lvl:'honors',t:'Emphysema',d:'A disease that destroys alveolar walls and cuts surface area.'},
    {lvl:'ap',t:'Saturation',d:'The percent of hemoglobin’s O₂ sites that are filled.'},{lvl:'ap',t:'Carbonic anhydrase',d:'The enzyme in red blood cells that speeds CO₂ + H₂O ⇌ H₂CO₃.'}],
  about:'<p><b>Ventilation:</b> blood CO₂ follows CO₂ made ÷ alveolar air (the alveolar ventilation equation, with 150 mL of air per breath staying in the airways). The brain stem raises breathing as CO₂ rises above the set value. During exercise the real body also raises breathing from nerve signals straight away, so in the model only a small CO₂ rise, 1 to 2 mmHg, is needed. In real moderate exercise, arterial CO₂ barely changes. Your teacher’s summary, that the brain stem senses CO₂ and speeds breathing, is the main idea.</p><p>The lung pressure swing of about 1 mmHg at rest is the textbook value, scaled roughly with effort. The held-breath model (CO₂ rising about 6 mmHg quickly, then about 0.1 mmHg per second, with a breaking point about 15 mmHg above normal) is typical of an untrained adult. People vary widely.</p><p><b>Gas exchange:</b> alveolar O₂ comes from the alveolar gas equation. Hemoglobin follows a Hill curve (P₅₀ 26.8 mmHg, n 2.7). The time for blood to fill in the capillary scales with surface area and thickness. Real loading also depends on the curve’s slope, and that matters a lot at extreme altitude, which is left out. Blood CO₂ at altitude comes from measured values for short stays: about 36 mmHg in Denver, 30 on a 14er, 8 on Everest. The model’s Everest saturation (about 64%) sits within a wide range of estimates, because real climbers also shift the curve and acclimatize over weeks.</p><p><b>Simplified:</b> one lung compartment with no shunt and no dead-space change, so the sea-level saturation is about 97% and real healthy values run 95 to 98%. The same 70/23/7 CO₂ split is shown everywhere. This is for learning, not a medical tool. Never overbreathe before swimming underwater.</p>',
  initVis(sim){const r=rng(17),v=sim.vis;v.dots=[];for(let i=0;i<46;i++)v.dots.push({x:r(),y:r(),p:r()*6.28});v.rbc=[];for(let i=0;i<6;i++)v.rbc.push({x:0,o:i/6,j:(i%2?-4:4)});},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,600);const v=sim.p.view;
    if(v==='vent')drawVent(sim,ctx,k,t);else if(v==='ext')drawExch(sim,ctx,k,t,false);else if(v==='int')drawExch(sim,ctx,k,t,true);else drawTrans(sim,ctx,k,t);}
};
BioLab.register(BREATHING);
})();
