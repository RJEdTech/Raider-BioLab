(function(){
'use strict';
const {clamp,lerp,rr,txt,atLeast,PAL,FONT}=BioLab.h;

/* ---------------- the genetic code ---------------- */
const B4='UCAG',AA1='FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';
const THREE={F:'Phe',L:'Leu',S:'Ser',Y:'Tyr',C:'Cys',W:'Trp',P:'Pro',H:'His',Q:'Gln',R:'Arg',I:'Ile',M:'Met',T:'Thr',N:'Asn',K:'Lys',V:'Val',A:'Ala',D:'Asp',E:'Glu',G:'Gly','*':'Stop'};
const FULL={Phe:'phenylalanine',Leu:'leucine',Ser:'serine',Tyr:'tyrosine',Cys:'cysteine',Trp:'tryptophan',Pro:'proline',His:'histidine',Gln:'glutamine',Arg:'arginine',Ile:'isoleucine',Met:'methionine',Thr:'threonine',Asn:'asparagine',Lys:'lysine',Val:'valine',Ala:'alanine',Asp:'aspartic acid',Glu:'glutamic acid',Gly:'glycine',Stop:'stop'};
const aaOf=c=>THREE[AA1[16*B4.indexOf(c[0])+4*B4.indexOf(c[1])+B4.indexOf(c[2])]];
const KIND={Ala:'h',Val:'h',Leu:'h',Ile:'h',Met:'h',Phe:'h',Trp:'h',Pro:'h',Gly:'h',Ser:'p',Thr:'p',Tyr:'p',Asn:'p',Gln:'p',Cys:'p',Lys:'+',Arg:'+',His:'+',Asp:'-',Glu:'-'};
const KCOL={h:'#c98a12',p:'#2e8b57','+':'#2f6fd0','-':'#c8323a'};
const BCOL={A:'#2f9a4c',T:'#d0453a',U:'#8a52d6',G:'#d89a12',C:'#2f6fd0'};
const COMP={A:'U',T:'A',G:'C',C:'G'},ANTI={A:'U',U:'A',G:'C',C:'G'};
const GENES={demo:{name:'Demo gene',dna:'ATGCCGAAGTTTGGCTGGCATTAA',intronAt:9},hbb:{name:'β-globin (HBB)',dna:'ATGGTGCACCTGACTCCTGAGGAGAAGTCT',intronAt:15,partial:true}};
const INTRON='GTAAGTTTAG';
const RATE={tx:9,proc:1/3,exp:1/1.4,tl:1.2};

/* ---------------- gene state, mutations and translation ---------------- */
function resetGene(sim){const g=GENES[sim.p.gene||'demo'];sim.gx={seq:g.dna.split('').map(b=>({b})),delEnd:false,ver:(sim.gx?sim.gx.ver:0)+1,nmut:0};restart(sim);}
function restart(sim){sim.st={phase:'tx',tpos:0,proc:0,exp:0,ci:0,lastCi:-1};sim.infoDirty=true;}
const gene=sim=>{if(!sim.gx)resetGene(sim);return sim.gx;};
function translate(dna){const r={start:dna.slice(0,3)==='ATG',aas:[],stopAt:-1,codons:[]};if(!r.start)return r;
  for(let i=0;i+3<=dna.length;i+=3){const c=dna.slice(i,i+3).replace(/T/g,'U'),a=aaOf(c);r.codons.push(c);if(a==='Stop'){r.stopAt=i/3;break;}r.aas.push(a);}return r;}
function derived(sim){const gx=gene(sim),key=gx.ver+'|'+sim.p.gene+'|'+(sim.p.introns?1:0)+'|'+(atLeast('ap')?1:0);if(gx.dkey===key)return gx.d;
  const g=GENES[sim.p.gene],dna=gx.seq.map(x=>x.b).join(''),cur=translate(dna),orig=translate(g.dna);
  const intr=!!sim.p.introns&&atLeast('ap'),disp=[];gx.seq.forEach((x,i)=>{if(intr&&i===g.intronAt)INTRON.split('').forEach(b=>disp.push({b,intron:true}));disp.push(Object.assign({ci:i},x));});
  if(intr&&gx.seq.length<=g.intronAt)INTRON.split('').forEach(b=>disp.push({b,intron:true}));
  let type='No mutation',firstChange=null;const n=Math.max(cur.aas.length,orig.aas.length);
  for(let i=0;i<n;i++)if(cur.aas[i]!==orig.aas[i]){if(!firstChange)firstChange=[i,orig.aas[i]||'—',cur.aas[i]||'—'];}
  const changed=editDist(orig.aas,cur.aas);
  if(gx.nmut){const dl=dna.length-g.dna.length;
    if(!cur.start)type='Start codon lost';
    else if(dl%3!==0)type='Frameshift';
    else if(dl!==0)type=dl<0?'In-frame deletion':'In-frame insertion';
    else if(!changed&&cur.stopAt===orig.stopAt)type='Silent';
    else if(cur.stopAt>=0&&(orig.stopAt<0||cur.stopAt<orig.stopAt))type='Nonsense';
    else type='Missense';}
  const tl=cur.start?(cur.stopAt>=0?cur.stopAt:Math.max(0,cur.aas.length-1)):0;
  gx.d={dna,cur,orig,disp,type,changed,firstChange,intr,cycles:tl,mrna:dna.replace(/T/g,'U')};gx.dkey=key;return gx.d;}
function mutate(sim,kind){const gx=gene(sim),s=gx.seq;let i=clamp(Math.round(sim.p.pos)-1,0,s.length-1);
  if(kind==='sub'){if(s[i].b!==sim.p.base){s[i]={b:sim.p.base,mut:true};gx.nmut++;}}
  else if(kind==='ins'){if(s.length<36){i=clamp(Math.round(sim.p.pos)-1,0,s.length);s.splice(i,0,{b:sim.p.base,mut:true});gx.nmut++;}}
  else{const n=kind==='delc'?3:1;if(s.length>n+3){s.splice(i,n);if(i<s.length)s[i]=Object.assign({},s[i],{delBefore:true});else gx.delEnd=true;gx.nmut++;}}
  gx.ver++;restart(sim);}
function editDist(a,b){const m=a.length,n=b.length,D=[];for(let i=0;i<=m;i++){D.push([i]);for(let j=1;j<=n;j++)D[i][j]=i?Math.min(D[i-1][j]+1,D[i][j-1]+1,D[i-1][j-1]+(a[i-1]===b[j-1]?0:1)):j;}return D[m][n];}
const protText=(r,partial)=>!r.start?'None (no start codon)':r.aas.join('–')+(r.stopAt>=0?' (stop)':partial?' … (continues)':' (no stop codon)');

/* ---------------- drawing helpers ---------------- */
function tile(ctx,x,y,w,b,o){o=o||{};const h=20;ctx.globalAlpha=o.a===undefined?1:o.a;ctx.fillStyle=o.intron?'#8a8f98':BCOL[b];rr(ctx,x+1,y,w-2,h,3);ctx.fill();
  if(w>=11)txt(ctx,o.intron?b.toLowerCase():b,x+w/2,y+h/2+1,{s:Math.min(13,w*.58),w:700,c:'#fff',a:'center',b:'middle'});
  if(o.mut){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2.5;rr(ctx,x,y-2,w,h+4,4);ctx.stroke();}ctx.globalAlpha=1;}
function aaBall(ctx,x,y,a,o){o=o||{};ctx.globalAlpha=o.alpha===undefined?1:o.alpha;ctx.fillStyle=KCOL[KIND[a]]||'#777';ctx.beginPath();ctx.arc(x,y,12,0,6.29);ctx.fill();
  if(o.ring){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;ctx.stroke();}txt(ctx,a,x,y+1,{s:9.5,w:700,c:'#fff',a:'center',b:'middle'});ctx.globalAlpha=1;}
const ease=f=>f<0?0:f>1?1:f*f*(3-2*f);

const EXP={
  id:'expression',hash:'expression',apUnit:6,order:1,tab:'DNA to protein',kind:'Process walkthrough',
  card:'Watch RNA polymerase copy a gene and a ribosome build the protein. Then mutate one base and run it again.',
  title:'From DNA to protein: transcription and translation',
  lede:{bio:'Watch a gene being copied into mRNA in the nucleus, then read three bases at a time by a ribosome that strings amino acids into a protein.',
        honors:'Make your own mutations, one base at a time, and see which ones change the protein: silent, missense, nonsense or frameshift. Includes the sickle-cell mutation in hemoglobin.',
        ap:'Add an intron and watch RNA processing (splicing, 5′ cap, poly-A tail) before the mRNA leaves the nucleus.'},
  scale:'Zoomed in on one short gene: each base pair is 0.34 nanometers apart, so this whole stretch of DNA is about 10 nanometers long.',
  timeless:true,animated:true,graph:false,chChange:0.3,chReveal:12.5,
  controls:[
    {id:'gene',label:'Gene',type:'seg',def:'demo',lvl:'honors',options:[{v:'demo',l:'Demo gene'},{v:'hbb',l:'β-globin (hemoglobin)'}],onChange:resetGene},
    {id:'pos',label:'Mutation position',type:'range',min:1,max:33,step:1,def:6,unit:'',lvl:'honors',help:'Base number on the coding strand (marked in red).'},
    {id:'base',label:'New base',type:'seg',def:'A',lvl:'honors',options:['A','T','G','C'].map(v=>({v,l:v}))},
    {id:'introns',label:'Add an intron',type:'toggle',def:false,lvl:'ap',help:'Spliced out before the mRNA leaves the nucleus.',onChange(sim){gene(sim).ver++;restart(sim);}}
  ],
  actions:[{id:'sub',label:'Substitute',lvl:'honors',primary:true,run(sim){mutate(sim,'sub');}},{id:'ins',label:'Insert',lvl:'honors',run(sim){mutate(sim,'ins');}},
    {id:'del',label:'Delete',lvl:'honors',run(sim){mutate(sim,'del');}},{id:'delc',label:'Delete codon',lvl:'ap',run(sim){mutate(sim,'delc');}},
    {id:'undo',label:'Undo mutations',lvl:'honors',run:resetGene},{id:'replay',label:'Replay',run:restart},
    {id:'skip',label:'Skip to protein',run(sim){const d=derived(sim);Object.assign(sim.st,{phase:'done',tpos:d.disp.length,proc:1,exp:1,ci:d.cycles});sim.infoDirty=true;}}],
  init(sim){gene(sim);return {phase:'tx',tpos:0,proc:0,exp:0,ci:0,lastCi:-1};},
  step(sim,dt){const s=sim.st,d=derived(sim),ap=atLeast('ap');
    if(s.phase==='tx'){s.tpos+=RATE.tx*dt;if(s.tpos>=d.disp.length){s.tpos=d.disp.length;s.phase=ap?'proc':'exp';sim.infoDirty=true;}}
    else if(s.phase==='proc'){s.proc+=RATE.proc*dt;if(s.proc>=1){s.proc=1;s.phase='exp';}}
    else if(s.phase==='exp'){s.exp+=RATE.exp*dt;if(s.exp>=1){s.exp=1;s.phase=d.cur.start&&d.cycles>0?'tl':'done';sim.infoDirty=true;}}
    else if(s.phase==='tl'){s.ci+=RATE.tl*dt;if(Math.floor(s.ci)!==s.lastCi){s.lastCi=Math.floor(s.ci);sim.infoDirty=true;}if(s.ci>=d.cycles){s.ci=d.cycles;s.phase='done';sim.infoDirty=true;}}},
  metrics:[
    {id:'mrna',label:'mRNA codons',text:true,lvl:'bio',get(sim){const d=derived(sim);return d.mrna.match(/.{1,3}/g).join(' ');}},
    {id:'protein',label:'Protein',text:true,lvl:'bio',get(sim){return protText(derived(sim).cur,GENES[sim.p.gene].partial);}},
    {id:'len',label:'Protein length',unit:'amino acids',lvl:'bio',min:0,max:null,d:0,get:s=>derived(s).cur.aas.length},
    {id:'mtype',label:'Mutation type',text:true,lvl:'honors',get:s=>derived(s).type},
    {id:'changed',label:'Amino acids changed or lost',unit:'',lvl:'honors',min:0,max:null,d:0,get:s=>derived(s).changed},
    {id:'proc',label:'RNA processing',text:true,lvl:'ap',get(sim){const d=derived(sim);return 'Pre-mRNA '+d.disp.length+' nt → mature '+d.dna.length+' nt'+(d.intr?' (intron removed)':'')+', plus 5′ cap and poly-A tail';}}
  ],
  narrate(sim){const s=sim.st,d=derived(sim),hon=atLeast('honors'),nb=Math.min(d.disp.length,Math.floor(s.tpos));
    if(s.phase==='tx')return '<b>Transcription.</b> RNA polymerase unzips the DNA and reads the '+(hon?'template strand':'DNA')+', building a matching mRNA one base at a time (A→U, T→A, G→C, C→G). <b>'+nb+' of '+d.disp.length+'</b> bases copied.';
    if(s.phase==='proc')return '<b>RNA processing.</b> '+(d.intr?'The intron (gray) is cut out and the exons are spliced together. ':'')+'A 5′ cap is added to the front and a poly-A tail to the end. Both protect the mRNA and help the ribosome find it.';
    if(s.phase==='exp')return '<b>Export.</b> The finished mRNA leaves the nucleus through a nuclear pore and meets a ribosome in the cytoplasm.';
    if(s.phase==='tl'){const p=Math.floor(s.ci),c=d.cur.codons[p+1],a=c?aaOf(c):'';
      if(a==='Stop')return '<b>Stop codon '+c+'.</b> No tRNA matches it. A release factor binds instead, and the finished protein is let go.';
      return '<b>Translation.</b> The ribosome reads codon '+(p+2)+': <b>'+c+'</b>. A tRNA with the matching anticodon <b>'+c.split('').map(x=>ANTI[x]).join('')+'</b> brings <b>'+a+'</b> ('+FULL[a]+'), and it is joined to the growing chain.';}
    if(!d.cur.start)return '<b>No start codon.</b> The ribosome needs AUG to start, so this protein is never made.';
    let t='<b>Done:</b> a protein of '+d.cur.aas.length+' amino acids'+(GENES[sim.p.gene].partial?' (the full β-globin protein continues for 137 more)':'')+'.';
    if(hon&&gene(sim).nmut){t+=' Mutation type: <b>'+d.type.toLowerCase()+'</b>';if(d.firstChange&&(d.type==='Missense'||d.type==='Nonsense'))t+=' ('+d.firstChange[1]+' → '+d.firstChange[2]+')';t+=d.changed?', '+d.changed+' amino acid'+(d.changed>1?'s':'')+' changed or lost.':', no amino acids changed.';if(d.cur.stopAt<0&&!GENES[sim.p.gene].partial)t+=' The new reading frame never reaches a stop codon in this stretch.';}
    return t;},
  infoPanel(sim){const s=sim.st,d=derived(sim);let cur=null,line='';
    if(s.phase==='tl'){const p=Math.floor(s.ci);cur=d.cur.codons[p+1];if(cur){const a=aaOf(cur);line=`<p>Reading codon ${p+2}: <b>${cur}</b> → <b>${a}</b> (${FULL[a]})</p>`;}}
    else if(s.phase==='done'&&d.cur.start)line=`<p>Protein: <b>${protText(d.cur,GENES[sim.p.gene].partial)}</b></p>`;
    let h=`<h3>The genetic code</h3>${line}<p class="help">Find a codon by its first base (left), second base (top) and third base (right).</p><div class="tbl-wrap"><table style="font-size:13px"><thead><tr><th style="text-align:center">1st</th>${[...B4].map(b=>`<th style="text-align:center">2nd: ${b}</th>`).join('')}<th style="text-align:center">3rd</th></tr></thead><tbody>`;
    for(const f of B4)for(const t of B4){h+='<tr>'+(t==='U'?`<td rowspan="4" style="font-weight:700;text-align:center;vertical-align:middle">${f}</td>`:'');
      for(const sc of B4){const c=f+sc+t,a=aaOf(c),on=c===cur;h+=`<td style="text-align:left;${on?'background:var(--rj);color:#fff;font-weight:700;':a==='Stop'?'color:var(--bad);font-weight:600;':''}">${c} ${a}</td>`;}
      h+=`<td style="text-align:center;color:var(--muted)">${t}</td></tr>`;}
    return h+'</tbody></table></div>';},
  thumbSetup(sim){Object.assign(sim.st,{phase:'tl',tpos:24,exp:1,proc:1,ci:2.25});},thumbFrames:1,
  draw(sim,ctx,vdt,k,t){const s=sim.st,d=derived(sim),hon=atLeast('honors'),ap=atLeast('ap'),gx=gene(sim),L=d.disp.length;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // nucleus
    ctx.fillStyle=PAL['cv-bg2'];rr(ctx,8,14,784,196,16);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(375,210);ctx.lineTo(24,210);ctx.arcTo(8,210,8,194,16);ctx.lineTo(8,30);ctx.arcTo(8,14,24,14,16);ctx.lineTo(776,14);ctx.arcTo(792,14,792,30,16);ctx.lineTo(792,194);ctx.arcTo(792,210,776,210,16);ctx.lineTo(425,210);ctx.stroke();
    txt(ctx,'NUCLEUS',18,32,{s:12*k,w:700,c:PAL['cv-soft']});txt(ctx,'CYTOPLASM',18,234,{s:12*k,w:700,c:PAL['cv-soft']});txt(ctx,'nuclear pore',432,202,{s:11*k,c:PAL['cv-soft']});
    const bw=Math.min(24,620/L),x0=140+(640-L*bw)/2,yc=60,yt=96,ym=146,X=i=>x0+i*bw;
    // DNA strands, unzipped around the polymerase
    const pol=s.phase==='tx'?s.tpos:-99;
    d.disp.forEach((b,i)=>{const op=s.phase==='tx'?clamp(1-(Math.abs(i+.5-pol)-1.2)/2.5,0,1):0;
      tile(ctx,X(i),yc-10*op,bw,b.b,{intron:b.intron,mut:b.mut&&hon});tile(ctx,X(i),yt+10*op,bw,{A:'T',T:'A',G:'C',C:'G'}[b.b],{intron:b.intron});
      if(op<.2){ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X(i)+bw/2,yc+20);ctx.lineTo(X(i)+bw/2,yt);ctx.stroke();}
      if(b.delBefore&&hon){ctx.fillStyle=PAL['rj'];ctx.beginPath();ctx.moveTo(X(i)-4,yc-12);ctx.lineTo(X(i)+4,yc-12);ctx.lineTo(X(i),yc-4);ctx.fill();}});
    if(gx.delEnd&&hon){ctx.fillStyle=PAL['rj'];ctx.beginPath();ctx.moveTo(X(L)-4,yc-12);ctx.lineTo(X(L)+4,yc-12);ctx.lineTo(X(L),yc-4);ctx.fill();}
    if(hon){txt(ctx,'Coding 5′',x0-8,yc+14,{s:12*k,c:PAL['cv-soft'],a:'right'});txt(ctx,'Template 3′',x0-8,yt+14,{s:12*k,c:PAL['cv-soft'],a:'right'});txt(ctx,'3′',X(L)+6,yc+14,{s:12*k,c:PAL['cv-soft']});txt(ctx,'5′',X(L)+6,yt+14,{s:12*k,c:PAL['cv-soft']});
      // mutation position marker
      const mi=d.disp.findIndex(b=>b.ci===Math.round(sim.p.pos)-1);if(mi>=0){const mx=X(mi)+bw/2;ctx.fillStyle=PAL['rj'];ctx.beginPath();ctx.moveTo(mx-6,yc-26);ctx.lineTo(mx+6,yc-26);ctx.lineTo(mx,yc-17);ctx.fill();txt(ctx,'position '+Math.round(sim.p.pos),mx,yc-30,{s:11*k,c:PAL['rj'],a:'center'});}}
    else txt(ctx,'DNA',x0-10,(yc+yt+20)/2+4,{s:13*k,w:700,c:PAL['cv-soft'],a:'right'});
    // mRNA: in the nucleus while transcribing/processing, then exported to the cytoplasm
    const mat=d.dna.split(''),bw2=Math.min(24,600/mat.length),x2=(800-mat.length*bw2)/2,ymC=316;
    if(s.phase==='tx'||s.phase==='proc'){const n=Math.floor(s.tpos);
      if(s.phase==='tx'){for(let i=0;i<n&&i<L;i++){const b=d.disp[i];tile(ctx,X(i),ym+Math.min(6,(s.tpos-i)*1.5),bw,COMP[{A:'T',T:'A',G:'C',C:'G'}[b.b]],{intron:b.intron});}
        const px=X(Math.min(s.tpos,L));ctx.fillStyle='rgba(123,63,228,.16)';ctx.strokeStyle=PAL['s5'];ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(px,yt+12,Math.max(46,3.2*bw),56,0,0,6.29);ctx.fill();ctx.stroke();
        txt(ctx,'RNA polymerase',clamp(px,70,730),yc-34,{s:12.5*k,w:700,c:PAL['s5'],a:'center'});}
      else{const f1=ease(s.proc/.35),f2=ease((s.proc-.25)/.3),fade=1-ease((s.proc-.4)/.2),i0=d.disp.findIndex(q=>q.intron),ni=d.disp.filter(q=>q.intron).length,gc=i0>=0?X(i0)+ni*bw/2:0;let ex=0;
        const lft0=x0+(L*bw-mat.length*bw)/2;
        d.disp.forEach((b,i)=>{const xs=X(i),rb=COMP[{A:'T',T:'A',G:'C',C:'G'}[b.b]];
          if(b.intron){const j=i-i0,ang=(j/(ni-1)-.5)*Math.PI*1.1,tx=gc+Math.sin(ang)*34-bw/2,ty=ym+6-38+Math.cos(ang)*-22+22;tile(ctx,lerp(xs,tx,f1),lerp(ym+6,ty,f1),bw,rb,{intron:true,a:fade});return;}
          tile(ctx,lerp(xs,lft0+ex*bw,f2),ym+6,bw,rb);ex++;});
        if(i0>=0&&s.proc>.42&&s.proc<.7){ctx.globalAlpha=1-ease((s.proc-.55)/.15);txt(ctx,'intron cut out',gc,ym-44,{s:11.5*k,w:700,c:PAL['cv-soft'],a:'center'});ctx.globalAlpha=1;}
        const lft=x0+(L*bw-mat.length*bw)/2;if(s.proc>.5){ctx.globalAlpha=ease((s.proc-.5)/.15);ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(lft-12,ym+16,9,0,6.29);ctx.fill();txt(ctx,'5′ cap',lft-12,ym+44,{s:11*k,c:PAL['cv-soft'],a:'center'});ctx.globalAlpha=1;}
        if(s.proc>.7){const na=Math.round(ease((s.proc-.7)/.3)*6);for(let i=0;i<na;i++)tile(ctx,lft+mat.length*bw+i*bw*.8,ym+6,bw*.8,'A',{a:.85});txt(ctx,'poly-A tail',lft+mat.length*bw+3*bw*.8,ym+44,{s:11*k,c:PAL['cv-soft'],a:'center'});}}}
    else{const e=ease(s.exp),lft=x0+(L*bw-mat.length*bw)/2;
      const pw=Math.min(bw,bw2)*.55,e1=ease(s.exp/.5),e2=ease((s.exp-.5)/.5);
      mat.forEach((b,i)=>{const sx=lft+i*bw,px=400-mat.length*pw/2+i*pw,tx=x2+i*bw2;let x,y,w;
        if(s.exp<.5){x=lerp(sx,px,e1);y=lerp(ym+6,200,e1);w=lerp(bw,pw,e1);}else{x=lerp(px,tx,e2);y=lerp(200,ymC,e2);w=lerp(pw,bw2,e2);}
        tile(ctx,x,y,w,COMP[{A:'T',T:'A',G:'C',C:'G'}[b]],{mut:gx.seq[i]&&gx.seq[i].mut&&hon&&s.exp>=1});});
      if(ap&&s.exp>=1){ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(x2-11,ymC+10,8,0,6.29);ctx.fill();for(let i=0;i<5;i++)tile(ctx,x2+mat.length*bw2+i*bw2*.75,ymC,bw2*.75,'A',{a:.8});}
      if(s.exp>=1&&hon){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;for(let c=0;c*3<mat.length;c++){const a=x2+c*3*bw2+2,b=x2+Math.min(mat.length,(c+1)*3)*bw2-2;ctx.beginPath();ctx.moveTo(a,ymC+25);ctx.lineTo(a,ymC+29);ctx.lineTo(b,ymC+29);ctx.lineTo(b,ymC+25);ctx.stroke();if(c<12)txt(ctx,String(c+1),(a+b)/2,ymC+41,{s:10.5*k,c:PAL['cv-soft'],a:'center'});}}
      if(!hon&&s.exp>=1)txt(ctx,'mRNA',x2-12,ymC+14,{s:13*k,w:700,c:PAL['cv-soft'],a:'right'});
      if(hon&&s.exp>=1){txt(ctx,'5′',x2-(ap?24:8),ymC+14,{s:12*k,c:PAL['cv-soft'],a:'right'});}
      // translation
      const cw=3*bw2,cc=i=>x2+i*cw+cw/2;
      if(s.phase==='tl'){const p=Math.floor(s.ci),f=s.ci-p,aas=d.cur.aas,next=d.cur.codons[p+1],isStop=next&&aaOf(next)==='Stop';
        let rx=x2+(p+1)*cw;if(f>.65)rx+=cw*ease((f-.65)/.35);
        ctx.fillStyle='rgba(120,98,190,.30)';ctx.strokeStyle='rgba(120,98,190,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(rx,ymC-34,1.45*cw,40,0,0,6.29);ctx.fill();ctx.stroke();
        ctx.fillStyle='rgba(120,98,190,.55)';ctx.beginPath();ctx.ellipse(rx,ymC+30,1.2*cw,15,0,0,6.29);ctx.fill();
        txt(ctx,'Ribosome',rx,ymC+64,{s:12*k,w:700,c:PAL['cv-ink'],a:'center'});
        const tRNA=(x,codon,alpha,dy)=>{ctx.globalAlpha=alpha;ctx.fillStyle='#2a8276';rr(ctx,x-cw*.36,ymC-48+dy,cw*.72,44,7);ctx.fill();
          txt(ctx,codon.split('').map(c=>ANTI[c]).join(''),x,ymC-14+dy,{s:Math.min(12,cw*.28),w:700,c:'#fff',a:'center',b:'middle'});ctx.globalAlpha=1;};
        const chain=(ax,ay,n,alpha)=>{const first=Math.max(0,n-12);for(let j=n-1;j>=first;j--){const q=n-1-j;aaBall(ctx,ax-q*23,ay-14-(q?6:0)-(q%2)*13,aas[j],{alpha,ring:hon&&d.orig.aas[j]!==aas[j]});}};
        // P-site tRNA (exits after translocation)
        const pc=d.cur.codons[p];if(pc){const ex=f>.65?ease((f-.65)/.35):0;tRNA(cc(p)-ex*30,pc,1-ex,-ex*40);}
        // incoming tRNA or release factor at the A site
        if(next){const fin=ease(f/.35),ix=lerp(cc(p+1)+150,cc(p+1),fin),dy=lerp(-90,0,fin);
          if(isStop){ctx.fillStyle=PAL['s4'];rr(ctx,ix-cw*.4,ymC-50+dy,cw*.8,46,8);ctx.fill();txt(ctx,'release',ix,ymC-32+dy,{s:10*k,w:700,c:'#fff',a:'center'});txt(ctx,'factor',ix,ymC-19+dy,{s:10*k,w:700,c:'#fff',a:'center'});}
          else{tRNA(ix,next,clamp(fin*1.5,0,1),dy);if(f<.45)aaBall(ctx,ix,ymC-62+dy,aas[p+1]);}}
        // growing chain: on the P-site tRNA, then transferred to the A-site tRNA
        if(isStop&&f>.45){const fl=ease((f-.45)/.55);chain(cc(p)+fl*120,ymC-48-fl*60,p+1,1-fl*.3);}
        else if(f<.45||!next)chain(cc(p),ymC-48-(f>.65?ease((f-.65)/.35)*40:0),p+1,1);
        else chain(cc(p+1),ymC-48,p+2,1);}
      if(s.phase==='done'){if(d.cur.start){const n=d.cur.aas.length,sp=Math.min(36,700/Math.max(1,n)),sx=400-(n-1)*sp/2;
          txt(ctx,'Protein: '+n+' amino acids'+(GENES[sim.p.gene].partial?' (first part)':''),400,ymC-56,{s:14*k,w:700,a:'center'});
          ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx,ymC-26);ctx.lineTo(sx+(n-1)*sp,ymC-26);ctx.stroke();
          d.cur.aas.forEach((a,i)=>aaBall(ctx,sx+i*sp,ymC-26,a,{ring:hon&&d.orig.aas[i]!==a}));}
        else txt(ctx,'No AUG start codon: the ribosome never starts, so no protein is made.',400,ymC-40,{s:14*k,w:700,c:PAL['rj'],a:'center'});}}
    // legend for amino acid colors
    if(s.phase==='tl'||s.phase==='done'){const LG=[['h','nonpolar'],['p','polar'],['+','positive'],['-','negative']];ctx.font='400 '+11.5*k+'px '+FONT;let lx=786-LG.reduce((a,[,l])=>a+ctx.measureText(l).width+26,0)+9;const ly=440;LG.forEach(([kk,l])=>{ctx.fillStyle=KCOL[kk];ctx.beginPath();ctx.arc(lx,ly-4,5.5,0,6.29);ctx.fill();txt(ctx,l,lx+9,ly,{s:11.5*k,c:PAL['cv-soft']});ctx.font='400 '+11.5*k+'px '+FONT;lx+=ctx.measureText(l).width+26;});}},
  tour:[
    {title:'A gene',text:{bio:'This is a short gene: a stretch of DNA. Its order of bases (A, T, G, C) is the recipe for one protein.',honors:'This is a short gene. The coding strand (top) has the same sequence as the mRNA will have. The template strand (bottom) is the one that gets read.'},focus:[120,28,672,100],pause:true},
    {title:'RNA polymerase unzips the DNA',text:'RNA polymerase (purple) opens up a small bubble in the double helix and moves along it, reading one base at a time.',focus:sim=>{const d=derived(sim),bw=Math.min(24,620/d.disp.length),x0=140+(640-d.disp.length*bw)/2,px=x0+sim.st.tpos*bw;return [px-80,22,160,160];},speed:.25},
    {title:'Building the mRNA',text:'Each new RNA base pairs with the template: A with U, T with A, G with C and C with G. RNA uses U (uracil) instead of T.',focus:[120,134,672,44],speed:.25},
    {lvl:'ap',title:'RNA processing',text:'Before leaving the nucleus, the pre-mRNA is edited. The intron (gray) loops out and is cut away, the exons are joined, and a 5′ cap and poly-A tail are added.',focus:[60,100,700,108],speed:.3,setup(sim){BioLab.setValues(sim,{introns:true});const d=derived(sim);Object.assign(sim.st,{phase:'proc',tpos:d.disp.length,proc:0});}},
    {title:'Out of the nucleus',text:'The finished mRNA slips out through a nuclear pore into the cytoplasm, where the ribosomes are.',focus:[150,130,500,215],speed:.35,setup(sim){const d=derived(sim);Object.assign(sim.st,{phase:'exp',tpos:d.disp.length,proc:1,exp:0});}},
    {title:'The ribosome reads codons',text:'A ribosome clamps onto the mRNA at the start codon, AUG, and reads three bases (one codon) at a time.',focus:sim=>{const d=derived(sim),bw2=Math.min(24,600/d.dna.length),x2=(800-d.dna.length*bw2)/2,rx=x2+(Math.floor(sim.st.ci)+1)*3*bw2;return [rx-150,220,300,150];},speed:.15,setup(sim){Object.assign(sim.st,{phase:'tl',exp:1,proc:1,ci:0});}},
    {title:'tRNA brings each amino acid',text:'Each tRNA has an anticodon that matches one codon, and it carries one amino acid. The ribosome links the new amino acid to the chain, then slides one codon over.',focus:sim=>{const d=derived(sim),bw2=Math.min(24,600/d.dna.length),x2=(800-d.dna.length*bw2)/2,rx=x2+(Math.floor(sim.st.ci)+1)*3*bw2;return [rx-200,130,400,240];},speed:.12},
    {title:'Stop',text:'When a stop codon (UAA, UAG or UGA) reaches the ribosome, no tRNA matches. A release factor frees the finished protein, which then folds into its working shape.',focus:[60,130,680,240],speed:.4,setup(sim){const d=derived(sim);Object.assign(sim.st,{phase:'tl',exp:1,proc:1,ci:Math.max(0,d.cycles-1.02)});}},
    {lvl:'honors',title:'One base, one disease',text:'In sickle-cell disease a single A changes to T in the β-globin gene. GAG becomes GTG, so one glutamic acid (red, charged) becomes valine (orange, nonpolar). That one change makes hemoglobin molecules stick together.',focus:[40,230,720,120],pause:true,setup(sim){BioLab.setValues(sim,{introns:false,gene:'hbb',pos:20,base:'T'});mutate(sim,'sub');const d=derived(sim);Object.assign(sim.st,{phase:'done',tpos:d.disp.length,exp:1,proc:1,ci:d.cycles});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{gene:'demo',introns:false,pos:6,base:'A'});},
  lab:{bio:'<p><b>Question:</b> How does the order of DNA bases decide the protein?</p><ol><li>Watch the gene run once at 0.5× speed.</li><li>Use the genetic code table to translate the mRNA codons yourself, then check your answer against the Protein readout.</li></ol><p>Explain in your own words what a codon is.</p>',
       honors:'<p><b>Question:</b> Do all mutations change the protein?</p><ol><li>Make one substitution at a third base of a codon (positions 3, 6, 9…), then record a trial and press Undo mutations.</li><li>Repeat with a substitution at a first base, one insertion and one deletion.</li><li>Try to make a nonsense mutation: turn a codon into UAA, UAG or UGA.</li></ol><p>Rank your mutations from least to most harmful and explain your ranking.</p>',
       ap:'<p><b>Question:</b> Why are some point mutations so much more harmful than others?</p><ol><li>Record a silent, a missense, a nonsense, a frameshift and an in-frame deletion (Delete codon).</li><li>Turn on the intron and compare pre-mRNA and mature mRNA lengths.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why third-position (wobble) substitutions are often silent, and why a frameshift near the start is worse than one near the end.</p>'},
  terms:[{t:'Gene',d:'A stretch of DNA that codes for one protein (or RNA).'},{t:'mRNA',d:'Messenger RNA: a copy of a gene that carries the recipe to a ribosome.'},{t:'Codon',d:'Three mRNA bases that code for one amino acid, or for stop.'},{t:'Ribosome',d:'The machine that reads mRNA and links amino acids into a protein.'},{t:'tRNA',d:'Transfer RNA: brings one specific amino acid to the ribosome.'},
    {lvl:'honors',t:'Transcription / translation',d:'DNA → mRNA in the nucleus; mRNA → protein at the ribosome.'},{lvl:'honors',t:'Anticodon',d:'Three tRNA bases that pair with a codon.'},{lvl:'honors',t:'Point mutation',d:'A change in one base: silent (same amino acid), missense (different amino acid) or nonsense (early stop).'},{lvl:'honors',t:'Frameshift',d:'An insertion or deletion that shifts how every later codon is read.'},
    {lvl:'ap',t:'Intron / exon',d:'Introns are cut out of pre-mRNA; exons are joined and kept.'},{lvl:'ap',t:'5′ cap and poly-A tail',d:'Added to mRNA ends to protect it and help it leave the nucleus and bind a ribosome.'},{lvl:'ap',t:'Reading frame',d:'How bases are grouped into codons, set by the start codon.'}],
  about:'<p>The genetic code table is the standard one used by nearly all living things. Translation starts at the first base (AUG) and stops at the first in-frame stop codon. The β-globin preset shows only the first 10 codons of the real HBB gene. Hemoglobin numbering skips Met, so codon 7 here is the famous “Glu6” that becomes Val in sickle-cell disease.</p><p>Simplified on purpose: the mRNA has no untranslated regions, the intron is shortened (real HBB intron 1 is 130 bases and sits between codons 30 and 31), and there is one ribosome instead of many. A lost start codon is shown as no protein; real ribosomes sometimes start at a later AUG. Real speeds are much faster: RNA polymerase copies about 40 bases per second, and a ribosome adds about 5 amino acids per second.</p>',
  challenges:[
    {lvl:'bio',q:'A mutation changes base 6 from G to A, so the codon CCG becomes CCA. What happens to the protein?',choices:['Nothing changes: CCA also codes for proline','One amino acid changes','The protein stops early'],correct:0,
     baseline:{gene:'demo',pos:6,base:'A'},changeAction:'sub',changeText:'Base 6 changed from G to A',
     explain:{bio:'Most amino acids have more than one codon. CCG and CCA both code for proline (Pro), so the protein is exactly the same. This is a silent mutation.',honors:'CCG and CCA both code for proline, so this is a silent mutation. Changes in the third base of a codon are often silent because of this redundancy (wobble).'}},
    {lvl:'bio',q:'One extra base is inserted near the start of the gene. What happens to the protein?',choices:['Only one amino acid changes','Most amino acids after the insertion change','Nothing changes'],correct:1,
     baseline:{gene:'demo',pos:5,base:'G'},changeAction:'ins',changeText:'Extra G inserted at base 5',
     explain:'The ribosome reads in groups of three with no spaces. One extra base shifts every codon after it, so almost every amino acid after that point changes, and a stop codon often turns up early. This is a frameshift.'},
    {lvl:'honors',q:'In sickle-cell disease, one base in the β-globin gene changes from A to T (codon 7, GAG → GTG). How much of the protein changes?',choices:['One amino acid: glutamic acid becomes valine','Every amino acid after the mutation','The whole protein is lost'],correct:0,
     baseline:{gene:'hbb',pos:20,base:'T'},changeAction:'sub',changeText:'Base 20 changed from A to T',
     explain:'This is a missense mutation. Only one amino acid changes, but charged glutamic acid becomes nonpolar valine. The new oily patch makes hemoglobin molecules stick together into fibers, bending red blood cells into sickles.'},
    {lvl:'honors',q:'The codon TGG (tryptophan) becomes TGA after one substitution. What happens?',choices:['A different amino acid is added','The protein stops early','No change'],correct:1,
     baseline:{gene:'demo',pos:18,base:'A'},changeAction:'sub',changeText:'Base 18 changed from G to A',
     explain:'UGA is a stop codon. The ribosome releases the protein early, so it is missing its last amino acids. This is a nonsense mutation, and the shortened protein usually doesn’t work.'},
    {lvl:'ap',q:'Three bases in a row (one whole codon) are deleted. What happens to the protein?',choices:['One amino acid is missing and the rest is unchanged','A frameshift scrambles everything after it','The protein is unchanged'],correct:0,
     baseline:{gene:'demo',pos:7},changeAction:'delc',changeText:'Codon 3 (AAG) deleted',
     explain:'Removing a multiple of three keeps the reading frame. The protein just loses one lysine. Cystic fibrosis is usually caused by this kind of in-frame deletion (ΔF508), which removes one phenylalanine.'},
    {lvl:'ap',q:'A mutation changes the start codon from AUG to AUA. What happens to translation of this gene?',choices:['The protein starts with a different amino acid','Translation can’t start at the usual place, so this protein isn’t made','Only the last amino acid changes'],correct:1,
     baseline:{gene:'demo',pos:3,base:'A'},changeAction:'sub',changeText:'Base 3 changed from G to A',
     explain:'The ribosome looks for AUG to set the reading frame. Without it, translation doesn’t start here. (Real ribosomes sometimes start at a later AUG, making a shorter, usually broken protein.)'}
  ]
};
BioLab.register(EXP);
})();
