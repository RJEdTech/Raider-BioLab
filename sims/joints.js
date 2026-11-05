(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,RM,lvText}=BioLab.h;

/* Joint anatomy and stress tests. Every joint is schematic art made of named structures.
   Bones and muscles are SVG paths. Ligaments, tendons and nerves are polylines whose points can belong to different bone groups,
   so a ligament stretches when the bones move apart in the stress view.
   Stress model: strain = gain x max(0, force - onset) / 100 x position factor, in percent elongation.
   Zones follow the classic collagen stress-strain curve: under 4% elastic, 4-6% microscopic damage (Grade I), 6-10% partial failure (Grade II), over 10% complete failure (Grade III). */

/* ---------- path helpers ---------- */
const E=(cx,cy,rx,ry)=>`M${cx-rx} ${cy}a${rx} ${ry} 0 1 0 ${2*rx} 0a${rx} ${ry} 0 1 0 ${-2*rx} 0Z`;
function C(x1,y1,x2,y2,r){const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1,nx=-dy/L*r,ny=dx/L*r,f=n=>n.toFixed(1);
  return `M${f(x1+nx)} ${f(y1+ny)}L${f(x2+nx)} ${f(y2+ny)}A${r} ${r} 0 0 0 ${f(x2-nx)} ${f(y2-ny)}L${f(x1-nx)} ${f(y1-ny)}A${r} ${r} 0 0 0 ${f(x1+nx)} ${f(y1+ny)}Z`;}

const KIND={bone:{l:'Bones and landmarks',c:'cv-soft'},lig:{l:'Ligaments',c:'s2'},cart:{l:'Cartilage',c:'s3'},mus:{l:'Muscles and tendons',c:'s1'},nerve:{l:'Nerves',c:'s4'},bursa:{l:'Bursa',c:'s5'},land:{l:'Bones and landmarks',c:'s6'}};
const KORDER=['bone','land','lig','cart','mus','nerve','bursa'];

/* ---------- KNEE, front view of a right knee: lateral is on the viewer's left ---------- */
const KNEE_FRONT=[
 {id:'gastroc',n:'Gastrocnemius',k:'mus',lvl:'honors',dash:1,g:'dist',d:'M286 205C258 270 268 390 330 482L470 482C532 390 542 270 514 205C500 246 300 246 286 205Z',at:[505,330],
  i:'The big calf muscle. Its two heads start on the back of the femoral condyles, so it crosses the knee as well as the ankle. It sits behind the joint.',x:'It flexes the knee and plantarflexes the ankle.'},
 {id:'femur',n:'Femur',k:'bone',g:'prox',d:'M352 0L448 0L450 110C452 135 480 140 492 165C500 185 490 222 450 222C425 222 412 205 400 180C388 205 375 222 350 222C310 222 300 185 308 165C320 140 348 135 350 110Z',at:[330,180],
  i:'The thigh bone, the longest and strongest bone in the body. Its two rounded condyles rest on the tibia.'},
 {id:'tibia',n:'Tibia',k:'bone',g:'dist',d:'M310 262C340 252 380 254 400 262C420 254 460 252 490 262C494 285 470 305 450 330C442 345 440 380 440 500L360 500C360 380 358 345 350 330C330 305 306 285 310 262Z',at:[420,430],
  i:'The shin bone. It carries the body weight through the knee to the ankle.'},
 {id:'fibula',n:'Fibula',k:'bone',g:'dist',d:'M284 296C290 282 316 282 322 298C322 312 312 320 310 334L306 500L292 500L292 334C290 320 284 310 284 296Z',at:[299,420],
  i:'The thin outer bone of the lower leg. It carries little weight. The LCL and biceps femoris attach to its head.'},
 {id:'quads',n:'Quadriceps',k:'mus',g:'prox',d:'M340 0L460 0L452 80L430 96L370 96L348 80Z',at:[440,40],
  i:'Four muscles on the front of the thigh: rectus femoris and the three vasti. They extend the knee.',x:'Weak or slow quadriceps let the kneecap track poorly and leave the knee less protected after injury.'},
 {id:'hams',n:'Hamstrings',k:'mus',g:'prox',soft:1,pts:[[270,0],[286,160],[296,288]],pg:['prox','prox','dist'],w:13,alt:[[530,0],[516,170],[478,335]],at:[275,70],
  i:'Biceps femoris on the lateral side, semitendinosus and semimembranosus on the medial side. They flex the knee and pull the tibia backward.',x:'That backward pull helps the ACL, which is why hamstring strength is part of ACL rehab.'},
 {id:'itband',n:'IT band',k:'mus',lvl:'ap',g:'prox',pts:[[300,0],[305,160],[326,272]],pg:['prox','prox','dist'],w:7,at:[304,110],
  i:'The iliotibial band: thick connective tissue on the outer thigh that attaches to the lateral tibia (Gerdy’s tubercle).'},
 {id:'mmen',n:'Medial meniscus',sh:'Med. meniscus',k:'cart',g:'dist',d:'M494 240C482 226 460 226 438 236L412 252C440 248 465 252 488 262C494 258 496 248 494 240Z',at:[470,238],
  i:'C-shaped cartilage pad on the medial tibia. It cushions the joint and deepens the socket for the femur.',x:'Only 10-30% of the medial meniscus has a direct blood supply, so most tears heal poorly. It is also fixed to the deep MCL, so it moves less and tears more often than the lateral meniscus.'},
 {id:'lmen',n:'Lateral meniscus',sh:'Lat. meniscus',k:'cart',g:'dist',d:'M306 240C318 226 340 226 362 236L388 252C360 248 335 252 312 262C306 258 304 248 306 240Z',at:[330,238],
  i:'More circular cartilage pad on the lateral tibia. It cushions the joint and spreads load.',x:'It has no attachment to the LCL, so it can slide more than the medial meniscus.'},
 {id:'mcl',n:'Medial collateral ligament',sh:'MCL',k:'lig',pts:[[492,160],[466,340]],pg:['prox','dist'],w:11,at:[484,230],
  i:'Broad band on the medial side, from femur to tibia. It stops valgus: the knee bending inward.',x:'A blow to the outside of the knee stretches it. Its deep fibers attach to the medial meniscus.'},
 {id:'lcl',n:'Lateral collateral ligament',sh:'LCL',k:'lig',pts:[[308,162],[298,290]],pg:['prox','dist'],w:8,at:[302,225],
  i:'Cord on the lateral side, from femur to the fibular head. It stops varus: the knee bowing outward.',x:'A blow to the inside of the knee stretches it. That side is shielded by the other leg, so these sprains are less common.'},
 {id:'patten',n:'Patellar tendon',k:'mus',lvl:'honors',pts:[[400,172],[400,306]],pg:['pat','dist'],w:30,soft:1,at:[414,290],
  i:'Connects the patella to the tibial tuberosity. Some anatomists call it the patellar ligament because it joins bone to bone.',x:'It carries the quadriceps pull to the tibia.'},
 {id:'acl',n:'Anterior cruciate ligament',sh:'ACL',k:'lig',pts:[[414,254],[372,190]],pg:['dist','prox'],w:9,at:[378,198],
  i:'Inside the joint. Runs from the front of the tibia up and back to the lateral femoral condyle. It stops the tibia sliding forward on the femur.',x:'Often torn without contact, by planting, cutting or landing with a rotating knee.'},
 {id:'pcl',n:'Posterior cruciate ligament',sh:'PCL',k:'lig',pts:[[386,254],[428,190]],pg:['dist','prox'],w:11,at:[424,198],
  i:'Inside the joint. Runs from the back of the tibia up and forward to the medial femoral condyle. It stops the tibia sliding backward on the femur.',x:'Stronger than the ACL. The classic mechanism is a dashboard hitting the shin of a bent knee.'},
 {id:'mpfl',n:'Medial patellofemoral ligament',sh:'MPFL',k:'lig',lvl:'ap',pts:[[432,130],[492,152]],pg:['pat','prox'],w:6,at:[470,144],
  i:'Holds the patella from sliding laterally. It usually tears when the patella dislocates.'},
 {id:'quadten',n:'Quadriceps tendon',sh:'Quad tendon',k:'mus',lvl:'honors',pts:[[400,84],[400,104]],pg:['prox','pat'],w:44,soft:1,at:[380,92],
  i:'Attaches the quadriceps to the top of the patella.'},
 {id:'patella',n:'Patella',k:'bone',g:'pat',d:'M372 104C385 92 415 92 428 104C438 120 425 160 400 176C375 160 362 120 372 104Z',at:[400,135],
  i:'The kneecap, the largest sesamoid bone in the body: a bone that forms inside a tendon. It gives the quadriceps better leverage.',x:'It usually dislocates laterally.'},
 {id:'tuber',n:'Tibial tuberosity',k:'land',lvl:'honors',g:'dist',d:E(400,312,13,12),at:[388,316],
  i:'The bump on the front of the tibia where the patellar tendon attaches. Teens with sore bumps here may have Osgood-Schlatter disease.'},
 {id:'pes',n:'Pes anserine',k:'land',lvl:'ap',g:'dist',d:E(468,346,10,10),at:[470,352],
  i:'Attachment on the medial tibia shared by sartorius, gracilis and semitendinosus. A bursa here can get inflamed.'}
];

/* KNEE, side view of a right knee: anterior is on the viewer's right. Used for anterior and posterior forces and for showing flexion. */
const KC=[290,190];
const KNEE_SIDE=[
 {id:'femur',n:'Femur',k:'bone',g:'prox',d:'M255 0L325 0L330 115C345 140 348 175 340 200C330 240 245 240 238 195C232 160 245 125 255 110Z',at:[290,40]},
 {id:'tibia',n:'Tibia',k:'bone',g:'dist',d:'M232 252C260 244 320 244 350 250C358 262 352 276 340 290L336 300L325 450L262 450L250 300C240 285 228 270 232 252Z',at:[293,380]},
 {id:'patten',n:'Patellar tendon',k:'mus',pts:[[367,178],[345,290]],pg:['pat','dist'],w:10,soft:1},
 {id:'quadten',n:'Quadriceps tendon',k:'mus',pts:[[338,30],[366,108]],pg:['prox','pat'],w:12,soft:1},
 {id:'patella',n:'Patella',k:'bone',g:'pat',d:'M352 110C362 100 378 104 382 120C386 145 378 170 368 182C356 170 346 135 352 110Z',at:[367,142]},
 {id:'acl',n:'Anterior cruciate ligament',sh:'ACL',k:'lig',pts:[[318,250],[262,194]],pg:['dist','prox'],w:9},
 {id:'pcl',n:'Posterior cruciate ligament',sh:'PCL',k:'lig',pts:[[258,252],[318,190]],pg:['dist','prox'],w:11}
];

