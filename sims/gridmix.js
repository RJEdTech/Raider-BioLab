(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,fmtNum}=BioLab.h;

const SEASON={summer:{rise:5.6,set:20.5,peak:0.9,wind:-0.06},spring:{rise:6.5,set:19.6,peak:0.8,wind:0.08},winter:{rise:7.2,set:16.8,peak:0.55,wind:0.03}};
const CO2T={coal:1.0,gas:0.4};                 // t CO2 per MWh delivered
const COST={coal:90,gas:60,nuclear:100,hydro:50,wind:40,solar:45,bat:120};   // $ per MWh (rough levelized)
const LAND={coal:0.005,gas:0.002,nuclear:0.001,hydro:0.3,wind:0.15,solar:0.02,battery:0.0005}; // km² per MW installed (wind = turbine spacing)
const EFF={coal:0.33,gas:0.55,nuclear:0.33};
const SRC=[{k:'nuclear',l:'Nuclear',c:()=>PAL.s5},{k:'coal',l:'Coal',c:()=>PAL['cv-soft']},{k:'gas',l:'Gas',c:()=>PAL.s4},{k:'hydro',l:'Hydro',c:()=>PAL.s2},{k:'wind',l:'Wind',c:()=>PAL.s6},{k:'solar',l:'Solar',c:()=>'#e8b500'},{k:'bat',l:'Battery',c:()=>PAL.s3}];
const hourOf=t=>((t%24)+24)%24;
function demand(h,season){const g=(c,w)=>Math.exp(-Math.pow((h-c)/w,2));
  if(season==='winter')return 1200+300*g(7.5,2)+500*g(18.5,2.5)-150*g(3.5,2.5);
  if(season==='spring')return 1050+200*g(8,2)+350*g(19,2.3)-150*g(3.5,2.5);
  return 1150+200*g(8,2)+450*g(16,3)+350*g(19,2.2)-150*g(3.5,2.5);}
function sunF(h,season){const S=SEASON[season];if(h<=S.rise||h>=S.set)return 0;return S.peak*Math.pow(Math.sin(Math.PI*(h-S.rise)/(S.set-S.rise)),1.2);}
function windF(t,season,calm){if(calm)return 0.02;const h=hourOf(t);return clamp(0.38+SEASON[season].wind+0.12*Math.cos(2*Math.PI*(h-2)/24)+0.13*Math.sin(2*Math.PI*t/31)+0.07*Math.sin(2*Math.PI*t/7.3),0.05,0.9);}

function dispatch(sim,t,dt){const p=sim.p,s=sim.st,h=hourOf(t),D=demand(h,p.season);
  const o={nuclear:p.nuclear*0.92,coal:p.coal>0?0.4*p.coal:0,gas:0,hydro:0,wind:p.wind*windF(t,p.season,p.calm),solar:p.solar*sunF(h,p.season),bat:0,charge:0,curtail:0,unmet:0,D};
  let net=D-(o.nuclear+o.coal+o.wind+o.solar);
  const Ecap=p.battery*4;
  if(net<0){let sur=-net;const room=Math.max(0,(Ecap-s.soc)/0.9/Math.max(dt,1e-6));const ch=Math.min(sur,p.battery,room);o.charge=ch;sur-=ch;
    // curtail renewables first
    const cutS=Math.min(sur,o.solar);o.solar-=cutS;sur-=cutS;const cutW=Math.min(sur,o.wind);o.wind-=cutW;sur-=cutW;o.curtail=cutS+cutW;
    if(sur>0){const cc=Math.min(sur,o.coal);o.coal-=cc;sur-=cc;}net=0;}
  else{const hy=Math.min(net,p.hydro);o.hydro=hy;net-=hy;
    const canB=Math.min(p.battery,s.soc/Math.max(dt,1e-6));const b=Math.min(net,canB);o.bat=b;net-=b;
    const c=Math.min(net,p.coal-o.coal);o.coal+=Math.max(0,c);net-=Math.max(0,c);
    const g=Math.min(net,p.gas);o.gas=g;net-=g;o.unmet=Math.max(0,net);}
  return o;}

