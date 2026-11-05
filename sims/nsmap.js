(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;

const C={ns:'#5a6470',cns:'#7b58b5',pns:'#3f6fb0',sens:'#1f7a7a',mot:'#a8324a',som:'#a85c1a',aut:'#4f7f2f',sym:'#b03a2e',para:'#2f7f5f'};
const NODES={
 ns:{n:'Nervous system',x:275,y:34,c:C.ns,up:null,short:'Everything below: the brain, the spinal cord and all the nerves.',info:{bio:'Your body’s fast communication network. It takes in information, decides what to do and sends out commands.'}},
 cns:{n:'CNS',full:'Central nervous system (CNS)',x:120,y:112,c:C.cns,up:'ns',short:'Brain and spinal cord. This is where integration happens.',info:{bio:'The brain and spinal cord. The CNS does the integration: it processes incoming signals and decides on a response.'}},
 pns:{n:'PNS',full:'Peripheral nervous system (PNS)',x:390,y:112,c:C.pns,up:'ns',short:'Cranial and spinal nerves that connect the CNS to the body.',info:{bio:'All the nerves outside the brain and spinal cord: the cranial nerves and the spinal nerves.',ap:'All the nerves outside the brain and spinal cord: 12 pairs of cranial nerves and 31 pairs of spinal nerves. Most carry both sensory and motor fibers.'}},
 brain:{n:'Brain',x:56,y:190,c:C.cns,up:'cns',short:'Part of the CNS. Processes signals and decides.',info:{bio:'The main integration center. Switch to the Brain view to explore its parts.'}},
 cord:{n:'Spinal cord',x:184,y:190,c:C.cns,up:'cns',short:'Part of the CNS. Relays signals and handles spinal reflexes.',info:{bio:'Carries signals between the brain and the body, and handles spinal reflexes by itself.'}},
 sens:{n:'Sensory',full:'Sensory (afferent)',x:326,y:190,c:C.sens,up:'pns',short:'Afferent: signals arrive at the CNS.',info:{bio:'Sensory neurons carry signals from receptors toward the CNS. <b>Afferent = arrives.</b>'}},
 mot:{n:'Motor',full:'Motor (efferent)',x:462,y:190,c:C.mot,up:'pns',short:'Efferent: signals exit the CNS.',info:{bio:'Motor neurons carry commands from the CNS out to muscles and glands. <b>Efferent = exits.</b>'}},
 som:{n:'Somatic',x:352,y:270,c:C.som,up:'mot',short:'Voluntary, to skeletal muscle. Somatic = select.',info:{bio:'Voluntary control of skeletal muscle: you select the movement. <b>Somatic = select.</b>'}},
 aut:{n:'Autonomic',x:488,y:270,c:C.aut,up:'mot',short:'Involuntary, to smooth muscle, cardiac muscle and glands.',info:{bio:'Involuntary control of smooth muscle, cardiac muscle and glands. <b>Autonomic = automatic.</b>'}},
 sym:{n:'Sympathetic',x:328,y:350,c:C.sym,up:'aut',short:'Fight or flight: ready the body for action.',info:{bio:'<b>Fight or flight.</b> Readies the body for action: heart rate up, pupils wider, airways wider, digestion slowed.',ap:'<b>Fight or flight.</b> Fibers leave the spinal cord from T1 to L2 (thoracolumbar). Most release norepinephrine at the target, and the adrenal medulla adds epinephrine to the blood, so the effect outlasts the nerve signal.'}},
 para:{n:'Parasympathetic',x:458,y:350,c:C.para,up:'aut',short:'Rest and digest: save energy and handle food.',info:{bio:'<b>Rest and digest.</b> Saves energy: heart rate down, pupils smaller, airways narrower, digestion active.',ap:'<b>Rest and digest.</b> Fibers leave from the brain stem and sacral spinal cord (craniosacral). The vagus nerve (cranial nerve X) carries most of them. They release acetylcholine at the target.'}}};
NODES.sym.x=262;NODES.para.x=444;NODES.som.x=322;NODES.aut.x=470;
const NKEY=Object.keys(NODES);
const SC={
 walk:{n:'Walking home',sym:.4,par:.35,hr:95,pu:3.5,air:.6,gut:.4,vg:.5,vm:.75,
   hrT:'Up a little, to feed working muscles',puT:'Medium',airT:'A little wider',gutT:'Slower than at rest',vT:'Leg muscle vessels wider',
   nar:'Your <b>somatic</b> division is moving your legs on purpose. Your <b>sympathetic</b> division has nudged heart rate up to supply them. Both divisions of the autonomic system stay active: they are not an on-off switch.'},
 scare:{n:'Startled',sym:1,par:.1,hr:125,pu:6.5,air:1,gut:.05,vg:.2,vm:1,
   hrT:'Way up, to pump more blood',puT:'Dilated, to let in more light',airT:'Dilated, to move more air',gutT:'Nearly stopped',vT:'Gut narrow, muscle wide',
   nar:'<b>Fight or flight.</b> A loud noise behind you and the sympathetic division takes over within a second: heart faster, pupils and airways wider, blood sent from the gut to muscles. You didn’t choose any of it.'},
 dinner:{n:'After dinner',sym:.15,par:.9,hr:68,pu:2.5,air:.3,gut:1,vg:.9,vm:.35,
   hrT:'Below the 72 BPM set point',puT:'Constricted',airT:'Narrower, at rest you need less',gutT:'Active: saliva, enzymes, gut motion',vT:'Gut vessels wide',
   nar:'<b>Rest and digest.</b> Sitting on the couch, the parasympathetic division dominates: the heart slows, pupils and airways narrow and the gut gets to work on your dinner.'}};
const PARTS={
 cerebrum:{n:'Cerebrum',c:'#7b58b5',t:{bio:'The largest part of the brain, split into a left and a right hemisphere. Each hemisphere controls the opposite side of the body. It has four lobes: frontal, parietal, occipital and temporal.'}},
 frontal:{n:'Frontal lobe',c:'#a8324a',t:{bio:'Plans and starts movement. Handles reasoning, decisions, personality and producing speech.',honors:'Plans and starts movement through the motor cortex at its back edge. Handles reasoning, decisions, personality and producing speech (Broca’s area).'}},
 parietal:{n:'Parietal lobe',c:'#3f6fb0',t:{bio:'Takes in touch, pain, temperature and pressure, and tracks where your body is.',honors:'Holds the sensory cortex just behind the motor cortex. Takes in touch, pain, temperature and pressure, and tracks where your body is in space.'}},
 occipital:{n:'Occipital lobe',c:'#4f7f2f',t:{bio:'Handles vision. This is why a hard hit to the back of the head can make you see stars.'}},
 temporal:{n:'Temporal lobe',c:'#a85c1a',t:{bio:'Handles hearing, memory and understanding language.',honors:'Handles hearing, forming memories (hippocampus) and understanding language (Wernicke’s area).'}},
 cerebellum:{n:'Cerebellum',c:'#1f7a7a',t:{bio:'Coordinates movement, balance and posture. It fine-tunes movements the frontal lobe starts.'}},
 stem:{n:'Brain stem',c:'#5a6470',t:{bio:'Connects the brain to the spinal cord and runs what keeps you alive: breathing, heart rate and swallowing.',honors:'Midbrain, pons and medulla. Connects the brain to the spinal cord and runs breathing, heart rate and swallowing. Motor pathways cross sides here.'}}};
const NP={
 dend:{n:'Dendrites',t:{bio:'Branches that receive signals and carry them toward the cell body.'}},
 body:{n:'Cell body',t:{bio:'Holds the nucleus and keeps the neuron alive. Signals add up here in many neurons.'}},
 axon:{n:'Axon',t:{bio:'The long fiber that carries the signal away from the cell body.'}},
 myelin:{n:'Myelin sheath',t:{honors:'Fatty insulation wrapped around the axon, which makes the signal travel much faster.'}},
 term:{n:'Axon terminal',t:{honors:'The end of the axon. It releases neurotransmitter across a synapse to the next cell.'}}};
const NT={sensory:{n:'Sensory neuron',t:'Carries signals from a receptor to the CNS (afferent).'},inter:{n:'Interneuron',t:'Connects neurons inside the CNS. It sits entirely in the brain or spinal cord.'},motor:{n:'Motor neuron',t:'Carries commands from the CNS to a muscle or gland (efferent).'}};
const CTLS={tree:['node'],body:['scen'],brain:['part','hemi'],neuron:['ntype','npart']};

/* helpers */
function wrap(ctx,s,x,y,w,o){ctx.font=(o.w||400)+' '+o.s+'px '+FONT;const lh=o.s*1.26;let line='',n=0;s.split(' ').forEach(word=>{const t=line?line+' '+word:word;if(ctx.measureText(t).width>w&&line){txt(ctx,line,x,y+n*lh,o);n++;line=word;ctx.font=(o.w||400)+' '+o.s+'px '+FONT;}else line=t;});if(line){txt(ctx,line,x,y+n*lh,o);n++;}return y+n*lh;}
const plain=s=>String(s).replace(/<[^>]+>/g,'');
function along(P,f){let L=0;const d=[];for(let i=1;i<P.length;i++){const q=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);d.push(q);L+=q;}let r=clamp(f,0,1)*L;for(let i=0;i<d.length;i++){if(r<=d[i]||i===d.length-1){const q=d[i]?r/d[i]:0;return [lerp(P[i][0],P[i+1][0],q),lerp(P[i][1],P[i+1][1],q)];}r-=d[i];}return P[0];}
function line(ctx,P,c,w,a){ctx.strokeStyle=c;ctx.lineWidth=w||2;ctx.globalAlpha=a===undefined?1:a;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();P.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.globalAlpha=1;ctx.lineCap='butt';}
function dots(ctx,P,c,t,n,sp){for(let i=0;i<(n||3);i++){const f=RM?(i+.5)/(n||3):((t*(sp||.35)+i/(n||3))%1),q=along(P,f);ctx.fillStyle=c;ctx.beginPath();ctx.arc(q[0],q[1],5,0,6.2832);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.2;ctx.stroke();}}
function syncCtl(sim){const W=sim.ui&&sim.ui.ctlW;if(!W)return;const on=CTLS[sim.p.view]||[];Object.keys(CTLS).forEach(v=>CTLS[v].forEach(id=>{const w=W[id];if(!w)return;const c=sim.def.controls.find(x=>x.id===id),show=on.includes(id)&&atLeast(c.lvl);if(w.hidden===show)w.hidden=!show;}));}

