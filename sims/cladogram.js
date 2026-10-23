(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT}=BioLab.h;

/* ---------------- data sets ----------------
   Each trait lists the taxa that have it. Traits are nested, so ordering them from most to
   fewest taxa gives the most parsimonious tree. ages[k] = age (Mya) of the branch point
   where taxon k splits from the rest (k = 0 is the root). */
const SETS={
  vert:{name:'Vertebrates',taxa:['Lancelet','Lamprey','Shark','Frog','Lizard','Mouse','Human'],
    traits:[{n:'Backbone (vertebrae)',s:'Backbone',has:[1,2,3,4,5,6]},{n:'Jaws',s:'Jaws',has:[2,3,4,5,6]},{n:'Lungs',s:'Lungs',has:[3,4,5,6]},
      {n:'Amniotic egg',s:'Amniotic egg',has:[4,5,6]},{n:'Hair and mammary glands',s:'Hair, milk',has:[5,6]}],
    ages:[550,500,440,350,320,90],col:['#7c8a96','#8a6d4a','#3f6fb0','#3a9a52','#b58a1c','#9a5bb8','#c8553d'],
    cytc:{Human:0,Mouse:9,Lizard:14,Frog:18,Shark:24,Lamprey:29,Lancelet:33}},
  plant:{name:'Land plants',taxa:['Green alga','Moss','Fern','Pine','Flowering plant'],
    traits:[{n:'Embryo protected inside the parent',s:'Protected embryo',has:[1,2,3,4]},{n:'Vascular tissue (xylem and phloem)',s:'Vascular tissue',has:[2,3,4]},
      {n:'Seeds',s:'Seeds',has:[3,4]},{n:'Flowers and fruit',s:'Flowers, fruit',has:[4]}],
    ages:[500,450,380,300],col:['#4a9a8a','#6aa84f','#2e7d32','#5d4037','#c2185b']}
};
const set=sim=>SETS[sim.p.set]||SETS.vert;
const st=sim=>sim.st||(sim.st={placed:[]});

/* ---------------- tree building and parsimony ---------------- */
function build(S,placed){let crown=S.taxa.map((t,i)=>i);const nodes=[];
  placed.forEach(ti=>{const has=S.traits[ti].has;const lose=crown.filter(t=>!has.includes(t));crown=crown.filter(t=>has.includes(t));nodes.push({trait:ti,lose});});
  return {nodes,crown};}
function leafOrder(tr){return tr.nodes.flatMap(n=>n.lose).concat(tr.crown);}
// Sankoff parsimony on the caterpillar tree, for one character
function changesFor(tr,has){const INF=1e9;
  let below=null; // cost vector of the subtree hanging from the next node
  const leaf=t=>has.includes(t)?[INF,0]:[0,INF];
  const combine=kids=>[0,1].map(s=>kids.reduce((a,c)=>a+Math.min(c[0]+(s!==0),c[1]+(s!==1)),0));
  below=tr.crown.length?combine(tr.crown.map(leaf)):null;
  for(let i=tr.nodes.length-1;i>=0;i--){const kids=tr.nodes[i].lose.map(leaf);if(below)kids.push(below);below=kids.length?combine(kids):below;}
  return below?below[0]:0;} // root fixed to "absent" (the outgroup lacks every trait)
function score(sim){const S=set(sim),tr=build(S,st(sim).placed);const per=S.traits.map(t=>changesFor(tr,t.has));
  return {tr,per,total:per.reduce((a,b)=>a+b,0),best:S.traits.length,done:st(sim).placed.length===S.traits.length};}
function correctOrder(S){return S.traits.map((t,i)=>i).sort((a,b)=>S.traits[b].has.length-S.traits[a].has.length);}
function place(sim,ti){const p=st(sim).placed;if(p.includes(ti))return;p.push(ti);sim.infoDirty=true;st(sim).flash={ti,t:0};}

