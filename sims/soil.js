(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,RM,lvText}=BioLab.h;

/* Soil lab: settling jar → texture triangle, drainage columns, erosion plot, and (AP) fertility.
   Time is in hours. */
const SAMPLES={
  loam:{l:'Garden loam (your sample)',sand:40,silt:40,clay:20,om:4,ph:6.5,col:'#6b4a2e'},
  front:{l:'Front Range sandy loam',sand:65,silt:22,clay:13,om:2,ph:7.6,col:'#8a6a48'},
  sand:{l:'Sandy riverbank soil',sand:88,silt:7,clay:5,om:1,ph:6.0,col:'#b89a68'},
  siltloam:{l:'Floodplain silt loam',sand:20,silt:65,clay:15,om:3,ph:6.8,col:'#7a5f45'},
  clay:{l:'Clay subsoil',sand:20,silt:25,clay:55,om:1.5,ph:7.4,col:'#8c5a3c'},
  forest:{l:'Acidic forest soil',sand:45,silt:35,clay:20,om:6,ph:5.0,col:'#4f3a28',lvl:'ap'}
};
const T_SET={sand:0.02,silt:1.5,clay:18};     // settling time constants (h)
const COLS={sand:'#d8bf86',silt:'#a07a52',clay:'#7f6a5c'};

/* USDA texture classes from sand/silt/clay percentages */
function texture(S,Si,C){
  if(Si+1.5*C<15)return 'Sand';
  if(Si+2*C<30)return 'Loamy sand';
  if((C>=7&&C<20&&S>52)||(C<7&&Si<50))return 'Sandy loam';
  if(C>=7&&C<27&&Si>=28&&Si<50&&S<=52)return 'Loam';
  if((Si>=50&&C>=12&&C<27)||(Si>=50&&Si<80&&C<12))return 'Silt loam';
  if(Si>=80&&C<12)return 'Silt';
  if(C>=20&&C<35&&Si<28&&S>45)return 'Sandy clay loam';
  if(C>=27&&C<40&&S>20&&S<=45)return 'Clay loam';
  if(C>=27&&C<40&&S<=20)return 'Silty clay loam';
  if(C>=35&&S>45)return 'Sandy clay';
  if(C>=40&&Si>=40)return 'Silty clay';
  return 'Clay';}
const TEX_COL={'Sand':'#e2c47a','Loamy sand':'#d8b06a','Sandy loam':'#c99a58','Loam':'#9a7a50','Silt loam':'#8fa66a','Silt':'#7fb28a',
  'Sandy clay loam':'#c97a5a','Clay loam':'#b0705e','Silty clay loam':'#8a8a70','Sandy clay':'#c46a6a','Silty clay':'#7e7aa0','Clay':'#a05a7a'};
/* drainage: time constant (h) and water retained (mL of 100) from texture */
const drainTau=s=>0.03+8*Math.pow(s.clay/100,2)+0.5*Math.pow(s.silt/100,2);
const retained=(s,om)=>5+50*s.clay/100+30*s.silt/100+2*(om||s.om);
const SANDCOL={sand:90,silt:5,clay:5,om:0.5},CLAYCOL={sand:20,silt:20,clay:60,om:1};
const infilCap=s=>Math.max(2,55-60*s.clay/100-25*s.silt/100);   // mm/h
const erodK=(s,om)=>Math.max(0.03,0.05+0.5*s.silt/100-0.15*s.clay/100-0.01*om);
const LS=sl=>0.065+0.045*sl+0.0065*sl*sl;

function settled(sim,cls){const t=Math.max(0,sim.t-sim.st.shakeT);return 1-Math.exp(-t/T_SET[cls]);}
function measured(sim){const s=SAMPLES[sim.p.sample],h={};let tot=0;['sand','silt','clay'].forEach(c=>{h[c]=s[c]*settled(sim,c);tot+=h[c];});
  if(tot<0.5)return null;const m={};['sand','silt','clay'].forEach(c=>m[c]=100*h[c]/tot);return m;}
function drained(sim,col){const t=Math.max(0,sim.t-sim.st.pourT);if(!sim.st.poured)return 0;return (100-retained(col,col.om))*(1-Math.exp(-t/drainTau(col)));}
const sampleCol=sim=>{const s=SAMPLES[sim.p.sample];return {sand:s.sand,silt:s.silt,clay:s.clay,om:sim.st.om};};
function lossRate(sim){const p=sim.p,s=SAMPLES[p.sample];if(p.mode!=='erosion')return 0;const I=p.rain;
  const C=p.cover?0.02:1,P={none:1,contour:0.6,terrace:0.2}[p.practice]||1;
  return 0.03*Math.pow(I,1.5)*erodK(s,sim.st.om)*LS(p.slope)*C*P;}            // t/ha per hour
function runoff(sim){const p=sim.p,s=SAMPLES[p.sample];if(p.mode!=='erosion')return 0;const cap=infilCap(s)*(p.cover?1.5:1);return Math.max(0,p.rain-cap);}
const nutrAvail=ph=>100*Math.exp(-Math.pow((ph-6.5)/1.2,2));
const cec=(s,om)=>0.5*s.clay+2*om;

