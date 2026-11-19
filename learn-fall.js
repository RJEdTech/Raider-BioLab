/* Learn it for the fall tools still without it (Nov 18, 2026, evening build, helper A):
   cellexplorer, microscope, signaling, expdesign, pillbug, protein, neuron.
   Same shape as learn-more.js: one BioLab.addLearn block, plus extra why questions appended to tools that had only five.
   Numbers in the text were probed from each model (protein melting curve, signaling steady states, expdesign 24 h counts). */
(function(){
'use strict';
/* ---- shared helpers for learn-more.js (copied into each site's file) ---- */
const H=BioLab.h,PAL=H.PAL;
const RED='#b3261e',GREEN='#1b7a3a',BLUE='#1f5fbf',HI='#c8102e';
const DEF=id=>BioLab.defs.find(d=>d.id===id);
/* the tool's own walkthrough steps, captured before Learn it replaces them */
const TOUR={};BioLab.defs.forEach(d=>{TOUR[d.id]=(d.tour||[]).slice();});
const TS=(id,title)=>{const s=(TOUR[id]||[]).find(x=>{const t=typeof x.title==='object'?Object.values(x.title).join('|'):String(x.title||'');return t.indexOf(title)>=0;});return s&&s.setup?s.setup:null;};
const tour=(id,title)=>sim=>{const f=TS(id,title);if(f)f(sim);};
const met=(sim,id)=>(sim.def.metrics||[]).find(m=>m.id===id);
const M=(sim,id)=>{const m=met(sim,id);if(!m)return NaN;try{return m.get(sim);}catch(e){return NaN;}};
const pick=(v)=>{if(v&&typeof v==='object'){const L=H.level||'bio';return v[L]||(L==='ap'&&v.honors)||v.bio||Object.values(v)[0];}return v;};
/* formatted metric: "label: value unit" or just value */
const F=(sim,id,d)=>{const m=met(sim,id);if(!m)return '…';let v;try{v=m.get(sim);}catch(e){return '…';}
  if(v==null)return '…';if(typeof v==='string')return v;if(!isFinite(v))return '…';
  const dd=d!=null?d:(m.d!=null?m.d:1);let s=Math.abs(v)>=1e4&&dd===0?Math.round(v).toLocaleString('en-US'):v.toFixed(dd);
  const u=pick(m.unit);return s+(u&&!/^\(|^of |^\(/.test(u)&&u.length<14?' '+u:'');};
const FL=(sim,id,d)=>{const m=met(sim,id);return (m?pick(m.label):id)+': '+F(sim,id,d);};
/* card: word-wrapped rows. pos: [x,y] top-left, or {x,y,w,up} */
function card(ctx,k,x,y,w,L,o){o=o||{};const kk=Math.min(k,1.35),pad=10*kk,rows=[];
  L.filter(r=>r!==''&&r!=null).forEach(r=>{const t=Array.isArray(r)?r:[r,{}],op=t[1]||{},sz=(op.s||13)*kk;ctx.font=(op.w||600)+' '+sz+'px '+H.FONT;
    const words=String(t[0]).split(' ');let cur='';words.forEach(wd=>{const tr=cur?cur+' '+wd:wd;if(cur&&ctx.measureText(tr).width>w-2*pad){rows.push([cur,op,sz]);cur=wd;}else cur=tr;});if(cur)rows.push([cur,op,sz]);});
  let h=pad*1.6;rows.forEach(r=>h+=r[2]*1.35);if(o.up)y-=h;
  ctx.save();H.rr(ctx,x,y,w,h,9);ctx.fillStyle=PAL['cv-sol']||PAL['card'];ctx.globalAlpha=0.96;ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=o.hi===false?1.2:2.5;ctx.strokeStyle=o.hi===false?PAL['cv-soft']:HI;ctx.stroke();
  let yy=y+pad*0.8;rows.forEach(([s,op,sz])=>{yy+=sz*1.1;H.txt(ctx,s,x+pad,yy,{s:sz,w:op.w||600,c:op.c||PAL['cv-ink']});yy+=sz*0.25;});ctx.restore();return h;}
/* red ring around the part of the picture that matters in this step */
function ring(ctx,k,r,tau){if(!r)return;const a=0.55+0.45*Math.sin((tau||0)*4);ctx.save();ctx.globalAlpha=a;ctx.lineWidth=3;ctx.strokeStyle=HI;ctx.setLineDash([7,5]);H.rr(ctx,r[0],r[1],r[2],r[3],10);ctx.stroke();ctx.restore();}
const atT=(sim,tau,t,key,fn)=>{sim._at=sim._at||{};const kk=(sim.lnKey||'')+':'+key;if(tau>=t&&!sim._at[kk]){sim._at[kk]=1;fn(sim);}};
const atReset=sim=>{sim._at={};};
const L={},ADD={};
const ACT=(sim,id)=>{const a=(sim.def.actions||[]).find(x=>x.id===id);if(a)a.run(sim);};
const TF=(id,title)=>{const s=(TOUR[id]||[]).find(x=>{const t=typeof x.title==='object'?Object.values(x.title).join('|'):String(x.title||'');return t.indexOf(title)>=0;});return s?s.focus:null;};
/* run the model forward (no drawing) until cond(sim) holds or n steps pass */
const ffwd=(sim,dt,cond,n)=>{let i=0;while(!cond(sim)&&i<(n||20000)){sim.def.step(sim,dt);sim.t=(sim.t||0)+dt;i++;}};

/* ---------- neuron ---------- */
/* Hodgkin–Huxley, same constants as sims/neuron.js, for the action-potential graph step */
const nrRates=V=>{const am=Math.abs(V+40)<1e-6?1:0.1*(V+40)/(1-Math.exp(-(V+40)/10)),bm=4*Math.exp(-(V+65)/18),ah=0.07*Math.exp(-(V+65)/20),bh=1/(1+Math.exp(-(V+35)/10)),an=Math.abs(V+55)<1e-6?0.1:0.01*(V+55)/(1-Math.exp(-(V+55)/10)),bn=0.125*Math.exp(-(V+65)/80);return {am,bm,ah,bh,an,bn};};
let NR_TRACE=null;
function nrTrace(){if(NR_TRACE)return NR_TRACE;let V=-65,r=nrRates(V),m=r.am/(r.am+r.bm),h=r.ah/(r.ah+r.bh),n=r.an/(r.an+r.bn);const out=[],dt=0.01;
  for(let t=0;t<=20;t+=dt){const I=(t>=2&&t<3)?15:0;r=nrRates(V);m+=dt*(r.am*(1-m)-r.bm*m);h+=dt*(r.ah*(1-h)-r.bh*h);n+=dt*(r.an*(1-n)-r.bn*n);
    V+=dt*(I-120*m*m*m*h*(V-50)-36*n*n*n*n*(V+77)-0.3*(V+54.387));if(Math.round(t/dt)%5===0)out.push([t,V]);}
  return NR_TRACE=out;}
const nrVel=(my,d)=>my?6*d:1.1*Math.sqrt(d);
const nrOsc=(ctx,k,LH,rows)=>card(ctx,k,541,LH-14,246,rows,{up:true});
const nrMem=(ctx,k,LH,rows)=>card(ctx,k,12,LH-12,420,rows,{up:true});
L.neuron={
  goals:{
    bio:['How a neuron keeps its inside negative at rest','Why an action potential is all or nothing','How Na⁺ rushing in and K⁺ flowing out make the spike','How myelin makes a signal travel faster'],
    honors:['What threshold and the refractory period are','How a stronger stimulus becomes more spikes, not bigger ones','How toxins and numbing drugs block Na⁺ channels'],
    ap:['Why voltage-gated Na⁺ channels open before K⁺ channels','How positive feedback drives the rising phase','How axon diameter and myelin set conduction speed']},
  matters:'Every feeling, thought and movement rides on action potentials. They explain why a dentist’s shot numbs your lip, why pufferfish toxin paralyzes, and why multiple sclerosis slows signals.',
  steps:[
    {key:'parts',title:'A cell built to carry signals',set:{freq:0},speed:0.25,focus:[0,8,800,140],
     see:'Dendrites (left) collect signals, the cell body adds them up, and the long axon carries a pulse to the terminal (right).',
     why:'There the message passes to the next cell. This axon is drawn 10 mm long; some of yours are a meter.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[4,8,792,134],tau);}},
    {key:'rest',title:'At rest: the inside is negative',set:{freq:0},pause:true,focus:[8,166,516,276],
     see:'The membrane up close. Na⁺ (gold) is mostly outside, K⁺ (purple) mostly inside. The inside reads about −65 mV.',
     why:'The Na⁺/K⁺ pump uses ATP to keep the ions sorted, like charging a battery. That stored charge powers every signal.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[8,166,516,276],tau);nrOsc(ctx,k,LH,[['Inside: '+F(sim,'V',0),{w:800}],['Resting value: about −65 mV',{s:12}]]);}},
    {key:'weak',title:'A weak push: nothing fires',set:{freq:50,strength:4},fresh:true,speed:0.3,
     see:'Small pulses hit the axon. On the oscilloscope the voltage blips up a few millivolts and sinks back.',
     why:'The push never reaches threshold, about −55 mV, so too few Na⁺ channels open to start the chain reaction. No spike.',
     overlay(sim,ctx,LH,k){nrMem(ctx,k,LH,[['Spikes fired: '+F(sim,'count',0),{w:800,c:RED}],['Threshold: about −55 mV',{s:12}]]);}},
    {key:'spike',title:'Past threshold: Na⁺ rushes in',set:{freq:5,strength:15},fresh:true,speed:0.15,focus:[8,166,516,276],
     see:'A stronger pulse. Blue Na⁺ channels snap open and gold Na⁺ pours in. The inside swings to about +40 mV.',
     why:'Entering Na⁺ opens more Na⁺ channels: a chain reaction. Past threshold, the spike always runs to full size: all or nothing.',
     overlay(sim,ctx,LH,k){nrOsc(ctx,k,LH,[['Inside: '+F(sim,'V',0),{w:800}],['Spikes fired: '+F(sim,'count',0)]]);}},
    {key:'repol',title:'Then K⁺ flows out',set:{freq:5,strength:15},fresh:true,speed:0.15,focus:[8,166,516,276],
     see:'After the peak, Na⁺ channels shut, green K⁺ channels open and purple K⁺ leaves. The inside dips below −65 mV for a moment.',
     why:'K⁺ carries positive charge out. The brief dip, the undershoot, comes from K⁺ channels that are slow to close.',
     overlay(sim,ctx,LH,k){nrOsc(ctx,k,LH,[['Inside: '+F(sim,'V',0),{w:800}]]);}},
    {key:'apgraph',title:'The action potential as a graph',set:{freq:0},pause:true,
     see:'One spike drawn as voltage against time: rest, a sharp rise past threshold, a fall and a small dip.',
     why:'Rise: Na⁺ rushing in. Fall: K⁺ flowing out. Dip: K⁺ channels slow to close. Every spike from this neuron has this shape.',
     overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,B={x0:150,x1:740,y0:62,y1:360},xr=[0,20],p=tau%14;K.dim(ctx,LH);
       const sc=v=>(v+90)/140;K.axes(ctx,B,k,{xr,xt:[[0,'0'],[5,'5'],[10,'10'],[15,'15'],[20,'20']],yt:[[sc(-80),'−80'],[sc(-40),'−40'],[sc(0),'0'],[sc(40),'+40']],xl:'Time (ms)',yl:'Voltage inside (mV)'});
       const tr=nrTrace(),yT=K.Y(B,sc(-55));ctx.save();ctx.strokeStyle='#d08a00';ctx.setLineDash([7,6]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(B.x0,yT);ctx.lineTo(B.x1,yT);ctx.stroke();ctx.restore();
       K.tagA(ctx,'threshold −55 mV',B.x1,yT-16,k,{s:11.5,c:'#8a5a00'},'r');
       const to=Math.min(20,p*4);ctx.save();ctx.strokeStyle='#1b7a3a';ctx.lineWidth=3.5;ctx.lineJoin='round';ctx.beginPath();tr.filter(q=>q[0]<=to).forEach((q,i)=>{const x=K.X(B,xr,q[0]),y=K.Y(B,sc(q[1]));i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.restore();
       if(to>3.4)K.tagA(ctx,'Na⁺ in →',K.X(B,xr,3.2)-10,K.Y(B,sc(10)),k,{s:12.5,hi:true},'r');
       if(to>5.5)K.tagA(ctx,'← K⁺ out',K.X(B,xr,4.7)+12,K.Y(B,sc(-20)),k,{s:12.5,hi:true},'l');
       if(to>9)K.tagA(ctx,'undershoot',K.X(B,xr,7.5),K.Y(B,sc(-77))+22,k,{s:12},'l');
       K.tagA(ctx,'resting −65 mV',B.x0+8,K.Y(B,sc(-65))+22,k,{s:12},'l');}},
    {key:'rate',title:'Stronger means more spikes, not bigger',set:{stim:'steady',strength:20},fresh:true,speed:2.5,
     cause:{from:{strength:8},delay:3,dur:1.2,label:'Stimulus'},
     see:'A steady stimulus, raised from 8 to 20. The spikes come closer together, but each one reaches about the same height.',
     why:'A bigger push reaches threshold sooner after each spike, so the neuron fires more often. Strength is coded as rate, not size.',
     overlay(sim,ctx,LH,k){nrMem(ctx,k,LH,[[FL(sim,'rate',0),{w:800,c:RED}],[FL(sim,'peak',0)]]);}},
    {key:'travel',title:'The spike travels down the axon',set:{freq:0,myelin:false},fresh:true,speed:0.2,run:tour('neuron','The signal travels'),focus:[100,40,700,80],
     see:'One spike sweeps along the bare axon, from the cell body toward the terminal.',
     why:'Each patch of membrane that fires pushes the next patch to threshold, like falling dominoes. On a bare axon that crawls along.',
     overlay(sim,ctx,LH,k){nrMem(ctx,k,LH,[[FL(sim,'vel',1),{w:800}],['No myelin',{s:12}]]);}},
    {key:'myelin',title:'Myelin makes it jump',set:{freq:0,myelin:true},fresh:true,speed:0.03,run:tour('neuron','Myelin makes it jump'),focus:[100,40,700,80],
     see:'Now the axon is wrapped in myelin. The spike jumps from gap to gap, the nodes of Ranvier. Time is slowed way down.',
     why:'Myelin insulates, so ions cross only at the gaps and current races ahead underneath: about 17 times faster.',
     overlay(sim,ctx,LH,k){nrMem(ctx,k,LH,[[FL(sim,'vel',1),{w:800,c:GREEN}],['With myelin',{s:12}]]);}},
    {key:'hook',title:'Your question: foot to spine',set:{freq:0,myelin:true},pause:true,
     see:'A tack signal has about 1 m to travel. The card gives this axon’s speed with and without myelin.',
     why:'At 3.5 m/s, 1 m takes about 0.29 s. At 60 m/s it takes about 17 ms. Either way, each spike is full size.',
     overlay(sim,ctx,LH,k){const d=sim.p.diam||10,b=nrVel(false,d),m=nrVel(true,d);
       nrMem(ctx,k,LH,[['Trip of 1 m',{w:800}],['No myelin: '+b.toFixed(1)+' m/s → '+Math.round(1000/b)+' ms'],['Myelin: '+m.toFixed(0)+' m/s → '+Math.round(1000/m)+' ms',{w:800,c:GREEN}]]);}},
    {key:'refr',lvl:'honors',title:'Too soon: the refractory period',set:{freq:0,strength:15,gap:5},fresh:true,speed:0.25,run:sim=>{sim.st.pulses.push(sim.t+1,sim.t+6);},
     see:'Two strong pulses, 5 ms apart. Only the first one fires a spike.',
     why:'Right after a spike, Na⁺ channels are locked shut and K⁺ channels still open. Until they reset, the neuron can’t fire again.',
     so:'That keeps signals moving one way.',
     overlay(sim,ctx,LH,k){nrMem(ctx,k,LH,[['Pulses: 2',{w:700}],['Spikes fired: '+F(sim,'count',0),{w:800,c:RED}]]);}},
    {key:'ttx',lvl:'honors',title:'Pufferfish toxin blocks the spike',set:{stim:'steady',strength:15,ttx:true},fresh:true,speed:0.4,
     see:'A steady stimulus that fires spikes on its own, now with tetrodotoxin. The voltage rises a little, but nothing fires.',
     why:'The toxin plugs Na⁺ channels, so Na⁺ can’t rush in and no signals reach the muscles. Lidocaine works the same way, more gently.',
     overlay(sim,ctx,LH,k){nrMem(ctx,k,LH,[['Tetrodotoxin: on',{w:700}],['Spikes fired: '+F(sim,'count',0),{w:800,c:RED}]]);}},
    {key:'chan',lvl:'ap',title:'Which channels open first?',set:{freq:0,strength:15},fresh:true,speed:0.08,run:sim=>{sim.st.pulses.push(sim.t+1);sim._mx={na:0,k:0,tna:0,tk:0};},focus:[8,166,516,276],
     see:'One spike, slowed down. The card tracks the share of Na⁺ and K⁺ channels open, and when each peaked.',
     why:'Na⁺ gates respond in about 0.1 ms; K⁺ gates take about 1 ms. Na⁺ rushes in first, then Na⁺ channels inactivate while the K⁺ current takes over.',
     overlay(sim,ctx,LH,k){const x=sim._mx||(sim._mx={na:0,k:0,tna:0,tk:0}),na=M(sim,'na'),kk=M(sim,'k');if(na>x.na){x.na=na;x.tna=sim.t;}if(kk>x.k){x.k=kk;x.tk=sim.t;}
       nrOsc(ctx,k,LH,[['Na⁺ open: '+F(sim,'na',0),{w:800,c:BLUE}],['K⁺ open: '+F(sim,'k',0),{w:800,c:GREEN}],x.k>5?['K⁺ peaked '+(x.tk-x.tna).toFixed(1)+' ms after Na⁺',{s:12}]:'']);}}
  ],
  useIt:[
    {do:'Next time you stub your toe, notice the sharp jolt first and the dull ache a moment later.',why:'The jolt rides fast myelinated fibers; the ache rides bare ones at about 1 m/s, so it arrives later.'},
    {do:'At the dentist, notice that your lip goes numb but you can still feel pressure.',why:'Lidocaine blocks Na⁺ channels, so pain fibers can’t fire spikes until the drug wears off.'},
    {do:'If you hear about multiple sclerosis, connect it to myelin.',why:'The immune system damages myelin in the brain and spinal cord, so signals slow down or fail.'}],
  tryIt:[{title:'the reaction ruler (10 minutes)',steps:['Have a friend hold a ruler upright with your open thumb and finger at the 0 cm mark.','They drop it without warning; you catch it. Read the centimeter mark.','Average 5 tries. Time in seconds ≈ √(distance in meters ÷ 4.9).'],look:'Most people catch it at 15 to 20 cm, about 0.18 s. The nerve trips themselves take only a few hundredths of a second; the rest is your brain deciding.'}]};

/* ---------- pillbug ---------- */
const pbCard=(ctx,k,LH,rows)=>card(ctx,k,492,10,300,rows);
const pbDone=sim=>ffwd(sim,0.01,s=>s.st.tk>=10.001,3000);
L.pillbug={
  goals:{
    bio:['How a choice chamber tests one variable at a time','Why pill bugs collect in damp, dark places','How counting every 30 seconds turns behavior into data','Why a crowd shows where animals stop, not where they aimed'],
    honors:['How kinesis differs from taxis','How speed data tells them apart','How temperature changes the choice'],
    ap:['How chi-square tests counts against a 50:50 null hypothesis','Why sample size changes what you can conclude']},
  matters:'Choice chambers are how biologists ask animals what they prefer. The same logic, one difference and a fair count, runs taste tests, drug trials and the A/B tests on your apps.',
  steps:[
    {key:'room',title:'Two rooms, one difference',pause:true,focus:[52,88,696,304],
     see:'Two sides joined by a doorway. Left: wet paper. Right: dry paper. Both are covered, so light is the same on both sides.',
     why:'Only moisture differs, so any pattern in where the bugs end up comes from moisture.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[52,88,696,304],tau);}},
    {key:'wander',title:'Random wandering',fresh:true,speed:0.3,
     see:'The bugs walk, turn and rest at random. Watch a few: none heads straight for the wet side.',
     why:'Pill bugs can’t see or smell the far side. They only feel the paper under their feet.',
     overlay(sim,ctx,LH,k){pbCard(ctx,k,LH,[['Left (wet): '+F(sim,'left',0)+' · Right (dry): '+F(sim,'right',0),{w:700}]]);}},
    {key:'kin',title:'Fast where it’s dry, slow where it’s wet',speed:0.4,focus:[400,92,344,296],
     see:'On the dry side bugs walk fast and turn a lot. On the wet side they slow down and rest.',
     why:'Dry air pulls water from their gill-like organs, so dry feels bad. Restless bugs keep moving until they happen onto wet paper, then they stay.',
     overlay(sim,ctx,LH,k){pbCard(ctx,k,LH,[[FL(sim,'vR',1),{w:700,c:RED}],[FL(sim,'vL',1),{w:700,c:BLUE}]]);}},
    {key:'pile',title:'They pile up on the wet side',speed:2.5,
     see:'Sped up to the full 10 minutes. Every 30 seconds the counts update in the circles at the top.',
     why:'Bugs that rest stay put, while restless ones keep wandering. Over a few minutes most end up where they slowed down.',
     overlay(sim,ctx,LH,k){pbCard(ctx,k,LH,[[FL(sim,'pctL',0)+' (wet)',{w:800,c:GREEN}]]);}},
    {key:'graph',title:'The counts as a graph',fresh:true,speed:3,
     see:'Each count becomes a point: minutes across, bugs up. Blue: wet side. Gray: dry side. Watch the lines fill in.',
     why:'The lines start near 10 and 10, then split and level off as the bugs settle. Where they level off shows the preference.',
     overlay(sim,ctx,LH,k){const K=BioLab.lg,B={x0:120,x1:730,y0:70,y1:350},xr=[0,10],n=sim.p.n;K.dim(ctx,LH);
       K.axes(ctx,B,k,{xr,xt:[[0,'0'],[2,'2'],[4,'4'],[6,'6'],[8,'8'],[10,'10']],yt:[[0,'0'],[0.25,String(n/4)],[0.5,String(n/2)],[0.75,String(3*n/4)],[1,String(n)]],xl:'Minutes',yl:'Bugs on each side'});
       const rd=sim.st.reads||[];[['L','#1f5fbf'],['R','#7c7f86']].forEach(([s,c])=>{ctx.save();ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();rd.forEach((q,i)=>{const x=K.X(B,xr,q.t),y=K.Y(B,q[s]/n);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.restore();rd.forEach(q=>K.dot(ctx,K.X(B,xr,q.t),K.Y(B,q[s]/n),c,4.5));});
       const last=rd[rd.length-1];if(last&&last.t>=3){K.tagA(ctx,'wet: '+last.L,K.X(B,xr,last.t)+10,K.Y(B,last.L/n)-14,k,{s:12.5,hi:true},last.t>8?'r':'l');K.tagA(ctx,'dry: '+last.R,K.X(B,xr,last.t)+10,K.Y(B,last.R/n)+16,k,{s:12.5},last.t>8?'r':'l');}}},
    {key:'hook',title:'Your question: did they aim for the damp?',pause:true,run:pbDone,
     see:'The full 10 minutes are done. Read where the 20 bugs ended up.',
     why:'About 16 of 20 is typical (14 to 19 in different runs). They didn’t aim: speeding up on dry paper and resting on wet paper is enough.',
     overlay(sim,ctx,LH,k){pbCard(ctx,k,LH,[['After 10 minutes',{w:700}],['Wet side: '+F(sim,'left',0)+' of '+sim.p.n,{w:800,c:GREEN}],['Dry side: '+F(sim,'right',0)]]);}},
    {key:'light',title:'Light or dark?',set:{Rm:'wet',Ll:'light'},fresh:true,speed:2.5,
     see:'Both sides are wet now, but the left is uncovered and bright. Watch where the bugs gather.',
     why:'Dark places are usually damp and hidden from birds, so light makes pill bugs restless too. They gather in the dark.',
     overlay(sim,ctx,LH,k){pbCard(ctx,k,LH,[['Light side: '+F(sim,'left',0),{w:700}],['Dark side: '+F(sim,'right',0),{w:800,c:GREEN}]]);}},
    {key:'same',title:'No difference, no preference',set:{Rm:'wet'},fresh:true,speed:2.5,
     see:'Both sides wet and dark. The bugs stay roughly split between the sides.',
     why:'Nothing makes them slow down on one side, so they wander evenly. This is what “no preference” looks like.',
     overlay(sim,ctx,LH,k){pbCard(ctx,k,LH,[['Left: '+F(sim,'left',0)+' · Right: '+F(sim,'right',0),{w:700}]]);}},
    {key:'taxis',lvl:'honors',title:'Kinesis, not taxis',fresh:true,speed:0.6,
     see:'Back to wet against dry. Compare the speed on each side.',
     why:'<b>Taxis</b> is steering toward something. <b>Kinesis</b> is changing speed with conditions. These bugs never steer; the speed difference alone sorts them.',
     overlay(sim,ctx,LH,k){pbCard(ctx,k,LH,[[FL(sim,'vR',1),{w:700,c:RED}],[FL(sim,'vL',1),{w:700,c:BLUE}]]);}},
    {key:'temp',lvl:'honors',title:'Warm or cool?',set:{Rm:'wet',LT:15,RT:30},fresh:true,speed:2.5,
     see:'Both sides wet and dark. The left is 15 °C, the right 30 °C.',
     why:'Warm air dries them out faster, so they stay restless at 30 °C and settle on the cool side.',
     overlay(sim,ctx,LH,k){pbCard(ctx,k,LH,[['15 °C side: '+F(sim,'left',0),{w:800,c:GREEN}],['30 °C side: '+F(sim,'right',0)]]);}},
    {key:'chi',lvl:'ap',title:'Is it more than chance?',set:{n:40},fresh:true,pause:true,run:pbDone,
     see:'40 bugs, wet against dry, after 10 minutes. The card tests the counts against a 50:50 split.',
     why:'χ² = Σ (observed − expected)² ÷ expected. With 1 degree of freedom, χ² above 3.84 means p < 0.05: reject “no preference.”',
     overlay(sim,ctx,LH,k){pbCard(ctx,k,LH,[['Wet '+F(sim,'left',0)+' · dry '+F(sim,'right',0)+' (expected 20 and 20)',{w:700}],[FL(sim,'chi',2),{w:800,c:RED}]]);}}
  ],
  useIt:[
    {do:'Lift a flowerpot or a damp board in the yard and look underneath.',why:'Pill bugs breathe with gill-like organs that must stay moist. They keep moving in dry air until they reach damp shade.'},
    {do:'If 12 of 20 friends pick one brand of chips in a taste test, don’t call it a win yet.',why:'That split could easily be chance. 15 of 20 passes the same chi-square test biologists use for choice chambers.'},
    {do:'Planning a science fair test? Give the two sides only one difference.',why:'If one side is also brighter or warmer, you can’t tell which difference the animals reacted to.'}],
  tryIt:[{title:'the shoebox chamber (30 minutes, outdoors to collect)',steps:['Collect 10 pill bugs from under a damp log or pot.','Line a shoebox with paper towel: wet one half, leave the other dry, and cover the box.','Count the bugs on each side every 2 minutes for 10 minutes, then return them where you found them.'],look:'Most end up on the wet half. Watch how fast the ones on the dry half move compared with the wet half.'}]};
ADD.pillbug=[
  {id:'lf-chinum',kind:'test',lvl:'ap',q:'With 20 bugs you count 15 on the wet side and 5 on the dry side. What is χ²?',num:{ans:5,tol:0.1,unit:''},
   steps:['Expected under the null: 10 and 10.','(15 − 10)² ÷ 10 = 2.5, and (5 − 10)² ÷ 10 = 2.5.','χ² = 5.0, above 3.84, so reject “no preference.”']},
  {id:'lf-cover',kind:'test',lvl:'bio',q:'Testing wet against dry, why should both sides be covered?',choices:['So light is the same and only moisture differs','So the bugs can’t climb out of the chamber walls','So the wet side’s paper won’t dry out too fast','So the bugs can’t see you counting them'],correct:0,
   steps:['A fair test changes only one condition.','If one side were also bright, light could cause the pattern.','Covering both sides keeps light the same.']},
  {id:'lf-lamp',kind:'test',lvl:'honors',q:'A student puts the wet side under a lamp and the dry side in shade, and the bugs split evenly. What can they conclude?',choices:['Pill bugs prefer dryness over moisture','Nothing clear: two conditions changed at once','Pill bugs have no preference for moisture','Pill bugs prefer light over moisture'],correct:1,
   steps:['Moisture and light both differ between the sides.','The two preferences may have cancelled out.','With two variables changed, the result can’t be pinned on either one.']}];

/* ---------- protein ---------- */
/* melting curve probed from the model: % folded and % of oily side chains hidden, averaged over 16 runs per temperature */
const PR_MELT=[[20,100,77],[30,98,76],[37,88,72],[40,65,65],[45,44,57],[50,26,47],[55,22,43],[60,18,38],[70,15,31],[80,13,26],[90,12,25],[100,10,23]];
const prCard=(ctx,k,LH,rows)=>card(ctx,k,506,LH-34,282,rows,{up:true});
L.protein={
  goals:{
    bio:['Why a chain of amino acids folds into one shape','Why oily amino acids hide in the middle','What heat does to the shape, and what it doesn’t break','Why a protein stops working when it unfolds'],
    honors:['Which bonds hold the fold together','How pH changes the charges that hold it','How one amino acid change can make proteins clump (sickle cell)'],
    ap:['Folding as a search for the lowest energy','How the melting curve shows a narrow unfolding range','How surface patches build quaternary structure']},
  matters:'Every enzyme, antibody and hormone works only when it is folded right. Cooking, fevers, ceviche and sickle-cell disease are all stories about protein folds.',
  steps:[
    {key:'seq',title:'A chain in a set order',pause:true,focus:[90,6,620,46],
     see:'The top row is the chain’s order of 20 amino acids. Orange ones are oily (nonpolar), green polar, blue positive, red negative.',
     why:'This order, the <b>primary structure</b>, is set by the gene. It decides how the chain will fold.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[86,4,628,50],tau);}},
    {key:'flat',title:'Stretched out in water',fresh:true,pause:true,run:sim=>ACT(sim,'unfold'),
     see:'The chain is pulled straight. Every orange, oily amino acid touches the water.',
     why:'Oily side chains and water don’t mix, like oil spread thin on a puddle. That arrangement is unstable.',
     overlay(sim,ctx,LH,k){prCard(ctx,k,LH,[[FL(sim,'buried',0),{w:800,c:RED}]]);}},
    {key:'collapse',title:'Oily parts clump together',fresh:true,speed:0.3,run:sim=>ACT(sim,'unfold'),
     see:'Let go. The orange amino acids clump together in the middle, away from the water.',
     why:'Water pushes the oily parts together, the way oil drops in salad dressing merge. This is <b>hydrophobic collapse</b>.',
     overlay(sim,ctx,LH,k){prCard(ctx,k,LH,[[FL(sim,'buried',0),{w:800,c:GREEN}],[FL(sim,'fold',0)]]);}},
    {key:'fold',title:'The working shape',fresh:true,speed:0.5,
     see:'The finished fold: an oily core with water-loving amino acids outside. It jiggles but keeps its shape.',
     why:'Weak bonds hold the fold. That exact shape is what lets a protein do its job, like the teeth of a key.',
     overlay(sim,ctx,LH,k){prCard(ctx,k,LH,[[FL(sim,'fold',0),{w:800,c:GREEN}],[FL(sim,'buried',0)]]);}},
    {key:'heat',title:'Heat it to 90 °C',set:{temp:90},speed:0.5,cause:{from:{temp:37},delay:1.5,dur:2,label:'Temperature'},
     see:'The temperature climbs from 37 to 90 °C. The fold shakes apart into a loose, wriggling chain.',
     why:'Heat breaks the weak bonds that hold the shape. This is <b>denaturing</b>, like an egg white turning solid in a pan.',
     overlay(sim,ctx,LH,k){prCard(ctx,k,LH,[['Temperature: '+Math.round(sim.p.temp)+' °C',{w:700}],[FL(sim,'fold',0),{w:800,c:RED}]]);}},
    {key:'chain',title:'The chain itself doesn’t break',set:{temp:90},speed:0.5,
     see:'Still at 90 °C. Count the beads: still 20, still linked in the same order.',
     why:'The links between amino acids are strong peptide bonds. Heat only breaks the weak bonds between parts of the chain.',
     overlay(sim,ctx,LH,k){prCard(ctx,k,LH,[['Amino acids linked: 20 of 20',{w:800,c:GREEN}],[FL(sim,'fold',0)]]);}},
    {key:'melt',title:'The melting curve',set:{temp:90},pause:true,
     see:'The model’s % folded at each temperature: high up to about 40 °C, then a steep drop by 50 °C.',
     why:'The weak bonds give way together, so unfolding happens over a narrow range. Above it, the shape is gone.',
     overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,B={x0:120,x1:730,y0:66,y1:350},xr=[20,100],p=tau%14;K.dim(ctx,LH);
       K.axes(ctx,B,k,{xr,xt:[[20,'20'],[37,'37'],[60,'60'],[80,'80'],[100,'100']],yt:[[0,'0%'],[0.5,'50%'],[1,'100%']],xl:'Temperature (°C)',yl:'Folded'});
       const to=20+Math.min(80,p*20),pts=PR_MELT.filter(q=>q[0]<=to);ctx.save();ctx.strokeStyle='#1b7a3a';ctx.lineWidth=3.5;ctx.lineJoin='round';ctx.beginPath();pts.forEach((q,i)=>{const x=K.X(B,xr,q[0]),y=K.Y(B,q[1]/100);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.restore();
       pts.forEach(q=>K.dot(ctx,K.X(B,xr,q[0]),K.Y(B,q[1]/100),'#1b7a3a',5));
       if(to>=37)K.tagA(ctx,'body temperature: 88%',K.X(B,xr,37)+12,K.Y(B,0.88)+26,k,{s:12.5},'l');
       if(to>=90)K.tagA(ctx,'90 °C: 12%',K.X(B,xr,90),K.Y(B,0.12)-24,k,{s:12.5,hi:true},'r');}},
    {key:'hook',title:'Your question: the egg white',set:{temp:90},pause:true,
     see:'How folded the protein is, and how much of its oily core stays hidden, at 37 and 90 °C.',
     why:'About 90% folded at 37 °C, about 10% at 90 °C. The chain never breaks. Unfolded egg proteins tangle, so the white turns solid.',
     overlay(sim,ctx,LH,k){prCard(ctx,k,LH,[['At 37 °C: 88% folded, 72% of oily parts hidden',{w:700}],['At 90 °C: 12% folded, 25% hidden',{w:800,c:RED}],['Chain broken: never',{s:12}]]);}},
    {key:'ph',lvl:'honors',title:'Acid changes the charges',set:{ph:2},speed:0.5,cause:{from:{ph:7},delay:1.5,dur:2,label:'pH'},
     see:'The pH drops from 7 to 2. The purple dashed ionic bonds disappear, and the fold loosens.',
     why:'In acid, the negative amino acids pick up H⁺ and lose their charge, so the + and − pairs holding the fold let go.',
     overlay(sim,ctx,LH,k){prCard(ctx,k,LH,[['pH '+(+sim.p.ph).toFixed(1),{w:700}],[FL(sim,'ion',0),{w:800,c:RED}],[FL(sim,'fold',0)]]);}},
    {key:'sickle',lvl:'honors',title:'One change, a sticky patch',speed:0.5,run:tour('protein','One amino acid can matter'),
     see:'Amino acid 5, a negative Glu on the surface, becomes Val, an oily one. The fold barely changes, but neighbors stick.',
     why:'An oily patch now faces the water, so molecules clump to hide it. In hemoglobin, this change causes sickle-cell disease.',
     overlay(sim,ctx,LH,k){prCard(ctx,k,LH,[[FL(sim,'patch',0),{w:700,c:RED}],[F(sim,'agg'),{w:800}]]);}},
    {key:'energy',lvl:'ap',title:'Folding finds the lowest energy',fresh:true,speed:0.3,run:sim=>ACT(sim,'unfold'),
     see:'Stretched out again, then folding. The card tracks the folding energy as the chain settles.',
     why:'Each oily contact and ion pair lowers the energy. The chain wanders until it finds its low-energy fold; heat lets it climb back out.',
     so:'The same surface forces hold the four chains of hemoglobin together: quaternary structure.',
     overlay(sim,ctx,LH,k){prCard(ctx,k,LH,[[FL(sim,'energy',0),{w:800,c:GREEN}],[FL(sim,'fold',0)]]);}}
  ],
  useIt:[
    {do:'Make ceviche, or watch someone squeeze lime onto raw fish.',why:'The acid denatures the fish proteins without heat, so the fish turns white and firm.'},
    {do:'Notice that straightened hair curls back on a humid day.',why:'Heat breaks hydrogen bonds in hair’s keratin and they re-form in a new shape; water lets them break and re-form again.'},
    {do:'Check a milk carton for “pasteurized.”',why:'Heating milk to 72 °C for 15 seconds kills bacteria, largely by unfolding their proteins.'}],
  tryIt:[{title:'egg white two ways (10 minutes, with an adult at the stove)',steps:['Put a spoonful of raw egg white in a glass and add a tablespoon of lemon juice or vinegar. Wait 10 minutes.','Cook a second spoonful in a pan.','Compare both with raw egg white.'],look:'Both turn white and firm: acid and heat each unfold the proteins, which then tangle together. Neither breaks the chains themselves.'}]};
ADD.protein=[
  {id:'lf-melt',kind:'test',lvl:'bio',q:'<p>The graph shows how folded a protein is at each temperature. About what temperature makes it half unfolded?</p><svg viewBox="0 0 420 220" style="display:block;width:100%;max-width:440px;height:auto;margin:10px 0 4px" role="img" aria-label="Line graph of percent folded against temperature from 20 to 100 degrees Celsius. It stays near 100 percent up to about 37 degrees, falls steeply to about 50 percent near 44 degrees, and levels off near 10 to 15 percent above 70 degrees."><g font-size="12" fill="currentColor"><line x1="50" y1="20" x2="50" y2="180" stroke="currentColor" stroke-width="2"/><line x1="50" y1="180" x2="400" y2="180" stroke="currentColor" stroke-width="2"/><text x="44" y="24" text-anchor="end">100%</text><text x="44" y="104" text-anchor="end">50%</text><text x="44" y="184" text-anchor="end">0%</text><text x="50" y="198" text-anchor="middle">20</text><text x="137" y="198" text-anchor="middle">40</text><text x="225" y="198" text-anchor="middle">60</text><text x="312" y="198" text-anchor="middle">80</text><text x="400" y="198" text-anchor="middle">100 °C</text><line x1="50" y1="100" x2="400" y2="100" stroke="currentColor" stroke-dasharray="4 4" opacity=".4"/><polyline fill="none" stroke="#1b7a3a" stroke-width="3" points="50,20 94,23 124,39 137,76 159,110 181,138 203,145 225,151 269,156 312,159 356,161 400,164"/></g></svg>',choices:['About 60 °C','About 90 °C','About 45 °C','About 37 °C'],correct:2,
   steps:['Find 50% on the vertical axis.','Follow it across to the curve.','It meets the curve on the steep part, near 45 °C.']},
  {id:'lf-chain',kind:'test',lvl:'bio',q:'After heating, a protein no longer works. What did the heat break?',choices:['The strong bonds that link its amino acids','The gene that carries its instructions','The amino acids themselves, into atoms','The weak bonds that hold its folded shape'],correct:3,
   steps:['Peptide bonds linking amino acids are strong; cooking heat doesn’t break them.','Hydrogen bonds, ionic bonds and oily contacts are weak.','Losing them unfolds the shape, and shape is what does the job.']},
  {id:'lf-sickle',kind:'test',lvl:'honors',q:'In sickle-cell hemoglobin, one surface Glu becomes Val. Why do the molecules clump?',choices:['An oily patch now faces the water, so molecules stick together','The chain breaks at the changed spot, so the pieces tangle','The protein can no longer fold at all, so it stays stretched out','Val carries a strong charge that pulls other proteins close'],correct:0,
   steps:['Glu is negative and comfortable in water; Val is oily.','On the surface, the oily Val is exposed to water.','Molecules clump so their oily patches touch instead of water.']}];

/* ---------- signaling ---------- */
/* steady state of the model in sims/signaling.js (same equations), glucose released in million/s */
function sgSteady(epi,o){o=o||{};const kd=o.blk?10:1,R=epi/(epi+kd),G=o.tox?1:2*R/(1+2*R),C=(0.1+8*G)/(o.caf?0.3:1),pk=C*C/(C*C+25),K=pk/(pk+0.5),P=K/(K+0.4);return {R,G,C,glu:25*P};}
const SG_PH=[0,2.5,5,8,11.5,15,18];   /* start times of the close-up phases (s) */
const sgHold=(sim,a,b)=>{const c=sim.vis&&sim.vis.cu;if(!c)return;if(c.t<a||c.t>=b)c.t=a;};
const sgGo=a=>sim=>{sim.vis=sim.vis||{};sim.vis.cu={t:a,camp:[],mode:'run'};};
/* settle the model at base values, then switch to the step's values, so the change starts from a steady state */
const sgPre=(base,to)=>sim=>{BioLab.setValues(sim,base);ffwd(sim,0.05,()=>false,1200);BioLab.setValues(sim,to);};
const sgCardR=(ctx,k,LH,rows)=>card(ctx,k,486,LH-14,300,rows,{up:true});
L.signaling={
  goals:{
    bio:['Why a hormone can change a cell without going inside','How a receptor passes a message across the membrane','How relay proteins multiply one signal into many','Why the response stops soon after the hormone is gone'],
    honors:['How G proteins and cAMP act as relays','How caffeine and beta blockers change the signal','Why the response levels off at high hormone levels'],
    ap:['How amplification builds at each step','How a G protein locked on (cholera toxin) keeps signaling','How phosphatases switch the cascade off']},
  matters:'Adrenaline, glucagon, asthma inhalers and EpiPens all work this way: a molecule outside the cell flips a switch on the surface, and the cell responds from the inside.',
  steps:[
    {key:'out',title:'The hormone stays outside',set:{view:'close'},speed:0.5,run:sgGo(0),focus:[0,0,800,150],
     see:'Close-up of one receptor on a liver cell. Epinephrine (the orange diamond) drifts in from the blood.',
     why:'Epinephrine can’t cross the membrane, so the message has to pass through the receptor.',
     overlay(sim,ctx,LH,k,tau){sgHold(sim,SG_PH[0],SG_PH[1]+0.6);}},
    {key:'bind',title:'Binding changes the receptor’s shape',set:{view:'close'},speed:0.5,run:sgGo(SG_PH[1]),focus:[90,100,170,160],
     see:'Epinephrine fits the receptor’s pocket on the outside. The receptor bends and glows red on the inside.',
     why:'The shape change on the inside is the message, like a key turning a lock from one side of a door.',
     overlay(sim,ctx,LH,k,tau){sgHold(sim,SG_PH[1],SG_PH[2]);ring(ctx,k,[96,100,150,160],tau);}},
    {key:'gprot',title:'The G protein switches on',set:{view:'close'},speed:0.5,run:sgGo(SG_PH[2]),focus:[230,200,420,120],
     see:'The reshaped receptor makes the G protein swap GDP for GTP. Its α part then slides along the membrane to adenylyl cyclase.',
     why:'GTP is the G protein’s on switch. The α part carries the message from the receptor to the enzyme, like a runner passing a baton.',
     overlay(sim,ctx,LH,k,tau){sgHold(sim,SG_PH[2],SG_PH[4]);ring(ctx,k,[230,200,430,120],tau);}},
    {key:'camp',title:'cAMP: the second messenger',set:{view:'close'},speed:0.5,run:sgGo(SG_PH[4]),focus:[480,120,320,250],
     see:'The switched-on adenylyl cyclase turns ATP into cAMP, small green molecules that spread through the cell.',
     why:'One enzyme makes many cAMP, the first big multiplication. The hormone was the first messenger; cAMP is the second.',
     overlay(sim,ctx,LH,k,tau){sgHold(sim,SG_PH[4],SG_PH[5]);ring(ctx,k,[480,120,316,240],tau);}},
    {key:'pka',title:'cAMP switches on a kinase',set:{view:'close'},speed:0.5,run:sgGo(SG_PH[5]),focus:[300,280,340,110],
     see:'cAMP binds protein kinase A and switches it on.',
     why:'A kinase adds phosphate groups to other proteins, switching them on. Protein kinase A starts a cascade that ends with sugar pouring into the blood.',
     overlay(sim,ctx,LH,k,tau){sgHold(sim,SG_PH[5],SG_PH[6]);ring(ctx,k,[300,280,340,110],tau);}},
    {key:'whole',title:'The cascade multiplies',set:{view:'whole'},speed:0.5,run:sgPre({view:'whole'},{view:'whole'}),
     see:'The whole pathway. Each row of switched-on enzymes is twice as long as the one above: 4, then 8, then 16.',
     why:'Each enzyme switches on many of the next. In a real cell, a few thousand receptors lead to millions of glucose molecules per second.',
     overlay(sim,ctx,LH,k){sgCardR(ctx,k,LH,[[FL(sim,'occ',0),{w:700}],[FL(sim,'glu',1),{w:800,c:GREEN}]]);}},
    {key:'dose',title:'More hormone, more sugar?',set:{view:'whole'},pause:true,
     see:'The model’s glucose release at each epinephrine level, from 0 to 10 nM.',
     why:'It climbs steeply at first, then flattens near 14 million per second. The relay runs near full speed long before every receptor is filled.',
     overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,B={x0:120,x1:730,y0:66,y1:350},xr=[0,10],p=tau%14,ym=20;K.dim(ctx,LH);
       K.axes(ctx,B,k,{xr,xt:[[0,'0'],[2,'2'],[4,'4'],[6,'6'],[8,'8'],[10,'10']],yt:[[0,'0'],[5/ym,'5'],[10/ym,'10'],[15/ym,'15'],[20/ym,'20']],xl:'Epinephrine (nM)',yl:'Glucose released (million/s)'});
       K.curve(ctx,B,xr,e=>sgSteady(e).glu/ym,Math.min(10,p*3),'#1b7a3a');
       if(p>0.6){const g=sgSteady(1).glu;K.dot(ctx,K.X(B,xr,1),K.Y(B,g/ym),'#c8102e');K.tagA(ctx,'1 nM: '+g.toFixed(1),K.X(B,xr,1)+12,K.Y(B,g/ym)+26,k,{s:12.5},'l');}
       if(p>3.6){const g=sgSteady(10).glu;K.dot(ctx,K.X(B,xr,10),K.Y(B,g/ym),'#c8102e');K.tagA(ctx,'10 nM: '+g.toFixed(1),K.X(B,xr,10),K.Y(B,g/ym)-26,k,{s:12.5,hi:true},'r');}}},
    {key:'hook',title:'Your question: ten times the hormone',set:{view:'whole',epi:10},speed:2,run:sgPre({view:'whole',epi:1},{view:'whole',epi:10}),
     see:'Epinephrine jumps from 1 to 10 nM. Watch the share of receptors filled and the glucose released.',
     why:'Receptors filled: 50% → 91%. Glucose: about 13 → 14 million per second. Ten times the hormone, barely more sugar: the cascade was already near its limit.',
     overlay(sim,ctx,LH,k){const b=sgSteady(1);sgCardR(ctx,k,LH,[['At 1 nM: '+Math.round(100*b.R)+'% filled, '+b.glu.toFixed(1)+' million/s',{s:12}],['Now 10 nM:',{w:700}],[FL(sim,'occ',0)],[FL(sim,'glu',1),{w:800,c:GREEN}]]);}},
    {key:'off',title:'Switching it off',set:{view:'whole',epi:0},speed:2,run:sgPre({view:'whole',epi:1},{view:'whole',epi:0}),
     see:'The hormone is removed. Watch the glucose release fall.',
     why:'Every relay protein switches itself off within seconds, so release drops to almost zero in about 20 seconds. The cell is ready for the next signal.',
     overlay(sim,ctx,LH,k){sgCardR(ctx,k,LH,[['Epinephrine: '+(+sim.p.epi).toFixed(1)+' nM',{w:700}],[FL(sim,'glu',1),{w:800,c:RED}]]);}},
    {key:'caf',lvl:'honors',title:'Caffeine keeps cAMP around',set:{view:'whole',caf:true},speed:2,run:sgPre({view:'whole'},{view:'whole',caf:true}),
     see:'Caffeine is added at 1 nM epinephrine. cAMP climbs to about three times its usual level.',
     why:'Caffeine blocks the enzyme that breaks cAMP down, so the message lingers and the cell releases a little more sugar.',
     overlay(sim,ctx,LH,k){const b=sgSteady(1);sgCardR(ctx,k,LH,[['Before: cAMP '+b.C.toFixed(1)+' µM',{s:12}],[FL(sim,'camp',1),{w:800,c:GREEN}],[FL(sim,'glu',1)]]);}},
    {key:'blk',lvl:'honors',title:'A beta blocker sits in the lock',set:{view:'whole',blk:true},speed:2,run:sgPre({view:'whole'},{view:'whole',blk:true}),
     see:'A beta blocker is added at 1 nM epinephrine. Fewer receptors hold hormone, and glucose release drops.',
     why:'The blocker fits the receptor without switching it on, so less epinephrine can bind. Heart drugs use this to calm a racing heart.',
     overlay(sim,ctx,LH,k){const b=sgSteady(1);sgCardR(ctx,k,LH,[['Before: '+Math.round(100*b.R)+'% filled, '+b.glu.toFixed(1)+' million/s',{s:12}],[FL(sim,'occ',0),{w:800,c:RED}],[FL(sim,'glu',1)]]);}},
    {key:'tox',lvl:'ap',title:'A G protein stuck on',set:{view:'whole',epi:0,tox:true},speed:2,run:sgPre({view:'whole',epi:0},{view:'whole',epi:0,tox:true}),
     see:'No hormone at all, but a cholera-like toxin locks the G protein on. cAMP and glucose release stay high.',
     why:'The relay fires with no signal. In the gut, cholera toxin does this to cells that pump salt, so water pours out.',
     overlay(sim,ctx,LH,k){sgCardR(ctx,k,LH,[['Epinephrine: 0 nM',{w:700}],[FL(sim,'gact',0),{w:800,c:RED}],[FL(sim,'glu',1)]]);}}
  ],
  useIt:[
    {do:'Watch someone use an asthma inhaler.',why:'Albuterol binds the same kind of receptor on airway muscle, and the relay inside relaxes the muscle so the airway opens within minutes.'},
    {do:'Learn where an EpiPen goes and why it works so fast.',why:'Epinephrine never has to enter a cell. It binds receptors on blood vessels and airways, raising blood pressure and opening breathing.'},
    {do:'Notice your heart pounding after a scare, then settling within a minute or two.',why:'The relay switches itself off soon after the hormone is gone.'}],
  tryIt:[{title:'the phone tree (10 minutes, with friends or family)',steps:['You text 2 people one word. Each of them texts 2 more, and so on, 4 rounds.','Count how many people got the word.','Then imagine each person texting 10 instead of 2.'],look:'2 → 4 → 8 → 16: one message reaches many. A cell’s relay is the same idea, but each enzyme switches on many more than 2.'}]};
ADD.signaling=[
  {id:'lf-dose',kind:'test',lvl:'honors',q:'Epinephrine rises from 1 nM to 10 nM, and receptors filled go from 50% to 91%. Why does glucose release barely change?',choices:['The liver has run out of stored glycogen','The relay is already running near full speed','The extra hormone can’t reach the liver cells','Most of the new hormone gets inside the cell'],correct:1,
   steps:['Each step multiplies the signal, so even half the receptors drive the cascade hard.','Later enzymes are already nearly all switched on.','More hormone can’t push a nearly maxed-out relay much higher.']},
  {id:'lf-outside',kind:'test',lvl:'bio',q:'Epinephrine never enters the liver cell. How does the cell still respond?',choices:['The cell swallows the hormone and digests it for energy','The hormone sends an electric signal through the membrane','A receptor on the surface changes shape and starts a relay inside','The hormone leaks through tiny holes in the cell membrane'],correct:2,
   steps:['Epinephrine binds the receptor’s outside pocket.','The receptor changes shape on the inside.','Relay proteins carry and multiply the message inside the cell.']},
  {id:'lf-amp',kind:'test',lvl:'bio',q:'One switched-on enzyme switches on 10 of the next, and each of those switches on 10 more. How many are on after 3 steps?',num:{ans:1000,tol:0,unit:'enzymes'},
   steps:['Step 1: 10.','Step 2: 10 × 10 = 100.','Step 3: 100 × 10 = 1,000. Each step multiplies the signal.']}];

/* ---------- microscope ---------- */
const MS_FOV=[[40,4500],[100,1800],[400,450],[1000,180]];   /* total magnification → field of view (µm), from the model's objectives */
const msCard=(ctx,k,LH,rows,top)=>top?card(ctx,k,560,8,232,rows):card(ctx,k,560,LH-8,232,rows,{up:true});
const msAuto=a=>sim=>{sim.st.auto=a;};
L.microscope={
  goals:{
    bio:['The parts of a light microscope and what each does','How to focus safely, starting on low power','Why higher power shows a smaller, darker view','How to measure a cell from the field of view'],
    honors:['What parfocal lenses and working distance mean','How to spot signs of life in living cells'],
    ap:['What limits resolution, and how oil immersion helps','Why magnification without resolution adds no detail']},
  matters:'Microscopes revealed cells, germs and blood disorders. Sizing something tiny from a known field of view is how labs count blood cells and spot parasites in drinking water.',
  steps:[
    {key:'parts',title:'Parts of the microscope',pause:true,focus:[478,0,322,450],
     see:'Right: the microscope. Light shines up through the slide. The objective lens magnifies the image, then the eyepiece magnifies it 10× more.',
     why:'Total magnification is the two multiplied: a 4× objective gives 40× in all.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[478,0,320,350],tau);msCard(ctx,k,LH,[[FL(sim,'mag',0),{w:800}]]);}},
    {key:'low',title:'Start on low power',set:{obj:4,coarse:42,fine:0},speed:1,run:msAuto([{id:'coarse',to:50,rate:3}]),focus:[50,20,410,410],
     see:'The 4× objective. The big coarse knob raises the stage, and the onion cells sharpen.',
     why:'Low power shows the widest view, 4.5 mm across, so the specimen is easy to find, like zooming out on a map first.',
     overlay(sim,ctx,LH,k){msCard(ctx,k,LH,[[FL(sim,'focus'),{w:800}],[FL(sim,'fov',0)]]);}},
    {key:'center',title:'Center your target',set:{coarse:50},speed:1,run:msAuto([{id:'sx',to:-400,rate:200}]),focus:[50,20,410,410],
     see:'The slide slides one way, and the cells in the view drift the opposite way.',
     why:'The lenses flip the image upside down and backward. To move a cell left in your view, push the slide right.',
     overlay(sim,ctx,LH,k){msCard(ctx,k,LH,[['Slide moved: '+Math.round(sim.p.sx)+' µm',{w:700}]]);}},
    {key:'high',title:'Switch to 40×',set:{coarse:50,sx:-400,obj:40},speed:1,run:msAuto(null),focus:[50,20,410,410],
     see:'The nosepiece turns to 40×. The image stays nearly in focus, but the circle now shows only 450 µm across.',
     why:'Ten times the magnification shows one-tenth the width. Each cell looks bigger, but you see far fewer of them.',
     overlay(sim,ctx,LH,k){msCard(ctx,k,LH,[[FL(sim,'mag',0),{w:700}],[FL(sim,'fov',0),{w:800,c:RED}]]);}},
    {key:'fine',title:'Fine focus only',set:{coarse:50,sx:-400,obj:40,fine:0},speed:1,run:msAuto([{id:'fine',to:10,rate:3}]),focus:[[50,20,410,410],[738,328,44,44]],
     see:'At 40× only the small fine-focus knob turns, a tiny bit at a time.',
     why:'One coarse click moves the stage more than 10 times the depth of focus. At high power the lens sits so close it could crack the slide.',
     overlay(sim,ctx,LH,k){msCard(ctx,k,LH,[[FL(sim,'focus'),{w:800}]]);}},
    {key:'light',title:'Add light',set:{coarse:50,sx:-400,obj:40,fine:10,light:30},speed:1,run:msAuto([{id:'light',to:90,rate:20}]),focus:[[50,20,410,410],[640,370,60,40]],
     see:'The view is dim at 40×. The diaphragm opens and the image brightens.',
     why:'A high-power lens gathers light from a smaller patch of slide, so less reaches your eye. Opening the diaphragm makes up for it.',
     overlay(sim,ctx,LH,k){msCard(ctx,k,LH,[[FL(sim,'bright',0),{w:800}]],true);}},
    {key:'graph',title:'Magnification against field of view',set:{coarse:50,sx:-400,obj:40,fine:10,light:90},pause:true,
     see:'The field of view at each total magnification, in micrometers (µm) across.',
     why:'Multiply each pair and you always get 180,000. Ten times the magnification, one-tenth the width.',
     overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,B={x0:140,x1:720,y0:70,y1:350},p=tau%14;K.dim(ctx,LH);
       K.axes(ctx,B,k,{xr:[0,1],yt:[[0,'0'],[1000/4500,'1,000'],[2000/4500,'2,000'],[3000/4500,'3,000'],[4000/4500,'4,000']],xl:'Total magnification',yl:'Field of view (µm across)',ylOff:56});
       K.bars(ctx,B,MS_FOV.map(([m,f],i)=>[m+'×',f/4500,i===2?'#c8102e':'#1f5fbf']),k,Math.min(1,p/2));
       if(p>2)MS_FOV.forEach(([m,f],i)=>{const gw=(B.x1-B.x0)/4,x=B.x0+gw*(i+0.5);K.tag(ctx,f.toLocaleString('en-US')+' µm',x,K.Y(B,f/4500)-18,k,{s:12,hi:i===2});});}},
    {key:'hook',title:'Your question: how big is a cheek cell?',set:{slide:'cheek',obj:40,coarse:50,fine:10,light:90},speed:1,run:msAuto(null),
     see:'Cheek cells at 400×. The card shows how many fit across the 450 µm circle.',
     why:'About 7.5 span it, so one cell is 450 ÷ 7.5 ≈ 60 µm (0.06 mm). Your eye sees down to about 0.1 mm, so one cell is just too small.',
     overlay(sim,ctx,LH,k){const n=M(sim,'across');msCard(ctx,k,LH,[[FL(sim,'fov',0),{w:700}],[FL(sim,'across',1)],['One cell ≈ '+(450/n).toFixed(0)+' µm across',{w:800,c:GREEN}]]);}},
    {key:'elodea',lvl:'honors',title:'Signs of life',speed:1,run:tour('microscope','Look for signs of life'),focus:[50,20,410,410],
     see:'A living Elodea leaf at 400×. Green chloroplasts circle around the edge of each cell.',
     why:'This movement, cytoplasmic streaming, happens only in living cells. The cell wall keeps each box-shaped cell rigid.',
     overlay(sim,ctx,LH,k){msCard(ctx,k,LH,[[FL(sim,'wd',2),{w:700}],['At 4× it is 17 mm',{s:12}]]);}},
    {key:'oil',lvl:'ap',title:'Oil immersion and resolution',speed:1,run:tour('microscope','Oil immersion'),focus:[50,20,410,410],
     see:'A blood smear at 1000× with a drop of immersion oil. White blood cells show their lobed nuclei.',
     why:'Detail is limited by resolution, not magnification. Oil keeps wide-angle light from bending away, so features about 0.27 µm apart stay separate.',
     overlay(sim,ctx,LH,k){msCard(ctx,k,LH,[[FL(sim,'res',2),{w:800,c:GREEN}]]);}}
  ],
  useIt:[
    {do:'Zoom in 4× on your phone camera and notice how much of the scene you lose.',why:'Every magnifier trades how much you see for how much detail: 4× zoom shows a quarter of the width.'},
    {do:'If you ever get a blood test, ask what a “cell count” means.',why:'A red blood cell is about 7.5 µm, so about 60 fit across a 450 µm high-power field. Technicians count and compare cells this way.'},
    {do:'Before drinking from a mountain stream, filter or boil the water.',why:'Giardia cysts are about 10 µm long: invisible to your eye, but easy to spot at 400×.'}],
  tryIt:[{title:'the water-drop magnifier (10 minutes)',steps:['Put a drop of water on clear plastic wrap stretched over newspaper print.','Look at the letters through the drop, then move the wrap up a little.','Compare how many letters you can see through the drop and without it.'],look:'The curved drop acts as a lens: the letters look bigger, but you see fewer of them at once, the same trade a microscope makes.'}]};

/* ---------- expdesign ---------- */
function edStats(sim){const s=sim.st;if(!s.plates)return [];return s.plates.map((reps,li)=>{const tc=Math.min(s.h,s.countT[li]),a=reps.map(pl=>pl.cols.filter(c=>c.tv<=tc).length),n=a.length,m=a.reduce((x,y)=>x+y,0)/n;return {a,m};});}
const edDone=sim=>ffwd(sim,0.05,s=>s.st.h>=s.st.end-1e-9,4000);
const edCard=(ctx,k,LH,rows)=>card(ctx,k,614,LH-10,180,rows,{up:true});
const edMeans=sim=>edStats(sim).map((x,i)=>(sim.st.vals[i])+(sim.p.iv==='temp'?' °C':'')+': '+Math.round(x.m));
L.expdesign={
  goals:{
    bio:['What independent and dependent variables are','Why every experiment needs a control group','Why one plate is never enough: replicates','Why everything else must stay the same'],
    honors:['How bacteria grow: lag, log, stationary and death phases','When a bar graph or a line graph fits the data'],
    ap:['How error bars of ±2 standard errors show whether a difference is real','How more replicates make the error bars smaller']},
  matters:'Every claim that something “works” (a drug, a fertilizer, a study trick) rests on these rules. Spot a missing control or a second changed variable and you can see through a weak claim.',
  steps:[
    {key:'q',title:'One question, two variables',pause:true,focus:[0,0,612,76],
     see:'Four temperatures, three agar plates each. The header names what changes: temperature. What gets counted: colonies.',
     why:'What you change on purpose is the <b>independent variable</b>. What you measure, the colonies on each plate, is the <b>dependent variable</b>.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[4,4,604,64],tau);}},
    {key:'ctrl',title:'The control group',pause:true,focus:TF('expdesign','The control group'),
     see:'The 37 °C column is marked control: body temperature, the normal condition for E. coli.',
     why:'The control shows what happens without your change, so every other column has something to compare against.',
     overlay(sim,ctx,LH,k,tau){const L4=sim.st.vals.length,cw=585/L4,i=Math.max(0,sim.st.vals.indexOf(37));ring(ctx,k,[20+cw*i,36,cw,390],tau);}},
    {key:'reps',title:'Three plates per level',pause:true,focus:[20,74,585,345],
     see:'Each column holds three plates set up the same way.',
     why:'One plate can be a fluke, like one missed free throw. Several <b>replicates</b> show what is typical.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[20,74,585,345],tau);}},
    {key:'const',title:'Keep everything else the same',pause:true,focus:[612,34,182,180],
     see:'The card on the right lists what stays the same for every plate: sugar, antibiotic, UV and the 24-hour count.',
     why:'These are the <b>constants</b>. Change two things at once and you can’t tell which one caused the result.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[612,30,184,180],tau);}},
    {key:'grow',title:'Incubation: colonies appear',speed:0.6,run:tour('expdesign','Incubation'),
     see:'The plates incubate for 24 hours. Colonies pop up first at 30 and 37 °C, and grow bigger there.',
     why:'Each colony starts as one cell. It becomes visible after about 20 doublings, roughly a million cells.',
     overlay(sim,ctx,LH,k){edCard(ctx,k,LH,[['Hour '+Math.min(24,Math.floor(sim.st.h||0)),{w:800}]]);}},
    {key:'graph',title:'The results as a bar graph',pause:true,run:edDone,
     see:'Each bar is the mean colony count of one column’s three plates.',
     why:'Bars suit separate levels like these. Highest at 30 and 37 °C, fewer at 45 °C, none at 20 °C.',
     overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,B={x0:130,x1:720,y0:70,y1:350},st=edStats(sim),ym=Math.max(150,Math.ceil(Math.max(...st.map(x=>x.m))/50)*50),p=tau%14;K.dim(ctx,LH);
       K.axes(ctx,B,k,{xr:[0,1],yt:[[0,'0'],[50/ym,'50'],[100/ym,'100'],[150/ym,'150']].filter(q=>q[0]<=1),xl:'Temperature',yl:'Mean colonies per plate'});
       K.bars(ctx,B,st.map((x,i)=>[sim.st.vals[i]+' °C',x.m/ym,sim.st.vals[i]===37?'#1b7a3a':'#1f5fbf']),k,Math.min(1,p/2));
       if(p>2)st.forEach((x,i)=>{const gw=(B.x1-B.x0)/st.length;K.tag(ctx,String(Math.round(x.m)),B.x0+gw*(i+0.5),K.Y(B,x.m/ym)-18,k,{s:12.5});});}},
    {key:'hook',title:'Your question: 20 °C or 37 °C?',pause:true,run:edDone,
     see:'24 hours, four temperatures, three plates each. The card shows each column’s mean.',
     why:'About 120 colonies at 30 and 37 °C, about 75 at 45 °C, none at 20 °C. At 20 °C cells still divide, just too slowly to show in one day.',
     overlay(sim,ctx,LH,k){edCard(ctx,k,LH,[['Mean colonies',{w:800}]].concat(edMeans(sim).map(s=>[s,{w:700}])));}},
    {key:'unfair',title:'An unfair test',set:{same:false},pause:true,run:edDone,
     see:'Now each hotter column is counted 6 hours later than the one before. Read the design check.',
     why:'Two things changed: temperature and counting time. More colonies at higher levels might just mean more time, so the test proves nothing.',
     overlay(sim,ctx,LH,k){edCard(ctx,k,LH,[[F(sim,'design'),{w:800,c:RED}]]);}},
    {key:'phase',lvl:'honors',title:'Growth phases in broth',fresh:true,speed:0.8,focus:[630,230,150,215],
     see:'The flask on the right is a broth culture at 37 °C. Watch its label change as the culture grows.',
     why:'Bacteria first adjust (<b>lag</b>), then double steadily (<b>log</b>), level off as food runs low (<b>stationary</b>), then die off as waste builds up (<b>death</b>).',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[626,180,166,180],tau);}},
    {key:'err',lvl:'ap',title:'Is the difference real?',pause:true,run:edDone,
     see:'The three plates in each column differ a little. The card gives the spread and compares error bars.',
     why:'Error bars of ±2 standard errors around each mean show how sure you can be. If two levels’ bars don’t overlap, the difference is probably real, not chance.',
     overlay(sim,ctx,LH,k){const st=edStats(sim),se=x=>{const n=x.a.length,sd=Math.sqrt(x.a.reduce((q,v)=>q+(v-x.m)*(v-x.m),0)/Math.max(1,n-1));return sd/Math.sqrt(n);};let lo=0,hi=0;st.forEach((x,i)=>{if(x.m<st[lo].m)lo=i;if(x.m>st[hi].m)hi=i;});const a=st[lo],b=st[hi],ov=a&&b&&a.m+2*se(a)>=b.m-2*se(b);
       edCard(ctx,k,LH,[['Spread (SD): '+F(sim,'sd',1),{w:700}],['Lowest vs highest:',{s:12}],[ov?'bars overlap: could be chance':'bars don’t overlap: probably real',{w:800,c:ov?RED:GREEN}]]);}}
  ],
  useIt:[
    {do:'Check your fridge thermometer: it should read 4 °C (40 °F) or colder.',why:'E. coli barely grows that cold, while near 37 °C it can double every 20 to 30 minutes.'},
    {do:'When an ad says a product “works,” ask what it was compared against.',why:'Without a control group, there’s no way to tell whether the product did anything.'},
    {do:'Testing new running shoes? Run the same route at the same effort in similar weather.',why:'If the route or weather also changes, a faster time proves nothing about the shoes.'}],
  tryIt:[{title:'the bread mold test (1 week)',steps:['Put one slice of bread in a sealed bag on the counter and one in the fridge. Same bread, same bag, same day.','Check each day and note when mold first shows.','Throw both away unopened at the end.'],look:'The counter slice molds days sooner. Only temperature changed, so temperature caused the difference.'}]};

/* ---------- cellexplorer ---------- */
const ceCard=(ctx,k,LH,rows)=>card(ctx,k,518,LH-12,272,rows,{up:true});
const CE_LAB={animal:[['Nucleus',238,214],['Rough ER',330,262],['Golgi',432,132],['Mitochondrion',364,388],['Lysosome',418,328],['Vesicle',500,150],['Cell membrane',588,232]],
  plant:[['Nucleus',112,226],['Central vacuole',382,226],['Chloroplast',268,62],['Cell wall',322,432],['Golgi',130,340]],
  bacterium:[['Nucleoid (DNA)',316,226],['Cell wall',334,302],['Capsule',334,140],['Flagellum',650,190],['Ribosomes',420,250]]};
const ceLabels=(sim,ctx,k)=>(CE_LAB[sim.p.cell]||[]).forEach(([t,x,y])=>BioLab.lg.tag(ctx,t,x,y,Math.min(k,1.3),{s:11.5,w:700}));
const CE_TABLE=[['Cell membrane',1,1,1],['Ribosomes',1,1,1],['DNA',1,1,1],['Nucleus',1,1,0],['Mitochondria',1,1,0],['ER and Golgi',1,1,0],['Cell wall',0,1,1],['Chloroplasts',0,1,0],['Big central vacuole',0,1,0]];
L.cellexplorer={
  goals:{
    bio:['The jobs of the main parts of a cell','How a protein travels from its gene to outside the cell','How plant cells and bacteria differ from animal cells'],
    honors:['How motor proteins and ATP move vesicles','Why prokaryotes lack a nucleus and other membrane-bound parts'],
    ap:['How the Golgi sends proteins to different addresses','How the ER, Golgi and vesicles work as one system']},
  matters:'Insulin, antibodies and digestive enzymes all leave your cells by one route. When a step fails, as in some forms of diabetes and cystic fibrosis, the protein never reaches its job.',
  steps:[
    {key:'cell',title:'An animal cell',pause:true,
     see:'An animal cell with its main parts labeled. The nucleus holds DNA, mitochondria make ATP, and the ER and Golgi make and ship proteins.',
     why:'Each part has a job, like the rooms of a factory. Follow one protein, insulin, to see them work together.',
     overlay(sim,ctx,LH,k,tau){ceLabels(sim,ctx,k);}},
    {key:'gene',title:'Start with the gene',speed:0.5,run:tour('cellexplorer','Start with the gene'),focus:[140,130,190,165],
     see:'Inside the nucleus, the insulin gene is copied into a messenger molecule, mRNA.',
     why:'The DNA stays safe in the nucleus. The mRNA is a working copy, like photographing one page instead of lending out the whole book.',
     overlay(sim,ctx,LH,k){ceCard(ctx,k,LH,[['1. Gene → mRNA (nucleus)',{w:800,c:RED}]]);}},
    {key:'mrna',title:'mRNA leaves the nucleus',speed:0.5,run:tour('cellexplorer','mRNA leaves the nucleus'),focus:[200,150,175,110],
     see:'The mRNA slips out through a pore in the nuclear envelope and heads for the rough ER.',
     why:'Ribosomes, the protein builders, are outside the nucleus, so the instructions have to travel to them.',
     overlay(sim,ctx,LH,k){ceCard(ctx,k,LH,[['1. Gene → mRNA'],['2. Out through a nuclear pore',{w:800,c:RED}]]);}},
    {key:'ribo',title:'A ribosome builds the protein',speed:0.4,run:tour('cellexplorer','A ribosome builds the protein'),focus:[300,120,100,110],
     see:'A ribosome on the rough ER reads the mRNA and links amino acids in order. The chain threads into the ER.',
     why:'Inside the ER the chain folds into its working shape. Proteins headed out of the cell are made here.',
     overlay(sim,ctx,LH,k){ceCard(ctx,k,LH,[['2. Out through a nuclear pore'],['3. Ribosome on rough ER builds it',{w:800,c:RED}]]);}},
    {key:'ves',title:'Packed into a vesicle',speed:0.5,run:tour('cellexplorer','Packed into a vesicle'),focus:[330,115,160,85],
     see:'A bubble of ER membrane pinches off with the protein inside.',
     why:'This <b>vesicle</b> carries the protein to the Golgi without letting it loose in the cell.',
     overlay(sim,ctx,LH,k){ceCard(ctx,k,LH,[['3. Ribosome on rough ER builds it'],['4. Vesicle to the Golgi',{w:800,c:RED}]]);}},
    {key:'golgi',title:'The Golgi finishes and ships it',speed:0.5,run:tour('cellexplorer','The Golgi finishes'),focus:[380,95,110,105],
     see:'The protein passes through the Golgi stack and leaves in a new vesicle from the far side.',
     why:'The Golgi adds finishing touches, like sugar tags, and sorts proteins by where they are going, like a post office.',
     overlay(sim,ctx,LH,k){ceCard(ctx,k,LH,[['4. Vesicle to the Golgi'],['5. Golgi finishes and ships it',{w:800,c:RED}]]);}},
    {key:'out',title:'Out of the cell',speed:0.5,run:tour('cellexplorer','Out of the cell'),focus:[455,80,150,115],
     see:'The vesicle fuses with the cell membrane, and the insulin spills outside.',
     why:'This is <b>exocytosis</b>. Outside the cell, insulin travels in the blood and tells other cells to take in sugar.',
     overlay(sim,ctx,LH,k){ceCard(ctx,k,LH,[['5. Golgi finishes and ships it'],['6. Vesicle fuses: out of the cell',{w:800,c:RED}]]);}},
    {key:'hook',title:'Your question: the whole route',pause:true,
     see:'The whole trip, in order, on the card.',
     why:'Every protein made for export takes this one route. Break any step, as in some forms of diabetes, and the protein never reaches the blood.',
     overlay(sim,ctx,LH,k){ceLabels(sim,ctx,k);ceCard(ctx,k,LH,[['Insulin’s route',{w:800}],['gene → mRNA (nucleus)'],['→ ribosome on rough ER'],['→ vesicle → Golgi'],['→ vesicle → cell membrane → out',{w:800,c:GREEN}]]);}},
    {key:'plant',title:'A plant cell adds three parts',set:{cell:'plant'},pause:true,
     see:'A plant cell: a stiff cell wall outside the membrane, a big central vacuole and green chloroplasts.',
     why:'The wall and the water-filled vacuole hold the plant up. Chloroplasts capture light to make sugar.',
     overlay(sim,ctx,LH,k){ceLabels(sim,ctx,k);ceCard(ctx,k,LH,[['New: cell wall, central vacuole, chloroplasts',{w:800,c:GREEN}]]);}},
    {key:'bact',title:'A bacterium: no nucleus',set:{cell:'bacterium'},pause:true,
     see:'A bacterium, drawn far bigger than scale. Its DNA lies loose in the nucleoid. It has ribosomes, a wall and a flagellum.',
     why:'It is a <b>prokaryote</b>: no nucleus and no membrane-bound parts. Animal and plant cells are <b>eukaryotes</b>.',
     overlay(sim,ctx,LH,k){ceLabels(sim,ctx,k);ceCard(ctx,k,LH,[['No nucleus, no mitochondria, no ER or Golgi',{w:800,c:RED}]]);}},
    {key:'table',title:'Side by side',set:{cell:'bacterium'},pause:true,
     see:'A table of which parts each kind of cell has.',
     why:'All three have a membrane, ribosomes and DNA. Only eukaryotes have a nucleus and mitochondria. Plants and bacteria have walls.',
     overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,kk=Math.min(k,1.3),x0=110,cols=[440,560,680],y0=72,rh=Math.min(34,(LH-110)/10);K.dim(ctx,LH);
       ['Animal','Plant','Bacterium'].forEach((h,i)=>H.txt(ctx,h,cols[i],y0,{s:14*kk,w:800,a:'center',b:'middle'}));
       CE_TABLE.forEach((r,j)=>{const y=y0+rh*(j+1);if(tau<0.25*j)return;H.txt(ctx,r[0],x0,y,{s:13.5*kk,w:600,b:'middle'});
         [1,2,3].forEach((c,i)=>H.txt(ctx,r[c]?'✓':'✗',cols[i],y,{s:16*kk,w:800,a:'center',b:'middle',c:r[c]?GREEN:RED}));
         ctx.save();ctx.strokeStyle=PAL['line']||'#ccc';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,y+rh/2);ctx.lineTo(740,y+rh/2);ctx.stroke();ctx.restore();});}},
    {key:'atp',lvl:'honors',title:'Who pays for the trip?',speed:0.5,run:tour('cellexplorer','Who pays for the trip?'),focus:[[370,230,140,60],[455,118,120,80]],
     see:'Motor proteins carry vesicles along microtubule tracks that spread out from the centrosome.',
     why:'Every step a motor protein takes costs one ATP, and most of the cell’s ATP comes from mitochondria.',
     overlay(sim,ctx,LH,k){ceCard(ctx,k,LH,[['Fuel: ATP from mitochondria',{w:800}]]);}},
    {key:'lyso',lvl:'ap',title:'A different address',speed:0.5,run:tour('cellexplorer','A different address'),focus:[395,150,80,210],
     see:'Some proteins leave the Golgi in vesicles that go to lysosomes instead of the membrane.',
     why:'The Golgi tags digestive enzymes with mannose-6-phosphate. Receptors read the tag and send those vesicles to lysosomes.',
     overlay(sim,ctx,LH,k){ceCard(ctx,k,LH,[['Tag: mannose-6-phosphate → lysosome',{w:800}]]);}}
  ],
  useIt:[
    {do:'If someone you know has type 1 diabetes, ask how they replace insulin.',why:'The immune system destroys the pancreas cells that make insulin, so the protein is never made and has to come by injection or pump.'},
    {do:'Soak limp lettuce in cold water for 20 minutes.',why:'Plant cells have a wall and a big vacuole, so water firms them up. Animal cells have neither.'},
    {do:'Remember this route when you hear about nerve signals.',why:'A nerve cell passes a message by fusing vesicles of neurotransmitter with its membrane, the same exocytosis step that releases insulin.'}],
  tryIt:[{title:'the cell factory map (15 minutes)',steps:['Draw a floor plan of a factory or a school cafeteria.','Label which room plays each cell part: where the recipes are kept, where food is made, where it is packed and where it goes out the door.','Trace one order from recipe to customer.'],look:'Your route should match insulin’s: recipe (DNA) → copy (mRNA) → kitchen (ribosome and ER) → packing (Golgi) → delivery (vesicle) → out the door.'}]};
ADD.cellexplorer=[
  {id:'lf-route',kind:'test',lvl:'bio',q:'Which order does a protein made for export follow?',choices:['Golgi → ribosome → nucleus → vesicle → membrane','Nucleus → mitochondrion → Golgi → lysosome → membrane','Ribosome in cytoplasm → nucleus → ER → membrane','Ribosome on rough ER → vesicle → Golgi → vesicle → membrane'],correct:3,
   steps:['The protein is built by a ribosome on the rough ER.','A vesicle carries it to the Golgi, which finishes it.','A new vesicle fuses with the membrane and releases it.']},
  {id:'lf-prok',kind:'test',lvl:'bio',q:'A cell has DNA, ribosomes and a cell wall, but no nucleus. What is it?',choices:['A bacterium','A plant cell','An animal cell','A red blood cell'],correct:0,
   steps:['No nucleus means a prokaryote.','Bacteria are prokaryotes.','Plant and animal cells keep their DNA in a nucleus.']},
  {id:'lf-vesicle',kind:'test',lvl:'honors',q:'A drug stops vesicles from fusing with the cell membrane. What happens to insulin?',choices:['It is broken down by mitochondria right away','It is made but stays trapped inside the cell','It is never copied from its gene into mRNA','It leaks out through the membrane by itself'],correct:1,
   steps:['Insulin is still made on the rough ER and finished in the Golgi.','Release needs the vesicle to fuse with the membrane.','Without fusion, the insulin stays packed inside the cell.']}];

/* ---------- register ---------- */
BioLab.addLearn(L);
/* Append the extra why questions to each tool's existing set (review.js) at the moment the engine attaches it. */
Object.keys(ADD).forEach(id=>{const d=DEF(id);if(!d)return;let cur=d.review;
  Object.defineProperty(d,'review',{configurable:true,enumerable:true,get(){return cur;},set(v){if(v&&Array.isArray(v.questions)){const have=new Set(v.questions.map(q=>q.id));v=Object.assign({},v,{questions:v.questions.concat(ADD[id].filter(q=>!have.has(q.id)))});}cur=v;}});
  if(cur)d.review=cur;});
})();
