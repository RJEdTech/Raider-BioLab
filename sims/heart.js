(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,legend,lvText}=BioLab.h;

/* Heart and circulation.
   One clock (tau, 0 to 8 beats) drives everything in the cutaway: the traced cell, the other cells, the valves and the chamber volumes.
   A cell crosses each AV valve in diastole and each semilunar valve in systole because its position is a function of tau.
   Cardiac output = heart rate x stroke volume. All flows below come from flow(sim). */
const DEOX='#7c1f33',OXY='#e2363c',FLESH='#c17f68',FLESH2='#8f5140',LUNG='#b5727a',WALLD='#57131f',WALLO='#9e1e24';
const hex=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
const mix=(a,b,t)=>{const A=hex(a),B=hex(b);t=clamp(t,0,1);return 'rgb('+A.map((v,i)=>Math.round(lerp(v,B[i],t))).join(',')+')';};
const FULL=5,BEATS=8;

/* Stops in the teacher's order. tau is where the traced cell sits at each stop. */
const STOPS=[
 {id:'vc',n:'Superior and inferior vena cava',tau:7.4,ox:0,mm:'about 5 mmHg',t:'Oxygen-poor blood comes home from the body. The superior vena cava drains the head and arms. The inferior vena cava drains the trunk and legs.'},
 {id:'ra',n:'Right atrium',tau:.12,ox:0,mm:'about 5 mmHg',t:'The right atrium collects oxygen-poor blood from both venae cavae. It is a thin-walled holding room.'},
 {id:'tri',n:'Tricuspid valve',tau:.3,ox:0,mm:'open at about 5 mmHg',t:'This one-way valve opens while the ventricle relaxes, so blood falls from the right atrium into the right ventricle.'},
 {id:'rv',n:'Right ventricle',tau:.55,ox:0,mm:'peaks near 25 mmHg',t:'The right ventricle fills, then squeezes. Its wall is thin because it only has to push blood next door to the lungs.'},
 {id:'pv',n:'Pulmonary valve',tau:.72,ox:0,mm:'opens above about 10 mmHg',t:'The squeeze pushes this valve open, and blood leaves the heart. When the ventricle relaxes, the valve snaps shut so blood can’t fall back.'},
 {id:'pa',n:'Pulmonary arteries',tau:1.2,ox:0,mm:'about 25/10 mmHg',t:'These arteries carry oxygen-poor blood. They are still arteries, because they carry blood away from the heart.'},
 {id:'lung',n:'Lungs',tau:2,ox:.6,mm:'about 10 mmHg in the capillaries',t:'In the lung capillaries, the cell gives up carbon dioxide and picks up oxygen. This is where its color changes from dark red to bright red.'},
 {id:'pvn',n:'Pulmonary veins',tau:2.7,ox:1,mm:'about 8 mmHg',t:'These veins carry oxygen-rich blood. They are still veins, because they carry blood toward the heart.'},
 {id:'la',n:'Left atrium',tau:3.12,ox:1,mm:'about 8 mmHg',t:'The left atrium collects oxygen-rich blood coming back from the lungs.'},
 {id:'mit',n:'Bicuspid (mitral) valve',tau:3.3,ox:1,mm:'open at about 8 mmHg',t:'This two-flap valve opens while the ventricle relaxes, so blood drops from the left atrium into the left ventricle.'},
 {id:'lv',n:'Left ventricle',tau:3.55,ox:1,mm:'peaks near 115 mmHg',t:'This is the thickest chamber. Its wall is about three times thicker than the right ventricle’s because it pushes blood through the whole body.'},
 {id:'av',n:'Aortic valve',tau:3.72,ox:1,mm:'opens above about 75 mmHg',t:'The squeeze pushes this valve open. When the ventricle relaxes, the valve snaps shut so blood can’t fall back into the ventricle.'},
 {id:'ao',n:'Aorta',tau:4.4,ox:1,mm:'about 115/75 mmHg',t:'The aorta is the body’s largest artery. Its branches carry oxygen-rich blood to every organ.'},
 {id:'body',n:'Body',tau:5.8,ox:.5,mm:'about 35 falling to 15 mmHg',t:'In the body’s capillaries, the cell gives oxygen to the tissues and takes on carbon dioxide. Its color changes from bright red to dark red, and it heads home.'}
];
const ORDER=STOPS.slice().sort((a,b)=>a.tau-b.tau);
function stopAt(tau){let c=ORDER[ORDER.length-1];ORDER.forEach(o=>{if(tau>=o.tau-1e-6)c=o;});return c;}

function route(upper,leftLung){
  const r=[[0,upper?272:252,upper?208:302],[.12,292,255],[.3,300,318],[.55,330,365],[.62,348,340],[.72,362,312],[.95,362,125]];
  if(leftLung)r.push([1.2,235,125],[1.55,150,140],[2,84,235],[2.4,150,170],[2.7,290,178],[2.98,432,205]);
  else r.push([1.2,520,125],[1.55,650,140],[2,716,235],[2.4,650,235],[2.7,600,235],[2.98,530,238]);
  r.push([3.12,478,240],[3.3,478,292],[3.55,470,360],[3.62,432,335],[3.72,405,312],[3.98,405,130]);
  if(upper)r.push([4.2,422,96],[4.5,440,84],[5,440,52],[5.2,440,42],[6.2,272,42],[7.4,272,100],[8,272,208]);
  else r.push([4.2,434,89],[4.5,498,75],[4.8,563,91],[5,592,140],[5.25,592,540],[5.4,592,584],[6.3,235,584],[7.4,235,440],[7.9,235,325],[8,252,302]);
  return r;}
const ROUTES=[[1,1],[1,0],[0,1],[0,0]].map(a=>route(a[0],a[1]));
function posAt(R,tau){tau=((tau%BEATS)+BEATS)%BEATS;for(let i=1;i<R.length;i++){if(tau<=R[i][0]){const a=R[i-1],b=R[i],u=(tau-a[0])/(b[0]-a[0]||1);return {x:lerp(a[1],b[1],u),y:lerp(a[2],b[2],u)};}}const e=R[R.length-1];return {x:e[1],y:e[2]};}
function oxy(tau){tau=((tau%BEATS)+BEATS)%BEATS;if(tau<1.6)return 0;if(tau<2.3)return (tau-1.6)/.7;if(tau<5.3)return 1;if(tau<6.2)return 1-(tau-5.3)/.9;return 0;}

/* Blood flow model. Stroke volume means what the left ventricle ejects per beat. */
function fillFactor(hr){return hr<=190?1:clamp(1-(hr-190)/30*.45,.55,1);}
function flow(sim){const p=sim.p,hr=p.hr,S=p.sv*fillFactor(hr),b=sim.p.view==='breaks'?p.brk:'none',f=p.leak/100;
  let Qs=S,Qp=S,back=0;
  if(b==='mitral'){Qs=S*(1-f);Qp=Qs;back=S*f;}
  else if(b==='vsd'){Qs=S*(1-f);Qp=S;back=S*f;}
  const esv=Math.max(25,50-.25*(S-70)),edv=S+esv;
  return {hr,S,Qs,Qp,back,co:hr*S/1000,body:hr*Qs/1000,lungs:hr*Qp/1000,ratio:Qp/Qs,esv,edv,ef:100*S/edv,loop:FULL/(hr*Qs/1000)*60,b};}

