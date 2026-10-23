(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,RM}=BioLab.h;

/* Monthly climate normals (approximate): mean temperature °C and precipitation mm, Jan–Dec. */
const CITY={
  denver:{name:'Denver, Colorado',T:[-1.1,0.0,4.2,8.2,13.4,19.4,23.2,21.9,16.9,9.9,3.5,-1.3],P:[10,11,25,42,58,47,52,46,30,26,17,13]},
  utqiagvik:{name:'Utqiaġvik, Alaska',T:[-25,-26,-25,-17,-6,2,5,4,0,-8,-17,-23],P:[4,4,3,4,4,8,25,25,16,10,5,4]},
  fairbanks:{name:'Fairbanks, Alaska',T:[-22,-19,-12,0,10,16,17,14,8,-3,-15,-20],P:[13,9,8,7,17,36,55,49,28,20,15,14]},
  boston:{name:'Boston, Massachusetts',T:[-1.5,-0.4,3.5,9.2,14.9,20.3,23.5,22.8,18.8,12.6,7.1,1.6],P:[92,84,110,94,88,98,87,88,90,98,99,106]},
  phoenix:{name:'Phoenix, Arizona',T:[13,15,18,22,27,32,35,34,31,24,17,12],P:[23,22,25,7,3,1,26,27,17,15,15,22]},
  losangeles:{name:'Los Angeles, California',T:[14.2,14.6,15.4,16.6,17.8,19.4,21.6,22.2,21.6,19.6,16.6,14.2],P:[80,90,60,20,6,2,1,1,4,17,26,58]},
  serengeti:{name:'Serengeti, Tanzania',T:[22,22,22,21,20,19,19,20,21,22,22,22],P:[100,90,140,170,80,15,10,15,25,50,90,110]},
  manaus:{name:'Manaus, Brazil',T:[26.5,26.5,26.6,26.6,26.9,27,27.1,27.8,28.3,28.4,28,27.3],P:[260,288,314,300,256,114,88,58,83,126,183,217]}
};
const BIOME={
  tundra:{name:'Tundra',col:'#9fb7c9',climate:'Very cold, with a growing season of only 6–10 weeks. Little precipitation, much of it snow.',plants:'Mosses, lichens, sedges and dwarf shrubs. No trees, because permafrost blocks deep roots.',animals:'Caribou, arctic foxes, lemmings, snowy owls and migrating birds.',limit:'Cold temperatures and a very short growing season',threat:'Warming thaws permafrost, which releases stored carbon as CO₂ and methane.'},
  taiga:{name:'Taiga (boreal forest)',col:'#3f7d5c',climate:'Long, cold winters and short, mild summers. Moderate precipitation.',plants:'Conifers such as spruce, fir and pine, with needles and cone shapes that shed snow.',animals:'Moose, lynx, snowshoe hares, wolves and bears.',limit:'Cold temperatures and a short growing season',threat:'Logging, wildfire and bark beetles as winters warm.'},
  deciduous:{name:'Temperate deciduous forest',col:'#6aa84f',climate:'Four distinct seasons, with steady precipitation all year.',plants:'Broadleaf trees such as oak, maple and beech that drop their leaves in fall.',animals:'Deer, squirrels, black bears, songbirds and salamanders.',limit:'Cold winters pause growth each year',threat:'Clearing for farms and cities, which fragments the forest.'},
  grassland:{name:'Temperate grassland',col:'#d6c35e',climate:'Hot summers, cold winters and too little rain for most trees. Droughts and fires are common.',plants:'Grasses with deep roots. Denver’s natural vegetation is shortgrass prairie.',animals:'Bison, pronghorn, prairie dogs and hawks.',limit:'Water, plus fire and grazing that keep trees out',threat:'Plowing for crops. Prairie soils are some of the most farmed on Earth.'},
  desert:{name:'Desert',col:'#e2a75a',climate:'Under about 25 cm of precipitation a year. Hot or cold, but always dry.',plants:'Cacti and succulents that store water, and shrubs with small or waxy leaves.',animals:'Lizards, snakes, kangaroo rats and other animals active at night.',limit:'Water',threat:'Groundwater pumping, off-road vehicles and spreading cities.'},
  savanna:{name:'Savanna',col:'#b39b42',climate:'Warm all year, with a long dry season and a wet season.',plants:'Grasses with scattered drought-tolerant trees such as acacias.',animals:'Zebras, wildebeest, elephants, lions and other grazing herds and their predators.',limit:'Water in the dry season, plus fire',threat:'Overgrazing and conversion to farmland.'},
  rainforest:{name:'Tropical rainforest',col:'#1f7a3f',climate:'Hot and wet all year, with more than 150–200 cm of rain.',plants:'Layers of broadleaf evergreen trees, vines and epiphytes. Most nutrients are in the plants, not the thin soil.',animals:'The highest biodiversity on land: insects, frogs, monkeys, birds and jaguars.',limit:'Light on the forest floor and nutrient-poor soil',threat:'Deforestation for cattle, soy and palm oil.'},
  chaparral:{name:'Chaparral (Mediterranean shrubland)',col:'#a7864f',climate:'Mild, wet winters and long, hot, dry summers.',plants:'Tough, fire-adapted shrubs such as manzanita, chamise and scrub oak.',animals:'Coyotes, mule deer, lizards and quail.',limit:'Summer drought, plus regular wildfire',threat:'Too-frequent fires and spreading suburbs.'}
};
const TINT={};
const ORDER=['tundra','taiga','deciduous','grassland','desert','savanna','rainforest','chaparral'];
const MON='JFMAMJJASOND'.split('');
ORDER.forEach(b=>{const h=BIOME[b].col,n=[1,3,5].map(i=>parseInt(h.substr(i,2),16)).map(v=>Math.round(v+(255-v)*0.45));TINT[b]='rgb('+n.join(',')+')';});

