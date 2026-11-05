(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;

/* ---------- Forces: limit of each tissue, as a percent of its own tensile strength ---------- */
const LIMIT={bone:{tension:100,compression:150,shear:50},ligament:{tension:100,compression:35,shear:45},tendon:{tension:100,compression:35,shear:40},muscle:{tension:100,compression:70,shear:50}};
const TN={bone:'Bone',ligament:'Ligament',tendon:'Tendon',muscle:'Muscle'};
const TCOL={bone:'#c9b48a',ligament:'#6f8fa8',tendon:'#8a9aa6',muscle:'#b5575f'};
const FAIL={
  bone:{tension:['Avulsion fracture','A tendon or ligament pulls a piece of bone away.','A hamstring tendon pulling a fleck off the pelvis in a sprinter.'],
    compression:['Compression fracture','The bone crushes along its length.','A vertebra crushed in a hard fall onto the feet.'],
    shear:['Shear fracture','Layers of bone slide past each other. In teens the epiphyseal plate is the weak spot.','A growth plate injury from a hit to a planted leg.']},
  ligament:{tension:['Sprain','Fibers stretch, then tear, when a joint is forced past its range.','The ATFL when an ankle rolls in.'],
    compression:['Pinched ligament','Ligaments carry pulls, not pushes. Squeezed between bones, the tissue folds and bruises.','Soft tissue pinched at the front of the ankle.'],
    shear:['Shear and twist tear','A twist adds sliding load to the pull, and fibers tear across the ligament.','An ACL tear on a planted, rotating knee.']},
  tendon:{tension:['Strain (tendon)','Fibers tear when the muscle pulls harder than the tendon can take.','An Achilles rupture on a hard push-off.'],
    compression:['Pinched tendon','A tendon squeezed against bone gets irritated and damaged.','The supraspinatus pinched under the acromion.'],
    shear:['Tendon sheath irritation','The tendon rubs as it slides inside its sheath.','The thumb tendons at the wrist in a rower.']},
  muscle:{tension:['Strain (muscle)','Fibers tear, often where muscle meets tendon.','A hamstring pulled at top sprinting speed.'],
    compression:['Contusion','A direct blow crushes muscle against bone, and capillaries bleed.','A helmet to the front of the thigh.'],
    shear:['Deep bruise','Muscle layers slide, tear small vessels and bleed between the layers.','A glancing hit to a tensed thigh.']}};
const CHRONIC={bone:'Stress fracture',ligament:'Chronic laxity',tendon:'Tendinopathy',muscle:'Overuse strain'};
const CHRONICEX={bone:'A runner’s shin bone after a sudden jump in miles.',ligament:'A pitcher’s elbow UCL stretched over many seasons.',tendon:'A jumper’s patellar tendon after months of practice.',muscle:'A swimmer’s shoulder muscles late in a heavy season.'};
const fatigue=(n,rest)=>1-(rest?.04:.09)*Math.log10(n);
function forceState(p){const lim=LIMIT[p.tissue][p.force],n=+p.reps,eff=lim*fatigue(n,p.rest),ratio=p.load/eff,elastic=.5;
  const once=p.load>=lim,failed=ratio>=1,state=failed?'Failure':ratio>=elastic?'Plastic':'Elastic',chronic=failed&&!once;
  const f=FAIL[p.tissue][p.force];return {lim,eff,ratio,state,failed,chronic,once,n,name:chronic?CHRONIC[p.tissue]:f[0],how:chronic?'One load this size was safe. Repeated without enough recovery, damage builds faster than the body repairs it.':f[1],ex:chronic?CHRONICEX[p.tissue]:f[2]};}

/* ---------- Grades ---------- */
const GRADE={1:{a:'Least severe. Fibers stretch.',wb:'WB OK',rom:'ROM and strength WNL',sw:'Little swelling',torn:0},
  2:{a:'Partial tear.',wb:'Antalgic gait',rom:'ROM and strength decreased',sw:'Some swelling',torn:.5},
  3:{a:'Complete tear.',wb:'NWB',rom:'ROM and strength lost',sw:'Significant swelling',torn:1}};

/* ---------- Healing: integrated once per tissue, grade, rehab choice and start day, then cached ---------- */
const HEAL={bone:{rC:.09,tA:60,ceil:100,rest:.4,g0:10,rule:'Bone needs short bursts of load with rest between them.'},
  muscle:{rC:.1,tA:40,ceil:90,rest:.4,rule:'Muscle needs progressive resistance. It has a rich blood supply and heals fastest.'},
  tendon:{rC:.045,tA:90,ceil:80,rest:.35,rule:'Tendon needs controlled tensile load. It heals slowly.'},
  ligament:{rC:.03,tA:120,ceil:70,rest:.3,rule:'Ligament heals slowly. Its blood supply is limited.'}};
const G0={1:70,2:40,3:8},MAXD=1095,DAYS=[];for(let d=0;d<=120;d+=.25)DAYS.push(d);for(let d=121;d<=MAXD;d++)DAYS.push(d);
const healMemo={};
function heal(tis,grade,rehab,start){const key=[tis,grade,rehab,start].join('|');if(healMemo[key])return healMemo[key];const P=HEAL[tis],g0=P.g0||G0[grade];
  let C=0,A=.08,cl=P.ceil,restUntil=0,L=62,prev=0;const ev=[],S=[],Cs=[],As=[];
  DAYS.forEach((d,i)=>{const dt=i?d-prev:0;prev=d;let res=g0*(1-.35*Math.min(1,d/5));if(rehab==='ctrl'&&start<3)res*=.9;
    if(d>=3)C+=P.rC*(1-C)*dt;
    const loaded=rehab==='ctrl'?d>=start:rehab==='early'?(d>=7&&d>=restUntil):false,aC=loaded?1:P.rest,rate=(loaded?(rehab==='ctrl'&&start>5?1-.6*Math.min(1,(start-5)/37):1):.5)/P.tA;
    A+=(aC-A)*rate*Math.max(C,.05)*dt;A=clamp(A,0,1);
    let s=res+Math.max(0,cl-res)*C*Math.pow(A,.8);
    if(rehab==='early'&&loaded&&d<120&&s<L){ev.push(d);C*=.45;A=Math.max(.08,A*.5);cl*=.93;restUntil=d+10;L*=.8;s=res+Math.max(0,cl-res)*C*Math.pow(A,.8);}
    S.push(s);Cs.push(C);As.push(A);});
  return healMemo[key]={S,C:Cs,A:As,ev};}
const dayOf=pos=>Math.round((Math.pow(MAXD+1,pos/100)-1)*10)/10;
const posOf=d=>100*Math.log(d+1)/Math.log(MAXD+1);
function idxOf(d){if(d<=120)return Math.round(d*4);return Math.min(DAYS.length-1,480+Math.round(d-120));}
function dayText(d){if(d<1)return 'Injury day';if(d<14)return 'Day '+Math.round(d);if(d<70)return (d/7).toFixed(d<49?1:0).replace('.0','')+' weeks';if(d<365)return Math.round(d/30.4)+' months';const y=d/365;return (y<1.05?'1 year':y.toFixed(1).replace('.0','')+' years');}
function phaseOf(d){if(d<3)return ['Inflammatory response'];if(d<=4)return ['Inflammatory response','Repair and regeneration'];if(d<28)return ['Repair and regeneration'];if(d<=42)return ['Repair and regeneration','Remodeling and maturation'];return ['Remodeling and maturation'];}
const healNow=sim=>{const p=sim.p,h=heal(p.tissue,p.grade,p.rehab,p.start),d=dayOf(p.day),i=idxOf(d);return {h,d,i,S:h.S[i],C:h.C[i],A:h.A[i],ev:h.ev.filter(e=>e<=d)};};
const REHAB={rest:'Rest only',ctrl:'Controlled load',early:'Too much too early'};

/* ---------- Rehab plan ---------- */
const STEPS=[
  {n:'Minimize swelling',full:'Minimize swelling',why:'Swelling comes first: it blocks motion and shuts down muscle activity.',ex:{ankle:'Compression wrap, elevate, ice for short periods.',ham:'Compression sleeve, ice, avoid heat early.'}},
  {n:'Control pain',full:'Control pain',why:'Pain changes how someone moves, so calm it before asking for more motion.',ex:{ankle:'Protect with a brace or crutches if needed, modify activity.',ham:'Avoid painful stretching, shorten the stride or walk.'}},
  {n:'Regain ROM',full:'Regain range of motion (ROM)',why:'You can’t strengthen or balance through a range you don’t have yet.',ex:{ankle:'Ankle alphabet, gentle dorsiflexion with a towel.',ham:'Pain-free active knee bends and gentle stretching.'}},
  {n:'Neuromuscular control',full:'Neuromuscular control',why:'The brain and muscles relearn timing before heavier work.',ex:{ankle:'Slow weight shifts, seated ankle control drills.',ham:'Hip bridges with slow control, marching in place.'}},
  {n:'Balance and posture',full:'Balance and posture',why:'Joint position sense and a steady base protect the tissue under load.',ex:{ankle:'Single-leg stance, eyes open, then eyes closed.',ham:'Single-leg stance with a slow forward hinge.'}},
  {n:'Muscular strength',full:'Muscular strength',why:'Strength builds once motion and control can support the load.',ex:{ankle:'Band eversion, heel raises, then single-leg raises.',ham:'Nordic curls, Romanian deadlifts with progressive load.'}},
  {n:'Cardio endurance',full:'Cardiorespiratory endurance',why:'Fitness returns with exercise the healing tissue can now tolerate. Many athletes can keep some going throughout with a bike or pool.',ex:{ankle:'Stationary bike, pool running, then jogging.',ham:'Stationary bike, then progressive jogging.'}},
  {n:'Functional progressions',full:'Functional progressions to sport and ADLs',why:'Sport and activities of daily living (ADLs) go last. They need all of the earlier steps.',ex:{ankle:'Cutting drills, jumps and landings, then practice.',ham:'Build up sprint speed, then practice and return to play.'}}];
function shuffled(){return [4,0,6,2,7,1,5,3];}
const inPlace=s=>s.plan.filter((x,i)=>x===i).length;

/* ---------- Sync what shows for the current view ---------- */
function sync(sim){if(!sim.ui||!sim.ui.ctlW)return;const v=sim.p.view,d=sim.def;
  d.controls.forEach(c=>{const w=sim.ui.ctlW[c.id];if(!w)return;let on=atLeast(c.lvl);if(c.views)on=on&&c.views.includes(v);
    if(c.id==='grade')on=on&&(v==='healing'?sim.p.tissue!=='bone':(sim.p.kind==='sprain'||sim.p.kind==='strain'));if(c.id==='bruise')on=on&&sim.p.kind==='contusion';if(c.id==='start')on=on&&sim.p.rehab==='ctrl';w.hidden=!on;});
  d.actions.forEach(a=>{const b=sim.ui.actB[a.id];if(b)b.hidden=!atLeast(a.lvl)||(a.views&&!a.views.includes(v));});
  d.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const e=t.num.closest('.tile');if(e)e.hidden=!atLeast(m.lvl)||(m.views&&!m.views.includes(v));});
  setDayOut(sim);}
