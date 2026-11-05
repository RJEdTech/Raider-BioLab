(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;
/* Major muscles of the body. Every muscle is a named shape in body coordinates (x from the midline, y from the top of the head, both as a
   fraction of height; BioLab.body uses the same units) and is drawn on both sides. Shapes are control polygons smoothed into a curve.
   The fiber lines on each shape run in that muscle's real fiber direction. */

/* ---------- what students study: names, actions, attachments ---------- */
const M={
masseter:{n:'Masseter',r:'head',act:'Closes the jaw. It is your main chewing muscle.',o:'Cheekbone (zygomatic arch).',i:'Outer angle of the lower jaw (mandible).',ex:'Chewing. Clench your teeth and feel it bulge at your jaw.',word:'From the Greek for “chewer.”',ant:'Gravity and the small jaw openers',nv:'Trigeminal nerve (cranial nerve V)',lm:'Zygomatic arch to the ramus and angle of the mandible.'},
scm:{n:'Sternocleidomastoid',r:'head',act:'One side turns the head to the opposite side and tilts it toward the same shoulder. Both sides together flex the neck.',o:'Top of the sternum and the inner collarbone.',i:'Bony bump behind the ear (mastoid process).',ex:'Neck curl against light hand resistance.',word:'Named for its attachments: sterno (sternum), cleido (clavicle), mastoid.',ant:'Neck extensors, including the upper Trapezius',nv:'Spinal accessory nerve (cranial nerve XI)',lm:'Manubrium and medial clavicle to the mastoid process.'},
trapezius:{n:'Trapezius',r:'trunk',act:'Moves the shoulder blade. Upper fibers shrug it up, middle fibers pull it back, and lower fibers draw it down.',o:'Base of the skull and the spine from the neck to the bottom of the rib cage (C7 to T12).',i:'Outer collarbone, top of the shoulder (acromion) and the ridge on the shoulder blade.',ex:'Shoulder shrug, seated row.',word:'Trapezius means trapezoid-shaped. Together the two sides make the shape.',ant:'Serratus Anterior (at the shoulder blade)',nv:'Spinal accessory nerve (cranial nerve XI)',lm:'External occipital protuberance, nuchal ligament and C7 to T12 spinous processes to the lateral clavicle, acromion and spine of the scapula.'},
deltoid:{n:'Deltoid',r:'arm',act:'Lifts the arm out to the side (abduction). Front fibers help flex the shoulder, and back fibers help extend it.',o:'Outer collarbone, top of the shoulder (acromion) and the ridge on the shoulder blade.',i:'Outer side of the humerus, about halfway down.',ex:'Lateral raise, overhead press.',word:'Deltoid means triangle-shaped, like the Greek letter delta (Δ).',ant:'Latissimus Dorsi and Pectoralis Major',nv:'Axillary nerve (C5, C6)',lm:'Lateral clavicle, acromion and spine of the scapula to the deltoid tuberosity.'},
pec:{n:'Pectoralis Major',r:'trunk',act:'Brings the arm forward and across the chest (flexion, adduction) and rotates it inward.',o:'Inner collarbone, sternum and upper rib cartilages.',i:'Upper humerus, just below the shoulder joint.',ex:'Bench press, push-up.',word:'Pectoralis means of the chest. Major means larger.',ant:'Latissimus Dorsi and the back of the Deltoid',nv:'Medial and lateral pectoral nerves (C5 to T1)',lm:'Medial clavicle, sternum and costal cartilages 1 to 6 to the lateral lip of the intertubercular groove.'},
biceps:{n:'Biceps Brachii',r:'arm',act:'Bends the elbow (flexion) and turns the palm up (supination).',o:'Two heads on the shoulder blade.',i:'Radius, just below the elbow.',ex:'Biceps curl.',word:'Biceps means two heads. Brachii means of the arm.',ant:'Triceps Brachii',nv:'Musculocutaneous nerve (C5, C6)',lm:'Short head: coracoid process. Long head: supraglenoid tubercle. Both to the radial tuberosity and the bicipital aponeurosis.'},
triceps:{n:'Triceps Brachii',r:'arm',act:'Straightens the elbow (extension). The long head also helps pull the arm back.',o:'Long head on the shoulder blade. Two heads on the back of the humerus.',i:'Point of the elbow (olecranon of the ulna).',ex:'Triceps pushdown, dip.',word:'Triceps means three heads. Brachii means of the arm.',ant:'Biceps Brachii and Brachioradialis',nv:'Radial nerve (C6 to C8)',lm:'Infraglenoid tubercle and posterior humerus to the olecranon.'},
brachiorad:{n:'Brachioradialis',r:'arm',act:'Bends the elbow, most strongly with the thumb pointing up.',o:'Outer ridge of the humerus, just above the elbow.',i:'Radius, near the wrist.',ex:'Hammer curl.',word:'Named for its attachments: brachio (arm) and radialis (radius).',ant:'Triceps Brachii',nv:'Radial nerve (C5, C6)',lm:'Lateral supracondylar ridge to the styloid process of the radius.'},
flexors:{n:'Forearm Flexors',r:'arm',act:'Bend the wrist and fingers toward the palm. This group gives you your grip.',o:'Inner bump of the humerus at the elbow (medial epicondyle).',i:'Palm-side wrist bones, hand bones and fingers.',ex:'Wrist curl, squeezing a grip trainer.',word:'A group name: flexors flex. The group includes flexor carpi radialis, palmaris longus and flexor carpi ulnaris.',ant:'Forearm Extensors',nv:'Median and ulnar nerves',lm:'Common flexor origin on the medial epicondyle to the carpals, metacarpals and phalanges (palmar side).'},
extensors:{n:'Forearm Extensors',r:'arm',act:'Lift the wrist and fingers back, away from the palm.',o:'Outer bump of the humerus at the elbow (lateral epicondyle).',i:'Back of the hand bones and fingers.',ex:'Reverse wrist curl.',word:'A group name: extensors extend. The group includes extensor carpi radialis, extensor digitorum and extensor carpi ulnaris.',ant:'Forearm Flexors',nv:'Radial nerve',lm:'Common extensor origin on the lateral epicondyle to the metacarpals and phalanges (dorsal side).'},
serratus:{n:'Serratus Anterior',r:'trunk',act:'Pulls the shoulder blade forward around the ribs and holds it flat against them.',o:'Sides of the upper eight or nine ribs.',i:'Inner edge of the shoulder blade, on the side that faces the ribs.',ex:'Push-up plus, a straight-arm punch.',word:'Serratus means saw-toothed. Anterior means toward the front.',ant:'Rhomboids',nv:'Long thoracic nerve (C5 to C7)',lm:'Ribs 1 to 8 or 9 to the costal surface of the medial border of the scapula.'},
rectusabd:{n:'Rectus Abdominis',r:'trunk',act:'Bends the trunk forward (flexion) and braces the abdomen.',o:'Pubic bone.',i:'Bottom of the sternum and the lower rib cartilages.',ex:'Crunch, plank.',word:'Rectus means straight, because its fibers run straight up and down. Abdominis means of the abdomen.',ant:'Erector Spinae',nv:'Lower intercostal nerves (T7 to T12)',lm:'Pubic crest and symphysis to the xiphoid process and costal cartilages 5 to 7.'},
extoblique:{n:'External Oblique',r:'trunk',act:'One side twists the trunk toward the opposite side and bends it sideways. Both sides help flex the trunk.',o:'Outer surfaces of the lower eight ribs.',i:'Top of the hip bone and the midline tendon of the abdomen (linea alba).',ex:'Side plank, cable chop.',word:'Oblique means slanted. External means it is the outer layer. Its fibers run the way your fingers point with your hands in your front pockets.',ant:'The opposite External Oblique (in rotation)',nv:'Lower intercostal nerves (T7 to T12)',lm:'Ribs 5 to 12 to the iliac crest and linea alba.'},
lats:{n:'Latissimus Dorsi',r:'trunk',act:'Pulls the arm down and back (extension, adduction) and rotates it inward.',o:'Lower spine, a sheet of tendon over the low back (thoracolumbar fascia), the top of the hip bone and the lowest ribs.',i:'Front of the upper humerus.',ex:'Pull-up, lat pulldown.',word:'Latissimus means widest. Dorsi means of the back.',ant:'Deltoid and Pectoralis Major (upper fibers)',nv:'Thoracodorsal nerve (C6 to C8)',lm:'T7 to L5 spinous processes, thoracolumbar fascia, iliac crest and lower ribs to the floor of the intertubercular groove.'},
rhomboids:{n:'Rhomboids',r:'trunk',deep:true,act:'Pull the shoulder blades back toward the spine (retraction).',o:'Spine at the base of the neck and upper back (C7 to T5).',i:'Inner edge of the shoulder blade.',ex:'Seated row, band pull-apart.',word:'Rhomboid means shaped like a rhombus, a slanted diamond.',ant:'Serratus Anterior',nv:'Dorsal scapular nerve (C4, C5)',lm:'Spinous processes of C7 to T5 to the medial border of the scapula.'},
infra:{n:'Infraspinatus',r:'trunk',act:'Rotates the arm outward (external rotation) and helps hold the humerus in the shoulder socket. It is one of the four rotator cuff muscles.',o:'Back of the shoulder blade, below its ridge.',i:'Top outer part of the humerus (greater tubercle).',ex:'External rotation with a band, elbow at your side.',word:'Infra means below, and spinatus means the spine of the scapula. It sits below that ridge.',ant:'Pectoralis Major and Latissimus Dorsi (in rotation)',nv:'Suprascapular nerve (C5, C6)',lm:'Infraspinous fossa to the greater tubercle.'},
teres:{n:'Teres Major',r:'trunk',act:'Pulls the arm down and back and rotates it inward. It works with the Latissimus Dorsi. It is not part of the rotator cuff.',o:'Bottom corner of the shoulder blade.',i:'Front of the upper humerus.',ex:'Row, lat pulldown.',word:'Teres means round, like a cord. Major means larger.',ant:'Deltoid',nv:'Lower subscapular nerve (C5, C6)',lm:'Inferior angle of the scapula to the medial lip of the intertubercular groove.'},
erector:{n:'Erector Spinae',r:'trunk',deep:'part',act:'Straightens the spine (extension) and holds your posture.',o:'Sacrum, back of the hip bone and lower spine.',i:'Ribs, upper vertebrae and the base of the skull.',ex:'Back extension, deadlift.',word:'Erector means it holds upright. Spinae means of the spine.',ant:'Rectus Abdominis',nv:'Branches of the spinal nerves (dorsal rami)',lm:'Sacrum, iliac crest and lumbar spinous processes to the ribs, vertebrae and mastoid. Three columns: iliocostalis, longissimus, spinalis.'},
gmax:{n:'Gluteus Maximus',r:'hip',act:'Straightens the hip (extension), as when you stand up from a squat or climb stairs.',o:'Back of the hip bone, sacrum and tailbone.',i:'Back of the femur and the iliotibial band.',ex:'Squat, hip thrust.',word:'Gluteus means of the buttock. Maximus means largest.',ant:'Hip flexors, such as Rectus Femoris',nv:'Inferior gluteal nerve (L5 to S2)',lm:'Posterior ilium, sacrum and coccyx to the gluteal tuberosity and iliotibial tract.'},
gmed:{n:'Gluteus Medius',r:'hip',act:'Lifts the leg out to the side (abduction) and keeps the pelvis level when you stand on one foot.',o:'Outer surface of the hip bone.',i:'Bump on the outer top of the femur (greater trochanter).',ex:'Side-lying leg raise, band walk.',word:'Medius means middle-sized.',ant:'Adductors',nv:'Superior gluteal nerve (L4 to S1)',lm:'Outer ilium to the greater trochanter.'},
adductors:{n:'Adductors',r:'hip',act:'Pull the leg in toward the midline (adduction). This is the group people strain in a groin pull.',o:'Pubic bone and the bottom of the hip bone.',i:'Back of the femur, along most of its length.',ex:'Side-lying adduction, squeezing a ball between the knees.',word:'A group name. Adduct means to bring toward the midline. The group includes adductor longus, adductor brevis and adductor magnus.',ant:'Gluteus Medius',nv:'Obturator nerve (L2 to L4)',lm:'Pubis and ischium to the linea aspera and adductor tubercle of the femur.'},
sartorius:{n:'Sartorius',r:'leg',act:'Flexes, abducts and rotates the hip outward, and bends the knee. Those moves together make the figure-four position.',o:'Front point of the hip bone (ASIS).',i:'Inner side of the tibia, just below the knee.',ex:'Figure-four. Sit and rest your ankle on the other knee.',word:'From the Latin for “tailor,” who once sat cross-legged to sew. It is the longest muscle in the body.',ant:'Gluteus Maximus (at the hip)',nv:'Femoral nerve (L2, L3)',lm:'Anterior superior iliac spine to the pes anserinus on the medial tibia.'},
rectusfem:{n:'Rectus Femoris',r:'leg',act:'Straightens the knee and flexes the hip. It is the only quadriceps muscle that crosses the hip.',o:'Front of the hip bone, above the hip socket (AIIS).',i:'Patella, then the tibia through the patellar tendon.',ex:'Leg extension, straight-leg raise.',word:'Rectus means straight. Femoris means of the femur (thigh).',ant:'Hamstrings at the knee, Gluteus Maximus at the hip',nv:'Femoral nerve (L2 to L4)',lm:'Anterior inferior iliac spine to the tibial tuberosity through the quadriceps tendon, patella and patellar tendon.'},
vastlat:{n:'Vastus Lateralis',r:'leg',act:'Straightens the knee. It is the largest of the quadriceps.',o:'Upper outer femur.',i:'Patella, then the tibia through the patellar tendon.',ex:'Squat, leg press.',word:'Vastus means large. Lateralis means on the outer side.',ant:'Biceps Femoris, Semitendinosus and Semimembranosus',nv:'Femoral nerve (L2 to L4)',lm:'Greater trochanter and lateral lip of the linea aspera to the tibial tuberosity through the patella.'},
vastmed:{n:'Vastus Medialis',r:'leg',act:'Straightens the knee and helps keep the patella tracking in its groove.',o:'Inner back of the femur.',i:'Patella, then the tibia through the patellar tendon.',ex:'Squat, step-up, the last few degrees of a leg extension.',word:'Vastus means large. Medialis means on the inner side.',ant:'Biceps Femoris, Semitendinosus and Semimembranosus',nv:'Femoral nerve (L2 to L4)',lm:'Medial lip of the linea aspera to the tibial tuberosity through the patella.'},
bicfem:{n:'Biceps Femoris',r:'leg',act:'Bends the knee and straightens the hip. It is the outer hamstring.',o:'Sit bone (ischial tuberosity), plus a short head on the femur.',i:'Head of the fibula, on the outer knee.',ex:'Leg curl, Romanian deadlift.',word:'Biceps means two heads. Femoris means of the femur (thigh).',ant:'Rectus Femoris and the vastus muscles',nv:'Sciatic nerve (L5 to S2)',lm:'Long head: ischial tuberosity. Short head: linea aspera. Both to the head of the fibula.'},
semiten:{n:'Semitendinosus',r:'leg',act:'Bends the knee and straightens the hip. It is one of the two inner hamstrings.',o:'Sit bone (ischial tuberosity).',i:'Inner side of the tibia, just below the knee.',ex:'Leg curl, Nordic curl.',word:'Semi means half and tendinosus means tendon. Its lower half is a long, cord-like tendon.',ant:'Rectus Femoris and the vastus muscles',nv:'Sciatic nerve (L5 to S2)',lm:'Ischial tuberosity to the pes anserinus on the medial tibia.'},
semimem:{n:'Semimembranosus',r:'leg',act:'Bends the knee and straightens the hip. It is the other inner hamstring, lying under the Semitendinosus.',o:'Sit bone (ischial tuberosity).',i:'Back of the inner top of the tibia.',ex:'Leg curl, Romanian deadlift.',word:'Semi means half and membranosus means membrane. Its upper part is a flat sheet of tendon.',ant:'Rectus Femoris and the vastus muscles',nv:'Sciatic nerve (L5 to S2)',lm:'Ischial tuberosity to the posterior medial condyle of the tibia.'},
gastroc:{n:'Gastrocnemius',r:'leg',act:'Points the foot down (plantarflexion) and helps bend the knee.',o:'Back of the femur, just above the knee, in two heads.',i:'Heel bone (calcaneus) through the Achilles tendon.',ex:'Calf raise with a straight knee.',word:'From the Greek for “belly of the leg.”',ant:'Tibialis Anterior',nv:'Tibial nerve (S1, S2)',lm:'Medial and lateral femoral condyles to the calcaneus through the calcaneal (Achilles) tendon.'},
soleus:{n:'Soleus',r:'leg',deep:'part',act:'Points the foot down (plantarflexion), especially with the knee bent. It works nonstop to keep you from tipping forward when you stand.',o:'Back of the upper tibia and fibula.',i:'Heel bone (calcaneus) through the Achilles tendon.',ex:'Calf raise with a bent knee, seated.',word:'Named for the sole, a flat fish, because of its flat shape.',ant:'Tibialis Anterior',nv:'Tibial nerve (S1, S2)',lm:'Head of the fibula and soleal line of the tibia to the calcaneus through the calcaneal tendon.'},
tibant:{n:'Tibialis Anterior',r:'leg',act:'Pulls the foot up (dorsiflexion) and turns the sole inward (inversion).',o:'Outer side of the upper tibia.',i:'Inner side of the foot, at the base of the big toe’s long bone.',ex:'Toe raise, walking on your heels.',word:'Tibialis means of the tibia. Anterior means on the front.',ant:'Gastrocnemius and Soleus',nv:'Deep fibular nerve (L4, L5)',lm:'Lateral condyle and upper lateral tibia to the medial cuneiform and first metatarsal.'}
};
const ORDER=['masseter','scm','trapezius','deltoid','pec','biceps','triceps','brachiorad','flexors','extensors','serratus','rectusabd','extoblique','lats','rhomboids','infra','teres','erector','gmax','gmed','adductors','sartorius','rectusfem','vastlat','vastmed','bicfem','semiten','semimem','gastroc','soleus','tibant'];
const SLANG={lats:'lats',latissimus:'lats',pecs:'pec',pec:'pec',chest:'pec',traps:'trapezius',trap:'trapezius',delts:'deltoid',delt:'deltoid',biceps:'biceps',bicep:'biceps',triceps:'triceps',tricep:'triceps',abs:'rectusabd',obliques:'extoblique',oblique:'extoblique',glutes:'gmax',glute:'gmax',quad:'rectusfem',quads:'rectusfem',hamstring:'bicfem',hamstrings:'bicfem',calf:'gastroc',calves:'gastroc',gastroc:'gastroc',shin:'tibant'};

/* ---------- the art ---------- */
const TONE=['#b4534a','#a84b45','#bd5c50','#ad4f47'];
const MUTED='#8d6a64',BONE='#ded3bf',DEEPC='#673631',HI='#f4b730',HI2='#8a5d0a';
function bspline(pts,n){const out=[],L=pts.length;for(let i=0;i<L;i++){const p0=pts[i],p1=pts[(i+1)%L],p2=pts[(i+2)%L],a=[(p0[0]+p1[0])/2,(p0[1]+p1[1])/2],b=[(p1[0]+p2[0])/2,(p1[1]+p2[1])/2];
  for(let j=0;j<n;j++){const t=j/n,u=1-t;out.push([u*u*a[0]+2*u*t*p1[0]+t*t*b[0],u*u*a[1]+2*u*t*p1[1]+t*t*b[1]]);}}return out;}
function strapPts(c,w){const left=[],right=[];c.forEach((p,i)=>{const a=c[Math.max(0,i-1)],b=c[Math.min(c.length-1,i+1)];let dx=b[0]-a[0],dy=b[1]-a[1];const L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;left.push([p[0]-dy*w[i],p[1]+dx*w[i]]);right.push([p[0]+dy*w[i],p[1]-dx*w[i]]);});
  const e=c[c.length-1],s=c[0];return left.concat([e],right.reverse(),[s]);}
function fibers(pc){const pts=pc.poly,xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),L=[],gap=.0042;pc.bb=[x0,y0,x1,y1];
  const f=pc.fib;if(!f)return L;
  if(f.c){const [cx,cy]=f.c,R=Math.hypot(Math.max(Math.abs(x0-cx),Math.abs(x1-cx)),Math.max(Math.abs(y0-cy),Math.abs(y1-cy)))+.01,angs=pts.map(p=>Math.atan2(p[1]-cy,p[0]-cx));
    let a0=Math.min(...angs),a1=Math.max(...angs);if(a1-a0>Math.PI){const b=angs.map(a=>a<0?a+6.2832:a);a0=Math.min(...b);a1=Math.max(...b);}
    const n=Math.max(4,Math.round((a1-a0)*R*.7/gap));for(let i=0;i<=n;i++){const a=lerp(a0,a1,i/n);L.push([cx,cy,cx+Math.cos(a)*R,cy+Math.sin(a)*R]);}}
  else if(f.d){let [dx,dy]=f.d;const m=Math.hypot(dx,dy);dx/=m;dy/=m;const nx=-dy,ny=dx,pr=pts.map(p=>p[0]*nx+p[1]*ny),a=Math.min(...pr),b=Math.max(...pr),R=Math.hypot(x1-x0,y1-y0),mx=(x0+x1)/2,my=(y0+y1)/2,m0=mx*nx+my*ny;
    for(let q=a;q<=b;q+=gap){const px=mx+nx*(q-m0),py=my+ny*(q-m0);L.push([px-dx*R,py-dy*R,px+dx*R,py+dy*R]);}}
  else if(f.a){const c=f.a,w=f.w,N=Math.max(3,Math.round(Math.max(...w)*2/gap));for(let q=-N;q<=N;q++){const off=q/N;let prev=null;for(let i=0;i<c.length;i++){const a=c[Math.max(0,i-1)],b=c[Math.min(c.length-1,i+1)];let dx=b[0]-a[0],dy=b[1]-a[1];const m=Math.hypot(dx,dy)||1;dx/=m;dy/=m;const x=c[i][0]-dy*w[i]*off,y=c[i][1]+dx*w[i]*off;if(prev)L.push([prev[0],prev[1],x,y]);prev=[x,y];}}}
  return L;}
