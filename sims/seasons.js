(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,RM,lvText}=BioLab.h;

/* Seasons and atmospheric circulation. Time is in days; the model is solar geometry. */
const S0=1361,MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],MDAYS=[31,28,31,30,31,30,31,31,30,31,30,31];
const ALB={snow:{l:'Fresh snow',a:0.85,c:'#eef4fa'},sand:{l:'Desert sand',a:0.40,c:'#e2c88e'},grass:{l:'Grassland',a:0.25,c:'#7fae5a'},forest:{l:'Forest',a:0.15,c:'#2f6b3a'},ocean:{l:'Open ocean',a:0.06,c:'#1f4f8a'}};
const rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI;
const doy=sim=>((sim.st.d0+sim.t)%365+365)%365;
const decl=(sim,d)=>-sim.p.tilt*Math.cos(2*Math.PI*(d+10)/365);
const rAU=d=>1-0.0167*Math.cos(2*Math.PI*(d-3)/365);
function sun(sim){const d=doy(sim),dl=decl(sim,d),lat=sim.p.lat,r=rAU(d);const phi=rad(lat),de=rad(dl);
  const x=clamp(-Math.tan(phi)*Math.tan(de),-1,1),h0=Math.acos(x);
  const Q=Math.max(0,S0/Math.PI/(r*r)*(h0*Math.sin(phi)*Math.sin(de)+Math.cos(phi)*Math.cos(de)*Math.sin(h0)));
  const elev=90-Math.abs(lat-dl);return {d,dl,r,elev,day:24*h0/Math.PI,Q};}
function dateStr(d){d=Math.floor(d);let m=0;while(m<11&&d>=MDAYS[m]){d-=MDAYS[m];m++;}return MON[m]+' '+(d+1);}
function season(sim){const d=doy(sim),north=sim.p.lat>=0;let s=d<79?'Winter':d<172?'Spring':d<266?'Summer':d<355?'Fall':'Winter';
  if(Math.abs(sim.p.lat)<12)return 'Tropics: little seasonal change';
  if(!north)s={Winter:'Summer',Summer:'Winter',Spring:'Fall',Fall:'Spring'}[s];if(sim.p.tilt<2)return 'No real seasons (no tilt)';return s+(north?' (Northern Hemisphere)':' (Southern Hemisphere)');}
const jump=(sim,day)=>{sim.st.d0=day-sim.t;};
const latStr=l=>Math.abs(l).toFixed(1)+'° '+(l>=0?'N':'S');

