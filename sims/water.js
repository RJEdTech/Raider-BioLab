(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,RM,lvText}=BioLab.h;

/* Heating curve for water and ethanol. State is enthalpy per gram, h (J/g), measured from
   the substance at -30 °C. Heat in raises h; temperature only rises outside phase changes. */
const SUBS={
  water:{name:'Water',Tm:0,Tb:100,cs:2.09,cl:4.18,cg:2.01,Lf:334,Lv:2260},
  ethanol:{name:'Ethanol',Tm:-114,Tb:78,cs:0.97,cl:2.44,cg:1.42,Lf:108,Lv:841}
};
const TMIN=-30,TMAX=130;
function buildSegs(S){const out=[];let h=0,T=TMIN;
  if(S.Tm>TMIN){const h1=S.cs*(S.Tm-TMIN);out.push({ph:'solid',T0:TMIN,T1:S.Tm,h0:0,h1,c:S.cs});h=h1;out.push({ph:'melt',T:S.Tm,h0:h,h1:h+S.Lf});h+=S.Lf;T=S.Tm;}
  out.push({ph:'liquid',T0:T,T1:S.Tb,h0:h,h1:h+S.cl*(S.Tb-T),c:S.cl});h+=S.cl*(S.Tb-T);
  out.push({ph:'boil',T:S.Tb,h0:h,h1:h+S.Lv});h+=S.Lv;
  out.push({ph:'gas',T0:S.Tb,T1:TMAX,h0:h,h1:h+S.cg*(TMAX-S.Tb),c:S.cg});return out;}
const SEG={water:buildSegs(SUBS.water),ethanol:buildSegs(SUBS.ethanol)};
const HMAX=sub=>SEG[sub][SEG[sub].length-1].h1;
function stateOf(sub,h){for(const g of SEG[sub]){if(h<=g.h1+1e-9){if(g.c)return {ph:g.ph,T:g.T0+(h-g.h0)/g.c,f:0,g};return {ph:g.ph,T:g.T,f:clamp((h-g.h0)/(g.h1-g.h0),0,1),g};}}
  const L=SEG[sub],g=L[L.length-1];return {ph:'gas',T:TMAX,f:0,g};}
function hOf(sub,T){for(const g of SEG[sub]){if(g.c&&T>=g.T0-1e-9&&T<=g.T1+1e-9)return g.h0+(T-g.T0)*g.c;}return 0;}
function segOf(sub,ph){return SEG[sub].find(g=>g.ph===ph);}
function hbonds(sub,s){if(sub==='water'){switch(s.ph){case 'solid':return 3.9;case 'melt':return lerp(3.9,3.4,s.f);case 'liquid':return 3.4-0.4*s.T/100;case 'boil':return 3.0*(1-s.f);default:return 0;}}
  switch(s.ph){case 'liquid':return 1.9-0.3*(s.T-TMIN)/108;case 'boil':return 1.6*(1-s.f);case 'gas':return 0;default:return 1.9;}}
function density(sub,s){if(sub==='water'){const liq=T=>1.000-0.042*Math.pow(clamp(T,0,100)/100,1.6);
    switch(s.ph){case 'solid':return 0.917;case 'melt':return 1/((1-s.f)/0.917+s.f/1.0);case 'liquid':case 'boil':return liq(s.T);default:return 0.0006;}}
  switch(s.ph){case 'liquid':case 'boil':return 0.806-0.00085*s.T;case 'gas':return 0.0015;default:return 0.9;}}
function phaseName(sub,s,cooling){const w=sub==='water';
  switch(s.ph){case 'solid':return w?'Ice (solid)':'Solid ethanol';case 'melt':return cooling?'Freezing':'Melting';case 'liquid':return w?'Liquid water':'Liquid ethanol';
    case 'boil':return cooling?'Condensing':'Boiling';default:return w?'Steam (gas)':'Ethanol vapor';}}

