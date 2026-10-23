(function(){
'use strict';
const {clamp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM,lvText,axes,legend,serColor}=BioLab.h;

/* Phage in an E. coli culture (per mL, minutes) and HIV in blood (per µL, days).
   Phage: logistic host growth, mass-action adsorption, a 25-minute latent period
   (5-stage chain), burst size 100; temperate phage make lysogens 30% of the time. */
const R=0.03,K=1e9,KA=4e-9,TAU=25,BURST=100,IND=1e-4;
const HV={s:10,d:0.01,b:1e-5,del:0.7,p:2000,c:13,mu:1e-4,fit:0.8};
const isHIV=sim=>sim.p.type==='hiv';
const sci=x=>{if(!(x>0))return '0';const e=Math.floor(Math.log10(x)),m=x/Math.pow(10,e);return m.toFixed(1)+' × 10'+String(e).split('').map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]||(c==='-'?'⁻':c)).join('');};
const DIL=[{v:'4',l:'10⁻⁴'},{v:'5',l:'10⁻⁵'},{v:'6',l:'10⁻⁶'},{v:'7',l:'10⁻⁷'},{v:'8',l:'10⁻⁸'},{v:'9',l:'10⁻⁹'}];
function setUnits(sim){const d=sim.def;if(isHIV(sim)){d.unit='days';d.timeScale=4;d.window=300;d.dtMax=0.01;d.sampleDt=1;d.chChange=100;d.chReveal=220;}
  else{d.unit='min';d.timeScale=4;d.window=240;d.dtMax=0.05;d.sampleDt=1;d.chChange=20;d.chReveal=180;}}
function syncMode(sim){if(!sim.ui||!sim.ui.tiles)return;const mode=isHIV(sim)?'hiv':'phage';
  sim.def.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const el=t.num.closest('.tile');if(el)el.hidden=!atLeast(m.lvl)||(m.mode&&m.mode!==mode);});
  sim.def.controls.forEach(c=>{if(!c.mode)return;const inp=document.getElementById('virus-'+c.id);const w=inp&&inp.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||c.mode!==mode;});
  const btns=[...sim.ui.ctrls.querySelectorAll('.actions button')];sim.def.actions.forEach((a,i)=>{if(btns[i])btns[i].hidden=!atLeast(a.lvl)||(a.mode&&a.mode!==mode);});
  const GM={pop:'phage',phg:'phage',log:'phage',hivT:'hiv',hivV:'hiv'};if(sim.ui.gm&&GM[sim.gMetric]!==mode){const w=mode==='hiv'?'hivV':'pop';sim.gMetric=w;sim.ui.gm.value=w;BioLab.refresh(sim);}}
const totI=s=>s.I[0]+s.I[1]+s.I[2]+s.I[3]+s.I[4];

