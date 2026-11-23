/* 3D chapter for "What is a tree made of?" (Nov 24, 2026): carbon dioxide from the air becomes sugar, and sugar becomes wood.
   Real geometry: CO₂ is straight, C=O 0.116 nm. Glucose is a six-member ring (5 carbons + 1 oxygen, bonds about 0.145 nm) with
   its sixth carbon outside the ring. Wood is mostly cellulose: glucose units joined by an oxygen bridge into straight chains,
   every other unit flipped over, 1.03 nm per pair of units; neighboring chains lie about 0.82 nm apart in a flat sheet.
   Hydrogen atoms are left out. Every gray carbon in the sugar and the wood flies in from a CO₂ molecule in the air.
   Simplified: the oxygen atoms of the sugar fade in at their places rather than being tracked one by one (in the real
   reactions they come from CO₂; the O₂ a leaf gives off comes from splitting water, as step 3 shows).
   Exposes window.Wood3D.chapter(C); photosynthesis.js puts it after "So what is a tree made of?". */
(function(){
'use strict';
const G=View3D.G,UNITS=6,CHAINS=3,STEP=.515,GAP=.82;
const rnd=(a,b)=>a+Math.random()*(b-a);
/* one glucose unit: center c, chain direction u, ring normal n (flip = turned over) */
function unit(c,flip){const u=[1,0,0],n=[0,1,0],v=G.mul(G.cross(n,u),flip?-1:1);const r=G.ring(c,u,v);       // 0 C1, 1 C2, 2 C3, 3 C4, 4 C5, 5 ring O
  const out=k=>G.norm(G.sub(r[k],c));
  const C6=G.add(r[4],G.add(G.mul(out(4),.1),G.mul(n,.09))),O6=G.add(C6,G.mul(G.norm(G.add(out(4),n)),.14));
  const O2=G.add(r[1],G.mul(out(1),.14)),O3=G.add(r[2],G.mul(out(2),.14));
  return {C:[r[0],r[1],r[2],r[3],r[4],C6],O:[r[5],O2,O3,O6],ring:r};}
/* the whole sheet: chain j along x, units i; returns units in build order plus the bridge oxygens */
function sheet(){const U=[];for(let j=0;j<CHAINS;j++)for(let i=0;i<UNITS;i++){const c=[(i-(UNITS-1)/2)*STEP,0,(j-(CHAINS-1)/2)*GAP];U.push(Object.assign(unit(c,i%2===1),{i,j}));}
  const B=[];for(let j=0;j<CHAINS;j++)for(let i=0;i<UNITS-1;i++){const a=U[j*UNITS+i],b=U[j*UNITS+i+1];B.push({u:j*UNITS+i,p:G.add(G.mul(G.add(a.ring[0],b.ring[3]),.5),[0,-.05,0])});}
  return {U,B};}
const SH=sheet();
/* the camera starts close on the first sugar, then pulls back to see the whole sheet of wood */
const CLOSE={c:G.add(SH.U[0].ring[0],[-.1,.35,0]),nm:330},SUGAR={c:G.add(SH.U[0].ring[0],[-.15,0,0]),nm:360},FAR={c:[0,.4,0],nm:145};
function co2(near){const c=near?G.add(SH.U[0].ring[0],[rnd(-.9,.9),rnd(.55,1.05),rnd(-.6,.6)]):[rnd(-2.4,2.4),rnd(1.3,2.3),rnd(-1.4,1.4)],d=G.norm([rnd(-1,1),rnd(-.4,.4),rnd(-1,1)]);return {c,d,spin:rnd(-1,1)};}
function newState(){return {phase:0,cam:{c:CLOSE.c.slice(),nm:CLOSE.nm},air:Array.from({length:6},()=>co2(true)),built:0,fly:[],t:0,ok:0,leaving:[]};}
/* send the carbons of unit k: six CO₂ from the air, each carbon to its place, its two oxygens drifting away */
function launch(S,k,fast){S.launched=Math.max(S.launched||0,k+1);const tg=SH.U[k].C;for(let m=0;m<6;m++){const mol=k===0&&S.air[m]?S.air[m]:co2();S.fly.push({mol,to:tg[m],t:fast?-m*.04:-m*.12,k});}if(k===0)S.air=[];}
function step(S,dt){S.t+=dt;{const T=S.phase===2?FAR:S.built?SUGAR:CLOSE,k=Math.min(1,dt*1.6);S.cam.c=S.cam.c.map((v,i)=>v+(T.c[i]-v)*k);S.cam.nm+=(T.nm-S.cam.nm)*k;}
  for(const a of S.air){a.c=G.add(a.c,G.mul([Math.sin(S.t*.7+a.spin*3),Math.cos(S.t*.5+a.spin),Math.sin(S.t*.6-a.spin)],dt*.08));a.spin+=dt*.4;}
  for(const f of S.fly)f.t+=dt/.9;
  const doneK=new Set();S.fly.forEach(f=>{if(f.t>=1)doneK.add(f.k);});
  for(const k of doneK){if(S.fly.filter(f=>f.k===k).every(f=>f.t>=1)){S.built=Math.max(S.built,k+1);S.fly.filter(f=>f.k===k).forEach(f=>S.leaving.push({c:f.mol.c,d:f.mol.d,t:0}));S.fly=S.fly.filter(f=>f.k!==k);S.ok+=6;}}
  S.leaving.forEach(l=>l.t+=dt*.8);S.leaving=S.leaving.filter(l=>l.t<1);
  if(S.phase===2&&(S.launched||0)<SH.U.length){S.next=(S.next||0)-dt;if(S.next<=0){launch(S,S.launched||0,true);S.next=.35;}}}
function co2Items(c,d,spin,op){const ax=G.norm([Math.cos(spin),.3*Math.sin(spin*1.7),Math.sin(spin)]);const o1=G.add(c,G.mul(ax,.116)),o2=G.add(c,G.mul(ax,-.116));
  return [{t:'bond',a:o1,b:o2,r:.024,c:'#a3aab4',op},{t:'atom',p:c,r:.07,c:G.C.C,op},{t:'atom',p:o1,r:.068,c:G.C.O,op},{t:'atom',p:o2,r:.068,c:G.C.O,op}];}
function items(S){const it=[],WOOD='#9b6a36';
  for(const a of S.air)it.push(...co2Items(a.c,a.d,a.spin));
  // carbons in flight: the carbon moves to its place; its oxygens let go and fade
  for(const f of S.fly){const u=Math.max(0,Math.min(1,f.t)),e=u*u*(3-2*u),c=G.add(f.mol.c,G.mul(G.sub(f.to,f.mol.c),e));
    if(u<=0)it.push(...co2Items(f.mol.c,f.mol.d,f.mol.spin));
    else{it.push({t:'atom',p:c,r:.07,c:G.C.C});const ax=G.norm([Math.cos(f.mol.spin),.3,Math.sin(f.mol.spin)]);
      for(const s of [1,-1])it.push({t:'atom',p:G.add(f.mol.c,G.add(G.mul(ax,s*(.116+e*.25)),[0,e*.4,0])),r:.068,c:G.C.O,op:1-e*.9});}}
  // built units
  for(let k=0;k<S.built;k++){const U=SH.U[k];it.push({t:'face',pts:U.ring,c:WOOD,op:.55});
    for(let m=0;m<6;m++){it.push({t:'bond',a:U.ring[m],b:U.ring[(m+1)%6],r:.022,c:'#a3aab4'});}
    it.push({t:'bond',a:U.ring[4],b:U.C[5],r:.022,c:'#a3aab4'},{t:'bond',a:U.C[5],b:U.O[3],r:.022,c:'#a3aab4'},{t:'bond',a:U.ring[1],b:U.O[1],r:.022,c:'#a3aab4'},{t:'bond',a:U.ring[2],b:U.O[2],r:.022,c:'#a3aab4'});
    U.C.forEach(p=>it.push({t:'atom',p,r:.05,c:G.C.C}));U.O.forEach(p=>it.push({t:'atom',p,r:.052,c:G.C.O}));}
  for(const b of SH.B)if(b.u+1<S.built&&SH.U[b.u].j===SH.U[b.u+1].j){const a=SH.U[b.u],c=SH.U[b.u+1];
    it.push({t:'bond',a:a.ring[0],b:b.p,r:.022,c:'#a3aab4'},{t:'bond',a:b.p,b:c.ring[3],r:.022,c:'#a3aab4'},{t:'atom',p:b.p,r:.055,c:G.C.O});}
  if(S.built===1&&S.phase===1)it.push({t:'tag',p:G.add(SH.U[0].ring[0],[-.15,-.32,0]),text:'one sugar (glucose): 6 carbons from 6 CO₂',c:WOOD});
  if(S.built===SH.U.length)it.push({t:'tag',p:[0,-.75,GAP*1.6],text:'cellulose: the stuff of wood',c:WOOD});
  if(S.air.length)it.push({t:'tag',p:G.add(SH.U[0].ring[0],[0,1.35,0]),text:'carbon dioxide (CO₂) in the air',c:'#26262b'});
  return it;}
function chapter(C){const {txt,pill}=Story.h,V=View3D.make({yaw:.4,pitch:-.55,auto:.12,focal:20});
  return {rail:'In 3D',title:'From air to wood',live:true,views:false,
    text(S){const s=S.wd;if(!s)return '';
      if(s.phase===0)return 'Each little stick floating at the top is one <b>CO₂</b> molecule from the air: a gray carbon between two red oxygens. <b>Drag to turn the picture.</b> Then build a sugar the way Rubisco does, carbon by carbon.';
      if(s.phase===1)return s.built?'Six carbons from six CO₂ molecules are now one <b>sugar</b> ring (glucose). The extra oxygen leaves. Hydrogen from water is part of the sugar too (not drawn). Now link sugars into wood.':'Watch each carbon leave its CO₂ and take its place in the ring.';
      return s.built<SH.U.length?'A tree links sugar units into long straight chains, side by side. Every gray carbon you see flew in from the air.':
        '<b>This is cellulose, the main stuff of wood.</b> Every one of its '+SH.U.length*6+' gray carbons came from CO₂ in the air. So most of a tree\'s weight came out of the air, not out of the soil.';},
    ui:[{type:'button',label:'Build a sugar from CO₂',pulse:true,act(S){const s=S.wd;s.phase=1;launch(s,0);},show:S=>S.wd&&S.wd.phase===0},
        {type:'button',label:'Link sugars into wood',pulse:true,act(S){S.wd.phase=2;S.wd.next=0;},show:S=>S.wd&&S.wd.phase===1&&S.wd.built>=1},
        {type:'button',label:'Start over',act(S){S.wd=newState();},show:S=>S.wd&&S.wd.phase>0}],
    todo:[{t:'Drag to turn the picture',ok:()=>V.touched},{t:'Build a sugar, then link sugars into wood',ok:S=>S.wd&&S.wd.built===SH.U.length}],
    enter(S){S.wd=newState();},
    tick(S,dt){if(S.wd)step(S.wd,dt);},
    draw(ctx,S){const s=S.wd||(S.wd=newState());ctx.fillStyle='#f1f6ec';ctx.fillRect(0,0,1200,600);
      V.render(ctx,{x:0,y:0,w:880,h:600,nm:s.cam.nm,center:s.cam.c,items:items(s),bg:'#f1f6ec'});
      const x=900;ctx.fillStyle='#fff';ctx.strokeStyle='#d5d9de';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect?ctx.roundRect(x,24,280,552,12):ctx.rect(x,24,280,552);ctx.fill();ctx.stroke();
      txt(ctx,'What you are looking at',x+18,58,{s:17,w:700,c:C.ink});
      [[G.C.C,'carbon atom'],[G.C.O,'oxygen atom'],['#9b6a36','one sugar unit (glucose)']].forEach(([c,t],k)=>{const y=94+k*32;ctx.beginPath();ctx.arc(x+28,y-5,8,0,7);ctx.fillStyle=c;ctx.globalAlpha=k===2?.7:1;ctx.fill();ctx.globalAlpha=1;txt(ctx,t,x+44,y,{s:15,c:C.ink});});
      txt(ctx,'Hydrogen atoms are left out.',x+18,212,{s:13.5,c:C.soft});txt(ctx,'A sugar ring is about 0.5 nm across.',x+18,232,{s:13.5,c:C.soft});
      txt(ctx,'Carbons taken from the air',x+18,290,{s:15,c:C.soft});txt(ctx,String(s.ok),x+262,292,{s:26,w:700,a:'right',c:C.ink});
      txt(ctx,'Sugar units built',x+18,334,{s:15,c:C.soft});txt(ctx,String(s.built),x+262,336,{s:26,w:700,a:'right',c:'#9b6a36'});
      if(s.built===SH.U.length)pill(ctx,'Wood is mostly air, by weight',x+140,420,{bg:'#f6efe6',c:'#7a4f22',bd:'#9b6a36',s:14,w:700,r:9});}};}
window.Wood3D={chapter};
})();
