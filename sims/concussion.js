(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;

/* Concussion: four linked views.
   Mechanism: the brain as a damped mass in the skull, x'' = a(t) - w^2 x - 2 z w x', with a half-sine head pulse of 12 ms.
   w and z are tuned so a 100 g pulse moves the brain about 6 mm, the order of size seen in cadaver studies. Tissue stretch scales with rotational acceleration. */
const MS_PER_S=25,PW=440,PZ=.35,PT=12;
const HITS={front:{l:'Straight blow to the front',rot:30,arrow:'front'},side:{l:'Glancing blow that turns the head',rot:65,arrow:'side'},jolt:{l:'Jolt to the body, no head contact',rot:90,arrow:'jolt'}};
function wrap(ctx,s,x,y,w,o){o=o||{};const size=o.s||13,lh=o.lh||size*1.26;ctx.font=(o.w||400)+' '+size+'px '+FONT;let line='',yy=y;
  String(s).split(' ').forEach(word=>{const t=line?line+' '+word:word;if(ctx.measureText(t).width>w&&line){txt(ctx,line,x,yy,{s:size,w:o.w,c:o.c,a:o.a});yy+=lh;line=word;}else line=t;});
  if(line){txt(ctx,line,x,yy,{s:size,w:o.w,c:o.c,a:o.a});yy+=lh;}return yy;}
function arrow(ctx,x0,y0,x1,y1,c,lw){const a=Math.atan2(y1-y0,x1-x0),h=11;ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=lw||5;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1-h*Math.cos(a),y1-h*Math.sin(a));ctx.stroke();ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1-h*1.7*Math.cos(a-.5),y1-h*1.7*Math.sin(a-.5));ctx.lineTo(x1-h*1.7*Math.cos(a+.5),y1-h*1.7*Math.sin(a+.5));ctx.closePath();ctx.fill();}

function hitFresh(){return {on:false,t:0,x:0,v:0,xs:0,vs:0,th:0,w:0,peakX:0,minX:0,peakG:0,alpha:0,strain:0,tr:[],ran:false};}
function hitStart(sim){const m=hitFresh();m.on=true;m.ran=true;m.hit=sim.p.hit;m.g=sim.p.g;sim.st.m=m;}
function hitStep(sim,dt){const m=sim.st.m;if(!m.on)return;let ms=dt*MS_PER_S;const R=HITS[m.hit].rot;
  while(ms>1e-9){const h=Math.min(ms,.05),t=m.t,s=h/1000;
    const a=t<PT?m.g*9.81*Math.sin(Math.PI*t/PT):0;
    m.v+=(a-PW*PW*m.x-2*PZ*PW*m.v)*s;m.x+=m.v*s;
    /* the skull moves away from the blow, then the neck brings it back */
    m.vs+=(a-1400*m.xs-70*m.vs)*s;m.xs+=m.vs*s;
    const al=a/9.81*R;m.alpha=Math.max(m.alpha,al);m.w+=(al-1600*m.th-60*m.w)*s;m.th+=m.w*s;
    m.peakG=Math.max(m.peakG,a/9.81);m.peakX=Math.max(m.peakX,m.x*1000);m.minX=Math.min(m.minX,m.x*1000);
    m.strain=Math.max(m.strain,al/22000);
    m.t+=h;ms-=h;if(m.tr.length<400&&(!m.tr.length||m.t-m.tr[m.tr.length-1][0]>=.5))m.tr.push([m.t,a/9.81,m.x*1000]);
    if(m.t>=120){m.on=false;break;}}}

/* ---------- BESS ---------- */
const STANCES=[{v:'double',l:'Double leg'},{v:'single',l:'Single leg'},{v:'tandem',l:'Tandem'}];
const stIdx=v=>STANCES.findIndex(s=>s.v===v);
const ERR={hands:'Hands came off the hips',eyes:'Eyes opened',step:'Stepped or stumbled',hip:'Hip moved out past 30°',heel:'Forefoot or heel lifted',out:'Out of position more than 5 s'};
const MEAN={base:[.2,3,1.6],today:[1.5,7,5.5]};
function bessEvents(seed,who,stance){const si=stIdx(stance),g=rng((seed+si*131+(who==='today'?977:0))|0),g0=rng((seed+si*131)|0);
  const roll=(mean,gg)=>Math.max(0,Math.round(mean+(gg()-.5)*2*(si?1.3:.5)));
  const b=roll(MEAN.base[si],g0);let n=who==='base'?b:Math.max(b+(si?2:0),roll(MEAN.today[si],g));n=Math.min(n,9);
  const kinds=si===0?['hands','eyes','step','heel']:['hands','eyes','step','hip','heel'];const ev=[];const slot=18.6/Math.max(n,1);
  for(let i=0;i<n;i++){let k=kinds[Math.floor(g()*kinds.length)];if(slot>=7&&g()<.3)k='out';const d=k==='out'?Math.min(6,slot-.5):Math.min(1.5,slot*.7);
    ev.push({t:1+i*slot+g()*Math.max(0,slot-d-.3),k,d:k==='out'?Math.max(d,5.2):d});}
  return ev;}
function bessFresh(){return {seed:Math.floor(Math.random()*2147483646)+1,res:{base:[null,null,null],today:[null,null,null]},tr:null};}
function bessStart(sim){const b=sim.st.b,who=sim.p.who,stance=sim.p.stance;b.tr={who,stance,ev:bessEvents(b.seed,who,stance),t:0,count:0,done:false,flash:0};}
function bessStep(sim,dt){const b=sim.st.b,tr=b.tr;if(!tr||tr.done)return;tr.t+=dt;tr.flash=Math.max(0,tr.flash-dt);if(tr.t>=20){tr.t=20;tr.done=true;b.res[tr.who][stIdx(tr.stance)]=tr.ev.length;sim.infoDirty=true;}}
const total=a=>a.every(v=>v!==null)?a.reduce((x,y)=>x+y,0):null;

/* ---------- Sideline ---------- */
const SIGNS=[
  {id:'posture',l:'Posturing (arms or legs stiff)',red:true},{id:'loc',l:'Consciousness fading or changing',red:true},{id:'numb',l:'Numbness in arms or legs',red:true},{id:'pupil',l:'Unequal or non-reactive pupils',red:true},
  {id:'vomit',l:'Repeated vomiting',red:true},{id:'seizure',l:'Seizure',red:true},{id:'speak',l:'Cannot speak',red:true},{id:'recog',l:'Cannot recognize people or places',red:true},
  {id:'head',l:'Headache or pressure'},{id:'dizzy',l:'Dizzy or poor balance'},{id:'fog',l:'Confused or foggy'},{id:'light',l:'Bothered by light or noise'},{id:'off',l:'“Just doesn’t feel right”'},{id:'daze',l:'Looks dazed, slow to answer'}];
const SCN=[
  {v:'a',l:'Football: asks the score twice',t:'A football player gets up slowly after a helmet-to-helmet hit. He asks you the score, then asks again a minute later.',s:['fog','daze']},
  {v:'b',l:'Soccer: headache at halftime',t:'A soccer player headed the ball hard and kept playing. At halftime she says her head hurts and the lights feel too bright.',s:['head','light']},
  {v:'c',l:'Football: arm numb, pupils uneven',t:'A football player stays down after a tackle. He says his arm is numb. One pupil looks larger than the other.',s:['numb','pupil']},
  {v:'d',l:'Hard tackle, sideline check clear',t:'A lacrosse player takes a hard check. On your sideline check she has no symptoms, and her balance and memory are normal. Her coach wants her back in.',s:[]},
  {v:'e',l:'Vomiting and getting sleepier',t:'A wrestler hit the mat with his head. On the sideline he has vomited three times and is getting harder to keep awake.',s:['vomit','loc']},
  {v:'f',l:'Dizzy, does not know teammates',t:'A basketball player fell and hit her head on the court. She is dizzy and does not recognize the teammate talking to her.',s:['dizzy','recog']},
  {v:'custom',l:'Pick your own signs',t:'Pick the signs you see, then make your call.',s:[]}];
