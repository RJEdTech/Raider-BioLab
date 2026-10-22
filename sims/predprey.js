(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,niceStep}=BioLab.h;

/* Rosenzweig–MacArthur predator–prey model.
   H = snowshoe hares (thousands per 100 km²), L = Canada lynx (per 100 km²), time in years.
   dH/dt = b·H·(1 − H/K) − f(H)·L + iH
   dL/dt = e·f(H)·L − m·L + iL
   f(H) = a·H / (1 + a·h·H)   (hares caught per lynx per year, in thousands; levels off when hares are plentiful) */
const A0=0.096,HT=2.06,E=3,IMM_H=0.02,IMM_L=0.1;
const aOf=p=>A0*p.hunt/100;
function deriv(p,H,L){const a=aOf(p),fr=a*H/(1+a*HT*H);return [p.b*H*(1-H/p.K)-fr*L+IMM_H,E*fr*L-p.m*L+IMM_L,fr];}
const fmtInt=n=>Math.round(n).toLocaleString('en-US');
function equilibrium(p){const a=aOf(p),den=a*(E-p.m*HT);if(den<=0)return null;const H=p.m/den;if(H>=p.K)return null;return {H,L:p.b*(1-H/p.K)*(1+a*HT*H)/a};}
function niceCeil(x){if(!(x>0))return 1;const p=Math.pow(10,Math.floor(Math.log10(x)));const m=x/p;return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p;}

const HARE='#a8855e',HARE_D='#6e5538',LYNX='#8a7a64',LYNX_D='#2b2622',TREE='#2f5d3a',TREE_D='#244a2e';
const HARE_PER_ICON=0.25,LYNX_PER_ICON=3,MAX_HARE_ICONS=80,MAX_LYNX_ICONS=27;

