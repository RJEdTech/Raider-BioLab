(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT}=BioLab.h;

/* Agar blocks with phenolphthalein (pink when basic) soak in vinegar. Acid moves in from every
   face to depth d, with d² growing at 2D per minute. The volume reached is the block minus an
   untouched core of (a−2d)(b−2d)(c−2d). */
const D20=0.0125;                       // cm²/min at 20 °C: a 1 cm cube clears in about 10 min
const SLOTS=[140,400,660],NAMES=['A','B','C'],KEYS=['sA','sB','sC'];
const Dnow=p=>D20*(1+0.03*(p.temp-20));
function dims(s,shape){return shape==='slab'?[2*s,2*s,s/4]:shape==='rod'?[4*s,s/2,s/2]:[s,s,s];}
const fmtc=x=>(Math.round(x*100)/100).toString();
function shapeName(s,shape){const d=dims(s,shape);return shape==='cube'?fmtc(s)+' cm cube':d.map(fmtc).join(' × ')+' cm '+shape;}
function geo(s,shape){const [a,b,c]=dims(s,shape);return {a,b,c,SA:2*(a*b+b*c+a*c),V:a*b*c};}
function reached(s,shape,d){const g=geo(s,shape);const core=Math.max(0,g.a-2*d)*Math.max(0,g.b-2*d)*Math.max(0,g.c-2*d);return 100*(1-core/g.V);}
function tClear(s,shape,p){const g=geo(s,shape),m=Math.min(g.a,g.b,g.c)/2;return m*m/(2*Dnow(p));}
const shapeOf=p=>atLeast('ap')?p.shape:'cube';

const PINK=['#e0569d','#c53f86','#f07ab5'];
function isoBox(ctx,cx,cy,a,b,c,z0,P,fill,stroke){
  const pt=(x,y,z)=>[cx+(x-y)*P*0.866,cy+(x+y)*P*0.5-(z+z0)*P];
  const faces=[[[-a/2,-b/2,c],[a/2,-b/2,c],[a/2,b/2,c],[-a/2,b/2,c]],[[a/2,-b/2,0],[a/2,b/2,0],[a/2,b/2,c],[a/2,-b/2,c]],[[-a/2,b/2,0],[a/2,b/2,0],[a/2,b/2,c],[-a/2,b/2,c]]];
  faces.forEach((f,i)=>{ctx.beginPath();f.forEach((v,j)=>{const q=pt(v[0],v[1],v[2]);j?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});ctx.closePath();ctx.fillStyle=fill[i];ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.3;ctx.stroke();}});}

