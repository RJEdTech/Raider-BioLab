(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;

/* Hodgkin–Huxley squid giant axon (6.3 °C), resting near −65 mV.
   Units: V in mV, t in ms, currents in µA/cm². */
const ENA=50,EK=-77,EL=-54.387,GNA=120,GK=36,GL=0.3;
const AX0=120,AX1=680,AXY=78,L_MM=10;          // axon drawn = 10 mm
const NA_X=[70,210,350],K_X=[140,280,420],PUMP_X=478;
function rates(V){
  const am=Math.abs(V+40)<1e-6?1:0.1*(V+40)/(1-Math.exp(-(V+40)/10)),bm=4*Math.exp(-(V+65)/18);
  const ah=0.07*Math.exp(-(V+65)/20),bh=1/(1+Math.exp(-(V+35)/10));
  const an=Math.abs(V+55)<1e-6?0.1:0.01*(V+55)/(1-Math.exp(-(V+55)/10)),bn=0.125*Math.exp(-(V+65)/80);
  return {am,bm,ah,bh,an,bn};}
const naBlock=p=>p.ttx?0.02:(p.lido?0.4:1);
const vel=p=>p.myelin?6*p.diam:1.1*Math.sqrt(p.diam);   // m/s = mm/ms (Hursh; unmyelinated ∝ √d)
function fire(sim,delay){const s=sim.st;if(sim.p.strength<15)BioLab.setValues(sim,{strength:15});s.pulses.push(sim.t+(delay||0.5));}
const sgn=v=>(v<0?'−':'')+Math.abs(v).toFixed(0);

const NEURON={
  id:'neuron',hash:'neuron',apUnit:4,order:4,kind:'Simulation',tab:'Neurons and action potentials',
  card:'Zap an axon and watch Na⁺ rush in and K⁺ rush out. Find threshold, then block it with pufferfish toxin.',
  title:'Neurons and action potentials',
  lede:{bio:'Stimulate a neuron and watch an action potential happen: channels open, ions rush across the membrane, and the signal races down the axon.',
        honors:'Find the threshold, test the refractory period, and see how myelin and tetrodotoxin change the signal.',
        ap:'A Hodgkin–Huxley model of the squid giant axon. Read channel open probabilities, firing rates and conduction velocity, and explain each phase of the action potential.'},
  scale:'Top: one neuron, axon about 10 mm long. Below: a patch of axon membrane about 50 nanometers across, with real channel proteins about 10 nm wide.',
  timeScale:4,dtMax:0.01,prewarm:0,sampleDt:0.1,window:50,unit:'ms',unitD:1,timeLabel:'Time',chChange:3,chReveal:40,
  controls:[
    {id:'stim',label:'Stimulus type',type:'seg',def:'pulses',lvl:'bio',options:[{v:'pulses',l:'Pulses'},{v:'steady',l:'Steady current'}]},
    {id:'strength',label:'Stimulus strength',type:'range',min:0,max:40,step:0.5,def:10,unit:' µA/cm²',d:1,lvl:'bio',help:'Threshold for a 1 ms pulse is about 7.'},
    {id:'freq',label:'Pulse rate',type:'range',min:0,max:100,step:5,def:20,unit:' Hz',lvl:'bio',help:'0 means pulses only when you press Single pulse.'},
    {id:'myelin',label:'Myelin sheath',help:'Insulating wraps with gaps (nodes of Ranvier)',type:'toggle',def:false,lvl:'bio'},
    {id:'gap',label:'Time between paired pulses',type:'range',min:2,max:30,step:1,def:5,unit:' ms',lvl:'honors'},
    {id:'ttx',label:'Tetrodotoxin',help:'Pufferfish toxin that plugs Na⁺ channels',type:'toggle',def:false,lvl:'honors'},
    {id:'lido',label:'Lidocaine',help:'Numbing drug that partly blocks Na⁺ channels',type:'toggle',def:false,lvl:'honors'},
    {id:'diam',label:'Axon diameter',type:'range',min:1,max:20,step:1,def:10,unit:' µm',lvl:'ap'}
  ],
  actions:[
    {id:'pulse',label:'Single pulse',primary:true,run(sim){sim.st.pulses.push(sim.t+0.2);}},
    {id:'pair',label:'Paired pulses',lvl:'honors',run(sim){sim.st.pulses.push(sim.t+0.2,sim.t+0.2+sim.p.gap);}}
  ],
  init(){const r=rates(-65);return {V:-65,Vprev:-65,m:r.am/(r.am+r.bm),h:r.ah/(r.ah+r.bh),n:r.an/(r.an+r.bn),
    pulses:[],nextPulse:null,spikes:[],count:0,above:false,pk:-99,lastPeak:NaN,waves:[],rel:[],INa:0,IK:0,Iext:0};},
  step(sim,dt){const p=sim.p,s=sim.st,t=sim.t;
    if(p.stim==='pulses'&&p.freq>0){if(s.nextPulse===null)s.nextPulse=t+1;if(t>=s.nextPulse){s.pulses.push(s.nextPulse);s.nextPulse+=1000/p.freq;}}else s.nextPulse=null;
    let I=p.stim==='steady'?p.strength:0;
    for(const q of s.pulses)if(t>=q&&t<q+1)I=Math.max(I,p.strength);
    if(s.pulses.length&&s.pulses[0]+1<t)s.pulses=s.pulses.filter(q=>q+1>=t);
    const V=s.V,r=rates(V);
    s.m+=dt*(r.am*(1-s.m)-r.bm*s.m);s.h+=dt*(r.ah*(1-s.h)-r.bh*s.h);s.n+=dt*(r.an*(1-s.n)-r.bn*s.n);
    s.INa=GNA*naBlock(p)*s.m*s.m*s.m*s.h*(V-ENA);s.IK=GK*Math.pow(s.n,4)*(V-EK);const IL=GL*(V-EL);
    s.Iext=I;s.Vprev=V;s.V=clamp(V+dt*(I-s.INa-s.IK-IL),-100,70);
    if(s.V>0&&!s.above){s.above=true;s.pk=s.V;s.spikes.push(t);if(s.spikes.length>20)s.spikes.shift();s.count++;s.waves.push({t0:t,done:false});}
    if(s.above){s.pk=Math.max(s.pk,s.V);if(s.V<-30){s.above=false;s.lastPeak=s.pk;}}
    const v=vel(p);
    for(const w of s.waves){if(!w.done&&v*(t-w.t0)>=L_MM){w.done=true;s.rel.push(t);}}
    if(s.waves.length&&(s.waves[0].done&&t-s.waves[0].t0>60))s.waves.shift();
    if(s.rel.length&&t-s.rel[0]>20)s.rel.shift();},
  metrics:[
    {id:'V',label:'Membrane potential',unit:'mV',lvl:'bio',min:-90,max:60,fixed:true,d:0,get:s=>s.st.V},
    {id:'count',label:'Action potentials fired',unit:'',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.count},
    {id:'peak',label:'Peak of last spike',unit:'mV',lvl:'bio',min:-90,max:60,d:0,get:s=>s.st.lastPeak},
    {id:'rate',label:'Firing rate',unit:'Hz',lvl:'bio',min:0,max:150,d:0,get:s=>{const sp=s.st.spikes;if(sp.length<2)return 0;const isi=sp[sp.length-1]-sp[sp.length-2];return s.t-sp[sp.length-1]<2*isi+2?1000/isi:0;}},
    {id:'vel',label:'Conduction speed',unit:'m/s',lvl:'bio',min:0,max:130,d:1,get:s=>vel(s.p)},
    {id:'toe',label:'Time to travel 1 m (spine to toe)',unit:'ms',lvl:'honors',min:0,max:1100,d:0,get:s=>1000/vel(s.p)},
    {id:'na',label:'Na⁺ channels open',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>100*Math.pow(s.st.m,3)*s.st.h*naBlock(s.p)},
    {id:'k',label:'K⁺ channels open',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>100*Math.pow(s.st.n,4)},
    {id:'iext',label:'Stimulus current',unit:'µA/cm²',lvl:'ap',min:0,max:40,d:1,get:s=>s.st.Iext}
  ],
  graphs:[{id:'V',label:'Membrane potential (oscilloscope)',lines:['V']},{id:'rate',label:'Firing rate',lines:['rate']},{id:'chan',label:'Na⁺ and K⁺ channels open',lvl:'ap',lines:['na','k']}],
  defaultGraph:'V',
  challenges:[
    {lvl:'bio',q:'A weak pulse nudges the neuron but stays below threshold. What happens?',
     choices:['A small action potential fires','A full-size action potential fires','The voltage blips up a little and fades, with no action potential'],correct:2,
     baseline:{stim:'pulses',freq:0,strength:4},changeAction:'pulse',changeText:'A weak 4 µA/cm² pulse was delivered',watch:'V',reveal:20,
     explain:{bio:'Below threshold, too few Na⁺ channels open to start the chain reaction. The voltage rises a few millivolts and leaks back to rest. An action potential is all-or-none: it fires fully or not at all.',
              ap:'A 1 ms, 4 µA/cm² pulse depolarizes the membrane only about 4 mV. Voltage-gated Na⁺ channels need roughly −55 mV to open in large enough numbers for the positive feedback loop to take over.'}},
    {lvl:'bio',q:'A steady stimulus makes the neuron fire over and over. What happens when you make the stimulus stronger?',
     choices:['Each action potential gets taller','Action potentials come more often but stay about the same size','Nothing changes'],correct:1,
     baseline:{stim:'steady',strength:8},change:{strength:20},changeText:'Stimulus raised from 8 to 20 µA/cm²',watch:'V',at:40,reveal:100,
     explain:{bio:'Neurons signal "stronger" by firing more often, not by making bigger spikes. Every spike runs up to about the same peak because it is driven by the same Na⁺ rush. Watch the firing rate climb.',
              ap:'This is frequency coding. Stronger current shortens the time to reach threshold after each refractory period. In this model the peak even dips slightly at high rates because Na⁺ channels have less time to recover.'}},
    {lvl:'bio',q:'Wrap the axon in myelin. What happens to how fast the signal travels?',
     choices:['It slows down','It speeds up a lot','It stays the same'],correct:1,
     baseline:{myelin:false},change:{myelin:true},changeText:'Myelin added',watch:'V',at:3,reveal:10,
     explain:{bio:'Myelin insulates the axon so the signal jumps from gap to gap (nodes of Ranvier) instead of crawling along every bit of membrane. Here it goes from about 3.5 to 60 m/s.',
              honors:'Saltatory conduction: ions only cross at the nodes of Ranvier, and current spreads quickly under the insulated myelin. That is why multiple sclerosis, which damages myelin, slows and blocks signals.'}},
    {lvl:'honors',q:'Tetrodotoxin (from pufferfish) blocks Na⁺ channels. A steady stimulus is making the neuron fire. What happens when the toxin arrives?',
     choices:['Firing stops','Firing speeds up','The action potentials get bigger'],correct:0,
     baseline:{stim:'steady',strength:15},change:{ttx:true},changeText:'Tetrodotoxin added',watch:'V',at:30,reveal:90,
     explain:{honors:'With Na⁺ channels plugged, Na⁺ can’t rush in, so the membrane can never swing positive. The stimulus still pushes the voltage up a little, but no action potentials fire. Signals to muscles stop, which is why the toxin paralyzes.'}},
    {lvl:'honors',q:'Two strong pulses arrive 5 ms apart. How many action potentials fire?',
     choices:['Two','One, because the second pulse lands in the refractory period','None'],correct:1,
     baseline:{stim:'pulses',freq:0,strength:15,gap:5},changeAction:'pair',changeText:'Two pulses, 5 ms apart',watch:'V',at:3,reveal:30,
     explain:{honors:'Right after a spike, Na⁺ channels are inactivated and K⁺ channels are still open. The neuron can’t fire again until they reset. That refractory period sets a speed limit on firing and keeps signals moving one way down the axon.',
              ap:'In this squid-axon model at 6.3 °C, a second 15 µA/cm² pulse needs about 12 ms to succeed. Mammalian neurons at 37 °C recover in about 1–2 ms.'}},
    {lvl:'ap',q:'During one action potential, which channels open first?',
     choices:['Na⁺ channels','K⁺ channels','Both at exactly the same time'],correct:0,
     baseline:{stim:'pulses',freq:0,strength:15},changeAction:'pulse',changeText:'One pulse delivered',watch:'chan',at:3,reveal:15,
     explain:{ap:'The m gates of Na⁺ channels respond in about 0.1 ms, while the n gates of K⁺ channels take about 1 ms. Na⁺ rushes in first (rising phase), then the slower K⁺ current and Na⁺ inactivation (h gate) bring the voltage back down.'}},
    {lvl:'ap',q:'On an unmyelinated axon, what does increasing the diameter from 1 to 16 µm do to conduction speed?',
     choices:['Speeds it up','Slows it down','No effect'],correct:0,
     baseline:{myelin:false,diam:1},change:{diam:16},changeText:'Axon widened to 16 µm',watch:'V',at:3,reveal:10,
     explain:{ap:'A wider axon has lower internal resistance, so current spreads farther ahead of the spike. Unmyelinated speed grows with √diameter (here 1.1 → 4.4 m/s). That is why squid evolved giant axons, while vertebrates use myelin instead (speed ∝ diameter).'}}
  ],
  narrate(sim){const s=sim.st,p=sim.p,V=s.V,dV=s.V-s.Vprev,hon=atLeast('honors');
    if(p.ttx&&hon)return '<b>Tetrodotoxin is plugging the Na⁺ channels.</b> Na⁺ can’t rush in, so the inside can never swing positive and no action potential fires. This is why pufferfish poisoning paralyzes.';
    if(V>-45&&dV>0)return '<b>Depolarization.</b> Voltage-gated Na⁺ channels are open and Na⁺ rushes in, so the inside swings positive (now '+sgn(V)+' mV).';
    if(V>-62&&dV<=0&&s.n>0.45)return '<b>Repolarization.</b> The Na⁺ channels have closed and K⁺ channels are open. K⁺ flows out, carrying positive charge, so the inside drops back down.';
    if(V<-68)return '<b>Undershoot.</b> K⁺ channels are slow to close, so the inside dips below resting ('+sgn(V)+' mV). For a few milliseconds the neuron is hard to fire again (refractory period).';
    if(p.lido&&hon&&s.Iext>0)return '<b>Lidocaine is blocking many Na⁺ channels.</b> Not enough Na⁺ can rush in, so most stimuli fail to fire a spike. That is how a dentist’s shot stops pain signals.';
    if(s.Iext>0)return 'A stimulus is pushing the inside less negative ('+sgn(V)+' mV). If it reaches threshold (about −55 mV), Na⁺ channels snap open and an action potential fires.';
    return 'Resting at '+sgn(V)+' mV. The Na⁺/K⁺ pump keeps Na⁺ outside and K⁺ inside, and the inside stays negative.'+(p.stim==='pulses'&&p.freq===0?' Press <b>Single pulse</b> to stimulate.':'');},
  tour:[
    {title:'Meet the neuron',text:'A neuron is a cell built to carry signals. Dendrites collect signals, the cell body adds them up, and the long axon carries an electrical pulse to the axon terminal, where it passes the message on.',focus:[0,8,800,140],speed:0.25,setup(sim){BioLab.setValues(sim,{freq:0,myelin:false});}},
    {title:'The resting membrane',text:'Zoomed in on the axon membrane. The Na⁺/K⁺ pump keeps Na⁺ (gold) mostly outside and K⁺ (purple) mostly inside. The inside sits about 65 mV more negative than the outside.',focus:[8,166,516,276],pause:true},
    {title:'Threshold: Na⁺ rushes in',text:{bio:'A stimulus pushes the inside up to threshold. Na⁺ channels snap open and Na⁺ floods in, so the inside becomes positive. Watch the gold ions pour through the blue channels.',honors:'At threshold, voltage-gated Na⁺ channels open. Na⁺ entering depolarizes the membrane further, which opens even more Na⁺ channels: a positive feedback loop that drives the spike up to about +40 mV.'},focus:[8,166,516,276],speed:0.05,setup(sim){fire(sim,0.4);}},
    {title:'Repolarization: K⁺ flows out',text:{bio:'Next the Na⁺ channels close and K⁺ channels open. K⁺ (purple) leaves through the green channels, carrying positive charge out, so the inside goes negative again.',honors:'Na⁺ channels inactivate (the ball-like gate swings shut) and the slower K⁺ channels open. K⁺ efflux repolarizes the membrane and briefly overshoots below rest.'},focus:[8,166,516,276],speed:0.05,setup(sim){fire(sim,0.4);}},
    {title:'Reading the trace',text:'The oscilloscope plots voltage against time: a fast rise (Na⁺ in), a fall (K⁺ out) and a small dip below rest. Every action potential in this neuron has the same shape and height.',focus:[533,166,262,276],speed:0.2,setup(sim){fire(sim,0.4);}},
    {title:'The signal travels',text:'An action potential at one spot depolarizes the membrane next to it, so the spike sweeps down the axon like a falling row of dominoes. Without myelin it crawls along at a few meters per second.',focus:[100,40,700,80],speed:0.2,setup(sim){BioLab.setValues(sim,{myelin:false});fire(sim,0.2);}},
    {title:'Myelin makes it jump',text:'Myelin wraps insulate the axon. The spike only happens at the gaps (nodes of Ranvier), so it jumps from node to node. Here it moves about 17 times faster. We have slowed time way down so you can see the jumps.',focus:[100,40,700,80],speed:0.03,setup(sim){BioLab.setValues(sim,{myelin:true});fire(sim,0.2);}},
    {lvl:'honors',title:'Blocking the signal',text:'Tetrodotoxin plugs Na⁺ channels. Now the stimulus can only nudge the voltage, and no spike starts. Local anesthetics like lidocaine work the same way, more gently.',focus:[8,166,516,276],speed:0.2,setup(sim){BioLab.setValues(sim,{myelin:false,ttx:true});fire(sim,0.4);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{ttx:false,myelin:false,freq:20,strength:10});},
  lab:{bio:'<p><b>Question:</b> How strong does a stimulus have to be to make a neuron fire?</p><ol><li>Set Pulse rate to 0 so pulses only come when you press Single pulse.</li><li>Try strengths of 2, 4, 6, 7, 8, 10 and 20 µA/cm². After each pulse, record a trial.</li><li>Plot strength (x) against Peak of last spike (y).</li></ol><p>Where is the threshold? Explain why the peak doesn’t keep rising with stronger pulses.</p>',
       honors:'<p><b>Question:</b> How does a neuron code for a stronger stimulus?</p><ol><li>Choose Steady current.</li><li>Record the firing rate and spike peak at strengths 5, 8, 10, 15, 20, 30 and 40.</li><li>Plot strength against firing rate, and strength against peak.</li></ol><p>Use your data to explain the all-or-none law and frequency coding.</p>',
       ap:'<p><b>Question:</b> How do myelin and axon diameter affect conduction velocity?</p><ol><li>With myelin off, record conduction speed for diameters 1, 2, 4, 8, 16 and 20 µm.</li><li>Repeat with myelin on.</li><li>Plot diameter (x) against speed (y) for both.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain the two different relationships, and why vertebrates rely on myelin rather than giant axons.</p>'},
  terms:[{t:'Neuron',d:'A nerve cell that carries electrical signals.'},{t:'Action potential',d:'A brief, all-or-none reversal of the voltage across an axon membrane.'},{t:'Resting potential',d:'The voltage across a neuron at rest, about −65 to −70 mV (inside negative).'},{t:'Threshold',d:'The voltage (about −55 mV) at which Na⁺ channels open and a spike starts.'},
    {lvl:'honors',t:'Depolarization / repolarization',d:'The inside becoming less negative (Na⁺ in), then returning to negative (K⁺ out).'},{lvl:'honors',t:'Refractory period',d:'The few milliseconds after a spike when the neuron can’t fire again.'},{lvl:'honors',t:'Myelin and nodes of Ranvier',d:'Insulating wraps on the axon, and the gaps between them where the spike happens.'},{lvl:'honors',t:'Na⁺/K⁺ pump',d:'Uses ATP to move 3 Na⁺ out and 2 K⁺ in, keeping the gradients that power spikes.'},
    {lvl:'ap',t:'Voltage-gated channel',d:'A channel that opens or closes when membrane voltage changes. Na⁺ channels also inactivate.'},{lvl:'ap',t:'Saltatory conduction',d:'A spike jumping from node to node along a myelinated axon.'},{lvl:'ap',t:'Frequency coding',d:'Signaling stimulus strength by spike rate rather than spike size.'}],
  about:'<p>The membrane follows the Hodgkin–Huxley (1952) equations for the squid giant axon at 6.3 °C: C·dV/dt = I<sub>stim</sub> − g<sub>Na</sub>m³h(V−E<sub>Na</sub>) − g<sub>K</sub>n⁴(V−E<sub>K</sub>) − g<sub>L</sub>(V−E<sub>L</sub>), with E<sub>Na</sub> = +50 mV, E<sub>K</sub> = −77 mV, g<sub>Na</sub> = 120 and g<sub>K</sub> = 36 mS/cm². Pulses last 1 ms.</p><p><b>Simplified:</b> this cold squid axon is about 5–10× slower than a human neuron at 37 °C, so its refractory period (about 12 ms) is longer than in your body (1–2 ms). The membrane patch is one point; travel down the axon is drawn using a speed formula rather than a full cable model: unmyelinated ≈ 1.1·√d m/s, myelinated ≈ 6·d m/s (d in µm). Tetrodotoxin is modeled as a 98% Na⁺ block and lidocaine as a 60% block. Ion dots are a cartoon of the flow; the real number of ions crossing is tiny compared with those present.</p>',
  initVis(sim){const r=rng(19),v=sim.vis;v.out=[];v.inn=[];
    for(let i=0;i<34;i++)v.out.push({x:16+r()*494,y:198+r()*46,na:i<28,ph:r()*6.3});
    for(let i=0;i<32;i++)v.inn.push({x:16+r()*494,y:324+r()*62,na:i<6,ph:r()*6.3});
    v.flux=[];v.aNa=0;v.aK=0;v.pumpT=0;v.pump=[];v.ves=[];},
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis,hon=atLeast("honors"),ap=atLeast("ap");
    const simDt=vdt*4,j=RM?0:1;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,160);
    /* ---- top: the whole neuron ---- */
    const NC='#7b68c4';ctx.strokeStyle=NC;ctx.lineCap='round';
    [[-2.6,40],[-2.2,46],[-3.0,34],[2.6,36],[-1.6,38],[1.9,30]].forEach((b,i)=>{const a=b[0],L=b[1];ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(80,AXY);const ex=80+Math.cos(a)*L*1.4,ey=AXY+Math.sin(a)*L*1.2;ctx.lineTo(ex,ey);ctx.stroke();
      ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex+Math.cos(a-0.5)*16,ey+Math.sin(a-0.5)*16);ctx.moveTo(ex,ey);ctx.lineTo(ex+Math.cos(a+0.5)*16,ey+Math.sin(a+0.5)*16);ctx.stroke();});
    ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(100,AXY);ctx.lineTo(AX1+14,AXY);ctx.stroke();
    ctx.fillStyle=NC;ctx.beginPath();ctx.arc(80,AXY,28,0,6.29);ctx.fill();ctx.fillStyle='#4b3d8f';ctx.beginPath();ctx.arc(76,AXY-2,10,0,6.29);ctx.fill();
    // terminals and the next cell
    [[-16],[0],[16]].forEach((o,i)=>{ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(AX1+10,AXY);ctx.lineTo(AX1+44,AXY+o[0]*1.6);ctx.stroke();ctx.fillStyle=NC;ctx.beginPath();ctx.arc(AX1+50,AXY+o[0]*1.6,9,0,6.29);ctx.fill();});
    ctx.fillStyle=PAL['cv-soft'];ctx.globalAlpha=.35;rr(ctx,AX1+72,AXY-46,40,92,16);ctx.fill();ctx.globalAlpha=1;
    if(p.myelin){for(let x=AX0+6;x<AX1-4;x+=56){ctx.fillStyle='#e9d9a4';rr(ctx,x+3,AXY-12,50,24,11);ctx.fill();ctx.strokeStyle='#b39c55';ctx.lineWidth=1.2;ctx.stroke();}
      txt(ctx,'Myelin sheath',300,AXY-24,{s:12*k,w:600,c:PAL['cv-soft'],a:'center'});}
    // traveling spikes
    const vv=vel(p);
    for(const w of s.waves){let pos=vv*(sim.t-w.t0);if(pos<0||pos>L_MM)continue;if(p.myelin)pos=Math.floor(pos/1)*1+0.5;
      const x=AX0+pos/L_MM*(AX1-AX0),g=ctx.createRadialGradient(x,AXY,2,x,AXY,26);g.addColorStop(0,'rgba(255,214,60,.95)');g.addColorStop(1,'rgba(255,214,60,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,AXY,26,0,6.29);ctx.fill();}
    // synapse release
    for(const r0 of s.rel){const age=sim.t-r0;for(let i=0;i<6;i++){const a=(i/6)*6.28,d=4+age*2.2;ctx.fillStyle=PAL['s3'];ctx.globalAlpha=clamp(1-age/15,0,1);ctx.beginPath();ctx.arc(AX1+60+Math.min(d,12)+i%2*3,AXY-14+i*6,2.6,0,6.29);ctx.fill();}}ctx.globalAlpha=1;
    // stimulator + recording
    const on=s.Iext>0;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(130,14);ctx.lineTo(130,AXY-8);ctx.stroke();
    if(on){ctx.strokeStyle='#f2b705';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(122,28);ctx.lineTo(132,38);ctx.lineTo(124,44);ctx.lineTo(136,56);ctx.stroke();}
    txt(ctx,'Stimulator',138,22,{s:12*k,w:600,c:PAL['cv-soft']});
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.setLineDash([4,3]);rr(ctx,150,AXY-12,24,24,4);ctx.stroke();ctx.beginPath();ctx.moveTo(150,AXY+12);ctx.lineTo(10,168);ctx.moveTo(174,AXY+12);ctx.lineTo(520,168);ctx.stroke();ctx.setLineDash([]);
    txt(ctx,'Cell body',84,AXY+64,{s:12*k,w:600,c:PAL['cv-soft'],a:'center'});txt(ctx,'Axon',420,AXY+30,{s:12*k,w:600,c:PAL['cv-soft'],a:'center'});
    txt(ctx,hon?'Axon terminal → synapse':'Axon terminal',790,AXY+62,{s:12*k,w:600,c:PAL['cv-soft'],a:'right'});
    if(ap&&s.rel.length)txt(ctx,'Ca²⁺ in → neurotransmitter out',790,AXY-52,{s:11*k,w:600,c:PAL['s3'],a:'right'});
    /* ---- membrane patch ---- */
    ctx.fillStyle=PAL['cv-sol'];ctx.fillRect(10,168,512,94);ctx.fillStyle=PAL['cv-matrix'];ctx.fillRect(10,300,512,140);ctx.fillStyle=PAL['cv-tail'];ctx.fillRect(10,262,512,38);
    ctx.fillStyle=PAL['cv-head'];for(let x=14;x<522;x+=10){ctx.beginPath();ctx.arc(x,265,4,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(x,297,4,0,6.29);ctx.fill();}
    txt(ctx,'OUTSIDE THE AXON',18,186,{s:11.5*k,w:700,c:PAL['cv-soft']});txt(ctx,'INSIDE THE AXON',18,434,{s:11.5*k,w:700,c:PAL['cv-soft']});
    // charge signs
    const pos=s.V>0;[105,175,245,315,385,445].forEach(x=>{txt(ctx,pos?'−':'+',x,252,{s:15*k,w:800,c:pos?PAL['s2']:PAL['s1'],a:'center',b:'middle'});txt(ctx,pos?'+':'−',x,312,{s:15*k,w:800,c:pos?PAL['s1']:PAL['s2'],a:'center',b:'middle'});});
    // ions at rest
    const ion=(q,x,y)=>{ctx.fillStyle=q?PAL['s4']:PAL['s5'];ctx.beginPath();ctx.arc(x,y,4.2,0,6.29);ctx.fill();};
    v.out.forEach(o=>ion(o.na,o.x+Math.sin(t*1.3+o.ph)*2*j,o.y+Math.cos(t*1.1+o.ph)*2*j));v.inn.forEach(o=>ion(o.na,o.x+Math.sin(t*1.2+o.ph)*2*j,o.y+Math.cos(t*1.4+o.ph)*2*j));
    // channels
    const oNa=Math.pow(s.m,3)*s.h*naBlock(p),oK=Math.pow(s.n,4);
    const chan=(x,o,col)=>{const w=3+9*clamp(o*1.6,0,1);ctx.fillStyle=col;rr(ctx,x-w-13,250,13,62,5);ctx.fill();rr(ctx,x+w,250,13,62,5);ctx.fill();};
    NA_X.forEach(x=>{chan(x,oNa,'#3f6fb0');if(s.h<0.35){ctx.fillStyle='#8aa5d6';ctx.beginPath();ctx.arc(x,316,6,0,6.29);ctx.fill();}
      if(p.ttx&&hon){ctx.fillStyle='#d32f2f';ctx.beginPath();ctx.moveTo(x,236);ctx.lineTo(x+7,244);ctx.lineTo(x,252);ctx.lineTo(x-7,244);ctx.closePath();ctx.fill();}
      else if(p.lido&&hon){ctx.fillStyle='#e08a00';ctx.beginPath();ctx.arc(x,281,5,0,6.29);ctx.fill();}});
    K_X.forEach(x=>chan(x,oK,'#2a8276'));
    if(p.ttx&&hon)txt(ctx,'TTX',NA_X[2]+16,236,{s:11*k,w:700,c:'#d32f2f'});
    // pump
    ctx.fillStyle='#8a5a2b';rr(ctx,PUMP_X-18,252,36,58,8);ctx.fill();txt(ctx,'pump',PUMP_X,283,{s:10.5*k,w:700,c:'#fff',a:'center',b:'middle'});if(hon)txt(ctx,'ATP',PUMP_X,326,{s:10.5*k,w:700,c:PAL['cv-soft'],a:'center'});
    v.pumpT+=vdt;if(v.pumpT>1.6&&vdt>0){v.pumpT=0;for(let i=0;i<3;i++)v.pump.push({x:PUMP_X-6+i*6,y:318,vy:-60,na:true});for(let i=0;i<2;i++)v.pump.push({x:PUMP_X-3+i*6,y:244,vy:60,na:false});}
    // fluxes: dots through open channels, in proportion to the currents
    v.aNa+=Math.max(0,-s.INa)*simDt*0.16;v.aK+=Math.max(0,s.IK)*simDt*0.16;
    while(v.aNa>=1){v.aNa--;v.flux.push({x:NA_X[(Math.random()*3)|0],y:238,vy:1,na:true});}
    while(v.aK>=1){v.aK--;v.flux.push({x:K_X[(Math.random()*3)|0],y:324,vy:-1,na:false});}
    if(v.flux.length>90)v.flux.splice(0,v.flux.length-90);
    for(const f of v.flux){f.y+=f.vy*simDt*70;ion(f.na,f.x,f.y);}v.flux=v.flux.filter(f=>f.y>226&&f.y<336);
    for(const f of v.pump){f.y+=f.vy*vdt;ion(f.na,f.x,f.y);}v.pump=v.pump.filter(f=>f.y>230&&f.y<332);
    txt(ctx,'Inside: '+sgn(s.V)+' mV',22,410,{s:17*k,w:800,c:s.V>0?PAL['s1']:PAL['cv-ink']});
    // legend
    let lx=196;const sw=(col,lab,dot)=>{ctx.fillStyle=col;if(dot){ctx.beginPath();ctx.arc(lx+5,404,4.5,0,6.29);ctx.fill();}else{rr(ctx,lx,398,10,13,3);ctx.fill();}txt(ctx,lab,lx+15,409,{s:11.5*k,c:PAL['cv-soft']});ctx.font='400 '+11.5*k+'px '+FONT;lx+=ctx.measureText(lab).width+28;};
    sw('#3f6fb0','Na⁺ channel');sw('#2a8276','K⁺ channel');sw(PAL['s4'],'Na⁺',true);sw(PAL['s5'],'K⁺',true);
    if(hon)txt(ctx,'Light-blue ball = Na⁺ inactivation gate',196,428,{s:11*k,c:PAL['cv-soft']});
    /* ---- oscilloscope ---- */
    const SX=535,SY=168,SW=257,SH=272;ctx.fillStyle='#0f1d16';rr(ctx,SX,SY,SW,SH,10);ctx.fill();
    const gx0=SX+40,gx1=SX+SW-12,gy0=SY+30,gy1=SY+SH-30,Y=V=>gy1-(V+90)/(140)*(gy1-gy0),win=25;
    ctx.strokeStyle='#1f3b2c';ctx.lineWidth=1;[-80,-40,0,40].forEach(mv=>{ctx.beginPath();ctx.moveTo(gx0,Y(mv));ctx.lineTo(gx1,Y(mv));ctx.stroke();});
    for(let i=0;i<=5;i++){const x=gx0+i*(gx1-gx0)/5;ctx.beginPath();ctx.moveTo(x,gy0);ctx.lineTo(x,gy1);ctx.stroke();}
    [[40,'+40'],[0,'0'],[-65,'−65']].forEach(a=>txt(ctx,a[1],gx0-6,Y(a[0]),{s:11*k,c:'#8fd1a8',a:'right',b:'middle'}));
    if(hon){ctx.setLineDash([4,4]);ctx.strokeStyle='#d8a23a';ctx.beginPath();ctx.moveTo(gx0,Y(-55));ctx.lineTo(gx1,Y(-55));ctx.stroke();ctx.setLineDash([]);txt(ctx,'threshold',gx1-2,Y(-55)-5,{s:10.5*k,c:'#d8a23a',a:'right'});}
    const t1=sim.t,t0=t1-win;ctx.strokeStyle='#5df08f';ctx.lineWidth=2;ctx.beginPath();let first=true;
    for(const h of sim.hist){if(h.t<t0)continue;const x=gx0+(h.t-t0)/win*(gx1-gx0),y=Y(h.v.V);if(first){ctx.moveTo(x,y);first=false;}else ctx.lineTo(x,y);}ctx.stroke();
    txt(ctx,'Oscilloscope · mV',SX+12,SY+18,{s:12*k,w:700,c:'#bfe8cc'});txt(ctx,'last 25 ms',gx1,SY+SH-10,{s:11*k,c:'#8fd1a8',a:'right'});
  }
};
NEURON.thumbSetup=function(sim){sim.st.pulses.push(sim.t+0.2);};
NEURON.thumbFrames=30;
BioLab.register(NEURON);
})();
