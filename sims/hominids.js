(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT}=BioLab.h;

/* ================= Species reference data =================
   Dates and cranial-capacity ranges are the approximate published values in the Honors Biology handout
   (Lilyestrom, Powell). Body masses are approximate averages of published male and female estimates
   (McHenry 1992 for the australopiths and H. habilis; Ruff, Trinkaus and Holliday 1997 for later Homo).
   dims = [height, length, width] in cm for a model cast; H × L × W × 0.523 lands inside the published range.
   Skull shapes are original schematic drawings built from a few measured proportions (not traced). */
const SPEC=[
 {id:'proconsul',sci:'Proconsul africanus',lab:'Proconsul africanus',short:'Proconsul',from:20,to:18,lo:150,hi:170,mean:160,body:11,
  when:'about 20 to 18 million years ago',dims:[5.6,8.8,6.2],
  gy:.48,bh:.2,bx:.74,fmA:32,occ:'round',crest:null,
  vault:[[0,.48],[.01,.56],[.04,.66],[.10,.78],[.19,.89],[.32,.97],[.47,1],[.62,.975],[.76,.90],[.87,.78],[.95,.64],[.99,.54],[1,.47],[.99,.40],[.95,.28],[.86,.16],[.80,.11]],
  face:{n:.35,nY:.45,faceH:3.4,progX:-3.4,pal:5.0,ans:.9,sub:1.3,nb:-.15,nh:1.1,mandH:2.1,chin:-1.6,canine:1.7,molar:.9,ram:1.9,orbH:2.0},
  ant:{eu:.40,p:2.0,q:.08,biorb:.92,bizyg:1.12,io:1.3,nasW:1.2,alv:4.0,mandW:.86,brow:'none'},
  fm:'Toward the back of the skull, facing backward',fmPlain:'toward the back',
  feat:{vault:'Small, rounded braincase.',fore:'Smooth and sloping, no real forehead.',brow:'No brow ridge.',face:'Long, snout-like face that juts far forward.',jaw:'Long jaw with large, pointed canine teeth. No chin.',top:'Smooth and rounded, no crest.',back:'Rounded.',cheek:'Narrow face.'},
  key:'It was an early ape that climbed through trees on four limbs, long before the human line split from the other apes.'},
 {id:'afarensis',sci:'Australopithecus afarensis',lab:'Australopithecus afarensis',short:'A. afarensis',from:3.9,to:2.9,lo:380,hi:550,mean:450,body:37,
  when:'3.9 to 2.9 million years ago',dims:[8.0,13.2,8.2],
  gy:.52,bh:.7,bx:.60,fmA:16,occ:'round',crest:{h:.3,c0:.48,c1:.86,pk:.67},
  vault:[[0,.52],[.012,.59],[.06,.64],[.12,.71],[.20,.81],[.32,.91],[.46,.98],[.58,1],[.70,.97],[.82,.88],[.91,.76],[.97,.62],[1,.50],[.97,.38],[.92,.28],[.84,.16],[.76,.10]],
  face:{n:.6,nY:.85,faceH:5.6,progX:-3.3,pal:6.4,ans:1.1,sub:2.3,nb:.2,nh:1.5,mandH:3.2,chin:-1.9,canine:1.3,molar:1.2,ram:2.8,orbH:2.7},
  ant:{eu:.33,p:1.7,q:.06,biorb:.88,bizyg:1.22,io:2.0,nasW:2.0,alv:5.6,mandW:.95,brow:'arch'},
  fm:'Farther forward than in apes, under the back of the skull',fmPlain:'farther forward than in apes',
  feat:{vault:'Small braincase, about the size of a chimpanzee’s.',fore:'Low and sloping.',brow:'Moderate brow ridge.',face:'Face juts strongly forward (prognathic).',jaw:'Thick jaw, large teeth and canines, no chin.',top:'Small crest at the back of the skull in some males.',back:'Rounded.',cheek:'Wide cheekbones.'},
  key:'This is Lucy’s species. It walked upright on two legs, yet its brain was only about the size of a chimpanzee’s.'},
 {id:'habilis',sci:'Homo habilis',lab:'Homo habilis',short:'H. habilis',from:2.4,to:1.4,lo:550,hi:690,mean:610,body:34,
  when:'2.4 to 1.4 million years ago',dims:[9.0,14.6,8.9],
  gy:.50,bh:.7,bx:.55,fmA:9,occ:'round',crest:null,
  vault:[[0,.50],[.01,.56],[.04,.62],[.09,.72],[.17,.84],[.29,.94],[.44,1],[.59,.985],[.73,.92],[.85,.80],[.94,.65],[.99,.53],[1,.46],[.98,.37],[.93,.26],[.84,.14],[.76,.08]],
  face:{n:.6,nY:1.0,faceH:5.4,progX:-1.6,pal:5.6,ans:.6,sub:2.0,nb:-.2,nh:1.6,mandH:2.8,chin:-1.1,canine:1.0,molar:1.05,ram:2.8,orbH:2.9},
  ant:{eu:.40,p:1.9,q:.08,biorb:.82,bizyg:1.06,io:2.2,nasW:2.2,alv:5.0,mandW:.84,brow:'arch'},
  fm:'Under the skull',fmPlain:'under the skull',
  feat:{vault:'Rounder, larger braincase than the australopiths.',fore:'Low, but higher than in Australopithecus.',brow:'Thin brow ridge.',face:'Smaller face that juts forward less.',jaw:'Smaller teeth and a thinner jaw. No chin.',top:'Rounded, no crest.',back:'Rounded.',cheek:'Moderate cheekbones.'},
  key:'It is one of the earliest members of our genus, Homo, and it lived at the same time as Paranthropus boisei.'},
 {id:'boisei',sci:'Paranthropus boisei',lab:'Australopithecus (Paranthropus) boisei',short:'P. boisei',from:2.3,to:1.2,lo:500,hi:550,mean:520,body:41,
  when:'2.3 to 1.2 million years ago',dims:[8.4,14.0,8.5],
  gy:.55,bh:.9,bx:.57,fmA:12,occ:'round',crest:{h:1.1,c0:.20,c1:.86,pk:.50},
  vault:[[0,.55],[.012,.63],[.06,.68],[.13,.76],[.22,.85],[.34,.94],[.48,1],[.62,.975],[.75,.90],[.86,.78],[.94,.64],[1,.50],[.97,.37],[.91,.26],[.83,.15],[.75,.09]],
  face:{n:.7,nY:1.05,faceH:7.0,progX:-1.3,pal:7.0,ans:.5,sub:2.6,nb:.35,nh:1.6,mandH:4.3,chin:-1.4,canine:.8,molar:1.6,ram:3.4,orbH:2.9},
  ant:{eu:.30,p:1.7,q:.06,biorb:.86,bizyg:1.42,io:2.0,nasW:2.3,alv:6.2,mandW:1.05,brow:'bar'},
  fm:'Forward, under the skull',fmPlain:'under the skull',
  feat:{vault:'Small braincase.',fore:'Low and sloping.',brow:'Moderate brow ridge.',face:'Very wide, flat, dish-shaped face with flaring cheekbones.',jaw:'Massive, very thick jaw with huge molars and small front teeth.',top:'Tall sagittal crest along the top of the skull.',back:'Rounded.',cheek:'Cheekbones flare far out to the sides.'},
  key:'Its huge jaw, giant molars and sagittal crest anchored strong chewing muscles for tough plant food. It was a side branch that died out.'},
 {id:'ergaster',sci:'Homo ergaster',lab:'Homo ergaster',short:'H. ergaster',from:1.9,to:1.4,lo:700,hi:900,mean:800,body:58,
  when:'1.9 to 1.4 million years ago',dims:[9.4,16.6,9.8],
  gy:.52,bh:1.0,bx:.53,fmA:7,occ:'round',crest:null,
  vault:[[0,.52],[.012,.60],[.06,.635],[.13,.72],[.24,.84],[.37,.94],[.51,1],[.65,.98],[.78,.90],[.88,.77],[.95,.62],[.99,.50],[1,.42],[.98,.33],[.93,.24],[.84,.13],[.75,.07]],
  face:{n:.8,nY:1.15,faceH:6.0,progX:-1.0,pal:5.8,ans:.3,sub:2.0,nb:-.4,nh:1.8,mandH:3.0,chin:-.9,canine:1.0,molar:1.0,ram:3.0,orbH:3.2},
  ant:{eu:.34,p:1.6,q:.07,biorb:.84,bizyg:.98,io:2.4,nasW:2.6,alv:5.6,mandW:.82,brow:'bar'},
  fm:'Under the skull',fmPlain:'under the skull',
  feat:{vault:'Long, low braincase.',fore:'Low and sloping.',brow:'Prominent, arched brow ridge.',face:'Smaller, flatter face than earlier species.',jaw:'Smaller teeth. No chin.',top:'Rounded, with a slight ridge along the midline.',back:'Rounded to slightly angled.',cheek:'Moderate cheekbones.'},
  key:'Many scientists treat it as the African form of Homo erectus. The tall Turkana Boy skeleton shows a body built for long-distance walking.'},
 {id:'erectus',sci:'Homo erectus',lab:'Homo erectus',short:'H. erectus',from:1.9,to:0.11,lo:850,hi:1100,mean:975,body:57,
  when:'1.9 million to 110,000 years ago',dims:[9.6,18.2,10.6],
  gy:.52,bh:1.3,bx:.52,fmA:7,occ:'torus',crest:null,
  vault:[[0,.52],[.01,.60],[.035,.635],[.075,.632],[.12,.665],[.22,.77],[.36,.90],[.52,.985],[.62,1],[.74,.975],[.85,.89],[.93,.74],[.985,.55],[1,.40,1],[.97,.27],[.90,.16],[.81,.08],[.73,.05]],
  face:{n:.9,nY:1.3,faceH:6.3,progX:-1.2,pal:6.0,ans:.3,sub:2.1,nb:-.4,nh:1.8,mandH:3.4,chin:-1.0,canine:1.05,molar:1.1,ram:3.2,orbH:3.3},
  ant:{eu:.30,p:1.45,q:.06,biorb:.84,bizyg:.98,io:2.6,nasW:2.7,alv:5.9,mandW:.82,brow:'bar'},
  fm:'Under the skull',fmPlain:'under the skull',
  feat:{vault:'Long, low braincase with thick bone, widest near the base.',fore:'Flat, receding forehead.',brow:'Thick, straight brow ridge, like a shelf.',face:'Face juts forward less than in earlier species.',jaw:'Thick jaw. No chin.',top:'Low, with a slight keel along the midline.',back:'Angled back of the skull with a ridge of bone (occipital torus).',cheek:'Moderate cheekbones.'},
  key:'It spread from Africa into Asia, used fire and made hand axes, and lasted for well over a million years.'},
 {id:'neanderthal',sci:'Homo neanderthalensis',lab:'Homo sapiens neanderthalensis',short:'Neanderthal',from:0.43,to:0.04,lo:1400,hi:1600,mean:1450,body:72,
  when:'430,000 to 40,000 years ago',dims:[10.9,19.6,13.2],
  gy:.48,bh:1.0,bx:.51,fmA:5,occ:'bun',crest:null,
  vault:[[0,.48],[.008,.55],[.04,.585],[.09,.645],[.18,.77],[.30,.89],[.42,.965],[.53,1],[.65,.985],[.76,.925],[.84,.84],[.90,.75],[.955,.64],[.99,.54],[1,.45],[.985,.36],[.95,.30],[.915,.275],[.87,.21],[.80,.12],[.72,.06]],
  face:{n:.6,nY:1.0,faceH:7.0,progX:-.9,pal:5.8,ans:0,sub:2.2,nb:-1.2,nh:2.3,mandH:3.2,chin:-.6,canine:1.0,molar:1.05,ram:3.2,orbH:3.7},
  ant:{eu:.48,p:2.2,q:.14,biorb:.86,bizyg:1.0,io:2.6,nasW:3.2,alv:6.0,mandW:.78,brow:'double'},
  fm:'Under the skull',fmPlain:'under the skull',
  feat:{vault:'Long, low, wide braincase, rounded when seen from the front.',fore:'Receding forehead.',brow:'Double-arched brow ridge, one arch over each eye.',face:'Middle of the face juts forward, with a very large nose opening.',jaw:'Large front teeth. No chin.',top:'Low and long, no crest.',back:'Bulge at the back of the skull (occipital bun).',cheek:'Swept-back cheekbones.'},
  key:'Neanderthals had brains as large as ours or larger. They buried their dead, made tools and lived through ice ages in Europe and western Asia.'},
 {id:'sapiens',sci:'Homo sapiens',lab:'Homo sapiens sapiens',short:'H. sapiens',from:0.3,to:0,lo:1200,hi:1500,mean:1350,body:62,
  when:'300,000 years ago to today',dims:[12.6,17.4,11.7],
  gy:.50,bh:.5,bx:.49,fmA:4,occ:'round',crest:null,
  vault:[[0,.50],[.004,.535],[.014,.59],[.035,.70],[.08,.82],[.16,.92],[.28,.985],[.42,1],[.56,.985],[.70,.93],[.83,.82],[.93,.67],[.985,.54],[1,.45],[.985,.36],[.95,.25],[.87,.13],[.78,.06]],
  face:{n:.5,nY:.8,faceH:6.2,progX:.6,pal:5.0,ans:-.1,sub:1.8,nb:-.4,nh:2.0,mandH:3.0,chin:.8,canine:.9,molar:1.0,ram:3.0,orbH:3.3},
  ant:{eu:.62,p:2.6,q:.10,biorb:.82,bizyg:.98,io:2.2,nasW:2.4,alv:5.2,mandW:.80,brow:'small'},
  fm:'Under the skull, facing straight down',fmPlain:'under the skull',
  feat:{vault:'High, rounded braincase, with nearly straight sides seen from the front.',fore:'Vertical forehead.',brow:'Small brow ridge.',face:'Flat face, tucked under the forehead.',jaw:'Small teeth, a thinner jaw and a chin.',top:'High and rounded, no crest.',back:'Rounded.',cheek:'Small cheekbones.'},
  key:'This is us. The high, rounded braincase sits right above a flat face, and the chin is found in no other species here.'}
];
const SPB={};SPEC.forEach((s,i)=>{SPB[s.id]=s;s.i=i;s.mya=(s.from+s.to)/2;});
const CHIMP={short:'Chimpanzee',mean:390,body:45};
const EQ=(cc,kg)=>cc/(0.12*Math.pow(kg*1000,2/3));   // Jerison (1973): expected brain (g) = 0.12 × body (g)^(2/3); brain ≈ 1 g per cc
const LAB_ORDER=['proconsul','afarensis','boisei','habilis','erectus','ergaster','neanderthal','sapiens'];  // the handout's list
const r1=v=>Math.round(v*10)/10,r2=v=>Math.round(v*100)/100;

