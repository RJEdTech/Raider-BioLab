(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,RM,axes,legend,serColor,fmtNum}=BioLab.h;

/* Guiding questions for each Zoom view (Paul Stearman, Nov 20, 2026). Shown in the panel under the picture; answers stay in this browser and copy out for Canvas. */
const GQ={
  gly:{t:'Glycolysis',q:[['Where in the cell does glycolysis happen? Does it need oxygen?'],['The cell spends 2 ATP at the start. Why would it spend energy before it has made any?'],['Follow the six colored carbons. What are they part of at the end of glycolysis, and how many carbons are in each piece?'],['Count the ATP. How many are used, how many are made, and what is the net gain?'],['What else is made besides ATP, and where will it go next?','honors']]},
  krebs:{t:'Krebs cycle',q:[['Where does the Krebs cycle happen? What has to happen to each pyruvate before it can enter?'],['Watch the colored carbons. Where do the last four carbons of the glucose go?'],['Only 2 ATP per glucose are made here. So what is the main job of the Krebs cycle?'],['Why is it called a cycle? What is ready to be used again at the end of each turn?'],['Per glucose, how many NADH and FADH₂ come out of pyruvate oxidation and the Krebs cycle together?','honors']]},
  etc:{t:'Electron transport chain',q:[['What do NADH and FADH₂ deliver to the electron transport chain?'],['What is oxygen’s job at the end of the chain, and what does the oxygen become?'],['Turn Oxygen available off. What happens in the mitochondrion, and what happens to ATP per glucose? Why?'],['About how many of the 32 ATP come from this part? Which protein makes them?'],['The chain pumps H⁺ across the membrane. How does that lead to ATP?','honors']]}
};
const GQKEY='raider-biolab-glycolysis-guiding';
const gqLoad=()=>{try{return JSON.parse(localStorage.getItem(GQKEY)||'{}');}catch(e){return {};}};
const gqSave=o=>{try{localStorage.setItem(GQKEY,JSON.stringify(o));}catch(e){}};
const gqEsc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');

/* Glucose → glycolysis → pyruvate oxidation → Krebs → electron transport, or fermentation.
   Each glucose follows a fixed timeline; ledger events fire as it reaches each stage. */
const CC=['#d1495b','#e39b2d','#4f9a6a','#00798c','#30638e','#8e5572']; // one color per glucose carbon
const SPAWN=4;
const GLY=[[1.5,{atp:-2,tag:'−2 ATP',x:95,y:172}],[3.5,{atp:4,nadh:2,tag:'+4 ATP, +2 NADH',x:95,y:297}]];
const AER=[[6.0,{co2:2,nadh:2,tag:'+2 CO₂, +2 NADH',x:440,y:262,co2c:[2,5]}],[8.5,{co2:2,nadh:2,tag:'+2 CO₂, +2 NADH',x:690,y:120,co2c:[0,3]}],
  [9.5,{co2:2,nadh:2,atp:2,tag:'+2 CO₂, +2 NADH, +2 ATP',x:690,y:250,co2c:[1,4]}],[10.2,{fadh:2,nadh:2,tag:'+2 FADH₂, +2 NADH',x:495,y:298}],
  [12.0,{atp:28,ox:28,o2:6,tag:'+28 ATP',x:735,y:345}]];
const FER={yeast:[[6.0,{co2:2,nadhUsed:2,eth:2,tag:'+2 CO₂, 2 ethanol',x:205,y:372,co2c:[2,5]}]],muscle:[[6.0,{nadhUsed:2,lac:2,tag:'2 lactate',x:205,y:372}]]};
const END={aer:12.6,yeast:7.2,muscle:7.2};
const WHEEL={x:600,y:190,r:72};

function perGlucose(p){const aer=p.o2;return {atp:aer?32:2,nadh:aer?10:2,fadh:aer?2:0,ox:aer?28:0,co2:aer?6:(p.ferm==='muscle'?0:2)};}

