(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,fmtNum}=BioLab.h;

const GRID={colorado:0.50,us:0.37,renew:0.02};
const DIET={meat:3.3,avg:2.5,veg:1.7,vegan:1.5};
const STUFF={high:4.0,avg:3.0,low:1.8};
const SERVICES=2.5, KG_GAL=8.89, KG_THERM=5.3, KWH_THERM=29.3, FLIGHT_MI=2000, KG_AIRMI=0.2, EV_KWH_MI=0.30;
const US=15, WORLD=4.7, TARGET=2;
const DEF={miles:120,mpg:25,car:'gas',flights:1,kwh:700,people:4,grid:'colorado',heat:'gas',thermo:68,diet:'avg',stuff:'avg'};

/* Footprint in tons CO2e per year for one person. */
function fp(p){p=Object.assign({},DEF,p);const mi=p.miles*52;
  let car;if(p.car==='ev')car=mi*EV_KWH_MI*GRID[p.grid]/1000;else car=mi/(p.mpg*(p.car==='hybrid'?1.6:1))*KG_GAL/1000;
  const fly=p.flights*FLIGHT_MI*KG_AIRMI/1000;
  const elec=p.kwh*12/p.people*GRID[p.grid]/1000;
  const therms=650*(1+0.03*(p.thermo-68))/p.people;
  const heat=p.heat==='hp'?therms*KWH_THERM/3*GRID[p.grid]/1000:therms*KG_THERM/1000;
  const food=DIET[p.diet],stuff=STUFF[p.stuff];
  const o={car,fly,elec,heat,food,stuff,svc:SERVICES};o.transport=car+fly;o.home=elec+heat;o.total=o.transport+o.home+food+stuff+SERVICES;return o;}
const CATS=[{id:'transport',l:'Getting around',c:'s1'},{id:'home',l:'Home energy',c:'s4'},{id:'food',l:'Food',c:'s3'},{id:'stuff',l:'Stuff and waste',c:'s5'},{id:'svc',l:'Shared services',c:'s6'}];
function ideas(p){const base=fp(p).total,out=[];const add=(l,ch)=>{const s=base-fp(Object.assign({},p,ch)).total;if(s>0.005)out.push({l,ch,s});};
  if(p.car!=='ev')add('Switch to an electric car',{car:'ev'});
  if(p.miles>=40)add('Drive 25% less',{miles:Math.round(p.miles*0.75/10)*10});
  if(p.flights>0)add('Skip one round-trip flight',{flights:p.flights-1});
  if(p.diet==='meat'||p.diet==='avg')add('Eat vegetarian',{diet:'veg'});
  if(p.grid!=='renew')add('Buy 100% renewable electricity',{grid:'renew'});
  if(p.heat==='gas')add('Heat with a heat pump',{heat:'hp'});
  if(p.thermo>=65)add('Turn the thermostat down 3 °F',{thermo:p.thermo-3});
  if(p.stuff!=='low')add('Buy less, waste less',{stuff:'low'});
  add('Switch every bulb to LED',{kwh:Math.max(200,Math.round(p.kwh*0.92/50)*50)});
  return out.sort((a,b)=>b.s-a.s);}

