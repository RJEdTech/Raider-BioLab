(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;
/* Karyotype detective: pair 46 (or 45/47) metaphase chromosomes by size, centromere and banding, then diagnose. */
// length in megabases, centromere index (p arm / total), acrocentric satellites
const CH={1:[248,.48],2:[242,.39],3:[198,.47],4:[190,.29],5:[181,.27],6:[171,.39],7:[159,.36],8:[145,.34],9:[138,.35],10:[134,.32],11:[135,.40],12:[133,.27],
  13:[114,.17,1],14:[107,.17,1],15:[102,.18,1],16:[90,.43],17:[83,.33],18:[80,.29],19:[59,.47],20:[64,.45],21:[47,.23,1],22:[51,.25,1],X:[156,.39],Y:[57,.26]};
const NUMS=['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','X','Y'];
const SC=0.28;
const ROWS=[{n:['1','2','3','4','5'],yc:318,lab:372},{n:['6','7','8','9','10','11','12','X'],yc:404,lab:450},{n:['13','14','15','16','17','18'],yc:472,lab:516},{n:['19','20','21','22','Y'],yc:544,lab:582}];
const SLOT={};ROWS.forEach(r=>{const W=84,x0=400-r.n.length*W/2;r.n.forEach((n,i)=>{SLOT[n]={x:x0+i*W+W/2,yc:r.yc,lab:r.lab,x0:x0+i*W+4,x1:x0+(i+1)*W-4,y0:r.yc-46,y1:r.lab+8};});});
const CASES={
  F:{name:'Typical female (46,XX)',short:'46,XX',lvl:'bio',sex:'F',extra:[],miss:[],sx:['X','X'],info:'A typical karyotype: 22 pairs of autosomes plus two X chromosomes.'},
  M:{name:'Typical male (46,XY)',short:'46,XY',lvl:'bio',sex:'M',extra:[],miss:[],sx:['X','Y'],info:'A typical karyotype: 22 pairs of autosomes plus one X and one Y.'},
  T21:{name:'Down syndrome (trisomy 21)',short:'47,+21',lvl:'bio',extra:['21'],miss:[],info:'Three copies of chromosome 21. It causes intellectual disability, distinctive facial features and often heart defects. About 1 in 700 births; the chance rises with the mother’s age.'},
  T18:{name:'Edwards syndrome (trisomy 18)',short:'47,+18',lvl:'honors',extra:['18'],miss:[],info:'Three copies of chromosome 18. It causes severe heart and organ problems; most babies live less than a year. About 1 in 5,000 births.'},
  T13:{name:'Patau syndrome (trisomy 13)',short:'47,+13',lvl:'honors',extra:['13'],miss:[],info:'Three copies of chromosome 13. It causes severe brain and heart defects, cleft lip and extra fingers; most babies survive only days or weeks. About 1 in 10,000 births.'},
  TUR:{name:'Turner syndrome (45,X)',short:'45,X',lvl:'honors',sex:'F',extra:[],miss:[],sx:['X'],info:'Only one X chromosome and no Y. These girls are usually short and infertile, sometimes with heart defects. It is the only monosomy that people survive. About 1 in 2,500 girls.'},
  KLI:{name:'Klinefelter syndrome (47,XXY)',short:'47,XXY',lvl:'honors',sex:'M',extra:[],miss:[],sx:['X','X','Y'],info:'Two X chromosomes plus a Y. These boys are often tall, with low testosterone and reduced fertility. About 1 in 650 boys, and many are never diagnosed.'},
  XXX:{name:'Triple X (47,XXX)',short:'47,XXX',lvl:'ap',sex:'F',extra:[],miss:[],sx:['X','X','X'],info:'Three X chromosomes. Usually healthy girls, sometimes taller, with a higher chance of learning differences. Only one X stays active in each cell; the others are inactivated. About 1 in 1,000 girls.'},
  XYY:{name:'47,XYY',short:'47,XYY',lvl:'ap',sex:'M',extra:[],miss:[],sx:['X','Y','Y'],info:'An extra Y chromosome. Usually healthy boys, often taller than average. About 1 in 1,000 boys.'}
};
const LV={bio:0,honors:1,ap:2};
const casesAtLevel=()=>Object.keys(CASES).filter(k=>LV[CASES[k].lvl]<=LV[BioLab.level]);
function bands(n){const L=CH[n][0],r=rng(1000+NUMS.indexOf(n)*37),out=[];let f=0.03;const ci=CH[n][1];
  while(f<0.95){const w=0.025+r()*0.055;if(Math.abs(f+w/2-ci)>0.045&&r()<0.62)out.push([f,Math.min(0.97,f+w)]);f+=w+0.02+r()*0.05;}
  if(CH[n][2])out.unshift([0.0,ci*0.45]);return out;}
const BANDS={};NUMS.forEach(n=>BANDS[n]=bands(n));
function S(sim){if(!sim._k)sim._k={code:'T21',ver:1,sex21:'M'};return sim._k;}
function caseSex(sim){const k=S(sim),c=CASES[k.code];return c.sex||k.sex21;}
function build(sim){const k=S(sim),c=CASES[k.code],r=rng(k.ver*131+7);const nums=[];for(let i=1;i<=22;i++)nums.push(String(i),String(i));c.extra.forEach(n=>nums.push(n));
  (c.sx||(k.sex21==='M'?['X','Y']:['X','X'])).forEach(n=>nums.push(n));
  // shuffle into spread cells
  const cells=[];for(let row=0;row<5;row++)for(let col=0;col<10;col++)cells.push([60+col*75+(r()-.5)*16,78+row*41+(r()-.5)*8]);
  for(let i=cells.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}
  const chs=nums.map((n,i)=>{const L=CH[n][0]*SC,a=L>40?Math.PI/2+(r()-.5)*0.7:r()*Math.PI;return {i,n,home:{x:cells[i][0],y:cells[i][1],a},x:cells[i][0],y:cells[i][1],a,slot:null};});
  return {chs,sel:-1,checked:false,revealed:false,ver:k.ver,msg:''};}
function slotPos(st,ch){const inS=st.chs.filter(c=>c.slot===ch.slot),j=inS.indexOf(ch),s=SLOT[ch.slot];return {x:s.x+(j-(inS.length-1)/2)*15,y:s.yc,a:0};}
function target(st,ch){return ch.slot?slotPos(st,ch):ch.home;}
function place(sim,slot){const st=sim.st;const ch=st.chs[st.sel];if(!ch||!SLOT[slot])return;ch.slot=slot;st.checked=false;st.msg='';
  const nx=st.chs.find((c,i)=>i>st.sel&&!c.slot)||st.chs.find(c=>!c.slot);st.sel=nx?nx.i:-1;sim.infoDirty=true;}
function hitChrom(st,x,y){for(let i=st.chs.length-1;i>=0;i--){const c=st.chs[i],L=CH[c.n][0]*SC,p=L*CH[c.n][1],dx=x-c.x,dy=y-c.y,ca=Math.cos(-c.a),sa=Math.sin(-c.a),lx=dx*ca-dy*sa,ly=dx*sa+dy*ca;
  if(Math.abs(lx)<9&&ly>-p-5&&ly<L-p+5)return c;}return null;}
function drawChrom(ctx,c,sel,mark){const n=c.n,L=CH[n][0]*SC,ci=CH[n][1],p=L*ci,q=L-p,w=4.6;
  ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.a);
  [-1,1].forEach(sd=>{const ox=sd*(w/2+0.5);
    const path=new Path2D();const add=(x,y,ww,hh,r)=>{r=Math.min(r,ww/2,hh/2);path.moveTo(x+r,y);path.arcTo(x+ww,y,x+ww,y+hh,r);path.arcTo(x+ww,y+hh,x,y+hh,r);path.arcTo(x,y+hh,x,y,r);path.arcTo(x,y,x+ww,y,r);path.closePath();};
    add(ox-w/2,-p,w,Math.max(2,p-1.4),2.3);add(ox-w/2,1.4,w,Math.max(2,q-1.4),2.3);
    ctx.save();ctx.fillStyle='#ddd3e8';ctx.fill(path);ctx.clip(path);ctx.fillStyle='#4a3a5c';BANDS[n].forEach(b=>{ctx.fillRect(ox-w,-p+b[0]*L,w*2,(b[1]-b[0])*L);});ctx.restore();
    ctx.strokeStyle='#6d5d82';ctx.lineWidth=0.8;ctx.stroke(path);});
  ctx.fillStyle='#6d5d82';ctx.fillRect(-w,-0.8,w*2,1.6);
  if(CH[n][2]){ctx.fillStyle='#bfb1d2';[-1,1].forEach(sd=>{ctx.beginPath();ctx.arc(sd*(w/2+0.5),-p-3.2,1.8,0,6.29);ctx.fill();});}
  if(sel||mark){ctx.strokeStyle=sel?'#C11430':(mark==='ok'?'#1b8a4a':'#d97a00');ctx.lineWidth=2.4;ctx.beginPath();rr(ctx,-w-4,-p-6,2*w+8,L+12,6);ctx.stroke();}
  ctx.restore();}