/* brain art, lateral view facing left */
const CB=[[.05,.5],[.03,.35],[.1,.17],[.25,.06],[.45,.02],[.65,.05],[.82,.15],[.94,.32],[.96,.48],[.88,.58],[.74,.6],[.62,.66],[.48,.76],[.3,.77],[.18,.67],[.2,.57],[.12,.58]];
const LOBE={frontal:[[0,0],[.47,0],[.37,.5],[.2,.57],[0,.7]],parietal:[[.47,0],[.74,0],[.72,.44],[.37,.5]],occipital:[[.74,0],[1,0],[1,.7],[.7,.62],[.72,.44]],temporal:[[0,.7],[.2,.57],[.37,.5],[.72,.44],[.7,.62],[.6,1],[0,1]]};
const inPoly=(P,u,v)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>v)!==(b[1]>v)&&u<(b[0]-a[0])*(v-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
function brainHit(u,v){if(inPoly(CB,u,v)){for(const l of ['frontal','parietal','occipital','temporal'])if(inPoly(LOBE[l],u,v))return l;return 'cerebrum';}
  if(((u-.76)/.16)**2+((v-.74)/.13)**2<=1)return 'cerebellum';if(u>=.53&&u<=.63&&v>=.6&&v<=1)return 'stem';return null;}
function drawBrain(ctx,x,y,w,h,sel,k){const X=u=>x+u*w,Y=v=>y+v*h,cs=PARTS,all=sel==='cerebrum',dim=id=>(sel===id||(all&&LOBE[id]))?1:.72;
  ctx.globalAlpha=dim('stem');ctx.fillStyle=cs.stem.c;rr(ctx,X(.53),Y(.6),.1*w,.4*h,.04*w);ctx.fill();ctx.globalAlpha=1;if(sel==='stem'){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3.5;ctx.stroke();}
  ctx.globalAlpha=dim('cerebellum');ctx.fillStyle=cs.cerebellum.c;ctx.beginPath();ctx.ellipse(X(.76),Y(.74),.16*w,.13*h,0,0,6.2832);ctx.fill();ctx.globalAlpha=1;if(sel==='cerebellum'){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3.5;ctx.stroke();}
  const path=()=>{ctx.beginPath();const n=CB.length,P=CB.map(q=>[X(q[0]),Y(q[1])]),m=(a,b)=>[(P[a][0]+P[b][0])/2,(P[a][1]+P[b][1])/2],s=m(n-1,0);ctx.moveTo(s[0],s[1]);for(let i=0;i<n;i++){const e=m(i,(i+1)%n);ctx.quadraticCurveTo(P[i][0],P[i][1],e[0],e[1]);}ctx.closePath();};
  ctx.save();path();ctx.clip();Object.keys(LOBE).forEach(l=>{ctx.globalAlpha=dim(l);ctx.fillStyle=cs[l].c;ctx.beginPath();LOBE[l].forEach((q,i)=>i?ctx.lineTo(X(q[0]),Y(q[1])):ctx.moveTo(X(q[0]),Y(q[1])));ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=2;ctx.stroke();
    if(sel===l){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=7;ctx.stroke();}});ctx.restore();
  path();ctx.strokeStyle=sel==='cerebrum'?PAL['cv-ink']:PAL['cv-soft'];ctx.lineWidth=sel==='cerebrum'?4:2;ctx.stroke();
  const L=[['Frontal','lobe',.2,.3],['Parietal','lobe',.56,.22],['Occipital','lobe',.85,.34],['Temporal','lobe',.42,.62]],s=12.5*k;
  L.forEach(q=>{txt(ctx,q[0],X(q[2]),Y(q[3])-s*.6,{s,w:700,c:'#fff',a:'center',b:'middle'});txt(ctx,q[1],X(q[2]),Y(q[3])+s*.6,{s,w:700,c:'#fff',a:'center',b:'middle'});});
  txt(ctx,'Cerebellum',X(.77),Y(.74),{s:Math.min(s,.25*w/5.2),w:700,c:'#fff',a:'center',b:'middle'});
  txt(ctx,'Brain stem',X(.5),Y(.93),{s,w:700,a:'right',b:'middle'});}

/* views */
function drawTree(sim,ctx,k,t,hits){const sel=sim.p.node;
  const onPath=id=>{let n=sel;while(n){if(n===id)return true;n=NODES[n].up;}return false;};
  NKEY.forEach(id=>{const N=NODES[id];if(!N.up)return;const U=NODES[N.up],on=onPath(id);ctx.strokeStyle=on?N.c:PAL['line'];ctx.lineWidth=on?3.5:2;ctx.beginPath();ctx.moveTo(U.x,U.y+14);ctx.bezierCurveTo(U.x,(U.y+N.y)/2,N.x,(U.y+N.y)/2,N.x,N.y-14);ctx.stroke();});
  ctx.font='700 '+13*k+'px '+FONT;const hh=19+7*k;
  NKEY.forEach(id=>{const N=NODES[id],w=ctx.measureText(N.n).width+20;ctx.font='700 '+13*k+'px '+FONT;const x=N.x-w/2,y=N.y-hh/2;ctx.fillStyle=N.c;ctx.globalAlpha=onPath(id)?1:.78;rr(ctx,x,y,w,hh,hh/2.4);ctx.fill();ctx.globalAlpha=1;if(id===sel){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.stroke();}txt(ctx,N.n,N.x,N.y+1,{s:13*k,w:700,c:'#fff',a:'center',b:'middle'});ctx.font='700 '+13*k+'px '+FONT;hits.push({x,y,w,h:hh,v:id});});
  const N=NODES[sel];ctx.fillStyle=PAL['card2'];rr(ctx,8,398,548,94,8);ctx.fill();ctx.strokeStyle=N.c;ctx.lineWidth=2;ctx.stroke();
  const by=wrap(ctx,N.full||N.n,20,398+15+6*k,524,{s:13*k,w:700});wrap(ctx,N.short,20,by+2,524,{s:12.5*k});
  /* the figure with signal paths */
  const O={cx:680,top:24,h:456},A=n=>{const q=BioLab.body.at(n,O);return [q.x,q.y];},M=(x,y)=>{const q=BioLab.body.map(x,y,O);return [q.x,q.y];};
  BioLab.body.draw(ctx,Object.assign({view:'front',marks:false},O));
  const brainOn=['ns','cns','brain'].includes(sel),cordOn=['ns','cns','cord'].includes(sel);
  ctx.fillStyle=C.cns;ctx.globalAlpha=brainOn?1:.28;ctx.beginPath();ctx.ellipse(O.cx,O.top+.042*O.h,.04*O.h,.032*O.h,0,0,6.2832);ctx.fill();ctx.globalAlpha=1;
  line(ctx,[M(0,.09),M(0,.34)],C.cns,cordOn?7:5,cordOn?1:.28);
  const armR=[M(0,.17),A('shoulderR'),A('elbowR'),A('wristR'),A('palmR')],armL=[M(0,.17),A('shoulderL'),A('elbowL'),A('wristL'),A('palmL')],legR=[M(0,.34),A('hipR'),A('kneeR'),A('ankleR'),A('footR')],legL=[M(0,.34),A('hipL'),A('kneeL'),A('ankleL'),A('footL')];
  const nerves=[armR,armL,legR,legL],rev=P=>P.slice().reverse(),heart=A('heart'),gut=M(.015,.33),bladder=M(0,.42),eye=M(.022,.052);
  const nn=['ns','pns','sens','mot','som'].includes(sel);nerves.forEach(P=>line(ctx,P,C.pns,nn?2.5:1.5,nn?.7:.25));
  if(sel==='pns'){nerves.forEach(P=>dots(ctx,P,C.pns,t,2,.25));line(ctx,[M(0,.06),eye],C.pns,2.5,.8);}
  if(sel==='sens'||sel==='ns'){dots(ctx,rev(armR).concat([M(0,.05)]),C.sens,t,3);dots(ctx,rev(legR).concat([M(0,.05)]),C.sens,t,3);}
  if(sel==='mot'||sel==='som'||sel==='ns'){dots(ctx,[M(0,.05)].concat(armL),C.mot,t,3);dots(ctx,[M(0,.05)].concat(legL),C.mot,t,3);}
  if(sel==='cns'||sel==='brain'||sel==='cord'){dots(ctx,[M(0,.05),M(0,.34)],'#fff',t,3,.3);}
  const T=(c,P)=>{line(ctx,P,c,2.5,.85);dots(ctx,P,c,t,2,.4);};
  const org=(p,c,r)=>{ctx.fillStyle=c;ctx.globalAlpha=.85;ctx.beginPath();ctx.arc(p[0],p[1],r,0,6.2832);ctx.fill();ctx.globalAlpha=1;};
  if(sel==='mot'||sel==='aut'||sel==='sym'||sel==='para'){org(heart,C.sym,10);org(gut,C.som,12);}
  if(sel==='sym'||sel==='aut'||sel==='mot'){T(sel==='sym'?C.sym:C.aut,[M(0,.22),M(.018,.22),heart]);T(sel==='sym'?C.sym:C.aut,[M(0,.3),gut]);if(sel==='sym')T(C.sym,[M(0,.19),M(.03,.1),eye]);}
  if(sel==='para'){T(C.para,[M(0,.1),M(.02,.16),heart]);T(C.para,[M(0,.1),M(.03,.2),M(.03,.28),gut]);T(C.para,[M(0,.1),M(.012,.08),eye]);org(bladder,C.aut,8);T(C.para,[M(0,.39),bladder]);line(ctx,[M(0,.34),M(0,.4)],C.cns,4,.28);}
  if(sel==='som'){const q=A('thighL'),r=A('upperarmL');org(q,C.som,10);org(r,C.som,9);}
}
const heartPath=(ctx,x,y,s)=>{ctx.beginPath();ctx.moveTo(x,y+s*.9);ctx.bezierCurveTo(x-s*1.4,y,x-s*.9,y-s,x,y-s*.3);ctx.bezierCurveTo(x+s*.9,y-s,x+s*1.4,y,x,y+s*.9);ctx.closePath();};
function drawBody(sim,ctx,k,t){const v=sim.st,sc=SC[sim.p.scen];
  const bar=(x,w,lab,val,c)=>{txt(ctx,lab,x,8+13*k*.75,{s:13*k,w:700});ctx.fillStyle=PAL['card2'];rr(ctx,x,10+13*k,w,12,6);ctx.fill();ctx.fillStyle=c;rr(ctx,x,10+13*k,Math.max(8,w*val),12,6);ctx.fill();};
  bar(10,380,'Sympathetic',v.sym,C.sym);bar(410,380,'Parasympathetic',v.par,C.para);
  const y0=38+13*k,RH=(492-y0)/5,O={cx:124,top:y0+4,h:492-y0-8},M=(x,y)=>{const q=BioLab.body.map(x,y,O);return [q.x,q.y];};
  BioLab.body.draw(ctx,Object.assign({view:'front',marks:false},O));
  const walk=sim.p.scen==='walk';
  if(walk){const f=[[0,.1],[0,.36],[.08,.46],[.06,.72],[.05,.93]].map(q=>M(q[0],q[1]));line(ctx,f,C.som,3,.85);dots(ctx,f,C.som,t,3,.35);}
  const cols=[C.sym,C.mot,C.sens,C.som,C.pns],orgs=[[.018,.21],[.022,.052],[-.05,.21],[.015,.33],[.06,.56]],RX=232,TX=RX+72;
  const row=(i,name,val,desc,icon)=>{const y=y0+i*RH,cy=y+RH/2,o=M(orgs[i][0],orgs[i][1]);
    ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=.55;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(o[0],o[1]);ctx.lineTo(RX-2,cy);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=cols[i];ctx.beginPath();ctx.arc(o[0],o[1],4.5,0,6.2832);ctx.fill();
    ctx.fillStyle=PAL['card2'];rr(ctx,RX,y+3,800-RX-8,RH-6,8);ctx.fill();icon(RX+36,cy);
    const head=name+(val?': '+val:'');txt(ctx,head,TX,cy-7.5*k,{s:13*k,w:700,b:'middle'});txt(ctx,desc,TX,cy+9*k,{s:12*k,c:PAL['cv-soft'],b:'middle'});};
  const beat=RM?1:1+.16*Math.max(0,Math.sin(t*v.hr/60*6.2832));
  row(0,'Heart rate',Math.round(v.hr)+' BPM',sc.hrT,(x,y)=>{ctx.fillStyle='#b03a2e';heartPath(ctx,x,y-2,17*beat);ctx.fill();});
  row(1,'Pupils',v.pu.toFixed(1)+' mm',sc.puT,(x,y)=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x,y,28,17,0,0,6.2832);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#4a7a9c';ctx.beginPath();ctx.arc(x,y,15,0,6.2832);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x,y,v.pu*1.9,0,6.2832);ctx.fill();});
  row(2,'Airways','',sc.airT,(x,y)=>{const w=3+v.air*11;ctx.strokeStyle='#d98a94';ctx.lineCap='round';ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y-20);ctx.lineTo(x,y-2);ctx.lineTo(x-18,y+18);ctx.moveTo(x,y-2);ctx.lineTo(x+18,y+18);ctx.stroke();ctx.lineCap='butt';});
  row(3,'Digestion','',sc.gutT,(x,y)=>{ctx.strokeStyle='#a85c1a';ctx.lineWidth=11;ctx.lineCap='round';ctx.beginPath();for(let i=0;i<=24;i++){const u=i/24,xx=x-28+56*u,yy=y+Math.sin(u*9+(RM?0:t*3*v.gut))*(2+9*v.gut);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();ctx.lineCap='butt';});
  row(4,'Blood vessels','',sc.vT,(x,y)=>{ctx.strokeStyle='#b03a2e';ctx.lineCap='round';ctx.lineWidth=2+v.vg*12;ctx.beginPath();ctx.moveTo(x-28,y-11);ctx.lineTo(x+28,y-11);ctx.stroke();ctx.lineWidth=2+v.vm*12;ctx.beginPath();ctx.moveTo(x-28,y+12);ctx.lineTo(x+28,y+12);ctx.stroke();ctx.lineCap='butt';});}
function drawBrainView(sim,ctx,k,t){const p=sim.p;drawBrain(ctx,12,14,500,368,p.part,k);
  const P=PARTS[p.part];ctx.fillStyle=PAL['card2'];rr(ctx,8,396,784,96,8);ctx.fill();ctx.strokeStyle=P.c;ctx.lineWidth=2.5;ctx.stroke();
  const y=wrap(ctx,P.n,20,396+14+6*k,760,{s:13.5*k,w:700});wrap(ctx,plain(lvText(P.t)),20,y+1,760,{s:12*k});
  /* cross control: front view, the figure's left on the viewer's right */
  const O={cx:662,top:120,h:268},M=(x,y)=>{const q=BioLab.body.map(x,y,O);return [q.x,q.y];};
  txt(ctx,'Cross-control',O.cx,14+13*k*.7,{s:13*k,w:700,a:'center'});
  BioLab.body.draw(ctx,Object.assign({view:'front',marks:false},O));
  const left=p.hemi==='left',hy=78,hc=O.cx,col=C.cns,HR=48;
  [[-1,'R'],[1,'L']].forEach(q=>{const on=(q[0]===1)===left;ctx.fillStyle=on?col:PAL['card2'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(hc+q[0]*(HR/2+2),hy,HR/2,28,0,0,6.2832);ctx.fill();ctx.stroke();txt(ctx,q[1],hc+q[0]*(HR/2+2),hy,{s:13*k,w:700,c:on?'#fff':PAL['cv-ink'],a:'center',b:'middle'});});
  const s=left?1:-1,path=[[hc+s*24,hy],[hc,hy+30],[hc-s*2,O.top+.11*O.h]].concat([[-s*.01,.17],[-s*.125,.185],[-s*.148,.36],[-s*.178,.482],[-s*.19,.52]].map(q=>M(q[0],q[1])));
  line(ctx,path,C.mot,3,.9);dots(ctx,path,C.mot,t,3,.4);const e=M(-s*.19,.52);ctx.fillStyle=C.mot;ctx.beginPath();ctx.arc(e[0],e[1],7,0,6.2832);ctx.fill();}
const NCOL='#7b58b5';
function neuronGeo(ty){if(ty==='sensory')return {sig:[[110,195],[640,195],[700,195]],axon:[[110,195],[700,195]],body:[420,92],stalk:[[420,195],[420,110]],dend:[80,195],term:[700,195],lab:{dend:[108,152],body:[510,92],axon:[250,240],myelin:[560,240],term:[716,262]},my:[130,650]};
  if(ty==='inter')return {sig:[[150,195],[235,195],[275,195],[510,195],[560,195]],axon:[[300,195],[510,195]],body:[265,195],dend:[210,195],term:[520,195],lab:{dend:[200,120],body:[270,262],axon:[400,160],term:[560,262]},my:null};
  return {sig:[[50,195],[120,195],[160,195],[640,195]],axon:[[150,195],[640,195]],body:[130,195],dend:[80,195],term:[640,195],lab:{dend:[80,104],body:[120,276],axon:[420,240],myelin:[420,150],term:[640,276]},my:[190,600]};}
function drawNeuron(sim,ctx,k,t,hits){const p=sim.p,ty=p.ntype,g=neuronGeo(ty),hon=atLeast('honors'),box=(x,w,c,a,b)=>{ctx.fillStyle=c;rr(ctx,x,44,w,300,12);ctx.fill();const m=x+w/2;if(b){txt(ctx,a,m,334-16*k,{s:12.5*k,w:700,c:'#fff',a:'center',b:'middle'});txt(ctx,b,m,334,{s:12.5*k,w:700,c:'#fff',a:'center',b:'middle'});}else txt(ctx,a,m,330,{s:12.5*k,w:700,c:'#fff',a:'center',b:'middle'});};
  txt(ctx,NT[ty].n,400,14+6*k,{s:14*k,w:700,a:'center'});
  if(ty==='motor'){box(10,200,'#5a6470','Spinal cord');box(660,130,'#a8324a','Skeletal','muscle');}
  if(ty==='sensory'){box(10,120,'#a85c1a','Skin','receptor');box(650,140,'#5a6470','Spinal cord');}
  if(ty==='inter')box(140,500,'#5a6470','Spinal cord');
  const dendAt=(x,y,dirs)=>{ctx.strokeStyle=NCOL;ctx.lineCap='round';dirs.forEach(a=>{const L=48;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y);const ex=x+Math.cos(a)*L,ey=y+Math.sin(a)*L;ctx.lineTo(ex,ey);ctx.stroke();ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex+Math.cos(a-.5)*18,ey+Math.sin(a-.5)*18);ctx.moveTo(ex,ey);ctx.lineTo(ex+Math.cos(a+.5)*18,ey+Math.sin(a+.5)*18);ctx.stroke();});ctx.lineCap='butt';};
  const b=g.body;
  if(ty==='sensory')dendAt(112,195,[-2.5,2.5,3.14]);else dendAt(b[0],b[1],[-2.4,-1.5,2.4,1.5,-3.05,3.05]);
  ctx.strokeStyle=NCOL;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(g.axon[0][0],g.axon[0][1]);ctx.lineTo(g.axon[1][0],g.axon[1][1]);ctx.stroke();
  if(g.stalk){ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(g.stalk[0][0],g.stalk[0][1]);ctx.lineTo(g.stalk[1][0],g.stalk[1][1]);ctx.stroke();}
  if(g.my)for(let x=g.my[0];x<g.my[1];x+=72){if(g.stalk&&x<420&&x+62>420)continue;ctx.fillStyle='#e9d9a4';rr(ctx,x,183,62,24,11);ctx.fill();ctx.strokeStyle='#b39c55';ctx.lineWidth=1.2;ctx.stroke();}
  const te=g.term;[-24,0,24].forEach(o=>{ctx.strokeStyle=NCOL;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(te[0],te[1]);ctx.lineTo(te[0]+26,te[1]+o);ctx.stroke();ctx.fillStyle=NCOL;ctx.beginPath();ctx.arc(te[0]+30,te[1]+o,8,0,6.2832);ctx.fill();});
  ctx.fillStyle=NCOL;ctx.beginPath();ctx.arc(b[0],b[1],30,0,6.2832);ctx.fill();ctx.fillStyle='#4b3d8f';ctx.beginPath();ctx.arc(b[0]-3,b[1]-2,11,0,6.2832);ctx.fill();
  dots(ctx,g.sig,PAL['cv-e'],t,2,.3);
  const items=['dend','body','axon'].concat(hon&&g.my?['myelin']:[]).concat(hon?['term']:[]);
  items.forEach(id=>{const q=g.lab[id];if(!q)return;const sel=p.npart===id;ctx.font='700 '+12.5*k+'px '+FONT;const w=ctx.measureText(NP[id].n).width+16,h=12.5*k+10,x=clamp(q[0]-w/2,4,796-w),y=q[1]-h/2;ctx.fillStyle=sel?PAL['rj']:PAL['card'];rr(ctx,x,y,w,h,6);ctx.fill();ctx.strokeStyle=sel?PAL['rj']:PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();txt(ctx,NP[id].n,x+w/2,q[1]+1,{s:12.5*k,w:700,c:sel?'#fff':PAL['cv-ink'],a:'center',b:'middle'});hits.push({x,y,w,h,v:id});});
  ctx.fillStyle=PAL['card2'];rr(ctx,8,398,784,94,8);ctx.fill();ctx.strokeStyle=NCOL;ctx.lineWidth=2;ctx.stroke();
  const P=NP[p.npart]||NP.dend,tx=(P.t?plain(lvText(P.t)):'')||plain(NP.dend.t.bio);const y=wrap(ctx,P.n,20,398+13+6*k,760,{s:13*k,w:700});wrap(ctx,tx,20,y+1,760,{s:12*k});}

