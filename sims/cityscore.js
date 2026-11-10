(function(){
'use strict';
const {clamp,txt,rr,PAL,FONT,axes,legend,atLeast,fmtNum,RM}=BioLab.h;
const C=window.CityModel;if(!C)return;
const {M,DEC,PLANS,PRESETS}=C;
/* Teacher links: ?cw=…&calc=hand&a=TOKEN (see city-model.js). With calc=hand the mode and the weights are locked. */
const Q=C.parseQS((()=>{try{return location.search;}catch(e){return '';}})());
const LOCK=Q.calc==='hand';
const W0=Q.w||PRESETS[0].w.slice();
const DEFB=['cars','mix','town','local'];
const ROWS=[...PLANS.map(p=>({k:p.k,n:p.n})),{k:'Y',n:'Your build'}];
const LS='rjcity-autoseen';
const store={get(){try{return JSON.parse(localStorage.getItem(LS)||'[]');}catch(e){return [];}},add(k){try{const a=store.get();if(!a.includes(k)){a.push(k);localStorage.setItem(LS,JSON.stringify(a.slice(-40)));}}catch(e){}}};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f1=v=>fmtNum(v,1);

function cs(sim){if(!sim.cs)sim.cs={mode:Q.calc||'auto',guess:null,revealed:false,hand:{},name:'',group:'',code:'',t0:Date.now(),teach:{calc:'auto',link:'',embed:''}};return sim.cs;}
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
const wText=w=>M.map((m,i)=>w[i]>0?m.s+' ×'+w[i]:null).filter(Boolean).join(', ')||'nothing (every weight is 0)';
const boardName=w=>{const p=C.presetOf(w);return p?p.l:'Custom scoreboard';};
function winners(){/* #1 of the four plans on each measure */
 return M.map((m,i)=>{const v=PLANS.map(p=>C.ind(p.b)[i]),bv=m.low?Math.min(...v):Math.max(...v);return PLANS.filter((p,j)=>Math.abs(v[j]-bv)<1e-9).map(p=>p.k);});}
const WIN=winners();
function ranks(sim){const s=allScores(sim);return s.map(x=>C.rankAmong(x,s));}
function planRanks(w){const s=PLANS.map(p=>C.score(p.b,w));return s.map(x=>C.rankAmong(x,s));}
function resetCalc(sim){const c=cs(sim);c.guess=null;c.revealed=false;c.hand={};c.code='';sim.infoDirty=true;}
function markAuto(sim){if(!hand(sim))store.add(C.wKey(W(sim)));}
function preset(sim,k){const p=PRESETS.find(p=>p.k===k);const v={};p.w.forEach((x,i)=>v['w'+i]=x);BioLab.setValues(sim,v);}
const tok=()=>{const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=a[Math.floor(Math.random()*a.length)];return s;};
function baseUrl(){try{return location.href.split('#')[0].split('?')[0].replace(/index\.html$/,'');}catch(e){return 'https://rjedtech.github.io/Raider-BioLab/';}}

/* ---------- drawing ---------- */
function turbine(ctx,x,g,h,t,c){ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,g);ctx.lineTo(x,g-h);ctx.stroke();const a=RM?0.4:t*2.2;ctx.lineWidth=2.5;
 for(let i=0;i<3;i++){const b=a+i*2*Math.PI/3;ctx.beginPath();ctx.moveTo(x,g-h);ctx.lineTo(x+Math.cos(b)*h*0.42,g-h+Math.sin(b)*h*0.42);ctx.stroke();}ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,g-h,3,0,7);ctx.fill();}