function classify(T,Pcm,dry){if(T<-5)return 'tundra';if(T<3)return Pcm<25?'tundra':'taiga';if(Pcm<25)return 'desert';
  if(dry&&T>=10&&T<20&&Pcm<90)return 'chaparral';if(T<20)return Pcm<60?'grassland':'deciduous';return Pcm<150?'savanna':'rainforest';}
function drySummer(Tm,Pm){let best=-1e9,bi=0;for(let i=0;i<12;i++){const s=Tm[i]+Tm[(i+1)%12]+Tm[(i+2)%12];if(s>best){best=s;bi=i;}}
  const tot=Pm.reduce((a,b)=>a+b,0);return tot>0&&(Pm[bi]+Pm[(bi+1)%12]+Pm[(bi+2)%12])/tot<0.1;}

/* Which climate is on screen: a mystery quiz city, a real city, or the custom sliders. AP adds a climate-change shift. */
function quizCity(sim){const list=quizList(sim).filter(c=>atLeast(c.lvl));const ch=list[sim.ch.idx];return ch&&ch.city&&sim.ch.phase!=='done'?ch.city:null;}
function climate(sim){const p=sim.p,mys=quizCity(sim);let Tm,Pm,name,key=mys||p.place;
  if(key!=='custom'){const c=CITY[key];Tm=c.T.slice();Pm=c.P.slice();name=c.name;}
  else{const amp=p.tmean<15?13:5;Tm=[];Pm=[];const tot=p.pcm*10;for(let m=0;m<12;m++){const ph=Math.cos(2*Math.PI*(m-6.5)/12);Tm.push(p.tmean+amp*ph);
      Pm.push(atLeast('honors')&&p.dry?tot/12*(1+0.95*Math.cos(2*Math.PI*(m-0.5)/12)):tot/12*(1+0.25*ph));}name='Custom climate';}
  if(atLeast('ap')&&!mys){Tm=Tm.map(x=>x+p.warm);Pm=Pm.map(x=>x*(1+p.pchg/100));}
  const T=Tm.reduce((a,b)=>a+b,0)/12,Pcm=Pm.reduce((a,b)=>a+b,0)/10,dry=drySummer(Tm,Pm);
  return {Tm,Pm,T,Pcm,dry,name:mys?'Mystery city':name,mystery:!!mys,biome:classify(T,Pcm,dry)};}

const WX={x0:62,x1:392,y0:40,y1:372,tmin:-15,tmax:30,pmax:450};
const wX=T=>WX.x0+(T-WX.tmin)/(WX.tmax-WX.tmin)*(WX.x1-WX.x0),wY=P=>WX.y1-Math.min(P,WX.pmax)/WX.pmax*(WX.y1-WX.y0);