const scn=sim=>SCN.find(x=>x.v===sim.p.scn)||SCN[0];
function shownSigns(sim){const c=scn(sim);if(c.v==='custom')return sim.st.sd.custom;return c.s;}
function triage(ids){const has=id=>SIGNS.find(s=>s.id===id);if(ids.some(i=>has(i)&&has(i).red))return 'ems';if(ids.length)return 'remove';return 'watch';}
const DEC={ems:'Call EMS',remove:'Remove from play',watch:'Keep watching and recheck'};
const WHY={ems:'A red flag can mean a brain bleed or a worse injury. Call EMS right away, stay with the athlete and protect the neck.',
  remove:'Any sign or symptom means a suspected concussion. Remove the athlete with no return today. In Colorado, the Jake Snakenberg Act requires written clearance from a health care provider before returning to play or joining supervised team activities. An athletic trainer cannot give that clearance.',
  watch:'With no signs now, keep watching and check again. Symptoms can take up to 24 hours to appear, so tell the athlete and family what to look for. When in doubt, sit them out.'};
function decide(sim,d){const sd=sim.st.sd,want=triage(shownSigns(sim));sd.dec=d;sd.ok=d===want;sd.want=want;sd.fp=sim.p.scn;}

/* ---------- Return ---------- */
const RSTEPS=[{n:'Step 1: No Activity',d:'Objective: Recovery. Your notes’ acute management calls for relative rest.',L:0},
  {n:'Step 2: Light Aerobic Exercise',d:'Objective: Increase Heart Rate. Walking or a stationary bike, on your own.',L:1.6},
  {n:'Step 3: Sport-Specific Exercise',d:'Objective: Add Movement. Sport drills on your own, not a team activity. No head impact.',L:2.6},
  {n:'Step 4: Non-Contact Training Drills',d:'Objective: Exercise, Coordination, and Cardiovascular Exercise. The first supervised team activity, so written clearance comes first.',L:3.6},
  {n:'Step 5: Full Contact Practice',d:'Objective: Restore Confidence / Allow Coaches to Evaluate.',L:4.6},
  {n:'Step 6: Return to Play',d:'Objective: No Restrictions.',L:5.4}];
function rFresh(seed){const g=rng(seed);const r={seed,S0:5+g()*2.5,tau:3+g()*3,tc:6+g()*3,day:0,step:0,clear:false,msg:null,flare:0,sym:0,hist:[]};r.sym=rSym(r,0,0);r.hist.push({d:0,s:0,y:r.sym});return r;}
function rSym(r,day,step){const B=r.S0*Math.exp(-day/r.tau),cap=6.5*(1-Math.exp(-day/r.tc)),fl=Math.max(0,RSTEPS[step].L-cap)*2.5;let y=B+fl;y=Math.round(y*2)/2;return clamp(y<.5?0:y,0,10);}
function rGo(sim,dStep){const r=sim.st.r;if(r.step>=5&&dStep>=0&&r.done){return;}const want=clamp(r.step+dStep,0,5);
  if(dStep>0&&want>=3&&r.sym>0){r.msg={t:'Steps 4 to 6 wait until the athlete is back to baseline. Stay on this step for now.',c:'s1'};return;}
  if(dStep>0&&want===3&&!r.clear){r.msg={t:'Stop. Colorado law requires written clearance from a health care provider before any supervised team activity. An athletic trainer cannot give it. Press See a provider first.',c:'s1'};return;}
  r.day++;r.step=want;r.sym=rSym(r,r.day,r.step);r.flare=Math.max(0,r.sym-rSym(r,r.day,0));r.hist.push({d:r.day,s:r.step,y:r.sym});
  if(r.flare>=.5)r.msg={t:'Symptoms came back on this step. Go back a step and try again after at least 24 hours.',c:'s1'};
  else if(r.step===5&&r.sym===0){r.msg={t:'Returned to play on day '+r.day+'. Every step took at least 24 hours.',c:'s3'};r.done=true;}
  else r.msg=dStep>0?{t:'Moved up. At least 24 hours passed on the last step.',c:'cv-soft'}:dStep<0?{t:'Moved back one step. Symptoms need time to settle.',c:'cv-soft'}:{t:'Stayed on this step for another day.',c:'cv-soft'};}
function rClear(sim){const r=sim.st.r;if(r.sym>0){r.msg={t:'In this model the provider will not sign while symptoms remain. Try again when the athlete is back to baseline.',c:'s1'};return;}r.clear=true;r.msg={t:'Written clearance from a health care provider. A registered athletic trainer who knows the athlete’s condition may now manage the graduated return.',c:'s3'};}

/* ---------- visibility ---------- */
function sync(sim){if(!sim.ui||!sim.ui.ctlW)return;const v=sim.p.view,cust=sim.p.scn==='custom';
  sim.def.controls.forEach(c=>{const w=sim.ui.ctlW[c.id];if(!w)return;let on=atLeast(c.lvl)&&(!c.vw||c.vw===v);if(c.custOnly&&!cust)on=false;w.hidden=!on;});
  sim.def.actions.forEach(a=>{const b=sim.ui.actB[a.id];if(!b)return;let on=atLeast(a.lvl)&&(!a.vw||a.vw===v);if(a.custOnly&&!cust)on=false;b.hidden=!on;});
  sim.def.metrics.forEach(m=>{const t=sim.ui.tiles&&sim.ui.tiles[m.id];if(!t)return;const el=t.num.closest('.tile');if(el)el.hidden=!atLeast(m.lvl)||(!!m.vw&&m.vw!==v);});}

