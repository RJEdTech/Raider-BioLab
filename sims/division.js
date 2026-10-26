(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,legend,serColor}=BioLab.h;
/* Step-through mitosis and meiosis. Each phase has a target layout (cells, nuclear envelope, spindle, every chromatid);
   the drawing interpolates from the previous layout to the current one. */
const MAT='#d24d6a',PAT='#3b74c9';
const MITO=[['Interphase (G1)','G1'],['Interphase (S): DNA copied','S'],['Prophase','P'],['Metaphase','M'],['Anaphase','A'],['Telophase','T'],['Cytokinesis: two cells','C']];
const MEIO=[['Interphase (G1)','G1'],['Interphase (S): DNA copied','S'],['Prophase I','PI'],['Metaphase I','MI'],['Anaphase I','AI'],['Telophase I: two cells','TI'],['Prophase II','PII'],['Metaphase II','MII'],['Anaphase II','AII'],['Telophase II: four cells','TII']];
const TR=1.3,HOLD=0.8,CY=210;
const LEN=k=>40-9*k;
const C1={x:400,y:CY,r:150},CL={x:210,y:CY,r:120},CR={x:590,y:CY,r:120},Q=[{x:110,y:CY,r:86},{x:300,y:CY,r:86},{x:500,y:CY,r:86},{x:690,y:CY,r:86}];
const ease=p=>p<.5?2*p*p:1-2*(1-p)*(1-p);
const phases=st=>st.mode==='mitosis'?MITO:MEIO;
function newRun(st,n,mode,r){r=r||Math.random;st.mode=mode;st.n=n;st.phase=0;st.from=0;st.prog=1;st.hold=0;
  st.orient=[];st.xo=[];st.pos={};for(let k=0;k<n;k++){st.orient.push(r()<.5?0:1);st.xo.push(0.35+r()*0.35);for(let h=0;h<2;h++){const j=k*2+h;st.pos[k+''+h]=[j/(2*n)*6.283+r()*0.5,0.45+r()*0.3];}}}
