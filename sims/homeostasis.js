(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;

/* Blood sugar: a minimal glucose–insulin–glucagon model (mg/dL, µU/mL, pg/mL, minutes).
   Body temperature: heat balance in units of resting heat (1 unit ≈ 80 W; 0.02 °C/min if nothing were lost). */
function glucStep(s,p,dt){
  const Ra=0.017*s.Q;s.Q=Math.max(0,s.Q-Ra*dt);
  const Si=0.002*(p.t2?0.25:1);
  const sec=p.t1?0:(10+0.9*Math.max(0,s.G-90))*(s.G<90?Math.max(0.2,s.G/90):1);
  const ab=0.02*s.D;s.D=Math.max(0,s.D-ab*dt);
  s.I+=dt*(0.3*(sec-s.I)+ab);s.I=Math.max(0,s.I);s.Ipk=Math.max(s.Ipk,s.I);
  s.X+=dt*0.025*(s.I-s.X);
  const gnT=Math.max(20,60+5*Math.max(0,85-s.G)-0.8*Math.max(0,s.X-10)+(s.ex>0?20:0));s.Gn+=dt*0.2*(gnT-s.Gn);
  s.hgp=(s.Lg>5?1:s.Lg/5)*4.5*(s.Gn/60)/(1+s.X/15);
  const exU=s.ex>0?0.012:0;
  s.upt=(0.01+Si*s.X+exU)*s.G;s.ren=s.G>180?0.05*(s.G-180):0;s.Ra=Ra;
  s.Lg=clamp(s.Lg+dt*0.05*((Si/0.002)*(s.X/10)*(s.G/90)-s.hgp/2.7),0,120);
  s.G=Math.max(20,s.G+dt*(Ra*6.67+s.hgp-s.upt-s.ren));
  s.sec=sec;}
function tempStep(s,p,dt){
  const S=p.fever?39:37;s.S=S;
  s.vaso=clamp(1+3*(s.Tc-S),0.35,3);s.shiv=clamp(4*(S-0.2-s.Tc),0,3);s.sweat=clamp(6*(s.Tc-S-0.1),0,6);
  const exH=s.ex>0?3:0;s.made=1+s.shiv+exH;s.dry=0.0667*s.vaso*(s.Tc-p.ta);s.lost=s.dry+s.sweat;
  s.Tc+=dt*0.02*(s.made-s.lost);}
const isG=sim=>sim.p.mode==='glucose';
function syncMode(sim){if(!sim.ui||!sim.ui.tiles)return;const mode=sim.p.mode;
  sim.def.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const el=t.num.closest('.tile');if(el)el.hidden=!atLeast(m.lvl)||(m.mode&&m.mode!==mode);});
  sim.def.controls.forEach(c=>{if(!c.mode)return;const inp=document.getElementById('homeostasis-'+c.id);const w=inp&&inp.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||c.mode!==mode;});
  const btns=[...sim.ui.ctrls.querySelectorAll('.actions button')];sim.def.actions.forEach((a,i)=>{if(btns[i])btns[i].hidden=!atLeast(a.lvl)||(a.mode&&a.mode!==mode);});
  const GM={G:'glucose',horm:'glucose',Tc:'temp',set:'temp',heat:'temp'};if(sim.ui.gm&&GM[sim.gMetric]!==mode){const want=mode==='glucose'?'G':'Tc';sim.gMetric=want;sim.ui.gm.value=want;BioLab.refresh(sim);}}
const f0=v=>Math.round(v);

