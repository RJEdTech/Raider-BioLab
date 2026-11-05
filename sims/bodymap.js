(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT}=BioLab.h;

/* Body map. Every statement comes from one coordinate table, so practice answers and challenge answers are computed, not typed.
   Coordinates are fractions of body height, in anatomical position:
   x: + toward the body's left (viewer's right on a front view); y: 0 at the top of the head, 1 at the sole; z: + anterior. */
const W=800,H=600;
const LM={
  nose:{n:'nose',x:0,y:.06,z:.062,reg:'head'},
  eye:{n:'eyes',pl:1,x:.022,y:.052,z:.045,both:1,reg:'head'},
  ear:{n:'ears',pl:1,x:.056,y:.058,z:0,both:1,reg:'head'},
  chin:{n:'chin',x:0,y:.105,z:.04,reg:'head'},
  brain:{n:'brain',x:0,y:.035,z:0,lvl:'honors',reg:'head'},
  skull:{n:'skull',x:0,y:.006,z:0,lvl:'honors',reg:'head'},
  sternum:{n:'sternum',x:0,y:.205,z:.058},
  heart:{n:'heart',x:.018,y:.21,z:.025,side:'L'},
  esophagus:{n:'esophagus',x:0,y:.205,z:-.01},
  spinalcord:{n:'spinal cord',x:0,y:.22,z:-.045},
  lungs:{n:'lungs',pl:1,x:.058,y:.2,z:.005,both:1,lvl:'honors'},
  ribs:{n:'ribs',pl:1,x:.095,y:.225,z:.03,both:1,lvl:'honors'},
  liver:{n:'liver',x:-.045,y:.285,z:.022,side:'R',lvl:'honors'},
  stomach:{n:'stomach',x:.04,y:.295,z:.03,side:'L'},
  kidneys:{n:'kidneys',pl:1,x:.04,y:.325,z:-.035,both:1},
  navel:{n:'navel',x:0,y:.335,z:.062},
  bladder:{n:'urinary bladder',x:0,y:.445,z:.035,lvl:'honors'},
  skinchest:{n:'skin of the chest',x:0,y:.2,z:.08,lvl:'honors'},
  skinback:{n:'skin of the back',x:0,y:.222,z:-.072,lvl:'ap'},
  vertebra:{n:'vertebra',x:0,y:.222,z:-.045,lvl:'ap'},
  shoulder:{n:'shoulder',x:-.125,y:.185,z:0,limb:'arm',d:0},
  elbow:{n:'elbow',x:-.148,y:.36,z:0,limb:'arm',d:1},
  wrist:{n:'wrist',x:-.178,y:.482,z:0,limb:'arm',d:2},
  thumb:{n:'thumb',x:-.21,y:.53,z:.008,limb:'arm',d:3,hand:1},
  fingers:{n:'fingers',pl:1,x:-.195,y:.565,z:.004,limb:'arm',d:3,hand:1},
  pinky:{n:'little finger',x:-.172,y:.545,z:.004,limb:'arm',d:3,hand:1},
  hip:{n:'hip',x:-.08,y:.46,z:0,limb:'leg',d:0},
  quad:{n:'quadriceps',x:-.06,y:.58,z:.032,limb:'leg',d:1,lvl:'ap'},
  femur:{n:'femur',x:-.06,y:.58,z:0,limb:'leg',d:1,lvl:'ap'},
  knee:{n:'knee',x:-.056,y:.72,z:.005,limb:'leg',d:2},
  shin:{n:'shin',x:-.056,y:.81,z:.018,limb:'leg',d:3},
  calf:{n:'calf',x:-.056,y:.8,z:-.03,limb:'leg',d:3},
  ankle:{n:'ankle',x:-.05,y:.935,z:0,limb:'leg',d:4},
  heel:{n:'heel',x:-.05,y:.985,z:-.03,limb:'leg',d:5},
  foot:{n:'foot',x:-.062,y:.98,z:.05,limb:'leg',d:5}
};
const LMORDER=['nose','eye','ear','chin','skull','brain','skinchest','sternum','heart','lungs','ribs','esophagus','spinalcord','vertebra','skinback','liver','stomach','kidneys','navel','bladder','shoulder','elbow','wrist','thumb','fingers','pinky','hip','quad','femur','knee','shin','calf','ankle','heel','foot'];
/* Superficial and deep only make sense along one path in from the same patch of skin: outermost first. */
const CHAINS=[['skull','brain'],['skinchest','sternum','heart','esophagus'],['ribs','lungs'],['skinback','vertebra','spinalcord'],['quad','femur']];
const T={si:.015,ap:.02,ml:.02};

/* The term that describes a relative to b, or null when the term does not apply. */
function relate(idA,idB){const a=LM[idA],b=LM[idB],r={si:null,ap:null,ml:null,pd:null,sd:null,side:null,why:{}};
  if(idA===idB)return r;
  const dy=a.y-b.y,dz=a.z-b.z,dm=Math.abs(a.x)-Math.abs(b.x);
  if(Math.abs(dy)>=T.si)r.si=dy<0?'superior':'inferior';else r.why.si='They sit at about the same height.';
  if(Math.abs(dz)>=T.ap)r.ap=dz>0?'anterior':'posterior';else r.why.ap='Neither sits clearly in front of the other.';
  const sameLimb=a.limb&&a.limb===b.limb;
  if(sameLimb&&!(a.hand&&b.hand))r.why.ml='Along one limb, proximal and distal are the terms to use.';
  else if(Math.abs(dm)>=T.ml)r.ml=dm<0?'medial':'lateral';else r.why.ml='They are about the same distance from the midline.';
  if(sameLimb){if(a.d!==b.d)r.pd=a.d<b.d?'proximal':'distal';else r.why.pd='They are about the same distance along the limb.';}
  else r.why.pd=(a.limb&&b.limb)?'They are on different limbs. These terms compare two spots on one limb.':'These terms compare two spots on one limb, measured from where the limb joins the trunk.';
  let found=false;CHAINS.forEach(c=>{const i=c.indexOf(idA),j=c.indexOf(idB);if(i>=0&&j>=0){r.sd=i<j?'superficial':'deep';found=true;}});
  if(!found)r.why.sd='They do not sit on one path in from the same patch of skin.';
  if(a.side&&b.side)r.side=a.side===b.side?'ipsilateral':'contralateral';
  return r;}
function sentence(idA,term,idB){const a=LM[idA],b=LM[idB];return 'The '+a.n+(a.pl?' are ':' is ')+term+' to the '+b.n;}
function mainAxis(idA,idB){const r=relate(idA,idB),a=LM[idA],b=LM[idB];if(r.pd)return 'pd';
  const c=[['si',Math.abs(a.y-b.y)],['ap',Math.abs(a.z-b.z)*1.2],['ml',Math.abs(Math.abs(a.x)-Math.abs(b.x))]].filter(e=>r[e[0]]).sort((p,q)=>q[1]-p[1]);
  if(c.length)return c[0][0];return r.sd?'sd':null;}

/* Organs as ellipsoids: cx,cy,cz,rx,ry,rz. `both` mirrors across the midline. */
const ORG={
  brain:{n:'Brain',c:[0,.038,0,.044,.032,.048],cav:'cranial',col:'s5',sys:'nervous'},
  cord:{n:'Spinal cord',c:[0,.225,-.045,.006,.095,.006],cav:'spinal',col:'s5',sys:'nervous'},
  lungs:{n:'Lungs',c:[.055,.21,.005,.04,.055,.045],both:1,cav:'thoracic',col:'s6',sys:'respiratory'},
  trachea:{n:'Trachea',c:[0,.165,.015,.007,.028,.007],cav:'thoracic',col:'s6',sys:'respiratory'},
  esophagus:{n:'Esophagus',c:[0,.205,-.012,.006,.06,.006],cav:'thoracic',col:'s4',sys:'digestive'},
  heart:{n:'Heart',c:[.018,.21,.025,.026,.03,.026],cav:'thoracic',col:'s1',sys:'cardiovascular'},
  lgint:{n:'Large intestine',c:[0,.365,.025,.058,.045,.03],cav:'abdominal',col:'s3',sys:'digestive'},
  smint:{n:'Small intestine',c:[0,.37,.032,.035,.03,.024],cav:'abdominal',col:'s4',sys:'digestive'},
  liver:{n:'Liver',c:[-.045,.285,.022,.05,.026,.035],cav:'abdominal',col:'s1',sys:'digestive'},
  stomach:{n:'Stomach',c:[.04,.295,.03,.03,.025,.022],cav:'abdominal',col:'s4',sys:'digestive'},
  spleen:{n:'Spleen',c:[.075,.29,-.008,.013,.02,.013],cav:'abdominal',col:'s5',sys:'lymphatic'},
  pancreas:{n:'Pancreas',c:[.012,.318,0,.034,.008,.01],cav:'abdominal',col:'s2',sys:'endocrine'},
  kidneys:{n:'Kidneys',c:[.04,.327,-.035,.016,.026,.014],both:1,cav:'abdominal',col:'s2',sys:'urinary'},
  bladder:{n:'Urinary bladder',c:[0,.45,.035,.022,.018,.02],cav:'pelvic',col:'s2',sys:'urinary'},
  repro:{n:'Reproductive organs',c:[0,.43,.008,.018,.016,.014],cav:'pelvic',col:'s6',sys:'reproductive'},
  rectum:{n:'Rectum',c:[0,.44,-.026,.012,.03,.012],cav:'pelvic',col:'s3',sys:'digestive'}
};
const ORGORDER=['cord','lungs','trachea','esophagus','heart','brain','lgint','smint','liver','stomach','spleen','pancreas','kidneys','rectum','repro','bladder'];
function cutHits(plane,val){const hit=[];ORGORDER.forEach(id=>{const o=ORG[id],c=o.c;let on=false;
    if(plane==='sagittal')on=Math.abs(val-c[0])<=c[3]||(o.both&&Math.abs(val+c[0])<=c[3]);
    else if(plane==='frontal')on=Math.abs(val-c[2])<=c[5];
    else on=Math.abs(val-c[1])<=c[4];
    if(on)hit.push(o.n);});return hit;}
