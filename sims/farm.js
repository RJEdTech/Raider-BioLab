(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,axes,bars,fmtNum}=BioLab.h;

/* Irrigated corn on the High Plains: irrigation method, water, nitrogen and pest control, season after season.
   One acre of corn in eastern Colorado. Growing-season rain 8 in; the crop needs about 24 in of water (CSU puts irrigated
   corn at roughly 22–26 in of crop water use).
   Water reaching the roots = rain + applied × efficiency. Efficiencies follow the values taught in AP Environmental Science:
     flood ≈ 80%, furrow ≈ 65%, spray (center pivot) ≈ 85%, drip ≈ 95%.
   Water factor  fW = clamp((W − 4)/(24 − 4), 0, 1).  Waterlogging (flood and furrow only): −3% per inch of surplus past 2 in.
   Nitrogen factor fN = 0.45 + 0.55·(1 − e^(−N/70)), N = fertilizer lb/acre (soil supplies the rest of the 45% base).
   Salinity: corn loses about 12% of yield per dS/m above 1.7 dS/m (Maas–Hoffman, FAO 29). Irrigation water adds
   0.006 dS/m per inch each season; surplus water leaches 0.05 dS/m per inch back out.
   Pests: unprotected losses 25%. Broad pesticide spraying 4% + 30%·resistance, resistance r ← r + 0.25(1 − r) each season,
   and the dose climbs with resistance (the pesticide treadmill). IPM 6% + 10%·r, r grows 0.03(1 − r). Bt corn 3% + 25%·rBt,
   rBt grows 0.08(1 − rBt).
   Yield = 240 bu/acre × fW × fN × (1 − pest loss) × waterlog × salt.
   Nitrate lost = surplus N × (0.35 + 0.5·min(1, surplus water/6)), surplus N = 50 + N − 0.9·yield − 20.
   Aquifer: water table falls 0.12 ft per inch pumped, minus 0.5 ft of recharge, per season. */
const RAIN=8,NEED=24,YMAX=240,ACIN=27154;
const EFF={none:0,flood:0.80,furrow:0.65,spray:0.85,drip:0.95};
const EN={none:'No irrigation (rain only)',flood:'Flood',furrow:'Furrow',spray:'Center-pivot spray',drip:'Drip'};
const DEF={irr:'furrow',water:20,N:150,pest:'spray'};

function calc(p,st){const eff=EFF[p.irr],app=p.irr==='none'?0:p.water,del=app*eff,lost=app-del,W=RAIN+del,ex=Math.max(0,W-NEED);
  const fW=clamp((W-4)/(NEED-4),0,1),wl=(p.irr==='flood'||p.irr==='furrow')&&ex>2?Math.max(0.5,1-0.03*(ex-2)):1;
  const fN=0.45+0.55*(1-Math.exp(-p.N/70)),fS=clamp(1-0.12*Math.max(0,st.salt-1.7),0.3,1);
  const rS=st.rS,rB=st.rB,loss={none:0.25,spray:0.04+0.30*rS,ipm:0.06+0.10*rS,bt:0.03+0.25*rB}[p.pest];
  const y=YMAX*fW*fN*(1-loss)*wl*fS;
  const surN=Math.max(0,50+p.N-0.9*y-20),no3=surN*(0.35+0.5*Math.min(1,ex/6));
  const pestLb={none:0,spray:2*(1+rS),ipm:0.5,bt:0}[p.pest],good={none:100,spray:30,ipm:80,bt:90}[p.pest];
  const drop=app*0.12-0.5;
  return {eff,app,del,lost,W,ex,fW,wl,fN,fS,loss,y,no3,pestLb,good,drop,gpb:y>0?app*ACIN/y:NaN};}
function grow(sim,n){const st=sim.st,p=sim.p;for(let i=0;i<n;i++){const c=calc(p,st);st.year++;
    st.depth+=c.drop;st.salt=Math.max(1,st.salt+0.006*c.app-0.05*c.ex);
    if(p.pest==='spray')st.rS+=0.25*(1-st.rS);else if(p.pest==='ipm')st.rS+=0.03*(1-st.rS);
    if(p.pest==='bt')st.rB+=0.08*(1-st.rB);
    st.hist.push({yr:st.year,y:c.y,depth:st.depth,salt:st.salt,no3:c.no3,loss:c.loss,app:c.app});}
  sim.infoDirty=true;sim.vis.grow=1;}