const FOOT={
  id:'footprint',hash:'footprint',apUnit:13,order:2,kind:'Learning tool',tab:'Carbon footprint',
  card:'Add up the CO₂ from your driving, flights, home, food and stuff, then find the change that cuts the most.',
  title:'Carbon footprint calculator',
  lede:{bio:'Every gallon of gas, kilowatt-hour and meal adds CO₂ to the air. Set up a typical year and see where your carbon comes from.',
        honors:'Compare categories, test what-if changes, and see why the same heat pump or electric car is cleaner on a cleaner grid.',
        ap:'Show the arithmetic: gallons × 8.89 kg CO₂, kilowatt-hours × grid intensity, therms × 5.3 kg. Compare against US and world per-capita emissions.'},
  scale:'One person’s year, in metric tons of CO₂-equivalent. One ton of CO₂ would fill a cube about 8 m (26 ft) on each side.',
  timeless:true,animated:true,
  controls:[
    {id:'miles',label:'Car miles per week',type:'range',min:0,max:400,step:10,def:DEF.miles,unit:' mi',lvl:'bio'},
    {id:'mpg',label:'Car fuel economy',type:'range',min:15,max:50,step:1,def:DEF.mpg,unit:' mpg',lvl:'bio'},
    {id:'car',label:'Car type',type:'seg',def:DEF.car,lvl:'honors',options:[{v:'gas',l:'Gas'},{v:'hybrid',l:'Hybrid'},{v:'ev',l:'Electric'}]},
    {id:'flights',label:'Round-trip flights per year',type:'range',min:0,max:6,step:1,def:DEF.flights,unit:'',lvl:'bio',help:'Each one about 2,000 miles, like Denver to Chicago and back.'},
    {id:'kwh',label:'Home electricity',type:'range',min:200,max:1500,step:50,def:DEF.kwh,unit:' kWh/mo',lvl:'bio',help:'For the whole household. A typical US home uses about 860 kWh a month.'},
    {id:'people',label:'People in your home',type:'range',min:1,max:6,step:1,def:DEF.people,unit:'',lvl:'honors'},
    {id:'grid',label:'Where your electricity comes from',type:'seg',def:DEF.grid,lvl:'bio',options:[{v:'colorado',l:'Colorado grid'},{v:'us',l:'US average',lvl:'honors'},{v:'renew',l:'100% renewable'}]},
    {id:'heat',label:'Home heating',type:'seg',def:DEF.heat,lvl:'honors',options:[{v:'gas',l:'Gas furnace'},{v:'hp',l:'Electric heat pump'}]},
    {id:'thermo',label:'Winter thermostat',type:'range',min:60,max:76,step:1,def:DEF.thermo,unit:' °F',lvl:'honors'},
    {id:'diet',label:'Diet',type:'seg',def:DEF.diet,lvl:'bio',options:[{v:'meat',l:'Meat most meals'},{v:'avg',l:'Average'},{v:'veg',l:'Vegetarian'},{v:'vegan',l:'Vegan'}]},
    {id:'stuff',label:'Shopping and waste',type:'seg',def:DEF.stuff,lvl:'bio',options:[{v:'high',l:'A lot'},{v:'avg',l:'Average'},{v:'low',l:'Little'}]}
  ],
  actions:[{id:'default',label:'Back to a typical student',run(sim){BioLab.setValues(sim,DEF);}}],
  init(){return {};},
  step(){},
  metrics:[
    {id:'total',label:'Your footprint',unit:'t CO₂e/yr',lvl:'bio',min:0,max:30,d:1,get:s=>fp(s.p).total},
    {id:'transport',label:'Getting around',unit:'t',lvl:'bio',min:0,max:12,d:2,get:s=>fp(s.p).transport},
    {id:'home',label:'Home energy',unit:'t',lvl:'bio',min:0,max:8,d:2,get:s=>fp(s.p).home},
    {id:'food',label:'Food',unit:'t',lvl:'bio',min:0,max:4,d:1,get:s=>fp(s.p).food},
    {id:'stuff',label:'Stuff and waste',unit:'t',lvl:'bio',min:0,max:5,d:1,get:s=>fp(s.p).stuff},
    {id:'vsus',label:'Compared with US average',unit:'%',lvl:'bio',min:0,max:200,d:0,get:s=>fp(s.p).total/US*100},
    {id:'world',label:'World averages you equal',unit:'×',lvl:'honors',min:0,max:6,d:1,get:s=>fp(s.p).total/WORLD},
    {id:'gal',label:'Gasoline burned',unit:'gal/yr',lvl:'ap',min:0,max:1500,d:0,get:s=>s.p.car==='ev'?0:s.p.miles*52/(s.p.mpg*(s.p.car==='hybrid'?1.6:1))},
    {id:'carmath',label:'Car math',unit:'',lvl:'ap',text:true,noTrial:true,get:s=>{const p=s.p,mi=p.miles*52;if(p.car==='ev'){const k=mi*EV_KWH_MI;return fmtNum(k,0)+' kWh × '+GRID[p.grid]+' kg = '+fmtNum(k*GRID[p.grid],0)+' kg CO₂';}const g=mi/(p.mpg*(p.car==='hybrid'?1.6:1));return fmtNum(mi,0)+' mi ÷ '+(p.car==='hybrid'?fmtNum(p.mpg*1.6,0):p.mpg)+' mpg = '+fmtNum(g,0)+' gal × 8.89 kg = '+fmtNum(g*KG_GAL,0)+' kg CO₂';}},
    {id:'elecmath',label:'Electricity math (your share)',unit:'',lvl:'ap',text:true,noTrial:true,get:s=>{const p=s.p,k=p.kwh*12/p.people;return fmtNum(p.kwh*12,0)+' kWh ÷ '+p.people+' people = '+fmtNum(k,0)+' kWh × '+GRID[p.grid]+' kg = '+fmtNum(k*GRID[p.grid],0)+' kg CO₂';}}
  ],
  graphs:[{id:'cat',label:'Your footprint by category',custom:true},{id:'cmp',label:'You compared with averages',custom:true}],
  defaultGraph:'cat',
  plot(sim,ctx,box,id){const f=fp(sim.p);
    if(id==='cat'){const vals=CATS.map(c=>f[c.id]),mx=Math.max(4,...vals)*1.2;const ax=axes(ctx,box,{xmin:0,xmax:CATS.length,ymin:0,ymax:mx,xcats:['Getting around','Home energy','Food','Stuff','Services'],yl:'t CO₂e per year'});
      bars(ctx,ax,vals,{colors:CATS.map(c=>PAL[c.c]),d:1});}
    else{const vals=[f.total,US,WORLD,TARGET],mx=Math.max(18,f.total*1.15);const ax=axes(ctx,box,{xmin:0,xmax:4,ymin:0,ymax:mx,xcats:['You','US average','World average','2050 goal'],yl:'t CO₂e per person per year'});
      bars(ctx,ax,vals,{colors:[PAL['g-line'],PAL.muted,PAL.s2,PAL.s3],d:1});}},
  infoPanel(sim){const L=ideas(sim.p).slice(0,6);if(!L.length)return '<h3>What would cut the most?</h3><p>You have already made every change on the list.</p>';
    return '<h3>What would cut the most?</h3><p style="color:var(--muted)">Ranked by tons saved per year, starting from your current settings.</p>'+L.map((x,i)=>`<p style="display:flex;gap:10px;align-items:center;justify-content:space-between"><span><b>${i+1}. ${x.l}</b> saves ${x.s.toFixed(2)} t</span><button type="button" class="btn" data-try="${i}">Try it</button></p>`).join('');},
  bindInfo(sim,el){const L=ideas(sim.p).slice(0,6);el.querySelectorAll('[data-try]').forEach(b=>b.addEventListener('click',()=>{const x=L[+b.dataset.try];if(x){BioLab.setValues(sim,x.ch);BioLab.refresh(sim);}}));},
  narrate(sim){const f=fp(sim.p),big=CATS.slice().sort((a,b)=>f[b.id]-f[a.id])[0],top=ideas(sim.p)[0];
    let s='Your year adds about <b>'+f.total.toFixed(1)+' tons of CO₂</b>, '+(f.total>US?'more':'less')+' than the US average of '+US+' and '+(f.total/WORLD).toFixed(1)+' times the world average. The biggest slice is <b>'+big.l.toLowerCase()+'</b>.';
    if(top)s+=' Best single change: '+top.l.toLowerCase()+' (−'+top.s.toFixed(1)+' t).';return s;},
  tour:[
    {title:'Your total',text:'The bar on the right stacks up every ton of CO₂ from one year of your life. The lines mark the US average, the world average and the 2050 goal for limiting warming.',focus:[590,20,210,415]},
    {title:'Getting around',text:'Cars burn gasoline, and every gallon puts out about 8.9 kg of CO₂, roughly 20 pounds. Flights add more. Watch the bubbles from the car and plane.',focus:[[0,330,560,90],[40,30,200,90]]},
    {title:'Electricity comes from a power plant',text:'Your lights make no smoke at home. The CO₂ comes from the power plant that makes the electricity. In Colorado, more than half of it still comes from coal and gas.',focus:[[230,180,170,170],[420,40,140,160]]},
    {title:'Heating your home',text:'A gas furnace burns natural gas right at your house; see the chimney. A heat pump uses electricity instead, so how clean it is depends on the grid.',focus:[230,170,170,170]},
    {title:'Food, stuff and services',text:'Growing food, especially beef, and making the things we buy also release greenhouse gases. Shared services like schools and roads add a slice everyone carries.',focus:[[20,200,200,120],[400,210,160,120]]},
    {lvl:'honors',title:'Try a change',text:'The panel below the graph ranks what-if changes by tons saved. We just switched this student to an electric car. Watch the transport slice shrink.',focus:[590,20,210,415],setup(sim){BioLab.setValues(sim,{car:'ev'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,DEF);},
  challenges(sim){const d=fp(DEF),drive=d.car,fly=FLIGHT_MI*KG_AIRMI/1000;const ratio=d.total/WORLD;
    const opts=[['Switch to LED bulbs',{kwh:Math.round(DEF.kwh*0.92/50)*50}],['Skip one round-trip flight',{flights:0}],['Eat vegetarian',{diet:'veg'}],['Switch to an electric car',{car:'ev'}]];
    const sav=opts.map(o=>d.total-fp(o[1]).total),best=sav.indexOf(Math.max(...sav));
    const hp=fp({heat:'hp'}).heat,gas=d.heat,hr=hp/gas;
    return [
      {lvl:'bio',instant:true,q:'Which puts out more CO₂: one round-trip flight of 2,000 miles, or a year of driving 120 miles a week in a 25-mpg car?',choices:['The flight','The year of driving','About the same'],correct:drive>fly*1.3?1:(fly>drive*1.3?0:2),
       explain:`The flight is about ${fly.toFixed(1)} t of CO₂. The year of driving burns ${(DEF.miles*52/DEF.mpg).toFixed(0)} gallons, about ${drive.toFixed(1)} t. Flying is intense per trip, but everyday driving adds up to more.`},
      {lvl:'bio',instant:true,q:'The typical student on this page puts out about how many times the world average per person (4.7 t)?',choices:['About the same','About 2 to 3 times','About 10 times'],correct:ratio<1.5?0:(ratio<5?1:2),
       explain:`${d.total.toFixed(1)} t ÷ 4.7 t ≈ ${ratio.toFixed(1)}. Americans emit far more per person than most of the world, mostly from driving, electricity and heating.`},
      {lvl:'honors',instant:true,q:'Starting from the typical student, which single change cuts the most CO₂?',choices:opts.map(o=>o[0]),correct:best,
       explain:'Savings: '+opts.map((o,i)=>o[0].toLowerCase()+' '+sav[i].toFixed(2)+' t').join(', ')+'. Transportation is the biggest slice for most Coloradans, so the car matters most.'},
      {lvl:'honors',instant:true,q:'A family switches from a gas furnace to an electric heat pump. On Colorado’s current grid, what happens to their heating CO₂?',choices:['It drops to almost zero','It drops some, because the electricity still comes partly from coal and gas','It goes up a lot'],correct:hr<0.2?0:(hr<=1.05?1:2),
       explain:`Heating CO₂ goes from ${gas.toFixed(2)} t to ${hp.toFixed(2)} t per person. A heat pump moves about 3 units of heat per unit of electricity, but half of Colorado’s power still comes from fossil fuels. On a 100% renewable grid it would drop to about ${fp({heat:'hp',grid:'renew'}).heat.toFixed(2)} t.`},
      {lvl:'ap',instant:true,q:'A car gets 25 mpg and is driven 12,000 miles a year. Gasoline releases 8.89 kg of CO₂ per gallon. About how much CO₂ is that per year?',choices:['0.43 t','4.3 t','43 t','430 t'],correct:1,
       explain:'12,000 mi ÷ 25 mpg = 480 gal. 480 gal × 8.89 kg/gal = 4,267 kg ≈ 4.3 metric tons of CO₂.'},
      {lvl:'ap',instant:true,q:'A household uses 700 kWh of electricity a month on a grid that emits 0.50 kg of CO₂ per kWh. What is the household’s yearly CO₂ from electricity?',choices:['0.35 t','4.2 t','42 t','350 t'],correct:1,
       explain:'700 kWh × 12 months = 8,400 kWh. 8,400 kWh × 0.50 kg/kWh = 4,200 kg = 4.2 t for the household, or about 1.05 t each for 4 people.'}
    ];},
  lab:{bio:'<p><b>Question:</b> Which part of a typical student’s life makes the most CO₂?</p><ol><li>Press "Back to a typical student" and record a trial.</li><li>Change one thing at a time (miles, flights, diet, electricity source), record a trial, then set it back.</li><li>Plot each change on the Trials graph against your footprint.</li></ol><p>Which change made the biggest difference? Which would be easiest for you?</p>',
       honors:'<p><b>Question:</b> Can you cut the typical student’s footprint by 30% with changes a family could really make?</p><ol><li>Record the starting footprint.</li><li>Use the ranked list to pick changes. Record a trial after each one.</li><li>Compare a heat pump and an electric car on the Colorado grid and on 100% renewable power.</li></ol><p>Explain why the grid matters for electric cars and heat pumps.</p>',
       ap:'<p><b>Question:</b> Check the calculator’s math by hand.</p><ol><li>Pick any settings. Use the car math and electricity math readouts.</li><li>Recalculate both by hand with dimensional analysis, including unit conversions.</li><li>Calculate how many gallons of gasoline equal the CO₂ of one round-trip flight.</li></ol><p><b>Claim–evidence–reasoning:</b> Argue which policy (cleaner grid, fuel economy standards or transit) would cut US emissions the most, using numbers from this tool.</p>'},
  terms:[{t:'Carbon footprint',d:'The total greenhouse gases released by a person’s activities in a year.'},{t:'CO₂-equivalent (CO₂e)',d:'Other greenhouse gases converted into the amount of CO₂ that would trap the same heat.'},{t:'Renewable energy',d:'Energy from sources that are replaced naturally, such as sun and wind.'},
    {lvl:'honors',t:'Grid intensity',d:'The kilograms of CO₂ released per kilowatt-hour of electricity. Colorado’s is about 0.5.'},{lvl:'honors',t:'Heat pump',d:'An electric device that moves heat instead of making it, delivering about 3 units of heat per unit of electricity.'},
    {lvl:'ap',t:'Kilowatt-hour (kWh)',d:'Energy used by a 1,000-watt device running for 1 hour. 1 kWh = 3,412 BTU.'},{lvl:'ap',t:'Therm',d:'A unit of natural gas energy, 100,000 BTU. Burning one releases about 5.3 kg of CO₂.'}],
  about:'<p>Car: miles × 52 ÷ mpg × 8.89 kg CO₂ per gallon (hybrids get 1.6× the mpg). Electric cars use 0.30 kWh per mile. Flights: 2,000 miles × 0.2 kg CO₂ per passenger-mile. Electricity: kWh × 12 ÷ people × grid intensity (Colorado ≈ 0.50, US ≈ 0.37, renewable ≈ 0.02 kg/kWh). Heating: 650 therms a year for the household, ±3% per °F of thermostat; a heat pump delivers 3 kWh of heat per kWh of electricity.</p><p>Diet, shopping and shared services use typical published per-person averages. The US average of about 15 t and the world average of about 4.7 t are rounded per-capita figures. Real footprints vary a lot, and these are estimates for comparing choices.</p>',
  initVis(sim){sim.vis.b=[];sim.vis.acc={};sim.vis.carX=40;sim.vis.planeX=60;},
  draw(sim,ctx,vdt,k,t){const f=fp(sim.p),v=sim.vis,p=sim.p;if(!v.b)FOOT.initVis(sim);
    ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,580,450);ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(580,0,220,450);
    ctx.fillStyle=PAL['cv-leaf'];ctx.globalAlpha=.35;ctx.fillRect(0,330,580,120);ctx.globalAlpha=1;
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,385,580,34);ctx.strokeStyle=PAL.card;ctx.lineWidth=2;ctx.setLineDash([16,12]);ctx.beginPath();ctx.moveTo(0,402);ctx.lineTo(580,402);ctx.stroke();ctx.setLineDash([]);
    const src=[];
    // plane
    v.planeX+=vdt*40*(p.flights>0?1:0);if(v.planeX>600)v.planeX=-60;const px=v.planeX,py=70;
    if(p.flights>0){ctx.fillStyle='#8a94a3';ctx.beginPath();ctx.ellipse(px,py,34,7,0,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(px-4,py);ctx.lineTo(px-18,py-20);ctx.lineTo(px-8,py-20);ctx.lineTo(px+8,py);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(px-26,py);ctx.lineTo(px-34,py-14);ctx.lineTo(px-28,py-14);ctx.lineTo(px-20,py);ctx.fill();
      src.push({k:'fly',x:px-36,y:py,c:PAL.s1,v:f.fly});}
    // power plant
    ctx.fillStyle='#6b7280';ctx.fillRect(440,110,90,60);ctx.fillRect(500,60,16,50);ctx.fillStyle='#4b5563';ctx.fillRect(455,125,18,14);ctx.fillRect(482,125,18,14);
    txt(ctx,p.grid==='renew'?'Wind and solar':'Power plant',485,186,{s:12*k,w:600,a:'center'});
    if(p.grid==='renew'){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;for(let i=0;i<2;i++){const x=448+i*28;ctx.beginPath();ctx.moveTo(x,108);ctx.lineTo(x,70);ctx.stroke();for(let j=0;j<3;j++){const a=t*2+j*2.09;ctx.beginPath();ctx.moveTo(x,70);ctx.lineTo(x+Math.cos(a)*14,70+Math.sin(a)*14);ctx.stroke();}}}
    const elecTons=f.elec+(p.heat==='hp'?f.heat:0)+(p.car==='ev'?f.car:0);
    src.push({k:'elec',x:508,y:58,c:PAL.s4,v:elecTons});
    // power line to house
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(440,130);ctx.quadraticCurveTo(410,160,372,240);ctx.stroke();
    // house
    ctx.fillStyle='#c98b5a';ctx.fillRect(250,240,120,90);ctx.fillStyle='#8c3b2e';ctx.beginPath();ctx.moveTo(240,242);ctx.lineTo(310,185);ctx.lineTo(380,242);ctx.closePath();ctx.fill();
    ctx.fillStyle='#8c3b2e';ctx.fillRect(342,190,14,34);ctx.fillStyle='#fde68a';ctx.fillRect(266,262,26,24);ctx.fillRect(330,262,26,24);ctx.fillStyle='#5b3a24';ctx.fillRect(298,290,22,40);
    txt(ctx,'Home',310,348,{s:12*k,w:600,a:'center'});
    if(p.heat==='gas')src.push({k:'heat',x:349,y:186,c:PAL.s4,v:f.heat});
    // car
    if(p.miles>0){v.carX+=vdt*60*clamp(p.miles/120,0.3,2);if(v.carX>600)v.carX=-50;}const cx=v.carX,cy=388;
    ctx.fillStyle=p.car==='ev'?'#2c7a46':'#b5122d';rr(ctx,cx-26,cy-12,52,14,5);ctx.fill();rr(ctx,cx-14,cy-23,30,12,5);ctx.fill();ctx.fillStyle='#222';ctx.beginPath();ctx.arc(cx-14,cy+3,6,0,6.29);ctx.arc(cx+14,cy+3,6,0,6.29);ctx.fill();
    if(p.car!=='ev'&&p.miles>0)src.push({k:'car',x:cx-30,y:cy-2,c:PAL.s1,v:f.car});
    // food: plate
    ctx.fillStyle=PAL.card;ctx.beginPath();ctx.ellipse(70,280,40,14,0,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();
    const dish={meat:'#7c2d12',avg:'#a16207',veg:'#3f8f3a',vegan:'#65a30d'}[p.diet];ctx.fillStyle=dish;ctx.beginPath();ctx.ellipse(70,277,22,7,0,0,6.29);ctx.fill();
    txt(ctx,'Food',70,312,{s:12*k,w:600,a:'center'});src.push({k:'food',x:70,y:266,c:PAL.s3,v:f.food});
    // stuff: shopping bag
    ctx.fillStyle='#7c5cc4';rr(ctx,150,250,40,46,4);ctx.fill();ctx.strokeStyle='#7c5cc4';ctx.lineWidth=3;ctx.beginPath();ctx.arc(170,252,10,Math.PI,0);ctx.stroke();
    txt(ctx,'Stuff',170,312,{s:12*k,w:600,a:'center'});src.push({k:'stuff',x:170,y:246,c:PAL.s5,v:f.stuff});
    // services: school
    ctx.fillStyle='#4b8f8c';ctx.fillRect(420,250,110,70);ctx.fillStyle='#2f6b68';ctx.beginPath();ctx.moveTo(414,252);ctx.lineTo(475,222);ctx.lineTo(536,252);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fde68a';for(let i=0;i<4;i++)ctx.fillRect(430+i*25,268,14,14);txt(ctx,'Schools, roads',475,340,{s:12*k,w:600,a:'center'});
    src.push({k:'svc',x:475,y:218,c:PAL.s6,v:f.svc});
    // bubbles in proportion to tons
    for(const s of src){v.acc[s.k]=(v.acc[s.k]||0)+s.v*vdt*1.1;while(v.acc[s.k]>=1){v.acc[s.k]--;v.b.push({x:s.x+(Math.random()-.5)*8,y:s.y,c:s.c,r:5+Math.random()*4,life:3.2,dx:(Math.random()-.5)*14});}}
    for(const b of v.b){b.y-=22*vdt;b.x+=b.dx*vdt;b.life-=vdt;ctx.globalAlpha=clamp(b.life/3.2,0,1)*.85;ctx.fillStyle=b.c;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.29);ctx.fill();
      if(b.r>7.5){ctx.globalAlpha=clamp(b.life/3.2,0,1);txt(ctx,'CO₂',b.x,b.y+1,{s:7,w:700,c:'#fff',a:'center',b:'middle'});}}
    ctx.globalAlpha=1;v.b=v.b.filter(b=>b.life>0&&b.y>-10);if(v.b.length>180)v.b.splice(0,v.b.length-180);
    pill(ctx,'More bubbles = more CO₂ each year',140,20,PAL.card,PAL['cv-soft'],11*k);
    // stacked bar
    const X0=618,W=56,Y0=420,S=Math.min(14.5,360/Math.max(f.total,US));let y=Y0;
    txt(ctx,'Your year',X0+W/2,24,{s:13*k,w:700,a:'center'});
    CATS.forEach(c=>{const h=f[c.id]*S;ctx.fillStyle=PAL[c.c];ctx.fillRect(X0,y-h,W,h);if(h>16)txt(ctx,f[c.id].toFixed(1),X0+W/2,y-h/2,{s:11*k,w:700,c:'#fff',a:'center',b:'middle'});y-=h;});
    pill(ctx,f.total.toFixed(1)+' t',X0+W/2,Math.max(48,y-14),'#b5122d','#fff',12*k);
    [[US,'US avg 15 t'],[WORLD,'World 4.7 t'],[TARGET,'2050 goal 2 t']].forEach(m=>{const yy=Y0-m[0]*S;ctx.strokeStyle=PAL['cv-ink'];ctx.setLineDash([4,3]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X0-6,yy);ctx.lineTo(X0+W+8,yy);ctx.stroke();ctx.setLineDash([]);txt(ctx,m[1],X0+W+12,yy,{s:11*k,b:'middle',c:PAL['cv-ink'],w:600});});
    ctx.strokeStyle=PAL.line;ctx.beginPath();ctx.moveTo(X0-6,Y0);ctx.lineTo(X0+W+6,Y0);ctx.stroke();}
};
BioLab.register(FOOT);
})();
