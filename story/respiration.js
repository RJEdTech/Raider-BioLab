/* Story: "Why are you out of breath?"  Cellular respiration (the electron transport chain), told as one story.
   The top picture shows the real parts on the inner mitochondrial membrane, drawn to scale (about 8.6 px per nanometer).
   The bottom picture shows the same events as energy height. Every particle in one picture has a twin in the other.
   Every count is literal: 2 electrons per NADH; 4 + 4 + 2 H+ pumped; 4 H+ per ATP; 1 oxygen atom + 2 electrons -> 1 water. */
(function(){
'use strict';
const {clamp,lerp,ease,rr,txt,pill,ring,boxring,arrow,hash}=Story.h;
const W=1200,H=600;
const C={ims:'#fcefe4',matrix:'#e6f0f8',head:'#dca23a',tail:'#eadbb2',ink:'#26262b',soft:'#62626a',h:'#d81b6a',e:'#f7c20a',es:'#6b4e00',
  atp:'#1b7339',c1:'#3f6fb5',c3:'#22887a',c4:'#7a55a8',syn:'#9c2536',syn2:'#c44a5c',q:'#e08a1e',cyt:'#b8502f',o:'#2f86d1',rj:'#C11430',think:'#a8178f'};
const X={I:230,III:500,IV:730,S:1000},M0=142,M1=178,TOPH=310;
const SA=.8,OR={I:[222,160],III:[500,160],IV:[730,160]};      // SA: pixels per ångström (so 10 nm = 80 px); OR: where each real structure's own origin sits
const PUMPX={I:[130,162,194,226],III:[478,492,508,522],IV:[722,740]};   // Complex I really has four separate H+ channels along its membrane arm
const LV=[402,457,487,573];              // electron energy steps, to scale (150 px per volt): NADH -0.32 V, Q +0.05, cytochrome c +0.25, O2 +0.82
const TR={x0:250,x1:1080,y0:350,y1:376},LOW=586,TUBE={I:268,III:538,IV:768},TY=470;   // TY: turbine center
const NMAX=48,PUMPN={I:4,III:4,IV:2};

/* ---------------- the model: one particle per real particle ---------------- */
function newSim(){return {t:0,pairs:[],ims:[],fly:[],q:{st:'home',p:0},c:{st:'home',p:0},oAtoms:2,oWait:0,rotor:0,rotorT:0,acc:0,through:0,
  n:{nadh:0,h:0,atp:0,o2:0,water:0},ev:{h:[],w:[]},tally:{I:0,III:0,IV:0},supply:false,open:false,o2:1,d:0.12,showH:true,bp:1,seed:1};}
const G=sim=>Math.min(1,sim.ims.length/NMAX);
function addIMS(sim,n){for(let k=0;k<n;k++){const s=sim.seed++;sim.ims.push({x:20+hash(s)*1160,y:30+hash(s+.5)*84,vx:0,vy:0});}}
function sendNADH(sim){if(sim.pairs.some(p=>p.st==='dock'))return false;sim.pairs.push({st:'dock',p:0});return true;}
function pump(sim,at){if(!sim.showH)return;const n=PUMPN[at];sim.tally[at]=n;sim.n.h+=n;
  for(let i=0;i<n;i++){const s=sim.seed++;sim.fly.push({k:'hup',at,i,p:-i*0.13,x:PUMPX[at][i],tx:clamp(PUMPX[at][i]+(hash(s)-.5)*200,20,1180),ty:34+hash(s+.3)*84});}}
function rate(sim,k,win){win=win||5;const a=sim.ev[k==='atp'?'h':'w'];while(a.length&&a[0]<sim.t-win)a.shift();return a.length/(k==='atp'?4:2)/Math.min(win,Math.max(2,sim.t));}   // ATP = H+ through / 4; O2 = waters / 2
function step(sim,dt){
  sim.t+=dt;const g=G(sim),bp=sim.showH?Math.max(0,1-g*g):1;sim.bp=bp;
  const has=st=>sim.pairs.some(p=>p.st===st);
  if(sim.supply&&!has('dock'))sim.pairs.push({st:'dock',p:0});
  for(const k of ['q','c']){const c=sim[k];if(c.st==='back'){c.p-=dt/0.5;if(c.p<=0){c.p=0;c.st='home';}}}
  if(sim.oAtoms===0){sim.oWait+=dt*sim.o2;if(sim.oWait>0.4){sim.oAtoms=2;sim.oWait=0;sim.fly.push({k:'o2in',p:0});}}
  for(const p of sim.pairs){
    if(p.st==='dock'){p.p=Math.min(1,p.p+dt/0.9);if(p.p>=1&&!has('I')&&!sim.hold){p.st='I';p.p=0;p.pumped=false;sim.n.nadh++;sim.tally={I:0,III:0,IV:0};sim.fly.push({k:'nad',p:0});}}
    else if(p.st==='I'){p.p=Math.min(1,p.p+dt/1.0*bp);if(!p.pumped&&p.p>.55){p.pumped=true;pump(sim,'I');}
      if(p.p>=1&&sim.q.st==='home'&&!has('Q')){p.st='Q';p.p=0;sim.q.st='go';sim.q.p=0;}}
    else if(p.st==='Q'){p.p=Math.min(1,p.p+dt/0.8);sim.q.p=p.p;if(p.p>=1&&!has('III')){p.st='III';p.p=0;p.pumped=false;sim.q.st='back';sim.q.p=1;}}
    else if(p.st==='III'){p.p=Math.min(1,p.p+dt/1.0*bp);if(!p.pumped&&p.p>.55){p.pumped=true;pump(sim,'III');}
      if(p.p>=1&&sim.c.st==='home'&&!has('c')){p.st='c';p.p=0;sim.c.st='go';sim.c.p=0;}}
    else if(p.st==='c'){p.p=Math.min(1,p.p+dt/0.8);sim.c.p=p.p;if(p.p>=1&&!has('IV')){p.st='IV';p.p=0;p.pumped=false;sim.c.st='back';sim.c.p=1;}}
    else if(p.st==='IV'){const can=sim.oAtoms>0;if(can||p.p<.5)p.p=Math.min(can?1:.5,p.p+dt/1.0*bp);
      if(can&&!p.pumped&&p.p>.55){p.pumped=true;pump(sim,'IV');}
      if(p.p>=1&&can){p.st='done';sim.oAtoms--;sim.n.water++;sim.ev.w.push(sim.t);sim.fly.push({k:'water',p:0,s:hash(sim.n.water*1.7)});
        if(sim.oAtoms===0){sim.n.o2++;sim.oWait=0;}}}
  }
  sim.pairs=sim.pairs.filter(p=>p.st!=='done');
  // H+ crowd: random walk, with a gentle pull toward an open ATP synthase
  for(const h of sim.ims){h.vx+=(Math.random()-.5)*520*dt;h.vy+=(Math.random()-.5)*520*dt;if(sim.open)h.vx+=Math.sign(X.S-h.x)*26*dt;
    h.vx*=.94;h.vy*=.94;h.x+=h.vx*dt;h.y+=h.vy*dt;if(h.x<14){h.x=14;h.vx=Math.abs(h.vx);}if(h.x>1186){h.x=1186;h.vx=-Math.abs(h.vx);}
    if(h.y<30){h.y=30;h.vy=Math.abs(h.vy);}if(h.y>128){h.y=128;h.vy=-Math.abs(h.vy);}}
  if(sim.open&&sim.ims.length){sim.acc+=sim.d*12*Math.max(g,.3)*dt;
    while(sim.acc>=1&&sim.ims.length){sim.acc-=1;let bi=0,bd=1e9;sim.ims.forEach((h,i)=>{const d=Math.abs(h.x-X.S-20)+Math.abs(h.y-128)*.4;if(d<bd){bd=d;bi=i;}});
      const h=sim.ims.splice(bi,1)[0];sim.fly.push({k:'hdown',x:h.x,y:h.y,p:0});sim.rotorT+=Math.PI/6;sim.through++;sim.ev.h.push(sim.t);
      if(sim.through%4===0){sim.n.atp++;sim.fly.push({k:'atp',p:0,s:hash(sim.n.atp*3.1)});}}}
  else sim.acc=Math.min(sim.acc,.5);
  sim.rotor+=(sim.rotorT-sim.rotor)*Math.min(1,dt*7);
  const DUR={hup:.75,hdown:.55,water:2.6,atp:2.6,nad:1.7,o2in:.5};
  for(const f of sim.fly){f.p+=dt/DUR[f.k];if(f.k==='hup'&&f.p>=1){sim.ims.push({x:f.tx,y:f.ty,vx:0,vy:0});}}
  sim.fly=sim.fly.filter(f=>f.p<1);
}

/* ---------------- small drawing parts ---------------- */
function dot(ctx,x,y,r,fill,stroke,lw){ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=lw||1.2;ctx.strokeStyle=stroke;ctx.stroke();}}
function hplus(ctx,x,y,a){ctx.globalAlpha=a==null?1:a;dot(ctx,x,y,4.6,C.h,'#fff',1.3);ctx.globalAlpha=1;}
function epair(ctx,x,y){dot(ctx,x-5.5,y,5.2,C.e,C.es,1.4);dot(ctx,x+5.5,y,5.2,C.e,C.es,1.4);}
function body(ctx,col,draw){const g=ctx.createLinearGradient(0,100,0,300);g.addColorStop(0,shade(col,.22));g.addColorStop(1,shade(col,-.12));ctx.fillStyle=g;ctx.strokeStyle=shade(col,-.35);ctx.lineWidth=2;draw();ctx.fill();ctx.stroke();}
function shade(hex,k){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=v=>Math.round(k>0?v+(255-v)*k:v*(1+k));return 'rgb('+f(r)+','+f(g)+','+f(b)+')';}
function poly(pts,p){ // point along a polyline, p in 0..1
  let L=0;const seg=[];for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(d);L+=d;}
  let s=clamp(p,0,1)*L;for(let i=0;i<seg.length;i++){if(s<=seg[i]||i===seg.length-1){const k=seg[i]?s/seg[i]:0;return [lerp(pts[i][0],pts[i+1][0],k),lerp(pts[i][1],pts[i+1][1],k)];}s-=seg[i];}}
