(function(){
'use strict';
const {clamp,txt,rr,PAL,axes,legend,atLeast,fmtNum,RM}=BioLab.h;
const C=window.CityModel;if(!C)return;
const {M,NM,DEC,PLANS,PRESETS,ROLES}=C;
/* Teacher links: ?cw=…&calc=hand&a=TOKEN&level=…&dl=1&role=… (see city-model.js). With calc=hand the mode and the weights are locked. */
const Q=C.parseQS((()=>{try{return location.search;}catch(e){return '';}})());
const LOCK=Q.calc==='hand';
const W0=C.fixW(Q.w||(Q.role?ROLES.find(r=>r.k===Q.role).w:PRESETS[0].w));
const DEFB=['cars','mix','town','local','plain','trucked'];
/* First visit: open in Full lab, where the Start here walkthrough sits on top. Guided stays one click away. */
try{const mk=((document.querySelector('meta[name="lab-key"]')||{}).content||'rjbiolab')+'-mode-cityscore';if(!new URLSearchParams(location.search).get('mode')&&!localStorage.getItem(mk))localStorage.setItem(mk,'lab');}catch(e){}
const ROWS=[...PLANS.map(p=>({k:p.k,n:p.n})),{k:'Y',n:'Your build'}];
const LS='rjcity-autoseen';
const store={get(){try{return JSON.parse(localStorage.getItem(LS)||'[]');}catch(e){return [];}},add(k){try{const a=store.get();if(!a.includes(k)){a.push(k);localStorage.setItem(LS,JSON.stringify(a.slice(-40)));}}catch(e){}}};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f1=v=>fmtNum(v,1),f0=v=>fmtNum(v,0);
/* Teacher-set depth: hide the site's detail switch so students stay at the level the teacher chose. */
if(Q.dl&&Q.lv){try{const hide=()=>{const l=document.getElementById('lvl');const box=l&&l.closest('.lvl');if(box)box.hidden=true;else if(l)l.hidden=true;};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hide);else hide();}catch(e){}}

function cs(sim){if(!sim.cs)sim.cs={rf:{values:'',impact:'',learned:''},step:1,chosen:{},mode:Q.calc||'auto',tab:'score',role:Q.role||null,guess:null,revealed:false,hand:{},name:'',group:'',code:'',t0:Date.now(),teach:{calc:'auto',depth:'',dl:false,role:''}};return sim.cs;}
const W=sim=>M.map((m,i)=>Math.max(0,Math.round(+sim.p['w'+i]||0)));
const build=sim=>DEC.map(d=>sim.p[d.k]);
const rowB=(sim,k)=>k==='Y'?build(sim):PLANS.find(p=>p.k===k).b;
const rowScore=(sim,k)=>C.score(rowB(sim,k),W(sim));
const allScores=sim=>ROWS.map(r=>rowScore(sim,r.k));
const hand=sim=>cs(sim).mode==='hand';
const tourOn=sim=>!!(sim.tour&&sim.tour.on);
function rowDone(sim,k){const h=cs(sim).hand[k];return !!(h&&(h.ok||h.shown));}
const allDone=sim=>ROWS.every(r=>rowDone(sim,r.k));
/* What the student may see: Automatic shows scores after the gut pick; By hand shows each score once it is worked out. */
function showRow(sim,k){const c=cs(sim);if(hand(sim))return rowDone(sim,k);return c.revealed||(tourOn(sim)&&!LOCK);}
const showAll=sim=>ROWS.every(r=>showRow(sim,r.k));
const answersOpen=sim=>hand(sim)?allDone(sim):(cs(sim).revealed||tourOn(sim));
const wText=w=>M.map((m,i)=>w[i]>0?m.s+' ×'+w[i]:null).filter(Boolean).join(', ')||'nothing (every weight is 0)';
const boardName=w=>{const p=C.presetOf(w);if(p)return p.l;const r=C.roleOf(w);return r?'Resident: '+r.l:'Custom scoreboard';};
const WIN=M.map((m,i)=>{const v=PLANS.map(p=>C.ind(p.b)[i]),bv=m.low?Math.min(...v):Math.max(...v);return PLANS.filter((p,j)=>Math.abs(v[j]-bv)<1e-9).map(p=>p.k);});
function ranks(sim){const s=allScores(sim);return s.map(x=>C.rankAmong(x,s));}
function planRanks(w){const s=PLANS.map(p=>C.score(p.b,w));return s.map(x=>C.rankAmong(x,s));}
function resetCalc(sim){const c=cs(sim);c.guess=null;c.revealed=false;c.hand={};c.code='';sim.infoDirty=true;}
function markAuto(sim){if(!hand(sim))store.add(C.wKey(W(sim)));}
function setW(sim,w){const v={};C.fixW(w).forEach((x,i)=>v['w'+i]=x);BioLab.setValues(sim,v);}
const preset=(sim,k)=>setW(sim,PRESETS.find(p=>p.k===k).w);
const tok=()=>{const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=a[Math.floor(Math.random()*a.length)];return s;};
function baseUrl(){try{return location.href.split('#')[0].split('?')[0].replace(/index\.html$/,'');}catch(e){return 'https://rjedtech.github.io/Raider-BioLab/';}}

/* ---------- drawing ---------- */
function turbine(ctx,x,g,h,t,c){ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,g);ctx.lineTo(x,g-h);ctx.stroke();const a=RM?0.4:t*2.2;ctx.lineWidth=2.5;
 for(let i=0;i<3;i++){const b=a+i*2*Math.PI/3;ctx.beginPath();ctx.moveTo(x,g-h);ctx.lineTo(x+Math.cos(b)*h*0.42,g-h+Math.sin(b)*h*0.42);ctx.stroke();}ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,g-h,3,0,7);ctx.fill();}
