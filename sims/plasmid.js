(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,legend,serColor,lvText,fmtNum}=BioLab.h;
const MONO='Consolas,"Courier New",monospace';

/* ---------- enzymes: recognition site, cut position within site (top strand), end type ---------- */
const ENZ={
  EcoRI:{site:'GAATTC',cut:1,end:'5′ sticky',over:'AATT'},
  HindIII:{site:'AAGCTT',cut:1,end:'5′ sticky',over:'AGCT'},
  BamHI:{site:'GGATCC',cut:1,end:'5′ sticky',over:'GATC'},
  SalI:{site:'GTCGAC',cut:1,end:'5′ sticky',over:'TCGA'},
  NdeI:{site:'CATATG',cut:2,end:'5′ sticky',over:'TA'},
  PstI:{site:'CTGCAG',cut:5,end:'3′ sticky',over:'TGCA'},
  PvuII:{site:'CAGCTG',cut:3,end:'blunt',over:''},
  EcoRV:{site:'GATATC',cut:3,end:'blunt',over:''},
  ScaI:{site:'AGTACT',cut:3,end:'blunt',over:''}
};
const ENZ_NAMES=Object.keys(ENZ);
const comp=s=>s.split('').map(c=>({A:'T',T:'A',G:'C',C:'G'}[c])).join('');

/* ---------- DNA molecules ---------- */
const DNA={
  pBR322:{name:'pBR322',len:4361,circ:true,approx:false,
    sites:{EcoRI:[4359],HindIII:[29],EcoRV:[185],BamHI:[375],SalI:[651],PvuII:[2064],NdeI:[2295],PstI:[3609],ScaI:[3844]},
    feats:[{n:'tetR',d:'Tetracycline resistance',from:86,to:1276,col:'#2a8276'},{n:'rop',d:'Copy-number control',from:1915,to:2106,col:'#7a8fb8'},{n:'ori',d:'Origin of replication',from:2535,to:3123,col:'#c27a00'},{n:'ampR',d:'Ampicillin resistance (bla)',from:3293,to:4153,col:'#b5122d'}]},
  pGLO:{name:'pGLO',len:5371,circ:true,approx:true,
    sites:{NdeI:[1010],EcoRI:[1745],HindIII:[1752],PstI:[3110],ScaI:[2960],PvuII:[880,4650]},
    feats:[{n:'araC',d:'Arabinose sensor (makes AraC protein)',from:10,to:880,col:'#7b3fe4'},{n:'GFP',d:'Green fluorescent protein, switched on by arabinose',from:1010,to:1730,col:'#1b8a4a'},{n:'ampR',d:'Ampicillin resistance (bla)',from:2600,to:3460,col:'#b5122d'},{n:'ori',d:'Origin of replication',from:4100,to:4690,col:'#c27a00'}]},
  lambda:{name:'λ phage DNA (linear)',len:48502,circ:false,approx:false,
    sites:{EcoRI:[21226,26104,31747,39168,44972],HindIII:[23130,25157,27479,36895,37459,37584,44141],BamHI:[5505,22346,27972,34499,41732]},
    feats:[]}
};
const INSERT_LEN=720; // GFP coding sequence
function cutsFor(mol,enz){const m=DNA[mol];if(!enz||enz==='none')return [];return (m.sites[enz]||[]).slice();}
function mapped(mol,enz){return !enz||enz==='none'||DNA[mol].sites[enz]!==undefined||DNA[mol].circ;}
function digest(mol,e1,e2){const m=DNA[mol];const cuts=[...new Set(cutsFor(mol,e1).concat(e2&&e2!==e1?cutsFor(mol,e2):[]))].sort((a,b)=>a-b);
  if(m.circ){if(!cuts.length)return {cuts,frags:[{bp:m.len,uncut:true,from:0,to:m.len}]};
    const fr=[];for(let i=0;i<cuts.length;i++){const a=cuts[i],b=i<cuts.length-1?cuts[i+1]:cuts[0]+m.len;fr.push({bp:b-a,from:a,to:b});}return {cuts,frags:fr};}
  const bnd=[0].concat(cuts,[m.len]);const fr=[];for(let i=0;i<bnd.length-1;i++)fr.push({bp:bnd[i+1]-bnd[i],from:bnd[i],to:bnd[i+1]});return {cuts,frags:fr};}
function featAt(mol,pos){return DNA[mol].feats.filter(f=>pos>=f.from&&pos<=f.to);}
function mob(bp){return Math.max(0.02,0.35*(5-Math.log10(bp)));}
const LADDER=[10000,8000,6000,5000,4000,3000,2000,1500,1000,500,250];

