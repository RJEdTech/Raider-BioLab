(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,lvText,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;

/* Cohort-component population model: single-year ages 0–100 for each sex, stepped one year at a time.
   Mortality comes from a Gompertz–Makeham schedule scaled to hit the chosen life expectancy;
   fertility is a bell curve over ages 15–49 scaled to the chosen total fertility rate (TFR). */
const AGES=101,SRB=1.05; // sex ratio at birth, boys per girl
function baseMu(x){if(x===0)return 0.025;if(x<5)return 0.0025;return 0.00035+0.000035*Math.exp(0.088*x)+(x>=15&&x<35?0.0006:0);}
const lifeCache={};
function lifeTable(e0){const key=e0.toFixed(1);if(lifeCache[key])return lifeCache[key];
  const e0of=lam=>{let l=1,T=0;const q=[];for(let x=0;x<AGES;x++){const mu=Math.min(5,baseMu(x)*(x===0?Math.pow(lam,1.15):lam));const qx=x===AGES-1?1:1-Math.exp(-mu);q.push(qx);T+=l*(1-qx*0.5);l*=1-qx;}return {e:T,q};};
  let lo=0.01,hi=80;for(let i=0;i<60;i++){const mid=Math.sqrt(lo*hi);if(e0of(mid).e>e0)lo=mid;else hi=mid;}
  const r=e0of(Math.sqrt(lo*hi));lifeCache[key]=r.q;return r.q;}
const FERT=(()=>{const f=new Array(AGES).fill(0);let sum=0;for(let x=15;x<=49;x++){f[x]=Math.exp(-Math.pow((x-27.5)/6.5,2));sum+=f[x];}return f.map(v=>v/sum);})();
/* Presets: history phases [years, TFR, e0, migration per 1000] run before year 0 to build a realistic pyramid */
const PRESETS={
  stage1:{l:'Pre-industrial village',year:1750,pop:2e6,tfr:4.7,e0:30,mig:0,hist:[[200,4.7,30,0]],stage:'Stage 1'},
  niger:{l:'Niger (today)',year:2026,pop:27e6,tfr:6.7,e0:62,mig:0,hist:[[150,7.5,38,0],[40,7.4,50,0],[20,7,58,0]],stage:'Stage 2'},
  india:{l:'India (today)',year:2026,pop:1.44e9,tfr:2.0,e0:72,mig:0,hist:[[150,5.8,40,0],[30,4.5,56,0],[25,3.2,64,0],[20,2.4,69,0]],stage:'Stage 3'},
  us:{l:'United States (today)',year:2026,pop:3.36e8,tfr:1.6,e0:79,mig:3.5,hist:[[150,4.2,48,3],[30,2.4,62,1],[19,3.5,70,1],[43,2.0,75,3],[17,1.8,78,3.5]],stage:'Stage 4'},
  japan:{l:'Japan (today)',year:2026,pop:1.24e8,tfr:1.2,e0:84.5,mig:0.3,hist:[[150,4.5,45,0],[12,3.8,60,0],[45,1.7,77,0],[30,1.35,83,0]],stage:'Stage 4–5'}};
function yearStep(st,tfr,e0,mig){const qM=lifeTable(e0-2.5),qF=lifeTable(e0+2.5);const M=st.m,F=st.f;
  let births=0;for(let x=15;x<=49;x++)births+=F[x]*FERT[x]*tfr;
  let deaths=0;const nM=new Array(AGES).fill(0),nF=new Array(AGES).fill(0);
  for(let x=AGES-1;x>=0;x--){const dm=M[x]*qM[x],df=F[x]*qF[x];deaths+=dm+df;const to=Math.min(AGES-1,x+1);nM[to]+=M[x]-dm;nF[to]+=F[x]-df;}
  const bM=births*SRB/(1+SRB),bF=births/(1+SRB);nM[0]=bM*(1-qM[0]*0.3);nF[0]=bF*(1-qF[0]*0.3);deaths+=bM*qM[0]*0.3+bF*qF[0]*0.3;
  let tot=0;for(let x=0;x<AGES;x++)tot+=M[x]+F[x];
  const net=tot*mig/1000;for(let x=20;x<35;x++){nM[x]+=net/30;nF[x]+=net/30;}
  st.m=nM;st.f=nF;st.births=births;st.deaths=deaths;st.migr=net;st.prevTot=tot;}
function total(st){let t=0;for(let x=0;x<AGES;x++)t+=st.m[x]+st.f[x];return t;}
function build(key,tfr,e0,mig){const P=PRESETS[key]||PRESETS.niger;const st={m:new Array(AGES).fill(0),f:new Array(AGES).fill(0)};
  for(let x=0;x<AGES;x++){st.m[x]=Math.exp(-0.03*x);st.f[x]=Math.exp(-0.03*x);}
  for(const ph of P.hist)for(let y=0;y<ph[0];y++){yearStep(st,ph[1],ph[2],ph[3]);const T=total(st),k=1e6/T;for(let x=0;x<AGES;x++){st.m[x]*=k;st.f[x]*=k;}}
  yearStep(st,tfr,e0,mig);const k=P.pop/total(st);for(let x=0;x<AGES;x++){st.m[x]*=k;st.f[x]*=k;}st.births*=k;st.deaths*=k;st.migr*=k;st.prevTot*=k;
  return st;}
function groups5(arr){const g=new Array(21).fill(0);for(let x=0;x<AGES;x++)g[Math.min(20,Math.floor(x/5))]+=arr[x];return g;}
function stats(st){const T=total(st);let kids=0,old=0,work=0,cum=0,med=0;const half=T/2;
  for(let x=0;x<AGES;x++){const n=st.m[x]+st.f[x];if(x<15)kids+=n;else if(x>=65)old+=n;else work+=n;if(cum<half&&cum+n>=half)med=x+(half-cum)/n;cum+=n;}
  const base=st.prevTot||T;return {T,cbr:1000*st.births/base,cdr:1000*st.deaths/base,gr:100*(T-base)/base,dep:100*(kids+old)/work,kids:100*kids/T,old:100*old/T,med};}
function stageText(sim){const s=stats(sim.st);
  if(s.cdr>=24)return 'Stage 1: high birth and death rates';
  if(s.cbr>=30)return 'Stage 2: death rate falling, birth rate high';
  if(s.cbr>=15)return 'Stage 3: birth rate falling';
  if(s.gr>-0.08)return 'Stage 4: low birth and death rates';
  return 'Stage 5: population shrinking';}
function stageNum(sim){const s=stats(sim.st);if(s.cdr>=24)return 1;if(s.cbr>=30)return 2;if(s.cbr>=15)return 3;if(s.gr>-0.08)return 4;return 5;}
function loadPreset(sim){const P=PRESETS[sim.p.preset];if(!P)return;BioLab.setValues(sim,{tfr:P.tfr,e0:P.e0,mig:P.mig});BioLab.reset(sim);}
const fmtPop=n=>n>=1e9?(n/1e9).toFixed(2)+' billion':n>=1e6?(n/1e6).toFixed(n>=1e8?0:1)+' million':Math.round(n).toLocaleString();

/* ---------- Virtual lab bench: the APES cemetery lab (Virtual lab mode; see VLAB.md) ----------
   A fictional cemetery of 12 sections. The student's group has one section of 16 headstones; the other 11 sections are
   already tallied on the class spreadsheet. Every person is drawn from a single-year life table for their sex and birth
   year, so each student's cemetery (seeded by the lab's saved seed) is different but follows the same history. */
function chr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
const CEM={ages:[0,1,5,10,15,20,30,40,50,60,70,80,90,100],secs:'ABCDEFGHIJKL',n:16,rows:10,found:1832,last:2025,restPre:66,restPost:100,name:'Larkspur Hill Cemetery'};
const cemLerp=(tab,y)=>{if(y<=tab[0][0])return tab[0][1];for(let i=1;i<tab.length;i++)if(y<=tab[i][0]){const a=tab[i-1],b=tab[i];return a[1]+(b[1]-a[1])*(y-a[0])/(b[0]-a[0]);}return tab[tab.length-1][1];};
/* Born 1880 or later: infant deaths (q0) and an adult mortality multiplier by birth cohort, after the SSA cohort life tables */
const CEM_Q0={M:[[1880,0.175],[1900,0.140],[1920,0.090],[1940,0.052],[1955,0.030]],F:[[1880,0.150],[1900,0.118],[1920,0.072],[1940,0.040],[1955,0.023]]};
const CEM_AD=[[1880,1.55],[1900,1.3],[1920,1],[1940,0.8],[1955,0.7]];
/* single-year probabilities of dying, q(x), for one sex and birth year */
function cemQ(sex,by){const q=new Array(111).fill(0),M=sex==='M';
  if(by<1880){// mid-1800s US: about 1 baby in 6 dies in its first year, a quarter of children before 5; life expectancy near 40
    q[0]=M?0.185:0.160;const ch=[0,0.046,0.031,0.023,0.017];for(let x=1;x<5;x++)q[x]=ch[x]*(M?1.04:0.96);
    for(let x=5;x<111;x++){let v=x<10?0.0075:x<15?0.0045:x<20?0.0065:x<40?0.0095:x<50?0.0095+(x-40)*0.00025:0.012*Math.exp(0.083*(x-50));
      if(!M&&x>=20&&x<40)v+=0.0018+0.0030*Math.exp(-Math.pow((x-29)/7,2)); // deaths in childbirth, and tuberculosis in young women
      if(!M&&x>=45)v*=0.94;q[x]=Math.min(1,v);}}
  else{const f=cemLerp(CEM_AD,by);q[0]=cemLerp(CEM_Q0[M?'M':'F'],by);const c=q[0]/(M?0.09:0.072);
    for(let x=1;x<5;x++)q[x]=c*[0,0.0055,0.0028,0.0021,0.0017][x]*(M?1.05:0.95);
    for(let x=5;x<111;x++){let v=x<15?0.0011:x<25?(M?0.0028:0.0015):x<45?(M?0.0030+(x-25)*0.0001:0.0018+(x-25)*0.00006):(M?0.0085*Math.exp(0.08*(x-50)):0.0050*Math.exp(0.086*(x-50)));
      if(!M&&x>=20&&x<40)v+=0.0004*Math.max(0,1-(by-1880)/70);q[x]=Math.min(1,v*f);}}
  q[110]=1;return q;}
const cemLC={};
function cemL(sex,by){const c=by<1880?1850:Math.round(by/5)*5,k=sex+c;if(!cemLC[k]){const q=cemQ(sex,c),l=[1];for(let x=0;x<110;x++)l.push(l[x]*(1-q[x]));cemLC[k]=l;}return cemLC[k];}
/* exact age at death for survival quantile u (infant deaths bunch up in the first months) */
function cemAge(sex,by,u){const l=cemL(sex,by),s=1-u;let x=0;while(x<109&&l[x+1]>s)x++;const f=(l[x]-s)/Math.max(1e-12,l[x]-l[x+1]);return x+(x===0?f*f:f);}
/* birth years: before 1880 the town grows (1795–1879); after 1880 most burials are people born 1900–1950 */
function cemBirth(pre,u){if(pre){const k=0.03,a=Math.exp(k*(1795-1879));return Math.floor(1879+Math.log(a+u*(1-a))/k);}
  const W=[[1880,1900,0.45],[1900,1951,1],[1951,1956,0.4]];let t=u*W.reduce((s,w)=>s+(w[1]-w[0])*w[2],0);
  for(const w of W){const m=(w[1]-w[0])*w[2];if(t<m)return Math.floor(w[0]+t/w[2]);t-=m;}return 1955;}
/* one burial: the cemetery opened in 1832, and only people who have died (by 2025) are in it */
function cemPerson(seed,id,pre,sex,u,v){for(let t=0;t<40;t++){const b=cemBirth(pre,t===0&&v!==undefined?v:chr(seed,id,t*3+1)),d=Math.floor(b+chr(seed,id,t*3+2)+cemAge(sex,b,u));
  if(pre&&d<CEM.found)continue;if(!pre&&d>CEM.last)continue;return {b,d,sex};}return null;}
const CEM_FIRST={preM:['Josiah','Silas','Amos','Elijah','Thaddeus','Abner','Jedediah','Horace','Calvin','Rufus','Hiram','Cyrus','Nathaniel','Ephraim','Levi','Gideon','Jonas','Samuel','Isaac','Jacob','Benjamin','Daniel','William','Henry','George','Thomas','James','Charles'],
  preF:['Mary','Hannah','Abigail','Sarah','Lydia','Martha','Eliza','Harriet','Louisa','Rebecca','Phoebe','Clara','Emma','Julia','Lucy','Caroline','Charlotte','Amelia','Rachel','Esther','Margaret','Susan','Ellen','Catherine','Charity','Prudence','Mercy','Temperance'],
  postM:['Walter','Harold','Raymond','Clarence','Earl','Howard','Ralph','Floyd','Leonard','Eugene','Lloyd','Chester','Melvin','Herbert','Arthur','Donald','Richard','Kenneth','Robert','Gerald','Roy','Elmer','Lester','Alvin','Norman','Stanley','Frank','Joseph','Edward','Albert'],
  postF:['Dorothy','Mildred','Helen','Ruth','Evelyn','Gladys','Thelma','Bernice','Lorraine','Marjorie','Irene','Edna','Hazel','Florence','Doris','Beatrice','Lucille','Viola','Pearl','Shirley','Joan','Phyllis','Norma','Geraldine','Loretta','Juanita','Rosa','Betty','Frances','Wilma']};
const CEM_LAST=['Ashmere','Birchell','Brindlecombe','Calderwick','Copperidge','Dunholt','Elmscott','Fallowell','Fenwright','Gildersby','Greythorne','Hollinsby','Kestering','Larkworth','Marrowfield','Nettlecombe','Oakmantle','Pellingham','Quillby','Rookwell','Sallowby','Thornquist','Underhay','Varnell','Wexcombe','Whitlowe','Yarrowby','Ambermoor','Cobbleigh','Drayfield','Farrowdale','Gorsewick','Kettleby','Mossgrove','Ravelstoke','Stillbrook','Tamberlin','Wrenfield'];
const CEM_INIT='ABCEGHJLMNRSTW';
const cemPick=(arr,u)=>arr[Math.min(arr.length-1,Math.floor(u*arr.length))];
function cemSurv(list){return CEM.ages.map(a=>list.filter(p=>p.d-p.b>=a).length);}
const cemDC={};
function cemData(seed){if(cemDC[seed])return cemDC[seed];const S=seed|0;
  const mine=Math.floor(chr(S,1,0)*12),others=[];for(let i=0;i<12;i++)if(i!==mine)others.push(i);
  // the rest of the class: a stratified sample of each life table (the class's big sample), spread over the 11 other sections.
  // Males and females share the same strata of birth years and survival, so the class data differ by sex only as the life tables do.
  const rest=[];let id=1000;
  for(const pre of [true,false]){const n4=(pre?CEM.restPre:CEM.restPost)-3+Math.floor(chr(S,id,7)*7),perm=Array.from({length:n4},(_,i)=>i);for(let i=n4-1;i>0;i--){const j=Math.floor(chr(S,id,i)*(i+1));[perm[i],perm[j]]=[perm[j],perm[i]];}
    for(const sex of ['M','F'])for(let i=0;i<n4;i++){const p=cemPerson(S,id+i,pre,sex,(i+chr(S,id+i,999))/n4,(perm[i]+chr(S,id+i,997))/n4);if(p){p.sec=others[Math.floor(chr(S,id+i+(sex==='F'?500:0),998)*others.length)];rest.push(p);}}
    // about 105 boys are born for every 100 girls: a few extra boys, drawn at random
    const xm=Math.round(n4*0.05)-1+Math.floor(chr(S,id,8)*3);for(let i=0;i<xm;i++){const q=id+n4+i,p=cemPerson(S,q,pre,'M',chr(S,q,990));if(p){p.sec=others[Math.floor(chr(S,q,998)*others.length)];rest.push(p);}}
    id+=n4+10;}
  // your section: 16 random burials, 6 to 10 of them born before 1880, mixed together in family plots
  const npre=6+Math.floor(chr(S,2,0)*5),st=[];
  for(let i=0;i<CEM.n;i++){let p=null;for(let t=0;!p&&t<9;t++){const id2=50+i*10+t;p=cemPerson(S,id2,i<npre,chr(S,id2,5)<0.51?'M':'F',chr(S,id2,6));}st.push(p||{b:1900,d:1960,sex:'M'});}
  for(let i=st.length-1;i>0;i--){const j=Math.floor(chr(S,3,i)*(i+1));[st[i],st[j]]=[st[j],st[i]];}
  // names: families share a surname in 1 to 3 neighboring plots
  const used=new Set();let i=0,fam=0;
  while(i<st.length){const size=1+Math.floor(chr(S,4,fam)*3);let ln;for(let t=0;t<30;t++){ln=cemPick(CEM_LAST,chr(S,5,fam*31+t));if(!used.has(ln))break;}used.add(ln);
    for(let j=0;j<size&&i<st.length;j++,i++){const s=st[i],pre=s.b<1880,age=s.d-s.b,key=(pre?'pre':'post')+s.sex,u=k=>chr(S,100+i,k);
      s.n=i+1;s.last=ln;s.first=cemPick(CEM_FIRST[key],u(1));for(let t=2;t<12&&st.some((o,k)=>k<i&&o.first===s.first&&o.last===ln);t++)s.first=cemPick(CEM_FIRST[key],u(t));
      if(!pre&&u(13)<0.5)s.first+=' '+cemPick(CEM_INIT,u(14))+'.';
      s.infant=pre&&age<=1&&u(15)<0.55;if(s.infant)s.par=cemPick(CEM_INIT,u(16))+'. & '+cemPick(CEM_INIT,u(17))+'. '+ln;
      const ep=pre?(age<15?['Our darling','Asleep in Jesus','Gone to rest']:s.sex==='F'&&age>=20&&u(18)<0.5?['Wife of '+cemPick(CEM_INIT,u(19))+'. '+ln]:['At rest','Gone home','Thy will be done','Peace'])
        :(age<15?['Our little angel','Forever loved']:s.sex==='F'?['Beloved wife and mother','Mother','In loving memory','Forever in our hearts']:['Beloved husband and father','Father','At rest','In loving memory']);
      s.epi=s.infant?'':cemPick(ep,u(20));
      s.style=pre?(u(21)<0.6?0:1):(u(21)<0.45?2:u(21)<0.8?3:4);s.shape=pre?(u(22)<0.55?'arch':'round'):(u(22)<0.6?'flat':'round');s.lich=pre?u(23):0;}
    fam++;}
  const grp=(L,pre,sex)=>L.filter(p=>(p.b<1880)===pre&&(!sex||p.sex===sex));
  const D={seed:S,mine,sec:CEM.secs[mine],stones:st,npre,others,
    mineS:{pre:cemSurv(grp(st,true)),post:cemSurv(grp(st,false))},
    rest:{pre:cemSurv(grp(rest,true)),post:cemSurv(grp(rest,false)),preM:cemSurv(grp(rest,true,'M')),preF:cemSurv(grp(rest,true,'F')),postM:cemSurv(grp(rest,false,'M')),postF:cemSurv(grp(rest,false,'F'))},
    secS:{},nRest:rest.length};
  others.forEach(k=>{const L=rest.filter(p=>p.sec===k);D.secS[k]={pre:cemSurv(grp(L,true)),post:cemSurv(grp(L,false)),n:L.length};});
  cemDC[seed]=D;return D;}
const cemV=sim=>sim&&sim.vlab&&sim.vlab.lab&&sim.vlab.lab.id==='cemetery'?sim.vlab:null;
const cemD=sim=>cemV(sim)?cemData(sim.vlab.seed):null;
let CEMCUR=null;const cemCur=()=>cemD(CEMCUR);
const TABN={pre:'born-before-1880',post:'born-1880-or-later'};
/* the student's own records from one Part 1 table */
function cemRecs(V,t){const out=[];for(let r=0;r<CEM.rows;r++){const g=f=>V.raw('c:'+t+':'+f+':'+r).trim();if(!g('st')&&!g('b')&&!g('d')&&!g('age'))continue;out.push({r,st:parseInt(g('st'),10),b:V.val(t,'b',r),d:V.val(t,'d',r),sex:g('sex'),age:V.val(t,'age',r)});}return out;}
function cemRecorded(V,n){for(const t of ['pre','post'])for(let r=0;r<CEM.rows;r++)if(V.raw('c:'+t+':st:'+r)===String(n)&&['b','d','sex','age'].every(f=>V.raw('c:'+t+':'+f+':'+r).trim()!==''))return true;return false;}
/* checks: data cells compare with the headstones, the counts with the student's own table */
function cemStCheck(t){return (sim,rv,v)=>{const D=cemD(sim);if(!D)return null;const n=parseInt(v,10),s=D.stones[n-1];if(!s)return null;const V=sim.vlab,r=(+rv)-1;
  if((s.b<1880)!==(t==='pre'))return 'Check the birth year on Stone '+n+'. '+(t==='pre'?'This table is for people born before 1880.':'This table is for people born in 1880 or later.');
  for(const u of ['pre','post'])for(let i=0;i<CEM.rows;i++){if(u===t&&i===r)continue;if(V.raw('c:'+u+':st:'+i)===String(n))return 'Stone '+n+' is already in record '+(i+1)+' of the '+TABN[u]+' table. Record each headstone only once.';}
  return null;};}
function cemCellCheck(t,f){return (sim,rv,v)=>{const D=cemD(sim);if(!D)return null;const V=sim.vlab,r=(+rv)-1,n=parseInt(V.raw('c:'+t+':st:'+r),10),s=D.stones[n-1];
  if(!s)return 'Choose this headstone’s number in the Stone column first.';
  if(f==='b'){if(v!==s.b)return 'That is not the birth year on Stone '+n+'. Read the stone again.';if(t==='pre'&&v>=1880)return 'This table is for people born before 1880.';if(t==='post'&&v<1880)return 'This table is for people born in 1880 or later.';return null;}
  if(f==='d')return v===s.d?null:'That is not the death year on Stone '+n+'. Read the stone again.';
  if(f==='sex')return v===s.sex?null:'Look at the name on Stone '+n+' again. Record M for a male and F for a female.';
  if(f==='age'){const a=s.d-s.b;if(v===a||v===a-1)return null;const b=V.val(t,'b',r),d=V.val(t,'d',r);
    if(Number.isFinite(b)&&Number.isFinite(d)&&v===d-b)return 'Your age matches your years, but check the birth and death years for Stone '+n+' first.';
    return v<0?'Age at death cannot be negative. Subtract the birth year from the death year.':'Age at death is the death year minus the birth year. Check your subtraction for Stone '+n+'.';}
  return null;};}
const cemAgeIx=rv=>CEM.ages.indexOf(+rv);
function cemYouCheck(t){return (sim,rv,v)=>{const D=cemD(sim);if(!D)return null;const i=cemAgeIx(rv);if(i<0)return null;const x=CEM.ages[i];
  const own=cemRecs(sim.vlab,t).filter(p=>Number.isFinite(p.age)&&p.age>=x).length;if(v===D.mineS[t][i]||v===own)return null;
  return x===0?'At age 0, count everyone in your '+TABN[t]+' table: every person was alive at birth.':'Count the people in your '+TABN[t]+' table whose age at death is '+x+' or more.';};}
function cemTotCheck(t){return (sim,rv,v)=>{const D=cemD(sim);if(!D)return null;const i=cemAgeIx(rv);if(i<0)return null;const you=sim.vlab.val('c'+t,'you',i),rest=D.rest[t][i];
  if(!Number.isFinite(you))return 'Fill in your section’s count for this age first.';if(v===rest+you||v===rest+D.mineS[t][i])return null;
  return 'Class total = rest of the class + your section, for this age.';};}
function cemPctCheck(t){return (sim,rv,v)=>{const D=cemD(sim);if(!D)return null;const i=cemAgeIx(rv);if(i<0)return null;const V=sim.vlab,tot=V.val('c'+t,'tot',i),t0=V.val('c'+t,'tot',0);
  if(!Number.isFinite(tot)||!Number.isFinite(t0)||t0<=0)return 'Fill in the class total for this age and for age 0 first.';
  const p=100*tot/t0;if(Math.abs(v-p)<=0.55)return null;if(Math.abs(v-p/100)<=0.006)return 'That is a fraction. Multiply by 100 to make it a percent.';
  if(v>100)return 'A percent surviving cannot be more than 100%.';
  return 'Percent surviving = class total at this age ÷ class total at age 0 × 100.';};}
/* bench drawing */
const CEM_STY=[{f:'#dcd8cf',e:'#b9b4a8',t:'#3a3833'},{f:'#6f777e',e:'#596067',t:'#f1f3f4'},{f:'#a3a5a9',e:'#85878c',t:'#1f2226'},{f:'#3d4147',e:'#2c2f34',t:'#eef0f2'},{f:'#b79289',e:'#9a776f',t:'#2a1d1a'}];
function cemFit(ctx,s,x,y,maxW,size,w,c,it){let z=size;ctx.font=(it?'italic ':'')+(w||400)+' '+z+'px '+FONT;while(z>10&&ctx.measureText(s).width>maxW){z-=0.5;ctx.font=(it?'italic ':'')+(w||400)+' '+z+'px '+FONT;}
  ctx.fillStyle=c;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(s,x,y);}
function cemStone(ctx,s,cx,top,w,h,k){const S=CEM_STY[s.style],x=cx-w/2,pre=s.b<1880;
  ctx.fillStyle='rgba(0,0,0,.16)';ctx.beginPath();ctx.ellipse(cx,top+h+6,w*0.55,8,0,0,6.2832);ctx.fill();
  ctx.fillStyle=S.e;ctx.fillRect(x-8,top+h-6,w+16,12);
  ctx.beginPath();if(s.shape==='arch'){const r=w/2;ctx.moveTo(x,top+h);ctx.lineTo(x,top+r*0.55);ctx.quadraticCurveTo(x,top,cx,top);ctx.quadraticCurveTo(x+w,top,x+w,top+r*0.55);ctx.lineTo(x+w,top+h);ctx.closePath();}
  else if(s.shape==='round')rr(ctx,x,top,w,h,26);else{ctx.moveTo(x,top+h);ctx.lineTo(x,top+12);ctx.lineTo(x+12,top);ctx.lineTo(x+w-12,top);ctx.lineTo(x+w,top+12);ctx.lineTo(x+w,top+h);ctx.closePath();}
  ctx.fillStyle=S.f;ctx.fill();ctx.strokeStyle=S.e;ctx.lineWidth=2;ctx.stroke();
  if(s.lich>0.35){ctx.fillStyle='rgba(120,140,70,.35)';for(let j=0;j<5;j++){ctx.beginPath();ctx.arc(x+12+((j*53+s.n*17)%(w-24)),top+h-14-((j*29+s.n*7)%28),3+j%3,0,6.2832);ctx.fill();}}
  const W=w-26,z1=Math.min(16*k,25),z2=Math.min(18*k,27),z3=Math.min(12.5*k,17),up=t=>pre?t.toUpperCase():t;
  const L1=s.infant?(s.sex==='M'?'Infant son':'Infant daughter'):up(s.first),L2=s.infant?'of '+s.par:up(s.last);
  const y0=top+(s.shape==='arch'?h*0.36:h*0.28);
  cemFit(ctx,L1,cx,y0,W,z1,600,S.t);cemFit(ctx,L2,cx,y0+z1*1.25,W,z1,600,S.t);
  cemFit(ctx,s.b+' – '+s.d,cx,y0+z1*1.25+z2*1.35,W,z2,700,S.t);
  if(s.epi&&k<1.45)cemFit(ctx,s.epi,cx,y0+z1*1.25+z2*1.35+z3*1.6,W,z3,400,S.t,true);}
function cemNarrate(sim){const D=cemD(sim),p=sim.p;if(!D)return '';
  if(p.cemView==='map')return 'This is '+CEM.name+' (fictional), opened in '+CEM.found+'. The class splits it into 12 sections. <b>Your group has Section '+D.sec+'</b>; the other 11 sections are already on the class spreadsheet.';
  if(p.cemView==='sec'){const a=(p.cemRow-1)*6+1,b=Math.min(CEM.n,a+5);return '<b>Section '+D.sec+', stones '+a+' to '+b+'.</b> Each headstone gives a name, a birth year and a death year. Record each one in the table for its birth year: before 1880, or 1880 or later.';}
  if(p.cemSheet==='sex')return '<b>Class spreadsheet, by sex.</b> The other 11 sections, split into males and females, with the percent of each still alive at each age. Use it for the Discuss questions.';
  return '<b>Class spreadsheet, '+(p.cemTab==='pre'?'born before 1880':'born 1880 or later')+'.</b> Each number is how many people in that section lived to at least that age. Your section’s column is blank until you add your counts in your notebook.';}
function drawCem(sim,ctx,vdt,k){const D=cemD(sim),p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);if(!D)return;
  const fs=12.5*k,hs=Math.min(16*k,24),sm=12*k,narrow=k>1.35;
  if(p.cemView==='map'){txt(ctx,CEM.name+' (fictional) · opened '+CEM.found,16,30,{s:hs,w:700});
    ctx.fillStyle='rgba(98,150,80,.18)';rr(ctx,16,46,540,388,12);ctx.fill();
    const g=rng(D.seed%100000+7),cw=124,ch=104;
    for(let i=0;i<12;i++){const c=i%4,r=(i/4)|0,x=28+c*(cw+8),y=58+r*(ch+12),me=i===D.mine;
      ctx.fillStyle=me?'rgba(193,20,48,.10)':PAL['card'];rr(ctx,x,y,cw,ch,8);ctx.fill();ctx.strokeStyle=me?PAL['rj']:PAL['line'];ctx.lineWidth=me?3:1;rr(ctx,x,y,cw,ch,8);ctx.stroke();
      ctx.fillStyle=PAL['muted'];for(let j=0;j<14;j++){const sx=x+12+(j%7)*15+g()*3,sy=y+50+((j/7)|0)*24+g()*3;rr(ctx,sx,sy,8,12,3);ctx.fill();}
      txt(ctx,CEM.secs[i],x+12,y+30,{s:Math.min(18*k,26),w:700,c:me?PAL['rj']:PAL['cv-ink']});
      txt(ctx,me?'You':'✓',x+cw-10,y+28,{s:sm,w:700,c:me?PAL['rj']:PAL['cv-soft'],a:'right'});}
    txt(ctx,'Main gate',286,428,{s:sm,c:PAL['cv-soft'],a:'center'});
    const X=572,Y=46;ctx.fillStyle=PAL['card'];rr(ctx,X,Y,216,388,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,X,Y,216,388,12);ctx.stroke();
    const lines=[['Your group',700],['Section '+D.sec,700,PAL['rj']],[CEM.n+' headstones',400],['',0],['Other groups',700],['11 sections,',400],[D.nRest+' headstones,',400],['on the class',400],['spreadsheet',400],['',0],['All names are',400,PAL['cv-soft']],['fictional.',400,PAL['cv-soft']]];
    let ly=Y+32;const lh=Math.min(fs*1.4,29);lines.forEach(L=>{if(L[1])txt(ctx,L[0],X+16,ly,{s:fs,w:L[1],c:L[2]||PAL['cv-ink']});ly+=lh;});return;}
  if(p.cemView==='sec'){const pg=clamp((p.cemRow|0)||1,1,3),a=(pg-1)*6;
    txt(ctx,'Section '+D.sec+' · stones '+(a+1)+' to '+Math.min(CEM.n,a+6)+' of '+CEM.n,16,30,{s:hs,w:700});txt(ctx,'All names are fictional',784,30,{s:sm,c:PAL['cv-soft'],a:'right'});
    ctx.fillStyle='rgba(98,150,80,.18)';ctx.fillRect(0,40,800,410);
    for(let j=0;j<6;j++){const s=D.stones[a+j];if(!s)continue;const c=j%3,r=(j/3)|0,cx=135+c*265,top=52+r*196;
      cemStone(ctx,s,cx,top,224,148,k);pill(ctx,'Stone '+s.n,cx,top+148+24,PAL['card'],PAL['cv-ink'],sm);}
    return;}
  // the class spreadsheet: every section's column on a wide screen, the totals you need on a phone
  const pre=p.cemTab!=='post',tk=pre?'pre':'post';
  [[narrow?'Before 1880':'Born before 1880',pre],[narrow?'1880 or later':'Born 1880 or later',!pre]].forEach((T,i)=>{const x=10+i*200,w=192;ctx.fillStyle=T[1]?PAL['card']:PAL['card2'];rr(ctx,x,6,w,32,6);ctx.fill();ctx.strokeStyle=T[1]?PAL['rj']:PAL['line'];ctx.lineWidth=T[1]?2:1;rr(ctx,x,6,w,32,6);ctx.stroke();
    txt(ctx,T[0],x+w/2,23,{s:sm,w:T[1]?700:400,a:'center',b:'middle'});});
  txt(ctx,p.cemSheet==='sex'?(narrow?'By sex':'By sex: other 11 sections'):(narrow?'Survivors':'Survivors in each section'),790,23,{s:sm,c:PAL['cv-soft'],a:'right',b:'middle'});
  const z=narrow?12.5*k:12*k,top=46,rh=24,hh=34,N=CEM.ages.length,grid=cols=>{const x0=cols[0][0],x1=cols[cols.length-1][0]+cols[cols.length-1][1];
    ctx.fillStyle=PAL['card'];ctx.fillRect(x0,top,x1-x0,hh+N*rh);ctx.fillStyle=PAL['card2'];ctx.fillRect(x0,top,x1-x0,hh);
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;for(let r=0;r<=N;r++){const y=Math.round(top+hh+r*rh)+.5;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();}
    cols.forEach(c=>{ctx.beginPath();ctx.moveTo(Math.round(c[0])+.5,top);ctx.lineTo(Math.round(c[0])+.5,top+hh+N*rh);ctx.stroke();});ctx.beginPath();ctx.moveTo(x1+.5,top);ctx.lineTo(x1+.5,top+hh+N*rh);ctx.stroke();};
  const cell=(s,c,r,o)=>{o=o||{};ctx.save();ctx.beginPath();ctx.rect(c[0]+1,top,c[1]-2,hh+N*rh);ctx.clip();txt(ctx,s,c[0]+c[1]/2,top+hh+r*rh+rh/2+1,{s:o.s||z,w:o.w||400,c:o.c||PAL['cv-ink'],a:'center',b:'middle'});ctx.restore();};
  const head=(s,c,o)=>{o=o||{};ctx.save();ctx.beginPath();ctx.rect(c[0]+1,top,c[1]-2,hh);ctx.clip();txt(ctx,s,c[0]+c[1]/2,top+hh/2+1,{s:o.s||z,w:700,c:o.c||PAL['cv-ink'],a:'center',b:'middle'});ctx.restore();};
  const foot=t=>txt(ctx,t,400,top+hh+N*rh+17,{s:sm,c:PAL['cv-soft'],a:'center'});
  if(p.cemSheet==='sex'){const cs=[[60,110],[170,145],[315,140],[455,145],[600,140]],M=D.rest[tk+'M'],F=D.rest[tk+'F'];grid(cs);
    (narrow?['Age','M alive','M %','F alive','F %']:['Age','Males alive','Males %','Females alive','Females %']).forEach((h,i)=>head(h,cs[i]));
    CEM.ages.forEach((a,r)=>{cell(String(a),cs[0],r,{w:700});cell(String(M[r]),cs[1],r);cell((100*M[r]/M[0]).toFixed(1),cs[2],r);cell(String(F[r]),cs[3],r);cell((100*F[r]/F[0]).toFixed(1),cs[4],r);});
    foot(narrow?'Alive: lived to at least this age.':'Alive: lived to at least this age. % = alive ÷ alive at age 0 × 100.');return;}
  if(narrow){const cs=[[100,140],[240,230],[470,230]];grid(cs);const mc=cs[2];ctx.fillStyle='rgba(193,20,48,.08)';ctx.fillRect(mc[0],top,mc[1],hh+N*rh);
    head('Age',cs[0]);head('Rest of class',cs[1]);head('Section '+D.sec+' (you)',cs[2],{c:PAL['rj']});
    CEM.ages.forEach((a,r)=>{cell(String(a),cs[0],r,{w:700});cell(String(D.rest[tk][r]),cs[1],r,{w:700});cell('?',cs[2],r,{c:PAL['rj']});});
    foot('Each section’s own column shows on a wider screen.');return;}
  const cs=[[10,56]];for(let i=0;i<12;i++)cs.push([66+i*52,52]);cs.push([690,100]);grid(cs);
  const mx=cs[1+D.mine];ctx.fillStyle='rgba(193,20,48,.08)';ctx.fillRect(mx[0],top,mx[1],hh+N*rh);
  head('Age',cs[0]);for(let i=0;i<12;i++)head(CEM.secs[i],cs[1+i],{c:i===D.mine?PAL['rj']:PAL['cv-ink']});head('Rest of class',cs[13],{s:Math.min(z,13)});
  CEM.ages.forEach((a,r)=>{cell(String(a),cs[0],r,{w:700});for(let i=0;i<12;i++)cell(i===D.mine?'?':String(D.secS[i][tk][r]),cs[1+i],r,{c:i===D.mine?PAL['rj']:PAL['cv-ink']});cell(String(D.rest[tk][r]),cs[13],r,{w:700});});
  ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.strokeRect(mx[0]+1,top+1,mx[1]-2,hh+N*rh-2);
  foot('Survivors: people in that section who lived to at least that age. Red column: your section '+D.sec+'.');}