const SEASONS={
  id:'seasons',hash:'seasons',apUnit:12,order:2,kind:'Simulation',tab:'Seasons and atmospheric circulation',
  card:'Tilt the Earth, follow its orbit, and see why Denver gets seasons and why deserts line up near 30° latitude.',
  title:'Seasons, sunlight and global winds',
  lede:{bio:'Earth’s axis is tilted 23.5°. As Earth orbits the Sun, each hemisphere takes turns leaning toward the Sun, which changes how high the Sun climbs and how long the day lasts.',
        honors:'Uneven heating drives the atmosphere. Warm air rises at the equator and sinks near 30°, forming convection cells that place the world’s rainforests and deserts.',
        ap:'Add Earth’s rotation. The Coriolis effect bends moving air into the trade winds and westerlies, and albedo decides how much sunlight a surface absorbs.'},
  scale:{bio:'Not to scale: the Sun is 109 times Earth’s width and 150 million km away. Latitude defaults to Denver, 39.7° N.'},
  timeScale:20,dtMax:5,prewarm:0,sampleDt:1,window:365,unit:'days',timeLabel:'Time',chChange:3,chReveal:8,
  clock(sim){return dateStr(doy(sim))+' · day '+(Math.floor(doy(sim))+1);},
  controls:[
    {id:'view',label:'View',type:'seg',def:'orbit',lvl:'bio',noTrial:true,options:[{v:'orbit',l:'Sun and seasons'},{v:'winds',l:'Global winds',lvl:'honors'}]},
    {id:'lat',label:'Latitude',type:'range',min:-80,max:80,step:0.1,d:1,def:39.7,unit:'°',lvl:'bio',help:'Denver is 39.7° N. The equator is 0°. Negative numbers are south.'},
    {id:'tilt',label:'Axis tilt',type:'range',min:0,max:45,step:0.5,def:23.5,unit:'°',lvl:'honors',help:'Earth’s real tilt is 23.5°.'},
    {id:'coriolis',label:'Earth’s rotation (Coriolis effect)',type:'toggle',def:true,lvl:'ap',help:'Turn off to see winds on a planet that doesn’t spin'},
    {id:'surface',label:'Surface (albedo)',type:'select',def:'grass',lvl:'ap',options:Object.entries(ALB).map(([v,a])=>({v,l:a.l+' ('+a.a.toFixed(2)+')'}))}
  ],
  actions:[
    {id:'mar',label:'Mar 20 equinox',run(sim){jump(sim,79);}},
    {id:'jun',label:'Jun 21 solstice',run(sim){jump(sim,171);}},
    {id:'sep',label:'Sep 22 equinox',run(sim){jump(sim,264);}},
    {id:'dec',label:'Dec 21 solstice',run(sim){jump(sim,354);}}
  ],
  init(sim){return {d0:295};},
  step(sim,dt){},
  metrics:[
    {id:'angle',label:'Noon sun angle',unit:'° above horizon',lvl:'bio',min:0,max:90,d:1,get:s=>Math.max(0,sun(s).elev)},
    {id:'daylen',label:'Day length',unit:'hours',lvl:'bio',min:0,max:24,d:1,fixed:true,get:s=>sun(s).day},
    {id:'insol',label:'Sunlight energy (daily average)',unit:'W/m²',lvl:'bio',min:0,max:550,d:0,get:s=>sun(s).Q},
    {id:'season',label:'Season here',unit:'',lvl:'bio',text:true,get:s=>season(s)},
    {id:'dist',label:'Earth–Sun distance',unit:'million km',lvl:'honors',min:145,max:153,d:1,fixed:true,get:s=>149.6*sun(s).r},
    {id:'subsolar',label:'Sun overhead at noon at',unit:'° latitude',lvl:'honors',min:-45,max:45,d:1,fixed:true,get:s=>sun(s).dl},
    {id:'absorbed',label:'Absorbed by the surface',unit:'W/m²',lvl:'ap',min:0,max:550,d:0,get:s=>(1-ALB[s.p.surface].a)*sun(s).Q}
  ],
  graphs:[{id:'insol',label:'Sunlight energy',lines:['insol']},{id:'daylen',label:'Day length',lines:['daylen']},{id:'angle',label:'Noon sun angle',lines:['angle']},
    {id:'dist',label:'Earth–Sun distance',lvl:'honors',lines:['dist']},{id:'subsolar',label:'Latitude of overhead sun',lvl:'honors',lines:['subsolar']},{id:'absorbed',label:'Absorbed sunlight',lvl:'ap',lines:['absorbed']}],
  defaultGraph:'insol',
  challenges:[
    {lvl:'bio',instant:true,q:'Earth is closest to the Sun in early January. What season is it in Colorado then?',choices:['Summer','Winter','Spring'],correct:1,
     explain:'Winter. Earth is only about 3% closer to the Sun in January, which barely matters. What matters is the tilt: in January the Northern Hemisphere leans away from the Sun, so sunlight comes in at a low angle and days are short. Watch the distance and the season tiles together as the year runs.'},
    {lvl:'bio',q:'In Denver, jump from the June solstice to the December solstice. What happens to the noon sun angle and the day length?',
     choices:['Both increase','Both decrease','The angle stays the same, but the day gets shorter'],correct:1,baseline:{lat:39.7},baselineAction:'jun',changeAction:'dec',changeText:'Jumped to the December solstice',watch:'angle',at:1,reveal:4,
     explain:{bio:'Both drop. In June Denver’s noon Sun is about 74° up and the day lasts about 15 hours. In December the Sun only reaches about 27° and the day lasts about 9.3 hours. Low sunlight spreads over more ground, so each square meter gets less energy.',
              honors:'The noon angle is 90° − |latitude − declination|. In June the declination is +23.5°, giving 73.8°. In December it is −23.5°, giving 26.8°.'}},
    {lvl:'bio',instant:true,q:'On the March or September equinox, about how long is the day almost everywhere on Earth?',choices:['About 12 hours','About 16 hours','About 8 hours','It depends on the latitude'],correct:0,
     explain:'On the equinoxes the Sun is directly over the equator, so the line between day and night runs through both poles. Every latitude gets about 12 hours of daylight. Jump to an equinox and try different latitudes.'},
    {lvl:'honors',q:'Earth’s tilt is changed from 23.5° to 0°. What happens to Denver’s seasons over the next year?',
     choices:['They become more extreme','They nearly disappear','No change, because distance causes seasons'],correct:1,baseline:{lat:39.7},change:{tilt:0},changeText:'Tilt set to 0°',watch:'insol',at:3,reveal:200,
     explain:'With no tilt, the Sun is always over the equator, so Denver gets the same noon angle and 12-hour days all year. The only change left is the tiny ±3% distance effect. The flat line on the graph shows it.'},
    {lvl:'honors',instant:true,q:'Most of the world’s great deserts (the Sahara, the Arabian, the Australian) sit near which latitude?',choices:['The equator','About 30° north and south','About 60° north and south','The poles'],correct:1,
     explain:'Air that rose at the equator dropped its moisture as rain there, then flows poleward high up and sinks near 30°. Sinking air warms and dries, so it rarely rains. Switch to Global winds to see the Hadley cells.'},
    {lvl:'honors',instant:true,q:'Why does it rain so much near the equator?',choices:['The ocean is saltier there','Warm, moist air rises, cools and its water vapor condenses','Air sinks there and traps moisture','The Coriolis effect pulls clouds there'],correct:1,
     explain:'Direct sunlight heats the surface most at the equator. Warm, moist air rises, expands and cools, and the water vapor condenses into towering rain clouds. This rainy belt (the ITCZ) shifts north and south with the seasons.'},
    {lvl:'ap',instant:true,q:'Air near the surface flows from 30° N toward the equator. With Earth spinning, which way is it deflected, and what do we call these winds?',
     choices:['To the right: northeast trade winds','To the left: southeast trade winds','To the right: westerlies','No deflection'],correct:0,
     explain:'In the Northern Hemisphere moving air is deflected to the right. Air heading south is bent toward the west, so it blows from the northeast: the northeast trade winds. In the Southern Hemisphere deflection is to the left, which gives the southeast trades.'},
    {lvl:'ap',instant:true,q:'Calculate Denver’s noon sun angle on the June solstice (latitude 39.7° N, Sun overhead at 23.5° N).',choices:['50.3°','63.8°','73.8°','16.2°'],correct:2,
     explain:'Noon angle = 90° − |latitude − subsolar latitude| = 90° − (39.7° − 23.5°) = 90° − 16.2° = 73.8°.'},
    {lvl:'ap',instant:true,q:'Fresh snow (albedo 0.85) and open ocean (albedo 0.06) get the same sunlight. Which absorbs more energy?',choices:['Snow','Ocean','The same'],correct:1,
     explain:'Ocean absorbs 94% of the sunlight; snow absorbs only 15%. That is why melting Arctic sea ice is a positive feedback: darker water absorbs more heat, which melts more ice.'}
  ],
  initVis(sim){const r=rng(3);sim.vis.cl=[];for(let i=0;i<14;i++)sim.vis.cl.push([r(),r()]);},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);if(sim.p.view==='winds'&&atLeast('honors'))drawWinds(sim,ctx,k,t);else drawOrbit(sim,ctx,k,t);},
  narrate(sim){const s=sun(sim),p=sim.p,here=Math.abs(p.lat-39.7)<0.3?'Denver':latStr(p.lat);
    if(p.view==='winds'&&atLeast('honors')){const cor=atLeast('ap')&&p.coriolis;
      return '<b>Warm air rises at the equator</b>, drops its rain, spreads toward the poles and <b>sinks near 30°</b>, where deserts form. '+(cor?'Because Earth spins, surface winds curve: <b>right in the north, left in the south</b>, giving the trade winds and westerlies.':'The surface winds flowing back toward the equator are the trade winds.');}
    if(s.elev<=0)return 'It is '+dateStr(s.d)+'. At '+here+' the Sun never rises: <b>polar night</b>. This hemisphere is tilted away from the Sun.';
    const d=s.d,near=(d<20||d>350);
    if(p.tilt<2)return '<b>No tilt:</b> the Sun stays over the equator all year, so '+here+' gets the same '+s.elev.toFixed(0)+'° noon Sun and 12-hour days every day. No seasons.';
    return 'It is '+dateStr(d)+'. In '+here+' the noon Sun is <b>'+s.elev.toFixed(0)+'° up</b> and the day is <b>'+s.day.toFixed(1)+' h</b> long.'+(near&&p.lat>20?' Earth is closest to the Sun right now, yet it is winter here: <b>tilt, not distance</b>, causes the seasons.':(s.elev>60?' High sunlight is concentrated on a small patch of ground.':' Low sunlight spreads over a wide patch, so each square meter gets less energy.'));},
  tour:[
    {title:'One trip around the Sun',text:'Earth takes 365 days to orbit the Sun. Watch Earth move. Its axis always points the same direction in space, toward the North Star.',focus:[0,40,425,400],speed:1,setup(sim){BioLab.setValues(sim,{view:'orbit'});}},
    {title:'The tilt',text:'Earth’s axis is tilted 23.5°. In June the North Pole leans toward the Sun; in December it leans away.',focus(sim){const e=earthPos(sim);return [e[0]-50,e[1]-50,100,100];},pause:true,setup(sim){jump(sim,171);}},
    {title:'June: the north leans in',text:'On the June solstice the Sun is directly overhead at 23.5° N (the Tropic of Cancer). Denver’s noon Sun is high and days are long. It is summer in the north and winter in the south.',focus:[430,40,370,400],pause:true},
    {title:'Steep vs. low sunlight',text:'A beam of sunlight from high overhead lands on a small patch, concentrating its energy. A low Sun spreads the same beam over a long patch, so each square meter gets less.',focus:[430,40,370,215],pause:true},
    {title:'December: the north leans away',text:'Six months later the Sun is over 23.5° S. Denver’s noon Sun is only 27° up, days are 9 hours long, and it’s winter, even though Earth is now closest to the Sun.',focus:[0,40,800,400],pause:true,setup(sim){jump(sim,354);}},
    {lvl:'honors',title:'Uneven heating drives the winds',text:'The equator gets the most direct sunlight. Warm air rises there, cools and rains, then sinks near 30°. These loops are the <b>Hadley cells</b>. The Ferrel and polar cells continue the pattern toward the poles.',focus:[520,40,280,400],speed:1,setup(sim){BioLab.setValues(sim,{view:'winds'});}},
    {lvl:'honors',title:'Rain belts and deserts',text:'Rising air at the equator means rainforests. Sinking dry air at 30° means deserts. Rising air near 60° brings the stormy, rainy belt of the mid-latitudes.',focus:[110,40,400,400],speed:1},
    {lvl:'ap',title:'The Coriolis effect',text:'Because Earth spins, moving air curves: to the right in the Northern Hemisphere and to the left in the Southern. That turns the equator-bound flow into the northeast and southeast trade winds, and the poleward flow into the westerlies.',focus:[110,40,400,400],speed:1,setup(sim){BioLab.setValues(sim,{coriolis:true});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{view:'orbit'});},
  lab:{bio:'<p><b>Question:</b> How do the noon sun angle and day length in Denver change through the year?</p><ol><li>Jump to each solstice and equinox and record a trial at each.</li><li>Repeat at the equator (0°) and at 70° N.</li></ol><p>Explain why the equator has little seasonal change and 70° N has extreme seasons.</p>',
       honors:'<p><b>Question:</b> What does the tilt of Earth’s axis do to the seasons?</p><ol><li>At Denver, record sunlight energy on the June and December solstices with tilt 0°, 10°, 23.5° and 40°.</li><li>Calculate the summer-to-winter difference for each tilt.</li><li>Plot tilt (x) against the difference (y).</li></ol><p>Use your data to argue that tilt, not distance, causes seasons.</p>',
       ap:'<p><b>Question:</b> How do latitude and albedo control the energy a surface absorbs?</p><ol><li>On the June solstice, record absorbed sunlight for each surface type at 0°, 40° and 70° N.</li><li>Compare a snow-covered surface with open ocean at 70° N.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain the ice–albedo feedback and why the Arctic is warming faster than the global average.</p>'},
  terms:[{t:'Axial tilt',d:'The 23.5° lean of Earth’s axis. It causes the seasons.'},{t:'Solstice',d:'The day the Sun is farthest north or south: the longest or shortest day.'},{t:'Equinox',d:'The day the Sun is over the equator and day and night are about equal everywhere.'},{t:'Insolation',d:'Incoming solar radiation, measured in watts per square meter.'},
    {lvl:'honors',t:'Hadley cell',d:'The loop of air that rises at the equator and sinks near 30°.'},{lvl:'honors',t:'ITCZ',d:'The rainy belt of rising air near the equator that shifts with the seasons.'},{lvl:'honors',t:'Convection',d:'Warm fluid rising and cool fluid sinking.'},
    {lvl:'ap',t:'Coriolis effect',d:'The apparent deflection of moving air caused by Earth’s rotation: right in the north, left in the south.'},{lvl:'ap',t:'Albedo',d:'The fraction of sunlight a surface reflects (0–1).'},{lvl:'ap',t:'Trade winds and westerlies',d:'Surface winds from the east between 0–30° and from the west between 30–60°.'}],
  about:'<p><b>Solar geometry:</b> declination δ = −tilt × cos(2π(day + 10)/365). Noon sun angle = 90° − |latitude − δ|. Day length comes from the sunrise hour angle, cos h₀ = −tan(latitude) tan(δ).</p><p><b>Daily average sunlight</b> at the top of the atmosphere: Q = (S₀/π)(1/r²)(h₀ sinφ sinδ + cosφ cosδ sin h₀), with S₀ = 1361 W/m² and r the Earth–Sun distance in AU (eccentricity 0.0167, closest about January 3).</p><p><b>Simplified:</b> no atmosphere, clouds or refraction. The wind map is the classic three-cell model; real winds are broken up by continents and seasons. The orbit drawing is not to scale.</p>'
};

