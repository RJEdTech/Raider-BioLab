(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,PAL,FONT,RM,lvText,axes,bars,legend,serColor}=BioLab.h;
/* Nov 2026 (Jason + Paul Stearman): one version of this lab at every detail level, so every property
   and comparison shows for everyone. Properties are tabs above the stage, like Guided / Full lab / Review. */
const atLeast=()=>true;

/* Properties of Water Stations: a virtual version of the eight-station lab.
   Each station runs a small model in step(); draw() renders the bench scene on the left
   and a "zoom in" molecule view on the right that shows WHY the result happens. */

const C={O:'#d64545',H:'#f4f6f8',Hs:'#5d6b79',C:'#4b515c',ice:'#d4ecfa',iceS:'#8fb9d4',oil:'#e2b93b',oilS:'#a8841c',na:'#8e5bd1',cl:'#3c9d4b',
  copper:'#c27a3a',copperD:'#8f5523',towel:'#f3f1ea',blueDye:'#3d7fd6',balloon:'#e2455b',strip:'#efeadb'};
/* Tab order follows the station sheet. '0' (the water molecule, the sheet's "Before you begin") and '9'
   (heat of evaporation, property 5 in the water notes) have no station on the sheet. */
const TABS=[['0','Water molecule'],['1','Ice floats'],['2','Cohesion'],['3','Adhesion'],['4','Surface tension'],['5','Specific heat'],
  ['9','Heat of evaporation'],['6','Solvent'],['7','Polarity'],['8','Acids & bases']];
const STATIONS=[
  {v:'0',l:'Before you begin · The water molecule'},
  {v:'1',l:'1 · Density (ice)'},{v:'2',l:'2 · Cohesion (penny)'},{v:'3',l:'3 · Adhesion (paper towel)'},{v:'4',l:'4 · Surface tension (paperclip)'},
  {v:'5',l:'5 · Heating (boiling demo)'},{v:'9',l:'Heat of evaporation (wet thermometers)'},{v:'6',l:'6 · Dissolving'},{v:'7',l:'7 · Charged balloon'},{v:'8',l:'8 · Acids and bases'}];
const STNAME={'0':'The water molecule','1':'Density','2':'Cohesion','3':'Adhesion','4':'Surface tension','5':'High specific heat','6':'Dissolving','7':'Polarity (balloon)','8':'Acids and bases','9':'Heat of evaporation'};
const STHEAD=stn=>stn==='0'?'Before you begin: the water molecule':stn==='9'?'Heat of evaporation (from the water notes)':'Station '+stn+': '+STNAME[stn];
// evaporation model (station 9): wet-cloth thermometers in front of a fan, 25 °C room
const EV={room:25,h:1.13,C:34,m0:2,LAB:10,w:{R:0.004,L:2260},a:{R:0.020,L:841}};
const LIQ={water:{name:'Water',col:'#9fd0ef'},alcohol:{name:'Rubbing alcohol',col:'#e6eef3'},soapy:{name:'Soapy water',col:'#c9e3f2'},oil:{name:'Vegetable oil',col:'#e8c24a'}};
const DOME={water:58,alcohol:16,soapy:24};
const PH={lemon:2.2,water:7.0,cleaner:11.5};
// specific heats (J/g·°C) and boiling points for the heating demo; P chosen so water boils in ~25 s
const HEAT={w:{c:4.18,bp:{sea:100,denver:95}},a:{c:2.44,bp:{sea:78,denver:74}},o:{c:1.9,bp:null}};
const PWR=1340,MASS=100,DEMO=15; // DEMO: each simulated second shows as 15 s of real lab time

function phColor(ph){const K=[[0,'#d7262b'],[2,'#ee5b2f'],[4,'#f4a63b'],[6,'#d6d63a'],[7,'#5fb14b'],[8,'#36a685'],[10,'#2f7cc4'],[12,'#4c4fb5'],[14,'#6a3a9e']];
  ph=clamp(ph,0,14);for(let i=1;i<K.length;i++)if(ph<=K[i][0]){const a=K[i-1],b=K[i],t=(ph-a[0])/(b[0]-a[0]);return mix(a[1],b[1],t);}return K[K.length-1][1];}
function hex(h){return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16));}
function mix(a,b,t){const A=hex(a),B=hex(b);return '#'+A.map((v,i)=>Math.round(lerp(v,B[i],clamp(t,0,1))).toString(16).padStart(2,'0')).join('');}
function fmtTime(sec){const s=Math.round(sec*DEMO),m=Math.floor(s/60);return m+':'+String(s%60).padStart(2,'0');}

/* ---------- molecule drawing helpers ---------- */
function water(ctx,x,y,ang,s,o){o=o||{};const a1=ang-0.91,a2=ang+0.91,d=13*s;
  const h1=[x+Math.cos(a1)*d,y+Math.sin(a1)*d],h2=[x+Math.cos(a2)*d,y+Math.sin(a2)*d];
  ctx.strokeStyle=C.Hs;ctx.lineWidth=1.2*s;
  [h1,h2].forEach(h=>{ctx.fillStyle=C.H;ctx.beginPath();ctx.arc(h[0],h[1],5.2*s,0,6.29);ctx.fill();ctx.stroke();});
  ctx.fillStyle=C.O;ctx.beginPath();ctx.arc(x,y,8.5*s,0,6.29);ctx.fill();
  if(o.labels){const k=o.k||1;txt(ctx,'δ−',x-Math.cos(ang)*22*s,y-Math.sin(ang)*22*s,{s:12*k,w:700,c:C.O,a:'center',b:'middle'});
    txt(ctx,'δ+',h1[0]+Math.cos(a1)*14*s,h1[1]+Math.sin(a1)*14*s,{s:12*k,w:700,c:PAL['s2'],a:'center',b:'middle'});
    txt(ctx,'δ+',h2[0]+Math.cos(a2)*14*s,h2[1]+Math.sin(a2)*14*s,{s:12*k,w:700,c:PAL['s2'],a:'center',b:'middle'});}
  return {O:[x,y],H:[h1,h2]};}
function hbond(ctx,a,b,alpha){ctx.save();ctx.globalAlpha=alpha===undefined?0.9:alpha;ctx.setLineDash([3,3]);ctx.strokeStyle=PAL['s2'];ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.restore();}
function ethanol(ctx,x,y,ang,s){const ca=Math.cos(ang),sa=Math.sin(ang);
  const p=(dx,dy)=>[x+dx*ca-dy*sa,y+dx*sa+dy*ca];
  const c1=p(-16*s,0),c2=p(0,0),o=p(15*s,-4*s),h=p(25*s,-10*s);
  ctx.strokeStyle=C.Hs;ctx.lineWidth=3*s;ctx.beginPath();ctx.moveTo(...c1);ctx.lineTo(...c2);ctx.lineTo(...o);ctx.lineTo(...h);ctx.stroke();
  [[c1,9],[c2,9]].forEach(q=>{ctx.fillStyle=C.C;ctx.beginPath();ctx.arc(q[0][0],q[0][1],q[1]*s,0,6.29);ctx.fill();});
  ctx.fillStyle=C.O;ctx.beginPath();ctx.arc(o[0],o[1],7*s,0,6.29);ctx.fill();
  ctx.fillStyle=C.H;ctx.beginPath();ctx.arc(h[0],h[1],4.5*s,0,6.29);ctx.fill();ctx.lineWidth=1;ctx.stroke();
  return {O:o,H:h};}
function oilMol(ctx,x,y,ang,s,len){const ca=Math.cos(ang),sa=Math.sin(ang);ctx.strokeStyle=C.oilS;ctx.lineWidth=7*s;ctx.lineCap='round';ctx.beginPath();
  for(let i=0;i<=len;i++){const dx=i*9*s,dy=(i%2?4:-4)*s;const px=x+dx*ca-dy*sa,py=y+dx*sa+dy*ca;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();ctx.lineCap='butt';}
function arrow(ctx,x1,y1,x2,y2,col,w){ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w||2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  const a=Math.atan2(y2-y1,x2-x1);ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-8*Math.cos(a-0.4),y2-8*Math.sin(a-0.4));ctx.lineTo(x2-8*Math.cos(a+0.4),y2-8*Math.sin(a+0.4));ctx.closePath();ctx.fill();}
function beaker(ctx,x,y,w,h,fill,level){if(fill){ctx.fillStyle=fill;ctx.fillRect(x+3,y+h-level,w-6,level-2);}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x,y+4);ctx.lineTo(x,y+h);ctx.lineTo(x+w,y+h);ctx.lineTo(x+w,y+4);ctx.lineTo(x+w+4,y);ctx.stroke();}

/* ---------- per-station actions ---------- */
function newPenny(s){s.d2.n=0;s.d2.spilled=false;s.d2.liq=null;s.d2.auto=false;s.d2.acc=0;s.d2.spillT=0;}
const ACT={
  iceDrop(sim){const d=sim.st.d1;if(d.ice.length>=4)d.ice.shift();d.ice.push({x:44+d.ice.length*26+Math.random()*8,y:120,vy:0,ang:(Math.random()-.5)*0.4});sim.st.d1.dropped=true;},
  winter(sim){sim.st.d1.cooling=true;},
  drop(sim){const p=sim.p,d=sim.st.d2;if(d.spilled)return;const liq=p.pennyLiquid;if(d.n===0)d.liq=liq;else if(d.liq!==liq){newPenny(sim.st);d.liq=liq;}
    d.n++;d.falling.push({y:150,born:sim.st.t});
    if(d.n>d.max[liq]){d.spilled=true;d.spillT=0;d.auto=false;d.best[liq]=d.n-1;}else d.best[liq]=Math.max(d.best[liq]||0,0);},
  auto(sim){const d=sim.st.d2;if(d.spilled)newPenny(sim.st);d.auto=true;},
  dry(sim){newPenny(sim.st);},
  hang(sim){const d=sim.st.d3;if(!d.on){d.on=true;d.t=0;d.h=0;d.hist=[{t:0,h:0}];}},
  newTowel(sim){const d=sim.st.d3;d.on=false;d.t=0;d.h=0;d.hist=[];},
  clip(sim){const d=sim.st.d4,liq=sim.p.clipLiquid;d.clip={liq,y:150,state:liq==='water'?'float':'sink',t:0};},
  soap(sim){const d=sim.st.d4;d.soap=true;if(d.clip&&d.clip.state==='float'){d.clip.state='sink';d.clip.t=0;}},
  removeClip(sim){const d=sim.st.d4;d.clip=null;d.soap=false;},
  heat(sim){const d=sim.st.d5;if(!d.on&&d.t===0)d.hist=[{t:0,w:20,a:20,o:20}];d.on=true;},
  cool(sim){const d=sim.st.d5;d.on=false;d.t=0;d.T={w:20,a:20,o:20};d.boil={w:null,a:null,o:null};d.hist=[];},
  salt(sim){const d=sim.st.d6;d.salt+=1;d.grains.push(...Array.from({length:8},()=>({k:'salt',x:200+Math.random()*120,y:120-Math.random()*40,vy:0,d:0})));},
  sugar(sim){const d=sim.st.d6;d.sugar+=1;d.grains.push(...Array.from({length:8},()=>({k:'sugar',x:200+Math.random()*120,y:120-Math.random()*40,vy:0,d:0})));},
  oil(sim){const d=sim.st.d6;d.oil+=1;d.drops.push(...Array.from({length:6},()=>({x:210+Math.random()*100,y:390-Math.random()*40,r:5+Math.random()*4})));},
  stir(sim){sim.st.d6.stir=3;},
  emptyBeaker(sim){const d=sim.st.d6;Object.assign(d,{salt:0,sugar:0,oil:0,fs:0,fu:0,stir:0,grains:[],drops:[]});},
  rub(sim){const d=sim.st.d7;d.rub=1.6;d.charge=1;},
  closer(sim){sim.st.d7.near=true;},
  away(sim){sim.st.d7.near=false;},
  dip(sim){sim.st.d8.dipped=true;sim.st.d8.dipT=0;},
  buffer(sim){const d=sim.st.d8;d.mode=d.mode==='buffer'?'strips':'buffer';d.acid=0;},
  acid(sim){const d=sim.st.d8;if(d.mode!=='buffer'){d.mode='buffer';d.acid=0;}d.acid+=1;d.dropT=0.6;},
  acid5(sim){const d=sim.st.d8;if(d.mode!=='buffer'){d.mode='buffer';d.acid=0;}d.acid+=5;d.dropT=0.6;},
  neighbor(sim){const d=sim.st.d0;if(d.nb.length<4)d.nb.push({f:0});},
  clearN(sim){sim.st.d0.nb=[];},
  wet(sim){const d=sim.st.d9;if(d.on&&d.m.w>0)return;Object.assign(d,{on:true,t:0,T:{d:EV.room,w:EV.room,a:EV.room},m:{w:EV.m0,a:EV.m0},hist:[{t:0,d:EV.room,w:EV.room,a:EV.room}]});},
  dryAll(sim){Object.assign(sim.st.d9,{on:false,t:0,T:{d:EV.room,w:EV.room,a:EV.room},m:{w:0,a:0},hist:[]});}
};
const A=(id,label,st,lvl,primary)=>({id,label,lvl:'bio',primary:!!primary,st,run:ACT[id]});
const ACTIONS=[
  A('iceDrop','Drop in an ice cube',['1'],'bio',true),A('winter','Let winter come to the lake',['1']),
  A('drop','Add a drop',['2'],'bio',true),A('auto','Keep adding drops',['2']),A('dry','Dry the penny',['2']),
  A('hang','Hang the paper towel',['3'],'bio',true),A('newTowel','New paper towel',['3']),
  A('clip','Place the paperclip',['4'],'bio',true),A('soap','Add a drop of soap',['4'],'honors'),A('removeClip','Take out the paperclip',['4']),
  A('heat','Turn on the hot plates',['5'],'bio',true),A('cool','Turn off and start over',['5']),
  A('salt','Add salt (1 g)',['6']),A('sugar','Add sugar (1 g)',['6']),A('oil','Add oil (1 mL)',['6']),A('stir','Stir',['6'],'bio',true),A('emptyBeaker','Fresh beaker of water',['6']),
  A('rub','Rub the balloon on your hair',['7'],'bio',true),A('closer','Bring the balloon close',['7']),A('away','Move the balloon away',['7']),
  A('dip','Dip the pH strips',['8'],'bio',true),A('buffer','Compare plain water with a buffer',['8']),A('acid','Add a drop of acid',['8']),A('acid5','Add 5 drops of acid',['8']),
  A('neighbor','Add a neighbor molecule',['0'],'bio',true),A('clearN','Back to one molecule',['0']),
  A('wet','Wet the cloths and turn on the fan',['9'],'bio',true),A('dryAll','Dry everything and start over',['9'])
];
const CTRL_ST={pennyLiquid:['2'],clipLiquid:['4'],streamLiquid:['7'],place:['5']};
const GRAPH_ST={'2':'drops','3':'wick','5':'heat','8':'ph','9':'evap'};

