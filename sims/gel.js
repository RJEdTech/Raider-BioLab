(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,legend,serColor,lvText,fmtNum}=BioLab.h;

/* ---------- data ---------- */
const LADDER1K=[10000,8000,6000,5000,4000,3000,2000,1500,1000,500,250];
const LAMBDA=[23130,9416,6557,4361,2322,2027,564,125];
function smear(sheared){const out=[],r=rng(sheared?9:4);for(let i=0;i<46;i++){const lg=sheared?lerp(2.7,4.4,i/45):lerp(3.5,4.75,i/45);out.push({bp:Math.round(Math.pow(10,lg+(r()-.5)*.02)),w:(sheared?0.16:0.12)*(sheared?1:(0.5+i/45))});}return out;}
const CASES={
  crime:{name:'Crime scene',lanes:[
    {l:'L',name:'DNA ladder (known sizes)',ladder:true,f:LADDER1K},
    {l:'E',name:'Evidence from the crime scene',f:[6200,3400,1800,900]},
    {l:'S1',name:'Suspect 1',f:[7000,3400,2100,900]},
    {l:'S2',name:'Suspect 2',f:[6200,3400,1800,900]},
    {l:'S3',name:'Suspect 3',f:[5600,2900,1800,650]}]},
  paternity:{name:'Paternity test',lanes:[
    {l:'L',name:'DNA ladder (known sizes)',ladder:true,f:LADDER1K},
    {l:'M',name:'Mother',f:[8200,4600,2600,1100]},
    {l:'C',name:'Child',f:[8200,3900,2600,1500]},
    {l:'F1',name:'Alleged father 1',f:[7000,4600,2200,1500]},
    {l:'F2',name:'Alleged father 2',f:[9100,3900,2200,1500]}]},
  strawberry:{name:'Strawberry genomic DNA',lanes:[
    {l:'L',name:'DNA ladder (known sizes)',ladder:true,f:LADDER1K},
    {l:'G',name:'Strawberry genomic DNA (gently mixed)',smear:'gentle'},
    {l:'V',name:'Strawberry DNA, vortexed hard (sheared)',smear:'sheared'}]},
  lambda:{name:'λ/HindIII standard curve',lanes:[
    {l:'λ',name:'λ DNA cut with HindIII (ladder)',ladder:true,f:LAMBDA},
    {l:'X',name:'Unknown X (plasmid digest)',f:[3000,1200]},
    {l:'Y',name:'Unknown Y (PCR products)',f:[5400,850,400]}]}
};
/* Mobility: distance is linear in log(size) over the useful range; a denser gel slows big pieces most. */
function mob(bp,pct){const Lmax=5.0-0.6*(pct-1),s=0.35*(1+0.4*(pct-1));return Math.max(0.02,s*(Lmax-Math.log10(bp)));}
const K=0.00165;           // cm per (volt·minute) per unit mobility
const GEL_CM=7.0;          // well to end of gel
const DYE_B=300,DYE_X=4000; // bromophenol blue and xylene cyanol run like DNA of about these sizes
function buildLanes(c){return CASES[c].lanes.map(L=>({...L,frags:L.smear?smear(L.smear==='sheared').map(f=>({...f,x:0})):L.f.map(bp=>({bp,w:L.ladder&&bp===125?0.35:1,x:0}))}));}

/* ---------- layout ---------- */
const GX0=95,GX1=448,GY0=70,GY1=410,WELLY=96,PXCM=42;
const yOf=x=>WELLY+6+x*PXCM;
function laneX(i,n){const w=(GX1-GX0)/n;return GX0+w*(i+.5);}
function laneW(n){return Math.min(48,(GX1-GX0)/n*0.62);}

