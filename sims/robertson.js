/* Teacher-made APES tools by Dr. Sandy Robertson, Regis Jesuit science teacher (added Nov 17, 2026, with her permission:
   "You can do whatever you want with them!"). Her files live unchanged in teacher/; each def shows one in a frame with her credit. */
(function(){
'use strict';
const {txt,PAL}=BioLab.h;
const CREDIT={name:'Dr. Sandy Robertson',role:'Regis Jesuit science teacher',note:'Shared with her permission for every APES class.',short:'Dr. Sandy Robertson'};
function pic(kind){return function(sim,ctx){const W=800,H=450;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,W,H);
  if(kind==='plates'){ctx.fillStyle='#8a5a3c';ctx.fillRect(0,250,W,200);ctx.fillStyle='#3f6fb0';ctx.fillRect(0,200,360,50);ctx.fillStyle='#6b7d4f';ctx.beginPath();ctx.moveTo(360,250);ctx.lineTo(800,250);ctx.lineTo(800,170);ctx.lineTo(560,120);ctx.lineTo(470,180);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#5a3a26';ctx.lineWidth=26;ctx.beginPath();ctx.moveTo(120,262);ctx.lineTo(360,262);ctx.lineTo(560,420);ctx.stroke();ctx.fillStyle='#e8662c';ctx.beginPath();ctx.arc(560,140,22,0,7);ctx.fill();}
  else if(kind==='enso'){ctx.fillStyle='#3f6fb0';ctx.fillRect(0,200,W,250);ctx.fillStyle='#d9534f';ctx.beginPath();ctx.moveTo(0,200);ctx.lineTo(500,200);ctx.lineTo(0,330);ctx.closePath();ctx.fill();
    ctx.fillStyle='#9fc6e8';ctx.beginPath();ctx.moveTo(800,200);ctx.lineTo(560,200);ctx.lineTo(800,260);ctx.closePath();ctx.fill();ctx.fillStyle='#bbb';[[120,120],[180,100],[240,125]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,40,0,7);ctx.fill();});
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(700,170);ctx.lineTo(420,170);ctx.stroke();ctx.beginPath();ctx.moveTo(440,155);ctx.lineTo(420,170);ctx.lineTo(440,185);ctx.stroke();}
  else if(kind==='soil'){[['#3b2a1e',150,70],['#6b4a2e',220,90],['#a07850',310,70],['#8c8c84',380,70]].forEach(([c,y,h])=>{ctx.fillStyle=c;ctx.fillRect(0,y,W,h);});ctx.fillStyle='#4f8a3c';ctx.fillRect(0,130,W,22);}
  else{ctx.fillStyle='#4f8a3c';ctx.fillRect(0,330,330,120);ctx.fillStyle='#d8b678';ctx.fillRect(470,330,330,120);ctx.fillStyle='#7a6a5a';ctx.beginPath();ctx.moveTo(330,450);ctx.lineTo(400,150);ctx.lineTo(470,450);ctx.closePath();ctx.fill();
    ctx.fillStyle='#bbb';[[180,150],[250,130],[310,170]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,40,0,7);ctx.fill();});ctx.fillStyle='#3f6fb0';for(let i=0;i<12;i++)ctx.fillRect(150+i*14,200+(i%3)*30,3,16);}
  txt(ctx,'By Dr. Sandy Robertson',20,30,{s:22,w:700,c:PAL['cv-ink']});};}
function def(o){const k=o.pic;delete o.pic;return Object.assign({apUnit:12,kind:'Teacher-made',timeless:true,graph:false,trials:false,controls:[],credit:CREDIT,aspect:16/9,
  init:()=>({}),step(){},draw:pic(k),narrate:()=>'',thumbFrames:1},o);}
[
 def({id:'plateexplorer',hash:'plateexplorer',order:0.5,pic:'plates',tab:'Plate Boundary Explorer',
  card:'Pick a boundary, watch the plates move, click the dots, then compare all five and find real examples on a world map.',
  title:'Plate Boundary Explorer',lede:'Five kinds of plate boundaries, animated as a slice through the Earth. Click each pulsing dot to see what happens there and where on Earth it happens, then trigger the earthquake and tsunami.',
  external:{src:'teacher/plate-boundary-explorer.html',height:1150,time:'about 20 minutes'}}),
 def({id:'soillab',hash:'soillab',order:1.5,pic:'soil',tab:'Soil Investigation Lab',
  card:'Read a soil profile, mix soils on the texture triangle, run a drainage test, read a soil test, then copy your summary for Canvas.',
  title:'Soil Investigation Lab',lede:'Seven short steps: soil horizons, the texture triangle, a drainage lab, comparing mixtures, pH and the big three nutrients, free response, and a summary to turn in.',
  external:{src:'teacher/soil-investigation-lab.html',height:1150,time:'about 45 to 60 minutes',intro:'<p class="help">At the end, press <b>Build summary</b>, then <b>Copy for Canvas</b>, and paste it into your assignment.</p>'}}),
 def({id:'windsatacama',hash:'windsatacama',order:2.5,pic:'winds',tab:'Why the Amazon is wet and the Atacama is dry',
  card:'Label the global wind belts, follow a parcel of air over the Andes, then explain why South America has a rainforest and a desert.',
  title:'Why the Amazon is wet and the Atacama is dry',lede:'Global circulation and the rain shadow, worked out on one continent: label the cells and pressure zones, follow air over a mountain, match each place to its cause, and write it up.',
  external:{src:'teacher/amazon-vs-atacama.html',height:1150,time:'about 30 minutes'}}),
 def({id:'ensoexplorer',hash:'ensoexplorer',order:3.5,pic:'enso',tab:'ENSO Explorer',
  card:'Learn the normal Pacific year, tip the see-saw to El Niño or La Niña, see who gains and who loses, and try the forecaster’s gauge.',
  title:'ENSO Explorer',lede:'Start with a normal year, then drag the slider toward El Niño or La Niña and watch the winds, warm water and rain shift. Then sort myths from facts, see how scientists forecast ENSO, and how people prepare.',
  external:{src:'teacher/enso-explorer.html',height:1150,time:'about 40 minutes'}})
].forEach(d=>BioLab.register(d));
})();
