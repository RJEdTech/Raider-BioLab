(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,lvText,fmtNum}=BioLab.h;

/* lake pH from acid-neutralizing capacity (ANC, µeq/L) using carbonate charge balance:
   ANC = HCO3⁻ − H⁺ with HCO3⁻ = 6.7/H (µM, CO2 ≈ 15 µM, pKa1 6.35) */
const phFromANC=a=>{const H=(-a+Math.sqrt(a*a+26.8))/2;return 6-Math.log10(H);};
const fishFit=ph=>clamp((ph-4.6)/1.4,0,1);
/* pH paper style color: red (acid) → yellow → green (neutral) → blue (basic) */
function phColor(ph,a){const stops=[[3.5,[214,48,49]],[4.5,[232,120,40]],[5.5,[230,196,52]],[6.5,[120,190,80]],[7.5,[60,160,140]],[8.5,[50,110,200]]];
  let c=stops[stops.length-1][1];for(let i=1;i<stops.length;i++){if(ph<=stops[i][0]){const [p0,c0]=stops[i-1],[p1,c1]=stops[i],t=clamp((ph-p0)/(p1-p0),0,1);c=[c0[0]+(c1[0]-c0[0])*t,c0[1]+(c1[1]-c0[1])*t,c0[2]+(c1[2]-c0[2])*t];break;}if(i===1&&ph<stops[0][0]){c=stops[0][1];break;}}
  return 'rgba('+c.map(Math.round).join(',')+','+(a===undefined?1:a)+')';}

