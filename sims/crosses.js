(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,axes,legend,serColor,fmtNum}=BioLab.h;

/* ---------------- genetics for each kind of cross ---------------- */
const SUP={R:'ᴿ',r:'ʳ',W:'ᵂ'};
const upFirst=(x,y)=>(x===x.toLowerCase()&&y!==y.toLowerCase())?y+x:x+y;
const xdisp=g=>g.replace(/X([Rr])/g,(m,a)=>'X'+SUP[a]);
const cdisp=g=>g.split('').map(a=>'C'+SUP[a]).join('');
const MODES={
  mono:{name:'Flower color',org:'plant',
    par:p=>[p.p1m,p.p2m],show:g=>g,
    gam:g=>[{l:g[0],a:g[0],p:.5},{l:g[1],a:g[1],p:.5}],
    comb:(a,b)=>({g:upFirst(a.a,b.a)}),
    phen:o=>o.g.includes('P')?'purple':'white',
    phenos:[{k:'purple',l:'Purple',s:'purple'},{k:'white',l:'White',s:'white'}]},
  di:{name:'Seed color and shape',org:'seed',
    par:p=>[p.p1d,p.p2d],show:g=>g,
    gam:g=>{const o=[];[g[0],g[1]].forEach(a=>[g[2],g[3]].forEach(b=>o.push({l:a+b,a:[a,b],p:.25})));return o;},
    comb:(a,b)=>({g:upFirst(a.a[0],b.a[0])+upFirst(a.a[1],b.a[1])}),
    phen:o=>(o.g.includes('Y')?'yellow':'green')+'-'+(o.g.includes('R')?'round':'wrinkled'),
    phenos:[{k:'yellow-round',l:'Yellow round',s:'yellow round'},{k:'yellow-wrinkled',l:'Yellow wrinkled',s:'yellow wrinkled'},{k:'green-round',l:'Green round',s:'green round'},{k:'green-wrinkled',l:'Green wrinkled',s:'green wrinkled'}]},
  incomplete:{name:'Snapdragon color',org:'plant',
    par:p=>[p.p1i,p.p2i],show:cdisp,
    gam:g=>[{l:'C'+SUP[g[0]],a:g[0],p:.5},{l:'C'+SUP[g[1]],a:g[1],p:.5}],
    comb:(a,b)=>({g:(a.a==='W'&&b.a==='R')?'RW':a.a+b.a}),
    phen:o=>o.g==='RR'?'red':o.g==='WW'?'white':'pink',
    phenos:[{k:'red',l:'Red',s:'red'},{k:'pink',l:'Pink',s:'pink'},{k:'white',l:'White',s:'white'}]},
  xlinked:{name:'Fruit fly eye color',org:'fly',
    par:p=>[p.mom,p.dad],show:xdisp,
    gam:(g,i)=>i===0?[{l:'X'+SUP[g[1]],a:g[1],p:.5},{l:'X'+SUP[g[3]],a:g[3],p:.5}]:[{l:'X'+SUP[g[1]],a:g[1],p:.5},{l:'Y',a:'Y',p:.5}],
    comb:(a,b)=>b.a==='Y'?{g:'X'+a.a+'Y',sex:'M'}:{g:'X'+((a.a==='r'&&b.a==='R')?'RX'+'r':a.a+'X'+b.a),sex:'F'},
    phen:o=>(o.g.includes('XR')?'red':'white')+'-'+o.sex,
    phenos:[{k:'red-F',l:'Red-eyed ♀',s:'red-eyed ♀'},{k:'white-F',l:'White-eyed ♀',s:'white-eyed ♀'},{k:'red-M',l:'Red-eyed ♂',s:'red-eyed ♂'},{k:'white-M',l:'White-eyed ♂',s:'white-eyed ♂'}]},
  linked:{name:'Linked genes (fruit fly)',org:'fly',
    par:()=>['BV/bv','bv/bv'],show:g=>g,
    gam:(g,i,p)=>{if(i===1)return [{l:'bv',p:1}];const r=p.rf/100;return [{l:'BV',p:(1-r)/2},{l:'bv',p:(1-r)/2},{l:'Bv',p:r/2},{l:'bV',p:r/2}];},
    comb:(a,b)=>({g:a.l+'/'+b.l}),
    phen:o=>(o.g[0]==='B'?'gray':'black')+'-'+(o.g[1]==='V'?'normal':'vestigial'),
    phenos:[{k:'gray-normal',l:'Gray, normal wings',s:'gray normal'},{k:'black-vestigial',l:'Black, vestigial',s:'black vestigial'},{k:'gray-vestigial',l:'Gray, vestigial',s:'gray vestigial'},{k:'black-normal',l:'Black, normal wings',s:'black normal'}]}
};
const MODE_CTL={mono:['p1m','p2m'],di:['p1d','p2d'],incomplete:['p1i','p2i'],xlinked:['mom','dad'],linked:['rf']};
const CRIT={1:3.84,2:5.99,3:7.81};
const COL={purple:'#8a3fb8',white:'#fbfbfb',red:'#d3262e',pink:'#f08cb3',yellow:'#e9c430',green:'#79b03a'};

