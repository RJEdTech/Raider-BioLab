(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,RM}=BioLab.h;

/* Niche partitioning and competitive exclusion (APES Topic 1.1; Biology ecology).
   Lotka–Volterra competition. Each species uses a bell-shaped range of a resource (a place, a food);
   overlap α = exp(−d²/4w²) for two curves of width w whose centers are d apart (MacArthur and Levins).
   dNᵢ/dt = rᵢNᵢ(1 − (Nᵢ + αNⱼ)/Kᵢ). The first species is the stronger competitor (larger K). */
const W=0.11;
const SC={
  gause1:{l:'Paramecium: same food (Gause)',unit:'days',ts:1.6,win:30,dt:0.05,scene:'tube',axis:'Where in the tube they feed (top to bottom)',ax0:'top',ax1:'bottom',sep:0.15,r:[0.9,0.7],K:[400,300],cnt:'per mL',
    A:{n:'P. aurelia',c:'#6b8fd6',sz:0.8,c0:0.48,note:'eats bacteria'},B:{n:'P. caudatum',c:'#c58a3a',sz:1.15,c0:0.52,note:'eats bacteria'},
    ex:'Gause, 1934: two kinds of Paramecium in one tube, both eating the same bacteria'},
  gause2:{l:'Paramecium: different zones (Gause)',unit:'days',ts:1.6,win:30,dt:0.05,scene:'tube',axis:'Where in the tube they feed (top to bottom)',ax0:'top',ax1:'bottom',sep:2.6,r:[0.7,0.6],K:[300,260],cnt:'per mL',
    A:{n:'P. caudatum',c:'#c58a3a',sz:1.15,c0:0.32,note:'eats bacteria floating near the top'},B:{n:'P. bursaria',c:'#4f9d4a',sz:0.95,c0:0.72,note:'eats yeast near the bottom'},
    ex:'Gause, 1934: P. caudatum feeds on bacteria near the top; green P. bursaria feeds on yeast near the bottom'},
  warblers:{l:'Warblers in a spruce tree (MacArthur)',unit:'years',ts:2,win:40,dt:0.05,scene:'tree',axis:'Where in the spruce they hunt insects (top to bottom)',ax0:'treetop',ax1:'lower branches',sep:2.2,r:[0.45,0.45],K:[40,34],cnt:'pairs',
    A:{n:'Cape May warbler',c:'#e2b43a',sz:1,c0:0.22,note:'hunts the treetop'},B:{n:'Bay-breasted warbler',c:'#9c4a2a',sz:1,c0:0.6,note:'hunts the middle, near the trunk'},
    ex:'MacArthur, 1958: warblers sharing spruce trees in Maine each hunt insects in a different part of the tree'},
  grazers:{l:'Grazers and browsers (Gorongosa)',unit:'years',ts:2,win:40,dt:0.05,scene:'savanna',axis:'What they eat (grass to tree leaves)',ax0:'grass',ax1:'tree leaves',sep:2.8,r:[0.3,0.28],K:[900,600],cnt:'animals',
    A:{n:'Waterbuck',c:'#8a5a32',sz:1,c0:0.18,note:'grazer: eats mostly grass'},B:{n:'Kudu',c:'#9b8b78',sz:1.05,c0:0.8,note:'browser: eats mostly leaves'},
    ex:'Gorongosa National Park, Mozambique: grazers and browsers split the plants between them'}
};
const cur=()=>BioLab.sims&&BioLab.sims.niche;
const scOf=s=>SC[(s&&s.p&&s.p.sc)||'gause1'];
const alpha=sep=>Math.exp(-sep*sep/4);
const centers=sim=>{const S=scOf(sim),m=(S.A.c0+S.B.c0)/2,d=sim.p.sep*W;return [clamp(m-d/2,0.06,0.94),clamp(m+d/2,0.06,0.94)];};
const nrm=(x,c)=>Math.exp(-(x-c)*(x-c)/(2*W*W));
/* realized use: each species avoids the zones the other one crowds */
function useCurve(sim,i,x){const [cA,cB]=centers(sim),st=sim.st,S=scOf(sim),p=sim.p;const own=nrm(x,i?cB:cA);
  if(p.grow!=='both')return own;const other=nrm(x,i?cA:cB),press=(i?st.N[0]/S.K[0]:st.N[1]/S.K[1]);return own*Math.max(0.04,1-0.75*clamp(press,0,1.2)*other);}
