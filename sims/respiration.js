(function(){
'use strict';
const {clamp,rng,rr,txt,pill,polyline,atLeast,PAL,FONT,RM}=BioLab.h;
const PATH_N=polyline([[115,318],[115,214],[268,212],[331,212],[331,172],[405,148],[470,172],[470,262],[470,300]]);
const PATH_F=polyline([[212,300],[212,232],[268,212],[331,212],[331,172],[405,148],[470,172],[470,262],[470,300]]);
const RESP={
  id:'resp',apUnit:3,order:1,kind:'Simulation',card:'Electron transport and ATP synthase. Starve it of oxygen, poison it, or uncouple it.',hash:'respiration',tab:'Cellular respiration',
  title:'Cellular respiration in the inner mitochondrial membrane',
  lede:{bio:'Electrons from your food power protein pumps that push H⁺ ions across the membrane. The H⁺ ions rush back through ATP synthase, which spins and makes ATP.',
        honors:'NADH and FADH₂ hand electrons to the electron transport chain. Complexes I, III and IV use that energy to pump H⁺ into the intermembrane space, and the gradient drives ATP synthase.',
        ap:'Chemiosmosis, measured. Track the proton-motive force and P/O ratio, and use inhibitors and an uncoupler to separate electron transport from ATP synthesis.'},
  timeScale:1,dtMax:0.01,prewarm:20,sampleDt:0.1,window:30,unit:'s',chChange:4,chReveal:12,
  controls:[
    {id:'o2',label:'Oxygen available',type:'range',min:0,max:100,step:1,def:100,unit:'%',lvl:'bio'},
    {id:'fuel',label:'Fuel supply (from glucose)',type:'range',min:0,max:100,step:1,def:80,unit:'%',lvl:'bio'},
    {id:'carrier',label:'Electron carrier',type:'seg',def:'NADH',lvl:'honors',options:[{v:'NADH',l:'NADH'},{v:'FADH2',l:'FADH₂'}]},
    {id:'cn',label:'Cyanide',help:'Blocks Complex IV',type:'toggle',def:false,lvl:'honors'},
    {id:'oligo',label:'Oligomycin',help:'Blocks ATP synthase',type:'toggle',def:false,lvl:'honors'},
    {id:'dnp',label:'DNP',help:'Makes the membrane leaky to H⁺',type:'toggle',def:false,lvl:'ap'}
  ],
  init(){return {G:0,Je:0,P:0,Rs:0,Rl:0,h:10};},
  step(sim,dt){const p=sim.p,s=sim.st,S=p.fuel/100,ox=p.o2/100,fo=ox*1.08/(ox+0.08),G=s.G;
    s.Je=p.cn?0:16*S*fo*Math.max(0,1-G);           // NADH (electron pairs) oxidized per s; slowed by back-pressure of the gradient
    s.h=p.carrier==='NADH'?10:6; s.P=s.h*s.Je;     // H+ pumped per s
    s.Rs=p.oligo?0:150*G;                          // H+ returning through ATP synthase
    s.Rl=5*G+(p.dnp?600*G:0);                      // H+ leaking back (heat)
    s.G=clamp(G+(s.P-s.Rs-s.Rl)/250*dt,0,1);},
  metrics:[
    {id:'atp',label:'ATP made',unit:'per s',lvl:'bio',min:0,max:30,d:1,get:s=>s.st.Rs/4},
    {id:'o2use',label:'O₂ used',unit:'per s',lvl:'bio',min:0,max:8,d:2,get:s=>s.st.Je/2},
    {id:'grad',label:'H⁺ gradient',unit:'% of max',lvl:'bio',min:0,max:100,d:0,get:s=>s.st.G*100},
    {id:'ph',label:'Intermembrane pH',unit:'',lvl:'honors',min:6.4,max:7.8,d:2,fixed:true,get:s=>7.8-1.4*s.st.G},
    {id:'leak',label:'H⁺ leak (as heat)',unit:'per s',lvl:'honors',min:0,max:100,d:1,get:s=>s.st.Rl},
    {id:'pmf',label:'Proton-motive force',unit:'mV',lvl:'ap',min:0,max:350,d:0,get:s=>350*s.st.G},
    {id:'po',label:'P/O ratio',unit:'ATP per O',lvl:'ap',min:0,max:3,d:2,get:s=>s.st.Je>0.05?(s.st.Rs/4)/s.st.Je:NaN}
  ],
  defaultGraph:'atp',
  challenges:[
    {lvl:'bio',q:'The cell runs out of oxygen. What happens to ATP production?',
     choices:['It goes up, because the cell works harder','It drops to almost zero','Nothing changes; oxygen is only for breathing'],correct:1,
     change:{o2:0},changeText:'Oxygen set to 0%',watch:'atp',
     explain:{bio:'Oxygen catches the electrons at the end of the chain. With no oxygen, electrons back up, the pumps stop, the H⁺ gradient runs down, and ATP synthase has nothing to power it. That is why cells die within minutes without oxygen.',
              honors:'O₂ is the final electron acceptor at Complex IV. Without it, electrons back up through the chain, pumping stops, the H⁺ gradient runs down, and ATP synthase stalls.'}},
    {lvl:'bio',q:'The fuel supply is cut in half. What happens to the H⁺ gradient?',
     choices:['It gets bigger','It gets smaller','It stays the same'],correct:1,
     change:{fuel:40},changeText:'Fuel cut from 80% to 40%',watch:'grad',
     explain:{bio:'Fewer electrons from food means the pumps run more slowly. Fewer H⁺ ions are pushed across, so the gradient shrinks and ATP production falls with it.'}},
    {lvl:'honors',q:'Oligomycin blocks ATP synthase. What happens to oxygen use?',
     choices:['It rises, because the cell is desperate for ATP','It drops, because the H⁺ gradient backs up and slows the pumps','It stays the same; the electron chain does not depend on ATP synthase'],correct:1,
     change:{oligo:true},changeText:'Oligomycin added',watch:'o2use',
     explain:{honors:'Electron transport and ATP synthesis are coupled through the gradient. With ATP synthase blocked, H⁺ has nowhere to go, the gradient maxes out, and pumping against it becomes too hard. Electron flow, and so O₂ use, nearly stops.',
              ap:'This is respiratory control. With the F₀ channel blocked, the proton-motive force climbs until pumping is thermodynamically unfavorable, so electron transport and O₂ consumption nearly stop even though substrate and O₂ are present.'}},
    {lvl:'honors',q:'Switch the electron carrier from NADH to FADH₂. What happens to ATP output?',
     choices:['More ATP','Less ATP','The same ATP'],correct:1,
     change:{carrier:'FADH2'},changeText:'Carrier switched to FADH₂',watch:'atp',
     explain:{honors:'FADH₂ hands its electrons to Complex II, which skips Complex I. Complex II does not pump H⁺, so each FADH₂ moves fewer H⁺ across and produces less ATP than NADH.',
              ap:'FADH₂ enters at Complex II and bypasses Complex I’s 4 H⁺. That is 6 H⁺ per pair instead of 10, so at about 4 H⁺ per ATP the P/O ratio falls from about 2.5 to about 1.5.'}},
    {lvl:'ap',q:'DNP makes the membrane leaky to H⁺. What happens to O₂ use and ATP production?',
     choices:['Both drop','O₂ use rises while ATP production falls','Both rise','O₂ use falls while ATP production rises'],correct:1,
     change:{dnp:true},changeText:'DNP added',watch:'o2use',
     explain:{ap:'DNP is an uncoupler. H⁺ leaks back without passing through ATP synthase, so the proton-motive force collapses and the energy is released as heat. With no back-pressure, electron transport speeds up and O₂ use rises, but ATP output and the P/O ratio crash. DNP was sold as a diet drug in the 1930s and caused fatal overheating.'}},
    {lvl:'ap',q:'Cyanide binds Complex IV. What happens to the proton-motive force?',
     choices:['It rises','It collapses toward zero','It is unchanged'],correct:1,
     change:{cn:true},changeText:'Cyanide added',watch:'pmf',
     explain:{ap:'Cyanide stops electron transfer to O₂, so no complex can pump. ATP synthase and the small leak keep draining the gradient, and the proton-motive force decays toward zero. Compare this with oligomycin, where the force goes up instead.'}}
  ],
  initVis(sim){const r=rng(7),v=sim.vis;v.hpos=[];for(let i=0;i<80;i++)v.hpos.push([12+r()*776,34+r()*112,r()*6.28]);
    v.mpos=[];for(let i=0;i<7;i++)v.mpos.push([20+r()*560,270+r()*60]);
    v.e=[];v.p=[];v.atp=[];v.w=[];v.eAcc=0;v.pAcc=0;v.sAcc=0;v.lAcc=0;v.aAcc=0;v.wAcc=0;v.rot=0;},
  draw(sim,ctx,vdt,k,t){
    const s=sim.st,p=sim.p,v=sim.vis,hon=atLeast('honors'),ap=atLeast('ap'),R=Math.random;
    ctx.fillStyle=PAL['cv-ims'];ctx.fillRect(0,0,800,172);
    ctx.fillStyle=PAL['cv-matrix'];ctx.fillRect(0,248,800,202);
    ctx.fillStyle=PAL['cv-tail'];ctx.fillRect(0,172,800,76);
    // phospholipid bilayer
    ctx.strokeStyle=PAL['cv-head'];ctx.lineWidth=1.4;ctx.globalAlpha=.55;ctx.beginPath();
    for(let x=6;x<800;x+=11){ctx.moveTo(x-2,181);ctx.lineTo(x-2,205);ctx.moveTo(x+2,181);ctx.lineTo(x+2,205);ctx.moveTo(x-2,215);ctx.lineTo(x-2,239);ctx.moveTo(x+2,215);ctx.lineTo(x+2,239);}
    ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=PAL['cv-head'];
    for(let x=6;x<800;x+=11){ctx.beginPath();ctx.arc(x,177,5,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(x,243,5,0,6.29);ctx.fill();}
    // region labels
    txt(ctx,'INTERMEMBRANE SPACE',12,22,{s:12*k,w:700,c:PAL['cv-soft']});
    txt(ctx,'MATRIX',12,442,{s:12*k,w:700,c:PAL['cv-soft']});
    // H+ ions accumulated in the intermembrane space
    const nH=Math.round(4+s.G*72),jit=RM?0:1.6;ctx.fillStyle=PAL['cv-h'];
    for(let i=0;i<nH&&i<v.hpos.length;i++){const q=v.hpos[i];ctx.beginPath();ctx.arc(q[0]+Math.sin(t*1.7+q[2])*jit,q[1]+Math.cos(t*1.3+q[2])*jit,4.2,0,6.29);ctx.fill();}
    ctx.globalAlpha=.75;for(const q of v.mpos){ctx.beginPath();ctx.arc(q[0]+Math.sin(t+q[1])*jit,q[1],4.2,0,6.29);ctx.fill();}ctx.globalAlpha=1;
    // proteins
    const lab=(s_,x,y,sz)=>txt(ctx,s_,x,y,{s:sz*k,w:700,c:'#fff',a:'center',b:'middle'});
    ctx.fillStyle='#3f6fb0';rr(ctx,70,160,82,104,14);ctx.fill();rr(ctx,88,250,52,78,14);ctx.fill();
    ctx.fillStyle='#5d72a0';rr(ctx,190,204,44,62,10);ctx.fill();rr(ctx,194,258,36,42,10);ctx.fill();
    ctx.fillStyle='#2a8276';rr(ctx,300,156,62,116,14);ctx.fill();
    ctx.fillStyle='#7a4fa6';rr(ctx,440,156,62,118,14);ctx.fill();
    ctx.fillStyle='#cf8619';ctx.beginPath();ctx.ellipse(268,212,15,11,0,0,6.29);ctx.fill();
    ctx.fillStyle='#c4533b';ctx.beginPath();ctx.arc(405,147,14,0,6.29);ctx.fill();
    if(hon){lab('I',111,205,18);lab('II',212,232,15);lab('III',331,214,18);lab('IV',471,214,18);lab('Q',268,213,12);lab('c',405,148,13);}
    else{lab('Pump',111,205,13);lab('Pump',331,214,13);lab('Pump',471,214,13);}
    // ATP synthase: F0 rotor ring in membrane, stalk, F1 head in matrix
    v.rot+=s.Rs*0.012*vdt;
    ctx.fillStyle='#8e1023';rr(ctx,616,176,68,68,12);ctx.fill();
    for(let i=0;i<8;i++){const a=v.rot+i*Math.PI/4,c=Math.cos(a);if(c<0)continue;const x=650+28*Math.sin(a);
      ctx.fillStyle=c>.5?'#e0455f':'#b5122d';rr(ctx,x-5,180,10,60,5);ctx.fill();}
    ctx.fillStyle='#8e1023';ctx.fillRect(645,244,10,46);
    ctx.strokeStyle='#8e1023';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(684,236);ctx.quadraticCurveTo(700,270,690,300);ctx.stroke();
    [[624,322,'#b5122d'],[650,326,'#e0455f'],[676,322,'#b5122d'],[637,302,'#e0455f'],[663,302,'#b5122d']].forEach(c=>{ctx.fillStyle=c[2];ctx.beginPath();ctx.arc(c[0],c[1],17,0,6.29);ctx.fill();});
    txt(ctx,'ATP synthase',704,326,{s:13*k,w:700});
    // entry / exit labels
    if(p.carrier==='NADH'||!hon)txt(ctx,hon?'NADH → NAD⁺':'Electrons from food',115,350,{s:12.5*k,w:600,a:'center'});
    if(hon&&p.carrier==='FADH2')txt(ctx,'FADH₂ → FAD',212,322,{s:12.5*k,w:600,a:'center'});
    txt(ctx,hon?'O₂ + H⁺ → H₂O':'Oxygen catches electrons',470,352,{s:12.5*k,w:600,a:'center'});
    if(ap){pill(ctx,p.carrier==='NADH'?'4 H⁺':'0 H⁺',111,120,PAL['card'],PAL['cv-ink'],11*k);pill(ctx,'4 H⁺',331,120,PAL['card'],PAL['cv-ink'],11*k);pill(ctx,'2 H⁺',470,120,PAL['card'],PAL['cv-ink'],11*k);pill(ctx,'≈4 H⁺ per ATP',650,120,PAL['card'],PAL['cv-ink'],11*k);}
    // fuel & oxygen tokens in the matrix
    const nf=Math.round(p.fuel/100*5);for(let i=0;i<nf;i++)txt(ctx,(hon&&p.carrier==='FADH2')?'FADH₂':'NADH',40+i*38+(i%2)*6,392+(i%2)*22,{s:12*k,w:600,c:PAL['cv-soft']});
    const no=Math.round(p.o2/100*6);for(let i=0;i<no;i++)txt(ctx,'O₂',400+i*32,392+(i%2)*22,{s:13*k,w:700,c:PAL['cv-soft']});
    // blockers
    if(p.cn){ctx.strokeStyle='#d32f2f';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(446,166);ctx.lineTo(496,264);ctx.moveTo(496,166);ctx.lineTo(446,264);ctx.stroke();pill(ctx,'Cyanide',470,92,'#d32f2f','#fff',12*k);}
    if(p.oligo){ctx.strokeStyle='#e08a00';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(620,180);ctx.lineTo(680,240);ctx.moveTo(680,180);ctx.lineTo(620,240);ctx.stroke();pill(ctx,'Oligomycin',650,92,'#b86e00','#fff',12*k);}
    if(p.dnp){pill(ctx,'DNP',560,92,'#6a32d0','#fff',12*k);ctx.fillStyle=PAL['cv-dnp'];
      [530,556,582,720,746,772].forEach((x,i)=>{const y=210+Math.sin(t*3+i*1.3)*30;ctx.beginPath();ctx.moveTo(x,y-7);ctx.lineTo(x+6,y);ctx.lineTo(x,y+7);ctx.lineTo(x-6,y);ctx.closePath();ctx.fill();});}
    // spawn animated particles in proportion to the model's rates
    v.eAcc+=s.Je*0.55*vdt;while(v.eAcc>=1){v.eAcc--;v.e.push({d:0,path:(hon&&p.carrier==='FADH2')?PATH_F:PATH_N});}
    const pumps=(hon&&p.carrier==='FADH2')?[[331,4],[470,2]]:[[111,4],[331,4],[470,2]];const tw=pumps.reduce((a,b)=>a+b[1],0);
    v.pAcc+=s.P*0.05*vdt;while(v.pAcc>=1){v.pAcc--;let r=R()*tw,x=pumps[0][0];for(const q of pumps){if(r<q[1]){x=q[0];break;}r-=q[1];}v.p.push({x:x+R()*18-9,y:262,vy:-120,end:60+R()*80,c:'h'});}
    v.sAcc+=s.Rs*0.05*vdt;while(v.sAcc>=1){v.sAcc--;v.p.push({x:650+R()*10-5,y:140,vy:120,end:300,c:'h'});}
    if(p.dnp){v.lAcc+=(s.Rl-5*s.G)*0.05*vdt;while(v.lAcc>=1){v.lAcc--;const x=R()<.5?520+R()*70:710+R()*80;v.p.push({x,y:150,vy:120,end:280,c:'l'});}}
    v.aAcc+=(s.Rs/4)*0.32*vdt;while(v.aAcc>=1){v.aAcc--;v.atp.push({x:650,y:345,vx:R()*80-40,vy:20+R()*40,life:1.6});}
    v.wAcc+=(s.Je/2)*0.3*vdt;while(v.wAcc>=1){v.wAcc--;v.w.push({x:470,y:300,vx:R()*30-15,vy:22,life:1.4});}
    // electrons
    for(const e of v.e){e.d+=230*vdt;const q=e.path.at(e.d);ctx.fillStyle=PAL['cv-e'];ctx.strokeStyle=PAL['cv-estroke'];ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(q[0],q[1],4.6,0,6.29);ctx.fill();ctx.stroke();}
    v.e=v.e.filter(e=>e.d<e.path.L);
    // moving H+
    for(const h of v.p){h.y+=h.vy*vdt;ctx.fillStyle=PAL['cv-h'];ctx.beginPath();ctx.arc(h.x,h.y,4.4,0,6.29);ctx.fill();if(h.c==='l'){ctx.strokeStyle=PAL['cv-dnp'];ctx.lineWidth=2;ctx.stroke();}}
    v.p=v.p.filter(h=>h.vy<0?h.y>h.end:h.y<h.end);
    for(const a of v.atp){a.x+=a.vx*vdt;a.y+=a.vy*vdt;a.life-=vdt;ctx.globalAlpha=clamp(a.life/1.6,0,1);txt(ctx,'ATP',a.x,a.y,{s:13*k,w:800,c:PAL['cv-atp'],a:'center'});}
    for(const a of v.w){a.x+=a.vx*vdt;a.y+=a.vy*vdt;a.life-=vdt;ctx.globalAlpha=clamp(a.life/1.4,0,1)*.8;txt(ctx,'H₂O',a.x,a.y,{s:11.5*k,w:600,c:PAL['cv-sub'],a:'center'});}
    ctx.globalAlpha=1;v.atp=v.atp.filter(a=>a.life>0);v.w=v.w.filter(a=>a.life>0);
    if(v.e.length>200)v.e.splice(0,v.e.length-200);if(v.p.length>300)v.p.splice(0,v.p.length-300);
    // legend
    const ly=438;ctx.fillStyle=PAL['cv-e'];ctx.beginPath();ctx.arc(600,ly-4,4.6,0,6.29);ctx.fill();txt(ctx,'electron',610,ly,{s:12*k,c:PAL['cv-soft']});
    ctx.fillStyle=PAL['cv-h'];ctx.beginPath();ctx.arc(690,ly-4,4.4,0,6.29);ctx.fill();txt(ctx,'H⁺ ion',700,ly,{s:12*k,c:PAL['cv-soft']});
  }
};
Object.assign(RESP,{
  scale:'Zoomed in on the inner membrane of one mitochondrion. This strip is about 100 nanometers wide, roughly 1/800 the width of a human hair.',
  narrate(sim){const p=sim.p,s=sim.st,hon=atLeast('honors'),atp=(s.Rs/4).toFixed(1);
    if(p.cn)return '<b>Cyanide is jamming Complex IV.</b> Electrons can’t reach oxygen, so the whole chain stops. The H⁺ gradient drains away and ATP production collapses.';
    if(p.o2<5)return '<b>No oxygen is catching electrons at the end of the chain.</b> Electrons back up, the pumps stop, and ATP production falls to nothing.';
    if(p.oligo)return '<b>ATP synthase is blocked.</b> H⁺ piles up outside until the pumps can’t push any more, so electron flow slows to a trickle and oxygen use drops.';
    if(p.dnp)return '<b>DNP is letting H⁺ leak straight back through the membrane.</b> The pumps race and oxygen use climbs, but the energy escapes as heat instead of making ATP ('+atp+' per second).';
    if(p.fuel<8)return '<b>Almost no fuel.</b> With few electrons arriving, the pumps barely run and the gradient fades.';
    if(hon&&p.carrier==='FADH2')return 'FADH₂ hands its electrons to Complex II, which skips Complex I. Fewer H⁺ get pumped per pair of electrons, so ATP synthase makes only <b>'+atp+' ATP per second</b>.';
    return 'Electrons flow down the chain and the '+(hon?'complexes':'pumps')+' push H⁺ up into the space above. The H⁺ rush back down through ATP synthase, making <b>'+atp+' ATP every second</b>.';},
  tour:[
    {title:'Where we are',text:{bio:'This is the inner membrane of one mitochondrion, the cell’s power plant. Every cell in your body has hundreds of these. The membrane separates the <b>intermembrane space</b> (top) from the <b>matrix</b> (bottom).',honors:'The inner mitochondrial membrane separates the intermembrane space (top) from the matrix (bottom). The electron transport chain and ATP synthase are embedded in it.'},focus:[0,150,800,110]},
    {title:'Electrons arrive',text:{bio:'Food you ate was broken down earlier into carriers loaded with high-energy electrons. Watch the yellow dots: electrons enter at the first pump.',honors:'NADH from glycolysis and the Krebs cycle drops off two high-energy electrons at Complex I. Watch the yellow dots enter.'},focus:[60,150,110,215],speed:0.1},
    {title:'Electrons power the pumps',text:{bio:'As electrons pass from pump to pump, they release energy. The pumps use it to push H⁺ ions (pink) up across the membrane.',honors:'Electrons pass I → Q → III → cytochrome c → IV, dropping in energy at each step. Complexes I, III and IV use that energy to pump H⁺ into the intermembrane space.'},focus:[60,110,460,170],speed:0.1},
    {title:'Oxygen catches the electrons',text:{bio:'At the end of the chain, oxygen grabs the used-up electrons and joins with H⁺ to make water. No oxygen means nowhere for electrons to go.',honors:'O₂ is the final electron acceptor. At Complex IV it takes the electrons and H⁺ to form H₂O. Without O₂ the chain backs up and stops.'},focus:[425,150,95,215],speed:0.1},
    {title:'The gradient builds',text:'H⁺ ions crowd into the space above the membrane, like water piling up behind a dam. More H⁺ above than below means stored energy.',focus:[0,0,800,170],speed:0.4},
    {title:'ATP synthase spins',text:{bio:'H⁺ flow back down through ATP synthase, a tiny rotary machine. As it spins, it snaps phosphate onto ADP to make ATP, the energy your cells spend.',honors:'H⁺ diffuse back down their gradient through ATP synthase. The flow turns its rotor, which drives ADP + Pᵢ → ATP. This is chemiosmosis.'},focus:[605,110,130,270],speed:0.25},
    {lvl:'honors',title:'FADH₂ enters later',text:'FADH₂ drops its electrons at Complex II, which does not pump H⁺. Switch the carrier to FADH₂ and compare ATP output.',focus:[180,190,70,140],speed:0.25,setup(sim){BioLab.setValues(sim,{carrier:'FADH2'});}},
    {lvl:'ap',title:'Counting protons',text:'Per NADH: 4 + 4 + 2 = 10 H⁺ pumped. ATP synthase needs about 3 H⁺ per ATP, plus 1 to import phosphate, so roughly 4 H⁺ per ATP. 10 ÷ 4 = 2.5 ATP per NADH, and 6 ÷ 4 = 1.5 per FADH₂.',focus:[50,100,730,45],pause:true,setup(sim){BioLab.setValues(sim,{carrier:'NADH'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{carrier:'NADH'});},
  lab:{bio:'<p><b>Question:</b> How does the amount of oxygen affect ATP production?</p><ol><li>Leave fuel at 80%.</li><li>Record a trial at oxygen 100, 75, 50, 25, 10 and 0%. Let each one settle for a few seconds first.</li><li>On the Trials graph, plot oxygen (x) against ATP made (y).</li></ol><p>Write a claim about oxygen and ATP, and support it with two numbers from your table.</p>',
       honors:'<p><b>Question:</b> How do different poisons affect oxygen use and ATP production?</p><ol><li>Record a baseline trial.</li><li>Record one trial each with cyanide, then oligomycin (turn the first one off before the next).</li><li>Record NADH and FADH₂ trials with no poisons.</li></ol><p>Explain why oligomycin lowers oxygen use even though it acts on ATP synthase, not on the electron chain.</p>',
       ap:'<p><b>Question:</b> How tightly is electron transport coupled to ATP synthesis?</p><ol><li>Record baseline, oligomycin, DNP and cyanide trials, with NADH and then FADH₂.</li><li>For each, compare O₂ use, ATP made and the P/O ratio.</li></ol><p><b>Claim–evidence–reasoning:</b> Use your data to explain respiratory control and why uncouplers like DNP raise body temperature.</p>'},
  terms:[{t:'Electron transport chain',d:'Proteins in the inner membrane that pass electrons along and use their energy to pump H⁺.'},{t:'ATP synthase',d:'A rotary enzyme that makes ATP as H⁺ flow through it.'},{t:'H⁺ gradient',d:'More H⁺ on one side of the membrane than the other. It stores energy, like water behind a dam.'},
    {lvl:'honors',t:'Chemiosmosis',d:'Making ATP using the energy of H⁺ flowing down their gradient through ATP synthase.'},{lvl:'honors',t:'Final electron acceptor',d:'O₂. It takes electrons at the end of the chain and forms water.'},{lvl:'honors',t:'NADH / FADH₂',d:'Electron carriers made in glycolysis and the Krebs cycle.'},
    {lvl:'ap',t:'Proton-motive force',d:'The combined pH and voltage difference across the membrane that drives H⁺ back through ATP synthase.'},{lvl:'ap',t:'Uncoupler',d:'A molecule, like DNP, that lets H⁺ leak across the membrane, so energy becomes heat instead of ATP.'},{lvl:'ap',t:'P/O ratio',d:'ATP made per oxygen atom reduced: about 2.5 for NADH and 1.5 for FADH₂.'}]
});
BioLab.register(RESP);
})();