const mode=sim=>MODES[sim.p.mode];
const gametes=sim=>{const m=mode(sim),gs=m.par(sim.p);return [m.gam(gs[0],0,sim.p),m.gam(gs[1],1,sim.p)];};
function expected(sim){const m=mode(sim),[g1,g2]=gametes(sim),pr={};m.phenos.forEach(f=>pr[f.k]=0);
  g1.forEach(a=>g2.forEach(b=>{const o=m.comb(a,b);pr[m.phen(o)]+=a.p*b.p;}));return pr;}
function pick(list){let r=Math.random(),i=0;for(;i<list.length-1;i++){if(r<list[i].p)break;r-=list[i].p;}return i;}
function makeOne(sim){const m=mode(sim),[g1,g2]=gametes(sim),ri=pick(g1),ci=pick(g2),o=m.comb(g1[ri],g2[ci]);
  o.k=m.phen(o);o.ri=ri;o.ci=ci;if(!o.sex)o.sex=Math.random()<.5?'M':'F';return o;}
function addOff(sim,o){const s=sim.st;o.born=s.clock;s.off.push(o);s.counts[o.k]=(s.counts[o.k]||0)+1;s.n++;s.last=o;if(s.off.length>400)s.off.splice(0,s.off.length-400);}
function breed(sim,n){const s=sim.st;if(!s.queue.length)s.nextT=s.clock;for(let i=0;i<n;i++)s.queue.push(makeOne(sim));s.interval=Math.min(0.16,2.6/s.queue.length);}
function breedNow(sim,n){for(let i=0;i<n;i++)addOff(sim,makeOne(sim));}
function clearOff(sim){if(!sim.st)return;Object.assign(sim.st,{queue:[],off:[],counts:{},n:0,last:null});}
function syncCtl(sim){if(!sim.ui||!sim.ui.sec)return;const m=sim.p.mode;
  Object.keys(MODE_CTL).forEach(k=>MODE_CTL[k].forEach(id=>{const e=sim.ui.sec.querySelector('#crosses-'+id);if(!e)return;const c=CROSS.controls.find(c=>c.id===id);e.closest('.ctl').hidden=!(k===m&&atLeast(c.lvl));}));}
function gcd(a,b){return b?gcd(b,a%b):a;}
function ratioText(sim){const m=mode(sim),pr=expected(sim),fs=m.phenos.filter(f=>pr[f.k]>1e-9);
  if(fs.length===1)return 'All '+fs[0].s;
  if(sim.p.mode==='linked')return fs.map(f=>(pr[f.k]*100).toFixed(1).replace('.0','')+'% '+f.s).join(' : ');
  const v=fs.map(f=>Math.round(pr[f.k]*16));const g=v.reduce(gcd);return fs.map((f,i)=>v[i]/g+' '+f.s).join(' : ');}
function obsText(sim){const m=mode(sim),s=sim.st,pr=expected(sim);if(!s.n)return 'None yet';
  return m.phenos.filter(f=>pr[f.k]>1e-9||s.counts[f.k]).map(f=>(s.counts[f.k]||0)+' '+f.s).join(' : ');}
function chi(sim){const m=mode(sim),s=sim.st,pr=expected(sim);if(!s.n)return {x:NaN,df:0};let x=0,df=-1,small=false;
  m.phenos.forEach(f=>{const E=s.n*pr[f.k];if(E>1e-9){const O=s.counts[f.k]||0;x+=(O-E)*(O-E)/E;df++;if(E<5)small=true;}});return {x,df,small};}
function crossText(sim){const m=mode(sim),[a,b]=m.par(sim.p);return m.show(a)+' × '+m.show(b)+(sim.p.mode==='linked'?' ('+sim.p.rf+' map units)':'');}

/* ---------------- sprites ---------------- */
function plant(ctx,x,y,s,col){ctx.strokeStyle=PAL['cv-leaf'];ctx.lineWidth=2.2*s;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y+16*s);ctx.quadraticCurveTo(x-2*s,y+4*s,x,y-6*s);ctx.stroke();
  ctx.fillStyle=PAL['cv-leaf2'];[[-1,8],[1,3]].forEach(([d,yy])=>{ctx.save();ctx.translate(x+d*5*s,y+yy*s);ctx.rotate(d*0.7);ctx.beginPath();ctx.ellipse(0,0,6*s,2.6*s,0,0,6.29);ctx.fill();ctx.restore();});
  const c=COL[col],edge=col==='white'?'#9a9a9a':'rgba(0,0,0,.28)';
  for(let i=0;i<5;i++){const a=i/5*6.283-1.57;ctx.beginPath();ctx.arc(x+Math.cos(a)*4.4*s,y-10*s+Math.sin(a)*4.4*s,3.7*s,0,6.29);ctx.fillStyle=c;ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=Math.max(.8,.6*s);ctx.stroke();}
  ctx.fillStyle='#f3c623';ctx.beginPath();ctx.arc(x,y-10*s,2.2*s,0,6.29);ctx.fill();}
