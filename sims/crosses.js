(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,fmtNum}=BioLab.h;

/* ---------------- genetics for each kind of cross ---------------- */
const SUP={R:'ᴿ',r:'ʳ',W:'ᵂ'};
const upFirst=(x,y)=>(x===x.toLowerCase()&&y!==y.toLowerCase())?y+x:x+y;
const xdisp=g=>g.replace(/X([Rr])/g,(m,a)=>'X'+SUP[a]);
const cdisp=g=>g.split('').map(a=>'C'+SUP[a]).join('');
const MODES={
  mono:{name:'Flower color',org:'plant',
    par:p=>[p.p1m,p.p2m],show:g=>g,
    gam:g=>[{l:g[0],a:g[0],p:.5},{l:g[1],a:g[1],p:.5}],
    comb:(a,b)=>({g:upFirst(a.a,b.a)}),
    phen:o=>o.g.includes('P')?'purple':'white',
    phenos:[{k:'purple',l:'Purple',s:'purple'},{k:'white',l:'White',s:'white'}]},
  di:{name:'Seed color and shape',org:'seed',
    par:p=>[p.p1d,p.p2d],show:g=>g,
    gam:g=>{const o=[];[g[0],g[1]].forEach(a=>[g[2],g[3]].forEach(b=>o.push({l:a+b,a:[a,b],p:.25})));return o;},
    comb:(a,b)=>({g:upFirst(a.a[0],b.a[0])+upFirst(a.a[1],b.a[1])}),
    phen:o=>(o.g.includes('Y')?'yellow':'green')+'-'+(o.g.includes('R')?'round':'wrinkled'),
    phenos:[{k:'yellow-round',l:'Yellow round',s:'yellow round'},{k:'yellow-wrinkled',l:'Yellow wrinkled',s:'yellow wrinkled'},{k:'green-round',l:'Green round',s:'green round'},{k:'green-wrinkled',l:'Green wrinkled',s:'green wrinkled'}]},
  incomplete:{name:'Snapdragon color',org:'plant',
    par:p=>[p.p1i,p.p2i],show:cdisp,
    gam:g=>[{l:'C'+SUP[g[0]],a:g[0],p:.5},{l:'C'+SUP[g[1]],a:g[1],p:.5}],
    comb:(a,b)=>({g:(a.a==='W'&&b.a==='R')?'RW':a.a+b.a}),
    phen:o=>o.g==='RR'?'red':o.g==='WW'?'white':'pink',
    phenos:[{k:'red',l:'Red',s:'red'},{k:'pink',l:'Pink',s:'pink'},{k:'white',l:'White',s:'white'}]},
  xlinked:{name:'Fruit fly eye color',org:'fly',
    par:p=>[p.mom,p.dad],show:xdisp,
    gam:(g,i)=>i===0?[{l:'X'+SUP[g[1]],a:g[1],p:.5},{l:'X'+SUP[g[3]],a:g[3],p:.5}]:[{l:'X'+SUP[g[1]],a:g[1],p:.5},{l:'Y',a:'Y',p:.5}],
    comb:(a,b)=>b.a==='Y'?{g:'X'+a.a+'Y',sex:'M'}:{g:'X'+((a.a==='r'&&b.a==='R')?'RX'+'r':a.a+'X'+b.a),sex:'F'},
    phen:o=>(o.g.includes('XR')?'red':'white')+'-'+o.sex,
    phenos:[{k:'red-F',l:'Red-eyed ♀',s:'red-eyed ♀'},{k:'white-F',l:'White-eyed ♀',s:'white-eyed ♀'},{k:'red-M',l:'Red-eyed ♂',s:'red-eyed ♂'},{k:'white-M',l:'White-eyed ♂',s:'white-eyed ♂'}]},
  linked:{name:'Linked genes (fruit fly)',org:'fly',
    par:()=>['BV/bv','bv/bv'],show:g=>g,
    gam:(g,i,p)=>{if(i===1)return [{l:'bv',p:1}];const r=p.rf/100;return [{l:'BV',p:(1-r)/2},{l:'bv',p:(1-r)/2},{l:'Bv',p:r/2},{l:'bV',p:r/2}];},
    comb:(a,b)=>({g:a.l+'/'+b.l}),
    phen:o=>(o.g[0]==='B'?'gray':'black')+'-'+(o.g[1]==='V'?'normal':'vestigial'),
    phenos:[{k:'gray-normal',l:'Gray, normal wings',s:'gray normal'},{k:'black-vestigial',l:'Black, vestigial',s:'black vestigial'},{k:'gray-vestigial',l:'Gray, vestigial',s:'gray vestigial'},{k:'black-normal',l:'Black, normal wings',s:'black normal'}]}
};
const MODE_CTL={mono:['p1m','p2m'],di:['p1d','p2d'],incomplete:['p1i','p2i'],xlinked:['mom','dad'],linked:['rf']};
const CRIT={1:3.84,2:5.99,3:7.81};
const COL={purple:'#8a3fb8',white:'#fbfbfb',red:'#d3262e',pink:'#f08cb3',yellow:'#e9c430',green:'#79b03a'};

const mode=sim=>MODES[sim.p.mode];
const gametes=sim=>{const m=mode(sim),gs=m.par(sim.p);return [m.gam(gs[0],0,sim.p),m.gam(gs[1],1,sim.p)];};
function expected(sim){const m=mode(sim),[g1,g2]=gametes(sim),pr={};m.phenos.forEach(f=>pr[f.k]=0);
  g1.forEach(a=>g2.forEach(b=>{const o=m.comb(a,b);pr[m.phen(o)]+=a.p*b.p;}));return pr;}
function pick(list){let r=Math.random(),i=0;for(;i<list.length-1;i++){if(r<list[i].p)break;r-=list[i].p;}return i;}
function makeOne(sim){const m=mode(sim),[g1,g2]=gametes(sim),ri=pick(g1),ci=pick(g2),o=m.comb(g1[ri],g2[ci]);
  o.k=m.phen(o);o.ri=ri;o.ci=ci;if(!o.sex)o.sex=Math.random()<.5?'M':'F';return o;}
function addOff(sim,o){const s=sim.st;o.born=s.clock;s.off.push(o);s.counts[o.k]=(s.counts[o.k]||0)+1;s.n++;s.last=o;if(s.off.length>400)s.off.splice(0,s.off.length-400);}
function breed(sim,n){const s=sim.st;if(!s.queue.length)s.nextT=s.clock;for(let i=0;i<n;i++)s.queue.push(makeOne(sim));s.interval=Math.min(0.16,2.6/s.queue.length);}
function breedNow(sim,n){for(let i=0;i<n;i++)addOff(sim,makeOne(sim));}
function clearOff(sim){if(!sim.st)return;Object.assign(sim.st,{queue:[],off:[],counts:{},n:0,last:null,reveal:false});}
function syncCtl(sim){if(!sim.ui||!sim.ui.sec)return;const m=sim.p.mode;
  Object.keys(MODE_CTL).forEach(k=>MODE_CTL[k].forEach(id=>{const e=sim.ui.sec.querySelector('#crosses-'+id);if(!e)return;const c=CROSS.controls.find(c=>c.id===id);e.closest('.ctl').hidden=!(k===m&&atLeast(c.lvl));}));}
function gcd(a,b){return b?gcd(b,a%b):a;}
function ratioText(sim){const m=mode(sim),pr=expected(sim),fs=m.phenos.filter(f=>pr[f.k]>1e-9);
  if(fs.length===1)return 'All '+fs[0].s;
  if(sim.p.mode==='linked')return fs.map(f=>(pr[f.k]*100).toFixed(1).replace('.0','')+'% '+f.s).join(' : ');
  const v=fs.map(f=>Math.round(pr[f.k]*16));const g=v.reduce(gcd);return fs.map((f,i)=>v[i]/g+' '+f.s).join(' : ');}
function obsText(sim){const m=mode(sim),s=sim.st,pr=expected(sim);if(!s.n)return 'None yet';
  return m.phenos.filter(f=>pr[f.k]>1e-9||s.counts[f.k]).map(f=>(s.counts[f.k]||0)+' '+f.s).join(' : ');}
function chi(sim){const m=mode(sim),s=sim.st,pr=expected(sim);if(!s.n)return {x:NaN,df:0};let x=0,df=-1,small=false;
  m.phenos.forEach(f=>{const E=s.n*pr[f.k];if(E>1e-9){const O=s.counts[f.k]||0;x+=(O-E)*(O-E)/E;df++;if(E<5)small=true;}});return {x,df,small};}
function crossText(sim){const m=mode(sim),[a,b]=m.par(sim.p);return m.show(a)+' × '+m.show(b)+(sim.p.mode==='linked'?' ('+sim.p.rf+' map units)':'');}

/* ---------------- Challenge game: "Breed the target" ----------------
   Each round names a target (a ratio, a genotype mix, real counts, or a recombination %) and the student sets the parents
   (or the map distance). Breeding is random, so a round is judged on the expected Punnett-square result, never on the sample.
   Every target is built from a real cross the student can set, so every round is solvable. */
const gHide=sim=>!!(sim.gameRound&&sim.st&&!sim.st.reveal);
const optsOf=id=>CROSS.controls.find(c=>c.id===id).options.map(o=>o.v);
const distP=p=>expected({p});
function genoP(p){const m=MODES[p.mode],[g1,g2]=gametes({p}),pr={};g1.forEach(a=>g2.forEach(b=>{const k=m.comb(a,b).g;pr[k]=(pr[k]||0)+a.p*b.p;}));return pr;}
const same=(a,b)=>Object.keys(Object.assign({},a,b)).every(k=>Math.abs((a[k]||0)-(b[k]||0))<1e-6);
const pct=v=>parseFloat((v*100).toFixed(2))+'%';
const gPick=a=>a[Math.floor(Math.random()*a.length)],gInt=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const andList=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
function ratioOf(md,pr){const fs=MODES[md].phenos.filter(f=>pr[f.k]>1e-9);if(fs.length===1)return 'all '+fs[0].s;
  const v=fs.map(f=>Math.round(pr[f.k]*16)),g=v.reduce(gcd);return fs.map((f,i)=>v[i]/g+' '+f.s).join(' : ');}
const expPhrase=(md,pr)=>{const r=ratioOf(md,pr);return r.startsWith('all ')?r+' offspring':'an expected '+r;};
function genoText(pr){const ks=['PP','Pp','pp'].filter(k=>pr[k]>1e-9);if(ks.length===1)return 'all '+ks[0];const v=ks.map(k=>Math.round(pr[k]*4)),g=v.reduce(gcd);return ks.map((k,i)=>v[i]/g+' '+k).join(' : ');}
function gBase(r){const p={};CROSS.controls.forEach(c=>p[c.id]=c.def);return Object.assign(p,{mode:r.mode},r.fixed||{});}
function gCombos(r){let out=[gBase(r)];r.controls.forEach(id=>{const n=[];out.forEach(p=>optsOf(id).forEach(v=>{const q=Object.assign({},p);q[id]=v;n.push(q);}));out=n;});return out;}
function gPass(r,p){return r.mode==='linked'?p.rf===r.rf:r.gwant?same(genoP(p),r.gwant):same(distP(p),r.want);}
function gSample(pr,n){const ks=Object.keys(pr).filter(k=>pr[k]>1e-9),c={};ks.forEach(k=>c[k]=0);
  for(let i=0;i<n;i++){let u=Math.random(),j=0;for(;j<ks.length-1;j++){if(u<pr[ks[j]])break;u-=pr[ks[j]];}c[ks[j]]++;}return c;}
function logL(c,pr){let s=0;for(const k in c){if(!c[k])continue;if(!(pr[k]>1e-12))return -Infinity;s+=c[k]*Math.log(pr[k]);}return s;}
/* Counts are drawn from the hidden cross and kept only if that cross explains them clearly better (likelihood ratio above e³ ≈ 20)
   than every other cross the student could set, so a correct reading of the counts always points to one expected ratio. */
function gCounts(r,n){const alts=[];gCombos(r).forEach(p=>{const d=distP(p);if(!same(d,r.want)&&!alts.some(a=>same(a,d)))alts.push(d);});
  const ok=c=>{const L=logL(c,r.want);return alts.every(a=>logL(c,a)<L-3);};
  for(let t=0;t<400;t++){const c=gSample(r.want,n);if(ok(c))return c;}
  const c={};MODES[r.mode].phenos.forEach(f=>c[f.k]=Math.round((r.want[f.k]||0)*n));return c;}
const countText=(md,c,bold)=>andList(MODES[md].phenos.map(f=>(bold?'<b>'+(c[f.k]||0)+'</b>':(c[f.k]||0))+' '+f.s));
const gHint=t=>BioLab.level==='bio'?` <span class="gm-hint">Hint: ${t}</span>`:'';
/* finish a round: the target from its answer cross, a starting setting that does not already pass, and a note when several crosses work */
function gMake(r){const b=gBase(r);
  if(r.mode==='linked'){r.want=distP(Object.assign(b,{rf:r.rf}));let s=17;while(Math.abs(s-r.rf)<4)s=gInt(5,45);r.start={rf:s};return r;}
  const x=Object.assign(b,r.x);r.want=distP(x);if(r.geno)r.gwant=genoP(x);
  const all=gCombos(r),bad=all.filter(p=>!gPass(r,p)),good=all.filter(p=>gPass(r,p));
  const def=bad.find(p=>r.controls.every(id=>p[id]===gBase(r)[id]))||gPick(bad);r.start={};r.controls.forEach(id=>r.start[id]=def[id]);
  r.ways=new Set(good.map(p=>r.controls.map(id=>p[id]).sort().join('|'))).size;return r;}
const MONO_T=[{p1m:'pp',p2m:'pp'},{p1m:'Pp',p2m:'Pp'},{p1m:'Pp',p2m:'pp'}];
const monoAsk=pr=>pr.white>.999?'<b>only white flowers</b>':pr.purple>.999?'<b>no white flowers at all</b>':pr.purple>.6?'<b>3 purple plants for every 1 white</b>':'<b>half purple and half white</b>';
const MONO_TIP='A PP parent passes only P, a pp parent passes only p, and a Pp parent passes each to half its offspring.';
const GENO_T=[{x:{p1m:'PP',p2m:'pp'},t:'all grow purple, but <b>every one carries a hidden white allele</b> (all Pp)'},
  {x:{p1m:'PP',p2m:'PP'},t:'all grow purple and are <b>true-breeding</b>: none carries a hidden white allele (all PP)'},
  {x:{p1m:'PP',p2m:'Pp'},t:'all grow purple, with <b>half of them</b> carrying a hidden white allele (1 PP : 1 Pp)'}];
const INC_T=[{p1i:'RR',p2i:'WW'},{p1i:'RW',p2i:'RW'},{p1i:'RW',p2i:'WW'},{p1i:'RR',p2i:'RW'}];
const XL_T=[{x:{mom:'XRXr',dad:'XRY'},t:'every daughter red-eyed, but <b>half of the sons white-eyed</b>'},
  {x:{mom:'XrXr',dad:'XRY'},t:'<b>every daughter red-eyed</b> and <b>every son white-eyed</b>'},
  {x:{mom:'XRXr',dad:'XrY'},t:'<b>half of the daughters and half of the sons</b> white-eyed'},
  {x:{mom:'XrXr',dad:'XrY'},t:'<b>every fly white-eyed</b>, daughters and sons'}];
const DI_C=[{p1d:'YyRr',p2d:'YyRr'},{p1d:'YyRr',p2d:'yyrr'},{p1d:'YyRr',p2d:'Yyrr'},{p1d:'YyRr',p2d:'yyRr'},{p1d:'YyRR',p2d:'Yyrr'},{p1d:'YYRr',p2d:'yyRr'}];
const XL_TIP='Daughters get one X from each parent. Sons get their only X from their mother and a Y from their father.';
const DI_TIP='Treat each gene on its own, then multiply: 3 : 1 for color × 1 : 1 for shape gives 3 : 3 : 1 : 1.';
const LINK_CLS={'gray-vestigial':'gray with vestigial wings','black-normal':'black with normal wings'};
function rLinkCounts(n,rf){const R=rf*n/100,P=n-R,a=clamp(Math.round(R/2+(Math.random()-.5)*R*.24),0,R),b=clamp(Math.round(P/2+(Math.random()-.5)*P*.08),0,P);
  return {'gray-normal':b,'black-vestigial':P-b,'gray-vestigial':a,'black-normal':R-a};}
