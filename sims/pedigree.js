(function(){
'use strict';
const {rr,txt,atLeast,PAL,FONT}=BioLab.h;

/* ---------------- inheritance modes ---------------- */
const MODES=[{k:'AD',l:'Autosomal dominant',lvl:'bio'},{k:'AR',l:'Autosomal recessive',lvl:'bio'},{k:'XR',l:'X-linked recessive',lvl:'honors'},{k:'XD',l:'X-linked dominant',lvl:'ap'},{k:'MT',l:'Mitochondrial',lvl:'ap'}];
const NAME=k=>MODES.find(m=>m.k===k).l;
const LNAME=k=>{const n=NAME(k);return n[0]==='X'?n:n[0].toLowerCase()+n.slice(1);};
const modesFor=()=>MODES.filter(m=>atLeast(m.lvl));
const AFF={AD:(g)=>g>=1,AR:(g)=>g===2,XR:(g,s)=>s==='M'?g===1:g===2,XD:(g)=>g>=1,MT:(g)=>g===1};
// child genotype distribution: g counts trait alleles (X-linked males 0/1, mitochondria 0/1)
function trans(mode,gm,gf,sex){
  if(mode==='AD'||mode==='AR'){const pm=gm/2,pf=gf/2;return [[0,(1-pm)*(1-pf)],[1,pm*(1-pf)+(1-pm)*pf],[2,pm*pf]];}
  if(mode==='XR'||mode==='XD'){const pm=gm/2;return sex==='M'?[[0,1-pm],[1,pm]]:[[gf,1-pm],[gf+1,pm]];}
  return [[gm,1]];}
// Rare-trait assumptions: affected people are heterozygous where possible; people who marry in carry no trait allele.
function founderPrior(mode,p){let l;
  if(mode==='AD')l=p.aff?[1]:[0];else if(mode==='AR')l=p.aff?[2]:[0,1];
  else if(mode==='XR')l=p.sex==='M'?(p.aff?[1]:[0]):(p.aff?[2]:[0,1]);
  else l=p.aff?[1]:[0];
  return l.map(g=>[g,1/l.length]);}
function inlawPrior(mode,p){if(!p.aff)return [[0,1]];if(mode==='AR'||(mode==='XR'&&p.sex==='F'))return [[2,1]];return [[1,1]];}
function gname(mode,g,sex){
  if(mode==='AD')return ['aa','Aa','AA'][g];if(mode==='AR')return ['AA','Aa','aa'][g];
  if(mode==='XR')return sex==='M'?['XᴬY','XᵃY'][g]:['XᴬXᴬ','XᴬXᵃ','XᵃXᵃ'][g];
  if(mode==='XD')return sex==='M'?['XᵃY','XᴬY'][g]:['XᵃXᵃ','XᴬXᵃ','XᴬXᴬ'][g];
  return g?'trait mitochondria':'normal mitochondria';}
function pickW(list){let r=Math.random();for(const [g,p] of list){if(r<p)return g;r-=p;}return list[list.length-1][0];}
const R=n=>Math.floor(Math.random()*n);
const FOUNDERS={AD:()=>{const r=Math.random();return r<.4?[1,0]:r<.8?[0,1]:[1,1];},AR:()=>{const r=Math.random();return r<.6?[1,1]:r<.8?[2,1]:[1,2];},
  XR:()=>{const r=Math.random();return r<.6?[0,1]:r<.85?[1,1]:[1,0];},XD:()=>Math.random()<.5?[1,0]:[0,1],MT:()=>[Math.random()<.3?1:0,1]};
const ROMAN=['','I','II','III'],YS=[0,78,212,346],SZ=17;

function buildFamily(truth){const P=[],add=o=>{o.i=P.length;P.push(o);return o.i;};
  const I1=add({gen:1,sex:'M'}),I2=add({gen:1,sex:'F'});const fg=FOUNDERS[truth]();P[I1].g=fg[0];P[I2].g=fg[1];
  const n2=3+R(2);let sx;do{sx=Array.from({length:n2},()=>Math.random()<.5?'M':'F');}while(!sx.includes('M')||!sx.includes('F'));
  const kids=sx.map(s=>add({gen:2,sex:s,father:I1,mother:I2,g:pickW(trans(truth,P[I2].g,P[I1].g,s))}));
  const males=kids.filter(i=>P[i].sex==='M'),fem=kids.filter(i=>P[i].sex==='F'),A=males[R(males.length)],B=fem[R(fem.length)];
  const inG=()=>truth==='AD'&&Math.random()<.15?1:0;
  const sA=add({gen:2,sex:'F',inlaw:true,g:inG()}),sB=add({gen:2,sex:'M',inlaw:true,g:inG()});
  const couples=[{f:I1,m:I2,kids},{f:A,m:sA,kids:[]},{f:sB,m:B,kids:[]}];
  [1,2].forEach(ci=>{const c=couples[ci],n=2+R(3);for(let j=0;j<n;j++){const s=Math.random()<.5?'M':'F';c.kids.push(add({gen:3,sex:s,father:c.f,mother:c.m,g:pickW(trans(truth,P[c.m].g,P[c.f].g,s))}));}});
  P.forEach(p=>{p.aff=AFF[truth](p.g,p.sex);});
  const fam={P,couples,core:[I1,I2,A,sA,B,sB],A,B,sA,sB,kids2:kids};layout(fam);return fam;}
function layout(fam){const P=fam.P;const row=[];fam.kids2.forEach(i=>{row.push(i);if(i===fam.A)row.push(fam.sA);if(i===fam.B)row.push(fam.sB);});
  const n=row.length;row.forEach((i,j)=>{P[i].x=90+j*(620/(n-1));P[i].y=YS[2];});P[0].x=345;P[1].x=455;P[0].y=P[1].y=YS[1];
  const groups=[1,2].map(ci=>{const c=fam.couples[ci],mid=(P[c.f].x+P[c.m].x)/2,k=c.kids.length;return {c,mid,xs:c.kids.map((_,j)=>mid+(j-(k-1)/2)*60)};}).sort((a,b)=>a.mid-b.mid);
  const gap=groups[1].xs[0]-groups[0].xs[groups[0].xs.length-1];if(gap<64){const sh=(64-gap)/2;groups[0].xs=groups[0].xs.map(x=>x-sh);groups[1].xs=groups[1].xs.map(x=>x+sh);}
  const lo=40-Math.min(groups[0].xs[0],0)-0,minx=groups[0].xs[0],maxx=groups[1].xs[groups[1].xs.length-1];let dx=0;if(minx<40)dx=40-minx;if(maxx+dx>760)dx=760-maxx;
  groups.forEach(g=>g.c.kids.forEach((i,j)=>{P[i].x=g.xs[j]+dx;P[i].y=YS[3];}));
  [1,2,3].forEach(gen=>{P.filter(p=>p.gen===gen).sort((a,b)=>a.x-b.x).forEach((p,j)=>{p.id=ROMAN[gen]+'-'+(j+1);});});}

/* Likelihood of the shaded pattern under a mode (sum over every genotype assignment), plus posteriors. */
function analyze(fam,mode){const P=fam.P,[I1,I2,A,sA,B,sB]=fam.core,ok=(i,g)=>AFF[mode](g,P[i].sex)===P[i].aff;
  const leaves=P.map(p=>p.i).filter(i=>!fam.core.includes(i));let L=0;const post=P.map(()=>({})),joint=[{},{},{}];
  for(const [g1,p1] of founderPrior(mode,P[I1]))for(const [g2,p2] of founderPrior(mode,P[I2])){
    for(const [ga,pa] of trans(mode,g2,g1,P[A].sex)){if(!pa||!ok(A,ga))continue;
      for(const [gsa,psa] of inlawPrior(mode,P[sA])){if(!ok(sA,gsa))continue;
        for(const [gb,pb] of trans(mode,g2,g1,P[B].sex)){if(!pb||!ok(B,gb))continue;
          for(const [gsb,psb] of inlawPrior(mode,P[sB])){if(!ok(sB,gsb))continue;
            const geno={};geno[I1]=g1;geno[I2]=g2;geno[A]=ga;geno[sA]=gsa;geno[B]=gb;geno[sB]=gsb;
            let w=p1*p2*pa*psa*pb*psb;const lf=[];
            for(const i of leaves){const p=P[i],d=trans(mode,geno[p.mother],geno[p.father],p.sex).filter(([g,q])=>q>0&&ok(i,g)),S=d.reduce((a,b)=>a+b[1],0);if(!S){w=0;break;}w*=S;lf.push([i,d,S]);}
            if(!w)continue;L+=w;
            fam.core.forEach(i=>{post[i][geno[i]]=(post[i][geno[i]]||0)+w;});
            lf.forEach(([i,d,S])=>d.forEach(([g,q])=>{post[i][g]=(post[i][g]||0)+w*q/S;}));
            fam.couples.forEach((c,ci)=>{const key=geno[c.f]+','+geno[c.m];joint[ci][key]=(joint[ci][key]||0)+w;});}}}}}
  if(L>0){post.forEach(o=>{for(const g in o)o[g]/=L;});joint.forEach(o=>{for(const g in o)o[g]/=L;});}
  return {L,post,joint};}

/* ---------------- clues ---------------- */
function clues(fam){const P=fam.P,C=fam.couples,nm=i=>P[i].id,his=i=>P[i].sex==='M'?'his':'her',find=(c,fn)=>c.kids.find(fn);
  const W={
    bothUnaff(){for(const c of C)if(!P[c.f].aff&&!P[c.m].aff){const k=find(c,i=>P[i].aff);if(k!==undefined)return {key:k,text:`${nm(c.f)} and ${nm(c.m)} are both unaffected, but their child ${nm(k)} is affected. A dominant trait can’t skip a generation like that, so the trait is recessive.`};}return null;},
    bothAff(){for(const c of C)if(P[c.f].aff&&P[c.m].aff){const k=find(c,i=>!P[i].aff);if(k!==undefined)return {key:k,text:`${nm(c.f)} and ${nm(c.m)} both have the trait, but their child ${nm(k)} does not. If it were recessive, both parents could pass on only the recessive allele and every child would be affected.`};}return null;},
    inlawAR(){for(const c of C){const pa=[c.f,c.m].find(i=>P[i].inlaw&&!P[i].aff);if(pa===undefined)continue;const k=find(c,i=>P[i].aff);if(k!==undefined)return {key:k,text:`${nm(k)} is affected, but ${his(k)} parent ${nm(pa)} married into the family and is unaffected. A rare recessive trait would need ${nm(pa)} to be a carrier too, which is very unlikely, so it isn’t autosomal recessive.`};}return null;},
    xrDaughter(){for(const c of C)if(!P[c.f].aff){const k=find(c,i=>P[i].sex==='F'&&P[i].aff);if(k!==undefined)return {key:k,text:`${nm(k)} is affected, but her father ${nm(c.f)} is not. A daughter with an X-linked recessive trait needs the allele on her father’s X too, so it isn’t X-linked recessive.`};}return null;},
    xrSon(){for(const c of C)if(P[c.m].aff){const k=find(c,i=>P[i].sex==='M'&&!P[i].aff);if(k!==undefined)return {key:k,text:`${nm(c.m)} is affected, but her son ${nm(k)} is not. Every son of a woman with an X-linked recessive trait inherits it, so it isn’t X-linked recessive.`};}return null;},
    sonInlawMom(){for(const c of C)if(P[c.m].inlaw&&!P[c.m].aff){const k=find(c,i=>P[i].sex==='M'&&P[i].aff);if(k!==undefined)return {key:k,text:`${nm(k)} is affected, but his mother ${nm(c.m)} married into the family and is unaffected. A son’s only X comes from his mother, so the trait can’t be X-linked here.`};}return null;},
    fatherSon(inlawOnly){for(const c of C)if(P[c.f].aff&&!P[c.m].aff&&(!inlawOnly||P[c.m].inlaw)){const k=find(c,i=>P[i].sex==='M'&&P[i].aff);if(k!==undefined)return {key:k,text:`${nm(c.f)} passed the trait to his son ${nm(k)}, and the mother ${nm(c.m)} is unaffected. Fathers give sons a Y chromosome and no mitochondria, so the gene must be on an autosome.`};}return null;},
    xdFather(){for(const c of C)if(P[c.f].aff){const k=find(c,i=>P[i].sex==='F'&&!P[i].aff);if(k!==undefined)return {key:k,text:`${nm(c.f)} is affected, but his daughter ${nm(k)} is not. A father passes his X to every daughter, so an X-linked dominant trait would affect all of them.`};}return null;},
    xdSon(){for(const c of C)if(!P[c.m].aff){const k=find(c,i=>P[i].sex==='M'&&P[i].aff);if(k!==undefined)return {key:k,text:`${nm(k)} is affected, but his mother ${nm(c.m)} is not. A son gets his X only from his mother, so it can’t be X-linked dominant.`};}return null;},
    mt0(){for(const c of C)if(!P[c.m].aff){const k=find(c,i=>P[i].aff);if(k!==undefined)return {key:k,text:`${nm(k)} is affected, but ${his(k)} mother ${nm(c.m)} is not. Children get their mitochondria only from their mother, so it can’t be mitochondrial.`};}return null;},
    mt1(){for(const c of C)if(P[c.m].aff){const k=find(c,i=>!P[i].aff);if(k!==undefined)return {key:k,text:`${nm(c.m)} is affected, but her child ${nm(k)} is not. A mother passes her mitochondria to all of her children, so it can’t be mitochondrial.`};}return null;}};
  return {AD:[W.bothUnaff],AR:[W.bothAff,W.inlawAR],XR:[W.xrDaughter,W.xrSon,()=>W.fatherSon(true),W.sonInlawMom],XD:[W.xdFather,W.xdSon,W.bothUnaff],MT:[W.mt0,W.mt1,()=>W.fatherSon(false)],W};}
function probClue(fam,truth,comp){const P=fam.P,C=fam.couples,nm=i=>P[i].id;
  if(truth==='XD'){const c=C.find(c=>P[c.f].aff&&c.kids.length>=2&&c.kids.some(i=>P[i].sex==='F')&&c.kids.every(i=>P[i].aff===(P[i].sex==='F')));
    if(c)return {key:c.f,text:`Every daughter of ${nm(c.f)} is affected and none of his sons are. A father passes his X only to his daughters; an autosomal trait would show up in his sons and daughters about equally.`};}
  if(truth==='MT'){const c=C.find(c=>P[c.m].aff&&c.kids.length>=2&&c.kids.every(i=>P[i].aff));const noDad=C.every(c=>!P[c.f].aff||P[c.m].aff||c.kids.every(i=>!P[i].aff));
    if(c&&noDad)return {key:c.m,text:`Every child of ${nm(c.m)} is affected, but affected fathers never pass the trait on. Only mothers pass it down, which is the mitochondrial pattern.`};}
  if(truth==='XR'&&P.every(p=>!p.aff||p.sex==='M')){const k=P.find(p=>p.aff&&p.gen>1)||P.find(p=>p.aff);return {key:k.i,text:`Only males are affected, and they get it through unaffected mothers. That is the classic X-linked recessive pattern; an autosomal recessive trait would turn up in daughters too.`};}
  const k=P.find(p=>p.aff&&p.gen===3)||P.find(p=>p.aff);
  return {key:k.i,text:`This pattern is far more likely under ${LNAME(truth)} inheritance than ${LNAME(comp)}.`};}
function clueFor(fam,truth,comp,Lc){const ex=clues(fam)[comp];for(const f of ex){const r=f();if(r)return r;}
  if(Lc>0)return probClue(fam,truth,comp);return {key:null,text:`No combination of genotypes fits ${LNAME(comp)} inheritance in this family.`};}

/* ---------------- family generation ---------------- */
let VER=0;
function generate(sim){const choices=modesFor().map(m=>m.k),truth=choices[Math.floor(Math.random()*choices.length)];let best=null,bestR=-1;
  for(let t=0;t<4000;t++){const fam=buildFamily(truth),na=fam.P.filter(p=>p.aff).length;if(na<2||na>fam.P.length*.62)continue;if(!fam.P.some(p=>p.aff&&p.gen>1))continue;
    const L={};choices.forEach(c=>{L[c]=analyze(fam,c).L;});if(!(L[truth]>0))continue;
    let r=Infinity,soft=false;choices.forEach(c=>{if(c!==truth&&L[c]>0){r=Math.min(r,L[truth]/L[c]);if(!((truth==='XD'||truth==='MT')&&c==='AD'&&!/far more likely/.test(probClue(fam,truth,c).text)))soft=true;}});
    if(soft)r=Math.min(r,1);
    if(r>=12){best=fam;best.L=L;break;}if(r>bestR){bestR=r;best=fam;best.L=L;}}
  best.truth=truth;best.choices=choices;best.an=analyze(best,truth);best.ver=++VER;best.sel=0;best.revealed=false;sim.fam=best;
  if(sim.ui&&sim.ui.ctl&&sim.ui.ctl.person){sim.p.person='I-1';sim.ui.ctl.person.set('I-1');}
  sim.infoDirty=true;return best;}
const fam=sim=>sim.fam||generate(sim);

/* ---------------- questions for this family ---------------- */
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function buildChallenges(f){const P=f.P,T=f.truth,nm=i=>P[i].id,an=f.an,list=[];
  const PRI={AR:['XR','AD','MT','XD'],XR:['AR','AD','XD','MT'],AD:['XD','AR','MT','XR'],XD:['AD','XR','AR','MT'],MT:['AD','XD','AR','XR']},pi=c=>PRI[T].indexOf(c);
  const comps=f.choices.filter(c=>c!==T).sort((a,b)=>(f.L[b]-f.L[a])||(pi(a)-pi(b))),cl=comps.map(c=>({c,cl:clueFor(f,T,c,f.L[c])}));
  // Q1: the pattern
  const q1x='<b>'+NAME(T)+'.</b> '+cl.slice(0,2).map(x=>x.cl.text).join(' ');
  list.push({lvl:'bio',instant:true,reveals:true,q:'Which inheritance pattern fits this family?',choices:f.choices.map(NAME),correct:f.choices.indexOf(T),explain:q1x});
  // Q2: dominant or recessive (or who passes it on)
  const W=clues(f).W;
  if(T==='MT')list.push({lvl:'bio',instant:true,q:'Who passes this trait on to their children?',choices:['Only mothers','Only fathers','Both mothers and fathers'],correct:0,explain:'Only mothers. Children get all their mitochondria from the egg, so an affected mother passes the trait to every child and an affected father passes it to none.'});
  else{const dom=T==='AD'||T==='XD',w=dom?(W.bothAff()||W.inlawAR()):W.bothUnaff();
    list.push({lvl:'bio',instant:true,q:'Is the allele for this trait dominant or recessive?',choices:['Dominant','Recessive'],correct:dom?0:1,
      explain:(w?w.text:(dom?'Every affected person has an affected parent, so the trait never skips a generation. That points to a dominant allele.':'The trait skips generations: affected people can have unaffected parents, who must be carriers. That points to a recessive allele.'))});}
  // Q3 (honors): chance for another child
  const clean={0:'0%',0.25:'25%',0.5:'50%',1:'100%'},vals=[0,.25,.5,1];let cand=[];
  f.couples.forEach((c,ci)=>['F','M'].forEach(sex=>{let pa=0;for(const key in an.joint[ci]){const [gf,gm]=key.split(',').map(Number),w=an.joint[ci][key];trans(T,gm,gf,sex).forEach(([g,q])=>{if(AFF[T](g,sex))pa+=w*q;});}
    const v=vals.find(v=>Math.abs(v-pa)<.004);if(v!==undefined)cand.push({c,sex,v,ci,keys:Object.keys(an.joint[ci]).filter(k=>an.joint[ci][k]>1e-9)});}));
  cand.sort((a,b)=>((b.v===.25||b.v===.5)-(a.v===.25||a.v===.5))||((b.v===1)-(a.v===1)));
  if(cand.length){const q=cand[0],kid=q.sex==='M'?'son':'daughter',pr=q.sex==='M'?'he':'she';let why;
    if(T==='MT')why=`Every child gets mitochondria only from the mother. ${nm(q.c.m)} ${P[q.c.m].aff?'has':'does not have'} the trait, so the chance for a ${kid} is ${clean[q.v]}.`;
    else if(q.keys.length===1){const [gf,gm]=q.keys[0].split(',').map(Number);why=`${nm(q.c.f)} is ${gname(T,gf,'M')} and ${nm(q.c.m)} is ${gname(T,gm,'F')}${T==='MT'?'':' (from the shading)'}, so the chance for a ${kid} is ${clean[q.v]}.`;}
    else why=`Their genotypes aren’t certain, but adding up every possibility the shading allows gives ${clean[q.v]} for a ${kid}.`;
    list.push({lvl:'honors',instant:true,q:`If ${nm(q.c.f)} and ${nm(q.c.m)} have another ${kid}, what is the chance ${pr} will have the trait?`,choices:vals.map(v=>clean[v]),correct:vals.indexOf(q.v),explain:why});}
  // Q4 (honors): the transmission rule for this pattern
  const RULE={AD:{q:'With this trait, can two unaffected parents have an affected child?',choices:['Yes, if both are carriers','No, unless a new mutation happens'],correct:1,explain:'A dominant allele shows whenever it is present. Unaffected parents have no copy to pass on.'},
    AR:{q:'With this trait, can two unaffected parents have an affected child?',choices:['Yes, if both are carriers','No, unless a new mutation happens'],correct:0,explain:'Carriers have one recessive allele and look unaffected. Two carriers have a 1 in 4 chance of an affected child each time.'},
    XR:{q:'Can a father with this trait pass it to his son?',choices:['Yes','No'],correct:1,explain:'A father gives his son a Y chromosome, not his X, so X-linked traits never pass from father to son. He passes the allele to all his daughters, who become carriers.'},
    XD:{q:'A father with this trait has a daughter. Will she have it?',choices:['Always','About half the time','Never'],correct:0,explain:'A father passes his only X to every daughter, and one dominant allele is enough. His sons get his Y and are unaffected.'},
    MT:{q:'Can a father with this trait pass it to his children?',choices:['Yes, to all of them','Yes, to about half','No'],correct:2,explain:'Sperm contribute essentially no mitochondria, so the father’s mitochondria are not passed on.'}};
  list.push(Object.assign({lvl:'honors',instant:true},RULE[T]));
  // Q5 (AP): carrier probability or genotype
  if(T==='AR'||T==='XR'){const fr=[0,.5,2/3,1],lab=['0','1/2','2/3','1'];let best=null;
    P.forEach(p=>{if(p.aff||p.inlaw)return;if(T==='XR'&&p.sex==='M')return;const pc=an.post[p.i][1]||0,j=fr.findIndex(v=>Math.abs(v-pc)<.01);if(j<1)return;const pri=j===2?3:j===1?2:1;if(!best||pri>best.pri)best={p,j,pri};});
    if(best){const why={1:T==='XR'?`${best.p.id}’s mother is a carrier, so ${best.p.id} has a 1 in 2 chance of getting her Xᵃ.`:`One of ${best.p.id}’s parents is a carrier and the other almost certainly is not, so the chance is 1 in 2.`,
        2:`${best.p.id}’s parents must both be carriers (Aa × Aa). Among their unaffected children, AA : Aa is 1 : 2, so the chance is 2/3.`,
        3:T==='XR'?`${best.p.id} must be a carrier: she has an affected son or an affected father, and a son gets his X from his mother while a daughter always gets her father’s X.`:`${best.p.id} must be a carrier: an affected child needs a recessive allele from each parent.`}[best.j];
      list.push({lvl:'ap',instant:true,q:`${best.p.id} is unaffected. What is the probability that ${best.p.sex==='M'?'he':'she'} is a carrier?`,choices:lab,correct:best.j,explain:why});}}
  else if(T==='MT'){const m=P.find(p=>p.sex==='F'&&p.aff);list.push({lvl:'ap',instant:true,q:`What fraction of ${m.id}’s children will inherit the trait?`,choices:['None','About half','All of them'],correct:2,explain:'Every child gets mitochondria only from the mother’s egg, so all of an affected mother’s children inherit them. (Real mitochondrial diseases can vary in severity, because cells can hold a mix of normal and mutant mitochondria.)'});}
  else{const het=p=>p.aff&&(T==='AD'||p.sex==='F')&&(an.post[p.i][1]||0)>.999;const p=P.find(p=>het(p)&&!p.inlaw&&p.gen>1&&[p.father,p.mother].some(i=>i!==undefined&&!P[i].aff))||P.find(het);if(p){
    const opts=T==='AD'?['AA','Aa','aa']:['XᴬXᴬ','XᴬXᵃ','XᵃXᵃ'],ans=T==='AD'?1:1;
    list.push({lvl:'ap',instant:true,q:`What is ${p.id}’s genotype? (A is the trait allele.)`,choices:opts,correct:ans,explain:`${p.id} is affected, so ${p.sex==='M'?'he':'she'} has at least one A. ${p.father!==undefined&&[p.father,p.mother].some(i=>!P[i].aff)?'One parent is unaffected and has no A to give, so '+p.id+' must be heterozygous.':'For a rare trait, affected people are almost always heterozygous.'}`});}}
  // Q6 (AP): which person is the decisive clue
  const withKey=cl.find(x=>x.cl.key!==null&&x.cl.key!==undefined);
  if(withKey){const key=withKey.cl.key,others=shuffle(P.map(p=>p.i).filter(i=>i!==key)).slice(0,2),opts=shuffle([key,...others]);
    list.push({lvl:'ap',instant:true,q:`Whose family relationships best rule out ${LNAME(withKey.c)} inheritance? Click people in the pedigree to inspect them first.`,choices:opts.map(nm),correct:opts.indexOf(key),explain:withKey.cl.text});}
  return list;}

const PED={
  id:'pedigree',hash:'pedigree',apUnit:5,order:2,tab:'Pedigree detective',kind:'Learning tool',
  card:'Read a family tree like a geneticist. Find the clue that reveals how a trait is inherited.',
  title:'Pedigree detective: how is this trait inherited?',
  lede:{bio:'Each new family hides one inheritance pattern. Read the symbols, find the clue, and decide whether the trait is dominant or recessive.',
        honors:'Now the trait could also be X-linked recessive. Use who is affected, and which parent they got it from, to crack the case.',
        ap:'Five possible patterns, including X-linked dominant and mitochondrial. Work out genotypes and carrier probabilities from the shading.'},
  scale:'Real scale: three generations of one family, roughly 60 years of history.',
  timeless:true,graph:false,trials:false,
  controls:[{id:'person',label:'Inspect a person',type:'select',def:'I-1',lvl:'bio',noTrial:true,help:'Or click a symbol in the pedigree.',
    options:['I-1','I-2','II-1','II-2','II-3','II-4','II-5','II-6','III-1','III-2','III-3','III-4','III-5','III-6','III-7','III-8'].map(v=>({v,l:v})),
    onChange(sim){const f=fam(sim),p=f.P.find(p=>p.id===sim.p.person);f.sel=p?p.i:-1;}}],
  actions:[{id:'newfam',label:'New family',primary:true,run(sim){generate(sim);if(sim.ui&&sim.ui.sec&&BioLab.gotoChallenge)BioLab.gotoChallenge(sim,0);}}],
  init(sim){fam(sim);return {};},step(){},
  onLevel(sim){generate(sim);},
  challenges(sim){const f=fam(sim),key=BioLab.level+':'+f.ver;if(f.chKey!==key){f.chKey=key;f.chList=buildChallenges(f);}return f.chList;},
  challengeTitle:'Solve the case',
  onChallenge(sim,ch,phase){if(phase==='done'&&ch.reveals){fam(sim).revealed=true;sim.infoDirty=true;}},
  onClick(sim,x,y){const f=fam(sim);let best=-1,bd=30;f.P.forEach(p=>{const d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;best=p.i;}});if(best>=0)BioLab.setValues(sim,{person:f.P[best].id});},
  infoPanel(sim){const f=fam(sim),p=f.P[f.sel];if(!p)return '<h3>No one with that label</h3><p>This family is smaller. Pick another person or click a symbol.</p>';
    const P=f.P,rel=p.inlaw?'Married into the family, so assume they don’t carry this rare allele.':p.gen===1?'Grandparent: the top of this family.':`Child of ${P[p.father].id} and ${P[p.mother].id}.`;
    const kids=f.couples.filter(c=>c.f===p.i||c.m===p.i).flatMap(c=>c.kids).map(i=>P[i].id+(P[i].aff?' (affected)':''));
    let h=`<h3>${p.id}</h3><p>${p.sex==='M'?'Male':'Female'} · <b>${p.aff?'has the trait':'does not have the trait'}</b></p><p>${rel}</p>${kids.length?`<p>Children: ${kids.join(', ')}</p>`:''}`;
    if(!f.revealed)h+='<p class="help">Answer “Which inheritance pattern fits this family?” to see this person’s possible genotypes.</p>';
    else if(atLeast('honors')){const po=f.an.post[p.i],gs=Object.keys(po).filter(g=>po[g]>1e-6).sort();
      h+=`<p><b>Possible genotypes</b> (${LNAME(f.truth)}): ${gs.map(g=>gname(f.truth,+g,p.sex)+(atLeast('ap')?' '+(po[g]>.999?'100%':(po[g]*100).toFixed(0)+'%'):'')).join(', ')}</p>`;}
    else h+=`<p>The trait is <b>${LNAME(f.truth)}</b>.</p>`;
    return h;},
  narrate(sim){const f=fam(sim),P=f.P,na=P.filter(p=>p.aff).length,p=P[f.sel];
    let t=`This family has ${P.length} people in three generations, and <b>${na} have the trait</b> (shaded).`;
    if(f.revealed)t+=` It is <b>${LNAME(f.truth)}</b>.`+(atLeast('honors')?' Half-shaded symbols and dots mark people who must be carriers.':'');
    else if(!atLeast('honors'))t+=' Look for two unaffected parents with an affected child, or two affected parents with an unaffected child.';
    else t+=' Check who passes the trait to whom: father to son, mother to son, or only through mothers.';
    return t;},
  thumbSetup(){},thumbFrames:1,
  draw(sim,ctx,vdt,k){const f=fam(sim),P=f.P,ink=PAL['cv-ink'],hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    [1,2,3].forEach(g=>txt(ctx,ROMAN[g],22,YS[g]+6,{s:18*k,w:700,c:PAL['cv-soft'],a:'center'}));
    ctx.strokeStyle=ink;ctx.lineWidth=2;
    // couples and descent lines
    f.couples.forEach((c,ci)=>{const a=P[c.f],b=P[c.m],y=a.y,l=Math.min(a.x,b.x),r=Math.max(a.x,b.x),mid=(a.x+b.x)/2,sy=YS[a.gen+1]-52;
      ctx.beginPath();ctx.moveTo(l+SZ,y);ctx.lineTo(r-SZ,y);ctx.moveTo(mid,y);ctx.lineTo(mid,sy);
      const xs=c.kids.map(i=>P[i].x);const lo=Math.min(mid,...xs),hi=Math.max(mid,...xs);ctx.moveTo(lo,sy);ctx.lineTo(hi,sy);
      c.kids.forEach(i=>{ctx.moveTo(P[i].x,sy);ctx.lineTo(P[i].x,P[i].y-SZ);});ctx.stroke();});
    // carriers (after the answer, honors+)
    const carrier=p=>{if(!f.revealed||!hon||p.aff)return false;const pc=f.an.post[p.i][1]||0;return (f.truth==='AR'||(f.truth==='XR'&&p.sex==='F'))&&pc>.999;};
    P.forEach(p=>{const x=p.x,y=p.y;ctx.beginPath();if(p.sex==='M')ctx.rect(x-SZ,y-SZ,SZ*2,SZ*2);else ctx.arc(x,y,SZ,0,6.29);
      ctx.fillStyle=p.aff?ink:PAL['card'];ctx.fill();ctx.lineWidth=2.2;ctx.strokeStyle=ink;ctx.stroke();
      if(carrier(p)){ctx.save();ctx.beginPath();if(p.sex==='M')ctx.rect(x-SZ,y-SZ,SZ,SZ*2);else{ctx.moveTo(x,y-SZ);ctx.arc(x,y,SZ,-Math.PI/2,Math.PI/2,true);ctx.closePath();}
        if(f.truth==='XR'){ctx.beginPath();ctx.arc(x,y,5.5,0,6.29);}ctx.fillStyle=ink;ctx.fill();ctx.restore();}
      if(p.i===f.sel){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,SZ+6,0,6.29);ctx.stroke();ctx.strokeStyle=ink;}
      txt(ctx,p.id,x,y+SZ+22,{s:12.5*k,w:p.i===f.sel?700:400,c:p.i===f.sel?PAL['cv-ink']:PAL['cv-soft'],a:'center'});});
    // legend
    const items=['male','female','has the trait'];ctx.font='400 '+12*k+'px '+FONT;let lx=786-items.reduce((a,l)=>a+ctx.measureText(l).width+30,0);const ly=436,item=(draw,label)=>{draw(lx,ly-5);txt(ctx,label,lx+12,ly,{s:12*k,c:PAL['cv-soft']});ctx.font='400 '+12*k+'px '+FONT;lx+=ctx.measureText(label).width+30;};
    ctx.lineWidth=1.6;ctx.strokeStyle=ink;
    item((x,y)=>{ctx.fillStyle=PAL['card'];ctx.fillRect(x-5,y-5,10,10);ctx.strokeRect(x-5,y-5,10,10);},'male');
    item((x,y)=>{ctx.fillStyle=PAL['card'];ctx.beginPath();ctx.arc(x,y,5.5,0,6.29);ctx.fill();ctx.stroke();},'female');
    item((x,y)=>{ctx.fillStyle=ink;ctx.fillRect(x-5,y-5,10,10);},'has the trait');
    txt(ctx,f.revealed?'Answer: '+NAME(f.truth):'Hidden pattern: ?',16,24,{s:14*k,w:700,c:f.revealed?PAL['rj']:PAL['cv-soft']});},
  tour:[
    {title:'Generations',text:'A pedigree is a family tree for one trait. Each row is a generation, numbered with Roman numerals: grandparents (I) at the top, grandchildren (III) at the bottom.',focus:[6,40,40,340],pause:true},
    {title:'Males, females and couples',text:'Squares are males and circles are females. A horizontal line joining two people means they are a couple. People are named by generation and position, like II-3.',focus:sim=>{const P=fam(sim).P;return [P[0].x-34,P[0].y-28,P[1].x-P[0].x+68,72];},pause:true},
    {title:'Children',text:'A vertical line drops from each couple to a horizontal line, and their children hang below it, oldest on the left.',focus:sim=>{const P=fam(sim).P;return [40,YS[1]+20,740,YS[2]+44-YS[1]-20];},pause:true},
    {title:'Shaded means affected',text:'Shaded symbols are people who have the trait. Open symbols do not. Everything you need is in the pattern of shading.',focus:sim=>fam(sim).P.filter(p=>p.aff).map(p=>[p.x-26,p.y-26,52,52]),pause:true},
    {title:'People who married in',text:'Symbols with no parents drawn married into the family. For a rare trait, assume they don’t carry the allele unless they are shaded.',focus:sim=>{const f=fam(sim);return [f.sA,f.sB].map(i=>[f.P[i].x-26,f.P[i].y-26,52,52]);},pause:true},
    {title:'Look for the decisive clue',text:{bio:'Two unaffected parents with an affected child means recessive. Two affected parents with an unaffected child means dominant. An affected child with an unaffected parent who married in usually rules out recessive.',honors:'Unaffected parents with an affected child: recessive. Affected parents with an unaffected child: dominant. Mostly males affected, never passed father to son: think X-linked recessive.'},focus:[50,40,740,360],pause:true},
    {lvl:'honors',title:'Carriers',text:'A carrier has one copy of a recessive allele but no trait. After you answer, people who must be carriers are half-shaded (autosomal) or marked with a dot (X-linked carrier females).',focus:[50,40,740,360],pause:true},
    {lvl:'ap',title:'Two more patterns',text:'X-linked dominant: an affected father passes it to every daughter and no sons. Mitochondrial: affected mothers pass it to every child, and affected fathers to none.',focus:[50,40,740,360],pause:true}
  ],
  terms:[{t:'Pedigree',d:'A family tree that shows who has a trait across generations.'},{t:'Affected',d:'Has the trait (shaded symbol).'},{t:'Dominant / recessive',d:'A dominant allele shows with one copy; a recessive allele needs two.'},{t:'Autosomal',d:'On one of the 22 non-sex chromosomes, so males and females inherit it the same way.'},{t:'Carrier',d:'Has one recessive allele but does not show the trait.'},
    {lvl:'honors',t:'X-linked',d:'On the X chromosome. Males have one X, so one recessive allele shows in sons.'},{lvl:'honors',t:'Obligate carrier',d:'Someone who must be a carrier because of their parents or children.'},
    {lvl:'ap',t:'X-linked dominant',d:'Affected fathers pass it to all daughters and no sons.'},{lvl:'ap',t:'Mitochondrial inheritance',d:'Passed only from mothers, through the mitochondria in the egg.'},{lvl:'ap',t:'Penetrance',d:'The share of people with the genotype who actually show the trait. This simulation assumes 100%.'}],
  about:'<p>Each family is made by simulating inheritance under one hidden pattern: random founders, then each child gets alleles from their parents by Mendel’s rules. The program then adds up the probability of the shading under every candidate pattern and keeps only families where the true pattern is at least 12 times more likely than any other (usually the others are impossible).</p><p>Assumptions, as in most textbook problems: the trait is rare, so people who marry in don’t carry it; affected people are heterozygous when that is possible; penetrance is 100%; and there are no new mutations.</p>'
};
BioLab.register(PED);
})();
