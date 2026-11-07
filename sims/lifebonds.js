(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;

/* Atoms and bonds in living things. Four views:
   Atom: Bohr model of one atom of C, H, N, O, P, S, Na or Cl, three isotopes each, with half-life decay for radioactive ones.
   Build: give C, N or O hydrogens until its outer shell holds 8 electrons (Lewis model).
   Molecules: inspect 8 small molecules. Bond type comes from the electronegativity difference (Pauling scale):
     under 0.4 nonpolar covalent, 0.4 to 1.8 polar covalent, over 1.8 ionic (OpenStax Chemistry 2e, Figure 7.8).
   Between molecules: hydrogen bonds in water, DNA base pairs and a protein beta-sheet, and oil drops in water.
   Bond energies (kJ/mol): OpenStax Chemistry 2e Table 7.2; NaCl lattice energy 769 kJ/mol (OpenStax 7.5);
   hydrogen bond in water about 23 kJ/mol (Suresh & Naik 2000, quoted by Chaplin 2007). */

const EN={H:2.20,C:2.55,N:3.04,O:3.44,P:2.19,S:2.58,Na:0.93,Cl:3.16};
const COL={H:'#f4f6f8',C:'#4b515c',N:'#3f6fb0',O:'#d64545',P:'#df741a',S:'#b8920f',Na:'#8e5bd1',Cl:'#3c9d4b'};
const RAD={H:15,C:22,N:21,O:21,P:24,S:24,Na:17,Cl:24};
const SUBS={'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'};
const sub=n=>String(n).split('').map(c=>SUBS[c]).join('');
const fq=x=>Number(x.toFixed(2)).toLocaleString('en-US',{maximumFractionDigits:2});
/* Isotopes: index 0 is the most common. hl = half-life (rounded to what we show), u = its unit. */
const EL={
  H:{name:'Hydrogen',Z:1,sh:[1],bonds:'1',found:'Water and all four kinds of macromolecule',pull:'weak',
    iso:[{A:1,ab:'more than 99.98% of hydrogen atoms'},{A:2,nick:'deuterium',ab:'about 0.01% of hydrogen atoms',use:'Water made with H-2 and O-18 lets researchers measure how much energy a person burns over 1 to 3 weeks.'},
         {A:3,nick:'tritium',hl:12.3,u:'years',use:'Thymidine, a DNA building block, made with H-3 marks the cells that are copying their DNA.'}]},
  C:{name:'Carbon',Z:6,sh:[2,4],bonds:'4',found:'The backbone of all four kinds of macromolecule',pull:'medium',
    iso:[{A:12,ab:'about 98.9% of carbon atoms'},{A:13,ab:'about 1.1% of carbon atoms',use:'Breath tests use urea made with C-13 to detect H. pylori, a stomach bacterium linked to ulcers.'},
         {A:14,hl:5700,u:'years',use:'Melvin Calvin’s team fed algae CO₂ made with C-14 and traced the carbon into sugars. C-14 also dates remains up to about 50,000 years old.'}]},
  N:{name:'Nitrogen',Z:7,sh:[2,5],bonds:'3',found:'Proteins (every amino acid) and nucleic acids (the bases)',pull:'strong',
    iso:[{A:14,ab:'about 99.6% of nitrogen atoms'},{A:15,ab:'about 0.4% of nitrogen atoms',use:'In 1958 Meselson and Stahl grew bacteria on N-15 to show how DNA copies itself.'},
         {A:13,hl:9.97,u:'minutes',use:'PET scans use ammonia made with N-13 to map blood flow in the heart.'}]},
  O:{name:'Oxygen',Z:8,sh:[2,6],bonds:'2',found:'Water and all four kinds of macromolecule',pull:'very strong',
    iso:[{A:16,ab:'about 99.76% of oxygen atoms'},{A:18,ab:'about 0.2% of oxygen atoms',use:'In 1941, water made with O-18 showed that the O₂ plants release comes from water, not from CO₂.'},
         {A:15,hl:122,u:'seconds',use:'PET scans use water made with O-15 to map blood flow in the brain.'}]},
  P:{name:'Phosphorus',Z:15,sh:[2,8,5],bonds:'In phosphate it bonds to 4 O atoms',found:'Nucleic acids, ATP and phospholipids',pull:'weak',
    iso:[{A:31,ab:'100% of natural phosphorus'},{A:32,hl:14.3,u:'days',use:'In 1952 Hershey and Chase tagged virus DNA with P-32. Most of it went into the bacteria, which showed that DNA carries the genes.'},
         {A:33,hl:25.4,u:'days',use:'Labs also tag DNA with P-33, which gives off weaker radiation than P-32.'}]},
  S:{name:'Sulfur',Z:16,sh:[2,8,6],bonds:'2',found:'Proteins (in the amino acids cysteine and methionine)',pull:'medium',
    iso:[{A:32,ab:'about 95% of sulfur atoms'},{A:34,ab:'about 4% of sulfur atoms'},
         {A:35,hl:87.4,u:'days',use:'Hershey and Chase tagged virus protein with S-35. DNA has no sulfur, so S-35 marks only protein.'}]},
  Na:{name:'Sodium',Z:11,sh:[2,8,1],bonds:'None: it gives its valence electron away and becomes Na⁺',found:'Na⁺ ions in blood and body fluids, and nerve signals',pull:'very weak',
    iso:[{A:23,ab:'100% of natural sodium'},{A:22,hl:2.6,u:'years'},
         {A:24,hl:15.0,u:'hours',use:'Intense neutron radiation, as in a criticality accident, turns some sodium in blood into Na-24, so doctors measure it to estimate the dose.'}]},
  Cl:{name:'Chlorine',Z:17,sh:[2,8,7],bonds:'1 (as in HCl), or it takes 1 electron and becomes Cl⁻',found:'Cl⁻ ions in blood, and HCl in stomach acid',pull:'strong',
    iso:[{A:35,ab:'about 75.8% of chlorine atoms'},{A:37,ab:'about 24.2% of chlorine atoms'},
         {A:36,hl:301000,u:'years',use:'Nuclear tests in the 1950s made extra Cl-36, so it marks groundwater from that time.'}]}
};
const ELS=['C','H','N','O','P','S','Na','Cl'];
const curEl=p=>EL[p.el]||EL.C;
const curIso=p=>{const E=curEl(p);return E.iso[+p.iso]||E.iso[0];};
const valence=E=>E.sh[E.sh.length-1];
const isoName=(sym,I)=>sym+'-'+I.A;
const leftPct=p=>{const I=curIso(p);return I.hl?100*Math.pow(0.5,p.hl):100;};

/* ---- bonds and molecules ---- */
const ENERGY=[{k:'ionic',l:'NaCl dry crystal (lattice)',v:769,t:'ionic'},{k:'C=O',l:'C=O',v:741,t:'polar'},{k:'O=O',l:'O=O',v:498,t:'nonpolar'},{k:'O–H',l:'O–H',v:464,t:'polar'},
  {k:'C–H',l:'C–H',v:415,t:'nonpolar'},{k:'N–H',l:'N–H',v:390,t:'polar'},{k:'C–C',l:'C–C',v:345,t:'nonpolar'},{k:'hb',l:'H bond in water',v:23,t:'hb'}];
const E_OF=k=>ENERGY.find(e=>e.k===k).v;
const RATIO=E_OF('O–H')/E_OF('hb');
function btype(a,b){const d=Math.abs(EN[a]-EN[b]);return d>1.8?'ionic':d>=0.4?'polar':'nonpolar';}
const PRI={C:0,N:1,O:2,S:3,P:4,H:5};
function bname(a,b,o){const [x,y]=PRI[a]<=PRI[b]?[a,b]:[b,a];return x+(o===2?'=':'–')+y;}
const TYPE_L={polar:'polar covalent',nonpolar:'nonpolar covalent',ionic:'ionic'};
const CX=275,CY=228;
const MOL={
  water:{name:'Water',f:'H₂O',atoms:[['O',0,-18],['H',-62,30],['H',62,30]],bonds:[[0,1,1],[0,2,1]],lp:{0:[[-0.62,-0.78],[0.62,-0.78]]},don:[1,2],acc:[0],
    pol:'polar',why:'Two polar O–H bonds, and the bent shape points both H ends the same way, so the pulls add up.',
    wat:'It is water: each molecule hydrogen-bonds to its neighbors',watS:'It is water',where:'About 70% of a typical cell’s mass is water.'},
  co2:{name:'Carbon dioxide',f:'CO₂',atoms:[['O',-110,0],['C',0,0],['O',110,0]],bonds:[[1,0,2],[1,2,2]],lp:{0:[[-0.7,-0.7],[-0.7,0.7]],2:[[0.7,-0.7],[0.7,0.7]]},don:[],acc:[],
    pol:'nonpolar',why:'Both C=O bonds are polar, but they point in exactly opposite directions, so the pulls cancel.',
    wat:'Dissolves some, more than O₂. In blood, most CO₂ travels as bicarbonate (HCO₃⁻)',watS:'Dissolves some',where:'Your cells make it in cellular respiration, and you breathe it out.'},
  methane:{name:'Methane',f:'CH₄',atoms:[['C',0,0],['H',0,-86],['H',86,0],['H',0,86],['H',-86,0]],bonds:[[0,1,1],[0,2,1],[0,3,1],[0,4,1]],lp:{},don:[],acc:[],
    pol:'nonpolar',why:'C and H pull on electrons almost equally, so every C–H bond is nonpolar.',
    wat:'Barely dissolves: it has no charged ends for water to grab',watS:'Barely dissolves',where:'Microbes in cow stomachs and in wetlands make it.'},
  ammonia:{name:'Ammonia',f:'NH₃',atoms:[['N',0,-26],['H',-80,24],['H',80,24],['H',0,64]],bonds:[[0,1,1],[0,2,1],[0,3,1]],lp:{0:[[0,-1]]},don:[1,2,3],acc:[0],
    pol:'polar',why:'Three polar N–H bonds, and the lone pair on N pushes them into a pyramid, so the pulls add up toward N.',
    wat:'Dissolves very well: it hydrogen-bonds with water',watS:'Dissolves very well',where:'It is waste from breaking down proteins. Most fish release it through their gills.'},
  butane:{name:'Butane, a C–H chain',f:'C₄H₁₀',atoms:[['C',-150,18],['C',-50,-18],['C',50,18],['C',150,-18],
      ['H',-178,74],['H',-122,74],['H',-212,18],['H',-78,-74],['H',-22,-74],['H',22,74],['H',78,74],['H',122,-74],['H',178,-74],['H',212,-18]],
    bonds:[[0,1,1],[1,2,1],[2,3,1],[0,4,1],[0,5,1],[0,6,1],[1,7,1],[1,8,1],[2,9,1],[2,10,1],[3,11,1],[3,12,1],[3,13,1]],lp:{},don:[],acc:[],
    pol:'nonpolar',why:'Only C–C and C–H bonds, and all of them are nonpolar.',
    wat:'Does not mix: water pushes it out, like oil',watS:'Does not mix',where:'Butane is the fuel in disposable lighters, but its C–H chain is the same kind of chain that makes up the tail of a fat.'},
  acetone:{name:'Acetone, with a C=O group',f:'C₃H₆O',atoms:[['C',0,14],['O',0,-72],['C',-104,58],['C',104,58],['H',-162,30],['H',-128,116],['H',-74,112],['H',162,30],['H',128,116],['H',74,112]],
    bonds:[[0,1,2],[0,2,1],[0,3,1],[2,4,1],[2,5,1],[2,6,1],[3,7,1],[3,8,1],[3,9,1]],lp:{1:[[-0.7,-0.7],[0.7,-0.7]]},qdir:{0:[0,1]},don:[],acc:[1],
    pol:'polar',why:'Its C=O bond is polar and nothing cancels it, so the O end is δ− and the molecule is polar.',
    wat:'Mixes completely with water: water hydrogen-bonds to its O',watS:'Mixes completely',where:'Your body makes some when it burns fat during a long fast, and you breathe it out.'},
  o2:{name:'Oxygen gas',f:'O₂',atoms:[['O',-54,0],['O',54,0]],bonds:[[0,1,2]],lp:{0:[[-0.7,-0.7],[-0.7,0.7]],1:[[0.7,-0.7],[0.7,0.7]]},don:[],acc:[],
    pol:'nonpolar',why:'Two identical atoms pull equally, so the shared electrons sit right in the middle.',
    wat:'Dissolves only a little, so blood uses hemoglobin to carry most of it',watS:'Only a little',where:'You breathe it in, and your cells use it in cellular respiration.'},
  salt:{name:'Table salt',f:'NaCl',atoms:[],bonds:[],lp:{},don:[],acc:[],salt:true,
    pol:'ionic',why:'Na hands its 1 valence electron to Cl. The ions carry full charges, not partial ones, and opposite charges attract.',
    wat:'Dissolves: water pulls the ions apart and surrounds each one',watS:'Dissolves',where:'Na⁺ and Cl⁻ are the main ions in your blood plasma.'}
};
const MOLS=['water','co2','methane','ammonia','salt','butane','acetone','o2'];
const curMol=p=>MOL[p.mol]||MOL.water;
function layout(id){return (MOL[id]||MOL.water).atoms.map(a=>({e:a[0],x:CX+a[1],y:CY+a[2]}));}
function bondList(id){const M=MOL[id]||MOL.water;if(M.salt)return [{name:'Na⁺ and Cl⁻',type:'ionic',key:'ionic',o:0}];
  return M.bonds.map(b=>{const a=M.atoms[b[0]][0],c=M.atoms[b[1]][0];return {a:b[0],b:b[1],o:b[2],name:bname(a,c,b[2]),type:btype(a,c),key:bname(a,c,b[2])};});}
function molCounts(id){const M=MOL[id]||MOL.water,B=bondList(id);let lp=0;Object.values(M.lp).forEach(v=>lp+=v.length);
  return {polar:B.filter(b=>b.type==='polar').length,non:B.filter(b=>b.type==='nonpolar').length,pairs:M.salt?0:B.reduce((s,b)=>s+b.o,0),lp,xfer:M.salt?1:0,n:B.length};}

/* ---- build ---- */
const CTR={C:{val:4,use:4,lp:0,hs:[0,180,90,270],lps:[]},N:{val:5,use:3,lp:1,hs:[145,35,90],lps:[270]},O:{val:6,use:2,lp:2,hs:[142,38],lps:[218,322]}};
const BNAME={C:['C','CH','CH₂','CH₃','CH₄'],N:['N','NH','NH₂','NH₃','NH₄⁺'],O:['O','OH','H₂O','H₃O⁺','H₃O⁺ + a spare H']};
function buildState(p){const c=p.ctr in CTR?p.ctr:'C',C=CTR[c],n=Math.round(p.nH);
  const extra=Math.max(0,n-C.use),ionH=Math.min(extra,C.lp?1:0),bonds=Math.min(n,C.use)+ionH,lp=C.lp-ionH,unp=Math.max(0,C.use-n),spare=n-bonds;
  return {c,C,n,bonds,lp,unp,spare,ion:ionH>0,shell:2*bonds+2*lp+unp,full:unp===0&&spare===0,f:BNAME[c][clamp(n,0,4)]};}
function buildShort(b){if(b.spare)return 'Not possible: H₃O⁺ repels another H⁺.';if(b.ion)return b.c==='N'?'Ammonium ion: N’s lone pair holds an H⁺.':'Hydronium ion: a lone pair holds an H⁺.';
  if(b.full)return {C:'Methane: full shell.',N:'Ammonia: full shell.',O:'Water: full shell.'}[b.c];return 'Still '+b.unp+' unpaired electron'+(b.unp>1?'s':'')+'.';}
function buildText(b){const nm={C:'Carbon',N:'Nitrogen',O:'Oxygen'}[b.c];
  if(b.spare)return 'Not possible: H₃O⁺ is already positive, so it repels another H⁺, and its last lone pair stays unshared.';
  if(b.ion)return b.c==='N'?'NH₄⁺, ammonium: the lone pair on N holds an H⁺ (a hydrogen with no electron), so the ion has a + charge.':'H₃O⁺, hydronium: water’s lone pair holds an H⁺. This is what acid adds to water.';
  if(b.full)return {C:'Methane, CH₄: carbon’s 4 bonds fill its shell.',N:'Ammonia, NH₃: 3 bonds and 1 lone pair fill nitrogen’s shell.',O:'Water, H₂O: 2 bonds and 2 lone pairs fill oxygen’s shell.'}[b.c];
  return nm+' still has '+b.unp+' unpaired electron'+(b.unp>1?'s':'')+'. It would grab another atom almost at once.';}

/* ---- between molecules ---- */
const NBP=10,NSHEET=6;
function dnaSeq(gc){const out=[];for(let i=0;i<NBP;i++){const isGC=Math.floor((i+1)*gc/NBP)>Math.floor(i*gc/NBP);out.push(isGC?(i%2?['C','G']:['G','C']):(i%2?['T','A']:['A','T']));}return out;}
function dnaHB(p,open){const S=dnaSeq(Math.round(p.gc));let n=0;S.forEach((b,i)=>{if(i>=open)n+=(b[0]==='G'||b[0]==='C')?3:2;});return n;}
const BASEC={A:'#c9423e',T:'#b07d00',G:'#2e8b57',C:'#2d6bd2'};
/* 24 water molecules in a 6 x 4 patch; each points its two H atoms at the right and lower neighbors. */
const WGRID=(()=>{const r=rng(5),W=[],B=[];for(let j=0;j<4;j++)for(let i=0;i<6;i++){W.push({x:78+i*80+(r()-.5)*14,y:96+j*84+(r()-.5)*14,ph:r()*6.28});}
  for(let j=0;j<4;j++)for(let i=0;i<6;i++){const a=j*6+i;if(i<5)B.push({a,b:a+1,h:0,ph:r()*6.28,w:0.8+r()*0.9});if(j<3)B.push({a,b:a+6,h:1,ph:r()*6.28,w:0.8+r()*0.9});}return {W,B};})();
function hbOn(b,t){return RM||Math.sin(t*b.w*1.7+b.ph)>-0.55;}
function waterBondsNow(t){return WGRID.B.filter(b=>hbOn(b,t)).length;}
/* Oil drops: area is conserved when drops split or merge. */
const OIL_R=80;
function oilShake(s){const r=rng(11+s.shakes*7),D=[];const rr0=OIL_R/Math.sqrt(8);let tries=0;
  while(D.length<8&&tries<500){tries++;const x=70+r()*410,y=80+r()*290;if(D.every(d=>Math.hypot(d.x-x,d.y-y)>2*rr0+16))D.push({x,y,r:rr0});}
  while(D.length<8)D.push({x:80+D.length*55,y:380,r:rr0});s.drops=D;s.shakes++;}
function oilStep(s,dt){const D=s.drops;if(D.length<2)return;let A=0,mx=0,my=0;D.forEach(d=>{const a=d.r*d.r;A+=a;mx+=d.x*a;my+=d.y*a;});mx/=A;my/=A;
  D.forEach(d=>{const dx=mx-d.x,dy=my-d.y,L=Math.hypot(dx,dy)||1,v=Math.min(L,24*dt);d.x+=dx/L*v;d.y+=dy/L*v;});
  for(let i=0;i<D.length;i++)for(let j=i+1;j<D.length;j++){const a=D[i],b=D[j];if(Math.hypot(a.x-b.x,a.y-b.y)<a.r+b.r-2){const A1=a.r*a.r,A2=b.r*b.r;a.x=(a.x*A1+b.x*A2)/(A1+A2);a.y=(a.y*A1+b.y*A2)/(A1+A2);a.r=Math.sqrt(A1+A2);D.splice(j,1);return;}}}

/* ---- drawing helpers ---- */
const SPX=558,SPY=10,SPW=234,SPH=430;
function wrap(ctx,s,x,y,maxW,lh,o){o=o||{};ctx.font=(o.w||400)+' '+(o.s||13)+'px '+FONT;const words=String(s).split(' ');const lines=[];let line='';
  words.forEach(w=>{const t=line?line+' '+w:w;if(line&&ctx.measureText(t).width>maxW){lines.push(line);line=w;}else line=t;});if(line)lines.push(line);
  lines.forEach((l,i)=>txt(ctx,l,x,y+i*lh,o));return y+lines.length*lh;}
function wrapFit(ctx,s,x,y,maxW,lh,o,yMax){o=o||{};ctx.font=(o.w||400)+' '+(o.s||13)+'px '+FONT;const words=String(s).split(' ');let n=1,line='';
  words.forEach(w=>{const t=line?line+' '+w:w;if(line&&ctx.measureText(t).width>maxW){n++;line=w;}else line=t;});return y+(n-1)*lh<=yMax?wrap(ctx,s,x,y,maxW,lh,o):y;}
function side(ctx,title,k){ctx.fillStyle=PAL['cv-bg2'];rr(ctx,SPX,SPY,SPW,SPH,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  return wrap(ctx,title,SPX+12,SPY+24,SPW-24,16*k,{s:13*k,w:700});}
function ball(ctx,e,x,y,k,r){r=r||RAD[e];ctx.fillStyle=COL[e];ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();ctx.strokeStyle=e==='H'?'#5d6b79':'rgba(0,0,0,.35)';ctx.lineWidth=1.3;ctx.stroke();
  txt(ctx,e,x,y+1,{s:Math.max(12,Math.min(12*k,r*1.25)),w:800,c:e==='H'?'#1d232b':'#fff',a:'center',b:'middle'});}
function edot(ctx,x,y,c){ctx.fillStyle=c||PAL['cv-e'];ctx.beginPath();ctx.arc(x,y,4.5,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-estroke'];ctx.lineWidth=1;ctx.stroke();}
function wat(ctx,x,y,ang,s){const d=13*s,h1=[x+Math.cos(ang-0.91)*d,y+Math.sin(ang-0.91)*d],h2=[x+Math.cos(ang+0.91)*d,y+Math.sin(ang+0.91)*d];
  ctx.strokeStyle='#5d6b79';ctx.lineWidth=1;[h1,h2].forEach(h=>{ctx.fillStyle=COL.H;ctx.beginPath();ctx.arc(h[0],h[1],5*s,0,6.29);ctx.fill();ctx.stroke();});
  ctx.fillStyle=COL.O;ctx.beginPath();ctx.arc(x,y,8.5*s,0,6.29);ctx.fill();return {O:[x,y],H:[h1,h2]};}
function dash(ctx,a,b,alpha,w){ctx.save();ctx.globalAlpha=alpha===undefined?0.95:alpha;ctx.setLineDash([4,3]);ctx.strokeStyle=PAL['s2'];ctx.lineWidth=w||1.8;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.restore();}
const shorten=(a,b,ra,rb)=>{const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;return [[a[0]+dx/L*ra,a[1]+dy/L*ra],[b[0]-dx/L*rb,b[1]-dy/L*rb]];};

/* where water sits around a molecule (cached per molecule) */
function waterShell(id){const M=MOL[id],A=layout(id),out=[],sites=[];
  M.acc.forEach(i=>{const a=A[i];(M.lp[i]||[]).forEach(d=>{const r0=RAD[a.e];const x=a.x+d[0]*(r0+42),y=a.y+d[1]*(r0+42),th=Math.atan2(-d[1],-d[0]);out.push({x,y,ang:th+0.91,hb:{to:[a.x+d[0]*r0,a.y+d[1]*r0],from:'H0'}});});});
  M.don.forEach(i=>{const h=A[i],nb=M.bonds.find(b=>b[1]===i||b[0]===i),o=A[nb[0]===i?nb[1]:nb[0]];const dx=h.x-o.x,dy=h.y-o.y,L=Math.hypot(dx,dy);const ux=dx/L,uy=dy/L;
    const ca=Math.cos(0.7),sa=Math.sin(0.7),vx=ux*ca-uy*sa,vy=ux*sa+uy*ca;out.push({x:h.x+vx*46,y:h.y+vy*46,ang:Math.atan2(vy,vx),hb:{to:[h.x+vx*15,h.y+vy*15],from:'O'}});});
  sites.push(...out);let xs=A.map(a=>a.x),ys=A.map(a=>a.y);const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const ex=Math.max(90,(x1-x0)/2+64),ey=Math.max(90,(y1-y0)/2+62),r=rng(id.length*13+3),ring=[];
  for(let i=0;i<22;i++){const th=i/22*6.283,x=CX+Math.cos(th)*ex,y=CY+Math.sin(th)*ey;if(x<22||x>530||y<54||y>404)continue;
    if(A.some(a=>Math.hypot(a.x-x,a.y-y)<44)||out.concat(ring).some(w=>Math.hypot(w.x-x,w.y-y)<40))continue;ring.push({x,y,ang:r()*6.28});}
  return {sites,ring};}

/* ---- view visibility ---- */
const VIEW_CTL={view:()=>true,el:p=>p.view==='atom',iso:p=>p.view==='atom',hl:p=>p.view==='atom'&&!!curIso(p).hl,ctr:p=>p.view==='build',nH:p=>p.view==='build',
  mol:p=>p.view==='mol',wet:p=>p.view==='mol',hb:p=>p.view==='hb',gc:p=>p.view==='hb'&&p.hb==='dna'};
const VIEW_ACT={fill:p=>p.view==='build',nextbond:p=>p.view==='mol'&&!curMol(p).salt,unzip:p=>p.view==='hb'&&(p.hb==='dna'||p.hb==='protein'),heat:p=>p.view==='hb'&&(p.hb==='dna'||p.hb==='protein'),
  cool:p=>p.view==='hb'&&(p.hb==='dna'||p.hb==='protein'),shake:p=>p.view==='hb'&&p.hb==='oil'};
function sync(sim){const ui=sim.ui,p=sim.p;if(!ui||!ui.sec)return;
  SIM.controls.forEach(c=>{const w=ui.ctlW[c.id];if(w)w.hidden=!(atLeast(c.lvl)&&VIEW_CTL[c.id](p));});
  const w=ui.ctlW.iso;if(w)w.querySelectorAll('button').forEach(b=>{const I=curEl(p).iso[+b.dataset.v];b.textContent=I?isoName(p.el,I):'';});
  SIM.actions.forEach(a=>{const b=ui.actB[a.id];if(b)b.hidden=!(atLeast(a.lvl)&&VIEW_ACT[a.id](p));});
  SIM.metrics.forEach(m=>{const t=ui.tiles[m.id];if(!t)return;const tile=t.num.closest('.tile');if(tile)tile.hidden=!(atLeast(m.lvl)&&m.show(p));});}
const later=sim=>setTimeout(()=>sync(sim),0);
function unzip(sim){const s=sim.st,N=sim.p.hb==='protein'?NSHEET:NBP;s.open=Math.min(N,s.open+1);s.hot=false;}

/* ---- the bond-strength chart ---- */
function relevant(p){if(p.view==='atom')return [];if(p.view==='build')return [{C:'C–H',N:'N–H',O:'O–H'}[p.ctr]||'C–H'];
  if(p.view==='mol')return [...new Set(bondList(p.mol).map(b=>b.key))].concat(p.wet&&!curMol(p).salt&&curMol(p).pol==='polar'?['hb']:[]);
  return p.hb==='oil'?['hb','C–H']:p.hb==='water'?['hb','O–H']:['hb'];}

const SIM={
  id:'lifebonds',hash:'lifebonds',apUnit:1,order:-1,kind:'Simulation',tab:'Atoms and bonds',
  next:['waterprops','water','macromolecules','phlife','protein'],
  card:'Count an atom’s protons and neutrons, follow a radioactive tracer, build CH₄, NH₃ and H₂O, and see which bonds let salt dissolve while fat stays out.',
  title:'Atoms and bonds in living things',
  lede:{bio:'Six elements, C, H, N, O, P and S, build almost every molecule in a cell. Look inside one atom, then see how atoms share or hand over electrons to make the bonds in water, salt, fats and DNA.',
        honors:'Count valence electrons to predict how many bonds C, N and O make, then use bond polarity and shape to predict which molecules are polar.',
        ap:'Connect bond polarity to hydrophobic and hydrophilic behavior, and see how hydrogen bonds hold water, pair DNA bases and shape protein β-sheets.'},
  scale:{bio:'Zoomed in about 100 million times. A carbon atom is about 0.15 nanometers across, and the nucleus is far smaller than drawn.',
         ap:'Molecular scale: an O–H bond is about 0.1 nm long and a hydrogen bond about 0.18 nm. The Bohr pictures are not to scale: a real nucleus is about 1/100,000 of its atom’s width.'},
  timeless:true,animated:true,chChange:0.3,chReveal:2.5,controlsTitle:'What to look at',
  controls:[
    {id:'view',label:'Look at',type:'seg',def:'atom',lvl:'bio',options:[{v:'atom',l:'One atom'},{v:'build',l:'Build a molecule'},{v:'mol',l:'Molecules'},{v:'hb',l:'Between molecules'}],onChange(sim){sim.st.sel=0;sync(sim);}},
    {id:'el',label:'Element',type:'seg',def:'C',lvl:'bio',options:ELS.map(e=>({v:e,l:e})),help:'C, H, N, O, P and S are the six elements of life. Na and Cl are here for salt.',onChange(sim){sync(sim);}},
    {id:'iso',label:'Isotope',type:'seg',def:'0',lvl:'bio',options:[{v:'0',l:'C-12'},{v:'1',l:'C-13'},{v:'2',l:'C-14'}],help:'Same element, different number of neutrons.',onChange(sim){sync(sim);}},
    {id:'hl',label:'Time passed (half-lives)',type:'range',min:0,max:6,step:1,def:0,unit:'',lvl:'bio',help:'Only for radioactive isotopes.'},
    {id:'ctr',label:'Center atom',type:'seg',def:'C',lvl:'bio',options:[{v:'C',l:'Carbon'},{v:'N',l:'Nitrogen'},{v:'O',l:'Oxygen'}]},
    {id:'nH',label:'Hydrogens attached',type:'range',min:0,max:4,step:1,def:0,unit:'',lvl:'bio',help:'Each H brings 1 electron to share (past a full shell, only an H⁺ with no electron can attach).'},
    {id:'mol',label:'Substance',type:'select',def:'water',lvl:'bio',options:MOLS.map(m=>({v:m,l:MOL[m].name+' ('+MOL[m].f+')'})),onChange(sim){sim.st.sel=0;sync(sim);}},
    {id:'wet',label:'Put it in water',type:'toggle',def:false,lvl:'bio',help:'Shows how water molecules treat it.'},
    {id:'hb',label:'Show',type:'seg',def:'water',lvl:'bio',options:[{v:'water',l:'Liquid water'},{v:'dna',l:'DNA base pairs'},{v:'oil',l:'Oil in water',lvl:'ap'},{v:'protein',l:'Protein β-sheet',lvl:'ap'}],
     onChange(sim){sim.st.open=0;sim.st.hot=false;sync(sim);}},
    {id:'gc',label:'G–C pairs (out of 10)',type:'range',min:0,max:10,step:1,def:4,unit:'',lvl:'bio',help:'The rest are A–T pairs.'}
  ],
  actions:[
    {id:'fill',label:'Fill the outer shell',primary:true,run(sim){BioLab.setValues(sim,{nH:CTR[sim.p.ctr].use});}},
    {id:'nextbond',label:'Next bond',primary:true,run(sim){const n=bondList(sim.p.mol).length;sim.st.sel=(sim.st.sel+1)%n;}},
    {id:'unzip',label:'Unzip one pair',primary:true,run(sim){unzip(sim);}},
    {id:'heat',label:'Heat to 95 °C',run(sim){const s=sim.st;s.open=sim.p.hb==='protein'?NSHEET:NBP;s.hot=true;}},
    {id:'cool',label:'Cool it down',run(sim){sim.st.open=0;sim.st.hot=false;}},
    {id:'shake',label:'Shake it',primary:true,run(sim){oilShake(sim.st);}}
  ],
  init(sim){const s={sel:0,open:0,hot:false,shakes:0,drops:[{x:CX,y:CY,r:OIL_R}],dis:sim.p.wet?1:0,sep:[]};return s;},
  step(sim,dt){const s=sim.st,p=sim.p;s.dis=clamp(s.dis+(p.wet?1:-1)*dt*0.8,0,1);if(p.view==='hb'&&p.hb==='oil')oilStep(s,dt);},
  metrics:[
    {id:'Z',label:'Protons (atomic number)',unit:'',lvl:'bio',min:0,max:17,d:0,show:p=>p.view==='atom',get:s=>curEl(s.p).Z},
    {id:'nn',label:'Neutrons',unit:'',lvl:'bio',min:0,max:20,d:0,show:p=>p.view==='atom',get:s=>curIso(s.p).A-curEl(s.p).Z},
    {id:'A',label:'Mass number',unit:'',lvl:'bio',min:0,max:37,d:0,show:p=>p.view==='atom',get:s=>curIso(s.p).A},
    {id:'ne',label:'Electrons',unit:'',lvl:'bio',min:0,max:17,d:0,show:p=>p.view==='atom',get:s=>curEl(s.p).Z},
    {id:'val',label:'Valence (outer-shell) electrons',unit:'',lvl:'bio',min:0,max:8,d:0,show:p=>p.view==='atom',get:s=>valence(curEl(s.p))},
    {id:'bonds',label:'Covalent bonds it usually makes',unit:'',lvl:'bio',text:true,show:p=>p.view==='atom',get:s=>curEl(s.p).bonds},
    {id:'stab',label:'Stable or radioactive?',unit:'',lvl:'bio',text:true,show:p=>p.view==='atom',get:s=>{const I=curIso(s.p);return I.hl?'Radioactive: half-life '+fq(I.hl)+' '+I.u:'Stable: it never decays';}},
    {id:'left',label:'Radioactive atoms left',unit:'%',lvl:'bio',min:0,max:100,d:2,show:p=>p.view==='atom'&&!!curIso(p).hl,get:s=>leftPct(s.p)},
    {id:'tpass',label:'Time passed',unit:'',lvl:'bio',text:true,show:p=>p.view==='atom'&&!!curIso(p).hl,get:s=>{const I=curIso(s.p);return I.hl?fq(s.p.hl*I.hl)+' '+I.u:'None';}},
    {id:'bf',label:'You built',unit:'',lvl:'bio',text:true,show:p=>p.view==='build',get:s=>buildState(s.p).f},
    {id:'bb',label:'Covalent bonds made',unit:'',lvl:'bio',min:0,max:4,d:0,show:p=>p.view==='build',get:s=>buildState(s.p).bonds},
    {id:'bu',label:'Unpaired electrons left',unit:'',lvl:'bio',min:0,max:4,d:0,show:p=>p.view==='build',get:s=>buildState(s.p).unp},
    {id:'shell',label:'Electrons around the center atom',unit:'of 8',lvl:'honors',min:0,max:8,d:0,show:p=>p.view==='build',get:s=>buildState(s.p).shell},
    {id:'blp',label:'Lone pairs (unshared pairs)',unit:'',lvl:'honors',min:0,max:2,d:0,show:p=>p.view==='build',get:s=>buildState(s.p).lp},
    {id:'mpol',label:'This substance is',unit:'',lvl:'bio',text:true,show:p=>p.view==='mol',get:s=>({polar:'Polar',nonpolar:'Nonpolar',ionic:'Ionic: made of ions'})[curMol(s.p).pol]},
    {id:'mwat',label:'In water it',unit:'',lvl:'bio',text:true,show:p=>p.view==='mol',get:s=>curMol(s.p).watS},
    {id:'npolar',label:'Polar covalent bonds',unit:'',lvl:'bio',min:0,max:13,d:0,show:p=>p.view==='mol',get:s=>molCounts(s.p.mol).polar},
    {id:'nnon',label:'Nonpolar covalent bonds',unit:'',lvl:'bio',min:0,max:13,d:0,show:p=>p.view==='mol',get:s=>molCounts(s.p.mol).non},
    {id:'pairs',label:'Shared electron pairs',unit:'',lvl:'honors',min:0,max:13,d:0,show:p=>p.view==='mol',get:s=>molCounts(s.p.mol).pairs},
    {id:'lp',label:'Lone pairs in the molecule',unit:'',lvl:'honors',min:0,max:4,d:0,show:p=>p.view==='mol'&&!curMol(p).salt,get:s=>molCounts(s.p.mol).lp},
    {id:'xfer',label:'Electrons handed over',unit:'per Na',lvl:'honors',min:0,max:1,d:0,show:p=>p.view==='mol',get:s=>molCounts(s.p.mol).xfer},
    {id:'selb',label:'Selected bond',unit:'',lvl:'bio',text:true,show:p=>p.view==='mol',get:s=>{const B=bondList(s.p.mol),b=B[s.st.sel%B.length];return b.name+': '+TYPE_L[b.type];}},
    {id:'hbw',label:'Hydrogen bonds in view right now',unit:'',lvl:'bio',min:0,max:38,d:0,show:p=>p.view==='hb'&&p.hb==='water',get:s=>waterBondsNow(s.vt||0)},
    {id:'ratio',label:'O–H bond ÷ hydrogen bond (strength)',unit:'×',lvl:'ap',min:0,max:40,d:1,show:p=>p.view==='hb'&&p.hb==='water',get:s=>RATIO},
    {id:'hbt',label:'Hydrogen bonds between the strands',unit:'',lvl:'bio',min:0,max:30,d:0,show:p=>p.view==='hb'&&(p.hb==='dna'||p.hb==='protein'),get:s=>s.p.hb==='protein'?NSHEET-s.st.open:dnaHB(s.p,s.st.open)},
    {id:'open',label:'Pairs pulled apart',unit:'',lvl:'bio',min:0,max:10,d:0,show:p=>p.view==='hb'&&(p.hb==='dna'||p.hb==='protein'),get:s=>s.st.open},
    {id:'cov',label:'Covalent bonds broken',unit:'',lvl:'bio',min:0,max:10,d:0,show:p=>p.view==='hb'&&(p.hb==='dna'||p.hb==='protein'),get:s=>0},
    {id:'drops',label:'Separate oil drops',unit:'',lvl:'ap',min:0,max:8,d:0,show:p=>p.view==='hb'&&p.hb==='oil',get:s=>s.st.drops.length}
  ],
  graphs:[{id:'str',label:'Energy to break each kind of bond',custom:true}],
  defaultGraph:'str',
  plot(sim,ctx,box){const R=relevant(sim.p),n=ENERGY.length,top=box.T+22,rowH=(box.ch-top-40)/n;ctx.font='700 12px '+FONT;const lw=Math.min(Math.max(...ENERGY.map(e=>ctx.measureText(e.l).width)),box.cw-150),x0=lw+16,bw=box.cw-x0-70,max=800;
    txt(ctx,'kJ to break 1 mole of bonds (more = stronger)',8,box.T+8,{s:12,c:PAL['muted']});
    const col={ionic:PAL['s5'],polar:PAL['s2'],nonpolar:PAL['s4'],hb:PAL['s3']};
    ENERGY.forEach((e,i)=>{const y=top+i*rowH,on=!R.length||R.includes(e.k),h=Math.max(8,Math.min(16,rowH-8));ctx.globalAlpha=on?1:0.35;
      txt(ctx,e.l,x0-8,y+h/2+4,{s:12,c:PAL['cv-ink'],a:'right',w:on&&R.length?700:400});
      ctx.fillStyle=col[e.t];rr(ctx,x0,y,Math.max(3,bw*e.v/max),h,4);ctx.fill();txt(ctx,String(e.v),x0+Math.max(3,bw*e.v/max)+6,y+h/2+4,{s:12,c:PAL['cv-soft']});ctx.globalAlpha=1;});
    wrap(ctx,'The covalent bonds here are 15 to 32 times stronger than a hydrogen bond.',8,box.ch-24,box.cw-16,14,{s:12,c:PAL['muted']});},
  onLevel(sim){sync(sim);},
  initVis(sim){later(sim);},
  narrate(sim){const p=sim.p,s=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.view==='atom'){const E=curEl(p),I=curIso(p),N=I.A-E.Z,v=valence(E),nm=E.name.toLowerCase()+'-'+I.A;
      if(p.el==='C'&&p.iso==='0'&&!p.hl)return '<b>Start here:</b> this is one carbon atom. Its nucleus holds 6 protons and 6 neutrons, and 6 electrons move around it. Switch the isotope to <b>C-14</b>, or press <b>Walk me through it</b> for the full tour.';
      let t='<b>'+E.name+'-'+I.A+' has '+E.Z+' proton'+(E.Z>1?'s':'')+', so it is '+E.name.toLowerCase()+'.</b> '+(N===0?'It has no neutrons, so its mass number is '+I.A+'.':N===1?'Its 1 neutron brings the mass number to '+I.A+'.':'Its '+N+' neutrons bring the mass number to '+I.A+'.');
      if(p.el==='Na')t+=' Its 1 valence electron is easy to lose, so sodium gives it away and becomes Na⁺.';
      else if(p.el==='Cl')t+=' With 7 valence electrons, chlorine grabs 1 more and becomes Cl⁻.';
      else t+=' Its '+v+' valence electron'+(v>1?'s let':' lets')+' it make '+(p.el==='P'?'the bonds of a phosphate group':E.bonds+' covalent bond'+(E.bonds==='1'?'':'s'))+'.';
      if(I.hl){t+=' It is radioactive: half of any sample decays every '+fq(I.hl)+' '+I.u+'.';if(p.hl>0)t+=' After '+p.hl+' half-li'+(p.hl>1?'ves':'fe')+' ('+fq(p.hl*I.hl)+' '+I.u+'), '+fq(leftPct(p))+'% is left.';else t+=' Move <b>Time passed</b> to watch a sample decay.';}
      else if(p.iso!=='0')t+=' Extra neutrons change the mass but barely change the chemistry: it bonds just like '+isoName(p.el,E.iso[0])+'.';
      return t;}
    if(p.view==='build'){const b=buildState(p),nm={C:'Carbon',N:'Nitrogen',O:'Oxygen'}[b.c];
      if(b.n===0)return '<b>'+nm+' has '+b.C.val+' valence electrons, '+b.C.use+' of them unpaired.</b> Each unpaired electron can pair with the 1 electron of a hydrogen atom to make a covalent bond. Raise <b>Hydrogens attached</b> one at a time.';
      if(b.spare)return '<b>No room for a 4th H.</b> '+buildText(b);
      if(b.ion)return '<b>'+b.f+' is an ion.</b> '+buildText(b)+(b.c==='O'?' See it in the <b>Acids, bases and buffers</b> lab.':'');
      if(b.full)return '<b>'+buildText(b)+'</b> '+(hon?'Count the electrons around '+b.c+': '+b.bonds+' shared pairs and '+b.lp+' lone pair'+(b.lp===1?'':'s')+' make 8. ':'Now '+b.c+' has 8 electrons around it, a full outer shell. ')+'Each H has 2, which fills its small shell.';
      return '<b>'+b.f+' is not finished.</b> '+buildText(b);}
    if(p.view==='mol'){const M=curMol(p),B=bondList(p.mol),b=B[s.sel%B.length];
      if(M.salt){if(p.wet&&s.dis>0.6)return '<b>In water, the ions separate: each Na⁺ and Cl⁻ is surrounded by water, so no ionic bonds remain.</b> The δ− O ends of water face each Na⁺ and the δ+ H ends face each Cl⁻.';
        return '<b>Salt is held together by ionic bonds.</b> '+M.why+(p.wet?' Watch the water pull the ions apart.':' Turn on <b>Put it in water</b>.');}
      let t='<b>'+M.name.split(',')[0]+' is '+M.pol+'.</b> '+M.why;
      if(p.mol==='water'&&!p.wet&&!s.sel)t+=' Press <b>Next bond</b> or click a bond to inspect it, then try other molecules.';
      else t+=' Selected: '+b.name+', '+TYPE_L[b.type]+'.';
      if(p.wet)t+=' '+M.wat+'.';
      return t;}
    if(p.hb==='water')return '<b>The dashed lines are hydrogen bonds:</b> a δ+ H on one water molecule attracted to the δ− O of a neighbor. They are attractions between molecules, not bonds inside one, and each is about 20 times weaker than an O–H bond. In liquid water they break and re-form all the time.';
    if(p.hb==='dna'){const n=dnaHB(p,s.open);if(!s.open)return '<b>'+n+' hydrogen bonds link these 10 base pairs.</b> A–T pairs share 2 and G–C pairs share 3. Press <b>Unzip one pair</b>, the way the enzyme helicase opens DNA to copy it.';
      return '<b>'+s.open+' of 10 pairs are apart'+(s.hot?' at 95 °C':'')+', and '+n+' hydrogen bonds still hold.</b> No covalent bonds break: the hydrogen bonds between the bases come apart, and the backbone stays whole, so each strand can be copied.'+(s.hot?' This is the first step of every PCR cycle.':'');}
    if(p.hb==='oil'){const n=s.drops.length;if(n===1)return '<b>Oil stays in one blob.</b> Its C–H chains are nonpolar, so water molecules hydrogen-bond to each other instead and squeeze the oil out of the way. Press <b>Shake it</b>.';
      return '<b>'+n+' oil drops, and they keep merging.</b> Water molecules hold onto each other, not the oil, so the oil gets pushed together. This is the hydrophobic effect, the same push that packs phospholipid tails inside a membrane.';}
    return s.open?'<b>'+(NSHEET-s.open)+' of 6 hydrogen bonds still hold the strands.</b> Heat breaks these weak bonds, so the sheet unfolds, but every peptide bond along each strand stays whole.':
      '<b>Hydrogen bonds hold the two strands of this β-sheet together.</b> Each one links a C=O on one strand to an N–H on the other. The same kind of backbone hydrogen bond coils chains into α-helices. Press <b>Heat to 95 °C</b>.';},
  infoPanel(sim){const p=sim.p,s=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.view==='atom'){const E=curEl(p);let h='<div class="p-head"><h3>'+E.name+' isotopes</h3></div><div class="tbl-wrap"><table><thead><tr><th>Isotope</th><th>Neutrons</th><th>Half-life</th></tr></thead><tbody>'+
        E.iso.map(I=>'<tr><td>'+isoName(p.el,I)+(I.nick?' ('+I.nick+')':'')+'</td><td>'+(I.A-E.Z)+'</td><td>'+(I.hl?fq(I.hl)+' '+I.u:'Stable')+'</td></tr>').join('')+'</tbody></table></div>';
      if(hon){const ab=E.iso.filter(I=>I.ab).map(I=>isoName(p.el,I)+' is '+I.ab).join('; ');if(ab)h+='<p><b>In nature:</b> '+ab+'.</p>';}
      h+='<p>The rings show energy levels. Real electrons do not travel in circular paths.</p>';const I=curIso(p);if(I.use)h+='<p><b>Used for:</b> '+I.use+'</p>';
      h+='<p><b>Found in:</b> '+E.found+'.</p>';if(hon)h+='<p><b>Pull on shared electrons:</b> '+E.pull+'. Oxygen pulls hardest of the elements here.</p>';
      h+='<p>Oxygen, carbon and hydrogen make up about 93% of your body’s mass. Add nitrogen, phosphorus and sulfur, and the six CHNOPS elements make up over 96% (Campbell Biology, Table 2.1).</p>';return h;}
    if(p.view==='build'){const b=buildState(p);return '<div class="p-head"><h3>'+b.f+'</h3></div><p>'+buildText(b)+'</p><p>Usual bonds: <b>H 1, C 4, N 3, O 2.</b> Each is the number of electrons the atom still needs to reach 8 in its outer shell (2 for H).</p>'+
      (hon?'<p>A <b>lone pair</b> is a pair of valence electrons that is not shared. Lone pairs push the bonds together, which bends water and makes ammonia a pyramid.</p>':'');}
    if(p.view==='mol'){const M=curMol(p),B=bondList(p.mol),b=B[s.sel%B.length];
      let h='<div class="p-head"><h3>'+M.name+' ('+M.f+')</h3></div><p><b>'+M.pol[0].toUpperCase()+M.pol.slice(1)+'.</b> '+M.why+'</p><p><b>Where you meet it:</b> '+M.where+'</p>';
      if(!M.salt){const ten=b.type==='polar'?(EN[b.name[0]]>EN[b.name[b.name.length-1]]?b.name[0]:b.name[b.name.length-1])+' pulls the shared electrons closer, so that end is δ−.':'The two atoms pull about equally, so the electrons are shared evenly.';
        h+='<p><b>Selected bond: '+b.name+'</b>, '+TYPE_L[b.type]+(b.o===2?' (a double bond: 2 shared pairs)':'')+'. '+ten+' Breaking 1 mole takes about '+E_OF(b.key)+' kJ (average '+b.name+').</p>';}
      else h+='<p><b>Ionic bond:</b> Na⁺ and Cl⁻ attract because their charges are opposite. Pulling apart 1 mole of dry crystal takes about '+E_OF('ionic')+' kJ, yet water does it easily, because each ion is pulled by many water molecules at once.</p>';
      return h;}
    if(p.hb==='dna')return '<div class="p-head"><h3>DNA base pairs</h3></div><p>A pairs with T using <b>2</b> hydrogen bonds. G pairs with C using <b>3</b>. The backbone of each strand is held by covalent bonds.</p>'+(hon?'<p>Stacking between neighboring base pairs, not drawn here, is the main thing holding the double helix together, and heat breaks it up too. G–C pairs have 3 hydrogen bonds and also stack more tightly, so G–C-rich DNA takes more heat to separate.</p>':'');
    if(p.hb==='oil')return '<div class="p-head"><h3>Hydrophobic and hydrophilic</h3></div><p><b>Hydrophilic</b> (water-loving) molecules are polar or charged, so water hydrogen-bonds to them or surrounds them. <b>Hydrophobic</b> (water-fearing) molecules are mostly C–H, so water leaves them out.</p><p>In a protein, amino acids with nonpolar R groups tend to pack into the core, away from water.</p>';
    if(p.hb==='protein')return '<div class="p-head"><h3>Hydrogen bonds in proteins</h3></div><p>Backbone hydrogen bonds (C=O to N–H) make α-helices and β-sheets. Folding into a final shape also uses hydrogen bonds, ionic and hydrophobic interactions between R groups, and disulfide bridges.</p>';
    return '<div class="p-head"><h3>Hydrogen bonds</h3></div><p>A hydrogen bond forms when an H that is covalently bonded to O or N is attracted to a lone pair on another O or N. It is an attraction, not a shared pair of electrons.</p><p>Breaking 1 mole of O–H bonds takes about '+E_OF('O–H')+' kJ. Breaking 1 mole of hydrogen bonds between water molecules takes about '+E_OF('hb')+' kJ.</p>';},
  onClick(sim,x,y){const p=sim.p,s=sim.st;
    if(p.view==='atom'){const t=tileAt(x,y);if(t)BioLab.setValues(sim,{el:t});return;}
    if(p.view==='build'){if(x<SPX)BioLab.setValues(sim,{nH:(Math.round(p.nH)+1)%5});return;}
    if(p.view==='mol'){if(curMol(p).salt)return;const A=layout(p.mol);let best=-1,bd=34;MOL[p.mol].bonds.forEach((b,i)=>{const a=A[b[0]],c=A[b[1]],d=Math.hypot((a.x+c.x)/2-x,(a.y+c.y)/2-y);if(d<bd){bd=d;best=i;}});if(best>=0)s.sel=best;return;}
    if(p.hb==='oil')oilShake(s);else if(p.hb==='dna'||p.hb==='protein')unzip(sim);},
  tour:[
    {title:'One atom: carbon',text:{bio:'In the middle is the nucleus: 6 protons (red, +) and 6 neutrons (gray, no charge). Around it move 6 electrons (yellow, −). The number of protons, 6, is carbon’s atomic number. Protons plus neutrons, 12, is its mass number.',
      ap:'Carbon-12: 6 protons and 6 neutrons, mass number 12. Its 6 electrons fill the first shell (2) and leave 4 in the outer shell. Those 4 valence electrons decide how carbon bonds.'},focus:[0,0,552,450],pause:true,setup(sim){BioLab.setValues(sim,{view:'atom',el:'C',iso:'0',hl:0});}},
    {title:'Same element, more neutrons',text:'Carbon-14 has 8 neutrons, so its mass number is 14. It still has 6 protons, so it is still carbon and bonds like carbon. But it is radioactive: half of any sample decays every 5,700 years. After 2 half-lives, 11,400 years, only 25% is left.',
     focus:[[0,0,552,450],[556,8,238,434]],pause:true,setup(sim){BioLab.setValues(sim,{view:'atom',el:'C',iso:'2',hl:2});}},
    {title:'Valence electrons make bonds',text:'Carbon has 4 valence electrons, so it makes 4 bonds. Each bond is a shared pair: one electron from C (yellow) and one from H (blue). Now 8 electrons surround C, a full outer shell. This is methane, CH₄. Nitrogen makes 3 bonds and oxygen 2.',
     focus:[[0,0,552,450],[556,8,238,434]],pause:true,setup(sim){BioLab.setValues(sim,{view:'build',ctr:'C',nH:4});}},
    {title:'Unequal sharing: a polar bond',text:'Oxygen pulls on shared electrons much harder than hydrogen does. That pull is called electronegativity. The shared pairs sit closer to O, so O is slightly negative (δ−) and each H is slightly positive (δ+). An O–H bond is a polar covalent bond.',
     focus:[0,0,552,450],pause:true,setup(sim){BioLab.setValues(sim,{view:'mol',mol:'water',wet:false});BioLab.reset(sim);}},
    {title:'Even sharing: a C–H chain',text:'Carbon and hydrogen pull about equally, so C–H and C–C bonds are nonpolar. With no charged ends to grab, water molecules hold onto each other and leave the chain out. The tails of fats are chains like this, which is why fat does not dissolve in blood.',
     focus:[0,0,552,450],speed:0.5,setup(sim){BioLab.setValues(sim,{view:'mol',mol:'butane',wet:true});BioLab.reset(sim);}},
    {title:'Handing over an electron: ionic bonds',text:'Sodium gives its 1 valence electron to chlorine. Now Na⁺ and Cl⁻ carry full charges, and opposite charges attract: an ionic bond. In water, the δ− O ends of water face each Na⁺ and the δ+ H ends face each Cl⁻, pulling the ions apart. That is how salt dissolves in your blood.',
     focus:[[0,0,552,450],[556,8,238,434]],speed:0.4,setup(sim){BioLab.setValues(sim,{view:'mol',mol:'salt',wet:false});BioLab.reset(sim);BioLab.setValues(sim,{wet:true});}},
    {title:'Hydrogen bonds between molecules',text:'Each dashed line is a hydrogen bond: the δ+ H of one water molecule attracted to the δ− O of a neighbor. It is an attraction between two molecules, not a bond inside one, and about 20 times weaker than an O–H bond. But there are so many that together they hold liquid water together.',
     focus:[0,0,552,450],speed:0.4,setup(sim){BioLab.setValues(sim,{view:'hb',hb:'water'});}},
    {title:'Hydrogen bonds pair DNA bases',text:'A–T pairs share 2 hydrogen bonds and G–C pairs share 3. Each one is weak, so an enzyme can unzip DNA one pair at a time to copy it, and heating to 95 °C separates the strands, as in PCR. The covalent backbone of each strand stays whole.',
     focus:[0,0,552,450],pause:true,setup(sim){BioLab.setValues(sim,{view:'hb',hb:'dna',gc:4});BioLab.reset(sim);for(let i=0;i<3;i++)unzip(sim);}},
    {lvl:'ap',title:'Hydrophobic: oil in water',text:'Shaken oil breaks into drops, then the drops merge again. Water molecules hydrogen-bond to each other, not to the nonpolar C–H chains, so the oil gets squeezed together. This hydrophobic effect packs fat tails inside membranes and nonpolar R groups inside proteins.',
     focus:[0,0,552,450],speed:0.5,setup(sim){BioLab.setValues(sim,{view:'hb',hb:'oil'});BioLab.reset(sim);oilShake(sim.st);}},
    {lvl:'ap',title:'Hydrogen bonds shape proteins',text:'In a β-sheet, each C=O on one strand hydrogen-bonds to an N–H on the other. Heat breaks these weak bonds and the protein unfolds (denatures), but the peptide bonds along each strand stay whole, so the amino acid sequence is unchanged.',
     focus:[0,0,552,450],pause:true,setup(sim){BioLab.setValues(sim,{view:'hb',hb:'protein'});BioLab.reset(sim);}}
  ],
  onTourExit(sim){const base={};SIM.controls.forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);BioLab.reset(sim);sync(sim);},
  challenges:[
    {lvl:'bio',q:'Carbon-12 has 6 protons and 6 neutrons. Carbon-14 has 2 more neutrons. Switch to C-14. What else changes?',
     choices:['The mass number rises to 14, but it is still carbon','It turns into a different element','It gains 2 electrons and a negative charge'],correct:0,
     baseline:{view:'atom',el:'C',iso:'0'},change:{iso:'2'},changeText:'Switched to carbon-14',
     explain:'The number of protons decides the element, and C-14 still has 6. Neutrons have no charge, so the electrons stay at 6 too. Only the mass number changes, from 12 to 14, and the nucleus becomes radioactive.'},
    {lvl:'bio',q:'Oxygen has 6 valence electrons. How many hydrogen atoms will it bond to before its outer shell is full?',
     choices:['1','2','6'],correct:1,baseline:{view:'build',ctr:'O',nH:0},change:{nH:2},changeText:'Two H atoms attached',
     explain:'Only 2 of oxygen’s 6 valence electrons are unpaired. Each pairs with an H electron, and then O has 8 electrons around it: 2 shared pairs and 2 lone pairs. That is water, H₂O.'},
    {lvl:'bio',q:'Water is polar. Switch to methane, CH₄, the gas cows burp. Is methane polar?',
     choices:['Yes, like water','No: C and H share electrons almost evenly','It is ionic'],correct:1,baseline:{view:'mol',mol:'water'},change:{mol:'methane'},changeText:'Switched to methane',
     explain:'Carbon and hydrogen pull on electrons about equally, so all 4 C–H bonds are nonpolar and the molecule has no δ+ or δ− end. That is why methane barely dissolves in water.'},
    {lvl:'bio',q:'A salt crystal is held together by ionic bonds. You drop it into water. What happens?',
     choices:['It stays a solid crystal, the way oil stays separate','Water pulls the ions apart and surrounds each one','Na and Cl start sharing electrons and become a molecule'],correct:1,
     baseline:{view:'mol',mol:'salt',wet:false},change:{wet:true},changeText:'Salt dropped into water',
     explain:'Water’s δ− O ends are drawn to Na⁺ and its δ+ H ends to Cl⁻. Many water molecules pull on each ion at once, so the crystal comes apart and each ion ends up wrapped in water. That is how your blood carries Na⁺ and Cl⁻.'},
    {lvl:'bio',q:'You heat DNA to 95 °C, as in PCR. Which bonds break?',
     choices:['The covalent bonds in each strand’s backbone','The hydrogen bonds between base pairs, not the backbone','Both kinds'],correct:1,baseline:{view:'hb',hb:'dna',gc:4},changeAction:'heat',changeText:'Heated to 95 °C',
     explain:'No covalent bonds break: the hydrogen bonds between the bases come apart, and the backbone stays whole. Heat also breaks up the stacking between neighboring bases. Each strand can then be used as a template.'},
    {lvl:'honors',q:'CO₂ has two polar C=O bonds. Is the molecule polar?',
     choices:['Yes: polar bonds always make a polar molecule','No: the two pulls point in opposite directions and cancel','It depends on the temperature'],correct:1,baseline:{view:'mol',mol:'water'},change:{mol:'co2'},changeText:'Switched to CO₂',
     explain:{honors:'Each O pulls electrons away from C, but CO₂ is a straight line, so the two pulls cancel and the molecule is nonpolar. Water’s two O–H pulls do not cancel, because water is bent.'}},
    {lvl:'honors',q:'Nitrogen has 5 valence electrons. Give nitrogen H atoms until every unpaired electron is shared. How many bonds and lone pairs?',
     choices:['3 bonds and 1 lone pair','5 bonds and no lone pairs','4 bonds and no lone pairs'],correct:0,baseline:{view:'build',ctr:'N',nH:0},changeAction:'fill',changeText:'Outer shell filled',
     explain:{honors:'Three electrons are unpaired, so N makes 3 bonds (NH₃). The other 2 electrons stay together as a lone pair: 3 × 2 + 2 = 8. The lone pair pushes the H atoms into a pyramid, so ammonia is polar.'}},
    {lvl:'honors',q:'This 10-pair piece of DNA is all A–T, linked by 20 hydrogen bonds. Swap 5 of the pairs for G–C. How many hydrogen bonds link the strands now?',
     choices:['20','25','30'],correct:1,baseline:{view:'hb',hb:'dna',gc:0},change:{gc:5},changeText:'5 pairs swapped to G–C',
     explain:{honors:'5 A–T pairs × 2 = 10, plus 5 G–C pairs × 3 = 15, for 25 in all. G–C pairs have 3 hydrogen bonds and also stack more tightly, so G–C-rich DNA takes more heat to separate.'}},
    {lvl:'honors',q:'A lab tags DNA with phosphorus-32, half-life 14.3 days. What share of the P-32 is still radioactive after 2 half-lives (28.6 days)?',
     choices:['50%','25%','0%: it is all gone'],correct:1,baseline:{view:'atom',el:'P',iso:'1',hl:0},change:{hl:2},changeText:'2 half-lives passed',
     explain:{honors:'Each half-life halves what is left: 100% to 50% to 25%. Labs order P-32 fresh because after about 10 weeks (5 half-lives) only about 3% is left.'}},
    {lvl:'honors',q:'Butane, a C–H chain, stays out of water. Acetone is about the same size but has one C=O group. Does acetone mix with water?',
     choices:['No: it is mostly C–H too','Yes: its polar C=O lets water hydrogen-bond to it','Only if you heat it'],correct:1,baseline:{view:'mol',mol:'butane',wet:true},change:{mol:'acetone'},changeText:'Switched to acetone',
     explain:{honors:'Water’s δ+ H atoms hydrogen-bond to acetone’s δ− O, and acetone mixes with water completely. One polar group can make a small molecule hydrophilic. Sugars have many O–H groups, which is why they dissolve so well.'}},
    {lvl:'ap',q:'You shake oil and water until the oil breaks into small drops, then leave it alone. What happens?',
     choices:['The drops stay spread out','The oil slowly dissolves','The drops merge into fewer, bigger drops'],correct:2,baseline:{view:'hb',hb:'oil'},changeAction:'shake',changeText:'Shaken into 8 drops',reveal:7,
     explain:{ap:'Water molecules hydrogen-bond to each other and not to nonpolar C–H chains, so the oil is pushed together. This hydrophobic effect also drives phospholipids into bilayers and nonpolar R groups into a protein’s core.'}},
    {lvl:'ap',q:'Breaking 1 mole of O–H bonds takes about 464 kJ. Breaking 1 mole of hydrogen bonds between water molecules takes about 23 kJ. About how many times stronger is the covalent bond?',
     choices:['2 times','20 times','200 times'],correct:1,instant:true,
     explain:{ap:'464 ÷ 23 ≈ 20. That is why water can boil at 100 °C, breaking hydrogen bonds between molecules, while every O–H bond inside each molecule stays intact.'}},
    {lvl:'ap',q:'Heat makes a protein’s β-sheet come apart. What held the two strands together before you heated it?',
     choices:['Peptide bonds between the strands','Hydrogen bonds between C=O and N–H groups of the backbone','Ionic bonds between Na⁺ and Cl⁻'],correct:1,baseline:{view:'hb',hb:'protein'},changeAction:'heat',changeText:'Heated to 95 °C',
     explain:{ap:'Peptide bonds run along each strand and stay whole. Between strands, each C=O is hydrogen-bonded to an N–H, and those weak bonds are what heat breaks when a protein denatures.'}},
    {lvl:'ap',q:'A protein folds in water. Where do most amino acids with nonpolar R groups, made of only C and H, end up?',
     choices:['Packed in the core, away from water','On the surface, touching water','Hydrogen-bonded to water'],correct:0,instant:true,
     explain:{ap:'Nonpolar R groups cannot hydrogen-bond to water, so the hydrophobic effect pushes them inward, the same way oil drops merge. Polar and charged R groups tend to stay on the surface, where water surrounds them.'}}
  ],
  lab:{bio:'<p><b>Question:</b> What about a molecule’s bonds predicts whether it dissolves in water?</p><ol><li>Choose <b>Molecules</b>. For each of the 8 substances, press <b>Record trial</b>.</li><li>In your table, note the number of polar bonds, whether the substance is polar, and what it does in water.</li><li>Turn on <b>Put it in water</b> and watch where the water molecules go for 3 of them.</li></ol><p>Write a claim: which kind of molecule dissolves in water? Use at least 3 molecules from your table as evidence.</p>',
       honors:'<p><b>Question:</b> Can you predict bonds and polarity before you look?</p><ol><li>In <b>Build a molecule</b>, add H to C, N and O one at a time. Record bonds, unpaired electrons and lone pairs each time.</li><li>Before you open each molecule in <b>Molecules</b>, write your prediction: polar or nonpolar? Then check it. Pay attention to CO₂ and ammonia.</li><li>In <b>Between molecules</b>, record the hydrogen bonds in DNA with 0, 5 and 10 G–C pairs.</li></ol><p>Explain the rule that tells you whether a molecule with polar bonds is polar overall, using shape and lone pairs.</p>',
       ap:'<p><b>Question:</b> How does bond polarity explain hydrophobic and hydrophilic behavior in cells?</p><ol><li>Compare butane and acetone with <b>Put it in water</b> on. Record their bond types.</li><li>In <b>Oil in water</b>, press <b>Shake it</b> and record the number of oil drops every 2 seconds.</li><li>In <b>Protein β-sheet</b>, record the hydrogen bonds and covalent bonds broken before and after heating.</li></ol><p><b>Claim–evidence–reasoning:</b> explain why phospholipid tails end up inside a membrane and nonpolar R groups inside a folded protein, and why heat can unfold a protein without changing its amino acid sequence.</p>'},
  terms:[{t:'Proton',d:'A positive particle in the nucleus. The number of protons, the atomic number, decides the element.'},{t:'Neutron',d:'A particle with no charge in the nucleus.'},{t:'Electron',d:'A negative particle that moves around the nucleus. A neutral atom has as many electrons as protons.'},
    {t:'Mass number',d:'Protons plus neutrons.'},{t:'Isotope',d:'Atoms of the same element with different numbers of neutrons, such as C-12 and C-14.'},{t:'Radioactive isotope',d:'An isotope whose nucleus breaks down over time, giving off radiation that can be detected. Biologists use them as tracers.'},
    {t:'Valence electrons',d:'The electrons in an atom’s outer shell. They are the ones that form bonds.'},{t:'Covalent bond',d:'A bond in which two atoms share a pair of electrons.'},{t:'Polar covalent bond',d:'A covalent bond in which one atom pulls the shared electrons closer, as in O–H.'},
    {t:'Nonpolar covalent bond',d:'A covalent bond with electrons shared about evenly, as in C–H and C–C.'},{t:'Ionic bond',d:'The attraction between ions with opposite charges, such as Na⁺ and Cl⁻.'},{t:'Electronegativity',d:'How strongly an atom pulls on shared electrons. O and N pull hard; C and H pull about equally.'},
    {t:'Hydrogen bond',d:'A weak attraction between an H that is bonded to O or N and a lone pair on another O or N. It links molecules, or parts of a big molecule.'},
    {lvl:'honors',t:'Half-life',d:'The time it takes for half of a sample of a radioactive isotope to decay.'},{lvl:'honors',t:'Lone pair',d:'A pair of valence electrons that is not shared with another atom.'},{lvl:'honors',t:'Double bond',d:'Two shared pairs of electrons between the same two atoms, as in C=O.'},
    {lvl:'honors',t:'Polar molecule',d:'A molecule with a δ+ end and a δ− end. It needs polar bonds whose pulls do not cancel.'},
    {lvl:'ap',t:'Hydrophilic',d:'Water-loving: polar or charged, so water hydrogen-bonds to it or surrounds it.'},{lvl:'ap',t:'Hydrophobic',d:'Water-fearing: mostly nonpolar C–H, so water pushes it together and out of the way.'},
    {lvl:'ap',t:'β-sheet and α-helix',d:'Protein shapes held by hydrogen bonds between C=O and N–H groups of the backbone.'}],
  about:'<p><b>Atoms</b> are drawn as Bohr models: a nucleus of protons and neutrons with electrons in shells of 2, 8 and 8. Real electrons do not travel in circles, and a real nucleus is about 100,000 times smaller than its atom. Half-lives and natural abundances come from standard nuclear data (NUBASE2020), rounded: H-3 12.3 years, C-14 5,700 years, N-13 9.97 minutes, O-15 122 seconds, P-32 14.3 days, P-33 25.4 days, S-35 87.4 days, Na-22 2.6 years, Na-24 15.0 hours, Cl-36 301,000 years. The 16-atom sample halves exactly at each half-life; real decay is random, so only a large sample halves this neatly.</p>'+
    '<p><b>Bond types</b> come from the difference in electronegativity on the Pauling scale (H 2.20, C 2.55, N 3.04, O 3.44, P 2.19, S 2.58, Na 0.93, Cl 3.16). As a rule of thumb (OpenStax Chemistry 2e, Figure 7.8), a difference under 0.4 is nonpolar covalent, 0.4 to 1.8 is polar covalent, and larger is ionic. Molecules are flat drawings of 3-D shapes: methane is really a tetrahedron and ammonia a pyramid.</p>'+
    '<p><b>Bond energies</b> are average values for breaking 1 mole of each bond (OpenStax Chemistry 2e, Table 7.2). The ionic value is the lattice energy of solid NaCl, 769 kJ/mol, which counts every attraction in the crystal. The hydrogen bond in water is about 23 kJ/mol (Suresh and Naik, 2000).</p>'+
    '<p><b>Simplified:</b> hydrogen bonds in liquid water really last only trillionths of a second; the flicker here is slowed down. The DNA is drawn as a flat ladder, not a twisted helix, and the stacking between neighboring base pairs, which does most of the work of holding the helix together, is not shown. The oil drops drift together much faster than in a real jar, where they rise and join within minutes.</p>'+
    '<p><b>Body composition</b> (Campbell Biology, Table 2.1): oxygen 65%, carbon 18.5% and hydrogen 9.5% of body mass, 93% together. With nitrogen 3.3%, phosphorus 1.0% and sulfur 0.3%, the six CHNOPS elements make up 97.6%.</p>',
  thumbSetup(sim){BioLab.setValues(sim,{view:'mol',mol:'water',wet:true});BioLab.reset(sim);},
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.view==='atom')drawAtom(sim,ctx,k,t);else if(p.view==='build')drawBuild(sim,ctx,k,t);else if(p.view==='mol')drawMolView(sim,ctx,k,t);else drawHB(sim,ctx,vdt,k,t);}
};