/* ---------- drawing ---------- */
const BRAIN='#d98a96',BRAINL='#b8606f',RED='#C11430';
function drawMech(sim,ctx,k,t){const m=sim.st.m,hit=m.ran?m.hit:sim.p.hit;
  const cx=225,cy=210;const skullPx=m.xs*1000*1.26*.6,thetaDeg=clamp(m.th*.6,-.32,.32);
  const dir=-1; /* the blow pushes the head backward (to the left); the brain lags forward */
  const brainShift=m.x*1000*1.26*2;
  // shoulders
  ctx.fillStyle=RED;ctx.beginPath();ctx.moveTo(90,533);ctx.lineTo(110,425);ctx.quadraticCurveTo(170,395,240,395);ctx.quadraticCurveTo(310,395,345,425);ctx.lineTo(365,533);ctx.closePath();ctx.fill();
  ctx.save();ctx.translate(cx+dir*skullPx,cy);ctx.translate(-10,120);ctx.rotate(dir*thetaDeg);ctx.translate(10,-120);
  // neck
  ctx.fillStyle=PAL['card2'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-62,84);ctx.lineTo(-52,195);ctx.lineTo(44,195);ctx.lineTo(40,110);ctx.closePath();ctx.fill();ctx.stroke();
  // skull with a face in profile
  ctx.beginPath();ctx.ellipse(0,0,130,128,0,0,6.2832);ctx.fillStyle=PAL['card2'];ctx.fill();ctx.lineWidth=7;ctx.strokeStyle=PAL['cv-soft'];ctx.stroke();
  ctx.lineWidth=3;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(126,-34);ctx.lineTo(166,16);ctx.lineTo(130,26);ctx.lineTo(136,44);ctx.lineTo(126,52);ctx.lineTo(132,72);ctx.quadraticCurveTo(118,104,86,106);ctx.stroke();
  // CSF gap
  ctx.beginPath();ctx.ellipse(0,-6,119,112,0,0,6.2832);ctx.fillStyle=PAL['cv-water'];ctx.fill();
  // brain
  const gap=14,sh=clamp(brainShift,-gap-20,gap+20),over=Math.max(0,Math.abs(sh)-gap),bx=clamp(sh,-gap,gap)-(sh>0?-over/4:over/4)*.0,rxB=102-over*.45;
  ctx.fillStyle=BRAIN;ctx.strokeStyle=BRAINL;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(bx+(sh>0?over*.2:-over*.2),-8,rxB,94,0,0,6.2832);ctx.fill();ctx.stroke();
  ctx.lineWidth=3;ctx.lineCap='round';[[-60,-40,-20,-70,20,-42],[-70,10,-30,-22,10,8],[-30,44,10,20,52,40],[22,-70,50,-46,78,-54],[30,-12,60,-30,84,-4]].forEach(q=>{ctx.beginPath();ctx.moveTo(bx+q[0],q[1]);ctx.quadraticCurveTo(bx+q[2],q[3],bx+q[4],q[5]);ctx.stroke();});ctx.lineCap='butt';
  // contact glow: front wall (coup) and back wall (contrecoup)
  const glow=(x,a)=>{if(a<=.02)return;const g=ctx.createRadialGradient(x,-6,2,x,-6,62);g.addColorStop(0,'rgba(255,170,40,'+a+')');g.addColorStop(1,'rgba(255,170,40,0)');ctx.fillStyle=g;ctx.fillRect(x-62,-68,124,124);};
  const gc=clamp((sh-gap*.45)/gap,0,.95),gb=clamp((-sh-gap*.3)/(gap*.5),0,.95);glow(112,gc);glow(-112,gb);if(atLeast('honors')){ctx.save();if(gc>.25)pill(ctx,'Coup',62,-6,PAL['card'],PAL['cv-ink'],12*k);if(gb>.25)pill(ctx,'Contrecoup',-40,-6,PAL['card'],PAL['cv-ink'],12*k);ctx.restore();}
  ctx.restore();
  // what hit
  const hx=cx+dir*skullPx;
  if(m.ran||!RM){const on=!m.ran||m.t<PT+6;ctx.globalAlpha=on?1:.35;
    if(hit==='front')arrow(ctx,hx+216,cy-6,hx+160,cy-6,PAL['s4'],7);
    else if(hit==='side')arrow(ctx,hx+196,cy-136,hx+106,cy-96,PAL['s4'],7);
    else arrow(ctx,10,458,88,458,PAL['s4'],7);ctx.globalAlpha=1;}
  const lab=hit==='jolt'?'Jolt to the body':hit==='side'?'Glancing blow':'Blow to the front';
  txt(ctx,lab,12,16+12*k,{s:13*k,w:700});
    // right panel
  const X=468,W=320;ctx.fillStyle=PAL['cv-bg2'];rr(ctx,X-6,8,W+12,517,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  let y=14+15*k;txt(ctx,'One axon stretching',X+6,y,{s:13.5*k,w:700});y+=14*k;
  const strain=m.strain*clamp(m.t/PT,0,1),st=m.ran?strain:0;
  const ax0=X+18,ax1=X+W-18,ay=y+18;ctx.strokeStyle=PAL['s2'];ctx.lineWidth=lerp(6,2.4,clamp(st/.3,0,1));ctx.beginPath();const amp=7*(1-clamp(st/.15,0,1));for(let i=0;i<=40;i++){const px=lerp(ax0,ax1,i/40),py=ay+Math.sin(i*.8)*amp;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();
  ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.arc(ax0,ay,8,0,6.2832);ctx.fill();ctx.beginPath();ctx.arc(ax1,ay,5,0,6.2832);ctx.fill();
  y=ay+24;
  y=wrap(ctx,!m.ran?'Press Run the impact and watch this fiber.':st>.2?'A large stretch. The cell’s membrane leaks.':st>.08?'The fiber straightens and stretches.':'A small stretch, and the fiber recovers.',X+6,y+8,W-12,{s:12*k,c:PAL['cv-soft']});
  y+=4;txt(ctx,'Chemical changes',X+6,y+12*k,{s:13.5*k,w:700});y+=30*k;
  const on=m.ran&&m.t>PT?clamp(m.strain/.2,0,1):0;
  const bar=(lab,v,col)=>{txt(ctx,lab,X+6,y,{s:12*k,c:PAL['cv-ink']});y+=5;ctx.fillStyle=PAL['line'];rr(ctx,X+6,y,W-14,9,4);ctx.fill();ctx.fillStyle=PAL[col];rr(ctx,X+6,y,Math.max(4,(W-14)*v),9,4);ctx.fill();y+=14+10*k;};
  bar('Energy the cell needs',.4+.6*on,'s4');bar('Blood flow to the area',.75-.4*on,'s2');
  if(atLeast('honors')&&k<1.35){y+=2;const pX=X+40,pW=W-58,pH=525-y-34;if(pH>50){const T=m.tr;ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(pX,y,pW,pH);
      const fx=q=>pX+q/120*pW,fg=v=>y+pH-clamp(v/150,0,1)*pH,fm=v=>y+pH*.6-clamp(v/10,-.5,1)*pH*.6;
      ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2.5;ctx.beginPath();T.forEach((q,i)=>{i?ctx.lineTo(fx(q[0]),fg(q[1])):ctx.moveTo(fx(q[0]),fg(q[1]));});ctx.stroke();
      ctx.strokeStyle=PAL['s1'];ctx.beginPath();T.forEach((q,i)=>{i?ctx.lineTo(fx(q[0]),fm(q[2])):ctx.moveTo(fx(q[0]),fm(q[2]));});ctx.stroke();
      txt(ctx,'Head g',pX+4,y+13*k,{s:12*k,w:600,c:PAL['s4']});txt(ctx,'Brain shift',pX+pW-4,y+13*k,{s:12*k,w:600,c:PAL['s1'],a:'right'});
      txt(ctx,'0',pX,y+pH+15*k,{s:12*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'120 ms',pX+pW,y+pH+15*k,{s:12*k,c:PAL['cv-soft'],a:'right'});}}
}
/* a front-view figure, used for the balance test */
function limb(ctx,pts,w,fill,st){ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=st;ctx.lineWidth=w+3;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.strokeStyle=fill;ctx.lineWidth=w;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();}
function drawBess(sim,ctx,k,t){const b=sim.st.b,tr=b.tr,stance=tr?tr.stance:sim.p.stance,who=tr?tr.who:sim.p.who;const running=tr&&!tr.done;
  const ev=running?tr.ev.find(e=>tr.t>=e.t&&tr.t<e.t+e.d):null,e=ev?ev.k:null;
  const swayAmp=running?(who==='today'?1:.45)*(stance==='double'?1.5:stance==='tandem'?4:6):0,sway=RM?0:Math.sin(t*2.2)*swayAmp+Math.sin(t*3.7)*swayAmp*.4;
  const fill=PAL['card2'],st=PAL['cv-soft'],cx=205;
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,496,410,38);ctx.fillStyle=PAL['line'];ctx.fillRect(0,496,410,2);
  ctx.save();const lean=e==='out'?.2:sway*.008;ctx.translate(cx,490);ctx.rotate(lean);ctx.translate(-cx,-490);
  const hipY=300,kneeY=395,footY=490;
  const legs=[];
  if(stance==='double'){legs.push([[cx-20,hipY],[cx-22-(e==='step'?22:0),kneeY],[cx-24-(e==='step'?48:0),footY]],[[cx+20,hipY],[cx+22,kneeY],[cx+24,footY-(e==='heel'?10:0)]]);}
  else if(stance==='single'){const free=e==='hip'?[[cx-20,hipY],[cx-70,kneeY-22],[cx-122,footY-92]]:e==='step'?[[cx-20,hipY],[cx-46,kneeY],[cx-74,footY]]:[[cx-20,hipY],[cx-34,kneeY-14],[cx-22,footY-58]];legs.push(free,[[cx+18,hipY],[cx+16,kneeY],[cx+14,footY-(e==='heel'?10:0)]]);}
  else{const backLeg=e==='hip'?[[cx-14,hipY],[cx-60,kneeY-10],[cx-104,footY-52]]:e==='step'?[[cx-14,hipY],[cx-36,kneeY],[cx-60,footY]]:[[cx-14,hipY],[cx-6,kneeY],[cx-2,footY-8]];legs.push(backLeg,[[cx+14,hipY],[cx+6,kneeY],[cx+2,footY-(e==='heel'?8:0)]]);}
  legs.forEach(L=>{limb(ctx,L,26,fill,st);const f=L[2];ctx.fillStyle=fill;ctx.strokeStyle=st;ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(f[0],f[1]+5,20,9,0,0,6.2832);ctx.fill();ctx.stroke();});
  // torso
  ctx.fillStyle=RED;rr(ctx,cx-52,158,104,150,20);ctx.fill();txt(ctx,'RJ',cx,232,{s:30,w:800,c:'#ffffff',a:'center',b:'middle'});
  // arms: hands on hips
  const armR=[[cx-52,176],[cx-92,238],[cx-54,290]],armL=e==='hands'?[[cx+52,176],[cx+108,178],[cx+156,144]]:[[cx+52,176],[cx+92,238],[cx+54,290]];
  limb(ctx,armR,18,fill,st);limb(ctx,armL,18,fill,st);
  // head
  ctx.fillStyle=fill;ctx.strokeStyle=st;ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,112,38,0,6.2832);ctx.fill();ctx.stroke();
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;[-14,14].forEach(dx=>{ctx.beginPath();if(e==='eyes'){ctx.fillStyle=PAL['card'];ctx.arc(cx+dx,108,6,0,6.2832);ctx.fill();ctx.stroke();ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(cx+dx,108,2.4,0,6.2832);ctx.fill();}else{ctx.moveTo(cx+dx-6,108);ctx.quadraticCurveTo(cx+dx,112,cx+dx+6,108);ctx.stroke();}});
  ctx.lineCap='butt';ctx.restore();
  // feet from above
  const px=14,py=16,pw=118,ph=70+10*k;ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;rr(ctx,px,py,pw,ph,8);ctx.fill();ctx.stroke();txt(ctx,k>1.35?'Feet':'Feet from above',px+pw/2,py+12*k,{s:12*k,c:PAL['cv-soft'],a:'center',w:600});
  const foot=(x,y,lit)=>{ctx.fillStyle=lit?PAL['s2']:PAL['line'];ctx.beginPath();ctx.ellipse(x,y,6,14,0,0,6.2832);ctx.fill();};const fy=py+ph/2+8*k-2;
  if(stance==='double'){foot(px+pw/2-8,fy,true);foot(px+pw/2+8,fy,true);}else if(stance==='single'){foot(px+pw/2-10,fy,false);foot(px+pw/2+10,fy,true);}else{foot(px+pw/2,fy-13,true);foot(px+pw/2,fy+13,true);}
  // panel
  const X=424,W=364;ctx.fillStyle=PAL['cv-bg2'];rr(ctx,X-6,8,W+12,517,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  let y=14+15*k;const sn=STANCES.find(s=>s.v===stance).l;txt(ctx,sn+' stance, firm surface',X+6,y,{s:13.5*k,w:700});y+=15*k;
  txt(ctx,who==='base'?'Preseason baseline':'Today, after the hit',X+6,y,{s:12*k,c:PAL['cv-soft']});y+=10;
  ctx.fillStyle='#12161a';rr(ctx,X+6,y,W-14,34+10*k,8);ctx.fill();const tl=tr?Math.max(0,20-tr.t):20;txt(ctx,tl.toFixed(1)+' s',X+20,y+17+5*k,{s:22*Math.min(k,1.4),w:700,c:'#7dffa0',b:'middle'});
  txt(ctx,'You counted: '+(tr?tr.count:0),X+W-16,y+17+5*k,{s:13*k,w:700,c:tr&&tr.flash>0?'#ffd65a':'#ffffff',a:'right',b:'middle'});y+=44+10*k;
  if(tr&&tr.done){const n=tr.ev.length;y=wrap(ctx,'You counted '+tr.count+'. The scored count is '+n+'.'+(tr.count===n?' You matched.':' Watch again if you want to practice.'),X+6,y+10*k,W-12,{s:12*k,w:600});
    if(k<1.35){const names=[...new Set(tr.ev.map(e=>ERR[e.k]))].slice(0,3);names.forEach(nm=>{y=wrap(ctx,'• '+nm,X+6,y,W-12,{s:12*k,c:PAL['cv-soft']});});}y+=4;}
  else if(running)y=wrap(ctx,'Press Count an error each time you see one.',X+6,y+10*k,W-12,{s:12*k,c:PAL['cv-soft']})+2;
  else y=wrap(ctx,'Hands on hips, eyes closed, 20 seconds. Each error counts as 1, up to 10 for the stance.',X+6,y+10*k,W-12,{s:12*k,c:PAL['cv-soft']})+2;
  // table
  const rowH=14+11*k,c0=X+6,c1=X+W*.52,c2=X+W*.77,c3=X+W-14;const yT=Math.max(y+6,525-rowH*5-6);y=yT;
  txt(ctx,'Errors',c0,y+rowH*.7,{s:12*k,w:700});txt(ctx,'Base',c1,y+rowH*.7,{s:12*k,w:700,a:'right'});txt(ctx,'Today',c2,y+rowH*.7,{s:12*k,w:700,a:'right'});txt(ctx,'+/−',c3,y+rowH*.7,{s:12*k,w:700,a:'right'});
  y+=rowH;ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(c0,y);ctx.lineTo(c3,y);ctx.stroke();
  const fmt=v=>v===null?'–':String(v);STANCES.forEach((s,i)=>{const a=b.res.base[i],c=b.res.today[i];txt(ctx,s.l,c0,y+rowH*.7,{s:12*k});txt(ctx,fmt(a),c1,y+rowH*.7,{s:12*k,a:'right'});txt(ctx,fmt(c),c2,y+rowH*.7,{s:12*k,a:'right'});
    txt(ctx,a!==null&&c!==null?(c-a>=0?'+':'')+(c-a):'–',c3,y+rowH*.7,{s:12*k,a:'right',w:600});y+=rowH;});
  const ta=total(b.res.base),tc=total(b.res.today);txt(ctx,'Total',c0,y+rowH*.7,{s:12*k,w:700});txt(ctx,fmt(ta),c1,y+rowH*.7,{s:12*k,w:700,a:'right'});txt(ctx,fmt(tc),c2,y+rowH*.7,{s:12*k,w:700,a:'right'});txt(ctx,ta!==null&&tc!==null?(tc-ta>=0?'+':'')+(tc-ta):'–',c3,y+rowH*.7,{s:12*k,w:700,a:'right',c:PAL['s1']});}
function drawSide(sim,ctx,k){const sd=sim.st.sd,c=scn(sim),cust=c.v==='custom',shown=shownSigns(sim),ids=cust?SIGNS.map(s=>s.id):shown,decided=!!sd.dec&&sd.fp===sim.p.scn;
  const X=12,W=400;let y=14+15*k;
  y=wrap(ctx,c.t,X,y,W-8,{s:12.5*k,w:600});y+=4;sd.rects=[];
  if(!cust&&!ids.length){y=wrap(ctx,'No signs or symptoms on your check.',X,y+8,W-8,{s:12.5*k,c:PAL['cv-soft']});}
  const rowH=Math.min(34,(525-y)/Math.max(ids.length,1));
  ids.forEach(id=>{const s=SIGNS.find(q=>q.id===id),on=shown.includes(id);const h=Math.min(rowH-3,16+12*k);
    const bg=decided&&on?(s.red?PAL['s1']:PAL['s4']):on?PAL['card']:PAL['cv-bg2'],fg=decided&&on?'#ffffff':PAL['cv-ink'];ctx.fillStyle=bg;ctx.strokeStyle=on?PAL['cv-ink']:PAL['line'];ctx.lineWidth=on?2:1;rr(ctx,X,y,W-8,h,6);ctx.fill();ctx.stroke();
    const box=cust?(on?'☑ ':'☐ '):'';txt(ctx,box+s.l,X+8,y+h/2+1,{s:Math.min(12*k,h*.76),w:on?600:400,c:fg,b:'middle'});sd.rects.push({id,x:X,y,w:W-8,h});y+=rowH;});
  // flow
  const FX=424,FW=364;ctx.fillStyle=PAL['cv-bg2'];rr(ctx,FX-6,8,FW+12,517,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  const res=decided?sd.want:null;const nodes=[['ems','Any red flag?','Call EMS.'],['remove','Any sign or symptom?','Remove from play. No return today.'],['watch','None now?','Keep watching and recheck.']];
  let fy=16;const fh=44+26*k;
  nodes.forEach(n=>{const isOn=res===n[0];ctx.fillStyle=isOn?PAL[n[0]==='ems'?'s1':n[0]==='remove'?'s4':'s3']:PAL['card'];ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;rr(ctx,FX+4,fy,FW-12,fh,8);ctx.fill();ctx.stroke();const fc=isOn?'#ffffff':PAL['cv-ink'];
    let ty=fy+16*k;ty=wrap(ctx,n[1],FX+14,ty,FW-32,{s:12.5*k,w:700,c:fc});wrap(ctx,n[2],FX+14,ty,FW-32,{s:12*k,c:fc});fy+=fh+8;});
  if(decided){const yy=fy+8*k;const hdr=(sd.ok?'Right call: ':'Think again. ');let t;
    if(sd.ok)t=hdr+WHY[sd.want];else t=hdr+'Look at each sign. Is it a red flag? If so, EMS. If it is any other sign or symptom, remove. Only with none do you keep watching.';
    wrap(ctx,t,FX+6,yy,FW-14,{s:12*k,c:PAL[sd.ok?'cv-ink':'s1'],w:sd.ok?400:600});}
  else wrap(ctx,'Your call: choose one of the three buttons.',FX+6,fy+8*k,FW-14,{s:12*k,c:PAL['cv-soft']});}
function drawRtp(sim,ctx,k){const r=sim.st.r;const X=12,W=372;
  // ladder from bottom to top
  const top=14,rowH=(345-top)/6;RSTEPS.forEach((s,i)=>{const yy=top+(5-i)*rowH,h=rowH-5,on=i===r.step,past=i<r.step;ctx.fillStyle=on?PAL['s2']:past?PAL['card']:PAL['cv-bg2'];ctx.strokeStyle=on?PAL['s2']:PAL['line'];ctx.lineWidth=1.5;rr(ctx,X+(i)*(k>1.35?2:7),yy,W-(i)*(k>1.35?2:7),h,6);ctx.fill();ctx.stroke();
    const nm=k>1.35?s.n.replace('Step ','').replace(/: .*/,m=>m.replace(': ',': ')).slice(0,30):s.n;txt(ctx,nm,X+10+i*(k>1.35?2:7),yy+h/2+1,{s:Math.min(12*k,h*.62),w:on?700:400,c:on?'#ffffff':PAL['cv-ink'],b:'middle'});});
  // detail
  let y=352+11*k;y=wrap(ctx,RSTEPS[r.step].d,X,y,W,{s:12*k});y+=2;
  if(r.msg)wrap(ctx,r.msg.t,X,y,W,{s:12*k,w:600,c:PAL[r.msg.c]});
  // chart
  const CX=404,CW=384;ctx.fillStyle=PAL['cv-bg2'];rr(ctx,CX-6,8,CW+12,517,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  txt(ctx,'Day '+r.day,CX+6,14+15*k,{s:15*k,w:700});txt(ctx,'Symptoms '+r.sym.toFixed(1)+' of 10',CX+CW-10,14+15*k,{s:13*k,w:700,a:'right'});
  txt(ctx,r.clear?'Written clearance: yes':'Written clearance: not yet',CX+6,14+32*k,{s:12*k,c:r.clear?PAL['s3']:PAL['cv-soft'],w:600});
  const pX=CX+36,pY=30+34*k,pW=CW-52,pH=500-pY-14*k,dMax=Math.max(21,r.day+2);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;for(let i=0;i<=10;i+=5){const yy=pY+pH-(i/10)*pH;ctx.beginPath();ctx.moveTo(pX,yy);ctx.lineTo(pX+pW,yy);ctx.stroke();txt(ctx,String(i),pX-6,yy+4,{s:12*k,c:PAL['cv-soft'],a:'right'});}
  const fx=d=>pX+d/dMax*pW,fy=v=>pY+pH-(v/10)*pH;
  // steps as a band
  r.hist.forEach((h,i)=>{const nx=r.hist[i+1];const x1=fx(h.d),x2=fx(nx?nx.d:h.d+1);ctx.fillStyle=PAL['s2'];ctx.globalAlpha=.1+.07*h.s;ctx.fillRect(x1,pY,x2-x1,pH);ctx.globalAlpha=1;});
  ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;ctx.beginPath();r.hist.forEach((h,i)=>{i?ctx.lineTo(fx(h.d),fy(h.y)):ctx.moveTo(fx(h.d),fy(h.y));});ctx.stroke();ctx.fillStyle=PAL['s1'];r.hist.forEach(h=>{ctx.beginPath();ctx.arc(fx(h.d),fy(h.y),4,0,6.2832);ctx.fill();});
  txt(ctx,k>1.35?'Days since injury':'Days since injury. Darker band: higher step.',pX+pW/2,pY+pH+12+6*k,{s:12*k,c:PAL['cv-soft'],a:'center'});}

/* ---------- definition ---------- */
const SIM={
  id:'concussion',hash:'concussion',apUnit:15,order:6,kind:'Simulation',tab:'Concussion',next:['neuroexam','clinic'],
  card:'See why the brain moves inside the skull, score a BESS test, make the sideline call and walk the steps back to sport.',
  title:'Concussion: sideline to return',
  lede:{bio:'A concussion is a brain injury from a bump, blow or jolt. Watch what happens inside the skull, then practice the decisions an Athletic Trainer makes on the sideline and over the next weeks.',
    honors:'Follow a concussion from mechanism to return: the head stops but the brain keeps moving, stretched cells change chemically, and the test and return steps guard against a second injury.',
    ap:'Connect mechanics to care. Compare straight and rotational loads, score balance against baseline, and defend each sideline and return decision.'},
  scale:'One athlete. A head moves through its impact in about 12 milliseconds, shown here in slow motion. Recovery takes days to weeks. For education only.',
  aspect:3/2,timeless:true,animated:true,graph:false,controlsTitle:'Your controls',
  controls:[
    {id:'view',label:'View',type:'seg',def:'mech',lvl:'bio',noTrial:true,options:[{v:'mech',l:'Mechanism'},{v:'bess',l:'BESS test'},{v:'side',l:'Sideline'},{v:'rtp',l:'Return'}],onChange(sim){sync(sim);sim.infoDirty=true;}},
    {id:'hit',label:'What happens',type:'select',def:'front',lvl:'bio',vw:'mech',options:Object.keys(HITS).map(v=>({v,l:HITS[v].l})),onChange(sim){if(sim.st)sim.st.m=hitFresh();}},
    {id:'g',label:'Peak head acceleration',type:'range',min:20,max:150,step:5,def:95,unit:' g',lvl:'bio',vw:'mech',help:'Most hits in high school football measure about 20 to 30 g. Concussions have been recorded across a wide range.',onChange(sim){if(sim.st)sim.st.m=hitFresh();}},
    {id:'who',label:'Test day',type:'seg',def:'base',lvl:'bio',vw:'bess',options:[{v:'base',l:'Preseason baseline'},{v:'today',l:'Today, after the hit'}]},
    {id:'stance',label:'Stance',type:'seg',def:'double',lvl:'bio',vw:'bess',options:STANCES},
    {id:'scn',label:'Scenario',type:'select',def:'a',lvl:'bio',vw:'side',options:SCN.map(c=>({v:c.v,l:c.l})),onChange(sim){if(sim.st){sim.st.sd.dec=null;}sync(sim);}},
    {id:'sign',label:'Sign to add or remove',type:'select',def:'head',lvl:'bio',vw:'side',custOnly:true,noTrial:true,options:SIGNS.map(s=>({v:s.id,l:s.l}))}
  ],
  actions:[
    {id:'hitrun',label:'Run the impact',primary:true,vw:'mech',run(sim){hitStart(sim);}},
    {id:'bstart',label:'Start the 20 second trial',primary:true,vw:'bess',run(sim){bessStart(sim);}},
    {id:'bcount',label:'Count an error',vw:'bess',run(sim){const tr=sim.st.b.tr;if(tr&&!tr.done){tr.count++;tr.flash=.4;}}},
    {id:'bnew',label:'New athlete',vw:'bess',run(sim){sim.st.b=bessFresh();}},
    {id:'toggle',label:'Add or remove this sign',vw:'side',custOnly:true,run(sim){const sd=sim.st.sd,i=sd.custom.indexOf(sim.p.sign);if(i>=0)sd.custom.splice(i,1);else sd.custom.push(sim.p.sign);sd.dec=null;}},
    {id:'dwatch',label:'Keep watching and recheck',vw:'side',run(sim){decide(sim,'watch');}},
    {id:'dremove',label:'Remove from play',vw:'side',run(sim){decide(sim,'remove');}},
    {id:'dems',label:'Call EMS',vw:'side',run(sim){decide(sim,'ems');}},
    {id:'rup',label:'Next day: move up a step',primary:true,vw:'rtp',run(sim){rGo(sim,1);}},
    {id:'rstay',label:'Next day: stay on this step',vw:'rtp',run(sim){rGo(sim,0);}},
    {id:'rback',label:'Next day: go back a step',vw:'rtp',run(sim){rGo(sim,-1);}},
    {id:'rclear',label:'See a provider for written clearance',vw:'rtp',run(sim){rClear(sim);}},
    {id:'rnew',label:'New case',vw:'rtp',run(sim){sim.st.r=rFresh(Math.floor(Math.random()*2147483646)+1);}}
  ],
  init(){return {m:hitFresh(),b:bessFresh(),sd:{dec:null,custom:[],rects:[]},r:rFresh(Math.floor(Math.random()*2147483646)+1)};},
  step(sim,dt){hitStep(sim,dt);bessStep(sim,dt);},
  onLevel(sim){sync(sim);sim.infoDirty=true;},
  metrics:[
    {id:'peakg',vw:'mech',label:'Peak head acceleration',unit:'g',lvl:'bio',min:0,max:150,d:0,get:s=>s.st.m.peakG},
    {id:'shift',vw:'mech',label:'Peak brain shift',unit:'mm',lvl:'bio',min:0,max:10,d:1,get:s=>s.st.m.peakX},
    {id:'strain',vw:'mech',label:'Brain tissue stretch',unit:'%',lvl:'honors',min:0,max:60,d:0,get:s=>s.st.m.strain*100},
    {id:'alpha',vw:'mech',label:'Rotational acceleration',unit:'rad/s²',lvl:'ap',min:0,max:14000,d:0,get:s=>s.st.m.alpha},
    {id:'bbase',vw:'bess',label:'Baseline total errors',lvl:'bio',text:true,get:s=>{const v=total(s.st.b.res.base);return v===null?'Run all 3 stances':String(v);}},
    {id:'btoday',vw:'bess',label:'Today’s total errors',lvl:'bio',text:true,get:s=>{const v=total(s.st.b.res.today);return v===null?'Run all 3 stances':String(v);}},
    {id:'rday',vw:'rtp',label:'Day',lvl:'bio',min:0,max:40,d:0,get:s=>s.st.r.day},
    {id:'rstep',vw:'rtp',label:'Step',lvl:'bio',min:1,max:6,d:0,get:s=>s.st.r.step+1},
    {id:'rsym',vw:'rtp',label:'Symptoms',unit:'of 10',lvl:'bio',min:0,max:10,d:1,get:s=>s.st.r.sym}
  ],
  infoPanel(sim){const v=sim.p.view;
    if(v==='mech')return '<h3>What a concussion is</h3><p>A traumatic brain injury from a bump, blow or jolt. The brain moves inside the skull, and that stretches and damages brain cells and causes chemical changes (CDC HEADS UP).</p><p>In high school sport-related concussion, football is the leading cause for males and soccer for females. Symptoms may take up to 24 hours to appear, and high school athletes tend to recover more slowly than college athletes.</p><p>CT and MRI are not routine. They look for bleeds and fractures, and a concussion usually looks normal on them.</p>';
    if(v==='bess')return '<h3>BESS errors</h3><p>Hands off the hips. Opening the eyes. A step, stumble or fall. Hip moved out past 30°. Lifting the forefoot or heel. Out of position for more than 5 seconds.</p><p>Compare with the athlete’s own baseline, not with a teammate. A rise of several errors is a warning sign. The test alone cannot diagnose a concussion or clear an athlete.</p><p>Other sideline tools: SCAT, myotome and dermatome testing, cranial nerve testing and a symptom check.</p>';
    if(v==='side')return '<h3>Red flags: call EMS</h3><p>Posturing (decorticate or decerebrate). Decreasing or fluctuating consciousness. Numbness in arms or legs. Unequal or non-reactive pupils. Repeated vomiting. Seizures. Inability to speak. Inability to recognize people or places.</p><h3>Colorado law</h3><p>The Jake Snakenberg Youth Concussion Act (SB 11-040): a coach who suspects a concussion must remove the athlete immediately. The athlete cannot return to play or take part in supervised physical team activities until a health care provider gives written clearance: an MD, DO, licensed NP, licensed PA, or licensed doctor of psychology with concussion training. An athletic trainer is not on that list. After clearance, a registered athletic trainer who knows the athlete’s condition may manage the graduated return. The law covers activities where most participants are at least 11 and under 19. College activities are excluded.</p><p>Management: remove, relative rest, decrease symptom burden, treat impairments, gradual return to learn, return to play when symptom free.</p>';
    return '<h3>Return to learn runs alongside</h3><p>Daily activities at home, then school work at home, then part-time school, then full-time school. A full return to school comes before full contact.</p><h3>Longer-term words</h3><p><b>PCS:</b> post-concussion syndrome, symptoms that last much longer than expected. <b>SIS:</b> second impact syndrome, a rare and dangerous brain swelling after a second hit before the first has healed. <b>CTE:</b> chronic traumatic encephalopathy, linked with repeated head impacts and only diagnosed at autopsy.</p>';},
  bindInfo(){},
  onClick(sim,x,y){if(sim.p.view!=='side'||sim.p.scn!=='custom')return;const sd=sim.st.sd,h=(sd.rects||[]).find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);if(!h)return;const i=sd.custom.indexOf(h.id);if(i>=0)sd.custom.splice(i,1);else sd.custom.push(h.id);sd.dec=null;},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,534);const v=sim.p.view;if(v==='mech')drawMech(sim,ctx,k,t);else if(v==='bess')drawBess(sim,ctx,k,t);else if(v==='side')drawSide(sim,ctx,k);else drawRtp(sim,ctx,k);},
  narrate(sim){const v=sim.p.view,s=sim.st;
    if(v==='mech'){const m=s.m;if(!m.ran)return 'Press <b>Run the impact</b>. The head moves first. The brain floats in fluid, so it <b>lags behind</b> and meets the skull wall.';if(m.on)return m.t<PT?'<b>The skull moves away</b> from the blow in about 12 ms, and the brain lags behind.':'The brain rebounds toward the other side. Stretch happens in thousandths of a second, too fast to brace against.';
      return '<b>Peak brain shift '+m.peakX.toFixed(1)+' mm</b>, tissue stretch about '+Math.round(m.strain*100)+'%. '+(m.hit==='jolt'?'Nothing touched the head. A jolt can be enough.':m.hit==='side'?'Turning the head stretches tissue more than a straight blow of the same size.':'A straight blow moves the brain, with less turning. It can still injure.')+' No g number can diagnose a concussion.';}
    if(v==='bess'){const b=s.b,tr=b.tr;if(!tr)return 'Pick a test day and a stance, then start the trial. <b>You are the scorer</b>: count each error.';if(!tr.done)return 'Eyes closed, hands on hips. Press <b>Count an error</b> each time you see one.';const ta=total(b.res.base),tc=total(b.res.today);
      if(ta!==null&&tc!==null)return '<b>Baseline '+ta+', today '+tc+'.</b> A rise of several errors from the athlete’s own baseline is a warning sign. It adds to the picture and does not decide alone.';return 'Scored count recorded. Run all <b>three stances on both test days</b> to compare with baseline.';}
    if(v==='side'){const sd=s.sd,c=scn(sim);if(!sd.dec)return c.v==='custom'?'Pick the signs you see, then make your call. <b>A red flag changes the plan</b>.':'Read the scene and the signs, then make your call.';if(sd.ok)return '<b>'+DEC[sd.want]+'.</b> '+(sd.want==='ems'?'A red flag is here.':sd.want==='remove'?'Any sign or symptom means no return today.':'No signs right now, but symptoms can appear up to 24 hours later.');return 'Not the call this scene needs. Read the signs again.';}
    const r=s.r;if(r.day===0)return 'Day 0. Stage 1 is No Activity, with the goal of recovery. Your notes call the acute plan <b>relative rest</b>. Each step takes at least 24 hours.';if(r.msg&&r.msg.c==='s1')return r.msg.t;if(r.step===5&&r.sym===0)return '<b>Back in play on day '+r.day+'.</b> Compare this with a case where you moved up too fast.';return 'Day '+r.day+', '+RSTEPS[r.step].n+'. Symptoms '+r.sym.toFixed(1)+' of 10. Mild symptoms may be present in steps 1 to 3. Steps 4 to 6 wait until the athlete is back to baseline.';},
  lab:{bio:'<p><b>Question:</b> how does a rise in balance errors compare with the athlete’s own baseline?</p><ol><li>Choose <b>BESS test</b>. Set Test day to Preseason baseline. Run all three stances and press <b>Record trial</b> after each.</li><li>Set Test day to Today and run them again.</li></ol><p>Write: which stance changed most? Why compare to the athlete’s own baseline?</p>',
    honors:'<p><b>Question:</b> does the type of hit change what the brain feels?</p><ol><li>Choose <b>Mechanism</b>. Set Peak head acceleration to 95 g and run each of the three hits. Press <b>Record trial</b> after each.</li><li>Change only g. Which readouts change?</li><li>Compare the tissue stretch in each hit.</li></ol><p>Write: why is a g number not enough to decide whether an athlete is concussed?</p>',
    ap:'<p><b>Question:</b> what does moving too fast cost?</p><ol><li>Choose <b>Return</b>. On one case, move up every day when allowed. Record the day you return and how many symptom spikes you get.</li><li>Press <b>New case</b>. Go slower, staying a day whenever symptoms rise, and record the same numbers.</li></ol><p>Write a claim, evidence and reasoning: how should symptoms decide when an athlete moves up?</p>'},
  terms:[
    {t:'Concussion',d:'A traumatic brain injury from a bump, blow or jolt that moves the brain in the skull, stretching and damaging cells and causing chemical changes.'},
    {t:'Red flag',d:'A sign that needs EMS now: posturing, fading consciousness, numbness, unequal pupils, repeated vomiting, seizure, inability to speak or to recognize people or places.'},
    {t:'BESS',d:'Balance Error Scoring System: three stances, 20 seconds each, eyes closed, hands on hips. Count the errors.'},
    {t:'SCAT',d:'Sport Concussion Assessment Tool, a standard form for sideline and follow-up evaluation.'},
    {t:'RTP and return to learn',d:'Return to play and return to learn. Gradual, step-by-step returns to sport and to school.'},
    {t:'Jake Snakenberg Act',d:'Colorado’s youth concussion law (SB 11-040). A coach who suspects a concussion must remove the athlete immediately. No return to play or supervised physical team activities until a health care provider gives written clearance. An athletic trainer is not on the list of who can give it, but a registered athletic trainer may manage the graduated return after it.'},
    {t:'Coup and contrecoup',d:'Injury under the point of impact (coup) and on the opposite side as the brain rebounds (contrecoup).',lvl:'honors'},
    {t:'PCS',d:'Post-concussion syndrome: symptoms that last much longer than expected.',lvl:'honors'},
    {t:'SIS',d:'Second impact syndrome: rare, dangerous brain swelling after a second hit before the first has healed.',lvl:'honors'},
    {t:'CTE',d:'Chronic traumatic encephalopathy. Linked with repeated head impacts and only diagnosed at autopsy.',lvl:'honors'},
    {t:'Neurometabolic cascade',d:'The chemical changes after a concussion: ions leak across stretched membranes, cells burn more energy to restore them, and blood flow may fall. That mismatch is one reason a second hit is dangerous.',lvl:'ap'}],
  about:'<p><b>For education only.</b> This tool never diagnoses anyone. If you think you have a concussion, stop playing and tell your athletic trainer, a parent or a clinician. Never decide on your own that you are ready to go back.</p><p><b>Mechanism.</b> The brain is modeled as a damped mass in the skull: a 12 ms half-sine pulse drives it, with spring and damping tuned so 95 g shifts it between 5 and 6 mm, the order of size reported in cadaver studies. The drawing doubles the shift so you can see it. Tissue stretch is a simple scale on rotational acceleration, fitted to the size of finite-element estimates (about 25% near 5,500 rad/s²). The three hit types use fixed ratios of rotation to g, and the jolt does not model the neck in detail. Real brains are not this simple, and no number predicts injury in one person. The chemical bars show direction only, with no units.</p><p><b>BESS.</b> Baseline and post-injury error counts are made-up but realistic, with single-leg the hardest stance. Only the firm surface is used, as in class. <b>Return.</b> The six stages and objectives are Ms. McKeon’s return-to-play table. At least 24 hours per step, and go back when symptoms return. The 2022 Amsterdam consensus now starts with symptom-limited activity after relative rest of 24 to 48 hours rather than no activity, so her first stage is the older name. World Rugby’s summary of that strategy says mild symptoms may be present in steps 1 to 3 and steps 4 to 6 wait until the athlete is back to baseline. The tool places Colorado’s written clearance before step 4, treating non-contact team drills as the first supervised team activity. Symptoms use a made-up 0 to 10 scale that decays with time and rises with too much load, and the rule that a provider will not sign while symptoms remain is part of this model.</p><p>Follow your school’s and your clinician’s plan, which may differ.</p>',
  challengeTitle:'Predict, then test',
  challenges:[
    {lvl:'bio',instant:true,demo:{view:'mech',hit:'jolt',g:60},q:'Can an athlete get a concussion without being hit in the head?',choices:['Yes. A jolt to the body can move the brain inside the skull.','No. Something must hit the head.','Only if the athlete has no helmet.'],correct:0,explain:'Run the jolt: the brain still shifts and stretches. The CDC definition includes a bump, blow or jolt to the head or body.'},
    {lvl:'bio',instant:true,demo:{view:'side',scn:'b'},q:'A soccer player has a headache and is bothered by light at halftime. What is the call?',choices:['Remove from play, no return today','Keep playing and recheck after the game','Call EMS'],correct:0,explain:'Any sign or symptom is a suspected concussion, so remove the athlete. Neither sign here is a red flag, so EMS is not the first move.'},
    {lvl:'bio',instant:true,demo:{view:'rtp'},q:'How long should each step of the return take?',choices:['At least 24 hours','At least 1 hour','At least one week'],correct:0,explain:'Each step takes at least 24 hours. If symptoms return, go back a step.'},
    {lvl:'honors',instant:true,demo:{view:'mech',hit:'side',g:95},q:'Two hits have the same peak g. One is straight, one glancing. Which stretches brain tissue more in this model?',choices:['The glancing hit, because it turns the head','The straight hit','They stretch the same'],correct:0,explain:'At 95 g the straight hit stretches tissue about 13% in this model and the glancing hit about 28%. Rotation stretches tissue. The brain shift is the same.'},
    {lvl:'honors',instant:true,demo:{view:'side',scn:'f'},q:'An athlete is dizzy and does not recognize a teammate. What is the call?',choices:['Call EMS: not recognizing people is a red flag','Remove from play and recheck tomorrow','Keep watching: dizziness is common'],correct:0,explain:'Dizziness alone means remove. Not recognizing people or places is a red flag, which means EMS.'},
    {lvl:'ap',instant:true,demo:{view:'mech',hit:'front',g:95},q:'In the graph, when does the brain reach its first peak shift compared with the end of the head pulse?',choices:['Close to the end of the pulse, then it rebounds the other way','Long after the pulse, about 100 ms later','Before the pulse starts'],correct:0,explain:'The pulse lasts 12 ms and the brain peaks near its end. It then rebounds the other way: coup, then contrecoup.'},
    {lvl:'ap',instant:true,demo:{view:'rtp'},q:'A Colorado high school athlete is symptom free on step 3. May the athlete join non-contact team drills?',choices:['Only after written clearance from a health care provider','Yes, if the athletic trainer approves','Yes, because the symptoms are gone'],correct:0,explain:'Non-contact team drills are a supervised team activity, so the tool blocks step 4 until written clearance. An athletic trainer is not on the law’s list of who can give it.'}
  ],
  onChallenge(sim,ch,phase){const d=ch&&ch.demo;if(!d||phase!=='ask')return;BioLab.setValues(sim,d);if(d.view==='mech')hitStart(sim);},
  tour:[
    {title:'The blow',text:'The skull moves away from the blow in about 12 milliseconds. Your brain floats in fluid, so it <b>lags behind</b> and presses against the skull wall nearest the hit.',speed:.25,focus:[20,40,430,480],setup(sim){BioLab.setValues(sim,{view:'mech',hit:'front',g:95});hitStart(sim);}},
    {title:'The rebound',text:'Then the brain swings back and meets the opposite wall. Injury can appear on both sides: <b>coup</b> under the hit and <b>contrecoup</b> across from it.',speed:.15,focus:[20,40,430,480],setup(sim){BioLab.setValues(sim,{view:'mech',hit:'front',g:95});hitStart(sim);sim.st.m.t=0;}},
    {title:'Rotation and jolts',text:'Turning the head stretches brain tissue more than a straight blow of the same size. A hit to the body can do it too, with no contact to the head at all.',speed:.3,focus:[0,0,800,533],setup(sim){BioLab.setValues(sim,{view:'mech',hit:'jolt',g:60});hitStart(sim);}},
    {title:'The sideline decision',text:'Scan for red flags first: those mean EMS. Any other sign or symptom means <b>remove from play</b>, with no return today.',speed:1,pause:false,focus:[0,0,800,533],setup(sim){BioLab.setValues(sim,{view:'side',scn:'c'});decide(sim,'ems');}},
    {title:'BESS: balance against baseline',text:'Eyes closed, hands on hips, three stances for 20 seconds each. Count the errors and compare them with this athlete’s own preseason score.',speed:1,focus:[0,0,800,533],setup(sim){BioLab.setValues(sim,{view:'bess',who:'today',stance:'single'});bessStart(sim);}},
    {title:'The return',text:'Relative rest comes first, then six stages from No Activity to Return to Play. Each step takes at least <b>24 hours</b>. If symptoms come back, go back a step. In Colorado, written clearance from a health care provider comes before the first supervised team activity, step 4.',speed:1,focus:[0,0,800,533],setup(sim){BioLab.setValues(sim,{view:'rtp'});sim.st.r=rFresh(4242);rGo(sim,1);rGo(sim,1);rGo(sim,0);rGo(sim,1);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{view:'mech',hit:'front',g:95});sim.st.m=hitFresh();sync(sim);},
  thumbSetup(sim){hitStart(sim);},thumbFrames:12
};
BioLab.register(SIM);
})();
