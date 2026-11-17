(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT}=BioLab.h;

/* What if every car in Colorado were electric? (Raider Labs "what-if" builder, Nov 17 2026)
   One year of driving for Colorado's light-duty fleet, in million metric tons (Mt) of CO2.
   Every assumption is a control, so students can flip it and watch the answer move.

   Sources (all rounded):
   - Fleet: about 4.9 million light-duty vehicles in Colorado. EValuateCO (Colorado Energy Office), early 2025:
     183,000 EVs = 3.76% of light-duty vehicles. Over 210,000 EVs by Oct 2025 (Colorado Energy Office), about 4%.
   - Miles: 11,500 a year per car, EPA's typical passenger vehicle (EPA-420-F-23-014, 2023).
   - Gas car: 8,887 g CO2 per gallon of gasoline (EPA); 22 mpg gives about 404 g per mile, 4.6 t a year (EPA).
   - EV energy: 37.5 kWh per 100 miles, the average of model-year 2023 EVs on fueleconomy.gov (DOE/EPA, as reported by
     the Kansas Legislative Research Department, 2025). It includes charging losses.
   - Grid: Colorado 2023, 1,054 lb CO2/MWh = 0.478 kg/kWh (EIA State Electricity Profile 2023).
     U.S. 2023, 0.81 lb/kWh = 0.367 kg/kWh; coal plants 2.31 lb/kWh = 1.05 kg/kWh (EIA FAQ 74). Wind and solar: 0 at the plant (EIA).
   - Battery factory: about 75 kg CO2 per kWh of battery, the 2022 world average (S&P Global Mobility).
     About 57 kg/kWh on a cleaner grid (NMC cells in Europe) and 90 to 96 on a coal-heavy grid (NMC in China) (batterydesign.net).
     Chalmers University found plants in Kentucky and Poland comparable to Chinese ones.
   - Battery size 70 kWh (typical 60 to 80); life 150,000 miles.
   Range band: gas cars 20 to 25 mpg around the setting, EV energy ×0.85 to ×1.2, battery factory ×0.8 to ×1.25. */
const N=4.9e6,MILES=11500,G_GAL=8887,TODAY=4;
const GRID={co:{l:'Colorado grid (2023)',s:'Colorado',n:'today’s Colorado grid',I:0.478},us:{l:'U.S. average grid (2023)',s:'U.S. average',n:'the U.S. average grid',I:0.367},coal:{l:'All coal',s:'All coal',n:'an all-coal grid',I:1.05},clean:{l:'All wind and solar',s:'Wind and solar',n:'wind and solar power',I:0}};
const FACT={avg:{l:'World average',f:75},clean:{l:'Cleaner grid',f:57},coal:{l:'Coal-heavy grid',f:95}};
const DEF={share:TODAY,grid:'co',factory:'avg',eff:37.5,batt:70,life:150000,mpg:22};
const C_TAIL='#6b7078',C_GRID='#d9822b',C_FACT='#8a5a2b',C_EV='#1b8a4a',C_GAS='#8a8f98';

function calc(p,o){o=o||{};const s=clamp(p.share,0,100)/100,mpg=p.mpg+(o.mpg||0),e=p.eff/100*(o.e||1),I=GRID[p.grid].I,f=FACT[p.factory].f*(o.f||1),years=p.life/MILES;
  const gpm=G_GAL/mpg,tail=(1-s)*N*MILES*gpm/1e12,grid=s*N*MILES*e*I/1e9,fact=s*N*p.batt*f/years/1e9;
  return {s,gpm,tail,grid,fact,total:tail+grid+fact,perGas:MILES*gpm/1e6,perEVgrid:MILES*e*I/1000,perEVfact:p.batt*f/years/1000,perEV:(MILES*e*I+p.batt*f/years)/1000};}
function range(p){const lo=calc(p,{mpg:3,e:0.85,f:0.8}),hi=calc(p,{mpg:-2,e:1.2,f:1.25});return {lo:lo.total,hi:hi.total};}
const todayP=p=>Object.assign({},p,{share:TODAY,grid:'co',factory:'avg'});
const fmt1=v=>v<10?v.toFixed(1):Math.round(v).toString();
const pct=(a,b)=>{const d=Math.round(100*(a-b)/b);return (d>0?'+':d<0?'−':'')+Math.abs(d)+'%';};

/* chart geometry, shared with the Learn it overlays */
const CH={x0:540,y0:356,top:72,max:30,bt:560,bw:70,bx:672,bW:84};
const chY=v=>CH.y0-(CH.y0-CH.top)*clamp(v,0,CH.max)/CH.max;

