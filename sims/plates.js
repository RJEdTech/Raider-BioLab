(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,RM}=BioLab.h;

/* Plate tectonics (APES Topic 4.1). Cross-sections run in millions of years; the transform fault runs in years.
   Horizontal scale 0.5 px per km. Heights are stretched about 30× compared with widths and depths. */
const TYPES={
  ridge:{l:'Divergent: mid-ocean ridge',v:2.5,ex:'Real example: the Mid-Atlantic Ridge and Iceland (about 2.5 cm/yr)',deep:15,hz:'Small, shallow quakes; lava erupts on the sea floor'},
  rift:{l:'Divergent: continental rift',v:0.7,ex:'Real example: the East African Rift (about 0.7 cm/yr). The smaller Rio Grande Rift reaches into Colorado.',deep:30,hz:'Shallow quakes; volcanoes along the rift'},
  oc:{l:'Convergent: ocean meets continent',v:6.5,ex:'Real example: the Nazca plate diving under South America: the Andes, Quito and Cotopaxi (about 6.5 cm/yr)',deep:660,hz:'Huge quakes, tsunamis, explosive volcanoes'},
  oo:{l:'Convergent: ocean meets ocean',v:8,ex:'Real example: the Pacific plate diving under Japan: the Japan Trench and Japan’s volcanoes (about 8 cm/yr)',deep:660,hz:'Huge quakes, tsunamis, volcanic islands'},
  cc:{l:'Convergent: continent meets continent',v:4,ex:'Real example: India pushing into Asia: the Himalayas and Mount Everest (about 4 cm/yr)',deep:90,hz:'Big shallow quakes and landslides; no volcanoes'},
  transform:{l:'Transform: plates slide past',v:3.5,ex:'Real example: the San Andreas Fault, California (about 3.5 cm/yr)',deep:15,hz:'Shallow quakes; no volcanoes'}
};
const SPOTS={hawaii:{l:'Ocean: Hawaii',v:8,ex:'The Pacific plate moves northwest over the Hawaiian hot spot, about 8 cm/yr.'},
  yellowstone:{l:'Continent: Yellowstone',v:2.5,ex:'The North American plate moves southwest over the Yellowstone hot spot, about 2.5 cm/yr.'}};
const XZ=0.5,SL=150,EZ=7;            // px per km across; sea-level y; px per km of height
const yE=e=>SL-e*EZ;                  // elevation (km) to y
const yD=z=>SL+30+z*0.38;             // depth below the surface (km) to y, for the interior
const cur=()=>BioLab.sims&&BioLab.sims.plates;
const isTr=s=>!!(s&&s.p&&s.p.view==='boundary'&&s.p.type==='transform');
const gauss=(x,w)=>Math.exp(-(x*x)/(2*w*w));
const mat=(st,full)=>clamp(st.D/full,0,1);

/* geomagnetic polarity through model time: deterministic intervals of 0.15–1.1 Myr */
const POL=(()=>{const r=rng(1977),b=[];let t=-60;while(t<400){b.push(t);t+=0.15+r()*0.95;}return b;})();
function polarity(T){let lo=0,hi=POL.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(POL[m]<=T)lo=m;else hi=m-1;}return lo%2===0;}

/* slab path for subduction: from the trench, angle steepens from 9° to 48° */
function slabPath(xt,yt){const pts=[[xt,yt]];let x=xt,y=yt,s=0;while(y<445&&pts.length<400){const th=(9+39*Math.min(1,s/170))*Math.PI/180;x+=Math.cos(th)*3;y+=Math.sin(th)*3;s+=3;pts.push([x,y]);}return pts;}
function slabXAt(pts,y){for(let i=1;i<pts.length;i++)if(pts[i][1]>=y){const a=pts[i-1],b=pts[i],f=(y-a[1])/(b[1]-a[1]||1);return a[0]+f*(b[0]-a[0]);}return pts[pts.length-1][0];}
function slabYAt(pts,x){for(let i=1;i<pts.length;i++)if(pts[i][0]>=x){const a=pts[i-1],b=pts[i],f=(x-a[0])/(b[0]-a[0]||1);return a[1]+f*(b[1]-a[1]);}return 999;}

/* ---------- elevation profiles (km) for each cross-section ---------- */
function profile(sim,x){const st=sim.st,ty=sim.p.type,d=x-400;
  if(ty==='ridge'){const a=Math.abs(d);return -2.5-2.2*Math.sqrt(Math.min(1,a/360))-(a<7?0.35:0);}
  if(ty==='rift'){const w=riftW(st)/2,a=Math.abs(d);if(a>w+30)return 0.9;if(a>w)return 0.9+((w+30-a)/30)*0.7+volcBump(sim,x);
    const fl=riftFloor(st);return fl+(st.D>140?0.9*gauss(d,10):0);}
  if(ty==='oc'){if(d<-40)return -4.5+0.25*gauss(d+70,25);if(d<0)return lerp(-4.5,-8,(d+40)/40);if(d<40)return lerp(-8,0.6,d/40);
    const m=mat(st,250);return 0.6+(0.4+3.4*m)*gauss(d-125,70);}
  if(ty==='oo'){if(d<-40)return -5;if(d<0)return lerp(-5,-10.5,(d+40)/40);if(d<40)return lerp(-10.5,-4,d/40);return -4;}
  if(ty==='cc'){const m=mat(st,800);return 0.5+(8.35*m)*gauss(d,46+70*m)+0.6*m*gauss(d-110,60);}
  return 0;}
const riftW=st=>30+st.D*XZ*1.1;
const riftFloor=st=>st.D<=140?Math.max(0.15,0.4-st.D/60):-0.5-Math.min(2.5,(st.D-140)/40);
function volcBump(sim,x){return 0;}
function arcH(sim){const m=mat(sim.st,250);return sim.p.type==='oc'?2+3.9*m:sim.p.type==='oo'?-4+6.3*m:0;}
function maxElev(sim){const ty=sim.p.type,st=sim.st;
  if(ty==='oc')return Math.max(0.6+(0.4+3.4*mat(st,250)),arcH(sim));if(ty==='oo')return arcH(sim);
  if(ty==='cc')return 0.5+8.35*mat(st,800);if(ty==='ridge')return -2.5;if(ty==='rift')return rifVolcH(st);return 0;}
const rifVolcH=st=>0.9+clamp(st.D/40,0,4.9);
function minElev(sim){const ty=sim.p.type,st=sim.st;if(ty==='oc')return -8;if(ty==='oo')return -10.5;if(ty==='ridge')return -4.7;if(ty==='rift')return riftFloor(st);if(ty==='cc')return 0.5;return 0;}

/* ---------- state ---------- */
function freshState(){return {D:0,q:[],qn:0,deep:0,mk:0,ufar:0,s:0,thr:4.5,nq:0,last:null,lastT:-1e9,isl:[],nextIsl:0,seed:7};}
function hsp(sim){return SPOTS[sim.p.spot]||SPOTS.hawaii;}
function addQuake(sim,dt){const st=sim.st,ty=sim.p.type,r=Math.random,rate=0.9*sim.p.speed;if(r()>rate*dt*6)return;
  let x,z;
  if(ty==='ridge'){x=400+(r()-0.5)*14;z=2+r()*12;}
  else if(ty==='rift'){const w=riftW(st)/2;x=400+(r()<0.5?-1:1)*w*(0.6+0.5*r());z=3+r()*25;}
  else if(ty==='cc'){x=400+(r()-0.5)*(110+120*mat(st,800));z=5+Math.pow(r(),1.6)*85;}
  else{z=Math.pow(r(),1.7)*660;const pts=sim.vis.slab;const y=yD(z)+6;x=pts?slabXAt(pts,Math.max(y,pts[0][1]+2)):400;if(z<40)x=400+(r()*60)-10;}
  st.q.push({x,z,t:sim.t});st.qn++;if(st.q.length>60)st.q.shift();st.deep=Math.max(...st.q.map(o=>o.z));}

