(function(){
'use strict';
const {clamp,rng,randn,rr,txt,pill,atLeast,PAL,RM,axes,legend,serColor,fmtNum}=BioLab.h;

/* Potato osmosis lab: cores soak in sucrose (or NaCl) solutions; mass change follows the
   water-potential difference between the solution and the potato cells. */
const R_GAS=0.0831;           // L·bar/(mol·K)
const C_CELL=0.30;            // potato cell solute concentration, osmol/L (sucrose-equivalent)
const SETS={std:[0,0.2,0.4,0.6,0.8,1.0],fine:[0.20,0.25,0.30,0.35,0.40,0.45]};
const BX=i=>38+i*92;          // beaker left edge
const iFor=p=>p.solute==='nacl'?2:1;
function eqPct(osm){ // equilibrium % mass change for a given outside osmolarity
  const d=C_CELL-osm;
  return d>=0?60*d:-30*(1-Math.exp(2*d));
}
function concs(p){return SETS[atLeast('honors')?p.range:'std'];}
function newRun(sim){const r=rng((Math.random()*1e9)|0),p=sim.p;
  return {tSoak:0,restart:false,cores:concs(p).map((c,i)=>({c,m0:2.0+r()*0.6,dev:randn(r)*1.1,pct:0,rate:0,ofs:(r()-0.5)*0.004}))};}
function iso(sim){const cs=sim.st.cores;for(let i=0;i<cs.length-1;i++){const a=cs[i],b=cs[i+1];const pa=meas(a),pb=meas(b);
  if(pa>=0&&pb<0){return a.c+(b.c-a.c)*pa/(pa-pb);}}return NaN;}
function meas(c){const m=c.m0*(1+c.pct/100)+c.ofs;return 100*(Math.round(m*1000)/1000-c.m0)/c.m0;}
const sel=sim=>sim.st.cores[clamp((sim.p.bal|0)-1,0,5)];

const SIM={
  id:'potato',hash:'potato',apUnit:2,order:5,kind:'Virtual lab',tab:'Potato osmosis lab',
  card:'Soak potato cores in sugar solutions for a day, weigh them, and find the concentration where they neither gain nor lose water.',
  title:'Potato osmosis lab: finding the isotonic point',
  prereq:['transport'],
  lede:{bio:'Potato cores soak in sugar solutions of different strengths. Water moves in or out by osmosis, so the cores gain or lose mass.',
        honors:'Measure percent mass change across a range of sucrose solutions, graph it, and find the isotonic concentration where the line crosses zero.',
        ap:'Use the isotonic point to calculate the water potential of potato cells with ψs = −iCRT, and test how temperature and NaCl change the result.'},
  scale:'Real lab scale: potato cores about 3 cm long and 1 cm wide, each weighing about 2 g, soaking in 50 mL beakers.',
  timeScale:3,dtMax:0.02,prewarm:0,sampleDt:0.1,window:24,unit:'h',timeLabel:'Soak time',chChange:0.05,chReveal:24,
  clock(sim){return 'Soak time '+sim.st.tSoak.toFixed(1)+' h';},
  controls:[
    {id:'bal',label:'Core on the balance',type:'select',def:1,lvl:'bio',options:[1,2,3,4,5,6].map(n=>({v:n,l:'Beaker '+n})),help:'Pick which core to weigh.'},
    {id:'range',label:'Concentrations',type:'seg',def:'std',lvl:'honors',options:[{v:'std',l:'0 to 1.0 M'},{v:'fine',l:'0.20 to 0.45 M'}],help:'Zoom in on the crossing point. Changing this starts a new soak.',onChange(sim){sim.st.restart=true;}},
    {id:'temp',label:'Temperature',type:'range',min:5,max:40,step:1,def:22,unit:' °C',lvl:'honors',help:'Warmer water moves faster.'},
    {id:'solute',label:'Solute',type:'seg',def:'sucrose',lvl:'ap',options:[{v:'sucrose',l:'Sucrose (i = 1)'},{v:'nacl',l:'NaCl (i = 2)'}],help:'Changing this starts a new soak.',onChange(sim){sim.st.restart=true;}}
  ],
  actions:[{id:'fresh',label:'Start a new soak',lvl:'bio',run(sim){sim.st.restart=true;}}],
  init(sim){return newRun(sim);},
  step(sim,dt){let s=sim.st;const p=sim.p;
    if(s.restart){sim.st=newRun(sim);s=sim.st;}
    const tau=3*Math.pow(1.04,22-p.temp),i=iFor(p);s.tSoak+=dt;
    s.cores.forEach(c=>{const eq=eqPct(i*c.c)+c.dev;const d=(eq-c.pct)/tau;c.rate=d;c.pct+=d*dt;});},
  metrics:[
    {id:'molar',label:'Beaker molarity',unit:'M',lvl:'bio',min:0,max:1,d:2,get:s=>sel(s).c},
    {id:'mass',label:'Balance reading',unit:'g',lvl:'bio',min:0,max:null,d:3,get:s=>{const c=sel(s);return Math.round((c.m0*(1+c.pct/100)+c.ofs)*1000)/1000;}},
    {id:'pct',label:'Mass change',unit:'%',lvl:'bio',min:-30,max:25,d:1,get:s=>meas(sel(s))},
    {id:'iso',label:'Isotonic point (from your cores)',unit:'M',lvl:'honors',min:0,max:1,d:2,get:s=>iso(s)},
    {id:'psis',label:'ψs of this solution',unit:'bar',lvl:'ap',min:-50,max:0,d:2,get:s=>-iFor(s.p)*sel(s).c*R_GAS*(s.p.temp+273.15)},
    {id:'psi',label:'Potato cell water potential',unit:'bar',lvl:'ap',min:-20,max:0,d:2,get:s=>{const m=iso(s);return Number.isFinite(m)?-iFor(s.p)*m*R_GAS*(s.p.temp+273.15):NaN;}}
  ],
  graphs:[{id:'curve',label:'% change vs. concentration',custom:true},{id:'pct',label:'Mass change of this core',lines:['pct']},{id:'mass',label:'Balance reading',lines:['mass']}],
  defaultGraph:'curve',
  plot(sim,ctx,box,id){const cs=sim.st.cores,fine=cs[0].c>0.1,xmax=fine?0.5:1.05,xmin=fine?0.15:0;
    const ax=axes(ctx,box,{xmin,xmax,ymin:-30,ymax:25,xl:(sim.p.solute==='nacl'&&atLeast('ap')?'NaCl':'Sucrose')+' concentration (M)',yl:'Mass change (%)'});
    ctx.strokeStyle=PAL['g-axis'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ax.X(xmin),ax.Y(0));ctx.lineTo(ax.X(xmax),ax.Y(0));ctx.stroke();
    const pts=cs.map(c=>[c.c,meas(c)]);ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2;ctx.beginPath();pts.forEach((q,i)=>{i?ctx.lineTo(ax.X(q[0]),ax.Y(q[1])):ctx.moveTo(ax.X(q[0]),ax.Y(q[1]));});ctx.stroke();
    pts.forEach((q,i)=>{ctx.fillStyle=(i===(sim.p.bal|0)-1)?PAL['g-line']:PAL['g-dot'];ctx.beginPath();ctx.arc(ax.X(q[0]),ax.Y(q[1]),5.5,0,6.29);ctx.fill();});
    const m=iso(sim);if(Number.isFinite(m)&&sim.st.tSoak>2){const x=ax.X(m);ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['muted'];ctx.beginPath();ctx.moveTo(x,box.T);ctx.lineTo(x,box.T+box.H);ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'isotonic ≈ '+m.toFixed(2)+' M',x+6,box.T+14,{s:13,w:600,c:PAL['fg']});}
    txt(ctx,'Soak time '+sim.st.tSoak.toFixed(1)+' h',box.L+box.W-4,box.T+box.H-8,{s:12,c:PAL['muted'],a:'right'});},
  initVis(sim){sim.vis.drops=[];sim.vis.acc=[0,0,0,0,0,0];},
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis,hon=atLeast('honors'),ap=atLeast('ap');if(!v.drops)SIM.initVis(sim);
    ctx.fillStyle=PAL['card'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,382,800,68);
    txt(ctx,'Soak time '+s.tSoak.toFixed(1)+' h',16,28,{s:15*k,w:700});
    txt(ctx,(p.solute==='nacl'&&ap?'NaCl':'Sucrose')+' solutions'+(hon?' · '+p.temp+' °C':''),16,48,{s:12.5*k,c:PAL['cv-soft']});
    const selI=(p.bal|0)-1;
    s.cores.forEach((c,i)=>{const x=BX(i),w=74,top=150,bot=376;
      // solution, tinted by concentration
      ctx.fillStyle=PAL['cv-water'];ctx.fillRect(x+3,top+34,w-6,bot-top-36);
      ctx.fillStyle='rgba(214,170,60,'+(0.05+c.c*0.28)+')';ctx.fillRect(x+3,top+34,w-6,bot-top-36);
      // core: size exaggerated so a few percent is visible
      const f=1+c.pct/100*2.2,cw=48*Math.cbrt(f)*1.05,ch=20*Math.cbrt(f),cx=x+w/2,cy=bot-ch/2-8;
      ctx.fillStyle='#e7cf86';ctx.strokeStyle='#a8873b';ctx.lineWidth=1.5;rr(ctx,cx-cw/2,cy-ch/2,cw,ch,ch/2.2);ctx.fill();ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.35)';rr(ctx,cx-cw/2+4,cy-ch/2+3,cw-8,ch*0.3,3);ctx.fill();
      // water movement: droplets travel between solution and core at a rate set by the model
      v.acc[i]+=Math.abs(c.rate)*vdt*sim.def.timeScale*0.9;
      while(v.acc[i]>=1){v.acc[i]--;const ang=Math.random()*Math.PI-Math.PI,rad=42;v.drops.push({i,inward:c.rate>0,a:ang,r:c.rate>0?rad:6,life:1});}
      // glass
      ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,top+6);ctx.lineTo(x,bot);ctx.lineTo(x+w,bot);ctx.lineTo(x+w,top+6);ctx.stroke();
      ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x+3,top+34);ctx.lineTo(x+w-3,top+34);ctx.stroke();
      if(i===selI){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;rr(ctx,x-6,top-34,w+12,bot-top+46,10);ctx.stroke();}
      txt(ctx,'Beaker '+(i+1),x+w/2,top-14,{s:12*k,c:PAL['cv-soft'],a:'center'});
      txt(ctx,c.c.toFixed(2)+' M',x+w/2,top+4,{s:14*k,w:700,a:'center'});
      const pc=meas(c);txt(ctx,(pc>=0?'+':'')+pc.toFixed(1)+'%',x+w/2,bot+26,{s:14*k,w:700,a:'center',c:pc>0.3?PAL['s2']:pc<-0.3?PAL['s1']:PAL['cv-ink']});});
    // droplets
    v.drops.forEach(d=>{const c=s.cores[d.i],cx=BX(d.i)+37,cy=376-18;d.r+=(d.inward?-34:34)*vdt;d.life-=vdt*0.8;
      const x=cx+Math.cos(d.a)*d.r*1.1,y=cy+Math.sin(d.a)*d.r*0.6;ctx.fillStyle=PAL['s2'];ctx.globalAlpha=clamp(d.life,0,1)*0.85;ctx.beginPath();ctx.arc(x,y,2.6,0,6.29);ctx.fill();});
    ctx.globalAlpha=1;v.drops=v.drops.filter(d=>d.life>0&&d.r>4&&d.r<46);if(v.drops.length>160)v.drops.splice(0,v.drops.length-160);
    // balance
    const c=sel(sim),bx=600;ctx.fillStyle=PAL['cv-lamp'];rr(ctx,bx,300,180,78,10);ctx.fill();ctx.fillStyle='#bfc6cc';rr(ctx,bx+30,280,120,14,6);ctx.fill();
    ctx.fillStyle='#10261a';rr(ctx,bx+28,318,124,40,6);ctx.fill();
    const m=Math.round((c.m0*(1+c.pct/100)+c.ofs)*1000)/1000;txt(ctx,m.toFixed(3)+' g',bx+90,346,{s:22,w:700,c:'#7dffa8',a:'center',b:'alphabetic'});
    const f=1+c.pct/100*2.2;ctx.fillStyle='#e7cf86';ctx.strokeStyle='#a8873b';rr(ctx,bx+90-24*Math.cbrt(f),262-10*Math.cbrt(f),48*Math.cbrt(f),20*Math.cbrt(f),9);ctx.fill();ctx.stroke();
    txt(ctx,'Balance: core from beaker '+(selI+1),bx+90,240,{s:12.5*k,w:600,a:'center'});
    txt(ctx,'started at '+c.m0.toFixed(3)+' g',bx+90,402,{s:12*k,c:PAL['cv-ink'],a:'center'});
    // legend
    ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.arc(24,436,3,0,6.29);ctx.fill();txt(ctx,'water moving (in or out of the core)',34,440,{s:12*k,c:PAL['cv-ink']});
  },
  narrate(sim){const s=sim.st,p=sim.p,c=sel(sim),pc=meas(c),i=iFor(p),osm=i*c.c,ap=atLeast('ap'),hon=atLeast('honors');
    const m=iso(sim);
    if(s.tSoak<0.3)return 'The cores just went in. Over the next day, water will move toward whichever side has more dissolved solute.';
    let lead;
    if(osm<C_CELL-0.03)lead='<b>Beaker '+p.bal+' is hypotonic to the potato.</b> The cells hold more dissolved solute than this solution, so water moves into the core and it gains mass ('+(pc>=0?'+':'')+pc.toFixed(1)+'%).';
    else if(osm>C_CELL+0.03)lead='<b>Beaker '+p.bal+' is hypertonic to the potato.</b> The solution holds more solute than the cells, so water leaves the core and it loses mass ('+pc.toFixed(1)+'%).';
    else lead='<b>Beaker '+p.bal+' is close to isotonic.</b> Water moves in and out at about the same rate, so the mass barely changes ('+(pc>=0?'+':'')+pc.toFixed(1)+'%).';
    if(ap&&Number.isFinite(m))return lead+' Crossing point ≈ '+m.toFixed(2)+' M, so ψ ≈ −'+i+'·'+m.toFixed(2)+'·0.0831·'+(p.temp+273)+' = '+(-i*m*R_GAS*(p.temp+273.15)).toFixed(1)+' bar.';
    if(hon&&Number.isFinite(m)&&s.tSoak>4)return lead+' Your cores cross zero near '+m.toFixed(2)+' M.';
    return lead;},
  tour:[
    {title:'The setup',text:'Six beakers hold sugar (sucrose) solutions from pure water up to 1.0 M. Each gets a potato core that was weighed first.',focus:[24,100,560,300],speed:0.5},
    {title:'Pure water',text:'Potato cells hold dissolved sugars and salts. Pure water has none, so water moves into the core by osmosis. Watch the blue drops move inward.',focus:[24,100,104,300],speed:0.25},
    {title:'Strong sugar solution',text:'At 1.0 M the solution holds more solute than the cells, so water moves out. The core shrinks and loses mass.',focus:[492,100,104,300],speed:0.25},
    {title:'Weighing the cores',text:'After soaking, each core is blotted dry and weighed. Percent change = (final − initial) ÷ initial × 100. Using percent lets you compare cores that started at different masses.',focus:[590,225,200,190],speed:1},
    {title:'The isotonic point',text:{bio:'Somewhere between the beakers, a core would neither gain nor lose water. That concentration matches the inside of the potato cells.',honors:'Graph percent change against concentration. Where the line crosses zero is the isotonic point, about the same solute concentration as the cytoplasm.'},focus:[116,100,200,300],speed:2},
    {lvl:'ap',title:'Water potential',text:'At the isotonic point, ψ outside = ψ inside. For the solution ψ = ψs = −iCRT, so the potato cells’ water potential is about −(1)(0.30)(0.0831)(295) ≈ −7.4 bar.',focus:[0,0,800,60],speed:2,pause:false}
  ],
  lab:{bio:'<p><b>Question:</b> How does sugar concentration affect the mass of a potato core?</p><ol><li>Let the cores soak for 24 hours.</li><li>Put each core on the balance and record a trial for all six beakers.</li><li>Plot beaker molarity (x) against mass change (y).</li></ol><p>Which beakers gained mass, and which lost it? Explain using the word osmosis.</p>',
       honors:'<p><b>Question:</b> What sucrose concentration is isotonic to potato cells?</p><ol><li>Run a 24-hour soak with 0–1.0 M. Record all six cores.</li><li>Switch to 0.20–0.45 M and run again to zoom in.</li><li>Plot both data sets and find where the line crosses zero.</li></ol><p>State the isotonic concentration and explain why cores above and below it changed in opposite directions.</p>',
       ap:'<p><b>Question:</b> What is the water potential of potato cells?</p><ol><li>Find the isotonic sucrose concentration (two runs, zooming in).</li><li>Calculate ψ = −iCRT at that concentration and temperature.</li><li>Repeat with NaCl and compare.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why NaCl gives a lower isotonic molarity but the same cell water potential.</p>'},
  terms:[{t:'Osmosis',d:'Diffusion of water across a membrane toward the side with more dissolved solute.'},{t:'Hypotonic',d:'A solution with less solute than the cell. Water moves into the cell.'},{t:'Hypertonic',d:'A solution with more solute than the cell. Water moves out.'},{t:'Isotonic',d:'Equal solute concentration, so no net water movement.'},
    {lvl:'honors',t:'Percent change',d:'(final − initial) ÷ initial × 100. It lets you compare cores of different starting mass.'},
    {lvl:'ap',t:'Water potential (ψ)',d:'The tendency of water to move. Water flows from higher ψ to lower ψ.'},{lvl:'ap',t:'Solute potential (ψs)',d:'ψs = −iCRT, where i is the ionization constant, C molarity, R 0.0831 L·bar/mol·K and T in kelvin.'}],
  about:'<p>Each core moves toward an equilibrium percent change that depends on the difference between the cells’ solute concentration (0.30 osmol/L, sucrose-equivalent) and the solution’s (i × C). Cores gain up to about +18% in water and lose up to about −30% in strong solutions as cell walls and plasmolysis limit the change. The approach is exponential with a time constant of about 3 hours at 22 °C, shortening as temperature rises.</p><p>Each core gets a small random difference in starting mass and final change, and the balance reads to 0.001 g, so data scatter like a real lab. Real potatoes vary in their isotonic point (often 0.2–0.4 M). The model ignores sugar uptake by cells and evaporation.</p>',
  challenges:[
    {lvl:'bio',q:'A potato core soaks in distilled water for 24 hours. What happens to its mass?',choices:['It gains mass','It loses mass','It stays the same'],correct:0,baseline:{bal:1},changeText:'Soaking in distilled water',watch:'pct',
     explain:'Distilled water has no solute, so it is hypotonic to the potato cells. Water moves into the cells by osmosis and the core gains mass.'},
    {lvl:'bio',q:'Another core soaks in 1.0 M sucrose for 24 hours. What happens to its mass?',choices:['It gains mass','It loses mass','It stays the same'],correct:1,baseline:{bal:6},changeText:'Soaking in 1.0 M sucrose',watch:'pct',
     explain:'1.0 M sucrose holds much more solute than the cytoplasm, so it is hypertonic. Water leaves the cells and the core loses mass.'},
    {lvl:'honors',q:'Which sucrose concentration matches the inside of the potato cells, so the core neither gains nor loses mass?',choices:['About 0.0 M','About 0.3 M','About 0.6 M','About 1.0 M'],correct:1,baseline:{bal:2},changeText:'Soaking all six cores',watch:'iso',
     explain:'Graph percent change against concentration. The line crosses zero near 0.3 M, so that solution is isotonic to potato cells.'},
    {lvl:'honors',q:'You run the same lab at 35 °C instead of 10 °C. After 24 hours, how do the results compare?',choices:['Cores change faster, but end at about the same mass','Every core gains more mass','Nothing changes, including the speed'],correct:0,baseline:{temp:35,bal:1},changeText:'Soaking at 35 °C',watch:'pct',
     explain:'Warmer water molecules move faster, so the cores reach equilibrium sooner. The final change depends on the concentration difference, not the temperature, so the results end up about the same.'},
    {lvl:'ap',instant:true,q:'The isotonic point is 0.30 M sucrose at 22 °C (295 K). What is the water potential of the potato cells?',choices:['About −7.4 bar','About −0.74 bar','About +7.4 bar','About −2.5 bar'],correct:0,
     explain:'At the isotonic point ψcell = ψsolution = −iCRT = −(1)(0.30 mol/L)(0.0831 L·bar/mol·K)(295 K) ≈ −7.4 bar.'},
    {lvl:'ap',q:'You switch from sucrose to NaCl at the same molarities. Where does the isotonic point move?',choices:['Higher, about 0.6 M','Lower, about 0.15 M','It stays at 0.3 M'],correct:1,baseline:{solute:'nacl',bal:2},changeText:'Soaking in NaCl',watch:'iso',
     explain:'NaCl splits into Na⁺ and Cl⁻ (i = 2), so each mole gives twice as many particles. Half the molarity, about 0.15 M, gives the same solute potential as the cells.'}
  ],
  thumbSetup(sim){for(let i=0;i<300;i++)SIM.step(sim,0.04);}
};
BioLab.register(SIM);
})();
