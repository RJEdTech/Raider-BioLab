(function(){
'use strict';
const {clamp,randn,rr,txt,pill,atLeast,PAL,RM,axes,bars,legend,serColor}=BioLab.h;

/* Field: 800 × 450 logical px = 10 m × 5.6 m, so 80 px = 1 m. A hula hoop is 0.75 m across (r = 30 px, 0.44 m²). */
const PXM=80,HR=30,HOOP_A=Math.PI*0.375*0.375;
const SP=[
  {n:'Grass',c:'#3f8f3a'},{n:'White clover',c:'#e8efe0'},{n:'Dandelion',c:'#f2c200'},{n:'Plantain',c:'#245c32'},
  {n:'Yarrow',c:'#f6f2e4'},{n:'Purple aster',c:'#8a5cc7'},{n:'Milkweed',c:'#d77ba6'},{n:'Goldenrod',c:'#e39a12'}];
/* density per m², clumping (0 = random, higher = tighter clumps) */
const HAB={
  lawn:{l:'Mowed lawn',ground:'#86b86c',d:[50,5,3,1.5,0,0,0,0],cl:[0,1,0.5,0.5,0,0,0,0],beetles:60},
  lawnEven:{l:'Unmowed lawn',ground:'#8fb46a',d:[12,11,10,9,0,0,0,0],cl:[0,0.8,0.5,0.6,0,0,0,0],beetles:100},
  meadow:{l:'Meadow',ground:'#9fb86c',d:[12,6,4,4,5,5,3,5],cl:[0,1,0.6,0.6,1,1,2,1.6],beetles:160},
  disturbed:{l:'Disturbed lot',ground:'#b9a986',d:[3,1.5,7,9,0,0,0,0.5],cl:[1.5,1.5,1.2,1.2,0,0,0,2],beetles:90}};
const TRAPS=[[130,110],[330,110],[530,110],[700,120],[110,330],[300,340],[500,330],[690,340]];

function genField(hab){const h=HAB[hab],plants=[],area=10*5.625;
  h.d.forEach((dens,si)=>{const n=Math.round(dens*area);if(!n)return;const cl=h.cl[si];
    if(!cl){for(let i=0;i<n;i++)plants.push({x:6+Math.random()*788,y:6+Math.random()*438,s:si});return;}
    const nc=Math.max(2,Math.round(n/(18*cl))),centers=Array.from({length:nc},()=>[40+Math.random()*720,40+Math.random()*370]),sd=PXM*0.55/cl;
    for(let i=0;i<n;i++){const c=centers[Math.floor(Math.random()*nc)];plants.push({x:clamp(c[0]+randn()*sd,4,796),y:clamp(c[1]+randn()*sd,4,446),s:si});}});
  return plants;}
function simpson(counts){const N=counts.reduce((a,b)=>a+b,0);if(N<2)return NaN;return 1-counts.reduce((a,n)=>a+n*(n-1),0)/(N*(N-1));}
function rich(counts){return counts.filter(n=>n>0).length;}
function pooled(s){const c=new Array(8).fill(0);for(const h of s.hoops)h.counts.forEach((n,i)=>c[i]+=n);return c;}
function trueCounts(s){const c=new Array(8).fill(0);for(const p of s.plants)c[p.s]++;return c;}
function addHoop(sim,x,y){const s=sim.st;x=clamp(x,HR+2,800-HR-2);y=clamp(y,HR+2,450-HR-2);const counts=new Array(8).fill(0);
  for(const p of s.plants){const dx=p.x-x,dy=p.y-y;if(dx*dx+dy*dy<=HR*HR)counts[p.s]++;}
  s.hoops.push({x,y,counts,a:0});const pc=pooled(s);s.hist.push({n:s.hoops.length,r:rich(pc),d:simpson(pc)});sim.infoDirty=true;}
function throwN(sim,n){for(let i=0;i<n;i++)addHoop(sim,HR+2+Math.random()*(800-2*HR-4),HR+2+Math.random()*(450-2*HR-4));}
function newField(sim,s){s.plants=genField(sim.p.habitat);s.hoops=[];s.hist=[];s.fieldImg=null;s.beetles=[];s.mr={phase:'none',M:0,C:0,R:0,flash:0};
  const N=HAB[sim.p.habitat].beetles;for(let i=0;i<N;i++)s.beetles.push({x:20+Math.random()*760,y:20+Math.random()*410,th:Math.random()*6.28,m:false,hot:0});sim.infoDirty=true;}
function catchRound(s){const caught=[];for(const b of s.beetles){for(const t of TRAPS){const dx=b.x-t[0],dy=b.y-t[1];if(dx*dx+dy*dy<60*60&&Math.random()<0.85){caught.push(b);break;}}}return caught;}
const mrMode=sim=>atLeast('ap')&&sim.p.method==='mr';
function estN(s){return s.mr.R>0?s.mr.M*s.mr.C/s.mr.R:NaN;}
function syncUI(sim){if(!sim.ui||!sim.ui.ctrls)return;const mr=mrMode(sim),hoopIds=['throw','throw10','clear'],mrIds=['mark','wait','recap'];
  const btns=[...sim.ui.ctrls.querySelectorAll('.actions button')];
  btns.forEach(b=>{const a=SIM.actions.find(x=>x.label===b.textContent);if(!a)return;const lvlOk=BioLab.h.atLeast(a.lvl||'bio');b.hidden=!lvlOk||(mr?hoopIds.includes(a.id):mrIds.includes(a.id));});
  const mrTiles=['M','C','R','Nhat','Ntrue'],hoopTiles=['hoops','rich','richT','simpS','simpT','dens','even'];
  Object.entries(sim.ui.tiles||{}).forEach(([id,t])=>{const tile=t.num.closest('.tile');const m=SIM.metrics.find(x=>x.id===id);if(!tile||!m)return;const lvlOk=BioLab.h.atLeast(m.lvl||'bio');
    tile.hidden=!lvlOk||(mr?hoopTiles.includes(id):mrTiles.includes(id));});}

const SIM={
  id:'biodiversity',hash:'biodiversity',apUnit:8,order:4,tab:'Biodiversity sampling',kind:'Virtual lab',
  card:'Throw hula hoops into a lawn, a meadow and a vacant lot, count the plants inside, and calculate Simpson’s diversity index.',
  title:'Biodiversity sampling: the hula hoop lab',
  lede:{bio:'Toss hula hoops into a field and count every plant inside. Your samples estimate how many species live there and how diverse the field is.',
        honors:'Compare fields with the same species but different abundances, and see why evenness matters as much as the number of species.',
        ap:'Calculate Simpson’s index and evenness from your samples, then estimate a beetle population with mark–recapture.'},
  scale:'Real scale: a patch of ground 10 m × 5.6 m seen from above. Each hula hoop is 0.75 m across (0.44 m²), and each mark is one plant.',
  timeless:true,animated:true,chChange:0.3,chReveal:1.6,
  controls:[
    {id:'habitat',label:'Field',type:'seg',def:'meadow',lvl:'bio',options:[{v:'lawn',l:'Mowed lawn'},{v:'lawnEven',l:'Unmowed lawn',lvl:'honors'},{v:'meadow',l:'Meadow'},{v:'disturbed',l:'Disturbed lot'}],onChange(sim){newField(sim,sim.st);}},
    {id:'method',label:'Method',type:'seg',def:'hoops',lvl:'ap',noTrial:true,options:[{v:'hoops',l:'Hoop sampling'},{v:'mr',l:'Mark–recapture'}],onChange(sim){syncUI(sim);sim.infoDirty=true;}}
  ],
  actions:[
    {id:'throw',label:'Throw a hoop',primary:true,run(sim){throwN(sim,1);}},
    {id:'throw10',label:'Throw 10 hoops',run(sim){throwN(sim,10);}},
    {id:'clear',label:'Pick up all hoops',run(sim){sim.st.hoops=[];sim.st.hist=[];}},
    {id:'mark',label:'Catch and mark beetles',lvl:'ap',primary:true,run(sim){const s=sim.st;s.beetles.forEach(b=>{b.m=false;});const c=catchRound(s);c.forEach(b=>{b.m=true;b.hot=1.5;});s.mr={phase:'marked',M:c.length,C:0,R:0,flash:1};}},
    {id:'wait',label:'Wait one day',lvl:'ap',run(sim){const s=sim.st;s.beetles.forEach(b=>{b.x=20+Math.random()*760;b.y=20+Math.random()*410;});if(s.mr.phase==='marked')s.mr.phase='mixed';}},
    {id:'recap',label:'Recapture',lvl:'ap',run(sim){const s=sim.st;if(s.mr.phase==='none'){return;}const c=catchRound(s);s.beetles.forEach(b=>{b.hot=0;});c.forEach(b=>{b.hot=1.5;});s.mr.C=c.length;s.mr.R=c.filter(b=>b.m).length;s.mr.wasMixed=s.mr.phase==='mixed';s.mr.phase='done';s.mr.flash=1;}}
  ],
  init(sim){const s={};newField(sim,s);return s;},
  step(sim,dt){const s=sim.st;for(const h of s.hoops)h.a=Math.min(1,h.a+dt*2.2);
    if(mrMode(sim)){for(const b of s.beetles){b.th+=randn()*Math.sqrt(dt)*2;b.x+=Math.cos(b.th)*28*dt;b.y+=Math.sin(b.th)*28*dt;if(b.x<10||b.x>790)b.th=Math.PI-b.th;if(b.y<10||b.y>440)b.th=-b.th;b.x=clamp(b.x,10,790);b.y=clamp(b.y,10,440);b.hot=Math.max(0,b.hot-dt*0.6);}
      s.mr.flash=Math.max(0,s.mr.flash-dt);}},
  onLevel(sim){if(!atLeast('ap')&&sim.p.method!=='hoops')sim.p.method='hoops';syncUI(sim);},
  metrics:[
    {id:'hoops',label:'Hoops thrown',unit:'',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.hoops.length},
    {id:'rich',label:'Species found in your hoops',unit:'',lvl:'bio',min:0,max:8,d:0,get:s=>rich(pooled(s.st))},
    {id:'richT',label:'Species in the whole field',unit:'',lvl:'bio',min:0,max:8,d:0,get:s=>rich(trueCounts(s.st))},
    {id:'simpS',label:'Simpson’s index from your hoops',unit:'',lvl:'bio',min:0,max:1,d:2,get:s=>simpson(pooled(s.st))},
    {id:'simpT',label:'Simpson’s index, whole field',unit:'',lvl:'bio',min:0,max:1,d:2,get:s=>simpson(trueCounts(s.st))},
    {id:'dens',label:'Estimated plants per m²',unit:'per m²',lvl:'honors',min:0,max:80,d:1,get(sim){const n=sim.st.hoops.length;return n?pooled(sim.st).reduce((a,b)=>a+b,0)/(n*HOOP_A):NaN;}},
    {id:'even',label:'Evenness (from your hoops)',unit:'',lvl:'ap',min:0,max:1,d:2,get(sim){const c=pooled(sim.st),S=rich(c);if(S<2)return NaN;return simpson(c)/(1-1/S);}},
    {id:'M',label:'Marked in first catch (M)',unit:'beetles',lvl:'ap',min:0,max:null,d:0,get:s=>s.st.mr.M},
    {id:'C',label:'Caught in second catch (C)',unit:'beetles',lvl:'ap',min:0,max:null,d:0,get:s=>s.st.mr.C},
    {id:'R',label:'Marked ones recaptured (R)',unit:'beetles',lvl:'ap',min:0,max:null,d:0,get:s=>s.st.mr.R},
    {id:'Nhat',label:'Population estimate N = M×C/R',unit:'beetles',lvl:'ap',min:0,max:null,d:0,get:s=>estN(s.st)},
    {id:'Ntrue',label:'True beetle population',unit:'beetles',lvl:'ap',min:0,max:null,d:0,get:s=>s.st.beetles.length}
  ],
  graphs:[{id:'accum',label:'Species found vs. hoops',custom:true},{id:'simp',label:'Simpson’s index vs. hoops',custom:true},{id:'abund',label:'Relative abundance: samples vs. field',lvl:'honors',custom:true}],defaultGraph:'accum',
  plot(sim,ctx,box,id){const s=sim.st,h=s.hist,n=Math.max(10,h.length);
    if(id==='abund'){const pc=pooled(s),tc=trueCounts(s),pN=pc.reduce((a,b)=>a+b,0)||1,tN=tc.reduce((a,b)=>a+b,0),present=SP.map((x,i)=>i).filter(i=>tc[i]>0||pc[i]>0);
      const ax=axes(ctx,box,{xmin:0,xmax:present.length,ymin:0,ymax:100,xcats:present.map(i=>SP[i].n.replace('White ','').replace('Purple ','')),yl:'% of plants'});
      present.forEach((si,k)=>{const x0=ax.X(k+.18),x1=ax.X(k+.5),x2=ax.X(k+.82);ctx.fillStyle=PAL['s2'];const ys=ax.Y(100*pc[si]/pN);ctx.fillRect(x0,ys,x1-x0-1,ax.Y(0)-ys);ctx.fillStyle=PAL['s4'];const yt=ax.Y(100*tc[si]/tN);ctx.fillRect(x1+1,yt,x2-x1-1,ax.Y(0)-yt);});
      legend(ctx,box.L+12,box.T+10,[{label:'your hoops',color:PAL['s2']},{label:'whole field',color:PAL['s4']}]);return;}
    const isS=id==='simp',tv=isS?simpson(trueCounts(s)):rich(trueCounts(s));
    const ax=axes(ctx,box,{xmin:0,xmax:n,ymin:0,ymax:isS?1:8.5,xl:'Hoops thrown',yl:isS?'Simpson’s index':'Species found',yd:isS?1:0});
    ctx.setLineDash([6,5]);ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(tv));ctx.lineTo(ax.X(n),ax.Y(tv));ctx.stroke();ctx.setLineDash([]);
    txt(ctx,'whole field: '+(isS?tv.toFixed(2):tv),ax.X(n)-6,ax.Y(tv)-7,{s:12,c:PAL['s4'],a:'right',w:600});
    const pts=h.map(x=>[x.n,isS?x.d:x.r]).filter(p=>Number.isFinite(p[1]));
    if(pts.length){ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();pts.forEach((p,i)=>{i?ctx.lineTo(ax.X(p[0]),ax.Y(p[1])):ctx.moveTo(ax.X(p[0]),ax.Y(p[1]));});ctx.stroke();
      pts.forEach(p=>{ctx.fillStyle=PAL['g-line'];ctx.beginPath();ctx.arc(ax.X(p[0]),ax.Y(p[1]),3.5,0,6.29);ctx.fill();});}
    else txt(ctx,'Throw some hoops to start the graph.',box.L+box.W/2,box.T+box.H/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});},
  infoPanel(sim){const s=sim.st;
    if(mrMode(sim)){const m=s.mr,N=estN(s),T=s.beetles.length;let h='<div class="p-head"><h3>Mark–recapture</h3></div>';
      h+='<p>Pitfall traps catch ground beetles. Mark each one with a dot of paint, release it, then catch again later.</p>';
      if(m.phase==='none')h+='<p><b>Step 1:</b> press <b>Catch and mark beetles</b>.</p>';
      else{h+=`<p>First catch, marked: <b>M = ${m.M}</b></p>`;
        if(m.phase==='marked')h+='<p><b>Step 2:</b> wait for the marked beetles to mix back into the population, or recapture right away and see what happens.</p>';
        if(m.phase==='mixed')h+='<p>A day has passed and the marked beetles have spread out. <b>Step 3:</b> recapture.</p>';
        if(m.phase==='done'){h+=`<p>Second catch: <b>C = ${m.C}</b>, of which marked: <b>R = ${m.R}</b></p><p>N = M × C ÷ R = ${m.M} × ${m.C} ÷ ${m.R} = <b>${Number.isFinite(N)?N.toFixed(0):'—'}</b> beetles</p><p>True population: ${T} (${Number.isFinite(N)?(N>=T?'+':'')+(100*(N-T)/T).toFixed(0)+'%':'—'})${m.wasMixed?'':'. You recaptured before the beetles mixed, so most of the beetles near the traps were already marked.'}</p>`;}}
      return h;}
    const pc=pooled(s),tc=trueCounts(s),pN=pc.reduce((a,b)=>a+b,0),tN=tc.reduce((a,b)=>a+b,0);
    let h=`<div class="p-head"><h3>Your counts</h3><span class="count">${s.hoops.length} hoop${s.hoops.length===1?'':'s'} · ${(s.hoops.length*HOOP_A).toFixed(1)} m²</span></div>`;
    h+=`<div class="tbl-wrap"><table><thead><tr><th>Species</th><th>In your hoops</th><th>% of sample</th>${atLeast('honors')?'<th>% of whole field</th>':''}${atLeast('ap')?'<th>n(n−1)</th>':''}</tr></thead><tbody>`;
    SP.forEach((sp,i)=>{if(!tc[i]&&!pc[i])return;h+=`<tr><td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${sp.c};border:1px solid var(--line);margin-right:6px"></span>${sp.n}</td><td>${pc[i]}</td><td>${pN?(100*pc[i]/pN).toFixed(0)+'%':'—'}</td>${atLeast('honors')?`<td>${(100*tc[i]/tN).toFixed(0)}%</td>`:''}${atLeast('ap')?`<td>${pc[i]*(pc[i]-1)}</td>`:''}</tr>`;});
    h+=`<tr><td><b>Total</b></td><td><b>${pN}</b></td><td></td>${atLeast('honors')?'<td></td>':''}${atLeast('ap')?`<td><b>${pc.reduce((a,n)=>a+n*(n-1),0)}</b></td>`:''}</tr></tbody></table></div>`;
    if(atLeast('ap')&&pN>1)h+=`<p style="margin-top:8px">D = 1 − Σn(n−1) ÷ N(N−1) = 1 − ${pc.reduce((a,n)=>a+n*(n-1),0)} ÷ ${pN*(pN-1)} = <b>${simpson(pc).toFixed(3)}</b></p>`;
    return h;},
  narrate(sim){const s=sim.st,hab=HAB[sim.p.habitat];
    if(mrMode(sim)){const m=s.mr;if(m.phase==='none')return 'Ground beetles roam the '+hab.l.toLowerCase()+'. You can’t count them all, so catch some in pitfall traps, mark them, and let them go.';
      if(m.phase==='marked')return '<b>'+m.M+' beetles are marked</b> and back where they were caught, right next to the traps. If you recapture now, you will mostly catch the same beetles again.';
      if(m.phase==='mixed')return 'A day later the marked beetles have <b>mixed evenly</b> through the population. Now the fraction marked in your second catch matches the fraction marked in the whole population.';
      const N=estN(s);return 'Estimate: '+m.M+' × '+m.C+' ÷ '+m.R+' = <b>'+(Number.isFinite(N)?N.toFixed(0):'—')+' beetles</b>. '+(m.wasMixed?'The idea: R ÷ C ≈ M ÷ N.':'Too low, because the marked beetles had not mixed in yet.');}
    const tc=trueCounts(s),pc=pooled(s),n=s.hoops.length;
    if(!n)return 'Toss a hoop (or click the field) to take a sample. Then count every plant of every species inside it.';
    let t='You’ve sampled '+n+' hoop'+(n>1?'s':'')+' and found <b>'+rich(pc)+' of the '+rich(tc)+' species</b> in this field. Your Simpson’s index estimate is '+(Number.isFinite(simpson(pc))?simpson(pc).toFixed(2):'—')+'.';
    if(sim.p.habitat==='lawn')t+=' <b>Grass dominates</b>, so diversity is low even with several species present.';
    else if(n<5)t+=' A few hoops can easily miss rare species. Keep sampling.';
    return t;},
  initVis(){},
  draw(sim,ctx,vdt,k,t){const s=sim.st,hab=HAB[sim.p.habitat];
    if(!s.fieldImg){const cv=document.createElement('canvas');cv.width=800;cv.height=450;const c=cv.getContext('2d');c.fillStyle=hab.ground;c.fillRect(0,0,800,450);
      if(sim.p.habitat==='disturbed'){for(let i=0;i<260;i++){c.fillStyle=Math.random()<.5?'#a69676':'#c8ba98';c.beginPath();c.arc(Math.random()*800,Math.random()*450,1+Math.random()*3,0,6.29);c.fill();}}
      for(const p of s.plants)drawPlant(c,p);s.fieldImg=cv;}
    ctx.drawImage(s.fieldImg,0,0);
    if(mrMode(sim)){ctx.fillStyle='rgba(20,30,20,.25)';ctx.fillRect(0,0,800,450);
      for(const tr of TRAPS){ctx.fillStyle='#3b2f25';ctx.beginPath();ctx.arc(tr[0],tr[1],12,0,6.29);ctx.fill();ctx.strokeStyle='#d8d0c0';ctx.lineWidth=2.5;ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.25)';ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(tr[0],tr[1],60,0,6.29);ctx.stroke();ctx.setLineDash([]);}
      for(const b of s.beetles){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.th);if(b.hot>0){ctx.fillStyle='rgba(255,210,63,'+clamp(b.hot,0,.6)+')';ctx.beginPath();ctx.arc(0,0,11,0,6.29);ctx.fill();}
        ctx.strokeStyle='#1f1a16';ctx.lineWidth=1;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*3,-3);ctx.lineTo(i*3+(RM?0:Math.sin(t*20+b.x)*1.5),-7);ctx.moveTo(i*3,3);ctx.lineTo(i*3,7);ctx.stroke();}
        ctx.fillStyle='#2a221c';ctx.beginPath();ctx.ellipse(0,0,7,4.5,0,0,6.29);ctx.fill();if(b.m){ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(-1,0,2.2,0,6.29);ctx.fill();}ctx.restore();}
      const m=s.mr;pill(ctx,m.phase==='none'?'Ground beetles: ? in this field':'Marked: '+m.M+(m.phase==='done'?' · Caught again: '+m.C+' · Marked among them: '+m.R:''),400,24,PAL['card'],PAL['cv-ink'],13*k);
      return;}
    // hoops
    s.hoops.forEach((h,i)=>{const last=i===s.hoops.length-1,a=h.a,sx=400,sy=470;const x=sx+(h.x-sx)*a,y=sy+(h.y-sy)*a-Math.sin(a*Math.PI)*120;
      ctx.strokeStyle=last?'#ff7a00':'rgba(255,122,0,.75)';ctx.lineWidth=last?5:3.5;ctx.beginPath();ctx.ellipse(x,y,HR*(0.6+0.4*a),HR*(0.6+0.4*a),0,0,6.29);ctx.stroke();
      if(a>=1&&last){const n=h.counts.reduce((p,q)=>p+q,0),sp=rich(h.counts);pill(ctx,n+' plants · '+sp+' species',clamp(h.x,90,710),h.y>80?h.y-HR-16:h.y+HR+16,PAL['card'],PAL['cv-ink'],12*k);}});
    pill(ctx,hab.l+' · 10 m × 5.6 m',clamp(110*k,110,190),22,PAL['card'],PAL['cv-ink'],12.5*k);},
  onClick(sim,x,y){if(mrMode(sim))return;addHoop(sim,x,y);},
  tour:[
    {title:'The field',text:'This is a 10 m × 5.6 m patch of meadow seen from above. Each mark is one plant: grass tufts, clover, dandelions, wildflowers. Counting them all would take days.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{habitat:'meadow',method:'hoops'});sim.st.hoops=[];sim.st.hist=[];}},
    {title:'Toss a hoop',text:'Instead, toss a hula hoop at random. Random placement matters: if you aimed for the flowers, your sample would be biased.',focus(sim){const h=sim.st.hoops[sim.st.hoops.length-1];return h?[h.x-85,h.y-HR-34,170,2*HR+48]:[0,0,800,450];},speed:0.4,setup(sim){sim.st.hoops=[];sim.st.hist=[];throwN(sim,1);}},
    {title:'Count what’s inside',text:'Count every plant of every species inside the hoop. One hoop covers 0.44 m², less than 1% of this field.',focus(sim){const h=sim.st.hoops[sim.st.hoops.length-1];return h?[h.x-85,h.y-HR-34,170,2*HR+48]:[0,0,800,450];},pause:true},
    {title:'Many samples',text:'More hoops give a better picture. Rare species, like milkweed growing in a few clumps, only show up after many samples.',focus:[0,0,800,450],speed:1,setup(sim){throwN(sim,10);}},
    {title:'Species richness',text:'<b>Richness</b> is the number of species you found. Check the graph: it climbs quickly at first, then levels off as you run out of new species to find.',focus:[0,0,800,450],pause:true},
    {title:'Simpson’s diversity index',text:'Simpson’s index is the chance that two plants picked at random are different species. Near 0 means one species dominates; near 1 means many species in similar numbers.',focus:[0,0,800,450],pause:true},
    {lvl:'honors',title:'Evenness matters',text:'The mowed lawn has 4 species, but grass makes up 84% of the plants, so its Simpson’s index is only about 0.3. Same species, very different diversity.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{habitat:'lawn'});throwN(sim,10);}},
    {lvl:'ap',title:'Mark and recapture',text:'For animals that move, catch some in pitfall traps, mark them and release them. After they mix back in, catch again. The fraction marked in the second catch estimates the fraction marked in the whole population.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{habitat:'meadow',method:'mr'});SIM.actions.find(a=>a.id==='mark').run(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{habitat:'meadow',method:'hoops'});},
  lab:{bio:'<p><b>Question:</b> Which field has the most biodiversity?</p><ol><li>In each field, throw 10 hoops and record a trial.</li><li>Compare species found and Simpson’s index for the three fields.</li><li>Throw 10 more hoops in the meadow. Did you find new species?</li></ol><p>Rank the fields from most to least diverse and explain what made the difference.</p>',
       honors:'<p><b>Question:</b> How many samples are enough?</p><ol><li>In the meadow, record a trial after 1, 3, 5, 10, 20 and 40 hoops (use Pick up all hoops between runs).</li><li>Plot hoops (x) against Simpson’s index from your hoops (y).</li><li>Repeat for the mowed and unmowed lawns.</li></ol><p>Explain why the two lawns have the same species but different Simpson’s indices.</p>',
       ap:'<p><b>Question:</b> How accurate are field estimates of diversity and population size?</p><ol><li>Calculate Simpson’s index by hand from 10 hoops, then check it in the table.</li><li>Run mark–recapture three ways: wait a day before recapturing, recapture right away, and wait again.</li><li>Find the percent error of each estimate.</li></ol><p><b>Claim–evidence–reasoning:</b> Identify the assumptions behind the Lincoln–Petersen estimate and which one your “right away” trial broke.</p>'},
  terms:[{t:'Biodiversity',d:'The variety of life in an area.'},{t:'Species richness',d:'The number of different species present.'},{t:'Sample',d:'A small, randomly chosen part of an area used to estimate the whole.'},{t:'Simpson’s diversity index',d:'1 − Σn(n−1) ÷ N(N−1): the chance that two random individuals are different species.'},
    {lvl:'honors',t:'Evenness',d:'How equal the numbers of each species are.'},{lvl:'honors',t:'Dominant species',d:'A species that makes up most of the individuals in a community.'},{lvl:'honors',t:'Quadrat',d:'A frame of known area, like a hula hoop, used for sampling.'},
    {lvl:'ap',t:'Mark–recapture',d:'Estimating population size from marked individuals: N ≈ M × C ÷ R.'},{lvl:'ap',t:'Lincoln–Petersen assumptions',d:'Marked animals mix evenly, marks aren’t lost, and no births, deaths or migration happen between catches.'}],
  about:'<p>Each field is generated plant by plant from typical densities (plants per m²). Some species grow scattered at random and others in clumps, as real ones do. A hoop counts every plant whose center falls inside its 0.375 m radius. Simpson’s index uses the sample formula 1 − Σn(n−1)/N(N−1), and evenness is Simpson’s index divided by its maximum, 1 − 1/S.</p><p>Mark–recapture uses 8 pitfall traps that each catch about 85% of the beetles within 0.75 m. “Wait one day” spreads beetles evenly across the field, an idealized version of full mixing. Simplified: no births, deaths or migration, and marks never wear off.</p>',
  challenges:[
    {lvl:'bio',instant:true,q:'Which field has the lowest Simpson’s diversity index?',choices:['Mowed lawn','Meadow','Disturbed lot'],correct:0,
     explain:'In the mowed lawn, grass makes up about 84% of all plants. Two random plants are usually both grass, so Simpson’s index is only about 0.3. The meadow, with eight species in similar numbers, is about 0.85.'},
    {lvl:'bio',q:'In the meadow you toss 1 hoop, then 10 more. What happens to the number of species you’ve found?',choices:['It goes up, getting closer to the 8 species in the field','It stays the same','It goes down'],correct:0,
     baseline:{habitat:'meadow'},baselineAction:'throw',changeAction:'throw10',changeText:'10 more hoops tossed',watch:'accum',
     explain:'One hoop covers less than 1% of the field and easily misses rare, clumped species. Each extra hoop gives another chance to find them, so the count climbs toward the true richness.'},
    {lvl:'honors',instant:true,q:'The mowed and unmowed lawns have the same 4 species. Which has the higher Simpson’s index?',choices:['Mowed lawn','Unmowed lawn','They are equal because richness is equal'],correct:1,
     explain:'In the unmowed lawn the four species are in similar numbers (high evenness), so Simpson’s index is about 0.75. In the mowed lawn grass dominates, so it’s about 0.3.'},
    {lvl:'honors',q:'You toss 10 hoops in the disturbed lot. Compared with the meadow’s 8 species, how many species will you find?',choices:['More than 8','Fewer than 8','Exactly 8'],correct:1,
     baseline:{habitat:'disturbed'},changeAction:'throw10',changeText:'10 hoops tossed',watch:'accum',
     explain:'Only a few hardy weeds (plantain, dandelion, some grass) colonize disturbed ground, so the lot has 5 species in all. Disturbance usually lowers diversity.'},
    {lvl:'ap',q:'You mark the first catch of beetles, then recapture right away, before they mix. The estimate N = M×C/R will be…',choices:['Close to the true population','Far too low','Far too high'],correct:1,
     baseline:{habitat:'meadow',method:'mr'},baselineAction:'mark',changeAction:'recap',changeText:'Recaptured right away',
     explain:'The marked beetles are still sitting next to the traps, so most of the second catch is marked. R is too large, which makes M×C/R far too small. The method assumes marked animals have mixed evenly.'},
    {lvl:'ap',instant:true,q:'You mark 40 beetles. Later you catch 50, and 10 of them are marked. Estimate the population.',choices:['200','100','2,000','20'],correct:0,
     explain:'N = M × C ÷ R = 40 × 50 ÷ 10 = 200. One in five beetles in the second catch was marked, so the 40 marked beetles are about one fifth of the population.'},
    {lvl:'ap',instant:true,q:'A sample has 6 grass, 3 clover and 1 dandelion (N = 10). What is Simpson’s index?',choices:['0.60','0.40','0.90'],correct:0,
     explain:'Σn(n−1) = 6×5 + 3×2 + 1×0 = 36, and N(N−1) = 10×9 = 90. D = 1 − 36/90 = 0.60.'}
  ],
  thumbSetup(sim){throwN(sim,6);sim.st.hoops.forEach(h=>h.a=1);},thumbFrames:2
};
function drawPlant(c,p){const sp=SP[p.s],x=p.x,y=p.y;
  switch(p.s){
    case 0:c.strokeStyle=sp.c;c.lineWidth=1.2;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y-6);c.moveTo(x,y);c.lineTo(x,y-7);c.moveTo(x,y);c.lineTo(x+3,y-6);c.stroke();break;
    case 1:c.fillStyle='#2f7a34';c.beginPath();c.arc(x,y,3.2,0,6.29);c.fill();c.fillStyle=sp.c;for(let i=0;i<3;i++){c.beginPath();c.arc(x+Math.cos(i*2.09)*2.4,y+Math.sin(i*2.09)*2.4,1.8,0,6.29);c.fill();}break;
    case 2:c.fillStyle='#2f7a34';c.beginPath();c.ellipse(x,y+1,5,2,0,0,6.29);c.fill();c.fillStyle=sp.c;c.beginPath();c.arc(x,y-1,3.2,0,6.29);c.fill();break;
    case 3:c.fillStyle=sp.c;for(let i=0;i<5;i++){c.beginPath();c.ellipse(x+Math.cos(i*1.256)*3,y+Math.sin(i*1.256)*3,3.6,1.6,i*1.256,0,6.29);c.fill();}break;
    case 4:c.fillStyle=sp.c;for(let i=0;i<6;i++){c.beginPath();c.arc(x+Math.cos(i)*2.6,y+Math.sin(i)*2.2,1.4,0,6.29);c.fill();}break;
    case 5:c.fillStyle=sp.c;for(let i=0;i<6;i++){c.beginPath();c.ellipse(x+Math.cos(i*1.047)*2.5,y+Math.sin(i*1.047)*2.5,2.2,1,i*1.047,0,6.29);c.fill();}c.fillStyle='#f2c200';c.beginPath();c.arc(x,y,1.3,0,6.29);c.fill();break;
    case 6:c.fillStyle='#3a7a3a';c.fillRect(x-.8,y-2,1.6,6);c.fillStyle=sp.c;c.beginPath();c.arc(x,y-3,3.6,0,6.29);c.fill();break;
    case 7:c.strokeStyle='#3a7a3a';c.lineWidth=1.3;c.beginPath();c.moveTo(x,y+4);c.lineTo(x,y-6);c.stroke();c.fillStyle=sp.c;for(let i=0;i<4;i++){c.beginPath();c.arc(x+(i%2?2:-2),y-6+i*2.2,1.6,0,6.29);c.fill();}break;}}
BioLab.register(SIM);
})();
