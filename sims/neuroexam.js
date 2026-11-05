(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;

/* Neuro exam: a simulated athlete. The cranial nerve table and the myotome and dermatome key mirror Ms. McKeon's notes and key.
   Viewer coordinates: the athlete faces you, so the athlete's right is on your left. gx > 0 means looking toward the athlete's left. */
const SIDE={R:'right',L:'left'},OTHER={R:'L',L:'R'};
function wrap(ctx,s,x,y,w,o){o=o||{};const size=o.s||13,lh=o.lh||size*1.26;ctx.font=(o.w||400)+' '+size+'px '+FONT;let line='',yy=y;
  String(s).split(' ').forEach(word=>{const t=line?line+' '+word:word;if(ctx.measureText(t).width>w&&line){txt(ctx,line,x,yy,{s:size,w:o.w,c:o.c,a:o.a});yy+=lh;line=word;}else line=t;});
  if(line){txt(ctx,line,x,yy,{s:size,w:o.w,c:o.c,a:o.a});yy+=lh;}return yy;}
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');

/* ---------- Cranial nerves: her table ---------- */
const CN=[
  {n:'I',name:'Olfactory',fn:'Smell',sup:'Gum, mint or coffee',tst:'Smell something strong',kw:/smell|olfact/i,skw:/gum|mint|coffee|scent|strong|smell/i},
  {n:'II',name:'Optic',fn:'Visual acuity and visual field',sup:'Something to read',tst:'Read something close and far',kw:/vis|acuity|sight|see|field/i,skw:/read|card|book|sign|chart|paper|text|phone/i},
  {n:'III',name:'Oculomotor',fn:'Eye movement, pupil size and reactivity (PEARL)',sup:'Penlight',tst:'Look ahead, move the light across, watch for constriction',kw:/eye|pupil|pearl|react/i,skw:/light/i},
  {n:'IV',name:'Trochlear',fn:'Eye movement down and lateral',sup:'Pen',tst:'Track the pen, check for nystagmus',kw:/eye|down|lateral/i,skw:/pen|finger|light/i},
  {n:'V',name:'Trigeminal',fn:'Chewing and facial sensation',sup:'Your hands',tst:'Pretend to chew, check sensation over forehead and nose',kw:/chew|sensation|feel|face|facial|bite/i,skw:/hand|finger|cotton|touch|none|nothing/i},
  {n:'VI',name:'Abducens',fn:'Lateral eye movement',sup:'Pen',tst:'Track the pen out to each side',kw:/eye|lateral/i,skw:/pen|finger|light/i},
  {n:'VII',name:'Facial',fn:'Facial expression',sup:'None',tst:'Look surprised, angry, eyes wide, smile',kw:/express|face|facial|smile/i,skw:/none|nothing|no |instruction|command|n\/a/i},
  {n:'VIII',name:'Vestibulocochlear',fn:'Hearing and balance',sup:'Your hands',tst:'BESS test and hearing eval',kw:/hear|balance/i,skw:/hand|finger|none|nothing|no /i},
  {n:'IX',name:'Glossopharyngeal',fn:'Gagging and swallowing',sup:'Cup of water',tst:'Yawn, give them something to drink',kw:/gag|swallow/i,skw:/water|drink|cup/i},
  {n:'X',name:'Vagus',fn:'Pharynx / Larynx Sensation & Swallow',sup:'Cup of water',tst:'Have athlete swallow drink & say ahhhh',kw:/pharyn|laryn|swallow|throat|voice/i,skw:/water|drink|cup|none|nothing/i},
  {n:'XI',name:'Accessory (Spinal Accessory)',fn:'Shoulder Shrugging / Head Rotation',sup:'Your hands',tst:'Have athlete pretend to put a purse on / shoulder shrug',kw:/shrug|shoulder|head|rotat|turn/i,skw:/hand|none|nothing/i},
  {n:'XII',name:'Hypoglossal',fn:'Tongue Movement / Speech',sup:'None',tst:'Have athlete stick their tongue out straight',kw:/tongue|speech/i,skw:/none|nothing|no |n\/a|instruction/i}];
const cnBy=n=>CN.find(c=>c.n===n);
const SUP=[{v:'scent',l:'Something strong to smell (gum, mint, coffee)'},{v:'card',l:'Something to read, close and far'},{v:'light',l:'Penlight'},{v:'pen',l:'Pen'},{v:'hands',l:'Your hands'},{v:'water',l:'Cup of water'},{v:'none',l:'No supply, just instructions'}];
const supName=v=>(SUP.find(s=>s.v===v)||{}).l||'';
const TESTS=[
  {id:'smell',n:'I',l:'Smell something strong, one nostril at a time',sup:['scent']},
  {id:'read',n:'II',l:'Read something close and far, one eye at a time',sup:['card']},
  {id:'pupil',n:'III',l:'Look ahead, move a light across, watch the pupils',sup:['light']},
  {id:'down',n:'IV',l:'Track an object down and out, check for nystagmus',sup:['pen','light']},
  {id:'chew',n:'V',l:'Pretend to chew, check sensation over forehead and nose',sup:['hands']},
  {id:'lat',n:'VI',l:'Track an object out to each side',sup:['pen','light']},
  {id:'face',n:'VII',l:'Look surprised, angry, eyes wide, then smile',sup:['none']},
  {id:'hear',n:'VIII',l:'BESS test and hearing eval',sup:['hands']},
  {id:'swal',n:'IX',l:'Yawn, give them something to drink',sup:['water']},
  {id:'ahh',n:'X',l:'Swallow a drink and say ahhhh',sup:['water']},
  {id:'shrug',n:'XI',l:'Pretend to put a purse on / shoulder shrug, then turn the head',sup:['hands']},
  {id:'tongue',n:'XII',l:'Stick the tongue out straight, then speak',sup:['none']}];
const testBy=id=>TESTS.find(t=>t.id===id);
const testOfNerve=n=>TESTS.find(t=>t.n===n);
/* one nerve can make more than one test look wrong: the pupil reflex comes in on II and goes out on III */
const ABN={smell:['I'],read:['II'],pupil:['II','III'],down:['IV','III'],chew:['V'],lat:['VI','III'],face:['VII'],hear:['VIII'],swal:['IX','X'],ahh:['X'],shrug:['XI'],tongue:['XII']};
const isAbn=(t,def)=>!!def&&ABN[t].includes(def.n);

/* Pose: everything the athlete's face and shoulders can do. Numbers ease toward their targets. */
const NEUTRAL={gx:0,gy:0,pupR:3.5,pupL:3.5,lidR:1,lidL:1,browR:0,browL:0,smR:0,smL:0,dpR:0,dpL:0,mouth:0,chew:0,jaw:0,tongue:0,tx:0,uv:0,shR:0,shL:0,turn:0,tilt:0,glR:0,glL:0,gxR:0,gxL:0,gyR:0,gyL:0,cup:0};
const FLAGS={scent:null,light:null,pen:false,card:false,cover:null,touch:null,ear:null,hands:false,push:null,sway:false};
function finishPose(T,def){const D=def&&def.side,a=n=>def&&def.n===n;
  T.gxR=T.gx;T.gxL=T.gx;T.gyR=T.gy;T.gyL=T.gy;
  const set=(k,side,v)=>{T[k+side]=v;};
  if(a('VI')){if(D==='L')T.gxL=Math.min(T.gxL,.04);else T.gxR=Math.max(T.gxR,-.04);}
  if(a('IV'))set('gy',D,Math.min(T['gy'+D],.12));
  if(a('III')){const out=D==='L'?1:-1;T['gx'+D]=out*Math.max(.55,out*T.gx);T['gy'+D]=.42;T['lid'+D]=.5;}
  if(a('VII')){T['brow'+D]=0;T['sm'+D]=0;T['dp'+D]=1;T['lid'+D]=Math.max(T['lid'+D],1.08);}
  if(a('XI')){T['sh'+D]=Math.min(T['sh'+D],5)-9;if((D==='L'&&T.turn<0)||(D==='R'&&T.turn>0))T.turn*=.25;}
  if(a('XII')&&T.tongue>0){const to=D==='L'?1:-1;T.tx=to*Math.max(.55,to*T.tx);}
  if(a('V')&&(T.mouth>0||T.chew>0))T.jaw=D==='L'?1:-1;
  if(a('X')&&T.mouth>.5)T.uv=D==='L'?-1:1;
  // pupils: light in one eye normally narrows both. Input runs on II, output on III.
  const lit=T.lightOn,II=a('II'),III=a('III');
  let bothNarrow=!!lit;if(II&&lit===D)bothNarrow=false;
  T.pupR=bothNarrow?2:3.5;T.pupL=bothNarrow?2:3.5;
  if(III)T['pup'+D]=6;
  if(lit){T.glR=lit==='R'?1:0;T.glL=lit==='L'?1:0;}
  return T;}
/* The test scripts: beats the athlete acts out, and what the student can read off in the end. */
function script(id,def){const hit=(n,s)=>!!def&&def.n===n&&def.side===s,D=def&&def.side;const a=n=>!!def&&def.n===n;
  const lr=f=>({R:f('R'),L:f('L')});
  switch(id){
    case'smell':return {beats:[{d:.5,set:{scent:'R'}},{d:1.7,set:{scent:'R'},say:hit('I','R')?'Nothing. I can’t smell anything there.':'That’s mint.'},{d:.5,set:{scent:'L'}},{d:1.7,set:{scent:'L'},say:hit('I','L')?'Nothing. I can’t smell anything there.':'That’s mint.'}],
      find:lr(s=>hit('I',s)?'Smells nothing through this nostril.':'Names the scent right away.')};
    case'read':{const say=s=>hit('II',s)?'It’s blurry. I only get the big E, and I miss things off to the side.':'E F P T O Z, and I can read the far sign too.';
      return {beats:[{d:.5,set:{card:true,cover:'L'}},{d:2,set:{card:true,cover:'L'},say:say('R')},{d:.5,set:{card:true,cover:'R'}},{d:2,set:{card:true,cover:'R'},say:say('L')}],
      find:lr(s=>hit('II',s)?'This eye reads poorly close and far, and misses the side of the field.':'This eye reads close and far, and sees to the side.')};}
    case'pupil':return {beats:[{d:.7,set:{}},{d:1.7,set:{lightOn:'R'}},{d:.8,set:{}},{d:1.7,set:{lightOn:'L'}},{d:.4,set:{}}],
      find:a('III')?lr(s=>s===D?'Pupil stays wide and does not constrict. The lid droops.':'Pupil is a normal size and constricts.'):a('II')?lr(s=>s===D?'Light in this eye: neither pupil constricts.':'Light in this eye: both pupils constrict.'):{R:'Pupil constricts quickly and matches the other.',L:'Pupil constricts quickly and matches the other.'}};
    case'down':{const say=s=>(a('IV')||a('III'))?'I see two of them when you go down there.':'Got it.';
      return {beats:[{d:.4,set:{pen:true}},{d:1.8,set:{pen:true,gx:-.85,gy:.8},say:say('R')},{d:.5,set:{pen:true}},{d:1.8,set:{pen:true,gx:.85,gy:.8},say:say('L')},{d:.3,set:{pen:true}}],
      find:a('IV')?lr(s=>s===D?'When the object goes down, this eye stays high. The athlete sees double.':'Follows smoothly with no jerking.'):a('III')?lr(s=>s===D?'This eye rests low and out, and hardly moves.':'Follows smoothly with no jerking.'):{both:'Both eyes follow smoothly and together. No nystagmus (no jerking).'}};}
    case'chew':{const say=(s)=>hit('V',s)?'I can barely feel that side.':'Yes, I feel that.';
      return {beats:[{d:1.8,set:{chew:1},say:'(pretends to chew)'},{d:1.1,set:{touch:['R',0]},say:say('R')},{d:1.1,set:{touch:['R',1]},say:say('R')},{d:1.1,set:{touch:['L',0]},say:say('L')},{d:1.1,set:{touch:['L',1]},say:say('L')}],
      find:lr(s=>hit('V',s)?'Barely feels touch on forehead and beside the nose. The jaw pulls toward this side.':'Feels touch on forehead and beside the nose. Chews strongly.')};}
    case'lat':{const say=s=>(hit('VI',s)||hit('III',s))?'Now I see two of them.':'Got it.';
      return {beats:[{d:.4,set:{pen:true}},{d:1.8,set:{pen:true,gx:-1},say:say('R')},{d:.5,set:{pen:true}},{d:1.8,set:{pen:true,gx:1},say:say('L')},{d:.3,set:{pen:true}}],
      find:a('VI')?lr(s=>s===D?'Looking out to this side, this eye stops at the middle. The athlete sees double.':'This eye moves all the way out.'):a('III')?lr(s=>s===D?'This eye rests low and out, and will not move in toward the nose.':'This eye moves all the way out.'):{both:'Both eyes move all the way out to each side, together.'}};}
    case'face':return {beats:[{d:1.2,set:{browR:1,browL:1,mouth:.25,lidR:1.2,lidL:1.2},say:'(surprised)'},{d:1.2,set:{browR:-1,browL:-1},say:'(angry)'},{d:1.2,set:{lidR:1.35,lidL:1.35,browR:.6,browL:.6},say:'(eyes wide)'},{d:1.4,set:{smR:1,smL:1},say:'(smiles)'}],
      find:a('VII')?lr(s=>s===D?'Brow stays flat, the mouth corner droops and will not lift.':'Brow and mouth move normally.'):{both:'Both sides of the face move the same.'}};
    case'hear':{const say=s=>hit('VIII',s)?'I don’t hear anything on that side.':'I hear that.';const ba=a('VIII');
      return {beats:[{d:1.6,set:{ear:'R'},say:say('R')},{d:1.6,set:{ear:'L'},say:say('L')},{d:2.2,set:{sway:ba,tilt:0,lidR:.08,lidL:.08},say:ba?'(eyes closed, sways and steps out of position)':'(eyes closed, stands steady)'}],
      find:Object.assign(lr(s=>hit('VIII',s)?'Does not hear the finger rub at this ear.':'Hears the finger rub at this ear.'),{both:ba?'Balance: sways and steps, many BESS errors.':'Balance: steady, few BESS errors.'})};}
    case'swal':{const bad=a('IX')||a('X');
      return {beats:[{d:1.5,set:{mouth:1,lidR:.5,lidL:.5},say:'(yawns)'},{d:.8,set:{cup:1}},{d:1.5,set:{cup:1},say:bad?'(coughs) That felt wrong going down.':'(swallows) Fine.'}],
      find:bad?lr(s=>s===D?'Coughs on the sip. Swallowing feels wrong on this side of the throat.':'No trouble felt on this side of the throat.'):{both:'Yawns fully and swallows the sip with no cough.'}};}
    case'ahh':{const bad=a('X');
      return {beats:[{d:.7,set:{cup:1}},{d:1.5,set:{cup:1},say:bad?'(coughs)':'(swallows) Fine.'},{d:2,set:{mouth:1},say:bad?'(hoarse) Ahhhh.':'(clear) Ahhhh.'}],
      find:bad?lr(s=>s===D?'Hoarse voice. The palate does not lift on this side, so the uvula pulls away from it. Coughs on the sip.':'The palate lifts on this side.'):{both:'Clear voice. The uvula stays in the middle. Swallows cleanly.'}};}
    case'shrug':return {beats:[{d:1.6,set:{hands:true,shR:14,shL:14},say:'(pretends to put a purse on, then shrugs against your hands)'},{d:1.5,set:{push:'R',turn:-1},say:'(turns toward the right)'},{d:1.5,set:{push:'L',turn:1},say:'(turns toward the left)'}],
      find:lr(s=>hit('XI',s)?'Shoulder gives way against your push. Turning the head away from this side is weak.':'Shoulder holds against your push. Head turn is strong.')};
    case'tongue':{const bad=a('XII');return {beats:[{d:2,set:{mouth:.6,tongue:1},say:'(sticks the tongue out)'},{d:1.4,set:{mouth:.25},say:bad?'(slurred) Testing one, two, three.':'(clearly) Testing one, two, three.'}],
      find:a('XII')?{both:'The tongue points toward the athlete’s '+SIDE[D]+' side when stuck out. Speech is slurred.'}:{both:'The tongue comes out straight. Speech is clear.'}};}
  }
  return {beats:[],find:{}};}

/* ---------- Myotomes and dermatomes: her key ---------- */
const RT=[
  {id:'C1C2',root:'C1/C2',mo:'Neck flexion and extension',skin:null},
  {id:'C3',root:'C3',mo:'Neck lateral flexion',skin:null},
  {id:'C4',root:'C4',mo:'Shoulder elevation',skin:'Collarbone area'},
  {id:'C5',root:'C5',mo:'Shoulder abduction',skin:'Anterior and lateral shoulder'},
  {id:'C6',root:'C6',mo:'Elbow flexion and wrist extension',skin:'Thumb'},
  {id:'C7',root:'C7',mo:'Elbow extension and wrist flexion',skin:'Middle finger'},
  {id:'L1L2',root:'L1/L2',mo:'Hip flexion',skin:'Medial thigh'},
  {id:'L3',root:'L3',mo:'Knee extension',skin:'Medial knee'},
  {id:'L4',root:'L4',mo:'Ankle dorsiflexion',skin:'Medial ankle and great toe'},
  {id:'L5',root:'L5',mo:'Toe extension',skin:'Top of foot'}];
const rtBy=id=>RT.find(r=>r.id===id);
/* dermatome regions in BioLab.body coordinates, on one side (x > 0); painted clipped to the figure */
const REG={
  C4:[[[.03,.135],[.09,.15],[.125,.172],[.09,.188],[.02,.178]]],
  C5:[[[.098,.168],[.16,.175],[.17,.27],[.112,.3],[.095,.24]]],
  C6:[[[.196,.495],[.225,.495],[.225,.556],[.2,.556]]],
  C7:[[[.183,.55],[.2,.55],[.2,.58],[.183,.58]]],
  L1L2:[[[.003,.5],[.055,.5],[.055,.66],[.012,.66]]],
  L3:[[[.012,.685],[.05,.685],[.05,.765],[.012,.765]]],
  L4:[[[.018,.915],[.044,.915],[.044,.958],[.018,.958]],[[.018,.973],[.052,.973],[.052,1.01],[.018,1.01]]],
  L5:[[[.044,.94],[.08,.94],[.105,.985],[.056,.972]]]};
const REGC={C4:[.07,.16],C5:[.13,.22],C6:[.205,.525],C7:[.192,.565],L1L2:[.03,.58],L3:[.03,.725],L4:[.035,.945],L5:[.07,.96]};
/* strength pictures. Angles in degrees, 0 = right, 90 = down. poses: start, then each motion in the test. */
const PIC={
  C1C2:{base:[.5,.98],segs:[62,18],head:true,poses:[[-90,-90],[-90,-52],[-90,-122]],push:1,arrow:[1,0],moving:1},
  C3:{base:[.5,.98],segs:[62,18],head:true,bar:true,poses:[[-90,-90],[-90,-58]],push:1,arrow:[-1,0],moving:1},
  C4:{base:[.28,.42],segs:[70,78],poses:[[8,90],[-14,90]],push:0,arrow:[0,1],moving:0,torso:true},
  C5:{base:[.28,.25],segs:[52,44],poses:[[86,86],[0,0]],push:1,arrow:[0,1],moving:0,torso:true},
  C6:{base:[.26,.16],segs:[66,56,24],poses:[[90,74,74],[90,0,0],[90,0,-42]],push:1,arrow:[0,1],moving:1},
  C7:{base:[.26,.16],segs:[66,56,24],poses:[[90,0,0],[90,58,58],[90,0,42]],push:1,arrow:[-1,-1],moving:1},
  L1L2:{base:[.2,.42],segs:[78,70],poses:[[0,90],[-26,64]],push:0,arrow:[0,1],moving:0,seat:true},
  L3:{base:[.14,.32],segs:[72,72],poses:[[0,90],[0,12]],push:1,arrow:[0,1],moving:1,seat:true},
  L4:{base:[.3,.12],segs:[92,54],poses:[[90,24],[90,-16]],push:1,arrow:[0,1],moving:1},
  L5:{base:[.12,.5],segs:[100,34],poses:[[0,0],[0,-36]],push:1,arrow:[0,1],moving:1}};

/* ---------- state ---------- */
const P=sim=>sim.p;
const inLab=(sim,id)=>!!(sim.vlab&&sim.vlab.lab.id===id);
function curCN(sim){if(sim.st&&sim.st.forced&&sim.st.forced.n)return sim.st.forced;if(inLab(sim,'cranial-nerve'))return sim.vlab.bench.cn||null;if(sim.vlab)return null;
  if(sim.p.ath==='shown'){const t=testBy(sim.p.test);return {n:t.n,side:'L'};}
  if(sim.p.ath==='hidden')return sim.st.hid.cn;return null;}
function curRoot(sim){if(sim.st&&sim.st.forced&&sim.st.forced.r)return sim.st.forced;if(inLab(sim,'myotome-dermatome'))return sim.vlab.bench.root||null;if(sim.vlab)return null;
  if(sim.p.ath==='shown')return {r:sim.p.mtest,side:'L',grade:3};
  if(sim.p.ath==='hidden')return sim.st.hid.root;return null;}
const concealed=sim=>!!(sim.p.ath==='hidden'&&!sim.vlab);
function hideRoot(sim){return concealed(sim)||inLab(sim,'myotome-dermatome');}
function newHidden(s){const g=rng(Math.floor(Math.random()*2147483646)+1);
  const skinRoots=RT.filter(r=>r.skin);
  s.hid={cn:{n:CN[Math.floor(g()*CN.length)].n,side:g()<.5?'R':'L'},root:{r:skinRoots[Math.floor(g()*skinRoots.length)].id,side:g()<.5?'R':'L',grade:g()<.5?3:4}};
  s.log={};s.mlog={};s.fb=null;s.run=null;s.m=null;}
function fresh(){const s={pose:Object.assign({},NEUTRAL),flags:Object.assign({},FLAGS),run:null,m:null,log:{},mlog:{},fb:null,forced:null,last:'',pupR:3.5,pupL:3.5};finishPose(s.pose,null);newHidden(s);return s;}
function runTest(sim){const s=sim.st,tid=sim.p.test,t=testBy(tid);s.fb=null;
  const ok=t.sup.includes(sim.p.supply),def=curCN(sim);
  if(!ok){s.run={test:tid,supply:sim.p.supply,ok:false,beats:[{d:1.2,set:{}}],i:0,t:0,done:false,find:{},say:'What do you want me to do with that?'};return;}
  const sc=script(tid,def);s.run={test:tid,supply:sim.p.supply,ok:true,beats:sc.beats,i:0,t:0,done:false,find:sc.find,say:''};
  /* it is safe to log now: the student still has to watch the response to read it off */
  s.log[tid]={find:sc.find,abn:isAbn(tid,def)};
  if(inLab(sim,'cranial-nerve')){const b=sim.vlab.bench;b.done=b.done||{};b.done[tid]=true;}}
function runM(sim,mode){const s=sim.st,rid=sim.p.mtest,r=rtBy(rid),def=curRoot(sim);s.fb=null;
  s.m={mode,test:rid,t:0};s.mlog[rid]=s.mlog[rid]||{};
  const hit=!!def&&def.r===rid;
  if(mode==='str'){s.mlog[rid].str=true;}else if(r.skin){s.mlog[rid].sen=true;}
  if(inLab(sim,'myotome-dermatome')){const b=sim.vlab.bench;b.mdone=b.mdone||{};b.mdone[rid]=b.mdone[rid]||{};if(mode==='str')b.mdone[rid].str=true;else b.mdone[rid].sen=true;}
  return hit;}
const curFind=(sim)=>{const s=sim.st;if(s.run&&s.run.ok&&s.run.done)return s.run.find;return null;};
function findText(f){if(!f)return '';return [f.R?'Right: '+f.R:'',f.L?'Left: '+f.L:'',f.both||''].filter(Boolean).join(' ');}
function mFindings(sim,rid){const def=curRoot(sim),hit=!!def&&def.r===rid,r=rtBy(rid);const lr=s=>hit&&def.side===s;
  return {str:s=>lr(s)?'Gives way':'Holds',grade:s=>lr(s)?(def.grade||3):5,sen:s=>!r.skin?'':lr(s)?'Feels dull':'Feels normal'};}
function guessCheck(sim){const s=sim.st;if(sim.p.view==='cn'){const d=curCN(sim);if(!d){s.fb={ok:false,t:'This athlete has no hidden deficit. Set Athlete to Hidden deficit first.'};return;}
    const hon=atLeast('honors'),okN=sim.p.guessN===d.n,okS=!hon||sim.p.guessSide===d.side;
    if(okN&&okS)s.fb={ok:true,t:'Yes. Nerve '+d.n+', '+cnBy(d.n).name+', on the athlete’s '+SIDE[d.side]+' side. '+cnBy(d.n).fn+' is its job, and that is what looked different.'};
    else if(okN)s.fb={ok:false,t:'You have the nerve. Now compare the two sides again: which side was different?'};
    else s.fb={ok:false,t:'Not that one yet. Find the test that looks different between the two sides. Then ask which nerve does that job.'};}
  else{const d=curRoot(sim);if(!d){s.fb={ok:false,t:'This athlete has no hidden deficit. Set Athlete to Hidden deficit first.'};return;}
    const hon=atLeast('honors'),okN=sim.p.guessR===d.r,okS=!hon||sim.p.guessSide===d.side,r=rtBy(d.r);
    if(okN&&okS)s.fb={ok:true,t:'Yes. '+r.root+' on the athlete’s '+SIDE[d.side]+' side: '+r.mo.toLowerCase()+' is weak and the '+r.skin.toLowerCase()+' feels dull.'};
    else if(okN)s.fb={ok:false,t:'You have the root. Now compare the two sides: which side was weak?'};
    else s.fb={ok:false,t:'Not that one yet. Look for the row where one side is weak and the skin area feels dull on that same side. Then check your key.'};}}

/* ---------- visibility ---------- */
function sync(sim){if(!sim.ui||!sim.ui.ctlW||sim.vlab)return;const v=sim.p.view,hid=sim.p.ath==='hidden';
  sim.def.controls.forEach(c=>{const w=sim.ui.ctlW[c.id];if(!w)return;let on=atLeast(c.lvl)&&(!c.vw||c.vw===v);if(c.hidOnly&&!hid)on=false;w.hidden=!on;});
  sim.def.actions.forEach(a=>{const b=sim.ui.actB[a.id];if(!b)return;let on=atLeast(a.lvl)&&(!a.vw||a.vw===v);if(a.hidOnly&&!hid)on=false;b.hidden=!on;});
  sim.def.metrics.forEach(m=>{const t=sim.ui.tiles&&sim.ui.tiles[m.id];if(!t)return;const el=t.num.closest('.tile');if(el)el.hidden=!atLeast(m.lvl)||(!!m.vw&&m.vw!==v);});}

/* ---------- drawing: the athlete's head and shoulders ---------- */
const SCLERA='#f6f6f1',IRIS='#4b7ea8',PUPIL='#14141a',MOUTH='#4b2226',TONGUE='#d77f8c',RED='#C11430';
function drawEye(ctx,x,y,gx,gy,pup,lid,gl){const W=27,H=15*clamp(lid,.05,1.4);ctx.save();ctx.beginPath();ctx.moveTo(x-W,y);ctx.quadraticCurveTo(x,y-H*1.55,x+W,y);ctx.quadraticCurveTo(x,y+Math.max(4,H*1.05),x-W,y);ctx.closePath();
  ctx.fillStyle=SCLERA;ctx.fill();ctx.clip();const ix=x+gx*15,iy=y+gy*9;
  ctx.fillStyle=IRIS;ctx.beginPath();ctx.arc(ix,iy,13.5,0,6.2832);ctx.fill();ctx.fillStyle=PUPIL;ctx.beginPath();ctx.arc(ix,iy,pup*1.75,0,6.2832);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.arc(ix-4,iy-4,2,0,6.2832);ctx.fill();
  if(gl>.05){const g=ctx.createRadialGradient(ix,iy,1,ix,iy,30);g.addColorStop(0,'rgba(255,240,170,'+.9*gl+')');g.addColorStop(1,'rgba(255,240,170,0)');ctx.fillStyle=g;ctx.fillRect(x-40,y-30,80,60);}
  ctx.restore();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-W,y);ctx.quadraticCurveTo(x,y-H*1.55,x+W,y);ctx.quadraticCurveTo(x,y+Math.max(4,H*1.05),x-W,y);ctx.closePath();ctx.stroke();}
