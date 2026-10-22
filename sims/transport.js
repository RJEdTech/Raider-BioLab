(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;
/* Osmosis model (Boyle–van ’t Hoff + water potential).
   Water flows into the cell at rate k·(ψout − ψin). ψs = −C·R·T (C in Osm/L), ψp = wall pressure for plant cells.
   Internal osmolarity Ci = n·(1−Vb)/(V−Vb): Vb is the non-water volume (0.4 for a red blood cell, 0.1 for a plant cell). */
const RT=0.002451;               // MPa per mOsm/L at 22 °C (0.00831 L·MPa/mol·K × 295 K ÷ 1000)
const OSM_PER_PCT=342;           // 1% NaCl ≈ 171 mM NaCl ≈ 342 mOsm/L (i = 2)
const LYSE=1.5;                  // red blood cell bursts above 150% volume
const WALL_E=8;                  // plant wall elastic modulus, MPa
const CX=240,CY=232;
const TR={
  id:'transport',hash:'transport',apUnit:2,order:4,kind:'Simulation',tab:'Membrane transport and osmosis',
  card:'Drop a red blood cell or a plant cell into salt water and watch water rush in or out.',
  title:'Membrane transport and osmosis',
  lede:{bio:'Water moves across a cell membrane toward the side with more dissolved salt. Change the salt outside and watch the cell swell, shrink or burst.',
        honors:'Compare a red blood cell with a plant cell, remove the aquaporin water channels, and switch off the Na⁺/K⁺ pump that keeps a cell from swelling.',
        ap:'Water potential, measured. Follow ψ = ψs + ψp inside and outside the cell, and predict the direction of water flow from the numbers.'},
  scale:{bio:'A red blood cell is about 8 micrometers across, so about 10 of them would fit across the width of a hair. The zoom on the right shows a patch of its membrane a few nanometers wide.',
         honors:'Left: one whole cell (a red blood cell is about 8 µm across, a plant cell about 50 µm). Right: a few nanometers of its membrane, where single water molecules cross.'},
  timeScale:1,dtMax:0.02,prewarm:30,sampleDt:0.1,window:30,unit:'s',chChange:3,chReveal:12,
  controls:[
    {id:'cell',label:'Cell',type:'seg',def:'rbc',lvl:'bio',options:[{v:'rbc',l:'Red blood cell'},{v:'plant',l:'Plant cell'}]},
    {id:'salt',label:'Salt outside',type:'range',min:0,max:3,step:0.05,def:0.9,unit:'% NaCl',lvl:'bio',help:'0.9% is the saltiness of blood (saline drip). 0% is pure water.'},
    {id:'aqua',label:'Aquaporins',help:'Protein channels that let water through quickly',type:'toggle',def:true,lvl:'bio'},
    {id:'inside',label:'Solutes inside the cell',type:'range',min:100,max:900,step:10,def:300,unit:' mOsm/L',lvl:'honors',help:'Dissolved particles trapped inside the cell'},
    {id:'pump',label:'Na⁺/K⁺ pump',help:'Uses ATP to push Na⁺ back out of the cell',type:'toggle',def:true,lvl:'honors'}
  ],
  init(){return {V:1,extra:0,lysed:false,lysedT:0,flow:0,Ci:300,psiOut:0,psiIn:0,psiP:0,psiS:0,n:300};},
  step(sim,dt){const p=sim.p,s=sim.st,plant=p.cell==='plant',Vb=plant?0.1:0.4,Co=p.salt*OSM_PER_PCT;
    if(!p.pump)s.extra+=0.015*Math.max(Co,40)*dt;              // Na⁺ leaks in when the pump stops
    s.n=p.inside+s.extra;
    if(s.lysed){s.flow=0;s.psiOut=-Co*RT;s.lysedT+=dt;return;}
    s.Ci=s.n*(1-Vb)/Math.max(s.V-Vb,0.02);
    s.psiOut=-Co*RT;s.psiS=-s.Ci*RT;s.psiP=plant?Math.max(0,WALL_E*(s.V-1)):0;s.psiIn=s.psiS+s.psiP;
    const k=p.aqua?0.27:0.045;                                     // volume fraction per s per MPa
    const dV=k*(s.psiOut-s.psiIn);s.flow=dV*100;
    s.V=Math.max(Vb+0.03,s.V+dV*dt);
    if(!plant&&s.V>LYSE){s.lysed=true;s.lysedT=0;s.flow=0;}},
  metrics:[
    {id:'vol',label:'Cell volume',unit:'% of normal',lvl:'bio',min:0,max:200,d:0,get:s=>s.st.lysed?NaN:s.st.V*100},
    {id:'tonic',label:'The outside solution is',unit:'',lvl:'bio',text:true,get:s=>{const Co=s.p.salt*OSM_PER_PCT,n=s.st.n;return Co<n*0.95?'Hypotonic (less solute)':Co>n*1.05?'Hypertonic (more solute)':'Isotonic (equal solute)';}},
    {id:'water',label:'Net water movement',unit:'',lvl:'bio',text:true,get:s=>s.st.lysed?'The cell burst':s.st.flow>0.25?'Into the cell':s.st.flow<-0.25?'Out of the cell':'Balanced, no net flow'},
    {id:'flow',label:'Water flow',unit:'% volume/s',lvl:'honors',min:-20,max:20,d:1,get:s=>Math.abs(s.st.flow)<0.05?0:s.st.flow},
    {id:'ci',label:'Solutes inside now',unit:'mOsm/L',lvl:'honors',min:0,max:1000,d:0,get:s=>s.st.lysed?NaN:s.st.Ci},
    {id:'psiOut',label:'ψ outside',unit:'MPa',lvl:'ap',min:-2.6,max:0,d:2,get:s=>s.st.psiOut},
    {id:'psiIn',label:'ψ inside (ψs + ψp)',unit:'MPa',lvl:'ap',min:-2.6,max:0,d:2,get:s=>s.st.lysed?NaN:s.st.psiIn},
    {id:'psiP',label:'Turgor pressure ψp',unit:'MPa',lvl:'ap',min:0,max:1.5,d:2,get:s=>s.st.lysed?NaN:s.st.psiP}
  ],
  graphs:[{id:'vol',label:'Cell volume',lines:['vol']},{id:'flow',label:'Water flow',lvl:'honors',lines:['flow']},
          {id:'psi',label:'Water potential in vs. out',lvl:'ap',lines:['psiIn','psiOut'],yl:'Water potential (MPa)'}],
  defaultGraph:'vol',
  challenges:[
    {lvl:'bio',q:'A red blood cell goes from 0.9% salt water into pure water. What happens?',
     choices:['It shrinks','It swells and bursts','Nothing changes'],correct:1,
     baseline:{cell:'rbc',salt:0.9},change:{salt:0},changeText:'Moved into pure water',watch:'vol',
     explain:{bio:'The cell has more dissolved solute inside than pure water does, so water rushes in. A red blood cell has no wall to stop it, so it swells until the membrane tears. This is why IV drips use 0.9% saline, never pure water.',
              ap:'Pure water has ψ = 0, the cell about −0.74 MPa, so water flows in. With no wall, ψp stays 0, the gradient never closes, and the cell lyses near 150% volume.'}},
    {lvl:'bio',q:'A red blood cell is moved into 3% salt water. What happens?',
     choices:['It swells','It shrinks and wrinkles','It stays the same'],correct:1,
     baseline:{cell:'rbc',salt:0.9},change:{salt:3},changeText:'Moved into 3% salt water',watch:'vol',
     explain:{bio:'Now the outside has more dissolved salt than the inside, so water leaves the cell. The cell shrinks and its surface wrinkles into spikes (crenation). Drinking seawater dehydrates you for the same reason.'}},
    {lvl:'honors',q:'A plant cell goes from salt water into pure water. Does it burst like a red blood cell?',
     choices:['Yes, it bursts','No, it swells until the cell wall pushes back'],correct:1,
     baseline:{cell:'plant',salt:0.9},change:{salt:0},changeText:'Moved into pure water',watch:'vol',
     explain:{honors:'Water rushes in, but the stiff cellulose wall stops the cell from expanding much. The wall pushes back with turgor pressure, so the cell becomes firm (turgid). That firmness is what holds up a plant’s leaves and stems.',
              ap:'As V rises above the wall’s resting size, ψp climbs steeply (about 8 MPa per unit volume here). ψin reaches 0 at only about 108% volume, so net flow stops before the membrane is stressed.'}},
    {lvl:'honors',q:'With the aquaporins removed, a red blood cell is moved into slightly diluted salt water (0.6%). What happens?',
     choices:['Nothing, because water can’t cross without aquaporins','Water still moves in, but more slowly'],correct:1,
     baseline:{cell:'rbc',aqua:false,salt:0.9},change:{salt:0.6},changeText:'Moved into 0.6% salt water',watch:'vol',
     explain:{honors:'Water molecules are small enough to slip through the lipid bilayer itself, just slowly. Aquaporins are express lanes: they make osmosis about 6 times faster here, but they don’t change its direction or where it ends up.'}},
    {lvl:'honors',q:'A drug blocks the red blood cell’s Na⁺/K⁺ pump. What happens to the cell over time?',
     choices:['It slowly swells','It slowly shrinks','Nothing'],correct:0,
     baseline:{cell:'rbc',salt:0.9,pump:true},change:{pump:false},changeText:'Pump switched off',watch:'vol',
     explain:{honors:'Na⁺ constantly leaks into the cell. The pump uses ATP to throw it back out. With the pump stopped, Na⁺ builds up inside, water follows it in by osmosis, and the cell swells. Cells spend a large share of their ATP just to avoid this.'}},
    {lvl:'ap',q:'A turgid plant cell (ψ = 0 MPa) is moved into 0.9% salt water (ψ ≈ −0.76 MPa). Which way does water move?',
     choices:['Into the cell','Out of the cell','Neither way'],correct:1,
     baseline:{cell:'plant',salt:0},change:{salt:0.9},changeText:'Moved into 0.9% salt water',watch:'psi',
     explain:{ap:'Water always moves from higher (less negative) ψ to lower ψ. The cell starts at 0 MPa and the solution is at −0.76 MPa, so water leaves. ψp drops to 0 first, then the protoplast shrinks until ψs inside matches the outside.'}},
    {lvl:'ap',q:'You add more salt outside a red blood cell. What happens to the water potential of the outside solution?',
     choices:['It becomes more negative','It becomes less negative, closer to 0','It does not change'],correct:0,
     baseline:{cell:'rbc',salt:0.9},change:{salt:1.5},changeText:'Salt raised from 0.9% to 1.5%',watch:'psi',
     explain:{ap:'ψs = −iCRT. More solute means a larger C, so ψs (and ψ, since an open beaker has ψp = 0) becomes more negative. At 1.5% NaCl, C ≈ 0.26 M, so ψ ≈ −1.26 MPa.'}}
  ],
  narrate(sim){const p=sim.p,s=sim.st,plant=p.cell==='plant',hon=atLeast('honors');
    const slow=p.aqua?'':' Without aquaporins, water squeezes through the lipid bilayer slowly, so this takes much longer.';
    if(s.lysed)return '<b>The cell burst (lysis).</b> Water rushed in until the stretched membrane tore and the hemoglobin spilled out. A red blood cell has no wall to hold it together.';
    if(!p.pump&&hon&&s.flow>0.25)return '<b>The Na⁺/K⁺ pump is off.</b> Na⁺ leaks in and stays, water follows it, and the cell slowly swells.';
    if(plant&&s.psiP>0.05)return '<b>Turgid.</b> Water moved in, so the vacuole presses the membrane against the cell wall. The wall pushes back (turgor pressure), and the cell becomes firm instead of bursting.'+(s.flow>0.25?' Water is still entering.':'');
    if(plant&&s.V<0.9)return '<b>Plasmolysis.</b> Water left the cell, so the membrane pulled away from the wall. This is why plants wilt in salty soil.'+(s.flow<-0.25?' Water is still leaving.':'');
    if(s.flow>0.25)return 'Water is moving <b>into</b> the cell. There is more dissolved solute inside than outside, and water moves toward the side with more solute.'+slow;
    if(s.flow<-0.25)return 'Water is moving <b>out of</b> the cell. There is more dissolved salt outside than inside, so water leaves and the cell shrinks.'+slow;
    if(!plant&&s.V<0.9)return 'The cell lost water and its surface wrinkled into spikes (crenation). Inside and outside now balance, so it stays this size.';
    if(plant&&s.V<1&&s.V>=0.9)return 'Inside and outside balance, but the cell is <b>flaccid</b>: not enough water to press on the wall. A plant in this state droops.';
    return 'Water molecules cross the membrane in both directions at the same rate, so there is <b>no net movement</b> and the cell keeps its size.';},
  tour:[
    {title:'Meet the cell',text:'A red blood cell floats in salt water as salty as blood (0.9%). Its membrane lets water cross but keeps salt and other dissolved particles in place.',focus:[120,105,240,255],speed:0.5},
    {title:'Zoom in on the membrane',text:'Here is a tiny patch of the membrane. Water molecules (blue) slip through aquaporin channels. Salt particles (purple) bounce off: they can’t get through.',focus:[493,15,300,420],speed:0.25},
    {title:'Pure water outside',text:'Now the salt outside is replaced by pure water. More water molecules are free to move on the outside, so more cross in than out.',focus:[493,15,300,420],speed:0.25,setup(sim){BioLab.setValues(sim,{salt:0});}},
    {title:'The cell swells and bursts',text:'Water keeps pouring in. A red blood cell has no wall, so it swells into a sphere and then tears open (lysis).',focus:[60,40,370,380],speed:1},
    {title:'Salty water',text:'A fresh cell goes into 3% salt water. Now there is more solute outside, so water leaves. The cell shrinks and wrinkles (crenation).',focus:[60,40,370,380],speed:1,setup(sim){BioLab.setValues(sim,{salt:3});BioLab.reset(sim);BioLab.setValues(sim,{salt:3});}},
    {lvl:'honors',title:'A plant cell in pure water',text:'A plant cell in pure water also takes in water, but its stiff cell wall pushes back. The cell becomes firm (turgid) instead of bursting.',focus:[60,40,370,380],speed:1,setup(sim){BioLab.setValues(sim,{cell:'plant',salt:0.9});BioLab.reset(sim);BioLab.setValues(sim,{salt:0});}},
    {lvl:'honors',title:'A plant cell in salt water',text:'In 3% salt water the plant cell loses water. The membrane and cytoplasm pull away from the wall (plasmolysis). This is wilting at the cellular level.',focus:[60,40,370,380],speed:1,setup(sim){BioLab.setValues(sim,{salt:3});}},
    {lvl:'ap',title:'Water potential',text:'Water moves from higher ψ to lower ψ. Pure water is 0 MPa, solutes lower ψ (ψs = −iCRT), and wall pressure raises it (ψp). Watch the ψ readouts below: flow stops when ψ inside equals ψ outside.',focus:[0,0,480,60],pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{cell:'rbc',salt:0.9});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> At what salt concentration does a red blood cell burst?</p><ol><li>Set the salt outside to 0.9% and record a trial.</li><li>Press Reset, then try 0.7, 0.6, 0.5, 0.4 and 0.3%. Wait until the volume stops changing, then record each trial.</li><li>Plot salt outside (x) against cell volume (y).</li></ol><p>Write a claim: what is the lowest salt concentration a red blood cell can survive? Use your data.</p>',
       honors:'<p><b>Question:</b> How do red blood cells and plant cells respond differently to the same solutions?</p><ol><li>For each cell type, record trials at 0, 0.5, 0.9, 1.5 and 3% salt (Reset before each).</li><li>Plot salt (x) against volume (y) for both.</li></ol><p>Explain the difference at 0% using the words cell wall, turgor and lysis.</p>',
       ap:'<p><b>Question:</b> What is the solute potential of this plant cell? (This is the classic potato-core lab.)</p><ol><li>Choose Plant cell and set solutes inside to 400 mOsm/L.</li><li>Record the equilibrium volume at outside salt concentrations from 0 to 2%.</li><li>Plot ψ outside (x) against volume (y), and find where the volume starts dropping below 100%.</li></ol><p><b>Claim–evidence–reasoning:</b> Estimate the cell’s ψs from your graph, and explain why volume barely changes above 0 MPa.</p>'},
  terms:[{t:'Osmosis',d:'Diffusion of water across a membrane toward the side with more dissolved solute.'},{t:'Hypotonic / hypertonic / isotonic',d:'Less, more, or the same solute outside compared with inside the cell.'},{t:'Lysis',d:'A cell bursting after taking in too much water.'},{t:'Selectively permeable',d:'A membrane that lets some things through (water) but not others (salt ions).'},
    {lvl:'honors',t:'Aquaporin',d:'A protein channel that lets water cross the membrane quickly.'},{lvl:'honors',t:'Turgor pressure',d:'The pressure of a full vacuole pushing the membrane against the cell wall.'},{lvl:'honors',t:'Plasmolysis',d:'The membrane pulling away from the cell wall as a plant cell loses water.'},{lvl:'honors',t:'Na⁺/K⁺ pump',d:'Active transport: uses ATP to move 3 Na⁺ out and 2 K⁺ in.'},
    {lvl:'ap',t:'Water potential (ψ)',d:'ψ = ψs + ψp, in MPa. Water flows from higher ψ to lower ψ.'},{lvl:'ap',t:'Solute potential (ψs)',d:'ψs = −iCRT. Always ≤ 0; more solute makes it more negative.'}],
  about:'<p>Water flow is proportional to the water-potential difference: dV/dt = k·(ψout − ψin), with k six times larger when aquaporins are present. Solute potential uses ψs = −iCRT at 22 °C, with 1% NaCl counted as 342 mOsm/L (i = 2).</p><p>Inside osmolarity follows the Boyle–van ’t Hoff relation: the dissolved particles stay in the cell while its water volume changes. 40% of a red blood cell’s volume (mostly hemoglobin) and 10% of a plant cell’s cannot change. A red blood cell bursts above 150% of its normal volume (around 0.48% NaCl, close to the real value). The plant wall resists stretching with an elastic modulus of 8 MPa.</p><p>Simplifications: real osmotic changes in red blood cells take seconds, and plant plasmolysis takes minutes. The pump-off swelling is sped up from hours to seconds. Membrane surface area is treated as constant.</p>',
  initVis(sim){const r=rng(21),v=sim.vis;v.salt=[];for(let i=0;i<90;i++)v.salt.push([10+r()*460,70+r()*370,r()*6.28,r()<.5]);
    v.inner=[];for(let i=0;i<40;i++){const a=r()*6.283,d=Math.sqrt(r());v.inner.push([Math.cos(a)*d,Math.sin(a)*d,r()*6.28]);}
    const half=(x0,x1,n)=>{const a=[];for(let i=0;i<n;i++)a.push({x:x0+r()*(x1-x0),y:60+r()*350,vx:0,vy:0});return a;};
    v.wL=half(505,630,26);v.wR=half(670,782,26);v.sL=half(505,630,30);v.sR=half(670,782,30);v.cross=[];v.inAcc=0;v.outAcc=0;v.pumpAcc=0;v.ions=[];v.frag=null;},
  draw(sim,ctx,vdt,k,t){
    const p=sim.p,s=sim.st,v=sim.vis,hon=atLeast('honors'),ap=atLeast('ap'),plant=p.cell==='plant',R=Math.random;
    // ---- left: the cell in its solution
    ctx.fillStyle=PAL['cv-water'];ctx.fillRect(0,0,484,450);
    const nSalt=Math.round(p.salt/3*90);
    for(let i=0;i<nSalt;i++){const q=v.salt[i],j=RM?0:1.5;ctx.fillStyle=q[3]?PAL['cv-inn']:PAL['s3'];ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(q[0]+Math.sin(t*1.3+q[2])*j,q[1]+Math.cos(t+q[2])*j,2.6,0,6.29);ctx.fill();}
    ctx.globalAlpha=1;
    txt(ctx,'Outside: '+p.salt.toFixed(2)+'% salt'+(p.salt===0?' (pure water)':''),14,26,{s:14*k,w:700});
    txt(ctx,(plant?'Plant cell, about 50 µm across':'Red blood cell, about 8 µm across'),14,46,{s:12*k,c:PAL['cv-soft']});
    // water arrows
    const fl=s.flow;if(!s.lysed&&Math.abs(fl)>0.25){const n=8,len=clamp(Math.abs(fl)*3,10,34),R0=plant?(s.V>=1?135:120):80*Math.sqrt(s.V)+24;
      ctx.strokeStyle=PAL['s2'];ctx.fillStyle=PAL['s2'];ctx.lineWidth=3;
      for(let i=0;i<n;i++){const a=i/n*6.283+0.2,dir=fl>0?-1:1,bob=RM?0:((t*0.8+i*0.13)%1)*8*dir;
        const r1=R0+(fl>0?len:0)+bob,r2=R0+(fl>0?0:len)+bob;const x1=CX+Math.cos(a)*r1*(plant?1.25:1),y1=CY+Math.sin(a)*r1*(plant?0.85:1),x2=CX+Math.cos(a)*r2*(plant?1.25:1),y2=CY+Math.sin(a)*r2*(plant?0.85:1);
        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();const ang=Math.atan2(y2-y1,x2-x1);
        ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-Math.cos(ang-.5)*8,y2-Math.sin(ang-.5)*8);ctx.lineTo(x2-Math.cos(ang+.5)*8,y2-Math.sin(ang+.5)*8);ctx.closePath();ctx.fill();}}
    let state='';
    if(!plant){
      if(s.lysed){const age=s.lysedT,Rl=80*Math.sqrt(LYSE);
        const g=ctx.createRadialGradient(CX,CY,10,CX,CY,Rl+age*25);g.addColorStop(0,'rgba(200,40,50,'+clamp(.35-age*.01,.1,.35)+')');g.addColorStop(1,'rgba(200,40,50,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(CX,CY,Rl+age*25,0,6.29);ctx.fill();
        ctx.strokeStyle='#b02a35';ctx.lineWidth=3;ctx.setLineDash([22,14]);ctx.beginPath();ctx.arc(CX,CY,Rl+Math.min(age,4)*3,0.4,5.9);ctx.stroke();ctx.setLineDash([]);
        state='Burst (lysis)';}
      else{const V=s.V,Rc=80*Math.sqrt(V),spikes=clamp((0.9-V)*45,0,13);
        ctx.beginPath();const N=72;for(let i=0;i<=N;i++){const a=i/N*6.283,bump=spikes>0?spikes*Math.pow(Math.max(0,Math.cos(a*14)),3):0,rad=Rc-spikes*0.5+bump;const x=CX+Math.cos(a)*rad,y=CY+Math.sin(a)*rad;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
        ctx.closePath();ctx.fillStyle='#c8323c';ctx.fill();ctx.strokeStyle='#8f1d25';ctx.lineWidth=3;ctx.stroke();
        const pale=clamp((1.35-V)/0.4,0,1);if(pale>0){ctx.fillStyle='rgba(235,120,128,'+(0.85*pale)+')';ctx.beginPath();ctx.ellipse(CX,CY,Rc*0.42*pale+4,Rc*0.36*pale+3,0,0,6.29);ctx.fill();}
        const nIn=Math.round(clamp(s.Ci/18,0,40));ctx.fillStyle='#ffd6da';for(let i=0;i<nIn;i++){const q=v.inner[i];ctx.beginPath();ctx.arc(CX+q[0]*Rc*0.78+(RM?0:Math.sin(t+q[2])),CY+q[1]*Rc*0.78,2.4,0,6.29);ctx.fill();}
        state=V>1.25?'Swollen':V<0.9?'Shrunken (crenated)':'Normal';}
      txt(ctx,'Red blood cell',CX,CY+(s.lysed?140:80*Math.sqrt(s.V)+30),{s:13*k,w:700,a:'center'});}
    else{const W=230,H=165,x0=CX-W/2,y0=CY-H/2,f=s.V>=1?1:Math.sqrt(s.V),pw=(W-18)*f,ph=(H-18)*f,rad=10+(1-f)*70;
      ctx.fillStyle='#d8ecc0';rr(ctx,CX-pw/2,CY-ph/2,pw,ph,rad);ctx.fill();ctx.strokeStyle='#3d7a2a';ctx.lineWidth=2;ctx.stroke();
      const vw=pw-34,vh=ph-30;if(vw>10&&vh>10){ctx.fillStyle='#bfe0f2';rr(ctx,CX-vw/2,CY-vh/2,vw,vh,Math.max(6,rad-12));ctx.fill();ctx.strokeStyle='#6f9fb8';ctx.lineWidth=1.5;ctx.stroke();
        const nIn=Math.round(clamp(s.Ci/18,0,40));ctx.fillStyle='#6f7fd8';for(let i=0;i<nIn;i++){const q=v.inner[i];ctx.beginPath();ctx.arc(CX+q[0]*vw*0.45,CY+q[1]*vh*0.42,2.2,0,6.29);ctx.fill();}}
      ctx.fillStyle='#2f8a3a';for(let i=0;i<10;i++){const a=i/10*6.283+(RM?0:t*0.15);const ex=CX+Math.cos(a)*(pw/2-9),ey=CY+Math.sin(a)*(ph/2-8);ctx.beginPath();ctx.ellipse(ex,ey,6,3.4,a+1.57,0,6.29);ctx.fill();}
      ctx.strokeStyle='#6b9b3a';ctx.lineWidth=9;rr(ctx,x0,y0,W,H,12);ctx.stroke();
      if(s.psiP>0.05){ctx.strokeStyle=PAL['s4'];ctx.fillStyle=PAL['s4'];ctx.lineWidth=2.5;[[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const x1=CX+d[0]*(W/2-38),y1=CY+d[1]*(H/2-34),x2=CX+d[0]*(W/2-14),y2=CY+d[1]*(H/2-12);
        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.beginPath();ctx.arc(x2,y2,3.5,0,6.29);ctx.fill();});}
      state=s.psiP>0.05?'Turgid (firm)':s.V<0.9?'Plasmolyzed':'Flaccid (limp)';
      txt(ctx,'Cell wall',x0+W+8,y0+14,{s:12*k,c:PAL['cv-soft']});
      txt(ctx,'Plant cell',CX,y0+H+30,{s:13*k,w:700,a:'center'});}
    pill(ctx,state,CX,plant?CY-118:CY-(s.lysed?140:80*Math.sqrt(s.V)+26),PAL['card'],PAL['cv-ink'],12*k);
    // ---- right: zoom on the membrane
    const X0=493,Y0=15,MX=650;
    ctx.fillStyle=PAL['cv-bg2'];rr(ctx,X0,Y0,300,420,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
    txt(ctx,'Zoom: the membrane',X0+150,Y0+22,{s:13*k,w:700,a:'center'});
    txt(ctx,'Outside',X0+12,Y0+46,{s:12*k,w:700,c:PAL['cv-soft']});txt(ctx,'Inside',X0+288,Y0+46,{s:12*k,w:700,c:PAL['cv-soft'],a:'right'});
    // bilayer
    ctx.strokeStyle=PAL['cv-head'];ctx.globalAlpha=.6;ctx.lineWidth=1.3;ctx.beginPath();for(let y=64;y<396;y+=10){ctx.moveTo(MX-6,y);ctx.lineTo(MX-1,y);ctx.moveTo(MX+1,y);ctx.lineTo(MX+6,y);}ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle=PAL['cv-head'];for(let y=64;y<396;y+=10){ctx.beginPath();ctx.arc(MX-9,y,4,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(MX+9,y,4,0,6.29);ctx.fill();}
    const chY=[135,325];
    if(p.aqua)chY.forEach(y=>{ctx.fillStyle='#3f6fb0';rr(ctx,MX-17,y-24,12,48,5);ctx.fill();rr(ctx,MX+5,y-24,12,48,5);ctx.fill();});
    const pumpOn=hon&&p.pump;if(hon){ctx.fillStyle=p.pump?'#7a4fa6':'#8a8a92';rr(ctx,MX-16,206,32,40,8);ctx.fill();txt(ctx,'pump',MX,262,{s:11*k,w:700,a:'center',c:PAL['cv-soft']});}
    // particle populations
    const Co=p.salt*OSM_PER_PCT,Ci=s.lysed?Co:s.Ci;
    const moveP=(a,x0,x1)=>{a.vx+=(R()-.5)*500*vdt;a.vy+=(R()-.5)*500*vdt;const sp=Math.hypot(a.vx,a.vy);if(sp>45){a.vx*=45/sp;a.vy*=45/sp;}a.x+=a.vx*vdt;a.y+=a.vy*vdt;
      if(a.x<x0||a.x>x1)a.vx*=-1;if(a.y<62||a.y>392)a.vy*=-1;a.x=clamp(a.x,x0,x1);a.y=clamp(a.y,62,392);};
    const nSL=Math.round(clamp(Co/36,0,30)),nSR=Math.round(clamp(Ci/36,0,30));
    v.wL.forEach(a=>{moveP(a,503,628);});v.wR.forEach(a=>{moveP(a,672,783);});
    v.sL.slice(0,nSL).forEach(a=>moveP(a,503,628));v.sR.slice(0,nSR).forEach(a=>moveP(a,672,783));
    const dot=(a,c,r)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(a.x,a.y,r,0,6.29);ctx.fill();};
    // water fewer where more solute (diluted)
    const nWL=Math.round(26*(1-clamp(Co/1400,0,.6))),nWR=Math.round(26*(1-clamp(Ci/1400,0,.6)));
    v.wL.slice(0,nWL).forEach(a=>dot(a,PAL['s2'],3.4));v.wR.slice(0,nWR).forEach(a=>dot(a,PAL['s2'],3.4));
    v.sL.slice(0,nSL).forEach(a=>dot(a,PAL['cv-inn'],5.5));v.sR.slice(0,nSR).forEach(a=>dot(a,PAL['cv-inn'],5.5));
    // crossing water molecules
    const base=p.aqua?1.8:0.3,net=clamp(s.flow/4,-3,3);
    v.inAcc+=base*(1+Math.max(0,net))*vdt;v.outAcc+=base*(1+Math.max(0,-net))*vdt;
    const spawn=dir=>{const y=p.aqua?chY[R()<.5?0:1]+(R()-.5)*16:70+R()*320;v.cross.push({x:dir>0?MX-38:MX+38,y,dir});};
    while(v.inAcc>=1){v.inAcc--;spawn(1);}while(v.outAcc>=1){v.outAcc--;spawn(-1);}
    v.cross.forEach(c=>{c.x+=c.dir*(p.aqua?38:16)*vdt;dot(c,PAL['s2'],3.6);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;ctx.stroke();});
    v.cross=v.cross.filter(c=>Math.abs(c.x-MX)<40);if(v.cross.length>40)v.cross.splice(0,v.cross.length-40);
    if(pumpOn){v.pumpAcc+=vdt*0.8;if(v.pumpAcc>=1){v.pumpAcc--;for(let i=0;i<3;i++)v.ions.push({x:MX+14,y:216+i*10,dir:-1,c:PAL['cv-inn'],life:1.6,lab:i===0?'Na⁺':''});for(let i=0;i<2;i++)v.ions.push({x:MX-14,y:221+i*10,dir:1,c:PAL['s3'],life:1.6,lab:i===0?'K⁺':''});v.ions.push({x:MX+22,y:276,dir:0,atp:true,life:1.4});}
      v.ions.forEach(o=>{o.life-=vdt;o.x+=o.dir*30*vdt;ctx.globalAlpha=clamp(o.life,0,1);if(o.atp)txt(ctx,'ATP → ADP',o.x,o.y,{s:11*k,w:700,c:PAL['cv-atp']});else{dot(o,o.c,4.2);if(o.lab&&Math.abs(o.x-MX)>22)txt(ctx,o.lab,o.x,o.y-8,{s:11*k,w:700,a:'center',c:PAL['cv-ink']});}});
      ctx.globalAlpha=1;v.ions=v.ions.filter(o=>o.life>0);}
    // legend
    const ly=Y0+406;dot({x:X0+16,y:ly-4},PAL['s2'],3.4);txt(ctx,'water',X0+24,ly,{s:11.5*k,c:PAL['cv-soft']});
    dot({x:X0+80,y:ly-4},PAL['cv-inn'],5);txt(ctx,'solute',X0+90,ly,{s:11.5*k,c:PAL['cv-soft']});
    if(p.aqua){ctx.fillStyle='#3f6fb0';ctx.fillRect(X0+150,ly-10,8,12);txt(ctx,'aquaporin',X0+163,ly,{s:11.5*k,c:PAL['cv-soft']});}
  }
};
BioLab.register(TR);
})();