const VESSELS={
 aorta:{n:'Aorta',kind:'Artery',dir:'Away from the heart',blood:'Oxygen-rich',wall:'Thick, muscular and stretchy, to take each high-pressure pulse',mm:'About 115/75 mmHg',w:.34,c:OXY},
 pa:{n:'Pulmonary arteries',kind:'Artery',dir:'Away from the heart',blood:'Oxygen-poor (the classic trap)',wall:'Thinner than the aorta, because lung pressure is low',mm:'About 25/10 mmHg',w:.2,c:DEOX},
 pv:{n:'Pulmonary veins',kind:'Vein',dir:'Toward the heart',blood:'Oxygen-rich (the classic trap)',wall:'Thin, with low pressure',mm:'About 8 mmHg',w:.1,c:OXY},
 vc:{n:'Superior and inferior vena cava',kind:'Vein',dir:'Toward the heart',blood:'Oxygen-poor',wall:'Thin and floppy. Veins in the limbs have one-way valves',mm:'About 5 mmHg',w:.1,c:DEOX},
 capL:{n:'Lung capillaries',kind:'Capillary',dir:'Between arteries and veins',blood:'Changes from oxygen-poor to oxygen-rich',wall:'One cell thick, so gases cross. Red blood cells pass in single file',mm:'About 10 mmHg',w:.04,c:mix(DEOX,OXY,.5)},
 capB:{n:'Body capillaries',kind:'Capillary',dir:'Between arteries and veins',blood:'Changes from oxygen-rich to oxygen-poor',wall:'One cell thick, so oxygen, nutrients and wastes cross',mm:'About 35 falling to 15 mmHg',w:.04,c:mix(DEOX,OXY,.5)}
};
const CELLS={
 rbc:{n:'Red blood cells',count:'About 5 million per µL of blood',size:'About 7.5 µm across',d:'Carry oxygen on hemoglobin. No nucleus, a dimpled disc shape, and a life of about 120 days.'},
 wbc:{n:'White blood cells',count:'About 4,500 to 11,000 per µL',size:'About 10 to 20 µm across',d:'Fight infection. They are the largest and rarest cells, about 1 for every 700 red blood cells. They have a nucleus.'},
 plt:{n:'Platelets',count:'About 150,000 to 450,000 per µL',size:'About 2 to 3 µm across',d:'Clot blood to plug a leak. They are fragments of larger bone marrow cells, not whole cells.'},
 plasma:{n:'Plasma',count:'About 55% of blood volume',size:'About 90% water',d:'The straw-colored liquid. It carries nutrients, hormones, proteins, wastes and most of the carbon dioxide.'}
};
function sync(sim){if(!sim.ui||!sim.ui.tiles)return;const v=sim.p.view;
  sim.def.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const e=t.num.closest('.tile');if(e)e.hidden=!atLeast(m.lvl)||!m.views.includes(v);});
  sim.def.controls.forEach(c=>{if(!c.views)return;const w=sim.ui.ctlW&&sim.ui.ctlW[c.id];if(w){w.hidden=!atLeast(c.lvl)||!c.views.includes(v)||(c.only&&!c.only(sim));}});
  sim.def.actions.forEach(a=>{const b=sim.ui.actB&&sim.ui.actB[a.id];if(b)b.hidden=!atLeast(a.lvl)||!a.views.includes(v);});}
function goStop(sim,idx){const s=sim.st;s.loop=null;const st=STOPS[(idx+STOPS.length)%STOPS.length];s.idx=STOPS.indexOf(st);s.target=st.tau;if(sim.p.auto)BioLab.setValues(sim,{auto:false});sim.infoDirty=true;}
function jumpStop(sim,idx){const s=sim.st;s.loop=null;const st=STOPS[(idx+STOPS.length)%STOPS.length];s.tau=st.tau;s.target=null;s.idx=STOPS.indexOf(st);if(sim.p.auto)BioLab.setValues(sim,{auto:false});sim.infoDirty=true;}
function setLoop(sim,a,b){const s=sim.st;s.loop=[a,b];s.lt=a;s.tau=((a%BEATS)+BEATS)%BEATS;s.target=null;}
function wrap(ctx,s,x,y,maxW,o,lh){o=o||{};ctx.font=(o.w||400)+' '+(o.s||13)+'px '+FONT;const words=String(s).split(' ');let line='',yy=y;const out=[];words.forEach(w=>{const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){out.push(line);line=w;}else line=t;});if(line)out.push(line);out.forEach(l=>{txt(ctx,l,x,yy,o);yy+=lh||(o.s||13)*1.25;});return yy;}
const hasRoom=k=>k<1.25;

/* Cardiac cycle: diastole is phase 0 to 0.6 (the last part is the atrial kick), systole is 0.6 to 1. */
function beatState(tau){const ph=tau-Math.floor(tau);let cv;if(ph<.1)cv=1-ph/.1*.75;else if(ph<.6)cv=.25*(1-(ph-.1)/.5);else cv=Math.sin((ph-.6)/.4*Math.PI/2);
  const ca=ph>.38&&ph<.6?Math.sin((ph-.38)/.22*Math.PI):0;return {ph,cv,ca,sys:ph>=.6,avOpen:ph<.6,slOpen:ph>=.63&&ph<.985};}

function cav(ctx,cx,cy,sc,fn,fill){ctx.save();ctx.translate(cx,cy);ctx.scale(sc,sc);ctx.translate(-cx,-cy);ctx.beginPath();fn();ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.restore();}
function vesselPath(ctx,pts,w,fill,wall){[[w+5,wall],[w,fill]].forEach(a=>{ctx.strokeStyle=a[1];ctx.lineWidth=a[0];ctx.lineJoin='round';ctx.lineCap='butt';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();});}
function valve(ctx,x,y,open,dir,hot,gap){const half=15,e=open?14:0,spread=open?11:(gap?5:0);ctx.lineCap='round';
  if(hot){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,22,0,6.29);ctx.stroke();}
  ctx.strokeStyle='#fff5e6';ctx.lineWidth=4.5;
  ctx.beginPath();ctx.moveTo(x-half,y);ctx.lineTo(x-spread,y+dir*e);ctx.moveTo(x+half,y);ctx.lineTo(x+spread,y+dir*e);ctx.stroke();}

