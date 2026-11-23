/* 3D chapter for "Why can't you drink seawater?" (Nov 24, 2026): the water doorway (aquaporin) in a real-scale patch of membrane.
   True to scale: the membrane is about 4 nm thick (head to head); a lipid takes about 0.65 nm² of surface; the water pore of
   aquaporin narrows to about 0.28 nm, the width of one water molecule, so waters pass single file; a water is O–H 0.096 nm at
   104.5°. A sodium ion holds 6 waters at 0.24 nm and a chloride ion 6 waters at 0.32 nm, so each ion plus its water shell is
   far wider than the pore (and its charge is turned away inside the channel); that is why salt cannot use the doorway.
   Simplified: one aquaporin unit is drawn (the real protein is four units side by side, each with its own pore); its eight
   helices are drawn as tubes; only about 1 water in 60 in the liquid is drawn, so the picture is not crowded.
   Net flow: water crosses both ways all the time. Equal saltiness → equal crossings each way. Seawater outside (about 4 times
   saltier than blood) → more waters leave the cell than enter, so the cell shrinks. Exposes window.Water3D.chapter(C). */
(function(){
'use strict';
const G=View3D.G,HALF=1.9,BOX=3.4,PR=1.05;           // membrane half-thickness (nm), patch half-width (nm), protein ring radius (nm)
const rnd=(a,b)=>a+Math.random()*(b-a);
function lipids(){const L=[];const s=.95;for(let x=-BOX;x<=BOX+1e-6;x+=s)for(let z=-BOX;z<=BOX+1e-6;z+=s){const jx=x+(Math.random()-.5)*.18,jz=z+(Math.random()-.5)*.18;
  if(Math.hypot(jx,jz)<PR+.55)continue;for(const side of [1,-1])L.push({x:jx,z:jz,side,tw:Math.random()*6.28});}return L;}
const LIP=lipids();
/* eight helices around the pore, tilted a little, like the real protein */
const HEL=[];for(let k=0;k<8;k++){const a=k*Math.PI/4,t=.25*(k%2?1:-1);HEL.push({a:[PR*Math.cos(a+t),HALF+.2,PR*Math.sin(a+t)],b:[PR*Math.cos(a-t),-HALF-.2,PR*Math.sin(a-t)]});}
function water(c,ang){const u=[Math.cos(ang),0,Math.sin(ang)],v=[0,1,0],h=.0958,half=104.5/2*Math.PI/180;
  return [c,G.add(c,G.add(G.mul(u,h*Math.sin(half)),G.mul(v,h*Math.cos(half)))),G.add(c,G.add(G.mul(u,-h*Math.sin(half)),G.mul(v,h*Math.cos(half))))];}
function newState(salty){const S={salty:!!salty,ws:[],ions:[],inN:0,outN:0,t:0,bounce:[]};
  for(let i=0;i<46;i++)S.ws.push(freeWater(Math.random()<.5?1:-1));
  for(let i=0;i<(salty?6:2);i++)S.ions.push(ion(i%2?'Cl':'Na',1));for(let i=0;i<2;i++)S.ions.push(ion(i%2?'Cl':'Na',-1));return S;}
function freeWater(side){return {p:[rnd(-BOX,BOX),side*rnd(HALF+.35,HALF+2.4),rnd(-BOX,BOX)],side,ang:Math.random()*6.28,ch:null};}
function ion(k,side){return {k,side,p:[rnd(-BOX,BOX),side*rnd(HALF+.6,HALF+2.2),rnd(-BOX,BOX)],v:[0,0,0],spin:Math.random()*6.28};}
const clampBox=(p,side)=>{p[0]=Math.max(-BOX,Math.min(BOX,p[0]));p[2]=Math.max(-BOX,Math.min(BOX,p[2]));const lo=HALF+.3,hi=HALF+2.6;
  if(side>0)p[1]=Math.max(lo,Math.min(hi,p[1]));else p[1]=Math.min(-lo,Math.max(-hi,p[1]));};
function step(S,dt){S.t+=dt;
  // crossings are events: from each side, waters enter the pore at a steady rate per second. Equal saltiness gives equal rates;
  // seawater outside makes fewer waters come in and more go out (the real ratio is not shown; the direction is).
  // a steady rhythm, not chance, so the direction of net flow is never a fluke: equal rates for blood; for seawater,
  // about 3 waters leave for every 1 that comes in. Waters in the pore move single file, one direction at a time.
  const every={1:S.salty?2.4:1.1,'-1':S.salty?.8:1.1};S.due=S.due||{1:.4,'-1':.95};
  const inPore=S.ws.filter(w=>w.ch);
  for(const side of [1,-1]){S.due[side]-=dt;if(S.due[side]>0)continue;
    const clash=inPore.some(w=>w.ch.dir!==side),crowd=inPore.some(w=>w.ch.dir===side&&w.ch.k<-.45);
    if(clash||crowd){S.due[side]=.15;continue;}
    const pool=S.ws.filter(w=>!w.ch&&w.side===side);
    if(pool.length){pool.sort((a,b)=>Math.hypot(a.p[0],a.p[2])-Math.hypot(b.p[0],b.p[2]));const w=pool[Math.floor(Math.random()*Math.min(5,pool.length))];w.ch={k:-1,dir:side,from:w.p.slice()};}
    S.due[side]=every[side];}
  for(const w of S.ws){if(w.ch){const c=w.ch;
      if(c.k<0){c.k+=dt/.6;const u=Math.min(1,c.k+1),m=[0,c.dir*(HALF+.35),0];w.p=c.from.map((v,i)=>v+(m[i]-v)*u*u*(3-2*u));if(c.k>=0)c.k=0;}   // swim to the pore mouth
      else{c.k+=dt/1.1;w.p=[0,c.dir*(HALF+.35)*(1-2*c.k),0];w.ang+=dt*3;
        if(c.k>=1){const to=-w.side;if(to<0)S.inN++;else S.outN++;w.side=to;w.ch=null;w.p=[rnd(-.5,.5),to*(HALF+.45),rnd(-.5,.5)];}}continue;}
    for(let a=0;a<3;a++)w.p[a]+=(Math.random()-.5)*dt*2.2;w.ang+=(Math.random()-.5)*dt*4;clampBox(w.p,w.side);}
  for(const n of S.ions){for(let a=0;a<3;a++)n.p[a]+=(Math.random()-.5)*dt*1.4;n.spin+=dt*.8;
    if(Math.random()<dt*.25){n.p[0]*=1-dt*2;n.p[2]*=1-dt*2;}                                      // ions wander toward the doorway now and then...
    if(Math.hypot(n.p[0],n.p[2])<.75&&Math.abs(n.p[1])<HALF+.8){const d=G.norm([n.p[0]||.1,0,n.p[2]||.1]);n.p[0]+=d[0]*.6;n.p[2]+=d[2]*.6;S.bounce.push({p:n.p.slice(),t:0});}  // ...and bounce off
    clampBox(n.p,n.side);}
  S.bounce.forEach(b=>b.t+=dt*1.2);S.bounce=S.bounce.filter(b=>b.t<1);}
function items(S){const it=[],HEAD='#e9c46a',TAIL='#cdb68a',AQ='#2a9d8f';
  for(const l of LIP){const y=l.side*HALF;it.push({t:'atom',p:[l.x,y,l.z],r:.24,c:HEAD});
    for(const dx of [-.12,.12]){const a=[l.x+dx,y-l.side*.22,l.z],b=[l.x+dx+Math.sin(l.tw)*.12,y-l.side*1.6,l.z+Math.cos(l.tw)*.12];it.push({t:'bond',a,b,r:.05,c:TAIL,op:.38});}}
  for(const h of HEL)it.push({t:'bond',a:h.a,b:h.b,r:.3,c:AQ,op:.82});
  for(const w of S.ws){const [o,h1,h2]=water(w.p,w.ang),s=w.ch?1.15:1;it.push({t:'atom',p:o,r:.13*s,c:G.C.O},{t:'atom',p:h1,r:.085*s,c:'#f4f4f4'},{t:'atom',p:h2,r:.085*s,c:'#f4f4f4'});}
  for(const n of S.ions){const r=n.k==='Na'?.24:.32;it.push({t:'atom',p:n.p,r:G.ION[n.k]*.9,c:n.k==='Na'?'#7d4fc8':'#2e9a4c'});
    for(let k=0;k<6;k++){const d=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]][k],c=Math.cos(n.spin),s=Math.sin(n.spin),dd=[d[0]*c-d[2]*s,d[1],d[0]*s+d[2]*c];
      it.push({t:'atom',p:G.add(n.p,G.mul(dd,r)),r:.1,c:G.C.O,op:.55});}}
  S.bounce.forEach(b=>it.push({t:'atom',p:b.p,r:.4+b.t*.4,c:'#C11430',op:.35*(1-b.t)}));
  it.push({t:'tag',p:[0,HALF+2.9,0],text:S.salty?'outside the cell: seawater':'outside the cell: blood plasma',c:'#26262b'},{t:'tag',p:[0,-HALF-2.9,0],text:'inside the cell',c:'#26262b'});
  return it;}