/* ---------- ANKLE, front view of a right ankle: lateral (fibula) on the viewer's left. Dashed means behind the joint. ---------- */
const ANKLE=[
 {id:'tibia',n:'Tibia',k:'bone',g:'prox',d:'M345 0L455 0L458 170C462 195 478 215 480 248L466 262L440 240C420 232 380 232 360 240L338 230L340 170Z',at:[430,110],
  i:'The weight-bearing bone of the lower leg. Its inner end forms the medial malleolus, the bump on the inside of the ankle.'},
 {id:'iom',n:'Interosseous membrane',k:'lig',lvl:'ap',pts:[[318,100],[342,60]],pg:['fib','prox'],w:5,alt:[[318,150],[342,110]],at:[330,100],
  i:'Sheet of tissue joining the tibia and fibula along their shafts. A severe high ankle sprain can tear up into it.'},
 {id:'fibula',n:'Fibula',k:'bone',g:'fib',d:'M282 0L318 0L318 180C322 220 322 265 305 300C295 308 282 300 280 280C274 240 284 200 284 180Z',at:[300,60],
  i:'The thin non-weight-bearing bone. Its lower end forms the lateral malleolus, which reaches lower than the medial malleolus. That extra reach is why eversion is limited.'},
 {id:'talus',n:'Talus',k:'bone',g:'dist',d:'M345 245C375 235 425 235 458 248C462 275 450 310 425 322C405 328 375 326 355 318C335 300 338 265 345 245Z',at:[400,285],
  i:'Sits under the tibia inside the mortise formed by the two malleoli. It moves the ankle in plantarflexion and dorsiflexion.',x:'It is wider in front, so the joint is most stable in dorsiflexion and loosest in plantarflexion.'},
 {id:'calc',n:'Calcaneus',k:'bone',g:'dist',d:'M340 345C370 328 430 328 462 340C480 368 470 420 440 438C400 450 360 445 340 430C322 405 326 365 340 345Z',at:[400,395],
  i:'The heel bone, the largest bone in the foot. The Achilles tendon and the plantar fascia attach to it.'},
 {id:'achilles',n:'Achilles tendon',k:'mus',lvl:'honors',dash:1,pts:[[400,40],[400,350]],pg:['prox','dist'],w:20,soft:1,at:[400,180],
  i:'The thickest tendon in the body. It joins the gastrocnemius and soleus to the calcaneus, behind the ankle, and plantarflexes the foot.'},
 {id:'fibtend',n:'Fibularis tendons',k:'mus',lvl:'honors',pts:[[272,60],[270,290],[330,440]],pg:['fib','fib','dist'],w:6,at:[271,180],
  i:'Fibularis (peroneus) longus and brevis pass behind the lateral malleolus. They evert the foot and are the active defense against an inversion sprain.'},
 {id:'tibant',n:'Tibialis anterior',k:'mus',lvl:'honors',pts:[[445,0],[470,220],[474,345]],pg:['prox','prox','dist'],w:7,at:[458,120],
  i:'Muscle on the front of the shin. It dorsiflexes and inverts the foot.'},
 {id:'ptfl',n:'Posterior talofibular ligament',sh:'PTFL',k:'lig',dash:1,pts:[[305,285],[352,306]],pg:['fib','dist'],w:7,at:[326,296],
  i:'Behind the ankle, the strongest of the three lateral ligaments. It tears last in an inversion sprain, and only in severe ones.'},
 {id:'atfl',n:'Anterior talofibular ligament',sh:'ATFL',k:'lig',pts:[[312,262],[362,268]],pg:['fib','dist'],w:8,at:[336,265],
  i:'Front of the lateral ankle, from fibula to talus. The weakest lateral ligament and the first to tear when you roll your ankle.',x:'It is tightest when the foot points down, which is why inversion plus plantarflexion injures it first.'},
 {id:'cfl',n:'Calcaneofibular ligament',sh:'CFL',k:'lig',pts:[[296,302],[338,392]],pg:['fib','dist'],w:8,at:[316,346],
  i:'From the tip of the lateral malleolus down to the calcaneus. It tears second in an inversion sprain.',x:'It is tightest with the foot in neutral or dorsiflexion.'},
 {id:'deltoid',n:'Deltoid ligament',sh:'Deltoid lig.',k:'lig',pts:[[470,255],[450,292]],pg:['prox','dist'],w:6,alt:[[470,255],[464,362]],alt2:[[470,255],[436,316]],at:[468,300],
  i:'Thick fan on the medial ankle, from the medial malleolus to the talus, calcaneus and navicular. Very strong, so eversion sprains are rare.',x:'The force can pull a piece off the tibia before the ligament fails. That is an avulsion, which is why these injuries get an x-ray.'},
 {id:'aitfl',n:'Anterior tibiofibular ligament',sh:'Ant. tibiofibular',k:'lig',pts:[[318,196],[342,208]],pg:['fib','prox'],w:7,at:[330,202],
  i:'Holds the front of the tibia and fibula together above the ankle. This is the high ankle sprain ligament, injured by external rotation and forced dorsiflexion.'},
 {id:'pitfl',n:'Posterior tibiofibular ligament',sh:'Post. tibiofibular',k:'lig',dash:1,pts:[[318,222],[342,234]],pg:['fib','prox'],w:7,at:[330,228],
  i:'Holds the back of the tibia and fibula together. It is the second ligament of a high ankle sprain.'}
];

/* ---------- SHOULDER, front view of a right shoulder: lateral on the viewer's left. ---------- */
const SHOULDER=[
 {id:'deltmus',n:'Deltoid',k:'mus',lvl:'honors',dash:1,g:'hum',d:'M250 66C196 110 178 240 222 345L244 350C226 270 226 190 268 118Z',at:[208,200],
  i:'The muscle cap of the shoulder. Its three parts flex, abduct and extend the arm.',x:'A deltoid that loses its rounded shape is a sign of anterior dislocation.'},
 {id:'sternum',n:'Sternum',k:'bone',lvl:'honors',d:'M528 110L585 110L578 300L535 300Z',at:[558,200],
  i:'The breastbone. The clavicle joins it at the sternoclavicular joint, the only bony link between the arm and the trunk.'},
 {id:'scap',n:'Scapula',k:'bone',g:'scap',d:'M262 82C280 70 300 86 306 112L320 124L480 118C470 220 430 320 400 380C370 320 340 260 322 238C312 228 304 222 304 200C304 182 310 172 318 162L302 134L286 120C278 104 270 96 262 82Z',at:[466,135],
  i:'The shoulder blade. It includes the acromion (top), the coracoid (front hook) and the glenoid (shallow socket).'},
 {id:'subscap',n:'Subscapularis',k:'mus',g:'scap',d:'M452 150C440 230 420 300 400 345C380 300 340 250 298 226L296 202C350 190 400 160 452 150Z',side:'R',at:[385,222],
  i:'The second S in SITS: the only rotator cuff muscle on the front of the scapula. It internally rotates the arm.'},
 {id:'coracoid',n:'Coracoid process',k:'land',lvl:'honors',g:'scap',d:'M345 138C330 133 320 148 328 158C345 163 362 158 365 148Z',at:[343,150],
  i:'A hook of the scapula at the front of the shoulder. Pectoralis minor and the short head of biceps attach here. The coracoclavicular ligaments hold the clavicle down to it.'},
 {id:'humerus',n:'Humerus',k:'bone',g:'hum',d:'M232 190C232 160 262 150 285 158C310 170 318 205 305 230C295 250 282 250 280 262L272 500L228 500L228 262C222 240 230 210 232 190Z',at:[250,380],
  i:'The upper arm bone. Its round head sits on the glenoid like a golf ball on a tee: lots of motion, little bony stability.'},
 {id:'labrum',n:'Glenoid labrum',k:'cart',lvl:'honors',pts:[[314,160],[302,180],[304,212],[316,236]],pg:['scap','scap','scap','scap'],w:7,at:[305,200],
  i:'Ring of cartilage that deepens the glenoid. An anterior dislocation often tears its front lower edge (a Bankart lesion).'},
 {id:'supra',n:'Supraspinatus',k:'mus',pts:[[452,132],[320,134],[262,160]],pg:['scap','scap','hum'],w:16,side:'R',at:[420,132],
  i:'Sits above the spine of the scapula and passes under the acromion to the greater tubercle. It starts abduction.',x:'Its tendon can get pinched under the acromion. That is impingement.'},
 {id:'infra',n:'Infraspinatus',k:'mus',dash:1,pts:[[436,262],[300,250],[240,214]],pg:['scap','scap','hum'],w:15,side:'R',at:[380,256],
  i:'Behind the scapula, below the spine. It externally rotates the arm.'},
 {id:'teres',n:'Teres minor',k:'mus',dash:1,pts:[[410,322],[300,298],[236,238]],pg:['scap','scap','hum'],w:10,side:'R',at:[370,314],
  i:'Behind the scapula along its lateral edge, just under infraspinatus. It externally rotates the arm.'},
 {id:'biceps',n:'Biceps long head tendon',sh:'Biceps tendon',k:'mus',lvl:'ap',pts:[[258,500],[262,262],[284,178],[306,160]],pg:['hum','hum','hum','scap'],w:5,at:[266,235],
  i:'Runs in the groove of the humerus and over the humeral head to the top of the glenoid. It can get irritated in overhead athletes.'},
 {id:'capsule',n:'Anterior-inferior capsule',sh:'Ant-inf capsule',k:'lig',pts:[[314,236],[282,266]],pg:['scap','hum'],w:8,at:[300,250],
  i:'The front lower part of the joint capsule, thickened by the inferior glenohumeral ligament. It stops the humeral head going forward and down when the arm is abducted and externally rotated.'},
 {id:'axnerve',n:'Axillary nerve',k:'nerve',lvl:'ap',pts:[[340,330],[276,282],[232,296]],pg:['scap','hum','hum'],w:4,at:[280,285],
  i:'Wraps under the humeral head to the deltoid. An anterior dislocation can stretch it, so check the patch of skin over the lateral deltoid.'},
 {id:'clavicle',n:'Clavicle',k:'bone',g:'clav',d:'M286 96C320 70 380 100 430 88C470 80 515 96 540 120L530 140C500 118 470 108 430 112C380 122 320 98 296 118Z',at:[430,98],
  i:'The collarbone, a strut holding the arm away from the trunk. It is one of the most commonly broken bones in sport.'},
 {id:'ccl',n:'Coracoclavicular ligaments',sh:'CC ligaments',k:'lig',pts:[[346,102],[344,140]],pg:['clav','scap'],w:7,at:[344,122],
  i:'Hold the clavicle down to the coracoid. In a Grade III AC sprain they tear too, and the end of the clavicle sticks up.'},
 {id:'acl_s',n:'AC ligament',k:'lig',pts:[[300,106],[282,92]],pg:['clav','scap'],w:7,at:[292,100],
  i:'Acromioclavicular ligament: holds the end of the clavicle to the acromion. It tears first when you land on the point of the shoulder.'},
 {id:'acj',n:'AC joint',k:'land',ring:1,d:E(292,102,17,17),at:[278,92],
  i:'Acromioclavicular joint, where the clavicle meets the acromion. A fall on the point of the shoulder sprains it.'},
 {id:'ghj',n:'Glenohumeral joint',sh:'GH joint',k:'land',ring:1,d:E(296,198,26,44),at:[278,180],
  i:'The ball-and-socket joint between the humeral head and the glenoid. It is the most mobile joint in the body and the one that dislocates most often, typically anterior inferior.'}
];

/* ---------- ELBOW, front view of a right elbow in anatomical position: lateral (radius) on the viewer's left. ---------- */
const ELBOW=[
 {id:'triceps',n:'Triceps brachii',k:'mus',dash:1,g:'prox',d:'M438 0L476 0C482 70 462 140 428 186L410 180C430 130 440 70 438 0Z',at:[456,70],
  i:'Back of the arm. It inserts on the olecranon and extends the elbow.'},
 {id:'humerus',n:'Humerus',k:'bone',g:'prox',d:'M365 0L435 0L438 130C445 155 495 175 500 205C498 225 470 232 445 232C425 232 410 222 400 222C388 222 370 232 350 232C325 232 302 225 300 205C305 175 355 155 362 130Z',at:[378,150],
  i:'The upper arm bone. Its lower end flares out to the two epicondyles, where the forearm muscles start.'},
 {id:'wflex',n:'Wrist flexors',k:'mus',lvl:'honors',g:'dist',d:'M494 216C500 300 470 420 445 500L425 500L436 310C445 285 470 250 480 225Z',at:[462,340],
  i:'Forearm muscles that start from the medial epicondyle. Overuse here is medial epicondylitis, or golfer’s elbow.'},
 {id:'wext',n:'Wrist extensors',k:'mus',lvl:'honors',g:'dist',d:'M306 216C286 300 300 420 318 500L332 500L338 310C330 285 320 250 312 225Z',at:[310,350],
  i:'Forearm muscles that start from the lateral epicondyle. Overuse here is lateral epicondylitis, or tennis elbow.'},
 {id:'radius',n:'Radius',k:'bone',g:'dist',d:'M320 252C330 244 365 244 376 252C378 268 368 274 364 282L352 500L325 500L336 282C332 276 318 268 320 252Z',at:[345,400],
  i:'The forearm bone on the thumb side. Its head spins against the humerus and ulna during pronation and supination.'},
 {id:'ulna',n:'Ulna',k:'bone',g:'dist',d:'M388 245C405 238 450 240 460 250C462 272 440 290 436 310L420 500L395 500L398 310C396 290 386 270 388 245Z',at:[412,400],
  i:'The forearm bone on the pinky side. Its hook at the elbow, the olecranon, makes the hinge with the humerus.'},
 {id:'biceps',n:'Biceps brachii',k:'mus',g:'prox',d:'M368 0L432 0L428 120L394 178L370 130Z',at:[400,60],
  i:'Front of the arm. It flexes the elbow and supinates the forearm. Its tendon reaches the radius.'},
 {id:'bursa',n:'Olecranon bursa',k:'bursa',dash:1,g:'dist',d:E(408,194,34,40),at:[436,196],
  i:'Fluid sac over the point of the elbow, on the back side. It swells after a fall or from leaning on it. Redness, heat and fever suggest infection and need referral.'},
 {id:'olec',n:'Olecranon',k:'bone',dash:1,g:'dist',d:'M385 185C395 170 420 170 430 185C435 205 425 225 408 230C392 226 380 205 385 185Z',at:[408,200],
  i:'The bony point of the elbow, part of the ulna, on the back side. The triceps attaches here.'},
 {id:'median',n:'Median nerve',k:'nerve',lvl:'honors',pts:[[414,0],[404,180],[392,290],[410,500]],pg:['prox','prox','dist','dist'],w:4,at:[406,120],
  i:'Crosses the front of the elbow and runs down the middle of the forearm to the carpal tunnel.'},
 {id:'radialn',n:'Radial nerve',k:'nerve',pts:[[352,0],[316,190],[316,300],[328,500]],pg:['prox','prox','dist','dist'],w:4,at:[334,90],
  i:'Passes the lateral side of the elbow. It drives the wrist and finger extensors.'},
 {id:'ulnarn',n:'Ulnar nerve',k:'nerve',pts:[[486,0],[492,195],[470,300],[438,500]],pg:['prox','prox','dist','dist'],w:5,at:[489,120],
  i:'Runs behind the medial epicondyle. Hitting it there is the funny bone feeling. Tingling in the ring and little fingers points to it.',x:'A UCL injury or repeated throwing can irritate it.'},
 {id:'annular',n:'Annular ligament',k:'lig',lvl:'honors',pts:[[318,262],[378,262]],pg:['dist','dist'],w:7,at:[350,262],
  i:'A ring around the radial head that holds it against the ulna while it spins.'},
 {id:'rcl',n:'Radial collateral ligament',sh:'RCL',k:'lig',pts:[[304,218],[324,262]],pg:['prox','dist'],w:8,at:[312,240],
  i:'On the lateral side, from the lateral epicondyle to the annular ligament. It resists varus.'},
 {id:'ucl',n:'Ulnar collateral ligament',sh:'UCL',k:'lig',pts:[[496,218],[452,282]],pg:['prox','dist'],w:9,at:[476,250],
  i:'On the medial side, from the medial epicondyle to the ulna. It is the main restraint against valgus load.',x:'The cocking phase of a throw loads it hard. Repeated throwing can stretch or tear it, which is what Tommy John surgery repairs.'},
 {id:'medep',n:'Medial epicondyle',k:'land',g:'prox',d:E(490,204,12,12),at:[494,196],
  i:'The bump on the inner elbow. The UCL and the wrist flexors attach here. In growing athletes its growth plate can be pulled apart (Little League elbow).'},
 {id:'latep',n:'Lateral epicondyle',k:'land',g:'prox',d:E(310,204,11,11),at:[306,196],
  i:'The bump on the outer elbow. The wrist extensors and the RCL attach here.'}
];

