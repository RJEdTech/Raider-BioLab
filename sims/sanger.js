(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,RM,lvText}=BioLab.h;

/* Sanger (chain-termination) sequencing of the start of the human HBB gene.
   Each position k after the primer, a growing strand stops with probability f (the ddNTP share).
   Strands ending at k: n_k = M·f·(1−f)^(k−1), with M = 10,000 strands. A base is called when its
   peak is at least 3× the noise (noise = 15). Capillary electrophoresis delivers fragments shortest-first. */
const HBB='ATGGTGCATCTGACTCCTGAGGAGAAGTCTGCCGTT';   // the first 36 bases (the read)
const N=HBB.length,SICK=19,M=10000,NOISE=15;
const COMP={A:'T',T:'A',G:'C',C:'G'};
const DYE={A:'#2ca02c',T:'#d62f2f',G:'#3a3a3a',C:'#2d6bd2'};
const DYEN={A:'green',T:'red',G:'black',C:'blue'};
const dye=b=>b==='G'?PAL['cv-ink']:DYE[b];
function readSeqs(sample){const sick=HBB.slice(0,SICK)+'T'+HBB.slice(SICK+1);if(sample==='sickle')return [sick];if(sample==='het')return [HBB,sick];return [HBB];}
function peaks(sim){const f=sim.p.dd/100,seqs=readSeqs(sim.p.sample),out=[];
  for(let k=1;k<=N;k++){const h=M*f*Math.pow(1-f,k-1);const by={};seqs.forEach(sq=>{by[sq[k-1]]=(by[sq[k-1]]||0)+h/seqs.length;});out.push({k,h,by});}return out;}
function readLen(sim){const P=peaks(sim);let n=0;for(const p of P){if(p.h>=3*NOISE)n++;else break;}return n;}
function calls(sim){const P=peaks(sim),L=readLen(sim);return P.map((p,i)=>{if(i>=L)return 'N';const ks=Object.keys(p.by);return ks.length>1?(ks.sort().join('')==='AT'?'W':'N'):ks[0];}).join('');}

