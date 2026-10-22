(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;
const ALL=['animal','plant','bacterium'],EUK=['animal','plant'];
const CELLNAME={animal:'animal cell',plant:'plant cell',bacterium:'bacterium'};
/* ---- what each structure is ---- */
const PARTS={
  membrane:{n:'Cell membrane',in:ALL,job:'A thin, flexible boundary that controls what enters and leaves the cell.',an:'a security checkpoint at the door.',hon:'A phospholipid bilayer studded with proteins: channels, pumps and receptors.',ap:'Selectively permeable. Small nonpolar molecules diffuse straight through; ions and large polar molecules need transport proteins.'},
  wall:{n:'Cell wall',in:['plant','bacterium'],job:'A stiff layer outside the membrane that supports and protects the cell.',an:'the frame of a building.',hon:'Plant walls are made of cellulose. Bacterial walls are made of peptidoglycan.',ap:'The wall resists turgor pressure, so a plant cell in fresh water gets firm instead of bursting. Penicillin kills bacteria by blocking peptidoglycan synthesis.',
    absent:{animal:'Animal cells have no cell wall. That is why a red blood cell bursts in pure water.'}},
  capsule:{lvl:'honors',n:'Capsule',in:['bacterium'],job:'A sticky outer coat that helps some bacteria cling to surfaces and hide from immune cells.',an:'a slippery raincoat.',hon:'Usually made of polysaccharides. Not every bacterium has one.',ap:'Capsules help pathogens avoid being swallowed by white blood cells, so encapsulated strains are often more dangerous.',
    absent:{animal:'Only some bacteria have capsules.',plant:'Only some bacteria have capsules.'}},
  cytoplasm:{n:'Cytoplasm',in:ALL,job:'The jelly-like fluid that fills the cell and surrounds the organelles.',an:'the water in an aquarium that everything floats in.',hon:'Many reactions happen in the fluid part (cytosol), including glycolysis, the first step of cellular respiration.',ap:'Crowded with proteins: about 20–30% of the cytosol by volume is macromolecules.'},
  nucleus:{n:'Nucleus',in:EUK,job:'Holds the cell’s DNA and controls the cell’s activities.',an:'the main office that keeps the blueprints.',hon:'Wrapped in a double membrane, the nuclear envelope, with pores that let mRNA out.',ap:'Transcription and RNA processing happen here; translation happens outside, on ribosomes.',
    absent:{bacterium:'Bacteria are prokaryotes, so they have no nucleus. Their DNA sits in a region called the nucleoid.'}},
  nucleolus:{n:'Nucleolus',in:EUK,job:'A dense spot inside the nucleus that builds ribosomes.',an:'the factory that builds the factory machines.',hon:'Makes ribosomal RNA (rRNA) and assembles ribosome subunits.',ap:'It is not membrane-bound: it is a region of the nucleus where the rRNA genes cluster.',
    absent:{bacterium:'With no nucleus there is no nucleolus. Bacterial ribosomes are assembled in the cytoplasm.'}},
  roughER:{n:'Rough ER',in:EUK,job:'A folded membrane covered in ribosomes that builds proteins to be shipped out of the cell or put into membranes.',an:'an assembly line.',hon:'New proteins are threaded into the ER as they are made, folded, and sent on in vesicles.',ap:'Continuous with the nuclear envelope. Ribosomes attach here when the growing protein starts with an ER signal sequence.',
    absent:{bacterium:'Bacteria have no internal membranes, so no ER. Their proteins are made by free ribosomes.'}},
  smoothER:{n:'Smooth ER',in:EUK,job:'Makes lipids and breaks down some toxins.',an:'a workshop for oils, plus a cleanup crew.',hon:'Has no ribosomes. Makes phospholipids and steroid hormones; in liver cells it breaks down drugs.',ap:'Also stores calcium ions. Muscle cells release that calcium to trigger contraction.',
    absent:{bacterium:'Bacteria have no internal membranes, so no ER.'}},
  ribosome:{n:'Ribosomes',in:ALL,job:'Tiny machines that build proteins by reading mRNA.',an:'a 3D printer following instructions.',hon:'Found free in the cytoplasm or attached to rough ER. They are not wrapped in a membrane.',ap:'Bacterial ribosomes (70S) are smaller than ours (80S), so some antibiotics can block theirs without harming ours. Mitochondria have small, bacteria-like ribosomes too.'},
  golgi:{n:'Golgi apparatus',in:EUK,job:'Sorts, finishes and packages proteins, then ships them out in vesicles.',an:'a post office.',hon:'Proteins enter the side facing the ER (cis face) and leave from the far side (trans face), modified along the way, for example by adding sugars.',ap:'Adds molecular “address labels”, such as mannose-6-phosphate on proteins headed to lysosomes.',
    absent:{bacterium:'Bacteria have no Golgi apparatus.'}},
  mito:{n:'Mitochondrion',in:EUK,job:'Breaks down food molecules to make most of the cell’s ATP (cellular respiration).',an:'a power plant.',hon:'Has two membranes. The folded inner membrane (cristae) holds the electron transport chain.',ap:'Evidence that it was once a free-living bacterium (endosymbiosis): its own circular DNA, bacteria-like ribosomes, a double membrane, and it divides by splitting in two.',
    absent:{bacterium:'Bacteria have no mitochondria. They make ATP on their own cell membrane instead.'}},
  lysosome:{n:'Lysosome',in:['animal'],job:'A sac of digestive enzymes that breaks down worn-out parts, food particles and invaders.',an:'a recycling center.',hon:'Keeps its inside acidic (about pH 4.5), where its enzymes work best.',ap:'If one leaks, its enzymes barely work at the cytosol’s pH of about 7.2: a built-in safety feature.',
    absent:{plant:'Plant cells mostly use the central vacuole for this job.',bacterium:'Bacteria have no membrane-bound organelles, so no lysosomes.'}},
  vesicle:{n:'Vesicles',in:EUK,job:'Small bubbles of membrane that carry materials around the cell.',an:'delivery trucks.',hon:'They bud off the ER and Golgi, and fuse with the cell membrane to release their contents (exocytosis).',ap:'Motor proteins carry vesicles along microtubules, spending ATP with every step.',
    absent:{bacterium:'Bacteria have no internal transport vesicles.'}},
  centrosome:{lvl:'honors',n:'Centrosome',in:['animal'],job:'Organizes the microtubules that pull chromosomes apart when the cell divides.',an:'a tent stake that anchors the ropes.',hon:'Contains a pair of centrioles at right angles to each other.',ap:'Most plant cells lack centrioles but still build a spindle, which shows that centrioles are not required for mitosis.',
    absent:{plant:'Most plant cells have no centrioles.',bacterium:'Bacteria have no centrosome.'}},
  cytoskeleton:{lvl:'honors',n:'Cytoskeleton',in:EUK,job:'A network of protein fibers that gives the cell its shape and moves things around inside it.',an:'scaffolding plus a rail network.',hon:'Made of microtubules, actin filaments and intermediate filaments.',ap:'Microtubules grow out from the centrosome and act as tracks for motor proteins such as kinesin and dynein.',
    absent:{bacterium:'Bacteria have simpler, related proteins, but not a true cytoskeleton like this.'}},
  vacuole:{n:'Central vacuole',in:['plant'],job:'A large sac that stores water and keeps the plant cell firm.',an:'a water balloon pressing outward.',hon:'Surrounded by its own membrane, the tonoplast. It can fill up to 90% of the cell.',ap:'Water entering the vacuole creates turgor pressure against the wall (ψp > 0).',
    absent:{animal:'Animal cells have only small vacuoles, not one big central vacuole.',bacterium:'Bacteria have no central vacuole.'}},
  chloroplast:{n:'Chloroplast',in:['plant'],job:'Captures light energy to make sugar (photosynthesis).',an:'a solar panel attached to a sugar factory.',hon:'Stacks of thylakoid disks (grana) hold the chlorophyll. The fluid around them (stroma) runs the Calvin cycle.',ap:'Evidence of endosymbiosis: a double membrane, its own circular DNA and ribosomes, and it divides on its own.',
    absent:{animal:'Animals get their energy by eating, not photosynthesis, so they have no chloroplasts.',bacterium:'This bacterium has no chloroplasts, though some bacteria (cyanobacteria) photosynthesize using their membranes.'}},
  plasmodesmata:{lvl:'ap',n:'Plasmodesmata',in:['plant'],job:'Channels through the cell wall that connect the cytoplasm of neighboring plant cells.',an:'doorways between rooms.',hon:'They let water, sugars and signals pass directly from cell to cell.',ap:'Similar in function to gap junctions in animal cells.',
    absent:{animal:'Animal cells use gap junctions instead.',bacterium:'Bacteria are single cells and have no plasmodesmata.'}},
  nucleoid:{n:'Nucleoid',in:['bacterium'],job:'The region where a bacterium’s single circular chromosome sits. It is not wrapped in a membrane.',an:'blueprints kept on an open desk instead of in an office.',hon:'Prokaryotes have no nucleus, so DNA is in direct contact with the cytoplasm.',ap:'Because there is no nuclear membrane, bacteria can start translating an mRNA while it is still being transcribed.',
    absent:{animal:'Eukaryotic cells keep their DNA inside a nucleus instead.',plant:'Eukaryotic cells keep their DNA inside a nucleus instead.'}},
  plasmid:{lvl:'honors',n:'Plasmid',in:['bacterium'],job:'A small extra ring of DNA that carries a few useful genes, such as antibiotic resistance.',an:'a pocket guide of bonus instructions.',hon:'Bacteria can pass plasmids to each other, spreading genes such as antibiotic resistance.',ap:'Scientists use plasmids to insert genes into bacteria. This is how human insulin is made.',
    absent:{animal:'Plasmids are found in bacteria (and some yeasts), not in animal or plant cells.',plant:'Plasmids are found in bacteria (and some yeasts), not in animal or plant cells.'}},
  flagellum:{n:'Flagellum',in:['bacterium'],job:'A whip-like tail that spins like a propeller to push the cell through liquid.',an:'a boat’s propeller.',hon:'Driven by a rotary motor in the membrane, powered by a flow of H⁺ ions.',ap:'The bacterial flagellar motor can spin more than 100 times per second.',
    absent:{animal:'Some animal cells, like sperm, have a flagellum, but it is built differently and whips instead of spinning.',plant:'Most plant cells have no flagellum.'}},
  pili:{lvl:'honors',n:'Pili',in:['bacterium'],job:'Short hair-like threads that help a bacterium stick to surfaces and to other bacteria.',an:'grappling hooks.',hon:'Special sex pili connect two bacteria so one can pass a plasmid to the other (conjugation).',ap:'Pili help pathogens attach to host tissues, a first step in infection.',
    absent:{animal:'Pili are found on bacteria.',plant:'Pili are found on bacteria.'}}
};
const ORDER=['membrane','wall','capsule','cytoplasm','nucleus','nucleolus','nucleoid','ribosome','roughER','smoothER','golgi','vesicle','mito','chloroplast','vacuole','lysosome','centrosome','cytoskeleton','plasmid','flagellum','pili','plasmodesmata'];
const HIT=['plasmid','nucleolus','centrosome','vesicle','lysosome','mito','chloroplast','golgi','smoothER','roughER','plasmodesmata','flagellum','pili','ribosome','nucleoid','nucleus','vacuole','membrane','wall','capsule','cytoplasm'];
const CELLS={animal:{name:'Animal cell',size:'about 20 µm across',bar:135,barL:'5 µm',kind:'Eukaryote'},
             plant:{name:'Plant cell',size:'about 50 µm across',bar:112,barL:'10 µm',kind:'Eukaryote'},
             bacterium:{name:'Bacterium',size:'about 2 µm long',bar:109,barL:'0.5 µm',kind:'Prokaryote'}};
/* ---- geometry ---- */
const ACX=320,ACY=225,ARX=268,ARY=192;
const memR=a=>1+0.035*Math.sin(3*a+0.6)+0.025*Math.sin(5*a+1.3);
function aNorm(x,y){const nx=(x-ACX)/ARX,ny=(y-ACY)/ARY,a=Math.atan2(ny,nx);return Math.hypot(nx,ny)/memR(a);}
function memPt(a,scale){const r=memR(a)*(scale||1);return [ACX+Math.cos(a)*ARX*r,ACY+Math.sin(a)*ARY*r];}
function inRR(px,py,x,y,w,h,r){if(px<x||px>x+w||py<y||py>y+h)return false;const dx=Math.max(x+r-px,0,px-(x+w-r)),dy=Math.max(y+r-py,0,py-(y+h-r));return dx*dx+dy*dy<=r*r;}
function segD(px,py,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy||1;const t=clamp(((px-a[0])*dx+(py-a[1])*dy)/L,0,1);return Math.hypot(px-a[0]-t*dx,py-a[1]-t*dy);}
const PW={o:[40,25,560,400,18],th:12};                                // plant wall
const BR={cap:[100,140,460,170,85],wall:[112,152,436,146,73]};        // bacterium rod
const PPATH=[182,52,396,346,78];                                      // plant chloroplast streaming loop
function rrPoint(x,y,w,h,r,u){const sw=w-2*r,sh=h-2*r,arc=Math.PI*r/2,P=2*sw+2*sh+4*arc;let d=((u%1)+1)%1*P;
  const seg=[[sw,(d)=>[x+r+d,y,0]],[arc,(d)=>{const a=-Math.PI/2+d/r;return [x+w-r+Math.cos(a)*r,y+r+Math.sin(a)*r,a+Math.PI/2];}],[sh,(d)=>[x+w,y+r+d,Math.PI/2]],[arc,(d)=>{const a=d/r;return [x+w-r+Math.cos(a)*r,y+h-r+Math.sin(a)*r,a+Math.PI/2];}],
    [sw,(d)=>[x+w-r-d,y+h,Math.PI]],[arc,(d)=>{const a=Math.PI/2+d/r;return [x+r+Math.cos(a)*r,y+h-r+Math.sin(a)*r,a+Math.PI/2];}],[sh,(d)=>[x,y+h-r-d,-Math.PI/2]],[arc,(d)=>{const a=Math.PI+d/r;return [x+r+Math.cos(a)*r,y+r+Math.sin(a)*r,a+Math.PI/2];}]];
  for(const s of seg){if(d<=s[0])return s[1](d);d-=s[0];}return [x+r,y,0];}
function staticGeom(cell){const r=rng(cell==='animal'?3:cell==='plant'?4:5),G={sh:{},an:{}};const add=(p,s)=>{(G.sh[p]=G.sh[p]||[]).push(s);};
  if(cell==='animal'){
    add('nucleus',{k:'e',x:230,y:210,rx:80,ry:70,r:0});add('nucleolus',{k:'c',x:212,y:198,r:22});
    add('roughER',{k:'ring',x:230,y:210,r1:90,r2:130,a1:-1.15,a2:1.15});
    add('smoothER',{k:'pl',w:9,pts:[[250,345],[280,358],[305,348],[330,360],[358,350]]});add('smoothER',{k:'pl',w:9,pts:[[258,372],[286,382],[314,374]]});
    add('golgi',{k:'rect',x:388,y:122,w:88,h:64,r:10});
    [[480,262,0.9],[150,330,-0.3],[200,96,0.15],[380,378,0.1],[545,195,-1.25]].forEach(m=>add('mito',{k:'e',x:m[0],y:m[1],rx:27,ry:12,r:m[2]}));
    add('lysosome',{k:'c',x:432,y:335,r:11});add('lysosome',{k:'c',x:98,y:250,r:10});
    add('centrosome',{k:'c',x:400,y:262,r:14});add('membrane',{k:'mem'});add('cytoplasm',{k:'inside'});
    const dots=[];let n=0;while(dots.length<70&&n<5000){n++;const x=70+r()*520,y=40+r()*370;const a=aNorm(x,y);if(a>0.92)continue;if(((x-230)/100)**2+((y-210)/90)**2<1)continue;if(Math.hypot(x-230,y-210)<140&&Math.abs(Math.atan2(y-210,x-230))<1.2)continue;if(x>380&&x<480&&y>115&&y<190)continue;dots.push([x,y,r()*6.28]);}
    G.free=dots;
    const er=[];[97,110,123].forEach(R=>{for(let a=-1.1;a<=1.1;a+=0.12)er.push([230+Math.cos(a)*(R+4.5),210+Math.sin(a)*(R+4.5)]);});G.erRib=er;
    G.an={nucleus:[230,150],nucleolus:[212,198],roughER:[352,230],smoothER:[305,352],golgi:[432,128],mito:[480,262],lysosome:[432,335],centrosome:[400,262],membrane:[208,402],cytoplasm:[525,345],ribosome:[0,0],cytoskeleton:[560,292]};
  }else if(cell==='plant'){
    add('nucleus',{k:'e',x:105,y:215,rx:52,ry:48,r:0});add('nucleolus',{k:'c',x:98,y:208,r:15});
    add('roughER',{k:'ring',x:105,y:215,r1:56,r2:76,a1:0.5,a2:2.15});
    add('golgi',{k:'rect',x:95,y:316,w:70,h:48,r:8});add('smoothER',{k:'pl',w:9,pts:[[68,386],[93,396],[118,388],[143,398]]});
    [[80,95,0.4],[150,70,-0.2],[160,390,0.3],[70,140,1.2]].forEach(m=>add('mito',{k:'e',x:m[0],y:m[1],rx:22,ry:10,r:m[2]}));
    add('vacuole',{k:'rect',x:200,y:70,w:360,h:310,r:60});
    [[40,140,0],[40,322,0],[320,25,1],[600,210,0],[470,425,1]].forEach(q=>add('plasmodesmata',{k:'c',x:q[0],y:q[1],r:8,vert:q[2]}));
    add('wall',{k:'band',x:40,y:25,w:560,h:400,r:18,th:12});add('membrane',{k:'band',x:52,y:37,w:536,h:376,r:10,th:6});add('cytoplasm',{k:'inside'});
    const dots=[];let n=0;while(dots.length<45&&n<5000){n++;const x=60+r()*525,y=45+r()*360;if(inRR(x,y,195,65,370,320,64))continue;if(((x-105)/62)**2+((y-215)/58)**2<1)continue;if(Math.hypot(x-105,y-215)<84&&y>215)continue;dots.push([x,y,r()*6.28]);}
    G.free=dots;const er=[];[60,68,76].forEach(R=>{for(let a=0.55;a<=2.1;a+=0.16)er.push([105+Math.cos(a)*(R+4),215+Math.sin(a)*(R+4)]);});G.erRib=er;
    G.an={nucleus:[105,167],nucleolus:[98,208],roughER:[105,288],golgi:[130,318],smoothER:[105,392],mito:[150,70],vacuole:[380,225],wall:[600,110],membrane:[580,300],plasmodesmata:[40,140],cytoplasm:[120,120],ribosome:[0,0],vesicle:[0,0],chloroplast:[0,0],cytoskeleton:[150,140]};
  }else{
    add('capsule',{k:'band',x:100,y:140,w:460,h:170,r:85,th:12});add('wall',{k:'band',x:112,y:152,w:436,h:146,r:73,th:8});add('membrane',{k:'band',x:120,y:160,w:420,h:130,r:65,th:5});
    add('nucleoid',{k:'e',x:320,y:225,rx:95,ry:40,r:0});add('plasmid',{k:'c',x:195,y:196,r:11});add('plasmid',{k:'c',x:458,y:258,r:9});add('cytoplasm',{k:'inside'});
    const dots=[];let n=0;while(dots.length<75&&n<5000){n++;const x=130+r()*400,y=165+r()*120;if(!inRR(x,y,128,168,404,114,57))continue;if(((x-320)/105)**2+((y-225)/48)**2<1)continue;if(Math.hypot(x-195,y-196)<18||Math.hypot(x-458,y-258)<16)continue;dots.push([x,y,r()*6.28]);}
    G.free=dots;const nl=[];for(let i=0;i<140;i++){const a=i/140*6.283*3;nl.push([320+Math.cos(a)*(60+30*Math.sin(a*2.3))+Math.sin(a*5)*12,225+Math.sin(a*1.03)*(26+8*Math.cos(a*3.1))]);}G.nucl=nl;
    const pili=[];for(let i=0;i<14;i++){const u=i/14+0.02,pt=rrPoint(112,152,436,146,73,u);const nx=Math.cos(pt[2]-Math.PI/2),ny=Math.sin(pt[2]-Math.PI/2);if(pt[0]>530&&Math.abs(pt[1]-225)<30)continue;pili.push([[pt[0],pt[1]],[pt[0]+nx*26,pt[1]+ny*26]]);add('pili',{k:'pl',w:4,pts:pili[pili.length-1]});}G.pili=pili;
    G.an={capsule:[330,142],wall:[200,153],membrane:[300,163],nucleoid:[320,190],plasmid:[195,196],cytoplasm:[480,200],ribosome:[0,0],flagellum:[640,225],pili:[0,0]};
  }
  return G;}
const GEOM={};function geom(cell){return GEOM[cell]||(GEOM[cell]=staticGeom(cell));}
/* dynamic shapes (vesicles, streaming chloroplasts, flagellum) for the current frame */
function dynamic(sim,cell,t){const G=geom(cell),D={sh:{},an:{}},add=(p,s)=>{(D.sh[p]=D.sh[p]||[]).push(s);};const mv=RM?0:1;
  const ribs=G.free.map((d,i)=>[d[0]+Math.sin(t*0.5+d[2])*3*mv,d[1]+Math.cos(t*0.4+d[2])*3*mv]);
  add('ribosome',{k:'dots',pts:ribs.concat(G.erRib),r:2.6});D.an.ribosome=ribs[3];
  if(cell==='animal'){const ves=[];const ends=[-0.9,-0.45,0.05,-1.35];
    for(let i=0;i<4;i++){const u=((t*0.09*mv+i/4)%1+1)%1,e=memPt(ends[i],0.95),x=474+(e[0]-474)*u,y=150+(e[1]-150)*u;ves.push([x,y,u>0.92?7*(1-(u-0.92)/0.08):7]);}
    for(let i=0;i<2;i++){const u=((t*0.13*mv+i/2)%1+1)%1;ves.push([362+(392-362)*u,150+(168-150)*u+Math.sin(u*3.14)*-10,6]);}
    ves.forEach(v=>add('vesicle',{k:'c',x:v[0],y:v[1],r:v[2]}));D.an.vesicle=[525,118];D.ves=ves;}
  else if(cell==='plant'){const ch=[];for(let i=0;i<9;i++){const pt=rrPoint(PPATH[0],PPATH[1],PPATH[2],PPATH[3],PPATH[4],i/9+t*0.012*mv);ch.push(pt);add('chloroplast',{k:'e',x:pt[0],y:pt[1],rx:24,ry:12,r:pt[2]});}
    D.an.chloroplast=[ch[1][0],ch[1][1]];D.chl=ch;const ves=[];for(let i=0;i<3;i++){const u=((t*0.1*mv+i/3)%1+1)%1;ves.push([165+u*15,330-u*40+Math.sin(i)*10,6]);}ves.forEach(v=>add('vesicle',{k:'c',x:v[0],y:v[1],r:v[2]}));D.an.vesicle=[215,296];D.ves=ves;}
  else{const pts=[];for(let x=548;x<=788;x+=6){const f=Math.min(1,(x-548)/40);pts.push([x,225+14*Math.sin((x-548)/22-t*6*mv)*f]);}add('flagellum',{k:'pl',w:6,pts});D.fl=pts;D.an.pili=G.pili[2][1];}
  D.ribs=ribs;return D;}
function shapesOf(sim,part){const cell=sim.p.cell,G=geom(cell),D=sim.vis.dyn||{sh:{}};return (G.sh[part]||[]).concat(D.sh[part]||[]);}
function anchorOf(sim,part){const G=geom(sim.p.cell),D=sim.vis.dyn||{an:{}};return (D.an&&D.an[part])||G.an[part]||[320,225];}
function insideCell(cell,x,y){if(cell==='animal')return aNorm(x,y)<1;if(cell==='plant')return inRR(x,y,52,37,536,376,10);return inRR(x,y,112,152,436,146,73);}
function hitShape(sim,s,x,y){switch(s.k){
  case 'e':{const dx=x-s.x,dy=y-s.y,c=Math.cos(s.r),sn=Math.sin(s.r),u=(dx*c+dy*sn)/(s.rx+4),v=(-dx*sn+dy*c)/(s.ry+4);return u*u+v*v<=1;}
  case 'c':return Math.hypot(x-s.x,y-s.y)<=s.r+5;
  case 'ring':{const d=Math.hypot(x-s.x,y-s.y),a=Math.atan2(y-s.y,x-s.x);return d>=s.r1-3&&d<=s.r2+3&&a>=s.a1&&a<=s.a2;}
  case 'pl':{for(let i=1;i<s.pts.length;i++)if(segD(x,y,s.pts[i-1],s.pts[i])<=s.w/2+5)return true;return false;}
  case 'dots':return s.pts.some(p=>Math.hypot(x-p[0],y-p[1])<=s.r+4);
  case 'rect':return inRR(x,y,s.x,s.y,s.w,s.h,s.r);
  case 'band':return inRR(x,y,s.x-3,s.y-3,s.w+6,s.h+6,s.r+3)&&!inRR(x,y,s.x+s.th+3,s.y+s.th+3,s.w-2*s.th-6,s.h-2*s.th-6,Math.max(1,s.r-s.th-3));
  case 'mem':return Math.abs(aNorm(x,y)-1)<0.04;
  case 'inside':return insideCell(sim.p.cell,x,y);}return false;}
function partAvailable(id){return atLeast(PARTS[id].lvl);}
/* ---- outline a part (selection or quiz target) ---- */
function outline(ctx,sim,part,color,dash,pulse){const sh=shapesOf(sim,part);if(!sh.length)return;ctx.save();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.setLineDash(dash?[7,5]:[]);ctx.lineDashOffset=-pulse*20;ctx.shadowColor=color;ctx.shadowBlur=8;
  sh.forEach(s=>{ctx.beginPath();switch(s.k){
    case 'e':ctx.ellipse(s.x,s.y,s.rx+5,s.ry+5,s.r,0,6.29);break;
    case 'c':ctx.arc(s.x,s.y,s.r+5,0,6.29);break;
    case 'ring':ctx.arc(s.x,s.y,s.r2+5,s.a1,s.a2);ctx.arc(s.x,s.y,s.r1-5,s.a2,s.a1,true);ctx.closePath();break;
    case 'pl':ctx.lineWidth=s.w+8;ctx.globalAlpha=0.35;s.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.globalAlpha=1;ctx.lineWidth=3;ctx.beginPath();s.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));break;
    case 'dots':s.pts.forEach(p=>{ctx.moveTo(p[0]+s.r+4,p[1]);ctx.arc(p[0],p[1],s.r+4,0,6.29);});ctx.lineWidth=2;break;
    case 'rect':rr(ctx,s.x-5,s.y-5,s.w+10,s.h+10,s.r+5);break;
    case 'band':rr(ctx,s.x-3,s.y-3,s.w+6,s.h+6,s.r+3);ctx.stroke();ctx.beginPath();rr(ctx,s.x+s.th+3,s.y+s.th+3,s.w-2*s.th-6,s.h-2*s.th-6,Math.max(1,s.r-s.th-3));break;
    case 'mem':for(let i=0;i<=90;i++){const a=i/90*6.283,p=memPt(a);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}ctx.closePath();ctx.lineWidth=10;ctx.globalAlpha=0.4;ctx.stroke();ctx.globalAlpha=1;ctx.lineWidth=3;break;
    case 'inside':return;}ctx.stroke();});
  ctx.restore();}