function smoke(ctx,x,y,t,n){for(let i=0;i<n;i++){const ph=((RM?0.5:t*0.35)+i/n)%1;ctx.fillStyle=`rgba(140,140,140,${0.55*(1-ph)})`;ctx.beginPath();ctx.arc(x+ph*40,y-ph*34,5+ph*10,0,7);ctx.fill();}}
function house(ctx,x,g,w,h,c,roof){ctx.fillStyle=c;ctx.fillRect(x,g-h,w,h);ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(x-3,g-h);ctx.lineTo(x+w/2,g-h-w*0.45);ctx.lineTo(x+w+3,g-h);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.75)';ctx.fillRect(x+w*0.2,g-h*0.65,w*0.22,h*0.25);ctx.fillRect(x+w*0.58,g-h*0.65,w*0.22,h*0.25);}
function tree(ctx,x,g,r){ctx.fillStyle='#7a5a3a';ctx.fillRect(x-2,g-r*1.2,4,r*1.2);ctx.fillStyle=PAL['cv-leaf'];ctx.beginPath();ctx.arc(x,g-r*1.5,r,0,7);ctx.fill();}
function windows(ctx,x,y,w,h,cols,rows){ctx.fillStyle='rgba(255,255,255,.7)';const cw=w/cols,rh=h/rows;for(let i=0;i<cols;i++)for(let j=0;j<rows;j++)ctx.fillRect(x+i*cw+cw*0.25,y+j*rh+rh*0.25,cw*0.5,rh*0.45);}
function person(ctx,x,g,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,g-11,2.6,0,7);ctx.fill();ctx.fillRect(x-1.6,g-8.5,3.2,8.5);}
function drawCity(sim,ctx,k,t){const b=build(sim),v=C.ind(b),g=146,H=168,blk=C.blocks(b,v[5]);
 ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,800,H);
 /* the Front Range in the background */
 ctx.fillStyle=PAL['line'];ctx.beginPath();ctx.moveTo(0,g-40);[[60,g-70],[110,g-52],[170,g-88],[230,g-60],[300,g-80],[360,g-55],[440,g-76],[520,g-50],[600,g-84],[680,g-58],[740,g-72],[800,g-50]].forEach(p=>ctx.lineTo(p[0],p[1]));ctx.lineTo(800,g);ctx.lineTo(0,g);ctx.closePath();ctx.fill();
 /* haze: five blocks, thickest on the block next to the plant, the factory and the busiest road */
 blk.forEach((d,i)=>{const hz=clamp((d-5)/85,0,1);ctx.fillStyle=`rgba(176,150,96,${0.04+0.5*hz})`;ctx.fillRect(i*160,0,160,g);});
 ctx.fillStyle=PAL['cv-leaf2'];ctx.fillRect(0,g,800,H-g);
 /* paved share: gray strips along the ground */
 const pv=clamp((v[9]-15)/50,0,1);ctx.fillStyle='rgba(110,110,115,.55)';for(let i=0;i<10;i++){if(i/10<pv)ctx.fillRect(i*80+6,g,68,3);}
 /* electricity */
 if(b[1]==='fossil'){ctx.fillStyle='#6b6f78';ctx.fillRect(18,g-46,70,46);ctx.fillRect(96,g-30,50,30);ctx.fillStyle='#878b93';ctx.fillRect(40,g-92,12,46);ctx.fillRect(64,g-84,12,38);smoke(ctx,46,g-94,t,4);smoke(ctx,70,g-86,t+1.3,4);}
 else if(b[1]==='mix'){ctx.fillStyle='#6b6f78';ctx.fillRect(18,g-40,58,40);ctx.fillStyle='#878b93';ctx.fillRect(38,g-80,12,40);smoke(ctx,44,g-82,t,4);turbine(ctx,110,g,62,t,PAL['cv-ink']);turbine(ctx,148,g,54,t+0.7,PAL['cv-ink']);}
 else{turbine(ctx,36,g,70,t,PAL['cv-ink']);turbine(ctx,80,g,60,t+0.5,PAL['cv-ink']);turbine(ctx,122,g,66,t+1.1,PAL['cv-ink']);ctx.fillStyle='#2f5f9e';for(let i=0;i<4;i++){ctx.save();ctx.translate(20+i*36,g-6);ctx.transform(1,0,-0.4,1,0,0);ctx.fillRect(0,-12,30,12);ctx.restore();}}
 /* homes */
 if(b[2]==='lots'){[[192,'#c98b5b'],[268,'#8fa6c4'],[344,'#c9b26b']].forEach(([x,c])=>{ctx.fillStyle=PAL['cv-leaf'];ctx.fillRect(x-10,g-4,70,4);house(ctx,x,g,42,30,c,'#7d4b3b');ctx.fillStyle='#a9a9a9';ctx.fillRect(x+44,g-18,18,18);});}
 else if(b[2]==='town'){for(let i=0;i<7;i++)house(ctx,186+i*32,g,30,42,['#c98b5b','#b07a62','#c9b26b','#9b8fb8'][i%4],'#6d4234');}
 else{[[186,'#b4736a'],[262,'#8a9bb8'],[338,'#b59b62']].forEach(([x,c])=>{ctx.fillStyle=c;ctx.fillRect(x,g-88,66,88);windows(ctx,x,g-88,66,64,3,4);[PAL['s1'],PAL['s3'],PAL['s4']].forEach((a,i)=>{ctx.fillStyle=a;ctx.fillRect(x+4+i*21,g-24,18,6);});});ctx.fillStyle=PAL['cv-leaf'];ctx.fillRect(186,g-90,66,3);}
 /* work */
 if(b[3]==='factory'){ctx.fillStyle='#7c7f86';ctx.fillRect(436,g-44,170,44);ctx.fillStyle='#93969d';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(436+i*34,g-44);ctx.lineTo(436+i*34,g-62);ctx.lineTo(470+i*34,g-44);ctx.closePath();ctx.fill();}ctx.fillStyle='#6b6f78';ctx.fillRect(588,g-96,12,52);smoke(ctx,594,g-98,t+0.6,4);}
 else if(b[3]==='office'){[[440,104,'#5d7fa8'],[492,128,'#4f6f96'],[548,96,'#6a8bb3']].forEach(([x,h,c])=>{ctx.fillStyle=c;ctx.fillRect(x,g-h,48,h);windows(ctx,x,g-h,48,h,3,7);});ctx.fillStyle='#8a8d93';ctx.fillRect(600,g-3,40,3);}
 else if(b[3]==='local'){for(let i=0;i<4;i++){const x=436+i*44;ctx.fillStyle=['#c98b5b','#9b8fb8','#c9b26b','#8fa6c4'][i];ctx.fillRect(x,g-40,40,40);ctx.fillStyle=[PAL['s1'],PAL['s3'],PAL['s2'],PAL['s4']][i];ctx.fillRect(x-2,g-28,44,7);ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(x+8,g-18,24,12);}}
 else{ctx.fillStyle=PAL['cv-water'];ctx.beginPath();ctx.ellipse(520,g-10,46,9,0,0,7);ctx.fill();[446,470,580,606,630].forEach((x,i)=>tree(ctx,x,g,10+(i%2)*3));}
 /* rooftops */
 const roofs=b[4];if(roofs!=='plain'){const col=roofs==='solar'?'#2f5f9e':PAL['cv-leaf'];const tops=b[2]==='lots'?[[192,g-44,42],[268,g-44,42],[344,g-44,42]]:b[2]==='town'?[[188,g-58,26],[252,g-58,26],[316,g-58,26],[380,g-58,26]]:[[188,g-92,62],[264,g-92,62],[340,g-92,62]];
  tops.forEach(([x,y,w])=>{ctx.fillStyle=col;ctx.fillRect(x+4,y,w-8,4);if(roofs==='solar'){ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1;for(let i=x+8;i<x+w-6;i+=7){ctx.beginPath();ctx.moveTo(i,y);ctx.lineTo(i,y+4);ctx.stroke();}}});
  if(b[3]==='office')[[440,104],[492,128],[548,96]].forEach(([x,h])=>{ctx.fillStyle=col;ctx.fillRect(x+3,g-h-4,42,4);});
  if(b[3]==='factory'){ctx.fillStyle=col;ctx.fillRect(440,g-48,160,4);}}
 /* food: garden plots, or a delivery truck */
 if(b[5]==='local'){for(let i=0;i<4;i++){ctx.fillStyle='#7a5a3a';ctx.fillRect(612+i*12,g-6,10,6);ctx.fillStyle=PAL['cv-leaf'];ctx.fillRect(613+i*12,g-9,8,3);}}
 /* people out walking: more where people are active */
 const np=Math.round(1+9*clamp(v[4]/41,0,1));for(let i=0;i<np;i++){const x=((i*83+(RM?0:t*9*(i%2?1:-1)))%800+800)%800;person(ctx,x,g,PAL['cv-ink']);}
 const nt=Math.round(2+5*clamp(v[4]/41,0,1));for(let i=0;i<nt;i++)tree(ctx,660+i*20,g,8+(i%3)*2);
 /* getting around, on the street */
 ctx.fillStyle='#4b4f57';ctx.fillRect(0,g+2,800,16);ctx.strokeStyle='rgba(255,255,255,.6)';ctx.setLineDash([10,10]);ctx.beginPath();ctx.moveTo(0,g+10);ctx.lineTo(800,g+10);ctx.stroke();ctx.setLineDash([]);
 const mv=(sp,ph)=>((RM?ph*97:t*sp+ph*97)%880)-40;
 if(b[0]==='cars'){for(let i=0;i<11;i++){const x=mv(70+(i%3)*12,i),y=i%2?g+4:g+11;ctx.fillStyle=['#c0392b','#2e86c1','#d4ac0d','#7f8c8d','#8e44ad'][i%5];rr(ctx,x,y,16,6,2);ctx.fill();}}
 else if(b[0]==='bus'){ctx.fillStyle=PAL['s4'];rr(ctx,mv(40,0),g+3,44,8,2);ctx.fill();ctx.fillStyle='#2e86c1';rr(ctx,mv(70,4),g+11,16,6,2);ctx.fill();ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,g+18);ctx.lineTo(800,g+18);ctx.stroke();
  for(let i=0;i<5;i++){const x=mv(28,i*1.7);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,g+20,2.5,0,7);ctx.arc(x+8,g+20,2.5,0,7);ctx.stroke();}}
 if(b[5]==='trucked'){const tx=mv(50,7);ctx.fillStyle='#e0e0e0';rr(ctx,tx,g+2,30,9,2);ctx.fill();ctx.fillStyle=PAL['s1'];rr(ctx,tx+30,g+4,9,7,2);ctx.fill();}
 if(b[0]==='rail'){ctx.strokeStyle='#9a9a9a';ctx.lineWidth=1;for(let x=0;x<800;x+=10){ctx.beginPath();ctx.moveTo(x,g+4);ctx.lineTo(x,g+16);ctx.stroke();}ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,g+6);ctx.lineTo(800,g+6);ctx.moveTo(0,g+14);ctx.lineTo(800,g+14);ctx.stroke();
  ctx.fillStyle=PAL['s1'];const x0=mv(55,0);for(let i=0;i<3;i++){rr(ctx,x0+i*34,g+3,32,11,3);ctx.fill();}}
 /* captions */
 const cap=(s,x)=>txt(ctx,s,x,6,{s:12*k,w:700,c:PAL['cv-ink'],b:'top'});
 if(k<1.25){cap(C.opt(1,b[1]).l,10);cap(C.opt(2,b[2]).l,186);cap(C.opt(3,b[3]).l,436);cap(C.opt(0,b[0]).l,650);
  if(atLeast('honors'))txt(ctx,'Worst-off block: '+f0(blk[0])+' bad-air days · cleanest block: '+f0(blk[4]),10,6+15*k,{s:12*k,c:PAL['cv-ink'],b:'top'});}
 else cap('Your build',10);}
const SH=['GDP','Jobs','House','Comm.','Active','Air','CO₂','Happy','Worst','Paved'];
const DL=['GDP','Jobs','Rent','Commute','Active','Bad air','CO₂','Happy','Worst','Paved'];
function drawTable(sim,ctx,k){const w=W(sim),T=176,big=k>1.15,fs=11.5*k,nameW=big?104:132,scW=big?84:88,cw=(792-nameW-scW)/NM,x0=8;
 const view=atLeast('honors')&&sim.p.view==='pts';
 ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,T-6,800,450-T+6);
 const hh=2.3*fs+6,rh=(446-T-hh)/5;
 txt(ctx,'Plan',x0+4,T+hh-4,{s:fs,w:700,c:PAL['cv-soft'],b:'bottom'});
 M.forEach((m,i)=>{const x=x0+nameW+cw*(i+1)-5,on=w[i]>0;txt(ctx,big?SH[i]:DL[i],x,T+hh-4-fs*1.1,{s:fs,w:on?700:400,c:on?PAL['cv-ink']:PAL['cv-soft'],a:'right',b:'bottom'});txt(ctx,'×'+w[i],x,T+hh-4,{s:fs,w:on?700:400,c:on?PAL['rj']:PAL['cv-soft'],a:'right',b:'bottom'});});
 txt(ctx,'Score',792-6,T+hh-4,{s:fs,w:700,a:'right',b:'bottom'});
 ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(8,T+hh);ctx.lineTo(792,T+hh);ctx.stroke();
 const sc=allScores(sim),rk=ranks(sim),c=cs(sim),G=c.guess;
 ROWS.forEach((r,j)=>{const y=T+hh+j*rh,yc=y+rh/2,b=rowB(sim,r.k),v=C.ind(b),p=C.pts(b);
  if(r.k==='Y'){ctx.fillStyle=PAL['card2'];ctx.fillRect(8,y+1,784,rh-2);}else if(j%2){ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(8,y,784,rh);}
  if(G===r.k){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2.5;rr(ctx,7,y+2,786,rh-4,6);ctx.stroke();}
  const nm=r.k==='Y'?(big?'Yours':'★ Your build'):(big?r.n:r.k+'  '+r.n);txt(ctx,nm,x0+5,yc,{s:fs,w:700,b:'middle'});
  M.forEach((m,i)=>{const x=x0+nameW+cw*(i+1)-5,win=r.k!=='Y'&&WIN[i].includes(r.k);
   if(win){ctx.fillStyle=PAL['s4'];ctx.globalAlpha=0.28;rr(ctx,x-cw+8,y+4,cw-4,rh-8,5);ctx.fill();ctx.globalAlpha=1;}
   txt(ctx,view?f1(p[i]):m.f(v[i]),x,yc,{s:fs,w:win?700:400,c:w[i]>0?PAL['cv-ink']:PAL['cv-soft'],a:'right',b:'middle'});});
  const sx=792-6;
  if(showRow(sim,r.k)){const all=showAll(sim);txt(ctx,f1(sc[j])+(all?' #'+rk[j]:''),sx,yc,{s:fs,w:700,c:all&&rk[j]===1?PAL['rj']:PAL['cv-ink'],a:'right',b:'middle'});}
  else txt(ctx,'?',sx,yc,{s:fs*1.1,w:700,c:PAL['cv-soft'],a:'right',b:'middle'});});
 if(!big)txt(ctx,'Shaded: #1 of the four plans on that measure.',8,449,{s:11,c:PAL['cv-soft'],b:'bottom'});}

/* ---------- panel pieces ---------- */
function prompt(sim,k){const w=W(sim),p=C.pts(rowB(sim,k)),used=M.map((m,i)=>i).filter(i=>w[i]>0);return used.map(i=>`${M[i].s} <b>${f1(p[i])}</b> × ${w[i]}`).join(', ');}
function steps(sim,k){const w=W(sim),p=C.pts(rowB(sim,k)),used=M.map((m,i)=>i).filter(i=>w[i]>0),W1=C.wsum(w);if(!W1)return 'Every weight is 0, so every score is 0.';
 const prods=used.map(i=>w[i]*p[i]),sum=prods.reduce((a,b)=>a+b,0);
 return `${used.map((i,n)=>w[i]+' × '+f1(p[i])+' = '+f1(prods[n])).join('; ')}. Add: ${f1(sum)}. Total weight: ${used.map(i=>w[i]).join(' + ')} = ${W1}. Score = ${f1(sum)} ÷ ${W1} = <b>${f1(sum/W1)}</b>.`;}
