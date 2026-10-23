(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,lvText,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;

/* Ecological succession on a Colorado mountainside.
   Six plant groups compete for light; each needs a minimum soil depth to establish.
   Pioneers (lichens) weather rock and every group adds organic matter, so soil builds. */
const G=[
  {id:'lichen', n:'Lichens',            hn:'Lichens',                     need:0,   r:0.10, seed:0.006, tol:2.0, cast:0.00, b:0.05, spp:2, die:0.004, soil:0.016, col:'#b9a64a'},
  {id:'moss',   n:'Mosses',             hn:'Mosses',                      need:0.2, r:0.10, seed:0.004, tol:0.4, cast:0.00, b:0.2,  spp:2, die:0.006, soil:0.03,  col:'#6f9a3a'},
  {id:'grass',  n:'Grasses and flowers', hn:'Grasses and fireweed',       need:1.5, r:0.35, seed:0.004, tol:2.0, cast:0.10, b:0.6,  spp:6, die:0.04,  soil:0.07,  col:'#a7c75a'},
  {id:'shrub',  n:'Shrubs',             hn:'Shrubs (currant, juniper)',   need:5,   r:0.14, seed:0.002, tol:1.8, cast:0.30, b:3,    spp:5, die:0.025, soil:0.06,  col:'#5f8f3e'},
  {id:'aspen',  n:'Pioneer trees',      hn:'Aspen',                       need:9,   r:0.12, seed:0.0015,tol:3.0, cast:0.50, b:14,   spp:3, die:0.014, soil:0.06,  col:'#9cc24e'},
  {id:'conifer',n:'Climax trees',       hn:'Spruce and fir',              need:14,  r:0.04, seed:0.0008,tol:0.4, cast:0.93, b:32,   spp:3, die:0.005, soil:0.06,  col:'#2f5d3a'}
];
const NG=G.length;
const SEP=4; // stage name thresholds use cover
function soilF(S,need){if(need<=0)return 1;return 1/(1+Math.exp(-(S-need)/(0.2*need+0.15)));}
function lights(c){const L=new Array(NG);let acc=1;for(let i=NG-1;i>=0;i--){L[i]=acc;acc*=(1-G[i].cast*c[i]);}return L;}
function deriv(c,S){const L=lights(c),dc=new Array(NG);const ground=c[0]+0.8*c[1]+0.8*c[2];
  for(let i=0;i<NG;i++){const g=G[i],f=soilF(S,g.need),lt=Math.pow(L[i],g.tol);
    let room=1-c[i];if(i===0)room=Math.max(0,1-ground);if(i===1)room=Math.max(0,1-c[1]-0.5*c[2]);
    dc[i]=(g.r*c[i]*room+g.seed*room)*f*lt-g.die*c[i];}
  let dS=0,cover=0;for(let i=0;i<NG;i++){dS+=G[i].soil*c[i];cover=Math.max(cover,c[i]);}
  dS-=0.006*S*Math.max(0,1-cover)+0.0016*S;return {dc,dS};}
function advance(st,dt){const d=deriv(st.c,st.S);for(let i=0;i<NG;i++)st.c[i]=clamp(st.c[i]+d.dc[i]*dt,0,1);st.S=Math.max(0,st.S+d.dS*dt);}
function richness(c){let r=0;for(let i=0;i<NG;i++)r+=G[i].spp*clamp(c[i]/0.3,0,1);return r;}
function biomass(c){let b=0;for(let i=0;i<NG;i++)b+=G[i].b*c[i];return b;}
function startState(kind){
  if(kind==='primary')return {c:[0.002,0,0,0,0,0],S:0};
  if(kind==='mature')return {c:[0.03,0.55,0.03,0.08,0.04,0.88],S:30};
  return {c:[0.01,0.02,0.05,0.01,0.04,0.002],S:26};}
const DIST={
  fire:{label:'Wildfire',f:[0.3,0.3,0.4,0.15,0.25,0.004],soil:0.95},
  clearcut:{label:'Clear-cut logging',f:[0.8,0.6,1,0.5,0.05,0.01],soil:0.88},
  flood:{label:'Flood',f:[0.3,0.3,0.3,0.3,0.4,0.4],soil:0.6},
  mild:{label:'Fire',f:[0.5,0.5,0.6,0.3,0.25,0.05],soil:0.97}};
function disturb(st,kind){const D=DIST[kind];for(let i=0;i<NG;i++)st.c[i]*=D.f[i];st.S*=D.soil;}
/* Long-run average richness for a given disturbance frequency (fires per century). */
const idhCache={};
function idhCurve(){if(idhCache.v)return idhCache.v;const out=[];
  for(let f=0;f<=10;f++){const st=startState('secondary');let next=f>0?100/f:1e9,sum=0,n=0;
    for(let y=0;y<900;y++){for(let k=0;k<4;k++)advance(st,0.25);if(y+1>=next){disturb(st,'mild');next+=100/f;}if(y>=300){sum+=richness(st.c);n++;}}
    out.push(sum/n);}
  idhCache.v=out;return out;}
function stageOf(st){const c=st.c,hon=atLeast('honors');
  if(c[5]>0.45)return hon?'Climax forest (spruce and fir)':'Climax forest';
  if(c[4]>0.3)return hon?'Pioneer forest (aspen)':'Young forest';
  if(c[3]>0.25)return 'Shrub stage';
  if(c[2]>0.25)return 'Grass and wildflower stage';
  if(c[1]>0.15)return 'Moss stage';
  if(c[0]>0.05)return 'Pioneer stage: lichens';
  return 'Bare ground';}
const gname=i=>atLeast('honors')?G[i].hn:G[i].n;

const SUC={
  id:'succession',hash:'succession',apUnit:8,order:7,tab:'Ecological succession',kind:'Simulation',
  card:'Watch bare rock turn into a forest, then burn it, log it or flood it and watch it come back.',
  title:'Ecological succession on a Colorado mountainside',
  lede:{bio:'Life moves in after a glacier melts or a fire burns. Watch tiny pioneers build soil, then grasses, shrubs and trees take over, one stage at a time.',
        honors:'Compare primary succession on bare rock with secondary succession after a fire or clear-cut, and follow aspen giving way to spruce and fir.',
        ap:'Track richness, biomass and soil through succession, then test the intermediate disturbance hypothesis by changing how often fires burn.'},
  scale:'Real scale: a slice of mountainside about 50 m wide. The soil layer is drawn about 3× thicker than life to make it visible.',
  timeScale:15,dtMax:0.25,prewarm:0,sampleDt:1,window:400,unit:'years',timeLabel:'Time',chChange:2,chReveal:60,
  clock(sim){return 'Year '+Math.floor(sim.t);},
  controls:[
    {id:'start',label:'Starting point',type:'seg',def:'primary',lvl:'bio',options:[{v:'primary',l:'Bare rock'},{v:'secondary',l:'After a fire'},{v:'mature',l:'Old forest'}],
     help:'Bare rock: primary succession, no soil. After a fire: secondary succession, the soil survives.',onChange(sim){BioLab.reset(sim);}},
    {id:'dist',label:'Fires per century',type:'range',min:0,max:10,step:1,def:0,unit:'',lvl:'ap',help:'Automatic fires at a regular interval. Test the intermediate disturbance hypothesis.'}
  ],
  actions:[
    {id:'fire',label:'Wildfire',lvl:'bio',run(sim){disturb(sim.st,'fire');sim.st.event={t:sim.t,kind:'fire'};}},
    {id:'clearcut',label:'Clear-cut logging',lvl:'honors',run(sim){disturb(sim.st,'clearcut');sim.st.event={t:sim.t,kind:'clearcut'};}},
    {id:'flood',label:'Flood',lvl:'honors',run(sim){disturb(sim.st,'flood');sim.st.event={t:sim.t,kind:'flood'};}}
  ],
  init(sim){const s=startState(sim.p.start);return {c:s.c,S:s.S,event:null,nextFire:null,avg:richness(s.c),hist:[{t:0,c:s.c.slice()}],lastH:0};},
  step(sim,dt){const s=sim.st,p=sim.p;advance(s,dt);
    if(p.dist>0){const iv=100/p.dist;if(s.nextFire===null||s.nextFire>sim.t+iv)s.nextFire=sim.t+iv;
      if(sim.t+dt>=s.nextFire){disturb(s,'mild');s.event={t:sim.t,kind:'fire'};s.nextFire+=iv;}}else s.nextFire=null;
    const w=Math.min(1,dt/100);s.avg=s.avg*(1-w)+richness(s.c)*w;
    if(sim.t+dt-s.lastH>=1){s.lastH=sim.t+dt;s.hist.push({t:sim.t+dt,c:s.c.slice()});if(s.hist.length>900)s.hist.splice(0,s.hist.length-900);}},
  metrics:[
    {id:'rich',label:'Plant species present',unit:'species',lvl:'bio',min:0,max:21,d:0,get:s=>richness(s.st.c)},
    {id:'soil',label:'Soil depth',unit:'cm',lvl:'bio',min:0,max:40,d:1,get:s=>s.st.S},
    {id:'trees',label:'Tree cover',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>100*(1-(1-s.st.c[4])*(1-s.st.c[5]))},
    {id:'stage',label:'Stage',unit:'',lvl:'bio',text:true,get:s=>stageOf(s.st)},
    {id:'bio',label:'Plant biomass',unit:'kg/m²',lvl:'honors',min:0,max:40,d:1,get:s=>biomass(s.st.c)},
    {id:'aspen',label:'Aspen cover',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>100*s.st.c[4]},
    {id:'avg',label:'Average richness (≈100 yr)',unit:'species',lvl:'ap',min:0,max:21,d:1,get:s=>s.st.avg}
  ],
  graphs:[
    {id:'rich',label:'Species present over time',lines:['rich']},
    {id:'soil',label:'Soil depth over time',lines:['soil']},
    {id:'cover',label:'Plant cover by group',custom:true},
    {id:'bio',label:'Biomass over time',lvl:'honors',lines:['bio']},
    {id:'idh',label:'Richness vs. fire frequency',lvl:'ap',custom:true}
  ],
  defaultGraph:'cover',
  plot(sim,ctx,box,id){
    if(id==='idh'){const v=idhCurve(),f=sim.p.dist;const ax=axes(ctx,box,{xmin:0,xmax:10,ymin:0,ymax:Math.ceil(Math.max(...v)/5)*5+5,xl:'Fires per century',yl:'Long-run average richness (species)'});
      ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();v.forEach((y,i)=>i?ctx.lineTo(ax.X(i),ax.Y(y)):ctx.moveTo(ax.X(i),ax.Y(y)));ctx.stroke();
      v.forEach((y,i)=>{ctx.fillStyle=i===f?PAL['s4']:PAL['g-line'];ctx.beginPath();ctx.arc(ax.X(i),ax.Y(y),i===f?7:3.5,0,6.29);ctx.fill();});
      txt(ctx,'Your setting: '+f+' per century',ax.X(f)+(f>6?-10:10),ax.Y(v[f])-12,{s:12,c:PAL['muted'],a:f>6?'right':'left'});return;}
    const H=sim.st.hist,win=sim.def.window,xmax=Math.max(win,sim.t),xmin=xmax-win;
    const ax=axes(ctx,box,{xmin,xmax,ymin:0,ymax:100,xl:'Time (years)',yl:'Ground covered (%)'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    G.forEach((g,i)=>{ctx.strokeStyle=g.col;ctx.lineWidth=2.5;ctx.beginPath();let first=true;H.forEach(h=>{if(h.t<xmin)return;const X=ax.X(h.t),Y=ax.Y(100*h.c[i]);first?ctx.moveTo(X,Y):ctx.lineTo(X,Y);first=false;});ctx.stroke();});
    ctx.restore();
    const items=G.map((g,i)=>({label:gname(i).replace(/ \(.*\)/,''),color:g.col}));
    ctx.font='12px '+FONT;let x=box.L+8,y=box.T+12;items.forEach(it=>{const w=ctx.measureText(it.label).width+34;if(x+w>box.L+box.W){x=box.L+8;y+=16;}ctx.fillStyle=it.color;ctx.fillRect(x,y-4,14,4);txt(ctx,it.label,x+18,y,{s:12,c:PAL['muted'],b:'middle'});x+=w;});},
  narrate(sim){const s=sim.st,c=s.c,hon=atLeast('honors'),ap=atLeast('ap'),ev=s.event&&sim.t-s.event.t<12?s.event.kind:null;
    if(ev==='fire')return '<b>Fire just swept through.</b> Most plants burned, but the soil, roots and seeds survived, so this is now <b>secondary succession</b>. Fast-growing grasses'+(hon?', fireweed and aspen root sprouts':' and young trees')+' come back first.';
    if(ev==='clearcut')return '<b>The trees were logged.</b> Sunlight now reaches the ground, so sun-loving grasses, shrubs and '+(hon?'aspen':'pioneer trees')+' get a chance before the shade-tolerant trees return.';
    if(ev==='flood')return '<b>A flood scoured the slope</b> and washed away much of the soil. Recovery is slower when soil is lost.';
    const st=stageOf(s),S=s.S.toFixed(1);
    if(c[0]<0.05&&s.S<0.3)return '<b>Bare rock, no soil.</b> Only the toughest pioneers, like lichens, can start here. Plants with roots have nowhere to grow yet.';
    if(st.startsWith('Pioneer stage'))return '<b>Lichens are the pioneers.</b> They grow on bare rock and slowly break it down. Together with their dead remains, that makes the first thin soil ('+S+' cm so far).';
    if(st==='Moss stage')return '<b>Mosses move in</b> on the thin soil the lichens made, and they trap dust and water. The soil is now '+S+' cm deep, getting close to enough for grasses.';
    if(st.startsWith('Grass'))return '<b>Grasses and wildflowers take over</b> because they grow fast in full sun. Their roots and dead leaves build soil quickly ('+S+' cm).';
    if(st==='Shrub stage')return '<b>Shrubs grow taller than the grasses</b> and start to shade them out. Deeper soil ('+S+' cm) now lets woody plants take root.';
    if(st.startsWith('Pioneer forest')||st==='Young forest')return '<b>'+(hon?'Aspen':'Fast-growing pioneer trees')+' form a young forest.</b> They need full sun, so their own seedlings struggle in their shade. '+(hon?'Shade-tolerant spruce and fir':'Slow, shade-tolerant trees')+' grow up underneath them.';
    return '<b>Climax forest.</b> '+(hon?'Spruce and fir':'Shade-tolerant trees')+' now dominate. Few sun-loving species survive in the deep shade, so the number of species has dropped'+(ap?' (richness '+richness(c).toFixed(0)+')':'')+'. Without disturbance, this community can last for centuries.';},
  tour:[
    {title:'Bare rock',text:'A glacier has just melted away, leaving bare rock. There is no soil at all. This is where <b>primary succession</b> begins.',focus:[0,250,800,200],speed:0.3,setup(sim){BioLab.setValues(sim,{start:'primary'});}},
    {title:'Pioneers make soil',text:'Lichens are the <b>pioneer species</b>. They cling to rock, slowly break it down, and add their dead remains. Watch the brown soil layer begin to form.',focus:[0,220,800,130],speed:0.5},
    {title:'Mosses and grasses move in',text:'Once there is a little soil, mosses and then grasses can grow. Each stage changes the conditions and makes room for the next one.',focus:[0,150,800,200],speed:0.8},
    {title:'Shrubs and trees',text:'With deeper soil, shrubs and then fast-growing trees take root. They shade out the smaller sun-loving plants beneath them.',focus:[0,40,800,320],speed:1},
    {title:'The climax community',text:'Shade-tolerant trees eventually take over. This stable, long-lasting stage is the <b>climax community</b>.',focus:[0,40,800,320],speed:2},
    {title:'Disturbance: a wildfire',text:'Now a fire burns the forest. The soil and many roots and seeds survive, so recovery is <b>secondary succession</b>, and it is much faster than starting from rock.',focus:[0,40,800,410],speed:0.6,setup(sim){disturb(sim.st,'fire');sim.st.event={t:sim.t,kind:'fire'};}},
    {lvl:'honors',title:'Aspen first, then conifers',text:'In Colorado, aspen sprout from roots that survive the fire. They grow fast in full sun. Spruce and fir grow slowly in their shade and eventually replace them.',focus:[0,40,800,320],speed:2},
    {lvl:'ap',title:'Intermediate disturbance',text:'Fires that come too often keep only fast colonizers. With no fires, shade-tolerant trees crowd everything else out. Richness is highest with <b>intermediate</b> disturbance. Try the “Richness vs. fire frequency” graph.',focus:[0,0,800,450],pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{start:'primary',dist:0});},
  challenges:[
    {lvl:'bio',q:'A glacier melts and leaves bare rock. What grows there first?',choices:['Pine trees','Lichens','Grasses'],correct:1,
     baseline:{start:'primary'},change:{},changeText:'Watching the bare rock',watch:'rich',at:1,reveal:45,
     explain:{bio:'Lichens can grow on bare rock with no soil. Plants with roots, like grasses and trees, need soil, and there is none yet. Lichens are the pioneer species.'}},
    {lvl:'bio',q:'A fire burns a forest, but the soil survives. Compared with starting on bare rock, how fast does a forest come back?',choices:['Much faster','At the same speed','Slower'],correct:0,
     baseline:{start:'secondary'},change:{},changeText:'Watching the burned slope recover',watch:'trees',at:1,reveal:90,
     explain:{bio:'Soil, roots and seeds survive a fire, so grasses, shrubs and trees can grow right away. That is secondary succession. On bare rock, the soil has to be built first, which takes centuries.'}},
    {lvl:'honors',q:'Starting on bare rock, what happens to the soil while lichens and mosses grow?',choices:['It stays at zero until trees arrive','It slowly gets deeper','It washes away'],correct:1,
     baseline:{start:'primary'},change:{},changeText:'Watching the soil',watch:'soil',at:1,reveal:150,
     explain:{honors:'Pioneers break down rock and add dead organic matter. That slowly builds soil, which is what lets later species, with roots, move in. Each stage changes the environment for the next.'}},
    {lvl:'honors',q:'After a fire, aspen grow back first. What happens to the aspen over the next 250 years?',choices:['Aspen keep dominating forever','Spruce and fir grow up in their shade and replace them','Grasses take back over'],correct:1,
     baseline:{start:'secondary'},change:{},changeText:'Watching the forest age',watch:'aspen',at:1,reveal:260,
     explain:{honors:'Aspen need full sun, so their own seedlings fail in the shade they create. Spruce and fir tolerate shade, grow slowly underneath, and eventually take over. Aspen persist only where disturbances open the canopy again.'}},
    {lvl:'ap',q:'An old spruce-fir forest is clear-cut, leaving the soil. What happens to plant species richness over the next few decades?',choices:['It drops to zero and stays low','It rises as sun-loving species move in','It does not change'],correct:1,
     baseline:{start:'mature'},changeAction:'clearcut',changeText:'Clear-cut logging',watch:'rich',at:5,reveal:45,
     explain:{ap:'Removing the canopy lets light reach the ground. Grasses, shrubs and aspen colonize while some forest species remain, so richness rises above the climax level. Over centuries it falls again as shade-tolerant trees return.'}},
    {lvl:'ap',q:'Which fire frequency gives the highest long-run plant species richness on this slope?',choices:['No fires at all','A few fires per century','A fire every 10 years'],correct:1,instant:true,
     explain:{ap:'This is the intermediate disturbance hypothesis. Too few fires and shade-tolerant climax trees exclude other species. Too many and only fast colonizers survive. Open the “Richness vs. fire frequency” graph to see the hump this model produces.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does a community change during primary succession?</p><ol><li>Choose Bare rock and press Reset.</li><li>Record a trial every 50 years up to year 400 (pause to record).</li><li>Plot time (x) against plant species present (y), and do the same for soil depth.</li></ol><p>Describe each stage in order, and explain why soil depth matters.</p>',
       honors:'<p><b>Question:</b> How much faster is secondary succession than primary succession?</p><ol><li>From Bare rock, record the year when tree cover first passes 50%.</li><li>Repeat starting After a fire.</li><li>Repeat once more after a Flood on a mature forest.</li></ol><p>Explain the differences using what each disturbance leaves behind.</p>',
       ap:'<p><b>Question:</b> Does intermediate disturbance maximize diversity?</p><ol><li>For fire frequencies 0, 1, 2, 4, 6 and 10 per century, let the sim run at least 300 years.</li><li>Record the average richness readout for each.</li><li>Plot fire frequency (x) against average richness (y) and compare with the model’s curve.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain the shape of the curve in terms of colonizers, competitors and shade tolerance.</p>'},
  terms:[{t:'Succession',d:'The gradual change in the species of a community over time.'},{t:'Pioneer species',d:'The first organisms to colonize bare ground, such as lichens.'},{t:'Climax community',d:'A stable, mature community that changes little without disturbance.'},
    {lvl:'honors',t:'Primary succession',d:'Succession that starts on bare rock with no soil, after a glacier retreats or lava cools.'},{lvl:'honors',t:'Secondary succession',d:'Succession after a disturbance that leaves the soil, such as a fire, flood or clear-cut.'},{lvl:'honors',t:'Shade tolerance',d:'The ability to grow in low light. Spruce and fir are shade tolerant; aspen are not.'},
    {lvl:'ap',t:'Intermediate disturbance hypothesis',d:'Species richness is highest when disturbances are neither too rare nor too frequent.'},{lvl:'ap',t:'Ecological resilience',d:'How quickly a community recovers after a disturbance.'}],
  about:'<p><b>Model:</b> six plant groups each have a growth rate, a seed supply, a minimum soil depth to establish, and a shade tolerance. Taller groups shade shorter ones. Growth = (r·cover + seeds)·(soil factor)·(light)^tolerance − mortality. Soil builds from the plants present and erodes where the ground is bare.</p><p><b>Species present</b> counts each group’s species (lichens 2, mosses 2, grasses and flowers 6, shrubs 5, aspen community 3, spruce-fir 3), scaled by how common the group is.</p><p><b>Simplified:</b> real primary succession on rock can take more than 1,000 years; it is compressed here. The model has no climate, grazing, insects or seed dispersal distances, and disturbances are uniform across the slope. Lodgepole pine, another Colorado pioneer after fire, is not shown separately.</p>',
  initVis(sim){const r=rng(31),v=sim.vis;v.slots=[];for(let i=0;i<46;i++)v.slots.push({x:14+i*17+r()*8,u:r(),u2:r(),u3:r(),h:0.8+r()*0.4});
    v.lich=[];for(let i=0;i<90;i++)v.lich.push({x:r()*800,u:r(),w:4+r()*9});v.cracks=[];for(let i=0;i<14;i++)v.cracks.push([r()*800,r()*80,r()*30-15]);},
  draw(sim,ctx,vdt,k,t){const s=sim.st,c=s.c,v=sim.vis,hon=atLeast('honors');
    // sky
    const sky=ctx.createLinearGradient(0,0,0,300);sky.addColorStop(0,PAL['cv-water']);sky.addColorStop(1,PAL['cv-bg']);ctx.fillStyle=sky;ctx.fillRect(0,0,800,450);
    // distant mountains
    ctx.fillStyle=PAL['cv-bg2'];ctx.beginPath();ctx.moveTo(0,230);ctx.lineTo(120,120);ctx.lineTo(210,190);ctx.lineTo(330,90);ctx.lineTo(470,200);ctx.lineTo(600,110);ctx.lineTo(720,180);ctx.lineTo(800,140);ctx.lineTo(800,300);ctx.lineTo(0,300);ctx.closePath();ctx.fill();
    // rock and soil
    const rockTop=340,soilPx=clamp(s.S*3,0,110),surf=rockTop-soilPx;
    ctx.fillStyle='#8b8f94';ctx.fillRect(0,rockTop,800,110);ctx.strokeStyle='#6f7378';ctx.lineWidth=2;v.cracks.forEach(q=>{ctx.beginPath();ctx.moveTo(q[0],rockTop+10+q[1]);ctx.lineTo(q[0]+q[2],rockTop+30+q[1]);ctx.stroke();});
    if(soilPx>0.5){const sg=ctx.createLinearGradient(0,surf,0,rockTop);sg.addColorStop(0,'#4a3420');sg.addColorStop(1,'#7a5a38');ctx.fillStyle=sg;ctx.fillRect(0,surf,800,soilPx);}
    txt(ctx,'Soil '+s.S.toFixed(1)+' cm',790,Math.max(surf+14,rockTop-4)+(soilPx<16?18:0),{s:12.5*k,w:700,c:soilPx<16?'#ffffff':'#f3e7d3',a:'right'});
    txt(ctx,'Bedrock',12,rockTop+22,{s:12*k,w:700,c:'#f2f2f2'});
    // lichen and moss patches on the surface
    v.lich.forEach(q=>{if(q.u<c[0]){ctx.fillStyle=G[0].col;ctx.beginPath();ctx.ellipse(q.x,surf+1,q.w,2.5,0,0,6.29);ctx.fill();}
      else if(q.u<c[0]+c[1]*0.9){ctx.fillStyle=G[1].col;ctx.beginPath();ctx.ellipse(q.x,surf,q.w*1.1,4,0,Math.PI,0);ctx.fill();}});
    // plants in slots: tallest groups claim slots first
    const sway=RM?0:1;
    v.slots.forEach((q,i)=>{const x=q.x;let kind=-1;let acc=0;
      for(let gi=5;gi>=3;gi--){acc+=c[gi]*0.9;if(q.u<acc){kind=gi;break;}}
      if(kind===-1&&q.u2<c[2])kind=2;
      if(kind===5){const m=clamp(c[5]/0.6,0.25,1)*q.h,h=190*m,w=34*m;ctx.fillStyle='#5a3d24';ctx.fillRect(x-2,surf-h*0.25,4,h*0.25);
        ctx.fillStyle=G[5].col;for(let l=0;l<4;l++){const y0=surf-h*0.2-l*h*0.2,ww=w*(1-l*0.2);ctx.beginPath();ctx.moveTo(x-ww,y0);ctx.lineTo(x+ww,y0);ctx.lineTo(x,y0-h*0.35);ctx.closePath();ctx.fill();}}
      else if(kind===4){const m=clamp(c[4]/0.5,0.25,1)*q.h,h=150*m,sw=Math.sin(t*0.8+i)*2*sway;ctx.fillStyle='#e9e6dc';ctx.fillRect(x-2.5,surf-h,5,h);ctx.fillStyle='#3a3a3a';for(let e=0;e<4;e++)ctx.fillRect(x-2.5,surf-h*0.3-e*h*0.15,5,1.5);
        ctx.fillStyle=G[4].col;ctx.beginPath();ctx.ellipse(x+sw,surf-h,20*m+8,26*m+8,0,0,6.29);ctx.fill();}
      else if(kind===3){const m=clamp(c[3]/0.4,0.3,1)*q.h;ctx.fillStyle=G[3].col;ctx.beginPath();ctx.ellipse(x,surf-12*m,16*m,13*m,0,0,6.29);ctx.fill();ctx.beginPath();ctx.ellipse(x+10*m,surf-8*m,10*m,9*m,0,0,6.29);ctx.fill();}
      else if(kind===2){const m=clamp(c[2]/0.4,0.3,1);ctx.strokeStyle=G[2].col;ctx.lineWidth=2;for(let b=-2;b<=2;b++){const sw=Math.sin(t*1.5+i+b)*1.5*sway;ctx.beginPath();ctx.moveTo(x+b*2,surf);ctx.quadraticCurveTo(x+b*3,surf-8*m,x+b*5+sw,surf-16*m*q.h);ctx.stroke();}
        if(q.u3<0.35){ctx.fillStyle=hon?'#d94f9b':'#e8c547';ctx.beginPath();ctx.arc(x+4,surf-17*m,2.6,0,6.29);ctx.fill();}}});
    // disturbance effects
    const ev=s.event,age=ev?sim.t-ev.t:99;
    if(ev&&age>=0&&age<6){const a=1-age/6;
      if(ev.kind==='fire'){for(let i=0;i<40;i++){const x=(i*41+t*30)%800,h=30+((i*37)%50);ctx.globalAlpha=a*0.85;ctx.fillStyle=i%3?'#ff8a1d':'#ffcf3d';ctx.beginPath();ctx.moveTo(x-8,surf);ctx.quadraticCurveTo(x,surf-h,x+8,surf);ctx.fill();}
        ctx.globalAlpha=a*0.4;ctx.fillStyle='#555';for(let i=0;i<10;i++){ctx.beginPath();ctx.arc((i*83+t*10)%800,surf-100-(i%3)*30-age*12,28,0,6.29);ctx.fill();}ctx.globalAlpha=1;}
      if(ev.kind==='clearcut'){ctx.globalAlpha=a;ctx.fillStyle='#7a5532';v.slots.forEach((q,i)=>{if(i%3===0){ctx.fillRect(q.x-4,surf-6,8,6);}});ctx.globalAlpha=1;}
      if(ev.kind==='flood'){ctx.globalAlpha=a*0.55;ctx.fillStyle=PAL['s2'];ctx.fillRect(0,surf-40,800,40);ctx.globalAlpha=1;}
      pill(ctx,DIST[ev.kind]?DIST[ev.kind].label:'Fire',400,24,PAL['s1'],'#fff',13*k);}
    // header
    const head='Year '+Math.floor(sim.t)+' · '+stageOf(s);ctx.font='700 '+13*k+'px '+FONT;const hw=ctx.measureText(head).width+22;
    ctx.fillStyle=PAL['card'];rr(ctx,10,10,hw,26*Math.min(k,1.3),13);ctx.fill();txt(ctx,head,21,10+13*Math.min(k,1.3),{s:13*k,w:700,b:'middle'});
    // legend on the bedrock
    let lx=12,ly=rockTop+50;ctx.font='600 '+11.5*k+'px '+FONT;
    G.forEach((g,i)=>{const lab=gname(i).replace(/ \(.*\)/,'')+' '+Math.round(c[i]*100)+'%';const w=ctx.measureText(lab).width+24;if(lx+w>792){lx=12;ly+=18*k;}
      ctx.fillStyle=g.col;ctx.fillRect(lx,ly-5,10,10);txt(ctx,lab,lx+14,ly,{s:11.5*k,w:600,c:'#f6f6f6',b:'middle'});lx+=w;});}
};
BioLab.register(SUC);
})();
