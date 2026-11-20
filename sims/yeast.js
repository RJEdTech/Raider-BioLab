(function(){
'use strict';
const {clamp,rr,txt,PAL,axes,legend}=BioLab.h;

/* Yeast balloon lab: five sealed flasks of yeast, each with a different sugar (or none), in a water bath.
   The CO2 the yeast give off fills a balloon. Split out of the glycolysis tool on Nov 20, 2026 (Paul Stearman's request),
   so it is its own lab with its own guide sheet. The flasks match the class Lactase Demo. */
const SUG={glu:{l:'Glucose',f:1,lag:3},suc:{l:'Sucrose',f:0.85,lag:6},lac:{l:'Lactose',f:0.03,lag:6},lacz:{l:'Lactose + lactase',f:0.85,lag:9,S:2.5},none:{l:'Water only',f:0,lag:3}};
/* lacz: lactase splits 5 g lactose into glucose + galactose. Baker's yeast ferment the glucose half at once;
   galactose needs GAL genes switched on (hours), so in a one-hour demo only ~2.5 g is usable. */
const FLASK=['glu','suc','lac','lacz','none'],BCOL={glu:'#f2c12e',suc:'#2f8fd8',lac:'#ec6fa8',lacz:'#8a4fc8',none:'#26262b'},BTXT={glu:'#3a2a00',suc:'#fff',lac:'#3a0d22',lacz:'#fff',none:'#fff'};
const yT=T=>Math.pow(2,(T-30)/10)/(1+Math.exp((T-45)/2.5));

function newYeast(){const y={};for(const k in SUG)y[k]={V:0,S:SUG[k].S||5,rate:0};return y;}

const SIM={
  id:'yeast',hash:'yeast',apUnit:3,order:5,kind:'Simulation',tab:'Yeast balloon lab',
  card:'Five flasks of yeast, five balloons. Find out which sugars yeast can use, and what warming them does.',
  title:'Yeast balloon lab: which sugars can yeast use?',
  prereq:['glycolysis'],
  lede:{bio:'Yeast break down sugar without oxygen and give off a gas, CO₂. Each flask has a balloon on top, so the size of the balloon shows how much sugar the yeast have used.',
        honors:'Yeast ferment sugar to ethanol and CO₂. Compare five flasks (glucose, sucrose, lactose, lactose with the enzyme lactase, and water only) and find how temperature changes the rate.',
        ap:'Use CO₂ volume as a measure of fermentation rate. Explain each flask from the enzymes yeast do and do not make, and explain the shape of the rate–temperature curve.'},
  scale:'A lab bench: five flasks in a water bath, each with 50 mL of yeast solution and 5 g of sugar (the water flask has none). One second on screen is one minute in the lab.',
  timeScale:1,dtMax:0.02,sampleDt:0.1,window:40,unit:'min',chChange:3,chReveal:10,
  clock(sim){return 'Yeast lab: '+sim.t.toFixed(1)+' min';},
  controls:[
    {id:'temp',label:'Water bath temperature',type:'range',min:5,max:55,step:1,def:30,unit:' °C',lvl:'bio',help:'Warmer speeds the yeast up, until it gets too hot for their enzymes (about 45 °C).'}
  ],
  init(){return {y:newYeast()};},
  step(sim,dt){const s=sim.st,p=sim.p;
    for(const k in SUG){const f=s.y[k],sg=SUG[k];const r=12*yT(p.temp)*sg.f*f.S/(f.S+0.5)*(1-Math.exp(-sim.t/sg.lag));f.rate=Math.max(0,r);f.V+=f.rate*dt;f.S=Math.max(0,f.S-f.rate*dt*0.004);}},
  metrics:[
    {id:'b_glu',label:'Balloon 1: glucose',unit:'mL CO₂',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.y.glu.V},
    {id:'b_suc',label:'Balloon 2: sucrose',unit:'mL CO₂',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.y.suc.V},
    {id:'b_lac',label:'Balloon 3: lactose',unit:'mL CO₂',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.y.lac.V},
    {id:'b_lacz',label:'Balloon 4: lactose + lactase',unit:'mL CO₂',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.y.lacz.V},
    {id:'b_none',label:'Balloon 5: water only',unit:'mL CO₂',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.y.none.V}
  ],
  graphs:[{id:'balloons',label:'Yeast balloons (CO₂ volume)',custom:true}],
  defaultGraph:'balloons',
  plot(sim,ctx,box){const keys=['b_glu','b_suc','b_lac','b_lacz','b_none'],names=['Glucose','Sucrose','Lactose','Lactose + lactase','Water only'],cols=['#c99a00','#2f8fd8','#e0559a','#8a4fc8','#26262b'];
    const h=sim.hist,xmax=Math.max(40,sim.t),xmin=xmax-40;let ymax=50;h.forEach(r=>keys.forEach(k=>{if(r.v[k]>ymax)ymax=r.v[k];}));
    const ax=axes(ctx,{...box,T:34,H:box.H-22},{xmin,xmax,ymin:0,ymax:ymax*1.1,xl:'Time (min)',yl:'CO₂ in balloon (mL)'});
    keys.forEach((k,i)=>{const pts=h.filter(r=>r.t>=xmin);if(pts.length<2)return;ctx.strokeStyle=cols[i];ctx.lineWidth=2.5;ctx.beginPath();pts.forEach((r,j)=>{j?ctx.lineTo(ax.X(r.t),ax.Y(r.v[k])):ctx.moveTo(ax.X(r.t),ax.Y(r.v[k]));});ctx.stroke();});
    legend(ctx,box.L,14,names.map((n,i)=>({label:n,color:cols[i]})));},
  initVis(sim){sim.vis.bub=[[],[],[],[],[]];},
  draw(sim,ctx,vdt,k,t){if(!sim.vis.bub)SIM.initVis(sim);drawBalloons(sim,ctx,vdt,k,t);},
  narrate(sim){const y=sim.st.y,p=sim.p;
    if(p.temp>=48)return '<b>Too hot.</b> Above about 45 °C the yeast’s enzymes lose their shape, so fermentation nearly stops. Glucose: '+y.glu.V.toFixed(0)+' mL so far.';
    return '<b>Yeast ferment sugar and release CO₂</b>, which inflates the balloons. Glucose: '+y.glu.V.toFixed(0)+' mL, sucrose: '+y.suc.V.toFixed(0)+' mL, lactose: '+y.lac.V.toFixed(0)+' mL, lactose + lactase: '+y.lacz.V.toFixed(0)+' mL, water only: '+y.none.V.toFixed(0)+' mL at '+p.temp+' °C.';},
  tour:[
    {title:'Five flasks, one question',text:'Each flask holds the same yeast. Four get a different sugar, and one gets only water. A balloon on each flask catches any gas the yeast give off.',focus:[0,40,800,410],speed:2,setup(sim){BioLab.setValues(sim,{temp:30});}},
    {title:'Glucose and sucrose fill',text:{bio:'Bubbles rise and the first two balloons swell. Yeast can use glucose directly, and they can split table sugar (sucrose) to get glucose.',honors:'Yeast ferment glucose directly. They also make an enzyme (invertase) that splits sucrose into glucose and fructose, so the sucrose balloon is close behind.'},focus:[14,60,300,400],speed:2},
    {title:'Lactose stays flat, until lactase is added',text:'Lactose is milk sugar. Baker’s yeast make no lactase, the enzyme that splits it, so flask 3 barely changes. Flask 4 has the same lactose plus lactase, and its balloon fills.',focus:[326,60,300,400],speed:2},
    {title:'Water only: the control',text:'The last flask has yeast and water but no sugar. Its balloon stays flat, which shows the gas comes from the sugar and not from the yeast or the water.',focus:[638,60,160,400],speed:2},
    {title:'Now change the temperature',text:'Skip to the full lab, press Reset, and try 15, 25, 35 and 45 °C. Record the balloon volumes at 20 minutes each time.',focus:[0,40,800,410],speed:2}
  ],
  lab:{bio:'<p><b>Question:</b> Which sugars can yeast use?</p><ol><li>Run the lab at 30 °C. At 20 minutes, press Pause and record the five balloon volumes as a trial.</li><li>Rank the flasks from most CO₂ to least.</li></ol><p>Explain what the water-only flask tells you, and why the lactose balloon stays flat but the lactose + lactase balloon fills.</p>',
       honors:'<p><b>Question:</b> Which sugars can yeast ferment, and how does temperature change the rate?</p><ol><li>Record the five balloon volumes at 20 minutes.</li><li>Repeat at 15, 25, 35 and 45 °C (press Reset before each run).</li><li>Plot temperature (x) against the glucose balloon volume (y).</li></ol><p>Explain why the lactose balloon stays flat but the lactose + lactase balloon fills, and why the lactase balloon still ends up behind glucose.</p>',
       ap:'<p><b>Question:</b> What limits the rate of fermentation?</p><ol><li>Collect glucose balloon volume at 20 minutes for at least five temperatures from 10 to 55 °C.</li><li>Graph rate against temperature and mark the optimum.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain both sides of the curve, and explain flasks 3 and 4 in terms of the enzymes yeast do and do not make.</p>'},
  terms:[{t:'Fermentation',d:'Breaking down sugar for energy without oxygen. In yeast it makes ethanol and CO₂.'},{t:'Yeast',d:'A single-celled fungus. Baker’s yeast is the kind used to make bread rise.'},{t:'Control',d:'The flask with no sugar. It shows what happens when the thing you are testing is left out.'},
    {t:'Lactase',d:'The enzyme that splits lactose (milk sugar) into glucose and galactose. Baker’s yeast do not make it.'},{lvl:'honors',t:'Substrate',d:'The molecule an enzyme works on. Here, each sugar is a possible substrate.'},{lvl:'honors',t:'Optimum temperature',d:'The temperature at which the yeast’s enzymes work fastest.'}],
  about:'<p>Each flask has 50 mL of yeast solution and 5 g of sugar, like the class Lactase Demo. The rate of CO₂ follows how much usable sugar is left, doubles for every 10 °C of warming, and falls off above about 45 °C as the yeast’s enzymes denature. Sucrose is a little slower than glucose because it has to be split first. Plain lactose gives almost nothing. With lactase added, the yeast ferment the glucose half right away; they need hours to switch on the genes for galactose, so in a one-hour lab only about half the sugar is used. Real balloons also stretch unevenly and leak a little. One second on screen stands for one minute in the lab.</p>',
  challenges:[
    {lvl:'bio',q:'This flask holds yeast and water but no sugar. What happens to its balloon?',choices:['It inflates like the others','It stays almost flat','It inflates the most'],correct:1,reveal:22,changeText:'Yeast flasks fermenting',watch:'balloons',
     explain:'Fermentation needs a sugar to break down. With no sugar, the yeast make almost no CO₂, so the balloon stays flat. This flask is the control.'},
    {lvl:'bio',q:'Baker’s yeast is given lactose (milk sugar). Will it inflate the balloon like glucose does?',choices:['Yes, about the same','No, it barely inflates','It inflates faster than glucose'],correct:1,reveal:22,changeText:'Yeast flasks fermenting',watch:'balloons',
     explain:'Baker’s yeast don’t make lactase, the enzyme that splits lactose into glucose and galactose. Without it they can’t ferment lactose, so almost no CO₂ is made.'},
    {lvl:'bio',q:'Flask 4 has the same lactose, plus the enzyme lactase. What happens to its balloon?',choices:['It stays flat, like plain lactose','It fills, close to the sucrose balloon','It fills more than glucose'],correct:1,reveal:22,changeText:'Yeast flasks fermenting',watch:'balloons',
     explain:'Lactase splits each lactose into glucose and galactose. The yeast ferment that glucose right away, so the balloon fills. It stays a little behind glucose because only half of each lactose is glucose; yeast need hours to switch on the genes for galactose.'},
    {lvl:'bio',q:'You warm the yeast flasks from 20 °C to 37 °C. What happens to the glucose balloon?',choices:['It inflates faster','It inflates slower','No change'],correct:0,baseline:{temp:20},change:{temp:37},at:2,reveal:14,changeText:'Warmed to 37 °C',watch:'balloons',
     explain:'Fermentation runs on enzymes. Warming them toward their optimum speeds up the reactions, so CO₂ builds up faster. Too hot (above about 45 °C) and the enzymes denature.'}
  ]
};
function drawBalloons(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis;
  ctx.fillStyle=PAL['card'];ctx.fillRect(0,0,800,450);
  ctx.fillStyle=PAL['cv-water'];rr(ctx,20,250,760,150,14);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;rr(ctx,20,250,760,150,14);ctx.stroke();
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,400,800,50);
  txt(ctx,'Yeast lab: '+sim.t.toFixed(1)+' min',16,28,{s:15*k,w:700});txt(ctx,k>1.15?p.temp+' °C · 50 mL yeast + 5 g sugar each':'Water bath at '+p.temp+' °C · each flask: 50 mL yeast solution + 5 g of sugar (water flask: no sugar)',16,48,{s:12.5*k,c:PAL['cv-soft']});
  FLASK.forEach((key,i)=>{const f=s.y[key],cx=88+i*156,bot=390,top=230;
    // flask
    ctx.fillStyle='rgba(214,170,90,.55)';ctx.beginPath();ctx.moveTo(cx-20,top);ctx.lineTo(cx-20,top+60);ctx.lineTo(cx-62,bot);ctx.lineTo(cx+62,bot);ctx.lineTo(cx+20,top+60);ctx.lineTo(cx+20,top);ctx.closePath();
    ctx.save();ctx.clip();ctx.fillRect(cx-70,top+90,140,bot-top-90);ctx.restore();
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx-20,top);ctx.lineTo(cx-20,top+60);ctx.lineTo(cx-62,bot);ctx.lineTo(cx+62,bot);ctx.lineTo(cx+20,top+60);ctx.lineTo(cx+20,top);ctx.stroke();
    // bubbles at the model's CO2 rate
    v.bub[i]=v.bub[i]||[];if(Math.random()<f.rate*vdt*0.6)v.bub[i].push({x:cx+(Math.random()-.5)*80,y:bot-6});
    v.bub[i].forEach(b=>{b.y-=40*vdt;ctx.fillStyle=PAL['cv-bubble'];ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1;ctx.beginPath();ctx.arc(b.x,b.y,2.5,0,6.29);ctx.fill();ctx.stroke();});
    v.bub[i]=v.bub[i].filter(b=>b.y>top+95);
    // balloon
    const r=12+4.4*Math.cbrt(f.V);const by=top-r+6;
    ctx.fillStyle=BCOL[key];ctx.beginPath();ctx.ellipse(cx,by,r*0.9,r,0,0,6.29);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.ellipse(cx-r*0.35,by-r*0.35,r*0.18,r*0.28,-0.5,0,6.29);ctx.fill();
    if(r>=24)txt(ctx,f.V.toFixed(0)+' mL',cx,by+5,{s:13*k,w:700,c:BTXT[key],a:'center'});else txt(ctx,f.V.toFixed(0)+' mL',cx,by-r-8,{s:13*k,w:700,a:'center'});
    if(k>1.15){const L={lacz:['Lactose +','lactase'],none:['Water']}[key]||[SUG[key].l];L.forEach((l,j)=>txt(ctx,l,cx,bot+20+j*17*k,{s:12.5*k,w:700,a:'center'}));}
    else{txt(ctx,'Flask '+(i+1),cx,bot+20,{s:11.5*k,w:600,c:PAL['cv-soft'],a:'center'});txt(ctx,SUG[key].l,cx,bot+38,{s:13*k,w:700,a:'center'});}});
}
BioLab.register(SIM);
})();