/* ---------- the tool ---------- */
const PLATES={
  id:'plates',hash:'plates',apUnit:12,order:0,kind:'Simulation',tab:'Plate tectonics',
  card:'Pull plates apart, crash them together and slide them past each other. See where mountains, trenches, volcanoes and earthquakes come from.',
  title:'Plate tectonics: boundaries, earthquakes and volcanoes',
  lede:{bio:'Earth’s outer shell is broken into plates that ride on hot, slowly flowing rock. Where plates pull apart, crash together or slide past each other, they build mountains, open oceans, and set off earthquakes and volcanoes.',
        honors:'Follow the evidence: magnetic stripes on the sea floor, earthquakes that get deeper under a continent, and island chains that get older away from a hot spot.',
        ap:'Measure plate speeds from magnetic stripes and island ages, and see why a locked fault releases centuries of motion in one earthquake.'},
  scale:{bio:'Not to scale: heights are stretched about 30 times compared with widths and depths. Across the picture is about 1,600 km.'},
  get timeScale(){return isTr(cur())?40:0.5;},
  get dtMax(){return isTr(cur())?2:0.05;},
  get window(){return isTr(cur())?1200:30;},
  get sampleDt(){return isTr(cur())?2:0.1;},
  get unit(){return isTr(cur())?'years':'million years';},
  prewarm:0,chChange:3,chReveal:8,
  clock(sim){return isTr(sim)?'Year '+Math.floor(sim.t):(sim.t<10?sim.t.toFixed(1):Math.floor(sim.t))+' million years';},
  controls:[
    {id:'view',label:'View',type:'seg',def:'boundary',lvl:'bio',noTrial:true,options:[{v:'boundary',l:'Plate boundaries'},{v:'hotspot',l:'Hot spots'}],onChange(sim){BioLab.reset(sim);sync(sim);}},
    {id:'type',label:'Boundary',type:'select',def:'oc',lvl:'bio',modes:['boundary'],options:Object.entries(TYPES).map(([v,o])=>({v,l:o.l})),onChange(sim){BioLab.reset(sim);sync(sim);}},
    {id:'spot',label:'Hot spot',type:'seg',def:'hawaii',lvl:'bio',modes:['hotspot'],options:Object.entries(SPOTS).map(([v,o])=>({v,l:o.l})),onChange(sim){BioLab.reset(sim);}},
    {id:'speed',label:'Plate speed',type:'range',min:0.5,max:12,step:0.1,def:6.5,unit:' cm/yr',lvl:'bio',help:'How fast the plates move compared with each other. Your fingernails grow about 3–4 cm a year.'},
    {id:'stripes',label:'Magnetic stripes',type:'toggle',def:false,lvl:'honors',modes:['boundary'],types:['ridge','rift'],help:'Lava records the direction of Earth’s magnetic field as it cools. The field flips every few hundred thousand years.'},
    {id:'convect',label:'Show mantle convection',type:'toggle',def:true,lvl:'bio',modes:['boundary','hotspot'],noTrial:true}
  ],
  actions:[
    {id:'real',label:'Use the real speed',run(sim){BioLab.setValues(sim,{speed:sim.p.view==='hotspot'?hsp(sim).v:TYPES[sim.p.type].v});}}
  ],
  init(sim){return freshState();},
  step(sim,dt){const st=sim.st,p=sim.p;
    if(p.view==='hotspot'){st.D+=p.speed*10*dt;const ye=p.spot==='yellowstone',every=ye?1.4:1.0;
      if(sim.t>=st.nextIsl){st.isl.push({born:sim.t});st.nextIsl=sim.t+every;if(st.isl.length>40)st.isl.shift();}return;}
    if(p.type==='transform'){st.ufar+=p.speed/100*dt;const def=st.ufar-st.s;
      if(def>=st.thr){const slip=def;st.s=st.ufar;st.nq++;const M=2/3*Math.log10(3.15e19*slip*slip)-6.07;
        st.last={t:sim.t,slip,M,y:90+Math.random()*300,since:st.lastT>-1e8?sim.t-st.lastT:null};st.lastT=sim.t;
        const r=rng(st.seed=(st.seed*16807+3)%2147483647);st.thr=3+r()*3;}
      return;}
    st.D+=p.speed*10*dt;addQuake(sim,dt);},
  metrics:[
    {id:'moved',label:'Plates moved so far',unit:'km',lvl:'bio',min:0,max:1500,d:0,modes:['boundary'],notr:true,get:s=>isTr(s)?NaN:s.st.D},
    {id:'high',label:'Highest point',unit:'km above sea level',lvl:'bio',min:-6,max:9,d:1,modes:['boundary'],notr:true,get:s=>isTr(s)?NaN:maxElev(s)},
    {id:'low',label:'Deepest point',unit:'km below sea level',lvl:'bio',min:0,max:11,d:1,modes:['boundary'],notr:true,get:s=>isTr(s)?NaN:Math.max(0,-minElev(s))},
    {id:'deep',label:'Deepest earthquake so far',unit:'km down',lvl:'bio',min:0,max:700,d:0,modes:['boundary'],notr:true,get:s=>isTr(s)?NaN:s.st.deep},
    {id:'hz',label:'Hazards here',unit:'',lvl:'bio',text:true,modes:['boundary'],notr:true,get:s=>TYPES[s.p.type].hz},
    {id:'offset',label:'Road offset by the fault',unit:'m',lvl:'bio',min:0,max:60,d:1,modes:['boundary'],tr:true,get:s=>isTr(s)?s.st.s:NaN},
    {id:'nq',label:'Big earthquakes',unit:'',lvl:'bio',min:0,max:12,d:0,modes:['boundary'],tr:true,get:s=>isTr(s)?s.st.nq:NaN},
    {id:'strain',label:'Stored-up slip (strain)',unit:'m',lvl:'honors',min:0,max:6,d:2,modes:['boundary'],tr:true,get:s=>isTr(s)?s.st.ufar-s.st.s:NaN},
    {id:'lastm',label:'Last earthquake',unit:'',lvl:'bio',text:true,modes:['boundary'],tr:true,get:s=>{const L=s.st.last;return L?'M'+L.M.toFixed(1)+', slipped '+L.slip.toFixed(1)+' m':'none yet: the fault is locked';}},
    {id:'gap',label:'Years between the last two',unit:'years',lvl:'honors',min:0,max:400,d:0,modes:['boundary'],tr:true,get:s=>s.st.last&&s.st.last.since?s.st.last.since:NaN},
    {id:'nisl',label:'Volcanoes formed',unit:'',lvl:'bio',min:0,max:40,d:0,modes:['hotspot'],get:s=>s.p.view==='hotspot'?s.st.isl.length:NaN},
    {id:'oldest',label:'Oldest volcano: age',unit:'million years',lvl:'bio',min:0,max:40,d:1,modes:['hotspot'],get:s=>{const o=oldest(s);return o?o.age:NaN;}},
    {id:'odist',label:'Oldest volcano: distance from the hot spot',unit:'km',lvl:'bio',min:0,max:1500,d:0,modes:['hotspot'],get:s=>{const o=oldest(s);return o?o.dist:NaN;}},
    {id:'calc',label:'Speed from distance ÷ age',unit:'cm/yr',lvl:'honors',min:0,max:12,d:1,modes:['hotspot'],get:s=>{const o=oldest(s);return o&&o.age>0.5?o.dist/o.age/10:NaN;}}
  ],
  graphs:[{id:'high',label:'Highest point',lines:['high'],modes:['boundary'],notr:true},{id:'low',label:'Deepest point',lines:['low'],modes:['boundary'],notr:true},{id:'moved',label:'Plates moved so far',lines:['moved'],modes:['boundary'],notr:true},
    {id:'offset',label:'Road offset (stair steps = earthquakes)',lines:['offset'],modes:['boundary'],tr:true},{id:'strain',label:'Stored-up slip (strain)',lvl:'honors',lines:['strain'],modes:['boundary'],tr:true},
    {id:'odist',label:'Distance of the oldest volcano',lines:['odist'],modes:['hotspot']}],
  defaultGraph:'high',
  challenges:[
    {lvl:'bio',instant:true,q:'At a mid-ocean ridge, where is the youngest rock on the sea floor?',choices:['Right at the ridge','Farthest from the ridge','It is all the same age'],correct:0,
     explain:'New crust forms where magma rises at the ridge, then moves away on both sides as the plates spread. So the youngest rock is at the ridge and it gets older with distance, the same on both sides.'},
    {lvl:'bio',instant:true,q:'Which kind of boundary makes the deepest earthquakes, some more than 600 km down?',choices:['Ocean plate diving under another plate (subduction)','Mid-ocean ridge','Transform fault'],correct:0,
     explain:'Only subduction carries cold, brittle plate deep into the mantle. Earthquakes happen along the sinking slab, so they get deeper the farther you go inland from the trench. Ridges and transform faults only make shallow quakes.'},
    {lvl:'bio',instant:true,q:'India is crashing into Asia. Why are there no big volcanoes in the Himalayas, when the Andes are full of them?',choices:['Continental crust is too light to sink, so no plate dives down and melts','The Himalayas are too cold for volcanoes','The plates are moving too slowly'],correct:0,
     explain:'At the Andes a dense ocean plate sinks; about 100 km down, water from it melts the rock above and the magma rises into volcanoes. Continents are too thick and light to sink, so they crumple and pile up into high mountains instead, with no sinking slab to make magma.'},
    {lvl:'bio',q:'On the San Andreas Fault, the plates keep moving, but the fault stays stuck between earthquakes. What happens to the road across the fault while it is stuck?',
     choices:['It bends more and more, then snaps into a sudden offset in an earthquake','It slides apart smoothly a little each year','Nothing happens until the plates start moving'],correct:0,baseline:{view:'boundary',type:'transform',speed:3.5},watch:'strain',at:1,reveal:150,
     explain:'The rock on both sides keeps moving, but the fault is locked by friction, so the ground near it bends and stores up strain. When the strain beats the friction, the fault slips several meters at once: an earthquake. Scientists call this elastic rebound.'},
    {lvl:'honors',q:'Double the plate speed on the San Andreas. What happens to the time between big earthquakes?',choices:['It gets about twice as short','It gets about twice as long','It stays the same'],correct:0,
     baseline:{view:'boundary',type:'transform',speed:3.5},change:{speed:7},changeText:'Plate speed doubled to 7 cm/yr',watch:'offset',at:10,reveal:400,
     explain:'Each earthquake releases the slip stored since the last one, a few meters. Moving twice as fast stores that slip in half the time, so quakes come about twice as often. The offset graph climbs in steps twice as frequent.'},
    {lvl:'honors',instant:true,q:'On both sides of a mid-ocean ridge, the sea floor has stripes of rock magnetized in opposite directions, and the pattern on one side is a mirror image of the other. What does that show?',choices:['New sea floor forms at the ridge and spreads out on both sides while Earth’s magnetic field flips','The ridge is a giant magnet','Earthquakes magnetize the rock'],correct:0,
     explain:'Lava records the direction of Earth’s field as it cools. Each flip of the field starts a new stripe at the ridge, and spreading carries the older stripes away on both sides at the same rate, so the two sides mirror each other. This was key evidence for sea-floor spreading in the 1960s.'},
    {lvl:'honors',instant:true,q:'The Hawaiian islands get older toward the northwest: the Big Island is under 1 million years old and Kauai is about 5 million. Which way is the Pacific plate moving?',choices:['Northwest, carrying older islands away from the hot spot','Southeast','It isn’t moving; the hot spot is'],correct:0,
     explain:'The hot spot stays put deep in the mantle. Each volcano forms over it, then rides the plate away. Older islands sit farther northwest, so the plate is carrying them northwest.'},
    {lvl:'ap',instant:true,q:'A volcano now 400 km from the Hawaiian hot spot formed over it 5.0 million years ago. How fast is the plate moving?',choices:['8 cm/yr','80 cm/yr','0.8 cm/yr','2 cm/yr'],correct:0,
     explain:'400 km = 40,000,000 cm, and 40,000,000 cm ÷ 5,000,000 yr = 8 cm/yr. Shortcut: km per million years ÷ 10 = cm per year.'},
    {lvl:'ap',instant:true,q:'A fault is locked while the plates move 3.5 cm/yr past each other. Its earthquakes usually slip about 4.5 m. About how often do big earthquakes happen?',choices:['About every 130 years','About every 13 years','About every 1,300 years','About every 4.5 years'],correct:0,
     explain:'4.5 m = 450 cm, and 450 cm ÷ 3.5 cm/yr ≈ 130 years. That is close to the average for the southern San Andreas, which last broke in a giant quake in 1857.'}
  ],
  initVis(sim){sim.vis.slab=null;if(sim.p.view==='boundary'&&(sim.p.type==='oc'||sim.p.type==='oo')){const yt=yE(sim.p.type==='oc'?-8:-10.5);sim.vis.slab=slabPath(400,yt);}sync(sim);},
  onLevel(sim){sync(sim);},
  onTourExit(sim){BioLab.setValues(sim,{view:'boundary',type:'oc',speed:6.5});},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(sim.p.view==='hotspot')drawHot(sim,ctx,k,t);else if(sim.p.type==='transform')drawTransform(sim,ctx,k,t);else drawCross(sim,ctx,k,t);},
  narrate(sim){const p=sim.p,st=sim.st;
    if(p.view==='hotspot'){const o=oldest(sim);return (p.spot==='yellowstone'?'The <b>hot spot stays put</b> while the North American plate drifts southwest over it, leaving a trail of old volcanic craters across Idaho.':'The <b>hot spot stays put</b> deep in the mantle while the plate moves over it. Each volcano forms over the hot spot, then rides away, cools, wears down and sinks.')+(o&&o.age>1?' The oldest one here is <b>'+o.age.toFixed(1)+' million years old</b> and <b>'+Math.round(o.dist)+' km</b> away.':'');}
    const ty=p.type;
    if(ty==='transform'){const L=st.last,def=st.ufar-st.s;if(L&&sim.t-L.t<25)return '<b>Earthquake!</b> The fault slipped <b>'+L.slip.toFixed(1)+' m</b> in seconds (magnitude '+L.M.toFixed(1)+'). The bent road snapped back straight, now offset.';
      return 'The plates keep sliding at '+p.speed.toFixed(1)+' cm/yr, but friction holds the fault <b>locked</b>. The road near the fault bends as strain builds: <b>'+def.toFixed(1)+' m</b> stored so far.';}
    if(ty==='ridge')return 'The plates pull apart. Hot rock rises under the ridge, melts and fills the gap with <b>new sea floor</b>, which then moves away on both sides. Only small, shallow earthquakes happen here.';
    if(ty==='rift')return st.D>140?'The rift has opened so far that the <b>sea has flooded in</b>: a new ocean is being born, like the Red Sea.':'A continent is being <b>pulled apart</b>. The middle drops into a long rift valley, with volcanoes and shallow earthquakes. Keep it running to see what happens next.';
    if(ty==='oc')return 'The <b>dense ocean plate dives under the lighter continent</b>, making a deep trench. About 100 km down, water from the sinking plate melts the rock above it, and magma rises into a chain of <b>volcanoes</b>. Earthquakes happen along the sinking slab, deeper and deeper inland.';
    if(ty==='oo')return 'One ocean plate (the older, denser one) dives under the other, making the deepest trenches on Earth. Magma from the sinking plate builds volcanoes that rise from the sea floor into an <b>island arc</b>, like Japan.';
    return 'Two continents collide. Neither is dense enough to sink, so the crust <b>crumples and stacks up</b> into high mountains with deep roots. Big, shallow earthquakes, but no volcanoes.';},
  tour:[
    {title:'Plates ride on a slowly flowing mantle',text:'Earth’s rigid outer shell, the lithosphere, is broken into plates. Under them, the hot asthenosphere flows very slowly in convection currents, about as fast as your fingernails grow.',pause:false,speed:1,setup(sim){BioLab.setValues(sim,{view:'boundary',type:'ridge',speed:2.5,convect:true});}},
    {title:'Pulling apart: new sea floor',text:'At a mid-ocean ridge, rising hot rock melts and fills the gap with new crust. The youngest sea floor is at the ridge; it gets older on both sides.',speed:1},
    {title:'Crashing together: subduction',text:'Where a dense ocean plate meets a continent, the ocean plate dives under. A deep trench forms offshore, and magma from the sinking plate builds volcanoes inland, like the Andes.',speed:1,setup(sim){BioLab.setValues(sim,{type:'oc',speed:6.5});}},
    {title:'Continents collide',text:'Continents are too light to sink, so they crumple into high mountains. India is still pushing into Asia, so the Himalayas are still rising.',speed:2,setup(sim){BioLab.setValues(sim,{type:'cc',speed:4});}},
    {title:'Sliding past: earthquakes',text:'At a transform fault the plates slide past each other. The fault sticks, strain builds, and then it slips all at once in an earthquake.',speed:1,setup(sim){BioLab.setValues(sim,{type:'transform',speed:3.5});}}
  ],
  lab:{bio:'<p><b>Question:</b> What landforms and hazards does each kind of plate boundary make?</p><ol><li>Run each boundary type for 10 million years at its real speed (press <b>Use the real speed</b>).</li><li>Record the highest point, the deepest point, the deepest earthquake and the hazards for each.</li></ol><p>Make a table. Which boundary would you least want to live next to, and why?</p>',
       honors:'<p><b>Question:</b> How does plate speed change how fast a mountain range or trench forms?</p><ol><li>Choose continent meets continent. Run 10 million years at 2, 4 and 8 cm/yr.</li><li>Record the highest point each time.</li><li>Then turn on magnetic stripes at a mid-ocean ridge and sketch the stripe pattern at two speeds.</li></ol><p>Explain why faster spreading makes wider stripes.</p>',
       ap:'<p><b>Question:</b> Can you measure plate speed from the rocks?</p><ol><li>In Hot spots, run Hawaii and record the age and distance of the oldest volcano at three times. Calculate speed = distance ÷ age.</li><li>On the transform fault, record the years between big earthquakes at 2, 3.5 and 7 cm/yr.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain how the time between earthquakes depends on plate speed.</p>'},
  terms:[{t:'Plate',d:'A rigid slab of Earth’s outer shell (the lithosphere) that moves as one piece.'},{t:'Divergent boundary',d:'Where plates move apart: mid-ocean ridges and rift valleys.'},{t:'Convergent boundary',d:'Where plates move together: subduction zones and collision mountains.'},
    {t:'Transform boundary',d:'Where plates slide past each other sideways, like the San Andreas Fault.'},{t:'Subduction',d:'One plate sinking under another into the mantle.'},{t:'Trench',d:'The deep, narrow valley in the sea floor where a plate starts to sink.'},
    {t:'Mantle convection',d:'Hot rock in the mantle slowly rising, spreading and sinking, which helps move the plates.'},{t:'Hot spot',d:'A fixed plume of hot rock rising from deep in the mantle that makes volcanoes on the plate above it.'},
    {lvl:'honors',t:'Magnetic stripes',d:'Bands of sea-floor rock magnetized in opposite directions, made as Earth’s magnetic field flips while new crust forms.'},{lvl:'honors',t:'Island arc',d:'A curved chain of volcanic islands above an ocean–ocean subduction zone, like Japan.'},
    {lvl:'ap',t:'Elastic rebound',d:'Rock bends while a fault is locked, then snaps back when the fault slips: the cause of earthquakes.'},{lvl:'ap',t:'Wadati–Benioff zone',d:'The band of earthquakes that follows a sinking slab, deeper and deeper under the overriding plate.'}],
  about:'<p><b>Model:</b> each cross-section is drawn from simple elevation profiles that grow with the total plate motion D = speed × time (1 cm/yr for 1 million years = 10 km). Mountains approach real heights (Himalayas about 8.8 km, Andes volcanoes about 6 km); trenches use real depths (Peru–Chile about 8 km, Japan and Mariana 8–11 km).</p><p><b>Earthquakes</b> are placed at random in the zones where they really happen: shallow at ridges, rifts and transform faults; along the sinking slab down to about 660 km at subduction zones; shallow to about 90 km under the Himalayas.</p><p><b>Transform fault:</b> the far-field plates move steadily; the fault is locked until the stored slip passes a threshold of 3–6 m, then it slips all at once. Magnitude uses M₀ = μAD with rupture length 70 km per meter of slip and 15 km depth. <b>Hot spots:</b> a new volcano forms about every 1 million years (Hawaii) or 1.4 million years (Yellowstone); old volcanoes wear down and sink as they move away. Magnetic reversals are spaced 0.15–1.1 million years apart, like the real record.</p>'
};