function drawHeart(sim,ctx,k,opt){const s=sim.st,F=flow(sim),B=beatState(s.tau),hot=opt.hot,fs=opt.fs||1,b=F.b,sev=sim.p.leak/100;
  const vsdMix=b==='vsd'?clamp(F.back/(F.Qp||1),0,1):0,rvC=mix(DEOX,OXY,vsdMix),T=(a,x,y,o)=>txt(ctx,a,x,y,o);
  if(!opt.noBeds){
    // capillary beds
    let g=ctx.createLinearGradient(440,0,272,0);g.addColorStop(0,OXY);g.addColorStop(1,DEOX);ctx.fillStyle=g;rr(ctx,190,6,330,46,12);ctx.fill();
    g=ctx.createLinearGradient(592,0,235,0);g.addColorStop(0,OXY);g.addColorStop(1,DEOX);ctx.fillStyle=g;rr(ctx,130,548,510,46,12);ctx.fill();
    T('Upper body capillaries',355,24,{s:12.5*k,w:700,c:'#fff',a:'center',b:'middle'});T('Lower body capillaries',385,564,{s:12.5*k,w:700,c:'#fff',a:'center',b:'middle'});
    // lungs
    [[83,false],[717,true]].forEach(a=>{const x=a[0];ctx.fillStyle=LUNG;ctx.beginPath();ctx.ellipse(x,240,68,104,0,0,6.29);ctx.fill();
      const gg=ctx.createRadialGradient(x,240,8,x,240,62);gg.addColorStop(0,'rgba(255,255,255,.2)');gg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gg;ctx.beginPath();ctx.ellipse(x,240,62,96,0,0,6.29);ctx.fill();
      T('Lung',x,285,{s:13*k,w:800,c:'#fff',a:'center',b:'middle'});});
  }
  // vessels behind the heart
  const pvC=OXY,paC=mix(rvC,DEOX,0);
    vesselPath(ctx,[[150,170],[290,178],[436,206]],18,pvC,WALLO);
  vesselPath(ctx,[[650,235],[524,238]],18,pvC,WALLO);
  ctx.lineCap='butt';ctx.strokeStyle=WALLO;ctx.lineWidth=39;ctx.beginPath();ctx.moveTo(405,312);ctx.lineTo(405,130);ctx.bezierCurveTo(405,60,592,50,592,140);ctx.lineTo(592,552);ctx.stroke();ctx.strokeStyle=OXY;ctx.lineWidth=34;ctx.stroke();
  vesselPath(ctx,[[440,86],[440,48]],15,OXY,WALLO);
  vesselPath(ctx,[[362,316],[362,125]],26,paC,WALLD);
  vesselPath(ctx,[[150,140],[235,125],[362,125],[520,125],[650,140]],22,paC,WALLD);
  vesselPath(ctx,[[272,50],[272,212]],26,DEOX,WALLD);
  vesselPath(ctx,[[235,552],[235,325],[258,296]],26,DEOX,WALLD);
  // heart muscle
  const shrink=1-.035*B.cv;ctx.save();ctx.translate(400,300);ctx.scale(shrink,shrink);ctx.translate(-400,-300);
  ctx.beginPath();ctx.moveTo(240,250);ctx.bezierCurveTo(240,190,300,178,345,190);ctx.bezierCurveTo(380,176,430,166,478,174);ctx.bezierCurveTo(530,176,548,215,546,270);ctx.bezierCurveTo(566,340,560,420,505,478);ctx.bezierCurveTo(485,505,462,520,440,516);ctx.bezierCurveTo(380,510,285,470,262,385);ctx.bezierCurveTo(258,345,240,310,240,250);ctx.closePath();
  ctx.fillStyle=FLESH;ctx.fill();ctx.strokeStyle=FLESH2;ctx.lineWidth=2.5;ctx.stroke();ctx.restore();
  // redraw great-vessel roots over the muscle, so their paths read clearly
  vesselPath(ctx,[[405,316],[405,180]],34,OXY,WALLO);vesselPath(ctx,[[362,318],[362,180]],26,paC,WALLD);
  vesselPath(ctx,[[272,170],[272,214]],26,DEOX,WALLD);vesselPath(ctx,[[238,322],[262,290]],26,DEOX,WALLD);vesselPath(ctx,[[560,238],[520,238]],18,pvC,WALLO);vesselPath(ctx,[[420,198],[440,206]],18,pvC,WALLO);
  // chambers
  const big=b==='mitral'?1+.22*sev:1,raS=1-.14*B.ca,laS=(1-.14*B.ca)*big,vS=1-.26*B.cv;
  cav(ctx,292,255,raS,()=>{ctx.ellipse(292,255,46,52,0,0,6.29);},DEOX);
  cav(ctx,478,240,laS,()=>{ctx.ellipse(478,240,50,46,0,0,6.29);},b==='mitral'?mix(OXY,'#ff6a55',sev):OXY);
  cav(ctx,335,322,vS,()=>{ctx.moveTo(276,338);ctx.bezierCurveTo(300,318,345,312,376,318);ctx.bezierCurveTo(380,370,382,420,366,476);ctx.bezierCurveTo(330,462,272,410,276,338);},rvC);
  cav(ctx,445,312,vS,()=>{ctx.moveTo(420,322);ctx.bezierCurveTo(440,302,505,298,520,342);ctx.bezierCurveTo(534,395,508,455,460,490);ctx.bezierCurveTo(428,470,410,395,420,322);},OXY);
  // openings between atria and ventricles
  ctx.fillStyle=DEOX;ctx.fillRect(286,296,28,40);ctx.fillStyle=OXY;ctx.fillRect(464,278,28,34);
  // septum label and defect
  if(b==='vsd'){ctx.fillStyle=mix(rvC,OXY,.5);ctx.fillRect(366,390-sev*40,60,14+sev*80);}
  ctx.save();ctx.translate(399,hasRoom(k)?405:420);ctx.rotate(-Math.PI/2);T('Septum',0,0,{s:12*k*fs,w:700,c:'#fff',a:'center',b:'middle'});ctx.restore();
  // valves
  const leak=b==='mitral'&&B.sys;
  valve(ctx,300,318,B.avOpen,1,hot==='tri');valve(ctx,478,292,B.avOpen,1,hot==='mit',leak);
  valve(ctx,362,312,B.slOpen,-1,hot==='pv');valve(ctx,405,312,B.slOpen,-1,hot==='av');
  // chamber names
  const nm=(a,c,x,y)=>{T(a,x,y,{s:12.5*k*fs,w:800,c:'#fff',a:'center',b:'middle'});T(c,x,y+14*k*fs,{s:12.5*k*fs,w:800,c:'#fff',a:'center',b:'middle'});};
  nm('Right','atrium',292,246);nm('Left','atrium',478,232);nm('Right','ventricle',325,412);nm('Left','ventricle',466,415);
  // cells
  const v=sim.vis;if(v.tok)v.tok.forEach(tk=>{const ta=s.tau+tk.c+tk.lag,R=ROUTES[tk.r],P=posAt(R,ta);if(opt.noBeds&&(P.y<58||P.y>546))return;const o=oxy(ta);ctx.fillStyle=mix(DEOX,OXY,o);ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(P.x+tk.ox,P.y+tk.oy,4.6,0,6.29);ctx.fill();ctx.stroke();});
  // leak cells
  if(b==='mitral'||b==='vsd'){const n=Math.round(2+sev*12),a=b==='mitral'?[478,300]:[418,398],c=b==='mitral'?[478,245]:[368,398];
    if(B.sys)for(let i=0;i<n;i++){const u=((B.ph-.6)/.4+i/n)%1;ctx.fillStyle=OXY;ctx.strokeStyle='#ffe28a';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(lerp(a[0],c[0],u)+Math.sin(i*2.4)*8,lerp(a[1],c[1],u)+Math.cos(i*1.9)*(b==='vsd'?sev*22:6),4.6,0,6.29);ctx.fill();ctx.stroke();}}
}