const R_XL_COUNTS=i=>{const t=gPick(XL_T),n=4*gInt(30,50),r=gMake({mode:'xlinked',controls:['mom','dad'],x:t.x,tip:XL_TIP});r.counts=gCounts(r,n);r.n=n;r.what='flies';
  r.prompt=`<b>Round ${i+1}: Whose flies?</b> A vial of ${n} fruit flies from one cross holds ${countText('xlinked',r.counts,true)}. Set the mother and father that most likely produced them.`;return r;};
const R_DI_COUNTS=i=>{const n=16*gInt(10,15),r=gMake({mode:'di',controls:['p1d','p2d'],x:gPick(DI_C),tip:DI_TIP});r.counts=gCounts(r,n);r.n=n;r.what='seeds';
  r.prompt=`<b>Round ${i+1}: Whose seeds?</b> A seed bank sorted ${n} pea seeds from one cross: ${countText('di',r.counts,true)}. Set the two parents that most likely made them.`;return r;};
const R_DI_TARGET=(i,list,title)=>{const r=gMake({mode:'di',controls:['p1d','p2d'],x:gPick(list),tip:DI_TIP});
  r.prompt=`<b>Round ${i+1}: ${title}</b> A seed bank wants pea seeds in the ratio <b>${ratioOf('di',r.want)}</b>. Choose the two parents.`;return r;};
const GAME_ROUNDS={
  bio:[
    (sim,i)=>{const k=gInt(0,2);sim.gm.first=k;const r=gMake({mode:'mono',controls:['p1m','p2m'],x:MONO_T[k],tip:MONO_TIP});
      r.prompt=`<b>Round 1: Seed order.</b> A garden shop wants a packet of pea seeds that grows ${monoAsk(r.want)}. Choose the two parent plants.`+gHint('purple (P) is dominant, so a white plant must be pp. A Pp parent passes P to half its offspring and p to the other half.');return r;},
    (sim,i)=>{const k=gPick([0,1,2].filter(j=>j!==sim.gm.first)),r=gMake({mode:'mono',controls:['p1m','p2m'],x:MONO_T[k],tip:MONO_TIP});
      r.prompt=`<b>Round 2: A school garden.</b> The biology club wants seeds that grow ${monoAsk(r.want)}. Choose the two parent plants.`+gHint('draw the 2 × 2 Punnett square on paper and count the pp boxes.');return r;},
    (sim,i)=>{const f=gPick(['Pp','pp']),r=gMake({mode:'mono',controls:['p2m'],fixed:{p1m:f},x:{p2m:gPick(['PP','Pp','pp'])},tip:MONO_TIP});
      r.prompt=`<b>Round 3: One parent is set.</b> Parent 1 is your only ${f==='pp'?'white':'purple'} plant, <b>${f}</b>. Choose Parent 2 so the seeds grow ${monoAsk(r.want)}.`+gHint('Parent 1 is fixed, so list the gametes it makes first.');return r;},
    (sim,i)=>{const t=gPick(GENO_T),r=gMake({mode:'mono',controls:['p1m','p2m'],x:t.x,geno:true,tip:'This round checks genotypes, not just colors. '+MONO_TIP});
      r.prompt=`<b>Round 4: Hidden alleles.</b> A breeder wants seeds that ${t.t}. Choose the two parents.`+gHint('purple plants can be PP or Pp. Think about which allele each parent can pass on.');return r;},
    (sim,i)=>{const n=4*gInt(15,30),r=gMake({mode:'mono',controls:['p1m','p2m'],x:gPick(MONO_T.slice(1)),tip:'Turn the counts into a ratio first. About 3 : 1 needs two carriers; about 1 : 1 is a testcross with a white plant.'});
      r.counts=gCounts(r,n);r.n=n;r.what='seeds';
      r.prompt=`<b>Round 5: Whose seeds?</b> A gardener planted ${n} seeds from one cross and counted ${countText('mono',r.counts,true)} plants. Set the two parents that most likely made them.`+gHint('divide to find the ratio, then ask which Punnett square gives about that.');return r;},
    (sim,i)=>{const n=gInt(16,24),r=gMake({mode:'mono',controls:['p1m'],fixed:{p2m:'pp'},x:{p1m:gPick(['PP','Pp'])},tip:'A white offspring needs a p from both parents. Even one white seedling proves the purple parent carries p.'});
      r.counts=gCounts(r,n);r.n=n;r.what='seeds';
      r.prompt=`<b>Round 6: The mystery plant.</b> You cross a purple plant of unknown genotype with a white plant (pp). Of ${n} seeds, ${countText('mono',r.counts,true)} plants grow. Set Parent 1 to the purple plant’s genotype.`+gHint('a white offspring needs a p from both parents.');return r;}],
  honors:[
    (sim,i)=>{const r=gMake({mode:'incomplete',controls:['p1i','p2i'],x:gPick(INC_T),tip:'Each Cᴿ allele adds red pigment: CᴿCᴿ is red, CᴿCᵂ is pink and CᵂCᵂ is white.'});
      r.prompt=`<b>Round 1: Snapdragon order.</b> A florist wants snapdragons that bloom <b>${ratioOf('incomplete',r.want)}</b>. Choose the two parents.`;return r;},
    (sim,i)=>{const t=gPick(XL_T),r=gMake({mode:'xlinked',controls:['mom','dad'],x:t.x,tip:XL_TIP});
      r.prompt=`<b>Round 2: Fly vial.</b> A genetics lab needs fruit flies with ${t.t}. Choose the mother and the father.`;return r;},
    (sim,i)=>R_DI_TARGET(i,[{p1d:'YyRr',p2d:'yyrr'},{p1d:'YyRR',p2d:'YyRR'},{p1d:'YYRr',p2d:'yyRr'}],'Two genes.'),
    (sim,i)=>R_DI_TARGET(i,[{p1d:'YyRr',p2d:'YyRr'},{p1d:'YyRr',p2d:'Yyrr'}],'Four kinds of seed.'),
    (sim,i)=>R_XL_COUNTS(i),
    (sim,i)=>R_DI_COUNTS(i)],
  ap:[
    (sim,i)=>R_DI_TARGET(i,[{p1d:'YyRr',p2d:'YyRr'},{p1d:'YyRr',p2d:'Yyrr'},{p1d:'Yyrr',p2d:'yyRr'}],'Two genes.'),
    (sim,i)=>R_XL_COUNTS(i),
    (sim,i)=>R_DI_COUNTS(i),
    (sim,i)=>{const X=gInt(2,24),cls=gPick(Object.keys(LINK_CLS)),r=gMake({mode:'linked',controls:['rf'],rf:2*X,kind:'class',cls,X});
      r.prompt=`<b>Round 4: Set the distance.</b> In a testcross (BV/bv × bv/bv), you want <b>${X}%</b> of the offspring to be <b>${LINK_CLS[cls]}</b>. How far apart must the two genes be?`;return r;},
    (sim,i)=>{const n=gPick([200,400,500,1000]),rf=gInt(4,46),r=gMake({mode:'linked',controls:['rf'],rf,kind:'counts',n});r.counts=rLinkCounts(n,rf);
      r.prompt=`<b>Round 5: Map the genes.</b> A testcross (BV/bv × bv/bv) gave ${countText('linked',r.counts,true)} flies. Set the distance between the genes.`;return r;},
    (sim,i)=>{const n=gPick([300,400,500,600,800]),rf=gInt(4,46),r=gMake({mode:'linked',controls:['rf'],rf,kind:'parents',n});r.parental=n-rf*n/100;
      r.prompt=`<b>Round 6: Parents only.</b> Of ${n} testcross offspring, <b>${r.parental}</b> look like one of the parents (gray with normal wings, or black with vestigial wings). The rest are recombinant. Set the distance between the genes.`;return r;}]
};
function gJudge(sim,r){const p=sim.p,got=distP(p),cr=crossText(sim),note=` Your ${sim.st.n} offspring came out ${obsText(sim)}. Breeding is random, so the score checks the ${r.mode==='linked'?'expected percentage':'parents’ expected ratio'}, not this one sample.`,
    small=' (Scored on the expected result, not the random sample.)';
  if(r.mode==='linked'){const ok=p.rf===r.rf;
    if(r.kind==='class'){const g=got[r.cls];return ok?{ok,msg:`Right: at ${p.rf} map units, ${p.rf}% of offspring are recombinant, and half of them, ${r.X}%, are ${LINK_CLS[r.cls]}.`+note}
      :{ok,msg:`At ${p.rf} map units, ${pct(g)} of offspring are ${LINK_CLS[r.cls]}. You need ${r.X}%, so ${p.rf<r.rf?'move the genes farther apart':'move them closer together'}. Each recombinant class is half of all recombinants.`+small};}
    const R=r.rf*r.n/100;if(ok)return {ok,msg:`Right: ${R} of ${r.n} offspring are recombinant, and ${R} ÷ ${r.n} = ${r.rf}%, so the genes are ${r.rf} map units apart.`+note};
    return {ok,msg:`At ${p.rf} map units you would expect about ${Math.round(r.n*p.rf/100)} recombinants out of ${r.n}: ${p.rf<r.rf?'fewer':'more'} than these counts show, so move the genes ${p.rf<r.rf?'farther apart':'closer together'}. ${r.kind==='parents'?'Recombinants = total − parental types. ':'Add the two recombinant classes (gray vestigial and black normal). '}Map distance = recombinants ÷ total × 100.`+small};}
  const md=r.mode,ok=gPass(r,p);let head=`${cr} gives ${expPhrase(md,got)}`;if(r.gwant)head+=` (${genoText(genoP(p))})`;
  if(ok)return {ok,msg:`Bred! ${head}${r.counts?`, which fits the ${r.n} ${r.what} counted`:', which matches the order'}.`+note};
  let why;
  if(r.counts){const N=r.n;why=`With these parents, ${N} offspring would be about ${andList(MODES[md].phenos.filter(f=>got[f.k]>1e-9).map(f=>Math.round(N*got[f.k])+' '+f.s))}. The counts were ${countText(md,r.counts)}.`;}
  else if(r.gwant)why=`You need ${genoText(r.gwant)}.`;
  else{const f=MODES[md].phenos.slice().sort((a,b)=>((r.want[b.k]||0)-(got[b.k]||0))-((r.want[a.k]||0)-(got[a.k]||0)))[0];
    why=`You need more ${f.s} offspring: this cross gives ${pct(got[f.k]||0)}, and the order needs ${pct(r.want[f.k]||0)}.`;}
  return {ok,msg:`${head}. ${why} ${r.tip}`+small};}

/* ---------------- sprites ---------------- */
function plant(ctx,x,y,s,col){ctx.strokeStyle=PAL['cv-leaf'];ctx.lineWidth=2.2*s;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y+16*s);ctx.quadraticCurveTo(x-2*s,y+4*s,x,y-6*s);ctx.stroke();
  ctx.fillStyle=PAL['cv-leaf2'];[[-1,8],[1,3]].forEach(([d,yy])=>{ctx.save();ctx.translate(x+d*5*s,y+yy*s);ctx.rotate(d*0.7);ctx.beginPath();ctx.ellipse(0,0,6*s,2.6*s,0,0,6.29);ctx.fill();ctx.restore();});
  const c=COL[col],edge=col==='white'?'#9a9a9a':'rgba(0,0,0,.28)';
  for(let i=0;i<5;i++){const a=i/5*6.283-1.57;ctx.beginPath();ctx.arc(x+Math.cos(a)*4.4*s,y-10*s+Math.sin(a)*4.4*s,3.7*s,0,6.29);ctx.fillStyle=c;ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=Math.max(.8,.6*s);ctx.stroke();}
  ctx.fillStyle='#f3c623';ctx.beginPath();ctx.arc(x,y-10*s,2.2*s,0,6.29);ctx.fill();}
function seed(ctx,x,y,r,col,round){ctx.fillStyle=COL[col];ctx.strokeStyle=col==='yellow'?'#8a7420':'#3f6a1b';ctx.lineWidth=Math.max(1,r*.12);ctx.beginPath();
  if(round)ctx.arc(x,y,r,0,6.29);else{for(let i=0;i<=40;i++){const a=i/40*6.283,rad=r*(0.84+0.13*Math.sin(a*7+1.3));i?ctx.lineTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad):ctx.moveTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad);}ctx.closePath();}
  ctx.fill();ctx.stroke();
  if(round){ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.ellipse(x-r*.32,y-r*.35,r*.28,r*.18,-.6,0,6.29);ctx.fill();}
  else{ctx.beginPath();ctx.moveTo(x-r*.4,y-r*.2);ctx.quadraticCurveTo(x,y+r*.1,x+r*.35,y-r*.35);ctx.moveTo(x-r*.2,y+r*.4);ctx.quadraticCurveTo(x+r*.1,y+r*.1,x+r*.4,y+r*.3);ctx.stroke();}}
function fly(ctx,x,y,s,o){const body=o.body==='black'?'#2e2a28':'#b8925a',dark=o.body==='black'?'#151313':'#6b5230';
  ctx.fillStyle='rgba(215,232,245,.6)';ctx.strokeStyle='#7f98a8';ctx.lineWidth=Math.max(.7,.5*s);
  [-1,1].forEach(d=>{ctx.save();ctx.translate(x+d*3*s,y-1*s);ctx.rotate(d*0.38);ctx.beginPath();if(o.wings==='vestigial'){ctx.ellipse(d*1.5*s,4*s,2.6*s,4*s,0,0,6.29);}else ctx.ellipse(d*2*s,9*s,4.6*s,12*s,0,0,6.29);ctx.fill();ctx.stroke();ctx.restore();});
  ctx.fillStyle=body;ctx.beginPath();if(o.male)ctx.ellipse(x,y+8*s,5.2*s,6.6*s,0,0,6.29);else ctx.ellipse(x,y+9.5*s,5.8*s,8.4*s,0,0,6.29);ctx.fill();
  ctx.strokeStyle=dark;ctx.lineWidth=1.3*s;for(let i=0;i<3;i++){const yy=y+(o.male?5:6)*s+i*2.8*s;ctx.beginPath();ctx.moveTo(x-4.6*s,yy);ctx.lineTo(x+4.6*s,yy);ctx.stroke();}
  if(o.male){ctx.fillStyle=dark;ctx.beginPath();ctx.ellipse(x,y+12.6*s,3.4*s,2.2*s,0,0,6.29);ctx.fill();}
  ctx.fillStyle=body;ctx.beginPath();ctx.ellipse(x,y-2*s,4.6*s,5*s,0,0,6.29);ctx.fill();
  ctx.beginPath();ctx.arc(x,y-8.5*s,3.6*s,0,6.29);ctx.fill();
  ctx.fillStyle=o.eye==='white'?'#f6f6f6':'#c8161d';ctx.strokeStyle='#555';ctx.lineWidth=Math.max(.6,.4*s);
  [-1,1].forEach(d=>{ctx.beginPath();ctx.ellipse(x+d*3*s,y-9*s,2.2*s,2.7*s,0,0,6.29);ctx.fill();ctx.stroke();});}
function sprite(ctx,modeId,k,x,y,sc,sex){
  if(modeId==='mono'||modeId==='incomplete')plant(ctx,x,y,sc,k);
  else if(modeId==='di'){const [c,sh]=k.split('-');seed(ctx,x,y,10*sc,c,sh==='round');}
  else if(modeId==='xlinked'){const [e,sx]=k.split('-');fly(ctx,x,y-2*sc,sc,{eye:e,male:sx==='M'});}
  else{const [b,w]=k.split('-');fly(ctx,x,y-2*sc,sc,{eye:'red',body:b,wings:w,male:sex==='M'});}}
