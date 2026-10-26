/* Raider BioLab: virtual fetal pig and grasshopper dissection (RJ Honors Biology).
   An original, illustrated, non-graphic anatomy model drawn on canvas. Follows the RJ Dissection Pre-Lab
   and the Dissection Practical structure list. */
(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,lvText}=BioLab.h;
const LVN={bio:0,honors:1,ap:2};
const lvOK=l=>IGNORE||atLeast(l||'bio');
/* ---------- small geometry helpers ---------- */
function smooth(ctx,pts,closed){const n=pts.length;if(n<3){ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<n;i++)ctx.lineTo(pts[i][0],pts[i][1]);return;}
  const P=i=>closed?pts[(i+n)%n]:pts[clamp(i,0,n-1)];ctx.moveTo(P(0)[0],P(0)[1]);const last=closed?n:n-1;
  for(let i=0;i<last;i++){const p0=P(i-1),p1=P(i),p2=P(i+1),p3=P(i+2);
    ctx.bezierCurveTo(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6,p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6,p2[0],p2[1]);}
  if(closed)ctx.closePath();}
function blob(ctx,pts,fill,stroke,lw){ctx.beginPath();smooth(ctx,pts,true);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||1.2;ctx.stroke();}}
function tube(ctx,pts,w,col,dash){ctx.save();ctx.beginPath();smooth(ctx,pts,false);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=col;ctx.lineWidth=w;if(dash)ctx.setLineDash(dash);ctx.stroke();ctx.restore();}
function edgeTube(ctx,pts,w,col,edge){tube(ctx,pts,w+2,edge||'rgba(0,0,0,.35)');tube(ctx,pts,w,col);}
function ell(ctx,cx,cy,rx,ry,fill,stroke,lw,rot){ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,rot||0,0,6.2832);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||1.2;ctx.stroke();}}
function line(ctx,pts,col,lw,dash){ctx.save();ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.strokeStyle=col;ctx.lineWidth=lw||1;if(dash)ctx.setLineDash(dash);ctx.lineCap='round';ctx.stroke();ctx.restore();}
function inPoly(x,y,pts){let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))c=!c;}return c;}
function segDist(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy;let t=L?((x-a[0])*dx+(y-a[1])*dy)/L:0;t=clamp(t,0,1);return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);}
function nearLine(x,y,pts,w){for(let i=1;i<pts.length;i++)if(segDist(x,y,pts[i-1],pts[i])<=w)return true;return false;}
/* hit primitives: {e:[cx,cy,rx,ry]} ellipse, {b:[pts]} polygon, {p:[pts],w} tube */
function hitPrim(q,x,y){if(q.e){const[cx,cy,rx,ry]=q.e;return ((x-cx)/rx)**2+((y-cy)/ry)**2<=1;}if(q.b)return inPoly(x,y,q.b);if(q.p)return nearLine(x,y,q.p,q.w||6);return false;}
function primCenter(q){if(q.a)return q.a;if(q.e)return [q.e[0],q.e[1]];const P=q.b||q.p;if(q.p){const m=P[Math.floor((P.length-1)/2)],n=P[Math.ceil((P.length-1)/2)];return [(m[0]+n[0])/2,(m[1]+n[1])/2];}
  let sx=0,sy=0;P.forEach(p=>{sx+=p[0];sy+=p[1];});return [sx/P.length,sy/P.length];}
function outlinePrim(ctx,q,col,lw){ctx.save();ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.setLineDash([]);ctx.beginPath();
  if(q.e)ctx.ellipse(q.e[0],q.e[1],q.e[2]+3,q.e[3]+3,0,0,6.2832);else if(q.b)smooth(ctx,q.b,true);else{smooth(ctx,q.p,false);ctx.lineWidth=lw;ctx.globalAlpha=.9;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=col;ctx.lineWidth=(q.w||6)*2+4;ctx.globalAlpha=.35;}
  ctx.stroke();ctx.restore();}
const mir=(pts,cy)=>pts.map(p=>[p[0],2*(cy||225)-p[1]]);

/* ---------- specimen colors (objects, so literal mid-tones are fine; labels use pills) ---------- */
const C={tray:'#3e454e',trayRim:'#76808c',wax:'#4a525c',skin:'#e2c9ba',skinEdge:'#9a7d6e',skinIn:'#cfa594',cavity:'#c09a8a',cavityEdge:'#8e6c60',
  liver:'#7a4a3b',liverU:'#8f5b49',liverLine:'#5a3328',gall:'#6f8f4d',stom:'#d3bea2',stomE:'#9f8a6f',spleen:'#6f3f4b',panc:'#e3cca8',pancE:'#b39c78',
  smint:'#dcc1aa',smintE:'#a8897a',colon:'#c1a385',colonE:'#8f7458',rect:'#a98c70',bladder:'#ece0c4',bladE:'#b5a37e',kid:'#8c5545',kidE:'#5e3426',
  art:'#c4473f',vein:'#4d6fb2',lung:'#dba9a3',lungE:'#a87570',heart:'#9d5b52',heartE:'#6c3631',peri:'rgba(240,235,225,.55)',
  dia:'#b67a6e',trach:'#e7dccb',trachE:'#a99a85',thy:'#8b4a4a',eso:'#d6aa98',lar:'#ece3d2',
  repro:'#d8a99b',reproE:'#9f6e62',testis:'#efe2d0',testE:'#a99478',nerve:'#f3ecd7',nerveE:'#b8a982',bone:'#efe9dc',boneE:'#b9b09e',
  brain:'#e6d2c6',brainE:'#a8897c',cbl:'#d9bfb0',str:'#efe7d2',pin:'#d9dde2',pinHead:'#e05050',tag:'#f2c94c',tagInk:'#222',hoof:'#6e5c52'};

