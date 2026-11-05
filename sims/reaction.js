(function(){
'use strict';
const {clamp,lerp,randn,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,lvText}=BioLab.h;

/* Reaction time model. Times in ms. The ruler is a free fall: d = 1/2 g t², with g = 980 cm/s². */
const G=980,RULER=30,tOf=d=>Math.sqrt(2*d/G),dOf=t=>0.5*G*t*t,MAXT=tOf(RULER)*1000;
const INP=['visual','auditory','tactile'],INL={visual:'Visual',auditory:'Auditory',tactile:'Tactile'};
const CUE={visual:'You see the ruler drop',auditory:'You hear “release”',tactile:'You feel a tap'};
const TAPD={shoulder:0.45,hand:1.05,foot:1.75};
const DIST={none:{ms:0,sd:1},talk:{ms:60,sd:1.5},text:{ms:120,sd:2}};
function timing(p,person){const v=p.nerve||60,hand=p.mover!=='foot';
  if(p.route==='reflex'){const d=hand?0.45:0.7,a=d/v*1000;
    return {S:1+a,I:1,M:a+1,E:15,cond:2*a,total:1+a+1+a+1+15,reflex:true};}
  let S,c;
  if(p.stim==='visual'){c=0.12/v*1000;S=35+c+18;}
  else if(p.stim==='auditory'){c=0.12/v*1000;S=1+c+12;}
  else{c=(TAPD[p.tap]||TAPD.shoulder)/v*1000;S=2+c+8;}
  const dd=DIST[p.distract]||DIST.none,prac=0.75+0.25*Math.exp(-(p.practice||0)/8);
  const I=Math.max(35,(75+(person||0))*prac+dd.ms);
  const mc=(hand?1.0:1.55)/v*1000,M=mc+3,E=hand?40:55;
  return {S,I,M,E,cond:c+mc,total:S+I+M+E,reflex:false};}
function trialSD(p){if(p.route==='reflex')return 2;return 18*(DIST[p.distract]||DIST.none).sd*(0.7+0.3*Math.exp(-(p.practice||0)/8));}
function startTrial(sim){const s=sim.st,p=sim.p,T=timing(p,s.person),n=randn()*trialSD(p),I=Math.max(T.reflex?1:30,T.I+(T.reflex?Math.abs(n)*.3:n)),rt=T.S+I+T.M+T.E;
  s.tr={t0:sim.t,stim:p.stim,route:p.route,mover:p.mover,tap:p.tap,S:T.S,I,M:T.M,E:T.E,rt,done:false,miss:p.route!=='reflex'&&p.mover!=='foot'&&rt>MAXT};s.next=Infinity;}
const SEG=[{k:'S',n:'Sensory input',c:'s2'},{k:'I',n:'Integration',c:'s5'},{k:'M',n:'Motor output',c:'s1'}];
function phase(tr,e){if(e<tr.S)return {i:0,f:e/tr.S};if(e<tr.S+tr.I)return {i:1,f:(e-tr.S)/tr.I};if(e<tr.S+tr.I+tr.M)return {i:2,f:(e-tr.S-tr.I)/tr.M};if(e<tr.rt)return {i:3,f:(e-tr.S-tr.I-tr.M)/tr.E};return {i:4,f:1};}

/* ---------- shared art ---------- */
const CB=[[.05,.5],[.03,.35],[.1,.17],[.25,.06],[.45,.02],[.65,.05],[.82,.15],[.94,.32],[.96,.48],[.88,.58],[.74,.6],[.62,.66],[.48,.76],[.3,.77],[.18,.67],[.2,.57],[.12,.58]];
const LOBE={frontal:[[0,0],[.47,0],[.37,.5],[.2,.57],[0,.7]],parietal:[[.47,0],[.74,0],[.72,.44],[.37,.5]],occipital:[[.74,0],[1,0],[1,.7],[.7,.62],[.72,.44]],temporal:[[0,.7],[.2,.57],[.37,.5],[.72,.44],[.7,.62],[.6,1],[0,1]]};
function brain(ctx,x,y,w,h,col){const X=u=>x+u*w,Y=v=>y+v*h,base=PAL['card2'];
  ctx.fillStyle=col.stem||base;rr(ctx,X(.53),Y(.6),.1*w,.4*h,.04*w);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.3;ctx.stroke();
  ctx.fillStyle=col.cereb||base;ctx.beginPath();ctx.ellipse(X(.76),Y(.74),.16*w,.13*h,0,0,6.2832);ctx.fill();ctx.stroke();
  const path=()=>{ctx.beginPath();const n=CB.length,P=CB.map(q=>[X(q[0]),Y(q[1])]),m=(a,b)=>[(P[a][0]+P[b][0])/2,(P[a][1]+P[b][1])/2],s=m(n-1,0);ctx.moveTo(s[0],s[1]);for(let i=0;i<n;i++){const e=m(i,(i+1)%n);ctx.quadraticCurveTo(P[i][0],P[i][1],e[0],e[1]);}ctx.closePath();};
  ctx.save();path();ctx.clip();Object.keys(LOBE).forEach(l=>{ctx.fillStyle=col[l]||base;ctx.beginPath();LOBE[l].forEach((q,i)=>i?ctx.lineTo(X(q[0]),Y(q[1])):ctx.moveTo(X(q[0]),Y(q[1])));ctx.closePath();ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();});ctx.restore();
  path();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.stroke();}
function along(P,f){f=clamp(f,0,1);let L=0;const seg=[];for(let i=1;i<P.length;i++){const d=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);seg.push(d);L+=d;}let r=f*L;for(let i=0;i<seg.length;i++){if(r<=seg[i]||i===seg.length-1){const q=seg[i]?r/seg[i]:0;return [lerp(P[i][0],P[i+1][0],q),lerp(P[i][1],P[i+1][1],q)];}r-=seg[i];}return P[0];}
function track(ctx,P,c,on){ctx.strokeStyle=c;ctx.globalAlpha=on?.85:.3;ctx.lineWidth=on?3:2;ctx.lineJoin='round';ctx.beginPath();P.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.globalAlpha=1;}
function pulse(ctx,x,y,c,r){ctx.fillStyle=c;ctx.globalAlpha=.3;ctx.beginPath();ctx.arc(x,y,(r||7)*1.8,0,6.2832);ctx.fill();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(x,y,r||7,0,6.2832);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();}
const FIG={cx:455,top:36,h:380};
const A=(n,o)=>{const q=BioLab.body.at(n,o||FIG);return [q.x,q.y];},M_=(x,y,o)=>{const q=BioLab.body.map(x,y,o||FIG);return [q.x,q.y];};
function bodyPaths(tr){const R=tr.route==='reflex',H=tr.mover!=='foot';
  if(R)return H?{sens:[A('elbowL'),A('shoulderL'),M_(.02,.2)],mot:[M_(0,.2),M_(.1,.19),M_(.13,.27)],up:[M_(0,.2),A('neck'),A('head')],site:A('elbowL')}
    :{sens:[A('kneeL'),A('thighL'),A('hipL'),M_(.012,.38)],mot:[M_(-.008,.38),M_(.06,.46),M_(.075,.58)],up:[M_(0,.38),A('spineT'),A('neck'),A('head')],site:A('kneeL')};
  const eye=M_(.022,.052),ear=M_(.056,.058);let sens,site;
  if(tr.stim==='visual'){sens=[eye,A('head')];site=eye;}else if(tr.stim==='auditory'){sens=[ear,A('head')];site=ear;}
  else if(tr.tap==='hand'){sens=[A('palmR'),A('wristR'),A('elbowR'),A('shoulderR'),M_(0,.17),A('neck'),A('head')];site=A('palmR');}
  else if(tr.tap==='foot'){sens=[A('footR'),A('ankleR'),A('kneeR'),A('thighR'),A('hipR'),M_(0,.4),A('spineT'),A('neck'),A('head')];site=A('footR');}
  else{sens=[A('shoulderR'),M_(0,.17),A('neck'),A('head')];site=A('shoulderR');}
  const mot=H?[A('head'),A('neck'),M_(.01,.2),A('shoulderL'),A('elbowL'),A('wristL'),A('palmL')]:[A('head'),A('neck'),M_(.01,.24),M_(.01,.43),A('hipL'),A('thighL'),A('kneeL'),A('shinL'),A('ankleL'),A('footL')];
  return {sens,mot,site};}
function brainPaths(tr){const ent=tr.stim==='visual'?[[.06,.56],[.42,.5],[.86,.36]]:tr.stim==='auditory'?[[.42,.72],[.42,.6]]:[[.58,.98],[.56,.55],[.56,.2]];
  const lobe=tr.stim==='visual'?'occipital':tr.stim==='auditory'?'temporal':'parietal',from=ent[ent.length-1];
  return {ent,lobe,integ:[from,[.3,.42],[.16,.3],[.4,.16]],out:[[.4,.16],[.52,.56],[.58,.98]]};}

/* ---------- virtual lab bench ---------- */
const bn=sim=>sim.vlab.bench;
function bfix(sim){const b=bn(sim);if(!b.rd){b.rd={};['you','partner'].forEach(r=>{b.rd[r]={};INP.forEach(i=>b.rd[r][i]=[null,null,null]);});}return b;}
function benchRead(sim,role,inp,tn){const V=sim.vlab,ri=role==='you'?0:1,ii=INP.indexOf(inp),u3=g=>g()+g()+g()-1.5;
  const person=u3(V.rng(11+ri))*30,base=timing({stim:inp,mover:'hand',tap:'shoulder',route:'react',distract:'none',practice:0,nerve:60},0);
  const rt=clamp(base.total+person+u3(V.rng(100+ri*100+ii*10+tn))*28,95,MAXT-3);return Math.round(dOf(rt/1000)*10)/10;}
const curRead=sim=>{const b=bfix(sim),p=sim.p;return b.rd[p.lRole][p.lInput][p.lTrial];};
const roleDone=(sim,r,i)=>bfix(sim).rd[r][i].every(v=>v!==null);
const rowFilled=(sim,t,r)=>['a','b','c'].every(c=>Number.isFinite(sim.vlab.val(t,c,r)));
function drawBench(sim,ctx,k){const p=sim.p,s=sim.st,e=s.an?sim.t-s.an.t0:0,running=s.an&&e<s.an.rt,read=curRead(sim);
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);
  const O={cx:140,top:62,h:420},pa=BioLab.body.at('palmL',O);
  BioLab.body.draw(ctx,Object.assign({view:'front'},O));
  txt(ctx,p.lRole==='you'?'You catch':'Partner catches',20,30,{s:15*k,w:700});
  const blind=p.lInput!=='visual',ey=BioLab.body.map(0,.052,O);
  if(blind){ctx.fillStyle='#3b3f47';rr(ctx,ey.x-27,ey.y-9,54,18,5);ctx.fill();}
  const live=s.an&&e>=0&&e<(s.an.rt+60);
  if(live&&p.lInput==='auditory')pill(ctx,'“Release!”',ey.x+64,ey.y-16,PAL['s4'],'#111',13*k);
  if(live&&p.lInput==='tactile'){const q=BioLab.body.at('shoulderR',O);pulse(ctx,q.x,q.y,PAL['s4'],9);}
  // the ruler
  const PY=318,SC=9,RX=262,RW=46;let fall=0;
  if(running)fall=dOf(e/1000);else if(read!==null)fall=read;
  ctx.save();ctx.beginPath();ctx.rect(RX-20,0,RW+40,500);ctx.clip();
  const top=PY-RULER*SC+fall*SC;
  ctx.fillStyle=PAL['cv-ruler'];rr(ctx,RX,top,RW,RULER*SC,3);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.stroke();
  for(let c=0;c<=RULER;c++){const y=top+(RULER-c)*SC;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=c%5?.8:1.5;ctx.beginPath();ctx.moveTo(RX,y);ctx.lineTo(RX+(c%5?8:15),y);ctx.stroke();if(c%5===0&&c>0&&c<RULER)txt(ctx,String(c),RX+RW-3,y,{s:12*k,w:600,c:PAL['cv-ink'],a:'right',b:'middle'});}
  ctx.restore();
  if(!s.an||e<0||(!running&&read===null)){ctx.fillStyle='#c9956b';ctx.strokeStyle='#7a5535';ctx.lineWidth=1.3;[RX-8,RX+RW+8].forEach(x=>{ctx.beginPath();ctx.ellipse(x,PY-RULER*SC+10,11,7,0,0,6.2832);ctx.fill();ctx.stroke();});}
  txt(ctx,'Partner holds',RX+RW/2,20,{s:12*k,c:PAL['cv-soft'],a:'center'});
  // the catching hand
  const closed=(running&&e>s.an.rt-40)||(!running&&read!==null),gap=closed?0:12;
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(RX-14-gap,PY+3);ctx.stroke();ctx.lineCap='butt';
  ctx.fillStyle='#c9956b';ctx.strokeStyle='#7a5535';ctx.lineWidth=1.3;[[RX-9-gap,1],[RX+RW+9+gap,-1]].forEach(q=>{ctx.beginPath();ctx.ellipse(q[0],PY+2,11,7,0,0,6.2832);ctx.fill();ctx.stroke();});
  // the magnifier: 4 cm of ruler, read to 0.1 cm
  const LX=372,LW=210,LY=60,LH=380,SCL=LH/4;
  txt(ctx,'Magnifier',LX,30,{s:15*k,w:700});
  ctx.save();rr(ctx,LX,LY,LW,LH,10);ctx.clip();ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(LX,LY,LW,LH);
  if(!running&&read!==null){const cy=LY+LH/2;
    for(let mm=Math.floor((read-2.2)*10);mm<=Math.ceil((read+2.2)*10);mm++){if(mm<0||mm>300)continue;const c=mm/10,y=cy-(c-read)*SCL,cm=mm%10===0,half=mm%5===0;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=cm?2:half?1.5:1;ctx.beginPath();ctx.moveTo(LX,y);ctx.lineTo(LX+(cm?64:half?44:24),y);ctx.stroke();
      if(cm)txt(ctx,String(Math.round(c)),LX+72,y,{s:Math.max(18,13*k),w:700,c:PAL['cv-ink'],b:'middle'});}
    ctx.fillStyle='rgba(201,149,107,.55)';ctx.fillRect(LX,cy,LW,LH/2);ctx.strokeStyle='#a01424';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(LX,cy);ctx.lineTo(LX+LW,cy);ctx.stroke();}
  ctx.restore();rr(ctx,LX,LY,LW,LH,10);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.stroke();
  if(running||read===null)txt(ctx,running?'Falling…':'Ready',LX+LW/2,LY+LH/2,{s:16*k,w:700,c:PAL['cv-ink'],a:'center',b:'middle'});
  // what is on the bench now
  const SX=598;txt(ctx,INL[p.lInput],SX,LY+18,{s:15*k,w:700});txt(ctx,'Trial '+(p.lTrial+1),SX,LY+18+24*k,{s:14*k});
  const eyes=p.lInput==='visual'?'Eyes open':'Eyes covered';txt(ctx,eyes,SX,LY+18+48*k,{s:13*k,c:PAL['cv-soft']});
  if(!running&&read!==null){const y=LY+LH/2;txt(ctx,'Read here:',SX,y-8,{s:13*k,c:PAL['cv-soft']});txt(ctx,'top of thumb',SX,y-8+18*k,{s:13*k,c:PAL['cv-soft']});}
  if(running)txt(ctx,'Slow motion',SX,LY+LH-6,{s:13*k,c:PAL['cv-soft']});}