function hand(ctx,x,y,r){ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(x,y,r*1.25,r,0,0,6.2832);ctx.fill();ctx.stroke();}
function arrowLine(ctx,x0,y0,x1,y1,c,lw){const a=Math.atan2(y1-y0,x1-x0),h=9;ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=lw||3.5;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1-h*Math.cos(a),y1-h*Math.sin(a));ctx.stroke();ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1-h*1.6*Math.cos(a-.5),y1-h*1.6*Math.sin(a-.5));ctx.lineTo(x1-h*1.6*Math.cos(a+.5),y1-h*1.6*Math.sin(a+.5));ctx.closePath();ctx.fill();}
function drawAthlete(sim,ctx,k,t){const s=sim.st,p=s.pose,f=s.flags;const cx=240,cy0=205;
  const sway=f.sway&&!RM?Math.sin(t*2.6)*9:0;const hx=cx+p.turn*13+sway,hy=cy0,ch=p.chew>0&&!RM?(Math.sin(t*9)+1)*.5*p.chew:0;const open=Math.max(p.mouth,ch*.35);
  // shoulders and jersey
  const yS=398,lsh=yS-p.shL,rsh=yS-p.shR;ctx.fillStyle=RED;ctx.beginPath();ctx.moveTo(cx-205+sway*.3,533);ctx.lineTo(cx-200+sway*.3,rsh+22);ctx.quadraticCurveTo(cx-170+sway*.3,rsh-8,cx-70+sway*.6,rsh-26);ctx.lineTo(cx+70+sway*.6,lsh-26);ctx.quadraticCurveTo(cx+170+sway*.3,lsh-8,cx+200+sway*.3,lsh+22);ctx.lineTo(cx+205+sway*.3,533);ctx.closePath();ctx.fill();
  txt(ctx,'RJ',cx+sway*.4,478,{s:44,w:800,c:'#ffffff',a:'center',b:'middle'});
  // neck
  ctx.fillStyle=PAL['card2'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(hx-40,300);ctx.lineTo(cx-52+sway*.6,Math.min(lsh,rsh)-10);ctx.quadraticCurveTo(cx+sway*.6,Math.min(lsh,rsh)+18,cx+52+sway*.6,Math.min(lsh,rsh)-10);ctx.lineTo(hx+40,300);ctx.closePath();ctx.fill();ctx.stroke();
  // head
  const fx=p.turn*28,rx=94-Math.abs(p.turn)*5,ry=122;
  ctx.beginPath();ctx.ellipse(hx-rx-1,hy+4,8,20,0,0,6.2832);ctx.moveTo(hx+rx+9,hy+4);ctx.ellipse(hx+rx+1,hy+4,8,20,0,0,6.2832);ctx.fillStyle=PAL['card2'];ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.ellipse(hx,hy,rx,ry,0,0,6.2832);ctx.fill();ctx.stroke();
  // hair
  ctx.save();ctx.beginPath();ctx.ellipse(hx,hy,rx,ry,0,0,6.2832);ctx.clip();ctx.fillStyle=PAL['cv-soft'];ctx.beginPath();ctx.ellipse(hx,hy-ry-6,rx+14,46,0,0,6.2832);ctx.fill();ctx.restore();
  const eyeY=hy-22,exR=hx+fx-41,exL=hx+fx+41;
  drawEye(ctx,exR,eyeY,p.gxR+p.turn*.2,p.gyR,p.pupR,p.lidR,p.glR);drawEye(ctx,exL,eyeY,p.gxL+p.turn*.2,p.gyL,p.pupL,p.lidL,p.glL);
  // brows
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=4;ctx.lineCap='round';
  [[exR,p.browR,1],[exL,p.browL,-1]].forEach(([x,b,dir])=>{const up=b*12,inner=b<0?-b*10:0;ctx.beginPath();ctx.moveTo(x-dir*28,eyeY-26-up);ctx.quadraticCurveTo(x,eyeY-34-up,x+dir*26,eyeY-26-up+inner);ctx.stroke();});
  // nose
  ctx.lineWidth=2;ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(hx+fx*1.15,eyeY+8);ctx.lineTo(hx+fx*1.2-9,hy+28);ctx.quadraticCurveTo(hx+fx*1.2,hy+36,hx+fx*1.2+9,hy+28);ctx.stroke();
  // mouth
  const mx=hx+fx+p.jaw*8*Math.min(1,open*2+(p.chew>0?1:0)),my=hy+62,cR=my-p.smR*11+p.dpR*11,cL=my-p.smL*11+p.dpL*11;
  ctx.lineWidth=3;ctx.strokeStyle=PAL['cv-ink'];
  if(open>.05||p.tongue>.05){const oh=clamp(open,.15,1)*30;ctx.fillStyle=MOUTH;ctx.beginPath();ctx.moveTo(mx-34,cR);ctx.quadraticCurveTo(mx,my-oh*.55,mx+34,cL);ctx.quadraticCurveTo(mx,my+oh*1.25,mx-34,cR);ctx.closePath();ctx.fill();ctx.stroke();
    if(p.mouth>.5&&p.tongue<.05){const uvx=mx+p.uv*9;ctx.fillStyle=TONGUE;ctx.beginPath();ctx.ellipse(uvx,my-2+oh*.02,3.6,8,0,0,6.2832);ctx.fill();}
    if(p.tongue>.05){const tx=mx+p.tx*30,ty=my+8+p.tongue*30;ctx.strokeStyle=TONGUE;ctx.lineWidth=20;ctx.beginPath();ctx.moveTo(mx,my+6);ctx.quadraticCurveTo(mx,ty-4,tx,ty);ctx.stroke();ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(mx,my+10);ctx.quadraticCurveTo(mx,ty-6,tx,ty+4);ctx.stroke();}}
  else{ctx.beginPath();ctx.moveTo(mx-34,cR);ctx.quadraticCurveTo(mx,my+3+(p.smR+p.smL)*5,mx+34,cL);ctx.stroke();}
  ctx.lineCap='butt';
  // props
  const sign=side=>side==='R'?-1:1;
  if(f.scent){const x=hx+fx+sign(f.scent)*32,y=hy+40;ctx.fillStyle='#3f9e7a';rr(ctx,x-15,y,30,14,3);ctx.fill();txt(ctx,'mint',x,y+7,{s:10,w:700,c:'#fff',a:'center',b:'middle'});}
  if(f.card){const cxx=cx-180,cy=250;ctx.fillStyle='#fbfbf6';ctx.strokeStyle=PAL['cv-soft'];rr(ctx,cxx-36,cy-50,72,92,4);ctx.fill();ctx.stroke();['E','F P','T O Z','L P E D'].forEach((l,i)=>txt(ctx,l,cxx,cy-30+i*21,{s:22-i*4,w:700,c:'#1c1c1f',a:'center',b:'middle'}));}
  if(f.cover){const x=f.cover==='R'?exR:exL;ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,eyeY,35,26,0,0,6.2832);ctx.fill();ctx.stroke();}
  if(f.pen){const X=cx+p.gx*150,Y=cy0-22+p.gy*110;ctx.strokeStyle=PAL['s2'];ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(X,Y);ctx.lineTo(X+8,Y+46);ctx.stroke();ctx.lineCap='butt';ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(X,Y,6,0,6.2832);ctx.fill();}
  if(p.lightOn){const x=p.lightOn==='R'?exR:exL,yy=eyeY+56;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x+6,yy+30);ctx.lineTo(x,yy);ctx.stroke();ctx.lineCap='butt';ctx.strokeStyle='rgba(255,214,90,.8)';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x,yy-2);ctx.lineTo(x,eyeY+8);ctx.stroke();}
  if(f.touch){const x=hx+fx+sign(f.touch[0])*(f.touch[1]?34:46),y=f.touch[1]?hy+18:hy-74;hand(ctx,x,y,8);}
  if(f.ear){const x=hx+sign(f.ear)*(rx+26),y=hy+4;hand(ctx,x,y,9);if(!RM){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;for(let i=0;i<2;i++){const a=(t*3+i*.5)%1;ctx.globalAlpha=1-a;ctx.beginPath();ctx.arc(x,y,12+a*14,0,6.2832);ctx.stroke();}ctx.globalAlpha=1;}}
  if(f.hands){[['R',rsh],['L',lsh]].forEach(([sd,y])=>{const x=cx+sign(sd)*140;hand(ctx,x,y-20,13);arrowLine(ctx,x,y-74,x,y-38,PAL['s4']);});}
  if(f.push){const d=sign(f.push);const x=hx+d*(rx+24),y=hy+40;hand(ctx,x,y,11);arrowLine(ctx,x+d*42,y,x+d*16,y,PAL['s4']);}
  if(p.cup>.05){const x=mx+30+(1-p.cup)*90,y=my+6+(1-p.cup)*60;ctx.fillStyle=PAL['s2'];ctx.globalAlpha=.75;rr(ctx,x,y-20,30,38,4);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.6;rr(ctx,x,y-20,30,38,4);ctx.stroke();}
  // side labels
  pill(ctx,'Athlete’s right',cx-162,20+6*k,PAL['card'],PAL['cv-ink'],12*k);pill(ctx,'Athlete’s left',cx+158,20+6*k,PAL['card'],PAL['cv-ink'],12*k);
  // pupil gauges for the deeper levels
  if(atLeast('honors')&&p.lightOn!==undefined){const yy=62+20*k;txt(ctx,p.pupR.toFixed(1)+' mm',cx-162,yy,{s:12*k,c:PAL['cv-soft'],a:'center'});txt(ctx,p.pupL.toFixed(1)+' mm',cx+158,yy,{s:12*k,c:PAL['cv-soft'],a:'center'});}
}
function drawCNPanel(sim,ctx,k){const s=sim.st,r=s.run,X=488,W=300;ctx.fillStyle=PAL['cv-bg2'];rr(ctx,X-8,8,W+16,517,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  const t=testBy(sim.p.test);let y=14+15*k;const show=!concealed(sim);
  y=wrap(ctx,t.l,X,y,W,{s:13.5*k,w:700});y+=2;
  y=wrap(ctx,'Supply: '+supName(sim.p.supply),X,y,W,{s:12*k,c:PAL['cv-soft']});
  if(show){y=wrap(ctx,'Checks nerve '+t.n+', '+cnBy(t.n).name,X,y,W,{s:12*k,w:600,c:PAL['cv-soft']});}
  y+=4;ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X,y);ctx.lineTo(X+W,y);ctx.stroke();y+=8+12*k;
  if(!r){y=wrap(ctx,'Press Run this test. Watch the eyes, face and shoulders, and compare the two sides.',X,y,W,{s:12.5*k,c:PAL['cv-soft']});}
  else if(!r.ok){y=wrap(ctx,'“'+r.say+'”',X,y,W,{s:12.5*k,w:600});y+=4;y=wrap(ctx,'This supply does not fit this test. Think about what the test has to stimulate.',X,y,W,{s:12*k,c:PAL['cv-soft']});}
  else{const beat=r.beats[Math.min(r.i,r.beats.length-1)];const say=!r.done&&beat&&beat.say;
    if(say){y=wrap(ctx,say[0]==='('?say:'“'+say+'”',X,y,W,{s:12.5*k,w:600});y+=4;}
    if(r.done){const f=r.find;
      if(f.R){txt(ctx,'Athlete’s right',X,y,{s:12*k,w:700,c:PAL['s2']});y+=14*k;y=wrap(ctx,f.R,X,y,W,{s:12*k});y+=4;}
      if(f.L){txt(ctx,'Athlete’s left',X,y,{s:12*k,w:700,c:PAL['s2']});y+=14*k;y=wrap(ctx,f.L,X,y,W,{s:12*k});y+=4;}
      if(f.both){txt(ctx,'Both sides',X,y,{s:12*k,w:700,c:PAL['s2']});y+=14*k;y=wrap(ctx,f.both,X,y,W,{s:12*k});y+=4;}
      if(sim.p.ath==='shown'&&!sim.vlab)y=wrap(ctx,'Abnormal finding',X,y+2,W,{s:12.5*k,w:700,c:PAL['s1']});
      else if(sim.p.ath==='healthy'&&!sim.vlab)y=wrap(ctx,'Normal finding',X,y+2,W,{s:12.5*k,w:700,c:PAL['s3']});
    }else if(!say)y=wrap(ctx,'Watching the athlete…',X,y,W,{s:12*k,c:PAL['cv-soft']});}
  if(s.fb&&sim.p.view==='cn')wrap(ctx,s.fb.t,X,y+8+12*k,W,{s:12*k,w:600,c:PAL[s.fb.ok?'s3':'s1']});}

