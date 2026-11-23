/* 3D chapter for "Why does a cracker turn sweet?" (Nov 24, 2026): a starch chain as it really is, a coil, and amylase cutting it.
   Geometry from measured amylose: a left-handed coil with 6 glucose units per turn, 0.8 nm per turn, about 0.45 nm between
   neighboring units, about 1.3 nm across. Each glucose is a six-member ring (5 carbons + 1 oxygen); an oxygen bridge joins
   neighbors. Hydrogen atoms are left out so the coil can be seen. Salivary amylase cuts bridges inside the chain (it never
   leaves single glucose behind), so the small pieces are maltose (2 units) and maltotriose (3 units).
   Exposes window.Starch3D.chapter(h) where h = the story's helpers; enzymes.js puts it after "Go to where it happens". */
(function(){
'use strict';
const G=View3D.G,N=30,RISE=.8/6,RAD=.42,TURN=-Math.PI/3;
function build(){const res=[];
  for(let i=0;i<N;i++){const th=i*TURN,c=[(i-(N-1)/2)*RISE,RAD*Math.cos(th),RAD*Math.sin(th)];
    const r=[0,Math.cos(th),Math.sin(th)],t=G.norm([RISE,-RAD*Math.sin(th)*TURN,RAD*Math.cos(th)*TURN]),v=G.norm(G.cross(r,t));
    const ring=G.ring(c,t,v);                       // 0 = C1 (toward the next unit), 3 = C4 (toward the one before), 5 = ring O
    const c6=G.add(ring[4],G.mul(r,.15)),o6=G.add(c6,G.mul(G.norm(G.add(r,v)),.14));
    res.push({c,r,t,ring,c6,o6});}
  const br=[];for(let i=0;i<N-1;i++){const a=res[i].ring[0],b=res[i+1].ring[3];br.push(G.add(G.mul(G.add(a,b),.5),G.mul(G.norm(G.add(res[i].r,res[i+1].r)),.06)));}
  return {res,br};}
const M=build();
function newState(){return {cut:new Array(N-1).fill(false),off:new Array(N).fill(null),flash:[],auto:false,autoT:0,n:0};}
/* pieces: runs of units still joined */
function pieces(s){const out=[];let a=0;for(let i=0;i<N-1;i++)if(s.cut[i]){out.push([a,i]);a=i+1;}out.push([a,N-1]);return out;}
function cutOne(s){const P=pieces(s),opts=[];
  // amylase cuts inside a stretch long enough to sit in its groove; both new pieces keep at least 2 units
  P.forEach(([a,b])=>{if(b-a+1<4)return;for(let i=a+1;i<b-1;i++)opts.push(i);});
  if(!opts.length)return false;const i=opts[Math.floor(Math.random()*opts.length)];s.cut[i]=true;s.n++;s.flash.push({i,t:0});
  pieces(s).forEach(([a,b])=>{if(b-a+1<=3&&!s.off[a]){const mid=(a+b)/2|0,r=M.res[mid].r,dir=G.norm([(Math.random()-.5)*.25,r[1],r[2]]);
    const o={d:dir,k:0,spin:(Math.random()-.5)*.9,ax:G.norm([Math.random()-.5,Math.random()-.5,Math.random()-.5])};for(let j=a;j<=b;j++)s.off[j]=o;}});
  return true;}
const done=s=>pieces(s).every(([a,b])=>b-a+1<=3);
/* rotate p around axis u by angle w (Rodrigues) */
function spin(p,u,w){const c=Math.cos(w),sn=Math.sin(w),d=p[0]*u[0]+p[1]*u[1]+p[2]*u[2],x=G.cross(u,p);return [p[0]*c+x[0]*sn+u[0]*d*(1-c),p[1]*c+x[1]*sn+u[1]*d*(1-c),p[2]*c+x[2]*sn+u[2]*d*(1-c)];}
function chapter(C){const {txt,pill}=Story.h,V=View3D.make({yaw:.35,pitch:-.35,auto:.22});
  const SUB='#2d6bd2',PROD='#df741a';
  function items(s){const it=[],P=pieces(s);
    const ctr={};P.forEach(([a,b])=>{let c=[0,0,0];for(let j=a;j<=b;j++)c=G.add(c,M.res[j].c);c=G.mul(c,1/(b-a+1));for(let j=a;j<=b;j++)ctr[j]=c;});
    const X=(j,p)=>{const o=s.off[j];if(!o)return p;const c=ctr[j],q=spin(G.sub(p,c),o.ax,o.spin*o.k);return G.add(G.add(c,q),G.mul(o.d,o.k*.75));};
    const small=j=>!!s.off[j];
    for(let j=0;j<N;j++){const R=M.res[j],col=small(j)?PROD:SUB,rg=R.ring.map(p=>X(j,p));
      it.push({t:'face',pts:rg,c:col,op:.62});
      for(let k=0;k<6;k++){it.push({t:'bond',a:rg[k],b:rg[(k+1)%6],r:.022,c:'#a3aab4'});it.push({t:'atom',p:rg[k],r:k===5?.052:.045,c:k===5?G.C.O:G.C.C});}
      const c6=X(j,R.c6),o6=X(j,R.o6);it.push({t:'bond',a:rg[4],b:c6,r:.02,c:'#a3aab4'},{t:'atom',p:c6,r:.045,c:G.C.C},{t:'bond',a:c6,b:o6,r:.02,c:'#a3aab4'},{t:'atom',p:o6,r:.05,c:G.C.O});}
    // a soft ribbon through the sugar centers, so the coil reads as a spring at a glance
    for(let i=0;i<N-1;i++){if(s.cut[i])continue;it.push({t:'bond',a:X(i,M.res[i].c),b:X(i+1,M.res[i+1].c),r:.11,c:small(i)?PROD:SUB,op:.16});}
    for(let i=0;i<N-1;i++){if(s.cut[i])continue;const b=X(i,M.br[i]);
      it.push({t:'bond',a:X(i,M.res[i].ring[0]),b,r:.022,c:'#a3aab4'},{t:'bond',a:b,b:X(i+1,M.res[i+1].ring[3]),r:.022,c:'#a3aab4'},{t:'atom',p:b,r:.055,c:G.C.O});}
    // a flash where amylase just cut: the bridge oxygen pops off as part of a water molecule that splits the bond
    s.flash.forEach(f=>{if(f.t<1){it.push({t:'atom',p:X(f.i,M.br[f.i]),r:.09+f.t*.25,c:'#3a8a55',op:.55*(1-f.t)});}});
    // name the first freed pieces
    let named=0;P.forEach(([a,b])=>{if(!s.off[a]||named>=2||s.off[a].k<.4)return;named++;const m=(a+b)/2|0;it.push({t:'tag',p:X(m,M.res[m].c),text:b-a+1===2?'maltose (2 sugars)':'maltotriose (3 sugars)',c:PROD,dy:-26});});
    return it;}
  return {rail:'In 3D',title:'Spin a starch chain',live:true,
    text(s){const t=s.st3;if(!t||!t.n)return 'A starch chain is not a straight line. It winds into a <b>coil</b>, like a phone cord: six sugar units for every turn, about 1.3 nm across (a hair is 70,000 nm wide). '+
        'Each <b style="color:'+SUB+'">blue tile</b> is one sugar unit: a ring of five gray carbons and one red oxygen. A red oxygen <b>bridge</b> joins each unit to the next. <b>Drag the coil</b> to turn it, then let amylase cut.';
      if(!done(t))return '<b class="term">Amylase</b> cuts the oxygen bridges inside the chain (a water molecule splits each one). It is about four times wider than this coil, so it grabs a stretch of the chain in its groove. '+
        'Every piece of 2 or 3 units floats free and turns <b style="color:'+PROD+'">orange</b>. Keep cutting.';
      return 'Nothing long is left: only <b style="color:'+PROD+'">maltose</b> (2 units) and maltotriose (3 units). These are small enough to fit the sweet sensor on your tongue. Starch is far too long to fit. <b>That is why the cracker turns sweet the longer you chew.</b>';},
    ui:[{type:'button',label:'✂ Let amylase cut',pulse:true,act(S){const t=S.st3;if(!cutOne(t))t.auto=false;},show:S=>S.st3&&!done(S.st3)},
        {type:'button',label:'Keep cutting',act(S){S.st3.auto=true;},show:S=>S.st3&&S.st3.n>0&&!done(S.st3)&&!S.st3.auto},
        {type:'button',label:'Start over',act(S){S.st3=newState();},show:S=>S.st3&&S.st3.n>0}],
    todo:[{t:'Drag the coil to turn it',ok:()=>V.touched},{t:'Cut until only small sugars are left',ok:S=>S.st3&&done(S.st3)}],
    enter(S){S.st3=newState();},
    tick(S,dt){const s=S.st3;if(!s)return;s.flash.forEach(f=>f.t+=dt*1.6);s.flash=s.flash.filter(f=>f.t<1);
      const seen=new Set();s.off.forEach(o=>{if(o&&!seen.has(o)){seen.add(o);o.k=Math.min(1,o.k+dt*.6);}});
      if(s.auto){s.autoT+=dt;if(s.autoT>.45){s.autoT=0;if(!cutOne(s))s.auto=false;}}},
    draw(ctx,S){const s=S.st3||(S.st3=newState());ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,1200,600);
      V.render(ctx,{x:0,y:0,w:880,h:600,nm:150,items:items(s),bg:'#f4f6f8'});
      // legend and counts, to the right of the picture
      const x=900;ctx.fillStyle='#fff';ctx.strokeStyle='#d5d9de';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect?ctx.roundRect(x,24,280,552,12):ctx.rect(x,24,280,552);ctx.fill();ctx.stroke();
      txt(ctx,'What you are looking at',x+18,58,{s:17,w:700,c:C.ink});
      const L=[[G.C.C,'carbon atom'],[G.C.O,'oxygen atom'],[SUB,'one sugar unit (still starch)'],[PROD,'cut free: a small sugar']];
      L.forEach(([c,t],k)=>{const y=96+k*34;ctx.beginPath();ctx.arc(x+30,y-5,9,0,7);ctx.fillStyle=c;ctx.globalAlpha=k>1?.6:1;ctx.fill();ctx.globalAlpha=1;txt(ctx,t,x+48,y,{s:15,c:C.ink});});
      txt(ctx,'Hydrogen atoms are left out.',x+18,250,{s:13.5,c:C.soft});
      txt(ctx,'Scale: the coil is 1.3 nm across.',x+18,272,{s:13.5,c:C.soft});
      const P=pieces(s),free=P.filter(([a,b])=>b-a+1<=3).length,long=P.filter(([a,b])=>b-a+1>3).reduce((n,[a,b])=>n+b-a+1,0);
      txt(ctx,'Cuts',x+18,326,{s:15,c:C.soft});txt(ctx,String(s.n),x+262,328,{s:24,w:700,a:'right',c:C.ink});
      txt(ctx,'Small sugars cut free',x+18,368,{s:15,c:C.soft});txt(ctx,String(free),x+262,370,{s:24,w:700,a:'right',c:PROD});
      txt(ctx,'Units still in long starch',x+18,410,{s:15,c:C.soft});txt(ctx,String(long),x+262,412,{s:24,w:700,a:'right',c:SUB});
      if(done(s))pill(ctx,'Sweet: small sugars fit your taste sensor',x+140,480,{bg:'#fff4ea',c:PROD,bd:PROD,s:14,w:700,r:9});}};}
window.Starch3D={chapter};
})();
