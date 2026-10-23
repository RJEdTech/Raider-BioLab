(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,fmtNum}=BioLab.h;

/* Stabilization wedges (Pacala & Socolow 2004). Each removes 1 GtC/yr after 50 years, growing linearly. */
const WEDGES=[
  {id:'cars',l:'Efficient cars',l2:'60 mpg, not 30',ic:'car',need:'Double the fuel economy of 2 billion cars.',cost:'Needs new vehicles and stronger fuel standards.'},
  {id:'drive',l:'Drive less',l2:'Half the miles',ic:'road',need:'Cut miles driven in half for 2 billion cars.',cost:'Needs transit, biking and closer-together cities.'},
  {id:'build',l:'Efficient buildings',l2:'Insulation, LEDs',ic:'house',need:'Cut energy use in homes and offices by one quarter.',cost:'Millions of small upgrades, one building at a time.'},
  {id:'plants',l:'Efficient plants',l2:'60% vs 40%',ic:'factory',need:'Raise coal-plant efficiency from 40% to 60%.',cost:'Expensive new equipment; still burns coal.'},
  {id:'gas',l:'Gas for coal',l2:'1,400 GW switched',ic:'flame',need:'Replace 1,400 GW of coal power with natural gas.',cost:'Gas still emits CO₂, and methane leaks cut the benefit.'},
  {id:'ccs',l:'Carbon capture',l2:'At power plants',ic:'ccs',need:'Capture and bury CO₂ from 800 GW of coal plants.',cost:'Costly, and needs safe underground storage.'},
  {id:'nuclear',l:'Nuclear power',l2:'Replace coal',ic:'nuclear',need:'Add 700 GW of nuclear power in place of coal.',cost:'Radioactive waste and long build times.'},
  {id:'wind',l:'Wind power',l2:'2 million turbines',ic:'wind',need:'Add 2 million 1-MW wind turbines in place of coal.',cost:'Needs lots of land or sea and backup for calm days.'},
  {id:'solar',l:'Solar power',l2:'2,000 GW of panels',ic:'solar',need:'Add 2,000 GW of solar panels in place of coal.',cost:'Needs land and storage for nighttime.'},
  {id:'defor',l:'Stop clearing',l2:'Protect forests',ic:'axe',need:'End tropical deforestation.',cost:'Needs enforcement and other income for farmers.'},
  {id:'forest',l:'Plant forests',l2:'New forests',ic:'tree',need:'Plant new forests on 250 million hectares.',cost:'Uses a lot of land, and fires can release the carbon.'},
  {id:'soil',l:'Soil carbon',l2:'No-till farming',ic:'soil',need:'Use conservation tillage on all cropland.',cost:'Gains are lost if plowing resumes.'}
];
const CH4F={low:0.3,today:0.55,high:1.1};
const YEARS=75,CP=280*2.12;
function pathE(path,t){if(path==='flat')return 10;if(path==='half')return Math.max(5,10-5*t/25);if(path==='netzero')return Math.max(0,10*(1-t/45));return 10+0.16*t;}
function emis(sim,t){return Math.max(0,pathE(sim.p.path,t)-(sim.wedges||[]).length*t/50);}
const ppm=s=>s.C/2.12;
const phOf=p=>8.17-0.38*Math.log(p/280);