function P(m,pts,fib,o){const pc=Object.assign({m,pts,fib},o||{});pc.poly=bspline(pts,6);pc.lines=fibers(pc);return pc;}
function S(m,c,w,o){return P(m,strapPts(c,w),{a:c,w},o);}
/* m:null shapes are real muscles or bones that are not on the study list. They are drawn muted and cannot be selected. */
const FRONT=[
  P(null,[[.003,.112],[.018,.112],[.013,.150],[.003,.156]],{d:[0,1]}),
  P('trapezius',[[.030,.122],[.036,.143],[.062,.152],[.094,.157],[.116,.164],[.085,.166],[.050,.161],[.026,.153]],{d:[1,.42]}),
  P('scm',[[.034,.100],[.032,.125],[.029,.145],[.028,.160],[.017,.155],[.006,.161],[.002,.154],[.011,.134],[.020,.112],[.026,.100]],{d:[-.42,1]}),
  P('masseter',[[.031,.065],[.051,.063],[.050,.082],[.044,.098],[.033,.096],[.029,.08]],{d:[.12,1]}),
  P('lats',[[.108,.233],[.103,.262],[.101,.312],[.094,.312],[.092,.262]],{c:[.118,.215]}),
  P('extoblique',[[.046,.270],[.066,.284],[.082,.298],[.100,.318],[.099,.37],[.098,.408],[.072,.430],[.036,.452],[.033,.40],[.044,.35],[.049,.31]],{d:[-.55,1]},{pale:[.062,.375,.036,.445]}),
  ...[.250,.2665,.283,.2995].map(y=>P('serratus',[[.095,y-.005],[.095,y+.010],[.084,y+.016],[.068,y+.026],[.074,y+.010]],{d:[-1,.42]})),
  P('rectusabd',[[.004,.260],[.025,.255],[.047,.260],[.051,.30],[.048,.36],[.037,.42],[.021,.476],[.004,.478]],{d:[0,1]},{bars:[.296,.334,.372],barx:.05}),
  P(null,[[.148,.295],[.157,.30],[.159,.34],[.150,.358]],{d:[.2,1]}),
  P('triceps',[[.104,.238],[.113,.25],[.122,.285],[.131,.325],[.134,.348],[.127,.348],[.118,.31],[.109,.275]],{d:[.25,1]}),
  P('biceps',[[.113,.232],[.128,.226],[.139,.252],[.150,.29],[.154,.32],[.151,.352],[.146,.372],[.139,.356],[.131,.33],[.123,.29],[.116,.26]],{d:[.28,1]},{pale:[.142,.330,.146,.368]}),
  P('pec',[[.010,.166],[.040,.162],[.076,.168],[.100,.195],[.118,.222],[.106,.236],[.090,.252],[.060,.264],[.030,.264],[.010,.252]],{c:[.122,.224]}),
  P('deltoid',[[.074,.162],[.098,.158],[.120,.161],[.132,.174],[.150,.205],[.155,.25],[.154,.276],[.144,.280],[.130,.250],[.113,.225],[.096,.198],[.082,.180]],{c:[.149,.292]}),
  P('flexors',[[.130,.360],[.147,.366],[.156,.392],[.165,.42],[.176,.45],[.187,.482],[.165,.484],[.152,.445],[.141,.41],[.129,.383]],{d:[.42,1]},{pale:[.156,.430,.174,.480]}),
  P('brachiorad',[[.153,.316],[.163,.324],[.172,.352],[.178,.385],[.185,.42],[.193,.452],[.198,.482],[.188,.482],[.177,.45],[.165,.42],[.156,.392],[.150,.36],[.150,.335]],{d:[.37,1]},{pale:[.176,.425,.190,.480]}),
  P(null,[[.045,.45],[.076,.44],[.070,.50],[.055,.525]],{d:[.5,1]}),
  P('gmed',[[.092,.398],[.106,.43],[.110,.466],[.098,.442]],{c:[.108,.48]}),
  P(null,[[.090,.418],[.106,.44],[.112,.50],[.102,.535],[.092,.50],[.085,.45]],{d:[.25,1]}),
  P('adductors',[[.014,.468],[.044,.478],[.060,.525],[.048,.575],[.036,.625],[.028,.668],[.018,.655],[.008,.58],[.002,.52]],{c:[.052,.70]}),
  P('vastlat',[[.097,.50],[.114,.515],[.112,.58],[.100,.66],[.090,.70],[.076,.716],[.072,.69],[.079,.62],[.084,.56],[.089,.52]],{d:[-.28,1]},{pale:[.080,.668,.075,.712]}),
  P('vastmed',[[.050,.572],[.050,.64],[.053,.695],[.048,.718],[.036,.716],[.026,.695],[.027,.66],[.038,.615]],{d:[.5,1]}),
  S('rectusfem',[[.079,.44],[.074,.50],[.067,.57],[.0615,.64],[.058,.70]],[.006,.017,.021,.013,.006],{pale:[.061,.645,.057,.70]}),
  S('sartorius',[[.094,.412],[.083,.465],[.062,.535],[.041,.60],[.028,.665],[.024,.715],[.030,.762]],[.005,.0095,.0095,.009,.008,.006,.003]),
  P(null,[[.038,.700],[.056,.694],[.074,.700],[.078,.735],[.066,.758],[.046,.758],[.034,.735]],null,{fascia:true}),
  P(null,[[.076,.755],[.092,.77],[.090,.82],[.080,.875],[.068,.93],[.060,.93],[.068,.87],[.076,.82],[.075,.79]],{d:[-.2,1]}),
  P('gastroc',[[.022,.750],[.033,.752],[.033,.80],[.031,.848],[.023,.846],[.015,.80]],{d:[.1,1]}),
  P('gastroc',[[.088,.772],[.096,.80],[.090,.842],[.081,.84],[.086,.80]],{d:[-.1,1]}),
  P('soleus',[[.023,.846],[.031,.848],[.036,.90],[.031,.914],[.023,.865]],{d:[.25,1]}),
  P('soleus',[[.081,.84],[.089,.842],[.078,.895],[.072,.907],[.076,.87]],{d:[-.3,1]}),
  S('tibant',[[.066,.750],[.069,.80],[.063,.855],[.052,.905],[.043,.945],[.038,.968]],[.008,.0125,.0095,.0045,.002,.002],{pale:[.057,.865,.043,.94]})
];
const BACK=[
  /* under the surface muscles */
  ...[.205,.225,.245,.265,.285,.305].map(y=>Object.assign(S(null,[[.026,y],[.06,y+.008],[.098,y+.03]],[.0028,.003,.0026]),{deep:true,boneLook:true})),
  P(null,[[.002,.098],[.024,.102],[.034,.128],[.030,.150],[.002,.152]],{d:[.6,1]},{deep:true}),
  P(null,[[.024,.118],[.036,.126],[.054,.178],[.046,.178]],{d:[.4,1]},{deep:true}),
  P(null,[[.050,.166],[.110,.156],[.120,.167],[.056,.182]],{d:[1,-.1]},{deep:true}),
  P(null,[[.012,.455],[.096,.482],[.104,.505],[.012,.505]],{d:[1,.12]},{deep:true}),
  P('rhomboids',[[.006,.150],[.006,.150],[.052,.183],[.052,.183],[.066,.238],[.066,.238],[.006,.212],[.006,.212]],{d:[1,.5]},{deep:true}),
  S('erector',[[.016,.150],[.016,.20],[.018,.27],[.020,.34],[.020,.40],[.012,.462]],[.004,.007,.012,.016,.017,.009],{deep:true}),
  P('gmed',[[.030,.408],[.070,.384],[.098,.398],[.108,.44],[.112,.480],[.094,.478],[.060,.458],[.036,.44]],{c:[.110,.49]},{deep:true}),
  P('soleus',[[.028,.775],[.080,.775],[.090,.825],[.070,.885],[.056,.918],[.045,.918],[.032,.88],[.020,.835]],{d:[0,1]},{deep:true,pale:[.05,.86,.05,.915]}),
  /* surface */
  P(null,[[.086,.76],[.094,.80],[.082,.87],[.070,.93],[.064,.93],[.074,.87],[.084,.82]],{d:[-.2,1]}),
  P('flexors',[[.130,.372],[.146,.372],[.147,.395],[.154,.425],[.168,.484],[.160,.480],[.145,.42]],{d:[.4,1]},{pale:[.150,.43,.163,.48]}),
  P('extensors',[[.148,.372],[.163,.358],[.171,.39],[.181,.43],[.190,.46],[.193,.484],[.167,.484],[.160,.45],[.153,.42],[.147,.39]],{d:[.4,1]},{pale:[.172,.44,.180,.482]}),
  P('brachiorad',[[.160,.332],[.170,.350],[.178,.385],[.187,.428],[.179,.428],[.168,.385],[.162,.360]],{d:[.3,1]}),
  P('infra',[[.044,.190],[.078,.184],[.104,.178],[.122,.196],[.114,.208],[.088,.225],[.066,.240],[.050,.218]],{c:[.126,.196]}),
  P(null,[[.068,.233],[.092,.218],[.114,.204],[.118,.212],[.095,.227],[.073,.240]],{d:[1,-.55]}),
  P('teres',[[.061,.235],[.075,.238],[.096,.225],[.118,.212],[.122,.226],[.099,.240],[.077,.252],[.063,.249]],{d:[1,-.52]}),
  P('triceps',[[.106,.238],[.118,.216],[.130,.25],[.143,.276],[.156,.298],[.163,.335],[.158,.364],[.141,.366],[.130,.345],[.120,.30]],{d:[.26,1]},{pale:[.149,.325,.147,.366]}),
  P('adductors',[[.002,.515],[.014,.535],[.024,.60],[.019,.635],[.009,.58]],{d:[.3,1]}),
  S('semimem',[[.024,.555],[.023,.61],[.027,.67],[.031,.738]],[.009,.013,.012,.005],{pale:[.026,.70,.031,.738]}),
  S('semiten',[[.040,.53],[.043,.60],[.042,.66],[.036,.72],[.029,.765]],[.012,.016,.010,.003,.002],{pale:[.039,.645,.034,.715]}),
  S('bicfem',[[.060,.525],[.070,.60],[.076,.66],[.080,.72],[.085,.758]],[.014,.021,.019,.009,.003],{pale:[.079,.68,.084,.75]}),
  P('vastlat',[[.090,.55],[.112,.575],[.103,.655],[.092,.70],[.089,.66]],{d:[-.25,1]}),
  /* surface-only layers, which lift away in the deep view */
  P('lats',[[.002,.232],[.04,.238],[.066,.248],[.092,.241],[.112,.232],[.110,.238],[.105,.25],[.104,.30],[.100,.35],[.096,.398],[.068,.402],[.034,.352],[.002,.302]],{c:[.122,.214]},{surf:true}),
  P(null,[[.002,.298],[.03,.345],[.068,.398],[.036,.424],[.012,.472],[.002,.495]],null,{surf:true,fascia:true}),
  S('erector',[[.018,.335],[.020,.38],[.018,.43],[.012,.464]],[.012,.015,.012,.006],{surf:true,thin:true}),
  P('trapezius',[[.002,.090],[.024,.098],[.034,.118],[.039,.142],[.068,.152],[.096,.157],[.122,.164],[.100,.172],[.070,.177],[.050,.186],[.030,.235],[.012,.29],[.002,.314]],{c:[.092,.174]},{surf:true}),
  P('gmed',[[.046,.405],[.072,.386],[.098,.398],[.113,.445],[.116,.488],[.092,.466],[.060,.448]],{c:[.110,.49]},{surf:true}),
  P('gmax',[[.003,.452],[.026,.422],[.058,.432],[.092,.452],[.114,.492],[.116,.527],[.102,.549],[.070,.558],[.036,.552],[.012,.530],[.002,.50]],{d:[1,.55]},{surf:true}),
  P('gastroc',[[.0485,.735],[.030,.742],[.016,.79],[.021,.835],[.033,.867],[.0485,.874],[.0505,.81]],{d:[.1,1]},{surf:true,pale:[.042,.83,.047,.874]}),
  P('gastroc',[[.0545,.735],[.080,.742],[.095,.79],[.085,.83],[.066,.859],[.0535,.874],[.0525,.81]],{d:[-.12,1]},{surf:true,pale:[.062,.825,.056,.874]}),
  P('soleus',[[.020,.836],[.034,.869],[.045,.877],[.045,.918],[.034,.892],[.023,.862]],{d:[.3,1]},{surf:true}),
  P('soleus',[[.086,.832],[.066,.861],[.057,.877],[.057,.918],[.070,.892],[.083,.86]],{d:[-.3,1]},{surf:true}),
  P('deltoid',[[.070,.186],[.096,.172],[.120,.162],[.132,.174],[.150,.205],[.155,.25],[.154,.276],[.144,.280],[.128,.25],[.116,.22],[.098,.200]],{c:[.149,.292]})
];
const BONES={
front:[
  S('b',[[.008,.164],[.04,.160],[.075,.159],[.114,.164]],[.0035,.004,.004,.0045]),
  P('b',[[.001,.166],[.009,.170],[.008,.25],[.001,.260]]),
  P('b',[[.047,.702],[.056,.700],[.066,.702],[.069,.716],[.063,.730],[.056,.734],[.049,.730],[.043,.716]]),
  P('b',[[.050,.730],[.062,.730],[.059,.754],[.053,.754]]),
  P('b',[[.037,.754],[.050,.754],[.051,.80],[.046,.86],[.041,.928],[.035,.928],[.035,.86],[.036,.80]]),
  P('b',[[.122,.355],[.132,.352],[.134,.366],[.125,.370]]),
  S('b',[[.158,.487],[.200,.479]],[.0035,.0035]),S('b',[[.024,.940],[.074,.940]],[.0045,.0045])],
back:[
  S('b',[[.050,.187],[.075,.178],[.100,.170],[.122,.164]],[.0018,.003,.004,.005]),
  P('b',[[.140,.362],[.154,.362],[.153,.378],[.144,.380]]),
  P('b',[[.044,.872],[.058,.872],[.054,.945],[.046,.945]]),
  S('b',[[.158,.487],[.200,.479]],[.0035,.0035]),S('b',[[.024,.940],[.074,.940]],[.0045,.0045])]};
