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


/* ---------- "Who is doing this" (Nov 24, 2026; rebuilt Nov 23 for cause and effect; redrawn Nov 25 as a textbook illustration): Dr. Michael Hawkes and solar-powered oxygen ----------
   Sources: University of Alberta (2016): Hawkes worked in Ugandan hospitals for over two years; children with severe pneumonia need
   concentrated oxygen until antibiotics work, and oxygen tanks often ran short. JAMA Pediatrics 2018 (randomized trial, 130 children):
   solar-powered oxygen worked as well as cylinders. Lancet Global Health 2019: a system (solar panels, batteries, an oxygen concentrator)
   cost about US$15,000 to $17,000. The Lancet 2024 (Conradi et al., 20 rural health facilities in Uganda): fewer children died.
   How a concentrator works (pressure swing adsorption): a compressor pushes room air (about 78% N₂, 21% O₂) into one of two columns of
   zeolite beads; the beads hold N₂ and O₂ passes on to the patient. When that column is full, the machine switches columns and the full
   one vents its N₂ back to the room. In the lungs, O₂ crosses the thin air-sac wall into the capillary and binds hemoglobin in red cells,
   which turn from dark red to bright red. Low oxygen makes lips look blue-gray (cyanosis) and breathing fast.
   What the student does and sees, with no numbers on screen: turn on the machine (cause) → sun → panels → batteries → compressor → the
   two columns trade jobs, N₂ held and vented, O₂ out (transformation) → in the lung close-up, red cells brighten (transformation) → the
   child's lips regain color, breathing slows, the child is propped up (effect). Blocking the sun drains the batteries, the machine stops,
   and the color fades. Rates are made up. A drawing, not a case; no medical advice: oxygen is given by trained health workers. */
const HK_PICK=[{v:'sugar',x:600,y:30,draw(ctx,cx,cy){ctx.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3+Math.PI/6;ctx[k?'lineTo':'moveTo'](cx+24*Math.cos(a),cy+8+24*Math.sin(a));}ctx.closePath();ctx.fillStyle='#df741a';ctx.fill();txt(ctx,'🍬',cx,cy-26,{s:24,a:'center'});}},
  {v:'o2',x:740,y:30,draw(ctx,cx,cy){o2Mini(ctx,cx,cy+8,2);txt(ctx,'🫁',cx,cy-26,{s:24,a:'center'});}}];
