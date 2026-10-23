(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,RM,lvText}=BioLab.h;

/* CRISPR–Cas9 editing of the human HBB (β-globin) gene.
   Sequence: the real HBB coding sequence (444 nt, 147 codons with Met), carrying the sickle-cell
   A→T change at base 20 (codon 7 GAG→GTG, Glu6Val in standard numbering).
   PAM = NGG on either strand. Guide = the 20 nt next to the PAM. Cas9 cuts 3 bp from the PAM.
   NHEJ repair leaves a small insertion or deletion; HDR copies a donor template if one is present. */
const HBB='ATGGTGCATCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGCTGCTGGTGGTCTACCCTTGGACCCAGAGGTTCTTTGAGTCCTTTGGGGATCTGTCCACTCCTGATGCTGTTATGGGCAACCCTAAGGTGAAGGCTCATGGCAAGAAAGTGCTCGGTGCCTTTAGTGATGGCCTGGCTCACCTGGACAACCTCAAGGGCACCTTTGCCACACTGAGTGAGCTGCACTGTGACAAGCTGCACGTGGATCCTGAGAACTTCAGGCTCCTGGGCAACGTGCTGGTCTGTGTGCTGGCCCATCACTTTGGCAAAGAATTCACCCCACCAGTGCAGGCTGCCTATCAGAAAGTGGTGGCTGGTGTGGCTAATGCCCTGGCCCACAAGTATCACTAA';
const SICKLE=HBB.slice(0,19)+'T'+HBB.slice(20);
const WIN=60,SICK=19;
const COMP={A:'T',T:'A',G:'C',C:'G'};
const comp=s=>s.split('').map(c=>COMP[c]).join('');
const rc=s=>comp(s).split('').reverse().join('');
const CODE=(()=>{const C={},b='TCAG',aa='FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';let i=0;for(const x of b)for(const y of b)for(const z of b)C[x+y+z]=aa[i++];return C;})();
const AA3={A:'Ala',R:'Arg',N:'Asn',D:'Asp',C:'Cys',Q:'Gln',E:'Glu',G:'Gly',H:'His',I:'Ile',L:'Leu',K:'Lys',M:'Met',F:'Phe',P:'Pro',S:'Ser',T:'Thr',W:'Trp',Y:'Tyr',V:'Val'};
function translate(s){let p='';for(let j=0;j+3<=s.length;j+=3){const a=CODE[s.substr(j,3)];if(!a||a==='*')return {p,stop:true};p+=a;}return {p,stop:false};}
const BASECOL={A:'#2ca02c',T:'#d62f2f',G:'#3a3a3a',C:'#2d6bd2'};

/* Find every Cas9 site whose 20-nt guide fits inside the window. cut = index after which the DNA is cut. */
const SITES=(()=>{const W=SICKLE.slice(0,WIN),out=[];
  for(let j=20;j+2<WIN;j++)if(W[j+1]==='G'&&W[j+2]==='G')out.push({strand:'+',pam:[j,j+2],g0:j-20,g1:j-1,cut:j-4,guide:W.slice(j-20,j),pamSeq:W.slice(j,j+3)});
  for(let c=0;c+22<WIN;c++)if(W[c]==='C'&&W[c+1]==='C')out.push({strand:'−',pam:[c,c+2],g0:c+3,g1:c+22,cut:c+5,guide:rc(W.slice(c+3,c+23)),pamSeq:rc(W.slice(c,c+3))});
  out.sort((a,b)=>a.cut-b.cut);out.forEach((s,i)=>{s.id='s'+s.cut;s.name='Site '+String.fromCharCode(65+i);});return out;})();
const siteOf=sim=>SITES.find(s=>s.id===sim.p.site)||SITES[0];
const DEFSITE=(SITES.find(s=>Math.abs(s.cut-SICK)<=3)||SITES[0]).id;
const CUTS=SITES.map(s=>s.cut);
/* a stretch with no cut site anywhere near it (for the PAM challenge) */
const GAP=(()=>{let best=[0,0];const c=[-1].concat(CUTS).concat([WIN-1]);for(let i=1;i<c.length;i++)if(c[i]-c[i-1]>best[1]-best[0])best=[c[i-1]+1,c[i]];return best;})();

