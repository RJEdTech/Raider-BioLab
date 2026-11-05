(function(){
'use strict';
/* Manual muscle testing. The two tables in TESTS mirror McKeon's Shoulder MMT and SPAT MMT sheets word for word.
   Stage: the patient on a table in the sheet's position, target muscle highlighted, P and R hand markers, movement and resistance arrows.
   Athlete model: each simulated athlete has one hidden pattern (ATHLETES). A test on one side, at one load, gives an outcome from the 0 to 5 ladder. */
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;
const D2R=Math.PI/180,dir=a=>({x:Math.cos(a*D2R),y:Math.sin(a*D2R)}),lp=(a,b,f)=>({x:lerp(a.x,b.x,f),y:lerp(a.y,b.y,f)}),add=(p,d,s)=>({x:p.x+d.x*s,y:p.y+d.y*s});
const SEG={tr:136,ua:70,fa:64,hd:20,th:100,sh:96,ft:30,hr:24};
const TT=322,FLOOR=438;
/* figure builder. Angles are absolute canvas degrees: 0 right, 90 down, 180 left, 270 up. a is the side of the trunk limb A sits on. */
function fig(o){const J={o};const t=o.t;J.pel={x:o.x,y:o.y};J.neck=add(J.pel,dir(t),SEG.tr);const pp=dir(t+90),a=o.a===undefined?1:o.a,sw=o.sw||0,hw=o.hw||0;
  J.head=add(J.neck,dir(o.ht===undefined?t:o.ht),SEG.hr+13);
  J.sA=add(J.neck,pp,a*sw);J.sB=add(J.neck,pp,-a*sw);J.hipA=add(J.pel,pp,a*hw);J.hipB=add(J.pel,pp,-a*hw);
  const arm=(s,A,n)=>{J['s'+n]=s;J['e'+n]=add(s,dir(A[0]),SEG.ua*(A[3]||1));J['w'+n]=add(J['e'+n],dir(A[1]),SEG.fa*(A[2]||1));J['h'+n]=add(J['w'+n],dir(A[1]),SEG.hd*(A[2]||1));};
  const leg=(h,A,n)=>{J['k'+n]=add(h,dir(A[0]),SEG.th*(A[3]||1));J['a'+n]=add(J['k'+n],dir(A[1]),SEG.sh*(A[4]||1));J['t'+n]=add(J['a'+n],dir(A[2]),SEG.ft);};
  arm(J.sA,o.armA,'A');arm(J.sB,o.armB,'B');leg(J.hipA,o.legA,'A');leg(J.hipB,o.legB,'B');
  J.tw=o.tw||46;return J;}
const straightArm=(J,n,hand)=>{const s=J['s'+n];J['e'+n]=lp(s,hand,.5);J['w'+n]=lp(s,hand,.92);J['h'+n]=hand;};
function caps(J){return {far:[[[J.sB,J.eB,J.wB],13],[[J.wB,J.hB],11],[[J.hipB,J.kB],21],[[J.kB,J.aB],15],[[J.aB,J.tB],12]],
  near:[[[J.sA,J.neck,J.sB,J.hipB,J.hipA,J.sA],J.tw],[[J.neck,J.head],12],[[J.hipA,J.kA],22],[[J.kA,J.aA],16],[[J.aA,J.tA],13],[[J.sA,J.eA],15],[[J.eA,J.wA],12],[[J.wA,J.hA],11]]};}
const off=(p,q,f,o)=>{const m=lp(p,q,f),d={x:q.x-p.x,y:q.y-p.y},l=Math.hypot(d.x,d.y)||1;return {x:m.x-d.y/l*o,y:m.y+d.x/l*o};};
const on=(p,q,f0,f1,o,w)=>[off(p,q,f0,o),off(p,q,f1,o),w];
/* ready-made bodies */
const supTop=(hand)=>{const J=fig({x:560,y:260,t:180,a:-1,sw:38,hw:25,tw:24,armA:[90,90],armB:[-6,-6],legA:[3,3,60],legB:[-3,-3,-60]});straightArm(J,'A',hand);return J;};
const proneTop=(ang)=>fig({x:560,y:270,t:180,a:1,sw:38,hw:25,tw:24,armA:[ang,ang],armB:[6,6],legA:[-3,-3,-60],legB:[3,3,60]});
const seatSide=(ua,fa,fm,th,sh,ft,x)=>fig({x:x||420,y:TT-24,t:270,armA:[ua,fa,fm||1],armB:[92,50],legA:[th===undefined?0:th,sh===undefined?90:sh,ft===undefined?10:ft],legB:[2,84,8]});
const seatFront=(ua,fa,fm,opts)=>fig(Object.assign({x:480,y:TT-24,t:270,a:-1,sw:40,hw:26,tw:26,armA:[ua,fa,fm||1],armB:(opts&&opts.a===1)?[102,102]:[78,78],legA:[90,90,90,.28,.85],legB:[90,90,90,.28,.85]},opts||{}));
const supSide=(o)=>fig(Object.assign({x:540,y:TT-24,t:180,armA:[0,0],armB:[2,2],legA:[0,0,-90],legB:[0,0,-86]},o));
const proneSide=(o)=>fig(Object.assign({x:520,y:TT-24,t:180,armA:[4,4],armB:[0,0],legA:[0,0,0],legB:[0,0,20]},o));
const sideLie=(top,bot,th)=>fig({x:520,y:TT-44,t:180,a:1,sw:32,hw:28,tw:22,armA:[20,4],armB:[2,0],legA:[top,top,top-90],legB:[bot,bot,bot-90]});
const pm=(cx,cy)=>({x:cx,y:cy});
/* Each test: sheet words, then the picture. scene(u) gets u from 0 (test position) to 1 (moved). flip mirrors the picture for the patient's left side. */
const TESTS=[
{id:'pecU',g:'s',m:'Pectoralis Major',f:'Upper',pos:'Supine',hands:'One hand on pectoralis major, one hand on bicep (providing resistance)',test:'Instruct patient to punch the person behind them',
 short:'Supine',flip:'y',cy:260,top:1,ins:{v:'front',p:[[.03,.175,.105,.18,.018]]},
 why:'The upper fibers run from the clavicle to the humerus, so they pull the arm up and across the body, toward the opposite ear.',
 scene(u){const J=supTop(pm(lerp(290,320,u),lerp(428,370,u)));return {J,mus:[[{x:J.neck.x+8,y:J.neck.y+2},{x:J.sA.x-2,y:J.sA.y+2},9]],P:[{x:J.neck.x+22,y:J.neck.y-16}],R:[lp(J.sA,J.hA,.45)],mv:[{at:lp(J.sA,J.hA,.86),ang:262,len:66}],rs:[{at:lp(J.sA,J.hA,.45),ang:82,len:58}]};},
 nerve:'Lateral pectoral nerve',root:'C5 to C7',inj:'A one-sided weak or painful test points to a pectoralis major strain. Weakness with no pain raises a nerve question.'},
{id:'pecM',g:'s',m:'Pectoralis Major',f:'Middle',pos:'Supine',hands:'One hand on pectoralis major, one hand on bicep (providing resistance)',test:'Instruct patient to "punch" the person next to them',
 short:'Supine',flip:'y',cy:260,top:1,ins:{v:'front',p:[[.02,.205,.105,.195,.03]]},
 why:'The middle fibers run straight across from the sternum to the humerus, so they pull the arm directly across the chest. That movement is horizontal adduction.',
 scene(u){const J=supTop(pm(422,lerp(446,370,u)));return {J,mus:[[{x:J.neck.x+46,y:J.neck.y+2},{x:J.sA.x+2,y:J.sA.y+2},11]],P:[{x:J.neck.x+58,y:J.neck.y-16}],R:[lp(J.sA,J.hA,.45)],mv:[{at:{x:J.hA.x+26,y:J.hA.y},ang:270,len:66}],rs:[{at:{x:lp(J.sA,J.hA,.45).x-26,y:lp(J.sA,J.hA,.45).y},ang:90,len:58}]};},
 nerve:'Medial and lateral pectoral nerves',root:'C6 to T1',inj:'A one-sided weak or painful test points to a pectoralis major strain, often from bench pressing.'},
{id:'pecL',g:'s',m:'Pectoralis Major',f:'Lower',pos:'Supine',hands:'One hand on pectoralis major, one hand on bicep (providing resistance)',test:'Instruct patient to put something in the opposite pocket',
 short:'Supine',flip:'y',cy:260,top:1,ins:{v:'front',p:[[.03,.245,.1,.205,.022]]},
 why:'The lower fibers rise from the lower sternum and ribs to the humerus, so they pull the arm down and across, toward the opposite hip.',
 scene(u){const J=supTop(pm(lerp(530,530,u),lerp(424,366,u)));return {J,mus:[[{x:J.neck.x+84,y:J.neck.y+4},{x:J.sA.x+4,y:J.sA.y+2},11]],P:[{x:J.neck.x+96,y:J.neck.y-14}],R:[lp(J.sA,J.hA,.45)],mv:[{at:{x:J.hA.x+30,y:J.hA.y-8},ang:285,len:66}],rs:[{at:{x:lp(J.sA,J.hA,.45).x+32,y:lp(J.sA,J.hA,.45).y+6},ang:105,len:54}]};},
 nerve:'Medial and lateral pectoral nerves',root:'C6 to T1',inj:'A one-sided weak or painful test points to a pectoralis major strain.'},
{id:'deltA',g:'s',m:'Deltoid',f:'Anterior',pos:'Sitting with hands pronated 90 degrees',hands:'One hand on anterior deltoid, one hand on humerus (providing resistance)',test:'Instruct patient to move into shoulder flexion',
 short:'Sitting',ins:{v:'front',p:[[.112,.175,.13,.235,.02]]},
 why:'The anterior fibers sit in front of the shoulder joint, so they lift the arm forward. That movement is shoulder flexion.',
 scene(u){const a=lerp(25,0,u),J=seatSide(a,a);return {J,mus:[on(J.sA,J.eA,.0,.55,-7,10)],P:[off(J.sA,J.eA,.2,-10)],R:[lp(J.sA,J.eA,.85)],mv:[{at:lp(J.wA,J.hA,.5),ang:a-90,len:64}],rs:[{at:{x:lp(J.sA,J.eA,.85).x,y:lp(J.sA,J.eA,.85).y-20},ang:90,len:54,back:1}]};},
 nerve:'Axillary nerve',root:'C5, C6',inj:'All three deltoid fibers weak on one side suggests the axillary nerve, which can be stretched in an anterior shoulder dislocation.'},
{id:'deltL',g:'s',m:'Deltoid',f:'Lateral',pos:'Sitting with elbow flexed 90 degrees',hands:'One hand on lateral deltoid, one hand on distal humerus (providing resistance)',test:'Instruct patient to abduct shoulder',
 short:'Sitting',flip:'x',cx:480,ins:{v:'front',p:[[.128,.175,.14,.24,.024]]},
 why:'The lateral fibers run over the top of the shoulder, so they lift the arm out to the side. That movement is abduction. Your key lists shoulder abduction as the C5 myotome.',
 scene(u){const a=lerp(150,178,u),J=seatFront(a,a+6,.32);return {J,mus:[on(J.sA,J.eA,.0,.6,0,12)],P:[lp(J.sA,J.eA,.2)],R:[lp(J.sA,J.eA,.92)],mv:[{at:{x:J.eA.x-34,y:J.eA.y},ang:a+78,len:64}],rs:[{at:{x:lp(J.sA,J.eA,.92).x,y:lp(J.sA,J.eA,.92).y-16},ang:a-90,len:50,back:1}]};},
 nerve:'Axillary nerve',root:'C5, C6',inj:'Shoulder abduction is the C5 myotome on the course key. All three deltoid fibers weak on one side suggests the axillary nerve.'},
{id:'deltP',g:'s',m:'Deltoid',f:'Posterior',pos:'Sitting with elbow flexed 90 degrees and shoulder abducted 90 degrees',hands:'One hand on posterior deltoid, one hand mid-shaft of humerus (providing resistance)',test:'Instruct patient to horizontally extend shoulder',
 short:'Sitting, seen from above',note:['Athlete faces up the screen'],ins:{v:'back',p:[[.115,.175,.13,.235,.02]]},above:1,flip:'x',cx:480,
 why:'The posterior fibers sit behind the shoulder joint, so they pull the raised arm backward. That movement is horizontal extension, also called horizontal abduction.',
 scene(u){const a=lerp(0,16,u),s={x:530,y:250},e=add(s,dir(a),92),w=add(e,dir(a-90),78),h=add(w,dir(a-90),22);
   return {above:{s,e,w,h},mus:[[add(s,dir(a+60),18),add(lp(s,e,.55),dir(a+90),8),10]],P:[add(s,dir(a+70),24)],R:[lp(s,e,.5)],mv:[{at:{x:e.x+18,y:e.y+18},ang:a+90,len:62}],rs:[{at:{x:lp(s,e,.5).x,y:lp(s,e,.5).y-18},ang:a-90,len:50}]};},
 nerve:'Axillary nerve',root:'C5, C6',inj:'All three deltoid fibers weak on one side suggests the axillary nerve.'},
{id:'biceps',g:'s',m:'Biceps Brachii',f:'',pos:'Sitting with shoulder flexed 45 degrees and elbow flexed 90 degrees',hands:'One hand on biceps tendon, one hand on distal forearm (providing resistance)',test:'Instruct patient to perform a bicep curl',
 short:'Sitting',ins:{v:'front',p:[[.125,.25,.146,.335,.02]]},
 why:'The biceps crosses the front of the elbow, so it bends the elbow. You can feel its tendon tighten in the crease. Your key lists elbow flexion as the C6 myotome.',
 scene(u){const f=lerp(-45,-75,u),J=seatSide(45,f);return {J,mus:[on(J.sA,J.eA,.2,.92,-8,10)],P:[off(J.sA,J.eA,.9,-9)],R:[lp(J.eA,J.wA,.85)],mv:[{at:off(J.eA,J.hA,.75,-30),ang:f-90,len:58}],rs:[{at:off(J.eA,J.wA,.85,18),ang:f+90,len:50,back:1}]};},
 nerve:'Musculocutaneous nerve',root:'C5, C6',inj:'Elbow flexion is the C6 myotome on the course key. Weakness with pain in the front of the shoulder points toward the biceps tendon.'},
{id:'supra',g:'s',m:'Supraspinatus',f:'',pos:'Sitting or standing with shoulder in scaption (flexed 90 degrees and adducted 45 degrees with hands pronated 270 degrees)',hands:'One hand on supraspinatus, one hand mid shaft of humerus (providing resistance)',test:'Instruct patient to move into shoulder flexion',
 short:'Scaption',flip:'x',cx:480,ins:{v:'back',p:[[.03,.165,.108,.168,.014]]},
 why:'The supraspinatus sits on top of the scapula and helps start lifting the arm. In scaption the arm lines up with the scapula. The thumb-down position is often called the empty can.',
 scene(u){const a=lerp(186,200,u),J=seatFront(a,a,.92,{});J.eA=add(J.sA,dir(a),58);J.wA=add(J.eA,dir(a),52);J.hA=add(J.wA,dir(a),16);return {J,mus:[on(J.neck,J.sA,.1,1.05,0,9)],P:[{x:J.neck.x,y:J.neck.y+2}],R:[lp(J.sA,J.eA,.7)],mv:[{at:{x:J.wA.x,y:J.wA.y-14},ang:270,len:60}],rs:[{at:{x:lp(J.sA,J.eA,.7).x,y:lp(J.sA,J.eA,.7).y-16},ang:90,len:50,back:1}]};},
 nerve:'Suprascapular nerve',root:'C5, C6',inj:'Pain and weakness on one side suggests a rotator cuff strain or impingement. Compare with Neer’s and Hawkins-Kennedy in the clinic tool.'},
{id:'trapU',g:'s',m:'Trapezius',f:'Upper',pos:'Sitting with shoulder in slight abduction (10 to 15 degrees)',hands:'One hand on trapezius, one hand on acromioclavicular joint (providing resistance)',test:'Instruct patient to shrug their shoulders',
 short:'Sitting, seen from behind',back:1,flip:'x',cx:480,flipBack:1,ins:{v:'back',p:[[.02,.135,.095,.166,.018]]},
 why:'The upper fibers run from the neck down to the outer clavicle and acromion, so they lift the shoulder toward the ear.',
 scene(u){const J=seatFront(lerp(78,78,u),78,1,{a:1,y:TT-24-lerp(0,0,u)});const lift=lerp(0,12,u);J.sA.y-=lift;return {J,mus:[on(J.head,J.sA,.42,.98,0,12)],P:[{x:J.neck.x-2,y:J.neck.y+6}],R:[{x:J.sA.x+8,y:J.sA.y-2}],mv:[{at:{x:J.sA.x+40,y:J.sA.y+22},ang:270,len:56}],rs:[{at:{x:J.sA.x+8,y:J.sA.y-20},ang:90,len:42,back:1}]};},
 nerve:'Spinal accessory nerve',root:'Cranial nerve XI',inj:'All three trapezius fibers weak on one side suggests cranial nerve XI, which also runs the shoulder shrug in the cranial nerve lab.'},
{id:'trapM',g:'s',m:'Trapezius',f:'Middle',pos:'Prone with shoulder abducted 90 degrees',hands:'One hand on trapezius, one hand on spine of scapula (providing resistance)',test:'Instruct patient to horizontally extend the arm',
 short:'Prone',flip:'y',cy:270,top:1,prone:1,note:['Seen from above','Dot: arm lifts up','X: you press down'],ins:{v:'back',p:[[.02,.19,.095,.18,.022]]},
 why:'The middle fibers run straight out from the spine to the scapula, so they pull the scapula toward the spine as the arm lifts off the table.',
 scene(u){const J=proneTop(270);const sp=off(J.neck,J.sA,.75,-34);return {J,mus:[[{x:J.neck.x+30,y:J.neck.y+2},{x:J.sA.x+30,y:J.sA.y+2},13]],P:[{x:J.neck.x+64,y:J.neck.y-6}],R:[{x:J.sA.x+18,y:J.sA.y+10}],oopM:lp(J.eA,J.wA,.4),oopR:{x:J.sA.x+50,y:J.sA.y-2}};},
 nerve:'Spinal accessory nerve',root:'Cranial nerve XI',inj:'All three trapezius fibers weak on one side suggests cranial nerve XI.'},
{id:'trapL',g:'s',m:'Trapezius',f:'Lower',pos:'Prone with shoulder abducted 120 degrees',hands:'One hand on trapezius, one hand on spine of scapula (providing resistance)',test:'Instruct patient to move into diagonal extension',
 short:'Prone',flip:'y',cy:270,top:1,prone:1,note:['Seen from above','Dot: arm lifts up','X: you press down'],ins:{v:'back',p:[[.012,.27,.07,.19,.02]]},
 why:'The lower fibers run up and out from the lower thoracic spine to the scapula. At 120 degrees the arm lines up with those fibers, so the diagonal lift loads them.',
 scene(u){const J=proneTop(240);return {J,mus:[[{x:J.neck.x+118,y:J.neck.y-2},{x:J.sA.x+24,y:J.sA.y+6},12]],P:[{x:J.neck.x+104,y:J.neck.y-24}],R:[{x:J.sA.x+14,y:J.sA.y+12}],oopM:lp(J.eA,J.wA,.4),oopR:{x:J.sA.x+46,y:J.sA.y-2}};},
 nerve:'Spinal accessory nerve',root:'Cranial nerve XI',inj:'All three trapezius fibers weak on one side suggests cranial nerve XI.'},
{id:'triceps',g:'s',m:'Triceps Brachii',f:'',pos:'Supine with shoulder flexed 90 degrees and elbow flexed 90 degrees',hands:'One hand on triceps brachii, one hand on distal forearm (providing resistance)',test:'Instruct patient to extend their elbow',
 short:'Supine',ins:{v:'back',p:[[.125,.25,.148,.34,.022]]},
 why:'The triceps crosses the back of the elbow, so it straightens the elbow. Lying supine with the upper arm vertical makes it lift the forearm against gravity. Your key lists elbow extension as the C7 myotome.',
 scene(u){const f=lerp(180,240,u),J=supSide({armA:[270,f]});return {J,mus:[on(J.sA,J.eA,.2,.92,-8,10)],P:[off(J.sA,J.eA,.55,-9)],R:[lp(J.eA,J.wA,.85)],mv:[{at:off(J.eA,J.hA,.75,18),ang:f+90,len:56}],rs:[{at:off(J.eA,J.wA,.72,-18),ang:f-90,len:46,back:1}]};},
 nerve:'Radial nerve',root:'C6 to C8',inj:'Elbow extension is the C7 myotome on the course key. Weakness here with neck or arm symptoms points toward the C7 root.'},
/* lower body sheet */
{id:'sart',g:'h',m:'Sartorius',f:'',pos:'Seated with knees flexed over table edge',hands:'Resistance at medial ankle and lateral knee',test:'Tell athlete to perform hip flexion, abduction, and external rotation (figure four)',
 short:'Seated',flip:'x',cx:480,ins:{v:'front',p:[[.085,.45,.03,.7,.012]]},
 why:'The sartorius crosses both the hip and the knee, so it flexes, abducts and externally rotates the hip. That is why the test uses two resistance points.',
 scene(u){const J=seatFront(102,102,1,{legA:[lerp(108,118,u),lerp(90,62,u),lerp(40,10,u),.42,.8],legB:[90,90,90,.28,.85]});return {J,two:1,mus:[on(J.hipA,J.kA,.1,.95,4,9)],P:[],R:[{x:J.kA.x-16,y:J.kA.y},{x:J.aA.x+15,y:J.aA.y}],mv:[{at:{x:J.aA.x-78,y:J.aA.y+24},ang:-6,len:60}],rs:[{at:{x:J.aA.x+66,y:J.aA.y},ang:180,len:34},{at:{x:J.kA.x-82,y:J.kA.y},ang:0,len:46}]};},
 nerve:'Femoral nerve',root:'L2, L3',inj:'Pain high on the front of the hip with this test can point to a sartorius or hip flexor strain.'},
{id:'vm',g:'h',m:'Vastus Medialis',f:'',pos:'Seated with knees flexed over table edge',hands:'Resistance downward over distal tibia',test:'Tell athlete to turn their toes out and straighten their knee',
 short:'Seated, toes out',toes:'Toes turned out',ty:418,ins:{v:'front',p:[[.03,.62,.04,.69,.02]]},
 why:'The vastus medialis is the inner quadriceps and it straightens the knee. Your sheet turns the toes out to bias the test toward the inner quadriceps.',
 scene(u){const s=lerp(90,30,u),J=seatSide(92,70,1,0,s,s-80);return {J,mus:[on(J.hipA,J.kA,.55,.92,6,11)],P:[],R:[lp(J.kA,J.aA,.84)],mv:[{at:off(J.kA,J.tA,.92,-30),ang:s-90,len:58}],rs:[{at:off(J.kA,J.aA,.84,22),ang:90,len:48,back:1}]};},
 nerve:'Femoral nerve',root:'L2 to L4',inj:'Knee extension is the L3 myotome on the course key. Inner quad weakness often follows a knee injury or knee surgery.'},
{id:'vl',g:'h',m:'Vastus Lateralis',f:'',pos:'Seated with knees flexed over table edge',hands:'Resistance downward over distal tibia',test:'Tell athlete to turn their toes in and straighten their knee',
 short:'Seated, toes in',toes:'Toes turned in',ty:418,ins:{v:'front',p:[[.095,.53,.082,.68,.02]]},
 why:'The vastus lateralis is the outer quadriceps and it straightens the knee. Your sheet turns the toes in to bias the test toward the outer quadriceps.',
 scene(u){const s=lerp(90,30,u),J=seatSide(92,70,1,0,s,s-80);return {J,mus:[on(J.hipA,J.kA,.2,.9,-8,11)],P:[],R:[lp(J.kA,J.aA,.84)],mv:[{at:off(J.kA,J.tA,.92,-30),ang:s-90,len:58}],rs:[{at:off(J.kA,J.aA,.84,22),ang:90,len:48,back:1}]};},
 nerve:'Femoral nerve',root:'L2 to L4',inj:'Knee extension is the L3 myotome on the course key. Pain with a firm lump in the outer thigh would make you think of a contusion.'},
{id:'rf',g:'h',m:'Rectus Femoris',f:'',pos:'Seated with knee extended',hands:'Resistance downward on distal thigh',test:'Tell athlete to flex their hip while keeping their knee extended',
 short:'Seated, knee extended',ins:{v:'front',p:[[.065,.49,.058,.68,.022]]},
 why:'The rectus femoris is the one quadriceps muscle that crosses the hip. Keeping the knee straight while lifting the thigh makes it work at both joints.',
 scene(u){const a=lerp(0,-16,u),J=seatSide(92,70,1,a,a,a-80);return {J,mus:[on(J.hipA,J.kA,.1,.92,-7,11)],P:[],R:[lp(J.hipA,J.kA,.84)],mv:[{at:off(J.hipA,J.aA,.8,-28),ang:270,len:56}],rs:[{at:off(J.hipA,J.kA,.84,-24),ang:90,len:46,back:1}]};},
 nerve:'Femoral nerve',root:'L2 to L4',inj:'Hip flexion is the L1/L2 myotome on the course key. Pain on one side at the front of the hip or thigh suggests a quadriceps strain.'},
{id:'add',g:'h',m:'Adductors (Longus and Magnus)',f:'',pos:'Side-lying, test leg on bottom, hip slightly extended',hands:'Resistance downward on distal medial thigh',test:'Tell athlete to adduct their bottom leg upward',
 short:'Side-lying, test leg on bottom',ins:{v:'front',p:[[.02,.51,.035,.625,.024]]},
 why:'The adductors run from the pelvis to the inner thigh, so they pull the leg toward the midline. In side-lying, the bottom leg has to lift against gravity to do that.',
 scene(u){const b=lerp(-1,-10,u),J=sideLie(-26,b);return {J,lower:1,mus:[on(J.hipB,J.kB,.05,.72,-7,10)],P:[],R:[lp(J.hipB,J.kB,.86)],mv:[{at:{x:J.aB.x+30,y:J.aB.y+4},ang:270,len:48}],rs:[{at:{x:lp(J.hipB,J.kB,.86).x-34,y:lp(J.hipB,J.kB,.86).y-54},ang:90,len:40}]};},
 nerve:'Obturator nerve (the magnus also gets the sciatic nerve)',root:'L2 to L4',inj:'Pain high in the inner thigh on one side suggests a groin strain.'},
{id:'gmax',g:'h',m:'Gluteus Maximus',f:'',pos:'Prone with knee flexed to 90',hands:'Resistance downward on distal posterior thigh',test:'Tell the athlete to extend their hip, lifting their thigh off the table',
 short:'Prone',ins:{v:'back',p:[[.02,.445,.09,.49,.04]]},
 why:'The gluteus maximus extends the hip. Bending the knee to 90 degrees slackens the hamstrings, so they can help less.',
 scene(u){const a=lerp(-2,-18,u),J=proneSide({legA:[a,a-88,a-88+90]});return {J,mus:[[{x:J.hipA.x-6,y:J.hipA.y-22},{x:J.hipA.x+34,y:J.hipA.y-12},14]],P:[],R:[lp(J.hipA,J.kA,.82)],mv:[{at:off(J.hipA,J.kA,.5,-28),ang:275,len:52}],rs:[{at:off(J.hipA,J.kA,.82,-20),ang:90,len:40,back:1}]};},
 nerve:'Inferior gluteal nerve',root:'L5 to S2',inj:'Weakness on one side can follow low back problems or an old hamstring injury, and it changes how the whole chain moves.'},
{id:'gmed',g:'h',m:'Gluteus Medius',f:'',pos:'Side-lying, test leg on top, hip slightly extended and abducted',hands:'Resistance downward on lateral distal thigh',test:'Tell athlete to abduct their hip upward',
 short:'Side-lying, test leg on top',ins:{v:'back',p:[[.05,.4,.097,.44,.022]]},
 why:'The gluteus medius sits on the outer hip and lifts the leg to the side. Keeping the hip slightly extended stops the hip flexors from taking over.',
 scene(u){const t=lerp(-16,-30,u),J=sideLie(t,0);return {J,mus:[on(J.hipA,J.kA,-.1,.26,-4,12)],P:[],R:[lp(J.hipA,J.kA,.88)],mv:[{at:off(J.hipA,J.aA,.8,-28),ang:t-80,len:52}],rs:[{at:off(J.hipA,J.kA,.88,-24),ang:t+90,len:40,back:1}]};},
 nerve:'Superior gluteal nerve',root:'L4 to S1',inj:'Weakness on one side shows up as the pelvis dropping when the athlete stands on that leg, which is called a Trendelenburg sign.'},
{id:'semi',g:'h',m:'Semitendinosus and Semimembranosus',f:'',pos:'Prone with knee flexed to 45, tibia IR',hands:'Encourage knee extension with resistance',test:'Tell athlete to bring their heel to their butt',
 short:'Prone, tibia IR',toes:'Tibia rotated in',ty:170,ins:{v:'back',p:[[.04,.54,.04,.7,.02]]},
 why:'These inner hamstrings bend the knee and they also rotate the tibia in. Your sheet starts the tibia in internal rotation to bias the test toward them.',
 scene(u){const s=lerp(-45,-80,u),J=proneSide({legA:[0,s,s+90]});return {J,mus:[on(J.hipA,J.kA,.2,.92,-7,10)],P:[],R:[lp(J.kA,J.aA,.84)],mv:[{at:off(J.kA,J.aA,.9,-26),ang:s-90,len:52}],rs:[{at:off(J.kA,J.aA,.84,26),ang:s+90,len:44,back:1}]};},
 nerve:'Sciatic nerve, tibial division',root:'L5 to S2',inj:'Pain with weakness on one side suggests a hamstring strain, common in sprinters.'},
{id:'bf',g:'h',m:'Biceps Femoris',f:'',pos:'Prone with knee flexed to 45, tibia ER',hands:'Encourage knee extension with resistance',test:'Tell athlete to bring their heel to their butt',
 short:'Prone, tibia ER',toes:'Tibia rotated out',ty:170,ins:{v:'back',p:[[.076,.54,.072,.7,.02]]},
 why:'The biceps femoris is the outer hamstring. It bends the knee and rotates the tibia out, so your sheet starts the tibia in external rotation.',
 scene(u){const s=lerp(-45,-80,u),J=proneSide({legA:[0,s,s+90]});return {J,mus:[on(J.hipA,J.kA,.2,.92,-7,10)],P:[],R:[lp(J.kA,J.aA,.84)],mv:[{at:off(J.kA,J.aA,.9,-26),ang:s-90,len:52}],rs:[{at:off(J.kA,J.aA,.84,26),ang:s+90,len:44,back:1}]};},
 nerve:'Sciatic nerve (long head tibial division, short head common fibular division)',root:'L5 to S2',inj:'Pain with weakness on one side suggests a hamstring strain, and this head is strained most often.'},
{id:'gas',g:'h',m:'Gastrocnemius',f:'',pos:'Standing on test leg',hands:'N/A',test:'Instruct patient to perform single-leg heel raises',
 short:'Standing',stand:1,ins:{v:'back',p:[[.055,.755,.055,.84,.028]]},
 why:'The gastrocnemius lifts the heel. No clinician can match a calf’s strength by hand, so body weight is the resistance and you count the raises.',
 scene(u){const lift=lerp(0,16,u),x=460,y=FLOOR-SEG.sh-SEG.th-14-lift;const J=fig({x,y,t:270,armA:[86,70],armB:[92,80],legA:[90,90,0],legB:[120,30,30]});J.aA.y=FLOOR-14-lift;J.kA.y=J.aA.y-SEG.sh;J.hipA.y=J.kA.y-SEG.th;J.tA={x:J.aA.x+34,y:FLOOR-3};return {J,mus:[on(J.kA,J.aA,.08,.6,-9,11)],P:[],R:[],mv:[{at:{x:J.aA.x-28,y:J.aA.y+6},ang:270,len:50}],rs:[]};},
 nerve:'Tibial nerve',root:'S1, S2',inj:'Fewer raises than the other side, with pain in the calf, suggests a calf strain. Weakness with no pain raises the S1 root.'}
];
const TBY={};TESTS.forEach(t=>TBY[t.id]=t);
const nameOf=t=>t.m+(t.f?', '+t.f:'');
const LOADS={ge:'Gravity eliminated',grav:'Against gravity',mod:'Moderate resistance',max:'Maximal resistance'};
const LADDER=[[0,'No contraction you can see or feel.'],[1,'A flicker you can feel, with no movement.'],[2,'Full range only with gravity eliminated.'],[3,'Full range against gravity, but no added resistance.'],[4,'Full range against gravity, holds moderate resistance.'],[5,'Full range against gravity, holds maximal resistance.']];
/* the simulated athletes. w: grade on the weak side only. pain: tests that hurt on that side. base: grade everywhere else, on both sides. */
const ATHLETES=[
 {id:'clear',who:'Cross-country runner, preseason screen',cc:'No complaints. The team wants a baseline.',base:5,w:{},pain:[],pat:'No deficit. Every test matches side to side.'},
 {id:'even',who:'First-year lifter, preseason screen',cc:'No complaints, and new to strength training.',base:4,w:{},pain:[],pat:'No deficit. Grade 4 on both sides is this athlete’s normal, which you only learn by comparing sides.'},
 {id:'axil',who:'Soccer goalkeeper, two weeks after a shoulder dislocation',cc:'Out of the sling. “My shoulder feels weak when I reach out to the side.”',base:5,w:{deltA:3,deltL:3,deltP:3},pain:[],pat:'Axillary nerve (C5, C6). All three deltoid fibers are weak with no pain, after an anterior dislocation.'},
 {id:'cuff',who:'Baseball pitcher',cc:'“It hurts to throw, and lifting my arm in front of me is sore.”',base:5,w:{supra:4},pain:['supra'],pat:'Rotator cuff strain. Supraspinatus alone is painful and gives way at maximal resistance.'},
 {id:'c6',who:'Football linebacker, day after a hard tackle',cc:'“I got a burning feeling down my arm that went away, but my arm is weak.”',base:5,w:{biceps:3,deltL:4,supra:4},pain:[],pat:'C5, C6 nerve root (a burner). Biceps, lateral deltoid and supraspinatus share these roots and are weak with no local pain.'},
 {id:'c7',who:'Wrestler with neck pain',cc:'“My neck is stiff and my push-ups feel weak on one side.”',base:5,w:{triceps:3},pain:[],pat:'C7 nerve root. Elbow extension is the C7 myotome on your key, and the test has no local pain.'},
 {id:'cn11',who:'Lacrosse player, stick slash to the side of the neck',cc:'“I can’t shrug that shoulder like I used to.”',base:5,w:{trapU:3,trapM:3,trapL:3},pain:[],pat:'Cranial nerve XI (spinal accessory). All three trapezius fibers are weak, with no pain.'},
 {id:'pec',who:'Lineman, felt a tear on the bench press',cc:'“Something grabbed in my chest near my armpit.”',base:5,w:{pecM:4,pecL:4},pain:['pecM','pecL'],pat:'Pectoralis major strain. Middle and lower fibers are painful, while the upper fibers hold.'},
 {id:'gmed',who:'Distance runner',cc:'“My hip gets tired and my coach says my pelvis drops when I run.”',base:5,w:{gmed:3},pain:[],pat:'Gluteus medius weakness (superior gluteal nerve, L4 to S1). Only hip abduction is weak.'},
 {id:'l3',who:'Hockey player with low back pain',cc:'“My thigh feels like it could buckle on stairs.”',base:5,w:{vm:3,vl:3,rf:4,sart:4},pain:[],pat:'L3 root or femoral nerve. All the front-of-thigh muscles are weak with no local pain.'},
 {id:'ham',who:'Sprinter, pulled up in the 200 m',cc:'“I felt a grab in the back of my thigh.”',base:5,w:{bf:4},pain:['bf'],pat:'Hamstring strain, biceps femoris. The outer hamstring test hurts and gives way, while the inner hamstring test holds.'},
 {id:'groin',who:'Soccer winger',cc:'“It hurts high on the inside of my thigh when I pass.”',base:5,w:{add:4},pain:['add'],pat:'Groin strain. The adductor test is painful on one side.'},
 {id:'s1',who:'Basketball guard with back pain',cc:'“I can’t push off that foot, and my leg feels numb on the outside of my foot.”',base:5,w:{gas:3},pain:[],pat:'S1 nerve root. The heel raise is weak with no calf pain.'}
];
const raises=g=>g>=5?25:g===4?12:g===3?1:0;
function outcome(tid,gr,load,pain){const gas=tid==='gas';
  if(gas){const n=raises(gr);return {reach:n>0?1:gr===2?.45:gr===1?.04:0,palp:gr>=1,held:n>0,text:n>=25?'25 full raises':n>1?n+' full raises, then the heel stops rising':n===1?'1 full raise, then the heel stops rising':gr===2?'The heel lifts part way only':gr===1?'A flicker in the calf, and the heel stays down':'No contraction',count:n,pain,ok:gr>=3};}
  if(gr===0)return {reach:0,palp:false,held:false,text:'No movement, and nothing under your hand',pain,ok:false};
  if(gr===1)return {reach:.03,palp:true,held:false,text:'No movement, but you feel a flicker',pain,ok:false};
  if(gr===2)return load==='ge'?{reach:1,palp:true,held:true,text:'Full range with gravity eliminated',pain,ok:true}:{reach:.4,palp:true,held:false,text:load==='grav'?'Stalls part way up against gravity':'Stalls part way, before you add any resistance',pain,ok:false};
  if(gr===3){if(load==='ge'||load==='grav')return {reach:1,palp:true,held:true,text:'Full range '+(load==='ge'?'with gravity eliminated':'against gravity'),pain,ok:true};return {reach:1,palp:true,held:false,text:'Reaches full range, then gives way as soon as you press'+(pain?', with pain':''),gave:1,pain,ok:false};}
  if(gr===4){if(load==='max')return {reach:1,palp:true,held:false,text:'Holds at first, then gives way to maximal resistance'+(pain?', with pain':''),gave:1,pain,ok:false};return {reach:1,palp:true,held:true,text:load==='mod'?'Holds moderate resistance'+(pain?', with pain':''):'Full range '+(load==='ge'?'with gravity eliminated':'against gravity'),pain,ok:true};}
  return {reach:1,palp:true,held:true,text:load==='max'?'Holds maximal resistance':load==='mod'?'Holds moderate resistance':'Full range '+(load==='ge'?'with gravity eliminated':'against gravity'),pain:false,ok:true};}
function athlete(sim){if(sim.vlab){const b=sim.vlab.bench;if(b.ai===undefined){const r=sim.vlab.rng(1);b.ai=2+Math.floor(r()*(ATHLETES.length-2));b.ws=r()<.5?'L':'R';}return {A:ATHLETES[b.ai],ws:b.ws};}
  return {A:ATHLETES[sim.st.ai],ws:sim.st.ws};}
const sideLine=(A,ws)=>Object.keys(A.w).length?` The athlete points to the <b>${ws==='L'?'left':'right'}</b> side.`:'';
function gradeOf(sim,tid,side){const {A,ws}=athlete(sim);return side===ws&&A.w[tid]!==undefined?A.w[tid]:A.base;}
function painOf(sim,tid,side){const {A,ws}=athlete(sim);return side===ws&&A.pain.indexOf(tid)>=0;}
function logOf(sim){if(sim.vlab){const b=sim.vlab.bench;return b.log||(b.log={});}return sim.st.log;}
function runTest(sim,side){const t=sim.p.tm,load=sim.p.load,o=outcome(t,gradeOf(sim,t,side),load,painOf(sim,t,side));
  const L=logOf(sim);(L[t]||(L[t]={}))[side]=(L[t][side]||{});L[t][side][t==='gas'?'body':load]=o.text;L[t][side].last=o.text;
  return {side,o,t:0,dur:RM?.4:2.2};}
function startRun(sim,sides){const st=sim.st;st.queue=sides.slice();st.run=null;nextRun(sim);sim.infoDirty=true;}
function nextRun(sim){const st=sim.st;if(!st.queue.length){st.run=null;return;}const s=st.queue.shift();BioLab.setValues(sim,{side:s});st.run=runTest(sim,s);st.lastSide=s;sim.infoDirty=true;}
function newAthlete(sim,keep){const st=sim.st;let i=st.ai;for(let g=0;g<20&&i===st.ai;g++)i=Math.floor(Math.random()*ATHLETES.length);st.ai=i;st.ws=Math.random()<.5?'L':'R';sim._ai=i;sim._ws=st.ws;st.log={};st.run=null;st.queue=[];st.guess={};st.patt=null;sim.infoDirty=true;}
/* practical: choose the position, hands and test */
const shuffle=(a)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function pickOpts(t,key){const pool=[];TESTS.forEach(o=>{if(o.id!==t.id&&o[key]!==t[key]&&pool.indexOf(o[key])<0&&o[key]!=='N/A')pool.push(o[key]);});
  const same=shuffle(pool.filter(v=>TESTS.some(o=>o.g===t.g&&o[key]===v))),rest=shuffle(pool.filter(v=>same.indexOf(v)<0));return shuffle([t[key]].concat(same.concat(rest).slice(0,3)));}
function newPrac(sim,tid){const t=TBY[tid];sim.st.pr={tid,o:{pos:pickOpts(t,'pos'),hands:pickOpts(t,'hands'),test:pickOpts(t,'test')},pick:{},checked:false,show:false};sim.infoDirty=true;}
function syncCtl(sim){const u=sim.ui;if(!u||!u.ctlW||sim.vlab)return;const v=sim.p.view,set=(id,on)=>{const w=u.ctlW[id];if(w)w.hidden=!on;},b=(id,on)=>{const e=u.actB&&u.actB[id];if(e)e.hidden=!on;};
  set('side',v!=='practical');set('load',v==='grade');b('run',v==='grade');b('both',v==='grade');b('newath',v==='grade');b('newpr',v==='practical');b('nextm',v==='learn');}

function arrowHead(ctx,x,y,ang,sz){const d=dir(ang),n=dir(ang+90);ctx.beginPath();ctx.moveTo(x+d.x*sz,y+d.y*sz);ctx.lineTo(x-d.x*sz*.3+n.x*sz*.7,y-d.y*sz*.3+n.y*sz*.7);ctx.lineTo(x-d.x*sz*.3-n.x*sz*.7,y-d.y*sz*.3-n.y*sz*.7);ctx.closePath();ctx.fill();}
function arrow(ctx,a,kind){const d=dir(a.ang),c=kind==='mv'?PAL['s3']:PAL['s1'];if(!a.len)return;ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=kind==='mv'?5:4;ctx.lineCap='round';ctx.setLineDash(kind==='mv'?[]:[9,7]);
  const sx=a.back?a.at.x-d.x*a.len:a.at.x,sy=a.back?a.at.y-d.y*a.len:a.at.y,ex=sx+d.x*a.len,ey=sy+d.y*a.len;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();ctx.setLineDash([]);arrowHead(ctx,ex,ey,a.ang,12);}
function oop(ctx,p,kind){const c=kind==='mv'?PAL['s3']:PAL['s1'];ctx.strokeStyle=c;ctx.fillStyle=PAL['cv-bg'];ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(p.x,p.y,15,0,6.2832);ctx.fill();ctx.stroke();ctx.fillStyle=c;
  if(kind==='mv'){ctx.beginPath();ctx.arc(p.x,p.y,5,0,6.2832);ctx.fill();}else{ctx.beginPath();ctx.moveTo(p.x-8,p.y-8);ctx.lineTo(p.x+8,p.y+8);ctx.moveTo(p.x+8,p.y-8);ctx.lineTo(p.x-8,p.y+8);ctx.stroke();}}
function capLayer(ctx,list,fill,stroke,alpha){ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=alpha||1;
  const path=(pts)=>{ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);};
  ctx.strokeStyle=stroke;list.forEach(c=>{ctx.lineWidth=c[1]+3;path(c[0]);ctx.stroke();});ctx.strokeStyle=fill;list.forEach(c=>{ctx.lineWidth=c[1];path(c[0]);ctx.stroke();});ctx.globalAlpha=1;}
function spindle(ctx,p,q,w){const d={x:q.x-p.x,y:q.y-p.y},l=Math.hypot(d.x,d.y)||1,n={x:-d.y/l,y:d.x/l},m=lp(p,q,.5);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.quadraticCurveTo(m.x+n.x*w*1.5,m.y+n.y*w*1.5,q.x,q.y);ctx.quadraticCurveTo(m.x-n.x*w*1.5,m.y-n.y*w*1.5,p.x,p.y);ctx.closePath();ctx.fill();}
function handMark(ctx,p,letter,k){const r=9+4.5*k,col=letter==='P'?'#2d6bd2':'#b3261e';ctx.fillStyle=col;ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,r,0,6.2832);ctx.fill();ctx.stroke();txt(ctx,letter,p.x,p.y+.5,{s:13*k,w:700,c:'#ffffff',a:'center',b:'middle'});}
function drawInset(ctx,t,side,k,o){o=o||{};const v=t.ins.v,h=o.h||300,cx=o.cx||92,top=o.top||(k>1.3?104:84),BB=BioLab.body;
  BB.draw(ctx,{cx,top,h,view:v,fill:PAL['card2'],stroke:PAL['cv-soft']});const s=(side==='R'?-1:1)*(v==='back'?-1:1);ctx.fillStyle=PAL['s1'];
  t.ins.p.forEach(q=>{const a=BB.map(s*q[0],q[1],{cx,top,h}),b=BB.map(s*q[2],q[3],{cx,top,h});spindle(ctx,a,b,q[4]*h*.75);});
  txt(ctx,v==='back'?'Back view':'Front view',cx,top+h+15*k,{s:12*k,c:PAL['cv-soft'],a:'center'});}