/* the lab, from the APES teachers' handout */
const cemRecTable=t=>({id:t,get title(){const D=cemCur();return 'Part 1: Section '+(D?D.sec:'')+', people born '+(t==='pre'?'before 1880':'in 1880 or later');},
  cols:[{id:'n',label:'Record',rows:Array.from({length:CEM.rows},(_,i)=>i+1)},
    {id:'st',label:'Stone',input:'select',options:Array.from({length:CEM.n},(_,i)=>({v:String(i+1),l:'Stone '+(i+1)})),check:cemStCheck(t)},
    {id:'b',label:'Birth year',input:'number',dp:0,check:cemCellCheck(t,'b')},
    {id:'d',label:'Death year',input:'number',dp:0,check:cemCellCheck(t,'d')},
    {id:'sex',label:'Sex (M/F)',input:'select',options:[{v:'M',l:'M'},{v:'F',l:'F'}],check:cemCellCheck(t,'sex')},
    {id:'age',label:'Age at death (years)',input:'number',dp:0,check:cemCellCheck(t,'age')}]});
const cemClassTable=t=>({id:'c'+t,title:'Part 2: class spreadsheet, people born '+(t==='pre'?'before 1880':'in 1880 or later'),
  cols:[{id:'x',label:'Age (years)',rows:CEM.ages,rowLabels:CEM.ages.map(a=>a===0?'0 (birth)':String(a))},
    {id:'rest',label:'Rest of class: survivors',get rows(){const D=cemCur();return CEM.ages.map((a,i)=>D?D.rest[t][i]:'');},get rowLabels(){return this.rows.map(String);}},
    {id:'you',label:'Your section: survivors',input:'number',dp:0,check:cemYouCheck(t)},
    {id:'tot',label:'Class total: survivors',input:'number',dp:0,check:cemTotCheck(t)},
    {id:'pct',label:'Percent surviving (%)',input:'number',dp:1,check:cemPctCheck(t)}]});
