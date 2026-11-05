(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;
/* ========== Bones: McKeon's "Bones of the Body" word bank ========== */
const AX='axial',AP='appendicular';
const BONES={
carpals:{n:'Carpals',g:AP,ct:'8 in each wrist, 16 in the body',type:'Short bones',where:'in the wrist',
  job:'A cluster of small bones that lets the wrist glide and bend.',find:'Bend your wrist. The small bones moving under the skin at the base of your hand are carpals.',
  clue:'Carpals are in the wrist and tarsals are in the ankle. Think of carpal tunnel, a wrist problem.',hint:'A cluster of 8 small bones between the forearm and the palm.',
  deep:'The eight are the scaphoid, lunate, triquetrum, pisiform, trapezium, trapezoid, capitate and hamate. The scaphoid is the one most often broken in a fall on an outstretched hand.'},
cervical:{n:'Cervical vertebrae',g:AX,ct:'7',type:'Irregular bones',where:'in the neck',view:'back',
  job:'The smallest vertebrae. They hold up the head and give the neck its range of motion.',find:'Tip your chin down and feel the bump at the base of your neck. That is the last cervical vertebra, C7.',
  clue:'Breakfast at 7, lunch at 12, dinner at 5: 7 cervical, 12 thoracic, 5 lumbar.',hint:'The top section of the spine, in the neck.',
  deep:'C1 is the atlas, which holds up the skull and lets you nod. C2 is the axis, which lets you shake your head no.'},
clavicle:{n:'Clavicle',g:AP,ct:'2',type:'Long bone',where:'across the top of the chest, from sternum to shoulder',
  job:'Props the shoulder out to the side. It is the only bony link between the arm and the trunk.',find:'Run a finger from the notch at the top of your sternum out toward your shoulder.',
  clue:'It sits at the front of the shoulder. Even though it touches the sternum, it belongs to the arm side of the skeleton.',hint:'A thin S-shaped bone you can feel from the top of the chest to the shoulder.',
  deep:'A fall on the shoulder or an outstretched hand can break it. The break usually happens near the middle third, where it curves.'},
coccyx:{n:'Coccyx',g:AX,ct:'1, made of about 3 to 5 small fused bones',type:'Irregular bone',where:'at the very bottom of the spine',view:'back',
  job:'A small anchor for pelvic floor muscles and ligaments.',find:'It is the very bottom tip of your spine, which you feel when you sit down hard.',
  clue:'It is the last stop on the spine, right below the sacrum.',hint:'The very tip of the spine, below the sacrum.',
  deep:'Its segments fuse gradually through adulthood. The count varies from person to person.'},
cranium:{n:'Cranium',g:AX,ct:'8 cranial bones. The whole skull has 22 with the 14 face bones.',type:'Flat and irregular bones',where:'in the head',
  job:'Encloses and protects the brain.',find:'Press on your forehead or the top of your head. There is almost no muscle over the bone there.',
  clue:'The mandible is the only large skull bone that moves. Everything else in the skull is locked together.',hint:'The bony case around the brain.',
  deep:'The cranial bones are the frontal, 2 parietal, 2 temporal, occipital, sphenoid and ethmoid, joined by sutures. On this picture, Cranium covers the whole skull above the jaw, including the upper face bones.'},
femur:{n:'Femur',g:AP,ct:'2',type:'Long bone',where:'in the thigh',
  job:'The longest and strongest bone. It carries your weight from the hip to the knee.',find:'Feel the hard bump on the outside of your hip. That is the top of the femur.',
  clue:'It runs from hip to knee. Its length is about a quarter of your height.',hint:'The single long bone between the hip and the knee.',
  deep:'The neck angles out from the head to the greater trochanter, which keeps the shaft clear of the pelvis and gives the hip muscles leverage.'},
fibula:{n:'Fibula',g:AP,ct:'2',type:'Long bone',where:'on the outside of the lower leg',
  job:'A thin side bone that anchors muscles and forms the outer ankle bump. It carries little of your weight.',find:'The bump on the outside of your ankle is the bottom of the fibula.',
  clue:'The fibula is the thin one on the little-toe side. The tibia is the thick one on the big-toe side.',hint:'The thin bone on the little-toe side of the lower leg.',
  deep:'It bears only about a tenth of the load through the lower leg. Surgeons can even take part of it to rebuild other bones.'},
humerus:{n:'Humerus',g:AP,ct:'2',type:'Long bone',where:'in the upper arm',
  job:'The upper arm bone. It runs from the shoulder joint to the elbow and anchors the muscles that move both.',find:'Squeeze your upper arm until you feel the hard bone under the biceps.',
  clue:'It is the only bone in the upper arm. Two bones begin at the elbow: the radius and the ulna.',hint:'The single bone between the shoulder and the elbow.',
  deep:'Your funny bone is not bone. It is the ulnar nerve crossing behind the medial epicondyle of the humerus.'},
lumbar:{n:'Lumbar vertebrae',g:AX,ct:'5',type:'Irregular bones',where:'in the lower back',view:'back',
  job:'The largest vertebrae. They carry the weight of the upper body and let the trunk bend.',find:'Put your hands on your waist. Your thumbs reach back to the lumbar section.',
  clue:'Breakfast at 7, lunch at 12, dinner at 5: 7 cervical, 12 thoracic, 5 lumbar.',hint:'The thick section of spine in the lower back, with no ribs attached.',
  deep:'Each vertebra down the spine carries more load, so bodies get larger. The lumbar spine has no rib facets, which helps you tell them apart.'},
mandible:{n:'Mandible',g:AX,ct:'1',type:'Irregular bone',where:'in the lower jaw',
  job:'The lower jaw. It holds the lower teeth and moves for chewing and talking.',find:'Open and close your mouth with a finger just in front of your ear.',
  clue:'It is the part of the skull that moves when you talk.',hint:'The horseshoe-shaped bone that holds the lower teeth.',
  deep:'It meets the temporal bone at the temporomandibular joint (TMJ), the only freely movable joint in the skull.'},
metacarpals:{n:'Metacarpals',g:AP,ct:'5 in each hand, 10 in the body',type:'Long bones',where:'in the palm',
  job:'The five long bones of the palm, between the wrist and the fingers.',find:'Make a fist. Each knuckle is the far end of a metacarpal.',
  clue:'Meta means beyond. Metacarpals sit beyond the carpals, and metatarsals sit beyond the tarsals.',hint:'The five bones inside the palm. Your knuckles are their far ends.',
  deep:'A punch with a closed fist can break the fifth one, on the little-finger side. That is the classic boxer’s fracture.'},
metatarsals:{n:'Metatarsals',g:AP,ct:'5 in each foot, 10 in the body',type:'Long bones',where:'in the middle of the foot',
  job:'The five long bones of the foot. They form the arch and push you off the ground.',find:'Run your finger along the top of your foot, from the ankle toward the toes.',
  clue:'Meta means beyond. Metatarsals sit beyond the tarsals, on the way to the toes.',hint:'The five long bones between the ankle bones and the toes.',
  deep:'Just past the base of the fifth one, on the little-toe side, is where a Jones fracture happens.'},
patella:{n:'Patella',g:AP,ct:'2',type:'Sesamoid bone',where:'at the front of the knee',view:'front',
  job:'The kneecap. It shields the front of the knee and gives the thigh muscles better leverage.',find:'Straighten your leg and relax it. You can slide your kneecap gently side to side.',
  clue:'It is only visible from the front, because it sits inside a tendon on the front of the knee.',hint:'The small round bone at the front of the knee.',
  deep:'It is the body’s largest sesamoid bone, one that forms inside a tendon. It starts as cartilage and turns to bone in early childhood.'},
pelvis:{n:'Pelvis',g:AP,ct:'2 hip bones',type:'Irregular bones',where:'at the hips',
  job:'The hip bones pass the weight of the upper body to the legs and protect the pelvic organs.',find:'Put your hands on your hips. The ridge under your fingers is the top of the pelvis, the iliac crest.',
  clue:'The hip bones are appendicular, even though the sacrum between them is axial.',hint:'The large butterfly-shaped bones at the hips.',
  deep:'Each hip bone is three bones fused by the late teens: the ilium, ischium and pubis. Strictly, the whole bony pelvis also includes the sacrum and coccyx.'},
phalanges:{n:'Phalanges',g:AP,ct:'14 in each hand, 14 in each foot, 56 in the body',type:'Long bones',where:'in the fingers and toes',
  job:'The bones of the fingers and toes. Your grip and the push-off from your toes depend on them.',find:'Bend one finger. Each section between two creases is one phalanx.',
  clue:'One is a phalanx, two or more are phalanges. Fingers and toes have 3 each, and the thumb and big toe have 2.',hint:'The bones of the fingers and toes.',
  deep:'They are named proximal, middle and distal by how close they are to the body. The thumb and big toe have no middle phalanx.'},
radius:{n:'Radius',g:AP,ct:'2',type:'Long bone',where:'on the thumb side of the forearm',
  job:'The forearm bone on the thumb side. It rotates around the ulna when you turn your palm up and down.',find:'Turn your palm up and down with a hand on your forearm. The bone that rolls is the radius.',
  clue:'In anatomical position, the radius is on the thumb side and the ulna is on the little-finger side.',hint:'The forearm bone on the thumb side.',
  deep:'A fall on an outstretched hand often breaks its far end, called a Colles fracture.'},
ribs:{n:'Ribs',g:AX,ct:'12 pairs, 24 in the body',type:'Flat bones',where:'around the chest',
  job:'They cage the heart and lungs and swing up and out when you breathe in.',find:'Press along the side of your chest and count the ridges.',
  clue:'All 12 pairs attach to the thoracic vertebrae at the back. Pairs 1 to 7 reach the sternum on their own cartilage.',hint:'Twelve pairs of curved bones around the chest.',
  honors:'Pairs 1 to 7 are true ribs, with their own cartilage to the sternum. Pairs 8 to 10 are false ribs, which join the cartilage above. Pairs 11 and 12 are floating ribs, with no front attachment.',
  deep:'The pale blue sections on this picture are costal cartilage, which lets the chest flex when you breathe.'},
sacrum:{n:'Sacrum',g:AX,ct:'1, made of 5 fused vertebrae',type:'Irregular bone',where:'between the hip bones',view:'back',
  job:'A triangle of fused vertebrae that passes body weight from the spine to the hip bones.',find:'Press the flat part of your lower back between the two dimples.',
  clue:'It is part of the spine, so it is axial, even though it sits between the hip bones.',hint:'A triangular bone wedged between the two hip bones.',
  deep:'Its rows of holes (sacral foramina) let nerves pass. The sacroiliac joints connect it to the hip bones.'},
scapula:{n:'Scapula',g:AP,ct:'2',type:'Flat bone',where:'on the upper back',view:'back',
  job:'The shoulder blade. It forms the socket of the shoulder and anchors the rotator cuff muscles.',find:'Reach across your chest and feel behind your opposite shoulder as you shrug. The ridge you feel is the spine of the scapula.',
  clue:'It is easiest to see from the back. It is a shoulder bone, so it is appendicular.',hint:'A flat triangular bone on the upper back.',
  deep:'It floats on muscle and only connects to the skeleton through the clavicle, which is why the shoulder moves so freely.'},
sternum:{n:'Sternum',g:AX,ct:'1',type:'Flat bone',where:'in the middle of the chest',view:'front',
  job:'The breastbone. It protects the heart and anchors the ribs in front.',find:'Press the flat bone in the middle of your chest, right where CPR compressions go.',
  clue:'It is in the center of the chest, where the ribs meet at the front.',hint:'The flat bone down the center of the chest.',
  deep:'It has three parts: manubrium, body and xiphoid process. It also holds red marrow in adults, so it is a site for marrow sampling.'},
tarsals:{n:'Tarsals',g:AP,ct:'7 in each foot, 14 in the body',type:'Short bones',where:'in the ankle and heel',
  job:'They carry your weight from the leg into the foot. They include the heel bone.',find:'Grab your heel. That is the biggest tarsal, the calcaneus.',
  clue:'Tarsals are in the ankle and carpals are in the wrist. Only 7 tarsals, against 8 carpals.',hint:'The 7 bones of the ankle and heel.',
  deep:'They are the talus, calcaneus, navicular, cuboid and 3 cuneiforms. The talus sits right under the tibia.'},
thoracic:{n:'Thoracic vertebrae',g:AX,ct:'12',type:'Irregular bones',where:'in the upper and middle back',view:'back',
  job:'Each one carries a pair of ribs. Together they hold up the chest and protect the spinal cord.',find:'Have a partner trace down your spine from the base of your neck, between your shoulder blades.',
  clue:'12 thoracic vertebrae carry 12 pairs of ribs. Breakfast at 7, lunch at 12, dinner at 5.',hint:'The middle section of the spine, where the ribs attach.',
  deep:'They have facets where ribs attach, and long spinous processes that slope down like shingles.'},
tibia:{n:'Tibia',g:AP,ct:'2',type:'Long bone',where:'on the inside of the lower leg',
  job:'The shin bone. It carries your weight from the knee to the ankle.',find:'Run your hand down your shin. The sharp edge you feel is the tibia, and the bump on the inside of your ankle is its medial malleolus.',
  clue:'The tibia is the thick one on the big-toe side. The fibula is the thin one on the little-toe side.',hint:'The thick bone at the front of the lower leg, the shin.',
  deep:'The patellar tendon attaches at the tibial tuberosity, the bump below your knee. That spot is sore in Osgood-Schlatter disease in growing athletes.'},
ulna:{n:'Ulna',g:AP,ct:'2',type:'Long bone',where:'on the little-finger side of the forearm',
  job:'The forearm bone on the little-finger side. It forms the hinge of the elbow.',find:'Put a fingertip on the point of your elbow. That point, the olecranon, is the top of the ulna.',
  clue:'In anatomical position, the ulna is on the little-finger side and the radius is on the thumb side.',hint:'The forearm bone on the little-finger side. Its top is the point of your elbow.',
  deep:'The ulna stays still while the radius rolls around it when you turn your palm over.'}
};
const IDS=Object.keys(BONES);
/* marks shown on a selected bone at deeper levels. v limits a mark to one side of the body */
const MARKS={
  femur:[['Head',62,451,'honors'],['Greater trochanter',93,458,'honors'],['Lesser trochanter',69,490,'ap'],['Medial condyle',36,711,'ap'],['Lateral condyle',76,711,'ap']],
  tibia:[['Tibial tuberosity',54,747,'honors','front'],['Medial malleolus',28,936,'honors']],
  fibula:[['Head',82,742,'honors'],['Lateral malleolus',62,944,'honors']],
  ulna:[['Olecranon',138,356,'honors','back'],['Styloid process',168,476,'honors']],
  radius:[['Head',158,368,'honors'],['Styloid process',190,472,'honors']],
  humerus:[['Head',108,190,'honors'],['Medial epicondyle',129,346,'ap'],['Lateral epicondyle',163,342,'ap']],
  scapula:[['Acromion',110,174,'honors'],['Glenoid cavity',102,196,'honors'],['Spine of the scapula',75,189,'ap','back'],['Inferior angle',72,258,'ap']],
  sternum:[['Manubrium',0,184,'honors'],['Body',0,236,'honors'],['Xiphoid process',0,286,'honors']],
  pelvis:[['Ilium',62,402,'honors'],['Ischium',46,500,'honors'],['Pubis',8,468,'honors']],
  cranium:[['Frontal bone',0,22,'ap','front'],['Temporal bone',41,50,'ap'],['Parietal bone',24,18,'ap','back'],['Occipital bone',0,58,'ap','back']],
  tarsals:[['Talus',44,943,'honors','front'],['Calcaneus',46,964,'honors','back']]
};
/* ========== Art: every coordinate is in body units, 1000 tall, x measured from the midline. +x is the viewer's right. ========== */
function closed(pts){const p=new Path2D(),n=pts.length,m=(i,j)=>[(pts[i][0]+pts[j][0])/2,(pts[i][1]+pts[j][1])/2],s=m(n-1,0);p.moveTo(s[0],s[1]);for(let i=0;i<n;i++){const e=m(i,(i+1)%n);p.quadraticCurveTo(pts[i][0],pts[i][1],e[0],e[1]);}p.closePath();return p;}
function open(pts){const p=new Path2D();p.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];p.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2);}const l=pts[pts.length-1];p.lineTo(l[0],l[1]);return p;}
const mir=pts=>pts.map(p=>[-p[0],p[1]]);
function sym(h){const r=[];for(let i=h.length-1;i>=0;i--){if(h[i][0]!==0)r.push([-h[i][0],h[i][1]]);}return h.concat(r);}
function ell(cx,cy,rx,ry,rot){rot=rot||0;const o=[];for(let i=0;i<12;i++){const a=i/12*6.2832,x=rx*Math.cos(a),y=ry*Math.sin(a);o.push([cx+x*Math.cos(rot)-y*Math.sin(rot),cy+x*Math.sin(rot)+y*Math.cos(rot)]);}return o;}
function sample(pts,w){const o=[],W=[],n=pts.length,ws=i=>Array.isArray(w)?w[i]:w;for(let i=0;i<n-1;i++){const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(n-1,i+2)];for(let j=0;j<6;j++){const t=j/6,t2=t*t,t3=t2*t;
  o.push([.5*(2*p1[0]+(p2[0]-p0[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(3*p1[0]-p0[0]-3*p2[0]+p3[0])*t3),.5*(2*p1[1]+(p2[1]-p0[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(3*p1[1]-p0[1]-3*p2[1]+p3[1])*t3)]);W.push(lerp(ws(i),ws(i+1),t));}}o.push(pts[n-1]);W.push(ws(n-1));return {o,W};}
function band(pts,w){const {o,W}=sample(pts,w),L=[],R=[];for(let i=0;i<o.length;i++){const a=o[Math.max(0,i-1)],b=o[Math.min(o.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;L.push([o[i][0]+nx*W[i],o[i][1]+ny*W[i]]);R.push([o[i][0]-nx*W[i],o[i][1]-ny*W[i]]);}
  const a=o[0],b=o[1],c=o[o.length-1],e=o[o.length-2],ds=Math.hypot(a[0]-b[0],a[1]-b[1])||1,de=Math.hypot(c[0]-e[0],c[1]-e[1])||1;
  return L.concat([[c[0]+(c[0]-e[0])/de*W[W.length-1]*.8,c[1]+(c[1]-e[1])/de*W[W.length-1]*.8]],R.reverse(),[[a[0]+(a[0]-b[0])/ds*W[0]*.8,a[1]+(a[1]-b[1])/ds*W[0]*.8]]);}
/* outlines */
const SKULL_F=sym([[0,3],[18,4],[32,11],[41,25],[44,40],[43,52],[41,58],[44,62],[41,70],[33,72],[29,73],[24,79],[18,85],[9,87],[0,87]]);
const SKULL_B=sym([[0,3],[20,4],[34,12],[43,27],[46,42],[44,58],[38,70],[30,77],[20,81],[9,82],[0,80]]);
const JAW=sym([[0,87],[12,87],[20,84],[26,74],[33,62],[38,66],[38,78],[35,88],[27,96],[17,103],[8,107],[0,107]]);
const STERN=sym([[0,170],[16,170],[21,177],[15,190],[12,197],[14,204],[17,228],[17,255],[13,272],[7,279],[5,284],[3,292],[0,296]]);
const SCAP=[[53,180],[68,184],[84,187],[92,178],[102,186],[104,198],[98,212],[90,230],[79,254],[72,264],[65,254],[52,222],[45,196]];
const HUM=[[106,175],[118,175],[128,181],[132,195],[129,215],[133,240],[144,300],[149,322],[155,332],[166,341],[162,353],[150,358],[140,360],[129,356],[124,345],[131,333],[134,320],[130,300],[120,240],[113,216],[109,204],[99,198],[95,187],[99,179]];
const FEM=[[57,437],[70,439],[77,449],[84,452],[90,444],[99,452],[101,470],[96,500],[88,560],[76,640],[72,680],[81,699],[86,712],[79,722],[63,722],[56,714],[49,722],[33,722],[26,712],[32,698],[45,680],[55,640],[70,560],[76,505],[71,497],[66,488],[70,478],[64,468],[52,465],[47,452],[49,443]];
const PAT=[[44,692],[56,687],[68,692],[71,704],[63,716],[56,721],[49,716],[41,704]];
const TIB=[[29,731],[42,725],[56,728],[70,725],[81,731],[79,743],[68,753],[61,775],[58,850],[56,905],[60,925],[58,937],[42,935],[34,937],[28,947],[23,935],[30,905],[38,850],[40,775],[36,753],[30,743]];
const HIP=[[27,392],[36,378],[56,371],[76,376],[89,392],[91,410],[84,424],[79,436],[82,448],[83,460],[77,474],[66,488],[56,502],[44,510],[34,504],[24,494],[12,484],[3,480],[2,470],[2,458],[14,452],[26,444],[31,432],[28,420],[26,405]];
const OBT=[[18,462],[30,455],[43,462],[50,476],[45,491],[34,494],[24,484],[16,472]];
const WING=[[40,392],[58,382],[75,386],[83,402],[76,419],[58,430],[43,428],[35,410]];
const SACR=sym([[0,380],[29,381],[31,394],[23,418],[13,436],[6,443],[0,445]]);
const RIB=[null,[44,178,26,186,178],[60,190,28,204,192],[70,203,30,222,206],[77,218,32,240,220],[82,233,34,258,234],[86,248,36,276,250],[88,264,40,292,266],[89,280,50,305,0],[88,295,58,317,0],[84,310,64,329,0],[74,322,62,337,0],[56,330,46,338,0]];
const JOIN={8:[24,283],9:[32,296],10:[44,308]};
const yv=k=>157+(k-1)*12.4;
/* the finished list of paint layers for one side of the body */
function buildArt(){
  const mk=()=>{const L=[];const a={L,
    bone(id,pts,f){L.push({id,p:closed(pts),f:f||'bone'});},
    both(id,pts,f){a.bone(id,pts,f);a.bone(id,mir(pts),f);},
    hole(pts,f){L.push({id:null,p:closed(pts),f:f||'hole'});},
    holes(pts,f){a.hole(pts,f);a.hole(mir(pts),f);},
    line(id,pts){L.push({id,p:open(pts),line:1});},
    lines(id,pts){a.line(id,pts);a.line(id,mir(pts));},
    fillOnly(pts,f,id){L.push({id:id||null,p:closed(pts),f,deco:1});},
    fills(pts,f,id){a.fillOnly(pts,f,id);a.fillOnly(mir(pts),f,id);}};return a;};
  const verts=(a,view)=>{
    for(let i=0;i<7;i++){const y=106+i*6.6,w=10+i*.7,h=2.8;a.bone('cervical',[[-w,y-h],[w,y-h],[w+5,y],[w,y+h],[-w,y+h],[-w-5,y]]);if(view==='back')a.fillOnly(ell(0,y,2.6,2.6),'shade','cervical');}
    for(let i=0;i<12;i++){const y=yv(i+1)-5+0,w=11+i*.55,h=4.8;a.bone('thoracic',[[-w,y-h],[w,y-h],[w+(view==='back'?7:2),y],[w,y+h],[-w,y+h],[-w-(view==='back'?7:2),y]]);if(view==='back')a.fillOnly(ell(0,y+1,3,6.2),'shade','thoracic');}
    for(let i=0;i<5;i++){const y=306+i*15.6,w=18+i*.8,h=6.4;a.bone('lumbar',[[-w,y-h],[w,y-h],[w+1,y-2],[w+10,y-1],[w+10,y+2],[w+1,y+3],[w,y+h],[-w,y+h],[-w-1,y+3],[-w-10,y+2],[-w-10,y-1],[-w-1,y-2]]);if(view==='back')a.fillOnly(ell(0,y,4,7),'shade','lumbar');}
  };
  const discs=a=>a.fillOnly([[-9,100],[9,100],[14,150],[17,300],[20,382],[-20,382],[-17,300],[-14,150]],'cart');
  const rib=k=>{const r=RIB[k],y=yv(k);return {post:[[12,y],[r[0]*.45,y-1],[r[0]*.85,(y+r[1])/2-3],[r[0],r[1]]],ant:[[r[0],r[1]],[lerp(r[0],r[2],.5),lerp(r[1],r[3],.62)],[r[2],r[3]]]};};
  const ribsPost=(a,f)=>{for(let k=1;k<=12;k++){a.both('ribs',band(rib(k).post,k<3?2.6:3.1),f);}};
  const ribsAnt=(a,f)=>{for(let k=1;k<=12;k++){a.both('ribs',band(rib(k).ant,k<3?2.8:3.2),f);}};
  const cart=a=>{for(let k=1;k<=10;k++){const r=RIB[k],s=k<=7?[[r[2],r[3]],[lerp(r[2],12,.6),lerp(r[3],r[4],.55)],[11,r[4]]]:[[r[2],r[3]],[lerp(r[2],JOIN[k][0],.6),lerp(r[3],JOIN[k][1],.7)],JOIN[k]];a.both('ribs',band(s,k<8?2.6:2.2),'cart');}};
  const clav=a=>{a.both('clavicle',band([[13,174],[30,167],[55,168],[80,171],[100,168],[113,173]],[5,3.8,3.4,3.4,3.6,4.8]));};
  const humerus=(a,view)=>{a.both('humerus',HUM);if(view==='back'){a.holes(ell(145,343,6,7),'shade');}else{a.lines('humerus',[[113,178],[120,186],[124,196]]);a.lines('humerus',[[134,352],[146,348],[158,352]]);}};
  const radius=a=>a.both('radius',band([[158,367],[160,386],[171,430],[182,465],[185,476]],[8.4,4.8,4.8,7.5,9.5]));
  const ulna=a=>a.both('ulna',band([[138,353],[141,372],[154,425],[166,468],[168,477]],[11.5,6.6,4.4,3.8,5]));
  const hand=a=>{
    [[170,483,5,4.4],[179,482,5,4.4],[188,481,5,4.6],[196,484,3.6,3.6],[171,493,4.6,5],[179,493,4.2,5],[187,492,4.6,5],[195,495,5,5]].forEach(c=>a.both('carpals',ell(c[0],c[1],c[2],c[3])));
    const M=[[[170,499],[169,527]],[[178,499],[178,531]],[[186,499],[187,532]],[[193,500],[196,529]],[[201,498],[209,517]]];
    M.forEach(m=>a.both('metacarpals',band(m,[2.8,2.2])));
    [[[169,531],[167,542],[166,551],[165,558]],[[178,535],[177,548],[177,559],[177,567]],[[187,536],[188,550],[188,561],[189,570]],[[197,533],[199,546],[201,556],[202,564]]].forEach(f=>{for(let i=0;i<3;i++)a.both('phalanges',band([f[i],f[i+1]],[2.6-i*.3,2.3-i*.3]));});
    [[[210,520],[215,532],[218,544]]].forEach(f=>{for(let i=0;i<2;i++)a.both('phalanges',band([f[i],f[i+1]],[2.8-i*.3,2.4-i*.3]));});};
  const fib=a=>a.both('fibula',band([[81,741],[77,800],[69,880],[63,926],[62,942]],[7.2,3,2.8,4.2,5]));
  const foot=(a,view)=>{
    const mt=[[[30,967],[28,985]],[[39,968],[42,987]],[[48,968],[55,987]],[[56,967],[68,986]],[[63,965],[82,983]]];
    mt.forEach((m,i)=>a.both('metatarsals',band(m,i?[2.8,2.2]:[3.8,3.2])));
    [[[27,989],[27,994],[27,1000]],[[42,990],[43,994],[44,997],[45,1000]],[[56,990],[58,994],[59,997],[60,999]],[[70,989],[72,993],[73,996],[74,998]],[[84,986],[87,990],[89,993],[90,996]]].forEach((f,j)=>{for(let i=0;i<f.length-1;i++)a.both('phalanges',band([f[i],f[i+1]],j?1.9:3));});
    if(view==='back'){a.both('tarsals',ell(44,944,13,8));a.both('tarsals',[[33,950],[58,950],[63,962],[60,976],[48,983],[36,977],[30,962]]);a.lines('tarsals',[[37,968],[46,972],[56,968]]);}
    else{a.both('tarsals',ell(46,945,13,7.5));a.both('tarsals',ell(36,955,7,5,-.2));a.both('tarsals',ell(58,957,7,6,.2));[[27,962],[37,963],[47,963]].forEach(c=>a.both('tarsals',ell(c[0],c[1],4.6,4.6)));}};
  /* FRONT, back to front */
  const F=mk();
  F.both('scapula',SCAP,'shade');F.both('scapula',band([[86,187],[92,193],[96,197]],2.6),'bone');
  ribsPost(F,'shade');discs(F);verts(F,'front');
  F.bone('sacrum',SACR);[[15,391],[13,403],[11,415],[8,426]].forEach(c=>F.holes(ell(c[0],c[1],2.6,2.2)));F.line('sacrum',[[-23,397],[23,397]]);F.line('sacrum',[[-19,409],[19,409]]);F.line('sacrum',[[-14,421],[14,421]]);F.line('sacrum',[[-10,432],[10,432]]);
  [[447,6.2],[453,4.6],[458,3.2],[462,2]].forEach(c=>F.bone('coccyx',ell(0,c[0],c[1],2.6)));
  F.both('pelvis',HIP);F.fills(WING,'wing','pelvis');F.holes(OBT,'see');F.lines('pelvis',[[28,424],[20,440],[8,454]]);F.lines('pelvis',[[44,442],[56,433],[72,434],[81,446]]);
  F.both('femur',FEM);F.lines('femur',[[84,456],[76,470],[72,484]]);
  F.both('fibula',band([[81,741],[77,800],[69,880],[63,926],[62,942]],[7.2,3,2.8,4.2,5]));
  foot(F,'front');
  F.both('tibia',TIB);F.lines('tibia',[[52,742],[54,748],[56,760]]);
  F.both('patella',PAT);
  ulna(F);radius(F);humerus(F,'front');hand(F);
  ribsAnt(F);cart(F);F.bone('sternum',STERN);F.line('sternum',[[-13,197],[13,197]]);F.line('sternum',[[-9,277],[9,277]]);
  clav(F);
  F.bone('mandible',JAW);for(let i=-4;i<=4;i++)F.fillOnly([[i*4.2-1.7,87],[i*4.2+1.7,87],[i*4-1+1.4+1,93],[i*4-1.4,93]],'tooth');F.lines('mandible',[[7,103],[15,97],[22,89]]);
  F.bone('cranium',SKULL_F);F.holes([[7,40],[14,37],[24,38],[29,44],[27,52],[20,56],[11,55],[6,49]],'dark');F.hole([[0,53],[4,58],[7,67],[4,71],[0,69],[-4,71],[-7,67],[-4,58]],'dark');
  for(let i=-4;i<=4;i++)F.fillOnly([[i*4-1.7,79],[i*4+1.7,79],[i*4+1.4,87],[i*4-1.4,87]],'tooth');
  F.lines('cranium',[[5,37],[14,33],[26,34],[31,40]]);F.lines('cranium',[[41,60],[33,62],[27,59]]);F.lines('cranium',[[0,8],[12,10],[26,17],[37,29]]);F.lines('cranium',[[20,66],[15,74]]);F.line('cranium',[[0,38],[0,52]]);
  /* BACK, front to back as seen from behind */
  const B=mk();
  B.bone('mandible',JAW);
  clav(B);ribsAnt(B,'shade');cart(B);ribsPost(B,'bone');discs(B);verts(B,'back');
  B.both('scapula',SCAP);B.both('scapula',band([[47,200],[72,192],[98,180],[113,172]],[1.6,3,4,5.5]),'shade');
  humerus(B,'back');radius(B);ulna(B);hand(B);
  B.both('femur',FEM);B.lines('femur',[[66,560],[64,620],[60,680]]);B.holes(ell(56,706,7,8),'shade');
  B.both('pelvis',HIP);B.fills(WING,'wing','pelvis');B.holes(OBT,'see');
  B.bone('sacrum',SACR);[[15,391],[13,403],[11,415],[8,426]].forEach(c=>B.holes(ell(c[0],c[1],2.6,2.2)));B.line('sacrum',[[0,384],[0,432]]);
  [[447,6.2],[453,4.6],[458,3.2],[462,2]].forEach(c=>B.bone('coccyx',ell(0,c[0],c[1],2.6)));
  B.both('tibia',TIB);foot(B,'back');fib(B);
  B.bone('cranium',SKULL_B);B.line('cranium',[[0,3],[0,32]]);B.line('cranium',[[-36,58],[-22,46],[-10,38],[0,32],[10,38],[22,46],[36,58]]);B.lines('cranium',[[24,70],[12,72],[0,68]]);
  return {front:F.L,back:B.L};
}
let ART=null;const art=()=>ART||(ART=buildArt());
/* ========== Labels ========== */
const LAB={front:[['cranium',-26,26,-1],['mandible',-27,96,-1],['cervical',-9,128,-1],['sternum',-7,232,-1],['ribs',-70,262,-1],['thoracic',-10,300,-1],['lumbar',-14,340,-1],['pelvis',-68,400,-1],['sacrum',-14,410,-1],['coccyx',-3,453,-1],['femur',-76,600,-1],['tibia',-47,820,-1],['tarsals',-46,958,-1],
    ['clavicle',70,170,1],['scapula',93,215,1],['humerus',131,270,1],['ulna',150,420,1],['radius',177,440,1],['carpals',186,488,1],['metacarpals',186,512,1],['phalanges',200,551,1],['humerus',146,345,1,'z'],['femur',34,700,1,'z'],['femur',92,478,1,'z'],['patella',60,704,1],['fibula',72,850,1],['metatarsals',62,977,1],['phalanges',73,995,1]],
  back:[['cranium',-26,26,-1],['mandible',-32,90,-1],['cervical',-5,128,-1],['thoracic',-6,226,-1],['ribs',-82,285,-1],['lumbar',-14,340,-1],['pelvis',-68,400,-1],['sacrum',-14,410,-1],['coccyx',-3,453,-1],['femur',-76,600,-1],['tibia',-47,820,-1],['tarsals',-46,962,-1],
    ['clavicle',24,167,1],['scapula',75,225,1],['humerus',131,270,1],['ulna',150,420,1],['radius',177,440,1],['carpals',186,488,1],['metacarpals',186,512,1],['phalanges',200,551,1],['humerus',146,345,1,'z'],['femur',34,700,1,'z'],['femur',92,478,1,'z'],['fibula',72,850,1],['metatarsals',78,981,1],['phalanges',88,992,1]]};
const ZOOM={whole:null,
  head:{x0:-70,x1:70,y0:-6,y1:158,l:'Skull and neck'},chest:{x0:-132,x1:132,y0:150,y1:345,l:'Chest and shoulders'},
  hip:{x0:-112,x1:112,y0:370,y1:520,l:'Hips'},hand:{x0:118,x1:228,y0:335,y1:580,l:'Forearm and hand'},leg:{x0:12,x1:112,y0:685,y1:1005,l:'Knee to foot'}};
/* transform for one figure. region is the stage area it may use */
function figT(view,zoom,box){if(zoom&&ZOOM[zoom]){const z=ZOOM[zoom],s=Math.min(box.w/(z.x1-z.x0),box.h/(z.y1-z.y0));return {view,s,ox:box.x+box.w/2-s*(z.x0+z.x1)/2,oy:box.y+box.h/2-s*(z.y0+z.y1)/2,zoom:z,clip:box};}
  const s=box.h/1000;return {view,s,ox:box.x+box.w/2,oy:box.y};}
const toX=(T,x)=>T.ox+T.s*x,toY=(T,y)=>T.oy+T.s*y;
/* palette: bone is an object with its own color, kept pale with a dark outline in both themes */
function dark(){const c=String(PAL['card']||'#fff');if(c[0]!=='#')return false;const h=c.length<6?c.replace(/#(.)(.)(.)/,'#$1$1$2$2$3$3'):c;return parseInt(h.slice(1,3),16)<90;}
function hex(c){if(c[0]!=='#'){const m=String(c).match(/[\d.]+/g);return m&&m.length>=3?[+m[0],+m[1],+m[2]]:[128,128,128];}if(c.length<6)c=c.replace(/#(.)(.)(.)/,'#$1$1$2$2$3$3');return [parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];}
function mix(a,b,t){const A=hex(a),B=hex(b);return 'rgb('+A.map((v,i)=>Math.round(lerp(v,B[i],t))).join(',')+')';}
function pal(){const d=dark();return d?{bone:'#e6dcc2',shade:'#bfb292',wing:'#d6caab',cart:'#a9c7d3',hole:'#57503f',dark:'#26221a',tooth:'#fbf7ea',ink:'#2b2619'}:{bone:'#f1e8d1',shade:'#d8cba9',wing:'#e6dbbd',cart:'#bcd5de',hole:'#6f654f',dark:'#3a3426',tooth:'#fffdf3',ink:'#5a503c'};}
/* draw one figure. colorOf(id) returns a fill or null for plain bone */
function drawFig(ctx,T,colorOf,opt){opt=opt||{};const P=pal(),L=art()[T.view];ctx.save();if(T.clip){ctx.beginPath();ctx.rect(T.clip.x,T.clip.y,T.clip.w,T.clip.h);ctx.clip();}ctx.translate(T.ox,T.oy);ctx.scale(T.s,T.s);
  BioLab.body.path(ctx,{cx:0,top:0,h:1000});ctx.fillStyle=PAL['card2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.2/T.s;ctx.stroke();
  const lw=1/T.s;ctx.lineJoin='round';ctx.lineCap='round';
  for(const e of L){const c=e.id?colorOf(e.id):null;
    if(e.line){ctx.strokeStyle=P.ink;ctx.globalAlpha=.55;ctx.lineWidth=.8/T.s;ctx.stroke(e.p);ctx.globalAlpha=1;continue;}
    let f=P[e.f]||P.bone;if(c){f=e.f==='shade'?mix(c,'#000000',.22):(e.f==='wing'?mix(c,'#000000',.1):(e.f==='cart'?mix(c,'#ffffff',.42):c));}
    if(e.f==='see')f=PAL['card2'];
    ctx.fillStyle=f;ctx.fill(e.p);if(!e.deco&&e.f!=='hole'&&e.f!=='dark'){ctx.strokeStyle=P.ink;ctx.lineWidth=lw;ctx.stroke(e.p);}}
  if(opt.ghost){const set=opt.ghost;ctx.strokeStyle=opt.ghostColor||PAL['s1'];ctx.lineWidth=2.2/T.s;for(const e of L){if(e.id&&set[e.id]&&!e.line&&!e.deco)ctx.stroke(e.p);}}
  ctx.restore();}
/* place labels in a column with no overlaps */
function column(items,gap,top,bot){items.sort((a,b)=>a.ay-b.ay);items.forEach((it,i)=>{const h=(it.lines||1)*gap;it.y=Math.max(it.ay,i?items[i-1].y+(items[i-1].lines||1)*gap:top);it._h=h;});
  for(let i=items.length-1;i>=0;i--){const lim=i===items.length-1?bot-(items[i].lines||1)*gap+gap:items[i+1].y-(items[i].lines||1)*gap;if(items[i].y>lim)items[i].y=lim;}return items;}
function wrap(ctx,s,maxW,size,w){ctx.font=(w||400)+' '+size+'px '+FONT;const out=[];let cur='';s.split(' ').forEach(word=>{const t=cur?cur+' '+word:word;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=word;}else cur=t;});if(cur)out.push(cur);return out;}
/* ========== Long bone cutaway (stage units) ========== */
const CX=400;
const LONG_OUT=sym([[0,28],[60,36],[106,68],[122,114],[116,155],[92,190],[66,226],[56,270],[54,400],[54,540],[58,590],[72,632],[100,668],[124,702],[124,742],[98,768],[48,776],[18,762],[0,756]]).map(p=>[p[0]+CX,p[1]]);
const LONG_IN=sym([[0,44],[56,50],[94,78],[108,116],[102,152],[80,186],[52,222],[28,262],[28,540],[52,600],[86,650],[108,700],[108,734],[88,754],[48,762],[20,748],[0,742]]).map(p=>[p[0]+CX,p[1]]);
const LONG_CAV=sym([[0,236],[18,244],[28,270],[28,540],[18,596],[0,610]]).map(p=>[p[0]+CX,p[1]]);
function capPath(top){const o=top?[[-122,114],[-106,68],[-60,36],[0,28],[60,36],[106,68],[122,114],[110,116],[94,82],[54,54],[0,46],[-54,54],[-94,82],[-110,116]]:[[-124,716],[-124,742],[-98,768],[-48,776],[-18,762],[0,756],[18,762],[48,776],[98,768],[124,742],[124,716],[111,718],[108,736],[88,756],[48,762],[20,748],[0,742],[-20,748],[-48,762],[-88,756],[-108,736],[-111,718]];return closed(o.map(p=>[p[0]+CX,p[1]]));}
let LG=null;function lg(){if(LG)return LG;const G={out:closed(LONG_OUT),inn:closed(LONG_IN),cav:closed(LONG_CAV),capT:capPath(true),capB:capPath(false)};
  const r=rng(77),tr=new Path2D(),gap=21,cols=16,rowsN=38,pt=[];for(let j=0;j<=rowsN;j++){pt[j]=[];for(let i=0;i<=cols;i++)pt[j][i]=[CX-168+i*gap+(j%2?gap/2:0)+(r()-.5)*11,30+j*gap+(r()-.5)*11];}
  for(let j=0;j<=rowsN;j++)for(let i=0;i<=cols;i++){const p=pt[j][i];if(i<cols&&r()>.14){const q=pt[j][i+1];tr.moveTo(p[0],p[1]);tr.lineTo(q[0],q[1]);}if(j<rowsN){const q=pt[j+1][i],q2=j%2?pt[j+1][Math.min(cols,i+1)]:pt[j+1][Math.max(0,i-1)];if(r()>.1){tr.moveTo(p[0],p[1]);tr.lineTo(q[0],q[1]);}if(r()>.55){tr.moveTo(p[0],p[1]);tr.lineTo(q2[0],q2[1]);}}}G.tr=tr;
  const fat=[];for(let i=0;i<60;i++)fat.push([CX+(r()-.5)*44,248+r()*352,2.5+r()*4]);G.fat=fat;
  G.art=open([[CX+70,352],[CX+52,370],[CX+36,392],[CX+22,406]]);G.artUp=open([[CX+22,406],[CX+6,370],[CX+10,320],[CX-6,270]]);G.artDn=open([[CX+22,406],[CX+4,450],[CX+12,510],[CX-4,580]]);
  G.artHit=open([[CX+70,352],[CX+52,370],[CX+36,392],[CX+22,406],[CX+6,370]]);
  G.plateT=closed([[CX-92,172],[CX-50,180],[CX,174],[CX+50,180],[CX+92,172],[CX+84,190],[CX+50,194],[CX,188],[CX-50,194],[CX-84,190]]);
  G.plateB=closed([[CX-82,642],[CX-40,654],[CX,648],[CX+40,654],[CX+82,642],[CX+90,660],[CX+40,668],[CX,662],[CX-40,668],[CX-90,660]]);
  return LG=G;}
const LP={
  epiphysis:{n:'Epiphysis',kind:'region',job:'The enlarged end of a long bone. It holds spongy bone and red marrow, and it forms the joint.',y:[[28,178],[654,776]]},
  diaphysis:{n:'Diaphysis',kind:'region',job:'The long shaft. A thick tube of compact bone around the medullary cavity resists bending and carries load.',y:[[236,596]]},
  metaphysis:{n:'Metaphysis',kind:'region',job:'The flared zone where the shaft meets the epiphysis. New bone from the epiphyseal plate joins the shaft here.',y:[[178,236],[596,654]]},
  plate:{n:'Epiphyseal plate',job:'A band of cartilage between the epiphysis and the metaphysis. It is where a growing long bone gets longer. When growth stops, the plate turns to bone and leaves the epiphyseal line.'},
  cartilage:{n:'Articular cartilage',job:'A smooth, slick cap on the ends of the bone where it meets another bone in a joint. It has no blood supply, so it heals poorly.'},
  periosteum:{n:'Periosteum',job:'A tough outer membrane with blood vessels and nerves. It covers the bone everywhere except the articular cartilage. Tendons and ligaments attach to it, and it is why a broken bone hurts so much.'},
  compact:{n:'Compact bone',job:'Dense, solid bone that forms the outer wall. It gives the bone its strength.',ap:'It is built from osteons: rings of bone around a central canal that carries blood vessels.'},
  spongy:{n:'Spongy bone',job:'A lattice of thin bony struts inside the ends of the bone. It is strong and light, and the struts line up along the lines of stress.',honors:'The struts are called trabeculae. Red marrow fills the spaces between them.'},
  cavity:{n:'Medullary cavity',job:'The hollow center of the shaft. A hollow tube is nearly as strong as a solid rod and far lighter. It holds marrow.'},
  red:{n:'Red marrow',job:'Fills the spaces in spongy bone. It carries out hematopoiesis, making red blood cells, white blood cells and platelets.',ap:'It makes about 2 million red blood cells every second. In adults it stays mostly in flat bones and the ends of the femur and humerus.'},
  yellow:{n:'Yellow marrow',job:'Mostly fat, filling the medullary cavity. It stores energy.',honors:'It can turn back into red marrow after severe blood loss.'},
  artery:{n:'Nutrient artery',job:'Enters through a small hole in the shaft and supplies blood to the marrow and the inner part of the bone.'},
  endosteum:{n:'Endosteum',lvl:'honors',job:'A thin membrane that lines the medullary cavity. Its cells build and remodel bone from the inside.'},
  osteon:{n:'Osteon',lvl:'ap',job:'The repeating unit of compact bone: rings of bone around a central canal. The inset shows one, about 0.2 mm across.'}
};
const LP_R=[['cartilage',CX+72,44],['spongy',CX+66,108],['red',CX+36,150],['plate',CX+70,178],['compact',CX+42,290],['periosteum',CX+55,340],['artery',CX+66,358],['cavity',CX+14,455],['yellow',CX+14,540]];
/* ========== Bone functions ========== */
const FUNCS={
  support:{n:'Support',job:'The skeleton is the frame that holds you up. Your weight runs down the spine, through the pelvis and down the legs.',
    hi:['cervical','thoracic','lumbar','sacrum','pelvis','femur','tibia','tarsals'],notes:[['Spine holds up the head and trunk',-8,320,-1],['Pelvis passes weight to the legs',-70,400,-1],['Femur and tibia carry your weight to the ground',64,650,1]]},
  protect:{n:'Protection',job:'Bone shields soft organs. The skull protects the brain, the vertebrae protect the spinal cord, and the ribcage protects the heart and lungs.',
    hi:['cranium','cervical','thoracic','lumbar','ribs','sternum'],notes:[['Skull: brain',-28,32,-1],['Vertebrae: spinal cord',-3,130,-1],['Ribcage: heart and lungs',55,230,1]]},
  anchor:{n:'Anchorage',job:'Muscles pull on bones through tendons. Bones act as levers, and joints act as the pivots, so a muscle’s pull becomes movement.',
    hi:['scapula','radius','humerus','femur','patella','tibia'],notes:[['Biceps Brachii pulls the radius',148,300,1],['Tendon anchors muscle to bone',163,385,1],['Rectus Femoris pulls on the patella and tibia',-70,610,-1]]},
  mineral:{n:'Mineral storage',job:'Bone is a bank for calcium and phosphate. About 99% of the body’s calcium is in bone. When blood calcium falls, bone releases some, and when it rises, bone stores more.',
    hi:'all',notes:[['Calcium and phosphate move between bone and blood',-76,600,-1]]},
  blood:{n:'Blood cell formation',job:'Red marrow carries out hematopoiesis, making red blood cells, white blood cells and platelets. In adults it is mostly in the flat bones, the vertebrae and the ends of the femur and humerus.',
    hi:['pelvis','sternum','ribs','cranium','cervical','thoracic','lumbar','sacrum'],notes:[['Flat bones and vertebrae hold red marrow',-8,240,-1],['So do the upper femur and humerus',-62,452,-1]]},
  fat:{n:'Fat storage',job:'Yellow marrow in the shafts of long bones stores fat, an energy reserve.',
    hi:[],notes:[['Yellow marrow fills the long bone shafts',-65,590,-1],['The humerus has it too',134,275,1]]},
  hormone:{n:'Hormone production',job:'Bone cells release hormones into the blood. Osteocalcin helps regulate blood sugar and energy use.',
    hi:'all',notes:[['Bone cells release osteocalcin into the blood',-76,600,-1]],ap:'Bone also releases FGF23, which tells the kidneys how much phosphate to get rid of. This is a newer finding, and research on it continues.'}
};
/* ========== Answer checking ========== */
const NORM=s=>String(s||'').toLowerCase().replace(/[^a-z]/g,'');
const VARIANT={carpals:['carpals','carpal','carpalbones'],cervical:['cervicalvertebrae','cervicalvertebra','cervical','cervicals','cervicalspine'],clavicle:['clavicle','clavicles'],coccyx:['coccyx'],cranium:['cranium','cranial','craniumbones'],femur:['femur','femurs','femora'],fibula:['fibula','fibulas','fibulae'],humerus:['humerus','humeri'],
  lumbar:['lumbarvertebrae','lumbarvertebra','lumbar','lumbars','lumbarspine'],mandible:['mandible','mandibles'],metacarpals:['metacarpals','metacarpal'],metatarsals:['metatarsals','metatarsal'],patella:['patella','patellae','patellas'],pelvis:['pelvis','pelvic','pelvicgirdle','hipbones'],phalanges:['phalanges','phalanx'],radius:['radius','radii'],ribs:['ribs','rib'],sacrum:['sacrum'],scapula:['scapula','scapulae','scapulas'],sternum:['sternum'],tarsals:['tarsals','tarsal'],thoracic:['thoracicvertebrae','thoracicvertebra','thoracic','thoracics','thoracicspine'],tibia:['tibia','tibias','tibiae'],ulna:['ulna','ulnas','ulnae','ulnar']};
const EVERYDAY={collarbone:'clavicle',shoulderblade:'scapula',kneecap:'patella',jaw:'mandible',jawbone:'mandible',breastbone:'sternum',tailbone:'coccyx',thighbone:'femur',shinbone:'tibia',shin:'tibia',hipbone:'pelvis',hip:'pelvis',hips:'pelvis',skull:'cranium',fingers:'phalanges',toes:'phalanges',wrist:'carpals',ankle:'tarsals',heel:'tarsals',rib_:'ribs'};
function lev(a,b){const m=a.length,n=b.length;let p=Array.from({length:n+1},(_,i)=>i);for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c;}return p[n];}
function classify(raw){const s=NORM(raw);if(!s)return {none:true};if(s==='vertebrae'||s==='vertebra'||s==='spine')return {vague:true};
  for(const id of IDS)if(VARIANT[id].includes(s))return {id,exact:true};
  if(EVERYDAY[s])return {id:EVERYDAY[s],everyday:true};
  let best=9,who=new Set();for(const id of IDS)for(const v of VARIANT[id]){const d=lev(s,v);if(d>(v.length<=6?1:2))continue;if(d<best){best=d;who=new Set([id]);}else if(d===best)who.add(id);}
  if(who.size===1)return {id:[...who][0],close:true};if(who.size>1)return {ambiguous:true};return {};}
/* ========== Practice state ========== */
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function freshPractice(){return {order:shuffle(IDS),i:0,round:1,tries:0,msg:'',ok:false,done:false,status:{},shown:false,hint:false};}
function freshSort(){return {order:shuffle(IDS),i:0,right:0,seen:0,msg:'',done:false};}
const prTarget=sim=>{const r=sim.st.pr;return r.order[r.i]||null;};
const prView=(sim,id)=>{const v=sim.p.view;if(v!=='both'&&LAB[v].some(l=>l[0]===id))return v;return (BONES[id]&&BONES[id].view)||'front';};
function prNext(sim){const r=sim.st.pr;if(!prTarget(sim))return;if(!r.done&&!r.status[r.order[r.i]])r.status[r.order[r.i]]='skipped';r.i++;
  r.keep='';r.tries=0;r.msg='';r.ok=false;r.done=false;r.shown=false;r.hint=false;r.focus=true;const t=prTarget(sim);if(t){zoomOK(sim,t);}sim.infoDirty=true;}
function zoomOK(sim,id){const z=sim.p.zoom;if(z==='whole')return;const v=prView(sim,id),Z=ZOOM[z];const here=LAB[v].some(l=>l[0]===id&&inZoom(l,Z));if(!here)BioLab.setValues(sim,{zoom:'whole'});}
const inZoom=(l,Z)=>{const x=Math.abs(l[1]);return (Z.x0<0?x<=Z.x1:(x>=Z.x0&&x<=Z.x1))&&l[2]>=Z.y0&&l[2]<=Z.y1;};
function prAnswer(sim,id,raw){const r=sim.st.pr,t=prTarget(sim);if(!t||r.done)return;r.focus=true;
  const T=BONES[t];
  if(id===t||raw&&raw.id===t&&!raw.everyday){r.done=true;r.ok=true;if(!r.status[t])r.status[t]=r.tries?'later':'first';
    r.msg='<b>Correct: '+T.n+'.</b>'+(raw&&raw.close?' Check the spelling: '+T.n+'.':'')+(raw&&raw.exact&&NORM(raw.typed)!==NORM(T.n)?' The word on the quiz is '+T.n+'.':'')+' '+T.clue;sim.infoDirty=true;return;}
  r.tries++;if(raw&&raw.everyday&&raw.id===t){r.msg='You have the right bone, but that is the everyday name. Use its anatomical name.';}
  else if(raw&&raw.vague)r.msg='Which vertebrae? Name the section: neck, upper back or lower back each has its own name.';
  else if(raw&&raw.ambiguous)r.msg='That spelling is close to two different bones. Check it letter by letter.';
  else if(raw&&raw.none)r.msg='Type a bone name first.';
  else{const w=id||(raw&&raw.id),nm=w&&BONES[w].n,pl=w&&/s$|ges$|vertebrae$/.test(nm)&&w!=='humerus'&&w!=='radius'&&w!=='pelvis'&&w!=='coccyx';r.msg=(w?'Not the '+nm.toLowerCase()+'. The '+nm.toLowerCase()+(pl?' are ':' is ')+BONES[w].where+'. ':'That is not one of the bones in the word bank. ')+'Look at where the numbered bone sits.';if(r.tries>=2)r.hint=true;}
  sim.infoDirty=true;}
function findAnswer(sim,id){const r=sim.st.pr,t=prTarget(sim);if(!t||r.done||!id)return;prAnswer(sim,id,{id});}
/* ========== Virtual lab data: formula table exactly as on the handout ========== */
const FORM={femur:{CM:[2.32,65.53,3.94],CF:[2.47,54.10,3.72],AM:[2.10,72.22,3.91],AF:[2.28,59.76,3.41],SM:[2.15,72.57,3.80],SF:[2.15,72.57,3.80]},
  tibia:{CM:[2.42,81.93,4.00],CF:[2.90,61.53,3.66],AM:[2.19,85.36,3.96],AF:[2.45,72.56,3.70],SM:[2.39,81.45,3.24],SF:[2.39,81.45,3.24]},
  ulna:{CM:[3.76,75.55,4.72],CF:[4.27,57.76,4.30],AM:[3.20,82.77,4.74],AF:[3.31,75.38,4.83],SM:[3.48,77.45,4.66],SF:[3.48,77.45,4.66]},
  humerus:{CM:[2.89,78.10,4.57],CF:[3.36,57.97,4.45],AM:[2.88,75.48,4.23],AF:[3.08,64.67,4.25],SM:[2.68,83.19,4.16],SF:[2.68,83.19,4.16]}};
const GROUPN={C:'Caucasian',A:'African-American',S:'Asian'},SEXN={M:'male',F:'female'};
const PARTNERS=[{n:'Partner A',k:'CF',lo:158,hi:172},{n:'Partner B',k:'AM',lo:170,hi:186},{n:'Partner C',k:'SM',lo:164,hi:178}];
const MEAS={femur:{l:'Femur',from:'greater trochanter',to:'knee',id:'femur',a:[93,458],b:[56,716]},tibia:{l:'Tibia',from:'tibial tuberosity',to:'medial malleolus',id:'tibia',a:[54,747],b:[28,938]},ulna:{l:'Ulna',from:'elbow',to:'styloid process',id:'ulna',a:[138,352],b:[168,478]},height:{l:'Height',from:'floor',to:'top of the head',id:null,a:[0,1000],b:[0,0]}};
const SITE=[{b:'humerus',len:38.2,k:'CM'},{b:'femur',len:44.0,k:'AF'},{b:'ulna',len:25.4,k:'CM'},{b:'femur',len:52.4,k:'CM'},{b:'femur',len:43.9,k:'AF'},{b:'tibia',len:45.7,k:'CM'}];
const eqOf=(bone,k)=>FORM[bone][k];const calcH=(bone,k,x)=>{const e=eqOf(bone,k);return e[0]*x+e[1];};
const cap=s=>s[0].toUpperCase()+s.slice(1);
function partnerData(sim,i){const V=sim.vlab,P=PARTNERS[i];if(!V)return null;const r=V.rng(100+i),g=()=>{let u=0,v=0;while(!u)u=r();while(!v)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(6.2832*v);};
  const H=Math.round((P.lo+r()*(P.hi-P.lo))*10)/10,o={height:H};['femur','tibia','ulna'].forEach(b=>{const e=eqOf(b,P.k),n=clamp(g(),-1.6,1.6)*e[2];o[b]=Math.round(((H-e[1]+n)/e[0])*10)/10;});return o;}
function formulaTable(){const row=(b,l)=>{const f=FORM[b],c=k=>f[k][0].toFixed(2)+'x + '+f[k][1].toFixed(2)+' ± '+f[k][2].toFixed(2);return '<tr><th scope="row">'+l+'</th><td>'+c('CM')+'</td><td>'+c('CF')+'</td><td>'+c('AM')+'</td><td>'+c('AF')+'</td><td>'+c('SM')+'</td><td>Same as Asian male</td></tr>';};
  return '<div class="tbl-wrap"><table><thead><tr><th scope="col">Bone (x, cm)</th><th scope="col">Caucasian male</th><th scope="col">Caucasian female</th><th scope="col">African-American male</th><th scope="col">African-American female</th><th scope="col">Asian male</th><th scope="col">Asian female</th></tr></thead><tbody>'+row('femur','Femur')+row('tibia','Tibia')+row('ulna','Ulna')+row('humerus','Humerus')+'</tbody></table></div>';}
const hb=sim=>{const B=sim.vlab.bench;if(!B.rd)B.rd={};return B;};
const near=(a,b,t)=>Math.abs(a-b)<=t;
function measCheck(key){return (sim,rv,v)=>{const i=['Partner A','Partner B','Partner C'].indexOf(rv),b=hb(sim),d=partnerData(sim,i);if(!b.rd[i+':'+key])return 'Stretch the tape on '+rv+' first, then type what you read.';const t=d[key];if(near(v,t,.15))return null;if(near(v*10,t,.3)||near(v/10,t,.3))return 'Check the decimal point. The tape reads in centimeters to 0.1 cm.';return 'That does not match the tape on '+rv+'. Read it again at the red line. Each small mark is 0.1 cm.';};}
function fromCheck(bone){return (sim,rv,v)=>{const i=['Partner A','Partner B','Partner C'].indexOf(rv),x=sim.vlab.val('tMeas',bone,i);if(!Number.isFinite(x))return 'Fill in the '+bone+' length for '+rv+' in Table 1 first.';if(near(v,calcH(bone,PARTNERS[i].k,x),.6))return null;
  return 'Check this one. Use the '+bone+' row and the column for '+rv+'’s group and sex. Multiply your length by the slope, then add the intercept.';};}
function siteCheck(col){return (sim,rv,v)=>{const i=SITELAB.indexOf(rv),s=SITE[i],V=sim.vlab,e=eqOf(s.b,s.k),h=calcH(s.b,s.k,s.len);
  if(col==='calc'){if(near(v,h,.6))return null;return 'Check this one. Use the '+s.b+' row and the column for this bone’s group and sex, with x = '+s.len.toFixed(1)+' cm.';}
  const c=V.val('tSite','calc',i),base=Number.isFinite(c)?c:h,want=col==='lo'?base-e[2]:base+e[2];if(near(v,want,.6))return null;return col==='lo'?'The low end is your height minus the ± value from the equation.':'The high end is your height plus the ± value from the equation.';};}
const SITELAB=SITE.map((s,i)=>'Bone '+(i+1)+': '+cap(s.b)+', '+s.len.toFixed(1)+' cm, '+GROUPN[s.k[0]]+' '+SEXN[s.k[1]]);
const LAB_BH={id:'bone-height',title:'Can you estimate height from bone length?',course:'Anatomy & Physiology',teachers:'McKeon',
  source:{label:'Bone Lab.pdf',href:'https://rjhs.instructure.com/courses/15537/assignments/546530'},
  purpose:'<p>Find out whether one bone can tell you how tall a person is. First you measure three lab partners and test the method against their real heights. Then you use it on six bones recovered from a construction site.</p>',
  background:'<p>Long bones and height grow together, so a bone’s length predicts height. Forensic anthropologists use equations built from measured skeletons. Each equation has the form <b>height = slope × length + intercept</b>, in centimeters, and each has a <b>±</b> value, its standard error. The right equation depends on the bone, and on the group and sex of the person.</p><p><b>Formula table.</b> x is the bone length in cm, and the result is height in cm.</p>'+formulaTable()+'<p><b>About the virtual bench.</b> Your partners are fictional. The tape reads to 0.1 cm. Your partners’ numbers are your own, because every notebook gets its own people.</p>',
  materials:['Tape measure (reads to 0.1 cm)','Three lab partners, each with a stated sex and group','The formula table above','Calculator'],
  hypothesis:{prompt:'<p>Will the femur, tibia or ulna give the closest height estimate? Explain why you think so.</p>'},
  setup(sim){},
  controls:[],
  steps:[
    {title:'How to measure',text:'<p>Find these landmarks on the bench figure. <b>Femur:</b> greater trochanter to the knee. <b>Tibia:</b> tibial tuberosity to the medial malleolus. <b>Ulna:</b> elbow to the styloid process. You also measure each partner’s actual height.</p><p>Write your hypothesis in the box below the bench.</p>',setup(sim){BioLab.setValues(sim,{vView:'people',vPartner:'0',vBone:'femur'});}},
    ...[0,1,2].map(i=>({title:'Measure '+PARTNERS[i].n,text:'<p>Measure '+PARTNERS[i].n+' ('+SEXN[PARTNERS[i].k[1]]+', '+GROUPN[PARTNERS[i].k[0]]+'). Choose a measurement under <b>Measure</b>, press <b>Stretch the tape</b>, then read the tape where the red line crosses it. Record femur, tibia, ulna and height in Table 1.</p>',controls:['vBone','hbTape'],setup(sim){BioLab.setValues(sim,{vView:'people',vPartner:String(i)});},
      done:sim=>['femur','tibia','ulna','height'].every(m=>hb(sim).rd[i+':'+m]&&Number.isFinite(sim.vlab.val('tMeas',m,i))),doneHint:'Measure all four and type them in Table 1.'})),
    {title:'Calculate each partner’s height',text:'<p>Use the formula table for each partner’s sex and group. Calculate a height from the femur, from the tibia and from the ulna. Record them in Table 2.</p><details><summary>Show the formula table</summary>'+formulaTable()+'</details>',controls:['vPartner','vBone','hbTape'],setup(sim){BioLab.setValues(sim,{vView:'people'});}},
    {title:'Compare with the real height',text:'<p>Compare each calculated height with the partner’s actual height. Is the actual height within the ± range? Answer in Observations.</p>',controls:['vPartner','vBone','hbTape']},
    {title:'Go to the construction site',text:'<p>A crew digging at a construction site has found six human bones. Each one has a tag with its type and length, and with the group and sex a forensic team worked out for it. Choose each bone under <b>Recovered bone</b> or click it, and read its tag.</p>',controls:['vSite'],setup(sim){BioLab.setValues(sim,{vView:'site'});}},
    {title:'Calculate the height from each bone',text:'<p>Calculate a height for each bone, then its low and high ends using the ± value. Record them in Table 3.</p><details><summary>Show the formula table</summary>'+formulaTable()+'</details>',controls:['vSite'],setup(sim){BioLab.setValues(sim,{vView:'site'});}},
    {title:'How many people?',text:'<p>Compare your ranges. Decide which bones could be from the same person and which could not. Then fill in the minimum and maximum number of people and answer the questions.</p>',controls:['vSite']}],
  tables:[
    {id:'tMeas',title:'Table 1: Measurements (cm)',cols:[{id:'who',label:'Partner',rows:PARTNERS.map(p=>p.n)},{id:'femur',label:'Femur',input:'number',check:measCheck('femur')},{id:'tibia',label:'Tibia',input:'number',check:measCheck('tibia')},{id:'ulna',label:'Ulna',input:'number',check:measCheck('ulna')},{id:'height',label:'Actual height',input:'number',check:measCheck('height')}]},
    {id:'tCalc',title:'Table 2: Calculated height (cm)',cols:[{id:'who',label:'Partner',rows:PARTNERS.map(p=>p.n)},{id:'femur',label:'From femur',input:'number',check:fromCheck('femur')},{id:'tibia',label:'From tibia',input:'number',check:fromCheck('tibia')},{id:'ulna',label:'From ulna',input:'number',check:fromCheck('ulna')}]},
    {id:'tSite',title:'Table 3: Construction site bones (cm)',cols:[{id:'bone',label:'Bone',rows:SITELAB},{id:'calc',label:'Calculated height',input:'number',check:siteCheck('calc')},{id:'lo',label:'Low end (−)',input:'number',check:siteCheck('lo')},{id:'hi',label:'High end (+)',input:'number',check:siteCheck('hi')}]}],
  observations:[{id:'range',label:'Which of your calculated heights fell within the ± range of the actual height? Which did not?'}],
  calcs:[{id:'minb',label:'Minimum number of people these six bones could come from',check(sim,n){return Number.isInteger(n)&&n>=1&&n<=6?(n===3?null:(n<3?'Look again: can a person have a height range that does not overlap with one of their own bones?':'Look again: could any bones with overlapping ranges, the same sex and the same group belong to one person?')):'Give a whole number from 1 to 6.';}},
    {id:'maxb',label:'Maximum number of people these six bones could come from',check(sim,n){return n===6?null:'Look again: what if no two bones came from the same person?';}}],
  questions:[
    {id:'q1',n:'1',q:'<p>Could any of the six bones be from the same person? Which ones, and how do you know?</p>'},
    {id:'q2',n:'2',q:'<p>Explain your minimum and your maximum number of people.</p>'},
    {id:'q3',n:'3',q:'<p>Bones 2 and 5 are femurs from females of the same group, nearly the same length. Were these two people necessarily the same height? Explain.</p>'},
    {id:'q4',n:'4',q:'<p>What does the ± after each equation mean?</p>'},
    {id:'q5',n:'5',q:'<p>Were your calculated heights for your partners in range? Give at least two reasons a calculated height could miss a person’s actual height.</p>'}],
  conclusion:{prompt:'<p>Can you estimate height from bone length? Use your partners’ data to say how close the estimate gets and which bone did best.</p>'}
};
/* ========== Controls helpers ========== */
function syncCtl(sim){if(!sim.ui||!sim.ui.ctlW||(sim.vlab&&sim.mode==='vlab'))return;const t=sim.p.task,W=sim.ui.ctlW,A=sim.ui.actB||{},on=(id,v)=>{if(W[id])W[id].hidden=!v;};
  const skel=t==='explore'||t==='practice'||t==='groups';
  on('view',skel||t==='func');on('zoom',skel&&!(sim.p.view==='both'&&t!=='practice'));on('labels',t==='explore'||t==='groups');on('bone',t==='explore'||(t==='practice'&&sim.p.answer==='find'));on('answer',t==='practice');on('sortMode',t==='groups');on('fn',t==='func');on('part',t==='long');on('age',t==='long');
  ['vView','vPartner','vBone','vSite'].forEach(id=>on(id,false));
  [['nextBone',t==='practice'],['showAns',t==='practice'],['restart',t==='practice'],['hbTape',false]].forEach(([k,v])=>{if(A[k])A[k].hidden=!v;});}
function hideTable(sim){if(!sim.ui||!sim.ui.sec)return;const s=sim.ui.sec,h=s.querySelector('.trials>.p-head'),t=s.querySelector('.trials>.tbl');if(h)h.hidden=true;if(t)t.hidden=true;const pl=s.querySelector('.transport [data-act=play]'),sp=s.querySelector('.transport .g-opts');if(pl)pl.hidden=true;if(sp)sp.hidden=true;}
/* ========== Draw: skeleton modes ========== */
function colorFn(sim){const t=sim.p.task,hi=PAL['s1'],ax=PAL['s2'],ap=PAL['s4'];
  if(t==='groups'){if(sim.p.sortMode==='sort'){const r=sim.st.gr,cur=r.order[r.i];return id=>id===cur?hi:null;}return id=>BONES[id].g===AX?mix(ax,'#ffffff',dark()?.25:.35):mix(ap,'#ffffff',dark()?.2:.35);}
  if(t==='practice'){const r=sim.st.pr,cur=prTarget(sim);if(sim.p.answer==='find')return id=>(r.done&&id===cur)?PAL['cv-atp']:null;return id=>id===cur?hi:null;}
  const b=sim.p.bone;return id=>id===b?hi:null;}
function drawLabels(ctx,sim,T,k,opts){const size=12.5*k,gap=size*1.34,Z=T.zoom,list=[];opts=opts||{};sim.vis.rects=sim.vis.rects||[];
  LAB[T.view].forEach(l=>{if(opts.only&&!opts.only(l[0]))return;if(l[4]==='z'&&!Z)return;if(Z&&!inZoom(l,Z))return;const x=Z?Math.abs(l[1]):l[1];list.push({id:l[0],ax:toX(T,x),ay:toY(T,l[2]),col:Z?1:l[3],x});});
  const cols=Z?[1]:[-1,1],top=opts.top||Math.max(14,size),bot=opts.bot||788;
  cols.forEach(c=>{const items=column(list.filter(i=>i.col===c),gap,top,bot);const tx=c<0?222:(Z?578:578);
    items.forEach(it=>{const sel=opts.sel===it.id,name=BONES[it.id].n,col=opts.color?opts.color(it.id):(sel?PAL['rj-ink']||PAL['s1']:PAL['cv-ink']);
      ctx.strokeStyle=sel?PAL['s1']:PAL['cv-soft'];ctx.globalAlpha=sel?1:.75;ctx.lineWidth=sel?2:1;ctx.beginPath();ctx.moveTo(tx+(c<0?4:-4),it.y);ctx.lineTo(it.ax,it.ay);ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(it.ax,it.ay,sel?3.4:2.4,0,6.3);ctx.fill();ctx.globalAlpha=1;
      txt(ctx,name,tx+(c<0?0:0),it.y,{s:size,w:sel?700:500,c:col,a:c<0?'right':'left',b:'middle'});
      ctx.font=(sel?700:500)+' '+size+'px '+FONT;const w=ctx.measureText(name).width;sim.vis.rects.push({id:it.id,x:c<0?tx-w:tx,y:it.y-gap/2,w,h:gap});});});}
function layout(sim){const view=sim.p.view,task=sim.p.task;if(task==='practice'){const t=prTarget(sim),v=t?prView(sim,t):(view==='both'?'front':view);return zoomed(v,sim.p.zoom);}
  if(view==='both'){const b=[{x:0,w:400},{x:400,w:400}];return [figT('front',null,{x:b[0].x,y:16,w:b[0].w,h:770}),figT('back',null,{x:b[1].x,y:16,w:b[1].w,h:770})];}
  return zoomed(view,sim.p.zoom);}
function zoomed(v,z){if(z&&z!=='whole')return [figT(v,z,{x:8,y:8,w:556,h:784})];return [figT(v,null,{x:0,y:15,w:800,h:770})];}
function drawMarks(ctx,sim,T,k){const id=sim.p.bone;if(sim.p.task!=='explore'||!MARKS[id])return;const r=7.5*Math.max(1,k*.8);let n=0;MARKS[id].forEach(m=>{if(!atLeast(m[3]))return;if(m[4]&&m[4]!==T.view)return;const letter=String.fromCharCode(97+n);n++;[1,-1].slice(0,m[1]===0?1:1).forEach(sg=>{const x=toX(T,sg*m[1]),y=toY(T,m[2]);ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['s1'];ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(x,y,r,0,6.3);ctx.fill();ctx.stroke();txt(ctx,letter,x,y+.5,{s:Math.max(11,r*1.45),w:700,c:PAL['cv-ink'],a:'center',b:'middle'});});});}
const visMarks=(id,view)=>(MARKS[id]||[]).filter(m=>atLeast(m[3])&&(!m[4]||m[4]===view));
function drawSkeleton(ctx,sim,k){const task=sim.p.task,Ts=layout(sim),color=colorFn(sim);sim.vis.Ts=Ts;sim.vis.rects=[];
  const ghostId=task==='explore'?sim.p.bone:(task==='practice'&&sim.p.answer!=='find'?prTarget(sim):(task==='groups'&&sim.p.sortMode==='sort'?sim.st.gr.order[sim.st.gr.i]:null));
  const ghost=ghostId&&BONES[ghostId]?{[ghostId]:1}:null;
  Ts.forEach(T=>drawFig(ctx,T,color,{ghost}));
  const two=Ts.length>1;
  if(two){const f=15*k;Ts.forEach((T,i)=>txt(ctx,i?'Back':'Front',i?790:10,24,{s:f,w:700,c:PAL['cv-soft'],a:i?'right':'left'}));
    if(task==='explore'&&BONES[sim.p.bone]){pill(ctx,BONES[sim.p.bone].n,400,44,'#C11430','#fff',14*k);}}
  if(task==='explore'&&!two){if(sim.p.labels)drawLabels(ctx,sim,Ts[0],k,{sel:sim.p.bone,top:Ts[0].zoom?20:Math.max(20,14*k)});else if(BONES[sim.p.bone])drawLabels(ctx,sim,Ts[0],k,{only:id=>id===sim.p.bone,sel:sim.p.bone});
    drawMarks(ctx,sim,Ts[0],k);}
  if(task==='explore'&&two){Ts.forEach(T=>drawMarks(ctx,sim,T,k));}
  if(task==='groups'){const sort=sim.p.sortMode==='sort';if(!two&&sim.p.labels&&!sort)drawLabels(ctx,sim,Ts[0],k,{bot:Ts[0].zoom?788:736,color:id=>BONES[id].g===AX?PAL['s2']:PAL['s4']});
    if(!sort){const y=772,s=13*k;pill(ctx,'Axial: 80 bones',two?130:112,y,'#2d6bd2','#fff',s);pill(ctx,'Appendicular: 126',two?670:668,y,'#a86500','#fff',s);}
    else{const r=sim.st.gr,c=r.order[r.i];if(c)pill(ctx,BONES[c].n,two?400:Math.max(120,14*k*6),30,'#C11430','#fff',14*k);}}
  if(task==='practice')drawPractice(ctx,sim,Ts[0],k);
}
function drawPractice(ctx,sim,T,k){const r=sim.st.pr,t=prTarget(sim),size=13.5*k;
  const done=id=>r.status[id]&&id!==t;drawLabels(ctx,sim,T,k,{only:done,top:64,bot:788,sel:null});sim.vis.rects=[];
  if(!t){const m=wrap(ctx,'You went through every bone. See your results below the skeleton.',230,14*k,600);m.forEach((s,i)=>txt(ctx,s,12,30+i*18*k,{s:14*k,w:600}));return;}
  const find=sim.p.answer==='find',head=find?'Find the '+BONES[t].n:'Bone '+(r.i+1)+' of '+r.order.length;
  pill(ctx,head,Math.max(10,0)+ctx.measureText?(()=>{ctx.font='700 '+size+'px '+FONT;return ctx.measureText(head).width/2+22;})():120,28,PAL['cv-ink'],PAL['card'],size);
  if(find&&!r.done)return;
  const L=LAB[T.view].filter(l=>l[0]===t&&(T.zoom?inZoom(l,T.zoom):l[4]!=='z'));if(!L.length){const m=wrap(ctx,'This bone is out of view. Choose another zoom.',220,13*k);m.forEach((s,i)=>txt(ctx,s,12,70+i*17*k,{s:13*k}));return;}
  const l=L[0],c=T.zoom?1:l[3],x=T.zoom?Math.abs(l[1]):l[1],ax=toX(T,x),ay=toY(T,l[2]),tx=c<0?150:650,ty=clamp(ay,70,770),R=13*Math.max(1,k*.85);
  ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(ax,ay);ctx.stroke();ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax,ay,3.6,0,6.3);ctx.fill();ctx.beginPath();ctx.arc(tx,ty,R,0,6.3);ctx.fill();
  txt(ctx,String(r.i+1),tx,ty+.5,{s:R*1.15,w:700,c:'#fff',a:'center',b:'middle'});
  if(r.done)txt(ctx,BONES[t].n,tx,ty+R+13*k*.8,{s:13*k,w:700,c:PAL['cv-ink'],a:'center',b:'middle'});}
/* ========== Draw: functions ========== */
function drawFunc(ctx,sim,k,t){const F=FUNCS[sim.p.fn],view=sim.p.view==='both'?'front':sim.p.view,T=figT(view,null,{x:0,y:15,w:800,h:770});sim.vis.Ts=[T];sim.vis.rects=[];
  const hi=F.hi==='all'?null:Object.fromEntries(F.hi.map(i=>[i,1])),on=sim.p.fn==='blood'?'#dd7f88':mix(PAL['s2'],'#ffffff',dark()?.3:.45);
  drawFig(ctx,T,id=>(F.hi==='all'||(hi&&hi[id]))?on:null);
  ctx.save();ctx.translate(T.ox,T.oy);ctx.scale(T.s,T.s);overlay(ctx,sim.p.fn,t,T);ctx.restore();
  const size=12.5*k,lh=size*1.25,ws=222-6;const L=[],R=[];F.notes.forEach(n=>{const lines=wrap(ctx,n[0],ws,size,600),o={lines:lines.length+.5,tl:lines,ax:toX(T,n[1]),ay:toY(T,n[2]),c:n[3]};(n[3]<0?L:R).push(o);});
  [[L,-1],[R,1]].forEach(([arr,c])=>{column(arr,lh,16,780);const tx=c<0?222:578;arr.forEach(o=>{const yc=o.y+(o.tl.length-1)*lh/2;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(tx+(c<0?4:-4),yc);ctx.lineTo(o.ax,o.ay);ctx.stroke();ctx.fillStyle=PAL['cv-soft'];ctx.beginPath();ctx.arc(o.ax,o.ay,3,0,6.3);ctx.fill();o.tl.forEach((s,i)=>txt(ctx,s,tx,o.y+i*lh,{s:size,w:600,a:c<0?'right':'left',b:'middle'}));});});
  txt(ctx,F.n,16,800-20,{s:15*k,w:700,c:PAL['cv-soft']});}
function overlay(ctx,fn,t,T){const P=(pts,c,a)=>{ctx.globalAlpha=a;ctx.fillStyle=c;ctx.fill(closed(pts));ctx.globalAlpha=1;};
  const sw=(pts,w,c,a)=>{ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.stroke(open(pts));ctx.globalAlpha=1;};
  const tp=RM?0:t;
  if(fn==='protect'){P(ell(0,25,33,18),'#e88fa6',.85);sw([[-24,22],[-10,16],[4,24],[22,18]],1.1,'#9c3f58',.8);sw([[-24,32],[-8,28],[8,34],[24,29]],1.1,'#9c3f58',.8);
    sw([[0,108],[0,200],[0,322]],4.5,'#e8c23a',.95);
    P(ell(-40,240,27,50,.05),'#d98a9b',.55);P(ell(45,240,23,48,-.05),'#d98a9b',.55);P(ell(14,240,24,30,.35),'#c9303f',.9);}
  if(fn==='anchor'){const m='#c0392b';ctx.globalAlpha=.88;ctx.fillStyle=m;ctx.fill(closed(band([[122,215],[128,262],[146,318]],[5,11,5])));ctx.fill(closed(band([[-70,500],[-68,580],[-58,680]],[8,16,7])));ctx.globalAlpha=1;
    sw([[92,192],[108,200],[122,215]],2.5,'#efe3b4',1);sw([[146,318],[155,350],[162,382]],2.5,'#efe3b4',1);sw([[-58,680],[-56,705],[-54,747]],3,'#efe3b4',1);sw([[-72,430],[-71,470],[-70,500]],3,'#efe3b4',1);}
  if(fn==='mineral'||fn==='hormone'){const n=fn==='mineral'?18:12;for(let i=0;i<n;i++){const ph=(i/n+tp*.05)%1,side=i%2?1:-1,x=side*lerp(30,76,(i%5)/5)+Math.sin(ph*6+i)*14,y=lerp(460,760,((i*37)%n)/n)+Math.sin(ph*6.28+i)*18,c=fn==='mineral'?(i%3?'#2d6bd2':'#c27a00'):'#7b3fe4';ctx.globalAlpha=.9;ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,3.2,0,6.3);ctx.fill();}ctx.globalAlpha=1;}
  if(fn==='blood'){[1,-1].forEach(sg=>{P(ell(sg*62,452,12,12),'#c9303f',.9);P(ell(sg*108,190,11,11),'#c9303f',.9);});}
  if(fn==='fat'){const y='#e8c23a';[[[75,520],[55,690]],[[49,770],[46,900]],[[126,225],[140,325]]].forEach(s=>{sw(s,6,y,.95);sw([[-s[0][0],s[0][1]],[-s[1][0],s[1][1]]],6,y,.95);});}
  if(fn==='support'){for(const s of [-1,1]){sw([[s*0,120],[s*0,400]],0,'#000',0);}const ar=(x,y0,y1)=>{sw([[x,y0],[x,y1]],3.4,PAL['s1'],.9);ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.moveTo(x-7,y1-7);ctx.lineTo(x+7,y1-7);ctx.lineTo(x,y1+5);ctx.closePath();ctx.fill();};ar(0,130,350);[-1,1].forEach(s=>{ar(s*40,395,445);ar(s*70,500,690);ar(s*48,750,925);});}}
/* ========== Draw: long bone ========== */
function regionOf(id){return LP[id]&&LP[id].kind==='region';}
function drawLong(ctx,sim,k,t){const G=lg(),P=pal(),sel=sim.p.part,grow=sim.p.age==='grow',size=12.5*k,hon=atLeast('honors'),ap=atLeast('ap');sim.vis.rects=[];
  const redC='#b5343f',yel='#e9c75e',outC=P.bone;
  ctx.save();ctx.lineJoin='round';
  /* periosteum */
  ctx.save();ctx.beginPath();ctx.rect(150,118,500,596);ctx.clip();ctx.strokeStyle=sel==='periosteum'?PAL['s1']:'#9a5a78';ctx.lineWidth=sel==='periosteum'?9:6.5;ctx.stroke(G.out);ctx.restore();
  /* compact shell */
  ctx.fillStyle=sel==='compact'?mix(PAL['s1'],'#ffffff',.55):outC;ctx.fill(G.out);ctx.strokeStyle=P.ink;ctx.lineWidth=1;ctx.stroke(G.out);
  /* compact bone lamellae: fine lines along the shaft */
  ctx.save();ctx.clip(G.out);ctx.strokeStyle=P.ink;ctx.globalAlpha=.2;ctx.lineWidth=.8;for(const dx of [-48,-42,-36,36,42,48]){ctx.beginPath();ctx.moveTo(CX+dx,250);ctx.lineTo(CX+dx,560);ctx.stroke();}ctx.restore();
  /* spongy region with red marrow */
  ctx.save();ctx.clip(G.inn);ctx.fillStyle=sel==='red'?mix(redC,'#ffffff',.0):redC;ctx.fillRect(250,40,300,730);ctx.strokeStyle=sel==='spongy'?PAL['s1']:P.bone;ctx.lineWidth=sel==='spongy'?4:3;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke(G.tr);ctx.restore();
  /* cavity */
  const adultYel=grow?mix(yel,redC,.28):yel;ctx.fillStyle=adultYel;ctx.fill(G.cav);ctx.save();ctx.clip(G.cav);ctx.globalAlpha=.55;G.fat.forEach(f=>{ctx.fillStyle='#fff1b5';ctx.beginPath();ctx.arc(f[0],f[1],f[2],0,6.3);ctx.fill();});ctx.globalAlpha=1;ctx.restore();
  ctx.strokeStyle=sel==='endosteum'?PAL['s1']:P.ink;ctx.lineWidth=sel==='endosteum'?3.5:(hon?1.6:1);ctx.stroke(G.cav);
  if(sel==='cavity'||sel==='yellow'){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=4;ctx.stroke(G.cav);}
  /* plates */
  const plateC=sel==='plate'?PAL['s1']:'#a9c7d3';
  if(grow){ctx.fillStyle=plateC;ctx.fill(G.plateT);ctx.fill(G.plateB);ctx.strokeStyle=P.ink;ctx.lineWidth=.8;ctx.stroke(G.plateT);ctx.stroke(G.plateB);}
  else{ctx.strokeStyle=sel==='plate'?PAL['s1']:P.bone;ctx.lineWidth=sel==='plate'?5:3.5;ctx.beginPath();ctx.moveTo(CX-90,181);ctx.quadraticCurveTo(CX,187,CX+90,181);ctx.moveTo(CX-86,652);ctx.quadraticCurveTo(CX,660,CX+86,652);ctx.stroke();}
  /* caps */
  const capC=sel==='cartilage'?PAL['s1']:'#cfe3ea';ctx.fillStyle=capC;ctx.fill(G.capT);ctx.fill(G.capB);ctx.strokeStyle=P.ink;ctx.lineWidth=.9;ctx.stroke(G.capT);ctx.stroke(G.capB);
  /* artery */
  const art=sel==='artery'?PAL['s1']:'#d11f2f';ctx.strokeStyle=art;ctx.lineCap='round';ctx.lineWidth=sel==='artery'?6:4.5;ctx.stroke(G.art);ctx.lineWidth=sel==='artery'?4:3;ctx.stroke(G.artUp);ctx.stroke(G.artDn);
  ctx.restore();
  /* region brackets, left side */
  const brackets=[['epiphysis',28,178],['metaphysis',182,236],['diaphysis',240,592],['metaphysis',596,650],['epiphysis',654,776]];const bx=258;
  brackets.forEach(b=>{const on=sel===b[0],c=on?PAL['s1']:PAL['cv-soft'];ctx.strokeStyle=c;ctx.lineWidth=on?3:1.6;ctx.beginPath();ctx.moveTo(bx+8,b[1]);ctx.lineTo(bx,b[1]);ctx.lineTo(bx,b[2]);ctx.lineTo(bx+8,b[2]);ctx.stroke();const y=(b[1]+b[2])/2;txt(ctx,LP[b[0]].n,bx-8,y,{s:size,w:on?700:500,c:on?PAL['s1']:PAL['cv-ink'],a:'right',b:'middle'});ctx.font=(on?700:500)+' '+size+'px '+FONT;const w=ctx.measureText(LP[b[0]].n).width,gp=size*1.3;sim.vis.rects.push({id:b[0],x:bx-8-w,y:y-gp/2,w:w+10,h:gp});
    if(on){ctx.save();ctx.globalAlpha=.16;ctx.fillStyle=PAL['s1'];ctx.clip(G.out);ctx.fillRect(250,b[1],300,b[2]-b[1]);ctx.restore();}});
  /* structure labels, right side */
  const list=LP_R.map(l=>({id:l[0],ax:l[1],ay:l[2]}));if(hon)list.push({id:'endosteum',ax:CX+28,ay:500});if(ap)list.push({id:'osteon',ax:696,ay:654});
  column(list,size*1.5,18,ap?640:782);const tx=576;
  list.forEach(it=>{const on=sel===it.id,name=(it.id==='plate'&&!grow)?'Epiphyseal line':LP[it.id].n;ctx.strokeStyle=on?PAL['s1']:PAL['cv-soft'];ctx.lineWidth=on?2:1;ctx.beginPath();ctx.moveTo(tx-4,it.y);ctx.lineTo(it.ax,it.ay);ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(it.ax,it.ay,2.6,0,6.3);ctx.fill();txt(ctx,name,tx,it.y,{s:size,w:on?700:500,c:on?PAL['s1']:PAL['cv-ink'],b:'middle'});ctx.font=(on?700:500)+' '+size+'px '+FONT;const w=ctx.measureText(name).width;sim.vis.rects.push({id:it.id,x:tx,y:it.y-size*.75,w,h:size*1.5});});
  /* osteon inset at Deep dive */
  if(ap){const ix=696,iy=712,R=58;ctx.save();ctx.beginPath();ctx.arc(ix,iy,R,0,6.3);ctx.fillStyle=P.bone;ctx.fill();ctx.clip();ctx.strokeStyle=P.ink;for(let r=9;r<R;r+=8){ctx.globalAlpha=.55;ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(ix,iy,r,0,6.3);ctx.stroke();}ctx.globalAlpha=1;ctx.fillStyle='#d11f2f';ctx.beginPath();ctx.arc(ix,iy,6,0,6.3);ctx.fill();ctx.restore();ctx.strokeStyle=sel==='osteon'?PAL['s1']:PAL['cv-soft'];ctx.lineWidth=sel==='osteon'?3:1.5;ctx.beginPath();ctx.arc(ix,iy,R,0,6.3);ctx.stroke();ctx.setLineDash([4,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ix-R*.8,iy-R*.6);ctx.lineTo(CX+42,540);ctx.stroke();ctx.setLineDash([]);}
  const age=grow?'Growing teen: plate open':'Adult: plate closed';txt(ctx,age,12,792,{s:13*k,w:700,c:PAL['cv-soft']});}
/* ========== Draw: virtual lab bench ========== */
function drawBench(ctx,sim,k){if(sim.p.vView==='site')return drawSite(ctx,sim,k);const V=sim.vlab,i=+sim.p.vPartner||0,P=PARTNERS[i],M=MEAS[sim.p.vBone],b=hb(sim),key=i+':'+sim.p.vBone,read=!!b.rd[key],d=partnerData(sim,i),size=13*k;
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,800,800);
  txt(ctx,P.n+': '+SEXN[P.k[1]]+', '+GROUPN[P.k[0]],16,28,{s:16*k,w:700});txt(ctx,M.l+': '+M.from+' to '+M.to,16,28+21*k,{s:13.5*k,c:PAL['cv-soft']});
  const T=figT('front',null,{x:0,y:96,w:340,h:690});T.ox=170;
  drawFig(ctx,T,id=>id===M.id?PAL['s1']:null);sim.vis.Ts=[T];sim.vis.rects=[];
  const ax=toX(T,M.id==='ulna'||M.id==='femur'||M.id==='tibia'?M.a[0]:0),ay=toY(T,M.a[1]),bx=toX(T,M.id?M.b[0]:0),by=toY(T,M.b[1]);
  if(read){ctx.strokeStyle='#e6b422';ctx.lineWidth=4;ctx.beginPath();if(M.id){ctx.moveTo(ax,ay);ctx.lineTo(bx,by);}else{ctx.moveTo(toX(T,-150),ay);ctx.lineTo(toX(T,-150),by);}ctx.stroke();}
  [[ax,ay],[bx,by]].forEach(q=>{if(!M.id)return;ctx.fillStyle=PAL['s1'];ctx.strokeStyle=PAL['card'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(q[0],q[1],6,0,6.3);ctx.fill();ctx.stroke();});
  /* tape window */
  const wx=350,wy=100,ww=438,wh=680;rr(ctx,wx,wy,ww,wh,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Tape, up close',wx+14,wy+24,{s:14*k,w:700});
  if(!read){const m=wrap(ctx,'Press Stretch the tape to measure from the '+M.from+' to the '+M.to+'.',ww-50,14*k);m.forEach((s,j)=>txt(ctx,s,wx+22,wy+90+j*20*k,{s:14*k,c:PAL['cv-soft']}));return;}
  const L=d[sim.p.vBone],r=V.rng(500+i*7+['femur','tibia','ulna','height'].indexOf(sim.p.vBone)),lo=Math.floor(L)-2-Math.floor(r()*3),span=6,y0=wy+30+22*k,ppc=(wy+wh-24-y0)/span,tx=wx+150,tw=130,up=!M.id;
  const Y=v=>up?y0+span*ppc-(v-lo)*ppc:y0+(v-lo)*ppc,tapeH=span*ppc+12;
  ctx.save();ctx.beginPath();ctx.rect(wx+2,y0-6,ww-4,tapeH);ctx.clip();ctx.fillStyle='#f4d35e';ctx.fillRect(tx,y0-6,tw,tapeH);ctx.strokeStyle='#7a6410';ctx.lineWidth=1;ctx.strokeRect(tx,y0-6,tw,tapeH);
  for(let m=lo*10;m<=(lo+span+1)*10;m++){const v=m/10,y=Y(v),cm=m%10===0,half=m%5===0;ctx.strokeStyle='#1c1c1f';ctx.lineWidth=cm?2.4:(half?1.6:1);ctx.beginPath();ctx.moveTo(tx,y);ctx.lineTo(tx+(cm?64:half?40:22),y);ctx.stroke();if(cm)txt(ctx,String(v),tx+70,y,{s:18*Math.max(1,k*.82),w:700,c:'#1c1c1f',b:'middle'});}
  const yr=Y(L);ctx.strokeStyle='#d11f2f';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(wx+16,yr);ctx.lineTo(tx+tw+18,yr);ctx.stroke();ctx.restore();
  const lb=wrap(ctx,cap(M.to),120,13*k,700);lb.forEach((s,j)=>txt(ctx,s,wx+16,yr-10-(lb.length-1-j)*16*k,{s:13*k,w:700,c:PAL['s1']}));
  txt(ctx,'Each small mark is 0.1 cm.',wx+14,wy+24+18*k,{s:12*k,c:PAL['cv-soft']});}
function drawSite(ctx,sim,k){const sel=+sim.p.vSite||0;ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,0,800,800);sim.vis.siteRows=[];const size=13*k,rowH=800/6;
  SITE.forEach((s,i)=>{const y=i*rowH,on=i===sel,px=8.4,x0=330,len=s.len*px;
    rr(ctx,8,y+6,784,rowH-12,10);ctx.fillStyle=on?PAL['card']:PAL['card2'];ctx.fill();ctx.strokeStyle=on?PAL['s1']:PAL['line'];ctx.lineWidth=on?3:1;ctx.stroke();
    sim.vis.siteRows.push({x:8,y:y+6,w:784,h:rowH-12});
    txt(ctx,'Bone '+(i+1)+': '+cap(s.b),20,y+30,{s:15*k,w:700});txt(ctx,s.len.toFixed(1)+' cm',20,y+30+19*k,{s:size,w:600});txt(ctx,GROUPN[s.k[0]]+' '+SEXN[s.k[1]],20,y+30+38*k,{s:size});
    const cy=y+rowH/2,P=pal(),w=s.b==='femur'?1:(s.b==='ulna'?.62:.82),h=s.b==='femur'?14:11;const pts=[[0,-h*1.5],[.03,-h*1.7],[.07,-h*.9],[.16,-h*.5*w],[.84,-h*.5*w],[.93,-h*1],[.98,-h*1.5],[1,-h*.6],[1,h*.6],[.98,h*1.5],[.93,h*1],[.84,h*.5*w],[.16,h*.5*w],[.07,h*.9],[.03,h*1.7],[0,h*1.5]].map(p=>[x0+p[0]*len,cy+p[1]]);
    ctx.fillStyle=P.bone;ctx.fill(closed(pts));ctx.strokeStyle=P.ink;ctx.lineWidth=1.2;ctx.stroke(closed(pts));
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();const ry=cy+28;ctx.moveTo(x0,ry);ctx.lineTo(x0+len,ry);ctx.moveTo(x0,ry-5);ctx.lineTo(x0,ry+5);ctx.moveTo(x0+len,ry-5);ctx.lineTo(x0+len,ry+5);ctx.stroke();});}
/* ========== Definition ========== */
const SK={
  id:'skeleton',hash:'skeleton',apUnit:9,order:4,tab:'Skeleton',kind:'Learning tool',aspect:1,
  title:'Skeleton: bones of the body',
  card:'Study every named bone from the front and the back, label them yourself, then open up a long bone and estimate height from bone length.',
  lede:{bio:'Click any bone to learn its name, its group and where to feel it on your own body. Then cover the labels and test yourself.',honors:'Learn each bone by name, type and landmark, then test yourself and look inside a long bone.',ap:'Learn the bones, their landmarks and the counts behind the 206, then look inside a long bone down to the osteon.'},
  scale:'An adult skeleton has 206 bones. The figure stands about 170 cm tall, and its hand alone holds 27 bones.',
  prereq:['bodymap'],
  timeless:true,animated:true,graph:false,challengeTitle:'Check yourself',controlsTitle:'Skeleton',
  labs:[LAB_BH],
  init(sim){return {pr:freshPractice(),gr:freshSort()};},
  initVis(sim){sim.vis.rects=[];hideTable(sim);syncCtl(sim);},
  onLevel(sim){hideTable(sim);syncCtl(sim);if(sim.vlab&&sim.mode==='vlab')return;const P=LP[sim.p.part];if(P&&P.lvl&&!atLeast(P.lvl))sim.p.part='diaphysis';},
  controls:[
    {id:'task',label:'What do you want to do?',type:'seg',def:'explore',noTrial:true,options:[{v:'explore',l:'Explore'},{v:'practice',l:'Label practice'},{v:'groups',l:'Axial vs appendicular'},{v:'long',l:'Long bone'},{v:'func',l:'Functions'}],onChange(sim){syncCtl(sim);if(sim.p.task==='practice'){const t=prTarget(sim);if(t)zoomOK(sim,t);}}},
    {id:'view',label:'View',type:'seg',def:'front',options:[{v:'front',l:'Front'},{v:'back',l:'Back'},{v:'both',l:'Both'}],onChange(sim){if(sim.p.view==='both'&&sim.p.task!=='practice'&&sim.p.zoom!=='whole')sim.p.zoom='whole';syncCtl(sim);if(sim.ui&&sim.ui.ctl&&sim.ui.ctl.zoom)sim.ui.ctl.zoom.set(sim.p.zoom);}},
    {id:'zoom',label:'Zoom in on',type:'select',def:'whole',options:[{v:'whole',l:'Whole body'},{v:'head',l:'Skull and neck'},{v:'chest',l:'Chest and shoulders'},{v:'hip',l:'Hips'},{v:'hand',l:'Forearm and hand'},{v:'leg',l:'Knee to foot'}]},
    {id:'bone',label:'Bone',type:'select',def:'none',options:[{v:'none',l:'Choose a bone'}].concat(IDS.map(id=>({v:id,l:BONES[id].n}))),onChange(sim){if(sim.p.task==='practice'&&sim.p.answer==='find'&&sim.p.bone!=='none'){findAnswer(sim,sim.p.bone);sim.p.bone='none';if(sim.ui&&sim.ui.ctl&&sim.ui.ctl.bone)sim.ui.ctl.bone.set('none');}}},
    {id:'labels',label:'Show labels',type:'toggle',def:true,help:'Turn labels off to quiz yourself by clicking.'},
    {id:'answer',label:'Answer by',type:'seg',def:'bank',options:[{v:'bank',l:'Word bank'},{v:'type',l:'Typing'},{v:'find',l:'Finding it'}],onChange(sim){const r=sim.st&&sim.st.pr;if(r){r.tries=0;r.msg='';r.hint=false;}syncCtl(sim);}},
    {id:'sortMode',label:'Groups',type:'seg',def:'show',options:[{v:'show',l:'Show the groups'},{v:'sort',l:'Sort them yourself'}]},
    {id:'fn',label:'Function of bone',type:'select',def:'support',options:Object.keys(FUNCS).map(f=>({v:f,l:FUNCS[f].n}))},
    {id:'part',label:'Part of the long bone',type:'select',def:'diaphysis',options:Object.keys(LP).map(p=>({v:p,l:LP[p].n,lvl:LP[p].lvl}))},
    {id:'age',label:'Age',type:'seg',def:'grow',options:[{v:'grow',l:'Growing teen'},{v:'adult',l:'Adult'}]},
    {id:'vView',label:'Bench',type:'seg',def:'people',vlab:true,options:[{v:'people',l:'Lab partners'},{v:'site',l:'Construction site'}]},
    {id:'vPartner',label:'Lab partner',type:'seg',def:'0',vlab:true,options:PARTNERS.map((p,i)=>({v:String(i),l:p.n}))},
    {id:'vBone',label:'Measure',type:'seg',def:'femur',vlab:true,options:Object.keys(MEAS).map(m=>({v:m,l:MEAS[m].l}))},
    {id:'vSite',label:'Recovered bone',type:'select',def:'0',vlab:true,options:SITE.map((s,i)=>({v:String(i),l:'Bone '+(i+1)+': '+cap(s.b)}))}
  ],
  actions:[
    {id:'nextBone',label:'Next bone',primary:true,run(sim){if(sim.p.task!=='practice')return;prNext(sim);}},
    {id:'showAns',label:'Show the answer',run(sim){if(sim.p.task!=='practice')return;const r=sim.st.pr,t=prTarget(sim);if(!t||r.done)return;r.done=true;r.ok=false;r.status[t]='shown';r.msg='This one is <b>'+BONES[t].n+'</b>. '+BONES[t].clue+' It goes on your list to practice at the end.';sim.infoDirty=true;}},
    {id:'restart',label:'Start over',run(sim){sim.st.pr=freshPractice();sim.infoDirty=true;}},
    {id:'hbTape',label:'Stretch the tape',primary:true,vlab:true,run(sim){if(!sim.vlab)return;hb(sim).rd[(+sim.p.vPartner||0)+':'+sim.p.vBone]=1;}}
  ],
  metrics:[
    {id:'mName',label:'Bone',text:true,noTrial:true,get(sim){const t=sim.p.task;if(t==='practice'){const r=sim.st.pr;return r.i<r.order.length?'Bone '+(r.i+1)+' of '+r.order.length:'Finished';}if(t==='long')return LP[sim.p.part]?LP[sim.p.part].n:'None';if(t==='func')return FUNCS[sim.p.fn].n;return BONES[sim.p.bone]?BONES[sim.p.bone].n:'Click a bone';}},
    {id:'mGroup',label:'Group',text:true,noTrial:true,get(sim){const t=sim.p.task;if(t==='practice'){const n=Object.values(sim.st.pr.status).filter(s=>s==='first').length;return n+' right on the first try';}if(t==='long'||t==='func')return 'All bones';if(t==='groups')return '80 axial, 126 appendicular';return BONES[sim.p.bone]?cap(BONES[sim.p.bone].g):'Axial or appendicular';}},
    {id:'mCount',label:'In your body',text:true,noTrial:true,get(sim){const t=sim.p.task;if(t==='explore'&&BONES[sim.p.bone])return BONES[sim.p.bone].ct;return '206 bones in total';}}
  ],
  narrate(sim){if(sim.vlab&&sim.mode==='vlab'){if(sim.p.vView==='site')return '<b>Six recovered bones.</b> Each tag gives you the bone, its length and the group and sex to use in the equation.';const M=MEAS[sim.p.vBone];return '<b>'+M.l+':</b> measure from the '+M.from+' to the '+M.to+'. Read the tape where the red line crosses it.';}
    const t=sim.p.task;
    if(t==='explore'){const B=BONES[sim.p.bone];if(!B)return 'Click any bone, or choose one from the Bone list. <b>Use Zoom</b> for the small bones of the hand and foot, and switch to Back for the scapula and the spine.';return '<b>'+B.n+'</b> is '+B.where+'. '+B.job;}
    if(t==='practice'){const r=sim.st.pr,c=prTarget(sim);if(!c)return 'You went through all 24 bones. Review the ones in your list, then start over.';if(sim.p.answer==='find')return r.done?'<b>'+BONES[c].n+'</b>: '+BONES[c].clue:'Find the <b>'+BONES[c].n+'</b> and click it. No timer: take your time.';return r.done?'<b>'+BONES[c].n+'</b>: '+BONES[c].clue:'Name the numbered bone. There is no timer. Use where it sits and what it touches.';}
    if(t==='groups')return sim.p.sortMode==='sort'?'Sort each bone. Ask whether it belongs to the center of the body or to a limb and the girdle that attaches it.':'<b>Axial</b> bones form the center of the body: skull, vertebral column and ribcage. <b>Appendicular</b> bones are the arms, legs, shoulder bones and hip bones.';
    if(t==='long'){const P=LP[sim.p.part];return P?'<b>'+P.n+'.</b> '+P.job:'Click a part of the bone.';}
    const F=FUNCS[sim.p.fn];return '<b>'+F.n+'.</b> '+F.job;},
  onClick(sim,x,y){if(sim.vlab&&sim.mode==='vlab'){if(sim.p.vView==='site'&&sim.vis.siteRows){const i=sim.vis.siteRows.findIndex(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);if(i>=0)BioLab.setValues(sim,{vSite:String(i)});}return;}
    const t=sim.p.task;
    if(t==='long'){const hit=longHit(sim,x,y);if(hit)BioLab.setValues(sim,{part:hit});return;}
    const rect=(sim.vis.rects||[]).find(r=>x>=r.x-4&&x<=r.x+r.w+4&&y>=r.y&&y<=r.y+r.h);
    let id=rect?rect.id:null;if(!id&&(t==='explore'||t==='practice'||t==='groups'))id=hitBone(sim,x,y);
    if(t==='explore'){if(id||rect)BioLab.setValues(sim,{bone:id});else BioLab.setValues(sim,{bone:'none'});}
    else if(t==='practice'&&sim.p.answer==='find'&&id){findAnswer(sim,id);}
  },
  infoPanel(sim){if(sim.vlab&&sim.mode==='vlab')return panelVlab(sim);const t=sim.p.task;return t==='practice'?panelPractice(sim):t==='groups'?panelGroups(sim):t==='long'?panelLong(sim):t==='func'?panelFunc(sim):panelExplore(sim);},
  bindInfo(sim,el){const r=sim.st.pr;
    el.querySelectorAll('[data-bank]').forEach(b=>b.addEventListener('click',()=>{prAnswer(sim,b.dataset.bank);BioLab.refresh(sim);}));
    const f=el.querySelector('form[data-type]');if(f){f.addEventListener('submit',e=>{e.preventDefault();const inp=f.querySelector('input'),c=classify(inp.value);c.typed=inp.value;r.keep=inp.value;prAnswer(sim,null,c);BioLab.refresh(sim);});if(r.focus&&!r.done){const inp=f.querySelector('input');inp.value=r.keep||'';setTimeout(()=>{try{inp.focus({preventScroll:true});}catch(e){}},0);}}
    if(r.focus){r.focus=false;}
    const nx=el.querySelector('[data-next]');if(nx)nx.addEventListener('click',()=>{prNext(sim);BioLab.refresh(sim);});
    const ag=el.querySelector('[data-again]');if(ag)ag.addEventListener('click',()=>{const miss=IDS.filter(id=>sim.st.pr.status[id]!=='first');const n=freshPractice();if(miss.length&&ag.dataset.again==='miss'){n.order=shuffle(miss);}sim.st.pr=n;BioLab.refresh(sim);});
    const h=el.querySelector('[data-hint]');if(h)h.addEventListener('click',()=>{r.hint=true;sim.infoDirty=true;BioLab.refresh(sim);});
    el.querySelectorAll('[data-sort]').forEach(b=>b.addEventListener('click',()=>{const g=sim.st.gr,c=g.order[g.i];if(g.done)return;const ok=b.dataset.sort===BONES[c].g;g.seen++;if(ok)g.right++;g.done=true;g.ok=ok;BioLab.refresh(sim);}));
    const gn=el.querySelector('[data-gnext]');if(gn)gn.addEventListener('click',()=>{const g=sim.st.gr;g.i=(g.i+1);g.done=false;if(g.i>=g.order.length){sim.st.gr=freshSort();}BioLab.refresh(sim);});},
  challenges:[
    {lvl:'bio',instant:true,show:'clavicle',q:'The clavicle touches the sternum. Which group does the clavicle belong to?',choices:['Axial','Appendicular'],correct:BONES.clavicle.g===AP?1:0,explain:'Shoulder bones are appendicular, even though the clavicle touches the sternum. Axial means skull, vertebral column and ribcage.'},
    {lvl:'bio',instant:true,show:'radius',q:'In anatomical position, which forearm bone is on the thumb side?',choices:['Ulna','Radius','Humerus'],correct:1,explain:'The radius is on the thumb side. The ulna is on the little-finger side and forms the point of your elbow.'},
    {lvl:'bio',instant:true,show:'lumbar',q:'How many cervical, thoracic and lumbar vertebrae do you have?',choices:['7, 12 and 5','5, 12 and 7','12, 7 and 5','7, 5 and 12'],correct:0,explain:'Breakfast at 7, lunch at 12, dinner at 5. Going down the spine: 7 cervical, 12 thoracic, 5 lumbar.'},
    {lvl:'honors',instant:true,show:'pelvis',q:'Which of these is appendicular?',choices:['Sacrum','Coccyx','A hip bone','Sternum'],correct:2,explain:'Hip bones attach the legs, so they are appendicular. The sacrum between them is part of the vertebral column, so it is axial.'},
    {lvl:'honors',instant:true,show:'tibia',q:'Which lower leg bone carries most of your body weight, and which side of the leg is it on?',choices:['The fibula, on the little-toe side','The tibia, on the big-toe side','The fibula, on the big-toe side','The tibia, on the little-toe side'],correct:1,explain:'The tibia is the thick bone on the medial (big-toe) side. The fibula is thin and lateral, and carries little of your weight.'},
    {lvl:'honors',instant:true,show:'ribs',q:'Which ribs attach to the sternum with their own cartilage?',choices:['All 12 pairs','Pairs 1 to 7','Pairs 8 to 10','Pairs 11 and 12'],correct:1,explain:'Pairs 1 to 7 are true ribs. Pairs 8 to 10 are false ribs, which join the cartilage above. Pairs 11 and 12 float.'},
    {lvl:'ap',instant:true,q:'Axial bones number 80 of the 206. Your hands and feet alone hold how many bones?',choices:['About a quarter of the skeleton','Just over half: 106 of 206','Exactly 80','Just over a third'],correct:1,explain:'Each hand has 27 bones (8 + 5 + 14) and each foot has 26 (7 + 5 + 14), so that is 2 × 27 + 2 × 26 = 106.'},
    {lvl:'ap',instant:true,q:'What sets the limit on how long a femur can grow?',choices:['When the articular cartilage wears away','When the epiphyseal plate closes and turns to bone','When yellow marrow replaces red marrow','When the periosteum stops thickening the shaft'],correct:1,explain:'Length comes from the cartilage of the epiphyseal plate. Once it turns to bone, leaving the epiphyseal line, the bone can only get thicker. Set Age to Adult to see this.'},
    {lvl:'ap',instant:true,q:'A patient donates bone marrow for a stem cell transplant. Where do doctors usually take it from?',choices:['The back of the pelvis','The shaft of the femur','The fibula','The patella'],correct:0,explain:'Adult red marrow sits mostly in flat bones such as the pelvis. The shaft of an adult femur holds mostly yellow marrow.'}
  ],
  onChallenge(sim,ch,phase){if(phase==='done'&&ch&&ch.show&&sim.p.task==='explore')BioLab.setValues(sim,{bone:ch.show});},
  lab:{bio:'<p><b>Can you get every bone on the quiz?</b> Your teacher’s word bank has 24 names.</p><ol><li>In <b>Explore</b>, click each bone and find it on your own body.</li><li>Turn off <b>Show labels</b> and click each bone again, saying its name before you read it.</li><li>Go to <b>Label practice</b> with the <b>Word bank</b>. Note which bones you missed.</li><li>Practice again with <b>Typing</b> until the bones you miss are gone.</li></ol><p>Write down: which two pairs of bones do you mix up most? What will you use to tell them apart?</p>',
    honors:'<p><b>Can you get every bone on the quiz?</b> Your teacher’s word bank has 24 names.</p><ol><li>In <b>Explore</b>, click each bone and note its bone type and landmarks.</li><li>Go to <b>Label practice</b> with <b>Typing</b>, then with <b>Finding it</b> on the back view.</li><li>In <b>Long bone</b>, compare the growing teen with the adult.</li></ol><p>Write down: which structures change between the two, and what does that mean for how tall a person can get?</p>',
    ap:'<p><b>Check the count.</b> Add up the bones of the axial and appendicular skeleton from the counts in Explore. Do you reach 80 and 126?</p><ol><li>Add 22 skull bones, 6 ear bones, the hyoid, 26 in the vertebral column, 24 ribs and the sternum.</li><li>Do the same for the arms, legs, shoulder bones and hip bones.</li><li>Open <b>Long bone</b> at Deep dive and explain how a femur can be strong and light at once, using compact bone, spongy bone and the medullary cavity.</li></ol>'},
  terms:[
    {t:'Axial skeleton',d:'The skull, vertebral column and ribcage. 80 bones.'},{t:'Appendicular skeleton',d:'The arms, legs, shoulder bones and hip bones. 126 bones.'},
    {t:'Diaphysis',d:'The shaft of a long bone.'},{t:'Epiphysis',d:'The enlarged end of a long bone.'},{t:'Epiphyseal plate',d:'The cartilage band where a growing long bone lengthens.'},{t:'Metaphysis',d:'The flared zone between the shaft and the epiphysis.'},
    {t:'Compact bone',d:'Dense outer bone that gives strength.'},{t:'Spongy bone',d:'The lattice of bone inside the ends. It holds red marrow.'},{t:'Medullary cavity',d:'The hollow center of the shaft.'},{t:'Periosteum',d:'The tough membrane on the outside of a bone.'},{t:'Articular cartilage',d:'The smooth cap on a bone end at a joint.'},
    {t:'Hematopoiesis',d:'Making blood cells, which happens in red marrow.'},{t:'Yellow marrow',d:'Fatty marrow that stores energy.'},{t:'Nutrient artery',d:'The artery that enters the shaft and supplies the marrow.'},
    {t:'Phalanx',d:'One finger or toe bone. The plural is phalanges.',lvl:'honors'},{t:'Sesamoid bone',d:'A bone that forms inside a tendon, like the patella.',lvl:'honors'},{t:'Trabeculae',d:'The thin struts of spongy bone.',lvl:'honors'},{t:'Osteon',d:'The ring-shaped unit of compact bone.',lvl:'ap'}
  ],
  about:'<p><b>What this is.</b> A drawn study model of an adult skeleton, not a scan. Proportions are close to real but simplified, and the small bones are enlarged slightly so that you can see them and click them.</p>'+
    '<p><b>How the word bank maps to the art.</b> Cranium here covers the whole skull above the jaw, including the upper face bones, so the mandible is the only separate skull bone. Pelvis means the two hip bones. Strictly, the bony pelvis also includes the sacrum and coccyx, which the word bank lists on their own. Phalanges highlights both fingers and toes.</p>'+
    '<p><b>Educational use only.</b> This tool teaches names and locations. It does not diagnose injuries, so anyone hurt should see an athletic trainer or a doctor.</p><p><b>Counts.</b> 206 is the usual adult total. Real people vary: some have an extra rib or small extra bones in the hand and foot, and children have more because their bones have not fused yet.</p>'+
    '<p><b>Long bone.</b> The cutaway is a generalized long bone, not a specific femur. Plate closure varies by bone and person, generally in the mid to late teens.</p>'+
    '<p><b>Virtual lab.</b> These are the handout’s mid-20th-century regression equations (Trotter and Gleser). Their group labels come from those samples, and modern forensic practice treats them with caution. Asian female uses the male equation on the sheet because that data set had no female sample. The original equations use bones measured on a skeleton, and your bench measures a landmark-to-landmark length on a living partner, as the handout does. Because the equations come with a standard error, your estimate can miss the actual height. Your partners’ bone lengths are generated from the equations plus random variation, so this bench can show how well the method behaves but it cannot test the equations on real bodies.</p>',
  thumbSetup(sim){BioLab.setValues(sim,{bone:'femur',labels:false});}
};
function hitBone(sim,x,y){const Ts=sim.vis.Ts||[];const cx=hitCtx();for(const T of Ts){if(T.clip&&(x<T.clip.x||x>T.clip.x+T.clip.w||y<T.clip.y||y>T.clip.y+T.clip.h))continue;
    const ux=(x-T.ox)/T.s,uy=(y-T.oy)/T.s,L=art()[T.view],R=[0,6,12];
    for(const rad of R){const pts=rad?[[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]].map(d=>[ux+d[0]*rad/T.s,uy+d[1]*rad/T.s]):[[ux,uy]];
      for(const p of pts){for(let i=L.length-1;i>=0;i--){const e=L[i];if(!e.id||e.line||e.deco)continue;if(cx.isPointInPath(e.p,p[0],p[1]))return e.id;}}}}
  return null;}
let HC=null;function hitCtx(){if(!HC){const c=document.createElement('canvas');c.width=c.height=4;HC=c.getContext('2d');}return HC;}
function longHit(sim,x,y){const r=(sim.vis.rects||[]).find(q=>x>=q.x-4&&x<=q.x+q.w+4&&y>=q.y&&y<=q.y+q.h);if(r)return r.id;const G=lg(),c=hitCtx(),cur=sim.p.part;
  c.lineWidth=14;if(c.isPointInStroke(G.artHit,x,y))return 'artery';
  if(c.isPointInPath(G.capT,x,y)||c.isPointInPath(G.capB,x,y))return 'cartilage';
  if(c.isPointInPath(G.plateT,x,y)||c.isPointInPath(G.plateB,x,y))return 'plate';
  if(c.isPointInPath(G.cav,x,y))return cur==='cavity'?'yellow':'cavity';
  if(c.isPointInPath(G.inn,x,y))return cur==='spongy'?'red':'spongy';
  c.lineWidth=12;if(c.isPointInStroke(G.out,x,y)&&y>118&&y<714&&!c.isPointInPath(G.inn,x,y)&&(!c.isPointInPath(G.out,x,y)))return 'periosteum';
  if(c.isPointInPath(G.out,x,y))return 'compact';return null;}
/* ========== Panels ========== */
function panelExplore(sim){const B=BONES[sim.p.bone],hon=atLeast('honors'),ap=atLeast('ap');
  if(!B)return '<div class="p-head"><h3>Bones of the body</h3></div><p>Click a bone or a label, or choose one from the <b>Bone</b> list.</p><p>The adult skeleton has <b>206 bones</b>. Your spine alone has <b>7 cervical</b>, <b>12 thoracic</b> and <b>5 lumbar</b> vertebrae, and <b>12 pairs of ribs</b> attach to the thoracic ones.</p>'+(ap?countTable():'');
  let h='<div class="p-head"><h3>'+B.n+'</h3></div><p><b>'+cap(B.g)+'</b> skeleton. <b>In your body:</b> '+B.ct+'.</p><p>'+B.job+'</p><p><b>Find it on yourself:</b> '+B.find+'</p><p><b>Remember it:</b> '+B.clue+'</p>';
  if(hon)h+='<p><b>Bone type:</b> '+B.type+'.</p>'+(B.honors?'<p>'+B.honors+'</p>':'');
  const view=sim.p.view==='both'?'front':sim.p.view,M=visMarks(sim.p.bone,view);if(M.length)h+='<p><b>On the picture:</b></p><ul>'+M.map((m,i)=>'<li><b>'+String.fromCharCode(97+i)+'.</b> '+m[0]+'</li>').join('')+'</ul>';
  if(ap)h+='<p>'+B.deep+'</p>';return h;}
function countTable(){return '<div class="tbl-wrap"><table><thead><tr><th>Part</th><th>Bones</th></tr></thead><tbody><tr><td>Skull (8 cranial, 14 face)</td><td>22</td></tr><tr><td>Ear bones and hyoid</td><td>7</td></tr><tr><td>Vertebral column (7 + 12 + 5 + sacrum + coccyx)</td><td>26</td></tr><tr><td>Ribs and sternum</td><td>25</td></tr><tr><th>Axial total</th><th>80</th></tr><tr><td>Shoulder bones (clavicle, scapula)</td><td>4</td></tr><tr><td>Arms and hands</td><td>60</td></tr><tr><td>Hip bones</td><td>2</td></tr><tr><td>Legs and feet</td><td>60</td></tr><tr><th>Appendicular total</th><th>126</th></tr></tbody></table></div>';}
function panelPractice(sim){const r=sim.st.pr,t=prTarget(sim),mode=sim.p.answer;
  if(!t){const n=r.order.length,first=r.order.filter(i=>r.status[i]==='first'),miss=r.order.filter(i=>r.status[i]!=='first');
    return '<div class="p-head"><h3>Your results</h3></div><p>You named <b>'+first.length+' of '+n+'</b> on the first try.</p>'+(miss.length?'<p><b>Practice these:</b> '+miss.map(i=>BONES[i].n).join(', ')+'.</p><div class="row"><button type="button" class="btn primary" data-again="miss">Practice these again</button><button type="button" class="btn" data-again="all">Start over with all 24</button></div>':'<p>All of them on the first try. Now try a harder way to answer.</p><div class="row"><button type="button" class="btn primary" data-again="all">Start over</button></div>');}
  let h='<div class="p-head"><h3>'+(mode==='find'?'Find the '+BONES[t].n:'Name bone '+(r.i+1))+'</h3><span class="count">'+(r.i+1)+' of '+r.order.length+'</span></div>';
  if(r.msg)h+='<p class="verdict '+(r.done&&r.ok?'ok':'no')+'">'+r.msg+'</p>';
  if(r.hint&&!r.done)h+='<p class="pick"><b>Hint:</b> '+BONES[t].hint+'</p>';
  if(r.done){h+='<div class="row"><button type="button" class="btn primary" data-next>Next bone</button></div>';return h;}
  if(mode==='bank'){h+='<p>Pick the name of the numbered bone.</p><div class="row sk-bank" style="flex-wrap:wrap;gap:6px">'+IDS.map(id=>'<button type="button" class="btn" data-bank="'+id+'">'+BONES[id].n+'</button>').join('')+'</div>';}
  else if(mode==='type'){h+='<form data-type class="row" style="flex-wrap:wrap;gap:8px"><label for="sk-ans">Type the name of the numbered bone. Close spelling counts.</label><input id="sk-ans" class="vl-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" style="flex:1 1 180px;min-width:0"><button class="btn primary" type="submit">Check</button></form>';}
  else{h+='<p>Click the bone on the skeleton, or choose it from the <b>Bone</b> list.</p>';}
  if(!r.hint)h+='<p><button type="button" class="btn" data-hint>Give me a hint</button></p>';return h;}
function panelGroups(sim){const hon=atLeast('honors');if(sim.p.sortMode==='sort'){const g=sim.st.gr,c=g.order[g.i],B=BONES[c];let h='<div class="p-head"><h3>Sort: '+B.n+'</h3><span class="count">'+(g.i+1)+' of '+g.order.length+'</span></div>';
    if(g.done){h+='<p class="verdict '+(g.ok?'ok':'no')+'">'+(g.ok?'Correct.':'Not quite.')+' '+B.n+' is <b>'+B.g+'</b>.</p><p>'+B.clue+'</p><div class="row"><button type="button" class="btn primary" data-gnext>Next bone</button></div>';}
    else h+='<p>Which group does the highlighted bone belong to?</p><div class="row"><button type="button" class="btn" data-sort="'+AX+'">Axial</button><button type="button" class="btn" data-sort="'+AP+'">Appendicular</button></div>';
    return h+'<p class="pick">'+g.right+' right out of '+g.seen+' so far.</p>';}
  let h='<div class="p-head"><h3>Two groups</h3></div><p><b>Axial</b> (80 bones): the center of the body. Skull, vertebral column and ribcage.</p><p><b>Appendicular</b> (126 bones): the limbs and what attaches them. Arms, legs, shoulder bones and hip bones.</p><p><b>Watch out:</b> the clavicle touches the sternum and the hip bones touch the sacrum, but both are appendicular. The sacrum and coccyx are part of the spine, so they are axial.</p>';if(hon)h+='<p>Axial bones mostly protect and hold you upright. Appendicular bones mostly move you.</p>';if(atLeast('ap'))h+=countTable();return h;}
function panelLong(sim){const P=LP[sim.p.part],grow=sim.p.age==='grow';if(!P)return '';let h='<div class="p-head"><h3>'+(sim.p.part==='plate'&&!grow?'Epiphyseal line':P.n)+'</h3></div><p>'+P.job+'</p>';if(P.honors&&atLeast('honors'))h+='<p>'+P.honors+'</p>';if(P.ap&&atLeast('ap'))h+='<p>'+P.ap+'</p>';
  if(sim.p.part==='plate')h+=grow?'<p><b>You right now:</b> most of your long bones still have open plates, which close in your mid to late teens.</p>':'<p><b>In an adult:</b> the plate has turned to bone, so the bone cannot get longer. It can still get thicker and stronger.</p>';
  h+='<p class="pick">Click the picture or a label, or use the <b>Part</b> list. Click the same spot twice in the spongy bone for red marrow, or in the cavity for yellow marrow.</p>';return h;}
function panelFunc(sim){const F=FUNCS[sim.p.fn];let h='<div class="p-head"><h3>'+F.n+'</h3></div><p>'+F.job+'</p>';if(F.ap&&atLeast('ap'))h+='<p>'+F.ap+'</p>';
  h+='<p class="pick">Seven functions of bone: support, protection, anchorage, mineral storage, blood cell formation, fat storage and hormone production.</p>';return h;}
function panelVlab(sim){if(sim.p.vView==='site'){const i=+sim.p.vSite||0,s=SITE[i];return '<div class="p-head"><h3>Bone '+(i+1)+' tag</h3></div><p><b>'+cap(s.b)+'</b>, '+s.len.toFixed(1)+' cm</p><p>'+GROUPN[s.k[0]]+', '+SEXN[s.k[1]]+'</p>';}
  const P=PARTNERS[+sim.p.vPartner||0];return '<div class="p-head"><h3>'+P.n+'</h3></div><p>'+cap(SEXN[P.k[1]])+', '+GROUPN[P.k[0]]+'. Use this column of the formula table.</p>';}
SK.draw=function(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['card'];ctx.fillRect(0,0,800,800);
  if(sim.vlab&&sim.mode==='vlab'){drawBench(ctx,sim,k);return;}
  const task=sim.p.task;if(task==='long')drawLong(ctx,sim,k,t);else if(task==='func')drawFunc(ctx,sim,k,t);else drawSkeleton(ctx,sim,k);};
BioLab.register(SK);
})();