/* ---------- HAND AND WRIST, palm view of a right hand: thumb (lateral) on the viewer's left. ---------- */
const mc=[[332,338,278,272],[362,336,350,212],[394,336,394,198],[428,336,432,212],[452,340,474,234]];
const ph=[[272,262,244,212,246,204,226,168],[349,202,342,132,342,122,336,74,336,66,332,30],[394,188,394,112,394,102,394,50,394,42,394,6],[433,202,440,128,441,118,446,70,447,62,450,26],[476,224,490,168,492,158,500,120,502,112,508,84]];
const allMc=mc.map(m=>C(m[0],m[1],m[2],m[3],9)).join(''),allPh=ph.map(f=>{let s='';for(let i=0;i+3<f.length;i+=4)s+=C(f[i],f[i+1],f[i+2],f[i+3],8);return s;}).join('');
const carp={sca:E(344,402,23,15),lun:E(388,402,18,14),tri:E(426,402,18,13),pis:E(450,388,11,10),trm:E(333,365,16,15),trd:E(362,362,12,15),cap:E(393,362,17,20),ham:E(430,364,19,18)};
const allCarp=Object.values(carp).join('');
const HAND=[
 {id:'radius',n:'Radius',k:'bone',d:'M316 428C335 417 385 417 402 428L396 500L330 500Z',at:[360,470],
  i:'The forearm bone on the thumb side. It forms most of the wrist joint, so a fall on an outstretched hand often breaks its lower end.'},
 {id:'ulna',n:'Ulna',k:'bone',d:'M415 432C430 422 460 422 472 434L460 500L420 500Z',at:[442,470],
  i:'The forearm bone on the pinky side. It does not touch the carpals directly. A disc of cartilage sits between them.'},
 {id:'carpals',n:'Carpals',k:'bone',d:allCarp,at:[430,375],
  i:'The eight wrist bones, in two rows of four. They let the wrist glide in many directions.'},
 {id:'snuff',n:'Anatomical snuff box',sh:'Snuff box',k:'land',ring:1,d:E(304,398,22,22),at:[292,398],
  i:'The hollow at the base of the thumb on the back of the wrist, shown here on its thumb-side edge. The scaphoid lies at its floor.',x:'Pain when you press here after a fall on an outstretched hand (FOOSH) means treat it as a scaphoid fracture until proven otherwise.'},
 {id:'scaphoid',n:'Scaphoid',k:'bone',emph:1,d:carp.sca,at:[344,402],
  i:'The carpal most often broken, usually by a fall on an outstretched hand. Tenderness in the snuff box is the classic finding.',x:'Early x-rays can miss it, and its blood supply enters from the far end, so a break can fail to heal without proper care.'},
 {id:'lunate',n:'Lunate',k:'bone',lvl:'honors',emph:1,d:carp.lun,at:[388,402],i:'Moon-shaped carpal in the proximal row, in the center of the wrist. It sits next to the scaphoid.'},
 {id:'triq',n:'Triquetrum',k:'bone',lvl:'honors',emph:1,d:carp.tri,at:[424,404],i:'Pyramid-shaped carpal in the proximal row on the pinky side.'},
 {id:'pisi',n:'Pisiform',k:'bone',lvl:'honors',emph:1,d:carp.pis,at:[450,388],i:'Pea-shaped carpal that sits on the palm side of the triquetrum. It is a sesamoid bone in the flexor carpi ulnaris tendon.'},
 {id:'trapm',n:'Trapezium',k:'bone',lvl:'honors',emph:1,d:carp.trm,at:[333,365],i:'Distal row carpal under the thumb. It forms the saddle joint that lets the thumb oppose.'},
 {id:'trapd',n:'Trapezoid',k:'bone',lvl:'honors',emph:1,d:carp.trd,at:[362,362],i:'Small distal row carpal under the index finger metacarpal.'},
 {id:'capit',n:'Capitate',k:'bone',lvl:'honors',emph:1,d:carp.cap,at:[393,362],i:'The largest carpal, in the center of the distal row.'},
 {id:'hamate',n:'Hamate',k:'bone',lvl:'honors',emph:1,d:carp.ham,at:[430,364],i:'Distal row carpal with a hook on its palm side. A bat or club handle can break the hook.'},
 {id:'meta',n:'Metacarpals',k:'bone',d:allMc,at:[430,270],
  i:'The five bones of the palm, numbered 1 (thumb) to 5 (pinky).',x:'A boxer’s fracture is a break at the neck of the 5th metacarpal, usually from punching.'},
 {id:'phal',n:'Phalanges',k:'bone',d:allPh,at:[441,118],
  i:'The finger bones. Each finger has three (proximal, middle, distal). The thumb has two.'},
 {id:'median',n:'Median nerve',k:'nerve',lvl:'honors',pts:[[396,500],[396,350],[388,300]],w:4,at:[395,440],
  i:'Passes through the carpal tunnel on the palm side of the wrist. Pressure there causes carpal tunnel syndrome: numbness in the thumb, index and middle fingers.'},
 {id:'tucl',n:'Thumb ulnar collateral ligament',sh:'Thumb UCL',k:'lig',lvl:'ap',pts:[[286,268],[282,252]],w:7,at:[285,258],
  i:'Stabilizes the base of the thumb. A forced thumb, as with a ski pole, sprains it: gamekeeper’s or skier’s thumb.'},
 {id:'tfcc',n:'Triangular fibrocartilage complex',sh:'TFCC',k:'cart',lvl:'ap',pts:[[418,424],[446,420]],w:7,at:[432,422],
  i:'A cartilage and ligament cushion between the ulna and the carpals. Twisting falls can tear it, causing pain on the pinky side of the wrist.'}
];

/* ---------- HIP, back view of a right hip: medial (spine) on the viewer's left, lateral on the right. ---------- */
const HIP=[
 {id:'gmax',n:'Gluteus maximus',k:'mus',lvl:'honors',dash:1,d:'M220 110C300 140 500 230 560 400L510 440C420 400 300 330 200 300Z',at:[300,300],
  i:'The large buttock muscle, drawn as a dashed outline over the deeper layers. It extends and externally rotates the hip.'},
 {id:'pelvis',n:'Pelvis',k:'bone',d:'M270 60C340 5 470 20 505 95C490 140 470 170 462 210C455 250 440 280 390 345C365 360 340 350 335 330C345 290 350 260 330 230C300 190 270 140 270 60Z',at:[300,120],
  i:'The hip bone: ilium, ischium and pubis fused together. Its cup, the acetabulum, holds the head of the femur.'},
 {id:'sacrum',n:'Sacrum',k:'bone',lvl:'honors',d:'M190 70L272 60C268 120 280 180 262 240L220 255L178 240C162 180 172 120 190 70Z',at:[218,110],
  i:'Five fused vertebrae at the back of the pelvis. Piriformis starts on its front surface.'},
 {id:'femur',n:'Femur',k:'bone',d:'M420 215C425 195 455 190 470 205L505 215C530 195 565 205 572 240C578 275 560 300 558 330L540 500L490 500L500 330C495 300 470 265 445 258C425 252 418 235 420 215Z',at:[520,420],
  i:'The thigh bone. Its round head fits the acetabulum in a ball-and-socket joint, much deeper and more stable than the shoulder.'},
 {id:'gmed',n:'Gluteus medius',k:'mus',lvl:'honors',d:'M340 40C400 25 480 50 498 100C510 140 530 180 538 210L505 212C480 180 420 150 360 138C340 110 335 70 340 40Z',at:[450,130],
  i:'Fan-shaped muscle from the ilium to the greater trochanter. It abducts the hip and keeps the pelvis level when you stand on one leg.'},
 {id:'crest',n:'Iliac crest',k:'land',pts:[[270,60],[300,42],[331,32],[365,28],[400,29],[432,36],[463,50],[487,72],[505,95]],w:8,at:[420,31],
  i:'The curved top edge of the pelvis, the bone under your hands on your hips. A direct blow here bruises the bone and the muscles attached to it: a hip pointer.'},
 {id:'piri',n:'Piriformis',k:'mus',pts:[[240,170],[390,190],[530,212]],w:22,at:[380,190],
  i:'Runs from the front of the sacrum to the top of the greater trochanter. It externally rotates the hip.',x:'A tight piriformis can press on the sciatic nerve: piriformis syndrome. The figure four stretch targets it.'},
 {id:'sciatic',n:'Sciatic nerve',k:'nerve',pts:[[285,222],[400,250],[450,305],[470,500]],w:9,at:[458,400],
  i:'The largest nerve in the body. It leaves the pelvis just under piriformis in most people, then runs down the back of the thigh.',x:'Compression can send pain, tingling or weakness down the back of the leg.'},
 {id:'gt',n:'Greater trochanter',k:'land',ring:1,d:E(548,240,26,28),at:[566,242],
  i:'The large bump at the top outer femur that you can feel on the side of your hip. Gluteus medius and piriformis attach here, and a bursa lies over it.'},
 {id:'isch',n:'Ischial tuberosity',k:'land',lvl:'honors',ring:1,d:E(358,336,20,20),at:[345,346],
  i:'The sit bone. The hamstrings start here. A sudden hamstring pull in a young athlete can break off a piece of it.'},
 {id:'hamso',n:'Hamstring origin',k:'mus',lvl:'ap',pts:[[362,350],[420,420],[448,500]],w:12,soft:1,at:[396,395],
  i:'Where semitendinosus, semimembranosus and the long head of biceps femoris leave the ischial tuberosity.'},
 {id:'iliofem',n:'Iliofemoral ligament',k:'lig',lvl:'ap',dash:1,pts:[[452,190],[500,300]],w:9,at:[476,262],
  i:'On the front of the hip, so dashed here. The strongest ligament in the body. It stops the hip from extending too far.'}
];

const JOINTS={
 knee:{n:'Knee',view:'Right knee, front view',left:'Lateral',right:'Medial',art:KNEE_FRONT,def:'acl',ex:{s:1,ox:0,oy:0},stress:'fk',scale:'Right knee from the front. The knee joint itself is about 10 cm across.'},
 ankle:{n:'Ankle',view:'Right ankle, front view',left:'Lateral',right:'Medial',art:ANKLE,def:'atfl',ex:{s:1,ox:0,oy:15},stress:'fa',scale:'Right ankle from the front. The two malleoli are about 7 cm apart.'},
 shoulder:{n:'Shoulder',view:'Right shoulder, front view',left:'Lateral',right:'Medial',art:SHOULDER,def:'ghj',ex:{s:.78,ox:20,oy:50},stress:'fs',scale:'Right shoulder from the front. The humeral head is about 4.5 cm across.'},
 elbow:{n:'Elbow',view:'Right elbow, palm forward',left:'Lateral',right:'Medial',art:ELBOW,def:'ucl',ex:{s:1,ox:0,oy:0},stress:'fe',scale:'Right elbow from the front with the palm forward. The two epicondyles are about 6 cm apart.'},
 hand:{n:'Hand and wrist',view:'Right hand, palm view',left:'Thumb side',right:'Pinky side',art:HAND,def:'scaphoid',ex:{s:.98,ox:0,oy:8},scale:'Right hand, palm toward you. An adult hand is about 18 cm long.'},
 hip:{n:'Hip',view:'Right hip, back view',left:'Medial',right:'Lateral',art:HIP,def:'piri',ex:{s:.78,ox:25,oy:40},scale:'Right hip from behind, so lateral is on the right. The femoral head is about 5 cm across.'}
};
const JK=Object.keys(JOINTS);
const visArt=j=>JOINTS[j].art.filter(a=>atLeast(a.lvl));

/* Bones have a name in the art, but the art objects need no labels in the side view. Path2D caching. */
function pathOf(a){if(a._p)return a._p;if(a.d)return a._p=new Path2D(a.d);return null;}
function linePath(pts){const p=new Path2D();pts.forEach((q,i)=>i?p.lineTo(q[0],q[1]):p.moveTo(q[0],q[1]));return p;}