function syncTabs(sim){const st=sim.ui.sec&&sim.ui.sec.querySelector('.stage');if(!st)return;let bar=st.querySelector('.wp-tabs');
  if(!bar){if(!document.getElementById('wp-tabs-css')){const css=document.createElement('style');css.id='wp-tabs-css';
      css.textContent='.wp-tabs{display:flex;align-items:center;margin:0 0 10px}.wp-tabs .wp-tl{font:700 13px var(--font);color:var(--muted);padding:0 6px 0 8px;text-transform:uppercase;letter-spacing:.04em}.wp-tabs button{padding:7px 12px}.wp-top{min-width:0}';
      document.head.appendChild(css);}
    bar=document.createElement('div');bar.className='modebar wp-tabs';bar.setAttribute('role','group');bar.setAttribute('aria-label','Property of water');
    bar.innerHTML='<span class="wp-tl" aria-hidden="true">Property</span>'+TABS.map(([v,l])=>`<button type="button" data-st="${v}">${l}</button>`).join('');
    bar.addEventListener('click',e=>{const b=e.target.closest('button[data-st]');if(b&&b.dataset.st!==sim.p.station)BioLab.setValues(sim,{station:b.dataset.st});});
    /* scale line + tabs share one wrapper, so the guided side-by-side grid keeps them together above the canvas */
    const top=document.createElement('div');top.className='wp-top';const sc=st.querySelector(':scope>.scale');st.insertBefore(top,st.querySelector('canvas'));if(sc)top.appendChild(sc);top.appendChild(bar);}
  bar.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.st===sim.p.station)));}
function syncStation(sim){const ui=sim.ui;if(!ui.sec)return;const stn=sim.p.station;syncTabs(sim);
  {const e=ui.sec.querySelector('#waterprops-station');const w=e&&e.closest('.ctl');if(w)w.hidden=true;}
  const btns=[...ui.ctrls.querySelectorAll('.actions button')];ACTIONS.forEach((a,i)=>{if(btns[i])btns[i].hidden=!atLeast(a.lvl)||!a.st.includes(stn);});
  Object.keys(CTRL_ST).forEach(id=>{const e=ui.sec.querySelector('#waterprops-'+id+',#waterprops-'+id+'-l');const w=e&&e.closest('.ctl');const c=WP.controls.find(c=>c.id===id);
    if(w)w.hidden=!atLeast(c.lvl)||!CTRL_ST[id].includes(stn);});
  WP.metrics.forEach(m=>{const t=ui.tiles[m.id];if(!t)return;const tile=t.num.closest('.tile');tile.hidden=!atLeast(m.lvl)||(m.st&&!m.st.includes(stn));});
  const g=GRAPH_ST[stn];if(g&&ui.gm&&[...ui.gm.options].some(o=>o.value===g)&&sim.gmode==='live'){sim.gMetric=g;ui.gm.value=g;}}

/* ---------- observations (readouts + caption) ---------- */
function dissolvedText(s){const d=s.d6,parts=[];
  if(d.salt)parts.push('Salt: '+(d.fs>0.97?'dissolved':d.fs>0.05?'dissolving':'not yet'));
  if(d.sugar)parts.push('Sugar: '+(d.fu>0.97?'dissolved':d.fu>0.05?'dissolving':'not yet'));
  if(d.oil)parts.push('Oil: does not dissolve');
  return parts.length?parts.join(' · '):'Nothing added yet';}
function bufPH(s){const n=s.d8.acid;return {plain:n?Math.max(1.5,4-Math.log10(n)):7.0,buf:7.4-0.02*n};}
function phText(s,sim){const d=s.d8;if(d.mode==='buffer'){const b=bufPH(s);return 'Plain water '+b.plain.toFixed(1)+' · Buffered (like blood) '+b.buf.toFixed(2);}
  if(!d.dipped)return 'Dip the strips to read pH';return 'Lemon '+Math.round(PH.lemon)+' · Water '+PH.water.toFixed(0)+' · Cleaner '+Math.round(PH.cleaner);}
function obsText(sim){const s=sim.st,stn=sim.p.station;
  switch(stn){
    case '0':{const n=s.d0.nb.filter(q=>q.f>=1).length;return n?n+' hydrogen bond'+(n===1?'':'s')+' to the center molecule (most it can make: 4)':'One water molecule. Add neighbors to see hydrogen bonds form';}
    case '9':{const d=s.d9;if(!d.on)return 'Wet the cloths and turn on the fan';
      return 'Water cloth '+d.T.w.toFixed(1)+' °C'+(d.m.w<=0?' (dried out)':'')+' · Alcohol cloth '+d.T.a.toFixed(1)+' °C'+(d.m.a<=0?' (dried out)':'')+' · Dry '+d.T.d.toFixed(0)+' °C';}
    case '1':return s.d1.ice.length?'Ice floats with most of the cube below the surface'+(s.d1.lake>0.05?'; the lake froze from the top down':''):'Drop an ice cube into the beaker';
    case '2':{const d=s.d2;if(!d.n)return 'Dry penny. Add drops of '+LIQ[sim.p.pennyLiquid].name.toLowerCase();return d.spilled?LIQ[d.liq].name+' spilled on drop '+d.n+'; the penny held '+(d.n-1)+' drops':d.n+' drops of '+LIQ[d.liq].name.toLowerCase()+' heaped on the penny';}
    case '3':return s.d3.on?'Colored water climbed '+s.d3.h.toFixed(1)+' cm up the towel':'Hang the towel so it just touches the water';
    case '4':{const c=s.d4.clip;if(!c)return 'Place a paperclip on the '+LIQ[sim.p.clipLiquid].name.toLowerCase();return c.state==='float'?'The paperclip floats on the water':'The paperclip sank'+(s.d4.soap&&c.liq==='water'?' after the soap was added':' in the '+LIQ[c.liq].name.toLowerCase());}
    case '5':{const b=s.d5.boil;if(!s.d5.on&&s.d5.t===0)return 'Turn on the hot plates';const order=['a','w'].filter(k=>b[k]!==null).sort((x,y)=>b[x]-b[y]).map(k=>k==='a'?'alcohol':'water');
      return order.length?'Boiling: '+order.join(', then ')+'. Oil has not boiled':'Heating. No liquid is boiling yet';}
    case '6':return dissolvedText(s);
    case '7':{const d=s.d7;if(d.charge<0.05)return 'Rub the balloon to charge it';return Math.abs(d.defl)>3?'The '+(sim.p.streamLiquid==='water'?'water':'oil')+' stream bends toward the balloon':'Charged balloon, '+(d.near?'but the stream barely moves':'too far away to affect the stream');}
    case '8':return phText(s,sim);}
  return '';}