/* ---------- geometry ---------- */
const CX=222,CY=232,R=120;
const ang=(pos,len)=>-Math.PI/2+2*Math.PI*pos/len;

const PL={
  id:'plasmid',hash:'plasmid',apUnit:10,order:2,kind:'Virtual lab',tab:'Plasmid maps and restriction digests',
  card:'Cut pBR322, pGLO or λ DNA with restriction enzymes, predict the fragments, see the gel, and clone a gene into a plasmid.',
  title:'Plasmid maps and restriction digests',
  next:['gel'],prereq:['pipette'],
  lede:{bio:'A plasmid is a small ring of DNA in bacteria. Restriction enzymes cut it at specific sequences. Predict the pieces, then check them on a gel.',
        honors:'Read a plasmid map like the ones in ApE, predict fragment sizes for any combination of enzymes, and clone a GFP gene into a matching site.',
        ap:'Use restriction mapping and insertional inactivation: cutting inside a resistance gene destroys that resistance, which lets you screen for recombinant plasmids.'},
  scale:{bio:'pBR322 is a ring of 4,361 base pairs, about 1.5 µm around. One bacterium can hold 15 to 20 copies. λ phage DNA is a 48,502 bp straight molecule.',
         ap:'Map positions are in base pairs from position 1. Fragment sizes come from the differences between cut positions; for a circle, the last fragment wraps past position 1.'},
  timeless:true,animated:true,graph:true,
  controls:[
    {id:'mol',label:'DNA to cut',type:'select',def:'pBR322',lvl:'bio',options:[{v:'pBR322',l:'pBR322 plasmid (4,361 bp)'},{v:'pGLO',l:'pGLO plasmid (about 5,371 bp)'},{v:'lambda',l:'λ phage DNA, linear (48,502 bp)',lvl:'honors'}],onChange(sim){restart(sim,true);}},
    {id:'e1',label:'Enzyme 1',type:'select',def:'EcoRI',lvl:'bio',options:ENZ_NAMES.map(e=>({v:e,l:e+'  ('+ENZ[e].site+')'})),onChange(sim){restart(sim,false);}},
    {id:'e2',label:'Enzyme 2',type:'select',def:'none',lvl:'bio',options:[{v:'none',l:'None'}].concat(ENZ_NAMES.map(e=>({v:e,l:e+'  ('+ENZ[e].site+')'}))),onChange(sim){restart(sim,false);}},
    {id:'insEnz',label:'Enzyme used to cut the GFP insert',type:'select',def:'BamHI',lvl:'honors',options:ENZ_NAMES.map(e=>({v:e,l:e})),help:'The insert’s ends must match the plasmid’s cut ends',onChange(sim){sim.st.clone=null;}}
  ],
  actions:[
    {id:'digest',label:'Digest again',primary:true,lvl:'bio',run(sim){restart(sim,false);}},
    {id:'clone',label:'Ligate the GFP insert',lvl:'honors',run(sim){tryClone(sim);}},
    {id:'clear',label:'Remove insert',lvl:'honors',run(sim){sim.st.clone=null;sim.st.lig=null;}}
  ],
  init(sim){return {anim:0,clone:null,lig:null,seed:1};},
  step(sim,dt){const s=sim.st;s.anim=Math.min(3.2,s.anim+dt*0.9);if(s.lig){s.lig.t=Math.min(1.5,s.lig.t+dt*0.8);}},
  metrics:[
    {id:'cuts',label:'Cuts',unit:'',lvl:'bio',min:0,max:10,d:0,get:s=>dg(s).cuts.length},
    {id:'nfrag',label:'Fragments',unit:'',lvl:'bio',min:0,max:10,d:0,get:s=>dg(s).frags.length},
    {id:'sizes',label:'Fragment sizes',unit:'',lvl:'bio',text:true,get:s=>{const d=dg(s);if(d.frags[0].uncut)return 'Uncut circle, '+d.frags[0].bp.toLocaleString()+' bp';return d.frags.map(f=>f.bp).sort((a,b)=>b-a).map(x=>x.toLocaleString()).join(' + ')+' bp';}},
    {id:'total',label:'Fragments add up to',unit:'bp',lvl:'bio',min:0,max:null,d:0,get:s=>dg(s).frags.reduce((a,f)=>a+f.bp,0)},
    {id:'ends',label:'Ends left by enzyme 1',unit:'',lvl:'honors',text:true,get:s=>{const e=ENZ[s.p.e1];return e.end+(e.over?' ('+e.over+' overhang)':'');}},
    {id:'recomb',label:'Recombinant plasmid',unit:'',lvl:'honors',text:true,get:s=>{const c=s.st.clone;if(!c)return 'No insert yet';if(c.fail)return 'Ends don’t match: no ligation';return (DNA[s.p.mol].len+INSERT_LEN).toLocaleString()+' bp, insert '+(c.orient>0?'forward':'reversed');}},
    {id:'amp',label:'Ampicillin resistance with an insert here',unit:'',lvl:'ap',text:true,get:s=>resist(s,'ampR')},
    {id:'tet',label:'Tetracycline resistance with an insert here',unit:'',lvl:'ap',text:true,get:s=>resist(s,'tetR')}
  ],
  graphs:[{id:'sizes',label:'Fragment sizes (bar chart)',custom:true}],defaultGraph:'sizes',
  plot(sim,ctx,box){const d=dg(sim);const fr=d.frags.slice().sort((a,b)=>b.bp-a.bp);const mx=Math.max(...fr.map(f=>f.bp));
    const ax=axes(ctx,box,{xmin:0,xmax:fr.length,ymin:0,ymax:mx*1.15,xcats:fr.map((f,i)=>'#'+(i+1)),yl:'Size (bp)',xl:'Fragments, largest to smallest'});
    bars(ctx,ax,fr.map(f=>f.bp),{colors:[PAL['s2']],d:0});},
  challenges:[
    {lvl:'bio',q:'pBR322 is a ring of 4,361 bp. EcoRI cuts it at one site. What do you get?',
     choices:['One straight piece, 4,361 bp long','Two pieces that add up to 4,361 bp','Nothing changes; plasmids can’t be cut'],correct:0,instant:true,show:{mol:'pBR322',e1:'EcoRI',e2:'none'},
     explain:{bio:'Cutting a ring once opens it into one straight piece, the same length as the ring. Compare a straight piece of string: one cut makes two pieces. Look at the map and the gel lane after you answer.'}},
    {lvl:'bio',q:'You cut pBR322 with HindIII (position 29) and BamHI (position 375). What fragment sizes do you get?',
     choices:['346 bp and 4,015 bp','375 bp and 3,986 bp','29 bp and 4,332 bp'],correct:0,instant:true,show:{mol:'pBR322',e1:'HindIII',e2:'BamHI'},
     explain:{bio:'The short piece runs from 29 to 375: 375 − 29 = 346 bp. The rest of the ring is 4,361 − 346 = 4,015 bp. The two pieces always add up to the whole plasmid.'}},
    {lvl:'honors',q:'λ phage DNA is a straight molecule. HindIII cuts it at 7 sites. How many fragments do you get?',
     choices:['7','8','6'],correct:1,instant:true,show:{mol:'lambda',e1:'HindIII',e2:'none'},
     explain:{honors:'Each cut in a straight molecule adds one piece, so 7 cuts give 8 fragments. In a circle, n cuts give n fragments. These 8 fragments, from 125 to 23,130 bp, are the classic λ/HindIII DNA ladder.'}},
    {lvl:'honors',q:'You open pBR322 with BamHI, but cut your GFP insert with EcoRI. Will the insert ligate into the plasmid?',
     choices:['Yes, any sticky ends stick together','No, the overhangs don’t pair','Only if you add more ligase'],correct:1,instant:true,show:{mol:'pBR322',e1:'BamHI',e2:'none',insEnz:'EcoRI'},
     explain:{honors:'BamHI leaves GATC overhangs and EcoRI leaves AATT overhangs. Sticky ends join only when their single-stranded bases pair. Cut the plasmid and the insert with the same enzyme. Try “Ligate the GFP insert” with each enzyme to see it.'}},
    {lvl:'ap',q:'You clone an insert into the PstI site of pBR322. Which antibiotic can you no longer use to select cells carrying the recombinant plasmid?',
     choices:['Ampicillin','Tetracycline','Both'],correct:0,instant:true,show:{mol:'pBR322',e1:'PstI',e2:'none'},
     explain:{ap:'The PstI site (3,609) sits inside the ampR (bla) gene, so the insert breaks that gene. Recombinant cells grow on tetracycline but not on ampicillin. This is insertional inactivation.'}},
    {lvl:'ap',q:'You clone into the BamHI site, then plate cells on ampicillin and replica-plate them onto tetracycline. Which colonies carry the recombinant plasmid?',
     choices:['Colonies that grow on both plates','Colonies that grow on ampicillin but not tetracycline','Colonies that grow on neither'],correct:1,instant:true,show:{mol:'pBR322',e1:'BamHI',e2:'none'},
     explain:{ap:'BamHI (375) cuts inside tetR. An insert there destroys tetracycline resistance but leaves ampR intact. Plasmids that closed back up with no insert still grow on both, so recombinants are the amp-resistant, tet-sensitive colonies.'}}
  ],
  onChallenge(sim,ch,phase){if(phase==='done'&&ch.show){BioLab.setValues(sim,ch.show);restart(sim,false);}},
  narrate(sim){const p=sim.p,s=sim.st,m=DNA[p.mol],d=dg(sim);
    const unm=[p.e1,p.e2].filter(e=>e!=='none'&&!m.circ&&m.sites[e]===undefined);
    if(unm.length)return 'This tool doesn’t list '+unm.join(' or ')+' sites for λ DNA. Choose EcoRI, HindIII or BamHI to cut λ.';
    if(s.lig&&s.clone&&s.clone.fail)return '<b>The ends don’t match.</b> The plasmid has '+(ENZ[p.e1].over||'blunt')+' ends and the insert has '+(ENZ[p.insEnz].over||'blunt')+' ends, so the bases can’t pair. Cut both with the same enzyme.';
    if(s.clone)return '<b>DNA ligase sealed the GFP gene into the plasmid.</b> The new ring is '+(m.len+INSERT_LEN).toLocaleString()+' bp. The insert went in '+(s.clone.orient>0?'forward':'backward')+'; with one enzyme, either direction is equally likely.';
    if(d.frags[0].uncut)return '<b>No cuts.</b> '+[p.e1,p.e2].filter(e=>e!=='none').join(' and ')+' has no site in '+m.name+', so the ring stays whole. Uncut plasmid is twisted (supercoiled), so it runs a little faster than its size suggests.';
    if(m.circ&&d.cuts.length===1)return 'One cut opens the ring into a single straight piece of '+m.len.toLocaleString()+' bp. To get two pieces from a circle you need two cuts.';
    const e=ENZ[p.e1];
    return (m.circ?d.cuts.length+' cuts in a circle give '+d.frags.length+' fragments':d.cuts.length+' cuts in a straight molecule give '+d.frags.length+' fragments')+'. They add up to '+m.len.toLocaleString()+' bp. '+p.e1+' leaves '+(e.end==='blunt'?'blunt ends':e.end+' ends with '+e.over+' overhangs')+'.';},
  tour:[
    {title:'Reading the map',text:'The ring is the plasmid’s DNA. Positions are numbered in base pairs, starting at the top and going clockwise around to 4,361.',focus:[CX-R-60,CY-R-60,2*R+120,2*R+110],pause:true,setup(sim){BioLab.setValues(sim,{mol:'pBR322',e1:'EcoRI',e2:'none'});restart(sim,true);}},
    {title:'Genes on the plasmid',text:'Colored arcs are features: <b>ori</b> lets the plasmid copy itself, and <b>ampR</b> and <b>tetR</b> make the bacterium resistant to ampicillin and tetracycline.',focus:[CX-R-60,CY-R-60,2*R+120,2*R+110],pause:true},
    {title:'Restriction sites',text:'Each tick is a site where an enzyme recognizes a short sequence and cuts. EcoRI recognizes GAATTC and cuts between the G and the A.',focus:[400,226,200,220],pause:true},
    {title:'Cut with two enzymes',text:'HindIII (29) and BamHI (375) each cut once. Watch the ring open into two pieces.',focus:[[CX-R-60,CY-R-60,2*R+120,2*R+110],[400,30,395,190]],speed:0.5,setup(sim){BioLab.setValues(sim,{e1:'HindIII',e2:'BamHI'});restart(sim,false);}},
    {title:'Pieces add up',text:'The short piece is 375 − 29 = 346 bp. The long piece is the rest of the ring: 4,361 − 346 = 4,015 bp.',focus:[400,30,395,190],pause:true},
    {title:'Check on a gel',text:'The predicted lane (D) is next to a ladder (L). Small pieces travel farther, so the 346 bp band is near the bottom.',focus:[612,214,184,232],pause:true},
    {lvl:'honors',title:'Clone a gene',text:'Open the plasmid with BamHI, cut the GFP gene with BamHI too, and the matching GATC overhangs pair. DNA ligase seals the backbone.',focus:[CX-R-60,CY-R-60,2*R+120,2*R+110],speed:0.6,setup(sim){BioLab.setValues(sim,{e1:'BamHI',e2:'none',insEnz:'BamHI'});restart(sim,false);tryClone(sim);}},
    {lvl:'ap',title:'Insertional inactivation',text:'The BamHI site is inside tetR, so the insert breaks that gene. Cells with the recombinant plasmid resist ampicillin but not tetracycline.',focus:[CX-R-60,CY-R-60,2*R+120,2*R+110],pause:true}
  ],
  onTourExit(sim){sim.st.clone=null;sim.st.lig=null;BioLab.setValues(sim,{mol:'pBR322',e1:'EcoRI',e2:'none',insEnz:'BamHI'});restart(sim,true);},
  lab:{bio:'<p><b>Question:</b> How do the number of cuts and the shape of the DNA set the number of fragments?</p><ol><li>Cut pBR322 with EcoRI, then BamHI, then both together. Record a trial for each.</li><li>Try an enzyme with no site in pBR322 and record it.</li></ol><p>Write a rule that predicts the number of fragments from the number of cuts in a circle.</p>',
       honors:'<p><b>Question:</b> Can you predict a digest before you run it?</p><ol><li>For pBR322, predict the fragments for HindIII + SalI, BamHI + PstI and EcoRI + PvuII using only the map positions.</li><li>Check each prediction with the tool and record trials.</li><li>Cut λ DNA with HindIII and compare 7 cuts in a line with 7 cuts in a circle.</li></ol><p>Explain why the fragments always add up to the starting length.</p>',
       ap:'<p><b>Question:</b> Which site would you clone into, and how would you find recombinant colonies?</p><ol><li>For each single-cut enzyme in pBR322, record whether an insert there leaves ampicillin and tetracycline resistance intact.</li><li>Choose a site that lets you select on one antibiotic and screen with the other.</li></ol><p><b>Claim–evidence–reasoning:</b> Design a replica-plating plan that identifies recombinant colonies, and explain each step.</p>'},
  terms:[{t:'Plasmid',d:'A small ring of DNA in bacteria, separate from the chromosome, that copies itself.'},{t:'Restriction enzyme',d:'A protein that cuts DNA at one specific short sequence.'},{t:'Restriction site',d:'The sequence an enzyme recognizes, such as GAATTC for EcoRI.'},{t:'Plasmid map',d:'A diagram of a plasmid that shows its genes and cut sites by position.'},
    {lvl:'honors',t:'Sticky ends',d:'Short single-stranded overhangs left by a staggered cut. Matching overhangs pair up.'},{lvl:'honors',t:'Blunt ends',d:'Ends with no overhang, left when an enzyme cuts straight across both strands.'},{lvl:'honors',t:'DNA ligase',d:'An enzyme that seals the sugar-phosphate backbone to join two pieces of DNA.'},{lvl:'honors',t:'Recombinant DNA',d:'DNA built from pieces of two different sources.'},
    {lvl:'ap',t:'Insertional inactivation',d:'Breaking a gene by inserting DNA inside it, used to tell recombinant plasmids from empty ones.'},{lvl:'ap',t:'Replica plating',d:'Copying colonies onto a second plate to test them under a different condition.'}],
  about:'<p>pBR322 positions are standard map coordinates (4,361 bp; EcoRI 4359, HindIII 29, EcoRV 185, BamHI 375, SalI 651, PvuII 2064, NdeI 2295, PstI 3609, ScaI 3844). λ HindIII, EcoRI and BamHI sites are the real ones, and they give the familiar ladder sizes.</p><p><b>pGLO positions are approximate</b>, drawn for teaching from the Bio-Rad map layout. Check exact numbers in ApE with the real sequence before you plan a real digest.</p><p>Simplifications: the gel lane uses a 1% gel run for 30 minutes at 100 V. An uncut plasmid is drawn as one supercoiled band, running like DNA about 70% of its size. Cloning always succeeds when the ends match; real ligations also make empty plasmids and multiple inserts.</p>',
  initVis(sim){},
  thumbSetup(sim){sim.p.e1='HindIII';sim.p.e2='BamHI';sim.st.anim=3.2;},thumbFrames:2,
  draw(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st,m=DNA[p.mol],d=dg(sim),a=s.anim;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const selCuts=new Set(d.cuts);
    if(m.circ){drawCircle(ctx,sim,m,d,a,k);}else{drawLinear(ctx,sim,m,d,a,k);}
    drawFragments(ctx,sim,m,d,a,k);drawEnds(ctx,sim,k);drawGel(ctx,sim,d,a,k);
    txt(ctx,m.name+(m.approx?' (positions approximate)':''),16,26,{s:14*k,w:700});
    txt(ctx,m.len.toLocaleString()+' bp '+(m.circ?'circle':'straight molecule'),16,44,{s:12*k,c:PAL['cv-soft']});}
};