const FARM={
  id:'farm',hash:'farm',apUnit:13,order:1.5,kind:'Simulation',tab:'Irrigation, fertilizer and pests',
  card:'Grow corn on the High Plains. Choose how to water, fertilize and fight pests, then watch the harvest, the runoff and the aquifer.',
  title:'Growing corn: irrigation, fertilizer and pest control',
  lede:{bio:'One acre of corn in eastern Colorado, where summer rain is only about 8 inches. Pick how to water it, how much fertilizer to use and how to fight pests, then grow season after season.',
        honors:'Compare irrigation efficiencies, see where extra nitrogen goes, and watch pests evolve resistance to a pesticide sprayed every year. Bt corn and integrated pest management are on the menu.',
        ap:'Trade yield against water efficiency, nitrate leaching, pesticide resistance, aquifer depletion and soil salinization, using the efficiencies and salt-tolerance data from the AP course.'},
  scale:'One acre of corn (about 0.4 hectare, roughly a football field without the end zones). One acre-inch of water is 27,154 gallons.',
  timeless:true,animated:true,
  controls:[
    {id:'irr',label:'Irrigation method',type:'seg',def:DEF.irr,lvl:'bio',options:[{v:'none',l:'None'},{v:'flood',l:'Flood'},{v:'furrow',l:'Furrow'},{v:'spray',l:'Spray'},{v:'drip',l:'Drip'}],
     help:'Flood covers the field; furrow fills ditches between rows; spray rains it on from a center pivot; drip drips at each plant.'},
    {id:'water',label:'Water pumped onto the field',type:'range',min:0,max:30,step:1,def:DEF.water,unit:' in/season',lvl:'bio',help:'On top of about 8 in of summer rain. Corn needs about 24 in in all.'},
    {id:'N',label:'Nitrogen fertilizer',type:'range',min:0,max:250,step:10,def:DEF.N,unit:' lb/acre',lvl:'bio'},
    {id:'pest',label:'Pest control',type:'seg',def:DEF.pest,lvl:'bio',options:[{v:'none',l:'None'},{v:'spray',l:'Spray pesticide'},{v:'ipm',l:'IPM'},{v:'bt',l:'Bt corn',lvl:'honors'}],
     help:'IPM (integrated pest management) scouts for pests, rotates crops, uses natural predators, and sprays only when needed.'}
  ],
  actions:[{id:'grow',label:'Grow one season',primary:true,run(sim){grow(sim,1);}},
    {id:'grow10',label:'Grow 10 seasons',run(sim){grow(sim,10);}},
    {id:'restart',label:'Start a new farm',run(sim){BioLab.reset(sim);}}],
  init(){return {year:0,depth:100,salt:1.0,rS:0,rB:0,hist:[]};},
  step(){},
  metrics:[
    {id:'y',label:'Corn this season',unit:'bu/acre',lvl:'bio',min:0,max:240,d:0,get:s=>calc(s.p,s.st).y},
    {id:'reach',label:'Water that reaches the roots',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>s.p.irr==='none'?NaN:EFF[s.p.irr]*100},
    {id:'lost',label:'Water lost to evaporation and runoff',unit:'in',lvl:'bio',min:0,max:12,d:1,get:s=>calc(s.p,s.st).lost},
    {id:'loss',label:'Crop eaten by pests',unit:'%',lvl:'bio',min:0,max:40,d:0,get:s=>calc(s.p,s.st).loss*100},
    {id:'good',label:'Helpful insects left',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>calc(s.p,s.st).good},
    {id:'no3',label:'Nitrate washed out of the field',unit:'lb/acre',lvl:'bio',min:0,max:120,d:0,get:s=>calc(s.p,s.st).no3},
    {id:'depth',label:'Water table depth',unit:'ft',lvl:'bio',min:90,max:150,d:1,get:s=>s.st.depth},
    {id:'year',label:'Seasons grown',unit:'',lvl:'bio',min:0,max:40,d:0,get:s=>s.st.year},
    {id:'pestlb',label:'Pesticide sprayed',unit:'lb/acre',lvl:'honors',min:0,max:4,d:1,get:s=>calc(s.p,s.st).pestLb},
    {id:'gpb',label:'Pumped water per bushel',unit:'gal',lvl:'honors',min:0,max:6000,d:0,get:s=>calc(s.p,s.st).gpb},
    {id:'salt',label:'Soil salinity',unit:'dS/m',lvl:'ap',min:1,max:6,d:2,get:s=>s.st.salt},
    {id:'res',label:'Pests resistant to the spray',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>s.st.rS*100}
  ],
  graphs:[{id:'gy',label:'Corn harvest by season',custom:true},{id:'gw',label:'Water table depth by season',custom:true},{id:'gn',label:'Nitrate washed out by season',lvl:'honors',custom:true},{id:'gs',label:'Soil salinity by season',lvl:'ap',custom:true}],
  defaultGraph:'gy',
  plot(sim,ctx,box,id){const H=sim.st.hist;
    if(!H.length){txt(ctx,'Press “Grow one season” to start the record.',box.L+box.W/2,box.T+box.H/2,{s:15,c:PAL.muted,a:'center'});return;}
    const n=Math.max(10,H.length),key={gy:'y',gw:'depth',gn:'no3',gs:'salt'}[id],vals=H.map(h=>h[key]);
    const lo=id==='gw'?100:0,hi=id==='gy'?240:id==='gw'?Math.max(120,...vals)+5:id==='gn'?Math.max(40,...vals)*1.15:Math.max(3,...vals)*1.1;
    const yl={gy:'Corn (bu/acre)',gw:'Depth to water (ft)',gn:'Nitrate lost (lb/acre)',gs:'Salinity (dS/m)'}[id];
    const ax=axes(ctx,box,{xmin:0,xmax:n,ymin:lo,ymax:hi,xl:'Season',yl});
    const bw=Math.max(2,(ax.X(1)-ax.X(0))*0.7);ctx.fillStyle=id==='gy'?'#c9a227':id==='gw'?'#2f6fd0':id==='gn'?'#3f8f3a':'#8a7a5c';
    H.forEach((h,i)=>{const x=ax.X(i+0.5),v=h[key];ctx.fillRect(x-bw/2,ax.Y(v),bw,ax.Y(lo)-ax.Y(v));});
    if(id==='gs'){ctx.strokeStyle='#c8102e';ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(box.L,ax.Y(1.7));ctx.lineTo(box.L+box.W,ax.Y(1.7));ctx.stroke();ctx.setLineDash([]);txt(ctx,'corn starts losing yield (1.7)',box.L+box.W-6,ax.Y(1.7)-6,{s:12,c:'#c8102e',a:'right'});}},
  narrate(sim){const p=sim.p,st=sim.st,c=calc(p,st);
    let s='This season’s corn: <b>'+Math.round(c.y)+' bushels an acre</b>. ';
    if(p.irr==='none')s+='With rain alone the crop gets only 8 of the 24 inches it needs, so it struggles. ';
    else s+=EN[p.irr]+' gets about '+Math.round(c.eff*100)+'% of the water to the roots; '+c.lost.toFixed(1)+' of the '+c.app+' inches pumped is lost. ';
    if(c.no3>20)s+='About <b>'+Math.round(c.no3)+' lb of nitrate</b> washes out, more than the crop can use; it heads for groundwater and streams. ';
    if(p.pest==='spray'&&st.rS>0.4)s+='Pests are becoming resistant, so spraying works less well every year. ';
    if(st.year)s+='After '+st.year+' season'+(st.year>1?'s':'')+' the water table is '+st.depth.toFixed(1)+' ft down (it started at 100 ft).';
    else s+='Press <b>Grow one season</b> to harvest and see the effects build up year after year.';
    return s;},
  tour:[
    {title:'One acre of corn',text:{bio:'Corn on the High Plains of eastern Colorado. Summer rain gives only about 8 of the 24 inches of water the corn needs, so the farmer pumps the rest from a well.',honors:'Rain supplies about 8 in; corn uses about 24 in over the season. The difference is pumped from the aquifer below, shown at the bottom.'},focus:[0,0,600,450],pause:true,setup(sim){BioLab.setValues(sim,DEF);BioLab.reset(sim);}},
    {title:'Furrow irrigation wastes water',text:'Water runs down ditches between the rows. Much of it evaporates or runs off the end of the field before the roots can use it: only about 65% reaches the crop.',focus:[0,150,600,110]},
    {title:'Drip gets nearly all of it to the roots',text:'Now the same 20 inches goes through drip lines, right at each plant. Almost no drops float away as vapor, about 95% reaches the roots, and the corn grows taller. The report shows what it was a moment ago.',focus:[0,150,600,110],setup(sim){BioLab.setValues(sim,{irr:'drip'});}},
    {title:'Fertilizer: more is not always better',text:{bio:'Nitrogen fertilizer (white pellets) feeds the corn. Past what the crop can use, the extra washes down as nitrate toward the groundwater (green arrows).',honors:'Yield rises with nitrogen but levels off. Nitrogen the crop can’t take up leaches as nitrate, especially when extra water pushes it down, which pollutes wells and feeds algae blooms downstream.'},focus:[0,200,600,150],setup(sim){BioLab.setValues(sim,{irr:'flood',water:30,N:250});}},
    {title:'The pesticide treadmill',text:'Spraying the same pesticide every year kills most pests at first. The few that survive breed, and within a few seasons most pests are resistant. Losses climb, so farmers spray more.',focus:[0,40,600,200],setup(sim){BioLab.setValues(sim,DEF);BioLab.reset(sim);grow(sim,6);}},
    {title:'Integrated pest management',text:'IPM scouts the field, rotates crops, protects predators like ladybugs and sprays only when needed. Losses stay low and pests evolve resistance much more slowly.',focus:[0,40,600,200],setup(sim){BioLab.reset(sim);BioLab.setValues(sim,{pest:'ipm'});grow(sim,6);}},
    {title:'Mining the aquifer',text:'Every inch pumped lowers the water table a little, and rain soaks back in far more slowly. After 10 seasons of furrow irrigation the well reaches about 19 ft deeper. Parts of the Ogallala Aquifer have dropped more than 100 ft since the 1950s.',focus:[0,300,600,150],setup(sim){BioLab.setValues(sim,DEF);BioLab.reset(sim);grow(sim,10);}},
    {lvl:'ap',title:'Salt builds up',text:'Irrigation water carries dissolved salts. In a dry climate the water evaporates and the salt stays. Corn starts losing about 12% of its yield for each dS/m above 1.7, so salinized fields slowly lose productivity.',focus:[0,180,600,60]}
  ],
  onTourExit(sim){BioLab.setValues(sim,DEF);BioLab.reset(sim);},
  challenges(sim){const st0={year:0,depth:100,salt:1,rS:0,rB:0,hist:[]},C=p=>calc(Object.assign({},DEF,p),Object.assign({},st0));
    const effs=['furrow','flood','spray','drip'];
    const d14=C({irr:'drip',water:14}).y,f20=C({}).y;
    const n150=C({}),n250=C({N:250});
    let s={...st0};for(let i=0;i<10;i++){s.depth+=C({}).drop;}
    const saltLoss=Math.round(12*(3.2-1.7));
    return [
      {lvl:'bio',instant:true,q:'A farmer pumps 20 inches of water onto the field. Which irrigation method gets the most of it to the corn roots?',choices:['Furrow','Flood','Center-pivot spray','Drip'],correct:3,
       explain:'Drip puts water right at each plant, so about 95% reaches the roots. Spray gets about 85%, flood about 80% and furrow only about 65%; the rest evaporates or runs off.'},
      {lvl:'bio',instant:true,q:'The farmer sprays the same pesticide every year. What happens to the pests over the next several seasons?',choices:['They die out for good','Nothing changes','The survivors breed and the pests become resistant, so the spray works less and less'],correct:2,
       explain:'A few pests survive each spray because of natural variation. They pass on that resistance, so each year more of the population survives. That is evolution by natural selection, and it is why pest losses creep back up.'},
      {lvl:'bio',instant:true,q:'Raising fertilizer from 150 to 250 lb per acre does what?',choices:['Raises the harvest a lot','Raises the harvest a little, but much more nitrogen washes out of the field','Lowers the harvest'],correct:1,
       explain:`The harvest goes from about ${Math.round(n150.y)} to ${Math.round(n250.y)} bushels, but nitrate washed out goes from about ${Math.round(n150.no3)} to ${Math.round(n250.no3)} lb per acre. The corn can only use so much.`},
      {lvl:'honors',instant:true,q:'Drip irrigation with 14 inches pumped, or furrow with 20 inches. Which grows more corn?',choices:['Furrow with 20 in','About the same','Drip with 14 in'],correct:Math.abs(d14-f20)<5?1:(d14>f20?2:0),
       explain:`Drip with 14 in gives about ${Math.round(d14)} bushels; furrow with 20 in gives about ${Math.round(f20)}. Drip gets 95% of 14 in = 13.3 in to the roots, a bit more than furrow’s 65% of 20 in = 13 in, while pumping 30% less.`},
      {lvl:'honors',instant:true,q:'Pumping 20 inches a season lowers the water table 0.12 ft per inch, and rain recharges 0.5 ft. How far does the water table fall in 10 seasons?',choices:['About 2 ft','About 19 ft','About 50 ft'],correct:1,
       explain:'Each season: 20 × 0.12 − 0.5 = 1.9 ft. Ten seasons: about 19 ft. Pumping faster than recharge is called aquifer depletion, or groundwater mining.'},
      {lvl:'ap',instant:true,q:'Corn tolerates soil salinity up to 1.7 dS/m and then loses about 12% of its yield per extra dS/m. A field reaches 3.2 dS/m. About what share of the yield is lost?',choices:['12%','18%','32%','52%'],correct:1,
       explain:`3.2 − 1.7 = 1.5 dS/m over the threshold. 1.5 × 12% ≈ ${saltLoss}%. Salt from irrigation water builds up when water evaporates in a dry climate.`}
    ];},
  lab:{bio:'<p><b>Question:</b> Which irrigation method gives the most corn for the water pumped?</p><ol><li>Keep 20 in of water, 150 lb of fertilizer and IPM.</li><li>For each method, record a trial with the corn yield and the water lost.</li><li>Then find the smallest amount of water that still gives the furrow harvest with drip.</li></ol><p>How many gallons would a farmer save on 100 acres? (1 acre-inch = 27,154 gal.)</p>',
       honors:'<p><b>Question:</b> How do fertilizer and water together affect nitrate pollution?</p><ol><li>With flood irrigation, record nitrate washed out at 0, 100, 150, 200 and 250 lb of nitrogen, using 18 in and then 30 in of water.</li><li>Graph nitrate lost against nitrogen for both water amounts.</li></ol><p>Explain why extra water makes fertilizer pollution worse, and connect it to eutrophication downstream.</p>',
       ap:'<p><b>Question:</b> Design the most sustainable 20-season plan.</p><ol><li>Choose a method, water, nitrogen and pest control. Grow 20 seasons and record total corn, final water table depth, final salinity and average nitrate lost.</li><li>Compare with the default plan.</li></ol><p><b>Claim–evidence–reasoning:</b> Is your plan sustainable? Address aquifer depletion, salinization, pesticide resistance and nitrate leaching.</p>'},
  terms:[{t:'Irrigation',d:'Supplying water to crops beyond what rain provides.'},{t:'Aquifer',d:'Underground layers of rock or sand that hold water a well can pump.'},{t:'Fertilizer',d:'Nutrients, mostly nitrogen, phosphorus and potassium, added to soil to help crops grow.'},{t:'Pesticide',d:'A chemical that kills insects, weeds or other crop pests.'},
    {lvl:'honors',t:'Integrated pest management (IPM)',d:'Combining scouting, crop rotation, natural predators and targeted spraying to keep pests below a damaging level.'},{lvl:'honors',t:'Bt corn',d:'Corn genetically modified to make a protein from the bacterium Bacillus thuringiensis that kills certain caterpillars and beetles.'},{lvl:'honors',t:'Nitrate leaching',d:'Nitrate dissolving in water and draining below the roots toward groundwater.'},{lvl:'honors',t:'Pesticide resistance',d:'Pests evolving the ability to survive a pesticide after repeated exposure.'},
    {lvl:'ap',t:'Salinization',d:'Salt building up in soil as irrigation water evaporates.'},{lvl:'ap',t:'Waterlogging',d:'Too much water saturating the root zone, so roots can’t get oxygen.'},{lvl:'ap',t:'Aquifer depletion',d:'Withdrawing groundwater faster than recharge, so the water table falls.'}],
  about:'<p>One acre of irrigated corn on the High Plains of eastern Colorado, simplified. Growing-season rain is fixed at 8 in and crop water use at 24 in. Water reaching the roots = rain + water pumped × efficiency (flood 80%, furrow 65%, center-pivot spray 85%, drip 95%, the values taught in AP Environmental Science). Yield is 240 bu/acre times factors for water (linear from 4 to 24 in), nitrogen (45% with none, leveling off near 200 lb), pest losses, waterlogging (flood and furrow, 3% per inch of surplus beyond 2 in) and salinity (Maas–Hoffman: corn threshold 1.7 dS/m, 12% loss per dS/m). Each inch of irrigation water adds 0.006 dS/m of salt a season, and each inch of surplus water leaches 0.05 dS/m away. Nitrate lost is the nitrogen the crop can’t use, with a larger share leached when surplus water drains. Pests: unprotected losses 25%; repeated spraying builds resistance that raises losses and the dose; IPM and Bt corn build resistance more slowly. The water table drops 0.12 ft per inch pumped, minus 0.5 ft of recharge per season. All numbers are rounded teaching values, not a forecast for a real farm.</p>',
  initVis(sim){sim.vis.drops=[];sim.vis.bugs=null;sim.vis.no3=[];sim.vis.grow=0;},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,c=calc(p,st),v=sim.vis;if(!v.drops)FARM.initVis(sim);
    const GY=228,SY=232,AY=300,W=600;
    // sky, field, soil, aquifer
    const sky=ctx.createLinearGradient(0,0,0,GY);sky.addColorStop(0,'#cfe6f7');sky.addColorStop(1,'#eef6fb');ctx.fillStyle=sky;ctx.fillRect(0,0,W,GY);
    ctx.fillStyle='#f7d774';ctx.beginPath();ctx.arc(70,46,22,0,6.29);ctx.fill();
    ctx.fillStyle='#8b6a45';ctx.fillRect(0,GY,W,AY-GY);ctx.fillStyle='#a07c52';ctx.fillRect(0,GY,W,8);
    ctx.fillStyle='#d9c79a';ctx.fillRect(0,AY,W,450-AY);
    const wtY=clamp(AY+30+(st.depth-100)*1.6,AY+30,446);
    ctx.fillStyle='rgba(47,111,208,0.55)';ctx.fillRect(0,wtY,W,450-wtY);
    ctx.strokeStyle='#1f4f9a';ctx.lineWidth=2;ctx.setLineDash([8,5]);ctx.beginPath();ctx.moveTo(0,wtY);ctx.lineTo(W,wtY);ctx.stroke();ctx.setLineDash([]);
    txt(ctx,'Water table: '+st.depth.toFixed(0)+' ft down',14,Math.min(446,wtY+16),{s:12*k,w:700,c:'#0f2f66'});
    txt(ctx,'Aquifer (sand and gravel holding groundwater)',14,AY+14,{s:11*k,w:600,c:'#5b4a2a'});
    // well
    ctx.fillStyle='#6b7280';ctx.fillRect(560,150,10,300);ctx.fillRect(548,140,34,16);txt(ctx,'Well',565,132,{s:11*k,w:700,a:'center'});
    if(p.irr!=='none'&&p.water>0){ctx.fillStyle='#2f6fd0';ctx.fillRect(563,wtY,4,450-wtY);}
    // salt crust
    if(st.salt>1.4){const n=Math.min(60,Math.round((st.salt-1.4)*25));ctx.fillStyle='rgba(255,255,255,0.9)';for(let i=0;i<n;i++){const x=(i*97.3)%540+8,y=GY+1+((i*37)%5);ctx.fillRect(x,y,4,2);}}
    // fertilizer pellets
    const nP=Math.round(p.N/12);ctx.fillStyle='#f5f5f0';for(let i=0;i<nP;i++){const x=(i*53.7)%540+10,y=GY+3+((i*13)%4);ctx.beginPath();ctx.arc(x,y,2.2,0,6.29);ctx.fill();}
    // irrigation
    const rows=9,xs=i=>30+i*60;
    if(p.irr==='flood'&&p.water>0){ctx.fillStyle='rgba(70,140,220,0.55)';ctx.fillRect(0,GY-8,550,10);}
    if(p.irr==='furrow'&&p.water>0){ctx.fillStyle='rgba(70,140,220,0.7)';for(let i=0;i<rows-1;i++)rr(ctx,xs(i)+14,GY-4,32,6,3),ctx.fill();
      ctx.strokeStyle='#2f6fd0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(520,GY-1);ctx.lineTo(548,GY+16);ctx.stroke();txt(ctx,'runoff',512,GY+24,{s:10*k,c:'#1f4f9a',w:600});}
    if(p.irr==='spray'&&p.water>0){ctx.strokeStyle='#5b6472';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(10,96);ctx.lineTo(545,96);ctx.stroke();ctx.lineWidth=1;
      for(let x=20;x<545;x+=24){ctx.beginPath();ctx.moveTo(x,96);ctx.lineTo(x+12,82);ctx.lineTo(x+24,96);ctx.stroke();}
      [120,300,480].forEach(x=>{ctx.beginPath();ctx.moveTo(x,96);ctx.lineTo(x-10,GY);ctx.moveTo(x,96);ctx.lineTo(x+10,GY);ctx.stroke();});txt(ctx,'Center pivot',470,74,{s:11*k,w:700});}
    if(p.irr==='drip'&&p.water>0){ctx.strokeStyle='#222';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(10,GY-2);ctx.lineTo(548,GY-2);ctx.stroke();}
    // drops
    if(p.irr!=='none'&&p.water>0){const rate=p.water*(p.irr==='drip'?0.6:1.4);v.dacc=(v.dacc||0)+rate*vdt;
      while(v.dacc>=1){v.dacc--;let d;
        if(p.irr==='spray')d={x:15+Math.random()*530,y:100,vy:90,end:GY-4,lost:Math.random()>EFF.spray};
        else if(p.irr==='drip'){const i=Math.floor(Math.random()*rows);d={x:xs(i)+6,y:GY-1,vy:20,end:GY+30,lost:Math.random()>EFF.drip,soak:true};}
        else d={x:15+Math.random()*530,y:GY-6,vy:0,end:GY,lost:true,evap:true,ok:Math.random()<EFF[p.irr]};
        v.drops.push(d);}}
    for(const d of v.drops){if(d.evap){d.t=(d.t||0)+vdt;if(!d.ok){d.y-=26*vdt;d.x+=Math.sin(d.t*6+d.x)*0.4;}else{d.y+=18*vdt;}}else{d.y+=d.vy*vdt;if(d.lost&&d.y>GY-30&&!d.soak){d.evap=true;d.ok=false;d.t=0;}}}
    v.drops=v.drops.filter(d=>d.evap?(d.ok?d.y<GY+28:d.y>GY-80&&(d.t||0)<2):d.y<d.end+(d.soak?0:2));if(v.drops.length>220)v.drops.splice(0,v.drops.length-220);
    for(const d of v.drops){const up=d.evap&&!d.ok;ctx.globalAlpha=up?0.5:0.85;ctx.fillStyle=up?'#9fb8d6':'#2f6fd0';
      if(up){ctx.strokeStyle='#9fb8d6';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.quadraticCurveTo(d.x+3,d.y-4,d.x,d.y-8);ctx.stroke();}
      else{ctx.beginPath();ctx.arc(d.x,d.y,2,0,6.29);ctx.fill();}}ctx.globalAlpha=1;
    // corn
    const fr=clamp(c.y/YMAX,0,1),hgt=36+120*fr;
    for(let i=0;i<rows;i++){const x=xs(i),sw=Math.sin(t*1.3+i)*3*fr;
      ctx.strokeStyle=fr<0.45?'#a3a347':'#3f7a2a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,GY);ctx.quadraticCurveTo(x+sw*0.3,GY-hgt*0.5,x+sw,GY-hgt);ctx.stroke();
      ctx.fillStyle=fr<0.45?'#b8b25a':'#4f9a33';for(let j=1;j<=4;j++){const yy=GY-hgt*j/5,dir=j%2?1:-1;ctx.beginPath();ctx.moveTo(x+sw*j/5,yy);ctx.quadraticCurveTo(x+dir*22,yy-12,x+dir*30,yy+4);ctx.quadraticCurveTo(x+dir*16,yy-2,x+sw*j/5,yy+3);ctx.fill();}
      if(fr>0.3){ctx.fillStyle='#e0b43a';rr(ctx,x+3,GY-hgt*0.55,7,16*fr+6,3);ctx.fill();}
      ctx.fillStyle='#c9a227';ctx.beginPath();ctx.moveTo(x+sw,GY-hgt-10);ctx.lineTo(x+sw-4,GY-hgt);ctx.lineTo(x+sw+4,GY-hgt);ctx.closePath();ctx.fill();}
    // pests and helpful insects
    const nb=Math.round(c.loss*40);for(let i=0;i<nb;i++){const pl=i%rows,x=xs(pl)+Math.sin(t*2+i)*8+((i*7)%10)-5,y=GY-20-((i*29)%Math.max(20,hgt-30));
      ctx.fillStyle='#5a3a1a';ctx.beginPath();ctx.ellipse(x,y,4,2.6,0.3,0,6.29);ctx.fill();}
    const ng=Math.round(c.good/14);for(let i=0;i<ng;i++){const x=xs((i*4+2)%rows)+10,y=GY-30-((i*41)%Math.max(20,hgt-40));
      ctx.fillStyle='#c8102e';ctx.beginPath();ctx.arc(x,y,4,0,6.29);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x-1.5,y-1,0.9,0,6.29);ctx.arc(x+1.6,y+1,0.9,0,6.29);ctx.fill();}
    if(p.pest==='spray'){ctx.fillStyle='rgba(120,120,120,0.45)';for(let i=0;i<90;i++){const x=(i*61.7+t*14)%550,y=GY-8-((i*37.3)%(hgt+4));ctx.beginPath();ctx.arc(x,y,1.6,0,6.29);ctx.fill();}}
    // nitrate leaching arrows
    const na=Math.min(14,Math.round(c.no3/6));v.nt=(v.nt||0)+vdt;
    for(let i=0;i<na;i++){const x=24+i*38,ph=((v.nt*0.35+i*0.37)%1),y=SY+10+ph*(wtY-SY-10);ctx.globalAlpha=0.9*(1-ph*0.5);ctx.fillStyle='#3f8f3a';
      ctx.beginPath();ctx.moveTo(x,y+8);ctx.lineTo(x-5,y);ctx.lineTo(x+5,y);ctx.closePath();ctx.fill();txt(ctx,'NO₃⁻',x+7,y+5,{s:9*k,w:700,c:'#2d6b29'});}ctx.globalAlpha=1;
    if(na>=2)txt(ctx,'Extra nitrate leaching toward the groundwater',14,SY+26,{s:11*k,w:700,c:'#e8f5e2'});
    // cause and effect: when a setting changes, outline what changed in the field and show "was" values for a few seconds
    const sig=[p.irr,p.water,p.N,p.pest].join('|');
    if(v.sig&&sig!==v.sig&&v.last){const o=v.sig.split('|');v.chg={t:5,what:+o[2]!==p.N?'N':o[3]!==p.pest?'pest':'water',before:v.last};}
    if(v.lastYear!==st.year){v.chg=null;v.lastYear=st.year;}
    v.sig=sig;v.last={y:c.y,eff:c.eff,app:c.app,loss:c.loss,no3:c.no3};
    const ch=v.chg&&v.chg.t>0?v.chg:null,B=ch?ch.before:null;if(ch){ch.t-=vdt;const a=0.5+0.5*Math.sin(t*6);ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=3;ctx.globalAlpha=0.5+0.5*a;
      const box=ch.what==='water'?[4,p.irr==='spray'?70:GY-40,548,p.irr==='spray'?GY-30:70]:ch.what==='N'?[4,GY-6,548,wtY-GY+6]:[4,GY-hgt-16,548,hgt+18];rr(ctx,box[0],box[1],box[2],box[3],10);ctx.stroke();ctx.restore();
      if(B&&Math.abs(B.y-c.y)>2){const hb=36+120*clamp(B.y/YMAX,0,1);ctx.save();ctx.strokeStyle='#5b4a2a';ctx.setLineDash([6,5]);ctx.lineWidth=2;ctx.globalAlpha=clamp(ch.t,0,1);ctx.beginPath();ctx.moveTo(10,GY-hb);ctx.lineTo(548,GY-hb);ctx.stroke();ctx.setLineDash([]);
        txt(ctx,'corn height before',14,GY-hb-6,{s:11*k,w:700,c:'#5b4a2a'});ctx.restore();}
      const lab=ch.what==='water'?'Changed: watering':ch.what==='N'?'Changed: fertilizer':'Changed: pest control';pill(ctx,lab,300,box[1]<40?box[1]+box[3]+14:box[1]-10,'#c8102e','#fff',12*k);}
    // season report
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(W,0,800-W,450);
    const X=W+14;txt(ctx,st.year?'Season '+(st.year+1):'First season',X,28,{s:14*k,w:800});
    const row=(l,val,y,col,was)=>{txt(ctx,l,X,y,{s:11.5*k,c:PAL.muted,w:600});txt(ctx,val,X,y+18*k,{s:15*k,w:800,c:col||PAL['cv-ink']});
      if(ch&&was!=null&&was!==val){const a=clamp(ch.t,0,1);ctx.globalAlpha=a;txt(ctx,'was '+was,X,y+32*k,{s:11*k,w:700,c:'#c8102e'});ctx.globalAlpha=1;}};
    row('Corn this season',Math.round(c.y)+' bu/acre',58,'#8a6d0b',B&&Math.round(B.y)+' bu/acre');
    row('Water to the roots',p.irr==='none'?'rain only':Math.round(c.eff*100)+'% of '+c.app+' in',112,null,B&&(B.app===0?'rain only':Math.round(B.eff*100)+'% of '+B.app+' in'));
    row('Eaten by pests',Math.round(c.loss*100)+'%',166,c.loss>0.15?'#b3261e':null,B&&Math.round(B.loss*100)+'%');
    row('Nitrate washed out',Math.round(c.no3)+' lb/acre',220,c.no3>25?'#b3261e':'#2d6b29',B&&Math.round(B.no3)+' lb/acre');
    row('Water table',st.depth.toFixed(1)+' ft down',274,'#1f4f9a');
    if(atLeast('ap'))row('Soil salt',st.salt.toFixed(2)+' dS/m',328,st.salt>1.7?'#b3261e':null);
    if(st.hist.length){const h=st.hist[st.hist.length-1];pill(ctx,'Last harvest: '+Math.round(h.y)+' bu',W+100,atLeast('ap')?390:336,'#c9a227','#fff',12*k);}
    if(v.grow>0){v.grow=Math.max(0,v.grow-vdt*0.8);ctx.globalAlpha=v.grow;pill(ctx,'Harvest '+st.year+' done',300,30,'#3f7a2a','#fff',14*k);ctx.globalAlpha=1;}}
};
BioLab.register(FARM);
})();