function cutRegions(plane,val){const r=[];
  if(plane==='transverse'){const y=val;[['the head',0,.115],['the neck',.115,.15],['the chest',.15,.265],['the abdomen',.265,.41],['the pelvis',.41,.505],['both thighs',.505,.72],['both knees',.72,.74],['both lower legs',.74,.935],['both feet',.935,1.001]].forEach(e=>{if(y>=e[1]&&y<e[2])r.push(e[0]);});
    if(y>=.19&&y<.36)r.push('both upper arms');else if(y>=.36&&y<.482)r.push('both forearms');else if(y>=.482&&y<.575)r.push('both hands');}
  else if(plane==='sagittal'){const x=Math.abs(val);if(x<.056)r.push('the head','the neck');if(x<.104)r.push('the trunk');if(x>=.008&&x<.11)r.push(val>0?'the left leg':'the right leg');if(x>=.1)r.push(val>0?'the left arm':'the right arm');if(x<.01)r.push('the gap between the legs');}
  else{const z=val;if(Math.abs(z)<.056)r.push('the head');if(z>-.07&&z<.075)r.push('the trunk');if(Math.abs(z)<.03)r.push('both arms');if(z>-.05&&z<.05)r.push('both legs');}
  return r;}

const PLANES={
  sagittal:{n:'Sagittal',full:'Sagittal plane',parts:['left','right'],does:'A sagittal plane divides the body into left and right parts.',ex:'Running, a biceps curl and a squat move in the sagittal plane.',use:'A knee MRI is often read in sagittal slices, because they show the ACL and PCL running front to back.'},
  frontal:{n:'Frontal (coronal)',full:'Frontal (coronal) plane',parts:['anterior','posterior'],does:'A frontal plane, also called a coronal plane, divides the body into anterior (front) and posterior (back) parts.',ex:'A lateral raise and a jumping jack move in the frontal plane.',use:'A chest X-ray taken front to back flattens the body onto a frontal view.'},
  transverse:{n:'Transverse',full:'Transverse plane',parts:['superior','inferior'],does:'A transverse plane divides the body into superior (upper) and inferior (lower) parts.',ex:'A trunk twist and a golf swing move mostly in the transverse plane.',use:'A CT scan of the abdomen is usually read in transverse slices, as if you looked up from the patient’s feet.'}
};
const CAVS={
  cranial:{n:'Cranial cavity',group:'dorsal',org:['Brain'],prot:'The skull surrounds it.',note:'It connects to the spinal cavity through the large opening at the base of the skull.',box:[0,.04,0,.048,.036,.052]},
  spinal:{n:'Spinal cavity',group:'dorsal',org:['Spinal cord'],prot:'The vertebrae surround it.',note:'It runs down the back of the trunk. The vertebrae stack into a bony canal around the cord.',box:[0,.27,-.045,.012,.175,.012]},
  thoracic:{n:'Thoracic cavity',group:'ventral',org:['Heart','Lungs','Trachea','Esophagus'],prot:'The ribs and sternum surround it.',note:'The diaphragm forms its floor.',deep:'Inside it: a pleural cavity around each lung, and the mediastinum in the middle, which holds the heart in its pericardial cavity along with the trachea and esophagus.',box:[0,.21,.008,.098,.055,.058]},
  abdominal:{n:'Abdominal cavity',group:'ventral',org:['Stomach','Liver','Spleen','Pancreas','Small intestine','Large intestine','Kidneys'],prot:'Muscle walls protect most of it, and the lower ribs cover the top.',note:'The diaphragm forms its roof. It runs into the pelvic cavity with no wall between them.',deep:'The kidneys sit behind the membrane that lines this cavity (retroperitoneal), which is why many lists leave them out. Together the abdominal and pelvic cavities form the abdominopelvic cavity.',box:[0,.337,.015,.086,.072,.046]},
  pelvic:{n:'Pelvic cavity',group:'ventral',org:['Urinary bladder','Rectum','Reproductive organs'],prot:'The hip bones surround it.',note:'It sits below the abdominal cavity, inside the bowl of the pelvis.',box:[0,.448,.008,.066,.04,.044]}
};
const SYS={
  integumentary:{n:'Integumentary',col:'s4',org:'Skin, hair, nails, sweat glands, oil glands',fn:'Covers and protects the body, helps control temperature and senses touch.',dom:['Sweat glands release water onto the skin','Evaporation carries heat away from the body'],with:'Works with the cardiovascular system: skin vessels widen to dump heat.',labels:[['Skin',.14,.25],['Hair',.03,.004],['Nails',-.195,.57]]},
  skeletal:{n:'Skeletal',col:'s6',org:'Bones, cartilage, ligaments, joints',fn:'Supports the body, protects organs, stores minerals and makes blood cells in red marrow.',dom:['Skull bones fuse into a rigid case','Protects the brain'],with:'Works with the muscular system: bones are the levers that muscles pull.',labels:[['Skull',.045,.04],['Ribs',.09,.23],['Femur',.06,.6],['Tibia',.05,.82]]},
  muscular:{n:'Muscular',col:'s1',org:'Skeletal muscles and tendons (cardiac and smooth muscle sit in other organs)',fn:'Moves the body, holds posture and makes heat.',dom:['Long fibers that shorten, anchored to bone by tendons','Pull on bones to move joints'],with:'Works with the nervous system: a motor neuron tells each fiber when to contract.',labels:[['Deltoid',.125,.2],['Pectoralis major',.05,.215],['Rectus femoris',.06,.59],['Gastrocnemius',.058,.8]]},
  nervous:{n:'Nervous',col:'s5',org:'Brain, spinal cord, nerves, sense organs',fn:'Senses change, decides what to do and sends fast signals to muscles and glands.',dom:['Long, thin axons wrapped in myelin','Carry signals quickly over long distances'],with:'Works with the endocrine system: the hypothalamus controls the pituitary gland.',labels:[['Brain',.03,.04],['Spinal cord',0,.27],['Nerves',.13,.36]]},
  endocrine:{n:'Endocrine',col:'s3',org:'Pituitary, thyroid and adrenal glands, pancreas, ovaries or testes',fn:'Releases hormones into the blood to control slower processes such as growth, metabolism and blood sugar.',dom:['Glands with no ducts, packed with capillaries','Release hormones straight into the blood'],with:'Works with the digestive system: the pancreas answers each meal with insulin.',labels:[['Pituitary gland',0,.058],['Thyroid gland',0,.14],['Adrenal glands',.04,.295],['Pancreas',.015,.318],['Ovaries or testes',.03,.47]]},
  cardiovascular:{n:'Cardiovascular',col:'s1',org:'Heart, arteries, veins, capillaries, blood',fn:'Pumps blood to deliver oxygen and nutrients and carry away wastes.',dom:['Capillary walls only one cell thick','Let oxygen and nutrients cross into tissues'],with:'Works with the respiratory system: blood picks up oxygen in the lungs and drops off CO₂.',labels:[['Heart',.02,.21],['Aorta',.008,.3],['Arteries and veins',.06,.62]]},
  lymphatic:{n:'Lymphatic',col:'s3',org:'Lymph vessels, lymph nodes, spleen, thymus, tonsils',fn:'Returns leaked fluid to the blood and helps fight infection.',dom:['Lymph nodes packed with white blood cells','Filter lymph and trap pathogens'],with:'Works with the cardiovascular system: lymph drains back into veins near the heart.',labels:[['Lymph nodes',.05,.135],['Thymus',0,.185],['Spleen',.075,.29],['Lymph vessels',.06,.62]]},
  respiratory:{n:'Respiratory',col:'s6',org:'Nose, pharynx, larynx, trachea, bronchi, lungs, diaphragm',fn:'Brings in oxygen and removes carbon dioxide.',dom:['Alveoli: thin walls and a huge surface area','Gases diffuse quickly between air and blood'],with:'Works with the muscular system: the diaphragm is a muscle that powers each breath.',labels:[['Nose',0,.06],['Trachea',0,.16],['Lungs',.06,.21],['Diaphragm',.08,.268]]},
  digestive:{n:'Digestive',col:'s4',org:'Mouth, esophagus, stomach, small intestine, large intestine, liver, pancreas',fn:'Breaks food down, absorbs nutrients and removes solid waste.',dom:['Villi fold the small intestine lining','More surface area absorbs more nutrients'],with:'Works with the cardiovascular system: absorbed nutrients leave the intestine in the blood.',labels:[['Esophagus',0,.21],['Liver',-.04,.285],['Stomach',.04,.295],['Small intestine',.015,.37],['Large intestine',.06,.36]]},
  urinary:{n:'Urinary',col:'s2',org:'Kidneys, ureters, urinary bladder, urethra',fn:'Filters waste out of the blood and balances water and salts.',dom:['Millions of nephrons with thin filtering capillaries','Filter waste out of the blood'],with:'Works with the cardiovascular system: about a fifth of the blood the heart pumps goes through the kidneys.',labels:[['Kidneys',.04,.327],['Ureters',.03,.39],['Urinary bladder',0,.45]]},
  reproductive:{n:'Reproductive',col:'s5',org:'Female: ovaries, uterus, vagina. Male: testes, prostate, penis',fn:'Makes sex cells and sex hormones. In females, also supports a developing fetus.',dom:['Thick muscular uterine wall that stretches','Holds and later pushes out a growing fetus'],with:'Works with the endocrine system: hormones from the pituitary gland control the sex organs.',labels:[['Ovaries and uterus (female)',.03,.43],['Testes and prostate (male)',.02,.5]]}
};
const SYSORDER=['integumentary','skeletal','muscular','nervous','endocrine','cardiovascular','lymphatic','respiratory','digestive','urinary','reproductive'];

