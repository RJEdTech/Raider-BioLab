(function(){
'use strict';
const {clamp,rr,txt,atLeast,PAL,FONT,RM}=BioLab.h;

/* Body movements. A jointed 3D figure, in units of body height: x + toward the body's left, y up from the floor, z + anterior.
   The figure's right limbs move. Each movement sets joint rotations, so the path drawn on screen, and every "which way does it go" answer, comes from the same kinematics. */
const W=800,H=600,D=Math.PI/180;
const LBL={flexion:'Flexion',extension:'Extension',abduction:'Abduction',adduction:'Adduction',ir:'Internal rotation',er:'External rotation',pronation:'Pronation',supination:'Supination',plantar:'Plantarflexion',dorsi:'Dorsiflexion',inversion:'Inversion',eversion:'Eversion',hadd:'Horizontal adduction',habd:'Horizontal abduction',raddev:'Radial deviation',udev:'Ulnar deviation'};
const JN={shoulder:'Shoulder',elbow:'Elbow and forearm',wrist:'Wrist',hip:'Hip',knee:'Knee',ankle:'Ankle'};
const JPART={shoulder:'arm',elbow:'forearm',wrist:'hand',hip:'leg',knee:'lower leg',ankle:'foot'};
/* rom: normal range in degrees (typical adult values, AAOS-style tables). */
const M={
 shoulder:{
  flexion:{rom:180,plane:'sagittal',say:'The arm moves forward and up.',ex:'Front raise',mover:'Deltoid (anterior fibers), Pectoralis Major (upper fibers)',stop:'Tension in the Latissimus Dorsi and the back of the capsule. The scapula rotates to supply about a third of this range.'},
  extension:{rom:60,plane:'sagittal',say:'The arm moves backward, behind the body.',ex:'Straight-arm pulldown, ending behind the hip',mover:'Latissimus Dorsi, Teres Major, Deltoid (posterior fibers)',stop:'Tension in the front of the capsule and its ligaments.'},
  abduction:{rom:180,plane:'frontal',say:'The arm moves out to the side, away from the midline.',ex:'Lateral raise',mover:'Deltoid (lateral fibers), Supraspinatus',stop:'The humerus nears the acromion. Turning the arm outward and rotating the scapula give it room to reach overhead.'},
  adduction:{rom:50,plane:'frontal',say:'The arm moves toward and across the midline. The trunk blocks it unless the arm comes slightly forward.',ex:'Wide-grip lat pulldown',mover:'Pectoralis Major, Latissimus Dorsi, Teres Major',stop:'The trunk blocks the arm, then the back of the capsule tightens.'},
  ir:{rom:70,plane:'transverse',say:'The humerus spins inward on its long axis, and the bent forearm swings toward the belly.',ex:'Band internal rotation with the elbow at the side',mover:'Subscapularis, Pectoralis Major, Latissimus Dorsi',stop:'Tension in the back of the capsule and in Infraspinatus and Teres Minor.'},
  er:{rom:90,plane:'transverse',say:'The humerus spins outward on its long axis, and the bent forearm swings away from the belly.',ex:'Band external rotation with the elbow at the side',mover:'Infraspinatus, Teres Minor',stop:'Tension in the front of the capsule and its ligaments, the structures an anterior dislocation tears.'},
  hadd:{rom:130,plane:'transverse',lvl:'ap',say:'From straight out to the side, the arm sweeps forward and across the chest.',ex:'Chest fly or bench press',mover:'Pectoralis Major, Deltoid (anterior fibers)',stop:'The arm meets the chest.'},
  habd:{rom:45,plane:'transverse',lvl:'ap',say:'From straight out to the side, the arm sweeps backward.',ex:'Reverse fly',mover:'Deltoid (posterior fibers), Infraspinatus, Teres Minor',stop:'Tension in the front of the capsule and in Pectoralis Major.'}},
 elbow:{
  flexion:{rom:150,plane:'sagittal',say:'The hand comes toward the shoulder, and the angle at the elbow gets smaller.',ex:'Biceps curl',mover:'Biceps Brachii, Brachialis, Brachioradialis',stop:'The forearm presses into the muscle of the upper arm: soft tissue stops it.',type:'hinge'},
  extension:{rom:150,plane:'sagittal',say:'The elbow straightens, and the angle gets larger.',ex:'Triceps pushdown',mover:'Triceps Brachii',stop:'Bone stops it: the olecranon of the ulna seats into a pit on the back of the humerus.',type:'hinge'},
  pronation:{rom:80,plane:'transverse',say:'The radius crosses over the ulna and the palm turns down. This happens at the radioulnar joints, not in the hinge.',ex:'Turning a doorknob or a screwdriver to the left with the right hand',mover:'Pronator Teres, Pronator Quadratus',stop:'The radius meets the ulna and the back ligaments tighten.',type:'pivot'},
  supination:{rom:80,plane:'transverse',say:'The radius uncrosses from the ulna and the palm turns up, as if holding a bowl of soup.',ex:'Rotating a hammer or a light dumbbell, palm up',mover:'Supinator, Biceps Brachii',stop:'Ligaments and the membrane between the radius and ulna tighten.',type:'pivot'}},
 wrist:{
  flexion:{rom:80,plane:'sagittal',say:'The palm bends toward the front of the forearm.',ex:'Wrist curl',mover:'Flexor Carpi Radialis, Flexor Carpi Ulnaris',stop:'Ligaments on the back of the wrist and the finger extensors tighten.'},
  extension:{rom:70,plane:'sagittal',say:'The back of the hand bends toward the back of the forearm.',ex:'Reverse wrist curl',mover:'Extensor Carpi Radialis, Extensor Carpi Ulnaris',stop:'Ligaments on the palm side tighten and the carpals press on the radius.'},
  raddev:{rom:20,plane:'frontal',lvl:'ap',say:'The hand tips toward the thumb side.',ex:'Lifting the head of a hammer while holding the handle at your side',mover:'Flexor Carpi Radialis, Extensor Carpi Radialis',stop:'Bone stops it early: the scaphoid meets the styloid process of the radius.'},
  udev:{rom:30,plane:'frontal',lvl:'ap',say:'The hand tips toward the little finger side.',ex:'The follow-through of a hammer swing',mover:'Flexor Carpi Ulnaris, Extensor Carpi Ulnaris',stop:'Ligaments on the thumb side tighten. The ulna ends higher than the radius, which leaves more room on this side.'}},
 hip:{
  flexion:{rom:120,plane:'sagittal',say:'The thigh comes up toward the trunk. This range is with the knee bent, and it is near 90° with the knee straight because the hamstrings pull tight.',ex:'Marching knee raise',mover:'Iliopsoas, Rectus Femoris, Sartorius',stop:'The thigh meets the abdomen: soft tissue stops it.'},
  extension:{rom:20,plane:'sagittal',say:'The thigh moves behind the line of the body.',ex:'Glute bridge or hip thrust',mover:'Gluteus Maximus, Biceps Femoris, Semitendinosus, Semimembranosus',stop:'The strong ligaments on the front of the hip wind tight.'},
  abduction:{rom:45,plane:'frontal',say:'The leg moves out to the side.',ex:'Side-lying leg raise or lateral band walk',mover:'Gluteus Medius, Gluteus Minimus',stop:'The Adductors stretch, and the neck of the femur nears the rim of the socket.'},
  adduction:{rom:30,plane:'frontal',say:'The leg moves toward and across the midline, passing in front of the other leg.',ex:'Side-lying inner-thigh lift',mover:'Adductors',stop:'The other leg blocks it, then Gluteus Medius and the capsule tighten.'},
  ir:{rom:45,plane:'transverse',say:'The femur spins inward and the toes turn in.',ex:'Standing pivot with the toes turning in',mover:'Gluteus Medius and Gluteus Minimus (front fibers)',stop:'Tension in the back of the capsule and the deep rotators.'},
  er:{rom:45,plane:'transverse',say:'The femur spins outward and the toes turn out.',ex:'Clamshell',mover:'Piriformis and the deep rotators, Gluteus Maximus, Sartorius',stop:'Tension in the ligaments on the front of the hip.'}},
 knee:{
  flexion:{rom:135,plane:'sagittal',say:'The heel comes toward the buttock.',ex:'Hamstring curl',mover:'Biceps Femoris, Semitendinosus, Semimembranosus',stop:'The calf presses against the back of the thigh: soft tissue stops it.'},
  extension:{rom:135,plane:'sagittal',say:'The knee straightens.',ex:'Seated leg extension',mover:'Rectus Femoris, Vastus Lateralis, Vastus Medialis, Vastus Intermedius',stop:'The ACL, the collateral ligaments and the capsule tighten as the knee locks straight.'},
  ir:{rom:30,plane:'transverse',lvl:'honors',say:'With the knee bent, the tibia spins inward and the toes turn in. A straight knee locks and allows almost none.',ex:'Seated, turn the toes in with the knee bent',mover:'Semitendinosus, Semimembranosus, Popliteus',stop:'The ACL and PCL wind around each other.'},
  er:{rom:40,plane:'transverse',lvl:'honors',say:'With the knee bent, the tibia spins outward and the toes turn out. A straight knee locks and allows almost none.',ex:'Seated, turn the toes out with the knee bent',mover:'Biceps Femoris',stop:'The collateral ligaments tighten.'}},
 ankle:{
  dorsi:{rom:20,plane:'sagittal',say:'The toes come up toward the shin.',ex:'Toe raise or walking on the heels',mover:'Tibialis Anterior',stop:'The wide front of the talus wedges between the tibia and fibula, and the calf muscles pull tight.'},
  plantar:{rom:50,plane:'sagittal',say:'The toes point down, as in pressing a gas pedal.',ex:'Calf raise',mover:'Gastrocnemius, Soleus',stop:'Ligaments on the front of the ankle tighten.'},
  inversion:{rom:35,plane:'frontal',say:'The sole turns inward, toward the other foot. This happens mostly below the talus, at the subtalar joint.',ex:'Band inversion',mover:'Tibialis Anterior, Tibialis Posterior',stop:'The lateral ligaments tighten. They are the ones torn in a common ankle sprain.'},
  eversion:{rom:15,plane:'frontal',say:'The sole turns outward. This happens mostly below the talus, at the subtalar joint.',ex:'Band eversion',mover:'Fibularis Longus, Fibularis Brevis',stop:'Bone stops it early: the fibula reaches lower than the tibia and blocks the talus. The strong deltoid ligament adds to it.'}}
};
const JOINTORDER=['shoulder','elbow','wrist','hip','knee','ankle'];
const MOVEORDER=['flexion','extension','abduction','adduction','ir','er','pronation','supination','plantar','dorsi','inversion','eversion','hadd','habd','raddev','udev'];
const PL={
 sagittal:{n:'Sagittal plane',short:'sagittal',axis:'side-to-side (mediolateral) axis',ex:'Biceps curl, squat, running',hint:'Look at it from the side: does the part swing forward and back?'},
 frontal:{n:'Frontal plane',short:'frontal',axis:'front-to-back (anteroposterior) axis',ex:'Lateral raise, jumping jack, side lunge',hint:'Look at it from the front: does the part swing out to the side and back?'},
 transverse:{n:'Transverse plane',short:'transverse',axis:'long (longitudinal) axis of the bone',ex:'Trunk twist, golf swing, band rotation',hint:'Look for spinning: does the bone turn around its own length?'}
};
const JT={
 ball:{n:'Ball and socket',ex:'Shoulder, hip',dof:'Moves in all three planes.',why:'A round head turns freely in a cup, so nothing in the shape blocks any direction. Depth of the cup trades range for stability.',cmp:'The shoulder’s socket is shallow, so it has the most range of any joint and dislocates most often. The hip’s socket is deep, so it has less range and holds your weight.'},
 hinge:{n:'Hinge',ex:'Elbow, knee, ankle',dof:'Moves in one plane.',why:'A spool of bone rides in a matching groove, so the bones can only open and close like a door. Strong side ligaments block sideways motion.',cmp:'A sideways force on a hinge has nowhere to go, so ligaments take the load. That is how the MCL gets sprained. The knee is a modified hinge: it rotates a little when bent.'},
 pivot:{n:'Pivot',ex:'Radius on the ulna, C1 on C2',dof:'Rotates around one axis.',why:'A peg turns inside a ring of bone and ligament, so the only motion is spinning.',cmp:'The head of the radius spins in a ring against the ulna, which lets you turn your palm over. C1 spins on a peg from C2, which lets you shake your head no.'},
 saddle:{n:'Saddle',ex:'Base of the thumb',dof:'Moves in two planes.',why:'Each bone is curved like a horse saddle and fits across the other. They rock in two directions, but they cannot spin freely.',cmp:'This shape lets your thumb sweep across your palm to touch each fingertip. That is why grip depends on it, and why it often gets arthritis with age.'}
};
const JINFO={
 shoulder:{t:'ball',s:'Ball and socket (glenohumeral joint)',w:'The large head of the humerus sits on the shallow glenoid of the scapula. The shallow socket gives the most range of any joint and the least bony stability, so muscles and ligaments hold it in place.'},
 elbow:{t:'hinge',s:'Hinge (humerus on ulna), plus a pivot (radius on ulna)',w:'The groove of the ulna wraps around a spool on the humerus, so it only opens and closes. Turning the palm over uses a separate pivot joint between the radius and ulna.'},
 wrist:{t:'condyloid',s:'Condyloid (oval head in an oval cup)',w:'An oval carpal surface sits in an oval cup at the end of the radius. It tilts in two planes, and the oval shape blocks spinning, so palm rotation has to come from the forearm.'},
 hip:{t:'ball',s:'Ball and socket',w:'The head of the femur sits deep in the acetabulum of the pelvis. The deep socket and thick ligaments give less range than the shoulder and much more stability, because the hip carries your weight.'},
 knee:{t:'hinge',s:'Modified hinge',w:'The round femoral condyles roll and slide on a nearly flat tibia, so bone does little to hold it. Ligaments and menisci limit it to flexion and extension, with a little rotation when bent.'},
 ankle:{t:'hinge',s:'Hinge (talus in the tibia and fibula), plus the subtalar joint below it',w:'The talus sits in a slot formed by the tibia and fibula, which allows dorsiflexion and plantarflexion. Inversion and eversion come mostly from the subtalar joint below the talus.'}
};
const lvlOk=m=>atLeast(m.lvl||'bio');
const movesOf=j=>MOVEORDER.filter(k=>M[j][k]&&lvlOk(M[j][k]));
const measured=(j,mv,a)=>(mv==='extension'&&(j==='elbow'||j==='knee'))?M[j][mv].rom-a:a;
const rangeText=(j,mv)=>{const r=M[j][mv].rom;return (mv==='extension'&&(j==='elbow'||j==='knee'))?r+'° back to 0°':'0° to '+r+'°';};
const whatType=(j,mv)=>{const m=M[j][mv];if(m.type==='pivot')return 'Pivot (radius on ulna)';return JINFO[j].s;};

/* ---------- kinematics ---------- */
const v=(x,y,z)=>[x,y,z];
const add=(a,b,s)=>{s=s===undefined?1:s;return [a[0]+b[0]*s,a[1]+b[1]*s,a[2]+b[2]*s];};
const Rx=d=>{const c=Math.cos(d*D),s=Math.sin(d*D);return [[1,0,0],[0,c,-s],[0,s,c]];};
const Ry=d=>{const c=Math.cos(d*D),s=Math.sin(d*D);return [[c,0,s],[0,1,0],[-s,0,c]];};
const Rz=d=>{const c=Math.cos(d*D),s=Math.sin(d*D);return [[c,-s,0],[s,c,0],[0,0,1]];};
const mm=(...L)=>L.reduce((A,B)=>A.map(r=>[0,1,2].map(j=>r[0]*B[0][j]+r[1]*B[1][j]+r[2]*B[2][j])));
const ap=(R,p)=>[R[0][0]*p[0]+R[0][1]*p[1]+R[0][2]*p[2],R[1][0]*p[0]+R[1][1]*p[1]+R[1][2]*p[2],R[2][0]*p[0]+R[2][1]*p[1]+R[2][2]*p[2]];
const I=Rx(0);
const LEN={ua:.175,fa:.145,hand:.09,th:.24,sh:.24};
function pose(j,mv,a){let Rs=I,eb=0,rho=0,Wr=I,Rh=I,kn=0,kr=0,An=I;
  if(j==='shoulder'){if(mv==='flexion')Rs=Rx(-a);else if(mv==='extension')Rs=Rx(a);else if(mv==='abduction')Rs=Rz(-a);else if(mv==='adduction')Rs=mm(Rx(-Math.min(25,a*2)),Rz(a));
    else if(mv==='ir'){Rs=Ry(a);eb=90;rho=90;}else if(mv==='er'){Rs=Ry(-a);eb=90;rho=90;}else if(mv==='hadd')Rs=mm(Ry(a),Rz(-90));else if(mv==='habd')Rs=mm(Ry(-a),Rz(-90));}
  if(j==='elbow'){if(mv==='flexion')eb=a;else if(mv==='extension')eb=M.elbow.extension.rom-a;else if(mv==='pronation'){eb=90;rho=90+a;}else if(mv==='supination'){eb=90;rho=90-a;}}
  if(j==='wrist'){if(mv==='flexion')Wr=Rx(-a);else if(mv==='extension')Wr=Rx(a);else if(mv==='raddev')Wr=Rz(-a);else if(mv==='udev')Wr=Rz(a);}
  if(j==='hip'){if(mv==='flexion'){Rh=Rx(-a);kn=Math.min(a*.85,100);}else if(mv==='extension')Rh=Rx(a);else if(mv==='abduction')Rh=Rz(-a);else if(mv==='adduction')Rh=mm(Rx(-Math.min(20,a*2)),Rz(a));else if(mv==='ir')Rh=Ry(a);else if(mv==='er')Rh=Ry(-a);}
  if(j==='knee'){if(mv==='flexion')kn=a;else if(mv==='extension'){Rh=Rx(-90);kn=M.knee.extension.rom-a;}else if(mv==='ir'){Rh=Rx(-90);kn=90;kr=a;}else if(mv==='er'){Rh=Rx(-90);kn=90;kr=-a;}}
  if(j==='ankle'){if(mv==='dorsi')An=Rx(-a);else if(mv==='plantar')An=Rx(a);else if(mv==='inversion')An=Rz(a);else if(mv==='eversion')An=Rz(-a);}
  const P={};
  P.S=v(-.125,.815,0);P.E=add(P.S,ap(Rs,[0,-LEN.ua,0]));const Rf=mm(Rs,Rx(-eb),Ry(rho));P.W=add(P.E,ap(Rf,[0,-LEN.fa,0]));const Rw=mm(Rf,Wr);P.Rw=Rw;
  P.F=add(P.W,ap(Rw,[0,-LEN.hand,0]));P.T=add(P.W,ap(Rw,[-.05,-.055,0]));P.palm=ap(Rw,[0,0,1]);
  P.H=v(-.06,.53,0);P.K=add(P.H,ap(Rh,[0,-LEN.th,0]));const Rk=mm(Rh,Rx(kn),Ry(kr));P.A=add(P.K,ap(Rk,[0,-LEN.sh,0]));const Rf2=mm(Rk,An);P.Ra=Rf2;
  P.Toe=add(P.A,ap(Rf2,[0,-.045,.115]));P.Heel=add(P.A,ap(Rf2,[0,-.045,-.035]));P.SL=add(P.A,ap(Rf2,[-.04,-.05,.03]));
  P.LS=v(.125,.815,0);P.LE=v(.13,.64,0);P.LW=v(.135,.495,0);P.LH=v(.06,.53,0);P.LK=v(.06,.29,0);P.LA=v(.06,.05,0);
  const key={shoulder:['S','W'],elbow:['E','W'],wrist:['W','F'],hip:['H',mv==='flexion'?'K':'A'],knee:['K','A'],ankle:['A','Toe']}[j];
  if(j==='elbow'&&(mv==='pronation'||mv==='supination')){key[0]='W';key[1]='T';}
  if((j==='hip'||j==='knee')&&(mv==='ir'||mv==='er')){key[0]='A';key[1]='Toe';}
  if(j==='ankle'&&(mv==='inversion'||mv==='eversion'))key[1]='SL';
  P.pivot=P[key[0]];P.tip=P[key[1]];return P;}

/* ---------- camera ---------- */
const CAM={front:{yaw:0,pitch:0,n:'Front view'},side:{yaw:90,pitch:0,n:'Side view'},top:{yaw:0,pitch:60,n:'View from above'},angled:{yaw:42,pitch:30,n:'View from the front and above'}};
function viewFor(j,mv,plane){
  if(j==='elbow'&&(mv==='pronation'||mv==='supination'))return {cam:'angled',f:[-.125,.64,.13],s:1100};
  if(j==='shoulder'&&(mv==='ir'||mv==='er'))return {cam:'top',f:[-.1,.66,.1],s:800};
  if(j==='shoulder'&&(mv==='hadd'||mv==='habd'))return {cam:'top',f:[-.08,.75,.05],s:560};
  if(j==='hip'&&(mv==='ir'||mv==='er'))return {cam:'top',f:[-.06,.03,.05],s:800};
  if(j==='knee'&&(mv==='ir'||mv==='er'))return {cam:'top',f:[-.06,.28,.26],s:1150};
  const cam=plane==='sagittal'?'side':plane==='frontal'?'front':'top';
  if(j==='shoulder')return {cam,f:[0,.6,0],s:400};
  if(j==='hip'||j==='knee')return {cam,f:[0,.5,0],s:490};
  if(j==='elbow')return {cam,f:[-.125,.66,.06],s:850};
  if(j==='wrist')return {cam,f:[-.13,.47,0],s:1350};
  return {cam,f:[-.06,.05,.03],s:1500};}
function makeProj(camId,f,s,cx,cy,camObj){const c=camObj||CAM[camId],cy1=Math.cos(c.yaw*D),sy1=Math.sin(c.yaw*D),cp=Math.cos(c.pitch*D),sp=Math.sin(c.pitch*D);
  const raw=p=>{const x=p[0]*cy1+p[2]*sy1,z=-p[0]*sy1+p[2]*cy1;return {X:x,Y:p[1]*cp-z*sp,Z:p[1]*sp+z*cp};};const o=raw(f);
  return p=>{const r=raw(p);return {x:cx+(r.X-o.X)*s,y:cy-(r.Y-o.Y)*s,d:r.Z};};}
function hull(pts){const P=pts.slice().sort((a,b)=>a.x-b.x||a.y-b.y);const cr=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);const L=[];for(const p of P){while(L.length>=2&&cr(L[L.length-2],L[L.length-1],p)<=0)L.pop();L.push(p);}const U=[];for(let i=P.length-1;i>=0;i--){const p=P[i];while(U.length>=2&&cr(U[U.length-2],U[U.length-1],p)<=0)U.pop();U.push(p);}L.pop();U.pop();return L.concat(U);}

/* Which segments move for each joint */
function hot(j,mv){if(j==='shoulder')return ['ua','fa','hand'];if(j==='elbow')return (mv==='pronation'||mv==='supination')?['fa','hand']:['fa','hand'];if(j==='wrist')return ['hand'];if(j==='hip')return ['th','sh','foot'];if(j==='knee')return ['sh','foot'];return ['foot'];}
function drawFigure(ctx,P,pr,s,hotList,lite){const body=PAL['card2'],edge=PAL['cv-soft'],hotC=PAL['s2'];const items=[];
  const cap=(a,b,r,id,bias)=>{const A=pr(a),B=pr(b);items.push({d:(A.d+B.d)/2+(bias||0),draw(){const on=hotList.includes(id);ctx.lineCap='round';ctx.strokeStyle=on?hotC:edge;ctx.lineWidth=2*r*s+(lite?1:2.4);ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();ctx.strokeStyle=on?hotC:body;ctx.globalAlpha=on?.55:1;ctx.lineWidth=2*r*s;ctx.stroke();if(on){ctx.globalAlpha=1;}ctx.globalAlpha=1;}});};
  /* torso */
  const tp=[[-.105,.82,0],[.105,.82,0],[.08,.53,0],[-.08,.53,0]].map(pr);
  items.push({d:0,draw(){ctx.lineJoin='round';ctx.beginPath();tp.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.strokeStyle=edge;ctx.lineWidth=.1*s+2;ctx.stroke();ctx.strokeStyle=body;ctx.lineWidth=.1*s;ctx.fillStyle=body;ctx.fill();ctx.stroke();}});
  cap([0,.82,0],[0,.87,0],.028,'neck',-.001);
  const hd=pr([0,.935,0]);items.push({d:hd.d,draw(){ctx.beginPath();ctx.arc(hd.x,hd.y,.062*s,0,6.3);ctx.fillStyle=body;ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=1.2;ctx.stroke();const n=pr([0,.93,.066]);ctx.beginPath();ctx.arc(n.x,n.y,.012*s,0,6.3);ctx.fillStyle=edge;ctx.fill();}});
  /* left limbs: still */
  cap(P.LS,P.LE,.027,'x',.006);cap(P.LE,P.LW,.021,'x',.006);cap(P.LW,[.14,.41,0],.018,'x',.006);
  cap(P.LH,P.LK,.042,'x',.004);cap(P.LK,P.LA,.03,'x',.004);
  /* right limbs */
  cap(P.S,P.E,.027,'ua',.01);cap(P.E,P.W,.021,'fa',.012);
  const Rw=P.Rw,hc=[[-.034,0,0],[.03,0,0],[.03,-.09,0],[-.034,-.09,0]].map(q=>pr(add(P.W,ap(Rw,q))));const palmFaces=pr(add(P.W,P.palm)).d>pr(P.W).d;
  const hd2=(pr(P.W).d+pr(P.F).d)/2+.014;
  items.push({d:hd2,draw(){const on=hotList.includes('hand');ctx.beginPath();hc.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.lineJoin='round';ctx.strokeStyle=on?hotC:edge;ctx.lineWidth=Math.max(.012*s,2);ctx.stroke();ctx.fillStyle=on?(palmFaces?PAL['s4']:hotC):body;ctx.globalAlpha=on?.8:1;ctx.fill();ctx.globalAlpha=1;}});
  cap(add(P.W,ap(Rw,[-.03,-.018,0])),P.T,.011,'hand',.016);
  cap(P.H,P.K,.042,'th',.008);cap(P.K,P.A,.03,'sh',.009);
  const Ra=P.Ra,box=[[-.033,-.05,-.035],[.03,-.05,-.035],[-.042,-.05,.115],[.034,-.05,.115],[-.022,.0,-.02],[.022,.0,-.02],[-.03,-.025,.1],[.026,-.025,.1]].map(q=>pr(add(P.A,ap(Ra,q))));
  items.push({d:(pr(P.Toe).d+pr(P.Heel).d)/2+.012,draw(){const on=hotList.includes('foot');const h=hull(box);ctx.beginPath();h.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.lineJoin='round';ctx.strokeStyle=on?hotC:edge;ctx.lineWidth=1.8;ctx.fillStyle=on?hotC:body;ctx.globalAlpha=on?.6:1;ctx.fill();ctx.globalAlpha=1;ctx.stroke();
      if(!on)return;const so=[box[0],box[1],box[3],box[2]];ctx.beginPath();so.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.stroke();}});
  const lbox=[[.033,-.05,-.035],[-.03,-.05,-.035],[.042,-.05,.115],[-.034,-.05,.115],[.022,0,-.02],[-.022,0,-.02],[.03,-.025,.1],[-.026,-.025,.1]].map(q=>pr(add(P.LA,q)));
  items.push({d:pr(add(P.LA,[0,-.03,.04])).d+.004,draw(){const h=hull(lbox);ctx.beginPath();h.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.lineJoin='round';ctx.strokeStyle=edge;ctx.lineWidth=1.8;ctx.fillStyle=body;ctx.fill();ctx.stroke();}});
  items.sort((a,b)=>a.d-b.d).forEach(it=>it.draw());}
function drawSweep(ctx,j,mv,a,pr){const rom=M[j][mv].rom,piv=pr(pose(j,mv,0).pivot),n=28,pts=[];for(let i=0;i<=n;i++){pts.push(pr(pose(j,mv,rom*i/n).tip));}
  ctx.beginPath();ctx.moveTo(pr(pose(j,mv,0).pivot).x,piv.y);pts.forEach(q=>ctx.lineTo(q.x,q.y));ctx.closePath();ctx.fillStyle=PAL['s3'];ctx.globalAlpha=.14;ctx.fill();ctx.globalAlpha=1;
  const m=Math.max(1,Math.round(a/rom*n));ctx.beginPath();ctx.moveTo(piv.x,piv.y);for(let i=0;i<=m;i++){const q=pr(pose(j,mv,a*i/m).tip);ctx.lineTo(q.x,q.y);}ctx.closePath();ctx.fillStyle=PAL['s1'];ctx.globalAlpha=.2;ctx.fill();ctx.globalAlpha=1;
  ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();ctx.setLineDash([]);
  [pts[0],pts[n]].forEach(q=>{ctx.beginPath();ctx.arc(q.x,q.y,4,0,6.3);ctx.fillStyle=PAL['s3'];ctx.fill();});}
function drawInset(ctx,j,mv,a,plane,k){const x=598,y=8,w=194,h=214;rr(ctx,x,y,w,h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  const c={yaw:38,pitch:14};const pr=makeProj(null,[0,.55,0],150,x+w/2,y+(h-28*k)/2+6,c);const P=pose(j,mv,a);
  const e=.42,py=.815,cor=plane==='sagittal'?[[-.125,1.1,-e],[-.125,1.1,e],[-.125,0,e],[-.125,0,-e]]:plane==='frontal'?[[-e,1.1,0],[e,1.1,0],[e,0,0],[-e,0,0]]:[[-e,P.pivot[1],-e],[e,P.pivot[1],-e],[e,P.pivot[1],e],[-e,P.pivot[1],e]];
  drawFigure(ctx,P,pr,150,hot(j,mv),true);
  const q=cor.map(pr);ctx.beginPath();q.forEach((o,i)=>i?ctx.lineTo(o.x,o.y):ctx.moveTo(o.x,o.y));ctx.closePath();ctx.fillStyle=PAL['s1'];ctx.globalAlpha=.2;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['s1'];ctx.lineWidth=1.5;ctx.stroke();
  txt(ctx,PL[plane].n,x+w/2,y+h-9,{s:Math.min(12*k,19),w:700,a:'center',c:PAL['cv-ink']});}

/* ---------- joint type schematics ---------- */
const TYPEORDER=['ball','hinge','pivot','saddle'];
function bone(ctx,fn,stroke){ctx.beginPath();fn();ctx.fillStyle=PAL['cv-tail'];ctx.fill();ctx.strokeStyle=stroke||PAL['cv-soft'];ctx.lineWidth=2;ctx.stroke();}
function bar(ctx,x,y,len,wd,ang){ctx.save();ctx.translate(x,y);ctx.rotate(ang);bone(ctx,()=>{rr(ctx,-wd/2,0,wd,len,6);});ctx.restore();}
function drawType(ctx,id,cx,cy,t,k){const mo=RM?0.6:t;const ink=PAL['s2'];
  if(id==='ball'){const th=.75*Math.sin(mo*1.1),ph=mo*1.1;
    ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,cy+78,62,16,0,0,6.3);ctx.stroke();ctx.setLineDash([]);
    const sw=.65*Math.cos(ph);bar(ctx,cx,cy-8,86,20,-sw);const hb=[cx,cy-8];ctx.beginPath();ctx.arc(hb[0],hb[1],27,0,6.3);ctx.fillStyle=PAL['cv-tail'];ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy-8,33,Math.PI*1.08,Math.PI*1.92);ctx.strokeStyle=ink;ctx.lineWidth=11;ctx.lineCap='butt';ctx.stroke();void th;}
  else if(id==='hinge'){const a=.2+1.05*(.5+.5*Math.sin(mo*1.1));
    ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy-8,80,Math.PI/2-1.25,Math.PI/2);ctx.stroke();ctx.setLineDash([]);
    bar(ctx,cx,cy-8,86,22,-a);bar(ctx,cx,cy-8,55,24,Math.PI);ctx.beginPath();ctx.arc(cx,cy-8,20,0,6.3);ctx.fillStyle=PAL['s2'];ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.stroke();ctx.beginPath();ctx.arc(cx,cy-8,5,0,6.3);ctx.fillStyle=PAL['card'];ctx.fill();}
  else if(id==='pivot'){const a=.9*Math.sin(mo*1.1);
    ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,68,-Math.PI/2-.9,-Math.PI/2+.9);ctx.stroke();ctx.setLineDash([]);
    ctx.save();ctx.translate(cx,cy);ctx.rotate(a);ctx.beginPath();ctx.arc(0,0,44,0,6.3);ctx.strokeStyle=PAL['s2'];ctx.lineWidth=16;ctx.stroke();ctx.beginPath();ctx.moveTo(0,-38);ctx.lineTo(0,-66);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=5;ctx.lineCap='round';ctx.stroke();ctx.restore();
    ctx.beginPath();ctx.arc(cx,cy,28,0,6.3);ctx.fillStyle=PAL['cv-tail'];ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.stroke();}
  else{const a=.34*Math.sin(mo*1.1),b=.34*Math.cos(mo*.73);
    ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,cy-82,34,12,0,0,6.3);ctx.stroke();ctx.setLineDash([]);
    bone(ctx,()=>{ctx.moveTo(cx-44,cy+70);ctx.lineTo(cx-44,cy+8);ctx.quadraticCurveTo(cx,cy+34,cx+44,cy+8);ctx.lineTo(cx+44,cy+70);ctx.closePath();});
    ctx.save();ctx.translate(cx,cy+22);ctx.rotate(a);ctx.scale(1,1-.12*Math.abs(b));bone(ctx,()=>{ctx.moveTo(-34,-96);ctx.lineTo(-38,-14);ctx.quadraticCurveTo(0,8,38,-14);ctx.lineTo(34,-96);ctx.closePath();});ctx.restore();}
}
function drawTypes(sim,ctx,k,t){const sel=sim.p.jtype,cw=W/2,ch=H/2;TYPEORDER.forEach((id,i)=>{const x=(i%2)*cw,y=Math.floor(i/2)*ch,on=id===sel;
    rr(ctx,x+6,y+6,cw-12,ch-12,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=on?PAL['s1']:PAL['line'];ctx.lineWidth=on?3:1;ctx.stroke();
    txt(ctx,JT[id].n,x+cw/2,y+16+10*k,{s:14*k,w:700,a:'center',b:'middle'});
    drawType(ctx,id,x+cw/2,y+ch/2+8,t,k);
    txt(ctx,JT[id].ex,x+cw/2,y+ch-16,{s:Math.min(12*k,20),a:'center',c:PAL['cv-soft']});});}

/* ---------- check: what movement is this? ---------- */
function newQ(sim){const prev=sim.st.q;const all=[];JOINTORDER.forEach(j=>movesOf(j).forEach(mv=>all.push([j,mv])));let pick;do{pick=all[Math.floor(Math.random()*all.length)];}while(prev&&prev.joint===pick[0]&&prev.move===pick[1]);
  const j=pick[0],mv=pick[1];const pool=[...new Set(movesOf(j).filter(x=>x!==mv).map(x=>x))];const others=MOVEORDER.filter(x=>x!==mv&&!pool.includes(x)&&!['hadd','habd','raddev','udev'].includes(x));
  const ch=[mv];pool.sort(()=>Math.random()-.5).slice(0,3).forEach(x=>ch.push(x));others.sort(()=>Math.random()-.5);while(ch.length<4)ch.push(others.shift());ch.sort(()=>Math.random()-.5);
  sim.st.q={joint:j,move:mv,choices:ch,bad:0,done:false,msg:'',ph:0};sim.infoDirty=true;}
function qEnsure(sim){if(!sim.st.q)newQ(sim);return sim.st.q;}
const curJ=sim=>sim.p.joint;
function curM(sim){const L=movesOf(sim.p.joint);return L.includes(sim.p.move)?sim.p.move:L[0];}
function curA(sim){return clamp(sim.p.angle,0,M[curJ(sim)][curM(sim)].rom);}
function syncAngle(sim,val){const r=M[curJ(sim)][curM(sim)].rom,el=document.getElementById('movements-angle');if(el)el.max=r;const a=val===undefined?clamp(sim.p.angle,0,r):clamp(val,0,r);sim.p.angle=a;if(sim.ui&&sim.ui.ctl&&sim.ui.ctl.angle)sim.ui.ctl.angle.set(a);}
function sync(sim){if(!sim.ui||!sim.ui.ctlW)return;const v=sim.p.view;[['joint','move'],['move','move'],['angle','move'],['cam','move'],['jtype','types']].forEach(e=>{const w=sim.ui.ctlW[e[0]];if(w)w.hidden=v!==e[1];});
  const w=sim.ui.ctlW.move;if(w){const L=movesOf(sim.p.joint);w.querySelectorAll('button').forEach(b=>{b.hidden=!L.includes(b.dataset.v);});}
  if(sim.ui.actB){if(sim.ui.actB.play)sim.ui.actB.play.hidden=v!=='move';if(sim.ui.actB.nextq)sim.ui.actB.nextq.hidden=v!=='check';}
  if(sim.ui.tiles)['ang','range','plane','ex'].forEach(id=>{const t=sim.ui.tiles[id],e=t&&t.num.closest('.tile');if(e)e.hidden=v==='types'||(v==='check'&&id==='ang');});
  if(v==='check')qEnsure(sim);const L=movesOf(sim.p.joint);if(!L.includes(sim.p.move)){sim.p.move=L[0];if(sim.ui.ctl.move)sim.ui.ctl.move.set(L[0]);}syncAngle(sim);}
const mainDef=(j,mv)=>Math.round(M[j][mv].rom*.6);

function labelBox(ctx,lines,k){let y=8;lines.forEach(l=>{ctx.font=(l.w||600)+' '+l.s+'px '+FONT;const w=ctx.measureText(l.t).width,h=l.s*1.3;ctx.fillStyle=PAL['cv-bg'];ctx.globalAlpha=.78;rr(ctx,8,y,w+14,h+3,5);ctx.fill();ctx.globalAlpha=1;txt(ctx,l.t,15,y+h/2+2,{s:l.s,w:l.w||600,b:'middle',c:l.c});y+=h+5;});}
function renderFigure(sim,ctx,k,j,mv,a,reveal){const m=M[j][mv],plane=m.plane,V=viewFor(j,mv,plane);let camId=V.cam,camChoice=sim.p.cam;if(sim.p.view==='move'&&camChoice!=='auto')camId=camChoice;
  const free=(sim.p.view==='move'&&camChoice!=='auto'),S=free?400:V.s,f=free?[0,.6,0]:V.f;const pr=makeProj(camId,f,S,330,free?322:(V.s<=490?322:318));
  if(reveal&&!free&&(V.cam==='side'||V.cam==='front')&&V.s<=490){const gp=pr([0,0,0]);ctx.strokeStyle=PAL['line'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,gp.y+6);ctx.lineTo(W,gp.y+6);ctx.stroke();}
  const P=pose(j,mv,a);ctx.globalAlpha=1;drawFigure(ctx,P,pr,S,hot(j,mv));
  if(reveal)drawSweep(ctx,j,mv,a,pr);
  return CAM[camId].n;}

function infoPanel(sim){const p=sim.p;
  if(p.view==='types'){const t=JT[p.jtype];return `<h3>${t.n} joint</h3><p><b>Examples:</b> ${t.ex}. ${t.dof}</p><p><b>Why the shape limits it:</b> ${t.why}</p><p>${t.cmp}</p>`;}
  if(p.view==='check'){const q=qEnsure(sim);let h=`<h3>What movement is this?</h3><p>Watch the blue part of the figure.</p>`;
    if(q.done){const m=M[q.joint][q.move];h+=`<p><b>${JN[q.joint]}: ${LBL[q.move].toLowerCase()}.</b> ${m.say} It happens in the ${PL[m.plane].short} plane. An exercise that uses it: ${m.ex.charAt(0).toLowerCase()+m.ex.slice(1)}.</p><div class="row"><button type="button" class="btn primary" data-q="next">Next movement</button></div>`;return h;}
    h+=`<div class="row" style="flex-wrap:wrap;gap:6px">${q.choices.map(c=>`<button type="button" class="btn" data-pick="${c}">${LBL[c]}</button>`).join('')}</div>`;
    if(q.msg)h+=`<p style="margin-top:8px">${q.msg}</p>`;if(q.bad>=2)h+='<div class="row" style="margin-top:6px"><button type="button" class="btn" data-q="show">Show the answer</button></div>';return h;}
  const j=curJ(sim),mv=curM(sim),m=M[j][mv],pl=PL[m.plane],ji=JINFO[j];
  return `<h3>${JN[j]}: ${LBL[mv].toLowerCase()}</h3><p>${m.say}</p><p><b>Plane:</b> ${pl.n}${atLeast('ap')?`, turning around a ${pl.axis}`:''}. Other movements in this plane: ${pl.ex.toLowerCase()}.</p><p><b>Exercise:</b> ${m.ex}.</p>${atLeast('honors')?`<p><b>Muscles that do it:</b> ${m.mover}.</p><p><b>What stops it:</b> ${m.stop}</p>`:''}<p><b>Joint type:</b> ${whatType(j,mv)}. ${m.type==='pivot'?JT.pivot.why:ji.w}</p>`;}
function bindInfo(sim,el){const f=sim.st.refocus;sim.st.refocus=null;
  el.querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click',()=>{const q=sim.st.q,t=b.dataset.pick;if(t===q.move){q.done=true;q.msg='';sim.st.refocus='[data-q=next]';}else{q.bad++;q.msg='Not this one. '+PL[M[q.joint][q.move].plane].hint;sim.st.refocus='[data-pick="'+t+'"]';}BioLab.refresh(sim);}));
  el.querySelectorAll('[data-q]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.q==='next'){newQ(sim);sim.st.refocus='[data-pick]';}else{sim.st.q.done=true;sim.st.refocus='[data-q=next]';}BioLab.refresh(sim);}));
  if(f){const t=el.querySelector(f);if(t)t.focus();}}

const base=extra=>{const o=Object.assign({view:'move',joint:'elbow',move:'flexion',jtype:'ball',cam:'auto'},extra);return o;};
const tourSet=(extra,a)=>sim=>{BioLab.setValues(sim,base(extra));syncAngle(sim,a!==undefined?a:mainDef(sim.p.joint,curM(sim)));sim.st.play=false;};

const MOVEMENTS={
  id:'movements',hash:'movements',apUnit:15,order:1,kind:'Learning tool',tab:'Body movements and joints',
  card:'Move a jointed figure through flexion, abduction, rotation and more. Read the angle, the normal range and the plane.',
  title:'Body movements and joints',
  lede:{bio:'Choose a joint and a movement and drive the figure through it. Read the angle, the normal range, the plane it moves in and an exercise that uses it.',
        honors:'Add the muscles that do each movement and what stops the joint at the end of its range, and connect the shape of each joint to what it can do.',
        ap:'Add the axis of each movement and the movements clinicians use for detail, such as horizontal adduction and radial deviation.'},
  scale:'One whole person. The joint angles are typical adult values, and real people vary.',
  aspect:4/3,timeless:true,animated:true,graph:false,chChange:1,chReveal:2,controlsTitle:'Move the figure',challengeTitle:'Check yourself',
  controls:[
    {id:'view',label:'View',type:'seg',def:'move',lvl:'bio',noTrial:true,options:[{v:'move',l:'Move a joint'},{v:'types',l:'Joint types'},{v:'check',l:'What movement is this?'}],onChange(sim){sync(sim);}},
    {id:'joint',label:'Joint',type:'seg',def:'elbow',lvl:'bio',noTrial:true,options:JOINTORDER.map(j=>({v:j,l:j==='elbow'?'Elbow':JN[j]})),onChange(sim){sim.st&&(sim.st.play=false);const L=movesOf(sim.p.joint);const mv=L.includes(sim.p.move)?sim.p.move:L[0];sim.p.move=mv;if(sim.ui&&sim.ui.ctl&&sim.ui.ctl.move)sim.ui.ctl.move.set(mv);sync(sim);syncAngle(sim,mainDef(sim.p.joint,mv));}},
    {id:'move',label:'Movement',type:'seg',def:'flexion',lvl:'bio',noTrial:true,options:MOVEORDER.map(k=>({v:k,l:LBL[k],lvl:['hadd','habd','raddev','udev'].includes(k)?'ap':undefined})),onChange(sim){sim.st&&(sim.st.play=false);const L=movesOf(sim.p.joint);if(!L.includes(sim.p.move)){sim.p.move=L[0];if(sim.ui&&sim.ui.ctl&&sim.ui.ctl.move)sim.ui.ctl.move.set(L[0]);}syncAngle(sim,mainDef(sim.p.joint,sim.p.move));}},
    {id:'angle',label:'Degrees moved',type:'range',min:0,max:180,step:1,def:90,unit:'°',d:0,lvl:'bio',noTrial:true,help:'The slider stops at the end of the normal range.',onChange(sim){if(sim.st)sim.st.play=false;}},
    {id:'cam',label:'Camera',type:'seg',def:'auto',lvl:'bio',noTrial:true,options:[{v:'auto',l:'Best view'},{v:'front',l:'Front'},{v:'side',l:'Side'},{v:'top',l:'Above'}]},
    {id:'jtype',label:'Joint type',type:'seg',def:'ball',lvl:'bio',noTrial:true,options:TYPEORDER.map(k=>({v:k,l:JT[k].n})),help:'Or click a panel on the stage.'}
  ],
  actions:[
    {id:'play',label:'Play or stop the movement',primary:true,run(sim){sim.st.play=!sim.st.play;sim.st.ph=0;}},
    {id:'nextq',label:'Next movement',primary:true,run(sim){newQ(sim);}}
  ],
  init(){return {play:false,ph:0,q:null,refocus:null};},
  onLevel(sim){sync(sim);},
  initVis(sim){sync(sim);},
  step(sim,dt){const s=sim.st;if(!s)return;const v=sim.p.view;
    if(v==='move'&&s.play){s.ph+=dt/4;const j=curJ(sim),mv=curM(sim),r=M[j][mv].rom,tri=1-Math.abs(1-(s.ph%2));const a=Math.round(r*tri);sim.p.angle=a;if(sim.ui&&sim.ui.ctl&&sim.ui.ctl.angle)sim.ui.ctl.angle.set(a);}
    if(v==='check'&&s.q)s.q.ph+=dt/2.5;},
  metrics:[
    {id:'ang',label:'Joint angle',unit:'°',lvl:'bio',min:0,max:180,d:0,get(sim){if(sim.p.view!=='move')return 0;return measured(curJ(sim),curM(sim),curA(sim));}},
    {id:'range',label:'Normal range',unit:'',lvl:'bio',text:true,get(sim){const v=sim.p.view;if(v==='types')return JT[sim.p.jtype].dof;if(v==='check')return (sim.st.q&&sim.st.q.done)?rangeText(sim.st.q.joint,sim.st.q.move):'?';return rangeText(curJ(sim),curM(sim));}},
    {id:'plane',label:'Plane',unit:'',lvl:'bio',text:true,get(sim){const v=sim.p.view;if(v==='types')return 'Depends on the joint';if(v==='check')return (sim.st.q&&sim.st.q.done)?PL[M[sim.st.q.joint][sim.st.q.move].plane].n:'?';return PL[M[curJ(sim)][curM(sim)].plane].n;}},
    {id:'ex',label:'Exercise',unit:'',lvl:'bio',text:true,get(sim){const v=sim.p.view;if(v==='types')return JT[sim.p.jtype].ex;if(v==='check')return (sim.st.q&&sim.st.q.done)?M[sim.st.q.joint][sim.st.q.move].ex:'?';return M[curJ(sim)][curM(sim)].ex;}}
  ],
  narrate(sim){const v=sim.p.view;
    if(v==='types'){const t=JT[sim.p.jtype];return `<b>${t.n}:</b> ${t.dof} ${t.why}`;}
    if(v==='check')return 'Watch the blue part and name the movement. <b>Ask two things:</b> which plane is it in, and is the joint angle closing, opening or spinning?';
    const j=curJ(sim),mv=curM(sim),m=M[j][mv],a=curA(sim);
    if(a>=m.rom&&atLeast('honors'))return `<b>End of the normal range.</b> ${m.stop}`;
    if(a>=m.rom)return `<b>${LBL[mv]}: end of the normal range.</b> The joint’s structure stops it here. Choose Closer look to see what stops it.`;
    if(j==='elbow'&&(mv==='pronation'||mv==='supination')){const P=pose(j,mv,a);const up=P.palm[1];const pf=up>.7?'up':up<-.7?'down':'toward the midline';return `<b>${LBL[mv]}.</b> ${m.say} The palm now faces ${pf}. The orange side of the hand is the palm.`;}
    return `<b>${LBL[mv]} of the ${j==='elbow'?'elbow':j}.</b> ${m.say} It moves in the ${PL[m.plane].short} plane.`;},
  onClick(sim,x,y){if(sim.p.view!=='types')return;const c=(x<W/2?0:1)+(y<H/2?0:2);BioLab.setValues(sim,{jtype:TYPEORDER[c]});},
  infoPanel,bindInfo,
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,W,H);const v=sim.p.view;
    if(v==='types'){drawTypes(sim,ctx,k,t);return;}
    if(v==='check'){const q=qEnsure(sim),r=M[q.joint][q.move].rom,tri=1-Math.abs(1-(q.ph%2)),a=r*.92*(RM?.8:tri);
      const name=renderFigure(sim,ctx,k,q.joint,q.move,a,q.done);
      if(q.done){drawInset(ctx,q.joint,q.move,a,M[q.joint][q.move].plane,k);labelBox(ctx,[{t:LBL[q.move],s:15*k,w:700}],k);}
      else labelBox(ctx,[{t:'What movement is this?',s:15*k,w:700},{t:name,s:12*k,c:PAL['cv-soft']}],k);return;}
    const j=curJ(sim),mv=curM(sim),a=curA(sim),m=M[j][mv];const name=renderFigure(sim,ctx,k,j,mv,a,true);drawInset(ctx,j,mv,a,m.plane,k);
    labelBox(ctx,[{t:(j==='elbow'?'Elbow':JN[j])+' '+LBL[mv].toLowerCase(),s:15*k,w:700},{t:Math.round(measured(j,mv,a))+'°',s:22*k,w:700,c:a>=m.rom?PAL['s3']:PAL['s1']},{t:'Normal: '+rangeText(j,mv),s:12*k},{t:name,s:12*k,c:PAL['cv-soft']}],k);},
  tour:[
    {title:'Start in anatomical position',text:'Every movement name starts from anatomical position, and each one comes in a pair of opposites. The blue part moves, the dashed green arc is its normal range and the red wedge is how far it has moved.',setup:tourSet({},0)},
    {title:'Flexion in the sagittal plane',text:'A biceps curl is elbow flexion: the angle at the joint gets smaller. It moves in the sagittal plane, so you see it best from the side. The normal range is 0° to 150°.',setup:tourSet({joint:'elbow',move:'flexion'},110)},
    {title:'Abduction in the frontal plane',text:'A lateral raise is shoulder abduction: the arm moves away from the midline. It moves in the frontal plane, so you see it best from the front. Adduction brings it back.',setup:tourSet({joint:'shoulder',move:'abduction'},90)},
    {title:'Rotation in the transverse plane',text:'With the elbow bent, the humerus spins on its long axis and the forearm swings like a gate. Rotation moves in the transverse plane, the same plane as a trunk twist.',setup:tourSet({joint:'shoulder',move:'er'},60)},
    {title:'Pronation and supination',text:'Turning your palm down is pronation. Turning it up is supination. The radius crosses over the ulna at a pivot joint, so the hinge of the elbow is not doing this.',setup:tourSet({joint:'elbow',move:'pronation'},70)},
    {title:'The ankle has its own words',text:'Pointing your toes is plantarflexion, as in a calf raise. Pulling them up is dorsiflexion. Inversion turns the sole inward, and eversion turns it outward.',setup:tourSet({joint:'ankle',move:'inversion'},30)},
    {title:'Structure limits movement',text:'A joint’s shape sets what it can do. A ball and socket moves in every plane, a hinge in one, a pivot only spins and a saddle rocks in two directions.',setup:tourSet({view:'types',jtype:'ball'})}
  ],
  onTourExit(sim){sync(sim);},
  challenges:[
    {lvl:'bio',q:'Which plane does a biceps curl move in?',choices:['Sagittal','Frontal','Transverse'],correct:['sagittal','frontal','transverse'].indexOf(M.elbow.flexion.plane),instant:true,show:{joint:'elbow',move:'flexion'},
     explain:'The forearm swings forward and back, so you see it best from the side. That is the sagittal plane.'},
    {lvl:'bio',q:'A lateral raise lifts the arm out to the side. What is this movement?',choices:['Shoulder flexion','Shoulder abduction','Shoulder adduction','Shoulder extension'],correct:(()=>{const q=pose('shoulder','abduction',90);return Math.abs(q.W[0])>.3?1:0;})(),instant:true,show:{joint:'shoulder',move:'abduction'},
     explain:'Abduction moves a limb away from the midline. Adduction brings it back toward the midline, so you can remember that it "adds" the limb to the body.'},
    {lvl:'bio',q:'During a calf raise, what is your ankle doing as you rise onto your toes?',choices:['Dorsiflexion','Plantarflexion','Inversion','Eversion'],correct:(()=>{const a=pose('ankle','plantar',40),b=pose('ankle','plantar',0);return a.Toe[1]<b.Toe[1]?1:0;})(),instant:true,show:{joint:'ankle',move:'plantar'},
     explain:'Plantarflexion points the toes away from the shin. In a calf raise the toes stay on the floor and the heel lifts, but the foot and shin move apart in the same way.'},
    {lvl:'bio',q:'With your elbow bent 90°, you turn your palm to face the floor. What is this movement?',choices:['Supination','Pronation','Flexion','Eversion'],correct:(()=>{const p=pose('elbow','pronation',80);return p.palm[1]<0?1:0;})(),instant:true,show:{joint:'elbow',move:'pronation'},
     explain:'Pronation turns the palm down. Supination turns it up, as if you were holding a bowl of soup.'},
    {lvl:'honors',q:'Why can’t a healthy knee abduct like a hip can?',choices:['The quadriceps block it','It is a modified hinge, and ligaments limit it to one main plane','The patella blocks it','It can, by the same amount'],correct:M.knee.abduction?3:1,instant:true,show:{joint:'knee',move:'flexion'},
     explain:'The knee has no abduction movement, so a sideways force loads its collateral ligaments instead. That is how the MCL gets sprained.'},
    {lvl:'honors',q:'Both are ball and socket joints. Which has more abduction, and why?',choices:['The hip, because it is bigger','The shoulder, because its socket is shallow','The hip, because its socket is deep','They are equal, because they are the same type'],correct:M.shoulder.abduction.rom>M.hip.abduction.rom?1:2,instant:true,show:{joint:'shoulder',move:'abduction'},
     explain:'The shoulder reaches about 180° and the hip about 45°. A shallow socket gives range and costs stability, so the shoulder dislocates far more often than the hip.'},
    {lvl:'honors',q:'The ankle inverts farther than it everts. Which structure explains it?',choices:['The fibula reaches lower than the tibia and blocks eversion','The Achilles tendon pulls the foot inward','The talus is missing on the lateral side','The tibia reaches lower than the fibula and blocks inversion'],correct:M.ankle.inversion.rom>M.ankle.eversion.rom?0:1,instant:true,show:{joint:'ankle',move:'eversion'},
     explain:'The lateral malleolus, the end of the fibula, sits lower than the medial malleolus. It blocks eversion, while inversion has room and relies on ligaments. So most ankle sprains are inversion sprains.'},
    {lvl:'ap',q:'You rotate your shoulder internally with your elbow bent 90° at your side. Which way does your hand go?',choices:['Toward your belly','Away from your belly','Straight up','Straight down'],correct:(()=>{const a=pose('shoulder','ir',60),b=pose('shoulder','ir',0);return a.W[0]>b.W[0]?0:1;})(),instant:true,show:{joint:'shoulder',move:'ir'},
     explain:'The humerus spins inward on its long axis. The forearm acts like a pointer, so the hand swings toward the belly. Bending the elbow is what makes spinning visible.'},
    {lvl:'ap',q:'Which movement turns around the long axis of a bone?',choices:['Flexion','Abduction','Internal rotation','Dorsiflexion'],correct:M.shoulder.ir.plane==='transverse'?2:0,instant:true,show:{joint:'hip',move:'ir'},
     explain:'Rotation movements happen in the transverse plane, around a long axis. Sagittal movements turn around a side-to-side axis, and frontal movements turn around a front-to-back axis.'},
    {lvl:'ap',q:'As you lower into a squat, what happens at the hip, knee and ankle?',choices:['Hip flexion, knee flexion, ankle dorsiflexion','Hip extension, knee flexion, ankle plantarflexion','Hip flexion, knee extension, ankle dorsiflexion','Hip abduction, knee flexion, ankle inversion'],correct:['hip','knee'].every(j=>M[j].flexion.plane==='sagittal')&&M.ankle.dorsi.plane==='sagittal'?0:1,instant:true,show:{joint:'ankle',move:'dorsi'},
     explain:'All three happen in the sagittal plane. If the ankle cannot dorsiflex enough, the squat runs out of depth or another joint has to give.'}
  ],
  onChallenge(sim,ch,phase){if(phase==='done'&&ch&&ch.show){BioLab.setValues(sim,base(ch.show));syncAngle(sim,mainDef(ch.show.joint,ch.show.move));sync(sim);BioLab.refresh(sim);}},
  lab:{bio:'<b>Question:</b> Which plane does each movement use? <ol><li>Choose a joint and each movement it has. Move the slider to the end of the range and press <b>Record trial</b>.</li><li>Do this for at least four movements on two joints.</li><li>Stand up and do each movement yourself. Name an exercise for it.</li></ol><p><b>Write:</b> Which movements share a plane? What is the pattern?</p>',
       honors:'<b>Question:</b> How does a joint’s structure limit it? <ol><li>Record abduction at the shoulder and at the hip. Compare the range.</li><li>Record inversion and eversion at the ankle. Read what stops each one.</li><li>Open <b>Joint types</b> and find the type for each joint.</li></ol><p><b>Write:</b> Explain why the most mobile joints tend to be the least stable, using the shoulder and the hip.</p>',
       ap:'<b>Question:</b> How would you describe a whole exercise in joint terms? <ol><li>Pick a compound exercise such as a squat, a push-up or a pull-up.</li><li>Break it into the movements at each joint. Set each one in the tool and record the range and plane.</li><li>Find the joint that has the smallest normal range compared with what the exercise asks for.</li></ol><p><b>Write:</b> Predict which joint would limit this exercise first in someone who has lost range, and what might compensate.</p>'},
  terms:[
    {t:'Flexion, extension',d:'Flexion makes the angle at a joint smaller in the sagittal plane, and extension makes it larger. At the shoulder and hip, flexion moves the limb forward.'},
    {t:'Abduction, adduction',d:'Abduction moves a limb away from the midline, and adduction moves it toward the midline.'},
    {t:'Internal, external rotation',d:'A bone spins on its long axis, with its front surface turning toward or away from the midline.'},
    {t:'Pronation, supination',d:'Turning the palm down or up, at the joints between the radius and ulna.'},
    {t:'Plantarflexion, dorsiflexion',d:'Pointing the toes down; pulling them up toward the shin.'},
    {t:'Inversion, eversion',d:'Turning the sole inward; turning it outward.'},
    {t:'Range of motion (ROM)',d:'How far a joint moves, in degrees. A goniometer measures it.'},
    {t:'Ball and socket, hinge, pivot, saddle',d:'Joint types named for the shape of the bone surfaces. The shape sets what the joint can do.'},
    {t:'Sagittal, frontal, transverse',d:'The three planes of movement: forward and back, side to side, and rotation.'},
    {t:'End feel',d:'What stops a joint at the end of its range: bone, ligament and capsule tension, or soft tissue pressing together.',lvl:'honors'},
    {t:'Axis of rotation',d:'The line a joint turns around. It is always perpendicular to the plane of movement.',lvl:'ap'},
    {t:'Horizontal adduction and abduction',d:'From 90° of abduction, the arm sweeps forward across the chest or backward.',lvl:'ap'},
    {t:'Radial and ulnar deviation',d:'The hand tips toward the thumb side or the little finger side. This is abduction and adduction of the wrist.',lvl:'ap'}
  ],
  about:'<p>A jointed 3D figure driven by rotations at each joint. The path, the wedge and the answers to the direction questions all come from that one set of calculations. Only the figure’s right side moves.</p><p><b>Ranges</b> are typical adult values from standard goniometry tables (American Academy of Orthopaedic Surgeons style): for example, shoulder flexion 180°, elbow flexion 150°, hip flexion 120°, knee flexion 135°, ankle dorsiflexion 20° and plantarflexion 50°. Published tables differ by 5 to 15°, and age, sex, training and injury all change them. A number outside this range is not a diagnosis. Knee rotation is given with the knee bent 90°.</p><p><b>Simplified:</b> The figure uses rounded segments, not real bones. Shoulder range shows the arm alone, although the scapula supplies about a third of overhead motion. The ankle figure turns the whole foot at one point, although inversion and eversion come mostly from the subtalar joint. Forearm rotation starts from thumb-up neutral, as in goniometry, and anatomical position sits near full supination. Exercises are examples of the main movement and most real exercises combine several.</p><p>Educational use only. This tool does not diagnose or treat anything.</p>'
};
BioLab.register(MOVEMENTS);
})();