/* ---------- atom view ---------- */
const TILE=(i)=>({x:SPX+12+(i%3)*72,y:SPY+52+Math.floor(i/3)*52,w:64,h:44});
function tileAt(x,y){for(let i=0;i<ELS.length;i++){const r=TILE(i);if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h)return ELS[i];}return null;}
function drawAtom(sim,ctx,k,t){const p=sim.p,E=curEl(p),I=curIso(p),Z=E.Z,N=I.A-Z,ax=350,ay=236,R=[62,102,142],hon=atLeast('honors');
  txt(ctx,E.name+'-'+I.A+(I.nick?' ('+I.nick+')':''),ax,32,{s:17*Math.min(k,1.5),w:800,a:'center'});
  txt(ctx,valence(E)+' valence electron'+(valence(E)>1?'s':''),ax,32+20*Math.min(k,1.5),{s:12*k,c:PAL['cv-soft'],a:'center'});
  /* shells and electrons */
  E.sh.forEach((n,i)=>{const r=R[i],outer=i===E.sh.length-1;ctx.strokeStyle=outer?PAL['cv-e']:PAL['line'];ctx.lineWidth=outer?2.5:1.5;ctx.beginPath();ctx.arc(ax,ay,r,0,6.29);ctx.stroke();
    for(let j=0;j<n;j++){const a=j/n*6.283-1.57+(RM?0:t*0.25/(i+1));const x=ax+Math.cos(a)*r,y=ay+Math.sin(a)*r;if(outer){ctx.fillStyle=PAL['cv-e'];ctx.globalAlpha=.25;ctx.beginPath();ctx.arc(x,y,10,0,6.29);ctx.fill();ctx.globalAlpha=1;}edot(ctx,x,y);}});
  /* nucleus: protons and neutrons mixed evenly */
  const tot=Z+N,ty=[];let pc=0;for(let i=0;i<tot;i++){const want=Math.round((i+1)*Z/tot);ty.push(want>pc?'p':'n');if(want>pc)pc++;}
  const c=tot>20?5.6:6.6;for(let i=tot-1;i>=0;i--){const r=c*Math.sqrt(i+0.5),a=i*2.39996;const x=ax+Math.cos(a)*r,y=ay+Math.sin(a)*r;ctx.fillStyle=ty[i]==='p'?'#d64545':'#8a8f98';ctx.beginPath();ctx.arc(x,y,6.2,0,6.29);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=1;ctx.stroke();}
  {const L1=Z+' proton'+(Z>1?'s':'')+' + '+N+' neutron'+(N===1?'':'s')+' = mass number '+I.A,L2=Z+' p + '+N+' n = mass number '+I.A;ctx.font='700 '+13*k+'px '+FONT;
   txt(ctx,ctx.measureText(L1).width<400?L1:L2,ax,404,{s:13*k,w:700,a:'center'});}
  txt(ctx,I.hl?'Radioactive: half-life '+fq(I.hl)+' '+I.u:'Stable: it never decays',ax,404+20*k,{s:12*k,c:I.hl?PAL['s1']:PAL['cv-soft'],a:'center'});
  /* legend */
  [['#d64545','proton (+)'],['#8a8f98','neutron (0)'],[PAL['cv-e'],'electron (−)']].forEach(([c,l],i)=>{const y=28+i*22*k;ctx.fillStyle=c;ctx.beginPath();ctx.arc(20,y-4,6,0,6.29);ctx.fill();txt(ctx,l,32,y,{s:12*k,c:PAL['cv-ink']});});
  /* decay sample */
  if(I.hl){const left=Math.round(16*Math.pow(0.5,p.hl)),y0=200;wrap(ctx,'A sample of 16 atoms',14,y0,150,15*k,{s:12*k,w:700});
    for(let i=0;i<16;i++){const x=24+(i%4)*30,y=y0+28*k+Math.floor(i/4)*28;ctx.beginPath();ctx.arc(x,y,9,0,6.29);if(i<left){ctx.fillStyle=PAL['s1'];ctx.fill();}else{ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();}}
    txt(ctx,left+' still radioactive',14,y0+28*k+4*28+4,{s:12*k,c:PAL['cv-ink']});}
  /* side panel: elements of life */
  side(ctx,'Elements of life',k);
  ELS.forEach((e,i)=>{const r=TILE(i),on=e===p.el,chn='CHNOPS'.includes(e)&&e.length===1;ctx.fillStyle=on?COL[e]:PAL['card'];rr(ctx,r.x,r.y,r.w,r.h,8);ctx.fill();ctx.strokeStyle=on?PAL['cv-ink']:PAL['line'];ctx.lineWidth=on?2.5:1;ctx.stroke();
    txt(ctx,e,r.x+r.w/2,r.y+r.h/2+1,{s:Math.min(16*k,24),w:800,a:'center',b:'middle',c:on?(e==='H'?'#1d232b':'#fff'):(chn?PAL['cv-ink']:PAL['cv-soft'])});});
  let y=SPY+52+3*52+18;txt(ctx,'Found in:',SPX+12,y,{s:12*k,w:700});y=wrap(ctx,E.found,SPX+12,y+16*k,SPW-24,15*k,{s:12*k,c:PAL['cv-soft']});
  if(hon&&I.ab){y=wrap(ctx,isoName(p.el,I)+': '+I.ab,SPX+12,y+8,SPW-24,15*k,{s:12*k,c:PAL['cv-soft']});}}

