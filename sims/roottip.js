(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,legend,serColor,lvText,fmtNum}=BioLab.h;
/* Onion root tip mitosis lab: label cells in a stained squash, tally, compute mitotic index and phase times. */
const PH=['inter','pro','meta','ana','telo'];
const PNAME={inter:'Interphase',pro:'Prophase',meta:'Metaphase',ana:'Anaphase',telo:'Telophase'};
const PLET={inter:'I',pro:'P',meta:'M',ana:'A',telo:'T'};
const BASE={meristem:[0.86,0.065,0.03,0.015,0.03],elong:[0.985,0.008,0.003,0.002,0.002],cap:[0.996,0.002,0.001,0.0005,0.0005]};
const ZNAME={meristem:'Meristem (dividing zone)',elong:'Elongation zone',cap:'Root cap'};
function dist(zone,treat){const b=BASE[zone].slice();if(treat!=='colch')return b;
  // colchicine blocks spindle fibers: cells pile up in metaphase, few reach anaphase/telophase
  const meta=b[2]*5.5,ana=b[3]*0.3,telo=b[4]*0.3,pro=b[1];return [1-pro-meta-ana-telo,pro,meta,ana,telo];}
function pick(d,u){let a=0;for(let i=0;i<d.length;i++){a+=d[i];if(u<a)return PH[i];}return 'inter';}
/* class data set used for the challenges (fixed, so every student sees the same numbers) */
function classData(zone,treat,N){const d=dist(zone,treat);const c=d.map(x=>Math.round(x*N));c[0]=N-c.slice(1).reduce((a,b)=>a+b,0);return c;}
const CLASS_N=300;
const CTRL=classData('meristem','none',CLASS_N),COLCH=classData('meristem','colch',CLASS_N);
function chi2(obs,expP){const N=obs.reduce((a,b)=>a+b,0);let x=0;obs.forEach((o,i)=>{const e=expP[i]*N;if(e>0)x+=(o-e)*(o-e)/e;});return x;}
const CX=530,CY=226,R=206,CW=56,CHh=46;
function key(p){return p.zone+'|'+p.treat;}
function makeField(sim){const p=sim.p,s=sim.st;s.field++;const r=rng(s.field*7919+(p.zone==='meristem'?1:p.zone==='elong'?2:3)*31+(p.treat==='colch'?97:0));
  const d=dist(p.zone,p.treat),cells=[],edge=[];
  for(let row=0;row<10;row++)for(let col=0;col<10;col++){const x=CX-R+4+col*CW+(r()-.5)*4,y=CY-R+4+row*CHh+(r()-.5)*3;const cx=x+CW/2,cy=y+CHh/2;
    const dd=Math.hypot(cx-CX,cy-CY);if(dd>R+30)continue;if(dd>R-26){edge.push({x,y,w:CW-3-r()*3,h:CHh-3-r()*2,ph:pick(d,r()),rot:(r()-.5)*0.25,seed:Math.floor(r()*1e9),label:null});continue;}cells.push({i:cells.length,x,y,w:CW-3-r()*3,h:CHh-3-r()*2,ph:pick(d,r()),rot:(r()-.5)*0.25,seed:Math.floor(r()*1e9),label:null});}
  if(p.zone==='meristem'){['pro','meta','ana','telo'].forEach(ph=>{if(!cells.some(c=>c.ph===ph)){const c=cells.filter(c=>c.ph==='inter')[Math.floor(r()*30)%cells.filter(c=>c.ph==='inter').length];if(c)c.ph=ph;}});}
  s.cells=cells;s.edge=edge;s.sel=0;s.checked=false;sim.infoDirty=true;}
function tally(s,k){return s.tally[k]||(s.tally[k]={inter:0,pro:0,meta:0,ana:0,telo:0,right:0});}
function counts(s,k){const t=tally(s,k);return PH.map(ph=>t[ph]);}
function total(s,k){return counts(s,k).reduce((a,b)=>a+b,0);}
function labelSel(sim,ph){const s=sim.st,c=s.cells[s.sel];if(!c)return;const t=tally(s,key(sim.p));
  if(c.label){t[c.label]--;if(c.label===c.ph)t.right--;}
  c.label=ph;t[ph]++;if(ph===c.ph)t.right++;s.last={cell:c.i,ok:ph===c.ph,label:ph,truth:c.ph};nextCell(sim,true);}
