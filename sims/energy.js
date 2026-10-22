(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,serColor}=BioLab.h;

/* Energy pyramid: a lake food chain.
   GPP (captured sunlight) → plants burn `resp` for themselves → NPP stored in producers.
   E[0] = NPP, E[i] = E[i−1] × efficiency.  Mercury: C[0] = 0.01 ppm, C[i] = C[i−1] × (0.5 / efficiency)
   (predators eat ~1/eff times their own energy in prey and keep about half of the mercury in it).
   Trophic cascade: sea otters O (per km of coast), sea urchins U (per m²), kelp cover Kc (%), time in years. */
const LEVELS=[{n:'Phytoplankton',r:'Producers',sh:'Phyto'},{n:'Zooplankton',r:'Primary consumers',sh:'Zoo'},{n:'Minnows',r:'Secondary consumers',sh:'Minnows'},{n:'Pike',r:'Tertiary consumers',sh:'Pike'},{n:'Osprey',r:'Quaternary consumers',sh:'Osprey'}];
const BARC=['#2e8b47','#2f8a84','#3e6fb0','#7a4fa6','#b5122d'];
const HG0=0.01,FDA=1.0,CX=440,BARMAX=460,ROWH=72,ROW0=405;
const rowY=i=>ROW0-i*ROWH;
function calc(p){const n=p.levels,eff=p.eff/100,gpp=p.gpp,resp=p.resp/100,npp=gpp*(1-resp),E=[],C=[];
  for(let i=0;i<n;i++){E.push(i?E[i-1]*eff:npp);C.push(i?C[i-1]*0.5/eff:HG0);}return {n,eff,gpp,resp,npp,E,C};}
const fmtK=v=>v>=10?Math.round(v).toLocaleString('en-US'):v>=1?v.toFixed(1):v.toFixed(2);
const fmtPPM=v=>v>=10?v.toFixed(0):v>=1?v.toFixed(1):v.toFixed(2);
function niceCeil(x){if(!(x>0))return 1;const p=Math.pow(10,Math.floor(Math.log10(x)));const m=x/p;return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p;}
const isCas=sim=>sim.p.mode==='cascade';
function derivC(s){const pred=0.0564*s.O*s.U;return {O:0.3*s.O*(1-s.O/10),U:0.6*s.U*(1-s.U/50)-pred+0.05,K:1.0*s.Kc*(1-s.Kc/100)-6.25*s.U*s.Kc/(s.Kc+40)+0.2,pred};}

function syncTiles(sim){if(!sim.ui||!sim.ui.tiles)return;const mode=sim.p.mode;
  sim.def.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const el=t.num.closest('.tile');if(el)el.hidden=!atLeast(m.lvl)||(m.mode&&m.mode!==mode);});}
function syncGraph(sim){const want=isCas(sim)?'cascade':'levels';if(!atLeast('honors')&&want==='cascade')return;sim.gMetric=want;if(sim.ui&&sim.ui.gm){sim.ui.gm.value=want;BioLab.refresh(sim);}}