function car(ctx,x,y,ev,t,i){ctx.fillStyle=ev?C_EV:C_GAS;rr(ctx,x+3,y+9,22,8,3);ctx.fill();rr(ctx,x+8,y+4,11,7,3);ctx.fill();
  ctx.fillStyle='#2b2b2b';ctx.beginPath();ctx.arc(x+8,y+18,2.6,0,6.29);ctx.arc(x+20,y+18,2.6,0,6.29);ctx.fill();
  if(ev){ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x+15,y+9.5);ctx.lineTo(x+12,y+13.5);ctx.lineTo(x+14.5,y+13.5);ctx.lineTo(x+13,y+16.5);ctx.lineTo(x+17,y+12.2);ctx.lineTo(x+14.6,y+12.2);ctx.closePath();ctx.fill();}
  else{const ph=((t*0.9+i*0.37)%1);ctx.fillStyle='rgba(120,120,120,'+(0.45*(1-ph)).toFixed(3)+')';ctx.beginPath();ctx.arc(x+1-ph*6,y+14-ph*5,1.8+ph*2.6,0,6.29);ctx.fill();}}
function smoke(ctx,x,y,amt,t,col){const n=Math.round(1+amt*5);for(let i=0;i<n;i++){const ph=((t*0.35+i/n)%1);ctx.fillStyle=col||'rgba(90,90,90,'+(0.5*(1-ph)*Math.min(1,amt+0.25)).toFixed(3)+')';ctx.beginPath();ctx.arc(x+ph*22,y-ph*34,(3+ph*9)*(0.55+amt*0.6),0,6.29);ctx.fill();}}
function turbine(ctx,x,y,h,t){ctx.strokeStyle='#cfd5dc';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-h);ctx.stroke();ctx.strokeStyle='#e9edf1';ctx.lineWidth=2;
  for(let j=0;j<3;j++){const a=t*1.6+j*2.094;ctx.beginPath();ctx.moveTo(x,y-h);ctx.lineTo(x+Math.cos(a)*h*0.42,y-h+Math.sin(a)*h*0.42);ctx.stroke();}ctx.fillStyle='#9aa3ad';ctx.beginPath();ctx.arc(x,y-h,2.4,0,6.29);ctx.fill();}
function panel(ctx,x,y){ctx.fillStyle='#24426f';ctx.save();ctx.translate(x,y);ctx.transform(1,0,-0.35,1,0,0);ctx.fillRect(0,-14,30,14);ctx.strokeStyle='#8fb0dd';ctx.lineWidth=0.8;for(let i=1;i<3;i++){ctx.beginPath();ctx.moveTo(i*10,-14);ctx.lineTo(i*10,0);ctx.stroke();}ctx.restore();ctx.strokeStyle='#777';ctx.beginPath();ctx.moveTo(x+12,y);ctx.lineTo(x+12,y+8);ctx.stroke();}