/* ---------- build view ---------- */
function drawBuild(sim,ctx,k,t){const b=buildState(sim.p),C=b.C,cx=270,cy=236,hon=atLeast('honors');
  txt(ctx,b.f,cx,40,{s:22*Math.min(k,1.4),w:800,a:'center'});
  [[PAL['cv-e'],'from '+b.c],[PAL['s2'],'from H']].forEach(([c,l],i)=>{const y=404+i*22*Math.min(k,1.3);ctx.fillStyle=c;ctx.beginPath();ctx.arc(20,y-4,5,0,6.29);ctx.fill();txt(ctx,'electron '+l,32,y,{s:12*k}); });
  const slots=[];C.hs.forEach(a=>slots.push({a,kind:'single'}));C.lps.forEach(a=>slots.push({a,kind:'pair'}));
  let hLeft=b.n,ionLeft=b.bonds-Math.min(b.n,C.use);const used=slots.map(sl=>{if(sl.kind==='single'&&hLeft>0){hLeft--;return 'bond';}return sl.kind;});
  slots.forEach((sl,i)=>{if(used[i]==='pair'&&ionLeft>0){ionLeft--;used[i]='dative';}});
  slots.forEach((sl,i)=>{const a=sl.a*Math.PI/180,ux=Math.cos(a),uy=Math.sin(a),nx=-uy,ny=ux;
    if(used[i]==='bond'||used[i]==='dative'){const hx=cx+ux*116,hy=cy+uy*116;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx+ux*34,cy+uy*34);ctx.lineTo(hx-ux*18,hy-uy*18);ctx.stroke();
      const mx=cx+ux*68,my=cy+uy*68;edot(ctx,mx+nx*6,my+ny*6,used[i]==='dative'?PAL['cv-e']:PAL['cv-e']);edot(ctx,mx-nx*6,my-ny*6,used[i]==='dative'?PAL['cv-e']:PAL['s2']);ball(ctx,'H',hx,hy,k,18);}
    else if(used[i]==='pair'){const mx=cx+ux*50,my=cy+uy*50;edot(ctx,mx+nx*6,my+ny*6);edot(ctx,mx-nx*6,my-ny*6);if(hon)txt(ctx,'lone pair',cx+ux*82,cy+uy*82+4,{s:12*k,c:PAL['cv-soft'],a:'center'});}
    else{const mx=cx+ux*50,my=cy+uy*50;ctx.fillStyle=PAL['cv-e'];ctx.globalAlpha=RM?.35:.25+.2*Math.sin(t*3);ctx.beginPath();ctx.arc(mx,my,11,0,6.29);ctx.fill();ctx.globalAlpha=1;edot(ctx,mx,my);}});
  if(b.spare){const a=322*Math.PI/180,hx=cx+Math.cos(a)*150,hy=cy+Math.sin(a)*150;ctx.globalAlpha=.55;ball(ctx,'H',hx,hy,k,18);ctx.globalAlpha=1;edot(ctx,hx-24,hy+6,PAL['s2']);txt(ctx,'repelled: no bond',hx,hy-32,{s:12*k,c:PAL['s1'],a:'center',w:700});}
  ball(ctx,b.c,cx,cy,k,34);if(b.ion)pill(ctx,'+',b.c==='O'?cx:cx+40,b.c==='O'?cy+56:cy-40,PAL['s1'],'#fff',14*k);
  side(ctx,'Outer shell of '+b.c,k);
  for(let i=0;i<8;i++){const x=SPX+32+(i%4)*48,y=SPY+64+Math.floor(i/4)*40;ctx.beginPath();ctx.arc(x,y,12,0,6.29);const fromH=i<2*(b.bonds-(b.ion?1:0))&&i%2===1;if(i<b.shell){ctx.fillStyle=fromH?PAL['s2']:PAL['cv-e'];ctx.fill();}ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();}
  let y=SPY+64+80+12;txt(ctx,b.shell+' of 8 electrons'+(b.shell===8?': full':''),SPX+12,y,{s:13*k,w:700});
  y=wrap(ctx,b.bonds+' bond'+(b.bonds===1?'':'s')+', '+b.unp+' unpaired, '+b.lp+' lone pair'+(b.lp===1?'':'s'),SPX+12,y+18*k,SPW-24,15*k,{s:12*k,c:PAL['cv-soft']});
  wrap(ctx,buildShort(b),SPX+12,y+10,SPW-24,15*k,{s:12*k,w:700});}