/* ---- drawing each cell ---- */
const COL={nuc:'#8a6cc0',env:'#5e4592',chrom:'#6d52a6',nucleolus:'#4b3480',rer:'#d9778c',rib:'#4b3d8f',ser:'#e6a3b0',golgi:'#e0a33a',mito:'#e2725b',mitoE:'#9e3d2c',crist:'#f6b9a6',lys:'#7fae4e',lysE:'#4f7d24',ves:'#e8b04a',cen:'#4f6fb3',mem:'#c9902a',wallP:'#7a9a3a',wallB:'#a07a3a',vac:'#9fd0ea',vacE:'#5f9fc0',chl:'#3f9a3f',gran:'#1f6b21',cap:'rgba(150,130,200,0.28)',plas:'#8a5bd0',flag:'#a07a3a'};
function drawMito(ctx,x,y,rx,ry,r){ctx.save();ctx.translate(x,y);ctx.rotate(r);ctx.fillStyle=COL.mito;ctx.strokeStyle=COL.mitoE;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,6.29);ctx.fill();ctx.stroke();
  ctx.strokeStyle=COL.crist;ctx.lineWidth=2;ctx.beginPath();for(let i=-3;i<=3;i++){const xx=i*rx/4.2;ctx.moveTo(xx,-ry*0.75);ctx.quadraticCurveTo(xx+5,0,xx,ry*0.75);}ctx.stroke();ctx.restore();}
