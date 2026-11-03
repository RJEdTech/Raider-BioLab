(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;
/* Epinephrine → GPCR → Gs → adenylyl cyclase → cAMP → PKA → phosphorylase kinase → glycogen phosphorylase → glucose.
   Each step is a first-order activation/deactivation ODE. */
const NREC=5000;              // β2-adrenergic receptors per liver cell (order of magnitude)
const GMAX=25;                // million glucose molecules per second at full glycogen phosphorylase activity
const UNITS=[90,350];         // x of each receptor / G protein / adenylyl cyclase unit
const ROWS={pka:{y:282,n:4,x0:150,dx:110},phk:{y:340,n:8,x0:95,dx:62},gp:{y:398,n:16,x0:40,dx:36}};

/* ---------- Close-up: one signal, one cause at a time ----------
   Phases (s at 1x): 0 hormone arrives, 1 binds -> receptor changes shape, 2 receptor -> G protein swaps GDP for GTP,
   3 alpha-GTP slides to adenylyl cyclase (the bridge), 4 cyclase turns ATP into cAMP, 5 cAMP switches on PKA, 6 switch-off. */
const CU=[2.5,2.5,3,3.5,3.5,3,3.5],CU_T=CU.reduce((a,b)=>a+b,0);
const CHAIN=[['Epinephrine','binds receptor'],['Receptor','changes shape'],['G protein','GDP → GTP (on)'],['α + GTP slides','to cyclase'],['Cyclase makes','cAMP from ATP'],['cAMP switches','on PKA']];
const CU_TXT=[
 '<b>Watch one signal.</b> An epinephrine molecule drifts through the blood toward the receptor. It cannot get into the cell, so the message has to pass through the receptor.',
 '<b>Binding → shape change.</b> Epinephrine fits the pocket on the outside of the receptor. <b>Because</b> it bound, the receptor changes shape on the inside of the membrane (red glow).',
 '<b>Shape change → G protein switched on.</b> The reshaped receptor grabs the G protein. <b>So</b> the G protein lets go of GDP and picks up GTP, and GTP switches it on.',
 '<b>The bridge.</b> Holding GTP, the α part of the G protein breaks away and slides along the inside of the membrane to adenylyl cyclase. The receptor and the enzyme never touch: the α part carries the message between them.',
 '<b>G protein → adenylyl cyclase → cAMP.</b> Docking switches adenylyl cyclase on. <b>So</b> it turns ATP into cAMP again and again: one signal becomes many second messengers.',
 '<b>cAMP → protein kinase A.</b> cAMP binds protein kinase A and switches it on. PKA starts the kinase cascade that ends with glucose pouring into the blood. Choose <b>Whole pathway</b> to see the cascade multiply.',
 '<b>Switching off.</b> The α part breaks its GTP down to GDP, which switches it off, so it lets go of the cyclase and returns. Epinephrine leaves the receptor. No new cAMP is made and the cell resets for the next signal.'];
const lerp=(a,b,u)=>a+(b-a)*u,ease=u=>u<=0?0:u>=1?1:u*u*(3-2*u);
function cuPhase(t){let a=0;for(let i=0;i<CU.length;i++){if(t<a+CU[i])return [i,(t-a)/CU[i]];a+=CU[i];}return [CU.length-1,1];}
function drawClose(sim,ctx,vdt,k,t){
  const p=sim.p,v=sim.vis,R=Math.random,sm=k>=1.3,jit=RM?0:1;
  if(!v.cu)v.cu={t:0,camp:[],mode:''};const c=v.cu;
  const mode=p.tox?'tox':p.epi<0.05?'none':p.blk?'blk':'run';
  if(c.mode!==mode){c.mode=mode;c.t=0;}
  c.t+=vdt;if(mode==='run'&&c.t>=CU_T)c.t-=CU_T;
  const [ph,u]=mode==='run'?cuPhase(c.t):[mode==='tox'?4:0,0];c.ph=ph;
  const RX=170,GX=300,CX=610,PX=470,PY=338;
  // phase-derived state
  let lig=null,sc=0,gb=GX,ax=GX+44,gtp=false,cyc=false,pka=false,fade=1;
  if(mode==='run'){
    if(ph===0)lig=[lerp(RX+150,RX,ease(u)),lerp(24,124,ease(u))];else if(ph<6)lig=[RX,124];else lig=[lerp(RX,RX-110,ease(u)),lerp(124,30,ease(u))];
    sc=ph===1?ease(u):ph>=2&&ph<=5?1:ph===6?1-ease(u):0;
    gb=ph===2?lerp(GX,262,ease(Math.min(1,u*2))):ph>=3&&ph<=5?262:ph===6?lerp(262,GX,ease(u)):GX;
    ax=ph<=2?gb+44:ph===3?lerp(262+44,CX-50,ease(u)):ph<=5?CX-50:lerp(CX-50,GX+44,ease(u));
    gtp=(ph===2&&u>0.55)||(ph>=3&&ph<=5)||(ph===6&&u<0.25);
    cyc=ph===4||ph===5||(ph===3&&u>0.95)||(ph===6&&u<0.25);
    pka=(ph===5&&u>0.45)||(ph===6&&u<0.5);
    fade=ph===6?1-u:1;
  }else if(mode==='tox'){ax=CX-50;gtp=true;cyc=true;pka=c.t>3;}
  // backgrounds
  ctx.fillStyle=PAL['cv-ims'];ctx.fillRect(0,0,800,150);
  ctx.fillStyle=PAL['cv-matrix'];ctx.fillRect(0,222,800,228);
  ctx.fillStyle=PAL['cv-tail'];ctx.fillRect(0,150,800,72);
  ctx.fillStyle=PAL['cv-head'];for(let x=7;x<800;x+=14){ctx.beginPath();ctx.arc(x,154,6,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(x,218,6,0,6.29);ctx.fill();}
  txt(ctx,'BLOOD (outside the cell)',12,22,{s:12*k,w:700,c:PAL['cv-soft']});
  txt(ctx,'INSIDE THE LIVER CELL',12,382,{s:12*k,w:700,c:PAL['cv-soft']});
  if(!sm)txt(ctx,'Close-up of one receptor. A real cell has thousands.',790,22,{s:11*k,c:PAL['cv-soft'],a:'right'});
  txt(ctx,'Cell membrane',790,191,{s:11*k,w:600,c:PAL['cv-soft'],a:'right'});
  // receptor: 7 helices; when bound the inner ends spread (shape change)
  for(let j=0;j<7;j++){const x0=RX-45+j*15,top=sc*(j-3)*-0.8,bot=sc*(j-3)*3.2;
    ctx.fillStyle=sc>0.5?'#2f6fb5':'#5a7397';ctx.beginPath();ctx.moveTo(x0+top,136);ctx.lineTo(x0+top+11,136);ctx.lineTo(x0+bot+11,234);ctx.lineTo(x0+bot,234);ctx.closePath();ctx.fill();}
  if(sc>0){ctx.save();ctx.globalAlpha=0.45*sc;ctx.fillStyle='#e0402c';ctx.beginPath();ctx.ellipse(RX,240,58,11,0,0,6.29);ctx.fill();ctx.restore();}
  // ligand / blocker
  const dia=(x,y,r,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*0.8,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r*0.8,y);ctx.closePath();ctx.fill();};
  if(mode==='blk'){ctx.fillStyle='#7b3fe4';rr(ctx,RX-11,112,22,22,4);ctx.fill();txt(ctx,'beta blocker',RX+18,118,{s:11*k,w:700,c:'#6a32d0'});
    const bx=RX+70+Math.sin(t*1.7)*28,by=70+Math.cos(t*2.3)*14;dia(bx,by,13,'#e08a00');txt(ctx,'epinephrine can’t bind',bx+18,by+4,{s:11*k,c:PAL['cv-soft']});}
  if(lig){dia(lig[0],lig[1],13,'#e08a00');if(ph===0||ph===6)txt(ctx,'epinephrine',lig[0]+16,lig[1]+4,{s:11*k,w:700,c:'#b36b00'});}
  // G protein: beta-gamma + alpha
  ctx.fillStyle='#8a8f99';ctx.beginPath();ctx.ellipse(gb,242,20,15,0,0,6.29);ctx.fill();txt(ctx,'βγ',gb,243,{s:10*k,w:700,c:'#fff',a:'center',b:'middle'});
  if((ph===3||ph===4||ph===5)&&mode==='run'){ctx.save();ctx.strokeStyle='#9e1b32';ctx.lineWidth=2.5;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(gb+46,256);ctx.quadraticCurveTo((gb+ax)/2,282,ax-6,258);ctx.stroke();ctx.restore();
    if(ph===3)txt(ctx,'α carries the signal to the enzyme',446,308,{s:11*k,w:700,c:'#9e1b32',a:'center'});}
  ctx.fillStyle=gtp?'#2a9d6a':'#7aa58f';ctx.beginPath();ctx.ellipse(ax,240,22,16,0,0,6.29);ctx.fill();
  txt(ctx,'α',ax-12,236,{s:10*k,w:700,c:gtp?'#fff':'#17402c',a:'center',b:'middle'});
  txt(ctx,gtp?'GTP':'GDP',ax+5,243,{s:10*k,w:800,c:gtp?'#fff':'#17402c',a:'center',b:'middle'});
  if(mode==='run'&&ph===2){const a=ease((u-0.15)/0.4);if(a>0&&a<1){ctx.globalAlpha=1-a;ctx.fillStyle='#7aa58f';ctx.beginPath();ctx.arc(ax+10+a*40,252+a*50,10,0,6.29);ctx.fill();txt(ctx,'GDP',ax+10+a*40,253+a*50,{s:8.5*k,w:800,c:'#17402c',a:'center',b:'middle'});ctx.globalAlpha=1;}
    const b=ease((u-0.3)/0.3);if(b>0&&b<1){ctx.fillStyle='#2a9d6a';ctx.beginPath();ctx.arc(ax-30+b*30,320-b*76,10,0,6.29);ctx.fill();txt(ctx,'GTP',ax-30+b*30,321-b*76,{s:8.5*k,w:800,c:'#fff',a:'center',b:'middle'});}}
  // adenylyl cyclase
  ctx.fillStyle=cyc?'#c2572a':'#9a7666';rr(ctx,CX-28,128,56,98,10);ctx.fill();rr(ctx,CX-36,220,72,36,10);ctx.fill();
  if(cyc){ctx.save();ctx.strokeStyle='#ffb36b';ctx.lineWidth=3;rr(ctx,CX-36,220,72,36,10);ctx.stroke();ctx.restore();}
  // ATP in, cAMP out
  if(cyc){const a=(t*0.8)%1;ctx.globalAlpha=1-a*0.6;ctx.fillStyle='#d97706';rr(ctx,CX+70-a*62,316-a*52,30,15,7);ctx.fill();txt(ctx,'ATP',CX+85-a*62,324-a*52,{s:8.5*k,w:800,c:'#fff',a:'center',b:'middle'});ctx.globalAlpha=1;
    if(!sm)txt(ctx,'ATP → cAMP',790,272,{s:11*k,w:700,c:PAL['cv-ink'],a:'right'});
    v.cu.acc=(v.cu.acc||0)+vdt*7;while(v.cu.acc>=1){v.cu.acc--;c.camp.push({x:CX+(R()-.5)*40,y:262,vx:(R()-.5)*40,vy:25+R()*25,a:0});}}
  for(const q of c.camp){const toP=pka||(mode==='run'&&ph===5);
    if(toP){q.vx+=(PX+(R()-.5)*60-q.x)*1.2*vdt;q.vy+=(PY-q.y)*1.2*vdt;}else{q.vx+=(R()-.5)*240*vdt;q.vy+=(R()-.5)*240*vdt;}
    const sp=Math.hypot(q.vx,q.vy);if(sp>60){q.vx*=60/sp;q.vy*=60/sp;}q.x+=q.vx*vdt*jit;q.y+=q.vy*vdt*jit;q.x=clamp(q.x,300,780);q.y=clamp(q.y,258,370);
    q.a=Math.min(fade,q.a+vdt*3);ctx.globalAlpha=clamp(q.a,0,1);ctx.fillStyle='#1f9d55';ctx.beginPath();for(let j=0;j<6;j++){const an=j*Math.PI/3;ctx[j?'lineTo':'moveTo'](q.x+Math.cos(an)*6,q.y+Math.sin(an)*6);}ctx.closePath();ctx.fill();}
  ctx.globalAlpha=1;c.camp=c.camp.filter(q=>q.a>0.02||fade>=1);if(c.camp.length>60)c.camp.splice(0,c.camp.length-60);if(!cyc&&mode!=='run')c.camp.length=0;
  if(c.camp.length&&!sm)txt(ctx,'cAMP (second messenger)',790,362,{s:11*k,w:700,c:'#1f7a45',a:'right'});
  // protein kinase A
  ctx.fillStyle=pka?'#3f6fb0':'#9fb3cf';rr(ctx,PX-40,PY-16,80,32,9);ctx.fill();
  if(pka){ctx.fillStyle='#f2b705';ctx.beginPath();ctx.arc(PX+36,PY-14,8,0,6.29);ctx.fill();txt(ctx,'P',PX+36,PY-13.5,{s:10*k,w:800,c:'#3a2c00',a:'center',b:'middle'});
    if(!sm)txt(ctx,'on → kinase cascade → glucose released',PX+54,PY+4,{s:11*k,w:700,c:'#3f6fb0'});}
  // labels (same names as the whole-pathway view)
  const badge=(n,x,y)=>{ctx.fillStyle='#9e1b32';ctx.beginPath();ctx.arc(x,y,7.5*k,0,6.29);ctx.fill();txt(ctx,String(n),x,y+0.5*k,{s:10*k,w:800,c:'#fff',a:'center',b:'middle'});};
  const tag=(n,s_,x,y,a)=>{const sz=12*k;ctx.font='700 '+sz+'px '+FONT;const tw=ctx.measureText(s_).width,bw=18*k,x0=a==='center'?x-(tw+bw)/2:a==='right'?x-tw-bw:x;badge(n,x0+7.5*k,y-sz*0.35);txt(ctx,s_,x0+bw,y,{s:sz,w:700});};
  tag(1,sm?'Receptor':'Receptor (GPCR)',RX,104,'center');
  tag(2,'G protein',gb,sm?290:284,'center');
  tag(3,'Adenylyl cyclase',CX,sm?112:116,'center');
  tag(4,sm?'PKA':'Protein kinase A',PX-48,PY+5,'right');
  // cause -> effect chain
  let cur=-1;if(mode==='run')cur=ph===0?0:ph===1?(u<0.4?0:1):ph===6?-1:ph;else if(mode==='tox')cur=5;
  const n=CHAIN.length,gap=14,bw=(776-gap*(n-1))/n,by=392,bh=44,fs=Math.min(10.5*k,13);
  CHAIN.forEach((st,i)=>{const x=12+i*(bw+gap);let fill,ink,stroke;
    const done=mode==='run'?(cur>i||(ph===6&&u<0.15)):mode==='tox'?i>=2:false,now=i===cur||(mode==='tox'&&i>=3);
    const blocked=mode==='blk'&&i===0;
    if(now){fill='#9e1b32';ink='#fff';}else if(done){fill='rgba(158,27,50,0.16)';ink=PAL['cv-ink'];}else{fill='rgba(128,128,128,0.08)';ink=PAL['cv-soft'];}
    ctx.fillStyle=fill;rr(ctx,x,by,bw,bh,8);ctx.fill();ctx.strokeStyle=blocked?'#6a32d0':now||done?'#9e1b32':PAL['cv-soft'];ctx.lineWidth=blocked?2.5:1;rr(ctx,x,by,bw,bh,8);ctx.stroke();
    txt(ctx,blocked?'✕ blocked':st[0],x+bw/2,by+17,{s:fs,w:700,c:blocked?'#6a32d0':ink,a:'center'});txt(ctx,st[1],x+bw/2,by+33,{s:fs,w:500,c:ink,a:'center'});
    if(i<n-1){const ax2=x+bw+2;ctx.fillStyle=cur>i&&mode==='run'?'#9e1b32':PAL['cv-soft'];ctx.beginPath();ctx.moveTo(ax2,by+bh/2-5);ctx.lineTo(ax2+10,by+bh/2);ctx.lineTo(ax2,by+bh/2+5);ctx.closePath();ctx.fill();}});
}
const SIG={
  id:'signaling',hash:'signaling',apUnit:4,order:1,tab:'Cell signaling',kind:'Simulation',
  card:'Adrenaline hits a liver cell. Follow one hormone as it is amplified into millions of glucose molecules.',
  title:'Cell signaling: epinephrine tells a liver cell to release glucose',
  lede:{bio:'A hormone outside the cell never goes in. It flips a receptor, and a chain of relay proteins carries and multiplies the message until the cell releases sugar into your blood.',
        honors:'Epinephrine binds a G-protein-coupled receptor. The signal passes through a G protein, adenylyl cyclase and the second messenger cAMP, then a kinase cascade that ends with glycogen being broken into glucose.',
        ap:'Signal transduction, quantified. Measure each step of the cAMP pathway, test drugs and toxins that act at specific steps, and calculate how much the signal is amplified.'},
  scale:'Inside one liver cell, about 25 micrometers across. Shown: a patch of its membrane and the cytoplasm just beneath it. A real cell has thousands of receptors.',
  timeScale:1,dtMax:0.01,prewarm:30,sampleDt:0.1,window:40,unit:'s',chChange:6,chReveal:26,
  controls:[
    {id:'view',label:'View',type:'seg',def:'close',lvl:'bio',noTrial:true,options:[{v:'close',l:'Close-up: one signal'},{v:'whole',l:'Whole pathway'}],help:'Close-up follows one hormone, one cause at a time. Whole pathway shows the cascade multiplying.'},
    {id:'epi',label:'Epinephrine in the blood',type:'range',min:0,max:10,step:0.1,def:1,unit:' nM',lvl:'bio',help:'Adrenaline. Your adrenal glands release it when you are startled.'},
    {id:'caf',label:'Caffeine',help:'Blocks phosphodiesterase, the enzyme that breaks down cAMP',type:'toggle',def:false,lvl:'honors'},
    {id:'blk',label:'Beta blocker',help:'Sits on the receptor without activating it',type:'toggle',def:false,lvl:'honors'},
    {id:'tox',label:'Cholera-like toxin',help:'Locks the G protein in its “on” state',type:'toggle',def:false,lvl:'ap'},
    {id:'ph',label:'Phosphatase activity',type:'range',min:0.2,max:3,step:0.1,def:1,unit:'×',lvl:'ap',help:'Enzymes that remove phosphates and switch kinases off'}
  ],
  init(){return {R:0,G:0,C:0.1,PKA:0,K:0,P:0,glu:0,tot:0,B:90};},
  step(sim,dt){const p=sim.p,s=sim.st;
    const kd=p.blk?10:1,occT=p.epi/(p.epi+kd);
    s.R+=(occT-s.R)*Math.min(1,3*dt);
    if(p.tox)s.G+=(1-s.G)*Math.min(1,2*dt);else s.G+=(2*s.R*(1-s.G)-1*s.G)*dt;
    const kPDE=p.caf?0.3:1;
    s.C+=(0.1+8*s.G-kPDE*s.C)*dt;
    const pt=s.C*s.C/(s.C*s.C+25);
    s.PKA+=(pt-s.PKA)*Math.min(1,2*dt);
    s.K+=(1.0*s.PKA*(1-s.K)-0.5*p.ph*s.K)*dt;
    s.P+=(1.0*s.K*(1-s.P)-0.4*p.ph*s.P)*dt;
    s.R=clamp(s.R,0,1);s.G=clamp(s.G,0,1);s.C=Math.max(0,s.C);s.K=clamp(s.K,0,1);s.P=clamp(s.P,0,1);
    s.glu=GMAX*s.P;s.tot+=s.glu*dt;
    s.B+=((90+2.2*s.glu)-s.B)*Math.min(1,dt/12);},
  afterPrewarm(sim){sim.st.tot=0;},
  metrics:[
    {id:'occ',label:'Receptors with hormone',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>s.st.R*100},
    {id:'gact',label:'G proteins switched on',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>s.st.G*100},
    {id:'camp',label:'cAMP',unit:'µM',lvl:'honors',min:0,max:20,d:1,get:s=>s.st.C},
    {id:'pka',label:'Protein kinase A active',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>s.st.PKA*100},
    {id:'gp',label:'Glycogen phosphorylase active',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>s.st.P*100},
    {id:'glu',label:'Glucose released',unit:'million/s',lvl:'bio',min:0,max:25,d:1,get:s=>s.st.glu},
    {id:'bg',label:'Blood glucose',unit:'mg/dL',lvl:'bio',min:60,max:180,d:0,get:s=>s.st.B},
    {id:'amp',label:'Amplification (glucose/s per bound hormone)',unit:'',lvl:'ap',min:0,max:20000,d:0,get:s=>{const b=s.st.R*NREC;return b>=5?s.st.glu*1e6/b:NaN;}}
  ],
  graphs:[
    {id:'glu',label:'Glucose released',lvl:'bio',lines:['glu']},
    {id:'bg',label:'Blood glucose',lvl:'bio',lines:['bg'],min:60,max:180,yl:'mg/dL'},
    {id:'occ',label:'Receptors with hormone',lvl:'bio',lines:['occ']},
    {id:'camp',label:'cAMP',lvl:'honors',lines:['camp']},
    {id:'casc_h',label:'The cascade, step by step (%)',lvl:'honors',lines:['occ','gact','pka'],min:0,max:100,yl:'% switched on'},
    {id:'casc',label:'Full cascade (%)',lvl:'ap',lines:['occ','gact','pka','gp'],min:0,max:100,yl:'% switched on'},
    {id:'amp',label:'Amplification',lvl:'ap',lines:['amp']}
  ],
  defaultGraph:'glu',
  challenges:[
    {lvl:'bio',q:'The scare is over and epinephrine drops to zero. What happens to glucose release?',
     choices:['It keeps going, because the message is already inside the cell','It falls back to almost nothing within seconds','It doubles'],correct:1,
     change:{epi:0},changeText:'Epinephrine removed',watch:'glu',
     explain:{bio:'Every relay protein switches itself back off within seconds. Once no new hormone is binding, the message fades and the cell stops releasing sugar. A signal that cannot turn off would be dangerous.',
              honors:'Gs hydrolyzes its GTP, phosphodiesterase breaks down cAMP, and phosphatases strip phosphates off the kinases. With no hormone to restart the chain, every step decays back to its resting state.'}},
    {lvl:'bio',q:'The cell is resting with no epinephrine. A burst of 1 nM epinephrine arrives. What happens?',
     choices:['Nothing, because the hormone cannot get through the membrane','Glucose release rises within seconds','The cell takes in glucose instead'],correct:1,
     baseline:{epi:0},change:{epi:1},changeText:'Epinephrine raised to 1 nM',watch:'glu',
     explain:{bio:'The hormone never enters the cell. It binds a receptor on the outside, and the receptor changes shape on the inside. That shape change starts the relay that ends in glucose release.'}},
    {lvl:'bio',instant:true,q:'For every epinephrine molecule bound to a receptor, about how much glucose does the cell release?',
     choices:['One glucose','About ten glucose','Thousands of glucose every second'],correct:2,
     explain:{bio:'At each step, one active protein switches on many of the next. One receptor activates many G proteins, each cyclase makes many cAMP, and each kinase activates many enzymes. A few hormone molecules end up releasing millions of glucose. This is amplification.',
              ap:'Check the Amplification readout: thousands of glucose per second for each bound hormone. Each enzymatic step multiplies the signal, and the overall gain of this pathway in real liver cells is roughly 10⁶–10⁸.'}},
    {lvl:'honors',q:'Caffeine blocks phosphodiesterase, the enzyme that breaks down cAMP. What happens to cAMP?',
     choices:['cAMP drops','cAMP builds up much higher','No change, because caffeine acts outside the cell'],correct:1,
     change:{caf:true},changeText:'Caffeine added',watch:'camp',
     explain:{honors:'cAMP levels are a balance between adenylyl cyclase making it and phosphodiesterase destroying it. Block the destroyer and cAMP piles up, so the signal is stronger and lasts longer after the hormone leaves.'}},
    {lvl:'honors',q:'A beta blocker is added. It sits on the receptor but does not activate it. What happens to glucose release?',
     choices:['It rises','It drops a lot','No change'],correct:1,
     change:{blk:true},changeText:'Beta blocker added',watch:'glu',
     explain:{honors:'The blocker competes with epinephrine for the same binding site. Fewer receptors hold hormone, so fewer G proteins switch on, and every later step is weaker. Beta blockers are used to calm the heart for the same reason.'}},
    {lvl:'ap',q:'A toxin locks the G protein in its GTP-bound “on” state. With no hormone at all, what happens to cAMP?',
     choices:['cAMP stays at its resting level, since no receptors are occupied','cAMP rises high and stays high','cAMP falls to zero'],correct:1,
     baseline:{epi:0},change:{tox:true},changeText:'Toxin added (no hormone present)',watch:'camp',
     explain:{ap:'Gα normally switches itself off by hydrolyzing GTP. Cholera toxin blocks that hydrolysis in intestinal cells, so Gs stays on and adenylyl cyclase makes cAMP nonstop. The pathway runs with no ligand. In the gut, that drives the massive water loss of cholera.'}},
    {lvl:'ap',q:'Phosphatase activity triples while epinephrine stays at 1 nM. What happens to glucose release?',
     choices:['It rises, because more enzymes are active','It drops, because the kinases are switched off faster','No change, because phosphatases act only after the hormone leaves'],correct:1,
     change:{ph:3},changeText:'Phosphatase activity tripled',watch:'glu',
     explain:{ap:'Each kinase’s activity is a balance between phosphorylation and dephosphorylation, both running all the time. Faster phosphatases shift that steady state toward “off” at both kinase steps, so the response falls even with the same hormone signal. This is how insulin opposes epinephrine.'}}
  ],
  initVis(sim){const r=rng(21),v=sim.vis;v.hor=[];v.cmp=[];v.glu=[];v.ranks=[0.25,0.75];/* the labeled unit (left) is the first to bind */v.rr=[r(),r()];
    v.gl=[];for(let i=0;i<46;i++){const a=r()*6.28,d=Math.sqrt(r())*62;v.gl.push([712+Math.cos(a)*d,355+Math.sin(a)*d*0.95]);}v.gAcc=0;},
  draw(sim,ctx,vdt,k,t){
    if(sim.p.view==='close'){drawClose(sim,ctx,vdt,k,t);return;}
    const s=sim.st,p=sim.p,v=sim.vis,hon=atLeast('honors'),R=Math.random,jit=RM?0:1;
    // background regions
    ctx.fillStyle=PAL['cv-ims'];ctx.fillRect(0,0,800,96);
    ctx.fillStyle=PAL['cv-matrix'];ctx.fillRect(0,134,800,316);
    ctx.fillStyle=PAL['cv-tail'];ctx.fillRect(0,96,800,38);
    ctx.fillStyle=PAL['cv-head'];for(let x=5;x<800;x+=10){ctx.beginPath();ctx.arc(x,99,4,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(x,131,4,0,6.29);ctx.fill();}
    txt(ctx,'BLOOD',12,20,{s:12*k,w:700,c:PAL['cv-soft']});
    txt(ctx,'INSIDE THE LIVER CELL',12,443,{s:12*k,w:700,c:PAL['cv-soft']});
    // hormones in blood
    const nH=Math.round(clamp(p.epi*6,0,60));while(v.hor.length<nH)v.hor.push({x:R()*800,y:12+R()*74,vx:0,vy:0});v.hor.length=nH;
    ctx.fillStyle='#e08a00';
    for(const h of v.hor){h.vx+=(R()-.5)*400*vdt;h.vy+=(R()-.5)*400*vdt;const sp=Math.hypot(h.vx,h.vy);if(sp>40){h.vx*=40/sp;h.vy*=40/sp;}h.x+=h.vx*vdt*jit;h.y+=h.vy*vdt*jit;
      if(h.x<5||h.x>795)h.vx*=-1;if(h.y<10||h.y>86)h.vy*=-1;h.x=clamp(h.x,5,795);h.y=clamp(h.y,10,86);
      ctx.beginPath();ctx.moveTo(h.x,h.y-6);ctx.lineTo(h.x+5,h.y);ctx.lineTo(h.x,h.y+6);ctx.lineTo(h.x-5,h.y);ctx.closePath();ctx.fill();}
    // curved hand-off arrow; dashed and faint when that step is off
    const arrow=(x0,y0,qx,qy,x1,y1,act)=>{ctx.save();const c=act?'#9e1b32':PAL['cv-soft'];ctx.globalAlpha=act?1:0.35;ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=act?2.5:1.5;ctx.setLineDash(act?[]:[3,3]);
      ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo(qx,qy,x1,y1);ctx.stroke();ctx.setLineDash([]);const an=Math.atan2(y1-qy,x1-qx),h=8;
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1-h*Math.cos(an-0.45),y1-h*Math.sin(an-0.45));ctx.lineTo(x1-h*Math.cos(an+0.45),y1-h*Math.sin(an+0.45));ctx.closePath();ctx.fill();ctx.restore();};
    // receptor / G protein / adenylyl cyclase units
    const blkFrac=p.blk?9/(10+p.epi):0;
    UNITS.forEach((x,i)=>{const bound=v.ranks[i]<s.R,blocked=!bound&&p.blk&&v.ranks[i]<s.R+blkFrac;
      // receptor: 7 helices
      ctx.fillStyle=bound?'#2f6fb5':'#5a7397';for(let j=0;j<7;j++)rr(ctx,x-24+j*7,90+(j%2)*3,6,48,3),ctx.fill();
      if(bound){ctx.fillStyle='#e08a00';ctx.beginPath();ctx.moveTo(x,74);ctx.lineTo(x+6,82);ctx.lineTo(x,90);ctx.lineTo(x-6,82);ctx.closePath();ctx.fill();}
      if(blocked){ctx.fillStyle='#7b3fe4';rr(ctx,x-8,72,16,16,3);ctx.fill();}
      // G protein: beta-gamma stays put; the alpha subunit carries GTP over to adenylyl cyclase when active
      const ga=p.tox?1:clamp(s.G*(bound?1.4:0.7),0,1),on=ga>0.4,ax=x+62+ga*42,cx=x+124;
      ctx.fillStyle='#8a8f99';ctx.beginPath();ctx.ellipse(x+48,150,11,9,0,0,6.29);ctx.fill();
      ctx.fillStyle=on?'#2a9d6a':'#7aa58f';ctx.beginPath();ctx.ellipse(ax,148,12,10,0,0,6.29);ctx.fill();
      txt(ctx,on?'GTP':'GDP',ax,149,{s:9*k,w:700,c:on?'#fff':'#17402c',a:'center',b:'middle'});
      // adenylyl cyclase
      ctx.fillStyle=on?'#b0552d':'#9a7666';rr(ctx,cx,92,34,48,8);ctx.fill();rr(ctx,cx-4,138,42,22,8);ctx.fill();
      // the hand-offs: receptor -> G protein -> adenylyl cyclase -> cAMP (solid red when that step is on)
      arrow(x+8,143,x+14,180,x+36,158,bound);
      arrow(ax+10,158,(ax+cx)/2+8,186,cx+2,160,on);
      arrow(cx+17,161,cx+17,176,cx+17,194,on);
    });
    // Labels use the real names at every detail level, so switching levels never renames a part.
    // Numbered badges follow the pathway: 1 receptor, 2 G protein, 3 adenylyl cyclase/cAMP, 4 kinase cascade, 5 glycogen to glucose.
    const sm=k>=1.3;
    const badge=(n,x,y)=>{ctx.fillStyle='#9e1b32';ctx.beginPath();ctx.arc(x,y,7.5*k,0,6.29);ctx.fill();txt(ctx,String(n),x,y+0.5*k,{s:10*k,w:800,c:'#fff',a:'center',b:'middle'});};
    const tag=(n,s_,x,y,o)=>{o=o||{};const sz=(o.s||12)*k,w=o.w||700;ctx.font=w+' '+sz+'px '+FONT;const tw=ctx.measureText(s_).width,bw=n?18*k:0;
      const x0=o.a==='right'?x-tw-bw:o.a==='center'?x-(tw+bw)/2:x;if(n)badge(n,x0+7.5*k,y-sz*0.35);txt(ctx,s_,x0+bw,y,{s:sz,w,c:o.c||PAL['cv-ink']});return x0+bw+tw;};
    const lab=(s_,x,y,n)=>tag(n,s_,x,y);
    tag(1,sm?'Receptor':'Receptor (GPCR)',90,64,{a:'center'});
    tag(3,'Adenylyl cyclase',231,sm?84:64,{a:'center'});
    tag(2,'G protein',sm?128:132,sm?196:184,{s:11.5,a:'right'});
    if(!sm)txt(ctx,'ATP → cAMP',242,190,{s:11*k,w:600,c:PAL['cv-soft']});
    txt(ctx,'Cell membrane',566,119,{s:11*k,w:600,c:PAL['cv-soft']});
    txt(ctx,sm?'Transporter':'Glucose transporter',796,64,{s:11*k,w:600,c:PAL['cv-soft'],a:'right'});
    // cAMP cloud
    const nC=Math.round(clamp(s.C*5,0,80));
    while(v.cmp.length<nC){const u=UNITS[Math.floor(R()*UNITS.length)];v.cmp.push({x:u+141+R()*10-5,y:196,vx:R()*40-20,vy:20+R()*20,a:0});}
    if(v.cmp.length>nC){for(let i=nC;i<v.cmp.length;i++)v.cmp[i].dying=true;}
    for(const c of v.cmp){c.vx+=(R()-.5)*300*vdt;c.vy+=(R()-.5)*300*vdt;const sp=Math.hypot(c.vx,c.vy);if(sp>45){c.vx*=45/sp;c.vy*=45/sp;}c.x+=c.vx*vdt*jit;c.y+=c.vy*vdt*jit;
      if(c.x<20||c.x>600)c.vx*=-1;if(c.y<165||c.y>245)c.vy*=-1;c.x=clamp(c.x,20,600);c.y=clamp(c.y,165,245);
      c.a=c.dying?c.a-vdt*2:Math.min(1,c.a+vdt*3);ctx.globalAlpha=clamp(c.a,0,1);ctx.fillStyle='#1f9d55';
      ctx.beginPath();for(let j=0;j<6;j++){const an=j*Math.PI/3;ctx[j?'lineTo':'moveTo'](c.x+Math.cos(an)*4.5,c.y+Math.sin(an)*4.5);}ctx.closePath();ctx.fill();}
    ctx.globalAlpha=1;v.cmp=v.cmp.filter(c=>!(c.dying&&c.a<=0));
    // phosphodiesterase (PDE) breaking down cAMP
    [[560,212],[520,238],[430,232]].forEach((q,i)=>{ctx.fillStyle=p.caf?'#9a9aa2':'#6d6d78';ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.arc(q[0],q[1],10,0.6+Math.sin(t*4+i)*(p.caf?0:0.3),5.7);ctx.closePath();ctx.fill();
      if(p.caf){ctx.fillStyle='#7a4a24';ctx.beginPath();ctx.arc(q[0]+8,q[1],4.5,0,6.29);ctx.fill();}});
    txt(ctx,p.caf?'Phosphodiesterase (blocked by caffeine)':(sm?'Phosphodiesterase':'Phosphodiesterase breaks down cAMP'),598,sm?254:262,{s:11*k,c:PAL['cv-soft'],a:'right'});
    txt(ctx,'cAMP (second messenger)',sm?598:522,sm?190:184,{s:12*k,w:700,c:PAL['cv-ink'],a:sm?'right':'left'});
    // kinase rows with fan-out amplification
    const rows=[['pka',s.PKA,'Protein kinase A (PKA)','#3f6fb0'],['phk',s.K,'Phosphorylase kinase','#7a4fa6'],['gp',s.P,'Glycogen phosphorylase','#2a8276']];
    rows.forEach((row,ri)=>{const g=ROWS[row[0]],act=row[1]*g.n;
      lab(row[2],20,g.y-20,ri===0?4:0);
      if(ri<2){const nxt=ROWS[rows[ri+1][0]],na=rows[ri+1][1]*nxt.n;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.globalAlpha=.45;
        for(let i=0;i<g.n;i++){if(i>=act)continue;const per=nxt.n/g.n;for(let j=0;j<per;j++){const jj=Math.floor(i*per+j);if(jj>=na+0.5)continue;const tx=nxt.x0+jj*nxt.dx;ctx.beginPath();ctx.moveTo(g.x0+i*g.dx,g.y+10);ctx.lineTo(tx,nxt.y-10);ctx.stroke();}}ctx.globalAlpha=1;}
      for(let i=0;i<g.n;i++){const x=g.x0+i*g.dx,on=clamp(act-i,0,1);
        ctx.globalAlpha=0.35+0.65*on;ctx.fillStyle=row[3];rr(ctx,x-12,g.y-9,24,18,7);ctx.fill();ctx.globalAlpha=1;
        if(on>0.5){ctx.fillStyle='#f2b705';ctx.beginPath();ctx.arc(x+10,g.y-8,5.5,0,6.29);ctx.fill();txt(ctx,'P',x+10,g.y-7.5,{s:8*k,w:800,c:'#3a2c00',a:'center',b:'middle'});}}});
    if(!sm)txt(ctx,'Kinase cascade: each switched-on enzyme switches on many of the next (4 → 8 → 16)',20,424,{s:11*k,c:PAL['cv-soft']});
    // glycogen granule and glucose release
    ctx.fillStyle='#c9a227';for(const q of v.gl){ctx.beginPath();ctx.arc(q[0],q[1],5,0,6.29);ctx.fill();}
    tag(5,sm?'Glycogen':'Glycogen (stored glucose)',792,438,{s:11.5,w:600,a:'right',c:PAL['cv-soft']});
    // GLUT2 transporter
    ctx.fillStyle='#6a8796';rr(ctx,734,94,24,42,6);ctx.fill();
    v.gAcc+=s.glu*0.28*vdt;while(v.gAcc>=1){v.gAcc--;const q=v.gl[Math.floor(R()*v.gl.length)];v.glu.push({x:q[0],y:q[1],ph:0});}
    for(const g of v.glu){if(g.ph===0){g.x+=(746-g.x)*Math.min(1,vdt*1.6);g.y+=(150-g.y)*Math.min(1,vdt*1.6);if(Math.abs(g.y-150)<6)g.ph=1;}
      else{g.y-=60*vdt;g.x+=(R()-.5)*30*vdt+15*vdt;}
      ctx.fillStyle='#e0b800';ctx.strokeStyle='#7a5a00';ctx.lineWidth=1;ctx.beginPath();for(let j=0;j<6;j++){const an=j*Math.PI/3+0.5;ctx[j?'lineTo':'moveTo'](g.x+Math.cos(an)*5,g.y+Math.sin(an)*5);}ctx.closePath();ctx.fill();ctx.stroke();}
    v.glu=v.glu.filter(g=>g.y>-6);if(v.glu.length>120)v.glu.splice(0,v.glu.length-120);
    // the outcome in the blood: glucose level and where it goes
    {const bg=s.B,gx=sm?470:440,gy=sm?32:10,gw=sm?150:180,lo=60,hi=180,X=v_=>gx+gw*clamp((v_-lo)/(hi-lo),0,1);
      txt(ctx,'Blood glucose',gx,gy+11,{s:11*k,w:700,c:PAL['cv-ink']});txt(ctx,Math.round(bg)+' mg/dL'+(bg>102?' ↑':''),gx+gw,gy+11,{s:11*k,w:700,a:'right',c:bg>102?'#9e1b32':PAL['cv-ink']});
      ctx.fillStyle='rgba(128,128,128,0.25)';rr(ctx,gx,gy+16,gw,9,4);ctx.fill();ctx.fillStyle='rgba(42,157,106,0.45)';ctx.fillRect(X(70),gy+16,X(100)-X(70),9);
      ctx.fillStyle='#9e1b32';ctx.fillRect(X(bg)-2,gy+13,4,15);
      if(!sm)txt(ctx,'green = resting (70–100) · extra glucose fuels muscles and brain',gx,gy+40,{s:9.5*k,c:PAL['cv-soft']});}
    if(p.tox)pill(ctx,'Toxin: G protein stuck on',160,40,'#b3261e','#fff',11*k);
    if(p.blk)pill(ctx,'Beta blocker',330,40,'#6a32d0','#fff',11*k);
    // legend
    let lx=sm?92:190;const ly=sm?22:443;const key=(name,mark)=>{mark(lx,ly-4);txt(ctx,name,lx+9*k,ly,{s:11*k,c:PAL['cv-soft']});ctx.font='400 '+(11*k)+'px '+FONT;lx+=9*k+ctx.measureText(name).width+16*k;};
    const hex=(c,st)=>(x,y)=>{ctx.fillStyle=c;ctx.beginPath();for(let j=0;j<6;j++){const an=j*Math.PI/3+0.5;ctx[j?'lineTo':'moveTo'](x+Math.cos(an)*5,y+Math.sin(an)*5);}ctx.closePath();ctx.fill();if(st){ctx.strokeStyle=st;ctx.lineWidth=1;ctx.stroke();}};
    key('epinephrine',(x,y)=>{ctx.fillStyle='#e08a00';ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x+5,y);ctx.lineTo(x,y+6);ctx.lineTo(x-5,y);ctx.closePath();ctx.fill();});
    key('cAMP',hex('#1f9d55'));
    key('phosphate',(x,y)=>{ctx.fillStyle='#f2b705';ctx.beginPath();ctx.arc(x,y,5.5,0,6.29);ctx.fill();txt(ctx,'P',x,y+0.5,{s:8*k,w:800,c:'#3a2c00',a:'center',b:'middle'});});
    key('glucose',hex('#e0b800','#7a5a00'));
  },
  narrate(sim){const p=sim.p,s=sim.st,hon=atLeast('honors'),g=s.glu.toFixed(1);
    if(p.view==='close'){const c=sim.vis.cu,m=c?c.mode:'';
      if(m==='none')return '<b>No epinephrine.</b> With no signal to bind, the receptor keeps its resting shape, the G protein holds GDP (off), and adenylyl cyclase makes no cAMP. Raise epinephrine to start the relay.';
      if(m==='blk')return '<b>The beta blocker sits in the receptor’s pocket</b> without changing its shape. Epinephrine can’t bind, so the G protein stays off and nothing downstream happens.';
      if(m==='tox')return '<b>Cholera-like toxin.</b> The α part can’t break down its GTP, so it never switches off. Adenylyl cyclase keeps making cAMP even with no hormone at all.';
      return 'Step '+(((c&&c.ph)||0)+1)+' of 7. '+CU_TXT[(c&&c.ph)||0];}
    const out=' Blood glucose: <b>'+Math.round(s.B)+' mg/dL</b>'+(s.B>102?', above the resting 70–100, so muscles and brain get extra fuel to run or fight.':'.');
    if(p.tox)return '<b>The toxin has locked the G proteins “on”.</b> Adenylyl cyclase keeps making cAMP whether or not any hormone is bound, so the cell releases '+g+' million glucose per second with no signal at all.';
    if(p.epi<0.05&&s.glu>0.5)return '<b>The hormone is gone, so the signal is shutting off.</b> '+(hon?'Phosphodiesterase breaks down cAMP and phosphatases remove phosphates from the kinases.':'The G protein, cAMP and the kinases all switch back off.')+' Glucose release is falling.';
    if(p.epi<0.05)return 'No epinephrine, so the receptors are empty and the cell is quiet. Glucose stays stored as glycogen.';
    if(p.blk)return '<b>The beta blocker occupies most receptors without switching them on.</b> Little hormone can bind, so the whole chain stays weak: '+g+' million glucose per second.';
    if(p.caf&&hon)return '<b>Caffeine is blocking phosphodiesterase</b>, so cAMP builds up to '+s.C.toFixed(1)+' µM instead of being broken down. The signal is stronger and lasts longer.';
    if(atLeast('ap')&&p.ph>1.5)return '<b>Phosphatases are working hard</b>, pulling phosphates off the kinases almost as fast as they are added, so the response is damped.';
    return 'Epinephrine has bound '+Math.round(s.R*100)+'% of the receptors. Each '+'active receptor switches on many G proteins, each adenylyl cyclase makes many cAMP, and each kinase switches on many more enzymes'+'. The result: <b>'+g+' million glucose released per second</b>.'+out;},
  tour:[
    {title:'The hormone stays outside',setup(sim){BioLab.setValues(sim,{view:'whole'});},text:'Epinephrine (orange diamonds) travels in the blood. It cannot cross the cell membrane, so the message has to be passed in from the outside.',focus:[0,0,800,96],speed:0.5},
    {title:'The receptor changes shape',text:{bio:'When epinephrine binds the receptor on the outside (step 1), the receptor changes shape on the inside. That shape change is the message.',honors:'Epinephrine binds a G-protein-coupled receptor, which snakes back and forth across the membrane seven times. Binding changes its shape on the cytoplasm side.'},focus:[52,58,80,96],speed:0.25},
    {title:'G protein to adenylyl cyclase',text:{bio:'The receptor switches on the G protein (step 2). The G protein trades GDP for GTP, which turns it on, and slides over to switch on adenylyl cyclase, an enzyme in the membrane.',honors:'The active receptor makes the G protein swap GDP for GTP. The GTP-bound α subunit slides to adenylyl cyclase and switches it on.'},focus:[98,86,190,132],speed:0.1},
    {title:'cAMP spreads the message',text:{bio:'Adenylyl cyclase turns ATP into cAMP (step 3), small green messenger molecules that spread through the cell. cAMP is called the second messenger; the hormone was the first.',honors:'Adenylyl cyclase converts ATP into cAMP, the second messenger. Each cyclase makes many cAMP molecules: the first big amplification.'},focus:[10,160,600,92],speed:0.25},
    {title:'The kinase cascade fans out',text:{bio:'cAMP switches on protein kinase A (step 4). Each kinase adds phosphates (yellow P) to switch on many of the next enzyme: phosphorylase kinase, then glycogen phosphorylase. Count the rows: 4, then 8, then 16, and in a real cell, many thousands.',honors:'cAMP activates protein kinase A. PKA phosphorylates many phosphorylase kinases, and each of those phosphorylates many glycogen phosphorylases. The yellow P marks an added phosphate.'},focus:[10,250,600,170],speed:0.25},
    {title:'Glycogen becomes glucose',text:'Glycogen phosphorylase snips glucose off stored glycogen (step 5). The glucose leaves through a transporter and enters the blood, fuel for running away.',focus:[630,88,170,362],speed:0.5},
    {title:'Switching it off',text:{bio:'Now the hormone is removed. Every relay protein switches itself off within seconds, so the sugar release stops.',honors:'With no hormone, the G protein hydrolyzes its GTP, phosphodiesterase breaks down cAMP, and phosphatases remove the phosphates. The whole pathway resets.'},focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{epi:0});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{epi:1});},
  lab:{bio:'<p><b>Question:</b> How does the amount of epinephrine affect glucose release?</p><ol><li>Record glucose released at epinephrine 0, 0.1, 0.25, 0.5, 1, 2, 5 and 10 nM. Wait about 10 seconds after each change.</li><li>Plot epinephrine (x) against glucose released (y).</li></ol><p>Describe the shape of your graph. Why does adding more hormone eventually stop helping?</p>',
       honors:'<p><b>Question:</b> How do caffeine and beta blockers change the response?</p><ol><li>At 1 nM epinephrine, record a baseline, then a caffeine trial, then a beta-blocker trial (switch the first one off before the next).</li><li>Compare cAMP and glucose released.</li></ol><p>Explain each result by naming the exact step of the pathway the drug acts on.</p>',
       ap:'<p><b>Question:</b> Where in the pathway does the signal get amplified, and where can it be controlled?</p><ol><li>Record every readout at 0.2, 1 and 5 nM epinephrine.</li><li>Repeat at 1 nM with phosphatase at 0.5× and 3×, then with the toxin on and no hormone.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why a cell needs both kinases and phosphatases, and why a G protein that cannot switch off causes disease.</p>'},
  terms:[{t:'Signal transduction',d:'Turning an outside signal into a response inside the cell.'},
    {t:'1 · Epinephrine',d:'Adrenaline, the hormone (ligand) in the blood. It binds the receptor but never enters the cell.'},
    {t:'1 · Receptor (GPCR)',d:'G-protein-coupled receptor: a protein that crosses the membrane seven times. Epinephrine binding changes its shape on the inside.'},
    {t:'2 · G protein',d:'A relay switch under the membrane. It is off when holding GDP and on when holding GTP. Its α part slides over to adenylyl cyclase.'},
    {t:'GTP / GDP',d:'Energy-carrying nucleotides. Trading GDP for GTP turns the G protein on; breaking GTP back to GDP turns it off.'},
    {t:'3 · Adenylyl cyclase',d:'A membrane enzyme that turns ATP into cAMP once the G protein switches it on.'},
    {t:'3 · cAMP (second messenger)',d:'Cyclic AMP, a small molecule that carries the signal through the cytoplasm. The hormone is the first messenger.'},
    {t:'Phosphodiesterase',d:'The enzyme that breaks down cAMP, ending the signal. Caffeine blocks it.'},
    {t:'4 · Protein kinase A (PKA)',d:'The kinase cAMP switches on. It starts the kinase cascade.'},
    {t:'4 · Kinase cascade',d:'Kinases switching on more kinases: protein kinase A, then phosphorylase kinase, then glycogen phosphorylase. Each step multiplies the signal.'},
    {t:'Kinase',d:'An enzyme that adds a phosphate group to another protein, often switching it on.'},
    {t:'Phosphate (P)',d:'The small chemical group a kinase attaches. The yellow P shows which enzymes are switched on.'},
    {t:'5 · Glycogen phosphorylase',d:'The last enzyme in the cascade. It snips glucose off glycogen.'},
    {t:'5 · Glycogen',d:'The liver’s stored form of glucose: long branched chains of glucose.'},
    {t:'Glucose transporter',d:'A membrane protein (GLUT2) that lets glucose leave the liver cell and enter the blood.'},
    {t:'Amplification',d:'Each step activates many copies of the next, so a small signal causes a big response.'},
    {lvl:'ap',t:'Phosphatase',d:'An enzyme that removes phosphate groups, reversing a kinase.'},{lvl:'ap',t:'Antagonist',d:'A molecule, like a beta blocker, that binds a receptor without activating it.'}],
  about:'<p>Each step is a simple rate equation. Receptor occupancy is [E]/([E]+K<sub>d</sub>) with K<sub>d</sub> = 1 nM, rising to 10 nM with the beta blocker. G-protein activation is 2·occupancy·(1−G) minus GTP hydrolysis at 1/s. cAMP is made at 8·G µM/s and broken down by phosphodiesterase at 1/s (0.3/s with caffeine). PKA follows cAMP²/(cAMP²+25). The two downstream kinases are phosphorylated in proportion to the step above them and dephosphorylated by phosphatases.</p><p>Blood glucose relaxes toward 90 + 2.2 × (glucose released) mg/dL with a 12 s time constant, compressed from the minutes it takes in a real body. The close-up view replays one signal as a timed sequence and is not driven by the rate equations. Simplified: one receptor type, no receptor desensitization, no calcium branch, and glucose output in model units (about 25 million glucose per second at maximum). The pictures show a few copies of each protein. A real cell has thousands of receptors and far more enzymes in each row.</p>',
  thumbFrames:60
};
BioLab.register(SIG);
})();