/* show only the controls, tiles and graphs for the current view */
function sync(sim){if(!sim.ui||!sim.ui.sec)return;const d=sim.def,p=sim.p,tr=isTr(sim),hs=p.view==='hotspot';
  const ok=o=>(!o.modes||o.modes.includes(p.view))&&(!o.types||(!hs&&o.types.includes(p.type)))&&(!o.tr||tr)&&(!o.notr||!tr)&&atLeast(o.lvl||'bio');
  d.controls.forEach(c=>{const e=document.getElementById(d.id+'-'+c.id)||document.getElementById(d.id+'-'+c.id+'-l');const w=e&&e.closest('.ctl');if(w)w.hidden=!ok(c)||(c.id==='convect'&&tr);});
  d.metrics.forEach(m=>{const t=sim.ui.tiles&&sim.ui.tiles[m.id];const w=t&&t.num.closest('.tile');if(w)w.hidden=!ok(m);});
  if(sim.ui.gm){const opts=[...sim.ui.gm.options];let first=null;opts.forEach(o=>{const g=d.graphs.find(x=>x.id===o.value);const v=!g||ok(g);o.hidden=!v;o.disabled=!v;if(v&&!first)first=o.value;});
    const g=d.graphs.find(x=>x.id===sim.ui.gm.value);if(g&&!ok(g)&&first){sim.ui.gm.value=first;sim.gMetric=first;}}}

