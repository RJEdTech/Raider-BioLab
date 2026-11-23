/* Story: "Why does a cracker turn sweet?"  Enzymes, told as one story: a cracker, the amylase in your saliva, and what
   cold, heat and stomach acid do to it.
   The rate model is the one the full BioLab enzyme tool uses, so the graphs match: molecules move twice as fast for every
   10 °C (Q10 = 2), the enzyme starts to unfold near 44 °C, heat damage above about 55 °C is permanent, and activity falls
   off in a bell shape around the best pH (6.8 for amylase, 2 for pepsin).
   Every cut on screen is one event: the same event flashes at the enzyme, sends one dot over the energy hill and adds to the count. */
(function(){
'use strict';
const {clamp,lerp,ease,rr,txt,pill,ring,boxring,arrow,hash}=Story.h;
const W=1200,H=600;
const C={sol:'#e7f2f9',enz:'#3a8a55',enzd:'#8fa596',sub:'#2d6bd2',prod:'#df741a',fat:'#d9a514',prot:'#9a5bc7',pep:'#7a5ad0',h:'#d81b6a',ink:'#26262b',soft:'#62626a',rj:'#C11430',good:'#1b7339',think:'#a8178f',gold:'#e8a800'};
const K37=.8,NE=6;
const ff=T=>1/(1+Math.exp((T-44)/2.5)), kick=T=>Math.pow(2,(T-37)/10), hazard=T=>.25*Math.exp((T-58)/3), fph=(p,opt)=>Math.exp(-Math.pow((p-opt)/1.6,2));
const expected=T=>{const h=hazard(T),alive=h<1e-6?1:(1-Math.exp(-3*h))/(3*h);return NE*K37*kick(T)*ff(T)*alive;};   // cuts per second in a fresh 3-second test
function shade(hex,k){const n=parseInt(hex.slice(1),16);const r=n>>16,g=n>>8&255,b=n&255,f=v=>Math.round(k>0?v+(255-v)*k:v*(1+k));return 'rgb('+f(r)+','+f(g)+','+f(b)+')';}
function dot(ctx,x,y,r,fill,stroke,lw){ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=lw||1.2;ctx.strokeStyle=stroke;ctx.stroke();}}

/* ---------------- molecules ---------------- */
function hex(ctx,x,y,r,fill,stroke,lw){ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i+Math.PI/6;ctx[i?'lineTo':'moveTo'](x+r*Math.cos(a),y+r*Math.sin(a));}ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.lineWidth=lw||1.2;ctx.strokeStyle=stroke;ctx.stroke();}
function sugars(ctx,pts,r,o){o=o||{};ctx.strokeStyle=o.bond||shade(C.sub,-.35);ctx.lineWidth=Math.max(1.5,r*.34);ctx.beginPath();pts.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p[0],p[1]));ctx.stroke();
  if(o.halo){ctx.save();ctx.strokeStyle=C.prod;ctx.lineWidth=r*.9;ctx.lineCap='round';ctx.globalAlpha*=.55;ctx.beginPath();pts.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p[0],p[1]));ctx.stroke();ctx.restore();for(const p of pts)dot(ctx,p[0],p[1],r*1.34,'rgba(223,116,26,.5)');}
  for(const p of pts)hex(ctx,p[0],p[1],r,o.fill||C.sub,shade(C.sub,-.45),Math.max(1,r*.16));}
/* The enzymes are the real molecules (Protein Data Bank 1SMD and 1PSN), seen looking straight into the active-site groove.
   PX: pixels per ångström when sc = 1. Sugar units are to the same scale: 4.8 Å apart along the chain. */
const PX=1.85,SP=4.8*PX,HR=2.4*PX,HALF=31*PX;
const groove=(x,sc)=>(3+1.5*Math.sin(x/(30*sc)))*sc;        // the starch chain lies along the groove, through the cutting spot at the center
function enzyme(ctx,x,y,sc,o){o=o||{};const u=clamp(o.u||0,0,1),pep=o.col===C.pep,name=pep?'PEP':'AMY',P=PX*sc,R=HALF*sc;ctx.save();ctx.translate(x,y);const a0=ctx.globalAlpha;
  const fold=clamp(1-(u-.55)*2.4,0,1);
  if(fold>0){ctx.save();if(u>0){const k=1+u*.16;ctx.scale(k,k);}Story.mol.draw(ctx,name,0,0,P,{alpha:fold,col:o.dead?'#8fa596':undefined});
      const sk=1-Story.mol.realK();if(sk>0&&sc>=.9){ctx.globalAlpha=a0*fold*sk;ctx.lineCap='round';ctx.lineJoin='round';const gw=R*(pep?.5:.62);ctx.beginPath();for(let gx=-gw;gx<=gw+.1;gx+=gw/8)ctx[gx===-gw?'moveTo':'lineTo'](gx,groove(gx,sc));   // simple view: the groove (active site) is drawn in
        ctx.strokeStyle=o.dead?'#5f7366':pep?'#5a44a8':'#1f6b3f';ctx.lineWidth=HR*sc*2+9;ctx.stroke();ctx.strokeStyle=o.dead?'#c9d6cd':pep?'#e3dcf9':'#d8f0e0';ctx.lineWidth=HR*sc*2+5;ctx.stroke();}
      ctx.restore();
    if(!pep){ // the three acid groups that do the cutting, at their measured positions
      const acids=Story.mol.pts('AMY').slice(1,4);ctx.globalAlpha=a0*fold;
      if(o.charges)for(const q of acids){const px=q[1]*P*1.9,py=q[2]*P*1.9-10*sc,cap=o.capped;dot(ctx,px,py,5.2*sc,cap?C.h:'#fff',cap?'#fff':'#1d4a2f',1.2);txt(ctx,cap?'+':'−',px,py+4.2*sc,{s:11*sc,w:700,a:'center',c:cap?'#fff':'#1d4a2f'});}
      else if(sc>=.9)for(const q of acids)dot(ctx,q[1]*P,q[2]*P,1.7*sc,o.capped?'#9aa0aa':'#ffd34d','rgba(40,30,0,.7)',.8);
      ctx.globalAlpha=a0;}
  }
  // the one long chain the enzyme is made of: a loose wavy string once the fold is gone
  if(fold<1){ctx.globalAlpha=a0*(1-fold);ctx.strokeStyle=o.dead?C.enzd:shade(pep?C.pep:C.enz,-.05);ctx.lineWidth=7*sc;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
    for(let i=0;i<=44;i++){const f=i/44,fx=Math.cos(i*.9)*.52*(f*.6+.4)*R,fy=(Math.sin(i*1.3)*.34+.1)*R,ux=(f-.5)*3.1*R,uy=(Math.sin(i*.8+(o.wob||0))*.36+Math.sin(i*.33)*.22)*R;ctx[i?'lineTo':'moveTo'](lerp(fx,ux,u),lerp(fy,uy,u));}
    ctx.stroke();}
  ctx.globalAlpha=a0;ctx.restore();}
function fat(ctx,x,y,sc){ctx.save();ctx.translate(x,y);ctx.strokeStyle=shade(C.fat,-.3);ctx.lineWidth=4.5*sc;ctx.lineCap='round';ctx.lineJoin='round';
  for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(-10*sc,k*17*sc);for(let i=1;i<=9;i++)ctx.lineTo(-10*sc-i*11*sc,k*17*sc+((i%2)?-5:5)*sc);ctx.stroke();}
  ctx.strokeStyle=shade(C.fat,-.45);ctx.lineWidth=7*sc;ctx.beginPath();ctx.moveTo(-6*sc,-19*sc);ctx.lineTo(-6*sc,19*sc);ctx.stroke();for(let k=-1;k<=1;k++)dot(ctx,-6*sc,k*17*sc,6.5*sc,C.fat,shade(C.fat,-.45),1.5);ctx.restore();}
function protein(ctx,x,y,sc,n){const cols=['#9a5bc7','#c76aa8','#6f7fd6','#b08ad8','#8a5bd0'];ctx.strokeStyle='#5d3a80';ctx.lineWidth=3*sc;ctx.beginPath();const pts=[];
  for(let i=0;i<(n||8);i++)pts.push([x-i*17*sc,y+Math.sin(i*1.5)*7*sc]);pts.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p[0],p[1]));ctx.stroke();pts.forEach((p,i)=>dot(ctx,p[0],p[1],(7+((i*3)%4))*sc,cols[i%5],'#5d3a80',1.3));}