/* electron paths go through the real stepping stones: FMN and the iron-sulfur clusters in Complex I, heme and iron-sulfur in Complex III, copper and heme in Complex IV */
const PATH={I:[[278,259],[276,250],[266,246],[272,242],[272,233],[272,219],[268,213],[261,204],[258,182]],III:[[484,156],[494,149],[482,126],[486,123],[486,104]],IV:[[733,118],[733,143],[736,158],[735,164]]};
function pairXY(p){
  if(p.st==='dock')return [lerp(64,222,ease(p.p)),264];
  if(p.st==='I')return poly(PATH.I,p.p);
  if(p.st==='Q')return [lerp(262,480,p.p),lerp(172,158,p.p)];
  if(p.st==='III')return poly(PATH.III,p.p);
  if(p.st==='c')return [lerp(486,733,p.p),lerp(90,104,p.p)+26*Math.sin(p.p*Math.PI)];
  return poly(PATH.IV,p.p);}
function pairE(p){ // the same pair on the energy stairs
  const d=(a,b,pp)=>lerp(a,b,ease((pp-.5)/.5));
  if(p.st==='dock')return [lerp(124,208,ease(p.p)),LV[0]];
  if(p.st==='I')return [lerp(208,252,p.p),p.p<.5?LV[0]:d(LV[0],LV[1],p.p)];
  if(p.st==='Q')return [lerp(252,478,p.p),LV[1]];
  if(p.st==='III')return [lerp(478,522,p.p),p.p<.5?LV[1]:d(LV[1],LV[2],p.p)];
  if(p.st==='c')return [lerp(522,708,p.p),LV[2]];
  return [lerp(708,756,p.p),p.p<.5?LV[2]:d(LV[2],LV[3],p.p)];}