function quizList(sim){return [
  {lvl:'bio',q:'Denver averages about 10 °C and gets about 38 cm of precipitation a year. Which biome is Denver in?',choices:['Temperate deciduous forest','Temperate grassland (shortgrass prairie)','Desert','Taiga'],correct:1,instant:true,
   explain:'38 cm is more than a desert gets but far too little for a forest. On the Whittaker diagram, Denver falls in temperate grassland. Before the city was built, it was shortgrass prairie with bison and prairie dogs.'},
  {lvl:'bio',q:'What mostly limits plant growth in the arctic tundra?',choices:['Too little rain','Cold temperatures and a very short growing season','Too much sunlight'],correct:1,instant:true,
   explain:'Tundra is dry, but cold is the bigger limit. Only a few weeks a year are warm enough for plants to grow, and frozen permafrost below the surface blocks deep roots.'},
  {lvl:'bio',city:'phoenix',q:'Mystery city: read its climatograph. Which biome is it in?',choices:['Desert','Tropical rainforest','Tundra','Temperate deciduous forest'],correct:0,instant:true,
   explain:'It is hot all year (the red line stays above 12 °C) but the blue rain bars are tiny: about 20 cm a year. Under 25 cm of precipitation means desert. This is Phoenix, Arizona.'},
  {lvl:'bio',city:'manaus',q:'Mystery city: which biome matches this climatograph?',choices:['Savanna','Tropical rainforest','Desert','Taiga'],correct:1,instant:true,
   explain:'The temperature line is flat and high, around 27 °C every month, and the rain bars are tall: about 230 cm a year. Hot and wet all year is tropical rainforest. This is Manaus, in the Amazon.'},
  {lvl:'honors',city:'losangeles',q:'Mystery city: it is mild and gets about 37 cm of rain a year. Which biome?',choices:['Desert','Chaparral','Temperate grassland','Savanna'],correct:1,instant:true,
   explain:'Look at the timing of the rain bars: almost all the rain falls in winter, and the summer months are nearly bone-dry. Wet winters and dry summers mark chaparral. This is Los Angeles.'},
  {lvl:'honors',q:'Deserts and tundra both have few plants. What is the main limiting factor in each?',choices:['Water in deserts; temperature in tundra','Temperature in both','Sunlight in deserts; water in tundra'],correct:0,instant:true,
   explain:'Deserts have plenty of warmth and light but very little water. Tundra has a short, cold growing season. The same small amount of plant life has different causes.'},
  {lvl:'honors',city:'fairbanks',q:'Mystery city: which biome matches?',choices:['Tundra','Taiga (boreal forest)','Temperate deciduous forest','Temperate grassland'],correct:1,instant:true,
   explain:'Winters fall to −20 °C, but summers reach about 17 °C for a few months, and there is about 27 cm of precipitation, enough for conifers. Cold but with a real summer means taiga. This is Fairbanks, Alaska.'},
  {lvl:'ap',q:'Denver warms 3 °C and loses 40% of its precipitation. Using the Whittaker diagram, which biome would its climate match?',choices:['Temperate grassland','Desert','Chaparral','Savanna'],correct:['grassland','desert','chaparral','savanna'].indexOf(classify(10.4+3,37.7*0.6,false)),instant:true,
   explain:'Average temperature rises to about 13 °C and precipitation drops to about 23 cm a year, under the 25 cm desert line. Set warming to 3 °C and precipitation to −40% to watch the dot cross into desert. Biome shifts like this are a major impact of climate change.'},
  {lvl:'ap',city:'serengeti',q:'Mystery city: warm all year with about 90 cm of rain. Which biome?',choices:['Tropical rainforest','Savanna','Temperate grassland','Desert'],correct:1,instant:true,
   explain:'Temperatures stay near 21 °C, but 90 cm of rain is too little for rainforest, and it comes in wet seasons with a long dry season (June–September). Warm with a dry season means savanna. This is the Serengeti.'},
  {lvl:'ap',q:'Two places both average 15 °C and 50 cm of rain a year. One gets its rain in winter and is bone-dry in summer. Which biome is it likely in?',choices:['Temperate grassland','Chaparral','Temperate deciduous forest'],correct:1,instant:true,
   explain:'Annual averages are not the whole story. Rain falling in the cool season with drought during the hot season favors tough, fire-adapted shrubs, which is chaparral. With summer rain, the same totals give grassland. Try it with Custom climate and the dry-summer switch.'}
];}