/* where each homolog ends up after meiosis I: 0 = left cell, 1 = right cell */
function sideMI(st,k,h,nd){if(nd&&k===0)return 0;return st.orient[k]===h?0:1;}
function stack(lens,gap){const H=lens.reduce((a,b)=>a+b,0)+gap*(lens.length-1);let y=CY-H/2;return lens.map(l=>{const c=y+l/2;y+=l+gap;return c;});}
function layout(st,i,nd){const n=st.n,L={cells:[C1,C1,C1,C1],env:1,spin:0,poles:[],items:{}};const it=(k,h,c,x,y,cond,pole,vis)=>{L.items[k+''+h+c]={x,y,cond,pole:pole===undefined?-1:pole,vis:vis===undefined?1:vis};};
  const chromatin=(cell,k,h,c,spread)=>{const q=st.pos[k+''+h],a=q[0],rad=q[1]*cell.r*(spread||0.5);return [cell.x+Math.cos(a)*rad+(c?7:0),cell.y+Math.sin(a)*rad*0.55];};
  const hs=[];for(let k=0;k<n;k++)for(let h=0;h<2;h++)hs.push([k,h]);
  const ph=phases(st)[i][1];
  if(ph==='G1'||ph==='S'){hs.forEach(([k,h])=>{const p=chromatin(C1,k,h,0);it(k,h,0,p[0],p[1],0);const p1=chromatin(C1,k,h,1);it(k,h,1,ph==='S'?p1[0]:p[0],ph==='S'?p1[1]:p[1],ph==='S'?0.12:0,-1,ph==='S'?1:0);});return L;}
  if(st.mode==='mitosis'){
    if(ph==='P'){L.env=0.25;L.spin=0.35;L.poles=[{x:280,y:CY},{x:520,y:CY}];hs.forEach(([k,h],j)=>{const x=400+(j-(hs.length-1)/2)*40,y=CY+(j%2?-34:34);it(k,h,0,x-5,y,1);it(k,h,1,x+5,y,1);});return L;}
    if(ph==='M'||ph==='A'){L.env=0;L.spin=1;L.poles=[{x:262,y:CY},{x:538,y:CY}];const ys=stack(hs.map(([k])=>LEN(k)),20);
      hs.forEach(([k,h],j)=>{const y=ys[j];const dx=ph==='A'?92+(j%2)*16:5;it(k,h,0,400-dx,y,1,0);it(k,h,1,400+dx,y,1,1);});
      if(ph==='A')L.cells=[{x:378,y:CY,r:148},{x:378,y:CY,r:148},{x:422,y:CY,r:148},{x:422,y:CY,r:148}];return L;}
    if(ph==='T'){L.env=0.6;L.spin=0.2;L.poles=[{x:230,y:CY},{x:570,y:CY}];const l={x:300,y:CY,r:125},r={x:500,y:CY,r:125};L.cells=[l,l,r,r];
      hs.forEach(([k,h],j)=>{const x=(j-(hs.length-1)/2)*15;it(k,h,0,285+x,CY,0.55);it(k,h,1,515+x,CY,0.55);});return L;}
    L.cells=[CL,CL,CR,CR];hs.forEach(([k,h])=>{const a=chromatin(CL,k,h,0),b=chromatin(CR,k,h,0);it(k,h,0,a[0],a[1],0.05);it(k,h,1,b[0],b[1],0.05);});return L;}
  // meiosis
  if(ph==='PI'){L.env=0.25;L.spin=0.35;L.poles=[{x:280,y:CY},{x:520,y:CY}];for(let k=0;k<n;k++){const x=400+(k-(n-1)/2)*84;it(k,0,0,x-15,CY,1);it(k,0,1,x-5,CY,1);it(k,1,0,x+5,CY,1);it(k,1,1,x+15,CY,1);}return L;}
  if(ph==='MI'||ph==='AI'){L.env=0;L.spin=1;L.poles=[{x:262,y:CY},{x:538,y:CY}];const ys=stack([...Array(n)].map((_,k)=>LEN(k)),26);
    for(let k=0;k<n;k++){for(let h=0;h<2;h++){let side=ph==='MI'?(st.orient[k]===h?0:1):sideMI(st,k,h,nd);let base;
      if(ph==='MI')base=side===0?389:411;else{base=side===0?300:500;if(nd&&k===0&&h===1)base+=20;}
      const y=ys[k];const pole=side;it(k,h,0,base-5,y,1,pole);it(k,h,1,base+5,y,1,pole);}}
    if(ph==='AI')L.cells=[{x:378,y:CY,r:148},{x:378,y:CY,r:148},{x:422,y:CY,r:148},{x:422,y:CY,r:148}];return L;}
  // after meiosis I: which homologs sit in each cell
  const inCell=[[],[]];for(let k=0;k<n;k++)for(let h=0;h<2;h++)inCell[sideMI(st,k,h,nd)].push([k,h]);
  const cells2=[CL,CR];
  if(ph==='TI'||ph==='PII'){L.cells=[CL,CL,CR,CR];L.env=ph==='TI'?0.7:0.2;L.spin=ph==='PII'?0.35:0;if(ph==='PII')L.poles=[{x:120,y:CY},{x:300,y:CY},{x:500,y:CY},{x:680,y:CY}];
    inCell.forEach((list,ci)=>list.forEach(([k,h],j)=>{const cx=cells2[ci].x+(j-(list.length-1)/2)*30,y=CY+(ph==='PII'?(j%2?-26:26):0);it(k,h,0,cx-5,y,ph==='TI'?0.7:1);it(k,h,1,cx+5,y,ph==='TI'?0.7:1);}));return L;}
  if(ph==='MII'||ph==='AII'){L.env=0;L.spin=1;L.poles=[{x:115,y:CY},{x:305,y:CY},{x:495,y:CY},{x:685,y:CY}];
    if(ph==='AII')L.cells=[{x:192,y:CY,r:120},{x:228,y:CY,r:120},{x:572,y:CY,r:120},{x:608,y:CY,r:120}];else L.cells=[CL,CL,CR,CR];
    inCell.forEach((list,ci)=>{const ys=stack(list.map(([k])=>LEN(k)),20),cx=cells2[ci].x;list.forEach(([k,h],j)=>{const y=ys[j],dx=ph==='AII'?60+(j%2)*14:5;it(k,h,0,cx-dx,y,1,ci*2);it(k,h,1,cx+dx,y,1,ci*2+1);});});return L;}
  // TII: four cells
  L.cells=Q;inCell.forEach((list,ci)=>list.forEach(([k,h],j)=>{[0,1].forEach(c=>{const cell=Q[ci*2+c];it(k,h,c,cell.x+(j-(list.length-1)/2)*16,CY,0.35);});}));return L;}
function crossed(st,sim){return st.mode==='meiosis'&&sim.p.xo&&(st.phase>2||(st.phase===2&&(st.from<2?st.prog>0.6:true)));}
/* segment colors of one chromatid: [topColor, bottomColor, breakFraction] */
function segs(st,sim,k,h,c){const base=h?PAT:MAT;if(crossed(st,sim)){if(h===0&&c===1)return [MAT,PAT,st.xo[k]];if(h===1&&c===0)return [PAT,MAT,st.xo[k]];}return [base,base,1];}
/* chromosomes (by centromere origin) in each final gamete; null for phases before the end */
function gametes(st,sim){const n=st.n,nd=sim.p.nd&&atLeast('ap');const out=[[],[],[],[]];
  for(let k=0;k<n;k++)for(let h=0;h<2;h++){const side=sideMI(st,k,h,nd);for(let c=0;c<2;c++){const sg=segs(Object.assign({},st,{phase:9}),sim,k,h,c);out[side*2+c].push({k,h,rec:sg[2]<1});}}
  return out;}
function cellCounts(st,sim){const n=st.n,i=st.phase,ph=phases(st)[i][1],nd=sim.p.nd&&atLeast('ap');
  if(st.mode==='mitosis')return ph==='C'?[2*n,2*n]:[2*n];
  if(['TI','PII','MII','AII'].includes(ph)){const a=[0,0];for(let k=0;k<n;k++)for(let h=0;h<2;h++)a[sideMI(st,k,h,nd)]++;return a;}
  if(ph==='TII'){const g=gametes(st,sim);return g.map(x=>x.length);}
  return [2*n];}