function oldest(sim){const st=sim.st,p=sim.p;if(p.view!=='hotspot'||!st.isl.length)return null;const o=st.isl[0],age=sim.t-o.born;return {age,dist:age*p.speed*10};}

/* ---------- drawing helpers ---------- */
const C={ocrust:'#3c4652',olith:'#59616b',ccrust:'#b39a72',clith:'#8a7a63',asth1:'#e9a55c',asth2:'#c7602d',water:'rgba(47,111,168,0.82)',magma:'#ff6a1a',land:'#7a9a4e',snow:'#f2f5f8'};
function arrow(ctx,x,y,dx,col,lab,k){const L=Math.abs(dx),s=Math.sign(dx);ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx-s*10,y);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+dx,y);ctx.lineTo(x+dx-s*14,y-8);ctx.lineTo(x+dx-s*14,y+8);ctx.closePath();ctx.fill();if(lab)txt(ctx,lab,x+dx/2,y-12,{s:12*k,w:700,a:'center',c:col});}
function quakeColor(z){return z<70?'#e8442e':z<300?'#f0a020':'#7b3fe4';}
function drawQuakes(sim,ctx,k){const st=sim.st,now=sim.t;st.q.forEach(o=>{const age=(now-o.t)/1.2;if(age>1)return;const y=yD(o.z)+(o.z<20?-6:0),r=4+age*16;
    ctx.globalAlpha=1-age;ctx.strokeStyle=quakeColor(o.z);ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(o.x,Math.max(y,yD(0)-6),r,0,6.29);ctx.stroke();ctx.fillStyle=quakeColor(o.z);ctx.beginPath();ctx.arc(o.x,Math.max(y,yD(0)-6),3.5,0,6.29);ctx.fill();ctx.globalAlpha=1;});}
