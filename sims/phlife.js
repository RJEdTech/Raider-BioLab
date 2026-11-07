(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;

/* Acids, bases and buffers in a 50 mL beaker.
   Drops are 0.05 mL of 0.10 M HCl or 0.10 M NaOH (0.005 mmol each).
   pH comes from the full charge balance, solved by bisection on log[H⁺]:
     [H⁺] + [Na⁺] = [OH⁻] + [Cl⁻] + (charge on the buffer's anions),  with Kw = 1.0 × 10⁻¹⁴ (25 °C).
   Blood buffer: HCO₃⁻ 24 mM and dissolved CO₂ 1.2 mM, pKa 6.1 (the value used for blood) and 10.3.
     Sealed beaker: total carbonate is conserved. Breathing on: dissolved CO₂ is held at its starting level, as the lungs do.
   Phosphate buffer: 20 mM total, pKa 2.15, 7.21, 12.32, set to pH 7.20.
   Stomach acid: 0.010 M HCl.
   Enzyme activity: a bell curve around each enzyme's best pH, activity = 100·exp(−((pH − best)/1.2)²). */
const KW=1e-14,V0=50,DROP=0.05,MOLAR=0.1,PER=DROP*MOLAR,MAXD=100;
const SOLS={
  water:{name:'Pure water',short:'pure water',kind:'none',Cl0:0},
  cell:{name:'Phosphate buffer',short:'phosphate buffer',kind:'phos',CT:0.020,pH0:7.20,bName:'HPO₄²⁻',aName:'H₂PO₄⁻',pKa:7.21},
  blood:{name:'Blood buffer',short:'blood buffer',kind:'carb',base:0.024,acid:0.0012,pKa:6.1,pKa2:10.3,bName:'HCO₃⁻',aName:'CO₂',pKaShow:6.1},
  stomach:{name:'Stomach acid',short:'stomach acid',kind:'none',Cl0:0.010}
};
const ENZ={pepsin:{name:'Pepsin',where:'stomach',best:2.0},amylase:{name:'Amylase',where:'saliva',best:6.8},trypsin:{name:'Trypsin',where:'small intestine',best:8.0}};
const W_ENZ=1.2;
const PK=[2.15,7.21,12.32].map(x=>Math.pow(10,-x));
function phosCharge(H){const [a,b,c]=PK,d=H*H*H+a*H*H+a*b*H+a*b*c;return {q:(a*H*H+2*a*b*H+3*a*b*c)/d,f1:a*H*H/d,f2:a*b*H/d};}
function carbAlpha(H,K1,K2){const d=H*H+K1*H+K1*K2;return {a0:H*H/d,a1:K1*H/d,a2:K1*K2/d};}
const fx=p=>Number((p&&p.bufx)||1);

/* Fixed starting composition of a solution at strength f (×1 = normal). */
function recipe(sol,f){const S=SOLS[sol];const R={kind:S.kind,Cl0:S.Cl0||0,Na0:0};
  if(S.kind==='carb'){const K1=Math.pow(10,-S.pKa),K2=Math.pow(10,-S.pKa2),b=S.base*f,a=S.acid*f,H=K1*a/b;
    R.K1=K1;R.K2=K2;R.co2=a;R.CT=a+b+K2*b/H;const al=carbAlpha(H,K1,K2);R.Na0=KW/H+R.CT*(al.a1+2*al.a2)-H;R.H0=H;}
  else if(S.kind==='phos'){const H=Math.pow(10,-S.pH0);R.CT=S.CT*f;R.Na0=KW/H+R.CT*phosCharge(H).q-H;R.H0=H;}
  return R;}
/* Solve the beaker after na drops of acid and nb drops of base. na and nb may be fractional (used for capacity). */
function solve(sol,na,nb,f,lungs){const R=recipe(sol,f),V=V0+DROP*(na+nb);
  const Na=(R.Na0*V0+PER*nb)/V,Cl=(R.Cl0*V0+PER*na)/V,open=R.kind==='carb'&&lungs;
  const CT=R.kind==='none'?0:(open?0:R.CT*V0/V);
  const anion=H=>{if(R.kind==='carb'){if(open){const h=R.K1*R.co2/H;return h+2*R.K2*h/H;}const a=carbAlpha(H,R.K1,R.K2);return CT*(a.a1+2*a.a2);}
    if(R.kind==='phos')return CT*phosCharge(H).q;return 0;};
  const F=x=>{const H=Math.pow(10,x);return H+Na-KW/H-Cl-anion(H);};
  let lo=-15,hi=1;for(let i=0;i<80;i++){const m=(lo+hi)/2;if(F(m)>0)hi=m;else lo=m;}
  const H=Math.pow(10,(lo+hi)/2),out={H,pH:-Math.log10(H),OH:KW/H,V,base:0,acid:0};
  if(R.kind==='carb'){if(open){out.acid=R.co2;out.base=R.K1*R.co2/H;}else{const a=carbAlpha(H,R.K1,R.K2);out.acid=CT*a.a0;out.base=CT*a.a1;}}
  else if(R.kind==='phos'){const q=phosCharge(H);out.acid=CT*q.f1;out.base=CT*q.f2;}
  return out;}
function start(sol,f){return solve(sol,0,0,f,false);}
/* Share of the H⁺ (or OH⁻) you added that did not stay free in the water. */
function takenUp(sol,na,nb,f,lungs){const net=PER*(na-nb);if(Math.abs(net)<1e-12)return NaN;const s0=start(sol,f),s=solve(sol,na,nb,f,lungs);
  if(net>0){const dFree=s.H*s.V-s0.H*V0;return 100*clamp(1-dFree/net,0,1);}
  const dFree=s.OH*s.V-s0.OH*V0;return 100*clamp(1+dFree/net,0,1);}
/* Drops of acid that lower the starting pH by exactly 1. */
function capacity(sol,f,lungs){const t=start(sol,f).pH-1;if(solve(sol,4000,0,f,lungs).pH>t)return Infinity;let lo=0,hi=4000;for(let i=0;i<60;i++){const m=(lo+hi)/2;if(solve(sol,m,0,f,lungs).pH>t)lo=m;else hi=m;}return (lo+hi)/2;}
const enzAct=(e,pH)=>100*Math.exp(-Math.pow((pH-ENZ[e].best)/W_ENZ,2));
function bloodRange(pH){if(pH<6.8)return 'Far too acidic: deadly for blood';if(pH<7.35)return 'Too acidic for blood (acidosis)';if(pH<=7.45)return 'Inside blood’s safe range';if(pH<=7.8)return 'Too basic for blood (alkalosis)';return 'Far too basic: deadly for blood';}
const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
function sci(x){if(!(x>0))return '0';const e=Math.floor(Math.log10(x)+1e-9),m=x/Math.pow(10,e);let ms=m.toFixed(1);if(ms==='10.0')return sci(Math.pow(10,e+1));return ms+' × 10'+String(e).split('').map(c=>SUP[c]).join('');}
function times(r){if(r>=1.05)return Math.round(r)>=1000?Math.round(r).toLocaleString('en-US')+'×':r<10?r.toFixed(1)+'×':Math.round(r).toString()+'×';return '';}
function vs7(H){const r=H/1e-7;if(Math.abs(Math.log10(r))<0.02)return 'Same as pure water';return r>1?times(r)+' more H⁺ than pure water':times(1/r)+' less H⁺ than pure water';}
const fmt2=x=>x.toFixed(2);

/* Universal indicator colors, pH 0 to 14 */
const IND=[[0,'#c81d25'],[3,'#e4572e'],[4.5,'#f28f3b'],[5.5,'#f2c14e'],[6.5,'#c9d24a'],[7,'#5fb34e'],[8,'#2f9e8f'],[9,'#2f6fd0'],[10.5,'#4b3fb5'],[14,'#6a2c91']];
function hex(c){return [1,3,5].map(i=>parseInt(c.slice(i,i+2),16));}
function indColor(pH){pH=clamp(pH,0,14);for(let i=1;i<IND.length;i++){if(pH<=IND[i][0]){const [p0,c0]=IND[i-1],[p1,c1]=IND[i],f=(pH-p0)/(p1-p0),a=hex(c0),b=hex(c1);return 'rgb('+a.map((v,j)=>Math.round(lerp(v,b[j],f))).join(',')+')';}}return IND[IND.length-1][1];}

const now=sim=>solve(sim.p.sol,sim.st.na,sim.st.nb,fx(sim.p),sim.p.lungs);
const curveKey=p=>p.sol+'|'+(p.sol==='blood'?(p.lungs?'L':'S'):'')+'|'+(p.sol==='blood'||p.sol==='cell'?fx(p):1);
function curveLabel(c){let s={water:'Water',cell:'Phosphate',blood:'Blood',stomach:'Stomach acid'}[c.sol];if(c.sol==='blood')s+=c.lungs?', breathing':', sealed';if(c.f!==1&&(c.sol==='blood'||c.sol==='cell'))s+=' ×'+c.f;return s;}
function track(sim){const p=sim.p,s=sim.st,k=curveKey(p),net=s.na-s.nb;sim.curves=sim.curves||{};const c=sim.curves[k]||(sim.curves[k]={sol:p.sol,lungs:!!p.lungs,f:fx(p),lo:0,hi:0,n:Object.keys(sim.curves).length});c.lo=Math.min(c.lo,net);c.hi=Math.max(c.hi,net);c.t=(sim.ctr=(sim.ctr||0)+1);}
function addDrops(sim,n){const s=sim.st,acid=sim.p.reag==='acid',have=acid?s.na:s.nb,m=Math.min(n,MAXD-have);if(m<=0)return;
  if(acid)s.na+=m;else s.nb+=m;s.last={n:m,acid,ph0:s.phBefore!==undefined?s.phBefore:null};
  for(let i=0;i<Math.min(m,6);i++)s.anim.push({d:-i*0.12,acid});track(sim);sim.infoDirty=true;}

const SIM={
  id:'phlife',hash:'phlife',apUnit:1,order:5,kind:'Virtual lab',tab:'Acids, bases and buffers',
  prereq:['waterprops'],next:['enzymes','protein'],
  card:'Drip acid or base into water, blood’s buffer and stomach acid, read the pH meter, and see which enzymes keep working.',
  title:'Acids, bases and pH in living things: the buffer lab',
  lede:{bio:'Add drops of acid or base to a beaker and watch the pH meter. Pure water swings fast. A buffer, like the one in your blood, catches the extra H⁺ and holds the pH steady.',
        honors:'Each pH step is ten times more or less H⁺. Compare a sealed beaker of blood buffer with one where breathing removes CO₂, and see which enzymes still work at each pH.',
        ap:'Track the buffer pair with the Henderson–Hasselbalch equation, pH = pKa + log([base] ÷ [acid]), and measure buffer capacity as the drops it takes to move the pH by 1.'},
  scale:{bio:'A 50 mL beaker on the lab bench, about a quarter of a cup. Each drop is 0.05 mL of 0.1 M acid or base. The zoom shows single ions, far too small to see.',
         ap:'50 mL beaker at 25 °C. One drop = 0.05 mL × 0.10 M = 5.0 × 10⁻⁶ mol of H⁺ or OH⁻. Blood’s buffer here is 24 mM HCO₃⁻ with 1.2 mM CO₂.'},
  timeless:true,animated:true,chChange:0.3,chReveal:2.5,
  controls:[
    {id:'sol',label:'In the beaker',type:'seg',def:'water',lvl:'bio',options:[{v:'water',l:'Pure water'},{v:'cell',l:'Phosphate buffer'},{v:'blood',l:'Blood buffer'},{v:'stomach',l:'Stomach acid'}],
     help:'Phosphate is a main buffer inside your cells. Blood’s main buffer is bicarbonate.',onChange(sim){BioLab.reset(sim);}},
    {id:'reag',label:'Dropper holds',type:'seg',def:'acid',lvl:'bio',options:[{v:'acid',l:'Acid (0.1 M HCl)'},{v:'base',l:'Base (0.1 M NaOH)'}]},
    {id:'lungs',label:'Breathing removes CO₂',type:'toggle',def:false,lvl:'bio',help:'Only matters for blood buffer. On, the lungs keep dissolved CO₂ at its starting level, like your body does.'},
    {id:'enz',label:'Enzyme to test',type:'select',def:'pepsin',lvl:'bio',options:[{v:'pepsin',l:'Pepsin (stomach)'},{v:'amylase',l:'Amylase (saliva)'},{v:'trypsin',l:'Trypsin (small intestine)'}]},
    {id:'bufx',label:'Buffer strength',type:'seg',def:'1',lvl:'ap',options:[{v:'0.5',l:'Half'},{v:'1',l:'Normal'},{v:'2',l:'Double'}],help:'Scales both members of the buffer pair, so the starting pH stays the same.',onChange(sim){BioLab.reset(sim);}}
  ],
  actions:[
    {id:'drop5',label:'Add 5 drops',primary:true,run(sim){addDrops(sim,5);}},
    {id:'drop1',label:'Add 1 drop',run(sim){addDrops(sim,1);}},
    {id:'rinse',label:'Rinse and refill',run(sim){BioLab.reset(sim);}},
    {id:'clear',label:'Clear the graph',run(sim){sim.curves={};sim.ctr=0;track(sim);}}
  ],
  init(sim){const s={na:0,nb:0,anim:[],last:null};return s;},
  afterPrewarm(sim){track(sim);},
  step(sim,dt){const s=sim.st;s.anim.forEach(a=>a.d+=dt);s.anim=s.anim.filter(a=>a.d<0.5);},
  metrics:[
    {id:'ph',label:'pH meter',unit:'',lvl:'bio',min:0,max:14,d:2,fixed:true,get:s=>now(s).pH},
    {id:'na',label:'Acid added',unit:'drops',lvl:'bio',min:0,max:MAXD,d:0,get:s=>s.st.na},
    {id:'nb',label:'Base added',unit:'drops',lvl:'bio',min:0,max:MAXD,d:0,get:s=>s.st.nb},
    {id:'act',label:'Enzyme activity',unit:'% of its best',lvl:'bio',min:0,max:100,d:0,fixed:true,get:s=>enzAct(s.p.enz,now(s).pH)},
    {id:'range',label:'Compared with blood',unit:'',lvl:'bio',text:true,get:s=>bloodRange(now(s).pH)},
    {id:'hconc',label:'H⁺ concentration',unit:'mol/L',lvl:'honors',text:true,get:s=>sci(now(s).H)},
    {id:'vs7',label:'H⁺ compared with pure water',unit:'',lvl:'honors',text:true,get:s=>vs7(now(s).H)},
    {id:'taken',label:'Added H⁺ or OH⁻ taken up',unit:'%',lvl:'honors',min:0,max:100,d:1,get:s=>takenUp(s.p.sol,s.st.na,s.st.nb,fx(s.p),s.p.lungs)},
    {id:'hh',label:'Henderson–Hasselbalch',unit:'',lvl:'ap',text:true,get:s=>{const S=SOLS[s.p.sol];if(S.kind==='none')return 'No buffer pair in this beaker';const r=now(s),q=r.base/r.acid;return 'pH = '+S.pKa+' + log('+(q>=10?q.toFixed(1):q.toFixed(2))+') = '+(S.pKa+Math.log10(q)).toFixed(2);}},
    {id:'cap',label:'Acid drops to lower pH by 1',unit:'',lvl:'ap',text:true,get:s=>{const c=capacity(s.p.sol,fx(s.p),s.p.lungs);return c===Infinity?'Never: these drops are no stronger than 0.1 M':c<1?c.toFixed(3)+' of one drop':Math.round(c).toLocaleString('en-US')+' drops';}}
  ],
  graphs:[{id:'curve',label:'pH as you add drops',custom:true}],
  defaultGraph:'curve',
  plot(sim,ctx,box){const p=sim.p,s=sim.st,C=Object.values(sim.curves||{}).sort((a,b)=>a.n-b.n).slice(-6);
    let lo=-10,hi=30;C.forEach(c=>{lo=Math.min(lo,c.lo);hi=Math.max(hi,c.hi);});lo=Math.floor(lo/10)*10;hi=Math.ceil(hi/10)*10;
    box.T=34;box.H=box.ch-34-40;
    const ax=axes(ctx,box,{xmin:lo,xmax:hi,ymin:0,ymax:14,xl:'← drops of base     drops added     drops of acid →',yl:'pH'});
    ctx.fillStyle=PAL['s3'];ctx.globalAlpha=.18;ctx.fillRect(box.L,ax.Y(7.45),box.W,Math.max(2,ax.Y(7.35)-ax.Y(7.45)));ctx.globalAlpha=1;
    txt(ctx,'blood’s safe range',box.L+box.W-6,ax.Y(7.45)-4,{s:12,c:PAL['muted'],a:'right'});
    const items=[];
    C.forEach((c,i)=>{const col=serColor(i);ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.beginPath();const n=Math.max(2,Math.round((c.hi-c.lo)*2)+1);
      for(let j=0;j<n;j++){const x=lerp(c.lo,c.hi,n===1?0:j/(n-1)),r=solve(c.sol,Math.max(0,x),Math.max(0,-x),c.f,c.lungs);const X=ax.X(x),Y=ax.Y(r.pH);j?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}ctx.stroke();
      items.push({label:curveLabel(c),color:col});
      if(curveKey(p)===curveKey({sol:c.sol,lungs:c.lungs,bufx:c.f})){const r=now(sim);ctx.fillStyle=col;ctx.beginPath();ctx.arc(ax.X(s.na-s.nb),ax.Y(r.pH),5,0,6.29);ctx.fill();}});
    legend(ctx,box.L,16,items.slice(-3));},
  narrate(sim){const p=sim.p,s=sim.st,S=SOLS[p.sol],r=now(sim),r0=start(p.sol,fx(p)),E=ENZ[p.enz],act=enzAct(p.enz,r.pH),hon=atLeast('honors');
    const net=s.na-s.nb,acid=net>0;
    const enzLine=act<10?' '+E.name+', from the '+E.where+', is at only '+act.toFixed(0)+'% here: this pH is far from its best (pH '+E.best+'), so its shape is wrong for the job.':act>80?' '+E.name+' works well at this pH, close to its best (pH '+E.best+').':'';
    if(net===0&&!(s.na||s.nb)){
      if(p.sol==='water')return '<b>Start here:</b> press <b>Add 5 drops</b> and watch the pH meter. Pure water starts at pH 7.00, neutral. Then rinse, switch to <b>Blood buffer</b> and do the same.';
      if(p.sol==='stomach')return '<b>Stomach acid, pH '+fmt2(r.pH)+'.</b> It holds 100,000 times more H⁺ than pure water. That is where pepsin, the stomach’s protein-cutting enzyme, does its work.'+enzLine;
      return '<b>'+S.name+', pH '+fmt2(r.pH)+'.</b> It holds a pair: '+S.bName+' catches extra H⁺, and '+S.aName+' gives up H⁺ to cancel extra OH⁻. Press <b>Add 5 drops</b> to test it.';}
    const d=Math.abs(r.pH-r0.pH),dir=r.pH<r0.pH?'fell':'rose',ion=acid?'H⁺':'OH⁻';
    const tk=takenUp(p.sol,s.na,s.nb,fx(p),p.lungs);
    if(S.kind==='none'&&p.sol==='water')return '<b>Nothing in pure water catches the '+ion+'.</b> The pH '+dir+' from '+fmt2(r0.pH)+' to '+fmt2(r.pH)+(hon?', and that means '+vs7(r.H)+'.':'. Each step on the pH scale is ten times more or less H⁺.')+enzLine;
    if(p.sol==='stomach'){if(acid)return '<b>Stomach acid barely moves</b> ('+fmt2(r0.pH)+' to '+fmt2(r.pH)+'). It is not a buffer: it already holds so much H⁺ that a few more drops add only a little.'+enzLine;
      return '<b>Each OH⁻ meets an H⁺ and makes water.</b> That is neutralization. The pH '+dir+' from '+fmt2(r0.pH)+' to '+fmt2(r.pH)+'. Keep adding base and it jumps once the H⁺ runs out, near 100 drops.'+enzLine;}
    const pair=acid?S.bName+' + H⁺ → '+(p.sol==='blood'?'H₂CO₃ → CO₂ + H₂O':S.aName):S.aName+' + OH⁻ → '+(p.sol==='blood'?'HCO₃⁻ (from H₂CO₃)':S.bName+' + H₂O');
    let lungs='';if(p.sol==='blood'&&acid)lungs=p.lungs?' Breathing carries the extra CO₂ away, so the pair stays balanced.':' The beaker is sealed, so the CO₂ piles up. Turn on <b>Breathing removes CO₂</b> to see what your lungs add.';
    return '<b>The buffer took up '+(tk>=99.95?'more than 99.9':tk.toFixed(1))+'% of the '+ion+' you added</b> ('+pair+'). The pH only '+dir+' from '+fmt2(r0.pH)+' to '+fmt2(r.pH)+'.'+lungs+(d>0.5?' The buffer is running low.':'')+enzLine;},
  tour:[
    {title:'The pH scale counts H⁺',text:{bio:'pH tells you how much H⁺ (hydrogen ion) is in a liquid. Lower pH means more H⁺, more acidic. Each step down the scale means 10 times more H⁺, so pH 5 has 100 times more than pH 7.',
      ap:'pH = −log[H⁺]. Pure water at 25 °C has [H⁺] = 1.0 × 10⁻⁷ mol/L, so pH 7.00. Each unit is a factor of 10, so stomach acid at pH 2 holds 10⁵ times more H⁺ than water.'},focus:[590,10,206,432],pause:true},
    {title:'Acid into pure water',text:'Five drops of acid go into 50 mL of pure water. Watch the meter: the pH falls from 7.00 to about 3.3, and the indicator turns red. That is about 5,000 times more H⁺ from just a quarter of a milliliter.',focus:[0,0,325,450],speed:0.3,setup(sim){BioLab.setValues(sim,{sol:'water',reag:'acid',lungs:false});BioLab.reset(sim);addDrops(sim,5);}},
    {title:'Nothing catches the H⁺',text:'The zoom shows where the added H⁺ went. In pure water every one of them stays free, so all of them count toward the pH.',focus:[325,10,255,245],pause:true},
    {title:'A buffer catches H⁺',text:'Now the same 5 drops go into phosphate buffer, the kind inside your cells. HPO₄²⁻ grabs each H⁺ and becomes H₂PO₄⁻, so the H⁺ no longer floats free. The pH only slips from 7.20 to about 7.16.',focus:[[0,0,325,450],[325,10,255,245]],speed:0.3,setup(sim){BioLab.setValues(sim,{sol:'cell'});BioLab.reset(sim);addDrops(sim,5);}},
    {title:'Blood’s buffer needs your lungs',text:'Blood uses bicarbonate: HCO₃⁻ + H⁺ → H₂CO₃ → CO₂ + H₂O. In a sealed beaker the CO₂ piles up, and 5 drops lower the pH to about 7.24. With breathing on, the lungs carry the CO₂ away and the pH stays near 7.39.',focus:[[0,0,325,450],[325,10,255,245]],speed:0.3,setup(sim){BioLab.setValues(sim,{sol:'blood',lungs:true});BioLab.reset(sim);addDrops(sim,5);}},
    {title:'Enzymes need the right pH',text:'Pepsin cuts proteins in your stomach at pH 2. Here, in blood buffer at pH 7.4, it is at almost 0% of its best, because the wrong pH changes the charges that hold its shape. Amylase and trypsin are built for pH near 7 to 8.',focus:[325,258,255,186],pause:true,setup(sim){BioLab.setValues(sim,{enz:'pepsin'});}},
    {title:'Outside the safe range',text:'Blood must stay between pH 7.35 and 7.45. Thirty drops into the sealed beaker push it down to about 6.8, close to the lowest pH a person can survive. Below 7.35 is acidosis: the extra H⁺ changes charges on proteins, so enzymes and other proteins work less well.',focus:[[0,0,325,450],[590,10,206,432]],speed:0.3,setup(sim){BioLab.setValues(sim,{sol:'blood',lungs:false});BioLab.reset(sim);addDrops(sim,30);}},
    {lvl:'ap',title:'Henderson–Hasselbalch',text:'pH = pKa + log([HCO₃⁻] ÷ [CO₂]) = 6.1 + log(24 ÷ 1.2) = 7.40. A buffer works best when the pH is near its pKa. Blood sits 1.3 units above bicarbonate’s pKa, so it leans on the lungs and kidneys to keep the ratio near 20.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{lungs:false});BioLab.reset(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{sol:'water',reag:'acid',lungs:false,enz:'pepsin'});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'Pure water starts at pH 7.00. You add 5 drops of acid, about a quarter of a milliliter. Where does the pH end up?',
     choices:['About 6.8: a few drops hardly matter','About 3.3: thousands of times more H⁺','It stays at 7, because water is neutral'],correct:1,
     baseline:{sol:'water',reag:'acid'},changeAction:'drop5',changeText:'5 drops of acid added',watch:'curve',
     explain:'Nothing in pure water catches the H⁺, so every one counts. The pH falls to 3.30, which is about 5,000 times more H⁺ than at pH 7. A tiny amount of acid changes unbuffered water a lot.'},
    {lvl:'bio',q:'The phosphate buffer, like the fluid inside your cells, starts at pH 7.20. You add the same 5 drops of acid. What happens?',
     choices:['It falls to about 3.3, the same as pure water','It barely moves, to about 7.16','It rises, because the buffer fights back too hard'],correct:1,
     baseline:{sol:'cell',reag:'acid'},changeAction:'drop5',changeText:'5 drops of acid added',watch:'curve',
     explain:'HPO₄²⁻ catches almost every H⁺ and becomes H₂PO₄⁻. The H⁺ is no longer free, so the pH only slips to 7.16. That steadiness is what a buffer is for.'},
    {lvl:'bio',q:'Pepsin is cutting proteins in stomach acid at pH 2. The same pepsin ends up in blood at pH 7.4. What happens to its activity?',
     choices:['It speeds up, because neutral is gentler','It drops to almost nothing','It stays the same, because pH does not affect enzymes'],correct:1,
     baseline:{sol:'stomach',enz:'pepsin'},change:{sol:'blood'},changeText:'Pepsin moved into blood buffer',watch:'curve',
     explain:'Each enzyme has a pH range it is built for. Pepsin’s best is about pH 2. At 7.4 the charges that hold its shape change, the active site no longer fits, and its activity falls to about 0%.'},
    {lvl:'honors',q:'In a sealed beaker, 5 drops of acid push blood buffer from 7.40 down to about 7.24. Now breathing removes the CO₂. You add the same 5 drops. The pH…',
     choices:['falls the same, to about 7.24','stays near 7.39','falls further, below 7.0'],correct:1,
     baseline:{sol:'blood',reag:'acid',lungs:true},changeAction:'drop5',changeText:'5 drops of acid, breathing on',watch:'curve',
     explain:{honors:'HCO₃⁻ + H⁺ → H₂CO₃ → CO₂ + H₂O. In the sealed beaker the CO₂ builds up and the base-to-acid ratio drops from 20 to about 14. Your lungs breathe the CO₂ out, so the ratio barely changes and the pH stays near 7.39. That is one reason you breathe harder during hard exercise.'}},
    {lvl:'honors',q:'You add 5 drops of base (NaOH) to the phosphate buffer at pH 7.20. What does the buffer do?',
     choices:['Nothing: buffers only stop acids','It takes up the OH⁻ too, so the pH barely rises','It turns the base into more acid, so the pH falls'],correct:1,
     baseline:{sol:'cell',reag:'base'},changeAction:'drop5',changeText:'5 drops of base added',watch:'curve',
     explain:{honors:'A buffer has two members. H₂PO₄⁻ gives up H⁺, which joins OH⁻ to make water, leaving HPO₄²⁻. The pH only rises to about 7.24. Pure water would jump to about 10.7.'}},
    {lvl:'honors',q:'Rain at pH 5.0 lands on your skin. Your blood is at pH 7.4. How many times more H⁺ does the rain have?',
     choices:['About 2.4 times','About 25 times','About 250 times','About 2,500 times'],correct:2,instant:true,
     explain:{honors:'The difference is 2.4 pH units, and each unit is a factor of 10. So 10^2.4 ≈ 251, about 250 times more H⁺.'}},
    {lvl:'ap',q:'You double the phosphate buffer’s strength (40 mM instead of 20 mM). Then you add 5 drops of acid. Compared with the normal buffer, the pH change is…',
     choices:['about twice as big','about the same','about half as big'],correct:2,
     baseline:{sol:'cell',reag:'acid',bufx:'2'},changeAction:'drop5',changeText:'5 drops into double-strength buffer',watch:'curve',
     explain:{ap:'The same 0.025 mmol of H⁺ shifts a pair that is twice as large, so log([base] ÷ [acid]) changes about half as much: 0.022 pH units instead of 0.043. Buffer capacity grows with concentration; the starting pH does not.'}},
    {lvl:'ap',q:'Blood has 24 mM HCO₃⁻ and 1.2 mM CO₂ (pKa 6.1). Someone holds their breath until the CO₂ doubles to 2.4 mM, and the HCO₃⁻ stays at 24 mM. What is the blood pH?',
     choices:['7.10','7.40','6.80','7.70'],correct:0,instant:true,
     explain:{ap:'pH = 6.1 + log(24 ÷ 2.4) = 6.1 + log(10) = 7.10. That is respiratory acidosis: too little breathing leaves CO₂ in the blood, which lowers the pH.'}},
    {lvl:'ap',q:'In a sealed beaker the blood buffer moves more than the phosphate buffer for the same 5 drops (about −0.16 vs. −0.04), even though it holds more buffer. Why?',
     choices:['Its pKa (6.1) is far below 7.4, so its acid member, CO₂, is small and fills up fast','Bicarbonate cannot react with H⁺','Phosphate is a stronger acid, so it adds H⁺ of its own'],correct:0,instant:true,
     explain:{ap:'At pH 7.4 the ratio HCO₃⁻ : CO₂ is 20 : 1, so only 1.2 mM of CO₂ is there. 0.5 mM of new acid raises that by 40%, and the log ratio moves a lot. Phosphate sits right at its pKa (7.21), where both members are large. In the body, the lungs fix this by removing CO₂.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Which liquid holds its pH steadiest when acid is added?</p><ol><li>Choose <b>Pure water</b> with acid in the dropper. Press <b>Record trial</b> at 0 drops.</li><li>Press <b>Add 5 drops</b> and record a trial. Repeat until you reach 30 drops.</li><li>Press <b>Rinse and refill</b>, switch to <b>Phosphate buffer</b>, and repeat. Then do <b>Blood buffer</b>.</li><li>The graph draws each liquid’s line for you. Copy it, or plot drops (x) against pH (y).</li></ol><p>Write a claim: which liquid is the best buffer? Use the pH change after 30 drops for each one as your evidence.</p>',
       honors:'<p><b>Question:</b> How do buffers handle both acid and base, and what do the lungs add?</p><ol><li>For pure water and phosphate buffer, record the pH after 0, 10, 20 and 30 drops of acid. Rinse, then repeat with base.</li><li>For blood buffer, run 30 drops of acid with <b>Breathing removes CO₂</b> off, then again with it on.</li><li>Record the <b>H⁺ compared with pure water</b> readout at your lowest pH.</li></ol><p>Explain your blood results with the reaction HCO₃⁻ + H⁺ → H₂CO₃ → CO₂ + H₂O, and connect them to why you breathe harder in a sprint.</p>',
       ap:'<p><b>Question:</b> What sets a buffer’s capacity?</p><ol><li>For phosphate buffer at Half, Normal and Double strength, record the pH after 10, 20 and 30 drops of acid, and the <b>Acid drops to lower pH by 1</b> readout.</li><li>Repeat for blood buffer, sealed and breathing.</li><li>Use the <b>Henderson–Hasselbalch</b> readout to check one data point by hand.</li></ol><p><b>Claim–evidence–reasoning:</b> explain how concentration and the distance between pH and pKa each affect buffer capacity, and why blood depends on the lungs and kidneys as well as its buffer.</p>'},
  terms:[{t:'pH',d:'A measure of H⁺ in a liquid, from 0 to 14. Lower pH means more H⁺. Each step is ten times more or less H⁺.'},{t:'Acid',d:'A substance that adds H⁺ to a solution, such as stomach acid (HCl). Acids have pH below 7.'},{t:'Base',d:'A substance that takes up H⁺ or adds OH⁻, such as baking soda or NaOH. Bases have pH above 7.'},{t:'Neutral',d:'pH 7: equal H⁺ and OH⁻, like pure water.'},{t:'Buffer',d:'A pair of chemicals that keeps pH steady by taking up extra H⁺ or OH⁻.'},{t:'Denature',d:'To lose the folded shape that lets a protein or enzyme work, for example at the wrong pH.'},
    {lvl:'honors',t:'Hydroxide ion (OH⁻)',d:'The ion bases add. H⁺ + OH⁻ → H₂O.'},{lvl:'honors',t:'Bicarbonate (HCO₃⁻)',d:'Blood’s main buffer. It takes up H⁺ to make carbonic acid, which breaks into CO₂ and water.'},{lvl:'honors',t:'Acidosis / alkalosis',d:'Blood pH below 7.35 or above 7.45.'},{lvl:'honors',t:'Neutralization',d:'An acid and a base reacting to make water. Unlike buffering, it keeps going until one runs out.'},
    {lvl:'ap',t:'pKa',d:'The pH at which a buffer’s acid and base members are equal. A buffer works best within about 1 pH unit of its pKa.'},{lvl:'ap',t:'Henderson–Hasselbalch equation',d:'pH = pKa + log([base] ÷ [acid]).'},{lvl:'ap',t:'Buffer capacity',d:'How much acid or base a buffer can take before the pH moves by 1. It grows with buffer concentration.'}],
  about:'<p>Each drop is 0.05 mL of 0.10 M HCl or NaOH added to 50 mL, with the small change in volume included. The pH comes from the full charge balance, solved exactly: [H⁺] + [Na⁺] = [OH⁻] + [Cl⁻] + the charge on the buffer’s anions, with K<sub>w</sub> = 1.0 × 10⁻¹⁴.</p><p><b>Blood buffer</b> is 24 mM HCO₃⁻ and 1.2 mM dissolved CO₂, with pKa 6.1 (the value used for blood at 37 °C) and 10.3. Sealed: the total carbonate stays in the beaker. Breathing on: dissolved CO₂ is held at 1.2 mM, the way the lungs hold it. <b>Phosphate buffer</b> is 20 mM total phosphate at pH 7.20 (pKa 2.15, 7.21 and 12.32). <b>Stomach acid</b> is 0.010 M HCl.</p><p>Simplified: real blood also buffers with hemoglobin and plasma proteins, and the kidneys adjust HCO₃⁻ over hours, so real blood resists acid better than this beaker. Pure water here has no dissolved CO₂; real distilled water left open to air reads about pH 5.6. Enzyme activity is a bell curve, 100 × e<sup>−((pH − best) ÷ 1.2)²</sup>, around each enzyme’s usual best pH (pepsin 2.0, amylase 6.8, trypsin 8.0). Real pH curves are often lopsided, and some enzymes recover when the pH is restored while others do not.</p>',
  thumbSetup(sim){BioLab.setValues(sim,{sol:'blood',lungs:true});BioLab.reset(sim);addDrops(sim,10);},
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st,S=SOLS[p.sol],r=now(sim),r0=start(p.sol,fx(p)),hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const acidDrop=p.reag==='acid';
    /* ---- dropper bottle ---- */
    const bx=110;ctx.fillStyle=acidDrop?'#b03a48':'#3a5fb0';rr(ctx,bx-52,10,104,48,10);ctx.fill();
    txt(ctx,acidDrop?'0.1 M HCl':'0.1 M NaOH',bx,40,{s:13*k,w:700,c:'#fff',a:'center'});
    ctx.fillStyle=PAL['cv-glass'];ctx.beginPath();ctx.moveTo(bx-9,58);ctx.lineTo(bx+9,58);ctx.lineTo(bx+2,92);ctx.lineTo(bx-2,92);ctx.closePath();ctx.fill();
    txt(ctx,acidDrop?'acid':'base',bx+64,40,{s:12*k,c:PAL['cv-soft']});
    /* ---- beaker ---- */
    const BX=30,BY=160,BW=180,BH=240,LY=212,col=indColor(r.pH);
    ctx.fillStyle=col;ctx.globalAlpha=.8;rr(ctx,BX+4,LY,BW-8,BY+BH-LY-4,8);ctx.fill();ctx.globalAlpha=1;
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(BX,BY);ctx.lineTo(BX,BY+BH-10);ctx.quadraticCurveTo(BX,BY+BH,BX+10,BY+BH);ctx.lineTo(BX+BW-10,BY+BH);ctx.quadraticCurveTo(BX+BW,BY+BH,BX+BW,BY+BH-10);ctx.lineTo(BX+BW,BY);ctx.stroke();
    for(let i=1;i<=4;i++){const y=BY+BH-i*44;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(BX,y);ctx.lineTo(BX+14,y);ctx.stroke();}
    /* falling drops */
    s.anim.forEach(a=>{if(a.d<0)return;const f=clamp(a.d/0.3,0,1),y=lerp(96,LY,f*f);if(f<1){ctx.fillStyle=a.acid?'#b03a48':'#3a5fb0';ctx.beginPath();ctx.arc(bx,y,5,0,6.29);ctx.fill();}
      else{const g=(a.d-0.3)/0.2;ctx.strokeStyle=PAL['cv-ink'];ctx.globalAlpha=clamp(1-g,0,1);ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(bx,LY,6+g*26,2+g*5,0,0,6.29);ctx.stroke();ctx.globalAlpha=1;}});
    /* probe and meter */
    const MX=222,MY=96;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(MX+20,MY+56);ctx.quadraticCurveTo(MX+10,MY+80,172,MY+86);ctx.lineTo(172,BY+BH-30);ctx.stroke();
    ctx.fillStyle=PAL['cv-soft'];rr(ctx,166,BY+BH-48,12,26,4);ctx.fill();
    ctx.fillStyle=PAL['card'];rr(ctx,MX,MY,96,58,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
    txt(ctx,'pH meter',MX+48,MY+18,{s:12*k,c:PAL['cv-soft'],a:'center'});txt(ctx,fmt2(r.pH),MX+48,MY+48,{s:22*Math.min(k,1.4),w:800,a:'center'});
    txt(ctx,'50 mL '+S.short,BX+BW/2,BY+BH+28,{s:13*k,w:700,a:'center'});
    if(p.sol==='blood')txt(ctx,p.lungs?'breathing: CO₂ removed':'sealed: CO₂ stays',BX+BW/2,BY+BH+46,{s:12*k,c:PAL['cv-soft'],a:'center'});
    /* ---- zoom: where the added ions went ---- */
    const ZX=330,ZY=12,ZW=248,ZH=240;ctx.fillStyle=PAL['cv-bg2'];rr(ctx,ZX,ZY,ZW,ZH,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
    const net=s.na-s.nb,ion=net<0?'OH⁻':'H⁺';
    txt(ctx,'Where the '+ion+' goes',ZX+ZW/2,ZY+22,{s:13*k,w:700,a:'center'});
    if(S.kind!=='none'){const tot=r0.base+r0.acid,bw=ZW-40;
      [[S.bName+(hon?' '+(r.base*1000).toFixed(1)+' mM':''),r.base,PAL['cv-sub']],[S.aName+(hon?' '+(r.acid*1000).toFixed(1)+' mM':''),r.acid,PAL['cv-prod']]].forEach(([l,v,c],i)=>{const y=ZY+44+i*34;
        ctx.fillStyle=PAL['card'];rr(ctx,ZX+20,y,bw,12,6);ctx.fill();ctx.fillStyle=c;rr(ctx,ZX+20,y,Math.max(3,bw*clamp(v/tot,0,1)),12,6);ctx.fill();
        txt(ctx,l,ZX+20,y+28,{s:12*k,c:PAL['cv-soft']});});}
    else txt(ctx,p.sol==='water'?'No buffer here':'No buffer, lots of H⁺',ZX+ZW/2,ZY+64,{s:12*k,c:PAL['cv-soft'],a:'center'});
    const tk=takenUp(p.sol,s.na,s.nb,fx(p),p.lungs),nIon=10;
    if(Number.isFinite(tk)){const nFree=Math.round(nIon*(1-tk/100)),y0=ZY+150;
      for(let i=0;i<nIon;i++){const x=ZX+30+i*21,free=i<nFree,jig=RM?0:Math.sin(t*2+i)*2;
        if(free){ctx.fillStyle=net<0?PAL['s2']:PAL['cv-h'];ctx.beginPath();ctx.arc(x,y0-14+jig,7,0,6.29);ctx.fill();}
        else{ctx.fillStyle=S.kind==='none'?PAL['s2']:PAL['cv-sub'];ctx.beginPath();ctx.arc(x,y0+18,7,0,6.29);ctx.fill();ctx.fillStyle=net<0?PAL['s2']:PAL['cv-h'];ctx.beginPath();ctx.arc(x,y0+8,4.5,0,6.29);ctx.fill();}}
      txt(ctx,nFree+' of 10 still free',ZX+30,y0-30,{s:12*k,w:700,c:PAL['cv-ink']});
      txt(ctx,(nIon-nFree)+' of 10 '+(S.kind==='none'?'made water':'caught'),ZX+30,y0+46,{s:12*k,w:700,c:PAL['cv-ink']});
      if(hon)txt(ctx,(tk>=99.95?'over 99.9':tk.toFixed(1))+'% taken up',ZX+30,y0+66,{s:12*k,c:PAL['cv-soft']});}
    else txt(ctx,'Add drops to see.',ZX+ZW/2,ZY+170,{s:12*k,c:PAL['cv-soft'],a:'center'});
    /* ---- enzyme panel ---- */
    const EX=330,EY=262,EW=248,EH=176,E=ENZ[p.enz],act=enzAct(p.enz,r.pH);ctx.fillStyle=PAL['cv-bg2'];rr(ctx,EX,EY,EW,EH,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
    txt(ctx,E.name+' in this beaker',EX+EW/2,EY+22,{s:13*k,w:700,a:'center'});
    txt(ctx,'works best at pH '+E.best.toFixed(1),EX+EW/2,EY+26+16*k,{s:12*k,c:PAL['cv-soft'],a:'center'});
    const cx=EX+62,cy=EY+108,u=1-act/100;ctx.fillStyle=PAL['cv-enz'];ctx.beginPath();
    for(let i=0;i<=40;i++){const a=i/40*6.283,notch=(a<0.45||a>5.83)?(1-u)*14:0,wob=u*9*Math.sin(a*5+(RM?0:t*1.5)),rad=34-notch+wob;const x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();
    txt(ctx,act>50?'active site fits':'shape distorted',cx,cy+56,{s:12*k,c:PAL['cv-soft'],a:'center'});
    const ax0=EX+118,aw=EW-134;ctx.fillStyle=PAL['card'];rr(ctx,ax0,EY+92,aw,16,8);ctx.fill();ctx.fillStyle=act>50?PAL['s3']:act>10?PAL['s4']:PAL['s1'];rr(ctx,ax0,EY+92,Math.max(4,aw*act/100),16,8);ctx.fill();
    txt(ctx,'Activity '+act.toFixed(0)+'%',ax0,EY+132,{s:13*k,w:700});
    /* ---- pH scale ---- */
    const SX=640,SY0=34,SY1=416,Y=ph=>lerp(SY0,SY1,ph/14);
    txt(ctx,'pH scale',SX+30,22,{s:13*k,w:700});
    for(let i=0;i<70;i++){const a=i/70*14,b=(i+1)/70*14;ctx.fillStyle=indColor((a+b)/2);ctx.fillRect(SX,Y(a),24,Y(b)-Y(a)+0.5);}
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(SX,SY0,24,SY1-SY0);
    for(let i=0;i<=14;i+=2)txt(ctx,String(i),SX-8,Y(i)+4,{s:12*k,c:PAL['cv-soft'],a:'right'});
    
    const marks=[{v:2.0,l:'Stomach'},{v:6.8,l:'Saliva'},{v:7.4,l:'Blood'},{v:8.0,l:'Intestine'}];if(hon)marks.push({v:4.7,l:'Lysosome'});
    marks.push({v:r.pH,l:'Now '+fmt2(r.pH),now:true});
    marks.sort((a,b)=>a.v-b.v);const gap=16*k;let last=-1e9;marks.forEach(m=>{m.y=Math.max(Y(m.v),last+gap);last=m.y;});
    const over=last-(SY1+8);if(over>0)marks.forEach(m=>m.y-=over*(m.y-SY0)/(last-SY0));
    marks.forEach(m=>{ctx.strokeStyle=m.now?PAL['cv-ink']:PAL['cv-soft'];ctx.lineWidth=m.now?2.5:1;ctx.beginPath();ctx.moveTo(SX+(m.now?-6:24),Y(m.v));ctx.lineTo(SX+30,Y(m.v));ctx.lineTo(SX+38,m.y);ctx.stroke();
      if(m.now){ctx.font='700 '+12*k+'px '+FONT;const w=ctx.measureText(m.l).width+12*k*1.1;pill(ctx,m.l,SX+40+w/2,m.y,PAL['cv-ink'],PAL['cv-bg'],12*k);}else txt(ctx,m.l,SX+42,m.y+4,{s:12*k,c:PAL['cv-ink']});});
    if(ap)txt(ctx,'[H⁺] = 10^−pH',SX+30,440,{s:11*k,c:PAL['cv-soft']});
  }
};
SIM._chem={solve,start,takenUp,capacity,enzAct,recipe,bloodRange,vs7,sci,SOLS,ENZ,PER};
BioLab.register(SIM);
})();