function drawNucleus(ctx,x,y,rx,ry,t,nlx,nly,nlr){ctx.fillStyle=COL.nuc;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,6.29);ctx.fill();ctx.strokeStyle=COL.env;ctx.lineWidth=3;ctx.stroke();ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y,rx-4,ry-4,0,0,6.29);ctx.stroke();
  ctx.fillStyle=PAL['cv-ims'];for(let i=0;i<10;i++){const a=i/10*6.283+0.2;ctx.beginPath();ctx.arc(x+Math.cos(a)*(rx-2),y+Math.sin(a)*(ry-2),2.2,0,6.29);ctx.fill();}
  ctx.strokeStyle=COL.chrom;ctx.lineWidth=1.6;ctx.globalAlpha=.8;ctx.beginPath();for(let i=0;i<5;i++){let px=x-rx*0.6+i*rx*0.28,py=y-ry*0.4;ctx.moveTo(px,py);for(let j=0;j<6;j++){px+=Math.sin(i*2+j)*rx*0.12;py+=ry*0.15;ctx.lineTo(px,py);}}ctx.stroke();ctx.globalAlpha=1;
  ctx.fillStyle=COL.nucleolus;ctx.beginPath();ctx.arc(nlx,nly,nlr,0,6.29);ctx.fill();}