function nextCell(sim,unl){const s=sim.st,n=s.cells.length;for(let j=1;j<=n;j++){const c=s.cells[(s.sel+j)%n];if(!unl||!c.label){s.sel=c.i;return;}}}
function countAll(sim){const s=sim.st;s.cells.forEach(c=>{if(c.label!==c.ph){s.sel=c.i;labelSel(sim,c.ph);}});s.last=null;}
const HINT={inter:'a round nucleus with a dark nucleolus and grainy chromatin, no separate chromosomes.',
  pro:'thick, thread-like chromosomes filling the nucleus, which is starting to break down.',
  meta:'chromosomes lined up in a single band across the middle of the cell.',
  ana:'two groups of chromosomes pulling apart toward opposite ends, often V-shaped.',
  telo:'two dense clumps at opposite ends, with a new cell plate forming between them.'};

/* ---- drawing ---- */
function squig(ctx,r,x,y,len,ang){ctx.beginPath();let px=x,py=y;ctx.moveTo(px,py);for(let k=0;k<5;k++){ang+=(r()-.5)*1.2;px+=Math.cos(ang)*len/5;py+=Math.sin(ang)*len/5;ctx.lineTo(px,py);}ctx.stroke();}
function drawCell(ctx,c,sel,show,k){const r=rng(c.seed),cx=c.x+c.w/2,cy=c.y+c.h/2;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(c.rot);
  rr(ctx,-c.w/2,-c.h/2,c.w,c.h,5);ctx.fillStyle='#f1e6f3';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#a993ba';ctx.stroke();
  const ink='#4b1d68',w=c.w,h=c.h;ctx.lineCap='round';ctx.lineJoin='round';
  if(c.ph==='inter'){ctx.fillStyle='#cfa8dd';ctx.beginPath();ctx.ellipse((r()-.5)*4,(r()-.5)*4,h*0.27,h*0.25,0,0,6.29);ctx.fill();ctx.strokeStyle='#9a6ab3';ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle='#8a55a6';for(let i=0;i<14;i++){const a=r()*6.28,d=r()*h*0.2;ctx.beginPath();ctx.arc(Math.cos(a)*d,Math.sin(a)*d,1.1,0,6.29);ctx.fill();}
    ctx.fillStyle=ink;ctx.beginPath();ctx.arc((r()-.5)*5,(r()-.5)*5,2.8,0,6.29);ctx.fill();}
  else if(c.ph==='pro'){ctx.fillStyle='rgba(190,150,210,.45)';ctx.beginPath();ctx.ellipse(0,0,h*0.32,h*0.3,0,0,6.29);ctx.fill();
    ctx.strokeStyle=ink;ctx.lineWidth=2.6;for(let i=0;i<8;i++)squig(ctx,r,(r()-.5)*h*0.4,(r()-.5)*h*0.36,h*0.26,r()*6.28);}
  else if(c.ph==='meta'){ctx.strokeStyle=ink;ctx.lineWidth=3;for(let i=0;i<8;i++){const y=-h*0.33+i*h*0.095,len=4+r()*5;ctx.beginPath();ctx.moveTo(-len/2+(r()-.5)*2,y);ctx.lineTo(len/2,y+(r()-.5)*2);ctx.stroke();}
    ctx.strokeStyle='rgba(120,80,150,.35)';ctx.lineWidth=1;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(-w*0.42,0);ctx.quadraticCurveTo(0,i*h*0.16,w*0.42,0);ctx.stroke();}}
  else if(c.ph==='ana'){ctx.strokeStyle=ink;ctx.lineWidth=2.6;[-1,1].forEach(sd=>{for(let i=0;i<6;i++){const y=-h*0.28+i*h*0.11,x=sd*(w*0.16+r()*3);ctx.beginPath();ctx.moveTo(x-sd*6,y-4);ctx.lineTo(x,y);ctx.lineTo(x-sd*6,y+4);ctx.stroke();}});}
  else{ctx.fillStyle=ink;[-1,1].forEach(sd=>{ctx.beginPath();ctx.ellipse(sd*w*0.3,(r()-.5)*3,w*0.11,h*0.27,0,0,6.29);ctx.fill();});
    ctx.strokeStyle='#a993ba';ctx.lineWidth=2;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(0,-h*0.42);ctx.lineTo(0,h*0.42);ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();
  if(c.label){const ok=c.label===c.ph;ctx.save();rr(ctx,c.x+2,c.y+2,c.w-4,c.h-4,5);ctx.strokeStyle=ok?'#1b8a4a':'#d97a00';ctx.lineWidth=2.5;ctx.stroke();ctx.restore();
    pill(ctx,PLET[c.label],c.x+c.w-9,c.y+9,ok?'#1b8a4a':'#d97a00','#fff',10*k);}
  if(show&&!c.label)pill(ctx,PLET[c.ph],c.x+9,c.y+9,'rgba(60,30,90,.8)','#fff',10*k);
  if(sel){ctx.save();rr(ctx,c.x-2,c.y-2,c.w+4,c.h+4,7);ctx.strokeStyle='#C11430';ctx.lineWidth=3.5;ctx.stroke();ctx.restore();}}