/* ---------------- top picture: the real parts ---------------- */
function drawTop(ctx,sim,o){o=o||{};const t=o.t||0,x0=o.x0||0,M=Story.mol;
  ctx.fillStyle=C.ims;ctx.fillRect(0,0,W,M0+18);ctx.fillStyle=C.matrix;ctx.fillRect(0,M1-18,W,TOPH-M1+18);
  // membrane, to scale: two rows of lipids about 4.5 nm across in all
  ctx.strokeStyle=C.tail;ctx.lineWidth=1.6;ctx.beginPath();
  for(let x=4;x<W;x+=6.6){ctx.moveTo(x-1.5,M0+6);ctx.lineTo(x-1.5,M0+18);ctx.moveTo(x+1.5,M0+6);ctx.lineTo(x+1.5,M0+18);ctx.moveTo(x-1.5,M1-18);ctx.lineTo(x-1.5,M1-6);ctx.moveTo(x+1.5,M1-18);ctx.lineTo(x+1.5,M1-6);}ctx.stroke();
  for(let x=4;x<W;x+=6.6){dot(ctx,x,M0+3.5,3.1,C.head,shade(C.head,-.3),.8);dot(ctx,x,M1-3.5,3.1,C.head,shade(C.head,-.3),.8);}
  {const w=txt(ctx,'OUTSIDE THE INNER MEMBRANE',x0+14,22,{s:15,w:700,c:'#8a5a33'});txt(ctx,'(intermembrane space)',x0+22+w,22,{s:15,c:'#8a5a33'});}
  {const w=txt(ctx,'INSIDE THE MITOCHONDRION',350,TOPH-6,{s:15,w:700,c:'#44688a'});txt(ctx,'(matrix)',358+w,TOPH-6,{s:15,c:'#44688a'});}
  // scale bar: 10 nm = 80 px
  ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0+470,17);ctx.lineTo(x0+550,17);ctx.moveTo(x0+470,11);ctx.lineTo(x0+470,23);ctx.moveTo(x0+550,11);ctx.lineTo(x0+550,23);ctx.stroke();
  txt(ctx,'10 nanometers',x0+559,22,{s:15,w:600});
  // the real structures (Protein Data Bank 5XTH and 8H9S), all at the same scale
  M.draw(ctx,'CI',OR.I[0],OR.I[1],SA);M.draw(ctx,'CIII',OR.III[0],OR.III[1],SA);M.draw(ctx,'CIV',OR.IV[0],OR.IV[1],SA);M.drawATP(ctx,X.S,160,SA,sim.rotor);
  // the electron stepping stones inside them, at their measured positions
  for(const k of ['I','III','IV'])for(const q of M.pts('C'+k)){const px=OR[k][0]+q[1]*SA,py=OR[k][1]+q[2]*SA,cu=q[0][0]==='C',he=q[0][0]==='h';dot(ctx,px,py,he?3.6:3,cu?'#7fd0f0':he?'#f08a6a':'#ffe58a','rgba(40,30,0,.75)',1);}
  // carriers: Q moves inside the membrane; cytochrome c moves along its outer face
  const qp=sim.q.p,qx=lerp(262,480,qp),qy=lerp(172,158,qp);ctx.strokeStyle=shade(C.q,-.25);ctx.lineWidth=2.4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(qx-5,qy);for(let i=1;i<=5;i++)ctx.lineTo(qx-5-i*5,qy+((i%2)?3:-3));ctx.stroke();
  dot(ctx,qx,qy,6,C.q,shade(C.q,-.45),1.4);txt(ctx,'Q',qx,qy-10,{s:13.5,w:700,a:'center',c:shade(C.q,-.5),halo:3});
  const cp=sim.c.p,cx=lerp(486,733,cp),cy=lerp(90,104,cp)+26*Math.sin(cp*Math.PI);dot(ctx,cx,cy,12,C.cyt,shade(C.cyt,-.4),1.5);txt(ctx,'c',cx,cy+4.5,{s:14,w:700,a:'center',c:'#fff'});
  // part names
  const nm=(a,b,x,y)=>{txt(ctx,a,x,y,{s:17,w:700,a:'center',c:'#fff',halo:4,hc:'rgba(20,20,30,.6)'});if(b)txt(ctx,b,x,y+16,{s:13.5,w:600,a:'center',c:'#fff',halo:3.5,hc:'rgba(20,20,30,.6)'});};
  nm('Pump 1','Complex I',170,156);nm('Pump 2','Complex III',500,204);nm('Pump 3','Complex IV',730,194);
  txt(ctx,'ATP synthase',X.S+6,120,{s:16.5,w:700,a:'center',c:C.syn,halo:4.5});
  // oxygen at the real reaction site, deep inside Complex IV (drawn on top so you can see it), and the supply drifting nearby
  const ox=727,oy=171;
  if(sim.oAtoms>0){for(let k=0;k<sim.oAtoms;k++)dot(ctx,ox+k*16,oy,8.5,C.o,'#fff',1.6);}
  const nO=Math.round(sim.o2*4);for(let k=0;k<nO;k++){const bx=820+k*30+Math.sin(t*.7+k*2)*8,by=262+Math.cos(t*.5+k*1.3)*12+(k%2)*14;dot(ctx,bx,by,7.5,C.o,shade(C.o,-.4),1.3);dot(ctx,bx+13,by,7.5,C.o,shade(C.o,-.4),1.3);}
  if(nO)txt(ctx,'oxygen from your breath',936,TOPH-9,{s:14.5,c:shade(C.o,-.45),w:600,a:'right'});
  // waiting NADH (fuel), then every moving particle
  if(o.fuel!==false&&x0<20)for(let k=0;k<2;k++)nadh(ctx,[48,44][k]+Math.sin(t*.6+k)*5,[222,294][k]+Math.cos(t*.8+k*2)*3,.5);
  for(const p of sim.pairs){const [x,y]=pairXY(p);if(p.st==='dock')nadh(ctx,x,y,1,true);else epair(ctx,x,y);}
  for(const f of sim.fly){
    if(f.k==='hup'&&f.p>0){const e=ease(f.p),x=lerp(f.x,f.tx,e*e*e),y=lerp(204,f.ty,e);hplus(ctx,x,y,Math.min(1,f.p*5));}
    else if(f.k==='hdown'){const e=f.p;let x,y;if(e<.45){const k=ease(e/.45);x=lerp(f.x,X.S+20,k);y=lerp(f.y,M0-2,k);}else{const k=(e-.45)/.55;x=X.S+20-Math.sin(k*Math.PI)*16;y=lerp(M0-2,M1+12,k);}hplus(ctx,x,y,e>.85?(1-e)/.15:1);}
    else if(f.k==='water'){const x=ox+10+f.p*46+f.s*10,y=oy+26+f.p*60;ctx.globalAlpha=f.p<.12?f.p/.12:f.p>.75?(1-f.p)/.25:1;water(ctx,x,y);ctx.globalAlpha=1;}
    else if(f.k==='atp'){const x=1040+f.p*64,y=252+f.p*22+f.s*18;ctx.globalAlpha=f.p>.75?(1-f.p)/.25:1;pill(ctx,'ATP',x,y,{bg:C.atp,c:'#fff',bd:null,s:14.5,w:700});ctx.globalAlpha=1;}
    else if(f.k==='nad'){ctx.globalAlpha=1-f.p;pill(ctx,'NAD⁺ (empty)',210-f.p*70,264+f.p*28,{bg:'#eef0f3',c:C.soft,bd:'#a9afb8',s:14});ctx.globalAlpha=1;}
    else if(f.k==='o2in'){const k=ease(f.p);ctx.globalAlpha=k;dot(ctx,lerp(820,ox,k),lerp(262,oy,k),8.5,C.o,'#fff',1.6);dot(ctx,lerp(833,ox+16,k),lerp(262,oy,k),8.5,C.o,'#fff',1.6);ctx.globalAlpha=1;}
  }
  if(sim.showH)for(const h of sim.ims)hplus(ctx,h.x,h.y);
}
function nadh(ctx,x,y,a,full){ctx.globalAlpha=a;const w=pill(ctx,'NADH',x,y,{bg:'#fff8dc',c:'#5d4500',bd:'#b08a00',s:full?15.5:14,w:700});if(full){dot(ctx,x+w/2+9,y-6,5.2,C.e,C.es,1.4);dot(ctx,x+w/2+9,y+6,5.2,C.e,C.es,1.4);}ctx.globalAlpha=1;}
function water(ctx,x,y){dot(ctx,x-7,y-7,4.5,'#fff','#7a8794',1.2);dot(ctx,x+7,y-7,4.5,'#fff','#7a8794',1.2);dot(ctx,x,y,8.5,C.o,shade(C.o,-.4),1.4);txt(ctx,'H₂O',x+13,y+5,{s:14.5,w:700,c:shade(C.o,-.45),halo:3});}