const OC={x:218,y:245,rx:152,ry:80};
function earthPos(sim){const d=doy(sim),ph=Math.PI+2*Math.PI*(d-171)/365;return [OC.x+OC.rx*Math.cos(ph),OC.y-OC.ry*Math.sin(ph)];}
function drawEarth(ctx,x,y,R,tilt,sunX,sunY,lat,k){const ang=Math.atan2(sunY-y,sunX-x);
  ctx.fillStyle='#1d2a44';ctx.beginPath();ctx.arc(x,y,R,0,6.29);ctx.fill();
  ctx.fillStyle='#3d82c8';ctx.beginPath();ctx.arc(x,y,R,ang-Math.PI/2,ang+Math.PI/2);ctx.closePath();ctx.fill();
  const ax=Math.sin(rad(tilt)),ay=-Math.cos(rad(tilt));ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-ax*R*1.5,y-ay*R*1.5);ctx.lineTo(x+ax*R*1.5,y+ay*R*1.5);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-ay*R,y+ax*R);ctx.lineTo(x+ay*R,y-ax*R);ctx.stroke();
  const s=Math.sin(rad(lat));ctx.fillStyle='#ff3b52';ctx.beginPath();ctx.arc(x+ax*R*s,y+ay*R*s,3.2,0,6.29);ctx.fill();
  txt(ctx,'N',x+ax*R*1.75,y+ay*R*1.75+4,{s:11*k,w:700,a:'center'});}