const PP={
  id:'predprey',hash:'predprey',apUnit:8,order:2,kind:'Simulation',tab:'Predators and prey',
  card:'Snowshoe hares and Canada lynx. Watch the boom-and-bust cycle, then trap, starve or reshape it.',
  title:'Predators and prey: hares and lynx',
  lede:{bio:'Lynx eat snowshoe hares. When hares are plentiful, lynx thrive. When lynx are plentiful, hares crash. Watch the two populations chase each other.',
        honors:'Hunting, births and the forest’s carrying capacity drive a roughly 10-year cycle. Change one factor at a time and see how the cycle responds.',
        ap:'A Rosenzweig–MacArthur predator–prey model. Read per-capita growth rates, trace the cycle on a phase plot, and test how equilibrium responds to carrying capacity.'},
  scale:'A 100 km² patch of boreal forest in northern Canada, about the size of 19,000 football fields. Each icon stands for many animals.',
  timeScale:1,dtMax:0.01,prewarm:40,sampleDt:0.1,window:40,unit:'years',timeLabel:'Year',clock:sim=>'Year '+Math.floor(sim.t),chChange:3,chReveal:20,
  controls:[
    {id:'b',label:'Hare birth rate',type:'range',min:1,max:4,step:0.1,def:2.2,unit:' /yr',lvl:'bio',help:'How fast hares multiply when food is plentiful'},
    {id:'hunt',label:'Lynx hunting success',type:'range',min:50,max:200,step:5,def:100,unit:'%',lvl:'bio',help:'100% is a typical lynx'},
    {id:'m',label:'Lynx death rate',type:'range',min:0.4,max:1.6,step:0.05,def:0.8,unit:' /yr',lvl:'bio',help:'How fast lynx die off when they can’t catch hares'},
    {id:'K',label:'Carrying capacity for hares',type:'range',min:8,max:30,step:1,def:20,unit:' thousand',lvl:'honors',help:'The most hares the forest’s food can support'}
  ],
  actions:[
    {id:'trap',label:'Trap half the lynx',lvl:'bio',run(sim){sim.st.L*=0.5;sim.vis.banner={t:'Trappers removed half of the lynx',life:2.5};}},
    {id:'winter',label:'Harsh winter',lvl:'honors',run(sim){sim.st.H*=0.6;sim.vis.banner={t:'Harsh winter: 40% of the hares died',life:2.5};}}
  ],
  init(){return {H:4,L:30,fr:0,dH:0,dL:0};},
  step(sim,dt){const p=sim.p,s=sim.st,f=(H,L)=>deriv(p,H,L);
    const k1=f(s.H,s.L),k2=f(s.H+dt/2*k1[0],s.L+dt/2*k1[1]),k3=f(s.H+dt/2*k2[0],s.L+dt/2*k2[1]),k4=f(s.H+dt*k3[0],s.L+dt*k3[1]);
    s.H=Math.max(0,s.H+dt/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]));s.L=Math.max(0,s.L+dt/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]));
    const d=deriv(p,s.H,s.L);s.dH=d[0];s.dL=d[1];s.fr=d[2];},
  metrics:[
    {id:'hares',label:'Snowshoe hares',unit:'/100 km²',lvl:'bio',min:0,max:30000,d:0,get:s=>Math.round(s.st.H*1000)},
    {id:'lynx',label:'Canada lynx',unit:'/100 km²',lvl:'bio',min:0,max:80,d:0,get:s=>s.st.L},
    {id:'ratio',label:'Hares per lynx',unit:'',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.L>0.5?s.st.H*1000/s.st.L:NaN},
    {id:'eaten',label:'Hares eaten per lynx',unit:'per year',lvl:'honors',min:0,max:500,d:0,get:s=>s.st.fr*1000},
    {id:'hrate',label:'Hare growth rate',unit:'per year',lvl:'ap',min:-3,max:3,d:2,get:s=>s.st.H>0.01?s.st.dH/s.st.H:NaN},
    {id:'lrate',label:'Lynx growth rate',unit:'per year',lvl:'ap',min:-1.5,max:1.5,d:2,get:s=>s.st.L>0.05?s.st.dL/s.st.L:NaN}
  ],
  graphs:[
    {id:'pop',label:'Hares and lynx',custom:true},
    {id:'hares',label:'Hares only',lines:['hares']},
    {id:'lynx',label:'Lynx only',lines:['lynx']},
    {id:'phase',label:'Phase plot (hares vs. lynx)',lvl:'ap',custom:true}
  ],
  defaultGraph:'pop',
  plot(sim,ctx,box,id){
    const win=sim.def.window,xmax=Math.max(win,sim.t),xmin=xmax-win,rows=sim.hist.filter(r=>r.t>=xmin-1e-9);
    if(id==='pop'){
      const Hs=rows.map(r=>r.v.hares/1000),Ls=rows.map(r=>r.v.lynx);
      const nT=4,sH=niceCeil(Math.max(...Hs,1)*1.05/nT),sL=niceCeil(Math.max(...Ls,1)*1.05/nT);
      const L=box.L,T=box.T,W=box.W-30,Hh=box.H,X=x=>L+(x-xmin)/(xmax-xmin)*W,YH=v=>T+Hh-v/(sH*nT)*Hh,YL=v=>T+Hh-v/(sL*nT)*Hh;
      ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;
      for(let k=0;k<=nT;k++){const y=Math.round(T+Hh-k/nT*Hh)+.5;ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(L+W,y);ctx.stroke();
        txt(ctx,String(+(k*sH).toFixed(1)),L-8,y,{s:13,c:serColor(1),a:'right',b:'middle',w:600});txt(ctx,String(+(k*sL).toFixed(1)),L+W+6,y,{s:13,c:serColor(0),a:'left',b:'middle',w:600});}
      const xs=niceStep(xmax-xmin,6);for(let x=Math.ceil(xmin/xs)*xs;x<=xmax+1e-9;x+=xs){const px=Math.round(X(x))+.5;ctx.beginPath();ctx.moveTo(px,T);ctx.lineTo(px,T+Hh);ctx.stroke();txt(ctx,x.toFixed(0),px,T+Hh+16,{s:13,c:PAL['g-axis'],a:'center'});}
      ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(L+.5,T);ctx.lineTo(L+.5,T+Hh);ctx.lineTo(L+W,T+Hh+.5);ctx.stroke();
      txt(ctx,'Year',L+W/2,box.ch-4,{s:13,c:PAL['muted'],a:'center'});
      ctx.save();ctx.translate(14,T+Hh/2);ctx.rotate(-Math.PI/2);txt(ctx,'Hares (thousands)',0,0,{s:13,c:serColor(1),a:'center',b:'middle',w:600});ctx.restore();
      const line=(vals,Y,col)=>{if(rows.length<2)return;ctx.beginPath();rows.forEach((r,i)=>{const x=X(r.t),y=Y(vals[i]);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.stroke();
        ctx.fillStyle=col;ctx.beginPath();ctx.arc(X(rows[rows.length-1].t),Y(vals[vals.length-1]),4.5,0,6.29);ctx.fill();};
      ctx.save();ctx.beginPath();ctx.rect(L,T-2,W,Hh+4);ctx.clip();line(Hs,YH,serColor(1));line(Ls,YL,serColor(0));ctx.restore();
      legend(ctx,L+12,T+10,[{label:'Hares (left axis)',color:serColor(1)},{label:'Lynx (right axis)',color:serColor(0)}]);
      return;}
    // phase plot
    const Hs=rows.map(r=>r.v.hares/1000),Ls=rows.map(r=>r.v.lynx);
    const ax=axes(ctx,box,{xmin:0,xmax:niceCeil(Math.max(sim.p.K,...Hs)*1.05),ymin:0,ymax:niceCeil(Math.max(...Ls,10)*1.1),xl:'Hares (thousands per 100 km²)',yl:'Lynx (per 100 km²)'});
    const eq=equilibrium(sim.p);
    if(eq){const ex=ax.X(eq.H),ey=ax.Y(eq.L);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ex-6,ey-6);ctx.lineTo(ex+6,ey+6);ctx.moveTo(ex+6,ey-6);ctx.lineTo(ex-6,ey+6);ctx.stroke();txt(ctx,'balance point',ex+9,ey-8,{s:12,c:PAL['muted']});}
    if(rows.length>1){const n=rows.length;for(let i=1;i<n;i++){ctx.globalAlpha=0.15+0.85*i/n;ctx.strokeStyle=serColor(4);ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(ax.X(Hs[i-1]),ax.Y(Ls[i-1]));ctx.lineTo(ax.X(Hs[i]),ax.Y(Ls[i]));ctx.stroke();}
      ctx.globalAlpha=1;const x1=ax.X(Hs[n-1]),y1=ax.Y(Ls[n-1]),j=Math.max(0,n-6),x0=ax.X(Hs[j]),y0=ax.Y(Ls[j]),an=Math.atan2(y1-y0,x1-x0);
      ctx.fillStyle=serColor(4);ctx.beginPath();ctx.moveTo(x1+Math.cos(an)*9,y1+Math.sin(an)*9);ctx.lineTo(x1+Math.cos(an+2.5)*9,y1+Math.sin(an+2.5)*9);ctx.lineTo(x1+Math.cos(an-2.5)*9,y1+Math.sin(an-2.5)*9);ctx.closePath();ctx.fill();}
  },
  challenges:[
    {lvl:'bio',q:'Watch one full cycle on the graph. Which population peaks first?',
     choices:['Hares peak first, then lynx','Lynx peak first, then hares','They peak at the same time'],correct:0,
     changeText:'Watching the next cycle',watch:'pop',at:0,reveal:14,
     explain:{bio:'Hares peak first. Lynx need plenty of hares before they can raise lots of kittens, so lynx numbers climb a few years later. Then the extra lynx drive the hares down, and the lynx crash after them.',
              ap:'The predator lags the prey by roughly a quarter of the cycle. Lynx growth depends on how many hares there are now, so lynx keep rising until hares fall below the level that keeps lynx births ahead of deaths.'}},
    {lvl:'bio',q:'A disease makes lynx die faster (death rate from 0.8 to 1.1 per year). What happens to the hares in the long run?',
     choices:['Hares settle at a higher number, and the boom-and-bust cycle fades','Hares go extinct','Nothing changes'],correct:0,
     change:{m:1.1},changeText:'Lynx death rate raised to 1.1 per year',watch:'pop',at:3,reveal:28,
     explain:{bio:'With lynx dying faster, there are fewer hunters. Hares level off at a higher number, about 15,000, and the big swings die out. Predators control how many prey a forest has.',
              ap:'Raising m raises the prey equilibrium H* = m / (a(e − m·h)). Here H* climbs from about 6,200 to about 15,300 hares, far enough from the carrying capacity that the cycle damps out to a steady state.'}},
    {lvl:'honors',q:'A harsh winter kills 40% of the hares just as lynx are increasing. Lynx usually peak at about 49 per 100 km². How high will this lynx peak get?',
     choices:['Higher than usual','Lower than usual','About the same'],correct:1,
     changeAction:'winter',changeText:'Harsh winter: 40% of hares died',watch:'pop',at:2,reveal:9,
     explain:{honors:'Fewer hares means less food for lynx, so fewer kittens survive. The lynx peak tops out near 39 instead of 49. The effect shows up in the predator a year or two later.'}},
    {lvl:'honors',q:'Lynx become better hunters (hunting success from 100% to 150%). What happens to the cycle?',
     choices:['The swings get bigger, and hares crash to much lower numbers','Lynx eat every hare and both die out','The cycle gets smaller and calmer'],correct:0,
     change:{hunt:150},changeText:'Hunting success raised to 150%',watch:'pop',at:3,reveal:30,
     explain:{honors:'Better hunters knock hares down faster and further. Hares drop to around 100 per 100 km² at the low point, and the peaks get taller too. A few survivors and newcomers let the hares recover each time, so the cycle continues, just more violently.'}},
    {lvl:'ap',q:'The forest is steady at about 6,100 hares and 25 lynx. You raise the carrying capacity from 12,000 to 16,000 hares. Where do the populations settle?',
     choices:['Hares settle higher; lynx stay the same','Hares stay about the same; lynx settle higher','Both stay the same'],correct:1,
     baseline:{K:12},change:{K:16},changeText:'Carrying capacity raised to 16,000 hares',watch:'pop',at:3,reveal:30,
     explain:{ap:'The prey equilibrium H* = m / (a(e − m·h)) does not depend on K. Hares settle where lynx births exactly balance lynx deaths. The extra food goes into supporting more lynx, which rise from about 25 to about 31. Enrich the system more and it starts to cycle: the paradox of enrichment.'}},
    {lvl:'ap',q:'On the phase plot (hares on the x-axis, lynx on the y-axis), which way does the loop run?',
     choices:['Counterclockwise','Clockwise','Back and forth along a straight line'],correct:0,
     changeText:'Tracing the phase plot',watch:'phase',at:0,reveal:12,
     explain:{ap:'Hares rise while lynx are low (moving right along the bottom). Then lynx rise (up the right side), hares fall (left across the top), and lynx fall (down the left side). That is counterclockwise around the balance point, the signature of a predator lagging its prey.'}}
  ],
  narrate(sim){const s=sim.st,p=sim.p,hon=atLeast('honors'),hr=s.H>0.01?s.dH/s.H:0,lr=s.L>0.05?s.dL/s.L:0;
    const tail=hon?' Each lynx is catching about <b>'+fmtInt(s.fr*1000)+' hares a year</b>.':'';
    if(s.L<1.5)return '<b>Almost no lynx.</b> Hares multiply until they run short of food at the carrying capacity.'+tail;
    if(Math.abs(hr)<0.03&&Math.abs(lr)<0.03)return '<b>Births and deaths balance.</b> Hares hold at about '+fmtInt(s.H*1000)+' and lynx at about '+Math.round(s.L)+'.'+tail;
    if(hr>0&&lr<=0)return '<b>Hares are booming.</b> Lynx are still scarce after the last crash, so most young hares survive.'+tail;
    if(hr>0&&lr>0)return '<b>Both are rising.</b> Plenty of hares means well-fed lynx that raise lots of kittens.'+tail;
    if(hr<=0&&lr>0)return '<b>Hares are crashing.</b> There are now so many lynx that they eat hares faster than hares can reproduce.'+tail;
    return '<b>Lynx are starving.</b> Hares are scarce, so lynx raise few kittens and many die. The lynx crash follows the hare crash.'+tail;},
  tour:[
    {title:'The players',text:'Snowshoe hares eat twigs and bark. Canada lynx eat mostly hares, which make up about three-quarters of their diet. Each brown hare icon stands for 250 hares, and each gray lynx icon for 3 lynx.',focus:[0,190,800,260],speed:0.25},
    {title:'Hares multiply',text:'Lynx are scarce right now, so hares have plenty of young and few get caught. Watch the hare count climb.',focus:[520,8,272,30],speed:0.4,setup(sim){BioLab.reset(sim);sim.st.H=2.5;sim.st.L=19;}},
    {title:'Lynx catch up',text:'Now there are lots of hares to catch. Well-fed lynx raise more kittens, so lynx numbers climb, a couple of years behind the hares.',focus:[520,38,272,30],speed:0.4,setup(sim){sim.st.H=12.5;sim.st.L=30;}},
    {title:'Too many hunters',text:'So many lynx are hunting that hares are eaten faster than they can reproduce. Watch the lynx chase down hares: the hare population crashes.',focus:[0,190,800,260],speed:0.25,setup(sim){sim.st.H=9;sim.st.L=46;}},
    {title:'Lynx go hungry',text:'Hares are now scarce. Lynx starve and raise few kittens, so the lynx population crashes too, after the hares.',focus:[520,38,272,30],speed:0.4,setup(sim){sim.st.H=2.2;sim.st.L=35;}},
    {title:'Around again',text:'With few lynx left, hares recover and the cycle starts over, about every 10 years. Fur-trading records from the Hudson’s Bay Company show this cycle going back to the 1800s.',speed:1},
    {lvl:'honors',title:'Food limits hares too',text:'Even with almost no lynx, hares can’t grow forever. The forest only has so much food, so hares level off at the carrying capacity.',focus:[0,190,800,260],speed:1.5,setup(sim){sim.st.H=5;sim.st.L=0.3;}},
    {lvl:'ap',title:'The phase plot',text:'Switch the graph to <b>Phase plot</b>. Plotting lynx against hares turns the two waves into one loop around the balance point, where both populations would stay steady.',speed:1,setup(sim){BioLab.reset(sim);}}
  ],
  onTourExit(sim){BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> How does lynx hunting success affect the hare population?</p><ol><li>Set hunting success to 50%. Let the sim run 20 years, then pause at a hare peak and record a trial. Pause at the next hare low and record again.</li><li>Repeat at 100% and 150%.</li><li>Compare the highest and lowest hare numbers at each setting.</li></ol><p>Write a claim about how better hunters change the hare cycle, using numbers from your table.</p>',
       honors:'<p><b>Question:</b> How does the forest’s carrying capacity affect the cycle?</p><ol><li>Record the hare and lynx peaks and lows over one full cycle at carrying capacities of 12, 16, 20 and 26 thousand.</li><li>Note at which settings the populations settle to steady numbers instead of cycling.</li></ol><p>Explain why more food for hares can make the cycle swing harder.</p>',
       ap:'<p><b>Question:</b> How do the equilibrium populations depend on K and on the lynx death rate?</p><ol><li>Use settings where the system settles (for example K = 12). Record the steady hare and lynx numbers for K = 10, 12, 14 and 16.</li><li>Repeat while varying the lynx death rate from 0.6 to 1.0.</li><li>Compare with H* = m / (a(e − m·h)).</li></ol><p><b>Claim–evidence–reasoning:</b> Explain which parameters set the prey equilibrium and which set the predator equilibrium.</p>'},
  terms:[{t:'Predator',d:'An animal that hunts and eats other animals.'},{t:'Prey',d:'An animal that is hunted and eaten.'},{t:'Population cycle',d:'A regular rise and fall in numbers that repeats over time.'},
    {lvl:'honors',t:'Carrying capacity',d:'The largest population the environment’s resources can support.'},{lvl:'honors',t:'Density-dependent factor',d:'Something, like predation or food shortage, whose effect gets stronger as a population gets denser.'},{lvl:'honors',t:'Lag',d:'The delay between a change in prey and the predator’s response.'},
    {lvl:'ap',t:'Functional response',d:'How a predator’s kill rate changes with prey density. It levels off because handling each prey takes time.'},{lvl:'ap',t:'Equilibrium',d:'Population sizes where births and deaths balance for both species.'},{lvl:'ap',t:'Phase plot',d:'Predator numbers plotted against prey numbers, showing the cycle as a loop.'},{lvl:'ap',t:'Paradox of enrichment',d:'Raising the prey’s carrying capacity can turn a steady system into a cycling, unstable one.'}],
  about:'<p>This uses the Rosenzweig–MacArthur model, a Lotka–Volterra model with two upgrades: hares grow logistically toward a carrying capacity K, and each lynx’s kill rate levels off when hares are plentiful.</p><p>dH/dt = b·H(1 − H/K) − f(H)·L and dL/dt = e·f(H)·L − m·L, where f(H) = aH/(1 + a·h·H). The settings are: handling time h ≈ 2 days per hare, e = 3 lynx born per 1,000 hares eaten, and a = 0.096 × hunting success.</p><p>Simplifications: no seasons, ages or space. A trickle of migrants (20 hares and 0.1 lynx per year) keeps either species from hitting exactly zero. Real snowshoe hares also turn white in winter; they are drawn brown here so they stand out against the snow. Real cycles last about 10 years, with lynx lagging hares by 1–2 years. This model gives about 10 years with a 3-year lag.</p>',
  initVis(sim){const r=rng(41),v=sim.vis;v.trees=[];for(let i=0;i<26;i++)v.trees.push({x:r()*820-10,y:150+r()*48,s:0.7+r()*0.6});v.trees.sort((a,b)=>a.y-b.y);
    v.fg=[[30,430,1.4],[770,440,1.5],[410,445,1.2]];v.hares=[];v.lynx=[];v.puffs=[];v.kAcc=0;v.r=r;v.banner=v.banner||null;},
  thumbSetup(sim){sim.st.H=9;sim.st.L=40;},
  draw(sim,ctx,vdt,k,t){
    const s=sim.st,v=sim.vis,R=Math.random,hon=atLeast('honors');
    // sky + snowy ground
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    ctx.fillStyle=PAL['cv-bg2'];ctx.beginPath();ctx.moveTo(0,190);ctx.quadraticCurveTo(200,170,400,186);ctx.quadraticCurveTo(620,200,800,178);ctx.lineTo(800,450);ctx.lineTo(0,450);ctx.closePath();ctx.fill();
    const tree=(x,y,sc)=>{ctx.fillStyle='#5a4130';ctx.fillRect(x-2*sc,y-6*sc,4*sc,10*sc);for(let i=0;i<3;i++){const w=(22-i*5)*sc,yy=y-6*sc-i*13*sc;ctx.fillStyle=i%2?TREE:TREE_D;ctx.beginPath();ctx.moveTo(x-w,yy);ctx.lineTo(x,yy-24*sc);ctx.lineTo(x+w,yy);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.moveTo(x-w*0.5,yy-12*sc);ctx.lineTo(x,yy-24*sc);ctx.lineTo(x+w*0.5,yy-12*sc);ctx.closePath();ctx.fill();}};
    v.trees.forEach(tr=>tree(tr.x,tr.y,tr.s));
    // populations -> icons
    const nH=Math.min(MAX_HARE_ICONS,Math.round(s.H/HARE_PER_ICON)),nL=Math.min(MAX_LYNX_ICONS,Math.round(s.L/LYNX_PER_ICON));
    const spot=()=>({x:20+R()*760,y:215+R()*215});
    while(v.hares.filter(h=>!h.dead).length<nH){const near=v.hares.length&&R()<0.8?v.hares[Math.floor(R()*v.hares.length)]:null;const p0=near?{x:clamp(near.x+R()*40-20,15,785),y:clamp(near.y+R()*30-15,212,432)}:spot();
      v.hares.push({x:p0.x,y:p0.y,tx:p0.x,ty:p0.y,hop:R()*2,born:near?0.6:0,dir:R()<.5?-1:1});}
    let live=v.hares.filter(h=>!h.dead);while(live.length>nH){const h=live.pop();h.dead=true;h.fade=0.6;}
    while(v.lynx.filter(l=>!l.dead).length<nL){const p0=spot();v.lynx.push({x:p0.x,y:p0.y,tx:p0.x,ty:p0.y,born:0.8,dir:1,hunt:null,eat:0,wait:R()*2});}
    let liveL=v.lynx.filter(l=>!l.dead);while(liveL.length>nL){const l=liveL.pop();l.dead=true;l.fade=1;}
    // hunting events in proportion to the model's kill rate (thousand hares per year)
    const yrs=vdt*sim.def.timeScale;v.kAcc+=s.fr*s.L*yrs/HARE_PER_ICON*0.18;
    while(v.kAcc>=1){v.kAcc--;const hunters=v.lynx.filter(l=>!l.dead&&!l.hunt&&l.eat<=0),prey=v.hares.filter(h=>!h.dead&&!h.target);if(!hunters.length||!prey.length){v.kAcc=Math.min(v.kAcc,2);break;}
      const L0=hunters[Math.floor(R()*hunters.length)];let best=prey[0],bd=1e9;prey.forEach(h=>{const d=Math.hypot(h.x-L0.x,h.y-L0.y);if(d<bd){bd=d;best=h;}});L0.hunt=best;best.target=true;}
    // move hares (hopping) and lynx (prowling / pouncing)
    const sp=RM?0.5:1;
    for(const h of v.hares){if(h.dead){h.fade-=vdt;continue;}h.hop-=vdt;if(h.hop<=0){h.hop=0.6+R()*1.6;h.tx=clamp(h.x+R()*70-35,15,785);h.ty=clamp(h.y+R()*40-20,212,432);h.dir=h.tx<h.x?-1:1;}
      if(h.target){h.tx=clamp(h.x+(h.x-400)*0.02,15,785);}h.x+=(h.tx-h.x)*Math.min(1,vdt*4*sp);h.y+=(h.ty-h.y)*Math.min(1,vdt*4*sp);if(h.born>0)h.born-=vdt;}
    for(const l of v.lynx){if(l.dead){l.fade-=vdt*0.8;continue;}if(l.born>0)l.born-=vdt;if(l.eat>0){l.eat-=vdt;continue;}
      if(l.hunt){const h=l.hunt;if(h.dead){l.hunt=null;continue;}const dx=h.x-l.x,dy=h.y-l.y,d=Math.hypot(dx,dy);l.dir=dx<0?-1:1;const step=260*vdt*sp;
        if(d<=step+6){h.dead=true;h.fade=0;v.puffs.push({x:h.x,y:h.y,life:0.7});l.hunt=null;l.eat=0.7;}else{l.x+=dx/d*step;l.y+=dy/d*step;}continue;}
      l.wait-=vdt;if(l.wait<=0){l.wait=1+R()*2.5;l.tx=clamp(l.x+R()*160-80,20,780);l.ty=clamp(l.y+R()*60-30,214,430);}const dx=l.tx-l.x;if(Math.abs(dx)>1)l.dir=dx<0?-1:1;l.x+=dx*Math.min(1,vdt*0.9*sp);l.y+=(l.ty-l.y)*Math.min(1,vdt*0.9*sp);}
    v.hares=v.hares.filter(h=>!h.dead||h.fade>0);v.lynx=v.lynx.filter(l=>!l.dead||l.fade>0);
    // draw animals, back to front
    const drawHare=(h)=>{const sc=h.born>0?1-h.born*0.8:1,a=h.dead?clamp(h.fade/0.6,0,1):1,bob=RM?0:Math.max(0,Math.sin(h.hop*9))*3;ctx.save();ctx.globalAlpha=a;ctx.translate(h.x,h.y-bob);ctx.scale(h.dir*sc,sc);
      ctx.fillStyle=HARE;ctx.beginPath();ctx.ellipse(0,0,9,6,0,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(7,-4,4.2,0,6.29);ctx.fill();
      ctx.beginPath();ctx.ellipse(6,-11,1.8,5.5,-0.25,0,6.29);ctx.fill();ctx.beginPath();ctx.ellipse(9,-11,1.8,5.5,0.2,0,6.29);ctx.fill();
      ctx.fillStyle='#f4efe6';ctx.beginPath();ctx.arc(-9,-1,2.6,0,6.29);ctx.fill();ctx.fillStyle=HARE_D;ctx.beginPath();ctx.arc(9,-4.5,1,0,6.29);ctx.fill();ctx.fillRect(-6,4,9,2.2);ctx.restore();};
    const drawLynx=(l)=>{const sc=l.born>0?1-l.born*0.6:1,a=l.dead?clamp(l.fade,0,1):1;ctx.save();ctx.globalAlpha=a;ctx.translate(l.x,l.y);ctx.scale(l.dir*sc*1.25,sc*1.25);
      ctx.fillStyle=LYNX;ctx.fillRect(-12,2,3,8);ctx.fillRect(-6,3,3,7);ctx.fillRect(5,3,3,7);ctx.fillRect(10,2,3,8);
      ctx.beginPath();ctx.ellipse(0,-1,15,7.5,0,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(15,-7,6.5,0,6.29);ctx.fill();
      ctx.beginPath();ctx.moveTo(11,-11);ctx.lineTo(12.5,-19);ctx.lineTo(15,-12);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(16,-12);ctx.lineTo(19,-19);ctx.lineTo(20,-10);ctx.closePath();ctx.fill();
      ctx.strokeStyle=LYNX_D;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(12.5,-19);ctx.lineTo(12.5,-23);ctx.moveTo(19,-19);ctx.lineTo(19.5,-23);ctx.stroke();
      ctx.fillStyle=LYNX_D;ctx.beginPath();ctx.arc(-15,-3,2.6,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(18,-8,1.1,0,6.29);ctx.fill();
      ctx.strokeStyle=LYNX_D;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(14,-3);ctx.lineTo(20,-1);ctx.stroke();
      if(l.eat>0){ctx.fillStyle=HARE;ctx.beginPath();ctx.ellipse(22,-3,5,3,0,0,6.29);ctx.fill();}ctx.restore();};
    const all=[...v.hares.map(h=>({y:h.y,f:()=>drawHare(h)})),...v.lynx.map(l=>({y:l.y,f:()=>drawLynx(l)}))].sort((a,b)=>a.y-b.y);all.forEach(o=>o.f());
    for(const pf of v.puffs){pf.life-=vdt;const a=clamp(pf.life/0.7,0,1);ctx.strokeStyle='rgba(211,47,47,'+a+')';ctx.lineWidth=2;for(let i=0;i<6;i++){const an=i*1.047,r0=6+(1-a)*10;ctx.beginPath();ctx.moveTo(pf.x+Math.cos(an)*r0*0.5,pf.y+Math.sin(an)*r0*0.5);ctx.lineTo(pf.x+Math.cos(an)*r0,pf.y+Math.sin(an)*r0);ctx.stroke();}}
    v.puffs=v.puffs.filter(p=>p.life>0);
    v.fg.forEach(f=>tree(f[0],f[1],f[2]));
    // counters (top right)
    const meter=(y,label,val,max,col)=>{rr(ctx,522,y,268,26,6);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
      ctx.fillStyle=col;ctx.globalAlpha=0.3;rr(ctx,523,y+1,Math.max(0,266*clamp(val/max,0,1)),24,6);ctx.fill();ctx.globalAlpha=1;
      txt(ctx,label,532,y+14,{s:13*Math.min(k,1.3),w:700,b:'middle'});txt(ctx,fmtInt(val),780,y+14,{s:13*Math.min(k,1.3),w:700,a:'right',b:'middle'});};
    meter(10,'Hares',s.H*1000,Math.max(30000,s.H*1000),serColor(1));meter(40,'Lynx',s.L,80,serColor(0));
    txt(ctx,'Year '+Math.floor(sim.t),16,26,{s:15*Math.min(k,1.3),w:700});
    txt(ctx,'per 100 km² of forest',16,46,{s:12*Math.min(k,1.3),c:PAL['cv-soft']});
    // key
    const ks=Math.min(k,1.3);ctx.font='400 '+12*ks+'px '+FONT;const w1=ctx.measureText('= 250 hares').width,w2=ctx.measureText('= 3 lynx').width;
    rr(ctx,12,62,24+w1+52+w2+12,30,6);ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.88;ctx.fill();ctx.globalAlpha=1;
    drawHare({x:26,y:80,dir:1,born:0,hop:0});txt(ctx,'= 250 hares',38,82,{s:12*ks,c:PAL['cv-ink']});
    const lx=38+w1+26;drawLynx({x:lx,y:83,dir:1,born:0,eat:0});txt(ctx,'= 3 lynx',lx+30,82,{s:12*ks,c:PAL['cv-ink']});
    if(v.banner&&v.banner.life>0){v.banner.life-=vdt||0.016;pill(ctx,v.banner.t,400,120,'#b3261e','#fff',14*Math.min(k,1.3));}
  }
};
BioLab.register(PP);
})();