/* ---------- the simulation ---------- */
const WP={
  id:'waterprops',hash:'waterprops',apUnit:1,order:0,kind:'Virtual lab',tab:'Properties of water stations',next:['water'],
  card:'One tab for each property of water, from Mr. Stearman’s station lab and notes: drops on a penny, a floating paperclip, sweat-like cooling and more, each with a molecule zoom.',
  title:'Properties of water: the station lab',
  lede:'Pick a property from the tabs above the bench. Each tab runs a mini-experiment from the station lab, and the zoom on the right shows the molecules causing it. Every property comes from the same thing: water is polar, so its molecules stick together with hydrogen bonds.',
  scale:'Left: the lab bench, real size. Right: zoomed in about 100 million times, to single molecules about 0.3 nanometers across.',
  timeless:true,animated:true,trials:true,chChange:1,chReveal:6,controlsTitle:'Lab bench',
  controls:[
    {id:'station',label:'Property',type:'select',def:'0',lvl:'bio',options:STATIONS,noTrial:false,onChange(sim){sim.st.intro=false;syncStation(sim);}},
    {id:'pennyLiquid',label:'Liquid in the pipet',type:'seg',def:'water',lvl:'bio',options:[{v:'water',l:'Water'},{v:'alcohol',l:'Alcohol'},{v:'soapy',l:'Soapy water',lvl:'bio'}],onChange(sim){newPenny(sim.st);}},
    {id:'clipLiquid',label:'Liquid in the dish',type:'seg',def:'water',lvl:'bio',options:[{v:'water',l:'Water'},{v:'alcohol',l:'Alcohol'},{v:'soapy',l:'Soapy water',lvl:'bio'}],onChange(sim){ACT.removeClip(sim);}},
    {id:'streamLiquid',label:'Liquid in the stream',type:'seg',def:'water',lvl:'bio',options:[{v:'water',l:'Water'},{v:'oil',l:'Oil'}]},
    {id:'place',label:'Where is the lab?',type:'seg',def:'sea',lvl:'bio',options:[{v:'sea',l:'Sea level'},{v:'denver',l:'Denver (5,280 ft)'}],onChange(sim){ACT.cool(sim);}},
    {id:'mol',label:'Molecule zoom',type:'toggle',def:true,lvl:'bio',help:'Show what the molecules are doing',noTrial:true}
  ],
  actions:ACTIONS,
  init(sim){const r=Math.random;return {t:0,intro:false,
    d0:{nb:[]},
    d9:{on:false,t:0,T:{d:EV.room,w:EV.room,a:EV.room},m:{w:0,a:0},hist:[]},
    d1:{ice:[],lake:0,cooling:false,dropped:false},
    d2:{n:0,spilled:false,liq:null,auto:false,acc:0,spillT:0,falling:[],best:{},max:{water:25+Math.floor(r()*11),alcohol:8+Math.floor(r()*5),soapy:12+Math.floor(r()*7)}},
    d3:{on:false,t:0,h:0,hist:[]},
    d4:{clip:null,soap:false},
    d5:{on:false,t:0,T:{w:20,a:20,o:20},boil:{w:null,a:null,o:null},hist:[]},
    d6:{salt:0,sugar:0,oil:0,fs:0,fu:0,stir:0,grains:[],drops:[]},
    d7:{charge:0,near:false,defl:0,rub:0},
    d8:{dipped:false,dipT:0,mode:'strips',acid:0,dropT:0}};},
  step(sim,dt){const s=sim.st,p=sim.p;s.t+=dt;dt=Math.min(dt,0.1);
    // 1 density
    const d1=s.d1;d1.ice.forEach(c=>{const eq=245;c.vy+=(eq-c.y)*14*dt-c.vy*3*dt;c.y+=c.vy*dt;});if(d1.cooling)d1.lake=Math.min(1,d1.lake+dt*0.12);
    // 2 cohesion
    const d2=s.d2;if(d2.auto&&!d2.spilled){d2.acc+=dt*2.5;while(d2.acc>=1&&!d2.spilled){d2.acc-=1;ACT.drop(sim);}}
    if(d2.n&&!d2.spilled)d2.best[d2.liq]=Math.max(d2.best[d2.liq]||0,d2.n);if(d2.spilled)d2.spillT+=dt;
    d2.falling.forEach(f=>{f.y+=dt*420;});d2.falling=d2.falling.filter(f=>f.y<330);
    // 3 adhesion: capillary rise grows like √t (Washburn) up to the towel's limit
    const d3=s.d3;if(d3.on){d3.t+=dt;d3.h=Math.min(11,2.4*Math.sqrt(d3.t));if(!d3.hist.length||d3.t-d3.hist[d3.hist.length-1].t>0.2)d3.hist.push({t:d3.t,h:d3.h});}
    // 4 surface tension
    const d4=s.d4;if(d4.clip){const c=d4.clip;c.t+=dt;const surf=318,bottom=372;if(c.state==='float')c.y=lerp(c.y,surf-3,Math.min(1,dt*6));else c.y=Math.min(bottom,c.y+dt*(c.y<surf?260:70));}
    // 5 heating demo: same heater on each beaker, temperature rises at P/(m·c) until the boiling point
    const d5=s.d5;if(d5.on){d5.t+=dt;['w','a','o'].forEach(k=>{const H=HEAT[k],bp=H.bp?H.bp[p.place]:null;let T=d5.T[k]+PWR/(MASS*H.c)*dt;if(bp!==null&&T>=bp){T=bp;if(d5.boil[k]===null)d5.boil[k]=d5.t;}d5.T[k]=Math.min(T,190);});
      if(!d5.hist.length||d5.t-d5.hist[d5.hist.length-1].t>0.2)d5.hist.push({t:d5.t,w:d5.T.w,a:d5.T.a,o:d5.T.o});if(d5.t>40)d5.on=false;}
    // 6 dissolving: stirring speeds it up; oil never dissolves
    const d6=s.d6,st=d6.stir>0;if(d6.stir>0)d6.stir-=dt;if(d6.salt)d6.fs=Math.min(1,d6.fs+dt*(st?0.38:0.03));if(d6.sugar)d6.fu=Math.min(1,d6.fu+dt*(st?0.28:0.02));
    // 7 balloon: the charge slowly leaks away; the force falls off with distance; nonpolar oil barely responds
    const d7=s.d7;if(d7.rub>0)d7.rub-=dt;d7.charge=Math.max(0,d7.charge-dt*0.01);const target=d7.charge*(d7.near?1:0.12)*(p.streamLiquid==='water'?42:2.5);d7.defl=lerp(d7.defl,target,Math.min(1,dt*4));
    // 8 pH
    const d8=s.d8;if(d8.dipped)d8.dipT+=dt;if(d8.dropT>0)d8.dropT-=dt;
    // 0 molecule: neighbors glide in to their hydrogen-bond spots
    s.d0.nb.forEach(q=>{q.f=Math.min(1,q.f+dt*0.9);});
    // 9 evaporation: each wet bulb gains heat from the air, h(Troom−T), and loses rate × heat of vaporization
    const d9=s.d9;if(d9.on){const sub=0.02,n=Math.max(1,Math.ceil(dt*EV.LAB/sub)),dl=dt*EV.LAB/n;
      for(let i=0;i<n;i++){['w','a'].forEach(q=>{const R=d9.m[q]>0?EV[q].R:0;d9.m[q]=Math.max(0,d9.m[q]-R*dl);d9.T[q]+=(EV.h*(EV.room-d9.T[q])-R*EV[q].L)/EV.C*dl;});}
      d9.t+=dt*EV.LAB;if(!d9.hist.length||d9.t-d9.hist[d9.hist.length-1].t>=2)d9.hist.push({t:d9.t,d:d9.T.d,w:d9.T.w,a:d9.T.a});
      if(d9.t>900)d9.on=false;}},
  metrics:[
    {id:'obs',label:'Observation',unit:'',lvl:'bio',text:true,get:s=>obsText(s)},
    {id:'hbn',label:'Hydrogen bonds to the center molecule',unit:'of 4',lvl:'bio',st:['0'],min:0,max:4,d:0,get:s=>s.st.d0.nb.filter(q=>q.f>=1).length},
    {id:'tw9',label:'Water cloth',unit:'°C',lvl:'bio',st:['9'],min:0,max:30,d:1,get:s=>s.st.d9.T.w},
    {id:'ta9',label:'Alcohol cloth',unit:'°C',lvl:'bio',st:['9'],min:0,max:30,d:1,get:s=>s.st.d9.T.a},
    {id:'qw9',label:'Heat carried off by the water',unit:'J',lvl:'bio',st:['9'],min:0,max:5000,d:0,get:s=>(EV.m0-s.st.d9.m.w)*EV.w.L*(s.st.d9.on||s.st.d9.t>0?1:0)},
    {id:'qa9',label:'Heat carried off by the alcohol',unit:'J',lvl:'bio',st:['9'],min:0,max:5000,d:0,get:s=>(EV.m0-s.st.d9.m.a)*EV.a.L*(s.st.d9.on||s.st.d9.t>0?1:0)},
    {id:'drops',label:'Drops on the penny',unit:'drops',lvl:'bio',st:['2'],min:0,max:40,d:0,get:s=>s.st.d2.spilled?s.st.d2.n-1:s.st.d2.n},
    {id:'wick',label:'Height climbed',unit:'cm',lvl:'bio',st:['3'],min:0,max:12,d:1,get:s=>s.st.d3.h},
    {id:'clipres',label:'Paperclip',unit:'',lvl:'bio',st:['4'],text:true,get:s=>s.st.d4.clip?(s.st.d4.clip.state==='float'?'Floats':'Sinks'):'Not placed'},
    {id:'first',label:'Boiled first',unit:'',lvl:'bio',st:['5'],text:true,get:s=>{const b=s.st.d5.boil;if(b.a===null&&b.w===null)return 'Nothing yet';if(b.w===null||(b.a!==null&&b.a<=b.w))return 'Alcohol, at '+fmtTime(b.a)+' min';return 'Water, at '+fmtTime(b.w)+' min';}},
    {id:'tw',label:'Water',unit:'°C',lvl:'bio',st:['5'],min:0,max:200,d:0,get:s=>s.st.d5.T.w},
    {id:'ta',label:'Alcohol',unit:'°C',lvl:'bio',st:['5'],min:0,max:200,d:0,get:s=>s.st.d5.T.a},
    {id:'to',label:'Oil',unit:'°C',lvl:'bio',st:['5'],min:0,max:200,d:0,get:s=>s.st.d5.T.o},
    {id:'dis',label:'Dissolved?',unit:'',lvl:'bio',st:['6'],text:true,get:s=>dissolvedText(s.st)},
    {id:'defl',label:'Stream bends',unit:'mm',lvl:'bio',st:['7'],min:0,max:30,d:0,get:s=>s.st.d7.defl*0.6},
    {id:'phs',label:'pH',unit:'',lvl:'bio',st:['8'],text:true,get:s=>phText(s.st,s)},
    {id:'hplus',label:'H⁺ in lemon juice vs water',unit:'',lvl:'bio',st:['8'],text:true,get:s=>s.st.d8.dipped?'about '+Math.round(Math.pow(10,PH.water-Math.round(PH.lemon))).toLocaleString('en-US')+'× more H⁺':'Dip the strips first'}
  ],
  graphs:[{id:'drops',label:'Drops on a penny (Station 2)',custom:true},{id:'wick',label:'Water climbing the towel (Station 3)',custom:true},
          {id:'heat',label:'Heating curves (Station 5)',custom:true},{id:'ph',label:'pH of each sample (Station 8)',custom:true},
          {id:'evap',label:'Wet thermometers (Heat of evaporation)',custom:true}],
  defaultGraph:'drops',
  plot(sim,ctx,box,id){const s=sim.st,msg=m=>txt(ctx,m,box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});
    if(id==='drops'){const keys=['water','alcohol'].concat(atLeast('honors')?['soapy']:[]);const vals=keys.map(k=>s.d2.best[k]||0);if(!vals.some(v=>v>0))return msg('Add drops at Station 2 to fill this graph.');
      const ax=axes(ctx,box,{xmin:0,xmax:keys.length,ymin:0,ymax:40,xcats:keys.map(k=>LIQ[k].name),yl:'Drops held on the penny'});bars(ctx,ax,vals,{colors:[PAL['s2'],PAL['s4'],PAL['s3']]});return;}
    if(id==='wick'){const h=s.d3.hist;if(h.length<2)return msg('Hang the towel at Station 3 to fill this graph.');const tmax=Math.max(10,h[h.length-1].t);
      const ax=axes(ctx,box,{xmin:0,xmax:tmax*DEMO/60,ymin:0,ymax:12,xl:'Time (min of lab time)',yl:'Height climbed (cm)'});ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2.5;ctx.beginPath();h.forEach((q,i)=>{const x=ax.X(q.t*DEMO/60),y=ax.Y(q.h);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();return;}
    if(id==='heat'){const h=s.d5.hist;if(h.length<2)return msg('Turn on the hot plates at Station 5 to fill this graph.');const tmax=Math.max(30,h[h.length-1].t)*DEMO/60;
      const b2={L:box.L,T:box.T+22,W:box.W,H:box.H-22,cw:box.cw,ch:box.ch};const ax=axes(ctx,b2,{xmin:0,xmax:tmax,ymin:0,ymax:200,xl:'Time (min of lab time)',yl:'Temperature (°C)'});
      [['w','Water',PAL['s2']],['a','Alcohol',PAL['s5']],['o','Oil',PAL['s4']]].forEach(([k,,col])=>{ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.beginPath();h.forEach((q,i)=>{const x=ax.X(q.t*DEMO/60),y=ax.Y(q[k]);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();});
      legend(ctx,box.L,box.T+8,[{label:'Water',color:PAL['s2']},{label:'Alcohol',color:PAL['s5']},{label:'Oil',color:PAL['s4']}]);return;}
    if(id==='evap'){const h=s.d9.hist;if(h.length<2)return msg('Wet the cloths on the Heat of evaporation tab to fill this graph.');const tmax=Math.max(5,h[h.length-1].t/60);
      const b2={L:box.L,T:box.T+22,W:box.W,H:box.H-22,cw:box.cw,ch:box.ch};const ax=axes(ctx,b2,{xmin:0,xmax:tmax,ymin:0,ymax:30,xl:'Time (min of lab time)',yl:'Temperature (°C)'});
      [['d',PAL['cv-soft']],['w',PAL['s2']],['a',PAL['s5']]].forEach(([q,col])=>{ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.beginPath();h.forEach((r,i)=>{const x=ax.X(r.t/60),y=ax.Y(r[q]);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();});
      legend(ctx,box.L,box.T+8,[{label:'Dry',color:PAL['cv-soft']},{label:'Water cloth',color:PAL['s2']},{label:'Alcohol cloth',color:PAL['s5']}]);return;}
    if(id==='ph'){const d=s.d8;if(d.mode==='buffer'){const b=bufPH(s);const ax=axes(ctx,box,{xmin:0,xmax:2,ymin:0,ymax:14,xcats:['Plain water','Buffered (blood)'],yl:'pH'});bars(ctx,ax,[b.plain,b.buf],{colors:[phColor(b.plain),phColor(b.buf)],d:1});return;}
      if(!d.dipped)return msg('Dip the pH strips at Station 8 to fill this graph.');const ax=axes(ctx,box,{xmin:0,xmax:3,ymin:0,ymax:14,xcats:['Lemon juice','Water','Cleaner'],yl:'pH'});
      bars(ctx,ax,[PH.lemon,PH.water,PH.cleaner],{colors:[phColor(PH.lemon),phColor(PH.water),phColor(PH.cleaner)],d:1});}},
  onLevel(sim){syncStation(sim);},
  initVis(sim){const r=rng(9),v=sim.vis;v.fish=[{x:420,y:350,dir:1},{x:480,y:375,dir:-1}];v.bub=[];v.ions=[];v.liq=[];
    for(let i=0;i<20;i++)v.liq.push({x:((i%5)+0.2+r()*0.6)/5,y:((Math.floor(i/5))+0.2+r()*0.6)/4,a:r()*6.28,va:(r()-.5)*1.4,vx:(r()-.5)*0.1,vy:(r()-.5)*0.1});
    v.ionsN=Array.from({length:15},(_,i)=>({x:((i%5)+0.15+r()*0.7)/5,y:(Math.floor(i/5)+0.15+r()*0.7)/3,ph:r()*6.28}));v.towelSeed=r();
    setTimeout(()=>syncStation(sim),0);},
  narrate(sim){const s=sim.st,stn=sim.p.station,hon=atLeast('honors'),ap=atLeast('ap');
    if(s.intro)return '<b>Water is polar.</b> Oxygen pulls the shared electrons toward itself, so the oxygen end is slightly negative (δ−) and the hydrogen ends slightly positive (δ+). Opposite charges on neighboring molecules attract: those are <b>hydrogen bonds</b>.';
    switch(stn){
      case '0':{const n=s.d0.nb.filter(q=>q.f>=1).length;
        if(!n)return '<b>Water is polar.</b> Inside the molecule, oxygen and hydrogen share electrons (covalent bonds), but oxygen pulls the shared electrons closer. So the oxygen end is slightly negative (δ−) and each hydrogen end is slightly positive (δ+).';
        return '<b>Hydrogen bonds:</b> a δ+ hydrogen on one molecule is attracted to the δ− oxygen of a neighbor (dashed line). '+(n<4?'Add more neighbors: one water molecule can make up to 4.':'This molecule now has all 4: two through its hydrogens and two through its oxygen.')+' Each hydrogen bond is about 20 times weaker than the covalent bonds inside the molecule, so they break and re-form constantly.';}
      case '9':{const d=s.d9;if(!d.on&&!d.hist.length)return 'Three thermometers in front of a fan: one dry, one wrapped in a water-soaked cloth, one in an alcohol-soaked cloth. Predict which gets coldest, and which stays cool longest. Then click the bench or press <b>Wet the cloths and turn on the fan</b>.';
        const qw=(EV.m0-d.m.w)*EV.w.L,qa=(EV.m0-d.m.a)*EV.a.L;
        if(d.m.a>0)return '<b>Evaporation pulls heat away.</b> To escape as a gas, a molecule must break all its hydrogen bonds, and the energy for that comes from the cloth and thermometer. Alcohol evaporates fast, so it cools quickly, but it is going fast too.';
        return '<b>Water has a high heat of evaporation.</b> Each gram that evaporates carries away 2,260 J, compared with 841 J for alcohol. The alcohol cloth dried out, but the water cloth is still cooling. So far water has carried off '+Math.round(qw).toLocaleString('en-US')+' J and alcohol '+Math.round(qa).toLocaleString('en-US')+' J from the same 2 g. This is how sweat cools you, and why it feels cooler by a lake.';}
      case '1':return s.d1.lake>0.05?'<b>Ice floats, so lakes freeze from the top down.</b> In ice, hydrogen bonds lock molecules into an open honeycomb that takes more space than liquid water, so ice is less dense. The ice layer insulates the water below, where fish survive at about 4 °C.':
        '<b>Ice floats.</b> Frozen water is about 9% less dense than liquid water because hydrogen bonds hold the molecules in an open honeycomb. Rubbing alcohol does not even freeze in a kitchen freezer.';
      case '2':{const d=s.d2,liq=d.liq||sim.p.pennyLiquid;if(liq==='water')return '<b>Cohesion:</b> water molecules cling to each other with hydrogen bonds, so the drops pile up into a tall dome before the surface finally breaks'+(d.n?' ('+(d.spilled?d.n-1:d.n)+' drops so far)':'')+'.';
        if(liq==='alcohol')return '<b>Alcohol has weaker cohesion.</b> Each alcohol molecule can make only about half as many hydrogen bonds, so the dome is flat and spills much sooner than water.';
        return '<b>Soap breaks hydrogen bonds at the surface</b>, so soapy water heaps up less and spills sooner than plain water.';}
      case '3':return s.d3.on?'<b>Adhesion pulls water up the towel.</b> Water sticks to the cellulose fibers (adhesion) and drags neighboring water molecules along (cohesion). This is capillary action, the same pull that helps lift water up the xylem of a tree.':
        'The towel is made of cellulose, which is covered in polar –OH groups. Hang it so the end just touches the water and watch.';
      case '4':{const c=s.d4.clip;if(!c)return 'Surface tension is how hard it is to break the surface of a liquid. Predict: will a steel paperclip, which is denser than water, rest on top?';
        return c.state==='float'?'<b>Surface tension holds the paperclip up.</b> Hydrogen bonds pull the surface molecules tight like a stretched skin. The clip dents the surface but does not break it. Water striders and the "Jesus lizard" use the same skin.':
          '<b>The paperclip sank.</b> '+(c.liq==='water'?'Soap pushed between the water molecules and broke the hydrogen-bond skin.':'The '+LIQ[c.liq].name.toLowerCase()+' has weaker attractions at its surface, so its "skin" cannot support the clip.');}
      case '5':{const d=s.d5;if(!d.on&&d.t===0)return 'Three beakers, the same amount of heat. Predict which boils first: water, alcohol or oil.';
        return '<b>Water warms slowly (high specific heat)</b> because much of the heat goes into breaking hydrogen bonds instead of speeding molecules up. Alcohol boils first, at about '+HEAT.a.bp[sim.p.place]+' °C. Oil heats fastest but never boils here; its hydrocarbon chains need over 300 °C.'+(ap&&sim.p.place==='denver'?' In Denver, lower air pressure lets water boil at about 95 °C.':'');}
      case '6':{const d=s.d6;if(!d.salt&&!d.sugar&&!d.oil)return 'Water is called the universal solvent. Add salt, sugar and oil, then stir.';
        return '<b>Polar water surrounds charged and polar particles.</b> The δ− oxygens face Na⁺ and the δ+ hydrogens face Cl⁻, pulling the crystal apart. Sugar dissolves the same way. Oil is nonpolar (hydrophobic), so water ignores it and it floats in a separate layer.';}
      case '7':{const d=s.d7;if(d.charge<0.05)return 'Rubbing the balloon on your hair moves electrons onto it, giving it a negative charge.';
        return sim.p.streamLiquid==='water'?'<b>Water is polar, so a charged balloon pulls the stream sideways.</b> The molecules turn so their δ+ hydrogens face the negative balloon, and the whole stream bends toward it.':
          '<b>Oil is nonpolar</b>, so it has no positive and negative ends to pull on. The stream barely moves.';}
      case '8':{const d=s.d8;if(d.mode==='buffer'){const b=bufPH(s);return '<b>A buffer resists pH change.</b> After '+d.acid+' drop'+(d.acid===1?'':'s')+' of acid, plain water is at pH '+b.plain.toFixed(1)+' but the buffered solution is still '+b.buf.toFixed(2)+'. Bicarbonate in your blood soaks up extra H⁺ the same way.';}
        if(!d.dipped)return 'Pure water is neutral (pH 7): it has equal amounts of H⁺ and OH⁻. Dip pH strips into lemon juice, water and cleaning solution.';
        return '<b>Lemon juice is acidic (about pH 2), water is neutral (7), and cleaning solution is basic (about 11–12).</b>'+(ap?' Each pH step is a factor of 10, so lemon juice has about 100,000 times more H⁺ than water.':' Lower pH means more H⁺ ions.');}}
    return '';},
  /* ---------- drawing ---------- */
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis,stn=p.station;k=Math.min(k,1.3);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,422,540,28);
    txt(ctx,STHEAD(stn),16,26,{s:15*k,w:700});
    const scene={'0':sMolecule,'9':sEvap,'1':sDensity,'2':sCohesion,'3':sAdhesion,'4':sSurface,'5':sHeat,'6':sDissolve,'7':sBalloon,'8':sPH}[stn];
    ctx.save();scene(sim,ctx,vdt,k,t);ctx.restore();
    if(p.mol)drawInset(sim,ctx,vdt,k,t);else{txt(ctx,'Turn on Molecule zoom',668,190,{s:13*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'to see why',668,210,{s:13*k,c:PAL['cv-soft'],a:'center'});}},
  onClick(sim,x,y){const stn=sim.p.station;if(x>540)return;const map={'0':'neighbor','9':'wet','1':'iceDrop','2':'drop','3':'hang','4':'clip','5':'heat','6':'stir','7':'rub','8':'dip'};ACT[map[stn]](sim);},
  thumbSetup(sim){BioLab.setValues(sim,{station:'2'});for(let i=0;i<20;i++)ACT.drop(sim);},
  /* ---------- guidance ---------- */
  tour:[
    {title:'Water is polar',text:'Start with one molecule. Oxygen pulls the shared electrons toward itself, so the oxygen end is slightly negative (δ−) and the two hydrogen ends are slightly positive (δ+).',focus:[60,110,320,250],speed:0.5,setup(sim){BioLab.setValues(sim,{station:'0',mol:true});sim.st.intro=false;ACT.clearN(sim);}},
    {title:'Hydrogen bonds',text:'The δ+ hydrogen of one molecule is attracted to the δ− oxygen of a neighbor. That attraction is a hydrogen bond (dashed line). Every station today is explained by these bonds.',focus:[[40,60,370,330],[546,48,246,262]],speed:0.5,setup(sim){BioLab.setValues(sim,{station:'0'});ACT.clearN(sim);for(let i=0;i<4;i++)ACT.neighbor(sim);}},
    {title:'Station 1: ice floats',text:'Hydrogen bonds lock ice into an open honeycomb, so ice is less dense than liquid water and floats. Lakes freeze from the top down, and fish survive underneath.',focus:[8,40,532,384],speed:1,setup(sim){sim.st.intro=false;BioLab.setValues(sim,{station:'1'});ACT.iceDrop(sim);ACT.winter(sim);}},
    {title:'Station 2: cohesion',text:'Water sticks to itself. Watch the drops pile into a dome on the penny before the surface finally breaks. Then try alcohol.',focus:[[120,110,300,280],[546,48,246,262]],speed:1,setup(sim){BioLab.setValues(sim,{station:'2',pennyLiquid:'water'});ACT.auto(sim);}},
    {title:'Station 3: adhesion',text:'Water sticks to other polar materials, like the cellulose in a paper towel. Adhesion pulls it up and cohesion drags the rest along: capillary action.',focus:[[90,90,260,334],[546,48,246,262]],speed:1,setup(sim){BioLab.setValues(sim,{station:'3'});ACT.newTowel(sim);ACT.hang(sim);}},
    {title:'Station 4: surface tension',text:'Hydrogen bonds pull the surface tight. A steel paperclip, denser than water, rests on that skin.',focus:[[60,150,420,250],[546,48,246,262]],speed:1,setup(sim){BioLab.setValues(sim,{station:'4',clipLiquid:'water'});ACT.clip(sim);}},
    {title:'Station 5: high specific heat',text:'Same heat, three liquids. Water warms slowly because energy goes into breaking hydrogen bonds. Alcohol boils first.',focus:[8,40,532,384],speed:1,setup(sim){BioLab.setValues(sim,{station:'5'});ACT.cool(sim);ACT.heat(sim);}},
    {title:'Heat of evaporation',text:'Wet cloths on two thermometers, with a fan blowing. Evaporating molecules must break all their hydrogen bonds, so they carry heat away. Alcohol cools fast but dries out; each gram of water carries off 2.7 times as much heat. That is how sweat cools you.',focus:[[8,40,532,384],[546,48,246,262]],speed:1,setup(sim){BioLab.setValues(sim,{station:'9'});ACT.dryAll(sim);ACT.wet(sim);}},
    {title:'Station 6: the universal solvent',text:'Water molecules surround each ion and pull the salt crystal apart. Oil is nonpolar, so it stays in its own layer.',focus:[[120,90,280,334],[546,48,246,262]],speed:1,setup(sim){BioLab.setValues(sim,{station:'6'});ACT.emptyBeaker(sim);ACT.salt(sim);ACT.oil(sim);ACT.stir(sim);}},
    {lvl:'bio',title:'Station 7: polarity you can see',text:'A charged balloon pulls on the δ+ ends of water molecules, so the whole stream bends. Oil, which is nonpolar, barely moves.',focus:[8,40,532,384],speed:1,setup(sim){BioLab.setValues(sim,{station:'7',streamLiquid:'water'});ACT.rub(sim);ACT.closer(sim);}},
    {lvl:'bio',title:'Station 8: buffers',text:'Add acid to plain water and the pH crashes. Add it to a buffered solution like blood and the pH barely moves, because bicarbonate soaks up the extra H⁺.',focus:[8,40,532,384],speed:1,setup(sim){BioLab.setValues(sim,{station:'8'});ACT.buffer(sim);ACT.acid5(sim);}}
  ],
  onTourExit(sim){sim.st.intro=false;},
  challenges:[
    {lvl:'bio',q:'Water held about 30 drops on the penny. How many drops of rubbing alcohol will it hold?',choices:['Fewer drops','About the same','More drops'],correct:0,
     baseline:{station:'2',pennyLiquid:'alcohol'},baselineAction:'auto',changeText:'Adding alcohol one drop at a time',watch:'drops',at:0.2,reveal:8,
     explain:{bio:'Alcohol spills after only about 10 drops. Alcohol molecules form fewer hydrogen bonds, so they hold together (cohesion) much less strongly than water.'}},
    {lvl:'bio',q:'A paperclip floats on water. What happens if you place it on rubbing alcohol instead?',choices:['It floats too','It sinks','It floats higher'],correct:1,
     baseline:{station:'4',clipLiquid:'alcohol'},baselineAction:'clip',changeText:'Paperclip placed on alcohol',at:0.2,reveal:3,
     explain:{bio:'It sinks. Alcohol has much lower surface tension because its molecules attract each other less, so its surface cannot hold up the steel clip.'}},
    {lvl:'bio',q:'Water, alcohol and oil get the same heat. Which one boils first?',choices:['Water','Alcohol','Oil','They all boil at once'],correct:1,
     baseline:{station:'5'},baselineAction:'heat',changeText:'Hot plates on',watch:'heat',at:0.2,reveal:14,
     explain:{bio:'Alcohol boils first, at about 78 °C. Water has to reach 100 °C and warms more slowly, because much of the energy breaks hydrogen bonds. Oil heats quickly but its boiling point is far above anything here.'}},
    {lvl:'bio',instant:true,show:'0',q:'Inside one water molecule, what holds the two hydrogen atoms to the oxygen?',choices:['Covalent bonds: the atoms share electrons','Hydrogen bonds','Ionic bonds: oxygen takes the electrons completely','Nothing: they just touch'],correct:0,
     explain:{bio:'Covalent bonds. Oxygen and each hydrogen share a pair of electrons. Oxygen pulls the pair closer, so the bonds are polar covalent: oxygen ends up δ− and the hydrogens δ+. Hydrogen bonds are the weaker attractions between separate molecules.'}},
    {lvl:'bio',q:'Both cloths are wet and the fan is on. Which thermometer gets colder in the first minute?',choices:['The one in the water cloth','The one in the alcohol cloth','Both cool the same'],correct:1,
     baseline:{station:'9'},baselineAction:'wet',changeText:'Fan on, cloths wet',watch:'evap',at:0.2,reveal:5,
     explain:{bio:'The alcohol cloth, which drops to about 10 °C. Alcohol evaporates about five times faster than water, so it pulls heat out quickly. But keep watching: it dries out in under 2 minutes, while the water keeps cooling for over 8. Gram for gram, water carries off 2.7 times more heat.'}},
    {lvl:'bio',instant:true,show:'9',q:'You sweat 2 g of water and it all evaporates. About how much heat does it carry away from your skin? (Water: 2,260 J per gram)',choices:['About 1,100 J','About 4,500 J','About 2,260 J','About 840 J'],correct:1,
     explain:{bio:'2 g × 2,260 J/g = 4,520 J. The same 2 g of alcohol would carry off only 2 × 841 = 1,682 J. Run the Heat of evaporation tab to the end and read both Heat carried off tiles.'}},
    {lvl:'bio',instant:true,show:'1',q:'Ice fishing works because ice forms on top of a lake. Which station shows that property?',choices:['Station 1: density','Station 2: cohesion','Station 6: dissolving','Station 8: acids and bases'],correct:0,
     explain:{bio:'Density. Ice is less dense than liquid water because hydrogen bonds lock it into an open honeycomb, so ice floats and the lake freezes from the top down. The ice insulates the water underneath, where the fish live.'}},
    {lvl:'bio',instant:true,show:'6',q:'Your bloodstream carries sugar, salts and many other things dissolved in water. Which station shows that property?',choices:['Station 4: surface tension','Station 6: dissolving','Station 5: heating','Station 1: density'],correct:1,
     explain:{bio:'Station 6. Water is a polar solvent, so it surrounds charged and polar particles (salt, sugar) and carries them. Nonpolar things like oil and fat do not dissolve, which is why fats travel in blood packaged with proteins.'}},
    {lvl:'bio',q:'You bring a charged balloon close to a thin stream of water. What does the stream do?',choices:['Bends toward the balloon','Bends away from the balloon','Nothing'],correct:0,
     baseline:{station:'7',streamLiquid:'water'},baselineAction:'rub',changeAction:'closer',changeText:'Balloon moved close',at:0.6,reveal:4,
     explain:{bio:'It bends toward the balloon. Water molecules are polar, so they turn their δ+ ends toward the negatively charged balloon and are pulled toward it. That is direct evidence that water carries charge.'}},
    {lvl:'bio',q:'Add soapy water to a penny instead of plain water. Compared with about 30 drops of water, the penny will hold…',choices:['Fewer drops','The same number','More drops'],correct:0,
     baseline:{station:'2',pennyLiquid:'soapy'},baselineAction:'auto',changeText:'Adding soapy water',watch:'drops',at:0.2,reveal:10,
     explain:{bio:'Fewer. Soap molecules wedge between water molecules at the surface and break hydrogen bonds, lowering cohesion and surface tension.'}},
    {lvl:'bio',instant:true,show:'4',q:'A basilisk ("Jesus lizard") can run across the surface of a pond. Which property helps most?',choices:['Surface tension (cohesion)','High specific heat','Water dissolves salts','Ice is less dense'],correct:0,
     explain:{bio:'Surface tension from cohesion. Hydrogen bonds pull the surface molecules tight, and the lizard slaps its feet fast enough to push off that skin before breaking through. Station 4 shows the same skin holding up a paperclip.'}},
    {lvl:'bio',instant:true,show:'3',q:'How does water rise from the roots to the leaves of a tree without a pump?',choices:['Cohesion and adhesion (with evaporation from leaves)','Density','Water is a base','High specific heat'],correct:0,
     explain:{bio:'Water evaporating from the leaves pulls on the column below. Cohesion keeps the column of water molecules connected, and adhesion to the polar walls of the xylem helps it climb. Station 3 shows adhesion pulling water up a paper towel.'}},
    {lvl:'bio',instant:true,show:'3',q:'Why does water in a graduated cylinder form a curved meniscus, and where do you read it?',choices:['Adhesion to the glass pulls water up the sides; read the bottom of the curve','Cohesion pulls the middle up; read the top of the curve','Density; read the top of the curve'],correct:0,
     explain:{bio:'Water adheres to the polar glass and creeps up the walls, so the surface curves down in the middle. Read the volume at the bottom of the meniscus, at eye level.'}},
    {lvl:'bio',q:'Add 5 drops of acid to plain water and to a buffered solution like blood. Which pH changes more?',choices:['Plain water','The buffered solution','They change the same amount'],correct:0,
     baseline:{station:'8'},baselineAction:'buffer',changeAction:'acid5',changeText:'5 drops of acid added to each',watch:'ph',at:0.5,reveal:3,
     explain:{bio:'Plain water drops to about pH 3.3, while the buffer barely moves from 7.4. Bicarbonate (HCO₃⁻) in blood accepts H⁺ to form carbonic acid, so extra acid, like stomach acid that leaks into tissues, is absorbed instead of changing the pH.'}},
    {lvl:'bio',instant:true,show:'8',q:'Lemon juice is about pH 2 and black coffee about pH 5. How much more H⁺ does lemon juice have?',choices:['3 times','30 times','1,000 times','10,000 times'],correct:2,
     explain:{bio:'pH = −log[H⁺], so each unit is a factor of 10. Three units apart is 10 × 10 × 10 = 1,000 times more H⁺.'}},
    {lvl:'bio',instant:true,show:'5',q:'If desert animals’ main body liquid were alcohol instead of water, what would happen on a hot day?',choices:['Their temperature would swing much more, and sweat would evaporate away too fast','Nothing would change','They would stay cooler'],correct:0,
     explain:{bio:'Alcohol has a lower specific heat (2.4 vs 4.2 J/g·°C) and a much lower heat of vaporization. Body temperature would rise much faster, and evaporating it would pull away less heat per gram while drying the animal out. Water’s hydrogen bonds buffer temperature.'}}
  ],
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.show&&phase==='done')BioLab.setValues(sim,{station:ch.show});},
  lab:'<p><b>Observation sheet:</b> open each tab, run it and record what you see. Press Record trial on each tab so your results are saved in the table.</p><ol><li><b>Water molecule:</b> What type of bond holds the atoms together? Why is the molecule polar? Add neighbors: how many hydrogen bonds can one molecule make?</li><li><b>Ice floats:</b> Is the ice floating? Did the alcohol freeze? Which way did the lake freeze?</li><li><b>Cohesion:</b> How many drops of water fit on the penny? Of alcohol? Of soapy water?</li><li><b>Adhesion:</b> Where does the water move on the paper towel?</li><li><b>Surface tension:</b> Does the paperclip float on water? On alcohol? What does soap do?</li><li><b>Specific heat:</b> Which liquid boiled first? Try Denver.</li><li><b>Heat of evaporation:</b> Which cloth got coldest first? Which stayed cool longer? How much heat did each carry off?</li><li><b>Solvent:</b> Did salt, sugar and oil dissolve?</li><li><b>Polarity:</b> What happens to the stream of water? Of oil?</li><li><b>Acids and bases:</b> Record the pH of each sample and circle acid, neutral or base. Then compare plain water with a buffer.</li></ol><p>For each tab, name the property and explain it using hydrogen bonds or polarity.</p>',
  terms:[{t:'Covalent bond',d:'Atoms sharing a pair of electrons. The O–H bonds inside a water molecule are covalent.'},
    {t:'Polar molecule',d:'A molecule with a slightly negative end and a slightly positive end. In water, oxygen is δ− and the hydrogens are δ+.'},
    {t:'Hydrogen bond',d:'The attraction between a δ+ hydrogen on one molecule and a δ− atom (like oxygen) on another.'},
    {t:'Cohesion',d:'Attraction between molecules of the same kind, like water to water.'},
    {t:'Adhesion',d:'Attraction between different kinds of molecules, like water to glass or paper.'},
    {t:'Surface tension',d:'How hard it is to stretch or break the surface of a liquid.'},
    {t:'Density',d:'Mass per unit of volume. Ice (0.92 g/mL) is less dense than liquid water (1.00 g/mL).'},
    {t:'Solvent',d:'The substance that does the dissolving. Water dissolves polar and charged particles.'},
    {t:'pH',d:'A scale from 0 to 14 for how acidic or basic a solution is. 7 is neutral.'},
    {lvl:'bio',t:'Capillary action',d:'Water moving up a narrow space because of adhesion and cohesion.'},
    {lvl:'bio',t:'Specific heat',d:'The energy needed to raise 1 g of a substance by 1 °C. Water’s is high: 4.18 J/g·°C.'},
    {lvl:'bio',t:'Heat of vaporization (evaporation)',d:'The energy needed to turn a liquid into a gas: 2,260 J per gram for water, 841 for alcohol. Water’s is very high, so sweating cools you.'},
    {lvl:'bio',t:'Evaporative cooling',d:'When the fastest molecules escape as gas, they carry heat away, so what is left behind gets cooler.'},
    {lvl:'bio',t:'Hydrophilic / hydrophobic',d:'Water-loving (polar or charged, dissolves) versus water-fearing (nonpolar, like oil).'},
    {lvl:'bio',t:'Buffer',d:'A solution that resists changes in pH by absorbing or releasing H⁺.'},
    {lvl:'bio',t:'Emergent property',d:'A property that appears from many molecules interacting, not from one molecule alone.'}],
  about:'<p>Each station is a small rule-based model tuned to typical classroom results, not a full physics simulation.</p><ul><li><b>Penny:</b> the number of drops is chosen at random within typical ranges: water 25–35, alcohol 8–12, soapy water 12–18.</li><li><b>Paper towel:</b> the rise follows h ∝ √t (the Washburn pattern) and stops at 11 cm.</li><li><b>Heating demo:</b> 100 g of each liquid gets the same heat. Temperature rises as heat ÷ (mass × specific heat): water 4.18, alcohol 2.44, oil about 1.9 J/g·°C. Boiling points are 100 and 78 °C at sea level, about 95 and 74 °C in Denver. The oil would smoke long before boiling, so the demo stops it near 190 °C. Lab time is sped up.</li><li><b>Water molecule:</b> a diagram. The 104.5° angle and the four hydrogen-bond positions are real; the bond energies (O–H about 460 kJ/mol, a hydrogen bond about 23) are typical textbook values.</li><li><b>Wet thermometers:</b> each bulb holds 2 g of liquid. It gains heat from the 25 °C air at 1.13 W per °C and loses (evaporation rate × heat of vaporization). Rates are fixed while liquid remains: water 0.004 g/s, alcohol 0.020 g/s; heats of vaporization 2,260 and 841 J/g; bulb heat capacity 34 J/°C. Real rates also depend on humidity and temperature. Lab time is sped up 10 times.</li><li><b>Dissolving:</b> stirring speeds dissolving. Amounts are small enough that salt and sugar always fully dissolve.</li><li><b>pH:</b> values are typical, not measured; the buffer model is simplified.</li><li><b>Molecule views:</b> diagrams, not to scale in number or spacing.</li></ul>'
};

/* ---------- station scenes ---------- */
function wrapTxt(ctx,str,x,y,w,lh,o){o=o||{};ctx.font=(o.w||400)+' '+o.s+'px '+FONT;const words=str.split(' ');let line='',yy=y;
  words.forEach(wd=>{const tst=line?line+' '+wd:wd;if(ctx.measureText(tst).width>w&&line){txt(ctx,line,x,yy,o);line=wd;yy+=lh;}else line=tst;});if(line)txt(ctx,line,x,yy,o);return yy+lh;}
const MOL0={x:205,y:245,ang:-Math.PI/2,S:4,gap:70,ns:2.2};
function molSites(){const M=MOL0,dH=13*M.S,out=[];const H=[M.ang-0.91,M.ang+0.91].map(a=>[M.x+Math.cos(a)*dH,M.y+Math.sin(a)*dH,a]);
  // donor: center H → neighbor O; acceptor: neighbor H → center O (lone-pair directions)
  const acc=[M.ang+Math.PI+0.95,M.ang+Math.PI-0.95];
  [0,1].forEach(i=>{const h=H[i],u=[Math.cos(h[2]),Math.sin(h[2])];out.push({kind:'don',O:[h[0]+u[0]*M.gap,h[1]+u[1]*M.gap],ang:h[2],from:[h[0],h[1]],dir:u});
    const a=acc[i],v=[Math.cos(a),Math.sin(a)],dHn=13*M.ns;out.push({kind:'acc',O:[M.x+v[0]*(M.gap+dHn),M.y+v[1]*(M.gap+dHn)],ang:a+Math.PI+0.91,dir:v});});
  return [out[0],out[1],out[2],out[3]];}
function sMolecule(sim,ctx,vdt,k,t){const d=sim.st.d0,M=MOL0,S=M.S,dH=13*S,rO=8.5*S,rH=5.2*S,jig=RM?0:1;
  const a1=M.ang-0.91,a2=M.ang+0.91,H1=[M.x+Math.cos(a1)*dH,M.y+Math.sin(a1)*dH],H2=[M.x+Math.cos(a2)*dH,M.y+Math.sin(a2)*dH];
  const glow=(p,r,col)=>{const g=ctx.createRadialGradient(p[0],p[1],r*0.2,p[0],p[1],r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p[0],p[1],r,0,6.29);ctx.fill();};
  glow([M.x,M.y],rO*2.1,'rgba(214,69,69,0.30)');glow(H1,rH*2.2,'rgba(61,127,214,0.30)');glow(H2,rH*2.2,'rgba(61,127,214,0.30)');
  // neighbors and hydrogen bonds
  const sites=molSites();
  d.nb.forEach((q,i)=>{const st=sites[i],e=1-Math.pow(1-q.f,3),off=(1-e)*220,dx=st.kind==='don'?st.dir[0]:st.dir[0],dy=st.dir[1];
    const x=st.O[0]+dx*off,y=st.O[1]+dy*off,w=water(ctx,x+Math.sin(t*2+i)*0.8*jig,y+Math.cos(t*2.3+i)*0.8*jig,st.ang,M.ns);
    if(q.f>=1){const pulse=0.65+0.3*Math.sin(t*3+i)*jig;ctx.save();ctx.globalAlpha=pulse;ctx.setLineDash([6,5]);ctx.strokeStyle=PAL['s2'];ctx.lineWidth=3;ctx.beginPath();
      if(st.kind==='don'){ctx.moveTo(st.from[0]+st.dir[0]*rH,st.from[1]+st.dir[1]*rH);ctx.lineTo(w.O[0]-st.dir[0]*8.5*M.ns,w.O[1]-st.dir[1]*8.5*M.ns);}
      else{const h=w.H[0];ctx.moveTo(h[0]-st.dir[0]*5.2*M.ns,h[1]-st.dir[1]*5.2*M.ns);ctx.lineTo(M.x+st.dir[0]*rO,M.y+st.dir[1]*rO);}
      ctx.stroke();ctx.restore();}});
  // the big molecule
  ctx.strokeStyle=C.Hs;ctx.lineWidth=2;[H1,H2].forEach(h=>{ctx.fillStyle=C.H;ctx.beginPath();ctx.arc(h[0],h[1],rH,0,6.29);ctx.fill();ctx.stroke();txt(ctx,'H',h[0],h[1]+1,{s:17*k,w:800,c:'#33404d',a:'center',b:'middle'});});
  ctx.fillStyle=C.O;ctx.beginPath();ctx.arc(M.x,M.y,rO,0,6.29);ctx.fill();txt(ctx,'O',M.x,M.y+12,{s:20*k,w:800,c:'#fff',a:'center',b:'middle'});
  // shared electron pairs sit closer to O; lone pairs on O
  const eDot=(x,y)=>{ctx.fillStyle=PAL['cv-e'];ctx.strokeStyle='#5a4a00';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,3.6,0,6.29);ctx.fill();ctx.stroke();};
  [a1,a2].forEach((a,i)=>{const u=0.40+0.10*Math.sin(t*2.2+i*2)*jig,cx=M.x+Math.cos(a)*dH*u,cy=M.y+Math.sin(a)*dH*u,px=-Math.sin(a)*5,py=Math.cos(a)*5;eDot(cx+px,cy+py);eDot(cx-px,cy-py);});
  [M.ang+Math.PI+0.6,M.ang+Math.PI-0.6].forEach(a=>{const cx=M.x+Math.cos(a)*(rO-9),cy=M.y+Math.sin(a)*(rO-9),px=-Math.sin(a)*5,py=Math.cos(a)*5;eDot(cx+px,cy+py);eDot(cx-px,cy-py);});
  // angle and charges
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(M.x,M.y,rO+10,a1,a2);ctx.stroke();txt(ctx,'104.5°',M.x,M.y-rO-20,{s:12*k,w:700,a:'center'});
  txt(ctx,'δ−',M.x,M.y+rO+22,{s:18*k,w:800,c:C.O,a:'center',b:'middle'});
  txt(ctx,'δ+',H1[0]-rH-16,H1[1]+6,{s:18*k,w:800,c:PAL['s2'],a:'center',b:'middle'});txt(ctx,'δ+',H2[0]+rH+16,H2[1]+6,{s:18*k,w:800,c:PAL['s2'],a:'center',b:'middle'});
  // key
  const KX=372,KW=160;let y=74;
  txt(ctx,'Inside the molecule',KX,y,{s:12.5*k,w:700});y+=18*k;
  eDot(KX+5,y-4);eDot(KX+14,y-4);y=wrapTxt(ctx,'shared electrons (covalent bond). Oxygen pulls them closer.',KX+24,y,KW-24,15*k,{s:11.5*k,c:PAL['cv-soft']});y+=10;
  txt(ctx,'Between molecules',KX,y,{s:12.5*k,w:700});y+=18*k;
  ctx.setLineDash([6,5]);ctx.strokeStyle=PAL['s2'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(KX,y-4);ctx.lineTo(KX+20,y-4);ctx.stroke();ctx.setLineDash([]);
  y=wrapTxt(ctx,'hydrogen bond: δ+ H attracted to δ− O',KX+26,y,KW-26,15*k,{s:11.5*k,c:PAL['cv-soft']});y+=10;
  const n=d.nb.filter(q=>q.f>=1).length;txt(ctx,'Hydrogen bonds: '+n+' of 4',KX,y+4,{s:14*k,w:800,c:n?PAL['s2']:PAL['cv-ink']});
  if(!d.nb.length)txt(ctx,'Click the bench or press Add a neighbor molecule',16,412,{s:12*k,c:PAL['cv-soft']});}
function sEvap(sim,ctx,vdt,k,t){const d=sim.st.d9,v=sim.vis,on=d.on,jig=RM?0:1;
  // fan
  const FX=62,FY=250;ctx.fillStyle='#4b515c';ctx.fillRect(FX-4,FY+40,8,120);rr(ctx,FX-28,FY+156,56,10,4);ctx.fill();
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(FX,FY,44,0,6.29);ctx.stroke();
  v.fanA=(v.fanA||0)+(on?vdt*14*jig:0);for(let i=0;i<3;i++){const a=v.fanA+i*2.094;ctx.fillStyle='#8aa4bd';ctx.beginPath();ctx.ellipse(FX+Math.cos(a)*20,FY+Math.sin(a)*20,20,8,a,0,6.29);ctx.fill();}
  ctx.fillStyle='#4b515c';ctx.beginPath();ctx.arc(FX,FY,6,0,6.29);ctx.fill();txt(ctx,on?'Fan on':'Fan off',FX,FY-58,{s:12*k,w:700,a:'center'});
  if(on){ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=0.45;ctx.lineWidth=1.5;for(let i=0;i<4;i++){const y=FY-30+i*20,x0=112+((t*80+i*37)%36)*jig;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0+22,y);ctx.stroke();}ctx.globalAlpha=1;}
  // thermometers: 0–30 °C
  const TH=[['d','Dry',175,null],['w','Water',265,LIQ.water.col],['a','Alcohol',355,'#cfd8de']],Y0=330,Y1=150;
  TH.forEach(([q,name,x,col])=>{const T=d.T[q];
    txt(ctx,name,x,102,{s:12.5*k,w:700,a:'center'});txt(ctx,T.toFixed(1)+' °C',x,124,{s:16*k,w:800,a:'center',c:q==='d'?PAL['cv-ink']:T<EV.room-0.5?PAL['s2']:PAL['cv-ink']});
    ctx.fillStyle=PAL['card'];rr(ctx,x-6,Y1-8,12,Y0-Y1+20,6);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.stroke();
    for(let c=0;c<=30;c+=10){const y=Y0-(c/30)*(Y0-Y1);ctx.beginPath();ctx.moveTo(x+8,y);ctx.lineTo(x+14,y);ctx.stroke();if(q==='d')txt(ctx,c+'°',x-12,y+4,{s:10.5*k,c:PAL['cv-soft'],a:'right'});}
    const th=clamp(T/30,0,1)*(Y0-Y1);ctx.fillStyle='#d32f2f';ctx.fillRect(x-2.5,Y0-th,5,th+12);ctx.beginPath();ctx.arc(x,Y0+20,11,0,6.29);ctx.fill();
    if(col){const wet=d.m[q]/EV.m0;ctx.fillStyle='#d9c9a3';rr(ctx,x-17,Y0+2,34,38,7);ctx.fill();if(wet>0){ctx.globalAlpha=0.35+0.6*wet;ctx.fillStyle=col;rr(ctx,x-17,Y0+2,34,38,7);ctx.fill();ctx.globalAlpha=1;}
      ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.2;rr(ctx,x-17,Y0+2,34,38,7);ctx.stroke();
      txt(ctx,!on&&!d.hist.length?'dry cloth':d.m[q]>0&&k>1.15?d.m[q].toFixed(1)+' g':d.m[q]>0?d.m[q].toFixed(2)+' g left':'dried out',x,Y0+58,{s:11*k,w:600,a:'center',c:d.m[q]>0||!d.hist.length?PAL['cv-soft']:PAL['s1']});
      if(on&&d.m[q]>0&&!RM){ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=0.5;ctx.lineWidth=1.2;const nW=q==='a'?3:2;for(let i=0;i<nW;i++){const yy=Y0-4-((t*(q==='a'?40:22)+i*14)%34);ctx.beginPath();ctx.moveTo(x+20+i*4,yy+12);ctx.quadraticCurveTo(x+26+i*4,yy+6,x+20+i*4,yy);ctx.stroke();}ctx.globalAlpha=1;}}});
  txt(ctx,'Room air 25 °C · lab time '+Math.floor(d.t/60)+':'+String(Math.floor(d.t%60)).padStart(2,'0')+' (sped up)',128,414,{s:11.5*k,c:PAL['cv-soft']});
  // per-gram comparison
  const PX=428,PY=70,PW=106,PH=232;rr(ctx,PX,PY,PW,PH,8);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  wrapTxt(ctx,'Heat carried off per gram',PX+8,PY+18,PW-14,14*k,{s:11*k,w:700});
  const base=PY+PH-34,top=PY+92,bw=30;[['Water',EV.w.L,PAL['s2'],PX+14],['Alcohol',EV.a.L,PAL['s5'],PX+60]].forEach(([nm,L,col,x])=>{const h=(L/2400)*(base-top);
    ctx.fillStyle=col;ctx.fillRect(x,base-h,bw,h);txt(ctx,L.toLocaleString('en-US')+' J',x+bw/2,base-h-6,{s:11*k,w:700,a:'center'});txt(ctx,nm,x+bw/2,base+15,{s:10.5*k,a:'center',c:PAL['cv-soft']});});}
function sDensity(sim,ctx,vdt,k,t){const d=sim.st.d1;
  // A: beaker with floating ice
  beaker(ctx,30,160,150,240,LIQ.water.col,170);txt(ctx,'Ice in tap water',105,150,{s:12*k,w:700,a:'center'});
  d.ice.forEach(c=>{ctx.save();ctx.translate(c.x+20,c.y);ctx.rotate(c.ang);ctx.fillStyle=C.ice;ctx.strokeStyle=C.iceS;ctx.lineWidth=2;rr(ctx,-18,-18,36,36,6);ctx.fill();ctx.stroke();ctx.restore();});
  ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(33,231);ctx.lineTo(177,231);ctx.stroke();
  if(d.ice.length)txt(ctx,'≈90% below the surface',105,415,{s:11.5*k,c:PAL['cv-soft'],a:'center'});
  // B: freezer test tubes
  rr(ctx,200,150,140,250,8);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=2;ctx.stroke();
  txt(ctx,'Freezer, −18 °C',270,172,{s:12*k,w:700,a:'center'});
  [[235,'Water',true],[305,'Alcohol',false]].forEach(([x,l,fz])=>{ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-14,195);ctx.lineTo(x-14,340);ctx.arc(x,340,14,Math.PI,0,true);ctx.lineTo(x+14,195);ctx.stroke();
    ctx.fillStyle=fz?C.ice:LIQ.alcohol.col;ctx.beginPath();ctx.moveTo(x-12,fz?240:250);ctx.lineTo(x-12,340);ctx.arc(x,340,12,Math.PI,0,true);ctx.lineTo(x+12,fz?240:250);
    if(fz){ctx.quadraticCurveTo(x,226,x-12,240);}ctx.closePath();ctx.fill();
    txt(ctx,l,x,375,{s:12*k,w:600,a:'center'});txt(ctx,fz?'frozen':'still liquid',x,392,{s:11*k,c:PAL['cv-soft'],a:'center'});});
  // C: lake cross-section
  const L=355,R=535,top=180;ctx.fillStyle=PAL['cv-water'];ctx.beginPath();ctx.moveTo(L,top);ctx.lineTo(R,top);ctx.lineTo(R-15,420);ctx.lineTo(L+15,420);ctx.closePath();ctx.fill();
  txt(ctx,'A lake in winter',445,150,{s:12*k,w:700,a:'center'});
  const th=d.lake*42;if(th>1){ctx.fillStyle=C.ice;ctx.fillRect(L,top,R-L,th);ctx.strokeStyle=C.iceS;ctx.strokeRect(L,top,R-L,th);txt(ctx,'ice 0 °C',L+8,top+Math.min(th,30)-4,{s:11*k,w:600,c:'#2b4a63'});}
  txt(ctx,d.lake>0.05?'4 °C, densest water sinks':'',445,412,{s:11*k,c:PAL['cv-soft'],a:'center'});
  sim.vis.fish.forEach(f=>{f.x+=f.dir*vdt*18;if(f.x>R-30||f.x<L+30)f.dir*=-1;ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.ellipse(f.x,f.y,12,5,0,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(f.x-f.dir*11,f.y);ctx.lineTo(f.x-f.dir*19,f.y-5);ctx.lineTo(f.x-f.dir*19,f.y+5);ctx.closePath();ctx.fill();});}

function sCohesion(sim,ctx,vdt,k,t){const d=sim.st.d2,p=sim.p,liq=d.liq||p.pennyLiquid;
  ctx.fillStyle=C.towel;ctx.fillRect(110,330,320,28);ctx.strokeStyle=PAL['line'];ctx.strokeRect(110,330,320,28);
  const cx=270,cy=330;ctx.fillStyle=C.copperD;ctx.beginPath();ctx.ellipse(cx,cy+4,72,20,0,0,6.29);ctx.fill();ctx.fillStyle=C.copper;ctx.beginPath();ctx.ellipse(cx,cy,72,20,0,0,6.29);ctx.fill();
  txt(ctx,'Penny',cx+92,cy+4,{s:12*k,c:PAL['cv-soft']});
  const held=d.spilled?d.n-1:d.n,frac=clamp(held/(d.max[liq]||30),0,1),H=d.spilled?6:DOME[liq]*Math.pow(frac,0.7);
  if(held>0){ctx.fillStyle=LIQ[liq].col;ctx.globalAlpha=0.85;ctx.beginPath();ctx.ellipse(cx,cy,Math.min(70,30+held*3),20,0,Math.PI,0,true);ctx.ellipse(cx,cy,Math.min(70,30+held*3),H+3,0,0,Math.PI,true);ctx.fill();ctx.globalAlpha=1;
    ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(cx,cy,Math.min(70,30+held*3),H+3,0,Math.PI,0);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.ellipse(cx-18,cy-H*0.6,10,3,-0.3,0,6.29);ctx.fill();}
  if(d.spilled){const r=Math.min(140,80+d.spillT*120);ctx.fillStyle=LIQ[liq].col;ctx.globalAlpha=0.6;ctx.beginPath();ctx.ellipse(cx,cy+16,r,12,0,0,6.29);ctx.fill();ctx.globalAlpha=1;
    pill(ctx,'Spilled!',cx,cy-60,PAL['s1'],'#fff',13*k);}
  // pipet
  ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;rr(ctx,cx-8,60,16,80,6);ctx.fill();ctx.stroke();ctx.fillStyle=LIQ[p.pennyLiquid].col;ctx.fillRect(cx-6,95,12,44);
  ctx.fillStyle=PAL['s1'];rr(ctx,cx-11,46,22,22,8);ctx.fill();ctx.beginPath();ctx.moveTo(cx-5,140);ctx.lineTo(cx+5,140);ctx.lineTo(cx,152);ctx.closePath();ctx.fillStyle=PAL['cv-glass'];ctx.fill();
  d.falling.forEach(f=>{const yEnd=cy-H-4;if(f.y>yEnd)return;ctx.fillStyle=LIQ[liq].col;ctx.strokeStyle=PAL['cv-bstroke'];ctx.beginPath();ctx.arc(cx,f.y,5,0,6.29);ctx.fill();ctx.stroke();});
  txt(ctx,String(held),80,140,{s:44*k,w:800,c:PAL['s2'],a:'center'});txt(ctx,'drops of '+LIQ[liq].name.toLowerCase(),80,165,{s:12*k,c:PAL['cv-soft'],a:'center'});
  const best=d.best,keys=Object.keys(best).filter(x=>best[x]);if(keys.length)txt(ctx,'Best: '+keys.map(x=>LIQ[x].name+' '+best[x]).join(' · '),270,400,{s:12*k,c:PAL['cv-soft'],a:'center'});}

function sAdhesion(sim,ctx,vdt,k,t){const d=sim.st.d3,hon=atLeast('honors');
  const bx=110,bw=170,by=240,bh=170;beaker(ctx,bx,by,bw,bh,C.blueDye,110);
  ctx.fillStyle='#8a5a2b';rr(ctx,90,104,220,10,4);ctx.fill();ctx.fillStyle='#f0c54a';ctx.fillRect(100,104,180,10);txt(ctx,'pencil',300,98,{s:11*k,c:PAL['cv-soft']});
  const sx=180,sw=38,top=114,bot=by+bh-104;ctx.fillStyle=C.towel;ctx.fillRect(sx,top,sw,bot-top);ctx.strokeStyle=PAL['line'];ctx.strokeRect(sx,top,sw,bot-top);
  if(d.on){const px=22,wet=d.h*px,y0=by+bh-110;const g=ctx.createLinearGradient(0,y0-wet,0,y0);g.addColorStop(0,'rgba(61,127,214,0.15)');g.addColorStop(0.25,'rgba(61,127,214,0.65)');g.addColorStop(1,'rgba(61,127,214,0.9)');
    ctx.fillStyle=g;ctx.fillRect(sx,Math.max(top,y0-wet),sw,Math.min(wet,y0-top)+ (bot-y0));}
  // ruler
  const rx=sx+sw+8,y0=by+bh-110;ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(rx,y0-11*22-4,22,11*22+8);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.strokeRect(rx,y0-11*22-4,22,11*22+8);
  for(let c=0;c<=11;c++){const y=y0-c*22;ctx.beginPath();ctx.moveTo(rx,y);ctx.lineTo(rx+(c%5===0?12:7),y);ctx.stroke();if(c%2===0)txt(ctx,String(c),rx+20,y+4,{s:9.5*k,c:PAL['cv-soft'],a:'right'});}
  txt(ctx,'cm',rx+11,y0+20,{s:10*k,c:PAL['cv-soft'],a:'center'});
  if(hon){// graduated cylinder with meniscus
    const gx=330,gw=40,gy=150,gh=250,lv=gy+gh-150;ctx.fillStyle=LIQ.water.col;ctx.fillRect(gx+2,lv,gw-4,gy+gh-lv-2);
    ctx.fillStyle=PAL['cv-bg'];ctx.beginPath();ctx.moveTo(gx+2,lv-6);ctx.quadraticCurveTo(gx+gw/2,lv+8,gx+gw-2,lv-6);ctx.lineTo(gx+gw-2,lv);ctx.lineTo(gx+2,lv);ctx.closePath();ctx.fill();
    ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(gx+2,lv-6);ctx.quadraticCurveTo(gx+gw/2,lv+8,gx+gw-2,lv-6);ctx.stroke();
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.strokeRect(gx,gy,gw,gh);for(let m=0;m<=10;m++){const y=gy+gh-m*25;ctx.beginPath();ctx.moveTo(gx,y);ctx.lineTo(gx+(m%2?8:14),y);ctx.stroke();if(m%2===0)txt(ctx,String(m*10),gx-6,y+4,{s:9.5*k,c:PAL['cv-soft'],a:'right'});}
    txt(ctx,'Meniscus',gx+gw/2,gy-22,{s:11.5*k,w:700,a:'center'});txt(ctx,'read the bottom: 60 mL',gx+gw/2,gy-8,{s:10.5*k,c:PAL['cv-soft'],a:'center'});
    // tree with xylem
    const tx=490;ctx.fillStyle='#7a5a3a';ctx.fillRect(tx-8,230,16,180);ctx.fillStyle=PAL['cv-leaf'];ctx.beginPath();ctx.arc(tx,210,44,0,6.29);ctx.fill();
    for(let i=0;i<6;i++){const y=410-((t*40+i*30)%180);ctx.fillStyle=C.blueDye;ctx.beginPath();ctx.arc(tx,y,3,0,6.29);ctx.fill();}
    txt(ctx,'Xylem in a tree',tx,152,{s:11*k,w:600,a:'center'});}}

function sSurface(sim,ctx,vdt,k,t){const d=sim.st.d4,p=sim.p,hon=atLeast('honors'),c=d.clip,liq=c?c.liq:p.clipLiquid;
  const x0=80,x1=460,surf=318,bottom=380;ctx.fillStyle=d.soap&&liq==='water'?LIQ.soapy.col:LIQ[liq].col;ctx.beginPath();ctx.moveTo(x0,surf);
  const dip=c&&c.state==='float'?10:0,cx=270;for(let x=x0;x<=x1;x+=4){const dd=Math.abs(x-cx)<70?dip*Math.cos((x-cx)/70*Math.PI/2):0;ctx.lineTo(x,surf+dd);}
  ctx.lineTo(x1,bottom);ctx.lineTo(x0,bottom);ctx.closePath();ctx.fill();
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0-6,290);ctx.lineTo(x0-6,bottom+4);ctx.lineTo(x1+6,bottom+4);ctx.lineTo(x1+6,290);ctx.stroke();
  txt(ctx,'Petri dish of '+LIQ[liq].name.toLowerCase()+(d.soap&&liq==='water'?' + soap':''),270,410,{s:12*k,c:PAL['cv-soft'],a:'center'});
  if(c){ctx.strokeStyle='#8c949e';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx-55,c.y);ctx.lineTo(cx+55,c.y);ctx.stroke();ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx-40,c.y-4);ctx.lineTo(cx+48,c.y-4);ctx.stroke();ctx.lineCap='butt';
    pill(ctx,c.state==='float'?'Floats':'Sinks',cx,260,c.state==='float'?PAL['s3']:PAL['s1'],'#fff',13*k);}
  else{// tweezers holding clip above
    ctx.strokeStyle='#8c949e';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(215,170);ctx.lineTo(325,170);ctx.stroke();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(270,100);ctx.lineTo(262,168);ctx.moveTo(276,100);ctx.lineTo(278,168);ctx.stroke();}
  if(hon){// water strider
    const wx=400+Math.sin(t*0.8)*25,wy=surf-6;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.ellipse(wx,wy-4,9,3,0,0,6.29);ctx.fill();
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(wx+a*4,wy-3);ctx.lineTo(wx+a*20,wy+(b>0?2:0));ctx.stroke();});
    if(liq==='water'&&!d.soap)txt(ctx,'water strider',wx,wy-16,{s:10.5*k,c:PAL['cv-soft'],a:'center'});}}