/* ---- texture triangle geometry: sand corner bottom-left, silt bottom-right, clay top ---- */
const TRI={x:470,y:390,w:300};TRI.h=TRI.w*Math.sqrt(3)/2;
function triPt(S,Si,C){const ax=TRI.x,ay=TRI.y,bx=TRI.x+TRI.w,by=TRI.y,cx=TRI.x+TRI.w/2,cy=TRI.y-TRI.h;return [(S*ax+Si*bx+C*cx)/100,(S*ay+Si*by+C*cy)/100];}
let triCache=null,triKey='';
function triImage(){const key=PAL['card']+PAL['cv-ink'];if(triCache&&triKey===key)return triCache;
  const c=document.createElement('canvas');c.width=800;c.height=450;const x=c.getContext('2d');
  for(let C=0;C<=100;C+=1)for(let Si=0;Si<=100-C;Si+=1){const S=100-C-Si;const [px,py]=triPt(S,Si,C);x.fillStyle=TEX_COL[texture(S,Si,C)];x.fillRect(px-2.2,py-2.2,4.4,4.4);}
  x.globalCompositeOperation='destination-in';x.beginPath();const a=triPt(100,0,0),b=triPt(0,100,0),t=triPt(0,0,100);x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.lineTo(t[0],t[1]);x.closePath();x.fill();
  triCache=c;triKey=key;return c;}
const TEX_LABEL={'Sand':[92,4,4],'Loamy sand':[82,12,6],'Sandy loam':[65,25,10],'Loam':[42,40,18],'Silt loam':[22,65,13],'Silt':[6,88,6],
  'Sandy clay loam':[60,12,28],'Clay loam':[33,34,33],'Silty clay loam':[10,56,34],'Sandy clay':[52,6,42],'Silty clay':[7,47,46],'Clay':[20,18,62]};

function jarParticles(){const r=rng(41),P=[];['sand','silt','clay'].forEach(cls=>{for(let i=0;i<70;i++)P.push({cls,u:r(),x:r(),y0:r(),j:r()*6.28,own:-Math.log(1-r()*0.98)});});return P;}