function chapter(C){const {txt,pill}=Story.h,V=View3D.make({yaw:.5,pitch:-.42,auto:.15,focal:24});
  return {rail:'In 3D',title:'Inside the water doorway',live:true,
    text(S){const s=S.w3;if(!s)return '';const net=s.outN-s.inN;
      if(!s.salty)return 'This is a real-scale patch of the cell\'s outer wall: gold heads and tan oily tails, about 4 nm thick. The teal tubes are <b class="term">aquaporin</b>, the water doorway. '+
        'Its pore is as narrow as one water molecule, so waters pass in single file, <b>both ways</b>. Salt ions (purple sodium, green chloride) carry a shell of water and are far too wide. <b>Drag to turn it</b>, then make the outside seawater.';
      return 'Now the outside is <b>seawater</b>, about four times saltier than blood. Waters still cross both ways, but more leave the cell than come in: so far <b>'+s.outN+' out, '+s.inN+' in</b>. '+
        (net>2?'The cell is losing water. That is what drinking seawater would do to your cells.':'Watch the counts for a little while.');},
    ui:[{type:'button',label:'Make the outside seawater',pulse:true,act(S){S.w3=newState(true);},show:S=>S.w3&&!S.w3.salty},
        {type:'button',label:'Back to blood',act(S){S.w3=newState(false);},show:S=>S.w3&&S.w3.salty}],
    todo:[{t:'Drag the membrane to turn it',ok:()=>V.touched},{t:'Make the outside seawater and watch 3 more waters leave than enter',ok:S=>S.w3&&S.w3.salty&&S.w3.outN-S.w3.inN>=3}],
    enter(S){S.w3=newState(false);},
    tick(S,dt){if(S.w3)step(S.w3,dt);},
    draw(ctx,S){const s=S.w3||(S.w3=newState(false));ctx.fillStyle='#eef4fa';ctx.fillRect(0,0,1200,600);
      V.render(ctx,{x:0,y:0,w:880,h:600,nm:50,items:items(s),bg:'#eef4fa'});
      const x=900;ctx.fillStyle='#fff';ctx.strokeStyle='#d5d9de';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect?ctx.roundRect(x,24,280,552,12):ctx.rect(x,24,280,552);ctx.fill();ctx.stroke();
      txt(ctx,'What you are looking at',x+18,58,{s:17,w:700,c:C.ink});
      [['#e9c46a','membrane: water-loving heads'],['#cdb68a','oily tails (block salt)'],['#2a9d8f','aquaporin: the water doorway'],[G.C.O,'water (red O, white H)'],['#7d4fc8','sodium ion + its water shell'],['#2e9a4c','chloride ion + its water shell']]
        .forEach(([c,t],k)=>{const y=94+k*30;ctx.beginPath();ctx.arc(x+28,y-5,8,0,7);ctx.fillStyle=c;ctx.fill();txt(ctx,t,x+44,y,{s:14.5,c:C.ink});});
      txt(ctx,'Same scale throughout: the membrane',x+18,290,{s:13,c:C.soft});txt(ctx,'is 4 nm thick. Only 1 water in 60 is drawn.',x+18,308,{s:13,c:C.soft});
      txt(ctx,'Waters out of the cell',x+18,356,{s:15,c:C.soft});txt(ctx,String(s.outN),x+262,358,{s:24,w:700,a:'right',c:C.rj});
      txt(ctx,'Waters into the cell',x+18,398,{s:15,c:C.soft});txt(ctx,String(s.inN),x+262,400,{s:24,w:700,a:'right',c:'#2f7fd0'});
      const net=s.outN-s.inN;txt(ctx,'Net',x+18,440,{s:15,w:700,c:C.ink});txt(ctx,net>0?net+' out':net<0?(-net)+' in':'even',x+262,442,{s:22,w:700,a:'right',c:net>0?C.rj:C.ink});
      if(s.salty&&net>=3)pill(ctx,'The cell is shrinking',x+140,500,{bg:'#fdeceb',c:C.rj,bd:C.rj,s:14,w:700,r:9});}};}
window.Water3D={chapter};
})();