function drawGolgi(ctx,x0,y0,n,w,gap){ctx.strokeStyle=COL.golgi;ctx.lineCap='round';for(let i=0;i<n;i++){ctx.lineWidth=7-i*0.6;ctx.beginPath();const y=y0+i*gap,ww=w-Math.abs(i-2)*8;ctx.moveTo(x0+(w-ww)/2,y);ctx.quadraticCurveTo(x0+w/2,y-16,x0+(w+ww)/2,y);ctx.stroke();}ctx.lineCap='butt';}
function drawAnimal(ctx,sim,D,t,hon){const G=geom('animal'),mv=RM?0:1;
  ctx.beginPath();for(let i=0;i<=120;i++){const a=i/120*6.283,p=memPt(a,1+0.004*Math.sin(t*0.8)*mv);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}ctx.closePath();
  ctx.fillStyle=PAL['cv-ims'];ctx.fill();ctx.strokeStyle=COL.mem;ctx.lineWidth=5;ctx.stroke();
  if(hon){ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=0.22;ctx.lineWidth=1.3;ctx.beginPath();for(let i=0;i<14;i++){const a=i/14*6.283,e=memPt(a,0.97);ctx.moveTo(400,262);ctx.quadraticCurveTo((400+e[0])/2+Math.sin(i)*20,(262+e[1])/2+Math.cos(i)*20,e[0],e[1]);}ctx.stroke();ctx.globalAlpha=1;}
  // rough ER arcs
  ctx.strokeStyle=COL.rer;ctx.lineWidth=7;ctx.lineCap='round';[97,110,123].forEach(R=>{ctx.beginPath();ctx.arc(230,210,R,-1.1,1.1);ctx.stroke();});ctx.lineCap='butt';
  ctx.fillStyle=PAL['cv-inn'];G.erRib.forEach(p=>{ctx.beginPath();ctx.arc(p[0],p[1],2.2,0,6.29);ctx.fill();});
  drawNucleus(ctx,230,210,80,70,t,212,198,22);
  ctx.strokeStyle=COL.ser;ctx.lineWidth=8;ctx.lineCap='round';ctx.lineJoin='round';geom('animal').sh.smoothER.forEach(s=>{ctx.beginPath();s.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();});ctx.lineCap='butt';
  drawGolgi(ctx,392,148,5,80,8);
  G.sh.mito.forEach((m,i)=>drawMito(ctx,m.x,m.y,m.rx,m.ry,m.r+0.05*Math.sin(t*0.7+i)*mv));
  G.sh.lysosome.forEach(l=>{ctx.fillStyle=COL.lys;ctx.strokeStyle=COL.lysE;ctx.lineWidth=2;ctx.beginPath();ctx.arc(l.x,l.y,l.r,0,6.29);ctx.fill();ctx.stroke();ctx.fillStyle=COL.lysE;for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(l.x+Math.cos(i*1.6)*l.r*0.45,l.y+Math.sin(i*1.6)*l.r*0.45,1.6,0,6.29);ctx.fill();}});
  ctx.save();ctx.translate(400,262);ctx.fillStyle=COL.cen;ctx.rotate(0.3);rr(ctx,-11,-4,16,8,3);ctx.fill();ctx.rotate(Math.PI/2);rr(ctx,-2,-4,16,8,3);ctx.fill();ctx.restore();
  D.ves.forEach(v=>{if(v[2]<=0.5)return;ctx.fillStyle=COL.ves;ctx.strokeStyle='#b07a1a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(v[0],v[1],v[2],0,6.29);ctx.fill();ctx.stroke();});
  ctx.fillStyle=PAL['cv-inn'];D.ribs.forEach(p=>{ctx.beginPath();ctx.arc(p[0],p[1],2.6,0,6.29);ctx.fill();});}
function drawPlant(ctx,sim,D,t,hon,ap){const G=geom('plant');
  ctx.fillStyle=COL.wallP;rr(ctx,40,25,560,400,18);ctx.fill();ctx.fillStyle=PAL['cv-ims'];rr(ctx,52,37,536,376,10);ctx.fill();ctx.strokeStyle=COL.mem;ctx.lineWidth=3;rr(ctx,54,39,532,372,9);ctx.stroke();
  if(ap){ctx.strokeStyle=PAL['cv-ims'];ctx.lineWidth=5;G.sh.plasmodesmata.forEach(q=>{ctx.beginPath();if(q.vert){ctx.moveTo(q.x,q.y-8);ctx.lineTo(q.x,q.y+8);}else{ctx.moveTo(q.x-8,q.y);ctx.lineTo(q.x+8,q.y);}ctx.stroke();});}
  ctx.fillStyle=COL.vac;rr(ctx,200,70,360,310,60);ctx.fill();ctx.strokeStyle=COL.vacE;ctx.lineWidth=2.5;ctx.stroke();
  ctx.strokeStyle=COL.rer;ctx.lineWidth=6;ctx.lineCap='round';[60,68,76].forEach(R=>{ctx.beginPath();ctx.arc(105,215,R,0.55,2.1);ctx.stroke();});ctx.lineCap='butt';
  ctx.fillStyle=PAL['cv-inn'];G.erRib.forEach(p=>{ctx.beginPath();ctx.arc(p[0],p[1],2,0,6.29);ctx.fill();});
  drawNucleus(ctx,105,215,52,48,t,98,208,15);
  drawGolgi(ctx,98,338,4,64,7);
  ctx.strokeStyle=COL.ser;ctx.lineWidth=8;ctx.lineCap='round';ctx.lineJoin='round';G.sh.smoothER.forEach(s=>{ctx.beginPath();s.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();});ctx.lineCap='butt';
  G.sh.mito.forEach((m,i)=>drawMito(ctx,m.x,m.y,m.rx,m.ry,m.r));
  D.chl.forEach(c=>{ctx.save();ctx.translate(c[0],c[1]);ctx.rotate(c[2]);ctx.fillStyle=COL.chl;ctx.strokeStyle=COL.gran;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,24,12,0,0,6.29);ctx.fill();ctx.stroke();
    ctx.fillStyle=COL.gran;for(let i=-2;i<=2;i++){ctx.fillRect(i*8-3,-5,6,10);}ctx.restore();});
  D.ves.forEach(v=>{ctx.fillStyle=COL.ves;ctx.beginPath();ctx.arc(v[0],v[1],v[2],0,6.29);ctx.fill();});
  ctx.fillStyle=PAL['cv-inn'];D.ribs.forEach(p=>{ctx.beginPath();ctx.arc(p[0],p[1],2.4,0,6.29);ctx.fill();});}