/* ---------------- the energy hill ---------------- */
function hillY(x,hb){const base=lerp(.36,.14,ease((x-.3)/.5));return base+hb*Math.exp(-Math.pow((x-.45)/.15,2));}
const HB_NO=.56,HB_ENZ=.2;
function newHill(){return {dots:[],t:0,over:0};}
function hillKick(h,ok){h.dots.push({ok,p:0,s:Math.random()});if(ok)h.over++;}
function stepHill(h,dt){h.t+=dt;for(const d of h.dots)d.p+=dt/(d.ok?1.25:.7);h.dots=h.dots.filter(d=>d.p<1);}
function drawHill(ctx,x,y,w,h,o){o=o||{};const hb=lerp(HB_NO,HB_ENZ,o.enz==null?1:o.enz),big=w>450,fs=big?16:14;
  rr(ctx,x,y,w,h,12);ctx.fillStyle='#fbfaf6';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#d8d8d3';ctx.stroke();
  const L=x+(big?54:40),R=x+w-18,T=y+(big?46:38),B=y+h-(big?44:34),X=f=>lerp(L,R,f),Y=e=>lerp(B,T,e/1.02);
  arrow(ctx,L-12,B+4,L-12,T-8,{c:C.soft,lw:2,head:9});ctx.save();ctx.translate(L-22,(T+B)/2);ctx.rotate(-Math.PI/2);txt(ctx,'ENERGY',0,0,{s:fs-2,w:700,a:'center',c:C.soft});ctx.restore();
  txt(ctx,'starch chain',X(.02),Y(.36)+22,{s:fs-1,c:shade(C.sub,-.3),w:600});txt(ctx,'cut: small sugars',X(.98),Y(.14)+22,{s:fs-1,c:shade(C.prod,-.3),w:600,a:'right'});
  const curve=(hbv)=>{ctx.beginPath();for(let i=0;i<=60;i++){const f=i/60;ctx[i?'lineTo':'moveTo'](X(f),Y(hillY(f,hbv)));}};
  if(o.showNo!==false){curve(HB_NO);ctx.setLineDash([7,6]);ctx.lineWidth=2.5;ctx.strokeStyle='#8a8f98';ctx.stroke();ctx.setLineDash([]);
    if(hb<HB_NO-.06)txt(ctx,'with no enzyme',X(.45),Y(.36+HB_NO)-8,{s:fs-1,c:'#62666e',w:600,a:'center'});}
  curve(hb);ctx.lineWidth=big?5:4;ctx.strokeStyle=hb>HB_NO-.06?'#62666e':C.enz;ctx.lineJoin='round';ctx.stroke();
  if(hb<HB_NO-.06)txt(ctx,'with amylase',X(.45),Y(.36+hb)-(big?14:10),{s:fs-1,c:C.enz,w:700,a:'center'});
  if(o.label){const ax=X(.7);ctx.setLineDash([3,5]);ctx.strokeStyle='#8a8f98';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X(.03),Y(.36));ctx.lineTo(ax+8,Y(.36));ctx.moveTo(X(.45),Y(.36+hb));ctx.lineTo(ax+8,Y(.36+hb));ctx.stroke();ctx.setLineDash([]);
    arrow(ctx,ax,Y(.36),ax,Y(.36+hb)+2,{c:C.rj,lw:3,head:11});arrow(ctx,ax,Y(.36+hb),ax,Y(.36)-2,{c:C.rj,lw:3,head:11});
    txt(ctx,'activation',ax+12,Y(.36+hb/2)-3,{s:fs,w:700,c:C.rj});txt(ctx,'energy',ax+12,Y(.36+hb/2)+fs,{s:fs,w:700,c:C.rj});}
  // the bonds waiting in the valley, and every kick
  const n=big?16:9;for(let i=0;i<n;i++){const f=.03+.2*hash(i*7.3+1),j=Math.sin(o.t*(3+o.jig*5)+i*2.1)*(.006+.012*o.jig);dot(ctx,X(f+j),Y(hillY(f,hb))-6-((i*5)%3)*4,big?6:4.6,C.sub,shade(C.sub,-.45),1);}
  for(const d of (o.hill?o.hill.dots:[])){let f,e;if(d.ok){f=lerp(.2,.92,ease(d.p));e=hillY(f,hb);}else{const top=.25+.5*d.s,up=Math.sin(d.p*Math.PI);f=lerp(.2,.2+.2*top,up);e=hillY(f,hb);}
    const px=X(f),py=Y(e)-7;if(d.ok){dot(ctx,px,py,big?8:6.5,f>.5?C.prod:C.sub,C.ink,1.5);if(f>.38&&f<.52)ring(ctx,px,py,big?13:10,o.t*3,C.gold);}else dot(ctx,px,py,big?6.5:5,C.sub,shade(C.sub,-.45),1);}
  txt(ctx,o.title||'The energy hill',x+14,y+24,{s:fs,w:700,c:C.ink});
  txt(ctx,'reaction →',X(.5),B+(big?30:24),{s:fs-2,c:C.soft,a:'center'});
}

/* ---------------- the close-up: one enzyme, one chain ---------------- */
function newCU(o){return Object.assign({cx:430,cy:320,sc:2.5,chain:null,malt:[],cuts:0,auto:false,wait:0,sensor:false,sweet:0,flash:0,t:0},o);}
function cuSend(cu){if(cu.chain)return;cu.chain={n:14,st:'in',p:0};}
function cuSnip(cu){if(cu.chain&&cu.chain.st==='hold'){cu.chain.st='strain';cu.chain.p=0;return true;}return false;}
function stepCU(cu,dt){cu.t+=dt;cu.flash=Math.max(0,cu.flash-dt*2.2);const c=cu.chain,sp=SP*cu.sc;
  if(c){if(c.st==='in'){c.p+=dt/1.3;if(c.p>=1){c.st='hold';c.p=0;}}
    else if(c.st==='hold'){if(cu.auto){cu.wait+=dt;if(cu.wait>cu.gap){cu.wait=0;c.st='strain';c.p=0;}}}
    else if(c.st==='strain'){c.p+=dt/.65;if(c.p>=1){cu.cuts++;cu.flash=1;const y=cu.cy+groove(sp*1.5,cu.sc);cu.malt.push({x:cu.cx+sp*1.5,y,vx:60+Math.random()*30,vy:-34-Math.random()*26,a:0,rot:0,dock:cu.sensor});
        c.n-=2;if(cu.onCut)cu.onCut();if(c.n<3){c.st='out';c.p=0;}else{c.st='slide';c.p=0;}}}
    else if(c.st==='slide'){c.p+=dt/.45;if(c.p>=1){c.st='hold';c.p=0;}}
    else if(c.st==='out'){c.p+=dt/1.2;if(c.p>=1){cu.chain=null;cu.wait=0;}}}
  else if(cu.auto){cu.wait+=dt;if(cu.wait>.5){cu.wait=0;cuSend(cu);}}
  for(const m of cu.malt){m.a+=dt;if(m.dock){const [tx,ty]=pocket(cu),k=Math.min(1,dt*1.6);m.x+=(tx-m.x)*k;m.y+=(ty-m.y)*k;if(!m.done&&Math.abs(m.x-tx)<6){m.done=true;cu.sweet++;m.a=3.2;cu.sflash=1;}}else{m.x+=m.vx*dt;m.y+=m.vy*dt;m.vy+=6*dt;}}
  cu.malt=cu.malt.filter(m=>m.a<4.4);cu.sflash=Math.max(0,(cu.sflash||0)-dt*1.6);}
function chainPts(cu){const c=cu.chain,sp=SP*cu.sc,pts=[];if(!c)return pts;
  let lead=cu.cx+sp*1.5;                                  // two units sit past the cutting spot
  if(c.st==='in')lead=lerp(cu.cx-HALF*cu.sc-sp*3,lead,ease(c.p));else if(c.st==='slide')lead-=sp*2*(1-ease(c.p));else if(c.st==='out')lead+=ease(c.p)*sp*9;
  for(let j=0;j<c.n;j++){let x=lead-j*sp;if(c.st==='strain'&&j<2)x+=ease(c.p)*5*cu.sc;const dx=x-cu.cx,inside=Math.abs(dx)<HALF*cu.sc;
    pts.push([x,cu.cy+(inside?groove(dx,cu.sc):groove(Math.sign(dx)*HALF*cu.sc,cu.sc)+Math.sin(x*.035+cu.t*1.6)*5*cu.sc*Math.min(1,(Math.abs(dx)-HALF*cu.sc)/(40*cu.sc)))+(c.st==='out'?-ease(c.p)*60:0)]);}
  return pts;}
function drawCU(ctx,cu,o){o=o||{};const r=HR*cu.sc;
  if(o.enz!==false)enzyme(ctx,cu.cx,cu.cy,cu.sc,{u:o.u||0,charges:o.charges,capped:o.capped,col:o.col});
  const pts=chainPts(cu),c=cu.chain;
  if(pts.length){ctx.globalAlpha=c.st==='out'?1-ease(c.p):1;sugars(ctx,pts,r);ctx.globalAlpha=1;
    if(c.st==='strain'||(o.strain&&c.st==='hold')){const a=pts[1],b=pts[2];ctx.strokeStyle=C.rj;ctx.lineWidth=4.5*cu.sc*.5+2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a[0]-r*.7,a[1]);ctx.lineTo(b[0]+r*.7,b[1]);ctx.stroke();
      if(o.strainLabel)pill(ctx,'this bond is bent and strained',cu.cx,cu.cy-76*cu.sc,{bg:'#fff',c:C.rj,bd:C.rj,s:15.5,w:700});}}
  if(cu.flash>0){ctx.globalAlpha=cu.flash;ring(ctx,cu.cx,cu.cy,20*cu.sc*(1.4-cu.flash*.4),0,C.gold);ctx.globalAlpha=1;}
  for(const m of cu.malt){const a=m.a<.25?m.a/.25:m.a>3.6?Math.max(0,(4.4-m.a)/.8):1;ctx.globalAlpha=a;const d=SP*cu.sc/2;sugars(ctx,[[m.x-d,m.y],[m.x+d,m.y]],r,{halo:true});ctx.globalAlpha=1;}
}
/* The sweet sensor: the human sweet taste receptor (PDB 9UTB), two proteins paired, standing in the membrane of a taste cell.
   Drawn at the same pixels-per-ångström as the amylase beside it. Its own origin is the middle of the membrane. */
