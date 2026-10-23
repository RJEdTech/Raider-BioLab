(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,RM,lvText}=BioLab.h;

/* ENSO: trade winds drive the warm pool west, tilt the thermocline, and allow upwelling off Peru.
   Time is in months. Each variable relaxes toward the equilibrium for the current trade-wind strength. */
const PRESET={normal:1,elnino:0.2,lanina:1.6};
const X0=60,X1=740,SEA=180;
const lonX=lon=>X0+(lon-120)/160*(X1-X0);
function tempCol(T){const f=clamp((T-17)/12,0,1);const c=[[40,90,200],[60,160,200],[240,200,80],[230,90,50]];const i=Math.min(2,Math.floor(f*3)),g=f*3-i;
  const a=c[i],b=c[i+1];return 'rgb('+Math.round(lerp(a[0],b[0],g))+','+Math.round(lerp(a[1],b[1],g))+','+Math.round(lerp(a[2],b[2],g))+')';}
const target=sim=>sim.p.state==='custom'?sim.p.trade:PRESET[sim.p.state];
function eq(W){const De=clamp(40+110*(1-W),15,170),Dw=160+40*W;return {De,Dw};}
const rainLon=W=>130+100*(1-clamp(W,0,1));
function rainRegion(lon){return lon<150?'Over Indonesia and Australia':lon<222?'Central Pacific':'Eastern Pacific, toward Peru';}
function outlook(s){const a=s.st.Te-21;if(a>1)return 'El Niño winter: wetter, cooler southern US; southern Colorado mountains often snowier';if(a<-0.8)return 'La Niña winter: drier, warmer southern US; northern Colorado mountains often snowier';return 'Neutral: no strong ENSO signal';}
function stateName(sim){const a=sim.st.Te-21;return a>1?'El Niño conditions':a<-0.8?'La Niña conditions':'Normal (neutral) conditions';}

