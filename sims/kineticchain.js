(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;

/* A sagittal squat for a 70 kg, 1.75 m athlete. Segment lengths and masses are Winter's anthropometric fractions of height and body mass.
   For each thigh angle: the shank tilts forward as far as ankle range allows (it wants 0.4 x thigh angle), then the trunk leans
   until the whole-body center of mass sits over the midfoot. Hip demand = thigh angle + trunk lean. What the hip can't give comes from lumbar flexion.
   Depth stops when balance would need more than 65 degrees of lean, or the spine more than 35 degrees of flexion. */
const LS=.246,LT=.245,LB=.288,XF=.03,AX=.19,TILT=.1328,RAD=Math.PI/180,WT=70*9.81,HT=1.75,TAU_MAX=65,LAM_MAX=35;
const DEF={ankle:38,hip:120,glute:100,depth:90,thor:100,over:false,sides:'both'};
function pose(th,rom,hip){const d=Math.min(.4*th,rom),sn=Math.sin(th*RAD),Kx=LS*Math.sin(d*RAD),Hx=Kx-LT*sn;
  const rest=.029*.03+.093*.567*Kx+.2*(Hx+.433*LT*sn)+.678*Hx+.1*AX;let s=(XF-rest)/TILT;const bad=s>Math.sin(TAU_MAX*RAD);s=clamp(s,.02,1);
  const tau=Math.asin(s)/RAD;return {th,d,Kx,Hx,s,tau,lam:Math.max(0,th+tau-hip),bad};}
function solve(rom,hip,tgt){let best=pose(0,rom,hip);for(let th=.5;th<=tgt+1e-6;th+=.5){const q=pose(th,rom,hip);if(q.bad||q.lam>LAM_MAX)break;best=q;}return best;}
function model(p){const R=p.ankle,L=p.sides==='right'?DEF.ankle:p.ankle,mean=(R+L)/2,q=solve(mean,p.hip,p.depth),frac=clamp(q.th/90,0,1.15),need=.4*p.depth;
  const gap=x=>Math.max(0,need-x),val=x=>frac*(3+.35*gap(x)+.12*(100-p.glute)),vR=val(R),vL=val(L),v=Math.max(vR,vL);
  const T=25*p.thor/100,drift=p.over?Math.max(0,q.tau-(15+T)):0;
  const sn=Math.sin(q.th*RAD),thighX=q.Hx+.433*LT*sn,mAbove=.2*(thighX-q.Kx)+.678*(q.Hx-q.Kx)+TILT*q.s+.1*AX;
  const knee=Math.abs(WT*HT*mAbove)/2,hipM=WT*HT*(TILT*q.s+.1*AX)/2,ankleM=WT*HT*Math.max(0,XF-.029*.03)/2;
  const backBase=WT*HT*((.436*.2+.1*LB)*q.s+.1*AX),back=backBase*(1+q.lam/30)*(1+.25*(100-p.glute)/80)*(1+drift/60);
  const valg=(WT/2)*(LS*HT)*Math.sin(v*RAD),scap=p.over?30+drift*2.2:12;
  return {q,R,L,mean,vR,vL,v,T,drift,knee,hipM,ankleM,back,backBase,valg,scap,need,limited:q.th<p.depth-.25,atLimit:.4*q.th>=mean-.01&&mean<.4*p.depth};}
let memoK='',memoV=null;
function M(sim){const p=sim.p,key=[p.ankle,p.hip,p.glute,p.depth,p.thor,p.over,p.sides].join('|');if(key!==memoK){memoK=key;memoV=model(p);}return memoV;}
const ref=p=>model(Object.assign({},DEF,{depth:p.depth,over:p.over}));
const healthy=sim=>ref(sim.p);

function comps(sim,m){const o=[];if(m.limited)o.push('depth stops early');if(m.q.tau>healthy(sim).q.tau+6)o.push('trunk lean');if(m.q.lam>10)o.push('lumbar flexion');if(m.v>m.q.th/90*3+2.5)o.push('knee valgus');if(m.drift>5)o.push('arms drift forward');return o;}

const CASES={
  free:{},
  knee:{t:'Right knee pain',set:{ankle:18,sides:'right',hip:120,glute:100},fix:{ankle:38},
    say:'A soccer player has aching pain around the right knee during squats and landings. She sprained her right ankle last season and it never got its motion back. No swelling at the knee, no giving way.',
    look:'Evaluate both sides. Compare right and left ankle range and the two knees in the front view.',
    hurts:'the right knee',failed:'the right ankle',why:'The stiff ankle can’t let the shin move forward, so the foot rolls in and the knee collapses inward to find the motion. A stability joint is paying for a mobility joint.'},
  back:{t:'Low back pain',set:{ankle:38,sides:'both',hip:90,glute:100},fix:{hip:120},
    say:'A lineman sits most of the day and has low back pain at the bottom of every squat. No fall, no leg symptoms. His hips feel tight.',
    look:'Watch the low back in the side view as he reaches the bottom. Which joint runs out of range first?',
    hurts:'the low back',failed:'the hips',why:'When the hip runs out of flexion, the pelvis tucks under and the lumbar spine flexes to finish the squat. A joint built for stability is now moving under load.'},
  glute:{t:'Knee caves in, weak glutes',set:{ankle:38,sides:'both',hip:120,glute:40},fix:{glute:100},
    say:'A volleyball player’s knees drift inward on squats, and they ache at the front after practice. Both ankles and both hips move fully.',
    look:'Range is normal here, so check strength. Which muscle holds the femur from falling inward?',
    hurts:'the knees',failed:'the glutes',why:'Weak gluteal muscles can’t hold the femur out, so the knee drops inward. The low back works harder too, because the erector spinae pick up some of the glutes’ work.'}
};
function loadCase(sim,id){const c=CASES[id];sim.st.step=0;if(c&&c.set)BioLab.setValues(sim,Object.assign({},{depth:90,thor:100,over:false},c.set));}

const SIM={
  id:'kineticchain',hash:'kineticchain',apUnit:15,order:2,kind:'Simulation',tab:'Kinetic chain',
  card:'Stiffen an ankle or a hip, weaken the glutes, and watch a real squat change. See which joint pays for it.',
  title:'Kinetic chain and the joint-by-joint model',
  lede:{bio:'Your joints work as a chain. When a mobile joint loses range, a neighbor gives up stability to make up for it, and that neighbor is often the one that hurts.',
    honors:'Trace pain back to its source. Compare the two sides, read the load at each joint, and find which joint failed when another one hurts.',
    ap:'Add the thoracic spine and the shoulder blade to the model, then read joint moments to see how a range loss in one place moves load to another.'},
  scale:'One 70 kg, 1.75 m athlete in a bodyweight squat. Side view on the left, front view in the middle, load at each joint on the right.',
  aspect:800/520,timeless:true,animated:true,graph:false,tourReset:true,
  controls:[
    {id:'ankle',label:'Ankle dorsiflexion range',type:'range',min:5,max:45,step:1,def:38,unit:'°',lvl:'bio',help:'Weight-bearing. About 35 to 40° is typical.'},
    {id:'hip',label:'Hip flexion range',type:'range',min:80,max:140,step:1,def:120,unit:'°',lvl:'bio',help:'About 120° is typical.'},
    {id:'glute',label:'Glute strength',type:'range',min:20,max:100,step:5,def:100,unit:'%',lvl:'bio',help:'Percent of normal.'},
    {id:'depth',label:'Squat depth you are aiming for',type:'range',min:30,max:100,step:5,def:90,unit:'°',lvl:'bio',help:'Thigh angle from vertical. 90° is thighs parallel to the floor.'},
    {id:'sides',label:'The ankle limit is on',type:'seg',def:'both',lvl:'honors',options:[{v:'both',l:'Both sides'},{v:'right',l:'Right side only'}],help:'Evaluate both sides: the uninjured side shows you what normal is for this athlete.'},
    {id:'thor',label:'Thoracic spine mobility',type:'range',min:0,max:100,step:5,def:100,unit:'%',lvl:'ap',help:'Extended model. 100% is about 25° of extension.'},
    {id:'over',label:'Arms overhead',type:'toggle',def:false,lvl:'ap',help:'An overhead squat asks the thoracic spine and shoulder blade to work.'},
    {id:'cs',label:'Case',type:'select',def:'free',lvl:'bio',noTrial:true,options:[{v:'free',l:'No case, explore freely'},{v:'knee',l:'Right knee pain'},{v:'back',l:'Low back pain'},{v:'glute',l:'Knee caves in, weak glutes'}],onChange(sim){if(sim.st)loadCase(sim,sim.p.cs);}},
    {id:'move',label:'Animate the squat',type:'toggle',def:true,lvl:'bio',noTrial:true}
  ],
  actions:[
    {id:'local',label:'Treat where it hurts',enabled:s=>s.p.cs!=='free',run(sim){if(sim.p.cs!=='free')sim.st.step=1;}},
    {id:'fix',label:'Restore the joint that failed',primary:true,enabled:s=>s.p.cs!=='free',run(sim){const c=CASES[sim.p.cs];if(c&&c.fix){BioLab.setValues(sim,c.fix);sim.st.step=2;}}},
    {id:'healthy',label:'Back to a healthy squat',run(sim){BioLab.setValues(sim,Object.assign({},DEF,{cs:'free'}));sim.st.step=0;}}
  ],
  init(){return {ph:.36,step:0};},
  step(sim,dt){if(sim.p.move&&!RM)sim.st.ph=(sim.st.ph+dt/4.4)%1;},
  metrics:[
    {id:'th',label:'Depth reached (thigh angle)',unit:'°',lvl:'bio',min:0,max:100,d:0,get:s=>M(s).q.th},
    {id:'lean',label:'Trunk lean',unit:'°',lvl:'bio',min:0,max:70,d:0,get:s=>M(s).q.tau},
    {id:'lam',label:'Lumbar flexion',unit:'°',lvl:'bio',min:0,max:40,d:0,get:s=>M(s).q.lam},
    {id:'val',label:'Knee valgus, worse side',unit:'°',lvl:'bio',min:0,max:25,d:0,get:s=>M(s).v},
    {id:'kneeM',label:'Knee bending moment, each leg',unit:'N·m',lvl:'honors',min:0,max:110,d:0,get:s=>M(s).knee},
    {id:'valM',label:'Knee valgus moment',unit:'N·m',lvl:'honors',min:0,max:70,d:0,get:s=>M(s).valg},
    {id:'hipM',label:'Hip moment, each leg',unit:'N·m',lvl:'honors',min:0,max:110,d:0,get:s=>M(s).hipM},
    {id:'backM',label:'Low-back load',unit:'N·m',lvl:'honors',min:0,max:300,d:0,get:s=>M(s).back},
    {id:'drift',label:'Arm drift from vertical',unit:'°',lvl:'ap',min:0,max:50,d:0,get:s=>M(s).drift},
    {id:'comp',label:'Compensations you can see',unit:'',lvl:'bio',text:true,noTrial:true,get(s){const c=comps(s,M(s));return c.length?c.join(', '):'None';}}
  ],
  challenges:[
    {lvl:'bio',instant:true,q:'Ankle dorsiflexion range drops from 38° to 15°, and the athlete still tries to squat to parallel. What happens?',
     choices:['Nothing changes, because the ankle is far from the hips','The squat gets shallower and the trunk leans farther forward to stay balanced','The heels stay down and the athlete sits deeper'],correct:1,base:{},set:{ankle:15},
     check(m,h){return m.q.th<h.q.th-15&&m.q.tau>h.q.tau+15;},
     explain:'The shin can’t move forward, so the knees stay back and the hips end up behind the foot. The trunk must lean forward to keep the center of mass over the midfoot. Read the depth and the trunk lean.'},
    {lvl:'bio',instant:true,q:'Hip flexion range drops from 120° to 90°. The ankle is healthy. Where does the missing motion come from at the bottom of the squat?',
     choices:['The knee bends backward','The lumbar spine flexes','The ankle moves more'],correct:1,base:{},set:{hip:90},
     check(m,h){return m.q.lam>h.q.lam+20;},
     explain:'When the hip runs out of range, the pelvis tucks under and the low back rounds. The lumbar spine is a stability joint, and now it’s moving under load. That’s how stiff hips become low back pain.'},
    {lvl:'bio',instant:true,q:'A stiff ankle gives an athlete knee pain. Which treatment changes the load on the knee?',
     choices:['Rest and ice on the knee alone','Restoring ankle dorsiflexion','Neither one can change it'],correct:1,base:{ankle:18},set:{ankle:38},
     check(m,h){return m.valg<=h.valg+.01;},
     explain:'Rest and ice can calm the knee, but the next squat loads it the same way. Restoring the ankle removes the reason the knee collapses. Location A hurts, location B failed.'},
    {lvl:'honors',instant:true,q:'Only the right ankle is stiff (18°). The left is normal (38°). What should you see in the front view?',
     choices:['Both knees collapse the same amount','The right knee collapses inward more than the left','The left knee collapses inward more than the right'],correct:1,base:{sides:'right'},set:{sides:'right',ankle:18},
     check(m){return m.vR>m.vL+3;},
     explain:'The side with the deficit is the one that compensates. This is why you evaluate the injured and uninjured sides: the left side shows what normal is for this athlete.'},
    {lvl:'honors',instant:true,q:'At the point where a stiff ankle (15°) stops the squat, how does the knee’s load compare with a healthy squat to parallel?',
     choices:['The bending moment falls, but the side-to-side valgus moment rises','Both fall','Bending moment rises, valgus moment falls'],correct:0,base:{},set:{ankle:15},
     check(m,h){return m.knee<h.knee&&m.valg>h.valg;},
     explain:'With the knees held back and the squat shallower, the bending moment falls. The valgus moment rises because the knee is moving inward, the direction a stability joint is least built to take. Total load doesn’t tell the story: the direction of the load does.'},
    {lvl:'honors',instant:true,q:'Glute strength falls to 40% and range stays normal at both ankle and hip. Which readings go up?',
     choices:['Trunk lean and depth','Knee valgus and low-back load','Ankle moment only'],correct:1,base:{},set:{glute:40},
     check(m,h){return m.v>h.v+3&&m.back>h.back&&Math.abs(m.q.tau-h.q.tau)<.1;},
     explain:'This compensation has nothing to do with range. The glutes hold the femur out and extend the hip. When they’re weak, the knee drops inward and the erector spinae take on more work.'},
    {lvl:'ap',instant:true,q:'A stiff ankle (15°) is the root problem. What does the ankle moment do compared with a healthy squat?',
     choices:['It climbs far above normal','It stays about the same, because the center of mass stays over the midfoot','It falls to zero'],correct:1,base:{},set:{ankle:15},
     check(m,h){return Math.abs(m.ankleM-h.ankleM)<1;},
     explain:'The ankle moment depends on how far the center of mass sits ahead of the ankle, and balance pins that. The joint that failed shows little extra load. That’s why pain leads you to the wrong place if you stop at the gauge that’s high.'},
    {lvl:'ap',instant:true,q:'In an overhead squat, thoracic mobility drops from 100% to 0%. What changes first?',
     choices:['Depth drops','The arms drift forward and the shoulder blade and low back work harder','The hip moment doubles'],correct:1,base:{over:true},set:{over:true,thor:0},
     check(m,h){return m.drift>5&&m.back>m.backBase*(1+m.q.lam/30)*1.01&&m.scap>30;},
     explain:'Trunk lean has to be undone somewhere for the arms to stay vertical. A stiff thoracic spine can’t extend, so the shoulder blade and lumbar spine, both stability joints, take over. That’s the same rule one level up the chain.'}
  ],
  onChallenge(sim,ch,phase){if(!ch)return;const base=Object.assign({},DEF,{cs:'free'},ch.base||{});BioLab.setValues(sim,phase==='done'?Object.assign(base,ch.set||{}):base);},
  narrate(sim){const m=M(sim),h=healthy(sim),p=sim.p,q=m.q,c=sim.p.cs;
    const dep=Math.round(q.th),lean=Math.round(q.tau);
    if(c!=='free'&&sim.st.step===1)return '<b>The pain may ease, but nothing in the squat changed.</b> '+CASES[c].hurts.charAt(0).toUpperCase()+CASES[c].hurts.slice(1)+' still takes the same load. Now restore the joint that failed.';
    if(c!=='free'&&sim.st.step===2)return '<b>Location A hurt, location B failed.</b> With '+CASES[c].failed+' restored, '+CASES[c].hurts+' no longer has to compensate.';
    if(m.limited&&q.tau>=TAU_MAX-1)return '<b>The squat stops at '+dep+'°.</b> The shin ran out of range at '+Math.round(q.d)+'°, so the hips sit behind the foot. The trunk has leaned '+lean+'° to stay balanced and can’t lean farther.';
    if(m.limited)return '<b>The squat stops at '+dep+'°.</b> The low back has flexed as far as this model allows, because the hip ran out of range.';
    if(q.lam>10)return '<b>The hip ran out of range.</b> Thigh angle plus trunk lean asks for '+Math.round(q.th+q.tau)+'° of hip flexion, and only '+p.hip+'° is there. The lumbar spine, a stability joint, flexes '+Math.round(q.lam)+'° to make up the rest.';
    if(m.atLimit)return '<b>The ankle is at its limit.</b> The shin stops at '+Math.round(q.d)+'°, so the trunk leans '+lean+'° (healthy: '+Math.round(h.q.tau)+'°) to keep the center of mass over the foot.'+(m.v>h.v+2?' The knee collapses inward '+Math.round(m.v)+'° looking for the motion.':'');
    if(p.glute<80)return '<b>Range is fine, but strength isn’t.</b> With glutes at '+p.glute+'%, the femur drops inward and the knee valgus reaches '+Math.round(m.v)+'°. The low-back load rises too.';
    if(m.drift>5)return '<b>The arms are drifting '+Math.round(m.drift)+'° forward.</b> The thoracic spine can’t extend enough to undo the trunk lean, so the shoulder blade and low back take over.';
    return 'A healthy squat to '+dep+'°: the <b>mobile</b> joints (ankle, hip) move, and the <b>stable</b> joints (knee, low back) stay put. Now take range away from one joint and see who pays.';},
  tour:[
    {title:'A healthy squat',text:'Ankle, knee and hip bend together while the trunk leans just enough to keep the center of mass over the middle of the foot. The dashed line is that balance line.',focus:[0,0,275,520],speed:.8,setup(sim){BioLab.setValues(sim,Object.assign({},DEF,{cs:'free'}));}},
    {title:'Each joint has a job',text:'Going up the chain the jobs alternate: ankle mobility, knee stability, hip mobility, lumbar spine stability. This is the Joint by Joint model. M marks a mobile joint and S a stable one.',focus:[505,0,295,520],speed:.8},
    {title:'Take away ankle range',text:'Ankle dorsiflexion falls to 18°. The shin stops moving forward, so the knees stay back and the hips hang behind the foot.',focus:[0,0,275,520],speed:.6,setup(sim){BioLab.setValues(sim,{ankle:18});}},
    {title:'The trunk pays first',text:'To stay balanced the trunk must lean forward, and the squat can’t go as deep. Compare the bar on each row with its tick mark, which shows a healthy squat.',focus:[[0,0,275,520],[505,0,295,520]],speed:.6},
    {title:'Then the knee pays',text:'Look from the front. The foot rolls in and the knee collapses inward to find motion the ankle can’t give. That’s knee valgus, and it loads a joint meant for stability.',focus:[275,0,230,520],speed:.6},
    {title:'Stiff hips hit the low back',text:'Now the ankle is fine but hip flexion is 90°. At the bottom the pelvis tucks and the lumbar spine flexes. A joint meant to be stable is moving under load.',focus:[0,0,275,520],speed:.6,setup(sim){BioLab.setValues(sim,{ankle:38,hip:90});}},
    {title:'Strength counts too',text:'Range is normal again, but the glutes are at 40%. The knee still drops inward and the low back works harder. A joint can fail the chain through weakness as well as stiffness.',focus:[275,0,230,520],speed:.6,setup(sim){BioLab.setValues(sim,{hip:120,glute:40});}},
    {title:'Compare both sides',text:'Only the right ankle is stiff now. The left knee tracks straight and the right collapses. The uninjured side shows what normal is for this athlete, so evaluate both.',focus:[275,0,230,520],speed:.6,setup(sim){BioLab.setValues(sim,{glute:100,ankle:18,sides:'right'});}},
    {lvl:'ap',title:'The extended model',text:'Keep going up: thoracic spine mobility, then shoulder blade stability. With arms overhead and a stiff thoracic spine, the arms drift and the shoulder blade and low back work harder.',focus:[505,0,295,520],speed:.6,setup(sim){BioLab.setValues(sim,{ankle:38,sides:'both',over:true,thor:0});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,Object.assign({},DEF,{cs:'free'}));},
  infoPanel(sim){const id=sim.p.cs,c=CASES[id],m=M(sim);
    if(id==='free')return '<h3>The Joint by Joint model</h3><p><b>Ankle:</b> mobility. <b>Knee:</b> stability. <b>Hip:</b> mobility. <b>Lumbar spine:</b> stability.'+(atLeast('ap')?' <b>Thoracic spine:</b> mobility. <b>Shoulder blade:</b> stability.':'')+'</p><p>When a mobile joint loses range, the joint above or below gives up stability to make up for it. Pick a case to practice tracing pain back to its source.</p>';
    let h='<h3>Case: '+c.t+'</h3><p>'+c.say+'</p><p><b>Look:</b> '+c.look+'</p>';
    if(atLeast('honors')&&id==='knee')h+='<p><b>Right vs left:</b> ankle '+m.R+'° vs '+m.L+'°, knee valgus '+Math.round(m.vR)+'° vs '+Math.round(m.vL)+'°.</p>';
    if(sim.st.step===0)h+='<p>Decide which joint failed, then try <b>Treat where it hurts</b> and <b>Restore the joint that failed</b>.</p>';
    if(sim.st.step===1)h+='<p><b>Treating where it hurts:</b> this can calm the symptoms, and sometimes that’s needed first. Look at the gauges, though. The squat hasn’t changed, so the load comes right back.</p>';
    if(sim.st.step===2)h+='<p><b>Where it hurts:</b> '+c.hurts+'. <b>What failed:</b> '+c.failed+'.</p><p>'+c.why+'</p>';
    return h+'<p class="help">Practice cases for class. Real pain needs an evaluation by an athletic trainer or a doctor.</p>';},
  lab:{bio:'<p><b>Question:</b> How does losing range at one joint change the rest of the squat?</p><ol><li>Keep depth at 90°. Set ankle dorsiflexion range to 38°, 30°, 25°, 20° and 15°, and record a trial at each.</li><li>Press Back to a healthy squat. Set hip flexion range to 120°, 110°, 100° and 90°, and record each.</li></ol><p>Which joint or body part changed most in each run? Explain it using the Joint by Joint model.</p>',
    honors:'<p><b>Question:</b> When a joint hurts, how do you find the joint that failed?</p><ol><li>Open each case in turn. Before you touch anything, write down where it hurts.</li><li>Record a trial, press Treat where it hurts, and record again. Press Restore the joint that failed and record again.</li><li>For the knee case, set the limit to Right side only and compare right and left.</li></ol><p>For each case, write one sentence that says location A hurts because location B failed. Say why you compare both sides.</p>',
    ap:'<p><b>Question:</b> Which load goes up when ankle range goes down, and which goes down?</p><ol><li>At a 90° target, record knee bending moment, knee valgus moment, hip moment and low-back load for ankle ranges from 40° to 10° in 5° steps.</li><li>Plot each one against ankle range.</li><li>Turn on Arms overhead and repeat with thoracic mobility at 100% and 0%.</li></ol><p><b>Claim, evidence, reasoning:</b> A coach says a stiff ankle overloads the knee. Is that fully right? Use the moments to say what actually changes.</p>'},
  terms:[{t:'Kinetic chain',d:'The linked segments of the body, where motion or load at one joint affects the others.'},{t:'Joint by Joint model',d:'A way to see the body as alternating jobs: ankle mobility, knee stability, hip mobility, lumbar spine stability.'},{t:'Mobility',d:'How freely a joint moves through its range.'},{t:'Stability',d:'A joint’s ability to control motion and resist unwanted movement.'},{t:'Compensation',d:'Motion or effort a joint takes on because another joint can’t do its share.'},{t:'Dorsiflexion',d:'Moving the foot and shin closer together. In a squat, the shin moving forward over the foot.'},{t:'Knee valgus',d:'The knee collapsing inward, toward the midline.'},{t:'Lumbar flexion',d:'The low back rounding forward.'},
    {lvl:'honors',t:'Regional interdependence',d:'A problem in one body region can cause or add to symptoms in another. Location A hurts, location B failed.'},{lvl:'honors',t:'Moment',d:'The turning effect of a force about a joint: force times lever arm, in newton-meters (N·m).'},{lvl:'honors',t:'Bilateral comparison',d:'Evaluating the uninjured side as the normal for that athlete.'},
    {lvl:'ap',t:'Thoracic spine',d:'The upper back, a mobility joint in the extended model.'},{lvl:'ap',t:'Scapular stability',d:'The shoulder blade’s steady base for the arm.'},{lvl:'ap',t:'Center of mass',d:'The balance point of the whole body. In a steady squat it stays over the midfoot.'}],
  about:'<p><b>The squat is computed.</b> Segment lengths and masses are standard fractions of height and body mass (Winter) for a 70 kg, 1.75 m athlete. The shin tilts up to 0.4 × thigh angle, limited by ankle range. The trunk then leans until the center of mass is over the midfoot. Hip demand is thigh angle + trunk lean; anything beyond hip range becomes lumbar flexion. Depth stops at 65° of lean or 35° of lumbar flexion.</p><p><b>Moments</b> are weight × lever arm in a slow, static squat, per leg at the knee and hip.</p><p><b>These rules are not measured values; they’re teaching simplifications:</b> knee valgus (3° at parallel, plus 0.35° per degree of missing ankle range, plus 0.12° per percent of lost glute strength); the low-back load, which multiplies the moment by penalties for lumbar flexion, weak glutes and arm drift; and the thoracic and shoulder blade rows, which report arm drift and a demand score rather than a real moment. Real athletes also lift their heels, turn out their feet or widen their stance, none of which this figure does. Trunk balance isn’t recalculated when the arms go overhead.</p><p><b>Real research is more mixed than this model.</b> Limited dorsiflexion and weak hips are linked to more knee valgus, but the size of the effect varies a lot from person to person, and the Joint by Joint model is a useful way to reason rather than a proven law.</p><p><b>Educational use only.</b> This tool doesn’t diagnose anyone. An athletic trainer or doctor should evaluate real pain.</p>',
  initVis(){},
  draw(sim,ctx,vdt,k,t){drawAll(sim,ctx,k);},
  thumbSetup(sim){BioLab.setValues(sim,{ankle:18});sim.st.ph=.36;}
};

/* bottom hold is the middle of the cycle */
function squatF(ph){if(ph<.32)return (1-Math.cos(ph/.32*Math.PI))/2;if(ph<.5)return 1;if(ph<.82)return (1+Math.cos((ph-.5)/.32*Math.PI))/2;return 0;}
function limb(ctx,a,b,w,fill,edge){ctx.lineCap='round';ctx.strokeStyle=edge;ctx.lineWidth=w+3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle=fill;ctx.lineWidth=w;ctx.stroke();}
function dot(ctx,p,c,r){ctx.fillStyle=c;ctx.beginPath();ctx.arc(p.x,p.y,r,0,6.29);ctx.fill();ctx.strokeStyle=PAL['card'];ctx.lineWidth=2;ctx.stroke();}
function drawAll(sim,ctx,k){const p=sim.p,m=M(sim),h=healthy(sim),f=(p.move&&!RM)?squatF(sim.st.ph):1,th=m.q.th*f,q=pose(th,m.mean,p.hip);
  const FY=488,S=380,body=PAL['cv-tail'],edge=PAL['cv-soft'],bad=PAL['s1'],mob=PAL['s2'],stb=PAL['s3'],warn=PAL['s4'],lean=q.tau,dfrac=clamp(th/90,0,1.15);
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,520);ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(275,0,230,520);
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(505,0);ctx.lineTo(505,520);ctx.moveTo(275,0);ctx.lineTo(275,520);ctx.stroke();
  // side view
  const ax=128,A={x:ax,y:FY-.039*S},K={x:A.x+LS*S*Math.sin(q.d*RAD),y:A.y-LS*S*Math.cos(q.d*RAD)},H={x:K.x-LT*S*Math.sin(th*RAD),y:K.y-LT*S*Math.cos(th*RAD)},
    Sh={x:H.x+LB*S*Math.sin(lean*RAD),y:H.y-LB*S*Math.cos(lean*RAD)},hd={x:Sh.x+.1*S*Math.sin(lean*.55*RAD),y:Sh.y-.1*S*Math.cos(lean*.55*RAD)};
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,FY,275,4);ctx.fillRect(275,FY,230,4);
  const cmx=ax+XF*S;ctx.strokeStyle=PAL['s6'];ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(cmx,FY);ctx.lineTo(cmx,90);ctx.stroke();ctx.setLineDash([]);
  const stiff=m.atLimit&&q.d>=m.mean-.01;
  ctx.fillStyle=stiff?warn:body;ctx.strokeStyle=edge;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax-.04*S,FY-1);ctx.lineTo(ax+.13*S,FY-1);ctx.quadraticCurveTo(ax+.1*S,FY-.03*S,A.x+6,A.y-2);ctx.lineTo(ax-.03*S,A.y);ctx.closePath();ctx.fill();ctx.stroke();
  limb(ctx,A,K,20,stiff?warn:body,edge);limb(ctx,K,H,26,body,edge);
  const arm=p.over?{x:Sh.x+.31*S*Math.sin(m.drift*f*RAD),y:Sh.y-.31*S*Math.cos(m.drift*f*RAD)}:{x:Sh.x+.31*S,y:Sh.y+6};
  const lamN=clamp(q.lam/LAM_MAX,0,1),nx=-Math.cos(lean*RAD),ny=-Math.sin(lean*RAD),mid={x:(H.x+Sh.x)/2+nx*lamN*26,y:(H.y+Sh.y)/2+ny*lamN*26};
  ctx.lineCap='round';ctx.strokeStyle=edge;ctx.lineWidth=45;ctx.beginPath();ctx.moveTo(H.x,H.y);ctx.quadraticCurveTo(mid.x,mid.y,Sh.x,Sh.y);ctx.stroke();ctx.strokeStyle=body;ctx.lineWidth=42;ctx.stroke();
  const Lp=qb(H,mid,Sh,.28),Tp=qb(H,mid,Sh,.72);
  if(q.lam>10){ctx.strokeStyle=bad;ctx.globalAlpha=clamp(q.lam/30,.25,.75);ctx.lineWidth=42;ctx.beginPath();const a=qb(H,mid,Sh,.1),b=qb(H,mid,Sh,.45);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.globalAlpha=1;}
  ctx.fillStyle=body;ctx.strokeStyle=edge;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(hd.x,hd.y,.058*S,0,6.29);ctx.fill();ctx.stroke();
  limb(ctx,Sh,arm,13,body,edge);
  dot(ctx,A,stiff?warn:mob,7.5);dot(ctx,K,m.v>h.v+2?bad:stb,7.5);dot(ctx,H,q.lam>10?warn:mob,8);dot(ctx,Lp,q.lam>10?bad:stb,7);
  if(atLeast('ap')){dot(ctx,Tp,p.thor<60?warn:mob,6.5);dot(ctx,Sh,m.drift>5?bad:stb,6.5);}
  txt(ctx,'Side view',12,20*Math.max(1,k*.9),{s:13*k,w:800});
  let py=(26+18*k);const leanHi=m.q.tau>h.q.tau+6;
  if(leanHi){pill(ctx,'Trunk lean '+Math.round(m.q.tau)+'°',12*k*4.6+18,py,PAL['s4'],'#1c1c1f',12*k);py+=23*k;}
  if(m.q.lam>10)pill(ctx,'Lumbar flexion '+Math.round(m.q.lam)+'°',12*k*5.6+18,py,PAL['s1'],'#fff',12*k);
  if(m.atLimit)txt(ctx,m.q.th<p.depth-.25?'Heels want to lift':'Ankle at its limit',137,510,{s:12*k,w:700,c:PAL['s4'],a:'center',b:'middle'});
  else txt(ctx,'balance line',137,510,{s:12*k,c:PAL['s6'],a:'center',b:'middle'});
  // front view
  const cx=390,mirror=[-1,1];txt(ctx,'Front view',cx,20*Math.max(1,k*.9),{s:13*k,w:800,a:'center'});
  const vR=m.vR*f,vL=m.vL*f,sag=(m.vR-m.vL)*.35*f,hipY=H.y,kneeY=K.y,ankY=A.y,headY=hd.y;
  const pelL={x:cx-.06*S,y:hipY+sag},pelR={x:cx+.06*S,y:hipY},shW=.1*S,trunkTop=Sh.y;
  ctx.fillStyle=body;ctx.strokeStyle=edge;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(pelL.x,pelL.y+8);ctx.lineTo(pelR.x,pelR.y+8);ctx.lineTo(cx+shW,trunkTop-6);ctx.lineTo(cx-shW,trunkTop-6);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(cx,headY,.058*S,0,6.29);ctx.fill();ctx.stroke();
  mirror.forEach(s=>{const a={x:cx+s*shW,y:trunkTop},b=p.over?{x:cx+s*(shW+6),y:trunkTop-.3*S*Math.cos(m.drift*f*RAD)}:{x:cx+s*(shW-22),y:trunkTop+26};limb(ctx,a,b,12,body,edge);});
  ctx.strokeStyle=PAL['line'];
  mirror.forEach(s=>{const v=s<0?vR:vL,hx=cx+s*.052*S,hy=hipY+(s<0?sag:0),fx=cx+s*.1*S,midx=(hx+fx)/2,inward=LS*S*Math.sin(v*RAD)*1.15,kx=midx-s*inward,
    hot=v>dfrac*3+2.5;
    ctx.setLineDash([5,5]);ctx.strokeStyle=PAL['s6'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(fx,ankY);ctx.stroke();ctx.setLineDash([]);
    limb(ctx,{x:fx,y:ankY},{x:kx,y:kneeY},18,body,edge);limb(ctx,{x:kx,y:kneeY},{x:hx,y:hy},24,body,edge);
    ctx.fillStyle=body;ctx.strokeStyle=edge;ctx.lineWidth=1.5;rr(ctx,fx-14,FY-12,28,12,5);ctx.fill();ctx.stroke();
    dot(ctx,{x:kx,y:kneeY},hot?bad:stb,7.5);
    txt(ctx,s<0?'R':'L',fx,508,{s:12*k,w:800,a:'center',b:'middle',c:hot?PAL['s1']:PAL['cv-soft']});});
  if(m.v>m.q.th/90*3+2.5){const s=m.R===m.L?'Valgus '+Math.round(m.v)+'°':'Valgus R '+Math.round(m.vR)+'°, L '+Math.round(m.vL)+'°';pill(ctx,s,cx,26+18*k,PAL['s1'],'#fff',12*k);}
  // joint by joint gauges
  const rows=[];
  if(atLeast('ap')){rows.push({n:'Shoulder blade',r:'S',v:m.scap,max:100,ref:h.scap,u:'demand'});rows.push({n:'Thoracic spine',r:'M',v:m.T,max:25,ref:25,u:'°',low:true});}
  rows.push({n:'Low back',r:'S',v:m.back,max:320,ref:h.back,u:'N·m'},{n:'Hip',r:'M',v:m.hipM,max:110,ref:h.hipM,u:'N·m'},{n:'Knee bending',r:'S',v:m.knee,max:110,ref:h.knee,u:'N·m'},{n:'Knee valgus',r:'S',v:m.valg,max:70,ref:h.valg,u:'N·m'},{n:'Ankle',r:'M',v:m.ankleM,max:60,ref:h.ankleM,u:'N·m'});
  const gx=516,gw=272,top=14+14*k,bot=488-14*k,rh=Math.min(66,(bot-top)/rows.length);
  txt(ctx,'Load at the bottom',gx,20*Math.max(1,k*.9),{s:13*k,w:800});
  rows.forEach((r,i)=>{const y=top+i*rh+rh*.5-(6*k+5),c=r.r==='M'?mob:stb,tag=9*k;
    ctx.fillStyle=c;ctx.beginPath();ctx.arc(gx+tag*.8,y,tag*.8,0,6.29);ctx.fill();txt(ctx,r.r,gx+tag*.8,y+.5,{s:11*k>12?11*k:12,w:800,c:'#fff',a:'center',b:'middle'});
    txt(ctx,r.n,gx+tag*2.1,y,{s:12*k,w:700,b:'middle'});txt(ctx,Math.round(r.v)+(r.u==='°'?'°':(k>1.25&&r.u==='demand'?'':' '+r.u)),gx+gw,y,{s:12*k,c:PAL['cv-soft'],a:'right',b:'middle'});
    const by=y+6*k+4,bh=10;ctx.fillStyle=PAL['card2'];rr(ctx,gx,by,gw,bh,5);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    const fr=clamp(r.v/r.max,0,1),over=r.low?(r.ref-r.v)/r.ref>.2:r.ref>0&&r.v>r.ref*1.1+1.5,bigOver=r.low?(r.ref-r.v)/r.ref>.5:r.ref>0&&r.v>r.ref*1.3+2;
    ctx.fillStyle=bigOver?PAL['s1']:over?PAL['s4']:PAL['cv-soft'];rr(ctx,gx,by,Math.max(4,fr*gw),bh,5);ctx.fill();
    const tx=gx+clamp(r.ref/r.max,0,1)*gw;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(tx,by-3);ctx.lineTo(tx,by+bh+3);ctx.stroke();});
  txt(ctx,'M mobile  S stable  | healthy squat',gx,508,{s:k>1.25?12*k*.74<12?12:12*k*.74:12*k*.92,c:PAL['cv-soft'],b:'middle'});
}
function qb(a,c,b,t){const u=1-t;return {x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y};}
BioLab.kineticModel={model,DEF};
BioLab.register(SIM);
})();