/* ---------- graphs ---------- */
function plotBudget(sim,ctx,box){const p=sim.p,rows=INP.map(i=>({l:INL[i],T:timing(Object.assign({},p,{stim:i,route:'react'}),sim.st.person)})),L=78;
  rows.push({l:'Reflex',T:timing(Object.assign({},p,{route:'reflex'}),0)});
  const xmax=Math.max(300,...rows.map(r=>r.T.total))*1.03,W=box.cw-L-20,T=30,H=box.ch-T-42,X=v=>L+v/xmax*W,rh=H/rows.length;
  legend(ctx,L,14,[{label:'Sensory',color:PAL['s2']},{label:'Integration',color:PAL['s5']},{label:'Motor nerve',color:PAL['s1']},{label:'Muscle',color:PAL['s4']}].slice(0,box.cw<420?4:4));
  ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;for(let v=0;v<=xmax;v+=100){ctx.beginPath();ctx.moveTo(X(v),T);ctx.lineTo(X(v),T+H);ctx.stroke();txt(ctx,String(v),X(v),T+H+15,{s:13,c:PAL['g-axis'],a:'center'});}
  txt(ctx,'Time since the cue (ms)',L+W/2,T+H+33,{s:13,c:PAL['g-axis'],a:'center'});
  rows.forEach((r,i)=>{const y=T+i*rh+rh*.18,h=rh*.64;let a=0;txt(ctx,r.l,L-8,y+h/2,{s:13,w:600,a:'right',b:'middle',c:PAL['fg']});
    [['S','s2'],['I','s5'],['M','s1'],['E','s4']].forEach(q=>{const v=r.T[q[0]];ctx.fillStyle=PAL[q[1]];ctx.fillRect(X(a),y,Math.max(1,X(a+v)-X(a)),h);a+=v;});
    txt(ctx,Math.round(r.T.total)+' ms',Math.min(X(a)+6,box.cw-54),y+h/2,{s:13,w:600,b:'middle',c:PAL['fg']});});}
