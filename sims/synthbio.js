(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,RM,lvText}=BioLab.h;

/* Synthetic gene circuits (Elowitz–Leibler style model, shared by all three circuits).
   For each gene k: dm/dτ = −m + α0 + α·A_k        (mRNA, A_k = promoter activity 0–1)
                    dp/dτ = β·(rbs·m − p)          (protein; reporters mature a little slower)
   A repressible promoter has A = 1/(1 + R_eff²), R_eff = repressor level × (1 − 0.999·inducer).
   α = 216, α0 = 0.216, β = 5. Model time τ = 4 × hours, so the repressilator period is about 2 h. */
const A=216,A0=0.216,B=5,TPH=4;
const COL={L:'#6a3fbf',T:'#0f8b8d',C:'#c27a00',G:'#2ca02c',R:'#d62f2f'};
const NAME={L:'LacI',T:'TetR',C:'cI',G:'GFP',R:'RFP'};
const RBSV={weak:0.25,medium:0.5,strong:1};
const rep=x=>1/(1+x*x);

function activities(sim){const p=sim.p,s=sim.st,ip=(p.iptg||s.t<s.ipU)?1:0,at=(p.atc||s.t<s.atU)?1:0;
  const Le=s.p.L*(1-0.999*ip),Te=s.p.T*(1-0.999*at),Ce=s.p.C,a={L:0,T:0,C:0,G:0,R:0,ip,at};
  if(p.preset==='switch'){a.L=1;a.G=rep(Le);a.occ={G:1-rep(Le)};}
  else if(p.preset==='toggle'){a.T=rep(Le);a.G=a.T;a.L=rep(Te);a.R=a.L;a.occ={T:1-rep(Le),L:1-rep(Te)};}
  else if(p.broken){a.T=rep(Le);a.G=rep(Te);a.L=1;a.occ={T:1-rep(Le),G:1-rep(Te)};}
  else{a.T=rep(Le);a.C=rep(Te);a.G=a.C;a.L=rep(Ce);a.occ={T:1-rep(Le),C:1-rep(Te),L:1-rep(Ce)};}
  return a;}
function present(sim,k){const p=sim.p;if(p.preset==='switch')return k==='L'||k==='G';if(p.preset==='toggle')return k!=='C';return k!=='R'&&!(k==='C'&&p.broken);}

/* transcription units drawn on the plasmid strip, per circuit */
function units(sim){const p=sim.p;
  if(p.preset==='switch')return [{prom:'Constitutive',rep:null,genes:['L'],k:'L'},{prom:'pLac',rep:'L',genes:['G'],k:'G'}];
  if(p.preset==='toggle')return [{prom:'pLac',rep:'L',genes:['T','G'],k:'T'},{prom:'pTet',rep:'T',genes:['L','R'],k:'L'}];
  if(p.broken)return [{prom:'pLac',rep:'L',genes:['T'],k:'T'},{prom:'pTet',rep:'T',genes:['G'],k:'G',cut:'C'},{prom:'pλ',rep:null,genes:['L'],k:'L',lost:true}];
  return [{prom:'pLac',rep:'L',genes:['T'],k:'T'},{prom:'pTet',rep:'T',genes:['C','G'],k:'C'},{prom:'pλ',rep:'C',genes:['L'],k:'L'}];}

function stateText(sim){const s=sim.st,p=sim.p;
  if(p.preset==='switch')return s.p.G>60?'Glowing green':s.p.G>15?'Dim green':'Off (dark)';
  if(p.preset==='toggle')return s.p.G>s.p.R?'Green state':'Red state';
  return s.amp>25?'Oscillating':'Steady';}