const SOIL={
  id:'soil',hash:'soil',apUnit:12,order:1,kind:'Virtual lab',tab:'Soil lab',
  card:'Shake a soil sample in a jar, read its texture on the triangle, then test drainage and erosion.',
  title:'Soil lab: texture, drainage and erosion',
  lede:{bio:'Soil is a mix of sand, silt and clay plus decaying organic matter. Shake a sample in a jar of water, let the layers settle, and use the texture triangle to name your soil.',
        honors:'Connect texture to what soil does: how fast water drains through it, how much it holds, and how easily rain washes it downhill.',
        ap:'Add soil chemistry. Clay and organic matter hold nutrients (cation exchange capacity), and pH controls which nutrients plants can use.'},
  scale:{bio:'Real lab scale: a 1-liter jar, 30 cm soil columns and a 2 m test plot. Sand grains are 0.05–2 mm, silt 0.002–0.05 mm, clay smaller than 0.002 mm.'},
  timeScale:1,dtMax:0.005,prewarm:0,sampleDt:0.05,window:48,unit:'h',timeLabel:'Time',chChange:0.05,chReveal:4,
  controls:[
    {id:'mode',label:'Test',type:'seg',def:'jar',lvl:'bio',noTrial:true,options:[{v:'jar',l:'Settling jar'},{v:'drain',l:'Drainage'},{v:'erosion',l:'Erosion',lvl:'honors'}]},
    {id:'sample',label:'Soil sample',type:'select',def:'loam',lvl:'bio',options:Object.entries(SAMPLES).map(([v,s])=>({v,l:s.l,lvl:s.lvl})),
     onChange(sim){const s=SAMPLES[sim.p.sample];sim.st.ph=s.ph;sim.st.om=s.om;sim.st.shakeT=sim.t;sim.st.pourT=sim.t;sim.st.lost=0;}},
    {id:'rain',label:'Rainfall intensity',type:'range',min:5,max:100,step:5,def:50,unit:' mm/h',lvl:'honors',help:'50 mm/h is a heavy Colorado thunderstorm.'},
    {id:'slope',label:'Slope',type:'range',min:0,max:30,step:1,def:10,unit:'%',lvl:'honors'},
    {id:'cover',label:'Plant cover',help:'Grass roots and leaves protect the soil',type:'toggle',def:false,lvl:'honors'},
    {id:'practice',label:'Conservation practice',type:'select',def:'none',lvl:'ap',options:[{v:'none',l:'None (plowed up and down the slope)'},{v:'contour',l:'Contour plowing'},{v:'terrace',l:'Terracing'}]}
  ],
  actions:[
    {id:'shake',label:'Shake the jar',primary:true,run(sim){sim.st.shakeT=sim.t;BioLab.setValues(sim,{mode:'jar'});}},
    {id:'pour',label:'Pour 100 mL of water',run(sim){sim.st.poured=true;sim.st.pourT=sim.t;BioLab.setValues(sim,{mode:'drain'});}},
    {id:'lime',label:'Add lime',lvl:'ap',run(sim){sim.st.ph=Math.min(8.5,sim.st.ph+0.5);}},
    {id:'compost',label:'Add compost',lvl:'ap',run(sim){sim.st.om=Math.min(12,sim.st.om+2);sim.st.ph=lerp(sim.st.ph,6.8,0.15);}}
  ],
  init(sim){const s=SAMPLES[sim.p.sample];return {shakeT:0,pourT:0,poured:false,ph:s.ph,om:s.om,lost:0,runTot:0};},
  step(sim,dt){const st=sim.st;st.lost+=lossRate(sim)*dt;st.runTot+=runoff(sim)*dt;},
  metrics:[
    {id:'sand',label:'Sand (measured)',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>{const m=measured(s);return m?m.sand:NaN;}},
    {id:'silt',label:'Silt (measured)',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>{const m=measured(s);return m?m.silt:NaN;}},
    {id:'clay',label:'Clay (measured)',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>{const m=measured(s);return m?m.clay:NaN;}},
    {id:'tex',label:'Texture class',unit:'',lvl:'bio',text:true,get:s=>{const m=measured(s);return m?texture(m.sand,m.silt,m.clay):'Shake the jar';}},
    {id:'dsample',label:'Drained: your sample',unit:'mL',lvl:'bio',min:0,max:100,d:0,get:s=>drained(s,sampleCol(s))},
    {id:'dsand',label:'Drained: sand column',unit:'mL',lvl:'bio',min:0,max:100,d:0,get:s=>drained(s,SANDCOL)},
    {id:'dclay',label:'Drained: clay column',unit:'mL',lvl:'bio',min:0,max:100,d:0,get:s=>drained(s,CLAYCOL)},
    {id:'runoff',label:'Runoff',unit:'mm/h',lvl:'honors',min:0,max:100,d:0,get:s=>runoff(s)},
    {id:'loss',label:'Soil loss rate',unit:'t/ha per h',lvl:'honors',min:0,max:20,d:2,get:s=>lossRate(s)},
    {id:'lost',label:'Soil lost so far',unit:'t/ha',lvl:'honors',min:0,max:null,d:1,get:s=>s.st.lost},
    {id:'ph',label:'Soil pH',unit:'',lvl:'ap',min:4,max:9,d:1,fixed:true,get:s=>s.st.ph},
    {id:'cec',label:'Nutrient-holding capacity (CEC)',unit:'cmol/kg',lvl:'ap',min:0,max:50,d:1,get:s=>cec(SAMPLES[s.p.sample],s.st.om)},
    {id:'nutr',label:'Nutrient availability',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>nutrAvail(s.st.ph)}
  ],
  graphs:[{id:'jar',label:'Settling jar: measured %',lines:['sand','silt','clay'],min:0,max:100},{id:'drain',label:'Water drained (mL)',lines:['dsample','dsand','dclay'],min:0,max:100},
    {id:'loss',label:'Soil lost (t/ha)',lvl:'honors',lines:['lost']},{id:'lossrate',label:'Soil loss rate',lvl:'honors',lines:['loss']},{id:'cec',label:'CEC',lvl:'ap',lines:['cec']},{id:'nutr',label:'Nutrient availability',lvl:'ap',lines:['nutr']}],
  defaultGraph:'drain',
  challenges:[
    {lvl:'bio',q:'You pour 100 mL of water into three columns: sand, your loam, and clay. Which one drains slowest?',
     choices:['Sand','Loam','Clay'],correct:2,baseline:{mode:'drain',sample:'loam'},changeAction:'pour',changeText:'Water poured into all three columns',watch:'drain',reveal:3,
     explain:{bio:'Clay particles are tiny and pack tightly, so the spaces between them are very small. Water squeezes through slowly, and clay also holds on to more of it. Sand has big gaps, so water rushes straight through.',
              honors:'Permeability depends on pore size, not total pore space. Clay actually has more total pore space than sand, but its pores are so small that water moves through them very slowly.'}},
    {lvl:'bio',q:'You shake your soil sample in a jar of water and set it down. Which layer settles to the bottom first?',
     choices:['Sand','Silt','Clay'],correct:0,baseline:{mode:'jar',sample:'loam'},baselineAction:'shake',watch:'jar',at:0.01,reveal:0.5,changeText:'Jar set down',
     explain:'The heaviest, largest particles fall fastest. Sand settles in under a minute, silt over a few hours, and clay can stay suspended for a day or more. That is why the jar ends up layered: sand on the bottom, then silt, then clay.'},
    {lvl:'bio',instant:true,q:'A soil is 40% sand, 40% silt and 20% clay. Using the texture triangle, what is it called?',
     choices:['Sandy loam','Loam','Clay loam','Silt loam'],correct:1,
     explain:'Find 20% clay on the left edge, 40% silt on the right edge and 40% sand along the bottom. The lines meet in the Loam region. Loam is the classic “good garden soil” because it balances drainage and water holding.'},
    {lvl:'honors',q:'Rain falls at 50 mm/h on bare soil on a 15% slope. What happens to the soil loss rate when you plant grass cover?',
     choices:['It barely changes','It drops sharply','It rises, because roots loosen the soil'],correct:1,baseline:{mode:'erosion',slope:15,cover:false},change:{cover:true},changeText:'Grass cover planted',watch:'lossrate',at:0.3,reveal:1.2,
     explain:{honors:'Leaves break the force of raindrops, roots hold soil in place, and covered soil soaks up more water so less runs off. Cover cuts erosion by roughly 50 times in this model.',
              ap:'In the Universal Soil Loss Equation the cover factor C drops from 1.0 for bare ground to about 0.02 for dense grass. That is why no-till farming and cover crops are such effective conservation practices.'}},
    {lvl:'honors',q:'The jar has been sitting for 1 hour. If you measure the layers now, the clay percentage you record will be…',
     choices:['About right','Too high','Too low'],correct:2,baseline:{mode:'jar',sample:'loam'},baselineAction:'shake',watch:'jar',at:0.01,reveal:1,changeText:'Waiting 1 hour',
     explain:'Most of the clay is still floating in the cloudy water after an hour, so the clay layer looks thin and the sand and silt look too big by comparison. For an accurate reading, wait a day or two until the water clears.'},
    {lvl:'honors',q:'You increase the slope from 5% to 25% on bare soil. What happens to erosion?',
     choices:['It roughly doubles','It increases many times over','It stays the same'],correct:1,baseline:{mode:'erosion',slope:5,cover:false},change:{slope:25},changeText:'Slope raised to 25%',watch:'lossrate',at:0.3,reveal:1.2,
     explain:'Runoff moves faster on steep slopes and carries more soil. The slope factor rises faster than the slope itself, so 25% loses far more than five times as much soil as 5%.'},
    {lvl:'ap',q:'You add compost to the acidic forest soil. What happens to its nutrient-holding capacity (CEC)?',
     choices:['It rises','It falls','No change'],correct:0,baseline:{sample:'forest',mode:'jar'},changeAction:'compost',changeText:'Compost added',watch:'cec',at:0.2,reveal:0.8,
     explain:'Humus (decayed organic matter) has many negatively charged sites that hold positive nutrient ions like Ca²⁺, K⁺ and Mg²⁺ so they don’t wash away. Each 1% of organic matter adds about 2 cmol/kg of CEC, roughly four times as much as 1% clay.'},
    {lvl:'ap',q:'The forest soil has pH 5.0. What happens to nutrient availability if you add lime?',
     choices:['It increases','It decreases','No change'],correct:0,baseline:{sample:'forest',mode:'jar'},changeAction:'lime',changeText:'Lime added',watch:'nutr',at:0.2,reveal:0.8,
     explain:'Most plant nutrients are easiest to absorb near pH 6–7. In acidic soil, aluminum becomes soluble and toxic while phosphorus gets locked up. Lime (calcium carbonate) neutralizes acid and raises pH toward that range. Acid rain does the opposite.'},
    {lvl:'ap',instant:true,q:'Estimate the CEC of a soil with 30% clay and 4% organic matter, using CEC ≈ 0.5 × %clay + 2 × %OM.',
     choices:['15 cmol/kg','23 cmol/kg','34 cmol/kg','8 cmol/kg'],correct:1,explain:'0.5 × 30 = 15 from clay, plus 2 × 4 = 8 from organic matter, gives 23 cmol/kg. Organic matter contributes a lot for its small share of the soil.'}
  ],
  initVis(sim){sim.vis.P=jarParticles();sim.vis.drops=[];sim.vis.mud=[];const r=rng(9);sim.vis.grass=[];for(let i=0;i<70;i++)sim.vis.grass.push([r(),r()]);sim.vis.stones=[];for(let i=0;i<26;i++)sim.vis.stones.push([r(),r(),r()]);},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,s=SAMPLES[p.sample],hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='jar')drawJar(sim,ctx,k,t,s);else if(p.mode==='drain')drawDrain(sim,ctx,k,t,s,vdt);else drawErosion(sim,ctx,k,t,s,vdt);
  },
  narrate(sim){const p=sim.p,s=SAMPLES[p.sample],st=sim.st,m=measured(sim),tj=sim.t-st.shakeT;
    if(p.mode==='jar'){if(!m||tj<0.005)return '<b>The jar was just shaken.</b> Every particle is mixed through the water. Watch which ones fall first.';
      if(tj<0.15)return '<b>Sand has already settled</b> into a layer on the bottom. Silt and clay are still swirling in the cloudy water.';
      if(tj<12)return '<b>Silt is settling on top of the sand.</b> The water is still cloudy because clay particles are so tiny they stay suspended for many hours.';
      return 'The layers read about <b>'+Math.round(m.sand)+'% sand, '+Math.round(m.silt)+'% silt and '+Math.round(m.clay)+'% clay</b>. On the triangle that is <b>'+texture(m.sand,m.silt,m.clay)+'</b>.';}
    if(p.mode==='drain'){if(!st.poured)return 'Three columns are packed with sand, your sample and clay. Press <b>Pour 100 mL of water</b> to start the drainage test.';const d=drained(sim,sampleCol(sim)),ds=drained(sim,SANDCOL),dc=drained(sim,CLAYCOL);
      return 'Sand has drained <b>'+Math.round(ds)+' mL</b>, your sample <b>'+Math.round(d)+' mL</b> and clay only <b>'+Math.round(dc)+' mL</b>. Tiny clay pores slow water down and hold more of it ('+Math.round(retained(CLAYCOL,1))+' mL stays in the clay).';}
    const L=lossRate(sim),R=runoff(sim);
    if(R<0.5)return 'All of the rain soaks in, so there is almost no runoff to carry soil away. Soil loss: <b>'+L.toFixed(2)+' t/ha per hour</b>.';
    return (p.cover?'<b>Grass cover</b> breaks the raindrops and holds the soil. ':'<b>Bare soil:</b> raindrops knock grains loose and runoff carries them downhill. ')+'Losing <b>'+L.toFixed(2)+' t/ha every hour</b> of this storm.';},
  tour:[
    {title:'Soil has layers',text:'Dig down and soil changes. The <b>O horizon</b> is fresh leaf litter, <b>A</b> is dark topsoil full of humus and life, <b>E</b> is a pale leached layer, <b>B</b> collects clay and minerals washed down from above, <b>C</b> is broken-up rock, and <b>R</b> is bedrock.',focus:[14,40,214,400],setup(sim){BioLab.setValues(sim,{mode:'jar'});}},
    {title:'Shake the jar',text:'A soil sample is shaken in water so every grain is separated. Watch the jar in slow motion.',focus:[236,40,214,400],speed:0.05,setup(sim){sim.st.shakeT=sim.t;}},
    {title:'Sand falls first',text:'The biggest, heaviest particles (sand) settle in under a minute. Silt settles over a few hours. Clay is so fine it can cloud the water for a day or more.',focus:[236,40,214,400],speed:2},
    {title:'Read the texture triangle',text:'Measure each layer as a percentage of the total. Then find the point on the triangle where the clay, silt and sand lines meet. The colored region names the soil texture.',focus:[440,110,350,300],speed:4},
    {title:'Drainage test',text:'Pour 100 mL into sand, your sample and clay. Water races through sand’s big pores but crawls through clay’s tiny ones, and clay holds more of the water.',focus:[0,40,800,400],speed:0.3,setup(sim){BioLab.setValues(sim,{mode:'drain'});sim.st.poured=true;sim.st.pourT=sim.t;}},
    {lvl:'honors',title:'Erosion',text:'On a slope, rain that can’t soak in becomes runoff and carries topsoil away. It takes hundreds of years to build 2.5 cm of topsoil, and one storm can strip it off bare ground.',focus:[0,40,800,400],speed:1,setup(sim){BioLab.setValues(sim,{mode:'erosion',cover:false});}},
    {lvl:'honors',title:'Plant cover protects soil',text:'Grass breaks the force of the raindrops and holds soil with its roots. Watch the runoff and muddy water drop.',focus:[0,40,800,400],speed:1,setup(sim){BioLab.setValues(sim,{cover:true});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'jar',cover:false});},
  lab:{bio:'<p><b>Question:</b> What kind of soil is your sample, and how well does it drain?</p><ol><li>Shake the jar and run the clock to at least 48 hours. Record the sand, silt and clay percentages.</li><li>Name the texture using the triangle.</li><li>Pour water into the columns and record the drained volume after 0.5 h and 3 h.</li></ol><p>Explain how the amount of clay affected drainage.</p>',
       honors:'<p><b>Question:</b> How do slope and plant cover affect erosion?</p><ol><li>In Erosion mode, record soil loss rate for slopes of 0, 5, 10, 20 and 30% on bare soil.</li><li>Repeat with plant cover on.</li><li>Plot slope (x) against soil loss rate (y) for both sets.</li></ol><p>Recommend how a farm on a hillside should protect its soil, using your data.</p>',
       ap:'<p><b>Question:</b> Which management practices best protect soil and keep it fertile?</p><ol><li>Compare soil loss for none, contour plowing and terracing at a 15% slope.</li><li>For the acidic forest soil, record pH, CEC and nutrient availability after adding lime, then compost.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain how organic matter improves both erosion resistance and fertility.</p>'},
  terms:[{t:'Soil horizons',d:'The layers in a soil profile: O, A, E, B, C and R (bedrock).'},{t:'Soil texture',d:'The percentages of sand, silt and clay in a soil.'},{t:'Loam',d:'A balanced mix of sand, silt and clay that drains well but still holds water.'},{t:'Permeability',d:'How easily water moves through soil.'},
    {lvl:'honors',t:'Erosion',d:'The movement of soil by water or wind.'},{lvl:'honors',t:'Runoff',d:'Water that flows over the surface instead of soaking in.'},{lvl:'honors',t:'Porosity',d:'The share of soil volume that is open space.'},
    {lvl:'ap',t:'Cation exchange capacity (CEC)',d:'How many positive nutrient ions a soil can hold. Clay and humus raise it.'},{lvl:'ap',t:'Humus',d:'Dark, decomposed organic matter in topsoil.'},{lvl:'ap',t:'Contour plowing and terracing',d:'Farming across a slope, or in steps, to slow runoff.'}],
  about:'<p><b>Settling jar:</b> each size class settles with its own time constant (sand 0.02 h, silt 1.5 h, clay 18 h). The “measured” percentages are the settled layer heights, so they are wrong until the clay has settled.</p><p><b>Texture names</b> use the USDA texture-class rules.</p><p><b>Drainage:</b> each column drains exponentially with a time constant that grows with clay and silt content. Water held = 5 + 0.5 × %clay + 0.3 × %silt + 2 × %OM mL.</p><p><b>Erosion</b> follows the Universal Soil Loss Equation, A = R × K × LS × C × P, scaled to tonnes per hectare per hour of rain. Runoff is rainfall above the soil’s infiltration capacity. Real erosion also depends on slope length, soil structure and storm history.</p><p><b>Fertility (AP):</b> CEC ≈ 0.5 × %clay + 2 × %organic matter. Nutrient availability is modeled as a bell curve peaking at pH 6.5.</p>'
};