/* ---------- stress model ---------- */
const zone=s=>s<4?0:s<6?1:s<10?2:3;
const row=(id,n,kind,gain,onset,f,lvl)=>({id,n,kind,gain,onset,f:f===undefined?1:f,lvl});
const LIGS={acl:'ACL',pcl:'PCL',mcl:'MCL',lcl:'LCL',mmen:'Medial meniscus',lmen:'Lateral meniscus',mpfl:'MPFL',atfl:'ATFL',cfl:'CFL',ptfl:'PTFL',deltoid:'Deltoid ligament',aitfl:'Ant. tibiofibular',pitfl:'Post. tibiofibular',iom:'Interosseous memb.',ucl:'UCL',rcl:'RCL',capsule:'Ant-inf capsule',labrum:'Glenoid labrum',axnerve:'Axillary nerve',ulnarn:'Ulnar nerve',medep:'Medial epicondyle',medmal:'Medial malleolus',acl_s:'AC ligament',ccl:'CC ligaments'};
function kneeMech(p){const d=p.fk;if(d==='rot')return 'rot';if(d==='pat')return 'pat';const t=p.bone==='tibia';
  if(d==='ant')return t?'att':'ptt';if(d==='post')return t?'ptt':'att';if(d==='fromlat')return t?'varus':'valgus';return t?'valgus':'varus';}
const MECH={
 att:{t:'Anterior tibial translation',art:KNEE_SIDE,test:'Lachman (about 20-30° flexion) and anterior drawer (90°)',
   rows:p=>[row('acl','','lig',16,0,1-.35*Math.abs(p.flex-25)/65),row('mcl','','lig',5,55)],
   how:'The tibia slides forward under the femur. The ACL is the main thing stopping it.',real:'Planting and cutting, landing stiff, or a blow from behind the shin.'},
 ptt:{t:'Posterior tibial translation',art:KNEE_SIDE,test:'Posterior drawer and posterior sag (90° flexion)',
   rows:p=>[row('pcl','','lig',11,0,.7+.3*p.flex/90),row('lcl','','lig',4,70,1,'honors')],
   how:'The tibia is driven backward under the femur. The PCL stops it, and it is stronger than the ACL.',real:'The dashboard injury: a bent knee hits the dashboard. Also a fall onto a bent knee.'},
 valgus:{t:'Valgus',art:KNEE_FRONT,test:'Valgus stress test (0° and 30° flexion)',
   rows:p=>[row('mcl','','lig',15,0,p.flex<=30?.85+.15*p.flex/30:1-.2*(p.flex-30)/60),row('acl','','lig',8,60),row('mmen','','cart',8,55)],
   how:'The knee bends inward and the medial side opens. The MCL takes the load first.',real:'A hit to the outside of the knee with the foot planted, like a tackle from the side.'},
 varus:{t:'Varus',art:KNEE_FRONT,test:'Varus stress test (0° and 30° flexion)',
   rows:()=>[row('lcl','','lig',16,0),row('pcl','','lig',6,65,1,'honors')],
   how:'The knee bows outward and the lateral side opens. The LCL takes the load first.',real:'A hit to the inside of the knee with the foot planted. The other leg usually shields this side, so it is less common.'},
 rot:{t:'Rotation on a planted foot',art:KNEE_FRONT,test:'McMurray and joint line palpation for the meniscus, Lachman for the ACL',
   rows:p=>{const f=.35+.65*Math.min(p.flex,60)/60;return [row('mmen','','cart',13,0,f),row('lmen','','cart',9,0,f),row('acl','','lig',12,15)];},
   how:'The femur twists on a fixed tibia and the condyles grind the menisci. Flexion makes this worse. The ACL also resists the twist.',real:'Cutting or pivoting with the cleats stuck in the turf. Athletes often report catching or locking afterward.'},
 pat:{t:'Lateral push on the patella',art:KNEE_FRONT,test:'Patellar apprehension test',
   rows:p=>[row('mpfl','','lig',14,0,p.flex<=30?1.1:clamp(1.1-.8*(p.flex-30)/60,.3,1.1))],
   how:'The patella slides toward the lateral side. Near full extension it has not settled in its groove on the femur, so it escapes more easily.',real:'A twist on a nearly straight knee or a blow to the inner patella. It usually pops out laterally.'},
 inv:{t:'Inversion',art:ANKLE,test:'Anterior drawer (ATFL) and talar tilt (CFL)',
   rows:p=>[row('atfl','','lig',20,0,clamp(.55+.45*p.pf/30,.3,1.1)),row('cfl','','lig',16,30,clamp(1-.4*p.pf/30,.5,1.3)),row('ptfl','','lig',16,65,clamp(1-.3*p.pf/30,.6,1.2))],
   how:'The sole turns inward and the lateral ankle opens. The three lateral ligaments tear from front to back: ATFL, then CFL, then PTFL.',real:'Landing on another player’s foot in basketball. Inversion causes almost 90% of ankle sprains.'},
 ev:{t:'Eversion',art:ANKLE,test:'Eversion talar tilt, plus an x-ray to rule out avulsion',
   rows:()=>[row('deltoid','','lig',9,15),row('medmal','','bone',13,50),row('aitfl','','lig',7,60,1,'honors')],
   how:'The sole turns outward and the medial ankle opens. The deltoid ligament is so strong that the force can pull a piece off the tibia first.',real:'A blow to the outside of a planted foot. Only about 3-4% of ankle sprains are eversion sprains, but they tend to be more serious.'},
 er:{t:'External rotation with dorsiflexion',art:ANKLE,test:'Squeeze test and external rotation test',
   rows:p=>{const f=clamp(.6-.4*p.pf/20,.4,1);return [row('aitfl','','lig',16,0,f),row('pitfl','','lig',12,25,f),row('iom','','lig',10,50,f,'ap'),row('deltoid','','lig',6,55,f,'honors')];},
   how:'The talus wedges and twists in the mortise and levers the tibia and fibula apart. This is a high ankle sprain.',real:'A planted foot with the body turning over it, or a player falling on the back of the leg. These take longer to heal than a lateral sprain.'},
 eval:{t:'Valgus',art:ELBOW,test:'Valgus stress test (about 20-30° flexion) and milking maneuver',
   rows:p=>[row('ucl','','lig',15,0,.6+.4*Math.min(p.flex,60)/60),row('medep','','bone',8,50,1,'honors'),row('ulnarn','','nerve',6,45,1,'ap')],
   how:'The forearm is pushed outward and the medial elbow opens. The UCL is the main restraint.',real:'The cocking phase of a throw, or a fall on an outstretched arm. Repeated throwing loads it again and again.'},
 evar:{t:'Varus',art:ELBOW,test:'Varus stress test',
   rows:()=>[row('rcl','','lig',14,0)],
   how:'The forearm is pushed inward and the lateral elbow opens. The radial collateral ligament takes the load.',real:'Less common in sport, because the body usually shields this side.'},
 sant:{t:'Abducted, externally rotated arm forced back',art:SHOULDER,test:'Apprehension test, sulcus sign',
   rows:()=>[row('capsule','','lig',15,0),row('labrum','','cart',11,20,1,'honors'),row('subscap','Subscapularis','mus',6,40),row('axnerve','','nerve',7,60,1,'ap')],
   how:'The arm levers the humeral head forward and down over the shallow glenoid. The result is an anterior inferior dislocation.',real:'A high tackle with the arm out, or a volleyball block forced back. The athlete holds the arm out from the side.'},
 sac:{t:'Fall on the point of the shoulder',art:SHOULDER,test:'AC compression (shear) test',
   rows:()=>[row('acl_s','','lig',16,0),row('ccl','','lig',11,40)],
   how:'The acromion is driven down while the clavicle stays up. The AC ligament goes first, then the coracoclavicular ligaments.',real:'A fall onto the top of the shoulder, common in football, hockey and biking.'}
};
function mechKey(sim){const p=sim.p,j=p.joint;if(j==='knee')return kneeMech(p);if(j==='ankle')return p.fa;if(j==='elbow')return p.fe==='val'?'eval':'evar';if(j==='shoulder')return p.fs==='ant'?'sant':'sac';return null;}
function hasModel(j){return !!JOINTS[j].stress;}
function stressRows(sim){if(sim.p.view!=='stress')return [];const m=MECH[mechKey(sim)];if(!m)return [];const F=sim.p.F;
  return m.rows(sim.p).filter(r=>atLeast(r.lvl)).map(r=>{const s=r.gain*Math.max(0,F-r.onset)/100*r.f;return {id:r.id,n:r.n||LIGS[r.id]||r.id,kind:r.kind,s,z:zone(s)};});}
const STAGE_T={sant:'Arm forced back',er:'External rotation',att:'Anterior translation',ptt:'Posterior translation',rot:'Rotation, planted foot',pat:'Patella pushed lateral',sac:'Fall on the shoulder'};
const PILL={aitfl:'AITFL',pitfl:'PITFL',iom:'IOM',labrum:'Labrum',capsule:'Capsule',deltoid:'Deltoid lig.',ulnarn:'Ulnar nerve',axnerve:'Axillary n.',mmen:'Med. meniscus',lmen:'Lat. meniscus'};
/* The structure a real exam would report first: highest strain among ligaments, or, if none is loaded, anything else. */
function topRow(sim){const rows=stressRows(sim);if(!rows.length)return null;const lig=rows.filter(r=>r.kind==='lig');return (lig.length?lig:rows).slice().sort((a,b)=>b.s-a.s)[0];}
function rowResult(r){if(r.kind==='lig')return ['Normal','Grade I','Grade II','Grade III'][r.z];
  if(r.kind==='cart')return ['Normal','Stressed','Tear possible','Tear likely'][r.z];
  if(r.kind==='bone')return ['Normal','Stressed','Avulsion possible','Avulsion likely'][r.z];
  if(r.kind==='nerve')return ['Normal','Tension','Tingling likely','Injury possible'][r.z];
  return ['Normal','Stressed','Strain possible','Strain likely'][r.z];}
const GRADE=['No sprain. The ligament stretches and springs back.',
 'Grade I: the least severe. The ligament stretches with microscopic tearing. Weight bearing OK, ROM and strength WNL.',
 'Grade II: partial tear. Joint laxity, antalgic gait, ROM and strength down.',
 'Grade III: complete tear. Non weight bearing, significant swelling.'];

/* Where bones go. Motion is exaggerated so a phone screen can show it. */
function poses(sim,M,mk,ease){const p=sim.p,top=ease.top,T={prox:{},dist:{},pat:{},fib:{},scap:{},hum:{},clav:{}},ang=x=>x*Math.PI/180;
  const tear=ease.top3;
  if(mk==='att'||mk==='ptt'){const sign=mk==='att'?1:-1,tr=sign*(top*2.2+tear*14),fl=ang(p.flex);T.dist={rot:fl,px:KC[0],py:KC[1]};T.pat={rot:fl/2,px:KC[0],py:KC[1]};
    if(p.bone==='tibia'){T.dist.dx=tr*Math.cos(fl);T.dist.dy=tr*Math.sin(fl);}else{T.prox={dx:-tr};T.pat.dx=-tr;}}
  else if(mk==='valgus'||mk==='varus'){const a=(mk==='valgus'?1:-1)*ang(top*1.1+tear*5);if(p.bone==='tibia')T.dist={rot:a,px:400,py:238};else{T.prox={rot:-a,px:400,py:238};T.pat={rot:-a,px:400,py:238};}}
  else if(mk==='rot'){T.prox={dx:top*.5};T.pat={dx:top*.5};}
  else if(mk==='pat'){T.pat={dx:-(top*3.2+tear*30)};}
  else if(mk==='inv'||mk==='ev'){const a=(mk==='inv'?-1:1)*ang(top*1.6+tear*5);T.dist={rot:a,px:400,py:262};}
  else if(mk==='er'){T.fib={dx:-(top*1.6+tear*7)};T.dist={dx:-top*.6};}
  else if(mk==='eval'||mk==='evar'){const a=(mk==='eval'?1:-1)*ang(top*1.1+tear*5);T.dist={rot:a,px:400,py:232};}
  else if(mk==='sant'){T.hum={dx:top*1.7+tear*40,dy:top*1.2+tear*42};}
  else if(mk==='sac'){T.scap={dy:top*1.2+tear*8};T.hum={dy:top*1.2+tear*8};}
  return T;}
function xf(pt,t){if(!t)return pt;let x=pt[0],y=pt[1];if(t.rot){const c=Math.cos(t.rot),s=Math.sin(t.rot),dx=x-t.px,dy=y-t.py;x=t.px+dx*c-dy*s;y=t.py+dx*s+dy*c;}return [x+(t.dx||0),y+(t.dy||0)];}
function applyT(ctx,t){if(!t)return;if(t.dx||t.dy)ctx.translate(t.dx||0,t.dy||0);if(t.rot){ctx.translate(t.px,t.py);ctx.rotate(t.rot);ctx.translate(-t.px,-t.py);}}