/* ---------------- bottom picture: the same trip as energy height ---------------- */
function drawEnergy(ctx,sim,lvl,o){o=o||{};const a=o.alpha==null?1:o.alpha;if(a<=0)return;ctx.save();ctx.globalAlpha=a;
  rr(ctx,8,TOPH+10,W-16,H-TOPH-16,12);ctx.fillStyle='#fbfaf6';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#d8d8d3';ctx.stroke();
  // faint links between the two pictures
  ctx.setLineDash([3,5]);ctx.strokeStyle='rgba(38,38,43,.3)';ctx.lineWidth=1.5;ctx.beginPath();
  for(const x of [X.I,X.III,X.IV].concat(lvl>=3?[X.S]:[])){ctx.moveTo(x,TOPH-22);ctx.lineTo(x,x===X.S?TR.y0:TOPH+34);}ctx.stroke();ctx.setLineDash([]);
  // energy axis
  arrow(ctx,36,LOW,36,TOPH+34,{c:C.soft,lw:2.5,head:11});ctx.save();ctx.translate(23,470);ctx.rotate(-Math.PI/2);txt(ctx,'ENERGY',0,0,{s:14.5,w:700,a:'center',c:C.soft});ctx.restore();
  txt(ctx,'high',47,TOPH+46,{s:14,c:C.soft});txt(ctx,'low',47,LOW+1,{s:14,c:C.soft});
  if(lvl>=2){ // the lift: tubes, the high trough, the low pool
    ctx.fillStyle='rgba(216,27,106,.18)';ctx.fillRect(TR.x0,LOW-4,TR.x1-TR.x0,8);
    for(const k of ['I','III','IV']){ctx.fillStyle='rgba(216,27,106,.09)';ctx.strokeStyle='rgba(216,27,106,.45)';ctx.lineWidth=1.3;ctx.fillRect(TUBE[k]-10,TR.y1,20,LOW-4-TR.y1);ctx.strokeRect(TUBE[k]-10,TR.y1,20,LOW-4-TR.y1);}
    const g=G(sim);rr(ctx,TR.x0,TR.y0,TR.x1-TR.x0,TR.y1-TR.y0,5);ctx.fillStyle='#fff';ctx.fill();
    ctx.save();rr(ctx,TR.x0,TR.y0,TR.x1-TR.x0,TR.y1-TR.y0,5);ctx.clip();ctx.fillStyle='rgba(216,27,106,.5)';const fh=(TR.y1-TR.y0)*g;ctx.fillRect(TR.x0,TR.y1-fh,TR.x1-TR.x0,fh);ctx.restore();
    rr(ctx,TR.x0,TR.y0,TR.x1-TR.x0,TR.y1-TR.y0,5);ctx.lineWidth=2;ctx.strokeStyle=C.h;ctx.stroke();
    txt(ctx,'H⁺ lifted up here: '+Math.round(g*100)+'% full',TR.x0+300,TR.y0+19,{s:15.5,w:700,c:'#6f0d37',a:'left',halo:3.5,hc:'rgba(255,255,255,.75)'});
  }
  // the stairs
  const st=()=>{ctx.moveTo(110,LV[0]);ctx.lineTo(X.I,LV[0]);ctx.lineTo(X.I,LV[1]);ctx.lineTo(X.III,LV[1]);ctx.lineTo(X.III,LV[2]);ctx.lineTo(X.IV,LV[2]);ctx.lineTo(X.IV,LV[3]);ctx.lineTo(846,LV[3]);};
  ctx.beginPath();st();ctx.lineTo(846,LOW-5);ctx.lineTo(110,LOW-5);ctx.closePath();ctx.fillStyle='rgba(247,194,10,.2)';ctx.fill();
  ctx.beginPath();st();ctx.lineWidth=4;ctx.strokeStyle=C.ink;ctx.lineJoin='round';ctx.stroke();
  txt(ctx,'NADH:',118,LV[0]+24,{s:15.5,w:700,c:'#5d4500'});txt(ctx,'high energy',118,LV[0]+43,{s:15.5,w:600,c:'#5d4500'});
  txt(ctx,'riding on Q',372,LV[1]+24,{s:15,c:'#6a5a2a',a:'center'});txt(ctx,'riding on cytochrome c',622,LV[2]+24,{s:15,c:'#6a5a2a',a:'center'});
  txt(ctx,'Oxygen: the lowest step',790,LV[3]-34,{s:15.5,w:700,c:shade(C.o,-.45)});
  if(sim.oAtoms>0){dot(ctx,806,LV[3]-12,8.5,C.o,shade(C.o,-.4),1.3);if(sim.oAtoms>1)dot(ctx,822,LV[3]-12,8.5,C.o,shade(C.o,-.4),1.3);}
  else if(sim.o2<=0){ // no oxygen: the bottom step is blocked
    ctx.strokeStyle=C.rj;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(X.IV-13,LV[2]+26);ctx.lineTo(X.IV+13,LV[2]+56);ctx.moveTo(X.IV+13,LV[2]+26);ctx.lineTo(X.IV-13,LV[2]+56);ctx.stroke();}
  for(const p of sim.pairs){const [x,y]=pairE(p);epair(ctx,x,y-8.5);}
  if(lvl>=2){
    for(const p of sim.pairs){const i=['I','III','IV'].indexOf(p.st);if(i>=0&&p.p>.5&&p.p<1){const k=['I','III','IV'][i],my=(LV[i]+LV[i+1])/2;ctx.globalAlpha=a*Math.sin((p.p-.5)*2*Math.PI);arrow(ctx,X[k]+5,my,TUBE[k]-12,my,{c:C.h,lw:4,head:11});ctx.globalAlpha=a;}}
    for(const f of sim.fly)if(f.k==='hup'&&f.p>0){const i=f.i;hplus(ctx,TUBE[f.at]+((i%2)?4.5:-4.5),lerp(LOW-6,TR.y1-7,ease(f.p))-i*3);}
    for(const k of ['I','III','IV'])if(sim.tally[k])txt(ctx,'lifts '+PUMPN[k]+' H⁺',TUBE[k]+17,TR.y1+24,{s:15.5,w:700,c:'#8d1146'});
  }
  if(lvl>=3){ // the turbine
    ctx.fillStyle='rgba(216,27,106,.12)';ctx.strokeStyle='rgba(216,27,106,.5)';ctx.lineWidth=1.3;ctx.fillRect(X.S-10,TR.y1,20,TY-36-TR.y1);ctx.strokeRect(X.S-10,TR.y1,20,TY-36-TR.y1);ctx.fillRect(X.S-10,TY+36,20,LOW-4-TY-36);ctx.strokeRect(X.S-10,TY+36,20,LOW-4-TY-36);
    ctx.save();ctx.translate(X.S,TY);ctx.rotate(sim.rotor);ctx.strokeStyle=C.syn;ctx.lineWidth=5.5;ctx.lineCap='round';for(let k=0;k<12;k++){ctx.rotate(Math.PI/6);ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(32,0);ctx.stroke();}ctx.restore();
    dot(ctx,X.S,TY,11,C.syn,shade(C.syn,-.4),2);ctx.beginPath();ctx.arc(X.S,TY,35,0,6.2832);ctx.lineWidth=2.5;ctx.strokeStyle=shade(C.syn,-.2);ctx.stroke();
    if(!sim.open){ctx.fillStyle=C.ink;ctx.fillRect(X.S-18,TR.y1+22,36,8);txt(ctx,'closed',X.S+24,TR.y1+31,{s:15,w:700,c:C.ink});}
    for(const f of sim.fly){if(f.k==='hdown'){hplus(ctx,X.S+Math.sin(f.p*9)*3,lerp(TR.y1-4,LOW-8,f.p));}
      else if(f.k==='atp'){ctx.globalAlpha=a*(f.p>.75?(1-f.p)/.25:1);pill(ctx,'ATP',X.S+52+f.p*44,TY-4-f.p*22+f.s*20,{bg:C.atp,c:'#fff',bd:null,s:14.5,w:700});ctx.globalAlpha=a;}}
    txt(ctx,'turbine =',X.S+46,TY+56,{s:15,c:C.syn,w:600});txt(ctx,'ATP synthase',X.S+46,TY+74,{s:15,c:C.syn,w:700});
  }
  ctx.restore();
}
function tag(ctx,s,x,y){pill(ctx,s,x,y,{bg:C.ink,c:'#fff',bd:null,s:13.5,w:700,a:'right',r:5});}
function chip(ctx,s,x,y,o){o=o||{};return pill(ctx,s,x,y,Object.assign({bg:'#fff',c:C.ink,bd:C.ink,s:17,w:700,a:'left',r:8,lw:2},o));}

/* ---------------- zoom levels ---------------- */
const BOX=[{x:535,y:118,w:92},{x:520,y:232,w:120},{x:556,y:246,w:110},{x:290,y:107,w:76}];   // where the next level sits inside each one
const WIDE=[1.3,1.2e-3,2.4e-5,2.2e-6,1.2e-7];                                               // real width of each picture, in meters
function person(ctx,col){ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineCap='round';ctx.lineJoin='round';
  const L=(pts,w)=>{ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();};
  L([[566,66],[538,104],[556,134]],13);                 // back arm
  L([[545,152],[520,222],[474,276]],19);                // back leg
  ctx.beginPath();ctx.ellipse(482,281,17,8,-.2,0,6.2832);ctx.fill();
  L([[547,150],[566,66]],32);                           // torso
  L([[545,152],[606,128],[612,200]],19);                // front leg
  ctx.beginPath();ctx.ellipse(622,204,17,8,0,0,6.2832);ctx.fill();
  L([[566,66],[600,98],[630,84]],13);                   // front arm
  ctx.beginPath();ctx.arc(578,34,18,0,6.2832);ctx.fill();}
