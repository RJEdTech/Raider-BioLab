(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,polyline,atLeast,PAL,FONT,RM,lvText}=BioLab.h;

/* Box model of the global carbon cycle (GtC, years).
   Preindustrial equilibrium: atmosphere 600 GtC (283 ppm). Prewarm runs 1850→2025 with
   historical-shaped emissions, so t = 0 is the year 2025 (~415 ppm). */
const A0=600,P0=450,S0=1700,O0=900,D0=37000,F0=4500,GT_PPM=2.12,BETA=0.25,XI=9,MIX=60;
function fluxes(sim){
  const s=sim.st,p=sim.p;let E,Df,Rf=0,dT=0;
  if(sim.t<0){const y=2025+sim.t;E=10*Math.exp((y-2025)/60);Df=1.6*(1-Math.exp(-(y-1850)/50));}
  else{E=p.fossil;Df=p.defor;Rf=atLeast('honors')?p.refor:0;dT=atLeast('honors')?p.otemp:0;}
  const f={};
  f.gpp=120*(1+BETA*Math.log(Math.max(s.A,50)/A0));     // photosynthesis, with CO2 fertilization
  f.ra=60*s.P/P0;                                       // plant respiration
  f.litter=60*s.P/P0;                                   // dead leaves and wood to soil
  f.rh=60*s.S/S0;                                       // decomposers respire soil carbon
  f.as=90*s.A/A0;                                       // CO2 dissolving into the ocean surface
  f.sa=90*Math.pow(s.O/O0,XI)*(1+0.045*dT);             // CO2 leaving the ocean (warmer water holds less)
  f.sd=MIX*s.O/O0; f.ds=MIX*s.D/D0;                     // mixing and sinking to the deep ocean
  f.E=s.F>0?E:0; f.Df=Math.min(Df,s.P*0.02); f.Rf=Rf;
  f.dA=f.ra+f.rh+f.sa+f.E+f.Df-f.gpp-f.as-f.Rf;
  f.land=f.gpp+f.Rf-f.ra-f.rh;                           // natural land uptake (gross)
  f.ocean=f.as-f.sa;
  return f;}

// particle paths across the scene (800 x 450)
const PATHS={
  photo:polyline([[205,70],[200,120],[190,165]]),
  resp:polyline([[140,165],[132,118],[125,70]]),
  litter:polyline([[230,215],[232,245],[236,272]]),
  decomp:polyline([[300,268],[306,210],[312,150],[318,80]]),
  as:polyline([[590,80],[592,150],[596,212]]),
  sa:polyline([[700,212],[704,150],[708,80]]),
  sd:polyline([[560,245],[562,320],[566,395]]),
  ds:polyline([[745,395],[742,320],[740,245]]),
  fossil:polyline([[390,360],[392,300],[395,220],[396,168],[405,120],[425,70]]),
  defor:polyline([[60,200],[56,150],[50,70]]),
  refor:polyline([[95,60],[92,120],[90,170]])
};
const COUNT_SCALE={photo:0.05,resp:0.05,litter:0.05,decomp:0.05,as:0.05,sa:0.05,sd:0.05,ds:0.05,fossil:0.35,defor:0.6,refor:0.6};