function seed(ctx,x,y,r,col,round){ctx.fillStyle=COL[col];ctx.strokeStyle=col==='yellow'?'#8a7420':'#3f6a1b';ctx.lineWidth=Math.max(1,r*.12);ctx.beginPath();
  if(round)ctx.arc(x,y,r,0,6.29);else{for(let i=0;i<=40;i++){const a=i/40*6.283,rad=r*(0.84+0.13*Math.sin(a*7+1.3));i?ctx.lineTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad):ctx.moveTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad);}ctx.closePath();}
  ctx.fill();ctx.stroke();
  if(round){ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.ellipse(x-r*.32,y-r*.35,r*.28,r*.18,-.6,0,6.29);ctx.fill();}
  else{ctx.beginPath();ctx.moveTo(x-r*.4,y-r*.2);ctx.quadraticCurveTo(x,y+r*.1,x+r*.35,y-r*.35);ctx.moveTo(x-r*.2,y+r*.4);ctx.quadraticCurveTo(x+r*.1,y+r*.1,x+r*.4,y+r*.3);ctx.stroke();}}
function fly(ctx,x,y,s,o){const body=o.body==='black'?'#2e2a28':'#b8925a',dark=o.body==='black'?'#151313':'#6b5230';
  ctx.fillStyle='rgba(215,232,245,.6)';ctx.strokeStyle='#7f98a8';ctx.lineWidth=Math.max(.7,.5*s);
  [-1,1].forEach(d=>{ctx.save();ctx.translate(x+d*3*s,y-1*s);ctx.rotate(d*0.38);ctx.beginPath();if(o.wings==='vestigial'){ctx.ellipse(d*1.5*s,4*s,2.6*s,4*s,0,0,6.29);}else ctx.ellipse(d*2*s,9*s,4.6*s,12*s,0,0,6.29);ctx.fill();ctx.stroke();ctx.restore();});
  ctx.fillStyle=body;ctx.beginPath();if(o.male)ctx.ellipse(x,y+8*s,5.2*s,6.6*s,0,0,6.29);else ctx.ellipse(x,y+9.5*s,5.8*s,8.4*s,0,0,6.29);ctx.fill();
  ctx.strokeStyle=dark;ctx.lineWidth=1.3*s;for(let i=0;i<3;i++){const yy=y+(o.male?5:6)*s+i*2.8*s;ctx.beginPath();ctx.moveTo(x-4.6*s,yy);ctx.lineTo(x+4.6*s,yy);ctx.stroke();}
  if(o.male){ctx.fillStyle=dark;ctx.beginPath();ctx.ellipse(x,y+12.6*s,3.4*s,2.2*s,0,0,6.29);ctx.fill();}
  ctx.fillStyle=body;ctx.beginPath();ctx.ellipse(x,y-2*s,4.6*s,5*s,0,0,6.29);ctx.fill();
  ctx.beginPath();ctx.arc(x,y-8.5*s,3.6*s,0,6.29);ctx.fill();
  ctx.fillStyle=o.eye==='white'?'#f6f6f6':'#c8161d';ctx.strokeStyle='#555';ctx.lineWidth=Math.max(.6,.4*s);
  [-1,1].forEach(d=>{ctx.beginPath();ctx.ellipse(x+d*3*s,y-9*s,2.2*s,2.7*s,0,0,6.29);ctx.fill();ctx.stroke();});}
function sprite(ctx,modeId,k,x,y,sc,sex){
  if(modeId==='mono'||modeId==='incomplete')plant(ctx,x,y,sc,k);
  else if(modeId==='di'){const [c,sh]=k.split('-');seed(ctx,x,y,10*sc,c,sh==='round');}
  else if(modeId==='xlinked'){const [e,sx]=k.split('-');fly(ctx,x,y-2*sc,sc,{eye:e,male:sx==='M'});}
  else{const [b,w]=k.split('-');fly(ctx,x,y-2*sc,sc,{eye:'red',body:b,wings:w,male:sex==='M'});}}
const parentPhen=(sim,i)=>{const m=mode(sim),g=m.par(sim.p)[i],gm=m.gam(g,i,sim.p);
  if(sim.p.mode==='xlinked')return (g.includes('XR')?'red':'white')+'-'+(i===0?'F':'M');
  if(sim.p.mode==='linked')return i===0?'gray-normal':'black-vestigial';
  if(sim.p.mode==='di')return (g.includes('Y')?'yellow':'green')+'-'+(g.includes('R')?'round':'wrinkled');
  return m.phen({g:sim.p.mode==='incomplete'?g:g});};
const PUN={x:24,y:150,w:312,h:288,hw:46,hh:34};