/* ---------- drawing: myotomes and dermatomes ---------- */
const FIG={cx:126,top:14,h:505};
function regionPath(ctx,id,sgn,o){const m=(x,y)=>BioLab.body.map(sgn*x,y,o);ctx.beginPath();REG[id].forEach(poly=>{poly.forEach((q,i)=>{const a=m(q[0],q[1]);i?ctx.lineTo(a.x,a.y):ctx.moveTo(a.x,a.y);});ctx.closePath();});}
function paintRegions(ctx,ids,o,colorOf,alphaOf){ctx.save();BioLab.body.path(ctx,o);ctx.clip();ids.forEach(id=>{[-1,1].forEach(sgn=>{regionPath(ctx,id,sgn,o);ctx.globalAlpha=alphaOf?alphaOf(id,sgn):.8;ctx.fillStyle=colorOf(id,sgn);ctx.fill();});});ctx.restore();ctx.globalAlpha=1;}
function rootColor(id){const i=RT.findIndex(r=>r.id===id);return PAL['s'+((i%6)+1)];}
function drawFigure(sim,ctx,k){const o=FIG,rid=sim.p.mtest,r=rtBy(rid),all=!!sim.p.allMap&&!hideRoot(sim);
  BioLab.body.draw(ctx,{cx:o.cx,top:o.top,h:o.h,fill:PAL['card2'],stroke:PAL['cv-soft'],lw:1.6});
  if(all){const ids=Object.keys(REG);paintRegions(ctx,ids,o,rootColor);
    // labels in a column to the figure's side
    const X=o.cx+.214*o.h+24*k;let lasty=-99;const sp=12*k*1.7+2;
    const list=ids.map(id=>({id,c:REGC[id],y:o.top+REGC[id][1]*o.h}));list.forEach(l=>{l.ly=Math.min(o.top+o.h-10-(list.length-1-list.indexOf(l))*sp,Math.max(l.y,lasty+sp));lasty=l.ly;});
    list.forEach(l=>{const q=BioLab.body.map(l.c[0],l.c[1],o);ctx.strokeStyle=rootColor(l.id);ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(X-16*k,l.ly);ctx.stroke();pill(ctx,rtBy(l.id).root,X,l.ly,rootColor(l.id),'#ffffff',12*k);});}
  else if(r.skin){paintRegions(ctx,[rid],o,()=>PAL['s2'],()=>.85);
    if(!hideRoot(sim)){const q=BioLab.body.map(REGC[rid][0],REGC[rid][1],o);const X=clamp(q.x+40+14*k,o.cx+60,275-10*k),Y=clamp(q.y-30,24,o.top+o.h-24);ctx.strokeStyle=PAL['s2'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(X,Y);ctx.stroke();pill(ctx,r.root,X,Y,PAL['s2'],'#ffffff',12*k);}}
  else{ctx.font=(12*k)+'px '+FONT;}
  pill(ctx,'R',o.cx-.17*o.h,o.top+.13*o.h,PAL['card'],PAL['cv-ink'],12*k);pill(ctx,'L',o.cx+.17*o.h,o.top+.13*o.h,PAL['card'],PAL['cv-ink'],12*k);}
function drawChain(ctx,x,y,w,h,rid,ph,give,k,side){const pc=PIC[rid];const mirror=side==='L';ctx.save();ctx.translate(x,y);if(mirror){ctx.translate(w,0);ctx.scale(-1,1);}
  const sc=Math.min(w/230,h/190),bx=pc.base[0]*w,by=pc.base[1]*h;
  // pose blending. ph: [from pose, to pose, blend]
  const pa=pc.poses[ph[0]],pb=pc.poses[ph[1]],ang=pa.map((a,i)=>lerp(a,pb[i],ph[2]));
  const start=pc.poses[0];if(give>0)ang.forEach((a,i)=>{ang[i]=lerp(a,start[i],give);});
  if(pc.seat){ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,by+8*sc,bx+18*sc,h-by-8*sc);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.lineCap='round';ctx.lineWidth=14*sc;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx-4*sc,by-Math.max(30,by-6)*.92);ctx.stroke();}
  if(pc.torso){ctx.strokeStyle=PAL['cv-soft'];ctx.lineCap='round';ctx.lineWidth=26*sc;ctx.beginPath();ctx.moveTo(bx-30*sc,by-16*sc);ctx.lineTo(bx-30*sc,h-6);ctx.stroke();}
  if(pc.bar){ctx.strokeStyle=PAL['cv-soft'];ctx.lineCap='round';ctx.lineWidth=20*sc;ctx.beginPath();ctx.moveTo(bx-60*sc,by-52*sc);ctx.lineTo(bx+60*sc,by-52*sc);ctx.stroke();}
  let px=bx,py=by,tip=[bx,by],pushP=null,headLean=0;
  pc.segs.forEach((L,i)=>{const a=ang[i]*Math.PI/180,nx=px+Math.cos(a)*L*sc,ny=py+Math.sin(a)*L*sc,mv=i>=pc.moving;ctx.strokeStyle=mv?PAL['s2']:PAL['cv-soft'];ctx.lineCap='round';ctx.lineWidth=(i===0?15:12)*sc;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(nx,ny);ctx.stroke();
    if(i===pc.push)pushP=[px+(nx-px)*.8,py+(ny-py)*.8];px=nx;py=ny;tip=[nx,ny];});
  if(pc.head){const a=ang[1]*Math.PI/180,hx=px+Math.cos(a)*26*sc,hy=py+Math.sin(a)*26*sc;ctx.fillStyle=PAL['card2'];ctx.strokeStyle=PAL['s2'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(hx,hy,28*sc,0,6.2832);ctx.fill();ctx.stroke();const lean=Math.cos(a)>=0?1:-1;pushP=[hx+lean*28*sc,hy];headLean=lean;}
  if(pushP&&ph[3]){const ax=headLean?[-headLean,0]:pc.arrow,len=32*sc,dy=ax[1]>0?8*sc:0;arrowLine(ctx,pushP[0]-ax[0]*len,pushP[1]-ax[1]*len-dy,pushP[0],pushP[1]-dy,PAL['s4'],3.5);}
  ctx.lineCap='butt';ctx.restore();}
