(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;
/* Epinephrine → GPCR → Gs → adenylyl cyclase → cAMP → PKA → phosphorylase kinase → glycogen phosphorylase → glucose.
   Each step is a first-order activation/deactivation ODE. */
const NREC=5000;              // β2-adrenergic receptors per liver cell (order of magnitude)
const GMAX=25;                // million glucose molecules per second at full glycogen phosphorylase activity
const UNITS=[70,250,430];     // x of each receptor / G protein / adenylyl cyclase unit
const ROWS={pka:{y:282,n:4,x0:150,dx:110},phk:{y:340,n:8,x0:95,dx:62},gp:{y:398,n:16,x0:40,dx:36}};
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
    {id:'epi',label:'Epinephrine in the blood',type:'range',min:0,max:10,step:0.1,def:1,unit:' nM',lvl:'bio',help:'Adrenaline. Your adrenal glands release it when you are startled.'},
    {id:'caf',label:'Caffeine',help:'Blocks phosphodiesterase, the enzyme that breaks down cAMP',type:'toggle',def:false,lvl:'honors'},
    {id:'blk',label:'Beta blocker',help:'Sits on the receptor without activating it',type:'toggle',def:false,lvl:'honors'},
    {id:'tox',label:'Cholera-like toxin',help:'Locks the G protein in its “on” state',type:'toggle',def:false,lvl:'ap'},
    {id:'ph',label:'Phosphatase activity',type:'range',min:0.2,max:3,step:0.1,def:1,unit:'×',lvl:'ap',help:'Enzymes that remove phosphates and switch kinases off'}
  ],
  init(){return {R:0,G:0,C:0.1,PKA:0,K:0,P:0,glu:0,tot:0};},
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
    s.glu=GMAX*s.P;s.tot+=s.glu*dt;},
  afterPrewarm(sim){sim.st.tot=0;},
  metrics:[
    {id:'occ',label:'Receptors with hormone',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>s.st.R*100},
    {id:'gact',label:'G proteins switched on',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>s.st.G*100},
    {id:'camp',label:'cAMP',unit:'µM',lvl:'honors',min:0,max:20,d:1,get:s=>s.st.C},
    {id:'pka',label:'Protein kinase A active',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>s.st.PKA*100},
    {id:'gp',label:'Glycogen phosphorylase active',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>s.st.P*100},
    {id:'glu',label:'Glucose released',unit:'million/s',lvl:'bio',min:0,max:25,d:1,get:s=>s.st.glu},
    {id:'amp',label:'Amplification (glucose/s per bound hormone)',unit:'',lvl:'ap',min:0,max:20000,d:0,get:s=>{const b=s.st.R*NREC;return b>=5?s.st.glu*1e6/b:NaN;}}
  ],
  graphs:[
    {id:'glu',label:'Glucose released',lvl:'bio',lines:['glu']},
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
  initVis(sim){const r=rng(21),v=sim.vis;v.hor=[];v.cmp=[];v.glu=[];v.ranks=[0.15,0.5,0.85].sort(()=>r()-.5);v.rr=[r(),r(),r()];
    v.gl=[];for(let i=0;i<46;i++){const a=r()*6.28,d=Math.sqrt(r())*62;v.gl.push([712+Math.cos(a)*d,355+Math.sin(a)*d*0.95]);}v.gAcc=0;},
  draw(sim,ctx,vdt,k,t){
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
    // receptor / G protein / adenylyl cyclase units
    const blkFrac=p.blk?9/(10+p.epi):0;
    UNITS.forEach((x,i)=>{const bound=v.ranks[i]<s.R,blocked=!bound&&p.blk&&v.ranks[i]<s.R+blkFrac;
      // receptor: 7 helices
      ctx.fillStyle=bound?'#2f6fb5':'#5a7397';for(let j=0;j<7;j++)rr(ctx,x-24+j*7,90+(j%2)*3,6,48,3),ctx.fill();
      if(bound){ctx.fillStyle='#e08a00';ctx.beginPath();ctx.moveTo(x,74);ctx.lineTo(x+6,82);ctx.lineTo(x,90);ctx.lineTo(x-6,82);ctx.closePath();ctx.fill();}
      if(blocked){ctx.fillStyle='#7b3fe4';rr(ctx,x-8,72,16,16,3);ctx.fill();}
      // G protein: alpha + beta-gamma; alpha slides toward cyclase when active
      const ga=p.tox?1:clamp(s.G*(bound?1.4:0.7),0,1),ax=x+38+ga*28;
      ctx.fillStyle='#8a8f99';ctx.beginPath();ctx.ellipse(x+32,150,11,9,0,0,6.29);ctx.fill();
      ctx.fillStyle=ga>0.4?'#2a9d6a':'#7aa58f';ctx.beginPath();ctx.ellipse(ax,148,12,10,0,0,6.29);ctx.fill();
      if(ga>0.4)txt(ctx,'GTP',ax,149,{s:9*k,w:700,c:'#fff',a:'center',b:'middle'});
      // adenylyl cyclase
      ctx.fillStyle=ga>0.4?'#b0552d':'#9a7666';rr(ctx,x+80,92,34,48,8);ctx.fill();rr(ctx,x+76,138,42,22,8);ctx.fill();
      if(hon){txt(ctx,i===0?'Receptor':'',x,64,{s:11*k,w:700,a:'center',c:PAL['cv-soft']});}
    });
    const lab=(s_,x,y)=>txt(ctx,s_,x,y,{s:12*k,w:700,c:PAL['cv-ink']});
    if(hon&&k<1.3){txt(ctx,'G protein',90,178,{s:11*k,w:600,c:PAL['cv-soft'],a:'center'});txt(ctx,'Adenylyl cyclase',167,178,{s:11*k,w:600,c:PAL['cv-soft'],a:'center'});}
    else if(hon){txt(ctx,'G protein → cyclase',128,178,{s:11*k,w:600,c:PAL['cv-soft'],a:'center'});}
    else{txt(ctx,'Receptor',70,64,{s:11*k,w:700,a:'center',c:PAL['cv-soft']});txt(ctx,'Relay proteins',130,178,{s:11*k,w:600,c:PAL['cv-soft'],a:'center'});}
    // cAMP cloud
    const nC=Math.round(clamp(s.C*5,0,80));
    while(v.cmp.length<nC){const u=UNITS[Math.floor(R()*3)];v.cmp.push({x:u+97+R()*10-5,y:166,vx:R()*40-20,vy:20+R()*20,a:0});}
    if(v.cmp.length>nC){for(let i=nC;i<v.cmp.length;i++)v.cmp[i].dying=true;}
    for(const c of v.cmp){c.vx+=(R()-.5)*300*vdt;c.vy+=(R()-.5)*300*vdt;const sp=Math.hypot(c.vx,c.vy);if(sp>45){c.vx*=45/sp;c.vy*=45/sp;}c.x+=c.vx*vdt*jit;c.y+=c.vy*vdt*jit;
      if(c.x<20||c.x>600)c.vx*=-1;if(c.y<165||c.y>245)c.vy*=-1;c.x=clamp(c.x,20,600);c.y=clamp(c.y,165,245);
      c.a=c.dying?c.a-vdt*2:Math.min(1,c.a+vdt*3);ctx.globalAlpha=clamp(c.a,0,1);ctx.fillStyle='#1f9d55';
      ctx.beginPath();for(let j=0;j<6;j++){const an=j*Math.PI/3;ctx[j?'lineTo':'moveTo'](c.x+Math.cos(an)*4.5,c.y+Math.sin(an)*4.5);}ctx.closePath();ctx.fill();}
    ctx.globalAlpha=1;v.cmp=v.cmp.filter(c=>!(c.dying&&c.a<=0));
    // phosphodiesterase (PDE) breaking down cAMP
    [[470,200],[540,232],[400,238]].forEach((q,i)=>{ctx.fillStyle=p.caf?'#9a9aa2':'#6d6d78';ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.arc(q[0],q[1],10,0.6+Math.sin(t*4+i)*(p.caf?0:0.3),5.7);ctx.closePath();ctx.fill();
      if(p.caf){ctx.fillStyle='#7a4a24';ctx.beginPath();ctx.arc(q[0]+8,q[1],4.5,0,6.29);ctx.fill();}});
    if(hon)txt(ctx,p.caf?'Phosphodiesterase (blocked by caffeine)':'Phosphodiesterase breaks down cAMP',598,262,{s:11*k,c:PAL['cv-soft'],a:'right'});
    txt(ctx,hon?'cAMP (second messenger)':'Messenger molecules',598,184,{s:12*k,w:700,c:PAL['cv-ink'],a:'right'});
    // kinase rows with fan-out amplification
    const rows=[['pka',s.PKA,hon?'Protein kinase A':'Relay kinase 1','#3f6fb0'],['phk',s.K,hon?'Phosphorylase kinase':'Relay kinase 2','#7a4fa6'],['gp',s.P,hon?'Glycogen phosphorylase':'Sugar-releasing enzyme','#2a8276']];
    rows.forEach((row,ri)=>{const g=ROWS[row[0]],act=row[1]*g.n;
      lab(row[2],20,g.y-20);
      if(ri<2){const nxt=ROWS[rows[ri+1][0]],na=rows[ri+1][1]*nxt.n;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.globalAlpha=.45;
        for(let i=0;i<g.n;i++){if(i>=act)continue;const per=nxt.n/g.n;for(let j=0;j<per;j++){const jj=Math.floor(i*per+j);if(jj>=na+0.5)continue;const tx=nxt.x0+jj*nxt.dx;ctx.beginPath();ctx.moveTo(g.x0+i*g.dx,g.y+10);ctx.lineTo(tx,nxt.y-10);ctx.stroke();}}ctx.globalAlpha=1;}
      for(let i=0;i<g.n;i++){const x=g.x0+i*g.dx,on=clamp(act-i,0,1);
        ctx.globalAlpha=0.35+0.65*on;ctx.fillStyle=row[3];rr(ctx,x-12,g.y-9,24,18,7);ctx.fill();ctx.globalAlpha=1;
        if(on>0.5){ctx.fillStyle='#f2b705';ctx.beginPath();ctx.arc(x+10,g.y-8,5.5,0,6.29);ctx.fill();txt(ctx,'P',x+10,g.y-7.5,{s:8*k,w:800,c:'#3a2c00',a:'center',b:'middle'});}}});
    // glycogen granule and glucose release
    ctx.fillStyle='#c9a227';for(const q of v.gl){ctx.beginPath();ctx.arc(q[0],q[1],5,0,6.29);ctx.fill();}
    txt(ctx,hon?'Glycogen (stored glucose)':'Stored sugar (glycogen)',792,438,{s:11.5*k,w:600,a:'right',c:PAL['cv-soft']});
    // GLUT2 transporter
    ctx.fillStyle='#6a8796';rr(ctx,734,94,24,42,6);ctx.fill();
    v.gAcc+=s.glu*0.28*vdt;while(v.gAcc>=1){v.gAcc--;const q=v.gl[Math.floor(R()*v.gl.length)];v.glu.push({x:q[0],y:q[1],ph:0});}
    for(const g of v.glu){if(g.ph===0){g.x+=(746-g.x)*Math.min(1,vdt*1.6);g.y+=(150-g.y)*Math.min(1,vdt*1.6);if(Math.abs(g.y-150)<6)g.ph=1;}
      else{g.y-=60*vdt;g.x+=(R()-.5)*30*vdt+15*vdt;}
      ctx.fillStyle='#e0b800';ctx.strokeStyle='#7a5a00';ctx.lineWidth=1;ctx.beginPath();for(let j=0;j<6;j++){const an=j*Math.PI/3+0.5;ctx[j?'lineTo':'moveTo'](g.x+Math.cos(an)*5,g.y+Math.sin(an)*5);}ctx.closePath();ctx.fill();ctx.stroke();}
    v.glu=v.glu.filter(g=>g.y>-6);if(v.glu.length>120)v.glu.splice(0,v.glu.length-120);
    if(p.tox)pill(ctx,'Toxin: G protein stuck on',160,40,'#b3261e','#fff',11*k);
    if(p.blk)pill(ctx,'Beta blocker',330,40,'#6a32d0','#fff',11*k);
    // legend
    let lx=330;const ly=443;
    ctx.fillStyle='#e08a00';ctx.beginPath();ctx.moveTo(lx,ly-10);ctx.lineTo(lx+5,ly-4);ctx.lineTo(lx,ly+2);ctx.lineTo(lx-5,ly-4);ctx.closePath();ctx.fill();txt(ctx,'epinephrine',lx+9,ly,{s:11*k,c:PAL['cv-soft']});
  },
  narrate(sim){const p=sim.p,s=sim.st,hon=atLeast('honors'),g=s.glu.toFixed(1);
    if(p.tox)return '<b>The toxin has locked the G proteins “on”.</b> Adenylyl cyclase keeps making cAMP whether or not any hormone is bound, so the cell releases '+g+' million glucose per second with no signal at all.';
    if(p.epi<0.05&&s.glu>0.5)return '<b>The hormone is gone, so the signal is shutting off.</b> '+(hon?'Phosphodiesterase breaks down cAMP and phosphatases remove phosphates from the kinases.':'Each relay protein switches itself back off.')+' Glucose release is falling.';
    if(p.epi<0.05)return 'No epinephrine, so the receptors are empty and the cell is quiet. Glucose stays stored as glycogen.';
    if(p.blk)return '<b>The beta blocker occupies most receptors without switching them on.</b> Little hormone can bind, so the whole chain stays weak: '+g+' million glucose per second.';
    if(p.caf&&hon)return '<b>Caffeine is blocking phosphodiesterase</b>, so cAMP builds up to '+s.C.toFixed(1)+' µM instead of being broken down. The signal is stronger and lasts longer.';
    if(atLeast('ap')&&p.ph>1.5)return '<b>Phosphatases are working hard</b>, pulling phosphates off the kinases almost as fast as they are added, so the response is damped.';
    return 'Epinephrine has bound '+Math.round(s.R*100)+'% of the receptors. Each '+(hon?'active receptor switches on many G proteins, each cyclase makes many cAMP, and each kinase activates many more enzymes':'switched-on protein turns on many of the next')+'. The result: <b>'+g+' million glucose released per second</b>.';},
  tour:[
    {title:'The hormone stays outside',text:'Epinephrine (orange diamonds) travels in the blood. It cannot cross the cell membrane, so the message has to be passed in from the outside.',focus:[0,0,800,96],speed:0.5},
    {title:'The receptor changes shape',text:{bio:'When epinephrine fits into the receptor on the outside, the receptor changes shape on the inside. That shape change is the message.',honors:'Epinephrine binds a G-protein-coupled receptor, which snakes back and forth across the membrane seven times. Binding changes its shape on the cytoplasm side.'},focus:[36,60,74,84],speed:0.25},
    {title:'G protein to adenylyl cyclase',text:{bio:'The receptor switches on a relay protein, which slides over and switches on an enzyme in the membrane.',honors:'The active receptor makes the G protein swap GDP for GTP. The GTP-bound α subunit slides to adenylyl cyclase and switches it on.'},focus:[90,86,130,104],speed:0.1},
    {title:'cAMP spreads the message',text:{bio:'That enzyme pumps out many small messenger molecules (green), which spread through the cell.',honors:'Adenylyl cyclase converts ATP into cAMP, the second messenger. Each cyclase makes many cAMP molecules: the first big amplification.'},focus:[10,140,600,112],speed:0.25},
    {title:'The kinase cascade fans out',text:{bio:'Each messenger switches on relay kinases, and each kinase switches on many more. Count the rows: 4, then 8, then 16, and in a real cell, many thousands.',honors:'cAMP activates protein kinase A. PKA phosphorylates many phosphorylase kinases, and each of those phosphorylates many glycogen phosphorylases. The yellow P marks an added phosphate.'},focus:[10,250,600,170],speed:0.25},
    {title:'Glycogen becomes glucose',text:'The last enzyme snips glucose off stored glycogen. The glucose leaves through a transporter and enters the blood, fuel for running away.',focus:[630,88,170,362],speed:0.5},
    {title:'Switching it off',text:{bio:'Now the hormone is removed. Every relay protein switches itself off within seconds, so the sugar release stops.',honors:'With no hormone, the G protein hydrolyzes its GTP, phosphodiesterase breaks down cAMP, and phosphatases remove the phosphates. The whole pathway resets.'},focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{epi:0});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{epi:1});},
  lab:{bio:'<p><b>Question:</b> How does the amount of epinephrine affect glucose release?</p><ol><li>Record glucose released at epinephrine 0, 0.1, 0.25, 0.5, 1, 2, 5 and 10 nM. Wait about 10 seconds after each change.</li><li>Plot epinephrine (x) against glucose released (y).</li></ol><p>Describe the shape of your graph. Why does adding more hormone eventually stop helping?</p>',
       honors:'<p><b>Question:</b> How do caffeine and beta blockers change the response?</p><ol><li>At 1 nM epinephrine, record a baseline, then a caffeine trial, then a beta-blocker trial (switch the first one off before the next).</li><li>Compare cAMP and glucose released.</li></ol><p>Explain each result by naming the exact step of the pathway the drug acts on.</p>',
       ap:'<p><b>Question:</b> Where in the pathway does the signal get amplified, and where can it be controlled?</p><ol><li>Record every readout at 0.2, 1 and 5 nM epinephrine.</li><li>Repeat at 1 nM with phosphatase at 0.5× and 3×, then with the toxin on and no hormone.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why a cell needs both kinases and phosphatases, and why a G protein that cannot switch off causes disease.</p>'},
  terms:[{t:'Ligand',d:'A signal molecule that binds a receptor. Here, epinephrine.'},{t:'Receptor',d:'A protein that a signal binds to. It changes shape when the signal binds.'},{t:'Signal transduction',d:'Turning an outside signal into a response inside the cell.'},{t:'Amplification',d:'Each step activates many copies of the next, so a small signal causes a big response.'},
    {lvl:'honors',t:'G protein',d:'A relay switch that is on when bound to GTP and off when bound to GDP.'},{lvl:'honors',t:'Second messenger',d:'A small molecule, like cAMP, that carries the signal through the cytoplasm.'},{lvl:'honors',t:'Kinase',d:'An enzyme that adds a phosphate group to another protein, often switching it on.'},{lvl:'honors',t:'Phosphodiesterase',d:'The enzyme that breaks down cAMP, ending the signal.'},
    {lvl:'ap',t:'Phosphatase',d:'An enzyme that removes phosphate groups, reversing a kinase.'},{lvl:'ap',t:'Antagonist',d:'A molecule, like a beta blocker, that binds a receptor without activating it.'},{lvl:'ap',t:'GPCR',d:'G-protein-coupled receptor: a seven-pass membrane receptor that activates G proteins.'}],
  about:'<p>Each step is a simple rate equation. Receptor occupancy is [E]/([E]+K<sub>d</sub>) with K<sub>d</sub> = 1 nM, rising to 10 nM with the beta blocker. G-protein activation is 2·occupancy·(1−G) minus GTP hydrolysis at 1/s. cAMP is made at 8·G µM/s and broken down by phosphodiesterase at 1/s (0.3/s with caffeine). PKA follows cAMP²/(cAMP²+25). The two downstream kinases are phosphorylated in proportion to the step above them and dephosphorylated by phosphatases.</p><p>Simplified: one receptor type, no receptor desensitization, no calcium branch, and glucose output in model units (about 25 million glucose per second at maximum). The pictures show a few copies of each protein. A real cell has thousands of receptors and far more enzymes in each row.</p>',
  thumbFrames:60
};
BioLab.register(SIG);
})();