const cemFilled=(V,t,c)=>CEM.ages.every((a,i)=>V.raw('c:c'+t+':'+c+':'+i).trim()!=='');
const cemSet=(sim,o)=>BioLab.setValues(sim,o);
const cemRowStep=pg=>{const a=(pg-1)*6+1,b=Math.min(CEM.n,a+5),ns=[];for(let n=a;n<=b;n++)ns.push(n);
  return {title:'Part 1: stones '+a+' to '+b,text:'<p>Read stones '+a+' to '+b+' of your section. Record each headstone in the table for its birth year: <b>born before 1880</b>, or <b>born in 1880 or later</b>.</p><p>For each one, choose its number in the <b>Stone</b> column, then record the birth year, death year, sex (M or F) and age at death. Age at death = death year − birth year.</p>'+(pg===3?'<p>Check that every headstone in your section is recorded once, with no duplicates.</p>':''),
    controls:['cemView','cemRow'],setup(sim){cemSet(sim,{cemView:'sec',cemRow:pg});},
    done:sim=>ns.every(n=>cemRecorded(sim.vlab,n)),doneHint:sim=>{const m=ns.filter(n=>!cemRecorded(sim.vlab,n));return m.length?'Still to record, with every column filled: '+m.map(n=>'Stone '+n).join(', ')+'.':'';}};};