const DNA={mitosis:[2,4,4,4,4,4,2],meiosis:[2,4,4,4,4,2,2,2,2,1]};
function run100(sim){const st=sim.st,n=st.n,nd=sim.p.nd&&atLeast('ap'),xo=sim.p.xo&&atLeast('honors');const tally={};let rec=0,tot=0;
  for(let m=0;m<100;m++){const o=[];for(let k=0;k<n;k++)o.push(Math.random()<.5?0:1);
    const g=[[],[],[],[]];for(let k=0;k<n;k++)for(let h=0;h<2;h++){const side=(nd&&k===0)?0:(o[k]===h?0:1);for(let c=0;c<2;c++)g[side*2+c].push({k,h,rec:xo&&((h===0&&c===1)||(h===1&&c===0))});}
    g.forEach(gm=>{tot++;if(gm.length!==n){tally['Wrong number']=(tally['Wrong number']||0)+1;return;}const key=gm.sort((a,b)=>a.k-b.k).map(x=>x.h?'P':'M').join('');tally[key]=(tally[key]||0)+1;if(gm.some(x=>x.rec))rec++;});}
  st.tally=tally;st.tallyN=tot;st.recomb=100*rec/tot;st.tallyPairs=n;}
const DIV={
  id:'division',hash:'division',apUnit:4,order:3,tab:'Mitosis and meiosis',kind:'Process walkthrough',
  card:'Step through cell division one phase at a time. Compare two identical cells with four unique gametes.',
  title:'Mitosis and meiosis, step by step',
  lede:{bio:'Mitosis copies a cell exactly, for growth and repair. Meiosis makes egg and sperm cells with half the chromosomes, each one different. Step through both and compare.',
        honors:'Follow every chromatid. Mitosis separates sister chromatids to make two identical diploid cells. Meiosis separates homologous pairs, then sisters, to make four haploid cells, with crossing over adding new combinations.',
        ap:'Track ploidy and DNA content through each phase, see where independent assortment and crossing over create variation, and watch nondisjunction produce aneuploid gametes.'},
  scale:'One cell, about 20 micrometers across. Shown with 1 to 3 chromosome pairs so you can follow each one. Human cells have 23 pairs.',
  timeless:true,animated:true,trials:true,chChange:0,chReveal:14,
  controls:[
    {id:'mode',label:'Type of division',type:'seg',def:'mitosis',lvl:'bio',options:[{v:'mitosis',l:'Mitosis'},{v:'meiosis',l:'Meiosis'}],onChange(sim){DIV.restart(sim);}},
    {id:'pairs',label:'Chromosome pairs',type:'range',min:1,max:3,step:1,def:2,unit:'',lvl:'bio',help:'Red came from the mother, blue from the father.',onChange(sim){DIV.restart(sim);}},
    {id:'xo',label:'Crossing over',help:'Partner chromosomes swap pieces in prophase I',type:'toggle',def:false,lvl:'honors'},
    {id:'nd',label:'Nondisjunction (pair 1)',help:'The largest pair fails to separate in meiosis I',type:'toggle',def:false,lvl:'ap'}
  ],
  restart(sim){newRun(sim.st,sim.p.pairs,sim.p.mode);sim.st.auto=false;sim.st.tally=null;BioLab.refresh&&sim.ui&&sim.ui.sec&&BioLab.refresh(sim);},
  go(sim,i){const st=sim.st,max=phases(st).length-1;i=clamp(i,0,max);if(i===st.phase&&st.prog>=1)return;st.from=st.phase;st.phase=i;st.prog=0;st.hold=0;},
  actions:[
    {id:'prev',label:'‹ Previous phase',run(sim){DIV.go(sim,sim.st.phase-1);sim.st.auto=false;}},
    {id:'next',label:'Next phase ›',primary:true,run(sim){DIV.go(sim,sim.st.phase+1);sim.st.auto=false;}},
    {id:'play',label:'Auto-play',run(sim){const st=sim.st;if(st.phase>=phases(st).length-1){DIV.restart(sim);}st.auto=!st.auto;st.hold=0;}},
    {id:'restart',label:'Start over',run(sim){DIV.restart(sim);}},
    {id:'run100',label:'Run 100 meioses',run(sim){run100(sim);if(sim.ui&&sim.ui.gm){sim.gMetric='tally';sim.ui.gm.value='tally';}}}
  ],
  init(sim){const st={tally:null,auto:false};newRun(st,sim.p.pairs,sim.p.mode,rng(3));return st;},
  step(sim,dt){const st=sim.st;if(st.prog<1){st.prog=Math.min(1,st.prog+dt/TR);return;}
    if(st.auto){st.hold+=dt;if(st.hold>=HOLD){if(st.phase<phases(st).length-1)DIV.go(sim,st.phase+1);else st.auto=false;}}},
  metrics:[
    {id:'phase',label:'Phase',lvl:'bio',text:true,get:s=>phases(s.st)[s.st.phase][0]},
    {id:'cells',label:'Cells',unit:'',lvl:'bio',min:0,max:4,d:0,get:s=>cellCounts(s.st,s).length},
    {id:'chrom',label:'Chromosomes in each cell',lvl:'bio',text:true,get:s=>{const c=cellCounts(s.st,s),n=s.st.n;if(c.every(x=>x===c[0])){return c[0]+(c[0]===2*n?' (2n, diploid)':c[0]===n?' (n, haploid)':'')+(c.length>1?' each':'');}return c.join(', ')+' (abnormal)';}},
    {id:'sis',label:'Each chromosome is',lvl:'honors',text:true,get:s=>{const st=s.st,ph=phases(st)[st.phase][1];if(ph==='G1'||ph==='C'||ph==='TII'||(st.mode==='mitosis'&&(ph==='A'||ph==='T'))||ph==='AII')return '1 chromatid';return '2 sister chromatids';}},
    {id:'dna',label:'DNA per cell',lvl:'ap',text:true,get:s=>DNA[s.st.mode][s.st.phase]+'C'},
    {id:'ident',label:'Daughter cells identical?',lvl:'bio',text:true,get:s=>{const st=s.st;if(st.phase<phases(st).length-1)return 'Not finished yet';if(st.mode==='mitosis')return 'Yes. Both match the parent exactly.';
      if(s.p.nd&&atLeast('ap'))return 'No. All four have the wrong number of chromosomes.';if(s.p.xo&&atLeast('honors'))return 'No. All four gametes are different.';return 'No. Two different pairs of gametes, both unlike the parent.';}},
    {id:'types',label:'Gamete types seen (100 meioses)',unit:'',lvl:'bio',min:0,max:8,d:0,get:s=>s.st.tally?Object.keys(s.st.tally).filter(k=>k!=='Wrong number').length:NaN},
    {id:'expected',label:'Possible types, 2ⁿ',unit:'',lvl:'ap',min:0,max:8,d:0,get:s=>Math.pow(2,s.st.n)},
    {id:'recomb',label:'Gametes with a recombinant chromosome',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>s.st.tally?s.st.recomb:NaN}
  ],
  graphs:[{id:'counts',label:'Chromosomes per cell, by phase',lvl:'bio',custom:true},{id:'dna',label:'DNA content per cell, by phase',lvl:'ap',custom:true},{id:'tally',label:'Gamete types from 100 meioses',lvl:'bio',custom:true}],
  defaultGraph:'counts',
  plot(sim,ctx,box,id){const st=sim.st,P=phases(st);
    if(id==='tally'){if(!st.tally){txt(ctx,'Press “Run 100 meioses” to tally 400 gametes.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
      const keys=Object.keys(st.tally).sort((a,b)=>a==='Wrong number'?1:b==='Wrong number'?-1:a<b?-1:1),vals=keys.map(k=>st.tally[k]);
      const ax=axes(ctx,box,{xmin:0,xmax:keys.length,ymin:0,ymax:Math.max(...vals)*1.2,xcats:keys,yl:'Gametes (of '+st.tallyN+')',xl:'Gamete type: M = mother’s chromosome, P = father’s, one letter per pair'});
      bars(ctx,ax,vals,{colors:keys.map(k=>k==='Wrong number'?PAL['s1']:PAL['s2'])});return;}
    const n=st.n,vals=id==='dna'?DNA[st.mode]:P.map((_,i)=>{const c=st.mode==='mitosis'?2*n:(i<=4?2*n:n);return c;});
    const ax=axes(ctx,box,{xmin:0,xmax:P.length,ymin:0,ymax:id==='dna'?5:2*n+1,xcats:P.map(p=>p[1]),yd:0,yl:id==='dna'?'DNA per cell (C)':'Chromosomes per cell',xl:'Phase'});
    ctx.strokeStyle=serColor(id==='dna'?1:0);ctx.lineWidth=3;ctx.beginPath();vals.forEach((v,i)=>{const x0=ax.X(i),x1=ax.X(i+1),y=ax.Y(v);i?ctx.lineTo(x0,y):ctx.moveTo(x0,y);ctx.lineTo(x1,y);});ctx.stroke();
    const i=st.phase;ctx.fillStyle=serColor(id==='dna'?1:0);ctx.beginPath();ctx.arc(ax.X(i+.5),ax.Y(vals[i]),6,0,6.29);ctx.fill();
    ctx.globalAlpha=.12;ctx.fillRect(ax.X(i),box.T,ax.X(i+1)-ax.X(i),box.H);ctx.globalAlpha=1;
    if(id!=='dna'){txt(ctx,'2n = '+2*n,box.L+box.W-6,ax.Y(2*n)-8,{s:12,c:PAL['muted'],a:'right'});if(st.mode==='meiosis')txt(ctx,'n = '+n,box.L+box.W-6,ax.Y(n)-8,{s:12,c:PAL['muted'],a:'right'});}},
  challenges:[
    {lvl:'bio',q:'Mitosis: how many cells do you end with, and how do they compare with the parent cell?',
     choices:['Two cells, each identical to the parent','Four cells, each with half the chromosomes','Two cells, each with half the chromosomes'],correct:0,
     baseline:{mode:'mitosis'},baselineAction:'play',reveal:13.6,changeText:'Playing mitosis',watch:'counts',
     explain:{bio:'Each chromosome was copied in S phase, and mitosis gives one copy of each to each new cell. Both cells get the full set, identical to the parent. That is how your body grows and heals.',
              honors:'Sister chromatids are identical copies. Mitosis pulls them to opposite poles, so each daughter receives exactly one chromatid of every chromosome: two genetically identical diploid (2n) cells.'}},
    {lvl:'bio',q:'Meiosis: how many cells do you end with, and how many chromosomes does each have?',
     choices:['Two cells with the full set','Four cells, each with half the chromosomes','Four cells with the full set'],correct:1,
     baseline:{mode:'meiosis'},baselineAction:'play',reveal:20.6,changeText:'Playing meiosis',watch:'counts',
     explain:{bio:'Meiosis divides twice but copies the DNA only once, so you get four cells with half the chromosomes, one from each pair. When egg and sperm join, the full number is restored.',
              honors:'One round of replication followed by two divisions gives four haploid (n) cells. Each has one chromosome from every homologous pair.'}},
    {lvl:'honors',q:'At which step does the chromosome number per cell drop from 2n to n?',
     choices:['During S phase','At the end of meiosis I','At the end of meiosis II'],correct:1,
     baseline:{mode:'meiosis'},baselineAction:'play',reveal:20.6,changeText:'Playing meiosis. Watch the graph.',watch:'counts',
     explain:{honors:'Meiosis I separates homologous pairs, so each new cell gets only one chromosome from each pair: n chromosomes, each still made of two sister chromatids. Meiosis II separates the sisters but doesn’t change the chromosome count.'}},
    {lvl:'honors',q:'With crossing over, are any of the four gametes from one meiosis identical?',
     choices:['Yes, they come in two identical pairs','No, all four are different'],correct:1,
     baseline:{mode:'meiosis',xo:true},baselineAction:'play',reveal:20.6,changeText:'Playing meiosis with crossing over',watch:'counts',
     explain:{honors:'Without crossing over, sister chromatids are identical, so the two gametes from each meiosis II cell match. Crossing over swaps pieces between non-sister chromatids, so sisters differ and every gamete is unique. Look at the two-colored chromosomes.'}},
    {lvl:'ap',q:'With 3 chromosome pairs and no crossing over, how many different gamete types can independent assortment produce?',
     choices:['3','6','8','23'],correct:2,
     baseline:{mode:'meiosis',pairs:3},baselineAction:'run100',reveal:0.6,changeText:'Ran 100 meioses',watch:'tally',
     explain:{ap:'Each pair lines up at metaphase I independently, with either the maternal or paternal homolog facing a given pole. That gives 2 × 2 × 2 = 2³ = 8 types. For humans, 2²³ is about 8.4 million, before crossing over adds even more.'}},
    {lvl:'ap',q:'Pair 1 fails to separate in meiosis I. How many of the four gametes have the wrong number of chromosomes?',
     choices:['One','Two','All four'],correct:2,
     baseline:{mode:'meiosis',nd:true},baselineAction:'play',reveal:20.6,changeText:'Playing meiosis with nondisjunction',watch:'counts',
     explain:{ap:'Both homologs of pair 1 went to the same cell in meiosis I. That cell’s two gametes get an extra copy (n+1), and the other cell’s two gametes have none (n−1). Fertilization would give trisomy or monosomy. Nondisjunction in meiosis II would affect only two of the four gametes.'}}
  ],
  thumbSetup(sim){sim.st.phase=3;sim.st.from=3;sim.st.prog=1;},thumbFrames:2,
  draw(sim,ctx,vdt,k,t){const st=sim.st,p=sim.p,nd=p.nd&&atLeast('ap'),hon=atLeast('honors');
    const A=layout(st,st.from,nd),B=layout(st,st.phase,nd),e=ease(st.prog);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // cells: outline pass, then fill pass, so overlapping circles read as one pinching cell
    const cells=B.cells.map((c,i)=>({x:lerp(A.cells[i].x,c.x,e),y:lerp(A.cells[i].y,c.y,e),r:lerp(A.cells[i].r,c.r,e)}));
    ctx.fillStyle='#b49aa0';cells.forEach(c=>{ctx.beginPath();ctx.arc(c.x,c.y,c.r+2.5,0,6.29);ctx.fill();});
    ctx.fillStyle=PAL['cv-sol'];cells.forEach(c=>{ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,6.29);ctx.fill();});
    // nuclear envelope
    const env=lerp(A.env,B.env,e);if(env>0.02){const seen=[];cells.forEach(c=>{if(seen.some(s=>Math.hypot(s.x-c.x,s.y-c.y)<4))return;seen.push(c);ctx.globalAlpha=env;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();ctx.arc(c.x,c.y,c.r*0.62,0,6.29);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=PAL['cv-bg2'];ctx.globalAlpha=env*0.6;ctx.fill();ctx.globalAlpha=1;});}
    // chromatid positions
    const keys=Object.keys(B.items),pos={};
    keys.forEach(key=>{const a=A.items[key]||B.items[key],b=B.items[key];pos[key]={x:lerp(a.x,b.x,e),y:lerp(a.y,b.y,e),cond:lerp(a.cond,b.cond,e),vis:lerp(a.vis,b.vis,e),pole:b.pole};});
    // spindle
    const spin=lerp(A.spin,B.spin,e);if(spin>0.02&&B.poles.length){ctx.globalAlpha=spin*0.55;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;
      keys.forEach(key=>{const q=pos[key];if(q.pole<0||!B.poles[q.pole]||q.vis<0.5)return;const pl=B.poles[q.pole];ctx.beginPath();ctx.moveTo(pl.x,pl.y);ctx.lineTo(q.x,q.y);ctx.stroke();});
      B.poles.forEach(pl=>{for(let a=0;a<6.28;a+=0.52){ctx.beginPath();ctx.moveTo(pl.x,pl.y);ctx.lineTo(pl.x+Math.cos(a)*11,pl.y+Math.sin(a)*11);ctx.stroke();}});
      ctx.globalAlpha=1;B.poles.forEach(pl=>{ctx.fillStyle='#7a6a3a';ctx.beginPath();ctx.arc(pl.x,pl.y,4,0,6.29);ctx.fill();});}
    // chromatids
    keys.forEach(key=>{const q=pos[key];if(q.vis<0.02)return;const kk=+key[0],h=+key[1],c=+key[2],sg=segs(st,sim,kk,h,c);
      const len=LEN(kk)*lerp(1.7,1,q.cond),amp=(1-q.cond)*7,w=lerp(2.6,8.5,q.cond),N=18;
      const pt=j=>{const f=j/N;return [q.x+Math.sin(f*Math.PI*5+kk+h*2)*amp,q.y-len/2+f*len];};
      ctx.globalAlpha=q.vis;ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=w;
      const brk=Math.round(sg[2]*N);[[0,brk,sg[0]],[brk,N,sg[1]]].forEach(seg=>{if(seg[1]<=seg[0])return;ctx.strokeStyle=seg[2];ctx.beginPath();for(let j=seg[0];j<=seg[1];j++){const P=pt(j);j===seg[0]?ctx.moveTo(P[0],P[1]):ctx.lineTo(P[0],P[1]);}ctx.stroke();});
      ctx.globalAlpha=1;});
    // centromeres joining sister chromatids
    keys.forEach(key=>{if(key[2]!=='0')return;const a=pos[key],b=pos[key.slice(0,2)+'1'];if(!b||a.vis<0.5||b.vis<0.5||a.cond<0.5)return;if(Math.hypot(a.x-b.x,a.y-b.y)>16)return;
      ctx.fillStyle='#2b2b33';ctx.beginPath();ctx.ellipse((a.x+b.x)/2,(a.y+b.y)/2,7,3.5,0,0,6.29);ctx.fill();});
    // chiasma markers during prophase I
    if(st.mode==='meiosis'&&p.xo&&hon&&st.phase===2&&st.prog>0.5){for(let kk=0;kk<st.n;kk++){const a=pos[kk+'01'],b=pos[kk+'10'];if(!a||!b)continue;const y=a.y-LEN(kk)/2+st.xo[kk]*LEN(kk),x=(a.x+b.x)/2;ctx.strokeStyle='#f2b705';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-6,y-6);ctx.lineTo(x+6,y+6);ctx.moveTo(x+6,y-6);ctx.lineTo(x-6,y+6);ctx.stroke();}}
    // titles
    const P=phases(st);txt(ctx,(st.mode==='mitosis'?'Mitosis':'Meiosis')+' · '+P[st.phase][0],16,30,{s:18*k,w:700});
    txt(ctx,'Phase '+(st.phase+1)+' of '+P.length,16,52,{s:12.5*k,c:PAL['cv-soft']});
    if(st.mode==='meiosis'&&st.phase>=2){const mi=st.phase<=5?'Meiosis I: partners separate':'Meiosis II: sisters separate';pill(ctx,mi,784-mi.length*3.6*k,26,PAL['card2'],PAL['cv-ink'],11.5*k);}
    if(st.mode==='meiosis'&&st.phase===9){const g=gametes(st,sim);Q.forEach((c,i)=>{const cnt=g[i].length,lab=cnt===st.n?'n = '+cnt:cnt+(cnt>st.n?' (extra)':' (missing)');txt(ctx,lab,c.x,CY+c.r+22,{s:12.5*k,w:700,a:'center',c:cnt===st.n?PAL['cv-ink']:PAL['s1']});});}
    if(st.mode==='mitosis'&&st.phase===6){[CL,CR].forEach(c=>txt(ctx,'2n = '+2*st.n,c.x,CY+c.r+22,{s:12.5*k,w:700,a:'center'}));}
    // legend
    const ly=440;ctx.fillStyle=MAT;rr(ctx,16,ly-9,18,7,3);ctx.fill();txt(ctx,'from the mother',40,ly,{s:12*k,c:PAL['cv-soft']});
    ctx.fillStyle=PAT;rr(ctx,170,ly-9,18,7,3);ctx.fill();txt(ctx,'from the father',194,ly,{s:12*k,c:PAL['cv-soft']});
    if(hon){ctx.fillStyle='#2b2b33';ctx.beginPath();ctx.ellipse(335,ly-5,7,3.5,0,0,6.29);ctx.fill();txt(ctx,'centromere',348,ly,{s:12*k,c:PAL['cv-soft']});}
  },
  narrate(sim){const st=sim.st,ph=phases(st)[st.phase][1],hon=atLeast('honors'),ap=atLeast('ap'),n=st.n,mit=st.mode==='mitosis',nd=sim.p.nd&&ap;
    const T={
      G1:hon?'Its DNA is loose chromatin inside the nucleus: '+2*n+' chromosomes, '+n+' pairs. One of each pair came from each parent.':'The cell is doing its normal job. Its DNA is loose and spread out inside the nucleus. Red came from the mother, blue from the father.',
      S:hon?'S phase: every chromosome is copied. Each now has two identical sister chromatids, joined at the centromere.':'The cell has copied all of its DNA. Each chromosome now has an identical twin attached to it.',
      P:hon?'Prophase: chromatin coils into compact chromosomes, the nuclear envelope breaks down, and spindle fibers grow from the poles.':'The DNA coils up tight into visible chromosomes, and the nucleus breaks down.',
      M:hon?'Metaphase: spindle fibers line up every chromosome along the middle of the cell, with one sister chromatid facing each pole.':'All the chromosomes line up single file across the middle of the cell.',
      A:hon?'Anaphase: the centromeres split and the spindle pulls sister chromatids to opposite poles. Each side gets one copy of every chromosome.':'The twins are pulled apart, one to each side. Each side gets one copy of every chromosome.',
      T:hon?'Telophase: nuclear envelopes re-form around each set of chromosomes, which start to unwind. The cell begins to pinch in two.':'A new nucleus forms on each side, and the cell starts to pinch in the middle.',
      C:hon?'Cytokinesis is complete: two diploid daughter cells, genetically identical to each other and to the parent.':'Done: two new cells, each an exact copy of the original.',
      PI:hon?'Prophase I: homologous chromosomes pair up side by side to form tetrads.'+(sim.p.xo?' Non-sister chromatids cross over and swap matching pieces (yellow X).':'')+' This pairing happens only in meiosis.':'Each chromosome finds its partner from the other parent, and they pair up side by side.',
      MI:hon?'Metaphase I: homologous pairs line up across the middle. Which partner faces which pole is random for each pair. This is independent assortment.':'The partner pairs line up across the middle. Whether mom’s or dad’s copy faces left is random for each pair.',
      AI:hon?'Anaphase I: homologs separate, but sister chromatids stay together.'+(nd?' <b>Pair 1 fails to separate: nondisjunction.</b>':'')+' The chromosome number is about to be cut in half.':'The partners are pulled apart, one to each side. Twins stay together this time.',
      TI:hon?'Telophase I: two cells, each with '+n+' chromosomes (haploid), but each chromosome still has two sister chromatids.':'Now there are two cells, each with half as many chromosomes.',
      PII:hon?'Prophase II: no DNA copying this time. A new spindle forms in each cell.':'Each of the two cells gets ready to divide again, without copying its DNA.',
      MII:hon?'Metaphase II: chromosomes line up single file in each cell, sisters facing opposite poles, as in mitosis.':'In each cell, the chromosomes line up across the middle again.',
      AII:hon?'Anaphase II: sister chromatids finally separate and move to opposite poles.':'The twins are pulled apart in each cell.',
      TII:hon?'Telophase II: four haploid cells, which become eggs or sperm.'+(nd?' Because of nondisjunction, all four have the wrong chromosome number.':sim.p.xo?' With crossing over, all four are genetically different.':' None is identical to the parent.'):'Done: four cells, each with half the chromosomes. These become eggs or sperm.'+(sim.p.xo?' With crossing over, each one is different.':' Without crossing over, they come in two matching pairs.')};
    return '<b>'+phases(st)[st.phase][0]+'.</b> '+T[ph];},
  tour:(function(){const go=(mode,i,extra)=>sim=>{BioLab.setValues(sim,Object.assign({mode},extra||{}));DIV.go(sim,i-1);sim.st.prog=1;DIV.go(sim,i);};
    return [
    {title:'Copying the DNA',text:{bio:'Before any division, the cell copies its DNA. Each chromosome gets an identical twin, called a sister chromatid.',honors:'In S phase every chromosome is replicated. The two sister chromatids stay attached at the centromere.'},focus:[250,60,300,300],speed:0.5,setup:go('mitosis',1)},
    {title:'Chromosomes condense',text:'In prophase the long DNA strands coil up into short, thick chromosomes that can be moved without tangling.',focus:[250,60,300,300],speed:0.5,setup:go('mitosis',2)},
    {title:'Lining up in the middle',text:'In metaphase the spindle fibers line every chromosome up across the center, one twin facing each side.',focus:[340,80,120,260],speed:0.5,setup:go('mitosis',3)},
    {title:'Pulling the twins apart',text:'In anaphase the twins separate and move to opposite sides. Each side gets one copy of every chromosome.',focus:[240,70,320,280],speed:0.5,setup:go('mitosis',4)},
    {title:'Two identical cells',text:'Mitosis ends with two cells that match the parent exactly. This is how you grow and heal.',focus:[80,70,640,290],speed:0.5,setup:go('mitosis',6)},
    {lvl:'honors',title:'Meiosis I: partners pair up and cross over',text:'In prophase I, each chromosome pairs with its homolog. Crossing over swaps pieces between them (yellow X), creating new combinations.',focus:[250,60,300,300],speed:0.4,setup:go('meiosis',2,{xo:true})},
    {title:'Meiosis I: partners separate',text:{bio:'In meiosis, partner chromosomes (one from mom, one from dad) are pulled apart first. Each new cell gets one from each pair: half the number.',honors:'Anaphase I separates homologs, not sisters. Each side gets one homolog from every pair, and which one is random.'},focus:[240,70,320,280],speed:0.5,setup:go('meiosis',4)},
    {title:'Four cells',text:{bio:'Meiosis II splits the twins apart. You end with four cells, each with half the chromosomes. Without crossing over they come in two matching pairs; crossing over makes all four different.',honors:'Meiosis II separates sister chromatids. The result is four haploid gametes. Without crossing over they form two identical pairs; with crossing over each is genetically unique.'},focus:[20,70,760,320],speed:0.5,setup:go('meiosis',9)}];})(),
  onTourExit(sim){BioLab.setValues(sim,{mode:'mitosis',xo:false});},
  lab:{bio:'<p><b>Question:</b> How does the number of chromosome pairs change the number of possible egg or sperm types?</p><ol><li>Choose Meiosis.</li><li>For 1, 2 and 3 pairs: press Run 100 meioses, then Record trial.</li><li>Plot chromosome pairs (x) against gamete types seen (y).</li></ol><p>Find the pattern, then predict the number for humans (23 pairs).</p>',
       honors:'<p><b>Question:</b> How much variation does crossing over add?</p><ol><li>With 2 pairs, run 100 meioses with crossing over off, then on. Record a trial each time.</li><li>Compare gametes with a recombinant chromosome.</li></ol><p>Explain why siblings with the same parents look different. Use both independent assortment and crossing over.</p>',
       ap:'<p><b>Question:</b> How does nondisjunction show up in gametes?</p><ol><li>Step through meiosis with nondisjunction on, and record the chromosome count in each gamete.</li><li>Run 100 meioses and record what fraction are abnormal.</li></ol><p><b>Claim–evidence–reasoning:</b> Compare the outcome of nondisjunction in meiosis I with what would happen in meiosis II, and connect it to trisomy 21.</p>'},
  terms:[{t:'Chromosome',d:'A long DNA molecule with many genes, packed with proteins.'},{t:'Mitosis',d:'Division that makes two identical cells.'},{t:'Meiosis',d:'Two divisions that make four cells with half the chromosomes, used for eggs and sperm.'},{t:'Diploid (2n)',d:'Two copies of each chromosome, one from each parent.'},{t:'Haploid (n)',d:'One copy of each chromosome.'},
    {lvl:'honors',t:'Sister chromatids',d:'The two identical copies of a chromosome made in S phase, joined at the centromere.'},{lvl:'honors',t:'Homologous chromosomes',d:'A matching pair, one from each parent, with the same genes.'},{lvl:'honors',t:'Crossing over',d:'Homologs exchange matching segments during prophase I.'},{lvl:'honors',t:'Independent assortment',d:'Each homologous pair lines up and separates independently of the others.'},
    {lvl:'ap',t:'Nondisjunction',d:'Chromosomes fail to separate, giving gametes with an extra or missing chromosome.'},{lvl:'ap',t:'Aneuploidy',d:'Having an abnormal number of chromosomes, like trisomy 21.'},{lvl:'ap',t:'C value',d:'DNA content: 1C is one copy of the haploid genome.'}],
  about:'<p>A schematic, not a microscope image. Chromosomes are drawn as bars, with length setting the pair: pair 1 is the longest. Red is the maternal homolog and blue the paternal one. Each phase is a target layout, and the animation moves every chromatid between layouts. Crossing over is one exchange per pair, between the two inner non-sister chromatids, at a random point. The orientation of each pair at metaphase I is a fair coin flip. Run 100 meioses repeats that with fresh coin flips and tallies all 400 gametes by which parent each centromere came from.</p><p>Simplified: chromatin, spindle and cytokinesis are stylized; cells are shown at the same size after each division; nondisjunction is shown only in meiosis I, for pair 1.</p>'
};
BioLab.register(DIV);
})();