function pieces(view,deep){return (view==='front'?FRONT:BACK).filter(p=>deep?!p.surf:!p.deep);}
const inPoly=(poly,x,y)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
function hitAt(view,deep,nx,ny){const L=pieces(view,deep),ax=Math.abs(nx);for(let i=L.length-1;i>=0;i--){const p=L[i];if(p.fascia)continue;if(inPoly(p.poly,ax,ny)){if(p.m)return p.m;return null;}}return null;}
function onView(id,view,deep){return pieces(view,deep).some(p=>p.m===id);}
function trace(ctx,poly,sx,f){ctx.beginPath();poly.forEach((q,i)=>{const X=f.cx+sx*q[0]*f.h,Y=f.top+q[1]*f.h;i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.closePath();}
function paint(ctx,p,f,col,opt){opt=opt||{};const lw=Math.max(.5,f.h/1100);[1,-1].forEach(sx=>{ctx.save();trace(ctx,p.poly,sx,f);
    ctx.fillStyle=col;ctx.globalAlpha=p.thin?.62:1;ctx.fill();ctx.globalAlpha=1;ctx.save();trace(ctx,p.poly,sx,f);ctx.clip();
    if(!p.fascia&&p.bb){const mx=f.cx+sx*(p.bb[0]+p.bb[2])/2*f.h,my=f.top+(p.bb[1]+p.bb[3])/2*f.h,R=Math.max(p.bb[2]-p.bb[0],p.bb[3]-p.bb[1])*f.h*.62;const g=ctx.createRadialGradient(mx,my,0,mx,my,R);g.addColorStop(0,'rgba(255,235,215,.24)');g.addColorStop(.6,'rgba(255,235,215,0)');g.addColorStop(1,'rgba(40,10,5,.24)');ctx.fillStyle=g;ctx.fillRect(mx-R-2,my-R-2,2*R+4,2*R+4);}
    ctx.strokeStyle=opt.fiber||'rgba(60,14,10,.42)';ctx.lineWidth=lw*.8;ctx.beginPath();p.lines.forEach(l=>{ctx.moveTo(f.cx+sx*l[0]*f.h,f.top+l[1]*f.h);ctx.lineTo(f.cx+sx*l[2]*f.h,f.top+l[3]*f.h);});ctx.stroke();
    if(p.pale){const x1=f.cx+sx*p.pale[0]*f.h,y1=f.top+p.pale[1]*f.h,x2=f.cx+sx*p.pale[2]*f.h,y2=f.top+p.pale[3]*f.h,g=ctx.createLinearGradient(x1,y1,x2,y2),cc=opt.pale||'233,223,204';g.addColorStop(0,'rgba('+cc+',0)');g.addColorStop(1,'rgba('+cc+',.92)');ctx.fillStyle=g;ctx.fillRect(f.cx-f.h,f.top,2*f.h,f.h*1.05);}
    if(p.bars){ctx.strokeStyle='rgba(233,223,204,.92)';ctx.lineWidth=Math.max(1,f.h*.0028);p.bars.forEach(y=>{ctx.beginPath();ctx.moveTo(f.cx,f.top+y*f.h);ctx.lineTo(f.cx+sx*p.barx*f.h,f.top+(y-.003)*f.h);ctx.stroke();});}
    ctx.restore();
    trace(ctx,p.poly,sx,f);ctx.strokeStyle=opt.edge||'#3d1815';ctx.lineWidth=lw;ctx.stroke();ctx.restore();});}
function paintBone(ctx,p,f){[1,-1].forEach(sx=>{trace(ctx,p.poly,sx,f);ctx.fillStyle=BONE;ctx.fill();ctx.strokeStyle='#8b7a64';ctx.lineWidth=Math.max(.5,f.h/1400);ctx.stroke();});}
const TONE_OF=id=>{const i=ORDER.indexOf(id);return TONE[i<0?0:i%TONE.length];};
function drawBody(ctx,f,deep){const o={cx:f.cx,top:f.top,h:f.h};
  BioLab.body.draw(ctx,Object.assign({},o,{view:f.view,marks:f.view==='front',fill:PAL['card2'],stroke:PAL['cv-soft'],lw:1.6}));
  ctx.save();BioLab.body.path(ctx,o);ctx.clip();
  /* deep tissue under the muscles; head, hands and feet stay plain */
  ctx.fillStyle=DEEPC;ctx.fillRect(f.cx-.25*f.h,f.top+.112*f.h,.5*f.h,(.484-.112)*f.h);ctx.fillRect(f.cx-.125*f.h,f.top+.484*f.h,.25*f.h,(.945-.484)*f.h);
  if(f.view==='back'){ctx.fillStyle=PAL['card2'];ctx.fillRect(f.cx-.08*f.h,f.top,.16*f.h,.112*f.h);}
  pieces(f.view,deep).forEach(p=>{if(p.boneLook){paintBone(ctx,p,f);return;}if(p.fascia){[1,-1].forEach(sx=>{trace(ctx,p.poly,sx,f);ctx.fillStyle='#c9baa2';ctx.fill();});return;}paint(ctx,p,f,p.m?TONE_OF(p.m):MUTED);});
  (BONES[f.view]||[]).forEach(p=>paintBone(ctx,p,f));
  /* the midline */
  ctx.strokeStyle='rgba(30,10,8,.75)';ctx.lineWidth=Math.max(.8,f.h/800);ctx.beginPath();
  if(f.view==='back'){ctx.moveTo(f.cx,f.top+.145*f.h);ctx.lineTo(f.cx,f.top+.31*f.h);ctx.moveTo(f.cx,f.top+.45*f.h);ctx.lineTo(f.cx,f.top+.52*f.h);}
  else{const x=f.cx,y=f.top+.335*f.h;ctx.moveTo(x-.004*f.h,y);ctx.lineTo(x+.004*f.h,y);}ctx.stroke();
  ctx.restore();
  BioLab.body.path(ctx,o);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.6;ctx.stroke();}
function highlight(ctx,f,id,deep,col){ctx.save();BioLab.body.path(ctx,f);ctx.clip();pieces(f.view,deep).forEach(p=>{if(p.m===id)paint(ctx,p,f,col||HI,{fiber:'rgba(90,50,0,.5)',edge:'#3a2500',pale:'255,244,214'});});
  (BONES[f.view]||[]).forEach(p=>paintBone(ctx,p,f));ctx.restore();}
/* label anchors: where each leader line lands, and which margin it comes from. x is signed on the viewer's side (negative = left of the screen). */
const ANCHOR={front:{masseter:[-.041,.083],scm:[.018,.135],trapezius:[-.068,.158],deltoid:[-.125,.205],pec:[.062,.215],biceps:[-.135,.30],triceps:[.118,.285],brachiorad:[-.170,.385],flexors:[.150,.40],serratus:[.084,.268],rectusabd:[.026,.325],extoblique:[-.074,.36],lats:[.0975,.275],gmed:[-.100,.432],adductors:[.030,.56],sartorius:[.062,.535],rectusfem:[.066,.60],vastlat:[-.094,.61],vastmed:[.043,.685],tibant:[-.066,.81],gastroc:[.024,.80],soleus:[-.082,.87]},
  back:{trapezius:[-.040,.17],deltoid:[-.128,.215],infra:[-.088,.205],teres:[-.090,.232],triceps:[-.142,.31],rhomboids:[.040,.195],lats:[-.070,.31],erector:[.019,.385],extensors:[-.170,.43],flexors:[.150,.43],brachiorad:[-.172,.385],gmed:[.078,.42],gmax:[-.066,.49],adductors:[.0125,.558],vastlat:[-.098,.62],bicfem:[-.070,.62],semiten:[.040,.62],semimem:[.024,.665],gastroc:[-.068,.80],soleus:[.038,.90]}};
/* ---------- layout ---------- */
const LH=720;
function layout(sim){const v=sim.p.view,z=sim.p.zoom;
  if(v==='both')return {figs:[{view:'front',cx:205,top:36,h:668},{view:'back',cx:595,top:36,h:668}],both:true};
  if(z==='upper')return {figs:[{view:v,cx:400,top:12,h:1180}],zoom:true};
  if(z==='lower')return {figs:[{view:v,cx:400,top:-.44*1240+8,h:1240}],zoom:true};
  return {figs:[{view:v,cx:400,top:16,h:690}]};}
function artCache(sim,ctx,L,deep){const w=ctx.canvas.width,hh=ctx.canvas.height,key=[sim.p.view,sim.p.zoom,deep,w,hh,PAL['cv-bg'],PAL['card2']].join('|');const v=sim.vis||(sim.vis={});
  if(v.key!==key||!v.art){const c=document.createElement('canvas');c.width=w;c.height=hh;const x=c.getContext('2d'),sc=w/800;x.setTransform(sc,0,0,sc,0,0);L.figs.forEach(f=>drawBody(x,f,deep));v.art=c;v.key=key;}return v.art;}
function cached(sim,ctx,slot,key,fn){const w=ctx.canvas.width,hh=ctx.canvas.height,v=sim.vis||(sim.vis={}),full=[key,w,hh,PAL['cv-bg'],PAL['card2']].join('|');if(!v[slot]||v[slot+'K']!==full){const c=document.createElement('canvas');c.width=w;c.height=hh;const x=c.getContext('2d'),sc=w/800;x.setTransform(sc,0,0,sc,0,0);fn(x);v[slot]=c;v[slot+'K']=full;}ctx.drawImage(v[slot],0,0,800,LH);}
function wrap(ctx,s,x,y,w,lh,o){o=o||{};ctx.font=(o.w||400)+' '+(o.s||13)+'px '+FONT;const words=String(s).split(' ');let line='',yy=y;words.forEach(wd=>{const t=line?line+' '+wd:wd;if(ctx.measureText(t).width>w&&line){txt(ctx,line,x,yy,o);yy+=lh;line=wd;}else line=t;});if(line){txt(ctx,line,x,yy,o);yy+=lh;}return yy;}

/* ---------- practice ---------- */
const lev=(a,b)=>{const m=a.length,n=b.length,d=Array.from({length:m+1},(_,i)=>[i]);for(let j=1;j<=n;j++)d[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n];};
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z ]/g,'').replace(/\s+/g,' ').trim();
function checkTyped(s,id){const t=norm(s);if(!t)return {ok:false,msg:'Type a name first.',empty:true};const want=norm(M[id].n);if(lev(t,want)<=Math.max(1,Math.floor(want.length/7)))return {ok:true,exact:t===want};
  const sl=SLANG[t.replace(/ /g,'')];if(sl===id)return {ok:false,close:true,msg:'That is the everyday name. Your quiz wants the full anatomical name.'};if(want.indexOf(t)>=0&&t.length>=4)return {ok:false,close:true,msg:'You have part of it. Your quiz wants the full name.'};
  const other=ORDER.find(o=>o!==id&&lev(t,norm(M[o].n))<=2);return {ok:false,msg:other?'That spells '+M[other].n+', which is a different muscle.':'Not that one.'};}