const ENSO={
  id:'enso',hash:'enso',apUnit:12,order:3,kind:'Simulation',tab:'Ocean currents and El Niño',
  card:'Weaken the trade winds and watch warm water slosh back toward Peru, upwelling stop and the anchovy fishery crash.',
  title:'Ocean currents and El Niño (ENSO)',
  lede:{bio:'Steady trade winds push warm surface water west across the Pacific. Off Peru, cold, nutrient-rich water rises to replace it and feeds huge fish populations. In an El Niño year the winds weaken and that system breaks down.',
        honors:'Follow the thermocline, the boundary between warm surface water and cold deep water, as it tilts and flattens. Then zoom out to the global conveyor belt and the ocean gyres.',
        ap:'Connect the Pacific to Colorado. El Niño and La Niña shift the jet stream, changing winter rain and snow across the United States.'},
  scale:{bio:'A slice along the equator from Indonesia to Peru, about 15,000 km wide and the top 250 m of ocean. Depth is greatly exaggerated.'},
  timeScale:1,dtMax:0.02,prewarm:24,sampleDt:0.1,window:36,unit:'months',timeLabel:'Time',chChange:2,chReveal:14,
  controls:[
    {id:'view',label:'View',type:'seg',def:'pacific',lvl:'bio',noTrial:true,options:[{v:'pacific',l:'Pacific cross-section'},{v:'global',l:'Global currents',lvl:'honors'}]},
    {id:'state',label:'Conditions',type:'seg',def:'normal',lvl:'bio',options:[{v:'normal',l:'Normal'},{v:'elnino',l:'El Niño'},{v:'lanina',l:'La Niña'},{v:'custom',l:'Set winds',lvl:'honors'}],
     onChange(sim){if(sim.p.state!=='custom'){sim.p.trade=PRESET[sim.p.state];if(sim.ui.ctl&&sim.ui.ctl.trade)sim.ui.ctl.trade.set(sim.p.trade);}}},
    {id:'trade',label:'Trade wind strength',type:'range',min:0,max:2,step:0.05,def:1,d:2,unit:'× normal',lvl:'honors',help:'Moving this switches Conditions to “Set winds”.',
     onChange(sim){if(sim.p.state!=='custom'){sim.p.state='custom';if(sim.ui.ctl&&sim.ui.ctl.state)sim.ui.ctl.state.set('custom');}}}
  ],
  init(sim){const W=target(sim),e=eq(W);return {W,De:e.De,Dw:e.Dw,U:1,Te:21,F:100};},
  step(sim,dt){const st=sim.st,Wt=target(sim);st.W+=(Wt-st.W)*Math.min(1,dt/0.7);const e=eq(st.W);
    st.De+=(e.De-st.De)*Math.min(1,dt/2);st.Dw+=(e.Dw-st.Dw)*Math.min(1,dt/2);
    const Ueq=clamp(st.W*(1.2-(st.De-40)/120)/1.2,0,1.5);st.U+=(Ueq-st.U)*Math.min(1,dt/1);
    const Teq=28-7*Math.min(st.U,1.4);st.Te+=(Teq-st.Te)*Math.min(1,dt/1);
    const Feq=100*Math.pow(Math.min(st.U,1.3),1.2);st.F+=(Feq-st.F)*Math.min(1,dt/4);},
  metrics:[
    {id:'sst',label:'Ocean temperature off Peru',unit:'°C',lvl:'bio',min:16,max:30,d:1,fixed:true,get:s=>s.st.Te},
    {id:'upw',label:'Upwelling off Peru',unit:'% of normal',lvl:'bio',min:0,max:150,d:0,get:s=>100*s.st.U},
    {id:'fish',label:'Anchovy catch',unit:'% of normal',lvl:'bio',min:0,max:150,d:0,get:s=>s.st.F},
    {id:'rainc',label:'Heaviest rain',unit:'',lvl:'bio',text:true,get:s=>rainRegion(rainLon(s.st.W))},
    {id:'thermo',label:'Thermocline depth off Peru',unit:'m',lvl:'honors',min:0,max:180,d:0,get:s=>s.st.De},
    {id:'anom',label:'Temperature anomaly, east Pacific',unit:'°C',lvl:'honors',min:-4,max:8,d:1,fixed:true,get:s=>s.st.Te-21},
    {id:'trades',label:'Trade winds',unit:'% of normal',lvl:'honors',min:0,max:200,d:0,get:s=>100*s.st.W},
    {id:'rain',label:'Rain center longitude',unit:'°E',lvl:'ap',min:120,max:280,d:0,fixed:true,get:s=>rainLon(s.st.W)},
    {id:'co',label:'Colorado winter outlook',unit:'',lvl:'ap',text:true,get:outlook}
  ],
  graphs:[{id:'sst',label:'Ocean temperature off Peru',lines:['sst']},{id:'fish',label:'Anchovy catch',lines:['fish']},{id:'upw',label:'Upwelling',lines:['upw']},
    {id:'thermo',label:'Thermocline depth off Peru',lvl:'honors',lines:['thermo']},{id:'trades',label:'Trade winds',lvl:'honors',lines:['trades']},{id:'anom',label:'Temperature anomaly',lvl:'honors',lines:['anom']},{id:'rain',label:'Rain center longitude',lvl:'ap',lines:['rain']}],
  defaultGraph:'sst',
  challenges:[
    {lvl:'bio',q:'An El Niño begins. What happens to the anchovy fishery off Peru over the next year?',choices:['It booms','It crashes','No change'],correct:1,baseline:{state:'normal'},change:{state:'elnino'},changeText:'El Niño: trade winds weaken',watch:'fish',
     explain:{bio:'With weak trade winds, warm water flows back toward Peru and upwelling shuts down. No cold, nutrient-rich water rises, so there is little plankton for the anchovies to eat, and the catch collapses. The 1972 El Niño crashed Peru’s anchovy fishery, then the largest in the world.',
              honors:'Upwelling only brings nutrients up if the thermocline is shallow. During El Niño it deepens off Peru, so even the upwelling that remains brings up warm, nutrient-poor water.'}},
    {lvl:'bio',q:'During El Niño, the ocean along the coast of Peru becomes…',choices:['Colder','Warmer','About the same'],correct:1,baseline:{state:'normal'},change:{state:'elnino'},changeText:'El Niño: trade winds weaken',watch:'sst',reveal:10,
     explain:'Warmer, by several degrees. The warm pool that the trade winds normally pile up near Indonesia sloshes back east across the Pacific. Peruvian fishermen named it “El Niño” because it often arrived around Christmas.'},
    {lvl:'bio',instant:true,q:'In normal years, which way do the trade winds push warm surface water across the Pacific?',choices:['East, toward Peru','West, toward Indonesia and Australia','North, toward Alaska'],correct:1,
     explain:'The trade winds blow from east to west along the equator and push sun-warmed surface water west, where it piles up as the warm pool. The sea surface near Indonesia is about half a meter higher than near Peru.'},
    {lvl:'honors',q:'You weaken the trade winds from 100% to 30%. What happens to the thermocline off Peru?',choices:['It gets shallower','It gets deeper','It does not move'],correct:1,baseline:{state:'custom',trade:1},change:{trade:0.3},changeText:'Trade winds weakened to 30%',watch:'thermo',
     explain:'Strong trades pile warm water in the west and tilt the thermocline: deep in the west, shallow in the east. When they weaken, warm water flows back east and the thermocline off Peru deepens from about 40 m to over 100 m.'},
    {lvl:'honors',q:'Conditions shift to La Niña. What happens off Peru?',choices:['Warmer water and fewer fish','Colder water and more fish','No change from normal'],correct:1,baseline:{state:'normal'},change:{state:'lanina'},changeText:'La Niña: stronger trade winds',watch:'sst',reveal:10,
     explain:'La Niña is normal conditions, exaggerated. Stronger trade winds push even more warm water west, the thermocline rises off Peru, upwelling strengthens, and the coastal water cools.'},
    {lvl:'honors',instant:true,q:'What drives the deep thermohaline circulation (the global conveyor belt)?',choices:['Wind blowing on the surface','Cold, salty, dense water sinking near Greenland and Antarctica','Tides from the Moon','Warm water sinking at the equator'],correct:1,
     explain:'“Thermo” means temperature and “haline” means salt. Very cold, salty water is dense, so it sinks in the North Atlantic and around Antarctica and spreads along the sea floor. Switch to Global currents to follow it.'},
    {lvl:'ap',instant:true,q:'During a strong El Niño winter, the southern United States tends to be…',choices:['Wetter and cooler','Hotter and drier','Unaffected'],correct:0,
     explain:'El Niño shifts the Pacific jet stream south, steering storms across the southern US. Southern California, the Gulf Coast and often southern Colorado get extra precipitation, while the northern US runs mild and dry. La Niña tends to do the reverse.'},
    {lvl:'ap',q:'During El Niño, where does the heaviest tropical rainfall move?',choices:['West toward Africa','East toward the central Pacific','It stays over Indonesia'],correct:1,baseline:{state:'normal'},change:{state:'elnino'},changeText:'El Niño: trade winds weaken',watch:'rain',reveal:8,
     explain:'Rain follows the warmest water, where air rises (the rising branch of the Walker circulation). As the warm pool shifts east, Indonesia and Australia face drought and wildfire risk while Pacific islands and coastal Peru flood.'},
    {lvl:'ap',instant:true,q:'Why does upwelling off Peru support one of the world’s biggest fisheries?',choices:['Cold water holds more fish eggs','It brings nitrate and phosphate up to sunlit water, where phytoplankton grow','Upwelling pushes fish toward shore','Warm water kills predators'],correct:1,
     explain:'Upwelling brings nutrients from the deep up to the sunlit surface. Phytoplankton bloom, which feeds zooplankton, which feeds anchovies. Upwelling zones cover about 1% of the ocean but produce a large share of the world’s fish catch.'}
  ],
  initVis(sim){const r=rng(13);sim.vis.n=[];for(let i=0;i<40;i++)sim.vis.n.push([r(),r(),r()]);sim.vis.f=[];for(let i=0;i<16;i++)sim.vis.f.push([r(),r(),r()*6.28]);sim.vis.cl=[];for(let i=0;i<6;i++)sim.vis.cl.push([r(),r()]);},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);if(sim.p.view==='global'&&atLeast('honors'))drawGlobal(sim,ctx,k,t);else drawPacific(sim,ctx,k,t);},
  narrate(sim){const st=sim.st,a=st.Te-21;
    if(sim.p.view==='global'&&atLeast('honors'))return 'Surface currents are driven by wind and curve into <b>gyres</b>: clockwise in the north, counterclockwise in the south. Deep down, <b>cold, salty water sinks</b> near Greenland and Antarctica and creeps along the sea floor, a loop that takes about 1,000 years.';
    if(a>1)return '<b>El Niño:</b> the trade winds have weakened, so warm water has spread east and the thermocline off Peru has dropped to '+st.De.toFixed(0)+' m. Upwelling is only '+Math.round(100*st.U)+'% of normal and the anchovy catch is down to '+Math.round(st.F)+'%.';
    if(a<-0.8)return '<b>La Niña:</b> stronger trade winds push even more warm water west. Upwelling off Peru is '+Math.round(100*st.U)+'% of normal, bringing up cold, nutrient-rich water. Fishing is good.';
    return '<b>Normal year:</b> trade winds push warm water west, so cold, nutrient-rich water <b>wells up</b> off Peru. Plankton bloom and anchovies thrive. Rain falls mostly over the warm pool near Indonesia.';},
  tour:[
    {title:'The Pacific, sliced along the equator',text:'Indonesia and Australia are on the left, Peru on the right. Warm surface water floats on top of cold, deep water. The boundary between them is the <b>thermocline</b>.',focus:[0,40,800,410],pause:true,setup(sim){BioLab.setValues(sim,{view:'pacific',state:'normal'});}},
    {title:'Trade winds',text:'Along the equator the trade winds blow from east to west, dragging sun-warmed surface water toward Indonesia.',focus:[X0,105,X1-X0,60],speed:1},
    {title:'The warm pool',text:'Warm water piles up in the western Pacific, making the warm layer thick there and thin near Peru. The thermocline tilts.',focus:[X0,170,280,250],pause:true},
    {title:'Upwelling off Peru',text:'As surface water is pushed away from Peru, cold water from below rises to replace it. It carries nitrate and phosphate that feed plankton and huge schools of anchovies.',focus:[580,170,160,260],speed:0.6},
    {title:'The Walker circulation',text:'Air rises over the warm pool, drops heavy rain, flows east high up, and sinks over the cool eastern Pacific, where it is dry. That loop keeps the trade winds blowing.',focus:[X0,20,X1-X0,160],speed:0.6},
    {title:'El Niño',text:'Every 2–7 years the trade winds weaken. Warm water sloshes back east, the thermocline off Peru sinks, upwelling stops, fisheries crash, and the rain moves east with the warm water.',focus:[0,40,800,410],speed:3,setup(sim){BioLab.setValues(sim,{state:'elnino'});}},
    {lvl:'honors',title:'La Niña',text:'La Niña is the opposite swing: extra-strong trade winds, an even colder eastern Pacific, and stronger upwelling.',focus:[0,40,800,410],speed:3,setup(sim){BioLab.setValues(sim,{state:'lanina'});}},
    {lvl:'honors',title:'The global conveyor belt',text:'Zoom out. Wind-driven gyres circle each ocean basin, while cold, salty water sinks near Greenland and Antarctica and slowly circulates the globe along the deep ocean floor.',focus:[0,40,800,410],speed:1,setup(sim){BioLab.setValues(sim,{view:'global'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{view:'pacific',state:'normal'});},
  lab:{bio:'<p><b>Question:</b> How does El Niño affect Peru’s fishing industry?</p><ol><li>Record a trial in normal conditions after the clock passes 6 months.</li><li>Switch to El Niño and record a trial every 3 months for a year.</li><li>Plot time against anchovy catch.</li></ol><p>Explain the chain of events from weaker winds to fewer fish.</p>',
       honors:'<p><b>Question:</b> How does trade wind strength control conditions off Peru?</p><ol><li>Choose Set winds. Record a trial at trade wind strengths 0.2, 0.5, 1.0, 1.4 and 1.8. Wait about 12 months each time.</li><li>Record thermocline depth, ocean temperature and upwelling.</li><li>Plot trade winds (x) against each variable.</li></ol><p>Describe the relationship and identify where El Niño and La Niña fall on your graph.</p>',
       ap:'<p><b>Question:</b> How does ENSO reach Colorado?</p><ol><li>Record normal, El Niño and La Niña trials, including the rain center and the Colorado winter outlook.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain how a shift in tropical Pacific rainfall changes the jet stream and winter snowpack in the Rocky Mountains, and why that matters for Colorado’s water supply.</p>'},
  terms:[{t:'Trade winds',d:'Steady winds that blow from east to west near the equator.'},{t:'Upwelling',d:'Cold, nutrient-rich deep water rising to the surface.'},{t:'El Niño',d:'A periodic weakening of the trade winds that warms the eastern Pacific.'},{t:'La Niña',d:'Stronger-than-normal trade winds that cool the eastern Pacific.'},
    {lvl:'honors',t:'Thermocline',d:'The boundary layer where temperature drops quickly with depth.'},{lvl:'honors',t:'Gyre',d:'A large circular surface current: clockwise in the Northern Hemisphere.'},{lvl:'honors',t:'Thermohaline circulation',d:'Deep ocean circulation driven by differences in temperature and salinity.'},
    {lvl:'ap',t:'Walker circulation',d:'The east–west loop of air over the tropical Pacific.'},{lvl:'ap',t:'ENSO',d:'El Niño–Southern Oscillation: the linked ocean and atmosphere cycle.'},{lvl:'ap',t:'Teleconnection',d:'A link between climate in one region and weather far away.'}],
  about:'<p><b>Model:</b> trade-wind strength W sets the equilibrium thermocline depths (east 40 + 110(1 − W) m, west 160 + 40W m). The ocean relaxes toward them over about 2 months, a stand-in for Kelvin and Rossby waves. Upwelling depends on both wind and a shallow thermocline. Peru’s surface temperature follows upwelling (21 °C normal, about 27–28 °C in strong El Niño). The anchovy catch follows upwelling with a 4-month lag.</p><p><b>Simplified:</b> real ENSO events build and decay on their own through ocean–atmosphere feedbacks. Here you set the winds. The global view is a schematic, not a map.</p>'
};

function cloud(ctx,x,y,s){ctx.beginPath();ctx.arc(x,y,12*s,0,6.29);ctx.arc(x+14*s,y-6*s,14*s,0,6.29);ctx.arc(x+30*s,y,11*s,0,6.29);ctx.fill();}
function drawPacific(sim,ctx,k,t){const st=sim.st,v=sim.vis,W=st.W;
  // sky
  const sky=ctx.createLinearGradient(0,0,0,SEA);sky.addColorStop(0,PAL['cv-bg2']);sky.addColorStop(1,PAL['cv-bg']);ctx.fillStyle=sky;ctx.fillRect(0,0,800,SEA);
  // deep cold water
  ctx.fillStyle='#16335e';ctx.fillRect(X0,SEA,X1-X0,450-SEA);
  // warm layer above the tilted thermocline, colored by temperature from west to east
  const Tw=29+0.3*(W-1),g=ctx.createLinearGradient(X0,0,X1,0);g.addColorStop(0,tempCol(Tw));g.addColorStop(0.55,tempCol(lerp(Tw,st.Te,0.45)));g.addColorStop(1,tempCol(st.Te));
  const dy=m=>SEA+m*0.95;
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(X0,SEA);ctx.lineTo(X1,SEA);ctx.lineTo(X1,dy(st.De));ctx.bezierCurveTo(lerp(X1,X0,0.4),dy(st.De),lerp(X1,X0,0.6),dy(st.Dw),X0,dy(st.Dw));ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.85)';ctx.setLineDash([7,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X1,dy(st.De));ctx.bezierCurveTo(lerp(X1,X0,0.4),dy(st.De),lerp(X1,X0,0.6),dy(st.Dw),X0,dy(st.Dw));ctx.stroke();ctx.setLineDash([]);
  if(atLeast('honors'))pill(ctx,'Thermocline',lerp(X0,X1,0.5),dy(lerp(st.Dw,st.De,0.5))+2,'rgba(0,0,0,.55)','#fff',11*k);
  // phytoplankton tint fed by upwelling
  ctx.fillStyle='rgba(60,200,90,'+clamp(st.U*0.28,0,0.4)+')';ctx.fillRect(X1-150,SEA,150,40);
  // upwelling arrows and nutrients
  const nU=Math.round(clamp(st.U,0,1.5)*5);ctx.strokeStyle='rgba(180,230,255,.9)';ctx.lineWidth=3;
  for(let i=0;i<nU;i++){const x=X1-25-i*24,y0=Math.min(430,dy(st.De)+70),y1=SEA+16,ph=RM?0:((t*0.5+i*0.21)%1);ctx.beginPath();ctx.moveTo(x,y0);ctx.quadraticCurveTo(x+18,(y0+y1)/2,x+6,y1);ctx.stroke();
    ctx.fillStyle='#9be38a';const yy=lerp(y0,y1,ph);ctx.beginPath();ctx.arc(x+8,yy,3,0,6.29);ctx.fill();}
  if(nU>0)txt(ctx,'Upwelling',X1-80,Math.min(440,dy(st.De)+92),{s:12*k,w:700,a:'center',c:'#cfe9ff'});
  // fish
  const nF=Math.round(clamp(st.F/100,0,1.5)*10);ctx.fillStyle='#e8eef4';v.f.slice(0,nF).forEach(f=>{const x=X1-30-f[0]*120+(RM?0:Math.sin(t*1.5+f[2])*6),y=SEA+20+f[1]*50;ctx.beginPath();ctx.ellipse(x,y,7,3,0,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(x+6,y);ctx.lineTo(x+11,y-4);ctx.lineTo(x+11,y+4);ctx.fill();});
  // fishing boat
  ctx.fillStyle='#c14a2a';ctx.beginPath();ctx.moveTo(X1-110,SEA-2);ctx.lineTo(X1-70,SEA-2);ctx.lineTo(X1-78,SEA+8);ctx.lineTo(X1-104,SEA+8);ctx.closePath();ctx.fill();ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(X1-92,SEA-20,2,18);
  // land
  ctx.fillStyle='#6a7d4a';ctx.beginPath();ctx.moveTo(0,SEA-30);ctx.lineTo(X0+4,SEA-18);ctx.lineTo(X0,450);ctx.lineTo(0,450);ctx.closePath();ctx.fill();
  ctx.fillStyle='#7a6a4a';ctx.beginPath();ctx.moveTo(800,60);ctx.lineTo(770,70);ctx.lineTo(752,120);ctx.lineTo(X1,SEA-8);ctx.lineTo(X1,450);ctx.lineTo(800,450);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f2f2f2';ctx.beginPath();ctx.moveTo(800,60);ctx.lineTo(778,68);ctx.lineTo(790,78);ctx.closePath();ctx.fill();
  txt(ctx,'Indonesia',X0-4,SEA-40,{s:12*k,w:700,a:'right'});txt(ctx,'Peru',X1+6,SEA-24,{s:12*k,w:700});
  // Walker circulation + rain
  const rx=lonX(rainLon(W)),str=clamp(W,0.15,1.6);
  ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['line'];v.cl.forEach((c,i)=>{ctx.globalAlpha=.95;cloud(ctx,rx-40+c[0]*60,50+c[1]*30,0.8+0.4*str);});ctx.globalAlpha=1;
  ctx.strokeStyle=PAL['cv-sub'];ctx.lineWidth=1.6;ctx.globalAlpha=.7;for(let i=0;i<10;i++){const x=rx-30+i*9,ph=RM?0:((t*2+i*0.3)%1);ctx.beginPath();ctx.moveTo(x,90+ph*40);ctx.lineTo(x-3,104+ph*40);ctx.stroke();}ctx.globalAlpha=1;
  txt(ctx,'Heavy rain',rx,30,{s:12*k,w:700,a:'center'});
  const top=60,bot=150,east=Math.min(X1-20,rx+(X1-rx)*0.92);
  if(east-rx>60){ctx.strokeStyle='rgba(120,120,140,.5)';ctx.lineWidth=2;ctx.setLineDash([4,6]);ctx.beginPath();ctx.moveTo(rx,bot);ctx.lineTo(rx,top);ctx.lineTo(east,top);ctx.lineTo(east,bot);ctx.stroke();ctx.setLineDash([]);
    const per=2*(bot-top)+2*(east-rx),n=6;for(let i=0;i<n;i++){let d=((t*70*str+i*per/n)%per);let x,y;if(d<bot-top){x=rx;y=bot-d;}else if(d<bot-top+(east-rx)){x=rx+(d-(bot-top));y=top;}else if(d<2*(bot-top)+(east-rx)){x=east;y=top+(d-(bot-top)-(east-rx));}else{x=east-(d-2*(bot-top)-(east-rx));y=bot;}
      ctx.fillStyle='#8a8aa0';ctx.beginPath();ctx.arc(x,y,3.5,0,6.29);ctx.fill();}
    txt(ctx,'Dry, sinking air',east,top-8,{s:11*k,a:'center',c:PAL['cv-soft']});}
  // trade winds
  const nA=Math.round(clamp(W,0,2)*4);ctx.strokeStyle=PAL['cv-ink'];ctx.fillStyle=PAL['cv-ink'];ctx.lineWidth=2.5;
  for(let i=0;i<nA;i++){const L=30+28*clamp(W,0,1.6),x=X1-60-i*(X1-X0-80)/Math.max(1,nA)-((RM?0:t*40*W)%40),y=162;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-L,y);ctx.stroke();ctx.beginPath();ctx.moveTo(x-L,y);ctx.lineTo(x-L+9,y-5);ctx.lineTo(x-L+9,y+5);ctx.closePath();ctx.fill();}
  if(nA)txt(ctx,'Trade winds',lerp(X0,X1,0.62),150,{s:12*k,w:700,a:'center'});else txt(ctx,'Trade winds have collapsed',lerp(X0,X1,0.6),155,{s:12*k,w:700,a:'center'});
  // labels & legend
  txt(ctx,'Warm pool',X0+60,SEA+30,{s:12.5*k,w:700,c:'#fff'});txt(ctx,'Cold deep water',X0+250,438,{s:12*k,w:600,c:'#cfe0ff'});
  const lx=X0+20,ly=410;for(let i=0;i<60;i++){ctx.fillStyle=tempCol(17+i*12/60);ctx.fillRect(lx+i*2,ly,2,10);}txt(ctx,'17 °C',lx,ly-4,{s:10*k,c:'#cfe0ff'});txt(ctx,'29 °C',lx+120,ly-4,{s:10*k,a:'right',c:'#cfe0ff'});
  pill(ctx,stateName(sim),130,22,PAL['rj'],'#fff',12*k);
}
function blob(ctx,pts){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();}
function drawGlobal(sim,ctx,k,t){
  ctx.fillStyle='#1f4f8a';ctx.fillRect(0,40,800,370);
  ctx.fillStyle='#7a8a62';
  blob(ctx,[[318,40],[372,40],[380,140],[350,200],[372,230],[384,300],[360,388],[342,388],[330,300],[336,232],[318,190],[300,120]]); // Americas
  blob(ctx,[[555,40],[620,40],[630,120],[618,180],[640,250],[612,350],[590,360],[572,250],[548,200],[560,120]]); // Europe & Africa
  blob(ctx,[[620,40],[800,40],[800,150],[740,170],[700,190],[662,170],[630,120]]); // Asia
  blob(ctx,[[700,262],[770,256],[786,310],[730,320]]); // Australia
  ctx.fillStyle='#e8eef4';ctx.fillRect(0,402,800,48);txt(ctx,'Antarctica',400,432,{s:12*k,w:700,a:'center',c:'#3a4a5a'});
  ctx.fillStyle='#e8eef4';blob(ctx,[[440,40],[500,40],[488,72],[452,70]]);txt(ctx,'Greenland',470,58,{s:10*k,w:600,a:'center',c:'#3a4a5a'});
  // gyres
  const gyre=(x,y,rx,ry,cw,label)=>{ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,6.29);ctx.stroke();
    for(let i=0;i<4;i++){const a=(cw?1:-1)*(RM?0:t*0.6)+i*Math.PI/2,px=x+rx*Math.cos(a),py=y+ry*Math.sin(a),tx=-Math.sin(a)*(cw?1:-1),ty=Math.cos(a)*(cw?1:-1);
      ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(px+tx*8,py+ty*8*ry/rx);ctx.lineTo(px-ty*5,py+tx*5);ctx.lineTo(px+ty*5,py-tx*5);ctx.closePath();ctx.fill();}
    if(label)txt(ctx,label,x,y+4,{s:10.5*k,w:600,a:'center',c:'#fff'});};
  gyre(160,130,110,55,true,'N. Pacific gyre');gyre(170,300,110,55,false,'S. Pacific gyre');gyre(465,140,65,50,true,'N. Atlantic');gyre(470,290,55,50,false,'S. Atlantic');gyre(690,300,45,40,false,'Indian');
  // thermohaline conveyor
  const warm=[[180,210],[290,220],[300,330],[250,380],[480,385],[600,370],[660,330],[690,230],[650,220],[600,380],[520,330],[470,200],[480,90]];
  const deep=[[470,90],[430,200],[420,330],[380,395],[150,395],[90,300],[120,230]];
  const path=(pts,col,dash)=>{ctx.strokeStyle=col;ctx.lineWidth=5;ctx.setLineDash(dash);ctx.lineDashOffset=RM?0:-t*30;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.setLineDash([]);ctx.lineDashOffset=0;};
  path(warm,'rgba(240,90,60,.9)',[14,8]);path(deep,'rgba(120,200,255,.95)',[6,6]);
  pill(ctx,'Cold, salty water sinks',470,104,'rgba(0,0,0,.6)','#fff',11*k);
  txt(ctx,'Global ocean circulation (schematic, not a map)',16,28,{s:13.5*k,w:700});
  const lg=[['rgba(240,90,60,.9)','Warm surface'],['#78c8ff','Cold deep'],['#9aa4b0','Gyre']];
  let x=420;lg.forEach(l=>{ctx.strokeStyle=l[0];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,24);ctx.lineTo(x+20,24);ctx.stroke();txt(ctx,l[1],x+26,28,{s:11*k,c:PAL['cv-soft']});ctx.font='400 '+11*k+'px sans-serif';x+=ctx.measureText(l[1]).width+50;});
}

BioLab.register(ENSO);
})();