const SW={x:1010,y:470};
function pocket(cu){const s=PX*cu.sc,q=Story.mol.DATA.SWT.pts[0];return [SW.x+q[1]*s,SW.y+q[2]*s];}
function sensor(ctx,cu,t){const s=PX*cu.sc,M=Story.mol,m=M.DATA.SWT,y0=SW.y+m.mem[0]*s,y1=SW.y+m.mem[1]*s,[px,py]=pocket(cu),x0=640;
  ctx.fillStyle='#fbeeea';ctx.fillRect(x0,y1,W-x0,H-y1);ctx.fillStyle='#f6ead4';ctx.fillRect(x0,y0,W-x0,y1-y0);                     // inside the taste cell, and its membrane (about 4 nm thick, to scale)
  ctx.strokeStyle='#d9c08a';ctx.lineWidth=2.4;ctx.beginPath();const sp=8*s,hr=3.2*s,tl=13*s;
  for(let x=x0+sp/2;x<W;x+=sp){ctx.moveTo(x-hr*.4,y0+hr*2);ctx.lineTo(x-hr*.4,y0+hr*2+tl);ctx.moveTo(x+hr*.4,y0+hr*2);ctx.lineTo(x+hr*.4,y0+hr*2+tl);ctx.moveTo(x-hr*.4,y1-hr*2);ctx.lineTo(x-hr*.4,y1-hr*2-tl);ctx.moveTo(x+hr*.4,y1-hr*2);ctx.lineTo(x+hr*.4,y1-hr*2-tl);}ctx.stroke();
  for(let x=x0+sp/2;x<W;x+=sp){dot(ctx,x,y0+hr,hr,'#e9c46a','#b89238',1);dot(ctx,x,y1-hr,hr,'#e9c46a','#b89238',1);}
  const g=ctx.createLinearGradient(x0,0,x0+90,0);g.addColorStop(0,C.sol);g.addColorStop(1,'rgba(231,242,249,0)');ctx.fillStyle=g;ctx.fillRect(x0,y0-2,92,H-y0+2);
  M.draw(ctx,'SWT',SW.x,SW.y,s);
  {const sk=1-M.realK();if(sk>0){ctx.globalAlpha=sk;ctx.beginPath();ctx.ellipse(px,py,SP*cu.sc*1.45,HR*cu.sc*1.9,0,0,6.2832);ctx.fillStyle='#fff3f5';ctx.fill();ctx.lineWidth=2.4;ctx.strokeStyle='#7a2f42';ctx.stroke();ctx.globalAlpha=1;}}   // simple view: the pocket is drawn open
  pill(ctx,'surface of a taste cell',x0+176,(y0+y1)/2,{bg:'#fffaf0',c:'#6b5320',bd:'#b89238',s:15.5,w:700});txt(ctx,'inside the taste cell',x0+96,y1+34,{s:15,c:'#7a4a44'});
  txt(ctx,'sweet sensor',SW.x-92,312,{s:17,w:700,a:'right',c:'#7a2f42'});txt(ctx,'(a receptor protein)',SW.x-92,333,{s:15,a:'right',c:'#7a2f42'});txt(ctx,Story.view==='real'?'its real shape,':'a simple drawing',SW.x-92,353,{s:15,a:'right',c:'#7a2f42'});if(Story.view==='real')txt(ctx,'first seen in 2025',SW.x-92,373,{s:15,w:700,a:'right',c:'#7a2f42'});
  pill(ctx,'the pocket: only a small sugar fits',px-150,py-92,{bg:'#fff',c:'#7a2f42',bd:'#b0566a',s:15.5,w:700});arrow(ctx,px-96,py-76,px-10,py-10,{c:'#7a2f42',lw:2,head:10});
  if(cu.sflash>0){ctx.globalAlpha=cu.sflash;pill(ctx,'sweet!',px+10,py-34,{bg:C.prod,c:'#fff',bd:null,s:22,w:700});
    arrow(ctx,SW.x-150,y1+52,SW.x-150,H-8,{c:C.prod,lw:4,head:12});txt(ctx,'signal to your brain',SW.x-138,H-14,{s:15.5,w:700,c:shade(C.prod,-.25)});ctx.globalAlpha=1;}
  ctx.strokeStyle=C.ink;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(30,H-44);ctx.lineTo(30+50*s,H-44);ctx.moveTo(30,H-51);ctx.lineTo(30,H-37);ctx.moveTo(30+50*s,H-51);ctx.lineTo(30+50*s,H-37);ctx.stroke();
  txt(ctx,'5 nanometers',30+25*s,H-54,{s:15,w:700,a:'center',c:C.ink});txt(ctx,'Amylase, the sugars and the sweet sensor are drawn to one scale.',30,H-16,{s:15,c:C.soft});}

/* ---------------- the tube: six enzymes in saliva ---------------- */
const EPOS=[[150,160],[410,140],[670,170],[160,400],[420,420],[680,390]],TSC=1.2,TS=SP*TSC;   // in the tube: 2.2 pixels per ångström
function newTube(o){const s=Object.assign({T:37,pH:7,loc:0,t:0,n:0,cuts:[],malt:[],hill:newHill(),hp:[],pep:false,pcuts:0},o);
  s.enz=EPOS.map((p,i)=>({x:p[0],y:p[1],dead:false,u:0,acc:hash(i+2)*.9,n:10+2*(i%3),slide:0,enter:0,flash:0,rot:(hash(i)-.5)*.5,ph:hash(i*3)*6.28}));
  s.pepz=[[300,285],[560,285]].map((p,i)=>({x:p[0],y:p[1],acc:hash(i+9),flash:0,n:8,slide:0}));return s;}
function fresh(s){for(const e of s.enz){e.dead=false;e.u=(1-ff(s.T))*.5;e.acc=Math.random();e.n=10+2*Math.floor(Math.random()*3);}s.n=0;s.cuts=[];s.malt=[];}
function stepTube(s,dt){s.t+=dt;const T=s.T,fp=fph(s.pH,6.8),rev=1-ff(T);
  for(const e of s.enz){if(!e.dead&&Math.random()<hazard(T)*dt)e.dead=true;const tu=e.dead?1:rev*.5;e.u+=(tu-e.u)*Math.min(1,dt*(e.dead?3:2.2));
    e.flash=Math.max(0,e.flash-dt*2.4);e.slide=Math.max(0,e.slide-dt*2.6);e.enter=Math.max(0,e.enter-dt*1.2);
    const rate=e.dead?0:K37*kick(T)*(1-rev)*fp;e.rate=rate;e.acc+=rate*dt*(.75+.5*Math.random());
    if(e.acc>=1&&e.enter<=0){e.acc-=1;e.flash=1;e.slide=1;e.n-=2;s.n++;s.cuts.push(s.t);hillKick(s.hill,true);
      s.malt.push({x:e.x+TS*1.5,y:e.y+4,vx:26+Math.random()*30,vy:(Math.random()-.5)*46,a:0});if(e.n<4){e.n=10+2*Math.floor(Math.random()*3);e.enter=1;}}}
  const tot=s.enz.reduce((a,e)=>a+(e.rate||0),0);s.rateNow=s.rateNow==null?tot:s.rateNow+(tot-s.rateNow)*Math.min(1,dt*3);
  if(Math.random()<dt*(1.2+kick(T)*2.2))hillKick(s.hill,false);stepHill(s.hill,dt);
  for(const m of s.malt){m.a+=dt;m.x+=m.vx*dt;m.y+=m.vy*dt;m.vx*=.992;}s.malt=s.malt.filter(m=>m.a<5&&m.x<790);
  if(s.pep){const pr=K37*.9*fph(s.pH,2);for(const e of s.pepz){e.flash=Math.max(0,e.flash-dt*2.4);e.slide=Math.max(0,e.slide-dt*2.6);e.acc+=pr*dt;if(e.acc>=1){e.acc-=1;e.flash=1;e.slide=1;s.pcuts++;e.n-=1;if(e.n<4)e.n=8;}}}
  // free H+ ions: ten times more for each pH unit down (drawn as a few dots near 7, a crowd near 2)
  const want=Math.round(clamp(2+ (7-s.pH)*9,2,48));while(s.hp.length<want)s.hp.push({x:Math.random()*790,y:Math.random()*540,vx:0,vy:0});if(s.hp.length>want)s.hp.length=want;
  for(const h of s.hp){h.vx+=(Math.random()-.5)*700*dt;h.vy+=(Math.random()-.5)*700*dt;h.vx*=.93;h.vy*=.93;h.x=clamp(h.x+h.vx*dt,8,790);h.y=clamp(h.y+h.vy*dt,8,548);}}