/* ---------- helpers that need the sim ---------- */
function dg(sim){const p=sim.p;return digest(p.mol,p.e1,p.e2);}
function restart(sim){sim.st.anim=0;sim.st.clone=null;sim.st.lig=null;}
function resist(sim,gene){const p=sim.p,m=DNA[p.mol];if(!m.circ)return 'Not a plasmid';const f=m.feats.find(x=>x.n===gene);if(!f)return 'No '+gene+' gene on '+m.name;
  const cuts=cutsFor(p.mol,p.e1);if(cuts.length!==1)return 'Pick an enzyme that cuts once';const inside=cuts[0]>=f.from&&cuts[0]<=f.to;return inside?'Destroyed: '+p.e1+' cuts inside '+gene:'Kept: '+gene+' is untouched';}
function tryClone(sim){const p=sim.p,m=DNA[p.mol];const cuts=cutsFor(p.mol,p.e1);
  if(!m.circ||cuts.length!==1||p.e2!=='none'){sim.st.clone={fail:true,why:'one'};sim.st.lig={t:0};return;}
  const a=ENZ[p.e1],b=ENZ[p.insEnz];const ok=a.end==='blunt'?b.end==='blunt':(a.over===b.over&&a.end===b.end);
  sim.st.lig={t:0};sim.st.clone=ok?{pos:cuts[0],orient:Math.random()<0.5?1:-1}:{fail:true,why:'ends'};}

