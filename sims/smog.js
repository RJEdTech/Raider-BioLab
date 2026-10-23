(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText,fmtNum}=BioLab.h;

/* ---- model helpers ---- */
function sunAt(h,season){const len=season==='summer'?15:9.5,rise=12-len/2,x=(h-rise)/len;return x<=0||x>=1?0:Math.sin(Math.PI*x)*(season==='summer'?1:0.6);}
function traffic(h){const g=(c,w)=>Math.exp(-Math.pow((h-c)/w,2));return 0.25+1.1*g(7.6,1.1)+0.9*g(17.2,1.4)+(h>8&&h<17?0.45:0)+(h>5&&h<22?0.15:0);}
const hourOf=t=>((t%24)+24)%24;
function clockStr(t){const h=hourOf(t),hh=Math.floor(h),mm=Math.floor((h-hh)*60/15)*15;const ap=hh<12?'AM':'PM';const h12=hh%12===0?12:hh%12;return h12+':'+String(mm).padStart(2,'0')+' '+ap;}
/* EPA AQI breakpoints (instantaneous values used as a teaching simplification) */
function aqiFrom(c,bp){for(const b of bp){if(c<=b[1])return b[2]+(b[3]-b[2])*(c-b[0])/(b[1]-b[0]);}return 300;}
const O3BP=[[0,54,0,50],[54,70,50,100],[70,85,100,150],[85,105,150,200],[105,200,200,300]];
const NO2BP=[[0,53,0,50],[53,100,50,100],[100,360,100,150],[360,649,150,200],[649,1249,200,300]];
const PMBP=[[0,9,0,50],[9,35.4,50,100],[35.4,55.4,100,150],[55.4,125.4,150,200],[125.4,225.4,200,300]];
const CATS=[[50,'Good','#3aa655'],[100,'Moderate','#e0b100'],[150,'Unhealthy for sensitive groups','#e8742a'],[200,'Unhealthy','#d43d3d'],[300,'Very unhealthy','#8f3f97'],[1e9,'Hazardous','#7e0023']];
const cat=a=>CATS.find(c=>a<=c[0]);

