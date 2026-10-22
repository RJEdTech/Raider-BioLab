(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;

/* Deer on an island. Logistic (or exponential) growth:
   births = (r + d0)·N, deaths = (d0 + r·N/K)·N  →  dN/dt = rN(1 − N/K). */
const D0=0.2, NMAX=1e6;
function hex2rgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return [n>>16&255,n>>8&255,n&255];}
function mix(a,b,t){try{const A=hex2rgb(a),B=hex2rgb(b);return 'rgb('+A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')+')';}catch(e){return a;}}
function rates(sim){const p=sim.p,N=sim.st.N,r=p.r,K=p.K,exp=p.model==='exp';
  const births=(r+D0)*N,deaths=exp?D0*N:(D0+r*N/K)*N;return {births,deaths,dndt:births-deaths};}
function niceScale(N){if(N<=130)return 1;const steps=[2,5,10,20,50,100,200,500,1000,2000,5000,10000];for(const s of steps)if(N/s<=130)return s;return 10000;}
function deer(ctx,x,y,sc,body,alpha,buck){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.scale(sc,sc);
  ctx.strokeStyle=body;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-5,3);ctx.lineTo(-6,10);ctx.moveTo(-2,3);ctx.lineTo(-2,10);ctx.moveTo(4,3);ctx.lineTo(4,10);ctx.moveTo(6,3);ctx.lineTo(7,10);ctx.stroke();
  ctx.fillStyle=body;ctx.beginPath();ctx.ellipse(0,0,9,5,0,0,6.29);ctx.fill();
  ctx.beginPath();ctx.moveTo(6,-2);ctx.lineTo(10,-9);ctx.lineTo(13,-8);ctx.lineTo(9,0);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.ellipse(12.5,-10,3.8,2.6,0.3,0,6.29);ctx.fill();
  ctx.fillStyle='#f4efe6';ctx.beginPath();ctx.ellipse(-9,-1,2,1.6,0,0,6.29);ctx.fill();
  if(buck){ctx.strokeStyle='#5a4126';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(11,-12);ctx.lineTo(9,-17);ctx.lineTo(7,-18);ctx.moveTo(9,-16);ctx.lineTo(11,-19);ctx.moveTo(13,-12);ctx.lineTo(14,-17);ctx.stroke();}
  ctx.restore();}
const ISL={cx:345,cy:245,rx:300,ry:162};

