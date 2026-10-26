(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;

/* Water potential: a plant cell in an open beaker.
   Psi = Psi_p + Psi_s, with Psi_s = -iCRT (R = 0.0831 L·bar/(mol·K), T = °C + 273).
   Cell: fixed amount of solute (cell sap concentration at the starting size), so C = Csap / V.
   Wall: Psi_p = E·(V − 1) when the protoplast is bigger than the relaxed wall, else 0 (flaccid or plasmolyzed).
   Water: dV/dt = Lp·(Psi_solution − Psi_cell). Open beaker: Psi_p = 0, so Psi_solution = Psi_s. */
const R_GAS=0.0831,E_WALL=40,LP=0.015;
const I_OF={sucrose:1,nacl:2,cacl2:3},NAME={sucrose:'sucrose',nacl:'NaCl',cacl2:'CaCl₂'};
const CX=214,CY=262,W0=104,H0=70;
function calc(sim){const p=sim.p,s=sim.st,T=p.temp+273,i=I_OF[p.solute]||1;
  const Cc=p.csap/s.V,psisC=-1*Cc*R_GAS*T,psip=Math.max(0,E_WALL*(s.V-1)),psiC=psip+psisC,psiSol=-i*p.conc*R_GAS*T;
  return {T,i,Cc,psisC,psip,psiC,psiSol,d:psiSol-psiC};}
const state=V=>V<0.99?'Plasmolyzed':V>1.02?'Turgid':'Flaccid';
const f2=x=>(Math.abs(x)<0.005?0:x).toFixed(2);
const sg=x=>(x<0?'−':'')+f2(Math.abs(x));          // signed with a real minus
const sgp=x=>(x>0.004?'+':'')+sg(x);

const WP={
  id:'wpotential',hash:'wpotential',apUnit:2,order:6,kind:'Simulation',tab:'Water potential',
  prereq:['transport','potato'],
  card:'Put a plant cell in different solutions and watch Ψ = Ψp + Ψs and Ψs = −iCRT work out, number by number, as water moves.',
  title:'Water potential: Ψ = Ψp + Ψs, with Ψs = −iCRT',
  lede:{bio:'Water potential (Ψ) predicts which way water moves. Change the solution around a plant cell and watch both equations fill in with real numbers.',
        honors:'Calculate solute potential with Ψs = −iCRT, add pressure potential, and compare Ψ on each side of the membrane to predict the direction of osmosis.',
        ap:'Work the AP formula-sheet equations live: Ψ = Ψp + Ψs and Ψs = −iCRT. Test ionization, concentration and temperature, and see turgor and plasmolysis follow from the numbers.'},
  scale:'One plant cell, about 50 micrometers long, in an open beaker of solution. Values in bars (1 MPa = 10 bar).',
  timeScale:1,dtMax:0.01,prewarm:30,sampleDt:0.1,window:30,unit:'s',chChange:3,chReveal:16,
  controls:[
    {id:'conc',label:'Solution concentration',type:'range',min:0,max:1,step:0.01,def:0.10,unit:' M',lvl:'bio',help:'C for the solution in the beaker. 0 M is pure water.'},
    {id:'solute',label:'Solute in the beaker',type:'seg',def:'sucrose',lvl:'bio',options:[{v:'sucrose',l:'Sucrose (i = 1)'},{v:'nacl',l:'NaCl (i = 2)'},{v:'cacl2',l:'CaCl₂ (i = 3)'}],help:'i is how many particles each unit makes when it dissolves.'},
    {id:'csap',label:'Cell sap concentration',type:'range',min:0.1,max:0.6,step:0.01,def:0.30,unit:' M',lvl:'bio',help:'Solute inside the cell at its starting size. It gets more dilute as the cell swells.'},
    {id:'temp',label:'Temperature',type:'range',min:0,max:40,step:1,def:22,unit:' °C',lvl:'bio',help:'T in kelvin = °C + 273.'}
  ],
  actions:[{id:'fresh',label:'Fresh cell at starting size',lvl:'bio',run(sim){sim.st.V=1;}}],
  init(){return {V:1,flow:0};},
  step(sim,dt){const s=sim.st,c=calc(sim);const dV=LP*c.d;s.flow=dV;s.V=clamp(s.V+dV*dt,0.3,1.4);},
  metrics:[
    {id:'psic',label:'Ψ of the cell',unit:'bar',lvl:'bio',min:-30,max:0,d:2,get:s=>calc(s).psiC},
    {id:'psisol',label:'Ψ of the solution',unit:'bar',lvl:'bio',min:-30,max:0,d:2,get:s=>calc(s).psiSol},
    {id:'psisc',label:'Ψs of the cell',unit:'bar',lvl:'bio',min:-30,max:0,d:2,get:s=>calc(s).psisC},
    {id:'psip',label:'Ψp of the cell (wall pressure)',unit:'bar',lvl:'bio',min:0,max:16,d:2,get:s=>calc(s).psip},
    {id:'vol',label:'Cell size',unit:'% of start',lvl:'bio',min:30,max:140,d:0,get:s=>s.st.V*100},
    {id:'flow',label:'Water into the cell',unit:'% per s',lvl:'honors',min:-20,max:20,d:2,get:s=>s.st.flow*100}
  ],
  graphs:[
    {id:'psi',label:'Ψ cell vs. Ψ solution',lvl:'bio',lines:['psic','psisol'],min:-30,max:0,yl:'bar'},
    {id:'vol',label:'Cell size',lvl:'bio',lines:['vol']},
    {id:'parts',label:'Ψ = Ψp + Ψs for the cell',lvl:'bio',lines:['psisc','psip','psic'],min:-30,max:16,yl:'bar'}
  ],
  defaultGraph:'psi',
  challenges:[
    {lvl:'bio',q:'The cell is moved into pure water (0 M). What happens?',
     choices:['Water rushes in until the cell bursts','Water moves in until the wall pushes back hard enough to stop it','Water moves out of the cell'],correct:1,
     change:{conc:0},changeText:'Solution changed to pure water',watch:'vol',
     explain:'Pure water has Ψ = 0, higher than the cell, so water moves in. As the cell swells, the wall pushes back and Ψp rises. Water stops when Ψp + Ψs of the cell reaches 0, the same as the water. The wall keeps a plant cell from bursting.'},
    {lvl:'bio',q:'The solution is changed to 0.60 M sucrose. What happens to the cell?',
     choices:['Water leaves and the membrane pulls away from the wall (plasmolysis)','Water enters and the cell swells','Nothing, because sucrose cannot cross the membrane'],correct:0,
     change:{conc:0.6},changeText:'Solution changed to 0.60 M sucrose',watch:'vol',
     explain:'Ψ of 0.60 M sucrose is −(1)(0.60)(0.0831)(295) = −14.7 bar, far below the cell. Water leaves even though sucrose stays put. Ψp falls to 0 and the protoplast shrinks away from the wall until its sap is as concentrated as the solution.'},
    {lvl:'bio',instant:true,q:'What is Ψs of a 0.20 M NaCl solution at 27 °C?',choices:['−9.97 bar','−4.99 bar','−0.90 bar','+9.97 bar'],correct:0,
     explain:'Ψs = −iCRT = −(2)(0.20 mol/L)(0.0831 L·bar/mol·K)(300 K) = −9.97 bar. NaCl makes 2 particles (i = 2), and T must be in kelvin (27 + 273 = 300).'},
    {lvl:'bio',instant:true,q:'A cell has Ψs = −7.0 bar and Ψp = +3.0 bar. What is its water potential?',choices:['−4.0 bar','−10.0 bar','+4.0 bar','−21 bar'],correct:0,
     explain:'Ψ = Ψp + Ψs = (+3.0) + (−7.0) = −4.0 bar. Add them; do not multiply.'},
    {lvl:'honors',q:'The cell is at equilibrium in 0.15 M sucrose. The sucrose is swapped for 0.15 M NaCl. Which way does water move?',
     choices:['Out of the cell, because NaCl makes twice as many particles','Into the cell, because salt only pulls water out of animal cells','Neither way, because the molarity is the same'],correct:0,
     baseline:{conc:0.15,solute:'sucrose'},change:{solute:'nacl'},changeText:'Sucrose swapped for NaCl',watch:'vol',
     explain:'NaCl splits into Na⁺ and Cl⁻, so i = 2 and Ψs doubles from −3.68 to −7.35 bar. The solution’s Ψ is now lower than the cell’s, so water leaves. Count particles, not formula units.'},
    {lvl:'honors',instant:true,q:'The same solution warms from 22 °C to 37 °C. Its solute potential becomes…',choices:['More negative','Less negative','Unchanged'],correct:0,
     explain:'T is in the equation: Ψs = −iCRT. 310 K instead of 295 K makes Ψs about 5% more negative.'},
    {lvl:'ap',q:'The solution is changed to 0.30 M sucrose, the same as the cell sap. At equilibrium, the cell is…',
     choices:['Flaccid: Ψp is about 0','Turgid: Ψp is large','Plasmolyzed'],correct:0,
     change:{conc:0.3},changeText:'Solution changed to 0.30 M sucrose',watch:'psip',
     explain:'At its starting size the cell’s Ψs equals the solution’s, so water leaves only until the wall stops pushing. Ψp ends near 0 and Ψcell = Ψs = −7.35 bar. The cell is limp but not plasmolyzed: incipient plasmolysis.'},
    {lvl:'ap',instant:true,q:'Potato cores show 0% mass change in 0.35 M sucrose at 22 °C. What is the water potential of the potato cells?',choices:['−8.58 bar','−0.64 bar','−17.2 bar','+8.58 bar'],correct:0,
     explain:'At the zero point Ψcell = Ψsolution = −iCRT = −(1)(0.35)(0.0831)(295) = −8.58 bar. Using 22 instead of 295 K gives the −0.64 trap answer.'}
  ],
  initVis(sim){const r=rng(7),v=sim.vis;v.cell=[];for(let n=0;n<70;n++)v.cell.push([r()*2-1,r()*2-1]);
    v.out=[];for(let n=0;n<160;n++){let x,y;do{x=36+r()*356;y=112+r()*306;}while(Math.abs(x-CX)<W0*1.25+10&&Math.abs(y-CY)<H0*1.25+10);v.out.push([x,y,r()*6.28]);}
    v.drops=[];v.acc=0;},
  draw(sim,ctx,vdt,k,t){
    const p=sim.p,s=sim.st,v=sim.vis,c=calc(sim),R=Math.random,sm=k>=1.3,jit=RM?0:1;
    ctx.fillStyle=PAL['cv-bg']||PAL['card'];ctx.fillRect(0,0,800,450);
    // ---- beaker and solution ----
    ctx.fillStyle=PAL['cv-water'];ctx.globalAlpha=0.28+Math.min(0.3,p.conc*(I_OF[p.solute]||1)*0.12);ctx.fillRect(30,104,368,320);ctx.globalAlpha=1;
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(26,74);ctx.lineTo(26,428);ctx.lineTo(402,428);ctx.lineTo(402,74);ctx.stroke();
    txt(ctx,'Solution: '+(p.conc<0.005?'pure water':p.conc.toFixed(2)+' M '+NAME[p.solute]),30,30,{s:13*k,w:700});
    txt(ctx,'open beaker, so Ψp = 0',30,50,{s:11*k,c:PAL['cv-soft']});
    // solute particles outside
    const nOut=Math.min(160,Math.round(p.conc*(I_OF[p.solute]||1)*60));
    for(let n=0;n<nOut;n++){const q=v.out[n],x=q[0]+Math.sin(t*1.3+q[2])*3*jit,y=q[1]+Math.cos(t*1.1+q[2])*3*jit;
      ctx.fillStyle=p.solute==='sucrose'?'#c58b2a':(n%(I_OF[p.solute])===0?'#7a4fa6':'#2a8276');ctx.beginPath();ctx.arc(x,y,3.4,0,6.29);ctx.fill();}
    // ---- the plant cell ----
    const sw=s.V>1?1+(s.V-1)*0.55:1,WW=W0*sw,HH=H0*sw;
    const pf=s.V<1?Math.sqrt(s.V):1,PW=(WW-6)*pf,PH=(HH-6)*pf;
    ctx.fillStyle=PAL['cv-leaf'];ctx.globalAlpha=0.16;rr(ctx,CX-WW,CY-HH,WW*2,HH*2,26);ctx.fill();ctx.globalAlpha=1;
    if(s.V<0.99){ctx.fillStyle=PAL['cv-water'];ctx.globalAlpha=0.35;rr(ctx,CX-WW+4,CY-HH+4,WW*2-8,HH*2-8,22);ctx.fill();ctx.globalAlpha=1;}
    ctx.fillStyle='rgba(84,160,72,0.55)';rr(ctx,CX-PW,CY-PH,PW*2,PH*2,Math.max(10,22*pf));ctx.fill();
    ctx.strokeStyle='#2f7d32';ctx.lineWidth=2;rr(ctx,CX-PW,CY-PH,PW*2,PH*2,Math.max(10,22*pf));ctx.stroke();
    const VW=PW-14,VH=PH-14;ctx.fillStyle='rgba(120,170,235,0.75)';rr(ctx,CX-VW,CY-VH,VW*2,VH*2,Math.max(8,16*pf));ctx.fill();
    ctx.strokeStyle='#5f7f2a';ctx.lineWidth=7;rr(ctx,CX-WW,CY-HH,WW*2,HH*2,26);ctx.stroke();
    // cell sap solutes: fixed number, so they crowd together as the cell shrinks
    const nIn=Math.round(p.csap*110);ctx.fillStyle='#8a5a12';
    for(let n=0;n<nIn&&n<70;n++){const q=v.cell[n];ctx.beginPath();ctx.arc(CX+q[0]*(VW-6),CY+q[1]*(VH-6),3,0,6.29);ctx.fill();}
    // water drops crossing the membrane
    v.acc+=Math.min(30,Math.abs(s.flow)*900)*vdt;
    while(v.acc>=1){v.acc--;const a=R()*6.283,inn=s.flow>0;const ex=CX+Math.cos(a)*(WW+26),ey=CY+Math.sin(a)*(HH+22),ix=CX+Math.cos(a)*(PW-10),iy=CY+Math.sin(a)*(PH-10);
      v.drops.push(inn?{x:ex,y:ey,tx:ix,ty:iy,u:0}:{x:ix,y:iy,tx:ex,ty:ey,u:0});}
    ctx.fillStyle='#1d6fd6';
    for(const d of v.drops){d.u+=vdt*0.9;const x=d.x+(d.tx-d.x)*d.u,y=d.y+(d.ty-d.y)*d.u;ctx.globalAlpha=Math.min(1,4*(1-d.u));ctx.beginPath();ctx.arc(x,y,3.6,0,6.29);ctx.fill();}
    ctx.globalAlpha=1;v.drops=v.drops.filter(d=>d.u<1);if(v.drops.length>80)v.drops.splice(0,v.drops.length-80);
    // labels on the cell
    const st=state(s.V),stCol=st==='Plasmolyzed'?'#b3261e':st==='Turgid'?'#2a7a3a':'#8a6d00';
    pill(ctx,st,CX,CY-HH-26,stCol,'#fff',12*k);
    txt(ctx,'cell wall',CX+WW+8,CY-HH+6,{s:11*k,w:600,c:PAL['cv-soft']});
    txt(ctx,'vacuole (cell sap)',CX,CY+4,{s:11*k,w:700,c:'#16324f',a:'center'});
    const note=st==='Plasmolyzed'?'membrane pulled away from the wall':st==='Turgid'?'wall pushes back: Ψp = '+sgp(c.psip)+' bar':'wall barely pushing: Ψp ≈ 0';
    txt(ctx,note,CX,CY+HH+24,{s:12*k,w:700,c:stCol,a:'center'});
    const dir=Math.abs(c.d)<0.05?'no net water movement':c.d>0?'water moving INTO the cell':'water moving OUT of the cell';
    txt(ctx,dir,CX,412,{s:12*k,w:700,c:'#1d6fd6',a:'center'});
    // ---- the equations, with this moment's numbers ----
    const fs=13*Math.min(k,1.35),lh=fs*1.5,X0=436,tw=o=>Object.assign({s:fs,w:500,c:PAL['cv-ink']},o||{});
    const card=(y,h)=>{ctx.fillStyle=PAL['card']||PAL['cv-bg2'];rr(ctx,424,y,368,h,10);ctx.fill();ctx.strokeStyle=PAL['line']||PAL['cv-soft'];ctx.lineWidth=1;rr(ctx,424,y,368,h,10);ctx.stroke();};
    const C1=8,C1H=lh*6.4+8;card(C1,C1H);let y=C1+lh*0.95;
    txt(ctx,'PLANT CELL',X0,y,tw({s:fs*0.85,w:800,c:PAL['cv-soft']}));txt(ctx,'R = 0.0831 L·bar/(mol·K)',784,y,tw({s:fs*0.8,c:PAL['cv-soft'],a:'right'}));y+=lh;
    txt(ctx,'Ψs = −iCRT',X0,y,tw({w:800}));y+=lh;
    txt(ctx,'= −(1)('+c.Cc.toFixed(3)+' M)(0.0831)('+c.T+' K)',X0+18,y,tw());y+=lh;
    txt(ctx,'= '+sg(c.psisC)+' bar',X0+18,y,tw({w:700}));y+=lh;
    txt(ctx,'Ψp = '+sgp(c.psip)+' bar',X0,y,tw({w:700}));if(!sm)txt(ctx,c.psip>0.004?'(the wall pushing back)':'(the wall is not pushing)',X0+130,y,tw({s:fs*0.85,c:PAL['cv-soft']}));y+=lh;
    txt(ctx,(sm?'Ψ = ':'Ψ = Ψp + Ψs = ')+f2(c.psip)+' + ('+sg(c.psisC)+') = '+sg(c.psiC)+' bar',X0,y,tw({w:800,c:'#2a7a3a'}));
    const C2=C1+C1H+8,C2H=lh*4.4+8;card(C2,C2H);y=C2+lh*0.95;
    txt(ctx,'SOLUTION',X0,y,tw({s:fs*0.85,w:800,c:PAL['cv-soft']}));txt(ctx,NAME[p.solute]+': i = '+c.i,784,y,tw({s:fs*0.85,c:PAL['cv-soft'],a:'right'}));y+=lh;
    txt(ctx,'Ψs = −('+c.i+')('+p.conc.toFixed(2)+' M)(0.0831)('+c.T+' K)',X0,y,tw());y+=lh;
    txt(ctx,'= '+sg(c.psiSol)+' bar',X0+18,y,tw({w:700}));y+=lh;
    txt(ctx,'Ψp = 0, so Ψ = '+sg(c.psiSol)+' bar',X0,y,tw({w:800,c:'#1d6fd6'}));
    // verdict
    const C3=C2+C2H+8,C3H=450-C3-6;ctx.fillStyle=Math.abs(c.d)<0.05?'rgba(128,128,128,0.15)':'rgba(29,111,214,0.14)';rr(ctx,424,C3,368,C3H,10);ctx.fill();
    y=C3+lh*0.95;txt(ctx,'Water moves from higher Ψ to lower Ψ',X0,y,tw({s:fs*0.9,w:700}));y+=lh;
    const cmp=Math.abs(c.d)<0.05?'=':c.psiC>c.psiSol?'>':'<';
    txt(ctx,'cell '+sg(c.psiC)+'  '+cmp+'  solution '+sg(c.psiSol)+' bar',X0,y,tw({w:800}));y+=lh;
    if(y<446)txt(ctx,Math.abs(c.d)<0.05?'Equal, so no net movement: equilibrium':c.d>0?'→ water moves INTO the cell':'→ water moves OUT of the cell',X0,y,tw({w:800,c:Math.abs(c.d)<0.05?PAL['cv-ink']:'#1d6fd6'}));y+=lh;
    const osm=c.i*p.conc,ton=Math.abs(osm-c.Cc)<0.004?'isotonic to':osm<c.Cc?'hypotonic to':'hypertonic to';
    if(y<446&&!sm)txt(ctx,'Solution is '+ton+' the cell sap ('+osm.toFixed(2)+' vs '+c.Cc.toFixed(2)+' M particles)',X0,y,tw({s:fs*0.85,c:PAL['cv-soft']}));
  },
  narrate(sim){const c=calc(sim),s=sim.st,st=state(s.V);
    const a='Ψ solution = '+sg(c.psiSol)+' bar',b='Ψ cell = '+sg(c.psiC)+' bar';
    if(Math.abs(c.d)<0.05)return '<b>Equilibrium.</b> '+b+' and '+a+' are equal, so water crosses both ways at the same rate: no net movement. The cell is <b>'+st.toLowerCase()+'</b>'+(st==='Turgid'?', held firm by wall pressure (Ψp = '+sgp(c.psip)+' bar).':st==='Plasmolyzed'?': its sap has concentrated until it matches the solution.':'.');
    if(c.d>0)return '<b>Water moves into the cell</b> because the solution is higher ('+a+') than the cell ('+b+'). As the cell swells, the sap gets more dilute and the wall pushes back harder, so Ψ of the cell rises until the two match.';
    return '<b>Water moves out of the cell</b> because the cell is higher ('+b+') than the solution ('+a+'). '+(st==='Plasmolyzed'?'Ψp is 0 and the membrane has pulled away from the wall (plasmolysis). The sap keeps concentrating until the two Ψ values match.':'Wall pressure (Ψp) is falling as the cell loses water.');},
  tour:[
    {title:'The big equation',text:'Water potential (Ψ, “psi”) predicts which way water moves. Ψ = Ψp + Ψs: pressure potential plus solute potential. Water always moves from higher Ψ to lower Ψ.',focus:[424,8,368,140],speed:0.5},
    {title:'Solute potential: Ψs = −iCRT',text:'i = particles each unit makes (sucrose 1, NaCl 2, CaCl₂ 3). C = molar concentration in mol/L. R = 0.0831 L·bar/(mol·K), the pressure constant. T = temperature in kelvin (°C + 273). The minus sign means dissolved solute always makes Ψs negative; pure water is 0.',focus:[424,8,368,140],speed:0.5},
    {title:'Pressure potential: Ψp',text:'A swollen plant cell presses against its wall, and the wall presses back. That push is Ψp, and it raises the cell’s Ψ. An open beaker has nothing pushing, so its Ψp is 0.',focus:[24,60,384,380],speed:0.5},
    {title:'Compare, then predict',text:'Put the two Ψ values side by side. Water moves toward the lower (more negative) Ψ, and keeps moving until both are equal.',focus:[424,300,368,150],speed:0.5},
    {title:'Into strong sugar water',text:'Now the beaker holds 0.60 M sucrose: Ψ = −(1)(0.60)(0.0831)(295) = −14.7 bar, far below the cell. Water leaves, Ψp drops to 0, and the membrane pulls away from the wall: plasmolysis.',focus:[0,0,800,450],speed:0.6,setup(sim){BioLab.setValues(sim,{conc:0.6,solute:'sucrose'});}},
    {title:'Salt counts double',text:'0.30 M NaCl splits into Na⁺ and Cl⁻, so i = 2 and Ψs = −14.7 bar, exactly the same as 0.60 M sucrose. Count the particles, not the formula units.',focus:[424,148,368,110],speed:0.6,setup(sim){BioLab.setValues(sim,{conc:0.3,solute:'nacl'});}},
    {title:'Back into pure water',text:'Pure water has Ψ = 0, higher than the cell, so water rushes in. The wall pushes back and Ψp climbs until the cell’s Ψ reaches 0 too. The wall is why a plant cell does not burst.',focus:[0,0,800,450],speed:0.6,setup(sim){BioLab.setValues(sim,{conc:0,solute:'sucrose'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{conc:0.10,solute:'sucrose',csap:0.30,temp:22});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> How does the solution change the direction water moves?</p><ol><li>Record Ψ of the cell, Ψ of the solution and the cell size at 0, 0.1, 0.3, 0.5 and 0.8 M sucrose. Wait until the arrow says no net movement.</li><li>Mark each one turgid, flaccid or plasmolyzed.</li></ol><p>Write a rule that uses the two Ψ values to predict which way water moves.</p>',
       honors:'<p><b>Question:</b> Does the kind of solute matter, or only the molarity?</p><ol><li>At 0.20 M, record Ψ of the solution for sucrose, NaCl and CaCl₂.</li><li>Find the molarity of each one that gives Ψ = −9.8 bar.</li></ol><p>Explain the pattern using i in Ψs = −iCRT.</p>',
       ap:'<p><b>Question:</b> What is the solute potential of this cell’s sap?</p><ol><li>Find the sucrose concentration where the cell ends at 100% size with Ψp ≈ 0 (flaccid).</li><li>Calculate Ψs = −iCRT for that solution by hand, then check the cell card.</li><li>Repeat at 5 °C and 35 °C.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why the zero point of a potato-core lab gives the water potential of the cells, and why temperature changes the answer.</p>'},
  terms:[{t:'Water potential (Ψ)',d:'Predicts the direction of water movement. Ψ = Ψp + Ψs. Water moves from higher Ψ to lower Ψ. Pure water in an open container is 0.'},
    {t:'Solute potential (Ψs)',d:'Ψs = −iCRT. Always 0 or negative: the more solute, the more negative.'},
    {t:'Pressure potential (Ψp)',d:'Physical pressure on the water. Positive when a wall pushes on a swollen cell; 0 in an open beaker; negative (tension) in xylem.'},
    {t:'i (ionization constant)',d:'Particles made per formula unit when it dissolves: sucrose 1, NaCl 2, CaCl₂ 3.'},
    {t:'C (molar concentration)',d:'Moles of solute per liter (M).'},
    {t:'R (pressure constant)',d:'0.0831 L·bar/(mol·K), from the AP Biology formula sheet.'},
    {t:'T (temperature)',d:'In kelvin: °C + 273.'},
    {t:'Bar and MPa',d:'Units of pressure. 1 MPa = 10 bar.'},
    {t:'Turgid',d:'Swollen, with the wall pushing back (Ψp > 0). Plants stand upright this way.'},
    {t:'Flaccid',d:'Limp: the cell fills its wall but the wall is not pushing (Ψp ≈ 0).'},
    {t:'Plasmolysis',d:'The cell loses so much water that the membrane pulls away from the wall.'},
    {t:'Hypertonic / hypotonic',d:'A hypertonic solution has more solute (lower Ψ) than the cell; a hypotonic one has less (higher Ψ).'}],
  about:'<p>The cell holds a fixed amount of solute, so its concentration is C<sub>sap</sub>/V, where V is the cell’s size relative to its starting size and C<sub>sap</sub> is the setting. Cell Ψs = −(1)(C<sub>sap</sub>/V)RT. Wall pressure Ψp = 40 bar × (V − 1) when the cell is bigger than its relaxed wall, otherwise 0. The beaker is open, so its Ψ = −iCRT. Water moves at a rate proportional to the Ψ difference. T = °C + 273, as on the AP formula sheet.</p><p>Simplified: the wall is perfectly elastic, the solutes in the beaker never cross the membrane, i assumes complete dissociation, and the beaker is large enough that its concentration does not change. Real cells take minutes, not seconds, to reach equilibrium.</p>',
  thumbFrames:40
};
BioLab.register(WP);
})();