const parentPhen=(sim,i)=>{const m=mode(sim),g=m.par(sim.p)[i],gm=m.gam(g,i,sim.p);
  if(sim.p.mode==='xlinked')return (g.includes('XR')?'red':'white')+'-'+(i===0?'F':'M');
  if(sim.p.mode==='linked')return i===0?'gray-normal':'black-vestigial';
  if(sim.p.mode==='di')return (g.includes('Y')?'yellow':'green')+'-'+(g.includes('R')?'round':'wrinkled');
  return m.phen({g:sim.p.mode==='incomplete'?g:g});};
const PUN={x:24,y:150,w:312,h:288,hw:46,hh:34};

/* ---------------- Virtual lab benches (Virtual lab mode; contract in VLAB.md) ----------------
   fastplants: F2 Wisconsin Fast Plants from F1 dihybrids (AaLl × AaLl), grown in a 72-cell flat under lights and scored on day 4 or 5.
   mm-chisquare: a bag of milk chocolate candy-coated chocolates poured on a plate, sorted by color and tested against the company's
   percentages, then eight other groups' bags pooled from a class board.
   All variation comes from the lab's saved seed, so a reload never changes what the student already recorded. */
function xh(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
const vlId=sim=>sim&&sim.vlab&&sim.vlab.lab?sim.vlab.lab.id:null;
const fpB=sim=>vlId(sim)==='fastplants'&&sim.st&&sim.st.B&&sim.st.B.kind==='fp'?sim.st.B:null;
const mmB=sim=>vlId(sim)==='mm-chisquare'&&sim.st&&sim.st.B&&sim.st.B.kind==='mm'?sim.st.B:null;
const vnum=s=>BioLab.vlab&&BioLab.vlab.num?BioLab.vlab.num(s):parseFloat(s);
const numsIn=s=>(String(s).replace(/−/g,'-').match(/\d+(?:[.,]\d+)?/g)||[]).map(x=>parseFloat(x.replace(',','.')));
const LCDF='700 VSIZEpx "Consolas","Menlo","DejaVu Sans Mono","Courier New",monospace';
function lcd(ctx,x,y,w,h,label,value,k,vsize){ctx.fillStyle='#2b2f36';rr(ctx,x,y,w,h,12);ctx.fill();txt(ctx,label,x+14,y+20,{s:Math.min(12*k,15),w:700,c:'#d7dbe0'});
  const sy=y+30,sh=h-42;ctx.fillStyle='#cfe3c8';rr(ctx,x+12,sy,w-24,sh,6);ctx.fill();ctx.fillStyle='#1b2a1b';ctx.font=LCDF.replace('VSIZE',String(vsize||44));ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(value,x+w-24,sy+sh/2+2);}
function mixHex(a,b,t){const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16),c=s=>Math.round(((pa>>s)&255)*(1-t)+((pb>>s)&255)*t);return 'rgb('+c(16)+','+c(8)+','+c(0)+')';}
/* chi-square helpers shared by both labs: critical values at p = 0.05 from the handout's table */
const CRIT05={1:3.84,2:5.99,3:7.82,4:9.49,5:11.07};
const CRIT_ROWS=[[1,'0.016','0.46','1.32','2.71','3.84','6.64'],[2,'0.21','1.39','2.77','4.61','5.99','9.21'],[3,'0.58','2.37','4.11','6.25','7.82','11.35'],[4,'1.06','3.36','5.39','7.78','9.49','13.28'],[5,'1.61','4.35','6.63','9.24','11.07','15.09']];
const CRIT_TABLE='<div class="tbl-wrap"><table class="vl-table data"><thead><tr><th scope="col">df</th>'+['0.90','0.50','0.25','0.10','0.05','0.01'].map(p=>'<th scope="col">p = '+p+'</th>').join('')+'</tr></thead><tbody>'+
  CRIT_ROWS.map(r=>'<tr><th scope="row">'+r[0]+'</th>'+r.slice(1).map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
const decOf=v=>{const s=String(v).toLowerCase();if(/fail(ed|s)?\s+to\s+reject|not\s+reject|accept/.test(s))return 'acc';if(/reject/.test(s))return 'rej';return null;};
function decCheck(xk,ck){return (sim,v,V)=>{const d=decOf(v);if(!d)return 'Say whether you accept (fail to reject) or reject the null hypothesis.';
  const x=vnum(V.raw(xk)),c=vnum(V.raw(ck));if(!Number.isFinite(x)||!Number.isFinite(c))return null;
  return (x<c)===(d==='acc')?null:'Compare your χ² with your critical value. A χ² smaller than the critical value means you accept (fail to reject) the null hypothesis; a larger one means you reject it.';};}
function dfCheck(cats){return (sim,v)=>v===cats-1?null:'Degrees of freedom = the number of categories − 1.';}
function cvCheck(dfk){return (sim,v,V)=>{const df=vnum(V.raw(dfk));if(!Number.isFinite(df))return 'Type your degrees of freedom first.';const c=CRIT05[df];
  if(c===undefined||Math.abs(v-c)>0.006)return 'Use the critical values table in the Background: the p = 0.05 column, in the row for your degrees of freedom.';return null;};}

/* --- Fast Plants: an F2 flat from F1 dihybrids --- */
const FP={rows:6,cols:12,germ:0.93,score:4,last:5};
const FPK=[{k:'pg',l:'Purple, green',p:true,g:true},{k:'ng',l:'Non-purple, green',p:false,g:true},{k:'py',l:'Purple, yellow',p:true,g:false},{k:'ny',l:'Non-purple, yellow',p:false,g:false}];
/* Each cell gets one F2 seed. Both F1 parents are AaLl: each gamete carries A or a, and L or l, with probability ½ each,
   and the two genes assort independently. About 93% of seeds germinate; every germinated seedling is up by day 3. */
function fpPlants(seed){const out=[];for(let i=0;i<FP.rows*FP.cols;i++){const u=j=>xh(seed,3000+i,j),A=(u(1)<.5?1:0)+(u(2)<.5?1:0),L=(u(3)<.5?1:0)+(u(4)<.5?1:0);
  out.push({germ:u(0)<FP.germ,A,L,purple:A>0,green:L>0,em:1.6+1.2*u(5),vig:(0.85+0.3*u(6))*(L>0?1:0.9),int:0.82+0.18*u(7),lean:(u(8)-.5)*0.6,cot:0.85+0.3*u(9),rot:u(10)-.5});}
  return out;}
function fpInit(sim){const b=sim.vlab.bench;['fill','plant','light'].forEach(k=>{b[k]=!!b[k];});if(!Number.isFinite(b.day))b.day=0;
  if(!Array.isArray(b.ticks))b.ticks=[];b.ticks=b.ticks.filter((x,i,a)=>Number.isInteger(x)&&x>=0&&x<72&&a.indexOf(x)===i);return {kind:'fp',plants:fpPlants(sim.vlab.seed)};}
function fpCounts(sim){const B=fpB(sim),c={pur:0,non:0,grn:0,yel:0,pg:0,ng:0,py:0,ny:0,tot:0};if(!B||!sim.vlab.bench.plant)return c;
  B.plants.forEach(p=>{if(!p.germ)return;c.tot++;c[p.purple?'pur':'non']++;c[p.green?'grn':'yel']++;c[(p.purple?'p':'n')+(p.green?'g':'y')]++;});return c;}
function fpReady(sim){const b=sim.vlab.bench;if(!fpB(sim))return null;if(!b.plant||!b.light)return 'Plant the F2 seeds and grow them under the lights on the bench first.';
  if(b.day<FP.score)return 'Score the seedlings on day 4 or 5, once the stem and leaf colors show clearly. The flat is on day '+b.day+'.';return null;}
const FP_WHAT={Purple:['pur','seedlings with purple stems'],'Non-purple':['non','seedlings with non-purple stems'],Green:['grn','seedlings with green leaves'],'Yellow-green':['yel','seedlings with yellow-green leaves'],Total:['tot','seedlings in the flat']};
function fpNCheck(sim,rv,v){const w=fpReady(sim);if(w)return w;let key,what;
  if(FP_WHAT[rv])[key,what]=FP_WHAT[rv];else{const f=FPK.find(x=>x.l===rv);if(!f)return null;key=f.k;what='seedlings with '+(f.p?'purple':'non-purple')+' stems and '+(f.g?'green':'yellow-green')+' leaves';}
  if(v<0||Math.round(v)!==v)return 'A count is a whole number of seedlings.';
  if(v===fpCounts(sim)[key])return null;
  return 'Count the '+what+' again. Your number does not match the flat.'+(rv==='Total'?' Some cells are empty, because not every seed germinates.':' Magnify one corner at a time, and tap each seedling as you count it.');}
const FP_ROWS={mono:['Purple','Non-purple','Total'],leaf:['Green','Yellow-green','Total'],di:FPK.map(f=>f.l)};
function fpPctCheck(tid){return (sim,rv,v)=>{const V=sim.vlab,rows=FP_ROWS[tid],i=rows.indexOf(rv);if(i<0)return null;const n=V.col(tid,'n');
  if(rv==='Total'){const ps=V.col(tid,'pct').slice(0,-1);if(!ps.every(Number.isFinite))return null;const s=ps.reduce((a,b)=>a+b,0);return Math.abs(v-s)<=0.6?null:'The total percentage is the sum of the percentages above it.';}
  if(!Number.isFinite(n[i]))return 'Type this row’s number of seedlings first.';
  const tots=tid==='di'?[V.val('mono','n',2),V.val('leaf','n',2),n.every(Number.isFinite)?n.reduce((a,b)=>a+b,0):NaN]:[n[n.length-1]];const ok=tots.filter(t=>t>0);
  if(!ok.length)return tid==='di'?'Type the total number of seedlings in the stem color table first.':'Type the total number of seedlings in the Total row first.';
  return ok.some(t=>Math.abs(v-100*n[i]/t)<=0.55)?null:'Check this percentage: divide this row’s number by the total number of seedlings, then multiply by 100.';};}
function ratioCheck(get){return (sim,v,V)=>{const want=get(V);if(!want)return 'Fill in the numbers in your table first.';const r=numsIn(v);
  if(r.length!==want.length)return 'Write the ratio as '+want.length+' numbers separated by colons, like '+(want.length===2?'2.5 : 1':'7 : 2 : 2 : 1')+'.';
  const sr=r.reduce((a,b)=>a+b,0),sw=want.reduce((a,b)=>a+b,0);if(!(sr>0&&sw>0))return null;
  return r.some((x,i)=>Math.abs(x/sr-want[i]/sw)>0.045)?'This ratio does not match your counts. Divide each count by the smallest count, then round.':null;};}
const fpPair=(V,t)=>{const a=V.val(t,'n',0),b=V.val(t,'n',1);return Number.isFinite(a)&&Number.isFinite(b)?[a,b]:null;};
const fpQuad=V=>{const n=V.col('di','n');return n.every(Number.isFinite)?n:null;};
function fpChi(V){const n=fpQuad(V);if(!n)return NaN;const N=n.reduce((a,b)=>a+b,0);if(!(N>0))return NaN;return n.reduce((s,o,i)=>{const E=N*[9,3,3,1][i]/16;return s+(o-E)*(o-E)/E;},0);}
function fpChiCheck(sim,v,V){const x=fpChi(V);if(!Number.isFinite(x))return 'Fill in all four rows of the dihybrid table first.';
  return Math.abs(v-x)<=Math.max(0.05,0.03*x)?null:'Check your χ²: for each of the four classes, E is your total × that class’s expected fraction. Then add up (O − E)² ÷ E for the four classes.';}
/* drawing */
const FPG={x:44,y:74,w:45,h:53},FPZ={x:44,y:72,w:90,h:107},FPBG='#cfd8de';
function fpView(sim){const z=sim.p.fpZoom|0;if(z<1||z>4)return {z:0,r0:0,c0:0,nr:6,nc:12,g:FPG,s:1};return {z,r0:z>2?3:0,c0:z%2?0:6,nr:3,nc:6,g:FPZ,s:2};}
function fpCellXY(V,i){const r=Math.floor(i/12),c=i%12;if(r<V.r0||r>=V.r0+V.nr||c<V.c0||c>=V.c0+V.nc)return null;return [V.g.x+(c-V.c0)*V.g.w,V.g.y+(r-V.r0)*V.g.h];}
function seedling(ctx,x,ys,s,p,d){const age=d-p.em;if(!p.germ||age<0)return;
  const pur=p.purple?clamp((age-0.3)/0.9,0,1)*p.int:0,stem=mixHex('#9cc45c','#7a2783',pur);ctx.lineCap='round';
  if(age<0.6){const f=age/0.6,h=s*(2+9*f);ctx.strokeStyle=stem;ctx.lineWidth=2.6*s;ctx.beginPath();ctx.moveTo(x-2.5*s,ys);ctx.quadraticCurveTo(x-2*s,ys-h*1.2,x+1*s,ys-h);ctx.quadraticCurveTo(x+3*s,ys-h*0.9,x+3.5*s,ys-h*0.45);ctx.stroke();
    ctx.fillStyle=p.green?'#5c9a3a':'#b9c44e';ctx.beginPath();ctx.ellipse(x+3.6*s,ys-h*0.4,2.2*s,1.6*s,0.6,0,6.29);ctx.fill();return;}
  const g=clamp((age-0.6)/1.8,0,1),h=s*(9+13*g)*p.vig,tx=x+p.lean*h*0.35,ty=ys-h;
  ctx.strokeStyle=stem;ctx.lineWidth=(2.2+0.9*g)*s;ctx.beginPath();ctx.moveTo(x,ys);ctx.quadraticCurveTo(x,ys-h*0.5,tx,ty);ctx.stroke();
  const L=(4+6*g)*s*p.cot,W=(2.6+3.6*g)*s*p.cot,leaf=p.green?'#3d8f2c':'#c3cf4c',edge=p.green?'#276a1c':'#8e9a2a';
  [-1,1].forEach(side=>{ctx.save();ctx.translate(tx,ty);ctx.rotate(side*(0.3+p.rot*0.25));
    ctx.strokeStyle=stem;ctx.lineWidth=1.3*s;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(side*L*0.4,-L*0.12);ctx.stroke();
    const cx=side*(L*0.4+L*0.58),cy=-L*0.14;ctx.fillStyle=leaf;ctx.strokeStyle=edge;ctx.lineWidth=Math.max(0.6,0.7*s);
    ctx.beginPath();ctx.ellipse(cx,cy,L*0.62,W*0.62,0,0,6.29);ctx.fill();ctx.stroke();
    ctx.fillStyle=FPBG;ctx.beginPath();ctx.arc(cx+side*L*0.6,cy,W*0.16,0,6.29);ctx.fill();ctx.restore();});}
function fpCellBox(ctx,x,y,w,h,b,s){const sy=y+h*0.74;ctx.fillStyle='#303236';ctx.fillRect(x+2,sy-3*s,w-4,y+h-sy+2*s);
  if(b.fill){ctx.fillStyle='#55392a';ctx.fillRect(x+4,sy-1*s,w-8,y+h-sy-2*s);ctx.fillStyle='#6e4c36';ctx.fillRect(x+4,sy-1*s,w-8,2.2*s);
    if(b.plant){ctx.fillStyle='#3a271b';ctx.beginPath();ctx.arc(x+w/2,sy+1.6*s,1.6*s,0,6.29);ctx.fill();}}
  else{ctx.fillStyle='#1c1d20';ctx.fillRect(x+4,sy,w-8,y+h-sy-2*s);}return sy;}
const FP_SAMPLE=(purple,green)=>({germ:true,em:0,purple,green,int:1,vig:1,cot:1,lean:0,rot:0});
function drawFP(sim,ctx,vdt,k){const B=sim.st.B,b=sim.vlab.bench,v=sim.vis;
  if(v.fd===undefined||v.fd>b.day)v.fd=b.day;if(v.fd<b.day)v.fd=Math.min(b.day,v.fd+Math.max(0,vdt)/(RM?0.05:1.2));const d=v.fd,V=fpView(sim),G=V.g,fs=Math.min(12*k,19);
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  txt(ctx,'F2 Fast Plants · 72-cell growing flat',16,22,{s:Math.min(15*k,22),w:700});
  // light bank above the flat
  const LX=40,LW=548;ctx.fillStyle='#8f969c';rr(ctx,LX,30,LW,14,5);ctx.fill();
  for(let i=0;i<3;i++){ctx.fillStyle=b.light?'#fffbe6':'#c9ced2';rr(ctx,LX+10+i*(LW-20)/3,34,(LW-20)/3-8,6,3);ctx.fill();}
  if(b.light){const gr=ctx.createLinearGradient(0,44,0,140);gr.addColorStop(0,'rgba(255,240,170,.38)');gr.addColorStop(1,'rgba(255,240,170,0)');ctx.fillStyle=gr;ctx.fillRect(LX,44,LW,96);}
  // the flat
  ctx.fillStyle=FPBG;rr(ctx,G.x-26,G.y-4,G.w*V.nc+32,G.h*V.nr+26,10);ctx.fill();
  for(let r=0;r<V.nr;r++)for(let c=0;c<V.nc;c++){const i=(V.r0+r)*12+V.c0+c,x=G.x+c*G.w,y=G.y+r*G.h,sy=fpCellBox(ctx,x,y,G.w,G.h,b,V.s*0.8);
    if(b.plant)seedling(ctx,x+G.w/2,sy-1*V.s,V.s,B.plants[i],d);}
  // row letters and column numbers, as written on the flat's label
  for(let r=0;r<V.nr;r++)txt(ctx,'ABCDEF'[V.r0+r],G.x-14,G.y+r*G.h+G.h*0.62,{s:fs,w:700,c:'#3c4248',a:'center'});
  for(let c=0;c<V.nc;c++)txt(ctx,String(V.c0+c+1),G.x+c*G.w+G.w/2,G.y+V.nr*G.h+16,{s:fs,c:'#3c4248',a:'center'});
  // ticks the student made while counting
  b.ticks.forEach(i=>{const xy=fpCellXY(V,i),p=B.plants[i];if(!xy||!p.germ||d<p.em)return;const r=6*Math.min(V.s,1.6),cx=xy[0]+G.w-r-3,cy=xy[1]+r+3;
    ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(cx,cy,r,0,6.29);ctx.fill();ctx.strokeStyle=PAL['rj'];ctx.lineWidth=1.5;ctx.stroke();
    ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-r*.5,cy);ctx.lineTo(cx-r*.1,cy+r*.45);ctx.lineTo(cx+r*.55,cy-r*.45);ctx.stroke();});
  if(V.z)pill(ctx,'Magnified: rows '+'ABCDEF'[V.r0]+'–'+'ABCDEF'[V.r0+2]+', columns '+(V.c0+1)+'–'+(V.c0+6),316,62,PAL['rj'],'#fff',Math.min(12*k,17));
  else if(!b.fill)txt(ctx,'Empty flat on a wicking mat',316,240,{s:Math.min(15*k,22),c:'#3c4248',a:'center'});
  // day counter and the scoring key
  const shown=d<b.day-1e-6?Math.floor(d)+'…':String(b.day);
  lcd(ctx,600,30,190,98,'DAY COUNTER',b.plant?shown:'–',k,44);
  const X=600,Y=138,W=190,H=296;ctx.fillStyle=FPBG;rr(ctx,X,Y,W,H,12);ctx.fill();
  txt(ctx,'Scoring key',X+W/2,Y+22,{s:Math.min(13*k,17),w:700,a:'center',c:'#26262b'});
  const ls=Math.min(11*k,14);[[true,true],[false,true],[true,false],[false,false]].forEach(([pu,gr],j)=>{const cx=X+48+(j%2)*94,cy=Y+104+Math.floor(j/2)*134;
    ctx.fillStyle='#55392a';ctx.fillRect(cx-26,cy,52,8);seedling(ctx,cx,cy,1.9,FP_SAMPLE(pu,gr),4);
    txt(ctx,pu?'Purple stem':'Non-purple',cx,cy+24,{s:ls,w:600,a:'center',c:'#26262b'});txt(ctx,gr?'Green leaves':'Yellow-green',cx,cy+24+ls+3,{s:ls,a:'center',c:'#3c4248'});});}