/* ---------- little organism icons ---------- */
function icon(ctx,i,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  if(i===0){[[-6,-3,5],[4,-5,4],[2,5,5],[-5,6,3.5]].forEach(c=>{ctx.fillStyle='#2e8b47';ctx.beginPath();ctx.arc(c[0],c[1],c[2],0,6.29);ctx.fill();ctx.fillStyle='#8fd18f';ctx.beginPath();ctx.arc(c[0]-1,c[1]-1,c[2]*0.35,0,6.29);ctx.fill();});}
  else if(i===1){ctx.fillStyle='#c98b2b';ctx.beginPath();ctx.ellipse(2,0,8,4.5,0,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(-12,-4);ctx.lineTo(-12,4);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#c98b2b';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(8,-2);ctx.quadraticCurveTo(14,-10,6,-13);ctx.moveTo(8,2);ctx.quadraticCurveTo(14,10,6,13);ctx.stroke();ctx.fillStyle='#222';ctx.beginPath();ctx.arc(7,-1,1.2,0,6.29);ctx.fill();}
  else if(i===2||i===3){const L=i===2?10:16,col=i===2?'#7d8fa0':'#5a7d3a';ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(0,0,L,L*0.33,0,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(-L+1,0);ctx.lineTo(-L-6,-5);ctx.lineTo(-L-6,5);ctx.closePath();ctx.fill();
    if(i===3){ctx.fillStyle='#c9d98a';for(let k=-2;k<=2;k++){ctx.beginPath();ctx.ellipse(k*5,-1,1.6,2.2,0,0,6.29);ctx.fill();}}ctx.fillStyle='#111';ctx.beginPath();ctx.arc(L*0.62,-L*0.08,1.3,0,6.29);ctx.fill();}
  else{ctx.fillStyle='#4a3a2c';ctx.beginPath();ctx.moveTo(-16,-2);ctx.quadraticCurveTo(-8,-12,0,-2);ctx.quadraticCurveTo(8,-12,16,-2);ctx.quadraticCurveTo(8,-6,0,2);ctx.quadraticCurveTo(-8,-6,-16,-2);ctx.fill();ctx.fillStyle='#f2efe8';ctx.beginPath();ctx.ellipse(0,1,3,4,0,0,6.29);ctx.fill();}
  ctx.restore();}
function drawUrchin(ctx,x,y,r){ctx.strokeStyle='#4a1f63';ctx.lineWidth=1.2;ctx.beginPath();for(let a=0;a<12;a++){const an=a*0.5236;ctx.moveTo(x+Math.cos(an)*r*0.8,y+Math.sin(an)*r*0.8);ctx.lineTo(x+Math.cos(an)*r*1.6,y+Math.sin(an)*r*1.6);}ctx.stroke();ctx.fillStyle='#6a2c8a';ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();}
function drawOtter(ctx,x,y,sc,hold){ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);ctx.fillStyle='#6b4a2f';ctx.beginPath();ctx.ellipse(0,0,20,7,0,0,6.29);ctx.fill();ctx.beginPath();ctx.ellipse(-22,2,7,3,0.3,0,6.29);ctx.fill();
  ctx.fillStyle='#d9c2a0';ctx.beginPath();ctx.arc(19,-4,7,0,6.29);ctx.fill();ctx.fillStyle='#6b4a2f';ctx.beginPath();ctx.arc(14,-9,2.2,0,6.29);ctx.fill();ctx.fillStyle='#222';ctx.beginPath();ctx.arc(22,-6,1.2,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(25,-3,1.3,0,6.29);ctx.fill();
  if(hold)drawUrchin(ctx,6,-8,3.5);ctx.restore();}

const EN={
  id:'energy',hash:'energy',apUnit:8,order:3,kind:'Simulation',tab:'Energy flow and food webs',
  card:'Follow packets of energy up a lake food chain, watch mercury concentrate, and pull sea otters out of a kelp forest.',
  title:'Energy flow, biomagnification and trophic cascades',
  lede:{bio:'Energy enters a food chain as sunlight and gets passed up when one organism eats another. Watch how little of it reaches the top.',
        honors:'Energy shrinks up the food chain, but some poisons grow more concentrated. Then switch to a kelp forest to see one predator reshape a whole ecosystem.',
        ap:'Quantify trophic efficiency, GPP versus NPP, and biomagnification, then model a keystone-predator trophic cascade over time.'},
  scale:{bio:'One square meter of a lake, over one year. Energy is in kilocalories (kcal), the same unit as food labels.',honors:'Pyramid: one square meter of lake over one year (kcal). Cascade: a stretch of rocky Pacific coast, with otters per km and urchins per m².'},
  timeScale:1,dtMax:0.01,prewarm:30,sampleDt:0.1,window:30,unit:'years',timeLabel:'Year',chChange:1,chReveal:3,
  clock:sim=>isCas(sim)?'Year '+Math.floor(sim.t):'Energy per m² per year',
  controls:[
    {id:'mode',label:'Mode',type:'seg',def:'pyramid',lvl:'honors',options:[{v:'pyramid',l:'Energy pyramid'},{v:'cascade',l:'Kelp forest cascade'}],onChange(sim){syncTiles(sim);syncGraph(sim);},noTrial:true},
    {id:'gpp',label:'Sunlight energy captured by producers',type:'range',min:2000,max:40000,step:1000,def:20000,unit:' kcal/m²/yr',lvl:'bio'},
    {id:'eff',label:'Trophic efficiency',type:'range',min:5,max:20,step:1,def:10,unit:'%',lvl:'bio',help:'Share of a level’s energy that ends up in the level above'},
    {id:'levels',label:'Food chain length',type:'range',min:2,max:5,step:1,def:4,unit:' levels',lvl:'bio'},
    {id:'resp',label:'Plant respiration',type:'range',min:30,max:80,step:5,def:50,unit:'%',lvl:'ap',help:'Share of captured energy plants burn for their own needs'},
    {id:'toxin',label:'Mercury in the lake',type:'toggle',def:false,lvl:'honors',help:'Phytoplankton absorb 0.01 ppm'},
    {id:'barScale',label:'Bar widths',type:'seg',def:'true',lvl:'honors',options:[{v:'true',l:'True to scale'},{v:'log',l:'Log scale'}],noTrial:true}
  ],
  actions:[
    {id:'removeOtters',label:'Remove the otters',lvl:'honors',run(sim){if(!isCas(sim))BioLab.setValues(sim,{mode:'cascade'});sim.st.O=0;sim.vis.banner={t:'Hunters removed the sea otters',life:2.5};}},
    {id:'returnOtters',label:'Bring otters back',lvl:'honors',run(sim){if(!isCas(sim))BioLab.setValues(sim,{mode:'cascade'});sim.st.O=Math.max(sim.st.O,2);sim.vis.banner={t:'A few sea otters return',life:2.5};}}
  ],
  init(){return {O:10,U:3.9,Kc:80,pred:0};},
  step(sim,dt){const s=sim.st,d=derivC(s);s.O=Math.max(0,s.O+d.O*dt);s.U=Math.max(0,s.U+d.U*dt);s.Kc=clamp(s.Kc+d.K*dt,0,100);s.pred=d.pred;},
  metrics:[
    {id:'topE',label:'Energy reaching the top level',unit:'kcal/m²/yr',lvl:'bio',mode:'pyramid',min:0,max:null,d:1,get:s=>isCas(s)?NaN:calc(s.p).E[s.p.levels-1]},
    {id:'pctTop',label:'Producer energy that reaches the top',unit:'%',lvl:'bio',mode:'pyramid',min:0,max:null,d:2,get:s=>{if(isCas(s))return NaN;const c=calc(s.p);return 100*c.E[c.n-1]/c.E[0];}},
    {id:'toxTop',label:'Mercury in the top level',unit:'ppm',lvl:'honors',mode:'pyramid',min:0,max:null,d:2,get:s=>(isCas(s)||!s.p.toxin)?NaN:calc(s.p).C[s.p.levels-1]},
    {id:'npp',label:'Net primary production (NPP)',unit:'kcal/m²/yr',lvl:'ap',mode:'pyramid',min:0,max:null,d:0,get:s=>isCas(s)?NaN:calc(s.p).npp},
    {id:'plantResp',label:'Burned by plant respiration',unit:'kcal/m²/yr',lvl:'ap',mode:'pyramid',min:0,max:null,d:0,get:s=>isCas(s)?NaN:s.p.gpp*s.p.resp/100},
    {id:'otters',label:'Sea otters',unit:'per km of coast',lvl:'honors',mode:'cascade',min:0,max:12,d:1,get:s=>isCas(s)?s.st.O:NaN},
    {id:'urchins',label:'Sea urchins',unit:'per m²',lvl:'honors',mode:'cascade',min:0,max:55,d:1,get:s=>isCas(s)?s.st.U:NaN},
    {id:'kelp',label:'Kelp cover',unit:'%',lvl:'honors',mode:'cascade',min:0,max:100,d:0,get:s=>isCas(s)?s.st.Kc:NaN}
  ],
  onLevel(sim){syncTiles(sim);},
  graphs:[{id:'levels',label:'Energy at each level',custom:true},{id:'toxin',label:'Mercury at each level',lvl:'honors',custom:true},{id:'cascade',label:'Otters, urchins and kelp',lvl:'honors',custom:true}],
  defaultGraph:'levels',
  plot(sim,ctx,box,id){
    const msg=m=>txt(ctx,m,box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});
    if(id==='cascade'){
      if(!isCas(sim)){msg('Switch Mode to Kelp forest cascade to see this graph.');return;}
      const win=sim.def.window,xmax=Math.max(win,sim.t),xmin=xmax-win,rows=sim.hist.filter(r=>r.t>=xmin-1e-9&&Number.isFinite(r.v.kelp));
      const ser=[['otters','Sea otters per km',12,serColor(3)],['urchins','Urchins per m²',55,serColor(4)],['kelp','Kelp cover %',100,serColor(2)]];
      const gap=8,sh=(box.H-2*gap)/3,X=x=>box.L+(x-xmin)/(xmax-xmin)*box.W;
      ser.forEach((sr,i)=>{const T=box.T+i*(sh+gap),Y=v=>T+sh-v/sr[2]*sh;ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;ctx.strokeRect(box.L+.5,T+.5,box.W,sh);
        txt(ctx,String(sr[2]),box.L-6,T+6,{s:12,c:PAL['g-axis'],a:'right',b:'middle'});txt(ctx,'0',box.L-6,T+sh,{s:12,c:PAL['g-axis'],a:'right',b:'middle'});
        txt(ctx,sr[1],box.L+8,T+14,{s:13,c:sr[3],w:700});
        if(rows.length>1){ctx.beginPath();rows.forEach((r,j)=>{const x=X(r.t),y=Y(clamp(r.v[sr[0]],0,sr[2]));j?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle=sr[3];ctx.lineWidth=2.5;ctx.stroke();
          const lr=rows[rows.length-1];ctx.fillStyle=sr[3];ctx.beginPath();ctx.arc(X(lr.t),Y(clamp(lr.v[sr[0]],0,sr[2])),4,0,6.29);ctx.fill();}});
      const step=xmax-xmin>20?5:2;for(let x=Math.ceil(xmin/step)*step;x<=xmax+1e-9;x+=step)txt(ctx,x.toFixed(0),X(x),box.T+box.H+16,{s:13,c:PAL['g-axis'],a:'center'});
      txt(ctx,'Year',box.L+box.W/2,box.ch-4,{s:13,c:PAL['muted'],a:'center'});return;}
    if(isCas(sim)){msg('Switch Mode to Energy pyramid to see this graph.');return;}
    const c=calc(sim.p),cats=LEVELS.slice(0,c.n).map(l=>l.sh);
    if(id==='levels'){const ax=axes(ctx,box,{xmin:0,xmax:c.n,ymin:0,ymax:niceCeil(c.E[0]*1.12),xcats:cats,yl:'Energy (kcal/m²/yr)'});bars(ctx,ax,c.E,{colors:BARC,d:0});return;}
    if(!sim.p.toxin){msg('Turn on Mercury in the lake to see this graph.');return;}
    const ymax=niceCeil(Math.max(FDA,...c.C)*1.15),ax=axes(ctx,box,{xmin:0,xmax:c.n,ymin:0,ymax,xcats:cats,yl:'Mercury (ppm)'});
    bars(ctx,ax,c.C,{colors:c.C.map(v=>v>FDA?PAL['cv-inc']:PAL['cv-inn']),d:2});
    ctx.setLineDash([6,4]);ctx.strokeStyle=PAL['cv-inc'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(box.L,ax.Y(FDA));ctx.lineTo(box.L+box.W,ax.Y(FDA));ctx.stroke();ctx.setLineDash([]);
    txt(ctx,'FDA limit for fish (1 ppm)',box.L+8,ax.Y(FDA)-6,{s:12,c:PAL['cv-inc'],w:600});
  },
  challenges:[
    {lvl:'bio',q:'Producers store 10,000 kcal per m² each year. You add a third level: minnows that eat the zooplankton. About how much energy reaches the minnows?',
     choices:['About 5,000 kcal','About 1,000 kcal','About 100 kcal','About 9,000 kcal'],correct:2,
     baseline:{levels:2},change:{levels:3},changeText:'Minnows added as a third level',watch:'levels',
     explain:{bio:'Only about 10% passes up each step: 10,000 kcal in producers, 1,000 in zooplankton, 100 in minnows. The other 90% at each step is used for living and leaves as heat.'}},
    {lvl:'bio',q:'A sunnier lake lets producers capture twice as much energy (20,000 → 40,000 kcal). What happens to the energy reaching the pike at the top?',
     choices:['It doubles','It stays the same','It goes up 10 times'],correct:0,
     change:{gpp:40000},changeText:'Captured sunlight doubled to 40,000 kcal',watch:'levels',
     explain:{bio:'Every level gets the same share of the level below, so doubling the energy at the bottom doubles it at every level, from 10 to 20 kcal for the pike. More energy at the base can support more top predators.'}},
    {lvl:'honors',q:'Mercury enters the lake, and phytoplankton absorb a tiny amount (0.01 ppm). Where will mercury be most concentrated?',
     choices:['In the phytoplankton','Spread evenly through the chain','In the pike at the top'],correct:2,
     change:{toxin:true},changeText:'Mercury added to the lake',watch:'toxin',
     explain:{honors:'This is biomagnification. Energy is burned off at each level, but mercury is stored in the body. Each predator eats many times its own weight in prey, so mercury grows about 5 times more concentrated per level, reaching 1.25 ppm in pike. That is above the FDA limit for eating fish.'}},
    {lvl:'honors',q:'Hunters remove the sea otters from a kelp forest. Otters eat sea urchins, and urchins eat kelp. What happens to the kelp over the next 10 years?',
     choices:['It grows thicker, since otters no longer disturb it','Urchins boom and the kelp forest collapses','Nothing changes, because otters don’t eat kelp'],correct:1,
     baseline:{mode:'cascade'},changeAction:'removeOtters',changeText:'Sea otters removed',watch:'cascade',at:2,reveal:12,
     explain:{honors:'This is a trophic cascade. Without otters, urchins multiply and mow down the kelp, leaving an “urchin barren” within about 5 years. Otters never eat kelp, yet the kelp depends on them. That makes otters a keystone species. This happened along the Pacific coast when otters were hunted for fur.'}},
    {lvl:'ap',q:'In a 4-level chain, trophic efficiency rises from 10% to 20%. How much more energy reaches the top level?',
     choices:['2 times as much','4 times as much','8 times as much'],correct:2,
     baseline:{levels:4},change:{eff:20},changeText:'Trophic efficiency raised to 20%',watch:'levels',
     explain:{ap:'E(top) = NPP × efficiency³ for a 4-level chain. Doubling efficiency multiplies the top level by 2³ = 8, from 10 to 80 kcal. Small efficiency changes compound up the chain, which is why ecosystems with efficient consumers can support longer food chains.'}},
    {lvl:'ap',q:'Hot weather makes plants burn 70% of the energy they capture for their own respiration, instead of 50%. What happens to the energy available to every consumer level?',
     choices:['It rises','It falls by about 40%','It stays the same'],correct:1,
     change:{resp:70},changeText:'Plant respiration raised to 70%',watch:'levels',
     explain:{ap:'NPP = GPP − plant respiration. NPP drops from 50% to 30% of GPP, a 40% cut (from 10,000 to 6,000 kcal). Because every consumer level is a fixed fraction of NPP, they all fall by the same 40%.'}}
  ],
  narrate(sim){const p=sim.p,s=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(isCas(sim)){
      if(s.O<0.5&&s.Kc>20)return '<b>No otters.</b> Sea urchins are multiplying and grazing the kelp faster than it can regrow.';
      if(s.O<0.5)return '<b>Urchin barren.</b> Without otters, urchins have mowed down the kelp forest. Fish and other animals that lived in the kelp lose their home too.';
      if(s.U>8&&s.Kc<40)return '<b>Otters are back, but still few.</b> They are eating urchins, but there are still too many urchins for the kelp to regrow. Recovery takes years.';
      if(s.Kc<60)return 'Urchin numbers are falling, and the <b>kelp is starting to regrow</b>.';
      return '<b>Healthy kelp forest.</b> Otters eat sea urchins and keep them few, so the kelp stays thick. Otters are a <b>keystone species</b>.';}
    const c=calc(p),top=LEVELS[c.n-1].n.toLowerCase();
    let out=(ap?'Plants burn '+p.resp+'% of the '+fmtK(c.gpp)+' kcal they capture (GPP) just to stay alive. ':'')+'Producers store <b>'+fmtK(c.E[0])+' kcal</b> per m² each year. Only <b>'+p.eff+'%</b> passes up each step; the rest is used for living and given off as heat. The '+top+' at the top get just <b>'+fmtK(c.E[c.n-1])+' kcal</b>, which is why there are so few of them.';
    if(hon&&p.toxin)out+=' Mercury is <b>'+Math.round(c.C[c.n-1]/c.C[0]).toLocaleString('en-US')+'×</b> more concentrated in the '+top+' than in the phytoplankton.';
    return out;},
  tour:[
    {title:'Energy starts as sunlight',text:'Sunlight hits the lake. Phytoplankton, tiny floating algae, capture a small part of it by photosynthesis. Each yellow square is a packet of energy.',focus:[[8,8,112,92],[200,377,500,56]],speed:0.3},
    {title:'Producers store energy',text:{bio:'Phytoplankton use some of that energy to live and store the rest in their bodies. That stored energy is the food for everything else in the lake.',ap:'Captured energy is gross primary production (GPP). Plants burn part of it in their own cellular respiration (packets that turn to heat right away). What is left, net primary production (NPP), is what consumers can eat.'},focus:[8,377,787,56],speed:0.3},
    {title:'Eating moves energy up',text:'Zooplankton eat phytoplankton. Follow the packets: only about 1 in 10 makes it up to the next level.',focus:[8,305,787,128],speed:0.25},
    {title:'Where does the rest go?',text:'Most of the energy each organism takes in is burned for moving, breathing and staying alive, and leaves as heat (orange squiggles). Some is in parts that never get eaten, like shells, bones and waste.',focus:[196,88,508,346],speed:0.3},
    {title:'Each level gets about 10%',text:'10,000 → 1,000 → 100 → 10 kcal. Each level gets roughly a tenth of the energy of the level below it.',focus:[672,88,128,346],speed:1},
    {title:'Why top predators are rare',text:'Pike get only about 10 kcal per m² a year. A lake can feed huge numbers of minnows but only a few pike. This is why food chains rarely go past 4 or 5 levels.',focus:[8,161,787,56],speed:1},
    {lvl:'honors',title:'Mercury builds up',text:'Mercury isn’t burned off like energy. Each predator eats many times its weight in prey and keeps their mercury, so it gets more concentrated at every level. Pike end up above the FDA limit for eating fish.',focus:[196,88,604,346],speed:0.5,setup(sim){BioLab.setValues(sim,{toxin:true});}},
    {lvl:'honors',title:'A trophic cascade',text:'Top predators can shape a whole ecosystem. Here, sea otters eat sea urchins, and urchins eat kelp. After the walkthrough, press <b>Remove the otters</b> and watch what happens to the kelp.',speed:1,setup(sim){BioLab.setValues(sim,{mode:'cascade'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'pyramid',toxin:false});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> How does the length of a food chain affect the energy available at the top?</p><ol><li>Keep efficiency at 10%. Record a trial for chain lengths of 2, 3, 4 and 5 levels.</li><li>Plot chain length (x) against energy reaching the top level (y).</li><li>Repeat at 20% efficiency.</li></ol><p>Use your data to explain why there are fewer top predators than plant eaters.</p>',
       honors:'<p><b>Question:</b> How does food-chain length affect mercury in the top predator?</p><ol><li>Turn on mercury. Record a trial for chain lengths of 2–5 levels.</li><li>Find the first level that goes above the FDA limit of 1 ppm.</li><li>Switch to the kelp forest. Record kelp cover, then remove the otters and record again after 10 years.</li></ol><p>Explain biomagnification and the trophic cascade, and why both put top predators in a special position.</p>',
       ap:'<p><b>Question:</b> How do trophic efficiency and plant respiration together set the energy at the top of a food chain?</p><ol><li>For a 4-level chain, record top-level energy at efficiencies of 5, 10, 15 and 20%.</li><li>Repeat at plant respiration of 40% and 70%.</li><li>Fit your results to E(top) = GPP × (1 − R) × efficiency³.</li></ol><p><b>Claim–evidence–reasoning:</b> Which change matters more to top predators, and why?</p>'},
  terms:[{t:'Food chain',d:'The path energy takes as one organism eats another.'},{t:'Producer',d:'An organism, like algae or plants, that makes its own food from sunlight.'},{t:'Consumer',d:'An organism that gets energy by eating other organisms.'},{t:'Trophic level',d:'A feeding step in a food chain: producers, primary consumers and so on.'},{t:'10% rule',d:'Only about 10% of the energy at one level reaches the next.'},
    {lvl:'honors',t:'Biomagnification',d:'A toxin becoming more concentrated at each higher level of a food chain.'},{lvl:'honors',t:'Trophic cascade',d:'A change at the top of a food chain that ripples down through several levels.'},{lvl:'honors',t:'Keystone species',d:'A species whose effect on its ecosystem is much larger than its numbers suggest.'},
    {lvl:'ap',t:'GPP',d:'Gross primary production: all the energy producers capture.'},{lvl:'ap',t:'NPP',d:'Net primary production: GPP minus what producers burn in their own respiration.'},{lvl:'ap',t:'Trophic efficiency',d:'The fraction of one level’s production that becomes production at the next level.'}],
  about:'<p><b>Energy pyramid.</b> NPP = GPP × (1 − plant respiration). Each level holds the level below × trophic efficiency. Energy packets in the animation follow the same odds: each packet climbs with probability equal to the efficiency, or becomes heat. Real efficiencies range from about 5% to 20%, and 10% is a common rule of thumb.</p><p><b>Mercury.</b> Phytoplankton hold 0.01 ppm, and each level multiplies the concentration by 0.5 ÷ efficiency (×5 at 10%). This assumes a predator eats about 1/efficiency times its own energy in prey and keeps about half of the mercury. Real biomagnification factors for methylmercury are roughly 3–10 per level. The FDA action level for fish is 1 ppm.</p><p><b>Kelp forest.</b> Otters grow logistically to 10 per km of coast and eat urchins at a rate proportional to otters × urchins. Urchins grow logistically to 50 per m². Kelp regrows at 100% per year and is grazed in proportion to urchins. Simplifications: no other predators of urchins, no storms or ocean warming, and otters are not limited by food.</p>',
  initVis(sim){const r=rng(9),v=sim.vis;v.pk=[];v.heat=[];v.acc=0;v.banner=null;v.r=r;
    v.kelpX=[];for(let i=0;i<16;i++)v.kelpX.push({x:40+i*47+r()*20,h:0.75+r()*0.25,ph:r()*6.28,ord:r()});v.kelpX.sort((a,b)=>a.ord-b.ord);
    v.urch=[];for(let i=0;i<70;i++)v.urch.push({x:15+r()*770,y:405+r()*32,r:4+r()*2.5});
    v.otPos=[];for(let i=0;i<12;i++)v.otPos.push({x:60+i*62+r()*20,ph:r()*6.28});v.dives=[];v.dAcc=0;
    v.hg=[];for(let i=0;i<60;i++)v.hg.push([r()*2-1,r()*2-1]);},
  thumbFrames:120,
  draw(sim,ctx,vdt,k,t){
    const v=sim.vis,p=sim.p,ks=Math.min(k,1.25);
    if(isCas(sim))drawCascade(sim,ctx,vdt,k,t);else drawPyramid(sim,ctx,vdt,ks,t);
    if(v.banner&&v.banner.life>0){v.banner.life-=vdt||0.016;pill(ctx,v.banner.t,400,110,'#b3261e','#fff',14*Math.min(k,1.3));}
  }
};

function barW(p,c,i){if(p.barScale==='log'&&c.E[0]>1){return BARMAX*Math.max(0.03,Math.log10(Math.max(c.E[i],1))/Math.log10(c.E[0]));}return Math.max(4,BARMAX*c.E[i]/c.E[0]);}
function drawPyramid(sim,ctx,vdt,ks,t){
  const v=sim.vis,p=sim.p,c=calc(p),R=Math.random,hon=atLeast('honors'),ap=atLeast('ap');
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  // sun
  const sx=58,sy=52;ctx.strokeStyle='#f2b705';ctx.lineWidth=3;for(let i=0;i<12;i++){const a=i*0.5236+(RM?0:t*0.2);ctx.beginPath();ctx.moveTo(sx+Math.cos(a)*32,sy+Math.sin(a)*32);ctx.lineTo(sx+Math.cos(a)*42,sy+Math.sin(a)*42);ctx.stroke();}
  ctx.fillStyle='#f6c431';ctx.beginPath();ctx.arc(sx,sy,26,0,6.29);ctx.fill();txt(ctx,'Sunlight',sx,sy+4,{s:12*ks,w:700,c:'#4a3a00',a:'center',b:'middle'});
  txt(ctx,'Lake food chain',440,26,{s:15*ks,w:700,a:'center'});txt(ctx,'energy per square meter per year'+(p.barScale==='log'&&hon?' · log-scale bar widths':''),440,46,{s:12*ks,c:PAL['cv-soft'],a:'center'});
  // rows
  for(let i=0;i<c.n;i++){const y=rowY(i),w=barW(p,c,i);
    ctx.fillStyle=BARC[i];rr(ctx,CX-w/2,y-24,w,48,Math.min(8,w/2));ctx.fill();
    if(w>110)txt(ctx,fmtK(c.E[i])+' kcal',CX,y+1,{s:13*ks,w:700,c:'#fff',a:'center',b:'middle'});
    icon(ctx,i,28,y,1);txt(ctx,LEVELS[i].n,52,y-3,{s:13*ks,w:700});txt(ctx,i===c.n-1&&i>0?'Top predator':LEVELS[i].r,52,y+14,{s:11.5*ks,c:PAL['cv-soft']});
    txt(ctx,fmtK(c.E[i])+' kcal',790,y-4,{s:13*ks,w:700,a:'right'});
    if(hon&&p.toxin){const hg=c.C[i];txt(ctx,'Hg '+fmtPPM(hg)+' ppm',790,y+14,{s:12*ks,w:700,a:'right',c:hg>FDA?PAL['cv-inc']:PAL['cv-inn']});
      const nd=Math.min(60,Math.round(3*Math.pow(hg/HG0,0.62))),hw=Math.max(w,64)/2;ctx.fillStyle=PAL['cv-inn'];
      for(let j=0;j<nd;j++){const q=v.hg[j];ctx.beginPath();ctx.arc(CX+q[0]*(hw-5),y+q[1]*17,2.6,0,6.29);ctx.fill();}}
    else txt(ctx,(100*c.E[i]/c.E[0]>=1?Math.round(100*c.E[i]/c.E[0]):(100*c.E[i]/c.E[0]).toFixed(2))+'% of producers',790,y+14,{s:12*ks,c:PAL['cv-soft'],a:'right'});
    if(i<c.n-1){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(CX-110,y-30);ctx.lineTo(CX-110,y-42);ctx.stroke();ctx.beginPath();ctx.moveTo(CX-114,y-38);ctx.lineTo(CX-110,y-43);ctx.lineTo(CX-106,y-38);ctx.stroke();
      txt(ctx,'eaten',CX-104,y-33,{s:11*ks,c:PAL['cv-soft']});}}
  if(hon&&p.toxin)txt(ctx,'FDA limit for fish: 1 ppm',790,rowY(c.n-1)-38,{s:11.5*ks,c:PAL['cv-inc'],a:'right',w:600});
  // energy packets: each climbs with probability = efficiency, otherwise becomes heat
  v.acc+=vdt*7*(c.gpp/20000);
  while(v.acc>=1&&v.pk.length<240){v.acc--;const w=barW(p,c,0);v.pk.push({x:sx+20,y:sy+20,tx:CX+(R()-.5)*(w-8),ty:rowY(0)+(R()-.5)*30,lvl:0,st:'fly',sp:260,src:'sun'});}
  if(v.acc>=1)v.acc=0;
  const toHeat=(q)=>{v.heat.push({x:q.x,y:q.y,dir:q.x<CX?-1:1,life:1.3,ph:R()*6});q.dead=true;};
  for(const q of v.pk){if(q.dead)continue;
    if(q.st==='fly'){const dx=q.tx-q.x,dy=q.ty-q.y,d=Math.hypot(dx,dy),st=q.sp*vdt;if(d<=st){q.x=q.tx;q.y=q.ty;q.st='rest';q.rest=0.3+R()*0.7;
        if(q.src==='sun'&&R()<c.resp){q.rest=0.15;q.plant=true;}}else{q.x+=dx/d*st;q.y+=dy/d*st;}}
    else{q.rest-=vdt;if(q.rest<=0){if(q.plant){toHeat(q);continue;}
      if(q.lvl<c.n-1&&R()<c.eff){const w=barW(p,c,q.lvl+1);q.lvl++;q.src='eat';q.tx=CX+(R()-.5)*Math.max(0,w-8);q.ty=rowY(q.lvl)+(R()-.5)*30;q.st='fly';q.sp=110;}else toHeat(q);}}}
  v.pk=v.pk.filter(q=>!q.dead&&q.lvl<c.n);
  for(const h of v.heat){h.life-=vdt;h.x+=h.dir*40*vdt;h.y-=22*vdt;}v.heat=v.heat.filter(h=>h.life>0);if(v.heat.length>160)v.heat.splice(0,v.heat.length-160);
  ctx.lineWidth=2;for(const h of v.heat){ctx.globalAlpha=clamp(h.life/1.3,0,1);ctx.strokeStyle='#e0602a';ctx.beginPath();for(let j=0;j<=6;j++){const xx=h.x+j*2*h.dir,yy=h.y+Math.sin(j*1.3+h.ph)*3;j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();}ctx.globalAlpha=1;
  for(const q of v.pk){ctx.fillStyle=PAL['cv-e'];ctx.strokeStyle=PAL['cv-estroke'];ctx.lineWidth=1;ctx.fillRect(q.x-3,q.y-3,6,6);ctx.strokeRect(q.x-3,q.y-3,6,6);}
  // key
  const ky=436;ctx.fillStyle=PAL['cv-e'];ctx.fillRect(200,ky-8,8,8);txt(ctx,'energy packet',214,ky,{s:12*ks,c:PAL['cv-soft']});
  ctx.strokeStyle='#e0602a';ctx.lineWidth=2;ctx.beginPath();for(let j=0;j<=6;j++){const xx=320+j*2.5,yy=ky-4+Math.sin(j*1.3)*3;j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();
  txt(ctx,ap?'heat (used for living, incl. plant respiration)':'heat (used for living)',342,ky,{s:12*ks,c:PAL['cv-soft']});
}
function drawCascade(sim,ctx,vdt,k,t){
  const v=sim.vis,s=sim.st,R=Math.random,ks=Math.min(k,1.3);
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,72);ctx.fillStyle=PAL['cv-water'];ctx.fillRect(0,72,800,340);
  ctx.fillStyle=PAL['cv-bench'];ctx.beginPath();ctx.moveTo(0,412);for(let x=0;x<=800;x+=40)ctx.lineTo(x,410+Math.sin(x*0.05)*5);ctx.lineTo(800,450);ctx.lineTo(0,450);ctx.closePath();ctx.fill();
  // kelp
  const nK=Math.round(16*s.Kc/100),hK=clamp(s.Kc/60,0.15,1);
  for(let i=0;i<nK;i++){const kp=v.kelpX[i],base=410,top=base-(320*kp.h*hK),sw=RM?0:Math.sin(t*0.9+kp.ph)*10;
    ctx.strokeStyle=PAL['cv-leaf'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(kp.x,base);ctx.quadraticCurveTo(kp.x+sw,(base+top)/2,kp.x+sw*1.4,top);ctx.stroke();
    for(let y=base-20;y>top+10;y-=24){const f=(base-y)/(base-top),xx=kp.x+sw*1.4*f*f+sw*0.4*(1-f)*f*2;ctx.fillStyle=((y/24|0)%2)?PAL['cv-leaf2']:PAL['cv-leaf'];ctx.beginPath();ctx.ellipse(xx+((y/24|0)%2?8:-8),y,10,3.5,((y/24|0)%2?-0.5:0.5),0,6.29);ctx.fill();}
    ctx.fillStyle='#8a6d1f';ctx.beginPath();ctx.arc(kp.x+sw*1.4,top,4,0,6.29);ctx.fill();}
  // urchins
  const nU=Math.min(70,Math.round(s.U*1.4));for(let i=0;i<nU;i++){const u=v.urch[i];if(u.gone>0){u.gone-=vdt;continue;}drawUrchin(ctx,u.x,u.y,u.r);}
  // otters + dives (rate ∝ urchins eaten)
  const nO=Math.min(12,Math.round(s.O));
  v.dAcc+=s.pred*vdt*sim.def.timeScale*0.8;
  while(v.dAcc>=1){v.dAcc--;const free=[];for(let i=0;i<nO;i++)if(!v.dives.some(d=>d.i===i))free.push(i);const tg=[];for(let i=0;i<nU;i++)if(!(v.urch[i].gone>0))tg.push(i);
    if(!free.length||!tg.length){v.dAcc=Math.min(v.dAcc,1);break;}const oi=free[Math.floor(R()*free.length)],ui=tg[Math.floor(R()*tg.length)];v.dives.push({i:oi,u:ui,ph:0});}
  for(const d of v.dives){d.ph+=vdt/1.8;if(d.ph>=0.5&&!d.got){d.got=true;v.urch[d.u].gone=1.5;}}
  v.dives=v.dives.filter(d=>d.ph<1&&d.i<nO);
  for(let i=0;i<nO;i++){const o=v.otPos[i],dv=v.dives.find(d=>d.i===i),bob=RM?0:Math.sin(t*1.5+o.ph)*2;
    if(dv){const u=v.urch[dv.u],f=dv.ph<0.5?dv.ph*2:(1-dv.ph)*2,x=o.x+(u.x-o.x)*f,y=66+(u.y-12-66)*f;ctx.save();ctx.translate(x,y);ctx.rotate(dv.ph<0.5?1.2:-1.2);drawOtter(ctx,0,0,0.8,dv.got);ctx.restore();}
    else drawOtter(ctx,o.x,64+bob,0.8,false);}
  // meters
  const meter=(y,label,val,max,unit,col)=>{rr(ctx,520,y,270,24,6);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    ctx.globalAlpha=0.35;ctx.fillStyle=col;rr(ctx,521,y+1,Math.max(0,268*clamp(val/max,0,1)),22,6);ctx.fill();ctx.globalAlpha=1;
    txt(ctx,label,530,y+13,{s:12.5*ks,w:700,b:'middle'});txt(ctx,val.toFixed(label==='Kelp cover'?0:1)+unit,782,y+13,{s:12.5*ks,w:700,a:'right',b:'middle'});};
  meter(84,'Sea otters',s.O,12,' /km',serColor(3));meter(112,'Sea urchins',s.U,55,' /m²',serColor(4));meter(140,'Kelp cover',s.Kc,100,'%',serColor(2));
  txt(ctx,'Kelp forest, Pacific coast',14,24,{s:15*ks,w:700});txt(ctx,'Year '+Math.floor(sim.t),14,44,{s:12*ks,c:PAL['cv-soft']});
}
BioLab.register(EN);
})();