/* ---------- molecule view ---------- */
function drawMolView(sim,ctx,k,t){const p=sim.p,s=sim.st,M=curMol(p),hon=atLeast('honors'),fade=s.dis;
  txt(ctx,M.name+', '+M.f,CX,30,{s:15*Math.min(k,1.5),w:800,a:'center'});
  if(M.salt)drawSalt(sim,ctx,k,t);
  else{const A=layout(p.mol),B=bondList(p.mol);
    if(fade>0.02){ctx.save();ctx.globalAlpha=fade;const W=sim.vis.ws&&sim.vis.wsId===p.mol?sim.vis.ws:(sim.vis.wsId=p.mol,sim.vis.ws=waterShell(p.mol));
      const jig=i=>RM?0:Math.sin(t*1.6+i*1.3)*2.5;
      W.ring.forEach((w,i)=>{const n=W.ring[(i+1)%W.ring.length];if(Math.hypot(n.x-w.x,n.y-w.y)<110){const [a,b2]=shorten([w.x,w.y],[n.x,n.y],12,12);dash(ctx,a,b2,0.45*fade,1.4);}});
      W.ring.forEach((w,i)=>wat(ctx,w.x+jig(i),w.y,w.ang+(RM?0:Math.sin(t*0.8+i)*0.3),0.85));
      W.sites.forEach((w,i)=>{const m=wat(ctx,w.x,w.y,w.ang,0.95);const from=w.hb.from==='O'?m.O:m.H[0];const [a,b2]=shorten(from,w.hb.to,w.hb.from==='O'?9:5,0);dash(ctx,a,b2,fade,2);});ctx.restore();}
    B.forEach((b,i)=>{const a=A[b.a],c=A[b.b],dx=c.x-a.x,dy=c.y-a.y,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,nx=-uy,ny=ux,sel=i===s.sel%B.length;
      if(sel){ctx.strokeStyle=PAL['cv-e'];ctx.globalAlpha=.45;ctx.lineWidth=b.o===2?20:14;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(c.x,c.y);ctx.stroke();ctx.globalAlpha=1;ctx.lineCap='butt';}
      ctx.strokeStyle=b.type==='polar'?PAL['s2']:PAL['cv-soft'];ctx.lineWidth=3;const offs=b.o===2?[-6,6]:[0];
      offs.forEach(o=>{ctx.beginPath();ctx.moveTo(a.x+nx*o,a.y+ny*o);ctx.lineTo(c.x+nx*o,c.y+ny*o);ctx.stroke();});
      const lo=(RAD[a.e]+7)/L,hi=1-(RAD[c.e]+7)/L,sh=clamp((EN[c.e]-EN[a.e])/1.2,-1,1),f=(lo+hi)/2+sh*(hi-lo)/2;
      const ex=a.x+dx*f,ey=a.y+dy*f;(b.o===2?[-12,-4,4,12]:[-4,4]).forEach(o=>edot(ctx,ex+nx*o+ux*0,ey+ny*o));});
    A.forEach(a=>ball(ctx,a.e,a.x,a.y,k));
    if(hon)Object.entries(curMol(p).lp).forEach(([i,dirs])=>{const a=A[+i];dirs.forEach(d=>{const r0=RAD[a.e]+8,x=a.x+d[0]*r0,y=a.y+d[1]*r0,nx=-d[1],ny=d[0];edot(ctx,x+nx*5,y+ny*5);edot(ctx,x-nx*5,y-ny*5);});});
    /* partial charges */
    const q=A.map(()=>0);B.forEach(b=>{if(b.type!=='polar')return;const ea=EN[A[b.a].e],ec=EN[A[b.b].e];if(ea>ec){q[b.a]--;q[b.b]++;}else{q[b.a]++;q[b.b]--;}});
    A.forEach((a,i)=>{if(!q[i])return;let vx=0,vy=0;B.forEach(b=>{if(b.a===i||b.b===i){const o=A[b.a===i?b.b:b.a];vx+=o.x-a.x;vy+=o.y-a.y;}});let L=Math.hypot(vx,vy);if(L<1){vx=0;vy=1;L=1;}const qd=(curMol(p).qdir||{})[i];if(qd){vx=-qd[0];vy=-qd[1];L=1;}
      const lpOn=hon&&(curMol(p).lp[i]||[]).length,dist=RAD[a.e]+(lpOn?26:15),W=fade>0.02&&sim.vis.ws?sim.vis.ws.sites:[],base=Math.atan2(-vy,-vx);let x=a.x-vx/L*dist,y=a.y-vy/L*dist;
      for(const da of [0,0.6,-0.6,1.1,-1.1,1.6,-1.6]){const th=base+da,cx2=a.x+Math.cos(th)*dist,cy2=a.y+Math.sin(th)*dist;if(W.every(w=>Math.hypot(w.x-cx2,w.y-cy2)>30)&&A.every(o=>o===a||Math.hypot(o.x-cx2,o.y-cy2)>RAD[o.e]+10)){x=cx2;y=cy2;break;}}
      txt(ctx,q[i]<0?'δ−':'δ+',x,y,{s:13*k,w:800,c:q[i]<0?PAL['s1']:PAL['s2'],a:'center',b:'middle'});});
    const b=B[s.sel%B.length];txt(ctx,'Selected: '+b.name+', '+TYPE_L[b.type],CX,432,{s:12*k,w:700,a:'center',c:PAL['cv-ink']});}
  /* side panel */
  let y=side(ctx,'Bond key',k);
  [[PAL['cv-soft'],'nonpolar: even sharing'],[PAL['s2'],'polar: uneven sharing'],[PAL['s5'],'ionic: electron moved']].forEach(([c,l])=>{ctx.fillStyle=c;rr(ctx,SPX+12,y-2,22,6,3);ctx.fill();y=wrap(ctx,l,SPX+42,y+4,SPW-54,15*k,{s:12*k})+4;});
  edot(ctx,SPX+23,y+2);y=wrap(ctx,'shared electron pair',SPX+42,y+6,SPW-54,15*k,{s:12*k})+10;
  ctx.strokeStyle=PAL['line'];ctx.beginPath();ctx.moveTo(SPX+12,y-4);ctx.lineTo(SPX+SPW-12,y-4);ctx.stroke();
  y=wrap(ctx,({polar:'Polar molecule',nonpolar:'Nonpolar molecule',ionic:'Ionic compound'})[M.pol],SPX+12,y+14*k,SPW-24,17*k,{s:14*k,w:800,c:M.pol==='polar'?PAL['s2']:M.pol==='ionic'?PAL['s5']:PAL['cv-ink']});
  y=wrap(ctx,'In water: '+M.watS.toLowerCase(),SPX+12,y+2*k,SPW-24,15*k,{s:12*k,c:PAL['cv-soft']});
  wrapFit(ctx,M.where,SPX+12,y+12,SPW-24,15*k,{s:12*k,c:PAL['cv-ink']},SPY+SPH-12);}