function mantle(ctx,top){const g=ctx.createLinearGradient(0,top,0,450);g.addColorStop(0,C.asth1);g.addColorStop(1,C.asth2);ctx.fillStyle=g;ctx.fillRect(0,top,800,450-top);}
function convection(sim,ctx,t,kind){if(!sim.p.convect)return;const ph=RM?0:(t*0.12)%1;ctx.strokeStyle='rgba(120,40,10,0.55)';ctx.fillStyle='rgba(120,40,10,0.55)';ctx.lineWidth=2.5;
  const loop=(cx,cy,rx,ry,dir)=>{for(let i=0;i<6;i++){const a=(i/6+ph*dir)*Math.PI*2,a2=a+0.5*dir;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,Math.min(a,a2),Math.max(a,a2));ctx.stroke();
      const hx=cx+rx*Math.cos(a2),hy=cy+ry*Math.sin(a2),tx=-Math.sin(a2)*rx*dir,ty=Math.cos(a2)*ry*dir,n=Math.hypot(tx,ty)||1,ux=tx/n,uy=ty/n;ctx.beginPath();ctx.moveTo(hx+ux*7,hy+uy*7);ctx.lineTo(hx-uy*4,hy+ux*4);ctx.lineTo(hx+uy*4,hy-ux*4);ctx.closePath();ctx.fill();}};
  if(kind==='up'){loop(260,370,130,52,-1);loop(540,370,130,52,1);}else if(kind==='down'){loop(250,385,140,48,1);loop(640,385,130,48,-1);}else{loop(400,385,190,48,1);}}
/* moving plate markers: little white ticks on the plate surface */
function markers(ctx,xs,yFn,col){ctx.strokeStyle=col;ctx.lineWidth=2;xs.forEach(x=>{if(x<0||x>800)return;const y=yFn(x);ctx.beginPath();ctx.moveTo(x,y+3);ctx.lineTo(x,y+11);ctx.stroke();});}
function volcano(ctx,x,base,top,w,k,erupt,t){ctx.fillStyle='#6b5a4a';ctx.beginPath();ctx.moveTo(x-w,base);ctx.lineTo(x-6,top);ctx.lineTo(x+6,top);ctx.lineTo(x+w,base);ctx.closePath();ctx.fill();
  if(top<SL-6*EZ+20){ctx.fillStyle=C.snow;ctx.beginPath();ctx.moveTo(x-12,top+12);ctx.lineTo(x-6,top);ctx.lineTo(x+6,top);ctx.lineTo(x+12,top+12);ctx.closePath();ctx.fill();}
  if(erupt&&!RM){const ph=(t*0.6)%1;for(let i=0;i<4;i++){const f=(ph+i/4)%1;ctx.fillStyle='rgba(90,90,90,'+(0.55*(1-f))+')';ctx.beginPath();ctx.arc(x+f*22,top-8-f*40,6+f*12,0,6.29);ctx.fill();}}}

function drawCross(sim,ctx,k,t){const p=sim.p,st=sim.st,ty=p.type,T=TYPES[ty],sp=p.speed;
  // sky and sea
  const prof=x=>profile(sim,x);
  // mantle and lithosphere
  mantle(ctx,215);
  convection(sim,ctx,t,ty==='ridge'||ty==='rift'?'up':ty==='cc'?'flat':'down');
  ctx.save();
  if(ty==='ridge'||ty==='rift'){drawDivergent(sim,ctx,k,t,prof);}
  else if(ty==='cc')drawCollision(sim,ctx,k,t,prof);
  else drawSubduction(sim,ctx,k,t,prof);
  ctx.restore();
  drawQuakes(sim,ctx,k);
  // depth axis
  ctx.fillStyle=PAL['cv-soft'];[0,100,300,660].forEach(z=>{const y=yD(z);if(y>440)return;ctx.fillRect(790,y,8,1.5);txt(ctx,z+' km',786,y+4,{s:10.5*k,a:'right',c:PAL['cv-soft']});});
  // labels
  txt(ctx,T.ex,16,24,{s:12.5*k,w:700});
  txt(ctx,'Not to scale: heights stretched about 30×',16,42,{s:11*k,c:PAL['cv-soft']});
  if(atLeast('honors')){const qy=430;[['0–70 km',0],['70–300 km',100],['300+ km',400]].forEach(([l,z],i)=>{ctx.fillStyle=quakeColor(z);ctx.beginPath();ctx.arc(20+i*92,qy,5,0,6.29);ctx.fill();txt(ctx,l,30+i*92,qy+4,{s:10.5*k,c:'#fff',w:700});});txt(ctx,'Earthquake depth',300,qy+4,{s:10.5*k,c:'#fff',w:700});}}