function smoke(ctx,x,y,t,n){for(let i=0;i<n;i++){const ph=((RM?0.5:t*0.35)+i/n)%1;ctx.fillStyle=`rgba(140,140,140,${0.55*(1-ph)})`;ctx.beginPath();ctx.arc(x+ph*40,y-ph*34,5+ph*10,0,7);ctx.fill();}}
function house(ctx,x,g,w,h,c,roof){ctx.fillStyle=c;ctx.fillRect(x,g-h,w,h);ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(x-3,g-h);ctx.lineTo(x+w/2,g-h-w*0.45);ctx.lineTo(x+w+3,g-h);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.75)';ctx.fillRect(x+w*0.2,g-h*0.65,w*0.22,h*0.25);ctx.fillRect(x+w*0.58,g-h*0.65,w*0.22,h*0.25);}
function tree(ctx,x,g,r){ctx.fillStyle='#7a5a3a';ctx.fillRect(x-2,g-r*1.2,4,r*1.2);ctx.fillStyle=PAL['cv-leaf'];ctx.beginPath();ctx.arc(x,g-r*1.5,r,0,7);ctx.fill();}
function windows(ctx,x,y,w,h,cols,rows){ctx.fillStyle='rgba(255,255,255,.7)';const cw=w/cols,rh=h/rows;for(let i=0;i<cols;i++)for(let j=0;j<rows;j++)ctx.fillRect(x+i*cw+cw*0.25,y+j*rh+rh*0.25,cw*0.5,rh*0.45);}
function drawCity(sim,ctx,k,t){const b=build(sim),v=C.ind(b),g=146,H=168;
 ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,800,H);
 /* the Front Range in the background */
 ctx.fillStyle=PAL['line'];ctx.beginPath();ctx.moveTo(0,g-40);[[60,g-70],[110,g-52],[170,g-88],[230,g-60],[300,g-80],[360,g-55],[440,g-76],[520,g-50],[600,g-84],[680,g-58],[740,g-72],[800,g-50]].forEach(p=>ctx.lineTo(p[0],p[1]));ctx.lineTo(800,g);ctx.lineTo(0,g);ctx.closePath();ctx.fill();
 /* haze: thicker with more unhealthy-air days */
 const hz=clamp((v[5]-C.MIN[5])/(C.MAX[5]-C.MIN[5]),0,1);ctx.fillStyle=`rgba(176,150,96,${0.05+0.42*hz})`;ctx.fillRect(0,0,800,g);
 ctx.fillStyle=PAL['cv-leaf2'];ctx.fillRect(0,g,800,H-g);
 /* electricity */
 if(b[1]==='fossil'){ctx.fillStyle='#6b6f78';ctx.fillRect(18,g-46,70,46);ctx.fillRect(96,g-30,50,30);ctx.fillStyle='#878b93';ctx.fillRect(40,g-92,12,46);ctx.fillRect(64,g-84,12,38);smoke(ctx,46,g-94,t,4);smoke(ctx,70,g-86,t+1.3,4);}
 else if(b[1]==='mix'){ctx.fillStyle='#6b6f78';ctx.fillRect(18,g-40,58,40);ctx.fillStyle='#878b93';ctx.fillRect(38,g-80,12,40);smoke(ctx,44,g-82,t,4);turbine(ctx,110,g,62,t,PAL['cv-ink']);turbine(ctx,148,g,54,t+0.7,PAL['cv-ink']);}
 else{turbine(ctx,36,g,70,t,PAL['cv-ink']);turbine(ctx,80,g,60,t+0.5,PAL['cv-ink']);turbine(ctx,122,g,66,t+1.1,PAL['cv-ink']);ctx.fillStyle='#2f5f9e';for(let i=0;i<4;i++){ctx.save();ctx.translate(20+i*36,g-6);ctx.transform(1,0,-0.4,1,0,0);ctx.fillRect(0,-12,30,12);ctx.restore();}}
 /* homes */
 if(b[2]==='lots'){[[192,'#c98b5b'],[268,'#8fa6c4'],[344,'#c9b26b']].forEach(([x,c])=>{ctx.fillStyle=PAL['cv-leaf'];ctx.fillRect(x-10,g-4,70,4);house(ctx,x,g,42,30,c,'#7d4b3b');ctx.fillStyle='#a9a9a9';ctx.fillRect(x+44,g-18,18,18);});}
 else if(b[2]==='town'){for(let i=0;i<7;i++)house(ctx,186+i*32,g,30,42,['#c98b5b','#b07a62','#c9b26b','#9b8fb8'][i%4],'#6d4234');}
 else{[[186,'#b4736a'],[262,'#8a9bb8'],[338,'#b59b62']].forEach(([x,c])=>{ctx.fillStyle=c;ctx.fillRect(x,g-88,66,88);windows(ctx,x,g-88,66,64,3,4);[PAL['s1'],PAL['s3'],PAL['s4']].forEach((a,i)=>{ctx.fillStyle=a;ctx.fillRect(x+4+i*21,g-24,18,6);});});}
 /* work */
 if(b[3]==='factory'){ctx.fillStyle='#7c7f86';ctx.fillRect(436,g-44,170,44);ctx.fillStyle='#93969d';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(436+i*34,g-44);ctx.lineTo(436+i*34,g-62);ctx.lineTo(470+i*34,g-44);ctx.closePath();ctx.fill();}ctx.fillStyle='#6b6f78';ctx.fillRect(588,g-96,12,52);smoke(ctx,594,g-98,t+0.6,4);}
 else if(b[3]==='office'){[[440,104,'#5d7fa8'],[492,128,'#4f6f96'],[548,96,'#6a8bb3']].forEach(([x,h,c])=>{ctx.fillStyle=c;ctx.fillRect(x,g-h,48,h);windows(ctx,x,g-h,48,h,3,7);});}
 else if(b[3]==='local'){for(let i=0;i<4;i++){const x=436+i*44;ctx.fillStyle=['#c98b5b','#9b8fb8','#c9b26b','#8fa6c4'][i];ctx.fillRect(x,g-40,40,40);ctx.fillStyle=[PAL['s1'],PAL['s3'],PAL['s2'],PAL['s4']][i];ctx.fillRect(x-2,g-28,44,7);ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(x+8,g-18,24,12);}
  for(let i=0;i<5;i++){const x=440+((i*37+(RM?0:t*8))%170);ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(x,g-9,2.5,0,7);ctx.fill();ctx.fillRect(x-1.5,g-7,3,7);}}
 else{ctx.fillStyle=PAL['cv-water'];ctx.beginPath();ctx.ellipse(520,g-10,46,9,0,0,7);ctx.fill();[446,470,580,606,630].forEach((x,i)=>tree(ctx,x,g,10+(i%2)*3));}
 /* extra trees: more where people are active */
 const nt=Math.round(2+5*clamp(v[4]/38,0,1));for(let i=0;i<nt;i++)tree(ctx,660+i*20,g,8+(i%3)*2);
 /* getting around, on the street */
 ctx.fillStyle='#4b4f57';ctx.fillRect(0,g+2,800,16);ctx.strokeStyle='rgba(255,255,255,.6)';ctx.setLineDash([10,10]);ctx.beginPath();ctx.moveTo(0,g+10);ctx.lineTo(800,g+10);ctx.stroke();ctx.setLineDash([]);
 const mv=(sp,ph)=>((RM?ph*97:t*sp+ph*97)%880)-40;
 if(b[0]==='cars'){for(let i=0;i<11;i++){const x=mv(70+(i%3)*12,i),y=i%2?g+4:g+11;ctx.fillStyle=['#c0392b','#2e86c1','#d4ac0d','#7f8c8d','#8e44ad'][i%5];rr(ctx,x,y,16,6,2);ctx.fill();}}
 else if(b[0]==='bus'){ctx.fillStyle=PAL['s4'];rr(ctx,mv(40,0),g+3,44,8,2);ctx.fill();ctx.fillStyle='#2e86c1';rr(ctx,mv(70,4),g+11,16,6,2);ctx.fill();ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,g+18);ctx.lineTo(800,g+18);ctx.stroke();
  for(let i=0;i<5;i++){const x=mv(28,i*1.7);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,g+20,2.5,0,7);ctx.arc(x+8,g+20,2.5,0,7);ctx.stroke();}}
 else{ctx.strokeStyle='#9a9a9a';ctx.lineWidth=1;for(let x=0;x<800;x+=10){ctx.beginPath();ctx.moveTo(x,g+4);ctx.lineTo(x,g+16);ctx.stroke();}ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,g+6);ctx.lineTo(800,g+6);ctx.moveTo(0,g+14);ctx.lineTo(800,g+14);ctx.stroke();
  ctx.fillStyle=PAL['s1'];const x0=mv(55,0);for(let i=0;i<3;i++){rr(ctx,x0+i*34,g+3,32,11,3);ctx.fill();}
  for(let i=0;i<7;i++){const x=mv(12,i*1.3);ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(x,g+20,2.2,0,7);ctx.fill();}}
 /* captions */
 const cap=(s,x)=>txt(ctx,s,x,6,{s:12*k,w:700,c:PAL['cv-ink'],b:'top'});
 if(k<1.25){cap(C.opt(1,b[1]).l,10);cap(C.opt(2,b[2]).l,186);cap(C.opt(3,b[3]).l,436);cap(C.opt(0,b[0]).l,650);}
 else{cap('Your build',10);}}
