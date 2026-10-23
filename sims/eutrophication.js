(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,RM,lerp}=BioLab.h;

/* Eutrophication in a farm-country lake, time in days.
   Nutrients:  dP/dt = P_in − uptake + recycling − flushing  (phosphate, µg/L); nitrogen the same way.
   Algae:      dA/dt = μ(T)·A·min(fP,fN)·(1 − A/250) − deaths      (Liebig: the scarcer nutrient limits growth)
   Detritus:   dead algae (+ sewage organic matter) sink and are decomposed at k(T)·D
   Oxygen:     surface DO relaxes toward saturation DOsat(T); bottom DO is resupplied only by mixing with the
               surface and is used up by decomposers (BOD). Warm water and summer stratification both cut mixing.
   Fish:       die when bottom DO falls below ~3 mg/L, regrow and recolonize when it is above 4 mg/L. */
const DOSAT=T=>14.652-0.41022*T+0.007991*T*T-0.000077774*T*T*T;
const CHL=0.4,FISHK=400;
function rates(p,s){const T=p.temp,th=Math.pow(1.07,T-20),buf=p.buffer?0.4:1,run=p.runoff/100,nP=p.nut!=='N',nN=p.nut!=='P';
  const Pin=0.3+(nP?run*20*buf:0)+(p.sewage?6:0),Nin=60+(nN?run*120*buf:0)+(p.sewage?40:0);
  const fP=s.P/(s.P+6),fN=s.N/(s.N+40),lim=fP<fN?'P':'N',f=Math.min(fP,fN);
  const g=0.9*th*s.A*f*(1-s.A/250),die=0.16*s.A+0.0006*s.A*s.A,kd=0.15*Math.pow(1.08,T-20),dec=kd*s.D;
  const mix=(p.strat?0.35:1)*0.3*clamp(1-(T-8)/30,0.25,1);
  return {Pin,Nin,g,die,dec,mix,lim,bod:0.085*dec,sat:DOSAT(T)};}
function trophic(chl){return chl<2.6?'Oligotrophic (clear)':chl<20?'Mesotrophic':chl<56?'Eutrophic':'Hypereutrophic';}

