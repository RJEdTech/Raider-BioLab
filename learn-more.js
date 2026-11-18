/* Learn it for the last tools without it (Nov 17, 2026, last-tools session).
   One BioLab.addLearn block for this site's tools, plus Test yourself why questions (addReview) for tools that had none.
   Each step reuses the tool's own walkthrough setups (captured below before Learn it replaces the tour) and adds live number cards. */
(function(){
'use strict';
/* ---- shared helpers for learn-more.js (copied into each site's file) ---- */
const H=BioLab.h,PAL=H.PAL;
const RED='#b3261e',GREEN='#1b7a3a',BLUE='#1f5fbf',HI='#c8102e';
const DEF=id=>BioLab.defs.find(d=>d.id===id);
/* the tool's own walkthrough steps, captured before Learn it replaces them */
const TOUR={};BioLab.defs.forEach(d=>{TOUR[d.id]=(d.tour||[]).slice();});
const TS=(id,title)=>{const s=(TOUR[id]||[]).find(x=>{const t=typeof x.title==='object'?Object.values(x.title).join('|'):String(x.title||'');return t.indexOf(title)>=0;});return s&&s.setup?s.setup:null;};
const tour=(id,title)=>sim=>{const f=TS(id,title);if(f)f(sim);};
const met=(sim,id)=>(sim.def.metrics||[]).find(m=>m.id===id);
const M=(sim,id)=>{const m=met(sim,id);if(!m)return NaN;try{return m.get(sim);}catch(e){return NaN;}};
const pick=(v)=>{if(v&&typeof v==='object'){const L=H.level||'bio';return v[L]||(L==='ap'&&v.honors)||v.bio||Object.values(v)[0];}return v;};
/* formatted metric: "label: value unit" or just value */
const F=(sim,id,d)=>{const m=met(sim,id);if(!m)return '…';let v;try{v=m.get(sim);}catch(e){return '…';}
  if(v==null)return '…';if(typeof v==='string')return v;if(!isFinite(v))return '…';
  const dd=d!=null?d:(m.d!=null?m.d:1);let s=Math.abs(v)>=1e4&&dd===0?Math.round(v).toLocaleString('en-US'):v.toFixed(dd);
  const u=pick(m.unit);return s+(u&&!/^\(|^of |^\(/.test(u)&&u.length<14?' '+u:'');};
const FL=(sim,id,d)=>{const m=met(sim,id);return (m?pick(m.label):id)+': '+F(sim,id,d);};
/* card: word-wrapped rows. pos: [x,y] top-left, or {x,y,w,up} */
function card(ctx,k,x,y,w,L,o){o=o||{};const kk=Math.min(k,1.35),pad=10*kk,rows=[];
  L.filter(r=>r!==''&&r!=null).forEach(r=>{const t=Array.isArray(r)?r:[r,{}],op=t[1]||{},sz=(op.s||13)*kk;ctx.font=(op.w||600)+' '+sz+'px '+H.FONT;
    const words=String(t[0]).split(' ');let cur='';words.forEach(wd=>{const tr=cur?cur+' '+wd:wd;if(cur&&ctx.measureText(tr).width>w-2*pad){rows.push([cur,op,sz]);cur=wd;}else cur=tr;});if(cur)rows.push([cur,op,sz]);});
  let h=pad*1.6;rows.forEach(r=>h+=r[2]*1.35);if(o.up)y-=h;
  ctx.save();H.rr(ctx,x,y,w,h,9);ctx.fillStyle=PAL['cv-sol']||PAL['card'];ctx.globalAlpha=0.96;ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=o.hi===false?1.2:2.5;ctx.strokeStyle=o.hi===false?PAL['cv-soft']:HI;ctx.stroke();
  let yy=y+pad*0.8;rows.forEach(([s,op,sz])=>{yy+=sz*1.1;H.txt(ctx,s,x+pad,yy,{s:sz,w:op.w||600,c:op.c||PAL['cv-ink']});yy+=sz*0.25;});ctx.restore();return h;}
/* red ring around the part of the picture that matters in this step */
function ring(ctx,k,r,tau){if(!r)return;const a=0.55+0.45*Math.sin((tau||0)*4);ctx.save();ctx.globalAlpha=a;ctx.lineWidth=3;ctx.strokeStyle=HI;ctx.setLineDash([7,5]);H.rr(ctx,r[0],r[1],r[2],r[3],10);ctx.stroke();ctx.restore();}
const atT=(sim,tau,t,key,fn)=>{sim._at=sim._at||{};const kk=(sim.lnKey||'')+':'+key;if(tau>=t&&!sim._at[kk]){sim._at[kk]=1;fn(sim);}};
const atReset=sim=>{sim._at={};};
const L={},R={};
/* ---------- molclock ---------- */
const mcCard=(ctx,k,LH,rows)=>card(ctx,k,12,LH-10,380,rows,{up:true});
L.molclock={
  goals:{
    bio:['Why random mutations still pile up at a steady average rate','Why species that split longer ago differ at more DNA sites','How one fossil date turns DNA differences into a date','How the same idea dates the start of a virus outbreak'],
    honors:['How UPGMA builds a tree from DNA differences alone','How a fossil calibration sets the clock’s rate','Why fast genes suit recent splits and slow genes suit ancient ones'],
    ap:['Why deep splits saturate: sites change twice or change back','How the Jukes–Cantor correction recovers the hidden changes','How choosing a gene and a calibration changes an estimate']},
  matters:'A molecular clock is how scientists dated our split from chimps, traced when COVID-19 began spreading in people, and placed animals with almost no fossils on the tree of life. It is also a lesson in measurement: a clock needs a steady rate and one known date to set it.',
  startKey:'start',startRun:false,
  steps:[
    {key:'ancestor',title:'One gene, 450 million years ago',run:tour('molclock','One ancestral gene'),pause:true,focus:[10,36,380,210],
     see:'One population of fish-like animals, 450 million years ago, all with the same version of one gene. The tree on the left is the fossil family history.',
     why:'Every descendant inherited a copy. Like photocopies of photocopies, copies apart longer collect more differences.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,36,380,210],tau);}},
    {key:'flash',title:'Random changes, steady rate',speed:0.15,focus:[404,40,388,180],
     see:'Time starts. Each white flash is one mutation: one DNA letter changing by a copying error.',
     why:'Which letter changes next is random, but the count grows at a steady average rate, like raindrops filling a bucket. That makes DNA a clock.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[404,40,388,180],tau);}},
    {key:'split',title:'After a split, copies drift apart',speed:0.6,focus:[10,36,380,210],
     see:'A branch point on the tree. From there on, each lineage collects its own mutations.',
     why:'Mutations in one lineage aren’t shared by the other, so their differences keep adding up the whole time they are apart.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,36,380,210],tau);}},
    {key:'today',title:'Count the differences today',run:tour('molclock','Count the differences'),pause:true,focus:[330,40,462,180],
     see:'Today. The table compares species pairs across 1,000 DNA letters.',
     why:'Human–chimp (6 million years apart): a few differences. Human–mouse (90): dozens. Human–shark (450): hundreds. More time, more differences.',
     overlay(sim,ctx,LH,k){mcCard(ctx,k,LH,[[FL(sim,'dHM',0),{w:700}],[FL(sim,'dHS',0),{w:700,c:RED}]]);}},
    { key: 'clockgraph', title: 'The clock as a graph', speed: 0.5,
      see: 'Each dot is a species pair from today’s table: time since the split across, DNA differences up. The line runs through human–mouse.',
      why: 'More time apart, more differences, in a nearly straight line. That steady slope is the clock’s rate.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,p=tau%14,B={x0:120,x1:740,y0:70,y1:360},xr=[0,450];K.dim(ctx,LH);
        /* dots: the model's live counts (metrics dHC, dHM, dHS of 1,000 sites); line: through the origin and human–mouse, the fossil calibration */
        const g=id=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);try{return m?m.get(sim):0;}catch(e){return 0;}};
        const pts=[['Human–chimp',6,g('dHC')],['Human–mouse',90,g('dHM')],['Human–shark',450,g('dHS')]],ymax=Math.max(350,Math.ceil(Math.max(...pts.map(q=>q[2]))/50)*50+50),sc=v=>v/ymax;
        K.axes(ctx,B,k,{xr,xt:[[0,'0'],[90,'90'],[180,'180'],[270,'270'],[360,'360'],[450,'450']],yt:[[0,'0'],[sc(100),'100'],[sc(200),'200'],[sc(300),'300']],xl:'Millions of years since the split',yl:'Differences (of 1,000)'});
        const rate=(pts[1][2]||63)/90;const tl=Math.min(450,ymax/rate);if(p>=3)K.curve(ctx,B,xr,t=>sc(rate*t),p<5?tl*(p-3)/2:tl,'#1b7a3a',null,3);
        pts.forEach(([n,t,d],i)=>{if(p<0.6+i*0.8)return;const x=K.X(B,xr,t),y=K.Y(B,sc(d));K.dot(ctx,x,y,'#c8102e',7);
          K.tagA(ctx,n+': '+Math.round(d),i===2?x-12:x+12,i===0?y-80:i===1?y+28:y+26,k,{s:12.5},i===2?'r':'l');});
        if(p>=5.5)K.tagA(ctx,'Slope = rate ≈ '+rate.toFixed(2)+' per million years',B.x0+12,B.y0+20,k,{s:13,hi:true},'l');} },
    {key:'tree',lvl:'honors',title:'Rebuild the tree from DNA alone',run:tour('molclock','Rebuild the tree'),pause:true,focus:[10,256,390,190],
     see:'UPGMA joins the two closest species, averages their distances to the rest, and repeats until all six are joined.',
     why:'The DNA tree matches the fossil tree. That is how biologists place organisms that left almost no fossils.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,256,390,190],tau);}},
    {key:'cal',title:'One fossil sets the rate',run:tour('molclock','Calibrate the clock'),pause:true,focus:[410,272,380,170],
     see:'One fossil date goes in: humans and mice split 90 million years ago. Read the human–chicken clock date.',
     why:'Human–mouse differences ÷ 90 million years gives the rate. Then divide any pair’s differences by the rate, like miles into hours.',
     overlay(sim,ctx,LH,k){mcCard(ctx,k,LH,[[FL(sim,'eCh',0),{w:800,c:GREEN}],['Fossil date: 320 million years ago']]);}},
    {key:'hook',title:'Your question: when did we split from chickens?',run:tour('molclock','Count the differences'),pause:true,focus:[410,272,380,170],
     see:'Human–mouse: about 65 differences in 90 million years. Human–chicken: about 220. Read the clock date.',
     why:'220 ÷ 65 ≈ 3.4, so about 3.4 × 90 ≈ 300 million years. The fossil date is 320. Random mutations make each run a little off, so real studies use many genes.',
     overlay(sim,ctx,LH,k){mcCard(ctx,k,LH,[[FL(sim,'dHM',0),{w:700}],[FL(sim,'eCh',0),{w:800,c:GREEN}]]);}},
    {key:'fast',lvl:'honors',title:'A fast gene for recent splits',run:sim=>{BioLab.setValues(sim,{gene:'fast'});BioLab.reset(sim);const f=TS('molclock','Count the differences');if(f)f(sim);},pause:true,focus:[330,40,462,180],
     cause:{from:{gene:'slow'},delay:0.8,dur:0.6,label:'Gene'},
     see:'Same species, a gene that changes about five times faster. Compare human and chimp.',
     why:'A slow gene barely changes in 6 million years. A fast gene tells recent splits apart; for ancient splits, a slow gene is better.',
     overlay(sim,ctx,LH,k){mcCard(ctx,k,LH,[[FL(sim,'dHC',0),{w:800,c:GREEN}],[FL(sim,'dHM',0)]]);}},
    {key:'sat',lvl:'ap',title:'Saturation and the correction',run:tour('molclock','Saturation'),pause:true,focus:[410,350,380,96],
     see:'The fast gene, calibrated on human–mouse. Read the shark date, then turn on the Jukes–Cantor correction in Full lab.',
     why:'Over 450 million years many sites change twice or back, so raw counts undercount and the split looks too young. Jukes–Cantor, d = −¾ ln(1 − 4p/3), corrects it.',
     overlay(sim,ctx,LH,k){mcCard(ctx,k,LH,[[FL(sim,'eSh',0),{w:800,c:RED}],['True shark split: 450 million years ago']]);}}
  ],
  useIt:[
    {do:'When a news story says a virus variant “emerged in” a certain month, look for how they know.',why:'Labs count mutations in virus genomes from many patients and run a molecular clock backward. It is the same method, on a scale of months instead of millions of years.'},
    {do:'If you try a consumer DNA ancestry test, read its confidence ranges, not just the headline.',why:'Like this clock, ancestry estimates come from counting shared and different DNA against a reference. Random variation means every estimate has a range.'},
    {do:'Next time you see a family tree of animals at a museum or zoo, check whether it says how the dates were found.',why:'Many branch dates now come from DNA clocks calibrated with a few fossils, the same two steps you used here.'}],
  tryIt:[{title:'the photocopy clock (15 minutes)',steps:['Write a 20-letter sentence. Copy it by hand without looking back at the original, then copy your copy, and so on, five times.','Have a friend do the same from your first copy.','Count how many letters differ between your copy 5 and theirs.'],look:'Each copy adds a few random changes. The two lines of copies drift apart the more times they are copied, just like two lineages after a split.'}]};
R.molclock={questions:[
  {id:'steady',kind:'test',lvl:'bio',q:'Mutations happen at random. Why can they still work as a clock?',choices:['Each gene mutates on a fixed schedule','They add up at a steady average rate','Mutations happen only when new species form','Fossils tell each gene when to mutate'],correct:1,
   steps:['Any single mutation is unpredictable.','Over millions of years, the count per lineage grows at a steady average rate.','A steady rate, like rain filling a bucket, lets the count stand for time.']},
  {id:'more',kind:'test',lvl:'bio',q:'Which pair would you expect to differ at more sites of the same gene?',choices:['Human and chimp, split 6 million years ago','Human and shark, split 450 million years ago','Both the same, since all share one ancestor','Neither, since genes do not change over time at all'],correct:1,
   steps:['After a split, each lineage collects its own mutations.','The longer they are apart, the more differences add up.','450 million years apart gives far more differences than 6 million.']},
  {id:'calnum',kind:'test',lvl:'bio',q:'Human and mouse (split 90 million years ago) differ at 65 sites. Human and chicken differ at 220. About when did humans and chickens split?',num:{ans:305,tol:25,unit:'million years ago'},
   steps:['Rate: 65 differences per 90 million years.','220 ÷ 65 ≈ 3.4 times as many differences.','3.4 × 90 ≈ 300 million years ago (the fossil date is 320).']},
  {id:'covid',kind:'real',lvl:'bio',q:'How could scientists tell COVID-19 began spreading in people in late 2019?',choices:['From the date the first patient told a doctor they felt sick','From mutation counts in many virus genomes','From fossils of the virus found in caves','From a fixed schedule all viruses follow'],correct:1,
   steps:['Virus genomes from patients differ by a few mutations.','The virus mutates at a roughly steady rate.','Counting back to when the genomes would have been identical dates the start of the spread.']},
  {id:'fastslow',kind:'test',lvl:'honors',q:'You want to compare two species of trout that split about 1 million years ago. Which gene suits that?',choices:['A slow gene, like ribosomal RNA','A fast gene, like a mitochondrial gene','Any gene, since all change at one rate','No gene, since 1 million years is too short'],correct:1,
   steps:['A slow gene barely changes in a million years.','A fast gene gives enough differences to measure.','Fast genes suit recent splits; slow genes suit ancient ones.']},
  {id:'upgma',kind:'test',lvl:'honors',q:'UPGMA builds a tree from a table of DNA differences. What does it do first?',choices:['Joins the two species with the most differences','Joins the two species with the fewest differences','Puts the oldest fossil at the root first','Picks two species at random, then checks the fossils'],correct:1,
   steps:['Fewest differences means most recently split.','UPGMA joins that closest pair first.','It then averages their distances to the rest and repeats.']},
  {id:'saturate',kind:'test',lvl:'ap',q:'With a fast gene, the raw clock dates the shark split far too young. Why?',choices:['Sharks mutate more slowly than mammals do','Many sites changed more than once or changed back','The fossil date used to set the rate was simply wrong','Fast genes stop changing after a while'],correct:1,
   steps:['Over 450 million years, a fast-changing site can mutate twice.','A change and a change back looks like no change at all.','So differences undercount true changes; Jukes–Cantor estimates the hidden ones.']},
  {id:'readgraph',kind:'test',lvl:'bio',
    q:'<p>Using the graph, about how many differences would you expect for two species that split 180 million years ago?</p><svg viewBox="0 0 420 230" style="display:block;width:100%;max-width:440px;height:auto;margin:10px 0 4px;color:inherit" role="img" aria-label="Graph of DNA differences against time since two species split: points at 6, 90 and 320 million years fall on a straight line through the origin, rising 63 differences per 90 million years."><path d="M58 16V180H406" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M58.0 180v4" stroke="currentColor"/><text x="58.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">0</text><path d="M143.5 180v4" stroke="currentColor"/><text x="143.5" y="196" font-size="12" text-anchor="middle" fill="currentColor">100</text><path d="M229.0 180v4" stroke="currentColor"/><text x="229.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">200</text><path d="M314.5 180v4" stroke="currentColor"/><text x="314.5" y="196" font-size="12" text-anchor="middle" fill="currentColor">300</text><path d="M400.0 180v4" stroke="currentColor"/><text x="400.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">400</text><path d="M54 180.0h4" stroke="currentColor"/><text x="51" y="184.0" font-size="12" text-anchor="end" fill="currentColor">0</text><path d="M54 101.0h4" stroke="currentColor"/><text x="51" y="105.0" font-size="12" text-anchor="end" fill="currentColor">150</text><path d="M54 22.0h4" stroke="currentColor"/><text x="51" y="26.0" font-size="12" text-anchor="end" fill="currentColor">300</text><text x="229.0" y="216" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Millions of years since split</text><text transform="translate(16 101.0) rotate(-90)" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Differences</text><path d="M58.0 180.0L59.7 179.3L61.4 178.5L63.1 177.8L64.8 177.1L66.5 176.3L68.3 175.6L70.0 174.8L71.7 174.1L73.4 173.4L75.1 172.6L76.8 171.9L78.5 171.2L80.2 170.4L81.9 169.7L83.7 168.9L85.4 168.2L87.1 167.5L88.8 166.7L90.5 166.0L92.2 165.3L93.9 164.5L95.6 163.8L97.3 163.0L99.0 162.3L100.8 161.6L102.5 160.8L104.2 160.1L105.9 159.4L107.6 158.6L109.3 157.9L111.0 157.1L112.7 156.4L114.4 155.7L116.1 154.9L117.8 154.2L119.6 153.5L121.3 152.7L123.0 152.0L124.7 151.2L126.4 150.5L128.1 149.8L129.8 149.0L131.5 148.3L133.2 147.6L134.9 146.8L136.7 146.1L138.4 145.3L140.1 144.6L141.8 143.9L143.5 143.1L145.2 142.4L146.9 141.7L148.6 140.9L150.3 140.2L152.1 139.4L153.8 138.7L155.5 138.0L157.2 137.2L158.9 136.5L160.6 135.8L162.3 135.0L164.0 134.3L165.7 133.5L167.4 132.8L169.2 132.1L170.9 131.3L172.6 130.6L174.3 129.9L176.0 129.1L177.7 128.4L179.4 127.6L181.1 126.9L182.8 126.2L184.5 125.4L186.2 124.7L188.0 124.0L189.7 123.2L191.4 122.5L193.1 121.8L194.8 121.0L196.5 120.3L198.2 119.5L199.9 118.8L201.6 118.1L203.3 117.3L205.1 116.6L206.8 115.9L208.5 115.1L210.2 114.4L211.9 113.6L213.6 112.9L215.3 112.2L217.0 111.4L218.7 110.7L220.4 110.0L222.2 109.2L223.9 108.5L225.6 107.7L227.3 107.0L229.0 106.3L230.7 105.5L232.4 104.8L234.1 104.1L235.8 103.3L237.6 102.6L239.3 101.8L241.0 101.1L242.7 100.4L244.4 99.6L246.1 98.9L247.8 98.2L249.5 97.4L251.2 96.7L252.9 95.9L254.6 95.2L256.4 94.5L258.1 93.7L259.8 93.0L261.5 92.3L263.2 91.5L264.9 90.8L266.6 90.0L268.3 89.3L270.0 88.6L271.8 87.8L273.5 87.1L275.2 86.4L276.9 85.6L278.6 84.9L280.3 84.1L282.0 83.4L283.7 82.7L285.4 81.9L287.1 81.2L288.9 80.5L290.6 79.7L292.3 79.0L294.0 78.2L295.7 77.5L297.4 76.8L299.1 76.0L300.8 75.3L302.5 74.6L304.2 73.8L305.9 73.1L307.7 72.3L309.4 71.6L311.1 70.9L312.8 70.1L314.5 69.4L316.2 68.7L317.9 67.9L319.6 67.2L321.3 66.5L323.1 65.7L324.8 65.0L326.5 64.2L328.2 63.5L329.9 62.8L331.6 62.0L333.3 61.3L335.0 60.6L336.7 59.8L338.4 59.1L340.1 58.3L341.9 57.6L343.6 56.9L345.3 56.1L347.0 55.4L348.7 54.7L350.4 53.9L352.1 53.2L353.8 52.4L355.5 51.7L357.2 51.0L359.0 50.2L360.7 49.5L362.4 48.8L364.1 48.0L365.8 47.3L367.5 46.5L369.2 45.8L370.9 45.1L372.6 44.3L374.4 43.6L376.1 42.9L377.8 42.1L379.5 41.4L381.2 40.6L382.9 39.9L384.6 39.2L386.3 38.4L388.0 37.7L389.7 37.0L391.4 36.2L393.2 35.5L394.9 34.7L396.6 34.0L398.3 33.3L400.0 32.5" fill="none" stroke="#1b7a3a" stroke-width="3"/><circle cx="63.1" cy="177.9" r="5" fill="#c8102e"/><circle cx="134.9" cy="146.8" r="5" fill="#c8102e"/><circle cx="331.6" cy="62.0" r="5" fill="#c8102e"/></svg>',
    choices:['About 125','About 63','About 250','About 30'],correct:0,
    steps:['The line rises about 63 differences every 90 million years.','180 million years is twice 90.','So about 2 × 63 ≈ 125 differences.']},
  {id:'straight',kind:'test',lvl:'bio',
    q:'<p>Why do the points on a molecular clock graph fall close to a straight line?</p>',
    choices:['Mutations build up at a fairly steady rate','Every species mutates its DNA on purpose','Closely related species never get mutations','Fossils add new mutations to the DNA'],correct:0,
    steps:['Each mutation is random, but over millions of years the count grows at a steady average rate.','Twice the time apart gives about twice the differences.','That steady slope is the clock’s rate.']}
  ]};

/* ---------- qpcr ---------- */
const qCard=(ctx,k,LH,rows)=>card(ctx,k,20,LH-10,320,rows,{up:true});
L.qpcr={
  goals:{
    bio:['How a glowing dye lets you watch PCR copy DNA','What a Ct value is, and why a low Ct means more DNA','How a PCR test tells how much virus is in a sample','Why 10 cycles earlier means about 1,000 times more'],
    honors:['Why each 10-fold dilution shifts Ct by about 3.3 cycles','How ΔΔCt compares a gene in treated and control cells'],
    ap:['How a standard curve gives efficiency from its slope','How to estimate an unknown from the standard curve']},
  matters:'Every PCR test for a virus, every wastewater report on COVID-19 or flu in Colorado, and much of modern gene research reads the same thing: the cycle where a glowing curve crosses a line.',
  startKey:'start',startRun:true,startSpeed:2,
  steps:[
    {key:'watch',title:'PCR you can watch',set:{mode:'std'},fresh:true,speed:2,focus:[12,20,328,246],
     see:'Wells of PCR, each with a dye that glows on DNA. A camera reads every well after each cycle.',
     why:'Each cycle doubles the DNA, and the dye lets you watch it live instead of checking a gel at the end.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[12,20,328,246],tau);qCard(ctx,k,LH,[[FL(sim,'cyc',0),{w:800}]]);}},
    {key:'glow',title:'Why it glows',speed:2,focus:[12,276,330,170],
     see:'The glow in one well climbs as the cycles go by.',
     why:'SYBR Green glows when it slips between DNA’s two strands. Double the DNA, double the glow: 10 cycles is about 1,000 times as much.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[12,276,330,170],tau);}},
    {key:'order',title:'More DNA rises first',speed:3,focus:[352,20,440,250],
     see:'The curves on the graph. Each well started with 10 times less DNA than the one to its left.',
     why:'More starting DNA reaches a visible amount in fewer doublings, so its curve rises first. Every curve levels off when supplies run out.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[352,20,440,250],tau);qCard(ctx,k,LH,[[FL(sim,'cthi',1),{w:700}],[FL(sim,'ctlo',1),{w:700,c:RED}]]);}},
    {key:'ct',title:'The threshold and Ct',speed:3,focus:[352,20,440,250],
     see:'The dashed line is the threshold. Read the cycle where each curve crosses it.',
     why:'That cycle is the <b>Ct</b>. Low Ct means lots of starting DNA; high Ct, very little.',
     overlay(sim,ctx,LH,k){qCard(ctx,k,LH,[[FL(sim,'ct6',1),{w:700}],[FL(sim,'ctlo',1),{w:700}]]);}},
    {key:'thr',title:'Move the line, move every Ct',set:{thr:0.3},speed:3,cause:{from:{thr:0.1},delay:1.5,dur:1.5,label:'Threshold line'},focus:[352,20,440,250],
     see:'The threshold rises from 0.1 to 0.3. Every Ct moves later.',
     why:'A higher line takes more doublings to reach, so every Ct shifts by the same amount. Compare Ct values only within one run.',
     overlay(sim,ctx,LH,k){qCard(ctx,k,LH,[[FL(sim,'ct6',1),{w:700,c:RED}]]);}},
    {key:'hook',title:'Your question: cycle 19 or cycle 29?',set:{thr:0.1},speed:3,focus:[352,20,440,250],
     see:'Two swabs: one crosses at cycle 19, the other at 29. Find wells near those cycles.',
     why:'Cycle 19 had more virus. Ten extra doublings means the cycle 29 sample started with about 2¹⁰ ≈ 1,000 times less.',
     overlay(sim,ctx,LH,k){qCard(ctx,k,LH,[[FL(sim,'ctlo',1)+' (100 copies)',{w:700}],['10 cycles later = about 1,000× less',{w:800,c:GREEN}]]);}},
    {key:'spacing',lvl:'honors',title:'10× less is 3.3 cycles later',speed:4,focus:[352,20,440,250],
     see:'Read the spacing between neighboring curves, each 10 times more dilute.',
     why:'Making up a factor of 10 takes log₂10 ≈ 3.32 doublings, so each 10-fold dilution crosses about 3.3 cycles later.',
     overlay(sim,ctx,LH,k){qCard(ctx,k,LH,[[FL(sim,'spacing',2),{w:800,c:GREEN}]]);}},
    {key:'expr',lvl:'honors',title:'Is a gene turned up?',run:tour('qpcr','Measuring gene expression'),set:{mode:'expr',fold:'4'},fresh:true,speed:7,focus:[12,276,380,170],
     see:'One gene in treated and control cells, beside a reference gene that stays constant.',
     why:'ΔCt subtracts the reference from the target; ΔΔCt compares treated with control. ΔΔCt = −2 means 2² = 4 times more mRNA.',
     overlay(sim,ctx,LH,k){qCard(ctx,k,LH,[[FL(sim,'ddct',2),{w:700}],[FL(sim,'fc',1),{w:800,c:GREEN}]]);}},
    {key:'eff',lvl:'ap',title:'Efficiency shows in the slope',set:{mode:'std',eff:80},fresh:true,speed:7,focus:[352,20,440,250],
     see:'A run at 80% efficiency. The curves spread out; read the slope.',
     why:'Less than a full doubling per cycle means more cycles per factor of 10, so the slope is steeper than −3.32. Labs accept 90–110%.',
     overlay(sim,ctx,LH,k){qCard(ctx,k,LH,[[FL(sim,'slope',2),{w:700}],[FL(sim,'effc',0),{w:800,c:RED}]]);}}
  ],
  useIt:[
    {do:'If you get a PCR test result with a Ct value, read it as “lower means more virus.”',why:'A Ct near 15–20 means a lot of virus in the swab; a Ct near 35 means very little. The number is relative to that lab’s machine and threshold.'},
    {do:'Check your county’s wastewater dashboard before a big family gathering in flu season.',why:'Colorado tests sewage for virus genes with qPCR, and rises often show up days before clinic cases do.'},
    {do:'When a news story says a gene is “turned up 4-fold,” picture a ΔΔCt of −2.',why:'Fold changes in research are usually measured exactly this way, against a reference gene and an untreated control.'}],
  tryIt:[{title:'the doubling count (5 minutes)',steps:['Start with 1 grain of rice. Double it each “cycle” on paper: 1, 2, 4, 8…','Count how many cycles it takes to pass 1,000, then 1,000,000.'],look:'About 10 doublings per factor of 1,000. Starting with 1,000 grains instead of 1 gets you to a million 10 cycles sooner, which is exactly the Ct gap in the virus question.'}]};
R.qpcr={questions:[
  {id:'lowct',kind:'test',lvl:'bio',q:'Sample A crosses the threshold at cycle 18, sample B at cycle 27. Which started with more DNA?',choices:['Sample A, with the lower Ct','Sample B, with the higher Ct','Both the same, since both crossed','Can’t tell without a gel'],correct:0,
   steps:['More starting DNA reaches the threshold in fewer doublings.','So it crosses at a lower cycle number.','Sample A had more DNA.']},
  {id:'tencyc',kind:'test',lvl:'bio',q:'Two samples cross 10 cycles apart. About how many times more DNA did the earlier one start with?',num:{ans:1000,tol:100,unit:'times'},
   steps:['Each cycle doubles the DNA.','10 cycles is 2¹⁰ = 1,024.','So about 1,000 times more.']},
  {id:'dye',kind:'test',lvl:'bio',q:'Why does the glow in a well double each cycle?',choices:['The dye makes copies of itself each cycle','The DNA doubles, and the dye glows on DNA','The camera turns its gain up each cycle','The heat each cycle makes the dye brighter'],correct:1,
   steps:['SYBR Green glows when it binds double-stranded DNA.','PCR doubles the DNA each cycle.','More DNA means more bound dye, so twice the glow.']},
  {id:'plateau',kind:'test',lvl:'bio',q:'Why does every curve level off near the top?',choices:['The DNA stops being double-stranded at the end','The well runs out of primers and nucleotides','The camera cannot read brighter than that','The dye is used up after 20 cycles'],correct:1,
   steps:['Each copy uses primers and nucleotides.','Late in the run those run short.','Copying slows, and the curve flattens.']},
  {id:'sewer',kind:'real',lvl:'bio',q:'Why can wastewater qPCR warn of a flu rise before clinics see it?',choices:['It catches virus from untested people','Sewage virus is more contagious than other virus','Wastewater labs use a lower threshold line','Clinics only report cases once a month'],correct:0,
   steps:['Infected people shed virus before or without visiting a clinic.','Sewage collects it from a whole community at once.','qPCR on sewage shows the rise early.']},
  {id:'spacing',kind:'test',lvl:'honors',q:'Each standard is 10 times more dilute than the last. About how many cycles apart are their Ct values?',num:{ans:3.3,tol:0.2,unit:'cycles'},
   steps:['10× less DNA needs log₂10 more doublings.','log₂10 ≈ 3.32.','So about 3.3 cycles apart.']},
  {id:'ddct',kind:'test',lvl:'ap',q:'A treated sample gives ΔΔCt = −3. What fold change in target mRNA is that?',num:{ans:8,tol:0,unit:'× more'},
   steps:['Fold change = 2^(−ΔΔCt).','2^(−(−3)) = 2³.','= 8 times more target mRNA.']},
  {id:'which',kind:'test',lvl:'bio',fixed:true,
    q:'<p>The graph shows three qPCR samples and the threshold (dashed). Which sample started with the most DNA?</p><svg viewBox="0 0 420 230" style="display:block;width:100%;max-width:440px;height:auto;margin:10px 0 4px;color:inherit" role="img" aria-label="qPCR amplification graph: three S-shaped curves cross a dashed threshold line, sample X first near cycle 15, then Y near cycle 21, then Z near cycle 28."><path d="M58 16V180H406" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M58.0 180v4" stroke="currentColor"/><text x="58.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">0</text><path d="M143.5 180v4" stroke="currentColor"/><text x="143.5" y="196" font-size="12" text-anchor="middle" fill="currentColor">10</text><path d="M229.0 180v4" stroke="currentColor"/><text x="229.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">20</text><path d="M314.5 180v4" stroke="currentColor"/><text x="314.5" y="196" font-size="12" text-anchor="middle" fill="currentColor">30</text><path d="M400.0 180v4" stroke="currentColor"/><text x="400.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">40</text><path d="M54 180.0h4" stroke="currentColor"/><text x="51" y="184.0" font-size="12" text-anchor="end" fill="currentColor">0</text><path d="M54 22.0h4" stroke="currentColor"/><text x="51" y="26.0" font-size="12" text-anchor="end" fill="currentColor">max</text><text x="229.0" y="216" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Cycle</text><text transform="translate(16 101.0) rotate(-90)" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Glow</text><path d="M58.0 180.0L59.7 180.0L61.4 180.0L63.1 180.0L64.8 180.0L66.5 180.0L68.3 180.0L70.0 180.0L71.7 180.0L73.4 180.0L75.1 180.0L76.8 180.0L78.5 180.0L80.2 180.0L81.9 180.0L83.7 180.0L85.4 180.0L87.1 180.0L88.8 180.0L90.5 180.0L92.2 180.0L93.9 180.0L95.6 180.0L97.3 180.0L99.0 180.0L100.8 180.0L102.5 180.0L104.2 180.0L105.9 180.0L107.6 180.0L109.3 180.0L111.0 180.0L112.7 180.0L114.4 180.0L116.1 179.9L117.8 179.9L119.6 179.9L121.3 179.9L123.0 179.9L124.7 179.9L126.4 179.9L128.1 179.9L129.8 179.8L131.5 179.8L133.2 179.8L134.9 179.7L136.7 179.7L138.4 179.7L140.1 179.6L141.8 179.5L143.5 179.5L145.2 179.4L146.9 179.3L148.6 179.2L150.3 179.1L152.1 178.9L153.8 178.8L155.5 178.6L157.2 178.4L158.9 178.1L160.6 177.9L162.3 177.5L164.0 177.2L165.7 176.7L167.4 176.2L169.2 175.7L170.9 175.0L172.6 174.3L174.3 173.5L176.0 172.5L177.7 171.4L179.4 170.2L181.1 168.8L182.8 167.2L184.5 165.4L186.2 163.4L188.0 161.2L189.7 158.7L191.4 155.9L193.1 152.8L194.8 149.5L196.5 145.8L198.2 141.8L199.9 137.5L201.6 132.9L203.3 128.1L205.1 123.0L206.8 117.7L208.5 112.2L210.2 106.6L211.9 101.0L213.6 95.4L215.3 89.8L217.0 84.3L218.7 79.0L220.4 73.9L222.2 69.1L223.9 64.5L225.6 60.2L227.3 56.2L229.0 52.5L230.7 49.2L232.4 46.1L234.1 43.3L235.8 40.8L237.6 38.6L239.3 36.6L241.0 34.8L242.7 33.2L244.4 31.8L246.1 30.6L247.8 29.5L249.5 28.5L251.2 27.7L252.9 27.0L254.6 26.3L256.4 25.8L258.1 25.3L259.8 24.8L261.5 24.5L263.2 24.1L264.9 23.9L266.6 23.6L268.3 23.4L270.0 23.2L271.8 23.1L273.5 22.9L275.2 22.8L276.9 22.7L278.6 22.6L280.3 22.5L282.0 22.5L283.7 22.4L285.4 22.3L287.1 22.3L288.9 22.3L290.6 22.2L292.3 22.2L294.0 22.2L295.7 22.1L297.4 22.1L299.1 22.1L300.8 22.1L302.5 22.1L304.2 22.1L305.9 22.1L307.7 22.1L309.4 22.0L311.1 22.0L312.8 22.0L314.5 22.0L316.2 22.0L317.9 22.0L319.6 22.0L321.3 22.0L323.1 22.0L324.8 22.0L326.5 22.0L328.2 22.0L329.9 22.0L331.6 22.0L333.3 22.0L335.0 22.0L336.7 22.0L338.4 22.0L340.1 22.0L341.9 22.0L343.6 22.0L345.3 22.0L347.0 22.0L348.7 22.0L350.4 22.0L352.1 22.0L353.8 22.0L355.5 22.0L357.2 22.0L359.0 22.0L360.7 22.0L362.4 22.0L364.1 22.0L365.8 22.0L367.5 22.0L369.2 22.0L370.9 22.0L372.6 22.0L374.4 22.0L376.1 22.0L377.8 22.0L379.5 22.0L381.2 22.0L382.9 22.0L384.6 22.0L386.3 22.0L388.0 22.0L389.7 22.0L391.4 22.0L393.2 22.0L394.9 22.0L396.6 22.0L398.3 22.0L400.0 22.0" fill="none" stroke="#2a6fdb" stroke-width="3"/><path d="M58.0 180.0L59.7 180.0L61.4 180.0L63.1 180.0L64.8 180.0L66.5 180.0L68.3 180.0L70.0 180.0L71.7 180.0L73.4 180.0L75.1 180.0L76.8 180.0L78.5 180.0L80.2 180.0L81.9 180.0L83.7 180.0L85.4 180.0L87.1 180.0L88.8 180.0L90.5 180.0L92.2 180.0L93.9 180.0L95.6 180.0L97.3 180.0L99.0 180.0L100.8 180.0L102.5 180.0L104.2 180.0L105.9 180.0L107.6 180.0L109.3 180.0L111.0 180.0L112.7 180.0L114.4 180.0L116.1 180.0L117.8 180.0L119.6 180.0L121.3 180.0L123.0 180.0L124.7 180.0L126.4 180.0L128.1 180.0L129.8 180.0L131.5 180.0L133.2 180.0L134.9 180.0L136.7 180.0L138.4 180.0L140.1 180.0L141.8 180.0L143.5 180.0L145.2 180.0L146.9 180.0L148.6 180.0L150.3 180.0L152.1 180.0L153.8 180.0L155.5 180.0L157.2 180.0L158.9 180.0L160.6 180.0L162.3 180.0L164.0 180.0L165.7 180.0L167.4 179.9L169.2 179.9L170.9 179.9L172.6 179.9L174.3 179.9L176.0 179.9L177.7 179.9L179.4 179.9L181.1 179.8L182.8 179.8L184.5 179.8L186.2 179.7L188.0 179.7L189.7 179.7L191.4 179.6L193.1 179.5L194.8 179.5L196.5 179.4L198.2 179.3L199.9 179.2L201.6 179.1L203.3 178.9L205.1 178.8L206.8 178.6L208.5 178.4L210.2 178.1L211.9 177.9L213.6 177.5L215.3 177.2L217.0 176.7L218.7 176.2L220.4 175.7L222.2 175.0L223.9 174.3L225.6 173.5L227.3 172.5L229.0 171.4L230.7 170.2L232.4 168.8L234.1 167.2L235.8 165.4L237.6 163.4L239.3 161.2L241.0 158.7L242.7 155.9L244.4 152.8L246.1 149.5L247.8 145.8L249.5 141.8L251.2 137.5L252.9 132.9L254.6 128.1L256.4 123.0L258.1 117.7L259.8 112.2L261.5 106.6L263.2 101.0L264.9 95.4L266.6 89.8L268.3 84.3L270.0 79.0L271.8 73.9L273.5 69.1L275.2 64.5L276.9 60.2L278.6 56.2L280.3 52.5L282.0 49.2L283.7 46.1L285.4 43.3L287.1 40.8L288.9 38.6L290.6 36.6L292.3 34.8L294.0 33.2L295.7 31.8L297.4 30.6L299.1 29.5L300.8 28.5L302.5 27.7L304.2 27.0L305.9 26.3L307.7 25.8L309.4 25.3L311.1 24.8L312.8 24.5L314.5 24.1L316.2 23.9L317.9 23.6L319.6 23.4L321.3 23.2L323.1 23.1L324.8 22.9L326.5 22.8L328.2 22.7L329.9 22.6L331.6 22.5L333.3 22.5L335.0 22.4L336.7 22.3L338.4 22.3L340.1 22.3L341.9 22.2L343.6 22.2L345.3 22.2L347.0 22.1L348.7 22.1L350.4 22.1L352.1 22.1L353.8 22.1L355.5 22.1L357.2 22.1L359.0 22.1L360.7 22.0L362.4 22.0L364.1 22.0L365.8 22.0L367.5 22.0L369.2 22.0L370.9 22.0L372.6 22.0L374.4 22.0L376.1 22.0L377.8 22.0L379.5 22.0L381.2 22.0L382.9 22.0L384.6 22.0L386.3 22.0L388.0 22.0L389.7 22.0L391.4 22.0L393.2 22.0L394.9 22.0L396.6 22.0L398.3 22.0L400.0 22.0" fill="none" stroke="#1b7a3a" stroke-width="3"/><path d="M58.0 180.0L59.7 180.0L61.4 180.0L63.1 180.0L64.8 180.0L66.5 180.0L68.3 180.0L70.0 180.0L71.7 180.0L73.4 180.0L75.1 180.0L76.8 180.0L78.5 180.0L80.2 180.0L81.9 180.0L83.7 180.0L85.4 180.0L87.1 180.0L88.8 180.0L90.5 180.0L92.2 180.0L93.9 180.0L95.6 180.0L97.3 180.0L99.0 180.0L100.8 180.0L102.5 180.0L104.2 180.0L105.9 180.0L107.6 180.0L109.3 180.0L111.0 180.0L112.7 180.0L114.4 180.0L116.1 180.0L117.8 180.0L119.6 180.0L121.3 180.0L123.0 180.0L124.7 180.0L126.4 180.0L128.1 180.0L129.8 180.0L131.5 180.0L133.2 180.0L134.9 180.0L136.7 180.0L138.4 180.0L140.1 180.0L141.8 180.0L143.5 180.0L145.2 180.0L146.9 180.0L148.6 180.0L150.3 180.0L152.1 180.0L153.8 180.0L155.5 180.0L157.2 180.0L158.9 180.0L160.6 180.0L162.3 180.0L164.0 180.0L165.7 180.0L167.4 180.0L169.2 180.0L170.9 180.0L172.6 180.0L174.3 180.0L176.0 180.0L177.7 180.0L179.4 180.0L181.1 180.0L182.8 180.0L184.5 180.0L186.2 180.0L188.0 180.0L189.7 180.0L191.4 180.0L193.1 180.0L194.8 180.0L196.5 180.0L198.2 180.0L199.9 180.0L201.6 180.0L203.3 180.0L205.1 180.0L206.8 180.0L208.5 180.0L210.2 180.0L211.9 180.0L213.6 180.0L215.3 180.0L217.0 180.0L218.7 180.0L220.4 180.0L222.2 180.0L223.9 180.0L225.6 180.0L227.3 179.9L229.0 179.9L230.7 179.9L232.4 179.9L234.1 179.9L235.8 179.9L237.6 179.9L239.3 179.9L241.0 179.8L242.7 179.8L244.4 179.8L246.1 179.7L247.8 179.7L249.5 179.7L251.2 179.6L252.9 179.5L254.6 179.5L256.4 179.4L258.1 179.3L259.8 179.2L261.5 179.1L263.2 178.9L264.9 178.8L266.6 178.6L268.3 178.4L270.0 178.1L271.8 177.9L273.5 177.5L275.2 177.2L276.9 176.7L278.6 176.2L280.3 175.7L282.0 175.0L283.7 174.3L285.4 173.5L287.1 172.5L288.9 171.4L290.6 170.2L292.3 168.8L294.0 167.2L295.7 165.4L297.4 163.4L299.1 161.2L300.8 158.7L302.5 155.9L304.2 152.8L305.9 149.5L307.7 145.8L309.4 141.8L311.1 137.5L312.8 132.9L314.5 128.1L316.2 123.0L317.9 117.7L319.6 112.2L321.3 106.6L323.1 101.0L324.8 95.4L326.5 89.8L328.2 84.3L329.9 79.0L331.6 73.9L333.3 69.1L335.0 64.5L336.7 60.2L338.4 56.2L340.1 52.5L341.9 49.2L343.6 46.1L345.3 43.3L347.0 40.8L348.7 38.6L350.4 36.6L352.1 34.8L353.8 33.2L355.5 31.8L357.2 30.6L359.0 29.5L360.7 28.5L362.4 27.7L364.1 27.0L365.8 26.3L367.5 25.8L369.2 25.3L370.9 24.8L372.6 24.5L374.4 24.1L376.1 23.9L377.8 23.6L379.5 23.4L381.2 23.2L382.9 23.1L384.6 22.9L386.3 22.8L388.0 22.7L389.7 22.6L391.4 22.5L393.2 22.5L394.9 22.4L396.6 22.3L398.3 22.3L400.0 22.3" fill="none" stroke="#c8102e" stroke-width="3"/><path d="M58 161.04H400" stroke="currentColor" stroke-dasharray="5 4"/><text x="271.8" y="29.9" font-size="14" font-weight="700" text-anchor="middle" fill="#2a6fdb">X</text><text x="323.1" y="29.9" font-size="14" font-weight="700" text-anchor="middle" fill="#1b7a3a">Y</text><text x="382.9" y="53.6" font-size="14" font-weight="700" text-anchor="middle" fill="#c8102e">Z</text></svg>',
    choices:['Sample X','Sample Y','Sample Z','All the same'],correct:0,
    steps:['More starting DNA reaches the threshold in fewer doublings.','X crosses first, near cycle 15.','So X had the most DNA and the lowest Ct.']},
  {id:'zfold',kind:'test',lvl:'honors',
    q:'<p>On the same graph, X crosses near cycle 15 and Z near cycle 28. About how much more DNA did X start with?</p><svg viewBox="0 0 420 230" style="display:block;width:100%;max-width:440px;height:auto;margin:10px 0 4px;color:inherit" role="img" aria-label="qPCR amplification graph: three S-shaped curves cross a dashed threshold line, sample X first near cycle 15, then Y near cycle 21, then Z near cycle 28."><path d="M58 16V180H406" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M58.0 180v4" stroke="currentColor"/><text x="58.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">0</text><path d="M143.5 180v4" stroke="currentColor"/><text x="143.5" y="196" font-size="12" text-anchor="middle" fill="currentColor">10</text><path d="M229.0 180v4" stroke="currentColor"/><text x="229.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">20</text><path d="M314.5 180v4" stroke="currentColor"/><text x="314.5" y="196" font-size="12" text-anchor="middle" fill="currentColor">30</text><path d="M400.0 180v4" stroke="currentColor"/><text x="400.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">40</text><path d="M54 180.0h4" stroke="currentColor"/><text x="51" y="184.0" font-size="12" text-anchor="end" fill="currentColor">0</text><path d="M54 22.0h4" stroke="currentColor"/><text x="51" y="26.0" font-size="12" text-anchor="end" fill="currentColor">max</text><text x="229.0" y="216" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Cycle</text><text transform="translate(16 101.0) rotate(-90)" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Glow</text><path d="M58.0 180.0L59.7 180.0L61.4 180.0L63.1 180.0L64.8 180.0L66.5 180.0L68.3 180.0L70.0 180.0L71.7 180.0L73.4 180.0L75.1 180.0L76.8 180.0L78.5 180.0L80.2 180.0L81.9 180.0L83.7 180.0L85.4 180.0L87.1 180.0L88.8 180.0L90.5 180.0L92.2 180.0L93.9 180.0L95.6 180.0L97.3 180.0L99.0 180.0L100.8 180.0L102.5 180.0L104.2 180.0L105.9 180.0L107.6 180.0L109.3 180.0L111.0 180.0L112.7 180.0L114.4 180.0L116.1 179.9L117.8 179.9L119.6 179.9L121.3 179.9L123.0 179.9L124.7 179.9L126.4 179.9L128.1 179.9L129.8 179.8L131.5 179.8L133.2 179.8L134.9 179.7L136.7 179.7L138.4 179.7L140.1 179.6L141.8 179.5L143.5 179.5L145.2 179.4L146.9 179.3L148.6 179.2L150.3 179.1L152.1 178.9L153.8 178.8L155.5 178.6L157.2 178.4L158.9 178.1L160.6 177.9L162.3 177.5L164.0 177.2L165.7 176.7L167.4 176.2L169.2 175.7L170.9 175.0L172.6 174.3L174.3 173.5L176.0 172.5L177.7 171.4L179.4 170.2L181.1 168.8L182.8 167.2L184.5 165.4L186.2 163.4L188.0 161.2L189.7 158.7L191.4 155.9L193.1 152.8L194.8 149.5L196.5 145.8L198.2 141.8L199.9 137.5L201.6 132.9L203.3 128.1L205.1 123.0L206.8 117.7L208.5 112.2L210.2 106.6L211.9 101.0L213.6 95.4L215.3 89.8L217.0 84.3L218.7 79.0L220.4 73.9L222.2 69.1L223.9 64.5L225.6 60.2L227.3 56.2L229.0 52.5L230.7 49.2L232.4 46.1L234.1 43.3L235.8 40.8L237.6 38.6L239.3 36.6L241.0 34.8L242.7 33.2L244.4 31.8L246.1 30.6L247.8 29.5L249.5 28.5L251.2 27.7L252.9 27.0L254.6 26.3L256.4 25.8L258.1 25.3L259.8 24.8L261.5 24.5L263.2 24.1L264.9 23.9L266.6 23.6L268.3 23.4L270.0 23.2L271.8 23.1L273.5 22.9L275.2 22.8L276.9 22.7L278.6 22.6L280.3 22.5L282.0 22.5L283.7 22.4L285.4 22.3L287.1 22.3L288.9 22.3L290.6 22.2L292.3 22.2L294.0 22.2L295.7 22.1L297.4 22.1L299.1 22.1L300.8 22.1L302.5 22.1L304.2 22.1L305.9 22.1L307.7 22.1L309.4 22.0L311.1 22.0L312.8 22.0L314.5 22.0L316.2 22.0L317.9 22.0L319.6 22.0L321.3 22.0L323.1 22.0L324.8 22.0L326.5 22.0L328.2 22.0L329.9 22.0L331.6 22.0L333.3 22.0L335.0 22.0L336.7 22.0L338.4 22.0L340.1 22.0L341.9 22.0L343.6 22.0L345.3 22.0L347.0 22.0L348.7 22.0L350.4 22.0L352.1 22.0L353.8 22.0L355.5 22.0L357.2 22.0L359.0 22.0L360.7 22.0L362.4 22.0L364.1 22.0L365.8 22.0L367.5 22.0L369.2 22.0L370.9 22.0L372.6 22.0L374.4 22.0L376.1 22.0L377.8 22.0L379.5 22.0L381.2 22.0L382.9 22.0L384.6 22.0L386.3 22.0L388.0 22.0L389.7 22.0L391.4 22.0L393.2 22.0L394.9 22.0L396.6 22.0L398.3 22.0L400.0 22.0" fill="none" stroke="#2a6fdb" stroke-width="3"/><path d="M58.0 180.0L59.7 180.0L61.4 180.0L63.1 180.0L64.8 180.0L66.5 180.0L68.3 180.0L70.0 180.0L71.7 180.0L73.4 180.0L75.1 180.0L76.8 180.0L78.5 180.0L80.2 180.0L81.9 180.0L83.7 180.0L85.4 180.0L87.1 180.0L88.8 180.0L90.5 180.0L92.2 180.0L93.9 180.0L95.6 180.0L97.3 180.0L99.0 180.0L100.8 180.0L102.5 180.0L104.2 180.0L105.9 180.0L107.6 180.0L109.3 180.0L111.0 180.0L112.7 180.0L114.4 180.0L116.1 180.0L117.8 180.0L119.6 180.0L121.3 180.0L123.0 180.0L124.7 180.0L126.4 180.0L128.1 180.0L129.8 180.0L131.5 180.0L133.2 180.0L134.9 180.0L136.7 180.0L138.4 180.0L140.1 180.0L141.8 180.0L143.5 180.0L145.2 180.0L146.9 180.0L148.6 180.0L150.3 180.0L152.1 180.0L153.8 180.0L155.5 180.0L157.2 180.0L158.9 180.0L160.6 180.0L162.3 180.0L164.0 180.0L165.7 180.0L167.4 179.9L169.2 179.9L170.9 179.9L172.6 179.9L174.3 179.9L176.0 179.9L177.7 179.9L179.4 179.9L181.1 179.8L182.8 179.8L184.5 179.8L186.2 179.7L188.0 179.7L189.7 179.7L191.4 179.6L193.1 179.5L194.8 179.5L196.5 179.4L198.2 179.3L199.9 179.2L201.6 179.1L203.3 178.9L205.1 178.8L206.8 178.6L208.5 178.4L210.2 178.1L211.9 177.9L213.6 177.5L215.3 177.2L217.0 176.7L218.7 176.2L220.4 175.7L222.2 175.0L223.9 174.3L225.6 173.5L227.3 172.5L229.0 171.4L230.7 170.2L232.4 168.8L234.1 167.2L235.8 165.4L237.6 163.4L239.3 161.2L241.0 158.7L242.7 155.9L244.4 152.8L246.1 149.5L247.8 145.8L249.5 141.8L251.2 137.5L252.9 132.9L254.6 128.1L256.4 123.0L258.1 117.7L259.8 112.2L261.5 106.6L263.2 101.0L264.9 95.4L266.6 89.8L268.3 84.3L270.0 79.0L271.8 73.9L273.5 69.1L275.2 64.5L276.9 60.2L278.6 56.2L280.3 52.5L282.0 49.2L283.7 46.1L285.4 43.3L287.1 40.8L288.9 38.6L290.6 36.6L292.3 34.8L294.0 33.2L295.7 31.8L297.4 30.6L299.1 29.5L300.8 28.5L302.5 27.7L304.2 27.0L305.9 26.3L307.7 25.8L309.4 25.3L311.1 24.8L312.8 24.5L314.5 24.1L316.2 23.9L317.9 23.6L319.6 23.4L321.3 23.2L323.1 23.1L324.8 22.9L326.5 22.8L328.2 22.7L329.9 22.6L331.6 22.5L333.3 22.5L335.0 22.4L336.7 22.3L338.4 22.3L340.1 22.3L341.9 22.2L343.6 22.2L345.3 22.2L347.0 22.1L348.7 22.1L350.4 22.1L352.1 22.1L353.8 22.1L355.5 22.1L357.2 22.1L359.0 22.1L360.7 22.0L362.4 22.0L364.1 22.0L365.8 22.0L367.5 22.0L369.2 22.0L370.9 22.0L372.6 22.0L374.4 22.0L376.1 22.0L377.8 22.0L379.5 22.0L381.2 22.0L382.9 22.0L384.6 22.0L386.3 22.0L388.0 22.0L389.7 22.0L391.4 22.0L393.2 22.0L394.9 22.0L396.6 22.0L398.3 22.0L400.0 22.0" fill="none" stroke="#1b7a3a" stroke-width="3"/><path d="M58.0 180.0L59.7 180.0L61.4 180.0L63.1 180.0L64.8 180.0L66.5 180.0L68.3 180.0L70.0 180.0L71.7 180.0L73.4 180.0L75.1 180.0L76.8 180.0L78.5 180.0L80.2 180.0L81.9 180.0L83.7 180.0L85.4 180.0L87.1 180.0L88.8 180.0L90.5 180.0L92.2 180.0L93.9 180.0L95.6 180.0L97.3 180.0L99.0 180.0L100.8 180.0L102.5 180.0L104.2 180.0L105.9 180.0L107.6 180.0L109.3 180.0L111.0 180.0L112.7 180.0L114.4 180.0L116.1 180.0L117.8 180.0L119.6 180.0L121.3 180.0L123.0 180.0L124.7 180.0L126.4 180.0L128.1 180.0L129.8 180.0L131.5 180.0L133.2 180.0L134.9 180.0L136.7 180.0L138.4 180.0L140.1 180.0L141.8 180.0L143.5 180.0L145.2 180.0L146.9 180.0L148.6 180.0L150.3 180.0L152.1 180.0L153.8 180.0L155.5 180.0L157.2 180.0L158.9 180.0L160.6 180.0L162.3 180.0L164.0 180.0L165.7 180.0L167.4 180.0L169.2 180.0L170.9 180.0L172.6 180.0L174.3 180.0L176.0 180.0L177.7 180.0L179.4 180.0L181.1 180.0L182.8 180.0L184.5 180.0L186.2 180.0L188.0 180.0L189.7 180.0L191.4 180.0L193.1 180.0L194.8 180.0L196.5 180.0L198.2 180.0L199.9 180.0L201.6 180.0L203.3 180.0L205.1 180.0L206.8 180.0L208.5 180.0L210.2 180.0L211.9 180.0L213.6 180.0L215.3 180.0L217.0 180.0L218.7 180.0L220.4 180.0L222.2 180.0L223.9 180.0L225.6 180.0L227.3 179.9L229.0 179.9L230.7 179.9L232.4 179.9L234.1 179.9L235.8 179.9L237.6 179.9L239.3 179.9L241.0 179.8L242.7 179.8L244.4 179.8L246.1 179.7L247.8 179.7L249.5 179.7L251.2 179.6L252.9 179.5L254.6 179.5L256.4 179.4L258.1 179.3L259.8 179.2L261.5 179.1L263.2 178.9L264.9 178.8L266.6 178.6L268.3 178.4L270.0 178.1L271.8 177.9L273.5 177.5L275.2 177.2L276.9 176.7L278.6 176.2L280.3 175.7L282.0 175.0L283.7 174.3L285.4 173.5L287.1 172.5L288.9 171.4L290.6 170.2L292.3 168.8L294.0 167.2L295.7 165.4L297.4 163.4L299.1 161.2L300.8 158.7L302.5 155.9L304.2 152.8L305.9 149.5L307.7 145.8L309.4 141.8L311.1 137.5L312.8 132.9L314.5 128.1L316.2 123.0L317.9 117.7L319.6 112.2L321.3 106.6L323.1 101.0L324.8 95.4L326.5 89.8L328.2 84.3L329.9 79.0L331.6 73.9L333.3 69.1L335.0 64.5L336.7 60.2L338.4 56.2L340.1 52.5L341.9 49.2L343.6 46.1L345.3 43.3L347.0 40.8L348.7 38.6L350.4 36.6L352.1 34.8L353.8 33.2L355.5 31.8L357.2 30.6L359.0 29.5L360.7 28.5L362.4 27.7L364.1 27.0L365.8 26.3L367.5 25.8L369.2 25.3L370.9 24.8L372.6 24.5L374.4 24.1L376.1 23.9L377.8 23.6L379.5 23.4L381.2 23.2L382.9 23.1L384.6 22.9L386.3 22.8L388.0 22.7L389.7 22.6L391.4 22.5L393.2 22.5L394.9 22.4L396.6 22.3L398.3 22.3L400.0 22.3" fill="none" stroke="#c8102e" stroke-width="3"/><path d="M58 161.04H400" stroke="currentColor" stroke-dasharray="5 4"/><text x="271.8" y="29.9" font-size="14" font-weight="700" text-anchor="middle" fill="#2a6fdb">X</text><text x="323.1" y="29.9" font-size="14" font-weight="700" text-anchor="middle" fill="#1b7a3a">Y</text><text x="382.9" y="53.6" font-size="14" font-weight="700" text-anchor="middle" fill="#c8102e">Z</text></svg>',
    choices:['About 8,000 times more','About 13 times more','About 26 times more','About 100 times more'],correct:0,
    steps:['Z needs about 13 extra doublings to catch up.','2¹³ ≈ 8,000.','So X started with about 8,000 times more DNA.']}
  ]};

/* ---------- crispr ---------- */
const crCard=(ctx,k,LH,rows)=>card(ctx,k,440,LH-10,340,rows,{up:true});
L.crispr={
  goals:{
    bio:['How a guide RNA tells Cas9 exactly where to cut','Why Cas9 needs a PAM site next to its target','Why a quick repair that drops one letter breaks a gene','How a correct copy lets the cell fix the sickle-cell letter'],
    honors:['The two repair pathways: end-joining and template repair','Why a 3-letter deletion is different from a 1-letter one'],
    ap:['How each indel changes the reading frame and the protein','Why guides are screened for off-target matches']},
  matters:'CRISPR is already a treatment: Casgevy, approved in 2023, uses Cas9 on patients’ own blood stem cells for sickle-cell disease. Knowing what Cas9 does, and what the cell does after, is how you can judge the next headline about editing genes.',
  startKey:'start',startRun:false,
  steps:[
    {key:'gene',title:'The sickle-cell letter',pause:true,focus:[18,28,764,90],
     see:'The first 60 DNA letters of HBB, the β-globin gene. Find base 20.',
     why:'Base 20 is a T where most people have an A. That one change swaps glutamate for valine, so hemoglobin clumps and red blood cells sickle.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[18,28,764,90],tau);}},
    {key:'pam',title:'Cas9 needs a parking spot',pause:true,focus:[18,28,764,90],
     see:'Yellow boxes are PAM sites: any letter followed by GG. The darker one is the chosen site.',
     why:'Cas9 only grabs DNA next to a PAM, like a parking spot: no spot, no cut.',
     overlay(sim,ctx,LH,k){crCard(ctx,k,LH,[[FL(sim,'cutat'),{w:700}]]);}},
    {key:'guide',title:'The guide RNA picks the spot',run:tour('crispr','Guide RNA'),speed:0.5,
     see:'Cas9 arrives carrying a 20-letter orange guide RNA, which pairs with the DNA.',
     why:'The guide matches the 20 letters next to the PAM, like a search term. It decides the exact spot Cas9 cuts.',
     overlay(sim,ctx,LH,k){crCard(ctx,k,LH,[['Guide: '+F(sim,'guide'),{w:700}]]);}},
    {key:'cut',title:'A clean cut through both strands',speed:0.4,
     see:'Cas9 cuts. Count back from the PAM.',
     why:'Cas9 cuts both strands three letters before the PAM. A double-strand break is an emergency, and the cell repairs it at once.',
     overlay(sim,ctx,LH,k){crCard(ctx,k,LH,[[FL(sim,'cutat'),{w:700}]]);}},
    {key:'nhej',title:'A quick repair drops a letter',set:{repair:'nhej',indel:'del1'},fresh:true,run:tour('crispr','Guide RNA'),speed:1.5,focus:[18,170,764,180],
     see:'The cell glues the ends back together, but one letter is lost. Read the protein length.',
     why:'The gene is read three letters at a time, so losing one shifts every word after it. A stop codon comes early: the gene is knocked out.',
     overlay(sim,ctx,LH,k){crCard(ctx,k,LH,[[FL(sim,'outcome'),{w:700}],[FL(sim,'plen',0),{w:800,c:RED}]]);}},
    {key:'hook',title:'Your question: how long is the protein now?',set:{repair:'nhej',indel:'del1'},fresh:true,run:tour('crispr','Guide RNA'),speed:1.5,focus:[18,170,764,180],
     see:'The same one-letter loss. Normal β-globin is 147 amino acids long.',
     why:'Only 18 amino acids: the frame shift hits a stop early. CRISPR is a cutter, not an eraser; the cell does the repair.',
     overlay(sim,ctx,LH,k){crCard(ctx,k,LH,[[FL(sim,'plen',0),{w:800,c:RED}],['Normal: 147 amino acids']]);}},
    {key:'del3',lvl:'honors',title:'Three letters lost: still in frame',set:{repair:'nhej',indel:'del3'},fresh:true,run:tour('crispr','Guide RNA'),speed:1.5,focus:[18,170,764,180],
     see:'This time the repair loses three letters. Read the protein length.',
     why:'Three letters is one codon, so the frame still reads correctly. The protein is one amino acid short and may still work.',
     overlay(sim,ctx,LH,k){crCard(ctx,k,LH,[[FL(sim,'plen',0),{w:800,c:GREEN}]]);}},
    {key:'hdr',lvl:'honors',title:'A template fixes the letter',run:tour('crispr','Repair with a template'),speed:1.5,focus:[18,170,764,180],
     see:'The cell also gets a donor template with the normal A at base 20. Watch the repair.',
     why:'The cell copies the template into the break, so T becomes A and the protein is normal. Real cells do this less often than end-joining.',
     overlay(sim,ctx,LH,k){crCard(ctx,k,LH,[[FL(sim,'aa6'),{w:800,c:GREEN}],[FL(sim,'plen',0)]]);}},
    {key:'off',lvl:'ap',title:'Off-target risk',set:{site:'s43'},fresh:true,run:tour('crispr','Guide RNA'),speed:1.5,
     see:'A different guide. Read how many other places in the genome it nearly matches.',
     why:'Cas9 can cut near-matches with one or two mismatches. Designers pick guides with the fewest and check edited cells by sequencing.',
     overlay(sim,ctx,LH,k){crCard(ctx,k,LH,[[FL(sim,'offhigh',0),{w:800,c:RED}]]);}}
  ],
  useIt:[
    {do:'When you read that a disease was “cured with CRISPR,” look for whether the gene was broken or fixed.',why:'Breaking a gene by end-joining is easy and common. Fixing a letter needs a template and works less often. Casgevy, for example, breaks a switch gene on purpose.'},
    {do:'Check the label next time you see non-browning mushrooms or apples.',why:'Some were made by knocking out a browning enzyme gene, the same end-joining knockout you watched.'},
    {do:'Ask who gives consent before you form an opinion on editing human embryos.',why:'Edits to embryos pass to future children, who cannot agree to them. Treatments like Casgevy edit only the patient’s own blood cells.'}],
  tryIt:[{title:'the frame shift sentence (2 minutes)',steps:['Write THE CAT ATE THE RAT, grouped in threes.','Delete the first letter of CAT and regroup the rest in threes.','Now delete three letters (all of CAT) instead.'],look:'One letter gone turns everything after it into nonsense. Three letters gone loses one word but leaves the rest readable. Genes are read the same way.'}]};
R.crispr={questions:[
  {id:'guide',kind:'test',lvl:'bio',q:'What decides exactly where Cas9 cuts the DNA?',choices:['The guide RNA pairing with matching DNA','The cell choosing a weak spot in the DNA','Cas9 cutting at every A it can find','The donor template marking the spot'],correct:0,
   steps:['The guide RNA is 20 letters long.','It pairs only with matching DNA next to a PAM.','Cas9 cuts where its guide pairs.']},
  {id:'pam',kind:'test',lvl:'bio',q:'Why can’t Cas9 cut just anywhere in a gene?',choices:['It needs a PAM site (like NGG) beside the target','It can only cut genes that are switched on','It only cuts at a spot that already carries a mutation','It needs the cell to be dividing at the time'],correct:0,
   steps:['Cas9 must grab a PAM before it checks the guide.','PAMs are short tags like any letter followed by GG.','No PAM nearby means no cut there.']},
  {id:'frame',kind:'test',lvl:'bio',q:'After the cut, the cell glues the ends and drops one letter. Why does that break the gene?',choices:['Every three-letter codon after it is read wrong','The gene is now much too short to be copied at all','The cell destroys any gene that has been cut','The missing letter makes the DNA fall apart'],correct:0,
   steps:['Genes are read three letters at a time.','Dropping one letter shifts every codon after it.','The new reading soon hits a stop codon, so the protein is cut short.']},
  {id:'casgevy',kind:'real',lvl:'bio',q:'Casgevy treats sickle-cell disease by editing which cells?',choices:['The patient’s own blood stem cells, outside the body','Every cell in the body, through a single shot into a vein','Egg and sperm cells, so children inherit it','Red blood cells already circulating in blood'],correct:0,
   steps:['Doctors collect the patient’s blood stem cells.','Cas9 edits them in the lab, and they are returned.','The edit is not passed to the patient’s children.']},
  {id:'hdr',kind:'test',lvl:'honors',q:'To change the sickle T back to A, what does the cell need besides the cut?',choices:['A donor template carrying the normal letter','A second guide RNA aimed at the same spot','A one-letter deletion right at the cut','Nothing, since cells always repair correctly'],correct:0,
   steps:['End-joining just glues ends and often adds or drops letters.','Template repair copies a donor DNA into the break.','A donor with the normal A fixes the letter.']},
  {id:'three',kind:'test',lvl:'honors',q:'A repair deletes 3 letters instead of 1. What happens to the protein?',choices:['It loses one amino acid but stays in frame','It is cut short at the same early stop codon','It is three amino acids longer than normal','Nothing changes, since 3 letters is too few'],correct:0,
   steps:['Three letters make exactly one codon.','Removing one codon keeps every later codon in frame.','The protein is one amino acid shorter.']},
  {id:'offt',kind:'test',lvl:'ap',q:'Why do designers check a guide for near-matches elsewhere in the genome?',choices:['Cas9 can still cut with a mismatch or two','Near-matches make the guide RNA fall apart','Near-matches turn off the PAM at the target','Cas9 only works if there are no matches at all'],correct:0,
   steps:['Cas9 tolerates a mismatch or two.','Each near-match is a possible off-target cut.','Fewer near-matches means a safer guide.']},
  {id:'pamseq',kind:'test',lvl:'honors',fixed:true,
    q:'<p>Cas9’s PAM is any letter followed by GG. Which three-letter stretch is a PAM?</p>',
    choices:['AGG','GAG','GCA','TTG'],correct:0,
    steps:['A PAM is N-G-G: any letter, then two G’s.','AGG fits.','GAG, GCA and TTG don’t end in GG.']}
  ]};

/* ---------- synthbio ---------- */
const sbCard=(ctx,k,LH,rows)=>card(ctx,k,24,LH-10,370,rows,{up:true});
L.synthbio={
  goals:{
    bio:['What standard DNA parts are: promoter, RBS, gene, terminator','How a repressor works as an off switch, and an inducer as the key','How a glowing reporter shows whether a gene is on','How the ribosome binding site works like a dimmer'],
    honors:['How two repressors wired against each other make a memory','How three repressors in a ring make a clock inside a cell'],
    ap:['How the repressilator’s period comes out of its equations','What happens when one link in the loop is broken']},
  matters:'Engineered bacteria already make most insulin, test well water for arsenic, and report pollutants by glowing. Synthetic biology treats genes like electronics, with parts you can snap together.',
  startKey:'start',startRun:true,
  steps:[
    {key:'parts',title:'Parts on a plasmid',set:{preset:'switch',iptg:false},fresh:true,speed:0.5,focus:[40,30,740,175],
     see:'One row of DNA built from standard parts: promoter, ribosome binding site, GFP gene and terminator.',
     why:'RNA polymerase starts at the promoter; the ribosome starts at the RBS; the terminator ends the message. Parts swap like building blocks.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[40,30,740,175],tau);}},
    {key:'off',title:'The repressor keeps it off',set:{preset:'switch',iptg:false},fresh:true,speed:0.5,focus:[40,105,330,85],
     see:'LacI, a repressor, sits on the promoter. RNA polymerase is stuck, and the cells stay dark.',
     why:'A repressor on the promoter blocks RNA polymerase. It is an off button.',
     overlay(sim,ctx,LH,k){sbCard(ctx,k,LH,[[FL(sim,'state'),{w:700}],[FL(sim,'gfp',0),{w:700}]]);}},
    {key:'on',title:'IPTG pulls the repressor off',set:{preset:'switch',iptg:true},fresh:true,speed:0.5,cause:{from:{iptg:false},delay:2,dur:0.5,label:'IPTG'},focus:[40,105,330,85],
     see:'IPTG is added. It grabs LacI, and RNA polymerase starts reading.',
     why:'IPTG changes LacI’s shape so it lets go. The gene is read and GFP is built. An inducer is the key.',
     overlay(sim,ctx,LH,k){sbCard(ctx,k,LH,[[FL(sim,'laci',0),{w:700}],[FL(sim,'gfp',0),{w:800,c:GREEN}]]);}},
    {key:'hook',title:'Your question: how fast, how bright?',set:{preset:'switch',iptg:true,rbs:'strong'},fresh:true,speed:1,focus:[20,220,390,220],
     see:'An arsenic biosensor works the same way. Watch GFP climb after the switch turns on, and the graph.',
     why:'GFP reaches about three quarters of full brightness in 30 minutes and levels near 206, where making balances losing.',
     overlay(sim,ctx,LH,k){sbCard(ctx,k,LH,[[FL(sim,'gfp',0),{w:800,c:GREEN}],['Full brightness with a strong RBS: about 206']]);}},
    {key:'rbs',title:'The RBS is a dimmer',set:{preset:'switch',iptg:true,rbs:'weak'},fresh:true,speed:1,cause:{from:{rbs:'strong'},delay:1,dur:0.5,label:'RBS strength'},focus:[20,220,390,220],
     see:'Same switch and IPTG, but a weak ribosome binding site in front of GFP.',
     why:'Just as much mRNA, but ribosomes start less often: about 52 GFP instead of 206. The RBS is a dimmer.',
     overlay(sim,ctx,LH,k){sbCard(ctx,k,LH,[[FL(sim,'gfp',0),{w:800,c:RED}],['Strong RBS: 206 · medium: 103 · weak: 52']]);}},
    {key:'toggle',lvl:'honors',title:'A toggle switch remembers',run:tour('synthbio','A toggle switch'),set:{preset:'toggle',iptg:false},fresh:true,speed:1,focus:[420,220,365,220],
     see:'Two repressors, each blocking the other’s gene. Watch which wins.',
     why:'The winner shuts the other down and stays. A short inducer pulse flips it for good: a genetic memory, built in 2000.',
     overlay(sim,ctx,LH,k){sbCard(ctx,k,LH,[[FL(sim,'gfp',0),{w:700,c:GREEN}],[FL(sim,'rfp',0),{w:700,c:RED}]]);}},
    {key:'rep',lvl:'honors',title:'Three in a ring: a clock',run:tour('synthbio','The repressilator'),set:{preset:'rep'},fresh:true,speed:2,focus:[420,220,365,220],
     see:'Three repressors in a ring: LacI blocks TetR, TetR blocks cI, cI blocks LacI. Watch the levels.',
     why:'Whichever is high shuts down the next, freeing the third. The levels chase each other in waves: a gene clock.',
     overlay(sim,ctx,LH,k){sbCard(ctx,k,LH,[[FL(sim,'laci',0)],[FL(sim,'tetr',0)],[FL(sim,'ci',0)]]);}},
    {key:'broken',lvl:'ap',title:'Break one link',set:{preset:'rep',broken:true},fresh:true,speed:2,cause:{from:{broken:false},delay:2,dur:0.5,label:'cI gene'},focus:[420,220,365,220],
     see:'The cI gene is deleted, breaking the ring. Watch the waves.',
     why:'Nothing represses LacI, so it stays high and the waves stop. A clock needs every link in its feedback loop.',
     overlay(sim,ctx,LH,k){sbCard(ctx,k,LH,[[FL(sim,'period',1),{w:800,c:RED}]]);}}
  ],
  useIt:[
    {do:'If your family uses a private well, get it tested; in some places that test uses engineered bacteria.',why:'Arsenic biosensors glow when arsenic pulls a repressor off a reporter gene, the same switch you watched with IPTG.'},
    {do:'Ask a family member with diabetes where their insulin is made.',why:'Since 1982, most insulin has been made by bacteria or yeast carrying the human insulin gene, switched on with parts like these.'},
    {do:'Picture “a dimmer, not a switch” when a gene is said to be “expressed less.”',why:'Like the RBS, many controls change how much protein is made per message, not whether the gene is on.'}],
  tryIt:[{title:'the human repressilator (5 minutes, 3 people)',steps:['Stand in a circle. Each person can raise a hand only when the person to their right has a hand down.','Start with one hand up and keep checking every few seconds.'],look:'Hands go up and down in a wave around the circle and never settle, like the three repressors. If one person drops out, the wave stops.'}]};
R.synthbio={questions:[
  {id:'rep',kind:'test',lvl:'bio',q:'With no IPTG, why does the GFP gene in the switch stay off?',choices:['LacI sits on the promoter and blocks RNA polymerase','The GFP gene has no promoter in front of it','GFP is made, but it only glows with IPTG','The terminator ends the message before GFP is ever reached'],correct:0,
   steps:['LacI is a repressor protein.','Bound to the promoter, it blocks RNA polymerase.','No transcription means no GFP.']},
  {id:'iptg',kind:'test',lvl:'bio',q:'What does IPTG do to turn the switch on?',choices:['Binds LacI so it lets go of the DNA','Binds RNA polymerase to make it faster','Adds a new copy of the GFP gene','Makes GFP glow brighter once it is made'],correct:0,
   steps:['IPTG binds the LacI repressor.','LacI changes shape and releases the promoter.','RNA polymerase can now read the GFP gene.']},
  {id:'rbs',kind:'test',lvl:'bio',q:'The switch is on. A weaker RBS goes in front of GFP. Why do the cells get dimmer?',choices:['Ribosomes start on each mRNA less often','The gene is now switched off by LacI','RNA polymerase can no longer bind there','GFP made this way does not fold or glow'],correct:0,
   steps:['The RBS is where ribosomes start translating.','A weak RBS means fewer ribosomes start per mRNA.','Less GFP is made, though the gene is just as on.']},
  {id:'arsenic',kind:'real',lvl:'bio',q:'An arsenic test uses bacteria with the ArsR repressor in front of GFP. What does arsenic do?',choices:['Pulls ArsR off the DNA, so the cells glow','Kills the bacteria, so the glow fades','Turns GFP from green to red','Destroys the GFP gene so it stops'],correct:0,
   steps:['ArsR represses the reporter gene.','Arsenic binds ArsR, like IPTG binds LacI.','The reporter turns on and the cells glow.']},
  {id:'toggle',kind:'test',lvl:'honors',q:'The toggle is red. A 1-hour IPTG pulse flips it to green. What happens after the IPTG is gone?',choices:['It stays green; each repressor holds the other off','It drifts back to red as the IPTG wears off','It flickers back and forth between red and green from then on','Both colors fade until the cells are dark'],correct:0,
   steps:['In green, the green side’s repressor blocks the red gene.','That repressor keeps itself in charge.','So the toggle remembers its state.']},
  {id:'ring',kind:'test',lvl:'honors',q:'Why do three repressors in a ring keep oscillating instead of settling?',choices:['Each high one shuts down the next, freeing the third','The cell runs out of one repressor every few hours, then refills','IPTG is added and removed on a timer','The proteins break down at random times'],correct:0,
   steps:['LacI blocks TetR, TetR blocks cI, cI blocks LacI.','Whichever is high shuts down the next one.','No state can last, so the levels cycle.']},
  {id:'insulin',kind:'real',lvl:'honors',q:'Why do protein labs add IPTG only after the bacteria have grown?',choices:['Making lots of protein early slows the cells’ growth','IPTG only works on cells that are dividing slowly, late in growth','The plasmid is lost if IPTG is added too early','IPTG is too costly to use for a full day'],correct:0,
   steps:['Making foreign protein costs the cells energy.','Early on, that slows growth.','Grow first, then switch the gene on with IPTG.']}
]};

/* ---------- epidemic ---------- */
const epCard=(ctx,k,LH,rows)=>card(ctx,k,532,LH-12,262,rows,{up:true});
L.epidemic={
  goals:{
    bio:['What R₀ means: how many people one sick person infects','Why an outbreak grows when each case infects more than one','How vaccination makes a chain of infection die out','Why measles needs a much higher vaccination rate than flu'],
    honors:['How R₀ = contacts × chance per meeting × days contagious','How distancing and masks lower R without a vaccine','Why flattening the curve protects hospitals'],
    ap:['How the SIR model works, and what a latent period (SEIR) changes','Why small outbreaks can fizzle by chance in a village']},
  matters:'School vaccine rules, flu shots, masks in a crowded hospital and the question “can we have the party?” all come down to one number: how many people each sick person infects.',
  startKey:'start',startRun:false,
  steps:[
    {key:'town',title:'The town',run:tour('epidemic','The town'),speed:0.3,focus:[12,38,510,402],
     see:'A town of 10,000; each dot is 50 people. Blue can catch it. The red dot is 10 sick travelers.',
     why:'Everyone starts susceptible. Whether it takes off depends on how many each sick person infects.',
     overlay(sim,ctx,LH,k){epCard(ctx,k,LH,[[FL(sim,'sick',0),{w:700}]]);}},
    {key:'spread',title:'Passing it on',speed:0.4,focus:[12,38,510,402],
     see:'Each red line is an infection passed on at school, work or the store.',
     why:'Each sick person meets others daily. One case makes a few, and each of those makes a few more.',
     overlay(sim,ctx,LH,k){epCard(ctx,k,LH,[[FL(sim,'sick',0),{w:700,c:RED}],[FL(sim,'ever',1)]]);}},
    {key:'r0',title:'R₀: how many each case infects',pause:true,focus:[532,40,262,128],
     see:'Read R₀ in the panel.',
     why:'R₀ = contacts per day × chance per contact × days contagious: 10 × 4% × 7 ≈ 2.8. Above 1, each generation of cases grows.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[532,40,262,128],tau);}},
    {key:'full',title:'No one immune: it sweeps through',speed:1.2,focus:[532,176,262,110],
     see:'Let it run. Watch the immune bar and the dashed line.',
     why:'Recovered people are immune, so cases find fewer targets. Past the herd immunity threshold (64%), it shrinks, after most of the town was sick.',
     overlay(sim,ctx,LH,k){epCard(ctx,k,LH,[[FL(sim,'peak',0),{w:700}],[FL(sim,'ever',1),{w:700,c:RED}]]);}},
    {key:'vax',title:'Vaccinate 70% first',set:{vax:70},fresh:true,speed:1,focus:[[12,38,510,402],[532,176,262,110]],
     see:'Restart with 70% vaccinated before the travelers return.',
     why:'Each case now infects fewer than one, and the chain dies after a few dozen cases instead of 9,000: <b>herd immunity</b>.',
     overlay(sim,ctx,LH,k){epCard(ctx,k,LH,[[FL(sim,'hit',0),{w:700}],[FL(sim,'ever',1),{w:800,c:GREEN}]]);}},
    {key:'hook',title:'Your question: is 90% enough for measles?',set:{disease:'measles',vax:90},fresh:true,speed:1.5,focus:[[12,38,510,402],[532,176,262,110]],
     see:'Measles reaches the town at 90% vaccinated. Read the threshold and count the cases.',
     why:'Not enough. Measles (R₀ ≈ 15) needs about 93% immune. At 90%, about 600 catch it; at 95%, it fizzles.',
      so: 'That is why schools aim for 95% with two MMR doses.',
     overlay(sim,ctx,LH,k){epCard(ctx,k,LH,[[FL(sim,'r0',1),{w:700}],[FL(sim,'hit',0),{w:700}],[FL(sim,'ever',1),{w:800,c:RED}]]);}},
    {key:'flatten',lvl:'honors',title:'Flatten the curve',set:{dist:50},fresh:true,speed:1.5,focus:[532,40,262,128],
     see:'No vaccine, but everyone halves their contacts. Watch R and the peak.',
     why:'R drops from 2.8 to 1.4. The peak falls from about 2,800 sick at once to a few hundred, keeping hospital beds open.',
     overlay(sim,ctx,LH,k){epCard(ctx,k,LH,[[FL(sim,'reff',2),{w:700}],[FL(sim,'peak',0),{w:800,c:GREEN}]]);}},
    {key:'seir',lvl:'ap',title:'A latent period',run:tour('epidemic','Latent period'),set:{latent:true},fresh:true,speed:1.5,focus:[12,38,510,402],
     see:'New infections now spend 5 days exposed (amber) before they can spread.',
     why:'Generations stretch out, so it grows slower and peaks later. R₀ and the final share infected stay about the same.',
     overlay(sim,ctx,LH,k){epCard(ctx,k,LH,[[FL(sim,'pday',0),{w:700}],[FL(sim,'ever',1)]]);}}
  ],
  useIt:[
    {do:'Check that your MMR and other shots are up to date before a trip abroad or college.',why:'Measles still spreads where fewer than about 93% of people are immune, and travelers bring it home.'},
    {do:'Stay home on the days you’re contagious, even if you feel only a little sick.',why:'Cutting days contagious is one of the three factors in R₀. Fewer days out means fewer people infected.'},
    {do:'Get a flu shot each fall.',why:'Flu’s R₀ is near 1.3, so even modest vaccination rates push R below 1 and cut spread sharply, protecting people who can’t be vaccinated.'}],
  tryIt:[{title:'the handshake chain (5 minutes, a group)',steps:['One person is “sick.” Every 30 seconds, each sick person shakes hands with two others, who become sick.','Try again with half the group “vaccinated” (they can’t catch it).'],look:'With no one immune the whole group is sick in a few rounds. With half immune, many handshakes hit a vaccinated person and the chain slows or stops.'}]};
R.epidemic={questions:[
  {id:'r0',kind:'test',lvl:'bio',q:'A disease has R₀ = 3. What does that mean?',choices:['Each case infects about 3 people when none are immune','About 3% of the whole town will have caught it by the end','People are contagious for 3 days','Each person meets 3 others per day'],correct:0,
   steps:['R₀ counts new infections per case.','It assumes nobody is immune yet.','R₀ = 3 means each case leads to about 3 more.']},
  {id:'grow',kind:'test',lvl:'bio',q:'When does an outbreak shrink?',choices:['When each case infects fewer than one other','When the first sick person recovers','When half the town has been sick','When R₀ is anything below 10'],correct:0,
   steps:['If each case infects fewer than one, each generation is smaller.','The chain dies out.','That happens when enough people are immune.']},
  {id:'calc',kind:'test',lvl:'honors',q:'People meet 10 others a day, the chance of passing it on per meeting is 4%, and they are contagious for 7 days. What is R₀?',num:{ans:2.8,tol:0.05,unit:''},
   steps:['R₀ = contacts × chance × days.','10 × 0.04 × 7.','= 2.8.']},
  {id:'measles',kind:'test',lvl:'bio',q:'Why does measles need about 93% immune while flu needs about 25%?',choices:['Measles is far more contagious (higher R₀)','Measles vaccines work only about 25% of the time','Flu lasts longer, so it needs fewer immune','Measles only spreads among unvaccinated adults'],correct:0,
   steps:['The more contagious a disease, the higher R₀.','The threshold is about 1 − 1/R₀.','Measles R₀ ≈ 15 gives 93%; flu R₀ ≈ 1.3 gives about 25%.']},
  {id:'flatten',kind:'real',lvl:'honors',q:'Why does cutting contacts in half matter even if most people still get sick eventually?',choices:['Fewer are sick at once, so hospitals aren’t overwhelmed','It makes the disease less severe for each person who catches it','It removes the need for any vaccine at all','It makes people contagious for fewer days'],correct:0,
   steps:['Halving contacts halves R.','The outbreak spreads more slowly.','The peak drops, keeping beds open for those who need them.']},
  {id:'shorter',kind:'test',lvl:'honors',q:'A treatment cuts days contagious from 7 to 3. Contacts and chance stay the same. What happens to R₀?',num:{ans:1.2,tol:0.05,unit:''},
   steps:['R₀ = 10 × 0.04 × days.','With 3 days: 10 × 0.04 × 3.','= 1.2, much closer to 1.']},
  {id:'chance',kind:'test',lvl:'ap',q:'Flu (R₀ ≈ 1.3) reaches 50 villages, one sick traveler each. Why does it fizzle in most?',choices:['By chance, early cases often infect no one','Villages always have more immune people','Small towns have lower contact rates','The flu virus mutates and dies out'],correct:0,
   steps:['With few cases, chance dominates.','A first case may infect zero people by luck.','The chain ends before it can grow, in most villages.']},
  {id:'threshold',kind:'test',lvl:'honors',
    q:'<p>A disease has R₀ = 4. What share of people must be immune to stop it from spreading?</p>',
    choices:['75%','25%','40%','96%'],correct:0,
    steps:['The threshold is 1 − 1/R₀.','1 − 1/4 = 0.75.','With 75% immune, each case infects fewer than one other on average.']}
  ]};

/* ---------- antibiotic ---------- */
const abCard=(ctx,k,LH,rows,x)=>card(ctx,k,x!=null?x:440,LH-12,340,rows,{up:true});
L.antibiotic={
  goals:{
    bio:['Why bacteria can’t choose to become resistant','How random mutations plus an antibiotic select resistant survivors','Why stopping a course early can bring an infection back resistant','How resistance builds step by step'],
    honors:['Why a jump straight to a high dose can block resistance','Why resistance often costs bacteria growth when the drug is gone'],
    ap:['How low doses below the lethal level still select for resistance','How mutation supply and fitness cost shape the speed of evolution']},
  matters:'Antibiotic resistance kills more than a million people a year worldwide. Finishing a prescription, not sharing leftover pills, and not asking for antibiotics for a cold are everyday choices that slow it down.',
  startKey:'start',startRun:false,
  steps:[
    {key:'plate',title:'A giant dish',run:sim=>{sim._abP1=sim._abP2=sim._abP3=0;const f=TS('antibiotic','The MEGA-plate');if(f)f(sim);},pause:true,focus:[20,48,760,334],
     see:'A dish about 120 cm long, full of food for E. coli. The middle bands hold 1×, 10×, 100× and 1000× the lethal dose.',
     why:'Bacteria start at both drug-free edges. This models a real 2016 Harvard experiment built to make evolution visible.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[20,48,760,334],tau);}},
    {key:'spread',title:'They fill the safe edge',speed:0.5,focus:[20,78,90,300],run(sim){BioLab.play&&BioLab.play(sim);},
     see:'Watch the edges. Each colored square holds millions of bacteria.',
     why:'They divide and spread into empty squares, like mold across bread. With no drug, the edges fill fast.',
     overlay(sim,ctx,LH,k){if(M(sim,'col')>=18&&!sim._abP1){sim._abP1=1;BioLab.pause(sim);}abCard(ctx,k,LH,[[FL(sim,'col',0),{w:700}]]);}},
    {key:'stall',title:'Stuck at the first band',speed:0.6,focus:[94,78,104,300],run(sim){BioLab.play&&BioLab.play(sim);},
     see:'Watch the front where the 1× band starts.',
     why:'Normal bacteria die at 1×, so the front stalls. Every division at the border is another small chance of a helpful <b>mutation</b>.',
     overlay(sim,ctx,LH,k,tau){if(tau>5&&!sim._abP2){sim._abP2=1;BioLab.pause(sim);}ring(ctx,k,[94,78,104,300],tau);abCard(ctx,k,LH,[[FL(sim,'maxr'),{w:700}]]);}},
    {key:'mutant',title:'A mutant breaks through',speed:1,focus:[20,78,342,300],run(sim){BioLab.play&&BioLab.play(sim);},
     see:'A new color pushes into the 1× band.',
     why:'One cell got a mutation to survive 1×. The drug didn’t cause it; it killed everything without it. Then the front stalls again at 10×.',
     overlay(sim,ctx,LH,k){if(/10×/.test(String(M(sim,'maxr')))&&!sim._abP3){sim._abP3=1;BioLab.pause(sim);}abCard(ctx,k,LH,[[FL(sim,'maxr'),{w:700,c:RED}],[FL(sim,'resm',0)]]);}},
    {key:'climb',title:'Step by step to 1000×',speed:3,focus:[20,48,760,334],run(sim){BioLab.play&&BioLab.play(sim);},
     see:'Let it run. Count the new colors.',
     why:'Each band takes another mutation built on the last. In about 10 days they survive 1000×. Mutation plus selection, again and again, is evolution.',
     overlay(sim,ctx,LH,k){abCard(ctx,k,LH,[[FL(sim,'maxr'),{w:800,c:RED}],[FL(sim,'col',0)]]);}},
    {key:'jump',lvl:'honors',title:'Jump straight to 1000×',set:{mode:'mega',steps:'jump'},fresh:true,speed:3,cause:{from:{steps:'steps'},delay:1,dur:0.5,label:'Antibiotic bands'},focus:[20,48,760,334],
     see:'This dish jumps straight from no drug to 1000×.',
     why:'No single mutation survives 1000×, so with no stepping stones the bacteria stay stuck. That is one reason doctors give full, strong doses.',
     overlay(sim,ctx,LH,k){abCard(ctx,k,LH,[[FL(sim,'maxr'),{w:800,c:GREEN}]]);}},
    {key:'hook',title:'Your question: stop on day 3?',set:{mode:'patient',treat:'early'},fresh:true,speed:2,focus:[20,20,440,420],
     see:'A patient feels better and stops on day 3. Sensitive bacteria are blue, resistant red. Watch to day 10.',
     why:'The infection returns. The survivors were mostly resistant and regrow to about 8 billion, 97% resistant, so the drug barely works.',
     overlay(sim,ctx,LH,k){abCard(ctx,k,LH,[[FL(sim,'pn',0),{w:700}],[FL(sim,'pres',0),{w:800,c:RED}],[FL(sim,'pfeel')]],468);}},
    {key:'full',title:'The full course',set:{mode:'patient',treat:'full'},fresh:true,speed:2,cause:{from:{treat:'early'},delay:1,dur:0.5,label:'Treatment'},focus:[20,20,440,420],
     see:'Same patient, but they finish the 10-day course.',
     why:'The doses keep killing survivors, even partly resistant ones. The last bacteria are gone by day 10.',
     overlay(sim,ctx,LH,k){abCard(ctx,k,LH,[[FL(sim,'pn',0),{w:800,c:GREEN}],[FL(sim,'pfeel')]],468);}},
    {key:'cost',lvl:'honors',title:'Resistance has a cost',run:tour('antibiotic','The cost of resistance'),set:{mode:'flask',cost:10,fdrug:0},fresh:true,speed:2,focus:[20,40,760,380],
     see:'A flask with no drug: resistant and sensitive bacteria mixed 50:50, moved to fresh food each day.',
     why:'Resistance slows growth a little, so with no drug the resistant bacteria are outgrown. Using fewer antibiotics lets resistance fade.',
     overlay(sim,ctx,LH,k){abCard(ctx,k,LH,[[FL(sim,'fres',0),{w:800,c:GREEN}],[FL(sim,'fday',0)]]);}},
    {key:'low',lvl:'ap',title:'A low dose still selects',set:{mode:'flask',cost:5,fdrug:0.3},fresh:true,speed:2,cause:{from:{fdrug:0},delay:1,dur:1,label:'Antibiotic in the flask'},focus:[20,40,760,380],
     see:'The flask gets 30% of the lethal dose: too little to kill sensitive cells.',
     why:'Even so, it slows sensitive cells more than the 5% cost slows resistant ones, so resistance rises. Low doses in feed or rivers select for it.',
     overlay(sim,ctx,LH,k){abCard(ctx,k,LH,[[FL(sim,'fres',0),{w:800,c:RED}],[FL(sim,'fadv',1)]]);}}
  ],
  useIt:[
    {do:'Take every dose of a prescribed antibiotic for as long as the label says, even when you feel better.',why:'Feeling better means the count has crashed, not that it is zero. The survivors are the toughest ones.'},
    {do:'Don’t ask for antibiotics for a cold or the flu, and never take someone else’s leftover pills.',why:'Antibiotics don’t touch viruses. Taking them anyway only selects for resistant bacteria in your body.'},
    {do:'Cover cuts and don’t share towels in a locker room.',why:'MRSA, a staph resistant to common antibiotics, spreads on shared towels and gear. It is hard to treat once it infects a wound.'}],
  tryIt:[{title:'the bean filter (10 minutes)',steps:['Mix 95 white beans and 5 red beans in a cup. Red beans are “resistant.”','Remove 90% of the white beans (the antibiotic). Then double everything left (the regrowth).','Repeat twice and count each color.'],look:'Red beans quickly become most of the cup, even though no white bean ever turned red. Selection changes the mix; it doesn’t create the resistance.'}]};
R.antibiotic={questions:[
  {id:'cause',kind:'test',lvl:'bio',q:'Does an antibiotic make bacteria resistant?',choices:['No, it kills the others, leaving resistant survivors','Yes, bacteria change their DNA to fight back','Yes, the drug damages their DNA into a resistant form','No, resistant bacteria come only from other patients'],correct:0,
   steps:['Mutations happen at random as bacteria divide.','The antibiotic kills those without resistance.','Survivors that happen to be resistant multiply.']},
  {id:'steps',kind:'test',lvl:'bio',q:'On the MEGA-plate, how do bacteria end up surviving 1000×?',choices:['One mutation at a time, stalling at each band','All at once, with one lucky mutation','By using up the antibiotic in each band','By waiting until the drug breaks down'],correct:0,
   steps:['Each band needs a further resistance mutation.','The front stalls until one appears.','Mutations stack, band by band, up to 1000×.']},
  {id:'stop',kind:'test',lvl:'bio',q:'Why can stopping a course early make an infection come back resistant?',choices:['The survivors are mostly resistant, and they regrow','Stopping makes the bacteria mutate faster','The drug left over in the body slowly turns them resistant','The immune system stops working after day 3'],correct:0,
   steps:['Early doses kill the sensitive bacteria.','The survivors are mostly resistant ones.','With no more doses, they regrow and the drug no longer works.']},
  {id:'jump',kind:'test',lvl:'honors',q:'A dish jumps straight from no drug to 1000×. Why do the bacteria stay stuck?',choices:['No single mutation gives enough resistance','The 1000× drug makes them stop dividing','Bacteria can’t sense the drug from far away','The high dose makes mutations impossible'],correct:0,
   steps:['Resistance builds in small steps.','A mutant that survives 1× still dies at 1000×.','With no middle bands, there’s no foothold.']},
  {id:'cost',kind:'test',lvl:'honors',q:'With no antibiotic, resistant and sensitive bacteria start 50:50. Resistance costs 10% growth. What happens?',choices:['Sensitive bacteria slowly take over','Resistant bacteria take over anyway','They stay 50:50 since no drug is present','Both die out with no drug to fight'],correct:0,
   steps:['Without the drug, resistance gives no benefit.','It still slows growth by 10%.','Sensitive bacteria outgrow them each day.']},
  {id:'farm',kind:'real',lvl:'honors',q:'Why did the US end feeding low doses of medical antibiotics to healthy livestock for growth?',choices:['Low doses select for resistant bacteria','Low doses made the meat unsafe to eat','The animals grew too large too quickly','The drugs cost more than the extra meat'],correct:0,
   steps:['Low doses don’t clear bacteria; they favor resistant ones.','Resistant bacteria can spread to people.','The FDA ended growth use of medically important antibiotics in 2017.']},
  {id:'low',kind:'test',lvl:'ap',q:'A flask gets 30% of the lethal dose, and resistance costs 5%. Why does the resistant share rise?',choices:['Sensitive cells are slowed more than the 5% cost','The low dose directly causes brand-new resistance mutations','Sensitive cells die at any dose','Resistance has no cost at low doses'],correct:0,
   steps:['A sublethal dose still slows sensitive growth.','If that slowdown exceeds the 5% cost, resistant cells grow faster.','So selection favors resistance without killing anything.']}
]};

/* ---------- transpiration ---------- */
const tpCard=(ctx,k,LH,rows)=>card(ctx,k,16,LH-12,300,rows,{up:true});
L.transpiration={
  goals:{
    bio:['What transpiration is, and how to measure it on a balance','How stomata open in light and close in the dark','Why humid air slows water loss and wind speeds it up','How this shows up in watering lawns and caring for plants'],
    honors:['Why warm, dry air pulls more water (vapor pressure deficit)','How the boundary layer works, and why wind thins it','Why a thirsty plant closes its stomata, and what that costs'],
    ap:['Cohesion-tension: water potential from soil to leaf to air','Why doubling stomatal density doesn’t double water loss']},
  matters:'In Colorado, much of the water a city uses goes onto lawns and plants, and almost all of it leaves through leaves. Knowing what drives transpiration tells you when and how to water, and why windbreaks help farms.',
  startKey:'start',startRun:true,
  steps:[
    {key:'balance',title:'A plant on a balance',set:{light:'room',wind:0,rh:25},fresh:true,speed:0.3,focus:[150,150,230,250],
     see:'A pansy on a balance, its pot sealed in foil. Watch the mass.',
     why:'With the soil sealed, any lost mass is water vapor leaving the leaves: <b>transpiration</b>.',
     overlay(sim,ctx,LH,k){tpCard(ctx,k,LH,[[FL(sim,'rate',2),{w:800}],[FL(sim,'lost',2)]]);}},
    {key:'pores',title:'Tiny pores',set:{view:'surface'},fresh:true,speed:0.3,focus:[484,12,308,426],
     see:'Zoom in on a leaf’s underside: guard cells and the pores between them.',
     why:'Each pore is a <b>stoma</b>. In light, guard cells open it to let CO₂ in, and water vapor escapes the same way.',
     overlay(sim,ctx,LH,k){tpCard(ctx,k,LH,[[FL(sim,'open',0),{w:800,c:GREEN}]]);}},
    {key:'dark',title:'Lights off',set:{view:'surface',light:'dark'},fresh:true,speed:1,cause:{from:{light:'room'},delay:1.5,dur:0.5,label:'Light'},focus:[[484,12,308,426],[150,150,230,250]],
     see:'The lights go off. Watch the pores, then the water loss rate.',
     why:'No light, no photosynthesis, so guard cells close most pores. Water loss drops a lot, but not to zero.',
     overlay(sim,ctx,LH,k){tpCard(ctx,k,LH,[[FL(sim,'open',0),{w:700}],[FL(sim,'rate',2),{w:800,c:GREEN}]]);}},
    {key:'humid',title:'Humid air',set:{rh:85},fresh:true,speed:1,cause:{from:{rh:25},delay:1.5,dur:1.5,label:'Relative humidity'},focus:[0,0,476,394],
     see:'Lights on, and the air turns very humid, like a bathroom after a shower.',
     why:'Vapor leaves only toward drier air. Damp air means a small difference, so little water leaves.',
     overlay(sim,ctx,LH,k){tpCard(ctx,k,LH,[[FL(sim,'rate',2),{w:800,c:GREEN}]]);}},
    {key:'wind',title:'A fan',set:{wind:3},fresh:true,speed:1,cause:{from:{wind:0},delay:1.5,dur:1.5,label:'Wind'},focus:[0,140,476,260],
     see:'Dry air again, and a fan blows at 3 m/s. Watch the halo around the leaves and the rate.',
     why:'Still air near a leaf fills with vapor. Wind sweeps it away, like laundry on a windy day, so water leaves faster.',
     overlay(sim,ctx,LH,k){tpCard(ctx,k,LH,[[FL(sim,'rate',2),{w:800,c:RED}],[FL(sim,'bl',2)]]);}},
    {key:'hook',title:'Your question: fan or no fan, lights or no lights?',set:{light:'room',wind:0,rh:25,temp:21},fresh:true,speed:1,focus:[150,150,230,250],
     see:'The classroom pansy: 21 °C, 25% humidity, still air, lights on. Read the rate, then the fan comes on.',
     why:'Still air: about 0.39 g per hour. The fan nearly doubles it, to 0.7 g. Lights off closes stomata: about 0.11 g per hour.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,6,'fan',s=>BioLab.setValues(s,{wind:3}));tpCard(ctx,k,LH,[[FL(sim,'rate',2),{w:800,c:sim.p.wind>0?RED:GREEN}],[sim.p.wind>0?'Fan on: 3 m/s':'Still air']]);},
     run(sim){atReset(sim);}},
    {key:'warm',lvl:'honors',title:'Warm, dry air pulls harder',set:{temp:30},fresh:true,speed:1,cause:{from:{temp:21},delay:1.5,dur:1.5,label:'Air temperature'},focus:[0,0,476,394],
     see:'The room warms from 21 °C to 30 °C at the same 25% humidity. Watch the vapor pressure deficit and the rate.',
     why:'Warm air can hold much more vapor, so it is “thirstier.” The vapor pressure deficit rises, and so does transpiration.',
     overlay(sim,ctx,LH,k){tpCard(ctx,k,LH,[[FL(sim,'vpd',2),{w:700}],[FL(sim,'rate',2),{w:800,c:RED}]]);}},
    {key:'dry',lvl:'honors',title:'Dry soil: stomata close',run:tour('transpiration','Dry soil'),set:{soil0:30,wind:3},fresh:true,speed:1,focus:[484,12,308,426],
     see:'Only 30% of the soil water is left, with the fan on. Watch the stomata.',
     why:'Short of water, guard cells close the pores. The plant saves water but takes in less CO₂, so it makes less sugar.',
     overlay(sim,ctx,LH,k){tpCard(ctx,k,LH,[[FL(sim,'open',0),{w:800,c:RED}],[FL(sim,'soil',0)]]);}},
    {key:'pull',lvl:'ap',title:'Cohesion-tension',run:tour('transpiration','Cohesion-tension'),pause:true,focus:[0,30,476,320],
     see:'Read the water potential in the soil, the leaf and the air.',
     why:'Water moves from higher to lower water potential: soil, leaf, then very dry air (about −190 MPa). Evaporation pulls a continuous water column up the xylem.',
     overlay(sim,ctx,LH,k){tpCard(ctx,k,LH,[[FL(sim,'psiS',2)],[FL(sim,'psiL',2)],[FL(sim,'psiA',0),{w:800}]]);}}
  ],
  useIt:[
    {do:'Water a lawn or garden early in the morning, not in the windy afternoon.',why:'Calm, cool mornings mean less evaporation and transpiration while the water soaks in. Denver Water’s advice is built on how fast plants lose water.'},
    {do:'Cover a new cutting or seedling with a clear cup or bag.',why:'Humid air around the leaves slows water loss, so the cutting survives until it grows roots.'},
    {do:'Keep houseplants away from heater vents and fans in winter.',why:'Warm, moving, dry air strips water from the leaves faster than the roots can replace it.'}],
  tryIt:[{title:'the bag test (2 hours)',steps:['Tie a clear plastic bag over a leafy branch of a houseplant or tree in the sun.','Tie a second bag over a branch in the shade.','Check both after two hours.'],look:'Drops of water collect inside the bags, more in the sun. That water came out through the stomata.'}]};

/* ---------- whogetscare ---------- */
const wgCard=(ctx,k,LH,rows)=>card(ctx,k,80,44,300,rows);
L.whogetscare={
  goals:{
    bio:['How to compare a group’s share of those chosen with its share of everyone','How ranking by cost can miss people who are just as sick','What a proxy is, and how it can stand in badly for what you care about','How the same check applies to apps, credit and grades'],
    honors:['What a training label is in a ranking model','Why a proxy and the real need come apart when there’s an access gap'],
    ap:['How to spot a biased proxy: different illness at the same score']},
  matters:'Programs, apps and schools rank people all the time. A simple part-÷-whole check, comparing who gets picked with who is in the pool, catches one of the most common ways a fair-looking rule leaves people out.',
  startKey:'start',startRun:false,
  steps:[
    {key:'pop',title:'3,000 patients',run:tour('whogetscare','3,000 patients'),pause:true,
     see:'Each dot is a made-up patient. Across: chronic conditions. Up: last year’s care cost. Blue is group A, amber group B.',
     why:'Both groups are equally sick, with the same spread of conditions. Keep that in mind when the program chooses.',
     overlay(sim,ctx,LH,k){wgCard(ctx,k,LH,[[FL(sim,'popB',1),{w:700}]]);}},
    {key:'gap',title:'The access gap',pause:true,
     see:'Compare amber and blue dots that have the same number of conditions.',
     why:'Group B gets 30% less spent for the same illness, for example because clinics are farther. So their dots sit lower on cost.',
     overlay(sim,ctx,LH,k){wgCard(ctx,k,LH,[['Same illness, 30% less spent on group B',{w:700,c:RED}]]);}},
    {key:'turn',title:'Your turn: what would a fair share be?',run:tour('whogetscare','Your turn'),pause:true,
     see:'The program flags the top 3%: 90 patients. Group B is 762 of 3,000. Work out its fair share of the 90 and click it at the bottom.',
     why:'762 ÷ 3,000 = 25.4%, and 0.254 × 90 = 22.9. Compare against that.',
     overlay(sim,ctx,LH,k){wgCard(ctx,k,LH,[['Group B: 762 of 3,000 patients',{w:700}],['Flagged: 90 patients',{w:700}]]);}},
    {key:'cost',title:'Ranked by cost',run:tour('whogetscare','Ranked by cost'),pause:true,
     see:'The program ranks by last year’s cost. Count the amber dots above the cutoff.',
     why:'Only 6 of 90 (6.7%) are group B, against 25.4% of patients. Less was spent on them, so cost made them look healthier.',
     overlay(sim,ctx,LH,k){wgCard(ctx,k,LH,[[FL(sim,'nFlagB',0),{w:700,c:RED}],[FL(sim,'flagB',1)]]);}},
    {key:'hook',title:'Your question: does the choice change who gets the letter?',run:tour('whogetscare','Ranked by illness'),pause:true,
     see:'Rank by chronic conditions instead. Count the amber dots above the cutoff.',
     why:'24 of 90 (26.7%), close to the fair 22.9. Changing what the program ranks by gives 18 more of the sickest group B patients help.',
     overlay(sim,ctx,LH,k){wgCard(ctx,k,LH,[[FL(sim,'nFlagB',0),{w:800,c:GREEN}],[FL(sim,'flagB',1)]]);}},
    {key:'real',title:'This happened',run:tour('whogetscare','This happened'),pause:true,
     see:'The same pattern, from a real hospital algorithm.',
     why:'In 2019, Obermeyer and colleagues found an algorithm using cost for need. Ranking by health would raise Black patients flagged from 17.7% to 46.5%. It was fixed.',
     overlay(sim,ctx,LH,k){wgCard(ctx,k,LH,[['17.7% → 46.5% when the label was fixed',{w:800,c:GREEN}]]);}},
    {key:'nogap',lvl:'honors',title:'No gap, no problem',set:{label:'cost',gap:0},fresh:true,run:sim=>{sim.st.revealed=true;},pause:true,cause:{from:{gap:30},delay:1,dur:1.5,label:'Access gap'},
     see:'Set the access gap to 0% and rank by cost again.',
     why:'With equal spending for equal illness, cost tracks need, and group B’s share returns to normal. A proxy is biased only when it drifts from what you care about.',
     overlay(sim,ctx,LH,k){wgCard(ctx,k,LH,[[FL(sim,'flagB',1),{w:800,c:GREEN}]]);}},
    {key:'sicker',lvl:'ap',title:'Sicker at the same score',run:tour('whogetscare','Sicker at the same score'),pause:true,
     see:'Ranking by cost. Compare patients just below the cutoff in each group.',
     why:'At the same cost, group B carries about 1.1 more chronic conditions. Different need at the same score is the sign of a biased proxy.',
     overlay(sim,ctx,LH,k){wgCard(ctx,k,LH,[[FL(sim,'band',2),{w:800,c:RED}]]);}}
  ],
  useIt:[
    {do:'When a club, team or program picks people, compare each group’s share of those picked with its share of those who applied.',why:'That one part-÷-whole check is the first step researchers used to find the hospital algorithm’s problem.'},
    {do:'Ask what a score actually measures before you trust it.',why:'A credit score measures your borrowing record, not your honesty; a feed ranks by clicks, not by what you value. A proxy can drift from what matters.'},
    {do:'If a relative is offered a care program, it’s fair to ask how patients were chosen.',why:'Programs have limited spots, and the ranking rule decides who gets them.'}],
  tryIt:[{title:'the share check (10 minutes)',steps:['Pick a list you can see: the starters on a team, an honor roll, or the top songs on a chart.','Count one group’s share of the whole pool, then its share of those picked.'],look:'If the two shares are far apart, ask what the picking rule measures. Sometimes there is a good reason; sometimes the rule measures something other than what it claims.'}]};
BioLab.addLearn(L);
Object.keys(R).forEach(id=>{const d=DEF(id);if(d&&d.review&&d.review.questions&&d.review.questions.length)delete R[id];});
BioLab.addReview(R);
})();