/* ================= Skull geometry (cm; y up, basion at y = 0, glabella at x = 0, face toward −x) ================= */
/* Hermite spline through the points with chord-length tangents (no overshoot loops); a third element of 1 marks a corner. */
function spline(pts,closed,n){const N=pts.length,P=i=>closed?pts[(i%N+N)%N]:pts[clamp(i,0,N-1)];
  const d=i=>{const a=P(i),b=P(i+1);return Math.hypot(b[0]-a[0],b[1]-a[1])||1e-6;};
  const dir=i=>{const p=P(i);if(p[2])return null;if(!closed&&(i<=0||i>=N-1)){const a=P(Math.max(0,i-1)),b=P(Math.min(N-1,i+1)),l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return [(b[0]-a[0])/l,(b[1]-a[1])/l];}
    const a=P(i-1),b=P(i+1),l=d(i-1)+d(i);return [(b[0]-a[0])/l,(b[1]-a[1])/l];};
  const out=[],segs=closed?N:N-1;
  for(let i=0;i<segs;i++){const p0=P(i),p1=P(i+1),L=d(i),u0=dir(i),u1=dir(i+1),m0=u0?[u0[0]*L,u0[1]*L]:[0,0],m1=u1?[u1[0]*L,u1[1]*L]:[0,0];
    for(let j=0;j<n;j++){const t=j/n,t2=t*t,t3=t2*t,h00=2*t3-3*t2+1,h10=t3-2*t2+t,h01=-2*t3+3*t2,h11=t3-t2;
      out.push([h00*p0[0]+h10*m0[0]+h01*p1[0]+h11*m1[0],h00*p0[1]+h10*m0[1]+h01*p1[1]+h11*m1[1]]);}}
  if(!closed)out.push([pts[N-1][0],pts[N-1][1]]);return out;}
const GEO={};
function geo(sp,dims){const key=sp.id+':'+dims.join(',');if(GEO[key])return GEO[key];const g=GEO[key]={lat:latGeo(sp,dims),ant:null};g.ant=antGeo(sp,dims,g.lat);return g;}
function latGeo(sp,dims){const [H,L,W]=dims,sc=L/sp.dims[1],f=sp.face,cr=sp.crest?sp.crest.h*sc:0,Hv=H-cr;
  const g=sp.gy*Hv,bh=sp.bh*sc,bx=sp.bx*L,a=sp.fmA*Math.PI/180,fmL=0.2*L;
  const opi=[bx+fmL*Math.cos(a),fmL*Math.sin(a),1],uo=opi[0]/L;
  const V=[];let past=false;sp.vault.forEach(p=>{if(past&&p[0]<uo+0.035)return;V.push([p[0]*L,p[1]*Hv,p[2]?1:0]);if(p[0]>=1)past=true;});
  const n=[f.n*sc,g-f.nY*sc],yp=n[1]-f.faceH*sc,xp=f.progX*sc,xt=xp+f.pal*sc;
  const ans=[xp+f.ans*sc,yp+f.sub*sc],rhin=[n[0]+f.nb*sc,n[1]-f.nh*sc],notch=[Math.max(ans[0],rhin[0])+0.55*sc,(ans[1]+rhin[1])/2-0.1*sc];
  const browBot=[0.05*sc+bh*0.06,g-bh*0.55];
  const pts=[[n[0],n[1]],browBot].concat(V,[opi,[bx,0,1],[bx-1.1*sc,0.35*sc],[xt+0.6*sc,yp+1.3*sc],[xt,yp+0.2*sc,1],[xp,yp,1],[ans[0],ans[1]],notch,[rhin[0],rhin[1],1]]);
  let cran=spline(pts,true,8);
  // brow ridge shading, and the occipital bun or torus
  const bt=V[1]||V[0],bs=V[2]||bt;let brow=null,occB=null;
  if(sp.bh>=0.6){const xs=bh*1.35,q=V.find(p=>p[0]>=xs)||bs;brow=spline([browBot,[0,g],[bt[0],bt[1]],[q[0],q[1]-0.08*sc],[xs+0.25*sc,g-bh*0.25],[Math.max(n[0]+0.3*sc,xs*0.8),g-bh*0.6]],true,6);}
  if(sp.occ==='bun'){const o=V.findIndex(p=>p[0]>=L*0.999);if(o>2)occB=spline([[V[o-2][0],V[o-2][1]],[V[o-1][0],V[o-1][1]],[V[o][0],V[o][1]],[V[o+1][0],V[o+1][1]],[V[o+2][0],V[o+2][1]],[V[o][0]-0.9*sc,V[o][1]]],true,6);}
  if(sp.occ==='torus'){const o=V.findIndex(p=>p[2]);if(o>0)occB=spline([[V[o][0],V[o][1],1],[V[o][0]-0.4*sc,V[o][1]+0.85*sc],[V[o][0]-1.3*sc,V[o][1]+0.3*sc],[V[o][0]-1.0*sc,V[o][1]-0.6*sc],[V[o][0]-0.3*sc,V[o][1]-0.6*sc]],true,6);}
  // sagittal crest: a fin on top of the vault
  const topAt=x=>{let best=-1e9;for(let i=0;i<cran.length;i++){const p=cran[i],q=cran[(i+1)%cran.length];if((p[0]-x)*(q[0]-x)<=0&&p[0]!==q[0]){const y=p[1]+(q[1]-p[1])*(x-p[0])/(q[0]-p[0]);if(y>best)best=y;}}return best;};
  let crest=null;if(cr>0){const c0=sp.crest.c0*L,c1=sp.crest.c1*L,pk=sp.crest.pk*L,up=[],lo=[];
    for(let j=0;j<=24;j++){const x=c0+(c1-c0)*j/24,u=x<pk?(pk-x)/(pk-c0):(x-pk)/(c1-pk),b=Math.pow(Math.max(0,1-u*u),0.8),y0=topAt(x);up.push([x,y0+cr*b]);lo.unshift([x,y0-0.06]);}
    crest=up.concat(lo);}
  // mandible
  const yc=0.5*sc,xc=Math.min(bx-0.8*sc,xt+f.ram*sc+0.4*sc),Id=[xp+0.25*sc,yp-1.7*sc],Mey=Id[1]-f.mandH*sc,Pg=[Id[0]-f.chin*sc,Mey+0.9*sc],Me=[Pg[0]+0.8*sc,Mey];
  const Go=[xc+0.3*sc,Mey+1.1*sc],cor=[xc-f.ram*sc,yc+0.35*sc],ret=[Math.max(xt+0.25*sc,cor[0]-0.2*sc),Id[1]+0.15*sc];
  const mpts=[[xc,yc+0.38*sc],[xc+0.38*sc,yc+0.05*sc],[xc+0.42*sc,(yc+Go[1])/2],[Go[0],Go[1]],[(Me[0]+Go[0])/2,Mey+0.3*sc],[Me[0],Me[1]],[Pg[0],Pg[1]],[Id[0],Id[1],1],[xt,Id[1]+0.1*sc],[ret[0],ret[1]],[cor[0]+0.15*sc,(cor[1]+ret[1])/2],[cor[0],cor[1],1],[xc-f.ram*sc*0.45,yc-0.55*sc],[xc-0.35*sc,yc]];
  let mand=spline(mpts,true,7);
  // teeth along the upper and lower tooth rows
  const ws=[0.9,0.9,0.75,0.75,1.05*f.molar,1.0*f.molar,0.95*f.molar],sw=ws.reduce((a,b)=>a+b,0),k=(xt-xp)/sw,yo=yp-0.85*sc,teeth=[];let x=xp;
  ws.forEach((w,i)=>{const w2=w*k,ua=yp+(0.2*sc)*((x-xp)/(xt-xp)),la=Id[1]+0.1*sc*((x-xp)/(xt-xp)),ext=i===1?(f.canine-0.9)*sc:0;
    teeth.push({x:x+0.04*sc,w:w2-0.08*sc,y0:ua,y1:yo-ext*0.8,up:true},{x:x+0.04*sc,w:w2-0.08*sc,y0:la,y1:yo+ext*0.55,up:false});x+=w2;});
  // orbit, cheekbone, arch, ear
  const ot=g-bh*0.5-0.05*sc,oh=f.orbH*sc,orb={x:n[0]+0.35*sc+oh*0.36,y:ot-oh/2,rx:oh*0.34,ry:oh*0.47},ob=ot-oh;
  const cf=sp.id==='boisei'?-0.7*sc:0,cx0=n[0]+0.5*sc+cf;
  const cheek=spline([[cx0,ob+0.35*sc],[cx0+1.9*sc,ob+0.15*sc],[cx0+2.2*sc,ob-0.5*sc],[cx0+1.5*sc,ob-1.4*sc],[cx0+0.4*sc,ob-1.1*sc]],true,6);
  const az=[cx0+1.9*sc,ob-0.15*sc],bz=[xc+0.2*sc,yc+0.95*sc],th=0.8*sc;
  const arch=[[az[0],az[1]+th/2],[bz[0],bz[1]+th/2],[bz[0]+0.2*sc,bz[1]],[bz[0],bz[1]-th/2],[az[0],az[1]-th/2]];
  const ear={x:xc+0.75*sc,y:yc+1.25*sc,r:0.36*sc};
  // fit: front = glabella, back = most posterior point, top = highest point (crest included)
  const front=Math.min(...cran.filter(p=>p[1]>=g-0.25*sc).map(p=>p[0])),back=Math.max(...cran.map(p=>p[0])),top=Math.max(...cran.map(p=>p[1]),...(crest||[]).map(p=>p[1]));
  const kx=L/(back-front),ky=H/top,T=p=>[(p[0]-front)*kx,p[1]*ky];
  cran=cran.map(T);mand=mand.map(T);if(crest)crest=crest.map(T);if(brow)brow=brow.map(T);if(occB)occB=occB.map(T);
  teeth.forEach(t=>{t.x=(t.x-front)*kx;t.w*=kx;t.y0*=ky;t.y1*=ky;});
  const TT=q=>({x:(q.x-front)*kx,y:q.y*ky,rx:q.rx*kx,ry:q.ry*ky,r:q.r?q.r*kx:0});
  const vIdx=cran.reduce((b,p,i)=>p[1]>cran[b][1]?i:b,0),oIdx=cran.reduce((b,p,i)=>p[0]>cran[b][0]?i:b,0);
  const top2=crest?crest.reduce((b,p)=>p[1]>b[1]?p:b,crest[0]):cran[vIdx];
  const all=cran.concat(mand);
  return {H,L,W,Hv:Hv*ky,g:g*ky,cran,mand,crest,brow,back:occB,teeth,orb:TT(orb),ear:TT(ear),cheek:cheek.map(T),arch:arch.map(T),
    fm:{a:T([bx,0]),b:T(opi)},basion:T([bx,0]),opi:T(opi),vertex:top2,occ:cran[oIdx],gl:[0,g*ky],pros:T([xp,yp]),id:T(Id),me:T(Me),pg:T(Pg),go:T(Go),
    yO:cran[oIdx][1],xmin:Math.min(...all.map(p=>p[0])),ymin:Math.min(...all.map(p=>p[1])),yp:yp*ky,xc:(xc-front)*kx,yc:yc*ky};}
function antGeo(sp,dims,G){const [H,L,W]=dims,A=sp.ant,sc=L/sp.dims[1],Hv=G.Hv,cr=H-Hv,yE=A.eu*Hv,g=G.g,bh=sp.bh*sc*(G.Hv/(H-(sp.crest?sp.crest.h*sc:0)||1));
  const orbH=sp.face.orbH*sc,ot=g-bh*0.5-0.05*sc,ob=ot-orbH,yB=ob+0.45*sc,hw=W/2;
  const wv=y=>y>=yE?hw*Math.pow(Math.max(0,1-Math.pow((y-yE)/(Hv-yE),A.p)),1/A.p):hw*(1-A.q*Math.pow((yE-y)/Math.max(0.1,yE-yB),2));
  const side=[];for(let j=0;j<=40;j++){const t=j/40,y=yB+(Hv-yB)*(1-Math.pow(1-t,1.6));side.push([wv(y),y]);}
  side[side.length-1]=[0,Hv];
  const vault=side.concat(side.slice(0,-1).reverse().map(p=>[-p[0],p[1]]));
  let crest=null;if(cr>0.05){const cw=0.07*W;crest=[[-cw,Hv-0.35*sc],[-cw*0.35,Hv+cr*0.85],[0,Hv+cr],[cw*0.35,Hv+cr*0.85],[cw,Hv-0.35*sc]];crest=spline(crest,false,6);}
  const bo=A.biorb*W,rim=0.45*sc,orbW=(bo-A.io*sc-2*rim)/2,ox=A.io*sc/2+orbW/2,yoc=ot-orbH/2;
  const bz=A.bizyg*W/2,alv=A.alv*sc/2,yp=G.yp,yl=yp-1.7*sc,mey=G.me[1],bg=A.mandW*W/2;
  // brow ridge (half; mirrored when drawn)
  let brow=null;const bt=g+bh*0.5,bb=ot;
  if(A.brow==='bar')brow=[[0,bt],[bo*0.25,bt+0.05*sc],[bo*0.5-0.1*sc,bt-0.15*sc],[bo*0.5,(bt+bb)/2],[bo*0.5-0.2*sc,bb-0.1*sc],[ox,bb],[A.io*sc*0.5,bb+0.05*sc],[0,bb+0.15*sc]];
  else if(A.brow==='double'||A.brow==='arch'){const hi=A.brow==='double'?bh*0.25:0.1*sc;brow=[[0,bt-hi*1.4],[ox*0.55,bt+hi*0.3],[ox,bt+hi],[ox+orbW*0.4,bt],[bo*0.5,bb+bh*0.3],[bo*0.5-0.25*sc,bb-0.15*sc],[ox+orbW*0.3,bb],[ox,bb-0.05*sc],[ox-orbW*0.35,bb],[A.io*sc*0.5,bb+0.1*sc],[0,bb+0.2*sc]];}
  else if(A.brow==='small')brow=[[0,bb+0.55*sc],[A.io*sc*0.5,bb+0.75*sc],[ox,bb+0.5*sc],[ox+orbW*0.2,bb+0.15*sc],[ox,bb+0.05*sc],[A.io*sc*0.5,bb+0.25*sc],[0,bb+0.3*sc]];
  const nasTop=yoc-orbH*0.12,nasBot=yp+sp.face.sub*sc*0.85,nw=A.nasW*sc/2;
  const nasal=spline([[0,nasTop],[nw*0.55,nasTop-(nasTop-nasBot)*0.35],[nw,nasBot+(nasTop-nasBot)*0.25],[nw*0.8,nasBot+0.1*sc],[0,nasBot,1],[-nw*0.8,nasBot+0.1*sc],[-nw,nasBot+(nasTop-nasBot)*0.25],[-nw*0.55,nasTop-(nasTop-nasBot)*0.35]],true,6);
  const cheek=[[ox+orbW*0.15,ob-0.05*sc],[ox+orbW/2+rim*0.9,ob+orbH*0.35],[ox+orbW/2+rim*0.6,ob+orbH*0.75],[bz*0.98,ob+0.15*sc],[bz,ob-0.5*sc],[bz*0.9,ob-0.9*sc],[ox+orbW*0.45,ob-1.25*sc],[alv*0.95+0.3*sc,ob-1.6*sc]];
  const maxi=[[-(alv+0.1*sc),yp],[alv+0.1*sc,yp],[alv*0.95+0.4*sc,ob-1.6*sc],[ox+orbW*0.2,ob-0.2*sc],[-(ox+orbW*0.2),ob-0.2*sc],[-(alv*0.95+0.4*sc),ob-1.6*sc]];
  const mand=[[bg*0.92,yl+2.4*sc],[bg,G.go[1]+0.2*sc],[bg*0.9,G.go[1]-0.45*sc],[bg*0.55,mey+0.35*sc],[0,mey],[-bg*0.55,mey+0.35*sc],[-bg*0.9,G.go[1]-0.45*sc],[-bg,G.go[1]+0.2*sc],[-bg*0.92,yl+2.4*sc],[-(bg-0.9*sc),yl+2.4*sc,1],[-(bg-0.95*sc),yl+0.3*sc],[-alv*0.9,yl,1],[alv*0.9,yl,1],[bg-0.95*sc,yl+0.3*sc],[bg-0.9*sc,yl+2.4*sc,1]];
  const teeth=[];const nT=6,tw=(alv*1.75)/nT;for(let i=0;i<nT;i++){const x=-alv*0.875+i*tw,can=(i===0||i===nT-1)?(sp.face.canine-0.9)*sc:0;
    teeth.push({x:x+0.03*sc,w:tw-0.06*sc,y0:yp,y1:yp-0.85*sc-can*0.8},{x:x+0.03*sc,w:tw-0.06*sc,y0:yl,y1:yp-0.85*sc+can*0.5});}
  const hwAll=Math.max(hw,bz,bg);
  return {H,W,Hv,yE,hw,vault,crest,brow,orbs:{ox,y:yoc,w:orbW,h:orbH},nasal,cheek:spline(cheek,false,5),maxi:spline(maxi,true,4),mand:spline(mand,true,5),teeth,
    arch:{y:ob-0.35*sc,x0:ox+orbW/2,x1:bz,th:0.5*sc},chin:sp.face.chin>0,mey,yl,bg,bz,hwAll,ymin:Math.min(mey,G.ymin)};}