function drawCircle(ctx,sim,m,d,a,k){const p=sim.p,s=sim.st;const cutT=clamp(a,0,1),open=clamp(a-1,0,1);
  // backbone: draw as arcs between cuts; once cut, arcs separate slightly outward
  const segs=d.frags[0].uncut?[{from:0,to:m.len}]:d.frags;
  segs.forEach((f,i)=>{const mid=(f.from+f.to)/2,am=ang(mid,m.len),off=open*14;const ox=Math.cos(am)*off,oy=Math.sin(am)*off;
    const a0=ang(f.from,m.len)+(d.frags[0].uncut?0:0.025*open),a1=ang(f.to,m.len)-(d.frags[0].uncut?0:0.025*open);
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(CX+ox,CY+oy,R,a0,a1);ctx.stroke();
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(CX+ox,CY+oy,R-6,a0,a1);ctx.stroke();});
  // features
  m.feats.forEach(f=>{const a0=ang(f.from,m.len),a1=ang(f.to,m.len);ctx.strokeStyle=f.col;ctx.lineWidth=11;ctx.lineCap='butt';ctx.beginPath();ctx.arc(CX,CY,R-22,a0,a1);ctx.stroke();
    const am=(a0+a1)/2,lx=CX+Math.cos(am)*(R-50),ly=CY+Math.sin(am)*(R-50);txt(ctx,f.n,lx,ly,{s:12.5*k,w:700,c:PAL['cv-ink'],a:'center',b:'middle'});});
  // insert (cloned GFP)
  if(s.clone&&!s.clone.fail){const lt=s.lig?clamp(s.lig.t,0,1):1;const am=ang(s.clone.pos,m.len);const ix=CX+Math.cos(am)*(R+70*(1-lt)),iy=CY+Math.sin(am)*(R+70*(1-lt));
    ctx.strokeStyle='#1b8a4a';ctx.lineWidth=9;ctx.beginPath();ctx.arc(ix-Math.cos(am)*R,iy-Math.sin(am)*R,R,am-0.15,am+0.15);ctx.stroke();
    txt(ctx,'GFP insert'+(s.clone.orient>0?' →':' ←'),CX+Math.cos(am)*(R+24),CY+Math.sin(am)*(R+24)+(Math.sin(am)>0?14:-6),{s:12.5*k,w:700,c:PAL['s3'],a:Math.cos(am)>0.2?'left':Math.cos(am)<-0.2?'right':'center'});}
  if(s.clone&&s.clone.fail&&s.lig){const lt=clamp(s.lig.t,0,1.5);const am=ang(cutsFor(p.mol,p.e1)[0]||0,m.len);const bounce=Math.sin(lt*Math.PI*2)*10;
    const ix=CX+Math.cos(am)*(R+60+bounce),iy=CY+Math.sin(am)*(R+60+bounce);ctx.strokeStyle='#1b8a4a';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(ix-22,iy);ctx.lineTo(ix+22,iy);ctx.stroke();
    pill(ctx,'ends don’t match',ix,iy+18,'#d32f2f','#fff',11*k);}
  // sites
  const all=[];Object.keys(m.sites).forEach(e=>m.sites[e].forEach(pos=>all.push({e,pos})));all.sort((x,y)=>x.pos-y.pos);
  const labs=[];
  all.forEach(st=>{const am=ang(st.pos,m.len),sel=(st.e===p.e1||st.e===p.e2);const c=Math.cos(am),sn=Math.sin(am);
    ctx.strokeStyle=sel?PAL['rj']:PAL['cv-soft'];ctx.lineWidth=sel?3:1.5;ctx.beginPath();ctx.moveTo(CX+c*(R-2),CY+sn*(R-2));ctx.lineTo(CX+c*(R+14),CY+sn*(R+14));ctx.stroke();
    if(sel&&a<1){const fl=0.5+0.5*Math.sin(a*20);ctx.fillStyle='rgba(193,20,48,'+(0.4*fl)+')';ctx.beginPath();ctx.arc(CX+c*R,CY+sn*R,10,0,6.29);ctx.fill();}
    labs.push({side:c>=0?'R':'L',x:CX+c*(R+22)+(c>=0?4:-4),y:CY+sn*(R+26),t:st.e+' '+st.pos,sel});});
  ['L','R'].forEach(side=>{const L=labs.filter(l=>l.side===side).sort((x,y)=>x.y-y.y);for(let i=1;i<L.length;i++){if(L[i].y-L[i-1].y<15*k)L[i].y=L[i-1].y+15*k;}
    L.forEach(l=>txt(ctx,l.t,l.x,l.y,{s:11.5*k,w:l.sel?700:400,c:l.sel?PAL['rj']:PAL['cv-soft'],a:side==='R'?'left':'right',b:'middle'}));});
  txt(ctx,'bp 1',CX,CY-R+22,{s:11*k,c:PAL['cv-soft'],a:'center'});}