function drawTable(sim,ctx,k){const w=W(sim),T=176,big=k>1.15,fs=12*k,nameW=big?118:150,scW=big?92:96,cw=(792-nameW-scW)/8,x0=8;
 const view=atLeast('honors')&&sim.p.view==='pts';
 ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,T-6,800,450-T+6);
 const hh=2.3*fs+6,rh=(446-T-hh)/5;
 txt(ctx,big?'Plan':'Plan  ('+boardName(w)+')',x0+4,T+hh-4,{s:fs,w:700,c:PAL['cv-soft'],b:'bottom'});
 const SH=['GDP','Jobs','House','Comm.','Active','Air','CO₂','Happy'];M.forEach((m,i)=>{const x=x0+nameW+cw*(i+1)-6,on=w[i]>0;txt(ctx,big?SH[i]:m.s,x,T+hh-4-fs*1.1,{s:fs,w:on?700:400,c:on?PAL['cv-ink']:PAL['cv-soft'],a:'right',b:'bottom'});txt(ctx,'×'+w[i],x,T+hh-4,{s:fs,w:on?700:400,c:on?PAL['rj']:PAL['cv-soft'],a:'right',b:'bottom'});});
 txt(ctx,'Score',792-6,T+hh-4,{s:fs,w:700,a:'right',b:'bottom'});
 ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(8,T+hh);ctx.lineTo(792,T+hh);ctx.stroke();
 const sc=allScores(sim),rk=ranks(sim),c=cs(sim),G=c.guess;
 ROWS.forEach((r,j)=>{const y=T+hh+j*rh,yc=y+rh/2,b=rowB(sim,r.k),v=C.ind(b),p=C.pts(b);
  if(r.k==='Y'){ctx.fillStyle=PAL['card2'];ctx.fillRect(8,y+1,784,rh-2);}else if(j%2){ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(8,y,784,rh);}
  if(G===r.k){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2.5;rr(ctx,7,y+2,786,rh-4,6);ctx.stroke();}
  const nm=r.k==='Y'?(big?'Yours':'★ Your build'):(big?r.n:r.k+'  '+r.n);txt(ctx,nm,x0+6,yc,{s:fs,w:700,b:'middle'});
  M.forEach((m,i)=>{const x=x0+nameW+cw*(i+1)-6,win=r.k!=='Y'&&WIN[i].includes(r.k);
   if(win){ctx.fillStyle=PAL['s4'];ctx.globalAlpha=0.28;rr(ctx,x-cw+10,y+4,cw-6,rh-8,5);ctx.fill();ctx.globalAlpha=1;}
   txt(ctx,view?f1(p[i]):m.f(v[i]),x,yc,{s:fs,w:win?700:400,c:w[i]>0?PAL['cv-ink']:PAL['cv-soft'],a:'right',b:'middle'});});
  const sx=792-6;
  if(showRow(sim,r.k)){const all=showAll(sim);txt(ctx,f1(sc[j])+(all?'  #'+rk[j]:''),sx,yc,{s:fs,w:700,c:all&&rk[j]===1?PAL['rj']:PAL['cv-ink'],a:'right',b:'middle'});}
  else txt(ctx,'?',sx,yc,{s:fs*1.1,w:700,c:PAL['cv-soft'],a:'right',b:'middle'});});
 if(!big)txt(ctx,'Shaded: #1 of the four plans on that measure.',8,449,{s:11,c:PAL['cv-soft'],b:'bottom'});}

/* ---------- the student panel: gut, calculation, result code; the teacher's share box ---------- */
function handRows(sim){return ROWS;}
function prompt(sim,k){const w=W(sim),p=C.pts(rowB(sim,k)),used=M.map((m,i)=>i).filter(i=>w[i]>0);
 return used.map(i=>`${M[i].s} <b>${f1(p[i])}</b> × ${w[i]}`).join(', ');}
function steps(sim,k){const w=W(sim),p=C.pts(rowB(sim,k)),used=M.map((m,i)=>i).filter(i=>w[i]>0),W1=C.wsum(w);if(!W1)return 'Every weight is 0, so every score is 0.';
 const prods=used.map(i=>w[i]*p[i]),sum=prods.reduce((a,b)=>a+b,0);
 return `${used.map((i,n)=>w[i]+' × '+f1(p[i])+' = '+f1(prods[n])).join('; ')}. Add: ${f1(sum)}. Total weight: ${used.map(i=>w[i]).join(' + ')} = ${W1}. Score = ${f1(sum)} ÷ ${W1} = <b>${f1(sum/W1)}</b>.`;}