function fpClick(sim,x,y){const B=fpB(sim),b=sim.vlab.bench;if(!B||!b.plant)return;const V=fpView(sim),G=V.g,c=Math.floor((x-G.x)/G.w),r=Math.floor((y-G.y)/G.h);
  if(c<0||c>=V.nc||r<0||r>=V.nr)return;const i=(V.r0+r)*12+V.c0+c,p=B.plants[i],d=sim.vis.fd!==undefined?sim.vis.fd:b.day;if(!p.germ||d<p.em)return;
  const j=b.ticks.indexOf(i);if(j>=0)b.ticks.splice(j,1);else b.ticks.push(i);}
function fpNarrate(sim){const b=sim.vlab.bench;
  if(!b.fill)return 'An empty 72-cell growing flat sits on a wicking mat over a water reservoir. Fill the cells with potting mix to start.';
  if(!b.plant)return 'The cells are full of moist potting mix, wet from below by the wicks. Plant one F2 seed in each cell.';
  if(!b.light)return 'Every cell holds one F2 seed. Put the flat under the light bank: Fast Plants grow under light 24 hours a day.';
  const t=['<b>Day 0.</b> The seeds are planted and the lights are on. Press <b>Advance one day</b> to move the flat forward 24 hours.',
    '<b>Day 1.</b> The seeds are taking up water and their first roots are growing, but nothing shows above the soil yet.',
    '<b>Day 2.</b> Seedlings are pushing up through the soil. Each stem comes up bent in a hook that protects the seed leaves.',
    '<b>Day 3.</b> The seed leaves (cotyledons) have opened, but the colors are still developing. Wait a day before you score.'];
  if(b.day<4)return t[b.day];
  return '<b>Day '+b.day+'.</b> The stem and leaf colors are clear. Score each seedling for stem color (purple or non-purple) and leaf color (green or yellow-green). Tap a seedling to tick it off as you count it.';}

/* --- Candy chi-square: one bag, then the class board --- */
const MMC=[{k:'brown',l:'Brown',p:13,c:'#6b3d22'},{k:'blue',l:'Blue',p:24,c:'#1f6fd1'},{k:'orange',l:'Orange',p:20,c:'#f07a18'},{k:'green',l:'Green',p:16,c:'#2e9d46'},{k:'red',l:'Red',p:13,c:'#d42a2a'},{k:'yellow',l:'Yellow',p:14,c:'#f3c21f'}];
const MMK=MMC.map(c=>c.l),MM_GROUPS=8;
/* A bag holds 52 to 60 candies, each one colored at random with the company's percentages: a multinomial draw. Bag 0 is the student's. */
function mmBag(seed,g){const n=52+Math.floor(9*xh(seed,8000+g,0)),col=[],cnt=[0,0,0,0,0,0];
  for(let i=0;i<n;i++){let u=xh(seed,8100+g,i+1),j=0;for(;j<5;j++){if(u<MMC[j].p/100)break;u-=MMC[j].p/100;}col.push(j);cnt[j]++;}return {n,col,cnt};}
const MMG={px:186,py:250,pr:156,mx:364,my:50,lh:59,sx:470};
function mmPlace(seed,n){const P=[];for(let i=0;i<n;i++){let best=null,bd=-1;
  for(let t=0;t<40;t++){const r=138*Math.sqrt(xh(seed,8800+i,2*t)),a=6.2832*xh(seed,8800+i,2*t+1),x=MMG.px+r*Math.cos(a),y=MMG.py+r*Math.sin(a);let dm=1e9;for(const q of P)dm=Math.min(dm,Math.hypot(q[0]-x,q[1]-y));
    if(dm>=21){best=[x,y];break;}if(dm>bd){bd=dm;best=[x,y];}}P.push(best);}return P;}
function mmInit(sim){const b=sim.vlab.bench,seed=sim.vlab.seed,bags=[];for(let g=0;g<=MM_GROUPS;g++)bags.push(mmBag(seed,g));b.opened=!!b.opened;
  if(!Array.isArray(b.sorted))b.sorted=[];b.sorted=b.sorted.filter((x,i,a)=>Number.isInteger(x)&&x>=0&&x<bags[0].n&&a.indexOf(x)===i);if(!b.opened)b.sorted=[];
  return {kind:'mm',bags,pos:mmPlace(seed,bags[0].n)};}
function mmLanes(sim){const B=mmB(sim),b=sim.vlab.bench,col=B.bags[0].col,by=[[],[],[],[],[],[]],pos={};b.sorted.forEach(i=>by[col[i]].push(i));
  by.forEach((list,j)=>{const yc=MMG.my+j*MMG.lh+MMG.lh/2,lines=Math.max(1,Math.ceil(list.length/15)),lhh=Math.min(24,(MMG.lh-8)/lines),r=Math.min(8.5,lhh/2-0.5);
    list.forEach((i,q)=>{const c=q%15,line=Math.floor(q/15);pos[i]=[MMG.sx+c*19+Math.floor(c/5)*10,yc+(line-(lines-1)/2)*lhh,r];});});return {by,pos};}
function candy(ctx,x,y,r,c){ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(x+r*.12,y+r*.24,r,r*.9,0,0,6.29);ctx.fill();
  ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=Math.max(.8,r*.1);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.42)';ctx.beginPath();ctx.ellipse(x-r*.32,y-r*.36,r*.38,r*.22,-.6,0,6.29);ctx.fill();}
function mmPouch(ctx,x,y,w,h,ang,open){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.fillStyle='#7a4526';rr(ctx,-w/2,-h/2,w,h,8);ctx.fill();
  ctx.fillStyle='#f2c230';ctx.fillRect(-w/2,-h*0.1,w,h*0.2);
  if(open){ctx.fillStyle='#4a2a16';ctx.beginPath();ctx.moveTo(-w/2,-h/2);for(let i=0;i<=8;i++)ctx.lineTo(-w/2+i*w/8,-h/2+(i%2?6:0));ctx.lineTo(w/2,-h/2+10);ctx.lineTo(-w/2,-h/2+10);ctx.fill();}
  else{ctx.fillStyle='#5a3219';ctx.fillRect(-w/2,-h/2,w,9);ctx.fillRect(-w/2,h/2-9,w,9);}
  if(!open){const s=Math.max(9,w/11);txt(ctx,'Milk chocolate',0,-h*0.24,{s,w:700,c:'#fff3dc',a:'center'});txt(ctx,'candy-coated',0,-h*0.24+s+3,{s:s*0.9,c:'#fff3dc',a:'center'});
    [[-0.2,0.2],[0.18,0.22],[0,0.27]].forEach(([dx,dy],i)=>candy(ctx,dx*w,dy*h,w*0.08,MMC[(i*2+1)%6].c));txt(ctx,'1.69 oz (47.9 g)',0,h/2-14,{s:s*0.8,c:'#fff3dc',a:'center'});}
  ctx.restore();}
function drawMM(sim,ctx,vdt,k){const B=sim.st.B,b=sim.vlab.bench,bag=B.bags[0],fs=Math.min(13*k,20);
  if(sim.p.mmView==='board'){drawBoard(sim,ctx,k);return;}
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,0,800,450);
  txt(ctx,b.opened?'Your bag, poured out':'Your bag of candy-coated chocolates',16,28,{s:Math.min(15*k,22),w:700});
  // paper plate
  ctx.fillStyle='rgba(0,0,0,.12)';ctx.beginPath();ctx.arc(MMG.px+3,MMG.py+5,MMG.pr,0,6.29);ctx.fill();
  ctx.fillStyle='#f7f5ef';ctx.beginPath();ctx.arc(MMG.px,MMG.py,MMG.pr,0,6.29);ctx.fill();ctx.strokeStyle='#d9d4c6';ctx.lineWidth=2;ctx.beginPath();ctx.arc(MMG.px,MMG.py,MMG.pr-16,0,6.29);ctx.stroke();
  if(!b.opened)mmPouch(ctx,MMG.px,MMG.py,132,176,-0.12,false);
  else{mmPouch(ctx,40,72,44,62,-0.5,true);const done=new Set(b.sorted);B.pos.forEach((q,i)=>{if(!done.has(i))candy(ctx,q[0],q[1],10,MMC[bag.col[i]].c);});
    if(done.size===bag.n)txt(ctx,'Plate empty',MMG.px,MMG.py+6,{s:fs,c:'#8c8678',a:'center'});}
  // sorting mat: one row per color, lined up in groups of five
  const X=MMG.mx,Y=MMG.my,W=426,H=MMG.lh*6;ctx.fillStyle='#fbfaf6';rr(ctx,X,Y-6,W,H+12,8);ctx.fill();ctx.strokeStyle='#cfc8b6';ctx.lineWidth=1;rr(ctx,X,Y-6,W,H+12,8);ctx.stroke();
  txt(ctx,'Sorting mat',X+W/2,Y-14,{s:Math.min(12*k,17),w:700,c:PAL['cv-ink'],a:'center'});
  const L=mmLanes(sim);
  MMC.forEach((c,j)=>{const yc=Y+j*MMG.lh+MMG.lh/2;if(j){ctx.strokeStyle='#e2dccd';ctx.beginPath();ctx.moveTo(X+8,Y+j*MMG.lh);ctx.lineTo(X+W-8,Y+j*MMG.lh);ctx.stroke();}
    candy(ctx,X+18,yc,7,c.c);txt(ctx,c.l,X+31,yc+5,{s:Math.min(13*k,18),w:600,c:'#2b2b2b'});
    if(!L.by[j].length){ctx.strokeStyle='#e0d9c8';ctx.setLineDash([4,4]);ctx.strokeRect(MMG.sx-10,yc-11,300,22);ctx.setLineDash([]);}
    L.by[j].forEach(i=>{const p=L.pos[i];candy(ctx,p[0],p[1],p[2],c.c);});});}
function drawBoard(sim,ctx,k){const B=sim.st.B;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  ctx.fillStyle='#8f969c';rr(ctx,12,10,776,430,10);ctx.fill();ctx.fillStyle='#fbfbf7';rr(ctx,20,18,760,414,6);ctx.fill();
  const ink='#1f3b73',fs=Math.min(15*k,23);txt(ctx,'Class board: candy counts from the other groups',400,52,{s:Math.min(17*k,25),w:700,c:ink,a:'center'});
  const cols=['Group'].concat(MMK,['Total']),cw=[118].concat(MMK.map(()=>86),[88]),x0=40,y0=88,rh=34;let x=x0;
  const hc=['#6b3d22','#1f5fb8','#c25a08','#22803a','#b81f1f','#8a6a00'];cols.forEach((c,i)=>{txt(ctx,c,x+cw[i]/2,y0,{s:fs,w:700,c:i>0&&i<7?hc[i-1]:ink,a:'center'});x+=cw[i];});
  ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,y0+10);ctx.lineTo(x0+cw.reduce((a,b)=>a+b,0),y0+10);ctx.stroke();
  for(let g=1;g<=MM_GROUPS;g++){const bg=B.bags[g],y=y0+10+g*rh-8;x=x0;
    const cells=['Group '+(g+1)].concat(bg.cnt.map(String),[String(bg.n)]);cells.forEach((c,i)=>{txt(ctx,c,x+cw[i]/2,y,{s:fs,w:i===0||i===7?600:400,c:ink,a:'center'});x+=cw[i];});}
  txt(ctx,'You are Group 1. Add your own bag’s counts to these to get the class totals.',400,y0+10+MM_GROUPS*rh+24,{s:Math.min(13*k,19),c:'#444',a:'center'});}