const INDEL={del1:{d:-1,l:'1-letter deletion'},ins1:{d:1,l:'1-letter insertion'},del2:{d:-2,l:'2-letter deletion'},del3:{d:-3,l:'3-letter deletion'},del4:{d:-4,l:'4-letter deletion'},del6:{d:-6,l:'6-letter deletion'}};
function editSeq(site,kind){const c=site.cut+1;const d=INDEL[kind].d;
  if(d>0)return {seq:SICKLE.slice(0,c)+SICKLE[c-1]+SICKLE.slice(c),at:c,len:1};
  return {seq:SICKLE.slice(0,c)+SICKLE.slice(c-d),at:c,len:d};}
function offTargets(site){const r=rng(site.cut*7+3),g=site.guide;const spots=[[1,[3]],[2,[5,9]],[2,[15,18]],[4,[2,6,11,17]],[6,[1,4,8,10,14,19]]];
  const genes=['OR4F5 region, chr 1','intergenic, chr 7','HBD gene, chr 11','TTN intron, chr 2','intergenic, chr 15'];
  return spots.map((s,i)=>{const pos=s[1];let seq=g.split('');pos.forEach(p=>{const b=seq[p];const alt='ACGT'.replace(b,'');seq[p]=alt[Math.floor(r()*3)];});
    const seed=pos.filter(p=>p>=10).length;const risk=s[0]<=1?'High':s[0]===2?(seed?'Low':'Medium'):'Very low';return {where:genes[i],mm:s[0],pos,seq:seq.join(''),seed,risk};});}

function outcomeOf(sim){const s=sim.st;if(!s.result)return {txt:'Not cut yet',len:147,aa6:'Val',short:'uncut'};return s.result;}
function doRepair(sim){const p=sim.p,s=sim.st,site=siteOf(sim);s.tries++;
  if(p.repair==='hdr'&&p.template){const seq=SICKLE.slice(0,SICK)+'A'+SICKLE.slice(SICK+1);const tr=translate(seq);
    s.seq=seq;s.mark={at:SICK,len:0,hdr:true};s.result={txt:'Corrected: Val → Glu',len:tr.p.length,aa6:AA3[tr.p[6]],short:'hdr',kind:'HDR'};return;}
  let kind=p.indel;if(!INDEL[kind]){const r=rng(s.tries*97+site.cut)();kind=r<0.35?'del1':r<0.65?'ins1':r<0.75?'del2':r<0.85?'del4':r<0.93?'del3':'del6';}
  const e=editSeq(site,kind),tr=translate(e.seq),inFrame=INDEL[kind].d%3===0;s.seq=e.seq;s.mark={at:e.at,len:INDEL[kind].d};
  const aa6=tr.p.length>6?AA3[tr.p[6]]:'—';
  s.result={txt:inFrame?'In frame: '+INDEL[kind].l:'Knockout: '+INDEL[kind].l+', frameshift',len:tr.p.length,aa6,short:inFrame?'inframe':'frameshift',kind:INDEL[kind].l,fell:p.repair==='hdr'};}