function drawTable(ctx,t,k){ctx.fillStyle=PAL['cv-bench'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;
  if(t.top){const cy=t.cy||260;rr(ctx,238,cy-86,540,172,10);ctx.fill();ctx.stroke();return;}
  if(t.above){ctx.beginPath();ctx.arc(480,258,70,0,6.2832);ctx.fill();ctx.stroke();return;}
  ctx.fillStyle=PAL['line'];ctx.fillRect(190,FLOOR,610,2);if(t.stand)return;ctx.fillStyle=PAL['cv-bench'];
  const front=t.flip==='x'&&!t.above,x0=front?340:t.short.indexOf('Seat')===0||t.short==='Sitting'||t.short==='Scaption'?250:262,x1=front?620:t.short.indexOf('Seat')===0||t.short==='Sitting'||t.short==='Scaption'?470:770;
  rr(ctx,x0,TT,x1-x0,15,4);ctx.fill();ctx.stroke();ctx.fillRect(x0+14,TT+15,12,FLOOR-TT-15);ctx.fillRect(x1-26,TT+15,12,FLOOR-TT-15);}
function drawAbove(ctx,sc){const A=sc.above,F=PAL['card2'],O=PAL['cv-soft'];
  capLayer(ctx,[[[{x:430,y:250},{x:A.s.x,y:A.s.y}],42],[[A.s,A.e],15],[[A.e,A.w],12],[[A.w,A.h],11],[[{x:430,y:250},{x:398,y:262}],15]],F,O);
  ctx.fillStyle=F;ctx.strokeStyle=O;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(480,246,25,0,6.2832);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(474,222);ctx.lineTo(480,212);ctx.lineTo(486,222);ctx.stroke();}
function drawFigure(ctx,J,t,sc,flat){const F=PAL['card2'],O=PAL['cv-soft'];const c=caps(J),front=(J.o.sw||0)>0;capLayer(ctx,c.far,front?F:PAL['cv-bg2'],O,front?1:.75);capLayer(ctx,c.near.slice(0,2),F,O);
  ctx.fillStyle=F;ctx.beginPath();ctx.moveTo(J.sA.x,J.sA.y);ctx.lineTo(J.sB.x,J.sB.y);ctx.lineTo(J.hipB.x,J.hipB.y);ctx.lineTo(J.hipA.x,J.hipA.y);ctx.closePath();ctx.fill();
  ctx.fillStyle=F;ctx.strokeStyle=O;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(J.head.x,J.head.y,SEG.hr,0,6.2832);ctx.fill();ctx.stroke();
  /* a nose mark says which way the patient faces */
  const nose=J.o.nose===undefined?null:dir(J.o.nose);if(nose){ctx.beginPath();ctx.moveTo(J.head.x+nose.x*SEG.hr,J.head.y+nose.y*SEG.hr);ctx.lineTo(J.head.x+nose.x*(SEG.hr+7),J.head.y+nose.y*(SEG.hr+7));ctx.lineWidth=5;ctx.lineCap='round';ctx.stroke();}
  capLayer(ctx,c.near.slice(2),F,O);}
function faceMark(ctx,t,J){ctx.fillStyle=PAL['cv-soft'];ctx.strokeStyle=PAL['cv-soft'];const H=J.head;
  if(t.top&&!t.prone){ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(H.x-5,H.y-8,2,0,6.2832);ctx.arc(H.x-5,H.y+8,2,0,6.2832);ctx.fill();ctx.beginPath();ctx.moveTo(H.x-14,H.y);ctx.lineTo(H.x-19,H.y);ctx.stroke();}
  else if(t.top&&t.prone){ctx.globalAlpha=.25;ctx.beginPath();ctx.arc(H.x+2,H.y,SEG.hr-5,0,6.2832);ctx.fill();ctx.globalAlpha=1;}
  else if(t.flip==='x'&&!t.back){ctx.beginPath();ctx.arc(H.x-8,H.y-3,2.2,0,6.2832);ctx.arc(H.x+8,H.y-3,2.2,0,6.2832);ctx.fill();ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(H.x,H.y+6,7,.4,2.74);ctx.stroke();}}
function nose(t){return t.short.indexOf('Sitting')===0||t.short.indexOf('Seated')===0||t.stand?0:t.short.indexOf('Supine')===0?270:t.short.indexOf('Prone')===0?90:null;}
function drawLegend(ctx,t,k,sc){const y=500-14-3*k,s=12*k;ctx.font=s+'px '+FONT;const E=[];const hasP=sc.P&&sc.P.length,hasR=sc.R&&sc.R.length;
  if(hasP)E.push(['P','Feels the muscle']);if(hasR)E.push(['R','Resists']);E.push(['mv','Athlete moves']);if(hasR)E.push(['rs','You resist']);
  const r=9+4.5*k,W=E.map(e=>ctx.measureText(e[1]).width+(e[0].length===1?2*r+6:44)+16);let tot=W.reduce((a,b)=>a+b,0),x=Math.max(6,(800-tot)/2);
  E.forEach((e,i)=>{if(e[0].length===1){handMark(ctx,{x:x+r,y},e[0],k);txt(ctx,e[1],x+2*r+6,y,{s,c:PAL['cv-ink'],b:'middle'});}
    else{arrow(ctx,{at:{x,y},ang:0,len:30},e[0]);txt(ctx,e[1],x+44,y,{s,c:PAL['cv-ink'],b:'middle'});}x+=W[i];});}
function drawScene(sim,ctx,t,u,k,side){const sc=t.scene(u);drawTable(ctx,t,k);
  const flip=t.flip&&side==='L',cx=t.cx||480,cy=t.cy||260;ctx.save();if(t.stand){ctx.translate(460,FLOOR);ctx.scale(.8,.8);ctx.translate(-460,-FLOOR);}if(flip){if(t.flip==='x'){ctx.translate(2*cx,0);ctx.scale(-1,1);}else{ctx.translate(0,2*cy);ctx.scale(1,-1);}}
  if(sc.J){if(sc.J.o.nose===undefined){const n=nose(t);if(n!==null&&!t.top&&t.flip!=='x')sc.J.o.nose=n;}drawFigure(ctx,sc.J,t,sc);faceMark(ctx,t,sc.J);}else if(sc.above)drawAbove(ctx,sc);
  ctx.fillStyle=PAL['s1'];ctx.globalAlpha=.88;(sc.mus||[]).forEach(m=>spindle(ctx,m[0],m[1],m[2]));ctx.globalAlpha=1;
  (sc.mv||[]).forEach(a=>arrow(ctx,a,'mv'));(sc.rs||[]).forEach(a=>arrow(ctx,a,'rs'));
  if(sc.oopM)oop(ctx,sc.oopM,'mv');if(sc.oopR)oop(ctx,sc.oopR,'rs');ctx.restore();
  const T=p=>flip?(t.flip==='x'?{x:2*cx-p.x,y:p.y}:{x:p.x,y:2*cy-p.y}):p;(sc.P||[]).forEach(p=>handMark(ctx,T(p),'P',k));(sc.R||[]).forEach(p=>handMark(ctx,T(p),'R',k));
  return sc;}
function scOfDraw(sim,ctx,vdt,k,time){const p=sim.p,st=sim.st,t=TBY[p.tm],vl=!!sim.vlab,view=vl?'grade':p.view;
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);
  if(view==='practical'&&st.pr&&!st.pr.show){const q=TBY[st.pr.tid];txt(ctx,nameOf(q),400,18+11*k,{s:18*k,w:700,a:'center'});
    ctx.fillStyle=PAL['cv-bench'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;drawInset(ctx,q,'R',k,{cx:290,top:62+24*(k-1),h:370-24*(k-1)});
    txt(ctx,'Choose the position,',590,190,{s:15*k,a:'center',c:PAL['cv-ink']});txt(ctx,'the hands and the test.',590,190+20*k,{s:15*k,a:'center',c:PAL['cv-ink']});txt(ctx,'The picture appears when you check.',590,190+44*k,{s:12*k,a:'center',c:PAL['cv-soft']});return;}
  const show=view==='practical'&&st.pr?TBY[st.pr.tid]:t,side=view==='practical'?'R':p.side;
  let u;const R=st.run;if(view==='grade'){if(R){const f=clamp(R.t/(R.dur*.5),0,1),o=R.o;let x=f*o.reach;if(o.gave&&R.t>R.dur*.65)x=o.reach*(1-clamp((R.t-R.dur*.65)/(R.dur*.2),0,1)*.75);u=x;}else u=0;}
  else u=RM?.5:.5-.5*Math.cos(time*1.2);
  txt(ctx,nameOf(show),485,18+11*k,{s:18*k,w:700,a:'center'});
  const sub=(show.short)+(view==='practical'?'':' · '+(side==='L'?'Left':'Right')+' side');txt(ctx,sub,485,22+28*k,{s:13*k,c:PAL['cv-soft'],a:'center'});
  drawInset(ctx,show,side,k);
  const sc=drawScene(sim,ctx,show,u,k,side);
  if(show.toes)txt(ctx,show.toes,690,show.ty,{s:12*k,c:PAL['cv-soft'],a:'center'});
  if(show.note)show.note.forEach((n,i)=>txt(ctx,n,show.above?660:640,(show.above?400:374)+i*16*k,{s:12*k,c:PAL['cv-soft'],a:'center'}));
  drawLegend(ctx,show,k,sc);
  if(view==='grade'){const o=R?R.o:null,msg=o?(R.t>R.dur*.55?o.text:'Testing…'):'Press Run the test';ctx.font=(13*k)+'px '+FONT;if(o&&R.t>R.dur*.55){ctx.font='700 '+(13*k)+'px '+FONT;}const w=ctx.measureText(msg).width;const X=clamp(490,w/2+190,800-w/2-14),Y=show.top?(44+40*k):(50+34*k);
    const bg=o&&R.t>R.dur*.55?(o.pain?'#b3261e':o.ok?'#1b7339':'#8a5a00'):'#55585f';pill(ctx,msg,X,Y,bg,'#ffffff',13*k);
    if(o&&R.t>R.dur*.55&&o.palp===false){}}}
function step(sim,dt){const st=sim.st;if(st.run){st.run.t+=dt;if(st.run.t>=st.run.dur){if(st.queue.length)nextRun(sim);else st.run.t=st.run.dur;}}}
/* the two sheets, mirrored for the virtual lab */
const sheetTable=(g,hh,ht)=>`<div class="tbl-wrap"><table class="vl-table" style="font-size:13px"><thead><tr><th scope="col">Muscle</th>${g==='s'?'<th scope="col">Fibers</th>':''}<th scope="col">Patient position</th><th scope="col">${hh}</th><th scope="col">${ht}</th></tr></thead><tbody>${TESTS.filter(t=>t.g===g).map(t=>`<tr><th scope="row">${t.m}</th>${g==='s'?`<td style="white-space:normal">${t.f}</td>`:''}<td style="white-space:normal;min-width:11em">${t.pos}</td><td style="white-space:normal;min-width:11em">${t.hands}</td><td style="white-space:normal;min-width:11em">${t.test}</td></tr>`).join('')}</tbody></table></div>`;
const rowsOf=g=>TESTS.filter(t=>t.g===g).map(nameOf);
const byName=n=>TESTS.find(t=>nameOf(t)===n);
function gradeCheck(side){return (sim,rv,v)=>{const t=byName(rv);if(!t)return null;const L=logOf(sim)[t.id];if(!L||!L[side])return 'Run this test on this side first. Then grade what you saw.';const g=gradeOf(sim,t.id,side),n=+v;if(!Number.isFinite(n))return null;
  if(n===g)return null;if(t.id==='gas')return 'Look again at how many full raises you counted, and check the raise count against the grade ladder.';
  const ran=Object.keys(L[side]).filter(k=>k!=='last');if(ran.length<2&&g<5)return 'Run this side at another load, too. Find the load where it stops holding, then use the ladder.';
  return Math.abs(n-g)>=2?'That is a long way from what the bench showed. Check the ladder and rerun this side.':'Close. Check which load this side last held, then read the ladder again.';};}
const LAB={id:'mmt-practical',title:'Manual Muscle Testing Practical',course:'SPAT',teachers:'McKeon',
 source:{label:'Shoulder MMT.xlsx',href:'https://rjhs.instructure.com/courses/14893/assignments/547995'},
 purpose:'<p>Run every test on both of your MMT sheets, on one simulated athlete, on both sides. Record what you find in your own words. You are learning the setup for each test and practicing the habit that makes the test useful: comparing the two sides.</p><p>This lab uses two handouts: <a href="https://rjhs.instructure.com/courses/14893/assignments/547995" target="_blank" rel="noopener">Shoulder MMT.xlsx</a> and <a href="https://rjhs.instructure.com/courses/14893/assignments/550190" target="_blank" rel="noopener">SPAT MMT.xlsx</a>. Practicing the tests on a partner in class is still the real skill. Your hands learn things this bench cannot teach.</p>',
 background:'<p><b>Grade ladder.</b> 0: no contraction. 1: a flicker you can feel, with no movement. 2: full range only with gravity eliminated. 3: full range against gravity, no added resistance. 4: holds moderate resistance. 5: holds maximal resistance. For heel raises, body weight is the resistance, so you count: 25 full raises is 5, 2 to 24 is 4, and 1 is 3.</p><p><b>Shoulder sheet</b></p>'+sheetTable('s','Clinician hands','Test')+'<p style="margin-top:12px"><b>Lower body sheet</b></p>'+sheetTable('h','Resistance','Test')+'<p style="margin-top:12px"><b>About the virtual bench.</b> Your athlete is fictional and has a hidden pattern. The caption under the bench shows the setup for the current test.</p>',
 materials:['One simulated athlete on a treatment table','Your Shoulder MMT and SPAT MMT sheets (reproduced in the Background above)','A way to apply each load: gravity eliminated, against gravity, moderate, maximal'],
 setup(sim){BioLab.setValues(sim,{view:'grade'});athlete(sim);sim.st.run=null;sim.st.queue=[];},
 controls:[],
 steps:[
  {title:'Meet your athlete',text:'<p>Read the caption under the bench. It says who your athlete is and why they are here. Write down what you expect to find before you test.</p><p>Always test the uninvolved side first. It shows you what normal is for this person, and it shows the athlete what you are asking for.</p>',controls:['tm','side','load','run','both'],setup(sim){BioLab.setValues(sim,{tm:'deltL',side:'R',load:'max'});}},
  {title:'Learn the bench',text:'<p>Choose a muscle and read the setup in the caption. On the stage, <b>P</b> is your palpating hand and <b>R</b> is your resistance hand.</p><p>Press <b>Test both sides</b>. Start at Maximal resistance. If a side gives way, lower the load and run that side again. The load where it last holds gives you the grade.</p>',controls:['tm','side','load','run','both']},
  {title:'Shoulder sheet',text:'<p>Work down Table 1. For each row, set the muscle, test both sides and pick a grade for each side.</p><p>In Student Notes, write what you saw, what you felt or heard from the athlete, and anything you want to remember about the setup.</p>',controls:['tm','side','load','run','both'],setup(sim){BioLab.setValues(sim,{tm:'pecU'});}},
  {title:'Lower body sheet',text:'<p>Work down Table 2 the same way. Watch the setups that look alike: vastus medialis and vastus lateralis differ only in the toes, and the hamstring tests differ only in the tibia.</p><p>Heel raises have no resistance hand. Count the raises.</p>',controls:['tm','side','load','run','both'],setup(sim){BioLab.setValues(sim,{tm:'sart'});}},
  {title:'Compare the two sides',text:'<p>Read your tables side by side. Circle any row where the two sides differ, and rerun it. Look for a pattern: one muscle only, or several muscles that share a nerve or a nerve root?</p>',controls:['tm','side','load','run','both']},
  {title:'Questions',text:'<p>Answer the questions below the bench, then turn in your lab.</p>',controls:['tm','side','load','run','both']}],
 tables:[
  {id:'sh',title:'Table 1: Shoulder MMT',cols:[{id:'m',label:'Muscle and fibers',rows:rowsOf('s')},
    {id:'l',label:'Left grade',input:'select',options:['0','1','2','3','4','5'],check:gradeCheck('L')},{id:'r',label:'Right grade',input:'select',options:['0','1','2','3','4','5'],check:gradeCheck('R')},{id:'n',label:'Student Notes',input:'text'}]},
  {id:'hi',title:'Table 2: Lower body MMT',cols:[{id:'m',label:'Muscle',rows:rowsOf('h')},
    {id:'l',label:'Left grade',input:'select',options:['0','1','2','3','4','5'],check:gradeCheck('L')},{id:'r',label:'Right grade',input:'select',options:['0','1','2','3','4','5'],check:gradeCheck('R')},{id:'n',label:'Student Notes',input:'text'}]}],
 observations:[{id:'pat',label:'Which rows differed from side to side? Do they share a muscle, a nerve or a nerve root?'}],
 questions:[
  {id:'q1',n:'1',q:'<p>Why does an athletic trainer test both sides instead of only the injured one?</p>'},
  {id:'q2',n:'2',q:'<p>Why should the uninvolved side usually go first?</p>'},
  {id:'q3',n:'3',q:'<p>A healthy athlete scores 4 on both sides for one muscle. Is that an injury finding? Explain using your data or an example.</p>'},
  {id:'q4',n:'4',q:'<p>The three pectoralis major tests use the same position and the same hands. What changes, and what does that tell you about how the fibers run?</p>'},
  {id:'q5',n:'5',q:'<p>What does pain during a test add to what a weak grade tells you? Think about strength loss with pain and strength loss with no pain.</p>'},
  {id:'q6',n:'6',q:'<p>Pick one test from your sheets. Explain how the patient’s position makes the right muscle do the work.</p>'},
  {id:'q7',n:'7',q:'<p>What can a partner in class teach you about these tests that this bench cannot?</p>'}],
 conclusion:{prompt:'<p>Write up your athlete like a short note to the team physician: what you tested, how the sides compared, and what you think the pattern means. Say what you would check next. You are not diagnosing. You are describing findings and passing them on.</p>'}};
function vlNarrate(sim){const t=TBY[sim.p.tm],{A}=athlete(sim),R=sim.st.run;
  const res=s=>{const L=logOf(sim)[t.id];return L&&L[s]?L[s].last:'not tested';};
  return `<b>${A.who}.</b> ${A.cc}${sideLine(A,athlete(sim).ws)}<br><b>${nameOf(t)}:</b> ${t.pos}. <b>Hands:</b> ${t.hands}. <b>Test:</b> ${t.test}.<br><b>Left:</b> ${res('L')}. <b>Right:</b> ${res('R')}.`;}
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function cardHtml(t,withNerve){const lower=t.g==='h';return `<div class="tbl-wrap" style="margin:0 0 10px"><table style="font-size:14px"><tbody>
<tr><th scope="row" style="white-space:nowrap">Muscle</th><td style="white-space:normal;text-align:left">${t.m}</td></tr>${t.f?`<tr><th scope="row">Fibers</th><td style="white-space:normal;text-align:left">${t.f}</td></tr>`:''}
<tr><th scope="row" style="white-space:nowrap">Patient position</th><td style="white-space:normal;text-align:left">${t.pos}</td></tr>
<tr><th scope="row" style="white-space:nowrap">${lower?'Resistance':'Clinician hands'}</th><td style="white-space:normal;text-align:left">${t.hands}</td></tr>
<tr><th scope="row" style="white-space:nowrap">Test</th><td style="white-space:normal;text-align:left">${t.test}</td></tr></tbody></table></div><p style="margin:0 0 8px"><b>Why this setup:</b> ${t.why}</p>${withNerve?`<p style="margin:0 0 8px"><b>Nerve and root:</b> ${t.nerve}. ${t.root}.</p><p style="margin:0 0 8px"><b>If one side is weak:</b> ${t.inj}</p>`:''}`;}
function ladderHtml(){return `<details style="margin:6px 0 8px"><summary style="cursor:pointer;font-weight:600">The 0 to 5 grade ladder</summary><ul style="margin:6px 0 0;padding-left:20px">${LADDER.map(l=>`<li><b>${l[0]}:</b> ${l[1]}</li>`).join('')}<li>Heel raises: 25 full raises is 5, 2 to 24 is 4, and 1 is 3.</li></ul></details>`;}
const SIM={id:'mmt',hash:'mmt',apUnit:15,order:8,tab:'Manual muscle testing',kind:'Virtual lab',
 card:'Set up every muscle test on your Shoulder and SPAT sheets, grade a simulated athlete 0 to 5 on both sides, and find the pattern.',
 title:'Manual muscle testing',
 lede:{bio:'Pick a muscle. See the patient position, where your two hands go and what you tell the athlete, then test both sides.',honors:'Pick a muscle, grade each side on the 0 to 5 scale, and use side-to-side differences as your finding.',ap:'Grade both sides, then decide whether the weakness pattern fits one muscle, one nerve or one nerve root.'},
 scale:'One athlete, one muscle at a time. Each test takes under a minute. The figure is a schematic and is not drawn to any one person’s size.',
 aspect:1.6,timeless:true,animated:true,graph:false,trials:false,prereq:['movements'],next:['clinic'],
 controlsTitle:'Test setup',
 controls:[
  {id:'view',label:'What you are doing',type:'seg',def:'learn',options:[{v:'learn',l:'Learn the test'},{v:'practical',l:'Set up the test'},{v:'grade',l:'Grade the athlete'}],noTrial:true,onChange(sim){syncCtl(sim);if(sim.p.view==='practical'&&sim.st&&!sim.st.pr)newPrac(sim,sim.p.tm);if(sim.st){sim.st.run=null;sim.st.queue=[];}}},
  {id:'tm',label:'Muscle',type:'select',def:'deltL',options:TESTS.map(t=>({v:t.id,l:nameOf(t)})),noTrial:true,onChange(sim){if(sim.st){sim.st.run=null;sim.st.queue=[];if(sim.p.view==='practical'&&!sim.vlab)newPrac(sim,sim.p.tm);}}},
  {id:'side',label:'Test side',type:'seg',def:'R',options:[{v:'L',l:'Left'},{v:'R',l:'Right'}],noTrial:true},
  {id:'load',label:'Load',type:'select',def:'max',options:[{v:'ge',l:LOADS.ge},{v:'grav',l:LOADS.grav},{v:'mod',l:LOADS.mod},{v:'max',l:LOADS.max}],noTrial:true}],
 actions:[
  {id:'run',label:'Run the test',primary:true,run(sim){startRun(sim,[sim.p.side]);}},
  {id:'both',label:'Test both sides',run(sim){const a=athlete(sim),first=a.ws==='L'?'R':'L';startRun(sim,[first,a.ws]);}},
  {id:'newath',label:'New athlete',run(sim){newAthlete(sim);}},
  {id:'newpr',label:'New muscle',primary:true,run(sim){const pool=TESTS.filter(t=>!sim.st.pr||t.id!==sim.st.pr.tid),t=pool[Math.floor(Math.random()*pool.length)];newPrac(sim,t.id);}},
  {id:'nextm',label:'Next muscle',run(sim){const i=TESTS.findIndex(t=>t.id===sim.p.tm);BioLab.setValues(sim,{tm:TESTS[(i+1)%TESTS.length].id});}}],
 init(sim){if(sim._ai===undefined){sim._ai=0;sim._ws='R';}const st={ai:sim._ai,ws:sim._ws,log:{},run:null,queue:[],guess:{},patt:null,pr:null,lastSide:null};return st;},
 step,
 onLevel(sim){syncCtl(sim);},
 initVis(sim){syncCtl(sim);},
 metrics:[
  {id:'setup',label:'Patient position',text:true,get:s=>{const t=TBY[s.p.tm];return t.short;}},
  {id:'lres',label:'Left side',text:true,get:s=>{const L=logOf(s)[s.p.tm];return L&&L.L?L.L.last:'Not tested yet';}},
  {id:'rres',label:'Right side',text:true,get:s=>{const L=logOf(s)[s.p.tm];return L&&L.R?L.R.last:'Not tested yet';}},
  {id:'root',label:'Nerve and root',lvl:'ap',text:true,get:s=>{const t=TBY[s.p.tm];return t.nerve+', '+t.root;}}],
 infoPanel(sim){const st=sim.st,p=sim.p,t=TBY[p.tm],ap=atLeast('ap');
  if(p.view==='learn')return `<h3 style="margin:0 0 8px;font-size:16px">${nameOf(t)}</h3>`+cardHtml(t,ap);
  if(p.view==='practical'){if(!st.pr)newPrac(sim,p.tm);const r=st.pr,q=TBY[r.tid],lab={pos:'Patient position',hands:q.g==='h'?'Resistance':'Clinician hands',test:'Test'};
    const blk=k=>{const ok=r.checked&&r.pick[k]===q[k];return `<fieldset style="border:0;padding:0;margin:0 0 12px"><legend style="font-weight:700;padding:0;margin-bottom:6px">${lab[k]}</legend><div class="choices">${r.o[k].map(v=>`<button type="button" class="choice" data-fk="pr-${k}-${esc(v).length}-${esc(v).charCodeAt(4)}" data-pr="${k}" data-v="${esc(v)}" aria-pressed="${r.pick[k]===v}" style="${r.pick[k]===v?'border-color:var(--rj);box-shadow:inset 0 0 0 1px var(--rj)':''}">${v}</button>`).join('')}</div>${r.checked&&r.pick[k]!==undefined?`<p class="verdict ${ok?'ok':'no'}" style="margin:6px 0 0">${ok?'This matches your sheet.':'Your sheet says something different. Think about which way the fibers pull.'}</p>`:''}</fieldset>`;};
    const done=r.checked&&['pos','hands','test'].every(k=>r.pick[k]===q[k]);
    return `<h3 style="margin:0 0 8px;font-size:16px">Set up the test: ${nameOf(q)}</h3>${blk('pos')}${blk('hands')}${blk('test')}<div class="row" style="margin-bottom:10px"><button type="button" class="btn primary" data-fk="pr-check" data-pa="check">Check my setup</button><button type="button" class="btn" data-fk="pr-show" data-pa="show">Show the card</button><button type="button" class="btn" data-fk="pr-new" data-pa="new">New muscle</button></div>${done||r.show?'<h4 style="margin:6px 0">The card</h4>'+cardHtml(q,ap):''}`;}
  const {A,ws}=athlete(sim),L=logOf(sim)[t.id]||{};const hon=atLeast('honors');
  const pick=s=>`<div class="row" role="group" aria-label="Your grade for the ${s==='L'?'left':'right'} side" style="align-items:center"><b style="min-width:3em">${s==='L'?'Left':'Right'}</b>${[0,1,2,3,4,5].map(g=>{const on=(st.guess[t.id]||{})[s]===g;return `<button type="button" class="btn${on?' primary':''}" data-fk="g-${s}-${g}" data-g="${s}" data-v="${g}" aria-pressed="${on}">${g}</button>`;}).join('')}</div>`;
  const gv=st.guess[t.id]||{};const fb=s=>{if(gv[s]===undefined)return '';if(!L[s])return `<p class="status" style="margin:4px 0">Run this side first.</p>`;const g=gradeOf(sim,t.id,s);return gv[s]===g?`<p class="verdict ok" style="margin:4px 0">${s==='L'?'Left':'Right'}: that grade fits what the athlete did.</p>`:`<p class="verdict no" style="margin:4px 0">${s==='L'?'Left':'Right'}: find the load where this side last held, then read the ladder.</p>`;};
  let cmp='';if(gv.L!==undefined&&gv.R!==undefined&&L.L&&L.R){const a=gradeOf(sim,t.id,'L'),b=gradeOf(sim,t.id,'R');cmp=a===b?`<p style="margin:6px 0"><b>Both sides match.</b> ${a===5?'This test shows no side-to-side deficit.':'The grade is below 5, but it is the same on both sides, so it is likely this athlete’s normal. Ask about their history before you call it a finding.'}</p>`:`<p style="margin:6px 0"><b>The sides differ.</b> The weaker side is your finding. ${hon?'Test the neighboring muscles next: is it one muscle or a group that shares a nerve?':''}</p>`;}
  let patt='';if(ap){const seen={},opts=[];ATHLETES.forEach((a,i)=>{const l=a.pat.split('.')[0];if(!seen[l]){seen[l]=1;opts.push([i,l]);}});patt=`<h4 style="margin:12px 0 6px">What pattern fits?</h4><label style="display:block;margin-bottom:6px">Your conclusion after testing: <select class="sel" data-fk="patt" data-patt="1"><option value="">Choose</option>${opts.map(o=>`<option value="${o[0]}"${st.patt!==null&&ATHLETES[st.patt].pat.split('.')[0]===o[1]?' selected':''}>${o[1]}</option>`).join('')}</select></label>${st.patt!==null?(ATHLETES[st.patt].pat.split('.')[0]===A.pat.split('.')[0]?`<p class="verdict ok" style="margin:4px 0">That fits.</p><p style="margin:4px 0">${A.pat} A real clinician would pass this on as findings, not a diagnosis.</p>`:`<p class="verdict no" style="margin:4px 0">Not the best fit yet.</p><p style="margin:4px 0">Test the neighbors. Which muscles on your sheet share a nerve root? Does the weak test hurt?</p>`):''}`;}
  return `<h3 style="margin:0 0 6px;font-size:16px">${A.who}</h3><p style="margin:0 0 8px">${A.cc}${sideLine(A,ws)}</p>`+ladderHtml()+`<h4 style="margin:10px 0 6px">${nameOf(t)}: your grade</h4>${pick('L')}${fb('L')}<div style="height:6px"></div>${pick('R')}${fb('R')}${cmp}<details style="margin-top:10px"><summary style="cursor:pointer;font-weight:600">The card for this test</summary><div style="margin-top:8px">${cardHtml(t,ap)}</div></details>`+patt;},
 bindInfo(sim,el){const st=sim.st,again=()=>{sim.infoDirty=true;};
  el.querySelectorAll('[data-pr]').forEach(b=>b.addEventListener('click',()=>{st.pr.pick[b.dataset.pr]=b.dataset.v;st.pr.checked=false;sim._fk=b.dataset.fk;again();}));
  el.querySelectorAll('[data-pa]').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.pa,r=st.pr,q=TBY[r.tid];sim._fk=b.dataset.fk;if(a==='check'){r.checked=true;if(['pos','hands','test'].every(k=>r.pick[k]===q[k]))r.show=true;}else if(a==='show')r.show=true;else{const pool=TESTS.filter(t=>t.id!==r.tid),t=pool[Math.floor(Math.random()*pool.length)];newPrac(sim,t.id);}again();}));
  el.querySelectorAll('[data-g]').forEach(b=>b.addEventListener('click',()=>{const t=sim.p.tm;(st.guess[t]||(st.guess[t]={}))[b.dataset.g]=+b.dataset.v;sim._fk=b.dataset.fk;again();}));
  const se=el.querySelector('[data-patt]');if(se)se.addEventListener('change',()=>{st.patt=se.value===''?null:+se.value;sim._fk='patt';again();});
  if(sim._fk){const f=el.querySelector('[data-fk="'+sim._fk+'"]');sim._fk=null;if(f)f.focus({preventScroll:true});}},
 narrate(sim){if(sim.vlab)return vlNarrate(sim);const p=sim.p,t=TBY[p.tm],st=sim.st,ap=atLeast('ap');
  if(p.view==='practical'){const q=st.pr?TBY[st.pr.tid]:t;return `<b>${nameOf(q)}.</b> Choose the patient position, the hands and the test from the options below, then check your setup against the sheet.`;}
  if(p.view==='grade'){const L=logOf(sim)[t.id]||{};const r=st.run;if(r&&r.t>=r.dur*.55)return `<b>${r.side==='L'?'Left':'Right'} side, ${LOADS[p.load].toLowerCase()}:</b> ${r.o.text}. ${L.L&&L.R?'You have both sides now. Compare them before you grade.':'Now test the other side.'}`;
    return `Test the uninvolved side first. <b>Start at maximal resistance</b>, and if a side gives way, lower the load and run it again. The load it last held gives you the grade.`;}
  return `<b>${nameOf(t)}.</b> ${t.why}${ap?` Nerve: ${t.nerve}, ${t.root}.`:''}`;},
 tour:[
  {title:'Position the patient',text:'Every test starts with the patient’s position. For the lateral deltoid, your sheet says: sitting with the elbow flexed 90 degrees. Position sets up which muscle does the work and how gravity loads it.',focus:[186,60,614,380],speed:.4,setup(sim){BioLab.setValues(sim,{view:'learn',tm:'deltL',side:'R'});}},
  {title:'Your palpating hand',text:'One hand goes on the muscle. This is <b>P</b>. It lets you feel the muscle tighten, which tells you the right muscle is doing the work.',focus:[186,60,614,380],speed:.4},
  {title:'Your resistance hand',text:'The other hand, <b>R</b>, pushes against the movement. Here it sits on the distal humerus. The farther your hand sits from the joint, the longer the lever and the easier it is to overpower the athlete, so hand placement must stay the same on both sides.',focus:[186,60,614,380],speed:.4},
  {title:'Tell the athlete what to do',text:'Your sheet gives a plain command: abduct the shoulder. The solid arrow is the athlete’s movement. The dashed arrow is your resistance, opposite the movement.',focus:[186,60,614,440],speed:.4},
  {title:'Grade it on both sides',text:'Now the athlete is on the table for real. Run the test on the uninvolved side, then the other side. A weak finding only means something when you compare it with that athlete’s other side.',focus:[186,60,614,380],speed:.4,setup(sim){BioLab.setValues(sim,{view:'grade',tm:'deltL',load:'max'});startRun(sim,['L','R']);}}],
 onTourExit(sim){BioLab.setValues(sim,{view:'learn',tm:'deltL',side:'R',load:'max'});BioLab.reset(sim);},
 lab:{bio:'<p><b>Question:</b> Can you set up each test from memory?</p><ol><li>Choose <b>Learn the test</b>. Walk through every Pectoralis Major and Deltoid test. Say out loud the position, hands and command.</li><li>Choose <b>Set up the test</b>. Do 10 muscles without looking at your sheet.</li><li>Choose <b>Grade the athlete</b>. Run Biceps Brachii on both sides at maximal resistance, and write which side is stronger or whether they match.</li></ol><p>Write one sentence on which setup was hardest to remember, and why.</p>',
  honors:'<p><b>Question:</b> What does a side-to-side difference tell you that a single grade cannot?</p><ol><li>Choose <b>Grade the athlete</b>. Press <b>New athlete</b> until you get one with a complaint.</li><li>Test the muscles near the complaint on both sides. Lower the load until a weak side holds, then pick your grade.</li><li>Press <b>New athlete</b> until you find one who scores 4 on both sides. Explain why that is not an injury finding.</li></ol>',
  ap:'<p><b>Question:</b> Is a weakness pattern one muscle, one nerve or one nerve root?</p><ol><li>Press <b>New athlete</b>. Before you test, write your first guess from the complaint.</li><li>Grade the sheet muscles near the complaint, on both sides. Add neighbors that share a nerve root.</li><li>Under <b>What pattern fits?</b>, choose your conclusion, then explain how pain changed your thinking.</li><li>Do this for three athletes. For one, write what test from the Neuro exam you would add.</li></ol>'},
 terms:[{t:'Manual muscle test (MMT)',d:'A hands-on strength test where the clinician resists one movement and grades the result.'},{t:'Palpate',d:'Feel with your hands. Your palpating hand feels the muscle tighten.'},{t:'Supine and prone',d:'Lying face up and lying face down.'},{t:'Scaption',d:'Raising the arm in the plane of the scapula, between straight forward and straight out to the side.'},{t:'Uninvolved side',d:'The side that is not injured. Test it first and use it as the comparison.'},{t:'Horizontal extension',d:'Moving a raised arm backward, away from the chest.'},
  {lvl:'honors',t:'Grade 0 to 5',d:'The MMT scale. 3 means full range against gravity; 4 and 5 add resistance.'},{lvl:'honors',t:'Gravity eliminated',d:'A position where the limb moves without lifting against gravity, used to find grade 2.'},{lvl:'honors',t:'Give way',d:'The limb collapses under resistance. Note whether pain caused it.'},
  {lvl:'ap',t:'Myotome',d:'A group of muscles innervated by a single spinal nerve root.'},{lvl:'ap',t:'Peripheral nerve vs nerve root',d:'A peripheral nerve supplies specific muscles (axillary to deltoid). A root supplies muscles across several nerves.'}],
 about:'<p><b>Source.</b> The two tables are McKeon’s Shoulder MMT and SPAT MMT sheets, word for word. The tool uses the same names at all three levels. Each level adds more, and renames nothing.</p>'+
  '<p><b>The grade model.</b> Each simulated athlete has one hidden grade per test on each side, and each grade gives a fixed outcome on the ladder. Heel raises use 25 full raises for 5, 2 to 24 for 4, and 1 for 3, following the Daniels and Worthingham convention. Real patients vary more. Real MMT also has plus and minus grades, and a “5” is not fully sensitive: a strong athlete can lose real strength before a clinician’s hands notice. A handheld dynamometer is more sensitive.</p>'+
  '<p><b>Simplifications.</b> The figure is a schematic, and it does not show how the clinician’s body should stand. Position and direction arrows show the idea rather than exact angles. The “toes out” and “toes in” quadriceps tests and the tibia rotation hamstring tests follow the sheet; research on how well they isolate one muscle is mixed. Grade 2 in real life needs a separate gravity-eliminated position, and the bench only says that you moved there. The nerve and root lines at Deep dive come from standard anatomy references, and where they use the course myotome key, the two can differ a little.</p>'+
  '<p><b>Educational use only.</b> This tool is for learning test setups. Do not use it to diagnose yourself or anyone else. Injuries need an athletic trainer or physician.</p>',
 labs:[LAB],
 challenges:[
  {lvl:'bio',instant:true,q:'You want the lower fibers of Pectoralis Major. What do you tell the patient?',choices:['Punch the person behind you','“Punch” the person next to you','Put something in the opposite pocket','Shrug your shoulders'],correct:2,explain:{bio:'The lower fibers rise from the lower sternum and ribs, so they pull the arm down and across toward the opposite hip. That is the pocket.'}},
  {lvl:'bio',instant:true,q:'Which test on your sheets has no clinician resistance?',choices:['Gluteus Medius','Biceps Femoris','Rectus Femoris','Gastrocnemius'],correct:3,explain:{bio:'The sheet says N/A. Single-leg heel raises use body weight, because no clinician can match a calf by hand.'}},
  {lvl:'bio',instant:true,q:'An athlete hurt their right shoulder. Which side do you test first?',choices:['The right, to find the problem fast','The left, to see what normal is for this athlete','Either, because the order does not matter','Neither, because a test is not needed'],correct:1,explain:{bio:'The uninvolved side gives you this athlete’s normal, and it shows them what you want before you touch the sore side.'}},
  {lvl:'honors',instant:true,q:'A muscle reaches full range against gravity, then gives way as soon as you add moderate pressure. What grade fits?',choices:['2','3','4','5'],correct:1,explain:{honors:'Full range against gravity with no added resistance is grade 3. Grade 4 would hold moderate resistance.'}},
  {lvl:'honors',instant:true,q:'A muscle stalls part way against gravity but moves through full range with gravity eliminated. What grade fits?',choices:['1','2','3','4'],correct:1,explain:{honors:'Full range only with gravity eliminated is grade 2.'}},
  {lvl:'honors',instant:true,q:'An athlete scores 4 on the same test on both sides, with no pain and no history. What is the best reading?',choices:['Bilateral injury, so refer now','Likely their normal, so note it and ask about training','Both sides have nerve damage','The test failed, so stop testing'],correct:1,explain:{honors:'A matching grade with no pain or history is usually the athlete’s normal strength. Side-to-side comparison is why the 4 does not worry you.'}},
  {lvl:'ap',instant:true,q:'Two weeks after an anterior shoulder dislocation, all three deltoid fibers are weak on that side with no pain, and the other shoulder muscles hold. What should you suspect?',choices:['Rotator cuff strain','Axillary nerve injury','C7 root injury','Pectoralis major strain'],correct:1,explain:{ap:'All three parts of one muscle, with no pain, after a dislocation, point to the nerve that supplies only that muscle group. The axillary nerve wraps around the humerus and can stretch in an anterior dislocation.'}},
  {lvl:'ap',instant:true,q:'After a burner, Biceps Brachii, Deltoid (Lateral) and Supraspinatus are weak with no local pain. What links them?',choices:['The same nerve: the axillary','The same roots: C5 and C6','Cranial nerve XI','One torn muscle'],correct:1,explain:{ap:'Those muscles use three different peripheral nerves, but all draw on C5 and C6. A pattern that crosses peripheral nerves points to the root.'}},
  {lvl:'ap',instant:true,q:'All three trapezius tests are weak on one side after a slash to the neck. Which nerve should you think of?',choices:['Cranial nerve XI','Axillary','Suprascapular','Radial'],correct:0,explain:{ap:'Cranial nerve XI, the spinal accessory, supplies the trapezius. The shrug in the cranial nerve lab tests the same nerve.'}}]
};
SIM.draw=scOfDraw;
BioLab.register(SIM);
BioLab._mmt={TESTS,ATHLETES,outcome};
})();