function outcome(sim){const S=scOf(sim),a=alpha(sim.p.sep),[KA,KB]=S.K;
  if(sim.p.grow!=='both')return 'Growing alone';
  if(a>=KB/KA)return S.B.n+' dies out';
  return 'Both survive';}

const NICHE={
  id:'niche',hash:'niche',apUnit:8,order:5,kind:'Simulation',tab:'Niche partitioning',
  card:'Put two species in the same habitat. If they need the same thing, one wins. If they split it up, both survive. See Gause’s Paramecium, warblers in a spruce and Gorongosa’s grazers.',
  title:'Competition and niche partitioning',
  lede:{bio:'Two species that need exactly the same thing in the same place can’t both last: the better competitor takes over. Species that split the resource, by eating different food or using different places, can live side by side.',
        honors:'A species’ fundamental niche is everything it could use alone. With a competitor around, it uses less: its realized niche. Watch the use curves shrink apart.',
        ap:'The Lotka–Volterra competition model: overlap sets the competition coefficient α, and coexistence needs α < K₂/K₁.'},
  scale:{bio:'The use curves are bell-shaped, all the same width. The first species listed is the stronger competitor: its habitat can hold more of it.'},
  get timeScale(){return scOf(cur()).ts;},
  get window(){return scOf(cur()).win;},
  get unit(){return scOf(cur()).unit;},
  get dtMax(){return scOf(cur()).dt;},
  sampleDt:0.2,prewarm:0,chChange:3,chReveal:20,
  clock(sim){const S=scOf(sim);return (S.unit==='days'?'Day ':'Year ')+Math.floor(sim.t);},
  controls:[
    {id:'sc',label:'Species',type:'select',def:'gause1',lvl:'bio',options:Object.entries(SC).map(([v,o])=>({v,l:o.l})),onChange(sim){BioLab.setValues(sim,{sep:SC[sim.p.sc].sep});BioLab.reset(sim);sync(sim);}},
    {id:'grow',label:'Grow',type:'seg',def:'both',lvl:'bio',options:[{v:'A',l:'First alone'},{v:'B',l:'Second alone'},{v:'both',l:'Together'}],onChange(sim){BioLab.reset(sim);}},
    {id:'sep',label:'How different their niches are',type:'range',min:0,max:4,step:0.05,def:0.15,d:2,unit:'',lvl:'bio',help:'0 = they use exactly the same food or place. Higher = they split it up more. Overlap is shown on the right.'},
  ],
  actions:[{id:'restart',label:'Start over',primary:true,run(sim){BioLab.reset(sim);}}],
  init(sim){const S=SC[sim.p.sc||'gause1'];const g=sim.p.grow||'both';return {N:[g==='B'?0:S.K[0]*0.04,g==='A'?0:S.K[1]*0.04],seed:5,out:null};},
  step(sim,dt){const st=sim.st,S=scOf(sim),a=alpha(sim.p.sep),[A,B]=st.N;
    const dA=S.r[0]*A*(1-(A+a*B)/S.K[0]),dB=S.r[1]*B*(1-(B+a*A)/S.K[1]);st.N[0]=Math.max(0,A+dA*dt);st.N[1]=Math.max(0,B+dB*dt);
    for(let i=0;i<2;i++)if(st.N[i]<S.K[i]*0.002&&st.N[i]>0&&sim.t>3)st.N[i]=0;},
  metrics:[
    {id:'popA',label:'First species',unit:'',lvl:'bio',min:0,max:1000,d:0,get:s=>s.st.N[0]},
    {id:'popB',label:'Second species',unit:'',lvl:'bio',min:0,max:1000,d:0,get:s=>s.st.N[1]},
    {id:'ov',label:'Niche overlap',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>100*alpha(s.p.sep)},
    {id:'out',label:'Where this is headed',unit:'',lvl:'bio',text:true,get:s=>outcome(s)},
    {id:'alpha',label:'Competition coefficient α',unit:'',lvl:'ap',min:0,max:1,d:2,get:s=>alpha(s.p.sep)},
    {id:'ratio',label:'Coexist if α is below K₂ ÷ K₁ =',unit:'',lvl:'ap',min:0,max:1,d:2,get:s=>{const K=scOf(s).K;return K[1]/K[0];}}
  ],
  graphs:[{id:'pops',label:'Both populations',lines:['popA','popB']}],
  defaultGraph:'pops',
  challenges:[
    {lvl:'bio',q:'Gause grew Paramecium aurelia and P. caudatum together in one tube, both eating the same bacteria. What happened to P. caudatum?',
     choices:['It died out','Both settled at half their usual numbers','It took over the tube'],correct:0,baseline:{sc:'gause1',grow:'both',sep:0.15},watch:'popB',at:1,reveal:22,
     explain:'P. caudatum died out within a few weeks. Both species needed the same food in the same place, and P. aurelia grows faster and packs in more tightly, so it got the bacteria first. This is the competitive exclusion principle: two species can’t share exactly the same niche for long.'},
    {lvl:'bio',q:'Now Gause pairs P. caudatum with green P. bursaria, which feeds on yeast near the bottom of the tube. What happens?',
     choices:['Both survive','P. bursaria dies out','P. caudatum dies out'],correct:0,baseline:{sc:'gause2',grow:'both',sep:2.6},watch:'popB',at:1,reveal:22,
     explain:'Both survive. P. caudatum eats bacteria floating near the top and P. bursaria eats yeast near the bottom, so they barely compete. Splitting up a resource this way is called resource partitioning.'},
    {lvl:'bio',instant:true,q:'Five kinds of warblers eat insects in the same spruce trees, yet all five live there. How?',choices:['Each hunts in a different part of the tree','They take turns year by year','There are always more than enough insects','They eat each other’s eggs'],correct:0,
     explain:'Robert MacArthur watched them in Maine in the 1950s: one hunts the treetop, another the middle near the trunk, another the lower branches. By splitting the tree into zones, they avoid competing head to head.'},
    {lvl:'honors',q:'Two warbler species that split a spruce tree are pushed to hunt in the same zone. Lower “How different their niches are” from 2.2 to 0.3. What happens?',
     choices:['The bay-breasted warbler dies out','Both keep the same numbers','Both die out'],correct:0,baseline:{sc:'warblers',grow:'both',sep:2.2},change:{sep:0.3},changeText:'Niches pushed together',watch:'popB',at:4,reveal:38,
     explain:'With almost the same niche, the overlap is about 98%, so they compete head to head. The Cape May warbler, the stronger competitor here, slowly pushes the bay-breasted warbler out. Separation keeps both.'},
    {lvl:'honors',instant:true,q:'A barnacle can live anywhere on a rocky shore when it is alone, but with a competitor around it survives only high on the rocks. What do we call its high-on-the-rocks range?',choices:['Its realized niche','Its fundamental niche','Its carrying capacity','Its trophic level'],correct:0,
     explain:'Its fundamental niche is everywhere it could live alone. Competition shrinks that to the realized niche, the part it actually holds. Joseph Connell showed this with barnacles in Scotland. Compare the dashed and solid curves when the species grow together.'},
    {lvl:'ap',instant:true,q:'In the competition model, species 1 has K₁ = 900 and species 2 has K₂ = 600. Species 2 survives only if α (the effect of species 1 on species 2) is below what?',choices:['0.67','1.5','0.33','1'],correct:0,
     explain:'Species 2 can grow when rare only if K₂ > αK₁, that is, α < K₂/K₁ = 600/900 = 0.67. More overlap than that and species 1 excludes it.'}
  ],
  initVis(sim){sync(sim);},
  onLevel(sim){sync(sim);},
  onTourExit(sim){BioLab.setValues(sim,{sc:'gause1',grow:'both',sep:0.15});},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const S=scOf(sim);
    if(S.scene==='tube')drawTube(sim,ctx,k,t);else if(S.scene==='tree')drawTree(sim,ctx,k,t);else drawSavanna(sim,ctx,k,t);
    drawPanel(sim,ctx,k);},
  narrate(sim){const S=scOf(sim),p=sim.p,st=sim.st,ov=Math.round(100*alpha(p.sep));
    if(p.grow==='A')return 'Alone, '+S.A.n+' uses its whole <b>fundamental niche</b>: everything it could use with no competition. It grows until it fills the habitat.';
    if(p.grow==='B')return 'Alone, '+S.B.n+' uses its whole <b>fundamental niche</b> and grows until it fills the habitat.';
    if(st.N[1]===0)return '<b>'+S.B.n+' has died out.</b> With '+ov+'% overlap, '+S.A.n+' took the resource first. Two species can’t share exactly the same niche for long: the <b>competitive exclusion principle</b>.';
    if(ov>=Math.round(100*S.K[1]/S.K[0]))return 'Their niches overlap <b>'+ov+'%</b>, so they compete head to head. Watch '+S.B.n+', the weaker competitor, decline.';
    return 'Their niches overlap only <b>'+ov+'%</b>. Each species mostly uses its own part of the resource, so <b>both survive</b>: resource partitioning.';},
  tour:[
    {title:'Same food, same place',text:'Gause put two Paramecium species in one tube with the same bacteria to eat. Watch the populations.',speed:1,setup(sim){BioLab.setValues(sim,{sc:'gause1',grow:'both',sep:0.15});}},
    {title:'One wins',text:'P. aurelia grows faster and takes the food first. P. caudatum dies out: competitive exclusion.',speed:1},
    {title:'Split the tube',text:'P. caudatum feeds near the top and P. bursaria near the bottom. They barely compete, so both survive.',speed:1,setup(sim){BioLab.setValues(sim,{sc:'gause2',grow:'both'});}},
    {title:'Split the tree',text:'Warblers share spruce trees by hunting in different zones: the treetop, the middle, the lower branches.',speed:1,setup(sim){BioLab.setValues(sim,{sc:'warblers',grow:'both'});}},
    {title:'Split the menu',text:'In Gorongosa, grazers eat grass and browsers eat leaves from trees and shrubs, so many large plant-eaters share one park.',speed:1,setup(sim){BioLab.setValues(sim,{sc:'grazers',grow:'both'});}}
  ],
  lab:{bio:'<p><b>Question:</b> How different do two species’ niches need to be for both to survive?</p><ol><li>Choose Paramecium: same food. Run with “How different their niches are” at 0, 0.5, 1, 1.5 and 2.</li><li>Record whether P. caudatum survives and its number after 30 days.</li></ol><p>Find the smallest difference that lets both survive.</p>',
       honors:'<p><b>Question:</b> How does a competitor change a species’ niche?</p><ol><li>Pick the warblers. Grow each species alone and sketch its use curve.</li><li>Grow them together and sketch the realized curves.</li></ol><p>Explain the difference between the fundamental and realized niche using your sketches.</p>',
       ap:'<p><b>Question:</b> Does the coexistence rule α &lt; K₂/K₁ predict the outcome?</p><ol><li>For each species pair, find K₂/K₁ from the readout.</li><li>Find the overlap where the second species stops surviving and compare it with K₂/K₁.</li></ol><p>Explain why the stronger competitor survives at every overlap.</p>'},
  terms:[{t:'Niche',d:'Everything a species needs and does: what it eats, where it lives, when it is active.'},{t:'Competitive exclusion principle',d:'Two species that need exactly the same resources in the same place can’t both last; one outcompetes the other.'},
    {t:'Resource partitioning',d:'Species sharing a resource by using different parts of it: different foods, places or times.'},{t:'Interspecific competition',d:'Competition between different species for the same limited resource.'},
    {lvl:'honors',t:'Fundamental niche',d:'Everything a species could use if it had no competitors.'},{lvl:'honors',t:'Realized niche',d:'The part of its fundamental niche a species actually uses when competitors are present.'},
    {lvl:'ap',t:'Competition coefficient (α)',d:'How much one individual of another species reduces growth, compared with one of your own species.'}],
  about:'<p><b>Model:</b> Lotka–Volterra competition, dNᵢ/dt = rᵢNᵢ(1 − (Nᵢ + αNⱼ)/Kᵢ), with the same α both ways. α comes from the overlap of two bell-shaped use curves of equal width w whose centers are d apart: α = exp(−d²/4w²). The slider is d/w.</p><p><b>Coexistence</b> needs α &lt; K₂/K₁ (the first species is the stronger competitor, with the larger K). The realized-niche curves are drawn by reducing each species’ use where the other is crowded; they illustrate the idea and do not feed back into α.</p><p><b>Sources:</b> G. F. Gause, <i>The Struggle for Existence</i> (1934); R. H. MacArthur, Ecology (1958), spruce warblers in Maine; HHMI BioInteractive and the Gorongosa Restoration Project on grazers and browsers. Growth rates and carrying capacities here are illustrative, chosen so the outcomes match the real ones.</p>'
};