function drawLinear(ctx,sim,m,d,a,k){const p=sim.p;const X0=30,X1=380,Y=228,sc=(X1-X0)/m.len;const open=clamp(a-1,0,1);
  d.frags.forEach((f,i)=>{const gap=open*6*i;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(X0+f.from*sc+gap,Y);ctx.lineTo(X0+f.to*sc+gap-1,Y);ctx.stroke();});
  let flip=0;Object.keys(m.sites).forEach(e=>m.sites[e].forEach(pos=>{const sel=e===p.e1||e===p.e2;const x=X0+pos*sc;ctx.strokeStyle=sel?PAL['rj']:PAL['cv-soft'];ctx.lineWidth=sel?2.5:1;ctx.beginPath();ctx.moveTo(x,Y-10);ctx.lineTo(x,Y+10);ctx.stroke();
    if(sel){flip++;txt(ctx,(pos/1000).toFixed(1)+'k',x,Y+(flip%2?-18:26),{s:11*k,c:PAL['rj'],a:'center',b:'middle'});}}));
  txt(ctx,'0',X0,Y+44,{s:11*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'48,502 bp',X1,Y+44,{s:11*k,c:PAL['cv-soft'],a:'center'});
  txt(ctx,'λ DNA is a straight molecule: n cuts make n + 1 pieces',X0,Y+80,{s:12.5*k,c:PAL['cv-ink']});}

function drawFragments(ctx,sim,m,d,a,k){const open=clamp(a-1,0,1);if(open<=0&&!d.frags[0].uncut){txt(ctx,'Cutting…',420,60,{s:13*k,c:PAL['cv-soft']});return;}
  const fr=d.frags.slice().sort((x,y)=>y.bp-x.bp).slice(0,8);const mx=m.len;const W=245;
  txt(ctx,'Fragments, largest first',420,48,{s:12.5*k,w:700,c:PAL['cv-soft']});
  const rowH=Math.min(20,150/fr.length);
  fr.forEach((f,i)=>{const y=70+i*rowH;const w=Math.max(4,W*f.bp/mx)*open;ctx.strokeStyle=f.uncut?PAL['cv-soft']:serColor(1);ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(420,y);ctx.lineTo(420+w,y);ctx.stroke();ctx.lineCap='butt';
    txt(ctx,f.bp.toLocaleString()+' bp'+(f.uncut?' (uncut ring)':''),Math.min(424+w+6,700),y,{s:12*k,b:'middle',c:PAL['cv-ink']});});
  if(d.frags.length>8)txt(ctx,'+ '+(d.frags.length-8)+' more',420,70+8*rowH,{s:11.5*k,c:PAL['cv-soft']});}

function drawEnds(ctx,sim,k){const p=sim.p,e=ENZ[p.e1];const X=412,Y=268;
  txt(ctx,p.e1+' cut site',X,Y-24,{s:12.5*k,w:700,c:PAL['cv-soft']});
  const top=e.site,bot=comp(e.site);const cw=16;const cutT=e.cut,cutB=6-e.cut;const sep=clamp(sim.st.anim-0.6,0,1)*12;
  ctx.font='700 '+(15*Math.min(k,1.3))+'px '+MONO;ctx.textBaseline='middle';ctx.textAlign='center';
  for(let i=0;i<6;i++){const leftTop=i<cutT,leftBot=i<cutB;ctx.fillStyle=PAL['cv-ink'];ctx.fillText(top[i],X+30+i*cw+(leftTop?-sep:sep),Y);ctx.fillStyle=PAL['cv-ink'];ctx.fillText(bot[i],X+30+i*cw+(leftBot?-sep:sep),Y+22);}
  ctx.fillStyle=PAL['cv-soft'];ctx.font=(11*k)+'px '+FONT;ctx.textAlign='left';ctx.fillText('5′',X,Y);ctx.fillText('3′',X,Y+22);ctx.textAlign='left';ctx.fillText('3′',X+30+6*cw+8,Y);ctx.fillText('5′',X+30+6*cw+8,Y+22);
  if(sep<2){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.beginPath();const xt=X+30+cutT*cw-cw/2,xb=X+30+cutB*cw-cw/2;ctx.moveTo(xt,Y-12);ctx.lineTo(xt,Y+11);ctx.lineTo(xb,Y+11);ctx.lineTo(xb,Y+34);ctx.stroke();}
  txt(ctx,e.end==='blunt'?'Blunt ends: no overhang':e.end+' ends: '+e.over+' overhang',X,Y+60,{s:12.5*k,w:600,c:e.end==='blunt'?PAL['cv-soft']:PAL['s3']});
  if(atLeast('honors')){const b=ENZ[p.insEnz];const ok=e.end==='blunt'?b.end==='blunt':(e.over===b.over&&e.end===b.end);
    txt(ctx,'Insert ('+p.insEnz+'): '+(ok?'ends match':'ends don’t match'),X,Y+84,{s:12*k,c:ok?PAL['s3']:PAL['s1']});}}

function drawGel(ctx,sim,d,a,k){const X=640,Y=226,W=140,H=210;const show=clamp(a-2,0,1);
  rr(ctx,X,Y,W,H,6);ctx.fillStyle='#1f2a36';ctx.fill();
  const yOf=bp=>Y+14+Math.min(H-20,K30*mob(bp)*PX);
  const lx=X+35,dx=X+100;ctx.fillStyle='#0d1218';ctx.fillRect(lx-18,Y+8,36,6);ctx.fillRect(dx-18,Y+8,36,6);
  txt(ctx,'L',lx,Y-8,{s:12.5*k,w:700,a:'center'});txt(ctx,'D',dx,Y-8,{s:12.5*k,w:700,a:'center'});
  LADDER.forEach(bp=>{const y=yOf(bp);ctx.fillStyle='rgba(255,236,190,.8)';ctx.fillRect(lx-16,y-1.5,32,3);});
  [10000,3000,1000,250].forEach(bp=>txt(ctx,bp>=1000?(bp/1000)+'k':String(bp),X-4,yOf(bp),{s:11*k,a:'right',b:'middle',c:PAL['cv-soft']}));
  if(show>0)d.frags.forEach(f=>{const eff=f.uncut?f.bp*0.7:f.bp;const y=yOf(eff);ctx.fillStyle='rgba(255,236,190,'+(0.9*show)+')';ctx.fillRect(dx-16,y-2,32,4);});
  txt(ctx,'Predicted gel (1%)',X+W/2,Y+H+14,{s:11.5*k,c:PAL['cv-soft'],a:'center'});}
const K30=0.00165*100*30,PX=33;

BioLab.register(PL);
})();