/* ---------- the pig structure list (RJ Dissection Practical) ---------- */
/* lvl: level at which it is clickable. plvl: level at which it can be tagged on the practical (null = never). sex: 'f' or 'm' only. */
const P={
 umbcord:{n:'Umbilical cord',syn:['umbilical cord','umbilicus','cord','navel cord'],sys:'External',plvl:'bio',pv:['ext'],
  fn:'Linked the fetus to the placenta. The blood vessels inside it carried food and oxygen in and wastes out.',
  loc:'On the belly, about two-thirds of the way back from the front legs. Its cut end shows the umbilical vein and two umbilical arteries.'},
 genpap:{n:'Genital papilla',syn:['genital papilla','urogenital papilla','papilla','genital papillae'],sex:'f',sys:'Reproductive (external)',plvl:'bio',pv:['ext'],
  fn:'A small fleshy point just below the anus. Only females have one, so it tells you the pig is female.',
  loc:'Between the hind legs, just ventral to the anus (females only).'},
 ugopen:{n:'Urogenital opening',syn:['urogenital opening','urogenital orifice','urogenital pore','urogenital aperture','urogenital sinus opening'],sys:'Excretory and reproductive (external)',plvl:'bio',pv:['ext'],
  fn:{f:'The shared opening of the urinary and reproductive tracts. In a female it sits just below the anus, beside the genital papilla.',m:'The opening at the end of the penis, just behind the umbilical cord. Urine (and, in an adult, sperm) leaves here.'},
  loc:{f:'Just ventral to the anus, at the base of the genital papilla.',m:'On the midline just caudal to (behind) the umbilical cord.'}},
 nipples:{n:'Mammary papillae (nipples)',syn:['nipples','mammary papillae','teats','nipple'],sys:'External',
  fn:'Two rows of small bumps along the belly. Males and females both have them; in an adult female they deliver milk.',loc:'Two rows along the belly.'},
 anus:{n:'Anus',syn:['anus'],sys:'Digestive (external)',fn:'The end of the digestive tract, under the tail, where feces leave the body.',loc:'Under the base of the tail.'},
 scrotum:{n:'Scrotal sacs',syn:['scrotum','scrotal sac','scrotal sacs'],sex:'m',sys:'Reproductive (external)',
  fn:'Paired pouches of skin below the anus that hold the testes, outside the body cavity where it is slightly cooler.',loc:'Between the hind legs, just ventral to the anus (males only).'},
 larynx:{n:'Larynx',syn:['larynx','voice box'],sys:'Respiratory',plvl:'bio',pv:['thorax'],
  fn:'The voice box at the top of the trachea. Air passes through it, and the vocal cords inside it make sound.',loc:'In the neck just behind the jaw: a firm, pale structure made of cartilage.'},
 trachea:{n:'Trachea',syn:['trachea','windpipe'],sys:'Respiratory',plvl:'bio',pv:['thorax'],
  fn:'The windpipe. Rings of cartilage hold it open so air can flow to and from the lungs.',loc:'Down the middle of the neck from the larynx into the chest. You can see and feel its rings.'},
 esophagus:{n:'Esophagus',syn:['esophagus','oesophagus','gullet'],sys:'Digestive',plvl:'bio',pv:['thorax'],
  fn:'A soft muscular tube that carries food from the mouth to the stomach.',loc:'Dorsal to (behind) the trachea in the neck, slightly to the pig’s left. It passes behind the heart and through the diaphragm to the stomach.'},
 thyroid:{n:'Thyroid gland',syn:['thyroid','thyroid gland'],sys:'Endocrine',plvl:'bio',pv:['thorax'],
  fn:'A small, dark gland on the trachea. Its hormones control metabolism, how fast the body uses energy.',loc:'On the ventral side of the trachea, near where the neck meets the chest.'},
 lungs:{n:'Lungs',syn:['lung','lungs'],sys:'Respiratory',plvl:'bio',pv:['thorax','heart'],
  fn:'Where oxygen enters the blood and carbon dioxide leaves it. In the fetus they were filled with fluid and not yet used: the placenta did their job.',loc:'In the chest on both sides of the heart, under the rib cage.'},
 heart:{n:'Heart',syn:['heart'],sys:'Circulatory',plvl:'bio',pv:['thorax','heart'],
  fn:'A four-chambered muscle that pumps blood to the lungs and to the whole body.',loc:'In the middle of the chest between the lungs, inside a thin sac, the pericardium.'},
 diaphragm:{n:'Diaphragm',syn:['diaphragm'],sys:'Respiratory (muscle)',plvl:'bio',pv:['thorax'],
  fn:'A sheet of muscle that separates the thoracic (chest) cavity from the abdominal cavity. When it contracts, air is pulled into the lungs.',loc:'The thin, curved muscle wall just in front of (cranial to) the liver.'},
 liver:{n:'Liver',syn:['liver'],sys:'Digestive',plvl:'bio',pv:['five'],
  fn:'The largest organ in the abdomen. It makes bile for digesting fats, stores nutrients and removes toxins from the blood.',loc:'Just behind the diaphragm, covering the front of the abdomen: dark brown, with several lobes.'},
 gall:{n:'Gallbladder',syn:['gallbladder','gall bladder'],sys:'Digestive',plvl:'bio',pv:['liver'],
  fn:'A small greenish sac that stores bile made by the liver and squeezes it into the small intestine to help digest fat.',loc:'On the underside of the liver, on the pig’s right side. Lift the liver to see it.'},
 stomach:{n:'Stomach',syn:['stomach'],sys:'Digestive',plvl:'bio',pv:['five','liver'],
  fn:'A J-shaped muscular sac that stores food and starts digesting protein with acid and enzymes.',loc:'On the pig’s left side, partly under the liver.'},
 spleen:{n:'Spleen',syn:['spleen'],sys:'Circulatory and immune',plvl:'bio',pv:['five','liver'],
  fn:'A long, flat, dark organ along the curve of the stomach. It filters the blood, recycles old red blood cells and helps fight infection. It is not a digestive organ.',loc:'Along the outer curve of the stomach, on the pig’s left.'},
 pancreas:{n:'Pancreas',syn:['pancreas'],sys:'Digestive and endocrine',plvl:'bio',pv:['liver','intest'],
  fn:'A bumpy, pale gland beside the start of the small intestine. It sends digestive enzymes into the intestine and releases insulin into the blood.',loc:'In the loop between the stomach and the first part of the small intestine. Lift the liver and stomach to find it.'},
 smint:{n:'Small intestine',syn:['small intestine','small intestines','small bowel','duodenum','jejunum','ileum'],sys:'Digestive',plvl:'bio',pv:['five','liver'],
  fn:'A long, coiled tube where digestion finishes and nutrients are absorbed into the blood.',loc:'The coils filling the middle of the abdomen, held together by thin mesentery.'},
 lgint:{n:'Large intestine (spiral colon)',syn:['large intestine','large intestines','colon','spiral colon','large bowel'],grp:'lgint',sys:'Digestive',plvl:'bio',pv:['five','liver'],
  fn:'In the pig it is wound into a tight spiral. It absorbs water from what is left of the food.',loc:'The tight spiral coil on the pig’s left, behind the stomach.'},
 rectum:{n:'Rectum',syn:['rectum','large intestine','colon'],grp:'lgint',sys:'Digestive',plvl:'bio',pv:['intest'],
  fn:'The last part of the large intestine. It stores feces until they leave through the anus.',loc:'Along the back of the body cavity toward the anus. Move the intestines and the bladder aside to see it.'},
 bladder:{n:'Urinary bladder',syn:['urinary bladder','bladder'],sys:'Excretory',plvl:'bio',pv:['five','intest'],
  fn:'A stretchy sac that stores urine. In the fetus it lies between the two umbilical arteries.',loc:'On the umbilical flap, between the two umbilical arteries.'},
 kidney:{n:'Kidneys',syn:['kidney','kidneys'],sys:'Excretory',plvl:'bio',pv:['intest'],
  fn:'Bean-shaped organs that filter wastes out of the blood and make urine.',loc:'Against the back wall of the abdomen, one on each side of the spine, behind the lining of the cavity. Move the intestines aside.'},
 ureter:{n:'Ureters',syn:['ureter','ureters'],sys:'Excretory',plvl:'bio',pv:['intest'],
  fn:'Thin tubes that carry urine from each kidney to the urinary bladder.',loc:'From the inner edge of each kidney back to the neck of the bladder.'},
 urethra:{n:'Urethra',syn:['urethra'],sys:'Excretory',plvl:'bio',pv:['intest'],
  fn:{f:'Carries urine from the bladder to the urogenital opening.',m:'Carries urine from the bladder out through the penis. In an adult male it carries sperm too.'},loc:'From the neck of the bladder back through the pelvis.'},
 umbvein:{n:'Umbilical vein',syn:['umbilical vein'],lvl:'honors',plvl:'honors',sys:'Circulatory (fetal)',pv:['five'],
  fn:'Carried oxygen-rich, nutrient-rich blood from the placenta into the fetus, toward the liver and heart. It is a vein because it carries blood toward the heart.',
  loc:'From the umbilical cord forward to the liver. You cut it to fold the umbilical flap back.'},
 umbart:{n:'Umbilical arteries',syn:['umbilical artery','umbilical arteries'],sys:'Circulatory (fetal)',plvl:'bio',pv:['five','intest'],
  fn:'Two arteries that carried oxygen-poor blood and wastes from the fetus out to the placenta.',loc:'On either side of the urinary bladder, running from the umbilical cord into the hips.'},
 ra:{n:'Right atrium',syn:['right atrium','right auricle','right atria'],lvl:'honors',plvl:'honors',sys:'Circulatory',pv:['heart'],
  fn:'Receives oxygen-poor blood returning from the body through the cranial and caudal venae cavae.',loc:'The ear-shaped flap (auricle) at the base of the heart on the pig’s right.',deep:'In the fetus much of this blood crosses straight into the left atrium through the foramen ovale.'},
 la:{n:'Left atrium',syn:['left atrium','left auricle','left atria'],lvl:'honors',plvl:'honors',sys:'Circulatory',pv:['heart'],
  fn:'Receives oxygen-rich blood returning from the lungs through the pulmonary veins.',loc:'The ear-shaped flap (auricle) at the base of the heart on the pig’s left.',deep:'Before birth little blood comes back from the lungs; most of what fills it arrives through the foramen ovale.'},
 rv:{n:'Right ventricle',syn:['right ventricle'],lvl:'honors',plvl:'honors',sys:'Circulatory',pv:['heart'],
  fn:'Pumps blood out through the pulmonary artery toward the lungs.',loc:'The lower chamber that makes up most of the ventral (front) surface of the heart, on the pig’s right.',deep:'Before birth most of its output skips the lungs through the ductus arteriosus.'},
 lv:{n:'Left ventricle',syn:['left ventricle'],lvl:'honors',plvl:'honors',sys:'Circulatory',pv:['heart'],
  fn:'The thickest-walled chamber. It pumps blood out through the aorta to the whole body.',loc:'The lower chamber on the pig’s left that forms the pointed tip (apex) of the heart.'},
 cranvc:{n:'Cranial vena cava',syn:['cranial vena cava','anterior vena cava','superior vena cava','precava','precaval vein','cranial vena cavae'],lvl:'honors',plvl:'honors',sys:'Circulatory',pv:['heart'],
  fn:'A large vein that returns oxygen-poor blood from the head, neck and front legs to the right atrium.',loc:'Enters the right atrium from the neck side, on the pig’s right.'},
 caudvc:{n:'Caudal vena cava',syn:['caudal vena cava','posterior vena cava','inferior vena cava','postcava','postcaval vein'],lvl:'honors',plvl:'honors',sys:'Circulatory',pv:['heart'],
  fn:'A large vein that returns blood from the hind body to the right atrium. In the fetus it also carries the oxygen-rich blood from the umbilical vein.',loc:'Comes forward through the liver and diaphragm into the right atrium.'},
 aorta:{n:'Aorta',syn:['aorta','dorsal aorta','ascending aorta','descending aorta'],lvl:'honors',plvl:'honors',sys:'Circulatory',pv:['heart'],
  fn:'The largest artery. It carries blood from the left ventricle out to the body.',loc:'Leaves the base of the left ventricle, behind the pulmonary artery, then runs back along the spine.'},
 aarch:{n:'Aortic arch',syn:['aortic arch','arch of the aorta','arch of aorta'],lvl:'honors',plvl:'honors',sys:'Circulatory',pv:['heart'],
  fn:'The curve of the aorta just after it leaves the heart. Arteries branching from it supply the head and front legs.',loc:'The bend of the aorta toward the pig’s left, just in front of (cranial to) the heart.'},
 pulmart:{n:'Pulmonary artery',syn:['pulmonary artery','pulmonary trunk','pulmonary arteries'],lvl:'honors',plvl:'honors',sys:'Circulatory',pv:['heart'],
  fn:'Carries oxygen-poor blood from the right ventricle toward the lungs.',loc:'Leaves the right ventricle and crosses in front of the aorta, then splits toward each lung.'},
 ductart:{n:'Ductus arteriosus',syn:['ductus arteriosus'],lvl:'ap',sys:'Circulatory (fetal)',
  fn:'A short fetal vessel that shunts blood from the pulmonary artery into the aortic arch, so most blood skips the fluid-filled lungs. It closes within days of birth.',loc:'Between the pulmonary artery and the aortic arch.'},
 foramen:{n:'Foramen ovale',syn:['foramen ovale'],lvl:'ap',sys:'Circulatory (fetal)',
  fn:'An oval opening in the wall between the right and left atria. Before birth, blood flows through it from right to left, skipping the lungs. A flap seals it after birth.',loc:'Inside the heart, in the wall between the atria.'},
 ductven:{n:'Ductus venosus',syn:['ductus venosus'],lvl:'ap',sys:'Circulatory (fetal)',
  fn:'A fetal vessel through the liver that carries much of the umbilical vein’s blood straight to the caudal vena cava.',loc:'Inside the liver, from the umbilical vein to the caudal vena cava.'},
 placenta:{n:'Placenta',syn:['placenta'],lvl:'ap',sys:'Circulatory (fetal)',
  fn:'The organ in the uterus where the fetus’s blood picks up oxygen and food from the mother’s blood and drops off wastes. The two bloods do not mix.',loc:'Not part of the specimen: it stayed in the sow’s uterus.'},
 bodyt:{n:'Body tissues',syn:['body'],lvl:'ap',sys:'Circulatory',fn:'Every organ takes oxygen from the blood and returns carbon dioxide.',loc:''},
 cerebrum:{n:'Cerebrum',syn:['cerebrum','cerebral hemispheres','cerebral hemisphere'],lvl:'honors',plvl:'honors',sys:'Nervous',pv:['brain'],
  fn:'The large front part of the brain, in two hemispheres. It handles the senses, learning, memory and voluntary movement.',loc:'The two large, folded hemispheres under the top of the skull.'},
 cerebellum:{n:'Cerebellum',syn:['cerebellum'],lvl:'honors',plvl:'honors',sys:'Nervous',pv:['brain'],
  fn:'The finely ridged part at the back of the brain. It coordinates balance and smooth movement.',loc:'Behind (caudal to) the cerebrum, above the brainstem.'},
 medulla:{n:'Medulla oblongata',syn:['medulla oblongata','medulla','brainstem','brain stem'],lvl:'honors',sys:'Nervous',
  fn:'The base of the brainstem. It controls automatic jobs such as breathing and heart rate, and connects the brain to the spinal cord.',loc:'Behind the cerebellum, where the brain narrows into the spinal cord.'},
 olfact:{n:'Olfactory bulbs',syn:['olfactory bulb','olfactory bulbs'],lvl:'ap',sys:'Nervous',
  fn:'Process the sense of smell. They are large in pigs, which find food mostly by smell.',loc:'At the very front of the cerebrum, toward the snout.'},
 spinal:{n:'Spinal cord',syn:['spinal cord'],lvl:'honors',sys:'Nervous',fn:'Carries signals between the brain and the body, and handles quick reflexes.',loc:'Runs back from the medulla inside the vertebrae.'},
 testes:{n:'Testes',syn:['testes','testis','testicle','testicles'],sex:'m',sys:'Reproductive',plvl:'bio',pv:['intest'],
  fn:'Make sperm and the hormone testosterone.',loc:'In the scrotal sacs, between the hind legs. Open the skin of the scrotum to see them.'},
 epid:{n:'Epididymis',syn:['epididymis','epididymides'],sex:'m',sys:'Reproductive',plvl:'bio',pv:['intest'],
  fn:'A tightly coiled tube along each testis where sperm mature and are stored.',loc:'The coiled band along the edge of each testis.'},
 spcord:{n:'Spermatic cord',syn:['spermatic cord','spermatic cords'],sex:'m',sys:'Reproductive',plvl:'bio',pv:['intest'],
  fn:'A bundle holding the vas deferens, blood vessels and nerves. It runs from each testis into the abdomen through the inguinal canal.',loc:'From each testis forward to the inguinal opening in the body wall.'},
 vasdef:{n:'Vas deferens',syn:['vas deferens','ductus deferens','sperm duct','vasa deferentia'],sex:'m',sys:'Reproductive',plvl:'bio',pv:['intest'],
  fn:'Carries sperm from the epididymis to the urethra.',loc:'Leaves the spermatic cord inside the body, loops over the ureter, and joins the urethra.'},
 penis:{n:'Penis',syn:['penis'],sex:'m',sys:'Reproductive',plvl:'bio',pv:['intest'],
  fn:'Carries the urethra to the outside. In the fetal pig it runs under the skin of the belly from the pelvis to the urogenital opening.',loc:'A firm, pale cord along the midline of the umbilical flap, behind the umbilical cord.'},
 ovaries:{n:'Ovaries',syn:['ovary','ovaries'],sex:'f',sys:'Reproductive',plvl:'bio',pv:['intest'],
  fn:'Small, bean-shaped organs that make eggs and the hormones estrogen and progesterone.',loc:'Just behind (caudal to) each kidney.'},
 oviduct:{n:'Oviducts',syn:['oviduct','oviducts','fallopian tube','fallopian tubes','uterine tube','uterine tubes'],sex:'f',sys:'Reproductive',plvl:'bio',pv:['intest'],
  fn:'Tiny coiled tubes that carry eggs from each ovary to the uterus. Fertilization happens here.',loc:'Curled tightly around each ovary.'},
 uterus:{n:'Uterus',syn:['uterus','uterine horn','uterine horns','horns of the uterus','horn of the uterus','womb','uterine body'],sex:'f',sys:'Reproductive',plvl:'bio',pv:['intest'],
  fn:'Where the young develop. In the pig it has two long horns, where a whole litter grows, joined to a short body.',loc:'Two horns run from the ovaries back to the midline, where they join the body of the uterus dorsal to the bladder.'},
 vagina:{n:'Vagina',syn:['vagina'],sex:'f',sys:'Reproductive',plvl:'bio',pv:['intest'],
  fn:'The tube from the uterus to the urogenital opening. It receives sperm and is the birth canal.',loc:'Runs back from the body of the uterus through the pelvis, dorsal to the urethra.'}
};
Object.keys(P).forEach(id=>{P[id].id=id;if(!P[id].lvl)P[id].lvl='bio';});
const sexTxt=(v,sex)=>v&&typeof v==='object'?(v[sex]||v.f):v;
/* ---------- grasshopper ---------- */
const H={
 antenna:{n:'Antennae',syn:['antenna','antennae','feelers'],six:1,fn:'Feelers that sense touch and smell.'},
 eye:{n:'Compound eyes',syn:['compound eye','compound eyes','eyes','eye'],six:1,fn:'Large eyes made of thousands of tiny lenses. They are very good at detecting movement.'},
 mandible:{n:'Mandibles',syn:['mandible','mandibles','jaws','mouthparts'],six:1,fn:'Hard, toothed jaws that move side to side to cut and chew leaves.'},
 wings:{n:'Wings (2 pairs)',syn:['wings','wing','forewings','hindwings'],six:1,fn:'Leathery forewings cover and protect the thin, folded hindwings, which do most of the flying.'},
 legs:{n:'Legs (3 pairs)',syn:['legs','leg','jumping legs'],six:1,fn:'Six jointed legs attached to the thorax. The big hind legs are for jumping.'},
 spiracle:{n:'Spiracles',syn:['spiracle','spiracles'],six:1,fn:'Small breathing holes along the sides. Air enters here and flows through tubes (tracheae) straight to the cells.'},
 head:{n:'Head',syn:['head'],fn:'Holds the brain, eyes, antennae and mouthparts.'},
 thorax:{n:'Thorax',syn:['thorax'],fn:'The middle body region, made of three segments. All six legs and both pairs of wings attach here.'},
 abdomen:{n:'Abdomen',syn:['abdomen'],fn:'The segmented rear region. It holds most of the digestive, excretory and reproductive organs.'},
 tympanum:{n:'Tympanum',syn:['tympanum','eardrum'],lvl:'honors',fn:'An eardrum on the side of the first abdominal segment that detects sound.'},
 ovipositor:{n:'Ovipositor',syn:['ovipositor'],sex:'f',fn:'The pointed parts at the tip of a female’s abdomen. They dig into soil to lay eggs.'},
 esoph:{n:'Esophagus',syn:['esophagus'],fn:'Carries food from the mouth to the crop.'},
 crop:{n:'Crop',syn:['crop'],eight:1,fn:'A thin-walled sac that stores food after it is swallowed.'},
 gizzard:{n:'Gizzard',syn:['gizzard','proventriculus'],eight:1,fn:'A muscular chamber lined with hard, tooth-like plates that grinds food.'},
 caeca:{n:'Gastric caeca',syn:['gastric caeca','gastric ceca','caeca','ceca'],eight:1,fn:'Finger-like pouches that release digestive enzymes and absorb nutrients.'},
 midgut:{n:'Stomach (midgut)',syn:['stomach','midgut'],eight:1,fn:'Where most digestion and absorption of nutrients happen.'},
 malp:{n:'Malpighian tubules',syn:['malpighian tubules','malpighian tubule'],eight:1,fn:'Thin threads that pull wastes out of the blood (hemolymph) and empty them into the gut. They do the job of kidneys.'},
 hindgut:{n:'Intestine and rectum',syn:['intestine','hindgut','rectum'],eight:1,fn:'The hindgut absorbs water and salts, and the rectum forms dry pellets that leave through the anus.'},
 hheart:{n:'Heart (dorsal vessel)',syn:['heart','dorsal vessel','dorsal blood vessel'],eight:1,fn:'A tube along the top of the abdomen that pumps blood (hemolymph) forward. The blood then flows loosely around the organs: an open circulatory system.'},
 hgonad:{n:'Ovaries (with eggs)',nm:'Testes',syn:['ovaries','ovary','eggs','testes','testis'],eight:1,fn:{f:'Make eggs. A female’s abdomen is often packed with them.',m:'Make sperm.'}},
 ncord:{n:'Ventral nerve cord',syn:['nerve cord','ventral nerve cord'],fn:'A pair of nerves with knots of nerve cells (ganglia) along the bottom (ventral side) of the body.'},
 salivary:{n:'Salivary glands',syn:['salivary glands'],lvl:'honors',fn:'Make saliva that moistens food and starts digesting it.'},
 hbrain:{n:'Brain',syn:['brain'],lvl:'honors',fn:'A small brain above the esophagus, joined to the ventral nerve cord by a nerve ring.'}
};
Object.keys(H).forEach(id=>{H[id].id=id;if(!H[id].lvl)H[id].lvl='bio';});
const hName=(id,sex)=>id==='hgonad'&&sex==='m'?'Testes':H[id].n;
/* the five systems that differ between the grasshopper and the pig */
const COMPARE=[
 {k:'hheart',t:'Heart and circulation',g:'A tube-shaped heart on the dorsal (top) side; open circulation: blood bathes the organs.',p:'A four-chambered heart in the chest; closed circulation: blood stays in vessels.'},
 {k:'spiracle',t:'Gas exchange',g:'Spiracles and air tubes (tracheae) carry air straight to the cells; no lungs.',p:'Lungs, with blood carrying oxygen from the lungs to the cells.'},
 {k:'malp',t:'Excretion',g:'Malpighian tubules empty wastes into the gut.',p:'Kidneys filter blood and make urine, stored in a bladder.'},
 {k:'ncord',t:'Nervous system',g:'A ventral (bottom) nerve cord with ganglia.',p:'A dorsal spinal cord, protected by the vertebrae, and a large brain.'},
 {k:'crop',t:'Digestion',g:'Crop to store, gizzard to grind, gastric caeca for enzymes.',p:'Stomach to store and start digestion, with a liver and pancreas adding bile and enzymes.'}
];
/* ---------- tools of the trade ---------- */
const TOOLS={
 scalpel:{n:'Scalpel',d:'A small knife with a very sharp, replaceable blade on a flat handle.',u:'Small, shallow cuts through skin, or a nick to start an incision. Too sharp for opening the body: it slices the organs underneath.',h:'Like a pencil, blade down, index finger on the back of the handle. Cut away from yourself and others.'},
 dsc:{n:'Dissecting scissors',d:'Small scissors with one sharp point and one blunt, rounded point.',u:'Cutting skin, muscle and the rib cage to open the body. The blunt blade goes inside, so it does not stab the organs.',h:'Thumb in one ring, ring finger in the other, index finger steadying the blades. Keep the tips pointed up and lift as you cut.'},
 osc:{n:'Operating scissors',d:'Larger, heavier surgical scissors with straight blades.',u:'Cutting tougher tissue such as cartilage and bone. Not in your tray, but you need to know them.',nt:1,h:'The same grip as dissecting scissors: thumb and ring finger in the rings, index finger along the blades.'},
 forceps:{n:'Forceps',d:'A tweezer-like tool with blunt, often ridged or curved tips.',u:'Grasping, lifting and holding tissue and small organs while you cut or look.',h:'Like a pencil, between your thumb and first two fingers. Squeeze gently.'},
 probe:{n:'Blunt probe',d:'A metal rod with a rounded, blunt end, often bent at the tip.',u:'Separating tissues and organs, tracing tubes and vessels, and pointing to structures without cutting them.',h:'Like a pencil. Push and slide gently between tissues.'},
 needle:{n:'Dissecting needle',alt:'(teasing needle)',d:'A sharp, straight steel needle set in a handle.',u:'Teasing apart small structures and fine tissue, and picking up tiny parts.',h:'Like a pencil, point away from your fingers. Work gently.'},
 pins:{n:'Dissecting pins',d:'Long steel pins with a T-shaped or ball head.',u:'Pinning skin flaps and the specimen to the wax of the tray to hold them open.',h:'Push with your thumb on the head, angled away from the specimen, so the pins hold the flap open and stay out of your way.'},
 string:{n:'String',d:'Strong cotton string.',u:'Tying the pig’s legs so it stays on its back, ventral side up, during the dissection.',h:'Tie one end around a front leg, pass it under the tray and tie it to the other front leg. Do the same with the hind legs.'},
 tray:{n:'Dissecting tray',d:'A metal or plastic pan lined with wax or rubber.',u:'Holds the specimen and catches fluid. Pins push into the wax.',h:'Keep it flat on the table, and carry it level with two hands.'}
};
const TOOL_ORDER=['scalpel','dsc','osc','forceps','probe','needle','pins','string','tray'];
const CUTTERS=['scalpel','dsc','osc','forceps','probe','needle'];
const TOOL_NO={
 scalpel:'A scalpel cuts everything under it, including the organs. Use it only for a tiny starting nick in the skin. Open the body with the dissecting scissors, blunt blade inside, tips lifted up.',
 osc:'Operating scissors are not in your tray: you only need to recognize them. Use the dissecting scissors from your kit.',
 forceps:'Forceps grab and lift; they do not cut. A partner holds the skin up with forceps while the cutter uses the dissecting scissors.',
 probe:'A blunt probe separates tissue without cutting it. You need the dissecting scissors to cut through skin and muscle.',
 needle:'A dissecting needle teases apart tiny structures. It cannot make a long, clean incision.'};
/* ---------- the pig procedure ---------- */
const STEPS=[
 {v:'ext',l:'1. External structures',t:'External structures'},
 {v:'sex',l:'2. Is it male or female?',t:'Determine the sex'},
 {v:'tie',l:'3. Tie the pig down',t:'Tie the pig down'},
 {v:'cut',l:'4. Make the incisions',t:'Make the incisions'},
 {v:'pin',l:'5. Open and pin the flaps',t:'Open and pin the flaps'},
 {v:'five',l:'6. The first organs you see',t:'The first five organs'},
 {v:'liver',l:'7. Lift the liver',t:'Lift the liver'},
 {v:'intest',l:'8. Move the intestines',t:'Move the intestines and bladder'},
 {v:'thorax',l:'9. Open the chest',t:'Open the thoracic cavity'},
 {v:'heart',l:'10. Open the pericardium',t:'Open the pericardium: the heart'},
 {v:'brain',l:'11. The brain',t:'The brain',lvl:'honors'},
 {v:'circ',l:'12. Fetal circulation',t:'Fetal circulation',lvl:'ap'}];
const STEP_IX={};STEPS.forEach((s,i)=>STEP_IX[s.v]=i);
/* cuts in order; 'at' is the step where the cut is made */
const CUTS=[
 {id:'throat',at:'cut',n:'Cut 1',l:'Midline, from the throat back to the umbilical cord',ok:'Cut 1 done: a midline cut from the throat to just in front of the umbilical cord.'},
 {id:'umbil',at:'cut',n:'Cut 2',l:'Around both sides of the umbilical cord, then back toward each hind leg',ok:'Cut 2 done: around the cord and back toward the hind legs. This leaves the cord on its own flap.'},
 {id:'fore',at:'cut',n:'Cut 3',l:'Across the chest, just behind the front legs, out to each side',ok:'Cut 3 done: across the chest behind the front legs.'},
 {id:'hind',at:'cut',n:'Cut 4',l:'Out to each side, just in front of the hind legs',ok:'Cut 4 done: out to the sides in front of the hind legs.'},
 {id:'ribs',at:'cut',n:'Cut 5',l:'Along the bottom edge of the rib cage, out to each side',ok:'Cut 5 done: along the base of the ribs. The belly wall can now open into flaps.'},
 {id:'uvein',at:'pin',n:'Cut 6',l:'Across the umbilical vein, between the cord and the liver',ok:'Umbilical vein cut. The umbilical flap folds back toward the tail, and you pin it down.'},
 {id:'chest',at:'thorax',n:'Cut 7',l:'Through the middle of the rib cage, from the diaphragm to the neck',ok:'The chest is open: the rib cage cut along the sternum and pinned back.'},
 {id:'peri',at:'heart',n:'Cut 8',l:'Open the pericardium, the thin sac around the heart',tools:['forceps','dsc'],ok:'The pericardium is open: now you can see the heart itself.'}];
const WRONG_PATHS={thrucord:{l:'Straight through the middle of the umbilical cord',msg:'Cut around the cord, not through it. The umbilical vein and arteries inside the cord are structures you need to find.'},
  tailup:{l:'Midline, from the tail end up to the throat',msg:'Start at the throat and cut toward the tail (anterior to posterior), lifting the skin with the scissor tips so you do not cut the organs underneath.'}};
const START={ext:0,sex:0,tie:0,cut:0,pin:5,five:6,liver:6,intest:6,thorax:6,heart:7,brain:8,circ:8};
const NEEDS={cut:5,pin:6,thorax:7,heart:8};
const HSTEPS=[{v:'hext',l:'1. External structures'},{v:'hcut',l:'2. Cut and pin'},{v:'hint',l:'3. Internal organs'},{v:'hcomp',l:'4. Compare with the pig'}];
const HPATHS={hdors:{l:'Along the back, just to one side of the midline, from the tip of the abdomen to the head',ok:true},
  hmid:{l:'Exactly along the dorsal midline',msg:'The tube-shaped heart runs right along the dorsal midline. Cut just to one side of it so you do not destroy it.'},
  hacross:{l:'Straight across the abdomen',msg:'A cross-cut chops the gut tube in two. Cut lengthwise, from the tip of the abdomen to the head.'}};