function sHeat(sim,ctx,vdt,k,t){const d=sim.st.d5,p=sim.p,v=sim.vis;
  const B=[['w','Water',LIQ.water.col,100],['a','Alcohol',LIQ.alcohol.col,270],['o','Oil',LIQ.oil.col,440]];
  B.forEach(([key,name,col,x])=>{const T=d.T[key],H=HEAT[key],bp=H.bp?H.bp[p.place]:null,boiling=bp!==null&&T>=bp-0.01&&d.on;
    ctx.fillStyle='#3b3f46';rr(ctx,x-70,385,140,26,5);ctx.fill();ctx.fillStyle=d.on?'#e0534a':'#6d727a';ctx.fillRect(x-55,382,110,5);
    beaker(ctx,x-50,270,100,112,col,80);
    if(boiling){for(let i=0;i<5;i++){const yy=375-((t*60+i*17)%70);ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x-35+i*17,yy,3.5,0,6.29);ctx.stroke();}
      ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=0.5;for(let i=0;i<3;i++){const yy=246-((t*30+i*12)%24);ctx.beginPath();ctx.moveTo(x-15+i*15,yy+20);ctx.quadraticCurveTo(x-5+i*15,yy+10,x-15+i*15,yy);ctx.stroke();}ctx.globalAlpha=1;}
    if(key==='o'&&T>170){ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=0.4;for(let i=0;i<3;i++){const yy=246-((t*20+i*12)%24);ctx.beginPath();ctx.moveTo(x-10+i*10,yy+20);ctx.quadraticCurveTo(x+i*10,yy+10,x-10+i*10,yy);ctx.stroke();}ctx.globalAlpha=1;}
    // thermometer
    ctx.fillStyle=PAL['card'];rr(ctx,x+30,170,10,150,5);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.stroke();const th=clamp(T/200,0,1)*130;ctx.fillStyle='#d32f2f';ctx.fillRect(x+32.5,318-th,5,th+2);
    txt(ctx,name,x,150,{s:13*k,w:700,a:'center'});txt(ctx,Math.round(T)+' °C',x-12,180,{s:16*k,w:800,a:'center',c:boiling?PAL['s1']:PAL['cv-ink']});
    txt(ctx,boiling?'boiling':(key==='o'?(T>170?'smoking soon':'heating'):(d.on?'heating':'')),x-12,198,{s:11*k,c:PAL['cv-soft'],a:'center'});});
  txt(ctx,'Lab time '+fmtTime(d.t)+' min (sped up)',530,60,{s:12*k,c:PAL['cv-soft'],a:'right'});
  if(atLeast('ap'))txt(ctx,p.place==='denver'?'Denver: lower air pressure':'Sea level',530,78,{s:11.5*k,c:PAL['cv-soft'],a:'right'});}