const HK_N='#3e6fd1',HK_O='#d9362b';
function o2Mini(ctx,x,y,s,c){s=s||1;[-6,6].forEach(d=>{const g=ctx.createRadialGradient(x+d*s-2*s,y-2*s,1,x+d*s,y,7*s);g.addColorStop(0,'#fff');g.addColorStop(.3,c||HK_O);g.addColorStop(1,shC(c||HK_O,-.3));ctx.beginPath();ctx.arc(x+d*s,y,7*s,0,7);ctx.fillStyle=g;ctx.fill();});}
function shC(hex,k){const n=parseInt(hex.slice(1),16),f=v=>Math.round(k>0?v+(255-v)*k:v*(1+k));return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')';}
function newHk(){return {pick:null,k:0,on:false,cloud:false,bat:.9,h:.12,day:0,mol:[],col:0,colT:0,stuck:[[],[]],vent:[],sac:[],cells:[...Array(9)].map((_,i)=>({x:604+i*34,ox:false})),feed:0,e:[],recovered:false,outage:false,back:false};}
function hkRun(H2){return H2.on&&H2.bat>0;}
function hkSun(H2){const d=.5+.5*Math.sin(H2.day*Math.PI*2/20);return {d,up:d>.35};}
const HK_COL=[[690,58,40,150],[790,58,40,150]];
function hkTick(S,dt){const H2=S.hk;if(!H2||!H2.pick)return;H2.k=Math.min(1,H2.k+dt*.5);if(H2.pick!=='o2')return;
  H2.day+=dt;const sun=hkSun(H2),charging=sun.up&&!H2.cloud,run=hkRun(H2);
  H2.bat=clamp(H2.bat+(charging?.3:0)*dt-(run?.09:0)*dt,0,1);
  if(H2.on&&H2.cloud&&H2.bat<=0)H2.outage=true;
  H2.h=clamp(H2.h+(run?.13:-.08)*dt,.12,1);if(H2.h>.85&&!H2.outage)H2.recovered=true;if(H2.outage&&!H2.cloud&&H2.h>.85)H2.back=true;
  if(Math.random()<dt*(charging?6:0))H2.e.push({seg:0,u:0});if(Math.random()<dt*(run?6:0))H2.e.push({seg:1,u:0});H2.e.forEach(q=>q.u+=dt*.9);H2.e=H2.e.filter(q=>q.u<1);
  // pressure swing: air into the working column; its beads hold N₂, O₂ rises out the top; the other column vents its N₂
  if(run){H2.colT+=dt;if(H2.colT>3.2){H2.colT=0;const old=H2.col;H2.col=1-H2.col;H2.stuck[old].forEach(m=>{m.vent=true;});H2.vent.push(...H2.stuck[old]);H2.stuck[old]=[];}
    if(Math.random()<dt*8){const n=Math.random()<.78;H2.mol.push({x:640,y:226,n,c:H2.col,ph:0});}}
  H2.mol.forEach(m=>{const C0=HK_COL[m.c],cx=C0[0]+C0[2]/2;if(m.ph===0){m.x=lerp(m.x,cx,dt*5);m.y=lerp(m.y,C0[1]+C0[3]-6,dt*5);if(Math.abs(m.x-cx)<4)m.ph=1;}
    else if(m.ph===1){m.y-=55*dt;m.x=cx+Math.sin(m.y*.2)*10;if(m.n&&H2.stuck[m.c].length<24&&m.y<C0[1]+C0[3]-14-H2.stuck[m.c].length*5){m.st=true;m.ph=3;const i=H2.stuck[m.c].length;m.bx=C0[0]+8+(i%3)*12;m.by=C0[1]+C0[3]-12-Math.floor(i/3)*16;H2.stuck[m.c].push(m);}
      if(m.y<C0[1]+4){m.ph=2;}}
    else if(m.ph===2){m.x=lerp(m.x,868,dt*2.5);m.y=lerp(m.y,40,dt*2.5);if(m.x>860){m.done=true;if(!m.n&&H2.sac.length<9)H2.sac.push({x:742+(Math.random()-.5)*60,y:322+(Math.random()-.5)*24});}}
    else if(m.ph===3){m.x=lerp(m.x,m.bx,dt*6);m.y=lerp(m.y,m.by,dt*6);}});
  H2.mol=H2.mol.filter(m=>!m.done&&!m.vent);
  H2.vent.forEach(m=>{m.y+=70*dt;m.x+=(m.x<740?-20:20)*dt;m.a=(m.a==null?1:m.a)-dt*.8;});H2.vent=H2.vent.filter(m=>m.a>0);
  H2.feed+=dt;if(H2.feed>2.2){H2.feed=0;if(H2.sac.length<9)H2.sac.push({x:742+(Math.random()-.5)*60,y:322});}
  H2.cells.forEach(c=>{c.x+=42*dt;if(c.x>884){c.x-=9*34;c.ox=false;}if(!c.ox&&c.x>700&&c.x<790&&H2.sac.length&&Math.random()<dt*6){H2.sac.shift();c.ox=true;}});}
/* a child in side profile (face right, then laid on the pillow) */
function hkHead(ctx,o){const skin=o.skin,hair=o.hair;ctx.beginPath();ctx.moveTo(402,38);ctx.bezierCurveTo(370,38,345,52,338,80);ctx.bezierCurveTo(334,95,334,104,336,108);ctx.bezierCurveTo(332,118,320,132,316,140);
  ctx.bezierCurveTo(314,146,322,150,330,150);ctx.bezierCurveTo(332,154,331,158,328,161);ctx.bezierCurveTo(324,165,327,168,330,169);ctx.bezierCurveTo(326,172,327,177,332,180);ctx.bezierCurveTo(330,186,331,194,337,200);
  ctx.bezierCurveTo(344,207,352,210,362,212);ctx.bezierCurveTo(366,224,366,250,378,290);ctx.lineTo(470,290);ctx.bezierCurveTo(462,262,454,226,458,190);ctx.bezierCurveTo(472,170,480,140,476,110);ctx.bezierCurveTo(470,60,440,38,402,38);ctx.closePath();
  const sg=ctx.createLinearGradient(310,0,480,0);sg.addColorStop(0,shC(skin,.12));sg.addColorStop(1,shC(skin,-.2));ctx.fillStyle=sg;ctx.fill();
  // lips: their color shows the oxygen
  ctx.fillStyle=o.lip;ctx.beginPath();ctx.moveTo(328,161);ctx.bezierCurveTo(324,165,327,168,330,169);ctx.bezierCurveTo(326,172,327,177,332,180);ctx.lineTo(338,178);ctx.lineTo(337,162);ctx.closePath();ctx.fill();
  // a blue-gray tint over the skin when oxygen is low
  if(o.blue>0){ctx.save();ctx.globalAlpha=o.blue*.28;ctx.fillStyle='#6f7fa6';ctx.fill();ctx.restore();}
  ctx.beginPath();ctx.moveTo(340,74);ctx.bezierCurveTo(352,44,384,32,408,33);ctx.bezierCurveTo(452,35,482,62,482,112);ctx.bezierCurveTo(483,150,474,178,458,196);ctx.bezierCurveTo(452,175,448,160,445,150);ctx.bezierCurveTo(440,128,430,104,418,96);ctx.bezierCurveTo(400,86,372,80,352,82);ctx.bezierCurveTo(346,80,342,78,340,74);ctx.closePath();
  const hg=ctx.createLinearGradient(340,30,480,190);hg.addColorStop(0,shC(hair,.18));hg.addColorStop(1,shC(hair,-.2));ctx.fillStyle=hg;ctx.fill();
  const eg=ctx.createRadialGradient(428,126,2,432,132,18);eg.addColorStop(0,shC(skin,.05));eg.addColorStop(1,shC(skin,-.2));ctx.fillStyle=eg;ctx.beginPath();ctx.ellipse(434,132,11,19,.15,0,7);ctx.fill();ctx.strokeStyle=shC(skin,-.35);ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(436,131,7,-1.3,1.7);ctx.stroke();
  ctx.strokeStyle=shC(hair,-.1);ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(337,99);ctx.quadraticCurveTo(346,95,356,98);ctx.stroke();
  if(o.open){ctx.fillStyle='#2b2320';ctx.beginPath();ctx.moveTo(339,111);ctx.quadraticCurveTo(346,106,352,110);ctx.quadraticCurveTo(346,113,339,111);ctx.fill();}
  else{ctx.strokeStyle='#3a2a22';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(339,111);ctx.quadraticCurveTo(346,115,353,111);ctx.stroke();}
  // nasal cannula prong
  ctx.strokeStyle='#bfe2f2';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(326,150);ctx.quadraticCurveTo(350,160,380,150);ctx.lineTo(430,150);ctx.stroke();}