const SIM={id:'nsmap',hash:'nsmap',apUnit:9,order:10,kind:'Learning tool',tab:'Nervous system map',next:['reaction','neuron'],
  card:'Click through CNS, PNS, somatic and autonomic. Then get startled and watch your heart, pupils, airways and gut respond.',
  title:'Nervous system map',
  lede:{bio:'Sort the nervous system into its divisions, then watch each one act on the body: walking home, startled and after dinner.',
    honors:'Follow afferent and efferent signals through each division, and connect each brain region to its job.',
    ap:'Add the anatomy behind the divisions: cranial and spinal nerve counts, thoracolumbar and craniosacral outflow, and the neurotransmitters at each target.'},
  scale:'One whole person. Neurons in the Neuron view are drawn huge: a real cell body is about 20 µm wide, and an axon can be 1 m long.',
  aspect:1.6,timeless:true,animated:true,tourReset:true,
  controls:[
    {id:'view',label:'View',type:'seg',def:'tree',lvl:'bio',noTrial:true,options:[{v:'tree',l:'Divisions'},{v:'body',l:'Body'},{v:'brain',l:'Brain'},{v:'neuron',l:'Neuron'}]},
    {id:'node',label:'Division',type:'select',def:'cns',lvl:'bio',noTrial:true,options:NKEY.map(id=>({v:id,l:NODES[id].full||NODES[id].n}))},
    {id:'scen',label:'Scenario',type:'seg',def:'walk',lvl:'bio',options:Object.keys(SC).map(id=>({v:id,l:SC[id].n}))},
    {id:'part',label:'Brain part',type:'select',def:'frontal',lvl:'bio',noTrial:true,options:Object.keys(PARTS).map(id=>({v:id,l:PARTS[id].n}))},
    {id:'hemi',label:'Active hemisphere',type:'seg',def:'left',lvl:'bio',noTrial:true,options:[{v:'left',l:'Left'},{v:'right',l:'Right'}]},
    {id:'ntype',label:'Neuron type',type:'seg',def:'motor',lvl:'bio',noTrial:true,options:[{v:'sensory',l:'Sensory'},{v:'inter',l:'Interneuron'},{v:'motor',l:'Motor'}],onChange(sim){if(sim.p.ntype==='inter'&&sim.p.npart==='myelin')sim.p.npart='axon';}},
    {id:'npart',label:'Neuron part',type:'select',def:'dend',lvl:'bio',noTrial:true,options:[{v:'dend',l:'Dendrites'},{v:'body',l:'Cell body'},{v:'axon',l:'Axon'},{v:'myelin',l:'Myelin sheath',lvl:'honors'},{v:'term',l:'Axon terminal',lvl:'honors'}]}
  ],
  init(sim){const c=SC[(sim&&sim.p&&sim.p.scen)||'walk'];return {sym:c.sym,par:c.par,hr:c.hr,pu:c.pu,air:c.air,gut:c.gut,vg:c.vg,vm:c.vm};},
  step(sim,dt){const s=sim.st,c=SC[sim.p.scen],up=c.sym>s.sym;const rt=clamp(dt*(up?2.2:.8),0,1);['sym','par','hr','pu','air','gut','vg','vm'].forEach(k=>{s[k]=lerp(s[k],c[k],rt);});},
  metrics:[
    {id:'hr',label:'Heart rate',unit:'BPM',lvl:'bio',min:40,max:160,d:0,get:s=>s.st.hr},
    {id:'pu',label:'Pupil diameter',unit:'mm',lvl:'bio',min:0,max:9,d:1,get:s=>s.st.pu},
    {id:'sym',label:'Sympathetic activity',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>s.st.sym*100},
    {id:'par',label:'Parasympathetic activity',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>s.st.par*100},
    {id:'air',label:'Airways',text:true,lvl:'bio',get:s=>SC[s.p.scen].airT},
    {id:'gut',label:'Digestion',text:true,lvl:'bio',get:s=>SC[s.p.scen].gutT},
    {id:'ves',label:'Blood vessels',text:true,lvl:'bio',get:s=>SC[s.p.scen].vT}
  ],
  graph:false,
  infoPanel(sim){const p=sim.p;let h='';
    if(p.view==='tree'){const N=NODES[p.node];h='<h3>'+(N.full||N.n)+'</h3><p>'+lvText(N.info)+'</p>';if(N.up)h+='<p class="muted">Part of: '+(NODES[N.up].full||NODES[N.up].n)+'</p>';}
    else if(p.view==='body'){const c=SC[p.scen];h='<h3>'+c.n+'</h3><p>'+c.nar+'</p>';if(atLeast('honors'))h+='<p>Most organs get both autonomic divisions, and the balance sets the result. Most blood vessels are the exception: they are controlled mainly by sympathetic signals, more or less of them.</p>';}
    else if(p.view==='brain'){const P=PARTS[p.part];h='<h3>'+P.n+'</h3><p>'+lvText(P.t)+'</p><p><b>Cross-control:</b> the '+p.hemi+' hemisphere moves the '+(p.hemi==='left'?'right':'left')+' side of the body, because motor pathways cross in the brain stem.</p>';}
    else{const P=NP[p.npart]||NP.dend;h='<h3>'+NT[p.ntype].n+'</h3><p>'+NT[p.ntype].t+'</p><p><b>'+P.n+':</b> '+(P.t?lvText(P.t):'')+'</p><p>Next: see how the signal itself works in <a href="#neuron">Neurons and action potentials</a>.</p>';}
    return h;},
  challenges:[
    {lvl:'bio',instant:true,q:'You decide to pick up a pencil. Which division sends the signal to your hand muscles?',choices:['Somatic','Sympathetic','Parasympathetic'],correct:0,show:{view:'tree',node:'som'},explain:{bio:'You chose it and it uses skeletal muscle, so it is somatic. Somatic = select.'}},
    {lvl:'bio',instant:true,q:'A loud bang goes off behind you. What do your pupils do?',choices:['Dilate','Constrict','Stay the same'],correct:0,show:{view:'body',scen:'scare'},explain:{bio:'The sympathetic division opens the pupils to let in more light, along with a faster heart and wider airways. Run the Startled scenario and read the pupil diameter.'}},
    {lvl:'bio',instant:true,q:'A signal from your fingertip to your spinal cord travels on which kind of neuron?',choices:['Sensory, which is afferent','Motor, which is efferent','An interneuron in your finger'],correct:0,show:{view:'neuron',ntype:'sensory'},explain:{bio:'Afferent signals arrive at the CNS. Sensory neurons carry them in, and efferent motor neurons carry commands out.'}},
    {lvl:'honors',instant:true,q:'A stroke damages the left motor cortex. Which side of the body is most likely to be weak?',choices:['The right side','The left side','Both sides equally'],correct:0,show:{view:'brain',part:'frontal',hemi:'left'},explain:{honors:'Motor pathways cross in the brain stem, so each hemisphere controls the opposite side of the body.'}},
    {lvl:'honors',instant:true,q:'You finish a big dinner and sit down. What happens to your digestion, and which division drives it?',choices:['It speeds up, driven by the parasympathetic division','It speeds up, driven by the sympathetic division','It slows down, driven by the parasympathetic division'],correct:0,show:{view:'body',scen:'dinner'},explain:{honors:'Rest and digest is the parasympathetic division. It raises gut motion and secretions while it slows the heart.'}},
    {lvl:'honors',instant:true,q:'Your balance is off after a hit to the back of the head. Which brain part most likely coordinates balance?',choices:['Cerebellum','Occipital lobe','Temporal lobe'],correct:0,show:{view:'brain',part:'cerebellum'},explain:{honors:'The cerebellum coordinates balance and movement. The occipital lobe, also at the back, handles vision.'}},
    {lvl:'ap',instant:true,q:'Which neurotransmitter do parasympathetic fibers release at the heart, slowing it?',choices:['Acetylcholine','Norepinephrine','Epinephrine'],correct:0,show:{view:'tree',node:'para'},explain:{ap:'Parasympathetic fibers release acetylcholine at their targets. Most sympathetic fibers release norepinephrine, and the adrenal medulla adds epinephrine to the blood.'}},
    {lvl:'ap',instant:true,q:'A patient’s heart rate falls with vagus nerve stimulation. Why does this make sense?',choices:['The vagus nerve carries parasympathetic fibers to the heart','The vagus nerve is sympathetic and tires the heart out','The vagus nerve is somatic and controls cardiac muscle on purpose'],correct:0,show:{view:'tree',node:'para'},explain:{ap:'The vagus is cranial nerve X and carries most parasympathetic fibers. It slows the heart’s pacemaker.'}}
  ],
  onChallenge(sim,ch){if(ch&&ch.show)BioLab.setValues(sim,ch.show);},
  narrate(sim){const p=sim.p;
    if(p.view==='tree'){const N=NODES[p.node];return '<b>'+(N.full||N.n)+'.</b> '+N.short+' Click a box or use <b>Division</b> to move through the map.';}
    if(p.view==='body')return SC[p.scen].nar;
    if(p.view==='brain'){const P=PARTS[p.part];return '<b>'+P.n+'.</b> '+plain(lvText(P.t))+' The '+p.hemi+' hemisphere is moving the '+(p.hemi==='left'?'right':'left')+' hand.';}
    const P=NP[p.npart]||NP.dend;return '<b>'+NT[p.ntype].n+'.</b> '+NT[p.ntype].t+' The yellow dots show which way the signal goes.';},
  tour:[
    {title:'Two big divisions',text:'The central nervous system (CNS) is the brain and spinal cord, where integration happens. Everything else is the peripheral nervous system (PNS): the cranial and spinal nerves.',focus:[0,0,800,500],pause:true,setup(sim){BioLab.setValues(sim,{view:'tree',node:'cns'});}},
    {title:'Arrives and exits',text:'The PNS has a sensory side and a motor side. Sensory signals are afferent: they arrive at the CNS. Motor signals are efferent: they exit it.',focus:[0,0,800,500],speed:1,setup(sim){BioLab.setValues(sim,{view:'tree',node:'mot'});}},
    {title:'Select or automatic',text:'Motor signals split again. Somatic goes to skeletal muscle and you select it. Autonomic goes to smooth muscle, cardiac muscle and glands, and runs automatically.',focus:[0,0,800,500],speed:1,setup(sim){BioLab.setValues(sim,{view:'tree',node:'aut'});}},
    {title:'Fight or flight',text:'A loud bang. The sympathetic division speeds the heart, opens the pupils and airways, and sends blood from the gut to the muscles.',focus:[0,0,800,500],speed:1,setup(sim){BioLab.setValues(sim,{view:'body',scen:'scare'});}},
    {title:'Rest and digest',text:'After dinner, the parasympathetic division takes over. The heart slows, the pupils narrow and the gut gets to work.',focus:[0,0,800,500],speed:1,setup(sim){BioLab.setValues(sim,{view:'body',scen:'dinner'});}},
    {title:'The brain’s regions',text:'Each lobe of the cerebrum has main jobs. The cerebellum coordinates movement, and the brain stem keeps you breathing. Each hemisphere runs the opposite side of the body.',focus:[0,0,800,500],speed:1,setup(sim){BioLab.setValues(sim,{view:'brain',part:'cerebrum',hemi:'left'});}},
    {title:'The cells that carry it',text:'Sensory neurons bring signals in, interneurons connect inside the CNS and motor neurons send commands out. Dendrites receive, the axon carries.',focus:[0,0,800,500],speed:1,setup(sim){BioLab.setValues(sim,{view:'neuron',ntype:'motor',npart:'axon'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{view:'tree',node:'cns',scen:'walk'});},
  lab:{bio:'<p><b>Question:</b> How does the autonomic nervous system change the body from one situation to the next?</p><ol><li>Go to the <b>Body</b> view. For each scenario, wait a few seconds for the body to settle, then record a trial.</li><li>Make a table with heart rate, pupils, airways, digestion and blood vessels for each scenario.</li></ol><p>For each organ, say whether the sympathetic or the parasympathetic division is driving the change.</p>',
    honors:'<p><b>Question:</b> Why does the body shut down digestion when you are startled?</p><ol><li>In the <b>Body</b> view, record sympathetic and parasympathetic activity in all three scenarios.</li><li>Compare blood vessels in the gut and in muscle.</li></ol><p>Explain how sending blood away from the gut helps in a fight-or-flight situation, and why walking home uses both divisions at once.</p>',
    ap:'<p><b>Question:</b> How can one organ get opposite commands?</p><ol><li>For the heart, pupils, airways and gut, list the effect of each autonomic division.</li><li>Add where its fibers leave the CNS and which neurotransmitter they release at the target.</li></ol><p><b>Claim, evidence, reasoning:</b> Explain why “balance” is a better word than “switch” for the autonomic system, using the Walking home scenario.</p>'},
  terms:[{t:'Central nervous system (CNS)',d:'The brain and spinal cord.'},{t:'Peripheral nervous system (PNS)',d:'The cranial and spinal nerves outside the CNS.'},{t:'Sensory (afferent)',d:'Carries signals to the CNS. Afferent = arrives.'},{t:'Motor (efferent)',d:'Carries signals from the CNS. Efferent = exits.'},{t:'Somatic',d:'Voluntary control of skeletal muscle. Somatic = select.'},{t:'Autonomic',d:'Involuntary control of smooth muscle, cardiac muscle and glands. Autonomic = automatic.'},{t:'Sympathetic',d:'The fight-or-flight autonomic division.'},{t:'Parasympathetic',d:'The rest-and-digest autonomic division.'},{t:'Cerebrum',d:'The largest part of the brain, with two hemispheres and four lobes.'},{t:'Cerebellum',d:'Coordinates movement and balance.'},{t:'Brain stem',d:'Connects the brain and spinal cord and runs breathing and heart rate.'},{t:'Interneuron',d:'A neuron inside the CNS that connects other neurons.'},
    {lvl:'ap',t:'Thoracolumbar and craniosacral',d:'Where autonomic fibers leave the CNS: sympathetic from T1 to L2, parasympathetic from the brain stem and sacral cord.'},{lvl:'ap',t:'Vagus nerve',d:'Cranial nerve X, which carries most parasympathetic fibers to the chest and abdomen.'}],
  about:'<p>This is a map, not a measurement. The tree follows the course notes: CNS and PNS; sensory and motor; somatic and autonomic; sympathetic and parasympathetic.</p><p><b>What is simplified.</b> The numbers in the Body view (heart rate 68 to 125 BPM, pupils 2.5 to 6.5 mm) are typical round values chosen to show the real direction of each effect, not data from one person. Eating actually nudges heart rate up a few beats for a while, even in rest and digest: the model shows the parasympathetic direction. Autonomic activity is shown as a single bar for each division, but real activity differs organ by organ. Lobes have main jobs, not exclusive ones, and many tasks use several regions. Cross-control applies to most movement and touch; vision and hearing are organized differently. Neurons are drawn out of scale. A sensory neuron’s input fiber is technically part of a single long process, drawn here with its receptor end labeled as dendrites, as most textbooks do.</p>',
  draw(sim,ctx,vdt,k,t){syncCtl(sim);ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);const hits=sim.vis.hits=[];const v=sim.p.view;
    if(v==='tree')drawTree(sim,ctx,k,t,hits);else if(v==='body')drawBody(sim,ctx,k,t);else if(v==='brain')drawBrainView(sim,ctx,k,t);else drawNeuron(sim,ctx,k,t,hits);},
  onClick(sim,x,y){const v=sim.p.view;
    if(v==='brain'){const r=brainHit((x-12)/500,(y-14)/368);if(r)BioLab.setValues(sim,{part:r});return;}
    const h=(sim.vis.hits||[]).find(q=>x>=q.x&&x<=q.x+q.w&&y>=q.y&&y<=q.y+q.h);if(!h)return;BioLab.setValues(sim,v==='tree'?{node:h.v}:{npart:h.v});}
};
BioLab.register(SIM);
})();