function drawCutaway(sim,ctx,k,t){const s=sim.st,lv=atLeast('honors');const stop=stopAt(s.tau);
  drawHeart(sim,ctx,k,{hot:sim.p.view==='path'?stop.id:null});
  const lab=(a,x,y,al)=>txt(ctx,a,x,y,{s:12*k,w:700,c:PAL['cv-ink'],a:al||'left'});
  lab('Superior vena cava',252,70,'right');lab('Pulmonary arteries',252,106,'right');lab('Inferior vena cava',215,378,'right');
  lab('Aorta',612,92);
  lab('Pulmonary veins',614,362);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(628,345);ctx.lineTo(628,248);ctx.stroke();
  if(lv&&hasRoom(k)){const vl=(a,x,y)=>txt(ctx,a,x,y,{s:12*k,w:700,c:'#fff',b:'middle'});
    vl('Tricuspid',272,350);vl('Bicuspid',500,287);vl('(mitral)',500,302);}
  const tr=sim.vis.tok&&ROUTES[s.route||0],pos=posAt(tr||ROUTES[0],s.tau),O=oxy(s.tau);
  if(sim.p.view==='path'){
    // traced cell
    const pul=RM?0:Math.sin(t*5)*1.6;
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(210,400);ctx.lineTo(pos.x,pos.y);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(pos.x,pos.y,12+pul,0,6.29);ctx.fill();ctx.fillStyle=mix(DEOX,OXY,O);ctx.beginPath();ctx.arc(pos.x,pos.y,9+pul*.6,0,6.29);ctx.fill();
    ctx.fillStyle=PAL['card'];rr(ctx,10,388,204,156,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    const i=STOPS.indexOf(stop);txt(ctx,'Stop '+(i+1)+' of '+STOPS.length,20,392+16*k,{s:12*k,w:700,c:PAL['cv-soft']});
    let y=wrap(ctx,stop.n,20,392+34*k,186,{s:13*k,w:800},15.5*k);
    const label=O>.6?'Oxygen-rich':O>.4?'Changing color':'Oxygen-poor';ctx.fillStyle=mix(DEOX,OXY,O);ctx.beginPath();ctx.arc(29,Math.min(y+4,530),7,0,6.29);ctx.fill();txt(ctx,label,42,Math.min(y+4,530),{s:12*k,w:700,b:'middle'});
  }
  // phase card
  const B=beatState(s.tau),lub=B.ph>=.6&&B.ph<.76,dub=B.ph<.14||B.ph>.985;
  ctx.fillStyle=PAL['card'];rr(ctx,612,382,178,162,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  let y=382+18*k;y=wrap(ctx,B.sys?'Ventricles squeeze':(B.ca>.05?'Atria squeeze':'Ventricles fill'),622,y,160,{s:13*k,w:800},15.5*k);
  if(atLeast('ap')&&hasRoom(k))y=wrap(ctx,B.sys?'Systole':'Diastole',622,y,160,{s:12*k,c:PAL['cv-soft']},15*k);
  if(lub)wrap(ctx,'“Lub”: tricuspid and bicuspid valves shut',622,y+4,160,{s:12*k,w:700,c:PAL['s4']},15*k);
  else if(dub)wrap(ctx,'“Dub”: pulmonary and aortic valves shut',622,y+4,160,{s:12*k,w:700,c:PAL['s4']},15*k);
  else wrap(ctx,B.sys?'Pulmonary and aortic valves open':'Tricuspid and bicuspid valves open',622,y+4,160,{s:12*k,c:PAL['cv-soft']},15*k);
}

function drawBreaks(sim,ctx,k,t){drawCutaway(sim,ctx,k,t);const F=flow(sim);
  ctx.fillStyle=PAL['card'];rr(ctx,10,388,204,156,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  const nm=F.b==='mitral'?'Leaky bicuspid valve':F.b==='vsd'?'Hole in the septum':'Healthy heart';
  let y=wrap(ctx,nm,20,388+18*k,186,{s:13*k,w:800},15.5*k);
  y=wrap(ctx,'Body: '+F.body.toFixed(1)+' L/min',20,y+2,186,{s:12*k,w:700},15*k);
  wrap(ctx,'Lungs: '+F.lungs.toFixed(1)+' L/min',20,y,186,{s:12*k,w:700},15*k);
  if(F.b==='mitral'){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(478,292,24,0,6.29);ctx.stroke();}
  if(F.b==='vsd'){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(396,398,30,0,6.29);ctx.stroke();}
}

function drawOutput(sim,ctx,k,t){const s=sim.st,F=flow(sim),B=beatState(s.tau);
  ctx.save();ctx.beginPath();ctx.rect(0,0,370,600);ctx.clip();ctx.translate(-205,75);ctx.scale(.98,.98);drawHeart(sim,ctx,k,{noBeds:true,fs:1});ctx.restore();
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(370,0,430,600);
  // equation
  const eqY=46;txt(ctx,F.hr+' beats/min × '+Math.round(F.S)+' mL/beat',580,eqY,{s:14*k,w:700,a:'center'});
  txt(ctx,'= '+F.co.toFixed(1)+' L/min',580,eqY+24*k,{s:19*k,w:800,a:'center',c:PAL['s1']});
  // one-beat cylinder
  const top=150,hgt=340,cx=460,w=70,YS=v=>top+hgt-(v/180)*hgt;
  ctx.fillStyle=PAL['card2'];rr(ctx,cx-w/2,top,w,hgt,8);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();
  const ej=F.S*(B.sys?B.cv:1);ctx.fillStyle=OXY;ctx.fillRect(cx-w/2+2,YS(ej),w-4,top+hgt-YS(ej)-1);
  [0,60,120,180].forEach(v=>{ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx+w/2,YS(v));ctx.lineTo(cx+w/2+6,YS(v));ctx.stroke();txt(ctx,v+'',cx+w/2+9,YS(v),{s:12*k,c:PAL['cv-soft'],b:'middle'});});
  wrap(ctx,'One beat (mL)',cx,top-12-14*k,130,{s:12*k,w:700,a:'center'},14*k);
  // five-liter jug
  const jx=660,jw=120,YJ=v=>top+hgt-(v/FULL)*hgt;
  ctx.fillStyle=PAL['card2'];rr(ctx,jx-jw/2,top,jw,hgt,10);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle=OXY;ctx.fillRect(jx-jw/2+2,YJ(s.jug),jw-4,top+hgt-YJ(s.jug)-1);
  for(let v=1;v<=5;v++){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(jx+jw/2,YJ(v));ctx.lineTo(jx+jw/2+6,YJ(v));ctx.stroke();txt(ctx,v+'',jx+jw/2+9,YJ(v),{s:12*k,c:PAL['cv-soft'],b:'middle'});}
  wrap(ctx,'All your blood (L)',jx,top-12-14*k,230,{s:12*k,w:700,a:'center'},14*k);
  txt(ctx,s.jugN>0?'Whole supply pumped '+s.jugN+' time'+(s.jugN>1?'s':''):'Filling, in real time',590,top+hgt+22*k,{s:12*k,c:PAL['cv-soft'],a:'center'});
  if(F.hr>190)txt(ctx,'Too fast to fill between beats',590,top+hgt+42*k,{s:12*k,w:700,c:PAL['s1'],a:'center'});
}

function drawCircuits(sim,ctx,k,t){const s=sim.st,sel=sim.p.vessel,V=VESSELS[sel],C={pa:[[230,302],[230,190],[110,190],[110,90]],pv:[[350,90],[350,265],[292,265]],ao:[[292,335],[350,335],[350,510]],vc:[[110,510],[110,265],[168,265]]};
  const isSel=id=>sel===(id==='ao'?'aorta':id);
  const line=(id,col)=>{if(isSel(id)){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=24;ctx.lineJoin='round';ctx.beginPath();C[id].forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}ctx.strokeStyle=col;ctx.lineWidth=15;ctx.lineJoin='round';ctx.beginPath();C[id].forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();};
  line('vc',DEOX);line('pa',DEOX);line('pv',OXY);line('ao',OXY);
  // beds
  const bed=(y,lab,leftToRightOxy,on)=>{const g=ctx.createLinearGradient(100,0,360,0);g.addColorStop(0,leftToRightOxy?DEOX:DEOX);g.addColorStop(1,OXY);ctx.fillStyle=g;rr(ctx,96,y,268,50,12);ctx.fill();if(on){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=4;ctx.stroke();}txt(ctx,lab,230,y+(y<100?18:32),{s:12.5*k,w:800,c:'#fff',a:'center',b:'middle'});};
  bed(40,'Lung capillaries',true,sel==='capL');bed(510,'Body capillaries',false,sel==='capB');
  // heart square
  const hx=168,hy=228,hw=124,hh=146;ctx.fillStyle=FLESH2;rr(ctx,hx-6,hy-6,hw+12,hh+12,16);ctx.fill();
  ctx.fillStyle=DEOX;rr(ctx,hx,hy,hw/2-4,hh/2-3,8);ctx.fill();rr(ctx,hx,hy+hh/2+3,hw/2-4,hh/2-3,8);ctx.fill();ctx.fillStyle=OXY;rr(ctx,hx+hw/2+4,hy,hw/2-4,hh/2-3,8);ctx.fill();rr(ctx,hx+hw/2+4,hy+hh/2+3,hw/2-4,hh/2-3,8);ctx.fill();
  // redraw the piece of pulmonary artery that crosses the atrial level
  ctx.strokeStyle=isSel('pa')?PAL['s4']:FLESH2;ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(230,306);ctx.lineTo(230,222);ctx.stroke();ctx.strokeStyle=DEOX;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(230,308);ctx.lineTo(230,220);ctx.stroke();
  txt(ctx,'Heart',230,hy+hh+14+13*k,{s:12.5*k,w:800,a:'center'});
  // labels inside the loops
  const cc=(a,y,o)=>txt(ctx,a,230,y,Object.assign({s:13*k,w:800,a:'center',b:'middle'},o||{}));
  cc('Pulmonary circuit',112);txt(ctx,'Pulmonary arteries',122,114+24*k,{s:12*k});txt(ctx,'Pulmonary veins',338,114+24*k+15*k,{s:12*k,a:'right'});
  cc('Systemic circuit',440);txt(ctx,'Vena cava',122,492,{s:12*k});txt(ctx,'Aorta',338,492,{s:12*k,a:'right'});
  // moving cells
  const paths=[[[230,302],[230,190],[110,190],[110,80],[350,80],[350,265],[292,265]],[[292,335],[350,335],[350,520],[110,520],[110,265],[168,265]]];
  const fr=(s.vt||0);paths.forEach((pp,pi)=>{const n=pi?10:7;let len=0;const seg=[];for(let i=1;i<pp.length;i++){const d=Math.hypot(pp[i][0]-pp[i-1][0],pp[i][1]-pp[i-1][1]);seg.push(d);len+=d;}
    for(let j=0;j<n;j++){let d=((fr*55+j/n*len)%len),i=0;while(d>seg[i]){d-=seg[i];i++;}const u=d/seg[i],x=lerp(pp[i][0],pp[i+1][0],u),y=lerp(pp[i][1],pp[i+1][1],u);
      let o;if(pi===0){o=i<3?0:i===3?u:1;}else{o=i<2?1:i===2?1-u:0;}
      ctx.fillStyle=mix(DEOX,OXY,o);ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(x,y,5.5,0,6.29);ctx.fill();ctx.stroke();}});
  // panel
  const px=384,pw=406;ctx.fillStyle=PAL['card'];rr(ctx,px,12,pw,576,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  const mx=px+pw/2,cy=82,R=56,wt=Math.max(2,R*V.w*.55),lumen=V.kind==='Capillary'?R*.4:R;
  ctx.fillStyle=mix('#d8b49c','#a8705a',.4);ctx.beginPath();ctx.arc(mx,cy,lumen,0,6.29);ctx.fill();ctx.fillStyle=V.c;ctx.beginPath();ctx.arc(mx,cy,Math.max(4,lumen-wt),0,6.29);ctx.fill();
  let y=cy+R+18*k;y=wrap(ctx,V.n,px+16,y,pw-32,{s:15*k,w:800},18*k);
  txt(ctx,(V.kind==='Artery'?'An artery':'A '+V.kind.toLowerCase())+', cut across',px+16,y,{s:12*k,c:PAL['cv-soft']});y+=19*k;
  const fact=(h,b)=>{txt(ctx,h,px+16,y,{s:12*k,w:800,c:PAL['cv-soft']});y+=15*k;y=wrap(ctx,b,px+16,y,pw-32,{s:13*k},15.5*k)+4;};
  fact('Direction',V.dir);fact('Blood',V.blood);if(hasRoom(k)||!atLeast('ap'))fact('Wall',V.wall);if(atLeast('ap'))fact('Pressure',V.mm);
  // trap banner
  const by=Math.max(y+6,588-10-(hasRoom(k)?62:78*k)),bh=588-by-10;if(bh>40){ctx.fillStyle=PAL['card2'];rr(ctx,px+10,by,pw-20,bh,8);ctx.fill();wrap(ctx,'Artery means away from the heart. Vein means toward it. Neither word tells you about oxygen.',px+20,by+15*k,pw-40,{s:12*k,w:700},15*k);}
}

function drawBlood(sim,ctx,k,t){const v=sim.vis,sel=sim.p.cell,j=RM?0:1;
  // tube
  const tx=40,tw=66,ty=48,th=432,hP=.55,hB=.012;
  ctx.fillStyle='#e7c977';rr(ctx,tx,ty,tw,th,16);ctx.fill();
  ctx.save();rr(ctx,tx,ty,tw,th,16);ctx.clip();ctx.fillStyle='#f2efe6';ctx.fillRect(tx,ty+th*hP,tw,Math.max(6,th*hB));ctx.fillStyle='#a51d2a';ctx.fillRect(tx,ty+th*(hP+hB)+2,tw,th);ctx.restore();
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;rr(ctx,tx,ty,tw,th,16);ctx.stroke();
  const L=(a,b,y,on)=>{const c=on?PAL['s4']:PAL['cv-ink'];const yy=wrap(ctx,a,tx+tw+12,y,hasRoom(k)?200:175,{s:12.5*k,w:800,c},15*k);if(b)txt(ctx,b,tx+tw+12,yy,{s:12*k,c:PAL['cv-soft']});};
  L('Plasma','about 55%',ty+90,sel==='plasma');
  L('White cells and platelets','under 1%',ty+th*hP-14*k,sel==='wbc'||sel==='plt');
  L('Red blood cells','about 45%',ty+th*hP+84+((k-1)*16),sel==='rbc');
  txt(ctx,'Spun tube of blood',tx-24,ty-10,{s:12*k,c:PAL['cv-soft']});
  // field
  const fx=565,fy=250,fr=218;ctx.save();ctx.beginPath();ctx.arc(fx,fy,fr,0,6.29);ctx.clip();ctx.fillStyle=sel==='plasma'?'#ecd387':'#f3e4b8';ctx.fillRect(fx-fr,fy-fr,fr*2,fr*2);
  const a=id=>sel===id||sel==='plasma'?1:.32;
  ctx.globalAlpha=sel==='plasma'?.45:a('rbc');
  v.rbc.forEach(c=>{const x=c.x+Math.sin(t*.4+c.p)*2*j,y=c.y+Math.cos(t*.33+c.p)*2*j;ctx.fillStyle='#c02a35';ctx.beginPath();ctx.arc(x,y,13,0,6.29);ctx.fill();ctx.fillStyle='#e1787c';ctx.beginPath();ctx.arc(x,y,5.5,0,6.29);ctx.fill();});
  ctx.globalAlpha=sel==='plasma'?.45:a('plt');v.plt.forEach(c=>{ctx.fillStyle='#7d5aa8';ctx.beginPath();ctx.ellipse(c.x+Math.sin(t*.5+c.p)*2*j,c.y,4.6,3.2,c.p,0,6.29);ctx.fill();});
  ctx.globalAlpha=sel==='plasma'?.45:a('wbc');{const c=v.wbc;ctx.fillStyle='#ece6f4';ctx.beginPath();ctx.arc(c.x,c.y,26,0,6.29);ctx.fill();ctx.strokeStyle='#8a78a8';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#5c3f8f';[[-7,-5,9],[7,-3,8],[0,8,8]].forEach(n=>{ctx.beginPath();ctx.arc(c.x+n[0],c.y+n[1],n[2],0,6.29);ctx.fill();});}
  ctx.globalAlpha=1;ctx.restore();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(fx,fy,fr,0,6.29);ctx.stroke();
  // scale bar
  ctx.fillStyle=PAL['card'];rr(ctx,fx+fr-142,fy+fr-32,142,32,8);ctx.fill();ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(fx+fr-134,fy+fr-13,35,4);txt(ctx,'10 µm',fx+fr-92,fy+fr-11,{s:12*k,w:700,b:'middle'});
  // never blue
  const by=492;ctx.fillStyle=PAL['card'];rr(ctx,10,by,780,98,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle=OXY;rr(ctx,22,by+12,44,26,6);ctx.fill();txt(ctx,'Oxygen-rich: bright red',74,by+25,{s:12.5*k,w:700,b:'middle'});
  ctx.fillStyle=DEOX;rr(ctx,410,by+12,44,26,6);ctx.fill();txt(ctx,'Oxygen-poor: dark red',462,by+25,{s:12.5*k,w:700,b:'middle'});
  wrap(ctx,'Blood is never blue. Veins look blue through skin because of how light scatters in it.',22,by+50+6*k,756,{s:12*k,c:PAL['cv-soft']},14.5*k);
}

const HEART={
  id:'heart',hash:'heart',apUnit:9,order:7,kind:'Simulation',tab:'Heart and circulation',next:['breathing','homeostasis'],
  card:'Follow one red blood cell through every chamber and valve. Then change heart rate and stroke volume, break a valve, and see where the blood goes.',
  title:'Heart and circulation',
  lede:{bio:'Follow one red blood cell through the heart, the lungs and the body, stop by stop. Then change how fast and how hard the heart pumps.',
        honors:'Trace blood through the pulmonary and systemic circuits, sort arteries from veins by direction, and calculate cardiac output.',
        ap:'Connect structure to pressure: wall thickness, valve timing, ejection fraction, and what a leaky valve or septal defect does to flow.'},
  scale:{bio:'One heart, about the size of your fist, moving about 5 liters of blood every minute at rest.'},
  aspect:4/3,timeless:true,animated:true,trials:true,
  controls:[
    {id:'view',label:'View',type:'seg',def:'path',lvl:'bio',noTrial:true,options:[{v:'path',l:'Blood path'},{v:'circuits',l:'Two circuits'},{v:'output',l:'Cardiac output'},{v:'breaks',l:'What breaks'},{v:'blood',l:'Blood'}],onChange(sim){sync(sim);sim.infoDirty=true;}},
    {id:'auto',label:'Keep flowing',help:'Off: the cell moves only when you press Next stop',type:'toggle',def:true,lvl:'bio',noTrial:true,views:['path'],onChange(sim){if(sim.st){sim.st.loop=null;sim.st.target=null;}}},
    {id:'hr',label:'Heart rate',type:'range',min:40,max:220,step:1,def:72,unit:' BPM',lvl:'bio',views:['output','breaks']},
    {id:'sv',label:'Stroke volume',type:'range',min:30,max:180,step:5,def:70,unit:' mL',lvl:'bio',help:'Blood the left ventricle pushes out each beat.',views:['output','breaks']},
    {id:'brk',label:'Problem',type:'seg',def:'mitral',lvl:'bio',noTrial:true,views:['breaks'],options:[{v:'none',l:'Healthy'},{v:'mitral',l:'Leaky valve'},{v:'vsd',l:'Septal defect'}],onChange(sim){sync(sim);sim.infoDirty=true;}},
    {id:'leak',label:'Size of the leak',type:'range',min:10,max:60,step:5,def:30,unit:' %',lvl:'bio',views:['breaks'],help:'Share of each left ventricle squeeze that goes the wrong way.'},
    {id:'vessel',label:'Vessel',type:'select',def:'pa',lvl:'bio',noTrial:true,views:['circuits'],options:[{v:'aorta',l:'Aorta'},{v:'pa',l:'Pulmonary arteries'},{v:'pv',l:'Pulmonary veins'},{v:'vc',l:'Superior and inferior vena cava'},{v:'capL',l:'Lung capillaries'},{v:'capB',l:'Body capillaries'}],onChange(sim){sim.infoDirty=true;}},
    {id:'cell',label:'Blood component',type:'select',def:'rbc',lvl:'bio',noTrial:true,views:['blood'],options:[{v:'rbc',l:'Red blood cells'},{v:'wbc',l:'White blood cells'},{v:'plt',l:'Platelets'},{v:'plasma',l:'Plasma'}],onChange(sim){sim.infoDirty=true;}}
  ],
  actions:[
    {id:'next',label:'Next stop',primary:true,views:['path'],run(sim){if(sim.p.view!=='path')BioLab.setValues(sim,{view:'path'});goStop(sim,STOPS.indexOf(stopAt(sim.st.tau))+1);}},
    {id:'prev',label:'Previous stop',views:['path'],run(sim){if(sim.p.view!=='path')BioLab.setValues(sim,{view:'path'});jumpStop(sim,STOPS.indexOf(stopAt(sim.st.tau))-1);}},
    {id:'first',label:'Back to the vena cava',views:['path'],run(sim){if(sim.p.view!=='path')BioLab.setValues(sim,{view:'path'});jumpStop(sim,0);}},
    {id:'rest',label:'At rest',views:['output'],run(sim){BioLab.setValues(sim,{hr:72,sv:70});sim.st.jug=0;sim.st.jugN=0;}},
    {id:'jog',label:'Jogging',views:['output'],run(sim){BioLab.setValues(sim,{hr:150,sv:100});sim.st.jug=0;sim.st.jugN=0;}},
    {id:'hard',label:'All-out sprint',views:['output'],run(sim){BioLab.setValues(sim,{hr:190,sv:115});sim.st.jug=0;sim.st.jugN=0;}},
    {id:'athR',label:'Trained athlete at rest',lvl:'honors',views:['output'],run(sim){BioLab.setValues(sim,{hr:50,sv:100});sim.st.jug=0;sim.st.jugN=0;}},
    {id:'athH',label:'Trained athlete all-out',lvl:'honors',views:['output'],run(sim){BioLab.setValues(sim,{hr:190,sv:170});sim.st.jug=0;sim.st.jugN=0;}}
  ],
  init(){return {tau:7.4,idx:0,target:null,loop:null,lt:0,route:3,jug:0,jugN:0,vt:0};},
  step(sim,dt){const s=sim.st,p=sim.p;const slow=(p.view==='path'||p.view==='breaks'||p.view==='circuits')?4:1;const rate=(p.view==='path'?72:p.hr)/60/slow;s.vt+=dt;
    if(s.loop){s.lt+=rate*dt;if(s.lt>s.loop[1])s.lt=s.loop[0];s.tau=((s.lt%BEATS)+BEATS)%BEATS;}
    else if(p.view==='path'&&!p.auto){if(s.target!==null){let d=((s.target-s.tau)%BEATS+BEATS)%BEATS;const m=rate*3*dt;if(d<=m||d>BEATS-1e-3){s.tau=s.target;s.target=null;}else s.tau=(s.tau+m)%BEATS;}}
    else{const old=s.tau;s.tau=(s.tau+rate*dt)%BEATS;if(s.tau<old)s.route=(s.route+1)%4;}
    if(p.view==='path'){const c=STOPS.indexOf(stopAt(s.tau));if(c!==s.idx){s.idx=c;sim.infoDirty=true;}}
    if(p.view==='output'){const F=flow(sim);s.jug+=F.co/60*dt;if(s.jug>=FULL){s.jug-=FULL;s.jugN++;}}},
  onLevel(sim){sync(sim);},
  metrics:[
    {id:'rate',views:['path'],label:'Heart rate',unit:'BPM',lvl:'bio',min:0,max:220,d:0,get:()=>72},
    {id:'code',views:['path'],label:'Oxygen in the traced cell’s hemoglobin',unit:'%',lvl:'bio',min:60,max:100,fixed:true,d:0,get:s=>lerp(75,98,oxy(s.st.tau))},
    {id:'body0',views:['path'],label:'Whole loop at rest',unit:'s',lvl:'honors',min:0,max:120,d:0,get:()=>60},
    {id:'hr',views:['output','breaks'],label:'Heart rate',unit:'BPM',lvl:'bio',min:0,max:220,d:0,get:s=>flow(s).hr},
    {id:'sv',views:['output','breaks'],label:'Stroke volume',unit:'mL',lvl:'bio',min:0,max:180,d:0,get:s=>flow(s).S},
    {id:'co',views:['output','breaks'],label:'Cardiac output',unit:'L/min',lvl:'bio',min:0,max:36,d:1,get:s=>flow(s).co},
    {id:'body',views:['breaks'],label:'Blood reaching the body',unit:'L/min',lvl:'bio',min:0,max:36,d:1,get:s=>flow(s).body},
    {id:'lungs',views:['breaks'],label:'Blood through the lungs',unit:'L/min',lvl:'honors',min:0,max:36,d:1,get:s=>flow(s).lungs},
    {id:'ratio',views:['breaks'],label:'Lung flow ÷ body flow',unit:'',lvl:'ap',min:0,max:4,d:2,get:s=>flow(s).ratio},
    {id:'loop',views:['output'],label:'Time for all 5 L to pass',unit:'s',lvl:'bio',min:0,max:300,d:0,get:s=>flow(s).loop},
    {id:'day',views:['output'],label:'Beats per day',unit:'',lvl:'honors',min:0,max:320000,d:0,get:s=>flow(s).hr*1440},
    {id:'edv',views:['output'],label:'Ventricle volume before the squeeze',unit:'mL',lvl:'ap',min:0,max:260,d:0,get:s=>flow(s).edv},
    {id:'ef',views:['output'],label:'Ejection fraction',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>flow(s).ef},
    {id:'vDir',views:['circuits'],label:'Direction',unit:'',lvl:'bio',text:true,noTrial:true,get:s=>VESSELS[s.p.vessel].dir},
    {id:'vBlood',views:['circuits'],label:'Blood',unit:'',lvl:'bio',text:true,noTrial:true,get:s=>VESSELS[s.p.vessel].blood},
    {id:'vMm',views:['circuits'],label:'Pressure',unit:'',lvl:'ap',text:true,noTrial:true,get:s=>VESSELS[s.p.vessel].mm},
    {id:'cCount',views:['blood'],label:'How much',unit:'',lvl:'bio',text:true,noTrial:true,get:s=>CELLS[s.p.cell].count},
    {id:'cSize',views:['blood'],label:'Size',unit:'',lvl:'bio',text:true,noTrial:true,get:s=>CELLS[s.p.cell].size}
  ],
  graphs:[{id:'cohr',label:'Cardiac output vs heart rate',custom:true},{id:'flows',label:'Where the blood goes',custom:true}],defaultGraph:'cohr',
  plot(sim,ctx,box,id){const F=flow(sim);
    if(id==='flows'){const ax=axes(ctx,box,{xmin:0,xmax:2,ymin:0,ymax:Math.max(8,F.lungs*1.25,F.body*1.25),yl:'L/min',xcats:['Body','Lungs']});bars(ctx,ax,[F.body,F.lungs],{colors:[PAL['s1'],PAL['s2']],d:1});return;}
    const ymax=36,ax=axes(ctx,box,{xmin:40,xmax:220,ymin:0,ymax,xl:'Heart rate (BPM)',yl:'Cardiac output (L/min)'});ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();for(let h=40;h<=220;h+=2){const y=h*sim.p.sv*fillFactor(h)/1000,X=ax.X(h),Y=ax.Y(y);h===40?ctx.moveTo(X,Y):ctx.lineTo(X,Y);}ctx.stroke();
    ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(F.hr),ax.Y(F.co),6,0,6.29);ctx.fill();legend(ctx,box.L+12,box.T+14,[{label:'Stroke volume held at '+sim.p.sv+' mL',color:PAL['s1']}]);},
  challenges:[
    {lvl:'bio',instant:true,q:'What kind of blood do the pulmonary arteries carry?',choices:['Oxygen-rich, because all arteries do','Oxygen-poor, on its way to the lungs','A mix of both'],correct:1,set:{view:'circuits',vessel:'pa'},
      explain:'Follow the path: the right ventricle pushes oxygen-poor blood into the pulmonary arteries, and that blood has not reached the lungs yet. Artery means away from the heart. It says nothing about oxygen.'},
    {lvl:'bio',instant:true,q:'At rest, your heart beats 72 times a minute and pushes out 70 mL per beat. What is your cardiac output?',choices:['About 1 L/min','About 5 L/min','About 50 L/min'],correct:1,set:{view:'output',hr:72,sv:70},
      explain:'72 × 70 mL = 5,040 mL, or about 5 L/min. That is about all of your blood, every minute.'},
    {lvl:'bio',instant:true,q:'Which chamber has the thickest wall, and why?',choices:['Right atrium, because it receives blood from the whole body','Right ventricle, because it is first to pump','Left ventricle, because it pumps blood through the whole body'],correct:2,set:{view:'path'},
      explain:'The left ventricle pushes against about 115 mmHg, while the right ventricle pushes against only about 25 mmHg. More work builds more muscle. Look at the wall around each ventricle in the cutaway.'},
    {lvl:'honors',instant:true,q:'A cell just left the right ventricle. What are its next two stops?',choices:['Tricuspid valve, then right atrium','Pulmonary valve, then pulmonary arteries','Aortic valve, then aorta'],correct:1,set:{view:'path',auto:false},
      explain:'Valves work one way. Blood leaves the right ventricle through the pulmonary valve and heads into the pulmonary arteries, then the lungs. Press Next stop to check.'},
    {lvl:'honors',instant:true,q:'A trained athlete has a resting heart rate of 50 BPM. Set a stroke volume of 100 mL. How does cardiac output compare with the usual 5 L/min?',choices:['Much lower, because the heart beats slowly','About the same, because each beat moves more blood','Much higher, because athletes always pump more'],correct:1,set:{view:'output',hr:50,sv:100},
      explain:'50 × 100 mL = 5 L/min. The resting body needs about the same blood either way. A stronger heart delivers it with fewer beats.'},
    {lvl:'honors',instant:true,q:'The bicuspid valve leaks. Each squeeze, 30% of the blood goes the wrong way. Where does it go, and what does the body get?',choices:['Back into the left atrium, so the body gets about 30% less','Into the right ventricle, so the body gets more','Into the aorta, so the body gets the same'],correct:0,set:{view:'breaks',brk:'mitral',leak:30,hr:72,sv:70},
      explain:'With the bicuspid valve not sealing, the squeeze pushes blood back into the left atrium. Only 70% goes forward: 5.0 falls to about 3.5 L/min. The backed-up blood raises pressure in the lungs, which is why a person may get short of breath. Doctors hear the backflow as a murmur.'},
    {lvl:'ap',instant:true,q:'A septal defect sends 1/3 of each left ventricle squeeze into the right ventricle. What is the ratio of lung flow to body flow?',choices:['0.67','1.0','1.5','3.0'],correct:2,set:{view:'breaks',brk:'vsd',leak:35,hr:72,sv:70},
      explain:'If the left ventricle ejects 3 parts, 1 part crosses the hole and 2 go to the body. All 3 parts then go through the lungs, so 3 ÷ 2 = 1.5. The tool shows about 1.54 at a 35% leak. Blood crosses from left to right because left ventricle pressure is far higher.'},
    {lvl:'ap',instant:true,q:'A left ventricle holds 120 mL before it squeezes and ejects 70 mL. What is the ejection fraction?',choices:['About 17%','About 58%','About 71%','100%, because it empties'],correct:1,set:{view:'output',hr:72,sv:70},
      explain:'70 ÷ 120 = 58%. A healthy ventricle does not empty completely, and about 50 mL stays behind. Normal is about 55 to 70%.'}
  ],
  onChallenge(sim,ch,phase){if(ch&&ch.set&&phase==='ask')BioLab.setValues(sim,ch.set);},
  narrate(sim){const v=sim.p.view,s=sim.st,F=flow(sim);
    if(v==='path'){const st=stopAt(s.tau);return '<b>'+st.n+'.</b> '+st.t;}
    if(v==='circuits'){const V=VESSELS[sim.p.vessel];return '<b>'+V.n+':</b> '+V.dir.toLowerCase()+'. '+V.blood+' blood. The pulmonary circuit runs heart to lungs to heart. The systemic circuit runs heart to body to heart.';}
    if(v==='output'){if(F.hr>190)return '<b>The heart is beating too fast to fill.</b> At '+F.hr+' BPM, stroke volume falls to '+Math.round(F.S)+' mL, so a faster rate stops paying off.';
      return '<b>'+F.hr+' beats × '+Math.round(F.S)+' mL = '+F.co.toFixed(1)+' L/min.</b> All 5 liters of your blood pass through the heart about every '+Math.round(F.loop)+' seconds.'+(F.co>12?' Exercising muscles take most of that extra flow.':'');}
    if(v==='breaks'){if(F.b==='mitral')return '<b>Blood goes backward through the bicuspid valve.</b> '+Math.round(F.back)+' mL of each squeeze returns to the left atrium, so the body gets '+F.body.toFixed(1)+' L/min instead of '+F.co.toFixed(1)+'. Pressure backs up into the lungs.';
      if(F.b==='vsd')return '<b>Oxygen-rich blood crosses the septum.</b> Left ventricle pressure is far higher, so '+Math.round(F.back)+' mL per beat flows into the right ventricle and back through the lungs. The lungs get '+F.lungs.toFixed(1)+' L/min while the body gets '+F.body.toFixed(1)+'.';
      return 'Every valve seals, and the septum keeps the two sides apart. The body and the lungs get the same '+F.body.toFixed(1)+' L/min. Pick a problem to see what changes.';}
    const C=CELLS[sim.p.cell];return '<b>'+C.n+'.</b> '+C.d;},
  infoPanel(sim){const v=sim.p.view,ap=atLeast('ap');
    if(v==='path'){const st=stopAt(sim.st.tau),i=STOPS.indexOf(st),nx=STOPS[(i+1)%STOPS.length];return '<h3>'+st.n+'</h3><p>'+st.t+'</p>'+(ap?'<p><b>Pressure:</b> '+st.mm+'</p>':'')+'<p><b>Next stop:</b> '+nx.n+'</p><p class="note">You are facing the person, so the heart’s right side is on your left. Dark red and bright red are both real blood colors. Press a part of the heart to jump to it.</p>';}
    if(v==='circuits')return '<h3>Two loops, one heart</h3><p><b>Pulmonary circuit:</b> right ventricle to the lungs and back to the left atrium. It picks up oxygen.</p><p><b>Systemic circuit:</b> left ventricle to the body and back to the right atrium. It delivers oxygen.</p><p>Capillaries sit between arteries and veins. Their walls are one cell thick, so this is the only place gases and nutrients cross.</p>';
    if(v==='output')return '<h3>Cardiac output = heart rate × stroke volume</h3><p>Exercise raises both. Heart rate more than doubles, and stroke volume rises because the ventricle fills well and squeezes harder.</p><p>Training mostly raises stroke volume. That is why an athlete’s resting heart rate is low.</p>';
    if(v==='breaks')return '<h3>What breaks</h3><p><b>Leaky valve:</b> a valve that does not seal lets blood go backward, so the heart pumps some of the same blood twice.</p><p><b>Septal defect:</b> a hole between the ventricles. The left side has higher pressure, so oxygen-rich blood crosses to the right and takes an extra trip through the lungs.</p>';
    const C=CELLS[sim.p.cell];return '<h3>'+C.n+'</h3><p>'+C.d+'</p><p><b>How much:</b> '+C.count+'<br><b>Size:</b> '+C.size+'</p><p class="note">The field shows one white blood cell so you can compare it. In a real field of this size you would often see none.</p>';},
  onClick(sim,x,y){const v=sim.p.view;
    if(v==='path'){let best=null,bd=46;STOPS.forEach((st,i)=>{const P=posAt(ROUTES[sim.st.route||0],st.tau),d=Math.hypot(P.x-x,P.y-y);if(d<bd){bd=d;best=i;}});if(best!==null)jumpStop(sim,best);return;}
    if(v==='circuits'){let id=null;if(y>=40&&y<=90&&x>96&&x<364)id='capL';else if(y>=510&&y<=560&&x>96&&x<364)id='capB';else if(Math.abs(x-110)<18&&y<190&&y>90)id='pa';else if(y>178&&y<202&&x>100&&x<230)id='pa';else if(Math.abs(x-350)<18&&y>90&&y<280)id='pv';else if(Math.abs(x-110)<18&&y>255&&y<510)id='vc';else if(Math.abs(x-350)<18&&y>320&&y<510)id='aorta';if(id)BioLab.setValues(sim,{vessel:id});return;}
    if(v==='blood'){let id=null;if(x<110){const f=(y-48)/432;if(f>=0&&f<=.545)id='plasma';else if(f>.545&&f<.575)id='wbc';else if(f>=.575&&f<=1)id='rbc';}else{const V=sim.vis;if(Math.hypot(x-V.wbc.x,y-V.wbc.y)<28)id='wbc';else if(V.plt.some(c=>Math.hypot(x-c.x,y-c.y)<10))id='plt';else if(V.rbc.some(c=>Math.hypot(x-c.x,y-c.y)<14))id='rbc';else if(Math.hypot(x-565,y-250)<218)id='plasma';}if(id)BioLab.setValues(sim,{cell:id});}},
  tour:[
    {title:'Oxygen-poor blood comes home',text:'A red blood cell, ringed in white, returns from the body through a vena cava. It has given up oxygen, so it is dark red. It is never blue.',focus:[[210,50,90,170],[210,300,60,250]],speed:1,setup(sim){BioLab.setValues(sim,{view:'path',auto:false});sim.st.route=3;setLoop(sim,7.2,8);}},
    {title:'Right atrium to right ventricle',text:{bio:'The cell enters the right atrium. The ventricle relaxes, the tricuspid valve opens, and the cell falls through into the right ventricle.',honors:'The cell enters the right atrium. During diastole the ventricle relaxes, the tricuspid valve opens, and the atrium tops the ventricle off with a final squeeze.'},focus:[238,195,150,290],speed:1,setup(sim){sim.st.route=3;setLoop(sim,8,8.6);}},
    {title:'Out to the lungs',text:'The right ventricle squeezes. The tricuspid valve slams shut (“lub”), the pulmonary valve opens, and the cell enters a pulmonary artery. This artery carries oxygen-poor blood.',focus:[[260,310,120,170],[340,100,50,220],[150,100,210,60]],speed:1,setup(sim){sim.st.route=1;setLoop(sim,8.55,9.3);}},
    {title:'The lungs change the color',text:'In the lung capillaries, the cell drops carbon dioxide and picks up oxygen. It turns bright red.',focus:[[10,130,150,220],[640,130,150,220]],speed:1,setup(sim){sim.st.route=1;setLoop(sim,9.5,10.5);}},
    {title:'Back to the left atrium',text:'The pulmonary veins carry oxygen-rich blood back to the left atrium. They are veins because they head toward the heart.',focus:[[520,180,140,100],[425,180,120,110]],speed:1,setup(sim){sim.st.route=1;setLoop(sim,10.4,11.2);}},
    {title:'The strongest pump',text:'The cell falls through the bicuspid (mitral) valve into the left ventricle, the thickest chamber. Its squeeze opens the aortic valve and pushes the cell up the aorta.',focus:[[405,175,160,345]],speed:1,setup(sim){sim.st.route=1;setLoop(sim,11,12.05);}},
    {title:'Out to the body and home',text:'The aorta branches into smaller arteries and then capillaries. Oxygen leaves, carbon dioxide enters, and the cell turns dark red again. It heads back to the vena cava. A full loop takes about a minute at rest.',focus:[[120,45,500,80],[575,80,70,480],[120,545,530,50]],speed:1,setup(sim){sim.st.route=1;setLoop(sim,12,15.4);}},
    {lvl:'honors',title:'Cardiac output',text:'Now zoom out. Heart rate × stroke volume = cardiac output: 72 × 70 mL ≈ 5 L/min at rest. Watch the jug fill in real time.',focus:[370,0,430,600],speed:1,setup(sim){BioLab.setValues(sim,{view:'output',hr:72,sv:70});sim.st.loop=null;sim.st.jug=0;}}
  ],
  onTourExit(sim){if(sim.st)sim.st.loop=null;BioLab.setValues(sim,{view:'path',auto:true,hr:72,sv:70});},
  lab:{bio:'<p><b>Question:</b> How does your body get more blood to your muscles during exercise?</p><ol><li>Choose <b>Cardiac output</b>. Press At rest and record a trial.</li><li>Press Jogging and record. Press All-out sprint and record.</li><li>For each one, note heart rate, stroke volume, cardiac output and the time for all 5 L to pass.</li></ol><p>Which changed more, heart rate or stroke volume? How many times more blood moves in a sprint than at rest?</p>',
       honors:'<p><b>Question:</b> Why does a trained athlete have a low resting heart rate?</p><ol><li>Choose <b>Cardiac output</b>. Record At rest and Trained athlete at rest.</li><li>Record All-out sprint and Trained athlete all-out.</li><li>Choose <b>What breaks</b> and record 10%, 30% and 60% for the Leaky valve. Write down blood reaching the body and blood through the lungs.</li></ol><p>Explain each result with cardiac output = heart rate × stroke volume.</p>',
       ap:'<p><b>Question:</b> How does a septal defect change flow through the two circuits?</p><ol><li>Choose <b>What breaks</b>, then Septal defect. Record leak sizes of 10, 20, 30, 40, 50 and 60%.</li><li>Plot lung flow ÷ body flow against leak size (Trials view).</li><li>Sweep heart rate from 160 to 220 BPM in <b>Cardiac output</b> and record. Find where output peaks.</li></ol><p><b>Claim, evidence, reasoning:</b> Why is a large defect hard on both the lungs and the left ventricle? Why does output fall at very high heart rates?</p>'},
  terms:[{t:'Atrium',d:'An upper, receiving chamber of the heart.'},{t:'Ventricle',d:'A lower, pumping chamber of the heart.'},{t:'Septum',d:'The wall that separates the right and left sides of the heart.'},{t:'Valve',d:'A one-way door: tricuspid, pulmonary, bicuspid (mitral), aortic.'},{t:'Artery',d:'Carries blood away from the heart.'},{t:'Vein',d:'Carries blood toward the heart.'},{t:'Capillary',d:'A vessel one cell thick, where exchange happens.'},{t:'Cardiac output',d:'Blood pumped per minute: heart rate × stroke volume.'},{t:'Stroke volume',d:'Blood pumped per beat, about 70 mL at rest.'},
    {lvl:'honors',t:'Pulmonary circuit',d:'Right ventricle to lungs to left atrium.'},{lvl:'honors',t:'Systemic circuit',d:'Left ventricle to body to right atrium.'},{lvl:'honors',t:'Murmur',d:'The sound of blood moving the wrong way or through a narrow opening.'},{lvl:'honors',t:'Hemoglobin',d:'The protein in red blood cells that carries oxygen.'},
    {lvl:'ap',t:'Systole / diastole',d:'The ventricles squeezing / the ventricles relaxing and filling.'},{lvl:'ap',t:'Ejection fraction',d:'Stroke volume ÷ the volume before the squeeze. Normal is about 55 to 70%.'},{lvl:'ap',t:'Shunt',d:'Blood taking a path that skips part of the normal loop.'}],
  about:'<p><b>Blood path:</b> one clock runs the cutaway, so each valve opens and closes on time and the chambers fill and empty in step. The cell takes 8 beats per loop so you can follow it. A real cell takes about a minute at rest, and spends most of that in the body.</p><p><b>Cardiac output</b> = heart rate × stroke volume. Rest is 72 BPM × 70 mL ≈ 5 L/min. Above 190 BPM the model lowers stroke volume, because the ventricle has too little time to fill. That cutoff is a rough teaching value, not a medical limit. The volume left in the ventricle runs from about 25 to 60 mL, and ejection fraction comes from that. 115/75 mmHg is the course’s normal value. Many charts round to 120/80.</p><p><b>What breaks:</b> a leaky valve removes a share of each squeeze from forward flow. A septal defect sends a share of left ventricle output to the right ventricle: body flow = stroke × (1 − share), lung flow = stroke. Real disease also changes pressures and heart size over years, which this model doesn’t show.</p><p><b>Simplified:</b> the cutaway is a schematic, not a true-to-scale image. Coronary arteries, many branch vessels, and the four separate pulmonary veins are left out. Oxygen on hemoglobin is shown as 75% in veins and 98% in arteries, typical resting values. The bicuspid (mitral) valve has two flaps, and the drawn flaps are the same for all four valves. Blood counts are typical adult ranges. This is for learning, not for diagnosing anyone.</p>',
  initVis(sim){const r=rng(41),v=sim.vis;v.tok=[];for(let i=0;i<64;i++){const up=r()<.33,left=r()<.5;v.tok.push({c:i%BEATS,lag:(r()-.5)*.16,r:(up?0:2)+(left?0:1),ox:(r()-.5)*11,oy:(r()-.5)*11});}
    v.rbc=[];for(let i=0;i<170&&v.rbc.length<82;i++){const a=r()*6.283,d=Math.sqrt(r())*205,x=565+Math.cos(a)*d,y=250+Math.sin(a)*d;if(Math.hypot(x-690,y-175)<40)continue;if(v.rbc.every(c=>Math.hypot(c.x-x,c.y-y)>22))v.rbc.push({x,y,p:r()*6.28});}
    v.wbc={x:690,y:175};v.plt=[];for(let i=0;i<5;i++){const a=i*1.26+.4,d=70+i*22;v.plt.push({x:565+Math.cos(a)*d,y:250+Math.sin(a)*d,p:r()*6.28});}},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,600);const v=sim.p.view;
    if(v==='path')drawCutaway(sim,ctx,k,t);else if(v==='breaks')drawBreaks(sim,ctx,k,t);else if(v==='output')drawOutput(sim,ctx,k,t);else if(v==='circuits')drawCircuits(sim,ctx,k,t);else drawBlood(sim,ctx,k,t);},
  thumbSetup(sim){sim.p.auto=true;sim.st.tau=3.4;}
};
BioLab.register(HEART);
})();