function hkM(h){const lift=Story.h.ease(clamp((h-.8)/.2,0,1))*.55;return new DOMMatrix().translate(486,326).rotate((-90+lift*57.3)).scale(-1,1).scale(.56).translate(-420,-290);}
function hkChild(ctx,H2,t){const h=H2.h,rate=lerp(5.2,1.4,h),br=Math.sin(t*rate)*lerp(5,2,h);
  // bed: frame, mattress, pillow
  ctx.fillStyle='#9aa3ad';ctx.fillRect(338,352,250,8);ctx.fillRect(342,360,6,60);ctx.fillRect(578,360,6,60);
  const mg=ctx.createLinearGradient(0,330,0,354);mg.addColorStop(0,'#f4f6f8');mg.addColorStop(1,'#cfd6dd');ctx.fillStyle=mg;rr(ctx,340,330,246,24,6);ctx.fill();
  const lift=Story.h.ease(clamp((h-.8)/.2,0,1));const pg=ctx.createLinearGradient(0,300,0,334);pg.addColorStop(0,'#ffffff');pg.addColorStop(1,'#dde3e9');ctx.fillStyle=pg;ctx.beginPath();ctx.ellipse(392,322-lift*16,62,15+lift*12,-.1-lift*.5,0,7);ctx.fill();
  const lip=`rgb(${Math.round(lerp(120,196,h))},${Math.round(lerp(120,96,h))},${Math.round(lerp(150,104,h))})`;
  ctx.save();const m=hkM(h);ctx.setTransform(ctx.getTransform().multiply(m));hkHead(ctx,{skin:'#9a6a48',hair:'#1d1612',lip,blue:1-h,open:h>.5});ctx.restore();
  // blanket over the body; it rises with each breath, fast when oxygen is low
  ctx.save();const bl=ctx.createLinearGradient(0,290,0,352);bl.addColorStop(0,'#8fb3d6');bl.addColorStop(1,'#5d84ad');ctx.fillStyle=bl;
  ctx.beginPath();ctx.moveTo(440,352);ctx.bezierCurveTo(436,324-lift*18,462,302-br-lift*12,508,298-br-lift*6);ctx.bezierCurveTo(548,306,570,320,586,330);ctx.lineTo(586,354);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(500,330);ctx.quadraticCurveTo(530,322,560,334);ctx.stroke();ctx.restore();
  return m.transformPoint(new DOMPoint(430,150));}