/* Practice sentences in the style of the Body Basics worksheet. The answer always comes from relate(). */
const PRACTICE=[
  {a:'esophagus',b:'spinalcord',ax:'ap',txt:'The esophagus is ___ to the spinal cord.',why:'The esophagus runs just in front of the vertebrae and the cord. The side view shows it.'},
  {a:'heart',b:'sternum',ax:'ap',txt:'The heart is ___ to the sternum.',why:'The sternum is the flat bone at the front of the chest, and the heart sits behind it. That is why CPR compressions press on the sternum.'},
  {a:'kidneys',b:'heart',ax:'si',txt:'The kidneys are ___ to the heart.',why:'The kidneys sit in the upper abdomen, below the diaphragm. The heart is above it.'},
  {a:'knee',b:'hip',ax:'pd',b2:'foot',ax2:'pd',txt:'The knee is ___ to the hip but ___ to the foot.',why:'Measure along the leg from where it joins the trunk. The hip is closest, the knee next, the foot farthest.'},
  {a:'elbow',b:'fingers',ax:'pd',txt:'The elbow is ___ to the fingers.',why:'The elbow is closer to the shoulder, where the arm joins the trunk.'},
  {a:'nose',b:'ear',ax:'ml',txt:'The nose is ___ to the ears.',why:'The nose sits on the midline. The ears are out to the sides.'},
  {a:'thumb',b:'pinky',ax:'ml',txt:'The thumb is ___ to the little finger.',why:'In anatomical position the palms face forward, so the thumbs point away from the body.'},
  {a:'stomach',b:'kidneys',ax:'ap',txt:'The stomach is ___ to the kidneys.',why:'The kidneys sit against the back wall of the abdomen, and the stomach lies in front of them.'},
  {a:'wrist',b:'elbow',ax:'pd',txt:'The wrist is ___ to the elbow.',why:'The wrist is farther along the arm from the shoulder.'},
  {a:'shin',b:'calf',ax:'ap',txt:'The shin is ___ to the calf.',why:'The shin is the front of the lower leg and the calf is the back.'},
  {a:'navel',b:'sternum',ax:'si',txt:'The navel is ___ to the sternum.',why:'Anatomical position has the head up, so the navel is below the sternum.'},
  {a:'sternum',b:'heart',ax:'sd',lvl:'honors',txt:'The sternum is ___ to the heart.',why:'Moving in from the skin of the chest, you reach the sternum before the heart.'},
  {a:'brain',b:'skull',ax:'sd',lvl:'honors',txt:'The brain is ___ to the skull.',why:'Moving in from the scalp, you reach the skull first and then the brain.'},
  {a:'ribs',b:'lungs',ax:'sd',lvl:'honors',txt:'The ribs are ___ to the lungs.',why:'The ribs form the wall of the chest, and the lungs lie inside it.'},
  {a:'spinalcord',b:'vertebra',ax:'sd',lvl:'ap',txt:'The spinal cord is ___ to the vertebra.',why:'The bone forms a canal, and the cord runs inside it.'},
  {a:'liver',b:'stomach',ax:'side',lvl:'ap',txt:'The liver is ___ to the stomach.',why:'The liver sits on the body’s right and the stomach mostly on the body’s left, so they are on opposite sides.'}
];
const TERMS=[['superior','inferior'],['anterior','posterior'],['medial','lateral'],['proximal','distal'],['superficial','deep']];
const AXNAME={si:'Superior or inferior',ap:'Anterior or posterior',ml:'Medial or lateral',pd:'Proximal or distal',sd:'Superficial or deep'};
const AXHINT={si:'Which one is closer to the top of the head?',ap:'Use the side view. Which one is closer to the front of the body?',ml:'Which one is closer to the midline?',pd:'Trace along the limb from the trunk. Which one do you reach first?',sd:'Start at the skin and move inward. Which one do you reach first?',side:'Are they on the same side of the midline?'};

const visLM=()=>LMORDER.filter(id=>atLeast(LM[id].lvl||'bio'));
const prList=()=>PRACTICE.filter(it=>atLeast(it.lvl||'bio'));
function prCur(sim){const L=prList();return L[sim.st.pr.i%L.length];}
function prAnswer(it,n){const r=relate(it.a,n?it.b2:it.b);return r[n?it.ax2:it.ax];}
function prNext(sim){const L=prList();sim.st.pr={i:(sim.st.pr.i+1)%L.length,blank:0,picks:[],msg:'',bad:0,done:false};sim.infoDirty=true;}
function prPick(sim,t){const pr=sim.st.pr,it=prCur(sim);if(pr.done)return;const n=pr.blank,bId=n?it.b2:it.b,ans=prAnswer(it,n);
  if(t===ans){pr.picks[n]=t;pr.msg='';pr.bad=0;if(it.b2&&n===0){pr.blank=1;}else pr.done=true;return;}
  const r=relate(it.a,bId);if([r.si,r.ap,r.ml,r.pd,r.sd,r.side].includes(t)){pr.msg='That is true too: t'+sentence(it.a,t,bId).slice(1)+'. This sentence wants a different pair of terms. '+AXHINT[n?it.ax2:it.ax];return;}
  pr.bad++;pr.msg='Not this one. '+AXHINT[n?it.ax2:it.ax];}
function prReveal(sim){const pr=sim.st.pr,it=prCur(sim);pr.picks[0]=prAnswer(it,0);if(it.b2)pr.picks[1]=prAnswer(it,1);pr.blank=it.b2?1:0;pr.done=true;pr.msg='';}
function prPair(sim){const pr=sim.st.pr,it=prCur(sim);return [it.a,(it.b2&&pr.blank===1)?it.b2:it.b];}
function prText(sim){const pr=sim.st.pr,it=prCur(sim);let n=0;return it.txt.replace(/___/g,()=>{const v=pr.picks[n];n++;return v||'____';});}
function cutVal(p){return p.plane==='sagittal'?(p.cut-50)/50*.21:p.plane==='frontal'?(p.cut-50)/50*.09:p.cut/100;}
function cutPos(p){const v=cutVal(p);if(p.plane==='sagittal'){if(Math.abs(v)<.005)return 'on the midline';return Math.round(Math.abs(v)*170)+' cm toward the body’s '+(v>0?'left':'right');}
  if(p.plane==='frontal'){if(Math.abs(v)<.003)return 'through the middle of the body';return Math.round(Math.abs(v)*170)+' cm '+(v>0?'toward the front':'toward the back');}
  return Math.round(v*170)+' cm below the top of the head';}

/* ---------- Side profile: not in body-art.js, so drawn here. Pairs of [y,z]; z + is anterior. Assumes a 170 cm person when converting to cm. */
const PROFILE=[[0,.005],[.012,.03],[.03,.05],[.05,.055],[.06,.066],[.072,.052],[.09,.05],[.105,.04],[.116,.018],[.14,.024],[.16,.05],[.2,.076],[.25,.07],[.3,.06],[.335,.064],[.4,.06],[.46,.05],[.52,.046],[.6,.045],[.7,.03],[.725,.032],[.78,.022],[.85,.018],[.93,.018],[.96,.04],[.985,.085],[1,.085],[1,-.04],[.985,-.043],[.95,-.022],[.87,-.024],[.8,-.042],[.74,-.024],[.7,-.03],[.6,-.046],[.52,-.058],[.47,-.07],[.42,-.056],[.35,-.04],[.28,-.05],[.22,-.074],[.17,-.052],[.13,-.026],[.115,-.026],[.09,-.046],[.05,-.056],[.02,-.042]];
function sidePath(ctx,M){const n=PROFILE.length,P=PROFILE.map(p=>M(p[1],p[0]));ctx.beginPath();const m=(i,j)=>({x:(P[i].x+P[j].x)/2,y:(P[i].y+P[j].y)/2}),s=m(n-1,0);ctx.moveTo(s.x,s.y);
  for(let i=0;i<n;i++){const e=m(i,(i+1)%n);ctx.quadraticCurveTo(P[i].x,P[i].y,e.x,e.y);}ctx.closePath();}
function drawSide(ctx,M,h){sidePath(ctx,M);ctx.fillStyle=PAL['card2'];ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.4;ctx.stroke();
  const a=M(0,.185),b=M(0,.36),c=M(.002,.482),d=M(.006,.56);ctx.lineCap='round';ctx.lineJoin='round';
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=.052*h+2;[[a,b,c,d]].forEach(q=>{ctx.beginPath();ctx.moveTo(q[0].x,q[0].y);q.slice(1).forEach(e=>ctx.lineTo(e.x,e.y));ctx.globalAlpha=.55;ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle=PAL['card2'];ctx.lineWidth=.052*h;ctx.stroke();});
  const e=M(.05,.052);ctx.fillStyle=PAL['cv-soft'];ctx.beginPath();ctx.arc(e.x,e.y,Math.max(1.4,.0045*h),0,6.3);ctx.fill();}

/* Layout for the two figures */
const FR={cx:225,top:72,h:515},SD={cx:590,top:72,h:515};
const FM=(x,y)=>({x:FR.cx+x*FR.h,y:FR.top+y*FR.h});
const SM=(z,y)=>({x:SD.cx+z*SD.h*1.05,y:SD.top+y*SD.h});

function ell(ctx,x,y,rx,ry,fill,stroke,alpha){ctx.save();ctx.globalAlpha=alpha===undefined?1:alpha;ctx.beginPath();ctx.ellipse(x,y,Math.max(rx,.5),Math.max(ry,.5),0,0,6.3);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}ctx.restore();}
function drawOrgansF(ctx,hi,alphaOff){ORGORDER.forEach(id=>{const o=ORG[id],c=o.c,on=hi(o);const col=PAL[o.col];const a=on?.85:(alphaOff===undefined?.16:alphaOff);
    [1].concat(o.both?[-1]:[]).forEach(sg=>{const p=FM(sg*c[0],c[1]);ell(ctx,p.x,p.y,c[3]*FR.h,c[4]*FR.h,col,on?PAL['cv-ink']:null,a);});});}