const SIM={
  id:'glycolysis',hash:'glycolysis',apUnit:3,order:4,kind:'Process walkthrough',tab:'Glycolysis, Krebs cycle and fermentation',
  card:'Follow one sugar molecule as your cells break it down for energy, with oxygen and without it.',
  title:'How your cells get energy from sugar',
  ledeMore:'<p><b>Think of energy as money.</b> Your cells can’t spend sugar directly. They break it down and turn its energy into small “coins” called ATP, which every part of the cell can spend.</p><p>With oxygen, one sugar molecule turns into about 32 coins. Without oxygen, only 2. That is why you breathe harder when you run.</p>',
  next:['respiration','yeast'],
  lede:{bio:'Follow one sugar molecule (glucose) as your cells break it apart for energy. With oxygen, a cell gets about 16 times as much energy from it as without.',
        honors:'Track each carbon from glucose to CO₂, count the ATP, NADH and FADH₂ at every stage, and compare aerobic respiration with fermentation in yeast and muscle.',
        ap:'Account for every ATP: substrate-level phosphorylation in glycolysis and the Krebs cycle, oxidative phosphorylation from NADH and FADH₂, and why fermentation exists at all.'},
  scale:'Inside one cell: the cytoplasm (the cell’s fluid) on the left, one mitochondrion (the cell’s power plant) on the right. A real cell breaks down millions of sugar molecules at once.',
  timeScale:1,dtMax:0.02,prewarm:13,sampleDt:0.1,window:40,unit:'s',chChange:3,chReveal:10,
  controls:[
    {id:'zoom',label:'Zoom',type:'seg',def:'all',lvl:'bio',options:[{v:'all',l:'Whole cell'},{v:'gly',l:'Glycolysis'},{v:'krebs',l:'Krebs cycle'},{v:'etc',l:'Electron transport chain'}],noTrial:true,help:'Get a closer look at one stage. Each stage has its own guiding questions under the picture.'},
    {id:'o2',label:'Oxygen available',type:'toggle',def:true,lvl:'bio',help:'Without O₂ the electron transport chain stops.'},
    {id:'ferm',label:'Fermenting cell',type:'seg',def:'yeast',lvl:'honors',options:[{v:'yeast',l:'Yeast'},{v:'muscle',l:'Muscle'}],help:'What happens to pyruvate when there is no oxygen.'}
  ],
  init(){return {time:0,next:0,gl:[],atp:0,nadh:0,fadh:0,co2:0,o2:0,eth:0,lac:0,gluc:0,ox:0,pops:[]};},
  afterPrewarm(sim){const s=sim.st;['atp','nadh','fadh','co2','o2','eth','lac','gluc','ox'].forEach(k=>s[k]=0);s.pops=[];s.gl.forEach(g=>{g.fired=g.fired;});},
  step(sim,dt){const s=sim.st,p=sim.p;s.time+=dt;
    if(s.time>=s.next){s.gl.push({t0:s.next,path:null,fi:0,fp:0,gone:{}});s.next+=SPAWN;s.gluc++;}
    s.gl.forEach(g=>{const age=s.time-g.t0;
      while(g.fi<GLY.length&&age>=GLY[g.fi][0]){apply(s,GLY[g.fi][1]);g.fi++;}
      if(!g.path&&age>=5)g.path=p.o2?'aer':(p.ferm==='muscle'?'muscle':'yeast');
      if(g.path){const ev=g.path==='aer'?AER:FER[g.path];while(g.fp<ev.length&&age>=ev[g.fp][0]){const e=ev[g.fp][1];apply(s,e);(e.co2c||[]).forEach(c=>g.gone[c]=1);g.fp++;}}});
    s.gl=s.gl.filter(g=>!(g.path&&s.time-g.t0>END[g.path]));},
  metrics:[
    {id:'atpPer',label:'ATP per glucose',unit:'',lvl:'bio',min:0,max:34,d:0,get:s=>perGlucose(s.p).atp},
    {id:'atpTot',label:'ATP made so far',unit:'',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.atp},
    {id:'co2Tot',label:'CO₂ released',unit:'molecules',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.co2},
    {id:'gluc',label:'Glucose used',unit:'molecules',lvl:'honors',min:0,max:null,d:0,get:s=>s.st.gluc},
    {id:'nadhPer',label:'NADH made per glucose',unit:'',lvl:'honors',min:0,max:12,d:0,get:s=>perGlucose(s.p).nadh},
    {id:'fadhPer',label:'FADH₂ per glucose',unit:'',lvl:'ap',min:0,max:3,d:0,get:s=>perGlucose(s.p).fadh},
    {id:'oxPer',label:'ATP from the electron transport chain',unit:'per glucose',lvl:'ap',min:0,max:30,d:0,get:s=>perGlucose(s.p).ox}
  ],
  graphs:[{id:'atp',label:'ATP made so far',lines:['atpTot']},{id:'co2',label:'CO₂ released',lines:['co2Tot']}],
  defaultGraph:'atp',
  onLevel(sim){sim.infoDirty=true;},
  initVis(sim){sim.vis.tok=[];sim.vis.co2=[];sim.vis.tags=[];sim.vis.seen=new WeakMap();},
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis,hon=atLeast('honors'),ap=atLeast('ap');if(!v.tok)SIM.initVis(sim);
    // zoom: a camera rectangle (16:9) that eases toward the chosen part of the cell
    const ZR={all:[0,0,800],gly:p.o2?[-70,36,545]:[-50,112,535],krebs:[330,20,460],etc:[350,195,440]},zt=(sim.mode!=='guided'&&ZR[p.zoom])||ZR.all;
    const now=performance.now(),rdt=Math.min(.1,(now-(v.camT||now))/1000);v.camT=now;
    if(!v.cam)v.cam=zt.slice();for(let i=0;i<3;i++)v.cam[i]+=(zt[i]-v.cam[i])*Math.min(1,rdt*5);
    if(Math.abs(v.cam[2]-zt[2])<.5)v.cam=zt.slice();
    const zs=800/v.cam[2],k0=k;k=Math.max(1,k/zs);ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,800,450);ctx.save();ctx.scale(zs,zs);ctx.translate(-v.cam[0],-v.cam[1]);
    // background: cytoplasm and mitochondrion
    ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(-400,-400,1600,1250);
    ctx.fillStyle=PAL['cv-matrix'];ctx.strokeStyle=PAL['cv-head'];ctx.lineWidth=7;rr(ctx,352,50,438,388,90);ctx.fill();ctx.stroke();
    ctx.strokeStyle=PAL['cv-head'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(380,368);
    for(let x=380;x<=770;x+=30){ctx.lineTo(x+8,368);ctx.lineTo(x+8,330);ctx.arc(x+15,330,7,Math.PI,0);ctx.lineTo(x+22,368);}ctx.stroke();
    txt(ctx,'CYTOPLASM',14,58,{s:12*k,w:700,c:PAL['cv-soft']});txt(ctx,'MITOCHONDRION',402,82,{s:12*k,w:700,c:PAL['cv-soft']});
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
    if(hon&&k<1.3){txt(ctx,'citrate (6C)',W.x+W.r+12,W.y-40,{s:11.5*k,c:PAL['cv-soft']});txt(ctx,'oxaloacetate (4C)',W.x+10,W.y+W.r+18,{s:11.5*k,c:PAL['cv-soft'],a:'center'});}
    // electron transport band
    [[430,'#3f6fb0'],[480,'#2a8276'],[530,'#7a4fa6']].forEach(q=>{ctx.fillStyle=q[1];rr(ctx,q[0]-14,342,28,38,6);ctx.fill();});
    ctx.fillStyle='#b5122d';rr(ctx,722,338,26,44,6);ctx.fill();ctx.beginPath();ctx.arc(735,330,14,0,6.29);ctx.fill();
    txt(ctx,'Electron transport chain',480,402,{s:12*k,w:600,a:'center'});txt(ctx,'ATP synthase',k>1.1?788:735,402,{s:12*k,w:600,a:k>1.1?'right':'center'});
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
      evs.forEach(e=>{const key=e[0];if(age>=key&&age-key<vdt+1e-6&&vdt>0){const d=e[1],jx=(v.slot=((v.slot||0)+1)%3)*16;v.tags.push({x:d.x,y:d.y,s:d.tag,life:2.2});
        (d.co2c||[]).forEach(ci=>{const q=pos[ci]||{x:d.x,y:d.y};v.co2.push({x:q.x,y:q.y,c:CC[ci],life:3});});
        if(d.nadh>0)for(let i=0;i<d.nadh;i++)v.tok.push({x:d.x,y:d.y,tx:404+jx+i*12,ty:330,c:PAL['s5'],l:'',life:2});
        if(d.fadh>0)for(let i=0;i<d.fadh;i++)v.tok.push({x:d.x,y:d.y,tx:474+jx+i*12,ty:330,c:PAL['s6'],l:'',life:2});
        if(d.ox)for(let i=0;i<10;i++)v.tok.push({x:735,y:325,tx:690+(i%5)*18,ty:262+Math.floor(i/5)*18,c:PAL['cv-atp'],l:'',life:1.6});}});});
    // floating tokens, CO2, tags
    v.tok.forEach(o=>{o.life-=vdt;o.x+=(o.tx-o.x)*Math.min(1,vdt*2.2);o.y+=(o.ty-o.y)*Math.min(1,vdt*2.2);ctx.globalAlpha=clamp(o.life/1.6,0,1);ctx.fillStyle=o.c;ctx.beginPath();ctx.arc(o.x,o.y,5,0,6.29);ctx.fill();if(o.l)txt(ctx,o.l,o.x,o.y-10,{s:11*k,w:700,c:o.c,a:'center'});});
    v.co2.forEach(o=>{o.life-=vdt;o.y-=26*vdt;o.x+=18*vdt;ctx.globalAlpha=clamp(o.life/1.5,0,1);ctx.fillStyle=o.c;ctx.beginPath();ctx.arc(o.x,o.y,6,0,6.29);ctx.fill();ctx.fillStyle='#d8dde3';ctx.beginPath();ctx.arc(o.x-9,o.y,4.5,0,6.29);ctx.arc(o.x+9,o.y,4.5,0,6.29);ctx.fill();txt(ctx,'CO₂',o.x,o.y-12,{s:10.5*k,w:700,c:PAL['cv-soft'],a:'center'});});
    v.tags.forEach(o=>{o.life-=vdt;o.y-=8*vdt;ctx.globalAlpha=clamp(o.life,0,1);ctx.font='700 '+(11.5*k)+'px "Segoe UI",system-ui,Arial,sans-serif';const hw=ctx.measureText(o.s).width/2+11.5*k*.6;pill(ctx,o.s,clamp(o.x,hw+4,796-hw),o.y,PAL['card'],PAL['cv-ink'],11.5*k);});
    ctx.globalAlpha=1;if(!v.tags.some(o=>o.x===440&&o.life>0))pill(ctx,hon?'Pyruvate oxidation':'Pyruvate → acetyl',440,234,PAL['card'],PAL['cv-ink'],11.5*k);
    ctx.globalAlpha=1;v.tok=v.tok.filter(o=>o.life>0);v.co2=v.co2.filter(o=>o.life>0);v.tags=v.tags.filter(o=>o.life>0);
    if(v.tok.length>120)v.tok.splice(0,v.tok.length-120);if(v.tags.length>12)v.tags.splice(0,v.tags.length-12);
    ctx.restore();
    if(k0>1.15&&p.zoom==='all'&&sim.mode!=='guided'){ctx.font='700 '+(11.5*k0)+'px system-ui,Arial,sans-serif';pill(ctx,'Tip: use Zoom for a closer look',ctx.measureText('Tip: use Zoom for a closer look').width/2+11.5*k0*.6+8,430,PAL['card'],PAL['cv-ink'],11.5*k0);}
    // ledger strip
    ctx.fillStyle=PAL['card'];rr(ctx,8,6,784,30,8);ctx.fill();
    const pg=perGlucose(p);
    k=k0;txt(ctx,'Per glucose: '+pg.atp+' ATP · '+pg.nadh+' NADH'+(hon&&k<1.3?' · '+pg.fadh+' FADH₂':'')+' · '+pg.co2+' CO₂'+(p.o2?'':(p.ferm==='muscle'&&hon?' · 2 lactate':' · 2 ethanol')),18,26,{s:14*k,w:700});
    if(k<1.3)txt(ctx,'Total so far: '+s.atp+' ATP, '+s.co2+' CO₂',782,26,{s:12.5*k,c:PAL['cv-soft'],a:'right'});
  },
  infoPanel(sim){const z=sim.p.zoom,G=GQ[z],saved=gqLoad(),hon=atLeast('honors');
    if(!G)return '<h4 style="margin:0 0 6px">Guiding questions</h4><p style="margin:0 0 8px">Each stage has its own questions. Choose <b>Glycolysis</b>, <b>Krebs cycle</b> or <b>Electron transport chain</b> under Zoom to see them.</p><p style="margin:0"><button type="button" class="btn" data-gq-copy="all">Copy all my answers</button> <span class="gq-msg" style="color:var(--good);font-weight:600"></span></p>';
    const qs=G.q.filter(q=>!q[1]||hon);
    return '<h4 style="margin:0 0 6px">Guiding questions: '+G.t+'</h4><ol style="margin:0 0 8px;padding-left:20px">'+qs.map((q,i)=>'<li style="margin:0 0 8px"><label for="gq-'+z+i+'">'+q[0]+'</label><textarea id="gq-'+z+i+'" data-gq="'+z+':'+G.q.indexOf(q)+'" rows="2" style="display:block;width:100%;margin-top:4px;font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--fg)">'+gqEsc(saved[z+':'+G.q.indexOf(q)]||'')+'</textarea></li>').join('')+'</ol><p style="margin:0"><button type="button" class="btn primary" data-gq-copy="'+z+'">Copy these answers</button> <button type="button" class="btn" data-gq-copy="all">Copy all three stages</button> <span class="gq-msg" style="color:var(--good);font-weight:600"></span></p>';},
  bindInfo(sim,el){el.querySelectorAll('textarea[data-gq]').forEach(t=>t.addEventListener('input',()=>{const o=gqLoad();o[t.dataset.gq]=t.value;gqSave(o);}));
    el.querySelectorAll('[data-gq-copy]').forEach(b=>b.addEventListener('click',()=>{const o=gqLoad(),which=b.dataset.gqCopy,hon=atLeast('honors'),keys=which==='all'?['gly','krebs','etc']:[which];
      let out='Raider BioLab: How your cells get energy from sugar\nGuiding questions\n';keys.forEach(z=>{out+='\n'+GQ[z].t+'\n';GQ[z].q.forEach((q,i)=>{if(q[1]&&!hon)return;out+=(i+1)+'. '+q[0]+'\n   '+((o[z+':'+i]||'').trim()||'(no answer yet)')+'\n';});});
      const done=()=>{const m=el.querySelector('.gq-msg');if(m)m.textContent='Copied. Paste it into Canvas.';};
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(out).then(done,()=>{});else{const t=document.createElement('textarea');t.value=out;document.body.appendChild(t);t.select();try{document.execCommand('copy');done();}catch(e){}t.remove();}}));},
  narrate(sim){const s=sim.st,p=sim.p,hon=atLeast('honors');
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
    {title:'Glucose arrives',text:'A glucose molecule has six carbon atoms. Each colored ball is one carbon, so you can follow where every one ends up.',focus:[30,42,320,80],speed:0.25,setup(sim){BioLab.setValues(sim,{o2:true});}},
    {title:'Spend 2 ATP to start',text:'Glycolysis begins by spending 2 ATP. The phosphate groups (orange P) make glucose unstable enough to split.',focus:[30,105,320,70],speed:0.25},
    {title:'Split and payoff',text:{bio:'The sugar splits in half, and each half is broken down further, releasing energy: 4 ATP in all, so a net gain of 2.',honors:'The 6-carbon sugar splits into two 3-carbon sugars. Oxidizing them makes 4 ATP and 2 NADH, a net gain of 2 ATP. The end products are 2 pyruvate.'},focus:[30,170,320,175],speed:0.25},
    {title:'Into the mitochondrion',text:'With oxygen around, pyruvate enters the mitochondrion. One carbon from each pyruvate is released as CO₂, and NADH is made.',focus:[360,215,170,110],speed:0.25},
    {title:'The Krebs cycle',text:'The remaining carbons go around the Krebs cycle and leave as CO₂. Every carbon from the glucose has now been breathed out, and the energy is stored in NADH, FADH₂ and 2 ATP.',focus:[505,90,195,205],speed:0.25},
    {title:'The electron transport chain makes most of the ATP',text:'NADH and FADH₂ deliver electrons to the electron transport chain. Oxygen catches them at the end, and ATP synthase makes about 28 ATP. See the Cellular respiration simulation for this step up close.',focus:[400,300,370,115],speed:0.25},
    {lvl:'honors',title:'No oxygen: fermentation',text:'Take away oxygen and the mitochondrion stalls. Pyruvate is turned into ethanol and CO₂ (yeast) or lactate (muscle) instead. That makes no ATP, but it recycles NAD⁺ so glycolysis can keep making its 2 ATP.',focus:[30,240,330,190],speed:0.25,setup(sim){BioLab.setValues(sim,{o2:false});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{o2:true});},
  lab:{bio:'<p><b>Question:</b> How much ATP does a cell get from one glucose, with and without oxygen?</p><ol><li>With oxygen on, watch one glucose all the way through and record a trial.</li><li>Turn oxygen off and record another trial.</li><li>Compare ATP per glucose and CO₂ released.</li></ol><p>Explain why you breathe harder during a sprint.</p>',
       honors:'<p><b>Question:</b> What does each stage give the cell, and what changes without oxygen?</p><ol><li>Use Zoom to look at Glycolysis, the Krebs cycle and the Electron transport chain in turn. Answer the guiding questions for each.</li><li>Record a trial with oxygen. Turn oxygen off and record another for yeast, then for muscle.</li><li>Compare ATP, NADH and CO₂ per glucose across the three trials.</li></ol><p>Explain why fermentation makes no ATP of its own but still keeps the cell alive. Then run the <a href="#yeast">Yeast balloon lab</a> to see fermentation at work.</p>',
       ap:'<p><b>Question:</b> Where does each ATP come from?</p><ol><li>Record per-glucose ATP, NADH, FADH₂ and electron-transport ATP with oxygen, then without.</li><li>Calculate substrate-level vs. oxidative phosphorylation.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why fermentation evolved even though it makes no ATP itself.</p>'},
  terms:[{t:'Glycolysis',d:'Splitting glucose into 2 pyruvate in the cytoplasm. Net 2 ATP and 2 NADH. No oxygen needed.'},{t:'Krebs cycle',d:'A cycle in the mitochondrial matrix that releases CO₂ and loads energy onto NADH and FADH₂.'},{t:'Fermentation',d:'Turning pyruvate into ethanol and CO₂ or lactate when oxygen is missing.'},
    {lvl:'honors',t:'NADH / FADH₂',d:'Electron carriers that take energy to the electron transport chain.'},{lvl:'honors',t:'Pyruvate oxidation',d:'Pyruvate loses a CO₂ and becomes acetyl-CoA, which enters the Krebs cycle.'},{lvl:'honors',t:'NAD⁺ regeneration',d:'Fermentation turns NADH back into NAD⁺, which glycolysis needs to keep running.'},
    {lvl:'ap',t:'Substrate-level phosphorylation',d:'ATP made directly by an enzyme in glycolysis or the Krebs cycle (4 per glucose).'},{lvl:'ap',t:'Oxidative phosphorylation',d:'ATP made by ATP synthase using the H⁺ gradient from electron transport (about 28 per glucose).'}],
  about:'<p>Each glucose follows a fixed timeline, and the ledger adds up the textbook yields: glycolysis −2 + 4 ATP and 2 NADH; pyruvate oxidation 2 CO₂ and 2 NADH; Krebs cycle 4 CO₂, 6 NADH, 2 FADH₂ and 2 ATP; oxidative phosphorylation 2.5 ATP per NADH and 1.5 per FADH₂ (about 28), for about 32 in total. Many textbooks give 30–38. The real number depends on how NADH from the cytoplasm enters the mitochondrion.</p><p>Simplifications: the carbons that leave in the Krebs cycle are drawn as the acetyl carbons, though in a real first turn they come from oxaloacetate. Glucose arrives at a steady rate, while real cells speed up glycolysis when oxygen is short. The yeast lab treats each simulated second as one minute. Its CO₂ rate depends on temperature, the sugar (baker’s yeast lack lactase, and sucrose must be split first) and how much sugar is left.</p>',
  challenges:[
    {lvl:'bio',q:'The cell runs out of oxygen. How much ATP does each glucose make now?',choices:['About 32','Only 2','None at all'],correct:1,change:{o2:false},changeText:'Oxygen removed',watch:'atp',
     explain:{bio:'Without oxygen the mitochondrion can’t use NADH, so only glycolysis works. Each glucose gives just 2 ATP instead of about 32. That is why your muscles tire fast when they run short of oxygen.'}},
    {lvl:'bio',instant:true,q:'Where does the carbon in the CO₂ you breathe out come from?',choices:['From the oxygen you breathed in, which picks up carbon','From the glucose and other food you broke down','From water, split apart inside your cells'],correct:1,
     explain:'Watch the colored carbon balls: they start in glucose and leave as CO₂ during pyruvate oxidation and the Krebs cycle. The oxygen you breathe in ends up in water.'},
    {lvl:'ap',instant:true,q:'Fermentation makes no ATP of its own. Why do cells do it?',choices:['It makes extra glucose for the next round','It turns NADH back into NAD⁺ for glycolysis','It produces oxygen when oxygen runs out'],correct:1,
     explain:'Glycolysis needs NAD⁺ to accept electrons. Without oxygen, NADH piles up and glycolysis would stop. Fermentation dumps those electrons onto pyruvate (or acetaldehyde), regenerating NAD⁺.'},
    {lvl:'ap',instant:true,q:'With oxygen, roughly how much of the ATP from one glucose comes from oxidative phosphorylation?',choices:['About 4 of 32','About 28 of 32','All 32 of 32'],correct:1,
     explain:'Glycolysis and the Krebs cycle make 4 ATP directly (substrate-level). The other ~28 come from ATP synthase powered by the electron transport chain: 10 NADH × 2.5 + 2 FADH₂ × 1.5 = 28.'}
  ]
};
function apply(s,e){if(e.atp)s.atp+=e.atp;if(e.nadh>0)s.nadh+=e.nadh;if(e.fadh)s.fadh+=e.fadh;if(e.co2)s.co2+=e.co2;if(e.o2)s.o2+=e.o2;if(e.eth)s.eth+=e.eth;if(e.lac)s.lac+=e.lac;if(e.ox)s.ox+=e.ox;}
function ease(x){x=clamp(x,0,1);return x*x*(3-2*x);}
function carbonPos(g,age){const out=[];const ring=(cx,cy)=>{for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/2;out[i]={x:cx+Math.cos(a)*15,y:cy+Math.sin(a)*15,a:1};}};
  const chain=(i0,cx,cy)=>{for(let j=0;j<3;j++)out[i0+j]={x:cx+(j-1)*13,y:cy,a:1};};
  if(age<1){ring(95,lerp(46,80,ease(age)));return out;}
  if(age<2){ring(95,lerp(80,140,ease(age-1)));return out;}
  if(age<3){const f=ease(age-2);chain(0,lerp(95,60,f),lerp(140,200,f));chain(3,lerp(95,130,f),lerp(140,200,f));return out;}
  if(age<4){const f=ease(age-3);chain(0,60,lerp(200,265,f));chain(3,130,lerp(200,265,f));return out;}
  if(age<5||!g.path){const f=ease(age-4);chain(0,60,lerp(265,325,f));chain(3,130,lerp(265,325,f));return out;}
  if(g.path!=='aer'){const f=ease((age-5)/1.2),fade=clamp(1-(age-6.4)/0.8,0,1);chain(0,lerp(60,180,f),lerp(325,385,f));chain(3,lerp(130,250,f),lerp(325,385,f));out.forEach(o=>o.a=fade);return out;}
  if(age<6.5){const f=ease((age-5)/1.5);chain(0,lerp(60,425,f),lerp(325,262,f));chain(3,lerp(130,455,f),lerp(325,288,f));return out;}
  if(age<7.5){const f=ease(age-6.5);chain(0,lerp(425,WHEEL.x-WHEEL.r,f),lerp(262,WHEEL.y-6,f));chain(3,lerp(455,WHEEL.x-WHEEL.r,f),lerp(288,WHEEL.y+16,f));return out;}
  const along=(i0,lag)=>{const f=clamp((age-7.5-lag)/3,0,1),a=Math.PI+f*Math.PI*2;for(let j=0;j<3;j++){const aj=a-j*0.18;out[i0+j]={x:WHEEL.x+Math.cos(aj)*WHEEL.r,y:WHEEL.y+Math.sin(aj)*WHEEL.r,a:1};}};
  along(0,0);along(3,0.35);return out;}
BioLab.register(SIM);
})();