const PH=[['react',2.6],['run',6]];
const SG={
  id:'sanger',hash:'sanger',apUnit:11,order:4,tab:'DNA sequencing (Sanger)',kind:'Go further',prereq:['replication'],
  card:'Copy DNA with chain-stopping letters, sort the pieces by size, and read the gene from colored peaks.',
  title:'Reading DNA: Sanger sequencing',
  lede:{bio:'How do scientists read the letters of a gene? Copy it many times, stop each copy at a random letter with a colored “stop” nucleotide, then sort the pieces by size.',
        honors:'Follow chain termination from the reaction tube to the chromatogram, and see why the read is the complement of the template.',
        ap:'Tune the ddNTP ratio, read heterozygous double peaks, and find the sickle-cell mutation by comparing a patient’s read to the reference.'},
  scale:'The first 36 base pairs of the human HBB gene. A real Sanger run reads about 800 bases from billions of copies in a capillary thinner than a hair.',
  timeless:true,animated:true,graph:false,chChange:0.3,chReveal:8,
  controls:[
    {id:'sample',label:'DNA sample',type:'seg',def:'normal',lvl:'bio',options:[{v:'normal',l:'Normal HBB'},{v:'sickle',l:'Sickle-cell patient',lvl:'honors'},{v:'het',l:'Carrier',lvl:'ap'}],onChange(sim){restart(sim);}},
    {id:'dd',label:'ddNTP share of nucleotides',type:'range',min:0.2,max:30,step:0.1,def:3,unit:'%',lvl:'bio',help:'How many of the nucleotides are chain-stopping, colored ddNTPs',onChange(sim){restart(sim);}}
  ],
  actions:[{id:'run',label:'Run the reaction',lvl:'bio',primary:true,run(sim){restart(sim,true);}}],
  init(sim){return {phase:PH.length,pt:0,running:false,seed:1};},
  step(sim,dt){const s=sim.st;if(!s.running)return;s.pt+=dt;while(s.running&&s.pt>=PH[s.phase][1]){s.pt-=PH[s.phase][1];s.phase++;if(s.phase>=PH.length){s.running=false;s.phase=PH.length;}}},
  metrics:[
    {id:'len',label:'Read length',unit:'bases called',lvl:'bio',min:0,max:N,d:0,get:s=>readLen(s)},
    {id:'first',label:'Signal at base 1',unit:'strands',lvl:'bio',min:0,max:3000,d:0,get:s=>peaks(s)[0].h},
    {id:'last',label:'Signal at base 36',unit:'strands',lvl:'honors',min:0,max:400,d:0,get:s=>peaks(s)[N-1].h},
    {id:'read',label:'Sequence read (5′→3′)',unit:'',lvl:'bio',text:true,noTrial:true,get:s=>calls(s)},
    {id:'b20',label:'Base 20',unit:'',lvl:'ap',text:true,get:s=>{const c=calls(s)[SICK];return c==='W'?'A + T (double peak)':c==='N'?'No call':c;}}
  ],
  challenges:[
    {lvl:'bio',instant:true,q:'The fragments race through the capillary toward the detector. Which one arrives first?',choices:['The shortest one, which stopped right after the primer','The longest one','They all arrive together'],correct:0,
     explain:'Short pieces of DNA move through the gel-filled capillary fastest. The shortest fragment stopped at the first letter after the primer, so the detector reads the sequence in order, one letter longer each time.'},
    {lvl:'bio',q:'You add ten times more ddNTPs to the reaction. What happens to the read?',choices:['It gets longer','Only the first part can be read','Nothing changes'],correct:1,
     baseline:{sample:'normal',dd:3},change:{dd:30},changeAction:'run',changeText:'ddNTPs raised to 30%',
     explain:{bio:'With so many stop letters, almost every copy stops in the first few bases. There are plenty of short fragments but hardly any long ones, so the later peaks are too small to read.',
              ap:'Strands reaching position k fall off as (1 − f)^(k−1). At f = 30% that drops below the noise threshold after about 12 bases.'}},
    {lvl:'honors',instant:true,q:'Why does a ddNTP stop the growing chain?',choices:['It has no 3′-OH group, so the next nucleotide can’t attach','It is too large to fit','It binds and blocks the polymerase'],correct:0,
     explain:'DNA polymerase links each new nucleotide to the 3′-OH of the last one. A dideoxy nucleotide is missing that oxygen, so once it is added, nothing can come after it.'},
    {lvl:'honors',instant:true,q:'The template strand reads 3′-TACCAC-5′. What does the reaction write, 5′→3′?',choices:['5′-ATGGTG-3′','5′-TACCAC-3′','5′-GTGGTA-3′'],correct:0,
     explain:'The polymerase builds the complementary strand: T pairs with A, A with T, C with G. So the read is the complement of the template, here ATGGTG, the start of the β-globin gene.'},
    {lvl:'honors',q:'You use ten times fewer ddNTPs than the default. What happens?',choices:['A longer, cleaner read','The peaks get so weak the read fails','Nothing changes'],correct:1,
     baseline:{sample:'normal',dd:3},change:{dd:0.3},changeAction:'run',changeText:'ddNTPs cut to 0.3%',
     explain:{honors:'With very few stop letters, most copies run past the end without stopping. Each position gets only a few labeled fragments, and the peaks sink into the background noise. Sequencing needs a balanced ratio.'}},
    {lvl:'ap',instant:true,q:'A patient’s read shows a green A peak and a red T peak, each half height, at base 20. What does that mean?',choices:['A sequencing error','They carry one normal and one sickle allele (carrier)','They have two sickle alleles'],correct:1,
     explain:'Sanger sequencing reads both copies of the gene at once. Half-height overlapping peaks mean the two alleles differ at that base: one A (normal, GAG) and one T (sickle, GTG). The person is heterozygous, a carrier with sickle-cell trait.'},
    {lvl:'ap',instant:true,q:'Compared with the reference, the sickle-cell patient’s read differs at base 20. What is the change, and what does it do to codon 7?',choices:['A→T, turning GAG (Glu) into GTG (Val)','G→A, turning GAG into AAG','T→C, a silent change'],correct:0,
     explain:'Base 20 is the middle letter of codon 7. A→T changes GAG (glutamate) to GTG (valine). That one amino acid change makes hemoglobin stick together when oxygen is low.'}
  ],
  narrate(sim){const s=sim.st,ph=s.running?PH[s.phase][0]:null,L=readLen(sim),f=sim.p.dd;
    if(ph==='react')return 'In the tube, DNA polymerase copies the template from the primer. Each time it adds a colored <b>ddNTP</b> by chance, that copy <b>stops</b>, so the tube fills with copies of every length.';
    if(ph==='run')return 'The copies race through a thin capillary. <b>Shorter pieces move faster</b>, so they pass the laser one letter longer at a time, and the color of each stop letter is recorded.';
    if(L===0)return '<b>No readable peaks.</b> With only '+f+'% ddNTPs, too few copies stop at each position, and every peak is lost in the noise.';
    if(L<N)return f>8?'<b>Too many stop letters.</b> Most copies stop in the first few bases, so the peaks fade out after base '+L+'.':'<b>Peaks fading.</b> The read is good for '+L+' bases before the signal drops into the noise.';
    if(sim.p.sample==='het')return 'A clean read, except base 20 shows <b>two peaks at once</b>: this person has one normal and one sickle-cell copy of the gene.';
    if(sim.p.sample==='sickle')return 'A clean read of all '+N+' bases. Base 20 is a <b>T</b>, where the reference has an A: the sickle-cell mutation.';
    return 'A clean read: all '+N+' bases called. Each colored peak is one letter. Green A, red T, black G, blue C.';},
  tour:[
    {title:'The ingredients',text:'A template strand, a short primer that marks the start, DNA polymerase, the four normal nucleotides, and a little of each colored, chain-stopping <b>ddNTP</b>.',focus:[18,28,764,150],speed:0.4,setup(sim){restart(sim,true);}},
    {title:'Copying stops at random',text:'Each copy grows until a ddNTP happens to be added, and then it stops. With millions of copies, some stop at every single position.',focus:[18,70,764,108],speed:0.25},
    {title:'Sorting by size',text:'The copies race through a thin capillary. Short ones move fastest, so they reach the laser detector in order of length.',focus:[18,182,764,52],speed:0.6},
    {title:'Reading the colors',text:'Each length ends in a colored letter, so the detector records a series of colored peaks: the chromatogram. Reading the colors left to right gives the sequence.',focus:[18,240,764,182],speed:1},
    {lvl:'honors',title:'Complement of the template',text:'The read is the new strand, so it is the complement of the template you started with. Here it spells out the start of the β-globin gene: ATG GTG CAT…',focus:[18,28,764,60],pause:true},
    {lvl:'ap',title:'Two alleles at once',text:'A carrier has one normal and one sickle-cell copy. Both are read together, so base 20 shows an A peak and a T peak at half height.',focus:[18,240,764,200],pause:true,setup(sim){BioLab.setValues(sim,{sample:'het'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{sample:'normal',dd:3});},
  lab:{bio:'<p><b>Question:</b> What ddNTP share gives the longest read?</p><ol><li>Record the read length at ddNTP shares of 0.3, 0.5, 1, 3, 10 and 30%.</li><li>Plot ddNTP share (x) against read length (y).</li></ol><p>Explain why too many and too few ddNTPs both give short reads.</p>',
       honors:'<p><b>Question:</b> How does the signal change along the read?</p><ol><li>At 1%, 3% and 10% ddNTPs, record the signal at base 1 and at base 36.</li><li>Calculate the ratio for each.</li></ol><p>Describe how the ratio explains the fading peaks at high ddNTP shares.</p>',
       ap:'<p><b>Question:</b> Can you diagnose sickle-cell status from a chromatogram?</p><ol><li>Sequence the normal, sickle and carrier samples.</li><li>For each, record base 20 and the codon it sits in.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain how a single double peak identifies a carrier, and why the patient’s two alleles are read together.</p>'},
  terms:[{t:'Primer',d:'A short piece of DNA that pairs with the template and gives the polymerase a starting point.'},{t:'ddNTP',d:'A chain-stopping nucleotide with a colored dye. Once added, nothing can attach after it.'},{t:'Capillary electrophoresis',d:'Sorting DNA by size in a thin tube; short pieces move fastest.'},{t:'Chromatogram',d:'The colored peaks a sequencer records, one peak per letter.'},
    {lvl:'honors',t:'3′-OH group',d:'The spot on a nucleotide where the next one attaches. ddNTPs lack it.'},{lvl:'honors',t:'Complementary strand',d:'The new strand pairs with the template: A with T, G with C.'},
    {lvl:'ap',t:'Heterozygous double peak',d:'Two overlapping peaks at one position when the two alleles differ.'},{lvl:'ap',t:'Read length',d:'How many bases can be called before the signal gets too weak.'}],
  about:'<p>Copies stop at each position with probability f, the ddNTP share, so the number ending at base k is 10,000·f·(1 − f)^(k−1). A base is called when its peak is at least 3× the noise level. The sequence is the first 36 bases of human HBB; the sickle sample has A→T at base 20.</p><p><b>Simplified:</b> real reactions use about 1 ddNTP per 100 dNTPs to read 700–1,000 bases; the shares here are scaled up for a 36-base read. Real peaks also vary in height with the sequence, the first ~20 bases after the primer are usually unreadable, and both strands are often sequenced to confirm a call.</p>',
  initVis(sim){sim.vis.r=rng(5);},
  draw(sim,ctx,vdt,k,t){
    const s=sim.st,ph=s.running?PH[s.phase][0]:null,f=s.running?clamp(s.pt/PH[s.phase][1],0,1):1,hon=atLeast('honors'),ap=atLeast('ap');
    const X0=120,DX=18,bx=i=>X0+i*DX+DX/2;   // i = 0..N−1
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const seqs=readSeqs(sim.p.sample),read=seqs[seqs.length-1];
    // ---- reaction panel ----
    txt(ctx,'1 · Reaction tube',24,24,{s:12*k,w:700,c:PAL['cv-soft']});
    txt(ctx,'template 3′',X0-12,52,{s:10.5*k,c:PAL['cv-soft'],a:'right',b:'middle'});
    for(let i=0;i<N;i++)txt(ctx,COMP[seqs[0][i]],bx(i),52,{s:12*k,w:700,c:PAL['cv-soft'],a:'center',b:'middle'});
    txt(ctx,'5′',bx(N-1)+14,52,{s:10.5*k,c:PAL['cv-soft'],b:'middle'});
    ctx.fillStyle=PAL['cv-soft'];rr(ctx,40,66,X0-46,10,4);ctx.fill();txt(ctx,'primer',40,90,{s:10.5*k,c:PAL['cv-soft']});
    // sample copies: each stops where a ddNTP lands
    const fr=sim.p.dd/100,R=rng(17+Math.round(sim.p.dd*10));
    const grow=ph==='react'?f*N*1.05:N;
    for(let r=0;r<6;r++){let stop=1;while(stop<N+6&&R()>fr)stop++;const y=78+r*15,end=Math.min(stop,N,Math.floor(grow));
      ctx.strokeStyle=PAL['cv-sub'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(X0-4,y);ctx.lineTo(X0+end*DX-6,y);ctx.stroke();
      if(stop<=N&&grow>=stop){const b=seqs[r%seqs.length][stop-1];ctx.fillStyle=dye(b);ctx.beginPath();ctx.arc(X0+(stop-1)*DX+DX/2,y,5.5,0,6.29);ctx.fill();}
      else if(stop>N&&grow>=N)txt(ctx,'ran off the end →',X0+N*DX+4,y-6,{s:9.5*k,c:PAL['cv-soft'],a:'right',b:'middle'});}
    // ---- capillary ----
    txt(ctx,'2 · Capillary',24,196,{s:12*k,w:700,c:PAL['cv-soft']});
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;rr(ctx,40,204,660,18,9);ctx.stroke();
    ctx.fillStyle=PAL['s4'];ctx.globalAlpha=0.6;ctx.fillRect(704,196,6,34);ctx.globalAlpha=1;txt(ctx,'laser',740,215,{s:11*k,c:PAL['cv-soft'],a:'center',b:'middle'});
    const P=peaks(sim),runT=ph==='run'?f:(ph==='react'?0:1);
    if(ph==='run'){for(let i=0;i<N;i++){const arrive=0.08+0.85*(i+1)/N;const x=40+clamp(runT/arrive,0,1)*664;if(x>=704)continue;const b=read[i];
      ctx.fillStyle=dye(b);ctx.globalAlpha=clamp(P[i].h/(3*NOISE),0.15,1);ctx.beginPath();ctx.arc(x,213,4,0,6.29);ctx.fill();ctx.globalAlpha=1;}}
    // ---- chromatogram ----
    txt(ctx,'3 · Chromatogram',24,252,{s:12*k,w:700,c:PAL['cv-soft']});
    const base=402,top=280,maxH=Math.max(...P.map(p=>p.h),NOISE*3);const sc=(base-top)/maxH;
    const shown=ph==='react'?0:ph==='run'?N*clamp((runT-0.08)/0.85,0,1):N;
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(40,base+.5);ctx.lineTo(780,base+.5);ctx.stroke();
    // noise
    ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=0.5;ctx.beginPath();for(let x=X0-10;x<=X0+N*DX;x+=3){const xi=(x-X0)/DX;if(xi>shown)break;const v=NOISE*(0.5+0.5*Math.sin(x*1.7)*Math.cos(x*0.53));x===X0-10?ctx.moveTo(x,base-v*sc):ctx.lineTo(x,base-v*sc);}ctx.stroke();ctx.globalAlpha=1;
    ['A','T','G','C'].forEach(b=>{ctx.strokeStyle=dye(b);ctx.lineWidth=2;ctx.beginPath();let started=false;
      for(let x=X0;x<=X0+N*DX;x+=2){const xi=(x-X0)/DX;if(xi>shown)break;let v=0;for(let i=Math.max(0,Math.floor(xi)-2);i<Math.min(N,Math.floor(xi)+3);i++){const amp=P[i].by[b]||0;if(!amp)continue;const d=(xi-(i+0.5))/0.28;v+=amp*Math.exp(-d*d);}
        const y=base-v*sc;if(!started){ctx.moveTo(x,y);started=true;}else ctx.lineTo(x,y);}ctx.stroke();});
    // calls
    const C=calls(sim),L=readLen(sim);
    for(let i=0;i<N&&i<shown;i++){const c=C[i];txt(ctx,c,bx(i),270,{s:12*k,w:700,c:c==='N'?PAL['cv-soft']:c==='W'?PAL['s5']:dye(c),a:'center',b:'middle'});}
    if(shown>=N)txt(ctx,'read length: '+L+' of '+N,780,252,{s:11.5*k,w:700,a:'right',c:L<N?PAL['cv-inc']:PAL['s3']});
    // reference comparison (AP) or template note
    if(ap&&shown>=N){txt(ctx,'reference',X0-12,428,{s:10.5*k,c:PAL['cv-soft'],a:'right',b:'middle'});
      for(let i=0;i<N;i++){const bad=C[i]!==HBB[i]&&C[i]!=='N';if(bad){ctx.fillStyle='rgba(214,47,47,.18)';ctx.fillRect(bx(i)-8,418,16,20);}txt(ctx,HBB[i],bx(i),428,{s:11.5*k,w:600,c:bad?PAL['cv-inc']:PAL['cv-soft'],a:'center',b:'middle'});}}
    else if(hon)txt(ctx,'The read (top letters) is the complement of the template strand.',X0,428,{s:11.5*k,c:PAL['cv-soft'],b:'middle'});
    if(sim.p.sample!=='normal'){const x=bx(SICK);ctx.strokeStyle=PAL['s5'];ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x,262);ctx.lineTo(x,base);ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'base 20',x,base+12,{s:10*k,c:PAL['s5'],a:'center'});}
  }
};
function restart(sim,play){sim.st.running=!!play;sim.st.phase=play?0:PH.length;sim.st.pt=0;}
BioLab.register(SG);
})();