function setDayOut(sim){const o=document.getElementById('injury-day-out');if(o){const s=dayText(dayOf(sim.p.day));if(o.textContent!==s)o.textContent=s;}}
const syncCh=sim=>{sync(sim);sim.infoDirty=true;};

const SIM={
  id:'injury',hash:'injury',apUnit:15,order:3,kind:'Simulation',tab:'Injury and healing',
  card:'Load tissue until it fails, compare sprain and strain grades, then rehab an injury and watch collagen line up, or tear again.',
  title:'Injury and healing',
  lede:{bio:'Apply a force to a tissue and see how it fails. Then follow the healing timeline, and see why controlled load heals tissue and too much too early tears it again.',
    honors:'Connect mechanism to injury: tension, compression and shear on bone, ligament, tendon and muscle. Then plan rehab around what the tissue can take in each phase of healing.',
    ap:'Read the load against the elastic and plastic ranges, see how repeated loads lower the limit, and compare strength curves across tissues and rehab choices.'},
  scale:{bio:'From a single tissue up to a whole rehab plan. Healing runs from the day of injury to 3 years later.'},
  aspect:800/520,timeless:true,animated:true,graph:false,
  controls:[
    {id:'view',label:'View',type:'seg',def:'forces',lvl:'bio',noTrial:true,options:[{v:'forces',l:'Forces'},{v:'grades',l:'Grades'},{v:'healing',l:'Healing'},{v:'plan',l:'Rehab plan'}],onChange:syncCh},
    {id:'tissue',label:'Tissue',type:'seg',def:'ligament',lvl:'bio',views:['forces','healing'],options:[{v:'bone',l:'Bone'},{v:'ligament',l:'Ligament'},{v:'tendon',l:'Tendon'},{v:'muscle',l:'Muscle'}],onChange:syncCh},
    {id:'force',label:'Force',type:'seg',def:'tension',lvl:'bio',views:['forces'],options:[{v:'tension',l:'Tension'},{v:'compression',l:'Compression'},{v:'shear',l:'Shear'}]},
    {id:'load',label:'Load',type:'range',min:0,max:200,step:5,def:60,unit:'%',lvl:'bio',views:['forces'],help:'100% is the pull that would snap this tissue.'},
    {id:'reps',label:'How many times',type:'seg',def:'1',lvl:'bio',views:['forces'],options:[{v:'1',l:'Once (acute)'},{v:'1000',l:'1,000'},{v:'100000',l:'100,000 (chronic)'}]},
    {id:'rest',label:'Recovery between sessions',type:'toggle',def:false,lvl:'honors',views:['forces'],help:'Tissue repairs and adapts between bouts.'},
    {id:'kind',label:'Injury',type:'seg',def:'sprain',lvl:'bio',views:['grades'],noTrial:true,options:[{v:'sprain',l:'Sprain'},{v:'strain',l:'Strain'},{v:'contusion',l:'Contusion'},{v:'catastrophic',l:'Catastrophic'}],onChange:syncCh},
    {id:'grade',label:'Grade',type:'seg',def:2,lvl:'bio',views:['grades','healing'],options:[{v:1,l:'I'},{v:2,l:'II'},{v:3,l:'III'}]},
    {id:'bruise',label:'Blood goes',type:'seg',def:'ecch',lvl:'bio',views:['grades'],noTrial:true,options:[{v:'ecch',l:'Spreads: ecchymosis'},{v:'hema',l:'Pools: hematoma'}]},
    {id:'rehab',label:'Rehab choice',type:'seg',def:'ctrl',lvl:'bio',views:['healing'],options:[{v:'rest',l:'Rest only'},{v:'ctrl',l:'Controlled load'},{v:'early',l:'Too much too early'}],onChange:syncCh},
    {id:'day',label:'Time since injury',type:'range',min:0,max:100,step:.5,def:45,lvl:'bio',views:['healing'],noTrial:true,onChange(sim){setDayOut(sim);}},
    {id:'start',label:'Start controlled load on day',type:'range',min:1,max:42,step:1,def:5,lvl:'ap',views:['healing']},
    {id:'cs',label:'Mini project case',type:'seg',def:'ankle',lvl:'bio',views:['plan'],noTrial:true,options:[{v:'ankle',l:'Grade II ankle sprain'},{v:'ham',l:'Grade II hamstring strain'}]}
  ],
  actions:[
    {id:'play',label:'Play the timeline',primary:true,views:['healing'],run(sim){if(sim.p.day>=100)BioLab.setValues(sim,{day:0});sim.st.playing=!sim.st.playing;}},
    {id:'check',label:'Check my order',primary:true,views:['plan'],run(sim){sim.st.checked=true;}},
    {id:'clear',label:'Clear my plan',views:['plan'],run(sim){sim.st.plan=[];sim.st.checked=false;}}
  ],
  init(){return {plan:[],checked:false,playing:false,flash:0};},
  step(sim,dt){const s=sim.st;if(s.playing&&sim.p.view==='healing'){const nx=Math.min(100,sim.p.day+dt*7);BioLab.setValues(sim,{day:Math.round(nx*10)/10});if(nx>=100)s.playing=false;}},
  onLevel(sim){sync(sim);},
  metrics:[
    {id:'pct',views:['forces'],label:'Load as a share of the limit',unit:'%',lvl:'bio',min:0,max:200,d:0,get:s=>forceState(s.p).ratio*100},
    {id:'lim',views:['forces'],label:'Limit for this load and count',unit:'%',lvl:'honors',min:0,max:150,d:0,get:s=>forceState(s.p).eff},
    {id:'stateT',views:['forces'],label:'What the tissue does',unit:'',lvl:'bio',text:true,get(s){const f=forceState(s.p);return f.failed?f.name:f.state==='Plastic'?'Plastic: some fibers damaged':'Elastic: springs back';}},
    {id:'wb',views:['grades'],label:'Weight bearing',unit:'',lvl:'bio',text:true,noTrial:true,get(s){return s.p.kind==='sprain'||s.p.kind==='strain'?GRADE[s.p.grade].wb:'Varies';}},
    {id:'dayM',views:[],label:'Days since injury',unit:'days',lvl:'bio',d:1,get:s=>dayOf(s.p.day)},
    {id:'str',views:['healing'],label:'Tissue strength, percent of uninjured',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>healNow(s).S},
    {id:'ali',views:['healing'],label:'Collagen alignment',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>healNow(s).A*100},
    {id:'tears',views:['healing'],label:'Reinjuries so far',unit:'',lvl:'bio',min:0,max:8,d:0,get:s=>healNow(s).ev.length},
    {id:'phaseT',views:['healing'],label:'Phase',unit:'',lvl:'bio',text:true,noTrial:true,get(s){return phaseOf(healNow(s).d).join(' and ');}},
    {id:'placed',views:['plan'],label:'Steps in your plan',unit:'of 8',lvl:'bio',min:0,max:8,d:0,noTrial:true,get:s=>s.st.plan.length}
  ],
  challenges:[
    {lvl:'bio',instant:true,q:'A ligament takes a load of 60% of its tensile limit once, in tension. What happens?',choices:['It snaps','It stretches and may have some damaged fibers, but it doesn’t fail','Nothing at all, ever'],correct:1,base:{view:'forces',tissue:'ligament',force:'tension',load:60,reps:'1'},
     check:s=>{const f=forceState(s.p);return !f.failed&&f.state==='Plastic';},explain:'A load under the limit doesn’t tear the tissue through. Past the elastic range, though, some fibers are damaged and it won’t quite spring back. That’s a grade I stretch.'},
    {lvl:'bio',instant:true,q:'That same 60% load repeats 100,000 times with no recovery. What’s the likely result?',choices:['No change, since it was safe once','The limit falls until the load fails the tissue: a chronic injury','The tissue always gets stronger'],correct:1,base:{view:'forces',tissue:'bone',force:'tension',load:60,reps:'1'},set:{reps:'100000'},
     check:s=>forceState(s.p).chronic,explain:'Every repeat leaves a little damage. Without recovery, the limit falls until a load that was safe once causes failure. In bone that’s a stress fracture, and it’s why acute and chronic injuries have different causes.'},
    {lvl:'bio',instant:true,q:'An athlete with a grade II sprain feels better at 3 weeks and returns to full practice. The tissue is in the repair phase. Which rehab choice in the model reinjures the ligament?',choices:['Controlled load','Too much too early','Neither'],correct:1,base:{view:'healing',tissue:'ligament',grade:2,rehab:'ctrl',day:posOf(21)},set:{rehab:'early'},
     check:s=>heal('ligament',2,'early',5).ev.length>0&&heal('ligament',2,'ctrl',5).ev.length===0,explain:'Collagen in the repair phase is still disorganized and weak. Pain fades well before strength returns, which is why this is when people usually reinjure.'},
    {lvl:'honors',instant:true,q:'Which load fails bone first: tension, compression or shear, at the same load?',choices:['Tension','Compression','Shear'],correct:2,base:{view:'forces',tissue:'bone',force:'compression',load:60,reps:'1'},set:{force:'shear'},
     check:s=>{const L=LIMIT.bone;return L.shear<L.tension&&L.tension<L.compression&&forceState(s.p).failed;},explain:'Bone is strongest in compression and weakest in shear. At 60% load, compression leaves bone undamaged and shear fails it. Bones are built to hold you up, not to have layers slide across each other.'},
    {lvl:'honors',instant:true,q:'At one year, how does a ligament kept at rest compare with one given controlled load?',choices:['About the same','Weaker, because the collagen never lined up','Stronger, because it was protected'],correct:1,base:{view:'healing',tissue:'ligament',grade:2,rehab:'ctrl',day:posOf(365)},set:{rehab:'rest'},
     check(){const i=idxOf(365);return heal('ligament',2,'rest',5).S[i]<heal('ligament',2,'ctrl',5).S[i]-8;},explain:'Collagen lines up along the direction of load. Without tension, the fibers stay disorganized, so even a full amount of collagen is weak.'},
    {lvl:'honors',instant:true,q:'Same grade II injury, same controlled load. Which tissue reaches the highest strength by 6 weeks?',choices:['Ligament','Tendon','Muscle'],correct:2,base:{view:'healing',tissue:'ligament',grade:2,rehab:'ctrl',day:posOf(42)},set:{tissue:'muscle'},
     check(){const i=idxOf(42),f=t=>heal(t,2,'ctrl',5).S[i];return f('muscle')>f('tendon')&&f('tendon')>f('ligament');},explain:'Muscle has a rich blood supply and rebuilds fastest. Tendon and especially ligament have limited blood supply, so collagen arrives more slowly.'},
    {lvl:'ap',instant:true,q:'Controlled load on a ligament starts on day 5 or on day 42. What does the model show at 6 months?',choices:['Starting on day 42 is stronger, since the tissue got more rest','Starting on day 5 is stronger, since collagen aligned for longer','They’re identical'],correct:1,base:{view:'healing',tissue:'ligament',grade:2,rehab:'ctrl',start:5,day:posOf(182)},set:{start:42},
     check(){const i=idxOf(182);return heal('ligament',2,'ctrl',5).S[i]>heal('ligament',2,'ctrl',42).S[i];},explain:'Early, protected tension gives collagen a direction while it is being laid down. Timing matters: load before day 3 adds to inflammation, and waiting weeks loses that window.'},
    {lvl:'ap',instant:true,q:'A tendon carries 60% in tension. It repeats 100,000 times. Which change keeps it from failing?',choices:['Add recovery between sessions','Add more repetitions','Nothing can'],correct:0,base:{view:'forces',tissue:'tendon',force:'tension',load:60,reps:'100000'},set:{rest:true},
     check:s=>!forceState(s.p).failed,explain:'Recovery lets tissue repair and adapt, so the limit falls far less. Training is the same load with recovery, and overuse injury is the same load without it.'}
  ],
  onChallenge(sim,ch,phase){if(!ch)return;const base=Object.assign({rest:false,reps:'1',start:5},ch.base||{});BioLab.setValues(sim,phase==='done'?Object.assign(base,ch.set||{}):base);sync(sim);},
  narrate(sim){const p=sim.p;
    if(p.view==='forces'){const f=forceState(p),T=TN[p.tissue].toLowerCase();
      if(f.failed&&f.chronic)return '<b>'+f.name+'.</b> '+p.load+'% is under this '+T+'’s limit for one load ('+f.lim+'%), but '+f.n.toLocaleString('en-US')+' repeats lowered the limit to '+Math.round(f.eff)+'%. This is a chronic injury.';
      if(f.failed)return '<b>'+f.name+'.</b> '+p.force.charAt(0).toUpperCase()+p.force.slice(1)+' of '+p.load+'% is past this '+T+'’s limit of '+Math.round(f.eff)+'%. '+f.how;
      if(f.state==='Plastic')return 'At '+p.load+'% the '+T+' is past its elastic range. <b>Some fibers are damaged</b> and it won’t quite spring back, but it hasn’t failed. The limit here is '+Math.round(f.eff)+'%.';
      return 'At '+p.load+'% the '+T+' deforms and <b>springs back</b>. This is the elastic range, and it’s how healthy tissue handles normal loads. The limit here is '+Math.round(f.eff)+'%.';}
    if(p.view==='grades'){if(p.kind==='contusion')return p.bruise==='ecch'?'<b>Ecchymosis:</b> blood from broken capillaries spreads through the tissue and shows as skin discoloration, which can travel with gravity.':'<b>Hematoma:</b> blood collects in one pocket. It makes a firm, swollen lump, and pressure can limit motion.';
      if(p.kind==='catastrophic')return '<b>Catastrophic injury</b> means severe damage to the brain or spinal cord, with death or lasting disability possible. It calls for an emergency action plan and EMS, not an on-field fix.';
      const n=p.kind==='sprain'?'ligament':'muscle or tendon',G=GRADE[p.grade];return '<b>Grade '+['I','II','III'][p.grade-1]+' '+p.kind+' ('+n+').</b> '+G.a+' '+G.wb+'. '+G.rom+'. '+(p.grade===2&&p.kind==='sprain'?'The partial tear leaves some joint laxity.':'')+(p.grade===3&&p.kind==='strain'?'You can feel a palpable divot where the muscle tore.':'');}
    if(p.view==='healing'){const n=healNow(sim),ph=phaseOf(n.d);
      const tail=n.ev.length?' <b>'+n.ev.length+' reinjur'+(n.ev.length>1?'ies':'y')+' so far.</b>':'';
      if(ph[0]==='Inflammatory response'&&ph.length===1)return '<b>Inflammatory response.</b> Redness, heat, swelling, pain and loss of function protect the area while the body clears damage. Goal: decrease pain and swelling.'+tail;
      if(ph.includes('Repair and regeneration')&&!ph.includes('Remodeling and maturation'))return '<b>Repair and regeneration.</b> New collagen arrives disorganized'+(sim.p.rehab==='rest'?', and with no tension it stays that way.':sim.p.rehab==='ctrl'?', and controlled tension starts to line it up.':', and it can’t yet take this much load.')+' This is when people usually reinjure.'+tail;
      return '<b>'+ph.join(' and ')+'.</b> Collagen '+(n.A>.6?'is lining up with the load':'is still poorly aligned')+', and strength is at '+Math.round(n.S)+'% of uninjured.'+tail;}
    const s=sim.st;if(s.checked){const g=inPlace(s);return g===8?'<b>All 8 steps in order.</b> Each one sets up the next, from calming the tissue to returning to sport.':'<b>'+g+' of '+s.plan.length+' placed steps are in the right spot.</b> Read the hint, change your order and check again.';}
    return 'Build the plan in the order an athlete would need it. Ask of each step: <b>what has to be true first?</b>';},
  tour:[
    {title:'Three forces',text:'Tension pulls tissue apart, compression squeezes it, and shear slides one part across another. Every injury starts with one of these forces, or a mix.',focus:[0,0,800,520],speed:1,setup(sim){BioLab.setValues(sim,{view:'forces',tissue:'ligament',force:'tension',load:40,reps:'1',rest:false});sync(sim);}},
    {title:'Elastic, then damage',text:'Under a small load the ligament stretches and springs back. Past about half its limit, some fibers are damaged and it stops springing all the way back.',focus:[0,0,470,520],speed:1,setup(sim){BioLab.setValues(sim,{load:70});}},
    {title:'Failure: a sprain',text:'Pass the limit and fibers tear through. A tear in a ligament is a sprain. Muscle or tendon would be a strain.',focus:[0,0,470,520],speed:1,setup(sim){BioLab.setValues(sim,{load:110});}},
    {title:'Acute or chronic',text:'One big load causes an acute injury. A small load repeated without recovery lowers the limit until it fails too. In bone, that’s a stress fracture.',focus:[0,0,800,520],speed:1,setup(sim){BioLab.setValues(sim,{tissue:'bone',load:60,reps:'100000'});}},
    {title:'Inflammatory response',text:'The first 3 to 4 days. Redness, heat, swelling, pain and loss of function are the cardinal signs. Goal: decrease pain and swelling.',focus:[0,30,360,312],speed:1,setup(sim){BioLab.setValues(sim,{view:'healing',tissue:'ligament',grade:2,rehab:'ctrl',day:posOf(2),reps:'1'});sync(sim);}},
    {title:'Repair and regeneration',text:'From 3 days to 6 weeks. New collagen arrives in a tangle. It needs enough tension to line up, but too much tears it. This is when people usually reinjure.',focus:[0,30,360,312],speed:1,setup(sim){BioLab.setValues(sim,{day:posOf(21)});}},
    {title:'Too much too early',text:'Same injury and same day count, but full practice from week 1. Each time load passes the tissue’s strength, it tears again and loses ground. Look at the strength curve.',focus:[350,0,450,366],speed:1,setup(sim){BioLab.setValues(sim,{rehab:'early',day:posOf(42)});}},
    {title:'Remodeling and maturation',text:'From 4 weeks to 3 years. With controlled load, collagen slowly lines up and strength climbs. Without load, fibers stay disorganized. A healed ligament may never quite reach 100%.',focus:[350,0,450,366],speed:1,setup(sim){BioLab.setValues(sim,{rehab:'ctrl',day:posOf(365)});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{view:'forces',tissue:'ligament',force:'tension',load:60,reps:'1',rest:false,rehab:'ctrl',day:45,grade:2});sync(sim);},
  infoPanel(sim){const p=sim.p,s=sim.st;
    if(p.view==='forces'){const f=forceState(p);return '<h3>'+TN[p.tissue]+' in '+p.force+'</h3><p><b>If it fails:</b> '+(f.chronic?f.name:FAIL[p.tissue][p.force][0])+'. '+f.how+'</p><p><b>Example:</b> '+f.ex+'</p><p><b>Acute</b> injuries come from one event. <b>Chronic</b> injuries build over time from repeated load.</p>';}
    if(p.view==='grades'){if(p.kind==='contusion')return '<h3>Contusion</h3><p>A bruise: a direct blow (compression) breaks capillaries without breaking the skin.</p><p><b>Ecchymosis</b> is skin discoloration as blood spreads. <b>Hematoma</b> is a pocket of pooled blood.</p>';
      if(p.kind==='catastrophic')return '<h3>Catastrophic injury</h3><p>A severe injury to the brain or spinal cord during sport, which can cause death or lasting disability. Athletic trainers plan for these with an emergency action plan.</p><p class="help">Educational use only. Don’t self-diagnose. A suspected head or spine injury means calling EMS.</p>';
      const G=[1,2,3].map(g=>{const r=GRADE[g];return '<li'+(g===p.grade?' style="font-weight:700"':'')+'>Grade '+['I','II','III'][g-1]+': '+r.a+' '+r.wb+'. '+r.rom+'.</li>';}).join('');return '<h3>'+(p.kind==='sprain'?'Sprain: ligament':'Strain: muscle or tendon')+'</h3><ul>'+G+'</ul><p><b>Abbreviations:</b> WB weight bearing, NWB non weight bearing, ROM range of motion, WNL within normal limits.</p><p class="help">Educational use only. Don’t grade your own injury. An athletic trainer or doctor makes that call.</p>';}
    if(p.view==='healing'){const P=HEAL[p.tissue],n=healNow(sim);return '<h3>'+TN[p.tissue]+' rule</h3><p>'+P.rule+'</p><p><b>'+dayText(n.d)+', '+REHAB[p.rehab].toLowerCase()+':</b> strength '+Math.round(n.S)+'% of uninjured.</p><ul><li><b>Inflammatory response:</b> 3 to 4 days</li><li><b>Repair and regeneration:</b> 3 days to 6 weeks</li><li><b>Remodeling and maturation:</b> 4 weeks to 3 years</li></ul>';}
    const left=STEPS.map((x,i)=>i).filter(i=>!s.plan.includes(i)).sort((a,b)=>shuffled().indexOf(a)-shuffled().indexOf(b));
    let h='<h3>Build the rehab plan</h3>';
    if(left.length)h+='<p>Add the step that comes next:</p><div class="row" style="flex-wrap:wrap;gap:6px">'+left.map(i=>'<button type="button" class="btn" data-add="'+i+'">'+STEPS[i].full+'</button>').join('')+'</div>';
    if(s.plan.length)h+='<p style="margin-top:10px"><b>Your plan:</b></p><ol style="padding-left:20px">'+s.plan.map((x,i)=>'<li style="margin-bottom:6px">'+STEPS[x].full+' <button type="button" class="btn" data-up="'+i+'"'+(i===0?' disabled':'')+' aria-label="Move '+STEPS[x].full+' earlier">Earlier</button> <button type="button" class="btn" data-dn="'+i+'"'+(i===s.plan.length-1?' disabled':'')+' aria-label="Move '+STEPS[x].full+' later">Later</button> <button type="button" class="btn" data-rm="'+i+'" aria-label="Remove '+STEPS[x].full+'">Remove</button></li>').join('')+'</ol>';
    if(s.checked){const g=inPlace(s),wrong=s.plan.findIndex((x,i)=>x!==i);
      if(s.plan.length<8)h+='<p><b>Keep going.</b> Add all 8 steps, then check again.</p>';
      else if(g===8)h+='<p><b>Every step is in order.</b> The steps can overlap in real life, but each one depends on the one before.</p><ol style="padding-left:20px">'+STEPS.map(x=>'<li><b>'+x.n+':</b> '+x.ex[p.cs]+'</li>').join('')+'</ol>';
      else h+='<p><b>'+g+' of 8 are in place.</b> Look at <b>'+STEPS[s.plan[wrong]].n+'</b>. '+STEPS[s.plan[wrong]].why+'</p>';}
    return h+'<p class="help">Educational use only. A real plan comes from an athletic trainer, doctor or physical therapist who has evaluated the athlete.</p>';},
  bindInfo(sim,el){const s=sim.st,done=()=>{s.checked=false;sim.infoDirty=true;BioLab.refresh(sim);};
    el.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>{s.plan.push(+b.dataset.add);done();}));
    el.querySelectorAll('[data-up]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.up;if(i>0){[s.plan[i-1],s.plan[i]]=[s.plan[i],s.plan[i-1]];done();}}));
    el.querySelectorAll('[data-dn]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.dn;if(i<s.plan.length-1){[s.plan[i+1],s.plan[i]]=[s.plan[i],s.plan[i+1]];done();}}));
    el.querySelectorAll('[data-rm]').forEach(b=>b.addEventListener('click',()=>{s.plan.splice(+b.dataset.rm,1);done();}));},
  onClick(sim,x,y){const p=sim.p,s=sim.st;
    if(p.view==='healing'){const G=PLOT;if(x>=G.x&&x<=G.x+G.w&&y>=G.y&&y<=G.y+G.h)BioLab.setValues(sim,{day:Math.round(clamp((x-G.x)/G.w,0,1)*200)/2});}
    if(p.view==='plan'&&x<400){const left=shuffled().filter(i=>!s.plan.includes(i)),i=Math.floor((y-60)/PLAN_H);if(i>=0&&i<left.length){s.plan.push(left[i]);s.checked=false;}}},
  lab:{bio:'<p><b>Question:</b> How does rehab choice change healing?</p><ol><li>Choose Healing, Ligament and Grade II.</li><li>For each rehab choice, read tissue strength at 1 week, 3 weeks, 6 weeks, 6 months and 1 year, using the time slider. Record a trial each time.</li></ol><p>When does each choice pull ahead or fall behind? Explain it using what collagen is doing in each phase.</p>',
    honors:'<p><b>Question:</b> Which force is each tissue built for?</p><ol><li>Choose Forces and Once. For each tissue, raise the load in each of the three forces until it fails. Record the load just before failure.</li><li>Choose Healing and Controlled load. Record strength at 6 weeks and 1 year for all four tissues.</li></ol><p>Match each tissue’s weakest force to a real injury. Which tissue heals slowest, and why?</p>',
    ap:'<p><b>Question:</b> How does when you start loading change the result, and how far can repeated loads go?</p><ol><li>In Healing, choose Tendon and Controlled load. Record strength at 6 months for start days of 1, 5, 14, 28 and 42.</li><li>In Forces, find the highest load a tendon can take 100,000 times, with and without recovery.</li></ol><p><b>Claim, evidence, reasoning:</b> Write the advice you’d give an athlete who wants to return early, using your data and the rules for that tissue.</p>'},
  terms:[{t:'Tension',d:'A pulling force that lengthens tissue.'},{t:'Compression',d:'A squeezing force that shortens tissue.'},{t:'Shear',d:'A force that slides one part of a tissue across another.'},{t:'Acute injury',d:'An injury from one event.'},{t:'Chronic injury',d:'An injury that builds over time from repeated load.'},{t:'Sprain',d:'A stretch or tear of a ligament.'},{t:'Strain',d:'A stretch or tear of a muscle or tendon.'},{t:'Contusion',d:'A bruise from a direct blow.'},{t:'Ecchymosis',d:'Skin discoloration from blood spreading under the skin.'},{t:'Hematoma',d:'A pocket of pooled blood in the tissue.'},{t:'Catastrophic injury',d:'A severe injury to the brain or spinal cord, which can cause death or lasting disability.'},{t:'Antalgic gait',d:'A limp that avoids pain, with less time spent on the sore leg.'},{t:'Laxity',d:'Looseness in a joint.'},{t:'WB, NWB',d:'Weight bearing, non weight bearing.'},{t:'ROM, WNL',d:'Range of motion, within normal limits.'},{t:'Collagen',d:'The rope-like protein that gives tissues their tensile strength.'},
    {lvl:'honors',t:'Elastic range',d:'Loads the tissue fully springs back from.'},{lvl:'honors',t:'Plastic range',d:'Loads that leave lasting damage, even with no complete tear.'},{lvl:'honors',t:'Cardinal signs',d:'Redness, heat, swelling, pain and loss of function.'},{lvl:'ap',t:'Remodeling',d:'Slow reorganization of collagen along the lines of load.'},{lvl:'ap',t:'Fatigue failure',d:'Failure below the one-time limit, from repeated loads.'}],
  about:'<p><b>Forces.</b> Limits are given as a percent of each tissue’s tensile strength. Bone’s ratios come from measurements on human cortical bone (Reilly and Burstein, 1975: compression about 1.5 times tension, shear about half of tension). The numbers for ligament, tendon and muscle in compression and shear are teaching estimates chosen to show which force each tissue handles badly. Real injuries mix forces. The elastic range is set at half the limit for all tissues. Repeated load lowers the limit 9% per tenfold increase in repetitions, like fatigue curves for bone, or 4% with recovery.</p><p><b>Healing.</b> Phase dates come from the course notes. Strength curves are a teaching model, not patient data: collagen builds at a rate set by tissue (muscle fastest, ligament slowest), alignment grows under load, strength depends on both, and each tissue has a ceiling (bone 100%, muscle 90%, tendon 80%, ligament 70%). Too much too early means a load of 62% of normal strength from day 7. It tears the tissue whenever strength is lower, and after each reinjury the athlete rests 10 days and returns to less load. Waiting past day 5 to start controlled load slows alignment, standing in for scar tissue that sets without a direction. Rest only holds the tissue unloaded the entire time, which no real athlete does for 3 years. Bone healing is simplified: real bone goes through a callus stage and doesn’t form a scar.</p><p><b>Grades</b> follow the course notes. Real injuries fall on a range, and many clinicians grade differently.</p><p><b>Educational use only.</b> This tool doesn’t diagnose or treat anyone. Don’t use it to grade your own injury. See an athletic trainer or doctor.</p>',
  initVis(sim){const r=rng(41),v=sim.vis;v.fib=[];for(let i=0;i<54;i++)v.fib.push({x:r(),y:r(),a:(r()-.5)*2,l:.7+r()*.5,b:r()*.8+.1,w:r()});v.drops=[];for(let i=0;i<26;i++)v.drops.push([r(),r(),r()*6.3]);v.lines=[];for(let i=0;i<13;i++)v.lines.push(r());},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,520);const v=sim.p.view;if(v==='forces')drawForces(sim,ctx,k,t);else if(v==='grades')drawGrades(sim,ctx,k,t);else if(v==='healing')drawHealing(sim,ctx,k,t);else drawPlan(sim,ctx,k);},
  thumbSetup(sim){BioLab.setValues(sim,{view:'healing',rehab:'early',day:55});}
};