/* ---------- drawing ---------- */
const colorOf=(a,strain)=>{if(strain!==undefined&&strain!==null)return strain>=10?PAL['s1']:strain>=4?PAL['s4']:PAL['s3'];return PAL[KIND[a.k].c];};
function drawStruct(ctx,a,o){const T=o.T||{},sel=o.sel===a.id,faded=o.fade&&!sel,s=o.strain?o.strain[a.id]:undefined;ctx.save();
  const isLine=!!a.pts;ctx.globalAlpha=faded?.45:1;
  if(o.mute&&a.k!=='bone'&&a.k!=='land'&&s===undefined){drawMuted(ctx,a,T);ctx.restore();return;}
  if(!isLine){const p=pathOf(a);applyT(ctx,T[a.g]);
    if(a.ring){ctx.strokeStyle=sel?PAL['cv-ink']:PAL[KIND[a.k].c];ctx.lineWidth=sel?3.5:2.2;ctx.setLineDash([5,4]);if(sel){ctx.fillStyle=PAL['s6'];ctx.globalAlpha=.25;ctx.fill(p);ctx.globalAlpha=1;}ctx.stroke(p);}
    else if(a.k==='bone'||a.k==='land'){ctx.fillStyle=sel?PAL['cv-e']:a.dash?'transparent':PAL['cv-tail'];if(a.k==='land'&&!sel){ctx.fillStyle=PAL['s6'];ctx.globalAlpha=.55;}
      else ctx.globalAlpha=1;if(a.dash)ctx.setLineDash([5,4]);ctx.fill(p);ctx.globalAlpha=1;ctx.strokeStyle=sel?PAL['cv-ink']:PAL['cv-soft'];ctx.lineWidth=sel?3:1.5;ctx.stroke(p);}
    else{ctx.fillStyle=PAL[KIND[a.k].c];ctx.globalAlpha=(sel?.55:.26)*(faded?.7:1);ctx.fill(p);ctx.globalAlpha=faded?.45:1;if(a.dash)ctx.setLineDash([5,4]);ctx.strokeStyle=sel?PAL['cv-ink']:PAL[KIND[a.k].c];ctx.lineWidth=sel?3:1.3;ctx.stroke(p);}
    ctx.restore();return;}
  const lines=[a.pts];if(a.alt)lines.push(a.alt);if(a.alt2)lines.push(a.alt2);
  lines.forEach(ptsRaw=>{const pg=a.pg||[];const pts=ptsRaw.map((q,i)=>xf(q,T[pg[Math.min(i,pg.length-1)]]));
    ctx.lineCap='round';ctx.lineJoin='round';if(a.dash)ctx.setLineDash([7,6]);
    const col=colorOf(a,s),w=a.w;
    if(sel){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=w+5;ctx.globalAlpha=1;strokePts(ctx,pts);}
    ctx.strokeStyle=col;ctx.lineWidth=w;ctx.globalAlpha=(a.soft?(sel?.7:.34):1)*(faded?.6:1);
    if(s!==undefined&&s>=10&&a.k==='lig'&&pts.length===2){ /* a torn ligament: two frayed stubs with a gap */
      const m=[(pts[0][0]+pts[1][0])/2,(pts[0][1]+pts[1][1])/2];[0,1].forEach(i=>{const e=pts[i];const q=[e[0]+(m[0]-e[0])*.72,e[1]+(m[1]-e[1])*.72];strokePts(ctx,[e,q]);});}
    else strokePts(ctx,pts);
    ctx.setLineDash([]);});
  ctx.restore();}
function drawMuted(ctx,a,T){ctx.globalAlpha=a.k==='lig'?.55:.18;
  if(a.pts){const pg=a.pg||[];[a.pts,a.alt,a.alt2].forEach(ln=>{if(!ln)return;const pts=ln.map((q,i)=>xf(q,T[pg[Math.min(i,pg.length-1)]]));ctx.lineCap='round';ctx.lineJoin='round';if(a.dash)ctx.setLineDash([7,6]);ctx.strokeStyle=a.k==='lig'?PAL['cv-soft']:PAL[KIND[a.k].c];ctx.lineWidth=a.w;strokePts(ctx,pts);ctx.setLineDash([]);});}
  else{applyT(ctx,T[a.g]);ctx.fillStyle=PAL[KIND[a.k].c];ctx.fill(pathOf(a));}}
function strokePts(ctx,pts){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);if(pts.length<3)ctx.lineTo(pts[1][0],pts[1][1]);else{for(let i=1;i<pts.length-1;i++){const m=[(pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2];if(i===pts.length-2)ctx.quadraticCurveTo(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1]);else ctx.quadraticCurveTo(pts[i][0],pts[i][1],m[0],m[1]);}}ctx.stroke();}

/* Full name when it fits the column, the real abbreviation when it does not. */
function fitName(ctx,a,w,size){ctx.font='600 '+size+'px '+BioLab.h.FONT;return ctx.measureText(a.n).width<=w?a.n:(a.sh||a.n);}
function layoutLabels(ctx,sim,list,k,X){const size=13*k,sp=size*1.32,top=size+2,bot=500-6;const j=JOINTS[sim.p.joint],out=[];
  const xcol=side=>side==='L'?X.l:X.r;
  ['L','R'].forEach(side=>{const items=list.filter(a=>(a.side||(a.at[0]<400?'L':'R'))===side).map(a=>({a,ay:a.at[1]*j.ex.s+j.ex.oy+(a.at[0]-400)*0}));
    items.sort((p,q)=>p.ay-q.ay);let y=top;items.forEach(it=>{it.y=Math.max(it.ay,y);y=it.y+sp;});
    let over=(items.length?items[items.length-1].y:0)-bot;if(over>0){let lim=bot;for(let i=items.length-1;i>=0;i--){it_set(items[i]);function it_set(it){it.y=Math.min(it.y,lim);lim=it.y-sp;}}}
    items.forEach(it=>{const w=X.w,label=fitName(ctx,it.a,w,size);out.push({a:it.a,side,y:it.y,label,x:xcol(side)});});});
  return out;}
function artXf(j){const e=JOINTS[j].ex;return {s:e.s,ox:400*(1-e.s)+e.ox,oy:e.oy};}
const toScreen=(pt,x)=>[pt[0]*x.s+x.ox,pt[1]*x.s+x.oy];

function drawLabels(ctx,sim,k,list,sel){const size=13*k,X={l:236,r:564,w:226};const labs=layoutLabels(ctx,sim,list,k,X),x=artXf(sim.p.joint);sim.vis.lab=[];
  ctx.lineWidth=1;labs.forEach(L=>{const pt=toScreen(L.a.at,x),on=sel===L.a.id;
    ctx.strokeStyle=on?PAL['cv-ink']:PAL['cv-soft'];ctx.globalAlpha=on?1:.6;ctx.beginPath();ctx.moveTo(L.x+(L.side==='L'?4:-4),L.y-size*.32);ctx.lineTo(pt[0],pt[1]);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(pt[0],pt[1],on?3.5:2.4,0,6.3);ctx.fill();
    ctx.font=(on?'700 ':'600 ')+size+'px '+BioLab.h.FONT;const w=ctx.measureText(L.label).width,x0=L.side==='L'?L.x-w:L.x;
    if(on){ctx.fillStyle=PAL['cv-e'];rr(ctx,x0-5,L.y-size*1.02,w+10,size*1.34,5);ctx.fill();}
    txt(ctx,L.label,L.side==='L'?L.x:L.x,L.y,{s:size,w:on?700:600,c:on?'#1c1c1f':PAL['cv-ink'],a:L.side==='L'?'right':'left'});
    sim.vis.lab.push({id:L.a.id,x:x0-4,y:L.y-size*1.1,w:w+8,h:size*1.45});});}

function sideTags(ctx,sim,k,j,x0,x1,y){const J=JOINTS[j];txt(ctx,J.left,x0,y,{s:12*k,w:700,c:PAL['muted']});txt(ctx,J.right,x1,y,{s:12*k,w:700,c:PAL['muted'],a:'right'});}

function drawExplore(sim,ctx,k){const j=sim.p.joint,list=visArt(j),x=artXf(j),sel=currentSel(sim);
  ctx.save();ctx.translate(x.ox,x.oy);ctx.scale(x.s,x.s);list.forEach(a=>drawStruct(ctx,a,{sel,fade:true}));ctx.restore();
  drawLabels(ctx,sim,k,list,sel);
  txt(ctx,JOINTS[j].left,6,492,{s:12*k,w:700,c:PAL['muted']});txt(ctx,JOINTS[j].right,794,492,{s:12*k,w:700,c:PAL['muted'],a:'right'});}

function drawPractice(sim,ctx,k){const j=sim.p.joint,list=visArt(j),x=artXf(j),P=practice(sim),cur=P.cur,a=list.find(q=>q.id===cur);
  ctx.save();ctx.translate(x.ox,x.oy);ctx.scale(x.s,x.s);list.forEach(q=>drawStruct(ctx,q,{sel:cur,fade:true}));ctx.restore();
  sim.vis.lab=[];
  if(a){const pt=toScreen(a.at,x),side=a.at[0]<400?'L':'R',lx=side==='L'?140:660,ly=clamp(pt[1],40,450),text=P.answered?a.n:'?';
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(pt[0],pt[1]);ctx.stroke();ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(pt[0],pt[1],4,0,6.3);ctx.fill();
    const size=15*k;ctx.font='700 '+size+'px '+BioLab.h.FONT;const short=P.answered&&ctx.measureText(text).width>250?(a.sh||a.n):text;
    pill(ctx,short,clamp(lx,10+ctx.measureText(short).width/2+size,790-ctx.measureText(short).width/2-size),ly,PAL['cv-e'],'#1c1c1f',size);}
  txt(ctx,JOINTS[j].left,6,492,{s:12*k,w:700,c:PAL['muted']});txt(ctx,JOINTS[j].right,794,492,{s:12*k,w:700,c:PAL['muted'],a:'right'});}

function arrow(ctx,x1,y1,x2,y2,w,c){const a=Math.atan2(y2-y1,x2-x1),h=w*2.6;ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=w;ctx.lineCap='butt';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*h*.8,y2-Math.sin(a)*h*.8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-Math.cos(a-.5)*h,y2-Math.sin(a-.5)*h);ctx.lineTo(x2-Math.cos(a+.5)*h,y2-Math.sin(a+.5)*h);ctx.closePath();ctx.fill();}
function arcArrow(ctx,cx,cy,r,a0,a1,w,c){ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.arc(cx,cy,r,a0,a1,a1<a0);ctx.stroke();const dir=a1<a0?-1:1,ex=cx+Math.cos(a1)*r,ey=cy+Math.sin(a1)*r,t=a1+dir*Math.PI/2,h=w*2.8;
  ctx.beginPath();ctx.moveTo(ex+Math.cos(t)*h,ey+Math.sin(t)*h);ctx.lineTo(ex+Math.cos(t+2.5)*h*.75,ey+Math.sin(t+2.5)*h*.75);ctx.lineTo(ex+Math.cos(t-2.5)*h*.75,ey+Math.sin(t-2.5)*h*.75);ctx.closePath();ctx.fill();}

function forceArrow(ctx,sim,mk,T,F,k){if(F<=0)return;const p=sim.p,c=PAL['s1'],L=30+F*.75,w=4+F*.05;
  if(p.joint==='knee'){
    if(mk==='att'||mk==='ptt'){const dirA=p.fk==='ant'?1:-1;
      if(p.bone==='tibia'){const fl=p.flex*Math.PI/180;const base=xf([dirA>0?245:335,360],T.dist),ux=Math.cos(fl)*dirA,uy=Math.sin(fl)*dirA;arrow(ctx,base[0]-ux*L,base[1]-uy*L,base[0]-ux*3,base[1]-uy*3,w,c);}
      else{const base=xf([dirA>0?248:332,70],T.prox);arrow(ctx,base[0]-dirA*L,base[1],base[0]-dirA*3,base[1],w,c);}}
    else if(p.fk==='fromlat'||p.fk==='frommed'){const fromL=p.fk==='fromlat',y=p.bone==='tibia'?440:140,tt=p.bone==='tibia'?T.dist:T.prox,base=xf([fromL?(p.bone==='tibia'?352:338):(p.bone==='tibia'?448:462),y],tt);
      arrow(ctx,base[0]+(fromL?-L:L),base[1],base[0]+(fromL?-3:3),base[1],w,c);}
    else if(mk==='rot'){arcArrow(ctx,400,120,62,Math.PI*.15,Math.PI*.85,w*.9,c);ctx.save();ctx.restore();}
    else if(mk==='pat'){const base=xf([434,135],T.pat);arrow(ctx,base[0]+L,base[1],base[0]+3,base[1],w,c);}}
  else if(p.joint==='ankle'){if(mk==='inv')arcArrow(ctx,400,395,92,Math.PI*.95,Math.PI*.35,w*.9,c);else if(mk==='ev')arcArrow(ctx,400,395,92,Math.PI*.05,Math.PI*.65,w*.9,c);else arcArrow(ctx,400,460,50,Math.PI*.95,Math.PI*.05,w*.9,c);}
  else if(p.joint==='elbow'){const onMed=mk==='eval',base=xf([onMed?440:322,440],T.dist);arrow(ctx,base[0]+(onMed?L:-L),base[1],base[0]+(onMed?3:-3),base[1],w,c);}
  else if(p.joint==='shoulder'){if(mk==='sant'){const base=xf([215,330],T.hum);arrow(ctx,base[0]-L*.8,base[1]+L*.6,base[0],base[1],w,c);}else{const base=xf([268,70],T.scap);arrow(ctx,base[0],base[1]-L,base[0],base[1]-3,w,c);}}}