const SIM={
  id:'evwhatif',hash:'evwhatif',apUnit:13,order:5,kind:'Simulation',tab:'What if every car were electric?',prereq:['gridmix'],
  card:'Switch Colorado’s 4.9 million cars to electric, then flip the hidden assumptions: the grid, the battery factory and the car itself.',
  title:'What if every car in Colorado were electric?',
  lede:{bio:'Pick how many of Colorado’s cars are electric and what powers the grid, and watch a year of car CO₂ change. Every assumption is a switch you can flip.',
        honors:'Change the EV’s efficiency, the battery size, the gas car’s mpg and how many miles a car lasts, and see which assumptions move the answer most.',
        ap:'Break the answer into tailpipe, power plant and factory emissions, and work each one out from miles, energy per mile and CO₂ per unit of energy.'},
  scale:'One year of driving for about 4.9 million cars and light trucks, each going 11,500 miles. One icon stands for about 49,000 cars.',
  timeless:true,animated:true,graph:false,
  controls:[
    {id:'share',label:'Cars that are electric',type:'range',min:0,max:100,step:1,def:DEF.share,unit:'%',lvl:'bio',help:'About 4% today (over 210,000 EVs, Oct 2025).'},
    {id:'grid',label:'Grid that charges them',type:'select',def:DEF.grid,lvl:'bio',options:Object.keys(GRID).map(k=>({v:k,l:GRID[k].l}))},
    {id:'factory',label:'Where the batteries are made',type:'seg',def:DEF.factory,lvl:'bio',options:Object.keys(FACT).map(k=>({v:k,l:FACT[k].l})),help:'Making a battery uses a lot of electricity, so the factory’s grid matters.'},
    {id:'eff',label:'EV energy use',type:'range',min:25,max:45,step:2.5,def:DEF.eff,unit:' kWh per 100 mi',d:1,lvl:'honors',help:'Small sedans use about 25 to 30; big SUVs and trucks 35 to 45.'},
    {id:'batt',label:'Battery size',type:'range',min:40,max:100,step:10,def:DEF.batt,unit:' kWh',lvl:'honors'},
    {id:'mpg',label:'Gas car fuel economy',type:'range',min:15,max:40,step:1,def:DEF.mpg,unit:' mpg',lvl:'honors'},
    {id:'life',label:'Miles in a car’s life',type:'seg',def:DEF.life,lvl:'honors',options:[{v:100000,l:'100,000'},{v:150000,l:'150,000'},{v:200000,l:'200,000'}]}
  ],
  actions:[{id:'today',label:'Back to today',primary:true,run(sim){BioLab.setValues(sim,Object.assign({},DEF));}}],
  init(){return {};},step(){},
  metrics:[
    {id:'total',label:'Car CO₂ in a year',unit:'million t',lvl:'bio',min:0,max:30,d:1,get:s=>calc(s.p).total},
    {id:'change',label:'Compared with today',unit:'',text:true,lvl:'bio',get:s=>pct(calc(s.p).total,calc(todayP(s.p)).total)},
    {id:'pergas',label:'One gas car, per year',unit:'t',lvl:'bio',min:0,max:8,d:1,get:s=>calc(s.p).perGas},
    {id:'perev',label:'One EV, per year',unit:'t',lvl:'bio',min:0,max:8,d:1,get:s=>calc(s.p).perEV},
    {id:'band',label:'Range',unit:'',text:true,lvl:'honors',get:s=>{const r=range(s.p);return fmt1(r.lo)+' to '+fmt1(r.hi)+' million t';}}
  ],
  narrate(sim){const p=sim.p,c=calc(p),t=calc(todayP(p)),g=GRID[p.grid];
    if(c.s===0)return 'Every car burns gasoline: about <b>'+fmt1(c.total)+' million tons</b> of CO₂ a year, all from tailpipes.';
    let s='With <b>'+Math.round(c.s*100)+'%</b> of cars electric on '+g.n+', car CO₂ is about <b>'+fmt1(c.total)+' million tons</b> a year, '+pct(c.total,t.total)+' compared with today. ';
    s+=c.perEV<c.perGas?'Each EV makes about '+c.perEV.toFixed(1)+' t a year, less than a gas car’s '+c.perGas.toFixed(1)+' t.':'Each EV makes about '+c.perEV.toFixed(1)+' t a year, <b>no less than a gas car’s '+c.perGas.toFixed(1)+' t</b>: the CO₂ moved from the tailpipe to the power plant.';
    return s;},
  draw(sim,ctx,vdt,k,t){const p=sim.p,c=calc(p),K=Math.min(k,1.3),g=GRID[p.grid],F=FACT[p.factory];
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // cars: 100 icons
    txt(ctx,'Colorado’s cars (1 icon ≈ 49,000)',24,26,{s:12.5*K,w:700,c:PAL['cv-ink']});
    const nEV=Math.round(c.s*100);for(let i=0;i<100;i++){const cx=24+(i%10)*30,cy=36+Math.floor(i/10)*28;car(ctx,cx,cy,i<nEV,t,i);}
    // one car each
    const by=330;txt(ctx,'One car’s CO₂ in a year',24,by,{s:12.5*K,w:700,c:PAL['cv-ink']});
    const sx=v=>clamp(v,0,8)/8*200;
    ctx.fillStyle=C_TAIL;rr(ctx,104,by+12,Math.max(2,sx(c.perGas)),16,3);ctx.fill();txt(ctx,'Gas car',24,by+25,{s:12*K,c:PAL['cv-ink']});txt(ctx,c.perGas.toFixed(1)+' t',110+sx(c.perGas),by+25,{s:12*K,w:700,c:PAL['cv-ink']});
    ctx.fillStyle=C_GRID;rr(ctx,104,by+38,Math.max(2,sx(c.perEVgrid)),16,3);ctx.fill();ctx.fillStyle=C_FACT;rr(ctx,104+sx(c.perEVgrid),by+38,Math.max(2,sx(c.perEVfact)),16,3);ctx.fill();
    txt(ctx,'EV',24,by+51,{s:12*K,c:PAL['cv-ink']});txt(ctx,c.perEV.toFixed(1)+' t',110+sx(c.perEV),by+51,{s:12*K,w:700,c:PAL['cv-ink']});
    txt(ctx,'charging + its battery, spread over its life',104,by+72,{s:11*K,c:PAL['cv-soft']});
    // the grid
    const gx=350,gy=170;ctx.fillStyle=PAL['cv-bench']||'#d8cbb3';ctx.fillRect(gx-8,gy,170,4);
    txt(ctx,'Power for charging',gx,26,{s:12.5*K,w:700,c:PAL['cv-ink']});
    if(p.grid==='clean'){turbine(ctx,gx+30,gy,80,t);turbine(ctx,gx+78,gy,64,t+0.7);panel(ctx,gx+112,gy-4);panel(ctx,gx+128,gy-20);}
    else{const amt=g.I/1.05;ctx.fillStyle='#7d8590';ctx.fillRect(gx+18,gy-52,62,52);ctx.fillStyle='#5d636c';ctx.fillRect(gx+84,gy-96,14,96);smoke(ctx,gx+91,gy-100,amt,t);
      if(p.grid!=='coal'){turbine(ctx,gx+128,gy,70,t);if(p.grid==='co')turbine(ctx,gx+152,gy,52,t+0.5);}}
    txt(ctx,g.I===0?'0 kg CO₂ per kWh at the plant':g.I.toFixed(2)+' kg CO₂ per kWh',gx,gy+20,{s:11.5*K,c:PAL['cv-ink']});
    if(nEV>0){ctx.save();ctx.strokeStyle=C_GRID;ctx.setLineDash([4,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(gx+10,gy-20);ctx.lineTo(328,gy-20);ctx.stroke();ctx.restore();}
    // the battery factory
    const fy=338;txt(ctx,'Making the batteries',gx,fy-92,{s:12.5*K,w:700,c:PAL['cv-ink']});
    ctx.fillStyle='#9b8b78';ctx.beginPath();ctx.moveTo(gx+10,fy);ctx.lineTo(gx+10,fy-34);for(let j=0;j<4;j++){ctx.lineTo(gx+10+j*24+12,fy-48);ctx.lineTo(gx+10+(j+1)*24,fy-34);}ctx.lineTo(gx+106,fy);ctx.closePath();ctx.fill();
    ctx.fillStyle='#6f6253';ctx.fillRect(gx+118,fy-66,10,66);if(nEV>0)smoke(ctx,gx+123,fy-70,F.f/95*Math.min(1,0.35+c.s),t);
    ctx.fillStyle='#2f6f4f';rr(ctx,gx+40,fy-26,30,16,3);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(gx+70,fy-21,3,6);
    txt(ctx,F.f+' kg CO₂ per kWh of battery',gx,fy+18,{s:11.5*K,c:PAL['cv-ink']});
    // the chart
    txt(ctx,'Car CO₂ in a year',CH.x0,26,{s:12.5*K,w:700,c:PAL['cv-ink']});txt(ctx,'million metric tons',CH.x0,42,{s:11*K,c:PAL['cv-soft']});
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(CH.x0,CH.top-6);ctx.lineTo(CH.x0,CH.y0);ctx.lineTo(790,CH.y0);ctx.stroke();
    for(let v=0;v<=CH.max;v+=10){const y=chY(v);ctx.beginPath();ctx.moveTo(CH.x0-4,y);ctx.lineTo(CH.x0,y);ctx.stroke();txt(ctx,String(v),CH.x0-7,y+4,{s:11*K,a:'right',c:PAL['cv-soft']});}
    const td=calc(todayP(p));// today: outline only
    ctx.save();ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.strokeRect(CH.bt,chY(td.total),CH.bw,CH.y0-chY(td.total));ctx.restore();
    txt(ctx,'Today',CH.bt+CH.bw/2,CH.y0+16,{s:12*K,w:700,a:'center',c:PAL['cv-ink']});txt(ctx,fmt1(td.total),CH.bt+CH.bw/2,chY(td.total)-6,{s:12*K,a:'center',c:PAL['cv-ink']});
    let yb=CH.y0;[[c.tail,C_TAIL],[c.grid,C_GRID],[c.fact,C_FACT]].forEach(([v,col])=>{const y=chY(v+(CH.y0-yb)/(CH.y0-CH.top)*CH.max);if(v>0){ctx.fillStyle=col;ctx.fillRect(CH.bx,y,CH.bW,yb-y);}yb=y;});
    if(atLeast('honors')||sim._showRange){const r=range(p),x=CH.bx+CH.bW+12;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x,chY(r.lo));ctx.lineTo(x,chY(r.hi));ctx.moveTo(x-4,chY(r.lo));ctx.lineTo(x+4,chY(r.lo));ctx.moveTo(x-4,chY(r.hi));ctx.lineTo(x+4,chY(r.hi));ctx.stroke();}
    txt(ctx,'What if',CH.bx+CH.bW/2,CH.y0+16,{s:12*K,w:700,a:'center',c:PAL['cv-ink']});txt(ctx,fmt1(c.total)+'  ('+pct(c.total,td.total)+')',CH.bx+CH.bW/2,chY(c.total)-6,{s:12.5*K,w:700,a:'center',c:PAL['cv-ink']});
    [['Tailpipes',C_TAIL],['Power plants',C_GRID],['Battery factories',C_FACT]].forEach(([l,col],i)=>{const y=CH.y0+34+i*16;ctx.fillStyle=col;ctx.fillRect(CH.x0+4,y-9,11,11);txt(ctx,l,CH.x0+20,y,{s:11.5*K,c:PAL['cv-ink']});});
  },
  thumbSetup(sim){BioLab.setValues(sim,{share:60});},
  lab:{bio:'<p><b>Question:</b> What would it take for Colorado’s cars to make half as much CO₂ as today?</p><ol><li>Press “Back to today” and record the total.</li><li>Raise the share of electric cars in steps of 25%. Record the total each time on the Colorado grid.</li><li>Repeat on the U.S. average grid and on all wind and solar.</li></ol><p>Which matters more, how many cars are electric or what charges them? Use your numbers.</p>',
       honors:'<p><b>Question:</b> Which assumption moves the answer most?</p><ol><li>Set 100% electric on the Colorado grid and record the total.</li><li>Change one assumption at a time to its other extreme (grid, factory, EV energy use, battery size, gas mpg, life), record the total, then set it back.</li><li>Rank the assumptions by how much each one changed the total.</li></ol><p>Write a claim about which assumption a policy maker should check first, with evidence from your ranking.</p>',
       ap:'<p><b>Question:</b> At what grid intensity does an EV stop beating a gas car?</p><ol><li>For one car, write CO₂ per year for a gas car: miles × 8,887 g ÷ mpg.</li><li>For one EV: miles × kWh per mile × grid intensity + battery kWh × factory kg/kWh ÷ years of life.</li><li>Set the two equal and solve for the grid intensity. Check your answer against the model’s all-coal setting.</li></ol><p>Explain why the break-even point depends on the gas car’s mpg.</p>'},
  terms:[{t:'Electric vehicle (EV)',d:'A car that runs only on electricity stored in a battery.'},{t:'Grid intensity',d:'Kilograms of CO₂ released for each kilowatt-hour of electricity. Colorado’s was about 0.48 in 2023.'},
    {t:'Tailpipe emissions',d:'Gases that come out of a gas car’s exhaust as it burns fuel.'},{lvl:'honors',t:'Life-cycle emissions',d:'All the emissions from making, running and disposing of a product, not only from using it.'},
    {lvl:'honors',t:'Assumption',d:'Something a model takes as true without proving it. Change it and the answer can change.'},{lvl:'ap',t:'Break-even point',d:'The value where two options come out equal.'}],
  about:'<p>One year for Colorado’s about 4.9 million cars and light trucks, each driving 11,500 miles (EPA’s typical vehicle). Gas car: miles × 8,887 g CO₂ per gallon ÷ mpg (EPA); 22 mpg gives about 404 g per mile and 4.6 t a year. EV: miles × kWh per mile × grid intensity, plus the battery’s factory CO₂ spread over the car’s life. EV energy use defaults to 37.5 kWh per 100 miles, the model-year 2023 average on fueleconomy.gov, which includes charging losses.</p><p>Grid intensity: Colorado 2023, 0.478 kg CO₂ per kWh (EIA State Electricity Profile); U.S. 2023, 0.367; coal plants, 1.05 (EIA); wind and solar, 0 at the plant. Battery factory: 75 kg CO₂ per kWh of battery (2022 world average, S&P Global Mobility); about 57 on a cleaner grid and 90 to 96 on a coal-heavy grid (batterydesign.net). Fleet size from EValuateCO (Colorado Energy Office): 183,000 EVs were 3.76% of light-duty vehicles in early 2025. Today’s 4% uses the Energy Office’s 210,000 EVs (Oct 2025).</p><p><b>What this model leaves out:</b> drilling, refining and shipping gasoline (which adds to gas cars); mining for and building the rest of each car (both); tire and brake dust (both, a little more for heavier EVs); recycling batteries; and smog-forming gases released near where people breathe. The range band shows gas cars at 20 to 25 mpg around your setting, EV energy use 15% lower to 20% higher, and battery factories 20% cleaner to 25% dirtier.</p>',
  challenges:[
    {lvl:'bio',instant:true,q:'Every car in Colorado is electric, but every one is charged from coal plants. Compared with today, car CO₂ is…',
     choices:['about the same, even a little higher','about half of what it is today','close to zero, since EVs have no tailpipe'],correct:0,baseline:{share:100,grid:'coal'},
     explain:'Coal plants release about 1.05 kg of CO₂ for every kWh. An EV using 37.5 kWh per 100 miles then makes about 4.5 t a year from charging, plus its battery, a bit more than a gas car’s 4.6 t. The CO₂ moved from the tailpipe to the power plant.'},
    {lvl:'bio',instant:true,q:'All cars are electric on the Colorado grid. Which single change cuts car CO₂ the most?',
     choices:['Charge all cars from wind and solar','Build all batteries on a cleaner grid','Make every battery 10 kWh smaller'],correct:0,baseline:{share:100},
     explain:'Charging is most of an EV’s CO₂: about 2.1 t a year on Colorado’s grid, compared with about 0.4 t a year for its battery. Wind and solar remove the biggest slice; a cleaner factory or a smaller battery trims the smaller one.'},
    {lvl:'honors',instant:true,q:'An EV uses 37.5 kWh per 100 miles and goes 11,500 miles a year on a grid at 0.48 kg CO₂ per kWh. About how much CO₂ does charging make in a year?',
     choices:['about 2 metric tons','about 5 metric tons','about 0.2 metric tons'],correct:0,
     explain:'11,500 miles × 0.375 kWh per mile = 4,313 kWh. 4,313 kWh × 0.48 kg per kWh ≈ 2,070 kg, about 2.1 metric tons, less than half of a typical gas car’s 4.6 t.'}
  ]
};
BioLab.register(SIM);

BioLab.addPractical({evwhatif:{
  hook:'What if every one of Colorado’s 4.9 million cars were electric, charged from today’s Colorado grid? Would car CO₂ drop to zero, drop by half, or barely change?',
  hookSet:{share:100},
  answer:'It drops by about half, from about 22 million tons a year to about 12. The tailpipes go quiet, but the power plants that charge the cars and the factories that build the batteries still make CO₂. On an all-coal grid the drop disappears (about 24 million tons); on wind and solar it falls to about 2.',
  takeaway:'An electric car is only as clean as the grid that charges it and the factory that builds its battery. A what-if answer depends on its assumptions, so flip each one before you trust the number.',
  uses:['Colorado’s plan counts on both at once: nearly a million EVs on the road by 2030 and a cleaner grid (Colorado Energy Office).',
    'The same EV is cleaner in a state with more wind and solar, which is why studies of EVs report results state by state.',
    'Battery makers in Europe must report each battery’s carbon footprint, the factory slice in this model (EU battery rules).']
}});

/* ---------- Learn it (kept in this file so it never collides with the shared learn.js) ---------- */
const H=BioLab.h;
const ease=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
function TK(){const c=(PAL['cv-bg']||'#fff').replace('#','');if(c.length>=6){const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);if((r*0.3+g*0.59+b*0.11)<110)return '#ec74da';}return '#a8178f';}
function tag(ctx,s,x,y,k,o){o=o||{};const sz=(o.s||15)*k;ctx.font=(o.w||600)+' '+sz+'px '+FONT;const w=ctx.measureText(s).width+sz*1.1,h=sz*1.9;
  ctx.save();rr(ctx,x-w/2,y-h/2,w,h,7);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.lineWidth=o.hi?2.5:1.2;ctx.strokeStyle=o.hi?'#c8102e':(o.c||PAL['cv-soft']);ctx.stroke();
  txt(ctx,s,x,y+1,{s:sz,w:o.w||600,c:o.c||PAL['cv-ink'],a:'center',b:'middle'});ctx.restore();}