const CROSS={
  id:'crosses',hash:'crosses',apUnit:5,order:1,tab:'Genetic crosses',kind:'Simulation',
  card:'Breed pea plants and fruit flies. Watch gametes meet, then test the Punnett square against real counts.',
  title:'Genetic crosses: Punnett squares meet real offspring',
  lede:{bio:'Pick two parent pea plants, breed them, and watch each offspring form from one allele from each parent. Then compare the counts with the Punnett square.',
        honors:'Go beyond one gene: two genes at once, incomplete dominance in snapdragons, and an X-linked trait in fruit flies.',
        ap:'Test your counts with chi-square, and measure recombination between linked genes.'},
  scale:{bio:'Real organisms: a garden pea plant is about 1 m tall. Each offspring here stands for one seed grown into a plant.',honors:'Real organisms: pea plants (about 1 m tall) and fruit flies (about 3 mm long).'},
  timeless:true,animated:true,chChange:0.4,chReveal:4.2,
  controls:[
    {id:'mode',label:'Cross',type:'seg',def:'mono',lvl:'honors',options:[{v:'mono',l:'One gene'},{v:'di',l:'Two genes',lvl:'honors'},{v:'incomplete',l:'Snapdragons',lvl:'honors'},{v:'xlinked',l:'X-linked',lvl:'honors'},{v:'linked',l:'Linked genes',lvl:'ap'}],
     onChange(sim){clearOff(sim);syncCtl(sim);}},
    {id:'p1m',label:'Parent 1',type:'select',def:'Pp',lvl:'bio',noTrial:true,options:[{v:'PP',l:'PP (purple)'},{v:'Pp',l:'Pp (purple)'},{v:'pp',l:'pp (white)'}],onChange:clearOff},
    {id:'p2m',label:'Parent 2',type:'select',def:'Pp',lvl:'bio',noTrial:true,options:[{v:'PP',l:'PP (purple)'},{v:'Pp',l:'Pp (purple)'},{v:'pp',l:'pp (white)'}],onChange:clearOff},
    {id:'p1d',label:'Parent 1',type:'select',def:'YyRr',lvl:'honors',noTrial:true,options:['YYRR','YyRr','YyRR','YYRr','Yyrr','yyRr','YYrr','yyRR','yyrr'].map(v=>({v,l:v})),onChange:clearOff,help:'Y yellow, y green · R round, r wrinkled'},
    {id:'p2d',label:'Parent 2',type:'select',def:'YyRr',lvl:'honors',noTrial:true,options:['YYRR','YyRr','YyRR','YYRr','Yyrr','yyRr','YYrr','yyRR','yyrr'].map(v=>({v,l:v})),onChange:clearOff},
    {id:'p1i',label:'Parent 1',type:'select',def:'RW',lvl:'honors',noTrial:true,options:[{v:'RR',l:'CᴿCᴿ (red)'},{v:'RW',l:'CᴿCᵂ (pink)'},{v:'WW',l:'CᵂCᵂ (white)'}],onChange:clearOff},
    {id:'p2i',label:'Parent 2',type:'select',def:'RW',lvl:'honors',noTrial:true,options:[{v:'RR',l:'CᴿCᴿ (red)'},{v:'RW',l:'CᴿCᵂ (pink)'},{v:'WW',l:'CᵂCᵂ (white)'}],onChange:clearOff},
    {id:'mom',label:'Mother ♀',type:'select',def:'XRXr',lvl:'honors',noTrial:true,options:[{v:'XRXR',l:'XᴿXᴿ (red eyes)'},{v:'XRXr',l:'XᴿXʳ (red, carrier)'},{v:'XrXr',l:'XʳXʳ (white eyes)'}],onChange:clearOff},
    {id:'dad',label:'Father ♂',type:'select',def:'XRY',lvl:'honors',noTrial:true,options:[{v:'XRY',l:'XᴿY (red eyes)'},{v:'XrY',l:'XʳY (white eyes)'}],onChange:clearOff},
    {id:'rf',label:'Distance between genes',type:'range',min:0,max:50,step:1,def:17,unit:' map units',lvl:'ap',onChange:clearOff,help:'1 map unit = 1% recombinant offspring'}
  ],
  actions:[{id:'breed20',label:'Breed 20',primary:true,run(sim){breed(sim,20);}},{id:'breed100',label:'Breed 100',run(sim){breed(sim,100);}},{id:'clear',label:'Clear offspring',run:clearOff}],
  init(){return {clock:0,queue:[],off:[],counts:{},n:0,nextT:0,interval:.1,last:null};},
  step(sim,dt){const s=sim.st;s.clock+=dt;while(s.queue.length&&s.clock>=s.nextT){addOff(sim,s.queue.shift());s.nextT+=s.interval;}},
  onLevel(sim){syncCtl(sim);},
  metrics:[
    {id:'cross',label:'Cross',text:true,lvl:'bio',get:crossText},
    {id:'expected',label:'Expected ratio',text:true,lvl:'bio',get:ratioText},
    {id:'n',label:'Offspring counted',unit:'',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.n},
    {id:'observed',label:'Observed',text:true,lvl:'bio',get:obsText},
    {id:'chi2',label:'Chi-square (χ²)',unit:'',lvl:'ap',min:0,max:10,d:2,get:s=>chi(s).x},
    {id:'decision',label:'Chi-square test at p = 0.05',text:true,lvl:'ap',get(sim){const c=chi(sim);if(!sim.st.n)return 'Breed offspring first';if(c.df<1)return 'Only one phenotype is expected';
      const cr=CRIT[c.df];return 'χ² '+c.x.toFixed(2)+(c.x<cr?' < ':' ≥ ')+cr+' (df '+c.df+'): '+(c.x<cr?'fits the expected ratio':'does not fit')+(c.small?'. Sample is small, so be cautious.':'');}},
    {id:'rfObs',label:'Recombinant offspring',unit:'%',lvl:'ap',min:0,max:50,d:1,get(sim){if(sim.p.mode!=='linked'||!sim.st.n)return NaN;const c=sim.st.counts;return 100*((c['gray-vestigial']||0)+(c['black-normal']||0))/sim.st.n;}}
  ],
  graphs:[{id:'bars',label:'Observed vs. expected',custom:true}],defaultGraph:'bars',
  plot(sim,ctx,box){const m=mode(sim),pr=expected(sim),s=sim.st,n=s.n||100,fs=m.phenos;
    const O=fs.map(f=>s.n?(s.counts[f.k]||0):NaN),E=fs.map(f=>n*pr[f.k]);const ymax=Math.max(4,...E,...O.filter(Number.isFinite))*1.38;
    const ax=axes(ctx,box,{xmin:0,xmax:fs.length,ymin:0,ymax,xcats:fs.map(f=>f.l),yl:'Number of offspring'});
    fs.forEach((f,i)=>{const w=.34,y0=ax.Y(0);
      if(Number.isFinite(O[i])){const x0=ax.X(i+.5-w-.02),x1=ax.X(i+.5-.02),y1=ax.Y(O[i]);ctx.fillStyle=serColor(0);ctx.fillRect(x0,y1,x1-x0,y0-y1);txt(ctx,String(O[i]),(x0+x1)/2,y1-5,{s:12,w:700,c:PAL['fg'],a:'center'});}
      const x0=ax.X(i+.5+.02),x1=ax.X(i+.5+w+.02),y1=ax.Y(E[i]);ctx.strokeStyle=serColor(1);ctx.lineWidth=2;ctx.setLineDash([5,3]);ctx.strokeRect(x0,y1,x1-x0,y0-y1);ctx.setLineDash([]);
      txt(ctx,fmtNum(E[i],E[i]%1?1:0),(x0+x1)/2,y1-5,{s:12,c:PAL['muted'],a:'center'});});
    legend(ctx,box.L+14,box.T+10,[{label:s.n?'Observed':'Observed (breed first)',color:serColor(0)},{label:'Expected for '+n,color:serColor(1),dash:true}]);},
  narrate(sim){const s=sim.st,m=mode(sim),md=sim.p.mode,c=s.counts;
    if(s.queue.length)return '<b>Making offspring.</b> Each one gets one allele from each parent, chosen at random. The highlighted box shows the newest one: <b>'+m.show(s.last?s.last.g:'')+'</b>.';
    if(!s.n){if(md==='xlinked')return 'The eye-color gene sits on the X chromosome. Daughters get an X from each parent; sons get their only X from their mother. Press Breed to see who ends up with white eyes.';
      if(md==='linked')return 'These two genes sit close together on the same chromosome, so they are usually inherited together. Press Breed to count how often crossing over separates them.';
      if(md==='incomplete')return 'In snapdragons neither color allele fully hides the other. Press Breed to see what the in-between offspring look like.';
      return 'Each parent passes one of its two alleles to each offspring, at random. Press <b>Breed</b> and compare the real counts with the Punnett square.';}
    let t='So far: <b>'+obsText(sim)+'</b>. The Punnett square predicts '+ratioText(sim)+'.';
    if(md==='xlinked'&&c['white-M'])t+=' White eyes show up in sons: a son’s only X comes from his mother, so one Xʳ is enough.';
    else if(md==='incomplete'&&c.pink)t+=' Pink flowers have one Cᴿ and one Cᵂ allele: half the red pigment.';
    else if(md==='linked')t+=' Recombinant offspring appear only when crossing over happens between the two genes.';
    else if(md==='mono'&&c.white&&sim.p.p1m!=='pp'&&sim.p.p2m!=='pp')t+=' White flowers appear only when an offspring gets p from both parents.';
    if(s.n<30&&Object.keys(c).length>1)t+=' With this few offspring, the counts can wander from the expected ratio.';
    return t;},
  initVis(){},
  thumbSetup(sim){breedNow(sim,60);},thumbFrames:6,
  draw(sim,ctx,vdt,k){const s=sim.st,m=mode(sim),md=sim.p.mode,[g1,g2]=gametes(sim),gs=m.par(sim.p),hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    ctx.fillStyle=PAL['cv-bg2'];rr(ctx,10,8,334,434,12);ctx.fill();rr(ctx,352,8,440,434,12);ctx.fill();
    // parents
    const pX=[86,268];[0,1].forEach(i=>{const ph=parentPhen(sim,i);sprite(ctx,md,ph,pX[i],m.org==='seed'?54:52,m.org==='seed'?2.6:2.2,i===0?'F':'M');
      const role=md==='xlinked'?(i===0?'Mother ♀':'Father ♂'):'Parent '+(i+1);
      txt(ctx,role,pX[i],108,{s:11.5*k,c:PAL['cv-soft'],a:'center'});txt(ctx,m.show(gs[i]),pX[i],126,{s:15*k,w:700,a:'center'});});
    txt(ctx,'×',177,74,{s:26,w:700,c:PAL['cv-soft'],a:'center'});
    // Punnett square
    const P=PUN,n1=g1.length,n2=g2.length,cw=(P.w-P.hw)/n2,ch=(P.h-P.hh)/n1,cx0=P.x+P.hw,cy0=P.y+P.hh;
    const cellOf=(r,c)=>[cx0+c*cw,cy0+r*ch];
    for(let r=0;r<n1;r++)for(let c=0;c<n2;c++){const o=m.comb(g1[r],g2[c]),ph=m.phen(o),[x,y]=cellOf(r,c);
      ctx.fillStyle=PAL['card'];ctx.fillRect(x+1,y+1,cw-2,ch-2);
      if(md==='linked'){sprite(ctx,md,ph,x+30,y+ch/2-4,1.15,'F');txt(ctx,m.show(o.g),x+cw*.42,y+ch/2,{s:15*k,w:700,a:'center',b:'middle'});const pc=g1[r].p*100;txt(ctx,(pc%1?pc.toFixed(1):pc)+'%',x+cw-12,y+ch/2,{s:14*k,w:700,c:PAL['cv-soft'],a:'right',b:'middle'});continue;}
      const big=n1*n2<=4;if(big)sprite(ctx,md,ph,x+cw/2,y+ch*.4,md==='di'?1.5:1.25,o.sex||'F');
      txt(ctx,m.show(o.g),x+cw/2,big?y+ch-13:y+ch/2+1,{s:(big?15:12.5)*k,w:700,a:'center',b:'middle'});}
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.strokeRect(cx0,cy0,P.w-P.hw,P.h-P.hh);
    const chip=(x,y,l,fill)=>{ctx.fillStyle=fill||PAL['card'];ctx.beginPath();ctx.arc(x,y,15.5,0,6.29);ctx.fill();ctx.strokeStyle=PAL['s2'];ctx.lineWidth=1.8;ctx.stroke();txt(ctx,l,x,y+1,{s:(l.length>2?11:14.5)*k,w:700,a:'center',b:'middle'});};
    g1.forEach((g,r)=>chip(P.x+P.hw/2,cy0+r*ch+ch/2,g.l));g2.forEach((g,c)=>chip(cx0+c*cw+cw/2,P.y+P.hh/2,g.l));
    // newest offspring: gametes fly into their box
    if(s.last&&s.last.ri<n1&&s.last.ci<n2){const age=s.clock-s.last.born,dur=Math.max(.12,Math.min(.5,s.interval*.9)),[x,y]=cellOf(s.last.ri,s.last.ci);
      if(age<dur*2.5||s.queue.length){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;ctx.strokeRect(x+2,y+2,cw-4,ch-4);}
      if(age<dur){const f=age/dur,ex=x+cw/2,ey=y+ch/2;
        chip(P.x+P.hw/2+(ex-P.x-P.hw/2)*f,cy0+s.last.ri*ch+ch/2+(ey-cy0-s.last.ri*ch-ch/2)*f,g1[s.last.ri].l,PAL['cv-bg2']);
        chip(cx0+s.last.ci*cw+cw/2+(ex-cx0-s.last.ci*cw-cw/2)*f,P.y+P.hh/2+(ey-P.y-P.hh/2)*f,g2[s.last.ci].l,PAL['cv-bg2']);}}
    // offspring
    const pr=expected(sim),fs=m.phenos.filter(f=>pr[f.k]>1e-9||s.counts[f.k]);
    txt(ctx,'Offspring: '+s.n,366,32,{s:16*k,w:700});
    let lx=366,ly=54;fs.forEach(f=>{const lab=f.s+' '+(s.counts[f.k]||0);ctx.font='400 '+12*k+'px '+FONT;const w=ctx.measureText(lab).width+34;if(lx+w>792){lx=366;ly+=19;}sprite(ctx,md,f.k,lx+8,ly-4,md==='di'?.75:.62,'M');txt(ctx,lab,lx+20,ly,{s:12*k,c:PAL['cv-ink']});lx+=w;});
    const GX=362,GY=ly+10,cols=10,rows=10,gw=42.4,gh=(438-GY)/10;const start=Math.max(0,s.off.length-100);
    if(!s.off.length){txt(ctx,'Press Breed 20 or Breed 100',572,250,{s:15*k,c:PAL['cv-soft'],a:'center'});
      ctx.fillStyle=PAL['line'];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){ctx.beginPath();ctx.arc(GX+c*gw+gw/2,GY+r*gh+gh/2,1.5,0,6.29);ctx.fill();}}
    for(let i=start;i<s.off.length;i++){const o=s.off[i],j=i-start,x=GX+(j%cols)*gw+gw/2,y=GY+Math.floor(j/cols)*gh+gh/2,a=clamp((s.clock-o.born)/.18,0,1),sc=(0.4+0.6*a)*(md==='di'?1.15:m.org==='fly'?Math.min(.95,gh/38):.82);
      sprite(ctx,md,o.k,x,y+(md==='di'?0:2),sc,o.sex);}
    if(s.off.length>100)txt(ctx,'Showing the newest 100',784,438,{s:11.5*k,c:PAL['cv-soft'],a:'right'});
  },
  tour:[
    {title:'The parents',text:{bio:'Each parent plant has two alleles for flower color. P (purple) is dominant over p (white), so a Pp plant looks purple but carries a hidden p.',honors:'Each parent carries two alleles of the gene. Genotype is the pair of letters; phenotype is what you see.'},focus:[10,8,334,132],pause:true},
    {title:'Gametes carry one allele',text:'Each sperm or egg gets only one of a parent’s two alleles. A Pp parent makes P gametes and p gametes in equal numbers. They are shown in the circles along the edges.',focus:[[24,150,46,288],[24,150,312,34]],pause:true},
    {title:'The Punnett square',text:'Each box pairs one gamete from each parent. All four boxes are equally likely: 1 PP, 2 Pp and 1 pp. So you expect 3 purple for every 1 white.',focus:[70,184,266,254],pause:true},
    {title:'One offspring at a time',text:'Watch the highlighted box: two gametes meet, and the new plant appears on the right. Which box it lands in is random, like a coin flip for each parent.',focus:[[24,150,312,288],[352,8,440,434]],speed:0.12,setup(sim){clearOff(sim);breed(sim,20);}},
    {title:'Bigger samples',text:'With 100 offspring the counts get close to 3 : 1, but rarely exactly. Small samples wander more: 4 coin flips give exactly 2 heads only 3 times in 8.',focus:[352,8,440,434],speed:1,setup(sim){breed(sim,100);}},
    {lvl:'honors',title:'A sex-linked gene',text:'Now the gene is on the X chromosome of fruit flies. A carrier mother passes Xʳ to half her sons, and they show white eyes because their Y has no second copy to hide it.',focus:[352,8,440,434],speed:1,setup(sim){BioLab.setValues(sim,{mode:'xlinked',mom:'XRXr',dad:'XRY'});breed(sim,100);}},
    {lvl:'ap',title:'Is the difference just chance?',text:'Chi-square adds up (observed − expected)² ÷ expected for each phenotype. If χ² is below the critical value for your degrees of freedom (number of phenotypes − 1), the difference is small enough to be chance.',focus:[352,8,440,64],speed:1,setup(sim){BioLab.setValues(sim,{mode:'mono',p1m:'Pp',p2m:'Pp'});breed(sim,20);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'mono',p1m:'Pp',p2m:'Pp'});clearOff(sim);},
  lab:{bio:'<p><b>Question:</b> How close do real offspring counts come to the Punnett square?</p><ol><li>Set both parents to Pp.</li><li>Press Breed 20, then Record trial, then Clear offspring. Do this 4 times.</li><li>Now Breed 100 and record.</li></ol><p>Which trials came closest to 3 purple : 1 white? Explain why sample size matters.</p>',
       honors:'<p><b>Question:</b> Do two genes sort independently?</p><ol><li>Choose Two genes and cross YyRr × YyRr. Breed 100 three times, recording after each.</li><li>Switch to X-linked and cross XᴿXʳ × XᴿY. Breed 100 and record.</li></ol><p>Compare your dihybrid counts with 9:3:3:1. In the X-linked cross, explain why only sons show white eyes.</p>',
       ap:'<p><b>Question:</b> When can you trust a ratio?</p><ol><li>Cross Pp × Pp. Breed 20 and record χ². Clear, then repeat 4 times. Then do the same with 100 offspring.</li><li>Choose Linked genes at 17 map units. Breed 100 and record the recombinant %.</li></ol><p><b>Claim–evidence–reasoning:</b> Use χ² to decide whether your linked-gene data fit 9:3:3:1-style independent assortment (1:1:1:1 in a testcross), and estimate the map distance.</p>'},
  terms:[{t:'Allele',d:'One version of a gene, like P (purple) or p (white).'},{t:'Dominant / recessive',d:'A dominant allele shows even with one copy. A recessive allele shows only with two copies.'},{t:'Genotype / phenotype',d:'Genotype is the alleles (Pp). Phenotype is the trait you see (purple).'},{t:'Homozygous / heterozygous',d:'Two identical alleles (PP, pp) or two different ones (Pp).'},{t:'Punnett square',d:'A grid that pairs each parent’s gametes to show the possible offspring.'},
    {lvl:'honors',t:'Dihybrid cross',d:'A cross that follows two genes at once. YyRr × YyRr gives 9:3:3:1.'},{lvl:'honors',t:'Incomplete dominance',d:'Neither allele fully hides the other, so heterozygotes look in-between (pink).'},{lvl:'honors',t:'X-linked (sex-linked)',d:'A gene on the X chromosome. Males have one X, so one recessive allele shows.'},{lvl:'honors',t:'Testcross',d:'Crossing an organism with a homozygous recessive to reveal its genotype.'},
    {lvl:'ap',t:'Chi-square (χ²)',d:'A test of whether observed counts differ from expected by more than chance.'},{lvl:'ap',t:'Degrees of freedom',d:'Number of phenotype categories minus 1.'},{lvl:'ap',t:'Linked genes',d:'Genes close together on one chromosome that tend to be inherited together.'},{lvl:'ap',t:'Recombination frequency',d:'The % of offspring with new allele combinations. 1% = 1 map unit.'}],
  about:'<p>Each offspring is built by picking one gamete from each parent at random, with each gamete’s probability taken from Mendel’s laws. The expected ratio comes from adding up every box of the Punnett square.</p><p>Simplifications: every offspring survives and every genotype has full penetrance. The two genes in the two-gene cross sit on different chromosomes. In the linked-gene cross, crossing over happens at the set frequency, the parent is in the coupling phase (BV/bv), and the testcross partner is bv/bv. Chi-square uses p = 0.05 critical values (df 1: 3.84, df 2: 5.99, df 3: 7.81).</p>',
  challenges:[
    {lvl:'bio',q:'You cross two purple pea plants that are both Pp. Out of 100 offspring, about how many will have white flowers?',choices:['None','About 25','About 50','About 75'],correct:1,
     baseline:{mode:'mono',p1m:'Pp',p2m:'Pp'},changeAction:'breed100',changeText:'Bred 100 offspring',watch:'bars',
     explain:'Each parent passes P or p with equal chance. Only the pp box (1 of 4) is white, so about 1 in 4 offspring: about 25 out of 100. Your exact count will usually be a little off, because each offspring is a separate random event.'},
    {lvl:'bio',q:'You cross a purple PP plant with a white pp plant. What will their offspring look like?',choices:['All purple','All white','Half purple, half white','A lighter purple'],correct:0,
     baseline:{mode:'mono',p1m:'PP',p2m:'pp'},changeAction:'breed20',changeText:'Bred 20 offspring',watch:'bars',
     explain:'Every offspring gets P from one parent and p from the other, so every one is Pp. One dominant P is enough for purple. The white allele is still there, hidden, and can reappear in the next generation.'},
    {lvl:'bio',q:'A purple plant’s genotype is a mystery, so you cross it with a white plant (pp). If the purple plant is secretly Pp, what will the offspring look like?',choices:['All purple','About half purple, half white','All white'],correct:1,
     baseline:{mode:'mono',p1m:'Pp',p2m:'pp'},changeAction:'breed20',changeText:'Bred 20 offspring',watch:'bars',
     explain:'This is a testcross. The white parent can only give p, so each offspring’s color shows which allele the mystery parent passed on. Any white offspring prove the purple parent carries p.'},
    {lvl:'honors',q:'Two pea plants are both YyRr (yellow, round seeds). What fraction of their offspring will have green, wrinkled seeds?',choices:['1/16','3/16','9/16','1/4'],correct:0,
     baseline:{mode:'di',p1d:'YyRr',p2d:'YyRr'},changeAction:'breed100',changeText:'Bred 100 offspring',watch:'bars',
     explain:'Green needs yy (1/4) and wrinkled needs rr (1/4). The genes sort independently, so multiply: 1/4 × 1/4 = 1/16. Only one of the 16 boxes is yyrr.'},
    {lvl:'honors',q:'A red-eyed female fly that carries white (XᴿXʳ) mates with a red-eyed male (XᴿY). Which offspring can have white eyes?',choices:['Only daughters','About half of the sons, and no daughters','Every offspring','None of them'],correct:1,
     baseline:{mode:'xlinked',mom:'XRXr',dad:'XRY'},changeAction:'breed100',changeText:'Bred 100 offspring',watch:'bars',
     explain:'Every daughter gets her father’s Xᴿ, so she has red eyes (half are carriers). Sons get their only X from their mother: half get Xʳ and have white eyes.'},
    {lvl:'honors',q:'You cross a red snapdragon (CᴿCᴿ) with a white one (CᵂCᵂ). What color are the offspring?',choices:['All red','All pink','Half red, half white','All white'],correct:1,
     baseline:{mode:'incomplete',p1i:'RR',p2i:'WW'},changeAction:'breed20',changeText:'Bred 20 offspring',watch:'bars',
     explain:'Every offspring is CᴿCᵂ. With incomplete dominance one Cᴿ allele makes only half the red pigment, so the flowers are pink. The alleles did not blend: cross two pinks and red and white come back.'},
    {lvl:'ap',q:'You breed only 20 offspring from Pp × Pp. Will you get exactly 15 purple and 5 white?',choices:['Yes, the Punnett square guarantees it','Probably not exactly; a chi-square test tells you whether the difference is just chance'],correct:1,
     baseline:{mode:'mono',p1m:'Pp',p2m:'Pp'},changeAction:'breed20',changeText:'Bred 20 offspring',watch:'bars',
     explain:'Each offspring is an independent random event, so exactly 15:5 happens only about 20% of the time. With df = 1, a χ² below 3.84 means the deviation is small enough to be chance (p > 0.05). Check the readout.'},
    {lvl:'ap',q:'Body color and wing shape genes are 17 map units apart. In a testcross of BV/bv × bv/bv, about what percent of offspring will be recombinant (gray vestigial or black normal)?',choices:['About 50%','About 17%','About 83%','None'],correct:1,
     baseline:{mode:'linked',rf:17},changeAction:'breed100',changeText:'Bred 100 offspring',watch:'bars',
     explain:'Map distance is defined by recombination: 17 map units means crossing over separates the genes in about 17% of gametes. The other 83% carry the parental combinations, BV or bv. Unlinked genes would give 50%.'},
    {lvl:'ap',q:'You breed 100 offspring from YyRr × YyRr and test them against 9:3:3:1 (df = 3, critical value 7.81). What will the test usually conclude?',choices:['The data fit 9:3:3:1','The data do not fit, so the genes must be linked'],correct:0,
     baseline:{mode:'di',p1d:'YyRr',p2d:'YyRr'},changeAction:'breed100',changeText:'Bred 100 offspring',watch:'bars',
     explain:'These genes really do sort independently, so χ² is usually well below 7.81. About 1 time in 20 it will land above 7.81 by chance alone. That is exactly what p = 0.05 means.'}
  ]
};
BioLab.register(CROSS);
})();