function drawStairs(ctx,S,hook){
  ctx.fillStyle='#f1eee6';ctx.fillRect(0,0,W,H);ctx.fillStyle='#e4e0d5';ctx.fillRect(0,0,W,12);
  // landing, door, clock
  ctx.fillStyle='#d9d3c4';ctx.fillRect(710,166,490,374);ctx.fillStyle='#c9c2b0';ctx.fillRect(710,166,490,10);
  rr(ctx,930,14,96,152,4);ctx.fillStyle='#8a6a4a';ctx.fill();rr(ctx,946,30,64,52,3);ctx.fillStyle='#cfe2ee';ctx.fill();dot(ctx,1012,98,5,'#d8c27a');
  rr(ctx,1040,66,84,30,4);ctx.fillStyle='#3a3e45';ctx.fill();txt(ctx,'ROOM 214',1082,86,{s:13,w:700,a:'center',c:'#fff'});
  dot(ctx,860,104,26,'#fff','#3a3e45',4);ctx.strokeStyle='#3a3e45';ctx.lineWidth=3.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(860,104);ctx.lineTo(860,86);ctx.moveTo(860,104);ctx.lineTo(849,97);ctx.stroke();
  // steps
  for(let k=1;k<=8;k++){const x=150+70*(k-1),y=470-38*k;ctx.fillStyle=k%2?'#cbc4b2':'#c2bba8';ctx.fillRect(x,y,W-x,H-y);ctx.fillStyle='#b3ab96';ctx.fillRect(x,y,70,6);}
  ctx.fillStyle='#d9d3c4';ctx.fillRect(710,166,490,374);ctx.fillStyle='#c9c2b0';ctx.fillRect(710,166,490,8);
  ctx.fillStyle='#b9b2a0';ctx.fillRect(0,470,150,70);
  const bob=hook?Math.sin(S.t*5)*2.5:0;ctx.save();ctx.translate(0,bob);person(ctx,'#33373e');
  ctx.strokeStyle=C.rj;ctx.lineWidth=32;ctx.lineCap='butt';ctx.beginPath();ctx.moveTo(549,140);ctx.lineTo(563,80);ctx.stroke();ctx.restore();
  if(hook){const k=(S.t*.9)%1,inn=Math.floor(S.t*.9)%2===0;
    arrow(ctx,706,18,608,30,{c:C.o,lw:5,head:15});pill(ctx,'O₂ in',752,16,{bg:'#fff',c:shade(C.o,-.45),bd:C.o,s:17,w:700,lw:2});
    arrow(ctx,608,44,706,58,{c:'#7b7f88',lw:5,head:15,dash:[9,7]});pill(ctx,'? out',750,62,{bg:'#fff',c:'#4a4e57',bd:'#7b7f88',s:17,w:700,lw:2});
    for(let i=0;i<4;i++){const kk=(k+i/4)%1,p=inn?1-kk:kk;ctx.globalAlpha=.75*Math.sin(kk*Math.PI);dot(ctx,lerp(606,694,p),inn?lerp(32,20,p):lerp(42,54,p)-10+10,5,inn?C.o:'#9aa0aa');ctx.globalAlpha=1;}
    pill(ctx,'3 flights. 20 seconds to the bell.',250,70,{bg:'#fff',c:C.ink,bd:C.ink,s:17,w:700,r:9});}
}
function drawFibers(ctx,t){ctx.fillStyle='#f7e3df';ctx.fillRect(0,0,W,H);
  const ys=[18,112,206,300,394,488,582],hh=80;
  ys.forEach((y,i)=>{const g=ctx.createLinearGradient(0,y,0,y+hh);g.addColorStop(0,'#e58a84');g.addColorStop(.5,'#cf645f');g.addColorStop(1,'#b94f4d');rr(ctx,-30,y,W+60,hh,38);ctx.fillStyle=g;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#9c3f3f';ctx.stroke();
    ctx.save();rr(ctx,-30,y,W+60,hh,38);ctx.clip();ctx.strokeStyle='rgba(110,30,36,.28)';ctx.lineWidth=2;ctx.beginPath();for(let x=4;x<W;x+=11){ctx.moveTo(x,y);ctx.lineTo(x,y+hh);}ctx.stroke();ctx.restore();
    for(let k=0;k<4;k++){ctx.beginPath();ctx.ellipse(120+k*300+i*70%260,y+8,24,6,0,0,6.2832);ctx.fillStyle='#5c3a7a';ctx.fill();}});
  // a capillary with red blood cells between two fibers
  ctx.strokeStyle='#f3b6ae';ctx.lineWidth=13;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-10,199);ctx.lineTo(W+10,199);ctx.stroke();
  for(let k=0;k<12;k++){const x=((k*104+t*46)%(W+60))-30;ctx.beginPath();ctx.ellipse(x,199,12,5.5,0,0,6.2832);ctx.fillStyle='#c62828';ctx.fill();}
  pill(ctx,'blood vessel: brings oxygen',190,176,{bg:'#fff',c:'#8e1b1b',bd:'#c62828',s:15});pill(ctx,'one muscle fiber (a single long cell)',900,340,{bg:'#fff',c:C.ink,bd:C.ink,s:15});}
function mitoShape(ctx,x,y,w,h){rr(ctx,x,y,w,h,h/2);}
function drawInside(ctx){ctx.fillStyle='#f6e7e1';ctx.fillRect(0,0,W,H);
  for(let b=0;b<6;b++){const y=8+b*108;ctx.fillStyle='#e9a39b';ctx.fillRect(0,y,W,74);
    for(let x=-40;x<W;x+=150){ctx.fillStyle='#c9605e';ctx.fillRect(x+28,y,94,74);ctx.fillStyle='#d98780';ctx.fillRect(x+68,y,14,74);ctx.fillStyle='#7a2e33';ctx.fillRect(x-2,y,4,74);}
    if(b<5)for(let k=0;k<9;k++){const mx=24+k*134+(b%2)*52,my=y+80;mitoShape(ctx,mx,my,86,22);ctx.fillStyle='#e9a04c';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#a8641e';ctx.stroke();
      ctx.strokeStyle='rgba(168,100,30,.7)';ctx.lineWidth=1.5;ctx.beginPath();for(let j=0;j<6;j++){ctx.moveTo(mx+14+j*11,my+3+(j%2)*2);ctx.lineTo(mx+14+j*11,my+17-(j%2)*2+2);}ctx.stroke();}}
  pill(ctx,'striped bands: these do the pulling',260,46,{bg:'#fff',c:C.ink,bd:C.ink,s:15});pill(ctx,'mitochondria, packed in rows',870,207,{bg:'#fff',c:'#7a4610',bd:'#a8641e',s:15});}
function drawMito(ctx){ctx.fillStyle='#f6ece2';ctx.fillRect(0,0,W,H);
  ctx.translate(0,30);mitoShape(ctx,110,70,980,400);ctx.fillStyle='#f3c98f';ctx.fill();ctx.lineWidth=7;ctx.strokeStyle='#a8641e';ctx.stroke();
  mitoShape(ctx,130,90,940,360);ctx.fillStyle='#fbe3bd';ctx.fill();
  // inner membrane with folds (cristae), drawn as one continuous line
  ctx.beginPath();const top=96,bot=444;ctx.moveTo(280,top);
  for(let k=0;k<7;k++){const x=384+k*84;ctx.lineTo(x,top);ctx.lineTo(x,top+230);ctx.arcTo(x+17,top+252,x+34,top+230,16);ctx.lineTo(x+34,top);}
  ctx.lineTo(920,top);ctx.arcTo(1066,top,1066,270,170);ctx.arcTo(1066,bot,920,bot,170);
  for(let k=7;k>=0;k--){const x=342+k*84;ctx.lineTo(x+34,bot);ctx.lineTo(x+34,bot-230);ctx.arcTo(x+17,bot-252,x,bot-230,16);ctx.lineTo(x,bot);}
  ctx.lineTo(280,bot);ctx.arcTo(134,bot,134,270,170);ctx.arcTo(134,top,280,top,170);ctx.closePath();
  ctx.fillStyle='#f6d3a0';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#c27a1f';ctx.lineJoin='round';ctx.stroke();
  pill(ctx,'outer membrane',196,48,{bg:'#fff',c:'#7a4610',bd:'#a8641e',s:15});pill(ctx,'inner membrane: folded to fit more machines',760,500,{bg:'#fff',c:'#7a4610',bd:'#c27a1f',s:15});}
function topXf(ctx,k){const s=lerp(1.2,1,k);ctx.translate(600,0);ctx.scale(s,s);ctx.translate(-600,lerp(95,0,k));if(k<1){ctx.fillStyle=C.ims;ctx.fillRect(-200,-90,1600,100);ctx.fillStyle=C.matrix;ctx.fillRect(-200,TOPH-2,1600,200);}}
const LEVELS=[(ctx,S)=>drawStairs(ctx,S,false),(ctx,S)=>drawFibers(ctx,S.t),(ctx)=>drawInside(ctx),(ctx)=>drawMito(ctx),(ctx,S)=>{topXf(ctx,0);drawTop(ctx,S.sim,{t:S.t,x0:100});}];
function lvl(ctx,k,S){ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();LEVELS[k](ctx,S);ctx.restore();}
function drawZoom(ctx,S,z){const k=Math.min(3,Math.floor(z)),f=z>=4?1:z-k,b=BOX[k],bh=b.w*H/W;
  const w=W*Math.pow(b.w/W,f),r=(w-b.w)/(W-b.w),cx=b.x+b.w/2+(W/2-b.x-b.w/2)*r,cy=b.y+bh/2+(H/2-b.y-bh/2)*r,s=W/w;
  ctx.save();ctx.translate(W/2,H/2);ctx.scale(s,s);ctx.translate(-cx,-cy);
  ctx.globalAlpha=1;lvl(ctx,k,S);
  const a=ease((f-.3)/.5);
  if(a>0){ctx.save();ctx.translate(b.x,b.y);ctx.scale(b.w/W,b.w/W);ctx.globalAlpha=a;lvl(ctx,k+1,S);ctx.restore();}
  ctx.globalAlpha=1-ease((f-.05)/.4);ctx.lineWidth=3/s;ctx.strokeStyle=C.rj;ctx.strokeRect(b.x,b.y,b.w,bh);
  ctx.restore();ctx.globalAlpha=1;
  // scale read-out: shown only when one level fills the frame, so the number is always true
  const near=z>=4?4:(f<.1?k:f>.9?k+1:-1);
  if(near>=0){const wd=WIDE[near],u=wd>=.1?[wd,'meters']:wd>=1e-4?[wd*1e3,'millimeters']:wd>=9e-7?[wd*1e6,'micrometers']:[wd*1e9,'nanometers'];
    pill(ctx,'This picture is about '+(u[0]>=10?Math.round(u[0]):u[0].toFixed(1))+' '+u[1]+' wide',W-16,H-24,{a:'right',bg:'#fff',c:C.ink,bd:C.ink,s:16,w:700,r:8});
    const mag=WIDE[0]/wd;if(mag>1.5)pill(ctx,'Zoomed in about '+(mag>=1e6?Math.round(mag/1e6)+' million':mag>=1e3?Math.round(mag/1e3)+' thousand':Math.round(mag))+' times',16,H-24,{a:'left',bg:C.ink,c:'#fff',bd:null,s:16,w:700,r:8});}
  else pill(ctx,'zooming in…',W-16,H-24,{a:'right',bg:'#fff',c:C.soft,bd:'#a9afb8',s:16,w:600,r:8});
}

