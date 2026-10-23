(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,RM,axes,legend,serColor,fmtNum}=BioLab.h;

/* Glucose → glycolysis → pyruvate oxidation → Krebs → electron transport, or fermentation.
   Each glucose follows a fixed timeline; ledger events fire as it reaches each stage. */
const CC=['#d1495b','#e39b2d','#4f9a6a','#00798c','#30638e','#8e5572']; // one color per glucose carbon
const SPAWN=4;
const GLY=[[1.5,{atp:-2,tag:'−2 ATP',x:95,y:172}],[3.5,{atp:4,nadh:2,tag:'+4 ATP, +2 NADH',x:95,y:297}]];
const AER=[[6.0,{co2:2,nadh:2,tag:'+2 CO₂, +2 NADH',x:440,y:262,co2c:[2,5]}],[8.5,{co2:2,nadh:2,tag:'+2 CO₂, +2 NADH',x:690,y:120,co2c:[0,3]}],
  [9.5,{co2:2,nadh:2,atp:2,tag:'+2 CO₂, +2 NADH, +2 ATP',x:690,y:250,co2c:[1,4]}],[10.2,{fadh:2,nadh:2,tag:'+2 FADH₂, +2 NADH',x:520,y:306}],
  [12.0,{atp:28,ox:28,o2:6,tag:'+28 ATP',x:735,y:345}]];
const FER={yeast:[[6.0,{co2:2,nadhUsed:2,eth:2,tag:'+2 CO₂, 2 ethanol',x:205,y:372,co2c:[2,5]}]],muscle:[[6.0,{nadhUsed:2,lac:2,tag:'2 lactate',x:205,y:372}]]};
const END={aer:12.6,yeast:7.2,muscle:7.2};
const SUG={glu:{l:'Glucose',f:1,lag:3},suc:{l:'Sucrose',f:0.85,lag:6},lac:{l:'Lactose',f:0.03,lag:6},none:{l:'Water only',f:0,lag:3}};
const yT=T=>Math.pow(2,(T-30)/10)/(1+Math.exp((T-45)/2.5));
const WHEEL={x:600,y:190,r:72};

function newYeast(){const y={};for(const k in SUG)y[k]={V:0,S:5,rate:0};return y;}
function hideTiles(sim){if(!sim.ui||!sim.ui.tiles)return;const bal=sim.p.mode==='balloon'&&atLeast('honors');
  ['b_glu','b_suc','b_lac','b_none'].forEach(id=>{const t=sim.ui.tiles[id];if(t)t.num.closest('.tile').hidden=!bal;});}
function perGlucose(p){const aer=p.o2;return {atp:aer?32:2,nadh:aer?10:2,fadh:aer?2:0,ox:aer?28:0,co2:aer?6:(p.ferm==='muscle'?0:2)};}