const TBL='border-collapse:collapse;font-size:.92em;width:100%';const TD='padding:3px 6px;border-bottom:1px solid var(--line)';const TDR=TD+';text-align:right;font-variant-numeric:tabular-nums';
function compareTable(sim){const w=W(sim),cur=C.presetOf(w);const boards=[...PRESETS];if(!cur)boards.unshift({k:'cur',l:'This scoreboard',w});
 const head=boards.map(b=>`<th style="${TDR}">${esc(b.l)}</th>`).join('');
 const body=PLANS.map(p=>`<tr><td style="${TD}"><b>${p.n}</b></td>${boards.map(b=>{const r=planRanks(b.w)[PLANS.indexOf(p)];return `<td style="${TDR};${r===1?'color:var(--rj);font-weight:700':''}">#${r}</td>`;}).join('')}</tr>`).join('');
 return `<div style="overflow-x:auto"><table style="${TBL}"><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table></div>`;}
function rolesTable(){const body=ROLES.map(r=>{const s=PLANS.map(p=>C.score(p.b,r.w)),m=Math.max(...s),top=PLANS.filter((p,j)=>Math.abs(s[j]-m)<1e-9).map(p=>p.n).join(' and ');return `<tr><td style="${TD}"><b>${esc(r.l)}</b></td><td style="${TD}">${esc(top)}</td><td style="${TD}">${esc(C.bLabel(C.best(r.w).b))}</td></tr>`;}).join('');
 return `<div style="overflow-x:auto"><table style="${TBL}"><thead><tr><th style="${TD};text-align:left">Resident</th><th style="${TD};text-align:left">Favorite of the four plans</th><th style="${TD};text-align:left">Best possible build for them</th></tr></thead><tbody>${body}</tbody></table></div>`;}
function resultLine(sim){const sc=allScores(sim),rk=ranks(sim),c=cs(sim),ti=rk.indexOf(1),top=ROWS[ti];
 let s=`<p><b>${top.n}</b> is #1 under this scoreboard with ${f1(sc[ti])}. Your build scores ${f1(sc[4])} (#${rk[4]} of 5).</p>`;
 if(c.guess){const gi=ROWS.findIndex(r=>r.k===c.guess);s+=c.guess===top.k?`<p>Your gut was right: you read the weights the way the math does.</p>`:`<p>Your gut picked <b>${ROWS[gi].n}</b>, which ranks #${rk[gi]}, ${f1(sc[ti]-sc[gi])} points behind.</p>`;}
 s+=`<p><b>Same plans, other scoreboards.</b> Each column ranks the four plans a different way. Tech Park has the highest GDP; find where it lands on the others.</p>`+compareTable(sim);
 if(atLeast('honors'))s+=`<p style="margin-top:10px"><b>Same plans, different residents.</b> People who want different things pick different winners. The weights are a starting point to argue about, not facts about anyone.</p>`+rolesTable();
 return s;}
function deeper(sim){const b=build(sim),v=C.ind(b),blk=C.blocks(b,v[5]);let s='';
 if(atLeast('honors')){s+=`<h3 style="margin-top:14px">Who breathes it?</h3><p>The neighborhood average is <b>${f0(v[5])}</b> unhealthy-air days a year, but the air is not shared evenly. The block next to the plant, the factory or the busiest road gets <b>${f0(blk[0])}</b>; the cleanest block gets <b>${f0(blk[4])}</b>. Rent is usually cheapest on the worst block, so families with the least money often live there. An average can hide that gap: compare the <b>Worst block</b> column.</p>`;
  const sm=C.smartCheck(b),yes=sm.filter(x=>x.ok===true).length,no=sm.filter(x=>x.ok===false).length;
  s+=`<h3 style="margin-top:14px">Smart growth check</h3><p>EPA’s 10 smart growth principles, checked against your build: <b>${yes}</b> met, <b>${no}</b> not met, ${10-yes-no} this model cannot judge.</p><ul style="margin:4px 0 0 18px;padding:0">${sm.map(x=>`<li>${x.ok===true?'✓':x.ok===false?'✗':'?'} ${esc(x.l)}${x.ok===null?' <span style="color:var(--muted)">(the model cannot tell: talk about it)</span>':''}</li>`).join('')}</ul>`;
  s+=`<p style="margin-top:8px"><b>Runoff.</b> Your build paves or roofs <b>${f0(v[9])}%</b> of the land. Rain that cannot soak in runs off fast, carrying oil, salt and fertilizer to streams. Stream studies find damage once about 10% of a watershed is paved, and serious harm above about 25% (Impervious Cover Model).</p>`;}
 if(atLeast('ap')){const syn=C.synOf(b),bt=C.beatenBy(b),bp=C.breakPoint(W(sim)),cy=C.costs(b),ca=C.costs(PLANS[0].b);
  s+=`<h3 style="margin-top:14px">Trade-offs and limits</h3>`;
  s+=`<p><b>Choices that work together.</b> ${syn.length?'In your build: '+syn.map(x=>esc(x.l)).join(' '):'None in your build. In this model, rail and buses work better with apartments over shops, and big lots make every car trip longer.'} Because two decisions can change each other’s effect, the best build cannot always be found one decision at a time.</p>`;
  s+=`<p><b>Beaten on every measure?</b> ${bt.length?`Yes: ${esc(C.bLabel(bt[0]))} is at least as good on all ten measures and better on at least one. No scoreboard should ever pick your build over it.`:'No. Every other build is worse than yours on at least one measure, so some scoreboard could rank yours first. That makes it a real trade-off.'}</p>`;
  s+=`<p><b>How fragile is #1?</b> ${bp?`Change the <b>${M[bp.i].s}</b> weight from ${bp.from} to ${bp.to} and <b>${PLANS[bp.plan].n}</b> becomes #1 among the four plans.`:'No single whole-number weight change (0 to 5) changes #1.'}</p>`;
  const dUp=cy.up-ca.up,dYr=ca.yr-cy.yr;
  s+=`<p><b>Pay now or pay later.</b> Up front, your build costs about $${f0(cy.up)}k per resident; each year after that, about $${f1(cy.yr)}k (upkeep plus spending on harms). Over 25 years: $${f0(cy.t25)}k. Wide Roads: $${f0(ca.up)}k up front, $${f1(ca.yr)}k a year, $${f0(ca.t25)}k over 25 years.${dUp>0&&dYr>0?` Your build costs $${f0(dUp)}k more up front but saves $${f1(dYr)}k a year, so it pays back in about <b>${f1(dUp/dYr)} years</b> (solve ${f0(cy.up)} + ${f1(cy.yr)}t = ${f0(ca.up)} + ${f1(ca.yr)}t).`:dUp<=0&&dYr>0?' Your build costs less than Wide Roads both up front and every year.':dUp>0&&dYr<=0?' Your build costs more than Wide Roads both up front and every year.':''} These costs are illustrative.</p>`;}
 return s;}
function realTab(sim){const w=W(sim),cs2=C.countyScores(w);let s=`<h3>Real places: the Front Range</h3><p>The model city is made up. These counties are real. The table uses your scoreboard’s weights on the real measures that exist for counties. Points again run from 0 (worst county) to 100 (best county) on each measure.</p>`;
 const missing=M.filter((m,i)=>w[i]>0&&!C.RM.some(r=>r.w===i)).map(m=>m.s);
 if(!cs2)s+=`<p><b>None of your weights match a real county measure.</b> Put weight on GDP (uses income), Housing (rent share), Commute or Bad air (ozone and PM2.5).</p>`;
 if(missing.length)s+=`<p><b>No county numbers here for:</b> ${esc(missing.join(', '))}. What does not get measured cannot be scored. Who should measure it?</p>`;
 const rows=C.COUNTIES.map((c,i)=>({c,sc:cs2?cs2.rows[i]:null})),order=rows.slice().sort((a,b)=>((b.sc&&b.sc.s!=null)?b.sc.s:-1)-((a.sc&&a.sc.s!=null)?a.sc.s:-1));
 const scs=rows.map(r=>r.sc&&r.sc.s).filter(x=>x!=null);
 s+=`<div style="overflow-x:auto"><table style="${TBL}"><thead><tr><th style="${TD};text-align:left">County</th>${C.RM.map(m=>`<th style="${TDR}">${esc(m.s)}</th>`).join('')}<th style="${TDR}">Score</th></tr></thead><tbody>`+
  order.map(r=>{const c=r.c,v=r.sc&&r.sc.s;return `<tr><td style="${TD}"><b>${esc(c.n)}</b></td>${C.RM.map(m=>`<td style="${TDR}">${c[m.k]==null?'<span style="color:var(--muted)">no data</span>':esc(m.f(c[m.k]))}</td>`).join('')}<td style="${TDR};font-weight:700">${v==null?'–':f1(v)+' #'+C.rankAmong(v,scs)}${r.sc&&r.sc.missing.length?' <span style="color:var(--muted);font-weight:400">('+esc(r.sc.missing.join(', '))+' missing)</span>':''}</td></tr>`;}).join('')+`</tbody></table></div>`;
 s+=`<p style="margin-top:6px"><b>Read it closely.</b> Denver is the densest county but not the shortest commute; Boulder is. Jefferson has the most high-ozone days even though Denver has more traffic: ozone forms as sunlight cooks exhaust, and it often peaks downwind and in the foothills. Broomfield has no air monitor at all. Rent share here is median rent × 12 ÷ median household income: a rough measure, because renters and owners have different incomes.</p>`;
 s+=`<h3 style="margin-top:14px">Real cities: designed differently</h3><p>Life satisfaction is a survey answer: people rate their life from 0 (worst possible) to 10 (best possible). These are averages for 2014 to 2018 from the World Happiness Report 2020 city ranking.</p>`;
 s+=`<div style="overflow-x:auto"><table style="${TBL}"><thead><tr><th style="${TD};text-align:left">City</th><th style="${TDR}">Life satisfaction</th><th style="${TDR}">Rank of 186</th><th style="${TD};text-align:left">How it is built</th></tr></thead><tbody>`+
  C.CITIES.map(c=>`<tr><td style="${TD}"><b>${esc(c.n)}</b>, ${esc(c.c)}</td><td style="${TDR}">${c.life.toFixed(3)}</td><td style="${TDR}">#${c.rank}</td><td style="${TD}">${esc(c.design)}</td></tr>`).join('')+`</tbody></table></div>`;
 s+=`<p style="margin-top:6px"><b>What this number hides.</b> Houston, built around freeways, reports higher life satisfaction than Tokyo, built around trains. The report’s authors found that a city’s happiness ranking is almost the same as its country’s. So these numbers tell you more about the country (income, trust, health, freedom, culture) than about city design. Denver is not in the ranking: only the ten largest U.S. cities were. In Gallup-Sharecare’s 2016-2017 U.S. index, Boulder ranked third of 186 metro areas for well-being. Questions to ask any number: Who counted, and how? Who is missing? Compared to what? What would change the answer?</p>`;
 return s;}
function howTab(){const D=[
  ['GDP per person','Money spent on goods and services, per person. In the model it rises with offices, factories and car spending.','Real counterpart: GDP, or median household income (Census ACS). GDP counts money spent to fix harms (car crashes, asthma visits) as a plus, and leaves out unpaid care, clean air and free time.'],
  ['Jobs per 100 residents','How many jobs are located in the neighborhood for every 100 people who live there.','Real counterpart: Census employment counts. It does not say whether the jobs pay enough or fit the residents.'],
  ['Housing cost','Rent as a share of income. Lower is better.','Real counterpart: median rent × 12 ÷ median household income (Census ACS). Renters often earn less than the median household, so their real share is higher.'],
  ['Commute','Minutes a day getting to and from work. Lower is better.','Real counterpart: mean travel time to work (Census ACS, one way).'],
  ['Active minutes','Minutes a day of walking or biking as part of daily life.','Real counterpart: health surveys on physical activity. CDC advises 60 minutes a day for children and teens.'],
  ['Bad-air days','Days a year with unhealthy air, averaged over all residents. Lower is better.','Real counterpart: high-ozone and particle days from EPA monitors (American Lung Association, State of the Air).'],
  ['CO₂ per person','Metric tons of carbon dioxide per person per year. Lower is better.','Real counterpart: city greenhouse gas inventories. There is no standard yearly number for every city.'],
  ['Life satisfaction','The average answer to “rate your life from 0 to 10.”','Real counterpart: the Cantril ladder question used by Gallup and the World Happiness Report. It is a survey answer, so it depends on who was asked and how.'],
  ['Worst block','Unhealthy-air days on the block that gets the most. Lower is better.','In the model, bad air is split over 5 blocks; the spread grows with car roads, fossil power and factories. Real counterpart: neighborhood-level exposure maps such as Colorado EnviroScreen.'],
  ['Paved ground','Share of land covered by roads, roofs and parking, which rain cannot soak into. Lower is better.','Real counterpart: impervious cover from satellite land-cover data. Stream damage begins around 10% of a watershed and is serious above about 25%.']];
 let s=`<h3>How each score is built</h3><ol style="margin:4px 0 0 18px;padding:0">`;
 s+=`<li><b>Each choice adds fixed amounts.</b> A build’s value on each measure = a starting value + the amounts from its six choices + any “work together” bonus (rail with apartments, buses with apartments, cars with big lots, rooftop solar on an already clean grid). These amounts are an illustrative model, chosen so each trend points the way research points.</li>`;
 s+=`<li><b>Points.</b> Each measure becomes points: 100 × (value − worst possible) ÷ (best possible − worst possible), across all 648 possible builds, rounded to 0.1. Measures where lower is better are flipped (100 − points).</li>`;
 s+=`<li><b>Score.</b> A weighted average: (sum of weight × points) ÷ (sum of weights). The weights are the scoreboard: someone’s opinion about what matters.</li>`;
 s+=`<li><b>Spending on harms</b> (inside GDP) = car costs ($10k per person for a car-centered build, $2k buses, $1k rail) + $0.2k per bad-air day. <b>Pay now or later</b> = up-front cost + 25 × (yearly upkeep + spending on harms). Both are illustrative.</li>`;
 s+=`<li><b>Real counties</b> use the same points-and-weights method on real measures, with points from 0 (worst county) to 100 (best county). A county missing a measure is scored on the others.</li></ol>`;
 s+=`<div style="overflow-x:auto;margin-top:8px"><table style="${TBL}"><thead><tr><th style="${TD};text-align:left">Measure</th><th style="${TD};text-align:left">In the model</th><th style="${TD};text-align:left">In the real world</th></tr></thead><tbody>${D.map(d=>`<tr><td style="${TD}"><b>${esc(d[0])}</b></td><td style="${TD}">${esc(d[1])}</td><td style="${TD}">${esc(d[2])}</td></tr>`).join('')}</tbody></table></div>`;
 s+=`<h3 style="margin-top:14px">Sources</h3><ol style="margin:4px 0 0 18px;padding:0">${C.SOURCES.map(x=>`<li>${esc(x.t)}. <a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.u.replace(/^https?:\/\//,'').slice(0,60))}${x.u.length>68?'…':''}</a></li>`).join('')}</ol>`;
 return s;}
function scoreTab(sim){const c=cs(sim),w=W(sim),W1=C.wsum(w),h=hand(sim);let s='';
 s+=`<p style="margin:.2em 0 .6em"><b>Scoreboard:</b> ${esc(boardName(w))}: ${esc(wText(w))}.${LOCK?' <span style="color:var(--muted)">(Set by your teacher.)</span>':''}</p>`;
 if(!LOCK){s+=`<div class="row" style="gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap"><span>Scores:</span><div class="seg" role="radiogroup"><button type="button" role="radio" data-cmode="auto" aria-checked="${!h}">Automatic</button><button type="button" role="radio" data-cmode="hand" aria-checked="${h}">By hand</button></div></div>`;
  s+=`<details style="margin:0 0 8px"${c.role?' open':''}><summary><b>Play a resident</b> (sets the weights to what that person might care about)</summary><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px">${ROLES.map(r=>`<button type="button" class="btn${c.role===r.k?' primary':''}" data-role="${r.k}">${esc(r.l)}</button>`).join('')}</div>${c.role?`<p style="margin:6px 0 0">${esc(ROLES.find(r=>r.k===c.role).why)}</p>`:''}</details>`;}
 else{s+=`<p style="margin:.2em 0 .6em"><b>By hand:</b> your teacher wants you to work out every score yourself.</p>`;if(c.role)s+=`<p><b>Your resident:</b> ${esc(ROLES.find(r=>r.k===c.role).l)}. ${esc(ROLES.find(r=>r.k===c.role).why)}</p>`;}
 if(W1<=0)return s+'<p>Set at least one weight to make a scoreboard.</p>';
 if(!c.guess){s+=`<p><b>Your gut:</b> under this scoreboard, which one scores highest? Pick here or in <b>Start here</b> above, before you see any scores.</p><div class="row" style="flex-wrap:wrap;gap:6px">${ROWS.map(r=>`<button type="button" class="btn" data-guess="${r.k}">${r.k==='Y'?'Your build':r.k+': '+r.n}</button>`).join('')}</div>`;
  if(!h)s+=`<p style="margin-top:6px"><button type="button" class="btn" data-guess="-">Skip the guess and show the scores</button></p>`;}
 else if(!h){s+=resultLine(sim);}
 else{s+=`<p><b>Step 2, work it out:</b> score = (sum of weight × points) ÷ (sum of weights). Points run from 0 (worst possible neighborhood) to 100 (best possible). Round to one decimal.</p>`;
  ROWS.forEach(r=>{const x=c.hand[r.k]||{},done=x.ok||x.shown;
   s+=`<div style="border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin:6px 0"><p style="margin:0 0 4px"><b>${r.k==='Y'?'Your build':r.k+': '+r.n}</b>: ${prompt(sim,r.k)}</p>`;
   if(!done)s+=`<div class="row" style="gap:6px;align-items:center;flex-wrap:wrap"><input type="text" inputmode="decimal" data-ans="${r.k}" value="${esc(x.v||'')}" aria-label="Score for ${esc(r.n)}" style="width:7em;padding:4px 6px"><button type="button" class="btn primary" data-check="${r.k}">Check</button><button type="button" class="btn" data-show="${r.k}">Show me</button>${x.tries?'<span style="color:var(--muted)">Not quite. Multiply each points value by its weight, add them, then divide by the total weight.</span>':''}</div>`;
   else s+=`<p style="margin:0">${x.ok?'<b>Right.</b> ':'<b>Here is how:</b> '}${steps(sim,r.k)}</p>`;s+='</div>';});
  if(allDone(sim))s+=resultLine(sim);}
 if(answersOpen(sim))s+=deeper(sim);
 /* send to the teacher */
 const ready=h?allDone(sim):!!c.revealed;
 s+=`<h3 style="margin-top:14px">Send to my teacher</h3>`;
 if(!ready)s+=`<p style="color:var(--muted)">${h?'Work out every score first.':'Make your guess first.'} Then you can make a result code for your teacher.</p>`;
 else{s+=`<div class="row" style="gap:6px;flex-wrap:wrap;align-items:center"><input type="text" data-name value="${esc(c.name)}" placeholder="Your name" aria-label="Your name" style="padding:4px 6px"><input type="text" data-group value="${esc(c.group)}" placeholder="Group (optional)" aria-label="Group" style="padding:4px 6px;width:9em"><button type="button" class="btn primary" data-mkcode>Make my result code</button></div>`;
  s+=`<p style="margin:6px 0 0;color:var(--muted)">Answer the three Reflect questions in <b>Start here</b> (step 5) first: your answers go into the code.</p>`;
  if(c.code)s+=`<p style="margin:6px 0 2px">Copy this and paste it where your teacher said (a Canvas assignment or discussion):</p><textarea readonly rows="3" style="width:100%;font-family:monospace;font-size:.85em" data-codebox>${esc(c.code)}</textarea><div class="row" style="gap:6px"><button type="button" class="btn" data-copycode>Copy</button><span class="toast" data-ctoast hidden>Copied</span></div>`;}
 /* teacher share */
 const t=c.teach;
 if(!LOCK)s+=`<details style="margin-top:14px"${t.open?' open':''} data-tdet><summary><b>For teachers: assign this scoreboard</b></summary><div style="padding:6px 0">
  <p>Set the weights (sliders in Full lab, a scoreboard button, or a resident). Then choose how students score and how deep they go, and make a link. Students who open it see your scoreboard.</p>
  <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0"><span>Students score:</span><div class="seg" role="radiogroup"><button type="button" role="radio" data-tcalc="auto" aria-checked="${t.calc!=='hand'}">Automatic</button><button type="button" role="radio" data-tcalc="hand" aria-checked="${t.calc==='hand'}">By hand (locked)</button></div></div>
  <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0"><span>Depth:</span><div class="seg" role="radiogroup">${[['','Student chooses'],['bio','Basic'],['honors','Standard'],['ap','Advanced']].map(([v,l])=>`<button type="button" role="radio" data-tdepth="${v}" aria-checked="${t.depth===v}">${l}</button>`).join('')}</div>${t.depth?`<label style="display:inline-flex;gap:4px;align-items:center"><input type="checkbox" data-tdl${t.dl?' checked':''}> Lock it</label>`:''}</div>
  <p style="margin:4px 0;color:var(--muted)">Basic: the measures, the gut guess and the scores. Standard adds who breathes the bad air, smart growth, runoff, points and resident roles. Advanced adds trade-offs, break points and pay-now-or-later costs.</p>
  <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0"><label>Assign a resident: <select data-trole class="sel"><option value="">None</option>${ROLES.map(r=>`<option value="${r.k}"${t.role===r.k?' selected':''}>${esc(r.l)}</option>`).join('')}</select></label></div>
  <p style="margin:6px 0">${t.calc==='hand'?'<b>By hand (locked):</b> students cannot switch to Automatic or change your weights, and their result code records whether this browser showed the automatic scores for your scoreboard first.':'<b>Automatic:</b> the tool scores the plans after each student guesses.'}</p>
  <button type="button" class="btn primary" data-tmake>Make the link for ${esc(wText(w))}</button>
  ${t.link?`<p style="margin:8px 0 2px"><b>Link</b> (post it in Canvas):</p><textarea readonly rows="2" style="width:100%;font-size:.85em">${esc(t.link)}</textarea>
  <p style="margin:8px 0 2px"><b>Embed code</b> (Canvas page: Edit, then Insert, then Embed):</p><textarea readonly rows="3" style="width:100%;font-size:.85em">${esc(t.embed)}</textarea>
  <p style="margin:8px 0 0">Assignment code: <b>${esc(t.a)}</b>. Students paste their result codes into the Canvas assignment or discussion; copy them all into the <a href="cityboard.html${t.query?'?'+esc(t.query):''}" target="_blank" rel="noopener">Class board</a> to see the leaderboard, groups, roles and flags.</p>`:''}
 </div></details>`;
 return s;}
function infoPanel(sim){const c=cs(sim);const tabs=[['score','Score the plans'],['real','Real places'],['how','How it’s built and sources']];
 let s=`<div class="seg" role="tablist" style="margin-bottom:10px;flex-wrap:wrap">${tabs.map(([k,l])=>`<button type="button" role="tab" data-tab="${k}" aria-selected="${c.tab===k}" aria-checked="${c.tab===k}">${l}</button>`).join('')}</div>`;
 if(c.tab==='real')return s+realTab(sim);if(c.tab==='how')return s+howTab();return s+scoreTab(sim);}
function makeCode(sim){const c=cs(sim),w=W(sim),b=build(sim),sc=allScores(sim);
 const hd={};ROWS.forEach(r=>{const x=c.hand[r.k];if(x)hd[r.k]={v:x.v===undefined?null:x.v,ok:!!x.ok,first:!!x.first,sh:!!x.shown,tr:x.tries||0};});
 const o={v:2,n:c.name.trim().slice(0,40),g:c.group.trim().slice(0,24),b,w,m:c.mode,lk:LOCK,a:Q.a||null,qw:Q.w?C.wKey(Q.w):null,gs:c.guess,ro:c.role||null,lv:BioLab.h.level||null,
  sc:C.r1(sc[4]),hd:hand(sim)?hd:null,rf:{v:(c.rf.values||'').slice(0,1500),i:(c.rf.impact||'').slice(0,1500),l:(c.rf.learned||'').slice(0,1500)},as:store.get().includes(C.wKey(w)),tm:Math.round((Date.now()-c.t0)/60000),d:new Date().toISOString().slice(0,10)};
 c.code=C.encode(o);}
const PLAIN=['GDP (money)','jobs','low housing cost','short commute','active minutes','clean air','low CO₂','life satisfaction','clean air on the worst-off block','least paved ground'];
const QS4=['How will people get around?','Where will the electricity come from?','What kind of homes will people live in?','Where will people work?','What will be on the rooftops?','Where will most of the food come from?'];
function startHTML(sim){const c=cs(sim),st=c.step,w=W(sim),b=build(sim),h=hand(sim),done=DEC.every(d=>c.chosen[d.k]);
 const dots=['Plan your city','How it compares','What matters','Guess and check','Reflect and send','Go deeper'].map((l,i)=>`<button type="button" class="btn${st===i+1?' primary':''}" data-sgo="${i+1}" ${i+1>1&&!done?'disabled':''} style="padding:4px 10px">${i+1}. ${l}</button>`).join('');
 let s=`<div class="row" style="justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px"><h3 style="margin:0">Start here</h3><div class="row" style="gap:4px;flex-wrap:wrap">${dots}</div></div>`;
 const next=(lbl,go)=>`<p style="margin:10px 0 0"><button type="button" class="btn primary" data-sgo="${go}">${lbl} →</button></p>`;
 if(st===1){s+=`<p style="margin:8px 0">You are planning a new neighborhood for 10,000 people on Colorado’s Front Range. Make one choice for each question. Your city appears in the picture just below this box, and it changes as you choose.</p>`;
  DEC.forEach((d,j)=>{s+=`<div style="margin:8px 0"><b>${j+1}. ${QS4[j]}</b><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:4px">${d.o.map(o=>`<button type="button" class="btn${c.chosen[d.k]&&b[j]===o.v?' primary':''}" data-pick="${d.k}" data-v="${o.v}">${esc(o.l)}</button>`).join('')}</div></div>`;});
  s+=done?next('See how your city compares',2):`<p style="margin:10px 0 0;color:var(--muted)">${DEC.length-DEC.filter(d=>c.chosen[d.k]).length} more to choose.</p>`;}
 else if(st===2){const v=C.ind(b),best=[],worst=[];
  M.forEach((m,i)=>{const all=[...PLANS.map(p=>C.ind(p.b)[i]),v[i]],bv=m.low?Math.min(...all):Math.max(...all),wv=m.low?Math.max(...all):Math.min(...all);if(Math.abs(v[i]-bv)<1e-9)best.push(PLAIN[i]);else if(Math.abs(v[i]-wv)<1e-9)worst.push(PLAIN[i]);});
  s+=`<p style="margin:8px 0">Look at the table under the picture. Your city is the bottom row (<b>★ Your build</b>). Above it are four ready-made plans. Each column measures something different. The shaded cells show which plan is best on that measure: <b>no plan wins them all</b>.</p>`;
  s+=`<ul style="margin:4px 0 0 18px;padding:0"><li>Your city is <b>best of the five</b> on: ${best.length?esc(best.join(', ')):'none yet'}.</li><li>Your city is <b>worst of the five</b> on: ${worst.length?esc(worst.join(', ')):'none'}.</li><li>GDP per person: <b>$${f0(v[0])}k</b>. Unhealthy-air days: <b>${f0(v[5])}</b>. Commute: <b>${f0(v[3])} minutes</b> a day. CO₂: <b>${f1(v[6])} tons</b> per person.</li></ul>`;
  s+=`<p style="margin:8px 0 0">So which city is “best”? That depends on what you count. Next you choose.</p>`+next('Choose what matters',3);}
 else if(st===3){s+=`<p style="margin:8px 0">A <b>scoreboard</b> says how much each measure counts. The weights (×0 to ×5) appear under each column of the table.</p>`;
  if(LOCK)s+=`<p><b>Your teacher set the scoreboard:</b> ${esc(boardName(w))}: ${esc(wText(w))}.</p>`;
  else{s+=`<p style="margin:4px 0"><b>Pick a scoreboard:</b></p><div class="row" style="gap:6px;flex-wrap:wrap">${PRESETS.filter(p=>atLeast('honors')||(p.k!=='fair'&&p.k!=='water')).map(p=>`<button type="button" class="btn${C.wKey(p.w)===C.wKey(w)?' primary':''}" data-spre="${p.k}">${esc(p.l)}</button>`).join('')}</div>`;
   s+=`<p style="margin:8px 0 4px"><b>Or see it through someone else’s eyes:</b></p><div class="row" style="gap:6px;flex-wrap:wrap">${ROLES.map(r=>`<button type="button" class="btn${c.role===r.k?' primary':''}" data-role="${r.k}">${esc(r.l)}</button>`).join('')}</div>`;
   s+=`<p style="margin:8px 0 0;color:var(--muted)">Now: ${esc(boardName(w))}: ${esc(wText(w))}.${c.role?' '+esc(ROLES.find(r=>r.k===c.role).why):''} In Full lab you can also set every weight yourself with the sliders.</p>`;}
  s+=next('Guess the winner',4);}
 else if(st===4){if(!c.guess){s+=`<p style="margin:8px 0">Under <b>${esc(boardName(w))}</b>, which one scores highest? Go with your gut before you see any scores.</p><div class="row" style="flex-wrap:wrap;gap:6px">${ROWS.map(r=>`<button type="button" class="btn" data-guess="${r.k}">${r.k==='Y'?'Your city':r.n}</button>`).join('')}</div>`;}
  else if(!h){const sc=allScores(sim),rk=ranks(sim),ti=rk.indexOf(1),gi=ROWS.findIndex(r=>r.k===c.guess);
   s+=`<p style="margin:8px 0"><b>${ROWS[ti].k==='Y'?'Your city':ROWS[ti].n}</b> is #1 under ${esc(boardName(w))} with ${f1(sc[ti])} points. ${c.guess===ROWS[ti].k?'Your gut was right.':`Your gut picked ${ROWS[gi].k==='Y'?'your city':ROWS[gi].n} (#${rk[gi]}).`} Your city scores ${f1(sc[4])} (#${rk[4]} of 5). The scores are in the right-hand column of the table.</p>`;
   s+=`<p style="margin:0">Try another scoreboard in step 3, or change your city in step 1, and guess again.</p>`+next('Reflect and send',5);}
  else{s+=`<p style="margin:8px 0">Your guess is locked: <b>${c.guess==='Y'?'your city':ROWS.find(r=>r.k===c.guess).n}</b>. Now work out each score yourself in <b>Score the plans</b> below the graph.</p><p><button type="button" class="btn primary" data-sjump>Work out the scores ↓</button></p>`;if(allDone(sim))s+=next('Reflect and send',5);}}
 else if(st===5){s+=reflectHTML(sim);}
 else{s+=`<p style="margin:8px 0">The panel below the graph has three tabs:</p><ul style="margin:4px 0 0 18px;padding:0"><li><b>Score the plans:</b> every scoreboard side by side${atLeast('honors')?', who breathes the worst air, the smart growth check and runoff':''}${atLeast('ap')?', plus trade-offs and pay now or later':''}.</li><li><b>Real places:</b> score real Front Range counties, and compare real cities around the world.</li><li><b>How it’s built and sources:</b> exactly how every number is made, and where the real data comes from.</li></ul><p><button type="button" class="btn primary" data-sjump>Go to the panel ↓</button> <button type="button" class="btn" data-sgo="1">Plan another city</button></p>`;}
 return s;}
function topW(w){const m=Math.max(...w);return m>0?M.filter((x,i)=>w[i]===m).map(x=>x.s).join(' and ')+' (×'+m+')':'nothing';}
function reflectHTML(sim){const c=cs(sim),w=W(sim),b=build(sim),v=C.ind(b),ready=hand(sim)?allDone(sim):!!c.revealed;
 const choices=DEC.map((d,j)=>C.opt(j,b[j]).l.toLowerCase()).join(', ');
 const Qs=[
  ['values','What values or opinions shaped your choices?',`You chose: ${choices}. Your scoreboard counted ${topW(w)} most. What did you value when you made those choices, and whose needs were you thinking about?`],
  ['impact','How might your city affect the environment around it?',`Your city: ${f0(v[5])} unhealthy-air days a year${atLeast('honors')?` (${f0(v[8])} on the worst-off block)`:''}, ${f1(v[6])} tons of CO₂ per person, and ${f0(v[9])}% of its land paved or roofed (streams are harmed above about 25%). Which of these reach past your city’s borders, through air, water or climate?`],
  ['learned','What is one thing you learned?','Did the winner change when the scoreboard changed? Did anything in Real places surprise you?']];
 let s=`<p style="margin:8px 0">Answer in a few sentences each. Use your numbers.</p>`;
 Qs.forEach(([k,q,hint],i)=>{s+=`<div style="margin:10px 0"><b>${i+1}. ${q}</b><p style="margin:2px 0 4px;color:var(--muted)">${esc(hint)}</p><textarea rows="3" data-rf="${k}" style="width:100%;box-sizing:border-box;padding:6px;font:inherit" aria-label="${esc(q)}">${esc(c.rf[k])}</textarea></div>`;});
 s+=`<h3 style="margin:12px 0 4px">Send to my teacher</h3>`;
 if(!ready)s+=`<p style="color:var(--muted)">${hand(sim)?'Work out every score first (step 4).':'Make your guess first (step 4).'} Then you can make your result code.</p>`;
 else{s+=`<div class="row" style="gap:6px;flex-wrap:wrap;align-items:center"><input type="text" data-name value="${esc(c.name)}" placeholder="Your name" aria-label="Your name" style="padding:4px 6px"><input type="text" data-group value="${esc(c.group)}" placeholder="Group (optional)" aria-label="Group" style="padding:4px 6px;width:9em"><button type="button" class="btn primary" data-mkcode>Make my result code</button><button type="button" class="btn" data-copyword>Copy for Word</button><span class="toast" data-wtoast hidden>Copied: paste it into Word</span></div>`;
  if(c.code)s+=`<p style="margin:6px 0 2px">Copy this code and paste it where your teacher said (a Canvas assignment or discussion). It includes your answers.</p><textarea readonly rows="3" style="width:100%;font-family:monospace;font-size:.85em" data-codebox>${esc(c.code)}</textarea><div class="row" style="gap:6px"><button type="button" class="btn" data-copycode>Copy</button><span class="toast" data-ctoast hidden>Copied</span></div>`;}
 s+=`<p style="margin:10px 0 0"><button type="button" class="btn" data-sgo="6">Go deeper →</button></p>`;
 return s;}
function wordText(sim){const c=cs(sim),w=W(sim),b=build(sim),v=C.ind(b),sc=allScores(sim),rk=ranks(sim),showS=hand(sim)?allDone(sim):!!c.revealed;
 const L=[];L.push('Score the city (Raider BioLab)');L.push('Name: '+(c.name||'')+(c.group?'   Group: '+c.group:''));L.push('');
 L.push('My city:');DEC.forEach((d,j)=>L.push('  '+d.l+': '+C.opt(j,b[j]).l));L.push('');
 L.push('How my city measures up:');M.forEach((m,i)=>L.push('  '+m.l+': '+m.f(v[i])));L.push('');
 L.push('Scoreboard: '+boardName(w)+' ('+wText(w)+')'+(c.role?'. Resident: '+ROLES.find(r=>r.k===c.role).l:''));
 if(showS){L.push('Scores:');ROWS.forEach((r,j)=>L.push('  '+(r.k==='Y'?'My city':r.n)+': '+f1(sc[j])+' (#'+rk[j]+')'));}
 L.push('');[['values','What values or opinions shaped your choices?'],['impact','How might your city affect the environment around it?'],['learned','What is one thing you learned?']].forEach(([k,q],i)=>{L.push((i+1)+'. '+q);L.push(c.rf[k]||'');L.push('');});
 return L.join('\n');}
function ensureStart(sim,el){const sec=el.closest('.sim');if(!sec)return;let card=sec.querySelector('.city-start');
 if(!card){card=document.createElement('div');card.className='panel city-start';card.style.cssText='margin-top:14px;border-left:5px solid var(--rj)';const bench=sec.querySelector('.bench');if(!bench)return;bench.parentNode.insertBefore(card,bench);
  if(!document.getElementById('city-start-css')){const st=document.createElement('style');st.id='city-start-css';st.textContent='.sim.m-guided:not(.g-done) .city-start,.sim.m-review .city-start,.sim.m-game .city-start{display:none}.city-start .btn[disabled]{opacity:.45;cursor:default}';document.head.appendChild(st);}}
 card.innerHTML=startHTML(sim);const c=cs(sim);
 card.querySelectorAll('[data-sgo]').forEach(b=>b.onclick=()=>{if(b.disabled)return;c.step=+b.dataset.sgo;sim.infoDirty=true;if(c.step===2){const bn=sec.querySelector('.bench');if(bn)setTimeout(()=>card.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'}),50);}});
 card.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const k=b.dataset.pick;c.chosen[k]=true;BioLab.setValues(sim,{[k]:b.dataset.v});sim.infoDirty=true;BioLab.refresh(sim);});
 card.querySelectorAll('[data-spre]').forEach(b=>b.onclick=()=>{preset(sim,b.dataset.spre);c.role=null;sim.infoDirty=true;BioLab.refresh(sim);});
 card.querySelectorAll('[data-sjump]').forEach(b=>b.onclick=()=>{c.tab='score';sim.infoDirty=true;setTimeout(()=>{const p=sec.querySelector('.panel.info');if(p)p.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});},60);});
 bindShared(sim,card);}
/* Buttons that work the same in the Start card and the panel. */
function bindShared(sim,el){const c=cs(sim);
 el.querySelectorAll('[data-rf]').forEach(t=>t.oninput=()=>{c.rf[t.dataset.rf]=t.value;c.code='';});
 const cw=el.querySelector('[data-copyword]');if(cw)cw.onclick=()=>{const t=wordText(sim),tt=el.querySelector('[data-wtoast]');const done=()=>{if(tt){tt.hidden=false;setTimeout(()=>tt.hidden=true,2500);}};try{navigator.clipboard.writeText(t).then(done,done);}catch(e){done();}};
 const nm=el.querySelector('[data-name]'),gr=el.querySelector('[data-group]');if(nm)nm.oninput=()=>{c.name=nm.value;};if(gr)gr.oninput=()=>{c.group=gr.value;};
 const mk=el.querySelector('[data-mkcode]');if(mk)mk.onclick=()=>{if(!c.name.trim()){if(nm){nm.focus();nm.placeholder='Type your name first';}return;}makeCode(sim);sim.infoDirty=true;};
 const cp=el.querySelector('[data-copycode]');if(cp)cp.onclick=()=>{const ta=el.querySelector('[data-codebox]'),tt=el.querySelector('[data-ctoast]');const done=()=>{if(tt){tt.hidden=false;setTimeout(()=>tt.hidden=true,1500);}};
  try{navigator.clipboard.writeText(c.code).then(done,()=>{ta.select();document.execCommand('copy');done();});}catch(e){ta.select();try{document.execCommand('copy');}catch(_){}done();}};
 el.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>{if(LOCK)return;const r=ROLES.find(x=>x.k===b.dataset.role);setW(sim,r.w);c.role=r.k;sim.infoDirty=true;BioLab.refresh(sim);});
 el.querySelectorAll('[data-guess]').forEach(b=>b.onclick=()=>{const g=b.dataset.guess;c.guess=g==='-'?null:g;if(!hand(sim)){c.revealed=true;markAuto(sim);}sim.infoDirty=true;BioLab.refresh(sim);});}
function bindInfo(sim,el){const c=cs(sim);
 ensureStart(sim,el);
 /* This tool's panel holds wide tables, so give it the full width under the graph. */
 const low=el.closest('.lower');if(low)low.style.gridTemplateColumns='minmax(0,1fr)';
 el.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{c.tab=b.dataset.tab;sim.infoDirty=true;});
 el.querySelectorAll('[data-cmode]').forEach(b=>b.onclick=()=>{if(LOCK)return;const m=b.dataset.cmode;if(m!==c.mode){c.mode=m;resetCalc(sim);BioLab.refresh(sim);}});
 bindShared(sim,el);
 el.querySelectorAll('[data-ans]').forEach(i=>i.oninput=()=>{const k=i.dataset.ans;c.hand[k]=Object.assign(c.hand[k]||{},{v:i.value});});
 el.querySelectorAll('[data-check]').forEach(b=>b.onclick=()=>{const k=b.dataset.check,x=c.hand[k]=c.hand[k]||{},inp=el.querySelector(`[data-ans="${k}"]`),raw=(inp?inp.value:x.v||'').replace(/[,\s]/g,'').replace('−','-');
  const v=parseFloat(raw);if(!Number.isFinite(v)){if(inp)inp.focus();return;}x.v=v;const ans=rowScore(sim,k),ok=Math.abs(v-ans)<=0.2+0.002*Math.abs(ans);
  if(ok){x.ok=true;x.first=!x.tries;}else{x.tries=(x.tries||0)+1;if(x.tries>=2)x.shown=true;}c.code='';sim.infoDirty=true;BioLab.refresh(sim);});
 el.querySelectorAll('[data-show]').forEach(b=>b.onclick=()=>{const k=b.dataset.show,x=c.hand[k]=c.hand[k]||{};x.shown=true;c.code='';sim.infoDirty=true;BioLab.refresh(sim);});
 const det=el.querySelector('[data-tdet]');if(det)det.addEventListener('toggle',()=>{c.teach.open=det.open;});
 el.querySelectorAll('[data-tcalc]').forEach(b=>b.onclick=()=>{c.teach.calc=b.dataset.tcalc;c.teach.link='';sim.infoDirty=true;});
 el.querySelectorAll('[data-tdepth]').forEach(b=>b.onclick=()=>{c.teach.depth=b.dataset.tdepth;if(!c.teach.depth)c.teach.dl=false;c.teach.link='';sim.infoDirty=true;});
 const dl=el.querySelector('[data-tdl]');if(dl)dl.onchange=()=>{c.teach.dl=dl.checked;c.teach.link='';sim.infoDirty=true;};
 const tr=el.querySelector('[data-trole]');if(tr)tr.onchange=()=>{c.teach.role=tr.value;c.teach.link='';if(tr.value)setW(sim,ROLES.find(r=>r.k===tr.value).w);sim.infoDirty=true;BioLab.refresh(sim);};
 const tm=el.querySelector('[data-tmake]');if(tm)tm.onclick=()=>{const t=c.teach,w=W(sim);t.a=tok();const q=new URLSearchParams();q.set('cw',w.join(','));if(t.calc==='hand')q.set('calc','hand');if(t.depth){q.set('level',t.depth);if(t.dl)q.set('dl','1');}if(t.role)q.set('role',t.role);q.set('a',t.a);
  const base=baseUrl(),clean=s=>s.replace(/%2C/g,',');t.query=clean(q.toString());q.set('mode','lab');t.link=base+'?'+clean(q.toString())+'#cityscore';const e=new URLSearchParams(q);e.set('embed','1');
  t.embed=`<iframe src="${base}?${clean(e.toString())}#cityscore" title="Score the city · Raider BioLab" width="100%" height="1600" style="border:0;max-width:1100px" allow="clipboard-write" loading="lazy"></iframe>`;sim.infoDirty=true;};}

/* ---------- the tool ---------- */
const WN=['GDP','Jobs','Housing cost','Commute','Active minutes','Unhealthy air (average)','CO₂','Life satisfaction','Worst-off block','Paved ground'];
const onW=sim=>{const c=cs(sim);if(!tourOn(sim))resetCalc(sim);const r=C.roleOf(W(sim));if(!LOCK)c.role=r?r.k:null;};
const onB=sim=>{const c=cs(sim);if(c.hand.Y)delete c.hand.Y;c.code='';};
const onB2=(k)=>sim=>{onB(sim);if(!tourOn(sim))cs(sim).chosen[k]=true;};
const costLine=(b,yr)=>{const x=C.costs(b);return x.up+x.yr*yr;};
const SIM={
 id:'cityscore',hash:'cityscore',apUnit:13,order:6,kind:'Simulation',tab:'Score the city: GDP vs. well-being',
 card:'Build a neighborhood, then score it ten ways: money, jobs, housing, commute, activity, air, carbon, happiness, fairness and runoff. Each measure crowns a different winner.',
 title:'Score the city: what makes a place “best”?',
 lede:{bio:'Every measure answers a different question. GDP counts money spent, not whether life got better. Build a neighborhood, pick a scoreboard, and see how the “best” plan changes with what you choose to count. Then compare real Front Range counties and real cities.',
  honors:'Each measure is turned into points from 0 (worst possible neighborhood) to 100 (best possible), then combined as a weighted average: score = Σ w·p ÷ Σ w. Look past the average: who breathes the worst air, how much ground is paved, and which smart growth principles a plan meets.',
  ap:'Some choices work together, so the best build is not always found one decision at a time. Check whether a build is beaten on every measure, how far one weight must move to change the winner, and when paying more up front pays back (APES Unit 5: urbanization, footprints, sustainability, runoff).'},
 scale:'One made-up neighborhood of 10,000 people on Colorado’s Front Range (an illustrative model), plus real Front Range counties and real world cities.',
 aspect:16/9,timeless:true,animated:true,trials:true,
 controlsTitle:'Your build and the scoreboard',
 controls:[
  ...DEC.map((d,j)=>({id:d.k,label:d.l,type:'seg',def:DEFB[j],onChange:onB2(d.k),options:d.o.map(o=>({v:o.v,l:o.l}))})),
  {id:'view',label:'Show the table as',type:'seg',def:'raw',lvl:'honors',options:[{v:'raw',l:'Real units'},{v:'pts',l:'Points (0 to 100)'}]},
  ...M.map((m,i)=>({id:'w'+i,label:'Weight: '+WN[i],type:'range',min:0,max:5,step:1,def:W0[i],unit:'',lvl:LOCK?'locked':(i>=8?'honors':'bio'),onChange:onW}))
 ],
 actions:LOCK?[]:PRESETS.map(p=>({id:'p_'+p.k,label:p.l,lvl:(p.k==='fair'||p.k==='water')?'honors':'bio',run(sim){preset(sim,p.k);}})),
 init(sim){cs(sim);return {};},
 step(){},
 metrics:[
  {id:'gdp',label:'GDP per person',unit:'$k',d:0,min:60,max:100,get:s=>C.ind(build(s))[0]},
  {id:'jobs',label:'Jobs per 100 residents',unit:'',d:0,min:45,max:70,get:s=>C.ind(build(s))[1]},
  {id:'rent',label:'Housing cost',unit:'% of income',d:0,min:20,max:45,get:s=>C.ind(build(s))[2]},
  {id:'commute',label:'Commute',unit:'min/day',d:0,min:20,max:75,get:s=>C.ind(build(s))[3]},
  {id:'active',label:'Active minutes',unit:'min/day',d:0,min:0,max:45,get:s=>C.ind(build(s))[4]},
  {id:'air',label:'Unhealthy-air days (average)',unit:'per year',d:0,min:0,max:45,get:s=>C.ind(build(s))[5]},
  {id:'co2',label:'CO₂ per person',unit:'t/yr',d:1,min:0,max:24,get:s=>C.ind(build(s))[6]},
  {id:'happy',label:'Life satisfaction',unit:'of 10',d:1,min:6,max:8,get:s=>C.ind(build(s))[7]},
  {id:'worst',label:'Bad-air days, worst-off block',unit:'per year',d:0,min:0,max:90,lvl:'honors',get:s=>C.ind(build(s))[8]},
  {id:'paved',label:'Paved or roofed ground',unit:'% of land',d:0,min:0,max:70,lvl:'honors',get:s=>C.ind(build(s))[9]},
  {id:'yscore',label:'Your build’s score',unit:'',d:1,min:0,max:100,get:s=>showRow(s,'Y')?rowScore(s,'Y'):null},
  {id:'harm',label:'GDP spent fixing harms',unit:'$k',d:1,lvl:'honors',min:0,max:20,get:s=>C.harm(build(s))},
  {id:'adj',label:'GDP minus spending on harms',unit:'$k',d:1,lvl:'honors',min:50,max:100,get:s=>C.ind(build(s))[0]-C.harm(build(s))},
  {id:'cost25',label:'Cost over 25 years (illustrative)',unit:'$k per resident',d:0,lvl:'ap',min:0,max:700,get:s=>C.costs(build(s)).t25},
  {id:'best',label:'Best possible build for this scoreboard',text:true,lvl:'ap',noTrial:true,get:s=>(hand(s)&&!allDone(s))?'Finish your calculations to see':C.wsum(W(s))?C.bLabel(C.best(W(s)).b)+' ('+f1(C.best(W(s)).s)+')':'Set a weight'}
 ],
 graphs:[{id:'scores',label:'Scores under this scoreboard',custom:true},{id:'boards',label:'Each plan’s rank on every scoreboard',custom:true},{id:'blocks',label:'Bad-air days on each block (your build)',lvl:'honors',custom:true},{id:'costs',label:'Pay now or pay later: cost over 25 years',lvl:'ap',custom:true}],defaultGraph:'scores',
 plot(sim,ctx,box,id){
  const lock=msg=>txt(ctx,msg,box.L+box.W/2,box.T+box.H/2,{s:14,c:PAL['muted'],a:'center',b:'middle'});
  if(id==='blocks'){const b=build(sim),v=C.ind(b),blk=C.blocks(b,v[5]),mx=Math.max(50,...blk)*1.15;const ax=axes(ctx,box,{xmin:0,xmax:5,ymin:0,ymax:mx,xl:'',yl:'Bad-air days a year',xcats:['Next to road/plant','Block 2','Block 3','Block 4','Farthest']});
   blk.forEach((d,i)=>{const x=ax.X(i+0.15),w=ax.X(i+0.85)-x;ctx.fillStyle=i===0?PAL['s1']:PAL['g-line'];ctx.fillRect(x,ax.Y(d),w,ax.Y(0)-ax.Y(d));txt(ctx,f0(d),x+w/2,ax.Y(d)-4,{s:12,w:700,a:'center',b:'bottom'});});
   ctx.strokeStyle=PAL['s4'];ctx.setLineDash([5,4]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(v[5]));ctx.lineTo(ax.X(5),ax.Y(v[5]));ctx.stroke();ctx.setLineDash([]);txt(ctx,'average '+f0(v[5]),ax.X(5)-4,ax.Y(v[5])-4,{s:12,w:700,c:PAL['s4'],a:'right',b:'bottom'});return;}
  if(id==='costs'){if(!answersOpen(sim))return lock(hand(sim)?'Work out every score to see this graph.':'Make your guess to see this graph.');
   const list=[...PLANS.map(p=>({n:p.n,b:p.b})),{n:'Yours',b:build(sim)}],mx=Math.max(...list.map(x=>costLine(x.b,25)))*1.08;const ax=axes(ctx,box,{xmin:0,xmax:25,ymin:0,ymax:mx,xl:'Years',yl:'$k per resident'});
   const cols=['s1','s5','s2','s3','s4'];list.forEach((x,j)=>{ctx.strokeStyle=PAL[cols[j]];ctx.lineWidth=j===4?3:2;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(costLine(x.b,0)));ctx.lineTo(ax.X(25),ax.Y(costLine(x.b,25)));ctx.stroke();});
   legend(ctx,box.L+8,box.T+6,list.map((x,j)=>({label:x.n,color:PAL[cols[j]]})));return;}
  if(id==='boards'){if(hand(sim)&&!allDone(sim))return lock('Work out every score to see this graph.');
   const ax=axes(ctx,box,{xmin:-0.5,xmax:PRESETS.length-0.5,ymin:4.5,ymax:0.5,xl:'',yl:'Rank (1 = best)',xcats:PRESETS.map(p=>p.l.split(' ')[0])});
   const cols=['s1','s5','s2','s3'];PLANS.forEach((p,j)=>{ctx.strokeStyle=PAL[cols[j]];ctx.lineWidth=2.5;ctx.beginPath();PRESETS.forEach((b,i)=>{const r=planRanks(b.w)[j],x=ax.X(i),y=ax.Y(r+(j-1.5)*0.04);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
    PRESETS.forEach((b,i)=>{const r=planRanks(b.w)[j];ctx.fillStyle=PAL[cols[j]];ctx.beginPath();ctx.arc(ax.X(i),ax.Y(r+(j-1.5)*0.04),4,0,7);ctx.fill();});});
   legend(ctx,box.L+8,box.T+6,PLANS.map((p,j)=>({label:p.n,color:PAL[cols[j]]})));return;}
  if(!showAll(sim))return lock(hand(sim)?'Work out every score to see the graph.':'Make your guess to see the scores.');
  const sc=allScores(sim),ax=axes(ctx,box,{xmin:0,xmax:5,ymin:0,ymax:100,xl:'',yl:'Score (points)',xcats:ROWS.map(r=>r.k==='Y'?'Yours':r.n)});
  sc.forEach((v,i)=>{const x=ax.X(i+0.15),w=ax.X(i+0.85)-x;ctx.fillStyle=ROWS[i].k==='Y'?PAL['s4']:PAL['g-line'];ctx.fillRect(x,ax.Y(v),w,ax.Y(0)-ax.Y(v));txt(ctx,f1(v),x+w/2,ax.Y(v)-4,{s:12,w:700,a:'center',b:'bottom'});});},
 draw(sim,ctx,vdt,k0,t){const k=Math.min(k0,1.5);ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);drawCity(sim,ctx,k,t||0);drawTable(sim,ctx,k);},
 infoPanel,bindInfo,
 narrate(sim){const v=C.ind(build(sim)),w=W(sim),c=cs(sim);
  const lead=M.map((m,i)=>i).filter(i=>{const r=(v[i]-C.MIN[i])/(C.MAX[i]-C.MIN[i]);return M[i].low?r<0.25:r>0.75;}).map(i=>M[i].s.toLowerCase());
  let s=`Your build: GDP <b>$${Math.round(v[0])}k</b> per person, <b>${Math.round(v[5])}</b> unhealthy-air days on average${atLeast('honors')?` (<b>${Math.round(v[8])}</b> on the worst-off block)`:''}, <b>${f1(v[6])} t</b> of CO₂ per person and a <b>${Math.round(v[3])}-minute</b> commute.`;
  s+=lead.length?` It does well on ${lead.join(', ')}.`:' It sits in the middle on most measures.';
  if(hand(sim)&&!allDone(sim))s+=' <b>Work out the scores</b> in the Score the plans panel.';
  else if(!c.revealed&&!hand(sim))s+=' Under <b>'+esc(boardName(w))+'</b>, which plan wins? Make your guess in the Score the plans panel.';
  else{const rk=ranks(sim);s+=` Under ${esc(boardName(w))}, <b>${ROWS[rk.indexOf(1)].n}</b> is #1.`;}
  return s;},
 lab:{bio:'<p><b>Question:</b> Can one neighborhood win every scoreboard?</p><ol><li>Press each scoreboard button (GDP only, Jobs and growth, Public health, Climate, Well-being). Guess the winner each time, then record a trial.</li><li>Build the neighborhood you would want to live in. Record its score under each scoreboard.</li><li>Open <b>Real places</b>. Where does Denver rank under your scoreboard? What can’t be measured there?</li></ol><p>Write two sentences: which scoreboard best matches what you care about, and what does it leave out?</p>',
  honors:'<p><b>Question:</b> Who carries the costs of a plan?</p><ol><li>For each plan, record average bad-air days and the worst-off block’s bad-air days. Which plan has the biggest gap?</li><li>Record GDP and <b>GDP spent fixing harms</b>. Calculate GDP minus harms. Does the order change?</li><li>Play two different residents. Record each one’s favorite plan.</li></ol><p>Explain why a city can raise its GDP and its asthma visits at the same time. Use the smart growth check to suggest one change.</p>',
  ap:'<p><b>Question:</b> What build is best for each scoreboard, and is the answer robust?</p><ol><li>Read <b>Best possible build</b> for three scoreboards.</li><li>Read <b>How fragile is #1?</b> Verify the break point by computing two plans’ scores by hand.</li><li>Use <b>Pay now or pay later</b>: solve for the year your build’s total cost equals Wide Roads’.</li></ol><p><b>CER:</b> Claim which indicator a city should report alongside GDP, with evidence from the model and from the real county data.</p>'},
 terms:[
  {t:'Gross domestic product (GDP)',d:'The market value of goods and services produced in a year. It counts money spent, including spending on fixing harms, and leaves out unpaid work, clean air and free time.'},
  {t:'Indicator',d:'A number that stands in for something we care about, such as unhealthy-air days for air quality.'},
  {t:'Weighted average',d:'Multiply each value by its weight, add, and divide by the total weight: Σ w·x ÷ Σ w.'},
  {t:'Smart growth',d:'Planning that concentrates growth in compact, walkable, mixed-use places with transportation choices and preserved open space (EPA’s 10 principles).',lvl:'honors'},
  {t:'Impervious surface',d:'Ground that rain cannot soak into: roads, parking lots, roofs. More of it means more and faster urban runoff.',lvl:'honors'},
  {t:'Environmental justice',d:'The fair treatment of all people in where pollution goes and who benefits from environmental protection.',lvl:'honors'},
  {t:'Defensive spending',d:'Money spent to repair or prevent harm (car crashes, pollution-related health care). It raises GDP without making life better.',lvl:'honors'},
  {t:'Dominated option',d:'An option that another option beats or ties on every measure. No set of weights should choose it.',lvl:'ap'},
  {t:'Sustainability',d:'Meeting today’s needs without reducing the ability of future generations to meet theirs.',lvl:'ap'}
 ],
 about:'<p><b>The model neighborhood is illustrative.</b> Each option adds a fixed amount to each measure, with bonuses for choices that work together; the amounts were chosen so each trend points the way research points. They are not measurements of any real place. The <b>Real places</b> tab uses measured data, and the <b>How it’s built and sources</b> tab explains every score and lists every source.</p>'+
 '<p><b>What is real.</b> In his 1934 report to Congress that created U.S. national income accounts, Simon Kuznets warned that a nation’s welfare can scarcely be inferred from national income (BEA, <i>Survey of Current Business</i>, June 2020). Bhutan measures Gross National Happiness across nine domains, including health, time use, community vitality and ecological diversity. The Denver Metro/North Front Range area is classified as a <b>Severe</b> ozone nonattainment area for the 2008 ozone standard (EPA, 2022).</p>'+
 '<p><b>Inspired by</b> Mytopia, a green city builder game made by Future Humber, Clay10 Creative and Edenic Group. This tool adds what Mytopia hides: the numbers, the weights, the math and real data.</p>'+
 '<p><b>Result codes</b> stay in your browser until you copy them. They hold your name, group, build, scoreboard, resident, how you scored (automatic or by hand, with your answers), whether this browser showed the automatic scores for the same scoreboard, and your time on the tool.</p>'
};
/* The tour and the quick questions name the winners of the preset scoreboards, so an assignment locked to By hand leaves them out. */
if(!LOCK){
 SIM.tour=[
  {title:'Your neighborhood',text:'This is the neighborhood you are building for 10,000 people: how they get around, where the electricity comes from, what homes look like, where people work, what is on the rooftops and where the food comes from. Change any choice and the picture and numbers change.',focus:[0,0,800,170],pause:true,setup:sim=>{const v={};DEC.forEach((d,j)=>v[d.k]=DEFB[j]);BioLab.setValues(sim,v);}},
  {title:'Ten measures',text:'Each column measures something different: money (GDP), jobs, housing cost, commute, active minutes, unhealthy-air days, CO₂, life satisfaction, the worst-off block’s air, and paved ground. Four ready-made plans sit above your build.',focus:[0,170,800,60],pause:true},
  {title:'Each measure has its own #1',text:'The shaded cells mark the best of the four plans on each measure. Tech Park has the highest GDP. Wide Roads has the most jobs and the cheapest housing. Main Street has the shortest commute and the happiest residents. Green Belt has the most activity, the cleanest air, the least CO₂ and the least pavement.',focus:[0,170,800,280],pause:true},
  {title:'A scoreboard is a choice',text:'GDP only puts weight 1 on GDP and 0 on everything else. Under it, Tech Park wins, even though it is near the bottom on commute, activity and happiness.',focus:[700,170,100,280],pause:true,setup:sim=>preset(sim,'gdp')},
  {title:'Change what counts',text:'Public health weights commute, activity and air. Now Green Belt is #1 and Wide Roads is last. The plans did not change. The scoreboard did.',focus:[700,170,100,280],pause:true,setup:sim=>preset(sim,'health')},
  {lvl:'honors',title:'Who breathes it?',text:'Averages hide who carries the cost. In Wide Roads, the average resident gets 44 unhealthy-air days a year, but the block next to the plant and the busiest road gets 88. Rent is cheapest there.',focus:[0,0,800,170],pause:true,setup:sim=>{BioLab.setValues(sim,{travel:'cars',power:'fossil',homes:'lots',jobs:'factory',roofs:'plain',food:'trucked'});preset(sim,'fair');}},
  {lvl:'honors',title:'GDP counts spending on harms',text:'Wide Roads’ $89k GDP includes about $18.8k per person of spending on car costs and health care tied to bad air. Read <b>GDP minus spending on harms</b>: money spent fixing problems raises GDP but does not make life better.',pause:true,setup:sim=>{BioLab.setValues(sim,{travel:'cars',power:'fossil',homes:'lots',jobs:'factory',roofs:'plain',food:'trucked'});preset(sim,'gdp');}}
 ];
 SIM.onTourExit=sim=>{const v={};M.forEach((m,i)=>v['w'+i]=W0[i]);DEC.forEach((d,j)=>v[d.k]=DEFB[j]);BioLab.setValues(sim,v);};
 SIM.challenges=function(){const g=PRESETS.find(p=>p.k==='gdp').w,hl=PRESETS.find(p=>p.k==='health').w,wb=PRESETS.find(p=>p.k==='wellbeing').w,names=PLANS.map(p=>p.n);
  const top=w=>{const s=PLANS.map(p=>C.score(p.b,w));return s.indexOf(Math.max(...s));};
  const cWins=WIN.filter((ks,i)=>i>0&&ks.includes('C')).length,cnt=[0,1,3,9];
  const harms=PLANS.map(p=>C.harm(p.b)),hi=harms.indexOf(Math.max(...harms));
  const A=C.ind(PLANS[0].b),blkA=C.blocks(PLANS[0].b,A[5]);
  const bb=C.best(wb).b,trv=DEC[0].o.map(o=>o.l);
  const gp=C.pts(PLANS[3].b),gs=C.score(PLANS[3].b,hl),wrong=[gs*5/7,(gp[3]+gp[4]+gp[5])/3*0.6,gs*0.82].map(f1);
  const ca=C.costs(PLANS[0].b),cd=C.costs(PLANS[3].b),pay=(cd.up-ca.up)/(ca.yr-cd.yr);
  return [
  {lvl:'bio',instant:true,q:'Under the GDP only scoreboard, which plan is #1?',choices:names,correct:top(g),explain:`${names[top(g)]} has the highest GDP, $${Math.round(C.ind(PLANS[top(g)].b)[0])}k per person. GDP only ignores the other nine measures.`},
  {lvl:'bio',instant:true,q:'Tech Park has the highest GDP. On how many of the other nine measures is it #1 of the four plans?',choices:cnt.map(String),correct:Math.max(0,cnt.indexOf(cWins)),explain:`${cWins}. Tech Park leads only on GDP. Its long commutes, few active minutes and low life satisfaction never show up in a GDP-only score.`},
  {lvl:'bio',instant:true,q:'Switch to the Public health scoreboard (commute, active minutes and unhealthy air). Which plan is #1?',choices:names,correct:top(hl),explain:`${names[top(hl)]} scores ${f1(C.score(PLANS[top(hl)].b,hl))}: rail and walkable streets, clean power and parks add up to the most activity and the fewest bad-air days.`},
  {lvl:'honors',instant:true,q:`Wide Roads averages ${f0(A[5])} unhealthy-air days a year. How many does its worst-off block get?`,choices:[f0(A[5]),f0(blkA[0]),f0(A[5]*0.5)],correct:1,explain:`${f0(blkA[0])}: twice the average. The block next to the coal and gas plant, the factory and the busiest road gets the most, and rent is cheapest there. An average can hide who carries the cost.`},
  {lvl:'honors',instant:true,q:'Which plan’s GDP includes the most spending on harms (car costs and health care tied to bad air)?',choices:names,correct:hi,explain:`${names[hi]}: about $${f1(harms[hi])}k per person, against $${f1(harms[1])}k for Main Street. That money counts in GDP even though it pays for problems.`},
  {lvl:'honors',instant:true,q:'Why turn every measure into points from 0 to 100 before combining them?',choices:['Points are more accurate than real units','The measures use different units (dollars, minutes, days, tons, percent), and some are better when lower; points put them on one scale','Points make every plan score higher'],correct:1,explain:'You cannot add dollars to minutes. Points rescale each measure so 100 is the best possible and 0 the worst possible, flipping measures where lower is better.'},
  {lvl:'ap',instant:true,q:'The best possible build for the Well-being scoreboard uses which way of getting around?',choices:trv,correct:DEC[0].o.findIndex(o=>o.v===bb[0]),explain:`Best build: ${C.bLabel(bb)}, scoring ${f1(C.best(wb).s)}. Rail and apartments over shops work together, so the search has to look at whole builds, not one decision at a time.`},
  {lvl:'ap',instant:true,q:`Green Belt costs $${f0(cd.up)}k per resident up front and $${f1(cd.yr)}k a year. Wide Roads costs $${f0(ca.up)}k up front and $${f1(ca.yr)}k a year. After about how many years has Green Belt cost less in total?`,choices:['Never','About '+f1(pay)+' years','About 25 years','It is cheaper from the start'],correct:1,explain:`Set ${f0(cd.up)} + ${f1(cd.yr)}t = ${f0(ca.up)} + ${f1(ca.yr)}t, so t = ${f0(cd.up-ca.up)} ÷ ${f1(ca.yr-cd.yr)} ≈ ${f1(pay)} years. Paying more up front can cost less over time. (Illustrative costs.)`},
  {lvl:'ap',instant:true,q:`Public health weights commute ×1, active minutes ×3 and unhealthy air ×3. Green Belt earns ${f1(gp[3])}, ${f1(gp[4])} and ${f1(gp[5])} points on those. What is its score?`,choices:[wrong[0],f1(gs),wrong[1],wrong[2]].map(String),correct:1,explain:`(1 × ${f1(gp[3])} + 3 × ${f1(gp[4])} + 3 × ${f1(gp[5])}) ÷ (1 + 3 + 3) = ${f1(gp[3]+3*gp[4]+3*gp[5])} ÷ 7 = ${f1(gs)}.`}];};
}
BioLab.register(SIM);
})();