const CLIMATE={
  id:'climate',hash:'climate',apUnit:12,order:4,kind:'Simulation',tab:'Climate change and stabilization wedges',
  card:'Watch greenhouse gases trap heat, then pick stabilization wedges to flatten emissions before 2100.',
  title:'Climate change and stabilization wedges',
  lede:{bio:'Greenhouse gases let sunlight in but trap some of the heat Earth gives off. Choose wedges, real ways to cut carbon, and see how warm 2100 gets.',
        honors:'Compare emission paths, add stabilization wedges, and see why methane matters even though there is far less of it than CO₂.',
        ap:'A simple carbon-and-energy-balance model from 2025 to 2100: radiative forcing, climate sensitivity, ocean acidification and sea-level rise.'},
  scale:'The whole planet. The greenhouse layer is the lowest 10–15 km of the atmosphere. One wedge removes 1 billion tons of carbon (3.7 billion tons of CO₂) per year by 2075.',
  timeScale:5,dtMax:0.05,prewarm:0,sampleDt:0.25,window:YEARS,unit:'years after 2025',timeLabel:'Time',chChange:0.2,chReveal:YEARS,
  clock:sim=>'Year '+(2025+Math.min(YEARS,Math.floor(sim.t))),
  controls:[
    {id:'path',label:'Emissions path',type:'seg',def:'bau',lvl:'bio',options:[{v:'bau',l:'Business as usual'},{v:'flat',l:'Hold flat'},{v:'half',l:'Halve by 2050'},{v:'netzero',l:'Net zero by 2070'}],help:'Wedges cut emissions further below whichever path you pick.'},
    {id:'pick',label:'Choose a wedge',type:'select',def:'wind',lvl:'bio',noTrial:true,options:WEDGES.map(w=>({v:w.id,l:w.l})),help:'Or click a wedge card in the picture.'},
    {id:'ch4',label:'Methane emissions',type:'seg',def:'today',lvl:'honors',options:[{v:'low',l:'Cut'},{v:'today',l:'Today'},{v:'high',l:'Double'}]},
    {id:'sens',label:'Climate sensitivity',type:'range',min:1.5,max:4.5,step:0.5,def:3,unit:' °C',lvl:'ap',help:'Warming from doubling CO₂, once the climate catches up. Best estimate about 3 °C.'}
  ],
  actions:[
    {id:'toggle',label:'Add or remove this wedge',primary:true,run(sim){toggleW(sim,sim.p.pick);}},
    {id:'eight',label:'Add 8 wedges',run(sim){sim.wedges=WEDGES.slice(0,8).map(w=>w.id);}},
    {id:'clear',label:'Remove all wedges',run(sim){sim.wedges=[];}}
  ],
  init(sim){if(!sim.wedges)sim.wedges=[];return {C:425*2.12,T:1.3,SL:0,E:10,F:0,done:false};},
  step(sim,dt){const s=sim.st;if(sim.t>=YEARS){if(!s.done&&sim.ui&&sim.ui.play){sim.running=false;sim.ui.play.textContent='Play';}s.done=true;return;}
    const t=sim.t,E=emis(sim,t),up=0.018*(s.C-CP);s.E=E;
    s.C+=(E-up)*dt;
    const g=1+0.03*(E-10);
    s.F=5.35*Math.log(s.C/CP)+(CH4F[sim.p.ch4]+0.3)*g-1.0*Math.sqrt(Math.max(0,E)/10);
    const lam=sim.p.sens/(5.35*Math.log(2));
    s.T+=(lam*s.F-s.T)/12*dt;s.SL+=3.4*s.T*dt;},
  metrics:[
    {id:'co2',label:'CO₂ in the air',unit:'ppm',lvl:'bio',min:280,max:800,d:0,get:s=>ppm(s.st)},
    {id:'warm',label:'Warming since 1850',unit:'°C',lvl:'bio',min:0,max:5,d:2,get:s=>s.st.T},
    {id:'emis',label:'Carbon emissions',unit:'GtC/yr',lvl:'bio',min:0,max:25,d:1,get:s=>emis(s,Math.min(s.t,YEARS))},
    {id:'nw',label:'Wedges in use',unit:'of 12',lvl:'bio',min:0,max:12,d:0,get:s=>(s.wedges||[]).length},
    {id:'force',label:'Extra heat trapped',unit:'W/m²',lvl:'honors',min:0,max:8,d:2,get:s=>s.st.F},
    {id:'ph',label:'Ocean surface pH',unit:'',lvl:'ap',min:7.6,max:8.3,fixed:true,d:2,get:s=>phOf(ppm(s.st))},
    {id:'sl',label:'Sea-level rise since 2025',unit:'cm',lvl:'ap',min:0,max:100,d:0,get:s=>s.st.SL/10}
  ],
  graphs:[{id:'wedge',label:'Emissions and the stabilization triangle',custom:true},{id:'co2',label:'CO₂ in the air',lines:['co2']},{id:'warm',label:'Warming since 1850',lines:['warm']},
    {id:'ph',label:'Ocean surface pH',lvl:'ap',lines:['ph']},{id:'sl',label:'Sea-level rise',lvl:'ap',lines:['sl']}],
  defaultGraph:'wedge',
  plot(sim,ctx,box){const ax=axes(ctx,box,{xmin:2025,xmax:2100,ymin:0,ymax:25,xl:'Year',yl:'Carbon emissions (GtC/yr)'});
    const n=(sim.wedges||[]).length,pts=[];for(let y=0;y<=YEARS;y+=1)pts.push(y);
    // stabilization triangle between business as usual and flat
    ctx.fillStyle='rgba(120,120,120,.12)';ctx.beginPath();pts.forEach((t,i)=>{const X=ax.X(2025+t),Y=ax.Y(pathE('bau',t));i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});pts.slice().reverse().forEach(t=>ctx.lineTo(ax.X(2025+t),ax.Y(10)));ctx.closePath();ctx.fill();
    // wedges stacked below the chosen path
    const cols=[PAL.s3,PAL.s2,PAL.s4,PAL.s6,PAL.s5,PAL.s1];
    for(let k=0;k<n;k++){ctx.fillStyle=cols[k%cols.length];ctx.globalAlpha=.55;ctx.beginPath();
      pts.forEach((t,i)=>{const top=Math.max(0,pathE(sim.p.path,t)-k*t/50);const X=ax.X(2025+t),Y=ax.Y(top);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});
      pts.slice().reverse().forEach(t=>{const bot=Math.max(0,pathE(sim.p.path,t)-(k+1)*t/50);ctx.lineTo(ax.X(2025+t),ax.Y(bot));});ctx.closePath();ctx.fill();}
    ctx.globalAlpha=1;
    const line=(f,col,dash,w)=>{ctx.strokeStyle=col;ctx.lineWidth=w||2.5;ctx.setLineDash(dash||[]);ctx.beginPath();pts.forEach((t,i)=>{const X=ax.X(2025+t),Y=ax.Y(f(t));i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.stroke();ctx.setLineDash([]);};
    line(t=>pathE('bau',t),PAL.muted,[6,5],2);line(()=>10,PAL.muted,[2,4],1.5);line(t=>emis(sim,t),PAL['g-line'],null,3);
    const tn=Math.min(sim.t,YEARS);ctx.fillStyle=PAL['g-line'];ctx.beginPath();ctx.arc(ax.X(2025+tn),ax.Y(emis(sim,tn)),5,0,6.29);ctx.fill();
    legend(ctx,box.L+8,box.T+12,[{label:'Your emissions',color:PAL['g-line']},{label:'Business as usual',color:PAL.muted,dash:true}]);
    if(n)txt(ctx,n+' wedge'+(n>1?'s':''),ax.X(2088),ax.Y(Math.max(1.5,pathE(sim.p.path,63)-n*63/100)),{s:13,c:PAL.fg,a:'center',w:700});},
  infoPanel(sim){const ws=(sim.wedges||[]).map(id=>WEDGES.find(w=>w.id===id));
    if(!ws.length)return '<h3>Your wedges</h3><p>No wedges yet. Choose one from the list or click a card in the picture. It takes about 8 wedges to keep emissions flat through 2075.</p>';
    return `<h3>Your wedges (${ws.length})</h3>`+ws.map(w=>`<p><b>${w.l}.</b> ${w.need}${atLeast('honors')?` <span style="color:var(--muted)">Trade-off: ${w.cost}</span>`:''}</p>`).join('');},
  narrate(sim){const s=sim.st,P=ppm(s),n=(sim.wedges||[]).length,E=emis(sim,Math.min(sim.t,YEARS));
    if(sim.t>=YEARS)return `<b>It is 2100.</b> CO₂ reached ${P.toFixed(0)} ppm and Earth is <b>${s.T.toFixed(1)} °C warmer</b> than before the Industrial Revolution.`+(s.T>2.5?' Most of that heat came from emissions that kept climbing.':' Cutting emissions kept warming much lower.');
    if(E<0.5)return '<b>Emissions are near zero.</b> Oceans and forests slowly pull CO₂ back out of the air, so warming levels off and begins to ease.';
    if(sim.p.path==='bau'&&n>=8)return `<b>Your ${n} wedges hold emissions about flat.</b> CO₂ still rises (${P.toFixed(0)} ppm), because we keep adding more than oceans and plants can absorb each year.`;
    const rising=emis(sim,Math.min(sim.t,YEARS)+1)>E+0.01;
    if(rising)return `<b>Emissions are still climbing</b> (${E.toFixed(1)} billion tons of carbon a year). More CO₂ means more infrared heat is caught and sent back down, so Earth keeps warming.`;
    return `Emissions are ${E.toFixed(1)} billion tons of carbon a year. CO₂ is ${P.toFixed(0)} ppm and still traps extra heat, so temperature drifts toward ${s.T.toFixed(1)} °C and beyond.`;},
  tour:[
    {title:'Sunlight comes in',text:'Sunlight is mostly visible light. It passes straight through the air and warms the ground and oceans.',focus:[0,24,330,210],speed:0.1},
    {title:'Earth glows with infrared heat',text:'The warm surface gives off energy as infrared radiation, the heat you feel from a sidewalk at night. Watch the red wavy arrows rise.',focus:[0,320,440,130],speed:0.1},
    {title:'Greenhouse gases trap some of it',text:{bio:'Greenhouse gas molecules absorb some of the infrared heat and send it back out in every direction, including back down. That keeps Earth warmer.',honors:'CO₂, methane and water vapor absorb infrared, not visible light. They re-emit it in all directions, so part of the heat returns to the surface. This is the greenhouse effect.'},focus:[0,140,440,180],speed:0.1},
    {title:'More CO₂, more warming',text:'Burning fossil fuels adds CO₂ every year. More molecules catch more heat, and the thermometer climbs. Watch the years tick by on business as usual.',focus:[380,30,60,350],speed:1},
    {title:'The stabilization triangle',text:'Business as usual doubles emissions by 2075. Keeping them flat means filling a triangle of cuts. Pacala and Socolow split it into wedges: each one is a real strategy that removes 1 billion tons of carbon a year by 2075.',focus:[445,24,355,400],pause:true},
    {title:'Add a wedge',text:'We just added wind power. One wedge alone barely bends the curve. It takes about 8 to hold emissions flat. Check the graph below.',focus:[660,160,135,90],pause:true,setup(sim){sim.wedges=['wind'];}},
    {lvl:'honors',title:'Methane counts too',text:'Methane traps about 28 times more heat than CO₂ per kilogram over 100 years, and over 80 times more over 20 years. Doubling methane warms the planet even if CO₂ stays the same.',focus:[0,140,440,180],speed:1,setup(sim){BioLab.setValues(sim,{ch4:'high'});}},
    {lvl:'ap',title:'Oceans pay the price',text:'Oceans absorb about a quarter of the CO₂ we emit. It forms carbonic acid and lowers pH, which makes shells harder to build. Warming water also expands and ice melts, so sea level rises. Check the pH and sea-level readouts.',focus:[0,380,440,70],speed:1}
  ],
  onTourExit(sim){sim.wedges=[];BioLab.setValues(sim,{ch4:'today'});},
  challenges:[
    {lvl:'bio',q:'The world keeps burning more fossil fuel every year (business as usual). By 2100, how much warmer is Earth than before the Industrial Revolution?',
     choices:['About the same as today, 1.3 °C','About 3 °C, more than twice today’s warming','Cooler, because the oceans absorb the CO₂'],correct:1,
     baseline:{path:'bau'},baselineAction:'clear',changeText:'Running business as usual to 2100',watch:'warm',
     explain:{bio:'CO₂ keeps piling up, so more heat is trapped every year. Earth ends the century about 3 °C warmer than in 1850. Oceans absorb some CO₂, but not nearly enough to keep up.',
              ap:'With emissions reaching about 22 GtC/yr, CO₂ passes 650 ppm. At a climate sensitivity of 3 °C per doubling, warming reaches about 3.1 °C by 2100 and is still climbing, because the oceans have not caught up.'}},
    {lvl:'bio',q:'You add 8 stabilization wedges to business as usual. What happens to yearly emissions?',
     choices:['They stay about flat at today’s level','They keep climbing as fast as before','They drop to zero right away'],correct:0,
     baseline:{path:'bau'},baselineAction:'clear',changeAction:'eight',changeText:'8 wedges added',watch:'emis',
     explain:'Each wedge grows to 1 billion tons of carbon a year by 2075. Eight of them cancel the growth of business as usual, so emissions stay near 10 billion tons a year instead of doubling. That is the whole stabilization triangle.'},
    {lvl:'honors',q:'Emissions are held flat at today’s level for the rest of the century. What happens to the CO₂ in the air?',
     choices:['It stops rising','It keeps rising, just more slowly','It falls back to 280 ppm'],correct:1,
     baseline:{path:'flat'},baselineAction:'clear',changeText:'Emissions held flat',watch:'co2',
     explain:'Think of a bathtub. Flat emissions are a faucet left running at the same rate. Oceans and plants drain some, but less than goes in, so the level keeps rising, to about 510 ppm by 2100. Stopping the rise takes much deeper cuts.'},
    {lvl:'honors',q:'Methane emissions double while CO₂ follows business as usual. What happens to warming by 2100?',
     choices:['No change, because only CO₂ matters','More warming, even though CO₂ is the same','Less warming'],correct:1,
     baseline:{path:'bau',ch4:'today'},baselineAction:'clear',change:{ch4:'high'},changeText:'Methane doubled',watch:'warm',
     explain:'Methane traps far more heat per molecule than CO₂ (about 28 times per kilogram over 100 years). Doubling it adds roughly 0.6 °C by 2100 in this model, with CO₂ unchanged. Cutting methane leaks and landfill gas is one of the fastest ways to slow warming.'},
    {lvl:'ap',q:'Emissions fall to net zero by 2070. What does global temperature do?',
     choices:['It drops back to the pre-industrial level right away','It levels off near 2 °C, then slowly declines','It keeps rising as fast as business as usual'],correct:1,
     baseline:{path:'netzero'},baselineAction:'clear',changeText:'Following net zero by 2070',watch:'warm',
     explain:'Warming peaks around 2 °C. Losing aerosol pollution unmasks a little extra heat, and the ocean is still catching up. After net zero, natural sinks slowly draw CO₂ down, so temperature eases to about 1.7 °C by 2100. Net zero stops warming, but it does not quickly undo it.'},
    {lvl:'ap',q:'Under business as usual, what happens to surface-ocean pH by 2100?',
     choices:['It rises above 8.2','It falls toward 7.8, more acidic','It stays at today’s 8.05'],correct:1,
     baseline:{path:'bau'},baselineAction:'clear',changeText:'Running business as usual to 2100',watch:'ph',
     explain:'Dissolved CO₂ forms carbonic acid. As CO₂ climbs past 650 ppm, surface pH falls from about 8.0 to about 7.85. pH is logarithmic, so that is roughly 40% more H⁺ ions, which makes it harder for corals, oysters and pteropods to build calcium carbonate shells.'}
  ],
  lab:{bio:'<p><b>Question:</b> How many wedges does it take to keep 2100 warming below 2.5 °C?</p><ol><li>Keep the path on business as usual.</li><li>Run to 2100 with 0, 2, 4, 6, 8 and 10 wedges, pressing Reset between runs, and record a trial at 2100 each time.</li><li>Plot wedges in use (x) against warming (y).</li></ol><p>Which wedges would you pick first, and why?</p>',
       honors:'<p><b>Question:</b> How much does the emissions path change 2100 CO₂ and warming?</p><ol><li>Run each path to 2100 with no wedges and record a trial.</li><li>Repeat business as usual with methane cut and with methane doubled.</li></ol><p>Explain why CO₂ keeps rising even when emissions are held flat.</p>',
       ap:'<p><b>Question:</b> How sensitive are the outcomes to climate sensitivity?</p><ol><li>For business as usual and for 8 wedges, run to 2100 at sensitivity 1.5, 3 and 4.5 °C.</li><li>Record warming, ocean pH and sea-level rise.</li></ol><p><b>Claim–evidence–reasoning:</b> Use your data to argue for a level of action, and explain the ocean acidification chemistry.</p>'},
  terms:[{t:'Greenhouse effect',d:'Gases in the atmosphere absorb infrared heat from Earth and re-emit some of it back down, warming the surface.'},{t:'Infrared radiation',d:'The heat energy that warm objects, including Earth’s surface, give off.'},{t:'Greenhouse gas',d:'A gas that absorbs infrared, such as CO₂, methane, nitrous oxide and water vapor.'},{t:'Stabilization wedge',d:'A strategy that cuts carbon emissions by 1 billion tons a year by 2075.'},
    {lvl:'honors',t:'Carbon sink',d:'A reservoir that absorbs more carbon than it releases, such as oceans and growing forests.'},{lvl:'honors',t:'Global warming potential',d:'How much heat a gas traps compared with the same mass of CO₂. Methane is about 28 over 100 years.'},{lvl:'honors',t:'Radiative forcing',d:'The extra energy, in watts per square meter, trapped because of a change such as added CO₂.'},
    {lvl:'ap',t:'Climate sensitivity',d:'The eventual warming from doubling CO₂, about 3 °C (likely 2.5–4 °C).'},{lvl:'ap',t:'Ocean acidification',d:'Falling ocean pH as CO₂ dissolves and forms carbonic acid.'},{lvl:'ap',t:'Thermal expansion',d:'Water takes up more space as it warms, a major cause of sea-level rise.'}],
  about:'<p>Emissions follow the chosen path (business as usual: 10 GtC/yr in 2025 rising 0.16 GtC/yr each year). Each wedge subtracts t/50 GtC/yr, where t is years after 2025.</p><p>Atmospheric carbon: dC/dt = E − 0.018 (C − C<sub>1850</sub>), with 2.12 GtC per ppm. That sink term takes up about half of today’s emissions, as the real oceans and land do.</p><p>Forcing F = 5.35 ln(C/C<sub>1850</sub>) + other greenhouse gases − aerosols. Methane and other gases scale with activity; aerosol cooling falls as fossil burning falls. Temperature relaxes toward (sensitivity ÷ 3.7) × F with a 12-year lag, starting at 1.3 °C in 2025.</p><p>Ocean pH ≈ 8.17 − 0.38 ln(ppm/280). Sea level rises 3.4 mm per year for each °C of warming, a semi-empirical rule. This is a teaching model. It leaves out ice-sheet tipping points, carbon-cycle feedbacks and regional differences. Real projections come from full climate models, and the outcomes here are in the same range as their central scenarios.</p>',
  initVis(sim){const r=rng(21),v=sim.vis;v.mol=[];for(let i=0;i<60;i++)v.mol.push({x:16+r()*390,y:150+r()*150,ph:r()*6.28,m:i%5===4});v.ph=[];v.acc=0;v.glow={};},
  onClick(sim,x,y){const i=cardAt(x,y);if(i>=0){toggleW(sim,WEDGES[i].id);BioLab.setValues(sim,{pick:WEDGES[i].id});BioLab.refresh(sim);}},
  draw(sim,ctx,vdt,k,t){const s=sim.st,v=sim.vis,hon=atLeast('honors'),P=ppm(s);
    if(!v.ph)CLIMATE.initVis(sim);
    // scene background
    ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,440,450);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(440,0,360,450);
    // atmosphere band
    ctx.fillStyle=PAL['cv-water'];ctx.globalAlpha=.35+Math.min(.35,(P-280)/1200);ctx.fillRect(0,140,440,170);ctx.globalAlpha=1;
    // ground and ocean
    ctx.fillStyle=PAL['cv-leaf'];ctx.fillRect(0,385,250,65);ctx.fillStyle=PAL.s2;ctx.globalAlpha=.75;ctx.fillRect(250,385,190,65);ctx.globalAlpha=1;
    if(s.T>1.3){ctx.fillStyle='rgba(230,70,40,'+clamp((s.T-1.3)/8,0,.35)+')';ctx.fillRect(0,385,440,65);}
    // sun
    const sx=48,sy=62;ctx.fillStyle='#f6c12d';ctx.beginPath();ctx.arc(sx,sy,24,0,6.29);ctx.fill();ctx.strokeStyle='#f6c12d';ctx.lineWidth=3;
    for(let i=0;i<10;i++){const a=i*0.628+t*.2;ctx.beginPath();ctx.moveTo(sx+Math.cos(a)*30,sy+Math.sin(a)*30);ctx.lineTo(sx+Math.cos(a)*40,sy+Math.sin(a)*40);ctx.stroke();}
    // molecules (count follows CO2 ppm)
    const nm=clamp(Math.round((P-250)/9),4,60),ch4n=hon?Math.round({low:2,today:4,high:9}[sim.p.ch4]):0;
    for(let i=0;i<nm+ch4n&&i<v.mol.length;i++){const m=v.mol[i],x=m.x+(RM?0:Math.sin(t*.7+m.ph)*4),y=m.y+(RM?0:Math.cos(t*.5+m.ph)*3),gl=v.glow[i]>0;
      if(gl)v.glow[i]-=Math.max(vdt,0.004);
      if(i>=nm){ctx.fillStyle='#777';ctx.beginPath();ctx.arc(x,y,4.5,0,6.29);ctx.fill();ctx.fillStyle='#fff';[[0,-7],[6,4],[-6,4],[0,0]].slice(0,3).forEach(d=>{ctx.beginPath();ctx.arc(x+d[0],y+d[1],2.6,0,6.29);ctx.fill();ctx.strokeStyle='#999';ctx.lineWidth=1;ctx.stroke();});}
      else{ctx.fillStyle='#d23b3b';ctx.beginPath();ctx.arc(x-7,y,3.6,0,6.29);ctx.arc(x+7,y,3.6,0,6.29);ctx.fill();ctx.fillStyle='#555';ctx.beginPath();ctx.arc(x,y,4,0,6.29);ctx.fill();}
      if(gl){ctx.strokeStyle='#ff7a3d';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,11,0,6.29);ctx.stroke();}}
    // photons: keep moving visibly even in slow motion (at least 40% of normal pace)
    const pdt=sim.speed>0?(vdt/sim.speed)*clamp(sim.speed,0.4,1):vdt;
    v.acc+=pdt*9;while(v.acc>=1){v.acc--;const tx=30+Math.random()*380;v.ph.push({x:sx+12,y:sy+12,tx,ty:385,vis:true,sp:260});}
    const absorbRate=0.5+2.6*(P-280)/420+(hon?(CH4F[sim.p.ch4]-0.55)*1.2:0);
    for(const p of v.ph){if(p.vis){const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),st=p.sp*pdt;if(d<=st){p.vis=false;p.x=p.tx;p.y=385;p.vx=(Math.random()-.5)*60;p.vy=-150;p.ir=true;}else{p.x+=dx/d*st;p.y+=dy/d*st;}}
      else if(p.ir){p.x+=p.vx*pdt;p.y+=p.vy*pdt;
        if(p.y>140&&p.y<310&&!p.hit&&Math.random()<absorbRate*pdt){p.hit=true;let best=-1,bd=1e9;for(let i=0;i<nm+ch4n&&i<v.mol.length;i++){const m=v.mol[i],dd=Math.hypot(m.x-p.x,m.y-p.y);if(dd<bd){bd=dd;best=i;}}if(best>=0){v.glow[best]=0.4;p.x=v.mol[best].x;p.y=v.mol[best].y;}
          const down=Math.random()<.5;p.vx=(Math.random()-.5)*120;p.vy=down?150:-150;}
        if(p.y>385&&p.vy>0){p.vy=-150;p.hit=false;}}}
    v.ph=v.ph.filter(p=>p.y>-10&&p.x>-10&&p.x<450);if(v.ph.length>140)v.ph.splice(0,v.ph.length-140);
    for(const p of v.ph){if(p.vis){ctx.strokeStyle='#e8b500';ctx.lineWidth=2.5;ctx.beginPath();const a=Math.atan2(p.ty-p.y,p.tx-p.x);ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-Math.cos(a)*14,p.y-Math.sin(a)*14);ctx.stroke();}
      else{ctx.strokeStyle='#e0452f';ctx.lineWidth=2.2;ctx.beginPath();const a=Math.atan2(p.vy,p.vx),L=16;for(let j=0;j<=8;j++){const f=j/8,px=p.x-Math.cos(a)*L*f+Math.sin(a)*Math.sin(f*12+t*20)*3,py=p.y-Math.sin(a)*L*f-Math.cos(a)*Math.sin(f*12+t*20)*3;j?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();}}
    // labels
    pillIn(ctx,'Sunlight (visible)',150,48,PAL.card,PAL['cv-ink'],11*k,0,380);
    pillIn(ctx,hon?'Greenhouse gases: CO₂ and CH₄':'Greenhouse gases',150,130,PAL.card,PAL['cv-ink'],11*k,0,380);
    pillIn(ctx,'Infrared heat',300,370,PAL.card,'#c0392b',11*k,0,380);
    pillIn(ctx,'Year '+(2025+Math.min(YEARS,Math.floor(sim.t)))+' · '+P.toFixed(0)+' ppm CO₂',230,20,PAL.card,PAL['cv-ink'],12*k,90,380);
    // thermometer
    const tx=396,ty0=60,ty1=350;ctx.fillStyle=PAL.card;rr(ctx,tx,ty0,22,ty1-ty0,11);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();
    const fr=clamp(s.T/5,0,1),fy=ty1-8-(ty1-ty0-20)*fr;ctx.fillStyle='#d23b3b';rr(ctx,tx+6,fy,10,ty1-fy+6,5);ctx.fill();ctx.beginPath();ctx.arc(tx+11,ty1+10,13,0,6.29);ctx.fill();
    for(let c=0;c<=5;c++){const y=ty1-8-(ty1-ty0-20)*c/5;ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(tx-4,y);ctx.lineTo(tx,y);ctx.stroke();txt(ctx,c+'°',tx-7,y,{s:11*k,a:'right',b:'middle',c:PAL['cv-soft']});}
    pill(ctx,'+'+s.T.toFixed(1)+' °C',tx+11,ty0-14,'#b5122d','#fff',12*k);
    // wedge deck
    const n=(sim.wedges||[]).length;
    fitTxt(ctx,'Stabilization wedges',452+170,30,340,15*k,700,PAL['cv-ink']);
    fitTxt(ctx,n+' of 8 needed to keep emissions flat',452+170,52,340,12.5*k,600,n>=8?PAL.s3:PAL['cv-soft']);
    WEDGES.forEach((w,i)=>{const [x,y,W,H]=cardRect(i),on=(sim.wedges||[]).includes(w.id);
      rr(ctx,x,y,W,H,9);ctx.fillStyle=on?'#2c7a46':PAL.card;ctx.fill();ctx.strokeStyle=on?'#2c7a46':PAL.line;ctx.lineWidth=1.5;ctx.stroke();
      icon(ctx,w.ic,x+W/2,y+20,on?'#fff':PAL['cv-ink']);
      fitTxt(ctx,w.l,x+W/2,y+47,W-8,11.5*k,700,on?'#fff':PAL['cv-ink']);
      fitTxt(ctx,w.l2,x+W/2,y+65,W-8,10.5*k,400,on?'#e8f5ec':PAL['cv-soft']);});
    txt(ctx,'Click a card to add or remove it.',452,440,{s:11.5*k,c:PAL['cv-soft']});}
};
function fitTxt(ctx,s,x,y,maxW,size,w,c){ctx.font=w+' '+size+'px '+FONT;const m=ctx.measureText(s).width;const sz=m>maxW?size*maxW/m:size;txt(ctx,s,x,y,{s:sz,w,c,a:'center'});}
function pillIn(ctx,s,x,y,bg,fg,size,x0,x1){ctx.font='700 '+size+'px '+FONT;const w=ctx.measureText(s).width+size*1.1;const cx=clamp(x,x0+w/2+2,x1-w/2-2);pill(ctx,s,cx,y,bg,fg,size);}
function toggleW(sim,id){const w=sim.wedges||(sim.wedges=[]),i=w.indexOf(id);if(i>=0)w.splice(i,1);else w.push(id);}
function cardRect(i){const c=i%3,r=Math.floor(i/3);return [452+c*114,72+r*88,110,80];}
function cardAt(x,y){for(let i=0;i<WEDGES.length;i++){const [cx,cy,w,h]=cardRect(i);if(x>=cx&&x<=cx+w&&y>=cy&&y<=cy+h)return i;}return -1;}
function icon(ctx,ic,x,y,col){ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=2;ctx.lineCap='round';
  const L=(a,b,c,d)=>{ctx.beginPath();ctx.moveTo(x+a,y+b);ctx.lineTo(x+c,y+d);ctx.stroke();};
  if(ic==='car'){rr(ctx,x-11,y-2,22,8,3);ctx.fill();rr(ctx,x-6,y-8,12,7,3);ctx.fill();ctx.beginPath();ctx.arc(x-6,y+7,3,0,6.29);ctx.arc(x+6,y+7,3,0,6.29);ctx.fill();}
  else if(ic==='road'){L(-6,10,-2,-10);L(6,10,2,-10);L(0,8,0,4);L(0,0,0,-4);}
  else if(ic==='house'){ctx.strokeRect(x-8,y-2,16,12);L(-11,-1,0,-11);L(0,-11,11,-1);}
  else if(ic==='factory'){ctx.strokeRect(x-10,y-2,20,12);ctx.strokeRect(x+3,y-12,5,10);}
  else if(ic==='flame'){ctx.beginPath();ctx.moveTo(x,y-11);ctx.quadraticCurveTo(x+10,y,x,y+10);ctx.quadraticCurveTo(x-10,y,x,y-11);ctx.fill();}
  else if(ic==='ccs'){ctx.strokeRect(x-4,y-11,8,12);L(0,3,0,11);L(-4,7,0,11);L(4,7,0,11);}
  else if(ic==='nuclear'){ctx.beginPath();ctx.moveTo(x-9,y+10);ctx.quadraticCurveTo(x-4,y,x-7,y-10);ctx.lineTo(x+7,y-10);ctx.quadraticCurveTo(x+4,y,x+9,y+10);ctx.closePath();ctx.stroke();}
  else if(ic==='wind'){L(0,12,0,-2);for(let j=0;j<3;j++){const a=j*2.09-1.57;L(0,-2,Math.cos(a)*10,-2+Math.sin(a)*10);}}
  else if(ic==='solar'){ctx.beginPath();ctx.moveTo(x-11,y+6);ctx.lineTo(x-5,y-8);ctx.lineTo(x+11,y-8);ctx.lineTo(x+5,y+6);ctx.closePath();ctx.stroke();L(-8,-1,8,-1);L(3,-8,-3,6);}
  else if(ic==='axe'){ctx.beginPath();ctx.moveTo(x,y-11);ctx.lineTo(x+8,y+4);ctx.lineTo(x-8,y+4);ctx.closePath();ctx.stroke();L(-10,-10,10,10);}
  else if(ic==='tree'){ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(x+9,y+4);ctx.lineTo(x-9,y+4);ctx.closePath();ctx.fill();L(0,4,0,11);}
  else if(ic==='soil'){L(-11,6,11,6);L(0,6,0,-4);ctx.beginPath();ctx.ellipse(x-4,y-5,4,2,-.5,0,6.29);ctx.ellipse(x+4,y-6,4,2,.5,0,6.29);ctx.fill();}
  ctx.restore();}
BioLab.register(CLIMATE);
})();