/* ---------------- the main scene, used by most chapters ---------------- */
function scene(ctx,S,o){o=o||{};const sim=S.sim,e=o.energy||0,k=o.k==null?1:o.k;   // k: 0 = top picture centered, 1 = both pictures
  ctx.save();topXf(ctx,k);drawTop(ctx,sim,{t:S.t,fuel:o.fuel,x0:600-600/lerp(1.2,1,k)});if(o.over)o.over();ctx.restore();
  if(e){drawEnergy(ctx,sim,e,{alpha:k});if(k>.9){tag(ctx,'THE REAL PARTS',W-10,18);tag(ctx,'THE SAME EVENTS, DRAWN AS ENERGY',W-18,TOPH+24);}}
}
function setup(S,o){const sim=S.sim=newSim();Object.assign(sim,o||{});if(o&&o.fill)addIMS(sim,o.fill);sim.t0=0;return sim;}

/* ---------------- tell-it-back frames ---------------- */
function crop(ctx,x,y,w,fn){ctx.save();ctx.beginPath();ctx.rect(0,0,300,193.3);ctx.clip();const s=300/w;ctx.scale(s,s);ctx.translate(-x,-y);fn();ctx.restore();}
function still(o){const s=newSim();Object.assign(s,o);return s;}
const hups=(at,p)=>{const n=PUMPN[at],a=[];for(let i=0;i<n;i++)a.push({k:'hup',at,i,p,x:PUMPX[at][i],tx:PUMPX[at][i],ty:60+i*8});return a;};
const crowd=(n,x0,x1)=>{x0=x0||20;x1=x1||1180;const a=[];for(let k=0;k<n;k++)a.push({x:x0+hash(k+3)*(x1-x0),y:30+hash(k+9.5)*84});return a;};
const FRAMES=[
  {label:'NADH drops off electrons from your food',draw:ctx=>crop(ctx,40,96,340,()=>drawTop(ctx,still({pairs:[{st:'dock',p:.85}],showH:false,o2:0,oAtoms:0}),{}))},
  {label:'Electrons step down. Each drop pumps H⁺ across',draw:ctx=>crop(ctx,96,330,330,()=>drawEnergy(ctx,still({pairs:[{st:'I',p:.8}],fly:hups('I',.55),tally:{I:4,III:0,IV:0},ims:crowd(8)}),2))},
  {label:'Oxygen catches the electrons and becomes water',draw:ctx=>crop(ctx,610,100,310,()=>drawTop(ctx,still({pairs:[{st:'IV',p:.92}],oAtoms:1,fly:[{k:'water',p:.3,s:.2}],showH:false,o2:0}),{fuel:false}))},
  {label:'H⁺ crowd onto one side of the membrane',draw:ctx=>crop(ctx,300,6,350,()=>drawTop(ctx,still({ims:crowd(46,300,650),o2:0,oAtoms:0}),{fuel:false}))},
  {label:'H⁺ rush back through ATP synthase, which makes ATP',draw:ctx=>crop(ctx,850,96,340,()=>drawTop(ctx,still({ims:crowd(22,860,1180),open:true,through:5,rotor:.3,fly:[{k:'hdown',x:990,y:100,p:.7},{k:'hdown',x:1010,y:90,p:.3},{k:'atp',p:.25,s:.3},{k:'atp',p:.6,s:.7}],o2:0,oAtoms:0}),{fuel:false}))},
  {label:'Your leg muscle spends the ATP',draw:ctx=>crop(ctx,350,-10,480,()=>{drawStairs(ctx,{t:0},false);pill(ctx,'ATP → movement',690,250,{bg:C.atp,c:'#fff',bd:null,s:22,w:700});})}
];

/* ---------------- chapters ---------------- */
const PICK=['It comes back out as the CO₂ you breathe out','It becomes water','It turns into energy','It stays in your blood'];
let zAnim=null,chainT=-99;
const CHAIN=[['Legs spend ATP faster',890,52,46],['Turbine spins faster',X.S,160,52],['The H⁺ crowd thins',600,72,58],['Pumps push more easily',X.III,172,78],['Electrons fall faster',470,470,62],['More oxygen is used',735,171,30],['You breathe harder',1140,476,54]];