function footInset(ctx,sim,k){const pf=sim.p.pf,cx=405,cy=400,a=pf*Math.PI/180;ctx.save();ctx.translate(cx,cy);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-34);ctx.lineTo(0,0);ctx.stroke();ctx.rotate(a);ctx.strokeStyle=PAL['s2'];ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(44,0);ctx.stroke();ctx.restore();
  const lab=pf>0?pf+'° plantar':pf<0?(-pf)+'° dorsi':'Neutral';txt(ctx,lab,476,490,{s:12*k,w:600,c:PAL['cv-soft'],a:'right'});txt(ctx,'Foot, side view',476,490-14*k,{s:12*k,c:PAL['muted'],a:'right'});}

function drawBars(ctx,sim,k,rows){const x0=490,x1=790,W=x1-x0,size=13*k,max=14,X=v=>x0+Math.min(v,max)/max*W;let y=26*k*.8+6;
  txt(ctx,'Strain',x0,y,{s:size,w:700,c:PAL['cv-ink']});
  const zy=y+6;[[4,'I'],[6,'II'],[10,'III']].forEach(z=>{txt(ctx,z[1],X(z[0]),y,{s:size*.92,w:700,c:PAL['cv-soft'],a:'left'});});
  y=zy+6;const rowH=Math.max(52,size*2.3+18);
  rows.forEach(r=>{const e=sim.vis.es[r.id]||0;y+=size;txt(ctx,r.n,x0,y,{s:size,w:600});txt(ctx,r.s.toFixed(1)+'%',x1,y,{s:size,w:700,a:'right',c:PAL['cv-ink']});y+=5;
    const bh=14;ctx.fillStyle=PAL['cv-bg2'];rr(ctx,x0,y,W,bh,4);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,x0,y,W,bh,4);ctx.stroke();
    if(e>0.02){ctx.fillStyle=r.z===0?PAL['s3']:r.z===3?PAL['s1']:PAL['s4'];rr(ctx,x0,y,Math.max(4,X(e)-x0),bh,4);ctx.fill();}
    ctx.strokeStyle=PAL['cv-soft'];[4,6,10].forEach(v=>{ctx.beginPath();ctx.moveTo(X(v),y-2);ctx.lineTo(X(v),y+bh+2);ctx.stroke();});
    y+=bh+size*1.15;txt(ctx,rowResult(r),x0,y,{s:size*.95,c:r.z===0?PAL['cv-soft']:r.z===3?PAL['s1']:PAL['s4'],w:r.z?700:400});y+=size*.75;});}

function drawStress(sim,ctx,vdt,k){const j=sim.p.joint;
  if(!hasModel(j)){drawExplore(sim,ctx,k);ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['line'];rr(ctx,150,190,500,120,10);ctx.fill();ctx.stroke();
    txt(ctx,'No stress model for this joint',400,232,{s:15*k,w:700,a:'center'});txt(ctx,'Use knee, ankle, shoulder or elbow.',400,232+22*k,{s:13*k,a:'center',c:PAL['cv-soft']});return;}
  const mk=mechKey(sim),M=MECH[mk],rows=stressRows(sim),v=sim.vis;v.lab=[];if(!v.es)v.es={};
  const blend=RM?1:1-Math.exp(-(vdt||0)*6);rows.forEach(r=>{const cur=v.es[r.id]||0;v.es[r.id]=vdt===0&&v.primed?cur:cur+(r.s-cur)*blend;});
  const lig=rows.filter(r=>r.kind!=='mus'),prim=lig.slice().sort((a,b)=>b.s-a.s)[0]||{s:0,id:''},e=v.es[prim.id]||0;
  /* A dislocating patella or humerus, a separated AC joint and a torn ligament jump further than strain alone. */
  const top3=clamp((e-9)/2,0,1),T=poses(sim,M,mk,{top:Math.min(e,14),top3});
  const strain={};rows.forEach(r=>{strain[r.id]=v.es[r.id];});
  const art=M.art.filter(a=>atLeast(a.lvl)||M.art===KNEE_SIDE||strain[a.id]!==undefined),side=M.art===KNEE_SIDE;
  const s=j==='shoulder'?.8:side?1:.96,cx=side?300:(j==='shoulder'?250:240),ox=side?(cx-KC[0]):(cx-400*s),oy=side?30:(j==='shoulder'?45:18);
  ctx.save();ctx.beginPath();ctx.rect(0,0,484,500);ctx.clip();ctx.translate(ox,oy);ctx.scale(s,s);
  art.forEach(a=>{if(strain[a.id]===undefined)drawStruct(ctx,a,{T,sel:null,mute:true});});
  art.forEach(a=>{if(strain[a.id]!==undefined)drawStruct(ctx,a,{T,sel:null,strain});});
  forceArrow(ctx,sim,mk,T,sim.p.F,k);ctx.restore();
  /* labels on the art */
  const tagSize=13*k,sc=(pt,gr)=>{const q=xf(pt,T[gr]);return [q[0]*s+ox,q[1]*s+oy];};
  ctx.font='700 '+tagSize+'px '+BioLab.h.FONT;txt(ctx,ctx.measureText(M.t).width>468?(STAGE_T[mk]||M.t):M.t,8,tagSize+2,{s:tagSize,w:700,c:PAL['cv-ink']});
  if(side){txt(ctx,'Anterior',476,tagSize*2+10,{s:12*k,w:700,c:PAL['muted'],a:'right'});txt(ctx,'Posterior',8,tagSize*2+10,{s:12*k,w:700,c:PAL['muted']});
    const a=sc([290,40],'prox');pill(ctx,'Femur',a[0],a[1]+6,'#5a5a62','#fff',12*k);const b=sc([292,400],'dist');pill(ctx,'Tibia',b[0],b[1],'#5a5a62','#fff',12*k);}
  else{const J=JOINTS[j];txt(ctx,J.left,8,tagSize*2+10,{s:12*k,w:700,c:PAL['muted']});txt(ctx,J.right,476,tagSize*2+10,{s:12*k,w:700,c:PAL['muted'],a:'right'});
    const tags={knee:[['Femur',[400,50],'prox'],['Tibia',[400,440],'dist']],ankle:[['Tibia',[400,80],'prox'],['Calcaneus',[400,400],'dist'],['Talus',[400,285],'dist']],elbow:[['Humerus',[400,70],'prox'],['Ulna',[408,420],'dist']],shoulder:[['Humerus',[250,420],'hum'],['Scapula',[410,270],'scap'],['Clavicle',[430,100],'clav']]}[j];
    tags.forEach(g=>{const q=sc(g[1],g[2]);pill(ctx,g[0],q[0],q[1],'#5a5a62','#fff',12*k);});}
  /* name the loaded ligaments right on the art */
  const placed=[],acx=(side?KC[0]+10:(j==='shoulder'?330:400))*s+ox;rows.forEach(r=>{const a=art.find(q=>q.id===r.id);if(!a||!a.pts)return;const pg=a.pg||[],pts=a.pts,last=pts.length-1,q0=xf(pts[0],T[pg[0]]),q1=xf(pts[last],T[pg[Math.min(last,pg.length-1)]]),m=[(q0[0]+q1[0])/2*s+ox,(q0[1]+q1[1])/2*s+oy];
    const nm=PILL[r.id]||a.sh||a.n,fs=12*k;ctx.font='700 '+fs+'px '+BioLab.h.FONT;const w=ctx.measureText(nm).width+fs*1.1;
    const dir=side?(r.id==='pcl'?-1:1):(m[0]<acx?-1:1);let x=clamp(m[0]+dir*(w/2+34),w/2+2,482-w/2),y=m[1];while(placed.some(b=>Math.abs(b.x-x)<(b.w+w)/2+2&&Math.abs(b.y-y)<fs*1.85))y+=fs*1.85;placed.push({x,y,w,nm,m});});
  placed.forEach(g=>{ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(g.x,g.y);ctx.lineTo(g.m[0],g.m[1]);ctx.stroke();pill(ctx,g.nm,g.x,g.y,PAL['card'],PAL['cv-ink'],12*k);});
  if(j==='ankle')footInset(ctx,sim,k);
  if((j==='knee'||j==='elbow')&&!side)txt(ctx,sim.p.flex+'° flexion',8,490,{s:12*k,w:600,c:PAL['cv-soft']});
  if(side)txt(ctx,sim.p.flex+'° flexion',476,490,{s:12*k,w:600,c:PAL['cv-soft'],a:'right'});
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(484,0);ctx.lineTo(484,500);ctx.stroke();
  drawBars(ctx,sim,k,rows);v.primed=true;}

/* ---------- explore and practice state ---------- */
function currentSel(sim){const j=sim.p.joint,list=visArt(j);let id=sim.st.sel[j];if(!list.some(a=>a.id===id))id=JOINTS[j].def;return id;}
function setSel(sim,id){sim.st.sel[sim.p.joint]=id;sim.infoDirty=true;}
function stepSel(sim,d){const list=orderedList(sim),i=list.findIndex(a=>a.id===currentSel(sim));setSel(sim,list[(i+d+list.length)%list.length].id);}
function orderedList(sim){const list=visArt(sim.p.joint),out=[];KORDER.forEach(k=>list.forEach(a=>{if(a.k===k)out.push(a);}));return out;}
function practice(sim){const j=sim.p.joint,key=j+'|'+visArt(j).length;let P=sim.st.pr[key];if(!P){P=sim.st.pr[key]={key,deck:[],done:0,right:0,miss:{},cur:null,answered:false,choices:[],draft:'',msg:''};nextQ(sim,P);}return P;}
function shuffle(a){for(let i=a.length-1;i>0;i--){const n=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[n];a[n]=t;}return a;}
function nextQ(sim,P){const list=visArt(sim.p.joint);if(!P.deck.length)P.deck=shuffle(list.map(a=>a.id));P.cur=P.deck.shift();P.answered=false;P.draft='';P.msg='';P.ok=null;
  const a=list.find(q=>q.id===P.cur)||list[0];P.cur=a.id;const same=shuffle(list.filter(q=>q.id!==a.id&&(q.k===a.k||(q.k==='land'&&a.k==='bone')||(q.k==='bone'&&a.k==='land')))),rest=shuffle(list.filter(q=>q.id!==a.id&&!same.includes(q)));
  P.choices=shuffle([a.id].concat(same.concat(rest).slice(0,3).map(q=>q.id)));sim.infoDirty=true;}
function lev(a,b){const d=[];for(let i=0;i<=a.length;i++){d[i]=[i];for(let j=1;j<=b.length;j++)d[i][j]=i?Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)):j;}return d[a.length][b.length];}
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function nameOK(a,val){const v=norm(val);if(!v)return false;const n=norm(a.n);if(v===n||(a.sh&&v===norm(a.sh)))return true;return n.length>4&&lev(v,n)<=Math.max(1,Math.floor(n.length/6));}
function answer(sim,ok,P){if(P.answered)return;P.answered=true;P.ok=ok;P.done++;if(ok)P.right++;else P.deck.splice(Math.min(2,P.deck.length),0,P.cur);sim.infoDirty=true;}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function infoPanel(sim){const p=sim.p,j=p.joint,J=JOINTS[j];
  if(p.view==='practice'){const P=practice(sim),list=visArt(j),a=list.find(q=>q.id===P.cur);if(!a)return '';const typed=atLeast('ap');
    let h=`<h3>Name the highlighted structure</h3><p>${J.view}. No timer. Right so far: <b>${P.right}</b> of ${P.done}.</p>`;
    if(!P.answered){if(typed)h+=`<label for="jt-type">Type the name</label><div class="row"><input id="jt-type" class="vl-in" autocomplete="off" value="${esc(P.draft)}"><button type="button" class="btn primary" data-pa="check">Check</button></div><p class="help">Close spellings count. Abbreviations such as ATFL count too.</p>`;
      else h+=`<div class="choices">${P.choices.map(id=>{const q=list.find(x=>x.id===id);return `<button type="button" class="choice" data-pc="${id}">${q.n}</button>`;}).join('')}</div>`;}
    else{h+=`<p class="verdict ${P.ok?'ok':'no'}">${P.ok?'Correct.':'Not quite.'} This is the <b>${a.n}</b>${a.sh&&a.sh!==a.n?' ('+a.sh+')':''}.</p><p>${a.i}</p><div class="row"><button type="button" class="btn primary" data-pa="next">Next structure</button></div>`;}
    return h;}
  if(p.view==='stress'){if(!hasModel(j))return `<h3>${J.n}</h3><p>The stress model covers the knee, ankle, shoulder and elbow. Use Explore and Label practice for this joint.</p>`;
    const mk=mechKey(sim),M=MECH[mk],t=topRow(sim);
    let h=`<h3>${M.t}</h3><p>${M.how}</p><p><b>How it happens:</b> ${M.real}</p>`;
    if(atLeast('honors'))h+=`<p><b>Stress test an athletic trainer would use:</b> ${M.test}.</p>`;
    h+=`<p><b>Right now:</b> ${t?(t.kind==='lig'?GRADE[t.z]:t.n+': '+rowResult(t)+'.'):'Nothing loaded.'}</p>`;
    if(mk==='pat'&&topRow(sim)&&topRow(sim).z===3)h+='<p>The patella has dislocated laterally.</p>';
    if(mk==='sant'&&topRow(sim)&&topRow(sim).z===3)h+='<p>The humeral head has left the glenoid: an anterior inferior dislocation.</p>';
    h+=`<p class="help">Educational model. Athletes with a joint injury need evaluation by an athletic trainer or physician.</p>`;return h;}
  const sel=currentSel(sim),a=visArt(j).find(q=>q.id===sel);let h='';
  if(a){h+=`<h3>${a.n}${a.sh&&a.sh!==a.n?' ('+a.sh+')':''}</h3><p><b style="color:var(--${KIND[a.k].c})">${KIND[a.k].l.replace(/s and .*$/,'').replace(/s$/,'')}.</b> ${a.i}</p>`;if(a.x)h+=`<p>${a.x}</p>`;}
  const list=orderedList(sim),groups=[];list.forEach(q=>{const l=KIND[q.k].l,g=groups.find(x=>x.l===l);if(g)g.items.push(q);else groups.push({l,items:[q],c:KIND[q.k].c});});
  groups.forEach(g=>{h+=`<p style="margin:8px 0 4px;font-size:14px;font-weight:700;color:var(--${g.c})">${g.l}</p><div class="row" style="flex-wrap:wrap;gap:4px">${g.items.map(q=>`<button type="button" class="btn" data-sel="${q.id}"${q.id===sel?' aria-pressed="true" style="font-size:14px;padding:3px 9px;border-color:var(--fg)"':' style="font-size:14px;padding:3px 9px"'}>${q.sh&&q.n.length>18?q.sh:q.n}</button>`).join('')}</div>`;});
  return h;}
