(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,axes,bars,serColor}=BioLab.h;

/* ---------------- a small teaching database ----------------
   Sequences are generated once from a shared ancestor along a realistic tree, so related
   species really are more similar. They are teaching sequences, not GenBank records. */
const BCOL={A:'#2f9a4c',C:'#2f6fd0',G:'#d89a12',T:'#d0453a','-':'#9aa0a6'};
const SEQLEN=150;
const DB=(function(){const r=rng(2026),B='ACGT',rand=n=>Array.from({length:n},()=>B[Math.floor(r()*4)]).join('');
  const mut=(s,f)=>s.split('').map(c=>r()<f?B[(B.indexOf(c)+1+Math.floor(r()*3))%4]:c).join('');
  const root=rand(SEQLEN),fish=mut(root,0.18),tet=mut(root,0.18),bird=mut(tet,0.12),mam=mut(tet,0.10),rum=mut(mam,0.05);
  const del=(s,i,n)=>s.slice(0,i)+s.slice(i+n),ins=(s,i,t)=>s.slice(0,i)+t+s.slice(i);
  const D=[
    {id:'human',name:'Human',sci:'Homo sapiens',seq:mut(mam,0.09)},
    {id:'cow',name:'Cow',sci:'Bos taurus',seq:mut(rum,0.04)},
    {id:'deer',name:'Deer',sci:'Odocoileus virginianus',seq:mut(rum,0.04)},
    {id:'pig',name:'Pig',sci:'Sus scrofa',seq:mut(mam,0.07)},
    {id:'horse',name:'Horse',sci:'Equus caballus',seq:ins(mut(mam,0.07),70,'GCA')},
    {id:'chicken',name:'Chicken',sci:'Gallus gallus',seq:mut(bird,0.05)},
    {id:'turkey',name:'Turkey',sci:'Meleagris gallopavo',seq:mut(bird,0.05)},
    {id:'tuna',name:'Tuna',sci:'Thunnus albacares',seq:mut(fish,0.11)},
    {id:'salmon',name:'Salmon',sci:'Salmo salar',seq:mut(fish,0.11)},
    {id:'tilapia',name:'Tilapia',sci:'Oreochromis niloticus',seq:del(mut(fish,0.09),60,3)},
    {id:'catfish',name:'Catfish',sci:'Ictalurus punctatus',seq:mut(fish,0.11)},
    {id:'gfp',name:'GFP gene',sci:'Aequorea victoria (jellyfish)',seq:rand(SEQLEN)}];
  return D;})();
const byId=id=>DB.find(d=>d.id===id);
const COMP={A:'T',T:'A',G:'C',C:'G'};
const revcomp=s=>s.split('').reverse().map(c=>COMP[c]).join('');
const QUERIES={
  burger:{l:'Burger patty sold as beef',src:'horse',muts:[33],lvl:'bio'},
  cheek:{l:'Your cheek cells (mitochondrial DNA)',src:'human',muts:[],lvl:'bio'},
  gfp:{l:'Glowing E. coli colony (pGLO)',src:'gfp',muts:[],lvl:'bio'},
  venison:{l:'Venison jerky',src:'deer',muts:[51],lvl:'honors'},
  snapper:{l:'Fillet sold as “red snapper”',src:'tilapia',muts:[18,77],lvl:'honors'},
  reverse:{l:'Sample X (read from the other strand)',src:'chicken',muts:[40],rc:true,lvl:'ap'}};
function querySeq(id){const q=QUERIES[id]||QUERIES.burger,src=byId(q.src).seq;let s=src.slice(22,122).split('');
  q.muts.forEach(i=>{const B='ACGT';s[i]=B[(B.indexOf(s[i])+2)%4];});s=s.join('');return q.rc?revcomp(s):s;}

/* ---------------- search: word seeds, then Smith–Waterman ---------------- */
const MATCH=2,MIS=-3,GAP=-5,LAMBDA=0.634,KK=0.46;
function seeds(q,s,W){const idx=new Map();for(let i=0;i+W<=s.length;i++){const w=s.slice(i,i+W);if(!idx.has(w))idx.set(w,[]);idx.get(w).push(i);}
  const out=[];for(let i=0;i+W<=q.length;i++){const hit=idx.get(q.slice(i,i+W));if(hit)hit.forEach(j=>out.push([i,j]));}return out;}