function drawJar(sim,ctx,k,t,s){const st=sim.st,hon=atLeast('honors'),tj=Math.max(0,sim.t-st.shakeT);
  // soil profile
  const px=24,pw=190,top=60,hs=[['O',18,'#3b2a1c','Leaf litter'],['A',70,s.col,'Topsoil'],['E',hon?32:0,'#b8a07a','Leached'],['B',80,'#9a5f3a','Subsoil'],['C',70,'#8d8172','Weathered rock'],['R',60,'#5f5a55','Bedrock']];
  txt(ctx,'Soil profile',px+pw/2,top-18,{s:13*k,w:700,a:'center'});
  let y=top;hs.forEach(h=>{if(!h[1])return;ctx.fillStyle=h[2];ctx.fillRect(px,y,pw,h[1]);
    if(h[0]==='C'||h[0]==='R'){sim.vis.stones.forEach((q,i)=>{if((h[0]==='R')!==(i%3===0))return;ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(px+q[0]*pw,y+q[1]*h[1],6+q[2]*10,4+q[2]*6,q[2],0,6.29);ctx.fill();});}
    if(h[0]==='O'){ctx.strokeStyle='#6b8a3a';ctx.lineWidth=2;for(let i=0;i<14;i++){ctx.beginPath();ctx.moveTo(px+8+i*13,y);ctx.lineTo(px+12+i*13,y-10);ctx.stroke();}}
    pill(ctx,h[0],px+pw-14,y+h[1]/2,'rgba(0,0,0,.45)','#fff',11*k);
    txt(ctx,h[3],px+8,y+h[1]/2+4,{s:11*k,w:600,c:'#fff'});y+=h[1];});
  // jar
  const jx=262,jw=150,jt=70,jb=400,jh=jb-jt-20;
  txt(ctx,'Settling jar',jx+jw/2,jt-28,{s:13*k,w:700,a:'center'});
  txt(ctx,tj<1?(Math.round(tj*60)+' min after shaking'):(tj.toFixed(1)+' h after shaking'),jx+jw/2,jt-10,{s:11.5*k,a:'center',c:PAL['cv-soft']});
  const susp=s.clay*(1-settled(sim,'clay'))+s.silt*(1-settled(sim,'silt'))*0.6+s.sand*(1-settled(sim,'sand'))*0.3;
  ctx.fillStyle=PAL['cv-water'];ctx.fillRect(jx,jt+20,jw,jh);
  ctx.fillStyle='rgba(130,95,60,'+clamp(susp/80,0,0.75)+')';ctx.fillRect(jx,jt+20,jw,jh);
  const layerScale=jh*0.55/100;let base=jb;const layers={};
  ['sand','silt','clay'].forEach(c=>{const hgt=s[c]*settled(sim,c)*layerScale;layers[c]=[base-hgt,base];ctx.fillStyle=COLS[c];ctx.fillRect(jx,base-hgt,jw,hgt);
    if(hgt>12)txt(ctx,c[0].toUpperCase()+c.slice(1),jx+jw/2,base-hgt/2+4,{s:12*k,w:700,a:'center',c:c==='sand'?'#3a2a10':'#fff'});base-=hgt;});
  // falling particles tied to each class's settling
  for(const q of sim.vis.P){const T=T_SET[q.cls]*q.own;if(tj>T)continue;const f=tj/T;const L=layers[q.cls];const yy=lerp(jt+24+q.y0*(jh-30),L[0]+2,f);
    ctx.fillStyle=COLS[q.cls];ctx.beginPath();ctx.arc(jx+6+q.x*(jw-12)+(RM?0:Math.sin(t*2+q.j)*2),yy,q.cls==='sand'?2.6:q.cls==='silt'?1.7:1.1,0,6.29);ctx.fill();}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(jx-2,jt);ctx.lineTo(jx-2,jb+2);ctx.lineTo(jx+jw+2,jb+2);ctx.lineTo(jx+jw+2,jt);ctx.stroke();
  ctx.fillStyle=PAL['cv-lamp'];rr(ctx,jx-6,jt-4,jw+12,14,4);ctx.fill();
  // ruler
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;for(let i=0;i<=10;i++){const yy=jb-i*jh*0.055;ctx.beginPath();ctx.moveTo(jx+jw+6,yy);ctx.lineTo(jx+jw+(i%5?11:16),yy);ctx.stroke();}
  // texture triangle
  ctx.drawImage(triImage(),0,0);
  const A=triPt(100,0,0),B=triPt(0,100,0),C=triPt(0,0,100);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.lineTo(C[0],C[1]);ctx.closePath();ctx.stroke();
  txt(ctx,'Soil texture triangle',TRI.x+TRI.w/2,C[1]-34,{s:13*k,w:700,a:'center'});
  txt(ctx,'100% clay',C[0],C[1]-10,{s:11*k,a:'center',c:PAL['cv-soft']});txt(ctx,'100% sand',A[0]-4,A[1]+18,{s:11*k,a:'left',c:PAL['cv-soft']});txt(ctx,'100% silt',B[0]+4,B[1]+18,{s:11*k,a:'right',c:PAL['cv-soft']});
  Object.entries(TEX_LABEL).forEach(([n,v])=>{if(!atLeast('honors')&&!['Sand','Loam','Clay','Silt loam','Sandy loam','Silt'].includes(n))return;const q=triPt(v[0],v[1],v[2]);txt(ctx,n,q[0],q[1]+4,{s:9.5*k,w:600,a:'center',c:'#1b1b1b'});});
  const m=measured(sim);
  if(m){const q=triPt(m.sand,m.silt,m.clay);ctx.strokeStyle=PAL['rj'];ctx.lineWidth=1.2;ctx.setLineDash([4,3]);
    const a1=triPt(100-m.clay,0,m.clay),a2=triPt(0,100-m.clay,m.clay);ctx.beginPath();ctx.moveTo(a1[0],a1[1]);ctx.lineTo(a2[0],a2[1]);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=PAL['rj'];ctx.beginPath();ctx.arc(q[0],q[1],6.5,0,6.29);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
    pill(ctx,texture(m.sand,m.silt,m.clay),Math.min(760,Math.max(520,q[0])),q[1]-18,PAL['rj'],'#fff',11.5*k);}
}