function sync(sim){if(!sim.ui||!sim.ui.sec)return;const S=scOf(sim),d=sim.def,set=(id,l)=>{const t=sim.ui.tiles&&sim.ui.tiles[id];if(t){const e=t.num.closest('.tile').querySelector('.t-l');if(e)e.textContent=l;const u=t.num.closest('.tile').querySelector('.u');if(u)u.textContent=S.cnt;}};
  set('popA',S.A.n);set('popB',S.B.n);d.metrics.forEach(m=>{if(m.id==='popA'){m.label=S.A.n;m.unit=S.cnt;}if(m.id==='popB'){m.label=S.B.n;m.unit=S.cnt;}});}

/* individuals placed along the realized use curve (stable per individual) */
function place(sim,i,n){const pts=[],N=200,cdf=[];let sum=0;for(let j=0;j<N;j++){sum+=useCurve(sim,i,(j+0.5)/N);cdf.push(sum);}
  const r=rng(41+i*97);for(let m=0;m<n;m++){const u=r()*sum;let j=0;while(j<N-1&&cdf[j]<u)j++;pts.push([(j+0.5)/N,r(),r()]);}return pts;}
function counts(sim){const S=scOf(sim),st=sim.st;return [0,1].map(i=>Math.round(clamp(st.N[i]/S.K[0],0,1.2)*22));}