function sw(q,s){const m=q.length,n=s.length,H=[],T=[];for(let i=0;i<=m;i++){H.push(new Int16Array(n+1));T.push(new Uint8Array(n+1));}
  let best=0,bi=0,bj=0;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){const d=H[i-1][j-1]+(q[i-1]===s[j-1]?MATCH:MIS),u=H[i-1][j]+GAP,l=H[i][j-1]+GAP;let v=0,t=0;
    if(d>v){v=d;t=1;}if(u>v){v=u;t=2;}if(l>v){v=l;t=3;}H[i][j]=v;T[i][j]=t;if(v>best){best=v;bi=i;bj=j;}}
  let i=bi,j=bj,aq='',as='';while(i>0&&j>0&&T[i][j]){const t=T[i][j];if(t===1){aq=q[i-1]+aq;as=s[j-1]+as;i--;j--;}else if(t===2){aq=q[i-1]+aq;as='-'+as;i--;}else{aq='-'+aq;as=s[j-1]+as;j--;}}
  let id=0;for(let k=0;k<aq.length;k++)if(aq[k]===as[k])id++;
  return {score:best,qs:i,qe:bi,ss:j,se:bj,aq,as,ident:aq.length?id/aq.length:0,len:aq.length};}
function search(sim){const s=sim.st,raw=querySeq(sim.p.query),q=sim.p.rc&&atLeast('ap')?revcomp(raw):raw,W=+sim.p.word||11;
  const space=q.length*DB.reduce((a,d)=>a+d.seq.length,0);
  s.q=q;s.res=DB.map((d,k)=>{const sd=seeds(q,d.seq,W);if(!sd.length)return {k,d,seeds:[],hit:false};const a=sw(q,d.seq);
    const E=KK*space*Math.exp(-LAMBDA*a.score),bits=(LAMBDA*a.score-Math.log(KK))/Math.LN2;
    return Object.assign({k,d,seeds:sd,hit:E<10,E,bits,cover:(a.qe-a.qs)/q.length},a);});
  s.ranked=s.res.filter(r=>r.hit).sort((a,b)=>b.score-a.score);s.sel=s.ranked.length?s.ranked[0].k:-1;}
function run(sim){search(sim);sim.st.phase='seed';sim.st.pt=0;sim.infoDirty=true;}
function finish(sim){if(sim.st.phase==='idle')run(sim);sim.st.phase='done';sim.st.pt=9;sim.infoDirty=true;}
const top=sim=>{const s=sim.st;return s.phase==='done'&&s.ranked&&s.ranked.length?s.ranked[0]:null;};
const fmtE=E=>E===undefined?'—':E<1e-180?'0.0':E<0.001?E.toExponential(0).replace('e','e'):E.toFixed(E<1?3:1);
const SEED_T=2.0,EXT_T=1.6;