const ACID={
  id:'acidrain',hash:'acidrain',apUnit:14,order:2,kind:'Simulation',tab:'Acid rain',
  card:'Follow sulfur from a coal plant’s smokestack into the clouds and down into two lakes. One lake fights back; one loses its trout.',
  title:'Acid rain and lake buffering',
  lede:{bio:'Burning coal releases sulfur dioxide and nitrogen oxides. In clouds they become acids and fall as acid rain. Watch what happens to two lakes sitting on different kinds of rock.',
        honors:'Measure rain and lake pH over decades, test scrubbers and low-sulfur coal, and see why the pH scale is logarithmic with a dilution series.',
        ap:'Model acid deposition, acid-neutralizing capacity and soil base depletion. Explain buffering with CaCO₃ chemistry and why recovery lags behind emission cuts.'},
  scale:'A coal power plant and two mountain lakes about 100 km downwind. Time runs in years: about 1.5 years every second.',
  timeScale:1.5,dtMax:0.02,prewarm:0,sampleDt:0.1,window:40,unit:'years',timeLabel:'Year',chChange:0.5,chReveal:20,
  clock(sim){return 'Year '+Math.floor(sim.t)+' since the plant opened';},
  controls:[
    {id:'coal',label:'Electricity from the coal plant',type:'range',min:0,max:150,step:5,def:100,unit:'%',lvl:'bio'},
    {id:'scrub',label:'Smokestack scrubbers',help:'Spray limestone slurry that removes about 95% of the SO₂',type:'toggle',def:false,lvl:'bio'},
    {id:'sulfur',label:'Coal type',type:'seg',def:'high',lvl:'honors',options:[{v:'high',l:'High-sulfur'},{v:'low',l:'Low-sulfur'}],help:'Low-sulfur coal (like Wyoming coal) has about 70% less sulfur.'},
    {id:'cars',label:'Car and truck traffic (NOx)',type:'range',min:0,max:150,step:5,def:100,unit:'%',lvl:'honors'}
  ],
  actions:[
    {id:'lime',label:'Add limestone to Granite Lake',lvl:'ap',run(sim){sim.st.g+=150;sim.st.limed=3;}},
    {id:'dilute',label:'Dilute rain sample 10×',lvl:'honors',run(sim){sim.st.dil=Math.min(4,sim.st.dil+1);}},
    {id:'fresh',label:'Fresh rain sample',lvl:'honors',run(sim){sim.st.dil=0;}}
  ],
  init(){return {g:55,l:1500,B:1,fish:100,D:0,L:0,so2:0,nox:0,dil:0,limed:0};},
  step(sim,dt){const p=sim.p,s=sim.st;
    s.so2=p.coal/100*(p.sulfur==='low'?0.3:1)*60*(p.scrub?0.05:1);           // kt SO₂ per year
    s.nox=25*(p.coal/100*0.4+p.cars/100*0.6);
    s.D=s.so2+0.4*s.nox;                                                     // extra H⁺ in rain, µeq/L
    s.L=1.5*s.D;                                                              // acid reaching the lake after evaporation
    const gin=(20+40*s.B)-s.L*(1-0.85*s.B),lin=1500-0.1*s.L;                // granite: soils neutralize some acid while their base cations last
    s.B=clamp(s.B+dt*(-0.0009*s.L*s.B+0.02*(1-s.B)*(s.L<40?1:0.2)),0,1);
    s.g+=dt*(gin-s.g)/2;s.l+=dt*(lin-s.l)/2;
    const f=fishFit(phFromANC(s.g));s.fish+=dt*(f*100>s.fish?0.25:0.6)*(100*f-s.fish);s.fish=clamp(s.fish,0,100);
    if(s.limed>0)s.limed-=dt;},
  rainPH:s=>6-Math.log10(2.5+s.st.D),
  metrics:[
    {id:'rainph',label:'Rain pH',unit:'',lvl:'bio',min:3.5,max:7,d:2,fixed:true,get:s=>ACID.rainPH(s)},
    {id:'gph',label:'Granite Lake pH',unit:'',lvl:'bio',min:3.5,max:9,d:2,fixed:true,get:s=>phFromANC(s.st.g)},
    {id:'lph',label:'Limestone Lake pH',unit:'',lvl:'bio',min:3.5,max:9,d:2,fixed:true,get:s=>phFromANC(s.st.l)},
    {id:'fish',label:'Trout in Granite Lake',unit:'% of original',lvl:'bio',min:0,max:100,d:0,get:s=>s.st.fish},
    {id:'so2',label:'SO₂ from the plant',unit:'thousand t/yr',lvl:'honors',min:0,max:90,d:1,get:s=>s.st.so2},
    {id:'times',label:'Rain acidity vs. clean rain',unit:'× the H⁺',lvl:'honors',min:0,max:40,d:1,get:s=>(2.5+s.st.D)/2.5},
    {id:'sample',label:'Rain sample after dilution',unit:'pH',lvl:'honors',min:3.5,max:7,d:1,get:s=>Math.min(7,ACID.rainPH(s)+s.st.dil)},
    {id:'anc',label:'Granite Lake ANC',unit:'µeq/L',lvl:'ap',min:-100,max:100,d:0,get:s=>s.st.g},
    {id:'soil',label:'Soil buffering left',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>s.st.B*100}
  ],
  graphs:[
    {id:'ph',label:'pH of rain and lakes',lines:['rainph','gph','lph'],min:3.5,max:9,yl:'pH'},
    {id:'fish',label:'Trout in Granite Lake',lines:['fish']},
    {id:'so2',label:'SO₂ emissions',lvl:'honors',lines:['so2']},
    {id:'anc',label:'ANC and soil buffering',lvl:'ap',lines:['anc','soil']}
  ],
  defaultGraph:'ph',
  challenges:[
    {lvl:'bio',q:'Both lakes get the same acid rain for 20 years. Which lake ends up more acidic?',
     choices:['Granite Lake','Limestone Lake','They end up the same'],correct:0,
     change:{},changeText:'Twenty years of acid rain',watch:'gph',at:0.5,reveal:20,
     explain:{bio:'Limestone is calcium carbonate, which neutralizes acid like an antacid tablet. Granite has almost nothing to neutralize acid, so Granite Lake’s pH falls below 5 and its trout die off.',
              ap:'Limestone Lake has huge acid-neutralizing capacity (about 1,500 µeq/L of bicarbonate), resupplied by CaCO₃ dissolving. Granite Lake starts near 55 µeq/L; once its watershed soils lose their base cations, ANC goes negative and pH drops below 4.5.'}},
    {lvl:'bio',q:'By year 15 Granite Lake is acidic and the trout are gone. Then the plant installs scrubbers. What happens over the next 12 years?',
     choices:['The lake’s pH rises and trout start to come back','Nothing changes; the damage is permanent','The lake gets even more acidic'],correct:0,
     change:{scrub:true},changeText:'Scrubbers installed',watch:'gph',at:15,reveal:28,
     explain:{bio:'Scrubbers remove most of the sulfur dioxide before it leaves the smokestack, so the rain is much less acidic. The lake recovers, but the fish take years to return.',
              honors:'Scrubbers cut SO₂ by about 95%. Rain pH rises from about 4.1 toward 4.8 and the lake climbs back above pH 6, but trout populations rebuild slowly.',
              ap:'Lake pH recovers within a few years, but soil base saturation (see “Soil buffering left”) rebuilds only slowly through weathering. That is why many Adirondack lakes took decades to recover after the 1990 Clean Air Act.'}},
    {lvl:'honors',q:'Rain at pH 4 is how many times more acidic than rain at pH 5?',
     choices:['1.25 times','2 times','10 times','100 times'],correct:2,instant:true,
     explain:'pH is a logarithmic scale. Each step of 1 pH unit is a 10× change in H⁺ concentration, so pH 4 has 10 times more H⁺ than pH 5, and 100 times more than pH 6. Try diluting a rain sample 10× and watch the pH rise by 1.'},
    {lvl:'honors',q:'At year 10 the plant switches from high-sulfur to low-sulfur coal (no scrubbers). By year 20, compared with keeping high-sulfur coal, Granite Lake is…',
     choices:['Less acidic (higher pH)','More acidic (lower pH)','Exactly the same'],correct:0,
     change:{sulfur:'low'},changeText:'Switched to low-sulfur coal',watch:'gph',at:10,reveal:20,
     explain:{honors:'Low-sulfur coal cuts SO₂ by about 70%, so Granite Lake climbs back to around pH 5.7, compared with about 4.2 if the plant had kept burning high-sulfur coal.',
              ap:'Low-sulfur coal alone is only a partial fix: the lake recovers to about pH 5.7, then slowly drifts back down as the remaining acid keeps draining soil base cations. Combine it with scrubbers to see a lasting recovery.'}},
    {lvl:'honors',q:'You dilute a pH 4.0 rain sample 100 times with pure water. What is the new pH?',
     choices:['pH 4.01','pH 5.0','pH 6.0','pH 14'],correct:2,instant:true,
     explain:'Each 10× dilution raises pH by 1, so 100× (two 10× steps) takes pH 4 to pH 6. (Dilution can’t push it past neutral, pH 7.)'},
    {lvl:'ap',q:'At year 20 you dump limestone into Granite Lake, but the plant keeps running with no controls. What happens by year 32?',
     choices:['pH jumps up, then falls back as acid keeps arriving','pH stays high for good','pH falls immediately'],correct:0,
     baselineAction:null,changeAction:'lime',changeText:'Limestone added to Granite Lake',watch:'gph',at:20,reveal:32,
     explain:'Liming treats the symptom. The CaCO₃ neutralizes the acid already in the lake, but water flushes through in a couple of years and new acid keeps arriving, so the lake re-acidifies. Only cutting emissions fixes the cause.'},
    {lvl:'ap',q:'Why doesn’t Limestone Lake acidify?',
     choices:['Limestone absorbs rainwater before it reaches the lake','CaCO₃ neutralizes acid: CaCO₃ + 2H⁺ → Ca²⁺ + CO₂ + H₂O','Limestone lakes are too cold for acid to form'],correct:1,instant:true,
     explain:'Dissolving carbonate rock consumes H⁺ and adds bicarbonate (acid-neutralizing capacity). This is the same chemistry scrubbers use: limestone slurry captures SO₂ as calcium sulfate (gypsum).'}
  ],
  initVis(sim){const r=rng(9),v=sim.vis;v.plume=[];v.drops=[];v.fish=[];for(let i=0;i<10;i++)v.fish.push({lake:0,x:270+r()*200,y:350+r()*35,vx:(r()<.5?-1:1)*(10+r()*12)});for(let i=0;i<8;i++)v.fish.push({lake:1,x:560+r()*200,y:350+r()*35,vx:(r()<.5?-1:1)*(10+r()*12)});
    v.speck=[];for(let i=0;i<70;i++)v.speck.push([235+r()*265,395+r()*55,r()]);v.acc={p:0,d:0};},
  draw(sim,ctx,vdt,k,t){
    const s=sim.st,p=sim.p,v=sim.vis,hon=atLeast('honors'),ap=atLeast('ap');
    const rph=ACID.rainPH(sim),gph=phFromANC(s.g),lph=phFromANC(s.l);
    const sky=ctx.createLinearGradient(0,0,0,320);sky.addColorStop(0,'#8fb8de');sky.addColorStop(1,'#d8e8f2');ctx.fillStyle=sky;ctx.fillRect(0,0,800,330);
    // hills
    ctx.fillStyle='#7d9a6a';ctx.beginPath();ctx.moveTo(0,310);ctx.quadraticCurveTo(140,240,300,300);ctx.quadraticCurveTo(470,230,640,290);ctx.quadraticCurveTo(720,250,800,280);ctx.lineTo(800,340);ctx.lineTo(0,340);ctx.closePath();ctx.fill();
    // bedrock bands
    ctx.fillStyle='#8a8d92';ctx.fillRect(220,335,300,115);ctx.fillStyle='#d8c39a';ctx.fillRect(520,335,280,115);
    ctx.fillStyle='#6b6e73';v.speck.forEach(q=>{ctx.fillRect(q[0],q[1],2+q[2]*2,2);});
    ctx.strokeStyle='#b9a27a';ctx.lineWidth=2;for(let y=350;y<450;y+=14){ctx.beginPath();ctx.moveTo(520,y);ctx.lineTo(800,y+3);ctx.stroke();}
    ctx.fillStyle='#6a7b55';ctx.fillRect(0,335,220,115);
    // lakes (water tinted slightly by pH; acid lakes turn eerily clear)
    const lake=(x,w,ph)=>{ctx.fillStyle='#3d78b8';ctx.beginPath();ctx.ellipse(x+w/2,362,w/2,34,0,0,6.29);ctx.fill();ctx.fillStyle=phColor(ph,0.35);ctx.beginPath();ctx.ellipse(x+w/2,362,w/2,34,0,0,6.29);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x+w/2,356,w/2-14,6,0,3.4,6);ctx.stroke();};
    lake(250,240,gph);lake(545,230,lph);
    // fish
    const nG=Math.round(s.fish/10);let gi=0;
    v.fish.forEach(f=>{if(f.lake===0){gi++;if(gi>nG)return;}const x0=f.lake?560:262,x1=f.lake?760:478;f.x+=f.vx*vdt;if(f.x<x0||f.x>x1)f.vx*=-1;f.x=clamp(f.x,x0,x1);
      ctx.fillStyle=f.lake?'#e7a84b':'#d98a3c';ctx.beginPath();ctx.ellipse(f.x,f.y,9,4,0,0,6.29);ctx.fill();const d=f.vx>0?-1:1;ctx.beginPath();ctx.moveTo(f.x+d*8,f.y);ctx.lineTo(f.x+d*14,f.y-4);ctx.lineTo(f.x+d*14,f.y+4);ctx.closePath();ctx.fill();});
    // power plant
    ctx.fillStyle='#5f646b';ctx.fillRect(30,230,120,80);ctx.fillRect(112,110,22,122);ctx.fillStyle='#3d4147';ctx.fillRect(40,250,30,60);
    ctx.fillStyle='#2b2b2b';ctx.beginPath();ctx.moveTo(150,310);ctx.lineTo(180,282);ctx.lineTo(212,310);ctx.closePath();ctx.fill();
    if(p.scrub){ctx.fillStyle='#d6dde4';rr(ctx,100,160,46,34,5);ctx.fill();ctx.strokeStyle='#5f646b';ctx.lineWidth=1.5;rr(ctx,100,160,46,34,5);ctx.stroke();txt(ctx,'Scrubber',123,181,{s:10.5*k,w:700,c:'#2a2f36',a:'center'});}
    txt(ctx,'Coal power plant',90,326,{s:11.5*k,w:700,c:'#fff',a:'center'});
    // plume of SO₂ (yellow) and NOx (brown), rate ∝ emissions
    v.acc.p+=vdt*(s.so2*0.35+s.nox*0.18);while(v.acc.p>=1){v.acc.p--;const isS=Math.random()<s.so2/(s.so2+0.5*s.nox+1e-9);v.plume.push({x:123,y:108,vx:30+Math.random()*25,vy:-6-Math.random()*8,life:6,s:isS});}
    v.plume.forEach(q=>{q.x+=q.vx*vdt;q.y+=q.vy*vdt;q.vy+=(70-q.y)*0.4*vdt;q.life-=vdt;ctx.fillStyle=q.s?'rgba(225,190,40,'+clamp(q.life/3,0,1)*0.9+')':'rgba(150,90,40,'+clamp(q.life/3,0,1)*0.8+')';ctx.beginPath();ctx.arc(q.x,q.y,2.8,0,6.29);ctx.fill();});
    v.plume=v.plume.filter(q=>q.life>0&&q.x<800);if(v.plume.length>220)v.plume.splice(0,v.plume.length-220);
    // smoke
    if(p.coal>0){ctx.fillStyle='rgba(140,140,140,'+(p.scrub?0.15:0.35)*p.coal/100+')';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(130+i*22+(t*14%22),98-i*5,10+i*4,0,6.29);ctx.fill();}}
    // clouds (grayer when more acid)
    const cg=Math.round(250-clamp(s.D/70,0,1)*60);ctx.fillStyle='rgb('+cg+','+cg+','+(cg+4)+')';
    [[430,70,1],[640,58,1.15]].forEach(c=>{for(const o of [[-40,6,26],[-12,-8,32],[20,-4,30],[48,8,24],[0,12,30]]){ctx.beginPath();ctx.arc(c[0]+o[0]*c[2],c[1]+o[1]*c[2],o[2]*c[2],0,6.29);ctx.fill();}});
    if(hon){pill(ctx,'SO₂ + H₂O → sulfuric acid',430,112,'rgba(40,40,50,.75)','#fff',10.5*k);pill(ctx,'NOx + H₂O → nitric acid',640,104,'rgba(40,40,50,.75)','#fff',10.5*k);}
    // rain colored by rain pH
    v.acc.d+=vdt*40;while(v.acc.d>=1){v.acc.d--;const x=360+Math.random()*380;v.drops.push({x,y:95,vy:160+Math.random()*60});}
    ctx.strokeStyle=phColor(rph,0.85);ctx.lineWidth=2;ctx.beginPath();v.drops.forEach(d=>{d.y+=d.vy*vdt;d.x-=12*vdt;ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-2,d.y+8);});ctx.stroke();
    v.drops=v.drops.filter(d=>d.y<345);if(v.drops.length>200)v.drops.splice(0,v.drops.length-200);
    // pH meters
    const meter=(x,label,ph)=>{ctx.fillStyle='rgba(20,24,32,.82)';rr(ctx,x-62,262,124,40,7);ctx.fill();ctx.fillStyle=phColor(ph);rr(ctx,x-56,268,12,28,3);ctx.fill();
      txt(ctx,label,x+6,279,{s:10.5*k,w:600,c:'#dfe6ee',a:'center'});txt(ctx,'pH '+ph.toFixed(1),x+6,296,{s:14*k,w:800,c:'#fff',a:'center'});};
    meter(370,'Granite Lake',gph);meter(660,'Limestone Lake',lph);
    txt(ctx,'Granite (little buffering)',370,440,{s:11*k,w:700,c:'#fff',a:'center'});txt(ctx,'Limestone (CaCO₃)',660,440,{s:11*k,w:700,c:'#4a3b1e',a:'center'});
    if(ap)pill(ctx,'CaCO₃ + 2H⁺ → Ca²⁺ + CO₂ + H₂O',660,412,'rgba(255,255,255,.85)','#4a3b1e',10.5*k);
    if(s.limed>0)pill(ctx,'Limestone added',370,412,'rgba(255,255,255,.9)','#4a3b1e',11*k);
    // rain pH badge + year
    const rl='Rain pH '+rph.toFixed(2)+(rph<5.6?' (acid rain)':' (normal)');ctx.font='700 '+12*k+'px '+FONT;const rw=ctx.measureText(rl).width+34,rx=792-rw;
    ctx.fillStyle='rgba(20,24,32,.82)';rr(ctx,rx,8,rw,32,7);ctx.fill();ctx.fillStyle=phColor(rph);rr(ctx,rx+7,14,12,20,3);ctx.fill();txt(ctx,rl,rx+26,29,{s:12*k,w:700,c:'#fff'});
    ctx.fillStyle='rgba(20,24,32,.82)';rr(ctx,8,8,170,32,7);ctx.fill();txt(ctx,'Year '+Math.floor(sim.t),18,30,{s:15*k,w:800,c:'#fff'});
    // dilution series (honors)
    if(hon){const bx=10,by=360;ctx.fillStyle='rgba(255,255,255,.88)';rr(ctx,bx,by-14,205,92,8);ctx.fill();txt(ctx,'Dilution lab: rain sample',bx+102,by+2,{s:10.5*k,w:700,c:'#2a2f36',a:'center'});
      ['1×','10×','100×','1000×','10⁴×'].forEach((lab,i)=>{const x=bx+20+i*40,ph=Math.min(7,rph+i),on=i===s.dil;ctx.fillStyle=phColor(ph);rr(ctx,x-7,by+10,14,38,6);ctx.fill();ctx.strokeStyle=on?'#C11430':'#7a828c';ctx.lineWidth=on?3:1.2;rr(ctx,x-7,by+10,14,38,6);ctx.stroke();
        txt(ctx,lab,x,by+60,{s:9.5*k,c:'#2a2f36',a:'center',w:on?800:400});txt(ctx,ph.toFixed(1),x,by+72,{s:9.5*k,c:'#2a2f36',a:'center'});});}
  },
  narrate(sim){const s=sim.st,p=sim.p,rph=ACID.rainPH(sim),gph=phFromANC(s.g),hon=atLeast('honors');
    if(p.coal<5&&p.cars<20)return '<b>Almost no emissions.</b> Rain is close to its natural pH of about 5.6 (slightly acidic from CO₂), and the lakes slowly recover.';
    if(s.limed>0)return '<b>Limestone dumped into Granite Lake</b> neutralizes the acid already there. But the acid rain hasn’t stopped, so watch what happens over the next few years.';
    if(gph<5)return '<b>Granite Lake has dropped below pH 5.</b> Trout eggs can’t hatch and adult fish die. Limestone Lake is fine at pH '+phFromANC(s.l).toFixed(1)+', because its rock neutralizes acid.';
    if(p.scrub&&gph<6)return '<b>Scrubbers are removing most of the SO₂.</b> The rain is cleaner, and Granite Lake is slowly recovering'+(hon?', although its soils are still depleted':'')+'.';
    if(rph<5)return 'The plant’s SO₂ and NOx turn into sulfuric and nitric acid in clouds. The rain has a pH of '+rph.toFixed(1)+', about '+Math.round((2.5+s.D)/2.5)+' times more acidic than clean rain.';
    return 'Rain pH is '+rph.toFixed(1)+'. Granite Lake is at pH '+gph.toFixed(1)+', and Limestone Lake is at pH '+phFromANC(s.l).toFixed(1)+'.';},
  tour:[
    {title:'Burning coal',text:'Coal contains sulfur. When it burns, the sulfur becomes sulfur dioxide (SO₂, yellow dots) and the hot fire also makes nitrogen oxides (NOx, brown dots).',focus:[20,90,200,230],speed:0.5},
    {title:'Into the clouds',text:'Wind carries the gases hundreds of kilometers. In clouds they react with water to form sulfuric and nitric acid.',focus:[170,30,620,110],speed:0.5},
    {title:'Acid rain',text:'Normal rain is slightly acidic (pH about 5.6) because of carbon dioxide. Rain below 5.6 is acid rain. The color of the raindrops shows their pH.',focus:[340,90,420,250],speed:0.5},
    {title:'Granite Lake',text:'Granite has almost nothing to neutralize acid. Over the years the soils run out of buffering, the lake’s pH falls, and the trout disappear.',focus:[235,255,270,140],speed:4},
    {title:'Limestone Lake',text:'Limestone is calcium carbonate. It neutralizes acid like an antacid tablet, so this lake stays healthy even in the same rain.',focus:[530,255,265,140],speed:4},
    {title:'Scrubbers',text:'Scrubbers spray a limestone slurry through the smoke and capture about 95% of the SO₂ before it escapes. Watch the rain and Granite Lake recover.',focus:[20,90,200,230],speed:3,setup(sim){BioLab.setValues(sim,{scrub:true});}},
    {lvl:'honors',title:'pH is logarithmic',text:'Each 10× dilution raises pH by exactly 1. So pH 4 rain has 10 times more H⁺ than pH 5 rain, and 100 times more than pH 6.',focus:[8,344,210,96],speed:1,pause:true},
    {lvl:'ap',title:'Buffering chemistry',text:'CaCO₃ + 2H⁺ → Ca²⁺ + CO₂ + H₂O. Carbonate rock consumes H⁺ and adds bicarbonate, the lake’s acid-neutralizing capacity (ANC). Granite watersheds rely on slowly weathered soil cations instead, and those can be used up.',focus:[530,255,265,140],speed:1,pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{scrub:false});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> How does the kind of rock under a lake affect acid rain damage?</p><ol><li>Leave the plant at 100% with no scrubbers.</li><li>Record a trial every 5 years until year 30.</li><li>Plot year against the pH of each lake.</li></ol><p>Explain why the two lakes behave so differently.</p>',
       honors:'<p><b>Question:</b> Which control helps Granite Lake most: scrubbers, low-sulfur coal, or fewer cars?</p><ol><li>Run 15 years with no controls, then turn on one control.</li><li>Record Granite Lake pH and trout at year 30.</li><li>Reset and repeat for each control.</li></ol><p>Use the dilution lab to explain why a change from pH 4.2 to 5.2 is a big deal.</p>',
       ap:'<p><b>Question:</b> Why does recovery lag behind emission cuts?</p><ol><li>Run 20 years with no controls, then turn on scrubbers.</li><li>Graph ANC and soil buffering.</li><li>Compare with adding limestone at year 20 and no emission cuts.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain the difference between treating symptoms (liming) and causes (emission controls), using ANC.</p>'},
  terms:[{t:'Acid rain',d:'Rain with a pH below about 5.6, caused mostly by sulfur and nitrogen oxides.'},{t:'pH',d:'A measure of acidity. Each step of 1 is a 10× change in H⁺ concentration.'},{t:'Scrubber',d:'Equipment that removes SO₂ from smokestack gas, usually with limestone.'},{t:'Buffer',d:'Something that resists pH change, like limestone (calcium carbonate).'},
    {lvl:'honors',t:'Sulfur dioxide (SO₂)',d:'A gas from burning sulfur-containing coal. It becomes sulfuric acid in clouds.'},{lvl:'honors',t:'Nitrogen oxides (NOx)',d:'Gases from hot combustion in engines and power plants. They become nitric acid.'},{lvl:'honors',t:'Logarithmic scale',d:'Each step is a multiple (×10) instead of an addition.'},
    {lvl:'ap',t:'Acid-neutralizing capacity (ANC)',d:'How much acid water can absorb before its pH drops, mostly bicarbonate.'},{lvl:'ap',t:'Base cations',d:'Ca²⁺, Mg²⁺ and similar ions in soil that neutralize acid. Acid rain leaches them away.'},{lvl:'ap',t:'Clean Air Act (1990)',d:'U.S. law that capped SO₂ emissions with a cap-and-trade program, cutting acid rain sharply.'}],
  about:'<p>Rain H⁺ = 2.5 µeq/L (natural, from CO₂) + SO₂ + 0.4 × NOx contributions. Lake water turns over every 2 years. Granite Lake’s inflow ANC depends on a soil buffering pool that acid depletes and weathering slowly restores, so damage and recovery take years. Limestone neutralizes 90% of the acid it receives.</p><p>Lake pH is calculated from ANC with a simple bicarbonate charge balance. Trout survival falls from 100% at pH 6 to zero by about pH 4.6. Numbers are realistic in size for eastern U.S. lakes in the 1970s–2000s, but simplified.</p>'
};
BioLab.register(ACID);
})();