const SIM={
  id:'eutrophication',hash:'eutrophication',apUnit:14,order:3,kind:'Simulation',tab:'Eutrophication and dead zones',
  card:'Wash fertilizer into a lake and follow it: algae bloom, die and rot, and the bottom water runs out of oxygen.',
  title:'Eutrophication: from fertilizer to dead zone',
  lede:{bio:'Fertilizer that washes off farm fields feeds algae in a lake. The algae boom, die and rot, and the rotting uses up the oxygen that fish need. Watch it happen step by step.',
        honors:'Find the limiting nutrient, see why the oxygen crash lags weeks behind the bloom, and test whether buffer strips and wetlands can protect the lake.',
        ap:'Track dissolved oxygen against saturation, biochemical oxygen demand (BOD) and stratification, and connect a single lake to the Gulf of Mexico dead zone.'},
  scale:{bio:'A farm-country lake about 1 km across and 10 m deep. A healthy lake has 7–10 mg of oxygen in every liter of water; most fish struggle below 2 mg/L.',
         ap:'A lake about 1 km across and 10 m deep. The Gulf of Mexico dead zone is the same process at about 15,000 km², fed by fertilizer from the whole Mississippi River basin.'},
  timeScale:3,dtMax:0.05,prewarm:120,sampleDt:0.25,window:60,unit:'days',timeLabel:'Day',clock:sim=>'Day '+Math.floor(sim.t),
  chChange:3,chReveal:35,
  controls:[
    {id:'runoff',label:'Fertilizer runoff',type:'range',min:0,max:100,step:1,def:10,unit:'%',lvl:'bio',help:'How much fertilizer washes off the farm fields when it rains'},
    {id:'temp',label:'Water temperature',type:'range',min:5,max:35,step:1,def:20,unit:' °C',lvl:'bio',help:'Warmer water holds less oxygen. Power-plant cooling water causes thermal pollution.'},
    {id:'sewage',label:'Sewage overflow',help:'Untreated sewage adds nutrients and rotting organic matter',type:'toggle',def:false,lvl:'honors'},
    {id:'buffer',label:'Buffer strips and wetlands',help:'Grass, trees and wetlands that trap runoff before it reaches the lake',type:'toggle',def:false,lvl:'honors'},
    {id:'nut',label:'Nutrients in the runoff',type:'seg',def:'both',lvl:'honors',options:[{v:'both',l:'N and P'},{v:'N',l:'Nitrogen only'},{v:'P',l:'Phosphorus only'}]},
    {id:'strat',label:'Summer stratification',help:'A warm surface layer floats on cold bottom water, and the layers stop mixing',type:'toggle',def:false,lvl:'ap'}
  ],
  actions:[{id:'storm',label:'Big rainstorm',lvl:'bio',run(sim){const p=sim.p,b=p.buffer?0.4:1,run=Math.max(p.runoff,30)/100;sim.st.P+=40*run*b*(p.nut==='N'?0.05:1);sim.st.N+=300*run*b;sim.vis.storm=2.5;}}],
  init(){return {P:2,N:300,A:20,D:20,Os:9,Ob:8,F:100,killed:0,killRate:0,r:null};},
  step(sim,dt){const p=sim.p,s=sim.st,r=rates(p,s);
    s.P=Math.max(0,s.P+dt*(r.Pin-0.9*r.g+0.54*r.dec-0.03*s.P));
    s.N=Math.max(0,s.N+dt*(r.Nin-7*r.g+4.2*r.dec-0.03*s.N));
    s.A=Math.max(0.5,s.A+dt*(r.g-r.die-0.02*s.A));
    s.D=Math.max(0,s.D+dt*(r.die+(p.sewage?8:0)-r.dec-0.03*s.D));
    s.Os=Math.max(0,s.Os+dt*(0.6*(r.sat-s.Os)+0.012*r.g-0.004*s.A-0.2*r.bod));
    s.Ob=Math.max(0,s.Ob+dt*(r.mix*(s.Os-s.Ob)-r.bod-0.002*s.F/100));
    const grow=s.Ob>4?0.03*s.F*(1-s.F/100)+0.4:0,kill=0.5*Math.pow(clamp((3-s.Ob)/3,0,1),1.5)*s.F;
    s.F=clamp(s.F+dt*(grow-kill),0,100);s.killed+=dt*kill;s.killRate=kill;s.r=r;},
  afterPrewarm(sim){sim.st.killed=0;},
  metrics:[
    {id:'chl',label:'Algae (chlorophyll a)',unit:'µg/L',lvl:'bio',min:0,max:70,d:1,get:s=>CHL*s.st.A},
    {id:'dos',label:'Surface oxygen',unit:'mg/L',lvl:'bio',min:0,max:14,d:1,get:s=>s.st.Os},
    {id:'dob',label:'Bottom oxygen',unit:'mg/L',lvl:'bio',min:0,max:14,d:1,get:s=>s.st.Ob},
    {id:'fish',label:'Fish',unit:'per hectare',lvl:'bio',min:0,max:FISHK,d:0,get:s=>FISHK*s.st.F/100},
    {id:'state',label:'Trophic state',unit:'',lvl:'honors',text:true,get:s=>trophic(CHL*s.st.A)},
    {id:'phos',label:'Dissolved phosphate',unit:'µg/L',lvl:'honors',min:0,max:60,d:1,get:s=>s.st.P},
    {id:'lim',label:'Limiting nutrient',unit:'',lvl:'honors',text:true,get:s=>(s.st.r?s.st.r.lim:'P')==='P'?'Phosphorus':'Nitrogen'},
    {id:'bod',label:'BOD (oxygen used per day)',unit:'mg/L/day',lvl:'ap',min:0,max:3,d:2,get:s=>s.st.r?s.st.r.bod:0},
    {id:'sat',label:'Oxygen saturation at this temperature',unit:'mg/L',lvl:'ap',min:0,max:14,d:1,get:s=>DOSAT(s.p.temp)}
  ],
  graphs:[{id:'do',label:'Dissolved oxygen',lvl:'bio',lines:['dos','dob'],min:0,max:14,yl:'Dissolved oxygen (mg/L)'},
          {id:'chl',label:'Algae',lvl:'bio',lines:['chl']},{id:'fish',label:'Fish',lvl:'bio',lines:['fish']},
          {id:'phos',label:'Dissolved phosphate',lvl:'honors',lines:['phos']},{id:'bod',label:'BOD',lvl:'ap',lines:['bod']}],
  defaultGraph:'do',
  narrate(sim){const s=sim.st,p=sim.p,r=s.r||rates(p,s),chl=CHL*s.A,hon=atLeast('honors');
    if(s.Ob<2&&s.F<60)return '<b>Dead zone.</b> The bottom water has under 2 mg/L of oxygen. Fish that can’t escape suffocate, and dead fish float to the surface. The rotting adds even more oxygen demand.';
    if(s.Ob<4&&r.bod>0.6)return '<b>The oxygen is running out at the bottom.</b> Dead algae pile up there, and bacteria breaking them down use oxygen faster than mixing can bring it down from the surface.';
    if(r.die*CHL>4&&s.Ob<s.Os-1.5)return '<b>Algae are dying and sinking.</b> Each dead cell becomes food for decomposers on the lake bottom. Their oxygen use is what will cause the crash, days to weeks after the bloom.';
    if(chl>20)return '<b>Algal bloom.</b> Fertilizer is feeding the algae, and the surface is turning green. The surface still has oxygen, because algae make it in daylight.';
    if(p.temp>=28)return '<b>Warm water.</b> At '+p.temp+' °C water can hold only about '+DOSAT(p.temp).toFixed(1)+' mg/L of oxygen, compared with '+DOSAT(10).toFixed(1)+' mg/L at 10 °C.';
    if(hon&&p.nut==='N'&&p.runoff>30)return 'Plenty of nitrogen is washing in, but algae barely grow. <b>Phosphorus is the limiting nutrient</b> in this lake, so extra nitrogen alone doesn’t help them.';
    return 'A healthy lake: clear water and about '+s.Ob.toFixed(1)+' mg/L of oxygen even at the bottom. Algae are kept in check by the small amount of phosphorus washing in.';},
  tour:[
    {title:'A healthy lake',text:'Clear water, a few algae, and oxygen from top to bottom (the white dots). Fish live throughout the lake.',focus:[205,150,595,295],speed:1},
    {title:'Fertilizer washes in',text:'After rain, nitrogen and phosphorus fertilizer run off the farm field and into the lake.',focus:[0,90,300,170],speed:2,setup(sim){BioLab.setValues(sim,{runoff:100});}},
    {title:'An algal bloom',text:'Algae use the nutrients to grow and multiply. The surface turns green, and sunlight can no longer reach deep water.',focus:[205,150,595,90],speed:3},
    {title:'Algae die and sink',text:'Algae live only days to weeks. Dead cells (brown flakes) sink to the bottom and pile up as muck.',focus:[300,180,330,250],speed:2},
    {title:'Decomposers use up the oxygen',text:'Bacteria on the bottom break down the dead algae, and they use oxygen as they do it. Watch the bottom-oxygen gauge fall.',focus:[[205,340,595,105],[612,6,184,142]],speed:3},
    {title:'A dead zone',text:'Below about 2 mg/L, most fish suffocate. The crash comes weeks <b>after</b> the bloom, because decomposition takes time.',focus:[205,150,595,295],speed:4},
    {lvl:'honors',title:'Protect the shoreline',text:'Buffer strips of grass and trees, plus restored wetlands, trap much of the runoff before it reaches the water. The bloom shrinks and oxygen slowly returns.',focus:[150,110,110,140],speed:4,setup(sim){BioLab.setValues(sim,{buffer:true});}},
    {lvl:'ap',title:'Scaling up: the Gulf dead zone',text:'Fertilizer from Midwest farms flows down the Mississippi. Every summer it fuels a bloom and a hypoxic dead zone off Louisiana of about 15,000 km², where the same BOD process plays out.',focus:[612,6,184,142],pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{runoff:10,buffer:false});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'A wet spring sends much more fertilizer into the lake. What happens to the oxygen at the bottom of the lake?',
     choices:['It rises right away, because algae make oxygen','It drops, but only weeks later, after the algae die and rot','Nothing happens'],correct:1,
     baseline:{runoff:10},change:{runoff:100},changeText:'Fertilizer runoff raised to 100%',watch:'do',
     explain:{bio:'The bloom comes first. The oxygen crash comes later, when the algae die, sink and are eaten by decomposers that use up oxygen. That delay is why dead zones form weeks after heavy rain.',
              honors:'Algae add oxygen at the surface, but their biomass ends up as detritus on the bottom. Decomposers’ respiration (BOD) uses bottom oxygen faster than mixing replaces it, so DO falls with a lag of 2–3 weeks.'}},
    {lvl:'bio',q:'A power plant warms the lake from 15 °C to 30 °C with its cooling water. What happens to the oxygen in the surface water?',
     choices:['It goes up','It goes down','It stays the same'],correct:1,
     baseline:{temp:15},change:{temp:30},reveal:15,changeText:'Water warmed to 30 °C',watch:'do',
     explain:'Warm water holds less dissolved gas: about 10 mg/L of oxygen at 15 °C but only about 7.5 mg/L at 30 °C. That is why thermal pollution stresses fish even without any fertilizer.'},
    {lvl:'honors',q:'Heavy runoff has caused a bloom. The town plants buffer strips and restores the wetlands along the shore. Over the next month the bloom will…',
     choices:['Shrink','Get worse','Stay the same'],correct:0,
     baseline:{runoff:100},change:{buffer:true},reveal:40,changeText:'Buffer strips and wetlands added',watch:'chl',
     explain:'Plants and wetland soils trap and absorb much of the nitrogen and phosphorus before it reaches the lake. With less food, the bloom shrinks, though oxygen recovers slowly because muck on the bottom keeps rotting.'},
    {lvl:'honors',q:'Runoff into this lake carries lots of nitrogen but almost no phosphorus, and the algae stay low. Now the runoff switches to phosphorus instead. The algae will…',
     choices:['Bloom','Stay low','Die out'],correct:0,
     baseline:{runoff:100,nut:'N'},change:{nut:'P'},reveal:30,changeText:'Runoff now carries phosphorus',watch:'chl',
     explain:'Phosphorus is the limiting nutrient in most lakes: algae already have plenty of nitrogen. Adding the missing nutrient lets them bloom, which is why phosphate detergents were banned in many states.'},
    {lvl:'honors',q:'A sewage pipe starts overflowing into the lake. What happens to the bottom oxygen?',
     choices:['It falls','It rises','No change'],correct:0,
     baseline:{},change:{sewage:true},changeText:'Sewage overflow started',watch:'do',
     explain:'Sewage adds nutrients (feeding algae) and organic matter that decomposers start breaking down right away. Both raise the oxygen demand.'},
    {lvl:'ap',q:'Moderate runoff reaches the lake in summer, and the lake stratifies: warm surface water floats on cold bottom water and they stop mixing. Compared with a mixed lake, the bottom water will…',
     choices:['Lose its oxygen much sooner','Keep more oxygen','Be unaffected'],correct:0,
     baseline:{runoff:60},change:{strat:true},reveal:25,changeText:'Lake stratified',watch:'do',
     explain:'Bottom water gets oxygen only by mixing with the surface. A thermocline blocks that, so the same BOD drives the bottom to hypoxia in about two weeks instead of four.'},
    {lvl:'ap',instant:true,q:'Water just downstream of a sewage outfall has a very high BOD. That tells you the water…',
     choices:['Contains lots of organic matter that decomposers will use oxygen to break down','Already has a lot of dissolved oxygen','Is too cold for bacteria'],correct:0,
     explain:'Biochemical oxygen demand is the oxygen microbes will consume while decomposing organic matter. High BOD means the oxygen is about to be used up, a classic sign of organic pollution.'},
    {lvl:'ap',instant:true,q:'Each summer a hypoxic dead zone forms in the Gulf of Mexico. Its main cause is…',
     choices:['Nitrogen and phosphorus fertilizer carried down the Mississippi River','Oil spills','Warm water from power plants'],correct:0,
     explain:'Nutrient runoff from Midwest farms drives a huge spring bloom. When it dies and sinks, decomposition strips the bottom water of oxygen. Stratified summer water makes it worse.'}
  ],
  lab:{bio:'<p><b>Question:</b> How does the amount of fertilizer runoff affect the oxygen in a lake?</p><ol><li>Set runoff to 0% and press Reset. Run 40 days and record a trial.</li><li>Repeat at 25%, 50%, 75% and 100% runoff.</li><li>Plot runoff (x) against bottom oxygen (y) on the Trials graph.</li></ol><p>At what runoff level does the lake become a dead zone (under 2 mg/L)?</p>',
       honors:'<p><b>Question:</b> What is the best way to protect the lake?</p><ol><li>Set runoff to 100% and run 40 days. Record a trial.</li><li>Press Reset and try each fix on its own: buffer strips, runoff with nitrogen only, runoff with phosphorus only.</li><li>Record algae, bottom oxygen and fish for each.</li></ol><p>Which fix works best, and what does that tell you about the limiting nutrient?</p>',
       ap:'<p><b>Question:</b> How do temperature and stratification change a lake’s sensitivity to nutrients?</p><ol><li>With 60% runoff, record bottom DO after 30 days at 10, 20 and 30 °C.</li><li>Repeat at 20 °C with stratification on.</li><li>Compare each bottom DO with the saturation value and with BOD.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why dead zones are worst in late summer.</p>'},
  terms:[{t:'Eutrophication',d:'Too many nutrients in water, which leads to algal blooms and oxygen loss.'},{t:'Algal bloom',d:'A rapid increase in algae, often turning water green.'},{t:'Dissolved oxygen (DO)',d:'Oxygen gas dissolved in water, in mg/L. Most fish need more than about 5 mg/L.'},{t:'Dead zone (hypoxia)',d:'Water with too little oxygen for most life, under about 2 mg/L.'},
    {lvl:'honors',t:'Limiting nutrient',d:'The nutrient in shortest supply. Adding it causes the most growth. In most lakes it is phosphorus.'},{lvl:'honors',t:'Decomposers',d:'Bacteria and fungi that break down dead matter, using oxygen.'},{lvl:'honors',t:'Thermal pollution',d:'Heating water, often with power-plant cooling water, which lowers how much oxygen it can hold.'},
    {lvl:'ap',t:'BOD',d:'Biochemical oxygen demand: how much oxygen microbes will use to decompose the organic matter in water.'},{lvl:'ap',t:'Stratification and thermocline',d:'Layers of warm and cold water that don’t mix, cutting off oxygen to the bottom.'},{lvl:'ap',t:'Point vs. nonpoint source',d:'A sewage pipe is a point source. Runoff from many fields is a nonpoint source and much harder to regulate.'}],
  about:'<p>A two-layer lake model. Algae grow by μ·A·min(P/(P+6), N/(N+40))·(1 − A/250) with μ = 0.9/day at 20 °C (×1.07 per °C), so the scarcer nutrient limits growth. Dead algae become detritus decomposed at 0.15/day at 20 °C (×1.08 per °C), and decomposition sets the BOD. Surface DO relaxes toward saturation (DOsat ≈ 9.1 mg/L at 20 °C, 7.5 at 30 °C). Bottom DO is resupplied only by mixing, which slows in warm water and drops by 65% when stratified.</p><p>Simplified: day and night aren’t separated (real lakes are lowest in oxygen just before dawn), all algae are one type with no toxic cyanobacteria, nutrient units are model-scaled, and fish respond only to bottom oxygen. Chlorophyll is shown as 0.4 × algal biomass so values match common trophic-state ranges.</p>',
  initVis(sim){const r=rng(9),v=sim.vis;v.fish=[];for(let i=0;i<18;i++)v.fish.push({x:260+r()*480,y:230+r()*150,vx:(r()<.5?-1:1)*(12+r()*14),ph:r()*6.28,depth:r()});
    v.flakes=[];v.dead=[];v.storm=0;v.sink=0;v.kill=0;v.grass=[];for(let i=0;i<40;i++)v.grass.push([r(),r()]);},
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis,r=s.r||rates(p,s),hon=atLeast('honors'),ap=atLeast('ap'),R=Math.random;
    const chl=CHL*s.A,green=clamp(chl/60,0,1),SURF=170,LAKE_L=212;
    // sky and land
    ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,800,SURF);
    ctx.fillStyle='#f2c14e';ctx.beginPath();ctx.arc(70,46,20,0,6.29);ctx.fill();
    ctx.fillStyle='#6f5538';ctx.fillRect(0,SURF,800,450-SURF);ctx.fillStyle='#8a6a45';ctx.beginPath();ctx.moveTo(0,118);ctx.lineTo(LAKE_L+20,SURF+6);ctx.lineTo(LAKE_L-10,450);ctx.lineTo(0,450);ctx.closePath();ctx.fill();
    // crop rows on the field
    for(let i=0;i<7;i++){for(let j=0;j<9;j++){const x=8+j*16+i*2,y=128+i*7+x*0.21;ctx.fillStyle=(i+j)%2?'#5a9a3e':'#4c8834';ctx.beginPath();ctx.ellipse(x,y,5,3.2,0,0,6.29);ctx.fill();}}
    txt(ctx,'Farm field',12,108,{s:12*k,w:700});
    if(p.runoff>0){ctx.fillStyle=PAL['cv-soft'];ctx.font='600 '+11*k+'px sans-serif';txt(ctx,'fertilizer: '+p.runoff+'%',12,94,{s:11*k,c:PAL['cv-soft']});}
    if(p.buffer){ctx.fillStyle='#3e7d3a';for(let i=0;i<7;i++){const x=158+i*8,y=148+i*3.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-6,y+14);ctx.lineTo(x+6,y+14);ctx.closePath();ctx.fill();}
      v.grass.forEach(g=>{ctx.strokeStyle='#5aa648';ctx.lineWidth=1.5;const x=150+g[0]*62,y=150+g[0]*22+g[1]*8;ctx.beginPath();ctx.moveTo(x,y+6);ctx.lineTo(x+1,y);ctx.stroke();});
      txt(ctx,'Buffer strip',176,138,{s:11.5*k,w:700,a:'center'});}
    // runoff stream
    const inflow=(p.runoff/100)*(p.buffer?0.4:1)+(v.storm>0?0.6:0);
    if(inflow>0.02){ctx.strokeStyle='rgba(120,140,60,'+clamp(0.25+inflow*0.6,0,0.85)+')';ctx.lineWidth=2+inflow*7;ctx.lineCap='round';ctx.setLineDash([10,8]);ctx.lineDashOffset=-(RM?0:t*30);
      ctx.beginPath();ctx.moveTo(70,140);ctx.quadraticCurveTo(150,165,LAKE_L+8,SURF+4);ctx.stroke();ctx.setLineDash([]);}
    if(v.storm>0){v.storm-=vdt;ctx.strokeStyle='rgba(120,150,190,.6)';ctx.lineWidth=1.5;for(let i=0;i<40;i++){const x=(i*37+t*400)%800,y=(i*53+t*600)%SURF;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4,y+10);ctx.stroke();}pill(ctx,'Rainstorm: a pulse of fertilizer',300,24,'#4f6d8f','#fff',12*k);}
    // town and sewage pipe
    
    if(hon||p.sewage){ctx.fillStyle='#5d6168';ctx.fillRect(764,SURF-12,36,10);txt(ctx,'Sewage pipe',796,SURF-18,{s:10.5*k,a:'right',c:PAL['cv-soft']});if(p.sewage){ctx.fillStyle='rgba(110,100,80,.45)';ctx.beginPath();ctx.ellipse(752,SURF+24,46,22,0,0,6.29);ctx.fill();pill(ctx,'Sewage overflow',720,SURF+56,'#6d5a3a','#fff',11*k);}}
    // lake body
    const lake=new Path2D();lake.moveTo(LAKE_L,SURF);lake.lineTo(800,SURF);lake.lineTo(800,440);lake.quadraticCurveTo(520,452,LAKE_L+50,395);lake.closePath();
    const wcol=`rgb(${Math.round(lerp(120,90,green))},${Math.round(lerp(175,150,green))},${Math.round(lerp(210,90,green))})`;
    ctx.save();ctx.clip(lake);
    const gr=ctx.createLinearGradient(0,SURF,0,445);gr.addColorStop(0,wcol);gr.addColorStop(1,`rgb(${Math.round(lerp(40,45,green))},${Math.round(lerp(80,70,green))},${Math.round(lerp(120,55,green))})`);
    ctx.fillStyle=gr;ctx.fillRect(LAKE_L,SURF,600,290);
    // thermocline
    const strat=p.strat||p.temp>=24;if(strat){ctx.strokeStyle='rgba(255,255,255,.55)';ctx.setLineDash([6,6]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(LAKE_L,300);ctx.lineTo(800,300);ctx.stroke();ctx.setLineDash([]);}
    // surface algae scum
    if(chl>8){ctx.fillStyle='rgba(70,150,50,'+clamp((chl-8)/50,0,0.85)+')';ctx.fillRect(LAKE_L,SURF,600,4+clamp(chl/4,0,16));}
    // algae cells
    const nA=Math.round(clamp(chl*1.6,3,110));ctx.fillStyle='#58b44a';for(let i=0;i<nA;i++){const x=LAKE_L+20+((i*97.3)%560),y=SURF+6+((i*41.7)%70)+(RM?0:Math.sin(t+i)*2);ctx.beginPath();ctx.arc(x,y,2.1,0,6.29);ctx.fill();}
    // sinking dead algae
    v.sink+=r.die*CHL*vdt*1.2;while(v.sink>=1){v.sink--;v.flakes.push({x:LAKE_L+40+R()*540,y:SURF+30,vy:18+R()*14});}
    ctx.fillStyle='#8a6a3c';v.flakes.forEach(f=>{f.y+=f.vy*vdt;f.x+=Math.sin(f.y*0.05)*0.2;ctx.fillRect(f.x,f.y,3,2);});v.flakes=v.flakes.filter(f=>f.y<420);if(v.flakes.length>160)v.flakes.splice(0,v.flakes.length-160);
    // oxygen bubbles: surface and bottom layers
    const nOs=Math.round(s.Os*3.2),nOb=Math.round(s.Ob*3.2);ctx.fillStyle='rgba(255,255,255,.85)';
    for(let i=0;i<nOs;i++){const x=LAKE_L+15+((i*61.3)%570),y=SURF+20+((i*23.1)%95)+(RM?0:Math.sin(t*1.3+i)*3);ctx.beginPath();ctx.arc(x,y,2.4,0,6.29);ctx.fill();}
    for(let i=0;i<nOb;i++){const x=LAKE_L+70+((i*53.7)%500),y=310+((i*29.3)%80)+(RM?0:Math.sin(t*1.1+i)*3);ctx.beginPath();ctx.arc(x,y,2.4,0,6.29);ctx.fill();}
    // sediment and decomposers
    const sed=clamp(4+s.D/8,4,26);ctx.fillStyle='#5b4630';ctx.beginPath();ctx.moveTo(LAKE_L+50,395);ctx.quadraticCurveTo(520,452,800,440);ctx.lineTo(800,440-sed);ctx.quadraticCurveTo(520,452-sed,LAKE_L+50,395-sed*0.6);ctx.closePath();ctx.fill();
    const nb=Math.round(clamp(r.bod*30,2,60));ctx.fillStyle='#e6c86e';for(let i=0;i<nb;i++){const x=LAKE_L+90+((i*71.3)%470),yb=420+((x-500)/300)*((x-500)/300)*-6-sed*0.6;ctx.beginPath();ctx.ellipse(x,yb-2+(RM?0:Math.sin(t*3+i)),2.4,1.3,0.4,0,6.29);ctx.fill();}
    // fish
    const nF=Math.round(18*s.F/100);v.kill+=s.killRate*vdt*0.18;while(v.kill>=1){v.kill--;v.dead.push({x:LAKE_L+60+R()*500,life:8});}
    v.fish.slice(0,nF).forEach((f,i)=>{const safeY=s.Ob<4?lerp(SURF+30,SURF+110,f.depth):lerp(SURF+40,380,f.depth);f.y+=(safeY-f.y)*Math.min(1,vdt*0.8);f.x+=f.vx*vdt;if(f.x<LAKE_L+60||f.x>780)f.vx*=-1;f.x=clamp(f.x,LAKE_L+60,780);
      const dir=f.vx>0?1:-1,y=f.y+(RM?0:Math.sin(t*2+f.ph)*2);ctx.fillStyle='#d8893a';ctx.beginPath();ctx.ellipse(f.x,y,10,4.5,0,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(f.x-dir*9,y);ctx.lineTo(f.x-dir*16,y-5);ctx.lineTo(f.x-dir*16,y+5);ctx.closePath();ctx.fill();
      ctx.fillStyle='#222';ctx.beginPath();ctx.arc(f.x+dir*6,y-1,1.2,0,6.29);ctx.fill();});
    ctx.restore();
    // dead fish float on the surface
    v.dead.forEach(d=>{d.life-=vdt;ctx.globalAlpha=clamp(d.life/3,0,1);ctx.fillStyle='#b9b1a3';ctx.beginPath();ctx.ellipse(d.x,SURF-1,9,3.2,0,Math.PI,0);ctx.fill();ctx.globalAlpha=1;});v.dead=v.dead.filter(d=>d.life>0);if(v.dead.length>30)v.dead.splice(0,v.dead.length-30);
    // labels on the water
    txt(ctx,'Surface water',LAKE_L+30,SURF+(chl>8?30:22),{s:12*k,w:700,c:'#fff'});txt(ctx,'Bottom water',LAKE_L+120,385,{s:12*k,w:700,c:'#fff'});
    if(strat)txt(ctx,'thermocline (layers don’t mix)',560,296,{s:11*k,c:'#fff'});
    // oxygen gauges
    const GX=618,GY=10,GW=172;ctx.fillStyle=PAL['card'];rr(ctx,GX,GY,GW,134,9);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,'Dissolved oxygen (mg/L)',GX+10,GY+18,{s:11.5*k,w:700});
    [['Surface',s.Os,GY+32],['Bottom',s.Ob,GY+72]].forEach(g=>{const bx=GX+10,by=g[2],bw=GW-20,sc=bw/12;ctx.fillStyle=PAL['line'];rr(ctx,bx,by,bw,12,4);ctx.fill();
      ctx.fillStyle='rgba(214,51,47,.35)';ctx.fillRect(bx,by,2*sc,12);const val=clamp(g[1],0,12);ctx.fillStyle=g[1]<2?'#d6332f':g[1]<5?'#d99a1e':'#2f8f5b';rr(ctx,bx,by,Math.max(4,val*sc),12,4);ctx.fill();
      txt(ctx,g[0]+': '+g[1].toFixed(1),bx,by+26,{s:11.5*k,c:PAL['cv-ink']});});
    txt(ctx,'red zone = under 2 (hypoxic)',GX+GW-10,GY+126,{s:10.5*k,a:'right',c:PAL['cv-soft']});
    txt(ctx,'Water '+p.temp+' °C',GX-10,GY+16,{s:12*k,w:700,a:'right'});
    if(s.Ob<2&&s.F<80)pill(ctx,'Dead zone',500,SURF+150,'#d6332f','#fff',13*k);
  }
};
BioLab.register(SIM);
})();