const GRIDMIX={
  id:'gridmix',hash:'gridmix',apUnit:13,order:4,kind:'Simulation',tab:'Power grid energy mix',
  card:'Run a city’s power grid for a day. Mix coal, gas, wind, solar and batteries, and keep the lights on with the least CO₂.',
  title:'Power grid: meeting demand around the clock',
  lede:{bio:'A city needs power every minute, day and night. Choose how much of each kind of power plant to build, then watch whether supply keeps up and how much CO₂ it makes.',
        honors:'Add nuclear, hydro and batteries, change the season, and see how intermittent wind and solar change the job of every other plant.',
        ap:'Track thermal efficiency, waste heat and fuel energy in MMBtu, and run the energy arithmetic: megawatts × hours = megawatt-hours.'},
  scale:'A city of about a million people, like the Denver metro’s power needs, peaking near 2,000 MW. One megawatt powers roughly 750 homes.',
  timeScale:2,dtMax:0.05,prewarm:24,sampleDt:0.1,window:24,unit:'h',timeLabel:'Time',chChange:1,chReveal:20,
  clock(sim){const h=hourOf(sim.t),hh=Math.floor(h),mm=Math.floor((h-hh)*60/15)*15,ap=hh>=12?'pm':'am',h12=(hh%12)||12;return 'Day '+(Math.floor(sim.t/24)+1)+' · '+h12+':'+String(mm).padStart(2,'0')+' '+ap;},
  controls:[
    {id:'season',label:'Season',type:'seg',def:'summer',lvl:'honors',options:[{v:'summer',l:'Summer'},{v:'spring',l:'Spring'},{v:'winter',l:'Winter'}]},
    {id:'coal',label:'Coal plants',type:'range',min:0,max:2000,step:50,def:700,unit:' MW',lvl:'bio'},
    {id:'gas',label:'Natural gas plants',type:'range',min:0,max:2000,step:50,def:900,unit:' MW',lvl:'bio'},
    {id:'wind',label:'Wind farms',type:'range',min:0,max:3000,step:50,def:900,unit:' MW',lvl:'bio'},
    {id:'solar',label:'Solar farms',type:'range',min:0,max:3000,step:50,def:600,unit:' MW',lvl:'bio'},
    {id:'nuclear',label:'Nuclear plant',type:'range',min:0,max:1500,step:50,def:0,unit:' MW',lvl:'honors'},
    {id:'hydro',label:'Hydroelectric dam',type:'range',min:0,max:500,step:25,def:100,unit:' MW',lvl:'honors'},
    {id:'battery',label:'Batteries (4-hour)',type:'range',min:0,max:1500,step:50,def:0,unit:' MW',lvl:'honors',help:'Each MW stores 4 MWh, charged from extra power.'},
    {id:'calm',label:'Calm day',help:'Almost no wind',type:'toggle',def:false,lvl:'honors'}
  ],
  init(){return {soc:0,o:null,hist:[],day:[],lastH:-1};},
  step(sim,dt){const s=sim.st;const o=dispatch(sim,sim.t,dt);s.o=o;
    s.soc=clamp(s.soc+(o.charge*0.9-o.bat)*dt,0,sim.p.battery*4);
    s.day.push({t:sim.t,co2:(o.coal*CO2T.coal+o.gas*CO2T.gas)*dt});while(s.day.length&&s.day[0].t<sim.t-24)s.day.shift();
    if(sim.t-s.lastH>=0.1||s.lastH<0&&sim.t<0){s.lastH=sim.t;s.hist.push({t:sim.t,o});while(s.hist.length&&s.hist[0].t<sim.t-24.5)s.hist.shift();}},
  afterPrewarm(sim){sim.st.lastH=-1;},
  metrics:[
    {id:'demand',label:'City demand',unit:'MW',lvl:'bio',min:0,max:2500,d:0,get:s=>s.st.o?s.st.o.D:0},
    {id:'clean',label:'From clean sources',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>{const o=s.st.o;if(!o)return 0;const tot=o.D-o.unmet;return tot>0?100*(o.nuclear+o.hydro+o.wind+o.solar+o.bat)/tot:0;}},
    {id:'co2',label:'CO₂ right now',unit:'t/h',lvl:'bio',min:0,max:2000,d:0,get:s=>{const o=s.st.o;return o?o.coal*CO2T.coal+o.gas*CO2T.gas:0;}},
    {id:'unmet',label:'Power short',unit:'MW',lvl:'bio',min:0,max:2000,d:0,get:s=>s.st.o?s.st.o.unmet:0},
    {id:'day',label:'CO₂ in the last 24 h',unit:'t',lvl:'honors',min:0,max:null,d:0,get:s=>s.st.day.reduce((a,b)=>a+b.co2,0)},
    {id:'fossil',label:'Coal + gas output',unit:'MW',lvl:'honors',min:0,max:2500,d:0,get:s=>s.st.o?s.st.o.coal+s.st.o.gas:0},
    {id:'batout',label:'Battery output',unit:'MW',lvl:'honors',min:0,max:1500,d:0,get:s=>s.st.o?s.st.o.bat:0},
    {id:'soc',label:'Battery charge',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>s.p.battery>0?100*s.st.soc/(s.p.battery*4):0},
    {id:'cost',label:'Average cost',unit:'$/MWh',lvl:'honors',min:0,max:150,d:0,get:s=>{const o=s.st.o;if(!o)return 0;const tot=o.D-o.unmet;return tot>0?(o.coal*COST.coal+o.gas*COST.gas+o.nuclear*COST.nuclear+o.hydro*COST.hydro+o.wind*COST.wind+o.solar*COST.solar+o.bat*COST.bat)/tot:0;}},
    {id:'land',label:'Land for power plants',unit:'km²',lvl:'honors',min:0,max:800,d:0,get:s=>{const p=s.p;return p.coal*LAND.coal+p.gas*LAND.gas+p.nuclear*LAND.nuclear+p.hydro*LAND.hydro+p.wind*LAND.wind+p.solar*LAND.solar+p.battery*LAND.battery;}},
    {id:'heatin',label:'Fuel heat burned',unit:'MW thermal',lvl:'ap',min:0,max:6000,d:0,get:s=>{const o=s.st.o;return o?o.coal/EFF.coal+o.gas/EFF.gas+o.nuclear/EFF.nuclear:0;}},
    {id:'waste',label:'Waste heat',unit:'MW',lvl:'ap',min:0,max:4000,d:0,get:s=>{const o=s.st.o;return o?o.coal*(1/EFF.coal-1)+o.gas*(1/EFF.gas-1)+o.nuclear*(1/EFF.nuclear-1):0;}},
    {id:'btu',label:'Fuel energy',unit:'MMBtu/h',lvl:'ap',min:0,max:20000,d:0,get:s=>{const o=s.st.o;return o?(o.coal/EFF.coal+o.gas/EFF.gas+o.nuclear/EFF.nuclear)*3.412:0;}}
  ],
  graphs:[{id:'mix',label:'Power by source, last 24 hours',custom:true},{id:'co2',label:'CO₂ right now',lines:['co2']},{id:'clean',label:'From clean sources',lines:['clean']},{id:'dem',label:'Demand and power short',lines:['demand','unmet']}],
  defaultGraph:'mix',
  plot(sim,ctx,box){const H=sim.st.hist;const xmax=Math.max(24,sim.t),xmin=xmax-24;
    const ax=axes(ctx,box,{xmin,xmax,ymin:0,ymax:2600,xl:'Time (h)',yl:'Power (MW)'});
    const pts=H.filter(r=>r.t>=xmin-0.11);if(pts.length<2)return;
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    const base=pts.map(()=>0);
    SRC.forEach(src=>{const top=pts.map((r,i)=>base[i]+r.o[src.k]);if(top.every((v,i)=>v-base[i]<0.5)){return;}
      ctx.fillStyle=src.c();ctx.globalAlpha=.85;ctx.beginPath();pts.forEach((r,i)=>{const X=ax.X(r.t),Y=ax.Y(top[i]);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});
      for(let i=pts.length-1;i>=0;i--)ctx.lineTo(ax.X(pts[i].t),ax.Y(base[i]));ctx.closePath();ctx.fill();top.forEach((v,i)=>base[i]=v);});
    ctx.globalAlpha=1;ctx.strokeStyle=PAL.fg;ctx.lineWidth=2.5;ctx.setLineDash([6,4]);ctx.beginPath();pts.forEach((r,i)=>{const X=ax.X(r.t),Y=ax.Y(r.o.D);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.stroke();ctx.setLineDash([]);
    ctx.restore();
    const items=SRC.filter(s=>pts.some(r=>r.o[s.k]>0.5)).map(s=>({l:s.l,c:s.c()})).concat([{l:'Demand',c:PAL.fg,dash:true}]);
    ctx.font='12px '+FONT;let lx=box.L+6,ly=box.T+10;items.forEach(it=>{const w=ctx.measureText(it.l).width+30;if(lx+w>box.L+box.W){lx=box.L+6;ly+=16;}
      if(it.dash){ctx.strokeStyle=it.c;ctx.lineWidth=2.5;ctx.setLineDash([5,3]);ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(lx+14,ly);ctx.stroke();ctx.setLineDash([]);}else{ctx.fillStyle=it.c;ctx.fillRect(lx,ly-5,14,10);}
      txt(ctx,it.l,lx+18,ly,{s:12,c:PAL.muted,b:'middle'});lx+=w;});},
  narrate(sim){const o=sim.st.o;if(!o)return '';const h=hourOf(sim.t),p=sim.p;
    if(o.unmet>1)return `<b>Blackout!</b> The city needs ${fmtNum(o.D,0)} MW but the plants can only supply ${fmtNum(o.D-o.unmet,0)} MW. `+(o.solar<1&&p.solar>0&&(h<7||h>18)?'The sun is down, so the solar farms make nothing.':'Add plants that can run whenever they are needed, or storage.');
    if(o.bat>1)return `<b>Batteries are discharging ${fmtNum(o.bat,0)} MW</b>, energy they stored from extra power earlier, so fewer fossil plants are needed for the evening peak.`;
    if(o.charge>1)return `<b>There is extra power</b>, so batteries are charging at ${fmtNum(o.charge,0)} MW to use later.`;
    if(o.curtail>20)return `<b>Too much power right now.</b> ${fmtNum(o.curtail,0)} MW of wind and solar is being switched off (curtailed), because nothing can store it.`;
    if(p.calm&&p.wind>0)return '<b>No wind today.</b> The turbines sit still, so coal and gas plants ramp up to fill the gap.';
    if(o.solar>50&&o.gas<50)return `It is daytime. Solar is making ${fmtNum(o.solar,0)} MW, so the gas plants can idle and CO₂ drops.`;
    return `Demand is ${fmtNum(o.D,0)} MW. Coal and gas are supplying ${fmtNum(o.coal+o.gas,0)} MW and putting out ${fmtNum(o.coal+o.gas*0.4,0)} tons of CO₂ every hour.`;},
  tour:[
    {title:'The city needs power all the time',text:'Demand changes through the day: low at night, up in the morning, highest in the late afternoon and evening when air conditioners, ovens and TVs are all running. Supply must match it every second.',focus:[610,40,190,310],speed:0.5},
    {title:'Baseload plants',text:'Coal and nuclear plants run steadily because they can’t start and stop quickly. They supply the base of the demand all day and night.',focus:[[380,170,100,250],[270,170,110,250]],speed:0.5},
    {title:'Solar follows the sun',text:'At midday the solar panels are at full output. Watch the gas plant idle and CO₂ fall.',focus:[0,190,160,240],speed:0.4,setup(sim){advanceTo(sim,12.5);}},
    {title:'The evening peak',text:'As the sun sets, demand is at its highest. Gas plants ramp up quickly to fill the gap left by solar. This is the hardest hour for a clean grid.',focus:[[470,170,90,250],[610,40,190,310]],speed:0.4,setup(sim){advanceTo(sim,19.5);}},
    {title:'Wind comes and goes',text:'Wind is often stronger at night, but it can die down for hours. The turbines spin faster when the wind is strong.',focus:[155,90,120,340],speed:1},
    {lvl:'honors',title:'Batteries shift solar into the evening',text:'We just added 1,000 MW of 4-hour batteries. They charge from extra midday solar and discharge in the evening peak, replacing gas.',focus:[[555,240,55,180],[0,190,160,240]],speed:0.6,setup(sim){BioLab.setValues(sim,{battery:1000,solar:2000});BioLab.reset(sim);advanceTo(sim,19);}},
    {lvl:'ap',title:'Where the fuel energy goes',text:'A coal plant turns only about 33% of the fuel’s heat into electricity. The other two-thirds is waste heat released into cooling water and air. Combined-cycle gas plants reach about 55%. Check the fuel heat and waste heat readouts.',focus:[380,90,100,330],speed:0.5}
  ],
  onTourExit(sim){const base={};GRIDMIX.controls.forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'This city runs only on solar panels (3,000 MW of them, no batteries). What happens at 9 pm?',
     choices:['The lights stay on','Blackout, because there is no sunlight at night','The panels saved up enough power for the night'],correct:1,
     baseline:{coal:0,gas:0,wind:0,solar:3000,nuclear:0,hydro:0,battery:0},changeText:'Running into the evening',reveal:21,watch:'unmet',
     explain:'Solar panels only make power while the sun shines. After sunset they produce nothing, and without storage or other plants, the city goes dark. Real grids pair solar with storage and plants that can run any time.'},
    {lvl:'bio',q:'The city shuts down all its coal plants and builds the same amount of natural gas instead. What happens to CO₂?',
     choices:['It goes up','It goes down','It stays the same'],correct:1,
     change:{coal:0,gas:1600},changeText:'Coal replaced with gas',at:2,reveal:14,watch:'co2',
     explain:{bio:'Burning natural gas makes about half as much CO₂ per unit of electricity as burning coal, so emissions drop. Gas is still a fossil fuel, so it does not drop to zero.',
              ap:'Coal emits about 1.0 t CO₂/MWh; a combined-cycle gas plant about 0.4 t/MWh. Gas has more hydrogen per carbon (CH₄ vs. mostly C) and the plants are more efficient (≈55% vs. 33%).'}},
    {lvl:'honors',q:'You add 1,000 MW of 4-hour batteries to a grid with lots of solar. What do they do at 7:30 pm?',
     choices:['Nothing, batteries only work during the day','Supply power stored from extra midday solar','Generate new energy on their own'],correct:1,
     baseline:{solar:2500,wind:600,coal:400,gas:1200,battery:0},change:{battery:1000},at:1,reveal:19.5,watch:'batout',changeText:'1,000 MW of batteries added',
     explain:'Batteries do not make energy. They store extra solar power at midday, when it would otherwise be switched off, and release it during the evening peak. That shifts clean energy to when it is needed and replaces gas.'},
    {lvl:'honors',q:'A calm day: the wind dies down overnight. What fills the gap?',
     choices:['The solar panels','Coal and gas plants ramp up','Nothing, so there is a blackout'],correct:1,
     change:{calm:true},at:1,reveal:6,watch:'fossil',changeText:'The wind stopped',
     explain:'With no wind at night, and no sun either, dispatchable plants that burn fuel must make up the difference. That is why grids with lots of wind still need backup, storage or connections to other regions.'},
    {lvl:'ap',instant:true,q:'A coal plant is 33% efficient. To deliver 1,000 MW of electricity, about how much heat must it get from burning coal?',
     choices:['330 MW','1,000 MW','3,000 MW','33,000 MW'],correct:2,
     explain:'Input = output ÷ efficiency = 1,000 MW ÷ 0.33 ≈ 3,000 MW of heat. About 2,000 MW leaves as waste heat in cooling water and exhaust. That is why power plants need so much cooling water.'},
    {lvl:'ap',instant:true,q:'A 500 MW gas plant runs at full power for 24 hours. How much electrical energy does it produce?',
     choices:['500 MWh','12,000 MWh','20.8 MWh','12 MWh'],correct:1,
     explain:'Energy = power × time = 500 MW × 24 h = 12,000 MWh (12 GWh). At 3,412 BTU per kWh, that is about 41 billion BTU of electricity.'}
  ],
  lab:{bio:'<p><b>Question:</b> How does adding wind and solar change CO₂ from the grid?</p><ol><li>Set coal and gas to 1,000 MW each and wind and solar to 0. Let a full day run and record "CO₂ right now" at noon and at 8 pm.</li><li>Add 1,000 MW of solar and repeat. Then add 1,000 MW of wind and repeat.</li></ol><p>When during the day did solar help most? Why can’t you remove all the gas plants?</p>',
       honors:'<p><b>Question:</b> What is the cleanest grid that never has a blackout, all year?</p><ol><li>Design a mix and run a full day in each season. Record CO₂ in the last 24 h, cost, land and any blackout.</li><li>Try with and without batteries and nuclear.</li></ol><p>Explain the trade-offs between CO₂, cost, land use and reliability.</p>',
       ap:'<p><b>Question:</b> How much fuel energy does a fossil-heavy grid waste?</p><ol><li>Run the default grid to 7 pm. Record fuel heat burned, waste heat and MMBtu per hour.</li><li>Calculate the overall efficiency (electricity ÷ fuel heat) and check it by hand with 33% coal and 55% gas.</li><li>Replace 700 MW of coal with nuclear and repeat.</li></ol><p><b>Claim–evidence–reasoning:</b> Argue which change cuts CO₂ per MWh the most, and discuss thermal pollution from waste heat.</p>'},
  terms:[{t:'Demand',d:'How much electric power customers are using at a moment, in megawatts.'},{t:'Renewable energy',d:'Power from sources that are replaced naturally, like sunlight, wind and flowing water.'},{t:'Fossil fuel',d:'Coal, oil and natural gas, formed from ancient organisms. Burning them releases CO₂.'},{t:'Blackout',d:'When supply cannot meet demand and customers lose power.'},
    {lvl:'honors',t:'Baseload',d:'The minimum demand that is always there, usually met by plants that run steadily.'},{lvl:'honors',t:'Intermittent',d:'Varying with weather and time of day, like wind and solar.'},{lvl:'honors',t:'Capacity factor',d:'Actual output over a year divided by the maximum possible. Solar ≈ 25%, wind ≈ 35%, nuclear ≈ 92%.'},{lvl:'honors',t:'Curtailment',d:'Switching off wind or solar because there is more power than the grid can use or store.'},
    {lvl:'ap',t:'Thermal efficiency',d:'Electricity out ÷ heat in. Coal and nuclear ≈ 33%; combined-cycle gas ≈ 55%.'},{lvl:'ap',t:'Megawatt-hour (MWh)',d:'Energy from 1 MW running for 1 hour. 1 MWh = 3.412 million BTU.'},{lvl:'ap',t:'Thermal pollution',d:'Waste heat released into rivers or lakes, which lowers dissolved oxygen.'}],
  about:'<p>Each moment, the grid first uses nuclear and the minimum output of coal plants (they run at no less than 40% of capacity), then wind and solar. Extra power charges batteries or is curtailed. If more is needed it uses hydro, then batteries, then coal, then gas. Any shortfall is a blackout.</p><p>Solar output follows the sun for the chosen season. Wind varies smoothly with time of day and weather. Demand curves are shaped like a western US city’s. CO₂: coal ≈ 1.0 t/MWh, gas ≈ 0.4 t/MWh. Costs, land use and efficiencies are rounded typical values. Real grid operators also forecast weather, trade power with neighbors and keep reserves, which this model leaves out.</p>',
  initVis(sim){const r=rng(9);sim.vis.dots=[];for(let i=0;i<24;i++)sim.vis.dots.push(r());sim.vis.rot=0;sim.vis.smoke=[];sim.vis.flow=0;},
  draw(sim,ctx,vdt,k,t){const s=sim.st,o=s.o||dispatch(sim,sim.t,0.05),p=sim.p,h=hourOf(sim.t),v=sim.vis;if(!v.dots)GRIDMIX.initVis(sim);
    const sf=sunF(h,p.season),day=clamp(sf/0.25+(h>SEASON[p.season].rise-0.7&&h<SEASON[p.season].set+0.7?0.25:0),0,1);
    const sky=ctx.createLinearGradient(0,0,0,330);sky.addColorStop(0,day>0.5?'#7fb6e6':'#1c2740');sky.addColorStop(1,day>0.5?'#cfe6f7':'#3a4a6b');ctx.fillStyle=sky;ctx.fillRect(0,0,800,330);
    if(day>0.05&&day<=0.5){ctx.fillStyle='rgba(240,140,80,'+(0.35*(1-Math.abs(day-0.3)/0.3))+')';ctx.fillRect(0,0,800,330);}
    // sun or moon on an arc
    const S=SEASON[p.season];if(h>S.rise&&h<S.set){const f=(h-S.rise)/(S.set-S.rise),x=40+f*560,y=280-Math.sin(f*Math.PI)*230;ctx.fillStyle='#f6c12d';ctx.beginPath();ctx.arc(x,y,20,0,6.29);ctx.fill();}
    else{ctx.fillStyle='#e6e8ee';ctx.beginPath();ctx.arc(520,60,14,0,6.29);ctx.fill();ctx.fillStyle='#1c2740';ctx.beginPath();ctx.arc(527,55,13,0,6.29);ctx.fill();}
    // ground
    ctx.fillStyle='#5f8f4e';ctx.fillRect(0,330,800,120);ctx.fillStyle='#4f7a40';ctx.fillRect(0,395,800,55);
    // transmission line to the city
    ctx.strokeStyle='#2b2b2b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(10,300);ctx.lineTo(620,300);ctx.stroke();
    const supply=o.D-o.unmet;v.flow+=vdt*supply/12;for(let i=0;i<14;i++){const x=10+((v.flow+i*44)%610);ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.arc(x,300,3,0,6.29);ctx.fill();}
    const lab=(name,mw,x,on)=>{txt(ctx,name,x,418,{s:11.5*k,w:700,a:'center',c:'#fff'});txt(ctx,on?fmtNum(mw,0)+' MW':'none',x,436,{s:11*k,a:'center',c:'#e8f5ec'});};
    // solar farm
    if(p.solar>0){const rows=clamp(Math.ceil(p.solar/600),1,5);for(let r=0;r<rows;r++)for(let c=0;c<4;c++){const x=18+c*34,y=338+r*11;ctx.fillStyle=sf>0.05?'#3f6fb0':'#24324a';ctx.beginPath();ctx.moveTo(x,y+8);ctx.lineTo(x+6,y);ctx.lineTo(x+32,y);ctx.lineTo(x+26,y+8);ctx.closePath();ctx.fill();
      if(sf>0.1){ctx.fillStyle='rgba(255,255,255,'+(sf*0.45)+')';ctx.fillRect(x+10,y+1,8,2);}}}
    lab('Solar',o.solar,85,p.solar>0);
    // wind turbines
    v.rot+=vdt*6*windF(sim.t,p.season,p.calm)*(p.wind>0?1:0);
    const nt=p.wind>0?clamp(Math.ceil(p.wind/700),1,4):0;for(let i=0;i<nt;i++){const x=175+i*26,y=200+(i%2)*30,tall=330-y;ctx.strokeStyle='#eef0f3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,330);ctx.lineTo(x,y);ctx.stroke();
      for(let j=0;j<3;j++){const a=v.rot+i+j*2.094;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*22,y+Math.sin(a)*22);ctx.stroke();}ctx.fillStyle='#eef0f3';ctx.beginPath();ctx.arc(x,y,3,0,6.29);ctx.fill();}
    lab('Wind',o.wind,215,p.wind>0);
    // nuclear
    if(p.nuclear>0){ctx.fillStyle='#d9dde3';ctx.beginPath();ctx.moveTo(282,330);ctx.quadraticCurveTo(296,280,288,240);ctx.lineTo(322,240);ctx.quadraticCurveTo(314,280,328,330);ctx.closePath();ctx.fill();
      for(let i=0;i<3;i++){ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.arc(305+Math.sin(t+i)*6,225-i*14-((t*10)%14),10+i*3,0,6.29);ctx.fill();}lab('Nuclear',o.nuclear,305,true);}
    // hydro dam
    if(p.hydro>0){ctx.fillStyle='#5b8fd0';ctx.fillRect(340,300,50,30);ctx.fillStyle='#9ca3af';ctx.beginPath();ctx.moveTo(352,330);ctx.lineTo(360,262);ctx.lineTo(372,262);ctx.lineTo(378,330);ctx.closePath();ctx.fill();lab('Hydro',o.hydro,365,true);}
    // coal plant
    const smoke=(x,y,rate,col)=>{if(Math.random()<rate*vdt*3)v.smoke.push({x,y,r:6,a:.75,c:col});};
    if(p.coal>0){ctx.fillStyle='#6b6f76';ctx.fillRect(395,268,70,62);ctx.fillStyle='#55585e';ctx.fillRect(440,170,16,98);ctx.fillStyle='#b91c1c';ctx.fillRect(440,176,16,5);smoke(448,168,o.coal/150,'90,90,95');lab('Coal',o.coal,430,true);}
    if(p.gas>0){ctx.fillStyle='#8a8f98';ctx.fillRect(482,282,62,48);ctx.fillStyle='#71767e';ctx.fillRect(520,232,11,50);smoke(525,230,o.gas/180,'205,210,215');lab('Gas',o.gas,513,true);}
    if(p.battery>0){ctx.fillStyle='#e9edf2';rr(ctx,558,292,44,38,4);ctx.fill();const f=p.battery>0?s.soc/(p.battery*4):0;ctx.fillStyle='#2c7a46';ctx.fillRect(563,325-30*f,34,30*f);ctx.strokeStyle='#555';ctx.lineWidth=1.2;ctx.strokeRect(563,295,34,30);
      lab('Battery',o.bat>0?o.bat:o.charge,580,true);txt(ctx,o.bat>1?'discharging':o.charge>1?'charging':'',580,284,{s:10*k,a:'center',c:'#fff',w:600});}
    v.smoke.forEach(q=>{q.y-=18*vdt;q.x+=10*vdt;q.r+=6*vdt;q.a-=0.18*vdt;});v.smoke=v.smoke.filter(q=>q.a>0);if(v.smoke.length>80)v.smoke.splice(0,v.smoke.length-80);
    v.smoke.forEach(q=>{ctx.fillStyle='rgba('+q.c+','+q.a+')';ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,6.29);ctx.fill();});
    // city
    const lit=o.unmet<1,night=day<0.5;const B=[[630,200,40],[674,150,34],[712,220,30],[746,170,44],[630,250,30]];
    B.forEach((b,i)=>{ctx.fillStyle=night?'#2a3349':'#5b6577';ctx.fillRect(b[0],b[1],b[2],330-b[1]);
      for(let y=b[1]+8;y<322;y+=14)for(let x=b[0]+6;x<b[0]+b[2]-6;x+=10){const on=lit&&(night?v.dots[(x+y)%24]>0.25:v.dots[(x*y)%24]>0.7);ctx.fillStyle=on?'#ffd86b':(night?'#1b2233':'#7b8597');ctx.fillRect(x,y,5,7);}});
    pill(ctx,lit?'City demand '+fmtNum(o.D,0)+' MW':'BLACKOUT: '+fmtNum(o.unmet,0)+' MW short',715,128,lit?PAL.card:'#b91c1c',lit?PAL['cv-ink']:'#fff',12.5*k);
    txt(ctx,'City',715,418,{s:11.5*k,w:700,a:'center',c:'#fff'});
    pill(ctx,GRIDMIX.clock(sim)+' · '+p.season[0].toUpperCase()+p.season.slice(1),120,22,PAL.card,PAL['cv-ink'],12*k);
    const co2=o.coal*CO2T.coal+o.gas*CO2T.gas;pill(ctx,'CO₂ '+fmtNum(co2,0)+' t/h',300,22,PAL.card,PAL['cv-ink'],12*k);}
};
function advanceTo(sim,hour){const d=GRIDMIX;let guard=0;while(hourOf(sim.t)<hour-1e-6&&guard<2000){d.step(sim,0.05);sim.t+=0.05;guard++;}}
BioLab.register(GRIDMIX);
})();