/* ---------- spelling-tolerant matching ---------- */
const norm=s=>String(s||'').toLowerCase().replace(/&/g,' and ').replace(/[’'`]/g,'').replace(/[^a-z ]+/g,' ').replace(/^\s*(the|a|an)\s+/,'').replace(/\s+/g,' ').trim();
const deplural=s=>s.split(' ').map(w=>w.length>4&&/s$/.test(w)&&!/ss$/.test(w)?w.replace(/(es|s)$/,''):w).join(' ');
function lev(a,b){if(a===b)return 0;const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let prev=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){const cur=[i];for(let j=1;j<=n;j++)cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=cur;}return prev[n];}
const tol=n=>n<=4?0:n<=9?1:2;
function dist(ans,syns){const a=deplural(norm(ans));let best=99;syns.forEach(s=>{const b=deplural(norm(s));best=Math.min(best,lev(a,b));});return best;}
/* returns {ok, other} — other = the structure the answer matches better, if any */
function judge(ans,id){const a=norm(ans);if(!a)return {ok:false,blank:true};const S=P[id];const d=dist(a,S.syn),t=tol(deplural(a).length);
  let other=null,od=99;Object.keys(P).forEach(k=>{if(k===id||(P[k].grp&&P[k].grp===S.grp))return;const dk=dist(a,P[k].syn);if(dk<od){od=dk;other=k;}});
  if(d<=t&&!(od<d))return {ok:true};return {ok:false,other:od<=tol(deplural(a).length)?other:null};}

/* ================= pig geometry (ventral view: head left, tail right, pig's left side at the top) ================= */
const NIP=[290,335,380,425,520,560];
const LIVER_OUT=[[360,150],[378,136],[406,138],[426,156],[436,186],[440,214],[437,238],[443,266],[436,296],[416,318],[388,323],[366,312],[357,282],[354,225],[356,180]];
const LIVER_FIS=[[[436,186],[402,184]],[[440,226],[396,226]],[[443,266],[404,270]]];
const flipX=pts=>pts.map(p=>[712-p[0],p[1]]);
const STOM=[[378,186],[384,152],[415,133],[458,132],[488,148],[494,176],[482,198],[458,206],[440,196],[415,186],[392,192]];
const PANC=[[462,204],[482,196],[506,197],[520,204],[514,216],[488,219],[466,215]];
const SPL=[[432,124],[462,122],[494,131]];
const SIB=[[445,222],[490,212],[540,214],[574,232],[576,290],[556,322],[500,328],[452,316],[440,270]];
const CAV=[[352,124],[420,117],[500,117],[578,130],[584,225],[578,320],[500,333],[420,333],[352,326],[345,225]];
const FLAPT=[[352,124],[578,130],[566,66],[372,62]];
const CHEST=[[262,142],[300,133],[352,124],[345,225],[352,326],[300,317],[262,308],[257,225]];
const NECK=[[176,200],[262,176],[262,274],[176,250]];
const RIBT=[[262,142],[352,124],[348,72],[270,84]];
const LUNGT=[[268,198],[272,162],[300,146],[338,145],[350,170],[346,200],[330,207],[300,207]];
const LUNGB=mir(LUNGT);
const DIA=[[360,128],[352,178],[349,225],[352,272],[360,322]];
const KID=[[520,173,18,11],[520,277,18,11]];
/* intestines-moved view: urinary and reproductive paths */
const IX={ureT:[[522,184],[548,204],[568,222],[585,236]],ureB:[[522,266],[548,250],[568,242],[585,236]],rect:[[545,140],[560,186],[598,204],[640,207],[684,218]],
  odT:[[544,184],[548,177],[558,175],[567,180],[568,188],[563,194]],hornT:[[563,194],[574,204],[584,214],[594,222]],hornB:[[563,256],[574,246],[584,234],[594,224]],
  ubody:[[592,222],[614,222]],vag:[[612,222],[658,224]],fure:[[585,236],[620,239],[652,237],[662,230]],
  tes:[[665,194],[668,256]],epT:[[651,184],[665,179],[679,184]],epB:[[654,265],[668,270],[682,265]],cordT:[[652,190],[628,183],[604,183]],cordB:[[655,260],[650,272],[646,280]],
  vasT:[[604,183],[584,190],[574,204],[584,222],[598,234]],vasB:[[646,280],[622,272],[606,258],[600,246],[602,237]],mure:[[585,236],[660,236],[664,240]]};
IX.odB=mir(IX.odT);
const CUTP={throat:[[[190,225],[453,225]]],umbil:[[[453,225],[455,211],[468,207],[520,200],[578,168]],mir([[453,225],[455,211],[468,207],[520,200],[578,168]])],
  fore:[[[262,225],[262,142]],[[262,225],[262,308]]],hind:[[[578,168],[580,132]],[[578,282],[580,318]]],ribs:[[[352,225],[346,178],[352,124]],mir([[352,225],[346,178],[352,124]])],
  uvein:[[[444,215],[452,235]]],chest:[[[352,225],[258,225]]],peri:[[[305,206],[283,222],[290,248],[318,256]]],
  thrucord:[[[455,225],[485,225]]],tailup:[[[690,225],[460,225]]]};
/* the umbilical flap: local coords (0 = hinge at the pelvis, 105 = umbilical cord) */
function flapF(view){const A=0.85,ca=Math.cos(A),sa=Math.sin(A);
  if(view==='open0')return (lx,ly)=>[575-lx,225+ly];
  if(view==='intest'){const B=1.35,cb=Math.cos(B),sb=Math.sin(B);return (lx,ly)=>{const dx=0.75*lx;return [585+dx*cb-ly*sb,236+dx*sb+ly*cb];};}
  return (lx,ly)=>[575+0.9*lx,225+ly];}
const FL_OUT=[[0,-14],[50,-26],[96,-22],[114,0],[96,22],[50,26],[0,14]];
const FL_OUT2=[[0,-12],[50,-28],[96,-24],[114,0],[96,24],[50,28],[0,12]];
const FL_ART=[[100,-7],[78,-13],[40,-15],[8,-14],[-4,-18]];
function flapItems(view,sex){const F=flapF(view),pull=view==='intest'?12:0,tr=a=>a.map(p=>F(p[0],p[1]));
  const art1=tr(FL_ART.map(p=>[p[0],p[1]+pull])),art2=tr(FL_ART.map(p=>[p[0],-p[1]+pull]));
  const o={outline:tr(view==='intest'?FL_OUT2:FL_OUT),cord:F(105,0),bl:tr([[8,pull],[24,pull-8],[56,pull-9],[72,pull],[56,pull+9],[24,pull+8]]),blc:F(40,pull),neck:F(4,pull),art1,art2};
  if(view==='intest'&&sex==='m')o.penis=[[664,240],[650,262]].concat(tr([[72,-17]]));
  o.pins=view==='intest'?tr([[112,-18],[112,18]]):view==='open0'?[]:[[684,212],[684,238]];
  return o;}
function intestOffset(view){return view==='intest'?85:view==='liver'?14:0;}
function colonC(view){return view==='intest'?[545,138,20]:[528,172,25];}
const shift=(pts,dy)=>pts.map(p=>[p[0],p[1]+dy]);

/* hit shapes for a view, top-most first */
function pigShapes(view,sex){const L=[],add=(id,q)=>{if(lvOK(P[id].lvl)&&(!P[id].sex||P[id].sex===sex))L.push({id,q});};
  const liverQ=(flip)=>[{b:flip?flipX(LIVER_OUT):LIVER_OUT,a:flip?[322,200]:[392,200]}],cc=colonC(view),dy=intestOffset(view);
  if(view==='ext'){if(sex==='f'){add('genpap',[{e:[653,225,9,7]}]);add('ugopen',[{e:[668,225,7,8]}]);add('anus',[{e:[689,225,7,7]}]);}
      else{add('ugopen',[{e:[503,225,8,7]}]);add('scrotum',[{e:[642,206,17,15]},{e:[642,244,17,15]}]);add('anus',[{e:[690,225,7,7]}]);}
      add('umbcord',[{e:[468,225,17,17]}]);add('nipples',NIP.map(x=>({e:[x,170,8,8]})).concat(NIP.map(x=>({e:[x,280,8,8]}))));return L;}
  if(view==='heart')return heartShapes();if(view==='brain')return brainShapes();if(view==='circ')return circShapes();
  if(view==='thorax'){add('larynx',[{e:[182,225,15,12]}]);add('thyroid',[{e:[240,227,9,7]}]);add('esophagus',[{p:[[186,209],[266,209]],w:5}]);add('trachea',[{p:[[194,225],[268,225]],w:8}]);
    add('heart',[{e:[305,232,28,23]}]);add('diaphragm',[{p:DIA,w:6}]);add('lungs',[{b:LUNGT},{b:LUNGB}]);}
  const f=flapItems(view,sex);
  if(view==='intest'){if(f.penis)add('penis',[{p:f.penis,w:5,a:f.penis[4]}]);}
  add('umbcord',[{e:[f.cord[0],f.cord[1],14,14]}]);add('bladder',[{b:f.bl,a:f.blc}]);add('umbart',[{p:f.art1,w:5},{p:f.art2,w:5}]);
  if(view==='open0')add('umbvein',[{p:[[456,225],[437,225]],w:6}]);else if(view!=='liver')add('umbvein',[{p:[[437,225],[452,225]],w:6}]);
  if(view==='intest'){
    if(sex==='m'){add('epid',[{p:IX.epT,w:4},{p:IX.epB,w:4}]);add('testes',IX.tes.map(t=>({e:[t[0],t[1],15,10]})));
      add('vasdef',[{p:IX.vasT,w:4,a:[576,200]},{p:IX.vasB,w:4}]);add('spcord',[{p:IX.cordT,w:5},{p:IX.cordB,w:5}]);add('urethra',[{p:IX.mure,w:5,a:[630,236]}]);}
    else{add('oviduct',[{p:IX.odT,w:4,a:[548,177]},{p:IX.odB,w:4,a:[548,273]}]);add('ovaries',[{e:[556,186,8,5]},{e:[556,264,8,5]}]);
      add('uterus',[{p:IX.hornT,w:6,a:[570,211]},{p:IX.hornB,w:6},{p:IX.ubody,w:7}]);add('vagina',[{p:IX.vag,w:5,a:[640,223]}]);add('urethra',[{p:IX.fure,w:4,a:[630,239]}]);}
    add('ureter',[{p:IX.ureT,w:4,a:[548,204]},{p:IX.ureB,w:4}]);
    add('kidney',KID.map(k=>({e:k})));add('rectum',[{p:IX.rect.slice(1),w:6,a:[640,207]}]);add('pancreas',[{b:PANC}]);}
  if(view==='liver'){add('gall',[{e:[322,270,13,9]}]);add('liver',liverQ(true));add('pancreas',[{b:PANC}]);add('smint',[{p:[[458,206],[466,222],[474,240]],w:6}]);}
  else add('liver',liverQ(false));
  add('spleen',[{p:SPL,w:7}]);add('stomach',[{b:STOM,a:view==='liver'?[440,165]:[468,170]}]);
  add('lgint',[{e:[cc[0],cc[1],cc[2],cc[2]]}]);add('smint',[{b:shift(SIB,dy),a:[510,270+dy]}]);
  return L;}

/* ---------- drawing the pig ---------- */
function legPoly(b,h,w0,w1){const dx=h[0]-b[0],dy=h[1]-b[1],L=Math.hypot(dx,dy),nx=-dy/L,ny=dx/L;
  return [[b[0]+nx*w0,b[1]+ny*w0],[h[0]+nx*w1,h[1]+ny*w1],[h[0]-nx*w1,h[1]-ny*w1],[b[0]-nx*w0,b[1]-ny*w0]];}
const LEGS=[[[255,160],[212,58]],[[255,290],[212,392]],[[580,158],[646,56]],[[580,292],[646,394]]];
function drawTray(ctx){ctx.fillStyle=C.trayRim;rr(ctx,8,6,784,438,18);ctx.fill();ctx.fillStyle=C.tray;rr(ctx,18,15,764,420,12);ctx.fill();}
function bodyParts(ctx,col,lw){const st=!!lw;ctx.save();if(st){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.lineJoin='round';}else ctx.fillStyle=col;
  const go=()=>{if(st)ctx.stroke();else ctx.fill();};
  LEGS.forEach(([b,h])=>{ctx.beginPath();smooth(ctx,legPoly(b,h,22,13),true);go();});
  ctx.beginPath();ctx.moveTo(150,168);ctx.quadraticCurveTo(200,150,262,140);ctx.lineTo(262,310);ctx.quadraticCurveTo(200,300,150,282);ctx.closePath();go();
  ctx.beginPath();ctx.ellipse(430,225,265,115,0,0,6.2832);go();ctx.beginPath();ctx.ellipse(124,225,82,64,0,0,6.2832);go();ctx.restore();}
function drawBody(ctx,strings){
  tube(ctx,[[675,225],[722,213],[748,227],[770,214]],11,C.skinEdge);tube(ctx,[[675,225],[722,213],[748,227],[770,214]],9,C.skin);
  bodyParts(ctx,C.skinEdge,3);bodyParts(ctx,C.skin);
  LEGS.forEach(([b,h])=>{const a=Math.atan2(h[1]-b[1],h[0]-b[0]);ell(ctx,h[0],h[1],15,11,C.hoof,null,0,a+Math.PI/2);
    line(ctx,[[h[0]-Math.cos(a)*1,h[1]-Math.sin(a)*1],[h[0]+Math.cos(a)*10,h[1]+Math.sin(a)*10]],'#3e322c',1.5);});
  ell(ctx,46,225,13,25,'#d4b1a1',C.skinEdge,1.2);ell(ctx,44,214,3,4,'#7d5f52');ell(ctx,44,236,3,4,'#7d5f52');
  line(ctx,[[88,178],[100,200],[104,225],[100,250],[88,272]],'rgba(120,90,75,.45)',1.4);
  if(strings){ctx.save();LEGS.forEach(([b,h])=>{line(ctx,[[h[0],h[1]+(h[1]<225?-6:6)],[h[0]+(h[0]<400?-6:8),h[1]<225?15:435]],C.str,2.2);ell(ctx,h[0],h[1],16,4,null,C.str,2.2,Math.atan2(h[1]-b[1],h[0]-b[0])+Math.PI/2);});ctx.restore();}}
function drawExternal(ctx,sex,hon){ctx.save();
  NIP.forEach(x=>{ell(ctx,x,170,4,4,'#c9a596',C.skinEdge,1);ell(ctx,x,280,4,4,'#c9a596',C.skinEdge,1);});
  ell(ctx,468,225,15,15,'#d9b6a3',C.skinEdge,1.6);ell(ctx,468,225,10,10,'#cda08e');ell(ctx,463,222,3.4,3.4,'#7b8fb8');ell(ctx,472,219,2.2,2.2,'#b8706a');ell(ctx,472,231,2.2,2.2,'#b8706a');
  if(sex==='f'){blob(ctx,[[645,225],[656,219],[668,221],[668,229],[656,231]],'#d0a593',C.skinEdge,1);ell(ctx,668,225,3,5,'#6e4e44');}
  else{ell(ctx,503,225,3,4.5,'#6e4e44');ell(ctx,642,206,15,13,'#d8bba9',C.skinEdge,1.2);ell(ctx,642,244,15,13,'#d8bba9',C.skinEdge,1.2);}
  ell(ctx,689,225,4.5,4.5,'#6e4e44');ctx.restore();}
function drawCutLines(ctx,n,strokeCol){for(let i=0;i<Math.min(n,5);i++){const id=CUTS[i].id;CUTP[id].forEach(pts=>{line(ctx,pts,'#f6efe9',4);line(ctx,pts,'#6a3f36',1.8);});}}
function drawPreview(ctx,id,col){if(!CUTP[id])return;CUTP[id].forEach(pts=>line(ctx,pts,col,3,[7,5]));}
function drawIntestine(ctx,dy){blob(ctx,shift(SIB,dy),C.smint,C.smintE,1.2);ctx.save();ctx.beginPath();smooth(ctx,shift(SIB,dy),true);ctx.clip();
  for(let r=0;r<5;r++){const y0=228+r*22+dy,pts=[];for(let x=440;x<=580;x+=10)pts.push([x,y0+Math.sin(x/13+r*1.7)*8]);tube(ctx,pts,11,C.smintE);tube(ctx,pts,8.5,C.smint);}
  ctx.restore();}
function drawColon(ctx,c){ell(ctx,c[0],c[1],c[2],c[2],C.colon,C.colonE,1.4);ctx.beginPath();for(let a=0;a<6*Math.PI;a+=0.2){const r=c[2]*(1-a/(6.6*Math.PI));const x=c[0]+Math.cos(a)*r,y=c[1]+Math.sin(a)*r;a?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.strokeStyle=C.colonE;ctx.lineWidth=1.6;ctx.stroke();}
function drawLiver(ctx,flip){const o=flip?flipX(LIVER_OUT):LIVER_OUT;blob(ctx,o,flip?C.liverU:C.liver,C.liverLine,1.6);
  LIVER_FIS.forEach(l=>line(ctx,flip?flipX(l):l,C.liverLine,2));ell(ctx,flip?314:398,170,10,5,'rgba(255,255,255,.08)');}
function drawFlap(ctx,view,sex){const f=flapItems(view,sex);blob(ctx,f.outline,C.skinIn,C.skinEdge,1.3);
  if(f.penis)edgeTube(ctx,f.penis,6,'#efe3d3','#a99478');
  blob(ctx,f.bl,C.bladder,C.bladE,1.3);[f.art1,f.art2].forEach(a=>edgeTube(ctx,a,4.5,C.art));
  ell(ctx,f.cord[0],f.cord[1],13,13,'#d9b6a3',C.skinEdge,1.4);ell(ctx,f.cord[0],f.cord[1],8,8,'#cda08e');
  return f;}
function drawPins(ctx,pts){pts.forEach(p=>{line(ctx,[[p[0],p[1]],[p[0]+5,p[1]+9]],C.pin,2);ell(ctx,p[0],p[1],3.6,3.6,C.pinHead,'#7a2020',1);});}
function drawAbdomen(ctx,view,sex){const dy=intestOffset(view),cc=colonC(view);
  blob(ctx,CAV,C.cavity,C.cavityEdge,1.4);
  [FLAPT,mir(FLAPT)].forEach(f=>{ctx.beginPath();ctx.moveTo(f[0][0],f[0][1]);f.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=C.skinIn;ctx.fill();ctx.strokeStyle=C.skinEdge;ctx.lineWidth=1.2;ctx.stroke();});
  if(view==='intest'){
    KID.forEach(k=>{ell(ctx,k[0],k[1],k[2],k[3],C.kid,C.kidE,1.4);ell(ctx,k[0]+4,k[1]+(k[1]<225?7:-7),6,3,'#b98a7a');});
    tube(ctx,IX.rect,10,C.colonE);tube(ctx,IX.rect,8,C.rect);
    const f=flapItems(view,sex);
    if(sex==='m'){[IX.vasT,IX.vasB].forEach(v=>edgeTube(ctx,v,3,'#f4ecdc','#a99478'));}
    else{[IX.hornT,IX.hornB].forEach(h=>edgeTube(ctx,h,7,C.repro,C.reproE));edgeTube(ctx,IX.vag,9,'#e0b8aa',C.reproE);edgeTube(ctx,IX.ubody,13,C.repro,C.reproE);
      edgeTube(ctx,IX.fure,4.5,'#f0d9c6','#a88a74');[IX.odT,IX.odB].forEach(o=>edgeTube(ctx,o,2.6,'#ecc9b8','#9f6e62'));
      ell(ctx,556,186,8,5,'#efd9c8',C.reproE,1.2);ell(ctx,556,264,8,5,'#efd9c8',C.reproE,1.2);}
    [IX.ureT,IX.ureB].forEach(u=>edgeTube(ctx,u,3.2,'#f2e6c8','#a89a72'));
    if(sex==='m'){edgeTube(ctx,IX.mure,5,'#f0d9c6','#a88a74');IX.tes.forEach(c=>ell(ctx,c[0],c[1],15,10,C.testis,C.testE,1.3));
      [IX.epT,IX.epB].forEach(e=>edgeTube(ctx,e,4,'#d9b79e','#9c7a62'));[IX.cordT,IX.cordB].forEach(c=>edgeTube(ctx,c,5,'#e8d8c4','#a99478'));
      ell(ctx,604,183,4,4,null,C.cavityEdge,1.4);ell(ctx,646,280,4,4,null,C.cavityEdge,1.4);}}
  if(view==='liver'||view==='intest'){blob(ctx,PANC,C.panc,C.pancE,1.2);for(let i=0;i<9;i++)ell(ctx,470+i*5.5,205+(i%2)*6,1.6,1.6,C.pancE);}
  blob(ctx,STOM,C.stom,C.stomE,1.4);line(ctx,[[392,192],[420,180],[455,190]],'rgba(120,100,80,.35)',1);
  if(view==='liver')edgeTube(ctx,[[458,206],[466,222],[474,240]],9,C.smint,C.smintE);
  tube(ctx,SPL,12,'#4e2a33');tube(ctx,SPL,10,C.spleen);
  drawColon(ctx,cc);drawIntestine(ctx,dy);
  if(view==='liver'){drawLiver(ctx,true);ell(ctx,322,270,13,9,C.gall,'#4a5f33',1.3);line(ctx,[[318,262],[330,266]],'rgba(255,255,255,.35)',1.5);}
  else drawLiver(ctx,false);
  if(view==='open0'){edgeTube(ctx,[[458,225],[437,225]],5,C.vein);drawFlap(ctx,view,sex);}
  else{if(view!=='liver')edgeTube(ctx,[[437,225],[450,225]],5,C.vein);drawFlap(ctx,view,sex);}
  drawPins(ctx,[[384,72],[554,74],[384,378],[554,376]].concat(flapItems(view,sex).pins));}
function drawThoraxOpen(ctx,open){if(!open)return;
  blob(ctx,NECK,C.cavity,C.cavityEdge,1.2);blob(ctx,CHEST,C.cavity,C.cavityEdge,1.2);
  [RIBT,mir(RIBT)].forEach(r=>{ctx.beginPath();ctx.moveTo(r[0][0],r[0][1]);r.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=C.skinIn;ctx.fill();ctx.strokeStyle=C.skinEdge;ctx.stroke();
    for(let i=0;i<5;i++){const t=(i+.5)/5;const a=[r[0][0]+(r[1][0]-r[0][0])*t,r[0][1]+(r[1][1]-r[0][1])*t],b=[r[3][0]+(r[2][0]-r[3][0])*t,r[3][1]+(r[2][1]-r[3][1])*t];line(ctx,[a,b],C.bone,4);}});
  blob(ctx,LUNGT,C.lung,C.lungE,1.3);blob(ctx,LUNGB,C.lung,C.lungE,1.3);line(ctx,[[300,148],[312,190]],C.lungE,1);line(ctx,[[300,302],[312,260]],C.lungE,1);
  edgeTube(ctx,[[186,209],[266,209]],6,C.eso,'#9c7466');
  edgeTube(ctx,[[194,225],[270,225]],12,C.trach,C.trachE);for(let x=198;x<268;x+=7)line(ctx,[[x,220],[x,230]],C.trachE,1);
  ell(ctx,182,225,15,12,C.lar,C.trachE,1.4);line(ctx,[[176,217],[176,233]],C.trachE,1.2);
  ell(ctx,240,227,9,7,C.thy,'#5a2c2c',1.2);
  tube(ctx,DIA,9,'#8f5a50');tube(ctx,DIA,7,C.dia);}
function drawHeartSmall(ctx,peri){blob(ctx,[[280,228],[288,212],[308,207],[326,208],[336,214],[330,236],[316,252],[298,256],[284,246]],C.heart,C.heartE,1.4);
  line(ctx,[[300,210],[318,240]],'rgba(60,20,20,.4)',1.2);
  if(peri){ell(ctx,307,232,34,29,'rgba(240,235,225,.38)','rgba(255,255,255,.55)',1.2);}}
/* the view the pig is in right now */
function pigView(step,cuts){if(step==='ext'||step==='sex'||step==='tie'||step==='cut')return 'ext';
  if(step==='pin')return cuts>=6?'five':'open0';if(step==='thorax')return cuts>=7?'thorax':'five';if(step==='heart')return cuts>=8?'heart':'thorax';return step;}
function drawPigScene(ctx,view,sex,o){o=o||{};
  if(view==='heart'){drawHeartZoom(ctx,!!o.peri);return;}if(view==='brain'){drawBrain(ctx);return;}if(view==='circ'){drawCirc(ctx,o.t||0,o.k||1,o.sel);return;}
  drawTray(ctx);drawBody(ctx,o.strings!==false);
  if(view==='ext'){drawExternal(ctx,sex);drawCutLines(ctx,o.cuts||0);return;}
  drawCutLines(ctx,1);line(ctx,[[262,142],[262,308]],'#6a3f36',1.4);
  drawAbdomen(ctx,view,sex);
  const thOpen=view==='thorax';
  if(thOpen){drawThoraxOpen(ctx,true);drawHeartSmall(ctx,o.peri!==false);drawPins(ctx,[[276,90],[340,80],[276,360],[340,370]]);}
}

/* ================= close-up of the heart (ventral view, head left, pig's left at the top) ================= */
const HZ={
 HV:[[392,158],[450,140],[515,142],[560,158],[582,178],[572,215],[540,262],[495,305],[440,330],[395,322],[372,290],[370,230],[378,185]],
 LVR:[[392,158],[450,140],[515,142],[560,158],[582,178],[572,212],[550,232],[510,205],[465,183],[425,170]],
 RAU:[[372,262],[345,252],[322,262],[315,290],[335,318],[370,324],[386,302]],
 LAU:[[400,160],[394,136],[372,122],[348,127],[342,148],[364,164]],
 ASC:[[398,222],[340,218],[292,206]],ARCH:[[292,206],[264,180],[262,142],[285,111],[330,93],[400,86]],DESC:[[400,86],[560,80],[760,82]],
 BRA:[[266,152],[200,150],[120,160]],LSUB:[[278,121],[210,106],[130,98]],
 PULM:[[442,206],[402,194],[362,186],[326,180]],LPA:[[326,180],[313,150],[322,124]],RPA:[[326,180],[306,212],[300,252]],DA:[[326,180],[296,170],[268,164]],
 CRVC:[[60,292],[180,288],[262,283],[322,286]],CAVC:[[362,322],[420,350],[560,358],[742,352]],TR:[[0,236],[150,236],[240,238]],
 LUT:[[215,40],[420,25],[700,30],[718,110],[640,140],[575,152],[520,125],[440,112],[410,80],[300,62]],
 LUB:[[230,420],[420,438],[700,432],[718,372],[640,342],[575,330],[530,338],[470,352],[400,368],[300,385]],
 DIA:[[748,30],[735,140],[728,240],[735,340],[748,440]]};
HZ.RVR=[[425,170],[465,183],[510,205],[550,232],[540,262],[495,305],[440,330],[395,322],[372,290],[370,230],[378,185]];
function heartShapes(){const L=[],add=(id,q)=>{if(lvOK(P[id].lvl))L.push({id,q});};
  add('ductart',[{p:HZ.DA,w:6}]);add('pulmart',[{p:HZ.PULM,w:10,a:[380,190]},{p:HZ.LPA,w:6}]);add('aarch',[{p:HZ.ARCH,w:12,a:[266,160]}]);add('aorta',[{p:HZ.ASC,w:10,a:[345,218]},{p:HZ.DESC,w:7}]);
  add('cranvc',[{p:HZ.CRVC,w:12,a:[180,288]}]);add('caudvc',[{p:HZ.CAVC,w:11,a:[600,357]}]);add('la',[{b:HZ.LAU}]);add('ra',[{b:HZ.RAU}]);add('lv',[{b:HZ.LVR,a:[535,175]}]);add('rv',[{b:HZ.RVR,a:[465,260]}]);
  add('heart',[{b:HZ.HV,a:[480,240]},{b:HZ.RAU},{b:HZ.LAU}]);add('trachea',[{p:HZ.TR,w:11,a:[110,236]}]);add('diaphragm',[{p:HZ.DIA,w:9,a:[730,240]}]);add('lungs',[{b:HZ.LUT,a:[600,70]},{b:HZ.LUB,a:[600,400]}]);return L;}
function drawHeartZoom(ctx,peri){ctx.fillStyle=C.cavity;ctx.fillRect(0,0,800,450);ctx.save();
  blob(ctx,HZ.LUT,C.lung,C.lungE,1.6);blob(ctx,HZ.LUB,C.lung,C.lungE,1.6);
  [[320,70,470,108],[560,60,600,130],[320,410,470,380],[560,420,620,345]].forEach(l=>line(ctx,[[l[0],l[1]],[l[2],l[3]]],C.lungE,1.2));
  tube(ctx,HZ.DIA,16,'#8f5a50');tube(ctx,HZ.DIA,13,C.dia);
  edgeTube(ctx,HZ.TR,20,C.trach,C.trachE);for(let x=10;x<240;x+=12)line(ctx,[[x,228],[x,244]],C.trachE,1.2);
  tube(ctx,HZ.DESC,13,C.art,[9,7]);
  edgeTube(ctx,HZ.BRA,9,C.art);edgeTube(ctx,HZ.LSUB,8,C.art);
  edgeTube(ctx,HZ.CAVC,22,C.vein);edgeTube(ctx,HZ.CRVC,24,C.vein);
  edgeTube(ctx,HZ.ASC,22,C.art);edgeTube(ctx,HZ.ARCH,22,C.art);
  blob(ctx,HZ.HV,C.heart,C.heartE,1.8);blob(ctx,HZ.LVR,'#a8655b',null);blob(ctx,HZ.HV,null,C.heartE,1.8);
  tube(ctx,[[425,170],[465,183],[510,205],[550,232]],5,'#e8d5b8');
  blob(ctx,HZ.RAU,'#8c4f50',C.heartE,1.6);blob(ctx,HZ.LAU,'#8c4f50',C.heartE,1.6);
  edgeTube(ctx,HZ.RPA,12,'#b0485a');edgeTube(ctx,HZ.PULM,20,'#b0485a');edgeTube(ctx,HZ.LPA,12,'#b0485a');
  if(atLeast('ap'))edgeTube(ctx,HZ.DA,9,'#8a5fa0');
  if(peri){blob(ctx,[[300,200],[350,130],[450,118],[560,130],[610,175],[590,240],[545,300],[470,350],[380,345],[300,320],[285,260]],'rgba(244,238,226,.72)','rgba(255,255,255,.9)',2);}
  else{ctx.setLineDash([5,4]);blob(ctx,[[300,200],[350,130],[450,118],[560,130],[610,175],[590,240],[545,300],[470,350],[380,345],[300,320],[285,260]],null,'rgba(250,245,235,.8)',2);ctx.setLineDash([]);}
  ctx.restore();}

/* ================= the brain (dorsal view of the head, top of the skull removed) ================= */
const BR={CER:[[318,221],[322,160],[362,124],[440,112],[506,128],[534,170],[532,221]],CBL:[[538,172],[578,164],[612,186],[616,264],[578,286],[538,278],[530,225]],
  MED:[[614,205],[660,208],[690,214],[690,236],[660,242],[614,245]]};
function brainShapes(){const L=[],add=(id,q)=>{if(lvOK(P[id].lvl))L.push({id,q});};
  add('olfact',[{e:[304,205,15,10]},{e:[304,245,15,10]}]);add('cerebellum',[{b:BR.CBL}]);add('medulla',[{b:BR.MED}]);add('spinal',[{p:[[692,225],[790,225]],w:9,a:[740,225]}]);
  add('cerebrum',[{b:BR.CER,a:[430,165]},{b:mir(BR.CER),a:[430,285]}]);return L;}
function drawBrain(ctx){drawTray(ctx);ctx.save();
  const head=[[40,225],[60,192],[150,150],[280,104],[420,84],[560,90],[690,120],[770,160],[790,225]];const hp=head.concat(mir(head).reverse().slice(1));
  blob(ctx,hp,C.skin,C.skinEdge,1.4);ell(ctx,46,225,14,28,'#d4b1a1',C.skinEdge,1.2);
  [[250,128],[250,322]].forEach(e=>{ell(ctx,e[0],e[1],18,7,'#cfae9e',C.skinEdge,1.2);line(ctx,[[234,e[1]],[266,e[1]]],'#7d5f52',1.4);});
  ell(ctx,470,225,192,134,C.bone,C.boneE,2);ell(ctx,470,225,180,124,'#bf9b8c');
  ctx.fillStyle='#bf9b8c';ctx.fillRect(640,206,152,38);line(ctx,[[640,206],[792,206]],C.boneE,2);line(ctx,[[640,244],[792,244]],C.boneE,2);
  blob(ctx,BR.CER,C.brain,C.brainE,1.6);blob(ctx,mir(BR.CER),C.brain,C.brainE,1.6);
  [[[345,190],[380,170],[420,190],[470,160],[510,185]],[[340,150],[390,140],[440,150],[500,140]],[[350,210],[400,200],[460,212],[515,205]]].forEach(g=>{line(ctx,g,C.brainE,1.2);line(ctx,mir(g),C.brainE,1.2);});
  line(ctx,[[320,225],[532,225]],'#8d6e62',2.2);
  ell(ctx,304,205,15,10,'#eadbd0',C.brainE,1.3);ell(ctx,304,245,15,10,'#eadbd0',C.brainE,1.3);
  blob(ctx,BR.CBL,C.cbl,C.brainE,1.6);for(let i=1;i<6;i++){const x=538+i*13;line(ctx,[[x,172+i*2],[x,278-i*2]],C.brainE,1);}
  blob(ctx,BR.MED,'#e9d9cc',C.brainE,1.4);edgeTube(ctx,[[690,225],[792,225]],18,'#efe3d6','#a8897c');ctx.restore();}

/* ================= fetal circulation schematic (Deep dive) ================= */
const OXC={rich:'#c8423a',mixR:'#a34a78',mixB:'#6a5aa8',poor:'#3f63b0'};
const CB={placenta:[30,330,140,72],liver:[218,298,134,74],ra:[370,250,110,80],rv:[490,250,110,80],la:[370,160,110,80],lv:[490,160,110,80],lungs:[410,40,190,58],bodyt:[712,150,78,190]};
const CV={umbvein:{p:[[170,362],[196,354],[218,352]],c:'rich'},ductven:{p:[[226,352],[344,352]],c:'rich'},caudvc:{p:[[352,352],[364,330],[374,314]],c:'mixR',p2:[[712,322],[680,394],[392,396],[366,370],[356,356]]},
  foramen:{p:[[425,256],[425,236]],c:'mixR'},pulmart:{p:[[600,292],[628,292],[628,150],[600,98]],c:'mixB'},ductart:{p:[[628,152],[636,126]],c:'mixB'},
  aorta:{p:[[545,160],[545,124],[690,124],[724,150]],c:'mixR'},umbart:{p:[[752,340],[752,428],[96,428],[96,402]],c:'poor'},pv:{p:[[450,98],[440,160]],c:'rich'}};
function circShapes(){const L=[],add=(id,q)=>{if(P[id]&&lvOK(P[id].lvl))L.push({id,q});};
  add('foramen',[{e:[425,246,11,9]}]);add('ductart',[{p:CV.ductart.p,w:7}]);
  ['umbvein','ductven','caudvc','pulmart','aorta','umbart'].forEach(id=>{const v=CV[id];add(id,[{p:v.p,w:7}].concat(v.p2?[{p:v.p2,w:6}]:[]));});
  Object.keys(CB).forEach(id=>{const b=CB[id];add(id,[{b:[[b[0],b[1]],[b[0]+b[2],b[1]],[b[0]+b[2],b[1]+b[3]],[b[0],b[1]+b[3]]]}]);});return L;}
const CBN={placenta:['Placenta','Placenta'],liver:['Liver','Liver'],ra:['Right atrium','RA'],rv:['Right ventricle','RV'],la:['Left atrium','LA'],lv:['Left ventricle','LV'],lungs:['Lungs (not used yet)','Lungs'],bodyt:['Body','Body']};
const CBC={placenta:'rich',liver:'rich',ra:'mixR',rv:'mixB',la:'mixR',lv:'mixR',lungs:'mixB',bodyt:'poor'};
function drawCirc(ctx,t,k,sel){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const sm=k>1.25;
  Object.keys(CV).forEach(id=>{const v=CV[id];[v.p,v.p2].forEach(p=>{if(!p)return;line(ctx,p,OXC[v.c],id==='ductart'?7:6);
    const pl=BioLab.h.polyline(p);const n=Math.max(1,Math.round(pl.L/40));ctx.fillStyle='#fff';for(let i=0;i<n;i++){const q=pl.at(((t*30+i*40)%pl.L+pl.L)%pl.L);ctx.beginPath();ctx.arc(q[0],q[1],2.4,0,6.29);ctx.fill();}});});
  line(ctx,[[480,290],[490,290]],OXC.mixB,6);line(ctx,[[480,200],[490,200]],OXC.mixR,6);
  Object.keys(CB).forEach(id=>{const b=CB[id];ctx.fillStyle=OXC[CBC[id]];rr(ctx,b[0],b[1],b[2],b[3],10);ctx.fill();
    const nm=CBN[id][sm?1:0];txt(ctx,nm,b[0]+b[2]/2,b[1]+(id==='liver'?18*k:b[3]/2),{s:13*k,w:700,c:'#fff',a:'center',b:'middle'});});
  edgeTube(ctx,CV.ductven.p,6,OXC.rich,'#fff');
  ell(ctx,425,246,9,7,'#f4e3e9','#7a2a50',1.5);
  const items=[['Oxygen-rich',OXC.rich],['Mixed',OXC.mixR],['Oxygen-poor',OXC.poor]];items.forEach((it,i)=>{const y=26+i*24*k;ctx.fillStyle=it[1];rr(ctx,18,y-7*k,22,14*k,4);ctx.fill();txt(ctx,it[0],48,y,{s:12.5*k,c:PAL['cv-ink'],b:'middle'});});
  if(!sm){[['Umbilical vein',118,312],['Ductus venosus',285,386],['Foramen ovale',318,246],['Ductus arteriosus',560,142],['Aorta',650,108],['Umbilical arteries',420,428],['Pulmonary artery',655,268]].forEach(l=>{if(l[0]==='Ductus arteriosus'&&!atLeast('ap'))return;if(sel&&P[sel]&&P[sel].n===l[0])return;pill(ctx,l[0],l[1],l[2],PAL['card'],PAL['cv-ink'],12*k);});}}

/* ================= grasshopper (side view: head left, back up) ================= */
const G={HEAD:[[118,215],[122,180],[140,158],[170,150],[200,160],[212,190],[210,235],[190,262],[150,268],[126,250]],
 PRO:[[205,165],[230,150],[285,150],[300,165],[300,240],[280,255],[230,255],[208,240]],MESO:[[298,160],[342,158],[346,242],[300,248]],
 ABD:[[340,165],[400,163],[480,166],[560,172],[620,180],[648,190],[655,205],[645,222],[610,232],[540,240],[460,247],[400,250],[345,248]],
 OVI:[[645,198],[690,195],[702,205],[690,215],[645,216]],MTIP:[[640,193],[662,197],[670,210],[656,223],[640,221]],
 WING:[[285,160],[340,148],[460,150],[580,162],[640,178],[630,190],[560,184],[440,176],[330,178],[290,175]],
 FEM:[[338,240],[350,228],[470,182],[500,180],[506,195],[480,210],[360,258]],
 LEG1:[[235,250],[222,300],[230,340],[214,388]],LEG2:[[300,252],[300,300],[325,345],[318,392]],TIB:[[502,194],[470,282],[432,380]],TAR:[[432,380],[466,394]],
 ANT:[[155,160],[136,122],[116,92],[94,70],[72,54]],SP:[[290,230],[520,233],[553,229],[584,225],[612,220]]};
const HCUT={hdors:[[650,188],[480,172],[340,172],[300,163],[215,168]],hmid:[[650,183],[480,166],[340,165],[300,152],[230,153]],hacross:[[470,166],[470,248]]};
const HG={crop:[[238,190],[275,180],[320,184],[338,196],[338,214],[320,226],[275,230],[240,220]],giz:[[336,197],[362,196],[366,216],[338,219]],
 mid:[[372,200],[480,198],[490,214],[480,230],[372,228]],ovar:[[420,180],[560,182],[606,190],[604,198],[560,196],[420,194]],sal:[[252,236],[300,236],[306,250],[256,253]]};
const HEX='#9a9455',HEXD='#6c6a38',HINT='#ece2c6';
function hopperShapes(view,sex){const L=[],add=(id,q)=>{if(lvOK(H[id].lvl)&&(!H[id].sex||H[id].sex===sex))L.push({id,q});};
  if(view==='hint'||view==='hcomp'){add('hbrain',[{e:[172,182,12,9]}]);add('hheart',[{p:[[340,172],[400,170],[480,172],[560,178],[620,188]],w:5,a:[450,171]}]);
    add('malp',[{b:[[488,186],[528,186],[528,244],[488,244]],a:[512,236]}]);add('caeca',[{e:[378,186,14,8]},{e:[378,234,14,8]}]);add('gizzard',[{b:HG.giz}]);add('salivary',[{b:HG.sal}]);
    add('crop',[{b:HG.crop}]);add('midgut',[{b:HG.mid}]);add('hgonad',[{b:HG.ovar,a:[500,188]}]);add('hindgut',[{p:[[490,214],[540,215],[590,213],[628,208],[648,205]],w:7,a:[570,214]}]);
    add('esoph',[{p:[[150,240],[175,222],[205,208],[240,204]],w:5}]);add('ncord',[{p:[[200,258],[300,252],[400,248],[500,242],[600,230]],w:5,a:[420,247]}]);return L;}
  if(view==='hext'){add('antenna',[{p:G.ANT,w:6,a:[100,85]}]);add('eye',[{e:[170,188,17,23]}]);add('mandible',[{e:[140,258,12,9]}]);add('spiracle',G.SP.map(p=>({e:[p[0],p[1],6,6]})));
    add('tympanum',[{e:[356,196,10,13]}]);add('wings',[{b:G.WING,a:[470,165]}]);add('legs',[{b:G.FEM,a:[420,215]},{p:G.TIB,w:6},{p:G.LEG1,w:6},{p:G.LEG2,w:6}]);if(sex==='f')add('ovipositor',[{b:G.OVI}]);}
  add('head',[{b:G.HEAD,a:[160,230]}]);add('thorax',[{b:G.PRO,a:[255,205]},{b:G.MESO}]);add('abdomen',[{b:G.ABD,a:[560,212]}]);return L;}
const HS=1.2,hfwd=p=>[400+(p[0]-400)*HS,210+(p[1]-210)*HS],hinv=(x,y)=>[400+(x-400)/HS,210+(y-210)/HS];
function drawHopper(ctx,view,sex,o){o=o||{};ctx.save();const ext=view==='hext',inside=view==='hint'||view==='hcomp';
  if(ext){edgeTube(ctx,G.LEG1,6,HEX,HEXD);edgeTube(ctx,G.LEG2,6,HEX,HEXD);}
  else{[[235,250],[300,252],[345,244]].forEach(s=>ell(ctx,s[0],s[1]+6,6,5,HEXD));}
  tube(ctx,G.ANT,4,HEXD);tube(ctx,G.ANT,2.4,HEX);
  if(inside){/* body wall flaps cut along the back and pinned out */
    blob(ctx,[[210,166],[300,160],[480,166],[640,184],[640,150],[470,118],[300,116],[214,132]],'#b8b073',HEXD,1.2);}
  blob(ctx,G.HEAD,HEX,HEXD,1.6);blob(ctx,G.PRO,HEX,HEXD,1.6);blob(ctx,G.MESO,HEX,HEXD,1.4);blob(ctx,G.ABD,HEX,HEXD,1.6);
  if(sex==='f')blob(ctx,G.OVI,'#8a8448',HEXD,1.3);else blob(ctx,G.MTIP,HEX,HEXD,1.3);
  ctx.save();ctx.beginPath();smooth(ctx,G.ABD,true);ctx.clip();for(let x=370;x<650;x+=28)line(ctx,[[x,150],[x+4,260]],HEXD,1.2);ctx.restore();
  if(!inside){ell(ctx,170,188,17,23,'#5b4a2c','#3a2e18',1.3);ell(ctx,165,180,5,6,'rgba(255,255,255,.25)');ell(ctx,140,258,12,8,'#5a4a2a',HEXD,1);tube(ctx,[[150,262],[148,282]],3,HEXD);
    G.SP.forEach(p=>ell(ctx,p[0],p[1],3.2,3.2,'#3a3418'));}
  if(ext){if(atLeast('honors'))ell(ctx,356,196,9,12,'#c8c08a',HEXD,1.2);
    blob(ctx,G.WING,'rgba(150,138,80,.92)','#5f5a2e',1.4);line(ctx,[[330,178],[600,186]],'#5f5a2e',1);for(let x=360;x<620;x+=30)line(ctx,[[x,152+(x-360)*.05],[x+20,174+(x-360)*.03]],'rgba(70,60,30,.35)',1);
    blob(ctx,G.FEM,'#a39c5c',HEXD,1.6);for(let i=0;i<9;i++){const x=372+i*13;line(ctx,[[x,248-i*5.2],[x+10,234-i*5.2]],HEXD,1);}
    edgeTube(ctx,G.TIB,5,HEX,HEXD);edgeTube(ctx,G.TAR,4,HEX,HEXD);for(let i=1;i<6;i++){const q=[502-i*12,194+i*31];line(ctx,[q,[q[0]-8,q[1]-4]],HEXD,1.2);}}
  if(inside){const ip=[[214,170],[300,164],[480,170],[640,190],[648,205],[640,222],[540,240],[400,250],[300,250],[214,240]];blob(ctx,ip,HINT,null);
    edgeTube(ctx,[[200,258],[300,252],[400,248],[500,242],[600,230]],3,C.nerve,C.nerveE);[230,290,350,410,470,530,590].forEach(x=>ell(ctx,x,258-(x-200)*0.07,4,3,C.nerve,C.nerveE,1));
    if(atLeast('honors')){ell(ctx,172,182,12,9,C.nerve,C.nerveE,1.2);blob(ctx,HG.sal,'#efe0b4','#b9a56f',1);}
    edgeTube(ctx,[[150,240],[175,222],[205,208],[240,204]],6,'#e6c9a0','#a68b5c');
    blob(ctx,HG.crop,'#e9d3a6','#a68b5c',1.4);blob(ctx,HG.giz,'#b9895a','#7a5530',1.4);for(let i=0;i<3;i++)line(ctx,[[342+i*7,199],[342+i*7,216]],'#7a5530',1);
    [[378,186,-0.35],[392,184,-0.2],[378,234,0.35],[392,236,0.2]].forEach(c=>ell(ctx,c[0],c[1],13,6,'#d7c46a','#9a8a3a',1.1,c[2]));
    blob(ctx,HG.mid,'#e3c88f','#a68b5c',1.4);
    ctx.strokeStyle='#e0b23a';ctx.lineWidth=1.3;for(let i=0;i<12;i++){const a=i/12*6.283;ctx.beginPath();ctx.moveTo(492,214);ctx.quadraticCurveTo(492+Math.cos(a)*30,214+Math.sin(a)*14,500+Math.cos(a+1)*22,214+Math.sin(a+1)*26);ctx.stroke();}
    edgeTube(ctx,[[490,214],[540,215],[590,213]],7,'#e3c88f','#a68b5c');edgeTube(ctx,[[590,213],[628,208],[648,205]],11,'#d9b67a','#a68b5c');
    if(sex==='f'){blob(ctx,HG.ovar,'#f1dc9a','#b39a4e',1.2);for(let x=430;x<600;x+=14)ell(ctx,x,188,6,3,'#e6c56a','#b39a4e',0.8,0.25);edgeTube(ctx,[[604,194],[640,200]],3,'#e6c56a','#b39a4e');}
    else{ell(ctx,500,188,32,7,'#f1e7cc','#b3a27a',1.2);}
    edgeTube(ctx,[[340,172],[400,170],[480,172],[560,178],[620,188]],3,'#d58a7a','#9a5a4a');[380,440,500,560].forEach(x=>ell(ctx,x,171+(x-340)*0.04,4,3,'#d58a7a','#9a5a4a',1));
    drawPins(ctx,[[230,124],[330,118],[460,120],[600,150],[262,206]]);if(view==='hcomp')G.SP.slice(1).forEach(p=>ell(ctx,p[0],p[1],4,4,'#3a3418','#f2ead0',1.2));}
  ctx.restore();}

/* ================= tools of the trade ================= */
function toolCell(i){const c=i%3,r=Math.floor(i/3);return [12+c*260,10+r*146,256,140];}
function drawTool(ctx,id,x,y,w,h){const cx=x+w/2,cy=y+h/2-10,steel='#b7bcc4',steelD='#6f7680',hand='#2f6fb0';ctx.save();
  if(id==='scalpel'){rr(ctx,cx-30,cy-6,120,12,3);ctx.fillStyle=steel;ctx.fill();ctx.strokeStyle=steelD;ctx.stroke();for(let i=0;i<5;i++)line(ctx,[[cx+30+i*8,cy-5],[cx+30+i*8,cy+5]],steelD,1);
    ctx.beginPath();ctx.moveTo(cx-30,cy-4);ctx.lineTo(cx-75,cy-1);ctx.quadraticCurveTo(cx-95,cy+4,cx-80,cy+8);ctx.lineTo(cx-30,cy+5);ctx.closePath();ctx.fillStyle='#d9dde2';ctx.fill();ctx.strokeStyle=steelD;ctx.stroke();}
  else if(id==='dsc'||id==='osc'){const s=id==='osc'?1.2:1;ctx.translate(cx,cy);ctx.scale(s,s);
    ctx.fillStyle=steel;ctx.strokeStyle=steelD;ctx.lineWidth=1.3;
    ctx.beginPath();ctx.moveTo(8,-3);ctx.lineTo(-80,-6);ctx.quadraticCurveTo(-88,-3,id==='osc'?-90:-80,-1);ctx.lineTo(8,4);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(8,3);ctx.lineTo(-78,7);ctx.arc(-80,4,id==='osc'?3:5,1.5,4.7,false);ctx.lineTo(8,-4);ctx.closePath();ctx.fill();ctx.stroke();
    ell(ctx,0,0,3,3,steelD);ctx.lineWidth=5;ctx.strokeStyle=steel;line(ctx,[[8,0],[40,-14]],steel,5);line(ctx,[[8,0],[40,14]],steel,5);
    ell(ctx,55,-18,16,10,null,steel,5);ell(ctx,55,18,16,10,null,steel,5);}
  else if(id==='forceps'){[-1,1].forEach(sg=>{ctx.beginPath();ctx.moveTo(cx+85,cy);ctx.quadraticCurveTo(cx+10,cy+sg*16,cx-82,cy+sg*2);ctx.lineTo(cx-82,cy+sg*5);ctx.quadraticCurveTo(cx+10,cy+sg*21,cx+85,cy+sg*3);ctx.closePath();ctx.fillStyle=steel;ctx.fill();ctx.strokeStyle=steelD;ctx.lineWidth=1.2;ctx.stroke();});
    for(let i=0;i<4;i++){line(ctx,[[cx+18+i*9,cy-13+i*1.2],[cx+18+i*9,cy-9]],steelD,1);line(ctx,[[cx+18+i*9,cy+13-i*1.2],[cx+18+i*9,cy+9]],steelD,1);}}
  else if(id==='probe'){rr(ctx,cx+10,cy-6,80,12,5);ctx.fillStyle=hand;ctx.fill();line(ctx,[[cx+10,cy],[cx-70,cy],[cx-84,cy-10]],steel,5);ell(ctx,cx-85,cy-11,4,4,steel);}
  else if(id==='needle'){rr(ctx,cx+10,cy-6,80,12,5);ctx.fillStyle='#8a5a2f';ctx.fill();line(ctx,[[cx+10,cy],[cx-85,cy]],steel,2);ctx.beginPath();ctx.moveTo(cx-85,cy-1);ctx.lineTo(cx-92,cy);ctx.lineTo(cx-85,cy+1);ctx.fillStyle=steel;ctx.fill();}
  else if(id==='pins'){for(let i=0;i<5;i++){const px=cx-60+i*30;line(ctx,[[px,cy-30],[px+10,cy+30]],steel,2);line(ctx,[[px-8,cy-31],[px+8,cy-29]],steel,4);}}
  else if(id==='string'){ctx.strokeStyle='#d8cfb4';ctx.lineWidth=2.5;for(let i=0;i<7;i++){ctx.beginPath();ctx.ellipse(cx-10+i*3,cy,34-i,22-i*.5,0.2,0,6.29);ctx.stroke();}line(ctx,[[cx+24,cy+8],[cx+80,cy+26]],'#d8cfb4',2.5);}
  else if(id==='tray'){rr(ctx,cx-90,cy-34,180,68,10);ctx.fillStyle=C.trayRim;ctx.fill();rr(ctx,cx-82,cy-27,164,54,7);ctx.fillStyle=C.tray;ctx.fill();}
  ctx.restore();}
function toolShapes(){return TOOL_ORDER.map((id,i)=>{const c=toolCell(i);return {id,q:[{b:[[c[0],c[1]],[c[0]+c[2],c[1]],[c[0]+c[2],c[1]+c[3]],[c[0],c[1]+c[3]]],a:[c[0]+c[2]/2,c[1]+c[3]/2]}]};});}
function drawTools(ctx,sel,names,k){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  TOOL_ORDER.forEach((id,i)=>{const c=toolCell(i);rr(ctx,c[0],c[1],c[2],c[3],10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=sel===id?PAL['rj']:PAL['line'];ctx.lineWidth=sel===id?3:1;ctx.stroke();
    drawTool(ctx,id,c[0],c[1]-(names?6:-4),c[2],c[3]);
    if(names){const T=TOOLS[id];txt(ctx,T.n,c[0]+c[2]/2,c[1]+c[3]-14,{s:Math.min(14*k,22),w:700,a:'center',c:PAL['cv-ink']});
      if(T.nt&&k<1.3)txt(ctx,'not in your tray',c[0]+c[2]/2,c[1]+20,{s:12*k,a:'center',c:PAL['cv-soft']});}
    else txt(ctx,String(i+1),c[0]+16,c[1]+22,{s:14*k,w:700,c:PAL['cv-soft']});});}

/* ================= state helpers ================= */
const SEXN={f:'female',m:'male'};
const stepOpts=()=>STEPS.filter(s=>atLeast(s.lvl||'bio'));
function cutPending(sim){const p=sim.p,s=sim.st;if(p.mode==='pig')return !!NEEDS[p.step]&&s.cuts<NEEDS[p.step];if(p.mode==='hopper')return p.hstep==='hcut'&&!s.hcut;return false;}
function curView(sim){const p=sim.p,s=sim.st;if(p.mode==='pig')return pigView(p.step,s.cuts);if(p.mode==='hopper')return p.hstep==='hext'?'hext':p.hstep==='hcut'?(s.hcut?'hint':'hcut'):p.hstep==='hcomp'?'hcomp':'hint';
  if(p.mode==='practical'){const S=station(sim);return S?S.view:'ext';}return 'tools';}
function shapesFor(sim,view,sex){if(sim.p.mode==='tools')return toolShapes();if(sim.p.mode==='hopper'){const L=hopperShapes(view,sex);if(view==='hcomp')L.unshift({id:'spiracle',q:G.SP.slice(1).map(p=>({e:[p[0],p[1],6,6]}))});return L;}return pigShapes(view,sex);}
function firstStepShowing(id,sex){for(const s of stepOpts()){const v=pigView(s.v,NEEDS[s.v]||START[s.v]);if(pigShapes(v,sex).some(x=>x.id===id))return s;}return null;}
let IGNORE=false;
/* ---------- the practical ---------- */
function viewsFor(id,sex){const S=P[id];if(!S.pv||(S.sex&&S.sex!==sex))return [];return S.pv.filter(v=>pigShapes(v,sex).some(x=>x.id===id));}
function buildPractical(seed,lvl){const R=rng(seed),LV=LVN[lvl],pick=a=>a[Math.floor(R()*a.length)];IGNORE=true;
  const pool=Object.keys(P).filter(id=>P[id].plvl&&LVN[P[id].plvl]<=LV),used={},grp={},tags=[],stations=[];
  const free=id=>!used[id]&&!(P[id].grp&&grp[P[id].grp]);const take=id=>{used[id]=1;if(P[id].grp)grp[P[id].grp]=1;};
  const size=[3,2,3,2,3,2,3,2],vuse={};let owe=0;
  for(let i=0;i<8;i++){const sex=i%2?'m':'f',want=Math.min(4,size[i]+owe);let c=pool.filter(id=>free(id)&&viewsFor(id,sex).length);if(!c.length){owe=want;continue;}
    const vs={};c.forEach(id=>viewsFor(id,sex).forEach(v=>{vs[v]=(vs[v]||0)+1;}));const vlist=Object.keys(vs);const sc=v=>Math.min(vs[v],want)/(1+2*(vuse[v]||0))+R()*0.3;
    const view=vlist.reduce((m,v)=>sc(v)>sc(m)?v:m,vlist[0]);vuse[view]=(vuse[view]||0)+1;const inV=c.filter(id=>viewsFor(id,sex).includes(view)),own=inV.filter(id=>P[id].sex===sex);
    const first=own.length&&R()<0.55?pick(own):pick(inV);const S={sex,view,tags:[]};
    const add=id=>{take(id);S.tags.push(tags.length);tags.push({id,st:i,n:String(tags.length+1)});};add(first);
    let more=c.filter(id=>id!==first&&free(id)&&viewsFor(id,sex).includes(view));while(S.tags.length<want&&more.length){const id=pick(more);add(id);more=more.filter(x=>x!==id&&free(x));}
    owe=want-S.tags.length;stations.push(S);}
  /* extra credit: one structure from the remaining list, or from the next level's list */
  const nx=Math.min(2,LV+1);let ec=Object.keys(P).filter(id=>P[id].plvl&&LVN[P[id].plvl]<=nx&&free(id));const hard=ec.filter(id=>LVN[P[id].plvl]>LV);if(hard.length)ec=hard;
  let ecTag=null;if(ec.length){const id=pick(ec),sex=P[id].sex||(R()<.5?'f':'m'),vs=viewsFor(id,sex);if(vs.length){ecTag=tags.length;tags.push({id,st:8,n:'EC',ec:true});stations.push({sex,view:vs[vs.length-1],tags:[ecTag],ec:true});}}
  IGNORE=false;return {lvl,seed,tags,stations,ec:ecTag,main:tags.length-(ecTag===null?0:1)};}
function ensurePractical(sim){const lv=BioLab.level,s=sim.st;if(!s.prac||s.prac.lvl!==lv||s.prac.seed!==sim.pseed){s.prac=buildPractical(sim.pseed,lv);s.ans={};s.score=null;s.flash=-1;}return s.prac;}
function station(sim){const pr=ensurePractical(sim);const v=sim.p.station;const i=v==='ec'?pr.stations.findIndex(x=>x.ec):(+v-1);return pr.stations[i]||pr.stations[0];}
function tagShape(t,S){IGNORE=true;const L=pigShapes(S.view,S.sex);IGNORE=false;const e=L.find(x=>x.id===t.id);return e?e.q:null;}
function tagLayout(sim,S){if(S._pos)return S._pos;IGNORE=true;const all=pigShapes(S.view,S.sex);IGNORE=false;
  const c=S.view==='heart'?[470,235]:S.view==='brain'?[470,225]:S.view==='ext'?[430,225]:[470,225],out=[];
  const inside=(x,y)=>all.some(e=>e.q.some(q=>hitPrim(q,x,y)));
  S.tags.forEach(i=>{const q=tagShape(sim.st.prac.tags[i],S);const a=q?primCenter(q[0]):[400,225];let dx=a[0]-c[0],dy=a[1]-c[1];
    if(Math.abs(dy)<20)dy=(out.length%2?1:-1)*30;const L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;
    let best=null;for(const turn of [0,0.35,-0.35,0.7,-0.7]){const ux=dx*Math.cos(turn)-dy*Math.sin(turn),uy=dx*Math.sin(turn)+dy*Math.cos(turn);
      for(let d=34;d<=200;d+=8){const lp=[clamp(a[0]+ux*d,30,770),clamp(a[1]+uy*d,24,426)];
        if(!inside(lp[0],lp[1])&&!inside(lp[0]+12,lp[1])&&!inside(lp[0]-12,lp[1])&&out.every(o=>Math.hypot(o.lp[0]-lp[0],o.lp[1]-lp[1])>44)){best=lp;break;}}
      if(best)break;}
    if(!best)best=[clamp(a[0]+dx*60,30,770),clamp(a[1]+dy*60,24,426)];
    out.push({i,a,lp:best,q});});return S._pos=out;}
function score(sim){const pr=ensurePractical(sim),res=[];let right=0,ec=false;pr.tags.forEach((t,i)=>{const j=judge(sim.st.ans[i],t.id);res.push(Object.assign({i},j));if(j.ok){if(t.ec)ec=true;else right++;}});
  sim.st.score={right,total:pr.main,ec,pct:pr.main?right/pr.main*100:0,res};}

/* ---------- show only what the current mode (and step) uses: the coulomb.js syncMode pattern ---------- */
function syncMode(sim){const p=sim.p;if(sim.st&&p.mode==='practical')ensurePractical(sim);if(!sim.ui||!sim.ui.sec)return;const mode=p.mode,d=sim.def;
  const vis=o=>atLeast(o.lvl)&&(!o.modes||o.modes.includes(mode))&&(!o.show||!sim.st||o.show(sim));
  d.controls.forEach(c=>{const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!vis(c);});
  d.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!vis(m);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!vis(a);});
  sim.infoDirty=true;}
const say=(sim,ok,t)=>{sim.st.msg={ok,t};sim.infoDirty=true;};
function doCut(sim){const p=sim.p,s=sim.st;
  if(!cutPending(sim)){say(sim,false,'No cut is needed at this step. Press Next step.');return;}
  if(p.cutwith==='none'){say(sim,false,'Choose a tool to cut with first.');return;}
  if(p.mode==='hopper'){
    if(p.cutwith!=='dsc'){s.wrong++;say(sim,false,(p.cutwith==='scalpel'?'A scalpel slices too deep and cuts the gut underneath. Use the fine tips of the dissecting scissors, lifting the exoskeleton as you cut.':TOOL_NO[p.cutwith])+(s.wrong>=2?' Hint: use the dissecting scissors.':''));return;}
    if(p.hpath==='none'){say(sim,false,'Now choose where to cut.');return;}
    const hp=HPATHS[p.hpath];if(!hp.ok){s.wrong++;say(sim,false,hp.msg+(s.wrong>=2?' Hint: cut along the back, just to one side of the midline, from the tip of the abdomen to the head.':''));return;}
    s.hcut=true;s.wrong=0;say(sim,true,'Cut made. Spread the body wall flaps and pin them out at an angle, then put one pin through the thorax. The organs are now in view: press Next step.');
    BioLab.setValues(sim,{cutwith:'none',hpath:'none'});syncMode(sim);return;}
  const need=CUTS[s.cuts],okTools=need.tools||['dsc'];
  if(!okTools.includes(p.cutwith)){s.wrong++;say(sim,false,(TOOL_NO[p.cutwith]||'That tool will not work here.')+(s.wrong>=2?' Hint: use the '+(need.tools?'forceps to lift the sac and the dissecting scissors to snip it':'dissecting scissors')+'.':''));return;}
  if(p.path==='none'){say(sim,false,'Now choose where to cut.');return;}
  if(p.path!==need.id){s.wrong++;let m;const ix=CUTS.findIndex(c=>c.id===p.path);
    if(WRONG_PATHS[p.path])m=WRONG_PATHS[p.path].msg;else if(ix>=0&&ix<s.cuts)m='You already made that cut.';else m='Not yet: that cut comes later. The cuts go in order.';
    say(sim,false,m+(s.wrong>=2?' Hint: '+need.n+' is '+need.l.charAt(0).toLowerCase()+need.l.slice(1)+'.':''));return;}
  s.cuts++;s.wrong=0;const done=s.cuts>=NEEDS[p.step];say(sim,true,need.ok+(done?' Press Next step.':' Next: '+CUTS[s.cuts].n+'.'));
  BioLab.setValues(sim,{cutwith:'none',path:'none'});syncMode(sim);}
function autoCut(sim){if(!cutPending(sim)){say(sim,false,'No cut is needed at this step. Press Next step.');return;}
  if(sim.p.mode==='hopper')BioLab.setValues(sim,{cutwith:'dsc',hpath:'hdors'});else{const need=CUTS[sim.st.cuts];BioLab.setValues(sim,{cutwith:need.tools?need.tools[0]:'dsc',path:need.id});}
  sim.st.wrong=0;doCut(sim);if(sim.st.msg&&sim.st.msg.ok)sim.st.msg.t='Shown for you: '+sim.st.msg.t;}
function goStep(sim,dir){const p=sim.p;if(p.mode==='hopper'){const list=HSTEPS.map(s=>s.v),i=list.indexOf(p.hstep);
    if(dir>0&&cutPending(sim)){say(sim,false,'Make the cut first, or jump ahead with the Step list.');return;}
    const j=clamp(i+dir,0,list.length-1);if(j===i){say(sim,false,dir>0?'This is the last step.':'This is the first step.');return;}BioLab.setValues(sim,{hstep:list[j]});return;}
  const list=stepOpts().map(s=>s.v),i=list.indexOf(p.step);
  if(dir>0&&cutPending(sim)){say(sim,false,'Make the cut first, or jump ahead with the Step list.');return;}
  const j=clamp(i+dir,0,list.length-1);if(j===i){say(sim,false,dir>0?'This is the last step at this level.':'This is the first step.');return;}
  BioLab.setValues(sim,{step:list[j]});}
function goStation(sim,dir){const pr=ensurePractical(sim);const vals=pr.stations.map((s,i)=>s.ec?'ec':String(i+1));let i=vals.indexOf(String(sim.p.station));if(i<0)i=0;
  const j=clamp(i+dir,0,vals.length-1);BioLab.setValues(sim,{station:vals[j]==='ec'?'ec':+vals[j]});}

/* ---------- procedure text ---------- */
const STEP_TXT={
 ext:{bio:'Before you cut, find the external structures: the <b>umbilical cord</b>, the <b>urogenital opening</b> and, on a female, the <b>genital papilla</b>. Click each one.'},
 sex:{bio:'Look between the hind legs. A <b>female</b> has a genital papilla and urogenital opening just below the anus. A <b>male</b> has his urogenital opening just behind the umbilical cord, and scrotal sacs below the anus. Switch the specimen to compare.'},
 tie:{bio:'Lay the pig on its back, ventral side up, in the tray. Tie a string around one front leg, pass it under the tray and tie it to the other front leg. Do the same with the hind legs, so the belly stays open to you.'},
 cut:{bio:'Make five cuts, working from the head toward the tail. Lift the skin with the scissor tips as you cut, so you cut only the body wall and not the organs underneath. Choose a tool and where to cut, then press <b>Make the cut</b>.'},
 pin:{bio:'Fold the belly flaps out and pin them to the tray, pins angled away from the pig. The umbilical cord stays on its own flap, held in place by the umbilical vein. Cut the umbilical vein so the flap folds back toward the tail, then pin it.'},
 five:{bio:'Without moving anything, five organs are in view: the <b>liver</b>, <b>stomach</b>, <b>spleen</b>, <b>small intestine</b> and <b>large intestine</b>. The urinary bladder and the umbilical arteries lie on the folded-back umbilical flap.'},
 liver:{bio:'Gently lift the liver toward the head with a blunt probe. The green <b>gallbladder</b> sits on its underside, on the pig’s right. The <b>pancreas</b> lies in the loop between the stomach and the small intestine.'},
 intest:{bio:'Move the intestines to the pig’s right and pull the umbilical flap aside. Against the back wall are the <b>kidneys</b> and <b>ureters</b>. Follow the bladder to the <b>urethra</b>, then find the reproductive organs.'},
 thorax:{bio:'To see the chest organs, cut through the middle of the rib cage from the diaphragm up to the neck, then fold the ribs out and pin them. Note the <b>diaphragm</b>: it separates the thoracic cavity from the abdominal cavity.'},
 heart:{bio:'The heart sits in a thin sac, the pericardium. Lift the sac with forceps and snip it open with the scissors.',honors:'The heart sits in a thin sac, the pericardium. Lift the sac with forceps and snip it open. Then find the four chambers and the great vessels. Blue-filled vessels are veins and red-filled ones arteries, as in a double-injected specimen.'},
 brain:{honors:'In a separate dissection, the top of the skull is carefully removed to show the brain from above. Find the <b>cerebrum</b> and the <b>cerebellum</b>.'},
 circ:{ap:'Before birth the lungs are filled with fluid, so the placenta does their job. Follow the blood: umbilical vein → ductus venosus → caudal vena cava → right atrium → foramen ovale → left atrium → left ventricle → aorta. Blood the right ventricle pumps mostly skips the lungs through the ductus arteriosus.'}};
const HSTEP_TXT={hext:'Before cutting, find six external structures: the <b>antennae</b>, <b>compound eyes</b>, <b>mandibles</b>, <b>wings</b>, <b>legs</b> and <b>spiracles</b>. The body has three regions: head, thorax and abdomen.',
 hcut:'Remove the wings and legs first. Then, with the grasshopper on its side or belly, choose the tool and where to cut, and press <b>Make the cut</b>.',
 hint:'With the body wall pinned back, find the organs: the <b>crop</b>, <b>gizzard</b>, <b>gastric caeca</b>, <b>stomach</b> (midgut), <b>Malpighian tubules</b>, <b>intestine and rectum</b>, the dorsal <b>heart</b>, and the <b>ovaries</b> or testes.',
 hcomp:'The grasshopper and the pig solve the same problems in different ways. The five numbered structures differ most from the pig: compare them in the table.'};
function checklist(sim,view,sex){const p=sim.p;let ids=[];
  if(p.mode==='hopper'){ids=view==='hext'?Object.keys(H).filter(k=>H[k].six):view==='hint'?Object.keys(H).filter(k=>H[k].eight):[];return ids;}
  const M={ext:sex==='f'?['umbcord','ugopen','genpap']:['umbcord','ugopen'],five:['liver','stomach','spleen','smint','lgint'],liver:['gall','pancreas'],
   intest:['kidney','ureter','bladder','urethra','umbart','rectum'].concat(sex==='f'?['ovaries','oviduct','uterus','vagina']:['testes','epid','spcord','vasdef','penis']),
   thorax:['larynx','trachea','thyroid','esophagus','lungs','heart','diaphragm'],heart:atLeast('honors')?['ra','la','rv','lv','cranvc','caudvc','aorta','aarch','pulmart'].concat(atLeast('ap')?['ductart']:[]):['heart','lungs'],
   brain:['cerebrum','cerebellum'],circ:['umbvein','ductven','caudvc','ra','foramen','la','lv','aorta','pulmart','ductart','umbart','placenta']};
  if(p.step==='tie'||p.step==='cut')return [];if(p.step==='five'||(p.step==='pin'&&view==='five'))ids=M.five;else if(view==='ext'&&p.step==='ext'||p.step==='sex')ids=M.ext;else ids=M[view]||[];
  if(p.step==='thorax'&&view!=='thorax')ids=[];if(p.step==='heart'&&view!=='heart')ids=[];return ids.filter(id=>P[id]&&lvOK(P[id].lvl));}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function structBlock(id,sex,isH){const S=isH?H[id]:P[id];if(!S)return '';const nm=isH?hName(id,sex):S.n;let h='<h3>'+nm+'</h3><p>'+sexTxt(S.fn,sex)+'</p>';
  if(!isH){if(atLeast('honors')&&S.loc)h+='<p><b>Where:</b> '+sexTxt(S.loc,sex)+'</p>';h+='<p><b>System:</b> '+S.sys+'</p>';if(atLeast('ap')&&S.deep)h+='<p><b>Fetal circulation:</b> '+S.deep+'</p>';}
  else{const cmp=COMPARE.find(c=>c.k===id);if(cmp)h+='<p><b>In the pig:</b> '+cmp.p+'</p>';}
  return h;}
function chips(sim,ids,isH,sex){if(!ids.length)return '';const f=sim.found||{};return '<p class="help" style="margin:8px 0 0"><b>Find these:</b> '+ids.map(id=>{const n=isH?hName(id,sex):P[id].n;const ok=f[(isH?'h:':'')+id];return '<span style="display:inline-block;margin:2px 4px 2px 0;padding:1px 9px;border:1px solid var(--line);border-radius:999px;'+(ok?'background:var(--card2);color:var(--good);font-weight:600':'')+'">'+(ok?'✓ ':'')+n+'</span>';}).join('')+'</p>';}
const INP='width:100%;padding:6px 9px;border:1px solid var(--line);border-radius:8px;background:var(--card2);color:var(--fg);font-size:16px';
function infoPanel(sim){const p=sim.p,s=sim.st,sex=p.sex,view=curView(sim);let h='';
  const msg=s.msg?'<p class="verdict '+(s.msg.ok?'ok':'no')+'" style="font-weight:600">'+s.msg.t+'</p>':'';
  if(p.mode==='tools'){const T=TOOLS[p.tool];
    if(!T)return '<div class="p-head"><h3>Tools of the trade</h3></div><p>Click a tool in the picture, or choose one from the <b>Tool</b> list, to see what it is, what it is used for and how to hold it.</p><p>Turn off <b>Show names</b> to quiz yourself.</p>';
    return '<div class="p-head"><h3>Tools of the trade</h3></div><h3>'+T.n+(T.alt?' '+T.alt:'')+'</h3>'+(T.nt?'<p class="pick"><b>Not in your tray, but you need to know it.</b></p>':'')+'<p><b>Description:</b> '+T.d+'</p><p><b>Used on or for:</b> '+T.u+'</p><p><b>How to hold it:</b> '+T.h+'</p>';}
  if(p.mode==='practical'){const pr=ensurePractical(sim),S=station(sim),si=pr.stations.indexOf(S),answered=pr.tags.filter((t,i)=>!t.ec&&String(s.ans[i]||'').trim()).length;
    h='<div class="p-head"><h3>'+(S.ec?'Extra-credit tag':'Station '+(si+1)+' of '+pr.stations.filter(x=>!x.ec).length)+'</h3><span class="count">'+answered+' of '+pr.main+' answered</span></div>';
    h+='<p>'+(S.view==='heart'||S.view==='brain'?'':'A '+SEXN[S.sex]+' pig. ')+VIEWN[S.view]+' Type the name of each tagged structure.</p>';
    const bank=p.bank?'<datalist id="dsx-bank">'+Object.keys(P).filter(id=>P[id].plvl&&LVN[P[id].plvl]<=LVN[BioLab.level]).map(id=>P[id].n).sort().map(n=>'<option value="'+esc(n)+'">').join('')+'</datalist>':'';
    h+=bank+S.tags.map(i=>{const t=pr.tags[i],r=s.score&&s.score.res[i];const mark=r?(r.ok?'<b style="color:var(--good)">✓ '+P[t.id].n+'</b>':'<b style="color:var(--bad)">✗ '+P[t.id].n+'</b>'):'';
      return '<div style="margin:0 0 10px"><label for="dsx-a-'+i+'" style="font-weight:700;display:block;margin-bottom:3px">Tag '+t.n+(t.ec?' (extra credit)':'')+'</label><input id="dsx-a-'+i+'" data-i="'+i+'" type="text" autocomplete="off" spellcheck="false"'+(p.bank?' list="dsx-bank"':'')+' style="'+INP+'" value="'+esc(s.ans[i]||'')+'">'+(mark?'<div style="margin-top:3px">'+mark+'</div>':'')+'</div>';}).join('');
    h+='<div class="row" style="margin:4px 0 8px"><button type="button" class="btn" data-pr="prev">Previous station</button><button type="button" class="btn" data-pr="next">Next station</button><button type="button" class="btn primary" data-pr="check">Check my answers</button></div>';
    if(s.score){const sc=s.score;h+='<p class="verdict ok" style="color:var(--fg)">Score: '+sc.right+' / '+sc.total+' ('+Math.round(sc.pct)+'%)'+(pr.ec!==null?(sc.ec?' + extra credit':' · extra credit missed'):'')+'</p>';
      const miss=sc.res.filter(r=>!r.ok);if(!miss.length)h+='<p>Every tag correct. Record a trial to log this score, or press New practical for a fresh set of tags.</p>';
      else h+='<p><b>Review your misses</b></p>'+miss.map(r=>{const t=pr.tags[r.i],St=pr.stations[pr.stations.findIndex(x=>x.tags.includes(r.i))],ans=String(s.ans[r.i]||'').trim();
        return '<div style="border-top:1px solid var(--line);padding:8px 0"><p style="margin:0 0 4px"><b>Tag '+t.n+': '+P[t.id].n+'</b>'+(ans?' (you wrote “'+esc(ans)+'”'+(r.other?', which is the '+P[r.other].n.toLowerCase():'')+')':' (blank)')+'</p>'+
          '<p style="margin:0 0 4px"><b>Where:</b> '+sexTxt(P[t.id].loc,St.sex)+'</p><p style="margin:0 0 6px"><b>Job:</b> '+sexTxt(P[t.id].fn,St.sex)+'</p><button type="button" class="btn" data-show="'+r.i+'">Show me tag '+t.n+'</button></div>';}).join('');}
    return h;}
  if(p.mode==='hopper'){const st=HSTEPS.find(x=>x.v===p.hstep);h='<div class="p-head"><h3>Grasshopper · '+st.l.replace(/^\d+\. /,'')+'</h3></div><p>'+HSTEP_TXT[p.hstep]+'</p>'+msg;
    if(p.hstep==='hcomp')h+='<div class="tbl-wrap"><table><thead><tr><th>#</th><th>System</th><th>Grasshopper</th><th>Fetal pig</th></tr></thead><tbody>'+COMPARE.map((c,i)=>'<tr><td>'+(i+1)+'</td><td style="white-space:normal;text-align:left">'+c.t+'</td><td style="white-space:normal;text-align:left">'+c.g+'</td><td style="white-space:normal;text-align:left">'+c.p+'</td></tr>').join('')+'</tbody></table></div>';
    if(p.hpart!=='none'&&H[p.hpart]){const vis=shapesFor(sim,view,sex).some(x=>x.id===p.hpart);h+='<div style="border-top:1px solid var(--line);margin-top:10px;padding-top:8px">'+(vis?'':'<p class="pick"><b>Not visible in this view.</b> '+(H[p.hpart].six||['head','thorax','abdomen','tympanum','ovipositor'].includes(p.hpart)?'It is on the outside: go to step 1.':'It is inside: make the cut first.')+'</p>')+structBlock(p.hpart,sex,true)+'</div>';}
    return h+chips(sim,checklist(sim,view,sex),true,sex);}
  const st=STEPS.find(x=>x.v===p.step);h='<div class="p-head"><h3>Step '+(STEP_IX[p.step]+1)+' · '+st.t+'</h3></div><p>'+lvText(STEP_TXT[p.step])+'</p>';
  if(cutPending(sim)){const c=CUTS[s.cuts];h+='<p><b>Your move: '+c.n+(NEEDS[p.step]-START[p.step]>1?' of '+NEEDS[p.step]:'')+'.</b> Choose the tool and where to cut under <b>Lab bench</b>, then press <b>Make the cut</b>.</p>';}
  h+=msg;
  if(p.part!=='none'&&P[p.part]){const vis=pigShapes(view,sex).some(x=>x.id===p.part);let pre='';
    if(P[p.part].sex&&P[p.part].sex!==sex)pre='<p class="pick"><b>Only in a '+SEXN[P[p.part].sex]+' pig.</b> Switch the specimen to see it.</p>';
    else if(!vis){const fs=firstStepShowing(p.part,sex);pre='<p class="pick"><b>Not visible at this step.</b> '+(fs?'You can see it at step '+(STEP_IX[fs.v]+1)+': '+fs.t.toLowerCase()+'.':'')+'</p>';}
    h+='<div style="border-top:1px solid var(--line);margin-top:10px;padding-top:8px">'+pre+structBlock(p.part,sex,false)+'</div>';}
  return h+chips(sim,checklist(sim,view,sex),false,sex);}
const VIEWN={ext:'Closed specimen, belly up.',five:'Opened, nothing moved yet.',liver:'The liver is lifted toward the head.',intest:'The intestines and the umbilical flap are moved aside.',thorax:'The chest is opened.',heart:'A close-up of the heart with the pericardium removed.',brain:'The brain, seen from above with the skull opened.',open0:'Opened, flaps pinned.'};
function bindInfo(sim,el){el.querySelectorAll('input[data-i]').forEach(inp=>{inp.addEventListener('input',()=>{sim.st.ans[inp.dataset.i]=inp.value;if(sim.st.score){sim.st.score=null;}});
    inp.addEventListener('keydown',e=>{if(e.key==='Enter'){const all=[...el.querySelectorAll('input[data-i]')],i=all.indexOf(inp);if(i<all.length-1)all[i+1].focus();else{goStation(sim,1);BioLab.refresh(sim);}}});});
  el.querySelectorAll('[data-pr]').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.pr;if(a==='prev')goStation(sim,-1);else if(a==='next')goStation(sim,1);else{score(sim);}BioLab.refresh(sim);}));
  el.querySelectorAll('[data-show]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.show,pr=ensurePractical(sim),si=pr.stations.findIndex(x=>x.tags.includes(i));sim.st.flash=i;
    BioLab.setValues(sim,{station:pr.stations[si].ec?'ec':si+1});BioLab.refresh(sim);const cv=sim.ui.stage;if(cv&&cv.scrollIntoView)cv.scrollIntoView({block:'center'});}));}