Story.start({
  id:'respiration',title:'Why are you out of breath?',W,H,labHref:'../index.html#respiration',
  about:'<p><b>The shapes are real.</b> Pumps 1, 2 and 3 and ATP synthase are drawn from the measured positions of their atoms in human proteins (Protein Data Bank entries 5XTH and 8H9S, found by cryo-electron microscopy). They are seen from the side, in their real order, all at one scale (the bar is 10 nanometers), with a membrane of the real thickness. The small dots inside the pumps are the real stepping stones the electrons hop along: iron–sulfur clusters, hemes and copper. In ATP synthase the gold ring and axle really do turn while the red head stays still.</p><p><b>What is simplified.</b> Colors are labels: molecules are too small to have a color. Electrons, H⁺, oxygen and water are drawn far bigger than they are, and NADH is shown as a label. The pumps are spread out in a row so you can follow the path; in a real mitochondrion pumps 1, 2 and 3 often sit pressed together as one unit. Oxygen reacts deep inside pump 3, and it is drawn on top so you can see it. Everything is slowed down hundreds of times. Left out to keep one story: Complex II (the FADH₂ entrance) and the H⁺ that leak back on their own.</p><p><b>The numbers.</b> 2 electrons per NADH; 4, 4 and 2 H⁺ pumped; each oxygen atom takes 2 electrons and 2 H⁺ to become one water. “About 4 H⁺ per ATP” is the figure most textbooks use: the real human ring has 8 teeth, so one full turn takes 8 H⁺ and makes 3 ATP, and bringing in the phosphate costs about one more H⁺ each. The energy steps are to scale from measured voltages (NADH −0.32 V, Q +0.05 V, cytochrome c +0.25 V, oxygen +0.82 V).</p>',
  tell:{frames:FRAMES,swaps:[[2,3]],terms:['NADH','electron','H⁺|h+|hydrogen ion|protons','gradient','ATP synthase','oxygen','water','ATP'],
    nudge:'For each picture ask: what had to happen just before this could happen?',
    done:'<b>That is the story.</b> (Pictures 3 and 4 happen at the same time, so either order counts.) Now tell it in your own words.',
    prompt:'Why does sprinting up the stairs make you breathe hard? Tell the story. Use “because” and “so”.',placeholder:'When I sprint, my leg muscles… because… so…'},
  chapters:[
  {rail:'The question',title:'You sprint up the stairs',
   predict:{key:'o2',q:'You run up three flights to beat the bell. At the top you are gasping. Where does the oxygen you breathe in end up?',opts:PICK,right:1,after:'<b>Locked in.</b> Now follow the oxygen and find out.'},
   text:'<p class="why">Take your best guess. You will see the real answer in step 7.</p>',
   enter(S){setup(S);},draw(ctx,S){drawStairs(ctx,S,true);}},

  {rail:'Zoom in',title:'Go where the oxygen goes',live:true,
   text(S){const z=S.v.z||0;return z<.5?'Your legs are doing the work, so that is where the oxygen is headed. <b>Zoom in</b> until you reach the place it gets used.':
     z<1.5?'Muscle is bundles of long cells called fibers. Blood vessels run between them and bring the oxygen.':
     z<2.5?'Inside one fiber. The striped bands do the pulling. Packed between them are <b class="term">mitochondria</b>: a muscle cell has thousands.':
     z<3.5?'One mitochondrion. Its inner membrane is folded over and over. More folds mean more room for the machines that sit in it.':
     'The inner membrane, close up. These are the real shapes of the machines in it, measured atom by atom, all at the same scale. This is where your oxygen gets used.';},
   ui:[{type:'button',label:'Zoom in',pulse:true,act(S){const a=S.v.z,b=Math.min(4,Math.floor(a+.02)+1);zAnim={a,b,t:0};},show:S=>S.v.z<3.98},
       {type:'range',key:'z',min:0,max:4,step:.01,val:0,label:'Zoom',fmt:v=>['You','Muscle','Inside a muscle cell','One mitochondrion','Its inner membrane'][Math.round(v)],on(){zAnim=null;}}],
   todo:[{t:'Zoom all the way in',ok:S=>S.v.z>=3.97}],
   enter(S){setup(S);S.v.z=0;zAnim=null;},
   tick(S,dt){if(zAnim){zAnim.t+=dt/2.3;S.v.z=lerp(zAnim.a,zAnim.b,ease(zAnim.t));if(zAnim.t>=1){S.v.z=zAnim.b;zAnim=null;}}},
   draw(ctx,S){drawZoom(ctx,S,S.v.z);}},

  {rail:'Two deliveries',title:'Two deliveries arrive',
   text:'From your <b>breakfast</b>: a carrier called <b class="term">NADH</b>, loaded with two high-energy electrons (yellow). From your <b>breath</b>: oxygen. They arrive at opposite ends and never touch. Everything in between passes energy from one to the other.',
   alt:'Think of a relay race. NADH hands off the baton (the electrons) at the start. Oxygen is waiting at the finish line. The pumps in between are the runners.',
   enter(S){setup(S,{showH:false,o2:.75,oAtoms:0,hold:true,supply:true});},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){scene(ctx,S,{k:0,over(){
     boxring(ctx,186,242,84,44,S.t,C.rj);pill(ctx,'From your breakfast',206,318,{bg:C.rj,c:'#fff',bd:null,s:15,w:700});
     ring(ctx,735,171,22,S.t+1,C.o);pill(ctx,'From your breath',735,244,{bg:C.o,c:'#fff',bd:null,s:15,w:700});
     arrow(ctx,330,272,660,272,{c:'#7b7f88',lw:3,dash:[8,8],head:13});pill(ctx,'How does the energy get across?',495,272,{bg:'#fff',c:C.ink,bd:'#7b7f88',s:14.5});}});}},

  {rail:'Electrons fall',title:'Electrons step downhill',
   text:'Press the button, then watch both pictures. <b>Top:</b> the real parts. <b>Bottom:</b> the same trip drawn as energy. At each hand-off the electrons drop to a lower step. Oxygen is the lowest step of all, so that is where they end up.',
   alt:'Picture a ball bouncing down a staircase. It only goes down, and it stops on the bottom stair. The electrons are the ball. Oxygen is the bottom stair.',
   ui:[{type:'button',label:'Send one NADH',pulse:true,act(S){sendNADH(S.sim);}}],
   todo:[{t:'Send one NADH and follow its two electrons to the oxygen',ok:S=>S.sim.n.water>=1}],
   enter(S){setup(S,{showH:false,o2:.75});},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){scene(ctx,S,{energy:1,k:ease(S.tau/1.2)});}},

  {rail:'The lift',title:'Each drop lifts H⁺ uphill',
   text:'A falling ball gives up energy. Here that energy is not wasted. Each drop pushes hydrogen ions, <b class="term">H⁺</b> (pink), across the membrane. Send NADH and count. The H⁺ pile up on one side with no way back.',
   alt:'It is a water wheel run backward. Falling electrons do the work of lifting H⁺ up to a high tank. The energy has not vanished. It has moved from the electrons into a crowd of H⁺.',
   ui:[{type:'button',label:'Send one NADH',pulse:true,act(S){sendNADH(S.sim);}}],
   todo:[{t:'Send 3 NADH, one at a time',ok:S=>S.sim.n.water>=3}],
   enter(S){setup(S,{showH:true,o2:.75});},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){const sim=S.sim,ta=sim.tally;scene(ctx,S,{energy:2});
     const parts=[ta.I?'4':'…',ta.III?'4':'…',ta.IV?'2':'…'],sum=ta.I+ta.III+ta.IV;
     if(sim.n.nadh)chip(ctx,'H⁺ pumped by this NADH:  '+parts.join(' + ')+(sum===10?'  =  10':''),350,268,{bd:C.h,c:'#8d1146'});}},

  {rail:'The turbine',title:'The crowd pushes a turbine',live:true,
   text(S){return S.sim.open?'H⁺ rush back through <b class="term">ATP synthase</b>. Its ring and axle (gold) spin like a turbine while the red head stays still, and every 4 H⁺ make one ATP. So one NADH, which pumped 10 H⁺, is worth about 2.5 ATP.':
     'Crowded H⁺ are stored energy, like water behind a dam. A crowd this lopsided is called a <b class="term">gradient</b>. Watch the pumps slow as the crowd pushes back. Then open the only way through: ATP synthase.';},
   alt:'Blow up a balloon and let go. The air you forced in rushes back out and the balloon flies. The pumps force H⁺ to one side. Letting them rush back is what makes ATP.',
   ui:[{type:'button',label:'Open ATP synthase',pulse:true,act(S){S.sim.open=true;S.sim.d=.6;},show:S=>!S.sim.open}],
   todo:[{t:'Open ATP synthase',ok:S=>S.sim.open},{t:'Watch it make 4 ATP',ok:S=>S.sim.n.atp>=4}],
   enter(S){setup(S,{supply:true,open:false,o2:1,fill:30});},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){const sim=S.sim;scene(ctx,S,{energy:3});
     if(!sim.open&&sim.bp<.25)chip(ctx,'Pumps stalled: the crowd is pushing back',350,268,{bd:C.rj,c:C.rj});
     if(sim.open){chip(ctx,'ATP made: '+sim.n.atp,W-12,52,{bd:C.atp,c:C.atp,a:'right'});chip(ctx,'10 H⁺ per NADH  ÷  4 H⁺ per ATP  ≈  2.5 ATP',350,268,{bd:C.atp,c:C.atp});}
     if(!sim.open)boxring(ctx,944,116,122,194,S.t,C.rj);}},

  {rail:'The oxygen',title:'Where the oxygen goes',
   text(S){const p=S.picks.o2;return 'At the last pump, each oxygen atom takes 2 used electrons and 2 H⁺ and becomes <b>water</b>. '+(p===1?'You called it.':p==null?'':'You guessed “'+PICK[p].toLowerCase()+'”. Most people do.')+' The CO₂ you breathe out gets its carbon from your food, in earlier stages.';},
   alt:'Oxygen is the trash collector of the chain. It hauls away the used-up electrons. Without it the electrons pile up and everything behind them stops.',
   strip:{terms:[{k:'glu',html:'C₆H₁₂O₆',note:'<b>Glucose, from your food.</b> Earlier stages take it apart and load its electrons onto NADH, which delivers them here.'},
     {k:'o2',html:'6 O₂',note:'<b>The oxygen you breathe in.</b> It waits at the last pump to catch the used electrons.'},
     {k:'co2',html:'6 CO₂',note:'<b>Not made here.</b> It comes from the carbon in your food, pulled apart in an earlier stage (the Krebs cycle).'},
     {k:'h2o',html:'6 H₂O',note:'<b>Made right here,</b> out of the oxygen you breathed in. This is where your oxygen ends up.'},
     {k:'atp',html:'ATP',note:'<b>The point of it all.</b> Made by ATP synthase, the turbine, using the H⁺ the electrons pumped.'}],ops:['+','→','+','+'],
     hint:'This is the equation for the whole story. Tap <b>O₂</b>, then <b>H₂O</b>, to find each one in the picture.'},
   todo:[{t:'Tap O₂ in the equation',ok:S=>S.v.termsHit&&S.v.termsHit.o2},{t:'Tap H₂O',ok:S=>S.v.termsHit&&S.v.termsHit.h2o}],
   enter(S){setup(S,{supply:true,open:true,d:.6,o2:1,fill:22});},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){const sim=S.sim;scene(ctx,S,{energy:3});const T=S.v.term;
     chip(ctx,'O₂ used: '+sim.n.o2+'     H₂O made: '+sim.n.water,350,268,{bd:C.o,c:shade(C.o,-.45)});
     if(T==='glu'){boxring(ctx,18,198,262,96,S.t,C.rj);}
     else if(T==='o2'){ring(ctx,735,171,24,S.t,C.rj);ring(ctx,814,LV[3]-12,24,S.t,C.rj);}
     else if(T==='h2o'){boxring(ctx,724,186,112,84,S.t,C.rj);}
     else if(T==='atp'){boxring(ctx,956,222,160,84,S.t,C.rj);ring(ctx,X.S,TY,46,S.t,C.rj);}
     else if(T==='co2'){pill(ctx,'CO₂ is not in this picture. It was made earlier, from the food’s carbon.',600,TOPH+150,{bg:'#fff',c:C.ink,bd:C.rj,s:17,w:700,lw:2.5,r:10});}}},

  {rail:'No oxygen',title:'Hold your breath',live:true,patience:70,
   predict:{key:'noo2',q:'The oxygen runs out, but there is still plenty of food. What happens?',opts:['ATP keeps coming until the food runs out','Electrons jam on every step, and ATP stops','The chain runs backward'],right:1,reveal:S=>!!S.did['7:1']},
   text(S){const sim=S.sim;if(S.picks.noo2==null)return '';return S.did['7:2']?'Oxygen is back, and the jam clears from the bottom step upward. Every part of the chain depends on that last step.':sim.o2<=0&&sim.pairs.length>=4?'<b>The bottom step is gone,</b> so the electrons have nowhere to go. Every step fills up, the pumps stop, the stored H⁺ drain away, and ATP stops. A few minutes of this is an emergency.':
     sim.o2<=0?'Watch the stairs fill up from the bottom.':'<b>Now test it.</b> Food is plentiful. Drag the oxygen down to zero and watch the stairs.';},
   ui:[{type:'range',key:'o2',min:0,max:100,step:5,val:100,label:'Oxygen reaching the muscle',fmt:v=>v+'%',stops:[{v:0,l:'None'},{v:100,l:'Normal'}],on(S,v){S.sim.o2=v/100;}}],
   todo:[{t:'Drag oxygen to 0%',ok:S=>S.sim.o2<=0},{t:'Watch ATP production fall to zero',ok:S=>S.sim.o2<=0&&S.sim.ims.length<4&&S.sim.pairs.length>=5},{t:'Give the oxygen back',ok:S=>S.sim.o2>=.8}],
   enter(S){setup(S,{supply:true,open:true,d:1.2,o2:1,fill:18});S.v.o2=100;},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){const sim=S.sim;scene(ctx,S,{energy:3});const r=rate(sim,'atp',4);
     chip(ctx,'ATP made per second: '+r.toFixed(1),W-12,52,{bd:C.atp,c:r<.05?C.rj:C.atp,a:'right'});
     if(sim.o2<=0&&sim.oAtoms===0){chip(ctx,'No oxygen: the last pump is stuck',350,268,{bd:C.rj,c:C.rj});boxring(ctx,676,112,110,114,S.t,C.rj);
       if(sim.pairs.length>=4)pill(ctx,'JAMMED: every step is full',60,TOPH+24,{bg:C.rj,c:'#fff',bd:null,s:15.5,w:700,r:7,a:'left'});}}},

  {rail:'The sprint',title:'So why are you out of breath?',
   text:'Set your legs to <b>Sprinting</b> and follow the numbers. Muscles burn ATP faster, so the turbine spins faster, so the H⁺ crowd thins, so the pumps push more easily, so electrons fall faster, so more oxygen is used. So you breathe harder.',
   alt:'A vending machine only gets restocked when people buy from it. Your muscles buying ATP is the signal. It pulls on the whole chain, all the way back to your lungs.',
   ui:[{type:'seg',key:'d',val:.12,label:'What are your legs doing?',opts:[{v:.12,l:'Sitting'},{v:.45,l:'Walking'},{v:1.5,l:'Sprinting'}],on(S,v){S.sim.d=v;chainT=S.t;S.v.dT=S.t;}}],
   todo:[{t:'Choose Sprinting and follow steps 1 to 7',ok:S=>S.v.d>=1.5&&S.t-S.v.dT>8.5},{t:'Go back to Sitting and watch it all slow down',ok:S=>S.v.d<=.12&&S.t-S.v.dT>5}],
   enter(S){setup(S,{supply:true,open:true,d:.12,o2:1,fill:40});S.v.d=.12;S.v.dT=S.t;chainT=-99;},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){const sim=S.sim;scene(ctx,S,{energy:3});const ra=rate(sim,'atp',5),ro=rate(sim,'o2',10);
     chip(ctx,'ATP made per second: '+ra.toFixed(1),W-12,52,{bd:C.atp,c:C.atp,a:'right'});chip(ctx,'O₂ used per second: '+ro.toFixed(2),W-12,90,{bd:C.o,c:shade(C.o,-.45),a:'right'});
     // legs gauge and lungs
     const hard=S.v.d>=1.5?2:S.v.d>=.4?1:0;pill(ctx,['Legs: sitting','Legs: walking','Legs: sprinting'][hard],960,52,{bg:hard===2?C.rj:'#fff',c:hard===2?'#fff':C.ink,bd:C.ink,s:17,w:700,a:'right',r:8,lw:2});
     const br=.35+ro*2.6,ph=Math.sin(S.t*br*6.28),sc=1+.1*ph;ctx.save();ctx.translate(1140,476);ctx.scale(sc*1.15,sc*1.15);
     ctx.fillStyle='#f2a0a8';ctx.strokeStyle='#b0485a';ctx.lineWidth=2;for(const sgn of [-1,1]){ctx.beginPath();ctx.moveTo(sgn*4,-22);ctx.bezierCurveTo(sgn*34,-30,sgn*36,24,sgn*14,26);ctx.bezierCurveTo(sgn*4,26,sgn*4,6,sgn*4,-22);ctx.fill();ctx.stroke();}
     ctx.strokeStyle='#b0485a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-38);ctx.lineTo(0,-20);ctx.stroke();ctx.restore();
     txt(ctx,'your breathing',1140,424,{s:14.5,w:700,a:'center',c:'#8a2f3f'});
     // the numbered chain of causes
     const el=S.t-chainT;CHAIN.forEach((c,i)=>{const t0=i*1.15;if(el<t0)return;const live=el<t0+1.5&&S.v.d>=.4;
       if(live){ring(ctx,c[1],c[2],c[3],S.t,C.think);const lx=clamp(c[1],150,1050),ly=c[2]-c[3]-16<70?c[2]+c[3]+18:c[2]-c[3]-16;pill(ctx,(i+1)+'  '+c[0],lx,ly,{bg:C.think,c:'#fff',bd:null,s:16,w:700,r:8});}
       else if(el<40&&S.v.d>=.4){dot(ctx,c[1]+c[3]*.7,c[2]-c[3]*.7,11,C.think);txt(ctx,String(i+1),c[1]+c[3]*.7,c[2]-c[3]*.7+4.5,{s:13,w:700,a:'center',c:'#fff'});}});}},

  {rail:'Tell it',title:'Now you tell the story',tell:true,
   text:'You have seen the whole chain. Put it back in order, then explain it the way you would to a friend who missed class.',
   draw(){}}
  ]
});
})();