function mmClick(sim,x,y){const B=mmB(sim),b=sim.vlab.bench;if(!B||!b.opened||sim.p.mmView==='board')return;const L=mmLanes(sim);
  for(const i of b.sorted){const p=L.pos[i];if(p&&Math.hypot(x-p[0],y-p[1])<=p[2]+2){b.sorted.splice(b.sorted.indexOf(i),1);return;}}
  const done=new Set(b.sorted);for(let i=B.pos.length-1;i>=0;i--){if(done.has(i))continue;const p=B.pos[i];if(Math.hypot(x-p[0],y-p[1])<=12){b.sorted.push(i);return;}}}
function mmNarrate(sim){const B=sim.st.B,b=sim.vlab.bench,n=B.bags[0].n;
  if(sim.p.mmView==='board')return 'The class board lists the counts from eight other groups. Add each color down the board, then add your own bag, to get the class totals.';
  if(!b.opened)return 'A sealed bag of milk chocolate candy-coated chocolates and a paper plate. Open the bag and pour the candies onto the plate.';
  if(b.sorted.length<n)return 'Tap a candy on the plate to move it to its color’s row on the sorting mat. Tap a candy on the mat to put it back. Each row lines up in groups of five, so it is easy to count.';
  return 'Every candy is on the sorting mat, lined up in groups of five. Count each row, and type the counts in Data Table 1.';}
/* checks: data cells may compare with the bag; calculated cells only check the student's arithmetic against their own entries */
const mmRowsOf=t=>t==='pp'?['Green','Albino']:MMK;
function mmOCheck(cls){return (sim,rv,v)=>{const B=mmB(sim),j=MMK.indexOf(rv);if(!B||j<0)return null;const b=sim.vlab.bench,lc=rv.toLowerCase();
  if(v<0||Math.round(v)!==v)return 'A count is a whole number of candies.';
  if(!cls){if(!b.opened)return 'Open the bag on the bench first, then sort and count the candies.';if(v===B.bags[0].cnt[j])return null;
    return 'Count the '+lc+' candies again. Your number does not match your bag.'+(b.sorted.length<B.bags[0].n?' Sorting them onto the mat first, in rows of five, makes them easier to count.':' Count the '+lc+' row on the sorting mat in groups of five.');}
  let others=0;for(let g=1;g<=MM_GROUPS;g++)others+=B.bags[g].cnt[j];const own=sim.vlab.val('t1','O',j);
  if(v===others+B.bags[0].cnt[j]||(Number.isFinite(own)&&v===others+own))return null;
  return 'Add the '+lc+' counts of all eight groups on the class board, then add your own bag’s '+lc+' count.';};}
function ppOCheck(sim,rv,v){const want=rv==='Green'?72:12;return v===want?null:'Use the observed counts given in the practice problem.';}
function mmNs(V,t){const O=V.col(t,'O'),s=O.every(Number.isFinite)?O.reduce((a,b)=>a+b,0):NaN,N=t==='pp'?NaN:vnum(V.raw(t==='t1'?'k:n1':'k:n2'));return [N,s].filter(x=>Number.isFinite(x)&&x>0);}
function mmECheck(t){return (sim,rv,v)=>{const V=sim.vlab,j=mmRowsOf(t).indexOf(rv);if(j<0)return null;const Ns=mmNs(V,t);
  if(!Ns.length)return t==='pp'?'Type both observed counts first.':t==='t1'?'Type all six observed counts first.':'Type all six class totals first.';
  if(t==='pp')return Ns.some(N=>Math.abs(v-N*(j?0.25:0.75))<=0.051)?null:'Check this expected count: use the ratio a Gg × Gg cross predicts, and the total number of plants.';
  return Ns.some(N=>Math.abs(v-N*MMC[j].p/100)<=0.051)?null:'Check this expected count: multiply the total number of candies by this color’s company percentage written as a decimal. Round to one decimal place.';};}
function mmDCheck(t){return (sim,rv,v)=>{const V=sim.vlab,j=mmRowsOf(t).indexOf(rv);if(j<0)return null;const O=V.val(t,'O',j),E=V.val(t,'E',j);
  if(!Number.isFinite(O)||!Number.isFinite(E))return 'Fill in O and E for this row first.';
  return Math.abs(v-(O-E))<=0.051?null:'O − E is this row’s observed count minus its expected count. Keep the minus sign when E is the larger one.';};}
function mmSqCheck(t){return (sim,rv,v)=>{const V=sim.vlab,j=mmRowsOf(t).indexOf(rv);if(j<0)return null;let d=V.val(t,'d',j);if(!Number.isFinite(d))d=V.val(t,'O',j)-V.val(t,'E',j);
  if(!Number.isFinite(d))return 'Fill in O − E for this row first.';const w=d*d;
  return Math.abs(v-w)<=Math.max(0.051,0.005*w)?null:'(O − E)² is this row’s O − E multiplied by itself. Squaring always gives a positive number.';};}
function mmChCheck(t){return (sim,rv,v)=>{const V=sim.vlab,j=mmRowsOf(t).indexOf(rv);if(j<0)return null;const E=V.val(t,'E',j);let s=V.val(t,'sq',j);
  if(!Number.isFinite(s)){const d=V.val(t,'O',j)-E;s=d*d;}if(!Number.isFinite(s)||!(E>0))return 'Fill in E and (O − E)² for this row first.';const w=s/E;
  return Math.abs(v-w)<=Math.max(0.006,0.01*w)?null:'(O − E)²/E is this row’s (O − E)² divided by its expected count, E.';};}
function mmChiCheck(t){return (sim,v,V)=>{const c=V.col(t,'ch');if(!c.every(Number.isFinite))return 'Fill in the (O − E)²/E column first.';const s=c.reduce((a,b)=>a+b,0);
  return Math.abs(v-s)<=Math.max(0.011,0.005*s)?null:'χ² is the sum of the (O − E)²/E column. Add every row.';};}
function mmNCheck(t){return (sim,v,V)=>{const O=V.col(t,'O');if(!O.every(Number.isFinite))return 'Type all six observed counts first.';
  return v===O.reduce((a,b)=>a+b,0)?null:'Your total does not match your observed counts. Add the six counts in your table.';};}
const mmCols=t=>[{id:'color',label:t==='pp'?'Phenotype':'Color',rows:mmRowsOf(t)}]
  .concat(t==='pp'?[]:[{id:'pct',label:'Company %',rows:MMC.map(c=>c.p),rowLabels:MMC.map(c=>c.p+'%')}])
  .concat([{id:'O',label:'Observed (O)',input:'number',dp:0,check:t==='pp'?ppOCheck:mmOCheck(t==='t2')},{id:'E',label:'Expected (E)',input:'number',dp:1,check:mmECheck(t)},
    {id:'d',label:'O − E',input:'number',dp:1,check:mmDCheck(t)},{id:'sq',label:'(O − E)²',input:'number',dp:2,check:mmSqCheck(t)},{id:'ch',label:'(O − E)²/E',input:'number',dp:2,check:mmChCheck(t)}]);

/* --- the two labs, from the teachers' handouts --- */
const fpb=sim=>sim.vlab.bench;
const fpFilled=(sim,t)=>FP_ROWS[t].every((_,r)=>sim.vlab.raw('c:'+t+':n:'+r).trim()!=='');
const LAB_FP={id:'fastplants',title:'Wisconsin Fast Plants Lab: Dominance in the F2 Generation',course:'Honors Biology',teachers:'Stearman, Lilyestrom, Powell',
  source:{label:'Fast Plants lab, pre-lab and conclusion handouts',href:'https://rjhs.instructure.com/courses/14659/assignments/571488'},level:'honors',
  purpose:'<p>Grow Wisconsin Fast Plants to determine dominance using Mendel’s principles. You will grow and observe the phenotypes of the F2 generation, focusing on two characters: stem color (purple or non-purple) and leaf color (green or yellow). You will record the number of plants with each trait and compare your results with Mendel’s to determine which traits are dominant.</p>',
  background:'<p>Wisconsin Fast Plants are a fast-growing strain of <i>Brassica rapa</i>, a relative of turnips and mustard, bred to go from seed to seed in about 40 days under constant light. Their seedling traits show 3 to 5 days after planting, so they work well for genetics.</p>'+
    '<p>A <b>character</b> is a feature that is inherited, such as stem color. A <b>trait</b> is one version of that character, such as a purple stem. In this lab you follow two characters at once: stem color (purple or non-purple) and leaf color (green or yellow-green).</p>'+
    '<p>Your seeds are the <b>F2 generation</b>. The P generation was two true-breeding strains that differ in both characters. Crossing them gave the F1 generation, and the F1 plants were crossed with each other. The seeds from their pods are your F2. Mendel found that a trait hidden in the F1 comes back in the F2, and that the counts of each trait in the F2 tell you which allele is dominant.</p>'+
    '<p>If your teacher asks for a chi-square test, use these critical values. Degrees of freedom (df) = the number of phenotype classes − 1.</p>'+CRIT_TABLE+
    '<p><b>About the virtual bench.</b> Each cell of the flat gets one F2 seed. Each seed’s two alleles for stem color and two alleles for leaf color come from a random egg and a random sperm of two F1 plants, so your flat’s counts are your own. The two genes are on different chromosomes. About 93% of the seeds germinate, so a few cells stay empty. One press of <b>Advance one day</b> moves the flat forward 24 hours.</p>',
  materials:['F2 Wisconsin Fast Plants seeds','A 72-cell growing flat with wicks, on a wicking mat and water reservoir','Potting mix with fertilizer','A fluorescent light bank (24 hours of light a day)','Forceps or a toothpick for planting','A hand lens'],
  hypothesis:{prompt:'<p>Predict which trait of each character will be dominant: purple or non-purple stems, and green or yellow-green leaves. Predict the ratio of phenotypes you expect in the F2, and give your reasoning.</p>'},
  setup(sim){BioLab.refresh(sim);},
  controls:['fpZoom'],
  steps:[
    {title:'Pre-lab',text:'<p>Before you plant, answer the pre-lab questions <b>Pre 1</b> to <b>Pre 5</b> in the Questions section below the bench: the characters and traits, the P, F1 and F2 crosses, and the results you expect from the monohybrid and dihybrid crosses.</p><p>Write your hypothesis too.</p>',controls:[]},
    {title:'Fill the flat',text:'<p>Fill each cell of the 72-cell flat with moist potting mix. The flat sits on a wicking mat over a water reservoir, so the soil stays wet from below.</p>',controls:['fp-fill'],
     done:sim=>!!fpb(sim).fill,doneHint:'Press <b>Fill the cells with potting mix</b>.'},
    {title:'Plant the F2 seeds',text:'<p>Plant one F2 seed in each cell, just below the surface of the soil.</p>',controls:['fp-plant'],done:sim=>!!fpb(sim).plant,doneHint:'Press <b>Plant one F2 seed in each cell</b>.'},
    {title:'Grow under the lights',text:'<p>Put the flat under the light bank, 5 to 10 cm below the bulbs. Fast Plants grow under light 24 hours a day. Keep the reservoir full of water.</p>',controls:['fp-light'],done:sim=>!!fpb(sim).light,doneHint:'Press <b>Put the flat under the lights</b>.'},
    {title:'Watch the seedlings come up',text:'<p>Press <b>Advance one day</b> to move the flat forward 24 hours. Watch the seedlings come up, and write what you see on days 2 and 3 in the Observations boxes.</p><p>Stop on day 4. The colors are clearest on days 4 and 5.</p>',
     controls:['fp-day','fpZoom'],done:sim=>fpb(sim).day>=FP.score,doneHint:'Advance the flat to day 4.'},
    {title:'Score stem color',text:'<p>Count the seedlings with <b>purple</b> stems and the seedlings with <b>non-purple</b> stems. Use <b>Magnify</b> to look at one corner of the flat at a time. Tap a seedling to tick it off as you count it, and press <b>Clear the ticks</b> before you count the next group.</p><p>Type your counts and the total number of seedlings in the <b>Stem color</b> table.</p>',
     controls:['fpZoom','fp-clear','fp-day'],done:sim=>fpFilled(sim,'mono'),doneHint:'Type a number in every row of the Stem color table.'},
    {title:'Score leaf color',text:'<p>Now count the seedlings with <b>green</b> leaves and the seedlings with <b>yellow-green</b> leaves. Look at the seed leaves (cotyledons). Type your counts and the total in the <b>Leaf color</b> table.</p>',
     controls:['fpZoom','fp-clear'],done:sim=>fpFilled(sim,'leaf'),doneHint:'Type a number in every row of the Leaf color table.'},
    {title:'Score both characters',text:'<p>Sort every seedling into one of four groups by both characters at once: purple stem and green leaves, non-purple stem and green leaves, purple stem and yellow leaves, or non-purple stem and yellow leaves. Type the counts in the <b>Dihybrid results</b> table.</p><p>Check: your four counts should add up to your total.</p>',
     controls:['fpZoom','fp-clear'],done:sim=>fpFilled(sim,'di'),doneHint:'Type a number in every row of the Dihybrid results table.'},
    {title:'Percentages and ratios',text:'<p>Fill in the percentage column of each table: divide each count by the total number of seedlings, then multiply by 100.</p><p>Then write the expected and actual ratios in the Calculations section. For an actual ratio, divide each count by the smallest count.</p>',controls:['fpZoom']},
    {title:'Chi-square (optional)',text:'<p>If your teacher asks, test your dihybrid counts with chi-square. For each class, E = total × the class’s expected fraction, then χ² = Σ (O − E)² ÷ E. Use the critical values table in the Background.</p>',controls:['fpZoom']},
    {title:'Analyze',text:'<p>Answer questions 1 to 5 below the bench, then write your conclusion. Use numbers from your tables. Then turn in your lab.</p>',controls:['fpZoom']}],
  tables:[
    {id:'mono',title:'Monohybrid results: stem color',cols:[{id:'ph',label:'Stem color',rows:FP_ROWS.mono},{id:'n',label:'Number of individuals',input:'number',dp:0,check:fpNCheck},{id:'pct',label:'Percentage (%)',input:'number',dp:1,check:fpPctCheck('mono')}]},
    {id:'leaf',title:'Leaf color',cols:[{id:'ph',label:'Leaf color',rows:FP_ROWS.leaf},{id:'n',label:'Number of individuals',input:'number',dp:0,check:fpNCheck},{id:'pct',label:'Percentage (%)',input:'number',dp:1,check:fpPctCheck('leaf')}]},
    {id:'di',title:'Dihybrid results: stem color and leaf color (for the percentages, use the total from your stem color table)',cols:[{id:'ph',label:'Stem, leaf',rows:FP_ROWS.di},{id:'n',label:'Number of individuals',input:'number',dp:0,check:fpNCheck},{id:'pct',label:'Percentage (%)',input:'number',dp:1,check:fpPctCheck('di')}]}],
  observations:[{id:'d2',label:'Day 2: what you see in the flat'},{id:'d3',label:'Day 3: what you see in the flat'},{id:'d4',label:'Scoring day: how you told the traits apart'}],
  graph:{type:'bar',title:'F2 seedlings in each phenotype class',xl:'Phenotype (stem, leaf)',yl:'Number of seedlings',ymin:0,series:[{table:'di',x:'ph',y:'n',label:'Seedlings'}]},
  calcs:[
    {id:'sx',label:'Stem color: expected ratio, purple : non-purple',input:'text'},
    {id:'sa',label:'Stem color: actual ratio, purple : non-purple',input:'text',check:ratioCheck(V=>fpPair(V,'mono'))},
    {id:'lx',label:'Leaf color: expected ratio, green : yellow-green',input:'text'},
    {id:'la',label:'Leaf color: actual ratio, green : yellow-green',input:'text',check:ratioCheck(V=>fpPair(V,'leaf'))},
    {id:'dx',label:'Dihybrid: expected ratio (purple green : non-purple green : purple yellow : non-purple yellow)',input:'text'},
    {id:'da',label:'Dihybrid: actual ratio, in the same order',input:'text',check:ratioCheck(fpQuad)},
    {id:'chi',label:'Optional: χ² for your dihybrid counts, tested against your expected dihybrid ratio',input:'number',check:fpChiCheck},
    {id:'df',label:'Optional: degrees of freedom',input:'number',check:dfCheck(4)},
    {id:'cv',label:'Optional: critical value at p = 0.05',input:'number',check:cvCheck('k:df')},
    {id:'dec',label:'Optional: do you accept or reject the null hypothesis that your counts fit the expected ratio?',input:'text',check:decCheck('k:chi','k:cv')}],
  questions:[
    {id:'pre1',n:'Pre 1',q:'<p>List the two characters you will study and the two traits of each.</p>',fields:[{id:'c1',label:'Character 1 and its traits'},{id:'c2',label:'Character 2 and its traits'}]},
    {id:'pre2',n:'Pre 2',q:'<p>Fill in the crosses for stem color. Use A for one allele and a for the other.</p>',fields:[{id:'p',label:'P generation: ___ × ___'},{id:'f1',label:'F1 generation: ___ × ___'},{id:'f2',label:'F2 generation: the genotypes'}]},
    {id:'pre3',n:'Pre 3',q:'<p>Monohybrid cross for stem color (A/a). Give the parents’ genotypes and the results you expect in the F2.</p>',
     fields:[{id:'par',label:'Parents’ genotypes'},{id:'AA',label:'Expected % AA'},{id:'Aa',label:'Expected % Aa'},{id:'aa',label:'Expected % aa'},{id:'dom',label:'Expected % with the dominant trait'},{id:'rec',label:'Expected % with the recessive trait'},{id:'r',label:'Expected phenotype ratio'}]},
    {id:'pre4',n:'Pre 4',q:'<p>Dihybrid cross (A/a for stem color, L/l for leaf color). Give the parents’ genotypes and the phenotypes you expect in the F2.</p>',
     fields:[{id:'par',label:'Parents’ genotypes'},{id:'pg',label:'Expected % purple stem, green leaf'},{id:'py',label:'Expected % purple stem, yellow leaf'},{id:'ng',label:'Expected % non-purple stem, green leaf'},{id:'ny',label:'Expected % non-purple stem, yellow leaf'},{id:'r',label:'Expected phenotype ratio'}]},
    {id:'pre5',n:'Pre 5',q:'<p>How could your counts be used to determine which trait is dominant?</p>'},
    {id:'q1',n:'1',q:'<p>Which alleles were dominant in the stems? Use your data.</p>'},
    {id:'q2',n:'2',q:'<p>Which alleles were dominant in the leaves? Use your data.</p>'},
    {id:'q3',n:'3',q:'<p>Were your results conclusive? Explain.</p>'},
    {id:'q4',n:'4',q:'<p>What errors could keep results like yours from being conclusive?</p>'},
    {id:'q5',n:'5',q:'<p>Defend or refute this statement: “You know which trait is dominant by which one shows up the most in the offspring.” Give examples that support each side.</p>'}],
  conclusion:{prompt:'<p>Write a claim–evidence–reasoning conclusion: which stem color and which leaf color are dominant? Use your F2 counts, percentages and ratios as evidence, and Mendel’s principles as your reasoning.</p>',cer:true}};