const SIM={
  id:'carboncycle',hash:'carboncycle',apUnit:8,order:5,kind:'Simulation',tab:'Carbon cycle',
  card:'Follow a carbon atom from the air into a leaf, a deer and back. Then burn fossil fuels and watch CO₂ climb.',
  title:'The carbon cycle: where carbon goes, and why CO₂ is rising',
  lede:{bio:'Carbon moves between the air, living things, soil, the ocean and fossil fuels. Burn fossil fuels or cut forests, and watch where the extra carbon ends up.',
        honors:'Track the carbon reservoirs and the fluxes between them. Plants and the ocean are carbon sinks, but they absorb only part of what people release.',
        ap:'Quantify the human perturbation. Compare sources and sinks, compute the airborne fraction, and connect rising CO₂ to ocean acidification.'},
  scale:'Whole-Earth scale. Reservoirs are in gigatonnes of carbon (1 GtC = a billion tonnes). The air holds about 2.12 GtC for every 1 ppm of CO₂.',
  timeScale:2,dtMax:0.05,prewarm:175,sampleDt:0.25,window:60,unit:'yr',timeLabel:'Years after 2025',
  clock(sim){return 'Year '+Math.floor(2025+sim.t);},
  chChange:2,chReveal:24,
  controls:[
    {id:'fossil',label:'Fossil-fuel burning',type:'range',min:0,max:20,step:0.5,def:10,unit:' GtC/yr',lvl:'bio',help:'Coal, oil and gas burned each year. Today: about 10.'},
    {id:'defor',label:'Deforestation',type:'range',min:0,max:5,step:0.1,def:1.5,unit:' GtC/yr',lvl:'bio',help:'Forests cut and burned. Today: about 1.5.'},
    {id:'refor',label:'Reforestation',type:'range',min:0,max:4,step:0.1,def:0,unit:' GtC/yr',lvl:'honors',help:'Extra carbon stored by new forests each year'},
    {id:'otemp',label:'Ocean warming',type:'range',min:0,max:4,step:0.5,def:0,unit:' °C',lvl:'honors',help:'Warmer water holds less dissolved CO₂'}
  ],
  init(){return {A:A0,P:P0,S:S0,O:O0,D:D0,F:F0,cumE:0,f:null};},
  step(sim,dt){const s=sim.st,f=fluxes(sim);
    s.A+=f.dA*dt;s.P+=(f.gpp+f.Rf-f.ra-f.litter-f.Df)*dt;s.S+=(f.litter-f.rh)*dt;
    s.O+=(f.as-f.sa-f.sd+f.ds)*dt;s.D+=(f.sd-f.ds)*dt;s.F=Math.max(0,s.F-f.E*dt);
    if(sim.t>=0)s.cumE+=(f.E+f.Df)*dt;s.f=f;},
  afterPrewarm(sim){sim.st.cumE=0;sim.st.ppm0=sim.st.A/GT_PPM;sim.st.f=fluxes(sim);},
  metrics:[
    {id:'ppm',label:'CO₂ in the air',unit:'ppm',lvl:'bio',min:250,max:700,d:0,get:s=>s.st.A/GT_PPM},
    {id:'rate',label:'CO₂ change',unit:'ppm per year',lvl:'bio',min:-3,max:8,d:2,get:s=>s.st.f?s.st.f.dA/GT_PPM:0},
    {id:'land',label:'Taken up by land plants',unit:'GtC/yr',lvl:'honors',min:0,max:12,d:1,get:s=>s.st.f?s.st.f.land:0},
    {id:'ocean',label:'Taken up by the ocean',unit:'GtC/yr',lvl:'honors',min:0,max:8,d:1,get:s=>s.st.f?s.st.f.ocean:0},
    {id:'atm',label:'Carbon in the air',unit:'GtC',lvl:'honors',min:500,max:1500,d:0,get:s=>s.st.A},
    {id:'af',label:'Airborne fraction',unit:'of emissions',lvl:'ap',min:0,max:1,d:2,get:s=>{const f=s.st.f;if(!f)return NaN;const e=f.E+f.Df;return e>0.2?clamp(f.dA/e,-1,1.5):NaN;}},
    {id:'ph',label:'Ocean surface pH',unit:'',lvl:'ap',min:7.7,max:8.25,d:2,fixed:true,get:s=>8.18-0.24*Math.log2(Math.max(s.st.A/GT_PPM,100)/283)}
  ],
  defaultGraph:'ppm',
  graphs:[{id:'ppm',label:'CO₂ in the air',lines:['ppm']},{id:'rate',label:'CO₂ change per year',lines:['rate']},
    {id:'sinks',label:'Land and ocean uptake',lvl:'honors',lines:['land','ocean']},{id:'ph',label:'Ocean pH',lvl:'ap',lines:['ph']}],
  challenges:[
    {lvl:'bio',q:'The world doubles its fossil-fuel burning, from 10 to 20 GtC a year. What happens to the yearly rise in CO₂?',
     choices:['CO₂ rises faster than before','CO₂ keeps rising at the same speed','Plants absorb the extra, so CO₂ levels off'],correct:0,
     change:{fossil:20},changeText:'Fossil-fuel burning doubled to 20 GtC/yr',watch:'rate',
     explain:{bio:'Plants and the ocean do absorb a bit more when there is more CO₂, but nowhere near enough. Roughly half of every extra tonne stays in the air, so CO₂ climbs faster.',
              ap:'Sinks scale with the CO₂ excess, not with emissions, so they lag. The airborne fraction stays near 0.4–0.5 and the growth rate roughly doubles.'}},
    {lvl:'bio',q:'Imagine all fossil-fuel burning and deforestation stopped today. What would CO₂ do over the next 20 years?',
     choices:['Keep rising just as fast','Slowly start to fall','Drop back to pre-industrial levels within a few years'],correct:1,
     change:{fossil:0,defor:0},changeText:'All burning and deforestation stopped',watch:'ppm',
     explain:{bio:'The ocean and plants keep absorbing extra CO₂ for decades, so CO₂ slowly falls. It falls slowly because the extra carbon has to soak into the deep ocean and soils, which takes a very long time.'}},
    {lvl:'honors',q:'Countries plant forests that store an extra 3 GtC a year, but keep burning fossil fuels at 10 GtC a year. What happens?',
     choices:['CO₂ starts to fall','CO₂ still rises, but more slowly','Nothing changes'],correct:1,
     change:{refor:3},changeText:'Reforestation added: 3 GtC/yr',watch:'rate',
     explain:{honors:'New forests are a real carbon sink, but 3 GtC a year is smaller than what we emit. Also, as CO₂ rises more slowly, the ocean absorbs a little less. Forests help; they cannot cancel 10 GtC a year of fossil carbon on their own.'}},
    {lvl:'honors',q:'The ocean surface warms by 4 °C. What happens to how much CO₂ the ocean takes up?',
     choices:['It takes up more, because warm water mixes faster','It takes up less, because warm water holds less dissolved gas','No change'],correct:1,
     change:{otemp:4},changeText:'Ocean surface warmed by 4 °C',watch:'sinks',
     explain:{honors:'Gases dissolve better in cold water, which is why a warm soda goes flat. Warmer oceans release more CO₂ and absorb less, so more of our emissions stay in the air. This is a feedback that makes warming worse.'}},
    {lvl:'ap',q:'With today’s emissions (10 GtC/yr fossil + 1.5 deforestation), about what fraction of the emitted carbon stays in the atmosphere each year?',
     choices:['About 100%','About 40–50%','Less than 10%'],correct:1,watch:'ppm',reveal:6,
     explain:{ap:'Measurements show the airborne fraction has stayed near 45% for decades. Land and ocean sinks absorb the rest. Read the airborne fraction tile: change in atmospheric carbon ÷ total emissions.'}},
    {lvl:'ap',q:'If fossil-fuel burning rises to 16 GtC/yr, what happens to ocean surface pH over the next 20 years?',
     choices:['pH rises (more basic)','pH falls (more acidic)','pH stays at 8.1'],correct:1,
     change:{fossil:16},changeText:'Emissions raised to 16 GtC/yr',watch:'ph',
     explain:{ap:'CO₂ dissolving in seawater forms carbonic acid: CO₂ + H₂O → H₂CO₃ → H⁺ + HCO₃⁻. More H⁺ means lower pH, which also removes carbonate ions that corals and shellfish need to build shells.'}}
  ],
  narrate(sim){const s=sim.st,f=s.f,p=sim.p;if(!f)return '';const hon=atLeast('honors');
    const em=f.E+f.Df,sink=f.land+f.Rf*0+f.ocean,rate=f.dA/GT_PPM;
    if(em<0.2){return rate<0?'<b>No new carbon is being added.</b> Plants and the ocean are still soaking up the extra CO₂ from the past, so CO₂ is slowly falling ('+rate.toFixed(2)+' ppm a year).':'Carbon is cycling with almost no human input.';}
    if(hon&&p.otemp>=2)return '<b>Warmer water holds less CO₂.</b> The ocean now absorbs only '+f.ocean.toFixed(1)+' GtC a year, so more of the '+em.toFixed(1)+' GtC we release stays in the air.';
    if(rate<=0)return 'Plants and the ocean are absorbing more than people release, so CO₂ is falling by '+(-rate).toFixed(2)+' ppm a year.';
    return 'People add <b>'+em.toFixed(1)+' GtC</b> a year. Plants and the ocean absorb '+(f.land+f.ocean-0).toFixed(1)+' GtC. The other <b>'+f.dA.toFixed(1)+' GtC</b> stays in the air, so CO₂ rises '+rate.toFixed(2)+' ppm a year.';},
  tour:[
    {title:'A carbon atom in the air',text:'Follow the large highlighted atom. Right now it is part of a CO₂ molecule floating in the atmosphere, along with about 870 billion tonnes of other carbon.',focus:[150,0,500,110],speed:0.25},
    {title:'Into a leaf',text:{bio:'A leaf takes in the CO₂ through tiny pores. Photosynthesis uses sunlight to build the carbon into sugar.',honors:'Through stomata, the CO₂ enters a leaf. In the Calvin cycle, rubisco fixes it into a three-carbon sugar. Plants fix about 120 GtC a year this way.'},focus:[100,40,230,190],speed:0.25},
    {title:'Eaten by a deer',text:'A deer eats the leaf. The carbon becomes part of the deer’s food, and then its cells.',focus:[210,150,140,90],speed:0.25},
    {title:'Back to the air by respiration',text:'The deer’s cells break down the sugar in cellular respiration and breathe out the carbon as CO₂. The atom is back in the air, sometimes within hours.',focus:[200,40,160,200],speed:0.25},
    {title:'Into the ocean',text:'Another path: CO₂ dissolves into the ocean surface. Some sinks to the deep ocean, where it can stay for centuries.',focus:[460,40,340,370],speed:0.25},
    {title:'Buried as fossil fuel',text:'A tiny fraction of dead plants gets buried before it decays. Over millions of years, heat and pressure turn it into coal, oil and gas.',focus:[0,210,450,200],speed:0.25},
    {title:'Burned in a few seconds',text:'Burning fossil fuel releases carbon that took millions of years to store. People do this at about 10 GtC a year, much faster than nature buries it.',focus:[330,100,130,280],speed:0.5},
    {lvl:'honors',title:'Sources vs. sinks',text:'Watch the arrows: plants and the ocean absorb about half of what people add. The other half stays in the air, which is why CO₂ rises about 2.4 ppm every year.',focus:[0,0,800,450],speed:2}
  ],
  lab:{bio:'<p><b>Question:</b> How does fossil-fuel burning affect CO₂ in the air?</p><ol><li>Set fossil-fuel burning to 0, 5, 10, 15 and 20 GtC/yr. Press Reset before each run.</li><li>Let each run go to the year 2045 (20 years), then record CO₂.</li><li>Plot fossil-fuel burning (x) against CO₂ (y).</li></ol><p>Describe the pattern and predict CO₂ in 2045 if burning stayed at today’s 10 GtC/yr.</p>',
       honors:'<p><b>Question:</b> Which helps more: cutting emissions or planting forests?</p><ol><li>Run 20 years at today’s settings and record CO₂.</li><li>Reset. Cut fossil-fuel burning by 3 GtC/yr and record CO₂ after 20 years.</li><li>Reset. Instead add 3 GtC/yr of reforestation and record again.</li></ol><p>Compare the results. Explain why the two do not give exactly the same CO₂, using the land and ocean uptake tiles.</p>',
       ap:'<p><b>Question:</b> How stable is the airborne fraction, and what does it mean for ocean chemistry?</p><ol><li>Record the airborne fraction and ocean pH at emissions of 5, 10, 15 and 20 GtC/yr after 20 years each.</li><li>Repeat with 4 °C of ocean warming.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain how ocean warming acts as a positive feedback on atmospheric CO₂.</p>'},
  terms:[{t:'Carbon cycle',d:'The movement of carbon between the air, living things, soil, rocks and the ocean.'},{t:'Reservoir',d:'A place where carbon is stored, such as the atmosphere, forests or fossil fuels.'},
    {t:'Photosynthesis',d:'Plants take CO₂ from the air and build it into sugar.'},{t:'Respiration',d:'Living things break down sugar and release CO₂.'},{t:'Decomposition',d:'Decomposers break down dead matter and release its carbon as CO₂.'},
    {t:'Fossil fuel',d:'Coal, oil or natural gas: carbon from ancient organisms, buried for millions of years.'},
    {lvl:'honors',t:'Carbon sink',d:'A reservoir that takes in more carbon than it releases, such as a growing forest or the ocean today.'},{lvl:'honors',t:'Flux',d:'A flow of carbon between reservoirs, in GtC per year.'},
    {lvl:'ap',t:'Airborne fraction',d:'The share of emitted CO₂ that stays in the atmosphere (about 45%).'},{lvl:'ap',t:'Ocean acidification',d:'The drop in seawater pH caused by dissolved CO₂ forming carbonic acid.'}],
  about:'<p>Five boxes (atmosphere, land plants, soil, surface ocean, deep ocean) exchange carbon each year. It starts from a pre-industrial balance of 600 GtC in the air (283 ppm). Then historical-shaped emissions run from 1850 to 2025, so the model opens near 415 ppm and rising about 2.3 ppm a year, close to real measurements.</p><p>Photosynthesis (about 120 GtC/yr) rises slightly with CO₂ (fertilization). Respiration, litterfall and decomposition scale with the carbon in each box. The ocean exchanges about 90 GtC/yr each way. Its outgassing rises steeply as the surface fills with carbon (a buffer, like the real Revelle effect) and by 4.5% per °C of warming. Surface and deep ocean mix slowly.</p><p><b>Simplified:</b> no climate feedback on land plants or soils, no permafrost, no rock weathering or volcanoes (tiny on these time scales), and pH is estimated from CO₂ alone. Real fluxes have large uncertainties.</p>',
  initVis(sim){const r=rng(21),v=sim.vis;v.parts=[];v.acc={};Object.keys(PATHS).forEach(k=>v.acc[k]=r());
    v.air=[];for(let i=0;i<140;i++)v.air.push([20+r()*760,14+r()*150,r()*6.28]);
    v.trees=[];for(let i=0;i<16;i++)v.trees.push([28+i*19+r()*8,r()]);v.puff=[];v.track=0;},
  draw(sim,ctx,vdt,k,t){
    const s=sim.st,p=sim.p,v=sim.vis,f=s.f||fluxes(sim),hon=atLeast('honors'),R=Math.random;
    // sky, land, ocean
    ctx.fillStyle=PAL['cv-sol'];ctx.fillRect(0,0,800,212);
    ctx.fillStyle=PAL['cv-bench'];ctx.beginPath();ctx.moveTo(0,212);ctx.quadraticCurveTo(160,196,330,210);ctx.lineTo(455,214);ctx.lineTo(455,450);ctx.lineTo(0,450);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(60,40,25,.25)';ctx.fillRect(0,250,455,60);
    ctx.fillStyle='#3d3631';ctx.fillRect(0,330,455,70);
    for(let i=0;i<9;i++){ctx.fillStyle=i%2?'#26211d':'#4c4239';rr(ctx,20+i*48,345+(i%3)*12,36,12,5);ctx.fill();}
    ctx.fillStyle='rgba(120,110,100,.45)';ctx.fillRect(0,400,800,50);
    ctx.fillStyle=PAL['cv-water'];ctx.fillRect(455,212,345,188);
    ctx.fillStyle='rgba(10,40,90,.28)';ctx.fillRect(455,262,345,138);
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.beginPath();for(let x=455;x<=800;x+=8){const y=212+Math.sin(x*.07+t*1.5)*2;x===455?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
    // sun
    ctx.fillStyle='#f2c230';ctx.beginPath();ctx.arc(760,34,16,0,6.29);ctx.fill();
    // atmosphere CO2 dots: density follows ppm
    const nAir=clamp(Math.round((s.A/GT_PPM-180)/3.2),20,140);ctx.fillStyle=PAL['cv-soft'];
    for(let i=0;i<nAir;i++){const q=v.air[i];ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(q[0]+(RM?0:Math.sin(t*.6+q[2])*3),q[1]+(RM?0:Math.cos(t*.5+q[2])*2),2.4,0,6.29);ctx.fill();}ctx.globalAlpha=1;
    // forest: number of standing trees follows plant carbon
    const nTree=clamp(Math.round(16*s.P/P0-0.5),2,16);
    v.trees.forEach((tr,i)=>{const x=tr[0],base=205+Math.sin(x*.02)*3;if(i>=nTree){ctx.fillStyle='#7a5536';ctx.fillRect(x-3,base-6,6,6);return;}
      const hgt=40+tr[1]*24;ctx.fillStyle='#7a5536';ctx.fillRect(x-2.5,base-hgt*.45,5,hgt*.45);ctx.fillStyle=i%2?PAL['cv-leaf']:PAL['cv-leaf2'];ctx.beginPath();ctx.ellipse(x,base-hgt*.62,13,hgt*.32,0,0,6.29);ctx.fill();});
    if(f.Df>0.3){const fx=30;for(let i=0;i<3;i++){ctx.fillStyle=i%2?'#e8742a':'#f2b030';ctx.beginPath();ctx.ellipse(fx+i*12,203-Math.abs(Math.sin(t*6+i))*6,5,9,0,0,6.29);ctx.fill();}}
    // deer
    const dx=262,dy=198;ctx.fillStyle='#8a5a33';ctx.beginPath();ctx.ellipse(dx,dy,16,8,0,0,6.29);ctx.fill();ctx.fillRect(dx-12,dy+4,3,12);ctx.fillRect(dx+9,dy+4,3,12);ctx.beginPath();ctx.ellipse(dx+18,dy-9,6,5,0,0,6.29);ctx.fill();ctx.strokeStyle='#8a5a33';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(dx+18,dy-13);ctx.lineTo(dx+15,dy-22);ctx.moveTo(dx+20,dy-13);ctx.lineTo(dx+24,dy-21);ctx.stroke();
    // factory
    ctx.fillStyle='#7d838c';ctx.fillRect(360,178,58,34);ctx.fillRect(384,140,12,40);ctx.fillStyle='#5f646c';ctx.fillRect(366,190,10,10);ctx.fillRect(382,190,10,10);ctx.fillRect(398,190,10,10);
    if(f.E>0.2){if(!RM&&R()<f.E*vdt*1.2)v.puff.push({x:390,y:138,r:6,life:2.5});}
    v.puff.forEach(q=>{q.y-=18*vdt;q.x+=8*vdt;q.r+=6*vdt;q.life-=vdt;ctx.fillStyle='rgba(120,120,125,'+clamp(q.life/2.5*.45,0,.45)+')';ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,6.29);ctx.fill();});v.puff=v.puff.filter(q=>q.life>0);
    // phytoplankton
    ctx.fillStyle=PAL['cv-leaf2'];for(let i=0;i<14;i++){ctx.beginPath();ctx.arc(470+i*23,226+(i%3)*9+Math.sin(t+i)*2,2.2,0,6.29);ctx.fill();}
    // reservoir labels
    const lab=(name,val,x,y,dark)=>{ctx.font='700 '+12*k+'px '+FONT;const w=Math.max(ctx.measureText(name).width,ctx.measureText(val).width)+16;rr(ctx,x-w/2,y-14,w,34,8);ctx.fillStyle=dark?'rgba(20,20,24,.72)':PAL['card'];ctx.fill();
      txt(ctx,name,x,y,{s:12*k,w:700,a:'center',c:dark?'#fff':PAL['cv-ink']});txt(ctx,val,x,y+14,{s:11.5*k,a:'center',c:dark?'#ddd':PAL['cv-soft']});};
    lab('Atmosphere',Math.round(s.A)+' GtC · '+Math.round(s.A/GT_PPM)+' ppm',400,26);
    lab('Plants',Math.round(s.P)+' GtC',150,236);lab('Soil',Math.round(s.S)+' GtC',110,290,true);
    lab('Fossil fuels',Math.round(s.F)+' GtC',230,385,true);
    lab('Surface ocean',Math.round(s.O)+' GtC',650,246,true);lab('Deep ocean',Math.round(s.D/1000)+'k GtC',650,345,true);
    // flux arrows + moving carbon atoms (rates follow the model's fluxes)
    const FL={photo:f.gpp,resp:f.ra,litter:f.litter,decomp:f.rh,as:f.as,sa:f.sa,sd:f.sd,ds:f.ds,fossil:f.E,defor:f.Df,refor:f.Rf};
    Object.keys(PATHS).forEach(key=>{const fl=FL[key];if(fl<0.05)return;v.acc[key]+=fl*COUNT_SCALE[key]*vdt;while(v.acc[key]>=1){v.acc[key]--;v.parts.push({key,d:0});}});
    if(v.parts.length>220)v.parts.splice(0,v.parts.length-220);
    v.parts.forEach(q=>{const P_=PATHS[q.key];q.d+=60*vdt;const xy=P_.at(q.d);const fos=q.key==='fossil';ctx.fillStyle=fos?PAL['s4']:(q.key==='defor'?'#e8742a':PAL['cv-ink']);
      ctx.globalAlpha=.85;ctx.beginPath();ctx.arc(xy[0],xy[1],fos?3.6:2.8,0,6.29);ctx.fill();});ctx.globalAlpha=1;
    v.parts=v.parts.filter(q=>q.d<PATHS[q.key].L);
    // flux labels (honors+)
    if(hon){const fl=(s_,x,y)=>txt(ctx,s_,x,y,{s:11*k,w:600,c:PAL['cv-soft'],a:'center'});
      fl('photosynthesis '+f.gpp.toFixed(0),230,98);fl('respiration '+(f.ra).toFixed(0),110,98);fl('ocean in '+f.as.toFixed(0)+' / out '+f.sa.toFixed(0),650,120);
      if(f.E>0.05)fl('burning '+f.E.toFixed(1),425,128);}
    // tracked atom during the walkthrough
    if(sim.tour&&sim.tour.on){const steps=SIM.tour.filter(st=>atLeast(st.lvl)),i=sim.tour.i;const path=[
        [[400,70],[330,60],[250,75],[330,80]],[[230,60],[205,110],[190,160],[195,175]],[[195,175],[230,185],[262,198]],[[262,198],[270,150],[275,90],[300,60]],
        [[600,60],[595,150],[600,230],[640,330],[700,370]],[[200,215],[210,260],[230,300],[250,360]],[[250,360],[390,330],[395,220],[396,168],[420,80]],[[420,80],[600,90],[650,200]]][Math.min(i,7)];
      v.track=(v.track+vdt*0.35)%1;const pl=polyline(path),xy=pl.at(v.track*pl.L);
      ctx.fillStyle=PAL['s1'];ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(xy[0],xy[1],8,0,6.29);ctx.fill();ctx.stroke();txt(ctx,'C',xy[0],xy[1]+1,{s:10,w:800,c:'#fff',a:'center',b:'middle'});}
    // legend
    ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(14,438,3,0,6.29);ctx.fill();txt(ctx,'carbon moving',22,442,{s:11.5*k,c:PAL['cv-ink']});
    ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(130,438,3.6,0,6.29);ctx.fill();txt(ctx,'fossil carbon',138,442,{s:11.5*k,c:PAL['cv-ink']});
  }
};
SIM.tour.forEach((s,i)=>{s.setup=s.setup||function(sim){sim.vis.track=0;};});
BioLab.register(SIM);
})();