function drawOrgansS(ctx,hi,alphaOff){ORGORDER.forEach(id=>{const o=ORG[id],c=o.c,on=hi(o);const p=SM(c[2],c[1]);ell(ctx,p.x,p.y,c[5]*SD.h*1.05,c[4]*SD.h,PAL[o.col],on?PAL['cv-ink']:null,on?.85:(alphaOff===undefined?.16:alphaOff));});}
function labelFit(ctx,s,size,w,maxW){let z=size;ctx.font=w+' '+z+'px '+FONT;while(ctx.measureText(s).width>maxW&&z>11){z-=.5;ctx.font=w+' '+z+'px '+FONT;}return z;}

function drawDirections(ctx,k){const f=12*k;txt(ctx,'Front view',FR.cx,62,{s:f,w:600,c:PAL['cv-soft'],a:'center'});txt(ctx,'Side view',SD.cx,62,{s:f,w:600,c:PAL['cv-soft'],a:'center'});
  txt(ctx,'Body’s right',12,100,{s:f,c:PAL['cv-soft']});txt(ctx,'Body’s left',FR.cx+100,100,{s:f,c:PAL['cv-soft']});
  txt(ctx,'← Posterior',SD.cx-62,340,{s:f,c:PAL['cv-soft'],a:'right'});txt(ctx,'Anterior →',SD.cx+55,340,{s:f,c:PAL['cv-soft']});}
function dotAll(ctx,skip){visLM().forEach(id=>{if(skip.includes(id))return;const l=LM[id];[1].concat(l.both?[-1]:[]).forEach(s=>{const p=FM(s*l.x,l.y);ctx.beginPath();ctx.arc(p.x,p.y,3,0,6.3);ctx.fillStyle=PAL['cv-soft'];ctx.fill();});const q=SM(l.z,l.y);ctx.beginPath();ctx.arc(q.x,q.y,3,0,6.3);ctx.fillStyle=PAL['cv-soft'];ctx.fill();});}
function markPair(ctx,idA,idB,k){const A=LM[idA],B=LM[idB],r=10*k;
  const put=(pa,pb)=>{ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.stroke();ctx.setLineDash([]);
    let ax=pa.x,ay=pa.y,bx=pb.x,by=pb.y;const d=Math.hypot(ax-bx,ay-by);if(d<r*2.2){const ux=d>1?(ax-bx)/d:0,uy=d>1?(ay-by)/d:-1,sh=(r*2.2-d)/2;ax+=ux*sh;ay+=uy*sh;bx-=ux*sh;by-=uy*sh;}
    pill(ctx,'A',ax,ay,'#b3263f','#fff',12*k);pill(ctx,'B',bx,by,'#2a62b8','#fff',12*k);};
  put(FM(A.x,A.y),FM(B.x,B.y));put(SM(A.z,A.y),SM(B.z,B.y));}

function drawTerms(sim,ctx,k){const p=sim.p,practice=p.view==='practice';let a=p.a,b=p.b,head;
  if(practice){const pr=prPair(sim);a=pr[0];b=pr[1];head=prText(sim);}
  else if(a===b)head='Pick two different landmarks.';
  else{const ax=mainAxis(a,b),r=relate(a,b);head=ax?sentence(a,r[ax],b)+'.':'These two sit too close to compare at this scale.';}
  const size=labelFit(ctx,head,15*k,700,780);txt(ctx,head,W/2,30,{s:size,w:700,a:'center',b:'middle'});
  if(p.supine&&!practice){drawSupine(sim,ctx,k,a,b);return;}
  BioLab.body.draw(ctx,{cx:FR.cx,top:FR.top,h:FR.h,view:'front'});drawSide(ctx,SM,SD.h);drawDirections(ctx,k);
  dotAll(ctx,[a,b]);if(a!==b)markPair(ctx,a,b,k);
}
function drawSupine(sim,ctx,k,a,b){const h=660,left=70,base=330,M=(z,y)=>({x:left+y*h,y:base-z*h});
  ctx.fillStyle=PAL['cv-bench']||PAL['card2'];rr(ctx,left-30,base+.1*h,h+60,18,6);ctx.fill();
  drawSide(ctx,M,h);
  visLM().forEach(id=>{if(id===a||id===b)return;const l=LM[id],q=M(l.z,l.y);ctx.beginPath();ctx.arc(q.x,q.y,3,0,6.3);ctx.fillStyle=PAL['cv-soft'];ctx.fill();});
  if(a!==b){const A=M(LM[a].z,LM[a].y),B=M(LM[b].z,LM[b].y);ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();ctx.setLineDash([]);
    pill(ctx,'A',A.x,A.y,'#b3263f','#fff',12*k);pill(ctx,'B',B.x,B.y,'#2a62b8','#fff',12*k);}
  txt(ctx,'← Superior (toward the head)',left-30,base-.16*h,{s:13*k,w:600});txt(ctx,'Inferior →',left+h+30,base-.16*h,{s:13*k,w:600,a:'right'});
  txt(ctx,'↑ Anterior: now it faces the ceiling',W/2,base+.1*h+50,{s:13*k,w:600,a:'center'});}

function drawPlanes(sim,ctx,k){const p=sim.p,v=cutVal(p),pl=PLANES[p.plane],col=PAL['s2'];
  const hits=o=>cutHits(p.plane,v).includes(o.n);
  const size=labelFit(ctx,pl.full,15*k,700,700);txt(ctx,pl.full,W/2,30,{s:size,w:700,a:'center',b:'middle'});
  BioLab.body.draw(ctx,{cx:FR.cx,top:FR.top,h:FR.h,view:'front',marks:false});drawSide(ctx,SM,SD.h);
  const tint=(path,rect)=>{ctx.save();path();ctx.clip();ctx.fillStyle=col;ctx.globalAlpha=.22;ctx.fillRect(rect[0],rect[1],rect[2],rect[3]);ctx.restore();};
  const fp=()=>BioLab.body.path(ctx,{cx:FR.cx,top:FR.top,h:FR.h}),sp=()=>sidePath(ctx,SM);
  if(p.plane==='sagittal'){const x=FM(v,0).x;tint(fp,[0,0,x,H]);ctx.save();sp();ctx.clip();ctx.fillStyle=col;ctx.globalAlpha=.1;ctx.fillRect(400,0,400,H);ctx.restore();}
  else if(p.plane==='frontal'){const x=SM(v,0).x;tint(sp,[x,0,W-x,H]);ctx.save();fp();ctx.clip();ctx.fillStyle=col;ctx.globalAlpha=.1;ctx.fillRect(0,0,400,H);ctx.restore();}
  else{const y=FM(0,v).y;tint(fp,[0,0,W,y]);tint(sp,[0,0,W,y]);}
  drawOrgansF(ctx,hits,.14);drawOrgansS(ctx,hits,.14);
  ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();
  if(p.plane==='sagittal'){const x=FM(v,0).x;ctx.moveTo(x,FR.top-8);ctx.lineTo(x,FR.top+FR.h+6);}
  else if(p.plane==='frontal'){const x=SM(v,0).x;ctx.moveTo(x,SD.top-8);ctx.lineTo(x,SD.top+SD.h+6);}
  else{const y=FM(0,v).y;ctx.moveTo(FR.cx-120,y);ctx.lineTo(FR.cx+120,y);ctx.moveTo(SD.cx-90,y);ctx.lineTo(SD.cx+100,y);}ctx.stroke();
  const f=12*k,c=PAL['cv-ink'];txt(ctx,'Front view',FR.cx,62,{s:f,w:600,c:PAL['cv-soft'],a:'center'});txt(ctx,'Side view',SD.cx,62,{s:f,w:600,c:PAL['cv-soft'],a:'center'});
  if(p.plane==='sagittal'){txt(ctx,'Right part',10,120,{s:13*k,w:700,c});txt(ctx,'Left part',FR.cx+150,120,{s:13*k,w:700,c,a:'center'});}
  else if(p.plane==='frontal'){txt(ctx,'Posterior part',SD.cx-65,120,{s:13*k,w:700,c,a:'right'});txt(ctx,'Anterior part',SD.cx+55,120,{s:13*k,w:700,c:c});}
  else{const y=FM(0,v).y;const gap=(y>H-46)?-44:0;txt(ctx,'Superior part',407,Math.max(100,y-12*k+gap),{s:13*k,w:700,c,a:'center'});if(y<H-46)txt(ctx,'Inferior part',407,Math.min(H-8,y+22*k),{s:13*k,w:700,c,a:'center'});}
}