const SIM={
  id:'glycolysis',hash:'glycolysis',apUnit:3,order:4,kind:'Process walkthrough',tab:'Glycolysis, Krebs cycle and fermentation',
  card:'Follow the six carbons of one glucose through glycolysis and the Krebs cycle, then take away oxygen and watch fermentation take over.',
  title:'Glycolysis, the Krebs cycle and fermentation',
  next:['respiration'],
  lede:{bio:'Follow one glucose molecule as your cells break it apart for energy. With oxygen, it makes about 32 ATP. Without oxygen, only 2.',
        honors:'Track each carbon from glucose to CO₂, count the ATP, NADH and FADH₂ at every stage, and compare aerobic respiration with fermentation in yeast and muscle.',
        ap:'Account for every ATP: substrate-level phosphorylation in glycolysis and the Krebs cycle, oxidative phosphorylation from NADH and FADH₂, and why fermentation exists at all.'},
  scale:'Inside one cell: the cytoplasm on the left, one mitochondrion (about 2 µm long) on the right. A real cell runs millions of glucose molecules through this at once.',
  timeScale:1,dtMax:0.02,prewarm:13,sampleDt:0.1,window:40,unit:'s',chChange:3,chReveal:10,
  clock(sim){return sim.p.mode==='balloon'&&atLeast('honors')?'Yeast lab: '+sim.t.toFixed(1)+' min':'t = '+sim.t.toFixed(1)+' s';},
  controls:[
    {id:'mode',label:'View',type:'seg',def:'cell',lvl:'honors',options:[{v:'cell',l:'Inside the cell'},{v:'balloon',l:'Yeast balloon lab'}],noTrial:true,
     onChange(sim){hideTiles(sim);sim.gMetric=sim.p.mode==='balloon'?'balloons':'atp';if(sim.ui&&sim.ui.gm&&[...sim.ui.gm.options].some(o=>o.value===sim.gMetric))sim.ui.gm.value=sim.gMetric;}},
    {id:'o2',label:'Oxygen available',type:'toggle',def:true,lvl:'bio',help:'Without O₂ the electron transport chain stops.'},
    {id:'ferm',label:'Fermenting cell',type:'seg',def:'yeast',lvl:'honors',options:[{v:'yeast',l:'Yeast'},{v:'muscle',l:'Muscle'}],help:'What happens to pyruvate when there is no oxygen.'},
    {id:'temp',label:'Yeast lab temperature',type:'range',min:5,max:55,step:1,def:30,unit:' °C',lvl:'honors',help:'Used in the yeast balloon lab.'}
  ],
  init(){return {time:0,next:0,gl:[],atp:0,nadh:0,fadh:0,co2:0,o2:0,eth:0,lac:0,gluc:0,ox:0,y:newYeast(),pops:[]};},
  afterPrewarm(sim){const s=sim.st;['atp','nadh','fadh','co2','o2','eth','lac','gluc','ox'].forEach(k=>s[k]=0);s.y=newYeast();s.pops=[];s.gl.forEach(g=>{g.fired=g.fired;});},
  step(sim,dt){const s=sim.st,p=sim.p;s.time+=dt;
    if(s.time>=s.next){s.gl.push({t0:s.next,path:null,fi:0,fp:0,gone:{}});s.next+=SPAWN;s.gluc++;}
    s.gl.forEach(g=>{const age=s.time-g.t0;
      while(g.fi<GLY.length&&age>=GLY[g.fi][0]){apply(s,GLY[g.fi][1]);g.fi++;}
      if(!g.path&&age>=5)g.path=p.o2?'aer':(p.ferm==='muscle'?'muscle':'yeast');
      if(g.path){const ev=g.path==='aer'?AER:FER[g.path];while(g.fp<ev.length&&age>=ev[g.fp][0]){const e=ev[g.fp][1];apply(s,e);(e.co2c||[]).forEach(c=>g.gone[c]=1);g.fp++;}}});
    s.gl=s.gl.filter(g=>!(g.path&&s.time-g.t0>END[g.path]));
    // yeast balloon flasks (sim seconds read as minutes)
    for(const k in SUG){const f=s.y[k],sg=SUG[k];const r=12*yT(p.temp)*sg.f*f.S/(f.S+0.5)*(1-Math.exp(-sim.t/sg.lag));f.rate=Math.max(0,r);f.V+=f.rate*dt;f.S=Math.max(0,f.S-f.rate*dt*0.004);}},
  metrics:[
    {id:'atpPer',label:'ATP per glucose',unit:'',lvl:'bio',min:0,max:34,d:0,get:s=>perGlucose(s.p).atp},
    {id:'atpTot',label:'ATP made so far',unit:'',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.atp},
    {id:'co2Tot',label:'CO₂ released',unit:'molecules',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.co2},
    {id:'gluc',label:'Glucose used',unit:'molecules',lvl:'honors',min:0,max:null,d:0,get:s=>s.st.gluc},
    {id:'nadhPer',label:'NADH made per glucose',unit:'',lvl:'honors',min:0,max:12,d:0,get:s=>perGlucose(s.p).nadh},
    {id:'fadhPer',label:'FADH₂ per glucose',unit:'',lvl:'ap',min:0,max:3,d:0,get:s=>perGlucose(s.p).fadh},
    {id:'oxPer',label:'ATP from electron transport',unit:'per glucose',lvl:'ap',min:0,max:30,d:0,get:s=>perGlucose(s.p).ox},
    {id:'b_glu',label:'Balloon: glucose',unit:'mL CO₂',lvl:'honors',min:0,max:null,d:0,get:s=>s.st.y.glu.V},
    {id:'b_suc',label:'Balloon: sucrose',unit:'mL CO₂',lvl:'honors',min:0,max:null,d:0,get:s=>s.st.y.suc.V},
    {id:'b_lac',label:'Balloon: lactose',unit:'mL CO₂',lvl:'honors',min:0,max:null,d:0,get:s=>s.st.y.lac.V},
    {id:'b_none',label:'Balloon: water only',unit:'mL CO₂',lvl:'honors',min:0,max:null,d:0,get:s=>s.st.y.none.V}
  ],
  graphs:[{id:'atp',label:'ATP made so far',lines:['atpTot']},{id:'co2',label:'CO₂ released',lines:['co2Tot']},{id:'balloons',label:'Yeast balloons (CO₂ volume)',lvl:'honors',custom:true}],
  defaultGraph:'atp',
  plot(sim,ctx,box){const keys=['b_glu','b_suc','b_lac','b_none'],names=['Glucose','Sucrose','Lactose','Water only'];
    const h=sim.hist,xmax=Math.max(40,sim.t),xmin=xmax-40;let ymax=50;h.forEach(r=>keys.forEach(k=>{if(r.v[k]>ymax)ymax=r.v[k];}));
    const ax=axes(ctx,{...box,T:34,H:box.H-22},{xmin,xmax,ymin:0,ymax:ymax*1.1,xl:'Time (min)',yl:'CO₂ in balloon (mL)'});
    keys.forEach((k,i)=>{const pts=h.filter(r=>r.t>=xmin);if(pts.length<2)return;ctx.strokeStyle=serColor(i);ctx.lineWidth=2.5;ctx.beginPath();pts.forEach((r,j)=>{j?ctx.lineTo(ax.X(r.t),ax.Y(r.v[k])):ctx.moveTo(ax.X(r.t),ax.Y(r.v[k]));});ctx.stroke();});
    legend(ctx,box.L,14,names.map((n,i)=>({label:n,color:serColor(i)})));},
  onLevel(sim){hideTiles(sim);},
  initVis(sim){sim.vis.tok=[];sim.vis.co2=[];sim.vis.tags=[];sim.vis.seen=new WeakMap();sim.vis.bub=[[],[],[],[]];},
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis,hon=atLeast('honors'),ap=atLeast('ap');if(!v.tok)SIM.initVis(sim);
    if(p.mode==='balloon'&&hon){drawBalloons(sim,ctx,vdt,k,t);return;}
    // background: cytoplasm and mitochondrion
    ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,800,450);
    ctx.fillStyle=PAL['cv-matrix'];ctx.strokeStyle=PAL['cv-head'];ctx.lineWidth=7;rr(ctx,352,50,438,388,90);ctx.fill();ctx.stroke();
    ctx.strokeStyle=PAL['cv-head'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(380,368);
    for(let x=380;x<=770;x+=30){ctx.lineTo(x+8,368);ctx.lineTo(x+8,330);ctx.arc(x+15,330,7,Math.PI,0);ctx.lineTo(x+22,368);}ctx.stroke();
    txt(ctx,'CYTOPLASM',14,440,{s:12*k,w:700,c:PAL['cv-soft']});txt(ctx,'MITOCHONDRION',402,82,{s:12*k,w:700,c:PAL['cv-soft']});
    // ledger strip
    ctx.fillStyle=PAL['card'];rr(ctx,8,6,784,30,8);ctx.fill();
    const pg=perGlucose(p);
    txt(ctx,'Per glucose: '+pg.atp+' ATP · '+pg.nadh+' NADH'+(hon&&k<1.3?' · '+pg.fadh+' FADH₂':'')+' · '+pg.co2+' CO₂'+(p.o2?'':(p.ferm==='muscle'&&hon?' · 2 lactate':' · 2 ethanol')),18,26,{s:14*k,w:700});
    if(k<1.3)txt(ctx,'Total so far: '+s.atp+' ATP, '+s.co2+' CO₂',782,26,{s:12.5*k,c:PAL['cv-soft'],a:'right'});
    // glycolysis lane labels
    const steps=(hon&&k<1.3)?[['Glucose (6 carbons)',80],['Uses 2 ATP',140],['Splits into two 3-carbon sugars',200],['Makes 4 ATP and 2 NADH',265],['2 pyruvate (3 carbons each)',325]]
                   :[['Glucose',80],['Uses 2 ATP',140],['Splits in half',200],['Makes 4 ATP',265],['2 pyruvate',325]];
    txt(ctx,'GLYCOLYSIS',172,58,{s:12*k,w:700,c:PAL['s1']});
    steps.forEach(q=>txt(ctx,q[0],172,q[1]+4,{s:12.5*k,c:PAL['cv-ink']}));
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=2;ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(95,60);ctx.lineTo(95,330);ctx.stroke();ctx.setLineDash([]);
    // Krebs wheel
    const W=WHEEL;ctx.strokeStyle=PAL['s4'];ctx.lineWidth=10;ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(W.x,W.y,W.r,0,6.29);ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle=PAL['s4'];for(let a=0;a<4;a++){const ang=t*0.6+a*Math.PI/2;ctx.beginPath();ctx.moveTo(W.x+Math.cos(ang)*(W.r+9),W.y+Math.sin(ang)*(W.r+9));ctx.lineTo(W.x+Math.cos(ang+0.12)*(W.r),W.y+Math.sin(ang+0.12)*(W.r));ctx.lineTo(W.x+Math.cos(ang)*(W.r-9),W.y+Math.sin(ang)*(W.r-9));ctx.fill();}
    txt(ctx,'Krebs',W.x,W.y-4,{s:15*k,w:700,a:'center'});txt(ctx,'cycle',W.x,W.y+14,{s:15*k,w:700,a:'center'});
    if(hon){txt(ctx,'citrate (6C)',W.x+W.r+12,W.y-40,{s:11.5*k,c:PAL['cv-soft']});txt(ctx,'oxaloacetate (4C)',W.x+10,W.y+W.r+18,{s:11.5*k,c:PAL['cv-soft'],a:'center'});}
    txt(ctx,hon?'Pyruvate oxidation':'Pyruvate → acetyl',440,232,{s:12.5*k,w:600,a:'center'});
    // electron transport band
    [[430,'#3f6fb0'],[480,'#2a8276'],[530,'#7a4fa6']].forEach(q=>{ctx.fillStyle=q[1];rr(ctx,q[0]-14,342,28,38,6);ctx.fill();});
    ctx.fillStyle='#b5122d';rr(ctx,722,338,26,44,6);ctx.fill();ctx.beginPath();ctx.arc(735,330,14,0,6.29);ctx.fill();
    txt(ctx,'Electron transport chain',480,402,{s:12*k,w:600,a:'center'});txt(ctx,'ATP synthase',735,402,{s:12*k,w:600,a:'center'});
    if(!p.o2){ctx.fillStyle='rgba(20,20,26,.35)';rr(ctx,352,50,438,388,90);ctx.fill();pill(ctx,'No O₂: the mitochondrion stalls',570,300,'#b3261e','#fff',13*k);}
    else{txt(ctx,'O₂',640,312,{s:13*k,w:700,c:PAL['s2']});txt(ctx,'+ e⁻ → H₂O',662,312,{s:11.5*k,c:PAL['cv-soft']});}
    // fermentation station
    if(!p.o2){ctx.strokeStyle=PAL['s5'];ctx.lineWidth=2;ctx.setLineDash([5,4]);rr(ctx,130,350,190,62,10);ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'FERMENTATION',140,368,{s:12*k,w:700,c:PAL['s5']});txt(ctx,hon&&p.ferm==='muscle'?'pyruvate → lactate':'pyruvate → ethanol + CO₂',140,388,{s:12*k});
      txt(ctx,'recycles NAD⁺',140,404,{s:11.5*k,c:PAL['cv-soft']});
      ctx.strokeStyle=PAL['s5'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(320,380);ctx.quadraticCurveTo(345,300,310,268);ctx.stroke();
      ctx.fillStyle=PAL['s5'];ctx.beginPath();ctx.moveTo(310,262);ctx.lineTo(318,276);ctx.lineTo(304,274);ctx.fill();txt(ctx,'NAD⁺',330,316,{s:11.5*k,w:600,c:PAL['s5']});}
    // glucose carbons
    s.gl.forEach(g=>{const age=s.time-g.t0;const pos=carbonPos(g,age);
      if(age>1.4&&age<5){[[-1],[1]].forEach((d,i)=>{const q=pos[i*3];if(q){ctx.fillStyle='#e39b2d';ctx.beginPath();ctx.arc(q.x+(i?14:-14),q.y-12,5,0,6.29);ctx.fill();txt(ctx,'P',q.x+(i?14:-14),q.y-11.5,{s:8,w:700,c:'#fff',a:'center',b:'middle'});}});}
      pos.forEach((q,ci)=>{if(!q||g.gone[ci])return;ctx.globalAlpha=q.a;ctx.fillStyle=CC[ci];ctx.beginPath();ctx.arc(q.x,q.y,6.5,0,6.29);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1;ctx.stroke();ctx.globalAlpha=1;});
      if(g.path&&g.path!=='aer'&&age>6.2){txt(ctx,g.path==='muscle'?'lactate':'ethanol',pos[0]?pos[0].x:200,(pos[0]?pos[0].y:390)+22,{s:11.5*k,w:600,c:PAL['s5'],a:'center'});}
      // pop tags + tokens for events this glucose just crossed
      const evs=GLY.concat(g.path==='aer'?AER:g.path?FER[g.path]:[]);
      evs.forEach(e=>{const key=e[0];if(age>=key&&age-key<vdt+1e-6&&vdt>0){const d=e[1];v.tags.push({x:d.x,y:d.y,s:d.tag,life:2.2});
        (d.co2c||[]).forEach(ci=>{const q=pos[ci]||{x:d.x,y:d.y};v.co2.push({x:q.x,y:q.y,c:CC[ci],life:3});});
        if(d.nadh>0)for(let i=0;i<d.nadh;i++)v.tok.push({x:d.x,y:d.y,tx:430+i*12,ty:350,c:PAL['s5'],l:'NADH',life:2});
        if(d.fadh>0)for(let i=0;i<d.fadh;i++)v.tok.push({x:d.x,y:d.y,tx:480,ty:350,c:PAL['s6'],l:'FADH₂',life:2});
        if(d.ox)for(let i=0;i<10;i++)v.tok.push({x:735,y:325,tx:735+(Math.random()-.5)*160,ty:250+Math.random()*60,c:PAL['cv-atp'],l:'ATP',life:1.6});}});});
    // floating tokens, CO2, tags
    v.tok.forEach(o=>{o.life-=vdt;o.x+=(o.tx-o.x)*Math.min(1,vdt*2.2);o.y+=(o.ty-o.y)*Math.min(1,vdt*2.2);ctx.globalAlpha=clamp(o.life/1.6,0,1);txt(ctx,o.l,o.x,o.y,{s:11*k,w:700,c:o.c,a:'center'});});
    v.co2.forEach(o=>{o.life-=vdt;o.y-=26*vdt;o.x+=18*vdt;ctx.globalAlpha=clamp(o.life/1.5,0,1);ctx.fillStyle=o.c;ctx.beginPath();ctx.arc(o.x,o.y,6,0,6.29);ctx.fill();ctx.fillStyle='#d8dde3';ctx.beginPath();ctx.arc(o.x-9,o.y,4.5,0,6.29);ctx.arc(o.x+9,o.y,4.5,0,6.29);ctx.fill();txt(ctx,'CO₂',o.x,o.y-12,{s:10.5*k,w:700,c:PAL['cv-soft'],a:'center'});});
    v.tags.forEach(o=>{o.life-=vdt;o.y-=8*vdt;ctx.globalAlpha=clamp(o.life,0,1);pill(ctx,o.s,o.x,o.y,PAL['card'],PAL['cv-ink'],11.5*k);});
    ctx.globalAlpha=1;v.tok=v.tok.filter(o=>o.life>0);v.co2=v.co2.filter(o=>o.life>0);v.tags=v.tags.filter(o=>o.life>0);
    if(v.tok.length>120)v.tok.splice(0,v.tok.length-120);if(v.tags.length>12)v.tags.splice(0,v.tags.length-12);
  },
  narrate(sim){const s=sim.st,p=sim.p,hon=atLeast('honors');
    if(p.mode==='balloon'&&hon){const y=s.y;return '<b>Yeast ferment sugar and release CO₂</b>, which inflates the balloons. Glucose: '+y.glu.V.toFixed(0)+' mL, sucrose: '+y.suc.V.toFixed(0)+' mL, lactose: '+y.lac.V.toFixed(0)+' mL, water only: '+y.none.V.toFixed(0)+' mL at '+p.temp+' °C.';}
    const g=s.gl.length?s.gl[0]:null;if(!g)return 'Waiting for the next glucose.';const age=s.time-g.t0;
    if(age<1.4)return '<b>A glucose molecule enters the cytoplasm.</b> Its six carbons are shown as six colored balls so you can follow each one.';
    if(age<2.2)return '<b>The cell invests 2 ATP</b>, sticking phosphate groups on the glucose to make it reactive. It spends energy to make energy.';
    if(age<3.2)return '<b>The 6-carbon sugar splits</b> into two 3-carbon pieces.';
    if(age<4.5)return '<b>Payoff:</b> each 3-carbon piece is oxidized, making 2 ATP and 1 NADH. That is 4 ATP in total, a net gain of 2.';
    if(!g.path||age<5.2)return '<b>Two pyruvate molecules</b> are ready. What happens next depends on oxygen.';
    if(g.path!=='aer'){return p.ferm==='muscle'&&hon?'<b>No oxygen, so muscle cells turn pyruvate into lactate.</b> This makes no ATP, but it turns NADH back into NAD⁺ so glycolysis can keep making its 2 ATP.':
      '<b>No oxygen, so yeast turn pyruvate into ethanol and CO₂.</b> This makes no ATP, but it recycles NAD⁺ so glycolysis can keep going.';}
    if(age<7.5)return '<b>Pyruvate enters the mitochondrion.</b> One carbon from each leaves as CO₂, and the rest becomes acetyl-CoA. This CO₂ is part of what you breathe out.';
    if(age<10.6)return '<b>The Krebs cycle</b> strips the remaining carbons off as CO₂ and loads the energy onto NADH and FADH₂ (plus 2 ATP).';
    return '<b>NADH and FADH₂ hand their electrons to the electron transport chain.</b> Oxygen accepts them, and ATP synthase makes about 28 more ATP.';},
  tour:[
    {title:'Glucose arrives',text:'A glucose molecule has six carbon atoms. Each colored ball is one carbon, so you can follow where every one ends up.',focus:[30,42,320,80],speed:0.25,setup(sim){BioLab.setValues(sim,{o2:true,mode:'cell'});}},
    {title:'Spend 2 ATP to start',text:'Glycolysis begins by spending 2 ATP. The phosphate groups (orange P) make glucose unstable enough to split.',focus:[30,105,320,70],speed:0.25},
    {title:'Split and payoff',text:{bio:'The sugar splits in half, and each half is broken down further, releasing energy: 4 ATP in all, so a net gain of 2.',honors:'The 6-carbon sugar splits into two 3-carbon sugars. Oxidizing them makes 4 ATP and 2 NADH, a net gain of 2 ATP. The end products are 2 pyruvate.'},focus:[30,170,320,175],speed:0.25},
    {title:'Into the mitochondrion',text:'With oxygen around, pyruvate enters the mitochondrion. One carbon from each pyruvate is released as CO₂, and NADH is made.',focus:[360,215,170,110],speed:0.25},
    {title:'The Krebs cycle',text:'The remaining carbons go around the Krebs cycle and leave as CO₂. Every carbon from the glucose has now been breathed out, and the energy is stored in NADH, FADH₂ and 2 ATP.',focus:[505,90,195,205],speed:0.25},
    {title:'Electron transport makes most of the ATP',text:'NADH and FADH₂ deliver electrons to the electron transport chain. Oxygen catches them at the end, and ATP synthase makes about 28 ATP. See the Cellular respiration simulation for this step up close.',focus:[400,300,370,115],speed:0.25},
    {lvl:'honors',title:'No oxygen: fermentation',text:'Take away oxygen and the mitochondrion stalls. Pyruvate is turned into ethanol and CO₂ (yeast) or lactate (muscle) instead. That makes no ATP, but it recycles NAD⁺ so glycolysis can keep making its 2 ATP.',focus:[30,240,330,190],speed:0.25,setup(sim){BioLab.setValues(sim,{o2:false});}},
    {lvl:'honors',title:'The yeast balloon lab',text:'Yeast in sealed flasks ferment sugar and release CO₂, which fills the balloons. Compare glucose, sucrose, lactose and plain water.',focus:[0,40,800,410],speed:2,setup(sim){BioLab.setValues(sim,{o2:true,mode:'balloon'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{o2:true,mode:'cell'});},
  lab:{bio:'<p><b>Question:</b> How much ATP does a cell get from one glucose, with and without oxygen?</p><ol><li>With oxygen on, watch one glucose all the way through and record a trial.</li><li>Turn oxygen off and record another trial.</li><li>Compare ATP per glucose and CO₂ released.</li></ol><p>Explain why you breathe harder during a sprint.</p>',
       honors:'<p><b>Question:</b> Which sugars can yeast ferment, and how does temperature change the rate?</p><ol><li>Switch to the yeast balloon lab. Record the four balloon volumes at 20 minutes.</li><li>Repeat at 15, 25, 35 and 45 °C (press Reset before each run).</li><li>Plot temperature (x) against the glucose balloon volume (y).</li></ol><p>Explain the lactose result and the shape of your temperature graph.</p>',
       ap:'<p><b>Question:</b> Where does each ATP come from?</p><ol><li>Record per-glucose ATP, NADH, FADH₂ and electron-transport ATP with oxygen, then without.</li><li>Calculate substrate-level vs. oxidative phosphorylation.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why fermentation evolved even though it makes no ATP itself.</p>'},
  terms:[{t:'Glycolysis',d:'Splitting glucose into 2 pyruvate in the cytoplasm. Net 2 ATP and 2 NADH. No oxygen needed.'},{t:'Krebs cycle',d:'A cycle in the mitochondrial matrix that releases CO₂ and loads energy onto NADH and FADH₂.'},{t:'Fermentation',d:'Turning pyruvate into ethanol and CO₂ or lactate when oxygen is missing.'},
    {lvl:'honors',t:'NADH / FADH₂',d:'Electron carriers that take energy to the electron transport chain.'},{lvl:'honors',t:'Pyruvate oxidation',d:'Pyruvate loses a CO₂ and becomes acetyl-CoA, which enters the Krebs cycle.'},{lvl:'honors',t:'NAD⁺ regeneration',d:'Fermentation turns NADH back into NAD⁺, which glycolysis needs to keep running.'},
    {lvl:'ap',t:'Substrate-level phosphorylation',d:'ATP made directly by an enzyme in glycolysis or the Krebs cycle (4 per glucose).'},{lvl:'ap',t:'Oxidative phosphorylation',d:'ATP made by ATP synthase using the H⁺ gradient from electron transport (about 28 per glucose).'}],
  about:'<p>Each glucose follows a fixed timeline, and the ledger adds up the textbook yields: glycolysis −2 + 4 ATP and 2 NADH; pyruvate oxidation 2 CO₂ and 2 NADH; Krebs cycle 4 CO₂, 6 NADH, 2 FADH₂ and 2 ATP; oxidative phosphorylation 2.5 ATP per NADH and 1.5 per FADH₂ (about 28), for about 32 in total. Many textbooks give 30–38. The real number depends on how NADH from the cytoplasm enters the mitochondrion.</p><p>Simplifications: the carbons that leave in the Krebs cycle are drawn as the acetyl carbons, though in a real first turn they come from oxaloacetate. Glucose arrives at a steady rate, while real cells speed up glycolysis when oxygen is short. The yeast lab treats each simulated second as one minute. Its CO₂ rate depends on temperature, the sugar (baker’s yeast lack lactase, and sucrose must be split first) and how much sugar is left.</p>',
  challenges:[
    {lvl:'bio',q:'The cell runs out of oxygen. How much ATP does each glucose make now?',choices:['About 32, same as before','Only 2','None at all'],correct:1,change:{o2:false},changeText:'Oxygen removed',watch:'atp',
     explain:{bio:'Without oxygen the mitochondrion can’t use NADH, so only glycolysis works. Each glucose gives just 2 ATP instead of about 32. That is why your muscles tire fast when they run short of oxygen.'}},
    {lvl:'bio',instant:true,q:'Where does the carbon in the CO₂ you breathe out come from?',choices:['From the oxygen you breathed in','From the glucose and other food you broke down','From water'],correct:1,
     explain:'Watch the colored carbon balls: they start in glucose and leave as CO₂ during pyruvate oxidation and the Krebs cycle. The oxygen you breathe in ends up in water.'},
    {lvl:'honors',q:'This flask holds yeast and water but no sugar. What happens to its balloon?',choices:['It inflates like the others','It stays almost flat','It inflates the most'],correct:1,baseline:{mode:'balloon'},reveal:22,changeText:'Yeast flasks fermenting',watch:'balloons',
     explain:'Fermentation needs a sugar to break down. With no sugar, the yeast make almost no CO₂, so the balloon stays flat. This flask is the control.'},
    {lvl:'honors',q:'Baker’s yeast is given lactose (milk sugar). Will it inflate the balloon like glucose does?',choices:['Yes, about the same','No, it barely inflates','It inflates faster than glucose'],correct:1,baseline:{mode:'balloon'},reveal:22,changeText:'Yeast flasks fermenting',watch:'balloons',
     explain:'Baker’s yeast don’t make lactase, the enzyme that splits lactose into glucose and galactose. Without it they can’t ferment lactose, so almost no CO₂ is made.'},
    {lvl:'honors',q:'You warm the yeast flasks from 20 °C to 37 °C. What happens to the glucose balloon?',choices:['It inflates faster','It inflates slower','No change'],correct:0,baseline:{mode:'balloon',temp:20},change:{temp:37},at:2,reveal:14,changeText:'Warmed to 37 °C',watch:'balloons',
     explain:'Fermentation runs on enzymes. Warming them toward their optimum speeds up the reactions, so CO₂ builds up faster. Too hot (above about 45 °C) and the enzymes denature.'},
    {lvl:'ap',instant:true,q:'Fermentation makes no ATP of its own. Why do cells do it?',choices:['It makes extra glucose','It turns NADH back into NAD⁺ so glycolysis can keep making 2 ATP','It produces oxygen'],correct:1,
     explain:'Glycolysis needs NAD⁺ to accept electrons. Without oxygen, NADH piles up and glycolysis would stop. Fermentation dumps those electrons onto pyruvate (or acetaldehyde), regenerating NAD⁺.'},
    {lvl:'ap',instant:true,q:'With oxygen, roughly how much of the ATP from one glucose comes from oxidative phosphorylation?',choices:['About 4 of 32','About 28 of 32','All 32'],correct:1,
     explain:'Glycolysis and the Krebs cycle make 4 ATP directly (substrate-level). The other ~28 come from ATP synthase powered by the electron transport chain: 10 NADH × 2.5 + 2 FADH₂ × 1.5 = 28.'}
  ]
};
function apply(s,e){if(e.atp)s.atp+=e.atp;if(e.nadh>0)s.nadh+=e.nadh;if(e.fadh)s.fadh+=e.fadh;if(e.co2)s.co2+=e.co2;if(e.o2)s.o2+=e.o2;if(e.eth)s.eth+=e.eth;if(e.lac)s.lac+=e.lac;if(e.ox)s.ox+=e.ox;}
function ease(x){x=clamp(x,0,1);return x*x*(3-2*x);}
function carbonPos(g,age){const out=[];const ring=(cx,cy)=>{for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/2;out[i]={x:cx+Math.cos(a)*15,y:cy+Math.sin(a)*15,a:1};}};
  const chain=(i0,cx,cy)=>{for(let j=0;j<3;j++)out[i0+j]={x:cx+(j-1)*13,y:cy,a:1};};
  if(age<1){ring(95,lerp(10,80,ease(age)));return out;}
  if(age<2){ring(95,lerp(80,140,ease(age-1)));return out;}
  if(age<3){const f=ease(age-2);chain(0,lerp(95,60,f),lerp(140,200,f));chain(3,lerp(95,130,f),lerp(140,200,f));return out;}
  if(age<4){const f=ease(age-3);chain(0,60,lerp(200,265,f));chain(3,130,lerp(200,265,f));return out;}
  if(age<5||!g.path){const f=ease(age-4);chain(0,60,lerp(265,325,f));chain(3,130,lerp(265,325,f));return out;}
  if(g.path!=='aer'){const f=ease((age-5)/1.2),fade=clamp(1-(age-6.4)/0.8,0,1);chain(0,lerp(60,180,f),lerp(325,385,f));chain(3,lerp(130,250,f),lerp(325,385,f));out.forEach(o=>o.a=fade);return out;}
  if(age<6.5){const f=ease((age-5)/1.5);chain(0,lerp(60,425,f),lerp(325,262,f));chain(3,lerp(130,455,f),lerp(325,288,f));return out;}
  if(age<7.5){const f=ease(age-6.5);chain(0,lerp(425,WHEEL.x-WHEEL.r,f),lerp(262,WHEEL.y-6,f));chain(3,lerp(455,WHEEL.x-WHEEL.r,f),lerp(288,WHEEL.y+16,f));return out;}
  const along=(i0,lag)=>{const f=clamp((age-7.5-lag)/3,0,1),a=Math.PI+f*Math.PI*2;for(let j=0;j<3;j++){const aj=a-j*0.18;out[i0+j]={x:WHEEL.x+Math.cos(aj)*WHEEL.r,y:WHEEL.y+Math.sin(aj)*WHEEL.r,a:1};}};
  along(0,0);along(3,0.35);return out;}
function drawBalloons(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis;
  ctx.fillStyle=PAL['card'];ctx.fillRect(0,0,800,450);
  ctx.fillStyle=PAL['cv-water'];rr(ctx,20,250,760,150,14);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;rr(ctx,20,250,760,150,14);ctx.stroke();
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,400,800,50);
  txt(ctx,'Yeast lab: '+sim.t.toFixed(1)+' min',16,28,{s:15*k,w:700});txt(ctx,'Water bath at '+p.temp+' °C · each flask has yeast + 5 g of sugar',16,48,{s:12.5*k,c:PAL['cv-soft']});
  ['glu','suc','lac','none'].forEach((key,i)=>{const f=s.y[key],cx=110+i*193,bot=390,top=230;
    // flask
    ctx.fillStyle='rgba(214,170,90,.55)';ctx.beginPath();ctx.moveTo(cx-20,top);ctx.lineTo(cx-20,top+60);ctx.lineTo(cx-62,bot);ctx.lineTo(cx+62,bot);ctx.lineTo(cx+20,top+60);ctx.lineTo(cx+20,top);ctx.closePath();
    ctx.save();ctx.clip();ctx.fillRect(cx-70,top+90,140,bot-top-90);ctx.restore();
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx-20,top);ctx.lineTo(cx-20,top+60);ctx.lineTo(cx-62,bot);ctx.lineTo(cx+62,bot);ctx.lineTo(cx+20,top+60);ctx.lineTo(cx+20,top);ctx.stroke();
    // bubbles at the model's CO2 rate
    v.bub[i]=v.bub[i]||[];if(Math.random()<f.rate*vdt*0.6)v.bub[i].push({x:cx+(Math.random()-.5)*80,y:bot-6});
    v.bub[i].forEach(b=>{b.y-=40*vdt;ctx.fillStyle=PAL['cv-bubble'];ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1;ctx.beginPath();ctx.arc(b.x,b.y,2.5,0,6.29);ctx.fill();ctx.stroke();});
    v.bub[i]=v.bub[i].filter(b=>b.y>top+95);
    // balloon
    const r=12+4.4*Math.cbrt(f.V);const by=top-r+6;
    ctx.fillStyle=['#d1495b','#30638e','#4f9a6a','#8e5572'][i];ctx.beginPath();ctx.ellipse(cx,by,r*0.9,r,0,0,6.29);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.ellipse(cx-r*0.35,by-r*0.35,r*0.18,r*0.28,-0.5,0,6.29);ctx.fill();
    txt(ctx,f.V.toFixed(0)+' mL',cx,by+5,{s:13*k,w:700,c:'#fff',a:'center'});
    txt(ctx,SUG[key].l,cx,bot+26,{s:13.5*k,w:700,a:'center'});});
}
BioLab.register(SIM);
})();
