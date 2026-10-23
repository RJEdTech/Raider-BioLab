(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,RM,axes,legend,serColor,fmtNum}=BioLab.h;

/* Salinization LD50 lab. Six petri dishes of seeds on filter paper, each wetted with a different salt
   concentration (% w/v = grams of salt per 100 mL). Each seed has its own sensitivity, so results vary.
   Probability a seed germinates at dose d:  P(d) = Gmax / (1 + (d / LD50)^h),  h = 3 (Hill slope).
   Germination time is spread over roughly 12–60 h. Root growth is cut in half at ED50 = 0.45 × LD50. */
const DOSES=[0,0.25,0.5,1,2,4];
const TOX={radish:{nacl:1.2,mgcl:0.8,name:'Radish',seed:'#7a4a2a',seedD:'#4f2f19'},
           lettuce:{nacl:0.6,mgcl:0.4,name:'Lettuce',seed:'#b9a46e',seedD:'#7d6c43'}};
const SALT={nacl:'NaCl (table salt)',mgcl:'MgCl₂ (road deicer)'};
const HILL=3,GMAX=0.95,LMAX=30,END=96;
const ldTrue=p=>TOX[p.organism][p.salt];
const pGerm=(p,d)=>d<=0?1:1/(1+Math.pow(d/ldTrue(p),HILL));
const rootF=(p,d)=>d<=0?1:1/(1+Math.pow(d/(0.45*ldTrue(p)),2));
const DISH=[[95,128],[270,128],[445,128],[95,318],[270,318],[445,318]],DR=66;
const doseLabel=d=>d===0?'0% (control)':d+'% salt';

function makeSeeds(n){const R=Math.random,dishes=[];
  for(let i=0;i<6;i++){const arr=[];for(let k=0;k<n;k++){
    // spread seeds evenly over the dish (sunflower pattern) with a little jitter
    const a=k*2.39996+R()*0.4,r=Math.sqrt((k+0.5)/n)*(DR-14);
    arr.push({x:Math.cos(a)*r,y:Math.sin(a)*r,ang:R()*6.283,u:R(),tg:12+Math.exp(Math.log(14)+0.45*BioLab.h.randn(R)),decided:false,g:false,len:0,curl:(R()-.5)*1.2});}
    dishes.push(arr);}
  return dishes;}
function frac(dish){if(!dish.length)return 0;let g=0;dish.forEach(s=>{if(s.g)g++;});return g/dish.length;}
function meanRoot(dish){let n=0,L=0;dish.forEach(s=>{if(s.g){n++;L+=s.len;}});return n?L/n:0;}
/* Read the 50% crossing off the measured points, interpolating on log(dose) like reading a log-scale graph. */
function crossing(ys){const y0=ys[0];if(!(y0>0.15))return NaN;const r=ys.map(y=>y/y0);
  let prevD=null,prevR=1;for(let i=1;i<6;i++){const d=DOSES[i];if(r[i]<=0.5){if(prevD===null)return NaN;
      const t=(prevR-0.5)/(prevR-r[i]);return Math.pow(10,Math.log10(prevD)+t*(Math.log10(d)-Math.log10(prevD)));}
    prevD=d;prevR=r[i];}
  return NaN;}
function est(sim){const s=sim.st;if(sim.t<20)return NaN;return crossing(s.dishes.map(frac));}
function estED(sim){const s=sim.st;if(sim.t<40)return NaN;return crossing(s.dishes.map(meanRoot));}
function noael(sim){const s=sim.st;if(sim.t<24)return NaN;const f=s.dishes.map(frac);if(!(f[0]>0.15))return NaN;let best=0;for(let i=1;i<6;i++){if(f[i]>=0.9*f[0])best=DOSES[i];else break;}return best;}

