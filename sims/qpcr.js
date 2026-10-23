(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;

/* Real-time (quantitative) PCR with SYBR Green. Time is measured in cycles.
   Each well: N(c+1) = N(c)·(1 + E·(1 − N/NMAX)), NMAX = 10¹² (plateau when primers and nucleotides run out).
   Fluorescence F = 0.04 (background) + N/NMAX + tiny noise. Ct = the fractional cycle where F first crosses the threshold.
   Standard curve: Ct vs log₁₀(starting copies) is a line with slope −1/log₁₀(1+E) (−3.32 at 100%). Efficiency = 10^(−1/slope) − 1.
   Relative expression (ΔΔCt): ΔCt = Ct(target) − Ct(reference); ΔΔCt = ΔCt(treated) − ΔCt(control); fold = 2^(−ΔΔCt). */
const NMAX=1e12,BG=0.04,CYC=40,UNK=3.2e4;
const SUP={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻'};
const pow10=e=>'10'+String(e).split('').map(c=>SUP[c]).join('');
function sci(n){if(!Number.isFinite(n))return '—';const e=Math.floor(Math.log10(n)),m=n/Math.pow(10,e);return m.toFixed(1)+' × '+pow10(e);}
function samples(sim){const p=sim.p;
  if(p.mode==='expr'){const f=+p.fold;return [
    {id:'tc',label:'Control · target gene',short:'Control target',N0:1e5,col:'s1'},{id:'rc',label:'Control · reference gene',short:'Control reference',N0:1e6,col:'s2'},
    {id:'tt',label:'Treated · target gene',short:'Treated target',N0:1e5*f,col:'s4'},{id:'rt',label:'Treated · reference gene',short:'Treated reference',N0:1e6,col:'s5'}];}
  const list=[7,6,5,4,3,2].map((e,i)=>({id:'s'+e,label:pow10(e)+' copies',short:pow10(e),N0:Math.pow(10,e),col:['s1','s2','s3','s4','s5','s6'][i],std:true,e}));
  if(atLeast('honors'))list.push({id:'u',label:'Unknown sample',short:'Unknown',N0:UNK,col:'cv-ink',unk:true});
  return list;}
function ctOf(F,thr){for(let j=1;j<F.length;j++){if(F[j]>=thr&&F[j-1]<thr)return j-1+(thr-F[j-1])/(F[j]-F[j-1]);}return NaN;}
function fit(sim){const s=sim.st,pts=[];s.list.forEach((x,i)=>{if(x.std){const c=ctOf(s.F[i],sim.p.thr);if(Number.isFinite(c))pts.push([x.e,c]);}});
  if(pts.length<2)return null;const n=pts.length,mx=pts.reduce((a,p)=>a+p[0],0)/n,my=pts.reduce((a,p)=>a+p[1],0)/n;
  let sxx=0,sxy=0,syy=0;pts.forEach(p=>{sxx+=(p[0]-mx)**2;sxy+=(p[0]-mx)*(p[1]-my);syy+=(p[1]-my)**2;});const m=sxy/sxx,b=my-m*mx;return {m,b,r2:syy>0?sxy*sxy/(sxx*syy):1,n,pts};}
function ctById(sim,id){const s=sim.st,i=s.list.findIndex(x=>x.id===id);return i<0?NaN:ctOf(s.F[i],sim.p.thr);}
function expr(sim){if(sim.p.mode!=='expr')return null;const tc=ctById(sim,'tc'),rc=ctById(sim,'rc'),tt=ctById(sim,'tt'),rt=ctById(sim,'rt');const dc=tc-rc,dt=tt-rt,dd=dt-dc;return {tc,rc,tt,rt,dc,dt,dd,fold:Math.pow(2,-dd)};}
function hideTiles(sim){const ui=sim.ui;if(!ui.tiles)return;sim.def.metrics.forEach(m=>{const t=ui.tiles[m.id];if(!t)return;const el=t.num.closest('.tile');el.hidden=!atLeast(m.lvl)||(m.mode&&m.mode!==sim.p.mode);});}
function fNow(F,c){const j=Math.floor(c);if(j>=F.length-1)return F[F.length-1];return lerp(F[j],F[j+1]===undefined?F[j]:F[j+1],c-j);}

const QPCR={
  id:'qpcr',hash:'qpcr',apUnit:11,order:2,tab:'qPCR and gene expression',kind:'Go further',prereq:['pcr'],
  card:'Watch DNA glow as it copies, read Ct values, build a standard curve and measure gene expression.',
  title:'Real-time PCR (qPCR): measuring DNA as it copies',
  lede:{bio:'A dye glows brighter as PCR makes more DNA. Samples that start with more DNA glow sooner. That is how labs measure how much DNA, or virus, is in a sample.',
        honors:'Read Ct values, see why each 10-fold dilution shifts the curve by about 3.3 cycles, and compare gene expression between treated and control cells.',
        ap:'Build a standard curve, calculate efficiency from its slope, estimate an unknown, and work through the ΔΔCt method for relative expression.'},
  scale:'Each well holds 20 µL. Fluorescence becomes detectable at roughly 10¹⁰–10¹¹ copies, and the 40-cycle run takes about an hour on a real instrument.',
  timeScale:1.5,dtMax:0.02,prewarm:0,sampleDt:0.1,window:40,unit:'cycles',timeLabel:'Cycle',clock:s=>'Cycle '+Math.floor(s.t>=0?s.st.c:0)+' of 40',chChange:20,chReveal:40.5,
  controls:[
    {id:'mode',label:'Experiment',type:'seg',def:'std',lvl:'honors',options:[{v:'std',l:'Standard curve'},{v:'expr',l:'Gene expression'}],onChange(sim){BioLab.reset(sim);hideTiles(sim);}},
    {id:'thr',label:'Threshold line',type:'range',min:0.05,max:0.5,step:0.01,def:0.1,unit:'',lvl:'bio',help:'Fluorescence level used to read the Ct'},
    {id:'fold',label:'True change in target mRNA (treated)',type:'select',def:'4',lvl:'honors',options:[{v:'0.25',l:'¼ as much'},{v:'0.5',l:'½ as much'},{v:'1',l:'No change'},{v:'2',l:'2× more'},{v:'4',l:'4× more'},{v:'8',l:'8× more'}],help:'Used in the gene-expression experiment',onChange(sim){BioLab.reset(sim);}},
    {id:'eff',label:'Amplification efficiency',type:'range',min:70,max:100,step:5,def:100,unit:'%',lvl:'ap',onChange(sim){BioLab.reset(sim);}}
  ],
  init(sim){const list=samples(sim),r=rng(17);return {c:0,ci:0,list,N:list.map(x=>x.N0),F:list.map(x=>[BG+x.N0/NMAX+(r()-.5)*0.004]),noise:list.map(()=>{const a=[];for(let j=0;j<=CYC;j++)a.push((r()-.5)*0.004);return a;})};},
  step(sim,dt){const s=sim.st,E=sim.p.eff/100;s.c=Math.min(CYC,s.c+dt);
    while(s.ci<Math.floor(s.c)){s.ci++;s.list.forEach((x,i)=>{s.N[i]=s.N[i]*(1+E*(1-s.N[i]/NMAX));s.F[i].push(BG+s.N[i]/NMAX+s.noise[i][s.ci]);});}},
  onLevel(sim){if(sim.st){const want=samples(sim).length;if(want!==sim.st.list.length)BioLab.reset(sim);}hideTiles(sim);},
  metrics:[
    {id:'cyc',label:'Cycle',unit:'of 40',lvl:'bio',min:0,max:40,d:0,get:s=>Math.floor(s.st.c)},
    {id:'cthi',label:'Ct of 10⁷ standard',unit:'cycles',lvl:'bio',mode:'std',min:0,max:40,d:1,get:s=>ctById(s,'s7')},
    {id:'ct6',label:'Ct of 10⁶ standard',unit:'cycles',lvl:'bio',mode:'std',min:0,max:40,d:1,get:s=>ctById(s,'s6')},
    {id:'ctlo',label:'Ct of 10² standard',unit:'cycles',lvl:'bio',mode:'std',min:0,max:40,d:1,get:s=>ctById(s,'s2')},
    {id:'spacing',label:'Cycles between 10× standards',unit:'cycles',lvl:'honors',mode:'std',min:0,max:5,d:2,get:s=>{const f=fit(s);return f?-f.m:NaN;}},
    {id:'ctu',label:'Ct of unknown',unit:'cycles',lvl:'honors',mode:'std',min:0,max:40,d:1,get:s=>ctById(s,'u')},
    {id:'slope',label:'Standard-curve slope',unit:'cycles per 10×',lvl:'ap',mode:'std',min:-5,max:0,d:2,get:s=>{const f=fit(s);return f?f.m:NaN;}},
    {id:'effc',label:'Efficiency from slope',unit:'%',lvl:'ap',mode:'std',min:0,max:110,d:0,get:s=>{const f=fit(s);return f?100*(Math.pow(10,-1/f.m)-1):NaN;}},
    {id:'unk',label:'Unknown, estimated',unit:'',lvl:'ap',mode:'std',text:true,get:s=>{const f=fit(s),c=ctById(s,'u');return f&&Number.isFinite(c)&&f.n>=3?'≈ '+sci(Math.pow(10,(c-f.b)/f.m))+' copies':'—';}},
    {id:'dctc',label:'ΔCt control (target − ref.)',unit:'',lvl:'honors',mode:'expr',min:0,max:10,d:2,get:s=>{const e=expr(s);return e?e.dc:NaN;}},
    {id:'dctt',label:'ΔCt treated (target − ref.)',unit:'',lvl:'honors',mode:'expr',min:0,max:10,d:2,get:s=>{const e=expr(s);return e?e.dt:NaN;}},
    {id:'ddct',label:'ΔΔCt (treated − control)',unit:'',lvl:'honors',mode:'expr',min:-4,max:4,d:2,get:s=>{const e=expr(s);return e?e.dd:NaN;}},
    {id:'fc',label:'Fold change, 2^(−ΔΔCt)',unit:'×',lvl:'honors',mode:'expr',min:0,max:10,d:2,get:s=>{const e=expr(s);return e?e.fold:NaN;}}
  ],
  graphs:[{id:'curves',label:'Amplification curves',custom:true},{id:'std',label:'Standard curve',custom:true,lvl:'honors'}],defaultGraph:'curves',
  plot(sim,ctx,box,id){const s=sim.st,thr=sim.p.thr;
    if(id==='std'){if(sim.p.mode!=='std'){txt(ctx,'Switch to the Standard curve experiment to see this graph.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
      const f=fit(sim),ax=axes(ctx,box,{xmin:1,xmax:8,ymin:0,ymax:40,xl:'log₁₀ starting copies',yl:'Ct (cycles)'});
      if(f){ctx.strokeStyle=PAL['muted'];ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(1),ax.Y(f.m*1+f.b));ctx.lineTo(ax.X(8),ax.Y(f.m*8+f.b));ctx.stroke();ctx.setLineDash([]);
        txt(ctx,'slope '+f.m.toFixed(2)+'   R² '+f.r2.toFixed(3),box.L+box.W-6,box.T+16,{s:13,c:PAL['muted'],a:'right'});}
      s.list.forEach((x,i)=>{const c=ctOf(s.F[i],thr);if(!Number.isFinite(c))return;const lx=x.unk?(f?(c-f.b)/f.m:null):x.e;if(lx===null)return;
        ctx.fillStyle=PAL[x.col];ctx.beginPath();x.unk?(ctx.rect(ax.X(lx)-6,ax.Y(c)-6,12,12)):ctx.arc(ax.X(lx),ax.Y(c),6,0,6.29);ctx.fill();if(x.unk)txt(ctx,'unknown',ax.X(lx)+10,ax.Y(c)+4,{s:12,c:PAL['fg']});});
      if(!f)txt(ctx,'Standards appear here as they cross the threshold.',box.L+box.W/2,box.T+box.H/2,{s:14,c:PAL['muted'],a:'center'});return;}
    const ax=axes(ctx,box,{xmin:0,xmax:CYC,ymin:0,ymax:1.1,xl:'Cycle',yl:'Fluorescence (relative)',yd:1});
    ctx.strokeStyle=PAL['s1'];ctx.setLineDash([6,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(box.L,ax.Y(thr));ctx.lineTo(box.L+box.W,ax.Y(thr));ctx.stroke();ctx.setLineDash([]);
    txt(ctx,'threshold',box.L+box.W-4,ax.Y(thr)-5,{s:12,c:PAL['s1'],a:'right'});
    s.list.forEach((x,i)=>{const F=s.F[i];ctx.strokeStyle=PAL[x.col];ctx.lineWidth=2.2;ctx.beginPath();F.forEach((v,j)=>{j?ctx.lineTo(ax.X(j),ax.Y(v)):ctx.moveTo(ax.X(j),ax.Y(v));});if(s.c>s.ci&&s.ci<CYC){ctx.lineTo(ax.X(s.c),ax.Y(fNow(F,s.c)));}ctx.stroke();
      const c=ctOf(F,thr);if(Number.isFinite(c)){ctx.fillStyle=PAL[x.col];ctx.beginPath();ctx.arc(ax.X(c),ax.Y(thr),4,0,6.29);ctx.fill();}});
    if(sim.p.mode==='expr')legend(ctx,box.L+10,box.T+10,s.list.map(x=>({label:x.short,color:PAL[x.col]})));
    else txt(ctx,'Colors match the wells: 10⁷ (left) to 10² copies',box.L+10,box.T+14,{s:12,c:PAL['muted']});},
  narrate(sim){const s=sim.st,p=sim.p,hon=atLeast('honors');
    if(p.mode==='expr'){const e=expr(sim);if(!Number.isFinite(e.dd))return 'Cycle '+Math.floor(s.c)+'. The reference gene (made at a steady level in every cell) and the target gene are measured in both control and treated cells.';
      return 'Target gene: ΔCt is <b>'+e.dc.toFixed(2)+'</b> in control cells and <b>'+e.dt.toFixed(2)+'</b> in treated cells, so ΔΔCt = <b>'+e.dd.toFixed(2)+'</b> and the treated cells have <b>'+e.fold.toFixed(2)+'×</b> as much target mRNA.';}
    const c7=ctById(sim,'s7'),c6=ctById(sim,'s6');
    if(!Number.isFinite(c7))return 'Cycle '+Math.floor(s.c)+'. Copies are doubling in every well, but there is still too little DNA for the dye’s glow to rise above the background.';
    if(s.c<CYC)return 'The 10⁷ well crossed the threshold at cycle <b>'+c7.toFixed(1)+'</b>.'+(Number.isFinite(c6)?' The 10⁶ well, with 10× less DNA, needed about <b>'+(c6-c7).toFixed(1)+'</b> more cycles to catch up.':' Wells with less DNA need more cycles to catch up.');
    const f=fit(sim);return 'Run finished. Each 10-fold dilution crosses about <b>'+(f?(-f.m).toFixed(2):'3.3')+' cycles</b> later, because 2<sup>3.32</sup> ≈ 10.'+(hon?' The unknown’s Ct places it between the standards.':'');},
  initVis(sim){},
  thumbSetup(sim){for(let i=0;i<340;i++)sim.def.step(sim,0.1);},thumbFrames:1,
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,thr=p.thr,hon=atLeast('honors'),n=s.list.length;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // instrument + plate
    ctx.fillStyle='#3d434c';rr(ctx,16,24,320,236,16);ctx.fill();ctx.fillStyle='#262a30';rr(ctx,30,38,292,170,10);ctx.fill();
    const cols=Math.min(4,n),rows=Math.ceil(n/cols);
    s.list.forEach((x,i)=>{const cx=70+(i%cols)*72,cy=78+Math.floor(i/cols)*80,f=fNow(s.F[i],s.c),g=clamp((f-BG)/0.9,0,1);
      ctx.fillStyle='#111';ctx.beginPath();ctx.arc(cx,cy,24,0,6.29);ctx.fill();
      const grd=ctx.createRadialGradient(cx,cy,2,cx,cy,30);grd.addColorStop(0,'rgba(120,255,140,'+(0.08+0.92*g)+')');grd.addColorStop(1,'rgba(120,255,140,0)');ctx.fillStyle=grd;ctx.beginPath();ctx.arc(cx,cy,30,0,6.29);ctx.fill();
      ctx.strokeStyle=PAL[x.col];ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,24,0,6.29);ctx.stroke();
      const parts=p.mode==='expr'?x.short.split(' '):[x.short];parts.forEach((w,j)=>txt(ctx,w,cx,cy+38+j*13,{s:11*k,w:600,c:'#e6e9ee',a:'center'}));});
    txt(ctx,'Cycle '+Math.floor(s.c)+' of 40',36,232,{s:14*k,w:700,c:'#9fe3a1'});txt(ctx,'qPCR instrument',176,250,{s:12*k,c:'#cfd6dd',a:'center'});
    // live plot
    const PX=362,PY=40,PW=420,PH=210;txt(ctx,'Fluorescence as copies build up',PX,30,{s:13*k,w:700});
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(PX,PY,PW,PH);
    const X=c=>PX+PW*c/CYC,Y=f=>PY+PH-PH*f/1.1;
    for(let c=0;c<=40;c+=10){txt(ctx,String(c),X(c),PY+PH+15,{s:11*k,c:PAL['cv-soft'],a:'center'});}
    ctx.strokeStyle=PAL['s1'];ctx.setLineDash([6,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(PX,Y(thr));ctx.lineTo(PX+PW,Y(thr));ctx.stroke();ctx.setLineDash([]);
    txt(ctx,'threshold',PX+PW-4,Y(thr)-5,{s:11.5*k,c:PAL['s1'],a:'right',w:600});
    s.list.forEach((x,i)=>{const F=s.F[i];ctx.strokeStyle=PAL[x.col];ctx.lineWidth=2.4;ctx.beginPath();F.forEach((v,j)=>{j?ctx.lineTo(X(j),Y(v)):ctx.moveTo(X(j),Y(v));});if(s.c>s.ci&&s.ci<CYC)ctx.lineTo(X(s.c),Y(fNow(F,s.c)));ctx.stroke();
      const c=ctOf(F,thr);if(Number.isFinite(c)){ctx.fillStyle=PAL[x.col];ctx.beginPath();ctx.arc(X(c),Y(thr),4.5,0,6.29);ctx.fill();if(i<7&&(x.std&&x.e%2===1||x.unk)){txt(ctx,'Ct '+c.toFixed(1),X(c),Y(thr)+(i%2?18:-10),{s:10.5*k,w:700,c:PAL[x.col],a:'center'});}}});
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X(s.c),PY);ctx.lineTo(X(s.c),PY+PH);ctx.stroke();
    txt(ctx,'cycle',PX+PW/2,PY+PH+30,{s:11*k,c:PAL['cv-soft'],a:'center'});
    // bottom-left: how the signal works or the ΔΔCt worksheet
    if(p.mode==='expr'){const e=expr(sim),f=v=>Number.isFinite(v)?v.toFixed(2):'…';txt(ctx,'ΔΔCt worksheet',22,296,{s:13*k,w:700});
      const lines=[['Control ΔCt',f(e.tc)+' − '+f(e.rc)+' = '+f(e.dc)],['Treated ΔCt',f(e.tt)+' − '+f(e.rt)+' = '+f(e.dt)],['ΔΔCt',f(e.dt)+' − '+f(e.dc)+' = '+f(e.dd)],['Fold change','2^(−ΔΔCt) = '+(Number.isFinite(e.fold)?e.fold.toFixed(2)+'×':'…')]];
      lines.forEach((l,i)=>{txt(ctx,l[0],22,324+i*26,{s:12.5*k,w:700,c:PAL['cv-ink']});txt(ctx,l[1],130,324+i*26,{s:12.5*k,c:PAL['cv-ink']});});
      txt(ctx,'Each Ct is read where that well’s curve crosses the threshold.',22,436,{s:11.5*k,c:PAL['cv-soft']});}
    else{txt(ctx,'How the glow works',22,296,{s:13*k,w:700});
      const g=clamp((fNow(s.F[0],s.c)-BG)/0.9,0,1);
      for(let m=0;m<3;m++){const y=326+m*34,x0=30,x1=300;ctx.strokeStyle=PAL['s2'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.moveTo(x0,y+12);ctx.lineTo(x1,y+12);ctx.stroke();
        for(let d=0;d<9;d++){const dx=x0+16+d*31;ctx.fillStyle='rgba(80,230,110,'+(0.25+0.75*g)+')';ctx.beginPath();ctx.arc(dx,y+6,4.5,0,6.29);ctx.fill();}}
      txt(ctx,'SYBR Green dye glows only when it sits between the two strands of double-stranded DNA. More copies, more glow.',22,436,{s:11.5*k,c:PAL['cv-soft']});}
    // bottom-right key ideas
    const ex=p.mode==='expr';txt(ctx,ex?'How ΔΔCt works':hon?'Reading a Ct':'What to notice',400,296,{s:13*k,w:700});
    const notes=ex?['ΔCt = Ct(target) − Ct(reference) in each sample.','The reference gene corrects for loading differences.','ΔΔCt = ΔCt(treated) − ΔCt(control).','Negative ΔΔCt means more target in treated cells.']:hon?['Ct = the cycle where a curve crosses the threshold.','Lower Ct means more starting DNA.','10× more DNA → about 3.3 cycles earlier (2^3.32 ≈ 10).','2× more DNA → about 1 cycle earlier.']:['Every curve is S-shaped: flat, steep rise, then level.','Wells with more DNA rise sooner.','Ct is the cycle where a curve crosses the threshold line.'];
    notes.forEach((l,i)=>txt(ctx,'• '+l,400,324+i*24,{s:12.5*k,c:PAL['cv-ink']}));},
  tour:[
    {title:'PCR you can watch',text:'This is ordinary PCR, with one addition: a dye that glows when it binds DNA. A camera in the instrument measures every well’s glow at the end of each cycle.',focus:[12,20,328,246],speed:2},
    {title:'Why it glows',text:'SYBR Green barely glows on its own, but it glows strongly when it slips between the two strands of double-stranded DNA. As PCR doubles the DNA, the glow doubles too.',focus:[12,276,330,170],speed:2},
    {title:'Curves rise in order',text:'At first there is too little DNA to see. Then each curve shoots up and finally levels off as the reaction runs out of primers and nucleotides. Wells that started with more DNA rise first.',focus:[352,20,440,250],speed:3},
    {title:'The threshold and Ct',text:'The dashed line is the threshold. The cycle where a curve crosses it is the <b>Ct</b>, or threshold cycle. A low Ct means a lot of starting DNA, and a high Ct means very little.',focus:[352,20,440,250],speed:3},
    {lvl:'honors',title:'10× is about 3.3 cycles',text:'Each standard has 10× less DNA than the one before. It takes log₂10 ≈ 3.32 extra doublings to catch up, so the curves are spaced about 3.3 cycles apart. Check the standard-curve graph below.',focus:[352,20,440,250],speed:4},
    {lvl:'honors',title:'Measuring gene expression',text:'To compare a gene in treated and control cells, measure it alongside a reference gene that stays constant. The ΔΔCt worksheet turns four Ct values into a fold change.',focus:[12,276,380,170],speed:4,setup(sim){BioLab.setValues(sim,{mode:'expr'});}},
    {lvl:'ap',title:'Efficiency shows in the slope',text:'At 100% efficiency the standard-curve slope is −3.32. A steeper slope, such as −3.9, means each cycle copies less than all the DNA (here about 80%). Labs accept roughly 90–110%.',focus:[352,20,440,250],pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'std'});BioLab.reset(sim);hideTiles(sim);},
  challenges:[
    {lvl:'bio',q:'The 10⁶ well starts with 10 times more DNA than the 10⁵ well. Which one crosses the threshold first?',choices:['The 10⁶ well, with more DNA','The 10⁵ well, with less DNA','They cross at the same cycle'],correct:0,
     baseline:{mode:'std'},changeText:'Running 40 cycles',watch:'curves',at:0,reveal:40.5,
     explain:{bio:'More starting DNA reaches the glowing amount in fewer doublings, so its curve rises first and it has a lower Ct.',honors:'With 10× more template the 10⁶ well needs log₂10 ≈ 3.3 fewer cycles to reach the threshold, so its Ct is about 3.3 lower.'}},
    {lvl:'bio',q:'Halfway through, the threshold line is raised from 0.1 to 0.3. What happens to the Ct values?',choices:['They all get lower (earlier)','They all get higher (later)','They stay the same'],correct:1,
     baseline:{mode:'std',thr:0.1},change:{thr:0.3},changeText:'Threshold raised to 0.3',watch:'curves',at:20,reveal:40.5,
     explain:{bio:'A higher line takes each curve longer to reach, so every Ct goes up. That is why everyone in a lab uses the same threshold when comparing samples.',honors:'Raising the threshold shifts every Ct up by about the same amount, so the differences between samples barely change. Comparisons still work as long as the threshold stays in the steep part of every curve.'}},
    {lvl:'honors',q:'Neighboring standards differ by 10×. About how many cycles apart are their Ct values?',choices:['About 1 cycle','About 3.3 cycles','About 10 cycles'],correct:1,
     baseline:{mode:'std'},changeText:'Running the dilution series',watch:'std',at:0,reveal:40.5,
     explain:{honors:'Each cycle doubles the DNA, and 2³·³² ≈ 10. So a 10-fold difference in starting DNA shows up as about 3.3 cycles.'}},
    {lvl:'honors',q:'Treated cells have 2× as much target mRNA as control cells (same reference gene). How does the treated target’s Ct compare?',choices:['About 1 cycle earlier','About 2 cycles earlier','About 1 cycle later'],correct:0,
     baseline:{mode:'expr',fold:'2'},changeText:'Running control and treated samples',watch:'curves',at:0,reveal:40.5,
     explain:{honors:'Twice the starting copies reaches the threshold one doubling sooner, so the Ct is 1 cycle lower and ΔΔCt is −1.'}},
    {lvl:'ap',q:'A treated sample gives ΔΔCt = −3. What fold change is that?',choices:['3× more target mRNA','8× more target mRNA','8× less target mRNA'],correct:1,
     baseline:{mode:'expr',fold:'8'},changeText:'Running control and treated samples',watch:'curves',at:0,reveal:40.5,
     explain:{ap:'Fold change = 2^(−ΔΔCt) = 2³ = 8. A negative ΔΔCt means the target crossed the threshold earlier in treated cells, so it is more abundant.'}},
    {lvl:'ap',q:'Efficiency drops from 100% to 80%. What happens to the standard curve?',choices:['The slope gets steeper (standards farther apart)','The slope gets flatter (standards closer)','No change'],correct:0,
     baseline:{mode:'std',eff:80},changeText:'Running at 80% efficiency',watch:'std',at:0,reveal:40.5,
     explain:{ap:'At 80% each cycle multiplies DNA by 1.8, so a 10-fold gap takes log₁.₈10 ≈ 3.9 cycles. The slope goes from −3.32 to about −3.9, and efficiency = 10^(−1/slope) − 1 recovers 80%.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does the amount of starting DNA change when a sample lights up?</p><ol><li>Let the run finish.</li><li>Record the Ct of the 10⁷, 10⁶ and 10² standards.</li><li>Raise the threshold to 0.2 and record them again.</li></ol><p>Explain why a lower Ct means more DNA.</p>',
       honors:'<p><b>Question:</b> Does a drug change how much of a gene cells make?</p><ol><li>Switch to Gene expression and set the true change to “4× more”.</li><li>Record the four Ct values and calculate ΔCt, ΔΔCt and the fold change by hand.</li><li>Check against the readouts, then repeat for “½ as much”.</li></ol><p>Explain why the reference gene is needed.</p>',
       ap:'<p><b>Question:</b> How much DNA is in the unknown sample, and how good is the assay?</p><ol><li>Run the standard curve at 100% and record slope, R² and the unknown’s Ct.</li><li>Calculate the unknown’s copies from Ct = m·log₁₀(N) + b.</li><li>Repeat at 90% and 80% efficiency.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain how the slope reveals efficiency, and why labs reject runs with slopes outside about −3.1 to −3.6.</p>'},
  terms:[{t:'qPCR',d:'Quantitative (real-time) PCR: PCR that measures DNA as it is made, using fluorescence.'},{t:'Fluorescence',d:'Light given off by a dye. Here, SYBR Green glows when it binds double-stranded DNA.'},{t:'Ct (threshold cycle)',d:'The cycle at which a sample’s glow crosses the threshold. Lower Ct = more starting DNA.'},
    {lvl:'honors',t:'Standard curve',d:'Ct plotted against log₁₀ of known starting amounts. It is used to measure unknowns.'},{lvl:'honors',t:'Reference (housekeeping) gene',d:'A gene expressed at a steady level, used to correct for how much RNA went into each well.'},{lvl:'honors',t:'ΔΔCt method',d:'Fold change = 2^(−ΔΔCt), where ΔΔCt = ΔCt(treated) − ΔCt(control).'},
    {lvl:'ap',t:'Amplification efficiency',d:'The fraction of DNA copied each cycle. Efficiency = 10^(−1/slope) − 1.'},{lvl:'ap',t:'R²',d:'How well the standards fit a straight line. Good assays have R² > 0.98.'}],
  about:'<p><b>Model:</b> each well follows N<sub>c+1</sub> = N<sub>c</sub>(1 + E(1 − N<sub>c</sub>/10¹²)), so growth is exponential at first and plateaus as reagents run out. Fluorescence = 0.04 background + N/10¹² + noise of ±0.002. Ct is found by linear interpolation where fluorescence crosses the threshold. The standard curve is a least-squares fit of Ct against log₁₀(copies), and efficiency = 10<sup>−1/slope</sup> − 1. In the gene-expression experiment, both reference wells start at 10⁶ copies of cDNA and the control target starts at 10⁵. The treated target is 10⁵ × the chosen fold change.</p><p><b>Simplified:</b> the reverse transcription of mRNA into cDNA is assumed to be perfect and identical across samples. The target and reference genes amplify with the same efficiency, which ΔΔCt requires. There is no melt-curve analysis and no primer dimers. A real instrument reads one value per cycle, and the curves here are drawn between those reads.</p>'
};
BioLab.register(QPCR);
})();