const HOMEO={
  id:'homeostasis',hash:'homeostasis',apUnit:9,order:1,kind:'Simulation',tab:'Homeostasis',
  card:'Eat a meal, run, or step into the snow. Watch insulin, glucagon, sweat and shivers pull your body back to normal.',
  title:'Homeostasis: blood sugar and body temperature',
  lede:{bio:'Your body keeps blood sugar and temperature in a narrow range. Push them out of range and watch the body push back.',
        honors:'Follow the negative feedback loops: insulin and glucagon for blood sugar, sweating and shivering for temperature. Then see what goes wrong in diabetes and fever.',
        ap:'Quantify two negative feedback systems. Compare healthy, type 1 and type 2 responses with hormone curves, and see how a fever resets the thermostat.'},
  scale:{bio:'Your whole body: about 5 liters of blood carrying roughly a teaspoon (4–5 g) of sugar at any moment.'},
  timeScale:5,dtMax:0.1,prewarm:300,sampleDt:1,window:300,unit:'min',chChange:10,chReveal:180,
  clock(sim){const m=Math.floor(sim.t);return 'Time '+Math.floor(m/60)+' h '+String(m%60).padStart(2,'0')+' min';},
  controls:[
    {id:'mode',label:'Feedback system',type:'seg',def:'glucose',lvl:'bio',options:[{v:'glucose',l:'Blood sugar'},{v:'temp',l:'Body temperature'}],onChange(sim){syncMode(sim);sim.infoDirty=true;}},
    {id:'carbs',label:'Carbohydrate in a meal',type:'range',min:20,max:150,step:5,def:75,unit:' g',lvl:'bio',mode:'glucose',help:'A sandwich and juice is about 75 g.'},
    {id:'t1',label:'Type 1 diabetes',help:'Beta cells destroyed: no insulin made',type:'toggle',def:false,lvl:'honors',mode:'glucose'},
    {id:'t2',label:'Type 2 diabetes',help:'Cells respond weakly to insulin (insulin resistance)',type:'toggle',def:false,lvl:'honors',mode:'glucose'},
    {id:'ta',label:'Air temperature',type:'range',min:-20,max:45,step:1,def:22,unit:' °C',lvl:'bio',mode:'temp'},
    {id:'fever',label:'Fever (infection)',help:'The brain raises its set point to 39 °C',type:'toggle',def:false,lvl:'honors',mode:'temp'}
  ],
  actions:[
    {id:'meal',label:'Eat a meal',primary:true,mode:'glucose',run(sim){sim.st.Q+=sim.p.carbs;}},
    {id:'exercise',label:'Exercise for 30 min',run(sim){sim.st.ex=30;}},
    {id:'insulin',label:'Inject insulin',lvl:'honors',mode:'glucose',run(sim){sim.st.D+=600;}}
  ],
  init(){return {G:90,I:10,X:10,Gn:60,Q:0,D:0,Lg:80,ex:0,Ipk:10,hgp:2.7,upt:2.7,ren:0,Ra:0,sec:10,Tc:37,S:37,vaso:1,shiv:0,sweat:0,made:1,dry:1,lost:1};},
  step(sim,dt){const s=sim.st,p=sim.p;glucStep(s,p,dt);tempStep(s,p,dt);if(s.ex>0)s.ex=Math.max(0,s.ex-dt);},
  afterPrewarm(sim){sim.st.Ipk=sim.st.I;},
  onLevel(sim){syncMode(sim);},
  metrics:[
    {id:'G',mode:'glucose',label:'Blood glucose',unit:'mg/dL',lvl:'bio',min:0,max:400,d:0,get:s=>s.st.G},
    {id:'I',mode:'glucose',label:'Insulin',unit:'µU/mL',lvl:'bio',min:0,max:150,d:0,get:s=>s.st.I},
    {id:'Gn',mode:'glucose',label:'Glucagon',unit:'pg/mL',lvl:'bio',min:0,max:200,d:0,get:s=>s.st.Gn},
    {id:'Lg',mode:'glucose',label:'Liver glycogen',unit:'g',lvl:'honors',min:0,max:120,d:0,get:s=>s.st.Lg},
    {id:'urine',mode:'glucose',label:'Sugar in urine',unit:'',lvl:'honors',text:true,get:s=>s.st.G>180?'Yes: kidneys spilling glucose':'None'},
    {id:'Ipk',mode:'glucose',label:'Highest insulin since reset',unit:'µU/mL',lvl:'ap',min:0,max:150,d:0,get:s=>s.st.Ipk},
    {id:'Tc',mode:'temp',label:'Core temperature',unit:'°C',lvl:'bio',min:34,max:41,fixed:true,d:1,get:s=>s.st.Tc},
    {id:'S',mode:'temp',label:'Brain’s set point',unit:'°C',lvl:'honors',min:34,max:41,fixed:true,d:1,get:s=>s.st.S},
    {id:'shiv',mode:'temp',label:'Shivering',unit:'W',lvl:'bio',min:0,max:240,d:0,get:s=>s.st.shiv*80},
    {id:'sweat',mode:'temp',label:'Sweating',unit:'L/h',lvl:'bio',min:0,max:0.8,d:2,get:s=>s.st.sweat*0.12},
    {id:'skin',mode:'temp',label:'Blood flow to skin',unit:'% of normal',lvl:'honors',min:0,max:300,d:0,get:s=>s.st.vaso*100},
    {id:'Hm',mode:'temp',label:'Heat made',unit:'W',lvl:'ap',min:0,max:600,d:0,get:s=>s.st.made*80},
    {id:'Hl',mode:'temp',label:'Heat lost',unit:'W',lvl:'ap',min:-100,max:600,d:0,get:s=>s.st.lost*80}
  ],
  graphs:[{id:'G',label:'Blood glucose',lines:['G']},{id:'horm',label:'Insulin and glucagon',lines:['I','Gn'],yl:'Hormone level'},
    {id:'Tc',label:'Core temperature',lines:['Tc']},{id:'set',label:'Core temperature and set point',lvl:'honors',lines:['Tc','S'],yl:'°C'},{id:'heat',label:'Heat made and lost',lvl:'ap',lines:['Hm','Hl'],yl:'Watts'}],
  defaultGraph:'G',
  challenges:[
    {lvl:'bio',q:'You eat a big meal (75 g of carbohydrate). What happens to your blood glucose over the next three hours?',
     choices:['It rises and stays high','It rises, then insulin brings it back to about normal','It drops below normal and stays there'],correct:1,
     baseline:{mode:'glucose'},changeAction:'meal',changeText:'Meal eaten',watch:'G',at:10,reveal:180,
     explain:{bio:'Sugar from the meal raises blood glucose. The pancreas senses the rise and releases insulin, which tells muscle, fat and liver cells to take glucose in. As glucose falls, insulin falls too. That is negative feedback.',
              ap:'Peak glucose comes about 20–30 minutes after the meal. Insulin rises with glucose, increases uptake (GLUT4 transporters in muscle and fat) and suppresses liver glucose output, returning glucose to its set point within about 90 minutes.'}},
    {lvl:'bio',q:'You step outside into −10 °C air in a T-shirt. What does your body do?',
     choices:['Lets its core temperature drop to about 30 °C','Shivers and narrows skin blood vessels, keeping the core near 37 °C','Sweats to warm up'],correct:1,
     baseline:{mode:'temp'},change:{ta:-10},changeText:'Air temperature dropped to −10 °C',watch:'Tc',at:10,reveal:60,
     explain:{bio:'Your brain senses the drop and fights back. Skin blood vessels narrow so less heat escapes, and muscles shiver to make extra heat. Your core stays close to 37 °C.'}},
    {lvl:'honors',q:'An immune attack destroys the beta cells in the pancreas (type 1 diabetes). What happens to blood glucose, even without eating?',
     choices:['It climbs and stays high','It drops dangerously low','It stays normal because glucagon takes over'],correct:0,
     baseline:{mode:'glucose'},change:{t1:true},changeText:'Insulin production stopped',watch:'G',at:10,reveal:240,
     explain:{honors:'Without insulin, cells can’t take in glucose well and nothing tells the liver to stop releasing it. Glucose climbs far above normal, and above about 180 mg/dL the kidneys start spilling sugar into urine. People with type 1 diabetes need insulin injections.'}},
    {lvl:'honors',q:'An infection gives you a fever: your brain raises its set point from 37 to 39 °C. What happens first?',
     choices:['You sweat, to cool down','You feel cold and shiver until your core reaches about 39 °C','Nothing, because the room temperature didn’t change'],correct:1,
     baseline:{mode:'temp'},change:{fever:true},changeText:'Set point raised to 39 °C',watch:'set',at:10,reveal:90,
     explain:{honors:'The feedback loop now aims at 39 °C, so a normal 37 °C body counts as "too cold". You get chills: shivering and narrowed skin vessels heat you up to the new set point. When the fever breaks, the set point drops back and you sweat.'}},
    {lvl:'ap',q:'You exercise hard for 30 minutes without eating. Your muscles are pulling glucose out of the blood. What keeps blood glucose from crashing?',
     choices:['Glucagon rises and the liver releases stored glucose','Insulin rises','Glucagon falls'],correct:0,
     baseline:{mode:'glucose'},changeAction:'exercise',changeText:'Exercise started',watch:'horm',at:10,reveal:34,
     explain:{ap:'Falling glucose lowers insulin and raises glucagon from alpha cells. Glucagon signals the liver to break down glycogen (and make new glucose), so blood glucose dips only slightly. Watch liver glycogen fall.'}},
    {lvl:'ap',q:'A person with type 2 diabetes eats the same meal. In a healthy person insulin peaks near 72 µU/mL. How does this person’s insulin compare?',
     choices:['It peaks higher, because cells resist insulin and glucose stays high longer','It stays lower, because the pancreas is damaged','It is the same'],correct:0,
     baseline:{mode:'glucose',t2:true},changeAction:'meal',changeText:'Meal eaten',watch:'horm',at:10,reveal:70,
     explain:{ap:'In insulin resistance, each unit of insulin moves less glucose, so glucose stays high and the beta cells keep secreting. Early type 2 diabetes often shows high insulin. Over years, overworked beta cells can fail. Compare the Highest insulin readout with about 72 in a healthy run.'}}
  ],
  narrate(sim){const s=sim.st,p=sim.p,hon=atLeast('honors');
    if(isG(sim)){const G=f0(s.G);
      if(s.G<70)return '<b>Low blood sugar ('+G+' mg/dL).</b> Insulin is shut off and glucagon is high, telling the liver to release glucose. Too much injected insulin can cause this.';
      if(p.t1&&hon&&s.G>150)return '<b>No insulin is being made.</b> Glucose stays at '+G+' mg/dL because cells can’t take it in and the liver keeps releasing more.'+(s.G>180?' The kidneys are spilling sugar into the urine.':'');
      if(s.Ra>0.3&&s.G>100)return '<b>Sugar from food is entering the blood.</b> Glucose is '+G+' mg/dL, so beta cells release insulin ('+f0(s.I)+' µU/mL), and muscle, fat and liver cells start taking glucose in.';
      if(s.ex>0)return '<b>Exercising muscles are pulling glucose from the blood.</b> Glucagon rises to '+f0(s.Gn)+' pg/mL, so the liver breaks down glycogen and keeps blood glucose near '+G+' mg/dL.';
      if(s.G>110)return 'Glucose is still high ('+G+' mg/dL). Insulin ('+f0(s.I)+' µU/mL) keeps cells taking up glucose and holds back the liver, so glucose is falling.';
      return 'Blood glucose is in the normal range ('+G+' mg/dL). Insulin and glucagon are both at their resting levels.'+(p.t2&&hon?' With insulin resistance, it takes more insulin to keep it here.':'')+' Try <b>Eat a meal</b>.';}
    const T=s.Tc.toFixed(1);
    if(p.fever&&hon&&s.Tc<s.S-0.3)return '<b>Fever: the set point is 39 °C, so the body feels cold.</b> It shivers and narrows skin vessels (chills) to push the core from '+T+' °C up to 39.';
    if(s.shiv>0.05)return '<b>Too cold.</b> Skin blood vessels have narrowed to keep heat in, and muscles are shivering to make '+f0(s.shiv*80)+' W of extra heat. Core: '+T+' °C.';
    if(s.sweat>0.05)return '<b>Too warm.</b> Skin blood vessels have widened (flushed skin) and you are sweating '+(s.sweat*0.12).toFixed(2)+' L per hour. Evaporating sweat carries heat away. Core: '+T+' °C.';
    return 'Core temperature is '+T+' °C, right at the set point. Small changes in skin blood flow are enough to balance heat made and heat lost.';},
  tour:[
    {title:'Blood carries glucose',text:'Glucose (gold) travels in the blood to every cell. A healthy body keeps it near 90 mg/dL: about a teaspoon of sugar in all your blood.',focus:[8,168,784,104],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'glucose'});}},
    {title:'A meal arrives',text:'Digestion breaks carbohydrates into glucose, which crosses the small intestine into the blood. Blood glucose starts to rise.',focus:[290,20,220,148],speed:1,setup(sim){sim.st.Q+=sim.p.carbs;}},
    {title:'The pancreas responds',text:{bio:'The pancreas senses the rise and releases insulin (blue) into the blood.',honors:'Beta cells in the pancreatic islets sense high glucose and secrete insulin (blue). Alpha cells cut back on glucagon (purple).'},focus:[[30,290,290,140],[8,168,784,104]],speed:0.6},
    {title:'Cells take glucose in',text:'Insulin unlocks glucose doors on muscle and fat cells, and tells the liver to store glucose as glycogen. Glucose falls back toward normal. When it does, insulin falls too: negative feedback.',focus:[[30,20,210,148],[460,290,320,140]],speed:1},
    {title:'When glucose runs low',text:'Exercise burns glucose. When blood glucose dips, alpha cells release glucagon, and the liver breaks down glycogen to put glucose back in the blood.',focus:[[30,20,210,148],[30,290,290,140]],speed:1,setup(sim){sim.st.ex=30;}},
    {title:'Temperature works the same way',text:'Your brain’s thermostat (hypothalamus) compares your core temperature with a set point of 37 °C. In the cold, skin vessels narrow and muscles shiver.',focus:[150,30,240,410],speed:1,setup(sim){BioLab.setValues(sim,{mode:'temp',ta:-10});}},
    {title:'Too hot: sweat',text:'In the heat, skin vessels widen (that’s why you flush) and you sweat. Evaporating sweat carries heat away and pulls the core back toward 37 °C.',focus:[150,30,240,410],speed:1,setup(sim){BioLab.setValues(sim,{ta:40});sim.st.ex=30;}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'glucose',ta:22,fever:false});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> How does the body respond to meals of different sizes?</p><ol><li>Choose Blood sugar.</li><li>Set the meal to 25 g, press Eat a meal, and record a trial at 30 minutes (peak) and again at 2 hours.</li><li>Press Reset and repeat for 75 g and 150 g.</li></ol><p>Describe what insulin does after each meal and how long glucose takes to return to normal.</p>',
       honors:'<p><b>Question:</b> How do type 1 and type 2 diabetes change the response to a meal?</p><ol><li>Record glucose and insulin 30, 60 and 120 minutes after a 75 g meal for a healthy body.</li><li>Repeat with Type 1 diabetes on, then Type 2 diabetes on (Reset between runs).</li><li>For type 1, try Inject insulin and record what happens.</li></ol><p>Explain each result in terms of the feedback loop: which part is broken?</p>',
       ap:'<p><b>Question:</b> How does the body balance heat at different air temperatures?</p><ol><li>Choose Body temperature. Record core temperature, heat made, heat lost, shivering and sweating at air temperatures of −20, 0, 10, 22, 30 and 40 °C (wait about 60 minutes at each).</li><li>Repeat with a fever.</li></ol><p><b>Claim–evidence–reasoning:</b> Identify the stimulus, sensor, control center and effectors, and explain why core temperature stays nearly constant.</p>'},
  terms:[{t:'Homeostasis',d:'Keeping the body’s internal conditions in a stable range.'},{t:'Negative feedback',d:'A response that reverses a change, bringing a value back toward its set point.'},{t:'Insulin',d:'Hormone from beta cells that lowers blood glucose.'},{t:'Glucagon',d:'Hormone from alpha cells that raises blood glucose.'},
    {lvl:'honors',t:'Glycogen',d:'Stored glucose in the liver and muscles.'},{lvl:'honors',t:'Set point',d:'The target value a feedback loop holds, such as 37 °C.'},{lvl:'honors',t:'Vasodilation / vasoconstriction',d:'Widening or narrowing of skin blood vessels to lose or keep heat.'},{lvl:'honors',t:'Type 1 / type 2 diabetes',d:'No insulin is made (type 1), or cells resist insulin (type 2).'},
    {lvl:'ap',t:'Stimulus, sensor, control center, effector',d:'The parts of a feedback loop, e.g. high glucose, beta cells, pancreas, muscle and liver.'},{lvl:'ap',t:'Insulin resistance',d:'Cells need more insulin to take in the same glucose.'}],
  about:'<p><b>Blood sugar:</b> glucose G changes with gut absorption (1.7% of the meal per minute), liver output (raised by glucagon, lowered by insulin) and uptake ((0.01 + S<sub>i</sub>·insulin action)·G), plus kidney loss above 180 mg/dL. Insulin secretion rises 0.9 µU/mL per mg/dL above 90; insulin action lags insulin by about 40 minutes. Type 1 sets secretion to zero; type 2 cuts insulin sensitivity to 25%. Injected insulin is absorbed from a depot over about an hour.</p><p><b>Temperature:</b> heat made = 80 W resting + shivering + exercise; heat lost = skin conduction (scaled by blood flow) + sweating. Responses scale with how far the core is from the set point.</p><p><b>Simplified:</b> one compartment for blood, no stress hormones (cortisol, epinephrine), no humidity or wind, and no behavior such as putting on a coat. Numbers are typical adult values, not a medical model.</p>',
  initVis(sim){const r=rng(23),v=sim.vis;v.bl=[];for(let i=0;i<110;i++)v.bl.push({x:r()*780+10,y:190+r()*72,k:r(),ph:r()*6.3});
    v.gly=[];for(let i=0;i<30;i++)v.gly.push([60+r()*150,55+r()*80]);v.food=[];for(let i=0;i<30;i++)v.food.push([320+r()*170,60+r()*70,r()*6.3]);
    v.flakes=[];for(let i=0;i<40;i++)v.flakes.push([r()*520,r()*440,0.5+r()]);v.drops=[];v.fl=0;},
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis,hon=atLeast('honors'),ap=atLeast('ap'),j=RM?0:1;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(isG(sim))drawGlucose(sim,ctx,vdt,k,t,s,p,v,hon,ap,j);else drawTemp(sim,ctx,vdt,k,t,s,p,v,hon,ap,j);}
};