function drawCavities(sim,ctx,k){const p=sim.p,sel=p.cavity,c=CAVS[sel];const head=sel==='all'?'Body cavities':c.n;
  txt(ctx,head,W/2,30,{s:15*k,w:700,a:'center',b:'middle'});
  BioLab.body.draw(ctx,{cx:FR.cx-55,top:FR.top,h:FR.h,view:'front',marks:false});
  const FM2=(x,y)=>({x:FR.cx-55+x*FR.h,y:FR.top+y*FR.h});const SD2=SD.cx+75,SM2=(z,y)=>({x:SD2+z*SD.h*1.05,y:SD.top+y*SD.h});
  sidePath(ctx,SM2);ctx.fillStyle=PAL['card2'];ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.4;ctx.stroke();
  const cols={cranial:'s5',spinal:'s6',thoracic:'s1',abdominal:'s4',pelvic:'s3'};
  Object.keys(CAVS).forEach(id=>{const q=CAVS[id],b=q.box,on=sel===id,al=sel==='all'?.3:(on?.38:.08),co=PAL[cols[id]];
    const a=FM2(b[0],b[1]),s=SM2(b[2],b[1]);ctx.save();ctx.globalAlpha=al;ctx.fillStyle=co;
    const rad=Math.min(14,b[3]*FR.h);rr(ctx,a.x-b[3]*FR.h,a.y-b[4]*FR.h,b[3]*2*FR.h,b[4]*2*FR.h,id==='cranial'?30:rad);ctx.fill();
    rr(ctx,s.x-b[5]*SD.h*1.05,s.y-b[4]*SD.h,b[5]*2*SD.h*1.05,b[4]*2*SD.h,id==='cranial'?30:Math.min(14,b[5]*SD.h));ctx.fill();ctx.restore();
    if(on||sel==='all'){ctx.strokeStyle=co;ctx.lineWidth=on?2.5:1;rr(ctx,a.x-b[3]*FR.h,a.y-b[4]*FR.h,b[3]*2*FR.h,b[4]*2*FR.h,id==='cranial'?30:rad);ctx.stroke();rr(ctx,s.x-b[5]*SD.h*1.05,s.y-b[4]*SD.h,b[5]*2*SD.h*1.05,b[4]*2*SD.h,id==='cranial'?30:Math.min(14,b[5]*SD.h));ctx.stroke();}});
  const hi=o=>sel!=='all'&&o.cav===sel;const alphaOff=sel==='all'?.6:.12;
  ORGORDER.forEach(id=>{const o=ORG[id],cc=o.c,on=hi(o);[1].concat(o.both?[-1]:[]).forEach(sg=>{const q=FM2(sg*cc[0],cc[1]);ell(ctx,q.x,q.y,cc[3]*FR.h,cc[4]*FR.h,PAL[o.col],on?PAL['cv-ink']:null,on?.9:alphaOff);});const q=SM2(cc[2],cc[1]);ell(ctx,q.x,q.y,cc[5]*SD.h*1.05,cc[4]*SD.h,PAL[o.col],on?PAL['cv-ink']:null,on?.9:alphaOff);});
  /* diaphragm */
  const dl=FM2(-.098,.272),dr=FM2(.098,.272),dt=FM2(0,.245);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(dl.x,dl.y);ctx.quadraticCurveTo(dt.x,dt.y-6,dr.x,dr.y);ctx.stroke();
  const f=12*k;txt(ctx,'Front view',FR.cx-55,62,{s:f,w:600,c:PAL['cv-soft'],a:'center'});txt(ctx,'Side view',SD2,62,{s:f,w:600,c:PAL['cv-soft'],a:'center'});
  /* labels between the two figures */
  const lx=FR.cx-55+.225*FR.h;let items;
  if(sel==='all')items=Object.keys(CAVS).map(id=>({t:CAVS[id].n.replace(' cavity',''),y:CAVS[id].box[1],x:CAVS[id].box[3]*.7}));
  else items=ORGORDER.filter(id=>ORG[id].cav===sel).map(id=>({t:ORG[id].n,y:ORG[id].c[1],x:ORG[id].c[0]}));
  items.sort((a,b)=>a.y-b.y);const gap=20*k;let ys=items.map(e=>FM2(0,e.y).y);for(let i=1;i<ys.length;i++)if(ys[i]<ys[i-1]+gap)ys[i]=ys[i-1]+gap;const over=ys.length?ys[ys.length-1]-(H-14):0;if(over>0)ys=ys.map(v=>v-over);
  for(let i=ys.length-2;i>=0;i--)if(ys[i]>ys[i+1]-gap)ys[i]=ys[i+1]-gap;
  items.forEach((e,i)=>{const q=FM2(e.x,e.y);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(lx-4,ys[i]);ctx.stroke();txt(ctx,e.t,lx,ys[i],{s:12*k,w:600,b:'middle'});});
  /* diaphragm label sits under the side figure caption to stay clear of organs */
  if(sel==='thoracic'||sel==='abdominal'){const dq=SM2(-.052,.262);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(dq.x,dq.y);ctx.lineTo(dq.x-22,dq.y+14);ctx.stroke();txt(ctx,'Diaphragm',dq.x-25,dq.y+18,{s:12*k,w:600,a:'right',c:PAL['cv-soft']});}
}

function drawSystem(ctx,id,col,cx,top,h){const P=(x,y)=>({x:cx+x*h,y:top+y*h});
  const line=(pts,w,c,al)=>{ctx.save();ctx.globalAlpha=al===undefined?1:al;ctx.strokeStyle=c||col;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();pts.forEach((q,i)=>{const e=P(q[0],q[1]);i?ctx.lineTo(e.x,e.y):ctx.moveTo(e.x,e.y);});ctx.stroke();ctx.restore();};
  const both=(pts,w,c,al)=>{line(pts,w,c,al);line(pts.map(q=>[-q[0],q[1]]),w,c,al);};
  const blob=(x,y,rx,ry,c,al)=>{const e=P(x,y);ell(ctx,e.x,e.y,rx*h,ry*h,c||col,null,al===undefined?.9:al);};
  const dot=(x,y,r,c)=>{const e=P(x,y);ctx.beginPath();ctx.arc(e.x,e.y,r,0,6.3);ctx.fillStyle=c||col;ctx.fill();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=.8;ctx.stroke();};
  if(id==='integumentary'){ctx.save();BioLab.body.path(ctx,{cx,top,h});ctx.strokeStyle=col;ctx.lineWidth=7;ctx.globalAlpha=.75;ctx.stroke();ctx.restore();line([[-.04,.004],[-.02,-.004],[0,-.007],[.02,-.004],[.04,.004]],4,PAL['cv-soft']);dot(-.195,.57,4);dot(.195,.57,4);}
  else if(id==='skeletal'){blob(0,.045,.043,.043,null,.55);blob(0,.097,.026,.012,null,.55);line([[0,.13],[0,.43]],4);for(let i=0;i<7;i++){const y=.17+i*.021,w=.07+.03*Math.sin((i+1)/7*2.4);both([[.005,y],[w*.7,y-.006],[w,y+.012]],2.5);}
    both([[.012,.16],[.11,.165]],3);both([[.02,.43],[.08,.4],[.085,.45],[.03,.48]],4);both([[.125,.19],[.15,.36]],4);both([[.15,.365],[.178,.482]],3);both([[.155,.365],[.172,.482]],2);both([[.08,.47],[.058,.71]],5);both([[.056,.73],[.052,.93]],4);both([[.066,.73],[.062,.92]],2.5);both([[.05,.945],[.08,.99]],3.5);both([[.178,.49],[.195,.56]],3);}
  else if(id==='muscular'){both([[.112,.178],[.14,.235]],15);both([[.015,.21],[.09,.205]],20);both([[.132,.26],[.145,.34]],11);both([[.158,.385],[.172,.46]],9);line([[-.026,.26],[-.026,.415]],13);line([[.026,.26],[.026,.415]],13);both([[.07,.5],[.058,.69]],22);both([[.055,.76],[.058,.87]],13);}
  else if(id==='nervous'){blob(0,.04,.044,.033);line([[0,.07],[0,.315]],4);both([[0,.17],[.11,.19],[.15,.36],[.19,.55]],2);both([[0,.21],[.09,.215]],1.2);both([[0,.26],[.09,.27]],1.2);both([[0,.31],[.04,.42],[.06,.6],[.056,.8],[.06,.98]],2.5);}
  else if(id==='endocrine'){[[0,.058],[0,.14],[.04,.295],[-.04,.295],[.015,.318],[.035,.47],[-.035,.47]].forEach(q=>dot(q[0],q[1],7));blob(.012,.318,.03,.007,null,.8);}
  else if(id==='cardiovascular'){const blue=PAL['s2'];both([[.024,.17],[.11,.195],[.158,.36],[.19,.54]],1.8,blue);both([[.02,.34],[.045,.46],[.068,.7],[.062,.96]],1.8,blue);line([[-.012,.2],[-.012,.34]],3,blue);both([[.01,.17],[.1,.195],[.145,.36],[.178,.54]],2);both([[.01,.34],[.035,.46],[.052,.7],[.05,.96]],2);line([[.008,.19],[.008,.34]],3.5);both([[.008,.165],[.03,.1]],2);blob(.018,.21,.028,.03);}
  else if(id==='lymphatic'){both([[.02,.11],[.04,.16],[.1,.215],[.15,.36],[.18,.5]],1.5);both([[.02,.34],[.05,.46],[.06,.7],[.055,.93]],1.5);[[.04,.13],[.05,.145],[.1,.225],[.115,.235],[.06,.45],[.075,.465],[.03,.3],[.05,.72]].forEach(q=>{dot(q[0],q[1],4);dot(-q[0],q[1],4);});blob(0,.185,.016,.016);blob(.075,.29,.016,.022);}
  else if(id==='respiratory'){dot(0,.06,5);line([[0,.075],[0,.17]],5);both([[0,.17],[.03,.19]],3.5);blob(.056,.21,.042,.055,null,.6);blob(-.056,.21,.042,.055,null,.6);line([[-.098,.272],[-.05,.252],[0,.244],[.05,.252],[.098,.272]],4,PAL['cv-ink']);both([[.03,.19],[.05,.22]],2);both([[.03,.19],[.06,.19]],2);}
  else if(id==='digestive'){dot(0,.083,4.5);line([[0,.09],[0,.27],[.03,.285]],4);blob(.04,.295,.03,.025);blob(-.045,.285,.05,.026,PAL['s1'],.7);line([[-.052,.33],[-.056,.41],[.056,.41],[.056,.325],[-.052,.325]],7,PAL['s3'],.85);line([[-.03,.35],[.03,.35],[.03,.365],[-.03,.365],[-.03,.38],[.03,.38],[.03,.395],[-.03,.395]],4.5,col,.95);line([[.056,.41],[0,.44],[0,.49]],5,PAL['s3'],.85);}
  else if(id==='urinary'){blob(.04,.327,.016,.026);blob(-.04,.327,.016,.026);both([[.036,.35],[.02,.43]],2.5);blob(0,.45,.024,.018);line([[0,.465],[0,.5]],2.5);}
  else if(id==='reproductive'){blob(0,.43,.015,.016,null,.9);both([[.015,.425],[.035,.42]],2.5);dot(.04,.425,5);dot(-.04,.425,5);dot(.018,.5,5,PAL['s6']);dot(-.018,.5,5,PAL['s6']);blob(0,.465,.012,.009,PAL['s6'],.9);}
}
function drawSystems(sim,ctx,k){const id=sim.p.system,s=SYS[id],cx=215,top=62,h=525,col=PAL[s.col];
  txt(ctx,s.n+' system',W/2,30,{s:15*k,w:700,a:'center',b:'middle'});
  BioLab.body.draw(ctx,{cx,top,h,view:'front',marks:false});drawSystem(ctx,id,col,cx,top,h);
  const P=(x,y)=>({x:cx+x*h,y:top+y*h}),lx=cx+.235*h,gap=23*k;const L=s.labels.map(e=>({t:e[0],q:P(e[1],e[2])})).sort((a,b)=>a.q.y-b.q.y);
  let ys=L.map(e=>e.q.y);ys[0]=Math.max(ys[0],70);for(let i=1;i<ys.length;i++)if(ys[i]<ys[i-1]+gap)ys[i]=ys[i-1]+gap;
  L.forEach((e,i)=>{ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;ctx.globalAlpha=.7;ctx.beginPath();ctx.moveTo(e.q.x,e.q.y);ctx.lineTo(lx-4,ys[i]);ctx.stroke();ctx.globalAlpha=1;const sz=labelFit(ctx,e.t,12.5*k,600,W-lx-6);txt(ctx,e.t,lx,ys[i],{s:Math.max(sz,12),w:600,b:'middle'});});}