const SMOG={
  id:'smog',hash:'smog',apUnit:14,order:1,kind:'Simulation',tab:'Denver smog and thermal inversions',
  card:'Watch a Front Range day: rush-hour exhaust, afternoon ozone, and the winter inversion that traps the brown cloud.',
  title:'Denver smog and thermal inversions',
  lede:{bio:'Cars and power plants release invisible gases. Sunlight cooks them into ozone smog, and a thermal inversion can trap dirty air over Denver like a lid on a pot.',
        honors:'Primary pollutants (NO, NO₂, VOCs, particles) come straight from tailpipes and smokestacks. Ozone is a secondary pollutant: it forms in the air when sunlight drives reactions between them.',
        ap:'Track the photochemical cycle hour by hour. NO peaks at rush hour, NO₂ follows, and ozone builds into the afternoon. Test NOx and VOC controls, inversions and wind against the Air Quality Index.'},
  scale:'A slice of the Denver metro area about 40 km wide, looking north, with the Rocky Mountains to the west. The air layer shown is the lowest 3 km of the atmosphere.',
  timeScale:1,dtMax:0.004,prewarm:24,sampleDt:0.1,window:24,unit:'h',timeLabel:'Time',chChange:1,chReveal:16,
  clock(sim){const day=Math.floor(sim.t/24)+1;return 'Day '+day+' · '+clockStr(sim.t);},
  controls:[
    {id:'season',label:'Season',type:'seg',def:'summer',lvl:'bio',options:[{v:'summer',l:'Summer'},{v:'winter',l:'Winter'}],help:'Summer has longer, stronger sunlight.'},
    {id:'traffic',label:'Traffic',type:'range',min:0,max:200,step:5,def:100,unit:'%',lvl:'bio',help:'100% is a normal weekday.'},
    {id:'wind',label:'Wind speed',type:'range',min:0,max:10,step:0.5,def:3,unit:' m/s',lvl:'bio'},
    {id:'inv',label:'Thermal inversion',help:'A warm layer of air sits on top of cold air near the ground',type:'toggle',def:false,lvl:'bio'},
    {id:'plant',label:'Power plant emissions',type:'range',min:0,max:200,step:5,def:100,unit:'%',lvl:'honors'},
    {id:'voc',label:'VOCs (gasoline vapor, paints, solvents)',type:'range',min:0,max:200,step:5,def:100,unit:'%',lvl:'ap'}
  ],
  init(){return {no:5,no2:15,o3:35,voc:60,pm:8,H:250,S:0,f:0,dayMax:0,dayMaxH:0,lastMax:NaN,lastMaxH:NaN,day:0};},
  step(sim,dt){const p=sim.p,s=sim.st,h=hourOf(sim.t),S=sunAt(h,p.season);
    let H=p.season==='summer'?250+2300*Math.pow(S,0.7):200+900*Math.pow(S/0.6,0.7);
    let V=0.06+0.32*p.wind/5;
    if(p.inv){H=Math.min(H,260);V*=0.5;}
    const f=traffic(h)*p.traffic/100;
    const Enox=f*7000+p.plant/100*1200,Evoc=f*9000*p.voc/100+1500,Epm=f*500+p.plant/100*150;
    const j=22*S,k1=0.5,kv=0.35*(p.season==='summer'?1:0.25),r3=0.08*S;
    const photo=j*s.no2,tit=k1*s.no*s.o3,conv=kv*S*s.voc*s.no/(s.no+8),dep=14/H;
    s.no+=dt*(0.9*Enox/H+photo-tit-conv-V*s.no);
    s.no2+=dt*(0.1*Enox/H-photo+tit+conv-r3*s.no2-V*(s.no2-2));
    s.o3+=dt*(photo-tit-dep*s.o3-V*(s.o3-45));
    s.voc+=dt*(Evoc/H-0.05*S*s.voc-V*(s.voc-25));
    s.pm+=dt*(Epm/H+0.01*s.no2-V*(s.pm-5));
    for(const k of ['no','no2','o3','voc','pm'])s[k]=Math.max(0,s[k]);
    s.H=H;s.S=S;s.f=f;s.photo=photo;
    const day=Math.floor((sim.t+dt)/24);if(day!==s.day){s.lastMax=s.dayMax;s.lastMaxH=s.dayMaxH;s.dayMax=0;s.day=day;}
    if(s.o3>s.dayMax){s.dayMax=s.o3;s.dayMaxH=h;}},
  afterPrewarm(sim){const s=sim.st;s.day=0;},
  metrics:[
    {id:'o3',label:'Ground-level ozone',unit:'ppb',lvl:'bio',min:0,max:120,d:0,get:s=>s.st.o3},
    {id:'aqi',label:'Air Quality Index',unit:'',lvl:'bio',min:0,max:200,d:0,get:s=>SMOG.aqi(s)},
    {id:'aqicat',label:'Air quality',unit:'',lvl:'bio',text:true,get:s=>cat(SMOG.aqi(s))[1]},
    {id:'no2',label:'NO₂',unit:'ppb',lvl:'honors',min:0,max:120,d:0,get:s=>s.st.no2},
    {id:'pm',label:'Particles (PM2.5)',unit:'µg/m³',lvl:'honors',min:0,max:60,d:0,get:s=>s.st.pm},
    {id:'mix',label:'Mixing height',unit:'m',lvl:'honors',min:0,max:3000,d:0,get:s=>s.st.H},
    {id:'no',label:'NO',unit:'ppb',lvl:'ap',min:0,max:160,d:0,get:s=>s.st.no},
    {id:'peak',label:'Yesterday’s ozone peak',unit:'',lvl:'ap',text:true,noTrial:false,get:s=>Number.isFinite(s.st.lastMax)?Math.round(s.st.lastMax)+' ppb at '+clockStr(s.st.lastMaxH):'—'}
  ],
  aqi(sim){const s=sim.st;return Math.max(aqiFrom(s.o3,O3BP),aqiFrom(s.no2,NO2BP),aqiFrom(s.pm,PMBP));},
  graphs:[
    {id:'o3',label:'Ozone',lines:['o3']},
    {id:'aqi',label:'Air Quality Index',lines:['aqi']},
    {id:'no2',label:'NO₂',lvl:'honors',lines:['no2']},
    {id:'pm',label:'Particles (PM2.5)',lvl:'honors',lines:['pm']},
    {id:'chem',label:'NO, NO₂ and ozone together',lvl:'ap',lines:['no','no2','o3'],yl:'ppb'}
  ],
  defaultGraph:'o3',
  challenges:[
    {lvl:'bio',q:'Traffic peaks during morning rush hour, around 7 to 8 AM. When does ground-level ozone peak on a summer day?',
     choices:['During morning rush hour','Around midday to early afternoon, hours after rush hour','In the middle of the night'],correct:1,
     baseline:{season:'summer'},change:{},changeText:'Watching a summer day from midnight',watch:'o3',at:0.5,reveal:16,
     explain:{bio:'Cars release the ingredients in the morning, but ozone is cooked by sunlight. It keeps building while the Sun is high, so it peaks around midday to early afternoon, long after the traffic jam.',
              honors:'Ozone is a secondary pollutant. Morning exhaust supplies NO and VOCs; strong midday sunlight splits NO₂ and builds ozone, so the peak lags rush hour by several hours.',
              ap:'NO peaks with the morning commute, NO₂ rises next as VOC radicals convert NO to NO₂, and O₃ accumulates under strong photolysis into the early afternoon. Check “Yesterday’s ozone peak” to see the hour.'}},
    {lvl:'bio',q:'On a still winter morning, a thermal inversion forms over Denver. What happens to the air near the ground during the day?',
     choices:['Pollution builds up and air quality gets worse','Pollution blows away faster','Nothing changes'],correct:0,
     baseline:{season:'winter',wind:1.5},change:{inv:true},changeText:'Inversion forms',watch:'aqi',at:2,reveal:15,
     explain:{bio:'A warm layer of air sits on top of the cold air like a lid. Exhaust can’t rise and mix, so it piles up near the ground. That is the “brown cloud” Denver sees on winter mornings.',
              honors:'Normally air cools with height, so warm polluted air rises and mixes. In an inversion the air above is warmer, so the surface air can’t rise. The mixing layer stays a few hundred meters thick and NO₂ and particles pile up.'}},
    {lvl:'bio',q:'A strong wind (8 m/s) picks up on a hazy winter day. What happens to the Air Quality Index?',
     choices:['It gets worse','It improves (the number drops)','It stays the same'],correct:1,
     baseline:{season:'winter',wind:1},change:{wind:8},changeText:'Wind rises to 8 m/s',watch:'aqi',at:6,reveal:13,
     explain:'Wind carries polluted air away and brings in cleaner air, so concentrations drop. That is why the brown cloud clears when a storm or chinook wind arrives.'},
    {lvl:'honors',q:'Which of these pollutants is NOT released directly from tailpipes or smokestacks?',
     choices:['Nitrogen oxides (NO and NO₂)','Ground-level ozone (O₃)','Particles (PM2.5)','Volatile organic compounds (VOCs)'],correct:1,instant:true,
     explain:'Ozone is a secondary pollutant. It forms in the air when sunlight drives reactions between NOx and VOCs. The others are primary pollutants that come straight from the source.'},
    {lvl:'honors',q:'Same traffic, but it is winter instead of summer. What happens to the afternoon ozone level?',
     choices:['Higher in winter','Lower in winter','The same'],correct:1,
     baseline:{season:'summer'},change:{season:'winter'},changeText:'Switched to winter',watch:'o3',at:10,reveal:38,
     explain:'Winter sunlight is weaker and the days are shorter, so less NO₂ is split and the reactions run slower. Winter brings NO₂ and particle problems (especially with inversions); summer brings ozone.'},
    {lvl:'ap',q:'On a summer day, VOC emissions (gasoline vapor, paints, solvents) are cut to 30% with no change in traffic NOx. What happens to the afternoon ozone peak?',
     choices:['It drops','It rises','No change'],correct:0,
     baseline:{season:'summer'},change:{voc:30},changeText:'VOCs cut to 30%',watch:'o3',at:1,reveal:38,
     explain:'VOC-derived peroxy radicals convert NO to NO₂ without using up ozone. Fewer VOCs means fewer conversions, so less net ozone builds up. This is why Colorado regulates oil-and-gas and gasoline vapors as well as NOx.'},
    {lvl:'ap',q:'Why is ozone lowest right next to a busy highway at night?',
     choices:['Ozone needs darkness to break down','Fresh NO from exhaust destroys ozone: NO + O₃ → NO₂ + O₂','Cars absorb ozone through their air filters'],correct:1,instant:true,
     explain:'With no sunlight to split NO₂, nothing rebuilds ozone, and fresh NO from tailpipes reacts with it (titration). Urban ozone is often lower than rural ozone at night for this reason.'}
  ],
  initVis(sim){const r=rng(21),v=sim.vis;v.cars=[];for(let i=0;i<40;i++)v.cars.push({x:r()*800,lane:i%2,c:['#c0392b','#2e86de','#f1c40f','#7f8c8d','#ecf0f1','#27ae60'][i%6],ph:r()});
    v.part=[];for(let i=0;i<160;i++)v.part.push([r()*800,r(),r()*6.28,r()]);v.puff=[];v.stars=[];for(let i=0;i<40;i++)v.stars.push([r()*800,r()*150]);
    v.bld=[];let x=300;while(x<560){const w=14+r()*20,h=30+r()*(x>380&&x<480?110:50);v.bld.push([x,w,h]);x+=w+3;}},
  draw(sim,ctx,vdt,k,t){
    const s=sim.st,p=sim.p,v=sim.vis,h=hourOf(sim.t),S=s.S,hon=atLeast('honors'),ap=atLeast('ap');
    const GY=370; // ground level
    // sky: blend night→day
    const day=clamp(S/(p.season==='summer'?1:0.6),0,1),tw=clamp(sunAt(h,'summer')*3,0,1);
    const skyTop=mix([18,24,52],[92,156,222],day),skyBot=mix([40,48,86],[196,224,245],day);
    const g=ctx.createLinearGradient(0,0,0,GY);g.addColorStop(0,rgb(skyTop));g.addColorStop(1,rgb(skyBot));ctx.fillStyle=g;ctx.fillRect(0,0,800,GY);
    if(day<0.3){ctx.fillStyle='rgba(255,255,255,'+(0.6*(1-day/0.3))+')';v.stars.forEach(st=>{ctx.fillRect(st[0],st[1],1.6,1.6);});}
    // sun / moon arc
    const len=p.season==='summer'?15:9.5,rise=12-len/2,x01=(h-rise)/len;
    if(x01>0&&x01<1){const sx=740-x01*680,sy=GY-40-Math.sin(Math.PI*x01)*(p.season==='summer'?300:190);
      ctx.fillStyle='rgba(255,220,90,.35)';ctx.beginPath();ctx.arc(sx,sy,30,0,6.29);ctx.fill();ctx.fillStyle='#ffd34d';ctx.beginPath();ctx.arc(sx,sy,17,0,6.29);ctx.fill();
      if(ap&&S>0.2)pill(ctx,'NO₂ + sunlight → NO + O,  O + O₂ → O₃',600,78,'rgba(255,240,200,.92)','#5a3b00',11*k);}
    else{ctx.fillStyle='#e8e6d8';ctx.beginPath();ctx.arc(640,70,13,0,6.29);ctx.fill();ctx.fillStyle=rgb(skyTop);ctx.beginPath();ctx.arc(646,66,12,0,6.29);ctx.fill();}
    // mountains (west = left)
    ctx.fillStyle=day>0.4?'#6d7f8f':'#2c3446';ctx.beginPath();ctx.moveTo(0,GY);ctx.lineTo(0,190);ctx.lineTo(40,150);ctx.lineTo(80,190);ctx.lineTo(120,140);ctx.lineTo(165,200);ctx.lineTo(200,175);ctx.lineTo(250,GY);ctx.closePath();ctx.fill();
    ctx.fillStyle=p.season==='winter'?'#f2f4f7':'#cfd8de';ctx.globalAlpha=day>0.4?0.95:0.5;
    [[40,150,22],[120,140,24]].forEach(m=>{ctx.beginPath();ctx.moveTo(m[0],m[1]);ctx.lineTo(m[0]-m[2]*0.6,m[1]+m[2]*0.7);ctx.lineTo(m[0]+m[2]*0.6,m[1]+m[2]*0.7);ctx.closePath();ctx.fill();});ctx.globalAlpha=1;
    // city skyline
    v.bld.forEach(b=>{ctx.fillStyle=day>0.4?'#55606e':'#1f2532';ctx.fillRect(b[0],GY-b[2],b[1],b[2]);if(day<0.5){ctx.fillStyle='rgba(255,214,120,.8)';for(let yy=GY-b[2]+6;yy<GY-6;yy+=9)for(let xx=b[0]+3;xx<b[0]+b[1]-3;xx+=6)if(((xx*7+yy*13)%5)<2)ctx.fillRect(xx,yy,2.5,3);}});
    // power plant (east = right)
    ctx.fillStyle=day>0.4?'#7b6f66':'#2b2725';ctx.fillRect(640,GY-55,90,55);ctx.fillRect(668,GY-120,14,70);ctx.fillRect(700,GY-110,12,60);
    // ground + highway
    ctx.fillStyle=p.season==='winter'?(day>0.4?'#d9dccf':'#5a5f63'):(day>0.4?'#9caf6e':'#3a4630');ctx.fillRect(0,GY,800,80);
    ctx.fillStyle='#3d4147';ctx.fillRect(0,GY+18,800,26);ctx.strokeStyle='#e8d36a';ctx.setLineDash([14,10]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,GY+31);ctx.lineTo(800,GY+31);ctx.stroke();ctx.setLineDash([]);
    // cars: count follows traffic now
    const nCars=Math.round(clamp(s.f/1.6,0,1)*v.cars.length);
    v.cars.forEach((c,i)=>{if(i>=nCars)return;const dir=c.lane?1:-1;c.x+=dir*(70+30*c.ph)*vdt*(1-0.5*clamp(s.f-1,0,1));if(c.x>820)c.x=-20;if(c.x<-20)c.x=820;
      const y=GY+(c.lane?36:23);rr(ctx,c.x-9,y-5,18,8,3);ctx.fillStyle=c.c;ctx.fill();if(day<0.4){ctx.fillStyle='#fff3b0';ctx.fillRect(c.x+(dir>0?8:-10),y-3,2,3);}
      if(!RM&&Math.random()<vdt*3){v.puff.push({x:c.x-dir*10,y:y-2,life:1.5,r:2+Math.random()*2,kind:'car'});}});
    // stack plumes
    if(p.plant>0&&Math.random()<vdt*6*p.plant/100){v.puff.push({x:675,y:GY-122,life:3,r:4,kind:'stack'});v.puff.push({x:706,y:GY-112,life:3,r:4,kind:'stack'});}
    const topY=GY-clamp(s.H/3000,0,1)*340; // mixing-layer top on screen
    v.puff.forEach(q=>{q.life-=vdt;q.y-=(q.kind==='stack'?14:8)*vdt;q.x+=(p.wind*6+2)*vdt;if(q.y<topY+6)q.y=topY+6;q.r+=3*vdt;
      ctx.fillStyle=q.kind==='stack'?'rgba(150,140,130,'+clamp(q.life/3,0,1)*0.45+')':'rgba(120,110,100,'+clamp(q.life/1.5,0,1)*0.35+')';ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,6.29);ctx.fill();});
    v.puff=v.puff.filter(q=>q.life>0&&q.x<820);if(v.puff.length>140)v.puff.splice(0,v.puff.length-140);
    // haze in the mixing layer: brown from NO₂ + particles
    const haze=clamp((s.no2*0.9+s.pm*1.6)/260,0,0.6);
    const hg=ctx.createLinearGradient(0,topY,0,GY);hg.addColorStop(0,'rgba(150,100,50,'+haze*0.35+')');hg.addColorStop(1,'rgba(140,90,45,'+haze+')');ctx.fillStyle=hg;ctx.fillRect(250,topY,550,GY-topY);
    ctx.fillStyle='rgba(140,90,45,'+haze*0.6+')';ctx.fillRect(0,Math.max(topY,GY-120),250,GY-Math.max(topY,GY-120));
    // ozone molecules (O₃ = three linked spheres) in the mixing layer
    const nO3=Math.round(clamp(s.o3/110,0,1)*60),nNO2=hon?Math.round(clamp(s.no2/110,0,1)*45):0;
    for(let i=0;i<nO3+nNO2&&i<v.part.length;i++){const q=v.part[i],px=(q[0]+t*(p.wind*4+3))%800,py=topY+12+q[1]*(GY-topY-24)+(RM?0:Math.sin(t*1.3+q[2])*3);
      if(i<nO3){ctx.fillStyle='#4f7fd6';[-5,0,5].forEach((dx,j)=>{ctx.beginPath();ctx.arc(px+dx,py+(j===1?-3:0),2.6,0,6.29);ctx.fill();});}
      else{ctx.fillStyle='#9a5a22';ctx.beginPath();ctx.arc(px,py,2.8,0,6.29);ctx.fill();ctx.fillStyle='#d24b3b';ctx.beginPath();ctx.arc(px-3.5,py+1.5,2,0,6.29);ctx.arc(px+3.5,py+1.5,2,0,6.29);ctx.fill();}}
    // mixing layer top / inversion lid
    ctx.setLineDash([7,6]);ctx.strokeStyle=p.inv?'#d9534f':'rgba(255,255,255,.75)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(250,topY);ctx.lineTo(800,topY);ctx.stroke();ctx.setLineDash([]);
    pill(ctx,p.inv?'Inversion lid: warm air on top':(hon?'Top of mixing layer ('+Math.round(s.H)+' m)':'Top of the mixing air'),540,topY-12,p.inv?'#c0392b':'rgba(30,40,60,.75)','#fff',11*k);
    // temperature profile inset
    const ix=255,iy=12,iw=162,ih=132;ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.92;rr(ctx,ix,iy,iw,ih,8);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,ix,iy,iw,ih,8);ctx.stroke();
    txt(ctx,'Air temperature with height',ix+iw/2,iy+15,{s:10.5*k,w:700,a:'center'});
    const ax0=ix+14,ay0=iy+ih-32,aw=iw-26,ah=ih-58;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ax0,ay0-ah);ctx.lineTo(ax0,ay0);ctx.lineTo(ax0+aw,ay0);ctx.stroke();
    txt(ctx,'↑ higher',ax0+4,ay0-ah+4,{s:9.5*k,c:PAL['cv-soft']});txt(ctx,'warmer →',ax0+aw,ay0+11,{s:9.5*k,c:PAL['cv-soft'],a:'right'});
    ctx.strokeStyle=p.inv?'#c0392b':'#2e86de';ctx.lineWidth=2.5;ctx.beginPath();
    if(p.inv){ctx.moveTo(ax0+aw*0.25,ay0);ctx.lineTo(ax0+aw*0.75,ay0-ah*0.35);ctx.lineTo(ax0+aw*0.45,ay0-ah);}else{ctx.moveTo(ax0+aw*0.85,ay0);ctx.lineTo(ax0+aw*0.2,ay0-ah);}ctx.stroke();
    txt(ctx,p.inv?'Warm layer traps cold air':'Cooler as you go up',ix+iw/2,iy+ih-8,{s:10*k,c:p.inv?'#c0392b':'#2e86de',a:'center',w:700});
    // clock + AQI badge
    const a=SMOG.aqi(sim),c=cat(a);
    ctx.fillStyle='rgba(15,20,35,.72)';rr(ctx,10,10,200,46,8);ctx.fill();
    txt(ctx,clockStr(sim.t),20,32,{s:18*k,w:800,c:'#fff'});txt(ctx,(p.season==='summer'?'Summer':'Winter')+' · wind '+p.wind+' m/s',20,49,{s:10.5*k,c:'#dfe6ee'});
    ctx.fillStyle=c[2];rr(ctx,640,10,150,46,8);ctx.fill();const dark=c[1]==='Moderate';
    txt(ctx,'AQI '+Math.round(a),715,30,{s:16*k,w:800,c:dark?'#2a2a2a':'#fff',a:'center'});txt(ctx,c[1].length>20?'Unhealthy (sensitive)':c[1],715,47,{s:10.5*k,w:700,c:dark?'#2a2a2a':'#fff',a:'center'});
    // labels
    txt(ctx,'Rocky Mountains',95,GY-6,{s:11*k,w:700,c:'#fff',a:'center'});txt(ctx,'Downtown Denver',430,GY-6,{s:11*k,w:700,c:'#fff',a:'center'});txt(ctx,'Power plant',690,GY-6,{s:11*k,w:700,c:'#fff',a:'center'});
    // legend
    let lx=12;const ly=440;ctx.fillStyle='#4f7fd6';[-5,0,5].forEach((dx,j)=>{ctx.beginPath();ctx.arc(lx+8+dx,ly-4+(j===1?-3:0),2.6,0,6.29);ctx.fill();});txt(ctx,'ozone (O₃)',lx+20,ly,{s:11*k,c:'#fff'});
    if(hon){lx=110;ctx.fillStyle='#9a5a22';ctx.beginPath();ctx.arc(lx+8,ly-4,2.8,0,6.29);ctx.fill();txt(ctx,'NO₂',lx+18,ly,{s:11*k,c:'#fff'});txt(ctx,'brown haze = NO₂ + particles',lx+52,ly,{s:11*k,c:'#fff'});}
  },
  narrate(sim){const s=sim.st,p=sim.p,h=hourOf(sim.t),hon=atLeast('honors'),a=Math.round(SMOG.aqi(sim)),c=cat(a)[1].toLowerCase();
    if(p.inv&&s.S<0.15)return '<b>Inversion and no sunlight.</b> Exhaust is trapped under the warm layer, so NO₂ and particles pile up near the ground. Air quality: '+c+' (AQI '+a+').';
    if(p.inv)return '<b>The inversion is acting like a lid.</b> The mixing layer is only about '+Math.round(s.H)+' m thick, so pollution can’t spread upward. AQI '+a+' ('+c+').';
    if(s.S<0.05)return h<6||h>20?'<b>Night.</b> No sunlight means no new ozone. Fresh NO from traffic also destroys some of the ozone near roads, so ozone is low.':'<b>The Sun is down.</b> Ozone production has stopped for the day.';
    if(h<10&&s.f>0.9)return '<b>Morning rush hour.</b> Tailpipes pour out NO and VOCs. Ozone is still low, because sunlight hasn’t had time to cook these ingredients.';
    if(s.o3>55&&s.S>0.4)return '<b>Sunlight is turning exhaust into ozone.</b> '+(hon?'NO₂ is split by sunlight and the loose oxygen atom joins O₂ to make O₃.':'Ozone near the ground irritates lungs, especially for kids and people with asthma.')+' Ozone is '+Math.round(s.o3)+' ppb (AQI '+a+').';
    if(p.wind>=6)return '<b>Strong wind</b> is carrying pollution away and mixing in clean air. AQI '+a+'.';
    return 'Ozone is '+Math.round(s.o3)+' ppb and climbing while the Sun is up. Air quality: '+c+' (AQI '+a+').';},
  tour:[
    {title:'A city in a bowl',text:'Denver sits in a valley with the Rocky Mountains to the west. Air can get stuck here, especially on calm days.',focus:[0,130,800,320],speed:1},
    {title:'Primary pollutants',text:{bio:'Cars and the power plant release invisible gases: nitrogen oxides and VOCs (unburned fuel). These are pollutants that come straight from a source.',honors:'Tailpipes and smokestacks emit primary pollutants: NO, some NO₂, volatile organic compounds and particles.'},focus:[0,380,800,60],speed:1},
    {title:'Sunlight cooks the air',text:{bio:'When the Sun is high, its energy breaks apart some of these gases. The pieces join oxygen to make ozone (blue molecules).',honors:'Ozone is a secondary pollutant. Sunlight splits NO₂ into NO and a free oxygen atom, which joins O₂ to form O₃. VOCs help by turning NO back into NO₂ without using up ozone.'},focus:[250,40,550,330],speed:2},
    {title:'Ozone peaks after rush hour',text:'Watch the clock and the graph. Ozone keeps building through midday and peaks in the afternoon, hours after the morning traffic jam.',focus:[630,8,165,52],speed:3},
    {lvl:'honors',title:'The mixing layer',text:'The dashed line is the top of the air that mixes freely. Sunlight warms the ground and lifts this layer to 2–3 km by afternoon, which dilutes pollution. At night it collapses to a few hundred meters.',focus:(sim)=>{const top=370-clamp(sim.st.H/3000,0,1)*340;return [250,top-25,550,60];},speed:2},
    {title:'Thermal inversion',text:'Now a winter inversion: a warm layer sits on top of cold air near the ground. The cold air can’t rise, so exhaust is trapped close to the ground. This is Denver’s “brown cloud.”',focus:[252,10,156,122],speed:2,setup(sim){BioLab.setValues(sim,{season:'winter',inv:true,wind:1.5});}},
    {title:'Wind clears it',text:'A strong wind arrives and sweeps the trapped air out of the valley. Watch the AQI badge improve.',focus:[0,130,800,320],speed:2,setup(sim){BioLab.setValues(sim,{inv:false,wind:8});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{season:'summer',inv:false,wind:3});},
  lab:{bio:'<p><b>Question:</b> When during a summer day is ozone the worst?</p><ol><li>Leave everything at the default (summer, normal traffic).</li><li>Record a trial at 6 AM, 9 AM, noon, 3 PM, 6 PM and 9 PM (pause the clock if you need to).</li><li>Plot your times against ozone.</li></ol><p>Explain why the ozone peak comes later than rush hour.</p>',
       honors:'<p><b>Question:</b> How do inversions and wind change air quality?</p><ol><li>Set winter and record the AQI, NO₂ and PM2.5 at 9 AM.</li><li>Turn on an inversion and record again at 9 AM the next day.</li><li>Repeat with wind at 1, 4 and 8 m/s.</li></ol><p>Explain your results using the idea of a mixing layer.</p>',
       ap:'<p><b>Question:</b> Is Denver’s ozone more sensitive to NOx or to VOCs?</p><ol><li>In summer, record “Yesterday’s ozone peak” at default settings.</li><li>Cut traffic to 50% (NOx and VOCs both drop) and record the next day’s peak.</li><li>Reset, cut only VOCs to 50%, and record again.</li></ol><p><b>Claim–evidence–reasoning:</b> Which control lowers peak ozone more, and why?</p>'},
  terms:[{t:'Primary pollutant',d:'Released directly from a source, like NO from a tailpipe.'},{t:'Ground-level ozone (O₃)',d:'A lung irritant formed when sunlight reacts with NOx and VOCs. Good high in the stratosphere, harmful near the ground.'},{t:'Thermal inversion',d:'A warm layer of air above cooler surface air that stops pollution from rising and mixing.'},{t:'Air Quality Index (AQI)',d:'A 0–500 scale for how polluted the air is. Above 100 is unhealthy for sensitive groups.'},
    {lvl:'honors',t:'Secondary pollutant',d:'Forms in the atmosphere from primary pollutants, like ozone.'},{lvl:'honors',t:'Photochemical smog',d:'A mix of ozone and other pollutants formed by sunlight reacting with NOx and VOCs.'},{lvl:'honors',t:'Mixing height',d:'How high pollution can mix upward. Low on cold nights and during inversions.'},
    {lvl:'ap',t:'VOCs',d:'Volatile organic compounds, such as gasoline vapor and solvents, that speed ozone formation.'},{lvl:'ap',t:'Photolysis',d:'Splitting a molecule with light: NO₂ + sunlight → NO + O.'},{lvl:'ap',t:'NOx titration',d:'Fresh NO destroys ozone (NO + O₃ → NO₂ + O₂), so ozone is low near busy roads at night.'}],
  about:'<p>A one-box model of the air over the city. Emissions follow a weekday traffic pattern plus a steady power plant. Sunlight follows the season. Chemistry includes NO₂ photolysis, NO + O₃ titration, VOC radicals converting NO to NO₂, NO₂ removal, ozone deposition, and mixing with cleaner air at a rate set by wind.</p><p>The mixing height grows with sunlight and is capped by an inversion. The AQI uses EPA breakpoints but applies them to instantaneous values (the official ozone AQI uses an 8-hour average and PM2.5 a 24-hour average). Concentrations are realistic in size for the Front Range but not a forecast.</p>'
};
function mix(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function rgb(c){return 'rgb('+c.map(x=>Math.round(x)).join(',')+')';}
BioLab.register(SMOG);
})();
