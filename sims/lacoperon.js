(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;

/* Lac operon of E. coli. Time in minutes.
   A  = inducer (lactose/allolactose inside the cell, 0–1)
   R  = active repressor = 1/(1+(A/0.05)²); operator free = 1 − 0.98·R  (Oᶜ: always free; lacI⁻: R = 0)
   CAP-cAMP = 1 without glucose, 0.1 with glucose (CAP⁻: 0)
   transcription tx = operatorFree × (0.15 + 0.85·CAP)
   dm/dt = 3.5·tx − 0.35·m          (mRNA half-life ≈ 2 min)
   dB/dt = 6·m − 0.023·B            (β-gal is stable, diluted as cells divide every ~30 min)
   uptake = 0.3·(0.05 + 0.95·B/BMAX) when lactose is outside (permease rises with the operon) */
const BMAX=2600;
function stateOf(tx){return tx<0.06?'Off':tx<0.45?'Low':'On';}
function hex(ctx,x,y,r,fill){ctx.fillStyle=fill;ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/6+i*Math.PI/3;i?ctx.lineTo(x+r*Math.cos(a),y+r*Math.sin(a)):ctx.moveTo(x+r*Math.cos(a),y+r*Math.sin(a));}ctx.closePath();ctx.fill();}
function lactose(ctx,x,y,r){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x+r,y);ctx.stroke();hex(ctx,x-r,y,r,PAL['s4']);hex(ctx,x+r,y,r,PAL['s5']);}
function repressor(ctx,x,y,alpha,allo){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#6a3fbf';
  [[-9,-6],[9,-6],[-9,6],[9,6]].forEach(o=>{ctx.beginPath();ctx.arc(x+o[0],y+o[1],9,0,6.29);ctx.fill();});
  if(allo){hex(ctx,x-15,y-14,4.5,PAL['s4']);hex(ctx,x+15,y-14,4.5,PAL['s4']);}ctx.restore();}