function compareTable(sim){const w=W(sim),cur=C.presetOf(w);const boards=[...PRESETS];if(!cur)boards.unshift({k:'cur',l:'This scoreboard',w});
 const head=boards.map(b=>`<th style="text-align:right;padding:3px 6px">${esc(b.l)}</th>`).join('');
 const body=PLANS.map(p=>`<tr><td style="padding:3px 6px"><b>${p.n}</b></td>${boards.map(b=>{const r=planRanks(b.w)[PLANS.indexOf(p)];return `<td style="text-align:right;padding:3px 6px;${r===1?'color:var(--rj);font-weight:700':''}">#${r}</td>`;}).join('')}</tr>`).join('');
 return `<div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:.92em"><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table></div>`;}
function resultLine(sim){const sc=allScores(sim),rk=ranks(sim),c=cs(sim),top=ROWS[rk.indexOf(1)];
 let s=`<p><b>${top.n}</b> is #1 under this scoreboard with ${f1(sc[rk.indexOf(1)])}. Your build scores ${f1(sc[4])} (#${rk[4]} of 5).</p>`;
 if(c.guess){const gi=ROWS.findIndex(r=>r.k===c.guess);s+=c.guess===top.k?`<p>Your gut was right: you read the weights the way the math does.</p>`:`<p>Your gut picked <b>${ROWS[gi].n}</b>, which ranks #${rk[gi]}, ${f1(sc[rk.indexOf(1)]-sc[gi])} points behind.</p>`;}
 const gdp=PLANS[[0,1,2,3].sort((a,b)=>C.ind(PLANS[b].b)[0]-C.ind(PLANS[a].b)[0])[0]];
 s+=`<p><b>Same plans, other scoreboards.</b> Each column ranks the four plans a different way. ${gdp.n} has the highest GDP; find where it lands on the others.</p>`+compareTable(sim);return s;}
function infoPanel(sim){const c=cs(sim),w=W(sim),W1=C.wsum(w),h=hand(sim);let s='';
 s+=`<h3>Score the plans</h3><p style="margin:.2em 0 .6em"><b>Scoreboard:</b> ${esc(boardName(w))}: ${esc(wText(w))}.${LOCK?' <span style="color:var(--muted)">(Set by your teacher.)</span>':''}</p>`;
 if(!LOCK)s+=`<div class="row" style="gap:8px;align-items:center;margin-bottom:8px"><span>Scores:</span><div class="seg" role="radiogroup"><button type="button" role="radio" data-cmode="auto" aria-checked="${!h}">Automatic</button><button type="button" role="radio" data-cmode="hand" aria-checked="${h}">By hand</button></div></div>`;
 else s+=`<p style="margin:.2em 0 .6em"><b>By hand:</b> your teacher wants you to work out every score yourself.</p>`;
 if(W1<=0)return s+'<p>Set at least one weight to make a scoreboard.</p>';
 if(!c.guess){s+=`<p><b>Step 1, your gut:</b> under this scoreboard, which one scores highest? Pick before you see any scores.</p><div class="row" style="flex-wrap:wrap;gap:6px">${ROWS.map(r=>`<button type="button" class="btn" data-guess="${r.k}">${r.k==='Y'?'Your build':r.k+': '+r.n}</button>`).join('')}</div>`;
  if(!h)s+=`<p style="margin-top:6px"><button type="button" class="btn" data-guess="-">Skip the guess and show the scores</button></p>`;}
 else if(!h){s+=resultLine(sim);}
 else{s+=`<p><b>Step 2, work it out:</b> score = (sum of weight × points) ÷ (sum of weights). Points run from 0 (worst possible neighborhood) to 100 (best possible). Round to one decimal.</p>`;
  ROWS.forEach(r=>{const x=c.hand[r.k]||{},done=x.ok||x.shown;
   s+=`<div style="border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin:6px 0"><p style="margin:0 0 4px"><b>${r.k==='Y'?'Your build':r.k+': '+r.n}</b>: ${prompt(sim,r.k)}</p>`;
   if(!done)s+=`<div class="row" style="gap:6px;align-items:center"><input type="text" inputmode="decimal" data-ans="${r.k}" value="${esc(x.v||'')}" aria-label="Score for ${esc(r.n)}" style="width:7em;padding:4px 6px"><button type="button" class="btn primary" data-check="${r.k}">Check</button><button type="button" class="btn" data-show="${r.k}">Show me</button>${x.tries?'<span style="color:var(--muted)">Not quite. Multiply each points value by its weight, add them, then divide by the total weight.</span>':''}</div>`;
   else s+=`<p style="margin:0">${x.ok?'<b>Right.</b> ':'<b>Here is how:</b> '}${steps(sim,r.k)}</p>`;s+='</div>';});
  if(allDone(sim))s+=resultLine(sim);}
 /* send to the teacher */
 const ready=h?allDone(sim):!!c.revealed;
 s+=`<h3 style="margin-top:14px">Send to my teacher</h3>`;
 if(!ready)s+=`<p style="color:var(--muted)">${h?'Work out every score first.':'Make your guess first.'} Then you can make a result code for your teacher.</p>`;
 else{s+=`<div class="row" style="gap:6px;flex-wrap:wrap;align-items:center"><input type="text" data-name value="${esc(c.name)}" placeholder="Your name" aria-label="Your name" style="padding:4px 6px"><input type="text" data-group value="${esc(c.group)}" placeholder="Group (optional)" aria-label="Group" style="padding:4px 6px;width:9em"><button type="button" class="btn primary" data-mkcode>Make my result code</button></div>`;
  if(c.code)s+=`<p style="margin:6px 0 2px">Copy this and paste it where your teacher said (a Canvas assignment or discussion):</p><textarea readonly rows="3" style="width:100%;font-family:monospace;font-size:.85em" data-codebox>${esc(c.code)}</textarea><div class="row" style="gap:6px"><button type="button" class="btn" data-copycode>Copy</button><span class="toast" data-ctoast hidden>Copied</span></div>`;}
 /* teacher share */
 const t=c.teach;
 if(!LOCK)s+=`<details style="margin-top:14px"${t.open?' open':''} data-tdet><summary><b>For teachers: assign this scoreboard</b></summary><div style="padding:6px 0">
  <p>Set the weights with the sliders (Full lab), or press a scoreboard button. Then choose how students score and make a link. Students who open your link see your scoreboard.</p>
  <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap"><span>Students score:</span><div class="seg" role="radiogroup"><button type="button" role="radio" data-tcalc="auto" aria-checked="${t.calc!=='hand'}">Automatic</button><button type="button" role="radio" data-tcalc="hand" aria-checked="${t.calc==='hand'}">By hand (locked)</button></div></div>
  <p style="margin:6px 0">${t.calc==='hand'?'<b>By hand (locked):</b> students cannot switch to Automatic or change your weights, and their result code records whether this browser showed the automatic scores for your scoreboard first.':'<b>Automatic:</b> the tool scores the plans after each student guesses.'}</p>
  <button type="button" class="btn primary" data-tmake>Make the link for ${esc(wText(w))}</button>
  ${t.link?`<p style="margin:8px 0 2px"><b>Link</b> (post it in Canvas):</p><textarea readonly rows="2" style="width:100%;font-size:.85em">${esc(t.link)}</textarea>
  <p style="margin:8px 0 2px"><b>Embed code</b> (Canvas page: Edit, then Insert, then Embed):</p><textarea readonly rows="3" style="width:100%;font-size:.85em">${esc(t.embed)}</textarea>
  <p style="margin:8px 0 0">Assignment code: <b>${esc(t.a)}</b>. Students paste their result codes into the Canvas assignment or discussion; copy them all into the <a href="cityboard.html${t.query?'?'+esc(t.query):''}" target="_blank" rel="noopener">Class board</a> to see the leaderboard, groups and flags.</p>`:''}
 </div></details>`;
 return s;}
function makeCode(sim){const c=cs(sim),w=W(sim),b=build(sim),sc=allScores(sim);
 const hd={};ROWS.forEach(r=>{const x=c.hand[r.k];if(x)hd[r.k]={v:x.v===undefined?null:x.v,ok:!!x.ok,first:!!x.first,sh:!!x.shown,tr:x.tries||0};});
 const o={v:1,n:c.name.trim().slice(0,40),g:c.group.trim().slice(0,24),b,w,m:c.mode,lk:LOCK,a:Q.a||null,qw:Q.w?C.wKey(Q.w):null,gs:c.guess,
  sc:C.r1(sc[4]),hd:hand(sim)?hd:null,as:store.get().includes(C.wKey(w)),tm:Math.round((Date.now()-c.t0)/60000),d:new Date().toISOString().slice(0,10)};
 c.code=C.encode(o);}
function bindInfo(sim,el){const c=cs(sim);
 el.querySelectorAll('[data-cmode]').forEach(b=>b.onclick=()=>{if(LOCK)return;const m=b.dataset.cmode;if(m!==c.mode){c.mode=m;resetCalc(sim);BioLab.refresh(sim);}});
 el.querySelectorAll('[data-guess]').forEach(b=>b.onclick=()=>{const g=b.dataset.guess;c.guess=g==='-'?null:g;if(!hand(sim)){c.revealed=true;markAuto(sim);}if(g==='-'&&hand(sim))return;sim.infoDirty=true;BioLab.refresh(sim);});
 el.querySelectorAll('[data-ans]').forEach(i=>i.oninput=()=>{const k=i.dataset.ans;c.hand[k]=Object.assign(c.hand[k]||{},{v:i.value});});
 el.querySelectorAll('[data-check]').forEach(b=>b.onclick=()=>{const k=b.dataset.check,x=c.hand[k]=c.hand[k]||{},inp=el.querySelector(`[data-ans="${k}"]`),raw=(inp?inp.value:x.v||'').replace(/[,\s]/g,'').replace('−','-');
  const v=parseFloat(raw);if(!Number.isFinite(v)){if(inp)inp.focus();return;}x.v=v;const ans=rowScore(sim,k),ok=Math.abs(v-ans)<=0.2+0.002*Math.abs(ans);
  if(ok){x.ok=true;x.first=!x.tries;}else{x.tries=(x.tries||0)+1;if(x.tries>=2)x.shown=true;}c.code='';sim.infoDirty=true;BioLab.refresh(sim);});
 el.querySelectorAll('[data-show]').forEach(b=>b.onclick=()=>{const k=b.dataset.show,x=c.hand[k]=c.hand[k]||{};x.shown=true;c.code='';sim.infoDirty=true;BioLab.refresh(sim);});
 const nm=el.querySelector('[data-name]'),gr=el.querySelector('[data-group]');if(nm)nm.oninput=()=>{c.name=nm.value;};if(gr)gr.oninput=()=>{c.group=gr.value;};
 const mk=el.querySelector('[data-mkcode]');if(mk)mk.onclick=()=>{if(!c.name.trim()){nm&&nm.focus();if(nm)nm.placeholder='Type your name first';return;}makeCode(sim);sim.infoDirty=true;};
 const cp=el.querySelector('[data-copycode]');if(cp)cp.onclick=()=>{const ta=el.querySelector('[data-codebox]'),tt=el.querySelector('[data-ctoast]');const done=()=>{if(tt){tt.hidden=false;setTimeout(()=>tt.hidden=true,1500);}};
  try{navigator.clipboard.writeText(c.code).then(done,()=>{ta.select();document.execCommand('copy');done();});}catch(e){ta.select();try{document.execCommand('copy');}catch(_){}done();}};
 const det=el.querySelector('[data-tdet]');if(det)det.addEventListener('toggle',()=>{c.teach.open=det.open;});
 el.querySelectorAll('[data-tcalc]').forEach(b=>b.onclick=()=>{c.teach.calc=b.dataset.tcalc;c.teach.link='';sim.infoDirty=true;});
 const tm=el.querySelector('[data-tmake]');if(tm)tm.onclick=()=>{const t=c.teach,w=W(sim);t.a=tok();const q=new URLSearchParams();q.set('cw',w.join(','));if(t.calc==='hand')q.set('calc','hand');q.set('a',t.a);
  const base=baseUrl();t.query=q.toString().replace(/%2C/g,',');q.set('mode','lab');t.link=base+'?'+q.toString().replace(/%2C/g,',')+'#cityscore';const e=new URLSearchParams(q);e.set('embed','1');
  t.embed=`<iframe src="${base}?${e.toString().replace(/%2C/g,',')}#cityscore" title="Score the city · Raider BioLab" width="100%" height="1500" style="border:0;max-width:1100px" allow="clipboard-write" loading="lazy"></iframe>`;sim.infoDirty=true;};}

/* ---------- the tool ---------- */
const WN=['GDP','Jobs','Housing cost','Commute','Active minutes','Unhealthy air','CO₂','Life satisfaction'];
const onW=sim=>{const c=cs(sim);if(hand(sim))resetCalc(sim);else c.code='';};
const onB=sim=>{const c=cs(sim);if(c.hand.Y)delete c.hand.Y;c.code='';};
const SIM={
 id:'cityscore',hash:'cityscore',apUnit:13,order:6,kind:'Simulation',tab:'Score the city: GDP vs. well-being',
 card:'Build a neighborhood, then score it eight ways: GDP, jobs, housing, commute, activity, air, carbon and happiness. Each measure crowns a different winner.',
 title:'Score the city: what makes a place “best”?',
 lede:{bio:'Every measure answers a different question. GDP counts money spent, not whether life got better. Build a neighborhood, pick a scoreboard, and see how the “best” plan changes with what you choose to count.',
  honors:'Each measure is turned into points from 0 (worst possible neighborhood) to 100 (best possible), then combined as a weighted average: score = Σ w·p ÷ Σ w. GDP also counts money spent fixing harms, such as car costs and health care tied to bad air.',
  ap:'The score is a sum of separate decisions, so the best build for any scoreboard picks the best option for each decision. Compare the sustainability trade-offs of urbanization (APES Unit 5) across indicators that measure different things.'},
 scale:'One made-up neighborhood of 10,000 people on Colorado’s Front Range. The numbers are an illustrative model, not a real city.',
 aspect:16/9,timeless:true,animated:true,trials:true,
 controlsTitle:'Your build and the scoreboard',
 controls:[
  ...DEC.map((d,j)=>({id:d.k,label:d.l,type:'seg',def:DEFB[j],onChange:onB,options:d.o.map(o=>({v:o.v,l:o.l}))})),
  {id:'view',label:'Show the table as',type:'seg',def:'raw',lvl:'honors',options:[{v:'raw',l:'Real units'},{v:'pts',l:'Points (0 to 100)'}]},
  ...M.map((m,i)=>({id:'w'+i,label:'Weight: '+WN[i],type:'range',min:0,max:5,step:1,def:W0[i],unit:'',lvl:LOCK?'locked':'bio',onChange:onW}))
 ],
 actions:LOCK?[]:PRESETS.map(p=>({id:'p_'+p.k,label:p.l,run(sim){preset(sim,p.k);}})),
 init(sim){cs(sim);return {};},
 step(){},
 metrics:[
  {id:'gdp',label:'GDP per person',unit:'$k',d:0,min:60,max:100,get:s=>C.ind(build(s))[0]},
  {id:'jobs',label:'Jobs per 100 residents',unit:'',d:0,min:45,max:70,get:s=>C.ind(build(s))[1]},
  {id:'rent',label:'Housing cost',unit:'% of income',d:0,min:20,max:45,get:s=>C.ind(build(s))[2]},
  {id:'commute',label:'Commute',unit:'min/day',d:0,min:20,max:70,get:s=>C.ind(build(s))[3]},
  {id:'active',label:'Active minutes',unit:'min/day',d:0,min:0,max:40,get:s=>C.ind(build(s))[4]},
  {id:'air',label:'Unhealthy-air days',unit:'per year',d:0,min:0,max:45,get:s=>C.ind(build(s))[5]},
  {id:'co2',label:'CO₂ per person',unit:'t/yr',d:1,min:0,max:23,get:s=>C.ind(build(s))[6]},
  {id:'happy',label:'Life satisfaction',unit:'of 10',d:1,min:6,max:8,get:s=>C.ind(build(s))[7]},
  {id:'yscore',label:'Your build’s score',unit:'',d:1,min:0,max:100,get:s=>showRow(s,'Y')?rowScore(s,'Y'):null},
  {id:'harm',label:'GDP spent fixing harms',unit:'$k',d:1,lvl:'honors',min:0,max:20,get:s=>C.harm(build(s))},
  {id:'adj',label:'GDP minus spending on harms',unit:'$k',d:1,lvl:'honors',min:50,max:100,get:s=>C.ind(build(s))[0]-C.harm(build(s))},
  {id:'best',label:'Best possible build for this scoreboard',text:true,lvl:'ap',noTrial:true,get:s=>(hand(s)&&!allDone(s))?'Finish your calculations to see':C.wsum(W(s))?C.bLabel(C.best(W(s)).b)+' ('+f1(C.best(W(s)).s)+')':'Set a weight'}
 ],
 graphs:[{id:'scores',label:'Scores under this scoreboard',custom:true},{id:'boards',label:'Each plan’s rank on every scoreboard',custom:true}],defaultGraph:'scores',
 plot(sim,ctx,box,id){
  if(id==='boards'){if(hand(sim)&&!allDone(sim)){txt(ctx,'Work out every score to see this graph.',box.L+box.W/2,box.T+box.H/2,{s:14,c:PAL['muted'],a:'center',b:'middle'});return;}
   const ax=axes(ctx,box,{xmin:-0.5,xmax:PRESETS.length-0.5,ymin:4.5,ymax:0.5,xl:'',yl:'Rank (1 = best)',xcats:PRESETS.map(p=>p.l.split(' ')[0])});
   const cols=['s1','s5','s2','s3'];PLANS.forEach((p,j)=>{ctx.strokeStyle=PAL[cols[j]];ctx.lineWidth=2.5;ctx.beginPath();PRESETS.forEach((b,i)=>{const r=planRanks(b.w)[j],x=ax.X(i),y=ax.Y(r+(j-1.5)*0.04);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
    PRESETS.forEach((b,i)=>{const r=planRanks(b.w)[j];ctx.fillStyle=PAL[cols[j]];ctx.beginPath();ctx.arc(ax.X(i),ax.Y(r+(j-1.5)*0.04),4,0,7);ctx.fill();});});
   legend(ctx,box.L+8,box.T+6,PLANS.map((p,j)=>({label:p.n,color:PAL[cols[j]]})));return;}
  if(!showAll(sim)){txt(ctx,hand(sim)?'Work out every score to see the graph.':'Make your guess to see the scores.',box.L+box.W/2,box.T+box.H/2,{s:14,c:PAL['muted'],a:'center',b:'middle'});return;}
  const sc=allScores(sim),ax=axes(ctx,box,{xmin:0,xmax:5,ymin:0,ymax:100,xl:'',yl:'Score (points)',xcats:ROWS.map(r=>r.k==='Y'?'Yours':r.n)});
  sc.forEach((v,i)=>{const x=ax.X(i+0.15),w=ax.X(i+0.85)-x;ctx.fillStyle=ROWS[i].k==='Y'?PAL['s4']:PAL['g-line'];ctx.fillRect(x,ax.Y(v),w,ax.Y(0)-ax.Y(v));txt(ctx,f1(v),x+w/2,ax.Y(v)-4,{s:12,w:700,a:'center',b:'bottom'});});},
 draw(sim,ctx,vdt,k0,t){const k=Math.min(k0,1.5);ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);drawCity(sim,ctx,k,t||0);drawTable(sim,ctx,k);},
 infoPanel,bindInfo,
 narrate(sim){const v=C.ind(build(sim)),w=W(sim),c=cs(sim);
  const lead=M.map((m,i)=>i).filter(i=>{const r=(v[i]-C.MIN[i])/(C.MAX[i]-C.MIN[i]);return M[i].low?r<0.25:r>0.75;}).map(i=>M[i].s.toLowerCase());
  let s=`Your build: GDP <b>$${Math.round(v[0])}k</b> per person, <b>${Math.round(v[5])}</b> unhealthy-air days, <b>${f1(v[6])} t</b> of CO₂ per person and a <b>${Math.round(v[3])}-minute</b> commute.`;
  s+=lead.length?` It does well on ${lead.join(', ')}.`:' It sits in the middle on most measures.';
  if(hand(sim)&&!allDone(sim))s+=' <b>Work out the scores</b> in the Score the plans panel.';
  else if(!c.revealed&&!hand(sim))s+=' Under <b>'+esc(boardName(w))+'</b>, which plan wins? Make your guess in the Score the plans panel.';
  else{const sc=allScores(sim),rk=ranks(sim);s+=` Under ${esc(boardName(w))}, <b>${ROWS[rk.indexOf(1)].n}</b> is #1.`;}
  return s;},
 lab:{bio:'<p><b>Question:</b> Can one neighborhood win every scoreboard?</p><ol><li>Press each scoreboard button (GDP only, Jobs and growth, Public health, Climate, Well-being). Guess the winner each time, then record a trial.</li><li>Build the neighborhood you would want to live in. Record its score under each scoreboard.</li></ol><p>Write two sentences: which scoreboard best matches what you care about, and what does it leave out?</p>',
  honors:'<p><b>Question:</b> How much of GDP is spending on problems?</p><ol><li>For each plan, record GDP and <b>GDP spent fixing harms</b>.</li><li>Calculate GDP minus harms. Does the order of the plans change?</li><li>Switch the table to <b>Points</b> and work out one plan’s Well-being score by hand.</li></ol><p>Explain why a city with more car crashes and more asthma visits can show a higher GDP.</p>',
  ap:'<p><b>Question:</b> What build is best for each scoreboard, and why?</p><ol><li>Read <b>Best possible build</b> for each scoreboard.</li><li>For one decision, show by calculation why that option wins: compare Σ w·Δp for each option.</li><li>Make your own scoreboard that matches a sustainability goal from APES Unit 5.</li></ol><p><b>CER:</b> Claim which indicator a city should report alongside GDP, with evidence from your trials.</p>'},
 terms:[
  {t:'Gross domestic product (GDP)',d:'The market value of goods and services produced in a year. It counts money spent, including spending on fixing harms, and leaves out unpaid work, clean air and free time.'},
  {t:'Indicator',d:'A number that stands in for something we care about, such as unhealthy-air days for air quality.'},
  {t:'Weighted average',d:'Multiply each value by its weight, add, and divide by the total weight: Σ w·x ÷ Σ w.'},
  {t:'Urbanization',d:'The growth of cities and the spread of built land, with effects on land use, air, water and carbon emissions.',lvl:'honors'},
  {t:'Defensive spending',d:'Money spent to repair or prevent harm (car crashes, pollution-related health care). It raises GDP without making life better.',lvl:'honors'},
  {t:'Sustainability',d:'Meeting today’s needs without reducing the ability of future generations to meet theirs.',lvl:'ap'}
 ],
 about:'<p><b>The neighborhood and its numbers are an illustrative model.</b> Each option adds a fixed amount to each measure; the amounts were chosen so each trend points the way research points (more driving means longer commutes, more emissions and less walking; coal and gas power means more bad-air days; offices raise GDP most). They are not measurements of any real place. Points: 100 × (value − worst possible) ÷ (best possible − worst possible), rounded to 0.1, across all 108 possible builds. Score = Σ w·p ÷ Σ w. “Spending on harms” = car costs ($10k per person for a car-centered build, $2k for buses, $1k for rail) + $0.2k per unhealthy-air day.</p>'+
 '<p><b>What is real.</b> In his 1934 report to Congress that created U.S. national income accounts, Simon Kuznets warned that a nation’s welfare can scarcely be inferred from national income (BEA, <i>Survey of Current Business</i>, June 2020). Bhutan measures Gross National Happiness across nine domains, including health, time use, community vitality and ecological diversity. The Denver Metro/North Front Range area is classified as a <b>Severe</b> ozone nonattainment area for the 2008 ozone standard (EPA, finalized October 7, 2022), which brought requirements such as cleaner-burning summer gasoline.</p>'+
 '<p><b>Inspired by</b> Mytopia, a green city builder game made by Future Humber, Clay10 Creative and Edenic Group. This tool adds what Mytopia hides: the numbers, the weights, and the math.</p>'+
 '<p><b>Result codes</b> stay in your browser until you copy them. They hold your name, group, build, scoreboard, how you scored (automatic or by hand, with your answers), whether this browser showed the automatic scores for the same scoreboard, and your time on the tool.</p>'
};
/* The tour and the quick questions name the winners of the preset scoreboards, so an assignment locked to By hand leaves them out. */
if(!LOCK){
 SIM.tour=[
  {title:'Your neighborhood',text:'This is the neighborhood you are building for 10,000 people: how they get around, where the electricity comes from, what homes look like and where people work. Change any choice and the picture and numbers change.',focus:[0,0,800,170],pause:true,setup:sim=>{const v={};DEC.forEach((d,j)=>v[d.k]=DEFB[j]);BioLab.setValues(sim,v);}},
  {title:'Eight measures',text:'Each column measures something different: money (GDP), jobs, housing cost, commute time, active minutes, unhealthy-air days, CO₂ and life satisfaction. Four ready-made plans sit above your build.',focus:[0,170,800,60],pause:true},
  {title:'Each measure has its own #1',text:'The shaded cells mark the best of the four plans on each measure. Tech Park has the highest GDP. Wide Roads has the most jobs and the cheapest housing. Main Street has the shortest commute and the happiest residents. Green Belt has the most activity, the cleanest air and the least CO₂.',focus:[0,170,800,280],pause:true},
  {title:'A scoreboard is a choice',text:'GDP only puts weight 1 on GDP and 0 on everything else. Under it, Tech Park wins, even though it is near the bottom on commute, activity and happiness.',focus:[690,170,110,280],pause:true,setup:sim=>preset(sim,'gdp')},
  {title:'Change what counts',text:'Public health weights commute, activity and air. Now Green Belt is #1 and Wide Roads is last. The plans did not change. The scoreboard did.',focus:[690,170,110,280],pause:true,setup:sim=>preset(sim,'health')},
  {lvl:'honors',title:'GDP counts spending on harms',text:'Wide Roads’ $89k GDP includes about $18.8k per person of spending on car costs and health care tied to bad air. Read <b>GDP minus spending on harms</b>: money spent fixing problems raises GDP but does not make life better.',pause:true,setup:sim=>{BioLab.setValues(sim,{travel:'cars',power:'fossil',homes:'lots',jobs:'factory'});preset(sim,'gdp');}}
 ];
 SIM.onTourExit=sim=>{const v={};M.forEach((m,i)=>v['w'+i]=W0[i]);DEC.forEach((d,j)=>v[d.k]=DEFB[j]);BioLab.setValues(sim,v);};
 SIM.challenges=function(){const g=PRESETS[0].w,hl=PRESETS[2].w,wb=PRESETS[4].w,names=PLANS.map(p=>p.n);
  const top=w=>{const s=PLANS.map(p=>C.score(p.b,w));return s.indexOf(Math.max(...s));};
  const cWins=WIN.filter((ks,i)=>i>0&&ks.includes('C')).length,cnt=[0,1,3,7];
  const harms=PLANS.map(p=>C.harm(p.b)),hi=harms.indexOf(Math.max(...harms));
  const bb=C.best(wb).b,trv=DEC[0].o.map(o=>o.l);
  const gp=C.pts(PLANS[3].b),gs=C.score(PLANS[3].b,hl),wrong=[gs*5/7,(gp[3]+gp[4]+gp[5])/3*0.6,gs*0.82].map(f1);
  return [
  {lvl:'bio',instant:true,q:'Under the GDP only scoreboard, which plan is #1?',choices:names,correct:top(g),explain:`${names[top(g)]} has the highest GDP, $${Math.round(C.ind(PLANS[top(g)].b)[0])}k per person. GDP only ignores the other seven measures.`},
  {lvl:'bio',instant:true,q:'Tech Park has the highest GDP. On how many of the other seven measures is it #1 of the four plans?',choices:cnt.map(String),correct:Math.max(0,cnt.indexOf(cWins)),explain:`${cWins}. Tech Park leads only on GDP. Its long commutes, few active minutes and low life satisfaction never show up in a GDP-only score.`},
  {lvl:'bio',instant:true,q:'Switch to the Public health scoreboard (commute, active minutes and unhealthy air). Which plan is #1?',choices:names,correct:top(hl),explain:`${names[top(hl)]} scores ${f1(C.score(PLANS[top(hl)].b,hl))}: rail and walkable streets, clean power and parks add up to the most activity and the fewest bad-air days.`},
  {lvl:'honors',instant:true,q:'Which plan’s GDP includes the most spending on harms (car costs and health care tied to bad air)?',choices:names,correct:hi,explain:`${names[hi]}: about $${f1(harms[hi])}k per person, against $${f1(harms[1])}k for Main Street. That money counts in GDP even though it pays for problems.`},
  {lvl:'honors',instant:true,q:'Why turn every measure into points from 0 to 100 before combining them?',choices:['Points are more accurate than real units','The measures use different units (dollars, minutes, days, tons), and some are better when lower; points put them on one scale','Points make every plan score higher'],correct:1,explain:'You cannot add dollars to minutes. Points rescale each measure so 100 is the best possible and 0 the worst possible, flipping measures where lower is better (commute, bad air, CO₂, housing cost).'},
  {lvl:'ap',instant:true,q:'The best possible build for the Well-being scoreboard uses which way of getting around?',choices:trv,correct:DEC[0].o.findIndex(o=>o.v===bb[0]),explain:`Best build: ${C.bLabel(bb)}, scoring ${f1(C.best(wb).s)}. The score is a sum of separate decisions, so each decision can be optimized on its own: pick the option with the largest Σ w·p for that decision.`},
  {lvl:'ap',instant:true,q:`Public health weights commute ×1, active minutes ×3 and unhealthy air ×3. Green Belt earns ${f1(gp[3])}, ${f1(gp[4])} and ${f1(gp[5])} points on those. What is its score?`,choices:[wrong[0],f1(gs),wrong[1],wrong[2]].map(String),correct:1,explain:`(1 × ${f1(gp[3])} + 3 × ${f1(gp[4])} + 3 × ${f1(gp[5])}) ÷ (1 + 3 + 3) = ${f1(gp[3]+3*gp[4]+3*gp[5])} ÷ 7 = ${f1(gs)}.`}];};
}
BioLab.register(SIM);
})();
