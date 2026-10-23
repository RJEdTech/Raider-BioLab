(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,lvText,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;

/* "Let's Go Fishing": four fleets share one lake. Each season the fish regrow
   logistically (with a mild Allee effect, so a crashed stock recovers slowly), then the fleets fish. */
const K=10000,A=400,PRICE=10,COST=1500,START=8000;
const FLEETS=[{n:'You',hn:'You',col:'#C11430'},{n:'Fleet B',hn:'Blue Gill Co.',col:'#2d6bd2'},{n:'Fleet C',hn:'Lakeview Fishers',col:'#1b8a4a'},{n:'Fleet D',hn:'North Shore Nets',col:'#c27a00'}];
function growth(F,r){return F<=0?0:r*F*(1-F/K)*(F/(F+A));}
function msy(r){let best=0,bf=0;for(let F=0;F<=K;F+=25){const g=growth(F,r);if(g>best){best=g;bf=F;}}return {y:best,F:bf};}
function seasonTick(sim){const s=sim.st,p=sim.p,F=s.F,g=growth(F,p.r);
  const avail=F+g;let want=[p.catch];for(let i=1;i<4;i++)want.push(p.others==='greedy'?0.15*avail:0.04*avail);
  want=want.map(w=>Math.min(w,0.45*avail));
  if(p.quota){const cap=p.quotaAmt/4;want=want.map(w=>Math.min(w,cap));}
  let tot=want.reduce((a,b)=>a+b,0);if(tot>avail*0.95){const k=avail*0.95/tot;want=want.map(w=>w*k);tot=avail*0.95;}
  s.F=Math.max(0,avail-tot);s.lastG=g;s.catches=want;s.lastTotal=tot;s.season++;
  want.forEach((c,i)=>{const prof=c>0?PRICE*c-COST:0;s.profit[i]+=prof;});
  s.events.push({caught:want.slice(),born:g});}
function status(F){if(F<0.05*K)return 'Collapsed';if(F<0.3*K)return 'Overfished';if(F<0.5*K)return 'Under pressure';return 'Healthy';}
const fleetName=i=>atLeast('honors')?FLEETS[i].hn:FLEETS[i].n;

const COM={
  id:'commons',hash:'commons',apUnit:13,order:1,tab:'Tragedy of the commons',kind:'Simulation',prereq:['popgrowth'],
  card:'Four fishing fleets share one lake. Can everyone keep fishing, or does the lake collapse?',
  title:'Tragedy of the commons: the fishing game',
  lede:{bio:'Four fleets fish the same lake. Each wants a big catch, but the fish have to reproduce to keep the lake going. Choose your catch each season and see what happens.',
        honors:'Test how one greedy fleet, or all of them, can wreck a shared resource, and whether quotas and catch shares can save it.',
        ap:'Find the maximum sustainable yield from the logistic growth curve and compare quotas set below, at and above it.'},
  scale:'Real scale: a lake of about 2 km² holding up to 10,000 adult fish. One season is one year.',
  timeScale:0.5,dtMax:0.05,prewarm:0,sampleDt:0.25,window:40,unit:'seasons',timeLabel:'Time',chChange:2,chReveal:22,
  clock(sim){return 'Season '+(sim.st.season+1);},
  controls:[
    {id:'catch',label:'Your catch per season',type:'range',min:0,max:1500,step:50,def:300,unit:' fish',lvl:'bio',help:'How many fish your fleet tries to land each season.'},
    {id:'others',label:'The other three fleets',type:'seg',def:'cautious',lvl:'bio',options:[{v:'cautious',l:'Cautious'},{v:'greedy',l:'Greedy'}],help:'Cautious fleets each take 4% of the fish. Greedy fleets each take 15%.'},
    {id:'quota',label:'Total catch quota',type:'toggle',def:false,lvl:'honors',help:'A shared limit, split equally among the four fleets.'},
    {id:'quotaAmt',label:'Quota (all fleets together)',type:'range',min:400,max:4000,step:100,def:1200,unit:' fish',lvl:'honors'},
    {id:'r',label:'Fish growth rate (r)',type:'range',min:0.2,max:0.8,step:0.05,def:0.5,unit:' per season',lvl:'ap'}
  ],
  actions:[{id:'restock',label:'Restock the lake',lvl:'honors',run(sim){sim.st.F=Math.min(K,sim.st.F+2000);sim.st.restock=sim.t;}}],
  init(sim){return {F:START,season:0,acc:0,lastG:0,catches:[0,0,0,0],lastTotal:0,profit:[0,0,0,0],events:[],totalCatch:0};},
  step(sim,dt){const s=sim.st;s.acc+=dt;while(s.acc>=1){s.acc-=1;seasonTick(sim);s.totalCatch+=s.lastTotal;}},
  metrics:[
    {id:'fish',label:'Fish in the lake',unit:'fish',lvl:'bio',min:0,max:10000,d:0,get:s=>s.st.F},
    {id:'mine',label:'Your catch last season',unit:'fish',lvl:'bio',min:0,max:1500,d:0,get:s=>s.st.catches[0]},
    {id:'all',label:'All fleets’ catch last season',unit:'fish',lvl:'bio',min:0,max:5000,d:0,get:s=>s.st.lastTotal},
    {id:'status',label:'Lake status',unit:'',lvl:'bio',text:true,get:s=>status(s.st.F)},
    {id:'profit',label:'Your total profit',unit:'$',lvl:'honors',min:null,max:null,d:0,get:s=>s.st.profit[0]},
    {id:'oprofit',label:'Each other fleet’s profit',unit:'$',lvl:'honors',min:null,max:null,d:0,get:s=>(s.st.profit[1]+s.st.profit[2]+s.st.profit[3])/3},
    {id:'surplus',label:'Surplus growth last season',unit:'fish',lvl:'ap',min:0,max:2000,d:0,get:s=>s.st.lastG},
    {id:'msy',label:'Maximum sustainable yield',unit:'fish/season',lvl:'ap',min:0,max:2000,d:0,get:s=>msy(s.p.r).y}
  ],
  graphs:[
    {id:'fc',label:'Fish and total catch',lines:['fish','all'],yl:'Fish'},
    {id:'fish',label:'Fish in the lake',lines:['fish']},
    {id:'money',label:'Profit',lvl:'honors',lines:['profit','oprofit'],yl:'Dollars'},
    {id:'yield',label:'Surplus growth vs. fish in the lake',lvl:'ap',custom:true}
  ],
  defaultGraph:'fc',
  plot(sim,ctx,box,id){const r=sim.p.r,M=msy(r);const ax=axes(ctx,box,{xmin:0,xmax:K,ymin:0,ymax:Math.max(M.y*1.25,sim.st.lastTotal*1.1,200),xl:'Fish in the lake',yl:'Fish per season'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<=100;i++){const F=K*i/100;i?ctx.lineTo(ax.X(F),ax.Y(growth(F,r))):ctx.moveTo(ax.X(F),ax.Y(growth(F,r)));}ctx.stroke();
    ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['s4'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(M.F),box.T);ctx.lineTo(ax.X(M.F),box.T+box.H);ctx.stroke();
    ctx.strokeStyle=PAL['s2'];ctx.beginPath();ctx.moveTo(box.L,ax.Y(sim.st.lastTotal));ctx.lineTo(box.L+box.W,ax.Y(sim.st.lastTotal));ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(sim.st.F),ax.Y(growth(sim.st.F,r)),6,0,6.29);ctx.fill();ctx.restore();
    txt(ctx,'MSY = '+Math.round(M.y)+' at '+Math.round(M.F)+' fish',ax.X(M.F)+6,box.T+14,{s:12,c:PAL['muted']});
    legend(ctx,box.L+12,box.T+box.H-10,[{label:'Surplus growth',color:PAL['g-line']},{label:'Last season’s catch',color:PAL['s2'],dash:true}]);},
  narrate(sim){const s=sim.st,p=sim.p,F=s.F,g=growth(F,p.r),ap=atLeast('ap'),hon=atLeast('honors');
    if(s.season===0)return '<b>A healthy lake</b> with '+Math.round(F).toLocaleString()+' fish. Each season the fish reproduce, then all four fleets fish. Press Play and watch.';
    const st=status(F),c=Math.round(s.lastTotal),gg=Math.round(s.lastG);
    if(st==='Collapsed')return '<b>The fishery has collapsed.</b> So few fish are left that they can barely find mates, and every fleet now catches almost nothing. Each fleet acted in its own interest, and everyone lost. That is the tragedy of the commons.';
    if(c>gg+50)return '<b>Fleets are taking more fish ('+c.toLocaleString()+') than the lake can replace ('+gg.toLocaleString()+').</b> The stock is shrinking.'+(hon&&p.others==='greedy'?' The greedy fleets grab what they can before someone else does.':'');
    if(Math.abs(c-gg)<=50)return '<b>Sustainable:</b> the fleets catch about as many fish as the lake grows each season ('+gg.toLocaleString()+'), so the stock holds steady.'+(ap?' The most you can take forever is the maximum sustainable yield, about '+Math.round(msy(p.r).y)+' per season.':'');
    return '<b>The lake is recovering.</b> Fish are reproducing faster ('+gg.toLocaleString()+') than they are caught ('+c.toLocaleString()+').'+(p.quota&&hon?' The quota is holding catches down.':'');},
  tour:[
    {title:'One lake, four fleets',text:'Four fishing fleets share this lake. Nobody owns the fish, so anyone can take them. Resources like this are called a <b>commons</b>.',focus:[0,90,800,345],speed:0.3},
    {title:'Your fleet',text:'The red boat is yours. Set how many fish you try to catch each season with the slider.',focus(sim){return [140,60,130,120];},speed:0.3},
    {title:'Fish reproduce',text:'After fishing, the survivors reproduce. Green + marks show new fish. A lake with more fish adds more young, up to the lake’s carrying capacity.',focus:[0,150,800,285],speed:0.4},
    {title:'The scoreboard',text:'Fish in the lake, last season’s catch and each fleet’s catch are on the dock. Watch how they change.',focus:[8,8,250,92],speed:0.4},
    {title:'Everyone gets greedy',text:'Now the other fleets switch to greedy, and you raise your catch too. Each fleet earns more this season, but watch what happens to the lake.',focus:[0,90,800,345],speed:1.5,setup(sim){BioLab.setValues(sim,{others:'greedy',catch:1200});}},
    {lvl:'honors',title:'A shared quota',text:'A total quota caps everyone’s catch. It costs each fleet some fish now, but it keeps the stock, and future catches, alive.',focus:[0,90,800,345],speed:1.5,setup(sim){BioLab.reset(sim);BioLab.setValues(sim,{others:'greedy',catch:1200,quota:true,quotaAmt:800});}},
    {lvl:'ap',title:'Maximum sustainable yield',text:'Surplus growth is largest when the lake holds about half its carrying capacity. Catching that much, and no more, is the maximum sustainable yield. See the “Surplus growth” graph.',focus:[8,8,250,92],pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{others:'cautious',catch:300,quota:false,quotaAmt:1200});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'Every fleet starts fishing as hard as it can. What happens over the next 20 seasons?',choices:['Everyone catches lots of fish forever','Catches boom, then the fish collapse and catches crash','Nothing changes'],correct:1,
     baseline:{},change:{others:'greedy',catch:1500},changeText:'All fleets fish hard',watch:'fish',
     explain:{bio:'The fleets take far more fish than the lake can replace. The stock crashes, and with few fish left, every fleet’s catch falls to almost nothing. This is the tragedy of the commons.'}},
    {lvl:'bio',q:'The other fleets are cautious, and you also keep your catch small (200 fish). What happens to the fish over 20 seasons?',choices:['They stay healthy','They slowly run out','They grow without limit'],correct:0,
     baseline:{catch:200},change:{},changeText:'Everyone fishes carefully',watch:'fish',
     explain:{bio:'When the fleets take fewer fish than the lake adds each season, the stock settles at a healthy level and the catch can continue season after season.'}},
    {lvl:'honors',q:'The other fleets stay cautious, but you take 1,500 fish every season. What happens?',choices:['Only your catch suffers','The whole lake collapses, so everyone’s catch suffers','The lake stays healthy because the others are careful'],correct:1,
     baseline:{},change:{catch:1500},changeText:'You fish 1,500 per season',watch:'fish',
     explain:{honors:'One fleet’s overfishing drains the shared stock for everyone. You gain at first, but the cost is spread across all four fleets, until there is nothing left to catch. Shared resources need shared rules.'}},
    {lvl:'honors',q:'All fleets are greedy, and after one season a total quota of 600 fish per season is set. What happens to the fish?',choices:['They still collapse','They recover and level off','The quota has no effect'],correct:1,
     baseline:{others:'greedy',catch:1500},change:{quota:true,quotaAmt:600},changeText:'A 600-fish quota starts',watch:'fish',at:1,reveal:22,
     explain:{honors:'With the quota, the fleets can only take 600 fish a season, less than the lake can regrow at that size. The stock rebuilds, and the fleets keep a steady catch instead of a crash.'}},
    {lvl:'ap',q:'To catch the most fish year after year, at about what level should the stock be kept?',choices:['As close to the carrying capacity (10,000) as possible','About half the carrying capacity','As low as possible'],correct:1,instant:true,
     explain:{ap:'Surplus growth rN(1 − N/K) peaks at N = K/2. Near K, fish compete for food and barely add young. With few fish, there are too few parents. This model’s mild Allee effect moves the peak slightly above 5,000. Check the “Surplus growth” graph.'}},
    {lvl:'ap',q:'A quota is set 20% above the maximum sustainable yield, and all fleets fish up to it. What happens?',choices:['The stock holds steady','The stock slowly declines and collapses','The stock grows'],correct:1,
     baseline:{others:'greedy',quota:true,quotaAmt:1400},change:{},changeText:'Quota at 1,400 (MSY ≈ 1,160)',watch:'fish',at:1,reveal:30,
     explain:{ap:'No stock size can regrow more than the MSY each season. A catch above it always removes more than the lake adds, so the stock falls every season until it collapses. Quotas only work if they are set below the MSY.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How big a catch can the lake support?</p><ol><li>Keep the other fleets cautious.</li><li>Set your catch to 200, 400, 600, 800 and 1,000. Press Reset each time.</li><li>After 20 seasons, record the fish in the lake.</li></ol><p>What is the largest catch that still keeps the lake healthy? Explain why.</p>',
       honors:'<p><b>Question:</b> Do quotas protect a commons?</p><ol><li>Make the other fleets greedy and set your catch to 1,500.</li><li>Turn on the quota and test 600, 1,000, 1,400 and 2,000 fish.</li><li>Record fish after 20 seasons and each fleet’s profit.</li></ol><p>Which quota gave the most total profit over 20 seasons? Explain the trade-off.</p>',
       ap:'<p><b>Question:</b> How does the growth rate r change the maximum sustainable yield?</p><ol><li>Record the MSY readout for r = 0.3, 0.5 and 0.7.</li><li>For each r, set a quota 10% below and 10% above MSY with greedy fleets, and record the stock after 30 seasons.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why fisheries managers aim below the MSY, especially when r is uncertain.</p>'},
  terms:[{t:'Commons',d:'A resource shared by everyone, which no single person owns, such as a lake, ocean or pasture.'},{t:'Tragedy of the commons',d:'When individuals act in their own interest and together overuse a shared resource until it is ruined.'},{t:'Sustainable',d:'Able to continue indefinitely without using up the resource.'},
    {lvl:'honors',t:'Overfishing',d:'Catching fish faster than the population can replace them.'},{lvl:'honors',t:'Quota',d:'A limit on how much of a resource can be taken.'},{lvl:'honors',t:'Catch shares',d:'Dividing a quota among fishers, so each has a stake in the stock’s future.'},
    {lvl:'ap',t:'Maximum sustainable yield (MSY)',d:'The largest catch that can be taken each season without shrinking the stock, about rK/4 at N = K/2.'},{lvl:'ap',t:'Surplus growth',d:'The number of new fish a stock adds in a season, rN(1 − N/K).'}],
  about:'<p><b>Model:</b> each season the fish grow by rN(1 − N/K)·N/(N + 400), with K = 10,000. The last factor is a mild Allee effect: when fish are very scarce, they struggle to reproduce, so a collapsed stock recovers slowly. Then the fleets fish. You choose your catch; cautious fleets each take 4% of the fish, greedy fleets 15%. A quota caps each fleet at a quarter of the total. No fleet can catch more than 45% of the fish, and fish sell for $10 each, with a $1,500 cost per season of fishing.</p><p><b>Simplified:</b> fish are all one age and size, prices don’t change with supply, and there is no weather or random variation. Real fisheries also face illegal fishing and uncertainty about stock size.</p>',
  initVis(sim){const r=rng(9),v=sim.vis;v.fish=[];for(let i=0;i<110;i++)v.fish.push({x:30+r()*740,y:200+r()*210,ph:r()*6.28,sp:8+r()*14,dir:r()<0.5?-1:1,alive:true});
    v.anim=[];v.plus=[];v.weeds=[];for(let i=0;i<16;i++)v.weeds.push([20+r()*760,425,25+r()*35]);},
  draw(sim,ctx,vdt,k,t){const s=sim.st,v=sim.vis,hon=atLeast('honors'),ap=atLeast('ap');
    // sky and shore
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,96,800,28);
    // water
    const wg=ctx.createLinearGradient(0,120,0,450);wg.addColorStop(0,PAL['cv-water']);wg.addColorStop(1,PAL['s6']);ctx.globalAlpha=1;ctx.fillStyle=wg;ctx.fillRect(0,120,800,330);
    ctx.globalAlpha=0.35;ctx.fillStyle=PAL['s6'];ctx.fillRect(0,120,800,330);ctx.globalAlpha=1;
    v.weeds.forEach((w,i)=>{ctx.strokeStyle=PAL['cv-leaf'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(w[0],450);ctx.quadraticCurveTo(w[0]+Math.sin(t+i)*8*(RM?0:1),450-w[2]/2,w[0]+4,450-w[2]);ctx.stroke();});
    // fish: shown count ∝ stock
    const per=100,nShow=Math.min(v.fish.length,Math.round(s.F/per));
    // season events: catches lift fish to boats, growth adds +
    const BX=[205,355,505,655],BY=118;
    while(s.events.length){const e=s.events.shift();e.caught.forEach((c,i)=>{const n=Math.min(12,Math.round(c/per));for(let j=0;j<n;j++)v.anim.push({x:BX[i]-30+Math.random()*60,y:200+Math.random()*120,tx:BX[i],ty:BY,life:1.4,col:FLEETS[i].col});});
      const nb=Math.min(14,Math.round(e.born/per));for(let j=0;j<nb;j++)v.plus.push({x:40+Math.random()*720,y:220+Math.random()*190,life:1.4});v.net=1.2;}
    for(let i=0;i<nShow;i++){const f=v.fish[i];if(vdt>0){f.x+=f.dir*f.sp*vdt;if(f.x<20||f.x>780)f.dir*=-1;}const y=f.y+Math.sin(t*1.3+f.ph)*4*(RM?0:1);
      ctx.save();ctx.translate(f.x,y);ctx.scale(f.dir,1);ctx.fillStyle='#d9a441';ctx.beginPath();ctx.ellipse(0,0,9,4.5,0,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(-14,-5);ctx.lineTo(-14,5);ctx.closePath();ctx.fill();ctx.fillStyle='#222';ctx.beginPath();ctx.arc(5,-1,1.2,0,6.29);ctx.fill();ctx.restore();}
    // nets
    if(v.net>0){v.net-=vdt;const a=clamp(v.net/1.2,0,1);BX.forEach((x,i)=>{const c=s.catches[i]||0;if(c<1)return;const d=60+Math.min(160,c/8)*Math.sin(a*Math.PI);ctx.strokeStyle=FLEETS[i].col;ctx.globalAlpha=0.7;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-12,BY+8);ctx.lineTo(x-24,BY+d);ctx.lineTo(x+24,BY+d);ctx.lineTo(x+12,BY+8);ctx.stroke();ctx.globalAlpha=1;});}
    for(const a of v.anim){a.life-=vdt;const u=1-clamp(a.life/1.4,0,1);const x=lerp(a.x,a.tx,u),y=lerp(a.y,a.ty,u*u);ctx.globalAlpha=clamp(a.life,0,1);ctx.fillStyle='#d9a441';ctx.beginPath();ctx.ellipse(x,y,7,3.5,0,0,6.29);ctx.fill();}
    for(const pl of v.plus){pl.life-=vdt;pl.y-=8*vdt;ctx.globalAlpha=clamp(pl.life,0,1);txt(ctx,'+',pl.x,pl.y,{s:18*Math.min(k,1.3),w:800,c:'#2e9e44',a:'center',b:'middle'});}
    ctx.globalAlpha=1;v.anim=v.anim.filter(a=>a.life>0);v.plus=v.plus.filter(p=>p.life>0);
    // boats
    BX.forEach((x,i)=>{const bob=Math.sin(t*1.6+i)*2*(RM?0:1);ctx.fillStyle=FLEETS[i].col;ctx.beginPath();ctx.moveTo(x-34,BY-6+bob);ctx.lineTo(x+34,BY-6+bob);ctx.lineTo(x+24,BY+8+bob);ctx.lineTo(x-24,BY+8+bob);ctx.closePath();ctx.fill();
      ctx.fillStyle=PAL['card'];ctx.fillRect(x-10,BY-22+bob,20,16);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+14,BY-6+bob);ctx.lineTo(x+20,BY-40+bob);ctx.stroke();
      txt(ctx,fleetName(i),x,BY-50+bob,{s:12*k,w:700,c:i===0?PAL['s1']:PAL['cv-ink'],a:'center'});
      if(s.season>0)txt(ctx,Math.round(s.catches[i])+' fish',x,BY+26,{s:11.5*k,w:600,c:'#ffffff',a:'center'});});
    // scoreboard
    ctx.fillStyle=PAL['card'];rr(ctx,10,8,244,84,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,'Season '+(s.season+1),22,28,{s:13*k,w:700});const st=status(s.F);
    pill(ctx,st,200,25,st==='Healthy'?PAL['s3']:st==='Collapsed'?PAL['s1']:PAL['s4'],'#fff',11.5*k);
    txt(ctx,'Fish: '+Math.round(s.F).toLocaleString()+' of '+K.toLocaleString(),22,50,{s:12.5*k,c:PAL['cv-soft']});
    ctx.fillStyle=PAL['line'];rr(ctx,22,62,220,14,7);ctx.fill();ctx.fillStyle=st==='Healthy'?PAL['s3']:st==='Collapsed'?PAL['s1']:PAL['s4'];rr(ctx,22,62,Math.max(4,220*s.F/K),14,7);ctx.fill();
    if(ap){const mx=22+220*msy(sim.p.r).F/K;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.setLineDash([3,2]);ctx.beginPath();ctx.moveTo(mx,58);ctx.lineTo(mx,80);ctx.stroke();ctx.setLineDash([]);txt(ctx,'MSY level',mx,90,{s:10.5*k,c:PAL['cv-soft'],a:'center'});}
    if(sim.p.quota&&hon)pill(ctx,'Quota: '+sim.p.quotaAmt.toLocaleString()+' fish per season',530,30,PAL['s5'],'#fff',12*k);
    if(nShow<Math.round(s.F/per)||per>1)txt(ctx,'Each fish shown = '+per+' fish',790,440,{s:11.5*k,c:'#ffffff',a:'right',w:600});}
};
BioLab.register(COM);
})();