function drawSalt(sim,ctx,k,t){const s=sim.st,f=s.dis,e=x=>x*x*(3-2*x),g=e(clamp(f*1.25,0,1));
  for(let j=0;j<2;j++)for(let i=0;i<3;i++){const na=(i+j)%2===0,x0=CX+(i-1)*56,y0=CY+(j-0.5)*56,x1=CX+(i-1)*160,y1=CY+(j-0.5)*170+(i===1?(j?20:-20):0);
    const x=lerp(x0,x1,g)+(RM?0:Math.sin(t*1.3+i+j*2)*2*g),y=lerp(y0,y1,g);
    if(f>0.05){ctx.save();ctx.globalAlpha=clamp(f*1.6-0.2,0,1);const rI=na?17:24;for(let w=0;w<4;w++){const th=w/4*6.283+0.785+(i+j)*0.3,wx=x+Math.cos(th)*(rI+20),wy=y+Math.sin(th)*(rI+20);
      wat(ctx,wx,wy,na?th:th+Math.PI+0.91,0.9);}ctx.restore();}
    ctx.fillStyle=na?COL.Na:COL.Cl;ctx.beginPath();ctx.arc(x,y,na?17:24,0,6.29);ctx.fill();txt(ctx,na?'Na⁺':'Cl⁻',x,y+1,{s:Math.min(13*k,20),w:800,c:'#fff',a:'center',b:'middle'});}
  if(f<0.05){ctx.strokeStyle=PAL['s5'];ctx.setLineDash([2,4]);ctx.lineWidth=1.5;ctx.strokeRect(CX-112,CY-60,224,120);ctx.setLineDash([]);
    txt(ctx,'opposite charges attract: ionic bonds',CX,CY+96,{s:12*k,c:PAL['cv-soft'],a:'center'});}
  txt(ctx,f<0.5?'A dry salt crystal':'Ions surrounded by water',CX,432,{s:12*k,w:700,a:'center'});}