function waterFill(ctx,prof){ctx.fillStyle=C.water;ctx.beginPath();ctx.moveTo(0,SL);for(let x=0;x<=800;x+=4){const e=prof(x);ctx.lineTo(x,e<0?yE(e):SL);}ctx.lineTo(800,SL);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(47,111,168,0.9)';ctx.lineWidth=1.5;ctx.beginPath();let on=false;for(let x=0;x<=800;x+=4){if(prof(x)<0){if(!on){ctx.moveTo(x,SL);on=true;}else ctx.lineTo(x,SL);}else on=false;}ctx.stroke();}

function drawDivergent(sim,ctx,k,t,prof){const st=sim.st,p=sim.p,rift=p.type==='rift',half=p.speed*10/2*XZ; // px per Myr each side
  const oceanic=!rift||st.D>140;
  // lithosphere: thickens away from the ridge
  const top=x=>yE(prof(x)),base=x=>{const a=Math.abs(x-400);return rift?Math.min(232,top(x)+62-30*gauss(x-400,riftW(st)/2+20)):top(x)+10+44*Math.sqrt(Math.min(1,a/360));};
  for(const side of [-1,1]){ctx.fillStyle=rift?C.clith:C.olith;ctx.beginPath();const xs=[];for(let x=400;x>=0&&x<=800;x+=side*4)xs.push(x);
    ctx.moveTo(400+side*2,top(400));xs.forEach(x=>ctx.lineTo(x+side*2,top(x)));for(let i=xs.length-1;i>=0;i--)ctx.lineTo(xs[i]+side*2,base(xs[i]));ctx.closePath();ctx.fill();
    // crust layer
    ctx.fillStyle=rift?C.ccrust:C.ocrust;ctx.beginPath();ctx.moveTo(400+side*2,top(400));xs.forEach(x=>ctx.lineTo(x+side*2,top(x)));for(let i=xs.length-1;i>=0;i--)ctx.lineTo(xs[i]+side*2,top(xs[i])+(rift?24:8));ctx.closePath();ctx.fill();}
  // magnetic stripes (on the sea floor) and rising magma
  if(atLeast('honors')&&p.stripes){const halfKm=p.speed*10/2,X0=120,X1=680,BY=56,BH=26,ocKm=rift?Math.max(0,(st.D-140)/2):1e9;
    for(let x=X0;x<X1;x+=2){const km=Math.abs(x-400)/2,a=km/halfKm;ctx.fillStyle=km>ocKm?'#c9b98a':polarity(sim.t-a)?'#1b1b1b':'#f4f4f4';ctx.fillRect(x,BY,2,BH);}
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.strokeRect(X0,BY,X1-X0,BH);ctx.fillStyle='#e8442e';ctx.fillRect(399,BY-4,2,BH+8);
    txt(ctx,'Sea floor seen from above, zoomed in 4×: black = normal field, white = reversed',400,BY+BH+14,{s:11*k,w:700,a:'center'});
    txt(ctx,'Earth’s field now: '+(polarity(sim.t)?'normal':'reversed'),X1,BY-6,{s:11*k,w:700,a:'right',c:PAL['cv-soft']});
    ctx.setLineDash([3,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X0,BY+BH);ctx.lineTo(400-140*XZ,top(400-140*XZ));ctx.moveTo(X1,BY+BH);ctx.lineTo(400+140*XZ,top(400+140*XZ));ctx.stroke();ctx.setLineDash([]);}
  if(!rift){ctx.fillStyle=C.magma;ctx.beginPath();ctx.moveTo(386,250);ctx.quadraticCurveTo(400,200,414,250);ctx.closePath();ctx.fill();ctx.fillRect(398,top(400)-2,4,40);}
  else{ctx.fillStyle=C.magma;ctx.beginPath();ctx.ellipse(400,236,riftW(st)/2+10,14,0,0,6.29);ctx.fill();
    const w=riftW(st)/2+18;[-1,1].forEach(s=>{if(st.D<10)return;const vx=400+s*w,h=rifVolcH(st);volcano(ctx,vx,top(vx)+4,yE(h),28,k,st.D>20,t+s);ctx.strokeStyle=C.magma;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(400+s*w*0.5,236);ctx.lineTo(vx,yE(h)+20);ctx.stroke();});}
  // land surface, then the sea
  if(rift){ctx.fillStyle=C.land;ctx.beginPath();ctx.moveTo(0,top(0));for(let x=0;x<=800;x+=4){const e=prof(x);ctx.lineTo(x,top(x));}ctx.lineTo(800,top(800)+5);for(let x=800;x>=0;x-=4)ctx.lineTo(x,top(x)+5);ctx.closePath();ctx.fill();}
  waterFill(ctx,prof);
  // moving markers
  const sp=RM?0:1,n=14,gap=60;for(const side of [-1,1]){const xs=[];for(let i=0;i<n;i++){const off=((sim.t*half*sp)%gap+gap)%gap;xs.push(400+side*(18+i*gap+off));}markers(ctx,xs,x=>top(x),'rgba(255,255,255,0.75)');}
  const ay=atLeast('honors')&&p.stripes?SL-26:SL-58;arrow(ctx,330,ay,-90,'#1d6fd1',p.speed.toFixed(1)+' cm/yr',k);arrow(ctx,470,ay,90,'#1d6fd1','',k);
  if(rift&&st.D>140)pill(ctx,'The sea has flooded in: a new ocean',400,SL-90,'rgba(0,0,0,.6)','#fff',12*k);
  // labels
  txt(ctx,rift?'Continental crust':'Oceanic crust',120,rift?top(120)+40:top(120)+30,{s:11.5*k,w:700,c:'#fff'});
  txt(ctx,'Lithosphere (rigid plate)',600,base(600)-8,{s:11*k,c:'#fff',a:'center'});
  txt(ctx,'Asthenosphere: hot, slowly flowing rock',400,300,{s:12*k,w:700,a:'center',c:'#5a2000'});
  pill(ctx,rift?'Rift valley':'Ridge: new crust forms here',400,rift?Math.min(top(400)+30,226):top(400)-38,'rgba(0,0,0,.6)','#fff',11.5*k);}

function drawSubduction(sim,ctx,k,t,prof){const st=sim.st,p=sim.p,oc=p.type==='oc',pts=sim.vis.slab||(sim.vis.slab=slabPath(400,yE(oc?-8:-10.5)));
  const top=x=>yE(prof(x)),TH=30;
  // subducting plate: surface from x=0 to trench, then along the slab
  const pathTop=[];for(let x=0;x<=400;x+=4)pathTop.push([x,top(x)]);pts.forEach((q,i)=>{if(i)pathTop.push(q);});
  const norm=(i)=>{const a=pathTop[Math.max(0,i-1)],b=pathTop[Math.min(pathTop.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],n=Math.hypot(dx,dy)||1;return [-dy/n,dx/n];};
  const bot=pathTop.map((q,i)=>{const nn=norm(i);return [q[0]+nn[0]*TH*(i<101?1:1),q[1]+nn[1]*TH];});
  ctx.fillStyle=C.olith;ctx.beginPath();pathTop.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));for(let i=bot.length-1;i>=0;i--)ctx.lineTo(bot[i][0],bot[i][1]);ctx.closePath();ctx.fill();
  ctx.strokeStyle=C.ocrust;ctx.lineWidth=7;ctx.beginPath();pathTop.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]+3):ctx.moveTo(q[0],q[1]+3));ctx.stroke();
  // overriding plate
  const over=x=>Math.min(oc?226:214,slabYAt(pts,x)-3);
  ctx.fillStyle=oc?C.clith:C.olith;ctx.beginPath();ctx.moveTo(400,top(400));for(let x=400;x<=800;x+=4)ctx.lineTo(x,top(x));for(let x=800;x>=400;x-=4)ctx.lineTo(x,over(x));ctx.closePath();ctx.fill();
  ctx.fillStyle=oc?C.ccrust:C.ocrust;ctx.beginPath();ctx.moveTo(400,top(400));for(let x=400;x<=800;x+=4)ctx.lineTo(x,top(x));for(let x=800;x>=400;x-=4)ctx.lineTo(x,Math.min(top(x)+(oc?30:8),over(x)));ctx.closePath();ctx.fill();
  if(oc){ctx.fillStyle=C.land;ctx.beginPath();ctx.moveTo(430,top(430));for(let x=430;x<=800;x+=4)ctx.lineTo(x,top(x));for(let x=800;x>=430;x-=4)ctx.lineTo(x,top(x)+5);ctx.closePath();ctx.fill();}
  // melting: magma from the slab about 100 km down rises to the volcanoes
  const vx=oc?505:490,sy=slabYAt(pts,vx),h=arcH(sim),vbase=top(vx)+2,vtop=yE(h);
  ctx.fillStyle=C.magma;ctx.globalAlpha=0.9;ctx.beginPath();ctx.ellipse(vx,sy-10,16,8,0,0,6.29);ctx.fill();ctx.globalAlpha=1;
  const ph=RM?0.5:(t*0.5)%1;for(let i=0;i<4;i++){const f=(ph+i/4)%1,y=lerp(sy-12,vbase+8,f);ctx.fillStyle=C.magma;ctx.beginPath();ctx.arc(vx+Math.sin(f*7+i)*4,y,4.5-2*f,0,6.29);ctx.fill();}
  ctx.strokeStyle='rgba(255,106,26,0.6)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(vx,sy-12);ctx.lineTo(vx,vbase+4);ctx.stroke();
  if(oc||h>-3.6){volcano(ctx,vx,vbase+6,vtop,oc?34:46,k,mat(st,250)>0.25,t);if(oc){volcano(ctx,vx+44,top(vx+44)+6,yE(h*0.8),26,k,false,t);}}
  waterFill(ctx,prof);
  if(!oc&&h>0)pill(ctx,'Volcanic island',vx,vtop-22,'rgba(0,0,0,.6)','#fff',11.5*k);
  // markers ride the sinking plate
  const sp=RM?0:1,L=pathTop.length,per=XZ*p.speed*10*sp; // px per Myr
  const cum=[0];for(let i=1;i<L;i++)cum.push(cum[i-1]+Math.hypot(pathTop[i][0]-pathTop[i-1][0],pathTop[i][1]-pathTop[i-1][1]));
  const total=cum[L-1],gap=60;ctx.strokeStyle='rgba(255,255,255,0.8)';ctx.lineWidth=2;
  for(let s=((sim.t*per)%gap+gap)%gap;s<total;s+=gap){let i=1;while(i<L-1&&cum[i]<s)i++;const f=(s-cum[i-1])/(cum[i]-cum[i-1]||1),x=lerp(pathTop[i-1][0],pathTop[i][0],f),y=lerp(pathTop[i-1][1],pathTop[i][1],f),nn=norm(i);
    ctx.beginPath();ctx.moveTo(x+nn[0]*4,y+nn[1]*4);ctx.lineTo(x+nn[0]*14,y+nn[1]*14);ctx.stroke();}
  arrow(ctx,170,SL-58,110,'#1d6fd1',p.speed.toFixed(1)+' cm/yr',k);
  // labels
  pill(ctx,'Trench',400,yE(oc?-8:-10.5)+20,'rgba(0,0,0,.6)','#fff',11.5*k);
  txt(ctx,'Ocean plate (dense, sinks)',120,top(120)+24,{s:11.5*k,w:700,c:'#fff'});
  txt(ctx,oc?'Continent (light, stays up)':'Younger ocean plate',650,oc?top(650)+26:top(650)+24,{s:11.5*k,w:700,c:'#fff',a:'center'});
  txt(ctx,'Melting about 100 km down',vx+30,sy-10,{s:11*k,w:700,c:'#5a2000'});
  const lx=slabXAt(pts,360);txt(ctx,'Sinking slab',lx+18,360,{s:11.5*k,w:700,c:'#fff'});
  txt(ctx,'Asthenosphere',140,330,{s:12*k,w:700,c:'#5a2000'});}