const SB={
  id:'synthbio',hash:'synthbio',apUnit:11,order:5,tab:'Synthetic biology: gene circuits',kind:'Go further',prereq:['lacoperon'],
  card:'Wire promoters, repressors and glowing reporters into a switch, a memory, and a genetic clock.',
  title:'Synthetic biology: building gene circuits',
  lede:{bio:'Engineers build new behaviors into bacteria by snapping together DNA parts. Start with a switch: one chemical turns the glow on.',
        honors:'Wire two repressors against each other to make a memory, or three in a ring to make a clock that ticks inside the cell.',
        ap:'Model the toggle switch and the repressilator with the equations from the original 2000 papers. Measure the period, then break the loop.'},
  scale:'Inside E. coli cells, each about 2 µm long. The circuit is a few thousand base pairs of DNA on a plasmid.',
  timeScale:0.5,dtMax:0.0025,prewarm:6,sampleDt:0.05,window:16,unit:'h',timeLabel:'Time',chChange:1,chReveal:10,
  controls:[
    {id:'preset',label:'Circuit',type:'seg',def:'switch',lvl:'bio',options:[{v:'switch',l:'Switch'},{v:'toggle',l:'Toggle',lvl:'honors'},{v:'rep',l:'Repressilator',lvl:'honors'}],
     help:'Switch: one input turns GFP on. Toggle: a memory. Repressilator: a clock.',onChange(sim){BioLab.reset(sim);}},
    {id:'iptg',label:'IPTG',type:'toggle',def:false,lvl:'bio',help:'Inducer that pulls LacI off its promoter'},
    {id:'atc',label:'aTc',type:'toggle',def:false,lvl:'honors',help:'Inducer that pulls TetR off its promoter'},
    {id:'rbs',label:'Reporter RBS strength',type:'seg',def:'strong',lvl:'bio',options:[{v:'weak',l:'Weak'},{v:'medium',l:'Medium'},{v:'strong',l:'Strong'}],
     help:'The ribosome binding site sets how often each mRNA is translated'},
    {id:'broken',label:'Delete the cI gene',type:'toggle',def:false,lvl:'ap',help:'Repressilator only: breaks the ring of three'}
  ],
  actions:[
    {id:'pulseIPTG',label:'Pulse IPTG (1 h)',lvl:'honors',run(sim){sim.st.ipU=sim.st.t+1;}},
    {id:'pulseATC',label:'Pulse aTc (1 h)',lvl:'honors',run(sim){sim.st.atU=sim.st.t+1;}}
  ],
  init(sim){const z=()=>({L:0,T:0,C:0,G:0,R:0}),s={m:z(),p:z(),t:-SB.prewarm,ipU:-1e9,atU:-1e9,hist:[],peaks:[],amp:0,lastG:[0,0],act:null};
    if(sim.p.preset==='toggle'){s.p.L=s.m.L=206;s.p.R=s.m.R=206;}
    if(sim.p.preset==='rep'){s.p.L=5;s.p.C=15;}
    return s;},
  step(sim,dt){const s=sim.st,a=activities(sim),rbs=RBSV[sim.p.rbs]||1,dτ=dt*TPH;s.act=a;
    for(const k of ['L','T','C','G','R']){const prod=present(sim,k)?A0+A*a[k]:0;s.m[k]+=(-s.m[k]+prod)*dτ;
      const rep=k==='G'||k==='R';s.p[k]+=B*((rep?rbs:1)*s.m[k]-s.p[k])*dτ*(rep?0.4:1);s.p[k]=Math.max(0,s.p[k]);}
    s.t+=dt;
    // oscillation bookkeeping on TetR: amplitude over the last 4 h, and peak times
    if(!s.hist.length||s.t-s.hist[s.hist.length-1][0]>=0.05){s.hist.push([s.t,s.p.T]);while(s.hist.length&&s.hist[0][0]<s.t-4)s.hist.shift();
      let lo=1e9,hi=-1e9;s.hist.forEach(h=>{lo=Math.min(lo,h[1]);hi=Math.max(hi,h[1]);});s.amp=s.hist.length>40?hi-lo:0;
      const n=s.hist.length;if(n>=3){const a0=s.hist[n-3][1],a1=s.hist[n-2][1],a2=s.hist[n-1][1];if(a1>a0&&a1>=a2&&a1>20){s.peaks.push(s.hist[n-2][0]);if(s.peaks.length>4)s.peaks.shift();}}}},
  afterPrewarm(sim){sim.st.t=0;sim.st.peaks=sim.st.peaks.map(x=>x);},
  metrics:[
    {id:'state',label:'Cells',unit:'',lvl:'bio',text:true,get:s=>stateText(s)},
    {id:'gfp',label:'GFP (green)',unit:'relative',lvl:'bio',min:0,max:220,d:0,get:s=>s.st.p.G},
    {id:'rfp',label:'RFP (red)',unit:'relative',lvl:'honors',min:0,max:220,d:0,get:s=>s.st.p.R},
    {id:'laci',label:'LacI repressor',unit:'relative',lvl:'bio',min:0,max:220,d:0,get:s=>s.st.p.L},
    {id:'tetr',label:'TetR repressor',unit:'relative',lvl:'honors',min:0,max:220,d:0,get:s=>s.st.p.T},
    {id:'ci',label:'cI repressor',unit:'relative',lvl:'honors',min:0,max:220,d:0,get:s=>s.st.p.C},
    {id:'period',label:'Period',unit:'h',lvl:'ap',min:0,max:4,d:2,get:s=>{const pk=s.st.peaks;return (s.st.amp>25&&pk.length>=2)?pk[pk.length-1]-pk[pk.length-2]:NaN;}}
  ],
  graphs:[{id:'gfpg',label:'GFP',lines:['gfp']},{id:'reporters',label:'GFP and RFP',lvl:'honors',lines:['gfp','rfp']},
          {id:'reps',label:'Repressor proteins',lvl:'honors',lines:['laci','tetr','ci']},{id:'lacig',label:'LacI',lines:['laci']}],
  defaultGraph:'gfpg',
  challenges:[
    {lvl:'bio',q:'IPTG pulls LacI off the lac promoter. You add IPTG to the switch. What happens?',choices:['The cells glow green','Nothing changes','The cells turn red'],correct:0,
     baseline:{preset:'switch'},change:{iptg:true},changeText:'IPTG added',watch:'gfpg',reveal:6,
     explain:{bio:'LacI normally sits on the lac promoter and blocks the GFP gene. IPTG grabs LacI and pulls it off, so RNA polymerase can read the GFP gene and the cells glow.',
              ap:'IPTG binds LacI and lowers its affinity for the operator about a thousandfold. Promoter activity goes from about 0% to 95% of maximum, and GFP climbs to its new steady state in a few hours.'}},
    {lvl:'bio',q:'The switch is on. You swap in a weaker ribosome binding site (RBS) in front of GFP. What happens?',choices:['GFP gets brighter','GFP gets dimmer','The cells stop growing'],correct:1,
     baseline:{preset:'switch',iptg:true},change:{rbs:'weak'},changeText:'Weak RBS in front of GFP',watch:'gfpg',reveal:8,
     explain:{bio:'The RBS is where ribosomes grab the mRNA. A weaker RBS means each mRNA gets translated less often, so less GFP is made even though the gene is just as on.',
              ap:'Steady-state protein is proportional to translation rate × mRNA level ÷ decay. Cutting RBS strength to 25% cuts GFP to about 25% (about 52 vs 206 here).'}},
    {lvl:'honors',q:'Three repressors in a ring each block the next one. Watch for several hours. What do the protein levels do?',choices:['They settle at one steady level','They rise and fall in repeating waves','They all drop to zero'],correct:1,
     baseline:{preset:'rep'},change:{},changeText:'Watching the repressilator',watch:'reps',at:0.1,reveal:9,
     explain:{honors:'Each protein turns off the next one, and the last turns off the first. When LacI is high, TetR falls, so cI rises, which shuts LacI down, and the wave keeps going around the loop. That is a genetic clock.',
              ap:'With an odd number of repressors in a ring, there is no stable state where every gene agrees, and the time delays from mRNA and protein make the loop overshoot. The period here is about 2 h; Elowitz and Leibler measured about 2.5 h in real cells.'}},
    {lvl:'honors',q:'The toggle switch is in its red state. You add IPTG for one hour, then it is gone. After the IPTG is gone, the cells are…',choices:['Back to red','Still green','Dark'],correct:1,
     baseline:{preset:'toggle'},changeAction:'pulseIPTG',changeText:'One-hour pulse of IPTG',watch:'reporters',reveal:8,
     explain:{honors:'IPTG lifts LacI off pLac, so TetR and GFP come on. TetR then shuts off the LacI gene. Once LacI is gone, nothing is left to block TetR, so the cell stays green after the IPTG disappears. The circuit remembers.',
              ap:'Mutual repression with cooperativity (n = 2) makes the toggle bistable. The pulse pushes the cell past the separatrix into the other basin of attraction, and it stays there.'}},
    {lvl:'ap',q:'You delete the cI gene from the repressilator, breaking the ring. What happens to the oscillation?',choices:['It gets faster','It stops and the levels settle','Nothing changes'],correct:1,
     baseline:{preset:'rep'},change:{broken:true},changeText:'cI gene deleted',watch:'reps',reveal:10,
     explain:{ap:'Without cI, nothing represses the LacI gene, so LacI goes high and stays high. LacI keeps TetR off, TetR stops repressing pTet, and GFP sits at a constant level. No loop, no clock.'}},
    {lvl:'ap',q:'The toggle is green. You give it a one-hour pulse of aTc. What happens?',choices:['Stays green','Flips to red and stays red','Flips to red, then back to green'],correct:1,
     baseline:{preset:'toggle'},baselineAction:'pulseIPTG',changeAction:'pulseATC',at:5,reveal:13,changeText:'One-hour pulse of aTc',watch:'reporters',
     explain:{ap:'aTc inactivates TetR, so pTet turns on and LacI and RFP are made. LacI then shuts down pLac, removing TetR for good. The switch flips to the other stable state and remembers it.'}}
  ],
  narrate(sim){const p=sim.p,s=sim.st,a=s.act||activities(sim),hon=atLeast('honors');
    if(p.preset==='switch'){if(a.ip)return s.p.G<150?'IPTG has pulled LacI off the lac promoter. RNA polymerase is now reading the GFP gene, and green protein is building up.':'<b>The switch is on.</b> With LacI pulled off by IPTG, the cells make GFP at a steady rate'+(p.rbs!=='strong'?', limited by the weaker RBS.':'.');
      return s.p.G>20?'IPTG is gone, so LacI is back on the promoter. No new GFP is made, and the glow fades as the protein dilutes out.':'<b>LacI is sitting on the lac promoter</b>, blocking the GFP gene. The cells stay dark until something pulls LacI off.';}
    if(p.preset==='toggle'){const g=s.p.G>s.p.R;if(a.ip||a.at)return (a.ip?'IPTG is inactivating LacI':'aTc is inactivating TetR')+', pushing the switch toward the '+(a.ip?'green':'red')+' side.';
      return '<b>'+(g?'Green':'Red')+' state.</b> '+(g?'TetR is high and keeps the LacI gene off.':'LacI is high and keeps the TetR gene off.')+' Each repressor holds the other down, so this state lasts until an inducer pushes it over.';}
    if(p.broken)return '<b>The ring is broken.</b> With cI gone, LacI stays high, TetR stays low, and every level settles. No more ticking.';
    const top=['L','T','C'].sort((x,y)=>s.p[y]-s.p[x])[0];
    return (hon?'<b>'+NAME[top]+' is high right now</b>, shutting down '+NAME[{L:'T',T:'C',C:'L'}[top]]+'. ':'')+'Each repressor turns off the next one in the ring, so the levels chase each other around like a clock'+(sim.st.amp>25&&sim.st.peaks.length>=2?' with a period of about '+(sim.st.peaks[sim.st.peaks.length-1]-sim.st.peaks[sim.st.peaks.length-2]).toFixed(1)+' h.':'.');},
  tour:[
    {title:'Parts on a plasmid',text:'Each row is one piece of DNA built from standard parts: a <b>promoter</b> (where RNA polymerase starts), a <b>ribosome binding site</b> (where translation starts), one or more <b>genes</b>, and a <b>terminator</b> that ends the message.',focus:[40,30,740,175],speed:0.5,setup(sim){BioLab.setValues(sim,{preset:'switch'});}},
    {title:'A repressor blocks a promoter',text:'LacI is a repressor protein. When it sits on the lac promoter, RNA polymerase can’t get through, so the GFP gene stays silent.',focus:[40,105,330,85],speed:0.5},
    {title:'An inducer pulls the repressor off',text:'Now we add IPTG. It binds LacI and pulls it off the DNA. Watch RNA polymerase start reading the GFP gene.',focus:[40,105,330,85],speed:0.5,setup(sim){BioLab.setValues(sim,{iptg:true});}},
    {title:'Reporters make it visible',text:'GFP is a protein that glows green. Biologists use it as a reporter: the brighter the cell, the more the gene is on.',focus:[20,220,390,220],speed:1},
    {lvl:'honors',title:'A toggle switch: memory',text:'Two repressors each block the other’s gene. Only one can win, and the cell stays in that state until an inducer flips it. This was one of the first synthetic circuits, built in 2000.',focus:[420,220,365,220],speed:1,setup(sim){BioLab.setValues(sim,{iptg:false,preset:'toggle'});}},
    {lvl:'honors',title:'The repressilator: a clock',text:'Three repressors in a ring: LacI blocks TetR, TetR blocks cI, and cI blocks LacI. No state is stable, so the levels chase each other around forever.',focus:[[420,220,365,220],[20,220,390,220]],speed:2,setup(sim){BioLab.setValues(sim,{preset:'rep'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{iptg:false,preset:'switch'});},
  lab:{bio:'<p><b>Question:</b> How does RBS strength change how bright the cells glow?</p><ol><li>Turn IPTG on in the switch circuit.</li><li>Record GFP after 8 hours with a weak, medium and strong RBS (press Reset between runs).</li></ol><p>Explain why the same gene can be made in different amounts.</p>',
       honors:'<p><b>Question:</b> Does the toggle switch remember?</p><ol><li>Start the toggle in the red state. Record GFP and RFP.</li><li>Pulse IPTG, wait 6 hours, and record again.</li><li>Pulse aTc, wait 6 hours, and record again.</li></ol><p>Describe what makes the state last after the inducer is gone.</p>',
       ap:'<p><b>Question:</b> What sets the repressilator’s period?</p><ol><li>Record the period with a strong, medium and weak reporter RBS (the reporter shouldn’t matter).</li><li>Delete cI and record what happens.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why an odd number of repressors in a ring oscillates while two make a switch.</p>'},
  terms:[{t:'Promoter',d:'DNA where RNA polymerase binds and starts transcription.'},{t:'Repressor',d:'A protein that sits on a promoter or operator and blocks transcription.'},{t:'Inducer',d:'A small molecule, like IPTG, that pulls a repressor off the DNA.'},{t:'Reporter',d:'A gene whose product is easy to see, like green fluorescent protein (GFP).'},
    {lvl:'honors',t:'Ribosome binding site (RBS)',d:'The sequence on mRNA where ribosomes start translation. Its strength sets how much protein is made.'},{lvl:'honors',t:'Toggle switch',d:'Two genes that repress each other, giving two stable states: a cellular memory.'},{lvl:'honors',t:'Repressilator',d:'Three repressors in a ring that make protein levels oscillate.'},
    {lvl:'ap',t:'Bistability',d:'A system with two stable steady states. Which one it settles in depends on its history.'},{lvl:'ap',t:'Cooperativity',d:'When repressors bind as pairs or groups, the response is steeper (here, the exponent 2), which is needed for switches and clocks.'}],
  about:'<p>Each gene follows dm/dτ = −m + α₀ + α·A and dp/dτ = β(rbs·m − p), with α = 216, α₀ = 0.216, β = 5 and A = 1/(1 + R²) for a promoter blocked by repressor R (Elowitz & Leibler, 2000). Inducers cut the active repressor by 99.9%. One hour is 4 model time units, which puts the repressilator period near 2 h.</p><p><b>Simplified:</b> protein levels are relative units, every cell runs the same deterministic equations (real cells are noisy and drift out of sync), reporters share mRNA with the gene they are paired with, and cell growth and plasmid copy number are folded into the decay rates.</p>',
  initVis(sim){sim.vis.pol=[0,0,0];sim.vis.cells=[[60,262,-0.2],[160,250,0.15],[250,268,-0.05],[95,318,0.25],[200,322,-0.15],[310,305,0.1],[60,380,0.05],[170,385,-0.2],[280,375,0.2]];},
  draw(sim,ctx,vdt,k,t){
    const s=sim.st,p=sim.p,a=s.act||activities(sim),U=units(sim),hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    txt(ctx,'Plasmid parts',20,22,{s:12*k,w:700,c:PAL['cv-soft']});
    // ---- transcription units ----
    U.forEach((u,i)=>{const y=60+i*58,x0=60;
      ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0-20,y);ctx.lineTo(780,y);ctx.stroke();
      // promoter arrow
      ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0,y-22);ctx.lineTo(x0+26,y-22);ctx.stroke();
      ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.moveTo(x0+32,y-22);ctx.lineTo(x0+24,y-27);ctx.lineTo(x0+24,y-17);ctx.closePath();ctx.fill();
      txt(ctx,u.prom,x0+4,y+18,{s:12*k,w:700});
      // operator + bound repressor
      if(u.rep){const occ=(a.occ&&a.occ[u.k])||0;ctx.fillStyle=COL[u.rep];ctx.globalAlpha=0.25;ctx.fillRect(x0+48,y-8,40,16);ctx.globalAlpha=1;
        ctx.save();ctx.globalAlpha=clamp(occ,0,1);ctx.fillStyle=COL[u.rep];[[-8,-6],[8,-6],[-8,6],[8,6]].forEach(o=>{ctx.beginPath();ctx.arc(x0+68+o[0],y+o[1],8,0,6.29);ctx.fill();});
        txt(ctx,NAME[u.rep],x0+68,y+1,{s:9.5*k,w:700,c:'#fff',a:'center',b:'middle'});ctx.restore();}
      // RBS
      ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.ellipse(x0+110,y-9,11,7,0,Math.PI,0);ctx.fill();
      // genes
      let gx=x0+132;u.genes.forEach(g=>{const w=g==='G'||g==='R'?120:150;ctx.fillStyle=COL[g];ctx.beginPath();ctx.moveTo(gx,y-12);ctx.lineTo(gx+w-14,y-12);ctx.lineTo(gx+w,y);ctx.lineTo(gx+w-14,y+12);ctx.lineTo(gx,y+12);ctx.closePath();ctx.fill();
        txt(ctx,(g==='G'||g==='R'?NAME[g].toLowerCase():NAME[g].charAt(0).toLowerCase()+NAME[g].slice(1)),gx+(w-14)/2,y+1,{s:12*k,w:700,c:'#fff',a:'center',b:'middle'});gx+=w+8;});
      if(u.cut){ctx.strokeStyle=PAL['cv-inc'];ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.strokeRect(gx,y-12,150,24);ctx.setLineDash([]);txt(ctx,'cI deleted',gx+75,y+1,{s:11*k,w:700,c:PAL['cv-inc'],a:'center',b:'middle'});gx+=158;}
      // terminator
      ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(gx+6,y);ctx.lineTo(gx+6,y-18);ctx.moveTo(gx-4,y-18);ctx.lineTo(gx+16,y-18);ctx.stroke();
      // RNA polymerase reading at a rate set by promoter activity
      const act=u.genes[0]==='L'&&p.preset==='switch'?1:(a[u.genes[0]]||0);
      sim.vis.pol[i]=((sim.vis.pol[i]||0)+vdt*act*120)%(gx-x0-120);
      if(act>0.08){const px=x0+130+sim.vis.pol[i];ctx.fillStyle='rgba(43,122,104,'+(0.35+0.6*act)+')';rr(ctx,px-11,y-30,22,18,8);ctx.fill();
        ctx.strokeStyle=PAL['cv-sub'];ctx.lineWidth=1.5;ctx.beginPath();for(let q=0;q<28;q++){const xx=px-12-q*3;if(xx<x0+130)break;ctx.lineTo(xx,y-34-Math.sin(q*.8+t*3)*3);}ctx.stroke();}
      // protein level bar
      const lvl=s.p[u.k];txt(ctx,NAME[u.k]+' '+Math.round(lvl),784,y-16,{s:11*k,w:700,a:'right',c:COL[u.k]});
    });
    if(a.ip||a.at){pill(ctx,(a.ip?'IPTG ':'')+(a.at?'aTc':''),720,22,PAL['s4'],'#fff',11*k);}
    // ---- cells ----
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(10,215,395,228);
    txt(ctx,'E. coli cells',20,234,{s:12*k,w:700,c:PAL['cv-soft']});
    const g=clamp(s.p.G/210,0,1),r=clamp(s.p.R/210,0,1);
    sim.vis.cells.forEach((c,i)=>{const ph=(i*0.37)%1,gg=clamp(g*(0.85+0.15*ph),0,1),r2=clamp(r*(0.85+0.15*(1-ph)),0,1);
      ctx.save();ctx.translate(c[0]+40,c[1]+5);ctx.rotate(c[2]);
      ctx.fillStyle=PAL['cv-bg2'];rr(ctx,-38,-13,76,26,13);ctx.fill();
      const gl=Math.max(gg,r2);if(gl>0.02){ctx.shadowColor=gg>=r2?'rgba(60,220,80,'+(0.9*gl)+')':'rgba(240,60,60,'+(0.9*gl)+')';ctx.shadowBlur=18*gl;
        ctx.fillStyle='rgba(44,190,64,'+(0.85*gg)+')';rr(ctx,-38,-13,76,26,13);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='rgba(226,52,52,'+(0.85*r2)+')';rr(ctx,-38,-13,76,26,13);ctx.fill();}
      ctx.shadowBlur=0;
      ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;rr(ctx,-38,-13,76,26,13);ctx.stroke();ctx.restore();});
    // ---- wiring diagram ----
    ctx.strokeStyle=PAL['line'];ctx.strokeRect(415,215,375,228);
    txt(ctx,'Who represses whom',425,234,{s:12*k,w:700,c:PAL['cv-soft']});
    const node=(key,x,y)=>{const lv=clamp(s.p[key]/210,0,1),R=16+16*lv;ctx.fillStyle=COL[key];ctx.globalAlpha=0.25+0.75*lv;ctx.beginPath();ctx.arc(x,y,R,0,6.29);ctx.fill();ctx.globalAlpha=1;
      txt(ctx,NAME[key],x,y+1,{s:12*k,w:700,c:lv>0.35?'#fff':PAL['cv-ink'],a:'center',b:'middle'});return R;};
    const bar=(x1,y1,x2,y2,r1,r2,col)=>{const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,sx=x1+ux*(r1+6),sy=y1+uy*(r1+6),ex=x2-ux*(r2+8),ey=y2-uy*(r2+8);
      ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.moveTo(ex-uy*10,ey+ux*10);ctx.lineTo(ex+uy*10,ey-ux*10);ctx.stroke();};
    const cx=602,cy=335;
    if(p.preset==='switch'){const r1=node('L',520,335),r2=node('G',690,335);bar(520,335,690,335,r1,r2,COL.L);txt(ctx,'IPTG',520,290,{s:12*k,w:700,c:a.ip?PAL['s4']:PAL['cv-soft'],a:'center'});bar(520,282,520,335,4,r1,a.ip?PAL['s4']:PAL['line']);}
    else if(p.preset==='toggle'){const r1=node('L',520,335),r2=node('T',690,335);bar(520,320,690,320,r1,r2,COL.L);bar(690,352,520,352,r2,r1,COL.T);
      txt(ctx,'+ RFP',520,390,{s:11*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'+ GFP',690,390,{s:11*k,c:PAL['cv-soft'],a:'center'});}
    else{const P={L:[cx,268],T:[cx+80,395],C:[cx-80,395]};const R={};['L','T','C'].forEach(key=>{if(key==='C'&&p.broken)return;R[key]=node(key,P[key][0],P[key][1]);});
      if(p.broken){ctx.strokeStyle=PAL['cv-inc'];ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(P.C[0],P.C[1],18,0,6.29);ctx.stroke();ctx.setLineDash([]);}
      bar(P.L[0],P.L[1],P.T[0],P.T[1],R.L,R.T,COL.L);if(!p.broken){bar(P.T[0],P.T[1],P.C[0],P.C[1],R.T,R.C,COL.T);bar(P.C[0],P.C[1],P.L[0],P.L[1],R.C,R.L,COL.C);}}
    txt(ctx,'⊣ means “turns off”',780,434,{s:11*k,c:PAL['cv-soft'],a:'right'});
  }
};
BioLab.register(SB);
})();