/* ================= Drawing the skulls ================= */
const BONE='#e7dcc2',BONE2='#d3c29c',INK='#5a4831',HOLE='#3a2f24',TOOTH='#f7f2e6';
function path(ctx,pts,X,Y,close){ctx.beginPath();pts.forEach((p,i)=>{const x=X(p[0]),y=Y(p[1]);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});if(close!==false)ctx.closePath();}
function bone(ctx,pts,X,Y,lw,fill){path(ctx,pts,X,Y);ctx.fillStyle=fill||BONE;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=lw;ctx.lineJoin='round';ctx.stroke();}
function toothRects(ctx,teeth,X,Y,S,lw){teeth.forEach(t=>{const x0=X(t.x),x1=X(t.x+t.w),ya=Y(t.y0),yb=Y(t.y1);rr(ctx,Math.min(x0,x1),Math.min(ya,yb),Math.abs(x1-x0),Math.abs(yb-ya),Math.min(3,S*0.12));ctx.fillStyle=TOOTH;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=lw*0.7;ctx.stroke();});}
/* lateral view, face to the left. (ox,oy) = screen position of x = 0 (glabella), y = 0 (basion level); S = px per cm */
function drawLat(ctx,G,ox,oy,S,o){o=o||{};const X=x=>ox+x*S,Y=y=>oy-y*S,lw=clamp(S*0.085,1,2.2);
  if(o.ghost){ctx.save();ctx.setLineDash([6,5]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.6;path(ctx,G.cran,X,Y);ctx.stroke();path(ctx,G.mand,X,Y);ctx.stroke();ctx.restore();return;}
  bone(ctx,G.cran,X,Y,lw);
  if(G.crest){bone(ctx,G.crest,X,Y,lw,BONE2);}
  if(G.brow)bone(ctx,G.brow,X,Y,lw*0.8,BONE2);if(G.back)bone(ctx,G.back,X,Y,lw*0.8,BONE2);
  // orbit and cheek
  ctx.fillStyle=HOLE;ctx.beginPath();ctx.ellipse(X(G.orb.x),Y(G.orb.y),G.orb.rx*S,G.orb.ry*S,0,0,6.2832);ctx.fill();
  bone(ctx,G.arch,X,Y,lw*0.8,BONE2);bone(ctx,G.cheek,X,Y,lw*0.8);
  ctx.fillStyle=HOLE;ctx.beginPath();ctx.arc(X(G.ear.x),Y(G.ear.y),Math.max(2,G.ear.r*S),0,6.2832);ctx.fill();
  // foramen magnum: the opening for the spinal cord, on the underside
  const fa=G.fm.a,fb=G.fm.b,mx=(fa[0]+fb[0])/2,my=(fa[1]+fb[1])/2,ang=-Math.atan2(fb[1]-fa[1],fb[0]-fa[0]);
  ctx.fillStyle=HOLE;ctx.beginPath();ctx.ellipse(X(mx),Y(my),Math.hypot(fb[0]-fa[0],fb[1]-fa[1])/2*S,Math.max(2.5,0.24*S),ang,0,6.2832);ctx.fill();
  if(o.fmMark){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(X(mx),Y(my),Math.hypot(fb[0]-fa[0],fb[1]-fa[1])/2*S+5,0.24*S+5,ang,0,6.2832);ctx.stroke();}
  toothRects(ctx,G.teeth.filter(t=>t.up),X,Y,S,lw);
  bone(ctx,G.mand,X,Y,lw);
  toothRects(ctx,G.teeth.filter(t=>!t.up),X,Y,S,lw);}
/* anterior view. (cx,oy) = screen position of the midline at y = 0 */
function drawAnt(ctx,A,cx,oy,S){const X=x=>cx+x*S,Y=y=>oy-y*S,XM=x=>cx-x*S,lw=clamp(S*0.085,1,2.2);
  bone(ctx,A.mand,X,Y,lw);
  bone(ctx,A.vault,X,Y,lw);
  if(A.crest)bone(ctx,A.crest,X,Y,lw,BONE2);
  // temporal hollows below the braincase, then the zygomatic arches
  [1,-1].forEach(s=>{const M=s>0?X:XM,a=A.arch;rr(ctx,Math.min(M(a.x0),M(a.x1)),Y(a.y+a.th/2),Math.abs(M(a.x1)-M(a.x0)),a.th*S,a.th*S/2);ctx.fillStyle=BONE2;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=lw*0.8;ctx.stroke();});
  bone(ctx,A.maxi,X,Y,lw);
  [X,XM].forEach(M=>{path(ctx,A.cheek,M,Y,false);ctx.lineTo(M(A.cheek[A.cheek.length-1][0]),Y(A.cheek[0][1]-1.4));ctx.closePath();ctx.fillStyle=BONE;ctx.fill();path(ctx,A.cheek,M,Y,false);ctx.strokeStyle=INK;ctx.lineWidth=lw;ctx.stroke();});
  // orbits
  const O=A.orbs;[1,-1].forEach(s=>{rr(ctx,X(s*O.ox)-O.w*S/2,Y(O.y)-O.h*S/2,O.w*S,O.h*S,Math.min(O.w,O.h)*S*0.42);ctx.fillStyle=HOLE;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=lw;ctx.stroke();});
  if(A.brow){[X,XM].forEach(M=>{const p=A.brow;path(ctx,spline(p,false,6),M,Y,false);ctx.closePath();ctx.fillStyle=BONE2;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=lw;ctx.stroke();});}
  path(ctx,A.nasal,X,Y);ctx.fillStyle=HOLE;ctx.fill();
  toothRects(ctx,A.teeth,X,Y,S,lw);
  if(A.chin){ctx.strokeStyle=INK;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(X(-1.1),Y(A.mey+0.25));ctx.lineTo(X(0),Y(A.mey+1.2));ctx.lineTo(X(1.1),Y(A.mey+0.25));ctx.stroke();}}

/* ================= helpers ================= */
function hr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
function hn(seed,a,b){const u=Math.max(1e-9,hr(seed,a,b)),w=hr(seed,a,b+100003);return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*w);}
const tw=(ctx,s,size,w)=>{ctx.font=(w||400)+' '+size+'px '+FONT;return ctx.measureText(s).width;};
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const fmtCC=v=>Math.round(v).toLocaleString('en-US');
const SEL=sim=>SPB[sim.p.species]||SPB.sapiens;
/* time axis with a break: 21 to 17 Mya in the first strip, then 4.5 Mya to today */
function tAxis(x0,x1){const w=x1-x0,a1=x0+w*0.11,b0=x0+w*0.15;return {X:a=>a>=10?x0+(21-a)/4*(a1-x0):b0+(4.5-a)/4.5*(x1-b0),brk:[a1,b0]};}
const TICKS=[20,18,4,3,2,1,0];
function breakMark(ctx,x,y){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.6;[-4,4].forEach(d=>{ctx.beginPath();ctx.moveTo(x+d-4,y+7);ctx.lineTo(x+d+4,y-7);ctx.stroke();});}
function pin(ctx,n,ax,ay,dx,dy,k,maxX){const r=Math.max(11,10*k),L=26+9*k;let px=ax+dx*L,py=ay+dy*L;px=clamp(px,r+2,(maxX||800)-r-2);py=clamp(py,r+2,450-r-2);
  ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(px,py);ctx.stroke();
  ctx.fillStyle=PAL['rj'];ctx.beginPath();ctx.arc(ax,ay,3.2,0,6.2832);ctx.fill();ctx.beginPath();ctx.arc(px,py,r,0,6.2832);ctx.fill();
  txt(ctx,String(n),px,py+1,{s:Math.max(12,11*k),w:700,c:'#fff',a:'center',b:'middle'});}
/* greedy label placement: try a few spots around an anchor box, keep the first that hits nothing */
function placeLabel(ctx,s,box,size,taken,bounds,w){const W=tw(ctx,s,size,w||600)+4,Hh=size*1.15,cx=(box[0]+box[2])/2,cy=(box[1]+box[3])/2;
  const cand=[[box[2]+6,cy-Hh/2],[box[0]-6-W,cy-Hh/2],[cx-W/2,box[1]-4-Hh],[cx-W/2,box[3]+4],[box[2]+6,box[1]-Hh],[box[0]-6-W,box[1]-Hh],[box[2]+6,box[3]],[box[0]-6-W,box[3]]];
  const hit=r=>r[0]<bounds[0]||r[1]<bounds[1]||r[0]+r[2]>bounds[2]||r[1]+r[3]>bounds[3]||taken.some(t=>r[0]<t[0]+t[2]&&r[0]+r[2]>t[0]&&r[1]<t[1]+t[3]&&r[1]+r[3]>t[1]);
  for(const c of cand){const r=[c[0],c[1],W,Hh];if(!hit(r)){r.lab=1;taken.push(r);return r;}}
  const labs=taken.filter(t=>t.lab),hit2=r=>r[0]<bounds[0]||r[1]<bounds[1]||r[0]+r[2]>bounds[2]||r[1]+r[3]>bounds[3]||labs.some(t=>r[0]<t[0]+t[2]&&r[0]+r[2]>t[0]&&r[1]<t[1]+t[3]&&r[1]+r[3]>t[1]);
  for(const c of cand){const r=[c[0],c[1],W,Hh];if(!hit2(r)){r.lab=1;taken.push(r);return r;}}
  const r=[clamp(cand[0][0],bounds[0],bounds[2]-W),clamp(cand[0][1],bounds[1],bounds[3]-Hh),W,Hh];r.lab=1;taken.push(r);return r;}
function plate(ctx,r){ctx.globalAlpha=0.85;ctx.fillStyle=PAL['cv-bg'];rr(ctx,r[0],r[1]+1,r[2],r[3]-1,3);ctx.fill();ctx.globalAlpha=1;}

/* ================= Full lab scenes ================= */
const FEAT=[{k:'vault',n:'Braincase',lvl:'bio'},{k:'fore',n:'Forehead',lvl:'bio'},{k:'brow',n:'Brow ridge',lvl:'bio'},{k:'face',n:'Face',lvl:'bio'},{k:'jaw',n:'Jaw and teeth',lvl:'bio'},
  {k:'fm',n:'Foramen magnum',lvl:'honors'},{k:'top',n:'Top of the skull',lvl:'honors'},{k:'back',n:'Back of the skull',lvl:'honors'},{k:'cheek',n:'Cheekbones',lvl:'honors'}];
const featsOn=()=>FEAT.filter(f=>atLeast(f.lvl));
function frontAt(G,y){let best=1e9;G.cran.forEach(p=>{if(Math.abs(p[1]-y)<0.35&&p[0]<G.L*0.5&&p[0]<best)best=p[0];});return best<1e8?best:0;}
function drawSkullScene(sim,ctx,k){const sp=SEL(sim),G=geo(sp,sp.dims),Lg=G.lat,A=G.ant,cmp=!!sim.p.compare&&atLeast('honors')&&sp.id!=='sapiens';
  const Gs=cmp?geo(SPB.sapiens,SPB.sapiens.dims).lat:null;
  let x0=Lg.xmin,x1=Lg.L,y0=Math.min(Lg.ymin,A.ymin),y1=Lg.H;if(Gs){x0=Math.min(x0,Gs.xmin);x1=Math.max(x1,Gs.L);y0=Math.min(y0,Gs.ymin);y1=Math.max(y1,Gs.H);}
  const pins=!!sim.p.labels,top=pins?56+39*k:48+24*k,bot=pins?420-20*k:418,S=Math.min(24,360/(x1-x0),220/(A.hwAll*2),(bot-top)/(y1-y0));
  const ox=255-(x0+x1)/2*S,oy=bot+y0*S,cx=650,l2=30+19*k;
  txt(ctx,sp.sci,20,30,{s:16*k,w:700});
  if(Gs)drawLat(ctx,Gs,ox,oy,S,{ghost:true});
  drawLat(ctx,Lg,ox,oy,S);if(Gs)drawLat(ctx,Gs,ox,oy,S,{ghost:true});
  drawAnt(ctx,A,cx,oy,S);
  txt(ctx,'Side view',255,l2,{s:12*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'Front view',cx,l2,{s:12*k,c:PAL['cv-soft'],a:'center'});
  // 5 cm scale bar
  const sbx=480-5*S,sby=l2-4*k;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sbx,sby);ctx.lineTo(sbx+5*S,sby);ctx.moveTo(sbx,sby-5);ctx.lineTo(sbx,sby+5);ctx.moveTo(sbx+5*S,sby-5);ctx.lineTo(sbx+5*S,sby+5);ctx.stroke();
  txt(ctx,'5 cm',sbx-6,l2,{s:12*k,c:PAL['cv-soft'],a:'right'});
  if(cmp)txt(ctx,'Dashed: modern human',780,30,{s:12*k,c:PAL['cv-soft'],a:'right'});
  if(!pins)return;
  const LX=x=>ox+x*S,LY=y=>oy-y*S,AX=x=>cx+x*S;
  const anchors={vault:[AX(A.hw),LY(A.yE),1,-0.2,800],fore:[LX(frontAt(Lg,Lg.g+0.45*(Lg.Hv-Lg.g))),LY(Lg.g+0.45*(Lg.Hv-Lg.g)),-0.6,-0.8],brow:[LX(Lg.gl[0]),LY(Lg.gl[1]),-1,-0.1],
    face:[LX(Lg.pros[0]),LY(Lg.pros[1]),-1,0.3],jaw:[LX((Lg.me[0]+Lg.go[0])/2),LY(Math.min(Lg.me[1],Lg.go[1])+0.15),0.2,1],
    fm:[LX((Lg.fm.a[0]+Lg.fm.b[0])/2),LY((Lg.fm.a[1]+Lg.fm.b[1])/2),0.55,0.85],top:[LX(Lg.vertex[0]),LY(Lg.vertex[1]),0.35,-1],back:[LX(Lg.occ[0]),LY(Lg.occ[1]),1,-0.3,cx-A.hwAll*S-4],
    cheek:[AX(A.bz),LY(A.arch.y),0.9,0.6,800]};
  featsOn().forEach((f,i)=>{const a=anchors[f.k];if(!a)return;const l=Math.hypot(a[2],a[3]);pin(ctx,i+1,a[0],a[1],a[2]/l,a[3]/l,k,a[4]);});}