function hkConcentrator(ctx,run,t){const x=268,y=236;ctx.save();
  const bg=ctx.createLinearGradient(x,0,x+56,0);bg.addColorStop(0,'#e9e5dc');bg.addColorStop(.5,'#f7f4ee');bg.addColorStop(1,'#cfc9bd');ctx.fillStyle=bg;rr(ctx,x,y,56,118,10);ctx.fill();ctx.strokeStyle='#a9a294';ctx.lineWidth=1.2;ctx.stroke();
  ctx.fillStyle='#d8d2c6';for(let i=0;i<6;i++)ctx.fillRect(x+8,y+86+i*4,40,1.5);
  // flow meter: a clear tube with a ball that floats up when oxygen flows
  ctx.fillStyle='rgba(220,235,245,.9)';rr(ctx,x+20,y+16,10,42,4);ctx.fill();ctx.strokeStyle='#8aa3b5';ctx.stroke();const by=run?y+26+Math.sin(t*3)*1.5:y+52;ctx.fillStyle='#2a6fd0';ctx.beginPath();ctx.arc(x+25,by,4,0,7);ctx.fill();
  // humidifier bottle and power light
  ctx.fillStyle='rgba(200,230,245,.75)';rr(ctx,x+36,y+20,14,26,4);ctx.fill();ctx.strokeStyle='#8aa3b5';ctx.stroke();ctx.fillStyle='rgba(120,180,220,.6)';ctx.fillRect(x+37,y+32,12,13);
  ctx.fillStyle=run?'#3fbf6a':'#9aa0a8';ctx.beginPath();ctx.arc(x+12,y+12,3.5,0,7);ctx.fill();
  ctx.fillStyle='#4b525b';[[x+8,y+122],[x+48,y+122]].forEach(([a,b])=>{ctx.beginPath();ctx.arc(a,b,5,0,7);ctx.fill();});ctx.restore();return [x+43,y+20];}
function hkBattery(ctx,x,y,lvl){const g=ctx.createLinearGradient(x,0,x+44,0);g.addColorStop(0,'#3d434a');g.addColorStop(.5,'#5a626b');g.addColorStop(1,'#2f343a');ctx.fillStyle=g;rr(ctx,x,y,44,56,4);ctx.fill();
  ctx.fillStyle='#262a2f';ctx.fillRect(x,y,44,8);ctx.fillStyle='#c0392b';ctx.fillRect(x+6,y-5,8,6);ctx.fillStyle='#222';ctx.fillRect(x+30,y-5,8,6);
  for(let i=0;i<4;i++){ctx.fillStyle=lvl>i/4+.02?(lvl>.25?'#3fbf6a':'#e0473b'):'#454b52';ctx.fillRect(x+8+i*8,y+42,6,5);}}
function hkPanel(ctx,cx,cy,w,h,dim){ctx.save();ctx.translate(cx,cy);ctx.transform(1,0,-.35,1,0,0);const g=ctx.createLinearGradient(0,-h/2,0,h/2);g.addColorStop(0,dim?'#1a2433':'#22385a');g.addColorStop(1,dim?'#0f1620':'#13213a');ctx.fillStyle=g;ctx.fillRect(-w/2,-h/2,w,h);
  ctx.strokeStyle='rgba(190,205,220,.55)';ctx.lineWidth=.8;for(let i=1;i<6;i++){ctx.beginPath();ctx.moveTo(-w/2+i*w/6,-h/2);ctx.lineTo(-w/2+i*w/6,h/2);ctx.stroke();}for(let j=1;j<4;j++){ctx.beginPath();ctx.moveTo(-w/2,-h/2+j*h/4);ctx.lineTo(w/2,-h/2+j*h/4);ctx.stroke();}
  if(!dim){const sh=ctx.createLinearGradient(-w/2,-h/2,w/2,h/2);sh.addColorStop(0,'rgba(255,255,255,.18)');sh.addColorStop(.5,'rgba(255,255,255,0)');ctx.fillStyle=sh;ctx.fillRect(-w/2,-h/2,w,h);}
  ctx.strokeStyle='#c8ced4';ctx.lineWidth=2.5;ctx.strokeRect(-w/2,-h/2,w,h);ctx.restore();}