/* ---------- text helpers ---------- */
function wrap(ctx,s,x,y,mw,lh,o){o=o||{};ctx.font=(o.w||400)+' '+(o.s||13)+'px '+FONT;const words=s.split(' ');let line='',yy=y,n=0;const flush=()=>{txt(ctx,line,x,yy,o);yy+=lh;n++;};
  words.forEach(w=>{const tr=line?line+' '+w:w;ctx.font=(o.w||400)+' '+(o.s||13)+'px '+FONT;if(ctx.measureText(tr).width>mw&&line){flush();line=w;}else line=tr;});if(line)flush();return yy;}
function arrow(ctx,x0,y0,x1,y1,c,w){const a=Math.atan2(y1-y0,x1-x0),L=Math.max(7,w*2.6);ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=w;ctx.lineCap='butt';ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1-Math.cos(a)*L*.7,y1-Math.sin(a)*L*.7);ctx.stroke();ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1-Math.cos(a-.5)*L,y1-Math.sin(a-.5)*L);ctx.lineTo(x1-Math.cos(a+.5)*L,y1-Math.sin(a+.5)*L);ctx.closePath();ctx.fill();}
function card(ctx,x,y,w,h){ctx.fillStyle=PAL['card'];rr(ctx,x,y,w,h,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}

/* ---------- Forces view ---------- */
function drawForces(sim,ctx,k,t){const p=sim.p,f=forceState(p),v=sim.vis,cx=235,cy=190,W=250,H=96,r=f.ratio,col=TCOL[p.tissue],mag=clamp(p.load/200,0,1),jit=(f.n>1&&!RM)?Math.sin(t*9)*.05:0,amt=clamp(r,0,1.15)*(1+jit);
  txt(ctx,TN[p.tissue]+' under '+p.force,16,18+7*k,{s:14*k,w:800});
  const stretch=p.force==='tension'?amt*.2:0,squash=p.force==='compression'?amt*.28:0,sh=p.force==='shear'?amt*44:0,w2=W*(1+stretch-squash),h2=H*(1-stretch*.55+squash*.8),l=cx-w2/2,top=cy-h2/2;
  const quad=(xa,xb,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(xa+sh*.5,top);ctx.lineTo(xb+sh*.5,top);ctx.lineTo(xb-sh*.5,top+h2);ctx.lineTo(xa-sh*.5,top+h2);ctx.closePath();ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();};
  const gap=f.failed?(p.force==='tension'?26:0):0;
  if(f.failed&&p.force==='tension'){quad(l-gap/2,cx-gap/2,col);quad(cx+gap/2,l+w2+gap/2,col);}else if(f.failed&&p.force==='shear'){ctx.save();ctx.translate(0,-3);ctx.beginPath();ctx.rect(0,0,800,cy);ctx.clip();ctx.translate(18,0);quad(l,l+w2,col);ctx.restore();ctx.save();ctx.translate(0,3);ctx.beginPath();ctx.rect(0,cy,800,300);ctx.clip();ctx.translate(-18,0);quad(l,l+w2,col);ctx.restore();}else quad(l,l+w2,col);
  // fibers
  ctx.lineWidth=2;const cut=f.failed&&p.force==='tension';v.lines.forEach((a,i)=>{const yy=top+(i+.8)*h2/14,sx=sh*(.5-(yy-top)/h2),wav=(p.force==='compression'?amt*5:0)*(f.failed?1.6:1)+(p.force==='tension'?0:.5);
    const brk=!f.failed&&a<clamp(r-.5,0,.5)*1.4,bu=.3+a*.4;ctx.strokeStyle=brk?'#ffd9a0':'rgba(255,255,255,.6)';ctx.beginPath();const segs=24;let pen=false;for(let j=0;j<=segs;j++){const u=j/segs,x=l+u*w2+sx+(cut?(u<.5?-gap/2:gap/2):0),y=yy+Math.sin(u*14+a*9)*wav;if((brk&&Math.abs(u-bu)<.05)||(cut&&Math.abs(u-.5)<.03)){pen=false;continue;}if(!pen){ctx.moveTo(x,y);pen=true;}else ctx.lineTo(x,y);}ctx.stroke();});
  if(f.failed&&(p.tissue==='muscle'||p.force==='compression')){ctx.fillStyle='rgba(150,20,40,.7)';v.drops.slice(0,16).forEach(d=>{ctx.beginPath();ctx.arc(l+d[0]*w2,top+d[1]*h2,3.2,0,6.29);ctx.fill();});}
  // arrows
  const ac=f.failed?PAL['s1']:PAL['s2'],aw=3+mag*5,len=30+mag*48;
  if(p.force==='tension'){arrow(ctx,l-gap/2-6,cy,l-gap/2-6-len,cy,ac,aw);arrow(ctx,l+w2+gap/2+6,cy,l+w2+gap/2+6+len,cy,ac,aw);}
  else if(p.force==='compression'){arrow(ctx,l-8-len,cy,l-8,cy,ac,aw);arrow(ctx,l+w2+8+len,cy,l+w2+8,cy,ac,aw);}
  else{arrow(ctx,cx-w2/3,top-8-len*.8,cx-w2/3+len,top-8-len*.8,ac,aw);arrow(ctx,cx+w2/3,top+h2+8+len*.8,cx+w2/3-len,top+h2+8+len*.8,ac,aw);}
  // load bar: elastic, plastic, failure
  const bx=24,by=366,bw=420,bh=22,lim=f.eff,X=v=>bx+clamp(v/200,0,1)*bw;
  txt(ctx,'Load '+p.load+'%, limit '+Math.round(lim)+'%',bx,by-14-(k-1)*4,{s:13*k,w:700});
  ctx.fillStyle=PAL['s3'];ctx.fillRect(bx,by,X(lim*.5)-bx,bh);ctx.fillStyle=PAL['s4'];ctx.fillRect(X(lim*.5),by,X(lim)-X(lim*.5),bh);ctx.fillStyle=PAL['s1'];ctx.fillRect(X(lim),by,bx+bw-X(lim),bh);
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(X(p.load),by-6);ctx.lineTo(X(p.load),by+bh+6);ctx.stroke();
  const zy=by+bh+10+7*k;ctx.textBaseline='alphabetic';txt(ctx,'Elastic',bx,zy,{s:12*k,c:PAL['s3'],w:700});ctx.font='700 '+12*k+'px '+FONT;const eW=ctx.measureText('Elastic').width,pW=ctx.measureText('Plastic').width;txt(ctx,'Plastic',Math.max(X(lim*.75),bx+eW+10+pW/2),zy,{s:12*k,c:PAL['s4'],w:700,a:'center'});txt(ctx,'Failure',bx+bw,zy,{s:12*k,c:PAL['s1'],w:700,a:'right'});
  if(f.n>1){txt(ctx,f.n.toLocaleString('en-US')+' repeats'+(p.rest?', with recovery':', no recovery'),bx,zy+22*k,{s:12*k,c:PAL['cv-soft']});}
  // result card
  const cxx=470,cw=316;card(ctx,cxx,14,cw,492);const tc=cxx+14,mw=cw-28;let y=44;
  const stateTxt=f.failed?(f.chronic?'Chronic failure':'Acute failure'):f.state==='Plastic'?'Plastic range':'Elastic range';pill(ctx,stateTxt,tc+Math.min(mw/2,(stateTxt.length*6.4*k+14)/2+4),y,f.failed?PAL['s1']:f.state==='Plastic'?PAL['s4']:PAL['s3'],f.state==='Plastic'&&!f.failed?'#1c1c1f':'#fff',12.5*k);y+=26+12*k;
  y=wrap(ctx,f.failed?f.name:(f.state==='Plastic'?'Some fibers damaged':'Springs back'),tc,y,mw,18*k,{s:15*k,w:800});y+=4;
  y=wrap(ctx,f.failed?f.how:(f.state==='Plastic'?'Past the elastic range. Lasting stretch, no complete tear.':'Normal load. The tissue returns to its shape.'),tc,y,mw,16*k,{s:12.5*k,c:PAL['cv-soft']});y+=8;
  if(f.failed)y=wrap(ctx,'Example: '+f.ex,tc,y,mw,16*k,{s:12.5*k});
  const rows=['tension','compression','shear'],rh=20*k+6,gy=506-14-rows.length*rh;if(y<gy-14*k-10){txt(ctx,TN[p.tissue]+' limits, one load',tc,gy-10,{s:12*k,w:700,c:PAL['cv-soft']});rows.forEach((fo,i)=>{const yy=gy+i*rh,L=LIMIT[p.tissue][fo],on=fo===p.force;txt(ctx,fo.charAt(0).toUpperCase()+fo.slice(1)+' '+L+'%',tc,yy+8*k,{s:12*k,w:on?800:400});ctx.fillStyle=PAL['card2'];rr(ctx,tc,yy+12*k,mw,7,3);ctx.fill();ctx.fillStyle=on?PAL['s2']:PAL['cv-soft'];rr(ctx,tc,yy+12*k,Math.max(4,L/200*mw),7,3);ctx.fill();});}
}

/* ---------- Grades view ---------- */
function drawGrades(sim,ctx,k,t){const p=sim.p;if(p.kind==='contusion')return drawContusion(sim,ctx,k);if(p.kind==='catastrophic')return drawCata(sim,ctx,k);
  const G=GRADE[p.grade],spr=p.kind==='sprain',v=sim.vis,L=30,R=450,cy=210,tn=['I','II','III'][p.grade-1];txt(ctx,'Grade '+tn+' '+p.kind,16,18+7*k,{s:14*k,w:800});
  const sw=[0,.35,.9][p.grade-1];if(sw>0){const g=ctx.createRadialGradient(240,cy,20,240,cy,120+sw*70);g.addColorStop(0,'rgba(210,60,60,'+(.35*sw)+')');g.addColorStop(1,'rgba(210,60,60,0)');ctx.fillStyle=g;ctx.fillRect(0,50,480,340);}
  const fib=14,gap=p.grade===3?(spr?46:50):0;
  if(spr){ctx.fillStyle=TCOL.bone;rr(ctx,L,cy-52,130,104,18);ctx.fill();rr(ctx,R-130,cy-52,130,104,18);ctx.fill();txt(ctx,'Bone',L+58,cy,{s:13*k,w:800,c:'#1c1c1f',a:'center',b:'middle'});txt(ctx,'Bone',R-60,cy,{s:13*k,w:800,c:'#1c1c1f',a:'center',b:'middle'});
    const x0=L+120,x1=R-120,bh=56;ctx.fillStyle=TCOL.ligament;ctx.globalAlpha=.35;if(p.grade<3)ctx.fillRect(x0,cy-bh/2,x1-x0,bh);ctx.globalAlpha=1;
    for(let i=0;i<fib;i++){const y=cy-bh/2+(i+.5)*bh/fib,a=v.lines[i%13],torn=a<G.torn||p.grade===3;const m=(x0+x1)/2+(a-.5)*30;ctx.strokeStyle=torn?PAL['s1']:(p.grade===1?PAL['s4']:'#7ea3c2');ctx.lineWidth=3;ctx.beginPath();if(torn){ctx.moveTo(x0,y);ctx.lineTo(m-gap*.5-4,y+(a-.5)*14);ctx.moveTo(m+gap*.5+4,y-(a-.5)*14);ctx.lineTo(x1,y);}else if(p.grade===1){ctx.moveTo(x0,y);for(let u=0;u<=1;u+=.08)ctx.lineTo(x0+u*(x1-x0),y+Math.sin(u*9)*1.6);}else{ctx.moveTo(x0,y);ctx.lineTo(x1,y);}ctx.stroke();}
    txt(ctx,'Ligament',(x0+x1)/2,cy-bh/2-14,{s:13*k,w:800,a:'center'});
    if(p.grade>=2){const push=p.grade===2?10:24;arrow(ctx,R-65,cy+78,R-65+push+24,cy+78,PAL['s1'],4);txt(ctx,p.grade===2?'Joint laxity':'Joint unstable',R-20,cy+108,{s:13*k,w:700,c:PAL['s1'],a:'right'});}
  }else{const mid=(L+R)/2+20,bh=110;ctx.fillStyle=TCOL.tendon;ctx.fillRect(L,cy-14,70,28);ctx.fillRect(R-70,cy-14,70,28);
    const x0=L+60,x1=R-60,bl=(x0+x1)/2;
    const belly=(a,b)=>{ctx.fillStyle=TCOL.muscle;ctx.beginPath();const n=24;for(let i=0;i<=n;i++){const u=i/n,xx=lerp(a,b,u),glob=Math.sin((xx-x0)/(x1-x0)*Math.PI);i?ctx.lineTo(xx,cy-glob*bh/2):ctx.moveTo(xx,cy-glob*bh/2);}for(let i=n;i>=0;i--){const u=i/n,xx=lerp(a,b,u),glob=Math.sin((xx-x0)/(x1-x0)*Math.PI);ctx.lineTo(xx,cy+glob*bh/2);}ctx.closePath();ctx.fill();};
    if(p.grade===3){belly(x0,mid-gap/2);belly(mid+gap/2,x1);}else belly(x0,x1);
    for(let i=0;i<fib;i++){const f=(i+.5)/fib-.5,a=v.lines[i%13],torn=a<G.torn;ctx.strokeStyle=torn?'#ffd9a0':'rgba(255,255,255,.5)';ctx.lineWidth=2;ctx.beginPath();const n=24;let pen=false;for(let j=0;j<=n;j++){const u=j/n,xx=lerp(x0+6,x1-6,u),glob=Math.sin((xx-x0)/(x1-x0)*Math.PI),yy=cy+f*glob*bh,ga=p.grade===3?Math.abs(xx-mid)<gap/2+3:torn&&Math.abs(xx-mid-(a-.5)*30)<10;if(ga){pen=false;continue;}if(!pen){ctx.moveTo(xx,yy);pen=true;}else ctx.lineTo(xx,yy);}ctx.stroke();}
    txt(ctx,'Muscle',bl-90,cy-bh/2-12,{s:13*k,w:800,a:'center'});txt(ctx,'Tendon',L+34,cy+44,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});txt(ctx,'Tendon',R-34,cy+44,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});
    if(p.grade===3){txt(ctx,'Palpable divot',mid,cy+bh/2+36,{s:13*k,w:700,c:PAL['s1'],a:'center'});ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(mid,cy+18);ctx.lineTo(mid,cy+bh/2+16);ctx.stroke();ctx.setLineDash([]);}
  }
  const cx0=480,cw=306,nR=4+((spr&&p.grade===2)||(!spr&&p.grade===3)?1:0);card(ctx,cx0,14,cw,Math.min(492,44+nR*44*k));const x=cx0+14,mw=cw-28;let y=30+12*k;
  const row=(a,b,c)=>{y=wrap(ctx,a,x,y,mw,15*k,{s:12*k,c:PAL['cv-soft'],w:700});y=wrap(ctx,b,x,y,mw,17*k,{s:13.5*k,w:700,c:c||PAL['cv-ink']});y+=8*k;};
  row('What happened',G.a);row('Weight bearing',G.wb,p.grade===3?PAL['s1']:undefined);row('Motion and strength',G.rom);row('Swelling',G.sw);
  if(spr&&p.grade===2)row('Joint','Joint laxity',PAL['s1']);if(!spr&&p.grade===3)row('Feel','Palpable divot',PAL['s1']);
}
function drawContusion(sim,ctx,k){const p=sim.p,v=sim.vis,he=p.bruise==='hema',L=20,R=460;txt(ctx,he?'Hematoma':'Ecchymosis',16,18+7*k,{s:14*k,w:800});
  ctx.fillStyle='#d9a27a';ctx.fillRect(L,120,R-L,30);ctx.fillStyle=TCOL.muscle;ctx.fillRect(L,150,R-L,120);ctx.fillStyle=TCOL.bone;ctx.fillRect(L,270,R-L,70);
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;for(let y=160;y<266;y+=14){ctx.beginPath();ctx.moveTo(L+8,y);ctx.lineTo(R-8,y);ctx.stroke();}
  txt(ctx,'Skin',L+10,135,{s:13*k,w:800,c:'#1c1c1f',b:'middle'});txt(ctx,'Muscle',L+10,210,{s:13*k,w:800,c:'#fff',b:'middle'});txt(ctx,'Bone',L+10,305,{s:13*k,w:800,c:'#1c1c1f',b:'middle'});
  arrow(ctx,240,50+10*k,240,112,PAL['s1'],7);txt(ctx,'Direct blow',255,62+10*k,{s:13*k,w:700,c:PAL['s1']});
  if(he){ctx.fillStyle='rgba(95,15,40,.92)';ctx.beginPath();ctx.ellipse(240,205,74,44,0,0,6.29);ctx.fill();txt(ctx,'Pooled blood',240,205,{s:13*k,w:800,c:'#fff',a:'center',b:'middle'});}
  else{ctx.fillStyle='rgba(95,25,110,.55)';ctx.beginPath();ctx.ellipse(240,135,150,15,0,0,6.29);ctx.fill();ctx.fillStyle='rgba(110,20,60,.75)';v.drops.forEach(d=>{const x=240+(d[0]-.5)*240,y=155+d[1]*80;ctx.beginPath();ctx.arc(x,y,3.2,0,6.29);ctx.fill();});txt(ctx,'Skin discoloration',240,108,{s:13*k,w:700,a:'center',c:PAL['cv-ink']});}
  const cx0=480,cw=306;card(ctx,cx0,14,cw,Math.min(492,60+150*k));let y=30+12*k;y=wrap(ctx,he?'A hematoma is a pocket of blood that collects in one place.':'Ecchymosis is the purple and yellow skin discoloration you see as blood spreads.',cx0+14,y,cw-28,18*k,{s:13.5*k,w:700});y+=10;
  wrap(ctx,'Both come from a contusion: compression breaks capillaries, and the skin stays intact.',cx0+14,y,cw-28,17*k,{s:12.5*k,c:PAL['cv-soft']});}
