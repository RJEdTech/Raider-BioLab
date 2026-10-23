(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;
/* Blood typing lab: drop anti-A, anti-B and anti-Rh sera on samples, read agglutination, infer type and genotype. */
const FREQ={A:0.26,B:0.08,i:0.66},DFREQ=0.6;
const SERA=[{id:'A',label:'Anti-A',col:'#2f6fd6',tag:'#2f6fd6'},{id:'B',label:'Anti-B',col:'#d9a400',tag:'#e0b100'},{id:'Rh',label:'Anti-Rh',col:'#8a8f98',tag:'#8a8f98'}];
const WELL={A:[296,250],B:[396,250],Rh:[496,250]};
const WR=(id,extra)=>[WELL[id][0]-50,WELL[id][1]-60,100,140+(extra||0)];
function drawAllele(r){const u=r();return u<FREQ.A?'A':u<FREQ.A+FREQ.B?'B':'i';}
function person(r){return {abo:[drawAllele(r),drawAllele(r)],rh:[r()<DFREQ?'D':'d',r()<DFREQ?'D':'d']};}
function abo(p){const s=p.abo.join('');return s.includes('A')&&s.includes('B')?'AB':s.includes('A')?'A':s.includes('B')?'B':'O';}
const rhPos=p=>p.rh.includes('D');
const type=p=>abo(p)+(rhPos(p)?'+':'−');
const has=(p,s)=>s==='Rh'?rhPos(p):abo(p).includes(s);
function genoTxt(p){const m={A:'Iᴬ',B:'Iᴮ',i:'i'};const a=p.abo.slice().sort((x,y)=>'ABi'.indexOf(x)-'ABi'.indexOf(y));return m[a[0]]+m[a[1]]+' '+(p.rh.slice().sort().join(''));}
const GENOS={A:['IᴬIᴬ','Iᴬi'],B:['IᴮIᴮ','Iᴮi'],AB:['IᴬIᴮ'],O:['ii']};
const AL={A:[['A','A'],['A','i']],B:[['B','B'],['B','i']],AB:[['A','B']],O:[['i','i']]};
const RHG={'+':[['D','D'],['D','d']],'−':[['d','d']]};
function possibleKids(t1,t2){const out=new Set();const [a1,r1]=[t1.slice(0,-1),t1.slice(-1)],[a2,r2]=[t2.slice(0,-1),t2.slice(-1)];
  AL[a1].forEach(g1=>AL[a2].forEach(g2=>RHG[r1].forEach(h1=>RHG[r2].forEach(h2=>{g1.forEach(x=>g2.forEach(y=>h1.forEach(u=>h2.forEach(v=>out.add(type({abo:[x,y],rh:[u,v]}))))));}))));return out;}
const ALLT=['O+','O−','A+','A−','B+','B−','AB+','AB−'];
/* red-cell compatibility: donor cells must not carry an antigen the recipient lacks */
const canGive=(d,r)=>{const da=d.slice(0,-1),ra=r.slice(0,-1);const okABO=da==='O'||ra==='AB'||da===ra;const okRh=d.endsWith('−')||r.endsWith('+');return okABO&&okRh;};
function B(sim){if(!sim._b)sim._b={ver:1,fam:1};return sim._b;}
function makePatients(ver){const r=rng(ver*313+11);let ps;let tries=0;do{ps=[0,1,2,3].map(()=>person(r));tries++;}while(new Set(ps.map(abo)).size<3&&tries<50);return ps;}
function makeFamily(ver){const r=rng(ver*733+5);const mom=person(r),dad=person(r);const g=(p)=>[p.abo[r()<.5?0:1],p.rh[r()<.5?0:1]];
  const a=g(mom),b=g(dad);let child={abo:[a[0],b[0]],rh:[a[1],b[1]]};const poss=possibleKids(type(mom),type(dad));
  const imp=ALLT.filter(t=>!poss.has(t));if(imp.length&&r()<0.5){const t=imp[Math.floor(r()*imp.length)];const ab=t.slice(0,-1),rh=t.slice(-1);child={abo:AL[ab][0].slice(),rh:RHG[rh][RHG[rh].length-1].slice()};}
  return {mom,dad,child,belongs:poss.has(type(child))};}
function makePop(ver){const r=rng(ver*97+3);const c={};ALLT.forEach(t=>c[t]=0);const people=[];for(let i=0;i<100;i++){const p=person(r);people.push(type(p));c[type(p)]++;}return {c,people};}
function cur(sim){const s=sim.st;return sim.p.view==='family'?s.fam.child:s.pat[sim.p.patient-1];}
function curKey(sim){return sim.p.view==='family'?'child':'p'+sim.p.patient;}
function tests(sim){const s=sim.st,k=curKey(sim);return s.tests[k]||(s.tests[k]={});}
function addSerum(sim,id){const t=tests(sim);if(t[id]===undefined){t[id]=sim.st.clock;sim.st.lastWell=id;sim.st.zoomSeed++;}else sim.st.lastWell=id;sim.infoDirty=true;}
function prog(sim,t){return t===undefined?0:clamp((sim.st.clock-t)/1.6,0,1);}
function reading(sim,id){const t=tests(sim)[id];if(t===undefined)return 'Not tested';if(prog(sim,t)<0.6)return 'Mixing…';return has(cur(sim),id)?'Clumps':'No clumping';}
function newPatients(sim){const b=B(sim);b.ver++;sim.st.pat=makePatients(b.ver);Object.keys(sim.st.tests).forEach(k=>{if(k[0]==='p')delete sim.st.tests[k];});sim.st.lastWell=null;}
function newFamily(sim){const b=B(sim);b.fam++;sim.st.fam=makeFamily(b.fam);delete sim.st.tests.child;sim.st.lastWell=null;}

function drawDrop(ctx,x,y,r,p,agg,seed,clumps){const R=rng(seed);
  // a drop of blood mixed with serum; agglutination = dark clumps on a clearer background
  ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.clip();
  const base=agg?`rgba(200,40,50,${1-0.55*p})`:'#c8282f';ctx.fillStyle=base;ctx.fillRect(x-r,y-r,2*r,2*r);
  if(agg&&p>0){ctx.fillStyle=`rgba(120,10,20,${0.9*p})`;for(let i=0;i<clumps;i++){const a=R()*6.28,d=Math.sqrt(R())*r*0.85,s=2+R()*5*p;ctx.beginPath();ctx.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,s,0,6.29);ctx.fill();}}
  else{ctx.fillStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.ellipse(x-r*0.3,y-r*0.35,r*0.35,r*0.18,-0.5,0,6.29);ctx.fill();}
  ctx.restore();}