function drawTube(sim,ctx,k,t){const S=scOf(sim),X0=130,X1=290,Y0=70,Y1=420;
  // tube and medium (more oxygen at the top)
  const g=ctx.createLinearGradient(0,Y0,0,Y1);g.addColorStop(0,'#e3f1f7');g.addColorStop(1,sim.p.sc==='gause2'?'#d8d2b0':'#cfe3ea');ctx.fillStyle=g;rr(ctx,X0,Y0,X1-X0,Y1-Y0,18);ctx.fill();
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;rr(ctx,X0,Y0,X1-X0,Y1-Y0,18);ctx.stroke();
  txt(ctx,'more oxygen',X0-10,Y0+20,{s:11*k,a:'right',c:PAL['cv-soft']});txt(ctx,sim.p.sc==='gause2'?'yeast settles':'less oxygen',X0-10,Y1-12,{s:11*k,a:'right',c:PAL['cv-soft']});
  if(sim.p.sc==='gause2'){ctx.fillStyle='rgba(200,180,120,0.55)';for(let i=0;i<60;i++){const r=rng(i+3);ctx.beginPath();ctx.arc(X0+10+r()*(X1-X0-20),Y1-8-Math.pow(r(),2)*90,2,0,6.29);ctx.fill();}}
  const n=counts(sim),ph=RM?0:t;
  [0,1].forEach(i=>{const sp=i?S.B:S.A;if(sim.p.grow==='A'&&i===1||sim.p.grow==='B'&&i===0)return;place(sim,i,n[i]).forEach(([u,a,b],m)=>{const y=lerp(Y0+16,Y1-16,u)+Math.sin(ph*0.8+m)*4,x=X0+14+a*(X1-X0-28)+Math.sin(ph*0.6+m*1.7)*8;
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(ph*0.5+m)*0.6);const L=13*sp.sz,H=5.5*sp.sz;ctx.fillStyle=sp.c;ctx.beginPath();ctx.ellipse(0,0,L,H,0,0,6.29);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1;ctx.stroke();
      ctx.strokeStyle='rgba(0,0,0,.25)';for(let c=-2;c<=2;c++){ctx.beginPath();ctx.moveTo(c*L/3,-H);ctx.lineTo(c*L/3+2,-H-3);ctx.moveTo(c*L/3,H);ctx.lineTo(c*L/3+2,H+3);ctx.stroke();}ctx.restore();});});
  txt(ctx,S.ex,16,26,{s:12*k,w:700});txt(ctx,'Magnified: each Paramecium is about 0.1–0.3 mm long',16,44,{s:11*k,c:PAL['cv-soft']});}