/* ---------- info panel ---------- */
const dom=(a,b)=>`<div style="display:flex;gap:0;margin:8px 0;border:2px solid var(--line);border-radius:10px;overflow:hidden"><div style="flex:1 1 50%;padding:8px 10px;background:var(--card2);border-right:2px solid var(--line)"><small style="color:var(--muted);font-weight:700">Structure</small><br>${a}</div><div style="flex:1 1 50%;padding:8px 10px"><small style="color:var(--muted);font-weight:700">Function</small><br>${b}</div></div>`;
function infoPanel(sim){const p=sim.p;
  if(p.view==='terms'){if(p.a===p.b)return '<h3>Directional terms</h3><p>Pick two different landmarks.</p>';const r=relate(p.a,p.b);
    const row=ax=>{const t=r[ax];return t?`<p><b>${AXNAME[ax]}:</b> ${sentence(p.a,t,p.b)}.</p>`:`<p><b>${AXNAME[ax]}:</b> <span style="color:var(--muted)">does not apply. ${r.why[ax]}</span></p>`;};
    let h=`<h3>The ${LM[p.a].n} (A) compared with the ${LM[p.b].n} (B)</h3>`+['si','ap','ml','pd','sd'].map(row).join('');
    if(atLeast('ap')&&r.side)h+=`<p><b>Same side or opposite side:</b> ${sentence(p.a,r.side,p.b)}. Ipsilateral means on the same side of the midline, and contralateral means on the opposite side.</p>`;
    h+=p.supine?'<p>The person is lying down, and every term above stayed the same. The terms always describe the body as if it stood in anatomical position.</p>':'<p style="color:var(--muted)">Every term assumes anatomical position: standing, facing forward, arms at the sides, palms forward.</p>';return h;}
  if(p.view==='practice'){const pr=sim.st.pr,it=prCur(sim);let h=`<h3>Fill in the blank</h3><p style="font-size:17px"><b>${prText(sim)}</b></p>`;
    if(pr.done){h+=`<p>${it.why}</p><div class="row"><button type="button" class="btn primary" data-pr="next">Next sentence</button></div>`;return h;}
    const cur=(it.b2&&pr.blank===1)?'second blank':(it.b2?'first blank':'blank');
    h+=`<p style="color:var(--muted)">Choose the word for the ${cur}. A and B on the figures mark the two structures.</p><div class="row" style="flex-wrap:wrap;gap:6px">`;
    const list=TERMS.concat(atLeast('ap')?[['ipsilateral','contralateral']]:[]);
    list.forEach(q=>q.forEach(t=>{h+=`<button type="button" class="btn" data-term="${t}">${t}</button>`;}));h+='</div>';
    if(pr.msg)h+=`<p style="margin-top:8px">${pr.msg}</p>`;
    if(pr.bad>=2)h+='<div class="row" style="margin-top:6px"><button type="button" class="btn" data-pr="show">Show the answer</button></div>';return h;}
  if(p.view==='planes'){const pl=PLANES[p.plane],v=cutVal(p),hits=cutHits(p.plane,v),reg=cutRegions(p.plane,v);const nm=p.plane==='sagittal'&&atLeast('honors')?(Math.abs(v)<.005?'<p>On the midline this is the <b>midsagittal</b> plane, which gives equal left and right parts. Off the midline it is a <b>parasagittal</b> plane.</p>':'<p>Off the midline this is a <b>parasagittal</b> plane. Only the midsagittal plane gives equal parts.</p>'):'';
    return `<h3>${pl.full}</h3><p>${pl.does}</p>${nm}<p><b>The cut sits</b> ${cutPos(p)}.</p><p><b>It passes through:</b> ${reg.concat(hits.map(s=>s.toLowerCase())).join(', ')||'nothing: it misses the body here'}.</p>${atLeast('honors')?`<p><b>Movement:</b> ${pl.ex}</p>`:''}<p><b>Real use:</b> ${pl.use}</p>`;}
  if(p.view==='cavities'){const c=CAVS[p.cavity];if(p.cavity==='all')return `<h3>Body cavities</h3><p>A cavity is a protected space that holds organs. Pick one to see what is inside.</p><p>The <b>diaphragm</b> separates the thoracic cavity from the abdominal cavity.</p>${atLeast('honors')?'<p>The cranial and spinal cavities make up the <b>dorsal</b> group. The thoracic, abdominal and pelvic cavities make up the <b>ventral</b> group.</p>':''}`;
    return `<h3>${c.n}</h3><p><b>Holds:</b> ${c.org.join(', ').toLowerCase()}.</p><p><b>Protection:</b> ${c.prot}</p><p>${c.note}</p>${atLeast('honors')?`<p><b>Group:</b> ${c.group} body cavity.</p>`:''}${c.deep&&atLeast('ap')?`<p>${c.deep}</p>`:''}`;}
  const s=SYS[p.system];return `<h3>${s.n} system</h3><p><b>Organs:</b> ${s.org}.</p><p><b>Function:</b> ${s.fn}</p>${dom(s.dom[0],s.dom[1])}${atLeast('honors')?`<p>${s.with}</p>`:''}`;}