function drawCata(sim,ctx,k){const o={cx:190,top:48,h:440};txt(ctx,'Catastrophic injury',16,18+7*k,{s:14*k,w:800});BioLab.body.draw(ctx,Object.assign({},o,{view:'back'}));const hd=BioLab.body.at('head',o),a=BioLab.body.at('spineC',o),b=BioLab.body.at('sacrum',o);ctx.fillStyle=PAL['s1'];ctx.globalAlpha=.75;ctx.beginPath();ctx.ellipse(hd.x,hd.y-6,22,24,0,0,6.29);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['s1'];ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y-22);ctx.stroke();
  const cx0=400,cw=386;card(ctx,cx0,14,cw,Math.min(492,60+150*k));let y=30+12*k;y=wrap(ctx,'Severe injury to the brain or spinal cord',cx0+14,y,cw-28,19*k,{s:14.5*k,w:800});y+=8;y=wrap(ctx,'It can cause death or lasting disability.',cx0+14,y,cw-28,17*k,{s:13*k});y+=8;y=wrap(ctx,'The response is an emergency action plan and EMS, decided before the season starts.',cx0+14,y,cw-28,17*k,{s:13*k,c:PAL['cv-soft']});}

/* ---------- Healing view ---------- */
const PLOT={x:400,y:92,w:380,h:222};
function drawHealing(sim,ctx,k,t){const p=sim.p,v=sim.vis,n=healNow(sim),d=n.d,ph=phaseOf(d);
  // tissue window
  const X=14,Y=44,W=340,H=290;txt(ctx,TN[p.tissue]+', '+dayText(d),16,18+7*k,{s:14*k,w:800});
  ctx.save();rr(ctx,X,Y,W,H,10);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.clip();
  const sw=clamp(1.15-d/5,0,1);if(sw>0){ctx.fillStyle='rgba(215,60,60,'+(.28*sw)+')';ctx.fillRect(X,Y,W,H);ctx.fillStyle='rgba(190,30,50,.75)';v.drops.slice(0,Math.round(sw*26)).forEach(q=>{const j=RM?0:Math.sin(t*2+q[2])*3;ctx.beginPath();ctx.arc(X+q[0]*W,Y+q[1]*H+j,4,0,6.29);ctx.fill();});}
  const nF=Math.round(n.C*v.fib.length),spread=(1-n.A);const tear=n.ev.length&&d-n.ev[n.ev.length-1]<7;
  ctx.lineCap='round';v.fib.slice(0,nF).forEach((f,i)=>{const cx=X+22+f.x*(W-44),cy=Y+18+f.y*(H-36),a=f.a*spread*1.5,len=38*f.l;ctx.strokeStyle=f.w<.5?PAL['cv-head']:PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();const brk=tear&&f.b<.6,dx=Math.cos(a)*len,dy=Math.sin(a)*len;if(brk){ctx.strokeStyle=PAL['s1'];ctx.moveTo(cx-dx,cy-dy);ctx.lineTo(cx-dx*.25,cy-dy*.25);ctx.moveTo(cx+dx*.25,cy+dy*.25);ctx.lineTo(cx+dx,cy+dy);}else{ctx.moveTo(cx-dx,cy-dy);ctx.lineTo(cx+dx,cy+dy);}ctx.stroke();});
  ctx.restore();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,X,Y,W,H,10);ctx.stroke();
  const loaded=p.rehab==='ctrl'?d>=p.start:p.rehab==='early'?d>=7:false;
  if(loaded&&!tear){const c=p.rehab==='early'?PAL['s1']:PAL['s3'],w=p.rehab==='early'?7:4;arrow(ctx,X+40,Y+H-18,X+6,Y+H-18,c,w);arrow(ctx,X+W-40,Y+H-18,X+W-6,Y+H-18,c,w);pill(ctx,p.rehab==='early'?'Heavy load':'Controlled load',X+W/2,Y+H-18-(k-1)*6,PAL['card'],PAL['cv-ink'],12*k);}
  if(tear)pill(ctx,'Tore again on day '+Math.round(n.ev[n.ev.length-1]),X+W/2,Y+20*Math.max(1,k*.8),PAL['s1'],'#fff',12.5*k);
  else if(nF<3)txt(ctx,d<3?'Clearing damage':'',X+W/2,Y+H/2,{s:12.5*k,c:PAL['cv-ink'],a:'center',w:700});else pill(ctx,'New collagen fibers',X+W/2,Y+20*Math.max(1,k*.8),PAL['card'],PAL['cv-ink'],12*k);
  // phase bars + plot
  const G=PLOT,lx=dd=>G.x+G.w*Math.log(dd+1)/Math.log(MAXD+1),rh=11*k,by0=14;
  const bars=[['Inflammatory response',0,4,PAL['s1']],['Repair and regeneration',3,42,PAL['s4']],['Remodeling and maturation',28,1095,PAL['s3']]];
  const gy=by0+bars.length*(rh+2)+6;const pl={x:G.x,y:Math.max(gy,G.y),w:G.w,h:G.y+G.h-Math.max(gy,G.y)};
  bars.forEach((b,i)=>{const y=by0+i*(rh+2),x0=lx(b[1]),x1=lx(b[2]);ctx.fillStyle=b[3];ctx.globalAlpha=ph.includes(b[0])?1:.45;rr(ctx,x0,y,x1-x0,rh,3);ctx.fill();ctx.globalAlpha=1;
    const nm=k>1.3?b[0].split(' ')[0]:b[0];if(i===2)txt(ctx,nm,x0-5,y+rh/2+.5,{s:Math.max(12,10*k),w:700,a:'right',b:'middle'});else txt(ctx,nm,x1+5,y+rh/2+.5,{s:Math.max(12,10*k),w:700,b:'middle'});});
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;[0,50,100].forEach(s=>{const y=pl.y+pl.h*(1-s/100);ctx.beginPath();ctx.moveTo(pl.x,y);ctx.lineTo(pl.x+pl.w,y);ctx.stroke();txt(ctx,s+'%',pl.x-5,y,{s:12*k,a:'right',b:'middle',c:PAL['cv-soft']});});
  [[1,'1 d'],[7,'1 wk'],[42,'6 wk'],[182,'6 mo'],[1095,'3 y']].forEach(([dd,l],i)=>{const x=lx(dd);ctx.strokeStyle=PAL['line'];ctx.beginPath();ctx.moveTo(x,pl.y);ctx.lineTo(x,pl.y+pl.h);ctx.stroke();txt(ctx,l,x,pl.y+pl.h+4,{s:12*k,c:PAL['cv-soft'],a:i===4?'right':'center',b:'top'});});
  const curves=[['rest',PAL['s2'],[8,6]],['early',PAL['s1'],[2,4]],['ctrl',PAL['s3'],[]]].map(c=>({c}));
  curves.forEach(({c})=>{const h=heal(p.tissue,p.grade,c[0],p.start),sel=c[0]===p.rehab;ctx.strokeStyle=c[1];ctx.lineWidth=sel?3.5:1.8;ctx.setLineDash(c[2]);ctx.globalAlpha=sel?1:.7;ctx.beginPath();DAYS.forEach((dd,i)=>{if(i%2&&dd<120)return;const x=lx(dd),y=pl.y+pl.h*(1-h.S[i]/100);(i?ctx.lineTo(x,y):ctx.moveTo(x,y));});ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;});
  const mx=lx(d),my=pl.y+pl.h*(1-n.S/100);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(mx,pl.y);ctx.lineTo(mx,pl.y+pl.h);ctx.stroke();ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(mx,my,6,0,6.29);ctx.fill();
  n.ev.forEach(e=>{const x=lx(e),i=idxOf(e),y=pl.y+pl.h*(1-n.h.S[i]/100);ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-4,y-4);ctx.lineTo(x+4,y+4);ctx.moveTo(x+4,y-4);ctx.lineTo(x-4,y+4);ctx.stroke();});
  // legend, in one row under the axis, with line style as well as color
  let ly=pl.y+pl.h+12+14*k,lxx=G.x;[['Controlled',PAL['s3'],[]],['Rest',PAL['s2'],[8,6]],['Too early',PAL['s1'],[2,4]]].forEach(c=>{ctx.strokeStyle=c[1];ctx.lineWidth=3;ctx.setLineDash(c[2]);ctx.beginPath();ctx.moveTo(lxx,ly);ctx.lineTo(lxx+24,ly);ctx.stroke();ctx.setLineDash([]);ctx.font='400 '+12*k+'px '+FONT;txt(ctx,c[0],lxx+28,ly,{s:12*k,b:'middle'});lxx+=38+ctx.measureText(c[0]).width;});
  // lower message
  const P=HEAL[p.tissue],bY=Math.max(ly+14*k,312);card(ctx,14,bY,772,520-bY-10);let y=bY+10+11*k;y=wrap(ctx,(ph.length>1?ph.map(x=>x.split(' ')[0]).join(' and ')+' overlap':ph[0])+': '+Math.round(n.S)+'% strength',28,y,744,17*k,{s:14*k,w:800});y+=2;
  const goal=ph[0]==='Inflammatory response'?'Goal: decrease pain and swelling.':ph.includes('Repair and regeneration')?'Tissue needs sufficient tension. This is usually when people reinjure.':'Collagen slowly matures along the lines of load, for up to 3 years.';
  y=wrap(ctx,goal,28,y,744,16*k,{s:12.5*k});y+=2;if(y<510-32*k)wrap(ctx,P.rule,28,y,744,16*k,{s:12.5*k,c:PAL['cv-soft']});
}