function hkScene(ctx,S){const H2=S.hk,t=S.t,sun=hkSun(H2),on=H2.pick==='o2',run=hkRun(H2),d=on?sun.d:.8,dim=on&&(!sun.up||H2.cloud);
  // outside: sky, sun or moon, clouds, the panels on a rack
  const sky=ctx.createLinearGradient(0,0,0,360);sky.addColorStop(0,`rgb(${Math.round(lerp(14,120,d))},${Math.round(lerp(22,175,d))},${Math.round(lerp(48,232,d))})`);sky.addColorStop(1,`rgb(${Math.round(lerp(40,214,d))},${Math.round(lerp(50,232,d))},${Math.round(lerp(80,245,d))})`);ctx.fillStyle=sky;ctx.fillRect(0,0,200,360);
  if(on&&!sun.up){ctx.fillStyle='rgba(255,255,255,.7)';for(let i=0;i<14;i++)ctx.fillRect((i*37)%196,(i*53)%200,1.5,1.5);}
  if(on){const sx=lerp(30,170,(H2.day/20)%1),sy=86-50*d;if(sun.up){const sg=ctx.createRadialGradient(sx,sy,2,sx,sy,40);sg.addColorStop(0,'rgba(255,250,220,1)');sg.addColorStop(.3,'rgba(255,220,120,.9)');sg.addColorStop(1,'rgba(255,220,120,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.arc(sx,sy,40,0,7);ctx.fill();}
    else{ctx.fillStyle='#f4f1e6';ctx.beginPath();ctx.arc(sx,sy,12,0,7);ctx.fill();ctx.fillStyle=ctx.createLinearGradient(0,0,0,1)&&'rgb(20,28,52)';ctx.beginPath();ctx.arc(sx+5,sy-3,11,0,7);ctx.fill();}
    if(H2.cloud){ctx.save();ctx.fillStyle='rgba(60,66,76,.3)';ctx.fillRect(0,0,200,360);[[40,52,60],[110,40,70],[170,60,55],[80,92,60],[150,96,50]].forEach(([x,y,r])=>{const cg=ctx.createRadialGradient(x,y-6,4,x,y,r);cg.addColorStop(0,'#aab1ba');cg.addColorStop(1,'rgba(120,128,138,0)');ctx.fillStyle=cg;ctx.beginPath();ctx.ellipse(x,y,r,r*.5,0,0,7);ctx.fill();});ctx.restore();}}
  const gr=ctx.createLinearGradient(0,350,0,430);gr.addColorStop(0,'#9c8a62');gr.addColorStop(1,'#7c6c4a');ctx.fillStyle=gr;ctx.fillRect(0,350,200,80);
  ctx.fillStyle='#8b9097';ctx.fillRect(60,272,5,80);ctx.fillRect(140,252,5,100);hkPanel(ctx,72,262,92,52,dim);hkPanel(ctx,150,244,92,52,dim);
  // inside the clinic
  const wl=ctx.createLinearGradient(200,0,590,0);wl.addColorStop(0,'#efe6d6');wl.addColorStop(1,'#f6f0e5');ctx.fillStyle=wl;ctx.fillRect(200,0,390,360);
  const fl=ctx.createLinearGradient(0,360,0,430);fl.addColorStop(0,'#c7b896');fl.addColorStop(1,'#a99a78');ctx.fillStyle=fl;ctx.fillRect(200,360,390,70);
  ctx.fillStyle='#d6ccb8';ctx.fillRect(196,0,8,430);
  const wire=[[118,270],[204,300],[222,300]],wire2=[[266,320],[268,320]];
  ctx.strokeStyle='#2d2d2d';ctx.lineWidth=3;ctx.beginPath();wire.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x,y));ctx.moveTo(266,320);ctx.lineTo(268,320);ctx.stroke();
  H2.e.forEach(q=>{if(q.seg)return;const u=q.u*2,i=Math.min(1,Math.floor(u)),f=u-i,x=lerp(wire[i][0],wire[i+1][0],f),y=lerp(wire[i][1],wire[i+1][1],f);const eg=ctx.createRadialGradient(x,y,0,x,y,6);eg.addColorStop(0,'rgba(255,230,120,1)');eg.addColorStop(1,'rgba(255,200,40,0)');ctx.fillStyle=eg;ctx.beginPath();ctx.arc(x,y,6,0,7);ctx.fill();});
  hkBattery(ctx,214,298,on?H2.bat:.9);const out=hkConcentrator(ctx,run,t);
  const nose=hkChild(ctx,H2,t);
  ctx.strokeStyle='#bfe2f2';ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(out[0],out[1]);ctx.bezierCurveTo(out[0]+30,out[1]-70,nose.x-40,nose.y-60,nose.x,nose.y);ctx.stroke();
  if(run)for(let k=0;k<4;k++){const u=((t*.5+k/4)%1),x=Math.pow(1-u,3)*out[0]+3*Math.pow(1-u,2)*u*(out[0]+30)+3*(1-u)*u*u*(nose.x-40)+u*u*u*nose.x,y=Math.pow(1-u,3)*out[1]+3*Math.pow(1-u,2)*u*(out[1]-70)+3*(1-u)*u*u*(nose.y-60)+u*u*u*nose.y;o2Mini(ctx,x,y,.45);}
  if(H2.pick==='sugar'&&H2.k<1){ctx.save();ctx.globalAlpha=1-H2.k;for(let i=0;i<8;i++){const x=300+((i*37)%220),y=110+((i*23)%100);ctx.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3+Math.PI/6;ctx[k?'lineTo':'moveTo'](x+10*Math.cos(a),y+10*Math.sin(a));}ctx.closePath();ctx.fillStyle='#df741a';ctx.fill();}ctx.restore();}}