function featList(sp){return '<ol class="hom-feat">'+featsOn().map(f=>`<li><b>${f.n}:</b> ${f.k==='fm'?sp.fm+'.':sp.feat[f.k]}</li>`).join('')+'</ol>';}

function drawTimeline(sim,ctx,k){const sel=SEL(sim),T=tAxis(30,770),ay=402,ink=PAL['cv-ink'],soft=PAL['cv-soft'];
  txt(ctx,'When each species lived (millions of years ago)',20,28,{s:15*k,w:700});
  ctx.strokeStyle=soft;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(30,ay);ctx.lineTo(T.brk[0],ay);ctx.moveTo(T.brk[1],ay);ctx.lineTo(778,ay);ctx.stroke();breakMark(ctx,(T.brk[0]+T.brk[1])/2,ay);
  TICKS.forEach(a=>{const x=T.X(a);ctx.beginPath();ctx.moveTo(x,ay);ctx.lineTo(x,ay+6);ctx.stroke();txt(ctx,a?String(a):'Today',x,ay+20+4*k,{s:12*k,c:soft,a:'center'});});
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;[4,3,2,1].forEach(a=>{const x=T.X(a);ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(x,48);ctx.lineTo(x,ay);ctx.stroke();});ctx.setLineDash([]);
  const N=SPEC.length,lh=(ay-58)/N,SI=1.55;
  SPEC.forEach((sp,i)=>{const yc=58+lh*(i+0.5),xa=T.X(sp.from),xb=T.X(sp.to),on=sp===sel;
    ctx.fillStyle=on?PAL['rj']:PAL['s2'];rr(ctx,xa,yc-4,Math.max(6,xb-xa),8,4);ctx.fill();
    const G=geo(sp,sp.dims).lat,iw=(G.L-G.xmin)*SI,ih=(G.H-G.ymin)*SI,mx=(xa+xb)/2,ix=clamp(mx-iw/2,xa-iw*0.3,776-iw);
    drawLat(ctx,G,ix-G.xmin*SI,yc+ih/2+G.ymin*SI,SI);
    const name=sp.short,sz=13*k,w=tw(ctx,name,sz,on?700:500);
    if(sp.from>=10)txt(ctx,name,Math.max(xb,ix+iw)+8,yc+4,{s:sz,w:on?700:500,c:on?PAL['rj']:ink});
    else txt(ctx,name,Math.min(xa,ix)-8,yc+4,{s:sz,w:on?700:500,c:on?PAL['rj']:ink,a:'right'});});}
function overlaps(sp){return SPEC.filter(o=>o!==sp&&o.to<sp.from&&o.from>sp.to);}

function plotBrain(ctx,box,sel,k,big){const L=box.L,R=box.L+box.W,T0=box.T,B=box.T+box.H,T=tAxis(L,R),Y=v=>B-v/1700*(B-T0),soft=big?PAL['cv-soft']:PAL['g-axis'],fs=(big?12:12)*k;
  ctx.strokeStyle=big?PAL['line']:PAL['g-grid'];ctx.lineWidth=1;
  [0,400,800,1200,1600].forEach(v=>{ctx.beginPath();ctx.moveTo(L,Y(v));ctx.lineTo(R,Y(v));ctx.stroke();txt(ctx,v.toLocaleString('en-US'),L-6,Y(v),{s:fs,c:soft,a:'right',b:'middle'});});
  ctx.strokeStyle=soft;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(L,B);ctx.lineTo(T.brk[0],B);ctx.moveTo(T.brk[1],B);ctx.lineTo(R,B);ctx.stroke();breakMark(ctx,(T.brk[0]+T.brk[1])/2,B);
  TICKS.forEach(a=>{const x=T.X(a);txt(ctx,a?String(a):'Today',a?x:x+6,B+15+3*k,{s:fs,c:soft,a:a?'center':'right'});});
  txt(ctx,'Millions of years ago',(L+R)/2+30,B+32+6*k,{s:fs,c:big?soft:PAL['muted'],a:'center'});
  ctx.save();ctx.translate(big?16:14,(T0+B)/2);ctx.rotate(-Math.PI/2);txt(ctx,'Cranial capacity (cc)',0,0,{s:fs,c:big?soft:PAL['muted'],a:'center',b:'middle'});ctx.restore();
  // a chimpanzee for reference
  ctx.strokeStyle=soft;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(T.brk[1],Y(CHIMP.mean));ctx.lineTo(R,Y(CHIMP.mean));ctx.stroke();ctx.setLineDash([]);
  const boxes=SPEC.map(sp=>{const x0=T.X(sp.from),x1=Math.max(T.X(sp.to),x0+7);return [x0,Y(sp.hi),x1,Y(sp.lo),sp];});
  boxes.forEach(b=>{const on=b[4]===sel,c=on?PAL['rj']:PAL['s2'];ctx.globalAlpha=on?0.45:0.28;ctx.fillStyle=c;ctx.fillRect(b[0],b[1],b[2]-b[0],b[3]-b[1]);ctx.globalAlpha=1;ctx.strokeStyle=c;ctx.lineWidth=on?2.5:1.5;ctx.strokeRect(b[0],b[1],b[2]-b[0],b[3]-b[1]);});
  const taken=boxes.map(b=>[b[0]-2,b[1]-2,b[2]-b[0]+4,b[3]-b[1]+4]),bounds=[L+2,T0-2,R+4,B-2],fz=12.5*k;
  {const w=tw(ctx,'Chimpanzee today',12*k,400);taken.push([R-w-4,Y(CHIMP.mean)-6-13*k,w+4,13*k+4]);txt(ctx,'Chimpanzee today',R,Y(CHIMP.mean)-6,{s:12*k,c:soft,a:'right'});}
  boxes.slice().sort((a,b)=>(a[4]===sel)-(b[4]===sel)).reverse().forEach(b=>{const on=b[4]===sel,s=b[4].short,r=placeLabel(ctx,s,b,fz,taken,bounds,on?700:600);plate(ctx,r);txt(ctx,s,r[0]+2,r[1]+r[3]*0.8,{s:fz,w:on?700:600,c:on?PAL['rj']:PAL['cv-ink']});});}
function drawBrainScene(sim,ctx,k){txt(ctx,'Brain size over time',20,28,{s:15*k,w:700});plotBrain(ctx,{L:78,T:52,W:700,H:330-6*k},SEL(sim),k,true);}

function drawFM(sim,ctx,k){const sel=SEL(sim),mid=(sel.id==='proconsul'||sel.id==='sapiens')?SPB.afarensis:sel,list=[SPB.proconsul,mid,SPB.sapiens];
  txt(ctx,'Where the spinal cord leaves the skull',20,28,{s:15*k,w:700});
  list.forEach((sp,j)=>{const cx=135+j*265,G=geo(sp,sp.dims).lat,S=Math.min(15,200/(G.L-G.xmin),150/(G.H-G.ymin)),ox=cx-(G.xmin+G.L)/2*S,oy=72+8*k+G.H*S,on=sp===sel;
    if(on){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;rr(ctx,cx-128,44+8*k,256,322-8*k,10);ctx.stroke();}
    // spine: vertebrae below the foramen magnum, tilted back as the opening moves back
    const fa=G.fm.a,fb=G.fm.b,mx=ox+(fa[0]+fb[0])/2*S,my=oy-(fa[1]+fb[1])/2*S,th=sp.fmA*1.7*Math.PI/180,ux=Math.sin(th),uy=Math.cos(th);
    ctx.save();ctx.beginPath();ctx.rect(cx-126,46+8*k,252,318-8*k);ctx.clip();
    for(let v=0;v<7;v++){const d=(0.9+v*1.25)*S,vx=mx+ux*d,vy=my+uy*d;ctx.save();ctx.translate(vx,vy);ctx.rotate(-th);ctx.fillStyle='#d9ccb0';ctx.strokeStyle='#5a4831';ctx.lineWidth=1.2;rr(ctx,-0.75*S,-0.5*S,1.5*S,1.0*S,3);ctx.fill();ctx.stroke();ctx.restore();}
    ctx.restore();
    drawLat(ctx,G,ox,oy,S,{fmMark:true});
    txt(ctx,sp.short,cx,44+8*k+322-8*k+20+6*k,{s:14*k,w:700,a:'center',c:on?PAL['rj']:PAL['cv-ink']});
    txt(ctx,cap(sp.fmPlain),cx,44+322+20+6*k+18*k,{s:12*k,a:'center',c:PAL['cv-soft']});});}

function drawEQ(sim,ctx,k){const sel=SEL(sim),rows=SPEC.concat([CHIMP]),y0=62+10*k,rh=(410-y0)/rows.length,c1=200,w1=250,c2=520,w2=230,fs=12.5*k;
  txt(ctx,'Brain size',c1,32,{s:13*k,w:700});txt(ctx,'EQ',c2,32,{s:13*k,w:700});
  txt(ctx,'cc',c1,32+16*k,{s:12*k,c:PAL['cv-soft']});txt(ctx,'brain size for body size',c2,32+16*k,{s:12*k,c:PAL['cv-soft']});
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;[[c1,w1,1600,[0,800,1600]],[c2,w2,8,[0,4,8]]].forEach(([x,w,mx,tk])=>tk.forEach(t=>{const X=x+t/mx*w;ctx.beginPath();ctx.moveTo(X,y0-4);ctx.lineTo(X,y0+rh*rows.length);ctx.stroke();}));
  rows.forEach((sp,i)=>{const y=y0+rh*i,on=sp===sel,cc=sp.mean,eq=EQ(cc,sp.body);
    if(on){ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(8,y,784,rh);}
    txt(ctx,sp.short,16,y+rh/2,{s:fs,w:on?700:500,b:'middle',c:on?PAL['rj']:PAL['cv-ink']});
    const b1=cc/1600*w1,b2=eq/8*w2,bh=Math.min(rh-10,16),col=sp===CHIMP?PAL['cv-soft']:on?PAL['rj']:PAL['s2'];
    ctx.fillStyle=col;ctx.fillRect(c1,y+rh/2-bh/2,b1,bh);ctx.fillRect(c2,y+rh/2-bh/2,b2,bh);
    txt(ctx,fmtCC(cc),c1+b1+6,y+rh/2,{s:12*k,b:'middle',c:PAL['cv-ink']});txt(ctx,eq.toFixed(1),c2+b2+6,y+rh/2,{s:12*k,b:'middle',c:PAL['cv-ink']});});
  txt(ctx,'EQ = brain mass ÷ expected brain mass for that body mass',16,440,{s:12*k,c:PAL['cv-soft']});}