const tubeRate=s=>s.rateNow||0;   // the rate the cuts are happening at right now (the counts on screen are the literal events)
const folded=s=>Math.round(s.enz.reduce((a,e)=>a+(e.dead?0:ff(s.T)),0)), allDead=s=>s.enz.every(e=>e.dead), working=s=>s.enz.reduce((a,e)=>a+(e.dead?0:ff(s.T)),0)/NE*(fph(s.pH,6.8)>.3?1:fph(s.pH,6.8)/.3);
function drawTube(ctx,s,o){o=o||{};const T=s.T,wide=o.wide?W:800,jig=clamp(.25+T/60,.2,1.9),t=s.t;
  const warm=clamp((T-37)/50,0,1),cold=clamp((25-T)/25,0,1);ctx.fillStyle=C.sol;ctx.fillRect(0,0,wide,H);
  if(warm>0){ctx.fillStyle='rgba(235,110,60,'+(.16*warm)+')';ctx.fillRect(0,0,wide,H);}if(cold>0){ctx.fillStyle='rgba(120,170,235,'+(.2*cold)+')';ctx.fillRect(0,0,wide,H);}
  // loose starch chains drifting in the saliva
  const nf=o.wide?9:5;for(let k=0;k<nf;k++){const bx=((hash(k+40)*wide+t*(6+k*2)*jig)%(wide+200))-100,by=(o.wide?40:60)+hash(k+50)*480,pts=[];for(let j=0;j<11+k%5;j++)pts.push([bx-j*TS+Math.sin(t*jig+j*.8+k)*2,by+Math.sin(j*.7+t*jig*1.3+k*2)*8]);ctx.globalAlpha=.62;sugars(ctx,pts,HR*TSC);ctx.globalAlpha=1;}
  const es=o.wide?s.enz.concat([{x:930,y:150,u:0,n:12,slide:0,flash:0,enter:0,rot:.2,ph:1},{x:960,y:410,u:0,n:10,slide:0,flash:0,enter:0,rot:-.2,ph:2}]):s.enz;
  for(const e of es){const jx=Math.sin(t*jig*7+e.ph)*1.6*jig,jy=Math.cos(t*jig*6.3+e.ph*2)*1.6*jig,ex=e.x+jx,ey=e.y+jy,cap=s.pH<4.5;
    enzyme(ctx,ex,ey,TSC,{u:e.u,dead:e.dead,wob:t*2+e.ph,charges:o.charges,capped:cap});
    if(!e.dead&&ff(T)>.12&&!cap){const pts=[],sh=e.slide*TS*2-e.enter*150;for(let j=0;j<e.n;j++){const x=TS*1.5-j*TS-sh;if(x<-150)break;const inside=Math.abs(x)<HALF*TSC;pts.push([ex+x,ey+(inside?groove(x,TSC):groove(-HALF*TSC,TSC)+Math.sin(x*.05+t*jig*1.5)*7)]);}
      ctx.globalAlpha=1-e.enter*.6;sugars(ctx,pts,HR*TSC);ctx.globalAlpha=1;}
    if(e.flash>0){ctx.globalAlpha=e.flash;ring(ctx,ex,ey,24*(1.5-e.flash*.5),0,C.gold);ctx.globalAlpha=1;}
    if(o.tagNew&&!e.dead)pill(ctx,'new amylase',ex,ey+88,{bg:'#fff',c:C.good,bd:C.good,s:13.5,w:700});}
  if(s.pep)for(const e of s.pepz){const on=fph(s.pH,2)>.3;ctx.globalAlpha=on?1:.45;enzyme(ctx,e.x,e.y,1,{col:C.pep,u:0});if(on)protein(ctx,e.x+30-e.slide*12,e.y,.62,e.n);ctx.globalAlpha=1;
    if(e.flash>0){ctx.globalAlpha=e.flash;ring(ctx,e.x,e.y,20*(1.5-e.flash*.5),0,C.gold);ctx.globalAlpha=1;}pill(ctx,on?'pepsin: cutting protein':'pepsin: switched off',e.x,e.y+78,{bg:'#fff',c:shade(C.pep,-.3),bd:C.pep,s:13.5,w:700});}
  for(const m of s.malt){ctx.globalAlpha=m.a<.2?m.a/.2:m.a>4?5-m.a:1;sugars(ctx,[[m.x-TS/2,m.y],[m.x+TS/2,m.y]],HR*TSC,{halo:true});ctx.globalAlpha=1;}
  if(o.hplus)for(const h of s.hp){dot(ctx,h.x,h.y,5,C.h,'#fff',1.3);txt(ctx,'+',h.x,h.y+3.6,{s:9.5,w:700,a:'center',c:'#fff'});}
  if(o.strip!==false){ // temperature strip with everyday landmarks
    const y=556,x0=40,x1=760,X=v=>lerp(x0,x1,v/100);ctx.fillStyle='rgba(255,255,255,.92)';ctx.fillRect(0,y-14,800,H-y+14);const g=ctx.createLinearGradient(x0,0,x1,0);g.addColorStop(0,'#5b9ee6');g.addColorStop(.37,'#7bc47f');g.addColorStop(.6,'#f0a23a');g.addColorStop(1,'#d5402b');
    rr(ctx,x0,y,x1-x0,10,5);ctx.fillStyle=g;ctx.fill();for(const [v,l] of [[4,'ice water'],[20,'room'],[37,'your mouth'],[70,'hot coffee'],[100,'boiling']]){ctx.fillStyle=C.ink;ctx.fillRect(X(v)-1,y-3,2,16);txt(ctx,l,X(v),y+30,{s:13.5,a:v===100?'right':v===4?'left':'center',c:C.soft,w:600});}
    const mx=X(T);ctx.beginPath();ctx.moveTo(mx,y-2);ctx.lineTo(mx-9,y-16);ctx.lineTo(mx+9,y-16);ctx.closePath();ctx.fillStyle=C.rj;ctx.fill();}
}
function side(ctx,s,o){o=o||{};const x=812,w=380; // the right-hand instruments
  drawHill(ctx,x,10,w,330,{hill:s.hill,enz:working(s),t:s.t,jig:clamp(s.T/60,0,1.6),title:'Each cut = one bond over the hill'});
  rr(ctx,x,350,w,240,12);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#d8d8d3';ctx.stroke();
  const r=tubeRate(s);txt(ctx,'Cuts per second',x+16,382,{s:17,w:700});txt(ctx,r.toFixed(1),x+w-16,386,{s:28,w:700,a:'right',c:r<.15?C.rj:C.good});
  rr(ctx,x+16,398,w-32,18,9);ctx.fillStyle='#ecebe6';ctx.fill();rr(ctx,x+16,398,Math.max(4,(w-32)*clamp(r/6,0,1)),18,9);ctx.fillStyle=r<.15?C.rj:C.good;ctx.fill();
  const nx=x+16+(w-32)*(NE*K37*ff(37)/6);ctx.fillStyle=C.ink;ctx.fillRect(nx-1,392,2,30);txt(ctx,'normal, at 37 °C',nx,438,{s:14,a:'center',c:C.soft});
  txt(ctx,'Enzymes in',x+16,474,{s:17,w:700});txt(ctx,'working shape',x+16,494,{s:17,w:700});const f=folded(s);
  for(let i=0;i<NE;i++){const e=s.enz[i];ctx.save();ctx.translate(x+168+i*21,482);ctx.scale(.16,.16);enzyme(ctx,0,0,1,{u:e.u,dead:e.dead});ctx.restore();}
  txt(ctx,f+' of '+NE,x+w-16,492,{s:22,w:700,a:'right',c:f<NE?C.rj:C.good});
  txt(ctx,'Sugar made so far',x+16,542,{s:17,w:700});txt(ctx,String(s.n),x+w-16,546,{s:26,w:700,a:'right',c:shade(C.prod,-.2)});
  txt(ctx,'Slowed down a lot: the real thing is hundreds a second.',x+16,574,{s:13,c:C.soft});
}

/* ---------------- chapter 1 and the zoom ---------------- */
function cracker(ctx,cx,cy,sz){const x=cx-sz/2,y=cy-sz/2,n=8,st=sz/n;ctx.beginPath();ctx.moveTo(x,y);
  for(let i=0;i<n;i++)ctx.quadraticCurveTo(x+st*(i+.5),y-st*.28,x+st*(i+1),y);for(let i=0;i<n;i++)ctx.quadraticCurveTo(x+sz+st*.28,y+st*(i+.5),x+sz,y+st*(i+1));
  for(let i=0;i<n;i++)ctx.quadraticCurveTo(x+sz-st*(i+.5),y+sz+st*.28,x+sz-st*(i+1),y+sz);for(let i=0;i<n;i++)ctx.quadraticCurveTo(x-st*.28,y+sz-st*(i+.5),x,y+sz-st*(i+1));ctx.closePath();
  const g=ctx.createLinearGradient(x,y,x+sz,y+sz);g.addColorStop(0,'#f3deb0');g.addColorStop(1,'#e2c285');ctx.fillStyle=g;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#b8935a';ctx.stroke();
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)dot(ctx,x+sz*(.22+i*.28),y+sz*(.22+j*.28),sz*.022,'#b8935a');
  for(let k=0;k<26;k++){ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(x+sz*(.08+hash(k)*.84),y+sz*(.08+hash(k+30)*.84),sz*.014,sz*.014);}}
function drawCracker(ctx,S,hook){ctx.fillStyle='#f4efe6';ctx.fillRect(0,0,W,H);ctx.fillStyle='#e7dfd0';ctx.fillRect(0,470,W,130);
  ctx.save();ctx.translate(360,300);ctx.rotate(-.08);cracker(ctx,0,0,300);ctx.restore();
  if(hook){const p=(S.t%9)/7,q=clamp(p,0,1),cx=860,cy=200;
    ctx.lineWidth=16;ctx.strokeStyle='#e3ddd0';ctx.beginPath();ctx.arc(cx,cy,74,0,6.2832);ctx.stroke();ctx.strokeStyle=C.rj;ctx.lineCap='round';ctx.beginPath();ctx.arc(cx,cy,74,-Math.PI/2,-Math.PI/2+6.2832*q);ctx.stroke();
    txt(ctx,Math.round(q*60)+' s',cx,cy+4,{s:36,w:700,a:'center'});txt(ctx,'of chewing',cx,cy+28,{s:16,a:'center',c:C.soft});
    txt(ctx,'What you taste',700,366,{s:17,w:700});const g=ctx.createLinearGradient(700,0,1040,0);g.addColorStop(0,'#d9d4c8');g.addColorStop(1,C.prod);rr(ctx,700,380,340,20,10);ctx.fillStyle=g;ctx.fill();
    txt(ctx,'plain',700,424,{s:16,c:C.soft});txt(ctx,'sweet',1040,424,{s:16,c:shade(C.prod,-.25),a:'right',w:700});
    const mx=700+340*ease(clamp((q-.25)/.75,0,1));dot(ctx,mx,390,14,'#fff',C.ink,3);
    pill(ctx,'One plain cracker. It is mostly starch, not sugar.',360,520,{bg:'#fff',c:C.ink,bd:C.ink,s:17,w:700,r:9});}}
function drawGranules(ctx,t){ctx.fillStyle='#dcecf5';ctx.fillRect(0,0,W,H);
  for(let k=0;k<26;k++){const x=60+hash(k)*1080,y=50+hash(k+7)*500,rx=44+hash(k+3)*52,ry=rx*(.62+hash(k+5)*.3);ctx.save();ctx.translate(x,y);ctx.rotate(hash(k+9)*3);
    const g=ctx.createRadialGradient(-rx*.3,-ry*.3,4,0,0,rx);g.addColorStop(0,'#fffaf0');g.addColorStop(1,'#e9dcc0');ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,6.2832);ctx.fillStyle=g;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#bfae88';ctx.stroke();
    ctx.strokeStyle='rgba(160,140,100,.35)';ctx.lineWidth=1.5;for(let j=1;j<4;j++){ctx.beginPath();ctx.ellipse(-rx*.12,-ry*.1,rx*j/4.4,ry*j/4.4,0,0,6.2832);ctx.stroke();}ctx.restore();}
  pill(ctx,'starch grains from the cracker, soaking in saliva',300,40,{bg:'#fff',c:C.ink,bd:C.ink,s:16});pill(ctx,'each grain is millions of starch chains packed in layers',600,500,{bg:'#fff',c:'#6d5a2c',bd:'#bfae88',s:16});}