const mmb=sim=>sim.vlab.bench;
const mmFilled=(sim,t,c)=>mmRowsOf(t).every((_,r)=>sim.vlab.raw('c:'+t+':'+c+':'+r).trim()!=='');
const LAB_MM={id:'mm-chisquare',title:'Chi-Square Lab: Candy Colors',course:'AP Biology',teachers:'Powell, Russell',
  source:{label:'M&M Chi-Square Lab worksheet',href:'https://rjhs.instructure.com/courses/16620/assignments/599738'},level:'ap',
  purpose:'<p>Use a chi-square (χ²) test to decide whether the colors in a bag of milk chocolate candy-coated chocolates fit the percentages the company says it makes. Test your own bag first, then the pooled class data, then use the same test on a genetics cross.</p>',
  background:'<p>Real counts almost never match the expected numbers exactly, because chance alone makes samples wander. The chi-square test tells you whether the gap between what you observed and what you expected is small enough to blame on chance.</p>'+
    '<p>The test starts from a <b>null hypothesis</b>: there is no real difference between the observed and expected counts, and any difference you see is due to chance. You then calculate</p><p><b>χ² = Σ (O − E)² / E</b></p>'+
    '<p>where O is the observed count in a category and E is the expected count, the total × the expected fraction for that category. Σ means add up the value for every category.</p>'+
    '<p>Compare your χ² with the <b>critical value</b> for your <b>degrees of freedom</b> (df = the number of categories − 1) at p = 0.05. If χ² is smaller than the critical value, the difference is small enough to be due to chance: you accept (fail to reject) the null hypothesis. If χ² is larger, a difference that big would happen by chance less than 5% of the time: you reject the null hypothesis, and something other than chance is probably at work.</p>'+
    '<p>The company’s stated color percentages for milk chocolate candies: brown 13%, blue 24%, orange 20%, green 16%, red 13% and yellow 14%. Other varieties, such as peanut, use different mixes.</p>'+
    '<p><b>Critical values of χ²</b></p>'+CRIT_TABLE+
    '<p><b>About the virtual bench.</b> Each bag on the bench holds 52 to 60 candies. Each candy’s color is drawn at random using the company’s percentages, so every bag is a little different, as real bags are. The class board shows eight other groups’ bags, filled the same way.</p>',
  materials:['One bag of milk chocolate candy-coated chocolates (about 50 to 60 candies)','A paper plate','A sorting mat or paper towel','A calculator','The critical values table (in the Background)'],
  hypothesis:{prompt:'<p>State the null hypothesis for your bag: what does it say about any difference between your color counts and the company’s percentages?</p>'},
  setup(sim){BioLab.refresh(sim);},
  controls:[],
  steps:[
    {title:'Get set up',text:'<p>Read the Background. Then write the null hypothesis for your bag in the Hypothesis box.</p>'},
    {title:'Open the bag',text:'<p>Open your bag and pour the candies onto the paper plate. Do not eat any until you finish counting.</p>',controls:['mm-open'],done:sim=>!!mmb(sim).opened,doneHint:'Press <b>Open the bag and pour it onto the plate</b>.'},
    {title:'Sort by color',text:'<p>Sort the candies by color onto the sorting mat. Tap a candy on the plate to move it to its color’s row, or tap a candy on the mat to put it back. <b>Sort the rest by color</b> moves every candy left on the plate.</p><p>Each row on the mat lines the candies up in groups of five.</p>',
     controls:['mm-sort'],done:sim=>{const B=mmB(sim);return !B||mmb(sim).sorted.length>=B.bags[0].n;},doneHint:'Sort every candy onto the mat.'},
    {title:'Count each color',text:'<p>Count the candies in each row of the mat. Type the counts in the <b>Observed (O)</b> column of Data Table 1. Add them up and type the total, N, in the Calculations section.</p>',
     done:sim=>mmFilled(sim,'t1','O'),doneHint:'Type an observed count for every color in Data Table 1.'},
    {title:'Expected counts',text:'<p>For each color, find the expected count: E = N × the company’s percentage written as a decimal. For example, a color at 20% in a bag of 50 candies has E = 50 × 0.20 = 10.0. Type E in Data Table 1, rounded to one decimal place.</p>',
     done:sim=>mmFilled(sim,'t1','E'),doneHint:'Type an expected count for every color.'},
    {title:'Calculate χ²',text:'<p>For each color, fill in O − E, (O − E)² and (O − E)²/E. Then add the (O − E)²/E column to get χ², and type it in the Calculations section.</p>'},
    {title:'Accept or reject',text:'<p>Find the degrees of freedom and the critical value at p = 0.05 in the table in the Background. Decide whether to accept or reject the null hypothesis, and answer questions 1 and 2.</p>'},
    {title:'Pool the class data',text:'<p>The class board shows the counts from eight other groups. You are Group 1. For each color, add the counts from all eight groups and your own bag. Type the class totals in the Observed column of <b>Data Table 2</b>, and the class N in the Calculations section.</p><p>Switch the bench between <b>Your candies</b> and <b>Class board</b> as you work.</p>',
     setup(sim){BioLab.setValues(sim,{mmView:'board'});},controls:['mmView'],done:sim=>mmFilled(sim,'t2','O'),doneHint:'Type the class total for every color in Data Table 2.'},
    {title:'Test the class data',text:'<p>Repeat the test with the class totals: fill in E, O − E, (O − E)² and (O − E)²/E in Data Table 2, then χ², the degrees of freedom, the critical value and your decision. Answer questions 3 to 5.</p>',controls:['mmView']},
    {title:'Practice problem',text:'<p>In pea plants, the allele for green color (G) is dominant to the allele for albino (g). A cross of two Gg plants gives 72 green and 12 albino offspring, 84 in all. Use chi-square to test whether these results fit the ratio you expect from a Gg × Gg cross. Fill in the practice problem table and calculations, and answer question 6.</p>',controls:['mmView']},
    {title:'Conclusion',text:'<p>Write your conclusion, then turn in your lab.</p>',controls:['mmView']}],
  tables:[
    {id:'t1',title:'Data Table 1: your bag',cols:mmCols('t1')},
    {id:'t2',title:'Data Table 2: class data (all nine groups pooled)',cols:mmCols('t2')},
    {id:'pp',title:'Practice problem: pea plants from Gg × Gg (72 green, 12 albino, 84 in all)',cols:mmCols('pp')}],
  graph:{type:'bar',title:'Your bag: observed and expected counts by color',xl:'Candy color',yl:'Number of candies',ymin:0,
    series:[{table:'t1',x:'color',y:'O',label:'Observed (O)'},{table:'t1',x:'color',y:'E',label:'Expected (E)'}]},
  calcs:[
    {id:'n1',label:'Your bag: total number of candies, N',input:'number',check:mmNCheck('t1')},
    {id:'chi1',label:'Your bag: χ² = Σ (O − E)²/E',input:'number',check:mmChiCheck('t1')},
    {id:'df1',label:'Your bag: degrees of freedom',input:'number',check:dfCheck(6)},
    {id:'cv1',label:'Your bag: critical value at p = 0.05',input:'number',check:cvCheck('k:df1')},
    {id:'dec1',label:'Your bag: do you accept or reject the null hypothesis?',input:'text',check:decCheck('k:chi1','k:cv1')},
    {id:'n2',label:'Class data: total number of candies, N',input:'number',check:mmNCheck('t2')},
    {id:'chi2',label:'Class data: χ² = Σ (O − E)²/E',input:'number',check:mmChiCheck('t2')},
    {id:'df2',label:'Class data: degrees of freedom',input:'number',check:dfCheck(6)},
    {id:'cv2',label:'Class data: critical value at p = 0.05',input:'number',check:cvCheck('k:df2')},
    {id:'dec2',label:'Class data: do you accept or reject the null hypothesis?',input:'text',check:decCheck('k:chi2','k:cv2')},
    {id:'pr',label:'Practice problem: expected ratio of green : albino offspring from Gg × Gg',input:'text'},
    {id:'pchi',label:'Practice problem: χ²',input:'number',check:mmChiCheck('pp')},
    {id:'pdf',label:'Practice problem: degrees of freedom',input:'number',check:dfCheck(2)},
    {id:'pcv',label:'Practice problem: critical value at p = 0.05',input:'number',check:cvCheck('k:pdf')},
    {id:'pdec',label:'Practice problem: do you accept or reject the null hypothesis?',input:'text',check:decCheck('k:pchi','k:pcv')}],
  questions:[
    {id:'q1',n:'1',q:'<p>Your bag: explain why you accepted or rejected the null hypothesis. Use your χ² and the critical value.</p>'},
    {id:'q2',n:'2',q:'<p>If you rejected the null hypothesis for your bag, what could explain the difference between your counts and the company’s percentages? If you accepted it, what does that tell you about the differences you saw?</p>'},
    {id:'q3',n:'3',q:'<p>Class data: explain why you accepted or rejected the null hypothesis for the pooled class data.</p>'},
    {id:'q4',n:'4',q:'<p>If you rejected the null hypothesis for the class data, give possible explanations for the difference.</p>'},
    {id:'q5',n:'5',q:'<p>What is the purpose of pooling the class data? Explain how a larger sample changes how much you can trust the test, and why one bag and the class data could lead to different decisions.</p>'},
    {id:'q6',n:'6',q:'<p>Practice problem: explain your decision. Do the pea plant data fit the ratio you expect from a Gg × Gg cross?</p>'}],
  conclusion:{prompt:'<p>Write a claim–evidence–reasoning conclusion: do the colors in your bag, and in the pooled class data, fit the company’s stated percentages? Use your χ² values as evidence, and explain what the chi-square test tells you about chance.</p>',cer:true}};
/* steps before the class data show your own candies; the class steps open the class board */
LAB_MM.steps.forEach((st,i)=>{if(i<7&&!st.setup)st.setup=sim=>BioLab.setValues(sim,{mmView:'plate'});});