const LAB_CEM={id:'cemetery',title:'Cemetery Lab: Exploring Survivorship Curves and Human Population Dynamics',course:'AP Environmental Science',teachers:'Weed, Overly, Brown',
  source:{label:'Cemetery Lab (APES)',href:'https://rjhs.instructure.com/courses/16648/assignments/589225'},level:'ap',
  purpose:'<p>Use birth and death data from a fictional cemetery to explore human population dynamics, specifically how survivorship curves for the human population have changed over time. Then discuss the economic and societal factors behind the change.</p>',
  background:'<p>A headstone records when a person was born and when they died. If you record every headstone in a cemetery, you can count how many people lived to at least each age. A <b>survivorship curve</b> graphs that count, as a percent of everyone born, against age. Comparing people born before 1880 with people born in 1880 or later shows how human survival has changed in the last 200 years.</p>'+
    '<p>The class splits the cemetery into sections. Each group records every headstone in its own section, so no headstone is counted twice. Then the groups put their counts together on a class spreadsheet, and the class graphs one survivorship curve for each period.</p>'+
    '<p><b>About the virtual cemetery.</b> Larkspur Hill Cemetery and every name on it are fictional. The births and deaths follow historical US life tables: for people born before 1880, mid-1800s estimates; for people born in 1880 or later, US cohort life tables for each birth year. Each student’s cemetery is different. The headstones show years only, so an age at death you work out may be one year more than the true age. As in a real cemetery, people who are still alive are not here, so few people born after about 1940 reach old age on these stones.</p>',
  materials:['Your group’s section of the cemetery (Section letter on the map)','Two data tables: people born before 1880, and people born in 1880 or later','The class spreadsheet, with a tab for each birth period','Pencil and clipboard (on the virtual bench, your notebook tables)','Graph (it draws in this notebook from your numbers)'],
  setup(sim){CEMCUR=sim;BioLab.refresh(sim);},
  teardown(){CEMCUR=null;},
  controls:['cemView','cemRow','cemTab','cemSheet'],
  steps:[
    {title:'Pre-lab questions',text:'<p>Before you go out into the cemetery, answer the <b>pre-lab questions</b>, Pre-lab 1 to 5, in the Questions section of your notebook below the bench.</p>',controls:['cemView'],setup(sim){cemSet(sim,{cemView:'map'});},
     done:sim=>['pl1','pl2','pl3a','pl3b','pl3c','pl4','pl5'].every(q=>sim.vlab.raw('q:'+q).trim()!==''),doneHint:'Answer pre-lab questions 1 to 5 first, including all three curve types in question 3.'},
    {title:'Part 1: explore the cemetery',get text(){const D=cemCur();return '<p>The class splits the cemetery into sections. Your group has <b>Section '+(D?D.sec:'')+'</b>, outlined on the map. The other groups have already recorded their sections.</p><p>Your job: record <b>every</b> headstone in your section, with no duplicates, in two tables by birth year: people born before 1880, and people born in 1880 or later.</p>';},
     controls:['cemView'],setup(sim){cemSet(sim,{cemView:'map'});}},
    cemRowStep(1),cemRowStep(2),cemRowStep(3),
    {title:'Part 2: count your survivors',text:'<p>Now compile the class data. Open the <b>class spreadsheet</b> on the bench. It has two tabs: born before 1880, and born in 1880 or later.</p><p>For each age in the Part 2 tables, count how many people in your section lived to <b>at least</b> that age (age at death equal to or more than that age), and type it in the <b>Your section</b> column. At age 0, count everyone.</p>',
     controls:['cemView','cemTab','cemSheet'],setup(sim){cemSet(sim,{cemView:'sheet',cemSheet:'sec'});},
     done:sim=>cemFilled(sim.vlab,'pre','you')&&cemFilled(sim.vlab,'post','you'),doneHint:'Type your section’s count for every age in both Part 2 tables.'},
    {title:'Part 2: class totals',text:'<p>Transfer your section’s data to the class spreadsheet. For each age, add your section to the rest of the class and type the <b>Class total</b>: the number of survivors at each age for the whole class.</p>',
     controls:['cemView','cemTab','cemSheet'],setup(sim){cemSet(sim,{cemView:'sheet',cemSheet:'sec'});},
     done:sim=>cemFilled(sim.vlab,'pre','tot')&&cemFilled(sim.vlab,'post','tot'),doneHint:'Type the class total for every age in both Part 2 tables.'},
    {title:'Part 2: percent survivorship',text:'<p>The class spreadsheet calculates percent survivorship for each age group. Here you calculate it yourself:</p><p><b>Percent surviving = (class total at that age ÷ class total at age 0) × 100</b></p><p>Round to one decimal place and type it in the <b>Percent surviving</b> column of both tables.</p>',
     controls:['cemView','cemTab','cemSheet'],setup(sim){cemSet(sim,{cemView:'sheet',cemSheet:'sec'});},
     done:sim=>cemFilled(sim.vlab,'pre','pct')&&cemFilled(sim.vlab,'post','pct'),doneHint:'Type the percent surviving for every age in both Part 2 tables.'},
    {title:'Data analysis: graph',text:'<p>Graph the class data with two lines: people born before 1880 and people born in 1880 or later. Percent surviving goes on the y-axis and age on the x-axis.</p><p>Your graph draws below from your Percent surviving columns. It uses a <b>linear</b> (ordinary) scale for percent surviving, from 0 to 100%. Check each point against your tables.</p>',
     controls:['cemView','cemTab','cemSheet'],setup(sim){cemSet(sim,{cemView:'sheet'});}},
    {title:'Discuss and apply',text:'<p>Answer the <b>Discuss</b> questions using your graph and the class spreadsheet. For the questions about males and females, set the spreadsheet to <b>By sex</b>.</p><p>Then answer the <b>Apply your knowledge</b> questions about a modern developed country’s survivorship curve, and write your conclusion.</p>',
     controls:['cemView','cemRow','cemTab','cemSheet'],setup(sim){cemSet(sim,{cemView:'sheet',cemSheet:'sex'});}}],
  tables:[cemRecTable('pre'),cemRecTable('post'),cemClassTable('pre'),cemClassTable('post')],
  graph:{type:'line',title:'Survivorship curves: percent surviving vs age',xl:'Age (years)',yl:'Percent surviving (%)',xmin:0,xmax:100,ymin:0,ymax:100,
    series:[{table:'cpre',x:'x',y:'pct',label:'Born before 1880'},{table:'cpost',x:'x',y:'pct',label:'Born 1880 or later'}]},
  questions:[
    {id:'pl1',n:'Pre-lab 1',q:'<p>Has anyone in your family lived past 100?</p>'},
    {id:'pl2',n:'Pre-lab 2',q:'<p>What is the average life expectancy in the United States?</p>'},
    {id:'pl3a',n:'Pre-lab 3a',q:'<p>Describe the three types of survivorship curves. In place of a sketch, explain in words what each curve looks like on a graph of percent surviving (y) against age (x), and give an example of an organism with that curve.</p><p><b>Type I:</b></p>'},
    {id:'pl3b',n:'Pre-lab 3b',q:'<p><b>Type II:</b> what the curve looks like, and an example organism.</p>'},
    {id:'pl3c',n:'Pre-lab 3c',q:'<p><b>Type III:</b> what the curve looks like, and an example organism.</p>'},
    {id:'pl4',n:'Pre-lab 4',q:'<p>Which type of survivorship curve represents humans?</p>'},
    {id:'pl5',n:'Pre-lab 5',q:'<p>Do you think human survivorship curves have changed in the past 200 years? What factors could cause a change?</p>'},
    {id:'d1',n:'Discuss 1',q:'<p>How did the survivorship curves for people born before 1880 and people born after 1880 differ?</p>'},
    {id:'d2',n:'Discuss 2',q:'<p>What were the main health problems for people born before 1880?</p>'},
    {id:'d3',n:'Discuss 3',q:'<p>Compare the survivorship of males and females in both periods. Use the By sex view of the class spreadsheet.</p>'},
    {id:'d4',n:'Discuss 4',q:'<p>In which period were there more infant and child deaths (ages 1 to 15)? Hypothesize why.</p>'},
    {id:'d5',n:'Discuss 5',q:'<p>Do baby boys or baby girls have a higher death rate? Why might that be?</p>'},
    {id:'d6',n:'Discuss 6',q:'<p>In which period did women live longer than men? Why?</p>'},
    {id:'d7',n:'Discuss 7',q:'<p>In which period did more women die in their 20s and 30s? Why?</p>'},
    {id:'d8',n:'Discuss 8',q:'<p>In which period were there more old people? What societal and economic issues come with more old people?</p>'},
    {id:'d9',n:'Discuss 9',q:'<p>How do the data from the 1800s resemble a developing country today?</p>'},
    {id:'a1',n:'Apply 1',q:'<p>The curve below is a modern developed country: the United States, about 2019 (approximate values from the US life table). In place of a sketch, describe how the survivorship curve of a developing country would look compared with this one, and explain why.</p>'+
      '<svg viewBox="0 0 320 170" width="320" height="170" role="img" aria-label="Modern US survivorship curve: about 99% alive at age 20, 94% at 50, 79% at 70, 60% at 80, 28% at 90 and 3% at 100" style="max-width:100%;height:auto;color:inherit">'+
      '<g fill="none" stroke="currentColor" stroke-width="1" opacity=".35"><path d="M40 20H310M40 50H310M40 80H310M40 110H310"/></g><path d="M40 20V140H310" fill="none" stroke="currentColor" stroke-width="1.5"/>'+
      '<path d="M40.0 20.0L42.7 20.7L67.0 20.8L94.0 21.3L121.0 22.5L148.0 24.3L175.0 27.3L202.0 33.7L229.0 45.2L256.0 67.5L283.0 106.8L310.0 136.6" fill="none" stroke="#C11430" stroke-width="3" stroke-linejoin="round"/>'+
      '<g fill="currentColor" font-size="11" font-family="sans-serif"><text x="34" y="24" text-anchor="end">100</text><text x="34" y="84" text-anchor="end">50</text><text x="34" y="144" text-anchor="end">0</text>'+
      '<text x="40" y="156" text-anchor="middle">0</text><text x="175" y="156" text-anchor="middle">50</text><text x="310" y="156" text-anchor="middle">100</text><text x="175" y="168" text-anchor="middle">Age (years)</text><text x="44" y="12">Percent surviving (%)</text></g></svg>'},
    {id:'a2',n:'Apply 2',q:'<p>How would the developing country’s curve change if it gained more healthcare, vaccines and medicines?</p>'},
    {id:'a3',n:'Apply 3',q:'<p>How would a developed country’s curve change if pollution-related diseases increased?</p>'},
    {id:'a4',n:'Apply 4',q:'<p>HIV/AIDS kills many people in their 20s and 30s. How would that change a country’s survivorship curve?</p>'},
    {id:'a5',n:'Apply 5',q:'<p>How can survivorship curves be used to judge a country’s environmental and health conditions, such as healthcare, vaccines, sanitation, clean water and nutrition?</p>'}],
  conclusion:{prompt:'<p>Write a claim–evidence–reasoning conclusion: how has the human survivorship curve changed between people born before 1880 and people born in 1880 or later, and why?</p>',cer:true}};