function plotRuler(sim,ctx,box){const ax=axes(ctx,box,{xmin:0,xmax:RULER,ymin:0,ymax:.3,xl:'Distance the ruler falls (cm)',yl:'Reaction time (s)'});ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();for(let d=0;d<=RULER;d+=.5){const X=ax.X(d),Y=ax.Y(tOf(d));d?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}ctx.stroke();
  const s=sim.st,T=timing(sim.p,s.person);if(!T.reflex){const t=T.total/1000,d=dOf(t);if(d<=RULER){ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(d),ax.Y(t),6,0,6.29);ctx.fill();txt(ctx,'Average: '+d.toFixed(1)+' cm, '+t.toFixed(3)+' s',Math.min(ax.X(d)+10,box.L+box.W-200),ax.Y(t)+18,{s:13,w:600,c:PAL['fg']});}}}

/* ---------- virtual lab ---------- */
const tCol=(role)=>{const trial=t=>(sim,rv,n)=>{const v=bfix(sim).rd[role][String(rv).toLowerCase()][t];if(v===null)return 'Run this trial on the bench first, then record what you read.';if(n<0||n>RULER)return 'The ruler only runs from 0 to 30 cm.';if(Math.abs(n-v)>0.3)return 'Look through the magnifier again. Read the ruler at the top edge of the thumb, in centimeters.';return null;};
  const avg=(t)=>(sim,rv,n)=>{const V=sim.vlab,r=INP.indexOf(String(rv).toLowerCase()),a=['a','b','c'].map(c=>V.val(t,c,r));if(!a.every(Number.isFinite))return 'Fill in all three trials first.';const m=(a[0]+a[1]+a[2])/3;return Math.abs(n-m)>0.11?'Check your average: add the three trials, then divide by 3.':null;};
  return {trial,avg};};
const ty=tCol('you'),tp=tCol('partner');
const table=(id,title,tc)=>({id,title,cols:[{id:'inp',label:'Input',rows:['Visual','Auditory','Tactile']},{id:'a',label:'Trial 1 (cm)',input:'number',check:tc.trial(0)},{id:'b',label:'Trial 2 (cm)',input:'number',check:tc.trial(1)},{id:'c',label:'Trial 3 (cm)',input:'number',check:tc.trial(2)},{id:'avg',label:'Average (cm)',input:'number',check:tc.avg(id)}]});
const inputStep=(i,how)=>({title:INL[INP[i]]+' test',text:how,controls:['lTrial','l-drop','l-next'],setup(sim){const n=bfix(sim).rd.you[INP[i]].findIndex(v=>v===null);BioLab.setValues(sim,{lRole:'you',lInput:INP[i],lTrial:n<0?0:n});sim.st.an=null;},
  done:sim=>roleDone(sim,'you',INP[i])&&rowFilled(sim,'t1',i),doneHint:sim=>roleDone(sim,'you',INP[i])?'Type all three '+INL[INP[i]].toLowerCase()+' readings in Table 1.':'Press <b>Release the ruler</b>, read the magnifier, type the number in Table 1, then press <b>Next trial</b>.'});