function drawLandscape(ctx,b,x,y,w,h,t,k){ctx.save();rr(ctx,x,y,w,h,10);ctx.clip();
  const sky=ctx.createLinearGradient(0,y,0,y+h);sky.addColorStop(0,b==='tundra'||b==='taiga'?'#cfe0ee':'#bfe1f7');sky.addColorStop(1,'#eef6fb');ctx.fillStyle=sky;ctx.fillRect(x,y,w,h);
  const ground={tundra:'#a9b59a',taiga:'#5e6f4a',deciduous:'#6f9a48',grassland:'#c9b860',desert:'#e5c48a',savanna:'#c8ae5c',rainforest:'#2f5e2c',chaparral:'#b49766'}[b];
  const gy=y+h*0.68;ctx.fillStyle=ground;ctx.beginPath();ctx.moveTo(x,gy);for(let i=0;i<=20;i++)ctx.lineTo(x+w*i/20,gy+Math.sin(i*1.3)*4);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();ctx.fill();
  const r=rng(b.length*31),sway=RM?0:Math.sin(t*1.5);
  const tree=(tx,ty,s)=>{ctx.fillStyle='#6b4a2b';ctx.fillRect(tx-2*s,ty-14*s,4*s,14*s);};
  if(b==='tundra'){for(let i=0;i<40;i++){ctx.fillStyle=i%3?'#7f9471':'#d9dfe4';ctx.beginPath();ctx.ellipse(x+r()*w,gy+6+r()*(h*0.3-8),3+r()*4,2,0,0,6.29);ctx.fill();}}
  if(b==='taiga'){for(let i=0;i<16;i++){const tx=x+10+r()*(w-20),s=0.8+r()*0.6,ty=gy+r()*10;ctx.fillStyle='#24543a';ctx.beginPath();ctx.moveTo(tx,ty-40*s);ctx.lineTo(tx+11*s,ty);ctx.lineTo(tx-11*s,ty);ctx.closePath();ctx.fill();}}
  if(b==='deciduous'){for(let i=0;i<9;i++){const tx=x+16+r()*(w-32),s=0.9+r()*0.5,ty=gy+4+r()*8;tree(tx,ty,s);ctx.fillStyle=i%2?'#4f8a35':'#6aa84f';ctx.beginPath();ctx.arc(tx,ty-20*s,13*s,0,6.29);ctx.fill();}}
  if(b==='grassland'||b==='savanna'||b==='chaparral'){ctx.strokeStyle=b==='chaparral'?'#8a7448':'#a8963d';ctx.lineWidth=1.4;for(let i=0;i<70;i++){const gx=x+r()*w,g2=gy+4+r()*(h*0.3-6);ctx.beginPath();ctx.moveTo(gx,g2);ctx.quadraticCurveTo(gx+2,g2-8,gx+3+sway*2,g2-14);ctx.stroke();}}
  if(b==='savanna'){for(let i=0;i<3;i++){const tx=x+40+i*(w-80)/2+r()*20,ty=gy+2;tree(tx,ty,1.1);ctx.fillStyle='#4b6d2a';ctx.beginPath();ctx.ellipse(tx,ty-17,24,6,0,0,6.29);ctx.fill();}}
  if(b==='chaparral'){for(let i=0;i<10;i++){ctx.fillStyle=i%2?'#6f7d45':'#5c6a3a';ctx.beginPath();ctx.arc(x+r()*w,gy+6+r()*14,6+r()*5,0,6.29);ctx.fill();}}
  if(b==='desert'){for(let i=0;i<4;i++){const cx=x+30+r()*(w-60),cy=gy+8+r()*8,s=0.8+r()*0.5;ctx.fillStyle='#4f8a46';rr(ctx,cx-4*s,cy-34*s,8*s,34*s,4*s);ctx.fill();rr(ctx,cx-14*s,cy-24*s,6*s,12*s,3*s);ctx.fill();rr(ctx,cx+8*s,cy-28*s,6*s,14*s,3*s);ctx.fill();ctx.fillRect(cx-12*s,cy-14*s,10*s,4*s);ctx.fillRect(cx+2*s,cy-16*s,8*s,4*s);}}
  if(b==='rainforest'){for(let i=0;i<14;i++){const tx=x+r()*w,s=1+r()*0.6,ty=gy+6+r()*6;tree(tx,ty,s*1.2);ctx.fillStyle=['#1b5e30','#2c7a3e','#17492a'][i%3];ctx.beginPath();ctx.arc(tx,ty-24*s,16*s,0,6.29);ctx.fill();}
    ctx.strokeStyle='#2f6b2f';ctx.lineWidth=1.5;for(let i=0;i<6;i++){const vx=x+r()*w;ctx.beginPath();ctx.moveTo(vx,y);ctx.quadraticCurveTo(vx+6+sway*3,y+h*0.3,vx,y+h*0.5);ctx.stroke();}}
  ctx.restore();}