function cap(ctx,x,y,alpha){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#2f6fd6';rr(ctx,x-16,y-11,32,22,9);ctx.fill();ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.arc(x-6,y-12,4,0,6.29);ctx.arc(x+6,y-12,4,0,6.29);ctx.fill();ctx.restore();}
function polymerase(ctx,x,y){ctx.fillStyle='#2b7a68';rr(ctx,x-17,y-15,34,30,12);ctx.fill();ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.arc(x-5,y-5,5,0,6.29);ctx.fill();}
function bgal(ctx,x,y){ctx.fillStyle=PAL['cv-enz'];[[-5,-5],[5,-5],[-5,5],[5,5]].forEach(o=>{ctx.beginPath();ctx.arc(x+o[0],y+o[1],6,0,6.29);ctx.fill();});}
const REG=[{x0:20,x1:130,c:'s6',n:'lacI',b:'Repressor gene',h:'makes repressor'},{x0:150,x1:200,c:'s2',n:'CAP',b:'',h:'site',lvl:'honors'},{x0:200,x1:268,c:'s3',n:'Promoter',b:'Promoter',h:'RNA pol'},
  {x0:268,x1:330,c:'s5',n:'Operator',b:'Operator',h:'switch'},{x0:330,x1:560,c:'s1',n:'lacZ',b:'',h:'β-galactosidase'},{x0:560,x1:675,c:'s4',n:'lacY',b:'',h:'permease'},{x0:675,x1:780,c:'muted',n:'lacA',b:'',h:'transacetylase'}];

const LAC={
  id:'lacoperon',hash:'lacoperon',apUnit:6,order:2,tab:'Lac operon',kind:'Simulation',
  card:'Watch E. coli switch its lactose genes on and off as lactose and glucose come and go.',
  title:'Gene regulation: the lac operon',
  lede:{bio:'Bacteria only make the proteins they need. Add lactose and watch E. coli switch on the genes for digesting it, then switch them off when the lactose is gone.',
        honors:'The repressor, the operator and CAP work together. See why lactose turns the operon on, and why glucose keeps it low even when lactose is around.',
        ap:'Track mRNA and β-galactosidase over time, then test lacI⁻, Oᶜ and CAP⁻ mutants to see which parts are needed for regulation.'},
  scale:'Inside one E. coli cell, about 2 µm long. The lac operon is about 5,000 base pairs of its 4.6-million-base-pair chromosome.',
  timeScale:2,dtMax:0.02,prewarm:200,sampleDt:0.1,window:40,unit:'min',chChange:3,chReveal:24,
  controls:[
    {id:'lac',label:'Lactose available',type:'toggle',def:false,lvl:'bio',help:'Milk sugar outside the cell'},
    {id:'glc',label:'Glucose available',type:'toggle',def:false,lvl:'bio',help:'The sugar E. coli prefers'},
    {id:'lacI',label:'lacI⁻ mutant',type:'toggle',def:false,lvl:'ap',help:'Makes no working repressor'},
    {id:'Oc',label:'Oᶜ mutant',type:'toggle',def:false,lvl:'ap',help:'Operator the repressor can’t bind'},
    {id:'capm',label:'CAP⁻ mutant',type:'toggle',def:false,lvl:'ap',help:'CAP can’t bind DNA'}
  ],
  init(){return {A:0,m:0,B:0,R:1,Of:0.02,cap:1,tx:0,brk:0};},
  step(sim,dt){const p=sim.p,s=sim.st,Bf=s.B/BMAX;
    const up=p.lac?0.3*(0.05+0.95*Math.min(1,Bf)):0;
    s.brk=0.6*Math.min(1.2,Bf+0.002)*s.A/(s.A+0.2);
    s.A=clamp(s.A+(up-s.brk-0.05*s.A)*dt,0,1);
    s.R=p.lacI?0:1/(1+Math.pow(s.A/0.05,2));
    s.Of=p.Oc?1:1-0.98*s.R;
    s.cap=p.capm?0:(p.glc?0.1:1);
    s.tx=s.Of*(0.15+0.85*s.cap);
    s.m=Math.max(0,s.m+(3.5*s.tx-0.35*s.m)*dt);
    s.B=Math.max(0,s.B+(6*s.m-0.023*s.B)*dt);},
  metrics:[
    {id:'state',label:'Lac genes',unit:'',lvl:'bio',text:true,get:s=>stateOf(s.st.tx)},
    {id:'mrna',label:'lac mRNA',unit:'copies per cell',lvl:'bio',min:0,max:12,d:1,get:s=>s.st.m},
    {id:'bgal',label:'β-galactosidase',unit:'per cell',lvl:'bio',min:0,max:3000,d:0,get:s=>s.st.B},
    {id:'rep',label:'Repressor on operator',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>100*(1-s.st.Of)},
    {id:'lacin',label:'Lactose inside the cell',unit:'% of max',lvl:'honors',min:0,max:100,d:0,get:s=>Math.min(100,100*s.st.A/0.3)},
    {id:'capb',label:'cAMP–CAP bound',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>100*s.st.cap},
    {id:'tx',label:'Transcription rate',unit:'% of max',lvl:'ap',min:0,max:100,d:0,get:s=>100*s.st.tx}
  ],
  defaultGraph:'bgal',
  narrate(sim){const p=sim.p,s=sim.st,hon=atLeast('honors'),st=stateOf(s.tx),nm=s.m.toFixed(1);
    if(p.lacI)return '<b>This cell can’t make a working repressor (lacI⁻).</b> Nothing blocks the operator, so the genes are transcribed whether or not lactose is present'+(p.glc?'. Glucose still keeps CAP off, so the rate is low.':'.');
    if(p.Oc)return '<b>The operator is mutated (Oᶜ)</b>, so the repressor can’t grab it. RNA polymerase gets through with or without lactose'+(p.glc?', though glucose keeps the rate low.':'.');
    if(p.capm&&p.lac&&!p.glc)return '<b>CAP can’t bind the DNA.</b> The repressor is off, but without CAP’s boost RNA polymerase rarely starts, so the genes stay low.';
    if(!p.lac){if(s.B>400)return '<b>The lactose is gone.</b> The repressor is back on the operator, so new mRNA stops within minutes. The β-galactosidase already made slowly dilutes as the cells divide.';
      return '<b>No lactose, so the genes stay off.</b> The repressor sits on the operator and blocks RNA polymerase, saving the cell the energy of making enzymes it doesn’t need.';}
    if(p.glc)return hon?'<b>Lactose has pulled the repressor off, but glucose is here too.</b> With glucose around, cAMP is low and CAP can’t help RNA polymerase, so transcription stays low. The cell uses glucose first.':'<b>Lactose is here, but so is glucose</b>, the sugar the cell prefers. The lactose genes turn on only a little.';
    if(st!=='On')return '<b>Lactose is leaking in.</b> As it builds up, it pulls repressors off the operator one by one. The genes are switching on.';
    return hon?'<b>Fully on.</b> Allolactose has pulled the repressor off the operator, and with no glucose, cAMP–CAP helps RNA polymerase bind. About '+nm+' mRNAs per cell are being translated into β-galactosidase to digest lactose.':'<b>The genes are on.</b> Lactose pulled the repressor off the switch, so RNA polymerase reads the genes and the cell makes β-galactosidase, the enzyme that digests lactose.';},
  tour:[
    {title:'The lac operon',text:{bio:'This strip is a short piece of E. coli DNA. The three genes on the right hold the instructions for proteins that let the cell use lactose (milk sugar).',honors:'An operon is a cluster of genes under one switch. lacZ, lacY and lacA share a single promoter and operator, so they turn on and off together.'},focus:[15,278,770,90],speed:0.25},
    {title:'The repressor blocks the switch',text:{bio:'With no lactose, a repressor protein (purple) sits on the operator, the gene’s on/off switch. RNA polymerase (teal) can’t get past it, so the genes are off.',honors:'The lacI gene makes a repressor that binds the operator. It physically blocks RNA polymerase, which is parked on the promoter.'},focus:[190,200,160,130],speed:0.25,setup(sim){BioLab.setValues(sim,{lac:false,glc:false});}},
    {title:'Lactose arrives',text:{bio:'Now lactose appears outside. A little leaks in and grabs the repressor (watch for orange shapes on it). The repressor changes shape and lets go of the switch.',honors:'Some lactose that enters is converted to allolactose, which binds the repressor. The repressor changes shape, falls off the operator, and RNA polymerase can move.'},focus:[[0,0,800,230],[190,230,160,95]],speed:0.5,setup(sim){BioLab.setValues(sim,{lac:true});}},
    {title:'Reading the genes',text:'RNA polymerase slides along the genes, copying them into one long mRNA (red). Watch a new strand grow behind each polymerase.',focus:[190,200,595,170],speed:0.25},
    {title:'Making the enzyme',text:{bio:'Ribosomes (gray) read the mRNA and build β-galactosidase (green). It cuts lactose into two smaller sugars the cell can use for energy.',honors:'Ribosomes translate the mRNA into β-galactosidase, which splits lactose into glucose and galactose, and permease, which pumps more lactose in. More permease brings in more lactose: positive feedback.'},focus:[0,80,800,140],speed:0.5},
    {lvl:'honors',title:'Glucose comes first',text:'Add glucose. With glucose around, cAMP falls and CAP (blue) leaves its site. Without CAP’s help, RNA polymerase rarely starts, so transcription drops to a low level. This is catabolite repression.',focus:[130,200,220,130],speed:0.5,setup(sim){BioLab.setValues(sim,{glc:true});}},
    {lvl:'ap',title:'Switching off',text:'Remove both sugars. mRNA disappears within minutes because it is unstable (half-life about 2 minutes). β-galactosidase is stable, so it lingers and is only diluted as the cells divide. Compare the two graphs.',focus:[0,80,800,290],speed:1,setup(sim){BioLab.setValues(sim,{lac:false,glc:false});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{lac:false,glc:false});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'Lactose appears, and there is no glucose. What happens to β-galactosidase?',choices:['It stays near zero','It rises a lot','It falls'],correct:1,
     baseline:{lac:false,glc:false},change:{lac:true},changeText:'Lactose added',watch:'bgal',
     explain:{bio:'Lactose pulls the repressor off the operator, so RNA polymerase can read the genes. The cell makes β-galactosidase only when there is lactose to digest.'}},
    {lvl:'bio',q:'The cell has used up all its lactose. What happens to the lac mRNA?',choices:['It keeps rising','It drops quickly as the repressor binds again','It stays the same'],correct:1,
     baseline:{lac:true,glc:false},change:{lac:false},changeText:'Lactose removed',watch:'mrna',
     explain:{bio:'With no lactose left, the repressor goes back onto the operator and new mRNA stops. mRNA breaks down in a couple of minutes, so the level falls fast.'}},
    {lvl:'honors',q:'Both glucose and lactose are present. How much does the operon turn on?',choices:['Fully on','Only a little (low)','Not at all'],correct:1,
     baseline:{lac:false,glc:true},change:{lac:true},changeText:'Lactose added (glucose still present)',watch:'mrna',
     explain:{honors:'Lactose removes the repressor, but glucose keeps cAMP low, so CAP can’t boost RNA polymerase. Transcription stays low until the glucose is used up. This is catabolite repression.'}},
    {lvl:'honors',q:'Cells are digesting lactose when glucose is added. What happens to transcription of the lac genes?',choices:['It rises','It drops to a low level','No change'],correct:1,
     baseline:{lac:true,glc:false},change:{glc:true},changeText:'Glucose added',watch:'mrna',
     explain:{honors:'Glucose lowers cAMP, so cAMP–CAP leaves the DNA. The repressor is still off, but without CAP, RNA polymerase binds the weak lac promoter poorly and mRNA falls to a low level.'}},
    {lvl:'ap',q:'A lacI⁻ mutant makes no working repressor. With no lactose and no glucose, what is the operon doing?',choices:['Off','On, all the time','Low'],correct:1,
     baseline:{lacI:true,lac:false,glc:false},change:{lac:false},changeText:'Watching the lacI⁻ mutant',watch:'mrna',
     explain:{ap:'With no repressor, nothing blocks the operator, so expression is constitutive: on whether or not lactose is present. CAP still works, so glucose would lower it.'}},
    {lvl:'ap',q:'An Oᶜ mutant has an operator the repressor can’t bind. No lactose, no glucose. What happens?',choices:['Off, because there is no lactose','On, all the time','Low'],correct:1,
     baseline:{Oc:true,lac:false,glc:false},change:{lac:false},changeText:'Watching the Oᶜ mutant',watch:'mrna',
     explain:{ap:'The repressor is made normally but has nowhere to bind, so the operon is constitutive. Because the operator acts only on the DNA it is part of (cis-acting), a normal second copy of lacI can’t fix it.'}},
    {lvl:'ap',q:'A CAP⁻ mutant gets lactose and no glucose. What happens to the operon?',choices:['Fully on','Low','Off'],correct:1,
     baseline:{capm:true,lac:false,glc:false},change:{lac:true},changeText:'Lactose added to the CAP⁻ mutant',watch:'mrna',
     explain:{ap:'The repressor comes off, but the lac promoter is weak without the cAMP–CAP activator. Full expression needs both: no repressor (negative control) and CAP bound (positive control).'}}
  ],
  lab:{bio:'<p><b>Question:</b> When does E. coli make β-galactosidase?</p><ol><li>Record a trial with no sugars after the readings settle.</li><li>Turn on lactose and record a trial every 5 minutes for 20 minutes.</li><li>Turn lactose off and keep recording for 20 more minutes.</li></ol><p>Explain why the cell makes the enzyme only some of the time.</p>',
       honors:'<p><b>Question:</b> How do lactose and glucose together control the lac genes?</p><ol><li>Test all four combinations: neither, lactose only, glucose only, both.</li><li>For each, wait about 20 minutes, then record mRNA and β-galactosidase.</li></ol><p>Make a table, and explain the result of each combination using the repressor and CAP.</p>',
       ap:'<p><b>Question:</b> Which parts are needed for normal regulation?</p><ol><li>For the normal cell and each mutant (lacI⁻, Oᶜ, CAP⁻), record mRNA with no sugar, lactose only, and lactose + glucose.</li></ol><p><b>Claim–evidence–reasoning:</b> Classify each control as negative or positive, and predict what happens in a cell with both lacI⁻ and CAP⁻.</p>'},
  terms:[{t:'Gene expression',d:'Using a gene’s instructions to make a product, usually a protein.'},{t:'Repressor',d:'A protein that blocks transcription by binding the DNA.'},{t:'Operator',d:'The DNA “switch” where the repressor binds.'},{t:'Promoter',d:'Where RNA polymerase binds to start transcription.'},
    {lvl:'honors',t:'Operon',d:'A group of genes under the control of one promoter and operator.'},{lvl:'honors',t:'Inducer',d:'A molecule, like allolactose, that turns an operon on by disabling its repressor.'},{lvl:'honors',t:'CAP (catabolite activator protein)',d:'With cAMP bound, it helps RNA polymerase bind. Glucose keeps cAMP low.'},
    {lvl:'ap',t:'Constitutive',d:'Expressed all the time, regardless of conditions.'},{lvl:'ap',t:'Negative vs. positive control',d:'A repressor blocks transcription (negative). An activator like CAP boosts it (positive).'},{lvl:'ap',t:'cis-acting',d:'A DNA site, like the operator, that affects only genes on the same DNA molecule.'}],
  about:'<p><b>Model (per cell, time in minutes):</b> active repressor R = 1/(1 + (A/0.05)²), where A is the lactose/allolactose level inside the cell. Operator free = 1 − 0.98R, which leaves a 2% leak. CAP activity is 1 without glucose and 0.1 with glucose. Transcription = free × (0.15 + 0.85·CAP). mRNA: dm/dt = 3.5·tx − 0.35·m. β-galactosidase: dB/dt = 6m − 0.023B, where the loss is dilution by cell division. Lactose uptake rises with permease (proportional to B), and β-galactosidase breaks it down.</p><p><b>Simplified:</b> allolactose and lactose are lumped together. Inducer exclusion (glucose blocking lactose uptake) and the third operator are left out. Numbers are typical orders of magnitude: a fully induced cell has a few thousand β-galactosidase molecules.</p>',
  initVis(sim){const r=rng(31),v=sim.vis;v.bslots=[];for(let i=0;i<16;i++)v.bslots.push([36+r()*290,112+r()*92,r()*6.28]);
    v.mslots=[];[[110],[150],[190]].forEach((row,j)=>{for(let i=0;i<4;i++)v.mslots.push([372+i*100+(j%2)*20,row[0]+r()*8]);});
    v.out=[];for(let i=0;i<10;i++)v.out.push([180+r()*600,14+r()*30,r()*6.28]);
    v.lin=[];v.pols=[];v.cuts=[];v.pAcc=0;v.cAcc=0;v.bound=true;v.ry=270;v.capOn=true;v.sampleT=0;v.capT=0;},
  draw(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st,v=sim.vis,R=Math.random,hon=atLeast('honors'),ap=atLeast('ap'),TS=sim.def.timeScale;
    // outside, membrane, cytoplasm
    ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,800,52);ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,76,800,374);
    ctx.fillStyle=PAL['cv-tail'];ctx.fillRect(0,52,800,24);ctx.fillStyle=PAL['cv-head'];for(let x=6;x<800;x+=11){ctx.beginPath();ctx.arc(x,55,4,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(x,73,4,0,6.29);ctx.fill();}
    txt(ctx,'OUTSIDE THE CELL',12,20,{s:11.5*k,w:700,c:PAL['cv-soft']});txt(ctx,'INSIDE E. COLI',12,98,{s:11.5*k,w:700,c:PAL['cv-soft']});
    // permeases in the membrane, in proportion to the operon's output
    const np=Math.min(6,Math.round(s.B/400));for(let i=0;i<np;i++){const x=420+i*62;ctx.fillStyle='#b57a00';rr(ctx,x-8,48,16,32,6);ctx.fill();ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(x-2,50,4,28);}
    // sugars outside
    v.out.forEach((o,i)=>{const x=o[0]+(RM?0:Math.sin(t*.7+o[2])*6),y=o[1];if(p.lac&&i<6)lactose(ctx,x,y,6);else if(p.glc&&i>=4)hex(ctx,x,y,7,PAL['s4']);});
    // lactose inside (random walk), count from the model
    const nl=Math.min(18,Math.round(s.A*55));while(v.lin.length<nl)v.lin.push({x:20+R()*760,y:95+R()*110,vx:0,vy:0});if(v.lin.length>nl)v.lin.length=nl;
    for(const a of v.lin){a.vx+=(R()-.5)*300*vdt;a.vy+=(R()-.5)*300*vdt;const sp=Math.hypot(a.vx,a.vy);if(sp>30){a.vx*=30/sp;a.vy*=30/sp;}a.x=clamp(a.x+a.vx*vdt,20,780);a.y=clamp(a.y+a.vy*vdt,92,208);lactose(ctx,a.x,a.y,5.5);}
    // β-galactosidase and cutting events
    const nb=Math.min(16,Math.round(s.B/160));for(let i=0;i<nb;i++){const q=v.bslots[i];bgal(ctx,q[0]+(RM?0:Math.sin(t*.5+q[2])*3),q[1]);}
    if(nb>0&&vdt>0){v.cAcc+=Math.min(5*vdt,s.brk*TS*vdt*8);while(v.cAcc>=1){v.cAcc--;const q=v.bslots[Math.floor(R()*nb)];v.cuts.push({x:q[0],y:q[1],life:1});}}
    for(const c of v.cuts){c.life-=vdt;const d=(1-c.life)*22;ctx.globalAlpha=clamp(c.life,0,1);hex(ctx,c.x-8-d,c.y-6,5,PAL['s4']);hex(ctx,c.x+8+d,c.y-6,5,PAL['s5']);}
    ctx.globalAlpha=1;v.cuts=v.cuts.filter(c=>c.life>0);
    // mRNA strands with ribosomes
    const nm=Math.min(12,Math.round(s.m));for(let i=0;i<nm;i++){const q=v.mslots[i];ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();
      for(let j=0;j<=24;j++){const x=q[0]+j*4,y=q[1]+Math.sin(j*0.9+i)*3;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
      for(let rb=0;rb<2;rb++){const f=((t*0.25+i*0.37+rb*0.5)%1),x=q[0]+f*96,y=q[1]+Math.sin(f*24*0.9+i)*3;ctx.fillStyle=PAL['cv-soft'];ctx.beginPath();ctx.ellipse(x,y-6,8,6,0,0,6.29);ctx.fill();ctx.beginPath();ctx.ellipse(x,y+3,6,4,0,0,6.29);ctx.fill();}}
    // DNA regions
    REG.forEach(g=>{if(g.lvl&&!hon)return;ctx.fillStyle=PAL[g.c];ctx.globalAlpha=.22;rr(ctx,g.x0+1,280,g.x1-g.x0-2,40,6);ctx.fill();ctx.globalAlpha=1;});
    if(p.Oc){ctx.save();rr(ctx,269,280,60,40,6);ctx.clip();ctx.strokeStyle=PAL['s5'];ctx.lineWidth=2;for(let x=250;x<340;x+=9){ctx.beginPath();ctx.moveTo(x,280);ctx.lineTo(x+40,320);ctx.stroke();}ctx.restore();}
    ctx.lineWidth=3;['s2','s6'].forEach((c,j)=>{ctx.strokeStyle=j?PAL['cv-soft']:PAL['cv-ink'];ctx.beginPath();for(let x=20;x<=780;x+=4){const y=300+Math.sin(x*0.06+j*Math.PI)*10;x>20?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();});
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.globalAlpha=.6;ctx.beginPath();for(let x=24;x<780;x+=10.5){const y1=300+Math.sin(x*0.06)*10,y2=300+Math.sin(x*0.06+Math.PI)*10;ctx.moveTo(x,y1);ctx.lineTo(x,y2);}ctx.stroke();ctx.globalAlpha=1;
    // labels
    const big=k>1.25;
    if(hon){REG.forEach(g=>{const cx=(g.x0+g.x1)/2,stag=big&&g.n==='Promoter';txt(ctx,g.n,cx,stag?364:342,{s:12.5*k,w:700,a:'center'});if(!big)txt(ctx,g.h,cx,359,{s:11*k,c:PAL['cv-soft'],a:'center'});});}
    else{txt(ctx,big?'lacI':'Repressor gene',75,342,{s:12.5*k,w:700,a:'center'});txt(ctx,'Promoter',234,big?364:342,{s:12*k,w:700,a:'center'});txt(ctx,'Switch',299,342,{s:12*k,w:700,a:'center'});if(!big)txt(ctx,'(operator)',299,358,{s:11*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'Genes for using lactose',555,342,{s:12.5*k,w:700,a:'center'});}
    if(p.lacI){ctx.strokeStyle='#d32f2f';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(30,284);ctx.lineTo(120,316);ctx.moveTo(120,284);ctx.lineTo(30,316);ctx.stroke();}
    // stochastic visual states follow the model's probabilities
    v.sampleT-=vdt;if(v.sampleT<=0){v.sampleT=0.5;v.bound=!p.lacI&&!p.Oc&&R()<1-s.Of;}
    v.capT-=vdt;if(v.capT<=0){v.capT=0.6;v.capOn=R()<s.cap;}
    if(hon){if(v.capOn)cap(ctx,175,268,1);else if(!p.capm||true)cap(ctx,160,228+(RM?0:Math.sin(t*1.3)*4),p.capm?0.45:0.7);}
    // polymerases
    const startRate=(0.15+0.85*s.cap)*1.8;
    if(!v.bound&&vdt>0){v.pAcc+=startRate*vdt;while(v.pAcc>=1){v.pAcc--;if(!v.pols.some(q=>q.x<300))v.pols.push({x:234});}}
    for(const q of v.pols){q.x+=170*vdt;if(q.x>330){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();for(let x=330;x<=q.x;x+=4){const y=268-Math.sin((x-330)*0.12)*3-(x-330)*0.02;x>330?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}polymerase(ctx,q.x,300);}
    v.pols=v.pols.filter(q=>q.x<790);
    if(!v.pols.some(q=>q.x<262))polymerase(ctx,234,300);
    // repressor
    if(!p.lacI){const ty=v.bound?270:224+(RM?0:Math.sin(t*1.1)*5);v.ry=lerp(v.ry,ty,Math.min(1,vdt*5));repressor(ctx,299,v.ry,1,!v.bound&&s.A>0.02);}
    // legend
    let lx=14,ly=k>1.25?392:402;const item=(draw,label)=>{ctx.font='400 '+12*k+'px '+FONT;const w=ctx.measureText(label).width+52;if(lx+w>790){lx=14;ly+=12*k+10;}ctx.save();ctx.translate(lx+12,ly-4);ctx.scale(0.75,0.75);draw(0,0);ctx.restore();txt(ctx,label,lx+30,ly,{s:12*k,c:PAL['cv-soft']});lx+=w;};
    item((x,y)=>{ctx.fillStyle='#2b7a68';rr(ctx,x-8,y-7,16,14,5);ctx.fill();},'RNA polymerase');
    item((x,y)=>repressor(ctx,x,y,1,false),'repressor');
    if(hon)item((x,y)=>cap(ctx,x,y+2,1),'CAP–cAMP');
    item((x,y)=>{ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-9,y);ctx.lineTo(x+9,y);ctx.stroke();},'mRNA');
    item((x,y)=>bgal(ctx,x,y),'β-galactosidase');
    item((x,y)=>lactose(ctx,x,y,5),'lactose');
    item((x,y)=>hex(ctx,x,y,6,PAL['s4']),'glucose');
    if(hon)item((x,y)=>{ctx.fillStyle='#b57a00';rr(ctx,x-5,y-8,10,16,4);ctx.fill();},'permease');
    // status pill
    pill(ctx,'Lac genes: '+stateOf(s.tx).toUpperCase(),700,98,stateOf(s.tx)==='On'?'#1b7339':stateOf(s.tx)==='Low'?'#b86e00':PAL['cv-soft'],'#fff',12*k);}
};
BioLab.register(LAC);
})();