const POP={
  id:'popgrowth',hash:'popgrowth',apUnit:8,order:1,tab:'Population growth',kind:'Simulation',
  card:'Deer on an island. Watch a J-curve take off, then see food limits bend it into an S.',
  title:'Population growth: deer on an island',
  lede:{bio:'A few deer swim to an island with no predators. Watch how fast the herd grows, and what happens when the food starts to run out.',
        honors:'Compare exponential and logistic growth. Track births and deaths, then hit the herd with a disease or give it more food and watch it respond.',
        ap:'Model dN/dt = rN(1 − N/K). Read the growth rate and doubling time, and find where on the S-curve the population adds the most deer per year.'},
  scale:'Real scale: an island of a few square kilometers. On St. Matthew Island, Alaska, 29 reindeer grew to about 6,000 in 19 years.',
  timeScale:1,dtMax:0.02,prewarm:0,sampleDt:0.1,window:40,unit:'years',timeLabel:'Time',unitD:1,chChange:3,chReveal:20,
  clock(sim){return 'Year '+sim.t.toFixed(1);},
  controls:[
    {id:'model',label:'Growth model',type:'seg',def:'logistic',lvl:'bio',options:[{v:'exp',l:'Unlimited food'},{v:'logistic',l:'Limited food'}],help:'Unlimited food gives exponential growth. Limited food gives logistic growth.'},
    {id:'r',label:'Growth rate (r)',type:'range',min:0.1,max:1,step:0.05,def:0.5,unit:' per year',lvl:'bio',help:'Births minus deaths per deer per year, when food is plentiful.'},
    {id:'K',label:'Carrying capacity (K)',type:'range',min:100,max:1000,step:50,def:500,unit:' deer',lvl:'bio',help:'How many deer the island’s food can support.'},
    {id:'N0',label:'Starting deer',type:'range',min:2,max:100,step:1,def:10,unit:'',lvl:'honors'}
  ],
  actions:[
    {id:'disease',label:'Disease outbreak (70% die)',lvl:'honors',run(sim){sim.st.N=Math.max(1,sim.st.N*0.3);sim.st.event={t:sim.t,label:'Disease'};}},
    {id:'food',label:'More food (K × 1.5)',lvl:'honors',run(sim){const K=Math.min(1000,Math.round(sim.p.K*1.5/50)*50);BioLab.setValues(sim,{K});sim.st.event={t:sim.t,label:'More food'};}}
  ],
  init(sim){return {N:sim.p.N0,event:null};},
  step(sim,dt){const s=sim.st,R=rates(sim);s.N=clamp(s.N+R.dndt*dt,0.5,NMAX);},
  metrics:[
    {id:'pop',label:'Deer on the island',unit:'deer',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.N},
    {id:'food',label:'Island’s food in use',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>s.p.model==='exp'?NaN:Math.min(150,100*s.st.N/s.p.K)},
    {id:'births',label:'Births',unit:'per year',lvl:'honors',min:0,max:null,d:0,get:s=>rates(s).births},
    {id:'deaths',label:'Deaths',unit:'per year',lvl:'honors',min:0,max:null,d:0,get:s=>rates(s).deaths},
    {id:'dndt',label:'Growth rate (dN/dt)',unit:'deer/year',lvl:'ap',min:0,max:null,d:1,get:s=>rates(s).dndt},
    {id:'dbl',label:'Doubling time now',unit:'years',lvl:'ap',min:0,max:20,d:1,get:s=>{const R=rates(s),g=R.dndt/s.st.N;return g>0.001?Math.LN2/g:NaN;}}
  ],
  graphs:[
    {id:'pop',label:'Deer over time',lines:['pop']},
    {id:'bd',label:'Births and deaths',lvl:'honors',lines:['births','deaths'],yl:'Deer per year'},
    {id:'dndt',label:'Growth rate over time',lvl:'ap',lines:['dndt']},
    {id:'phase',label:'Growth rate vs. population size',lvl:'ap',custom:true}
  ],
  defaultGraph:'pop',
  plot(sim,ctx,box,id){const p=sim.p,K=p.K,r=p.r,exp=p.model==='exp';
    const pts=sim.hist.map(h=>[h.v.pop,h.v.dndt]).filter(q=>Number.isFinite(q[0])&&Number.isFinite(q[1]));
    const xmax=exp?Math.max(100,...pts.map(q=>q[0]))*1.05:K*1.15,ymaxT=exp?r*xmax:r*K/4;
    const ymax=Math.max(ymaxT*1.15,...pts.map(q=>q[1]),1),ymin=Math.min(0,...pts.map(q=>q[1]));
    const ax=axes(ctx,box,{xmin:0,xmax,ymin,ymax,xl:'Deer on the island (N)',yl:'Growth rate dN/dt (deer/year)'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.5;ctx.beginPath();
    for(let i=0;i<=80;i++){const N=xmax*i/80,y=exp?r*N:r*N*(1-N/K);i?ctx.lineTo(ax.X(N),ax.Y(y)):ctx.moveTo(ax.X(N),ax.Y(y));}ctx.stroke();ctx.setLineDash([]);
    if(!exp){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(K/2),box.T);ctx.lineTo(ax.X(K/2),box.T+box.H);ctx.stroke();
      txt(ctx,'K/2 = '+Math.round(K/2),ax.X(K/2)+5,box.T+14,{s:12,c:PAL['muted']});}
    ctx.fillStyle=PAL['g-line'];pts.forEach((q,i)=>{if(i%2)return;ctx.beginPath();ctx.arc(ax.X(q[0]),ax.Y(q[1]),2.6,0,6.29);ctx.fill();});
    if(pts.length){const q=pts[pts.length-1];ctx.beginPath();ctx.arc(ax.X(q[0]),ax.Y(q[1]),5,0,6.29);ctx.fill();}
    ctx.restore();legend(ctx,box.L+12,box.T+10,[{label:'Your herd',color:PAL['g-line']},{label:exp?'rN':'rN(1 − N/K)',color:PAL['muted'],dash:true}]);},
  narrate(sim){const p=sim.p,N=sim.st.N,R=rates(sim),ap=atLeast('ap'),add=ap?' Right now dN/dt = '+R.dndt.toFixed(1)+' deer per year.':'';
    if(p.model==='exp'){if(N>=NMAX*0.99)return '<b>A million deer.</b> No real island could feed this many. Pure exponential growth can’t last, because resources always run out.';
      return '<b>Unlimited food:</b> every deer can raise young, so each year’s births come from an even bigger herd. The population grows faster and faster, a J-curve.'+add;}
    const f=N/p.K;
    if(f>1.05)return '<b>More deer than the island can feed.</b> Deaths outnumber births until the herd shrinks back to the carrying capacity.'+add;
    if(f>0.95)return '<b>The herd has reached carrying capacity (K = '+p.K+').</b> Births and deaths now balance, so the population levels off.'+add;
    if(f>0.3)return '<b>Food is getting scarce.</b> Fewer fawns survive and more deer starve, so growth slows as the herd approaches '+p.K+'.'+add;
    return '<b>Plenty of food per deer.</b> Almost every fawn survives, so the herd grows quickly, almost exponentially.'+add;},
  tour:[
    {title:'An island with no predators',text:'A few deer swim to an island. There are no wolves, and there is lots of grass. Each deer on screen is one real deer (until the herd gets big).',focus:[40,75,610,345],speed:0.25},
    {title:'Births add deer',text:'Every year some deer have fawns. A green + marks a birth. More deer means more births, which is why growth speeds up.',focus:[40,75,610,345],speed:0.25},
    {title:'Deaths remove deer',text:'Some deer die each year from old age or accidents. A fading red deer marks a death. The herd grows when births outnumber deaths.',focus:[40,75,610,345],speed:0.25},
    {title:'Food runs short',text:'Watch the grass turn brown. As the herd grows, there is less food per deer, so fewer fawns survive and more deer starve.',focus:[40,75,610,345],speed:1},
    {title:'Carrying capacity',text:'The gauge on the right compares the herd (red) to the carrying capacity K (dashed line), the most deer the island can feed. Growth slows and stops near K. This is the S-shaped, logistic curve.',focus:[690,40,100,385],speed:2},
    {lvl:'honors',title:'Unlimited food',text:'Now the food never runs out. Without a limit, births keep outpacing deaths by more each year. This is exponential growth, the J-curve.',focus:[40,40,750,385],speed:2,setup(sim){BioLab.setValues(sim,{model:'exp'});BioLab.reset(sim);}},
    {lvl:'ap',title:'Fastest growth at K/2',text:'With limited food, dN/dt = rN(1 − N/K). When N is small, there are few parents. When N is near K, food is short. The herd adds the most deer per year at N = K/2. Try the “Growth rate vs. population size” graph.',focus:[690,40,100,385],speed:2,setup(sim){BioLab.setValues(sim,{model:'logistic'});BioLab.reset(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{model:'logistic'});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'The deer have unlimited food. What shape will the population graph make?',choices:['A straight line going up','A J-curve that keeps getting steeper','An S-curve that levels off'],correct:1,
     baseline:{model:'exp'},change:{},changeText:'Watching the herd grow',watch:'pop',at:1,reveal:16,
     explain:{bio:'Each year’s new deer grow up and have fawns of their own, so the number added per year keeps increasing. That is exponential growth, and it makes a J-shaped curve.',
              ap:'With unlimited resources dN/dt = rN, so the growth rate is proportional to N itself and N = N₀e^(rt). The curve gets steeper forever, at least on paper.'}},
    {lvl:'bio',q:'Now the island has limited food. What happens to the herd over time?',choices:['It keeps growing faster and faster','It levels off near the number the island can feed','It crashes to zero'],correct:1,
     baseline:{model:'logistic'},change:{},changeText:'Watching the herd grow',watch:'pop',at:1,reveal:28,
     explain:{bio:'As food runs short, fewer fawns survive and more deer starve. Births and deaths balance at the carrying capacity, so the curve flattens into an S-shape.'}},
    {lvl:'honors',q:'The herd is at carrying capacity when a disease kills 70% of the deer. What happens next?',choices:['The herd stays small forever','The herd grows back toward carrying capacity','The herd grows past its old size'],correct:1,
     baseline:{model:'logistic'},changeAction:'disease',changeText:'Disease outbreak',watch:'pop',at:22,reveal:40,
     explain:{honors:'The survivors suddenly have plenty of food, so they reproduce quickly. The herd climbs back toward K, the limit set by the food supply, not by the disease.'}},
    {lvl:'honors',q:'The island’s food supply doubles (K goes from 500 to 1000). What happens?',choices:['Nothing, the herd is already stable','The herd grows to a new, higher level','The herd grows forever'],correct:1,
     baseline:{model:'logistic'},change:{K:1000},changeText:'Carrying capacity raised to 1000',watch:'pop',at:20,reveal:40,
     explain:{honors:'Carrying capacity depends on resources. With more food, more fawns survive, and the herd climbs until it levels off at the new K.'}},
    {lvl:'ap',q:'With limited food, when does the herd add the most deer per year?',choices:['When it is smallest','At about half of carrying capacity','Right at carrying capacity'],correct:1,
     baseline:{model:'logistic'},change:{},changeText:'Watching dN/dt',watch:'dndt',at:1,reveal:28,
     explain:{ap:'dN/dt = rN(1 − N/K) is a parabola in N, with its maximum at N = K/2. Small herds have few parents; herds near K are food-limited. Wildlife managers use this idea for “maximum sustainable yield.”'}},
    {lvl:'ap',q:'With unlimited food, r rises from 0.5 to 1.0 per year. What happens to the doubling time?',choices:['It doubles','It halves','It stays the same'],correct:1,
     baseline:{model:'exp'},change:{r:1},changeText:'r raised to 1.0',watch:'dbl',at:3,reveal:8,
     explain:{ap:'For exponential growth, doubling time = ln 2 ÷ r ≈ 0.69 ÷ r. Doubling r from 0.5 to 1.0 cuts the doubling time from about 1.4 years to about 0.7 years.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does the amount of food change the way a population grows?</p><ol><li>Choose Unlimited food. Press Reset and record a trial at years 2, 4, 6, 8 and 10 (pause to record).</li><li>Choose Limited food and do the same out to year 20.</li><li>Compare the two graphs.</li></ol><p>Describe the shape of each curve and explain what limits the second one.</p>',
       honors:'<p><b>Question:</b> How does carrying capacity control the final population size?</p><ol><li>Set K to 300, 500, 700 and 900. For each, run until the herd levels off, then record a trial.</li><li>Plot K (x) against deer on the island (y).</li></ol><p>Then test a disease outbreak: does the herd return to the same level? Explain why.</p>',
       ap:'<p><b>Question:</b> Where on the logistic curve is growth fastest, and does it depend on r?</p><ol><li>With K = 500, record dN/dt at several population sizes as the herd grows.</li><li>Repeat with r = 0.3 and r = 0.9.</li><li>Plot N against dN/dt for each r.</li></ol><p><b>Claim–evidence–reasoning:</b> Use the equation and your data to explain where the peak is, and why it stays at the same N when r changes.</p>'},
  terms:[{t:'Population',d:'All the individuals of one species living in an area.'},{t:'Exponential growth',d:'Growth that keeps speeding up because more individuals produce more offspring. Makes a J-curve.'},{t:'Carrying capacity (K)',d:'The largest population an environment’s resources can support.'},
    {lvl:'honors',t:'Logistic growth',d:'Growth that slows as the population nears K. Makes an S-curve.'},{lvl:'honors',t:'Limiting factor',d:'A resource or condition, such as food or space, that keeps a population from growing further.'},{lvl:'honors',t:'Density-dependent factor',d:'A factor whose effect grows as the population gets more crowded, such as starvation or disease.'},
    {lvl:'ap',t:'Intrinsic growth rate (r)',d:'Per-capita birth rate minus death rate when resources are unlimited.'},{lvl:'ap',t:'dN/dt',d:'The change in population size per unit time.'},{lvl:'ap',t:'Doubling time',d:'Time for a population to double: ln 2 ÷ (current per-capita growth rate).'}],
  about:'<p><b>Model:</b> dN/dt = rN(1 − N/K) for limited food, or dN/dt = rN for unlimited food. Births are (r + 0.2)·N per year. Deaths are 0.2·N, rising to (0.2 + r·N/K)·N when food is limited, so the difference is exactly the logistic equation.</p><p><b>Simplified:</b> growth is smooth and continuous, with no age structure, seasons or random events. Food recovers instantly, so the herd settles at K instead of overshooting and crashing, which real herds like the St. Matthew Island reindeer often do. The unlimited-food model stops at one million deer.</p>',
  initVis(sim){const r=rng(21),v=sim.vis;v.slots=[];while(v.slots.length<140){const x=ISL.cx+(r()*2-1)*ISL.rx*0.88,y=ISL.cy+(r()*2-1)*ISL.ry*0.8;
      if(((x-ISL.cx)/(ISL.rx*0.9))**2+((y-ISL.cy)/(ISL.ry*0.85))**2<1)v.slots.push({x,y,ph:r()*6.28,buck:r()<0.3,face:r()<0.5?1:-1});}
v.trees=[];for(let i=0;i<9;i++){const a=r()*6.28,d=0.55+r()*0.3;v.trees.push([ISL.cx+Math.cos(a)*ISL.rx*d,ISL.cy+Math.sin(a)*ISL.ry*d*0.9,8+r()*7]);}
    v.births=[];v.deaths=[];v.bAcc=0;v.dAcc=0;},
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis,R=Math.random,exp=p.model==='exp',N=s.N;
    ctx.fillStyle=PAL['cv-water'];ctx.fillRect(0,0,800,450);
    ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.2;ctx.globalAlpha=.5;for(let i=0;i<14;i++){const x=(i*97+t*(RM?0:6))%820-10,y=30+((i*53)%380);ctx.beginPath();ctx.arc(x,y,9,3.5,5.9);ctx.stroke();}ctx.globalAlpha=1;
    // island
    const use=exp?0:clamp(N/p.K,0,1.2);
    ctx.fillStyle='#e2cf9e';ctx.beginPath();ctx.ellipse(ISL.cx,ISL.cy,ISL.rx+14,ISL.ry+12,0,0,6.29);ctx.fill();
    ctx.fillStyle=mix('#5aa84a','#b39a55',clamp(use,0,1)*0.85);ctx.beginPath();ctx.ellipse(ISL.cx,ISL.cy,ISL.rx,ISL.ry,0,0,6.29);ctx.fill();
    for(const q of v.trees){ctx.fillStyle='#6b4a2b';ctx.fillRect(q[0]-2,q[1],4,q[2]*0.8);ctx.fillStyle=mix('#2f7a33','#7d7a3c',clamp(use,0,1)*0.5);ctx.beginPath();ctx.arc(q[0],q[1],q[2],0,6.29);ctx.fill();}
    // deer
    const per=niceScale(N),nShow=Math.min(v.slots.length,Math.round(N/per));
    const shown=v.slots.slice(0,nShow).sort((a,b)=>a.y-b.y);
    for(let i=0;i<nShow;i++){const q=shown[i],wob=RM?0:Math.sin(t*0.6+q.ph)*3;ctx.save();ctx.translate(q.x+wob,q.y);ctx.scale(q.face,1);deer(ctx,0,0,1.15,'#8a5a32',1,q.buck);ctx.restore();}
    // birth and death events, in proportion to the model's rates
    if(nShow>0&&vdt>0){const Rt=rates(sim),f=sim.def.timeScale*vdt/per;
      v.bAcc+=Math.min(14*vdt,Rt.births*f);v.dAcc+=Math.min(14*vdt,Rt.deaths*f);
      while(v.bAcc>=1){v.bAcc--;const q=v.slots[Math.floor(R()*nShow)];v.births.push({x:q.x+10,y:q.y-14,life:1.2});}
      while(v.dAcc>=1){v.dAcc--;const q=v.slots[Math.floor(R()*nShow)];v.deaths.push({x:q.x,y:q.y,life:1.2});}}
    for(const b of v.births){b.life-=vdt;b.y-=10*vdt;ctx.globalAlpha=clamp(b.life,0,1);txt(ctx,'+',b.x,b.y,{s:20*Math.min(k,1.3),w:800,c:'#2e9e44',a:'center',b:'middle'});}
    for(const d of v.deaths){d.life-=vdt;deer(ctx,d.x,d.y-6*(1.2-d.life),1.15,'#c0392b',clamp(d.life,0,1)*0.8,false);}
    ctx.globalAlpha=1;v.births=v.births.filter(b=>b.life>0);v.deaths=v.deaths.filter(d=>d.life>0);if(v.births.length>60)v.births.splice(0,v.births.length-60);if(v.deaths.length>60)v.deaths.splice(0,v.deaths.length-60);
    // header
    pill(ctx,'Year '+sim.t.toFixed(0)+'  ·  '+Math.round(N).toLocaleString()+' deer',112,26,PAL['card'],PAL['cv-ink'],13*k);
    if(per>1)txt(ctx,'Each deer shown = '+per+' deer',ISL.cx,432,{s:12.5*k,c:PAL['cv-ink'],a:'center',w:600});
    // gauge
    const gx=712,gy0=60,gy1=400,top=Math.max(exp?Math.max(N,100):p.K*1.3,N*1.05),Y=n=>gy1-(gy1-gy0)*clamp(n/top,0,1);
    ctx.fillStyle=PAL['card'];rr(ctx,gx,gy0,40,gy1-gy0,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle=PAL['s1'];rr(ctx,gx+6,Y(N),28,Math.max(2,gy1-Y(N)-4),5);ctx.fill();
    if(!exp){const ky=Y(p.K);ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(gx-6,ky);ctx.lineTo(gx+46,ky);ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'K',gx-10,ky,{s:13*k,w:700,a:'right',b:'middle'});txt(ctx,String(p.K),gx-10,ky+15*k,{s:11*k,c:PAL['cv-soft'],a:'right',b:'middle'});}
    txt(ctx,'Herd',gx+20,gy1+18,{s:12*k,w:600,a:'center'});
    if(s.event&&sim.t-s.event.t<2.5&&sim.t>=s.event.t)pill(ctx,s.event.label,ISL.cx,62,PAL['s1'],'#fff',13*k);}
};
BioLab.register(POP);
})();