/* ---------- Rehab plan view ---------- */
const PLAN_H=52;
function drawPlan(sim,ctx,k){const s=sim.st,left=shuffled().filter(i=>!s.plan.includes(i)),g=s.checked&&s.plan.length===8,th=Math.min(PLAN_H-8,Math.max(36,22*k));
  txt(ctx,'Steps to place',18,34,{s:14*k,w:800});txt(ctx,'Your plan',412,34,{s:14*k,w:800});
  left.forEach((i,n)=>{const y=60+n*PLAN_H;ctx.fillStyle=PAL['card'];rr(ctx,16,y,370,th,8);ctx.fill();ctx.strokeStyle=PAL['s2'];ctx.lineWidth=1.5;ctx.stroke();txt(ctx,STEPS[i].n,30,y+th/2,{s:13*k,w:700,b:'middle'});});
  for(let n=0;n<8;n++){const y=60+n*PLAN_H,it=s.plan[n];ctx.lineWidth=1.5;if(it===undefined){ctx.strokeStyle=PAL['line'];ctx.setLineDash([5,4]);rr(ctx,410,y,374,th,8);ctx.stroke();ctx.setLineDash([]);txt(ctx,String(n+1),426,y+th/2,{s:13*k,w:700,c:PAL['cv-soft'],b:'middle'});continue;}
    const right=s.checked&&it===n,wrong=s.checked&&it!==n;ctx.fillStyle=right?'#1b7a43':PAL['card'];rr(ctx,410,y,374,th,8);ctx.fill();ctx.strokeStyle=wrong?PAL['s4']:right?PAL['s3']:PAL['cv-soft'];ctx.stroke();txt(ctx,(n+1)+'  '+STEPS[it].n,424,y+th/2,{s:13*k,w:700,b:'middle',c:right?'#fff':PAL['cv-ink']});if(right)txt(ctx,'✓',768,y+th/2,{s:13*k,w:800,c:'#fff',a:'right',b:'middle'});}
  txt(ctx,left.length?'Tap a step, or use the buttons below the stage':(g&&inPlace(s)===8?'Every step in order':'All placed. Check your order.'),18,506,{s:12*k,c:PAL['cv-soft'],b:'middle'});}

BioLab.injuryModel={forceState,heal,idxOf,posOf,LIMIT};
BioLab.register(SIM);
})();
