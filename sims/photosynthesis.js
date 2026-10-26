(function(){
'use strict';
const {clamp,rng,rr,txt,pill,polyline,atLeast,PAL,FONT,RM}=BioLab.h;
const FILT={white:1,red:0.85,blue:0.95,green:0.2};
const FILTC={red:'rgba(220,40,40,',blue:'rgba(50,100,235,',green:'rgba(40,170,70,',white:'rgba(255,214,90,'};
/* ---------- Virtual lab bench: spinach leaf disks (Virtual lab mode; see VLAB.md) ----------
   Four cups of 10 infiltrated disks: tap water or 0.2% bicarbonate, in darkness or under the lamp.
   Each cup's net O₂ rate = light × CO₂ supply − respiration. Each disk floats when it has gained its own
   threshold of O₂, so float time = tau × threshold / net rate. Thresholds, a per-cup factor and a per-run
   leaf factor come from the lab's saved seed and the run number, so a reload never changes recorded data.
   The bench state (clock, run, counts at each reading) lives in sim.vlab.bench. */
function hr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
function hn(seed,a,b){const u=Math.max(1e-9,hr(seed,a,b)),w=hr(seed,a,b+100003);return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*w);}
const LD={
  cups:[{bic:false,light:false},{bic:false,light:true},{bic:true,light:false},{bic:true,light:true}],
  cols:['td','tl','bd','bl'],names:['Tap water + darkness','Tap water + light','Bicarbonate + darkness','Bicarbonate + light'],
  I:400,Ik:150,   // µmol photons/m²/s at the cups under the lamp, and the light half-saturation of the disks
  dicT:1.2,dicB:25,Kc:3, // mM dissolved inorganic carbon: tap water, and 0.2% NaHCO₃ (23.8 mM) + tap; CO₂ half-saturation
  R:0.05,         // respiration, as a share of the light- and CO₂-saturated rate
  tau:6.0,        // sets the median float time: about 10 min in bright light with bicarbonate
  sd:0.3,cupSd:0.08,runSd:0.15, // log-normal spread: disk to disk, cup to cup, lab run to lab run
  RISE:0.25,      // min a disk takes to rise from the bottom to the surface
  X:[110,300,490,680],RIM:150,BOT:386,SURF:176,TW:75,BW:59,
  ROWS:[0,2,4,6,8,10,12,14,16,18,20]};
const ldNet=c=>{const k=LD.cups[c],L=k.light?LD.I/(LD.I+LD.Ik):0,C=k.bic?LD.dicB:LD.dicT;return L*C/(C+LD.Kc)-LD.R;};
const FTC={};
function ldTimes(seed,att){const key=seed+':'+att;if(FTC[key])return FTC[key];const run=Math.exp(LD.runSd*hn(seed,700,att));
  const out=LD.cups.map((k,c)=>{const net=ldNet(c);if(net<=0)return Array(10).fill(Infinity);const cf=Math.exp(LD.cupSd*hn(seed,710+c,att));
    return Array.from({length:10},(_,i)=>LD.tau*Math.exp(LD.sd*hn(seed,800+c*16+i,att))/(net*run*cf));});
  return (FTC[key]=out);}
const ldCount=(ft,t)=>ft.filter(x=>x<=t+1e-9).length;
const ldB=sim=>sim.st&&sim.st.B&&sim.st.B.kind==='ld'&&sim.vlab?sim.st.B:null;
const ldStarted=b=>b.state==='running'||b.state==='done';
const mmssMin=m=>{const s=Math.max(0,Math.floor(m*60+1e-6));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
function ldInit(sim){const b=sim.vlab.bench;if(!Number.isFinite(b.att))b.att=0;if(!b.state)b.state='setup';if(!Number.isFinite(b.t))b.t=0;if(!Number.isFinite(b.next))b.next=2;
  if(b.disks&&!Array.isArray(b.counts))b.counts=[[0],[0],[0],[0]];return {kind:'ld',hold:false,holdAt:0};}
function ldStep(sim,dt){const B=sim.st.B,b=sim.vlab.bench;if(B.hold){if(!sim.running)return;B.hold=false;}
  if(b.state!=='running')return;const t1=b.t+dt;
  if(t1<b.next-1e-9){b.t=t1;return;}
  const at=b.next,r=Math.round(at/2),ft=ldTimes(sim.vlab.seed,b.att);b.t=at;for(let c=0;c<4;c++)b.counts[c][r]=ldCount(ft[c],at);b.next=at+2;
  if(at>=20)b.state='done';
  if(sim.p.pauseRead){B.hold=true;B.holdAt=at;BioLab.pause(sim);}}
/* the run a reading in the table belongs to: the current one once its clock has started, otherwise the last emptied one */
function ldRun(b){if(ldStarted(b))return {att:b.att,t:b.t,counts:b.counts};return b.last||null;}
function ldCheck(c){return (sim,tv,v)=>{const b=sim.vlab.bench,t=+tv,r=Math.round(t/2),cup='cup '+(c+1);
  if(v<0||v>10)return 'Each cup holds 10 disks, so the count is a whole number from 0 to 10.';
  if(Math.abs(v-Math.round(v))>1e-9)return 'Count whole disks.';
  if(t===0){if(!b.disks&&!b.last&&!ldStarted(b))return 'Add the leaf disks to the cups first, then count the floating disks.';
    return v===0?null:'Check your count. At 0 min, every disk in '+cup+' was still on the bottom.';}
  const run=ldRun(b);if(!run)return 'Turn on the lamp and start the clock first, then count the floating disks at each reading.';
  if(!(run.t>=t-1e-6))return 'The lab clock has not reached '+t+' min yet.';
  const ft=ldTimes(sim.vlab.seed,run.att)[c],lo=ldCount(ft,t-0.3),hi=ldCount(ft,t+LD.RISE+0.3);
  if(v>=lo&&v<=hi)return null;
  const n=run.counts&&run.counts[c]&&Number.isFinite(run.counts[c][r])?run.counts[c][r]:ldCount(ft,t);
  return 'Check your count. At '+t+' min, '+cup+' had '+n+' disk'+(n===1?'':'s')+' floating at the surface.';};}
function ldRateCheck(c){return (sim,v,V)=>{const n=V.col('t1',LD.cols[c]),pts=LD.ROWS.map((t,i)=>[t,n[i]]).filter(p=>Number.isFinite(p[1]));
  if(pts.length<3)return 'Fill in the column for '+LD.names[c].toLowerCase()+' in your table first.';
  if(v<0)return 'Disks only float up during this lab, so the rate should not be negative.';
  let mx=0;for(let i=0;i+1<pts.length;i++)mx=Math.max(mx,(pts[i+1][1]-pts[i][1])/(pts[i+1][0]-pts[i][0]));
  const a=pts[0],z=pts[pts.length-1],avg=z[0]>a[0]?(z[1]-a[1])/(z[0]-a[0]):0;
  if(Math.max(...pts.map(p=>p[1]))===0&&v>0)return 'Your table shows no floating disks in this cup. Check this rate against your own data.';
  if(v>mx*1.05+0.011)return 'This is faster than any stretch of your data for this cup. Divide the change in floating disks by the change in time over the straight part of the line.';
  if(v<avg*0.8-0.011)return 'This is slower than this cup’s average over the whole run. The straight, steep part of the line should give a rate at least that fast.';
  return null;};}
function ldNarrate(sim){const b=sim.vlab.bench,B=sim.st.B;
  if(!b.filled)return b.last?'The cups are empty and rinsed. Your data from the last run is still in your table.':'Four clear plastic cups stand on the bench under the lamp. Pour the solutions into them first.';
  if(!b.infil)return 'Tap water is in cups 1 and 2, and bicarbonate solution is in cups 3 and 4. Next, punch the leaf disks and infiltrate them so they sink.';
  if(!b.disks)return 'The syringe vacuum pulled the air out of the spaces inside the leaf disks, and solution flowed in. The disks are now denser than water. Add 10 to each cup.';
  if(!b.covered)return 'All 40 disks lie on the bottom of their cups. Put cups 1 and 3 in the dark box.';
  if(b.state==='setup')return 'Cups 1 and 3 are in the dark box. Count the floating disks for the 0 min row, then turn on the lamp and start the clock.';
  if(b.state==='done')return '<b>The lab clock reached 20:00.</b> Data collection is done. Check your table, then empty and rinse the cups.';
  if(B.hold)return '<b>Reading time: '+B.holdAt+' min.</b> The dark box is open. Count the disks floating at the surface of each cup, type the counts in the '+B.holdAt+' min row, then press Play.';
  return 'The lamp is on and the clock is running. A disk counts as floating once it reaches the surface.'+(sim.p.pauseRead?' The clock stops for the next count at '+b.next+' min.':' Count every 2 minutes on the lab clock.');}
function ldDisk(ctx,x,y,rot,sunk){ctx.save();ctx.translate(x,y);if(rot)ctx.rotate(rot);ctx.beginPath();ctx.ellipse(0,0,10.5,4.2,0,0,6.29);
  ctx.fillStyle=sunk?'#2f6b33':'#49a83f';ctx.fill();ctx.lineWidth=1.2;ctx.strokeStyle=sunk?'#173d1b':'#1f5e22';ctx.stroke();ctx.restore();}
const SURFX=[[-50,-25,0,25,50],[-38,-13,12,37,58]],BOTX=[[-44,-22,0,22,44],[-36,-14,8,30,48]],SLOT=[2,1,3,0,4];
function drawLD(sim,ctx,vdt,k){const b=sim.vlab.bench,B=sim.st.B,p=sim.p,fsz=(s,m)=>Math.min(s*k,m);
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,394,800,56);ctx.fillStyle=PAL['line'];ctx.fillRect(0,394,800,2);
  txt(ctx,'Leaf disk bench',16,30,{s:fsz(16,26),w:700});
  const st=[b.filled?'Solutions poured':'Cups empty',b.infil&&!b.disks?'40 infiltrated disks ready':null,b.disks?'10 disks per cup':null].filter(Boolean).join(' · ');
  txt(ctx,st,16,56,{s:fsz(12.5,21),c:PAL['cv-soft']});
  // lab clock
  const cx=554;ctx.fillStyle='#2b2f36';rr(ctx,cx,4,230,60,10);ctx.fill();txt(ctx,'LAB CLOCK',cx+12,28,{s:fsz(12,16),w:700,c:'#d7dbe0'});txt(ctx,'min:s',cx+12,50,{s:fsz(12,16),c:'#aab1b9'});
  ctx.fillStyle='#cfe3c8';rr(ctx,cx+114,10,108,48,6);ctx.fill();ctx.fillStyle='#1b2a1b';ctx.font='700 32px "Consolas","Menlo","DejaVu Sans Mono","Courier New",monospace';ctx.textAlign='right';ctx.textBaseline='middle';
  ctx.fillText(mmssMin(ldStarted(b)?b.t:0),cx+214,36);
  // lamp over all four cups
  const on=!!b.lamp;ctx.fillStyle=PAL['cv-lamp'];rr(ctx,24,68,752,24,6);ctx.fill();ctx.fillStyle=on?'#ffe28a':'#a9adb3';rr(ctx,36,90,728,7,3);ctx.fill();
  txt(ctx,'LAMP '+(on?'ON':'OFF'),400,81,{s:fsz(12,18),w:700,c:PAL['cv-bg'],a:'center',b:'middle'});
  if(on){const g=ctx.createLinearGradient(0,97,0,394);g.addColorStop(0,'rgba(255,214,90,.30)');g.addColorStop(1,'rgba(255,214,90,.05)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(36,97);ctx.lineTo(764,97);ctx.lineTo(800,394);ctx.lineTo(0,394);ctx.closePath();ctx.fill();}
  const ft=b.disks?ldTimes(sim.vlab.seed,b.att):null,T=ldStarted(b)?b.t:0,open=!sim.running||!!(B&&B.hold)||b.state!=='running';
  const hw=y=>LD.TW-(y-LD.RIM)/(LD.BOT-LD.RIM)*(LD.TW-LD.BW);
  LD.cups.forEach((cup,c)=>{const X=LD.X[c];
    if(b.filled){ctx.fillStyle=PAL['cv-water'];ctx.beginPath();ctx.moveTo(X-hw(LD.SURF),LD.SURF);ctx.lineTo(X+hw(LD.SURF),LD.SURF);ctx.lineTo(X+LD.BW,LD.BOT);ctx.lineTo(X-LD.BW,LD.BOT);ctx.closePath();ctx.fill();
      ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(X,LD.SURF,hw(LD.SURF),11,0,0,6.29);ctx.stroke();}
    if(ft){const f=ft[c],rank=f.map((x,i)=>i).sort((i,j)=>f[i]-f[j]),slot=[];rank.forEach((i,r)=>slot[i]=r);const sunk=[],up=[],moving=[];
      f.forEach((tf,i)=>{const bx=X+BOTX[i%2][i>>1],by=LD.BOT-12+(i%2)*8,s=slot[i],sx=X+SURFX[s%2][SLOT[s>>1]],sy=LD.SURF-4+(s%2)*9;
        if(T>=tf)up.push([sx,sy]);else if(T>tf-LD.RISE){const u=(T-(tf-LD.RISE))/LD.RISE,e=u*u*(3-2*u);moving.push([bx+(sx-bx)*u,by+(sy-by)*e,0.7*Math.sin(Math.PI*u)]);}
        else sunk.push([bx,by,cup.light&&on&&tf<1e9&&T/tf>0.45]);});
      sunk.sort((a,q)=>a[1]-q[1]).forEach(d=>{ldDisk(ctx,d[0],d[1],0,true);if(d[2]){ctx.fillStyle=PAL['cv-bubble'];ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=0.8;[[-5,-4],[4,-4.5]].forEach(o=>{ctx.beginPath();ctx.arc(d[0]+o[0],d[1]+o[1],1.6,0,6.29);ctx.fill();ctx.stroke();});}});
      moving.forEach(d=>ldDisk(ctx,d[0],d[1],d[2],false));up.sort((a,q)=>a[1]-q[1]).forEach(d=>ldDisk(ctx,d[0],d[1],0,false));}
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(X-LD.TW,LD.RIM);ctx.lineTo(X-LD.BW,LD.BOT);ctx.lineTo(X+LD.BW,LD.BOT);ctx.lineTo(X+LD.TW,LD.RIM);ctx.stroke();
    ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(X,LD.RIM,LD.TW,7,0,0,6.29);ctx.stroke();
    txt(ctx,(c+1)+' · '+(cup.bic?'Bicarbonate':'Tap water'),X,417,{s:fsz(14,24),w:700,a:'center'});
    txt(ctx,cup.light?'Light':'Darkness',X,440,{s:fsz(13,21),c:PAL['cv-soft'],a:'center'});
    // the dark box over cups 1 and 3: closed while the clock runs, open for each count
    if(b.covered&&!cup.light){if(!open){ctx.fillStyle='#23272e';rr(ctx,X-90,124,180,270,8);ctx.fill();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.stroke();
        txt(ctx,'Dark box',X,252,{s:fsz(15,24),w:700,c:'#f1f3f5',a:'center'});txt(ctx,'Opens at each count',X,278,{s:fsz(12,18),c:'#c9ced6',a:'center'});}
      else{ctx.fillStyle='rgba(20,22,26,.14)';rr(ctx,X-90,124,180,270,8);ctx.fill();ctx.setLineDash([7,5]);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;rr(ctx,X-90,124,180,270,8);ctx.stroke();ctx.setLineDash([]);
        if(!(B&&B.hold)&&b.state!=='done')txt(ctx,'Dark box open',X,138,{s:fsz(12,18),w:600,c:PAL['cv-soft'],a:'center'});}}});
  if(B&&B.hold)pill(ctx,'Reading time: '+B.holdAt+' min · count the floating disks',400,110,PAL['rj'],'#fff',fsz(14,21));
  else if(b.state==='done')pill(ctx,'20:00 · data collection done',400,110,PAL['s3'],'#fff',fsz(14,21));
  else if(b.state==='running'&&p.pauseRead)txt(ctx,'Next count at '+b.next+' min',400,116,{s:fsz(13,20),c:PAL['cv-soft'],a:'center'});}
/* the lab, from the teachers' handout */
const LDROWL=['0 (before the lamp goes on)'].concat(LD.ROWS.slice(1).map(String));
const ldb=sim=>sim.vlab.bench;
const LAB_LD={id:'leafdisk',title:'Photosynthesis Lab Analysis: Spinach Leaf Disks',course:'Biology',teachers:'Hill, Baldasare, Weed, Lilyestrom',
  source:{label:'CW - Leaf Disk Photosynthesis Lab',href:'https://rjhs.instructure.com/courses/14535/assignments/551063'},level:'bio',
  purpose:'<p>Observe factors that affect the rate of photosynthesis, and review the inputs and outputs of photosynthesis.</p><p><b>Learning objective:</b> describe the impact of different amounts of reactants on the overall rate of photosynthesis.</p>',
  background:'<p>Leaf disks are infiltrated with a solution and sink to the bottom of a cup. As photosynthesis occurs, O₂ accumulates in the air spaces of the leaf, causing the disks to become buoyant and float. The rate at which disks float indicates the rate of photosynthesis.</p>'+
    '<p><b>Independent variables:</b> light condition (darkness or direct light) and solution type (tap water or bicarbonate solution).<br><b>Dependent variable:</b> the number of floating leaf disks over time.<br><b>Controlled variables:</b> the number of disks per trial, the type of leaf (spinach), temperature, the volume of solution and the distance from the light source.</p>'+
    '<p><b>About the virtual bench.</b> The bench runs a model of the real lab. Each cup’s rate of O₂ production is set by its light and its solution, minus the O₂ the leaf cells use in cellular respiration. A disk floats once it has gained enough O₂ to be buoyant. Disks differ a little in thickness and in how much solution they took up, so they float one at a time, and leaves differ between lab groups, as in a real lab. The lamp distance, temperature, volume and number of disks are the same for every cup. A disk that floats stays at the surface. At 1× speed, the lab clock runs 15 times faster than real time.</p>',
  materials:['Fresh spinach leaves','Hole punch or plastic straw, to cut the disks','Plastic syringes (no needle), one per solution','Tap water','Sodium bicarbonate (baking soda) solution, about 0.2%, with a drop of dilute liquid soap','4 clear plastic cups','Lamp','Dark box or cupboard','Timer'],
  hypothesis:{prompt:'<p>Write your hypothesis: how will the light condition (darkness or direct light) and the solution (tap water or bicarbonate) affect how fast the leaf disks float? Give your reasoning.</p>'},
  setup(sim){BioLab.refresh(sim);},
  controls:['pauseRead','ld-fill','ld-infil','ld-disks','ld-cover','ld-start','ld-clean'],
  steps:[
    {title:'Get set up',text:'<p>You will run four cups at the same time, with 10 spinach leaf disks in each:</p><ul><li>Cup 1: tap water + darkness</li><li>Cup 2: tap water + light</li><li>Cup 3: bicarbonate + darkness</li><li>Cup 4: bicarbonate + light</li></ul><p>Leave <b>Pause at each reading</b> on, so the lab clock stops every 2 minutes for your count. At 1× speed the clock runs 15 times faster than real time. Use Speed to change that.</p>'},
    {title:'Pour the solutions',text:'<p>Pour the same volume of tap water into cups 1 and 2, and the same volume of bicarbonate solution into cups 3 and 4. The volume of solution is a controlled variable.</p>',
     done:sim=>!!ldb(sim).filled,doneHint:'Press <b>Pour the solutions into the cups</b>.'},
    {title:'Infiltrate the leaf disks',text:'<p>Punch 10 disks for each cup from the spinach leaves, avoiding the large veins. Put each set of disks in a syringe with that cup’s solution, push out the air, cover the tip and pull back on the plunger. The vacuum pulls the air out of the spaces inside the leaf, and solution flows in to replace it.</p>',
     done:sim=>!!ldb(sim).infil,doneHint:sim=>ldb(sim).filled?'Press <b>Punch and infiltrate 40 leaf disks</b>.':'Pour the solutions into the cups first.'},
    {title:'Add the disks',text:'<p>Add 10 infiltrated disks to each cup. Check that every disk sinks to the bottom.</p>',
     done:sim=>!!ldb(sim).disks,doneHint:sim=>ldb(sim).infil?'Press <b>Add 10 sunk disks to each cup</b>.':'Infiltrate the leaf disks first.'},
    {title:'Darkness for cups 1 and 3',text:'<p>Put cups 1 and 3 in the dark box. Cups 2 and 4 stay under the lamp, at the same distance from it.</p>',
     done:sim=>!!ldb(sim).covered,doneHint:sim=>ldb(sim).disks?'Press <b>Put cups 1 and 3 in the dark box</b>.':'Add the disks to the cups first.'},
    {title:'Count at 0 minutes',text:'<p>Before the lamp goes on, count the floating disks in each cup. Type the counts in the <b>0 min</b> row of the data table below the bench.</p><p>A disk counts as floating once it reaches the surface.</p>',
     done:sim=>LD.cols.every(k=>sim.vlab.raw('c:t1:'+k+':0').trim()!==''),doneHint:'Type a count for every cup in the 0 min row of the data table.'},
    {title:'Light on: count every 2 minutes',text:'<p>Press <b>Turn on the lamp and start the clock</b>. Count the floating disks in each cup every 2 minutes for 20 minutes, and record the counts in the data table.</p><p>Each time the clock stops, the dark box opens so you can count cups 1 and 3. Type all four counts, then press <b>Play</b>.</p>',
     done:sim=>{const b=ldb(sim);return b.state==='done'||!!(b.last&&b.last.t>=20);},
     doneHint:sim=>{const b=ldb(sim),B=ldB(sim);if(!b.covered&&!ldStarted(b))return 'Put cups 1 and 3 in the dark box first.';if(b.state==='setup')return 'Press <b>Turn on the lamp and start the clock</b>.';
       if(B&&B.hold)return 'Type the '+B.holdAt+' min counts for all four cups, then press <b>Play</b>.';return 'Keep counting every 2 minutes until the lab clock reaches 20:00. Press <b>Play</b> if the clock is paused.';}},
    {title:'Clean up',text:'<p>Press <b>Empty and rinse the cups</b>. In the real lab, follow your teacher’s directions for the leaf disks and the solutions.</p>'},
    {title:'Analyze your data',text:'<p>Data collection is done. Below the bench, check your line graph, work out the rate for each condition from the straight part of its line, and answer the questions. Finish with your conclusion, then turn in your lab.</p>'}],
  tables:[{id:'t1',title:'Number of floating leaf disks (10 disks per cup)',cols:[{id:'t',label:'Time (min)',rows:LD.ROWS,rowLabels:LDROWL}].concat(LD.cols.map((k,c)=>({id:k,label:'Cup '+(c+1)+': '+LD.names[c].toLowerCase().replace(/^./,m=>m.toUpperCase()),input:'number',dp:0,check:ldCheck(c)})))}],
  graph:{type:'line',title:'Floating leaf disks over time',xl:'Time (min)',yl:'Number of floating disks',xmin:0,xmax:20,ymin:0,ymax:10,
    series:LD.cols.map((k,c)=>({table:'t1',x:'t',y:k,label:LD.names[c]}))},
  calcs:LD.cols.map((k,c)=>({id:'r_'+k,label:'Rate of photosynthesis, cup '+(c+1)+' ('+LD.names[c].toLowerCase()+')',unit:'disks/min',input:'number',check:ldRateCheck(c)})),
  questions:[
    {id:'q1',n:'1',q:'<p>Create a line graph of your data, with time on the x-axis and the number of floating disks on the y-axis, showing all four conditions on the same graph. Your graph draws in the Graph section from your table. Describe what it shows for each condition.</p>'},
    {id:'q2',n:'2',q:'<p>Calculate the rate of photosynthesis for each condition: the number of disks floated per minute during the linear portion of the graph. Enter your four rates under Calculations. Here, show your work: which minutes did you use for each line, and how did you get the rate?</p>'},
    {id:'q3',n:'3',q:'<p>Explain the effect of light on the rate of photosynthesis. What happens at the molecular level?</p>'},
    {id:'q4',n:'4',q:'<p>Explain the effect of bicarbonate on the rate of photosynthesis. Hint: what does bicarbonate provide?</p>'},
    {id:'q5',n:'5',q:'<p>Write the balanced equation for photosynthesis. Which reactant does bicarbonate provide?</p>'},
    {id:'q6',n:'6',q:'<p>Identify three sources of error in this experiment, and explain how you could minimize each one.</p>'},
    {id:'q7',n:'7',q:'<p>Real-world application: how does what you learned apply to aquatic plants, to greenhouses, or to plants growing in low light?</p>'}],
  conclusion:{prompt:'<p>Write a conclusion of 1 to 2 paragraphs. Discuss the relationship between light intensity and the rate of photosynthesis, the role of CO₂ availability, whether your hypothesis was supported, and any unexpected findings.</p>'}};
const PHOTO={
  id:'photo',apUnit:3,order:2,kind:'Simulation',card:'The Elodea bubble lab. Move the lamp, change CO₂ and light color, count bubbles.',hash:'photosynthesis',tab:'Photosynthesis',
  title:'Photosynthesis: the Elodea bubble lab',
  lede:{bio:'Pondweed gives off oxygen bubbles as it photosynthesizes. Move the lamp, change the CO₂ and temperature, and count the bubbles.',
        honors:'Test which colors of light drive photosynthesis, and find the limiting factor: light, CO₂ or temperature.',
        ap:'A dissolved-O₂ probe shows gross and net O₂. Find the light compensation point, where photosynthesis exactly balances respiration.'},
  timeScale:0.25,dtMax:0.005,prewarm:1.5,sampleDt:0.02,window:6,unit:'min',chChange:1,chReveal:3.6,
  controls:[
    {id:'dist',label:'Lamp distance',type:'range',min:10,max:60,step:1,def:15,unit:' cm',lvl:'bio'},
    {id:'co2',label:'Baking soda (CO₂ source)',type:'range',min:0,max:1,step:0.05,def:0.5,unit:'%',lvl:'bio'},
    {id:'temp',label:'Water temperature',type:'range',min:5,max:45,step:1,def:25,unit:' °C',lvl:'bio'},
    {id:'filter',label:'Light color',type:'seg',def:'white',lvl:'honors',options:[{v:'white',l:'White'},{v:'red',l:'Red'},{v:'blue',l:'Blue'},{v:'green',l:'Green'}]},
    // virtual lab bench only (hidden in the other views)
    {id:'pauseRead',label:'Pause at each reading',type:'toggle',def:true,vlab:true,noTrial:true,help:'The lab clock stops every 2 minutes so you can count the floating disks.'}
  ],
  actions:[
    {id:'ld-fill',label:'Pour the solutions into the cups',vlab:true,enabled:s=>!!ldB(s)&&!s.vlab.bench.filled,run(s){if(!ldB(s))return;s.vlab.bench.filled=true;BioLab.play(s);}},
    {id:'ld-infil',label:'Punch and infiltrate 40 leaf disks',vlab:true,enabled:s=>!!ldB(s)&&!!s.vlab.bench.filled&&!s.vlab.bench.infil,run(s){const b=ldB(s)&&s.vlab.bench;if(!b||!b.filled)return;b.infil=true;BioLab.play(s);}},
    {id:'ld-disks',label:'Add 10 sunk disks to each cup',vlab:true,enabled:s=>!!ldB(s)&&!!s.vlab.bench.infil&&!s.vlab.bench.disks,
     run(s){const b=ldB(s)&&s.vlab.bench;if(!b||!b.infil||b.disks)return;b.disks=true;b.counts=[[0],[0],[0],[0]];b.t=0;b.next=2;b.state='setup';BioLab.play(s);}},
    {id:'ld-cover',label:'Put cups 1 and 3 in the dark box',vlab:true,enabled:s=>!!ldB(s)&&!!s.vlab.bench.disks&&!s.vlab.bench.covered,run(s){const b=ldB(s)&&s.vlab.bench;if(!b||!b.disks)return;b.covered=true;BioLab.play(s);}},
    {id:'ld-start',label:'Turn on the lamp and start the clock',primary:true,vlab:true,enabled:s=>!!ldB(s)&&!!s.vlab.bench.covered&&s.vlab.bench.state==='setup',
     run(s){const B=ldB(s),b=B&&s.vlab.bench;if(!b||!b.covered||b.state!=='setup')return;b.lamp=true;b.state='running';b.t=0;b.next=2;B.hold=false;BioLab.play(s);}},
    {id:'ld-clean',label:'Empty and rinse the cups',vlab:true,enabled:s=>!!ldB(s)&&!!s.vlab.bench.filled,
     run(s){const B=ldB(s),b=B&&s.vlab.bench;if(!b||!b.filled)return;if(ldStarted(b))b.last={att:b.att,t:b.t,counts:b.counts};
       b.filled=b.infil=b.disks=b.covered=b.lamp=false;b.state='setup';b.t=0;b.next=2;b.counts=null;b.att=(b.att||0)+1;B.hold=false;BioLab.play(s);}}
  ],
  labs:[LAB_LD],
  /* what the bench instruments show right now (used by the virtual-lab tests) */
  benchRead(sim){const B=ldB(sim);if(!B)return null;const b=sim.vlab.bench,ft=b.disks?ldTimes(sim.vlab.seed,b.att):null,T=ldStarted(b)?b.t:0;
    return {clock:T,hold:B.hold,holdAt:B.holdAt,state:b.state,next:b.next,floating:ft?ft.map(f=>ldCount(f,T)):[0,0,0,0]};},
  init(sim){const s={I:0,gross:0,resp:0,net:0,acc:0,thr:1,bub:[],total:0};if(sim&&sim.vlab&&sim.vlab.lab.id==='leafdisk')s.B=ldInit(sim);return s;},
  step(sim,dt){if(sim.st.B){if(sim.t<-1e-9)return;ldStep(sim,dt);return;}
    const p=sim.p,s=sim.st,I=100*Math.pow(10/p.dist,2),Ie=I*FILT[p.filter],Lf=Ie/(Ie+25),C=p.co2+0.02,Cf=C/(C+0.15),T=p.temp;
    const fT=Math.pow(2,(T-25)/10)/(1+Math.exp((T-38)/2.5));
    s.I=I;s.gross=50*Lf*Cf*fT;s.resp=4*Math.pow(2,(T-25)/10);s.net=s.gross-s.resp;
    s.acc+=Math.max(0,s.net)*dt;                                // bubbles arrive at random (Poisson) at the net O2 rate
    while(s.acc>=s.thr){s.acc-=s.thr;s.bub.push(sim.t);s.total++;s.thr=-Math.log(1-Math.random()*0.999);}
    while(s.bub.length&&s.bub[0]<sim.t-1.05)s.bub.shift();},
  afterPrewarm(sim){sim.st.total=0;},
  metrics:[
    {id:'bubbles',label:'Bubbles per minute',unit:'counted',lvl:'bio',min:0,max:40,d:0,get:s=>s.st.bub.filter(x=>x>s.t-1).length},
    {id:'light',label:'Light at the plant',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>s.st.I},
    {id:'gross',label:'Gross O₂ made',unit:'bubble-eq/min',lvl:'ap',min:0,max:40,d:1,get:s=>s.st.gross},
    {id:'resp',label:'O₂ used (respiration)',unit:'bubble-eq/min',lvl:'ap',min:0,max:20,d:1,get:s=>s.st.resp},
    {id:'net',label:'Net O₂ (probe)',unit:'bubble-eq/min',lvl:'ap',min:-15,max:40,d:1,get:s=>s.st.net}
  ],
  defaultGraph:'bubbles',
  challenges:[
    {lvl:'bio',q:'You move the lamp from 15 cm to 40 cm away. What happens to the bubble rate?',
     choices:['It goes up','It goes down','It stays the same'],correct:1,
     baseline:{dist:15},change:{dist:40},changeText:'Lamp moved to 40 cm',watch:'bubbles',
     explain:{bio:'Light spreads out as it travels. At 40 cm the plant gets only about one-seventh of the light it got at 15 cm, so it makes less oxygen and fewer bubbles.',
              honors:'Light intensity falls with the square of distance: (15 ÷ 40)² ≈ 0.14, so the plant gets about 14% as much light. Light is now the limiting factor.'}},
    {lvl:'bio',q:'You replace the baking-soda water with plain water. What happens to the bubbles?',
     choices:['More bubbles','Far fewer bubbles','No change'],correct:1,
     change:{co2:0},changeText:'Baking soda removed',watch:'bubbles',
     explain:{bio:'Baking soda releases CO₂ into the water, and the plant needs CO₂ to build sugar. With almost no CO₂, photosynthesis slows even though the light is strong.'}},
    {lvl:'honors',q:'Plants look green. What happens if the plant gets only green light?',
     choices:['It photosynthesizes faster than in white light','It photosynthesizes much more slowly','No change'],correct:1,
     change:{filter:'green'},changeText:'Green filter in front of the lamp',watch:'bubbles',
     explain:{honors:'Chlorophyll absorbs red and blue light and reflects most green light. That reflected green is why leaves look green, and it is also why green light drives very little photosynthesis.'}},
    {lvl:'honors',q:'You heat the water from 25 °C to 45 °C. What happens to the bubble rate?',
     choices:['It keeps rising with temperature','It drops sharply','No change'],correct:1,
     change:{temp:45},changeText:'Water heated to 45 °C',watch:'bubbles',
     explain:{honors:'The Calvin cycle runs on enzymes such as rubisco. Warming speeds them up to a point, but at 45 °C they start to lose their shape, so photosynthesis falls. Respiration keeps rising and uses up more of the O₂ that is made.'}},
    {lvl:'ap',q:'At 60 cm, almost no bubbles appear. Is the plant still photosynthesizing?',
     choices:['No, photosynthesis has stopped','Yes, but respiration uses about as much O₂ as photosynthesis makes'],correct:1,
     baseline:{dist:30},change:{dist:60},changeText:'Lamp moved to 60 cm',watch:'net',
     explain:{ap:'Gross O₂ production is still positive, but cellular respiration uses O₂ the whole time. Near 60 cm the two are about equal, so net O₂ is about zero. This is the light compensation point. Bubbles only measure net O₂.'}}
  ],
  initVis(sim){const r=rng(5),v=sim.vis;v.b=[];v.seen=sim.st.total;v.fizz=[];for(let i=0;i<40;i++)v.fizz.push([566+r()*110,190+r()*200,r()*6.28]);
    v.leaves=[];for(let u=0.06;u<0.99;u+=0.085){for(let j=0;j<3;j++)v.leaves.push([u,j,r()]);}},
  draw(sim,ctx,vdt,k,t){
    if(sim.st.B&&sim.vlab){drawLD(sim,ctx,vdt,k);return;}
    const s=sim.st,p=sim.p,v=sim.vis,hon=atLeast('honors'),R=Math.random;
    ctx.fillStyle=PAL['card'];ctx.fillRect(0,0,800,450);
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,400,800,50);
    // ruler (distance from the plant)
    const BX=620,PX=8;ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(BX-60*PX-6,404,60*PX+12,30);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.strokeRect(BX-60*PX-6,404,60*PX+12,30);
    ctx.beginPath();for(let c=0;c<=60;c++){const x=BX-c*PX,h=c%10===0?11:c%5===0?7:4;ctx.moveTo(x,404);ctx.lineTo(x,404+h);}ctx.stroke();
    for(let c=0;c<=60;c+=10)txt(ctx,String(c),BX-c*PX,429,{s:11*k,a:'center',c:PAL['cv-soft']});
    txt(ctx,'cm from plant',BX+50,425,{s:11*k,c:PAL['cv-soft']});
    // lamp
    const hx=BX-p.dist*PX-14,hy=232,I=s.I,fc=FILTC[hon?p.filter:'white'];
    const beam=ctx.createLinearGradient(hx,0,566,0);beam.addColorStop(0,fc+clamp(.18+I/250,0,.6)+')');beam.addColorStop(1,fc+clamp(I/420,.02,.28)+')');
    ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(hx+8,206);ctx.lineTo(566,150);ctx.lineTo(566,398);ctx.lineTo(hx+8,258);ctx.closePath();ctx.fill();
    ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(hx-44,226,6,174);ctx.beginPath();ctx.ellipse(hx-41,400,22,5,0,0,6.29);ctx.fill();ctx.fillRect(hx-44,228,22,6);
    ctx.beginPath();ctx.moveTo(hx-28,212);ctx.lineTo(hx+8,196);ctx.lineTo(hx+8,268);ctx.lineTo(hx-28,252);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffe28a';ctx.beginPath();ctx.arc(hx+6,232,13,-1.57,1.57);ctx.fill();
    if(hon&&p.filter!=='white'){ctx.fillStyle=fc+'.75)';rr(ctx,hx+14,198,7,68,2);ctx.fill();}
    // beaker of water with Elodea
    ctx.fillStyle=PAL['cv-water'];ctx.fillRect(566,178,108,220);
    v.fizz.slice(0,Math.round(p.co2*40)).forEach(f=>{ctx.fillStyle=PAL['cv-bstroke'];ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(f[0],f[1]+(RM?0:Math.sin(t*2+f[2])*2),1.6,0,6.29);ctx.fill();});ctx.globalAlpha=1;
    ctx.strokeStyle=PAL['cv-leaf'];ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(624,396);ctx.quadraticCurveTo(606,320,612,226);ctx.stroke();
    for(const L of v.leaves){const u=L[0],m=1-u,x=m*m*624+2*u*m*606+u*u*612,y=m*m*396+2*u*m*320+u*u*226;
      ctx.save();ctx.translate(x,y);ctx.rotate((L[1]-1)*1.05+(L[2]-.5)*.25);ctx.fillStyle=L[1]===1?PAL['cv-leaf2']:PAL['cv-leaf'];ctx.beginPath();ctx.ellipse(0,-11,4.2,12,0,0,6.29);ctx.fill();ctx.restore();}
    // thermometer
    ctx.fillStyle=PAL['card'];rr(ctx,654,128,10,250,5);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();
    const th=clamp((p.temp-5)/40,0,1)*200;ctx.fillStyle='#d32f2f';ctx.fillRect(656.5,374-th,5,th+4);ctx.beginPath();ctx.arc(659,382,8,0,6.29);ctx.fill();
    // bubbles: exactly one per bubble counted by the model
    while(v.seen<s.total){v.seen++;v.b.push({x:612+R()*4-2,y:224,r:2.6+R()*2.2,ph:R()*6.28});}
    for(const b of v.b){b.y-=70*vdt;const x=b.x+(RM?0:Math.sin(b.y*.08+b.ph)*2);ctx.fillStyle=PAL['cv-bubble'];ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,b.y,b.r,0,6.29);ctx.fill();ctx.stroke();}
    v.b=v.b.filter(b=>b.y>182);if(v.b.length>80)v.b.splice(0,v.b.length-80);
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(562,146);ctx.lineTo(562,398);ctx.lineTo(678,398);ctx.lineTo(678,146);ctx.stroke();
    ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(564,178);ctx.lineTo(676,178);ctx.stroke();
    // labels
    txt(ctx,'Elodea (pondweed) in baking-soda water',620,112,{s:12.5*k,w:600,a:'center'});
    txt(ctx,'Bubbles counted: '+s.total,784,28,{s:14*k,w:700,a:'right'});
    txt(ctx,'Light at plant: '+Math.round(I)+'%',16,28,{s:14*k,w:700});
    txt(ctx,'Lamp '+p.dist+' cm away · '+p.temp+' °C'+(hon?' · '+p.filter+' light':''),16,48,{s:12.5*k,c:PAL['cv-soft']});
  }
};
Object.assign(PHOTO,{
  scale:'Real lab scale: a 10 cm sprig of pondweed in a beaker. Each bubble is mostly oxygen released from chloroplasts.',
  narrate(sim){if(sim.st.B&&sim.vlab)return ldNarrate(sim);
    const p=sim.p,s=sim.st,hon=atLeast('honors');
    const Ie=s.I*FILT[p.filter],Lf=Ie/(Ie+25),C=p.co2+0.02,Cf=C/(C+0.15),T=p.temp,fT=Math.pow(2,(T-25)/10)/(1+Math.exp((T-38)/2.5));
    if(s.net<=0.2)return '<b>No bubbles escape.</b> The plant is still photosynthesizing, but its own respiration uses up the oxygen as fast as it is made.';
    if(T>=40)return '<b>Too warm.</b> The enzymes that build sugar are losing their shape, so photosynthesis slows even with plenty of light.';
    if(hon&&p.filter==='green')return '<b>Green light mostly reflects off chlorophyll</b>, which is why leaves look green. Little of it is absorbed, so few bubbles form.';
    const lim=[['Light',Lf],['Carbon dioxide',Cf],['Temperature',fT>1?1:fT]].sort((a,b)=>a[1]-b[1])[0][0];
    return 'The plant is making about <b>'+Math.max(0,s.net).toFixed(0)+' bubbles of oxygen per minute</b>. Right now <b>'+lim.toLowerCase()+'</b> is the limiting factor: improving it would help most.';},
  tour:[
    {title:'The setup',text:'A sprig of Elodea pondweed sits in water mixed with baking soda, which releases CO₂ for the plant to use. A lamp shines on it from the side.',focus:[548,100,160,305],speed:0.5},
    {title:'Light is the energy source',text:'Light hits chloroplasts in the leaves. Chlorophyll absorbs it and uses the energy to split water molecules.',focus(sim){const hx=620-sim.p.dist*8-14;return [hx-60,180,640-hx,100];},speed:0.5},
    {title:'Bubbles are oxygen',text:'Splitting water releases oxygen gas, which collects and escapes from the cut end of the stem as bubbles. Counting bubbles measures photosynthesis.',focus:[585,175,60,70],speed:0.5},
    {title:'Move the lamp back',text:'Now the lamp moves to 40 cm. Light spreads out with distance, so far less of it reaches the plant. Watch the bubble rate fall.',focus:[130,190,560,250],speed:2,setup(sim){BioLab.setValues(sim,{dist:40});}},
    {lvl:'honors',title:'Color matters',text:'A green filter lets only green light through. Chlorophyll reflects most green light, so photosynthesis nearly stops even though the lamp is close.',focus:[400,150,300,250],speed:2,setup(sim){BioLab.setValues(sim,{dist:15,filter:'green'});}},
    {lvl:'ap',title:'Gross vs. net',text:'The plant respires all the time, using some of the oxygen it makes. Bubbles show only the <b>net</b> oxygen. Far from the lamp, respiration can use up everything photosynthesis makes. That is the compensation point.',focus:[0,0,800,60],speed:2,setup(sim){BioLab.setValues(sim,{filter:'white',dist:58});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{dist:15,filter:'white'});},
  about:'<p><b>The Elodea model.</b> Light at the plant falls with the square of the lamp distance (100% at 10 cm). Gross photosynthesis rises with light and CO₂ along saturating curves, light as I/(I + 25) and CO₂ as C/(C + 0.15), and rises with temperature until about 38 °C, where the enzymes start to lose their shape. Respiration doubles with every 10 °C. Bubbles leave at random times at the net rate: gross O₂ minus the O₂ used in respiration. Real plants also hold some O₂ in their tissues, and real bubbles vary in size.</p>'+
    '<p><b>The leaf disk bench (Virtual lab).</b> Each cup’s net rate is light × CO₂ supply minus respiration. The lamp gives about 400 µmol photons/m²/s at the cups, against a half-saturation of about 150. The 0.2% sodium bicarbonate solution holds about 24 mM of dissolved inorganic carbon and typical tap water about 1 mM, against a half-saturation of about 3 mM for the disks. Respiration uses about 5% of the top rate, so in darkness net O₂ is negative and no disk floats. Each disk floats once it has gained its own threshold amount of O₂, which differs from disk to disk by about 30%; each cup and each lab run also differ a little. The model is set so that, in bright light with bicarbonate, the first disks usually float after about 4 to 8 minutes and most within 12 to 20 minutes, as in classroom data. Tap water in the light is slow: few or no disks float within 20 minutes. The model leaves out the slow loss of O₂ from floating disks and any change in temperature.</p>',
  lab:{bio:'<p><b>Question:</b> How does light intensity affect the rate of photosynthesis?</p><ol><li>Record bubbles per minute with the lamp at 10, 20, 30, 40, 50 and 60 cm.</li><li>After each move, wait one full minute on the clock before recording, so the count covers only the new distance.</li><li>Plot lamp distance (x) against bubbles per minute (y).</li></ol><p>Write a claim about light and photosynthesis using your data.</p>',
       honors:'<p><b>Question:</b> Which colors of light drive photosynthesis best?</p><ol><li>With the lamp at 15 cm, record 3 trials each for white, red, blue and green light.</li><li>Average the trials for each color.</li></ol><p>Connect your results to the colors chlorophyll absorbs and reflects.</p>',
       ap:'<p><b>Question:</b> Where is the light compensation point?</p><ol><li>Record net O₂ (probe) at lamp distances from 20 to 60 cm.</li><li>Plot light at the plant (x) against net O₂ (y) and find where net O₂ crosses zero.</li><li>Repeat at 35 °C.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why the compensation point shifts with temperature.</p>'},
  terms:[{t:'Photosynthesis',d:'Using light energy to make sugar from CO₂ and water, releasing O₂.'},{t:'Chlorophyll',d:'The green pigment that absorbs red and blue light.'},{t:'Limiting factor',d:'The one condition, such as light, CO₂ or temperature, that is holding back the rate.'},
    {lvl:'honors',t:'Light reactions',d:'Use light to split water, releasing O₂ and making ATP and NADPH.'},{lvl:'honors',t:'Calvin cycle',d:'Uses ATP, NADPH and CO₂ to build sugar.'},{lvl:'honors',t:'Inverse square law',d:'Doubling the distance from a light gives one quarter of the light.'},
    {lvl:'ap',t:'Gross vs. net photosynthesis',d:'Gross is all the O₂ produced. Net is gross minus the O₂ used by respiration.'},{lvl:'ap',t:'Compensation point',d:'The light level where photosynthesis exactly balances respiration.'}]
});
BioLab.register(PHOTO);
})();