function sDissolve(sim,ctx,vdt,k,t){const d=sim.st.d6,v=sim.vis;
  const bx=150,bw=240,by=200,bh=210;beaker(ctx,bx,by,bw,bh,LIQ.water.col,180);
  // oil layer
  const oilTh=Math.min(30,d.oil*9);if(oilTh){ctx.fillStyle=LIQ.oil.col;ctx.fillRect(bx+3,by+bh-180,bw-6,oilTh);}
  d.drops.forEach(o=>{const top=by+bh-180+oilTh;o.y=Math.max(top+o.r,o.y-vdt*40);ctx.fillStyle=LIQ.oil.col;ctx.strokeStyle=C.oilS;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,6.29);ctx.fill();ctx.stroke();});
  d.drops=d.drops.filter(o=>o.y>by+bh-180+oilTh+o.r+0.5);
  // grains fall and shrink as they dissolve
  d.grains.forEach(g=>{const f=g.k==='salt'?d.fs:d.fu;g.y=Math.min(by+bh-12,g.y+vdt*150);const sz=6*(1-f);if(sz<0.4)return;ctx.fillStyle=g.k==='salt'?'#ffffff':'#f6efe0';ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;
    if(g.k==='salt'){ctx.fillRect(g.x-sz/2,g.y-sz/2,sz,sz);ctx.strokeRect(g.x-sz/2,g.y-sz/2,sz,sz);}else{ctx.beginPath();ctx.arc(g.x,g.y,sz/2,0,6.29);ctx.fill();ctx.stroke();}});
  // dissolved particles spread through the beaker
  const nS=Math.round(d.fs*18*Math.min(1,d.salt)),nU=Math.round(d.fu*14*Math.min(1,d.sugar));
  v.ionsN.forEach((q,i)=>{if(i>=Math.max(nS,nU))return;const x=bx+15+((q.x+Math.sin(t*0.6+q.ph)*0.03)%1)*(bw-30),y=by+bh-160+oilTh+((q.y+Math.cos(t*0.5+q.ph)*0.03)%1)*(140-oilTh);
    if(i<nS){ctx.fillStyle=i%2?C.na:C.cl;ctx.beginPath();ctx.arc(x,y,3.2,0,6.29);ctx.fill();}
    if(i<nU){ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(x+8,y+6,2.6,0,6.29);ctx.fill();}});
  if(d.stir>0){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=4;const a=t*6;ctx.beginPath();ctx.moveTo(270+Math.cos(a)*40,150);ctx.lineTo(270+Math.cos(a)*30,by+bh-30);ctx.stroke();
    ctx.globalAlpha=0.35;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(270,by+bh-90,70,12,0,a,a+4);ctx.stroke();ctx.globalAlpha=1;}
  txt(ctx,'20 mL of water',270,180,{s:12*k,c:PAL['cv-soft'],a:'center'});
  if(d.oil)txt(ctx,'oil layer',bx+bw+10,by+bh-170,{s:11*k,c:PAL['cv-soft']});
  const legY=414;[['Na⁺',C.na],['Cl⁻',C.cl],['sugar',PAL['s4']]].forEach(([l,c],i)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(410,legY-140+i*20,4,0,6.29);ctx.fill();txt(ctx,l,420,legY-136+i*20,{s:11.5*k,c:PAL['cv-soft']});});}