function drawCellAg(ctx,x,y,rad,p){ctx.fillStyle='#d63a40';ctx.beginPath();ctx.arc(x,y,rad,0,6.29);ctx.fill();ctx.fillStyle='rgba(120,10,20,.35)';ctx.beginPath();ctx.arc(x,y,rad*0.45,0,6.29);ctx.fill();
  const ag=[];if(abo(p).includes('A'))ag.push('A');if(abo(p).includes('B'))ag.push('B');if(rhPos(p))ag.push('Rh');
  const n=10;for(let i=0;i<n;i++){const a=i/n*6.28+0.2,kind=ag[i%Math.max(1,ag.length)];if(!ag.length)break;const ex=x+Math.cos(a)*(rad+3),ey=y+Math.sin(a)*(rad+3);
    if(kind==='A'){ctx.fillStyle='#2f6fd6';ctx.beginPath();ctx.moveTo(ex,ey-3.5);ctx.lineTo(ex+3.2,ey+2.5);ctx.lineTo(ex-3.2,ey+2.5);ctx.closePath();ctx.fill();}
    else if(kind==='B'){ctx.fillStyle='#e0a800';ctx.fillRect(ex-2.8,ey-2.8,5.6,5.6);}
    else{ctx.fillStyle='#5b5f66';ctx.beginPath();ctx.arc(ex,ey,2.4,0,6.29);ctx.fill();}}}
function drawY(ctx,x,y,a,col){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.strokeStyle=col;ctx.lineWidth=2.2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,6);ctx.lineTo(0,0);ctx.lineTo(-4,-5);ctx.moveTo(0,0);ctx.lineTo(4,-5);ctx.stroke();ctx.restore();}