function drawBacterium(ctx,sim,D,t,hon){const G=geom('bacterium');
  if(hon){ctx.fillStyle=COL.cap;rr(ctx,100,140,460,170,85);ctx.fill();}
  ctx.strokeStyle=COL.flag;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();D.fl.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
  if(hon){ctx.strokeStyle='#b08a4a';ctx.lineWidth=2.5;G.pili.forEach(pl=>{ctx.beginPath();ctx.moveTo(pl[0][0],pl[0][1]);ctx.lineTo(pl[1][0],pl[1][1]);ctx.stroke();});}ctx.lineCap='butt';
  ctx.fillStyle=COL.wallB;rr(ctx,112,152,436,146,73);ctx.fill();ctx.fillStyle=PAL['cv-ims'];rr(ctx,120,160,420,130,65);ctx.fill();ctx.strokeStyle=COL.mem;ctx.lineWidth=3;rr(ctx,122,162,416,126,63);ctx.stroke();
  ctx.strokeStyle=COL.chrom;ctx.lineWidth=2;ctx.beginPath();G.nucl.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.stroke();
  if(hon){ctx.strokeStyle=COL.plas;ctx.lineWidth=3;G.sh.plasmid.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.r-2,0,6.29);ctx.stroke();});}
  ctx.fillStyle=PAL['cv-inn'];D.ribs.forEach(p=>{ctx.beginPath();ctx.arc(p[0],p[1],2.6,0,6.29);ctx.fill();});}