const BUSH={proconsul:{x:250,lab:'r'},afarensis:{x:250,lab:'b'},habilis:{x:380,lab:'l'},boisei:{x:700,lab:'l'},ergaster:{x:470,lab:'b'},erectus:{x:580,lab:'r'},neanderthal:{x:320,lab:'l'},sapiens:{x:450,lab:'r'}};
function drawBush(sim,ctx,k){const sel=SEL(sim),soft=PAL['cv-soft'],TY=a=>a<=4.5?60+a/4.5*300:398+(20-a)/2*(-30)+30;
  if(sim.p.ladder&&atLeast('ap'))return drawLadder(sim,ctx,k);
  txt(ctx,'A branching bush (millions of years ago)',20,28,{s:15*k,w:700});
  // time axis
  ctx.strokeStyle=soft;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(70,TY(0));ctx.lineTo(70,TY(4.5));ctx.moveTo(70,TY(18)-12);ctx.lineTo(70,TY(20));ctx.stroke();breakMark(ctx,70,(TY(4.5)+TY(18))/2-6);
  [0,1,2,3,4,18,20].forEach(a=>{const y=a<10?TY(a):TY(a);ctx.beginPath();ctx.moveTo(64,y);ctx.lineTo(70,y);ctx.stroke();txt(ctx,a?String(a):'Today',58,y,{s:12*k,c:soft,a:'right',b:'middle'});});
  const P=(id,a)=>[BUSH[id].x,TY(a)];
  const link=(a,b,dash)=>{ctx.strokeStyle=soft;ctx.lineWidth=2;ctx.setLineDash(dash?[6,5]:[]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.bezierCurveTo(a[0],(a[1]+b[1])/2,b[0],(a[1]+b[1])/2+4,b[0],b[1]);ctx.stroke();ctx.setLineDash([]);};
  const other=[400,TY(0.7)];
  link(P('afarensis',3.0),P('habilis',2.4),true);link(P('afarensis',3.0),P('boisei',2.3),true);link(P('habilis',1.95),P('ergaster',1.9),true);link(P('ergaster',1.85),P('erectus',1.8),true);
  link(P('ergaster',1.45),other,true);link(other,P('neanderthal',0.43),true);link(other,P('sapiens',0.3),true);
  ctx.fillStyle=soft;ctx.beginPath();ctx.arc(other[0],other[1],5,0,6.2832);ctx.fill();
  txt(ctx,'Other Homo species',other[0]-8,other[1]+14+4*k,{s:12*k,c:soft,a:'right'});
  ctx.strokeStyle=soft;ctx.setLineDash([2,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(250,TY(18)-2);ctx.lineTo(250,TY(3.9)+4);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'About 14 million years not shown',262,TY(18)-26-4*k,{s:12*k,c:soft});
  SPEC.forEach(sp=>{const b=BUSH[sp.id],x=b.x,ya=TY(sp.from),yb=TY(sp.to),on=sp===sel,c=on?PAL['rj']:sp.id==='boisei'?PAL['s4']:sp.id==='proconsul'?PAL['s5']:PAL['s2'];
    ctx.fillStyle=c;rr(ctx,x-5,Math.min(ya,yb),10,Math.max(8,Math.abs(ya-yb)),5);ctx.fill();
    if(sp.to>0){ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-10,yb);ctx.lineTo(x+10,yb);ctx.stroke();}
    const s=sp.short,fs=13*k,w=on?700:600;
    if(b.lab==='r')txt(ctx,s,x+12,(ya+yb)/2+4,{s:fs,w,c:on?PAL['rj']:PAL['cv-ink']});
    else if(b.lab==='l')txt(ctx,s,x-12,(ya+yb)/2+4,{s:fs,w,c:on?PAL['rj']:PAL['cv-ink'],a:'right'});
    else txt(ctx,s,x,ya+14+4*k,{s:fs,w,c:on?PAL['rj']:PAL['cv-ink'],a:'center'});});
  txt(ctx,'Dashed lines: likely ancestry, still debated',780,440,{s:12*k,c:soft,a:'right'});}
function drawLadder(sim,ctx,k){txt(ctx,'The ladder myth',20,28,{s:15*k,w:700,c:PAL['s1']});
  const n=SPEC.length;SPEC.forEach((sp,i)=>{const G=geo(sp,sp.dims).lat,S=2.4,x=70+i*88,y=380-i*36;drawLat(ctx,G,x-G.xmin*S,y,S);});
  ctx.strokeStyle=PAL['s1'];ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(60,420);ctx.lineTo(760,70);ctx.moveTo(60,70);ctx.lineTo(760,420);ctx.globalAlpha=0.55;ctx.stroke();ctx.globalAlpha=1;
  txt(ctx,'Not a ladder: species branched, overlapped and died out.',400,440,{s:13*k,w:700,a:'center',c:PAL['s1']});}

/* ================= Virtual lab bench: skull-measure ================= */
const DI={H:0,L:1,W:2},DNAME={H:'height',L:'length',W:'width'},DVIEW={H:'side view',L:'side view',W:'front view'};
const LABMEM={};
function labSkulls(seed){if(LABMEM[seed])return LABMEM[seed];
  const pick=(arr,k)=>arr[Math.min(arr.length-1,Math.floor(hr(seed,k,0)*arr.length))];
  const a=pick(['proconsul','afarensis','boisei'],1),b=pick(['habilis','ergaster','erectus'],2),c=pick(['neanderthal','sapiens'],3);
  const rest=SPEC.map(s=>s.id).filter(x=>x!==a&&x!==b&&x!==c),ids=[a,b,c,pick(rest,4)];
  for(let i=3;i>0;i--){const j=Math.min(i,Math.floor(hr(seed,10+i,0)*(i+1)));const t=ids[i];ids[i]=ids[j];ids[j]=t;}
  return LABMEM[seed]=ids.map((id,i)=>{const s=SPB[id];let d=s.dims.map((v,j)=>v*(1+0.012*hn(seed,20+i,j)));
    const t=s.lo+(0.3+0.4*hr(seed,30+i,0))*(s.hi-s.lo),f=Math.cbrt(t/(d[0]*d[1]*d[2]*0.523));d=d.map(v=>r2(v*f));return {id,sp:s,dims:d};});}
const isBench=sim=>!!(sim&&sim.vlab&&sim.vlab.lab&&sim.vlab.lab.id==='skull-measure'&&sim.st&&sim.st.lab);
function bench(sim){const b=sim.vlab.bench;if(!b.att||typeof b.att!=='object')b.att={};if(!b.jaw||typeof b.jaw!=='object')b.jaw={};if(!b.rd||typeof b.rd!=='object')b.rd={};return b;}
const curD=sim=>{const m=sim.p.meas;return m==='H'||m==='L'||m==='W'?m:null;};
const curI=sim=>clamp(+sim.p.skull||1,1,4);
const attOf=(sim,i,d)=>bench(sim).att[i+d]||1;
/* each seating of a cast differs a little: the calipers land at a slightly different spot (±0.16 cm at most) */
function contactAt(sim,i,d,a){const S=sim.st.lab[i-1];return r2(S.dims[DI[d]]+clamp(0.07*hn(sim.vlab.seed,60+i*3+DI[d],a),-0.16,0.16));}
function jawOf(sim,i,d){const b=bench(sim),c=contactAt(sim,i,d,attOf(sim,i,d)),v=b.jaw[i+d];return Number.isFinite(v)?Math.max(c,v):r2(c+4);}
function readings(sim,i,d){const l=bench(sim).rd[i+d];return Array.isArray(l)?l:[];}
function setJaw(sim,v){const i=curI(sim),d=curD(sim);if(!d)return;const G=calGeo(sim),a=attOf(sim,i,d),c=contactAt(sim,i,d,a),b=bench(sim);
  v=clamp(v,c,G?G.vmax:c+6);if(v-c<0.004)v=c;b.jaw[i+d]=r2(v);
  if(v===c){const l=b.rd[i+d]||(b.rd[i+d]=[]);if(!l.some(r=>r.a===a))l.push({a,v:c});}}
function calGeo(sim,k){if(!isBench(sim))return null;k=k||sim.vis.k||1;const T0=50+14*k,AV=436-T0;const d=curD(sim);if(!d)return null;
  const i=curI(sim),SK=sim.st.lab[i-1],G=geo(SK.sp,SK.dims),Lg=G.lat,A=G.ant,H=SK.dims[0],L=SK.dims[1],W=SK.dims[2];
  const a=attOf(sim,i,d),c=contactAt(sim,i,d,a),o={d,i,a,c,G,SK};
  if(d==='L'){const S=Math.min(24,500/(L+6.5-Lg.xmin),AV/(H+1.4-Lg.ymin)),ox=24-Lg.xmin*S,oy=T0+(H+1.4)*S;
    Object.assign(o,{S,ox,oy,orient:'h',X0:ox,beamY:oy-(H+0.9)*S,tipF:oy-(Math.min(Lg.g,Lg.yO)-0.25)*S,vmax:Math.min(c+6,(530-ox)/S)});o.tipS=o.tipF;}
  else if(d==='W'){const hw=A.hwAll,S=Math.min(24,500/(hw+W/2+6.5),AV/(H+1.4-A.ymin)),cx=24+hw*S,oy=T0+(H+1.4)*S,X0=cx-W/2*S;
    Object.assign(o,{S,ox:cx,oy,orient:'h',X0,beamY:oy-(H+0.9)*S,tipF:oy-(A.yE-0.35)*S,tipS:oy-(A.yE-0.35)*S,vmax:Math.min(c+6,(530-X0)/S)});}
  else{const S=Math.min(24,500/(L+2.6-Lg.xmin),AV/(H+6.5-Lg.ymin)),ox=24-Lg.xmin*S,oy=T0+(H+6.5)*S;
    Object.assign(o,{S,ox,oy,orient:'v',Y0:oy,beamX:ox+(L+1.5)*S,tipF:ox+Lg.basion[0]*S,tipS:ox+Math.min(Lg.basion[0],Lg.vertex[0]-1.2)*S,vmax:Math.min(c+6,(oy-T0+6)/S)});}
  o.v=jawOf(sim,i,d);o.touch=o.v<=c+1e-9;
  o.handle=o.orient==='h'?[o.X0+o.v*o.S+13,o.beamY]:[o.beamX,o.Y0-o.v*o.S-13];
  o.closeTo=o.orient==='h'?[o.X0+(c-1)*o.S+13,o.beamY]:[o.beamX,o.Y0-(c-1)*o.S-13];
  return o;}
function nearJaw(o,x,y){if(o.orient==='h'){const xs=o.X0+o.v*o.S;return x>xs-18&&x<xs+36&&y>o.beamY-24&&y<o.tipS+12;}
  const ys=o.Y0-o.v*o.S;return y>ys-36&&y<ys+18&&x>o.tipS-12&&x<o.beamX+24;}
function bindDrag(sim){const cv=sim.ui&&sim.ui.stage;if(!cv||cv._homDrag)return;cv._homDrag=true;
  const pos=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*800,(e.clientY-r.top)/r.height*450];};
  const val=(o,p)=>o.orient==='h'?(p[0]-13-o.X0)/o.S:(o.Y0-(p[1]+13))/o.S;
  cv.addEventListener('pointerdown',e=>{const o=calGeo(sim);if(!o)return;const p=pos(e);if(!nearJaw(o,p[0],p[1]))return;
    sim.vis.drag={dx:(o.orient==='h'?o.handle[0]-p[0]:o.handle[1]-p[1])};sim.vis.closing=false;try{cv.setPointerCapture(e.pointerId);}catch(err){}e.preventDefault();});
  cv.addEventListener('pointermove',e=>{const o=calGeo(sim);if(!o){cv.style.cursor='';return;}const p=pos(e),dr=sim.vis.drag;
    if(!dr){cv.style.cursor=nearJaw(o,p[0],p[1])?'grab':'';return;}cv.style.cursor='grabbing';e.preventDefault();
    const q=o.orient==='h'?[p[0]+dr.dx,p[1]]:[p[0],p[1]+dr.dx];setJaw(sim,val(o,q));sim.infoDirty=true;});
  const up=()=>{if(sim.vis.drag){sim.vis.drag=null;cv.style.cursor='';}};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);}
const STEEL='#aab3bb',STEEL2='#4a5158';
function drawCalipers(ctx,o,k){const S=o.S,ink=PAL['cv-ink'],soft=PAL['cv-soft'],face=o.touch?PAL['s3']:STEEL2;
  ctx.lineJoin='round';
  if(o.orient==='h'){const y0=o.beamY-11,x0=o.X0,len=(o.vmax+1.2)*S,xs=x0+o.v*S;
    ctx.fillStyle=PAL['cv-ruler'];rr(ctx,x0-16,y0,len+30,22,4);ctx.fill();ctx.strokeStyle=soft;ctx.lineWidth=1.2;ctx.stroke();
    ctx.strokeStyle=ink;ctx.lineWidth=1;for(let m=0;m<=Math.floor((o.vmax+1)*2);m++){const x=x0+m*0.5*S,big=m%2===0;ctx.beginPath();ctx.moveTo(x,y0+22);ctx.lineTo(x,y0+22-(big?10:5));ctx.stroke();if(m%10===0)txt(ctx,String(m/2),x,y0-5,{s:12*k,c:soft,a:'center'});}
    // fixed jaw
    ctx.fillStyle=STEEL;ctx.strokeStyle=STEEL2;ctx.lineWidth=1.3;rr(ctx,x0-18,y0-4,18,30,3);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(x0-11,y0+24);ctx.lineTo(x0,y0+24);ctx.lineTo(x0,o.tipF);ctx.lineTo(x0-4,o.tipF-9);ctx.closePath();ctx.fill();ctx.stroke();
    // sliding jaw with its slider
    ctx.beginPath();ctx.moveTo(xs,y0+24);ctx.lineTo(xs+11,y0+24);ctx.lineTo(xs+4,o.tipS-9);ctx.lineTo(xs,o.tipS);ctx.closePath();ctx.fill();ctx.stroke();
    rr(ctx,xs,y0-5,30,32,4);ctx.fill();ctx.stroke();ctx.strokeStyle=STEEL2;for(let g=0;g<3;g++){ctx.beginPath();ctx.moveTo(xs+11+g*5,y0+2);ctx.lineTo(xs+11+g*5,y0+20);ctx.stroke();}
    ctx.strokeStyle=face;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x0,y0+24);ctx.lineTo(x0,o.tipF);ctx.moveTo(xs,y0+24);ctx.lineTo(xs,o.tipS);ctx.stroke();}
  else{const bx=o.beamX,Y0=o.Y0,len=(o.vmax+1.2)*S,ys=Y0-o.v*S;
    ctx.fillStyle=PAL['cv-ruler'];rr(ctx,bx-11,Y0-len,22,len+16,4);ctx.fill();ctx.strokeStyle=soft;ctx.lineWidth=1.2;ctx.stroke();
    ctx.strokeStyle=ink;ctx.lineWidth=1;for(let m=0;m<=Math.floor((o.vmax+1)*2);m++){const y=Y0-m*0.5*S,big=m%2===0;ctx.beginPath();ctx.moveTo(bx+11,y);ctx.lineTo(bx+11-(big?10:5),y);ctx.stroke();if(m%10===0)txt(ctx,String(m/2),bx+16,y,{s:12*k,c:soft,b:'middle'});}
    ctx.fillStyle=STEEL;ctx.strokeStyle=STEEL2;ctx.lineWidth=1.3;rr(ctx,bx-15,Y0,30,18,3);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(bx-11,Y0);ctx.lineTo(o.tipF,Y0);ctx.lineTo(o.tipF+9,Y0+4);ctx.lineTo(bx-11,Y0+11);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(bx-11,ys);ctx.lineTo(o.tipS,ys);ctx.lineTo(o.tipS+9,ys-4);ctx.lineTo(bx-11,ys-11);ctx.closePath();ctx.fill();ctx.stroke();
    rr(ctx,bx-16,ys-30,32,30,4);ctx.fill();ctx.stroke();ctx.strokeStyle=STEEL2;for(let g=0;g<3;g++){ctx.beginPath();ctx.moveTo(bx-9,ys-21+g*5);ctx.lineTo(bx+9,ys-21+g*5);ctx.stroke();}
    ctx.strokeStyle=face;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(bx-11,Y0);ctx.lineTo(o.tipF,Y0);ctx.moveTo(bx-11,ys);ctx.lineTo(o.tipS,ys);ctx.stroke();}}
/* the magnifier over the caliper scale: 1 mm = 12 px */
function drawLoupe(ctx,o,k){const v=o.v,PX=12,ink=PAL['cv-ink'];
  txt(ctx,'Magnified scale',672,30,{s:13*k,w:700,a:'center'});
  if(o.orient==='h'){const X=556,Yt=44,W=232,H=168,cx=X+W/2,y0=Yt+18,ys=Yt+H-62;
    ctx.fillStyle=PAL['card'];rr(ctx,X,Yt,W,H,10);ctx.fill();ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.stroke();
    ctx.save();rr(ctx,X+2,Yt+2,W-4,H-4,9);ctx.clip();
    ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(X,y0,W,ys-y0-6);ctx.strokeStyle=ink;
    const lo=Math.floor((v-W/2/PX/10)*10)-1,hi=Math.ceil((v+W/2/PX/10)*10)+1;
    for(let m=lo;m<=hi;m++){if(m<0)continue;const x=cx+(m/10-v)*PX*10,cm=m%10===0,h5=m%5===0;ctx.lineWidth=cm?2:1;ctx.beginPath();ctx.moveTo(x,y0);ctx.lineTo(x,y0+(cm?34:h5?24:14));ctx.stroke();
      if(cm)txt(ctx,String(m/10),x,y0+34+14*Math.min(k,1.5)+2,{s:Math.min(16*k,26),w:700,a:'center',c:ink});}
    ctx.fillStyle='rgba(70,78,86,.82)';ctx.fillRect(X,ys,W,H);ctx.fillStyle='#fff';
    ctx.beginPath();ctx.moveTo(cx,ys-2);ctx.lineTo(cx-9,ys+12);ctx.lineTo(cx+9,ys+12);ctx.closePath();ctx.fill();
    txt(ctx,'zero line',cx+14,ys+28,{s:Math.min(12*k,18),c:'#fff',w:600});
    ctx.strokeStyle='#e0352b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,y0);ctx.lineTo(cx,ys+14);ctx.stroke();ctx.restore();
    if(o.touch)pill(ctx,'Touching the skull',672,240,PAL['s3'],'#fff',Math.min(13*k,20));}
  else{const X=592,Yt=44,W=160,H=356,cy=Yt+H/2,x0=X+16,xs=X+W-50;
    ctx.fillStyle=PAL['card'];rr(ctx,X,Yt,W,H,10);ctx.fill();ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.stroke();
    ctx.save();rr(ctx,X+2,Yt+2,W-4,H-4,9);ctx.clip();
    ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(x0,Yt,xs-x0-6,H);ctx.strokeStyle=ink;
    const lo=Math.floor((v-H/2/PX/10)*10)-1,hi=Math.ceil((v+H/2/PX/10)*10)+1;
    for(let m=lo;m<=hi;m++){if(m<0)continue;const y=cy-(m/10-v)*PX*10,cm=m%10===0,h5=m%5===0;ctx.lineWidth=cm?2:1;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0+(cm?34:h5?24:14),y);ctx.stroke();
      if(cm)txt(ctx,String(m/10),x0+40,y,{s:Math.min(16*k,24),w:700,b:'middle',c:ink});}
    ctx.fillStyle='rgba(70,78,86,.82)';ctx.fillRect(xs,Yt,W,H);ctx.fillStyle='#fff';
    ctx.beginPath();ctx.moveTo(xs-2,cy);ctx.lineTo(xs+12,cy-9);ctx.lineTo(xs+12,cy+9);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#e0352b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,cy);ctx.lineTo(xs+14,cy);ctx.stroke();ctx.restore();
    if(o.touch)pill(ctx,'Touching the skull',672,424,PAL['s3'],'#fff',Math.min(13*k,20));}}