function bird(ctx,x,y,c,k,dir,flap){ctx.save();ctx.translate(x,y);ctx.scale(dir,1);ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,9,5.5,-0.2,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(8,-4,4.2,0,6.29);ctx.fill();
  ctx.fillStyle='#333';ctx.beginPath();ctx.moveTo(12,-4);ctx.lineTo(17,-3);ctx.lineTo(12,-2);ctx.fill();ctx.beginPath();ctx.arc(9,-5,1,0,6.29);ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(-2,-1+flap,7,3,-0.3,0,6.29);ctx.fill();ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-8,1);ctx.lineTo(-16,4);ctx.lineTo(-8,4);ctx.fill();ctx.restore();}
function drawTree(sim,ctx,k,t){const S=scOf(sim),cx=255,top=62,bot=410,HW=138;
  ctx.fillStyle='#6b4a2a';ctx.fillRect(cx-8,top+20,16,bot-top+10);
  for(let i=0;i<9;i++){const y0=top+i*(bot-top)/9,y1=y0+(bot-top)/9+22,w0=HW*(i/9),w1=HW*((i+1)/9);ctx.fillStyle=i%2?'#2f5a34':'#2a5230';ctx.beginPath();ctx.moveTo(cx-w0-6,y0+6);ctx.lineTo(cx+w0+6,y0+6);ctx.lineTo(cx+w1+10,y1);ctx.lineTo(cx-w1-10,y1);ctx.closePath();ctx.fill();}
  ctx.fillStyle='#4b6a3a';ctx.fillRect(100,bot+18,300,12);
  const zones=[[0.2,'treetop'],[0.55,'middle'],[0.85,'lower branches']];zones.forEach(([u,l])=>txt(ctx,l,104,lerp(top,bot,u),{s:11*k,c:PAL['cv-soft'],a:'right'}));
  const n=counts(sim),ph=RM?0:t;
  [0,1].forEach(i=>{const sp=i?S.B:S.A;if(sim.p.grow==='A'&&i===1||sim.p.grow==='B'&&i===0)return;place(sim,i,n[i]).forEach(([u,a],m)=>{const y=lerp(top+14,bot-6,u),wy=HW*clamp((y-top)/(bot-top),0.05,1),x=cx+(a*2-1)*wy*0.85+Math.sin(ph*0.7+m)*5;
      bird(ctx,x,y+Math.sin(ph*1.3+m)*2,sp.c,k,a>0.5?-1:1,Math.sin(ph*9+m)*1.5);});});
  txt(ctx,S.ex,16,26,{s:12*k,w:700});}