const SCOPES={all:ORDER,upper:['masseter','scm','trapezius','deltoid','pec','biceps','triceps','brachiorad','flexors','extensors','serratus','infra','teres','rhomboids','lats'],trunk:['pec','serratus','rectusabd','extoblique','lats','trapezius','rhomboids','erector'],lower:['gmax','gmed','adductors','sartorius','rectusfem','vastlat','vastmed','bicfem','semiten','semimem','gastroc','soleus','tibant']};
const viewFor=(id,cur)=>onAny(id,cur)?cur:(cur==='front'?'back':'front');
function onAny(id,v){return onView(id,v,false)||onView(id,v,true);}
function newQ(sim){const s=sim.st,pool=SCOPES[sim.p.scope]||ORDER;let id;if(s.redo.length&&Math.random()<.5)id=s.redo.shift();else{if(!s.bag.length||s.bagScope!==sim.p.scope){s.bag=pool.slice().sort(()=>Math.random()-.5);s.bagScope=sim.p.scope;}id=s.bag.pop();}
  if(id===s.qid&&pool.length>1){id=pool[(pool.indexOf(id)+1)%pool.length];}
  s.qid=id;s.qans=null;s.qmsg='';s.tries=0;s.picked=null;s.typed='';zoomFor(sim,id);
  const v=M[id].deep===true?'back':null,cv=sim.p.view;if(cv!=='both'&&!onAny(id,cv))BioLab.setValues(sim,{view:cv==='front'?'back':'front'});else if(v&&cv==='front')BioLab.setValues(sim,{view:'back'});
  const needDeep=!onView(id,'front',false)&&!onView(id,'back',false);if(needDeep!==!!sim.p.deep)BioLab.setValues(sim,{deep:needDeep});
  const curV=sim.p.view==='both'?(onView(id,'front',sim.p.deep)?'front':'back'):sim.p.view;
  const others=ORDER.filter(o=>o!==id&&ANCHOR[curV][o]&&onView(o,curV,sim.p.deep)).sort(()=>Math.random()-.5);
  const near=others.filter(o=>M[o].r===M[id].r),far=others.filter(o=>M[o].r!==M[id].r),n=atLeast('ap')?6:atLeast('honors')?5:4,opts=near.concat(far).slice(0,n-1).concat([id]).sort(()=>Math.random()-.5);
  s.opts=opts;s.spots=opts.slice(0,4);if(s.spots.indexOf(id)<0)s.spots[0]=id;s.spots.sort(()=>Math.random()-.5);s.spotView=curV;sim.infoDirty=true;}
function grade(sim,id){const s=sim.st;if(s.qans)return;s.tries++;s.picked=id;if(id===s.qid){s.qans='right';if(s.tries===1)s.right++;s.done++;s.qmsg='';}
  else if(s.tries>=2){s.qans='shown';s.done++;s.redo.push(s.qid);s.qmsg='';}else s.qmsg='That is '+M[id].n+'. Try once more.';sim.infoDirty=true;}
function gradeTyped(sim,txtv){const s=sim.st;if(s.qans)return;s.typed=txtv;const r=checkTyped(txtv,s.qid);if(r.empty){s.qmsg=r.msg;sim.infoDirty=true;return;}
  if(r.ok){s.tries++;s.qans='right';if(s.tries===1)s.right++;s.done++;s.qmsg=r.exact?'':'Close enough on the spelling.';}
  else if(r.close){s.qmsg=r.msg;}else{s.tries++;if(s.tries>=2){s.qans='shown';s.done++;s.redo.push(s.qid);s.qmsg='';}else s.qmsg=r.msg+' Try once more.';}sim.infoDirty=true;}