function drawBench(sim,ctx,vdt,k){const cv=sim.ui&&sim.ui.stage;bindDrag(sim);sim.vis.k=k;
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  const i=curI(sim),SK=sim.st.lab[i-1],d=curD(sim),G=geo(SK.sp,SK.dims);
  if(cv){const want=d?'none':'';if(cv.style.touchAction!==want)cv.style.touchAction=want;}
  if(!d){txt(ctx,'Skull '+i+' of 4',20,30,{s:16*k,w:700});txt(ctx,'Look at both views. Choose a measurement to use the calipers.',20,30+19*k,{s:12.5*k,c:PAL['cv-soft']});
    const Lg=G.lat,A=G.ant,y0=Math.min(Lg.ymin,A.ymin),top=72+8*k,bot=404,S=Math.min(24,400/(Lg.L-Lg.xmin),250/(A.hwAll*2),(bot-top)/(Lg.H-y0)),ox=250-(Lg.xmin+Lg.L)/2*S,oy=bot+y0*S;
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,oy-y0*S+4,800,450);
    drawLat(ctx,Lg,ox,oy,S);drawAnt(ctx,A,640,oy,S);
    txt(ctx,'Side (lateral) view',250,438,{s:12*k,c:PAL['cv-ink'],a:'center'});txt(ctx,'Front (anterior) view',640,438,{s:12*k,c:PAL['cv-ink'],a:'center'});return;}
  const o=calGeo(sim);
  if(sim.vis.closing&&vdt>0){const nv=o.v-Math.max(0.5,(o.v-o.c)*3)*vdt*1.6;setJaw(sim,nv);if(jawOf(sim,i,d)<=o.c+1e-9)sim.vis.closing=false;o.v=jawOf(sim,i,d);o.touch=o.v<=o.c+1e-9;}
  txt(ctx,'Skull '+i+' · '+cap(DNAME[d])+' · seating '+o.a,20,30,{s:15*k,w:700});
  if(d==='W')drawAnt(ctx,G.ant,o.ox,o.oy,o.S);else drawLat(ctx,G.lat,o.ox,o.oy,o.S);
  drawCalipers(ctx,o,k);drawLoupe(ctx,o,k);}
function benchNarrate(sim){const i=curI(sim),d=curD(sim);
  if(!d)return '<b>Skull '+i+'</b> from the side and from the front. Look at the brow ridge, the forehead, the top and back of the skull, the face, the jaw and the spinal cord opening (foramen magnum) underneath. Choose Height, Length or Width to measure.';
  const o=calGeo(sim),where={H:'down until it rests on the top of the skull',L:'until it touches the back of the skull',W:'until it touches the widest part of the braincase'}[d];
  if(!o.touch)return 'Skull '+i+', '+DNAME[d]+'. <b>Drag the sliding jaw</b> '+where+', or press Close the calipers on the skull.';
  return 'The jaw rests on the skull. <b>Read the magnified scale at the zero line</b>, to the nearest 0.1 cm, and record it as measurement '+Math.min(3,o.a)+' of Skull '+i+'’s '+DNAME[d]+'. Then re-seat the skull and measure again.';}

/* ================= Virtual lab checks (they compare with the bench and never name a species) ================= */
const ROWS=['1','2','3','average'];
function mCheck(i,d){return (sim,rv,v)=>{if(!isBench(sim))return null;const V=sim.vlab;
  if(rv==='average'){const e=[0,1,2].map(r=>V.val('m'+i,d,r)).filter(Number.isFinite);if(e.length<2)return 'Take at least two measurements before you average them.';
    const m=e.reduce((a,b)=>a+b,0)/e.length;if(Math.abs(v-m)<=0.051)return null;return 'Check your average: add your '+DNAME[d]+' measurements for Skull '+i+' and divide by how many you took.';}
  const l=readings(sim,i,d);if(!l.length)return 'Close the calipers on Skull '+i+' ('+DNAME[d]+', '+DVIEW[d]+') first, then read the scale.';
  if(l.some(r=>Math.abs(v-r.v)<=0.1001))return null;
  if(l.some(r=>Math.abs(v/10-r.v)<=0.1001))return 'That looks like millimeters. Record the reading in centimeters.';
  return 'This does not match a caliper reading for Skull '+i+'’s '+DNAME[d]+'. Read the scale at the sliding jaw’s zero line, to the nearest 0.1 cm.';};}
function ccCheck(i){return (sim,v,V)=>{const a=['H','L','W'].map(d=>V.val('m'+i,d,3));if(!a.every(Number.isFinite))return 'Fill in the Average row of the Skull '+i+' table first.';
  const p=a[0]*a[1]*a[2],c=p*0.523;if(Math.abs(v-c)<=Math.max(2,0.01*c))return null;
  if(Math.abs(v-p)<=0.01*p)return 'You found H × L × W. Multiply by 0.523 to get the cranial capacity in cc.';
  return 'Check this against your Skull '+i+' averages: multiply height × length × width × 0.523.';};}
function idCcCheck(sim,rv,v){const V=sim.vlab,k=parseFloat(String(V.raw('k:cc'+rv)).replace(',','.'));
  if(!Number.isFinite(k))return 'Do the Skull '+rv+' calculation first.';if(Math.abs(v-k)<=Math.max(2,0.01*k))return null;return 'Use the cranial capacity from your Skull '+rv+' calculation.';}
const SPOPTS=LAB_ORDER.map(id=>({v:id,l:SPB[id].lab}));
function idSpCheck(sim,rv,v){const V=sim.vlab,sp=SPB[v];if(!sp)return null;
  for(let r=0;r<4;r++){if(String(r+1)!==String(rv)&&V.raw('c:id:sp:'+r)===v)return 'You chose this species for Skull '+(r+1)+' too. Each of your four skulls is a different species.';}
  const cc=V.val('id','cc',(+rv)-1);if(Number.isFinite(cc)&&(cc<sp.lo*0.97||cc>sp.hi*1.03))return 'Skull '+rv+'’s brain size ('+fmtCC(cc)+' cc) is outside the reference-table range for that species. Compare its brain size and features with the table again.';
  return null;}
function ordSk(sim,rv,v){const V=sim.vlab,r0=['1','2','3','4'].indexOf(String(rv));for(let r=0;r<4;r++)if(r!==r0&&V.raw('c:ord:sk:'+r)===v)return 'You listed Skull '+v+' in another row too.';return null;}
function ordAge(sim,rv,v){const V=sim.vlab,r=['1','2','3','4'].indexOf(String(rv)),sk=V.raw('c:ord:sk:'+r);
  if(r>0){const p=V.val('ord','age',r-1);if(Number.isFinite(p)&&v>p+1e-9)return 'The rows run from oldest to most recent, so each age should be smaller than the one above it.';}
  const sp=sk?SPB[V.raw('c:id:sp:'+((+sk)-1))]:null;if(sp&&(v<sp.to*0.9-0.01||v>sp.from*1.1+0.01))return 'That age is outside the reference-table dates for the species you identified as Skull '+sk+'.';
  return null;}
function ordCc(sim,rv,v){const V=sim.vlab,r=['1','2','3','4'].indexOf(String(rv)),sk=V.raw('c:ord:sk:'+r);if(!sk)return 'Choose which skull goes in this row first.';
  const c=V.val('id','cc',(+sk)-1);if(Number.isFinite(c)&&Math.abs(v-c)>Math.max(2,0.01*c))return 'Use the brain size you found for Skull '+sk+' in Part 3.';return null;}
const filledM=(V,i)=>['H','L','W'].every(d=>V.raw('c:m'+i+':'+d+':0').trim()!==''&&V.raw('c:m'+i+':'+d+':1').trim()!=='');

const REFTABLE='<div class="tbl-wrap"><table class="vl-table"><thead><tr><th scope="col">Species</th><th scope="col">Lived</th><th scope="col">Brain size (cc)</th><th scope="col">Key skull features</th></tr></thead><tbody>'+
  LAB_ORDER.map(id=>{const s=SPB[id];return `<tr><th scope="row"><i>${s.lab}</i></th><td>${s.when}</td><td>about ${fmtCC(s.lo)} to ${fmtCC(s.hi)}</td><td>${s.feat.brow} ${s.feat.top} ${s.feat.face} ${s.feat.jaw} Foramen magnum: ${s.fmPlain}.${s.occ==='bun'?' '+s.feat.back:''}</td></tr>`;}).join('')+'</tbody></table></div>';
function measSteps(i){return {title:'Part 1: measure Skull '+i,setup(sim){BioLab.setValues(sim,{skull:i});},
  text:'<p>Choose <b>Skull '+i+'</b> and <b>Height (side)</b>. Drag the sliding jaw of the calipers until it rests firmly on the skull, or press <b>Close the calipers on the skull</b>. Read the magnified scale at the zero line, to the nearest 0.1 cm, and type it as Measurement 1 in the Skull '+i+' table.</p>'+
    '<p>Press <b>Re-seat the skull</b> and measure again for Measurement 2, and a third time if you like. Then do the same for <b>Length (side)</b> and <b>Width (front)</b>.</p><p>Tips: keep the jaws firmly against the skull, read at eye level, and take 2 to 3 measurements of each.</p>',
  done:sim=>filledM(sim.vlab,i),doneHint:sim=>{const V=sim.vlab,m=['H','L','W'].filter(d=>V.raw('c:m'+i+':'+d+':0').trim()===''||V.raw('c:m'+i+':'+d+':1').trim()==='');return m.length?'Record at least two measurements of Skull '+i+'’s '+m.map(d=>DNAME[d]).join(', ')+'.':'';}};}
const LAB_SKULL={id:'skull-measure',title:'Hominid Skull Evolution: Cranial Capacity',course:'Honors Biology',teachers:'Lilyestrom, Powell',
  source:{label:'Hominid Skull Evolution.docx',href:'https://rjhs.instructure.com/courses/15261/assignments/581130'},level:'honors',
  purpose:'<p>Measure four hominid skull casts and calculate their brain size (cranial capacity). Use your results and the skulls’ features to identify each species and to work out their evolutionary order. Brain size is one of the most important indicators paleoanthropologists use to track hominid evolution.</p>',
  background:'<p><b>Part 1: three measurements (cm).</b> <b>Height</b> is the vertical distance from the skull base to the top of the cranium, in the side (lateral) view. <b>Length</b> runs from the front of the forehead to the back of the skull, in the side view. <b>Width</b> is across the widest part of the skull, in the front (anterior) view. Measure firmly against the skull, read at eye level, take 2 to 3 measurements and average them.</p>'+
    '<p><b>Part 2: the formula.</b> Cranial capacity (cc) = Height × Length × Width × 0.523. Example: 12.5 × 18.0 × 14.2 × 0.523 = 1,671 cc. 1 cc = 1 mL.</p>'+
    '<p><b>Part 3: reference data.</b> Your four skulls are four different species from this table. Ranges are approximate published values.</p>'+REFTABLE+
    '<p><b>About the virtual bench.</b> The four skulls are original schematic drawings of casts, not photos. The factor 0.523 is π/6, the volume of an ellipsoid that just fits inside a box of H × L × W. Because you measure the outside of the skull, bone and crests included, the formula overestimates the true brain volume. Like your teacher’s casts, these are scaled so that the formula gives a result inside each species’ range. Each time you re-seat a skull the calipers land on a slightly different spot, so your measurements differ by up to about 0.2 cm, as they would by hand.</p>'+
    '<p>Powell’s sections use the same lab: <a href="https://rjhs.instructure.com/courses/15085/assignments/581067" target="_blank" rel="noopener">Hominid Skull Evolution on Canvas</a>.</p>',
  materials:['Metric ruler or sliding calipers (on the bench: calipers that read to 0.1 cm, with a magnifier)','Four hominid skull casts or images (on the bench: Skulls 1 to 4, side and front views)','Calculator','Reference data from the presentation (the table in Background)'],
  hypothesis:{prompt:'<p>Predict: how will brain size change from the oldest to the most recent of your four specimens? Explain your reasoning.</p>'},
  setup(sim){BioLab.refresh(sim);},
  controls:['skull','meas','hm-close','hm-open','hm-reseat'],
  steps:[{title:'Get set up',text:'<p>Your bench has four mystery skull casts, numbered 1 to 4, and a pair of sliding calipers. Choose a skull under <b>Skull</b>. <b>Look (both views)</b> shows it from the side and the front.</p><p>The reference table for identifying the species is in the Background section below the bench.</p>',setup(sim){BioLab.setValues(sim,{meas:'look'});}},
    {title:'Look at your skulls',text:'<p>Look at each skull in both views before you measure. Notice the brow ridge, the forehead, the top and back of the skull, how far the face juts forward, how thick the jaw is, and where the spinal cord opening (foramen magnum) sits underneath. You will describe three of these features for each skull in Part 3.</p>',setup(sim){BioLab.setValues(sim,{meas:'look'});}},
    measSteps(1),measSteps(2),measSteps(3),measSteps(4),
    {title:'Part 2: calculate brain size',text:'<p>In each Skull table, average your measurements in the <b>Average</b> row. Then, under Calculations, find each skull’s cranial capacity:</p><p><b>Cranial capacity (cc) = H × L × W × 0.523</b></p><p>Use your averages. Example: 12.5 × 18.0 × 14.2 × 0.523 = 1,671 cc.</p>'},
    {title:'Part 3: identify the species',text:'<p>Match each skull to a species using its brain size and the reference table in Background. Look at each skull again, choose 3 features and briefly describe each in the Part 3 table: bony (brow) ridge, sagittal crest, spinal cord opening (foramen magnum position), thickness of the jaw bone (mandible) or flatness of the face.</p>',setup(sim){BioLab.setValues(sim,{meas:'look'});}},
    {title:'Part 4: evolutionary order',text:'<p>Put your four specimens in order from oldest to most recent in the Part 4 table, using the dates in the reference table. Your bar graph of brain size draws from that table. Then answer the analysis questions 4.1 to 4.6.</p>'},
    {title:'Part 5: reflect and conclude',text:'<p>Answer reflection questions 5.1 to 5.3, then write your conclusion. When you are done, turn in your lab.</p>'}],
  tables:[1,2,3,4].map(i=>({id:'m'+i,title:'Part 1: Skull '+i+' measurements (cm)',cols:[{id:'n',label:'Measurement',rows:ROWS,rowLabels:['1','2','3 (optional)','Average']},
      {id:'H',label:'Height (cm)',input:'number',dp:1,check:mCheck(i,'H')},{id:'L',label:'Length (cm)',input:'number',dp:1,check:mCheck(i,'L')},{id:'W',label:'Width (cm)',input:'number',dp:1,check:mCheck(i,'W')}]})).concat([
    {id:'id',title:'Part 3: identify the specimens',cols:[{id:'sk',label:'Skull',rows:['1','2','3','4']},{id:'cc',label:'Brain size (cc)',input:'number',dp:0,check:idCcCheck},
      {id:'sp',label:'Species name',input:'select',options:SPOPTS,check:idSpCheck},{id:'f1',label:'Feature 1',input:'text'},{id:'f2',label:'Feature 2',input:'text'},{id:'f3',label:'Feature 3',input:'text'}]},
    {id:'ord',title:'Part 4: your specimens in evolutionary order',cols:[{id:'o',label:'Order',rows:['1','2','3','4'],rowLabels:['Oldest','2nd','3rd','Most recent']},
      {id:'sk',label:'Skull',input:'select',options:[1,2,3,4].map(n=>({v:String(n),l:'Skull '+n})),check:ordSk},
      {id:'age',label:'Lived about (million years ago)',input:'number',dp:2,check:ordAge},{id:'cc',label:'Brain size (cc)',input:'number',dp:0,check:ordCc}]}]),
  calcs:[1,2,3,4].map(i=>({id:'cc'+i,label:'Skull '+i+': cranial capacity = H × L × W × 0.523',unit:'cc',input:'number',check:ccCheck(i)})),
  graph:{type:'bar',title:'Brain size of your specimens, oldest to most recent',xl:'Evolutionary order',yl:'Cranial capacity (cc)',ymin:0,series:[{table:'ord',x:'o',y:'cc',label:'Brain size'}]},
  questions:[
    {id:'a1',n:'4.1',q:'<p>What is the evolutionary order for your specimens? Explain how you decided.</p>'},
    {id:'a2',n:'4.2',q:'<p>Describe the trend in brain size from your oldest to your most recent specimen. What does it tell us?</p>'},
    {id:'a3',n:'4.3',q:'<p>Did brain size increase in steady progress or in jumps? Use your graph and the dates.</p>'},
    {id:'a4',n:'4.4',q:'<p>Does a larger brain size always mean more success? Explain.</p>'},
    {id:'a5',n:'4.5',q:'<p>Identification confidence: which specimen was easiest to identify, which was hardest, and why?</p>'},
    {id:'a6',n:'4.6',q:'<p>How can features other than brain size help determine evolutionary order and behavior?</p>'},
    {id:'r1',n:'5.1',q:'<p>Reflection: what did you learn about how brain size evolved?</p>'},
    {id:'r2',n:'5.2',q:'<p>How does measuring the skulls yourself help you understand this more than reading about it?</p>'},
    {id:'r3',n:'5.3',q:'<p>Why is brain size so important in paleoanthropology?</p>'}],
  conclusion:{prompt:'<p>Write a claim–evidence–reasoning conclusion that answers the lab question: how did brain size change over hominid evolution, and how did you use it to identify and order your specimens?</p>',cer:true}};