const ZB=[{x:330,y:270,w:70},{x:566,y:262,w:64}],ZW=[.2,2e-4,7e-8];
function drawZoom(ctx,S,z){const lv=[(c)=>drawCracker(c,S,false),(c)=>drawGranules(c,S.t),(c)=>{drawTube(c,S.tube,{wide:true,strip:false});}];
  const k=Math.min(1,Math.floor(z)),f=z>=2?1:z-k,b=ZB[k],bh=b.w*H/W,w=W*Math.pow(b.w/W,f),r=(w-b.w)/(W-b.w),cx=b.x+b.w/2+(W/2-b.x-b.w/2)*r,cy=b.y+bh/2+(H/2-b.y-bh/2)*r,s=W/w;
  const L=(i)=>{ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();lv[i](ctx);ctx.restore();};
  ctx.save();ctx.translate(W/2,H/2);ctx.scale(s,s);ctx.translate(-cx,-cy);L(k);const a=ease((f-.3)/.5);
  if(a>0){ctx.save();ctx.translate(b.x,b.y);ctx.scale(b.w/W,b.w/W);ctx.globalAlpha=a;L(k+1);ctx.restore();}
  ctx.globalAlpha=1-ease((f-.05)/.4);ctx.lineWidth=3/s;ctx.strokeStyle=C.rj;ctx.strokeRect(b.x,b.y,b.w,bh);ctx.restore();ctx.globalAlpha=1;
  const near=z>=2?2:(f<.1?k:f>.9?k+1:-1);
  if(near>=0){const wd=ZW[near],u=wd>=.01?[wd*100,'centimeters']:wd>=1e-5?[wd*1e6,'micrometers']:[wd*1e9,'nanometers'];
    pill(ctx,'This picture is about '+Math.round(u[0])+' '+u[1]+' wide',W-16,H-24,{a:'right',bg:'#fff',c:C.ink,bd:C.ink,s:16,w:700,r:8});
    const mag=ZW[0]/wd;if(mag>1.5)pill(ctx,'Zoomed in about '+(mag>=1e6?Math.round(mag/1e6)+' million':Math.round(mag))+' times',16,H-24,{a:'left',bg:C.ink,c:'#fff',bd:null,s:16,w:700,r:8});
    if(near===2){pill(ctx,'amylase: an enzyme in your saliva',300,262,{bg:'#fff',c:C.good,bd:C.good,s:16,w:700});pill(ctx,'starch: a long chain of sugar units',560,60,{bg:'#fff',c:shade(C.sub,-.3),bd:C.sub,s:16,w:700});}}
  else pill(ctx,'zooming in…',W-16,H-24,{a:'right',bg:'#fff',c:C.soft,bd:'#a9afb8',s:16,w:600,r:8});}

/* ---------------- graph and pH panels ---------------- */
function graph(ctx,S){const x=812,y=10,w=380,h=580,L=x+56,R=x+w-18,T=y+58,B=y+h-70,X=v=>lerp(L,R,v/100),Y=v=>lerp(B,T,v/6);const pts=S.v.pts||[];
  rr(ctx,x,y,w,h,12);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#d8d8d3';ctx.stroke();
  txt(ctx,'Your graph: rate vs temperature',x+14,y+26,{s:16,w:700});
  ctx.strokeStyle='#e7e7e2';ctx.lineWidth=1;ctx.beginPath();for(let v=0;v<=6;v+=1){ctx.moveTo(L,Y(v));ctx.lineTo(R,Y(v));}for(let v=0;v<=100;v+=20){ctx.moveTo(X(v),T);ctx.lineTo(X(v),B);}ctx.stroke();
  ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(L,T);ctx.lineTo(L,B);ctx.lineTo(R,B);ctx.stroke();
  for(let v=0;v<=6;v+=2)txt(ctx,String(v),L-8,Y(v)+5,{s:13.5,a:'right',c:C.soft});for(let v=0;v<=100;v+=20)txt(ctx,String(v),X(v),B+19,{s:13.5,a:'center',c:C.soft});
  txt(ctx,'Temperature (°C)',(L+R)/2,B+42,{s:14.5,a:'center',w:600});ctx.save();ctx.translate(x+18,(T+B)/2);ctx.rotate(-Math.PI/2);txt(ctx,'Cuts per second',0,0,{s:14.5,a:'center',w:600});ctx.restore();
  const done=!!S.v.doneT,k=done?ease((S.t-S.v.doneT)/1.6):0;
  if(done){ctx.save();ctx.beginPath();ctx.rect(L,T-6,(R-L)*k,B-T+8);ctx.clip();
    if(S.v.causes){ctx.setLineDash([6,5]);ctx.lineWidth=2.5;ctx.strokeStyle=C.rj;ctx.beginPath();for(let v=0;v<=100;v++){const yv=Math.min(9,NE*K37*kick(v)*.943);ctx[v?'lineTo':'moveTo'](X(v),Y(yv));}ctx.stroke();
      ctx.strokeStyle=C.sub;ctx.beginPath();for(let v=0;v<=100;v++){const h=hazard(v),al=h<1e-6?1:(1-Math.exp(-3*h))/(3*h);ctx[v?'lineTo':'moveTo'](X(v),Y(5.6*ff(v)*al));}ctx.stroke();ctx.setLineDash([]);}
    ctx.lineWidth=4;ctx.strokeStyle=C.good;ctx.lineJoin='round';ctx.beginPath();for(let v=0;v<=100;v+=.5)ctx[v?'lineTo':'moveTo'](X(v),Y(expected(v)));ctx.stroke();ctx.restore();
    if(k>=1){const ox=X(40),oy=Y(expected(40));pill(ctx,'optimum',ox,oy-20,{bg:C.good,c:'#fff',bd:null,s:14,w:700});
      if(S.v.causes){const lx=X(50),ly=Y(5.2);[[C.rj,'harder kicks:','speeds it up'],[C.sub,'still folded:','holds it together']].forEach((r,i)=>{const yy=ly+i*52;ctx.setLineDash([6,5]);ctx.strokeStyle=r[0];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(lx,yy-5);ctx.lineTo(lx+28,yy-5);ctx.stroke();ctx.setLineDash([]);txt(ctx,r[1],lx+34,yy,{s:14,w:700,c:shade(r[0],-.2)});txt(ctx,r[2],lx+34,yy+17,{s:13.5,c:C.soft});});
        txt(ctx,'Multiply the two:',lx,ly+108,{s:13.5,c:C.ink});txt(ctx,'that is the green curve.',lx,ly+125,{s:13.5,c:C.ink});}}}
  for(const p of pts){dot(ctx,X(p.T),Y(Math.min(6.3,p.r)),7.5,C.gold,C.ink,2);}
  if(S.v.meas){const m=S.v.meas;ring(ctx,X(m.T),Y(Math.min(6.3,m.n/Math.max(.3,m.t))),10,S.t,C.rj);txt(ctx,'counting… '+m.n+' cuts in '+m.t.toFixed(1)+' s',x+14,y+46,{s:14,c:C.rj,w:700});}
  else txt(ctx,pts.length+' of 5 points'+(done?'. The curve is the model’s prediction.':''),x+14,y+46,{s:13.5,c:C.soft});
  if(pts.length<5){const need=[];if(!pts.some(p=>p.T<20))need.push('one below 20 °C');if(!pts.some(p=>p.T>60))need.push('one above 60 °C');if(need.length)txt(ctx,'Still needed: '+need.join(', '),x+14,y+h-14,{s:13.5,c:C.soft});}}
function phPanel(ctx,s){const x=812,y=10,w=380;rr(ctx,x,y,w,580,12);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#d8d8d3';ctx.stroke();
  txt(ctx,'Where is the cracker?',x+14,y+26,{s:16,w:700});const stops=[['Mouth','pH 7'],['Stomach','pH 2'],['Small intestine','pH 7']];
  ctx.strokeStyle='#c9c9c4';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x+60,y+74);ctx.lineTo(x+w-60,y+74);ctx.stroke();
  stops.forEach((st,i)=>{const cx=x+60+i*(w-120)/2,on=s.loc===i;dot(ctx,cx,y+74,on?19:13,on?C.rj:'#fff',on?C.rj:'#9a9aa0',3);if(on){ctx.save();ctx.translate(cx,y+74);cracker(ctx,0,0,20);ctx.restore();}
    txt(ctx,st[0],cx,y+116,{s:14.5,w:700,a:'center',c:on?C.rj:C.ink});txt(ctx,st[1],cx,y+134,{s:14,a:'center',c:C.soft});});
  const L=x+52,R=x+w-18,T=y+214,B=y+440,X=v=>lerp(L,R,v/10),Y=v=>lerp(B,T,v);
  txt(ctx,'How well each enzyme works',x+14,y+184,{s:16,w:700});
  ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(L,T);ctx.lineTo(L,B);ctx.lineTo(R,B);ctx.stroke();for(let v=0;v<=10;v+=2)txt(ctx,String(v),X(v),B+19,{s:13.5,a:'center',c:C.soft});
  txt(ctx,'more acid',L,B+42,{s:13.5,c:C.h,w:600});txt(ctx,'pH',(L+R)/2,B+42,{s:14.5,a:'center',w:600});txt(ctx,'less acid',R,B+42,{s:13.5,c:C.soft,a:'right',w:600});
  ctx.save();ctx.translate(x+20,(T+B)/2);ctx.rotate(-Math.PI/2);txt(ctx,'Rate',0,0,{s:14.5,a:'center',w:600});ctx.restore();
  for(const [opt,col,name,nx] of [[6.8,C.enz,'amylase',6.8],[2,C.pep,'pepsin',2.3]]){ctx.lineWidth=4;ctx.strokeStyle=col;ctx.beginPath();for(let v=0;v<=10;v+=.1)ctx[v?'lineTo':'moveTo'](X(v),Y(fph(v,opt)*.92));ctx.stroke();txt(ctx,name,X(nx),T-8,{s:14.5,w:700,a:'center',c:shade(col,-.25)});}
  const px=X(s.pHshow);ctx.strokeStyle=C.rj;ctx.lineWidth=3;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(px,T-4);ctx.lineTo(px,B);ctx.stroke();ctx.setLineDash([]);
  dot(ctx,px,Y(fph(s.pHshow,6.8)*.92),8,C.enz,C.ink,2);dot(ctx,px,Y(fph(s.pHshow,2)*.92),8,C.pep,C.ink,2);
  const r=tubeRate(s);txt(ctx,'Starch cuts per second',x+16,y+506,{s:15.5,w:700});txt(ctx,r.toFixed(1),x+w-16,y+510,{s:24,w:700,a:'right',c:r<.15?C.rj:C.good});
  txt(ctx,'Sugar made so far',x+16,y+548,{s:15.5,w:700});txt(ctx,String(s.n),x+w-16,y+552,{s:24,w:700,a:'right',c:shade(C.prod,-.2)});}