/* ---- protein journey for the walkthrough (animal cell) ---- */
function drawTrip(ctx,sim,k){const tr=sim.st.trip;if(!tr||!sim.tour||!sim.tour.on)return;const u=(((sim.vt-tr.t0)/3.2)%1+1)%1;
  const bead=(x,y,c)=>{ctx.fillStyle=c||PAL['s4'];ctx.beginPath();ctx.arc(x,y,4,0,6.29);ctx.fill();ctx.strokeStyle='#7a4a00';ctx.lineWidth=1;ctx.stroke();};
  const mrna=(x,y,len,ang)=>{ctx.strokeStyle='#ff8a1f';ctx.lineWidth=3.5;ctx.beginPath();for(let i=0;i<=12;i++){const d=i/12*len;const px=x-Math.cos(ang)*d+Math.sin(i*1.4)*2*Math.sin(ang),py=y-Math.sin(ang)*d+Math.sin(i*1.4)*2*Math.cos(ang);i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();};
  const vesicle=(x,y,r,n)=>{ctx.fillStyle='rgba(232,176,74,0.9)';ctx.strokeStyle='#8a5a00';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();ctx.stroke();for(let i=0;i<n;i++)bead(x+Math.cos(i*2.1)*r*0.4,y+Math.sin(i*2.1)*r*0.4,'#ff6b3d');};
  const lerp2=(a,b,q)=>[a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q];
  switch(tr.k){
    case 'gene':{ctx.strokeStyle='#ffd23f';ctx.lineWidth=4;ctx.beginPath();for(let i=0;i<=20;i++){const x=200+i*3.5,y=228+Math.sin(i*0.9)*5;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
      mrna(200+u*70,222,u*70,0);pill(ctx,'gene → mRNA',235,250,'#ffd23f','#2a2000',12*k);break;}
    case 'mrna':{const path=[[250,215],[310,210],[345,192]],q=u<0.6?u/0.6:1,p=q<0.5?lerp2(path[0],path[1],q*2):lerp2(path[1],path[2],(q-0.5)*2);mrna(p[0],p[1],34,q<0.5?0:-0.5);pill(ctx,'mRNA',p[0]-10,p[1]-18,'#ff8a1f','#fff',12*k);break;}
    case 'ribosome':{mrna(368,190,40,-0.2);ctx.fillStyle='#4b3d8f';ctx.beginPath();ctx.ellipse(349,184,9,7,0,0,6.29);ctx.fill();ctx.beginPath();ctx.ellipse(355,177,11,8,0,0,6.29);ctx.fill();
      const n=Math.floor(u*9);for(let i=0;i<n;i++)bead(340-i*7,184+Math.sin(i)*3,'#ff6b3d');pill(ctx,'ribosome builds the protein',350,140,PAL['card'],PAL['cv-ink'],12*k);break;}
    case 'toGolgi':{const p=lerp2([352,150],[392,166],u);vesicle(p[0],p[1],9,3);break;}
    case 'golgi':{const p=u<0.7?lerp2([395,166],[470,150],u/0.7):[470+(u-0.7)*60,150-(u-0.7)*40];if(u<0.7)bead(p[0],p[1]-6+Math.sin(u*20)*3,'#ff6b3d');else vesicle(p[0],p[1],9,3);
      pill(ctx,'adds finishing touches',432,112,PAL['card'],PAL['cv-ink'],12*k);break;}
    case 'secrete':{const e=memPt(-0.5,1);const st=[478,146];if(u<0.7){const p=lerp2(st,[e[0]-8,e[1]+6],u/0.7);vesicle(p[0],p[1],9,3);}
      else{const q=(u-0.7)/0.3;ctx.strokeStyle='#8a5a00';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e[0]-4,e[1]+4,9,-2.3+q,2.6-q);ctx.stroke();for(let i=0;i<3;i++)bead(e[0]+q*30+i*6,e[1]-q*20-i*8,'#ff6b3d');}
      pill(ctx,'exocytosis',e[0]-20,e[1]-28,PAL['card'],PAL['cv-ink'],12*k);break;}
    case 'atp':{const pts=[[400,262],memPt(-0.5,0.97)];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);ctx.lineTo(pts[1][0],pts[1][1]);ctx.stroke();
      const p=lerp2(pts[0],pts[1],u);vesicle(p[0],p[1],8,2);for(let i=0;i<3;i++){const q=((u*2+i/3)%1);txt(ctx,'ATP',480+(p[0]-480)*q,262+(p[1]-262)*q,{s:12*k,w:800,c:PAL['cv-atp'],a:'center'});}break;}
    case 'lyso':{const p=lerp2([450,180],[432,322],u);if(u<0.92)vesicle(p[0],p[1],8,0);pill(ctx,'enzymes to the lysosome',432,368,PAL['card'],PAL['cv-ink'],12*k);break;}
  }}