/* ---------- name decoder ---------- */
const ROOTS=[
 {id:'rectus',g:'Direction of fibers',w:'rectus',m:'straight',d:'Fibers run straight, parallel to the midline of the body.',ex:['rectusabd','rectusfem'],dr:'dir',a:0},
 {id:'transverse',g:'Direction of fibers',w:'transverse',m:'across',d:'Fibers run straight across the body, at a right angle to the midline. Transversus Abdominis is the example. It lies under the External Oblique, so it does not show on this chart.',ex:[],dr:'dir',a:90},
 {id:'oblique',g:'Direction of fibers',w:'oblique',m:'slanted',d:'Fibers run at a slant to the midline.',ex:['extoblique'],dr:'dir',a:35},
 {id:'maximus',g:'Size',w:'maximus',m:'largest',d:'The largest in a group of muscles with the same first name.',ex:['gmax'],dr:'size',a:2},
 {id:'medius',g:'Size',w:'medius',m:'middle-sized',d:'The middle-sized one in the group.',ex:['gmed'],dr:'size',a:1},
 {id:'minimus',g:'Size',w:'minimus',m:'smallest',d:'The smallest in the group. Gluteus Minimus sits under the Gluteus Medius, so it does not show on this chart.',ex:[],dr:'size',a:0},
 {id:'longus',g:'Length',w:'longus',m:'long',d:'The longer one of a pair. Adductor Longus is part of the Adductors.',ex:['adductors'],dr:'len',a:1},
 {id:'brevis',g:'Length',w:'brevis',m:'short',d:'The shorter one of a pair. Adductor Brevis is part of the Adductors.',ex:['adductors'],dr:'len',a:0},
 {id:'biceps',g:'Number of heads',w:'biceps',m:'two heads',d:'The muscle starts at two places (origins) and joins into one belly.',ex:['biceps','bicfem'],dr:'heads',a:2},
 {id:'triceps',g:'Number of heads',w:'triceps',m:'three heads',d:'The muscle starts at three places and joins into one belly.',ex:['triceps'],dr:'heads',a:3},
 {id:'deltoid',g:'Shape',w:'deltoid',m:'triangle',d:'Shaped like the Greek letter delta (Δ).',ex:['deltoid'],dr:'shape',a:'tri'},
 {id:'trapezius',v:'back',g:'Shape',w:'trapezius',m:'trapezoid',d:'The left and right muscles together make a trapezoid.',ex:['trapezius'],dr:'shape',a:'trap'},
 {id:'serratus',g:'Shape',w:'serratus',m:'saw-toothed',d:'The edge has teeth like a saw, where the muscle reaches the ribs.',ex:['serratus'],dr:'shape',a:'saw'},
 {id:'teres',g:'Shape',w:'teres',m:'round',d:'Long and round in cross-section, like a cord.',ex:['teres'],dr:'shape',a:'round'}];