/* ---------------- tell-it-back frames ---------------- */
const fr=(fn)=>(ctx)=>{ctx.save();ctx.beginPath();ctx.rect(0,0,300,193.3);ctx.clip();ctx.fillStyle=C.sol;ctx.fillRect(0,0,300,194);fn(ctx);ctx.restore();};
const row=(x0,y,n,sp)=>{const a=[];for(let i=0;i<n;i++)a.push([x0+i*sp,y+Math.sin(i*.9)*5]);return a;};
const MS={x:246,y:148,px:246-17.4,py:148-101.2};
function miniSensor(ctx){const M=Story.mol,m=M.DATA.SWT;ctx.fillStyle='#fbeeea';ctx.fillRect(176,MS.y+m.mem[1],124,60);ctx.fillStyle='#f0deb4';ctx.fillRect(176,MS.y+m.mem[0],124,m.mem[1]-m.mem[0]);M.draw(ctx,'SWT',MS.x,MS.y,1);
  txt(ctx,'sweet',150,118,{s:13,w:700,a:'center',c:'#7a2f42'});txt(ctx,'sensor',150,133,{s:13,w:700,a:'center',c:'#7a2f42'});}
const FRAMES=[
 {label:'A starch chain is too long to fit your sweet sensors',draw:fr(ctx=>{miniSensor(ctx);sugars(ctx,row(14,MS.py,13,14),6);txt(ctx,'✗',204,MS.py+34,{s:30,w:700,c:C.rj,a:'center'});})},
 {label:'The chain slides into amylase’s groove (the active site)',draw:fr(ctx=>{enzyme(ctx,160,100,1.45,{});const p=[];for(let j=0;j<14;j++){const x=SP*1.45*(1.5-j);p.push([160+x,100+(Math.abs(x)<HALF*1.45?groove(x,1.45):groove(-HALF*1.45,1.45))]);}sugars(ctx,p,HR*1.45);})},
 {label:'The groove strains the bond, so an ordinary kick breaks it',draw:fr(ctx=>{ctx.fillStyle='#fbfaf6';ctx.fillRect(0,0,300,194);const X=f=>20+f*260,Y=e=>170-e*150;for(const [hb,col,dash] of [[HB_NO,'#8a8f98',[6,5]],[HB_ENZ,C.enz,[]]]){ctx.setLineDash(dash);ctx.lineWidth=dash.length?2.5:4.5;ctx.strokeStyle=col;ctx.beginPath();for(let i=0;i<=50;i++)ctx[i?'lineTo':'moveTo'](X(i/50),Y(hillY(i/50,hb)));ctx.stroke();}ctx.setLineDash([]);
   dot(ctx,X(.45),Y(hillY(.45,HB_ENZ))-9,9,C.sub,C.ink,1.5);ring(ctx,X(.45),Y(hillY(.45,HB_ENZ))-9,14,1,C.gold);txt(ctx,'lower hill',X(.62),Y(.5),{s:14,w:700,c:C.enz});})},
 {label:'Small sugars (maltose) float off and fit: it tastes sweet',draw:fr(ctx=>{miniSensor(ctx);sugars(ctx,[[MS.px-6,MS.py],[MS.px+6,MS.py]],6,{halo:true});sugars(ctx,[[50,60],[62,60]],6,{halo:true});sugars(ctx,[[96,160],[108,160]],6,{halo:true});pill(ctx,'sweet!',150,MS.py,{bg:C.prod,c:'#fff',bd:null,s:16,w:700});})},
 {label:'Swallowed: stomach acid changes the groove, and amylase stops',draw:fr(ctx=>{enzyme(ctx,150,104,1.3,{charges:true,capped:true});for(let k=0;k<16;k++){const x=20+hash(k+1)*260,y=14+hash(k+8)*166;dot(ctx,x,y,5,C.h,'#fff',1.2);}sugars(ctx,row(150,36,7,17),8);pill(ctx,'stomach: pH 2',70,172,{bg:'#fff',c:C.h,bd:C.h,s:13.5,w:700});})},
 {label:'In the small intestine, new amylase finishes the job',draw:fr(ctx=>{enzyme(ctx,140,96,1.3,{charges:true});const p=[];for(let j=0;j<12;j++){const x=SP*1.3*(1.5-j);p.push([140+x,96+(Math.abs(x)<HALF*1.3?groove(x,1.3):groove(-HALF*1.3,1.3))]);}sugars(ctx,p,HR*1.3);sugars(ctx,[[236,60],[254,60]],8,{halo:true});sugars(ctx,[[250,120],[268,120]],8,{halo:true});pill(ctx,'small intestine: pH 7',96,172,{bg:'#fff',c:C.good,bd:C.good,s:13.5,w:700});})}
];

/* ---------------- chapters ---------------- */
const PICK=['The cracker has hidden sugar that slowly dissolves','Something in your saliva cuts the starch into sugar','Your tongue just gets used to the salt','Chewing warms the cracker and melts it'];
let zAnim=null,tryMol=null;
const tempUI=(stops)=>({type:'range',key:'T',min:0,max:100,step:1,val:37,label:'Temperature',fmt:v=>v+' °C',stops,on(S,v){S.tube.T=v;}});
function tubeScene(ctx,S,o){drawTube(ctx,S.tube,o);if(!(o&&o.noSide))side(ctx,S.tube,o);}