/* ---------- drawing ---------- */
function labelAt(ctx,txt_,a,k,bg,fg,above){ctx.font='700 '+13*k+'px '+FONT;const w=ctx.measureText(txt_).width+14*k;const up=above!==undefined?above:a[1]>120;
  const lx=clamp(a[0],w/2+6,794-w/2),ly=clamp(a[1]+(up?-34:34)*Math.min(k,1.4),14*k,450-14*k);line(ctx,[a,[lx,ly]],bg,2);pill(ctx,txt_,lx,ly,bg,fg,13*k);}
function drawSel(ctx,sim,list,id,name,k){const e=list.find(x=>x.id===id);if(!e)return;e.q.forEach(q=>outlinePrim(ctx,q,PAL['rj'],3));const a=primCenter(e.q[0]);
  if(id==='foramen'){ctx.font='700 '+13*k+'px '+FONT;const w=ctx.measureText(name).width+14*k;line(ctx,[a,[a[0]-w/2-14,a[1]]],PAL['rj'],2);pill(ctx,name,Math.max(w/2+6,a[0]-w/2-14),a[1],PAL['rj'],'#fff',13*k);return;}
  labelAt(ctx,name,a,k,PAL['rj'],'#fff');}
function drawTags(ctx,sim,S,k){const pr=sim.st.prac,sc=sim.st.score;tagLayout(sim,S).forEach(o=>{const t=pr.tags[o.i],r=sc&&sc.res[o.i];
  line(ctx,[o.a,o.lp],'#2b2b2b',3.4);line(ctx,[o.a,o.lp],'#f6f0dc',1.8);ell(ctx,o.a[0],o.a[1],4.5,4.5,C.tag,'#3b3010',1.4);
  let lab=t.n,bg=C.tag,fg=C.tagInk;if(r){bg=r.ok?'#2e7d4f':'#b3261e';fg='#fff';lab=t.n+(r.ok?' ✓':' ✗');}
  if(sim.st.flash===o.i){o.q&&o.q.forEach(q=>outlinePrim(ctx,q,'#f2c94c',3));lab=t.n+' · '+P[t.id].n;}
  pill(ctx,lab,o.lp[0],o.lp[1],bg,fg,13*k);});}