const rootOf=sim=>ROOTS.find(r=>r.id===sim.p.root)||ROOTS[0];
function chipBoxes(k){const out=[],cols=3,w=156,x0=292,gap=6,h=Math.round(20*k+10);ROOTS.forEach((r,i)=>{const c=i%cols,ro=Math.floor(i/cols);out.push({r,x:x0+c*(w+gap),y:14+ro*(h+gap),w,h});});return out;}
function drawDecoder(sim,ctx,k){const v=sim.vis||(sim.vis={}),r=rootOf(sim);ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,LH);
  const views=[...new Set(r.ex.map(e=>r.v||(onView(e,'front',false)?'front':'back')))];if(!views.length)views.push(r.dr==='size'?'back':'front');
  const figs=views.length>1?[{view:views[0],cx:140,top:28,h:320},{view:views[1],cx:140,top:372,h:320}]:[{view:views[0],cx:140,top:30,h:620}];
  cached(sim,ctx,'dec',views.join(),x=>figs.forEach(f=>drawBody(x,f,false)));
  figs.forEach(f=>{r.ex.forEach(e=>highlight(ctx,f,e,false));txt(ctx,f.view==='front'?'Front':'Back',figs.length>1?28:140,f.top+(figs.length>1?14:f.h+22),{s:12*k,c:PAL['cv-soft'],a:figs.length>1?'left':'center'});});
  const B=chipBoxes(k);v.chips=B;B.forEach(b=>{const on=b.r.id===r.id;rr(ctx,b.x,b.y,b.w,b.h,7);ctx.fillStyle=on?'#8f1d2c':PAL['card2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();txt(ctx,b.r.w,b.x+b.w/2,b.y+b.h/2,{s:13*k,w:on?700:500,c:on?'#fff':PAL['cv-ink'],a:'center',b:'middle'});});
  const last=B[B.length-1],y0=last.y+last.h+18*k+14;
  txt(ctx,r.g,292,y0,{s:12.5*k,c:PAL['cv-soft']});txt(ctx,r.w+' = '+r.m,292,y0+26*k,{s:21*k,w:700});
  const y1=wrap(ctx,r.d,292,y0+50*k,490,17*k,{s:13.5*k,c:PAL['cv-ink']});
  const exs=r.ex.map(e=>M[e].n);let y2=y1;if(exs.length)y2=wrap(ctx,'On this chart: '+exs.join(', ')+'.',292,y1+2,490,17*k,{s:13.5*k,w:600,c:PAL['cv-ink']});
  const dh=LH-y2-16;if(dh>70)drawRootPic(ctx,r,292+245,y2+dh/2,Math.min(dh*.9,220),k);}
function drawRootPic(ctx,r,cx,cy,sz,k){const c='#b4534a',e='#3d1815';ctx.save();ctx.lineWidth=2;
  const band=(x,y,w,h,ang,lines)=>{ctx.save();ctx.translate(x,y);ctx.rotate(ang);rr(ctx,-w/2,-h/2,w,h,Math.min(w,h)*.3);ctx.fillStyle=c;ctx.fill();ctx.strokeStyle=e;ctx.lineWidth=1.3;ctx.stroke();ctx.strokeStyle='rgba(60,14,10,.5)';ctx.lineWidth=1;for(let i=1;i<lines;i++){const q=-w/2+w*i/lines;ctx.beginPath();ctx.moveTo(q,-h/2+4);ctx.lineTo(q,h/2-4);ctx.stroke();}ctx.restore();};
  if(r.dr==='dir'){const s=sz*.85;ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(cx,cy-s/2);ctx.lineTo(cx,cy+s/2);ctx.stroke();ctx.setLineDash([]);band(cx+s*.42,cy,s*.46,s*.7,r.a*Math.PI/180,6);txt(ctx,'midline',cx-8,cy-s/2+12*k,{s:12*k,c:PAL['cv-soft'],a:'right'});}
  else if(r.dr==='size'){const hs=[.35,.6,.95],x=[-.42,0,.42];hs.forEach((q,i)=>{ctx.globalAlpha=i===r.a?1:.35;band(cx+x[i]*sz,cy+sz*.45-sz*q*.45,sz*.3,sz*q*.9,0,5);});ctx.globalAlpha=1;}
  else if(r.dr==='len'){const w=[.45,.95];[0,1].forEach(i=>{ctx.globalAlpha=i===r.a?1:.35;band(cx-sz*.25+(i?sz*.25:0)-(i?0:0),cy+(i?1:-1)*sz*.16,sz*w[i],sz*.22,0,5);});ctx.globalAlpha=1;}
  else if(r.dr==='heads'){const n=r.a,topY=cy-sz*.42,mY=cy-sz*.02;ctx.fillStyle=c;ctx.strokeStyle=e;ctx.lineWidth=1.3;for(let i=0;i<n;i++){const hx=cx+(i-(n-1)/2)*sz*.26;ctx.beginPath();ctx.moveTo(hx-7,topY);ctx.lineTo(hx+7,topY);ctx.lineTo(cx+sz*.07,mY);ctx.lineTo(cx-sz*.07,mY);ctx.closePath();ctx.fill();ctx.stroke();}
    ctx.beginPath();ctx.ellipse(cx,mY+sz*.14,sz*.14,sz*.2,0,0,6.3);ctx.fill();ctx.stroke();ctx.fillStyle=BONE;ctx.strokeStyle='#8b7a64';ctx.fillRect(cx-3,mY+sz*.32,6,sz*.13);ctx.strokeRect(cx-3,mY+sz*.32,6,sz*.13);}
  else{const s=sz*.8;ctx.fillStyle=c;ctx.strokeStyle=e;ctx.lineWidth=1.5;ctx.beginPath();
    if(r.a==='tri'){ctx.moveTo(cx-s*.5,cy-s*.42);ctx.lineTo(cx+s*.5,cy-s*.42);ctx.lineTo(cx,cy+s*.48);}
    else if(r.a==='trap'){ctx.moveTo(cx-s*.28,cy-s*.4);ctx.lineTo(cx+s*.28,cy-s*.4);ctx.lineTo(cx+s*.55,cy+s*.4);ctx.lineTo(cx-s*.55,cy+s*.4);}
    else if(r.a==='saw'){ctx.moveTo(cx-s*.55,cy-s*.3);ctx.lineTo(cx-s*.05,cy-s*.3);for(let i=0;i<5;i++){const y=cy-s*.3+i*s*.13;ctx.lineTo(cx+s*.5,y+s*.065);ctx.lineTo(cx-s*.05,y+s*.13);}ctx.lineTo(cx-s*.55,cy+s*.35);}
    else{ctx.moveTo(cx-s*.55,cy-s*.1);ctx.lineTo(cx+s*.45,cy-s*.1);ctx.ellipse(cx+s*.45,cy,s*.07,s*.1,0,-1.57,1.57);ctx.lineTo(cx-s*.55,cy+s*.1);}
    ctx.closePath();ctx.fill();ctx.stroke();if(r.a==='round'){ctx.beginPath();ctx.ellipse(cx-s*.55,cy,s*.07,s*.1,0,0,6.3);ctx.fillStyle='#c76a5f';ctx.fill();ctx.stroke();}}
  ctx.restore();}

/* ---------- three muscle types ---------- */
const TYPES=[{id:'skeletal',n:'Skeletal muscle',a:'Long, striped (striated) fibers. Many nuclei, pushed to the edge of each fiber.',c:'Voluntary',f:'Moves bones, holds posture and makes heat.',w:'Every muscle on the chart'},
 {id:'cardiac',n:'Cardiac muscle',a:'Short, branched, striated cells joined at intercalated discs. Usually one central nucleus.',c:'Involuntary',f:'Pumps blood. It sets its own rhythm.',w:'Wall of the heart only'},
 {id:'smooth',n:'Smooth muscle',a:'Spindle-shaped cells with no stripes. One central nucleus.',c:'Involuntary',f:'Moves food, narrows blood vessels and airways, and empties the bladder.',w:'Walls of hollow organs and blood vessels'}];
function tissue(ctx,id,x,y,w,h){ctx.save();rr(ctx,x,y,w,h,8);ctx.clip();ctx.fillStyle='#efdcd8';ctx.fillRect(x,y,w,h);const nuc='#3f3a78';
  if(id==='skeletal'){const n=4,fh=h/n;for(let i=0;i<n;i++){const fy=y+i*fh;ctx.fillStyle=i%2?'#c9707e':'#c26573';ctx.fillRect(x,fy+2,w,fh-4);ctx.strokeStyle='rgba(90,20,40,.55)';ctx.lineWidth=1.6;for(let q=x+((i*3)%6);q<x+w;q+=6){ctx.beginPath();ctx.moveTo(q,fy+3);ctx.lineTo(q,fy+fh-3);ctx.stroke();}
      ctx.fillStyle=nuc;[.14,.42,.7,.92].forEach((t,j)=>{ctx.beginPath();ctx.ellipse(x+w*((t+i*.13)%1),fy+((i+j)%2?5:fh-5),11,3.2,0,0,6.3);ctx.fill();});}}
  else if(id==='cardiac'){ctx.lineCap='butt';
    const seg=(a,b,c,d,t)=>{ctx.setLineDash([]);ctx.strokeStyle='#c26573';ctx.lineWidth=t;ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke();ctx.strokeStyle='rgba(90,20,40,.5)';ctx.setLineDash([1.4,4.6]);ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke();ctx.setLineDash([]);};
    [[.2,-5],[.55,0],[.87,5]].forEach(f=>seg(x-10,y+h*f[0]-f[1],x+w+10,y+h*f[0]+f[1],h*.2));
    seg(x+w*.24,y+h*.2,x+w*.42,y+h*.55,h*.15);seg(x+w*.62,y+h*.55,x+w*.8,y+h*.87,h*.15);seg(x+w*.08,y+h*.87,x+w*.2,y+h*.55,h*.15);seg(x+w*.78,y+h*.2,x+w*.92,y+h*.55,h*.15);
    ctx.strokeStyle='#4b1320';ctx.lineWidth=3.5;[[.32,.2],[.68,.2],[.5,.56],[.92,.55],[.34,.86],[.7,.87]].forEach(q=>{const X=x+w*q[0],Y=y+h*q[1],H=h*.095;ctx.beginPath();ctx.moveTo(X,Y-H);ctx.lineTo(X+4,Y-H*.4);ctx.lineTo(X-3,Y+H*.2);ctx.lineTo(X+3,Y+H);ctx.stroke();});
    ctx.fillStyle=nuc;[[.15,.2],[.5,.2],[.3,.56],[.72,.56],[.52,.87],[.85,.87]].forEach(q=>{ctx.beginPath();ctx.ellipse(x+w*q[0],y+h*q[1],10,6,0,0,6.3);ctx.fill();});}
  else{const rows=4;for(let i=0;i<rows;i++){for(let j=-1;j<4;j++){const cx=x+w*(j+.5+(i%2)*.5)/3,cy=y+h*(i+.5)/rows,hw=w/3*.62,hh=h/rows*.62;ctx.beginPath();ctx.moveTo(cx-hw,cy);ctx.quadraticCurveTo(cx,cy-hh*1.5,cx+hw,cy);ctx.quadraticCurveTo(cx,cy+hh*1.5,cx-hw,cy);ctx.closePath();ctx.fillStyle=(i+j)%2?'#d27f8b':'#c8707d';ctx.fill();ctx.strokeStyle='rgba(90,20,40,.45)';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle=nuc;ctx.beginPath();ctx.ellipse(cx,cy,w*.04,4,0,0,6.3);ctx.fill();}}}
  ctx.restore();rr(ctx,x,y,w,h,8);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}
function drawTypes(sim,ctx,k){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,LH);const rh=(LH-16)/3,v=sim.vis;v.rows=[];
  TYPES.forEach((t,i)=>{const y=8+i*rh,on=sim.p.mtype===t.id;v.rows.push({id:t.id,y,h:rh});rr(ctx,8,y,784,rh-8,10);ctx.fillStyle=on?PAL['card2']:PAL['card'];ctx.fill();ctx.strokeStyle=on?'#c7334a':PAL['line'];ctx.lineWidth=on?2.5:1;ctx.stroke();
    tissue(ctx,t.id,20,y+12,270,rh-32);
    let yy=y+14+15*k;txt(ctx,t.n,306,yy,{s:16*k,w:700});yy+=19*k;
    yy=wrap(ctx,t.a,306,yy,474,15.5*k,{s:12.5*k});yy=wrap(ctx,t.c+'. '+t.f,306,yy+1,474,15.5*k,{s:12.5*k,w:600,c:PAL['cv-ink']});if(k<1.5)wrap(ctx,'Where: '+t.w+'.',306,yy+1,474,15.5*k,{s:12.5*k,c:PAL['cv-soft']});});}

/* ---------- how a muscle pulls: origin, insertion, tendon, flexor, extensor ---------- */
function pullGeom(deg){const E={x:330,y:400},a=deg*Math.PI/180,d={x:Math.sin(a),y:Math.cos(a)},fore={x:E.x+d.x*235,y:E.y+d.y*235},ins={x:E.x+d.x*60+d.y*-0,y:E.y+d.y*60},ol={x:E.x-d.x*30,y:E.y-d.y*30},S={x:330,y:90};
  const bicO={x:S.x+18,y:S.y+6},triO={x:S.x-22,y:S.y+42},bl=Math.hypot(ins.x-bicO.x,ins.y-bicO.y),tl=Math.hypot(ol.x-triO.x,ol.y-triO.y);return {E,S,d,fore,ins,ol,bicO,triO,bl,tl};}
function belly(ctx,a,b,bow,fat,col,t0,t1){const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy),nx=-dy/L,ny=dx/L;const p=q=>({x:a.x+dx*q,y:a.y+dy*q});const A=p(t0),B=p(t1);
  ctx.strokeStyle=BONE;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(A.x,A.y);ctx.moveTo(B.x,B.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  const mx=(A.x+B.x)/2+nx*bow,my=(A.y+B.y)/2+ny*bow;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.quadraticCurveTo(mx+nx*fat,my+ny*fat,B.x,B.y);ctx.quadraticCurveTo(mx-nx*fat,my-ny*fat,A.x,A.y);ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.strokeStyle='#3d1815';ctx.lineWidth=1.3;ctx.stroke();return {x:mx,y:my};}
function bone(ctx,a,b,w){ctx.strokeStyle='#8b7a64';ctx.lineWidth=w+2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle=BONE;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function drawPull(sim,ctx,vdt,k){const s=sim.st,v=sim.vis;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,LH);
  if(s.pullTo!==null&&s.pullTo!==undefined&&vdt>0){const d=s.pullTo-sim.p.elbow,st=Math.sign(d)*Math.min(Math.abs(d),(RM?1000:70)*vdt);if(Math.abs(d)<.5)s.pullTo=null;else{sim.p.elbow+=st;if(sim.ui&&sim.ui.ctl&&sim.ui.ctl.elbow)sim.ui.ctl.elbow.set(Math.round(sim.p.elbow));sim.infoDirty=true;}}
  const deg=sim.p.elbow,g=pullGeom(deg),moving=s.pullTo!==null&&s.pullTo!==undefined,dirn=moving?Math.sign(s.pullTo-deg):0,bActive=dirn>0,tActive=dirn<0,G0=pullGeom(0),G1=pullGeom(145);
  bone(ctx,{x:g.S.x-48,y:g.S.y+18},{x:g.S.x+22,y:g.S.y-4},22);bone(ctx,g.S,g.E,18);
  ctx.fillStyle=BONE;ctx.strokeStyle='#8b7a64';ctx.lineWidth=1;ctx.beginPath();ctx.arc(g.S.x,g.S.y,17,0,6.3);ctx.fill();ctx.stroke();
  const sh=(g.bl-G1.bl)/(G0.bl-G1.bl),st=(g.tl-G1.tl)/(G0.tl-G1.tl);
  const tb=belly(ctx,g.triO,g.ol,-14,20+(1-st)*12,tActive?HI:'#a84b45',.1,.8);
  const bb=belly(ctx,g.bicO,g.ins,12,20+(1-sh)*26,bActive?HI:'#b4534a',.12,.78);
  bone(ctx,g.E,g.fore,14);bone(ctx,g.E,g.ol,16);
  ctx.fillStyle=PAL['card2'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.4;ctx.save();ctx.translate(g.fore.x,g.fore.y);ctx.rotate(Math.atan2(g.d.y,g.d.x));rr(ctx,0,-16,40,32,10);ctx.fill();ctx.stroke();ctx.restore();
  ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(g.E.x,g.E.y,5,0,6.3);ctx.fill();
  const hot=(p,col)=>{ctx.fillStyle=col;ctx.strokeStyle=PAL['cv-bg'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,7,0,6.3);ctx.fill();ctx.stroke();};hot(g.bicO,PAL['s2']);hot(g.triO,PAL['s2']);hot(g.ins,PAL['s4']);hot(g.ol,PAL['s4']);
  /* callouts: fixed margin columns so they never sit on the moving arm */
  const lab=(t,sub,x,y,ax,ay,a)=>{ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();const lx=a==='right'?x+6:x-6;ctx.moveTo(lx,y-4*k);ctx.lineTo(ax,ay);ctx.stroke();txt(ctx,t,x,y,{s:13.5*k,w:700,a:a==='right'?'right':'left'});if(sub)txt(ctx,sub,x,y+15*k,{s:12*k,c:PAL['cv-soft'],a:a==='right'?'right':'left'});};
  const sm=k>1.4,c=q=>60+q*46*k;
  lab('Origin','fixed bone',500,c(0),g.bicO.x,g.bicO.y,'left');
  lab('Tendon','muscle to bone',500,c(1),g.bicO.x+((g.ins.x-g.bicO.x)*.06),g.bicO.y+((g.ins.y-g.bicO.y)*.06),'left');
  lab('Biceps Brachii',sm?'flexor':'flexor: closes the joint',500,c(2)+(sm?0:30),bb.x,bb.y,'left');
  lab('Origin','fixed bone',230,100,g.triO.x,g.triO.y,'right');
  lab('Triceps Brachii',sm?'extensor':'extensor: opens the joint',230,100+66*k,tb.x,tb.y,'right');
  lab('Insertion','moving bone',230,LH-110,g.ol.x,g.ol.y,'right');
  lab('Insertion','moving bone',500,LH-190,g.ins.x,g.ins.y,'left');
  txt(ctx,'Elbow angle: '+Math.round(180-deg)+'°',500,LH-70,{s:16*k,w:700});txt(ctx,'Flexion: '+Math.round(deg)+'°',500,LH-70+19*k,{s:13*k,c:PAL['cv-soft']});
  txt(ctx,bActive?'Biceps Brachii shortens. Triceps Brachii relaxes.':tActive?'Triceps Brachii shortens. Biceps Brachii relaxes.':'',30,24,{s:13.5*k,w:600});
  v._g=g;}

/* ---------- drawing the chart ---------- */
function labelsFor(sim,L,k){const v=sim.vis,f=L.figs[0],deep=sim.p.deep,A=ANCHOR[f.view],items=[];
  const fs=12.5*k,lh=fs*1.32;
  Object.keys(A).forEach(id=>{if(!onView(id,f.view,deep))return;const q=A[id],ay=f.top+q[1]*f.h,ax=f.cx+q[0]*f.h;if(ay<8||ay>LH-8)return;items.push({id,ax,ay,side:q[0]<0?-1:1});});
  const figW=(L.zoom?(.235*f.h):.235*f.h),out=[];
  [-1,1].forEach(side=>{const col=items.filter(i=>i.side===side).sort((a,b)=>a.ay-b.ay);if(!col.length)return;const n=col.length;
    col.forEach(c=>c.ly=c.ay);for(let it=0;it<40;it++){for(let i=1;i<n;i++){const d=col[i].ly-col[i-1].ly;if(d<lh+3){const m=(lh+3-d)/2;col[i].ly+=m;col[i-1].ly-=m;}}col.forEach(c=>c.ly=clamp(c.ly,fs+2,LH-6));}
    col.forEach(c=>{const x=side<0?10:790;out.push({id:c.id,ax:c.ax,ay:c.ay,x,y:c.ly,a:side<0?'left':'right',fs});});});
  return out;}
function drawChart(sim,ctx,k){const v=sim.vis,p=sim.p,s=sim.st,deep=!!p.deep,L=layout(sim),prac=p.act==='practice';ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,LH);
  const art=artCache(sim,ctx,L,deep);ctx.drawImage(art,0,0,800,LH);v.L=L;v.labs=[];
  const sel=prac?((p.pmode==='name'||s.qans)?s.qid:null):p.muscle;
  L.figs.forEach(f=>{if(sel)highlight(ctx,f,sel,deep);
    if(prac&&s.qans&&s.picked&&s.picked!==s.qid&&p.pmode==='find')highlight(ctx,f,s.picked,deep,'#7e8fb0');
    if(L.both)txt(ctx,f.view==='front'?'Front':'Back',f.cx,24*Math.min(k,1.1),{s:13.5*k,w:700,c:PAL['cv-soft'],a:'center'});});
  /* ghost of lifted layers */
  if(deep&&!prac&&L.figs.some(f=>f.view==='back')){L.figs.filter(f=>f.view==='back').forEach(f=>{ctx.save();BACK.filter(q=>q.surf&&q.m==='trapezius').forEach(q=>[1,-1].forEach(sx=>{trace(ctx,q.poly,sx,f);ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['cv-ink'];ctx.globalAlpha=.65;ctx.lineWidth=1.1;ctx.stroke();}));ctx.restore();});}
  /* names in the margins */
  const single=!L.both,wantNames=!prac&&p.names&&single&&!(L.zoom&&k>1.35);
  if(wantNames){const labs=labelsFor(sim,L,k);labs.forEach(l=>{const on=l.id===p.muscle;ctx.font=(on?700:500)+' '+l.fs+'px '+FONT;const w=ctx.measureText(M[l.id].n).width,left=l.a==='left';
      const ex=left?l.x+w+4:l.x-w-4;ctx.strokeStyle=on?PAL['cv-ink']:PAL['cv-soft'];ctx.lineWidth=on?1.4:.9;ctx.beginPath();ctx.moveTo(ex,l.y-l.fs*.32);ctx.lineTo(l.ax,l.ay);ctx.stroke();ctx.fillStyle=on?PAL['cv-ink']:'rgba(20,10,8,.8)';ctx.beginPath();ctx.arc(l.ax,l.ay,1.7,0,6.3);ctx.fillStyle=PAL['cv-ink'];ctx.fill();
      txt(ctx,M[l.id].n,l.x,l.y,{s:l.fs,w:on?700:500,c:on?PAL['cv-ink']:PAL['cv-ink'],a:l.a});v.labs.push({id:l.id,x:left?l.x:l.x-w,y:l.y-l.fs,w,h:l.fs*1.3});});}
  else if(!prac&&sel&&!s.hideQ){pill(ctx,M[sel].n,L.both?400:400,L.both?LH-22:LH-22,PAL['rj']||'#8f1d2c','#fff',14*k);
    if(!L.figs.some(f=>onView(sel,f.view,deep)))txt(ctx,'Not visible in this view.',400,LH-46*k,{s:12.5*k,c:PAL['cv-soft'],a:'center'});}
  /* practice markers */
  if(prac&&s.qid){const fig=L.figs.find(f=>f.view===s.spotView)||L.figs[0],A=ANCHOR[fig.view];v.spotHits=[];
    if(p.pmode==='name'&&!s.qans){const q=A[s.qid];if(q&&onView(s.qid,fig.view,deep)){const x=fig.cx+q[0]*fig.h,y=fig.top+q[1]*fig.h;ctx.fillStyle='#fff';ctx.strokeStyle='#1b1b1f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,Math.max(9,9.5*k),0,6.3);ctx.fill();ctx.stroke();txt(ctx,'?',x,y+.5,{s:Math.max(13,13*k),w:800,c:'#1b1b1f',a:'center',b:'middle'});}}
    if(p.pmode==='find'&&!s.qans){(s.spots||[]).forEach((id,i)=>{const q=A[id];if(!q)return;const x=fig.cx+q[0]*fig.h,y=fig.top+q[1]*fig.h;ctx.fillStyle='#1b1b1f';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,Math.max(9,9*k),0,6.3);ctx.fill();ctx.stroke();txt(ctx,String(i+1),x,y+.5,{s:Math.max(12,12*k),w:700,c:'#fff',a:'center',b:'middle'});v.spotHits.push({id,x,y});});}
    if(s.qans){pill(ctx,M[s.qid].n,400,LH-22,'#8f1d2c','#fff',14*k);}}
}
function draw(sim,ctx,vdt,k,t){const a=sim.p.act;if(a==='decoder')return drawDecoder(sim,ctx,k);if(a==='types')return drawTypes(sim,ctx,k);if(a==='pull')return drawPull(sim,ctx,vdt,k);drawChart(sim,ctx,k);}
function pickMuscle(sim,id){if(sim.st)sim.st.hideQ=false;BioLab.setValues(sim,{muscle:id});sim.infoDirty=true;}
function zoomFor(sim,id){const z=sim.p.zoom;if(z==='whole')return;const v=sim.p.view==='both'?'front':sim.p.view,A=ANCHOR[v][id]||ANCHOR[v==='front'?'back':'front'][id];if(!A)return;if((z==='upper'&&A[1]>.575)||(z==='lower'&&A[1]<.46))BioLab.setValues(sim,{zoom:A[1]>.575?'lower':'upper'});}
function ensureVisible(sim){const id=sim.p.muscle,v=sim.p.view,deep=!!sim.p.deep;if(sim._syncing)return;sim._syncing=true;zoomFor(sim,id);
  if(!onView(id,'front',false)&&!onView(id,'back',false)){if(!deep)BioLab.setValues(sim,{deep:true});if(v==='front')BioLab.setValues(sim,{view:'back'});}
  else if(v!=='both'&&!onView(id,v,deep)){if(onView(id,v,!deep))BioLab.setValues(sim,{deep:!deep});else BioLab.setValues(sim,{view:v==='front'?'back':'front'});}
  else if(v==='both'&&deep&&!onView(id,'back',true)&&!onView(id,'front',true))BioLab.setValues(sim,{deep:false});
  sim._syncing=false;}
function syncAct(sim){if(!sim.ui||!sim.ui.ctlW)return;const a=sim.p.act;(sim.def.controls||[]).forEach(c=>{const w=sim.ui.ctlW[c.id];if(w&&c.acts)w.hidden=!atLeast(c.lvl)||c.acts.indexOf(a)<0;});(sim.def.actions||[]).forEach(x=>{const b=sim.ui.actB&&sim.ui.actB[x.id];if(b&&x.acts)b.hidden=!atLeast(x.lvl)||x.acts.indexOf(a)<0;});}
const CHART=['explore','practice'];

/* ---------- info panel ---------- */
const row=(k,v)=>`<p class="mm-r"><b>${k}:</b> ${v}</p>`;
const TS='<style>.mm-r{margin:0 0 6px;overflow-wrap:anywhere}.mm-bank{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.mm-in{font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--fg);max-width:100%;width:240px}.mm-ok{color:var(--good,#1b7f4b);font-weight:700}.mm-no{font-weight:700}</style>';
function infoExplore(sim){const m=M[sim.p.muscle];if(!m)return '';if(sim.st&&sim.st.hideQ)return '<p style="margin:0">Answer the question to see this muscle’s name and details.</p>';const hon=atLeast('honors'),ap=atLeast('ap');
  return TS+`<h3 class="p-t" style="margin:0 0 6px">${m.n}</h3><div>${row('Action',m.act)}${row('Origin',m.o)}${row('Insertion',m.i)}${row('Exercise',m.ex)}${row('Name',m.word)}${hon?row('Works against',m.ant):''}${ap?row('Landmarks',m.lm):''}${ap?row('Nerve',m.nv):''}</div>`+
  (m.deep===true?'<p style="margin:8px 0 0">The Rhomboids lie under the Trapezius. You cannot see them on a person without lifting that layer, so the chart lifts it for you.</p>':'');}
function infoPractice(sim){const s=sim.st,p=sim.p,m=M[s.qid];if(!m)return '';const score=`<p style="margin:0 0 6px;color:var(--muted)">Right on the first try: <b>${s.right}</b> of ${s.done}. No timer. Muscles you miss come back.</p>`;
  if(s.qans){const ok=s.qans==='right';return TS+score+`<p class="${ok?'mm-ok':'mm-no'}" style="margin:0 0 6px">${ok?'Correct: ':'This one is '}${m.n}.</p>${s.qmsg?`<p style="margin:0 0 6px">${s.qmsg}</p>`:''}<p style="margin:0 0 8px"><b>Action:</b> ${m.act}</p><button type="button" class="btn primary" data-mm="next">Next muscle</button>`;}
  if(p.pmode==='find')return TS+score+`<p style="margin:0 0 6px;font-size:17px">Find the <b>${m.n}</b>.</p><p style="margin:0">Tap the muscle on the figure, or choose a numbered spot:</p><div class="mm-bank">${(s.spots||[]).map((id,i)=>`<button type="button" class="btn" data-spot="${id}">Spot ${i+1}</button>`).join('')}</div>${s.qmsg?`<p style="margin:0">${s.qmsg}</p>`:''}`;
  if(p.answer==='type')return TS+score+`<p style="margin:0 0 6px;font-size:17px">Name the muscle marked <b>?</b></p><label for="mm-type">Full anatomical name</label><div class="mm-bank"><input id="mm-type" class="mm-in" type="text" autocomplete="off" spellcheck="false" value="${(s.typed||'').replace(/"/g,'&quot;')}"><button type="button" class="btn primary" data-mm="check">Check</button></div>${s.qmsg?`<p style="margin:0">${s.qmsg}</p>`:''}`;
  return TS+score+`<p style="margin:0;font-size:17px">Name the muscle marked <b>?</b></p><div class="mm-bank">${(s.opts||[]).map(id=>`<button type="button" class="btn" data-opt="${id}">${M[id].n}</button>`).join('')}</div>${s.qmsg?`<p style="margin:0">${s.qmsg}</p>`:''}`;}
function infoDecoder(sim){const r=rootOf(sim);return `<h3 class="p-t" style="margin:0 0 6px">Decode the name</h3><p style="margin:0 0 6px">Most muscle names tell you something true about the muscle: direction, size, length, number of heads or shape.</p><p style="margin:0"><b>${r.w}</b> means <b>${r.m}</b>. ${r.ex.length?'Find it on: '+r.ex.map(e=>M[e].n).join(', ')+'.':''}</p>`;}
function infoTypes(sim){const t=TYPES.find(x=>x.id===sim.p.mtype)||TYPES[0];return TS+`<h3 class="p-t" style="margin:0 0 6px">${t.n}</h3><div>${row('Looks like',t.a)}${row('Control',t.c)}${row('Job',t.f)}${row('Where',t.w)}</div>`;}
function infoPull(sim){return TS+`<h3 class="p-t" style="margin:0 0 6px">Words for how muscles work</h3><div>${row('Origin','Where a muscle attaches to the bone that stays still.')}${row('Insertion','Where it attaches to the bone that moves.')}${row('Tendon','Tough cord that connects muscle to bone.')}${row('Flexor','A muscle that decreases the angle at a joint. Biceps Brachii flexes the elbow.')}${row('Extensor','A muscle that increases the angle at a joint. Triceps Brachii extends the elbow.')}</div><p style="margin:8px 0 0">Muscles only pull. To straighten the elbow, the Biceps Brachii relaxes and the Triceps Brachii pulls the other way.</p>`;}

const MUSCLES={
  id:'muscles',hash:'muscles',apUnit:9,order:5,kind:'Learning tool',tab:'Major muscles',
  card:'Tap any of 31 muscles on a front and back figure. Learn its action, attachments and exercise, then practice labeling with the real anatomical names.',
  title:'Major muscles of the body',
  lede:{bio:'Tap a muscle on the figure to see its anatomical name, what it does, where it attaches and an exercise that trains it. Then practice labeling.',
        honors:'Learn each muscle’s action, origin and insertion and the muscle that works against it. Use the name decoder to work out what a name is telling you.',
        ap:'Add bony landmarks and nerve supply to each muscle, then practice typing the names from memory.'},
  scale:{bio:'A whole adult body, about 1.7 m tall, in anatomical position: standing, palms forward. The human body has more than 600 skeletal muscles. This chart shows 31 names.'},
  aspect:800/LH,timeless:true,animated:true,graph:false,trials:false,dtMax:.05,
  controls:[
    {id:'act',label:'Activity',type:'seg',def:'explore',lvl:'bio',noTrial:true,options:[{v:'explore',l:'Explore'},{v:'practice',l:'Label practice'},{v:'decoder',l:'Name decoder'},{v:'types',l:'Muscle types'},{v:'pull',l:'How muscles pull'}],onChange(sim){syncAct(sim);sim.infoDirty=true;if(sim.p.act==='practice'&&sim.st&&!sim.st.qid)newQ(sim);}},
    {id:'muscle',label:'Muscle',type:'select',def:'deltoid',lvl:'bio',noTrial:true,acts:['explore'],options:ORDER.map(id=>({v:id,l:M[id].n})),onChange(sim){ensureVisible(sim);sim.infoDirty=true;}},
    {id:'view',label:'Figure',type:'seg',def:'both',lvl:'bio',noTrial:true,acts:CHART,options:[{v:'both',l:'Front and back'},{v:'front',l:'Front'},{v:'back',l:'Back'}],onChange(sim){sim.infoDirty=true;}},
    {id:'zoom',label:'Zoom (Front or Back)',type:'seg',def:'whole',lvl:'bio',noTrial:true,acts:CHART,options:[{v:'whole',l:'Whole body'},{v:'upper',l:'Upper body'},{v:'lower',l:'Lower body'}],onChange(sim){if(sim.p.zoom!=='whole'&&sim.p.view==='both'){const id=sim.p.act==='practice'&&sim.st?sim.st.qid:sim.p.muscle;BioLab.setValues(sim,{view:id&&!onAny(id,'front')?'back':'front'});}}},
    {id:'names',label:'Show names',type:'toggle',def:true,lvl:'bio',noTrial:true,acts:['explore'],help:'Names appear beside the figure when you choose Front or Back.'},
    {id:'deep',label:'Lift the surface muscles (back view)',type:'toggle',def:false,lvl:'bio',noTrial:true,acts:CHART,help:'Removes Trapezius, Latissimus Dorsi, Gluteus Maximus and Gastrocnemius so you can see what lies under them.',onChange(sim){sim.infoDirty=true;}},
    {id:'pmode',label:'Practice',type:'seg',def:'name',lvl:'bio',noTrial:true,acts:['practice'],options:[{v:'name',l:'Name this muscle'},{v:'find',l:'Find this muscle'}],onChange(sim){if(sim.st)newQ(sim);}},
    {id:'answer',label:'Answer by',type:'seg',def:'bank',lvl:'bio',noTrial:true,acts:['practice'],options:[{v:'bank',l:'Word bank'},{v:'type',l:'Typing it'}],onChange(sim){sim.infoDirty=true;}},
    {id:'scope',label:'Muscles to practice',type:'select',def:'all',lvl:'bio',noTrial:true,acts:['practice'],options:[{v:'all',l:'All 31'},{v:'upper',l:'Head, shoulder and arm'},{v:'trunk',l:'Chest, abdomen and back'},{v:'lower',l:'Hip and leg'}],onChange(sim){if(sim.st)newQ(sim);}},
    {id:'root',label:'Word root',type:'select',def:'rectus',lvl:'bio',noTrial:true,acts:['decoder'],options:ROOTS.map(r=>({v:r.id,l:r.w+' ('+r.m+')'})),onChange(sim){sim.infoDirty=true;}},
    {id:'mtype',label:'Muscle type',type:'seg',def:'skeletal',lvl:'bio',noTrial:true,acts:['types'],options:TYPES.map(t=>({v:t.id,l:t.n.split(' ')[0]})),onChange(sim){sim.infoDirty=true;}},
    {id:'elbow',label:'Elbow flexion',type:'range',min:0,max:145,step:1,def:30,unit:'°',lvl:'bio',noTrial:true,acts:['pull'],help:'0° is a straight arm. Normal flexion reaches about 145°.',onChange(sim){if(sim.st)sim.st.pullTo=null;}}
  ],
  actions:[
    {id:'prev',label:'Previous muscle',acts:['explore'],run(sim){const i=ORDER.indexOf(sim.p.muscle);pickMuscle(sim,ORDER[(i+ORDER.length-1)%ORDER.length]);}},
    {id:'next',label:'Next muscle',primary:true,acts:['explore'],run(sim){const i=ORDER.indexOf(sim.p.muscle);pickMuscle(sim,ORDER[(i+1)%ORDER.length]);}},
    {id:'newq',label:'Skip to another muscle',acts:['practice'],run(sim){newQ(sim);}},
    {id:'flex',label:'Flex the elbow',primary:true,acts:['pull'],run(sim){sim.st.pullTo=145;}},
    {id:'extend',label:'Extend the elbow',acts:['pull'],run(sim){sim.st.pullTo=0;}}
  ],
  init(){return {qid:null,qans:null,qmsg:'',tries:0,right:0,done:0,bag:[],bagScope:null,redo:[],opts:[],spots:[],picked:null,typed:'',pullTo:null,spotView:'front'};},
  step(){},
  initVis(sim){sim.vis=sim.vis||{};},
  draw,
  onLevel(sim){syncAct(sim);sim.infoDirty=true;},
  metrics:[],
  onClick(sim,x,y){const v=sim.vis||{},a=sim.p.act,s=sim.st,k=1;
    if(a==='decoder'){const c=(v.chips||[]).find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);if(c)BioLab.setValues(sim,{root:c.r.id});return;}
    if(a==='types'){const r=(v.rows||[]).find(b=>y>=b.y&&y<=b.y+b.h);if(r)BioLab.setValues(sim,{mtype:r.id});return;}
    if(a==='pull')return;
    const L=v.L;if(!L)return;const deep=!!sim.p.deep;
    if(a==='explore'){const lb=(v.labs||[]).find(b=>x>=b.x-2&&x<=b.x+b.w+2&&y>=b.y-1&&y<=b.y+b.h);if(lb){pickMuscle(sim,lb.id);return;}}
    const find=(x,y)=>{for(const f of L.figs){const nx=(x-f.cx)/f.h,ny=(y-f.top)/f.h;if(Math.abs(nx)>.24)continue;const id=hitAt(f.view,deep,nx,ny);if(id)return id;}return null;};
    let id=find(x,y);if(!id){for(const r of [3,6,10]){for(let q=0;q<8&&!id;q++){id=find(x+Math.cos(q*.785)*r,y+Math.sin(q*.785)*r);}if(id)break;}}
    if(a==='practice'){if(sim.p.pmode==='find'&&!s.qans){const sp=(v.spotHits||[]).find(q=>Math.hypot(q.x-x,q.y-y)<14);if(sp)id=sp.id;if(id)grade(sim,id);}return;}
    if(id)pickMuscle(sim,id);},
  infoPanel(sim){const a=sim.p.act;return a==='practice'?infoPractice(sim):a==='decoder'?infoDecoder(sim):a==='types'?infoTypes(sim):a==='pull'?infoPull(sim):infoExplore(sim);},
  bindInfo(sim,el){el.querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>grade(sim,b.dataset.opt));el.querySelectorAll('[data-spot]').forEach(b=>b.onclick=()=>grade(sim,b.dataset.spot));
    const nx=el.querySelector('[data-mm=next]');if(nx)nx.onclick=()=>newQ(sim);
    const ck=el.querySelector('[data-mm=check]'),inp=el.querySelector('#mm-type');if(ck&&inp){ck.onclick=()=>gradeTyped(sim,inp.value);inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();gradeTyped(sim,inp.value);}};}},
  narrate(sim){const a=sim.p.act,s=sim.st;
    if(a==='practice'){if(!s.qid)return 'Press a practice mode to start.';return sim.p.pmode==='find'?'Find <b>'+M[s.qid].n+'</b> on the figure. Use the shape and the fiber direction as clues as well as the location.':'Name the marked muscle using its <b>full anatomical name</b>. Your quiz wants Latissimus Dorsi, not “lats.”';}
    if(a==='decoder'){const r=rootOf(sim);return '<b>'+r.w+'</b> means '+r.m+'. Muscle names usually describe something you can see: fiber direction, size, length, heads, shape or location.';}
    if(a==='types'){const t=TYPES.find(x=>x.id===sim.p.mtype)||TYPES[0];return '<b>'+t.n+'</b> is '+t.c.toLowerCase()+'. '+t.f+' Only skeletal muscle is under your conscious control.';}
    if(a==='pull'){const d=Math.round(sim.p.elbow);return 'The elbow is flexed '+d+'°. <b>Muscles can only pull</b>, so each joint needs a pair: the flexor (Biceps Brachii) closes the joint, and the extensor (Triceps Brachii) opens it. Each pulls its insertion toward its origin.';}
    const m=M[sim.p.muscle];if(!m)return '';if(s.hideQ)return 'Use the location and the fiber direction of the highlighted muscle to answer the question.';const vis=onView(sim.p.muscle,'front',false),bk=onView(sim.p.muscle,'back',false);
    if(m.deep===true)return '<b>'+m.n+'</b> are deep: they lie under the Trapezius and pull the shoulder blades together. The chart has lifted the surface layer so you can see them.';
    return '<b>'+m.n+'</b>: '+m.act+' You can see it from the '+(vis&&bk?'front and the back':vis?'front':'back')+'. The lines on the muscle show which way its fibers run, which is the direction it pulls.';},
  onChallenge(sim,ch,phase){if(!ch||!ch.show)return;if(phase==='ask'){BioLab.setValues(sim,{act:'explore',muscle:ch.show,view:'both',zoom:'whole'});if(sim.st)sim.st.hideQ=!!ch.hide;}else if(sim.st)sim.st.hideQ=false;sim.infoDirty=true;},
  challenges:[
    {lvl:'bio',instant:true,show:'pec',hide:true,q:'A labeling quiz points to the large muscle that fans across the chest. Which name does your quiz want?',choices:['Pectoralis Major','Pecs','Serratus Anterior','Deltoid'],correct:0,explain:{bio:'Pectoralis means of the chest, and Major means larger. “Pecs” is gym talk, and it will not earn the point on a labeling quiz.'}},
    {lvl:'bio',instant:true,show:'lats',hide:true,q:'A pull-up mostly trains the broadest muscle of the back. What is it, and what does it do?',choices:['Latissimus Dorsi: pulls the arm down and back','Trapezius: shrugs the shoulders','Teres Major: straightens the elbow','Erector Spinae: bends the spine forward'],correct:0,explain:{bio:'Latissimus means widest and dorsi means of the back. It runs from the low back to the front of the upper humerus, so it pulls the arm down and back.'}},
    {lvl:'bio',instant:true,show:'rectusabd',q:'Rectus means straight. Which way do the fibers of the Rectus Abdominis run?',choices:['Straight up and down','Straight across','On a slant, like hands in your pockets','In a circle'],correct:0,explain:{bio:'The fiber lines on the figure run straight up and down, from the pubic bone to the ribs. That is what Rectus tells you.'}},
    {lvl:'honors',instant:true,show:'rectusfem',q:'Three of the four quadriceps cross only the knee. Which one also crosses the hip?',choices:['Rectus Femoris','Vastus Lateralis','Vastus Medialis','Sartorius'],correct:0,explain:{honors:'Rectus Femoris starts on the hip bone, so it flexes the hip as well as extending the knee. The vastus muscles start on the femur. Sartorius crosses both joints, but it is not a quadriceps muscle.'}},
    {lvl:'honors',instant:true,show:'semiten',q:'Which pair of hamstrings is on the medial (inner) side of the thigh?',choices:['Semitendinosus and Semimembranosus','Biceps Femoris and Semitendinosus','Biceps Femoris and Vastus Lateralis','Semimembranosus and Biceps Femoris'],correct:0,explain:{honors:'Both “semi” muscles run to the inner tibia. Biceps Femoris is the outer hamstring and ends on the head of the fibula. Tip: S for semi, S for same side as the other leg.'}},
    {lvl:'honors',instant:true,show:'gastroc',q:'A seated calf raise, knee bent, trains the Soleus more than the Gastrocnemius. Why?',choices:['Gastrocnemius crosses the knee, so a bent knee leaves it slack','Soleus is on the front of the leg','Gastrocnemius inserts on the tibia','Soleus crosses the hip'],correct:0,explain:{honors:'Gastrocnemius starts on the femur, above the knee. Bending the knee shortens it, so it cannot pull as hard. Soleus starts below the knee, so knee position does not change it.'}},
    {lvl:'ap',instant:true,show:'teres',q:'Teres Major is often confused with the rotator cuff. Which statement is right?',choices:['It is not in the rotator cuff. It rotates the arm inward with the Latissimus Dorsi.','It is in the rotator cuff and rotates the arm outward.','It inserts on the greater tubercle.','It is supplied by the suprascapular nerve.'],correct:0,explain:{ap:'The rotator cuff is supraspinatus, infraspinatus, teres minor and subscapularis (SITS). Teres Major inserts on the medial lip of the intertubercular groove and is supplied by the lower subscapular nerve.'}},
    {lvl:'ap',instant:true,show:'trapezius',q:'A hockey player cannot shrug one shoulder or turn the head against resistance after a neck injury. Which nerve supplies both the Trapezius and Sternocleidomastoid?',choices:['Spinal accessory nerve (cranial nerve XI)','Axillary nerve','Long thoracic nerve','Thoracodorsal nerve'],correct:0,explain:{ap:'Cranial nerve XI supplies both muscles. That is why the cranial nerve exam tests it with a shoulder shrug and a resisted head turn.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Can you tell what a muscle does from where it attaches?</p><ol><li>Choose <b>Deltoid</b>, <b>Biceps Brachii</b>, <b>Gluteus Maximus</b> and <b>Tibialis Anterior</b> in turn.</li><li>For each one, read the origin and insertion, and predict the movement before you read the action. A muscle pulls its insertion toward its origin.</li><li>Do the listed exercise and feel the muscle work.</li><li>Open <b>Label practice</b> and work through the list until you get 25 of 31 on the first try.</li></ol><p><b>Write:</b> Pick two muscles and explain how their attachments produce their actions.</p>',
       honors:'<p><b>Question:</b> Why does every joint need muscles on opposite sides?</p><ol><li>For the elbow, knee and ankle, name a flexor and an extensor from this chart. Check <b>Works against</b> for each one.</li><li>Open <b>How muscles pull</b> and watch the Biceps Brachii and Triceps Brachii change length.</li><li>Choose <b>Rectus Femoris</b> and <b>Biceps Femoris</b>. Each crosses two joints. Work out what each does at the hip and at the knee.</li></ol><p><b>Write:</b> Explain why a hamstring strain can hurt during both knee flexion and hip extension.</p>',
       ap:'<p><b>Question:</b> How does a nerve injury map to lost movement?</p><ol><li>Sort the muscles by nerve at this level. Which ones share the femoral nerve? The sciatic nerve? Cranial nerve XI?</li><li>Predict what a person could not do with an injury to each nerve.</li><li>Set <b>Answer by</b> to <b>Typing it</b> and practice each region from memory.</li></ol><p><b>Write:</b> A person has trouble lifting the foot when walking (foot drop). Name the muscle and nerve most likely involved, and explain your reasoning.</p>'},
  terms:[
    {t:'Origin',d:'The attachment of a muscle on the bone that stays still when the muscle contracts.'},
    {t:'Insertion',d:'The attachment of a muscle on the bone that moves when the muscle contracts.'},
    {t:'Tendon',d:'Tough connective tissue that joins muscle to bone.'},
    {t:'Flexor',d:'A muscle that decreases the angle at a joint.'},
    {t:'Extensor',d:'A muscle that increases the angle at a joint.'},
    {t:'Skeletal muscle',d:'Striated, voluntary muscle that moves bones.'},
    {t:'Cardiac muscle',d:'Striated, involuntary muscle of the heart wall.'},
    {t:'Smooth muscle',d:'Non-striated, involuntary muscle in the walls of hollow organs and blood vessels.'},
    {t:'Rotator cuff',d:'Four muscles that hold the humerus in the shoulder socket: supraspinatus, infraspinatus, teres minor, subscapularis.',lvl:'honors'},
    {t:'Antagonist',d:'A muscle that opposes the action of another. Triceps Brachii is the antagonist of Biceps Brachii.',lvl:'honors'},
    {t:'Quadriceps',d:'Four muscles on the front of the thigh: Rectus Femoris, Vastus Lateralis, Vastus Medialis and vastus intermedius, which lies under Rectus Femoris.',lvl:'honors'},
    {t:'Hamstrings',d:'Biceps Femoris, Semitendinosus and Semimembranosus on the back of the thigh.',lvl:'honors'},
    {t:'Pes anserinus',d:'The shared attachment on the inner tibia of Sartorius, Semitendinosus and gracilis.',lvl:'ap'}
  ],
  about:'<p><b>The figure</b> is a drawn chart, not a dissection. Each muscle’s location, shape and fiber direction follow standard anatomy, fitted to one body outline with both sides the same. Real people differ in proportions.</p><p><b>Layers.</b> Real muscles overlap, and the chart simplifies this. Erector Spinae is covered by a sheet of tendon in the low back, so the chart shows it faintly there and in full with the surface muscles lifted. The muted shapes are real muscles that are not on the study list, such as tensor fasciae latae and teres minor. They cannot be selected.</p><p><b>Groups.</b> Forearm Flexors, Forearm Extensors and Adductors are groups of several muscles, shown as one region. <b>Rhomboids</b> are really two muscles (major and minor), named together here.</p><p><b>Attachments</b> are in plain words at the first two levels. Deep Dive adds the landmark names and nerve supply. Actions are the main ones, starting from anatomical position. Many muscles have other actions depending on joint position.</p>'
};
BioLab.register(MUSCLES);
})();