/* ---------- standard curve ---------- */
function fit(sim){const s=sim.st,lad=s.lanes.find(l=>l.ladder);if(!lad)return null;
  const pts=lad.frags.filter(f=>f.x>0.4&&f.x<GEL_CM-0.1&&f.bp<20000).map(f=>[f.x,Math.log10(f.bp)]);
  if(pts.length<3)return null;const n=pts.length,mx=pts.reduce((a,p)=>a+p[0],0)/n,my=pts.reduce((a,p)=>a+p[1],0)/n;
  let sxy=0,sxx=0,syy=0;pts.forEach(p=>{sxy+=(p[0]-mx)*(p[1]-my);sxx+=(p[0]-mx)**2;syy+=(p[1]-my)**2;});
  const m=sxy/sxx,b=my-m*mx;return {m,b,r2:sxy*sxy/(sxx*syy),pts};}

const GEL={
  id:'gel',hash:'gel',apUnit:10,order:1,kind:'Virtual lab',tab:'Gel electrophoresis',
  card:'Load the wells, plug in the leads and run the gel. Match a suspect, test paternity, and size DNA with a standard curve.',
  title:'Gel electrophoresis and DNA fingerprinting',
  lede:{bio:'DNA is negatively charged, so an electric field pulls it through a gel. Small pieces slip through faster than big ones, which sorts DNA by size.',
        honors:'Run crime-scene, paternity and strawberry DNA samples. See how voltage, time and agarose percentage change the separation.',
        ap:'Build a semi-log standard curve from a λ/HindIII ladder and use it to estimate the sizes of unknown fragments.'},
  scale:{bio:'Real lab scale: a gel about 7 cm long in a box of buffer. Each band holds billions of identical DNA fragments; a 1,000 base-pair piece is about 0.34 µm long.',
         ap:'Fragments from 125 to 23,130 base pairs. Distance traveled is roughly proportional to voltage × time, and linear in log(size) between about 500 and 10,000 bp in 1% agarose.'},
  timeScale:2,dtMax:0.05,prewarm:0,sampleDt:0.25,window:60,unit:'min',chChange:0.2,chReveal:30,
  controls:[
    {id:'case',label:'Samples',type:'select',def:'crime',lvl:'bio',options:[{v:'crime',l:'Crime scene: evidence and 3 suspects'},{v:'paternity',l:'Paternity test',lvl:'honors'},{v:'strawberry',l:'Strawberry genomic DNA'},{v:'lambda',l:'λ/HindIII ladder and unknowns',lvl:'ap'}],
     onChange(sim){const s=sim.st;s.lanes=buildLanes(sim.p.case);s.runMin=0;s.dyeB=0;s.dyeX=0;s.loadT=sim.vt;}},
    {id:'power',label:'Power supply on',help:'Current flows through the buffer and gel',type:'toggle',def:true,lvl:'bio'},
    {id:'volts',label:'Voltage',type:'range',min:50,max:150,step:5,def:100,unit:' V',lvl:'bio'},
    {id:'leads',label:'How the leads are plugged in',type:'seg',def:'correct',lvl:'bio',options:[{v:'correct',l:'Black at wells (correct)'},{v:'reversed',l:'Red at wells'}]},
    {id:'pct',label:'Agarose',type:'range',min:0.7,max:2,step:0.1,def:1,unit:'%',lvl:'honors',help:'More agarose makes a tighter mesh'},
    {id:'stain',label:'Stain the DNA',help:'DNA is invisible until a stain binds it and glows',type:'toggle',def:true,lvl:'bio',noTrial:true}
  ],
  init(sim){return {lanes:buildLanes(sim.p.case||'crime'),runMin:0,dyeB:0,dyeX:0,loadT:0};},
  step(sim,dt){const p=sim.p,s=sim.st;if(!p.power)return;const dir=p.leads==='correct'?1:-1,v=K*p.volts*dt*dir;s.runMin+=dt;
    s.lanes.forEach(L=>L.frags.forEach(f=>{if(f.x>GEL_CM+0.3||f.x<-0.6)return;f.x+=v*mob(f.bp,p.pct);}));
    s.dyeB+=v*mob(DYE_B,p.pct);s.dyeX+=v*mob(DYE_X,p.pct);},
  metrics:[
    {id:'runmin',label:'Running time',unit:'min',lvl:'bio',min:0,max:90,d:0,get:s=>s.st.runMin},
    {id:'front',label:'Blue dye front',unit:'cm from wells',lvl:'bio',min:-1,max:7,d:1,get:s=>clamp(s.st.dyeB,-1,GEL_CM+0.3)},
    {id:'smallest',label:'Smallest DNA band',unit:'',lvl:'bio',text:true,get:s=>{const all=[];s.st.lanes.forEach(L=>{if(!L.smear)L.frags.forEach(f=>all.push(f));});if(!all.length)return '—';
      const f=all.reduce((a,b)=>a.bp<b.bp?a:b);if(f.x>GEL_CM)return f.bp.toLocaleString()+' bp: ran off the gel';if(f.x<-0.4)return f.bp.toLocaleString()+' bp: lost out the top';if(f.x<0.15)return f.bp.toLocaleString()+' bp: still in the well';return f.bp.toLocaleString()+' bp at '+f.x.toFixed(1)+' cm';}},
    {id:'lost',label:'Bands lost from the gel',unit:'',lvl:'honors',min:0,max:20,d:0,get:s=>{let n=0;s.st.lanes.forEach(L=>{if(!L.smear)L.frags.forEach(f=>{if(f.x>GEL_CM||f.x<-0.4)n++;});});return n;}},
    {id:'est',label:'Unknown sizes from the standard curve',unit:'',lvl:'ap',text:true,noTrial:false,get:s=>{if(s.p.case!=='lambda')return 'Choose the λ/HindIII samples';const F=fit(s);if(!F)return 'Run longer to spread the ladder';
      return s.st.lanes.filter(L=>!L.ladder).map(L=>L.l+': '+L.frags.filter(f=>f.x>0.2&&f.x<GEL_CM).map(f=>'≈'+(Math.round(Math.pow(10,F.m*f.x+F.b)/10)*10).toLocaleString()).join(', ')+' bp').join(' · ');}}
  ],
  graphs:[{id:'front',label:'Blue dye front distance',lines:['front']},{id:'curve',label:'Standard curve (log size vs. distance)',lvl:'honors',custom:true}],
  defaultGraph:'front',
  plot(sim,ctx,box,id){const F=fit(sim),lad=sim.st.lanes.find(l=>l.ladder);
    const ax=axes(ctx,box,{xmin:0,xmax:7,ymin:2,ymax:4.6,xl:'Distance from well (cm)',yl:'log₁₀(size in bp)',yd:1});
    if(!lad||!lad.frags.some(f=>f.x>0.4)){txt(ctx,'Run the gel to spread out the ladder bands.',box.L+box.W/2,box.T+box.H/2,{s:14,c:PAL['muted'],a:'center',b:'middle'});return;}
    if(F){ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(F.b));ctx.lineTo(ax.X(7),ax.Y(F.m*7+F.b));ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'R² = '+F.r2.toFixed(3),box.L+box.W-6,box.T+14,{s:13,c:PAL['muted'],a:'right'});}
    lad.frags.forEach(f=>{if(f.x<=0||f.x>7)return;const y=Math.log10(f.bp);if(y<2||y>4.6)return;ctx.fillStyle=PAL['g-dot'];ctx.beginPath();ctx.arc(ax.X(f.x),ax.Y(y),5,0,6.29);ctx.fill();});
    if(F)sim.st.lanes.filter(L=>!L.ladder&&!L.smear).forEach(L=>L.frags.forEach(f=>{if(f.x<=0.2||f.x>7)return;const y=F.m*f.x+F.b;const X=ax.X(f.x),Y=ax.Y(y);ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(X-5,Y-5);ctx.lineTo(X+5,Y+5);ctx.moveTo(X+5,Y-5);ctx.lineTo(X-5,Y+5);ctx.stroke();}));
    legend(ctx,box.L+10,box.T+12,[{label:'ladder bands',color:PAL['g-dot']},{label:'unknowns (×)',color:PAL['s4']},{label:'best-fit line',color:PAL['g-line'],dash:true}]);},
  challenges:[
    {lvl:'bio',q:'The crime-scene gel runs for 30 minutes. Which DNA fragments end up closest to the bottom (positive) end?',
     choices:['The largest fragments','The smallest fragments','All fragments move together'],correct:1,
     baseline:{case:'crime'},changeText:'Running at 100 V',watch:'front',reveal:30,
     explain:{bio:'Agarose is a tangled mesh. Small pieces of DNA wiggle through the gaps easily, so they travel farthest. Big pieces get caught and stay near the wells. That is how a gel sorts DNA by size.',
              ap:'Mobility falls roughly linearly with log(size): in this run the 250 bp ladder band moved about 4.5 cm while the 10,000 bp band moved about 1.7 cm.'}},
    {lvl:'bio',q:'A student plugs the red (positive) lead into the end of the box with the wells. What happens to the DNA?',
     choices:['It moves down through the gel as usual','It moves up out of the wells and is lost in the buffer','It stays in the wells'],correct:1,
     baseline:{case:'crime',leads:'reversed'},changeText:'Power on with the leads reversed',watch:'front',reveal:20,
     explain:{bio:'DNA’s phosphate backbone is negative, so DNA always moves toward the positive (red) electrode. With red at the wells end, the samples leave the wells the wrong way and drift into the buffer. Remember: “run to red,” and put the wells by the black lead.'}},
    {lvl:'bio',q:'Look at the stained crime-scene gel. Whose DNA matches the evidence lane, band for band?',
     choices:['Suspect 1','Suspect 2','Suspect 3'],correct:1,instant:true,
     explain:{bio:'Suspect 2’s four bands line up exactly with the evidence: 6,200, 3,400, 1,800 and 900 bp. Suspect 1 shares two bands and Suspect 3 shares one, but a match needs every band.',
              honors:'A match needs every band. Suspect 2 matches the evidence at all four positions. Real forensic labs compare 20 STR loci, so a random match is far less likely than one in a billion.'}},
    {lvl:'honors',q:'You forget about the gel, and it runs for 80 minutes instead of 30. What happens to the smallest fragments?',
     choices:['They pile up at the end of the gel','They run off the end of the gel into the buffer','Nothing; they stop when they reach the end'],correct:1,
     baseline:{case:'crime'},changeText:'Running at 100 V for 80 minutes',watch:'front',reveal:80,
     explain:{honors:'Nothing stops DNA at the end of the gel; it keeps moving into the buffer and is gone. Watch the blue loading dye: it runs about as fast as 300 bp DNA, so stop when the dye is about 80% of the way down.'}},
    {lvl:'honors',q:'You pour a 2% agarose gel instead of 1%. Compared with a 1% gel, how far does the 6,200 bp evidence band travel in 30 minutes?',
     choices:['Farther','Less far','The same distance'],correct:1,
     baseline:{case:'crime',pct:2},changeText:'Running a 2% gel',watch:'front',reveal:30,
     explain:{honors:'More agarose means a tighter mesh, which slows every fragment and big ones most of all. In this model the 6,200 bp band travels about 1.5 cm instead of 2.1 cm. Labs use 2–3% gels to separate small PCR products and 0.7% gels for very large DNA.'}},
    {lvl:'honors',q:'In the paternity test, every band in the child comes from either the mother or the father. Which alleged father could be the child’s father?',
     choices:['Alleged father 1','Alleged father 2','Neither'],correct:1,instant:true,
     explain:{honors:'The child shares 8,200 and 2,600 bp with the mother, so the other two bands, 3,900 and 1,500 bp, must come from the father. Father 2 has both. Father 1 has 1,500 but not 3,900, which excludes him.'}},
    {lvl:'ap',q:'Use the λ/HindIII standard curve. Unknown X’s larger band sits about where a fragment of what size would be?',
     choices:['About 1,200 bp','About 3,000 bp','About 9,000 bp'],correct:1,instant:true,
     explain:{ap:'Plot log₁₀(size) against distance for the ladder bands and fit a line, leaving out the 23,130 bp band because large fragments compress near the well. Unknown X’s larger band falls between the 4,361 and 2,322 bp bands, which gives about 3,000 bp. Check the readout after running the gel.'}},
    {lvl:'ap',q:'A gel takes 40 minutes at 75 V. If you double the voltage to 150 V, about how long does the same run take?',
     choices:['About 80 minutes','About 20 minutes','About 40 minutes'],correct:1,instant:true,
     explain:{ap:'Distance ≈ mobility × field strength × time, so doubling the voltage halves the time. Real gels heat up at high voltage, and the heat can smear bands, so labs rarely go above about 150 V for a small box.'}}
  ],
  narrate(sim){const p=sim.p,s=sim.st;
    if(!p.power)return '<b>The power is off.</b> The DNA sits in the wells. Turn on the power supply to start the run.';
    if(p.leads==='reversed')return '<b>The leads are backward.</b> DNA is negative, so it moves toward the positive (red) electrode, which is now at the wells end. The samples are leaving the top of the gel and drifting into the buffer.';
    const lost=GEL.metrics[3].get(sim);
    if(lost>0&&s.dyeB>GEL_CM)return '<b>The smallest fragments have run off the end of the gel</b> into the buffer. Next time, stop when the blue dye front is about 80% of the way down.';
    if(s.runMin<3)return 'Current is flowing. The negatively charged DNA starts to leave the wells and enter the gel, heading for the red electrode.';
    if(!p.stain)return 'You can see only the loading dyes. DNA itself is invisible until a stain binds it. The blue dye front is '+s.dyeB.toFixed(1)+' cm down.';
    if(p.case==='crime'&&s.runMin>15)return 'The bands have spread out. Compare the evidence lane (E) with each suspect: a match has <b>every</b> band in the same place.';
    if(p.case==='paternity'&&s.runMin>15)return 'Find the child’s bands that the mother does not have. The father must have those bands too.';
    if(p.case==='strawberry')return 'Genomic DNA is millions of base pairs long and breaks randomly, so it runs as a smear, not sharp bands. Vortexing shears it into smaller pieces that travel farther.';
    if(p.case==='lambda'&&s.runMin>15)return 'Each ladder band has a known size. Plot log(size) against distance to make a standard curve, then read the unknowns off the line.';
    return 'After '+Math.round(s.runMin)+' min at '+p.volts+' V the blue dye has moved '+s.dyeB.toFixed(1)+' cm. Small fragments slip through the agarose mesh faster, so they are farther down.';},
  tour:[
    {title:'The gel box',text:'A slab of agarose gel sits in a box of salty buffer that carries current. The row of small pockets near the top are the <b>wells</b>.',focus:[18,28,474,416],pause:true},
    {title:'Load the wells',text:'Each sample is mixed with dense blue loading dye, so it sinks into its well. Lane 1 is a <b>DNA ladder</b>: fragments of known sizes to compare against.',focus:[GX0-6,WELLY-16,GX1-GX0+12,34],pause:true},
    {title:'Plug in the leads',text:'Black to black, red to red, with the wells at the black (negative) end. Lab rule: <b>run to red</b>.',focus:[[18,28,474,26],[18,418,474,24],[505,36,285,170]],pause:true},
    {title:'DNA moves toward +',text:'DNA’s phosphate backbone is negatively charged, so the electric field pulls every fragment toward the positive end. Watch the blue dye front.',focus:[GX0-6,GY0,GX1-GX0+12,GY1-GY0],speed:4},
    {title:'Small pieces win the race',text:'Agarose is a tangled mesh. Small fragments slip through the gaps quickly; big fragments get caught and lag behind. The DNA sorts itself by size.',focus:[GX0-6,GY0,GX1-GX0+12,GY1-GY0],speed:4},
    {title:'Stain and read',text:'DNA is invisible until a stain binds to it and glows. Each glowing band is billions of copies of one fragment size.',focus:[GX0-6,GY0,GX1-GX0+12,GY1-GY0],speed:4,setup(sim){BioLab.setValues(sim,{stain:true});}},
    {title:'Read the fingerprint',text:'Compare the evidence lane (E) with each suspect. Suspect 2 matches every band.',focus(sim){const n=sim.st.lanes.length,w=(GX1-GX0)/n;return [[GX0+w,GY0,w,GY1-GY0],[GX0+3*w,GY0,w,GY1-GY0]];},pause:true},
    {lvl:'ap',title:'Build a standard curve',text:'With the λ/HindIII ladder, plot log(size) against distance. Choose “Standard curve” on the graph, then read the unknowns’ sizes off the line.',focus:[GX0-6,GY0,GX1-GX0+12,GY1-GY0],speed:4,setup(sim){BioLab.setValues(sim,{case:'lambda'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{case:'crime',leads:'correct',power:true});},
  lab:{bio:'<p><b>Question:</b> How does voltage change how far DNA moves?</p><ol><li>Choose the crime-scene samples.</li><li>For 50, 75, 100, 125 and 150 V: press Reset, let the gel run until the clock reads 20 minutes, pause, and record a trial.</li><li>Plot voltage (x) against blue dye front distance (y).</li></ol><p>Describe the pattern and explain why DNA moves at all.</p>',
       honors:'<p><b>Question:</b> How does agarose percentage affect separation?</p><ol><li>Run the crime-scene gel at 100 V for 30 minutes with 0.7%, 1.0%, 1.5% and 2.0% agarose (Reset between runs).</li><li>Record the dye front and look at how far apart the 500 and 1,000 bp ladder bands are.</li></ol><p>Which gel would you choose to separate two PCR products of 300 and 350 bp? Explain.</p>',
       ap:'<p><b>Question:</b> How big are the unknown fragments?</p><ol><li>Choose the λ/HindIII samples and run 30–40 minutes at 100 V.</li><li>Open the Standard curve graph. Note which ladder bands are used and the R².</li><li>Read the estimated sizes of unknowns X and Y.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why a semi-log plot is used and why the largest ladder bands are left out of the fit.</p>'},
  terms:[{t:'Gel electrophoresis',d:'Using an electric field to pull DNA through a gel, which sorts the fragments by size.'},{t:'Agarose',d:'A seaweed sugar that sets into a gel with a mesh of tiny pores.'},{t:'DNA ladder',d:'A mix of DNA fragments of known sizes run beside the samples for comparison.'},{t:'Band',d:'A spot on the gel where many fragments of the same size have collected.'},
    {lvl:'honors',t:'Loading dye',d:'A dense, colored liquid mixed with samples so they sink into the wells and you can watch the run.'},{lvl:'honors',t:'DNA fingerprint',d:'A pattern of bands that is unique to one person, made by cutting or copying highly variable regions of DNA.'},{lvl:'honors',t:'Restriction fragment',d:'A piece of DNA made by cutting with a restriction enzyme.'},
    {lvl:'ap',t:'Standard curve',d:'A graph of known sizes (as log₁₀ bp) against distance traveled, used to estimate unknown sizes.'},{lvl:'ap',t:'Semi-log plot',d:'A graph where one axis is logarithmic, which straightens the curved size–distance relationship.'}],
  about:'<p>Each fragment moves at speed = 0.00165 × voltage × mobility, in cm per minute, toward the positive electrode. Mobility = s × (L − log₁₀ bp), where s and L depend on agarose percentage. A denser gel slows everything and slows large fragments most.</p><p>Simplifications: bands stay perfectly sharp (no diffusion or heating), buffer never runs down, and the log-linear relationship is applied to all sizes; real gels compress very large fragments near the well. The fingerprint patterns are made up for teaching. The λ/HindIII band sizes are real.</p>',
  initVis(sim){const r=rng(3),v=sim.vis;v.bub=[];v.r=r;},
  thumbSetup(sim){sim.st.lanes.forEach(L=>L.frags.forEach(f=>{f.x=K*100*30*mob(f.bp,1);}));sim.st.dyeB=K*100*30*mob(DYE_B,1);sim.st.dyeX=K*100*30*mob(DYE_X,1);sim.st.runMin=30;sim.st.loadT=-99;},
  thumbFrames:4,
  draw(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st,v=sim.vis,n=s.lanes.length,lw=laneW(n);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // buffer chamber
    rr(ctx,18,28,474,416,14);ctx.fillStyle=PAL['cv-water'];ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.stroke();
    const topPos=p.leads==='correct'?'−':'+',topCol=p.leads==='correct'?'#26262b':'#d32f2f',botCol=p.leads==='correct'?'#d32f2f':'#26262b';
    ctx.strokeStyle=topCol;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(40,44);ctx.lineTo(470,44);ctx.stroke();
    ctx.strokeStyle=botCol;ctx.beginPath();ctx.moveTo(40,428);ctx.lineTo(470,428);ctx.stroke();
    pill(ctx,topPos==='−'?'− black':'+ red',60,44,topCol,'#fff',11*k);pill(ctx,topPos==='−'?'+ red':'− black',60,428,botCol,'#fff',11*k);
    // electrolysis bubbles: more at the negative electrode (hydrogen)
    if(p.power&&vdt>0){const negY=p.leads==='correct'?44:428,posY=p.leads==='correct'?428:44;for(let i=0;i<2;i++){if(Math.random()<0.5)v.bub.push({x:110+Math.random()*350,y:negY,life:1});}if(Math.random()<0.5)v.bub.push({x:110+Math.random()*350,y:posY,life:1});}
    v.bub.forEach(b=>{b.y-=12*vdt;b.life-=vdt*1.5;});v.bub=v.bub.filter(b=>b.life>0);if(v.bub.length>80)v.bub.splice(0,v.bub.length-80);
    ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1;v.bub.forEach(b=>{ctx.globalAlpha=clamp(b.life,0,1);ctx.beginPath();ctx.arc(b.x,b.y,1.8,0,6.29);ctx.stroke();});ctx.globalAlpha=1;
    // gel slab
    const stained=p.stain;rr(ctx,GX0-12,GY0,GX1-GX0+24,GY1-GY0,6);ctx.fillStyle=stained?'#1f2a36':'rgba(235,240,236,.85)';ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.5;ctx.stroke();
    // wells and lane labels
    for(let i=0;i<n;i++){const x=laneX(i,n);ctx.fillStyle=stained?'#0d1218':'#9aa7ad';ctx.fillRect(x-lw/2,WELLY-4,lw,8);
      txt(ctx,s.lanes[i].l,x,GY0-8,{s:13*k,w:700,a:'center'});}
    // loading animation (pipette tip visits each well)
    const lt=sim.vt-s.loadT;if(lt>=0&&lt<n*0.45+0.3){const i=Math.min(n-1,Math.floor(lt/0.45)),x=laneX(i,n),dip=Math.sin(((lt%0.45)/0.45)*Math.PI);
      ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.moveTo(x-3,WELLY-60+dip*44);ctx.lineTo(x+3,WELLY-60+dip*44);ctx.lineTo(x+1,WELLY-14+dip*44);ctx.lineTo(x-1,WELLY-14+dip*44);ctx.closePath();ctx.fill();}
    ctx.save();ctx.beginPath();ctx.rect(GX0-12,GY0,GX1-GX0+24,GY1-GY0);ctx.clip();
    // loading dyes (always visible)
    const dye=(x,col,a)=>{if(x<-0.4||x>GEL_CM+0.2)return;const y=yOf(Math.max(x,-0.2));ctx.fillStyle=col;ctx.globalAlpha=a;for(let i=0;i<n;i++){if(lt>=0&&i>=Math.floor(lt/0.45)+1&&lt<n*0.45)continue;const cx=laneX(i,n);ctx.fillRect(cx-lw/2,y-3,lw,6);}ctx.globalAlpha=1;};
    dye(s.dyeX,'#5b3fa6',stained?0.45:0.55);dye(s.dyeB,'#2f56d6',stained?0.5:0.7);
    // DNA bands
    if(stained){s.lanes.forEach((L,i)=>{const cx=laneX(i,n);if(lt>=0&&lt<n*0.45&&i>=Math.floor(lt/0.45)+1)return;
      L.frags.forEach(f=>{if(f.x>GEL_CM+0.25||f.x<-0.45)return;const y=yOf(Math.max(f.x,-0.15));const a=clamp(f.w,0.05,1);
        ctx.fillStyle='rgba(255,190,90,'+(0.25*a)+')';ctx.fillRect(cx-lw/2-2,y-5,lw+4,10);ctx.fillStyle='rgba(255,236,190,'+(0.9*a)+')';ctx.fillRect(cx-lw/2,y-2,lw,4);});});}
    ctx.restore();
    // ladder size labels
    const lad=s.lanes.findIndex(L=>L.ladder);if(stained&&lad===0){let lastY=-99;s.lanes[0].frags.forEach(f=>{if(f.x<0.15||f.x>GEL_CM)return;const y=yOf(f.x);if(Math.abs(y-lastY)<14*k)return;lastY=y;txt(ctx,f.bp>=1000?(f.bp/1000)+' kb':f.bp+' bp',GX0-16,y,{s:11.5*k,a:'right',b:'middle',c:PAL['cv-ink']});});}
    // cm ruler on the right of the gel
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;for(let c=0;c<=7;c++){const y=yOf(c);ctx.beginPath();ctx.moveTo(GX1+14,y);ctx.lineTo(GX1+20,y);ctx.stroke();if(c%2===1)txt(ctx,c+' cm',GX1+23,y,{s:11*k,b:'middle',c:PAL['cv-soft']});}
    // power supply
    rr(ctx,510,40,275,140,10);ctx.fillStyle=PAL['card2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
    txt(ctx,'Power supply',525,62,{s:12.5*k,w:700,c:PAL['cv-soft']});
    rr(ctx,525,72,150,56,6);ctx.fillStyle='#10202a';ctx.fill();
    const mm=Math.floor(s.runMin),ss=Math.floor((s.runMin-mm)*60);
    txt(ctx,p.power?p.volts+' V':'OFF',540,98,{s:22*k,w:700,c:p.power?'#7dff9a':'#5d6b70',b:'middle'});
    txt(ctx,String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0'),540,118,{s:13*k,c:'#7dff9a',b:'middle'});
    ctx.fillStyle=p.power?'#3ad06a':'#55606a';ctx.beginPath();ctx.arc(700,90,8,0,6.29);ctx.fill();
    ctx.fillStyle='#26262b';ctx.beginPath();ctx.arc(700,150,9,0,6.29);ctx.fill();ctx.fillStyle='#d32f2f';ctx.beginPath();ctx.arc(750,150,9,0,6.29);ctx.fill();
    txt(ctx,'−',700,151,{s:13,w:700,c:'#fff',a:'center',b:'middle'});txt(ctx,'+',750,151,{s:13,w:700,c:'#fff',a:'center',b:'middle'});
    // lane key
    txt(ctx,CASES[p.case].name,515,214,{s:13.5*k,w:700});
    s.lanes.forEach((L,i)=>{const y=240+i*26*Math.min(k,1.3);txt(ctx,L.l,520,y,{s:12.5*k,w:700,c:PAL['rj']});txt(ctx,L.name,552,y,{s:12*k,c:PAL['cv-ink']});});
    if(!stained)txt(ctx,'DNA is invisible until stained',515,420,{s:12*k,c:PAL['cv-soft']});
  }
};
BioLab.register(GEL);
})();