/* ================= the tool ================= */
const OPT=SPEC.map(s=>({v:s.id,l:s.sci}));
const SKULLS={
  id:'hominids',hash:'hominids',apUnit:7,order:5,kind:'Virtual lab',tab:'Hominid skulls',prereq:['cladogram'],
  card:'Measure four mystery skulls, calculate their brain size and place eight hominid species on a 20-million-year timeline.',
  title:'Hominid skulls and brain size',
  lede:{bio:'Compare the skulls of eight hominid species, from an early ape 20 million years ago to us. See how brain size, the face and the brow ridge changed, and when each species lived.',
        honors:'Read the diagnostic features of eight hominid skulls in side and front views, link the foramen magnum to upright walking, and track cranial capacity over 20 million years.',
        ap:'Go past raw brain size: compare encephalization quotients, and see why hominid evolution is a branching bush, not a ladder of progress.'},
  scale:'Real size: a modern human skull is about 17 to 20 cm long, a little more than half a school ruler. The timeline covers 20 million years.',
  timeless:true,thumbFrames:1,trials:true,
  controls:[
    {id:'species',label:'Species',type:'select',def:'sapiens',lvl:'bio',options:OPT},
    {id:'scene',label:'Show',type:'seg',def:'skull',lvl:'bio',noTrial:true,options:[{v:'skull',l:'Skull'},{v:'time',l:'Timeline'},{v:'brain',l:'Brain size'},{v:'fm',l:'Upright walking',lvl:'honors'},{v:'eq',l:'Brain vs body',lvl:'ap'},{v:'bush',l:'Family bush',lvl:'ap'}]},
    {id:'labels',label:'Number the features',type:'toggle',def:true,lvl:'bio',noTrial:true,help:'The list under the simulation describes each numbered feature.'},
    {id:'compare',label:'Outline a modern human skull',type:'toggle',def:false,lvl:'honors',noTrial:true,onChange(s){if(s.p.compare&&s.p.scene!=='skull')BioLab.setValues(s,{scene:'skull'});}},
    {id:'ladder',label:'Show the ladder myth',type:'toggle',def:false,lvl:'ap',noTrial:true,onChange(s){if(s.p.ladder&&s.p.scene!=='bush')BioLab.setValues(s,{scene:'bush'});}},
    // virtual lab bench only
    {id:'skull',label:'Skull',type:'seg',def:1,vlab:true,noTrial:true,options:[1,2,3,4].map(n=>({v:n,l:'Skull '+n}))},
    {id:'meas',label:'Measure',type:'seg',def:'look',vlab:true,noTrial:true,options:[{v:'look',l:'Look (both views)'},{v:'H',l:'Height (side)'},{v:'L',l:'Length (side)'},{v:'W',l:'Width (front)'}],onChange(s){if(s.vis)s.vis.closing=false;}}
  ],
  actions:[
    {id:'older',label:'Older species',run(s){const i=SEL(s).i;BioLab.setValues(s,{species:SPEC[Math.max(0,i-1)].id});}},
    {id:'newer',label:'More recent species',run(s){const i=SEL(s).i;BioLab.setValues(s,{species:SPEC[Math.min(SPEC.length-1,i+1)].id});}},
    {id:'hm-close',label:'Close the calipers on the skull',primary:true,vlab:true,enabled:s=>{const o=calGeo(s);return !!o&&!o.touch&&!s.vis.closing;},run(s){if(calGeo(s))s.vis.closing=true;}},
    {id:'hm-open',label:'Open the calipers',vlab:true,enabled:s=>{const o=calGeo(s);return !!o&&o.v<o.c+2;},run(s){const o=calGeo(s);if(!o)return;s.vis.closing=false;setJaw(s,o.c+3);}},
    {id:'hm-reseat',label:'Re-seat the skull for a new measurement',vlab:true,enabled:s=>!!calGeo(s),
     run(s){const o=calGeo(s);if(!o)return;const b=bench(s);s.vis.closing=false;b.att[o.i+o.d]=o.a+1;b.jaw[o.i+o.d]=r2(contactAt(s,o.i,o.d,o.a+1)+4);}}
  ],
  labs:[LAB_SKULL],
  benchRead(sim){if(!isBench(sim))return null;const d=curD(sim),i=curI(sim);if(!d)return {skull:i,meas:'look'};const o=calGeo(sim);
    return {skull:i,meas:d,attempt:o.a,jaw:o.v,contact:o.touch,reading:o.touch?o.c:null,handle:o.handle,closeTo:o.closeTo,readings:readings(sim,i,d).map(r=>r.v)};},
  testKey(sim){return isBench(sim)?sim.st.lab.map(s=>s.id):null;},
  init(sim){const s={};if(sim&&sim.vlab&&sim.vlab.lab&&sim.vlab.lab.id==='skull-measure')s.lab=labSkulls(sim.vlab.seed);return s;},
  step(){},
  metrics:[
    {id:'cc',label:'Typical brain size',unit:'cc',lvl:'bio',min:0,max:1700,d:0,get:s=>SEL(s).mean},
    {id:'you',label:'Compared with yours',unit:'%',lvl:'bio',min:0,max:120,d:0,get:s=>SEL(s).mean/1350*100},
    {id:'mya',label:'Middle of its time range',unit:'million years ago',lvl:'bio',min:0,max:20,d:2,get:s=>SEL(s).mya},
    {id:'when',label:'Lived',text:true,lvl:'bio',noTrial:true,get:s=>cap(SEL(s).when)},
    {id:'fmw',label:'Foramen magnum',text:true,lvl:'honors',noTrial:true,get:s=>SEL(s).fm},
    {id:'body',label:'Body mass',unit:'kg',lvl:'ap',min:0,max:80,d:0,get:s=>SEL(s).body},
    {id:'eq',label:'Encephalization quotient (EQ)',unit:'',lvl:'ap',min:0,max:8,d:1,get:s=>EQ(SEL(s).mean,SEL(s).body)}
  ],
  graphs:[{id:'bt',label:'Brain size vs time',lvl:'bio',custom:true}],defaultGraph:'bt',
  plot(sim,ctx,box){plotBrain(ctx,{L:box.L+6,T:box.T+4,W:box.W-6,H:box.H-14},SEL(sim),1,false);},
  infoPanel(sim){if(isBench(sim))return '';const sp=SEL(sim),sc=sim.p.scene;
    if(sc==='time'){const o=overlaps(sp);return `<h3>${sp.sci}</h3><p>Lived ${sp.when}.</p><p>${o.length?'It shared the planet with '+o.map(x=>'<i>'+x.sci+'</i>').join(', ')+'.':'No other species in this set lived at the same time.'}</p><p>Several hominid species often lived at the same time. Each did not simply turn into the next.</p>`;}
    if(sc==='brain'){return `<h3>What changed over time</h3><div class="tbl-wrap"><table><thead><tr><th>Feature</th><th>Early (Proconsul, A. afarensis)</th><th>H. erectus</th><th>H. sapiens</th></tr></thead><tbody>
      <tr><td>Brain size</td><td>150 to 550 cc</td><td>850 to 1,100 cc</td><td>1,200 to 1,500 cc</td></tr><tr><td>Forehead</td><td>Low and sloping</td><td>Flat and receding</td><td>Vertical</td></tr>
      <tr><td>Brow ridge</td><td>None to moderate</td><td>Thick bar</td><td>Small</td></tr><tr><td>Face</td><td>Juts far forward</td><td>Juts forward less</td><td>Flat, under the forehead</td></tr>
      <tr><td>Jaw and teeth</td><td>Large, thick, big canines, no chin</td><td>Smaller, no chin</td><td>Small, with a chin</td></tr><tr><td>Foramen magnum</td><td>Toward the back (Proconsul), farther forward (A. afarensis)</td><td>Under the skull</td><td>Under the skull</td></tr></tbody></table></div>`;}
    if(sc==='fm')return `<h3>The foramen magnum and upright walking</h3><p>The spinal cord leaves the skull through the foramen magnum. In an animal that walks on four limbs, the spine runs back from the skull, so the opening sits toward the back and faces backward. In an upright walker, the head balances on top of a vertical spine, so the opening sits under the skull and faces down.</p><p><i>${sp.sci}</i>: ${sp.fm.toLowerCase()}.</p><p>Fossils show the foramen magnum moved forward millions of years before brains grew large: upright walking came first.</p>`;
    if(sc==='eq'){const rows=SPEC.concat([CHIMP]).map(x=>`<tr><td>${x.sci?'<i>'+x.sci+'</i>':x.short}</td><td>${fmtCC(x.mean)}</td><td>${x.body}</td><td>${EQ(x.mean,x.body).toFixed(1)}</td></tr>`).join('');
      return `<h3>Encephalization quotient</h3><p>A bigger animal needs a bigger brain just to run a bigger body. EQ compares a brain with the brain size expected for a typical mammal of the same body mass, about 0.12 × (body mass in grams)<sup>2/3</sup> grams. EQ = 1 is average for a mammal.</p><div class="tbl-wrap"><table><thead><tr><th>Species</th><th>Brain (cc)</th><th>Body (kg)</th><th>EQ</th></tr></thead><tbody>${rows}</tbody></table></div><p>Body masses are rough estimates from fossils, so these EQs are approximate.</p>`;}
    if(sc==='bush')return `<h3>A bush, not a ladder</h3><p>A common picture shows a line of ancestors marching toward us, each step brainier than the last. The fossils show a branching bush instead. <i>Paranthropus boisei</i> lived alongside early <i>Homo</i> and died out without descendants. Neanderthals had larger brains than ours, and they lived at the same time as <i>Homo sapiens</i>.</p><p>Exactly who descended from whom is still debated, so the dashed links are likely ancestry, not certainties.</p>`;
    return `<h3>${sp.sci}</h3><p>Lived ${sp.when}. Typical brain size about ${fmtCC(sp.mean)} cc (range ${fmtCC(sp.lo)} to ${fmtCC(sp.hi)} cc).</p>${sim.p.labels?featList(sp):'<p>Turn on <b>Number the features</b> to see each feature described.</p>'}`;},
  narrate(sim){if(isBench(sim))return benchNarrate(sim);const sp=SEL(sim),sc=sim.p.scene,pct=Math.round(sp.mean/1350*100);
    if(sc==='time'){const o=overlaps(sp);return '<b>'+sp.short+'</b> lived '+sp.when+'. '+(o.length?'It overlapped with '+o.map(x=>x.short).join(', ')+'. Several hominid species often lived at the same time.':'No other species in this set lived at the same time. About 14 million years separate it from the next one.');}
    if(sc==='brain')return sp.id==='proconsul'?'Proconsul’s brain was about 160 cc. <b>For over 1.5 million years after upright walking began, hominid brains stayed under about 550 cc</b>, then they grew in the genus Homo.':
      '<b>'+sp.short+'</b>: about '+fmtCC(sp.mean)+' cc. '+(sp.mean<600?'Upright walking came first: brains stayed small, near a chimpanzee’s, for over 1.5 million years.':sp.id==='neanderthal'?'Neanderthal brains were as large as ours or larger, so the trend did not march straight to us.':'In the genus Homo, brain size roughly tripled over about 2 million years.');
    if(sc==='fm')return '<b>'+sp.short+'</b>: the foramen magnum sits '+sp.fmPlain+'. '+(sp.id==='proconsul'?'The spine ran back from the skull, as in an animal on four limbs.':'The head balanced on top of an upright spine, a sign of walking on two legs.');
    if(sc==='eq'){const e=EQ(sp.mean,sp.body);return '<b>'+sp.short+'</b>: brain about '+fmtCC(sp.mean)+' cc for a body of about '+sp.body+' kg, so EQ ≈ '+e.toFixed(1)+'. '+(sp.id==='neanderthal'?'A bigger brain than ours, but a heavier body too, so its EQ is about the same as ours.':e>6?'That is about 7 times the brain expected for a mammal of its size.':'Brain size grew faster than body size in later Homo.');}
    if(sc==='bush')return sim.p.ladder&&atLeast('ap')?'<b>The ladder is a misconception.</b> Species did not line up one after another toward us. Many lived side by side, and most branches died out.':'<b>Each bar is one species.</b> Paranthropus boisei is a side branch that died out. Neanderthals and Homo sapiens are sister branches, not a step and its successor.';
    return '<b>'+sp.short+'</b>, '+sp.when+': brain about '+fmtCC(sp.mean)+' cc, '+pct+'% of yours. '+sp.key;},
  draw(sim,ctx,vdt,k){if(isBench(sim)){drawBench(sim,ctx,vdt,k);return;}
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const cv=sim.ui&&sim.ui.stage;if(cv&&cv.style.touchAction)cv.style.touchAction='';
    const sc=sim.p.scene;if(sc==='time')drawTimeline(sim,ctx,k);else if(sc==='brain')drawBrainScene(sim,ctx,k);else if(sc==='fm'&&atLeast('honors'))drawFM(sim,ctx,k);
    else if(sc==='eq'&&atLeast('ap'))drawEQ(sim,ctx,k);else if(sc==='bush'&&atLeast('ap'))drawBush(sim,ctx,k);else drawSkullScene(sim,ctx,k);},
  thumbSetup(sim){sim.p.scene='time';sim.p.species='erectus';},
  onChallenge(sim,ch,phase){if(ch&&ch.show&&phase==='ask'){const base={compare:false,ladder:false,labels:true};BioLab.setValues(sim,Object.assign(base,ch.show));}},
  challengeTitle:'Predict, then check',
  challenges:[
    {lvl:'bio',instant:true,show:{scene:'skull',species:'boisei'},q:'Paranthropus boisei has a huge jaw and a tall crest on top of its skull. Which part of a skull tells you how big the brain was?',
     choices:['The size of the jaw','The size of the braincase, the rounded part that holds the brain','The height of the crest on top'],correct:1,
     explain:'Only the braincase (cranial vault) holds the brain. A big jaw or crest makes a skull look large, but it is bone for chewing muscles. P. boisei’s braincase held only about 520 cc, much less than yours.'},
    {lvl:'bio',instant:true,show:{scene:'brain',species:'afarensis'},q:'Australopithecus afarensis (Lucy’s species) already walked upright. How big was its brain?',
     choices:['About the size of a chimpanzee’s, near 450 cc','About the size of ours, near 1,350 cc','Smaller than Proconsul’s'],correct:0,
     explain:'Its brain was about 450 cc, close to a chimpanzee’s 390 cc. Upright walking came first. Brains stayed small for over a million and a half years before they grew in the genus Homo.'},
    {lvl:'bio',instant:true,show:{scene:'time',species:'habilis'},q:'Did each hominid species turn into the next one, so that only one species lived at a time?',
     choices:['Yes, each species replaced the one before it','No, several species often lived at the same time'],correct:1,
     explain:'Look at the timeline: Homo habilis, Paranthropus boisei, Homo ergaster and Homo erectus all lived around 1.5 to 2 million years ago. Neanderthals and Homo sapiens also overlapped.'},
    {lvl:'honors',instant:true,show:{scene:'fm',species:'afarensis'},q:'In Proconsul the foramen magnum sits toward the back. In A. afarensis it sits farther forward, under the skull. What does that tell you?',
     choices:['A. afarensis had a much bigger brain','A. afarensis held its head on top of an upright spine, so it walked on two legs','A. afarensis had a stronger bite'],correct:1,
     explain:'The spinal cord exits through the foramen magnum. When it sits under the skull, the head balances on a vertical spine, the posture of an upright walker. A. afarensis did this with a brain of only about 450 cc.'},
    {lvl:'honors',instant:true,show:{scene:'skull',species:'boisei'},q:'What was the tall sagittal crest on Paranthropus boisei for?',
     choices:['Holding a larger brain','Anchoring very large chewing muscles that ran up the sides of the skull','Protecting the eyes'],correct:1,
     explain:'The temporalis muscles that close the jaw attach along the crest. Huge muscles needed more bone to attach to, which fits its massive jaw and giant molars for tough plant food. Its braincase was small.'},
    {lvl:'honors',instant:true,show:{scene:'skull',species:'erectus'},q:'The lab formula multiplies the outside height, length and width by 0.523. Compared with the real brain volume, the answer is…',
     choices:['About exact','An overestimate, because it includes bone and treats the outside of the skull as an ellipsoid','An underestimate, because skulls have holes'],correct:1,
     explain:'0.523 is π/6, the volume of an ellipsoid inside a box of H × L × W. Outside measurements include the thickness of the bone, brow ridges and crests, so the result is too large unless the casts are scaled, as your teacher’s are.'},
    {lvl:'ap',instant:true,show:{scene:'eq',species:'neanderthal'},q:'Neanderthal brains (about 1,450 cc) were larger than ours (about 1,350 cc). How do the two compare once you allow for body size (EQ)?',
     choices:['Neanderthals had a much higher EQ','About the same, because Neanderthals also had heavier bodies','Neanderthals had a much lower EQ'],correct:1,
     explain:'Neanderthals were stockier, about 72 kg compared with about 62 kg in this model. Their EQ comes out near 7.0 and ours near 7.2. Raw brain size alone does not rank species.'},
    {lvl:'ap',instant:true,show:{scene:'bush',species:'boisei'},q:'Paranthropus boisei lived after Lucy’s species and had a slightly bigger brain. Is it one of our ancestors?',
     choices:['Yes, it is the step between Australopithecus and Homo','No, it is a side branch that lived alongside early Homo and died out','Yes, because any later species is more advanced'],correct:1,
     explain:'P. boisei and early Homo both lived around 2 million years ago, on separate branches. Its huge jaws and teeth were specialized for chewing, a different path, and it left no descendants. Later does not mean more advanced.'}],
  tour:[
    {title:'Two views of one skull',text:'This is a modern human skull, <i>Homo sapiens</i>, from the side (lateral view) and the front (anterior view). The rounded upper part, the braincase or cranial vault, holds the brain.',focus:[0,40,800,410],pause:true,setup(sim){BioLab.setValues(sim,{scene:'skull',species:'sapiens',labels:true,compare:false,ladder:false});}},
    {title:'Brain size',text:'Cranial capacity is the volume inside the braincase, in cubic centimeters (1 cc = 1 mL). Yours is about 1,350 cc. Lucy’s species, <i>Australopithecus afarensis</i>, had about 450 cc, close to a chimpanzee.',focus:[0,40,800,410],pause:true,setup(sim){BioLab.setValues(sim,{species:'afarensis'});}},
    {title:'Brow ridge and forehead',text:'<i>Homo erectus</i> has a thick bar of bone above the eyes, the brow ridge, and a flat forehead that slopes back. Your forehead rises nearly straight up and your brow ridge is small.',focus:[0,40,480,410],pause:true,setup(sim){BioLab.setValues(sim,{species:'erectus'});}},
    {title:'Face and jaw',text:'<i>Paranthropus boisei</i> has a wide, flat face, a massive jaw with huge molars and a sagittal crest on top for its chewing muscles. A face that juts forward like this is called prognathic.',focus:[0,40,800,410],pause:true,setup(sim){BioLab.setValues(sim,{species:'boisei'});}},
    {title:'When they lived',text:'Each bar shows when a species lived, from Proconsul about 20 million years ago to today. Several species often lived at the same time.',focus:[0,40,800,410],pause:true,setup(sim){BioLab.setValues(sim,{scene:'time',species:'habilis'});}},
    {title:'Brain size over time',text:'Each box spans a species’ dates and its range of brain sizes. Brains stayed small for over 1.5 million years after upright walking began, then grew in the genus <i>Homo</i>.',focus:[60,40,740,410],pause:true,setup(sim){BioLab.setValues(sim,{scene:'brain',species:'erectus'});}},
    {lvl:'honors',title:'Walking upright',text:'The foramen magnum is where the spinal cord leaves the skull. It sits toward the back in Proconsul, a four-limbed climber, and under the skull in upright walkers.',focus:[0,40,800,410],pause:true,setup(sim){BioLab.setValues(sim,{scene:'fm',species:'afarensis'});}},
    {lvl:'ap',title:'A bush, not a ladder',text:'Hominid evolution branched. <i>Paranthropus boisei</i> is a side branch that died out, and Neanderthals, with brains larger than ours, were a sister branch of <i>Homo sapiens</i>.',focus:[0,40,800,410],pause:true,setup(sim){BioLab.setValues(sim,{scene:'bush',species:'boisei'});}}],
  onTourExit(sim){BioLab.setValues(sim,{scene:'skull',species:'sapiens',ladder:false,compare:false});},
  lab:{bio:'<p><b>Question:</b> How did brain size change over the last 4 million years?</p><ol><li>Choose each species in turn and press <b>Record trial</b>. The table saves its typical brain size and the middle of its time range.</li><li>On the Trials graph, plot the middle of the time range (x) against brain size (y).</li></ol><p>Describe the pattern. When did brains start to grow quickly?</p>',
       honors:'<p><b>Question:</b> Which skull features changed along with upright walking and brain size?</p><ol><li>For each species, record a trial and note the brow ridge, forehead, face, jaw and foramen magnum from the numbered list.</li><li>Use <b>Upright walking</b> to compare where the foramen magnum sits.</li><li>Plot brain size against time on the Trials graph.</li></ol><p>Which changed first: the foramen magnum or brain size? Use two species as evidence.</p>',
       ap:'<p><b>Question:</b> Does a bigger brain mean a more successful species?</p><ol><li>Record a trial for all eight species: brain size, body mass and EQ.</li><li>Plot brain size and then EQ against time.</li><li>Use <b>Family bush</b> to see which species overlapped and which branches ended.</li></ol><p><b>Claim–evidence–reasoning:</b> Compare Neanderthals with <i>Homo sapiens</i>, and <i>Paranthropus boisei</i> with early <i>Homo</i>.</p>'},
  terms:[{t:'Hominid',d:'In this lab, humans and our extinct close relatives. Many scientists now call this group the hominins and use hominid for all great apes.'},
    {t:'Cranial capacity',d:'The volume inside the braincase, in cubic centimeters (cc). 1 cc = 1 mL.'},{t:'Braincase (cranial vault)',d:'The rounded part of the skull that holds the brain.'},
    {t:'Brow ridge',d:'A bar of bone above the eye sockets. Thick in Homo erectus, small in Homo sapiens.'},{t:'Fossil cast',d:'A copy of a fossil, made from a mold, that scientists and students can measure and handle.'},
    {lvl:'honors',t:'Foramen magnum',d:'The opening in the base of the skull where the spinal cord leaves. Its position shows how the head sat on the spine.'},
    {lvl:'honors',t:'Bipedalism',d:'Walking upright on two legs.'},{lvl:'honors',t:'Sagittal crest',d:'A ridge of bone along the top of the skull where large chewing muscles attach.'},
    {lvl:'honors',t:'Prognathism',d:'A face and jaw that jut forward, beyond the forehead.'},{lvl:'honors',t:'Mandible',d:'The lower jaw bone.'},
    {lvl:'honors',t:'Occipital bun',d:'A bulge at the back of the skull, typical of Neanderthals.'},
    {lvl:'ap',t:'Encephalization quotient (EQ)',d:'Brain mass divided by the brain mass expected for a typical mammal of the same body mass.'},
    {lvl:'ap',t:'Side branch',d:'A lineage that split off and died out without leaving living descendants, such as Paranthropus.'},
    {lvl:'ap',t:'Paleoanthropology',d:'The study of human evolution from fossils, tools and other evidence.'}],
  about:'<p><b>The skulls.</b> All skull drawings are original schematics, not tracings or photos. Each is built from a few proportions: braincase height, length and width, the height of the brow and glabella, how far the face juts forward, the position and tilt of the foramen magnum, jaw depth and the size of any crest. They show the diagnostic features in relative terms but leave out much real detail.</p>'+
    '<p><b>The numbers.</b> Dates and cranial-capacity ranges are the approximate published values used in the Honors Biology handout. New fossils keep revising them. Typical values are rounded means. Body masses are approximate averages of male and female estimates (McHenry 1992; Ruff, Trinkaus and Holliday 1997), so EQ values are rough. EQ uses Jerison’s (1973) expected brain mass for a mammal, 0.12 × (body mass in g)<sup>2/3</sup>, with brain mass taken as about 1 g per cc. Other formulas give different numbers but a similar ranking. The chimpanzee reference is about 390 cc and 45 kg.</p>'+
    '<p><b>The tree.</b> Proconsul was an early ape that lived near the base of the ape family tree. It is shown for comparison, not as a known human ancestor. Many scientists treat Homo ergaster as the African form of Homo erectus. The dashed links on the family bush are likely relationships that are still debated. Homo neanderthalensis is also written Homo sapiens neanderthalensis.</p>'+
    '<p><b>The virtual lab.</b> Each mystery skull is one of the eight species with slightly varied proportions. Its outside height, length and width are set so that H × L × W × 0.523 falls in the middle part of that species’ published range. Each seating of a skull moves the calipers’ contact point by a random amount up to 0.16 cm, seeded per student, so repeated measurements differ a little. The formula treats the braincase as an ellipsoid from outside dimensions, which overestimates real brain volume; the scaled casts correct for that.</p>'
};
BioLab.addPractical({hominids:{
  hook:'Your brain is about 1,350 cc, a bit less than a 1.5 L water bottle. Lucy’s species walked upright 3.2 million years ago. Was its brain closer in size to yours or to a chimpanzee’s (about 390 cc)? And when did hominid brains start to grow?',
  answer:'Closer to a chimpanzee’s: about 450 cc. Its foramen magnum had already moved under the skull, so it walked upright with a small brain. Brains stayed under about 550 cc until about 2 million years ago, then grew to about 600 cc in Homo habilis, about 1,000 cc in Homo erectus and about 1,350 cc in us.',
  uses:['Fossil discoveries: in 2013 cavers in South Africa found over 1,500 bones of Homo naledi. Its brain was only about 560 cc, yet it lived about 300,000 years ago, when early Homo sapiens was alive.',
    'Pediatric checkups: a newborn’s brain is about a quarter of its adult size and doubles in the first year, so doctors measure head circumference at every visit to catch growth problems early.',
    'Childbirth: a big-brained baby must pass through a pelvis shaped for upright walking. That tight fit is one reason human births are harder than chimpanzee births.'],
  takeaway:'Upright walking came millions of years before big brains, and human evolution is a branching bush: several hominid species often lived at the same time, and many branches, like Paranthropus and the Neanderthals, ended.',
  lede:'Compare the skulls of eight hominid species, from an early ape 20 million years ago to us. See how brain size, the face and the brow ridge changed, and when each species lived.',
  tour:['This is a skull like yours, drawn from the side and from the front. The rounded top part, the braincase, holds your brain, the way a helmet holds your head.',
    'Brain size is measured as the space inside the braincase, in cubic centimeters. Yours is about 1,350 cc, almost a 1.5 L bottle. Lucy’s species had about 450 cc, about a can and a half of soda.',
    '<i>Homo erectus</i> has a thick bar of bone above the eyes, the brow ridge, and a forehead that slopes back like a ramp. Your forehead goes nearly straight up.',
    'This species, <i>Paranthropus boisei</i>, has a huge jaw and a ridge of bone on top of the skull, like a mohawk made of bone. Big chewing muscles attached there for chewing tough plants.',
    'Each bar shows when a species lived, from about 20 million years ago to today. Several species often lived at the same time, like neighbors, not one after another.',
    'Each box shows when a species lived and how big its brain was. Brains stayed small for a long time after hominids started walking upright, then grew quickly in our genus, Homo.']}});
BioLab.register(SKULLS);
})();