const SIM={
  id:'ld50',hash:'ld50',apUnit:14,order:4,kind:'Virtual lab',tab:'Dose–response and LD50 lab',
  card:'Soak seeds in salt water, count how many sprout, and find the dose that stops half of them.',
  title:'Dose–response and LD50: the salinization lab',
  lede:{bio:'Salt in soil keeps seeds from sprouting. Set up six dishes from fresh water to very salty, wait 72 hours, and count how many seeds sprout in each.',
        honors:'Measure a dose–response curve, find the LD50 and the no-effect level, then compare the toxicity of table salt and road deicer on two kinds of seeds.',
        ap:'A full bioassay: plot response against log dose, read the LD50 and the ED50 for root growth, calculate the safety margin, and connect acute toxicity to soil salinization.'},
  scale:'Real lab scale: 9 cm petri dishes on filter paper. A radish seed is about 3 mm long; a 72-hour root is about 3 cm. 1% salt = 1 g per 100 mL, about 2 teaspoons per liter.',
  timeScale:4,dtMax:0.25,prewarm:0,sampleDt:1,window:96,unit:'h',timeLabel:'Hour',clock:sim=>'Hour '+Math.min(END,Math.floor(sim.t))+(sim.t>=END?' (done)':''),
  chChange:0,chReveal:72,
  controls:[
    {id:'organism',label:'Seeds',type:'seg',def:'radish',lvl:'bio',options:[{v:'radish',l:'Radish'},{v:'lettuce',l:'Lettuce',lvl:'honors'}],help:'Lettuce is more sensitive to salt.'},
    {id:'n',label:'Seeds per dish',type:'seg',def:'25',lvl:'bio',options:[{v:'10',l:'10'},{v:'25',l:'25'},{v:'50',l:'50'}],help:'More seeds give a more reliable result.'},
    {id:'salt',label:'Salt',type:'seg',def:'nacl',lvl:'honors',options:[{v:'nacl',l:'Table salt'},{v:'mgcl',l:'Road deicer'}],help:'Colorado roads are treated with magnesium chloride (MgCl₂) deicer.'}
  ],
  actions:[{id:'redo',label:'Set up fresh dishes',lvl:'bio',primary:true,run(sim){BioLab.reset(sim);}}],
  init(sim){return {n:+sim.p.n,dishes:makeSeeds(+sim.p.n)};},
  step(sim,dt){const p=sim.p,s=sim.st,t=sim.t+dt;
    if(s.n!==+p.n){s.n=+p.n;s.dishes=makeSeeds(s.n);}
    if(sim.t>=END)return;
    s.dishes.forEach((dish,i)=>{const d=DOSES[i],pg=GMAX*pGerm(p,d),rf=rootF(p,d);
      dish.forEach(sd=>{if(!sd.decided&&t>=sd.tg){sd.decided=true;sd.g=sd.u<pg;}
        if(sd.g)sd.len=LMAX*rf*(1-Math.exp(-Math.max(0,t-sd.tg)/22));});});},
  metrics:DOSES.map((d,i)=>({id:'g'+i,label:doseLabel(d),unit:'% sprouted',lvl:'bio',min:0,max:100,d:0,get:s=>100*frac(s.st.dishes[i])})).concat([
    {id:'ld',label:'LD50 estimate',unit:'% salt',lvl:'bio',min:0,max:4,d:2,get:s=>est(s)},
    {id:'noael',label:'No-effect level (NOAEL)',unit:'% salt',lvl:'honors',min:0,max:4,d:2,get:s=>noael(s)},
    {id:'ed',label:'ED50 for root growth',unit:'% salt',lvl:'ap',min:0,max:4,d:2,get:s=>estED(s)},
    {id:'margin',label:'Safety margin (LD50 ÷ ED50)',unit:'',lvl:'ap',min:0,max:5,d:1,get:s=>{const a=est(s),b=estED(s);return a>0&&b>0?a/b:NaN;}}
  ]),
  graphs:[{id:'dr',label:'Dose–response curve',lvl:'bio',custom:true},{id:'time',label:'Sprouting over time',lvl:'bio',custom:true}],
  defaultGraph:'dr',
  plot(sim,ctx,box,id){const s=sim.st,ap=atLeast('ap');
    if(id==='time'){const xmax=Math.max(72,Math.min(END,Math.ceil(sim.t/12)*12));const ax=axes(ctx,box,{xmin:0,xmax,ymin:0,ymax:100,xl:'Time (hours)',yl:'% of seeds sprouted'});
      DOSES.forEach((d,i)=>{ctx.strokeStyle=serColor(i);ctx.lineWidth=2.5;ctx.beginPath();let first=true;sim.hist.forEach(r=>{const v=r.v['g'+i];if(!Number.isFinite(v))return;const x=ax.X(r.t),y=ax.Y(v);first?ctx.moveTo(x,y):ctx.lineTo(x,y);first=false;});ctx.stroke();});
      legend(ctx,box.L+8,box.T+10,DOSES.map((d,i)=>({label:d+'%',color:serColor(i)})));return;}
    const fr=s.dishes.map(frac),ys=fr.map(f=>100*f);
    let X,ax;
    if(ap){ax=axes(ctx,box,{xmin:Math.log10(0.15),xmax:Math.log10(6),ymin:0,ymax:105,xticks:false,xl:'Salt concentration (% w/v, log scale)',yl:'% of seeds sprouted'});
      X=d=>ax.X(Math.log10(d));[0.25,0.5,1,2,4].forEach(d=>{txt(ctx,String(d),X(d),box.T+box.H+16,{s:13,c:PAL['g-axis'],a:'center'});ctx.strokeStyle=PAL['g-grid'];ctx.beginPath();ctx.moveTo(X(d),box.T);ctx.lineTo(X(d),box.T+box.H);ctx.stroke();});}
    else{ax=axes(ctx,box,{xmin:0,xmax:4.2,ymin:0,ymax:105,xl:'Salt concentration (% w/v)',yl:'% of seeds sprouted'});X=d=>ax.X(d);}
    const Y=ax.Y;
    if(fr[0]>0){const half=ys[0]/2;ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(box.L,Y(half));ctx.lineTo(box.L+box.W,Y(half));ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'half of control',box.L+box.W-4,Y(half)-6,{s:12,c:PAL['muted'],a:'right'});
      if(ap){ctx.strokeStyle=PAL['muted'];ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(box.L,Y(ys[0]));ctx.lineTo(box.L+box.W,Y(ys[0]));ctx.stroke();ctx.setLineDash([]);txt(ctx,'control',box.L+6,Y(ys[0])-6,{s:12,c:PAL['muted']});}}
    const pts=DOSES.map((d,i)=>[d,ys[i]]).filter(q=>!ap||q[0]>0);
    ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();pts.forEach((q,i)=>{const x=X(q[0]),y=Y(q[1]);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
    pts.forEach(q=>{ctx.fillStyle=PAL['g-line'];ctx.beginPath();ctx.arc(X(q[0]),Y(q[1]),5,0,6.29);ctx.fill();ctx.strokeStyle=PAL['card'];ctx.lineWidth=1.5;ctx.stroke();});
    const ld=est(sim);if(ld>0&&ld<=4.2){const x=X(ld);ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(x,box.T+box.H);ctx.lineTo(x,Y(ys[0]/2));ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'LD50 ≈ '+ld.toFixed(2)+'%',x+6,box.T+box.H-8,{s:13,w:700,c:PAL['s2']});}
    if(sim.t<20)txt(ctx,'Seeds are still soaking up water. Check back after hour 24.',box.L+box.W/2,box.T+20,{s:13,c:PAL['muted'],a:'center'});},
  narrate(sim){const s=sim.st,p=sim.p,f=s.dishes.map(frac),t=sim.t,ld=est(sim),org=TOX[p.organism].name.toLowerCase();
    if(t<12)return '<b>Hour '+Math.floor(t)+': the seeds are soaking up water (imbibition).</b> Nothing sprouts before about 12 hours. In the salty dishes, salt pulls water back out by osmosis.';
    if(t<30)return 'Roots are starting to poke out. So far <b>'+Math.round(100*f[0])+'%</b> have sprouted in the control dish and <b>'+Math.round(100*f[5])+'%</b> in the 4% dish.';
    if(t<72)return 'The control has <b>'+Math.round(100*f[0])+'%</b> sprouted. Each step up in salt cuts sprouting further, because the seeds can’t pull in enough water to germinate. Keep going to hour 72.';
    if(ld>0)return '<b>Hour '+Math.min(END,Math.floor(t))+':</b> about <b>'+ld.toFixed(2)+'% '+(p.salt==='mgcl'?'MgCl₂':'salt')+'</b> cuts '+org+' sprouting to half of the control. That is your LD50 estimate'+(atLeast('ap')?'. Roots are stunted at even lower doses (ED50).':'.');
    return 'The data don’t cross the halfway line cleanly. With small samples, chance can scramble the pattern. Try more seeds per dish.';},
  tour:[
    {title:'The setup',text:'Six petri dishes, each lined with filter paper and wetted with a different salt solution: 0% (the control) up to 4%. Every dish gets the same number of seeds.',focus:[8,30,530,410],speed:0.25},
    {title:'The control dish',text:'The 0% dish gets plain water. It shows what normal sprouting looks like, so every other dish can be compared with it.',focus:[DISH[0][0]-82,DISH[0][1]-98,164,190],speed:1},
    {title:'Why salt matters',text:'A seed must soak up water before it can sprout. Salt outside the seed makes the water potential more negative, so water moves <b>out</b> by osmosis instead of in.',focus:[DISH[5][0]-82,DISH[5][1]-98,164,190],speed:1},
    {title:'Let it run',text:'Watch the roots appear over 72 hours. Count the sprouted seeds under each dish.',focus:[8,30,530,410],speed:4},
    {title:'Read the dose–response curve',text:'The graph on the right plots % sprouted against salt concentration. The <b>LD50</b> is where the curve crosses half of the control value.',focus:[548,30,246,300],speed:2},
    {lvl:'honors',title:'Compare toxicity',text:'Now the same test with road deicer (MgCl₂). A <b>lower</b> LD50 means the chemical is <b>more toxic</b>: it takes less to do the same harm.',focus:[548,30,246,300],speed:4,setup(sim){BioLab.reset(sim);BioLab.setValues(sim,{salt:'mgcl'});}},
    {lvl:'ap',title:'Effect vs. lethal dose',text:'Root growth (ED50) is stunted at lower doses than germination (LD50). LD50 ÷ ED50 is the safety margin: how far apart harm and death are.',focus:[DISH[3][0]-82,DISH[3][1]-98,340,190],speed:4,setup(sim){BioLab.setValues(sim,{salt:'nacl'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{salt:'nacl'});},
  challenges:[
    {lvl:'bio',q:'As the salt concentration goes up from dish to dish, what happens to the percentage of seeds that sprout?',
     choices:['It goes up, because salt is a nutrient','It goes down','It stays about the same'],correct:1,baseline:{n:'50'},at:0,changeText:'Dishes set up with 50 seeds each',watch:'dr',
     explain:{bio:'Salt pulls water out of the seeds by osmosis, so fewer of them can soak up enough water to sprout. More salt, fewer sprouts: that is a dose–response relationship.',honors:'Salt lowers the water potential of the solution, so seeds can’t imbibe enough water to start germinating. Response falls as dose rises.'}},
    {lvl:'bio',q:'Radish seeds go through the full 72 hours. Where will the LD50 (half as many sprouts as the control) fall?',
     choices:['Below 0.25% salt','Between the 1% and 2% dishes','Above 4% salt'],correct:1,baseline:{n:'50'},at:0,changeText:'Running the full 72 hours',watch:'dr',
     explain:'The curve crosses half of the control value between the 1% and 2% dishes, at about 1.2% salt for radish. That concentration is the LD50.'},
    {lvl:'honors',q:'You repeat the lab with lettuce seeds, which are more sensitive to salt. Compared with radish (LD50 about 1.2%), the lettuce LD50 will be…',
     choices:['Lower','Higher','The same'],correct:0,baseline:{n:'50',organism:'radish'},change:{organism:'lettuce'},at:0,changeText:'Switched to lettuce seeds',watch:'dr',
     explain:'A more sensitive organism needs less of the toxin to reach the same effect, so its LD50 is lower, about 0.6% for lettuce. LD50 compares toxicity for a given organism.'},
    {lvl:'honors',q:'Switch from table salt to MgCl₂ road deicer. Its LD50 comes out lower than table salt’s. That means the deicer is…',
     choices:['More toxic to the seeds','Less toxic to the seeds','Equally toxic'],correct:0,baseline:{n:'50',salt:'nacl'},change:{salt:'mgcl'},at:0,changeText:'Switched to MgCl₂ road deicer',watch:'dr',
     explain:'Lower LD50 = more toxic: a smaller dose causes the same harm. Deicer that splashes onto roadside soil can keep seeds and plants from growing.'},
    {lvl:'honors',instant:true,q:'Two groups each run the lab with only 10 seeds per dish. Their LD50 estimates disagree. The best fix is to…',
     choices:['Use more seeds per dish and repeat the trials','Use only the control dish','Average in a guess'],correct:0,
     explain:'Each seed responds a little differently. With 10 seeds, one or two lucky or unlucky seeds swing a dish by 10–20%. More seeds and repeated trials shrink that random error.'},
    {lvl:'ap',q:'Root growth is harmed at lower doses than germination. The safety margin, LD50 ÷ ED50, will be…',
     choices:['Greater than 1 (about 2)','Exactly 1','Less than 1'],correct:0,baseline:{n:'50'},at:0,changeText:'Measuring roots and sprouting',watch:'dr',
     explain:'ED50 (the dose that halves root length) is lower than LD50, so LD50 ÷ ED50 is above 1, about 2.2 here. Sublethal effects show up well before deaths do, which is why regulators care about more than LD50.'},
    {lvl:'ap',instant:true,q:'A pesticide has a high LD50 but causes harm after years of low-level exposure in drinking water. That harm is called…',
     choices:['Chronic toxicity','Acute toxicity','The NOAEL'],correct:0,
     explain:'LD50 measures acute toxicity: a single dose over a short time. Chronic effects come from long, low exposures, and LD50 alone can miss them.'}
  ],
  lab:{bio:'<p><b>Question:</b> How does salt concentration affect how many radish seeds sprout?</p><ol><li>Choose 25 seeds per dish and run to hour 72.</li><li>Press Record trial. Then press Set up fresh dishes and repeat twice more.</li><li>Average the three trials for each dish and graph salt concentration (x) against % sprouted (y).</li></ol><p>Find the concentration where half as many seeds sprout as in the control. That is your LD50.</p>',
       honors:'<p><b>Question:</b> Which is more toxic to seeds, table salt or road deicer, and which seeds are more sensitive?</p><ol><li>Run four experiments to hour 72 with 50 seeds per dish: radish + table salt, radish + deicer, lettuce + table salt, lettuce + deicer.</li><li>Record the LD50 and NOAEL for each.</li></ol><p>Rank the four from most to least toxic. Explain what this means for plants along Colorado roads in winter.</p>',
       ap:'<p><b>Question:</b> How far apart are the harmful dose and the lethal dose?</p><ol><li>With 50 seeds per dish, run three trials to hour 72 and record LD50 and ED50 each time.</li><li>Calculate the mean safety margin (LD50 ÷ ED50) and the range of your LD50 estimates.</li><li>Switch the Graph to the dose–response curve and describe its shape on a log scale.</li></ol><p><b>Claim–evidence–reasoning:</b> Irrigated farmland slowly accumulates salt. Use your data to explain why yields fall before crops die.</p>'},
  terms:[{t:'Dose',d:'The amount of a substance an organism is exposed to.'},{t:'Response',d:'The measured effect, here the % of seeds that sprout.'},{t:'LD50',d:'The dose that kills, or here prevents sprouting in, 50% of the test population compared with the control.'},{t:'Control',d:'The dish with no salt, used for comparison.'},
    {lvl:'honors',t:'NOAEL / threshold',d:'The highest dose with no observable effect.'},{lvl:'honors',t:'Toxicity',d:'How harmful a substance is. A lower LD50 means more toxic.'},{lvl:'honors',t:'Salinization',d:'Salt building up in soil, often from irrigation or road deicers.'},
    {lvl:'ap',t:'ED50',d:'The dose that causes a non-lethal effect, here halving root growth, in 50% of the population.'},{lvl:'ap',t:'Acute vs. chronic toxicity',d:'Harm from one short, high exposure vs. harm from long, low exposure.'},{lvl:'ap',t:'Dose–response curve',d:'A graph of response against dose, usually on a log dose scale, where it forms an S shape.'}],
  about:'<p>Each seed gets its own random sensitivity and sprouting time (about 12–60 hours). A seed sprouts if its sensitivity falls under P(dose) = 0.95 ÷ (1 + (dose ÷ LD50)³). Root growth follows a similar curve with ED50 = 0.45 × LD50.</p><p>The built-in LD50 values are illustrative, not measured: radish 1.2% NaCl and 0.8% MgCl₂, lettuce 0.6% and 0.4%. Real values depend on seed variety, temperature and how germination is scored. The LD50 estimate is read from your data the way you would read a graph, interpolating between the two dishes that bracket half of the control on a log scale.</p><p>Seeds can’t drown or mold here, and the dishes never dry out. Germination is used in place of death, as in the classroom lab.</p>',
  thumbSetup(sim){for(let i=0;i<300;i++){SIM.step(sim,0.25);sim.t+=0.25;}},
  thumbFrames:0,
  initVis(sim){sim.vis.salt=[];const r=rng(42);for(let i=0;i<6;i++){const a=[];for(let k=0;k<Math.round(DOSES[i]*14);k++){const ang=r()*6.283,rad=Math.sqrt(r())*(DR-8);a.push([Math.cos(ang)*rad,Math.sin(ang)*rad]);}sim.vis.salt.push(a);}},
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,org=TOX[p.organism],ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bg'];ctx.globalAlpha=.55;ctx.fillRect(0,0,800,450);ctx.globalAlpha=1;
    s.dishes.forEach((dish,i)=>{const [cx,cy]=DISH[i],d=DOSES[i];
      // dish shadow, glass rim, filter paper
      ctx.fillStyle='rgba(0,0,0,.12)';ctx.beginPath();ctx.ellipse(cx+3,cy+5,DR+4,DR+4,0,0,6.29);ctx.fill();
      ctx.fillStyle='#e9eef1';ctx.beginPath();ctx.arc(cx,cy,DR+4,0,6.29);ctx.fill();
      ctx.fillStyle='#f4efe2';ctx.beginPath();ctx.arc(cx,cy,DR-2,0,6.29);ctx.fill();
      if(d>0){ctx.fillStyle='rgba(120,160,200,'+clamp(0.05+d*0.03,0,0.2)+')';ctx.beginPath();ctx.arc(cx,cy,DR-2,0,6.29);ctx.fill();}
      ctx.fillStyle='rgba(255,255,255,.95)';(sim.vis.salt&&sim.vis.salt[i]||[]).forEach(q=>{ctx.fillRect(cx+q[0]-1,cy+q[1]-1,2,2);});
      ctx.strokeStyle='#9fb4c0';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(cx,cy,DR+4,0,6.29);ctx.stroke();
      // seeds and roots
      const scale=dish.length>30?0.75:1;
      dish.forEach(sd=>{const x=cx+sd.x,y=cy+sd.y;
        if(sd.g&&sd.len>0.3){const L=Math.min(36,sd.len*1.25)*scale;ctx.strokeStyle='#fffdf6';ctx.lineWidth=2.4*scale;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);
          const ex=x+Math.cos(sd.ang)*L,ey=y+Math.sin(sd.ang)*L,mx=x+Math.cos(sd.ang+sd.curl)*L*0.55,my=y+Math.sin(sd.ang+sd.curl)*L*0.55;ctx.quadraticCurveTo(mx,my,ex,ey);ctx.stroke();
          ctx.strokeStyle='#cfc6ad';ctx.lineWidth=0.8;ctx.stroke();
          if(sd.len>14){ctx.fillStyle='#5aa648';const a2=sd.ang+Math.PI;ctx.beginPath();ctx.ellipse(x+Math.cos(a2)*4*scale,y+Math.sin(a2)*4*scale,3.4*scale,2.2*scale,a2,0,6.29);ctx.fill();}}
        ctx.fillStyle=sd.g?org.seed:org.seedD;ctx.beginPath();ctx.ellipse(x,y,(p.organism==='lettuce'?3.6:3.2)*scale,(p.organism==='lettuce'?1.6:2.6)*scale,sd.ang,0,6.29);ctx.fill();});
      // labels
      const f=frac(dish),ng=dish.filter(q=>q.g).length;
      pill(ctx,doseLabel(d),cx,cy-DR-15,d===0?PAL['s3']:PAL['card'],d===0?'#fff':PAL['cv-ink'],11.5*k);
      txt(ctx,ng+'/'+dish.length+' sprouted · '+Math.round(100*f)+'%',cx,cy+DR+20,{s:12.5*k,w:700,a:'center'});});
    // right panel: clock and mini dose-response
    const PX=556,PW=232;ctx.fillStyle=PAL['card'];rr(ctx,PX,36,PW,292,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,org.name+' seeds · '+(p.salt==='mgcl'?'MgCl₂ deicer':'table salt'),PX+12,58,{s:12.5*k,w:700});
    const hr=Math.min(END,sim.t);txt(ctx,'Hour '+Math.floor(hr)+' of 72',PX+12,78,{s:12*k,c:PAL['cv-soft']});
    ctx.fillStyle=PAL['line'];rr(ctx,PX+12,86,PW-24,6,3);ctx.fill();ctx.fillStyle=PAL['s1'];rr(ctx,PX+12,86,(PW-24)*clamp(hr/72,0,1),6,3);ctx.fill();
    const gx=PX+34,gy=122,gw=PW-52,gh=160,fr=s.dishes.map(frac);
    ctx.strokeStyle=PAL['g-axis'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx,gy+gh);ctx.lineTo(gx+gw,gy+gh);ctx.stroke();
    const lx=d=>gx+(ap?(Math.log10(Math.max(d,0.15))-Math.log10(0.15))/(Math.log10(6)-Math.log10(0.15)):d/4.2)*gw,ly=v=>gy+gh-v*gh;
    [0,50,100].forEach(v=>txt(ctx,String(v),gx-5,ly(v/100)+4,{s:10.5*k,c:PAL['cv-soft'],a:'right'}));
    if(fr[0]>0){ctx.setLineDash([4,3]);ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(gx,ly(fr[0]/2));ctx.lineTo(gx+gw,ly(fr[0]/2));ctx.stroke();ctx.setLineDash([]);}
    ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.beginPath();DOSES.forEach((d,i)=>{if(ap&&d===0)return;const x=lx(d),y=ly(fr[i]);(i===0||(ap&&i===1))?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.stroke();
    DOSES.forEach((d,i)=>{if(ap&&d===0)return;ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(lx(d),ly(fr[i]),3.5,0,6.29);ctx.fill();});
    const ld=est(sim);if(ld>0){ctx.strokeStyle=PAL['s2'];ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(lx(ld),gy+gh);ctx.lineTo(lx(ld),ly(fr[0]/2));ctx.stroke();ctx.setLineDash([]);}
    txt(ctx,'salt %'+(ap?' (log)':''),gx+gw,gy+gh+16,{s:10.5*k,c:PAL['cv-soft'],a:'right'});
    txt(ctx,'% sprouted',gx+6,gy+2,{s:10.5*k,c:PAL['cv-soft']});
    txt(ctx,ld>0?'LD50 ≈ '+ld.toFixed(2)+'%':'LD50: not enough data yet',PX+PW/2,350,{s:13.5*k,w:700,a:'center',c:ld>0?PAL['s2']:PAL['cv-soft']});
    if(atLeast('ap')){const ed=estED(sim);txt(ctx,ed>0?'ED50 (roots) ≈ '+ed.toFixed(2)+'%':'',PX+PW/2,372,{s:12.5*k,a:'center',c:PAL['cv-soft']});}
    // legend
    ctx.fillStyle=org.seedD;ctx.beginPath();ctx.ellipse(568,420,3.2,2.6,0,0,6.29);ctx.fill();txt(ctx,'seed',576,424,{s:11.5*k,c:PAL['cv-soft']});
    ctx.strokeStyle='#cfc6ad';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(628,420);ctx.lineTo(648,416);ctx.stroke();txt(ctx,'root (sprouted)',654,424,{s:11.5*k,c:PAL['cv-soft']});}
};
BioLab.register(SIM);
})();