const CROSS={
  id:'crosses',hash:'crosses',apUnit:5,order:1,tab:'Genetic crosses',kind:'Simulation',
  card:'Breed pea plants and fruit flies. Watch gametes meet, then test the Punnett square against real counts.',
  title:'Genetic crosses: Punnett squares meet real offspring',
  lede:{bio:'Pick two parent pea plants, breed them, and watch each offspring form from one allele from each parent. Then compare the counts with the Punnett square.',
        honors:'Go beyond one gene: two genes at once, incomplete dominance in snapdragons, and an X-linked trait in fruit flies.',
        ap:'Test your counts with chi-square, and measure recombination between linked genes.'},
  scale:{bio:'Real organisms: a garden pea plant is about 1 m tall. Each offspring here stands for one seed grown into a plant.',honors:'Real organisms: pea plants (about 1 m tall) and fruit flies (about 3 mm long).'},
  timeless:true,animated:true,chChange:0.4,chReveal:4.2,
  controls:[
    {id:'mode',label:'Cross',type:'seg',def:'mono',lvl:'honors',options:[{v:'mono',l:'One gene'},{v:'di',l:'Two genes',lvl:'honors'},{v:'incomplete',l:'Snapdragons',lvl:'honors'},{v:'xlinked',l:'X-linked',lvl:'honors'},{v:'linked',l:'Linked genes',lvl:'ap'}],
     onChange(sim){clearOff(sim);syncCtl(sim);}},
    {id:'p1m',label:'Parent 1',type:'select',def:'Pp',lvl:'bio',noTrial:true,options:[{v:'PP',l:'PP (purple)'},{v:'Pp',l:'Pp (purple)'},{v:'pp',l:'pp (white)'}],onChange:clearOff},
    {id:'p2m',label:'Parent 2',type:'select',def:'Pp',lvl:'bio',noTrial:true,options:[{v:'PP',l:'PP (purple)'},{v:'Pp',l:'Pp (purple)'},{v:'pp',l:'pp (white)'}],onChange:clearOff},
    {id:'p1d',label:'Parent 1',type:'select',def:'YyRr',lvl:'honors',noTrial:true,options:['YYRR','YyRr','YyRR','YYRr','Yyrr','yyRr','YYrr','yyRR','yyrr'].map(v=>({v,l:v})),onChange:clearOff,help:'Y yellow, y green · R round, r wrinkled'},
    {id:'p2d',label:'Parent 2',type:'select',def:'YyRr',lvl:'honors',noTrial:true,options:['YYRR','YyRr','YyRR','YYRr','Yyrr','yyRr','YYrr','yyRR','yyrr'].map(v=>({v,l:v})),onChange:clearOff},
    {id:'p1i',label:'Parent 1',type:'select',def:'RW',lvl:'honors',noTrial:true,options:[{v:'RR',l:'CᴿCᴿ (red)'},{v:'RW',l:'CᴿCᵂ (pink)'},{v:'WW',l:'CᵂCᵂ (white)'}],onChange:clearOff},
    {id:'p2i',label:'Parent 2',type:'select',def:'RW',lvl:'honors',noTrial:true,options:[{v:'RR',l:'CᴿCᴿ (red)'},{v:'RW',l:'CᴿCᵂ (pink)'},{v:'WW',l:'CᵂCᵂ (white)'}],onChange:clearOff},
    {id:'mom',label:'Mother ♀',type:'select',def:'XRXr',lvl:'honors',noTrial:true,options:[{v:'XRXR',l:'XᴿXᴿ (red eyes)'},{v:'XRXr',l:'XᴿXʳ (red, carrier)'},{v:'XrXr',l:'XʳXʳ (white eyes)'}],onChange:clearOff},
    {id:'dad',label:'Father ♂',type:'select',def:'XRY',lvl:'honors',noTrial:true,options:[{v:'XRY',l:'XᴿY (red eyes)'},{v:'XrY',l:'XʳY (white eyes)'}],onChange:clearOff},
    {id:'rf',label:'Distance between genes',type:'range',min:0,max:50,step:1,def:17,unit:' map units',lvl:'ap',onChange:clearOff,help:'1 map unit = 1% recombinant offspring'},
    // virtual lab bench only (hidden in the other views)
    {id:'fpZoom',label:'Magnify',type:'seg',def:0,vlab:true,noTrial:true,options:[{v:0,l:'Off'},{v:1,l:'Top left'},{v:2,l:'Top right'},{v:3,l:'Bottom left'},{v:4,l:'Bottom right'}]},
    {id:'mmView',label:'Bench view',type:'seg',def:'plate',vlab:true,noTrial:true,options:[{v:'plate',l:'Your candies'},{v:'board',l:'Class board'}]}
  ],
  actions:[{id:'breed20',label:'Breed 20',primary:true,run(sim){breed(sim,20);}},{id:'breed100',label:'Breed 100',run(sim){breed(sim,100);}},{id:'clear',label:'Clear offspring',run:clearOff},
    {id:'fp-fill',label:'Fill the cells with potting mix',primary:true,vlab:true,enabled:s=>!!fpB(s)&&!s.vlab.bench.fill,run(s){if(fpB(s))s.vlab.bench.fill=true;}},
    {id:'fp-plant',label:'Plant one F2 seed in each cell',primary:true,vlab:true,enabled:s=>!!fpB(s)&&s.vlab.bench.fill&&!s.vlab.bench.plant,run(s){const b=fpB(s)&&s.vlab.bench;if(b&&b.fill)b.plant=true;}},
    {id:'fp-light',label:'Put the flat under the lights',primary:true,vlab:true,enabled:s=>!!fpB(s)&&s.vlab.bench.plant&&!s.vlab.bench.light,run(s){const b=fpB(s)&&s.vlab.bench;if(b&&b.plant){b.light=true;b.day=0;}}},
    {id:'fp-day',label:'Advance one day',primary:true,vlab:true,enabled:s=>!!fpB(s)&&s.vlab.bench.light&&s.vlab.bench.day<FP.last,run(s){const b=fpB(s)&&s.vlab.bench;if(b&&b.light&&b.day<FP.last)b.day++;}},
    {id:'fp-clear',label:'Clear the ticks',vlab:true,enabled:s=>!!fpB(s)&&s.vlab.bench.ticks.length>0,run(s){if(fpB(s))s.vlab.bench.ticks=[];}},
    {id:'mm-open',label:'Open the bag and pour it onto the plate',primary:true,vlab:true,enabled:s=>!!mmB(s)&&!s.vlab.bench.opened,run(s){if(mmB(s)){s.vlab.bench.opened=true;BioLab.setValues(s,{mmView:'plate'});}}},
    {id:'mm-sort',label:'Sort the rest by color',vlab:true,enabled:s=>{const B=mmB(s);return !!B&&s.vlab.bench.opened&&s.vlab.bench.sorted.length<B.bags[0].n;},
     run(s){const B=mmB(s),b=s.vlab.bench;if(!B||!b.opened)return;const done=new Set(b.sorted);for(let i=0;i<B.bags[0].n;i++)if(!done.has(i))b.sorted.push(i);}}],
  labs:[LAB_FP,LAB_MM],
  /* what the bench shows right now (used by the virtual-lab tests) */
  benchRead(sim){const F=fpB(sim),M=mmB(sim);
    if(F){const b=sim.vlab.bench;return {day:b.day,shown:sim.vis.fd,counts:fpCounts(sim),ticks:b.ticks.length,fill:b.fill,plant:b.plant,light:b.light};}
    if(M){const b=sim.vlab.bench;return {opened:b.opened,n:M.bags[0].n,counts:M.bags[0].cnt.slice(),sorted:b.sorted.length,board:M.bags.slice(1).map(g=>g.cnt.slice()),view:sim.p.mmView,pos:M.pos,lanes:b.opened?mmLanes(sim).pos:{}};}
    return null;},
  onClick(sim,x,y){if(fpB(sim))fpClick(sim,x,y);else if(mmB(sim))mmClick(sim,x,y);},
  /* Challenge game: six breeding orders. The Punnett square stays hidden until Breed, so students reason first. */
  game:{label:'Breed the target',title:'Breed the target',rounds:6,fireLabel:'Breed',par:360,controls:[],metrics:['cross','n','observed'],
    intro:{bio:'Each round names the offspring someone wants. Choose the parents and press Breed: you score on the Punnett square’s expected ratio, because real offspring are random.',
           honors:'Six breeding orders with snapdragons, fruit flies and two-gene peas. Choose parents whose Punnett square gives exactly what is asked; you score on the expected ratio, not the random sample.',
           ap:'Two-gene ratios, real counts to decode, then linked genes to map. Set the parents or the map distance and press Breed; you score on the expected result, not the random sample.'},
    start(sim){sim.gm={};},
    newRound(sim,i){const lv=BioLab.level,r=GAME_ROUNDS[lv==='ap'?'ap':lv==='honors'?'honors':'bio'][i](sim,i);
      if(r.ways>1)r.prompt+=` <span class="gm-hint">${r.counts?'More than one cross fits these counts; any of them counts.':'More than one cross gives this; any of them counts.'}</span>`;
      BioLab.setValues(sim,Object.assign({mode:r.mode},r.fixed||{},r.start));clearOff(sim);sim.running=true;r.metrics=['cross','n','observed'];return r;},
    fire(sim,r){clearOff(sim);sim.st.reveal=true;sim.running=true;breed(sim,r.n?Math.min(r.n,100):r.mode==='di'?64:40);},
    poll(sim,r){const s=sim.st;if(!s.reveal){s.reveal=true;breed(sim,40);return null;}if(s.queue.length)return null;return gJudge(sim,r);},
    retry(sim,r){clearOff(sim);sim.running=true;},
    solve(sim,r){if(r.mode==='linked'){BioLab.setValues(sim,{rf:r.rf});return;}const p=gCombos(r).find(q=>gPass(r,q)),v={};r.controls.forEach(id=>v[id]=p[id]);BioLab.setValues(sim,v);}},
  init(sim){const s={clock:0,queue:[],off:[],counts:{},n:0,nextT:0,interval:.1,last:null,reveal:false},id=vlId(sim);
    if(id==='fastplants')s.B=fpInit(sim);else if(id==='mm-chisquare')s.B=mmInit(sim);return s;},
  step(sim,dt){const s=sim.st;if(s.B)return;s.clock+=dt;while(s.queue.length&&s.clock>=s.nextT){addOff(sim,s.queue.shift());s.nextT+=s.interval;}},
  onLevel(sim){if(sim.vlab&&sim.mode==='vlab'){if(sim.st&&sim.st.B&&BioLab.vlab)BioLab.vlab.go(sim,sim.vlab.step);return;}syncCtl(sim);},
  metrics:[
    {id:'cross',label:'Cross',text:true,lvl:'bio',get:crossText},
    {id:'expected',label:'Expected ratio',text:true,lvl:'bio',get:ratioText},
    {id:'n',label:'Offspring counted',unit:'',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.n},
    {id:'observed',label:'Observed',text:true,lvl:'bio',get:obsText},
    {id:'chi2',label:'Chi-square (χ²)',unit:'',lvl:'ap',min:0,max:10,d:2,get:s=>chi(s).x},
    {id:'decision',label:'Chi-square test at p = 0.05',text:true,lvl:'ap',get(sim){const c=chi(sim);if(!sim.st.n)return 'Breed offspring first';if(c.df<1)return 'Only one phenotype is expected';
      const cr=CRIT[c.df];return 'χ² '+c.x.toFixed(2)+(c.x<cr?' < ':' ≥ ')+cr+' (df '+c.df+'): '+(c.x<cr?'fits the expected ratio':'does not fit')+(c.small?'. Sample is small, so be cautious.':'');}},
    {id:'rfObs',label:'Recombinant offspring',unit:'%',lvl:'ap',min:0,max:50,d:1,get(sim){if(sim.p.mode!=='linked'||!sim.st.n)return NaN;const c=sim.st.counts;return 100*((c['gray-vestigial']||0)+(c['black-normal']||0))/sim.st.n;}}
  ],
  graphs:[{id:'bars',label:'Observed vs. expected',custom:true}],defaultGraph:'bars',
  plot(sim,ctx,box){const m=mode(sim),pr=expected(sim),s=sim.st,n=s.n||100,fs=m.phenos,hide=gHide(sim);
    const O=fs.map(f=>s.n?(s.counts[f.k]||0):NaN),E=fs.map(f=>n*pr[f.k]);const ymax=Math.max(4,...(hide?[]:E),...O.filter(Number.isFinite))*1.38;
    if(hide){axes(ctx,box,{xmin:0,xmax:fs.length,ymin:0,ymax,xcats:fs.map(f=>f.l),yl:'Number of offspring'});legend(ctx,box.L+14,box.T+10,[{label:'Press Breed to see the counts and the expected bars',color:serColor(1),dash:true}]);return;}
    const ax=axes(ctx,box,{xmin:0,xmax:fs.length,ymin:0,ymax,xcats:fs.map(f=>f.l),yl:'Number of offspring'});
    fs.forEach((f,i)=>{const w=.34,y0=ax.Y(0);
      if(Number.isFinite(O[i])){const x0=ax.X(i+.5-w-.02),x1=ax.X(i+.5-.02),y1=ax.Y(O[i]);ctx.fillStyle=serColor(0);ctx.fillRect(x0,y1,x1-x0,y0-y1);txt(ctx,String(O[i]),(x0+x1)/2,y1-5,{s:12,w:700,c:PAL['fg'],a:'center'});}
      const x0=ax.X(i+.5+.02),x1=ax.X(i+.5+w+.02),y1=ax.Y(E[i]);ctx.strokeStyle=serColor(1);ctx.lineWidth=2;ctx.setLineDash([5,3]);ctx.strokeRect(x0,y1,x1-x0,y0-y1);ctx.setLineDash([]);
      txt(ctx,fmtNum(E[i],E[i]%1?1:0),(x0+x1)/2,y1-5,{s:12,c:PAL['muted'],a:'center'});});
    legend(ctx,box.L+14,box.T+10,[{label:s.n?'Observed':'Observed (breed first)',color:serColor(0)},{label:'Expected for '+n,color:serColor(1),dash:true}]);},
  narrate(sim){if(fpB(sim))return fpNarrate(sim);if(mmB(sim))return mmNarrate(sim);
    const s=sim.st,m=mode(sim),md=sim.p.mode,c=s.counts;
    if(gHide(sim))return md==='linked'?'<b>Plan first.</b> The gamete percentages stay hidden until you breed. Each crossover makes a recombinant gamete, and 1 map unit means 1% recombinant offspring.'
      :'<b>Plan first.</b> The Punnett square stays hidden until you breed. List the gametes each parent can make, pair them up, then press <b>Breed</b>.';
    if(s.queue.length)return '<b>Making offspring.</b> Each one gets one allele from each parent, chosen at random. The highlighted box shows the newest one: <b>'+m.show(s.last?s.last.g:'')+'</b>.';
    if(!s.n){if(md==='xlinked')return 'The eye-color gene sits on the X chromosome. Daughters get an X from each parent; sons get their only X from their mother. Press Breed to see who ends up with white eyes.';
      if(md==='linked')return 'These two genes sit close together on the same chromosome, so they are usually inherited together. Press Breed to count how often crossing over separates them.';
      if(md==='incomplete')return 'In snapdragons neither color allele fully hides the other. Press Breed to see what the in-between offspring look like.';
      return 'Each parent passes one of its two alleles to each offspring, at random. Press <b>Breed</b> and compare the real counts with the Punnett square.';}
    let t='So far: <b>'+obsText(sim)+'</b>. The Punnett square predicts '+ratioText(sim)+'.';
    if(md==='xlinked'&&c['white-M'])t+=' White eyes show up in sons: a son’s only X comes from his mother, so one Xʳ is enough.';
    else if(md==='incomplete'&&c.pink)t+=' Pink flowers have one Cᴿ and one Cᵂ allele: half the red pigment.';
    else if(md==='linked')t+=' Recombinant offspring appear only when crossing over happens between the two genes.';
    else if(md==='mono'&&c.white&&sim.p.p1m!=='pp'&&sim.p.p2m!=='pp')t+=' White flowers appear only when an offspring gets p from both parents.';
    if(s.n<30&&Object.keys(c).length>1)t+=' With this few offspring, the counts can wander from the expected ratio.';
    return t;},
  initVis(){},
  thumbSetup(sim){breedNow(sim,60);},thumbFrames:6,
  draw(sim,ctx,vdt,k){const cur=sim.vlab&&sim.st.B?'pointer':'';if(sim.ui&&sim.ui.stage&&sim.ui.stage.style.cursor!==cur)sim.ui.stage.style.cursor=cur;
    if(fpB(sim)){drawFP(sim,ctx,vdt,k);return;}if(mmB(sim)){drawMM(sim,ctx,vdt,k);return;}
    const s=sim.st,m=mode(sim),md=sim.p.mode,[g1,g2]=gametes(sim),gs=m.par(sim.p),hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    ctx.fillStyle=PAL['cv-bg2'];rr(ctx,10,8,334,434,12);ctx.fill();rr(ctx,352,8,440,434,12);ctx.fill();
    // parents
    const pX=[86,268];[0,1].forEach(i=>{const ph=parentPhen(sim,i);sprite(ctx,md,ph,pX[i],m.org==='seed'?54:52,m.org==='seed'?2.6:2.2,i===0?'F':'M');
      const role=md==='xlinked'?(i===0?'Mother ♀':'Father ♂'):'Parent '+(i+1);
      txt(ctx,role,pX[i],108,{s:11.5*k,c:PAL['cv-soft'],a:'center'});txt(ctx,m.show(gs[i]),pX[i],126,{s:15*k,w:700,a:'center'});});
    txt(ctx,'×',177,74,{s:26,w:700,c:PAL['cv-soft'],a:'center'});
    // Punnett square
    const P=PUN,n1=g1.length,n2=g2.length,cw=(P.w-P.hw)/n2,ch=(P.h-P.hh)/n1,cx0=P.x+P.hw,cy0=P.y+P.hh;
    const cellOf=(r,c)=>[cx0+c*cw,cy0+r*ch];
    const hide=gHide(sim);
    for(let r=0;r<n1;r++)for(let c=0;c<n2;c++){const o=m.comb(g1[r],g2[c]),ph=m.phen(o),[x,y]=cellOf(r,c);
      ctx.fillStyle=PAL['card'];ctx.fillRect(x+1,y+1,cw-2,ch-2);
      if(hide){txt(ctx,'?',x+cw/2,y+ch/2+1,{s:(n1*n2>4?16:24)*k,w:700,c:PAL['cv-soft'],a:'center',b:'middle'});continue;}
      if(md==='linked'){sprite(ctx,md,ph,x+30,y+ch/2-4,1.15,'F');txt(ctx,m.show(o.g),x+cw*.42,y+ch/2,{s:15*k,w:700,a:'center',b:'middle'});const pc=g1[r].p*100;txt(ctx,(pc%1?pc.toFixed(1):pc)+'%',x+cw-12,y+ch/2,{s:14*k,w:700,c:PAL['cv-soft'],a:'right',b:'middle'});continue;}
      const big=n1*n2<=4;if(big)sprite(ctx,md,ph,x+cw/2,y+ch*.4,md==='di'?1.5:1.25,o.sex||'F');
      txt(ctx,m.show(o.g),x+cw/2,big?y+ch-13:y+ch/2+1,{s:(big?15:12.5)*k,w:700,a:'center',b:'middle'});}
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.strokeRect(cx0,cy0,P.w-P.hw,P.h-P.hh);
    const chip=(x,y,l,fill)=>{ctx.fillStyle=fill||PAL['card'];ctx.beginPath();ctx.arc(x,y,15.5,0,6.29);ctx.fill();ctx.strokeStyle=PAL['s2'];ctx.lineWidth=1.8;ctx.stroke();txt(ctx,l,x,y+1,{s:(l.length>2?11:14.5)*k,w:700,a:'center',b:'middle'});};
    g1.forEach((g,r)=>chip(P.x+P.hw/2,cy0+r*ch+ch/2,g.l));g2.forEach((g,c)=>chip(cx0+c*cw+cw/2,P.y+P.hh/2,g.l));
    // newest offspring: gametes fly into their box
    if(s.last&&s.last.ri<n1&&s.last.ci<n2){const age=s.clock-s.last.born,dur=Math.max(.12,Math.min(.5,s.interval*.9)),[x,y]=cellOf(s.last.ri,s.last.ci);
      if(age<dur*2.5||s.queue.length){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;ctx.strokeRect(x+2,y+2,cw-4,ch-4);}
      if(age<dur){const f=age/dur,ex=x+cw/2,ey=y+ch/2;
        chip(P.x+P.hw/2+(ex-P.x-P.hw/2)*f,cy0+s.last.ri*ch+ch/2+(ey-cy0-s.last.ri*ch-ch/2)*f,g1[s.last.ri].l,PAL['cv-bg2']);
        chip(cx0+s.last.ci*cw+cw/2+(ex-cx0-s.last.ci*cw-cw/2)*f,P.y+P.hh/2+(ey-P.y-P.hh/2)*f,g2[s.last.ci].l,PAL['cv-bg2']);}}
    // offspring
    const pr=expected(sim),fs=hide?m.phenos:m.phenos.filter(f=>pr[f.k]>1e-9||s.counts[f.k]);
    txt(ctx,'Offspring: '+s.n,366,32,{s:16*k,w:700});
    let lx=366,ly=54;fs.forEach(f=>{const lab=f.s+' '+(s.counts[f.k]||0);ctx.font='400 '+12*k+'px '+FONT;const w=ctx.measureText(lab).width+34;if(lx+w>792){lx=366;ly+=19;}sprite(ctx,md,f.k,lx+8,ly-4,md==='di'?.75:.62,'M');txt(ctx,lab,lx+20,ly,{s:12*k,c:PAL['cv-ink']});lx+=w;});
    const GX=362,GY=ly+10,cols=10,rows=10,gw=42.4,gh=(438-GY)/10;const start=Math.max(0,s.off.length-100);
    if(!s.off.length){txt(ctx,sim.gameRound?'Choose, then press Breed':'Press Breed 20 or Breed 100',572,250,{s:15*k,c:PAL['cv-soft'],a:'center'});
      ctx.fillStyle=PAL['line'];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){ctx.beginPath();ctx.arc(GX+c*gw+gw/2,GY+r*gh+gh/2,1.5,0,6.29);ctx.fill();}}
    for(let i=start;i<s.off.length;i++){const o=s.off[i],j=i-start,x=GX+(j%cols)*gw+gw/2,y=GY+Math.floor(j/cols)*gh+gh/2,a=clamp((s.clock-o.born)/.18,0,1),sc=(0.4+0.6*a)*(md==='di'?1.15:m.org==='fly'?Math.min(.95,gh/38):.82);
      sprite(ctx,md,o.k,x,y+(md==='di'?0:2),sc,o.sex);}
    if(s.off.length>100)txt(ctx,'Showing the newest 100',784,438,{s:11.5*k,c:PAL['cv-soft'],a:'right'});
  },
  tour:[
    {title:'The parents',text:{bio:'Each parent plant has two alleles for flower color. P (purple) is dominant over p (white), so a Pp plant looks purple but carries a hidden p.',honors:'Each parent carries two alleles of the gene. Genotype is the pair of letters; phenotype is what you see.'},focus:[10,8,334,132],pause:true},
    {title:'Gametes carry one allele',text:'Each sperm or egg gets only one of a parent’s two alleles. A Pp parent makes P gametes and p gametes in equal numbers. They are shown in the circles along the edges.',focus:[[24,150,46,288],[24,150,312,34]],pause:true},
    {title:'The Punnett square',text:'Each box pairs one gamete from each parent. All four boxes are equally likely: 1 PP, 2 Pp and 1 pp. So you expect 3 purple for every 1 white.',focus:[70,184,266,254],pause:true},
    {title:'One offspring at a time',text:'Watch the highlighted box: two gametes meet, and the new plant appears on the right. Which box it lands in is random, like a coin flip for each parent.',focus:[[24,150,312,288],[352,8,440,434]],speed:0.12,setup(sim){clearOff(sim);breed(sim,20);}},
    {title:'Bigger samples',text:'With 100 offspring the counts get close to 3 : 1, but rarely exactly. Small samples wander more: 4 coin flips give exactly 2 heads only 3 times in 8.',focus:[352,8,440,434],speed:1,setup(sim){breed(sim,100);}},
    {lvl:'honors',title:'A sex-linked gene',text:'Now the gene is on the X chromosome of fruit flies. A carrier mother passes Xʳ to half her sons, and they show white eyes because their Y has no second copy to hide it.',focus:[352,8,440,434],speed:1,setup(sim){BioLab.setValues(sim,{mode:'xlinked',mom:'XRXr',dad:'XRY'});breed(sim,100);}},
    {lvl:'ap',title:'Is the difference just chance?',text:'Chi-square adds up (observed − expected)² ÷ expected for each phenotype. If χ² is below the critical value for your degrees of freedom (number of phenotypes − 1), the difference is small enough to be chance.',focus:[352,8,440,64],speed:1,setup(sim){BioLab.setValues(sim,{mode:'mono',p1m:'Pp',p2m:'Pp'});breed(sim,20);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'mono',p1m:'Pp',p2m:'Pp'});clearOff(sim);},
  lab:{bio:'<p><b>Question:</b> How close do real offspring counts come to the Punnett square?</p><ol><li>Set both parents to Pp.</li><li>Press Breed 20, then Record trial, then Clear offspring. Do this 4 times.</li><li>Now Breed 100 and record.</li></ol><p>Which trials came closest to 3 purple : 1 white? Explain why sample size matters.</p>',
       honors:'<p><b>Question:</b> Do two genes sort independently?</p><ol><li>Choose Two genes and cross YyRr × YyRr. Breed 100 three times, recording after each.</li><li>Switch to X-linked and cross XᴿXʳ × XᴿY. Breed 100 and record.</li></ol><p>Compare your dihybrid counts with 9:3:3:1. In the X-linked cross, explain why only sons show white eyes.</p>',
       ap:'<p><b>Question:</b> When can you trust a ratio?</p><ol><li>Cross Pp × Pp. Breed 20 and record χ². Clear, then repeat 4 times. Then do the same with 100 offspring.</li><li>Choose Linked genes at 17 map units. Breed 100 and record the recombinant %.</li></ol><p><b>Claim–evidence–reasoning:</b> Use χ² to decide whether your linked-gene data fit 9:3:3:1-style independent assortment (1:1:1:1 in a testcross), and estimate the map distance.</p>'},
  terms:[{t:'Allele',d:'One version of a gene, like P (purple) or p (white).'},{t:'Dominant / recessive',d:'A dominant allele shows even with one copy. A recessive allele shows only with two copies.'},{t:'Genotype / phenotype',d:'Genotype is the alleles (Pp). Phenotype is the trait you see (purple).'},{t:'Homozygous / heterozygous',d:'Two identical alleles (PP, pp) or two different ones (Pp).'},{t:'Punnett square',d:'A grid that pairs each parent’s gametes to show the possible offspring.'},
    {lvl:'honors',t:'Dihybrid cross',d:'A cross that follows two genes at once. YyRr × YyRr gives 9:3:3:1.'},{lvl:'honors',t:'Incomplete dominance',d:'Neither allele fully hides the other, so heterozygotes look in-between (pink).'},{lvl:'honors',t:'X-linked (sex-linked)',d:'A gene on the X chromosome. Males have one X, so one recessive allele shows.'},{lvl:'honors',t:'Testcross',d:'Crossing an organism with a homozygous recessive to reveal its genotype.'},
    {lvl:'ap',t:'Chi-square (χ²)',d:'A test of whether observed counts differ from expected by more than chance.'},{lvl:'ap',t:'Degrees of freedom',d:'Number of phenotype categories minus 1.'},{lvl:'ap',t:'Linked genes',d:'Genes close together on one chromosome that tend to be inherited together.'},{lvl:'ap',t:'Recombination frequency',d:'The % of offspring with new allele combinations. 1% = 1 map unit.'}],
  about:'<p>Each offspring is built by picking one gamete from each parent at random, with each gamete’s probability taken from Mendel’s laws. The expected ratio comes from adding up every box of the Punnett square.</p><p>Simplifications: every offspring survives and every genotype has full penetrance. The two genes in the two-gene cross sit on different chromosomes. In the linked-gene cross, crossing over happens at the set frequency, the parent is in the coupling phase (BV/bv), and the testcross partner is bv/bv. Chi-square uses p = 0.05 critical values (df 1: 3.84, df 2: 5.99, df 3: 7.81).</p>'+
    '<p><b>The virtual lab benches.</b> The Fast Plants flat holds 72 cells with one F2 seed each. Each seed gets one allele for each gene from each of two F1 dihybrid parents (AaLl × AaLl), chosen at random, so a flat gives about 9 : 3 : 3 : 1 with real sampling variation. About 93% of the seeds germinate, and the stem and seed-leaf colors show fully by day 4. In the candy lab, each bag holds 52 to 60 candies whose colors are drawn at random from the company’s stated percentages (a multinomial sample), so about 1 bag in 20 fails a chi-square test at p = 0.05 by chance alone. Both benches take their randomness from the lab’s saved seed, so a reload never changes a student’s data.</p>',
  challenges:[
    {lvl:'bio',q:'You cross two purple pea plants that are both Pp. Out of 100 offspring, about how many will have white flowers?',choices:['None','About 25','About 50','About 75'],correct:1,
     baseline:{mode:'mono',p1m:'Pp',p2m:'Pp'},changeAction:'breed100',changeText:'Bred 100 offspring',watch:'bars',
     explain:'Each parent passes P or p with equal chance. Only the pp box (1 of 4) is white, so about 1 in 4 offspring: about 25 out of 100. Your exact count will usually be a little off, because each offspring is a separate random event.'},
    {lvl:'bio',q:'You cross a purple PP plant with a white pp plant. What will their offspring look like?',choices:['All purple','All white','Half purple, half white','A lighter purple'],correct:0,
     baseline:{mode:'mono',p1m:'PP',p2m:'pp'},changeAction:'breed20',changeText:'Bred 20 offspring',watch:'bars',
     explain:'Every offspring gets P from one parent and p from the other, so every one is Pp. One dominant P is enough for purple. The white allele is still there, hidden, and can reappear in the next generation.'},
    {lvl:'bio',q:'A purple plant’s genotype is a mystery, so you cross it with a white plant (pp). If the purple plant is secretly Pp, what will the offspring look like?',choices:['All purple','About half purple, half white','All white'],correct:1,
     baseline:{mode:'mono',p1m:'Pp',p2m:'pp'},changeAction:'breed20',changeText:'Bred 20 offspring',watch:'bars',
     explain:'This is a testcross. The white parent can only give p, so each offspring’s color shows which allele the mystery parent passed on. Any white offspring prove the purple parent carries p.'},
    {lvl:'honors',q:'Two pea plants are both YyRr (yellow, round seeds). What fraction of their offspring will have green, wrinkled seeds?',choices:['1/16','3/16','9/16','1/4'],correct:0,
     baseline:{mode:'di',p1d:'YyRr',p2d:'YyRr'},changeAction:'breed100',changeText:'Bred 100 offspring',watch:'bars',
     explain:'Green needs yy (1/4) and wrinkled needs rr (1/4). The genes sort independently, so multiply: 1/4 × 1/4 = 1/16. Only one of the 16 boxes is yyrr.'},
    {lvl:'honors',q:'A red-eyed female fly that carries white (XᴿXʳ) mates with a red-eyed male (XᴿY). Which offspring can have white eyes?',choices:['Only daughters','About half of the sons, and no daughters','Every offspring','None of them'],correct:1,
     baseline:{mode:'xlinked',mom:'XRXr',dad:'XRY'},changeAction:'breed100',changeText:'Bred 100 offspring',watch:'bars',
     explain:'Every daughter gets her father’s Xᴿ, so she has red eyes (half are carriers). Sons get their only X from their mother: half get Xʳ and have white eyes.'},
    {lvl:'honors',q:'You cross a red snapdragon (CᴿCᴿ) with a white one (CᵂCᵂ). What color are the offspring?',choices:['All red','All pink','Half red, half white','All white'],correct:1,
     baseline:{mode:'incomplete',p1i:'RR',p2i:'WW'},changeAction:'breed20',changeText:'Bred 20 offspring',watch:'bars',
     explain:'Every offspring is CᴿCᵂ. With incomplete dominance one Cᴿ allele makes only half the red pigment, so the flowers are pink. The alleles did not blend: cross two pinks and red and white come back.'},
    {lvl:'ap',q:'You breed only 20 offspring from Pp × Pp. Will you get exactly 15 purple and 5 white?',choices:['Yes, the Punnett square guarantees it','Probably not exactly; a chi-square test tells you whether the difference is just chance'],correct:1,
     baseline:{mode:'mono',p1m:'Pp',p2m:'Pp'},changeAction:'breed20',changeText:'Bred 20 offspring',watch:'bars',
     explain:'Each offspring is an independent random event, so exactly 15:5 happens only about 20% of the time. With df = 1, a χ² below 3.84 means the deviation is small enough to be chance (p > 0.05). Check the readout.'},
    {lvl:'ap',q:'Body color and wing shape genes are 17 map units apart. In a testcross of BV/bv × bv/bv, about what percent of offspring will be recombinant (gray vestigial or black normal)?',choices:['About 50%','About 17%','About 83%','None'],correct:1,
     baseline:{mode:'linked',rf:17},changeAction:'breed100',changeText:'Bred 100 offspring',watch:'bars',
     explain:'Map distance is defined by recombination: 17 map units means crossing over separates the genes in about 17% of gametes. The other 83% carry the parental combinations, BV or bv. Unlinked genes would give 50%.'},
    {lvl:'ap',q:'You breed 100 offspring from YyRr × YyRr and test them against 9:3:3:1 (df = 3, critical value 7.81). What will the test usually conclude?',choices:['The data fit 9:3:3:1','The data do not fit, so the genes must be linked'],correct:0,
     baseline:{mode:'di',p1d:'YyRr',p2d:'YyRr'},changeAction:'breed100',changeText:'Bred 100 offspring',watch:'bars',
     explain:'These genes really do sort independently, so χ² is usually well below 7.81. About 1 time in 20 it will land above 7.81 by chance alone. That is exactly what p = 0.05 means.'}
  ]
};
delete CROSS.game; /* the Breed the target game is held back until it is approved for students */
BioLab.register(CROSS);
})();