/* ---- quiz (instant challenges), different for each cell type and level ---- */
const QUIZ={
  animal:[
    {lvl:'bio',target:'mito',q:'Which structure is outlined in amber?',choices:['Nucleus','Mitochondrion','Golgi apparatus','Lysosome'],correct:1,explain:'Mitochondria are the bean-shaped organelles with folded inner membranes. They make most of the cell’s ATP.'},
    {lvl:'bio',q:'Which organelle makes most of the cell’s ATP?',choices:['Ribosome','Nucleus','Mitochondrion','Smooth ER'],correct:2,explain:'Mitochondria carry out cellular respiration, releasing energy from food to make ATP.'},
    {lvl:'bio',target:'nucleus',q:'What does the outlined structure contain?',choices:['The cell’s DNA','Digestive enzymes','Stored water'],correct:0,explain:'The nucleus stores the cell’s DNA, the instructions for building every protein.'},
    {lvl:'honors',target:'golgi',q:'Which structure is outlined in amber?',choices:['Rough ER','Smooth ER','Golgi apparatus','Centrosome'],correct:2,explain:'The Golgi apparatus is the stack of curved, flattened sacs. It finishes and ships proteins in vesicles.'},
    {lvl:'honors',target:'roughER',q:'The outlined structure is covered in ribosomes. What does it mostly make?',choices:['Lipids and steroid hormones','Proteins to be exported or placed in membranes','ATP'],correct:1,explain:'Rough ER is studded with ribosomes that thread new proteins into it. Smooth ER, with no ribosomes, makes lipids.'},
    {lvl:'honors',q:'Which structure does an animal cell have that most plant cells do not?',choices:['Cell wall','Chloroplast','Centrosome with centrioles','Large central vacuole'],correct:2,explain:'Animal cells have centrioles in their centrosome. The other three are plant features.'},
    {lvl:'ap',target:'lysosome',q:'The outlined organelle keeps its inside at pH 4.5. What is it?',choices:['Golgi apparatus','Lysosome','Mitochondrion'],correct:1,explain:'Lysosomes pump H⁺ in to stay acidic, the pH their digestive enzymes need. If one leaks, the enzymes barely work at the cytosol’s pH of about 7.2.'},
    {lvl:'ap',q:'In what order does a secreted protein, such as insulin, travel?',choices:['Golgi → rough ER → nucleus → membrane','Rough ER → Golgi → vesicle → cell membrane','Smooth ER → lysosome → vesicle → membrane'],correct:1,explain:'Ribosomes on the rough ER make it, the Golgi modifies and sorts it, and a vesicle carries it to the membrane for exocytosis. The walkthrough shows each step.'}],
  plant:[
    {lvl:'bio',target:'chloroplast',q:'Which structure is outlined in amber?',choices:['Mitochondrion','Chloroplast','Vacuole','Nucleus'],correct:1,explain:'Chloroplasts are the green organelles that capture light for photosynthesis. In living cells they stream around the vacuole.'},
    {lvl:'bio',target:'wall',q:'The outlined layer is stiff and made of cellulose. What is it?',choices:['Cell membrane','Vacuole membrane','Cell wall'],correct:2,explain:'The cell wall sits outside the membrane and gives plant cells their boxy shape and strength.'},
    {lvl:'honors',target:'vacuole',q:'The outlined structure presses water outward to keep the plant firm. What is it?',choices:['Central vacuole','Cell wall','Golgi apparatus'],correct:0,explain:'The central vacuole fills with water and pushes the cytoplasm against the wall. That turgor pressure holds leaves up.'},
    {lvl:'honors',q:'Plant cells have chloroplasts. Do they also need mitochondria?',choices:['No, chloroplasts replace them','Yes, they need mitochondria to turn sugar into ATP'],correct:1,explain:'Chloroplasts make sugar; mitochondria break it down to make ATP. Plant cells need both, including at night and in roots that get no light.'},
    {lvl:'ap',target:'plasmodesmata',q:'What do the outlined channels through the wall do?',choices:['Anchor the wall to the membrane','Connect the cytoplasm of neighboring cells','Let the vacuole release water'],correct:1,explain:'Plasmodesmata link neighboring plant cells, so water, sugars and signals move directly from cell to cell.'},
    {lvl:'ap',q:'Chloroplasts and mitochondria have double membranes and their own circular DNA. What does this support?',choices:['Cell theory','Endosymbiotic theory','Spontaneous generation'],correct:1,explain:'Endosymbiotic theory: both organelles descend from free-living bacteria that were engulfed by an ancestral cell and became partners.'}],
  bacterium:[
    {lvl:'bio',target:'nucleoid',q:'The outlined tangle is this cell’s DNA. Why isn’t it inside a nucleus?',choices:['Bacteria are prokaryotes and have no nucleus','The DNA is leaving the nucleus to divide','The nucleus is too small to see'],correct:0,explain:'Prokaryotes (bacteria) have no nucleus and no membrane-bound organelles. Their DNA sits in the nucleoid region.'},
    {lvl:'bio',target:'flagellum',q:'Which structure is outlined in amber?',choices:['Pilus','Cell wall','Flagellum'],correct:2,explain:'The flagellum is a long whip-like tail that spins like a propeller to move the cell.'},
    {lvl:'honors',q:'Which structure do bacteria share with animal and plant cells?',choices:['Mitochondria','Nucleus','Golgi apparatus','Ribosomes'],correct:3,explain:'Every cell needs to make proteins, so every cell has ribosomes. Bacteria have none of the membrane-bound organelles.'},
    {lvl:'honors',target:'plasmid',q:'What is the small outlined ring of DNA?',choices:['Plasmid','Nucleolus','Ribosome'],correct:0,explain:'Plasmids are small extra rings of DNA. They often carry antibiotic-resistance genes and can be passed between bacteria.'},
    {lvl:'ap',q:'Streptomycin blocks bacterial ribosomes. Why doesn’t it shut down our own protein synthesis?',choices:['Human cells have no ribosomes','Bacterial ribosomes (70S) are built differently from ours (80S)','Our ribosomes are inside the nucleus'],correct:1,explain:'Differences between bacterial 70S and eukaryotic 80S ribosomes let some antibiotics target bacteria selectively.'},
    {lvl:'ap',q:'Penicillin blocks peptidoglycan synthesis. Which structure fails?',choices:['Capsule','Cell wall','Plasma membrane'],correct:1,explain:'Without new peptidoglycan, the growing cell wall weakens and the bacterium bursts from its own turgor pressure. Animal cells have no peptidoglycan, so they are unaffected.'}]
};
function quizList(sim){return QUIZ[sim.p.cell].map(q=>Object.assign({instant:true},q));}
function currentQ(sim){const l=quizList(sim).filter(c=>atLeast(c.lvl));return l[sim.ch.idx];}

