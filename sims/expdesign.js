(function(){
'use strict';
const {clamp,randn,binom,rr,txt,pill,atLeast,PAL,RM,axes,bars,legend,serColor,fmtNum}=BioLab.h;

/* ---------- the experiment ----------
   Each plate is spread with ~120 living E. coli cells (colony-forming units).
   A cell that survives the treatment grows into a colony; the colony becomes
   visible after about 20 doublings (~1 million cells). Colonies are counted at
   the end of incubation, so slow growth means fewer visible colonies. */
const IVS={
  temp:{name:'Temperature',short:'temperature',unit:'°C',sets:{3:[25,37,45],4:[20,30,37,45],5:[20,25,30,37,45]},ctrl:37,fmt:v=>v+' °C'},
  sugar:{name:'Sugar in the agar',short:'sugar',unit:'%',sets:{3:[0,0.5,2],4:[0,0.25,1,2],5:[0,0.25,0.5,1,2]},ctrl:0,fmt:v=>v+'% sugar'},
  anti:{name:'Antibiotic dose',short:'antibiotic dose',unit:'µg/mL',sets:{3:[0,2,8],4:[0,1,4,16],5:[0,1,2,4,8]},ctrl:0,fmt:v=>v+' µg/mL'},
  uv:{name:'UV exposure',short:'UV exposure time',unit:'s',sets:{3:[0,15,45],4:[0,10,30,60],5:[0,10,20,30,60]},ctrl:0,fmt:v=>v+' s UV'}};
const BASE={T:37,S:1,D:0,U:0};
const CFU=120;
function mu(T){const a=8,o=39,b=47,m=2.0;if(T<=a||T>=b)return 0;  // cardinal temperature model, doublings per hour
  const num=(T-b)*(T-a)*(T-a),den=(o-a)*((o-a)*(T-o)-(o-b)*(o+a-2*T));return Math.max(0,m*num/den);}
const sugarMult=S=>0.35+0.65*S/(0.2+S);
const antiSurv=D=>1/(1+Math.pow(D/2,3));      // MIC about 2 µg/mL
const uvSurv=U=>Math.exp(-U/12);
function cond(iv,v){const c=Object.assign({},BASE);if(iv==='temp')c.T=v;if(iv==='sugar')c.S=v;if(iv==='anti')c.D=v;if(iv==='uv')c.U=v;return c;}
function poisson(m){if(m<=0)return 0;if(m<30){let L=Math.exp(-m),k=0,p=1;do{k++;p*=Math.random();}while(p>L);return k-1;}return Math.max(0,Math.round(m+Math.sqrt(m)*randn()));}
function makePlate(c){const rate=mu(c.T)*sugarMult(c.S),n=poisson(CFU*antiSurv(c.D)*uvSurv(c.U)),cols=[];
  for(let i=0;i<n;i++){const lag=(1.5+1.5/Math.max(rate,0.05))*Math.exp(0.25*randn())*(1+c.U/30),grow=rate>0.02?20/(rate*Math.exp(0.12*randn())):Infinity;
    const r=0.88*Math.sqrt(Math.random()),a=Math.random()*6.283;cols.push({x:r*Math.cos(a),y:r*Math.sin(a),tv:lag+grow,rate});}
  return {cols,rate};}
function generate(sim,s){const p=sim.p,iv=IVS[p.iv],vals=iv.sets[p.levels],hrs=atLeast('honors')?p.hours:24;
  s.vals=vals;s.plates=vals.map(v=>{const c=cond(p.iv,v);return Array.from({length:p.reps},()=>makePlate(c));});
  s.countT=vals.map((v,i)=>hrs+(p.same?0:6*i));s.end=Math.max(...s.countT);s.h=0;s.lastHr=-1;sim.infoDirty=true;}
function counts(sim){const s=sim.st;return s.plates.map((reps,li)=>reps.map(pl=>{const tc=Math.min(s.h,s.countT[li]);let k=0;for(const c of pl.cols)if(c.tv<=tc)k++;return k;}));}
function stats(sim){return counts(sim).map(a=>{const n=a.length,m=a.reduce((x,y)=>x+y,0)/n,sd=n>1?Math.sqrt(a.reduce((x,y)=>x+(y-m)*(y-m),0)/(n-1)):0;return {a,m,sd,se:n>1?sd/Math.sqrt(n):0};});}
function done(sim){return sim.st.h>=sim.st.end-1e-9;}
function brothLog(t){let y=3+6/(1+Math.exp(-(t-7.5)*0.9));if(t>30)y-=0.05*(t-30);return y;}
function brothPhase(t){return t<2.5?'Lag phase':t<11?'Log (exponential) phase':t<30?'Stationary phase':'Death phase';}
function trendText(sim){const st=stats(sim),m=st.map(x=>x.m),iv=IVS[sim.p.iv],L=m.length;
  if(Math.max(...m)<1)return 'No colonies visible yet';
  const pk=m.indexOf(Math.max(...m)),f=m[0],l=m[L-1];
  if(pk>0&&pk<L-1&&m[pk]>1.25*Math.max(f,l)+2)return 'Most colonies at '+iv.fmt(sim.st.vals[pk])+', fewer on either side';
  if(l>f*1.2+2)return 'More colonies as '+iv.short+' increases';
  if(l<f*0.8-2)return 'Fewer colonies as '+iv.short+' increases';
  return 'About the same at every level';}
function overlapText(sim){if(sim.p.reps<2)return 'Use at least 2 plates per level to get error bars';const st=stats(sim),a=st[0],b=st[st.length-1];
  if(Math.max(a.m,b.m)<1)return 'No colonies counted yet';
  const lo1=a.m-2*a.se,hi1=a.m+2*a.se,lo2=b.m-2*b.se,hi2=b.m+2*b.se,ov=!(hi1<lo2||hi2<lo1);
  return 'Lowest vs. highest level: ±2 SE bars '+(ov?'overlap, so the difference could be chance':'do not overlap, so the difference is probably real');}
function geom(sim){const L=sim.st.vals.length,R=sim.p.reps,x0=20,y0=78,W=585,H=340,cw=W/L,ch=H/R,pr=Math.min(50,Math.min(cw,ch)*0.42);
  return {L,R,x0,y0,W,H,cw,ch,pr,cx:i=>x0+cw*(i+.5),cy:j=>y0+ch*(j+.5)};}

const SIM={
  id:'expdesign',hash:'expdesign',apUnit:0,order:1,tab:'Experiment designer',kind:'Virtual lab',
  card:'Design a bacterial growth experiment: pick one variable to change, keep the rest the same, run replicate plates and graph the results.',
  title:'Experiment designer: the bacterial growth lab',
  lede:{bio:'Choose one thing to change, keep everything else the same, and count the bacterial colonies that grow. That is a fair test.',
        honors:'Design a controlled experiment, pick the right graph for your data, and watch a broth culture move through the phases of growth.',
        ap:'Run replicate plates, then use means, standard deviation and ±2 SE error bars to decide whether a difference is real or just chance.'},
  scale:'Real lab scale: each petri dish is 9 cm across. Each dot is a colony of about a million E. coli cells, all grown from one cell.',
  timeScale:4,dtMax:0.05,prewarm:0,sampleDt:0.5,window:48,unit:'h',timeLabel:'Time',chChange:1,chReveal:30,
  controls:[
    {id:'iv',label:'Independent variable (what you change)',type:'select',def:'temp',lvl:'bio',options:[{v:'temp',l:'Temperature'},{v:'sugar',l:'Sugar in the agar'},{v:'anti',l:'Antibiotic dose'},{v:'uv',l:'UV exposure time'}],onChange(s){generate(s,s.st);}},
    {id:'levels',label:'Number of levels',type:'range',min:3,max:5,step:1,def:4,lvl:'bio',onChange(s){generate(s,s.st);}},
    {id:'reps',label:'Plates per level (replicates)',type:'range',min:1,max:5,step:1,def:3,lvl:'bio',onChange(s){generate(s,s.st);}},
    {id:'same',label:'Keep everything else the same',type:'toggle',def:true,lvl:'bio',help:'Turn off to see a flawed design: plates for higher levels are counted later.',onChange(s){generate(s,s.st);}},
    {id:'hours',label:'Incubation time (kept constant)',type:'seg',def:24,lvl:'honors',options:[{v:24,l:'24 h'},{v:48,l:'48 h'}],onChange(s){generate(s,s.st);}},
    {id:'gtype',label:'Graph type',type:'seg',def:'bar',lvl:'honors',noTrial:true,options:[{v:'bar',l:'Bar'},{v:'line',l:'Line'}]}
  ],
  actions:[{id:'run',label:'Run the experiment again',primary:true,run(sim){generate(sim,sim.st);}}],
  init(sim){const s={h:0};generate(sim,s);return s;},
  step(sim,dt){const s=sim.st;s.h=Math.min(s.end,s.h+dt);const hr=Math.floor(s.h);if(hr!==s.lastHr){s.lastHr=hr;sim.infoDirty=true;}},
  onLevel(sim){const hrs=atLeast('honors')?sim.p.hours:24;if(sim.st.countT&&sim.st.countT[0]!==hrs)generate(sim,sim.st);},
  metrics:[
    {id:'design',label:'Design check',text:true,lvl:'bio',get(sim){return sim.p.same?'Fair test: only '+IVS[sim.p.iv].short+' changes':'Not a fair test: higher levels were also counted 6 h later each';}},
    {id:'total',label:'Colonies counted, all plates',unit:'',lvl:'bio',min:0,max:null,d:0,get(sim){return counts(sim).flat().reduce((a,b)=>a+b,0);}},
    {id:'trend',label:'Pattern so far',text:true,lvl:'bio',get:trendText},
    {id:'phase',label:'Broth culture (37 °C)',text:true,lvl:'honors',get(sim){return brothPhase(sim.st.h);}},
    {id:'sd',label:'Average SD between replicate plates',unit:'colonies',lvl:'ap',min:0,max:30,d:1,get(sim){if(sim.p.reps<2)return NaN;const st=stats(sim);return st.reduce((a,x)=>a+x.sd,0)/st.length;}},
    {id:'overlap',label:'Error-bar check',text:true,lvl:'ap',get:overlapText}
  ],
  graphs:[{id:'results',label:'Results: mean colonies at each level',custom:true},{id:'curve',label:'Broth growth curve',lvl:'honors',custom:true}],defaultGraph:'results',
  plot(sim,ctx,box,id){const s=sim.st,iv=IVS[sim.p.iv];
    if(id==='curve'){const ax=axes(ctx,box,{xmin:0,xmax:48,ymin:3,ymax:10,xl:'Time in broth (h)',yl:'log₁₀ cells per mL'});
      [[0,2.5,'Lag'],[2.5,11,'Log'],[11,30,'Stationary'],[30,48,'Death']].forEach((ph,i)=>{ctx.fillStyle=i%2?PAL['card2']:PAL['card'];ctx.globalAlpha=.6;ctx.fillRect(ax.X(ph[0]),box.T,ax.X(ph[1])-ax.X(ph[0]),box.H);ctx.globalAlpha=1;txt(ctx,ph[2],(ax.X(ph[0])+ax.X(ph[1]))/2,box.T+14,{s:12,c:PAL['muted'],a:'center'});});
      ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.2;ctx.beginPath();for(let t=0;t<=48;t+=0.25){const x=ax.X(t),y=ax.Y(brothLog(t));t?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();for(let t=0;t<=s.h;t+=0.25){const x=ax.X(t),y=ax.Y(brothLog(t));t?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
      ctx.fillStyle=PAL['g-line'];ctx.beginPath();ctx.arc(ax.X(s.h),ax.Y(brothLog(s.h)),4.5,0,6.29);ctx.fill();return;}
    const st=stats(sim),means=st.map(x=>x.m),ymax=Math.max(130,...st.map(x=>x.m+2*x.se))*1.05;
    const ax=axes(ctx,box,{xmin:0,xmax:means.length,ymin:0,ymax,xcats:s.vals.map(v=>iv.fmt(v)),xl:iv.name+' ('+iv.unit+')',yl:'Mean colonies per plate'});
    const line=atLeast('honors')&&sim.p.gtype==='line';
    if(!line)bars(ctx,ax,means,{colors:[PAL['s2']],d:0,labels:!atLeast('ap')});
    else{ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2.5;ctx.beginPath();means.forEach((m,i)=>{const x=ax.X(i+.5),y=ax.Y(m);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
      means.forEach((m,i)=>{ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.arc(ax.X(i+.5),ax.Y(m),5,0,6.29);ctx.fill();});}
    if(atLeast('ap')&&sim.p.reps>1){ctx.strokeStyle=PAL['fg'];ctx.lineWidth=1.6;st.forEach((x,i)=>{const cx=ax.X(i+.5),y1=ax.Y(Math.max(0,x.m-2*x.se)),y2=ax.Y(x.m+2*x.se);
      ctx.beginPath();ctx.moveTo(cx,y1);ctx.lineTo(cx,y2);ctx.moveTo(cx-7,y1);ctx.lineTo(cx+7,y1);ctx.moveTo(cx-7,y2);ctx.lineTo(cx+7,y2);ctx.stroke();});
      legend(ctx,box.L+12,box.T+10,[{label:'mean ± 2 SE',color:PAL['fg']}]);}},
  trials:false,
  infoPanel(sim){const s=sim.st,iv=IVS[sim.p.iv],st=stats(sim),ap=atLeast('ap'),hon=atLeast('honors');
    const ctrlIdx=s.vals.indexOf(iv.ctrl);
    let h=`<div class="p-head"><h3>Your data</h3><span class="count">${done(sim)?'Final counts':'Hour '+Math.floor(s.h)}</span></div>`;
    h+=`<p><b>Changed (independent):</b> ${iv.name.toLowerCase()} · <b>Measured (dependent):</b> colonies counted at ${atLeast('honors')?sim.p.hours:24} h · <b>Control group:</b> ${iv.fmt(iv.ctrl)}</p>`;
    h+=`<div class="tbl-wrap"><table><thead><tr><th>Level</th>${Array.from({length:sim.p.reps},(_,j)=>`<th>Plate ${j+1}</th>`).join('')}<th>Mean</th>${ap?'<th>SD</th><th>±2 SE</th>':''}</tr></thead><tbody>`;
    st.forEach((x,i)=>{h+=`<tr><td>${iv.fmt(s.vals[i])}${i===ctrlIdx?' (control)':''}</td>${x.a.map(v=>`<td>${v}</td>`).join('')}<td>${x.m.toFixed(1)}</td>${ap?`<td>${sim.p.reps>1?x.sd.toFixed(1):'—'}</td><td>${sim.p.reps>1?(2*x.se).toFixed(1):'—'}</td>`:''}</tr>`;});
    h+='</tbody></table></div>';
    if(hon)h+=`<p style="margin-top:8px"><b>Graph tip:</b> ${iv.name} is a number that can take any value in between, so a <b>line graph</b> (or scatter) shows the trend best. A bar graph fits when the levels are separate categories, like different brands of soap.</p>`;
    if(!sim.p.same)h+=`<p style="margin-top:8px;color:var(--bad)"><b>Confounded:</b> plates for each level were also counted at different times (${s.countT.join(', ')} h). Any difference could come from either variable.</p>`;
    return h;},
  narrate(sim){const s=sim.st,iv=IVS[sim.p.iv];
    if(!sim.p.same)return '<b>Two things change at once.</b> Higher '+iv.short+' plates are also counted later, so extra time could explain extra colonies. You can no longer tell which variable caused the difference.';
    if(s.h<2.5)return 'Hour '+s.h.toFixed(0)+': the bacteria are in the <b>lag phase</b>, adjusting to the plate before they start dividing. Nothing is visible yet.';
    if(!done(sim))return 'Hour '+s.h.toFixed(0)+': each colony becomes visible once one cell has doubled about 20 times, to roughly a million cells. Faster growth means colonies show up sooner.';
    const t=trendText(sim);return '<b>Counting done.</b> '+t+'. '+(sim.p.reps>1?'Each level has '+sim.p.reps+' plates, so one odd plate can’t mislead you.':'With only one plate per level, a single odd plate could mislead you.');},
  initVis(){},
  draw(sim,ctx,vdt,k){const s=sim.st,g=geom(sim),iv=IVS[sim.p.iv],hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    txt(ctx,'Testing: '+iv.name.toLowerCase()+' → colonies counted',20,26,{s:14*k,w:700});
    // column headers
    for(let i=0;i<g.L;i++){const x=g.cx(i);txt(ctx,iv.fmt(s.vals[i]),x,52,{s:13*k,w:700,a:'center'});
      if(s.vals[i]===iv.ctrl)txt(ctx,'control',x,68,{s:11.5*k,w:600,a:'center',c:PAL['s3']});
      else if(!sim.p.same)txt(ctx,'counted at '+s.countT[i]+' h',x,68,{s:11.5*k,w:600,a:'center',c:PAL['s1']});}
    // plates
    for(let i=0;i<g.L;i++)for(let j=0;j<g.R;j++){const cx=g.cx(i),cy=g.cy(j),pr=g.pr,pl=s.plates[i][j],tc=Math.min(s.h,s.countT[i]);
      ctx.fillStyle='#e9d9a6';ctx.beginPath();ctx.arc(cx,cy,pr,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.stroke();
      ctx.strokeStyle='rgba(120,100,50,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,pr*0.93,0,6.29);ctx.stroke();
      for(const c of pl.cols){if(c.tv>s.h)continue;const age=Math.max(0,s.h-c.tv),rad=pr*(0.025+0.0055*Math.min(12,age*c.rate));
        ctx.fillStyle='#fbf6e8';ctx.beginPath();ctx.arc(cx+c.x*pr,cy+c.y*pr,rad,0,6.29);ctx.fill();ctx.strokeStyle='#b9a774';ctx.lineWidth=0.8;ctx.stroke();}
      if(s.h>=s.countT[i]&&!RM){ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,pr+3,0,6.29);ctx.stroke();}}
    // column means under the grid
    const st=stats(sim);for(let i=0;i<g.L;i++)txt(ctx,'mean '+st[i].m.toFixed(0),g.cx(i),g.y0+g.H+16,{s:12.5*k,w:600,a:'center',c:PAL['cv-soft']});
    // right panel: constants card
    rr(ctx,618,40,170,168,10);ctx.fillStyle=PAL['card2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,'Kept the same',630,62,{s:13*k,w:700});
    const lines=[['temp','Temperature','37 °C'],['sugar','Sugar','1%'],['anti','Antibiotic','none'],['uv','UV','none']];
    lines.forEach((l,i)=>{const y=86+i*22;const changed=sim.p.iv===l[0];txt(ctx,l[1]+': '+(changed?'varied':l[2]),630,y,{s:12*k,w:changed?700:400,c:changed?PAL['s2']:PAL['cv-ink']});});
    const hrs=hon?sim.p.hours:24;txt(ctx,'Counted at: '+(sim.p.same?hrs+' h':hrs+'–'+s.end+' h ✗'),630,86+4*22,{s:12*k,w:sim.p.same?400:700,c:sim.p.same?PAL['cv-ink']:PAL['s1']});
    // right panel lower: broth flask (honors) or incubator clock
    if(hon){const lg=brothLog(s.h),turb=clamp((lg-3)/6,0,1),fx=703,fy=260;
      ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(fx-12,fy);ctx.lineTo(fx-12,fy+40);ctx.lineTo(fx-55,fy+130);ctx.quadraticCurveTo(fx-60,fy+142,fx-46,fy+142);ctx.lineTo(fx+46,fy+142);ctx.quadraticCurveTo(fx+60,fy+142,fx+55,fy+130);ctx.lineTo(fx+12,fy+40);ctx.lineTo(fx+12,fy);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.save();ctx.clip();ctx.fillStyle='rgba(214,190,120,'+(0.18+0.72*turb)+')';ctx.fillRect(fx-60,fy+78,120,70);ctx.restore();
      txt(ctx,'Broth culture',fx,fy-10,{s:12.5*k,w:700,a:'center'});pill(ctx,brothPhase(s.h).replace(' phase',''),fx,fy+160,PAL['s4'],'#fff',11.5*k);}
    else{const cx=703,cy=320,R=52,f=clamp(s.h/s.end,0,1);ctx.strokeStyle=PAL['line'];ctx.lineWidth=10;ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.stroke();
      ctx.strokeStyle=PAL['s3'];ctx.beginPath();ctx.arc(cx,cy,R,-1.571,-1.571+6.283*f);ctx.stroke();
      txt(ctx,'Hour '+Math.floor(s.h),cx,cy-2,{s:16*k,w:700,a:'center',b:'middle'});txt(ctx,'of '+s.end,cx,cy+18,{s:12*k,a:'center',c:PAL['cv-soft'],b:'middle'});txt(ctx,'Incubator',cx,cy-R-14,{s:12.5*k,w:700,a:'center'});}
  },
  tour:[
    {title:'The question',text:'You are testing one question: how does the variable you chose affect how well bacteria grow? The thing you change is the <b>independent variable</b>. What you measure, the number of colonies, is the <b>dependent variable</b>.',focus:[0,0,612,76],pause:true},
    {title:'The control group',text:'One set of plates gets the normal condition: no antibiotic, no UV, no sugar, or 37 °C. This <b>control group</b> shows what happens without your change, so you have something to compare against.',focus(sim){const g=geom(sim),i=Math.max(0,sim.st.vals.indexOf(IVS[sim.p.iv].ctrl));return [g.x0+g.cw*i,36,g.cw,g.H+50];},pause:true},
    {title:'Replicates',text:'Each column holds several plates at the same level. One plate could be a fluke, for example if a few cells clumped together. Several <b>replicates</b> show what is typical.',focus(sim){const g=geom(sim);return [g.x0,g.y0,g.W,g.ch];},pause:true},
    {title:'Keep everything else the same',text:'Only one thing changes. Temperature, sugar, antibiotic, UV and counting time stay the same for every plate. These are the <b>constants</b>. If two things change at once, the test is not fair.',focus:[612,34,182,180],pause:true},
    {title:'Incubation',text:'Each colony starts as one bacterium. Watch them appear: a colony becomes visible after about 20 doublings, roughly a million cells. In better conditions they appear sooner and grow bigger.',focus(sim){const g=geom(sim);return [g.x0-6,g.y0-6,g.W+12,g.H+12];},speed:0.6,setup(sim){generate(sim,sim.st);}},
    {title:'Count and compare',text:'At the end of incubation, count the colonies on each plate and average each column. Compare every level with the control.',focus(sim){const g=geom(sim);return [g.x0-6,g.y0-6,g.W+12,g.H+30];},speed:2},
    {lvl:'honors',title:'Growth phases',text:'In broth, bacteria first sit in the <b>lag phase</b>, then double steadily in the <b>log phase</b>. They level off in the <b>stationary phase</b> when food runs low, then decline in the <b>death phase</b> as waste builds up.',focus:[630,230,150,215],speed:3},
    {lvl:'ap',title:'Is the difference real?',text:'The replicate plates in a column vary. Error bars of ±2 standard errors around each mean show how sure you can be. If the bars for two levels don’t overlap, the difference is probably not chance.',focus(sim){const g=geom(sim);return [g.x0-6,g.y0-6,g.W+12,g.H+30];},pause:true}
  ],
  lab:{bio:'<p><b>Question:</b> How does temperature affect how many bacterial colonies grow in 24 hours?</p><ol><li>Choose Temperature, 4 levels and 3 plates per level. Keep everything else the same.</li><li>Let the plates incubate to the end, then read the mean for each temperature in Your data.</li><li>Name your independent variable, dependent variable, control group and two constants.</li></ol><p>Write a claim about temperature and growth, and use two means from your data as evidence.</p>',
       honors:'<p><b>Question:</b> Design your own experiment to test one factor that affects bacterial growth.</p><ol><li>Choose a variable and write a hypothesis in “If… then… because…” form.</li><li>Pick your levels and replicates, and keep everything else the same.</li><li>Run the experiment, then choose the graph type that fits your data and explain why.</li><li>Turn off “Keep everything else the same” and explain why that version can’t answer your question.</li></ol>',
       ap:'<p><b>Question:</b> Is the effect of a low antibiotic dose statistically meaningful?</p><ol><li>Choose Antibiotic dose, 5 levels, 5 plates per level.</li><li>Compare 0 and 1 µg/mL using the means and ±2 SE error bars.</li><li>Rerun with 2 plates per level and compare how wide the error bars are.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain how sample size affects your confidence that two treatments differ.</p>'},
  terms:[{t:'Independent variable',d:'The one thing you change on purpose.'},{t:'Dependent variable',d:'What you measure to see the effect, here the colonies counted.'},{t:'Control group',d:'The plates that get the normal condition, used for comparison.'},{t:'Constants',d:'Everything you keep the same so the test is fair.'},{t:'Replicate',d:'A repeat of the same treatment, to see how much results vary.'},{t:'Colony',d:'A visible pile of about a million bacteria, all grown from one cell.'},
    {lvl:'honors',t:'Confounding variable',d:'A second thing that changes along with your independent variable, so you can’t tell which one caused the effect.'},{lvl:'honors',t:'Lag phase',d:'The start of growth, when bacteria adjust and barely divide.'},{lvl:'honors',t:'Log (exponential) phase',d:'Bacteria double at a steady rate.'},{lvl:'honors',t:'Stationary phase',d:'Growth levels off as food runs out.'},
    {lvl:'ap',t:'Standard deviation (SD)',d:'How spread out the replicate values are around the mean.'},{lvl:'ap',t:'Standard error (SE)',d:'SD ÷ √n. It shows how precisely you know the mean.'},{lvl:'ap',t:'±2 SE error bars',d:'Roughly a 95% confidence range for the mean. Bars that don’t overlap suggest a real difference.'}],
  about:'<p>Each plate is spread with an average of 120 living cells; the actual number varies randomly (Poisson). A cell grows into a visible colony after a lag plus about 20 doublings. Growth rate follows a cardinal temperature model for <i>E. coli</i> (minimum 8 °C, optimum 39 °C, maximum 47 °C, about 2 doublings per hour at best), multiplied by a sugar factor. Antibiotic survival is 1/(1+(dose/2)³), with a MIC near 2 µg/mL, and UV survival is e<sup>−t/12 s</sup>. Each colony’s lag and rate vary a little, so replicate plates differ the way real ones do.</p><p>Simplified: no contamination, no crowding between colonies, and the broth curve is a fixed textbook shape at 37 °C.</p>',
  challenges:[
    {lvl:'bio',instant:true,q:'You change the temperature and count colonies. Which is the dependent variable?',choices:['The temperature','The number of colonies','The incubator','The type of bacteria'],correct:1,
     explain:'The dependent variable is what you measure, the colonies. It “depends” on the temperature, which is the independent variable you change on purpose.'},
    {lvl:'bio',q:'You test antibiotic doses of 0, 1, 4 and 16 µg/mL with 3 plates each. What happens to the colony count as the dose rises?',choices:['More colonies at higher doses','Fewer colonies at higher doses','About the same at every dose'],correct:1,
     baseline:{iv:'anti',levels:4,reps:3},changeText:'Plates incubating',watch:'results',
     explain:'The antibiotic kills most cells once the dose passes about 2 µg/mL, so fewer cells survive to grow into colonies. The 0 µg/mL plates are the control that shows normal growth.'},
    {lvl:'bio',instant:true,q:'Why put 3 plates at each level instead of 1?',choices:['It makes the bacteria grow faster','One plate could be a fluke, so several show what is typical','The incubator needs to be full'],correct:1,
     explain:'Plates vary by chance: a few more or fewer cells, a slightly drier spot. Averaging several replicates gives a more reliable result.'},
    {lvl:'honors',instant:true,q:'Your independent variable is temperature in °C, a number that can take any value in between. Which graph shows your results best?',choices:['Pie chart','Bar graph','Line graph or scatter plot'],correct:2,
     explain:'Temperature is continuous, so a line graph or scatter plot shows the trend between the points. Use bar graphs for separate categories, like different brands.'},
    {lvl:'honors',q:'A broth culture starts with a few thousand bacteria per mL. During the first 2 hours, what does the population do?',choices:['Doubles every 30 minutes right away','Barely changes (lag phase)','Shrinks'],correct:1,
     at:0.05,reveal:1.6,changeAction:'run',changeText:'Fresh broth inoculated',watch:'curve',
     explain:'Newly added cells spend a lag phase making the enzymes they need for this food. Exponential (log) growth starts afterward.'},
    {lvl:'honors',instant:true,q:'Higher-sugar plates were also counted 6 hours later. They have more colonies. Can you conclude sugar caused it?',choices:['Yes, sugar went up and colonies went up','No, counting time also changed, so either could be the cause'],correct:1,
     explain:'Counting time is a confounding variable. To isolate sugar, every plate has to be counted at the same time.'},
    {lvl:'ap',q:'With 5 plates per level, do the ±2 SE error bars for 0 and 8 µg/mL antibiotic overlap?',choices:['Yes, so the difference could be chance','No, so the difference is probably real'],correct:1,
     baseline:{iv:'anti',levels:5,reps:5},changeText:'Plates incubating',watch:'results',
     explain:'The control averages about 120 colonies, while 8 µg/mL leaves only one or two survivors per plate. The error bars are a few colonies wide, nowhere near touching. Check the Error-bar check readout.'},
    {lvl:'ap',instant:true,q:'A level has a mean of 100 colonies and a standard error of 5. What range do ±2 SE error bars cover?',choices:['95 to 105','90 to 110','98 to 102'],correct:1,
     explain:'2 × SE = 10, so the bars run from 100 − 10 to 100 + 10: 90 to 110.'}
  ],
  thumbSetup(sim){sim.st.h=sim.st.end;}
};
BioLab.register(SIM);
})();