function sBalloon(sim,ctx,vdt,k,t){const d=sim.st.d7,p=sim.p,liq=p.streamLiquid;
  ctx.fillStyle='#8c949e';rr(ctx,200,58,90,22,6);ctx.fill();ctx.fillRect(250,78,16,16);txt(ctx,'faucet',245,52,{s:11*k,c:PAL['cv-soft'],a:'center'});
  // sink
  ctx.fillStyle=PAL['cv-bg2'];ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(150,405);ctx.lineTo(430,405);ctx.lineTo(410,420);ctx.lineTo(170,420);ctx.closePath();ctx.fill();ctx.stroke();
  const x0=258,y0=94,y1=405,bxN=d.near?362:470,by=255;
  ctx.strokeStyle=LIQ[liq].col;ctx.lineWidth=liq==='oil'?5:4;ctx.beginPath();for(let y=y0;y<=y1;y+=5){const f=(y-y0)/(y1-y0);const u=(y-y0)/(by-y0),dx=d.defl*(u<1?u*u:1+(u-1)*0.6)+Math.sin(y*0.3+t*20)*0.6;y===y0?ctx.moveTo(x0+dx,y):ctx.lineTo(x0+dx,y);}ctx.stroke();
  ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1;ctx.globalAlpha=0.5;ctx.stroke();ctx.globalAlpha=1;
  // balloon (rubbing animation moves it to the hair patch first)
  let bx=bxN,byy=by;if(d.rub>0){bx=150+Math.sin(t*14)*10;byy=200;ctx.fillStyle='#6b4a2f';ctx.beginPath();ctx.ellipse(110,200,40,30,0,0,6.29);ctx.fill();txt(ctx,'hair',110,245,{s:11*k,c:PAL['cv-soft'],a:'center'});}
  ctx.fillStyle=C.balloon;ctx.beginPath();ctx.ellipse(bx,byy,38,46,0,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(bx,byy+46);ctx.quadraticCurveTo(bx+10,byy+80,bx-5,byy+110);ctx.stroke();
  const n=Math.round(d.charge*8);for(let i=0;i<n;i++){const a=i/8*6.28;txt(ctx,'−',bx+Math.cos(a)*22,byy+Math.sin(a)*28+5,{s:16*k,w:800,c:'#fff',a:'center'});}
  txt(ctx,liq==='water'?'Water stream':'Oil stream',x0-60,140,{s:12*k,w:600,a:'right'});}

function sPH(sim,ctx,vdt,k,t){const d=sim.st.d8;
  if(d.mode==='buffer'){const b=bufPH(sim.st);[[150,'Plain water',b.plain,LIQ.water.col],[390,'Buffered (like blood)',b.buf,'#f3c6c6']].forEach(([x,l,ph,col])=>{beaker(ctx,x-70,230,140,170,col,120);
      txt(ctx,l,x,215,{s:13*k,w:700,a:'center'});rr(ctx,x-48,120,96,52,8);ctx.fillStyle='#2c3138';ctx.fill();txt(ctx,'pH '+ph.toFixed(2),x,153,{s:18*k,w:800,c:'#7cf08c',a:'center'});
      ctx.fillStyle=phColor(ph);ctx.fillRect(x-60,394,120,6);});
    if(d.dropT>0){[150,390].forEach(x=>{const y=180+(0.6-d.dropT)*60;ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(x,y,4,0,6.29);ctx.fill();});}
    txt(ctx,'Acid drops added: '+d.acid,270,75,{s:13*k,w:600,a:'center'});return;}
  const S=[[110,'Lemon juice',PH.lemon,'#f3e27a'],[270,'Water',PH.water,LIQ.water.col],[430,'Cleaning solution',PH.cleaner,'#bfe6da']];
  S.forEach(([x,l,ph,col])=>{beaker(ctx,x-55,230,110,140,col,95);txt(ctx,l,x,392,{s:12*k,w:600,a:'center'});
    const dip=d.dipped?clamp(d.dipT/0.6,0,1):0,sy=lerp(135,210,dip<1?Math.sin(dip*Math.PI):0);ctx.fillStyle=C.strip;ctx.fillRect(x-8,sy,16,70);ctx.strokeStyle=PAL['line'];ctx.strokeRect(x-8,sy,16,70);
    if(d.dipped&&dip>=0.5){ctx.fillStyle=phColor(ph);ctx.fillRect(x-8,sy+44,16,24);txt(ctx,'pH '+Math.round(ph),x,sy-8,{s:14*k,w:800,a:'center'});
      txt(ctx,ph<6.5?'acid':ph>7.5?'base':'neutral',x,sy-26,{s:11*k,c:PAL['cv-soft'],a:'center'});}});
  // color key
  const kx=40,ky=50,kw=460;for(let i=0;i<14;i++){ctx.fillStyle=phColor(i+0.5);ctx.fillRect(kx+i*kw/14,ky,kw/14,16);}for(let i=0;i<=14;i+=2)txt(ctx,String(i),kx+i*kw/14,ky+30,{s:10.5*k,c:PAL['cv-soft'],a:'center'});
  txt(ctx,'acid',kx,ky-6,{s:11*k,c:PAL['cv-soft']});txt(ctx,'neutral',kx+kw/2,ky-6,{s:11*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'base',kx+kw,ky-6,{s:11*k,c:PAL['cv-soft'],a:'right'});}

/* ---------- molecule zoom inset ---------- */
function drawInset(sim,ctx,vdt,k,t){const s=sim.st,stn=sim.p.station,X=548,Y=48,W=244,H=262,v=sim.vis,cx=X+W/2,cy=Y+H/2+8;
  ctx.save();rr(ctx,X,Y,W,H,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=2;ctx.stroke();ctx.clip();
  const title=(m,c)=>{txt(ctx,m,X+12,Y+22,{s:12.5*k,w:700});if(c)txt(ctx,c,X+12,Y+H-12,{s:11*k,c:PAL['cv-soft']});};
  const jig=RM?0:1;
  if(s.intro){const a=water(ctx,cx-34,cy-18,-Math.PI/2,2.4,{labels:true,k});const b=water(ctx,cx+58,cy+58,Math.PI*0.75,1.5);hbond(ctx,a.H[1],b.O);
    title('One water molecule','dashed line = hydrogen bond');ctx.restore();return;}
  switch(stn){
    case '0':{title('Two kinds of bonds','strength to break, kJ per mole');const bx=X+16,bw=W-32;
      txt(ctx,'Covalent O–H bond (inside)',bx,Y+56,{s:11.5*k,w:700});ctx.fillStyle=C.O;ctx.fillRect(bx,Y+64,bw,20);txt(ctx,'about 460',bx+bw-6,Y+78,{s:11.5*k,w:800,c:'#fff',a:'right'});
      txt(ctx,'Hydrogen bond (between)',bx,Y+112,{s:11.5*k,w:700});ctx.fillStyle=PAL['s2'];ctx.fillRect(bx,Y+120,Math.max(6,bw*23/460),20);txt(ctx,'about 23',bx+bw*23/460+8,Y+134,{s:11.5*k,w:800});
      wrapTxt(ctx,'A hydrogen bond is about 20 times weaker, so it breaks and re-forms all the time. Billions of them together hold water together and cause every property in these tabs.',bx,Y+168,bw,15*k,{s:11*k,c:PAL['cv-soft']});
      break;}
    case '9':{const d=s.d9,on=d.on&&(d.m.w>0||d.m.a>0);title('The fastest molecules escape',on?'each one carries heat away':'wet the cloths to start evaporation');
      const surf=Y+118;ctx.fillStyle=PAL['cv-water'];ctx.globalAlpha=0.35;ctx.fillRect(X+8,surf,W-16,H-surf+Y-24);ctx.globalAlpha=1;
      ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(X+8,surf);ctx.lineTo(X+W-8,surf);ctx.stroke();
      const pts=[];for(let r=0;r<3;r++)for(let c=0;c<5;c++){const x=X+30+c*44+(r%2)*18+Math.sin(t*1.3+c+r*2)*2*jig,y=surf+22+r*36+Math.cos(t*1.1+c)*2*jig;pts.push([x,y]);water(ctx,x,y,(c+r)%2?Math.PI/2:-Math.PI/2+0.4,0.8);}
      for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){if(Math.hypot(pts[i][0]-pts[j][0],pts[i][1]-pts[j][1])<52&&(i+j)%3)hbond(ctx,pts[i],pts[j],0.55);}
      v.esc=v.esc||[];if(on&&!RM){v.escAcc=(v.escAcc||0)+vdt*1.4;while(v.escAcc>=1){v.escAcc--;v.esc.push({x:X+40+Math.random()*(W-80),y:surf+6,vx:(Math.random()-.5)*30,a:Math.random()*6.28});}}
      v.esc.forEach(m=>{m.y-=vdt*70;m.x+=m.vx*vdt;m.a+=vdt*4;const g=ctx.createRadialGradient(m.x,m.y,2,m.x,m.y,20);g.addColorStop(0,'rgba(255,140,40,0.55)');g.addColorStop(1,'rgba(255,140,40,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(m.x,m.y,20,0,6.29);ctx.fill();water(ctx,m.x,m.y,m.a,0.8);
        if(m.y>surf-26){txt(ctx,'bond breaks!',m.x,m.y-20,{s:10.5*k,w:700,c:PAL['s1'],a:'center'});}});
      v.esc=v.esc.filter(m=>m.y>Y+34);if(on)txt(ctx,'left behind: slower = cooler',X+W/2,Y+H-30,{s:10.5*k,w:600,a:'center',c:PAL['cv-ink']});
      break;}
    case '1':{const ice=s.d1.ice.length>0||s.d1.lake>0.05;title(ice?'Ice: an open honeycomb':'Liquid water',ice?'ice 0.92 g/mL, liquid 1.00 g/mL':'molecules packed closer');
      if(ice){const pts=[];for(let r=0;r<3;r++)for(let c=0;c<4;c++){const x=X+30+c*50+(r%2)*25,y=Y+70+r*54;pts.push([x,y]);water(ctx,x,y,(r+c)%2?Math.PI/2:-Math.PI/2,0.9);}
        for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const dx=pts[i][0]-pts[j][0],dy=pts[i][1]-pts[j][1],dd=Math.hypot(dx,dy);if(dd<64)hbond(ctx,pts[i],pts[j],0.6);}}
      else{v.liq.forEach((q,i)=>{const x=X+24+((q.x+Math.sin(t*0.7+i)*0.02*jig)%1)*(W-48),y=Y+44+((q.y+Math.cos(t*0.6+i)*0.02*jig)%1)*(H-80);water(ctx,x,y,q.a+t*q.va*jig,0.85);});}
      break;}
    case '2':case '4':{const liq=stn==='2'?(s.d2.liq||sim.p.pennyLiquid):(s.d4.clip?s.d4.clip.liq:sim.p.clipLiquid);const soapy=liq==='soapy'||(stn==='4'&&s.d4.soap);
      title(stn==='2'?'Cohesion at the surface':'The surface "skin"',liq==='water'&&!soapy?'the surface is pulled inward':liq==='alcohol'?'alcohol: fewer H-bonds':'soap breaks the H-bonds');
      const surfY=Y+90;ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1;ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(X+10,surfY-16);ctx.lineTo(X+W-10,surfY-16);ctx.stroke();ctx.setLineDash([]);
      const pts=[];for(let r=0;r<3;r++)for(let c=0;c<5;c++){const x=X+30+c*42+(r%2)*18,y=surfY+r*48+Math.sin(t+c+r)*jig;pts.push([x,y,r]);
        if(liq==='alcohol')ethanol(ctx,x,y,(c+r)%2?0.4:-0.4,0.8);else if(soapy&&r===0&&c%2)oilMol(ctx,x-10,y-14,-1.3,0.7,4);else water(ctx,x,y,(c+r)%2?Math.PI/2:-Math.PI/2,0.85);}
      const nb=liq==='water'&&!soapy?1:liq==='alcohol'?0.35:0.55;
      for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const dd=Math.hypot(pts[i][0]-pts[j][0],pts[i][1]-pts[j][1]);if(dd<56&&((i*7+j*3)%10)/10<nb)hbond(ctx,pts[i],pts[j],0.7);}
      if(liq==='water'&&!soapy)for(let c=0;c<5;c++){const x=X+30+c*42;arrow(ctx,x,surfY+6,x,surfY+28,PAL['s1'],1.8);}
      break;}
    case '3':{title('Adhesion to the towel','water sticks to cellulose –OH');ctx.fillStyle='#d9c9a3';ctx.fillRect(X+16,Y+52,28,H-82);
      txt(ctx,'adhesion',X+52,Y+44,{s:10.5*k,w:700,c:PAL['s2']});txt(ctx,'cohesion',X+168,Y+44,{s:10.5*k,w:700,c:PAL['s2']});
      for(let y=Y+64;y<Y+H-36;y+=24){txt(ctx,'–OH',X+46,y+4,{s:10.5*k,w:700,c:C.O});}
      const h=s.d3.on?clamp(s.d3.h/11,0,1):0;let prev=null;for(let i=0;i<8;i++){const y=Y+H-44-i*24;if(i>2+h*5)break;const w=water(ctx,X+118,y,Math.PI,0.9);hbond(ctx,[X+76,y],w.H[0],0.8);
        const w2=water(ctx,X+186,y+6,Math.PI*0.9,0.85);hbond(ctx,w.O,w2.H[0],0.6);if(prev)hbond(ctx,prev,w.H[1],0.6);prev=w.O;}
      break;}
    case '5':{const d=s.d5,heat=d.on?clamp((d.T.w-20)/80,0,1):0;title('Heating water','heat first breaks H-bonds');
      v.liq.forEach((q,i)=>{const sp=(0.3+heat*2.5)*jig;const x=X+24+((q.x+Math.sin(t*sp+i)*0.05)%1)*(W-48),y=Y+44+((q.y+Math.cos(t*sp*1.1+i)*0.05)%1)*(H-80);q.px=x;q.py=y;water(ctx,x,y,q.a+t*q.va*sp,0.8);});
      const nb=Math.round(10*(1-heat*0.7));for(let i=0;i<nb;i++){const a=v.liq[i],b=v.liq[(i+3)%v.liq.length];if(Math.hypot(a.px-b.px,a.py-b.py)<70)hbond(ctx,[a.px,a.py],[b.px,b.py],0.7);}
      if(heat>0.2&&((t*4)%1)<0.3)txt(ctx,'bond breaks!',X+W-14,Y+44,{s:11*k,w:700,c:PAL['s1'],a:'right'});break;}
    case '6':{const d=s.d6;title('Water surrounds the ions','O (δ−) faces Na⁺, H (δ+) faces Cl⁻');
      const ion=(x,y,col,lab,face)=>{for(let i=0;i<6;i++){const a=i/6*6.28+t*0.2*jig;const wx=x+Math.cos(a)*36,wy=y+Math.sin(a)*36;water(ctx,wx,wy,face==='O'?a+Math.PI:a,0.7);}
        ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,13,0,6.29);ctx.fill();txt(ctx,lab,x,y+1,{s:11*k,w:800,c:'#fff',a:'center',b:'middle'});};
      ion(X+68,Y+88,C.na,'Na⁺','O');ion(X+172,Y+128,C.cl,'Cl⁻','H');{oilMol(ctx,X+40,Y+H-38,-0.05,0.9,9);txt(ctx,'oil: nonpolar, left alone',X+40,Y+H-54,{s:10.5*k,c:PAL['cv-soft']});}break;}
    case '7':{const d=s.d7,on=d.charge>0.05&&d.near;title('Polar molecules line up',sim.p.streamLiquid==='water'?'δ+ ends turn toward the − balloon':'oil has no + and − ends');
      ctx.fillStyle=C.balloon;ctx.beginPath();ctx.ellipse(X+W-26,Y+H/2+10,22,60,0,0,6.29);ctx.fill();for(let i=0;i<5;i++)txt(ctx,'−',X+W-26,Y+H/2-30+i*18,{s:15*k,w:800,c:'#fff',a:'center'});
      for(let r=0;r<4;r++)for(let c=0;c<3;c++){const x=X+40+c*54,y=Y+66+r*48;if(sim.p.streamLiquid==='water'){const a=on?0:(r*c+t*0.8*jig);water(ctx,x,y,a,0.85);}else oilMol(ctx,x-18,y,0.3*(r%2?1:-1),0.6,4);}
      break;}
    case '8':{const d=s.d8;title(d.mode==='buffer'?'A buffer soaks up H⁺':'pH counts H⁺ ions',d.mode==='buffer'?'HCO₃⁻ + H⁺ → H₂CO₃':'more H⁺ = lower pH');
      const n=d.mode==='buffer'?d.acid:(d.dipped?6:2);
      if(d.mode==='buffer'){const fr=Math.min(n,6);txt(ctx,'acid added',X+16,Y+50,{s:10.5*k,c:PAL['cv-soft']});
        for(let i=0;i<fr;i++){const bob=Math.sin(t*2+i)*2*jig,cap=i<4;txt(ctx,'H⁺',X+30+i*34,Y+76+bob,{s:12*k,w:800,c:cap?PAL['cv-soft']:PAL['s1'],a:'center'});}
        txt(ctx,'bicarbonate in blood',X+16,Y+112,{s:10.5*k,c:PAL['cv-soft']});
        for(let i=0;i<4;i++){const conv=i<n,x=X+64+(i%2)*110,y=Y+142+Math.floor(i/2)*36;txt(ctx,conv?'H₂CO₃':'HCO₃⁻',x,y,{s:12*k,w:800,c:conv?PAL['s5']:PAL['s2'],a:'center'});}
        txt(ctx,n?Math.min(n,4)+' H⁺ caught by the buffer':'add acid to see it work',X+16,Y+H-34,{s:10.5*k,w:600});break;}
      for(let i=0;i<14;i++){const q=v.ionsN[i],x=X+24+q.x*(W-48),y=Y+44+q.y*(H-80);
        if(d.mode==='buffer'){if(i<Math.min(n,7)){txt(ctx,'H⁺',x,y,{s:12*k,w:800,c:PAL['s1'],a:'center'});}else if(i<10){txt(ctx,i<10-Math.min(n,3)?'HCO₃⁻':'H₂CO₃',x,y,{s:11*k,w:700,c:PAL['s2'],a:'center'});}}
        else{if(i<n)txt(ctx,'H₃O⁺',x,y,{s:11.5*k,w:800,c:PAL['s1'],a:'center'});else if(i<n+2)txt(ctx,'OH⁻',x,y,{s:11.5*k,w:800,c:PAL['s2'],a:'center'});else water(ctx,x,y,q.ph+t*0.3*jig,0.7);}}
      break;}}
  ctx.restore();}

BioLab.register(WP);
})();