function drawDrain(sim,ctx,k,t,s,vdt){const st=sim.st,cols=[['Sand',SANDCOL,'#d8bf86'],['Your sample',sampleCol(sim),s.col],['Clay',CLAYCOL,'#8c5a3c']];
  txt(ctx,'Drainage test: 100 mL poured into each column',400,28,{s:14*k,w:700,a:'center'});
  const tp=Math.max(0,sim.t-st.pourT);txt(ctx,tp<1?(Math.round(tp*60)+' min since pouring'):(tp.toFixed(1)+' h since pouring'),400,48,{s:12*k,a:'center',c:PAL['cv-soft']});
  cols.forEach((c,i)=>{const cx=150+i*250,fw=110;const d=drained(sim,c[1]),ret=retained(c[1],c[1].om),wait=Math.max(0,100-ret-d);
    // water ponded on top
    const pond=clamp(wait/(100-ret),0,1)*(tp<0.5?1:1)*40;
    ctx.fillStyle=PAL['cv-water'];ctx.fillRect(cx-fw/2,110-pond,fw,pond);
    ctx.fillStyle=c[2];ctx.fillRect(cx-fw/2,110,fw,150);
    const r=rng(5+i);ctx.fillStyle='rgba(0,0,0,.12)';for(let j=0;j<120;j++){const sz=c[0]==='Sand'?2.6:c[0]==='Clay'?1:1.6;ctx.fillRect(cx-fw/2+r()*fw,110+r()*150,sz,sz);}
    // wet front
    ctx.fillStyle='rgba(40,90,160,.18)';ctx.fillRect(cx-fw/2,110,fw,150*clamp(d/(100-ret)+0.15,0,1));
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.strokeRect(cx-fw/2,70,fw,190);
    ctx.fillStyle=PAL['cv-glass'];ctx.beginPath();ctx.moveTo(cx-fw/2,260);ctx.lineTo(cx+fw/2,260);ctx.lineTo(cx+8,290);ctx.lineTo(cx-8,290);ctx.closePath();ctx.fill();
    // drips
    const rate=(100-ret)/drainTau(c[1])*Math.exp(-tp/drainTau(c[1]));if(st.poured&&rate>0.5){const n=clamp(Math.round(rate/30),1,5);ctx.fillStyle=PAL['cv-sub'];for(let j=0;j<n;j++){const yy=294+((t*90+j*25)%40);ctx.beginPath();ctx.arc(cx,yy,2.6,0,6.29);ctx.fill();}}
    // cylinder
    const cy0=340,ch=90,cw=60;ctx.fillStyle=PAL['cv-water'];ctx.fillRect(cx-cw/2,cy0+ch-ch*d/100,cw,ch*d/100);
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.strokeRect(cx-cw/2,cy0,cw,ch);
    for(let m=0;m<=100;m+=25){const yy=cy0+ch-ch*m/100;ctx.beginPath();ctx.moveTo(cx-cw/2,yy);ctx.lineTo(cx-cw/2+10,yy);ctx.stroke();}
    txt(ctx,c[0],cx,66,{s:13*k,w:700,a:'center'});txt(ctx,Math.round(d)+' mL',cx+cw/2+8,cy0+ch-ch*d/100+4,{s:12.5*k,w:700});
    txt(ctx,'holds '+Math.round(ret)+' mL',cx,cy0-8,{s:11*k,a:'center',c:PAL['cv-soft']});});
}