const LAB_RT={id:'reaction-time',title:'Reaction Time Lab',course:'Anatomy & Physiology',teachers:'McKeon',
  source:{label:'Reaction Lab.pdf',href:'https://rjhs.instructure.com/courses/15537/assignments/551621'},
  purpose:'<p>Measure how quickly you respond to something you see, something you hear and something you feel, using only a falling ruler. Then explain the differences with the path a signal takes through your nervous system: sensory input, integration and motor output.</p>',
  background:'<p>A signal has to reach your central nervous system, get processed there and travel back out to a muscle before your fingers can close. The farther the ruler falls before your fingers close, the slower your reaction. Because a falling ruler speeds up at a known rate, the distance is a real clock.</p><p><b>About the virtual bench.</b> You and your partner are simulated. Each of you has your own typical speed, and every trial varies a little, like real people. The ruler falls in slow motion so you can watch it. Read the magnifier to the nearest 0.1 cm.</p>',
  materials:['30 cm ruler','A lab partner'],
  hypothesis:{prompt:'<p>Predict the order: which input (visual, auditory, tactile) will give the quickest catch, and which the slowest? Give a reason.</p>'},
  setup(sim){bfix(sim);BioLab.refresh(sim);},controls:[],
  steps:[
    {title:'Set up',text:'<p>Your partner holds the ruler by the top, at the 30 cm end, so it hangs straight down. Hold your thumb and finger open on either side of the 0 cm mark. Don’t touch the ruler.</p><p>You will run three kinds of test with three trials each, and record the centimeter mark where you catch the ruler.</p>'},
    inputStep(0,'<p><b>Watch the ruler.</b> Catch it as soon as you see your partner let go. Your partner gives no warning.</p><p>Run all three trials. After each catch, read the magnifier at the top edge of your thumb and type the reading in Table 1.</p>'),
    inputStep(1,'<p><b>Cover your eyes.</b> Your partner says “release” at the moment of letting go. Catch it when you hear the word.</p><p>Run all three trials and record each one in Table 1.</p>'),
    inputStep(2,'<p><b>Cover your eyes.</b> Your partner taps your shoulder at the same moment as letting go. Catch it when you feel the tap.</p><p>Run all three trials and record each one in Table 1.</p>'),
    {title:'Average',text:'<p>Work out the average catch distance for each input and type it in the last column of Table 1. Your graph draws below as you go.</p>'},
    {title:'Switch roles',text:'<p>Switch places. Now you hold the ruler and your partner catches. Choose each input and run three trials, then fill in Table 2.</p>',controls:['lInput','lTrial','l-drop','l-next'],setup(sim){BioLab.setValues(sim,{lRole:'partner',lInput:'visual',lTrial:0});sim.st.an=null;}},
    {title:'Graph and questions',text:'<p>Check the graph of your averages below. Then answer the questions. The time conversion is an extension: use it if you are working at Deep dive or your teacher asks for it.</p>',controls:['lRole','lInput','lTrial'],setup(sim){sim.st.an=null;}}],
  tables:[table('t1','Table 1: Your catches, distance the ruler fell',ty),table('t2','Table 2: Your partner’s catches, distance the ruler fell',tp)],
  graph:{type:'bar',title:'Average catch distance by input',xl:'Input',yl:'Average distance (cm)',ymin:0,ymax:30,series:[{table:'t1',x:'inp',y:'avg',label:'You'},{table:'t2',x:'inp',y:'avg',label:'Partner'}]},
  calcs:INP.map((inp,i)=>({id:'t'+i,label:'Extension: your '+inp+' average as a time, t = √(2d ÷ 980), d in cm',unit:'s',check(sim,n,V){const d=V.val('t1','avg',i);if(!Number.isFinite(d))return 'Fill in your average in Table 1 first.';return Math.abs(n-tOf(d))>0.006?'Check it: double the distance in cm, divide by 980, then take the square root.':null;}})),
  questions:[
    {id:'q1',n:'1',q:'<p>Which input gave you the quickest reaction? Use your averages.</p>'},
    {id:'q2',n:'2',q:'<p>Why do you think that input was the quickest? Think about what happens at the receptor and along the path to the brain.</p>'},
    {id:'q3',n:'3',q:'<p>Which input gave you the slowest reaction?</p>'},
    {id:'q4',n:'4',q:'<p>Why do you think that input was the slowest?</p>'},
    {id:'q5',n:'5',q:'<p>In the visual test, what was each part of the path?</p>',fields:[{id:'s',label:'Sensory input'},{id:'i',label:'Integration'},{id:'m',label:'Motor output'}]}]};