function badge(ctx,kind,label,k,tau,pos){k=Math.min(k,1.3);const sz=12.5*k;ctx.save();ctx.font='700 '+sz+'px '+FONT;const tw=ctx.measureText(label).width,ic=22*k,w=tw+ic+sz*1.6,h=sz*2.2;let x=pos.right!=null?pos.right-w:pos.x,y=pos.y;
  rr(ctx,x,y,w,h,h/2);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=TK();ctx.stroke();const cx=x+sz*0.7+ic/2,cy=y+h/2;ctx.strokeStyle=TK();ctx.fillStyle=TK();ctx.lineWidth=1.8;
  if(kind==='assume'){const f=ease(clamp(((tau||0)-0.4)/0.5,0,1)),sw=20*k,sh=11*k;rr(ctx,cx-sw/2,cy-sh/2,sw,sh,sh/2);ctx.globalAlpha=0.25+0.75*f;ctx.fill();ctx.globalAlpha=1;ctx.stroke();ctx.beginPath();ctx.arc(cx-sw/2+sh/2+f*(sw-sh),cy,sh/2-1.5,0,6.29);ctx.fillStyle='#fff';ctx.fill();ctx.stroke();}
  else if(kind==='spread'){ctx.globalAlpha=0.3;ctx.fillRect(cx-9*k,cy-3*k,18*k,6*k);ctx.globalAlpha=1;[-7,-2,1,6].forEach((d,i)=>{ctx.beginPath();ctx.arc(cx+d*k,cy+(i%2?-2:2)*k,2*k,0,6.29);ctx.fill();});}
  else{[-5,5].forEach(d=>{ctx.strokeRect(cx+d*k-2.5*k,cy-7*k,5*k,13*k);});}
  txt(ctx,label,x+sz*0.7+ic+sz*0.4,cy+1,{s:sz,w:700,c:TK(),b:'middle'});ctx.restore();}