const SIM={
  id:'biomes',hash:'biomes',apUnit:8,order:4,tab:'Biome explorer',kind:'Learning tool',next:['islandbio','climate'],
  card:'Read climatographs from Denver to the Amazon, place each city on the Whittaker diagram, and see how climate change can shift a biome.',
  title:'Biome explorer: climate decides the biome',
  lede:{bio:'Every biome has its own climate. Read a city’s climatograph, find it on the biome diagram, and learn why its plants and animals live there.',
        honors:'Use temperature and precipitation, and when the rain falls, to identify biomes and their limiting factors.',
        ap:'Connect climatographs to the Whittaker diagram, and model how warming and changing precipitation could shift biome boundaries.'},
  scale:'Each biome spans thousands of kilometers. Climatographs use 30-year averages of monthly temperature and precipitation.',
  timeless:true,animated:true,graph:false,trials:false,controlsTitle:'Climate',
  controls:[
    {id:'place',label:'Place',type:'select',def:'denver',lvl:'bio',options:[{v:'denver',l:'Denver, Colorado'},{v:'utqiagvik',l:'Utqiaġvik, Alaska'},{v:'fairbanks',l:'Fairbanks, Alaska'},{v:'boston',l:'Boston, Massachusetts'},{v:'phoenix',l:'Phoenix, Arizona'},{v:'losangeles',l:'Los Angeles, California'},{v:'serengeti',l:'Serengeti, Tanzania'},{v:'manaus',l:'Manaus, Brazil'},{v:'custom',l:'Custom climate (use the sliders)'}]},
    {id:'tmean',label:'Custom: average temperature',type:'range',min:-15,max:30,step:1,def:10,unit:' °C',lvl:'bio',onChange(sim){if(sim.p.place!=='custom')BioLab.setValues(sim,{place:'custom'});}},
    {id:'pcm',label:'Custom: yearly precipitation',type:'range',min:0,max:450,step:5,def:40,unit:' cm',lvl:'bio',onChange(sim){if(sim.p.place!=='custom')BioLab.setValues(sim,{place:'custom'});}},
    {id:'dry',label:'Dry summers, wet winters',help:'For the custom climate',type:'toggle',def:false,lvl:'honors'},
    {id:'warm',label:'Climate change: warming',type:'range',min:0,max:6,step:0.5,def:0,unit:' °C',lvl:'ap'},
    {id:'pchg',label:'Climate change: precipitation',type:'range',min:-50,max:50,step:5,def:0,unit:'%',lvl:'ap'}
  ],
  init(){return {};},step(){},
  metrics:[
    {id:'tavg',label:'Average temperature',unit:'°C',lvl:'bio',min:-15,max:30,d:1,get:s=>climate(s).T},
    {id:'ptot',label:'Yearly precipitation',unit:'cm',lvl:'bio',min:0,max:450,d:0,get:s=>climate(s).Pcm},
    {id:'biome',label:'Biome',lvl:'bio',text:true,get:s=>{const c=climate(s);return c.mystery?'? (answer the quiz)':BIOME[c.biome].name;}},
    {id:'grow',label:'Growing season (months above 5 °C)',unit:'months',lvl:'honors',min:0,max:12,d:0,get:s=>climate(s).Tm.filter(x=>x>5).length},
    {id:'limit',label:'Main limiting factor',lvl:'honors',text:true,get:s=>{const c=climate(s);return c.mystery?'?':BIOME[c.biome].limit;}},
    {id:'drought',label:'Drought months (P < 2T)',unit:'months',lvl:'ap',min:0,max:12,d:0,get:s=>{const c=climate(s);return c.Tm.filter((x,i)=>c.Pm[i]<2*x).length;}}
  ],
  challenges:quizList,challengeTitle:'Identify the biome',
  onChallenge(sim){sim.infoDirty=true;},
  infoPanel(sim){const c=climate(sim),b=BIOME[c.biome],hon=atLeast('honors'),ap=atLeast('ap');
    if(c.mystery)return '<h3>Mystery climatograph</h3><p>Read the red temperature line and the blue precipitation bars, then answer the quiz. The city’s name and biome appear after you answer.</p><p>Tip: first check yearly precipitation (under 25 cm means desert), then the temperature.</p>';
    return `<h3>${b.name}</h3><p><b>Climate:</b> ${b.climate}</p><p><b>Plants:</b> ${b.plants}</p><p><b>Animals:</b> ${b.animals}</p>${hon?`<p><b>Limiting factor:</b> ${b.limit}.</p>`:''}${ap?`<p><b>Human impact:</b> ${b.threat}</p>`:''}`;},
  onClick(sim,x,y){if(x>=WX.x0&&x<=WX.x1&&y>=WX.y0&&y<=WX.y1){const T=Math.round(WX.tmin+(x-WX.x0)/(WX.x1-WX.x0)*(WX.tmax-WX.tmin)),P=Math.round(clamp((WX.y1-y)/(WX.y1-WX.y0)*WX.pmax,0,450)/5)*5;BioLab.setValues(sim,{place:'custom',tmean:T,pcm:P});}},
  draw(sim,ctx,vdt,k,t){
    const c=climate(sim),ap=atLeast('ap');
    ctx.fillStyle=PAL['card'];ctx.fillRect(0,0,800,450);
    // Whittaker diagram: shade each biome region
    const cw=6;for(let px=WX.x0;px<WX.x1;px+=cw)for(let py=WX.y0;py<WX.y1;py+=cw){const T=WX.tmin+(px+cw/2-WX.x0)/(WX.x1-WX.x0)*(WX.tmax-WX.tmin),P=(WX.y1-py-cw/2)/(WX.y1-WX.y0)*WX.pmax;
      ctx.fillStyle=TINT[classify(T,P,false)];ctx.fillRect(px,py,cw+0.5,cw+0.5);}
    ctx.globalAlpha=1;
    // chaparral zone (needs dry summers)
    ctx.setLineDash([5,4]);ctx.strokeStyle='#7a5c2e';ctx.lineWidth=2;ctx.strokeRect(wX(10),wY(90),wX(20)-wX(10),wY(25)-wY(90));ctx.setLineDash([]);
    const lab=(s,T,P)=>txt(ctx,s,wX(T),wY(P),{s:11.5*k,w:700,a:'center',b:'middle',c:'#1d2318'});
    lab('Tundra',-10,12);lab('Taiga',-1,110);lab('Desert',12,10);lab('Grassland',11,43);lab('Temperate',10,160);lab('deciduous forest',10,140);lab('Savanna',25,90);lab('Tropical',25,300);lab('rainforest',25,280);
    txt(ctx,'Chaparral (dry summers)',wX(15),wY(90)-6,{s:10.5*k,w:600,a:'center',c:PAL['cv-soft']});
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.strokeRect(WX.x0,WX.y0,WX.x1-WX.x0,WX.y1-WX.y0);
    for(let T=-10;T<=30;T+=10){txt(ctx,String(T),wX(T),WX.y1+15,{s:11*k,a:'center',c:PAL['cv-soft']});}
    for(let P=0;P<=400;P+=100){txt(ctx,String(P),WX.x0-6,wY(P)+4,{s:11*k,a:'right',c:PAL['cv-soft']});}
    txt(ctx,'Average yearly temperature (°C)',(WX.x0+WX.x1)/2,WX.y1+32,{s:11.5*k,a:'center',c:PAL['cv-soft']});
    ctx.save();ctx.translate(16,(WX.y0+WX.y1)/2);ctx.rotate(-Math.PI/2);txt(ctx,'Yearly precipitation (cm)',0,0,{s:11.5*k,a:'center',b:'middle',c:PAL['cv-soft']});ctx.restore();
    txt(ctx,'Whittaker biome diagram',WX.x0,WX.y0-12,{s:13*k,w:700});
    // AP: show where the climate started before the shift
    if(ap&&!c.mystery&&(sim.p.warm||sim.p.pchg)){const T0=c.T-sim.p.warm,P0=c.Pcm/(1+sim.p.pchg/100);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(wX(T0),wY(P0));ctx.lineTo(wX(c.T),wY(c.Pcm));ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(wX(T0),wY(P0),5,0,6.29);ctx.fill();ctx.stroke();}
    const pulse=RM?0:Math.sin(t*3)*2;ctx.fillStyle=PAL['s1'];ctx.strokeStyle=PAL['card'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(wX(clamp(c.T,WX.tmin,WX.tmax)),wY(c.Pcm),8+pulse,0,6.29);ctx.fill();ctx.stroke();
    // climatograph
    const G={x0:470,x1:760,y0:44,y1:264};const pmax=Math.max(120,Math.ceil(Math.max(...c.Pm)/50)*50);
    const bw=(G.x1-G.x0)/12;
    txt(ctx,c.name,G.x0-30,G.y0-14,{s:13.5*k,w:700});
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(G.x0,G.y0,G.x1-G.x0,G.y1-G.y0);
    c.Pm.forEach((v,i)=>{const h=v/pmax*(G.y1-G.y0);ctx.fillStyle=PAL['s2'];ctx.globalAlpha=.75;ctx.fillRect(G.x0+i*bw+3,G.y1-h,bw-6,h);ctx.globalAlpha=1;txt(ctx,MON[i],G.x0+i*bw+bw/2,G.y1+14,{s:11*k,a:'center',c:PAL['cv-soft']});});
    const tY=T=>G.y1-(T+30)/65*(G.y1-G.y0);
    ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;ctx.beginPath();c.Tm.forEach((v,i)=>{const X=G.x0+i*bw+bw/2,Y=tY(v);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.stroke();
    ctx.fillStyle=PAL['s1'];c.Tm.forEach((v,i)=>{ctx.beginPath();ctx.arc(G.x0+i*bw+bw/2,tY(v),3,0,6.29);ctx.fill();});
    ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(G.x0,tY(0));ctx.lineTo(G.x1,tY(0));ctx.stroke();ctx.setLineDash([]);
    [-30,-10,10,30].forEach(T=>txt(ctx,T+'°',G.x1+5,tY(T)+4,{s:10.5*k,c:PAL['s1']}));
    [0,pmax/2,pmax].forEach(P=>txt(ctx,String(P),G.x0-5,G.y1-P/pmax*(G.y1-G.y0)+4,{s:10.5*k,a:'right',c:PAL['s2']}));
    txt(ctx,'Precipitation (mm/month)',G.x0,G.y1+30,{s:11*k,c:PAL['s2']});txt(ctx,'Temperature (°C)',G.x1,G.y1+30,{s:11*k,c:PAL['s1'],a:'right'});
    // landscape
    const LX=440,LY=318,LW=340,LH=118;
    if(c.mystery){ctx.fillStyle=PAL['card2'];rr(ctx,LX,LY,LW,LH,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();txt(ctx,'?',LX+LW/2,LY+LH/2,{s:40*k,w:700,a:'center',b:'middle',c:PAL['cv-soft']});}
    else{drawLandscape(ctx,c.biome,LX,LY,LW,LH,t,k);pill(ctx,BIOME[c.biome].name,LX+LW/2,LY+16,'rgba(20,24,20,.72)','#fff',12*k);}
  },
  narrate(sim){const c=climate(sim),b=BIOME[c.biome],hon=atLeast('honors');
    if(c.mystery)return 'Read the climatograph. <b>Tall blue bars mean a wet month, and the red line is the average temperature.</b> Under 25 cm of precipitation a year means desert, no matter the temperature.';
    const why=c.Pcm<25?'there is so little precipitation':c.T<-5?'it is so cold':c.biome==='chaparral'?'its rain falls in winter and summers are dry':'of its mix of temperature and precipitation';
    return c.name+' averages <b>'+c.T.toFixed(1)+' °C</b> and gets <b>'+Math.round(c.Pcm)+' cm</b> of precipitation a year. It lands in <b>'+b.name.toLowerCase()+'</b> because '+why+'.'+(hon?' Limiting factor: '+b.limit.toLowerCase()+'.':'');},
  tour:[
    {title:'A climatograph',text:'This graph shows one place’s average climate across a year, January to December. Every biome has its own pattern.',focus:[430,22,360,286],pause:true},
    {title:'The red line: temperature',text:'The red line is each month’s average temperature. Denver’s rises above 20 °C in July and drops below freezing in winter.',focus:[460,36,310,236],pause:true},
    {title:'The blue bars: precipitation',text:'Each blue bar is that month’s rain and snow, in millimeters. Add them up for the yearly total. Denver gets about 38 cm.',focus:[460,120,310,180],pause:true},
    {title:'The Whittaker diagram',text:'This chart places biomes by average temperature (left to right) and yearly precipitation (bottom to top). Two numbers predict most of the biome.',focus:[20,26,390,390],pause:true},
    {title:'Find the city',text:'The red dot is the place you picked. Denver lands in temperate grassland: too dry for forest, too wet for desert.',focus(sim){const c=climate(sim);return [wX(c.T)-34,wY(c.Pcm)-34,68,68];},pause:true},
    {title:'What lives there',text:'Climate decides which plants can grow, and the plants decide which animals can live there. The info panel describes the biome.',focus:[430,310,360,135],pause:true},
    {lvl:'honors',title:'Timing matters',text:'Los Angeles and Denver get similar yearly rain, but Los Angeles gets almost all of it in winter. Dry summers make chaparral instead of grassland.',focus:[430,22,360,286],pause:true,setup(sim){BioLab.setValues(sim,{place:'losangeles'});}},
    {lvl:'ap',title:'Climate change moves biomes',text:'Now Denver warms 3 °C and loses 40% of its precipitation. The dashed line shows its climate sliding toward desert. Biomes don’t move overnight, but the plants that can survive there will change.',focus:[20,26,390,390],pause:true,setup(sim){BioLab.setValues(sim,{place:'denver',warm:3,pchg:-40});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{place:'denver',warm:0,pchg:0});},
  terms:[{t:'Biome',d:'A large region with a similar climate, plants and animals, like desert or taiga.'},{t:'Climatograph',d:'A graph of a place’s average monthly temperature (line) and precipitation (bars).'},{t:'Permafrost',d:'Ground that stays frozen all year, found under tundra.'},
    {lvl:'honors',t:'Limiting factor',d:'The resource or condition in shortest supply that limits growth, such as water in deserts.'},{lvl:'honors',t:'Range of tolerance',d:'The range of conditions, such as temperature, a species can survive in.'},
    {lvl:'ap',t:'Whittaker diagram',d:'A chart that predicts biome from mean annual temperature and precipitation.'},{lvl:'ap',t:'Biome shift',d:'Movement of a biome’s boundaries as climate changes, for example tree lines moving north or upslope.'}],
  about:'<p>Climate data are approximate 30-year monthly normals. The biome rules simplify the Whittaker diagram: under −5 °C is tundra; under 3 °C is taiga if precipitation is at least 25 cm; otherwise under 25 cm is desert; 10–20 °C with dry summers and under 90 cm is chaparral; under 20 °C is grassland below 60 cm and deciduous forest above; 20 °C and up is savanna below 150 cm and rainforest above.</p><p>Real biome boundaries are gradual and also depend on soils, fire, elevation and seasonality. Temperate rainforest and tropical dry forest are left out. "Dry summer" means the three warmest months get under 10% of the year’s precipitation. Drought months use the Walter–Lieth rule: precipitation (mm) below twice the temperature (°C).</p>',
  thumbFrames:4
};
BioLab.register(SIM);
})();