/* ---------------- layout ---------------- */
function layout(sim){const S=set(sim),sc=score(sim),tr=sc.tr,order=leafOrder(tr),N=order.length;
  const tipY=78,tipX=i=>78+i*(644/(N-1)),R={x:60,y:408};
  const tips={};order.forEach((t,i)=>tips[t]={x:tipX(i),y:tipY});
  const nNodes=Math.max(1,tr.nodes.length+(tr.crown.length>1?1:0));
  const E={x:tipX(N-1)-90,y:tipY+96};
  const pt=f=>({x:R.x+(E.x-R.x)*f,y:R.y+(E.y-R.y)*f});
  const nodes=tr.nodes.map((n,j)=>Object.assign({},n,pt((j+1)/nNodes)));
  const fin=tr.crown.length>1?pt(1):null;
  return {S,sc,tr,tips,nodes,fin,R,order};}
const timeY=a=>78+a/560*330;

const CLAD={
  id:'cladogram',hash:'cladogram',apUnit:7,order:4,tab:'Build a cladogram',kind:'Learning tool',
  card:'Sort shared traits from oldest to newest and build an evolutionary tree, one branch point at a time.',
  title:'Build a cladogram from shared derived traits',
  lede:{bio:'Use the trait table to build a family tree for seven animals. The trait shared by the most animals evolved first, so it goes closest to the root.',
        honors:'Build trees for vertebrates and for land plants, and test them with parsimony: the best tree needs the fewest trait changes.',
        ap:'Compare morphological and molecular evidence, and read the finished tree on a real timescale.'},
  scale:'Over 500 million years of history on one diagram. Each branch point stands for a real ancestral population that lived long ago.',
  timeless:true,graph:false,trials:false,thumbFrames:1,
  controls:[
    {id:'set',label:'Organisms',type:'seg',def:'vert',lvl:'bio',noTrial:true,options:[{v:'vert',l:'Vertebrates'},{v:'plant',l:'Land plants',lvl:'honors'}],
     onChange(sim){st(sim).placed=[];sim.infoDirty=true;if(sim.ui&&sim.ui.sec&&BioLab.gotoChallenge)BioLab.gotoChallenge(sim,0);}},
    {id:'view',label:'View',type:'seg',def:'tree',lvl:'ap',noTrial:true,options:[{v:'tree',l:'Cladogram'},{v:'time',l:'Timeline'}],help:'Timeline redraws the finished tree with branch points at their real ages.'}
  ],
  actions:[
    {id:'next',label:'Place the next trait',primary:true,run(sim){const S=set(sim),p=st(sim).placed,nx=correctOrder(S).find(i=>!p.includes(i));if(nx!==undefined)place(sim,nx);}},
    {id:'undo',label:'Undo',run(sim){st(sim).placed.pop();sim.infoDirty=true;}},
    {id:'clear',label:'Start over',run(sim){st(sim).placed=[];sim.infoDirty=true;}}
  ],
  init(){return {placed:[],flash:null};},step(sim,dt){const f=st(sim).flash;if(f)f.t+=dt;},
  onLevel(sim){if(sim.p.set==='plant'&&!atLeast('honors'))sim.p.set='vert';},
  infoPanel(sim){const S=set(sim),p=st(sim).placed,sc=score(sim);
    let h=`<h3>Trait table: ${S.name}</h3><p>A ✓ means the organism has the trait. Press <b>Place</b> on the trait you think evolved next.</p><div class="tbl-wrap"><table><thead><tr><th>Trait</th>${S.taxa.map(t=>`<th>${t}</th>`).join('')}<th></th></tr></thead><tbody>`;
    S.traits.forEach((t,i)=>{const k=p.indexOf(i);h+=`<tr><td>${t.n}</td>${S.taxa.map((x,j)=>`<td>${t.has.includes(j)?'✓':''}</td>`).join('')}<td>${k>=0?`<span class="${sc.per[i]>1?'verdict no':'verdict ok'}" style="margin:0">Step ${k+1}</span>`:`<button type="button" class="btn" data-place="${i}">Place</button>`}</td></tr>`;});
    h+=`</tbody></table></div>`;
    if(sc.done)h+=`<p style="margin-top:10px">This tree needs <b>${sc.total} trait changes</b>. The fewest possible is ${sc.best}.${sc.total===sc.best?' It is the most parsimonious tree.':' Some trait has to evolve more than once.'}</p>`;
    if(atLeast('ap')&&S.cytc)h+=`<h3 style="margin-top:12px">Molecular evidence</h3><p>Amino-acid differences in cytochrome c compared with humans (approximate teaching values):</p><div class="tbl-wrap"><table><thead><tr>${S.taxa.map(t=>`<th>${t}</th>`).join('')}</tr></thead><tbody><tr>${S.taxa.map(t=>`<td>${S.cytc[t]}</td>`).join('')}</tr></tbody></table></div>`;
    return h;},
  bindInfo(sim,el){el.querySelectorAll('[data-place]').forEach(b=>b.addEventListener('click',()=>{place(sim,+b.dataset.place);BioLab.refresh(sim);}));},
  narrate(sim){const S=set(sim),p=st(sim).placed,sc=score(sim),nm=S===SETS.vert?'animals':'plants';
    if(!p.length)return `Every ${nm==='animals'?'animal':'plant'} except the ${S.taxa[0].toLowerCase()} shares at least one trait. <b>Place the trait shared by the most ${nm} first</b>: it evolved earliest, so it sits closest to the root.`;
    const bad=S.traits.map((t,i)=>i).filter(i=>p.includes(i)&&sc.per[i]>1);
    if(bad.length)return `<b>${S.traits[bad[0]].n} has to evolve ${sc.per[bad[0]]} separate times</b> on this tree, because ${nm} that have it ended up on different branches. Undo and place a more widespread trait first.`;
    if(sc.done)return `Done. Each trait evolves exactly once, so the tree needs only <b>${sc.total} changes</b>. ${S.taxa[S.taxa.length-1]} and ${S.taxa[S.taxa.length-2]} share the most recent common ancestor.`;
    const last=S.traits[p[p.length-1]],lost=sc.tr.nodes[sc.tr.nodes.length-1].lose.map(i=>S.taxa[i]);
    return `<b>${last.n}</b> evolved after ${lost.length?lost.join(' and ')+' branched off':'the last branch point'}. Next, find the trait shared by the most ${nm} still on the main line.`;},
  draw(sim,ctx,vdt,k){k=Math.min(k,1.3);const L=layout(sim),S=L.S,ink=PAL['cv-ink'],soft=PAL['cv-soft'],time=sim.p.view==='time'&&atLeast('ap');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(time)return drawTime(sim,ctx,k,S);
    // stem and branches
    ctx.lineCap='round';ctx.strokeStyle=ink;ctx.lineWidth=3;
    const endP=L.fin||L.nodes[L.nodes.length-1]||L.R;
    ctx.beginPath();ctx.moveTo(L.R.x,L.R.y);ctx.lineTo(endP.x,endP.y);ctx.stroke();
    L.nodes.forEach(n=>n.lose.forEach(t=>{ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(L.tips[t].x,L.tips[t].y+16);ctx.stroke();}));
    const fanFrom=L.fin||endP;L.tr.crown.forEach(t=>{ctx.beginPath();ctx.moveTo(fanFrom.x,fanFrom.y);ctx.lineTo(L.tips[t].x,L.tips[t].y+16);ctx.stroke();});
    // root label
    txt(ctx,'Root',L.R.x-8,L.R.y-10,{s:12.5*k,w:700,c:soft,a:'right'});
    // nodes
    L.nodes.forEach(n=>{ctx.fillStyle=PAL['card'];ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.beginPath();ctx.arc(n.x,n.y,6,0,6.29);ctx.fill();ctx.stroke();});
    if(L.fin){ctx.fillStyle=PAL['card'];ctx.beginPath();ctx.arc(L.fin.x,L.fin.y,6,0,6.29);ctx.fill();ctx.stroke();}
    // hash marks: trait i sits on the stem just before its branch point
    const sc=L.sc,fl=st(sim).flash;
    L.nodes.forEach((n,j)=>{const prev=j?L.nodes[j-1]:L.R,mx=(prev.x+n.x)/2,my=(prev.y+n.y)/2,ang=Math.atan2(n.y-prev.y,n.x-prev.x)+Math.PI/2,bad=sc.per[n.trait]>1;
      const pulse=fl&&fl.ti===n.trait&&fl.t<1.2?1+0.6*Math.sin(fl.t*10)*(1-fl.t/1.2):1;
      ctx.strokeStyle=bad?PAL['s1']:PAL['s2'];ctx.lineWidth=5*pulse;ctx.beginPath();ctx.moveTo(mx-Math.cos(ang)*14,my-Math.sin(ang)*14);ctx.lineTo(mx+Math.cos(ang)*14,my+Math.sin(ang)*14);ctx.stroke();
      txt(ctx,S.traits[n.trait].s+(bad?' (evolves '+sc.per[n.trait]+'×)':''),mx+14,my+18,{s:13*k,w:700,c:bad?PAL['s1']:PAL['s2']});});
    // tips
    L.order.forEach(t=>{const p=L.tips[t];ctx.font='700 '+14*k+'px '+FONT;const w=ctx.measureText(S.taxa[t]).width+16;rr(ctx,p.x-w/2,p.y-12,w,26,13);ctx.fillStyle=S.col[t];ctx.fill();
      txt(ctx,S.taxa[t],p.x,p.y+2,{s:14*k,w:700,c:'#fff',a:'center',b:'middle'});});
    const unresolved=L.tr.crown.length>2||(L.tr.crown.length===2&&st(sim).placed.length<S.traits.length);
    if(unresolved){const ps=L.tr.crown.map(t=>L.tips[t].x);txt(ctx,'Not resolved yet',(Math.min(...ps)+Math.max(...ps))/2,40,{s:12.5*k,w:700,c:PAL['s1'],a:'center'});}
    if(sc.done)pill(ctx,sc.total===sc.best?'Most parsimonious: '+sc.total+' changes':'Changes needed: '+sc.total+' (best is '+sc.best+')',640,425,sc.total===sc.best?PAL['s3']:PAL['s1'],'#fff',12.5*k);
    txt(ctx,'Hash mark = a new trait evolves',22,442,{s:12*k,c:soft});},
  tour:[
    {title:'The organisms',text:'Each colored tag at the top is a living group. A cladogram shows how they are related through common ancestors, not which one came “first”.',focus:[20,52,760,56],pause:true,setup(sim){st(sim).placed=correctOrder(set(sim)).slice();}},
    {title:'The outgroup',text:'The outgroup branched off before any of the listed traits evolved. It helps you see which traits are new (derived) in the other groups.',focus(sim){const L=layout(sim),p=L.tips[0];return [p.x-60,52,120,360];},pause:true},
    {title:'Shared derived traits',text:'Each hash mark is a new trait that evolved once and was passed down to everything above it on the tree. Traits shared by more organisms evolved earlier, closer to the root.',focus:[40,110,640,310],pause:true},
    {title:'Branch points are common ancestors',text:'Every branch point (circle) stands for a real ancestral population. Everything branching off above it descends from that ancestor.',focus(sim){const n=layout(sim).nodes[2]||layout(sim).nodes[0];return [n.x-30,n.y-30,60,60];},pause:true},
    {title:'Reading relatedness',text:'Two groups are most closely related when they share the most recent common ancestor: the branch point highest on the tree that joins them.',focus(sim){const L=layout(sim),a=L.tips[L.order[L.order.length-2]],b=L.tips[L.order[L.order.length-1]];return [a.x-60,52,b.x-a.x+120,140];},pause:true},
    {lvl:'honors',title:'Parsimony',text:'Scientists prefer the tree that needs the fewest trait changes. If a trait had to appear twice, that tree is less likely. Try placing Lungs before Jaws and watch the count go up.',focus:[480,400,320,48],pause:true},
    {lvl:'ap',title:'Adding time',text:'Switch the view to Timeline to see the same tree with each branch point at its estimated age in millions of years.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{view:'time'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{view:'tree'});},
  challenges(sim){const S=set(sim),vert=S===SETS.vert;
    if(vert)return [
      {lvl:'bio',instant:true,q:'Which animal is the outgroup, the one that branched off first?',choices:['Lamprey','Lancelet','Shark','Human'],correct:1,explain:'The lancelet has none of the traits in the table, not even a backbone. It branched off before any of them evolved, so it is the outgroup.'},
      {lvl:'bio',instant:true,q:'Which trait evolved first?',choices:['Jaws','Backbone','Lungs','Hair'],correct:1,explain:'Six of the seven animals have a backbone, more than any other trait. A trait shared by more groups evolved earlier, closer to the root.'},
      {lvl:'bio',instant:true,q:'Which animal is the human’s closest relative on this tree?',choices:['Lizard','Frog','Mouse','Shark'],correct:2,explain:'Humans and mice share hair and mammary glands, the most recent trait on the tree. Their common ancestor lived about 90 million years ago.'},
      {lvl:'honors',instant:true,q:'Does the frog share a more recent common ancestor with the shark or with the lizard?',choices:['The shark','The lizard','Both are equally related'],correct:1,explain:'The frog and the lizard both have lungs, which the shark lacks. The branch point joining frog and lizard is higher on the tree than the one joining frog and shark.'},
      {lvl:'honors',instant:true,q:'You place Lungs before Jaws. What happens to the tree?',choices:['Nothing changes','Jaws must evolve twice, so the tree needs more changes','Lungs must evolve twice'],correct:1,explain:'Placing Lungs first sends the shark off the main line, but the shark has jaws too. Jaws would then have to evolve once on the shark branch and again on the main line: 6 changes instead of 5.'},
      {lvl:'ap',instant:true,q:'About when did the last common ancestor of frogs and humans live?',choices:['About 90 million years ago','About 350 million years ago','About 550 million years ago'],correct:1,explain:'Frogs branch off at the lungs-to-amniotic-egg node, about 350 million years ago, when the first four-limbed vertebrates were splitting into amphibians and amniotes.'},
      {lvl:'ap',instant:true,q:'Cytochrome c differs from the human version by 9 amino acids in mice, 18 in frogs and 24 in sharks. What does this show?',choices:['The molecular data contradict the cladogram','The molecular data support the cladogram: fewer differences, more recent common ancestor','Sharks evolved from frogs'],correct:1,explain:'The more recently two groups shared an ancestor, the less time their genes have had to change. The order of differences matches the order of branch points, so independent evidence supports the same tree.'}];
    return [
      {lvl:'bio',instant:true,q:'Which organism is the outgroup?',choices:['Moss','Green alga','Fern'],correct:1,explain:'The green alga lacks every land-plant trait in the table, so it branched off first.'},
      {lvl:'bio',instant:true,q:'Which plant is the closest relative of flowering plants?',choices:['Fern','Moss','Pine'],correct:2,explain:'Pines and flowering plants both make seeds, the most recent shared trait. Their common ancestor is the highest branch point joining them.'},
      {lvl:'honors',instant:true,q:'Do ferns share a more recent common ancestor with mosses or with pines?',choices:['Mosses','Pines'],correct:1,explain:'Ferns and pines both have vascular tissue, which mosses lack. So ferns and pines share a more recent ancestor.'},
      {lvl:'honors',instant:true,q:'Why is “Flowers and fruit” the last trait placed?',choices:['It is the most important trait','Only one group in the table has it, so it evolved most recently','Flowers are the largest structure'],correct:1,explain:'Only flowering plants have flowers. A trait found in just one group evolved after that group split from its closest relative.'},
      {lvl:'ap',instant:true,q:'Using the timeline, when did seeds most likely evolve?',choices:['Between about 380 and 300 million years ago','Less than 140 million years ago','More than 470 million years ago'],correct:0,explain:'Seeds evolved after ferns split from seed plants (about 380 million years ago) and before pines split from flowering plants (about 300 million years ago).'},
      {lvl:'ap',instant:true,q:'A finished plant tree needs 4 trait changes. Is any 4-trait tree with fewer changes possible?',choices:['Yes, 3 changes','No: each trait must appear at least once, so 4 is the minimum','It depends on the outgroup'],correct:1,explain:'Every trait has to evolve at least once, so a tree with 4 traits needs at least 4 changes. A tree that reaches that minimum is the most parsimonious.'}];},
  challengeTitle:'Read the tree',
  terms:[{t:'Cladogram',d:'A branching diagram that groups organisms by shared derived traits.'},{t:'Common ancestor',d:'An ancestral population that two or more groups descend from. Shown as a branch point.'},{t:'Outgroup',d:'The group that branched off first. It helps show which traits are new.'},{t:'Derived trait',d:'A new trait that appeared in an ancestor and was inherited by its descendants.'},
    {lvl:'honors',t:'Parsimony',d:'Choosing the tree that needs the fewest evolutionary changes.'},{lvl:'honors',t:'Clade',d:'An ancestor and all of its descendants.'},
    {lvl:'ap',t:'Phylogenetic tree',d:'A tree drawn with a timescale, so branch points sit at their estimated ages.'},{lvl:'ap',t:'Molecular evidence',d:'Similarities in DNA or protein sequences, used to test trees built from anatomy.'}],
  about:'<p>Each data set lists traits that are nested: every organism with a later trait also has the earlier ones. Ordering traits from most to fewest organisms then gives the most parsimonious tree.</p><p>Parsimony is counted with the Sankoff method on the tree you build, with the ancestor at the root lacking every trait. Ages are rounded estimates from the fossil record. Cytochrome c differences are approximate teaching values. Real trees also use many more traits, and some traits are lost or evolve more than once.</p>'
};
function drawTime(sim,ctx,k,S){const ink=PAL['cv-ink'],soft=PAL['cv-soft'],N=S.taxa.length,tipX=i=>120+i*(600/(N-1)),top=timeY(0);
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;
  for(let a=0;a<=500;a+=100){const y=timeY(a);ctx.beginPath();ctx.moveTo(74,y);ctx.lineTo(780,y);ctx.stroke();txt(ctx,a===0?'Today':a+' Mya',66,y+4,{s:12*k,c:soft,a:'right'});}
  // rectangular ladder tree: node j joins taxon j with the clade of everything to its right
  const nodeX=[];nodeX[N-2]=(tipX(N-2)+tipX(N-1))/2;for(let j=N-3;j>=0;j--)nodeX[j]=(tipX(j)+nodeX[j+1])/2;
  ctx.strokeStyle=ink;ctx.lineWidth=3;ctx.lineCap='round';
  const line=(x1,y1,x2,y2)=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
  for(let t=0;t<N;t++)line(tipX(t),top,tipX(t),timeY(S.ages[Math.min(t,N-2)]));
  for(let j=0;j<=N-2;j++){const y=timeY(S.ages[j]),right=j===N-2?tipX(N-1):nodeX[j+1];line(tipX(j),y,right,y);
    if(j<N-2)line(nodeX[j+1],timeY(S.ages[j+1]),nodeX[j+1],y);}
  line(nodeX[0],timeY(S.ages[0]),nodeX[0],timeY(S.ages[0])+14);
  for(let j=0;j<=N-2;j++){const y=timeY(S.ages[j]);ctx.fillStyle=PAL['card'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(nodeX[j],y,5.5,0,6.29);ctx.fill();ctx.stroke();ctx.lineWidth=3;
    ctx.font='600 '+12*k+'px '+FONT;const lw=ctx.measureText(S.ages[j]+' Mya').width;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(nodeX[j]+7,y-20*k+2,lw+6,16*k);txt(ctx,S.ages[j]+' Mya',nodeX[j]+10,y-7,{s:12*k,w:600,c:soft});}
  S.taxa.forEach((nm,i)=>{const x=tipX(i);ctx.font='700 '+13.5*k+'px '+FONT;const w=ctx.measureText(nm).width+14;rr(ctx,x-w/2,top-34,w,24,12);ctx.fillStyle=S.col[i];ctx.fill();txt(ctx,nm,x,top-21,{s:13.5*k,w:700,c:'#fff',a:'center',b:'middle'});});
  txt(ctx,'Each branch point sits at its estimated age. Lower on the page means longer ago.',400,442,{s:12.5*k,c:soft,a:'center'});}
BioLab.register(CLAD);
})();