function hkInside(ctx,S){const H2=S.hk,run=hkRun(H2),t=S.t;
  ctx.save();ctx.strokeStyle='rgba(60,60,70,.45)';ctx.lineWidth=1.2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(296,236);ctx.lineTo(296,12);ctx.lineTo(742,12);ctx.lineTo(742,24);ctx.stroke();ctx.restore();
  // the machine opened up: compressor → two zeolite columns → oxygen out
  ctx.save();rr(ctx,600,24,285,236,12);ctx.clip();ctx.fillStyle='#f5f3ee';ctx.fillRect(600,24,285,236);
  ctx.fillStyle='#c9c3b6';rr(ctx,612,206,50,36,6);ctx.fill();ctx.strokeStyle='#9a9384';ctx.stroke();ctx.strokeStyle='#8a8f98';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(662,226);ctx.lineTo(845,226);ctx.stroke();
  ctx.save();ctx.translate(637,224);ctx.rotate(run?t*9:0);ctx.strokeStyle='#6b6f76';ctx.lineWidth=2;for(let k=0;k<3;k++){ctx.rotate(Math.PI*2/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-11);ctx.stroke();}ctx.restore();
  HK_COL.forEach((c,i)=>{const [x,y,w,h]=c,act=run&&H2.col===i;const cg=ctx.createLinearGradient(x,0,x+w,0);cg.addColorStop(0,'#c8ccd2');cg.addColorStop(.5,'#eef0f3');cg.addColorStop(1,'#b5bac1');ctx.fillStyle=cg;rr(ctx,x-4,y-6,w+8,h+12,10);ctx.fill();
    ctx.fillStyle='#e7dcc0';ctx.fillRect(x,y,w,h);ctx.fillStyle='#cdbd94';for(let r=0;r<12;r++)for(let q=0;q<4;q++){ctx.beginPath();ctx.arc(x+5+q*10+(r%2)*5,y+6+r*12.2,4,0,7);ctx.fill();}
    ctx.strokeStyle=act?'#2f8f4e':'#9aa0a8';ctx.lineWidth=2;ctx.strokeRect(x-4,y-6,w+8,h+12);});
  ctx.strokeStyle='#8a8f98';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(710,52);ctx.lineTo(710,40);ctx.lineTo(870,40);ctx.moveTo(810,52);ctx.lineTo(810,40);ctx.stroke();
  H2.stuck.forEach(arr=>arr.forEach(m=>o2Mini(ctx,m.x,m.y,.48,HK_N)));H2.mol.forEach(m=>{if(!m.st)o2Mini(ctx,m.x,m.y,.48,m.n?HK_N:HK_O);});
  H2.vent.forEach(m=>{ctx.save();ctx.globalAlpha=Math.max(0,m.a);o2Mini(ctx,m.x,m.y,.48,HK_N);ctx.restore();});
  ctx.restore();ctx.strokeStyle='#a9a294';ctx.lineWidth=2;rr(ctx,600,24,285,236,12);ctx.stroke();
  // the lungs: air sacs wrapped in a capillary
  ctx.fillStyle='#fff';rr(ctx,600,272,285,150,12);ctx.fill();ctx.strokeStyle='#d5d9de';ctx.stroke();
  ctx.save();rr(ctx,600,272,285,150,12);ctx.clip();ctx.fillStyle='#f7e4e6';ctx.fillRect(600,272,285,150);
  [[700,318,38],[760,310,42],[818,324,34],[730,350,26]].forEach(([x,y,r])=>{const ag=ctx.createRadialGradient(x-8,y-10,4,x,y,r);ag.addColorStop(0,'#fff6f7');ag.addColorStop(1,'#f1c3cb');ctx.fillStyle=ag;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.strokeStyle='#d98a99';ctx.lineWidth=1.5;ctx.stroke();});
  H2.sac.forEach(o=>o2Mini(ctx,o.x,o.y,.5));
  const cp=ctx.createLinearGradient(0,368,0,408);cp.addColorStop(0,'#e7a3a3');cp.addColorStop(1,'#c96d6d');ctx.fillStyle=cp;ctx.beginPath();ctx.moveTo(600,372);ctx.bezierCurveTo(680,360,800,362,885,374);ctx.lineTo(885,404);ctx.bezierCurveTo(800,394,680,394,600,406);ctx.closePath();ctx.fill();
  H2.cells.forEach(c=>{const y=386,col=c.ox?'#e02a2a':'#6a1424',g=ctx.createRadialGradient(c.x,y,2,c.x,y,13);g.addColorStop(0,shC(c.ox?'#e02a2a':'#6a1424',-.25));g.addColorStop(.55,col);g.addColorStop(1,shC(c.ox?'#e02a2a':'#6a1424',-.15));ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(c.x,y,13,8,0,0,7);ctx.fill();});
  ctx.restore();ctx.strokeStyle='#d5d9de';ctx.lineWidth=1.5;rr(ctx,600,272,285,150,12);ctx.stroke();
  ctx.save();ctx.strokeStyle='rgba(60,60,70,.45)';ctx.lineWidth=1.2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(870,40);ctx.lineTo(880,40);ctx.lineTo(880,290);ctx.stroke();ctx.restore();}