function describe(n){const L=CH[n][0],ci=CH[n][1];const size=L>180?'very large':L>130?'large':L>95?'medium':L>70?'small':'very small';
  const cen=CH[n][2]?'its centromere is very close to one end (acrocentric), with tiny knobs (satellites) on the short arm':n==='Y'?'its centromere is near one end and it has no satellites':ci>0.42?'its centromere is near the middle (metacentric)':'its centromere is off-center (submetacentric)';
  return `This chromosome is ${size} (about ${L} million base pairs), and ${cen}.`;}

const KARYO={
  id:'karyotype',hash:'karyotype',apUnit:5,order:3,tab:'Karyotype detective',kind:'Learning tool',
  card:'Sort a real-looking chromosome spread into pairs, count them, and diagnose the patient.',
  title:'Karyotype detective: count and pair the chromosomes',
  lede:{bio:'A karyotype is a picture of a person’s chromosomes arranged in pairs. Sort them by size and shape, count them, and find out whether anything is missing or extra.',
        honors:'Seven possible patients, including trisomies and sex-chromosome conditions. Use size, centromere position and banding to pair the chromosomes, then diagnose.',
        ap:'Connect each karyotype to the meiotic error that could produce it, and to whether it happened in meiosis I or II.'},
  scale:'Chromosomes from one white blood cell, stopped in metaphase. The largest, chromosome 1, is about 10 µm long; the whole spread is about 0.05 mm across.',
  aspect:4/3,timeless:true,animated:true,graph:false,trials:false,
  prereq:['division'],next:['pedigree'],
  controls:[
    {id:'slot',label:'Place the selected chromosome in',type:'select',def:'1',lvl:'bio',noTrial:true,options:NUMS.map(n=>({v:n,l:n==='X'||n==='Y'?n+' (sex chromosome)':'Pair '+n})),help:'Then press Place. Or click a chromosome, then click its spot in the karyogram.'},
    {id:'nums',label:'Show numbers on the spread',type:'toggle',def:false,lvl:'bio',noTrial:true,help:'A hint for checking your work'}
  ],
  actions:[
    {id:'nextc',label:'Select next chromosome',run(sim){const st=sim.st,n=st.chs.length;for(let j=1;j<=n;j++){const c=st.chs[(Math.max(st.sel,0)+j)%n];if(!c.slot){st.sel=c.i;return;}}st.sel=(st.sel+1)%n;}},
    {id:'place',label:'Place',primary:true,run(sim){place(sim,sim.p.slot);}},
    {id:'check',label:'Check my karyogram',run(sim){const st=sim.st;st.checked=true;const pl=st.chs.filter(c=>c.slot),bad=pl.filter(c=>c.slot!==c.n).length;
      st.msg=!pl.length?'Place some chromosomes first.':bad?`${bad} of ${pl.length} placed chromosomes are in the wrong spot (orange). Compare length, centromere position and bands.`:`All ${pl.length} placed chromosomes are in the right spots.${pl.length<st.chs.length?' Keep going.':''}`;}},
    {id:'auto',label:'Arrange them for me',run(sim){sim.st.chs.forEach(c=>c.slot=c.n);sim.st.sel=-1;sim.st.checked=true;sim.st.msg='All chromosomes arranged. Now count them and look for anything extra or missing.';}},
    {id:'scatter',label:'Scatter again',run(sim){sim.st.chs.forEach(c=>c.slot=null);sim.st.checked=false;sim.st.msg='';sim.st.sel=0;}},
    {id:'newcase',label:'New patient',run(sim){const k=S(sim),list=casesAtLevel();k.ver++;const r=rng(k.ver*977);let code;do{code=list[Math.floor(r()*list.length)];}while(code===k.code&&list.length>1&&r()<0.85);k.code=code;k.sex21=r()<0.5?'M':'F';sim.st=build(sim);sim.st.sel=0;if(sim.ui&&sim.ui.sec&&BioLab.gotoChallenge)BioLab.gotoChallenge(sim,0);}}
  ],
  init(sim){const st=build(sim);st.sel=0;return st;},
  step(sim,dt){const st=sim.st,f=1-Math.exp(-dt*9);st.chs.forEach(c=>{const t=target(st,c);c.x+=(t.x-c.x)*f;c.y+=(t.y-c.y)*f;let da=t.a-c.a;c.a+=da*f;});},
  onLevel(sim){const k=S(sim);if(LV[CASES[k.code].lvl]>LV[BioLab.level]){k.code='T21';k.ver++;sim.st=build(sim);sim.st.sel=0;}},
  onClick(sim,x,y){const st=sim.st;const c=hitChrom(st,x,y),cur=st.chs[st.sel];
    if(c&&c.slot&&cur&&cur!==c&&!cur.slot){BioLab.setValues(sim,{slot:c.slot});place(sim,c.slot);return;}
    if(c){st.sel=c.i;return;}
    const sl=Object.keys(SLOT).find(n=>{const s=SLOT[n];return x>=s.x0&&x<=s.x1&&y>=s.y0&&y<=s.y1;});if(sl&&st.sel>=0){BioLab.setValues(sim,{slot:sl});place(sim,sl);}},
  metrics:[
    {id:'placed',label:'Chromosomes placed',unit:'',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.chs.filter(c=>c.slot).length},
    {id:'right',label:'Checked and correct',unit:'',lvl:'bio',text:true,get:s=>s.st.checked?s.st.chs.filter(c=>c.slot&&c.slot===c.n).length+' of '+s.st.chs.filter(c=>c.slot).length:'Press Check'}
  ],
  challengeTitle:'Diagnose the patient',
  challenges(sim){const k=S(sim),c=CASES[k.code],sex=caseSex(sim);
    const n=build(sim).chs.length;
    const r=rng(k.ver*53+LV[BioLab.level]);const pool=casesAtLevel().filter(x=>x!==k.code);for(let i=pool.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    const opts=[k.code,...pool.slice(0,3)];for(let i=opts.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[opts[i],opts[j]]=[opts[j],opts[i]];}
    const sexTxt=x=>x==='M'?'Male':'Female';
    const extraTxt=c.extra.length?`There are three copies of chromosome ${c.extra[0]}.`:(c.sx&&c.sx.length!==2)?`The sex chromosomes are ${c.sx.join('')}.`:'Every pair has exactly two copies.';
    return [
      {lvl:'bio',instant:true,q:'Count every chromosome. How many does this patient have?',choices:['45','46','47'],correct:n-45,
       explain:`This patient has ${n} chromosomes. ${extraTxt} A typical human cell has 46: 22 pairs of autosomes plus 2 sex chromosomes.`},
      {lvl:'bio',instant:true,q:'Look at the sex chromosomes. Is this patient male or female?',choices:['Male','Female'],correct:sex==='M'?0:1,
       explain:`The sex chromosomes are ${(c.sx||(sex==='M'?['X','Y']:['X','X'])).join('')}. ${sex==='M'?'Having a Y chromosome makes a person male, even with extra X chromosomes.':'With no Y chromosome, the person develops as female.'}`},
      {lvl:'bio',instant:true,reveals:true,q:'What is your diagnosis?',choices:opts.map(x=>CASES[x].name),correct:opts.indexOf(k.code),explain:`${CASES[k.code].name}. ${CASES[k.code].info}`},
      {lvl:'honors',instant:true,q:'Which mistake during meiosis can give an egg or sperm an extra or missing chromosome?',choices:['Nondisjunction: chromosomes fail to separate','Crossing over between homologs','Independent assortment','An error copying one DNA base'],correct:0,
       explain:'In nondisjunction, a pair of homologs (meiosis I) or two sister chromatids (meiosis II) fail to separate. One gamete gets an extra copy and another gets none. If that gamete is fertilized, the baby has 47 or 45 chromosomes.'},
      {lvl:'honors',instant:true,q:'Which of these could a karyotype NOT detect?',choices:['A single-base mutation, like the sickle-cell allele','An extra chromosome 21','A missing X chromosome','Whether the person is male or female'],correct:0,
       explain:'A karyotype shows whole chromosomes and large pieces of them. A single base change is far too small to see; it needs DNA sequencing or a gene test.'},
      {lvl:'ap',instant:true,q:'Nondisjunction in the father’s meiosis I produces a sperm carrying both an X and a Y. If it fertilizes a typical egg, what is the child’s karyotype?',choices:['47,XXY','47,XYY','45,X','46,XY'],correct:0,
       explain:'In meiosis I the X and Y are homologs and should separate. If they don’t, one sperm gets both (XY) and another gets neither. The XY sperm plus an X egg gives 47,XXY, Klinefelter syndrome.'},
      {lvl:'ap',instant:true,q:'Nondisjunction happens in meiosis I. How many of the four gametes from that cell have the wrong number of chromosomes?',choices:['All 4','2 of 4','1 of 4','None'],correct:0,
       explain:'If homologs fail to separate in meiosis I, one daughter cell gets both and the other gets neither, so all four gametes are abnormal (two n+1, two n−1). If sister chromatids fail to separate in meiosis II, only two of the four are abnormal.'}
    ];},
  onChallenge(sim,ch,phase){if(phase==='done'&&ch.reveals){sim.st.revealed=true;sim.infoDirty=true;}},
  infoPanel(sim){const st=sim.st,k=S(sim),c=st.chs[st.sel];let h='';
    if(st.msg)h+=`<p class="verdict ${/wrong/.test(st.msg)?'no':'ok'}">${st.msg}</p>`;
    if(c)h+=`<h3>Selected chromosome${c.slot?` (now in ${c.slot==='X'||c.slot==='Y'?c.slot:'pair '+c.slot})`:''}</h3><p>${describe(c.n)}</p>${atLeast('honors')?'<p>Homologs have the same length, the same centromere position and the same pattern of dark bands.</p>':'<p>Find its partner: the same length and the same pattern of dark bands.</p>'}`;
    else h+='<h3>No chromosome selected</h3><p>Click a chromosome in the spread, or press Select next chromosome.</p>';
    if(st.revealed)h+=`<h3>Patient: ${CASES[k.code].name}</h3><p>${CASES[k.code].info}</p>`;
    else h+='<p class="help">Answer “What is your diagnosis?” to see more about this patient.</p>';
    return h;},
  narrate(sim){const st=sim.st,pl=st.chs.filter(c=>c.slot).length,n=st.chs.length;
    if(!pl)return 'These chromosomes come from one cell, frozen in metaphase, so each one is doubled into two sister chromatids. Start with the biggest ones: pick one, then put it in its numbered spot below.';
    if(pl<n)return `<b>${pl} placed, ${n-pl} to go.</b> Chromosomes are numbered from largest to smallest. Match partners by length, by where the centromere pinch sits, and by the dark bands.`;
    return `<b>Every chromosome is placed.</b> Count them: a typical cell has 46. Then look for a pair with three copies, or a missing sex chromosome.`;},
  tour:[
    {title:'A metaphase spread',text:'Doctors grow a few white blood cells, stop them in metaphase when chromosomes are most condensed, burst them onto a slide and stain them. This is what one cell’s chromosomes look like.',focus:[12,50,776,222],pause:true,setup(sim){sim.st.chs.forEach(c=>c.slot=null);}},
    {title:'Size',text:'Chromosomes are numbered from largest (1) to smallest (21 and 22 are the smallest). Size is your first clue for finding partners.',focus:sim=>['1','21'].map(n=>{const c=sim.st.chs.find(c=>c.n===n);return [c.x-26,c.y-40,52,80];}),pause:true},
    {title:'The centromere',text:'The pinch is the centromere. In the middle: metacentric (like 1). Off-center: submetacentric (like 4). Almost at the end: acrocentric (like 14), with tiny knobs called satellites.',focus:sim=>['1','4','14'].map(n=>{const c=sim.st.chs.find(c=>c.n===n);return [c.x-26,c.y-40,52,80];}),pause:true},
    {title:'Banding',text:'The stain makes a pattern of light and dark bands. The two homologs in a pair have the same pattern, because they carry the same genes in the same order.',focus:sim=>sim.st.chs.filter(c=>c.n==='2').map(c=>[c.x-26,c.y-40,52,80]),pause:true},
    {title:'The karyogram',text:'Arranged in order, the chromosomes make a karyogram: pairs 1 to 22 (autosomes), then the sex chromosomes, lined up by their centromeres.',focus:[12,272,776,322],pause:true,setup(sim){sim.st.chs.forEach(c=>c.slot=c.n);}},
    {title:'Sex chromosomes',text:'Two X chromosomes means female; an X and a Y means male. The Y is small and carries the gene that starts male development.',focus:[[SLOT.X.x0-4,SLOT.X.y0,SLOT.X.x1-SLOT.X.x0+8,SLOT.X.y1-SLOT.X.y0],[SLOT.Y.x0-4,SLOT.Y.y0+20,SLOT.Y.x1-SLOT.Y.x0+8,SLOT.Y.y1-SLOT.Y.y0-20]],pause:true},
    {title:'Count and diagnose',text:'Now count. 46 is typical. Three copies of a chromosome is a trisomy, like Down syndrome (trisomy 21). One copy is a monosomy, like Turner syndrome (45,X).',focus:[12,272,776,322],pause:true}
  ],
  onTourExit(sim){sim.st.chs.forEach(c=>c.slot=null);},
  terms:[{t:'Karyotype',d:'A picture of all of a cell’s chromosomes arranged in pairs.'},{t:'Homologous chromosomes',d:'A matching pair, one from each parent, with the same genes in the same order.'},{t:'Autosomes',d:'Chromosomes 1–22, the ones that are not sex chromosomes.'},{t:'Sex chromosomes',d:'X and Y. XX is usually female and XY male.'},{t:'Trisomy',d:'Three copies of one chromosome, such as trisomy 21.'},
    {lvl:'honors',t:'Centromere',d:'The pinched region that holds sister chromatids together and attaches to spindle fibers.'},{lvl:'honors',t:'Nondisjunction',d:'When chromosomes fail to separate during meiosis, giving gametes an extra or missing chromosome.'},{lvl:'honors',t:'Monosomy',d:'Only one copy of a chromosome, such as 45,X.'},
    {lvl:'ap',t:'Aneuploidy',d:'Any abnormal number of chromosomes (not an exact multiple of 23).'},{lvl:'ap',t:'X inactivation',d:'In cells with more than one X, all but one X is switched off and condensed into a Barr body.'}],
  about:'<p>Chromosome lengths use their real sizes in base pairs, and centromere positions are close to the real ones. The banding patterns are simplified: each chromosome gets a fixed made-up pattern, the same for both homologs, so pairs match the way real G-bands do. Satellites are drawn on the five acrocentric chromosomes (13, 14, 15, 21, 22).</p><p>Real karyotypes have chromosomes that overlap, bend and differ a little in condensation; cytogeneticists use high-resolution banding to find small deletions and translocations that this tool does not include.</p>',
  draw(sim,ctx,vdt,k){const st=sim.st,ink=PAL['cv-ink'];ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,600);
    ctx.fillStyle=PAL['card2'];rr(ctx,12,40,776,232,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,'Metaphase spread',22,30,{s:13*k,w:700,c:PAL['cv-soft']});txt(ctx,'Karyogram',22,290,{s:13*k,w:700,c:PAL['cv-soft']});
    // slots
    Object.keys(SLOT).forEach(n=>{const s=SLOT[n],has=st.chs.some(c=>c.slot===n);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(s.x0+6,s.yc);ctx.lineTo(s.x1-6,s.yc);ctx.stroke();
      txt(ctx,n,s.x,s.lab,{s:13*k,w:700,c:has?ink:PAL['cv-soft'],a:'center'});});
    // bracket groups for sex chromosomes
    const sel=st.chs[st.sel];
    st.chs.forEach(c=>{if(c===sel)return;const mark=st.checked&&c.slot?(c.slot===c.n?null:'bad'):null;drawChrom(ctx,c,false,mark);
      if(sim.p.nums&&!c.slot)txt(ctx,c.n,c.x+12,c.y-8,{s:11*k,w:700,c:PAL['rj']});});
    if(sel){drawChrom(ctx,sel,true,null);if(sim.p.nums&&!sel.slot)txt(ctx,sel.n,sel.x+12,sel.y-8,{s:11*k,w:700,c:PAL['rj']});}
    const n=st.chs.length,pl=st.chs.filter(c=>c.slot).length;
    txt(ctx,`Patient ${S(sim).ver} · ${pl} placed`,786,30,{s:12.5*k,w:700,a:'right',c:ink});}
};
BioLab.register(KARYO);
})();