const SAV={
  id:'sav',hash:'sav',apUnit:2,order:3,kind:'Simulation',tab:'Cell size and diffusion',
  card:'Soak agar cubes in vinegar and watch the pink fade. Find out why cells stay small.',
  title:'Cell size and diffusion: the agar cube lab',
  lede:{bio:'Cells get food and oxygen by diffusion through their surface. Soak three agar “cells” in acid and see how far it gets into each one.',
        honors:'Compare surface area to volume for different cube sizes, and test how temperature changes the rate of diffusion.',
        ap:'Diffusion distance grows with the square root of time. Change the shape of the cell while keeping its volume, and see why cells are small, flat or long and thin.'},
  scale:'Real lab scale: agar blocks 0.5 to 4 cm on a side, soaking for about an hour. Real cells are about 10 to 100 µm, a thousand times smaller.',
  timeScale:1,dtMax:0.05,prewarm:0,sampleDt:0.25,window:100,unit:'min',chChange:1,chReveal:11,
  controls:[
    {id:'sA',label:'Cube A side',type:'range',min:0.5,max:4,step:0.5,def:1,unit:' cm',lvl:'bio',onChange(sim){sim.st.d2=0;sim.st.soak=0;}},
    {id:'sB',label:'Cube B side',type:'range',min:0.5,max:4,step:0.5,def:2,unit:' cm',lvl:'bio',onChange(sim){sim.st.d2=0;sim.st.soak=0;}},
    {id:'sC',label:'Cube C side',type:'range',min:0.5,max:4,step:0.5,def:3,unit:' cm',lvl:'bio',onChange(sim){sim.st.d2=0;sim.st.soak=0;}},
    {id:'temp',label:'Vinegar temperature',type:'range',min:5,max:40,step:1,def:20,unit:' °C',lvl:'honors',help:'Warmer molecules move faster, so diffusion speeds up.'},
    {id:'shape',label:'Shape (same volume)',type:'seg',def:'cube',lvl:'ap',options:[{v:'cube',l:'Cube'},{v:'slab',l:'Flat slab'},{v:'rod',l:'Long rod'}],
     help:'A slab is 2s × 2s × s/4. A rod is 4s × s/2 × s/2.',onChange(sim){sim.st.d2=0;sim.st.soak=0;}}
  ],
  init(){return {d2:0,soak:0};},
  step(sim,dt){const s=sim.st;s.d2+=2*Dnow(sim.p)*dt;s.soak+=dt;},
  metrics:[
    ...NAMES.map((n,i)=>({id:'p'+n,label:'Cube '+n+' reached',unit:'% of volume',lvl:'bio',min:0,max:100,d:0,get:s=>reached(s.p[KEYS[i]],shapeOf(s.p),Math.sqrt(s.st.d2))})),
    ...NAMES.map((n,i)=>({id:'r'+n,label:'Cube '+n+' SA:V',unit:'per cm',lvl:'bio',min:0,max:12,d:1,get:s=>{const g=geo(s.p[KEYS[i]],shapeOf(s.p));return g.SA/g.V;}})),
    {id:'depth',label:'Acid depth',unit:'cm',lvl:'honors',min:0,max:2,d:2,get:s=>Math.sqrt(s.st.d2)},
    {id:'tA',label:'Time to clear cube A',unit:'min',lvl:'ap',min:0,max:null,d:1,get:s=>tClear(s.p.sA,shapeOf(s.p),s.p)}
  ],
  graphs:[{id:'pct',label:'% of volume reached',lines:['pA','pB','pC'],min:0,max:118,yl:'% of volume reached'},{id:'depth',label:'Acid depth',lvl:'honors',lines:['depth']}],
  defaultGraph:'pct',
  narrate(sim){const p=sim.p,s=sim.st,d=Math.sqrt(s.d2),sh=shapeOf(p),pc=NAMES.map((n,i)=>reached(p[KEYS[i]],sh,d)),r=NAMES.map((n,i)=>{const g=geo(p[KEYS[i]],sh);return g.SA/g.V;});
    if(s.soak<0.3)return 'The agar blocks just went into the vinegar. Acid starts moving in from every face at the same speed.';
    if(pc.every(x=>x>=99.95))return '<b>All three blocks are completely clear.</b> The block with the largest surface area for its volume finished first.';
    const lo=pc.indexOf(Math.min(...pc)),hi=pc.indexOf(Math.max(...pc));
    return 'After '+s.soak.toFixed(0)+' min the acid has moved <b>'+d.toFixed(2)+' cm</b> into every block. Block '+NAMES[hi]+' is '+pc[hi].toFixed(0)+'% clear (SA:V '+r[hi].toFixed(1)+'), but block '+NAMES[lo]+' is only '+pc[lo].toFixed(0)+'% (SA:V '+r[lo].toFixed(1)+'). Its center is still far from any surface.';},
  tour:[
    {title:'The setup',text:'Each block is agar, a gel, mixed with phenolphthalein: an indicator that is pink when basic and clear when acidic. The blocks soak in vinegar, an acid. Think of each block as a model cell.',focus:[0,0,800,280],speed:0.3},
    {title:'Acid moves in from every face',text:'Acid molecules diffuse into the block from all six faces at once. The clear outer shell is where acid has arrived. The pink core hasn’t been reached yet.',focus:[20,52,240,222],speed:0.6},
    {title:'The same depth for every block',text:'Slice each block through the middle. The clear border is the same thickness in all three: acid diffuses the same distance no matter how big the block is.',focus:[0,282,800,92],speed:1},
    {title:'Small blocks finish first',text:'Speeding up. The small block clears completely while the big one still has a pink center. Its middle is simply too far from the surface.',focus:[0,0,800,450],speed:4},
    {title:'Surface area vs. volume',text:'When a cube’s side doubles, its surface area becomes 4 times bigger but its volume becomes 8 times bigger. Surface area to volume (SA:V) is cut in half.',focus:[0,378,800,46],pause:true},
    {title:'Why cells stay small',text:'A cell takes in oxygen and food through its surface but uses them throughout its volume. A large cell would starve in the middle. That is why big organisms are made of trillions of tiny cells.',focus:[0,0,800,450],pause:true},
    {lvl:'ap',title:'Shape matters too',text:'Same volume, different shape. A flat slab has a much larger SA:V, so acid reaches its center in minutes. Red blood cells are flat discs, and neurons are long and thin, for the same reason.',focus:[0,0,800,450],speed:2,setup(sim){BioLab.setValues(sim,{shape:'slab'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{shape:'cube'});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'All three blocks soak in the same vinegar. Which one turns completely clear first?',
     choices:['The biggest block','The smallest block','They all clear at the same time'],correct:1,change:{},changeText:'Soaking',watch:'pct',
     explain:'Acid moves into every block the same distance per minute. The small block’s center is only 0.5 cm from the surface, so it clears first, while bigger blocks still have pink centers.'},
    {lvl:'bio',q:'Cube A’s side doubles from 1 cm to 2 cm. What happens to its surface-area-to-volume ratio (SA:V)?',
     choices:['It doubles','It is cut in half','It stays the same'],correct:1,change:{sA:2},changeText:'Cube A is now 2 cm',watch:'pct',reveal:2.5,
     explain:'SA goes from 6 to 24 cm² (×4), but volume goes from 1 to 8 cm³ (×8). SA:V drops from 6 to 3 per cm. Bigger cells have relatively less surface to feed their insides.'},
    {lvl:'honors',q:'After 10 minutes, about how much of the 3 cm cube has the acid reached?',
     choices:['All of it','About 70%','Under 10%'],correct:1,change:{},changeText:'Soaking for 10 minutes',watch:'pct',reveal:10,
     explain:{honors:'After 10 min the acid is 0.5 cm deep. The untouched core is 3 − 1 = 2 cm across: (2/3)³ ≈ 30% of the volume. So about 70% has been reached. Most of a cube’s volume is near its surface.'}},
    {lvl:'honors',q:'You warm the vinegar from 20 °C to 35 °C. How does that change the time for cube A to clear?',
     choices:['Faster','Slower','No change'],correct:0,change:{temp:35},changeText:'Vinegar warmed to 35 °C',watch:'pct',reveal:9,
     explain:{honors:'Warmer molecules move faster, so diffusion speeds up and the acid moves in farther each minute.'}},
    {lvl:'ap',q:'Keep the same volume but flatten each block into a thin slab. What happens to the time for acid to reach the center?',
     choices:['Longer','Much shorter','The same, because the volume is the same'],correct:1,change:{shape:'slab'},changeText:'Blocks flattened into slabs',watch:'pct',reveal:9,
     explain:{ap:'A 2 × 2 × 0.25 cm slab has SA 10 cm² vs 6 cm² for a 1 cm cube of the same volume, and no point is more than 0.125 cm from the surface. Time to clear scales with (half-thickness)², so it drops from 10 min to under 1 min.'}},
    {lvl:'ap',q:'Time for diffusion to reach the center of a cube scales with…',
     choices:['the side length','the side length squared','the side length cubed'],correct:1,instant:true,
     explain:'Diffusion distance grows as √(2Dt), so t = (s/2)² ÷ 2D. Doubling the side quadruples the time. A 10 µm cell is reached in milliseconds; a 1 cm cell would take minutes, far too slow for life.'}
  ],
  lab:{bio:'<p><b>Question:</b> How does cube size affect how much of the cube the acid reaches?</p><ol><li>Press Reset and let it run to exactly 10:00 on the clock, then pause.</li><li>Record a trial. Then try sides of 0.5, 1.5 and 2.5 cm, resetting each time.</li><li>On the Trials graph, plot Cube A SA:V (x) against Cube A reached (y).</li></ol><p>Use your data to explain why cells are small.</p>',
       honors:'<p><b>Question:</b> How does temperature affect diffusion?</p><ol><li>Record the acid depth at 10:00 for 10, 20, 30 and 40 °C (Reset between runs).</li><li>Plot temperature (x) against acid depth (y).</li></ol><p>Explain your result in terms of molecular motion.</p>',
       ap:'<p><b>Question:</b> How does the time to clear a cube depend on its size?</p><ol><li>Record “Time to clear cube A” for sides of 0.5, 1, 1.5, 2, 3 and 4 cm.</li><li>Plot side (x) against time (y), then time against side².</li><li>Repeat one size as a slab and as a rod.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain how cell shape can make up for cell size, using red blood cells or neurons as an example.</p>'},
  terms:[{t:'Diffusion',d:'Movement of molecules from higher to lower concentration, caused by their random motion.'},{t:'Surface area (SA)',d:'Total area of the outside. For a cube, 6 × side².'},{t:'Volume (V)',d:'Space inside. For a cube, side³.'},{t:'SA:V ratio',d:'Surface area divided by volume. It falls as a cell gets bigger.'},
    {lvl:'honors',t:'Indicator',d:'A chemical that changes color with pH. Phenolphthalein is pink when basic and clear when acidic.'},{lvl:'honors',t:'Concentration gradient',d:'A difference in concentration from one place to another. Diffusion runs down it.'},
    {lvl:'ap',t:'Diffusion distance',d:'Grows as √(2Dt). Doubling the distance takes 4 times as long.'},{lvl:'ap',t:'Diffusion coefficient (D)',d:'How fast a substance diffuses in a medium. Here 0.0125 cm²/min at 20 °C, rising with temperature.'}],
  about:'<p>Acid penetration depth d grows as d² = 2Dt, with D = 0.0125 cm²/min at 20 °C (+3% per °C). The volume reached is V − (a−2d)(b−2d)(c−2d). Time to clear = (half the smallest dimension)² ÷ 2D.</p><p>Simplified: the vinegar never runs out or weakens, and the color change is a sharp edge. In a real block the pink fades gradually across a fuzzy boundary. Changing a block’s size or shape starts it soaking fresh.</p>',
  draw(sim,ctx,vdt,k,t){
    const p=sim.p,s=sim.st,d=Math.sqrt(s.d2),sh=shapeOf(p);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const G=KEYS.map(key=>geo(p[key],sh));
    let P=40;G.forEach(g=>{P=Math.min(P,175/(0.5*(g.a+g.b)+g.c),228/((g.a+g.b)*0.866));});
    let P2=34;G.forEach(g=>{P2=Math.min(P2,220/g.a,68/g.b);});
    // vinegar tray
    ctx.fillStyle=PAL['cv-water'];rr(ctx,14,206,772,66,14);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.stroke();
    txt(ctx,'Vinegar (acid)',24,264,{s:12*k,w:600,c:PAL['cv-soft']});
    G.forEach((g,i)=>{const cx=SLOTS[i],cy=254-(g.a+g.b)*P*0.25;
      const ca=Math.max(0,g.a-2*d),cb=Math.max(0,g.b-2*d),cc=Math.max(0,g.c-2*d),pc=reached(p[KEYS[i]],sh,d);
      if(ca>0&&cb>0&&cc>0)isoBox(ctx,cx,cy,ca,cb,cc,d,P,[PINK[2],PINK[1],PINK[0]],null);
      isoBox(ctx,cx,cy,g.a,g.b,g.c,0,P,['rgba(236,240,242,0.55)','rgba(205,214,220,0.55)','rgba(220,228,232,0.55)'],PAL['cv-soft']);
      txt(ctx,'Block '+NAMES[i]+' · '+shapeName(p[KEYS[i]],sh),cx,24,{s:13*k,w:700,a:'center'});
      pill(ctx,pc.toFixed(0)+'% reached',cx,24+16*k,pc>=99.95?'#1b7339':PAL['card'],pc>=99.95?'#fff':PAL['cv-ink'],12*k);
      // slice through the middle
      const sy=328,w=g.a*P2,h=g.b*P2;ctx.fillStyle='rgba(225,232,236,0.9)';ctx.fillRect(cx-w/2,sy-h/2,w,h);
      if(ca>0&&cb>0&&cc>0){ctx.fillStyle=PINK[0];ctx.fillRect(cx-ca*P2/2,sy-cb*P2/2,ca*P2,cb*P2);}
      ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.3;ctx.strokeRect(cx-w/2,sy-h/2,w,h);
      txt(ctx,'SA '+fmtc(g.SA)+' cm²   V '+fmtc(g.V)+' cm³',cx,370+10*k,{s:12*k,c:PAL['cv-soft'],a:'center'});
      txt(ctx,'SA:V = '+(g.SA/g.V).toFixed(1)+' per cm',cx,374+24*k,{s:12.5*k,w:700,a:'center'});});
    txt(ctx,'Slice through the middle',14,296,{s:12*k,w:600,c:PAL['cv-soft']});
    // legend
    const ly=446;let lx=14;ctx.font='400 '+11.5*k+'px '+FONT;
    ctx.fillStyle=PINK[0];ctx.fillRect(lx,ly-10,12,12);lx+=17;txt(ctx,'not reached yet (pink)',lx,ly,{s:11.5*k,c:PAL['cv-soft']});lx+=ctx.measureText('not reached yet (pink)').width+14;
    ctx.fillStyle='rgba(225,232,236,0.9)';ctx.fillRect(lx,ly-10,12,12);ctx.strokeStyle=PAL['cv-soft'];ctx.strokeRect(lx,ly-10,12,12);lx+=17;txt(ctx,'acid reached (clear)',lx,ly,{s:11.5*k,c:PAL['cv-soft']});
  }
};
BioLab.register(SAV);
})();
