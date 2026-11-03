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

/* ================= exports for the rest of the file ================= */
const HOM={SPEC,SPB,geo,drawLat,drawAnt};
window.__HOM=HOM;
})();