/* ---------- the simulation ---------- */
const SIM={id:'reaction',hash:'reaction',apUnit:9,order:9,kind:'Simulation',tab:'Reaction time',next:['nsmap','neuron'],
  card:'Follow one signal from eye to brain to fingers in slow motion, convert a ruler drop to seconds, and race it against a reflex.',
  title:'Reaction time and the nervous system path',
  lede:{bio:'Watch a signal travel from your senses to your brain and out to your fingers, while a ruler falls. Compare what you see, hear and feel with a reflex that skips the brain.',
    honors:'Split a reaction into sensory input, integration and motor output, then find which part practice and distraction actually change.',
    ap:'Budget every millisecond of a reaction: receptor, conduction, synapses, cortex and muscle. Then test how much of the total is really nerve travel.'},
  scale:'One whole person. Time runs 10 times slower than real life, so a 0.19 s reaction takes about 2 s to watch.',
  aspect:1.6,timeScale:100,dtMax:1,sampleDt:10,window:1500,unit:'ms',unitD:0,timeLabel:'Time',chChange:30,chReveal:500,thumbFrames:24,
  labs:[LAB_RT],
  controls:[
    {id:'route',label:'Path',type:'seg',def:'react',lvl:'bio',options:[{v:'react',l:'Through the brain'},{v:'reflex',l:'Spinal reflex'}]},
    {id:'stim',label:'Stimulus type',type:'seg',def:'visual',lvl:'bio',help:'Used on the path through the brain.',options:[{v:'visual',l:'Visual'},{v:'auditory',l:'Auditory'},{v:'tactile',l:'Tactile'}]},
    {id:'mover',label:'Body part that responds',type:'seg',def:'hand',lvl:'bio',help:'The foot is farther from the brain.',options:[{v:'hand',l:'Hand'},{v:'foot',l:'Foot'}]},
    {id:'distract',label:'Distraction',type:'seg',def:'none',lvl:'bio',options:[{v:'none',l:'None'},{v:'talk',l:'Talking'},{v:'text',l:'Reading a text'}]},
    {id:'practice',label:'Practice trials before this one',type:'range',min:0,max:30,step:1,def:0,lvl:'bio'},
    {id:'tap',label:'Where the tap lands (tactile)',type:'seg',def:'shoulder',lvl:'honors',help:'A longer sensory path to the brain.',options:[{v:'shoulder',l:'Shoulder'},{v:'hand',l:'Hand'},{v:'foot',l:'Foot'}]},
    {id:'nerve',label:'Nerve conduction speed',type:'range',min:10,max:70,step:5,def:60,unit:' m/s',lvl:'ap',help:'Large myelinated fibers run about 60 m/s.'},
    {id:'repeat',label:'Keep running trials',type:'toggle',def:true,lvl:'bio',noTrial:true},
    {id:'lRole',label:'Who catches',type:'seg',def:'you',vlab:true,noTrial:true,options:[{v:'you',l:'You'},{v:'partner',l:'Partner'}]},
    {id:'lInput',label:'Input',type:'seg',def:'visual',vlab:true,noTrial:true,options:INP.map(i=>({v:i,l:INL[i]}))},
    {id:'lTrial',label:'Trial',type:'seg',def:0,vlab:true,noTrial:true,options:[{v:0,l:'1'},{v:1,l:'2'},{v:2,l:'3'}]}
  ],
  actions:[
    {id:'go',label:'Run one trial',primary:true,run(sim){if(!sim.vlab)startTrial(sim);}},
    {id:'person',label:'New person',run(sim){if(sim.vlab)return;sim.st.person=clamp(randn()*18,-35,40);startTrial(sim);}},
    {id:'l-drop',label:'Release the ruler',primary:true,vlab:true,enabled:sim=>!!sim.vlab&&curRead(sim)===null&&!(sim.st.an&&sim.t-sim.st.an.t0<sim.st.an.rt),
      run(sim){if(!sim.vlab)return;const b=bfix(sim),p=sim.p;if(b.rd[p.lRole][p.lInput][p.lTrial]!==null)return;const d=benchRead(sim,p.lRole,p.lInput,p.lTrial);b.rd[p.lRole][p.lInput][p.lTrial]=d;sim.st.an={t0:sim.t,rt:tOf(d)*1000};}},
    {id:'l-next',label:'Next trial',vlab:true,enabled:sim=>!!sim.vlab&&curRead(sim)!==null,run(sim){if(!sim.vlab)return;const r=bfix(sim).rd[sim.p.lRole][sim.p.lInput],n=r.findIndex(v=>v===null);BioLab.setValues(sim,{lTrial:n<0?(sim.p.lTrial+1)%3:n});sim.st.an=null;}}
  ],
  init(){return {person:0,tr:null,next:20,last:0,lastD:0,n:0,an:null};},
  step(sim){const s=sim.st,p=sim.p;if(sim.vlab)return;
    if(!s.tr&&sim.t>=s.next){startTrial(sim);return;}
    const tr=s.tr;if(!tr)return;const e=sim.t-tr.t0;
    if(!tr.done&&e>=tr.rt){tr.done=true;s.last=tr.rt;s.lastD=Math.min(RULER,dOf(tr.rt/1000));s.n++;s.next=sim.t+350;}
    if(tr.done&&p.repeat&&sim.t>=s.next)startTrial(sim);},
  metrics:[
    {id:'avg',label:'Average reaction time',unit:'s',lvl:'bio',min:0,max:.45,d:3,get:s=>timing(s.p,s.st.person).total/1000},
    {id:'last',label:'This trial',unit:'s',lvl:'bio',min:0,max:.45,d:3,get:s=>s.st.last/1000},
    {id:'cm',label:'Ruler fell (this trial)',unit:'cm',lvl:'bio',min:0,max:30,d:1,get:s=>s.st.lastD},
    {id:'sens',label:'Sensory input',unit:'ms',lvl:'honors',min:0,max:100,d:0,get:s=>timing(s.p,s.st.person).S},
    {id:'integ',label:'Integration',unit:'ms',lvl:'honors',min:0,max:220,d:0,get:s=>timing(s.p,s.st.person).I},
    {id:'motor',label:'Motor output (nerve and muscle)',unit:'ms',lvl:'honors',min:0,max:140,d:0,get:s=>{const T=timing(s.p,s.st.person);return T.M+T.E;}},
    {id:'cond',label:'Time spent traveling along nerve fibers',unit:'ms',lvl:'ap',min:0,max:200,d:0,get:s=>timing(s.p,s.st.person).cond},
    {id:'share',label:'Nerve travel as a share of the total',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>{const T=timing(s.p,s.st.person);return 100*T.cond/T.total;}}
  ],
  graphs:[{id:'budget',label:'Where the time goes',custom:true},{id:'ruler',label:'Ruler distance to time',custom:true}],defaultGraph:'budget',
  plot(sim,ctx,box,id){if(id==='ruler')plotRuler(sim,ctx,box);else plotBudget(sim,ctx,box);},
  challenges:[
    {lvl:'bio',q:'You catch a ruler by sight, then with your eyes covered you catch it when your partner says “release”. How does the catch change?',
     choices:['Sound is quicker: the ruler falls less','Sight is quicker: the ruler falls less','They come out exactly the same'],correct:0,
     baseline:{stim:'visual'},change:{stim:'auditory'},changeText:'The cue changed from sight to sound',watch:'budget',reveal:500,
     explain:{bio:'The ear turns sound into a nerve signal almost at once because sound physically opens channels in hair cells. The eye has to run a chemical cascade in the retina first. About 40 ms saved means about 7 cm less ruler.'}},
    {lvl:'bio',q:'Compare a sight-cued catch with a spinal reflex. About how much quicker is the reflex?',
     choices:['About the same','About twice as quick','About five times as quick'],correct:2,
     baseline:{stim:'visual',route:'react'},change:{route:'reflex'},changeText:'The path changed to a spinal reflex',watch:'budget',reveal:400,
     explain:{bio:'A reflex turns around in the spinal cord, so it never waits for the brain to process and decide. It takes about 0.03 to 0.05 s against about 0.19 s for a catch by sight.',ap:'Most of the difference is not distance. The reflex skips the 18 ms of relays on the way to the cortex, the 75 ms of cortical processing and most of the slow muscle-and-finger closing time.'}},
    {lvl:'bio',instant:true,q:'Ana catches the ruler at 22 cm. Ben catches it at 9 cm. Who reacted faster?',
     choices:['Ana, because her number is bigger','Ben, because the ruler fell less before he caught it','You can’t tell from the distance'],correct:1,
     explain:{bio:'The ruler keeps falling until the fingers close, so a smaller distance means less time passed. Ben’s 9 cm is about 0.14 s and Ana’s 22 cm is about 0.21 s.'}},
    {lvl:'honors',q:'You start reading a text during the test. Which part of the path takes longer in this model?',
     choices:['Sensory input','Integration','Motor output'],correct:1,
     baseline:{distract:'none'},change:{distract:'text'},changeText:'A text arrived',watch:'budget',reveal:500,
     explain:{honors:'Your eyes and nerves work at the same speed. The brain is sharing its processing with a second task, so the decision waits. In this model that adds about 0.12 s, and trials get more variable too.'}},
    {lvl:'honors',q:'You practice for 20 trials. What happens to your reaction time?',
     choices:['It falls a little, then levels off','It falls by half or more','It stays exactly the same'],correct:0,
     baseline:{practice:0},change:{practice:20},changeText:'20 practice trials',watch:'budget',reveal:400,
     explain:{honors:'Practice sharpens integration, so reaction time falls about 0.015 to 0.02 s here. It can’t speed up the receptor, the nerve fibers or the muscle, so improvement levels off.'}},
    {lvl:'ap',q:'A condition cuts nerve conduction speed in half, from 60 to 30 m/s. Visual cue, hand response. How much does the reaction time grow?',
     choices:['It doubles','It grows by about 10%','It doesn’t change'],correct:1,
     baseline:{nerve:60},change:{nerve:30},changeText:'Conduction speed cut to 30 m/s',watch:'budget',reveal:400,
     explain:{ap:'Only about 19 ms of the 190 ms is signal travel along fibers. Doubling it adds about 19 ms. Most of a voluntary reaction goes to receptors, synapses, cortex and muscle contraction.'}},
    {lvl:'ap',instant:true,q:'One catch is at 5 cm and another at 20 cm. How do the two reaction times compare?',
     choices:['The 20 cm catch took 4 times as long','The 20 cm catch took 2 times as long','The 20 cm catch took 16 times as long'],correct:1,
     explain:{ap:'t = √(2d ÷ g), so time grows with the square root of distance. Four times the distance is twice the time: 0.101 s against 0.202 s. So the ruler spreads slower times out: the first 0.1 s covers only 5 cm, and the next 0.1 s covers 15 cm.'}}
  ],
  narrate(sim){const s=sim.st,tr=s.tr,hon=atLeast('honors');
    if(sim.vlab){const r=curRead(sim);return s.an&&sim.t-s.an.t0<s.an.rt?'The ruler is falling. The cue has started its trip through the nervous system.':(r!==null?'Caught. Read the magnifier at the top edge of the thumb and record the number.':'Press <b>Release the ruler</b> when you are ready.');}
    if(!tr)return 'A trial is about to start.';const e=sim.t-tr.t0,ph=phase(tr,e),R=tr.route==='reflex';
    if(R){const nm=tr.mover==='hand'?'biceps':'quadriceps';
      if(ph.i===0)return '<b>Sensory input.</b> The tap stretches the '+nm+' and its stretch receptors fire. The signal runs along a sensory neuron to the spinal cord.';
      if(ph.i===1)return '<b>Spinal cord.</b> The signal crosses a synapse right there in the cord. No brain is involved in the decision.';
      if(ph.i===2)return '<b>Motor output.</b> A motor neuron carries the signal straight back to the '+nm+'.';
      if(ph.i===3)return 'The muscle starts to pull. A copy of the signal is still on its way to your brain.';
      return '<b>Reflex done in '+(tr.rt/1000).toFixed(3)+' s.</b> Your brain finds out after your limb has already started to move.';}
    const cue={visual:'light hits the retina, and a chemical cascade in the photoreceptors takes tens of milliseconds to make a signal',auditory:'sound bends hair cells in the cochlea, which open channels almost at once',tactile:'pressure opens channels in touch receptors in the skin'}[tr.stim];
    if(ph.i===0)return '<b>Sensory input.</b> The ruler is falling. '+cue[0].toUpperCase()+cue.slice(1)+'. Sensory neurons carry the signal to the brain.';
    if(ph.i===1)return '<b>Integration.</b> The brain recognizes the cue and decides to act. This is usually the longest step'+(sim.p.distract!=='none'?', and the distraction is stretching it':'')+'.';
    if(ph.i===2)return '<b>Motor output.</b> Motor neurons carry the command down the spinal cord and out to the '+(tr.mover==='hand'?'hand':'foot')+'. The ruler is still falling.';
    if(ph.i===3)return 'The signal has arrived. The muscle takes about '+Math.round(tr.E)+' ms to contract and close the '+(tr.mover==='hand'?'fingers':'foot on the pedal')+'.';
    if(tr.mover==='foot')return '<b>Pedal pressed at '+(tr.rt/1000).toFixed(3)+' s.</b> '+(hon?'The longer motor path and heavier limb cost about 0.025 s compared with a hand.':'A foot is slower than a hand: it is farther away and heavier.');
    if(tr.miss)return '<b>Missed.</b> The ruler fell the whole 30 cm in 0.247 s, and this reaction took '+(tr.rt/1000).toFixed(3)+' s.';
    return '<b>Caught at '+s.lastD.toFixed(1)+' cm.</b> t = √(2d ÷ g) = '+(tr.rt/1000).toFixed(3)+' s.';},
  tour:[
    {title:'Three jobs, in order',text:'Every reaction has three parts: sensory input, integration and motor output. The boxes at the bottom show how long each one takes. Time here runs 10 times slower than real life.',focus:[6,424,788,72],speed:.6,setup(sim){BioLab.setValues(sim,{stim:'visual',route:'react'});BioLab.reset(sim);}},
    {title:'Sensory input',text:'The ruler drops. Light reaches the retina, and the photoreceptors run a chemical cascade before any signal leaves the eye. Most of the sensory time for vision is spent right there.',focus:[340,30,240,120],speed:.2,setup(sim){startTrial(sim);}},
    {title:'Integration',text:'The signal reaches the occipital lobe and moves forward to the frontal lobe, where the brain decides to act and the motor cortex prepares the command. This is the longest step.',focus:[8,50,332,370],speed:.25,setup(sim){startTrial(sim);}},
    {title:'Motor output',text:'The command runs down the spinal cord and out along motor neurons to the hand. Then the muscle needs about 40 ms to contract and close the fingers.',focus:[340,30,240,390],speed:.25,setup(sim){startTrial(sim);}},
    {title:'The ruler is a clock',text:'The ruler falls under gravity the whole time, so the distance it fell tells you the time. A 17.7 cm fall takes 0.19 s, whatever the ruler is made of.',focus:[586,30,210,390],speed:.6,setup(sim){startTrial(sim);}},
    {title:'Sight against sound',text:'Change only the cue. Sound opens channels in the ear almost immediately, so the sensory step shrinks and the catch is about 7 cm shorter. Touch comes out about the same as sound.',focus:[6,424,788,72],speed:.6,setup(sim){BioLab.setValues(sim,{stim:'auditory'});startTrial(sim);}},
    {title:'The reflex shortcut',text:'A tap on the knee sends a signal to the spinal cord, and a motor neuron answers from right there. No brain, about 0.04 s. Your brain only finds out afterward.',focus:[340,30,456,390],speed:.3,setup(sim){BioLab.setValues(sim,{route:'reflex',mover:'foot'});startTrial(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{route:'react',stim:'visual',mover:'hand'});},
  lab:{bio:'<p><b>Question:</b> Which cue gets the quickest response?</p><ol><li>Turn off <b>Keep running trials</b>. Choose Visual and press <b>Run one trial</b> five times, recording a trial each time.</li><li>Repeat with Auditory and Tactile.</li><li>Find the average for each cue.</li></ol><p>Which was quickest and which was slowest? Explain using sensory input, integration and motor output.</p>',
    honors:'<p><b>Question:</b> What can you change about your reaction time, and what can’t you change?</p><ol><li>Record <b>Sensory input</b>, <b>Integration</b> and <b>Motor output</b> at practice 0, 10 and 30.</li><li>Return to practice 0. Record them with no distraction, talking and reading a text.</li><li>Change <b>Where the tap lands</b> on the tactile cue and record again.</li></ol><p>Which step changes with each variable? Explain why practice levels off.</p>',
    ap:'<p><b>Question:</b> How much of a reaction is nerve travel?</p><ol><li>Record <b>Nerve travel as a share of the total</b> for hand and foot at 60 m/s.</li><li>Step conduction speed from 70 to 10 m/s and record the average reaction time at each value.</li><li>Plot speed (x) against average reaction time (y).</li></ol><p><b>Claim, evidence, reasoning:</b> Is a voluntary reaction limited mainly by the speed of the wiring? Compare with a reflex at the same speeds.</p>'},
  terms:[{t:'Sensory input',d:'A receptor detects a stimulus and sensory neurons carry the signal to the central nervous system.'},{t:'Integration',d:'The central nervous system processes the signal and decides on a response.'},{t:'Motor output',d:'Motor neurons carry a command from the central nervous system to a muscle or gland.'},{t:'Reaction time',d:'The time from a stimulus to the start of a response you chose to make.'},{t:'Reflex',d:'A fast automatic response that turns around in the spinal cord or brain stem without waiting for a decision.'},{t:'Reflex arc',d:'The path of a reflex: receptor, sensory neuron, spinal cord, motor neuron, muscle.'},
    {lvl:'honors',t:'Interneuron',d:'A neuron inside the central nervous system that connects other neurons. A knee jerk has none; a withdrawal reflex does.'},{lvl:'honors',t:'Conduction speed',d:'How fast a signal travels along an axon. Large myelinated fibers reach about 60 m/s.'},
    {lvl:'ap',t:'Synaptic delay',d:'The time a signal needs to cross a synapse, about 1 ms each.'},{lvl:'ap',t:'Electromechanical delay',d:'The gap between a muscle receiving its signal and producing visible movement, tens of milliseconds.'}],
  about:'<p><b>The ruler.</b> Free fall from rest: d = ½gt², g = 980 cm/s². A 30 cm ruler falls in 0.247 s.</p><p><b>The time budget (ms), for a hand response with no practice or distraction.</b> Visual: retina 35, optic path 2, relays 18. Auditory: hair cells 1, nerve 2, relays 12. Tactile: receptor 2, nerve distance ÷ speed (shoulder 0.45 m), relays 8. Integration 75 for all. Motor: 1.0 m ÷ 60 m/s plus 3 for synapses (foot 1.55 m). Muscle and fingers 40 (foot 55). Totals: visual 190, auditory 150, tactile 152, inside the usual classroom ranges (visual about 0.18 to 0.20 s, auditory about 0.14 to 0.16 s, tactile about 0.15 s). Sensory latencies are set from typical cortical response times.</p><p><b>What is simplified.</b> The split of time among steps is an estimate; only the totals and the early cortical latencies are well measured. Sound and touch are effectively tied, and either can win for a given person. Practice (up to about a quarter off integration) and distraction (+60 ms talking, +120 ms reading a text) are round numbers chosen to match the size of published effects; real effects vary by task. Trial noise and person-to-person differences are random numbers, about 18 ms each. A real ruler test has extra error: a spoken “release” may not line up with the release, and catchers can guess.</p><p><b>The reflex.</b> The model is a tendon-tap stretch reflex (biceps or knee jerk), which has one synapse and no interneuron: about 0.03 to 0.04 s to the start of muscle pull. A withdrawal reflex from pain adds interneurons and uses slower pain fibers, so it takes longer in real life. Time is counted to the start of muscle pull for reflexes, and to finger closing for catches.</p>',
  draw(sim,ctx,vdt,k,t){if(sim.vlab){drawBench(sim,ctx,k);return;}
    const s=sim.st,tr=s.tr||{stim:sim.p.stim,route:sim.p.route,mover:sim.p.mover,tap:sim.p.tap,S:1,I:1,M:1,E:1,rt:4,done:false,t0:sim.t+1e6,miss:false};
    const e=sim.t-tr.t0,ph=s.tr?phase(tr,e):{i:-1,f:0},R=tr.route==='reflex',H=tr.mover!=='foot',bp=bodyPaths(tr);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);
    /* the body */
    BioLab.body.draw(ctx,Object.assign({view:'front'},FIG));
    const sp=[A('neck'),M_(0,.43)];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=5;ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(sp[0][0],sp[0][1]);ctx.lineTo(sp[1][0],sp[1][1]);ctx.stroke();ctx.globalAlpha=1;
    track(ctx,bp.sens,PAL['s2'],ph.i===0);track(ctx,bp.mot,PAL['s1'],ph.i>=2&&ph.i<4);
    /* the signal on the body */
    if(ph.i===0){const f=R?ph.f:clamp(ph.f/.75,0,1),q=along(bp.sens,tr.stim==='visual'&&!R?clamp((ph.f-.65)/.2,0,1):f);pulse(ctx,q[0],q[1],PAL['s2']);}
    if(ph.i===1&&R){const q=bp.sens[bp.sens.length-1];pulse(ctx,q[0],q[1],PAL['s5']);}
    if(ph.i===2){const f=R?ph.f:clamp((ph.f-.05)/.95,0,1),q=along(bp.mot,f);pulse(ctx,q[0],q[1],PAL['s1']);}
    if(R&&bp.up&&ph.i>=1&&e<tr.rt+50){const q=along(bp.up,clamp((e-tr.S)/25,0,1));ctx.fillStyle=PAL['s5'];ctx.globalAlpha=.75;ctx.beginPath();ctx.arc(q[0],q[1],5,0,6.2832);ctx.fill();ctx.globalAlpha=1;}
    if(s.tr&&e<45||ph.i===0)pulse(ctx,bp.site[0],bp.site[1],PAL['s4'],6);
    if(!R&&ph.i===3||(!R&&ph.i===4&&e<tr.rt+80)){const q=bp.mot[bp.mot.length-1];pulse(ctx,q[0],q[1],PAL['s1'],8);}
    /* the brain */
    const BX=16,BY=112,BW=318,BH=262,bpth=R?null:brainPaths(tr);
    const col={};if(R){}else{if(ph.i===0&&ph.f>.5)col[bpth.lobe]='#3f6fb0';if(ph.i===1){col[bpth.lobe]=ph.f<.25?'#3f6fb0':undefined;if(ph.f>=.25)col.frontal='#7b58b5';}if(ph.i===2&&ph.f<.4)col.frontal='#a8324a';}
    if(R&&ph.i>=2)col.parietal=e>tr.S+25?'#7b58b5':undefined;
    ctx.globalAlpha=R?.55:1;brain(ctx,BX,BY,BW,BH,col);ctx.globalAlpha=1;
    const PT=q=>[BX+q[0]*BW,BY+q[1]*BH];
    if(!R){if(ph.i===0&&ph.f>.5){const q=along(bpth.ent.map(PT),(ph.f-.5)/.5);pulse(ctx,q[0],q[1],PAL['s2'],8);}if(ph.i===1){const q=along(bpth.integ.map(PT),ph.f);pulse(ctx,q[0],q[1],PAL['s5'],8);}if(ph.i===2&&ph.f<.35){const q=along(bpth.out.map(PT),ph.f/.35);pulse(ctx,q[0],q[1],PAL['s1'],8);}}
    /* what is happening, above the brain */
    let head;if(ph.i<0)head='Ready';else if(R)head=ph.i<=2&&ph.i>=0?(ph.i===1?'Turning around in the cord':'The brain is not involved'):'The brain finds out later';
    else head=ph.i===0?CUE[tr.stim]:ph.i===1?(ph.f<.25?{visual:'Occipital lobe: what was it?',auditory:'Temporal lobe: what was it?',tactile:'Parietal lobe: what was it?'}[tr.stim]:'Frontal lobe: decide, then act'):ph.i===2?'Command leaves the brain':ph.i===3?'Muscle contracting':'Done';
    txt(ctx,head,14,34,{s:15*k,w:700});
    txt(ctx,Math.max(0,Math.min(e,tr.rt)).toFixed(0)+' ms since the cue',14,34+22*k,{s:14*k,c:PAL['cv-soft']});
    if(R){txt(ctx,'Spinal reflex',BX+BW/2,BY+BH*.34,{s:15*k,w:700,a:'center',c:PAL['cv-ink']});}
    /* the leader from head to brain */
    ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([4,4]);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(FIG.cx-.05*FIG.h,FIG.top+.05*FIG.h);ctx.lineTo(BX+BW*.72,BY+6);ctx.stroke();ctx.setLineDash([]);
    /* right panel */
    if(R)drawReflex(ctx,tr,e,k,H);else if(H)drawRuler(ctx,s,tr,e,k,bp);else drawPedal(ctx,tr,e,k,bp);
    /* the chain */
    const CY=426,CH=68,CW=(800-16-16)/3;
    SEG.forEach((g,i)=>{const x=8+i*(CW+8),v=i===2?tr.M+tr.E:tr[g.k],on=ph.i===i||(i===2&&ph.i===3);
      const pct=ph.i<0?0:(ph.i>i||ph.i>=4)?1:(i===2?(ph.i===3?(tr.M+ph.f*tr.E)/(tr.M+tr.E):ph.i===2?ph.f*tr.M/(tr.M+tr.E):0):(ph.i===i?ph.f:0));
      ctx.fillStyle=PAL['card2'];rr(ctx,x,CY,CW,CH,8);ctx.fill();ctx.save();rr(ctx,x,CY,CW,CH,8);ctx.clip();ctx.fillStyle=PAL[g.c];ctx.globalAlpha=.35;ctx.fillRect(x,CY,CW*pct,CH);ctx.restore();ctx.globalAlpha=1;
      rr(ctx,x,CY,CW,CH,8);ctx.strokeStyle=on?PAL[g.c]:PAL['line'];ctx.lineWidth=on?3:1.2;ctx.stroke();
      const nm=R&&i===1?'Spinal cord':g.n;txt(ctx,nm,x+CW/2,CY+CH/2-9*k,{s:13*k,w:700,a:'center',b:'middle'});txt(ctx,(s.tr?Math.round(v):0)+' ms',x+CW/2,CY+CH/2+9*k,{s:13*k,a:'center',b:'middle',c:PAL['cv-ink']});});}
};
function drawRuler(ctx,s,tr,e,k,bp){const PX=590,PY=392,SC=11,RX=672,RW=46,fall=e<0?0:Math.min(dOf(Math.min(e,tr.rt)/1000),tr.miss?60:RULER),caught=e>=tr.rt&&!tr.miss;
  const palm=bp.mot[bp.mot.length-1];ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([4,4]);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(palm[0],palm[1]);ctx.lineTo(RX-16,PY);ctx.stroke();ctx.setLineDash([]);
  const label=e<0?'Ruler ready':caught?'Caught at '+Math.min(RULER,dOf(tr.rt/1000)).toFixed(1)+' cm':tr.miss&&e>=tr.rt?'Missed it':'Falling: '+fall.toFixed(1)+' cm';txt(ctx,label,PX+98,28,{s:14*k,w:700,a:'center'});
  ctx.save();ctx.beginPath();ctx.rect(PX,44,206,376);ctx.clip();const top=PY-RULER*SC+fall*SC;ctx.fillStyle=PAL['cv-ruler'];rr(ctx,RX,top,RW,RULER*SC,3);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.stroke();
  for(let c=0;c<=RULER;c++){const y=top+(RULER-c)*SC;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=c%5?.8:1.6;ctx.beginPath();ctx.moveTo(RX,y);ctx.lineTo(RX+(c%5?8:15),y);ctx.stroke();if(c%5===0&&c>0&&c<RULER)txt(ctx,String(c),RX+RW-4,y,{s:12*k,w:600,c:PAL['cv-ink'],a:'right',b:'middle'});}ctx.restore();
  const phaseClose=e<0?0:clamp((e-(tr.rt-tr.E))/tr.E,0,1),gap=(1-phaseClose)*14;ctx.fillStyle='#c9956b';ctx.strokeStyle='#7a5535';ctx.lineWidth=1.3;[[RX-10-gap],[RX+RW+10+gap]].forEach(q=>{ctx.beginPath();ctx.ellipse(q[0],PY+2,12,7.5,0,0,6.2832);ctx.fill();ctx.stroke();});}
function drawPedal(ctx,tr,e,k,bp){const X=690,Y=280,a=e<tr.rt?0:clamp((e-tr.rt)/70,0,1)*.32,q=bp.mot[bp.mot.length-1];
  txt(ctx,e<0?'Brake pedal':e<tr.rt?'Foot on its way':'Pressed at '+(tr.rt/1000).toFixed(3)+' s',X,28,{s:14*k,w:700,a:'center'});
  ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([4,4]);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(X-70,Y+40);ctx.stroke();ctx.setLineDash([]);
  ctx.save();ctx.translate(X+50,Y+70);ctx.rotate(-1.05+a);ctx.fillStyle=PAL['cv-soft'];rr(ctx,-10,-150,20,150,6);ctx.fill();ctx.fillStyle='#3f6fb0';rr(ctx,-26,-150,16,108,8);ctx.fill();ctx.restore();
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(600,Y+70,190,10);}
function drawReflex(ctx,tr,e,k,H){const a=e<tr.rt?0:clamp((e-tr.rt)/70,0,1),hit=e>=0&&e<30;
  txt(ctx,e<tr.rt?(H?'Biceps tendon tap':'Knee tap'):'Responded in '+(tr.rt/1000).toFixed(3)+' s',692,28,{s:14*k,w:700,a:'center'});
  ctx.lineCap='round';ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=26;
  if(H){const ex=650,ey=300;ctx.beginPath();ctx.moveTo(ex,120);ctx.lineTo(ex,ey);ctx.stroke();const th=-a*.7;ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex+125*Math.cos(th),ey+125*Math.sin(th));ctx.stroke();ctx.lineCap='butt';ham(ctx,ex+16,ey-24,hit);}
  else{const kx=690,ky=170;ctx.beginPath();ctx.moveTo(600,ky);ctx.lineTo(kx,ky);ctx.stroke();const th=Math.PI/2-a*.6;ctx.beginPath();ctx.moveTo(kx,ky);ctx.lineTo(kx+170*Math.cos(th),ky+170*Math.sin(th));ctx.stroke();ctx.lineCap='butt';ham(ctx,kx+16,ky+26,hit);}}
function ham(ctx,x,y,hit){ctx.save();ctx.translate(x,y);ctx.rotate(hit?.05:-.55);ctx.fillStyle='#a8324a';rr(ctx,8,-11,28,22,6);ctx.fill();ctx.fillStyle='#6b7078';ctx.fillRect(36,-3,50,6);ctx.restore();}
BioLab.register(SIM);
})();
