(function(){
'use strict';
const {clamp,rr,txt,pill,polyline,atLeast,PAL,RM,serColor}=BioLab.h;

/* Light reactions on the thylakoid membrane feed ATP and NADPH to the Calvin cycle in the stroma.
   Pools are normalized (0–1). Linear electron flow slows when NADP⁺ runs out; ATP synthase slows when ADP runs out. */
const FILT={white:1,red:0.9,blue:0.95,green:0.15};
const LIGHTC={white:'rgba(255,214,90,',red:'rgba(230,60,60,',blue:'rgba(70,120,240,',green:'rgba(60,180,80,'};
const K={KI:60,KE:8,KC:1.5,KS:60,KF:6,KR:8,KG:8,CAP:15,CH:20,CC:5};
const fTc=T=>Math.pow(2,(T-25)/10)/(1+Math.exp((T-38)/2));
const EPATH=polyline([[95,262],[190,262],[262,262],[262,300],[332,328],[400,300],[400,262],[470,214],[520,200]]);
const W={x:690,y:96,r:58};

const SIM={
  id:'chloroplast',hash:'chloroplast',apUnit:3,order:5,kind:'Simulation',tab:'Light reactions and Calvin cycle',
  card:'Shine light on a thylakoid membrane, watch water split and ATP and NADPH build up, then see the Calvin cycle turn CO₂ into sugar.',
  title:'Inside the chloroplast: light reactions and the Calvin cycle',
  prereq:['photosynthesis'],next:['respiration'],
  lede:{bio:'Light energy splits water and charges up two energy carriers, ATP and NADPH. The Calvin cycle spends them to build sugar from CO₂.',
        honors:'Follow electrons from photosystem II to NADP⁺, watch the H⁺ gradient drive ATP synthase, and see how the light reactions and the Calvin cycle depend on each other.',
        ap:'Test the coupling between the light reactions and carbon fixation with darkness, CO₂ starvation and the herbicide DCMU, and account for the ATP and NADPH each CO₂ costs.'},
  scale:'Inside one chloroplast (about 5 µm long): a slice of thylakoid membrane about 100 nanometers wide, with the stroma above it and the thylakoid space below.',
  timeScale:1,dtMax:0.01,prewarm:60,sampleDt:0.1,window:40,unit:'s',chChange:4,chReveal:18,
  controls:[
    {id:'light',label:'Light intensity',type:'range',min:0,max:100,step:1,def:80,unit:'%',lvl:'bio'},
    {id:'co2',label:'CO₂ available',type:'range',min:0,max:1,step:0.05,def:0.6,unit:'',d:2,lvl:'bio',help:'Relative CO₂ in the stroma.'},
    {id:'color',label:'Light color',type:'seg',def:'white',lvl:'honors',options:[{v:'white',l:'White'},{v:'red',l:'Red'},{v:'blue',l:'Blue'},{v:'green',l:'Green'}]},
    {id:'temp',label:'Temperature',type:'range',min:5,max:45,step:1,def:25,unit:' °C',lvl:'honors',help:'Calvin-cycle enzymes like rubisco are temperature-sensitive.'},
    {id:'dcmu',label:'DCMU herbicide',type:'toggle',def:false,lvl:'ap',help:'Blocks electron flow from photosystem II to plastoquinone'}
  ],
  init(){return {H:0.3,A:0.4,N:0.3,R:0.5,P:0.3,G:0.3,Je:0,Jc:0,F:0,Red:0,Exp:0,ATPr:0,Rs:0,o2:0,sugar:0};},
  afterPrewarm(sim){sim.st.sugar=0;},
  step(sim,dt){const p=sim.p,s=sim.st;
    const I=p.light*FILT[p.color],Il=I/(I+K.KI);
    s.Je=p.dcmu?0:K.KE*Il*Math.max(0,1-s.N);          // linear flow: needs NADP⁺
    s.Jc=p.dcmu?0:K.KC*Il*s.N;                         // cyclic flow around PSI tops up ATP
    const Hin=(3*s.Je+2*s.Jc)*(1-0.6*s.H);s.Rs=K.KS*s.H*Math.max(0,1-s.A);const leak=1*s.H;s.ATPr=s.Rs/3;
    const c=p.co2/(p.co2+0.2),fT=fTc(p.temp);
    s.F=K.KF*s.R*c*fT;s.Red=K.KR*s.P*s.A*s.N*fT;const Reg=K.KG*s.G*s.A*fT;s.Exp=s.Red/6;s.Reg=Reg;
    s.H=clamp(s.H+(Hin-s.Rs-leak)/K.CH*dt,0,1);
    s.A=clamp(s.A+(s.ATPr-s.Red-Reg*0.6)/K.CAP*dt,0,1);
    s.N=clamp(s.N+(s.Je/2-s.Red)/K.CAP*dt,0,1);
    s.R=Math.max(0,s.R+(Reg*0.6-s.F)/K.CC*dt);s.P=Math.max(0,s.P+(2*s.F-s.Red)/K.CC*dt);s.G=Math.max(0,s.G+(s.Red*5/6-Reg)/K.CC*dt);
    s.o2=s.Je/4;s.sugar+=s.Exp*dt;},
  metrics:[
    {id:'o2',label:'O₂ released',unit:'µmol/m²/s',lvl:'bio',min:0,max:25,d:1,get:s=>s.st.o2*20},
    {id:'g3p',label:'Sugar (G3P) made',unit:'per min',lvl:'bio',min:0,max:25,d:1,get:s=>s.st.Exp*60},
    {id:'atp',label:'ATP supply',unit:'% full',lvl:'bio',min:0,max:100,d:0,get:s=>s.st.A*100},
    {id:'nadph',label:'NADPH supply',unit:'% full',lvl:'honors',min:0,max:100,d:0,get:s=>s.st.N*100},
    {id:'hg',label:'H⁺ gradient',unit:'% of max',lvl:'honors',min:0,max:100,d:0,get:s=>s.st.H*100},
    {id:'fix',label:'CO₂ fixed by rubisco',unit:'per min',lvl:'ap',min:0,max:120,d:1,get:s=>s.st.F*60}
  ],
  graphs:[{id:'o2',label:'O₂ released',lines:['o2']},{id:'g3p',label:'Sugar (G3P) made',lines:['g3p']},{id:'carriers',label:'ATP and NADPH supply',lvl:'honors',lines:['atp','nadph']},{id:'hg',label:'H⁺ gradient',lvl:'honors',lines:['hg']}],
  defaultGraph:'o2',
  initVis(sim){const v=sim.vis;v.e=[];v.h=[];v.tok=[];v.o2=[];v.co2=[];v.sug=[];v.acc={e:0,h:0,s:0,t:0,o:0,c:0,g:0};v.rot=0;v.wh=0;
    v.lumen=[];for(let i=0;i<70;i++)v.lumen.push([20+Math.random()*760,320+Math.random()*112,Math.random()*6.28]);},
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis,hon=atLeast('honors'),ap=atLeast('ap'),R=Math.random;if(!v.acc)SIM.initVis(sim);
    // stroma, membrane, lumen
    ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,800,226);ctx.fillStyle='rgba(80,160,80,.10)';ctx.fillRect(0,0,800,226);
    ctx.fillStyle=PAL['cv-ims'];ctx.fillRect(0,298,800,152);ctx.fillStyle=PAL['cv-tail'];ctx.fillRect(0,226,800,72);
    ctx.strokeStyle=PAL['cv-head'];ctx.lineWidth=1.3;ctx.globalAlpha=.5;ctx.beginPath();for(let x=6;x<800;x+=11){ctx.moveTo(x-2,236);ctx.lineTo(x-2,256);ctx.moveTo(x+2,236);ctx.lineTo(x+2,256);ctx.moveTo(x-2,268);ctx.lineTo(x-2,288);ctx.moveTo(x+2,268);ctx.lineTo(x+2,288);}ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle=PAL['cv-head'];for(let x=6;x<800;x+=11){ctx.beginPath();ctx.arc(x,231,5,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(x,293,5,0,6.29);ctx.fill();}
    txt(ctx,'STROMA',170,22,{s:12*k,w:700,c:PAL['cv-soft']});txt(ctx,hon?'THYLAKOID SPACE (LUMEN)':'INSIDE THE THYLAKOID',12,442,{s:12*k,w:700,c:PAL['cv-soft']});
    // light rays
    const I=p.light*FILT[p.color]/100,lc=LIGHTC[p.color];
    if(p.light>0){[[95,210],[400,210]].forEach((tg,j)=>{const sx=tg[0]-110,sy=-10;ctx.strokeStyle=lc+clamp(0.15+I*0.75,0,0.9)+')';ctx.lineWidth=3;
      for(let r=0;r<3;r++){ctx.beginPath();for(let q=0;q<=20;q++){const f=q/20,x=sx+(tg[0]-sx)*f+r*14,y=sy+(tg[1]-sy)*f;const off=Math.sin(f*18-t*8)*4;q?ctx.lineTo(x+off,y-off):ctx.moveTo(x+off,y-off);}ctx.stroke();}});}
    // H+ in lumen
    const nH=Math.round(5+s.H*60);ctx.fillStyle=PAL['cv-h'];for(let i=0;i<nH&&i<v.lumen.length;i++){const q=v.lumen[i];ctx.beginPath();ctx.arc(q[0]+(RM?0:Math.sin(t*1.6+q[2])*1.5),q[1],4,0,6.29);ctx.fill();}
    // complexes
    const lab=(s_,x,y,sz)=>txt(ctx,s_,x,y,{s:sz*k,w:700,c:'#fff',a:'center',b:'middle'});
    ctx.fillStyle='#2f7d45';rr(ctx,55,206,82,108,14);ctx.fill();
    ctx.fillStyle='#cf8619';ctx.beginPath();ctx.ellipse(190,262,15,11,0,0,6.29);ctx.fill();
    ctx.fillStyle='#2a8276';rr(ctx,236,214,54,96,12);ctx.fill();
    ctx.fillStyle='#4f7fc2';ctx.beginPath();ctx.arc(332,328,13,0,6.29);ctx.fill();
    ctx.fillStyle='#246134';rr(ctx,362,206,78,108,14);ctx.fill();
    ctx.fillStyle='#c4533b';ctx.beginPath();ctx.arc(470,212,12,0,6.29);ctx.fill();
    ctx.fillStyle='#5d72a0';rr(ctx,500,176,46,52,10);ctx.fill();
    lab(hon?'PSII':'PS II',96,262,15);lab('PS I',401,262,15);if(hon){lab('PQ',190,263,10);lab('b6f',263,262,12);lab('PC',332,329,10);lab('Fd',470,213,10);}
    txt(ctx,'Photosystem II',96,196,{s:12*k,w:600,a:'center'});txt(ctx,'Photosystem I',401,196,{s:12*k,w:600,a:'center'});
    if(k<1.3)txt(ctx,hon?'NADP⁺ reductase':'makes NADPH',515,168,{s:11.5*k,w:600,a:'center'});
    // ATP synthase
    v.rot+=s.Rs*0.02*vdt;ctx.fillStyle='#8e1023';rr(ctx,616,232,48,60,10);ctx.fill();
    for(let i=0;i<6;i++){const a=v.rot+i*Math.PI/3,c=Math.cos(a);if(c<0)continue;ctx.fillStyle=c>.5?'#e0455f':'#b5122d';rr(ctx,640+18*Math.sin(a)-4,236,8,52,4);ctx.fill();}
    ctx.fillStyle='#8e1023';ctx.fillRect(636,206,8,28);[[624,196],[640,190],[656,196]].forEach((q,i)=>{ctx.fillStyle=i===1?'#e0455f':'#b5122d';ctx.beginPath();ctx.arc(q[0],q[1],12,0,6.29);ctx.fill();});
    txt(ctx,'ATP synthase',640,170,{s:11.5*k,w:600,a:'center'});
    // water splitting
    txt(ctx,'2 H₂O → O₂ + 4 H⁺',96,342,{s:12*k,w:600,a:'center'});
    if(p.dcmu){ctx.strokeStyle='#d32f2f';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(150,246);ctx.lineTo(176,278);ctx.moveTo(176,246);ctx.lineTo(150,278);ctx.stroke();pill(ctx,'DCMU',163,214,'#d32f2f','#fff',12*k);}
    // ATP / NADPH supply gauges
    [['ATP',s.A,PAL['cv-atp'],455],['NADPH',s.N,PAL['s5'],530]].forEach(g=>{const x=g[3];ctx.fillStyle=PAL['card'];rr(ctx,x,34,36,92,6);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,x,34,36,92,6);ctx.stroke();
      ctx.fillStyle=g[2];const h=86*g[1];rr(ctx,x+3,123-h,30,h,4);ctx.fill();txt(ctx,g[0],x+18,146,{s:11.5*k,w:700,a:'center'});});
    // Calvin cycle wheel
    v.wh+=s.F*0.25*vdt;ctx.strokeStyle=PAL['s3'];ctx.lineWidth=10;ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(W.x,W.y,W.r,0,6.29);ctx.stroke();ctx.globalAlpha=1;
    for(let i=0;i<6;i++){const a=v.wh+i*Math.PI/3;ctx.fillStyle=serColor(2);ctx.beginPath();ctx.arc(W.x+Math.cos(a)*W.r,W.y+Math.sin(a)*W.r,6,0,6.29);ctx.fill();}
    txt(ctx,'Calvin',W.x,W.y-4,{s:15*k,w:700,a:'center'});txt(ctx,'cycle',W.x,W.y+14,{s:15*k,w:700,a:'center'});
    if(hon&&k<1.3){txt(ctx,'fixation (rubisco)',790,W.y+W.r+12,{s:11*k,c:PAL['cv-soft'],a:'right'});txt(ctx,'reduction',W.x-W.r-8,W.y+8,{s:11*k,c:PAL['cv-soft'],a:'right'});txt(ctx,'regeneration',W.x,W.y-W.r-10,{s:11*k,c:PAL['cv-soft'],a:'center'});}
    if(k<1.3)txt(ctx,'sugar made: '+(s.sugar).toFixed(1),790,188,{s:12*k,w:600,a:'right'});
    // particles at rates from the model
    v.acc.e+=s.Je*0.9*vdt;while(v.acc.e>=1){v.acc.e--;v.e.push({d:0});}
    v.acc.h+=(3*s.Je+2*s.Jc)*0.25*vdt;while(v.acc.h>=1){v.acc.h--;const x=R()<.4?96+R()*30-15:263+R()*20-10;v.h.push({x,y:x<150?318:200,vy:x<150?40:120,end:x<150?380:340});}
    v.acc.s+=s.Rs*0.05*vdt;while(v.acc.s>=1){v.acc.s--;v.h.push({x:640,y:330,vy:-110,end:200});}
    v.acc.o+=s.o2*1.4*vdt;while(v.acc.o>=1){v.acc.o--;v.o2.push({x:96,y:350,life:2.5});}
    v.acc.t+=s.Red*1.1*vdt;while(v.acc.t>=1){v.acc.t--;v.tok.push({x:640,y:184,tx:W.x-W.r,ty:W.y+20,l:'ATP',c:PAL['cv-atp'],life:1.6});v.tok.push({x:523,y:176,tx:W.x-W.r,ty:W.y+36,l:'NADPH',c:PAL['s5'],life:1.6});}
    v.acc.c+=s.F*0.8*vdt;while(v.acc.c>=1){v.acc.c--;v.co2.push({x:800,y:W.y+30+R()*30,life:2});}
    v.acc.g+=s.Exp*3*vdt;while(v.acc.g>=1){v.acc.g--;v.sug.push({x:W.x+W.r,y:W.y-20,life:2.2});}
    v.e.forEach(e=>{e.d+=200*vdt;const q=EPATH.at(e.d);ctx.fillStyle=PAL['cv-e'];ctx.strokeStyle=PAL['cv-estroke'];ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(q[0],q[1],4.4,0,6.29);ctx.fill();ctx.stroke();});
    v.e=v.e.filter(e=>e.d<EPATH.L);
    v.h.forEach(h=>{h.y+=h.vy*vdt;ctx.fillStyle=PAL['cv-h'];ctx.beginPath();ctx.arc(h.x,h.y,4,0,6.29);ctx.fill();});
    v.h=v.h.filter(h=>h.vy>0?h.y<h.end:h.y>h.end);
    v.o2.forEach(o=>{o.life-=vdt;o.x-=30*vdt;o.y+=10*vdt;ctx.globalAlpha=clamp(o.life,0,1);txt(ctx,'O₂',o.x,o.y,{s:12*k,w:700,c:PAL['s2']});});
    v.tok.forEach(o=>{o.life-=vdt;o.x+=(o.tx-o.x)*Math.min(1,vdt*2);o.y+=(o.ty-o.y)*Math.min(1,vdt*2);ctx.globalAlpha=clamp(o.life,0,1);txt(ctx,o.l,o.x,o.y,{s:10.5*k,w:700,c:o.c,a:'center'});});
    v.co2.forEach(o=>{o.life-=vdt;o.x+=((W.x+W.r)-o.x)*Math.min(1,vdt*1.8);ctx.globalAlpha=clamp(o.life,0,1);txt(ctx,'CO₂',o.x,o.y,{s:11*k,w:700,c:PAL['cv-soft'],a:'center'});});
    v.sug.forEach(o=>{o.life-=vdt;o.x+=20*vdt;o.y-=26*vdt;ctx.globalAlpha=clamp(o.life,0,1);ctx.fillStyle=PAL['s4'];ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;i?ctx.lineTo(o.x+Math.cos(a)*7,o.y+Math.sin(a)*7):ctx.moveTo(o.x+7,o.y);}ctx.closePath();ctx.fill();});
    ctx.globalAlpha=1;['h','o2','tok','co2','sug','e'].forEach(kk=>{v[kk]=v[kk].filter(o=>o.life===undefined||o.life>0);if(v[kk].length>150)v[kk].splice(0,v[kk].length-150);});
    // legend
    ctx.fillStyle=PAL['cv-e'];ctx.beginPath();ctx.arc(600,438,4.4,0,6.29);ctx.fill();txt(ctx,'electron',610,442,{s:12*k,c:PAL['cv-soft']});
    ctx.fillStyle=PAL['cv-h'];ctx.beginPath();ctx.arc(690,438,4,0,6.29);ctx.fill();txt(ctx,'H⁺ ion',700,442,{s:12*k,c:PAL['cv-soft']});
  },
  narrate(sim){const s=sim.st,p=sim.p,hon=atLeast('honors');
    if(p.dcmu)return '<b>DCMU blocks electrons leaving photosystem II.</b> Water is no longer split, so O₂ release stops, and without new ATP and NADPH the Calvin cycle soon stops too.';
    if(p.light<3){return s.Exp>0.02?'<b>The light is off, but the Calvin cycle is still running</b> on the ATP and NADPH left over. Watch the supply gauges drain. When they are empty, sugar production stops.':
      '<b>Dark.</b> No light means no electron flow, so no ATP or NADPH. With its fuel used up, the Calvin cycle has stopped making sugar.';}
    if(p.co2<0.03)return '<b>No CO₂ to fix.</b> The Calvin cycle stops spending ATP and NADPH, so they pile up. With no NADP⁺ left to accept electrons, the light reactions slow and O₂ release drops.';
    if(hon&&p.color==='green')return '<b>Green light mostly reflects off chlorophyll.</b> Little is absorbed, so few electrons get excited and O₂ and sugar production fall.';
    if(p.temp>=39)return '<b>Too hot for the Calvin cycle enzymes.</b> Rubisco and its partners lose their shape, so ATP and NADPH go unused and back up.';
    const lightLim=s.N<0.5;
    return 'Light splits water at photosystem II, releasing O₂. Electrons flow to NADP⁺ and pump H⁺ into the thylakoid, which drives ATP synthase. The Calvin cycle spends that ATP and NADPH to turn CO₂ into sugar. '+(lightLim?'<b>Right now light is the limit:</b> NADPH is used as fast as it is made.':'<b>Right now the Calvin cycle is the limit:</b> ATP and NADPH are waiting to be used.');},
  tour:[
    {title:'Where we are',text:'This is a slice of the thylakoid membrane inside a chloroplast. Above it is the stroma, where sugar is built. Below is the thylakoid space, where H⁺ collects.',focus:[0,190,800,130],speed:0.5},
    {title:'Light splits water',text:'Light hits photosystem II and excites electrons in chlorophyll. To replace them, PSII splits water: 2 H₂O → O₂ + 4 H⁺ + 4 electrons. That O₂ is what plants release.',focus:[40,186,110,174],speed:0.2},
    {title:'Electrons pump H⁺',text:{bio:'The electrons pass along a chain of proteins. Their energy pumps H⁺ into the thylakoid space.',honors:'Electrons pass from PSII to plastoquinone (PQ), the cytochrome b6f complex and plastocyanin (PC). Plastoquinone and b6f use the energy to pump H⁺ into the lumen.'},focus:[150,200,210,150],speed:0.2},
    {title:'Photosystem I makes NADPH',text:'Light re-energizes the electrons at photosystem I. They go to ferredoxin and then NADP⁺ reductase, which makes NADPH.',focus:[355,155,200,165],speed:0.2},
    {title:'ATP synthase',text:'H⁺ flows back out to the stroma through ATP synthase and spins it to make ATP. This is chemiosmosis, the same mechanism mitochondria use.',focus:[600,155,80,180],speed:0.25},
    {title:'The Calvin cycle',text:{bio:'The Calvin cycle uses ATP and NADPH to turn CO₂ from the air into sugar.',honors:'Rubisco fixes CO₂ onto RuBP. ATP and NADPH reduce the product to G3P. Most G3P regenerates RuBP, and one in six leaves as sugar.'},focus:[[440,20,140,140],[625,26,175,150]],speed:0.4},
    {title:'Turn off the light',text:'Watch what happens in the dark. The Calvin cycle keeps running for a few seconds on stored ATP and NADPH, then stops when the gauges are empty.',focus:[[440,20,140,140],[625,26,175,150]],speed:1,setup(sim){BioLab.setValues(sim,{light:0});}},
    {lvl:'ap',title:'The cost of one sugar',text:'Fixing 3 CO₂ into one G3P uses 9 ATP and 6 NADPH. Linear electron flow makes slightly less ATP than that, so cyclic flow around photosystem I tops up the ATP.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{light:80});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{light:80,dcmu:false,co2:0.6,color:'white'});},
  lab:{bio:'<p><b>Question:</b> What does the Calvin cycle need from the light reactions?</p><ol><li>Record a trial at 80% light.</li><li>Turn the light to 0%. Record trials after 2 seconds and after 15 seconds.</li><li>Compare sugar made and ATP supply.</li></ol><p>Explain why sugar keeps being made for a short time in the dark.</p>',
       honors:'<p><b>Question:</b> How do light intensity and color affect the light reactions?</p><ol><li>Record O₂ released at light 10, 25, 50, 75 and 100% (white).</li><li>Repeat at 100% with red, blue and green light.</li><li>Plot light intensity (x) against O₂ released (y).</li></ol><p>Explain the shape of your curve and the green-light result.</p>',
       ap:'<p><b>Question:</b> How are the light reactions and the Calvin cycle coupled?</p><ol><li>Record steady-state trials for baseline, no CO₂, DCMU and darkness.</li><li>Compare O₂ release, ATP and NADPH supply, H⁺ gradient and CO₂ fixation.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why removing CO₂ slows O₂ release even though CO₂ is not used in the light reactions.</p>'},
  terms:[{t:'Thylakoid',d:'A flattened membrane sac inside the chloroplast where the light reactions happen.'},{t:'Light reactions',d:'Use light to split water, release O₂ and make ATP and NADPH.'},{t:'Calvin cycle',d:'Uses ATP, NADPH and CO₂ to build sugar in the stroma.'},
    {lvl:'honors',t:'Photosystem',d:'A cluster of chlorophyll and proteins that captures light and excites electrons (PSII and PSI).'},{lvl:'honors',t:'Rubisco',d:'The enzyme that attaches CO₂ to RuBP, the first step of carbon fixation.'},{lvl:'honors',t:'G3P',d:'The 3-carbon sugar the Calvin cycle exports to build glucose.'},
    {lvl:'ap',t:'Chemiosmosis',d:'Using an H⁺ gradient across a membrane to drive ATP synthase. Chloroplasts pump H⁺ into the lumen; mitochondria pump it into the intermembrane space.'},{lvl:'ap',t:'Cyclic electron flow',d:'Electrons from PSI cycle back to b6f, pumping H⁺ for extra ATP without making NADPH.'}],
  about:'<p>Pools of ATP, NADPH, RuBP, 3-PGA and G3P are tracked as fractions of their maximum. Linear electron flow rises with absorbed light, I ÷ (I + 60), and slows when NADP⁺ runs out. Cyclic flow adds a little ATP. Each electron moves about 3 H⁺, ATP synthase makes 1 ATP per 3 H⁺, and it slows when ADP runs out. The Calvin cycle uses 2 ATP and 2 NADPH per CO₂ for reduction and 1 ATP per CO₂ to regenerate RuBP, exporting 1 G3P per 3 CO₂. Calvin enzymes double in speed per 10 °C and denature above about 38 °C.</p><p>O₂ and sugar rates are in model units scaled to realistic leaf values. The model leaves out photorespiration, stomata and the light-harvesting antenna. Green light is given a low absorption (15%), though leaves do absorb some green.</p>',
  challenges:[
    {lvl:'bio',q:'You switch off the light. What happens to sugar (G3P) production?',choices:['It stops instantly','It keeps going for a few seconds, then stops','It speeds up'],correct:1,change:{light:0},changeText:'Light switched off',watch:'g3p',
     explain:'The Calvin cycle doesn’t need light directly. It runs on ATP and NADPH from the light reactions. In the dark it keeps going until the supply runs out, then stops.'},
    {lvl:'bio',q:'You remove all the CO₂. What happens to oxygen release?',choices:['It rises','It slows down','It doesn’t change'],correct:1,change:{co2:0},changeText:'CO₂ removed',watch:'o2',
     explain:'Without CO₂ the Calvin cycle stops using NADPH. NADP⁺ runs out, so electrons from water have nowhere to go, and water splitting (O₂ release) slows. The two halves of photosynthesis depend on each other.'},
    {lvl:'honors',q:'You shine only green light on the chloroplast. What happens to O₂ release?',choices:['It rises','It drops sharply','It stays the same'],correct:1,change:{color:'green'},changeText:'Green light only',watch:'o2',
     explain:'Chlorophyll absorbs red and blue light and reflects most green. Less absorbed light means fewer excited electrons, less water split and less O₂.'},
    {lvl:'honors',q:'With no CO₂, what happens to the ATP and NADPH supplies?',choices:['They pile up','They run out','They don’t change'],correct:0,change:{co2:0},changeText:'CO₂ removed',watch:'carriers',
     explain:'The light reactions keep making ATP and NADPH for a while, but the Calvin cycle has stopped spending them. They build up until the light reactions slow down.'},
    {lvl:'ap',q:'You add DCMU, which blocks electrons leaving photosystem II. What happens to O₂ release?',choices:['It stops','It increases','Only the Calvin cycle is affected'],correct:0,change:{dcmu:true},changeText:'DCMU added',watch:'o2',
     explain:'With PSII unable to pass electrons on, it can’t keep splitting water, so O₂ release stops. ATP and NADPH production stops too, so the Calvin cycle shuts down.'},
    {lvl:'ap',instant:true,q:'To make one G3P from 3 CO₂, how many ATP and NADPH does the Calvin cycle use?',choices:['3 ATP and 3 NADPH','9 ATP and 6 NADPH','6 ATP and 9 NADPH','2 ATP and 2 NADPH'],correct:1,
     explain:'Reduction uses 6 ATP and 6 NADPH to make 6 G3P from 6 3-PGA. Regenerating 3 RuBP from 5 G3P uses 3 more ATP. That is 9 ATP and 6 NADPH per G3P exported.'},
    {lvl:'ap',instant:true,q:'How are the chloroplast and mitochondrial electron transport chains alike?',choices:['Both split water','Both pump H⁺ across a membrane and use its flow through ATP synthase','Both make NADPH'],correct:1,
     explain:'Both use chemiosmosis. The chloroplast pumps H⁺ into the thylakoid lumen and the mitochondrion into the intermembrane space. Either way, H⁺ flowing back through ATP synthase makes ATP.'}
  ]
};
BioLab.register(SIM);
})();