function bindInfo(sim,el){el.querySelectorAll('[data-sel]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.sel;setSel(sim,id);BioLab.refresh(sim);const nb=sim.ui.info&&sim.ui.info.querySelector('[data-sel="'+id+'"]');if(nb)nb.focus();}));
  el.querySelectorAll('[data-pc]').forEach(b=>b.addEventListener('click',()=>{const P=practice(sim);answer(sim,b.dataset.pc===P.cur,P);BioLab.refresh(sim);const n=sim.ui.info&&sim.ui.info.querySelector('[data-pa=next]');if(n)n.focus();}));
  const inp=el.querySelector('#jt-type');if(inp){const P=practice(sim),check=()=>{const a=visArt(sim.p.joint).find(q=>q.id===P.cur);P.draft=inp.value;if(!norm(inp.value))return;answer(sim,nameOK(a,inp.value),P);BioLab.refresh(sim);const n=sim.ui.info&&sim.ui.info.querySelector('[data-pa=next]');if(n)n.focus();};
    inp.addEventListener('input',()=>{P.draft=inp.value;});inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();check();}});el.querySelector('[data-pa=check]').addEventListener('click',check);}
  const nx=el.querySelector('[data-pa=next]');if(nx)nx.addEventListener('click',()=>{nextQ(sim,practice(sim));BioLab.refresh(sim);const c=sim.ui.info&&sim.ui.info.querySelector('[data-pc],#jt-type');if(c)c.focus();});}

function sync(sim){if(!sim.ui||!sim.ui.ctlW)return;const p=sim.p,j=p.joint,st=p.view==='stress',model=hasModel(j),show={fk:st&&j==='knee',fa:st&&j==='ankle',fe:st&&j==='elbow',fs:st&&j==='shoulder',bone:st&&j==='knee'&&!['rot','pat'].includes(p.fk),F:st&&model,flex:st&&(j==='knee'||j==='elbow'),pf:st&&j==='ankle'};
  sim.def.controls.forEach(c=>{if(!(c.id in show))return;const w=sim.ui.ctlW[c.id];if(w)w.hidden=!atLeast(c.lvl)||!show[c.id];});
  sim.def.metrics.forEach(m=>{const t=sim.ui.tiles&&sim.ui.tiles[m.id];if(!t)return;const e=t.num.closest('.tile');if(e)e.hidden=!atLeast(m.lvl)||!(st&&model);});
  const ab={prev:p.view==='explore',next:p.view==='explore',zero:st&&model,skip:p.view==='practice'};sim.def.actions.forEach(a=>{const b=sim.ui.actB&&sim.ui.actB[a.id];if(b)b.hidden=!ab[a.id];});
  if(sim.ui.scale)sim.ui.scale.textContent=JOINTS[j].scale;}