const BLOOD={
  id:'bloodtype',hash:'bloodtype',apUnit:5,order:4,tab:'Blood typing lab',kind:'Virtual lab',
  card:'Drop antibody serums on blood samples, watch for clumping, and work out each patient’s blood type.',
  title:'Blood typing lab: ABO and Rh',
  lede:{bio:'Each serum has antibodies that grab one kind of marker (antigen) on red blood cells. If the marker is there, the blood clumps. Test each patient and work out their blood type.',
        honors:'Blood type shows codominance (Iᴬ and Iᴮ) and multiple alleles. Use blood types to decide whether a child could belong to a family.',
        ap:'Use Hardy–Weinberg to estimate ABO allele frequencies from a population sample.'},
  scale:'Each drop is about 50 µL of blood; a red blood cell is about 8 µm across. The zoom shows a few cells and the antibodies grabbing them.',
  timeless:true,animated:true,graph:false,
  prereq:['crosses'],next:['pedigree','hardyweinberg'],
  controls:[
    {id:'view',label:'What you are testing',type:'seg',def:'lab',lvl:'honors',options:[{v:'lab',l:'Patients'},{v:'family',l:'Family case'},{v:'pop',l:'Population',lvl:'ap'}],onChange(sim){sim.st.lastWell=null;}},
    {id:'patient',label:'Patient',type:'seg',def:1,lvl:'bio',options:[{v:1,l:'1'},{v:2,l:'2'},{v:3,l:'3'},{v:4,l:'4'}],onChange(sim){sim.st.lastWell=null;}}
  ],
  controlsTitle:'Sample and serums',
  actions:[
    {id:'a',label:'Add anti-A',primary:true,run(sim){if(sim.p.view!=='pop')addSerum(sim,'A');}},
    {id:'b',label:'Add anti-B',primary:true,run(sim){if(sim.p.view!=='pop')addSerum(sim,'B');}},
    {id:'rh',label:'Add anti-Rh',primary:true,run(sim){if(sim.p.view!=='pop')addSerum(sim,'Rh');}},
    {id:'clean',label:'Clean the tray',run(sim){delete sim.st.tests[curKey(sim)];sim.st.lastWell=null;}},
    {id:'newp',label:'New patients',run(sim){newPatients(sim);}},
    {id:'newf',label:'New family',lvl:'honors',run(sim){newFamily(sim);}},
    {id:'pop',label:'Sample 100 people',lvl:'ap',run(sim){const b=B(sim);b.pop=(b.pop||0)+1;sim.st.pop=makePop(b.pop);}}
  ],
  init(sim){const b=B(sim);return {clock:0,pat:makePatients(b.ver),fam:makeFamily(b.fam),pop:null,tests:{},lastWell:null,zoomSeed:1};},
  step(sim,dt){sim.st.clock+=dt;},
  onClick(sim,x,y){if(sim.p.view==='pop')return;for(const s of SERA){const w=WELL[s.id];if(Math.hypot(x-w[0],y-w[1])<46){addSerum(sim,s.id);return;}}
    if(sim.p.view==='lab'){for(let i=0;i<4;i++){const tx=56+i*48;if(x>tx-20&&x<tx+20&&y>110&&y<330){BioLab.setValues(sim,{patient:i+1});return;}}}},
  metrics:[
    {id:'ra',label:'Anti-A well',lvl:'bio',text:true,get:s=>s.p.view==='pop'?'—':reading(s,'A')},
    {id:'rb',label:'Anti-B well',lvl:'bio',text:true,get:s=>s.p.view==='pop'?'—':reading(s,'B')},
    {id:'rr',label:'Anti-Rh well',lvl:'bio',text:true,get:s=>s.p.view==='pop'?'—':reading(s,'Rh')},
    {id:'po',label:'Type O in sample',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>s.st.pop?s.st.pop.c['O+']+s.st.pop.c['O−']:NaN},
    {id:'pi',label:'Estimated i allele',unit:'frequency',lvl:'ap',min:0,max:1,d:2,get:s=>s.st.pop?Math.sqrt((s.st.pop.c['O+']+s.st.pop.c['O−'])/100):NaN},
    {id:'prh',label:'Rh− in sample',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>s.st.pop?ALLT.filter(t=>t.endsWith('−')).reduce((a,t)=>a+s.st.pop.c[t],0):NaN}
  ],
  challengeTitle:'Interpret the results',
  challenges(sim){const s=sim.st,p1=s.pat[0],t1=type(p1),r=rng(B(sim).ver*41);
    const d=ALLT.filter(t=>t!==t1);for(let i=d.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[d[i],d[j]]=[d[j],d[i]];}
    const o1=[t1,...d.slice(0,3)];for(let i=o1.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[o1[i],o1[j]]=[o1[j],o1[i]];}
    const f=s.fam,ft=type(f.mom),dt=type(f.dad),ct=type(f.child);
    const fe=f.belongs?`A ${ft} mother and a ${dt} father can have a ${ct} child (for example ${genoTxt(f.mom)} × ${genoTxt(f.dad)}). Blood types can only rule a parent out; they can’t prove parentage.`
      :`No combination of genotypes for a ${ft} mother and a ${dt} father can give a ${ct} child. ${(()=>{const pa=ft.slice(0,-1),pb=dt.slice(0,-1),ca=ct.slice(0,-1);if(ca==='O'&&(pa==='AB'||pb==='AB'))return 'An AB parent always passes on Iᴬ or Iᴮ, so the child can’t be type O.';if(ca==='AB'&&!(['A','AB'].includes(pa)||['A','AB'].includes(pb)))return 'Neither parent has an Iᴬ allele to give.';if(ct.endsWith('+')&&ft.endsWith('−')&&dt.endsWith('−'))return 'Two Rh− parents are both dd, so they can only have Rh− children.';return 'Check which alleles each parent can pass on.';})()}`;
    return [
      {lvl:'bio',instant:true,q:'Test Patient 1 with all three serums. What is Patient 1’s blood type?',choices:o1,correct:o1.indexOf(t1),
       explain:`Patient 1 is ${t1}. ${has(p1,'A')?'The anti-A well clumps, so the cells carry A antigens. ':'The anti-A well stays smooth: no A antigens. '}${has(p1,'B')?'The anti-B well clumps: B antigens. ':'The anti-B well stays smooth: no B antigens. '}${rhPos(p1)?'Anti-Rh clumps, so Rh positive.':'Anti-Rh stays smooth, so Rh negative.'}`},
      {lvl:'bio',instant:true,q:'A sample clumps with anti-A and anti-B, but not with anti-Rh. What type is it?',choices:['AB−','AB+','O−','A+'],correct:0,
       explain:'Clumping with both anti-A and anti-B means the cells carry both A and B antigens: type AB. No clumping with anti-Rh means Rh negative.'},
      {lvl:'bio',instant:true,q:'In an emergency, which red blood cells can be given to almost any patient?',choices:['O−','AB+','A+','O+'],correct:0,
       explain:'O− cells carry no A, B or Rh antigens, so a recipient’s antibodies have nothing to grab. That makes O− the universal red-cell donor. AB+ patients can receive any type.'},
      {lvl:'honors',instant:true,q:'Can a parent with type AB blood have a type O child?',choices:['No','Yes, if the other parent is type O','Yes, but only if Rh negative'],correct:0,
       explain:'Type O needs genotype ii. An AB parent (IᴬIᴮ) always passes on either Iᴬ or Iᴮ, never i, so their child can’t be type O.'},
      {lvl:'honors',instant:true,q:'Two Rh-positive parents have an Rh-negative child. Is that possible?',choices:['Yes, if both parents are Dd','No, Rh+ is dominant','Only if the mother is Dd'],correct:0,
       explain:'Rh+ is dominant, so an Rh+ parent can be DD or Dd. Two Dd parents have a 1 in 4 chance of a dd (Rh−) child.'},
      {lvl:'honors',instant:true,q:`Switch to Family case and test the child. The mother is ${ft} and the father is ${dt}. Could this child belong to them?`,choices:['Yes, it is possible','No, it is impossible'],correct:f.belongs?0:1,
       explain:`The child is ${ct}. ${fe}`},
      {lvl:'honors',instant:true,q:'A person with type A blood has which antibodies in their plasma?',choices:['Anti-B','Anti-A','Both anti-A and anti-B','Neither'],correct:0,
       explain:'You make antibodies against the ABO antigens you don’t have. Type A has A antigens, so the plasma carries anti-B. Type O plasma has both anti-A and anti-B.'},
      {lvl:'ap',instant:true,q:'In a population, 49% of people are type O. Assuming Hardy–Weinberg equilibrium, what is the frequency of the i allele?',choices:['0.70','0.49','0.24','0.51'],correct:0,
       explain:'Type O is ii, so its frequency is r². r = √0.49 = 0.70. Try Sample 100 people and compare the estimate with the real US value of about 0.66.'},
      {lvl:'ap',instant:true,q:'A type O patient is given type A red cells by mistake. What happens?',choices:['The patient’s anti-A antibodies clump the donor cells','The donor’s anti-B antibodies attack the patient','Nothing; O patients can receive any type'],correct:0,
       explain:'Type O plasma contains anti-A and anti-B. They bind the A antigens on the donated cells, clumping and destroying them: a dangerous transfusion reaction.'}
    ];},
  infoPanel(sim){const s=sim.st,v=sim.p.view,hon=atLeast('honors');let h='';
    if(v==='pop'){if(!s.pop)return '<h3>Population sample</h3><p>Press <b>Sample 100 people</b> to type a random group of 100 people.</p>';
      const c=s.pop.c,O=(c['O+']+c['O−'])/100,A=(c['A+']+c['A−'])/100,Bt=(c['B+']+c['B−'])/100,rr_=Math.sqrt(O),p_=1-Math.sqrt(Bt+O),q_=1-Math.sqrt(A+O);
      h+=`<h3>Population sample (100 people)</h3><div class="tbl-wrap"><table><thead><tr><th>Type</th>${ALLT.map(t=>`<th>${t}</th>`).join('')}</tr></thead><tbody><tr><td>People</td>${ALLT.map(t=>`<td>${c[t]}</td>`).join('')}</tr></tbody></table></div>
      <p style="margin-top:8px"><b>Hardy–Weinberg estimates:</b> i: r = √(O) = ${rr_.toFixed(2)} · Iᴬ: p = 1 − √(B + O) = ${p_.toFixed(2)} · Iᴮ: q = 1 − √(A + O) = ${q_.toFixed(2)}</p><p class="help">The simulated population uses p = 0.26, q = 0.08, r = 0.66, close to the US average.</p>`;return h;}
    const p=cur(sim),t=tests(sim),done=['A','B','Rh'].every(id=>t[id]!==undefined&&prog(sim,t[id])>=0.6);
    if(v==='family'){const f=s.fam;h+=`<h3>Family case</h3><p>Mother: <b>${type(f.mom)}</b> · Father: <b>${type(f.dad)}</b> · Child: ${done?'<b>'+type(f.child)+'</b>':'test the child’s blood'}</p>`;
      if(hon)h+=`<p>Possible genotypes: mother ${GENOS[abo(f.mom)].join(' or ')}; father ${GENOS[abo(f.dad)].join(' or ')}.</p>`;}
    else h+=`<h3>Patient ${sim.p.patient}</h3><p>${done?`All three wells read. Decide the type from the clumping.`:'Add each serum and watch the wells.'}</p>`;
    h+=`<div class="tbl-wrap"><table><thead><tr><th>Type</th><th>Antigens on cells</th><th>Antibodies in plasma</th>${hon?'<th>Genotypes</th>':''}<th>Can receive cells from</th></tr></thead><tbody>${['A','B','AB','O'].map(a=>`<tr><td>${a}</td><td>${a==='O'?'none':a==='AB'?'A and B':a}</td><td>${a==='A'?'anti-B':a==='B'?'anti-A':a==='AB'?'none':'anti-A, anti-B'}</td>${hon?`<td>${GENOS[a].join(', ')}</td>`:''}<td>${a==='AB'?'A, B, AB, O':a==='O'?'O':a+', O'}</td></tr>`).join('')}</tbody></table></div><p class="help">Rh: Rh− patients should receive only Rh− cells. Rh+ patients can receive either.</p>`;
    return h;},
  narrate(sim){const v=sim.p.view;if(v==='pop')return sim.st.pop?'Each square is one person’s blood type. Type O is most common because the i allele is the most common allele, even though it is recessive.':'Sample a population to see how common each blood type is.';
    const t=tests(sim),p=cur(sim),ids=['A','B','Rh'].filter(id=>t[id]!==undefined);const who=v==='family'?'the child':'Patient '+sim.p.patient;
    if(!ids.length)return `Add a serum to ${who}’s blood. Each serum contains antibodies that stick to one kind of antigen on red blood cells.`;
    const last=sim.st.lastWell||ids[ids.length-1],pr=prog(sim,t[last]);if(pr<0.6)return 'Mixing… watch the well.';
    const s=SERA.find(x=>x.id===last),hit=has(p,last);
    return hit?`<b>The ${s.label} well clumps.</b> The antibodies grab the ${last==='Rh'?'Rh':last} antigens on the red cells and link them together, so ${who} has ${last==='Rh'?'Rh-positive':last+' antigen'} blood cells.`
      :`<b>The ${s.label} well stays smooth.</b> ${who[0].toUpperCase()+who.slice(1)}’s cells have no ${last==='Rh'?'Rh':last} antigen, so the antibodies have nothing to grab.`;},
  tour:[
    {title:'The samples',text:'Each tube holds a little blood from one patient. You will test the blood of Patient 1.',focus:[22,96,200,250],pause:true,setup(sim){BioLab.setValues(sim,{patient:1});sim.st.pat[0]={abo:['A','i'],rh:['D','d']};delete sim.st.tests.p1;}},
    {title:'The typing tray',text:'Each well gets a drop of blood plus a drop of serum. Anti-A serum holds antibodies that grab A antigens; anti-B grabs B antigens; anti-Rh grabs the Rh (D) antigen.',focus:[230,150,332,190],pause:true},
    {title:'Add anti-A',text:'Watch the anti-A well. These cells carry A antigens, so the antibodies link the cells together into visible clumps: agglutination.',focus:[WR('A'),[578,124,212,212]],speed:1,setup(sim){addSerum(sim,'A');}},
    {title:'What the clumps are',text:'Each antibody is Y-shaped with two arms, so it can hold two cells at once. Millions of these bridges pull the cells into clumps you can see.',focus:[578,124,212,212],speed:1},
    {title:'Add anti-B',text:'No clumping: these cells have no B antigens, so the anti-B antibodies have nothing to grab. The well stays smooth.',focus:[WR('B'),[578,124,212,212]],speed:1,setup(sim){addSerum(sim,'B');}},
    {title:'Add anti-Rh',text:'Clumping again: the cells carry the Rh antigen. Putting it together: A antigens, no B, Rh positive. This patient is type A+.',focus:[WR('Rh'),[578,124,212,212]],speed:1,setup(sim){addSerum(sim,'Rh');}},
    {lvl:'honors',title:'Genotype from type',text:'Type A could be IᴬIᴬ or Iᴬi, because i is recessive. Iᴬ and Iᴮ are codominant, so IᴬIᴮ is type AB. Rh+ could be DD or Dd.',focus:[230,150,332,190],pause:true}
  ],
  onTourExit(sim){BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> What are the blood types of four patients?</p><ol><li>For each patient, add anti-A, anti-B and anti-Rh.</li><li>Record a trial when all three wells have been read.</li><li>Use the table to decide each type, and who each patient could safely receive blood from.</li></ol><p>Explain what clumping tells you about the red blood cells.</p>',
       honors:'<p><b>Question:</b> Could this child belong to this family?</p><ol><li>Switch to Family case and test the child.</li><li>Write every possible genotype for each parent.</li><li>Make Punnett squares to see which child types are possible.</li></ol><p>Explain why blood types can rule a parent out but can never prove parentage.</p>',
       ap:'<p><b>Question:</b> What are the ABO allele frequencies in a population?</p><ol><li>Sample 100 people three times and average the counts.</li><li>Estimate r from type O, then p and q.</li><li>Compare your estimates with the true values in the info panel.</li></ol><p><b>Claim–evidence–reasoning:</b> Why is type O common even though i is recessive?</p>'},
  terms:[{t:'Antigen',d:'A marker molecule on the surface of a cell, such as the A, B and Rh antigens on red blood cells.'},{t:'Antibody',d:'A Y-shaped protein that binds one specific antigen.'},{t:'Agglutination',d:'Clumping of cells when antibodies link them together.'},{t:'Universal donor',d:'O− red cells, which carry no A, B or Rh antigens.'},
    {lvl:'honors',t:'Codominance',d:'Both alleles show in the phenotype. Iᴬ and Iᴮ together give type AB.'},{lvl:'honors',t:'Multiple alleles',d:'A gene with more than two alleles in the population, like Iᴬ, Iᴮ and i.'},
    {lvl:'ap',t:'Hardy–Weinberg',d:'With three alleles: p + q + r = 1, and type O frequency = r².'},{lvl:'ap',t:'Hemolytic disease of the newborn',d:'When an Rh− mother makes anti-Rh antibodies that attack an Rh+ baby’s red cells.'}],
  about:'<p>Each patient’s genotype is drawn at random using allele frequencies close to the US population (Iᴬ 0.26, Iᴮ 0.08, i 0.66; D 0.6). A well clumps if, and only if, the cells carry the antigen the serum’s antibodies recognize. Real classroom kits often use simulated blood, which behaves the same way.</p><p>Simplifications: real agglutination can be weak (for example in some A subtypes), the Rh system has many antigens besides D, and blood banks also cross-match donor and patient blood before a transfusion. Family cases assume no new mutations.</p>',
  draw(sim,ctx,vdt,k,t){const s=sim.st,v=sim.p.view,ink=PAL['cv-ink'];ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(v==='pop'){txt(ctx,'Population sample: 100 people',24,30,{s:15*k,w:700});
      if(!s.pop){txt(ctx,'Press “Sample 100 people” to type a random group.',400,225,{s:15*k,c:PAL['cv-soft'],a:'center'});return;}
      const cols={'O':'#c8282f','A':'#2f6fd6','B':'#d9a400','AB':'#7b3fe4'};s.pop.people.forEach((tp,i)=>{const x=40+(i%20)*30,y=60+Math.floor(i/20)*44;rr(ctx,x,y,26,34,6);ctx.fillStyle=cols[tp.slice(0,-1)];ctx.fill();txt(ctx,tp,x+13,y+21,{s:10*k,w:700,c:'#fff',a:'center'});});
      let lx=40;['O','A','B','AB'].forEach(a=>{ctx.fillStyle=cols[a];ctx.fillRect(lx,300,14,14);const n=s.pop.c[a+'+']+s.pop.c[a+'−'];txt(ctx,`Type ${a}: ${n}`,lx+20,312,{s:13*k,w:600});lx+=140;});
      return;}
    // tubes
    const fam=v==='family';const tubes=fam?[{l:'Mother',sub:type(s.fam.mom)},{l:'Father',sub:type(s.fam.dad)},{l:'Child',sub:'?'}]:[1,2,3,4].map(i=>({l:String(i),sub:''}));
    if(!fam)txt(ctx,'Patients',128,92,{s:12.5*k,w:700,a:'center',c:PAL['cv-soft']});
    tubes.forEach((tb,i)=>{const x=56+i*(fam?62:48),selI=fam?2:sim.p.patient-1,sel=i===selI;
      ctx.fillStyle=PAL['card'];ctx.strokeStyle=sel?'#C11430':PAL['cv-soft'];ctx.lineWidth=sel?3:1.5;rr(ctx,x-14,110,28,200,12);ctx.fill();ctx.stroke();
      ctx.fillStyle='#b8222a';rr(ctx,x-12,200,24,108,10);ctx.fill();ctx.fillStyle='#e9d36a';ctx.fillRect(x-12,190,24,14);
      ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(x-16,100,32,12);
      txt(ctx,tb.l,x,336,{s:(fam?11.5:14)*k,w:sel?700:500,a:'center',c:sel?ink:PAL['cv-soft']});if(tb.sub)txt(ctx,tb.sub,x,354,{s:12*k,w:700,a:'center',c:ink});});
    // tray
    ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;rr(ctx,236,180,320,150,18);ctx.fill();ctx.stroke();
    txt(ctx,fam?'Typing tray: the child’s blood':'Typing tray: Patient '+sim.p.patient,396,168,{s:13*k,w:700,a:'center'});
    const p=cur(sim),ts=tests(sim);
    SERA.forEach(se=>{const [x,y]=WELL[se.id];ctx.fillStyle=PAL['card2'];ctx.beginPath();ctx.arc(x,y,42,0,6.29);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
      pill(ctx,se.label,x,y+60,se.tag,'#fff',12*k);
      const tt=ts[se.id];if(tt!==undefined){const pr=prog(sim,tt),ag=has(p,se.id);drawDrop(ctx,x,y,34,pr,ag,Math.round(tt*1000)+se.id.length,60);
        if(pr<0.35){const dy=(0.35-pr)/0.35*60;ctx.fillStyle=se.col;ctx.beginPath();ctx.arc(x,y-34-dy,6,0,6.29);ctx.fill();}}
      else txt(ctx,'empty',x,y+4,{s:12*k,c:PAL['cv-soft'],a:'center'});});
    // zoom inset
    const zx=684,zy=230,zr=100;ctx.fillStyle=PAL['card'];ctx.beginPath();ctx.arc(zx,zy,zr+4,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.stroke();
    txt(ctx,'Zoom: red blood cells',zx,zy+zr+24,{s:12*k,w:700,a:'center'});
    ctx.save();ctx.beginPath();ctx.arc(zx,zy,zr,0,6.29);ctx.clip();ctx.fillStyle='#f6ece6';ctx.fillRect(zx-zr,zy-zr,2*zr,2*zr);
    const lw=s.lastWell,tt=lw?ts[lw]:undefined,pr=tt!==undefined?prog(sim,tt):0,agg=lw&&has(p,lw),R=rng(s.zoomSeed*17+(lw?lw.length:0));
    const centers=[[zx-35,zy-25],[zx+30,zy+20],[zx-10,zy+45]];
    for(let i=0;i<14;i++){const a=R()*6.28,d=Math.sqrt(R())*zr*0.78,hx=zx+Math.cos(a)*d,hy=zy+Math.sin(a)*d,c=centers[i%3];const m=agg?pr*0.7:0;
      const x=hx+(c[0]-hx)*m+(c[0]-hx===0?0:(R()-.5)*14*m),y=hy+(c[1]-hy)*m+(R()-.5)*14*m;drawCellAg(ctx,x,y,11,p);}
    if(lw&&tt!==undefined){const se=SERA.find(x=>x.id===lw);const n=agg?Math.round(10*pr):6;for(let i=0;i<n;i++){const c=centers[i%3];const x=agg?c[0]+(R()-.5)*30:zx+(R()-.5)*1.6*zr*0.7,y=agg?c[1]+(R()-.5)*30:zy+(R()-.5)*1.6*zr*0.7;drawY(ctx,x,y,R()*6.28,se.col);}}
    ctx.restore();
    if(!lw)txt(ctx,'Add a serum to see the antibodies',zx,zy+4,{s:11.5*k,c:PAL['cv-soft'],a:'center'});
    // legend
    const ly=436;let lx=236;const item=(draw,label)=>{draw(lx,ly-4);txt(ctx,label,lx+10,ly,{s:11.5*k,c:PAL['cv-soft']});ctx.font='400 '+11.5*k+'px '+FONT;lx+=ctx.measureText(label).width+30;};
    item((x,y)=>{ctx.fillStyle='#2f6fd6';ctx.beginPath();ctx.moveTo(x,y-4);ctx.lineTo(x+4,y+3);ctx.lineTo(x-4,y+3);ctx.closePath();ctx.fill();},'A antigen');
    item((x,y)=>{ctx.fillStyle='#e0a800';ctx.fillRect(x-3,y-3,6,6);},'B antigen');
    item((x,y)=>{ctx.fillStyle='#5b5f66';ctx.beginPath();ctx.arc(x,y,3,0,6.29);ctx.fill();},'Rh antigen');
    item((x,y)=>drawY(ctx,x,y+2,0,'#2f6fd6'),'antibody');}
};
BioLab.register(BLOOD);
})();