function zoomO(x,y,w,h,id,sgn){const H=rtZoom[id]||1100,c=REGC[id];return {cx:x+w/2-sgn*c[0]*H,top:y+h/2-c[1]*H,h:H};}
const rtZoom={C4:1300,C5:900,L1L2:800,L3:1200};
function drawHandArt(ctx,x,y,w,h,rid,side){const sc=Math.min(w,h)/205,cx=x+w/2,cy=y+h/2+42*sc,lat=side==='R'?-1:1; /* thumb on the lateral side in anatomical position */
  ctx.save();ctx.translate(cx,cy);ctx.scale(sc,sc);ctx.lineCap='round';
  const fingers=[[lat*-28,-30,58],[lat*-10,-34,70],[lat*8,-34,76],[lat*25,-30,66]]; /* little, ring, middle, index from medial to lateral */
  ctx.fillStyle=PAL['card2'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;rr(ctx,-37,-34,74,64,12);ctx.fill();ctx.stroke();
  fingers.forEach((q,i)=>{const lit=rid==='C7'&&i===2;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(q[0],q[1]-q[2]+8);ctx.stroke();ctx.strokeStyle=lit?PAL['s2']:PAL['card2'];ctx.lineWidth=14.5;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(q[0],q[1]-q[2]+8);ctx.stroke();});
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=19;ctx.beginPath();ctx.moveTo(lat*34,6);ctx.lineTo(lat*60,-28);ctx.stroke();ctx.strokeStyle=rid==='C6'?PAL['s2']:PAL['card2'];ctx.lineWidth=15.5;ctx.beginPath();ctx.moveTo(lat*34,6);ctx.lineTo(lat*60,-28);ctx.stroke();
  ctx.fillStyle=PAL['card2'];ctx.fillRect(-35,-30,70,56);ctx.lineCap='butt';ctx.restore();
  return rid==='C6'?{x:cx+lat*56*sc,y:cy-24*sc}:{x:cx+lat*8*sc,y:cy-96*sc};}
function drawFootArt(ctx,x,y,w,h,rid,side){const sc=Math.min(w,h)/170,cx=x+w/2,cy=y+h/2+12*sc,med=side==='R'?1:-1; /* big toe on the medial side */
  ctx.save();ctx.translate(cx,cy);ctx.scale(sc,sc);ctx.lineCap='round';ctx.lineJoin='round';
  const foot=()=>{ctx.beginPath();ctx.moveTo(-22,58);ctx.quadraticCurveTo(-34,0,-32,-30);ctx.lineTo(32,-30);ctx.quadraticCurveTo(36,0,22,58);ctx.quadraticCurveTo(0,72,-22,58);ctx.closePath();};
  ctx.fillStyle=PAL['card2'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;
  // shin stub
  rr(ctx,-20,44,40,34,6);ctx.fill();ctx.stroke();foot();ctx.fill();ctx.stroke();
  if(rid==='L5'){ctx.save();foot();ctx.clip();ctx.fillStyle=PAL['s2'];ctx.fillRect(-40,-30,80,76);ctx.restore();foot();ctx.stroke();}
  // toes: great toe medial
  const T=[[med*25,-44,12,17],[med*5,-46,8,13],[med*-9,-44,7.5,12],[med*-21,-40,7,11],[med*-31,-34,6.5,9]];
  T.forEach((q,i)=>{ctx.beginPath();ctx.ellipse(q[0],q[1],q[2],q[3],0,0,6.2832);ctx.fillStyle=(rid==='L4'&&i===0)?PAL['s2']:PAL['card2'];ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.stroke();});
  if(rid==='L4'){ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.arc(med*24,48,12,0,6.2832);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.stroke();}
  ctx.lineCap='butt';ctx.restore();
  return rid==='L5'?{x:cx,y:cy}:{x:cx+med*25*sc,y:cy-44*sc};}
function drawMyoCell(sim,ctx,x,y,w,h,rid,side,k){const s=sim.st,m=s.m,mode=m&&m.test===rid?m.mode:null,F=mFindings(sim,rid);
  ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;rr(ctx,x,y,w,h,10);ctx.fill();ctx.stroke();ctx.save();rr(ctx,x+1,y+1,w-2,h-2,10);ctx.clip();
  const r=rtBy(rid),hd=20+6*k;txt(ctx,'Athlete’s '+SIDE[side],x+w/2,y+8+12*k,{s:12*k,w:700,a:'center'});
  const bx=x+6,by=y+hd,bw=w-12,bh=h-hd-22-12*k;
  if(mode==='sen'&&r.skin){let touch=null;
    if(rid==='C6'||rid==='C7')touch=drawHandArt(ctx,bx,by,bw,bh,rid,side);
    else if(rid==='L4'||rid==='L5')touch=drawFootArt(ctx,bx,by,bw,bh,rid,side);
    else{const sg=side==='R'?-1:1,O=zoomO(bx,by,bw,bh,rid,sg);ctx.save();ctx.beginPath();ctx.rect(bx,by,bw,bh);ctx.clip();BioLab.body.draw(ctx,{cx:O.cx,top:O.top,h:O.h,fill:PAL['card2'],stroke:PAL['cv-soft'],lw:2,marks:false});
      ctx.save();BioLab.body.path(ctx,O);ctx.clip();regionPath(ctx,rid,sg,O);ctx.fillStyle=PAL['s2'];ctx.globalAlpha=.8;ctx.fill();ctx.restore();ctx.globalAlpha=1;ctx.restore();touch={x:bx+bw/2,y:by+bh/2};}
    const ph=m.t<1.4?'R':m.t<2.8?'L':null;
    if(ph===side&&touch){hand(ctx,touch.x,touch.y,8+Math.sin(m.t*6)*1.2);}
    if((side==='R'&&m.t>=.7)||(side==='L'&&m.t>=2.1)){const t=F.sen(side);pill(ctx,t,x+w/2,y+h-14-6*k,t==='Feels dull'?PAL['s4']:PAL['card2'],t==='Feels dull'?'#ffffff':PAL['cv-ink'],12*k);}}
  else if(mode==='sen'&&!r.skin){wrap(ctx,'The key lists no skin area for this row.',x+w/2,y+h/2,w-20,{s:12*k,a:'center',c:PAL['cv-soft']});}
  else{const pc=PIC[rid];let ph=[0,0,0,false],give=0,read='';
    if(mode==='str'){const n=pc.poses.length-1,T=m.t;// each motion: 1 s to move, 1 s against your push
      const seg=2.2,i=Math.min(n-1,Math.floor(T/seg)),u=T-i*seg;const blend=clamp(u/.8,0,1);ph=[i===0?0:i,i+1,blend,u>.8&&T<n*seg+.0];if(i>0&&u<=.8)ph=[0,i+1,blend,false];if(T>=n*seg){ph=[0,n,1,false];}
      const hit=F.str(side)==='Gives way';if(u>.8&&T<n*seg&&hit)give=clamp((u-.8)/.9,0,.72);if(T>=n*seg&&hit)give=.72;
      if(T>.8)read=F.str(side);if(atLeast('ap')&&T>.8)read+=' ('+F.grade(side)+'/5)';}
    drawChain(ctx,bx,by,bw,bh,rid,ph,give,k,side);
    if(read)pill(ctx,read,x+w/2,y+h-14-6*k,read.indexOf('Gives')===0?PAL['s4']:PAL['card2'],read.indexOf('Gives')===0?'#ffffff':PAL['cv-ink'],12*k);}
  ctx.restore();}
function drawMyo(sim,ctx,k){const s=sim.st,X=292,W=498,rid=sim.p.mtest,r=rtBy(rid),hide=hideRoot(sim);
  ctx.fillStyle=PAL['cv-bg2'];rr(ctx,X-6,8,W+10,517,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  let y=14+15*k;y=wrap(ctx,(hide?'':r.root+': ')+r.mo,X+6,y,W-14,{s:13.5*k,w:700});
  y=wrap(ctx,'Skin area: '+(r.skin||'none listed on your key'),X+6,y,W-14,{s:12*k,c:PAL['cv-soft']});y+=4;
  const h=Math.min(330,516-y-(s.fb?64*k:40*k)),cw=(W-20)/2;
  drawMyoCell(sim,ctx,X+4,y,cw,h,rid,'R',k);drawMyoCell(sim,ctx,X+10+cw,y,cw,h,rid,'L',k);y+=h+6+13*k;
  const m=s.m;let line='';
  if(s.fb){wrap(ctx,s.fb.t,X+6,y,W-14,{s:12*k,w:600,c:PAL[s.fb.ok?'s3':'s1']});return;}
  if(!m||m.test!==rid)line='Press Test strength or Test sensation. Then compare the two sides.';
  else if(m.mode==='str')line=m.t<1?'The athlete moves into position. You push back with the amber arrow.':'Push against both sides the same way. Does one side give way?';
  else if(!r.skin)line='This row has no skin area on the key. Test its strength instead.';
  else line='The athlete’s eyes are closed. You touch the same spot on each side.';
  wrap(ctx,line,X+6,y,W-14,{s:12*k,c:PAL['cv-soft']});}

/* ---------- labs ---------- */
const sideOpts=['Normal','Abnormal: right','Abnormal: left'];
function cnBench(sim){const b=sim.vlab.bench;if(!b.cn){const g=sim.vlab.rng(7);b.cn={n:CN[Math.floor(g()*12)].n,side:g()<.5?'R':'L'};}b.done=b.done||{};return b;}
function rtBench(sim){const b=sim.vlab.bench;if(!b.root){const g=sim.vlab.rng(11),L=RT.filter(r=>r.skin);b.root={r:L[Math.floor(g()*L.length)].id,side:g()<.5?'R':'L',grade:g()<.5?3:4};}b.mdone=b.mdone||{};return b;}
const cnRowIdx=rv=>CN.findIndex(c=>c.n+' '+c.name===rv);
function ranAll(sim,ns){const b=sim.vlab.bench;return ns.every(n=>(b.done||{})[testOfNerve(n).id]);}
function cnStep(title,ns,text){return {title,controls:['supply','test','run'],text:'<p>'+text+'</p>',done:sim=>ranAll(sim,ns),doneHint:sim=>{const left=ns.filter(n=>!(sim.vlab.bench.done||{})[testOfNerve(n).id]);return left.length?'Still to test: nerve '+left.join(', nerve ')+'. Choose a test and the right supply, then press <b>Run this test</b>.':'';}};}
const LAB_CN={id:'cranial-nerve',title:'Cranial Nerve Assessment Lab',course:'SPAT',teachers:'McKeon',source:{label:'Cranial Nerve Assessment Lab.docx',href:'https://rjhs.instructure.com/courses/15536/assignments/572615'},
  purpose:'<p>Run a full cranial nerve assessment on a simulated athlete after a head injury. Choose your supplies, run each test, compare the two sides, and record what you find.</p>',
  background:'<p>Twelve pairs of cranial nerves leave the brain directly, so a head injury can affect them. Each test takes less than a minute. This athlete took a blow to the head, and at most one nerve is affected. Your job is to run every test, not just the ones you expect to fail.</p>',
  materials:['Something strong to smell (gum, mint or coffee)','Something to read, close and far','Penlight','Pen','Cup of water','Your hands'],
  setup(sim){cnBench(sim);if(!document.getElementById('neuro-lab-css')){const st=document.createElement('style');st.id='neuro-lab-css';st.textContent='.neuro-nb .vl-cell.vl-wide{min-width:10.5em}';document.head.appendChild(st);}sim.ui.nb.classList.add('neuro-nb');BioLab.setValues(sim,{view:'cn',test:'smell',supply:'scent'});BioLab.refresh(sim);},
  controls:['supply','test','run'],
  steps:[
    {title:'Get ready',text:'<p>Your athlete is on the bench. Read each row of the table below the bench. For each nerve you will write its function, the supplies you used and the test you ran, then record the result.</p><p>Start by choosing a supply and a test, then press <b>Run this test</b>. If the supply does not fit, the athlete will tell you.</p>'},
    cnStep('Smell and vision',['I','II'],'Test nerves I and II. Fill in their rows as you go.'),
    cnStep('Pupils and eye movement',['III','IV','VI'],'Test nerves III, IV and VI. Watch each eye on its own. Do both eyes move together? Does one pupil differ?'),
    cnStep('Face and jaw',['V','VII'],'Test nerves V and VII. Compare the two sides of the face.'),
    cnStep('Hearing and balance',['VIII'],'Test nerve VIII. It has two jobs, so read both findings.'),
    cnStep('Throat',['IX','X'],'Test nerves IX and X. Listen to the voice and watch the swallow.'),
    cnStep('Shoulders and tongue',['XI','XII'],'Test nerves XI and XII. Does a shoulder or head turn give way? Does the tongue come out straight?'),
    {title:'Make your call',controls:['supply','test','run'],text:'<p>Look down your Result column. Repeat any test you are unsure of. Then answer below the bench: which nerve looks affected, and on which side?</p>'},
    {title:'Questions',text:'<p>Answer the questions below the bench, then turn in your lab.</p>'}],
  tables:[{id:'t1',title:'Cranial nerve assessment',cols:[{id:'nerve',label:'Nerve',rows:CN.map(c=>c.n+' '+c.name)},
    {id:'fn',label:'Function',input:'text',check(sim,rv,v){const c=CN[cnRowIdx(rv)];return c&&!c.kw.test(v)?'Check your notes: what is this nerve’s job?':null;}},
    {id:'sup',label:'Supplies used',input:'text',check(sim,rv,v){const c=CN[cnRowIdx(rv)];return c&&!c.skw.test(v)?'Check this entry: did you use that supply when the test worked on the bench?':null;}},
    {id:'tst',label:'Test conducted',input:'text'},
    {id:'res',label:'Result (athlete’s side)',input:'select',options:sideOpts,check(sim,rv,v){const c=CN[cnRowIdx(rv)];if(!c)return null;const t=testOfNerve(c.n),b=sim.vlab.bench;if(!(b.done||{})[t.id])return 'Run this test on the athlete before you record a result.';
      const ab=isAbn(t.id,b.cn),want=ab?'Abnormal: '+SIDE[b.cn.side]:'Normal';return v===want?null:'Run this test again and compare the athlete’s right and left.';}}]}],
  calcs:[{id:'which',label:'Which nerve looks affected, and on which side?',input:'text',check(sim,v){const b=sim.vlab.bench,c=cnBy(b.cn.n),u=' '+v.toUpperCase().replace(/[^A-Z0-9 ]/g,' ')+' ';const num={I:1,II:2,III:3,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,X:10,XI:11,XII:12}[c.n];
    const named=u.includes(' '+c.n+' ')||u.includes(c.name.split(' (')[0].toUpperCase())||u.includes(' '+num+' ');if(!named)return 'Look down your Result column again. Which nerve’s own test points to the problem?';
    if(!new RegExp(SIDE[b.cn.side],'i').test(v))return 'Name the side too, and check it against your results.';return null;}}],
  questions:[
    {id:'q1',n:'1',q:'<p>Why is it important for an Athletic Trainer to test Cranial Nerves following head / brain injuries?</p>'},
    {id:'q2',n:'2',q:'<p>What would an abnormal response possibly indicate?</p>'},
    {id:'q3',n:'3',q:'<p>Which tests would you perform differently, and why?</p>'},
    {id:'q4',n:'4',q:'<p>Which tests could be combined to save time?</p>'},
    {id:'q5',n:'5',q:'<p>What should an Athletic Trainer pack in the kit?</p>'}]};
const STR_OPT=['Normal','Weak: right','Weak: left'],SEN_OPT=['Normal','Reduced: right','Reduced: left','No skin area'];
const rtRowIdx=rv=>RT.findIndex(r=>r.mo===rv);
const normRoot=v=>String(v).toUpperCase().replace(/\s+AND\s+/g,'/').replace(/[\s,&-]+/g,'/').replace(/\/+/g,'/').replace(/^\/|\/$/g,'');
function myStep(title,ids,text){return {title,controls:['mtest','mStr','mSen'],text:'<p>'+text+'</p>',done:sim=>ids.every(id=>{const d=(sim.vlab.bench.mdone||{})[id]||{};return d.str&&(d.sen||!rtBy(id).skin);}),
  doneHint:sim=>{const b=sim.vlab.bench.mdone||{},l=ids.filter(id=>{const d=b[id]||{};return !(d.str&&(d.sen||!rtBy(id).skin));});return l.length?'Still to test: '+rtBy(l[0]).mo.toLowerCase()+'. Choose it under <b>Test</b>, then test its strength'+(rtBy(l[0]).skin?' and sensation':'')+'.':'';}};}
const LAB_MY={id:'myotome-dermatome',title:'Myotomes and Dermatomes Practical',course:'SPAT',teachers:'McKeon',source:{label:'Myotomes and Dermatomes of the Body Key.pdf',href:'https://rjhs.instructure.com/courses/15536/assignments/576400'},
  purpose:'<p>Run the myotome and dermatome screen on a simulated athlete. For each row, test strength on both sides, test sensation on both sides, record what you find, and name the nerve root from your key.</p>',
  background:'<p>A <b>dermatome</b> is the area of skin supplied by a single spinal nerve root, a map of the body. A <b>myotome</b> is the group of muscles innervated by a single spinal nerve root. If one root is hurt, its muscles test weak and its skin area feels different, on that side.</p>',
  materials:['Your key: Myotomes and Dermatomes of the Body','Your hands, to give resistance and to touch the skin'],
  setup(sim){rtBench(sim);BioLab.setValues(sim,{view:'myo',mtest:'C1C2'});BioLab.refresh(sim);},
  controls:['mtest','mStr','mSen'],
  steps:[
    {title:'Get ready',text:'<p>Choose a row under <b>Test</b>. <b>Test strength</b> has the athlete hold against your push on both sides. <b>Test sensation</b> has the athlete close their eyes while you touch each side. Fill in the table below the bench as you go.</p>'},
    myStep('Neck',['C1C2','C3'],'Test neck flexion and extension, then neck lateral flexion.'),
    myStep('Shoulder',['C4','C5'],'Test shoulder elevation and shoulder abduction, and the skin that goes with each.'),
    myStep('Elbow and wrist',['C6','C7'],'Test the two arm rows, and the skin that goes with each.'),
    myStep('Hip and knee',['L1L2','L3'],'Test hip flexion and knee extension, and the skin that goes with each.'),
    myStep('Ankle and toes',['L4','L5'],'Test ankle dorsiflexion and toe extension, and the skin that goes with each.'),
    {title:'Make your call',controls:['mtest','mStr','mSen'],text:'<p>Look down your table. Repeat any row you are unsure of. Then answer below the bench: which nerve root looks affected, and on which side?</p>'},
    {title:'Questions',text:'<p>Answer the questions below the bench, then turn in your lab.</p>'}],
  tables:[{id:'t1',title:'Myotome and dermatome screen',cols:[{id:'mo',label:'Myotome test',rows:RT.map(r=>r.mo)},
    {id:'str',label:'Strength (athlete’s side)',input:'select',options:STR_OPT,check(sim,rv,v){const r=RT[rtRowIdx(rv)],b=sim.vlab.bench;if(!r)return null;if(!((b.mdone||{})[r.id]||{}).str)return 'Test this row’s strength before you record it.';const want=b.root.r===r.id?'Weak: '+SIDE[b.root.side]:'Normal';return v===want?null:'Test this row again and compare the two sides.';}},
    {id:'sen',label:'Sensation (athlete’s side)',input:'select',options:SEN_OPT,check(sim,rv,v){const r=RT[rtRowIdx(rv)],b=sim.vlab.bench;if(!r)return null;if(!r.skin)return v===SEN_OPT[3]?null:'Check your key for this row’s skin area.';if(v===SEN_OPT[3])return 'Check your key for this row’s skin area.';if(!((b.mdone||{})[r.id]||{}).sen)return 'Test this row’s sensation before you record it.';const want=b.root.r===r.id?'Reduced: '+SIDE[b.root.side]:'Normal';return v===want?null:'Test this row again and compare the two sides.';}},
    {id:'root',label:'Nerve root',input:'text',check(sim,rv,v){const r=RT[rtRowIdx(rv)];if(!r)return null;const g=normRoot(v),a=normRoot(r.root);return g===a?null:'Check your key: which root goes with this motion?';}}]}],
  calcs:[{id:'which',label:'Which nerve root looks affected, and on which side?',input:'text',check(sim,v){const b=sim.vlab.bench,r=rtBy(b.root.r),g=normRoot(v);if(!g.includes(normRoot(r.root)))return 'Find the row where one side is weak and the skin feels dull on that same side.';if(!new RegExp(SIDE[b.root.side],'i').test(v))return 'Name the side too.';return null;}}],
  questions:[
    {id:'q1',n:'1',q:'<p>In your own words, what is the difference between a dermatome and a myotome?</p>'},
    {id:'q2',n:'2',q:'<p>Why do you test both sides of the body every time?</p>'},
    {id:'q3',n:'3',q:'<p>Describe the finding that made you name that root. Why does weakness and dull skin on the same side point to one nerve root rather than one muscle?</p>'},
    {id:'q4',n:'4',q:'<p>An athlete has weakness or numbness in both arms after a neck injury. Should the athlete walk to the sideline? Explain what an Athletic Trainer should do.</p>'},
    {id:'q5',n:'5',q:'<p>Compare your key with one other dermatome chart. Find one place where they differ. Why might charts differ?</p>'}]};

/* ---------- definition ---------- */
const SIM={
  id:'neuroexam',hash:'neuroexam',apUnit:15,order:7,kind:'Simulation',tab:'Neuro exam',prereq:[],next:['concussion'],
  card:'Choose your supplies and run all 12 cranial nerve tests and the myotome and dermatome screen on a simulated athlete. Then track down a hidden deficit.',
  title:'Neuro exam: cranial nerves, myotomes and dermatomes',
  lede:{bio:'After a head or neck injury, an Athletic Trainer checks the nerves one at a time. Run the tests on this athlete, compare the two sides and decide what looks normal.',
    honors:'Match each test to its cranial nerve or spinal nerve root. When one side looks different, use what each nerve does to work out where the problem is.',
    ap:'Localize a hidden deficit. Some findings point to more than one nerve, such as a pupil that does not react, so run the full exam before you decide.'},
  scale:'One simulated athlete. Twelve pairs of cranial nerves leave the brain, and each spinal nerve root leaves the spinal cord between two vertebrae. For education only.',
  aspect:3/2,timeless:true,animated:true,graph:false,controlsTitle:'Your exam',
  controls:[
    {id:'view',label:'Exam',type:'seg',def:'cn',lvl:'bio',noTrial:true,options:[{v:'cn',l:'Cranial nerves'},{v:'myo',l:'Myotomes and dermatomes'}],onChange(sim){if(sim.st){sim.st.fb=null;}sync(sim);sim.infoDirty=true;}},
    {id:'ath',label:'Athlete',type:'seg',def:'healthy',lvl:'bio',options:[{v:'healthy',l:'Healthy'},{v:'shown',l:'See abnormal'},{v:'hidden',l:'Hidden deficit'}],help:'See abnormal shows a problem on the athlete’s left in whatever you test.',
     onChange(sim){if(sim.st){sim.st.run=null;sim.st.m=null;sim.st.fb=null;sim.st.log={};sim.st.mlog={};sim.st.forced=null;}sync(sim);sim.infoDirty=true;}},
    {id:'supply',label:'Supply from your kit',type:'select',def:'scent',lvl:'bio',vw:'cn',options:SUP},
    {id:'test',label:'Test',type:'select',def:'smell',lvl:'bio',vw:'cn',options:TESTS.map(t=>({v:t.id,l:t.l})),onChange(sim){if(sim.st){sim.st.run=null;}sim.infoDirty=true;}},
    {id:'mtest',label:'Test',type:'select',def:'C5',lvl:'bio',vw:'myo',options:RT.map(r=>({v:r.id,l:r.mo+(r.skin?'; '+r.skin.toLowerCase():'')})),onChange(sim){if(sim.st){sim.st.m=null;}sim.infoDirty=true;}},
    {id:'allMap',label:'Show the whole body map',type:'toggle',def:false,lvl:'bio',vw:'myo',noTrial:true},
    {id:'guessN',label:'Your call: which nerve?',type:'select',def:'I',lvl:'bio',vw:'cn',hidOnly:true,noTrial:true,options:CN.map(c=>({v:c.n,l:c.n+' '+c.name}))},
    {id:'guessR',label:'Your call: which root?',type:'select',def:'C1C2',lvl:'bio',vw:'myo',hidOnly:true,noTrial:true,options:RT.filter(r=>r.skin).map(r=>({v:r.id,l:r.root}))},
    {id:'guessSide',label:'Which side?',type:'seg',def:'R',lvl:'honors',hidOnly:true,noTrial:true,options:[{v:'R',l:'Athlete’s right'},{v:'L',l:'Athlete’s left'}]}
  ],
  actions:[
    {id:'run',label:'Run this test',primary:true,vw:'cn',run(sim){runTest(sim);}},
    {id:'mStr',label:'Test strength',primary:true,vw:'myo',run(sim){runM(sim,'str');}},
    {id:'mSen',label:'Test sensation',vw:'myo',run(sim){runM(sim,'sen');}},
    {id:'check',label:'Check my call',hidOnly:true,run(sim){guessCheck(sim);}},
    {id:'newAth',label:'New athlete',hidOnly:true,run(sim){newHidden(sim.st);}}
  ],
  labs:[LAB_CN,LAB_MY],
  init(){return fresh();},
  step(sim,dt){const s=sim.st,r=s.run;if(!s.pose)return;
    const def=sim.p.view==='cn'?curCN(sim):null;let set={};
    if(r&&!r.done){r.t+=dt;while(r.i<r.beats.length&&r.t>=r.beats[r.i].d){r.t-=r.beats[r.i].d;r.i++;}
      if(r.i>=r.beats.length){r.done=true;if(r.ok)s.last=findText(r.find);sim.infoDirty=true;}else set=r.beats[r.i].set||{};}
    const T=Object.assign({},NEUTRAL,set);const fl=Object.assign({},FLAGS);Object.keys(FLAGS).forEach(k=>{if(set[k]!==undefined)fl[k]=set[k];});s.flags=fl;T.lightOn=set.lightOn||null;
    finishPose(T,def);const u=RM?1:clamp(dt*7,0,1),p=s.pose;Object.keys(NEUTRAL).forEach(k=>{p[k]+=(T[k]-p[k])*u;});p.lightOn=T.lightOn;
    s.pupR=p.pupR;s.pupL=p.pupL;
    if(s.m)s.m.t+=dt;},
  onLevel(sim){sync(sim);sim.infoDirty=true;},
  afterPrewarm(){},
  metrics:[
    {id:'pupR',vw:'cn',label:'Right pupil',unit:'mm',lvl:'honors',min:0,max:8,d:1,get:s=>s.st.pupR},
    {id:'pupL',vw:'cn',label:'Left pupil',unit:'mm',lvl:'honors',min:0,max:8,d:1,get:s=>s.st.pupL},
    {id:'find',vw:'cn',label:'Last finding',lvl:'bio',text:true,noTrial:false,get:s=>s.st.last||'Run a test'},
    {id:'mfind',vw:'myo',label:'Last finding',lvl:'bio',text:true,get(sim){const m=sim.st.m;if(!m)return 'Run a test';const r=rtBy(m.test),F=mFindings(sim,m.test);if(m.mode==='str')return 'Strength. Right: '+F.str('R')+'. Left: '+F.str('L')+'.';return r.skin?'Sensation. Right: '+F.sen('R')+'. Left: '+F.sen('L')+'.':'No skin area on the key.';}}
  ],
  infoPanel(sim){const s=sim.st;
    const head=t=>'<h3>'+t+'</h3>';const tbl=(cols,rows)=>'<div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:14px;width:100%"><thead><tr>'+cols.map(c=>'<th style="text-align:left;border-bottom:2px solid var(--line);padding:3px 6px;white-space:normal">'+c+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr'+(r.on?' style="background:var(--card2);font-weight:600"':'')+'>'+r.c.map(c=>'<td style="border-bottom:1px solid var(--line);padding:3px 6px;vertical-align:top;white-space:normal;text-align:left">'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
    if(sim.vlab)return sim.p.view==='cn'?head('Your notes')+'<p>Run each test, then record it in the table below the bench.</p>':head('Your notes')+'<p>Run each row, then record it in the table below the bench.</p>';
    if(sim.p.ath==='hidden'){
      if(sim.p.view==='cn'){const rows=TESTS.filter(t=>s.log[t.id]).map(t=>({on:t.id===sim.p.test,c:[esc(t.l),esc(findText(s.log[t.id].find))]}));
        return head('Your exam so far')+(rows.length?tbl(['Test','What you saw'],rows):'<p>Run the tests. What you saw builds up here. The nerve names stay hidden until you make your call.</p>');}
      const rows=RT.filter(r=>s.mlog[r.id]).map(r=>{const F=mFindings(sim,r.id),L=s.mlog[r.id];return {on:r.id===sim.p.mtest,c:[esc(r.mo),L.str?'R '+F.str('R')+', L '+F.str('L'):'not yet',L.sen?'R '+F.sen('R')+', L '+F.sen('L'):(r.skin?'not yet':'none on the key')]};});
      return head('Your exam so far')+(rows.length?tbl(['Test','Strength','Sensation'],rows):'<p>Run the tests. What you saw builds up here. The roots stay hidden until you make your call.</p>');}
    if(sim.p.view==='cn'){const cur=testBy(sim.p.test).n;return head('Cranial nerve table')+tbl(['Nerve','Function','Test'],CN.map(c=>({on:c.n===cur,c:['<b>'+c.n+'</b> '+c.name,c.fn,c.tst]})));}
    return head('Your key')+tbl(['Root','Dermatome (skin)','Myotome (muscles)'],RT.map(r=>({on:r.id===sim.p.mtest,c:['<b>'+r.root+'</b>',r.skin||'none listed',r.mo]})));},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,534);
    if(sim.p.view==='cn'){drawAthlete(sim,ctx,k,t);drawCNPanel(sim,ctx,k);}
    else{drawFigure(sim,ctx,k);drawMyo(sim,ctx,k);}},
  narrate(sim){const s=sim.st,hid=concealed(sim);
    if(s.fb)return s.fb.ok?'<b>Good call.</b> '+s.fb.t:s.fb.t;
    if(sim.p.view==='cn'){const r=s.run,t=testBy(sim.p.test),def=curCN(sim);
      if(!r)return hid?'This athlete has one hidden problem in one cranial nerve. Run the tests, compare the two sides, and <b>decide which nerve fits</b>.':'Choose a supply and a test, then run it. <b>Always compare both sides</b>: the athlete’s other side is the best normal you have.';
      if(!r.ok)return 'That supply does not fit this test. A test only works if it stimulates what the nerve does.';
      if(!r.done)return 'Watch the athlete. The athlete’s right is on <b>your left</b>.';
      if(hid)return isAbn(t.id,def)?'One side, or the whole response, looks different here. <b>Which nerve does this job?</b>':'This response looks even. That rules this nerve out, so keep testing.';
      if(sim.vlab)return 'Read the response, then record it in the table.';
      return def?'<b>Abnormal.</b> Nerve '+t.n+' carries '+cnBy(t.n).fn.toLowerCase()+', so damage shows up here, and on one side only.':'<b>Normal.</b> Nerve '+t.n+' is working: '+cnBy(t.n).fn.toLowerCase()+'.';}
    const r=rtBy(sim.p.mtest),m=s.m,lab=inLab(sim,'myotome-dermatome');
    if(!m)return hid?'One nerve root has a hidden problem. A root affects <b>both</b> its muscles and its skin area, on one side.':lab?'Choose a row and test it.':r.skin?r.root+' supplies the skin of the '+r.skin.toLowerCase()+' and the muscles for '+r.mo.toLowerCase()+'. <b>One root, one skin area, one muscle group.</b>':r.root+' runs '+r.mo.toLowerCase()+'. Your key lists no skin area for this root.';
    const f=mFindings(sim,m.test),bad=f.str('R')==='Gives way'||f.str('L')==='Gives way';
    if(m.mode==='str')return bad?'<b>One side gives way.</b> A single root’s muscles can be weak while the other side stays strong.':'Both sides hold. Strength is <b>even</b> on this row.';
    return !rtBy(m.test).skin?'Your key lists no skin area for this row.':bad?'<b>One side feels dull.</b> Skin and strength problems on the same side point to one nerve root.':'Both sides feel the same on this skin area.';},
  lab:{bio:'<p><b>Question:</b> what do normal and abnormal responses look like?</p><ol><li>Set <b>Athlete</b> to Healthy. Run every cranial nerve test. Press <b>Record trial</b> after each one.</li><li>Set <b>Athlete</b> to See abnormal and run the same tests. Record them.</li><li>Then try <b>Hidden deficit</b>. Use your data to name the nerve.</li></ol><p>Write: which finding was the easiest to see, and why does comparing sides help?</p>',
    honors:'<p><b>Question:</b> can you localize a problem from your findings?</p><ol><li>Set <b>Athlete</b> to Hidden deficit. Run all 12 cranial nerve tests and record each one.</li><li>Make your call: which nerve, on which side?</li><li>Switch to <b>Myotomes and dermatomes</b>. Do the same for a nerve root: test strength and sensation on each row and name the root.</li></ol><p>Write: what is the evidence for your call, and what did you rule out?</p>',
    ap:'<p><b>Question:</b> which findings point to one nerve, and which could come from two?</p><ol><li>In See abnormal, compare the pupil response for nerve III with a hidden nerve II problem. Light in the bad eye gives no response in either pupil. Why?</li><li>Run the same comparison for the swallow test, which can fail with IX or X.</li><li>Do several hidden athletes and record your reasoning.</li></ol><p>Write a claim, evidence and reasoning: how does an afferent (input) problem look different from an efferent (output) problem?</p>'},
  terms:[
    {t:'Cranial nerves',d:'Twelve pairs of nerves that leave the brain directly. They are numbered I to XII.'},
    {t:'PEARL',d:'Pupils Equal And Reactive to Light. A normal pupil exam.'},
    {t:'Nystagmus',d:'Jerky, involuntary eye movement, watched for while the eyes track.'},
    {t:'Dermatome',d:'An area of skin supplied by a single spinal nerve root, a map of the body.'},
    {t:'Myotome',d:'A group of muscles innervated by a single spinal nerve root.'},
    {t:'Bilateral comparison',d:'Testing the same thing on both sides. The athlete’s uninjured side is the best normal you have.',lvl:'honors'},
    {t:'Consensual response',d:'Light in one eye narrows the other pupil too, because the signal crosses in the brain stem.',lvl:'ap'},
    {t:'Afferent and efferent',d:'Afferent signals travel in, toward the brain. Efferent signals travel out, toward muscles and glands.',lvl:'ap'}],
  about:'<p><b>For education only.</b> This is not a medical tool. Never use it to self-diagnose. Anyone with a head or neck injury needs a trained clinician.</p><p>The cranial nerve table and the myotome and dermatome key mirror Ms. McKeon’s notes and key. Her notes describe nerve IV as moving the eye down and lateral, and the sideline test tracks a pen there. Clinicians also test it with the eye turned in toward the nose, where a real problem shows most clearly.</p><p>Her notes call nerve XI Accessory and her lab handout calls it Spinal Accessory, so both names appear. The purse motion stands in for her shoulder shrug, and the head turn tests the rest of that nerve’s job. The tool models a problem as one nerve, or one nerve root, on one side. Real injuries can be partial, on both sides, and can involve the brain itself rather than the nerve. Facial weakness shown here is the whole-side pattern. Brain injuries can spare the forehead, which the tool does not show.</p><p>The root map follows the key. Standard charts differ: many place the great toe at L5, not L4, and C2 and C3 have skin areas on the back of the head and neck that the key does not list. C8, T1 to T12 and S1 are not on the key and are not shown. Pupil sizes are typical values, not exact ones.</p>',
  challengeTitle:'What does this finding mean?',
  challenges:[
    {lvl:'bio',instant:true,demo:{test:'face',supply:'none',cn:{n:'VII',side:'L'}},q:'The athlete smiles and the left mouth corner droops, and the left eyebrow will not lift. Which nerve fits?',choices:['VII Facial','V Trigeminal','XII Hypoglossal'],correct:0,explain:'Nerve VII runs the muscles of facial expression. Nerve V carries feeling from the face and works the jaw. Nerve XII moves the tongue.'},
    {lvl:'bio',instant:true,demo:{mtest:'C5',root:{r:'C5',side:'L',grade:3},mode:'str'},q:'Shoulder abduction gives way on the left, and the skin over the left shoulder feels dull. Which root fits your key?',choices:['C5','C4','C7'],correct:0,explain:'On the key, C5 is the anterior and lateral shoulder and shoulder abduction. C4 is the collarbone area and shoulder elevation.'},
    {lvl:'honors',instant:true,demo:{test:'pupil',supply:'light',cn:{n:'III',side:'L'}},q:'Light crosses both eyes. The right pupil narrows, and the left stays wide with a drooping lid. Which nerve fits?',choices:['III Oculomotor','IV Trochlear','VI Abducens'],correct:0,explain:'Nerve III narrows the pupil and lifts the lid. Nerves IV and VI move the eye but do not change pupil size.'},
    {lvl:'honors',instant:true,demo:{test:'lat',supply:'pen',cn:{n:'VI',side:'L'}},q:'Tracking a pen to the athlete’s left, the left eye stops at the middle while the right eye keeps going. Which nerve fits?',choices:['VI Abducens on the left','VI Abducens on the right','III Oculomotor on the right'],correct:0,explain:'Nerve VI pulls that same eye outward. The left eye is the one that cannot move out, so the left nerve VI is the problem.'},
    {lvl:'honors',instant:true,demo:{mtest:'C6',root:{r:'C6',side:'R',grade:3},mode:'sen'},q:'The right thumb feels dull. Which motion should you also test for weakness on that side?',choices:['Elbow flexion and wrist extension','Elbow extension and wrist flexion','Shoulder elevation'],correct:0,explain:'The key pairs the thumb with C6, and C6 also does elbow flexion and wrist extension.'},
    {lvl:'ap',instant:true,demo:{test:'pupil',supply:'light',cn:{n:'II',side:'L'}},q:'Light in the left eye: neither pupil narrows. Light in the right eye: both pupils narrow. Where is the problem?',choices:['Left nerve II, the input side','Left nerve III, the output side','Right nerve III, the output side'],correct:0,explain:'Light in the right eye narrows both pupils, so both outputs (III) work. The left eye’s signal never arrives, so the input (II) on the left is the problem.'},
    {lvl:'ap',instant:true,demo:{test:'shrug',supply:'hands',cn:{n:'XI',side:'L'}},q:'The left shoulder gives way, and the head turns weakly toward the right. Which nerve, on which side?',choices:['XI on the left','XI on the right','XII on the left'],correct:0,explain:'The left sternocleidomastoid, run by the left nerve XI, turns the head toward the right. So the same left nerve explains both findings.'}
  ],
  onChallenge(sim,ch,phase){const d=ch&&ch.demo;if(!d||phase!=='ask'||sim.vlab)return;const s=sim.st;
    if(d.cn){BioLab.setValues(sim,{view:'cn',ath:'healthy',test:d.test,supply:d.supply});s.forced=d.cn;runTest(sim);}
    else if(d.root){BioLab.setValues(sim,{view:'myo',ath:'healthy',mtest:d.mtest});s.forced=d.root;runM(sim,d.mode);}},
  tour:[
    {title:'Open the kit',text:'An Athletic Trainer tests the 12 cranial nerves with simple supplies: gum, a penlight, a pen, a cup of water and two hands. Here the athlete smells mint through each nostril, which tests nerve I, the <b>Olfactory</b> nerve.',speed:1,focus:[20,40,440,480],setup(sim){BioLab.setValues(sim,{view:'cn',ath:'healthy',test:'smell',supply:'scent'});runTest(sim);}},
    {title:'Pupils: PEARL',text:'Light crosses the eyes. Both pupils narrow, equal and reactive to light. Nerve III, the <b>Oculomotor</b> nerve, narrows the pupil. Nerve III also moves the eye and lifts the lid.',speed:1,focus:[20,40,440,300],setup(sim){BioLab.setValues(sim,{view:'cn',ath:'healthy',test:'pupil',supply:'light'});runTest(sim);}},
    {title:'Compare both sides',text:'Now nerve VI on the athlete’s left does not work. As the pen goes out to the left, the left eye stops at the middle. The right side shows you what normal looks like. That’s why you <b>always compare sides</b>.',speed:1,focus:[20,40,440,300],setup(sim){BioLab.setValues(sim,{view:'cn',ath:'shown',test:'lat',supply:'pen'});runTest(sim);}},
    {title:'Spinal nerve roots',text:'Below the head, spinal nerve roots take over. Each root has a <b>myotome</b>, the muscles it runs, and a <b>dermatome</b>, the skin it feels. C5 runs shoulder abduction and feels the anterior and lateral shoulder.',speed:1,focus:[0,0,800,533],setup(sim){BioLab.setValues(sim,{view:'myo',ath:'healthy',mtest:'C5'});runM(sim,'str');}},
    {title:'One root, two findings',text:'When one root is hurt, its muscles test weak and its skin feels dull, on that same side. Here the left side gives way at shoulder abduction. Now touch the skin.',speed:1,focus:[286,8,510,517],setup(sim){BioLab.setValues(sim,{view:'myo',ath:'shown',mtest:'C5'});runM(sim,'str');}},
    {title:'The skin confirms it',text:'The athlete closes their eyes while you touch each side. The left shoulder feels dull, so weakness and sensation match. That points to one nerve root, <b>C5</b>, on the left.',speed:1,focus:[286,8,510,517],setup(sim){BioLab.setValues(sim,{view:'myo',ath:'shown',mtest:'C5'});runM(sim,'sen');}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{view:'cn',ath:'healthy',test:'smell',supply:'scent'});sim.st.run=null;sim.st.m=null;sync(sim);},
  thumbSetup(sim){BioLab.setValues(sim,{test:'pupil',supply:'light'});runTest(sim);},thumbFrames:60
};
BioLab.register(SIM);
})();