function drawOrbit(sim,ctx,k,t){const s=sun(sim),p=sim.p,hon=atLeast('honors');
  txt(ctx,'Earth’s orbit (not to scale)',OC.x,30,{s:13*k,w:700,a:'center'});
  ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([5,5]);ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(OC.x,OC.y,OC.rx,OC.ry,0,0,6.29);ctx.stroke();ctx.setLineDash([]);
  const g=ctx.createRadialGradient(OC.x,OC.y,4,OC.x,OC.y,44);g.addColorStop(0,'#fff7c0');g.addColorStop(0.5,'#ffcc33');g.addColorStop(1,'rgba(255,170,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(OC.x,OC.y,44,0,6.29);ctx.fill();
  txt(ctx,'Sun',OC.x,OC.y+4,{s:12*k,w:700,a:'center',c:'#5a3a00'});
  [[171,'Jun 21'],[264,'Sep 22'],[354,'Dec 21'],[79,'Mar 20']].forEach(([d,l])=>{const ph=Math.PI+2*Math.PI*(d-171)/365,x=OC.x+(OC.rx+30)*Math.cos(ph),y=OC.y-(OC.ry+26)*Math.sin(ph);txt(ctx,l,x,y+4,{s:11.5*k,w:600,a:'center',c:PAL['cv-soft']});
    if(Math.abs(((s.d-d)+365)%365)>10&&Math.abs(((d-s.d)+365)%365)>10){const ex=OC.x+OC.rx*Math.cos(ph),ey=OC.y-OC.ry*Math.sin(ph);ctx.globalAlpha=.28;drawEarth(ctx,ex,ey,12,p.tilt,OC.x,OC.y,p.lat,k);ctx.globalAlpha=1;}});
  const e=earthPos(sim);drawEarth(ctx,e[0],e[1],20,p.tilt,OC.x,OC.y,p.lat,k);
  txt(ctx,dateStr(s.d),e[0],e[1]+40,{s:12.5*k,w:700,a:'center'});
  if(hon)txt(ctx,'Distance '+(149.6*s.r).toFixed(1)+' million km',OC.x,430,{s:12*k,a:'center',c:PAL['cv-soft']});
  // sunlight panel
  const X0=440,X1=790,GY=220,place=Math.abs(p.lat-39.7)<0.3?'Denver':latStr(p.lat);
  txt(ctx,'Noon sunlight at '+place,X0,30,{s:13*k,w:700});
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(X0,GY,X1-X0,10);
  if(s.elev>0.5){const el=rad(s.elev),w=56,L=w/Math.sin(el),cx=650,dx=Math.cos(el),dy=Math.sin(el),back=Math.min(160/dy,260);
    const a1=[cx-L/2,GY],a2=[cx+L/2,GY];ctx.save();ctx.beginPath();ctx.rect(X0,40,X1-X0,GY-30);ctx.clip();ctx.fillStyle='rgba(255,196,40,'+(0.15+0.5*Math.sin(el))+')';ctx.beginPath();ctx.moveTo(a1[0],a1[1]);ctx.lineTo(a2[0],a2[1]);ctx.lineTo(a2[0]-dx*back,a2[1]-dy*back);ctx.lineTo(a1[0]-dx*back,a1[1]-dy*back);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffcc33';ctx.beginPath();ctx.arc(cx-dx*(back+14),GY-dy*(back+14),13,0,6.29);ctx.fill();ctx.restore();
    ctx.fillStyle='rgba(255,140,0,'+(0.35+0.6*Math.sin(el))+')';ctx.fillRect(Math.max(X0,a1[0]),GY,Math.min(X1,a2[0])-Math.max(X0,a1[0]),10);
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(a2[0],GY,34,Math.PI,Math.PI+el);ctx.stroke();
    txt(ctx,s.elev.toFixed(1)+'°',a2[0]-44,GY-8,{s:12.5*k,w:700,a:'right'});
    txt(ctx,'Same beam spread over '+(1/Math.sin(el)).toFixed(2)+'× the ground',X0,GY+30,{s:12*k,c:PAL['cv-soft']});}
  else{txt(ctx,'The Sun stays below the horizon all day (polar night).',X0,GY-60,{s:12.5*k,w:600});}
  // day-length bar
  const by=275,bw=X1-X0;txt(ctx,'Daylight: '+s.day.toFixed(1)+' hours',X0,by-8,{s:12.5*k,w:700});
  ctx.fillStyle='#1d2a44';rr(ctx,X0,by,bw,20,5);ctx.fill();const dw=bw*s.day/24;ctx.fillStyle='#ffcc33';rr(ctx,X0+bw/2-dw/2,by,Math.max(0.1,dw),20,5);ctx.fill();
  [0,6,12,18,24].forEach(h=>txt(ctx,h===12?'noon':(h%24===0?'midnight':h+':00'),X0+bw*h/24,by+34,{s:10.5*k,a:h===0?'left':h===24?'right':'center',c:PAL['cv-soft']}));
  // mini globe: sunlight from the left hits the subsolar latitude straight on
  const gx=495,gy=390,gr=40;ctx.save();ctx.translate(gx,gy);ctx.rotate(-rad(s.dl));
  ctx.fillStyle='#1d2a44';ctx.beginPath();ctx.arc(0,0,gr,0,6.29);ctx.fill();ctx.restore();ctx.fillStyle='#3d82c8';ctx.beginPath();ctx.arc(gx,gy,gr,Math.PI/2,Math.PI*1.5);ctx.closePath();ctx.fill();
  ctx.save();ctx.translate(gx,gy);ctx.rotate(-rad(s.dl));ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-gr,0);ctx.lineTo(gr,0);ctx.stroke();
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-gr*1.3);ctx.lineTo(0,gr*1.3);ctx.stroke();
  const ly=-gr*Math.sin(rad(p.lat)),lx=-gr*Math.cos(rad(p.lat));ctx.fillStyle='#ff3b52';ctx.beginPath();ctx.arc(lx,ly,3.5,0,6.29);ctx.fill();ctx.restore();
  ctx.strokeStyle='#ffcc33';ctx.lineWidth=2;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(gx-gr-46,gy+i*14);ctx.lineTo(gx-gr*Math.cos(Math.asin(clamp(i*14/gr,-1,1)))-2,gy+i*14);ctx.stroke();}
  if(hon)txt(ctx,'Sun overhead at '+latStr(s.dl),gx+gr+12,gy-6,{s:12*k,w:600});
  txt(ctx,'● = your latitude',gx+gr+12,gy+14,{s:11.5*k,c:PAL['cv-soft']});
  if(atLeast('ap')){const a=ALB[p.surface],ax=628,ay=355;ctx.fillStyle=a.c;rr(ctx,ax,ay+55,105,24,4);ctx.fill();
    ctx.strokeStyle='#ffb000';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(ax+20,ay);ctx.lineTo(ax+40,ay+52);ctx.stroke();ctx.lineWidth=Math.max(1,6*a.a);ctx.beginPath();ctx.moveTo(ax+46,ay+52);ctx.lineTo(ax+66,ay+4);ctx.stroke();
    txt(ctx,'reflects '+Math.round(a.a*100)+'%',ax+70,ay+18,{s:11*k,c:PAL['cv-soft']});}
}
function drawWinds(sim,ctx,k,t){const p=sim.p,s=sun(sim),cx=300,cy=228,R=185,cor=atLeast('ap')&&p.coriolis,v=sim.vis;
  const Y=lat=>cy-R*Math.sin(rad(lat)),HW=lat=>R*Math.cos(rad(lat));
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.clip();ctx.fillStyle='#2f6fa8';ctx.fillRect(cx-R,cy-R,2*R,2*R);
  const band=(a,b,c)=>{ctx.fillStyle=c;ctx.fillRect(cx-R,Y(b),2*R,Y(a)-Y(b));};
  band(-12,12,'#3f8f4a');band(18,36,'#d8b46a');band(-36,-18,'#d8b46a');band(38,60,'#6fa05a');band(-60,-38,'#6fa05a');band(66,90,'#e8eef4');band(-90,-66,'#e8eef4');
  ctx.restore();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=1;[0,30,60,-30,-60].forEach(l=>{ctx.beginPath();ctx.moveTo(cx-HW(l),Y(l));ctx.lineTo(cx+HW(l),Y(l));ctx.stroke();txt(ctx,(l===0?'0°':Math.abs(l)+'°'+(l>0?'N':'S')),cx-HW(l)-6,Y(l)+4,{s:11.5*k,w:600,a:'right'});});
  // ITCZ clouds follow the overhead Sun
  const itcz=0.55*s.dl;ctx.fillStyle='rgba(255,255,255,.92)';v.cl.forEach((c,i)=>{const x=cx-R*0.8+c[0]*R*1.6,y=Y(itcz+(c[1]-0.5)*8);if(Math.abs(x-cx)<HW(itcz)-12){ctx.beginPath();ctx.arc(x,y,7,0,6.29);ctx.arc(x+8,y-3,6,0,6.29);ctx.fill();}});
  // surface winds
  const arrow=(x,y,vx,vy,col)=>{const L=26,ex=x+vx*L,ey=y+vy*L;ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke();
    const a=Math.atan2(vy,vx);ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex-9*Math.cos(a-0.5),ey-9*Math.sin(a-0.5));ctx.lineTo(ex-9*Math.cos(a+0.5),ey-9*Math.sin(a+0.5));ctx.closePath();ctx.fill();};
  const phase=RM?0:(t*0.25)%1;
  [[15,1,'Trade winds'],[45,-1,'Westerlies'],[75,1,'Polar easterlies']].forEach(([l,toEq,name])=>{[1,-1].forEach(h=>{const lat=l*h;let vx=0,vy=toEq*h;// toward equator: NH down (+y)
      if(cor){const th=rad(65)*(h>0?1:-1),c=Math.cos(th),sn=Math.sin(th);const nx=vx*c-vy*sn,ny=vx*sn+vy*c;vx=nx;vy=ny;}
      const n=l===75?2:3;for(let i=0;i<n;i++){const f=(i+0.5)/n,x=cx-HW(lat)*0.75+f*HW(lat)*1.5+(phase-0.5)*10*vx,y=Y(lat)+(phase-0.5)*10*vy-vy*13;arrow(x-vx*13,y,vx,vy,'#fff');}
      if(h>0&&atLeast('honors'))pill(ctx,name,cx,Y(lat)+(l===75?-2:-1),'rgba(0,0,0,.55)','#fff',11*k);});});
  // labels
  txt(ctx,'Rising air: rain (ITCZ)',cx-R-10,Y(itcz)-14,{s:11.5*k,w:600,a:'right'});
  txt(ctx,'Sinking dry air: deserts',cx-R+10,Y(30)-24,{s:11.5*k,w:600,a:'right'});
  txt(ctx,'Sinking dry air: deserts',cx-R+10,Y(-30)+30,{s:11.5*k,w:600,a:'right'});
  // convection cells (altitude to the right)
  const X0=540,X1=770;txt(ctx,'Convection cells',(X0+X1)/2,26,{s:13*k,w:700,a:'center'});
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X0,Y(90));ctx.lineTo(X0,Y(-90));ctx.stroke();
  txt(ctx,'surface',X0,Y(-90)+16,{s:10.5*k,a:'center',c:PAL['cv-soft']});txt(ctx,'tropopause',X1,Y(-90)+16,{s:10.5*k,a:'center',c:PAL['cv-soft']});
  const cells=[[0,30,1,'Hadley','#d2402a'],[30,60,-1,'Ferrel','#2d6bd2'],[60,88,1,'Polar','#7b3fe4']];
  cells.forEach(([a,b,dir,name,col])=>{[1,-1].forEach(h=>{const ya=Y(a*h),yb=Y(b*h),x0=X0+8,x1=X1-8,top=Math.min(ya,yb)+4,bot=Math.max(ya,yb)-4;
      ctx.strokeStyle=col;ctx.lineWidth=2.5;rr(ctx,x0,top,x1-x0,bot-top,14);ctx.stroke();
      // moving dots: rise at latitude a (dir 1) or b (dir -1)
      const per=2*(x1-x0)+2*(bot-top),n=5;for(let i=0;i<n;i++){let d=((t*60+i*per/n)%per+per)%per;const rise=dir>0?ya:yb;const sink=dir>0?yb:ya;
        // path: at rising latitude go surface→top, then along top to sinking lat, then down, then back along surface
        const H=bot-top,Wd=x1-x0;let x,y;const yR=rise<sink?top:bot,yS=rise<sink?bot:top;
        if(d<Wd){x=x0+d;y=yR;}else if(d<Wd+H){x=x1;y=yR+(yS-yR)*(d-Wd)/H;}else if(d<2*Wd+H){x=x1-(d-Wd-H);y=yS;}else{x=x0;y=yS+(yR-yS)*(d-2*Wd-H)/H;}
        ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,4,0,6.29);ctx.fill();}
      if(h>0)txt(ctx,name,(x0+x1)/2,(top+bot)/2+4,{s:12*k,w:700,a:'center',c:col});});});
}

BioLab.register(SEASONS);
})();