function cellRect(sim,ph){const s=sim.st;let c=s.cells.find(c=>c.ph===ph&&Math.hypot(c.x+c.w/2-CX,c.y+c.h/2-CY)<R-60)||s.cells.find(c=>c.ph===ph);if(!c)return null;return [c.x-14,c.y-14,c.w+28,c.h+28];}
function selPhase(sim,ph){const s=sim.st;const c=s.cells.find(c=>c.ph===ph&&Math.hypot(c.x+c.w/2-CX,c.y+c.h/2-CY)<R-60)||s.cells.find(c=>c.ph===ph);if(c)s.sel=c.i;sim.infoDirty=true;}

const ROOT={
  id:'roottip',hash:'roottip',apUnit:4,order:4,tab:'Onion root tip mitosis lab',kind:'Virtual lab',
  card:'Label dividing cells in a real-looking root tip squash, then calculate how long each phase of mitosis lasts.',
  title:'Onion root tip mitosis lab',
  lede:{bio:'Look at stained cells from the tip of an onion root. Decide which phase each cell is in, count them, and use your counts to figure out how long each phase lasts.',
        honors:'Compare different zones of the root. Where are cells dividing fastest, and how do you know from the mitotic index?',
        ap:'Treat a root with colchicine, a drug that stops spindle fibers. Use a chi-square test to decide whether it changes the distribution of phases.'},
  scale:'A squashed, stained onion root tip seen at about 600×. Each cell is about 20 µm across, and the whole field is about 0.4 mm wide.',
  prereq:['division','microscope'],next:['cellcycle'],
  timeless:true,aspect:16/9,
  controls:[
    {id:'zone',label:'Part of the root',type:'seg',def:'meristem',lvl:'honors',options:[{v:'cap',l:'Root cap'},{v:'meristem',l:'Meristem'},{v:'elong',l:'Elongation'}],
     help:'Move the slide to look at a different zone.',onChange(sim){makeField(sim);}},
    {id:'treat',label:'Root treatment',type:'seg',def:'none',lvl:'ap',options:[{v:'none',l:'Untreated'},{v:'colch',l:'Colchicine'}],
     help:'Colchicine stops spindle fibers from forming.',onChange(sim){makeField(sim);}},
    {id:'cycle',label:'Length of one cell cycle',type:'range',min:12,max:36,step:1,def:24,unit:' h',lvl:'honors',help:'Onion root cells divide about once a day at room temperature.'},
    {id:'answers',label:'Show answer key',type:'toggle',def:false,lvl:'bio',noTrial:true,help:'Letters on every cell: I, P, M, A, T'}
  ],
  actions:[
    {id:'li',label:'Interphase',run(sim){labelSel(sim,'inter');}},
    {id:'lp',label:'Prophase',run(sim){labelSel(sim,'pro');}},
    {id:'lm',label:'Metaphase',run(sim){labelSel(sim,'meta');}},
    {id:'la',label:'Anaphase',run(sim){labelSel(sim,'ana');}},
    {id:'lt',label:'Telophase',run(sim){labelSel(sim,'telo');}},
    {id:'next',label:'Next cell ›',run(sim){nextCell(sim,false);sim.st.last=null;}},
    {id:'all',label:'Count this field for me',run(sim){countAll(sim);}},
    {id:'field',label:'New field of view',run(sim){makeField(sim);}},
    {id:'clear',label:'Clear my counts',run(sim){sim.st.tally={};sim.st.cells.forEach(c=>c.label=null);sim.st.last=null;}}
  ],
  controlsTitle:'Label the selected cell',
  init(sim){return {field:0,cells:[],edge:[],sel:0,tally:{},last:null};},
  afterPrewarm(sim){makeField(sim);},
  step(){},
  onClick(sim,x,y){const s=sim.st;const c=s.cells.find(c=>x>=c.x&&x<=c.x+c.w&&y>=c.y&&y<=c.y+c.h);if(c){s.sel=c.i;s.last=null;}},
  metrics:[
    {id:'n',label:'Cells you counted',unit:'here',lvl:'bio',min:0,max:null,d:0,get:s=>total(s.st,key(s.p))},
    {id:'inter',label:'In interphase',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>{const n=total(s.st,key(s.p));return n?100*tally(s.st,key(s.p)).inter/n:NaN;}},
    {id:'mi',label:'Mitotic index',unit:'%',lvl:'bio',min:0,max:30,d:1,get:s=>{const n=total(s.st,key(s.p));return n?100*(n-tally(s.st,key(s.p)).inter)/n:NaN;}},
    {id:'tmeta',label:'Time in metaphase',unit:'min',lvl:'bio',min:0,max:240,d:0,get:s=>{const n=total(s.st,key(s.p));return n?tally(s.st,key(s.p)).meta/n*s.p.cycle*60:NaN;}},
    {id:'acc',label:'Your accuracy',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>{const n=total(s.st,key(s.p));return n?100*tally(s.st,key(s.p)).right/n:NaN;}},
    {id:'chi',label:'χ² colchicine vs. control',unit:'df = 4',lvl:'ap',min:0,max:null,d:1,get:s=>{const a=counts(s.st,'meristem|none'),b=counts(s.st,'meristem|colch');
      const na=a.reduce((x,y)=>x+y,0),nb=b.reduce((x,y)=>x+y,0);if(na>=30&&nb>=30)return chi2(b,a.map(x=>x/na));return chi2(COLCH,CTRL.map(x=>x/CLASS_N));}}
  ],
  graphs:[{id:'tally',label:'Your counts by phase',custom:true},{id:'zones',label:'Mitotic index by zone',lvl:'honors',custom:true},{id:'compare',label:'Control vs. colchicine (class data)',lvl:'ap',custom:true}],
  defaultGraph:'tally',
  plot(sim,ctx,box,id){const s=sim.st;
    if(id==='tally'){const k=key(sim.p),c=counts(s,k),n=c.reduce((a,b)=>a+b,0);const v=c.map(x=>n?100*x/n:0);
      const ax=axes(ctx,box,{xmin:0,xmax:5,ymin:0,ymax:100,xcats:PH.map(p=>PNAME[p]),yl:'% of cells counted'});bars(ctx,ax,v,{colors:[serColor(1),serColor(4),serColor(0),serColor(3),serColor(2)],d:0});
      if(!n)txt(ctx,'Label some cells to fill in this graph.',box.L+box.W/2,box.T+box.H/2,{s:15,c:PAL['muted'],a:'center'});}
    else if(id==='zones'){const z=['cap','meristem','elong'],v=z.map(zz=>{const k=zz+'|'+sim.p.treat,n=total(s,k);return n?100*(n-tally(s,k).inter)/n:0;});
      const ax=axes(ctx,box,{xmin:0,xmax:3,ymin:0,ymax:Math.max(20,...v)*1.15,xcats:['Root cap','Meristem','Elongation'],yl:'Mitotic index (%)'});bars(ctx,ax,v,{colors:[serColor(3),serColor(0),serColor(1)],d:1});
      txt(ctx,'Count cells in each zone to compare.',box.L+box.W-4,box.T+12,{s:12,c:PAL['muted'],a:'right'});}
    else{const ax=axes(ctx,box,{xmin:0,xmax:5,ymin:0,ymax:100,xcats:PH.map(p=>PNAME[p]),yl:'% of 300 cells'});
      const w=0.34;[CTRL,COLCH].forEach((d,j)=>{d.forEach((v,i)=>{const pc=100*v/CLASS_N,x0=ax.X(i+0.5+(j?0.02:-w-0.02)),x1=ax.X(i+0.5+(j?w+0.02:-0.02));ctx.fillStyle=serColor(j?0:1);ctx.fillRect(x0,ax.Y(pc),x1-x0,ax.Y(0)-ax.Y(pc));txt(ctx,pc.toFixed(0),(x0+x1)/2,ax.Y(pc)-4,{s:11,c:PAL['fg'],a:'center'});});});
      legend(ctx,box.L+box.W-230,box.T+10,[{label:'Untreated',color:serColor(1)},{label:'Colchicine',color:serColor(0)}]);}},
  infoPanel(sim){const s=sim.st,c=s.cells[s.sel],k=key(sim.p),t=tally(s,k),n=total(s,k),cyc=sim.p.cycle;let h='';
    if(s.last){const L=s.last;h+=L.ok?`<p class="verdict ok">Cell ${L.cell+1}: ${PNAME[L.label]}. Correct.</p>`:`<p class="verdict no">Cell ${L.cell+1}: you said ${PNAME[L.label]}, but it is in ${PNAME[L.truth]}.</p><p>Look for ${HINT[L.truth]}</p>`;}
    h+=`<h3>Cell ${c?c.i+1:'–'} of ${s.cells.length}${c&&c.label?` · labeled ${PNAME[c.label]}`:''}</h3><p>What to look for: <b>I</b> ${HINT.inter} <b>P</b> ${HINT.pro} <b>M</b> ${HINT.meta} <b>A</b> ${HINT.ana} <b>T</b> ${HINT.telo}</p>`;
    h+=`<div class="tbl-wrap"><table><thead><tr><th>Phase</th><th>Count</th><th>% of cells</th><th>Time (${cyc} h cycle)</th></tr></thead><tbody>${PH.map(ph=>{const f=n?t[ph]/n:0,m=f*cyc*60;return `<tr><td>${PNAME[ph]}</td><td>${t[ph]}</td><td>${n?(100*f).toFixed(0):'–'}</td><td>${n?(m>=90?(m/60).toFixed(1)+' h':m.toFixed(0)+' min'):'–'}</td></tr>`;}).join('')}<tr><td><b>Total</b></td><td><b>${n}</b></td><td></td><td></td></tr></tbody></table></div>`;
    if(atLeast('ap')){const x=ROOT.metrics.find(m=>m.id==='chi').get(sim);h+=`<p style="margin-top:8px">χ² = <b>${x.toFixed(1)}</b> (df = 4; critical value 9.49 at p = 0.05). ${x>9.49?'The difference is statistically significant.':'The difference could be due to chance.'} ${total(s,'meristem|none')>=30&&total(s,'meristem|colch')>=30?'Using your counts.':'Using class data until you count at least 30 cells in each.'}</p>`;}
    return h;},
  narrate(sim){const s=sim.st,k=key(sim.p),n=total(s,k),z=sim.p.zone;
    if(!n)return 'Select a cell (it has a red outline) and decide which phase it is in. Most cells will be in <b>interphase</b>: the long growing stage between divisions.';
    const mi=100*(n-tally(s,k).inter)/n;let t=`You have counted <b>${n} cells</b> here. Mitotic index: <b>${mi.toFixed(1)}%</b> of cells are dividing.`;
    if(atLeast('honors')&&z!=='meristem')t+=` This is the ${ZNAME[z].toLowerCase()}, where cells ${z==='elong'?'are growing longer':'protect the tip'} and rarely divide.`;
    else if(sim.p.treat==='colch')t+=' Colchicine stops spindle fibers, so cells get stuck in metaphase and pile up there.';
    else if(n<40)t+=' Count at least 50 cells, across more than one field of view, for reliable percentages.';
    else t+=' The share of cells in a phase tells you the share of the cycle that phase takes.';
    return t;},
  tour:[
    {title:'The root tip',text:{bio:'This is the tip of a growing onion root. Near the very end, just behind the protective cap, cells divide over and over to make the root longer.',honors:'From the tip up: the root cap protects the tip, the meristem just behind it is where cells divide, and in the elongation zone the new cells stretch.'},focus:[6,14,250,420],pause:true,setup(sim){BioLab.setValues(sim,{zone:'meristem'});}},
    {title:'Under the microscope',text:'The root was squashed flat on a slide and stained, so the DNA shows up dark purple. Each box is one cell, outlined by its cell wall.',focus:[CX-R-4,CY-R-4,2*R+8,2*R+8],pause:true},
    {title:'Interphase',text:'Most cells look like this: a round nucleus with a dark nucleolus. The DNA is loose, so no chromosomes are visible. The cell is growing and copying its DNA.',focus:sim=>cellRect(sim,'inter'),pause:true,setup(sim){selPhase(sim,'inter');}},
    {title:'Prophase',text:'The DNA coils up into thick threads: chromosomes you can see. The nucleus is breaking down.',focus:sim=>cellRect(sim,'pro'),pause:true,setup(sim){selPhase(sim,'pro');}},
    {title:'Metaphase',text:'The chromosomes line up in a single band across the middle of the cell, held by spindle fibers.',focus:sim=>cellRect(sim,'meta'),pause:true,setup(sim){selPhase(sim,'meta');}},
    {title:'Anaphase',text:'Sister chromatids are pulled apart toward opposite ends. They often look like V shapes, bent around the point where the spindle fiber pulls.',focus:sim=>cellRect(sim,'ana'),pause:true,setup(sim){selPhase(sim,'ana');}},
    {title:'Telophase',text:'Two dense clumps of chromosomes sit at opposite ends, and a new cell plate starts to form between them. Soon there will be two cells.',focus:sim=>cellRect(sim,'telo'),pause:true,setup(sim){selPhase(sim,'telo');}},
    {title:'From counts to time',text:'If 3% of the cells are in metaphase, metaphase takes about 3% of the cell cycle: 0.03 × 24 h ≈ 43 minutes. The mitotic index is the share of cells in any stage of mitosis.',focus:[CX-R-4,CY-R-4,2*R+8,2*R+8],pause:true}
  ],
  onTourExit(sim){sim.st.last=null;},
  challenges(sim){const cyc=24,N=CLASS_N,m=CTRL[2],mi=N-CTRL[0];
    const tm=Math.round(m/N*cyc*60);
    return [
      {lvl:'bio',instant:true,q:'Look across the field of view. Which phase holds the most cells?',choices:['Interphase','Prophase','Metaphase','Anaphase'],correct:0,
       explain:'Cells spend most of the cell cycle in interphase, growing and copying their DNA. Mitosis itself is quick, so at any moment only a small share of cells are dividing.'},
      {lvl:'bio',instant:true,q:`A class counted ${N} cells and found ${m} in metaphase. The cell cycle lasts 24 hours. About how long does metaphase last?`,
       choices:[`${tm} minutes`,`${m} minutes`,`${(m/N*100).toFixed(0)} hours`,`${(24/m).toFixed(1)} hours`],correct:0,
       explain:`The fraction of cells in a phase equals the fraction of time spent in it: ${m} ÷ ${N} × 24 h × 60 = about ${tm} minutes.`},
      {lvl:'bio',instant:true,q:`${N} cells were counted, and ${mi} were in some stage of mitosis. What is the mitotic index?`,
       choices:[`${(100*mi/N).toFixed(0)}%`,`${(100*CTRL[0]/N).toFixed(0)}%`,`${mi}%`,`${(N/mi).toFixed(1)}%`],correct:0,
       explain:`Mitotic index = cells in mitosis ÷ total cells = ${mi} ÷ ${N} = ${(100*mi/N).toFixed(0)}%.`},
      {lvl:'honors',instant:true,q:'Which part of the root tip has the highest mitotic index?',choices:['Root cap','Meristem','Elongation zone'],correct:1,
       explain:'The meristem, just behind the root cap, is where cells divide. In the elongation zone cells stop dividing and stretch; the root cap cells are protective and are worn away. Count cells in each zone to see it.'},
      {lvl:'honors',instant:true,q:'Your counts stay the same, but you learn the cell cycle lasts 12 hours, not 24. What happens to your calculated time for each phase?',
       choices:['Every phase takes half as long','Every phase takes twice as long','Only interphase changes'],correct:0,
       explain:'Time in a phase = fraction of cells × cycle length. The fractions don’t change, so halving the cycle halves every phase. Try the cycle-length slider.'},
      {lvl:'ap',instant:true,q:'Colchicine stops spindle fibers from forming. Compared with an untreated root, what happens to the fraction of cells in metaphase?',
       choices:['It rises sharply','It falls to zero','It stays the same'],correct:0,
       explain:`Cells reach metaphase but can’t separate their chromosomes, so they pile up there. In the class data, metaphase rises from ${(100*CTRL[2]/N).toFixed(0)}% to ${(100*COLCH[2]/N).toFixed(0)}%, and anaphase and telophase nearly vanish.`},
      (()=>{const x=chi2(COLCH,CTRL.map(v=>v/N));return {lvl:'ap',instant:true,
       q:`Using the untreated counts as expected proportions, the colchicine-treated root gives χ² = ${x.toFixed(1)} with df = 4. The critical value at p = 0.05 is 9.49. What do you conclude?`,
       choices:['Reject the null hypothesis: colchicine changes the distribution of phases','Fail to reject the null: the difference could be chance'],correct:x>9.49?0:1,
       explain:'χ² is far above 9.49, so a difference this large would happen by chance less than 5% of the time. With 5 categories, df = 5 − 1 = 4.'};})()
    ];},
  lab:{bio:'<p><b>Question:</b> How long does each phase of mitosis last?</p><ol><li>Label every cell in this field, then press New field of view and label at least one more field (aim for 50+ cells).</li><li>Use the table under the picture: % of cells in each phase × 24 h.</li><li>Press Record trial to save your totals.</li></ol><p>Which phase is longest? Which is shortest? Explain why most cells are in interphase.</p>',
       honors:'<p><b>Question:</b> Where in the root are cells dividing?</p><ol><li>Count at least 40 cells in each zone: root cap, meristem and elongation.</li><li>Record a trial for each zone.</li><li>Switch the graph to Mitotic index by zone.</li></ol><p>Explain how the pattern of division makes a root grow longer.</p>',
       ap:'<p><b>Question:</b> Does colchicine change the cell cycle?</p><ol><li>Count at least 30 meristem cells untreated, then 30 with colchicine.</li><li>Use the untreated percentages as expected values and calculate χ² for the treated counts (df = 4).</li><li>Compare with the χ² readout and the class data graph.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain the result in terms of spindle fibers and the metaphase checkpoint.</p>'},
  terms:[{t:'Interphase',d:'The long stage between divisions when the cell grows and copies its DNA.'},{t:'Mitosis',d:'Division of the nucleus: prophase, metaphase, anaphase, telophase.'},{t:'Mitotic index',d:'The percentage of cells that are in mitosis at one moment.'},{t:'Cytokinesis',d:'Division of the cytoplasm. In plants a cell plate forms between the two new nuclei.'},
    {lvl:'honors',t:'Meristem',d:'Plant tissue where cells keep dividing, such as just behind the root tip.'},{lvl:'honors',t:'Root cap',d:'A cap of cells that protects the growing tip as it pushes through soil.'},
    {lvl:'ap',t:'Colchicine',d:'A drug that blocks microtubules, so spindle fibers can’t form and cells stall in metaphase.'},{lvl:'ap',t:'Chi-square test',d:'Compares observed counts with expected counts to decide whether a difference is bigger than chance would explain.'}],
  about:'<p>Each field of view is made by giving every cell a phase at random, using the proportions in a typical onion root tip: about 86% interphase in the meristem, and almost none dividing in the root cap or elongation zone. Colchicine moves most anaphase and telophase cells, plus extra cells from interphase, into metaphase. Every meristem field is guaranteed to have at least one cell in each phase so you can practice.</p><p>Simplifications: real squashes have overlapping, crushed and out-of-focus cells, and early prophase is hard to tell from interphase. Time per phase from counts assumes cells are dividing at a steady rate and independently, which is close to true in an actively growing root.</p>',
  draw(sim,ctx,vdt,k){const s=sim.st,p=sim.p,hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // root diagram
    const rx=120,top=26,tip=414,rw=56;
    ctx.fillStyle='#eadfca';ctx.strokeStyle='#b49c74';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(rx-rw/2,top);ctx.lineTo(rx-rw/2,tip-60);ctx.quadraticCurveTo(rx-rw/2,tip,rx,tip);ctx.quadraticCurveTo(rx+rw/2,tip,rx+rw/2,tip-60);ctx.lineTo(rx+rw/2,top);ctx.closePath();ctx.fill();ctx.stroke();
    // zones
    const Z={elong:[110,250],meristem:[250,352],cap:[352,414]};
    ctx.save();ctx.clip();ctx.fillStyle='rgba(193,20,48,.12)';ctx.fillRect(rx-rw/2,Z.meristem[0],rw,Z.meristem[1]-Z.meristem[0]);ctx.fillStyle='rgba(120,90,40,.18)';ctx.fillRect(rx-rw/2,Z.cap[0],rw,Z.cap[1]-Z.cap[0]);
    ctx.strokeStyle='rgba(120,90,40,.35)';ctx.lineWidth=1;for(let y=top+8;y<Z.elong[1];y+=y<Z.elong[0]?26:16){ctx.beginPath();ctx.moveTo(rx-rw/2,y);ctx.lineTo(rx+rw/2,y);ctx.stroke();}
    for(let y=Z.meristem[0];y<Z.meristem[1];y+=8){ctx.beginPath();ctx.moveTo(rx-rw/2,y);ctx.lineTo(rx+rw/2,y);ctx.stroke();}ctx.restore();
    // root hairs
    ctx.strokeStyle='#c8b28a';ctx.lineWidth=1.2;for(let y=top+10;y<Z.elong[0]+10;y+=12){ctx.beginPath();ctx.moveTo(rx-rw/2,y);ctx.lineTo(rx-rw/2-14,y-6);ctx.moveTo(rx+rw/2,y+6);ctx.lineTo(rx+rw/2+14,y);ctx.stroke();}
    const zl=hon?{elong:'Elongation zone',meristem:'Meristem',cap:'Root cap'}:{elong:'',meristem:'Dividing zone',cap:''};
    Object.keys(Z).forEach(z=>{if(!zl[z])return;const y=(Z[z][0]+Z[z][1])/2;txt(ctx,zl[z],rx+rw/2+10,y+4,{s:12*k,w:z===p.zone?700:400,c:z===p.zone?PAL['cv-ink']:PAL['cv-soft']});});
    txt(ctx,'Onion root tip',rx,18,{s:12.5*k,w:700,a:'center',c:PAL['cv-soft']});
    // view box + leader lines to the eyepiece
    const zy=Z[p.zone],vb=[rx-rw/2-4,(zy[0]+zy[1])/2-14,rw+8,28];ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2.5;ctx.strokeRect(vb[0],vb[1],vb[2],vb[3]);
    ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(vb[0]+vb[2],vb[1]);ctx.lineTo(CX-R*0.7,CY-R*0.7);ctx.moveTo(vb[0]+vb[2],vb[1]+vb[3]);ctx.lineTo(CX-R*0.7,CY+R*0.7);ctx.stroke();ctx.setLineDash([]);
    // eyepiece view
    ctx.fillStyle='#0d0d10';ctx.beginPath();ctx.arc(CX,CY,R+12,0,6.29);ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(CX,CY,R,0,6.29);ctx.clip();ctx.fillStyle='#f6f0f6';ctx.fillRect(CX-R,CY-R,2*R,2*R);
    s.edge.forEach(c=>drawCell(ctx,c,false,false,k));s.cells.forEach(c=>drawCell(ctx,c,c.i===s.sel,p.answers,k));
    const g=ctx.createRadialGradient(CX,CY,R*0.7,CX,CY,R);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.28)');ctx.fillStyle=g;ctx.fillRect(CX-R,CY-R,2*R,2*R);ctx.restore();
    // scale bar inside field
    const sb=CW;ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(786-sb,420,sb,4);txt(ctx,'20 µm',786-sb/2,412,{s:11*k,w:700,c:PAL['cv-ink'],a:'center'});
    // status
    const n=total(s,key(p));txt(ctx,`Field ${s.field} · ${n} counted`,786,22,{s:12.5*k,w:700,a:'right',c:PAL['cv-ink']});
    if(p.treat==='colch')pill(ctx,'Colchicine-treated',786-70,42,'#7b3fe4','#fff',11*k);}
};
BioLab.register(ROOT);
})();