const CE={
  id:'cellexplorer',hash:'cellexplorer',apUnit:2,order:1,kind:'Learning tool',tab:'Cell explorer',
  card:'Click your way around animal, plant and bacterial cells, then quiz yourself on the parts.',
  title:'Cell explorer',
  lede:{bio:'Click any structure to learn its job, then test yourself. Compare an animal cell, a plant cell and a bacterium.',
        honors:'Explore the structure of each organelle and how they work together, like the endomembrane system that builds and ships proteins.',
        ap:'Compare prokaryotes and eukaryotes, follow the evidence for endosymbiosis, and trace a secreted protein through the endomembrane system.'},
  scale:{bio:'An animal cell is about 20 µm across: about 4 of them side by side would span the width of a hair. A bacterium is 10 times smaller still.',
         honors:'Not to scale between cell types: animal cell about 20 µm, plant cell about 50 µm, bacterium about 2 µm long. Organelles are drawn larger than life so you can click them.'},
  timeless:true,animated:true,graph:false,trials:false,
  controls:[
    {id:'cell',label:'Cell type',type:'seg',def:'animal',lvl:'bio',options:[{v:'animal',l:'Animal'},{v:'plant',l:'Plant'},{v:'bacterium',l:'Bacterium'}],
     onChange(sim){if(sim.p.part!=='none')BioLab.setValues(sim,{part:'none'});BioLab.gotoChallenge(sim,0);}},
    {id:'part',label:'Structure',type:'select',def:'none',lvl:'bio',options:[{v:'none',l:'Choose a structure…'}].concat(ORDER.map(id=>({v:id,l:PARTS[id].n,lvl:PARTS[id].lvl})))},
    {id:'labels',label:'Show labels',help:'Name every structure (turn off to quiz yourself)',type:'toggle',def:false,lvl:'bio'}
  ],
  init(){return {trip:null};},
  step(){},
  metrics:[],
  challengeTitle:'Quiz yourself',
  challenges:quizList,
  infoPanel(sim){const id=sim.p.part,cell=sim.p.cell,hon=atLeast('honors'),ap=atLeast('ap');
    if(id==='none'||!PARTS[id]){let h='<div class="p-head"><h3>Explore the cell</h3></div><p>Click any structure in the picture, or choose one from the Structure list.</p><p>Turn on <b>Show labels</b> to see every name, or test yourself in the quiz.</p>';
      if(hon){const rows=ORDER.filter(p=>p!=='cytoplasm'&&partAvailable(p));h+='<div class="tbl-wrap"><table><thead><tr><th>Structure</th><th>Animal</th><th>Plant</th><th>Bacterium</th></tr></thead><tbody>'+rows.map(p=>'<tr><td>'+PARTS[p].n+'</td>'+ALL.map(c=>'<td>'+(PARTS[p].in.includes(c)?'✓':'')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
      return h;}
    const P=PARTS[id],here=P.in.includes(cell);
    let h='<div class="p-head"><h3>'+P.n+'</h3></div>';
    if(!here)h+='<p class="pick"><b>Not in a '+CELLNAME[cell]+'.</b> '+((P.absent&&P.absent[cell])||'')+'</p>';
    h+='<p>'+P.job+'</p><p><b>Think of it as</b> '+P.an+'</p><p><b>Found in:</b> '+P.in.map(c=>CELLNAME[c]+'s').join(', ').replace('bacteriums','bacteria')+'</p>';
    if(hon)h+='<p>'+P.hon+'</p>';if(ap)h+='<p><b>AP:</b> '+P.ap+'</p>';
    return h;},
  narrate(sim){const p=sim.p,cell=p.cell;
    if(p.part!=='none'&&PARTS[p.part]){const P=PARTS[p.part];return P.in.includes(cell)?'<b>'+P.n+':</b> '+P.job:'<b>'+P.n+':</b> '+((P.absent&&P.absent[cell])||'not found in this cell.');}
    if(cell==='animal')return 'An animal cell, about 20 µm across. Everything inside the membrane floats in cytoplasm and is constantly moving. Watch the vesicles carry cargo from the Golgi to the membrane.';
    if(cell==='plant')return 'A plant cell, about 50 µm across. The big central vacuole pushes everything against the wall, and the chloroplasts stream around it.';
    return 'A bacterium, only about 2 µm long. It is a <b>prokaryote</b>: no nucleus and no membrane-bound organelles, just DNA, ribosomes and cytoplasm inside a membrane and wall.';},
  tour:[
    {title:'Start with the gene',text:'The instructions for making a protein, such as insulin, are stored in DNA inside the nucleus. A gene is copied into a messenger molecule called mRNA.',focus:[140,130,190,165],speed:0.5,setup(sim){sim.st.trip={k:'gene',t0:sim.vt};}},
    {title:'mRNA leaves the nucleus',text:'The mRNA slips out through a pore in the nuclear envelope and travels to a ribosome on the rough ER.',focus:[200,150,175,110],speed:0.5,setup(sim){sim.st.trip={k:'mrna',t0:sim.vt};}},
    {title:'A ribosome builds the protein',text:'The ribosome reads the mRNA and links amino acids in order. The growing chain is threaded into the rough ER, where it folds into shape.',focus:[300,120,100,110],speed:0.4,setup(sim){sim.st.trip={k:'ribosome',t0:sim.vt};}},
    {title:'Packed into a vesicle',text:'A bubble of ER membrane pinches off with the protein inside. This vesicle carries it to the Golgi apparatus.',focus:[330,115,160,85],speed:0.5,setup(sim){sim.st.trip={k:'toGolgi',t0:sim.vt};}},
    {title:'The Golgi finishes and ships it',text:'The protein moves through the Golgi stack, gets finishing touches such as sugar tags, and leaves in a new vesicle from the far side.',focus:[380,95,110,105],speed:0.5,setup(sim){sim.st.trip={k:'golgi',t0:sim.vt};}},
    {title:'Out of the cell',text:'The vesicle travels to the cell membrane and fuses with it, releasing the protein outside the cell. This is exocytosis.',focus:[455,80,150,115],speed:0.5,setup(sim){sim.st.trip={k:'secrete',t0:sim.vt};}},
    {lvl:'honors',title:'Who pays for the trip?',text:'Motor proteins carry vesicles along microtubule tracks that radiate from the centrosome. Every step costs ATP, made by the mitochondria.',focus:[[370,230,140,60],[455,118,120,80]],speed:0.5,setup(sim){sim.st.trip={k:'atp',t0:sim.vt};}},
    {lvl:'ap',title:'A different address',text:'The Golgi tags some proteins with mannose-6-phosphate. Those vesicles go to lysosomes instead of the membrane, delivering digestive enzymes.',focus:[395,150,80,210],speed:0.5,setup(sim){sim.st.trip={k:'lyso',t0:sim.vt};}}
  ],
  onTourExit(sim){sim.st.trip=null;},
  terms:[{t:'Organelle',d:'A structure inside a cell with a specific job.'},{t:'Prokaryote',d:'A cell with no nucleus and no membrane-bound organelles (bacteria).'},{t:'Eukaryote',d:'A cell with a nucleus and membrane-bound organelles (animals, plants, fungi, protists).'},
    {lvl:'honors',t:'Endomembrane system',d:'The nuclear envelope, ER, Golgi, vesicles and lysosomes working together to make and ship proteins and lipids.'},{lvl:'honors',t:'Exocytosis',d:'A vesicle fusing with the membrane to release its contents outside the cell.'},
    {lvl:'ap',t:'Endosymbiosis',d:'The theory that mitochondria and chloroplasts came from bacteria engulfed by an ancestral cell.'},{lvl:'ap',t:'Compartmentalization',d:'Membranes let a eukaryotic cell run incompatible reactions side by side, such as acidic digestion in lysosomes.'}],
  about:'<p>A labeled model, not a photograph. Organelles are enlarged and simplified so each one can be clicked, and the three cell types are not drawn to the same scale (real sizes are given above the picture). Movement is shown slowly: vesicle traffic and the streaming of chloroplasts (cyclosis) really happen, at a few micrometers per second.</p><p>Most animal cells have hundreds of mitochondria and millions of ribosomes. Only a few are drawn.</p>',
  onClick(sim,x,y){const cell=sim.p.cell;let found='none';
    for(const id of HIT){if(!PARTS[id].in.includes(cell)||!partAvailable(id))continue;if(shapesOf(sim,id).some(s=>hitShape(sim,s,x,y))){found=id;break;}}
    BioLab.setValues(sim,{part:found});},
  initVis(sim){sim.vis.dyn=null;},
  draw(sim,ctx,vdt,k,t){
    const p=sim.p,cell=p.cell,hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['card'];ctx.fillRect(0,0,800,450);
    const D=dynamic(sim,cell,t);sim.vis.dyn=D;
    if(cell==='animal')drawAnimal(ctx,sim,D,t,hon);else if(cell==='plant')drawPlant(ctx,sim,D,t,hon,ap);else drawBacterium(ctx,sim,D,t,hon);
    if(cell==='animal')drawTrip(ctx,sim,k);
    // right-hand panel
    const C=CELLS[cell],RX=788;
    txt(ctx,C.name,RX,38,{s:17*k,w:700,a:'right'});txt(ctx,C.size,RX,58,{s:12.5*k,c:PAL['cv-soft'],a:'right'});
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(RX-C.bar,82);ctx.lineTo(RX,82);ctx.moveTo(RX-C.bar,76);ctx.lineTo(RX-C.bar,88);ctx.moveTo(RX,76);ctx.lineTo(RX,88);ctx.stroke();
    txt(ctx,C.barL,RX-C.bar/2,102,{s:12*k,w:600,a:'center',c:PAL['cv-soft']});
    ctx.font='700 '+12*k+'px '+FONT;pill(ctx,C.kind,RX-ctx.measureText(C.kind).width/2-8,126,PAL['card2'],PAL['cv-ink'],12*k);
    const touring=sim.tour&&sim.tour.on;
    // quiz target outline
    const q=currentQ(sim);const showQ=!touring&&q&&q.target&&sim.ch.phase!=='running';
    if(showQ)outline(ctx,sim,q.target,PAL['s4'],true,RM?0:t);
    // labels
    if(p.labels&&!touring){ORDER.forEach(id=>{if(!PARTS[id].in.includes(cell)||!partAvailable(id))return;if(showQ&&sim.ch.phase==='ask'&&id===q.target)return;const a=anchorOf(sim,id);ctx.font='700 '+11*k+'px '+FONT;const hw=ctx.measureText(PARTS[id].n).width/2+8;pill(ctx,PARTS[id].n,clamp(a[0],hw+2,798-hw),a[1],PAL['card'],PAL['cv-ink'],11*k);});}
    // selection
    if(p.part!=='none'&&PARTS[p.part]&&!touring){const P=PARTS[p.part];
      if(P.in.includes(cell)){outline(ctx,sim,p.part,PAL['rj'],false,0);const a=anchorOf(sim,p.part);
        ctx.font='700 '+13*k+'px '+FONT;const w=ctx.measureText(P.n).width;const lx=clamp(a[0],w/2+16,784-w/2),ly=a[1]<70?a[1]+34:a[1]-30;
        ctx.strokeStyle=PAL['rj'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(lx,ly);ctx.stroke();pill(ctx,P.n,lx,ly,PAL['rj'],'#fff',13*k);}
      else{txt(ctx,'Not in this cell:',RX,160,{s:12.5*k,w:700,c:PAL['rj'],a:'right'});txt(ctx,P.n,RX,178,{s:12.5*k,c:PAL['cv-soft'],a:'right'});}}
    if(!touring&&p.part==='none'&&!p.labels&&k<1.3){txt(ctx,'Click any structure',RX,cell==='bacterium'?160:170,{s:12.5*k,c:PAL['cv-soft'],a:'right'});txt(ctx,'to learn its job.',RX,cell==='bacterium'?178:188,{s:12.5*k,c:PAL['cv-soft'],a:'right'});}
  }
};
BioLab.register(CE);
})();