/* ---------- between molecules ---------- */
function drawHB(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st,hon=atLeast('honors');let y;
  if(p.hb==='water'){txt(ctx,'Liquid water, zoomed in',CX,30,{s:15*Math.min(k,1.5),w:800,a:'center'});
    const pos=WGRID.W.map((w,i)=>[w.x+(RM?0:Math.sin(t*1.5+w.ph)*3),w.y+(RM?0:Math.cos(t*1.2+w.ph)*3)]);
    WGRID.B.forEach(b=>{if(!hbOn(b,t))return;const a=pos[b.a],c=pos[b.b],ang=Math.PI/4,hx=a[0]+Math.cos(b.h?ang+0.91:ang-0.91)*13,hy=a[1]+Math.sin(b.h?ang+0.91:ang-0.91)*13;const [u,v]=shorten([hx,hy],c,5,10);dash(ctx,u,v);});
    pos.forEach((q,i)=>wat(ctx,q[0],q[1],Math.PI/4+(RM?0:Math.sin(t+WGRID.W[i].ph)*0.12),1.1));
    txt(ctx,'dashed line = hydrogen bond',CX,432,{s:12*k,w:700,a:'center'});
    y=side(ctx,'Breaking 1 mole of bonds',k)+6;const bars=[['O–H bond inside water',E_OF('O–H'),PAL['s2']],['Hydrogen bond between waters',E_OF('hb'),PAL['s3']]];
    bars.forEach(([l,v,c])=>{y=wrap(ctx,l,SPX+12,y,SPW-24,15*k,{s:12*k});ctx.fillStyle=c;rr(ctx,SPX+12,y-6,Math.max(4,(SPW-30-60*k)*v/E_OF('O–H')),14,4);ctx.fill();txt(ctx,v+' kJ',SPX+18+Math.max(4,(SPW-30-60*k)*v/E_OF('O–H')),y+5,{s:12*k,c:PAL['cv-soft']});y+=14+16*k;});
    wrap(ctx,'About 20 times weaker, but there are so many that together they hold water together.',SPX+12,y+6,SPW-24,15*k,{s:12*k,c:PAL['cv-soft']});return;}
  if(p.hb==='dna'){const S=dnaSeq(Math.round(p.gc)),L=150,Rr=410;sim.vis.sep=sim.vis.sep||[];const sep=sim.vis.sep;
    for(let i=0;i<NBP;i++){const tgt=i<s.open?1:0;sep[i]=sep[i]===undefined?tgt:sep[i]+(tgt-sep[i])*Math.min(1,(vdt||0)*4+(RM?1:0));}
    txt(ctx,'Strand 1',L,30,{s:13*k,w:700,a:'center'});txt(ctx,'Strand 2',Rr,30,{s:13*k,w:700,a:'center'});
    const ys=i=>58+i*37,dx=i=>sep[i]*34;
    [[L,-1],[Rr,1]].forEach(([x,sg])=>{ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=4;ctx.beginPath();for(let i=0;i<NBP;i++){const X=x+sg*dx(i),Y=ys(i)+12;i?ctx.lineTo(X,Y):ctx.moveTo(X,Y-20);}ctx.lineTo(x+sg*dx(NBP-1),ys(NBP-1)+32);ctx.stroke();
      for(let i=0;i<NBP;i++){ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(x+sg*dx(i),ys(i)+12,6,0,6.29);ctx.fill();}});
    S.forEach((b,i)=>{const y0=ys(i),d=dx(i);ctx.fillStyle=BASEC[b[0]];rr(ctx,L+8-d,y0,96,24,5);ctx.fill();ctx.fillStyle=BASEC[b[1]];rr(ctx,Rr-104+d,y0,96,24,5);ctx.fill();
      txt(ctx,b[0],L+56-d,y0+13,{s:Math.min(12*k,20),w:800,c:'#fff',a:'center',b:'middle'});txt(ctx,b[1],Rr-56+d,y0+13,{s:Math.min(12*k,20),w:800,c:'#fff',a:'center',b:'middle'});
      if(sep[i]<0.3){const n=(b[0]==='G'||b[0]==='C')?3:2,offs=n===3?[-7,0,7]:[-5,5];ctx.save();ctx.globalAlpha=1-sep[i]*3;offs.forEach(o=>{ctx.setLineDash([3,3]);ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(L+106-d,y0+12+o);ctx.lineTo(Rr-106+d,y0+12+o);ctx.stroke();});ctx.restore();}});
    txt(ctx,'dashed lines = hydrogen bonds',CX,432,{s:12*k,w:700,a:'center'});
    y=side(ctx,'Base pairs',k)+8;[['A','T',2],['G','C',3]].forEach(([a,b,n])=>{ctx.fillStyle=BASEC[a];rr(ctx,SPX+12,y-12,30,22,4);ctx.fill();ctx.fillStyle=BASEC[b];rr(ctx,SPX+72,y-12,30,22,4);ctx.fill();
      txt(ctx,a,SPX+27,y,{s:13,w:800,c:'#fff',a:'center',b:'middle'});txt(ctx,b,SPX+87,y,{s:13,w:800,c:'#fff',a:'center',b:'middle'});
      for(let j=0;j<n;j++){const o=(j-(n-1)/2)*6;ctx.setLineDash([3,3]);ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(SPX+44,y+o);ctx.lineTo(SPX+70,y+o);ctx.stroke();ctx.setLineDash([]);}
      txt(ctx,n+' H bonds',SPX+112,y+4,{s:12*k});y+=34;});
    ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(SPX+20,y,6,0,6.29);ctx.fill();y=wrap(ctx,'backbone: covalent bonds',SPX+34,y+4,SPW-46,15*k,{s:12*k})+8;
    y=wrap(ctx,dnaHB(p,s.open)+' hydrogen bonds still link the two strands.',SPX+12,y+4,SPW-24,15*k,{s:12*k,w:700});
    if(s.hot)wrap(ctx,'At 95 °C every pair is apart. Cool it and the bases pair up again.',SPX+12,y+8,SPW-24,15*k,{s:12*k,c:PAL['cv-soft']});return;}
  if(p.hb==='oil'){txt(ctx,'Oil drops in water',CX,30,{s:15*Math.min(k,1.5),w:800,a:'center'});const D=s.drops,pts=[];
    for(let j=0;j<8;j++)for(let i=0;i<11;i++){const x=40+i*46+(j%2)*23,y2=70+j*46;if(x>530)continue;if(D.some(d=>Math.hypot(d.x-x,d.y-y2)<d.r+14))continue;pts.push([x,y2]);}
    pts.forEach((a,i)=>{pts.forEach((b,j)=>{if(j>i&&Math.abs(b[1]-a[1])<1&&b[0]-a[0]<50)dash(ctx,...shorten(a,b,10,10),0.5,1.3);});});
    pts.forEach((a,i)=>wat(ctx,a[0]+(RM?0:Math.sin(t*1.4+i)*2),a[1],0.6+i*1.7,0.75));
    D.forEach(d=>{ctx.fillStyle='#e2b93b';ctx.strokeStyle='#a8841c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,6.29);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#8a6a10';ctx.lineWidth=2;const m=Math.max(1,Math.floor(d.r/14));for(let r2=0;r2<m;r2++){const yy=d.y+(r2-(m-1)/2)*12,hw=Math.sqrt(Math.max(0,d.r*d.r-(yy-d.y)*(yy-d.y)))*0.75;ctx.beginPath();for(let x=-hw;x<=hw;x+=8){const Y=yy+((Math.round((x+hw)/8))%2?3:-3);x===-hw?ctx.moveTo(d.x+x,Y):ctx.lineTo(d.x+x,Y);}ctx.stroke();}});
    txt(ctx,D.length===1?'One oil drop':D.length+' oil drops',CX,432,{s:12*k,w:700,a:'center'});
    y=side(ctx,'Why oil and water separate',k)+6;y=wrap(ctx,'Water molecules hydrogen-bond to each other (dashed lines).',SPX+12,y,SPW-24,15*k,{s:12*k})+8;
    y=wrap(ctx,'Oil is C–H chains (zigzags). They are nonpolar, so they cannot join in.',SPX+12,y,SPW-24,15*k,{s:12*k})+8;
    wrap(ctx,'Water squeezes the oil together: the hydrophobic effect.',SPX+12,y,SPW-24,15*k,{s:12*k,w:700});return;}
  /* protein beta-sheet */
  txt(ctx,'Two strands of a β-sheet',CX,30,{s:15*Math.min(k,1.5),w:800,a:'center'});sim.vis.ps=sim.vis.ps||[];const ps=sim.vis.ps;
  for(let i=0;i<NSHEET;i++){const tg=i<s.open?1:0;ps[i]=ps[i]===undefined?tg:ps[i]+(tg-ps[i])*Math.min(1,(vdt||0)*4+(RM?1:0));}
  const X=i=>140+i*64,off=i=>ps[clamp(i,0,NSHEET-1)]*34,T=i=>168-off(i),Bt=i=>292+off(i);
  [[T,-1],[Bt,1]].forEach(([Y,sg],si)=>{ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(104,Y(0)+sg*8);for(let i=0;i<NSHEET;i++){ctx.lineTo(X(i)-22,Y(i)+sg*8);ctx.lineTo(X(i),Y(i));ctx.lineTo(X(i)+22,Y(i)+sg*8);}ctx.stroke();
    for(let i=0;i<NSHEET;i++){const vx=X(i)+22,vy=Y(i)+sg*8,rx=X(i)+33,ry=Y(i)+sg*38;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(vx,vy);ctx.lineTo(rx,ry-sg*11);ctx.stroke();
      ctx.fillStyle=PAL['card2'];ctx.beginPath();ctx.arc(rx,ry,11,0,6.29);ctx.fill();ctx.stroke();txt(ctx,'R',rx,ry+1,{s:12,w:700,a:'center',b:'middle',c:PAL['cv-soft']});}
    txt(ctx,'strand '+(si+1),6,Y(0)+5,{s:12*Math.min(k,1.4),w:700});});
  for(let i=0;i<NSHEET;i++){const co=i%2===0,top=T(i),bot=Bt(i),x=X(i);
    const tA=co?'C':'N',tB=co?'O':'H',bA=co?'N':'C',bB=co?'H':'O';
    const tipT=top+34,tipB=bot-34;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,tipT);ctx.stroke();ctx.beginPath();ctx.moveTo(x,bot);ctx.lineTo(x,tipB);ctx.stroke();
    if(ps[i]<0.3){ctx.save();ctx.globalAlpha=1-ps[i]*3;dash(ctx,[x,tipT+(tB==='O'?12:9)],[x,tipB-(bB==='O'?12:9)],1,2.2);ctx.restore();}
    ball(ctx,tA,x,top,k,13);ball(ctx,bA,x,bot,k,13);ball(ctx,tB,x,tipT,k,tB==='H'?10:12);ball(ctx,bB,x,tipB,k,bB==='H'?10:12);}
  txt(ctx,'dashed line = hydrogen bond',CX,432,{s:12*k,w:700,a:'center'});
  y=side(ctx,'Backbone hydrogen bonds',k)+6;y=wrap(ctx,'C=O on one strand to N–H on the other.',SPX+12,y,SPW-24,15*k,{s:12*k})+8;
  y=wrap(ctx,(NSHEET-s.open)+' of 6 hydrogen bonds hold.',SPX+12,y,SPW-24,15*k,{s:12*k,w:700})+8;
  wrap(ctx,'R groups (side chains) stick out above and below the sheet.',SPX+12,y,SPW-24,15*k,{s:12*k,c:PAL['cv-soft']});}

SIM._lb={EL,MOL,MOLS,EN,ENERGY,RATIO,bondList,molCounts,buildState,dnaHB,dnaSeq,leftPct,curIso,curEl,valence,fq,btype,oilShake,oilStep,NBP,NSHEET};
BioLab.register(SIM);
})();