function drawCollision(sim,ctx,k,t,prof){const st=sim.st,p=sim.p,m=mat(st,800),top=x=>yE(prof(x));
  const root=x=>top(x)+32+110*m*gauss(x-400,40+60*m);
  ctx.fillStyle=C.clith;ctx.beginPath();ctx.moveTo(0,top(0));for(let x=0;x<=800;x+=4)ctx.lineTo(x,top(x));for(let x=800;x>=0;x-=4)ctx.lineTo(x,Math.max(root(x)+30,226));ctx.closePath();ctx.fill();
  ctx.fillStyle=C.ccrust;ctx.beginPath();ctx.moveTo(0,top(0));for(let x=0;x<=800;x+=4)ctx.lineTo(x,top(x));for(let x=800;x>=0;x-=4)ctx.lineTo(x,root(x));ctx.closePath();ctx.fill();
  // folded layers
  ctx.strokeStyle='rgba(90,60,30,0.45)';ctx.lineWidth=1.5;for(let j=1;j<4;j++){ctx.beginPath();for(let x=0;x<=800;x+=4){const y=lerp(top(x),root(x),j/4)+Math.sin(x/9)*6*m*gauss(x-400,70);x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
  // suture
  ctx.strokeStyle='rgba(60,40,20,0.7)';ctx.setLineDash([6,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(400,top(400)+10);ctx.lineTo(430,root(400));ctx.stroke();ctx.setLineDash([]);
  // snow on the peaks
  ctx.fillStyle=C.snow;ctx.beginPath();let on=false;for(let x=0;x<=800;x+=3){const e=prof(x);if(e>5){const y=top(x);if(!on){ctx.moveTo(x,y);on=true;}else ctx.lineTo(x,y);}}
  for(let x=800;x>=0;x-=3){const e=prof(x);if(e>5)ctx.lineTo(x,top(x)+Math.min(14,(e-5)*6));}ctx.closePath();if(on)ctx.fill();
  // markers move inward and disappear into the mountains
  const per=XZ*p.speed*10/2*(RM?0:1),gap=60,w=40+70*m;for(const side of [-1,1]){const xs=[];for(let i=0;i<14;i++){const off=((sim.t*per)%gap+gap)%gap;const x=400+side*(w+i*gap-off+gap);xs.push(x);}markers(ctx,xs,x=>top(x),'rgba(60,40,20,0.7)');}
  arrow(ctx,170,SL-58,100,'#1d6fd1',(p.speed/2).toFixed(1)+' cm/yr each',k);arrow(ctx,630,SL-58,-100,'#1d6fd1','',k);
  txt(ctx,'Continent (India)',90,top(90)+26,{s:11.5*k,w:700,c:'#5a3a10'});txt(ctx,'Continent (Asia)',700,top(700)+26,{s:11.5*k,w:700,c:'#5a3a10',a:'center'});
  if(m>0.15)pill(ctx,'Mountains: '+(0.5+8.35*m).toFixed(1)+' km high',400,yE(0.5+8.35*m)-16,'rgba(0,0,0,.6)','#fff',11.5*k);
  if(m>0.3)txt(ctx,'Thick crust: mountain root',430,root(400)-12,{s:11*k,w:700,c:'#5a3a10'});
  txt(ctx,'Asthenosphere',140,330,{s:12*k,w:700,c:'#5a2000'});}

/* ---------- transform fault, seen from above ---------- */
function drawTransform(sim,ctx,k,t){const st=sim.st,p=sim.p,pxm=4,def=st.ufar-st.s,lam=95;
  // ground
  ctx.fillStyle='#c9b98a';ctx.fillRect(0,40,800,400);ctx.fillStyle='rgba(122,154,78,0.45)';for(let i=0;i<40;i++){const r=rng(i+11);ctx.beginPath();ctx.arc(r()*800,50+r()*380,6+r()*10,0,6.29);ctx.fill();}
  // displacement (north = up) of a point at x
  const u=x=>{const dx=Math.abs(x-400),side=x<400?1:-1;return side*(st.s/2+def/2*(1-Math.exp(-dx/lam)));};
  const wrap=v=>{const P=150;return ((v%P)+P)%P;};
  // fault zone
  ctx.fillStyle='rgba(90,70,40,0.35)';ctx.fillRect(394,40,12,400);ctx.strokeStyle='#5a4628';ctx.lineWidth=2;ctx.setLineDash([10,6]);ctx.beginPath();ctx.moveTo(400,40);ctx.lineTo(400,440);ctx.stroke();ctx.setLineDash([]);
  // roads (every 150 px) and a stream
  ctx.save();ctx.beginPath();ctx.rect(0,40,800,400);ctx.clip();
  for(const side of [-1,1]){const xs=[];for(let x=side<0?0:404;side<0?x<=396:x<=800;x+=4)xs.push(x);
    const xr=side<0?0:800,ur=u(xr),Y=(x,b)=>40+wrap(b-ur*pxm)+(ur-u(x))*pxm;
    for(let r=-1;r<4;r++){ctx.strokeStyle='#3d3d3d';ctx.lineWidth=12;ctx.beginPath();xs.forEach((x,i)=>{const y=Y(x,80)+r*150;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
      ctx.strokeStyle='#f2c230';ctx.lineWidth=2;ctx.setLineDash([10,8]);ctx.beginPath();xs.forEach((x,i)=>{const y=Y(x,80)+r*150;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.setLineDash([]);}
    // stream
    ctx.strokeStyle='#3a86c8';ctx.lineWidth=5;for(let r=-1;r<4;r++){ctx.beginPath();xs.forEach((x,i)=>{const y=Y(x,140)+Math.sin(x/37)*6+r*150;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}}
  ctx.restore();
  // plate arrows
  ctx.save();ctx.translate(200,250);ctx.rotate(-Math.PI/2);arrow(ctx,-60,0,120,'#1d6fd1','',k);ctx.restore();ctx.save();ctx.translate(600,250);ctx.rotate(Math.PI/2);arrow(ctx,-60,0,120,'#1d6fd1','',k);ctx.restore();
  pill(ctx,'Pacific plate: moving northwest',200,60,'rgba(0,0,0,.6)','#fff',12*k);pill(ctx,'North American plate',600,60,'rgba(0,0,0,.6)','#fff',12*k);
  txt(ctx,TYPES.transform.ex,16,24,{s:12.5*k,w:700});
  txt(ctx,'Seen from above. Offsets drawn 4 px per meter.',16,434,{s:11*k,c:'#3a2a10',w:600});
  // strain meter
  if(atLeast('honors')){const bx=700,by=110,bh=250,f=clamp(def/st.thr,0,1);ctx.fillStyle='rgba(0,0,0,.55)';rr(ctx,bx-10,by-30,90,bh+60,8);ctx.fill();txt(ctx,'Strain',bx+35,by-12,{s:12*k,w:700,c:'#fff',a:'center'});
    ctx.fillStyle='#ddd';rr(ctx,bx+20,by,30,bh,5);ctx.fill();ctx.fillStyle=f>0.85?'#e8442e':'#f0a020';rr(ctx,bx+20,by+bh*(1-f),30,bh*f,5);ctx.fill();txt(ctx,def.toFixed(1)+' m',bx+35,by+bh+18,{s:12*k,w:700,c:'#fff',a:'center'});}
  // the earthquake
  const L=st.last;if(L&&sim.t-L.t<30){const age=(sim.t-L.t)/30;for(let i=0;i<3;i++){ctx.strokeStyle='rgba(232,68,46,'+(1-age)+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(400,L.y,10+age*140+i*24,0,6.29);ctx.stroke();}
    pill(ctx,'Magnitude '+L.M.toFixed(1)+' earthquake! Slipped '+L.slip.toFixed(1)+' m',400,L.y<240?L.y+60:L.y-60,'#c8102e','#fff',13*k);}
  else if(def>0.3)pill(ctx,'Locked: the road bends as strain builds',530,412,'rgba(0,0,0,.6)','#fff',12*k);}

/* ---------- hot spot ---------- */
function drawHot(sim,ctx,k,t){const st=sim.st,p=sim.p,ye=p.spot==='yellowstone',HX=600,pxMyr=p.speed*10*XZ;
  const floor=ye?1.6:-5,ty=yE(floor);
  mantle(ctx,ye?226:215);convection(sim,ctx,t,'flat');
  // plume
  const g=ctx.createLinearGradient(0,450,0,ty);g.addColorStop(0,'rgba(255,90,20,0.95)');g.addColorStop(1,'rgba(255,140,40,0.8)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(HX-26,450);ctx.quadraticCurveTo(HX-8,320,HX-30,ty+46);ctx.lineTo(HX+30,ty+46);ctx.quadraticCurveTo(HX+8,320,HX+26,450);ctx.closePath();ctx.fill();
  if(!RM){const ph=(t*0.4)%1;for(let i=0;i<5;i++){const f=(ph+i/5)%1;ctx.fillStyle='rgba(255,220,120,0.8)';ctx.beginPath();ctx.arc(HX+Math.sin(i*2+f*5)*8,lerp(440,ty+60,f),5,0,6.29);ctx.fill();}}
  // plate
  const lb=ye?226:215;ctx.fillStyle=ye?C.clith:C.olith;ctx.fillRect(0,ty,800,lb-ty);ctx.fillStyle=ye?C.ccrust:C.ocrust;ctx.fillRect(0,ty,800,ye?28:9);
  if(ye){ctx.fillStyle=C.land;ctx.fillRect(0,ty-4,800,5);}
  // volcanoes: born over the hot spot, carried left
  const h=age=>ye?0:4.2-1.15*Math.sqrt(age)-0.12*age;
  st.isl.forEach((o,i)=>{const age=sim.t-o.born,x=HX-age*pxMyr;if(x<-60)return;
    if(ye){const w=30,dep=Math.max(0.3,1-age*0.05);ctx.fillStyle=age<1?'#6a3b2a':'#4b4740';ctx.beginPath();ctx.ellipse(x,ty+1,w,dep*14,0,0,Math.PI);ctx.fill();ctx.strokeStyle='#2e2a24';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,ty+1,w,dep*14,0,0,Math.PI);ctx.stroke();
      ctx.fillStyle='#3a3530';ctx.fillRect(x-w,ty-3,2*w,4);
      if(age<0.8&&!RM){for(let j=0;j<3;j++){const f=((t*0.5)+j/3)%1;ctx.fillStyle='rgba(255,255,255,'+(0.7*(1-f))+')';ctx.beginPath();ctx.arc(x-8+j*8,ty-8-f*30,4+f*6,0,6.29);ctx.fill();}}}
    else{const grow=clamp(age/0.6,0.05,1),e=Math.min(lerp(-4.6,4.2,grow),h(age)),top=yE(e),w=30+12*grow;ctx.fillStyle=age<0.6?'#5a3226':'#6b5a4a';ctx.beginPath();ctx.moveTo(x-w-20,ty);ctx.lineTo(x-6,top);ctx.lineTo(x+6,top);ctx.lineTo(x+w+20,ty);ctx.closePath();ctx.fill();
      if(e>0.2){ctx.fillStyle='#4f7a3a';ctx.beginPath();ctx.moveTo(x-14,yE(Math.max(0,e-1)));ctx.lineTo(x-6,top);ctx.lineTo(x+6,top);ctx.lineTo(x+14,yE(Math.max(0,e-1)));ctx.closePath();ctx.fill();}
      if(age<0.6&&!RM){const f=(t*0.6)%1;ctx.fillStyle='rgba(90,90,90,'+(0.5*(1-f))+')';ctx.beginPath();ctx.arc(x+f*16,top-10-f*34,6+f*10,0,6.29);ctx.fill();}}
    const stride=Math.max(1,Math.ceil(56/(pxMyr*(ye?1.4:1)))),last=sim.st.isl.length-1;if(((last-i)%stride)===0)txt(ctx,age<0.05?'new':age.toFixed(1)+' Myr',x,ye?ty-12:Math.min(yE(Math.max(h(age),-4.5)),SL)-10,{s:11*k,w:700,a:'center',c:PAL['cv-ink']});});
  if(!ye)waterFill(ctx,x=>-5);
  // labels
  txt(ctx,SPOTS[p.spot].ex,16,24,{s:12.5*k,w:700});txt(ctx,'Not to scale: heights stretched about 30×',16,42,{s:11*k,c:PAL['cv-soft']});
  arrow(ctx,330,ye?ty-40:SL-50,-120,'#1d6fd1',p.speed.toFixed(1)+' cm/yr',k);
  txt(ctx,'Hot spot (stays put)',HX+70,ty+(ye?92:70),{s:12*k,w:700,a:'center',c:'#fff'});txt(ctx,'Plume of hot rock from deep in the mantle',HX,400,{s:11*k,a:'center',c:'#5a2000',w:700});
  const o=oldest(sim);if(o&&o.age>1.2){const x=HX-o.age*pxMyr,ly=ye?ty+40:SL+48;if(x>20){ctx.strokeStyle=ye?'#fff':PAL['cv-ink'];ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x,ly);ctx.lineTo(HX,ly);ctx.stroke();ctx.setLineDash([]);
    txt(ctx,Math.round(o.dist)+' km from the hot spot',(x+HX)/2,ly-5,{s:11.5*k,w:700,a:'center',c:'#fff'});}}
  if(ye)txt(ctx,'Old volcanic craters (calderas) across Idaho, filled with lava rock',300,ty+64,{s:11*k,c:'#fff',a:'center'});}

BioLab.register(PLATES);
})();