function draw(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st,sex=p.sex,view=curView(sim);ctx.fillStyle=PAL['card'];ctx.fillRect(0,0,800,450);
  const touring=sim.tour&&sim.tour.on;
  if(p.mode==='tools'){drawTools(ctx,p.tool,p.names,k);return;}
  if(p.mode==='hopper'){drawTray(ctx);const list=shapesFor(sim,view,sex),sel=p.hpart!=='none'&&H[p.hpart]?list.find(x=>x.id===p.hpart):null;
    ctx.save();ctx.translate(400,210);ctx.scale(HS,HS);ctx.translate(-400,-210);drawHopper(ctx,view==='hcut'?'hcut':view,sex,{});
    if(view==='hcut'&&p.hpath!=='none'&&HCUT[p.hpath])line(ctx,HCUT[p.hpath],PAL['rj'],2.5,[6,4]);
    if(sel)sel.q.forEach(q=>outlinePrim(ctx,q,PAL['rj'],2.5));ctx.restore();
    if(view==='hcomp'){COMPARE.forEach((c,i)=>{const e=list.find(x=>x.id===c.k);if(!e)return;const a=hfwd(primCenter(e.q[0]));pill(ctx,String(i+1),a[0],a[1]+(c.k==='hheart'?-24:c.k==='ncord'?24:c.k==='spiracle'?22:0),PAL['rj'],'#fff',14*k);});}
    if(sel)labelAt(ctx,hName(p.hpart,sex),hfwd(primCenter(sel.q[0])),k,PAL['rj'],'#fff');
    pill(ctx,(sex==='f'?'Female':'Male')+' grasshopper',112*Math.min(k,1.3),22*k,PAL['card'],PAL['cv-ink'],12*k);return;}
  if(p.mode==='practical'){const S=station(sim);drawPigScene(ctx,S.view,S.sex,{cuts:0,peri:false,t,k});drawTags(ctx,sim,S,k);
    const pr=s.prac,si=pr.stations.indexOf(S);pill(ctx,S.ec?'Extra credit':'Station '+(si+1)+(S.view==='heart'||S.view==='brain'?'':' · '+(S.sex==='f'?'female':'male')),108*Math.min(k,1.3),20*k,PAL['card'],PAL['cv-ink'],13*k);return;}
  drawPigScene(ctx,view,sex,{cuts:s.cuts,strings:p.step!=='ext'&&p.step!=='sex',peri:!(s.cuts>=8),t,k,sel:p.part});
  if(cutPending(sim)&&p.path!=='none'&&!touring)drawPreview(ctx,p.path,PAL['rj']);
  if(touring&&p.step==='cut')for(let i=s.cuts;i<5;i++)drawPreview(ctx,CUTS[i].id,'#f2c94c');
  const list=pigShapes(view,sex);
  if(p.part!=='none'&&P[p.part]&&!touring)drawSel(ctx,sim,list,p.part,P[p.part].n,k);
  if(p.step==='sex'&&!touring){const a=sex==='f'?[660,225]:[503,225];ctx.save();ctx.setLineDash([6,4]);ell(ctx,a[0],a[1],sex==='f'?30:22,22,null,PAL['rj'],2.5);ctx.restore();}
  if(view!=='heart'&&view!=='brain'&&view!=='circ')pill(ctx,(sex==='f'?'Female':'Male')+' pig',70*Math.min(k,1.4),26*Math.min(k,1.2),PAL['card'],PAL['cv-ink'],12*k);
  if(view==='heart')pill(ctx,'Close-up of the heart',110*Math.min(k,1.4),20*k,PAL['card'],PAL['cv-ink'],12*k);}