const BL={
  id:'blast',hash:'blast',apUnit:10,order:5,tab:'Sequence search (BLAST)',kind:'Virtual lab',prereq:['expression'],
  card:'Identify a mystery sample from its DNA: watch BLAST find matching words, extend them into alignments and rank the hits.',
  title:'Sequence search: identify a sample with BLAST',
  lede:{bio:'Paste in a DNA sequence and BLAST compares it with known sequences. The best match tells you what species the sample came from.',
        honors:'Read a hit list like a scientist: percent identity, query cover and E value. Catch mislabeled food from its DNA.',
        ap:'See how BLAST works inside: short exact “words” seed each hit, Smith–Waterman alignment extends it, and the E value says how likely the match is by chance.'},
  scale:'Each sequence is a 100–150 base stretch of DNA, like the barcode region of the mitochondrial COI gene used to identify species. Real BLAST searches billions of bases.',
  timeless:true,animated:true,aspect:1.6,thumbFrames:1,
  thumbSetup(sim){finish(sim);},
  controls:[
    {id:'query',label:'Sample to identify',type:'select',def:'burger',lvl:'bio',options:Object.keys(QUERIES).map(k=>({v:k,l:QUERIES[k].l,lvl:QUERIES[k].lvl})),
     onChange(sim){sim.st.phase='idle';sim.st.res=null;sim.st.ranked=null;sim.st.q=querySeq(sim.p.query);sim.infoDirty=true;}},
    {id:'rc',label:'Search the reverse complement',type:'toggle',def:false,lvl:'ap',help:'Flips the query to the other DNA strand: reverse the order and swap A↔T, G↔C.',
     onChange(sim){if(sim.st.phase!=='idle')run(sim);else sim.st.q=sim.p.rc?revcomp(querySeq(sim.p.query)):querySeq(sim.p.query);}},
    {id:'word',label:'Word size',type:'seg',def:'11',lvl:'ap',options:[{v:'7',l:'7'},{v:'11',l:'11'},{v:'20',l:'20'}],help:'Length of the exact match needed to start a hit. Smaller is more sensitive but slower.',
     onChange(sim){if(sim.st.phase!=='idle')run(sim);}}
  ],
  actions:[{id:'run',label:'Run BLAST',primary:true,run(sim){run(sim);}},{id:'done',label:'Skip to results',run(sim){finish(sim);}}],
  init(sim){return {phase:'idle',pt:0,q:querySeq(sim.p.query||'burger'),res:null,ranked:null,sel:-1,rowY:DB.map((d,i)=>i)};},
  step(sim,dt){const s=sim.st;if(s.phase==='seed'){s.pt+=dt;if(s.pt>=SEED_T){s.phase='extend';s.pt=0;}}else if(s.phase==='extend'){s.pt+=dt;if(s.pt>=EXT_T){s.phase='done';s.pt=0;sim.infoDirty=true;}}
    // rows slide into ranked order once results are in
    const target=DB.map((d,i)=>i);if(s.phase==='done'&&s.res){const order=s.res.slice().sort((a,b)=>(b.hit?b.score:-1)-(a.hit?a.score:-1)||a.k-b.k);order.forEach((r,i)=>target[r.k]=i);}
    s.rowY=s.rowY.map((y,i)=>y+(target[i]-y)*Math.min(1,dt*6));},
  metrics:[
    {id:'top',label:'Top hit',unit:'',lvl:'bio',text:true,get:s=>{const t=top(s);return s.st.phase!=='done'?'—':t?t.d.name:'No significant match';}},
    {id:'ident',label:'Identity',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>{const t=top(s);return t?t.ident*100:NaN;}},
    {id:'evalue',label:'E value',unit:'',lvl:'honors',text:true,get:s=>{const t=top(s);return t?fmtE(t.E):'—';}},
    {id:'cover',label:'Query cover',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>{const t=top(s);return t?t.cover*100:NaN;}},
    {id:'bits',label:'Bit score',unit:'bits',lvl:'ap',min:0,max:null,d:0,get:s=>{const t=top(s);return t?t.bits:NaN;}},
    {id:'nhits',label:'Significant hits',unit:'',lvl:'bio',min:0,max:12,d:0,get:s=>s.st.phase==='done'&&s.st.ranked?s.st.ranked.length:NaN}
  ],
  graphs:[{id:'scores',label:'Bit score for each database sequence',custom:true}],defaultGraph:'scores',
  plot(sim,ctx,box){const s=sim.st;if(s.phase!=='done'||!s.res){txt(ctx,'Run BLAST to see a score for every sequence in the database.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
    const vals=DB.map((d,i)=>{const r=s.res[i];return r.hit?r.bits:0;}),mx=Math.max(60,...vals)*1.15;
    const ax=axes(ctx,box,{xmin:0,xmax:DB.length,ymin:0,ymax:mx,xcats:DB.map(d=>d.name.replace(' gene','').slice(0,7)),yl:'Bit score (0 = no hit)'});
    bars(ctx,ax,vals,{colors:vals.map((v,i)=>i===s.sel?serColor(0):serColor(1)),d:0,width:.7});},
  infoPanel(sim){const s=sim.st,q=QUERIES[sim.p.query];
    if(s.phase!=='done')return `<h3>Hit list</h3><p>${s.phase==='idle'?'Press <b>Run BLAST</b> to search the database for sequences similar to the sample.':'Searching…'}</p>`;
    if(!s.ranked.length)return `<h3>Hit list</h3><p><b>No significant similarity found.</b> Nothing in the database shares even one exact ${sim.p.word||11}-base word with this query.</p>${atLeast('ap')?'<p class="help">Hint: which strand was this read from?</p>':''}`;
    return `<h3>Hit list: ${q.l}</h3><div class="tbl-wrap"><table><thead><tr><th>Description</th>${atLeast('honors')?'<th>Score</th><th>E value</th><th>Cover</th>':''}<th>Identity</th><th></th></tr></thead><tbody>${
      s.ranked.map(r=>`<tr><td><b>${r.d.name}</b> <i>${r.d.sci}</i></td>${atLeast('honors')?`<td>${r.bits.toFixed(0)}</td><td>${fmtE(r.E)}</td><td>${Math.round(r.cover*100)}%</td>`:''}<td>${(r.ident*100).toFixed(0)}%</td><td><button type="button" class="btn" data-hit="${r.k}"${r.k===s.sel?' aria-pressed="true"':''}>${r.k===s.sel?'Shown':'Align'}</button></td></tr>`).join('')}</tbody></table></div>
      <p class="help" style="margin-top:8px">Teaching sequences, not real GenBank records.</p>`;},
  bindInfo(sim,el){el.querySelectorAll('[data-hit]').forEach(b=>b.addEventListener('click',()=>{sim.st.sel=+b.dataset.hit;BioLab.refresh(sim);}));},
  onClick(sim,x,y){const s=sim.st;if(s.phase!=='done')return;DB.forEach((d,i)=>{const ry=88+s.rowY[i]*21;if(Math.abs(y-ry)<10&&s.res[i].hit)s.sel=i;});},
  narrate(sim){const s=sim.st,W=sim.p.word||11;
    if(s.phase==='idle')return `The query is ${s.q.length} bases of DNA from the sample. BLAST will compare it with every sequence in the database. Press <b>Run BLAST</b>.`;
    if(s.phase==='seed')return `<b>Seeding.</b> BLAST looks for short exact matches (“words” of ${W} bases) shared by the query and each database sequence. Yellow marks are matching words. No word, no hit.`;
    if(s.phase==='extend')return `<b>Extending.</b> From each seed, BLAST extends the match in both directions, allowing mismatches and gaps, and keeps the best-scoring stretch (local alignment).`;
    const t=top(sim);if(!t)return `<b>No significant matches.</b> The query shares no ${W}-base word with any sequence${atLeast('ap')&&!sim.p.rc&&QUERIES[sim.p.query].rc?'. This read came off the other strand: try the reverse complement.':'.'}`;
    const second=s.ranked[1];
    let m=`Top hit: <b>${t.d.name}</b> (<i>${t.d.sci}</i>), ${(t.ident*100).toFixed(0)}% identical over ${t.len} bases.`;
    if(t.ident>0.97)m+=' That is close enough to call the species.';
    if(second)m+=` Next best: ${second.d.name} at ${(second.ident*100).toFixed(0)}%, a related species, not a match.`;
    if(atLeast('honors')&&sim.p.query==='snapper')m+=' The fillet is not snapper at all.';
    if(atLeast('honors')&&sim.p.query==='burger')m+=' The “beef” is horse.';
    return m;},
  draw(sim,ctx,vdt,k){const s=sim.st,soft=PAL['cv-soft'],ink=PAL['cv-ink'],H=500,q=s.q||'';ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,H);
    const QX=112,QW=570,qx=i=>QX+i*QW/100,SX=112,sx=j=>SX+j*QW/SEQLEN;
    // query strip
    txt(ctx,'Query',16,46,{s:13*k,w:700});txt(ctx,QUERIES[sim.p.query].l+(sim.p.rc&&atLeast('ap')?' · reverse complement':''),QX,22,{s:13*k,w:600,c:soft});
    for(let i=0;i<q.length;i++){ctx.fillStyle=BCOL[q[i]];ctx.fillRect(qx(i),34,QW/100-0.8,18);}
    txt(ctx,q.length+' bases',QX+QW+8,48,{s:12*k,c:soft});
    txt(ctx,'Database',16,76,{s:13*k,w:700});
    if(s.phase==='done')txt(ctx,'Bit score',694,76,{s:12*k,w:700,c:soft});
    const rowY=i=>88+s.rowY[i]*21;
    const seedFrac=s.phase==='seed'?s.pt/SEED_T:s.phase==='idle'?0:1,extFrac=s.phase==='extend'?s.pt/EXT_T:s.phase==='done'?1:0,curRow=Math.floor(seedFrac*DB.length);
    DB.forEach((d,i)=>{const y=rowY(i),r=s.res&&s.res[i],sel=s.phase==='done'&&i===s.sel;
      if(sel){ctx.fillStyle=PAL['card2'];ctx.fillRect(8,y-10,784,20);}
      txt(ctx,d.name,16,y+4,{s:12.5*k,w:sel?700:500,c:r&&s.phase==='done'&&!r.hit?soft:ink});
      ctx.globalAlpha=s.phase==='done'&&r&&!r.hit?0.25:0.5;for(let j=0;j<d.seq.length;j++){ctx.fillStyle=BCOL[d.seq[j]];ctx.fillRect(sx(j),y-5,QW/SEQLEN-0.5,10);}ctx.globalAlpha=1;
      if(!r)return;
      // seeds appear as the scan passes each row
      if(i<curRow||seedFrac>=1){ctx.fillStyle=PAL['cv-e'];r.seeds.forEach(([qi,sj])=>{ctx.fillRect(sx(sj),y-8,(+sim.p.word||11)*QW/SEQLEN,3);});}
      if(i===curRow&&s.phase==='seed'){ctx.strokeStyle=PAL['cv-e'];ctx.lineWidth=1;r.seeds.slice(0,40).forEach(([qi,sj])=>{ctx.beginPath();ctx.moveTo(qx(qi),52);ctx.lineTo(sx(sj),y-8);ctx.stroke();});
        ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.strokeRect(SX-4,y-11,QW+8,22);}
      // extension: the aligned stretch grows out from the seeds
      if(r.hit&&extFrac>0){const mid=(r.ss+r.se)/2,half=(r.se-r.ss)/2*extFrac;ctx.fillStyle=r.ident>0.95?PAL['s3']:r.ident>0.8?PAL['s6']:PAL['s4'];ctx.globalAlpha=0.85;ctx.fillRect(sx(mid-half),y-4,sx(mid+half)-sx(mid-half),8);ctx.globalAlpha=1;}
      if(s.phase==='done'&&r.hit){const w=clamp(r.bits/300,0,1)*80;ctx.fillStyle=sel?PAL['s1']:PAL['s2'];ctx.fillRect(694,y-5,w,10);txt(ctx,r.bits.toFixed(0),698+w,y+4,{s:11.5*k,c:soft});}});
    // alignment of the selected hit
    const by=350;ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(10,by);ctx.lineTo(790,by);ctx.stroke();
    const r=s.phase==='done'&&s.res&&s.sel>=0?s.res[s.sel]:null;
    if(!r){txt(ctx,s.phase==='done'?'No alignment to show.':'The best alignment will appear here.',16,by+28,{s:13*k,c:soft});return;}
    txt(ctx,`Alignment: query vs ${r.d.name}  ·  ${(r.ident*100).toFixed(0)}% identical (${Math.round(r.ident*r.len)}/${r.len})  ·  ${r.aq.split('').filter((c,i)=>c==='-'||r.as[i]==='-').length} gap positions`,16,by+20,{s:13*k,w:700});
    const COLS=56,cw=12.2,x0=96;for(let b=0;b<2;b++){const st0=b*COLS;if(st0>=r.aq.length)break;const y=by+46+b*64;
      const qpos=r.qs+1+r.aq.slice(0,st0).replace(/-/g,'').length,spos=r.ss+1+r.as.slice(0,st0).replace(/-/g,'').length;
      txt(ctx,'Query '+qpos,x0-8,y,{s:11.5*k,c:soft,a:'right'});txt(ctx,'Sbjct '+spos,x0-8,y+30,{s:11.5*k,c:soft,a:'right'});
      for(let c=0;c<COLS&&st0+c<r.aq.length;c++){const a=r.aq[st0+c],bb=r.as[st0+c],x=x0+c*cw,m=a===bb;
        if(!m){ctx.fillStyle=a==='-'||bb==='-'?'rgba(150,150,160,.25)':'rgba(211,47,47,.18)';ctx.fillRect(x-1,y-12,cw-0.5,46);}
        txt(ctx,a,x+cw/2-0.5,y,{s:12*k,w:700,c:a==='-'?soft:BCOL[a],a:'center'});txt(ctx,bb,x+cw/2-0.5,y+30,{s:12*k,w:700,c:bb==='-'?soft:BCOL[bb],a:'center'});
        if(m){ctx.fillStyle=ink;ctx.fillRect(x+cw/2-1.2,y+6,1.6,10);}}}
    if(r.aq.length>2*COLS)txt(ctx,'… '+(r.aq.length-2*COLS)+' more columns',x0+COLS*cw,by+144,{s:11.5*k,c:soft,a:'right'});},
  tour:[
    {title:'The query',text:'The query is DNA sequenced from the sample, here a burger patty. Each color is one base: A, C, G or T.',focus:[100,14,690,46],pause:true},
    {title:'The database',text:'BLAST compares the query with every sequence in a database. NCBI’s holds billions of bases; this one has 12 so you can watch each step.',focus:[8,62,680,280],pause:true},
    {title:'Seeding with words',text:'First BLAST finds short exact matches, “words” 11 bases long, shared by the query and a database sequence. Watch the scan move down the list; lines connect matching words.',focus:[8,14,784,330],speed:0.35,setup(sim){run(sim);}},
    {title:'Extending into alignments',text:'Each seed is extended in both directions, allowing a few mismatches, to find the best-scoring matching stretch. Unrelated sequences have no seeds, so they are skipped.',focus:[100,62,600,280],speed:0.35,setup(sim){if(sim.st.phase!=='extend'){run(sim);sim.st.phase='extend';sim.st.pt=0;}}},
    {title:'The hit list',text:'Hits are ranked by score. The top hit is almost identical to the query: that species is the source. Close relatives score lower, and unrelated sequences don’t appear.',focus:[8,62,784,280],pause:true,setup(sim){finish(sim);}},
    {title:'Reading the alignment',text:'Vertical bars mark matching bases. Shaded columns are mismatches or gaps. Count matches over the alignment length to get percent identity.',focus:[8,350,784,148],pause:true},
    {lvl:'honors',title:'Is it significant?',text:'The E value is the number of hits this good you would expect by pure chance in a database this size. Tiny E values (like 1e-40) mean the match is real.',focus:[690,62,104,280],pause:true},
    {lvl:'ap',title:'Which strand?',text:'DNA has two strands. A read from the opposite strand matches nothing until you take its reverse complement. (Real BLASTN checks both strands for you and reports Plus/Minus.)',focus:[100,14,690,46],pause:true,setup(sim){BioLab.setValues(sim,{query:'reverse'});run(sim);finish(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{query:'burger',rc:false});},
  chChange:0.3,chReveal:4.2,challengeTitle:'Solve the case',
  challenges:[
    {lvl:'bio',q:'A burger patty is sold as beef. BLAST its DNA. What animal is it really from?',choices:['Cow','Horse','Pig'],correct:1,baseline:{query:'burger'},baselineAction:'run',changeText:'Searching',
     explain:'The top hit is horse, nearly 100% identical. In 2013, DNA tests like this found horse meat in “beef” products across Europe and led to recalls in several countries.'},
    {lvl:'bio',q:'You BLAST mitochondrial DNA from your own cheek cells. What will the top hit be?',choices:['Human, about 100% identical','Pig, about 85% identical','No match at all'],correct:0,baseline:{query:'cheek'},baselineAction:'run',changeText:'Searching',
     explain:'Your DNA matches the human sequence almost exactly. Other mammals still match partway, because we share a common ancestor, but with many more differences.'},
    {lvl:'honors',q:'The venison sample differs from the deer reference at one base. What will its percent identity be?',choices:['About 50%','About 99%','No match: one difference breaks it'],correct:1,baseline:{query:'venison'},baselineAction:'run',changeText:'Searching',
     explain:'One mismatch in 100 bases gives 99% identity. Individuals of the same species often differ at a few bases, so BLAST hits of about 98% or more usually mean the same species.'},
    {lvl:'honors',q:'A fish market sells a fillet as “red snapper”. What does its DNA say?',choices:['Red snapper','Tilapia','Salmon'],correct:1,baseline:{query:'snapper'},baselineAction:'run',changeText:'Searching',
     explain:'The top hit is tilapia, a cheaper fish. DNA barcoding surveys have found that a large share of fish sold as red snapper in the US is actually another species.'},
    {lvl:'ap',q:'Sample X was sequenced from the opposite DNA strand. Searching it as-is, what will BLAST find?',choices:['The correct species','No significant hits','A random species'],correct:1,baseline:{query:'reverse'},baselineAction:'run',changeText:'Searching',
     explain:'The read is the reverse complement of the database sequence, so it shares no 11-base words with it. Without a seed there is no alignment.'},
    {lvl:'ap',q:'Now search the reverse complement of sample X. What will the top hit be?',choices:['Still nothing','Chicken','GFP gene'],correct:1,baseline:{query:'reverse'},baselineAction:'run',change:{rc:true},changeText:'Searching the reverse complement',reveal:4.8,
     explain:'Reversing the read and swapping A↔T and G↔C turns it back into the strand stored in the database. It now matches chicken almost exactly. Real BLASTN does this automatically.'},
    {lvl:'ap',instant:true,q:'Two hits: one with E = 1e-40 and one with E = 0.5. Which is the real match?',choices:['E = 1e-40','E = 0.5','Both are equally good'],correct:0,
     explain:'The E value is how many hits this good you would expect by chance. 1e-40 means essentially none; 0.5 means a hit this good turns up by chance about every other search.'}
  ],
  lab:{bio:'<p><b>Question:</b> What species is each sample from?</p><ol><li>Choose each sample in turn and press Run BLAST.</li><li>Record a trial for each, with the top hit and percent identity.</li></ol><p>Which samples were labeled honestly? Which were not?</p>',
       honors:'<p><b>Question:</b> How similar are related species?</p><ol><li>For the cheek-cell sample, record the identity of the top 5 hits (use the Align buttons).</li><li>Rank them from most to least similar.</li></ol><p>Does the ranking match what you know about how these animals are related?</p>',
       ap:'<p><b>Question:</b> How does word size change BLAST’s sensitivity?</p><ol><li>For the cheek-cell sample, record the number of significant hits at word sizes 7, 11 and 20.</li><li>Repeat for the “red snapper” sample.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain the trade-off between word size, sensitivity and search speed.</p>'},
  terms:[{t:'BLAST',d:'Basic Local Alignment Search Tool: finds database sequences similar to a query.'},{t:'Query',d:'The sequence you are searching with.'},{t:'Percent identity',d:'The share of aligned positions where the bases match.'},{t:'DNA barcoding',d:'Identifying a species from a short, standard gene region such as mitochondrial COI.'},
    {lvl:'honors',t:'E value',d:'The number of hits this good expected by chance. Smaller means more significant.'},{lvl:'honors',t:'Query cover',d:'How much of the query is included in the alignment.'},
    {lvl:'ap',t:'Seed (word)',d:'A short exact match that starts a BLAST hit.'},{lvl:'ap',t:'Local alignment',d:'The best-scoring matching stretch between two sequences (Smith–Waterman).'},{lvl:'ap',t:'Reverse complement',d:'The sequence of the opposite strand, read 5′ to 3′.'}],
  about:'<p>The database holds 12 short <b>teaching sequences</b> generated for this tool, not real GenBank records. They were made by mutating a shared ancestor along a realistic family tree (fish, birds, mammals; cow and deer as close relatives), so related species really are more similar. The horse and tilapia sequences carry small insertions or deletions so some alignments show gaps.</p><p><b>Search:</b> exact word seeds (default 11 bases, as in BLASTN’s smaller word sizes), then a Smith–Waterman local alignment scored +2 match, −3 mismatch, −5 per gap. E = K·m·n·e<sup>−λS</sup> with λ = 0.634 and K = 0.46 (ungapped estimates for this scoring), using the size of this tiny database, so real E values for the same score would be larger. Only the plus strand is searched, so you can see why strands matter; real BLASTN searches both.</p>'
};
BioLab.register(BL);
})();