Story.start({
  id:'enzymes',title:'Why does a cracker turn sweet?',W,H,views:true,labHref:'../index.html#enzymes',
  about:'<p><b>Two ways to see it.</b> <b>Real shape</b> shows each protein as it was measured. <b>Simple drawing</b> shows the same outline smoothed and filled flat, the way a textbook or a test draws it, with the groove and the pocket marked. Nothing else changes when you switch.</p><p><b>The shapes are real.</b> Amylase and pepsin are drawn from the measured positions of their atoms in the human proteins (Protein Data Bank entries 1SMD and 1PSN, found by X-ray crystallography). The sweet sensor is the human sweet taste receptor (entry 9UTB): two proteins paired up, standing in the skin of a taste cell. Scientists first measured its shape in 2025, by cryo-electron microscopy. You are looking straight into amylase’s active site. The three small dots at the cutting spot are the three acid groups that do the cutting, in their measured places. The starch chain is to the same scale as the enzyme: its sugar units are 0.48 nanometers apart, and amylase is about 6 nanometers across. The sweet sensor is to that scale too: about 17 nanometers tall.</p><p><b>What is simplified.</b> Colors are labels: molecules are too small to have a color, and the orange glow just marks sugars that have been cut free. Real salivary amylase also cuts in the middle of a chain, leaving a mix of small sugars that is mostly maltose; here it always snips two units off the end so you can follow it. An unfolded enzyme is shown as a loose wavy string, which is the idea, not a measurement. The fat and the protein chain are simple drawings. The sensor’s pocket is inside its top, which closes around a sugar like a Venus flytrap; the sugar is drawn on top so you can see it. In the measurement the pocket holds sucralose, a sweetener the size of maltose. Sugars are thought to use the same pocket, but that has not been measured with maltose. The two colors only mark the two proteins of the pair. Everything is slowed down a lot: a real amylase makes hundreds of cuts a second, and on its own a starch bond would last for millions of years.</p><p><b>The numbers.</b> The rates use the same model as the full BioLab enzyme tool: twice as fast for every 10 °C, unfolding near 44 °C, permanent heat damage above about 55 °C, and a bell-shaped pH curve (best near pH 6.8 for amylase and pH 2 for pepsin). Real enzymes have messier curves. The energy hill is a picture of activation energy, not a measurement.</p>',
  tell:{frames:FRAMES,terms:['enzyme|amylase','substrate|starch','active site|groove','activation energy|energy hill','product|maltose|sugar','denature','pH|acid','optimum|best temperature'],
    nudge:'For each picture ask: what had to happen just before this could happen?',
    done:'<b>That is the story.</b> Now tell it in your own words.',
    prompt:'Why does a cracker turn sweet in your mouth, but not if you dunk it in hot coffee first? Tell the story. Use “because” and “so”.',placeholder:'The cracker is mostly starch, which… because… so…'},
  chapters:[
  {rail:'The question',title:'The cracker that turns sweet',
   predict:{key:'why',q:'Chew a plain cracker for a full minute without swallowing. It starts to taste sweet. Why?',opts:PICK,right:1,after:'<b>Locked in.</b> You can test it for real at lunch.'},
   text:'<p class="why">Take your best guess. The answer is in step 4.</p>',
   enter(S){S.tube=newTube();},draw(ctx,S){drawCracker(ctx,S,true);}},

  {rail:'Zoom in',title:'Go to where it happens',live:true,
   text(S){const z=S.v.z||0;return z<.5?'A cracker is mostly <b class="term">starch</b>. Whatever is making it sweet is too small to see. <b>Zoom in</b> to the wet surface of the cracker.':
     z<1.5?'Starch is stored in tiny grains. Each grain is millions of long chains packed together. Your saliva is soaking into them.':
     'Now you can see single molecules. The blue chains are starch: sugar units linked end to end. The green shapes are <b class="term">amylase</b>, a protein in your saliva, drawn from its measured structure.';},
   ui:[{type:'button',label:'Zoom in',pulse:true,act(S){const a=S.v.z,b=Math.min(2,Math.floor(a+.02)+1);zAnim={a,b,t:0};},show:S=>S.v.z<1.98},
       {type:'range',key:'z',min:0,max:2,step:.01,val:0,label:'Zoom',fmt:v=>['The cracker','Starch grains','Single molecules'][Math.round(v)],on(){zAnim=null;}}],
   todo:[{t:'Zoom all the way in',ok:S=>S.v.z>=1.97}],
   enter(S){S.tube=newTube();S.v.z=0;zAnim=null;},
   tick(S,dt){stepTube(S.tube,dt);if(zAnim){zAnim.t+=dt/2.3;S.v.z=lerp(zAnim.a,zAnim.b,ease(zAnim.t));if(zAnim.t>=1){S.v.z=zAnim.b;zAnim=null;}}},
   draw(ctx,S){drawZoom(ctx,S,S.v.z);}},

  window.Starch3D.chapter(C),

  {rail:'The cut',title:'One enzyme, one job',live:true,
   text(S){const p=S.picks.why,cu=S.cu;return cu.cuts<1?'On the left is amylase. Starch lies in a groove on its face. On the right is a sweet sensor on your tongue. Switch between <b>Simple drawing</b> and <b>Real shape</b> above the picture, then send in a starch chain.':
     'Each cut frees two sugar units: a small sugar called <b>maltose</b>. It fits the pocket of your sweet sensor, a <b class="term">receptor</b> protein on a taste cell. Starch is far too long. '+(p===1?'You called it. ':p==null?'':'So it was not “'+PICK[p].toLowerCase()+'”. ')+'The amylase is unchanged, ready to cut again.';},
   alt:'Amylase is a pair of scissors that only cuts one kind of string. The string is starch. The scissors do not wear out, so one amylase can cut again and again.',
   ui:[{type:'button',label:'Send in a starch chain',pulse:true,act(S){S.cu.auto=true;cuSend(S.cu);},show:S=>!S.cu.auto}],
   todo:[{t:'Send in a starch chain',ok:S=>S.cu.auto},{t:'Watch 4 cuts',ok:S=>S.cu.cuts>=4}],
   enter(S){S.cu=newCU({sensor:true,gap:.9,cx:390,cy:290,sc:1.73});},tick(S,dt){stepCU(S.cu,dt);},
   draw(ctx,S){const cu=S.cu;ctx.fillStyle=C.sol;ctx.fillRect(0,0,W,H);sensor(ctx,cu,S.t);drawCU(ctx,cu,{});
     pill(ctx,'amylase (an enzyme): '+(Story.view==='real'?'its real shape':'a simple drawing'),cu.cx,cu.cy+138,{bg:'#fff',c:C.good,bd:C.good,s:17,w:700});
     pill(ctx,'the cutting spot, in its active site',cu.cx,cu.cy-146,{bg:'#fff',c:C.ink,bd:C.ink,s:16});arrow(ctx,cu.cx,cu.cy-130,cu.cx,cu.cy-18,{c:C.ink,lw:2,head:10});
     if(cu.chain&&cu.chain.st!=='out')pill(ctx,'starch (the substrate)',30,cu.cy+60,{bg:'#fff',c:shade(C.sub,-.3),bd:C.sub,s:16,w:700,a:'left'});
     if(cu.cuts)pill(ctx,'maltose (the product)',640,cu.cy-70,{bg:'#fff',c:shade(C.prod,-.25),bd:C.prod,s:16,w:700});
     pill(ctx,'Cuts by this one enzyme: '+cu.cuts,30,40,{bg:'#fff',c:C.ink,bd:C.ink,s:18,w:700,a:'left',r:8,lw:2});
     if(cu.sweet)pill(ctx,'Sugars tasted: '+cu.sweet,30,82,{bg:'#fff',c:shade(C.prod,-.25),bd:C.prod,s:18,w:700,a:'left',r:8,lw:2});}},

  {rail:'The fit',title:'Only starch fits',live:true,
   text(S){const tr=S.v.tried||{};return Object.keys(tr).length<3?'Your saliva meets everything you eat. Offer the amylase a fat and a protein as well as starch, and see which one the groove accepts.':
     'Only the right shape settles into the groove, so each enzyme does one job. The molecule an enzyme works on is its <b class="term">substrate</b>. Your body makes other enzymes for fats and proteins.';},
   alt:'A key only opens the lock it was cut for. Starch is the key that fits amylase. Fat and protein are the wrong keys.',
   ui:[{type:'seg',key:'mol',val:null,label:'Offer the amylase…',opts:[{v:'starch',l:'Starch'},{v:'fat',l:'A fat'},{v:'protein',l:'A protein'}],on(S,v){tryMol={k:v,p:0,c0:S.cu.cuts};if(v==='starch'){S.cu.chain=null;cuSend(S.cu);}else S.cu.chain=null;}}],
   todo:[{t:'Try all three',ok:S=>S.v.tried&&Object.keys(S.v.tried).length>=3}],
   enter(S){S.cu=newCU({gap:.5,cx:520});S.v.tried={};S.v.mol=null;tryMol=null;},
   tick(S,dt){const cu=S.cu;stepCU(cu,dt);if(tryMol){tryMol.p+=dt/(tryMol.k==='starch'?4.2:2.8);
       if(tryMol.k==='starch'&&cu.chain&&cu.chain.st==='hold'&&cu.cuts<1+(tryMol.c0||0)){cuSnip(cu);}
       if(tryMol.p>=.55)S.v.tried[tryMol.k]=1;if(tryMol.p>=1&&tryMol.k!=='starch')tryMol=null;}},
   draw(ctx,S){const cu=S.cu;ctx.fillStyle=C.sol;ctx.fillRect(0,0,W,H);drawCU(ctx,cu,{});
     pill(ctx,'amylase',cu.cx,cu.cy+186,{bg:'#fff',c:C.good,bd:C.good,s:17,w:700});
     if(tryMol&&tryMol.k!=='starch'){const p=tryMol.p,ax=p<.4?ease(p/.4):p<.6?1-.05*Math.sin((p-.4)/.2*Math.PI*3):1-ease((p-.6)/.4)*1.2,x=lerp(-40,cu.cx-150,ax)+(p>.6?-(p-.6)*200:0),y=cu.cy+(p>.6?(p-.6)*-260:0);
       if(tryMol.k==='fat')fat(ctx,x,y,2.3);else protein(ctx,x,y,2.3,7);
       if(p>.36)pill(ctx,(tryMol.k==='fat'?'Fat':'Protein')+': wrong shape. It does not fit the groove.',cu.cx,90,{bg:'#fff',c:C.rj,bd:C.rj,s:18,w:700,r:9,lw:2});}
     if(tryMol&&tryMol.k==='starch'&&tryMol.p>.3)pill(ctx,'Starch: it fits, and gets cut.',cu.cx,90,{bg:'#fff',c:C.good,bd:C.good,s:18,w:700,r:9,lw:2});
     const tr=S.v.tried||{};['starch','fat','protein'].forEach((k,i)=>{pill(ctx,(tr[k]?(k==='starch'?'✓ ':'✗ '):'')+['Starch','Fat','Protein'][i]+(tr[k]?(k==='starch'?': fits':': does not fit'):''),30,470+i*40,{bg:tr[k]?(k==='starch'?'#e9f6ee':'#fdecea'):'#fff',c:C.ink,bd:tr[k]?(k==='starch'?C.good:C.rj):'#a9afb8',s:16,w:700,a:'left'});});}},

  {rail:'The hill',title:'Why you need the enzyme',live:true,
   text(S){return S.v.enz?'In the groove, the bond is bent and strained, so the hill is lower. Now an ordinary kick is enough, and bonds go over one after another. The start and the end have not changed. Only the path is easier.':
     'Breaking a bond takes a hard enough kick to get over an energy hill. That hill is the <b class="term">activation energy</b>. Molecules bump each other all the time, but almost never that hard. Watch for 5 seconds. Then add amylase.';},
   alt:'Think of pushing a boulder over a ridge to roll it down the far side. Amylase does not push the boulder. It cuts a pass through the ridge, so a much smaller push gets it over.',
   ui:[{type:'seg',key:'enz',val:0,label:'Is amylase there?',opts:[{v:0,l:'No enzyme'},{v:1,l:'With amylase'}],on(S,v){S.cu.auto=false;S.cu.chain=null;if(v){cuSend(S.cu);}S.v.enzT=S.t;}}],
   todo:[{t:'Watch with no enzyme for 5 seconds',ok:S=>!S.v.enz&&S.tau>5},{t:'Switch to “With amylase”',ok:S=>S.v.enz===1},{t:'Count 5 bonds going over the hill',ok:S=>S.v.enz===1&&S.hill.over>=5}],
   enter(S){S.cu=newCU({cx:290,cy:330,sc:2.05,gap:1e9});S.hill=newHill();S.v.enz=0;S.v.kt=0;},
   tick(S,dt){const cu=S.cu;stepCU(cu,dt);stepHill(S.hill,dt);S.v.kt+=dt;if(S.v.kt>.42){S.v.kt=0;const ok=S.v.enz&&cu.chain&&cu.chain.st==='hold'&&Math.random()<.5;hillKick(S.hill,!!ok);if(ok)cuSnip(cu);}
     if(S.v.enz&&!cu.chain){cu.wait+=dt;if(cu.wait>.4){cu.wait=0;cuSend(cu);}}},
   draw(ctx,S){const cu=S.cu,on=!!S.v.enz;ctx.fillStyle=C.sol;ctx.fillRect(0,0,W,H);
     if(on)drawCU(ctx,cu,{strain:true,strainLabel:true});
     else{const pts=[];for(let j=0;j<14;j++)pts.push([cu.cx+125-j*SP*cu.sc+Math.sin(S.t*2+j)*3,cu.cy+Math.sin(j*.8+S.t*1.7)*12]);sugars(ctx,pts,HR*cu.sc);
       pill(ctx,'a starch chain on its own',cu.cx,cu.cy-70,{bg:'#fff',c:shade(C.sub,-.3),bd:C.sub,s:16,w:700});pill(ctx,'On its own, one of these bonds would last millions of years.',cu.cx,cu.cy+90,{bg:'#fff',c:C.ink,bd:C.ink,s:15});}
     drawHill(ctx,590,24,596,552,{hill:S.hill,enz:on?1:0,t:S.t,jig:.6,label:true,title:'The energy hill: each dot is one bond'});
     pill(ctx,'Bonds over the hill: '+S.hill.over,1170,560,{bg:'#fff',c:on?C.good:C.rj,bd:on?C.good:C.rj,s:18,w:700,a:'right',r:8,lw:2});
     pill(ctx,'THE MOLECULES',16,26,{bg:C.ink,c:'#fff',bd:null,s:13.5,w:700,a:'left',r:5});}},

  {rail:'Cold',title:'Ice water: slower, not broken',live:true,patience:70,
   predict:{key:'cold',q:'You take a sip of ice water while you chew. What happens to the sweetness?',opts:['It arrives just as fast','It arrives more slowly, but it still comes','It never comes: cold breaks the enzyme'],right:1,reveal:S=>!!S.did['5:1']},
   text(S){if(S.picks.cold==null)return '';const s=S.tube;return S.did['5:1']?'Back to full speed. Cold only slowed the amylase: every one is still folded. This is why a fridge keeps food. It slows the enzymes that spoil it.':
     s.T<=12?'Colder molecules move slower and kick more gently, so fewer bonds get over the hill. But look: all six enzymes are still folded. Now <b>warm it back up</b>.':'<b>Test it.</b> Drag the temperature down to ice water and watch all three: the molecules, the hill and the count.';},
   ui:[tempUI([{v:4,l:'Ice water'},{v:37,l:'Your mouth'}])],
   todo:[{t:'Cool it to ice water (5 °C or lower)',ok:S=>S.tube.T<=5&&S.t-S.v.Tt>4},{t:'Warm it back to 37 °C and watch the rate return',ok:S=>S.tube.T>=35&&S.tube.T<=40&&tubeRate(S.tube)>3}],
   enter(S){S.tube=newTube();S.v.T=37;S.v.Tt=S.t;S.v.Tl=37;},tick(S,dt){if(S.v.T!==S.v.Tl){S.v.Tl=S.v.T;S.v.Tt=S.t;}stepTube(S.tube,dt);},
   draw(ctx,S){tubeScene(ctx,S);}},

  {rail:'Heat',title:'Hot coffee: broken for good',live:true,patience:70,
   predict:{key:'hot',q:'Now you dunk the cracker in hot coffee (70 °C), then let it cool back to mouth temperature. What happens?',opts:['It works faster, and stays fast','It stops, then recovers as it cools','It stops and never recovers'],right:2,reveal:S=>!!S.did['6:1']},
   text(S){if(S.picks.hot==null)return '';const s=S.tube;return S.did['6:1']?'Cooling did not bring it back. Heat shook the fold apart for good. No fold, no groove, so the hill is back to full height. The enzyme is <b class="term">denatured</b>, like an egg you cannot un-cook.':
     allDead(s)?'Every enzyme has come unfolded, and the groove is gone. Now <b>cool it back down</b> to 37 °C and see if the rate returns.':s.T>44?'Past about 45 °C the fold starts to shake loose, and the rate drops. Keep going to hot coffee.':'<b>Test it.</b> Drag the temperature up slowly. Warmer is faster at first. Keep going to hot coffee.';},
   alt:'A paper airplane flies because of how it is folded. Crumple it and smooth it out again, and you have the same sheet of paper, but it will not fly. Heat does that to an enzyme.',
   ui:[tempUI([{v:37,l:'Your mouth'},{v:70,l:'Hot coffee'}])],
   todo:[{t:'Heat it to hot coffee (70 °C)',ok:S=>S.tube.T>=68&&allDead(S.tube)},{t:'Cool it back to 37 °C and check the rate',ok:S=>S.tube.T>=33&&S.tube.T<=40&&S.t-S.v.Tt>3}],
   enter(S){S.tube=newTube();S.v.T=37;S.v.Tt=S.t;S.v.Tl=37;},tick(S,dt){if(S.v.T!==S.v.Tl){S.v.Tl=S.v.T;S.v.Tt=S.t;}stepTube(S.tube,dt);},
   draw(ctx,S){tubeScene(ctx,S);if(allDead(S.tube))pill(ctx,'Denatured: unfolded, and it stays that way',400,40,{bg:C.rj,c:'#fff',bd:null,s:18,w:700,r:9});}},

  {rail:'The graph',title:'Build the graph yourself',live:true,patience:120,
   text(S){const n=(S.v.pts||[]).length;return !S.v.doneT?'Build the graph you will see on a test. Pick a temperature, then press <b>Measure</b>. Each dot is a real 3-second count with fresh saliva.':
     'Two stories make one curve. The left side climbs because kicks get harder. The right side crashes because the enzyme unfolds. The peak is the <b class="term">optimum</b> (Latin for “best”): near body temperature.';},
   alt:'Read the curve from left to right like a story. Cold: slow, but nothing is broken. Warmer: faster. Past the peak: the enzyme is coming apart, so the rate falls off a cliff.',
   ui:[tempUI([{v:4,l:'4°'},{v:20,l:'20°'},{v:37,l:'37°'},{v:50,l:'50°'},{v:70,l:'70°'}]),
       {type:'button',label:'Measure here (3 seconds)',pulse:true,act(S){if(S.v.meas)return;fresh(S.tube);S.v.meas={T:S.tube.T,t:0,n:0,n0:0};},show:S=>!S.v.doneT||(S.v.causes&&(S.v.pts||[]).length<9)},
       {type:'button',label:'Show the two causes',pulse:true,act(S){S.v.causes=true;},show:S=>!!S.v.doneT&&!S.v.causes}],
   todo:[{t:'Measure 5 temperatures (one below 20 °C, one above 60 °C)',ok:S=>{const p=S.v.pts||[];return p.length>=5&&p.some(q=>q.T<20)&&p.some(q=>q.T>60);}},{t:'Press “Show the two causes”',ok:S=>!!S.v.causes}],
   enter(S){S.tube=newTube();S.v.T=37;S.v.pts=[];S.v.meas=null;S.v.causes=false;S.v.doneT=0;},
   tick(S,dt){const s=S.tube,m=S.v.meas;if(m){s.T=m.T;S.v.T=m.T;}stepTube(s,dt);if(m){m.t+=dt;m.n=s.n;if(m.t>=3){const p=S.v.pts.filter(q=>Math.abs(q.T-m.T)>1.5);p.push({T:m.T,r:m.n/3});S.v.pts=p;S.v.meas=null;const ok=p.length>=5&&p.some(q=>q.T<20)&&p.some(q=>q.T>60);if(ok&&!S.v.doneT)S.v.doneT=S.t;}}},
   draw(ctx,S){drawTube(ctx,S.tube,{});graph(ctx,S);if(S.v.meas)pill(ctx,'Measuring at '+S.v.meas.T+' °C…',400,40,{bg:C.rj,c:'#fff',bd:null,s:18,w:700,r:9});}},

  {rail:'Swallow',title:'Swallow: acid switches it off',live:true,
   text(S){const l=S.tube.loc;return l===0?'So far you have only chewed. Now <b>swallow</b>. Your stomach is as acidic as lemon juice: pH 2. (pH counts H⁺ ions. Lower means more acid.)':
     l===1?'H⁺ ions crowd in and stick to the groove, cancelling the charges that grip the starch. The chain slips out and the cutting stops. Meanwhile <b>pepsin</b>, the stomach’s own enzyme, is built for acid and gets to work on protein.':
     'Out of the stomach, the acid is neutralized. Pepsin switches off, and fresh amylase from your pancreas finishes the starch. Each enzyme’s best pH matches the place it works.';},
   alt:'Amylase holds starch the way a magnet holds a paper clip. Acid coats the magnet. The magnet is still there, but nothing sticks to it.',
   ui:[{type:'seg',key:'loc',val:0,label:'Where is the cracker now?',opts:[{v:0,l:'Mouth'},{v:1,l:'Stomach'},{v:2,l:'Small intestine'}],on(S,v){const s=S.tube;s.loc=v;s.pHt=[7,2,7][v];s.pep=v>=1;if(v===2){for(const e of s.enz){e.dead=false;e.enter=1;}}S.v.locT=S.t;}}],
   todo:[{t:'Swallow: move the cracker to the stomach',ok:S=>S.tube.loc===1&&S.t-S.v.locT>5},{t:'Move on to the small intestine',ok:S=>S.tube.loc===2&&S.t-S.v.locT>3}],
   enter(S){S.tube=newTube({pHt:7,pHshow:7});S.v.loc=0;S.v.locT=S.t;},
   tick(S,dt){const s=S.tube;s.pH+=(s.pHt-s.pH)*Math.min(1,dt*1.4);s.pHshow=s.pH;stepTube(s,dt);},
   draw(ctx,S){const s=S.tube;drawTube(ctx,s,{strip:false,charges:true,hplus:true,tagNew:s.loc===2});phPanel(ctx,s);
     pill(ctx,['In your mouth: pH 7','In your stomach: pH 2','In your small intestine: pH 7'][s.loc],20,34,{bg:s.loc===1?C.h:'#fff',c:s.loc===1?'#fff':C.ink,bd:s.loc===1?null:C.ink,s:18,w:700,a:'left',r:9,lw:2});
     if(s.loc===1&&s.pH<3)pill(ctx,'H⁺ ions (pink) cover the groove’s charges',400,574,{bg:'#fff',c:C.h,bd:C.h,s:16,w:700});}},

  {rail:'Tell it',title:'Now you tell the story',tell:true,
   text:'You have followed the cracker from the first bite to the small intestine. Put the story back in order, then explain it the way you would to a friend who missed class.',
   draw(){}}
  ]
});
})();