function animal(ctx,x,y,sp,k,dir,kudu){ctx.save();ctx.translate(x,y);ctx.scale(dir*0.9*sp.sz,0.9*sp.sz);ctx.fillStyle=sp.c;ctx.strokeStyle=sp.c;ctx.lineWidth=3.5;
  ctx.beginPath();ctx.ellipse(0,0,20,10,0,0,6.29);ctx.fill();[-14,-8,9,15].forEach(lx=>{ctx.beginPath();ctx.moveTo(lx,6);ctx.lineTo(lx,24);ctx.stroke();});
  ctx.beginPath();ctx.moveTo(15,-4);ctx.lineTo(24,-20);ctx.lineTo(28,-17);ctx.lineTo(22,-1);ctx.fill();ctx.beginPath();ctx.ellipse(28,-20,7,4.5,0.3,0,6.29);ctx.fill();
  if(kudu){ctx.strokeStyle='#f4f0e6';ctx.lineWidth=1.5;[-10,-4,2,8].forEach(sx=>{ctx.beginPath();ctx.moveTo(sx,-9);ctx.lineTo(sx-1,6);ctx.stroke();});ctx.strokeStyle='#5a4a3a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(25,-24);ctx.bezierCurveTo(20,-36,30,-38,24,-48);ctx.stroke();}
  else{ctx.strokeStyle='#f4f0e6';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(-16,-1,7,-1.2,1.6);ctx.stroke();ctx.strokeStyle='#5a4a3a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(26,-24);ctx.quadraticCurveTo(20,-34,26,-40);ctx.stroke();}
  ctx.restore();}
function drawSavanna(sim,ctx,k,t){const S=scOf(sim),G=360;
  ctx.fillStyle='#e7d9a6';ctx.fillRect(10,90,390,G-90+50);ctx.fillStyle='#c9b56a';ctx.fillRect(10,G-20,390,70);
  for(let i=0;i<70;i++){const r=rng(i+9),x=14+r()*190,y=G-24+r()*60;ctx.strokeStyle='#8a9a3a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-2,y-10);ctx.moveTo(x,y);ctx.lineTo(x+3,y-9);ctx.stroke();}
  [[260,G-40,1],[330,G-60,1.2],[370,G-30,0.9],[230,G-70,0.8]].forEach(([x,y,s])=>{ctx.fillStyle='#6b4a2a';ctx.fillRect(x-3,y-40*s,6,40*s+30);ctx.fillStyle='#4f7a3a';ctx.beginPath();ctx.ellipse(x,y-44*s,34*s,16*s,0,0,6.29);ctx.fill();ctx.beginPath();ctx.ellipse(x-18*s,y-34*s,18*s,10*s,0,0,6.29);ctx.fill();});
  txt(ctx,'open grassland',90,G+46,{s:11*k,c:'#5a4a20',a:'center',w:700});txt(ctx,'trees and shrubs',310,G+46,{s:11*k,c:'#5a4a20',a:'center',w:700});
  const n=counts(sim),ph=RM?0:t;
  [0,1].forEach(i=>{const sp=i?S.B:S.A;if(sim.p.grow==='A'&&i===1||sim.p.grow==='B'&&i===0)return;place(sim,i,Math.ceil(n[i]*0.5)).forEach(([u,a,b],m)=>{const x=lerp(30,380,u)+Math.sin(ph*0.2+m)*6,y=G-60+b*80;animal(ctx,x,y,sp,k,a>0.5?1:-1,i===1);});});
  txt(ctx,S.ex,16,26,{s:12*k,w:700});txt(ctx,'Each animal shown stands for many',16,44,{s:11*k,c:PAL['cv-soft']});}

function drawPanel(sim,ctx,k){const S=scOf(sim),p=sim.p,X0=440,X1=780,Y0=96,Y1=250,hon=atLeast('honors');
  txt(ctx,'How each species uses the resource',X0,Y0-24,{s:13*k,w:700});
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X0,Y1);ctx.lineTo(X1,Y1);ctx.stroke();
  txt(ctx,S.ax0,X0,Y1+16,{s:11*k,c:PAL['cv-soft']});txt(ctx,S.ax1,X1,Y1+16,{s:11*k,c:PAL['cv-soft'],a:'right'});txt(ctx,S.axis,(X0+X1)/2,Y1+34,{s:11.5*k,w:700,a:'center'});
  const [cA,cB]=centers(sim),N=120,X=u=>lerp(X0,X1,u),H=Y1-Y0-8;
  // overlap shading (fundamental curves)
  ctx.fillStyle='rgba(123,63,228,0.28)';ctx.beginPath();ctx.moveTo(X0,Y1);for(let j=0;j<=N;j++){const u=j/N;ctx.lineTo(X(u),Y1-H*Math.min(nrm(u,cA),nrm(u,cB)));}ctx.lineTo(X1,Y1);ctx.closePath();ctx.fill();
  const both=p.grow==='both';
  [0,1].forEach(i=>{const sp=i?S.B:S.A,c=i?cB:cA;ctx.strokeStyle=sp.c;ctx.lineWidth=2;ctx.setLineDash(both&&hon?[5,4]:[]);ctx.beginPath();for(let j=0;j<=N;j++){const u=j/N,y=Y1-H*nrm(u,c);j?ctx.lineTo(X(u),y):ctx.moveTo(X(u),y);}ctx.stroke();ctx.setLineDash([]);
    if(both&&hon&&sim.st.N[i]>0.5){ctx.lineWidth=3.5;ctx.beginPath();for(let j=0;j<=N;j++){const u=j/N,y=Y1-H*useCurve(sim,i,u);j?ctx.lineTo(X(u),y):ctx.moveTo(X(u),y);}ctx.stroke();}});
  if(hon&&both)txt(ctx,'dashed = alone (fundamental)   solid = together (realized)',X0,Y0-8,{s:10.5*k,c:PAL['cv-soft']});
  pill(ctx,'Overlap '+Math.round(100*alpha(p.sep))+'%',X((cA+cB)/2),Y0+10,'#7b3fe4','#fff',12*k);
  // legend and counts
  const st=sim.st,ly=318;[0,1].forEach(i=>{const sp=i?S.B:S.A,y=ly+i*46,on=!(p.grow==='A'&&i===1||p.grow==='B'&&i===0),v=on?st.N[i]:0,bw=200*clamp(v/S.K[0],0,1);
    ctx.fillStyle=sp.c;rr(ctx,X0,y-12,14,14,3);ctx.fill();txt(ctx,sp.n,X0+20,y,{s:12.5*k,w:700});txt(ctx,sp.note,X0+20,y+15,{s:11*k,c:PAL['cv-soft']});
    ctx.fillStyle=PAL['cv-bench'];rr(ctx,X1-150,y-12,150,14,4);ctx.fill();ctx.fillStyle=sp.c;rr(ctx,X1-150,y-12,Math.max(0.1,150*clamp(v/S.K[0],0,1)),14,4);ctx.fill();
    txt(ctx,on?(v<0.5?'gone':Math.round(v)+' '+S.cnt):'not added',X1,y-17,{s:11.5*k,w:700,a:'right'});});
  const o=outcome(sim);if(!(sim.lnKey&&sim.lnKey!=='realized'))pill(ctx,o,(X0+X1)/2,ly+86,o==='Both survive'?'#1b7a3a':o==='Growing alone'?'#555':'#b3261e','#fff',13*k);}

BioLab.register(NICHE);
})();