function drawErosion(sim,ctx,k,t,s,vdt){const p=sim.p,st=sim.st,v=sim.vis;
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,800,450);
  const ang=Math.atan(p.slope/100*1.6),x0=70,x1=600,y0=180,y1=y0+(x1-x0)*Math.tan(ang);
  // rain
  const nDrops=Math.round(p.rain*1.6);while(v.drops.length<nDrops)v.drops.push({x:Math.random()*800,y:Math.random()*450});if(v.drops.length>nDrops)v.drops.length=nDrops;
  ctx.strokeStyle=PAL['cv-sub'];ctx.globalAlpha=.55;ctx.lineWidth=1.4;ctx.beginPath();
  for(const d of v.drops){d.y+=520*vdt;d.x-=40*vdt;if(d.y>460){d.y=-10;d.x=Math.random()*820;}ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-2,d.y+9);}ctx.stroke();ctx.globalAlpha=1;
  // hill
  const loss=clamp(st.lost/40,0,1)*14;
  ctx.fillStyle=s.col;ctx.beginPath();ctx.moveTo(0,y0);ctx.lineTo(x0,y0);ctx.lineTo(x1,y1+loss);ctx.lineTo(x1,450);ctx.lineTo(0,450);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.moveTo(0,y0+26);ctx.lineTo(x0,y0+26);ctx.lineTo(x1,y1+26+loss);ctx.lineTo(x1,450);ctx.lineTo(0,450);ctx.closePath();ctx.fill();
  // rills when eroded
  if(st.lost>2&&!p.cover){ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=2;for(let i=0;i<5;i++){const f=0.2+i*0.15;ctx.beginPath();ctx.moveTo(lerp(x0,x1,f),lerp(y0,y1,f)+loss*f);ctx.lineTo(lerp(x0,x1,f+0.12),lerp(y0,y1,f+0.12)+loss*(f+.12)+4);ctx.stroke();}}
  if(p.cover){ctx.strokeStyle=PAL['cv-leaf'];ctx.lineWidth=2;v.grass.forEach(g=>{const x=lerp(x0-60,x1,g[0]),y=x<x0?y0:lerp(y0,y1,(x-x0)/(x1-x0));ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3+g[1]*6,y-10-g[1]*6);ctx.moveTo(x+3,y);ctx.lineTo(x+5,y-8);ctx.stroke();});}
  // runoff sheet + mud particles
  const R=runoff(sim),L=lossRate(sim);if(R>0.3){ctx.strokeStyle='rgba(120,90,60,'+clamp(0.25+L/8,0.25,0.8)+')';ctx.lineWidth=2+R/12;ctx.beginPath();ctx.moveTo(x0+30,y0+(y1-y0)*30/(x1-x0)-1);ctx.lineTo(x1,y1+loss-1);ctx.stroke();}
  const nMud=Math.round(clamp(L*6,0,60));while(v.mud.length<nMud)v.mud.push({f:Math.random()});if(v.mud.length>nMud)v.mud.length=nMud;
  ctx.fillStyle='#7a5a3a';for(const m of v.mud){m.f+=vdt*(0.2+R/150);if(m.f>1)m.f=Math.random()*0.2;const x=lerp(x0,x1,m.f),y=lerp(y0,y1,m.f)+loss*m.f-3;ctx.beginPath();ctx.arc(x,y,2.2,0,6.29);ctx.fill();}
  // collection tray
  const tx=x1+10,ty=y1+loss+10;ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.strokeRect(tx,ty,140,60);
  const mud=clamp(st.lost/60,0,1)*55;ctx.fillStyle='rgba(122,90,58,.85)';ctx.fillRect(tx+2,ty+58-mud,136,mud);
  ctx.fillStyle='rgba(122,90,58,'+clamp(R/60,0,0.5)+')';ctx.fillRect(tx+2,ty+2,136,56-mud);
  txt(ctx,'Runoff collector',tx+70,ty+80,{s:12*k,w:600,a:'center'});
  txt(ctx,'Slope '+p.slope+'%  ·  rain '+p.rain+' mm/h  ·  '+(p.cover?'grass cover':'bare soil')+(atLeast('ap')&&p.practice!=='none'?'  ·  '+(p.practice==='contour'?'contour plowed':'terraced'):''),16,28,{s:13.5*k,w:700});
  txt(ctx,'Soil lost so far: '+st.lost.toFixed(1)+' t/ha',16,48,{s:12.5*k,c:PAL['cv-soft']});
  if(atLeast('ap')&&p.practice==='terrace'){ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=2;for(let i=1;i<5;i++){const f=i/5;ctx.beginPath();ctx.moveTo(lerp(x0,x1,f),lerp(y0,y1,f)+loss*f);ctx.lineTo(lerp(x0,x1,f)+30,lerp(y0,y1,f)+loss*f);ctx.stroke();}}
}

BioLab.register(SOIL);
})();