const HP={
  id:'humanpop',hash:'humanpop',apUnit:8,order:10,tab:'Human population',kind:'Simulation',prereq:['popgrowth'],
  card:'Grow a country year by year. Watch its age pyramid change as birth and death rates fall.',
  title:'Human population: age pyramids and the demographic transition',
  lede:{bio:'Pick a country and watch its population pyramid change year by year. See how birth rates, death rates and life expectancy shape who lives there.',
        honors:'Follow countries through the demographic transition. Change fertility, life expectancy and migration, and compare survivorship curves.',
        ap:'Read crude birth and death rates, growth rate, doubling time and dependency ratio, and see population momentum carry growth for decades after fertility drops.'},
  scale:'Real scale: a whole country. Each bar is a 5-year age group, as a share of the total population.',
  timeScale:3,dtMax:0.5,prewarm:0,sampleDt:1,window:80,unit:'years',timeLabel:'Time',chChange:1,chReveal:30,
  clock(sim){if(sim.st&&sim.st.C)return CEM.name;const P=PRESETS[sim.p.preset];return 'Year '+((P?P.year:2026)+Math.floor(sim.t));},
  controls:[
    {id:'preset',label:'Country',type:'select',def:'niger',lvl:'bio',options:[{v:'stage1',l:'Pre-industrial village (1750)'},{v:'niger',l:'Niger (Stage 2)'},{v:'india',l:'India (Stage 3)'},{v:'us',l:'United States (Stage 4)'},{v:'japan',l:'Japan (Stage 4–5)'}],
     help:'Loads that country’s age structure and its current rates.',onChange:loadPreset},
    {id:'tfr',label:'Total fertility rate',type:'range',min:1,max:8,step:0.1,def:6.7,unit:' children',lvl:'bio',help:'Average children per woman in her lifetime. Replacement is about 2.1.'},
    {id:'e0',label:'Life expectancy',type:'range',min:25,max:90,step:0.5,def:62,unit:' years',lvl:'honors'},
    {id:'mig',label:'Net migration',type:'range',min:-10,max:10,step:0.5,def:0,unit:' per 1,000',lvl:'honors',help:'Immigrants minus emigrants each year, per 1,000 people.'},
    // virtual lab bench only (hidden in the other views)
    {id:'cemView',label:'Look at',type:'seg',def:'map',vlab:true,noTrial:true,options:[{v:'map',l:'Cemetery map'},{v:'sec',l:'Your section'},{v:'sheet',l:'Class spreadsheet'}]},
    {id:'cemRow',label:'Headstones in your section',type:'seg',def:1,vlab:true,noTrial:true,options:[{v:1,l:'Stones 1–6'},{v:2,l:'Stones 7–12'},{v:3,l:'Stones 13–16'}],onChange(s){if(s.st&&s.st.C&&s.p.cemView!=='sec')BioLab.setValues(s,{cemView:'sec'});}},
    {id:'cemTab',label:'Spreadsheet tab',type:'seg',def:'pre',vlab:true,noTrial:true,options:[{v:'pre',l:'Born before 1880'},{v:'post',l:'Born 1880 or later'}],onChange(s){if(s.st&&s.st.C&&s.p.cemView!=='sheet')BioLab.setValues(s,{cemView:'sheet'});}},
    {id:'cemSheet',label:'Spreadsheet view',type:'seg',def:'sec',vlab:true,noTrial:true,options:[{v:'sec',l:'Sections'},{v:'sex',l:'By sex'}],onChange(s){if(s.st&&s.st.C&&s.p.cemView!=='sheet')BioLab.setValues(s,{cemView:'sheet'});}}
  ],
  actions:[{id:'load',label:'Restart this country',lvl:'bio',run:loadPreset}],
  labs:[LAB_CEM],
  /* what the bench shows right now (used by the virtual-lab tests) */
  benchRead(sim){const D=cemD(sim);if(!D)return null;const p=sim.p;return {view:p.cemView,row:p.cemRow,tab:p.cemTab,sheet:p.cemSheet,section:D.sec,
    stones:D.stones.map(s=>({n:s.n,name:s.infant?(s.sex==='M'?'Infant son':'Infant daughter')+' of '+s.par:s.first+' '+s.last,b:s.b,d:s.d,sex:s.sex})),
    shown:p.cemView==='sec'?D.stones.slice((p.cemRow-1)*6,(p.cemRow-1)*6+6).map(s=>s.n):[],rest:{pre:D.rest.pre.slice(),post:D.rest.post.slice()},bySex:{preM:D.rest.preM,preF:D.rest.preF,postM:D.rest.postM,postF:D.rest.postF}};},
  init(sim){const p=sim.p;const st=build(p.preset,p.tfr,p.e0,p.mig);st.acc=0;st.start={m:groups5(st.m),f:groups5(st.f),T:total(st)};st.T0=total(st);st.births0=st.births;st.vis=0;if(cemV(sim))st.C={kind:'cem'};return st;},
  step(sim,dt){if(sim.st.C)return;const s=sim.st,p=sim.p;s.acc+=dt;while(s.acc>=1){s.acc-=1;yearStep(s,p.tfr,p.e0,p.mig);}},
  metrics:[
    {id:'pop',label:'Population',unit:'million',lvl:'bio',min:0,max:null,d:1,get:s=>total(s.st)/1e6},
    {id:'gr',label:'Growth rate',unit:'% per year',lvl:'bio',min:-2,max:4,d:2,get:s=>stats(s.st).gr},
    {id:'stage',label:'Demographic transition',unit:'',lvl:'bio',text:true,get:s=>stageText(s)},
    {id:'cbr',label:'Crude birth rate',unit:'per 1,000',lvl:'honors',min:0,max:60,d:1,get:s=>stats(s.st).cbr},
    {id:'cdr',label:'Crude death rate',unit:'per 1,000',lvl:'honors',min:0,max:60,d:1,get:s=>stats(s.st).cdr},
    {id:'med',label:'Median age',unit:'years',lvl:'honors',min:0,max:60,d:1,get:s=>stats(s.st).med},
    {id:'dbl',label:'Doubling time (rule of 70)',unit:'years',lvl:'ap',min:0,max:200,d:0,get:s=>{const g=stats(s.st).gr;return g>0.05?70/g:NaN;}},
    {id:'dep',label:'Dependency ratio',unit:'per 100 workers',lvl:'ap',min:0,max:120,d:0,get:s=>stats(s.st).dep},
    {id:'old',label:'Age 65 and older',unit:'% of people',lvl:'ap',min:0,max:45,d:1,get:s=>stats(s.st).old}
  ],
  graphs:[
    {id:'pop',label:'Population over time',lines:['pop']},
    {id:'gr',label:'Growth rate over time',lines:['gr']},
    {id:'bd',label:'Birth and death rates',lvl:'honors',lines:['cbr','cdr'],yl:'Per 1,000 people per year'},
    {id:'surv',label:'Survivorship curve',lvl:'honors',custom:true},
    {id:'dep',label:'Dependency ratio over time',lvl:'ap',lines:['dep']}
  ],
  defaultGraph:'pop',
  plot(sim,ctx,box,id){const q=lifeTable(sim.p.e0);let l=1000;const pts=[[0,1000]];for(let x=0;x<AGES-1;x++){l*=1-q[x];pts.push([x+1,Math.max(l,0.5)]);}
    const LY=v=>Math.log10(Math.max(v,0.5));
    const ax=axes(ctx,box,{xmin:0,xmax:100,ymin:0,ymax:3,xl:'Age (years)',yl:'Survivors of 1,000 born (log scale)',yd:0});
    // relabel log axis
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    const ref=[{n:'Type I',c:PAL['muted'],f:x=>1000*(1-Math.pow(x/100,6))},{n:'Type II',c:PAL['muted'],f:x=>1000*Math.exp(-0.069*x)},{n:'Type III',c:PAL['muted'],f:x=>1000*Math.exp(-0.5*Math.sqrt(x*12))}];
    ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ref.forEach(r=>{ctx.strokeStyle=r.c;ctx.beginPath();for(let x=0;x<=100;x+=2){const y=ax.Y(LY(r.f(x)));x?ctx.lineTo(ax.X(x),y):ctx.moveTo(ax.X(x),y);}ctx.stroke();});ctx.setLineDash([]);
    ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=3;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(ax.X(p[0]),ax.Y(LY(p[1]))):ctx.moveTo(ax.X(p[0]),ax.Y(LY(p[1]))));ctx.stroke();ctx.restore();
    txt(ctx,'Type I',ax.X(70),ax.Y(LY(1000*(1-Math.pow(0.7,6))))-8,{s:12,c:PAL['muted']});txt(ctx,'Type II',ax.X(40),ax.Y(LY(1000*Math.exp(-0.069*40)))-8,{s:12,c:PAL['muted']});txt(ctx,'Type III',ax.X(12),ax.Y(LY(1000*Math.exp(-0.5*Math.sqrt(144))))+16,{s:12,c:PAL['muted']});
    legend(ctx,box.L+12,box.T+10,[{label:'This country (life expectancy '+sim.p.e0+')',color:PAL['g-line']},{label:'Reference types',color:PAL['muted'],dash:true}]);
    ['1','10','100','1,000'].forEach((s,i)=>txt(ctx,s,box.L-8,ax.Y(i),{s:12,c:PAL['g-axis'],a:'right',b:'middle'}));},
  narrate(sim){if(sim.st.C&&sim.vlab)return cemNarrate(sim);const s=stats(sim.st),n=stageNum(sim),p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    const momentum=p.tfr<=2.3&&s.gr>0.2&&s.kids>20;
    if(momentum)return '<b>Population momentum.</b> Families now average only '+p.tfr+' children, yet the population still grows '+s.gr.toFixed(1)+'% a year. The big generation of young people is now having children, so births stay high for decades.';
    if(n===1)return '<b>Stage 1.</b> Many babies are born, but many people die young from disease and hunger. Births and deaths nearly cancel, so the population barely grows.';
    if(n===2)return '<b>Stage 2: fast growth.</b> Better food, clean water and medicine cut the death rate, but families are still large. The pyramid has a wide base: '+s.kids.toFixed(0)+'% of people are under 15.'+(ap?' At '+s.gr.toFixed(1)+'% a year, the population doubles in about '+Math.round(70/s.gr)+' years.':'');
    if(n===3)return '<b>Stage 3.</b> As children survive and education spreads, families get smaller. The birth rate falls, growth slows, and the pyramid’s base narrows.';
    if(n===4)return '<b>Stage 4: slow or no growth.</b> Low birth and death rates. The pyramid looks more like a column, and the median age is '+s.med.toFixed(0)+'.'+(p.mig>0&&hon?' Immigration adds young adults each year.':'');
    return '<b>Shrinking.</b> With '+p.tfr+' children per woman, each generation is smaller than the last. More people are over 65 ('+s.old.toFixed(0)+'%), so fewer workers support more retirees.';},
  tour:[
    {title:'Reading a pyramid',text:'Each bar is an age group, 5 years wide: babies at the bottom, the oldest at the top. Males are on the left and females on the right. Bar length is the share of the whole population.',focus:[20,40,520,400],speed:0.3,setup(sim){BioLab.setValues(sim,{preset:'niger'});}},
    {title:'A wide base means growth',text:'Niger has the highest fertility in the world. The wide bottom means many children, who will soon have children of their own.',focus:[20,330,520,95],speed:0.5},
    {title:'Watch the cohorts move up',text:'Every year each group gets one year older and slides upward, losing some people to death. The bars you see rising are real generations.',focus:[20,40,520,400],speed:1.5},
    {title:'The demographic transition',text:'The chart at the right shows the four stages: first death rates fall, then birth rates fall. The dot marks where this country is now.',focus:[548,34,245,210],speed:1},
    {title:'A Stage 4 country',text:'The United States has low birth and death rates. Its pyramid looks more like a column, and growth is slow. Immigration adds young adults.',focus:[20,40,520,400],speed:1,setup(sim){BioLab.setValues(sim,{preset:'us'});loadPreset(sim);}},
    {title:'Shrinking: Japan',text:'Japan’s fertility is far below replacement (2.1). The base is narrow and the top is heavy, so the population shrinks and ages.',focus:[20,40,520,400],speed:1.5,setup(sim){BioLab.setValues(sim,{preset:'japan'});loadPreset(sim);}},
    {lvl:'ap',title:'Momentum',text:'India’s fertility is already near replacement, but its pyramid still has a large young generation. Those young adults keep births high for decades. That is population momentum.',focus:[20,40,520,400],speed:1.5,setup(sim){BioLab.setValues(sim,{preset:'india'});loadPreset(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{preset:'niger'});loadPreset(sim);},
  challenges:[
    {lvl:'bio',q:'Niger’s population grows nearly 4% a year. About how long until it doubles?',choices:['About 4 years','About 18 years','About 70 years'],correct:1,
     baseline:{preset:'niger'},baselineAction:'load',change:{},changeText:'Watching Niger grow',watch:'pop',at:1,reveal:19,
     explain:{bio:'Use the rule of 70: doubling time ≈ 70 ÷ growth rate in %. 70 ÷ 3.8 ≈ 18 years. Check the population readout: 27 million becomes about 54 million in 18 to 19 years.'}},
    {lvl:'bio',q:'Japan’s families average 1.2 children. What happens to Japan’s population over the next 30 years?',choices:['It grows','It stays the same','It shrinks'],correct:2,
     baseline:{preset:'japan'},baselineAction:'load',change:{},changeText:'Watching Japan',watch:'pop',at:1,reveal:30,
     explain:{bio:'Each couple needs about 2 children just to replace themselves. With 1.2, each generation is smaller than the one before, and deaths outnumber births.'}},
    {lvl:'honors',q:'India’s fertility rate is already about 2.0, near replacement. Does its population stop growing right away?',choices:['Yes, it levels off immediately','No, it keeps growing for decades','It starts shrinking right away'],correct:1,
     baseline:{preset:'india'},baselineAction:'load',change:{},changeText:'Watching India',watch:'pop',at:1,reveal:30,
     explain:{honors:'India has a large generation of young people from when families were bigger. As they reach their 20s and 30s they have children, so births still outnumber deaths. This is population momentum.'}},
    {lvl:'honors',q:'With modern death rates, what total fertility rate keeps a population steady in the long run (ignoring migration)?',choices:['About 1.0','About 2.1','About 4.0'],correct:1,instant:true,
     explain:{honors:'Two children replace the two parents. The extra 0.1 covers children who die before they grow up and the slight excess of boys born. In countries with high child mortality, replacement is higher.'}},
    {lvl:'ap',q:'A country grows at 1.4% per year. What is its doubling time?',choices:['14 years','50 years','98 years'],correct:1,instant:true,
     explain:{ap:'Rule of 70: 70 ÷ 1.4 = 50 years. It comes from ln 2 ≈ 0.693, so doubling time ≈ 69.3 ÷ (growth rate in %).'}},
    {lvl:'ap',q:'Over the next 30 years, what happens to Japan’s dependency ratio (children plus people 65 and older, per 100 working-age adults)?',choices:['It rises','It falls','It stays the same'],correct:0,
     baseline:{preset:'japan'},baselineAction:'load',change:{},changeText:'Watching Japan age',watch:'dep',at:1,reveal:30,
     explain:{ap:'The large post-war generations move past 65 while fewer young people enter the workforce. More dependents per worker strains pensions and health care, a key issue for Stage 4–5 countries.'}},
    {lvl:'ap',q:'In Niger, life expectancy rises from 62 to 75 years while fertility stays the same. What happens to the growth rate?',choices:['It rises','It falls','It does not change'],correct:0,
     baseline:{preset:'niger'},baselineAction:'load',change:{e0:75},changeText:'Life expectancy raised to 75',watch:'gr',at:2,reveal:12,
     explain:{ap:'Lower death rates with the same birth rate widen the gap between births and deaths, so growth speeds up. That is exactly what happens in Stage 2 of the demographic transition.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does family size change a country’s growth?</p><ol><li>Choose Niger. Set the fertility rate to 6, 4, 3, 2 and 1.5, pressing Restart after each.</li><li>Let each run 10 years, then record a trial.</li><li>Plot fertility rate (x) against growth rate (y).</li></ol><p>At what fertility rate does growth reach zero? Why isn’t it exactly 2?</p>',
       honors:'<p><b>Question:</b> How does a country move through the demographic transition?</p><ol><li>Record the birth rate, death rate and growth rate for each preset country.</li><li>Put them in order from Stage 1 to Stage 5.</li><li>Compare their survivorship curves.</li></ol><p>Explain which rate falls first, and why.</p>',
       ap:'<p><b>Question:</b> How long does population momentum last?</p><ol><li>Choose India and set fertility to exactly 2.1.</li><li>Record population every 10 years for 70 years.</li><li>Repeat with fertility 1.5.</li></ol><p><b>Claim–evidence–reasoning:</b> Use the pyramid shape to explain why the population keeps growing after fertility reaches replacement.</p>'},
  terms:[{t:'Age-structure diagram',d:'A population pyramid showing how many people are in each age group.'},{t:'Total fertility rate (TFR)',d:'The average number of children a woman has in her lifetime.'},{t:'Replacement-level fertility',d:'About 2.1 children per woman: enough to replace both parents.'},
    {lvl:'honors',t:'Demographic transition',d:'The shift from high birth and death rates to low ones as a country develops.'},{lvl:'honors',t:'Crude birth/death rate',d:'Births or deaths per 1,000 people per year.'},{lvl:'honors',t:'Survivorship curve',d:'A graph of how many individuals survive to each age. Type I: most live long (humans). Type III: most die young (fish).'},
    {lvl:'ap',t:'Rule of 70',d:'Doubling time ≈ 70 ÷ growth rate (%).'},{lvl:'ap',t:'Population momentum',d:'Continued growth after fertility drops, because a large young generation is still having children.'},{lvl:'ap',t:'Dependency ratio',d:'People under 15 and 65+ per 100 people aged 15–64.'}],
  about:'<p><b>Model:</b> a cohort-component projection with single years of age (0–100) for each sex. Each year every age group ages by one, survives with probabilities from a Gompertz–Makeham mortality schedule tuned to the chosen life expectancy (women live about 5 years longer than men), and women aged 15–49 have children following a bell-shaped age pattern scaled to the total fertility rate, with 105 boys per 100 girls. Migrants are added at ages 20–34.</p><p><b>Presets:</b> each country’s pyramid is built by running its approximate fertility and mortality history, then scaling to its current population. They are teaching approximations, not official projections.</p><p><b>Simplified:</b> no wars, pandemics or sudden policy changes, and rates stay fixed unless you change them.</p>'+
    '<p><b>The cemetery lab bench.</b> Every burial in the fictional cemetery is drawn from a single-year life table for its sex and birth year. For people born before 1880, the table follows mid-1800s US estimates (Haines’s reconstructed life tables for 1850 to 1880): about 1 baby in 6 dies in its first year, about a quarter of children die before age 5, and life expectancy at birth is near 40. Boys die more often than girls as babies. Women aged 20 to 39 carry extra deaths from childbirth and tuberculosis, so more of them die in their 20s and 30s than men. For people born from 1880 on, infant deaths and adult death rates follow the US Social Security Area cohort life tables (Bell and Miller, Actuarial Study 120): infant deaths fall from about 16% for the 1880 birth cohort to about 3% by 1955, and women outlive men by about 6 years. Birth years before 1880 run from 1795, weighted toward a growing town; after 1880 most are 1900 to 1950. The cemetery opened in 1832 and holds only people who died by 2025. The other groups’ sections are a stratified sample of about 340 burials (more of them from the 1900s, as in most town cemeteries), with males and females drawn from the same strata and about 105 boys born for every 100 girls, so the class curves follow the life tables closely; your own section is a random sample of 16.</p>'+
    '<p><b>Simplified for the cemetery:</b> no epidemics, wars or migration, smooth trends between birth cohorts, and headstones that show years only. All names are invented.</p>',
  initVis(sim){sim.vis.drops=[];sim.vis.acc=0;},
  draw(sim,ctx,vdt,k,t){if(sim.st.C&&sim.vlab){drawCem(sim,ctx,vdt,k);return;}const s=sim.st,v=sim.vis,hon=atLeast('honors'),ap=atLeast('ap'),P=PRESETS[sim.p.preset];
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const m=groups5(s.m),f=groups5(s.f),T=total(s),cx=280,top=54,bh=14.6,gap=2.2,half=22,scaleX=230/10; // 10% fills the side
    const yOf=i=>top+(20-i)*(bh+gap);
    // grid
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;for(let pc=2;pc<=10;pc+=2){const dx=half+pc*scaleX;ctx.beginPath();ctx.moveTo(cx-dx,top-4);ctx.lineTo(cx-dx,yOf(0)+bh);ctx.moveTo(cx+dx,top-4);ctx.lineTo(cx+dx,yOf(0)+bh);ctx.stroke();
      txt(ctx,pc+'%',cx-dx,yOf(0)+bh+14,{s:11*k,c:PAL['cv-soft'],a:'center'});txt(ctx,pc+'%',cx+dx,yOf(0)+bh+14,{s:11*k,c:PAL['cv-soft'],a:'center'});}
    const male=PAL['s2'],fem=PAL['s1'];
    for(let i=0;i<21;i++){const y=yOf(i),wm=Math.min(260,100*m[i]/T*scaleX),wf=Math.min(260,100*f[i]/T*scaleX);const dep=(i<3||i>=13);
      ctx.globalAlpha=hon&&dep?0.55:1;ctx.fillStyle=male;ctx.fillRect(cx-half-wm,y,wm,bh);ctx.fillStyle=fem;ctx.fillRect(cx+half,y,wf,bh);ctx.globalAlpha=1;
      if(i%2===0)txt(ctx,i===20?'100+':String(i*5),cx,y+bh/2,{s:10.5*Math.min(k,1.4),c:PAL['cv-soft'],a:'center',b:'middle'});
      // ghost of the starting pyramid
      const gm=100*s.start.m[i]/s.start.T*scaleX,gf=100*s.start.f[i]/s.start.T*scaleX;ctx.setLineDash([3,3]);ctx.strokeStyle=PAL['cv-ink'];ctx.globalAlpha=0.55;ctx.lineWidth=1.2;
      ctx.strokeRect(cx-half-Math.min(260,gm),y,Math.min(260,gm),bh);ctx.strokeRect(cx+half,y,Math.min(260,gf),bh);ctx.setLineDash([]);ctx.globalAlpha=1;}
    txt(ctx,'Male',cx-half-8,top-8,{s:13*k,w:700,c:male,a:'right'});txt(ctx,'Female',cx+half+8,top-8,{s:13*k,w:700,c:fem});txt(ctx,'Age',cx,top-8,{s:12*k,w:700,c:PAL['cv-soft'],a:'center'});
    txt(ctx,'Dashed outline: the pyramid at the start'+(hon?' · Faded bars: dependents (under 15, 65+)':''),cx,yOf(0)+bh+30,{s:11*Math.min(k,1.3),c:PAL['cv-soft'],a:'center'});
    // births dropping into the youngest bar
    if(vdt>0){v.acc+=Math.min(8,s.births/T*1000*0.35)*vdt*sim.speed;while(v.acc>=1){v.acc--;const male_=Math.random()<0.512;v.drops.push({x:male_?cx-half-10-Math.random()*60:cx+half+10+Math.random()*60,y:yOf(0)-30,vy:40,life:0.8,c:male_?male:fem});}}
    for(const d of v.drops){d.y+=d.vy*vdt;d.life-=vdt;ctx.globalAlpha=clamp(d.life/0.8,0,1);ctx.fillStyle=d.c;ctx.beginPath();ctx.arc(d.x,d.y,3.2,0,6.29);ctx.fill();}ctx.globalAlpha=1;v.drops=v.drops.filter(d=>d.life>0);if(v.drops.length>40)v.drops.splice(0,v.drops.length-40);
    // header
    const yr=(P?P.year:2026)+Math.floor(sim.t);pill(ctx,(P?P.l.replace(/ \(.*\)/,''):'Country')+' · '+yr+' · '+fmtPop(T),cx,18,PAL['card'],PAL['cv-ink'],13*Math.min(k,1.3));
    // demographic transition mini-chart
    const bx=556,by=40,bw=232,bH=196;ctx.fillStyle=PAL['card'];rr(ctx,bx-8,by-6,bw+16,bH+12,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
    txt(ctx,'Demographic transition',bx+bw/2,by+12,{s:12.5*k,w:700,a:'center'});
    const px=sx=>bx+sx*bw,py=v_=>by+bH-26-v_*(bH-60);
    for(let i=1;i<5;i++){ctx.strokeStyle=PAL['line'];ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(px(i/5),by+22);ctx.lineTo(px(i/5),by+bH-24);ctx.stroke();ctx.setLineDash([]);}
    for(let i=0;i<5;i++)txt(ctx,String(i+1),px((i+0.5)/5),by+bH-10,{s:12*k,w:700,c:PAL['cv-soft'],a:'center'});
    const br=x=>x<0.4?0.85:x<0.75?0.85-(x-0.4)/0.35*0.65:x<0.85?0.2:0.2-(x-0.85)*0.6,dr=x=>x<0.2?0.85:x<0.5?0.85-(x-0.2)/0.3*0.6:0.25-(x-0.5)*0.1,pp=x=>0.05+0.8/(1+Math.exp(-(x-0.5)*9))-(x>0.85?(x-0.85)*1.5:0);
    [[br,PAL['s1'],'Births'],[dr,PAL['s2'],'Deaths'],[pp,PAL['s3'],'Population']].forEach((L,j)=>{ctx.strokeStyle=L[1];ctx.lineWidth=2.5;ctx.setLineDash(j===2?[5,3]:[]);ctx.beginPath();for(let i=0;i<=50;i++){const x=i/50;i?ctx.lineTo(px(x),py(L[0](x))):ctx.moveTo(px(x),py(L[0](x)));}ctx.stroke();ctx.setLineDash([]);});
    const n=stageNum(sim);const mx=px((n-0.5)/5);ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(mx,by+36,7,0,6.29);ctx.fill();ctx.strokeStyle=PAL['card'];ctx.lineWidth=2;ctx.stroke();
    txt(ctx,'Now',mx+(n===5?-11:11),by+37,{s:11.5*k,w:700,c:PAL['cv-ink'],a:n===5?'right':'left',b:'middle'});
    let lx=bx;[['Births',PAL['s1']],['Deaths',PAL['s2']],['Pop.',PAL['s3']]].forEach(L=>{ctx.fillStyle=L[1];ctx.fillRect(lx,by+bH+16,12,4);txt(ctx,L[0],lx+16,by+bH+18,{s:11*k,c:PAL['cv-soft'],b:'middle'});lx+=78;});
    // key numbers
    const S=stats(s);const rows=[['Under 15',S.kids.toFixed(0)+'%'],['65 and older',S.old.toFixed(0)+'%'],['Growth',S.gr.toFixed(2)+'%/yr']];
    rows.forEach((r_,i)=>{txt(ctx,r_[0],bx,by+bH+52+i*22*Math.min(k,1.3),{s:12.5*k,c:PAL['cv-soft']});txt(ctx,r_[1],bx+bw,by+bH+52+i*22*Math.min(k,1.3),{s:13*k,w:700,a:'right'});});}
};
BioLab.register(HP);
})();