const VIRUS={
  id:'virus',hash:'virus',apUnit:6,order:4,kind:'Simulation',tab:'Viruses: lytic and lysogenic',
  card:'Watch a phage hijack a bacterium and burst it open, or hide inside its DNA. Then plate it, count plaques, and fight HIV.',
  title:'Viruses: lytic and lysogenic cycles',
  lede:{bio:'A bacteriophage is a virus that infects bacteria. Watch one take over a cell, and see what happens to a whole flask of bacteria.',
        honors:'Compare the lytic and lysogenic cycles, trigger a hidden prophage with UV light, and measure a phage population with a plaque assay.',
        ap:'Model phage–host dynamics, then switch to HIV: follow reverse transcription and integration, and see why drug-resistant mutants make combination therapy necessary.'},
  scale:{bio:'Left: one E. coli cell, about 2 µm long. A phage is about 0.2 µm, so roughly 10 would fit across the cell. Right: a flask holding about a billion bacteria per mL.',
         ap:'Left: one cell (E. coli about 2 µm; a helper T cell about 10 µm; HIV about 0.12 µm). Right: the whole culture or the blood.'},
  timeScale:4,dtMax:0.05,prewarm:0,sampleDt:1,window:240,unit:'min',chChange:20,chReveal:180,
  clock(sim){if(isHIV(sim))return 'Day '+Math.floor(sim.t);const m=Math.floor(sim.t);return 'Time '+Math.floor(m/60)+' h '+String(m%60).padStart(2,'0')+' min';},
  controls:[
    {id:'type',label:'Virus',type:'seg',def:'lytic',lvl:'bio',options:[{v:'lytic',l:'Virulent phage (T4)'},{v:'temperate',l:'Temperate phage (λ)'},{v:'hiv',l:'HIV',lvl:'ap'}],
     onChange(sim){setUnits(sim);BioLab.reset(sim);syncMode(sim);}},
    {id:'dil',label:'Dilution plated (0.1 mL)',type:'select',def:'6',lvl:'honors',mode:'phage',options:DIL,help:'Pick a dilution that gives 30–300 plaques.'},
    {id:'drug',label:'Antiviral treatment',type:'seg',def:'none',lvl:'ap',mode:'hiv',options:[{v:'none',l:'None'},{v:'one',l:'One drug'},{v:'combo',l:'Three-drug combo'}]}
  ],
  actions:[
    {id:'uv',label:'Shine UV light',mode:'phage',run(sim){const s=sim.st;s.I[0]+=0.9*s.L;s.L*=0.1;s.uvT=sim.t;}},
    {id:'plate',label:'Plate a sample',lvl:'honors',mode:'phage',run(sim){const s=sim.st,dil=Math.pow(10,-(+sim.p.dil)),mean=s.P*0.1*dil;
      const n=mean>2000?Math.round(mean):Math.max(0,Math.round(mean+Math.sqrt(mean)*randn()));s.plate={n,dil:+sim.p.dil,seed:(Math.random()*1e6)|0,t:sim.t};}}
  ],
  init(sim){return {B:1e7,I:[0,0,0,0,0],L:0,P:1e4,newInf:0,uvT:-1e9,plate:null,
    T:1000,Ti:0,Tr:0,V:0.01,Vr:0};},
  step(sim,dt){const s=sim.st,p=sim.p;
    if(isHIV(sim)){const es=p.drug==='one'?0.9:p.drug==='combo'?0.99:0,er=p.drug==='combo'?0.9:0;
      const inf=HV.b*(1-es)*s.T*s.V,infr=HV.b*(1-er)*s.T*s.Vr;
      s.T+=dt*(HV.s-HV.d*s.T-inf-infr);s.Ti+=dt*(inf-HV.del*s.Ti);s.Tr+=dt*(infr-HV.del*s.Tr);
      s.V=Math.max(0,s.V+dt*(HV.p*s.Ti*(1-HV.mu)-HV.c*s.V));s.Vr=Math.max(0,s.Vr+dt*(HV.p*HV.fit*s.Tr+HV.mu*HV.p*s.Ti-HV.c*s.Vr));return;}
    const fl=p.type==='temperate'?0.3:0,It=totI(s),N=s.B+It+s.L,g=R*(1-N/K);
    const newInf=s.B*(1-Math.exp(-KA*s.P*dt));s.newInf=newInf/dt;
    s.P=Math.max(0,s.P-KA*s.P*N*dt);s.B=Math.max(0,s.B+g*s.B*dt-newInf);
    const ind=IND*s.L*dt;s.L=Math.max(0,s.L+g*s.L*dt+fl*newInf-ind);
    s.I[0]+=(1-fl)*newInf+ind;const kk=5/TAU;const f=s.I.map(x=>kk*x*dt);
    for(let i=0;i<5;i++){s.I[i]-=f[i];if(i<4)s.I[i+1]+=f[i];}s.P+=BURST*f[4]-0.001*s.P*dt;},
  onLevel(sim){if(!atLeast('ap')&&isHIV(sim)){BioLab.setValues(sim,{type:'lytic'});}setUnits(sim);syncMode(sim);},
  metrics:[
    {id:'bac',mode:'phage',label:'Live bacteria',unit:'million/mL',lvl:'bio',min:0,max:null,d:1,get:s=>(s.st.B+totI(s.st)+s.st.L)/1e6},
    {id:'phg',mode:'phage',label:'Free phage',unit:'million/mL',lvl:'bio',min:0,max:null,d:1,get:s=>s.st.P/1e6},
    {id:'lys',mode:'phage',label:'Lysogens (hidden phage DNA)',unit:'million/mL',lvl:'bio',min:0,max:null,d:1,get:s=>s.st.L/1e6},
    {id:'cloud',mode:'phage',label:'Culture cloudiness',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>clamp((s.st.B+totI(s.st)+s.st.L)/K*100,0,100)},
    {id:'inf',mode:'phage',label:'Cells infected right now',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>{const s2=s.st,N=s2.B+totI(s2)+s2.L;return N>1?100*totI(s2)/N:0;}},
    {id:'plq',mode:'phage',label:'Plaques on last plate',unit:'',lvl:'honors',text:true,get:s=>{const pl=s.st.plate;return pl?(pl.n>300?'Too many to count':String(pl.n)):'No plate yet';}},
    {id:'titer',mode:'phage',label:'Titer from that plate',unit:'',lvl:'honors',text:true,get:s=>{const pl=s.st.plate;if(!pl)return '—';if(pl.n>300||pl.n<30)return 'Use a plate with 30–300 plaques';return sci(pl.n/(0.1*Math.pow(10,-pl.dil)))+' PFU/mL';}},
    {id:'tc',mode:'hiv',label:'Helper T cells',unit:'cells/µL',lvl:'ap',min:0,max:1100,d:0,get:s=>s.st.T},
    {id:'vlog',mode:'hiv',label:'Viral load (log scale)',unit:'log₁₀ copies/mL',lvl:'ap',min:0,max:8,d:1,get:s=>{const v=(s.st.V+s.st.Vr)*1000;return v>1?Math.log10(v):0;}},
    {id:'vl',mode:'hiv',label:'Viral load',unit:'copies/mL',lvl:'ap',text:true,get:s=>{const v=(s.st.V+s.st.Vr)*1000;return v<20?'Undetectable (< 20)':sci(v);}},
    {id:'res',mode:'hiv',label:'Drug-resistant virus',unit:'% of virus',lvl:'ap',min:0,max:100,d:0,get:s=>{const t=s.st.V+s.st.Vr;return t>1e-9?100*s.st.Vr/t:0;}}
  ],
  graphs:[{id:'pop',label:'Bacteria and lysogens',lines:['bac','lys'],yl:'million per mL'},{id:'phg',label:'Free phage',lines:['phg']},
    {id:'log',label:'Bacteria and phage (log scale)',lvl:'honors',custom:true},
    {id:'hivV',label:'HIV viral load',lvl:'ap',lines:['vlog']},{id:'hivT',label:'Helper T cells',lvl:'ap',lines:['tc']}],
  defaultGraph:'pop',
  plot(sim,ctx,box,id){if(isHIV(sim)){txt(ctx,'Switch to a phage to use this graph.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
    const win=sim.def.window,xmax=Math.max(win,sim.t),xmin=xmax-win;box.T=34;box.H=box.ch-34-40;
    const ax=axes(ctx,box,{xmin,xmax,ymin:3,ymax:11,xl:'Time (min)',yl:'log₁₀ per mL',yd:0});
    const st=sim.hist.filter(h=>h.t>=xmin);
    [['bac',1e6,0],['phg',1e6,1],['lys',1e6,2]].forEach(([k,mul,i])=>{ctx.strokeStyle=serColor(i);ctx.lineWidth=2.5;ctx.beginPath();let first=true;
      st.forEach(h=>{const v=h.v[k]*mul;const y=v>1e3?Math.log10(v):3;const X=ax.X(h.t),Y=ax.Y(y);if(first){ctx.moveTo(X,Y);first=false;}else ctx.lineTo(X,Y);});ctx.stroke();});
    legend(ctx,box.L,14,[{label:'Bacteria',color:serColor(0)},{label:'Free phage',color:serColor(1)},{label:'Lysogens',color:serColor(2)}]);},
  challenges(sim){return [
    {lvl:'bio',q:'Virulent phage are added to a cloudy flask of E. coli. What will the flask look like after three hours?',
     choices:['Even cloudier','Clear, because the phage burst the bacteria','Unchanged'],correct:1,
     baseline:{type:'lytic'},changeText:'Watching the culture',watch:'pop',at:20,reveal:180,
     explain:{bio:'Each infected cell makes about 100 new phage and bursts. Those phage infect more cells, so the number of phage grows about 100-fold every half hour until nearly every bacterium is gone and the cloudy flask turns clear.',
              honors:'Lytic growth is exponential: one burst every ~25 minutes, 100 phage per burst. Once phage outnumber bacteria, almost every remaining cell is infected within one cycle and the culture lyses.'}},
    {lvl:'bio',q:'Phage lambda can hide its DNA inside the bacterial chromosome. After three hours, what is in the flask?',
     choices:['Nothing: it is clear','Lots of bacteria that carry the hidden phage DNA','Only free phage'],correct:1,
     baseline:{type:'temperate'},changeText:'Watching the culture',watch:'pop',at:20,reveal:180,
     explain:{bio:'In the lysogenic cycle the phage DNA joins the host chromosome as a prophage. The cell survives and copies the phage DNA every time it divides, so the hidden virus spreads silently through the culture.',
              honors:'Lysogens are immune to infection by the same phage, so they take over while ordinary cells are lysed. The culture stays cloudy even though phage DNA is in nearly every cell.'}},
    {lvl:'honors',q:'UV light damages DNA. You shine UV on a culture full of lysogens. What happens to the number of free phage?',
     choices:['It jumps up, because prophages switch to the lytic cycle','It drops to zero','It stays the same'],correct:0,
     baseline:{type:'temperate'},changeAction:'uv',changeText:'UV light on',watch:'phg',at:150,reveal:200,
     explain:{honors:'DNA damage triggers the host’s SOS response, which destroys the lambda repressor. Prophages cut themselves out of the chromosome, enter the lytic cycle, and about 25 minutes later the cells burst, releasing a wave of phage.'}},
    {lvl:'honors',instant:true,q:'You plate 0.1 mL of a 10⁻⁶ dilution and count 42 plaques. What is the phage titer of the original culture?',
     choices:['4.2 × 10⁸ PFU/mL','4.2 × 10⁶ PFU/mL','4.2 × 10⁷ PFU/mL','42 PFU/mL'],correct:0,
     explain:{honors:'Each plaque started from one phage. Titer = plaques ÷ (volume plated × dilution) = 42 ÷ (0.1 mL × 10⁻⁶) = 4.2 × 10⁸ plaque-forming units per mL.'}},
    {lvl:'ap',q:'A person with HIV starts a single antiviral drug (a reverse transcriptase inhibitor) on day 100. What happens over the next few months?',
     choices:['The virus disappears for good','The virus falls, then rebounds as drug-resistant mutants take over','The drug has no effect'],correct:1,
     baseline:{type:'hiv'},change:{drug:'one'},changeText:'One drug started',watch:'hivV',at:100,reveal:220,
     explain:{ap:'HIV reverse transcriptase has no proofreading, so about one mutation is made in every new genome. Among millions of virions, some already carry the single mutation that resists one drug. The drug kills off the rest, and the resistant strain takes over: natural selection inside one patient.'}},
    {lvl:'ap',q:'A different patient starts a three-drug combination on day 100. What happens to the virus?',
     choices:['It stays suppressed, because a virus would need several mutations at once to escape','It rebounds just as fast as with one drug','The T cells crash'],correct:0,
     baseline:{type:'hiv'},change:{drug:'combo'},changeText:'Three-drug therapy started',watch:'hivV',at:100,reveal:220,
     explain:{ap:'A virus resistant to one drug is still blocked by the others. Escaping all three would take three specific mutations in the same genome, which is vanishingly rare, so the viral load falls below detection and T cells recover. That is why HIV is treated with combination therapy (ART).'}}
  ];},
  narrate(sim){const s=sim.st,p=sim.p,hon=atLeast('honors'),f=sim.vis.fc;
    if(isHIV(sim)){const v=(s.V+s.Vr)*1000,res=s.V+s.Vr>0?s.Vr/(s.V+s.Vr):0;
      if(p.drug==='one'&&res>0.5)return '<b>Drug-resistant HIV has taken over.</b> One mutation in reverse transcriptase lets the virus ignore the single drug, so the viral load climbs back up.';
      if(p.drug!=='none'&&v<1000)return '<b>Treatment is working.</b> The drugs block reverse transcriptase, so new infections stop and T cells recover ('+Math.round(s.T)+' per µL).';
      return 'HIV infects helper T cells. Its reverse transcriptase copies the viral RNA into DNA, which is spliced into the cell’s chromosome. Viral load: '+sci(v)+' copies/mL; T cells: '+Math.round(s.T)+' per µL.';}
    const N=s.B+totI(s)+s.L;
    if(sim.t-s.uvT<40)return '<b>UV light damaged the DNA.</b> The hidden prophages are cutting themselves out of the chromosome and switching to the lytic cycle. A burst of new phage is coming.';
    if(N<1e5)return '<b>The flask has gone clear.</b> Nearly every bacterium was infected and burst. What remains is about '+sci(s.P)+' phage per mL with almost nothing left to infect.';
    if(p.type==='temperate'&&s.L>0.5*N)return '<b>Most cells now carry hidden phage DNA (prophage).</b> They grow and divide normally, copying the phage DNA each time. The culture stays cloudy.';
    if(f&&f.phase){const pi=Math.round(100*totI(s)/Math.max(1,N));return '<b>'+f.phase+'.</b> '+(PH_TEXT[f.phase]||'')+(pi>=1?' In the flask, '+pi+'% of cells are infected right now.':' In the flask, phage are just starting to find cells.');}
    return 'Phage are finding bacteria and injecting their DNA. Each infected cell will burst after about 25 minutes and release about 100 new phage.';},
  tour:[
    {title:'Meet the phage',text:'This virus (bacteriophage T4) infects E. coli. It has a protein head full of DNA, a tail and tail fibers. It is not alive on its own: it can only reproduce inside a cell.',focus:[0,0,470,395],pause:true,setup(sim){BioLab.setValues(sim,{type:'lytic'});forcePhase(sim,'lytic',0.5);}},
    {title:'1. Attachment',text:'Tail fibers grab specific receptor proteins on the bacterium’s surface. Each virus can only infect cells with the right receptor.',focus:[150,60,180,130],speed:0.06,setup(sim){forcePhase(sim,'lytic',0);}},
    {title:'2. Injection',text:'The tail contracts like a syringe and injects the phage DNA (red) into the cell. The empty protein coat stays outside.',focus:[60,60,360,290],speed:0.06,setup(sim){forcePhase(sim,'lytic',2);}},
    {title:'3. Replication',text:'Phage genes take over the cell. The host’s own DNA (blue) is broken down, and the cell’s enzymes and ribosomes now copy phage DNA.',focus:[60,130,360,220],speed:0.1,setup(sim){forcePhase(sim,'lytic',5);}},
    {title:'4. Assembly and 5. Lysis',text:'New heads and tails are built and packed with DNA. A phage enzyme (lysozyme) breaks the cell wall, and about 100 new phage burst out to infect other cells.',focus:[0,40,470,355],speed:0.12,setup(sim){forcePhase(sim,'lytic',13);}},
    {title:'The lysogenic cycle',text:'A temperate phage can instead insert its DNA into the host chromosome as a prophage. The cell lives on and copies the prophage every time it divides.',focus:[0,40,470,355],speed:0.12,setup(sim){BioLab.setValues(sim,{type:'temperate'});forcePhase(sim,'lyso',3);}},
    {title:'The whole flask',text:'Back to the population. Lytic phage clear a cloudy culture within a couple of hours; temperate phage leave it cloudy, full of lysogens.',focus:[478,6,316,236],speed:1,setup(sim){BioLab.setValues(sim,{type:'lytic'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{type:'lytic'});},
  lab:{bio:'<p><b>Question:</b> How do lytic and temperate phage change a bacterial culture?</p><ol><li>With Virulent phage chosen, press Reset, then record a trial every 30 minutes for 3 hours.</li><li>Switch to Temperate phage and repeat.</li><li>Plot time (x) against Live bacteria (y) for both runs.</li></ol><p>Explain the difference using the words lytic, lysogenic and prophage.</p>',
       honors:'<p><b>Question:</b> How many phage are in the flask? (Plaque assay)</p><ol><li>Let a Virulent phage culture run for about 90 minutes.</li><li>Plate samples at several dilutions until one gives 30–300 plaques.</li><li>Calculate the titer = plaques ÷ (0.1 mL × dilution), and compare it with the Free phage readout.</li></ol><p>Why do microbiologists only count plates with 30–300 plaques?</p>',
       ap:'<p><b>Question:</b> Why is HIV treated with combinations of drugs?</p><ol><li>Choose HIV. Record viral load, T cells and % resistant every 25 days with no treatment.</li><li>Reset, and switch to One drug on day 100. Record the same values to day 300.</li><li>Repeat with the Three-drug combo.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain the rebound in terms of mutation rate, variation and natural selection.</p>'},
  terms:[{t:'Virus',d:'A non-living particle of genetic material in a protein coat that can only reproduce inside a host cell.'},{t:'Bacteriophage',d:'A virus that infects bacteria.'},{t:'Lytic cycle',d:'The virus copies itself and bursts (lyses) the host cell.'},{t:'Lysogenic cycle',d:'Viral DNA joins the host chromosome and is copied along with it.'},
    {lvl:'honors',t:'Prophage',d:'Phage DNA inserted in a bacterial chromosome.'},{lvl:'honors',t:'Induction',d:'A prophage switching to the lytic cycle, often after DNA damage.'},{lvl:'honors',t:'Plaque / PFU',d:'A clear spot where phage killed the lawn; each started from one plaque-forming unit.'},
    {lvl:'ap',t:'Retrovirus',d:'An RNA virus that uses reverse transcriptase to make DNA from its RNA genome.'},{lvl:'ap',t:'Reverse transcriptase',d:'The enzyme that copies RNA into DNA, without proofreading.'},{lvl:'ap',t:'Integrase',d:'The enzyme that inserts viral DNA into the host chromosome.'},{lvl:'ap',t:'Combination therapy (ART)',d:'Several antiviral drugs at once, so resistance would need several mutations.'}],
  about:'<p><b>Phage:</b> bacteria grow logistically (doubling ~23 min, capacity 10⁹/mL). Phage adsorb at 4 × 10⁻⁹ mL/min; infected cells burst after a latent period averaging 25 minutes (5-stage chain) with 100 phage each. Temperate phage choose lysogeny 30% of the time; prophages are induced at 10⁻⁴ per minute, or 90% at once with UV. Lysogens are immune to reinfection. The cell at left is a cartoon that cycles through the stages.</p><p><b>HIV:</b> target-cell model dT/dt = s − dT − βTV, infected cells die at 0.7/day, each releases virus at 2000/day, virus cleared at 13/day. One resistance mutation arises per 10⁴ new virions; resistant virus is 20% less fit. One drug blocks 90% of sensitive virus; the combination blocks 99% of sensitive and 90% of single-resistant virus.</p><p><b>Simplified:</b> no phage receptor mutations, no immune response or latent HIV reservoir, and real HIV disease progresses over years rather than months.</p>',
  initVis(sim){const v=sim.vis;v.fc={path:null,t:0,phase:''};v.r=rng(9);v.fly=[];v.ht=0;},
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(isHIV(sim)){drawHIV(sim,ctx,vdt,k,t);drawBlood(sim,ctx,k,t);return;}
    drawCell(sim,ctx,vdt,k,t);drawFlask(sim,ctx,k,t);drawPlate(sim,ctx,k);}
};
const PH_TEXT={'Attachment':'Tail fibers lock onto receptors on the cell surface.','Injection':'The phage injects its DNA (red) into the cell.','Replication':'Phage genes hijack the cell to copy phage DNA.','Assembly':'New phage heads and tails are built and filled with DNA.','Lysis':'The cell bursts, releasing about 100 new phage.',
  'Integration':'The phage DNA splices into the host chromosome as a prophage.','Cell division':'The cell divides, and each daughter inherits the prophage.','Induction':'The prophage cuts itself out and switches to the lytic cycle.'};
function forcePhase(sim,path,tt){const f=sim.vis.fc;if(!f)return;f.path=path;f.t=tt;f.forced=true;}

/* ---------- drawing helpers ---------- */
function phage(ctx,x,y,sc,col){ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);
  ctx.fillStyle=col||'#6c5fb0';ctx.beginPath();for(let a=0;a<6;a++){const an=a*Math.PI/3+Math.PI/6;ctx.lineTo(Math.cos(an)*9,-16+Math.sin(an)*9);}ctx.closePath();ctx.fill();
  ctx.fillRect(-2.2,-8,4.4,14);ctx.fillRect(-5,5,10,3);ctx.strokeStyle=col||'#6c5fb0';ctx.lineWidth=1.6;
  [[-1,1],[1,1]].forEach(([d])=>{ctx.beginPath();ctx.moveTo(d*4,8);ctx.lineTo(d*10,13);ctx.lineTo(d*12,21);ctx.stroke();ctx.beginPath();ctx.moveTo(d*2,8);ctx.lineTo(d*5,16);ctx.lineTo(d*4,23);ctx.stroke();});ctx.restore();}
function bact(ctx,x,y,w,h,alpha){ctx.globalAlpha=alpha===undefined?1:alpha;ctx.fillStyle='#b9dca0';rr(ctx,x,y,w,h,h/2);ctx.fill();ctx.strokeStyle='#5f8f45';ctx.lineWidth=3;ctx.stroke();ctx.globalAlpha=1;}
function chromo(ctx,cx,cy,rx,ry,t,col){ctx.strokeStyle=col||'#2f5f8a';ctx.lineWidth=2.4;ctx.beginPath();for(let i=0;i<=60;i++){const a=i/60*6.283,r=1+0.18*Math.sin(a*5+t*0.3);ctx.lineTo(cx+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r);}ctx.stroke();}
function steps(ctx,k,list,cur){let x=12;const y=420;ctx.font='700 '+11.5*k+'px '+FONT;list.forEach((l,i)=>{const w=ctx.measureText(l).width+16;const on=l===cur;ctx.fillStyle=on?PAL['s1']:PAL['card2'];rr(ctx,x,y-14,w,24,12);ctx.fill();
  txt(ctx,l,x+w/2,y-1,{s:11.5*k,w:700,c:on?'#fff':PAL['cv-soft'],a:'center',b:'middle'});x+=w+6;});}

function drawCell(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis,f=v.fc,hon=atLeast('honors');
  const simDt=vdt*sim.def.timeScale;
  // choose / advance the featured cycle
  if(!f.path){f.path=(p.type==='temperate'&&v.r()<0.5)?'lyso':'lytic';f.t=0;}
  if(p.type==='lytic'&&f.path==='lyso'&&!f.forced){f.path='lytic';f.t=0;}
  if(f.path==='lyso'&&sim.t-s.uvT<5&&f.t>8&&f.path!=='induce'){f.path='induce';f.t=0;}
  f.t+=simDt;
  const lenL=30,lenS=34;
  if(f.path==='lytic'&&f.t>lenL){f.path=null;f.forced=false;return drawCell(sim,ctx,0,k,t);}
  if(f.path==='lyso'&&f.t>lenS){f.t=8;}
  if(f.path==='induce'&&f.t>24){f.path=null;}
  const L=f.path||'lytic',T=f.t;
  ctx.fillStyle=PAL['card'];rr(ctx,6,6,464,394,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,L==='lyso'?'Lysogenic cycle':L==='induce'?'Induction → lytic cycle':'Lytic cycle',20,30,{s:15*k,w:800});
  let phase='';const CX=238,CY=245,W=320,H=150;
  if(L==='lytic'||L==='induce'){
    const T2=L==='induce'?T+4:T;   // induction joins at replication
    phase=L==='induce'&&T<4?'Induction':T2<2?'Attachment':T2<4?'Injection':T2<12?'Replication':T2<22?'Assembly':'Lysis';
    const burst=T2>=22,a=burst?clamp(1-(T2-22)/3,0,1):1;
    if(T2<27)bact(ctx,CX-W/2,CY-H/2,W,H,a);
    if(T2<6)chromo(ctx,CX-20,CY+5,90,40,t,'#2f5f8a');else if(T2<10){ctx.strokeStyle='#2f5f8a';ctx.lineWidth=2;for(let i=0;i<8;i++){const x=CX-100+i*26,y=CY+(i%3)*14-14;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+14,y+6);ctx.stroke();}}
    if(L==='induce'&&T<4){chromo(ctx,CX-20,CY+5,90,40,t,'#2f5f8a');ctx.strokeStyle='#d32f2f';ctx.lineWidth=5;ctx.beginPath();ctx.arc(CX-20,CY+5-40,16+T*4,0,6.29);ctx.stroke();}
    // attaching phage
    if(L==='lytic'&&T2<4){const py=T2<2?clamp(60+T2*35,60,CY-H/2-22):CY-H/2-22;phage(ctx,CX,py,1.8);
      if(T2>=2){ctx.strokeStyle='#d32f2f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(CX,CY-H/2+4);const L2=(T2-2)/2;for(let i=0;i<=20*L2;i++)ctx.lineTo(CX+Math.sin(i*0.9)*10,CY-H/2+4+i*4);ctx.stroke();}}
    if(L==='lytic'&&T2>=4&&T2<27)phage(ctx,CX,CY-H/2-22,1.8,'#a99ad8');
    if(T2>=4&&T2<22){const n=Math.min(18,1+Math.floor((T2-4)*1.6));for(let i=0;i<n;i++){const x=CX-120+(i%6)*46+Math.sin(t+i)*3,y=CY-40+Math.floor(i/6)*36;ctx.strokeStyle='#d32f2f';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(x,y,8,0,6.29);ctx.stroke();}}
    if(T2>=12&&T2<22){const n=Math.floor((T2-12)*1.8);for(let i=0;i<n;i++){const x=CX-120+(i%6)*46,y=CY-40+Math.floor(i/6)*36;phage(ctx,x,y+12,0.9);}}
    if(T2>=22){if(!v.flyT||v.flyT>T2){v.fly=[];for(let i=0;i<20;i++){const an=i/20*6.283;v.fly.push({x:CX,y:CY,vx:Math.cos(an)*(30+v.r()*30),vy:Math.sin(an)*(20+v.r()*25)});}}v.flyT=T2;
      v.fly.forEach(o=>{const dt2=T2-22;phage(ctx,clamp(o.x+o.vx*dt2,20,456),clamp(o.y+o.vy*dt2,50,388),0.9);});
      if(hon)pill(ctx,'about 100 phage released',CX,CY+H/2+30,PAL['s1'],'#fff',12*k);}
  } else {  // lysogenic
    phase=T<2?'Attachment':T<4?'Injection':T<8?'Integration':'Cell division';
    if(T<8){bact(ctx,CX-W/2,CY-H/2,W,H);chromo(ctx,CX-20,CY+5,90,40,t);
      if(T<4){phage(ctx,CX,T<2?60+T*30:CY-H/2-22,1.8);if(T>=2){ctx.strokeStyle='#d32f2f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(CX,CY-H/2+4);ctx.lineTo(CX,CY-H/2+4+(T-2)*30);ctx.stroke();}}
      else{const q=(T-4)/4;ctx.strokeStyle='#d32f2f';ctx.lineWidth=5;ctx.beginPath();ctx.arc(CX-20+Math.cos(-1.6)*90,CY+5+Math.sin(-1.6)*40*(1-q)+(1-q)*20,8*(1-q)+4,0,6.29);ctx.stroke();phage(ctx,CX,CY-H/2-22,1.8,'#a99ad8');}}
    else{const g=((T-8)%13)/13,two=g>0.55;
      const drawD=(x,y,w,h)=>{bact(ctx,x-w/2,y-h/2,w,h);chromo(ctx,x,y,w*0.3,h*0.28,t);ctx.strokeStyle='#d32f2f';ctx.lineWidth=6;ctx.beginPath();ctx.arc(x,y,Math.max(w*0.3,h*0.28)*1.0,-1.9,-1.3);ctx.stroke();};
      if(!two)drawD(CX,CY,W*(0.85+g*0.4),H);else{drawD(CX-95,CY,180,H*0.9);drawD(CX+95,CY,180,H*0.9);}
      if(hon)pill(ctx,'red = prophage, copied with every division',CX,CY+H/2+32,PAL['card2'],PAL['cv-ink'],11.5*k);}
  }
  f.phase=phase;
  const list=L==='lyso'?['Attachment','Injection','Integration','Cell division']:['Attachment','Injection','Replication','Assembly','Lysis'];
  steps(ctx,k,L==='induce'&&phase==='Induction'?['Induction','Replication','Assembly','Lysis']:list,phase);
  txt(ctx,'phage DNA',380,30,{s:11.5*k,w:700,c:'#d32f2f',a:'right'});txt(ctx,'host DNA',456,30,{s:11.5*k,w:700,c:'#2f5f8a',a:'right'});}

function drawFlask(sim,ctx,k,t){const s=sim.st,N=s.B+totI(s)+s.L,cl=clamp(N/K,0,1);
  ctx.fillStyle=PAL['card'];rr(ctx,478,6,316,236,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  const fx=560,fy=40;ctx.beginPath();ctx.moveTo(fx+24,fy);ctx.lineTo(fx+24,fy+60);ctx.lineTo(fx-28,fy+180);ctx.lineTo(fx+124,fy+180);ctx.lineTo(fx+76,fy+60);ctx.lineTo(fx+76,fy);ctx.closePath();
  ctx.save();ctx.clip();ctx.fillStyle=PAL['cv-water'];ctx.fillRect(fx-30,fy+90,160,95);ctx.fillStyle='rgba(205,180,110,'+(0.15+0.75*cl)+')';ctx.fillRect(fx-30,fy+90,160,95);ctx.restore();
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.stroke();
  txt(ctx,'Flask culture',648,30,{s:13*k,w:800});
  txt(ctx,cl>0.3?'Cloudy':cl>0.03?'Clearing':'Clear',700,104,{s:16*k,w:800,c:cl>0.3?PAL['cv-ink']:PAL['s2']});
  txt(ctx,'bacteria '+sci(N)+'/mL',700,130,{s:11.5*k,c:PAL['cv-soft']});txt(ctx,'phage '+sci(s.P)+'/mL',700,148,{s:11.5*k,c:PAL['cv-soft']});
  if(s.L>1e5)txt(ctx,'lysogens '+sci(s.L)+'/mL',700,166,{s:11.5*k,c:PAL['s3']});
  if(sim.t-s.uvT<20){ctx.fillStyle='rgba(150,90,255,.25)';ctx.fillRect(478,6,316,236);pill(ctx,'UV on',740,210,'#7b3fe4','#fff',12*k);}}

function drawPlate(sim,ctx,k){const s=sim.st,hon=atLeast('honors'),pl=s.plate;
  ctx.fillStyle=PAL['card'];rr(ctx,478,250,316,192,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  if(!hon){txt(ctx,'Key',494,276,{s:13*k,w:800});phage(ctx,505,316,1.1);txt(ctx,'bacteriophage',528,312,{s:12*k,c:PAL['cv-soft']});
    bact(ctx,492,348,40,20);txt(ctx,'E. coli cell',540,362,{s:12*k,c:PAL['cv-soft']});ctx.strokeStyle='#d32f2f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(494,398);ctx.lineTo(530,398);ctx.stroke();txt(ctx,'phage DNA',540,402,{s:12*k,c:PAL['cv-soft']});return;}
  txt(ctx,'Plaque assay',494,276,{s:13*k,w:800});
  const cx=570,cy=352,r=76;ctx.fillStyle=PAL['card2'];ctx.beginPath();ctx.arc(cx,cy,r+6,0,6.29);ctx.fill();ctx.fillStyle='#e7d9a6';ctx.beginPath();ctx.arc(cx,cy,r,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,r+6,0,6.29);ctx.stroke();
  if(pl){const R2=rng(pl.seed),n=Math.min(pl.n,320);ctx.fillStyle='#f8f4e6';for(let i=0;i<n;i++){const a=R2()*6.283,d=Math.sqrt(R2())*(r-5);ctx.beginPath();ctx.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d,pl.n>300?2:3.2,0,6.29);ctx.fill();}
    txt(ctx,'10⁻'+String(pl.dil).split('').map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('')+' dilution',662,316,{s:12*k,w:700});
    txt(ctx,pl.n>300?'Too many to count':pl.n+' plaques',662,338,{s:15*k,w:800,c:pl.n>300||pl.n<30?PAL['s1']:PAL['s3']});
    txt(ctx,pl.n>=30&&pl.n<=300?'Countable':'Pick another dilution',662,360,{s:11.5*k,c:PAL['cv-soft']});}
  else{txt(ctx,'Press Plate a sample',662,330,{s:12*k,c:PAL['cv-soft']});txt(ctx,'to spread 0.1 mL',662,348,{s:12*k,c:PAL['cv-soft']});txt(ctx,'on a bacterial lawn.',662,366,{s:12*k,c:PAL['cv-soft']});}
  txt(ctx,'clear spots = plaques',662,416,{s:11*k,c:PAL['cv-soft']});}

function drawHIV(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis;
  v.ht=(v.ht+vdt*sim.speed/ (sim.speed||1))%14;const T=v.ht;
  ctx.fillStyle=PAL['card'];rr(ctx,6,6,464,394,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'HIV infecting a helper T cell',20,30,{s:15*k,w:800});txt(ctx,'one cycle takes about 1–2 days (slowed down)',20,50,{s:11.5*k,c:PAL['cv-soft']});
  const CX=250,CY=240,R=130,res=s.V+s.Vr>0?s.Vr/(s.V+s.Vr):0,blocked=p.drug!=='none'&&!(p.drug==='one'&&res>0.5)&&T>3.5;
  ctx.fillStyle='#d9c8ef';ctx.beginPath();ctx.arc(CX,CY,R,0,6.29);ctx.fill();ctx.strokeStyle='#8c6bc0';ctx.lineWidth=3;ctx.stroke();
  for(let i=0;i<10;i++){const a=-2.6+i*0.2;const x=CX+Math.cos(a)*R,y=CY+Math.sin(a)*R;ctx.strokeStyle='#6b4aa0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*10,y+Math.sin(a)*10);ctx.stroke();}
  ctx.fillStyle='#b59bdc';ctx.beginPath();ctx.arc(CX+20,CY+30,56,0,6.29);ctx.fill();chromo(ctx,CX+20,CY+30,32,24,t,'#2f5f8a');
  const virion=(x,y,sc)=>{ctx.fillStyle='#d98b3a';ctx.beginPath();ctx.arc(x,y,14*sc,0,6.29);ctx.fill();ctx.strokeStyle='#a35f1a';ctx.lineWidth=2;for(let i=0;i<8;i++){const a=i*0.785;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*14*sc,y+Math.sin(a)*14*sc);ctx.lineTo(x+Math.cos(a)*19*sc,y+Math.sin(a)*19*sc);ctx.stroke();}
    ctx.strokeStyle='#d32f2f';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<8;i++)ctx.lineTo(x-7*sc+i*2*sc,y+Math.sin(i)*3*sc);ctx.stroke();};
  let phase;
  if(T<1.5){phase='Binding';virion(CX-60,CY-R-30+T*14,1);}
  else if(T<3){phase='Fusion';const q=(T-1.5)/1.5;virion(CX-60,CY-R+8+q*40,1-q*0.5);}
  else if(T<5.5){phase='Reverse transcription';const q=clamp((T-3)/2.5,0,1);ctx.strokeStyle='#d32f2f';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=30;i++)ctx.lineTo(CX-110+i*4,CY-60+Math.sin(i*0.6)*5);ctx.stroke();
    if(!blocked){ctx.strokeStyle='#2f5f8a';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=30*q;i++)ctx.lineTo(CX-110+i*4,CY-48+Math.sin(i*0.6)*5);ctx.stroke();ctx.fillStyle='#e0a52a';ctx.beginPath();ctx.arc(CX-110+30*q*4,CY-54,7,0,6.29);ctx.fill();}
    else{pill(ctx,'drug jams reverse transcriptase',CX-50,CY-80,'#d32f2f','#fff',11.5*k);}
    txt(ctx,'RNA',CX-118,CY-66,{s:11*k,w:700,c:'#d32f2f',a:'right'});if(!blocked)txt(ctx,'DNA',CX-118,CY-42,{s:11*k,w:700,c:'#2f5f8a',a:'right'});}
  else if(T<8){phase=blocked?'Reverse transcription':'Integration';if(!blocked){const q=(T-5.5)/2.5;ctx.strokeStyle='#d32f2f';ctx.lineWidth=5;ctx.beginPath();ctx.arc(CX-60+q*80,CY-50+q*60,10,0,6.29);ctx.stroke();}else pill(ctx,'no DNA copy: infection stops',CX-30,CY-60,'#d32f2f','#fff',11.5*k);}
  else if(T<11){phase=blocked?'Reverse transcription':'Transcription and translation';if(!blocked){ctx.strokeStyle='#d32f2f';ctx.lineWidth=5;ctx.beginPath();ctx.arc(CX+20,CY+6,8,0,6.29);ctx.stroke();for(let i=0;i<Math.floor((T-8)*4);i++){ctx.strokeStyle='#d32f2f';ctx.lineWidth=2;ctx.beginPath();const x=CX-90+(i%5)*24,y=CY+60+Math.floor(i/5)*22;ctx.moveTo(x,y);ctx.lineTo(x+12,y+4);ctx.stroke();}}}
  else{phase=blocked?'Reverse transcription':'Budding';if(!blocked){const q=(T-11)/3;for(let i=0;i<4;i++){const a=0.3+i*0.5,d=R+q*40;virion(CX+Math.cos(a)*d,CY+Math.sin(a)*d,0.8);}if(res>0.5&&p.drug!=='none')pill(ctx,'mutant RT: drug no longer fits',CX+40,CY+R+20,PAL['s4'],'#1c1c1f',11.5*k);}}
  txt(ctx,'CD4 receptors',CX-150,CY-R+10,{s:11*k,c:PAL['cv-soft']});txt(ctx,'nucleus',CX+20,CY+100,{s:11*k,w:700,c:'#4b3375',a:'center'});
  steps(ctx,k,['Binding','Fusion','Reverse transcription','Integration','Transcription and translation','Budding'].map(x=>x==='Transcription and translation'?'Make parts':x),phase==='Transcription and translation'?'Make parts':phase);
  v.fc.phase=phase;}
function drawBlood(sim,ctx,k,t){const s=sim.st,p=sim.p,v=sim.vis;
  ctx.fillStyle=PAL['card'];rr(ctx,478,6,316,436,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Blood sample',494,30,{s:13*k,w:800});
  const cx=636,cy=150,r=100;ctx.fillStyle=PAL['cv-ims'];ctx.beginPath();ctx.arc(cx,cy,r,0,6.29);ctx.fill();ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.stroke();
  const R2=rng(3),nT=Math.round(s.T/40);for(let i=0;i<30;i++){const a=R2()*6.283,d=Math.sqrt(R2())*(r-14);if(i>=nT)continue;ctx.fillStyle='#a58ad0';ctx.beginPath();ctx.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d,8,0,6.29);ctx.fill();}
  const vl=(s.V+s.Vr)*1000,nv=vl>20?Math.min(60,Math.round(Math.log10(vl)*8)):0,res=s.V+s.Vr>0?s.Vr/(s.V+s.Vr):0;
  for(let i=0;i<nv;i++){const a=R2()*6.283,d=Math.sqrt(R2())*(r-6);ctx.fillStyle=i<nv*res?PAL['s4']:'#d98b3a';ctx.beginPath();ctx.arc(cx+Math.cos(a)*d+Math.sin(t+i)*1.5,cy+Math.sin(a)*d,3,0,6.29);ctx.fill();}
  txt(ctx,'T cells '+Math.round(s.T)+'/µL',494,282,{s:13*k,w:700,c:s.T<350?PAL['s1']:PAL['cv-ink']});
  txt(ctx,'Viral load '+(vl<20?'undetectable':sci(vl)+' /mL'),494,304,{s:13*k,w:700});
  txt(ctx,'Resistant virus '+Math.round(res*100)+'%',494,326,{s:13*k,w:700,c:res>0.5?PAL['s4']:PAL['cv-ink']});
  txt(ctx,'Treatment: '+(p.drug==='none'?'none':p.drug==='one'?'one drug':'three-drug combination'),494,354,{s:12*k,c:PAL['cv-soft']});
  ctx.fillStyle='#a58ad0';ctx.beginPath();ctx.arc(500,392,6,0,6.29);ctx.fill();txt(ctx,'helper T cell',512,396,{s:11.5*k,c:PAL['cv-soft']});
  ctx.fillStyle='#d98b3a';ctx.beginPath();ctx.arc(612,392,4,0,6.29);ctx.fill();txt(ctx,'HIV',622,396,{s:11.5*k,c:PAL['cv-soft']});
  ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(668,392,4,0,6.29);ctx.fill();txt(ctx,'resistant HIV',678,396,{s:11.5*k,c:PAL['cv-soft']});}

VIRUS.thumbFrames=30;
BioLab.register(VIRUS);
})();