const MX=585,MY=212,MR=158,IR=132;
const WATER={
  id:'water',hash:'water',apUnit:1,order:1,kind:'Simulation',tab:'Properties of water',
  card:'Heat ice into steam and watch hydrogen bonds hold the temperature still while water melts and boils.',
  title:'Properties of water: hydrogen bonds and the heating curve',
  lede:{bio:'Heat a beaker of ice and watch two views at once: the thermometer, and the water molecules themselves. Hydrogen bonds explain why ice floats and why water heats up slowly.',
        honors:'Compare water with ethanol. Water’s extra hydrogen bonds give it a higher specific heat, a higher boiling point, and ice that floats.',
        ap:'Measure specific heat and latent heat from the heating curve. Use the energy readouts to calculate the heat of fusion and vaporization.'},
  scale:{bio:'Left: a real beaker on a hot plate. Right: zoomed in to a patch about 2 nanometers across, just a few dozen molecules.',
         ap:'Left: a real beaker on a hot plate. Right: a patch about 2 nm across. One water molecule is about 0.28 nm wide; each hydrogen bond is about 0.18 nm long.'},
  timeScale:1,dtMax:0.02,prewarm:0,sampleDt:0.1,window:40,unit:'min',chChange:0.5,chReveal:3,
  controls:[
    {id:'power',label:'Heater power',type:'range',min:50,max:500,step:10,def:150,unit:' W',lvl:'bio'},
    {id:'mass',label:'Mass of sample',type:'range',min:50,max:500,step:10,def:100,unit:' g',lvl:'bio'},
    {id:'dir',label:'Hot plate',type:'seg',def:'heat',lvl:'bio',options:[{v:'heat',l:'Heating'},{v:'cool',l:'Cooling'}]},
    {id:'sub',label:'Substance',type:'seg',def:'water',lvl:'honors',options:[{v:'water',l:'Water'},{v:'ethanol',l:'Ethanol'}],
     help:'Ethanol can only form about half as many hydrogen bonds per molecule.',onChange(sim){BioLab.reset(sim);}}
  ],
  actions:[
    {id:'cold',label:'Start at −20 °C',run(sim){const h=hOf(sim.p.sub,-20);sim.st.h=h;sim.st.h0=h;sim.st.cur=stateOf(sim.p.sub,h);}},
    {id:'warm',label:'Start at 20 °C',run(sim){const h=hOf(sim.p.sub,20);sim.st.h=h;sim.st.h0=h;sim.st.cur=stateOf(sim.p.sub,h);}}
  ],
  init(sim){const h=hOf(sim.p.sub,-20);return {h,h0:h,cur:stateOf(sim.p.sub,h)};},
  step(sim,dt){const p=sim.p,s=sim.st;const rate=p.power*60/p.mass*(p.dir==='heat'?1:-1);
    s.h=clamp(s.h+rate*dt,0,HMAX(p.sub));s.cur=stateOf(p.sub,s.h);},
  metrics:[
    {id:'temp',label:'Temperature',unit:'°C',lvl:'bio',min:-30,max:130,d:1,fixed:true,get:s=>s.st.cur.T},
    {id:'phase',label:'State',unit:'',lvl:'bio',text:true,get:s=>phaseName(s.p.sub,s.st.cur,s.p.dir==='cool')},
    {id:'hb',label:'Hydrogen bonds per molecule',unit:'',lvl:'bio',min:0,max:4,d:2,get:s=>hbonds(s.p.sub,s.st.cur)},
    {id:'energy',label:'Energy added',unit:'kJ',lvl:'bio',min:0,max:null,d:1,get:s=>(s.st.h-s.st.h0)*s.p.mass/1000},
    {id:'dens',label:'Density',unit:'g/mL',lvl:'honors',min:0,max:1.1,d:3,get:s=>density(s.p.sub,s.st.cur)},
    {id:'cnow',label:'Specific heat now',unit:'J/g·°C',lvl:'ap',min:0,max:5,d:2,get:s=>s.st.cur.g.c||NaN},
    {id:'qleft',label:'Energy to finish phase change',unit:'kJ',lvl:'ap',min:0,max:null,d:1,
     get:s=>{const c=s.st.cur;if(c.ph!=='melt'&&c.ph!=='boil')return NaN;return (s.p.dir==='heat'?(c.g.h1-s.st.h):(s.st.h-c.g.h0))*s.p.mass/1000;}}
  ],
  defaultGraph:'temp',
  narrate(sim){const p=sim.p,c=sim.st.cur,w=p.sub==='water',cool=p.dir==='cool',hon=atLeast('honors'),T=c.T.toFixed(0),pct=Math.round(c.f*100);
    switch(c.ph){
      case 'solid':return cool?'The ice is getting colder. Each molecule stays locked in the lattice by about four hydrogen bonds.':'Heat makes the molecules in the ice vibrate harder, so the temperature rises. Each one is still locked in place by about four hydrogen bonds.';
      case 'melt':return cool?'<b>The temperature holds at 0 °C while the water freezes.</b> As molecules lock into the ice lattice they form hydrogen bonds and release heat. '+pct+'% is still liquid.'
        :'<b>The temperature is stuck at 0 °C.</b> All the heat is going into breaking hydrogen bonds, not into speeding molecules up. '+pct+'% of the ice has melted, and the ice floats because its lattice has open spaces.';
      case 'liquid':if(cool)return 'The liquid is losing heat. Molecules slow down and form more hydrogen bonds.';
        return w?'Molecules slide past each other, breaking and re-forming hydrogen bonds. Those bonds soak up heat, so water’s temperature climbs slowly'+(hon?' (high specific heat: 4.18 J/g·°C).':'.')
          :'Ethanol has fewer hydrogen bonds to soak up heat, so the same heater warms it faster (specific heat 2.44 J/g·°C).';
      case 'boil':return cool?'<b>The temperature holds at '+T+' °C while the gas condenses</b>, releasing the energy it took to break the hydrogen bonds.'
        :'<b>The temperature holds at '+T+' °C.</b> Molecules are breaking all of their hydrogen bonds and escaping as gas. That takes far more energy than melting, so this plateau is long. '+pct+'% has boiled away.';
      default:return c.T>=TMAX-0.01&&!cool?'All of the sample is gas at the top of this thermometer’s range.':'Gas molecules fly apart with no hydrogen bonds holding them together.';}},
  tour:[
    {title:'Two views at once',text:'On the left is a real beaker of ice on a hot plate. On the right we zoom in tens of millions of times to see the water molecules themselves. Red is oxygen, white is hydrogen.',focus:[[30,60,280,345],[MX-MR-6,MY-MR-6,2*MR+12,2*MR+12]],speed:0.05},
    {title:'Ice is a locked lattice',text:{bio:'In ice, each water molecule holds four neighbors with <b>hydrogen bonds</b> (the dashed lines). They lock into hexagons with open space in the middle.',honors:'In ice, each molecule makes four hydrogen bonds: its two H atoms bond to neighbors’ O atoms, and its O accepts two H atoms. The result is an open hexagonal lattice.'},focus:[MX-MR-6,MY-MR-6,2*MR+12,2*MR+12],speed:0.05,setup(sim){const h=hOf('water',-20);sim.st.h=h;sim.st.cur=stateOf('water',h);}},
    {title:'Melting: heat breaks bonds',text:'Now the ice melts. Watch the thermometer: it stays at 0 °C. The heat is breaking hydrogen bonds, freeing molecules from the lattice, instead of making them move faster.',focus:[[30,60,280,345],[MX-MR-6,MY-MR-6,2*MR+12,2*MR+12]],speed:0.5,setup(sim){const g=segOf('water','melt');sim.st.h=g.h0+15;sim.st.h0=hOf('water',-20);sim.st.cur=stateOf('water',sim.st.h);}},
    {title:'Ice floats',text:'The open lattice takes up more space than liquid water, so ice is less dense (0.92 vs 1.00 g/mL). The floating ice insulates ponds, so fish survive the winter underneath.',focus:[60,110,220,200],speed:0.5},
    {title:'Liquid water warms slowly',text:{bio:'Once the ice is gone, the temperature finally rises. Water still has many hydrogen bonds to break, so it takes a lot of heat to warm up. This is why oceans keep coastal climates mild.',honors:'Liquid water’s specific heat (4.18 J/g·°C) is unusually high for such a small molecule, because heat goes into breaking hydrogen bonds before molecules speed up.'},focus:[[30,60,280,345],[MX-MR-6,MY-MR-6,2*MR+12,2*MR+12]],speed:1,setup(sim){const h=hOf('water',20);sim.st.h=h;sim.st.cur=stateOf('water',h);}},
    {title:'Boiling: escaping completely',text:'At 100 °C, molecules must break every hydrogen bond to escape as gas. The temperature stays flat for a long time. Boiling takes about 7 times more energy than melting.',focus:[[30,40,280,365],[MX-MR-6,MY-MR-6,2*MR+12,2*MR+12]],speed:1,setup(sim){const g=segOf('water','boil');sim.st.h=g.h0+40;sim.st.cur=stateOf('water',sim.st.h);}},
    {lvl:'honors',title:'Ethanol for comparison',text:'Ethanol forms only about half as many hydrogen bonds per molecule. The same heater warms it faster, and it boils at just 78 °C.',focus:[[30,60,280,345],[MX-MR-6,MY-MR-6,2*MR+12,2*MR+12]],speed:1,setup(sim){BioLab.setValues(sim,{sub:'ethanol'});const h=hOf('ethanol',20);sim.st.h=h;sim.st.h0=h;sim.st.cur=stateOf('ethanol',h);}},
    {lvl:'ap',title:'Reading the curve',text:'The slope of each rising section is power ÷ (mass × specific heat). The length of each flat section is mass × latent heat ÷ power. You can measure both from the graph and the Energy added readout.',focus:[0,0,800,450],pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{sub:'water'});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'Ice is melting on the hot plate. While it melts, what does the thermometer do?',
     choices:['It rises steadily','It stays at 0 °C until all the ice has melted','It drops below 0 °C'],correct:1,
     change:{},changeText:'Ice is melting',watch:'temp',
     explain:{bio:'All the heat goes into breaking hydrogen bonds to free molecules from the ice lattice. Until every bond in the lattice is broken, the molecules don’t speed up, so the temperature stays at 0 °C.',
              ap:'Melting absorbs the latent heat of fusion (334 J/g) at constant temperature. The energy raises potential energy (bonds broken), not kinetic energy, so T is flat.'}},
    {lvl:'bio',q:'Why does ice float on liquid water?',choices:['Ice is denser than liquid water','Hydrogen bonds hold ice molecules in an open lattice, so ice is less dense','Ice has air trapped inside it'],correct:1,instant:true,
     explain:'In ice, hydrogen bonds hold every molecule at arm’s length in a hexagonal lattice. In liquid water, molecules crowd closer. Ice’s density is 0.917 g/mL vs 1.000 g/mL for liquid water, so ice floats.'},
    {lvl:'bio',q:'Liquid water at 20 °C sits on a cooling plate. When it reaches 0 °C, what happens?',
     choices:['It keeps getting colder right away','It holds at 0 °C while it freezes','It jumps straight to −20 °C'],correct:1,
     baseline:{dir:'cool'},baselineAction:'warm',change:{},changeText:'Cooling',watch:'temp',
     explain:'As water freezes, molecules form hydrogen bonds and release heat. That released heat keeps the temperature at 0 °C until all of the water has frozen.'},
    {lvl:'honors',q:'Same heater, same mass, both starting at 20 °C. Compared with water, how fast does ethanol’s temperature rise?',
     choices:['Faster','Slower','The same'],correct:0,
     baseline:{sub:'ethanol'},baselineAction:'warm',change:{},changeText:'Heating ethanol at 150 W',watch:'temp',
     explain:{honors:'Ethanol’s specific heat is 2.44 J/g·°C vs 4.18 for water. With fewer hydrogen bonds to absorb heat, ethanol’s temperature rises about 1.7 times faster.'}},
    {lvl:'honors',q:'You double the water from 100 g to 200 g but keep the same heater. What happens to how fast the temperature rises?',
     choices:['It rises twice as fast','It rises half as fast','No change'],correct:1,
     baselineAction:'warm',change:{mass:200},changeText:'Mass doubled to 200 g',watch:'temp',
     explain:{honors:'The same energy per second is spread over twice as many molecules, so each degree takes twice as long. ΔT = Q ÷ (m × c).'}},
    {lvl:'ap',q:'For 100 g of water, which takes more energy: melting it at 0 °C, or boiling it away at 100 °C?',
     choices:['Melting','Boiling, about 7 times more','About the same'],correct:1,instant:true,
     explain:'Melting needs 334 J/g × 100 g = 33.4 kJ. Boiling needs 2260 J/g × 100 g = 226 kJ, about 6.8 times more. To boil, each molecule must break all of its hydrogen bonds, not just loosen the lattice. Check it with the Energy added readout.'},
    {lvl:'ap',q:'A 300 W heater melts 100 g of ice that is already at 0 °C. About how long does the melting take?',
     choices:['About 2 minutes','About 19 minutes','About 11 seconds'],correct:0,instant:true,
     explain:'Q = 100 g × 334 J/g = 33,400 J. At 300 J/s that takes 111 s, about 1.9 minutes. Set the heater to 300 W and time the 0 °C plateau to check.'}
  ],
  lab:{bio:'<p><b>Question:</b> How does the mass of water affect how fast it heats up?</p><ol><li>Press <b>Start at 20 °C</b>, keep the heater at 150 W, and pause at exactly 1:00 on the clock.</li><li>Record the temperature. Repeat for 50, 100, 200 and 400 g.</li><li>Plot mass (x) against temperature (y).</li></ol><p>Write a claim about mass and heating, using two numbers from your table.</p>',
       honors:'<p><b>Question:</b> Which has the higher specific heat, water or ethanol?</p><ol><li>Press <b>Start at 20 °C</b> with 100 g at 150 W. Pause at 1:00 and record. Do this for water, then ethanol.</li><li>Energy added = power × time. Calculate c = Q ÷ (m × ΔT) for each.</li></ol><p>Explain the difference using hydrogen bonds.</p>',
       ap:'<p><b>Question:</b> Can you measure water’s latent heats from the heating curve?</p><ol><li>Start at −20 °C. Record a trial just as the 0 °C plateau begins and again just as it ends.</li><li>Do the same at the start and end of the 100 °C plateau.</li><li>Latent heat = ΔEnergy ÷ mass. Compare with 334 and 2260 J/g.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why vaporization needs so much more energy than fusion, at the level of hydrogen bonds.</p>'},
  terms:[{t:'Hydrogen bond',d:'A weak attraction between a slightly positive H on one molecule and a slightly negative O (or N) on another.'},{t:'Specific heat',d:'Energy needed to raise 1 g of a substance by 1 °C. Water’s is very high: 4.18 J/g·°C.'},{t:'Density',d:'Mass per volume. Ice (0.917 g/mL) is less dense than liquid water, so it floats.'},
    {lvl:'honors',t:'Polarity',d:'An uneven share of electrons, which makes water’s O slightly negative and its H atoms slightly positive.'},{lvl:'honors',t:'Heat of fusion',d:'Energy to melt 1 g at its melting point: 334 J/g for water.'},{lvl:'honors',t:'Heat of vaporization',d:'Energy to boil 1 g: 2260 J/g for water. This is why sweating cools you.'},
    {lvl:'ap',t:'Latent heat',d:'Energy absorbed or released during a phase change at constant temperature.'},{lvl:'ap',t:'Evaporative cooling',d:'The fastest molecules escape as gas, carrying energy away and lowering the temperature of what is left.'}],
  about:'<p>The sample’s energy is tracked as heat per gram from −30 °C. Each second, heat added = power ÷ mass. Outside phase changes, temperature rises by heat ÷ specific heat. During melting or boiling, temperature is constant until the latent heat has been supplied.</p><p>Values used: water c(ice) = 2.09, c(liquid) = 4.18, c(steam) = 2.01 J/g·°C, fusion 334 J/g, vaporization 2260 J/g. Ethanol c(liquid) = 2.44 J/g·°C, boils at 78 °C, vaporization 841 J/g.</p><p>Simplified: no heat is lost to the room, all heater power goes into the sample, steam stays in the system, and hydrogen bonds per molecule are typical textbook estimates (ice ≈ 4, liquid ≈ 3–3.4, ethanol ≈ 1.6–1.9).</p>',
  initVis(sim){const v=sim.vis,r=rng(3),eth=sim.p.sub==='ethanol';
    // honeycomb lattice for ice
    const a=eth?46:33,pts=[],key=new Set();
    for(let i=-6;i<=6;i++)for(let j=-6;j<=6;j++){const cx=MX+i*a*1.5,cy=MY+(j+(i&1)*0.5)*a*Math.sqrt(3);
      for(let k=0;k<6;k++){const x=cx+a*Math.cos(k*Math.PI/3),y=cy+a*Math.sin(k*Math.PI/3),kk=Math.round(x)+','+Math.round(y);if(key.has(kk))continue;key.add(kk);if(Math.hypot(x-MX,y-MY)<=IR)pts.push([x,y]);}}
    const N=eth?Math.min(16,pts.length):pts.length;
    v.mol=[];for(let i=0;i<N;i++){const q=pts[i];v.mol.push({lx:q[0],ly:q[1],x:q[0],y:q[1],vx:0,vy:0,ang:r()*6.28,spin:(r()-.5)*2,ph:r()*6.28});}
    v.mol.sort(()=>r()-.5);
    v.edges=[];for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){const d=Math.hypot(v.mol[i].lx-v.mol[j].lx,v.mol[i].ly-v.mol[j].ly);if(d<a*1.1)v.edges.push([i,j]);}
    v.a=a;v.bub=[];v.steam=[];v.bAcc=0;},
  thumbSetup(s){const g=segOf('water','melt');s.st.h=g.h0+170;s.st.cur=stateOf('water',s.st.h);},
  draw(sim,ctx,vdt,k,t){
    const p=sim.p,s=sim.st,c=s.cur,v=sim.vis,R=Math.random,eth=p.sub==='ethanol',S=SUBS[p.sub];
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // ---- macroscopic beaker ----
    const BX0=70,BX1=270,BY0=110,BY1=368;
    ctx.fillStyle=p.dir==='heat'?PAL['cv-lamp']:'#3a6ea8';rr(ctx,52,370,236,22,6);ctx.fill();
    if(p.dir==='heat'){ctx.strokeStyle='rgba(255,70,30,'+clamp(p.power/500,0.2,0.95)+')';ctx.lineWidth=4;ctx.beginPath();for(let x=80;x<=260;x+=6){const y=381+Math.sin(x*0.35)*4;x===80?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
    txt(ctx,p.dir==='heat'?'Hot plate '+p.power+' W':'Cooling plate',170,412,{s:12.5*k,w:600,a:'center',c:PAL['cv-soft']});
    const full=70+170*Math.sqrt(p.mass/500);
    const water='rgba(120,180,225,0.55)',ice='rgba(205,236,250,0.95)';
    let surf=BY1;
    if(c.ph==='solid'){const hgt=full*1.09;ctx.fillStyle=ice;rr(ctx,BX0+6,BY1-hgt,BX1-BX0-12,hgt-2,6);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.5;ctx.stroke();
      ctx.strokeStyle='rgba(120,170,200,.6)';ctx.beginPath();ctx.moveTo(BX0+40,BY1-hgt+15);ctx.lineTo(BX0+80,BY1-hgt*0.5);ctx.moveTo(BX0+130,BY1-hgt+10);ctx.lineTo(BX0+110,BY1-20);ctx.stroke();}
    else if(c.ph==='melt'||c.ph==='liquid'||c.ph==='boil'){const frac=c.ph==='melt'?Math.max(0.06,c.f):c.ph==='boil'?(1-c.f):1;const hgt=Math.max(6,full*frac);surf=BY1-hgt;
      ctx.fillStyle=water;ctx.fillRect(BX0+3,surf,BX1-BX0-6,hgt-2);
      if(c.ph==='melt'){const n=Math.max(1,Math.ceil((1-c.f)*6));for(let i=0;i<n;i++){const sz=34-(i%3)*4,x=BX0+14+(i%4)*44+(i>3?22:0),y0=(i>3?surf-6:surf-sz*0.12);
          const y=Math.min(y0+(i>3?-sz*0.4:0),BY1-sz-2);ctx.fillStyle=ice;rr(ctx,x,y,sz,sz,4);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.2;ctx.stroke();}
        if(atLeast('bio'))txt(ctx,'Ice floats',BX0+100,surf-28,{s:12*k,w:700,a:'center',c:PAL['cv-ink']});}
      if(c.ph==='boil'){v.bAcc+=vdt*(12+p.power/25);while(v.bAcc>=1){v.bAcc--;v.bub.push({x:BX0+15+R()*(BX1-BX0-30),y:BY1-6,r:2+R()*4});}}
    }
    if(c.ph==='boil'||c.ph==='gas'){if(R()<vdt*14)v.steam.push({x:BX0+30+R()*140,y:c.ph==='gas'?BY1-40:surf-6,life:2.2,r:8+R()*8});}
    for(const b of v.bub){b.y-=60*vdt;ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.29);ctx.stroke();}
    v.bub=v.bub.filter(b=>b.y>surf+3&&c.ph==='boil');
    for(const m of v.steam){m.y-=26*vdt;m.life-=vdt;m.r+=6*vdt;ctx.globalAlpha=clamp(m.life/2.2,0,1)*0.35;ctx.fillStyle=PAL['cv-soft'];ctx.beginPath();ctx.arc(m.x+Math.sin(m.life*3)*4,m.y,m.r,0,6.29);ctx.fill();}
    ctx.globalAlpha=1;v.steam=v.steam.filter(m=>m.life>0);if(v.steam.length>60)v.steam.splice(0,v.steam.length-60);
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(BX0,BY0);ctx.lineTo(BX0,BY1);ctx.lineTo(BX1,BY1);ctx.lineTo(BX1,BY0);ctx.stroke();
    // thermometer
    ctx.fillStyle=PAL['card'];rr(ctx,243,64,12,292,6);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();
    const th=clamp((c.T-TMIN)/(TMAX-TMIN),0,1)*276;ctx.fillStyle='#d32f2f';ctx.fillRect(246,352-th,6,th+6);ctx.beginPath();ctx.arc(249,360,9,0,6.29);ctx.fill();
    txt(ctx,(eth?'Ethanol':'Water')+', '+p.mass+' g',16,10+14*k,{s:14*k,w:700});
    txt(ctx,c.T.toFixed(1)+' °C',16,14+14*k+20*k,{s:20*k,w:800,c:'#d32f2f'});
    // zoom cone
    ctx.strokeStyle=PAL['cv-glass'];ctx.globalAlpha=.5;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(205,surf+20>BY1?BY1-20:surf+20);ctx.lineTo(MX-60,MY-MR+12);ctx.moveTo(205,surf+20>BY1?BY1-20:surf+20);ctx.lineTo(MX-60,MY+MR-12);ctx.stroke();ctx.globalAlpha=1;
    // ---- molecular view ----
    ctx.save();ctx.beginPath();ctx.arc(MX,MY,MR,0,6.29);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.clip();
    const N=v.mol.length,mode=i=>{switch(c.ph){case 'solid':return 'L';case 'melt':return i<(1-c.f)*N?'L':'Q';case 'liquid':return 'Q';case 'boil':return i<(1-c.f)*N?'Q':'G';default:return 'G';}};
    const temp=c.T,vib=RM?0:(1.2+(temp-TMIN)/40),qs=Math.sqrt((temp+273)/273)*(RM?20:55);
    const modes=v.mol.map((m,i)=>mode(i));
    v.mol.forEach((m,i)=>{const md=modes[i];
      if(md==='L'){m.x+=(m.lx-m.x)*Math.min(1,4*vdt);m.y+=(m.ly-m.y)*Math.min(1,4*vdt);m.vx=m.vy=0;}
      else if(md==='Q'){m.vx+=(R()-.5)*qs*8*vdt;m.vy+=(R()-.5)*qs*8*vdt;const sp=Math.hypot(m.vx,m.vy);if(sp>qs){m.vx*=qs/sp;m.vy*=qs/sp;}m.ang+=m.spin*vdt;}
      else{if(Math.hypot(m.vx,m.vy)<120){const a=R()*6.28;m.vx=Math.cos(a)*180;m.vy=Math.sin(a)*180;}m.ang+=m.spin*3*vdt;}
      if(md!=='L'){m.x+=m.vx*vdt;m.y+=m.vy*vdt;const dx=m.x-MX,dy=m.y-MY,d=Math.hypot(dx,dy);if(d>IR){const nx=dx/d,ny=dy/d;m.x=MX+nx*IR;m.y=MY+ny*IR;const dot=m.vx*nx+m.vy*ny;m.vx-=2*dot*nx;m.vy-=2*dot*ny;}}});
    // soft repulsion among liquid molecules
    const a=v.a;for(let i=0;i<N;i++){if(modes[i]!=='Q')continue;for(let j=0;j<N;j++){if(j===i||modes[j]==='G')continue;const A=v.mol[i],B=v.mol[j],dx=A.x-B.x,dy=A.y-B.y,d=Math.hypot(dx,dy);if(d<a*0.85&&d>0.01){const f=(a*0.85-d)*0.5;A.x+=dx/d*f;A.y+=dy/d*f;}}}
    // hydrogen bonds
    ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2.2;ctx.setLineDash([5,4]);ctx.beginPath();
    const pos=i=>{const m=v.mol[i];if(modes[i]==='L')return [m.x+Math.sin(t*9+m.ph)*vib,m.y+Math.cos(t*8+m.ph)*vib];return [m.x,m.y];};
    const P=v.mol.map((m,i)=>pos(i));
    if(c.ph==='solid'||c.ph==='melt'){for(const e of v.edges){if(modes[e[0]]==='L'&&modes[e[1]]==='L'){ctx.moveTo(P[e[0]][0],P[e[0]][1]);ctx.lineTo(P[e[1]][0],P[e[1]][1]);}}}
    const thr=a*(eth?0.95:1.18)*(0.75+0.25*hbonds(p.sub,c)/(eth?1.9:3.4));
    for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){if(modes[i]==='G'||modes[j]==='G')continue;if(modes[i]==='L'&&modes[j]==='L')continue;const d=Math.hypot(P[i][0]-P[j][0],P[i][1]-P[j][1]);if(d<thr){ctx.moveTo(P[i][0],P[i][1]);ctx.lineTo(P[j][0],P[j][1]);}}
    ctx.stroke();ctx.setLineDash([]);
    // molecules
    v.mol.forEach((m,i)=>{const [x,y]=P[i];
      if(!eth){const hd=10.5;ctx.fillStyle='#f2f2f2';ctx.strokeStyle='#8a8a90';ctx.lineWidth=1;
        for(const s2 of [-0.91,0.91]){ctx.beginPath();ctx.arc(x+Math.cos(m.ang+s2)*hd,y+Math.sin(m.ang+s2)*hd,4.6,0,6.29);ctx.fill();ctx.stroke();}
        ctx.fillStyle='#d64545';ctx.beginPath();ctx.arc(x,y,8.2,0,6.29);ctx.fill();}
      else{const ca=Math.cos(m.ang),sa=Math.sin(m.ang);ctx.fillStyle='#6f7178';ctx.beginPath();ctx.arc(x-ca*13,y-sa*13,8,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(x,y,8,0,6.29);ctx.fill();
        ctx.fillStyle='#d64545';ctx.beginPath();ctx.arc(x+ca*12,y+sa*12,7,0,6.29);ctx.fill();ctx.fillStyle='#f2f2f2';ctx.strokeStyle='#8a8a90';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x+ca*12+Math.cos(m.ang+1.2)*9,y+sa*12+Math.sin(m.ang+1.2)*9,4.2,0,6.29);ctx.fill();ctx.stroke();}});
    ctx.restore();
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=6;ctx.beginPath();ctx.arc(MX,MY,MR,0,6.29);ctx.stroke();
    txt(ctx,'Zoomed in: about 2 nm across',MX,MY+MR+8+12*k,{s:12.5*k,w:600,a:'center',c:PAL['cv-soft']});
    // legend
    const ly=MY+MR+30+16*k;let lx=MX-150;const lab=(t2)=>{txt(ctx,t2,lx,ly,{s:12*k,c:PAL['cv-soft']});ctx.font='400 '+12*k+'px '+BioLab.h.FONT;lx+=ctx.measureText(t2).width+16;};
    ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2.2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(lx,ly-4);ctx.lineTo(lx+24,ly-4);ctx.stroke();ctx.setLineDash([]);lx+=30;lab('hydrogen bond');
    ctx.fillStyle='#d64545';ctx.beginPath();ctx.arc(lx+6,ly-4,6,0,6.29);ctx.fill();lx+=16;lab('O');
    ctx.fillStyle='#f2f2f2';ctx.strokeStyle='#8a8a90';ctx.lineWidth=1;ctx.beginPath();ctx.arc(lx+5,ly-4,4.6,0,6.29);ctx.fill();ctx.stroke();lx+=14;lab('H');
    if(eth){ctx.fillStyle='#6f7178';ctx.beginPath();ctx.arc(lx+6,ly-4,6,0,6.29);ctx.fill();lx+=16;lab('C');}
    pill(ctx,phaseName(p.sub,c,p.dir==='cool'),MX,MY-MR+22,PAL['card'],PAL['cv-ink'],12.5*k);
  }
};
BioLab.register(WATER);
})();