const SIM={
  id:'joints',hash:'joints',apUnit:15,order:5,kind:'Simulation',tab:'Joint anatomy and stress tests',
  card:'Explore the knee, ankle, shoulder, elbow, hand and hip. Push a joint in any direction and see which ligament takes the load.',
  title:'Joint anatomy and stress tests',
  lede:{bio:'Learn the bones, ligaments and muscles of each joint, then push the knee or ankle and see which structure takes the load.',
        honors:'Connect each mechanism of injury to the structure it stresses and the special test that checks it.',
        ap:'Reason through position as well as direction: joint angle changes which structure is tight, so the same force can injure a different ligament.'},
  scale:'Each joint is a schematic of the right side of the body.',
  aspect:1.6,timeless:true,graph:false,thumbFrames:1,
  controls:[
    {id:'joint',label:'Joint',type:'seg',def:'knee',lvl:'bio',options:JK.map(k=>({v:k,l:JOINTS[k].n})),onChange(sim){sync(sim);}},
    {id:'view',label:'What to do',type:'seg',def:'explore',lvl:'bio',noTrial:true,options:[{v:'explore',l:'Explore'},{v:'stress',l:'Stress test'},{v:'practice',l:'Label practice'}],onChange(sim){sync(sim);}},
    {id:'fk',label:'Force direction',type:'select',def:'ant',lvl:'bio',noTrial:true,options:[{v:'ant',l:'Push anterior'},{v:'post',l:'Push posterior'},{v:'fromlat',l:'Force from the lateral side'},{v:'frommed',l:'Force from the medial side'},{v:'rot',l:'Rotate on a planted foot'},{v:'pat',l:'Push the patella laterally'}],onChange(sim){sync(sim);}},
    {id:'bone',label:'Force lands on',type:'seg',def:'tibia',lvl:'bio',noTrial:true,help:'Tibia: the thigh is held and the lower leg moves. Femur: the foot is planted and the thigh or knee moves.',options:[{v:'tibia',l:'Tibia'},{v:'femur',l:'Femur'}]},
    {id:'fa',label:'Force direction',type:'select',def:'inv',lvl:'bio',noTrial:true,options:[{v:'inv',l:'Inversion'},{v:'ev',l:'Eversion'},{v:'er',l:'External rotation'}]},
    {id:'fe',label:'Force direction',type:'select',def:'val',lvl:'bio',noTrial:true,options:[{v:'val',l:'Valgus (forearm pushed outward)'},{v:'var',l:'Varus (forearm pushed inward)'}]},
    {id:'fs',label:'Force direction',type:'select',def:'ant',lvl:'bio',noTrial:true,options:[{v:'ant',l:'Abducted, externally rotated arm forced back'},{v:'ac',l:'Fall on the point of the shoulder'}]},
    {id:'F',label:'Force level',type:'range',min:0,max:100,step:5,def:40,unit:'',lvl:'bio',help:'0 is rest and 100 is a severe contact injury. A relative scale, not newtons.'},
    {id:'flex',label:'Joint flexion',type:'range',min:0,max:90,step:5,def:30,unit:'°',lvl:'bio'},
    {id:'pf',label:'Foot position',type:'range',min:-20,max:40,step:5,def:20,unit:'°',lvl:'bio',help:'Above 0 is plantarflexion (toes down). Below 0 is dorsiflexion (toes up).'}
  ],
  actions:[
    {id:'prev',label:'Previous structure',run(sim){if(sim.p.view==='explore')stepSel(sim,-1);}},
    {id:'next',label:'Next structure',primary:true,run(sim){if(sim.p.view==='explore')stepSel(sim,1);}},
    {id:'zero',label:'Release the force',run(sim){BioLab.setValues(sim,{F:0});}},
    {id:'skip',label:'Skip this one',run(sim){if(sim.p.view==='practice'){const P=practice(sim);P.deck.push(P.cur);nextQ(sim,P);}}}
  ],
  init(sim){return {sel:{},pr:{}};},
  onLevel(sim){sync(sim);},
  metrics:[
    {id:'mech',label:'Movement',unit:'',lvl:'bio',text:true,get:s=>{const k=mechKey(s);return s.p.view==='stress'&&MECH[k]?MECH[k].t:'None';}},
    {id:'worst',label:'Most loaded ligament',unit:'',lvl:'bio',text:true,get:s=>{const t=topRow(s);return t&&t.s>0?t.n:'None';}},
    {id:'grade',label:'Outcome',unit:'',lvl:'bio',text:true,get:s=>{const t=topRow(s);return t?rowResult(t):'None';}},
    {id:'strain',label:'Highest ligament strain',unit:'%',lvl:'honors',min:0,max:14,d:1,get:s=>{const t=topRow(s);return t?t.s:0;}}
  ],
  challenges:[
    {lvl:'bio',q:'A teammate’s helmet hits the outside of your knee while your foot is planted. Which ligament takes the load first?',choices:['LCL','MCL','PCL'],correct:1,
     baseline:{view:'stress',joint:'knee',fk:'fromlat',bone:'femur',flex:30,F:0},change:{F:60},changeText:'Force applied',at:.6,reveal:2.5,verify:['worst','MCL'],
     explain:'A blow from the lateral side bends the knee inward, which is valgus. The medial side opens and the MCL stretches. The force is on one side, but the injury is on the other.'},
    {lvl:'bio',q:'In a car crash, a bent knee hits the dashboard and the shin is driven backward. Which ligament takes the load?',choices:['ACL','PCL','MCL'],correct:1,
     baseline:{view:'stress',joint:'knee',fk:'post',bone:'tibia',flex:90,F:0},change:{F:70},changeText:'Force applied',at:.6,reveal:2.5,verify:['worst','PCL'],
     explain:'The tibia moves backward under the femur, and the PCL is what stops that. The names tell you the direction: the posterior cruciate stops posterior movement of the tibia.'},
    {lvl:'bio',q:'You roll your ankle inward with your toes pointed down. A light force is applied. Which ligament is first to reach a sprain?',choices:['CFL','Deltoid ligament','ATFL'],correct:2,
     baseline:{view:'stress',joint:'ankle',fa:'inv',pf:20,F:0},change:{F:30},changeText:'Force applied',at:.6,reveal:2.5,verify:['worst','ATFL'],
     explain:'Inversion opens the lateral side. The ATFL is the weakest lateral ligament and is tightest with the foot plantarflexed, so it goes first. The deltoid is on the medial side and goes slack.'},
    {lvl:'honors',q:'Same force of 70, same 30° of flexion. Which reads lower strain: the ACL under an anterior push, or the PCL under a posterior push?',choices:['ACL','PCL','They are the same'],correct:1,
     baseline:{view:'stress',joint:'knee',fk:'ant',bone:'tibia',flex:30,F:70},change:{fk:'post'},changeText:'Direction switched to posterior',at:1.2,reveal:3,verifyFn:'pclLower',
     explain:'At this angle the ACL reads about 11% and the PCL about 6%. The PCL is the stronger ligament, so the same force stretches it less. Injuring it usually takes a big direct force, like a dashboard.'},
    {lvl:'honors',q:'Your foot is planted and you pivot at force 60. What happens as your knee goes from straight to 60° of flexion?',choices:['Meniscus load rises','Meniscus load falls','Nothing changes'],correct:0,
     baseline:{view:'stress',joint:'knee',fk:'rot',flex:0,F:60},change:{flex:60},changeText:'Knee flexed to 60°',at:1,reveal:3,verifyFn:'meniscusRises',
     explain:'Flexing the knee rolls the femoral condyles back onto the menisci, and twisting then grinds them. That is why McMurray’s test uses flexion plus rotation. Medial meniscus load is higher than lateral because the medial meniscus is held more tightly.'},
    {lvl:'honors',q:'Same force of 60 on the ankle, inversion versus eversion. Which ligament shows the lower sprain grade?',choices:['ATFL under inversion','Deltoid under eversion','They are the same'],correct:1,
     baseline:{view:'stress',joint:'ankle',fa:'inv',pf:20,F:60},change:{fa:'ev'},changeText:'Direction switched to eversion',at:1.2,reveal:3,verifyFn:'deltoidLower',
     explain:'The deltoid is far stronger than the ATFL and the fibula blocks eversion. So eversion sprains are rare, only about 3-4% of ankle sprains. When the force is high enough, it can pull bone off the tibia, so these get an x-ray.'},
    {lvl:'ap',q:'The thigh is held still and the force lands on the lower leg, from the lateral side. Which ligament is loaded?',choices:['MCL, because force from the lateral side always means valgus','LCL, because the lower leg swings medially and the knee goes into varus','PCL'],correct:1,
     baseline:{view:'stress',joint:'knee',fk:'fromlat',bone:'tibia',flex:20,F:0},change:{F:60},changeText:'Force applied',at:.6,reveal:2.5,verify:['worst','LCL'],
     explain:'What counts is how the bones end up relative to each other. A blow at the knee on a planted leg drives the knee in: valgus. A force at the lower leg with the thigh held drives the shin in, so the lateral side opens: varus.'},
    {lvl:'ap',q:'The foot is dorsiflexed 20° and a strong inversion force of 80 hits it. Which lateral ligament is under the most strain?',choices:['ATFL','CFL','PTFL'],correct:1,
     baseline:{view:'stress',joint:'ankle',fa:'inv',pf:-20,F:0},change:{F:80},changeText:'Force applied',at:.6,reveal:2.5,verify:['worst','CFL'],
     explain:'The ATFL is tight in plantarflexion and slack in dorsiflexion. The CFL is the opposite. So the classic order of ATFL first describes the common plantarflexed injury, and foot position can change it.'},
    {lvl:'ap',q:'An athlete’s planted foot is dorsiflexed and the body turns over it. Which ligament is most loaded?',choices:['Anterior tibiofibular ligament','ATFL','Deltoid ligament'],correct:0,
     baseline:{view:'stress',joint:'ankle',fa:'er',pf:-20,F:0},change:{F:60},changeText:'Force applied',at:.6,reveal:2.5,verify:['worst','Ant. tibiofibular'],
     explain:'External rotation and forced dorsiflexion wedge the talus into the mortise and spread the tibia and fibula. That is a high ankle sprain. It loads the anterior and posterior tibiofibular ligaments, above the joint.'}
  ],
  narrate(sim){const p=sim.p,j=p.joint,J=JOINTS[j];
    if(p.view==='practice'){const P=practice(sim);return P.answered?(P.ok?'<b>Correct.</b> Read the card, then press Next structure.':'<b>Look again.</b> The name is on the stage now. It comes back soon.'):'<b>Which structure is highlighted?</b> Use the side labels on the stage to orient: '+J.left.toLowerCase()+' on the left, '+J.right.toLowerCase()+' on the right.';}
    if(p.view==='stress'){if(!hasModel(j))return 'The '+J.n.toLowerCase()+' is here to explore and label. Choose <b>knee, ankle, shoulder or elbow</b> to apply a force.';
      const mk=mechKey(sim),M=MECH[mk],t=topRow(sim),rows=stressRows(sim);
      if(p.F===0)return '<b>'+M.t+', no force yet.</b> Raise the force level and watch the strain bars.';
      if(!t||t.s<=0)return '<b>'+M.t+'.</b> Force is below the level that loads a structure here.';
      if(j==='knee'&&(p.fk==='fromlat'||p.fk==='frommed')){const onTib=p.bone==='tibia';return '<b>'+M.t+'.</b> '+(onTib?'The thigh is held and the shin swings ':'The foot is planted and the knee is driven ')+(p.fk==='fromlat'?'medially':'laterally')+', so the '+t.n+' reads '+t.s.toFixed(1)+'% strain: '+rowResult(t)+'.';}
      if(mk==='pat')return t.z===3?'<b>The patella has dislocated laterally.</b> At '+p.flex+'° of flexion it is '+(p.flex<=30?'not yet seated in its groove':'partly held by its groove')+'.':'<b>The patella is sliding laterally.</b> '+(atLeast('ap')?'The MPFL reads '+t.s.toFixed(1)+'% strain. ':'')+'Flexion past about 30° seats it in the groove on the femur.';
      if(mk==='sant'&&t.z===3)return '<b>Anterior inferior dislocation.</b> The humeral head has left the shallow glenoid and moved forward and down.';
      const others=rows.filter(r=>r.id!==t.id&&r.z>0).map(r=>r.n);
      return '<b>'+t.n+': '+rowResult(t)+'.</b> '+M.how.split('. ')[0]+'. Strain is '+t.s.toFixed(1)+'%.'+(others.length?' Also stressed: '+others.join(', ')+'.':'');}
    const a=visArt(j).find(q=>q.id===currentSel(sim));return a?'<b>'+a.n+'.</b> '+a.i:'';},
  tour:[
    {title:'Start with the structures',text:'This is a right knee from the front, so lateral is on your left. The femur sits on the tibia, with two cruciate ligaments in the center and a collateral ligament on each side. Tap any label or use the buttons below.',focus:[0,0,800,500],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{view:'explore',joint:'knee'});setSel(sim,'acl');}},
    {title:'Tibia forward: ACL',text:'Now the side view, with anterior on your right. Push the tibia forward under the femur. The ACL goes tight and the strain bar climbs. A Lachman test checks this exact motion.',focus:[0,0,484,500],speed:1,setup(sim){BioLab.setValues(sim,{view:'stress',joint:'knee',fk:'ant',bone:'tibia',flex:30,F:55});}},
    {title:'Tibia backward: PCL',text:'A bent knee hits a dashboard and the shin goes backward. Now the PCL takes the load. It is stronger than the ACL, so the same force reads less strain.',focus:[0,0,484,500],speed:1,setup(sim){BioLab.setValues(sim,{fk:'post',flex:90,F:55});}},
    {title:'A hit from the side: MCL',text:'The foot is planted and a blow lands on the outside of the knee. The knee bends inward, which is valgus. The medial side opens, so the MCL is the one that stretches.',focus:[0,0,484,500],speed:1,setup(sim){BioLab.setValues(sim,{fk:'fromlat',bone:'femur',flex:30,F:55});}},
    {title:'Pivot on a planted foot',text:'Flex the knee and twist with the foot stuck. The femoral condyles grind the menisci, and the ACL resists the twist. Only 10-30% of the medial meniscus has a direct blood supply, so tears there often heal poorly.',focus:[0,0,484,500],speed:1,setup(sim){BioLab.setValues(sim,{fk:'rot',flex:60,F:55});}},
    {title:'The bars show the grade',text:'Strain under 4% springs back. From 4 to 6% is Grade I, stretching. From 6 to 10% is Grade II, a partial tear. Over 10% is Grade III, a complete tear. Raise the force and watch the MCL move through them.',focus:[486,0,314,500],speed:1,setup(sim){BioLab.setValues(sim,{fk:'fromlat',bone:'femur',flex:30,F:75});}},
    {title:'Rolled ankle: ATFL first',text:'Inversion with the toes down is how most ankle sprains happen. The ATFL is the weakest lateral ligament and goes first, then the CFL, then the PTFL. Now try the other joints and directions yourself.',focus:[0,0,800,500],speed:1,setup(sim){BioLab.setValues(sim,{joint:'ankle',fa:'inv',pf:20,F:60});}}
  ],
  onTourExit(sim){const base={};sim.def.controls.forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);},
  infoPanel,bindInfo,
  draw(sim,ctx,vdt,k){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);const v=sim.p.view;if(v==='stress')drawStress(sim,ctx,vdt,k);else if(v==='practice')drawPractice(sim,ctx,k);else drawExplore(sim,ctx,k);},
  onClick(sim,x,y){const p=sim.p;if(p.view==='practice')return;if(p.view==='stress')return;const labs=sim.vis.lab||[];for(const L of labs)if(x>=L.x&&x<=L.x+L.w&&y>=L.y&&y<=L.y+L.h){setSel(sim,L.id);return;}
    const X=artXf(p.joint),ax=(x-X.ox)/X.s,ay=(y-X.oy)/X.s,list=visArt(p.joint);const c=hitCtx();
    for(let i=list.length-1;i>=0;i--){const a=list[i];if(a.pts){let found=false;[a.pts,a.alt,a.alt2].forEach(ln=>{if(!ln)return;c.lineWidth=a.w+8;if(c.isPointInStroke(linePath(ln),ax,ay))found=true;});if(found){setSel(sim,a.id);return;}}
      else{const q=pathOf(a);if(a.ring&&a.id==='ghj'){c.lineWidth=8;if(c.isPointInStroke(q,ax,ay)){setSel(sim,a.id);return;}}else if(c.isPointInPath(q,ax,ay)){setSel(sim,a.id);return;}}}},
  lab:{bio:'<p><b>Question:</b> Which knee ligament does each force load?</p><ol><li>Choose Stress test and the knee, with the force level at 60.</li><li>Run each direction: anterior and posterior on the tibia, then lateral and medial on the femur (foot planted). Record a trial for each.</li><li>Choose the ankle and run inversion and eversion at 60.</li></ol><p>Write one sentence for each row: "When ___ happens, the ___ is loaded."</p>',
       honors:'<p><b>Question:</b> How does joint position change the injury?</p><ol><li>Set the knee to Rotate on a planted foot, force 60. Record medial meniscus load at 0, 30 and 60° of flexion.</li><li>Set the ankle to Inversion, force 60. Record ATFL and CFL strain at 30° plantarflexion, neutral and 20° dorsiflexion.</li></ol><p>Explain each pattern. Then name the stress test you would use for each and why it sets the joint at that angle.</p>',
       ap:'<p><b>Question:</b> What force causes each sprain grade, and which ligament is most at risk?</p><ol><li>For the ACL at 25° and the PCL at 90°, find the force level where each reaches Grade I, II and III.</li><li>Repeat for the ATFL at 20° plantarflexion and the deltoid under eversion.</li><li>Plot force against strain for each ligament.</li></ol><p><b>Claim, evidence, reasoning:</b> Rank the four ligaments by strength and explain how the ranking fits the injury numbers for the ankle (almost 90% inversion, 3-4% eversion).</p>'},
  terms:[{t:'Ligament',d:'Connects bone to bone and limits joint motion.'},{t:'Tendon',d:'Connects muscle to bone.'},{t:'Sprain',d:'An injury to a ligament.'},{t:'Strain',d:'An injury to a muscle or tendon. In this tool, strain also means how far a tissue is stretched, as a percent of its length.'},
    {t:'Valgus',d:'The joint bends inward, opening the medial side. Think of a knock-kneed knee.'},{t:'Varus',d:'The joint bows outward, opening the lateral side.'},{t:'Inversion and eversion',d:'The sole turns inward (inversion) or outward (eversion).'},{t:'Grades I, II, III',d:'Stretch, partial tear and complete tear.'},
    {lvl:'honors',t:'Sesamoid bone',d:'A bone that forms inside a tendon. The patella is the largest.'},{lvl:'honors',t:'Avulsion',d:'A tendon or ligament pulls off a piece of bone.'},{lvl:'honors',t:'Stress test',d:'A clinician moves the joint in one direction to feel for laxity and pain in one ligament, always comparing both sides.'},{lvl:'honors',t:'WB, ROM, WNL',d:'Weight bearing, range of motion, within normal limits.'},
    {lvl:'ap',t:'Antalgic gait',d:'A limp that avoids putting weight on the painful side.'},{lvl:'ap',t:'Mortise',d:'The socket formed by the tibia and fibula that holds the talus.'}],
  about:'<p><b>Educational use only.</b> This is a teaching model, not a way to diagnose yourself or anyone else. A joint injury needs evaluation by an athletic trainer or physician.</p><p><b>Model:</b> strain = gain × (force − onset) ÷ 100 × a position factor. Each mechanism has a primary structure with onset 0 and secondary structures that load only at higher force. The gains are set so the order of failure matches the classic teaching: ATFL then CFL then PTFL, MCL before ACL under valgus, PCL stronger than ACL, deltoid stronger than ATFL.</p><p><b>Strain zones:</b> connective tissue stretches elastically up to about 4%, gets microscopic damage from about 4 to 6%, fails in part from about 6 to 10%, and fails fully above about 10%. Matching those zones to Grades I, II and III is our simplification. Real ligaments vary with age, rate of loading and training.</p><p><b>Force level</b> is a relative scale with no newtons, because the real force depends on body size, speed and lever length.</p><p><b>Simplified:</b> the art is schematic and not to scale, motion is exaggerated so you can see it, and structures that sit behind the joint are dashed. The ankle front view spreads the three lateral ligaments out so you can see all of them. The menisci, labrum and nerves use the same scale as a rough load indicator. They do not have sprain grades. The shoulder is drawn with the arm at the side even when the force needs the arm raised. Real injuries usually combine forces, and muscles add active protection that this model leaves out. Ankle percentages (almost 90% inversion, 3-4% eversion) are from your course notes and other sources vary somewhat.</p>',
  thumbSetup(sim){BioLab.setValues(sim,{view:'explore',joint:'knee'});}
};
let _hc=null;function hitCtx(){if(!_hc)_hc=document.createElement('canvas').getContext('2d');return _hc;}
/* Exposed for the test script only. */
SIM._t={JOINTS,MECH,stressRows,topRow,mechKey,hitTest:(sim,x,y)=>{SIM.onClick(sim,x,y);return currentSel(sim);}};
BioLab.register(SIM);
})();