function bindInfo(sim,el){const f=sim.st.refocus;sim.st.refocus=null;
  el.querySelectorAll('[data-term]').forEach(b=>b.addEventListener('click',()=>{prPick(sim,b.dataset.term);sim.st.refocus=sim.st.pr.done?'[data-pr=next]':'[data-term="'+b.dataset.term+'"]';BioLab.refresh(sim);}));
  el.querySelectorAll('[data-pr]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.pr==='next'){prNext(sim);sim.st.refocus='[data-term]';}else{prReveal(sim);sim.st.refocus='[data-pr=next]';}BioLab.refresh(sim);}));
  if(f){const t=el.querySelector(f);if(t)t.focus();}}

/* ---------- control visibility ---------- */
const CTLVIEW={a:['terms'],b:['terms'],supine:['terms'],plane:['planes'],cut:['planes'],cavity:['cavities'],system:['systems']};
function sync(sim){if(!sim.ui||!sim.ui.ctlW)return;const v=sim.p.view;Object.keys(CTLVIEW).forEach(id=>{const w=sim.ui.ctlW[id];if(w)w.hidden=!CTLVIEW[id].includes(v);});
  if(sim.ui.actB){if(sim.ui.actB.swap)sim.ui.actB.swap.hidden=v!=='terms';if(sim.ui.actB.next)sim.ui.actB.next.hidden=v!=='practice';}}

const opts=LMORDER.map(id=>({v:id,l:LM[id].n.charAt(0).toUpperCase()+LM[id].n.slice(1),lvl:LM[id].lvl}));
const base=extra=>Object.assign({view:'terms',a:'knee',b:'ankle',supine:false,plane:'sagittal',cut:50,cavity:'all',system:'respiratory'},extra);
const tourSet=extra=>sim=>{BioLab.setValues(sim,base(extra));};

const BODYMAP={
  id:'bodymap',hash:'bodymap',apUnit:9,order:1,kind:'Learning tool',tab:'Body map',
  card:'Compare any two landmarks, move a cut through the body, open each cavity and overlay the 11 organ systems.',
  title:'Body map: terms, planes and cavities',
  lede:{bio:'Learn the map that every other body lesson uses. Pick two landmarks and read how they relate, cut the body along a plane, look inside each cavity and overlay the organ systems.',
        honors:'Use the full set of directional terms, including superficial and deep, and connect each plane to the movements and medical images that use it.',
        ap:'Add ipsilateral and contralateral, the divisions inside the thoracic cavity, and the reasoning behind each comparison.'},
  scale:'One whole person in anatomical position, about 170 cm tall. The figure is a schematic: organ positions are approximate.',
  aspect:4/3,timeless:true,graph:false,chChange:1,chReveal:2,controlsTitle:'Choose what to explore',challengeTitle:'Check yourself',
  controls:[
    {id:'view',label:'View',type:'seg',def:'terms',lvl:'bio',noTrial:true,options:[{v:'terms',l:'Directional terms'},{v:'practice',l:'Practice'},{v:'planes',l:'Planes'},{v:'cavities',l:'Cavities'},{v:'systems',l:'Organ systems'}],onChange(sim){sync(sim);}},
    {id:'a',label:'Landmark A',type:'select',def:'knee',lvl:'bio',noTrial:true,options:opts,help:'Or click a dot on either figure. Clicks fill A, then B.'},
    {id:'b',label:'Landmark B',type:'select',def:'ankle',lvl:'bio',noTrial:true,options:opts},
    {id:'supine',label:'Lay the person down',help:'Lying on the back. See whether any term changes.',type:'toggle',def:false,lvl:'bio',noTrial:true},
    {id:'plane',label:'Plane',type:'seg',def:'sagittal',lvl:'bio',noTrial:true,options:[{v:'sagittal',l:'Sagittal'},{v:'frontal',l:'Frontal (coronal)'},{v:'transverse',l:'Transverse'}],onChange(sim){const d=sim.p.plane==='transverse'?30:50;sim.p.cut=d;if(sim.ui&&sim.ui.ctl&&sim.ui.ctl.cut)sim.ui.ctl.cut.set(d);}},
    {id:'cut',label:'Move the cut',type:'range',min:0,max:100,step:1,def:50,lvl:'bio',noTrial:true,help:'Or click a figure to place the cut.'},
    {id:'cavity',label:'Cavity',type:'seg',def:'all',lvl:'bio',noTrial:true,options:[{v:'all',l:'All'},{v:'cranial',l:'Cranial'},{v:'spinal',l:'Spinal'},{v:'thoracic',l:'Thoracic'},{v:'abdominal',l:'Abdominal'},{v:'pelvic',l:'Pelvic'}],help:'Or click a region of the figure.'},
    {id:'system',label:'Organ system',type:'seg',def:'respiratory',lvl:'bio',noTrial:true,options:SYSORDER.map(id=>({v:id,l:SYS[id].n})),help:'Or click an organ on the figure.'}
  ],
  actions:[
    {id:'swap',label:'Swap A and B',run(sim){BioLab.setValues(sim,{a:sim.p.b,b:sim.p.a});}},
    {id:'next',label:'Next sentence',primary:true,run(sim){prNext(sim);}}
  ],
  init(){return {pickB:false,pr:{i:0,blank:0,picks:[],msg:'',bad:0,done:false},refocus:null};},
  onLevel(sim){sync(sim);},
  initVis(sim){sync(sim);},
  metrics:[
    {id:'sel',label:'Looking at',unit:'',lvl:'bio',text:true,get(sim){const p=sim.p;if(p.view==='terms')return LM[p.a].n+' (A), '+LM[p.b].n+' (B)';if(p.view==='practice')return 'Practice sentence';if(p.view==='planes')return PLANES[p.plane].full;if(p.view==='cavities')return p.cavity==='all'?'All cavities':CAVS[p.cavity].n;return SYS[p.system].n+' system';}},
    {id:'find',label:'What it tells you',unit:'',lvl:'bio',text:true,get(sim){const p=sim.p;
      if(p.view==='terms'){if(p.a===p.b)return 'Pick two different landmarks';const r=relate(p.a,p.b),out=['si','ap','ml','pd','sd'].map(a=>r[a]).filter(Boolean);return out.length?'A is '+out.join(', ')+' to B':'Too close to compare';}
      if(p.view==='practice')return 'Fill in the blank below';
      if(p.view==='planes')return 'Divides the body into '+PLANES[p.plane].parts.join(' and ')+' parts';
      if(p.view==='cavities')return p.cavity==='all'?'Five cavities, split by the diaphragm':'Holds '+CAVS[p.cavity].org.join(', ').toLowerCase();
      return SYS[p.system].fn;}}
  ],
  narrate(sim){const p=sim.p;
    if(p.view==='terms'){if(p.a===p.b)return 'Pick two different landmarks to compare them.';const ax=mainAxis(p.a,p.b),r=relate(p.a,p.b);
      if(p.supine)return `<b>${ax?sentence(p.a,r[ax],p.b)+'.':'Nothing changed.'}</b> The person is lying down, and the terms did not change, because they always describe the body as if it stood in anatomical position.`;
      if(!ax)return 'These two landmarks sit too close together to compare at this scale. Try a pair farther apart.';
      return `<b>${sentence(p.a,r[ax],p.b)}.</b> ${ax==='pd'?'Proximal and distal compare two spots along one limb, measured from where it joins the trunk.':ax==='si'?'Superior means closer to the top of the head.':ax==='ap'?'Anterior means closer to the front of the body. The side view shows it.':ax==='ml'?'Medial means closer to the midline.':'Superficial means closer to the skin.'} The comparison always goes A to B, so swapping them flips the word.`;}
    if(p.view==='practice')return 'Read the sentence, find A and B on the figures, and choose the term. <b>Picture the body in anatomical position</b> before you answer.';
    if(p.view==='planes'){const pl=PLANES[p.plane];return `<b>${pl.does}</b> The cut sits ${cutPos(p)}.`;}
    if(p.view==='cavities')return p.cavity==='all'?'The side view shows two groups: <b>the cranial and spinal cavities</b> run along the back, and <b>the thoracic, abdominal and pelvic cavities</b> sit in front. The diaphragm divides the chest from the abdomen.':`<b>${CAVS[p.cavity].n}:</b> ${CAVS[p.cavity].org.join(', ').toLowerCase()}. ${CAVS[p.cavity].prot}`;
    const s=SYS[p.system];return `<b>${s.n} system.</b> ${s.fn} Structure: ${s.dom[0].charAt(0).toLowerCase()+s.dom[0].slice(1)}. Function: ${s.dom[1].charAt(0).toLowerCase()+s.dom[1].slice(1)}.`;},
  onClick(sim,x,y){const p=sim.p;
    if(p.view==='terms'&&!p.supine){let best=null,bd=46;visLM().forEach(id=>{const l=LM[id],pts=[FM(l.x,l.y),SM(l.z,l.y)];if(l.both)pts.push(FM(-l.x,l.y));pts.forEach(q=>{const d=Math.hypot(q.x-x,q.y-y);if(d<bd){bd=d;best=id;}});});if(!best)return;const key=sim.st.pickB?'b':'a';BioLab.setValues(sim,{[key]:best});sim.st.pickB=!sim.st.pickB;return;}
    if(p.view==='planes'){const fy=clamp((y-FR.top)/FR.h,0,1);if(p.plane==='transverse')BioLab.setValues(sim,{cut:Math.round(fy*100)});
      else if(p.plane==='sagittal'&&x<400)BioLab.setValues(sim,{cut:Math.round(clamp((x-FR.cx)/FR.h/.21*50+50,0,100))});
      else if(p.plane==='frontal'&&x>=400)BioLab.setValues(sim,{cut:Math.round(clamp((x-SD.cx)/(SD.h*1.05)/.09*50+50,0,100))});return;}
    if(p.view==='cavities'){const fy=(y-FR.top)/FR.h;const onSide=x>500,z=(x-(SD.cx+75))/(SD.h*1.05);let c=null;if(onSide&&Math.abs(z+.045)<.018&&fy>.1&&fy<.44)c='spinal';else if(fy>=0&&fy<.09)c='cranial';else if(fy>=.15&&fy<.268)c='thoracic';else if(fy>=.268&&fy<.408)c='abdominal';else if(fy>=.408&&fy<.5)c='pelvic';if(c)BioLab.setValues(sim,{cavity:c});return;}
    if(p.view==='systems'){const cx=215,top=62,h=525;let best=null,bd=40;Object.keys(ORG).forEach(id=>{const o=ORG[id],c=o.c;[1].concat(o.both?[-1]:[]).forEach(s=>{const d=Math.hypot(cx+s*c[0]*h-x,top+c[1]*h-y);if(d<bd){bd=d;best=o.sys;}});});if(best)BioLab.setValues(sim,{system:best});}},
  infoPanel,bindInfo,
  draw(sim,ctx,vdt,k){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,W,H);const v=sim.p.view;if(v==='terms'||v==='practice')drawTerms(sim,ctx,k);else if(v==='planes')drawPlanes(sim,ctx,k);else if(v==='cavities')drawCavities(sim,ctx,k);else drawSystems(sim,ctx,k);},
  tour:[
    {title:'Anatomical position',text:{bio:'Every term starts from one pose: standing, facing forward, arms at the sides, palms forward. All the terms assume this pose, even when the real person is lying on a table.'},focus:[100,50,260,545],setup:tourSet({})},
    {title:'Superior and inferior',text:'Superior means closer to the top of the head. Inferior means closer to the feet. Here the kidneys are inferior to the heart.',setup:tourSet({a:'kidneys',b:'heart'})},
    {title:'Anterior and posterior',text:'Anterior means toward the front. Posterior means toward the back. The side view shows the esophagus just in front of the spinal cord, so the esophagus is anterior to it.',focus:[480,50,310,545],setup:tourSet({a:'esophagus',b:'spinalcord'})},
    {title:'Medial and lateral',text:'Medial means closer to the midline. Lateral means farther from it. The nose sits on the midline, so it is medial to the ears.',focus:[100,50,260,250],setup:tourSet({a:'nose',b:'ear'})},
    {title:'Proximal and distal',text:'On a limb, proximal means closer to where the limb joins the trunk, and distal means farther. The knee is proximal to the ankle.',focus:[100,300,260,295],setup:tourSet({a:'knee',b:'ankle'})},
    {title:'Planes',text:'A plane is a flat cut through the body. A sagittal plane divides left from right, a frontal plane divides front from back, and a transverse plane divides top from bottom. CT and MRI images are slices along these planes.',setup:tourSet({view:'planes',plane:'transverse',cut:30})},
    {title:'Cavities',text:'Cavities are protected spaces that hold organs. The diaphragm divides the thoracic cavity, with the heart and lungs, from the abdominal cavity below it.',setup:tourSet({view:'cavities',cavity:'thoracic'})},
    {title:'Organ systems',text:'Eleven organ systems share the same space. Each one has a job, and its structures fit that job. Alveoli are thin and have a huge surface area because gases must cross them.',setup:tourSet({view:'systems',system:'respiratory'})}
  ],
  onTourExit(sim){sync(sim);},
  challenges:[
    {lvl:'bio',q:'In anatomical position, the thumb is ___ to the little finger.',choices:['Medial','Lateral','Proximal','Deep'],correct:['medial','lateral','proximal','deep'].indexOf(relate('thumb','pinky').ml),instant:true,show:{view:'terms',a:'thumb',b:'pinky'},
     explain:'The palms face forward in anatomical position, so the thumb points away from the midline. It stays lateral even if the person turns their palms backward, because the terms describe anatomical position.'},
    {lvl:'bio',q:'A patient lies flat on their back on a table. Is the knee still superior to the ankle?',choices:['No, they are at the same height now, so the term does not apply','Yes, the terms assume anatomical position however the person is lying','Only if the patient is sitting up'],correct:relate('knee','ankle').si==='superior'?1:0,instant:true,show:{view:'terms',a:'knee',b:'ankle',supine:true},
     explain:'Directional terms describe the body, not the room. The knee stays superior to the ankle and the head stays superior to the feet, no matter how the person is lying.'},
    {lvl:'bio',q:'Which plane divides the body into superior and inferior parts?',choices:['Sagittal','Frontal (coronal)','Transverse'],correct:['sagittal','frontal','transverse'].findIndex(k=>PLANES[k].parts.includes('superior')),instant:true,show:{view:'planes',plane:'transverse',cut:30},
     explain:'A transverse plane cuts straight across, like slicing a loaf of bread. CT scans of the abdomen are usually read in these slices.'},
    {lvl:'bio',q:'The stomach sits in which cavity?',choices:['Thoracic','Abdominal','Pelvic','Spinal'],correct:['thoracic','abdominal','pelvic','spinal'].indexOf(ORG.stomach.cav),instant:true,show:{view:'cavities',cavity:'abdominal'},
     explain:'The stomach sits just below the diaphragm, which is the floor of the thoracic cavity and the roof of the abdominal cavity.'},
    {lvl:'honors',q:'The heart is ___ to the sternum.',choices:['Anterior','Posterior','Superior','Lateral'],correct:['anterior','posterior','superior','lateral'].indexOf(relate('heart','sternum').ap),instant:true,show:{view:'terms',a:'heart',b:'sternum'},
     explain:'The sternum sits at the front of the chest, and the heart lies behind it. It is also deep to the sternum, which is why chest compressions in CPR press on the sternum to squeeze the heart.'},
    {lvl:'honors',q:'A classmate writes "the liver is proximal to the kidneys." What is wrong?',choices:['The liver is distal to the kidneys','Proximal and distal compare two spots on one limb, and the liver and kidneys are in the trunk','The liver should be called medial','Nothing is wrong'],correct:relate('liver','kidneys').pd===null?1:3,instant:true,show:{view:'terms',a:'liver',b:'kidneys'},
     explain:'Use superior, inferior, anterior and posterior for organs in the trunk. The liver is anterior to the kidneys. Proximal and distal belong on a limb here, measured from where it joins the trunk.'},
    {lvl:'honors',q:'What separates the thoracic cavity from the abdominal cavity?',choices:['The sternum','The diaphragm','The ribs','The pelvis'],correct:1,instant:true,show:{view:'cavities',cavity:'thoracic'},
     explain:'The diaphragm is a dome of muscle. It forms the floor of the thoracic cavity and the roof of the abdominal cavity, and it powers breathing.'},
    {lvl:'ap',q:'The brain is ___ to the skull.',choices:['Superficial','Deep','Proximal','Lateral'],correct:['superficial','deep','proximal','lateral'].indexOf(relate('brain','skull').sd),instant:true,show:{view:'terms',a:'brain',b:'skull'},
     explain:'Deep means farther from the surface. Moving in from the scalp, you reach the skull first and the brain next.'},
    {lvl:'ap',q:'Compare the liver with the stomach.',choices:['Ipsilateral: on the same side','Contralateral: on opposite sides','Proximal: closer to the trunk'],correct:relate('liver','stomach').side==='contralateral'?1:0,instant:true,show:{view:'terms',a:'liver',b:'stomach'},
     explain:'The liver sits mostly on the body’s right and the stomach mostly on the body’s left. The body’s right appears on your left when you face the person.'},
    {lvl:'ap',q:'A transverse CT slice sits about 55 cm below the top of the head in a 170 cm patient. Which structure does this model show in the slice?',choices:['Heart','Kidneys','Urinary bladder','Brain'],correct:['Heart','Kidneys','Urinary bladder','Brain'].findIndex(n=>cutHits('transverse',.325).includes(n)),instant:true,show:{view:'planes',plane:'transverse',cut:32},
     explain:'The slice falls at the level of the upper abdomen, below the diaphragm. The heart is above it and the bladder is below it. Radiologists read a stack of these slices from the bottom up.'}
  ],
  onChallenge(sim,ch,phase){if(phase==='done'&&ch&&ch.show){BioLab.setValues(sim,base(ch.show));BioLab.refresh(sim);}},
  lab:{bio:'<b>Question:</b> When does each pair of terms apply? <ol><li>Keep the <b>Directional terms</b> view. Pick the knee and the ankle, then press <b>Record trial</b>.</li><li>Record two more pairs: one on an arm, and one with an organ in the trunk.</li><li>Press <b>Swap A and B</b> and record again. What happens to each word?</li></ol><p><b>Write:</b> In your own words, say why proximal and distal do not apply to the heart and the kidneys.</p>',
       honors:'<b>Question:</b> When can two structures be compared with superficial and deep? <ol><li>Compare the sternum with the heart, then the ribs with the lungs. Record both.</li><li>Compare the heart with the kidneys. Record it, and read why the term does not apply.</li><li>In the <b>Planes</b> view, move a transverse cut until it passes through the heart. Then find the highest cut that passes through the kidneys.</li></ol><p><b>Write:</b> Name the plane you would use to see the ACL and PCL on one image, and explain why.</p>',
       ap:'<b>Question:</b> How would you describe an injury so another clinician can find it? <ol><li>Choose a spot on the forearm or the lower leg. Describe it using at least three pairs of terms.</li><li>Lay the person down and check that your description still holds.</li><li>Use <b>Cavities</b> to find which structures sit behind the sternum. Name their cavity and the division inside it.</li></ol><p><b>Write:</b> Write a two-sentence injury note for a cut 5 cm above the wrist on the thumb side, using proximal, lateral and anterior correctly.</p>'},
  terms:[
    {t:'Anatomical position',d:'Standing, facing forward, arms at the sides, palms forward. All directional terms assume it.'},
    {t:'Superior, inferior',d:'Closer to the top of the head; closer to the feet.'},
    {t:'Anterior, posterior',d:'Toward the front of the body; toward the back of the body.'},
    {t:'Medial, lateral',d:'Closer to the midline; farther from the midline.'},
    {t:'Proximal, distal',d:'On a limb: closer to where it joins the trunk; farther from it.'},
    {t:'Superficial, deep',d:'Closer to the body surface; farther from the surface.',lvl:'honors'},
    {t:'Ipsilateral, contralateral',d:'On the same side of the midline; on the opposite side.',lvl:'ap'},
    {t:'Sagittal plane',d:'Divides the body into left and right parts.'},
    {t:'Frontal (coronal) plane',d:'Divides the body into anterior and posterior parts.'},
    {t:'Transverse plane',d:'Divides the body into superior and inferior parts.'},
    {t:'Midsagittal, parasagittal',d:'A sagittal plane on the midline, giving equal halves; a sagittal plane off the midline.',lvl:'honors'},
    {t:'Diaphragm',d:'The dome of muscle between the thoracic and abdominal cavities.'},
    {t:'Dorsal and ventral body cavities',d:'Dorsal: cranial and spinal. Ventral: thoracic, abdominal and pelvic.',lvl:'honors'},
    {t:'Mediastinum',d:'The middle of the thoracic cavity, holding the heart, trachea and esophagus.',lvl:'ap'},
    {t:'Pleural and pericardial cavities',d:'The spaces around each lung and around the heart.',lvl:'ap'}
  ],
  about:'<p>All statements come from a table of 3D coordinates for each landmark, in anatomical position. The tool compares the numbers and writes the sentence, so the answer to a practice sentence comes from the same model as the view.</p><p><b>Simplified:</b> Organs are ellipsoids in schematic positions, and the figure is one generic body. Real positions vary with the person, with breathing and with posture. Spots closer than about 2.5 cm in height or 3.5 cm in depth or width count as "about the same" so that the tool does not claim a difference too small to trust.</p><p>Proximal and distal are limited to limbs here, which matches how the course uses them. Anatomists also use the terms along the digestive tract and along nerves and vessels. Medial and lateral are not reported between two spots on the same limb, except on the hand, because proximal and distal are the useful words there. Superficial and deep are reported only for structures on one path in from the same patch of skin. The tool compares only the body’s right limb for landmarks on the arm and leg, and paired organs are shown on both sides.</p><p>The 11 systems are the usual list, and many organs belong to more than one. The pancreas, for example, is both digestive and endocrine. Reproductive organs are shown as a schematic marker for both sexes.</p><p>The worksheet-style practice sentences follow the course’s Body Basics format.</p>'
};
BioLab.register(BODYMAP);
})();