function hkRhyme(ctx){Who.rhyme(ctx,20,440,560,140,(c,x,y,w,h)=>{const cy=y+h/2;for(let i=0;i<3;i++){c.fillStyle='#7d8794';rr(c,x+14+i*44,cy-18,34,36,6);c.fill();c.fillStyle='#f7c20a';c.beginPath();c.arc(x+31+i*44,cy-26,5,0,7);c.fill();}o2Mini(c,x+176,cy,1.3);txt(c,'→ H₂O',x+192,cy+6,{s:15,w:700,c:'#2f7fd0'});},
  (c,x,y,w,h)=>{const cy=y+h/2;o2Mini(c,x+40,cy,1.3);txt(c,'→',x+80,cy+7,{s:22,w:700,c:C.ink,a:'center'});[['#6a1424',x+120],['#e02a2a',x+190]].forEach(([col,cx])=>{c.fillStyle=col;c.beginPath();c.ellipse(cx,cy,22,13,0,0,7);c.fill();});txt(c,'→',x+155,cy+7,{s:22,w:700,c:C.ink,a:'center'});});}
function hkPick(S,v){const H2=S.hk;if(!H2||H2.pick==='o2')return;H2.pick=v;H2.k=0;}
Story.start({
  id:'respiration',title:'Why are you out of breath?',W,H,views:true,labHref:'../index.html#respiration',
  about:'<p><b>Two ways to see it.</b> <b>Real shape</b> shows each machine as it was measured. <b>Simple drawing</b> shows the same outline smoothed and filled flat, the way a textbook or a test draws it. Nothing else changes when you switch.</p><p><b>The shapes are real.</b> Pumps 1, 2 and 3 and ATP synthase are drawn from the measured positions of their atoms in human proteins (Protein Data Bank entries 5XTH and 8H9S, found by cryo-electron microscopy). They are seen from the side, in their real order, all at one scale (the bar is 10 nanometers), with a membrane of the real thickness. The small dots inside the pumps are the real stepping stones the electrons hop along: iron–sulfur clusters, hemes and copper. In ATP synthase the gold ring and axle really do turn while the red head stays still.</p><p><b>What is simplified.</b> Colors are labels: molecules are too small to have a color. Electrons, H⁺, oxygen and water are drawn far bigger than they are, and NADH is shown as a label. The pumps are spread out in a row so you can follow the path; in a real mitochondrion pumps 1, 2 and 3 often sit pressed together as one unit. Oxygen reacts deep inside pump 3, and it is drawn on top so you can see it. Everything is slowed down hundreds of times. Left out to keep one story: Complex II (the FADH₂ entrance) and the H⁺ that leak back on their own.</p><p><b>The numbers.</b> 2 electrons per NADH; 4, 4 and 2 H⁺ pumped; each oxygen atom takes 2 electrons and 2 H⁺ to become one water. “About 4 H⁺ per ATP” is the figure most textbooks use: the real human ring has 8 teeth, so one full turn takes 8 H⁺ and makes 3 ATP, and bringing in the phosphate costs about one more H⁺ each. The energy steps are to scale from measured voltages (NADH −0.32 V, Q +0.05 V, cytochrome c +0.25 V, oxygen +0.82 V).</p><p><b>Solar-powered oxygen (step 10).</b> Dr. Michael Hawkes (University of Alberta) worked in Ugandan hospitals, where children with severe pneumonia need extra oxygen until antibiotics work and oxygen tanks often ran short. His team built systems where solar panels charge batteries that run an oxygen concentrator. Inside a concentrator, a compressor pushes room air into one of two columns of zeolite beads; the beads hold on to nitrogen, which is most of the air, and oxygen passes through. When that column is full, the machine switches to the other column and the full one lets its nitrogen go. In the picture, rates are made up and the child is a drawing. A 2018 trial (JAMA Pediatrics, 130 children) found it worked as well as oxygen cylinders, and a 2024 trial at 20 rural health facilities in Uganda (The Lancet) found fewer children died. Each system cost about US$15,000 to $17,000. Sources: The Lancet (2024); JAMA Pediatrics (2018); Lancet Global Health (2019); University of Alberta. No medical advice here: oxygen is given by trained health workers.</p>',
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
     'The inner membrane, close up, with the machines that sit in it, all at the same scale. Above the picture, switch between <b>Simple drawing</b> (how a textbook shows them) and <b>Real shape</b> (measured atom by atom). This is where your oxygen gets used.';},
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

  {rail:'Who did it',title:'Dr. Michael Hawkes, Uganda',links:[{t:"Solar-powered oxygen: the project",u:"https://www.grandchallenges.ca/grantee-stars/0206-01/",d:"Grand Challenges Canada: the problem, the idea, the results"},{t:"The 2018 trial, free to read",u:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6137508",d:"JAMA Pediatrics: solar oxygen vs. oxygen tanks"}],live:true,views:false,
   text(S){const H2=S.hk;if(!H2||!H2.pick)return 'Uganda. A child with pneumonia: lungs full of fluid, too little oxygen. <b>Tap what the cells need.</b>';
     if(H2.pick==='sugar')return 'The cells have fuel. Without O₂ at the end of the chain, they cannot use it. Try the other.';
     if(!H2.on)return 'Room air is mostly nitrogen. <b>Turn on the oxygen machine</b> and watch what it does to the air.';
     if(H2.back)return 'Sun → battery → oxygen, day and night. In a 2024 trial at 20 rural hospitals, fewer children died.';
     if(H2.outage&&!H2.cloud)return 'The sun charges the battery again. Watch the child.';
     if(H2.outage)return 'Battery empty: no oxygen, and the color fades. <b>Bring the sun back.</b>';
     if(H2.cloud)return 'No sun on the panel. Watch the battery.';
     if(!H2.recovered)return 'Two columns of beads take turns: one holds nitrogen (blue) while O₂ (red) passes; the other lets its nitrogen go. In the lungs, dark red cells turn bright red.';
     return 'The sun charges the battery, so the oxygen runs all night. <b>Now block the sun.</b>';},
   alt:'Look at the two pictures at the bottom. Inside every cell, oxygen waits at the end of the chain to catch electrons. A child who cannot get enough oxygen into the blood cannot keep that chain running, so extra oxygen keeps it going until the medicine works.',
   ui:[{type:'seg',key:'hp',val:'',label:'What do the cells need?',opts:[{v:'sugar',l:'🍬 Sugar'},{v:'o2',l:'O₂ Oxygen'}],on(S,v){hkPick(S,v);},show:S=>S.hk&&S.hk.pick!=='o2'},
     {type:'button',label:'🔌 Turn on the oxygen machine',pulse:true,act(S){S.hk.on=true;},show:S=>S.hk&&S.hk.pick==='o2'&&!S.hk.on},
     {type:'button',label:'☁️ Block the sun',act(S){S.hk.cloud=true;},show:S=>S.hk&&S.hk.on&&!S.hk.cloud&&!S.hk.back},
     {type:'button',label:'☀️ Bring the sun back',pulse:true,act(S){S.hk.cloud=false;},show:S=>S.hk&&S.hk.cloud}],
   todo:[{t:'Tap what the cells need',ok:S=>S.hk&&S.hk.pick==='o2'},{t:'Turn on the machine and watch the child',ok:S=>S.hk&&S.hk.recovered},{t:'Block the sun, then bring it back',ok:S=>S.hk&&S.hk.back}],
   enter(S){S.hk=newHk();S.v.hp='';},tick(S,dt){hkTick(S,dt);},
   click(S,x,y){const v=Who.hit(HK_PICK,x,y);if(v&&S.hk.pick!=='o2'){hkPick(S,v);S.v.hp=v;}},
   draw(ctx,S){const H2=S.hk||(S.hk=newHk());ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,W,H);hkScene(ctx,S);
     if(H2.pick!=='o2')Who.cards(ctx,S,HK_PICK,H2.pick);else hkInside(ctx,S);hkRhyme(ctx);
     Who.panel(ctx,'Dr. Michael Hawkes',[['🩺','children\'s doctor, Alberta'],['🇺🇬','2+ years, Ugandan hospitals'],['🛢️','oxygen tanks ran out'],['☀️','sun → battery → O₂'],['✅','2018: as good as tanks'],['🏥','2024: 20 hospitals, fewer deaths'],['💵','hard part: about $15,000 each']],['Sources: The Lancet 2024; JAMA','Pediatrics 2018; U of Alberta 2016.']);}},

  {rail:'Tell it',title:'Now you tell the story',tell:true,
   text:'You have seen the whole chain. Put it back in order, then explain it the way you would to a friend who missed class.',
   draw(){}}
  ]
});
})();