function pickHTML(key,q,choices){return '<span class="think-pick" data-pick="'+key+'" role="group" aria-label="Your guess" style="display:block;margin-top:8px"><b style="color:'+TK()+'">'+q+'</b><br>'+choices.map(([v,l])=>'<button type="button" class="btn" data-pv="'+v+'" aria-pressed="false" style="border:2px solid '+TK()+';color:'+TK()+';background:transparent;margin:6px 8px 0 0">'+l+'</button>').join('')+'</span>';}
function pickSync(sim){const b0=sim.ui&&sim.ui.tourbar;if(!b0)return;b0.querySelectorAll('[data-pick]').forEach(g=>{const v=(sim._picks||{})[g.dataset.pick];g.querySelectorAll('[data-pv]').forEach(b=>{const on=b.dataset.pv===v;b.setAttribute('aria-pressed',String(on));b.style.background=on?TK():'transparent';b.style.color=on?'#fff':TK();});});}
function pickWire(sim){if(!sim._pickWired&&sim.ui&&sim.ui.tourbar){sim._pickWired=true;sim.ui.tourbar.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-pv]');if(!b)return;const g=b.closest('[data-pick]');sim._picks=sim._picks||{};sim._picks[g.dataset.pick]=b.dataset.pv;pickSync(sim);});}setTimeout(()=>pickSync(sim),0);}
const GUESS={zero:['close to zero',0.05],half:['about half',0.5],same:['about the same',1],up:['higher',1.2]};
function guessLine(sim,ctx,k){const g=(sim._picks||{}).ev;if(!g)return;const td=calc(todayP(sim.p)).total,v=td*GUESS[g][1],y=chY(v),x0=CH.bx-8,x1=CH.bx+CH.bW+8;
  ctx.save();ctx.setLineDash([6,4]);ctx.strokeStyle=TK();ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();ctx.restore();
  tag(ctx,'Your guess: '+GUESS[g][0]+(g==='half'?'  ✓':'  ✗'),668,y-16<70?y+18:y-16,Math.min(k,1.1),{s:12,c:TK()});}
const RIGHT={x:18,y:412};

BioLab.addLearn({evwhatif:{
  goals:{bio:['Where an electric car’s CO₂ comes from, even with no tailpipe','Why the grid that charges a car matters as much as the car','How to test a what-if answer by flipping its assumptions','Why a good answer is a range, not one number'],
    honors:['How to build a car’s yearly CO₂ from miles, energy per mile and CO₂ per unit of energy','Which assumptions move the answer most','Why a good answer is a range, not one number','What a model like this leaves out'],
    ap:['How to compare tailpipe, power plant and factory emissions on one scale','How to find the grid intensity where an EV stops beating a gas car','Why a good answer is a range, not one number','What a model like this leaves out']},
  matters:'Cars are one of Colorado’s biggest sources of CO₂, and the state is betting on electric cars to cut it. You will choose cars yourself soon. Knowing which numbers decide the answer lets you check claims from anyone, for or against.',
  question:'What if every one of Colorado’s 4.9 million cars were electric, charged from today’s Colorado grid? Would car CO₂ drop to zero, drop by half, or barely change?',
  startKey:'today',startRun:true,
  steps:[
    {key:'today',title:'Today',base:DEF,fresh:true,
      see:'One hundred cars stand for Colorado’s 4.9 million. Four are electric (green). The dashed bar is today’s car CO₂: about 22 million tons a year, almost all from tailpipes.',
      why:'A gas car burns about one gallon every 22 miles, and every gallon makes about 8.9 kg of CO₂. Driving 11,500 miles a year, that is about 4.6 t per car.'+pickHTML('ev','Your guess before the next step: if every car were electric, on today’s Colorado grid, car CO₂ would be…',[['zero','close to zero'],['half','about half'],['same','about the same'],['up','higher']]),
      run(sim){pickWire(sim);},
      overlay(sim,ctx,LH,k){tag(ctx,'4 of 100 cars are EVs',170,320,Math.min(k,1.1),{s:12});}},
    {key:'all',title:'Every car electric',base:DEF,set:{share:100},fresh:true,
      see:'All 100 cars turn green and the gray tailpipe slice disappears. Two new slices appear: power plants charging the cars (orange) and factories building the batteries (brown). The total is about 12 million tons, about half of today.',
      why:'An EV has no tailpipe, but its electricity has to be made somewhere. In 2023, Colorado’s power plants released about 0.48 kg of CO₂ for every kWh, so each EV makes about 2.1 t a year from charging plus about 0.4 t for its battery.',
      overlay(sim,ctx,LH,k){guessLine(sim,ctx,k);}},
    {key:'coal',title:'Flip the grid: all coal',base:DEF,set:{share:100,grid:'coal'},fresh:true,
      see:'Same cars, but every one is charged from coal plants. The orange slice grows until the bar is taller than today’s: about 24 million tons.',
      why:'Coal plants release about 1.05 kg of CO₂ per kWh, more than twice Colorado’s grid. “EVs cut CO₂ by half” had a hidden assumption: a grid like Colorado’s. Change the grid and the answer changes.',
      overlay(sim,ctx,LH,k,tau){badge(ctx,'assume','Hidden assumption: the grid',k,tau,RIGHT);}},
    {key:'clean',title:'Flip it again: wind and solar',base:DEF,set:{share:100,grid:'clean'},fresh:true,
      see:'Now every car charges from wind and solar. The orange slice vanishes and only the brown battery slice is left: about 2 million tons, about a tenth of today.',
      why:'Wind turbines and solar panels make electricity without burning anything, so charging adds no CO₂ at the plant. This is why Colorado is cleaning up its grid and switching cars at the same time: each change makes the other one count for more.',
      overlay(sim,ctx,LH,k,tau){badge(ctx,'assume','Hidden assumption: the grid',k,tau,RIGHT);}},
    {key:'factory',title:'Where the batteries are made',base:DEF,set:{share:100,factory:'coal'},fresh:true,
      see:'Back to the Colorado grid, with every battery built in factories on a coal-heavy grid. The brown slice grows by about a quarter, but it is still small next to charging.',
      why:'Making a battery uses a lot of electricity, so a factory on a coal-heavy grid (much of China’s today, and some plants in Poland and Kentucky) makes more CO₂ per battery. Spread over 13 years of driving, it adds about half a ton a year per car.',
      overlay(sim,ctx,LH,k,tau){badge(ctx,'assume','Hidden assumption: the factory',k,tau,RIGHT);}},
    {key:'range',title:'A range, not one number',base:DEF,set:{share:100},fresh:true,run(sim){sim._showRange=true;},
      see:'The black bar beside the total shows the range: somewhere between about 10 and 15 million tons, depending on how efficient the real cars and batteries turn out to be.',
      why:'Real gas cars get anywhere from about 20 to 25 mpg, real EVs use more or less energy, and factories differ. One number like “12.1” looks exact, but the honest answer is a range. If two choices have ranges that overlap, the model can’t tell them apart.',
      overlay(sim,ctx,LH,k,tau){badge(ctx,'spread','One number or a range?',k,tau,RIGHT);}},
    {key:'leaves',title:'What this model leaves out',base:DEF,set:{share:100},fresh:true,run(sim){sim._showRange=false;},
      see:'The dashed boxes are things the model doesn’t count: some would make gas cars look worse, some would make EVs look worse, and some hit both.',
      why:'Every model leaves things out. Before you trust a what-if answer, ask what it skipped and which way each missing piece would push it. Here the missing pieces mostly push in opposite directions, so the half-as-much answer holds up, but it is not exact.',
      overlay(sim,ctx,LH,k,tau){const K=Math.min(k,1.1);ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(338,8,180,400);txt(ctx,'Not in the model',346,26,{s:12.5*K,w:700,c:TK()});
        [['Drilling, refining fuel','would raise gas cars'],['Tire and brake dust','both, EVs a bit more'],['Building the rest of a car','both'],['Recycling old batteries','would lower EVs']].forEach(([a,b],i)=>{const y=40+i*78;
          ctx.save();ctx.setLineDash([5,4]);ctx.strokeStyle=TK();ctx.lineWidth=1.8;ctx.fillStyle=PAL['cv-sol'];rr(ctx,342,y,172,60,8);ctx.fill();ctx.stroke();ctx.restore();
          txt(ctx,a,352,y+25,{s:12*K,w:700,c:PAL['cv-ink']});txt(ctx,b,352,y+46,{s:11.5*K,c:TK()});});
        badge(ctx,'compare','What this leaves out',k,tau,RIGHT);}}
  ],
  useIt:[
    {do:'Before you compare two cars, look both up on fueleconomy.gov.',why:'It lists each EV’s kWh per 100 miles and each gas car’s mpg, the two numbers that decide most of this model (U.S. Department of Energy and EPA).'},
    {do:'Ask what powers the grid where a car will be charged.',why:'In 2023 Colorado’s power plants averaged about 0.48 kg of CO₂ per kWh, and the U.S. average was about 0.37 (EIA). The same EV makes more or less CO₂ depending on that one number.'},
    {do:'When someone gives you one exact number for a what-if, ask for the range and what was left out.',why:'Changing a single assumption in this model moves the answer from about 2 to about 24 million tons.'}
  ],
  tryIt:[
    {title:'your family car’s CO₂ (10 minutes)',
      steps:['Find your family car’s combined mpg on fueleconomy.gov (or on the window sticker).','Estimate the miles it drives in a year: check the odometer twice, a month apart, and multiply by 12.','Work out CO₂ in tons: miles × 8,887 ÷ mpg ÷ 1,000,000.'],
      look:'Compare it with the typical car’s 4.6 t. A car that gets 30 mpg and drives 10,000 miles makes about 3 t; one at 15 mpg and 15,000 miles makes about 8.9 t.'}
  ]
}});
})();