const PH=[['search',1.6],['bind',1.0],['cut',0.8],['repair',1.6]];
const CR={
  id:'crispr',hash:'crispr',apUnit:11,order:3,tab:'CRISPR gene editing',kind:'Go further',prereq:['expression','pcr'],
  card:'Find a PAM, design a guide RNA, and cut the sickle-cell gene. Then choose how the cell repairs it.',
  title:'CRISPR–Cas9: editing the sickle-cell gene',
  lede:{bio:'Cas9 is a protein that cuts DNA wherever its guide RNA matches. Aim it at the gene behind sickle-cell disease and watch the cell repair the cut.',
        honors:'Pick a cut site next to a PAM, then compare the two repair pathways: messy end-joining that knocks a gene out, or template-directed repair that fixes it.',
        ap:'Design guides against the real HBB sequence, predict the reading-frame consequences of each indel, and screen your guide for off-target sites.'},
  scale:'The first 60 base pairs of the human HBB gene on chromosome 11, a stretch about 20 nanometers long. Cas9 itself is about 10 nm across.',
  timeless:true,animated:true,graph:false,chChange:0.3,chReveal:7,
  controls:[
    {id:'site',label:'Cut site (PAM)',type:'select',def:DEFSITE,lvl:'bio',options:SITES.map(s=>({v:s.id,l:s.name+': PAM '+s.pamSeq+' on the '+(s.strand==='+'?'top':'bottom')+' strand, cuts after base '+(s.cut+1)})),
     onChange(sim){BioLab.reset(sim);}},
    {id:'repair',label:'Repair pathway',type:'seg',def:'nhej',lvl:'honors',options:[{v:'nhej',l:'End-joining (NHEJ)'},{v:'hdr',l:'Template (HDR)'}]},
    {id:'template',label:'Donor template',type:'toggle',def:true,lvl:'honors',help:'A DNA patch carrying the normal A at base 20'},
    {id:'indel',label:'End-joining outcome',type:'select',def:'random',lvl:'honors',options:[{v:'random',l:'Random (like a real cell)'},{v:'del1',l:'1-letter deletion'},{v:'ins1',l:'1-letter insertion'},{v:'del3',l:'3-letter deletion'}]}
  ],
  actions:[{id:'cut',label:'Send in Cas9',lvl:'bio',primary:true,run(sim){const s=sim.st;s.seq=SICKLE;s.result=null;s.mark=null;s.phase=0;s.pt=0;s.running=true;}}],
  init(){return {seq:SICKLE,result:null,mark:null,phase:-1,pt:0,running:false,tries:0};},
  step(sim,dt){const s=sim.st;if(!s.running)return;s.pt+=dt;
    while(s.running&&s.pt>=PH[s.phase][1]){s.pt-=PH[s.phase][1];s.phase++;if(PH[s.phase]&&PH[s.phase][0]==='repair')doRepair(sim);if(s.phase>=PH.length){s.running=false;s.phase=PH.length;}}},
  metrics:[
    {id:'guide',label:'Guide RNA (20 letters, 5′→3′)',unit:'',lvl:'bio',text:true,get:s=>siteOf(s).guide.replace(/T/g,'U')},
    {id:'cutat',label:'Cut site',unit:'',lvl:'bio',text:true,get:s=>'Between bases '+(siteOf(s).cut+1)+' and '+(siteOf(s).cut+2)},
    {id:'outcome',label:'Result',unit:'',lvl:'bio',text:true,get:s=>outcomeOf(s).txt},
    {id:'plen',label:'β-globin protein length',unit:'amino acids (normal 147)',lvl:'bio',min:0,max:160,d:0,get:s=>outcomeOf(s).len},
    {id:'aa6',label:'Amino acid 6',unit:'Glu normal, Val sickle',lvl:'honors',text:true,get:s=>outcomeOf(s).aa6},
    {id:'offhigh',label:'Off-target sites at risk',unit:'with ≤1 mismatch',lvl:'ap',min:0,max:5,d:0,get:s=>offTargets(siteOf(s)).filter(o=>o.mm<=1).length}
  ],
  infoPanel(sim){const site=siteOf(sim),ap=atLeast('ap');let h=`<h3>Your guide RNA</h3><p style="font-family:ui-monospace,Consolas,monospace;font-size:15px;word-break:break-all">5′-${site.guide.replace(/T/g,'U')}-3′ + PAM ${site.pamSeq}</p>
    <p>${site.name} sits on the ${site.strand==='+'?'top':'bottom'} strand. Cas9 will cut 3 letters before the PAM, between bases ${site.cut+1} and ${site.cut+2}${Math.abs(site.cut-SICK)<=3?', right next to the sickle-cell letter (base 20).':'.'}</p>`;
    if(ap){const ot=offTargets(site);h+=`<h3 style="margin-top:10px">Off-target search</h3><p>Other places in the genome that almost match this guide. Mismatches near the PAM (the “seed”, last 10 letters) block cutting best.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Location</th><th>Mismatches</th><th>In seed</th><th>Risk</th></tr></thead><tbody>${ot.map(o=>`<tr><td>${o.where}</td><td>${o.mm}</td><td>${o.seed}</td><td>${o.risk}</td></tr>`).join('')}</tbody></table></div>`;}
    else h+=`<p>The PAM (NGG) is the “parking spot” Cas9 checks first. No PAM, no cut.</p>`;
    return h;},
  challenges(sim){const ot=offTargets(siteOf(sim)),two=ot.filter(o=>o.mm===2);const seedSite=two.find(o=>o.seed>0),distal=two.find(o=>o.seed===0);
    return [
    {lvl:'bio',instant:true,q:`You want Cas9 to cut somewhere between bases ${GAP[0]+2} and ${GAP[1]}. There is no NGG close enough on either strand to put a cut there. Can Cas9 cut there?`,choices:['Yes, the guide RNA can point it anywhere','No, it needs a PAM in the right spot','Only if you add more Cas9'],correct:1,
     explain:'Cas9 only checks DNA next to a PAM (NGG). If no PAM puts the cut where you need it, this Cas9 can’t cut there. Scientists use engineered Cas9 variants that recognize other PAMs to reach those spots.'},
    {lvl:'bio',q:'Cas9 cuts the gene, and the cell glues the ends back together but loses one letter. What happens to the β-globin protein?',choices:['It is fixed','It is scrambled and cut short after the cut','Nothing changes'],correct:1,
     baseline:{site:DEFSITE,repair:'nhej',indel:'del1'},changeAction:'cut',changeText:'Cas9 cuts, end-joining repairs',
     explain:{bio:'Losing one letter shifts the reading frame: every three-letter codon after the cut is read wrong, and a stop codon shows up early. The protein is scrambled and short. This is how CRISPR knocks genes out.',
              ap:'A −1 indel shifts the frame at codon 8. Translation hits a premature stop shortly after, so the product is truncated (compare the length readout with 147). In cells, such mRNAs are also destroyed by nonsense-mediated decay.'}},
    {lvl:'honors',q:'This time end-joining removes exactly three letters at the cut. What happens to the protein?',choices:['It is scrambled from the cut onward','It loses about one amino acid and the rest reads normally','It gets much longer'],correct:1,
     baseline:{site:DEFSITE,repair:'nhej',indel:'del3'},changeAction:'cut',changeText:'Cas9 cuts, end-joining removes 3 letters',
     explain:{honors:'Three letters is exactly one codon, so the reading frame after the cut is unchanged. The protein is one amino acid shorter (146) and may still work.'}},
    {lvl:'honors',q:'You choose template repair (HDR) but forget to add the donor template. What does the cell do?',choices:['Fixes the sickle letter anyway','Falls back to end-joining, so the gene is not fixed','Leaves the DNA cut forever'],correct:1,
     baseline:{site:DEFSITE,repair:'hdr',template:false,indel:'del1'},changeAction:'cut',changeText:'Cas9 cuts with no donor template',
     explain:{honors:'HDR copies the repair from a template. Without one, the cell seals the break by end-joining instead, usually leaving an indel. Most cells end up using end-joining even when a template is there.'}},
    {lvl:'honors',instant:true,q:'Two places in the genome look like your target. One differs from the guide by 1 letter, the other by 6. Which is more likely to be cut by mistake?',choices:['The site with 1 mismatch','The site with 6 mismatches','Both equally'],correct:0,
     explain:'The closer a site matches the guide, the more likely Cas9 binds and cuts it. Six mismatches almost never cut; one mismatch often does.'},
    {lvl:'ap',instant:true,q:seedSite&&distal?`Two off-target sites each have 2 mismatches. In one (${seedSite.where}) a mismatch falls in the seed, the 10 letters next to the PAM. In the other (${distal.where}) both are far from the PAM. Which is riskier?`:'Which off-target site is riskiest?',
     choices:['The site with the mismatch in the seed','The site with both mismatches far from the PAM','They are equally risky'],correct:1,
     explain:'Cas9 checks base pairing starting next to the PAM. A mismatch in the seed usually stops the guide from zipping on, so it protects that site. Mismatches far from the PAM are tolerated more often, so that site is riskier.'},
    {lvl:'ap',q:'You give the cell a donor template with the normal A at base 20 and choose HDR. What is amino acid 6 afterward?',choices:['Still Val (sickle)','Glu (normal)','No protein is made'],correct:1,
     baseline:{site:DEFSITE,repair:'hdr',template:true},changeAction:'cut',changeText:'Cas9 cuts, HDR copies the template',
     explain:{ap:'HDR uses the donor as a template, writing the normal A back into codon 7 (GTG → GAG), so Val6 becomes Glu6. Real donors also change the PAM silently so Cas9 can’t cut the fixed gene again. The approved therapy Casgevy takes a different route: it edits a switch that turns fetal hemoglobin back on.'}}];},
  narrate(sim){const s=sim.st,site=siteOf(sim),ph=s.running?PH[s.phase][0]:null;
    if(ph==='search')return 'Cas9, carrying its guide RNA, slides along the DNA checking for a <b>PAM</b> (NGG). Only next to a PAM does it look further.';
    if(ph==='bind')return 'PAM found. The DNA unzips and the <b>guide RNA base-pairs</b> with the target strand, letter by letter, starting next to the PAM.';
    if(ph==='cut')return '<b>A full match.</b> Cas9’s two cutting domains snip both strands 3 letters before the PAM, a clean double-strand break.';
    if(ph==='repair')return sim.p.repair==='hdr'&&sim.p.template&&atLeast('honors')?'The cell repairs the break by <b>copying the donor template</b>, writing the normal A back in.':'The cell <b>glues the broken ends back together</b>. This end-joining is quick but sloppy, and often adds or loses a few letters.';
    if(s.result){const r=s.result;if(r.short==='hdr')return '<b>Fixed.</b> The sickle-cell letter is corrected, codon 7 reads GAG again, and the cell can make normal β-globin.';
      if(r.short==='frameshift')return '<b>Frameshift.</b> The '+r.kind+' shifted every codon after the cut. Translation now stops early, at '+r.len+' amino acids instead of 147.'+(r.fell?' (No template, so the cell used end-joining.)':'');
      return '<b>In frame.</b> The '+r.kind+' removed a whole codon, so the rest of the protein still reads correctly ('+r.len+' amino acids).';}
    return 'This is the sickle-cell version of the HBB gene: base 20 is a <b>T</b> where most people have an A. Pick a cut site and press <b>Send in Cas9</b>.';},
  tour:[
    {title:'The target gene',text:'These are the first 60 letters of HBB, the gene for β-globin. Base 20 is a T instead of an A: the single change behind sickle-cell disease.',focus:[18,28,764,90],pause:true},
    {title:'PAM sites',text:'Cas9 can only bind next to a short signal called a PAM: any letter followed by GG (NGG). The yellow boxes mark PAMs. The one in the darker box is your chosen site.',focus:(sim)=>{const s=siteOf(sim);return [CRX(s.pam[0])-8,58,CRX(s.pam[1])-CRX(s.pam[0])+28,70];},pause:true},
    {title:'Guide RNA',text:'The 20 letters next to the PAM become the guide RNA (orange). It base-pairs with the DNA, so it decides where Cas9 cuts.',focus:(sim)=>{const s=siteOf(sim);return [CRX(s.g0)-8,40,CRX(s.g1)-CRX(s.g0)+28,120];},speed:0.5,setup(sim){runCut(sim);}},
    {title:'The cut',text:'When guide and DNA match, Cas9 cuts both strands three letters before the PAM, a double-strand break.',focus:(sim)=>{const s=siteOf(sim);return [CRX(s.cut)-70,30,150,140];},speed:0.4},
    {title:'Repair by end-joining',text:'The cell rushes to glue the ends back together. End-joining often adds or loses a letter, which wrecks the reading frame and knocks the gene out.',focus:[18,170,764,180],speed:0.5},
    {lvl:'honors',title:'Repair with a template',text:'Given a donor DNA template carrying the normal A, the cell can copy it into the break instead (HDR), fixing the sickle-cell letter.',focus:[18,170,764,180],speed:0.5,setup(sim){BioLab.setValues(sim,{repair:'hdr',template:true});runCut(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{repair:'nhej',template:true});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> How often does end-joining knock the gene out?</p><ol><li>Press Send in Cas9 ten times, pressing Record trial after each one.</li><li>Count how many results were frameshifts and how many stayed in frame.</li></ol><p>Explain why most end-joining repairs break the gene.</p>',
       honors:'<p><b>Question:</b> Which cut site and repair pathway would you use to fix sickle-cell disease?</p><ol><li>For each site, note how far the cut is from base 20.</li><li>Run HDR with and without the template at the closest site.</li></ol><p>Justify your design in a short paragraph.</p>',
       ap:'<p><b>Question:</b> Design the safest effective guide.</p><ol><li>For each site, record the protein outcome of a −1 and a −3 indel, and the off-target table.</li><li>Rank the sites by distance to base 20 and off-target risk.</li></ol><p><b>Claim–evidence–reasoning:</b> Choose a guide and defend it. Then argue whether this edit should ever be made in embryos (germline) rather than in a patient’s blood stem cells (somatic).</p>'},
  terms:[{t:'Cas9',d:'A bacterial protein that cuts DNA where its guide RNA matches.'},{t:'Guide RNA',d:'A 20-letter RNA that pairs with the target DNA and steers Cas9.'},{t:'PAM',d:'A short DNA signal (NGG for the usual Cas9) that must sit right next to the target.'},{t:'Knockout',d:'Breaking a gene so it no longer makes working protein.'},
    {lvl:'honors',t:'NHEJ (end-joining)',d:'Fast repair that glues broken ends together, often adding or losing a few letters.'},{lvl:'honors',t:'HDR (template repair)',d:'Repair that copies a template, allowing precise edits.'},{lvl:'honors',t:'Frameshift',d:'An insertion or deletion that is not a multiple of 3, which changes every codon after it.'},
    {lvl:'ap',t:'Off-target cut',d:'An unwanted cut at a site that nearly matches the guide.'},{lvl:'ap',t:'Seed region',d:'The 10–12 guide letters next to the PAM, where mismatches block cutting most.'},{lvl:'ap',t:'Somatic vs. germline editing',d:'Somatic edits affect only the patient; germline edits pass to future generations.'}],
  about:'<p>The DNA is the real human HBB coding sequence with the sickle-cell change (A→T at base 20). Cut sites are found by scanning both strands for NGG and taking the 20 letters beside it; the cut is placed 3 letters before the PAM. End-joining outcomes are drawn from a simple distribution (mostly 1-letter insertions and deletions). Proteins are translated from the edited sequence to the first stop codon.</p><p><b>Simplified:</b> the off-target “genome” is five made-up near-matches, not a real genome search. Real editing efficiency is far from 100%, HDR works mainly in dividing cells, and real donors also change the PAM so the fixed gene isn’t cut again. Approved sickle-cell therapy (Casgevy, 2023) edits patients’ own blood stem cells outside the body (somatic editing); editing embryos (germline) is not allowed in most countries.</p>',
  initVis(){},
  draw(sim,ctx,vdt,k,t){
    const s=sim.st,site=siteOf(sim),hon=atLeast('honors'),ph=s.running?PH[s.phase][0]:null,f=s.running?clamp(s.pt/PH[s.phase][1],0,1):1;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    txt(ctx,'HBB gene (β-globin), sickle-cell allele · first 60 base pairs',20,22,{s:12.5*k,w:700,c:PAL['cv-soft']});
    const seq=(s.result?s.seq:SICKLE).slice(0,WIN),mark=s.result&&s.mark;
    const YT=84,YB=104;
    // codons + amino acids
    if(hon){const tr=translate(seq);for(let c=0;c<20;c++){const x=28+c*3*CW,w=3*CW;ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(x,YT-9,w-1,40);
      const aa=tr.p[c];txt(ctx,aa?AA3[aa]:(c>=tr.p.length&&tr.stop&&c===tr.p.length?'Stop':''),x+w/2,48,{s:10.5*k,w:600,a:'center',c:c===6?(aa==='E'?PAL['s3']:PAL['cv-inc']):PAL['cv-soft']});}}
    // PAM highlights
    SITES.forEach(st=>{const x0=CRX(st.pam[0])-6,x1=CRX(st.pam[1])+6;ctx.strokeStyle=st===site?PAL['s4']:'rgba(194,122,0,.35)';ctx.lineWidth=st===site?2.5:1.2;ctx.strokeRect(x0,st.strand==='+'?YT-11:YB-11,x1-x0,20);});
    // bases
    for(let i=0;i<WIN;i++){const b=seq[i],x=CRX(i);const hl=mark&&((mark.len>0&&i===mark.at)||(mark.hdr&&i===mark.at));
      if(i===SICK&&!s.result){ctx.fillStyle='rgba(214,47,47,.18)';ctx.fillRect(x-6,YT-10,12,38);}
      if(hl){ctx.fillStyle=mark.hdr?'rgba(44,160,44,.3)':'rgba(214,47,47,.3)';ctx.fillRect(x-6,YT-10,12,38);}
      txt(ctx,b,x,YT,{s:12*k,w:700,c:BASECOL[b]==='#3a3a3a'?PAL['cv-ink']:BASECOL[b],a:'center',b:'middle'});
      txt(ctx,COMP[b],x,YB,{s:12*k,w:700,c:PAL['cv-soft'],a:'center',b:'middle'});}
    if(mark&&mark.len<0){const x=CRX(mark.at)-CW/2;ctx.strokeStyle=PAL['cv-inc'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,YT-14);ctx.lineTo(x,YB+12);ctx.stroke();txt(ctx,mark.len+' letters',x,YB+26,{s:11*k,w:700,c:PAL['cv-inc'],a:'center'});}
    txt(ctx,'5′',8,YT,{s:10*k,c:PAL['cv-soft'],b:'middle'});txt(ctx,'3′',8,YB,{s:10*k,c:PAL['cv-soft'],b:'middle'});
    txt(ctx,'base 20',CRX(SICK),YB+(mark&&mark.len<0&&Math.abs(mark.at-SICK)<5?40:26),{s:10.5*k,c:PAL['cv-inc'],a:'center'});
    // Cas9 + guide RNA animation
    const cx=CRX((site.g0+site.pam[1])/2);
    if(ph||s.result){let x=cx,alpha=1;if(ph==='search'){x=lerp(-120,cx,f);}if(s.result||ph==='repair')alpha=ph==='repair'?1-f:0;
      if(alpha>0.02){ctx.save();ctx.globalAlpha=0.28*alpha;ctx.fillStyle='#7a4fa6';ctx.beginPath();ctx.ellipse(x,94,(CRX(site.g1)-CRX(site.g0))/2+60,58,0,0,6.29);ctx.fill();ctx.restore();
        txt(ctx,'Cas9',x,30,{s:12*k,w:800,c:'#7a4fa6',a:'center'});
        if(ph==='bind'||ph==='cut'||ph==='repair'){const n=ph==='bind'?Math.round(20*f):20,gy=site.strand==='+'?YB+20:YT-24;ctx.globalAlpha=alpha;
          for(let q=0;q<n;q++){const idx=site.strand==='+'?site.g1-q:site.g0+q,b=site.strand==='+'?seq[idx]:COMP[seq[idx]];txt(ctx,b==='T'?'U':b,CRX(idx),gy,{s:11*k,w:700,c:PAL['s4'],a:'center',b:'middle'});}ctx.globalAlpha=1;}}}
    // cut marks
    if(ph==='cut'||ph==='repair'){const x=CRX(site.cut)+CW/2,gap=ph==='cut'?8*f:8*(1-f);ctx.strokeStyle=PAL['cv-inc'];ctx.lineWidth=3;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(x,YT-18);ctx.lineTo(x,YB+14);ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'✂',x,YT-26,{s:16*k,a:'center',c:PAL['cv-inc']});}
    // repair panel
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,18,172,764,150,10);ctx.stroke();
    txt(ctx,'Repair',30,192,{s:12*k,w:700,c:PAL['cv-soft']});
    const hdr=sim.p.repair==='hdr'&&sim.p.template&&hon;
    if(ph==='repair'||s.result){const sp=ph==='repair'?f:1;
      if(hdr){txt(ctx,'Donor template',40,224,{s:12*k,w:600});const tx=lerp(820,180,sp);for(let i=0;i<26;i++){const b=i+8===SICK?'A':HBB[i+8];txt(ctx,b,tx+i*CW,224,{s:12*k,w:700,a:'center',c:i+8===SICK?PAL['s3']:PAL['cv-soft']});}
        txt(ctx,'The cell copies the template, writing the normal A back into base 20.',40,262,{s:13*k});}
      else{const gap=60*(1-sp);ctx.fillStyle='#4e79a7';rr(ctx,200-gap,212,180,14,5);ctx.fill();rr(ctx,420+gap,212,180,14,5);ctx.fill();
        ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(400,219,sp>0.9?0:9,0,6.29);ctx.fill();txt(ctx,'Ku proteins hold the ends; ligase seals them',400,252,{s:12*k,c:PAL['cv-soft'],a:'center'});
        if(s.result)txt(ctx,(s.result.fell?'No template, so end-joining. ':'')+'Result: '+s.result.kind,400,284,{s:13*k,w:700,a:'center',c:s.result.short==='frameshift'?PAL['cv-inc']:PAL['cv-ink']});}}
    else txt(ctx,'Nothing to repair yet. Press Send in Cas9.',400,250,{s:13*k,c:PAL['cv-soft'],a:'center'});
    // protein comparison
    const o=outcomeOf(sim),W=600/147;
    txt(ctx,'Normal β-globin',30,352,{s:12*k,w:600});ctx.fillStyle=PAL['s3'];rr(ctx,170,342,147*W,14,5);ctx.fill();txt(ctx,'147',176+147*W,353,{s:11*k,c:PAL['cv-soft']});
    txt(ctx,'This gene makes',30,390,{s:12*k,w:600});ctx.fillStyle=o.short==='frameshift'?PAL['cv-inc']:o.short==='hdr'?PAL['s3']:PAL['s4'];rr(ctx,170,380,Math.max(4,o.len*W),14,5);ctx.fill();
    txt(ctx,o.len+(o.short==='frameshift'?' (stops early)':''),176+o.len*W,391,{s:11*k,c:PAL['cv-soft']});
    txt(ctx,'Amino acid 6: '+o.aa6+(o.aa6==='Val'?' (sickle)':o.aa6==='Glu'?' (normal)':''),30,428,{s:12.5*k,w:700,c:o.aa6==='Glu'?PAL['s3']:o.aa6==='Val'?PAL['cv-inc']:PAL['cv-ink']});
  }
};
const CW=12.4,CRX=i=>28+i*CW+CW/2;
const lerp=(a,b,t)=>a+(b-a)*t;
function runCut(sim){const a=CR.actions[0];a.run(sim);}
BioLab.register(CR);
})();