function drawGlucose(sim,ctx,vdt,k,t,s,p,v,hon,ap,j){
  // liver
  ctx.fillStyle='#8b4a3a';ctx.beginPath();ctx.ellipse(110,95,82,52,-0.15,0,6.29);ctx.fill();ctx.beginPath();ctx.ellipse(190,105,44,36,0.3,0,6.29);ctx.fill();
  ctx.fillStyle='#f0cc72';v.gly.slice(0,Math.round(s.Lg/4)).forEach(g=>{ctx.beginPath();ctx.arc(g[0],g[1],3.2,0,6.29);ctx.fill();});
  pill(ctx,'Liver',110,92,'#5e2f24','#fff',14*k);if(hon)pill(ctx,'gold = glycogen',110,122,'#5e2f24','#fde7b0',10.5*k);
  if(s.hgp>3.2)pill(ctx,'releasing glucose',150,30,PAL['s4'],'#1c1c1f',11*k);
  // intestine
  ctx.strokeStyle='#d79a82';ctx.lineWidth=18;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(310,55);for(let i=0;i<4;i++){ctx.lineTo(490,55+i*26);ctx.lineTo(310,68+i*26);}ctx.stroke();
  const nf=Math.min(30,Math.round(s.Q/2.5));ctx.fillStyle=PAL['s4'];v.food.slice(0,nf).forEach(f=>{ctx.beginPath();ctx.arc(f[0]+Math.sin(t+f[2])*3*j,f[1],3.4,0,6.29);ctx.fill();});
  txt(ctx,'Small intestine',400,30,{s:12*k,w:700,c:PAL['cv-soft'],a:'center'});
  if(s.Ra>0.2){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;[360,400,440].forEach(x=>{ctx.beginPath();ctx.moveTo(x,148);ctx.lineTo(x,178);ctx.stroke();ctx.beginPath();ctx.moveTo(x-5,172);ctx.lineTo(x,180);ctx.lineTo(x+5,172);ctx.stroke();});}
  // kidney
  if(hon){ctx.fillStyle='#a0524a';ctx.beginPath();ctx.ellipse(650,92,40,56,0.15,0,6.29);ctx.fill();ctx.fillStyle=PAL['cv-bg'];ctx.beginPath();ctx.ellipse(682,96,14,20,0.15,0,6.29);ctx.fill();
    txt(ctx,'Kidney',638,74,{s:13*k,w:800,c:'#fff',a:'center',b:'middle'});
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;rr(ctx,720,96,46,54,6);ctx.stroke();ctx.fillStyle=s.G>180?'#e3c64a':'#efe3a0';ctx.globalAlpha=.8;rr(ctx,722,112,42,36,5);ctx.fill();ctx.globalAlpha=1;
    txt(ctx,'urine',743,166,{s:11*k,c:PAL['cv-soft'],a:'center'});if(s.G>180){ctx.fillStyle=PAL['s4'];for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(730+i*8,128+(i%2)*8,3,0,6.29);ctx.fill();}}}
  // blood vessel
  ctx.fillStyle=PAL['cv-ims'];rr(ctx,8,184,784,82,30);ctx.fill();ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;ctx.stroke();
  const nG=Math.min(70,Math.round(s.G/5.5)),nI=Math.min(30,Math.round(s.I/4)),nGn=Math.min(25,Math.round((s.Gn-20)/6));let gi=0,ii=0,ni=0;
  v.bl.forEach(b=>{b.x+=vdt*40;if(b.x>785)b.x-=775;const y=b.y+Math.sin(t*2+b.ph)*2*j;
    if(b.k<0.62){if(gi++>=nG)return;ctx.fillStyle=PAL['s4'];ctx.beginPath();for(let a=0;a<6;a++){const an=a*1.047;ctx.lineTo(b.x+Math.cos(an)*4.6,y+Math.sin(an)*4.6);}ctx.closePath();ctx.fill();}
    else if(b.k<0.85){if(ii++>=nI)return;ctx.fillStyle=PAL['s2'];rr(ctx,b.x-4,y-4,8,8,2);ctx.fill();}
    else{if(ni++>=nGn)return;ctx.fillStyle=PAL['s5'];ctx.beginPath();ctx.moveTo(b.x,y-5);ctx.lineTo(b.x+5,y+4);ctx.lineTo(b.x-5,y+4);ctx.closePath();ctx.fill();}});
  const G=s.G,col=G<70?PAL['s1']:G>140?PAL['s1']:G>110?PAL['s4']:PAL['s3'];
  txt(ctx,'BLOOD',22,202,{s:11*k,w:800,c:PAL['cv-soft']});
  // pancreas
  ctx.fillStyle='#e2b27c';ctx.beginPath();ctx.ellipse(170,365,130,42,-0.08,0,6.29);ctx.fill();
  ctx.fillStyle='#f7e3c4';ctx.beginPath();ctx.arc(150,365,26,0,6.29);ctx.fill();
  for(let i=0;i<9;i++){const a=i*0.7,r=i<6?12:20;ctx.fillStyle=i<6?PAL['s2']:PAL['s5'];ctx.beginPath();ctx.arc(150+Math.cos(a)*r*0.8,365+Math.sin(a)*r*0.7,4.5,0,6.29);ctx.fill();}
  txt(ctx,'Pancreas',245,372,{s:14*k,w:800,c:'#5b3a17',a:'center',b:'middle'});
  if(hon){txt(ctx,'β cells → insulin',40,424,{s:11.5*k,w:700,c:PAL['s2']});txt(ctx,'α cells → glucagon',40,442,{s:11.5*k,w:700,c:PAL['s5']});}
  if(s.sec>20){ctx.strokeStyle=PAL['s2'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(140,332);ctx.lineTo(140,272);ctx.stroke();ctx.beginPath();ctx.moveTo(134,280);ctx.lineTo(140,270);ctx.lineTo(146,280);ctx.stroke();}
  if(s.Gn>70){ctx.strokeStyle=PAL['s5'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(175,332);ctx.lineTo(175,272);ctx.stroke();ctx.beginPath();ctx.moveTo(169,280);ctx.lineTo(175,270);ctx.lineTo(181,280);ctx.stroke();}
  // muscle
  ctx.fillStyle='#c0636b';rr(ctx,470,310,300,100,14);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=2;for(let y=322;y<404;y+=10){ctx.beginPath();ctx.moveTo(480,y);ctx.lineTo(760,y);ctx.stroke();}
  const doors=Math.round(clamp((s.X-5)/12,0,8));for(let i=0;i<8;i++){const x=490+i*35;ctx.fillStyle=i<doors?PAL['s3']:'#7d3940';rr(ctx,x,302,18,14,3);ctx.fill();}
  if(s.upt>4){ctx.fillStyle=PAL['s4'];for(let i=0;i<doors;i++){const yy=(t*40+i*13)%40;ctx.beginPath();ctx.arc(499+i*35,290+yy,3.4,0,6.29);ctx.fill();}}
  txt(ctx,'Muscle and fat cells',620,366,{s:14*k,w:800,c:'#fff',a:'center',b:'middle'});
  txt(ctx,hon?'green doors = glucose transporters':'green doors open with insulin',620,430,{s:11*k,c:PAL['cv-soft'],a:'center'});
  // big readout
  txt(ctx,'Blood glucose '+Math.round(G)+' mg/dL',22,180,{s:15*k,w:800,c:col,b:'bottom'});
  if(!hon)txt(ctx,'normal: 70–140',300,180,{s:11.5*k,c:PAL['cv-soft'],b:'bottom'});
  // AP: feedback loop box
  if(ap){const bx=318,by=296;ctx.fillStyle=PAL['card'];rr(ctx,bx,by,140,122,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,'Feedback loop',bx+70,by+16,{s:11.5*k,w:800,a:'center'});
    const hi=G>105,lo=G<85,lines=hi?['Glucose high','→ β cells','→ insulin ↑','→ cells take in glucose','→ glucose falls']:lo?['Glucose low','→ α cells','→ glucagon ↑','→ liver releases glucose','→ glucose rises']:['Glucose in range','Both hormones at','resting levels'];
    lines.forEach((l,i)=>txt(ctx,l,bx+10,by+36+i*17,{s:11*k,w:i===0?700:400,c:hi?PAL['s2']:lo?PAL['s5']:PAL['cv-soft']}));}
  // legend
  let lx=470;const sw=(col,lab,shape)=>{ctx.fillStyle=col;if(shape===0){ctx.beginPath();ctx.arc(lx+5,282,4.5,0,6.29);ctx.fill();}else if(shape===1){rr(ctx,lx+1,278,8,8,2);ctx.fill();}else{ctx.beginPath();ctx.moveTo(lx+5,277);ctx.lineTo(lx+10,286);ctx.lineTo(lx,286);ctx.closePath();ctx.fill();}
    txt(ctx,lab,lx+15,286,{s:11.5*k,c:PAL['cv-soft']});ctx.font='400 '+11.5*k+'px '+FONT;lx+=ctx.measureText(lab).width+28;};
  sw(PAL['s4'],'glucose',0);sw(PAL['s2'],'insulin',1);sw(PAL['s5'],'glucagon',2);
}

function drawTemp(sim,ctx,vdt,k,t,s,p,v,hon,ap,j){
  const cold=clamp((15-p.ta)/35,0,1),hot=clamp((p.ta-26)/19,0,1);
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,520,450);
  if(cold>0){ctx.fillStyle='rgba(90,140,220,'+(0.28*cold)+')';ctx.fillRect(0,0,520,450);}
  if(hot>0){ctx.fillStyle='rgba(240,150,50,'+(0.3*hot)+')';ctx.fillRect(0,0,520,450);ctx.fillStyle='#f6c343';ctx.beginPath();ctx.arc(460,60,30+hot*8,0,6.29);ctx.fill();}
  if(p.ta<=0){ctx.fillStyle='rgba(255,255,255,.85)';v.flakes.forEach(f=>{f[1]+=vdt*30*f[2];if(f[1]>430)f[1]=0;ctx.beginPath();ctx.arc(f[0]+Math.sin(t+f[1]*0.05)*6*j,f[1],2.2*f[2],0,6.29);ctx.fill();});}
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,420,520,30);
  txt(ctx,'Air '+p.ta+' °C',16,26,{s:15*k,w:800});
  // person
  const sh=RM?0:Math.sin(t*70)*Math.min(3,s.shiv)*1.1,cx=260+sh,ex=s.ex>0;
  const skin='#d9a27a';
  ctx.strokeStyle=skin;ctx.lineWidth=18;ctx.lineCap='round';
  const legA=ex?Math.sin(t*8)*0.35:0;
  ctx.beginPath();ctx.moveTo(cx-18,300);ctx.lineTo(cx-24+Math.sin(legA)*50,412);ctx.moveTo(cx+18,300);ctx.lineTo(cx+24-Math.sin(legA)*50,412);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx-44,170);ctx.lineTo(cx-64-Math.sin(legA)*30,280);ctx.moveTo(cx+44,170);ctx.lineTo(cx+64+Math.sin(legA)*30,280);ctx.stroke();
  ctx.fillStyle='#3f6fb0';rr(ctx,cx-48,150,96,150,22);ctx.fill();ctx.fillStyle='#4a4a52';rr(ctx,cx-46,286,92,40,10);ctx.fill();
  ctx.fillStyle=skin;ctx.beginPath();ctx.arc(cx,104,36,0,6.29);ctx.fill();ctx.fillRect(cx-10,136,20,18);
  // skin blood flow tint
  const red=clamp((s.vaso-1)/2,0,1),pale=clamp((1-s.vaso)/0.65,0,1);
  const tint=red>0?'rgba(220,40,40,'+(0.45*red)+')':'rgba(110,140,220,'+(0.4*pale)+')';
  ctx.fillStyle=tint;ctx.beginPath();ctx.arc(cx,104,36,0,6.29);ctx.fill();
  ctx.fillStyle='#2b2b30';ctx.beginPath();ctx.arc(cx-12,98,3.5,0,6.29);ctx.arc(cx+12,98,3.5,0,6.29);ctx.fill();
  // hypothalamus thermostat
  ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(cx,86,6,0,6.29);ctx.fill();
  pill(ctx,(hon?'Hypothalamus set point ':'Set point ')+s.S.toFixed(0)+' °C',cx,46,PAL['card'],PAL['cv-ink'],12*k);
  // sweat drops
  v.fl+=vdt*s.sweat*3;while(v.fl>=1&&vdt>0){v.fl--;const side=Math.random();v.drops.push({x:cx+(side<0.4?(Math.random()*50-25):side<0.7?-60:60),y:side<0.4?92:200,vy:20});}
  ctx.fillStyle='#5aa9e6';v.drops.forEach(d=>{d.y+=d.vy*vdt*4;ctx.beginPath();ctx.moveTo(d.x,d.y-6);ctx.quadraticCurveTo(d.x+4,d.y,d.x,d.y+3);ctx.quadraticCurveTo(d.x-4,d.y,d.x,d.y-6);ctx.fill();});v.drops=v.drops.filter(d=>d.y<420);if(v.drops.length>60)v.drops.splice(0,v.drops.length-60);
  if(s.shiv>0.2){txt(ctx,'brrr',cx+64,118,{s:14*k,w:800,c:PAL['s2']});ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2;[[-60,200],[60,200]].forEach(o=>{ctx.beginPath();ctx.moveTo(cx+o[0]-6,o[1]);ctx.lineTo(cx+o[0]+6,o[1]-6);ctx.lineTo(cx+o[0]-6,o[1]-12);ctx.stroke();});}
  if(ex)pill(ctx,'Exercising',cx,330,PAL['s4'],'#1c1c1f',12*k);
  // right panel: thermometer + heat bars
  ctx.fillStyle=PAL['card'];rr(ctx,534,12,256,426,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  const TY=v=>390-(v-34)/(42-34)*320;ctx.fillStyle=PAL['card2'];rr(ctx,560,60,18,336,9);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.stroke();
  ctx.fillStyle='#d32f2f';const ty=clamp(TY(s.Tc),60,392);ctx.fillRect(563,ty,12,392-ty);ctx.beginPath();ctx.arc(569,404,14,0,6.29);ctx.fill();
  [34,36,37,38,40,42].forEach(c=>{const y=TY(c);ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(580,y);ctx.lineTo(588,y);ctx.stroke();txt(ctx,c+'°',592,y,{s:11*k,c:PAL['cv-soft'],b:'middle'});});
  ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(550,TY(s.S));ctx.lineTo(596,TY(s.S));ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'Core',569,40,{s:12*k,w:700,a:'center'});txt(ctx,s.Tc.toFixed(1)+' °C',660,40,{s:18*k,w:800,c:Math.abs(s.Tc-37)>1?PAL['s1']:PAL['cv-ink']});
  txt(ctx,'set',600,TY(s.S)+4,{s:11*k,w:700,c:PAL['s3']});
  const bar=(y,lab,val,col)=>{txt(ctx,lab,660,y,{s:12*k,w:700});ctx.fillStyle=PAL['card2'];rr(ctx,660,y+6,120,12,6);ctx.fill();ctx.fillStyle=col;rr(ctx,660,y+6,Math.max(2,clamp(val,0,1)*120),12,6);ctx.fill();};
  bar(110,'Shivering',s.shiv/3,PAL['s2']);bar(150,'Sweating',s.sweat/6,'#5aa9e6');bar(190,'Skin blood flow',s.vaso/3,PAL['s1']);
  if(ap){bar(240,'Heat made '+Math.round(s.made*80)+' W',s.made/6,PAL['s4']);bar(280,'Heat lost '+Math.round(s.lost*80)+' W',clamp(s.lost,0,6)/6,PAL['s6']);
    const msg=s.shiv>0.05?['Too cold → hypothalamus','→ shiver, constrict vessels','→ more heat kept']:s.sweat>0.05?['Too hot → hypothalamus','→ sweat, widen vessels','→ more heat lost']:['At set point','small blood-flow changes'];
    msg.forEach((m,i)=>txt(ctx,m,660,330+i*17,{s:11*k,c:PAL['cv-soft']}));}
}
BioLab.register(HOMEO);
})();