function onClick(sim,x,y){const p=sim.p,view=curView(sim);
  if(p.mode==='practical'){const S=station(sim);const o=tagLayout(sim,S).find(o=>Math.hypot(o.lp[0]-x,o.lp[1]-y)<26||Math.hypot(o.a[0]-x,o.a[1]-y)<12);
    if(o){const inp=document.getElementById('dsx-a-'+o.i);if(inp)inp.focus();}return;}
  const list=shapesFor(sim,view,p.sex),hit=list.find(e=>e.q.some(q=>hitPrim(q,x,y)));sim.found=sim.found||{};
  if(p.mode==='tools'){BioLab.setValues(sim,{tool:hit?hit.id:'none'});return;}
  if(p.mode==='hopper'){const q=hinv(x,y),hh=list.find(e=>e.q.some(r=>hitPrim(r,q[0],q[1])));if(hh)sim.found['h:'+hh.id]=1;BioLab.setValues(sim,{hpart:hh?hh.id:'none'});return;}

  if(hit)sim.found[hit.id]=1;sim.st.msg=null;BioLab.setValues(sim,{part:hit?hit.id:'none'});}

/* ================= definition ================= */
const PIG_PARTS=Object.keys(P);
const DSX={
  id:'dissection',hash:'dissection',apUnit:9,order:5,kind:'Virtual lab',tab:'Fetal pig dissection',
  card:'Dissect a fetal pig and a grasshopper step by step: pick the right tool and cut, find every organ, then take a tagged practical.',
  title:'Virtual fetal pig and grasshopper dissection',
  lede:{bio:'Learn the tools, then dissect a fetal pig the way the RJ pre-lab describes: find the outside structures, tie it down, make each cut, and identify the organs and what they do.',
        honors:'Work through the full RJ structure list, including the heart’s chambers and great vessels, the umbilical vessels and the brain, then compare the pig with a grasshopper.',
        ap:'Add fetal circulation: follow blood from the placenta through the ductus venosus, foramen ovale and ductus arteriosus, and explain why each shunt exists.'},
  scale:{bio:'Fetal pig: about 25–30 cm from snout to tail, close to birth. Grasshopper: about 4 cm long, drawn about 15 times life size. A clinical illustration, not a photo.',
         honors:'Fetal pig: about 25–30 cm long, close to birth. The heart close-up shows a heart about 2 cm long. Grasshopper: about 4 cm, drawn about 15 times life size.'},
  timeless:true,animated:true,graph:false,chChange:1,chReveal:2.6,controlsTitle:'Lab bench',
  controls:[
    {id:'mode',label:'Part of the lab',type:'seg',def:'pig',lvl:'bio',options:[{v:'tools',l:'Tools'},{v:'pig',l:'Fetal pig'},{v:'hopper',l:'Grasshopper'},{v:'practical',l:'Practical'}]},
    {id:'tool',label:'Tool',type:'select',def:'none',lvl:'bio',modes:['tools'],noTrial:true,options:[{v:'none',l:'Choose a tool…'}].concat(TOOL_ORDER.map(id=>({v:id,l:TOOLS[id].n})))},
    {id:'names',label:'Show names',help:'Turn off to quiz yourself',type:'toggle',def:true,lvl:'bio',modes:['tools'],noTrial:true},
    {id:'sex',label:'Specimen',type:'seg',def:'f',lvl:'bio',modes:['pig','hopper'],options:[{v:'f',l:'Female'},{v:'m',l:'Male'}]},
    {id:'step',label:'Step',type:'select',def:'ext',lvl:'bio',modes:['pig'],noTrial:true,help:'Jump to any step; earlier cuts are made for you.',options:STEPS.map(s=>({v:s.v,l:s.l,lvl:s.lvl}))},
    {id:'hstep',label:'Step',type:'select',def:'hext',lvl:'bio',modes:['hopper'],noTrial:true,options:HSTEPS.map(s=>({v:s.v,l:s.l}))},
    {id:'cutwith',label:'Cut with',type:'select',def:'none',lvl:'bio',modes:['pig','hopper'],noTrial:true,show:cutPending,options:[{v:'none',l:'Choose a tool…'}].concat(CUTTERS.map(id=>({v:id,l:TOOLS[id].n})))},
    {id:'path',label:'Where to cut',type:'select',def:'none',lvl:'bio',modes:['pig'],noTrial:true,show:cutPending,
     options:[{v:'none',l:'Choose a cut…'}].concat(CUTS.map(c=>({v:c.id,l:c.l})),Object.keys(WRONG_PATHS).map(k=>({v:k,l:WRONG_PATHS[k].l})))},
    {id:'hpath',label:'Where to cut',type:'select',def:'none',lvl:'bio',modes:['hopper'],noTrial:true,show:cutPending,options:[{v:'none',l:'Choose a cut…'}].concat(Object.keys(HPATHS).map(k=>({v:k,l:HPATHS[k].l})))},
    {id:'part',label:'Structure',type:'select',def:'none',lvl:'bio',modes:['pig'],noTrial:true,help:'Or click it in the picture.',options:[{v:'none',l:'Choose a structure…'}].concat(PIG_PARTS.map(id=>({v:id,l:P[id].n,lvl:P[id].lvl})))},
    {id:'hpart',label:'Structure',type:'select',def:'none',lvl:'bio',modes:['hopper'],noTrial:true,help:'Or click it in the picture.',options:[{v:'none',l:'Choose a structure…'}].concat(Object.keys(H).map(id=>({v:id,l:H[id].n,lvl:H[id].lvl})))},
    {id:'station',label:'Station',type:'select',def:1,lvl:'bio',modes:['practical'],noTrial:true,options:[1,2,3,4,5,6,7,8].map(i=>({v:i,l:'Station '+i})).concat([{v:'ec',l:'Extra-credit tag'}])},
    {id:'bank',label:'Word bank',help:'Suggest names as you type',type:'toggle',def:false,lvl:'bio',modes:['practical']}
  ],
  actions:[
    {id:'cut',label:'Make the cut',lvl:'bio',primary:true,modes:['pig','hopper'],show:cutPending,run:doCut},
    {id:'auto',label:'Do this cut for me',lvl:'bio',modes:['pig','hopper'],show:cutPending,run(sim){autoCut(sim);}},
    {id:'next',label:'Next step',lvl:'bio',primary:true,modes:['pig','hopper'],run(sim){goStep(sim,1);}},
    {id:'back',label:'Back a step',lvl:'bio',modes:['pig','hopper'],run(sim){goStep(sim,-1);}},
    {id:'check',label:'Check my answers',lvl:'bio',primary:true,modes:['practical'],run(sim){score(sim);}},
    {id:'nst',label:'Next station',lvl:'bio',modes:['practical'],run(sim){goStation(sim,1);}},
    {id:'pst',label:'Previous station',lvl:'bio',modes:['practical'],run(sim){goStation(sim,-1);}},
    {id:'newp',label:'New practical',lvl:'bio',modes:['practical'],run(sim){sim.pseed=(Math.random()*2**31)|0;sim.st.prac=null;ensurePractical(sim);BioLab.setValues(sim,{station:1});}}
  ],
  init(sim){if(!sim.pseed)sim.pseed=(Math.random()*2**31)|0;sim.found=sim.found||{};return {cuts:START[sim.p.step]||0,hcut:sim.p.hstep!=='hext'&&sim.p.hstep!=='hcut',wrong:0,msg:null,prac:null,ans:{},score:null,flash:-1};},
  step(){},
  metrics:[
    {id:'found',label:'Structures you have found',lvl:'bio',text:true,modes:['pig','hopper'],get(sim){const f=sim.found||{};if(sim.p.mode==='hopper'){const ids=Object.keys(H).filter(id=>lvOK(H[id].lvl));return ids.filter(id=>f['h:'+id]).length+' of '+ids.length;}
      const ids=Object.keys(P).filter(id=>P[id].plvl&&LVN[P[id].plvl]<=LVN[BioLab.level]);return ids.filter(id=>f[id]).length+' of '+ids.length+' on the list';}},
    {id:'answered',label:'Tags answered',lvl:'bio',text:true,modes:['practical'],get(sim){if(!sim.st||sim.p.mode!=='practical')return '—';const pr=ensurePractical(sim);return pr.tags.filter((t,i)=>!t.ec&&String(sim.st.ans[i]||'').trim()).length+' of '+pr.main;}},
    {id:'pscore',label:'Practical score',lvl:'bio',text:true,modes:['practical'],get(sim){const sc=sim.st&&sim.st.score;return sc?sc.right+' / '+sc.total+(sc.ec?' + extra credit':''):'Not checked yet';}},
    {id:'ppct',label:'Practical percent',unit:'%',lvl:'bio',min:0,max:100,d:0,modes:['practical'],get(sim){const sc=sim.st&&sim.st.score;return sc?sc.pct:NaN;}}
  ],
  infoPanel,bindInfo,
  challengeTitle:'Predict, then check',
  challenges:[
    {lvl:'bio',q:'You lift the liver toward the head. What do you find attached to its underside?',choices:['The gallbladder','A kidney','The pancreas','The heart'],correct:0,
     baseline:{mode:'pig',step:'five'},change:{step:'liver',part:'gall'},changeText:'Liver lifted',
     explain:'The small green gallbladder sits on the underside of the liver, on the pig’s right. It stores the bile the liver makes. The pancreas is nearby, but it lies in the loop of the small intestine, not on the liver.'},
    {lvl:'bio',q:'You switch to a male pig. Where is his urogenital opening?',choices:['Just behind the umbilical cord','Just below the anus, next to a genital papilla','He has none: urine leaves through the anus'],correct:0,
     baseline:{mode:'pig',step:'sex',sex:'f'},change:{sex:'m',part:'ugopen'},changeText:'Male specimen',
     explain:'In a male the urogenital opening is on the belly just behind the umbilical cord, at the end of the penis, and the scrotal sacs sit below the anus. Only a female has a genital papilla, just below the anus. That is how you tell them apart.'},
    {lvl:'bio',q:'A fetal pig has lungs. Did it use them to breathe before birth?',choices:['Yes, it breathed the fluid in the uterus','No: they were full of fluid, and the placenta supplied oxygen through the umbilical cord','It had no lungs until birth'],correct:1,instant:true,
     explain:'The lungs were fully formed but filled with fluid. Oxygen came from the mother through the placenta and umbilical vein. The lungs take over with the first breath after birth.'},
    {lvl:'bio',q:'Which structure separates the thoracic (chest) cavity from the abdominal cavity?',choices:['The rib cage','The diaphragm','The liver','The pericardium'],correct:1,instant:true,
     explain:'The diaphragm, a thin sheet of muscle just in front of the liver, divides the body cavity in two. The heart and lungs are in front of it; the digestive organs are behind it. It also powers breathing.'},
    {lvl:'bio',q:'Which tool should open the body wall of the pig?',choices:['A scalpel, pressed in deep','Dissecting scissors, tips lifted up','A blunt probe'],correct:1,instant:true,
     explain:'Scissors with the blunt blade inside, tips pointed up, cut only the body wall. A scalpel cuts everything under it, including the organs you want to see. A probe does not cut at all.'},
    {lvl:'honors',q:'The umbilical vein is a vein. What kind of blood did it carry?',choices:['Oxygen-poor blood, like every vein','Oxygen-rich blood, from the placenta toward the heart','No blood: it carried urine'],correct:1,instant:true,
     explain:'A vein is defined by direction, not oxygen: veins carry blood toward the heart. The umbilical vein brought oxygen-rich, nutrient-rich blood from the placenta. The umbilical arteries carried oxygen-poor blood away from the heart, out to the placenta.'},
    {lvl:'honors',q:'Which chamber of the heart has the thickest, most muscular wall?',choices:['Right atrium','Right ventricle','Left ventricle','Left atrium'],correct:2,
     baseline:{mode:'pig',step:'heart'},baselineAction:'auto',change:{part:'lv'},changeText:'Left ventricle highlighted',
     explain:'The left ventricle pumps blood through the aorta to the whole body, so it has the thickest wall and forms the pointed tip of the heart. The right ventricle only pumps to the nearby lungs.'},
    {lvl:'honors',q:'Urine leaves a kidney. Which tube carries it to the urinary bladder?',choices:['The urethra','The ureter','The vas deferens'],correct:1,
     baseline:{mode:'pig',step:'intest'},change:{part:'ureter'},changeText:'Ureters highlighted',
     explain:'Each kidney has a ureter that carries urine to the bladder. The urethra carries urine from the bladder out of the body. Remember: two ureters, one urethra.'},
    {lvl:'honors',q:'Both animals have a main nerve cord. Where does each run?',choices:['Dorsal (along the back) in both','Ventral in the grasshopper, dorsal in the pig','Dorsal in the grasshopper, ventral in the pig'],correct:1,
     baseline:{mode:'hopper',hstep:'hint'},change:{hpart:'ncord'},changeText:'Grasshopper nerve cord highlighted',
     explain:'The grasshopper’s nerve cord runs along its belly (ventral), with a tube heart along its back. The pig’s spinal cord runs along its back (dorsal), inside the vertebrae, with the heart below it.'},
    {lvl:'ap',q:'Before birth, how does most blood entering the right atrium avoid the fluid-filled lungs?',choices:['It cannot: all blood goes through the lungs','Through the foramen ovale into the left atrium, and through the ductus arteriosus into the aorta','Through the umbilical arteries back to the placenta'],correct:1,instant:true,
     explain:'Two shunts bypass the lungs. The foramen ovale lets blood pass from the right atrium to the left atrium. Blood that does reach the right ventricle and pulmonary artery mostly crosses into the aorta through the ductus arteriosus.'},
    {lvl:'ap',q:'Which vessel in the fetus carries the most oxygen-rich blood?',choices:['The aorta','The umbilical vein','The pulmonary artery','The umbilical arteries'],correct:1,
     baseline:{mode:'pig',step:'circ'},change:{part:'umbvein'},changeText:'Umbilical vein highlighted',
     explain:'Blood is richest in oxygen right after the placenta, in the umbilical vein. It mixes with oxygen-poor blood in the caudal vena cava and right atrium, so the aorta carries mixed blood. The umbilical arteries carry the most oxygen-poor blood.'},
    {lvl:'ap',q:'At birth the lungs fill with air. What happens to the foramen ovale and the ductus arteriosus?',choices:['They stay open for life','They close, so all blood now passes through the lungs','They become the pulmonary veins'],correct:1,instant:true,
     explain:'When the lungs inflate, pressure in the left atrium rises and pushes a flap shut over the foramen ovale. The ductus arteriosus constricts within days. If either stays open, some blood keeps skipping the lungs.'},
    {lvl:'ap',q:'Grasshopper blood carries very little oxygen. How do its cells get enough?',choices:['From the gizzard','Air tubes (tracheae) from the spiracles deliver air straight to the cells','Its heart beats much faster than a pig’s'],correct:1,instant:true,
     explain:'Insects breathe through spiracles that open into branching tracheae, which bring air right up to the cells. Their open circulation mainly carries food and wastes. Mammals instead load oxygen into the blood in the lungs.'}
  ],
  narrate(sim){const p=sim.p,s=sim.st;
    if(p.mode==='tools'){const T=TOOLS[p.tool];return T?'<b>'+T.n+':</b> '+T.u:'These are the tools of the trade. Click each one to learn <b>what it is, what it is for and how to hold it</b>.';}
    if(p.mode==='practical'){const pr=ensurePractical(sim),S=station(sim);if(s.score)return 'You scored <b>'+s.score.right+' of '+s.score.total+'</b>. Each miss below shows where that structure is and what it does.';
      return (S.ec?'The extra-credit tag. ':'Station '+(pr.stations.indexOf(S)+1)+(S.view==='heart'||S.view==='brain'?'. ':': a '+SEXN[S.sex]+' pig. '))+'Name each <b>tagged</b> structure below. Spelling does not have to be perfect.';}
    if(p.mode==='hopper'){if(p.hpart!=='none'&&H[p.hpart])return '<b>'+hName(p.hpart,p.sex)+':</b> '+sexTxt(H[p.hpart].fn,p.sex);
      if(p.hstep==='hcut'&&!s.hcut)return 'An insect has no bones inside: its skeleton is the outside. <b>Cut the exoskeleton lengthwise</b> to open it like a book.';
      if(p.hstep==='hcomp')return 'Same jobs, different solutions: the grasshopper has an <b>open</b> circulatory system and a <b>ventral</b> nerve cord; the pig has a <b>closed</b> system and a <b>dorsal</b> spinal cord.';
      return p.hstep==='hext'?'A grasshopper has <b>three body regions</b>: head, thorax and abdomen. All six legs and four wings attach to the thorax.':'Food passes <b>crop → gizzard → stomach → intestine → rectum</b>. The tube along the top is the heart.';}
    if(s.msg&&!s.msg.ok)return '<b>Not that way.</b> '+s.msg.t;
    if(p.part!=='none'&&P[p.part])return '<b>'+P[p.part].n+':</b> '+sexTxt(P[p.part].fn,p.sex);
    if(cutPending(sim)){const c=CUTS[s.cuts],H2={uvein:'Snip the umbilical vein, the blue vessel running from the cord to the liver, so the umbilical flap can fold back toward the tail.',
        chest:'Cut through the middle of the rib cage, keeping the scissor tips up so you do not cut the heart and lungs underneath.',peri:'The heart is wrapped in a thin sac, the pericardium. Choose the tool that lifts it, then snip it open.'};
      return '<b>'+c.n+'.</b> '+(H2[c.id]||'Pick the tool and where to cut. Cut from head to tail and keep the tips up, so only the body wall is cut.');}
    const N={ext:'Start outside. The <b>umbilical cord</b> connected this fetus to its mother’s placenta.',sex:sim.p.sex==='f'?'This is a <b>female</b>: the genital papilla and urogenital opening sit just below the anus.':'This is a <b>male</b>: his urogenital opening is just behind the umbilical cord.',
      tie:'Strings run under the tray from leg to leg, so the pig lies <b>ventral side up</b> and the belly stays open.',cut:'All five cuts are made. The belly wall is now loose flaps.',pin:'Flaps pinned and the umbilical flap folded back. The organs are in view.',
      five:'These organs sit in the <b>abdominal cavity</b>, behind the diaphragm. Click each one to learn its job.',liver:'With the liver lifted, the <b>gallbladder</b> on its underside and the <b>pancreas</b> come into view.',
      intest:'The kidneys lie <b>behind the lining</b> of the cavity, against the back wall. Follow each ureter to the bladder.',thorax:'The <b>thoracic cavity</b>: lungs on each side of the heart, the trachea running down the neck, and the diaphragm closing it off.',
      heart:atLeast('honors')?'Right side of the heart (pig’s right, bottom of the picture) receives blood from the body; the left side pumps it to the body through the <b>aorta</b>.':'The heart is a muscle. Its four chambers pump blood to the lungs and to the body.',
      brain:'The <b>cerebrum</b> is the large front part; the ridged <b>cerebellum</b> sits behind it.',circ:'Watch the blood: oxygen-rich from the placenta, it <b>skips the lungs</b> through two shunts before birth.'};
    return N[p.step]||'';},
  tour:[
    {title:'Tools of the trade',text:'Every dissection starts with the right tools. The dissecting scissors do almost all the cutting: the blunt blade goes inside so it does not stab the organs. Forceps lift, the probe separates, and pins hold the flaps open.',
     focus:[272,10,256,140],pause:true,setup(sim){BioLab.setValues(sim,{mode:'tools',tool:'dsc',names:true});}},
    {title:'Outside first',text:'Before cutting, find the external structures. The umbilical cord linked the fetus to the placenta. This female has a genital papilla and urogenital opening just below the anus. A male’s urogenital opening is just behind the cord instead.',
     focus:[[440,195,60,60],[630,200,80,50]],pause:true,setup(sim){BioLab.setValues(sim,{mode:'pig',step:'ext',sex:'f',part:'none'});}},
    {title:'Tie it down and cut',text:'Tie the legs so the pig lies ventral side up. Then make five cuts with the dissecting scissors, from head toward tail: down the midline, around the cord, behind the front legs, in front of the hind legs, and along the bottom of the ribs.',
     focus:[170,100,430,250],pause:true,setup(sim){BioLab.setValues(sim,{mode:'pig',step:'cut',part:'none'});sim.st.cuts=0;}},
    {title:'Open, pin and look',text:'Fold the flaps out and pin them, and cut the umbilical vein so the cord’s flap folds back. Without moving anything you can see five organs: the liver, stomach, spleen, small intestine and spiral large intestine.',
     focus:[340,110,350,240],pause:true,setup(sim){BioLab.setValues(sim,{mode:'pig',step:'five',part:'liver'});}},
    {title:'Lift the liver',text:'Lift the liver toward the head. The green gallbladder sits on its underside, and the pale, bumpy pancreas lies in the loop of the small intestine.',
     focus:[[290,240,70,60],[470,190,60,40]],pause:true,setup(sim){BioLab.setValues(sim,{step:'liver',part:'gall'});}},
    {title:'Move the intestines',text:'Push the intestines aside and pull the umbilical flap away. The kidneys lie against the back wall. Each ureter carries urine to the bladder, and the urethra carries it out. Here you also find the reproductive organs.',
     focus:[450,140,240,170],pause:true,setup(sim){BioLab.setValues(sim,{step:'intest',part:'kidney'});}},
    {title:{bio:'Open the chest',honors:'The heart and great vessels'},text:{bio:'Cut through the rib cage and pin it back. The lungs lie on each side of the heart, the trachea runs down the neck, and the diaphragm separates the chest from the abdomen.',
      honors:'Open the pericardium to see the heart. Blood from the body enters the right atrium through the venae cavae; the right ventricle pumps it into the pulmonary artery; the left ventricle pumps blood into the aorta, which curves into the aortic arch.'},
     focus:(sim)=>sim.p.step==='heart'?[250,80,360,290]:[160,120,210,210],pause:true,setup(sim){if(atLeast('honors')){BioLab.setValues(sim,{step:'heart',part:'lv'});sim.st.cuts=8;}else{BioLab.setValues(sim,{step:'thorax',part:'heart'});sim.st.cuts=7;}sim.st.msg=null;syncMode(sim);}},
    {lvl:'ap',title:'Fetal circulation',text:'Before birth the placenta does the lungs’ job. Oxygen-rich blood arrives in the umbilical vein, crosses the liver in the ductus venosus, and mostly skips the lungs through the foramen ovale and the ductus arteriosus. The umbilical arteries carry it back.',
     focus:[150,100,560,340],pause:true,setup(sim){BioLab.setValues(sim,{step:'circ',part:'none'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{part:'none'});},
  lab:{bio:'<p><b>Pre-lab:</b> Use this tool to complete the RJ Dissection Pre-Lab before you dissect.</p><ol><li><b>Tools:</b> in Tools mode, record each tool’s name, description, what it is used for and how to hold it. Include the operating scissors.</li><li><b>Pig:</b> list the 3 structures you can identify before cutting, how to tie the pig down, which tool and direction you cut with, the extra cuts for opening, where you pin, and the 5 organs you see without moving anything.</li><li><b>Grasshopper:</b> list 6 external structures, how and where to cut and pin, 8 internal organs, and 5 that differ from the pig.</li><li><b>Practical:</b> take the practical, press Check my answers, then Record trial to log your score. Repeat with New practical until you score 90% or better.</li></ol><p>Write one sentence for each organ system: which organs belong to it and what the system does.</p>',
       honors:'<p><b>Question:</b> How do the organ systems of the fetal pig work together?</p><ol><li>Find every structure on the RJ list (watch the counter). Switch specimens for the male and female organs.</li><li>Trace a bite of food from the esophagus to the rectum, naming each organ and the organs that add digestive juices.</li><li>Trace a drop of blood from the caudal vena cava through the heart to the aorta, naming each chamber and vessel.</li><li>Take the practical until you score 90% or better, recording each attempt as a trial.</li></ol><p>Explain why the diaphragm, the kidneys and the umbilical vessels are where they are.</p>',
       ap:'<p><b>Question:</b> Why does the fetal heart need shunts, and what happens to them at birth?</p><ol><li>In step 12, follow the blood from the placenta to the body and back, noting where oxygen-rich and oxygen-poor blood mix.</li><li>Compare the oxygen level in the umbilical vein, the right atrium, the aorta and the umbilical arteries.</li><li>Compare the grasshopper’s open circulation and tracheae with the pig’s closed circulation and lungs.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why the foramen ovale and the ductus arteriosus help the fetus, and predict what happens to a newborn if the ductus arteriosus stays open.</p>'},
  terms:[{t:'Ventral / dorsal',d:'The belly side / the back side. The pig is tied ventral side up.'},{t:'Anterior (cranial) / posterior (caudal)',d:'Toward the head / toward the tail.'},{t:'Lateral / medial',d:'Away from / toward the midline of the body.'},
    {t:'Thoracic cavity',d:'The chest cavity, holding the heart and lungs, in front of the diaphragm.'},{t:'Abdominal cavity',d:'The body cavity behind the diaphragm, holding the digestive, urinary and reproductive organs.'},{t:'Umbilical cord',d:'The link to the placenta: one umbilical vein and two umbilical arteries.'},
    {lvl:'honors',t:'Pericardium',d:'The thin sac around the heart.'},{lvl:'honors',t:'Mesentery',d:'Thin tissue that holds the intestines and carries their blood vessels.'},{lvl:'honors',t:'Peritoneum',d:'The lining of the abdominal cavity. The kidneys lie behind it.'},
    {lvl:'honors',t:'Open vs. closed circulation',d:'Insect blood flows loosely around the organs (open); mammal blood stays in vessels (closed).'},{lvl:'honors',t:'Exoskeleton',d:'An insect’s hard outer skeleton, made of chitin.'},
    {lvl:'ap',t:'Foramen ovale',d:'An opening between the fetal atria that lets blood skip the lungs.'},{lvl:'ap',t:'Ductus arteriosus',d:'A fetal vessel from the pulmonary artery to the aorta.'},{lvl:'ap',t:'Ductus venosus',d:'A fetal vessel through the liver from the umbilical vein to the caudal vena cava.'}],
  about:'<p>An original, simplified illustration of a near-term fetal pig, drawn to show the <b>relative position, size and connections</b> of each structure, not to copy a photograph or a published diagram. It is clinical and non-graphic on purpose: preserved-specimen colors, no blood. Vessels are colored as in a double-injected specimen (arteries red, veins blue), so the umbilical vein is blue even though it carries oxygen-rich blood.</p><p>Simplifications: organs are drawn flatter and more separated than in a real specimen, and only the main lobes of the liver and lungs are shown. Moving the intestines and folding the umbilical flap are shown as single steps. The kidneys, reproductive organs and urethra are drawn as you would see them after gently clearing tissue, and the male urethra’s path through the pelvis is simplified. The heart close-up is a separate, enlarged view, and the fetal circulation diagram is a schematic, not anatomy. The grasshopper is shown from the side, with the body wall cut along the back and pinned.</p><p>The cuts follow the standard sequence in most fetal pig guides: a midline cut from the throat, around the umbilical cord and back to the hind legs, lateral cuts behind the front legs, in front of the hind legs and along the base of the ribs, then the umbilical vein, the rib cage and the pericardium. Your teacher’s guide may number them differently. The practical draws about 20 random tags from the RJ structure list for your level (Big picture uses the shorter practical list), plus one extra-credit tag. Answers match spelling within one or two letters and accept common synonyms (for example oviduct, fallopian tube or uterine tube), but a different structure’s name, such as urethra for ureter, is marked wrong.</p>',
  onClick,draw,
  onLevel(sim){syncMode(sim);},
  thumbSetup(s){BioLab.setValues(s,{mode:'pig',step:'five'});}
};
DSX.controls.forEach(c=>{if(['mode','sex','step','hstep'].includes(c.id))c.onChange=sim=>{if(!sim.st)return;
  if(c.id==='step'){sim.st.cuts=START[sim.p.step]||0;sim.st.msg=null;sim.st.wrong=0;const r={};if(sim.p.part!=='none')r.part='none';if(sim.p.cutwith!=='none')r.cutwith='none';if(sim.p.path!=='none')r.path='none';if(Object.keys(r).length)BioLab.setValues(sim,r);}
  if(c.id==='hstep'){sim.st.hcut=sim.p.hstep!=='hext'&&sim.p.hstep!=='hcut';sim.st.msg=null;sim.st.wrong=0;const r={};if(sim.p.cutwith!=='none')r.cutwith='none';if(sim.p.hpath!=='none')r.hpath='none';if(Object.keys(r).length)BioLab.setValues(sim,r);}
  if(c.id==='mode'){sim.st.msg=null;}
  if(c.id==='sex'){const pt=P[sim.p.part];if(pt&&pt.sex&&pt.sex!==sim.p.sex)BioLab.setValues(sim,{part:'none'});}
  syncMode(sim);};});
DSX.controls.find(c=>c.id==='station').onChange=sim=>{if(sim.st)sim.st.flash=sim.st.flash;sim.infoDirty=true;};
BioLab.register(DSX);
})();
