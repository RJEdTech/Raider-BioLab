(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,lvText}=BioLab.h;

/* One replication fork in E. coli, slowed 100×.
   Positions are nucleotides (nt) from the origin. Time is real milliseconds; the sim shows 10 ms per second.
   Helicase moves the fork at 1 nt/ms (1,000 nt/s). The leading strand grows continuously toward the fork from one
   primer. On the lagging strand, primase lays a 4-nt RNA primer every 16 nt near the fork; DNA polymerase III extends
   it backward (5'→3') until it meets the previous fragment. DNA polymerase I then replaces that fragment's RNA primer
   with DNA, and ligase seals the remaining nick. */
const PL=4,FRAG=12,V=1,VPOL1=0.5,LIGT=2,MAXL=640,PX=10.5;
const BASES='ATGC',COMP={A:'T',T:'A',G:'C',C:'G'};
const BCOL={A:'#e07a2a',T:'#2f9e6a',G:'#3f6fb0',C:'#c9a227'};
const OLD='#5a6b8c',NEW='#d22d68',RNA='#e0a21a';
const YT=96,YTN=126,YB=354,YBN=324,YD1=212,YD2=238,TR=5;
const ease=t=>t*t*(3-2*t);
const cam=s=>Math.max(0,s.F-52);
const X=(s,pos)=>40+(pos-cam(s))*PX;
function yTop(s,pos){if(pos>=s.F)return YD1;return lerp(YD1,YT,ease(clamp((s.F-pos)/TR,0,1)));}
function yBot(s,pos){if(pos>=s.F)return YD2;return lerp(YD2,YB,ease(clamp((s.F-pos)/TR,0,1)));}
const sepT=(s,pos)=>ease(clamp((s.F-pos)/TR,0,1));
function lagDNA(s){let n=0;s.frags.forEach(f=>{n+=Math.max(0,(f.P-PL)-f.left)+f.rem;});return n;}
function leadDNA(s){return s.leadOn?Math.max(0,s.lead-PL):0;}
const nicks=s=>s.frags.filter(f=>f.rem>=PL&&!f.sealed).length;
const primers=s=>(s.leadOn?1:0)+s.frags.filter(f=>f.rem<PL).length;
function msGen(s){return Math.min(6,Math.floor(s.msT/20));}
function msFrac(g){if(g<=0)return {heavy:100,hybrid:0,light:0};const h=100*2/Math.pow(2,g);return {heavy:0,hybrid:h,light:100-h};}
function addNt(s,p,strand,lo,hi){const key=strand==='lead'?'aL':'aG';s[key]+=hi-lo;
  while(s[key]>=1){s[key]-=1;if(s.r()<1/30){const pos=strand==='lead'?Math.floor(hi)-1:Math.floor(lo);s.mm.push({strand,pos,t:s.t,fix:p.proof?s.t+0.8:null});if(!p.proof)s.unfixed++;}}
  s.mm=s.mm.filter(m=>m.fix===null||s.t<m.fix+1.2);if(s.mm.length>40)s.mm.splice(0,s.mm.length-40);}
function blob(ctx,x,y,w,h,col,label,k){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,w/2,h/2,0,0,6.29);ctx.fill();
  if(label)txt(ctx,label,x,y+1,{s:Math.min(11*k,12.5),w:700,c:'#fff',a:'center',b:'middle'});}

const REP={
  id:'replication',hash:'replication',apUnit:6,order:0,tab:'DNA replication',kind:'Process walkthrough',next:['expression'],
  card:'Watch a replication fork copy DNA: helicase unzips, polymerase builds, and the lagging strand comes together in pieces.',
  title:'DNA replication at the fork',
  lede:{bio:'Before a cell divides, it copies all of its DNA. Watch helicase unzip the double helix and DNA polymerase build two new strands, one smoothly and one in pieces.',
        honors:'Follow every enzyme at the fork: helicase, single-strand binding proteins, primase, DNA polymerase III and I, and ligase. Knock one out and see what breaks.',
        ap:'Explain the leading/lagging asymmetry from 5′→3′ synthesis, quantify replication fidelity with and without proofreading, and test the semiconservative model the way Meselson and Stahl did.'},
  scale:'One replication fork in an E. coli chromosome, slowed about 100× (E. coli copies about 1,000 nucleotides per second). The view shows about 70 base pairs, roughly 24 nm of DNA.',
  timeScale:10,dtMax:0.25,prewarm:0,sampleDt:0.5,window:120,unit:'ms',timeLabel:'Real time',chChange:8,chReveal:80,
  clock(sim){return sim.p.mode==='ms'?'Generation '+msGen(sim.st)+' in ¹⁴N':'Real time '+sim.t.toFixed(0)+' ms';},
  controls:[
    {id:'mode',label:'View',type:'seg',def:'fork',lvl:'ap',options:[{v:'fork',l:'Replication fork'},{v:'ms',l:'Meselson–Stahl'}],onChange(sim){sim.st.msT=0;}},
    {id:'helicase',label:'Helicase working',help:'Unzips the double helix',type:'toggle',def:true,lvl:'bio'},
    {id:'ligase',label:'Ligase working',help:'Seals the gaps between fragments',type:'toggle',def:true,lvl:'bio'},
    {id:'primase',label:'Primase working',help:'Lays down the RNA primers that polymerase builds on',type:'toggle',def:true,lvl:'honors'},
    {id:'pol1',label:'DNA polymerase I working',help:'Replaces RNA primers with DNA',type:'toggle',def:true,lvl:'honors'},
    {id:'proof',label:'Proofreading',help:'DNA polymerase checks each new base and removes mistakes',type:'toggle',def:true,lvl:'honors'},
    {id:'compare',label:'Show the other two models',help:'Conservative and dispersive predictions (Meselson–Stahl view)',type:'toggle',def:false,lvl:'ap'}
  ],
  init(sim){const p=sim.p,r=rng(7);let seq='';for(let i=0;i<MAXL+120;i++)seq+=BASES[Math.floor(r()*4)];
    return {seq,F:6,speed:0,lead:PL,leadOn:!!p.primase,frags:[],lastP:0,mm:[],aL:0,aG:0,unfixed:0,r:rng(11),t:0,msT:0,primeT:-99};},
  step(sim,dt){const s=sim.st,p=sim.p;s.t+=dt;
    if(p.mode==='ms'){s.msT+=dt;s.speed=0;return;}
    const F0=s.F;
    if(p.helicase&&s.F<MAXL){const synth=Math.max(s.leadOn?s.lead:0,s.frags.length?s.frags[s.frags.length-1].P:0);s.F=Math.min(MAXL,synth+30,s.F+V*dt);if(s.F<F0)s.F=F0;}
    s.speed=(s.F-F0)/dt*1000;
    if(s.leadOn){const nl=Math.min(s.F-2,s.lead+V*dt);if(nl>s.lead){addNt(s,p,'lead',s.lead,nl);s.lead=nl;}}
    if(p.primase&&s.F-s.lastP>=FRAG+PL&&s.F<MAXL-2){const P=Math.floor(s.F-1);s.frags.push({P,left:P-PL,rem:0,sealT:0,sealed:false});s.lastP=P;s.primeT=s.t;}
    s.frags.forEach((f,i)=>{const B=i===0?0:s.frags[i-1].P;
      if(f.left>B){const nl=Math.max(B,f.left-V*dt);addNt(s,p,'lag',nl,f.left);f.left=nl;}
      if(i>0&&f.left<=B){const pv=s.frags[i-1];if(p.pol1&&pv.rem<PL)pv.rem=Math.min(PL,pv.rem+VPOL1*dt);
        if(pv.rem>=PL&&!pv.sealed&&p.ligase){pv.sealT+=dt;if(pv.sealT>=LIGT)pv.sealed=true;}}});},
  metrics:[
    {id:'newnt',label:'New DNA made',unit:'nucleotides',lvl:'bio',min:0,max:null,d:0,get:s=>leadDNA(s.st)+lagDNA(s.st)},
    {id:'frags',label:'Okazaki fragments started',unit:'',lvl:'bio',min:0,max:50,d:0,get:s=>s.st.frags.length},
    {id:'nicks',label:'Unsealed gaps (nicks)',unit:'',lvl:'bio',min:0,max:10,d:0,get:s=>nicks(s.st)},
    {id:'speed',label:'Fork speed',unit:'nt/s',lvl:'bio',min:0,max:1200,d:0,get:s=>s.st.speed},
    {id:'lead',label:'Leading strand',unit:'nt',lvl:'honors',min:0,max:null,d:0,get:s=>leadDNA(s.st)},
    {id:'lag',label:'Lagging strand',unit:'nt of DNA',lvl:'honors',min:0,max:null,d:0,get:s=>lagDNA(s.st)},
    {id:'primers',label:'RNA primers still in place',unit:'',lvl:'honors',min:0,max:20,d:0,get:s=>primers(s.st)},
    {id:'errors',label:'Expected errors per genome copy',unit:'mistakes',lvl:'honors',min:0,max:50,d:2,get:s=>s.p.proof?0.46:46},
    {id:'gen',label:'Generations in ¹⁴N',unit:'',lvl:'ap',min:0,max:6,d:0,get:s=>msGen(s.st)},
    {id:'heavy',label:'Heavy DNA (¹⁵N/¹⁵N)',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>msFrac(msGen(s.st)).heavy},
    {id:'hybrid',label:'Hybrid DNA (¹⁵N/¹⁴N)',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>msFrac(msGen(s.st)).hybrid},
    {id:'light',label:'Light DNA (¹⁴N/¹⁴N)',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>msFrac(msGen(s.st)).light}
  ],
  graphs:[{id:'newnt',label:'New DNA made',lines:['newnt']},{id:'strands',label:'Leading vs. lagging strand',lvl:'honors',lines:['lead','lag']},
    {id:'nicks',label:'Unsealed gaps (nicks)',lines:['nicks']},{id:'bands',label:'Meselson–Stahl band amounts',lvl:'ap',custom:true}],
  defaultGraph:'newnt',
  plot(sim,ctx,box){const f=msFrac(msGen(sim.st));const ax=BioLab.h.axes(ctx,box,{xmin:0,xmax:3,ymin:0,ymax:100,xcats:['Heavy','Hybrid','Light'],yl:'% of DNA (generation '+msGen(sim.st)+')'});
    bars(ctx,ax,[f.heavy,f.hybrid,f.light],{colors:[OLD,'#9b5fa8',NEW],d:0});},
  narrate(sim){const s=sim.st,p=sim.p,hon=atLeast('honors');
    if(p.mode==='ms'){const g=msGen(s);
      if(g===0)return '<b>Generation 0:</b> the bacteria grew for many generations in heavy nitrogen (¹⁵N), so all their DNA is heavy and forms one band low in the tube.';
      if(g===1)return '<b>Generation 1:</b> one band, halfway between heavy and light. Every new DNA molecule kept one heavy original strand and built one light new strand.';
      return '<b>Generation '+g+':</b> '+Math.round(msFrac(g).hybrid)+'% hybrid and '+Math.round(msFrac(g).light)+'% light. The two original heavy strands are still out there, each paired with a new light partner.';}
    if(!p.helicase)return '<b>Helicase is knocked out</b>, so the double helix can’t be unzipped. With no single strands to read, copying stops at the fork.';
    if(!s.leadOn&&!p.primase)return '<b>Primase is knocked out.</b> DNA polymerase can only add to an existing strand, so with no RNA primer it can’t start. The fork unzips a little and stalls.';
    if(s.F>=MAXL)return 'This stretch has been copied. In a real cell the fork keeps going until it meets the fork coming the other way around the circular chromosome.';
    if(!p.primase)return '<b>Primase is off.</b> The leading strand keeps growing from its one primer, but no new Okazaki fragments can start on the lagging strand.';
    if(hon&&!p.pol1&&primers(s)>1)return '<b>DNA polymerase I is knocked out</b>, so the RNA primers ('+primers(s)+' of them) are never swapped for DNA, and ligase can’t join the fragments.';
    if(!p.ligase&&nicks(s)>0)return '<b>Ligase is knocked out.</b> The fragments are built but stay unjoined, leaving '+nicks(s)+' nick'+(nicks(s)===1?'':'s')+' in the lagging strand.';
    if(hon&&!p.proof)return '<b>Proofreading is off.</b> Wrong bases (red ✕) stay in the new strand. That raises the error rate about 100×, to roughly 46 mistakes per genome copy.';
    if(s.t-s.primeT<5)return hon?'<b>Primase just laid an RNA primer</b> near the fork. DNA polymerase III will extend it backward, away from the fork, to make the next Okazaki fragment.':'<b>A new piece just started</b> on the top strand. Polymerase builds it backward, away from the fork.';
    return hon?'Helicase unzips the helix at 1,000 nt/s. DNA polymerase III builds only 5′→3′, so the leading strand grows smoothly toward the fork while the lagging strand is made in short pieces going the other way.':
      'Helicase unzips the DNA. DNA polymerase builds the bottom new strand smoothly toward the fork, but the top new strand has to be built in short pieces, going away from the fork.';},
  tour:[
    {title:'Where we are',text:{bio:'This is one spot on a bacterial chromosome where DNA is being copied. The original double helix (slate) comes in from the right and is unzipped at the fork.',honors:'One replication fork on the E. coli chromosome. The parental double helix (slate) enters from the right; the two separated strands are templates for new DNA (pink).'},focus:[0,40,800,370],speed:0.25},
    {title:'Helicase unzips the helix',text:{bio:'Helicase (purple ring) uses energy from ATP to break the hydrogen bonds between base pairs, pulling the two strands apart.',honors:'Helicase uses ATP to break the hydrogen bonds between base pairs. Ahead of it, topoisomerase relieves the twisting strain, and single-strand binding proteins (small circles) keep the exposed strands apart.'},focus(sim){const x=X(sim.st,sim.st.F);return [x-45,160,150,125];},speed:0.15},
    {title:'The leading strand',text:{bio:'On the bottom, DNA polymerase builds the new strand smoothly, following right behind the fork.',honors:'DNA polymerase III can only add nucleotides to a 3′ end, so it builds 5′→3′. On the bottom template that direction points toward the fork, so this leading strand is made continuously from a single primer.'},focus:[0,290,800,95],speed:0.25},
    {title:'The lagging strand',text:{bio:'On the top, the new strand has to be built in the opposite direction, away from the fork. So it is made in short pieces, called Okazaki fragments.',honors:'On the top template, 5′→3′ points away from the fork. Polymerase can only build backward from each new opening, so the lagging strand is made in short Okazaki fragments (about 1,000–2,000 nt in bacteria).'},focus:[0,55,800,110],speed:0.25},
    {lvl:'honors',title:'Primase starts each fragment',text:'DNA polymerase can’t start a strand from nothing. Primase lays a short RNA primer (amber), and polymerase III extends it. Watch a new primer appear near the fork every few moments.',focus(sim){const x=X(sim.st,sim.st.F);return [Math.max(0,x-200),55,240,110];},speed:0.2},
    {title:'Joining the pieces',text:{bio:'Another polymerase swaps the RNA starter pieces for DNA, and ligase glues the fragments into one continuous strand.',honors:'DNA polymerase I removes each RNA primer and replaces it with DNA. That leaves a nick in the backbone, which DNA ligase seals to make one continuous strand.'},focus:[0,55,800,110],speed:0.4},
    {title:'Half old, half new',text:'Each new double helix has one original strand (slate) and one new strand (pink). This is called semiconservative replication.',focus:[0,40,800,370],speed:0.6},
    {lvl:'ap',title:'Meselson and Stahl’s test',text:'In 1958, Meselson and Stahl grew E. coli in heavy ¹⁵N, then moved them to light ¹⁴N. After one generation all the DNA had one intermediate density, which ruled out conservative replication. After two, half was hybrid and half light, which ruled out dispersive.',focus:[430,40,370,380],speed:1,setup(sim){BioLab.setValues(sim,{mode:'ms'});sim.st.msT=0;}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'fork'});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'Watch the top strand. How is its new DNA made?',choices:['In one continuous piece, like the bottom strand','In short pieces that are joined later','It isn’t copied at all'],correct:1,
     changeText:'Keep watching the top strand',watch:'frags',
     explain:{bio:'DNA polymerase can only build in one direction. On the top strand that direction points away from the fork, so the new strand is made in short pieces (Okazaki fragments) that are joined afterward.',
              honors:'DNA polymerase adds nucleotides only to a 3′ end (5′→3′ synthesis). On the lagging template that runs away from the fork, so each fragment must start fresh from a new primer near the fork.'}},
    {lvl:'bio',q:'Ligase is knocked out. What happens to the new top strand?',choices:['Copying stops completely','The pieces are made but stay unconnected, leaving gaps','Nothing changes'],correct:1,
     change:{ligase:false},changeText:'Ligase knocked out',watch:'nicks',
     explain:{bio:'Ligase is the glue. Without it, polymerase still builds every piece, but the pieces are never sealed together, so gaps (nicks) build up in the strand.',
              honors:'Without ligase, the phosphodiester bond between adjacent Okazaki fragments never forms. Fragments accumulate with nicks between them, and the lagging strand stays in pieces.'}},
    {lvl:'bio',q:'Helicase is knocked out. What happens to copying?',choices:['It speeds up','It stops, because the strands can’t be separated','Only the top strand keeps copying'],correct:1,
     change:{helicase:false},changeText:'Helicase knocked out',watch:'newnt',
     explain:'Polymerase can only read a single, unzipped strand. With no helicase to separate the strands, the fork stops moving and no more new DNA is made.'},
    {lvl:'honors',q:'Primase is missing from the start. What happens?',choices:['Only the lagging strand is affected','Neither strand can start, so no new DNA is made','Replication runs normally'],correct:1,
     baseline:{primase:false},changeText:'Watching a fork with no primase',watch:'newnt',
     explain:'DNA polymerase can only extend an existing strand; it can’t start one. Both strands need an RNA primer to begin, so without primase no new DNA is made and the fork stalls.'},
    {lvl:'honors',q:'DNA polymerase I is knocked out. What is left in the lagging strand?',choices:['Nothing unusual','RNA primers that are never replaced, so the fragments can’t be sealed','Extra DNA'],correct:1,
     change:{pol1:false},changeText:'DNA polymerase I knocked out',watch:'primers',
     explain:'Polymerase I removes RNA primers and fills the space with DNA. Without it, each fragment keeps its RNA primer, and ligase can only join DNA to DNA, so the fragments stay separate.'},
    {lvl:'honors',q:'Proofreading is turned off. What happens to errors in the copied genome?',choices:['About the same','About 100 times more errors','Errors drop to zero'],correct:1,
     change:{proof:false},changeText:'Proofreading off',watch:'errors',
     explain:'DNA polymerase III picks the wrong base about once in 100,000 nucleotides. Proofreading catches about 99% of those, bringing it to about 1 in 10 million. Without it, a 4.6-million-bp E. coli genome copy picks up about 46 mistakes instead of fewer than one.'},
    {lvl:'ap',q:'E. coli grown in heavy ¹⁵N are moved to light ¹⁴N. After two generations, which bands appear in the density gradient?',choices:['One heavy band and one light band','A hybrid band and a light band, in equal amounts','A single band of intermediate density'],correct:1,
     baseline:{mode:'ms'},changeText:'Two generations in ¹⁴N',watch:'bands',reveal:45,
     explain:'Semiconservative replication keeps the two original heavy strands; each pairs with a new light strand. After two generations, 2 of 4 molecules are hybrid and 2 are light. One heavy plus one light would mean conservative replication; one intermediate band would mean dispersive.'},
    {lvl:'ap',instant:true,q:'After ONE generation in ¹⁴N, Meselson and Stahl saw a single band at intermediate density. Which model did that result rule out?',choices:['Semiconservative','Conservative','Dispersive'],correct:1,
     explain:'Conservative replication predicts one heavy band plus one light band after one generation. A single hybrid band rules it out. It took the second generation (hybrid + light, not one band drifting lighter) to rule out dispersive.'}
  ],
  lab:{bio:'<p><b>Question:</b> What does each enzyme do at the replication fork?</p><ol><li>Press Reset and let the fork run for about 100 ms. Record a trial.</li><li>Reset, knock out helicase, and record a trial at about 100 ms.</li><li>Do the same with ligase knocked out.</li></ol><p>Compare new DNA made and unsealed gaps. Explain what each enzyme’s job must be.</p>',
       honors:'<p><b>Question:</b> Which enzymes are needed for the leading strand, and which only for the lagging strand?</p><ol><li>Record a normal trial at about 100 ms.</li><li>Record trials with primase, polymerase I and ligase knocked out (one at a time, pressing Reset in between).</li></ol><p>Use the leading and lagging strand lengths, primers and nicks to sort the enzymes into two groups, and explain the pattern.</p>',
       ap:'<p><b>Question:</b> How do the Meselson–Stahl results distinguish the three models of replication?</p><ol><li>Switch to the Meselson–Stahl view and turn on “Show the other two models.”</li><li>Record band percentages at generations 0, 1, 2 and 3.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain which generation rules out each alternative model, and why generation 1 alone is not enough.</p>'},
  terms:[{t:'Replication fork',d:'The Y-shaped spot where the double helix is being unzipped and copied.'},{t:'Helicase',d:'Enzyme that unzips DNA by breaking hydrogen bonds between bases.'},{t:'DNA polymerase',d:'Enzyme that builds a new strand by matching nucleotides to the template.'},{t:'Ligase',d:'Enzyme that seals gaps in the DNA backbone.'},{t:'Semiconservative',d:'Each new DNA molecule keeps one original strand and gets one new strand.'},
    {lvl:'honors',t:'Leading strand',d:'New strand made continuously toward the fork.'},{lvl:'honors',t:'Lagging strand',d:'New strand made in pieces, away from the fork.'},{lvl:'honors',t:'Okazaki fragment',d:'A short piece of the lagging strand, about 1,000–2,000 nt in bacteria.'},{lvl:'honors',t:'Primase / RNA primer',d:'Primase makes a short RNA starter that DNA polymerase extends.'},{lvl:'honors',t:'5′→3′',d:'DNA polymerase can only add to the 3′ end of a strand, so new DNA always grows 5′→3′.'},
    {lvl:'ap',t:'Proofreading',d:'DNA polymerase’s 3′→5′ exonuclease removes a wrong base right after adding it.'},{lvl:'ap',t:'Meselson–Stahl experiment',d:'1958 density-gradient experiment with ¹⁵N/¹⁴N that confirmed semiconservative replication.'}],
  about:'<p>Positions are counted in nucleotides from the origin. Helicase moves the fork at 1 nt/ms (E. coli’s real rate is about 1,000 nt/s), shown 100× slower. Polymerase III extends at the same rate. Primase lays a 4-nt primer every 16 nt on the lagging strand. Real primers are about 10 nt and real bacterial Okazaki fragments are 1,000–2,000 nt, so fragments here are shortened about 100× to fit on screen.</p><p>Polymerase I replaces primers at 0.5 nt/ms, and ligase seals a nick 2 ms after the primer is gone. Without primase the fork can run about 30 nt ahead of any synthesis before stalling. The leading-strand primer at the origin is left in place; in a real cell the fork coming from the other direction handles it.</p><p>Mismatches (red ✕) are shown about 3,000× more often than real so they can be seen. The genome error estimate uses real rates: about 10⁻⁵ errors per nucleotide without proofreading, 10⁻⁷ with it (before mismatch repair), for a 4.6-million-bp genome.</p><p>Meselson–Stahl fractions are exact for semiconservative replication: after g generations, 2/2ᵍ of the molecules are hybrid.</p>',
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='ms'){drawMS(sim,ctx,k);return;}
    const lo=Math.max(0,Math.floor(cam(s))-1),hi=lo+76;
    // coverage of new strands
    const cov=(pos,arr)=>arr[pos-lo];const top=new Array(hi-lo+1).fill(0),bot=new Array(hi-lo+1).fill(0);
    s.frags.forEach(f=>{for(let q=Math.max(lo,Math.ceil(f.left));q<Math.min(hi+1,f.P);q++){top[q-lo]=(q>=f.P-PL&&q<f.P-f.rem)?2:1;}});
    if(s.leadOn)for(let q=lo;q<=hi;q++){if(q<PL)bot[q-lo]=2;else if(q<s.lead)bot[q-lo]=1;}
    // labels
    txt(ctx,lvText({bio:'Top strand: new DNA made in short pieces',honors:'Lagging strand: Okazaki fragments, built away from the fork'}),16,30,{s:13*k,w:700,c:PAL['cv-soft']});
    txt(ctx,lvText({bio:'Bottom strand: new DNA made in one smooth piece',honors:'Leading strand: built continuously toward the fork'}),16,420,{s:13*k,w:700,c:PAL['cv-soft']});
    // rungs
    for(let q=lo;q<=hi;q++){const x=X(s,q)+PX/2;if(x<4||x>796)continue;const b=s.seq[q],c=COMP[b];
      if(q>=s.F){const mid=(YD1+YD2)/2;ctx.fillStyle=BCOL[b];ctx.fillRect(x-2,YD1+2,4,mid-YD1-2);ctx.fillStyle=BCOL[c];ctx.fillRect(x-2,mid,4,YD2-mid-2);continue;}
      const yt=yTop(s,q),yb=yBot(s,q),st=sepT(s,q),gap=28*st;
      const mmT=s.mm.find(m=>m.strand==='lag'&&m.pos===q),mmB=s.mm.find(m=>m.strand==='lead'&&m.pos===q);
      if(cov(q,top)){ctx.fillStyle=BCOL[b];ctx.fillRect(x-2,yt+2,4,gap/2);ctx.fillStyle=mmT?'#e53935':BCOL[c];ctx.fillRect(x-2,yt+2+gap/2,4,gap/2-1);}
      else{ctx.fillStyle=BCOL[b];ctx.fillRect(x-2,yt+2,4,11*st+1);}
      if(cov(q,bot)){ctx.fillStyle=BCOL[c];ctx.fillRect(x-2,yb-2-gap/2,4,gap/2);ctx.fillStyle=mmB?'#e53935':BCOL[b];ctx.fillRect(x-2,yb-1-gap,4,gap/2-1);}
      else{ctx.fillStyle=BCOL[c];ctx.fillRect(x-2,yb-2-(11*st+1),4,11*st+1);}
      [[mmT,yt+gap*0.75],[mmB,yb-gap*0.75]].forEach(([m,y])=>{if(!m)return;const fixed=m.fix!==null&&s.t>=m.fix;ctx.strokeStyle=fixed?'#2f9e6a':'#e53935';ctx.lineWidth=2.4;ctx.beginPath();
        if(fixed){ctx.arc(x,y,7,0,6.29);}else{ctx.moveTo(x-5,y-5);ctx.lineTo(x+5,y+5);ctx.moveTo(x+5,y-5);ctx.lineTo(x-5,y+5);}ctx.stroke();});}
    // template backbones
    const path=(fy)=>{ctx.beginPath();for(let q=lo;q<=hi+1;q++){const x=X(s,q),y=fy(q);q===lo?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();};
    ctx.strokeStyle=OLD;ctx.lineWidth=4;ctx.lineCap='round';path(q=>yTop(s,q));path(q=>yBot(s,q));
    // new strands: segment per nucleotide
    const seg=(q,y,kind)=>{ctx.strokeStyle=kind===2?RNA:NEW;ctx.lineWidth=kind===2?5:4;ctx.beginPath();ctx.moveTo(X(s,q),y);ctx.lineTo(X(s,q+1),y);ctx.stroke();};
    for(let q=lo;q<=hi;q++){if(top[q-lo])seg(q,yTop(s,q)+30*sepT(s,q),top[q-lo]);if(bot[q-lo])seg(q,yBot(s,q)-30*sepT(s,q),bot[q-lo]);}
    // nicks
    let nickLabeled=false;s.frags.forEach(f=>{if(f.rem>=PL&&!f.sealed){const q=f.P-PL;if(q<lo||q>hi)return;const x=X(s,q);ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(x-2,YTN-5,4,10);
      ctx.strokeStyle='#e53935';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,YTN-10);ctx.lineTo(x,YTN+10);ctx.stroke();if(!nickLabeled){nickLabeled=true;txt(ctx,'nick',x,YTN+24,{s:12*k,w:700,c:'#e53935',a:'center'});}}});
    // single-strand binding proteins
    if(hon){ctx.fillStyle=PAL['card2'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;
      for(let q=lo;q<s.F-1;q++){if(q%3)continue;const x=X(s,q)+PX/2;if(x<10||x>790)continue;
        if(!cov(q,top)&&sepT(s,q)>0.6){ctx.beginPath();ctx.arc(x,yTop(s,q)+17,4.5,0,6.29);ctx.fill();ctx.stroke();}
        if(!cov(q,bot)&&sepT(s,q)>0.6){ctx.beginPath();ctx.arc(x,yBot(s,q)-17,4.5,0,6.29);ctx.fill();ctx.stroke();}}}
    // proteins
    const xF=X(s,s.F),lab=(t_,x,y)=>txt(ctx,t_,x,y,{s:12*k,w:700,c:PAL['cv-ink'],a:'center'});
    if(hon&&xF+95<785){blob(ctx,xF+95,225,30,30,'#2a8276','',k);lab('Topoisomerase',xF+95,268);}
    ctx.save();ctx.translate(xF+2,225);ctx.rotate(RM?0:t*1.5);ctx.fillStyle=p.helicase?'#7a4fa6':'#9a9aa2';ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.lineTo(Math.cos(a)*21,Math.sin(a)*21);}ctx.closePath();ctx.fill();
    ctx.fillStyle=PAL['cv-bg'];ctx.beginPath();ctx.arc(0,0,7,0,6.29);ctx.fill();ctx.restore();if(xF<730)txt(ctx,'Helicase',xF+24,203,{s:12*k,w:700,c:PAL['cv-ink']});
    if(!p.helicase)pill(ctx,'Helicase knocked out',Math.min(700,xF+10),180,'#d32f2f','#fff',12*k);
    if(!s.leadOn&&!p.primase)pill(ctx,'No primers: polymerase can’t start',400,250,'#d32f2f','#fff',12*k);
    if(s.t-s.primeT<6&&p.primase){const x=X(s,s.lastP-2);blob(ctx,x,YTN+3,28,20,'#b86e00','',k);lab('Primase',x,172);}
    const polName=hon?'Pol III':'DNA pol';
    if(s.leadOn&&s.lead<MAXL-3&&X(s,s.lead)<795)blob(ctx,X(s,s.lead),YBN,46*Math.min(1.25,k),24,'#2a8276',polName,k);
    s.frags.forEach((f,i)=>{const B=i===0?0:s.frags[i-1].P;if(f.left>B+0.01){const x=X(s,f.left);if(x>10&&x<790)blob(ctx,x,YTN,46*Math.min(1.25,k),24,'#2a8276',polName,k);}
      if(i>0&&f.left<=B){const pv=s.frags[i-1];if(pv.rem>0&&pv.rem<PL&&p.pol1){const x=X(s,pv.P-pv.rem);if(x>10&&x<790)blob(ctx,x,YTN,40*Math.min(1.25,k),24,'#3f6fb0',hon?'Pol I':'DNA pol',k);}
        if(pv.rem>=PL&&!pv.sealed&&p.ligase&&pv.sealT>0){const x=X(s,pv.P-PL);if(x>10&&x<790){blob(ctx,x,YTN,44*Math.min(1.25,k),24,'#cf8619','Ligase',k);}}}});
    // direction arrows
    const arrow=(x,y,dir)=>{ctx.strokeStyle=PAL['cv-soft'];ctx.fillStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-12*dir,y);ctx.lineTo(x+8*dir,y);ctx.stroke();ctx.beginPath();ctx.moveTo(x+12*dir,y);ctx.lineTo(x+4*dir,y-5);ctx.lineTo(x+4*dir,y+5);ctx.closePath();ctx.fill();};
    if(s.leadOn&&X(s,s.lead)+45<xF-10)arrow(X(s,s.lead)+40,YBN-24,1);
    s.frags.forEach((f,i)=>{const B=i===0?0:s.frags[i-1].P;if(f.left>B+0.5){const x=X(s,f.left)-34;if(x>30)arrow(x,YTN+26,-1);}});
    if(xF<730)txt(ctx,'fork moves →',xF+24,184,{s:12*k,c:PAL['cv-soft']});
    if(hon){const e=(s_,x,y)=>txt(ctx,s_,x,y,{s:12*k,w:700,c:PAL['cv-soft'],a:'center',b:'middle'});e('5′',20,YT);e('3′',20,YB);if(cam(s)<PL+2&&s.leadOn)e('5′',20,YBN);e('3′',788,YD1-12);e('5′',788,YD2+12);}
    // legend
    let lx=470;const ly=440,sw=(c,l,w)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(lx,ly-4);ctx.lineTo(lx+18,ly-4);ctx.stroke();txt(ctx,l,lx+24,ly,{s:12*k,c:PAL['cv-soft']});ctx.font='400 '+12*k+'px '+FONT;lx+=ctx.measureText(l).width+40;};
    sw(OLD,'original',4);sw(NEW,'new DNA',4);sw(RNA,'RNA primer',5);},
  thumbFrames:70
};
function drawMS(sim,ctx,k){const s=sim.st,p=sim.p,g=msGen(s),H=OLD,L=NEW;
  txt(ctx,'E. coli grown in heavy ¹⁵N, then moved to light ¹⁴N',16,28,{s:14*k,w:700});
  const mol=(x,y,a,b)=>{ctx.lineWidth=5;ctx.lineCap='round';ctx.strokeStyle=a;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+30,y);ctx.stroke();ctx.strokeStyle=b;ctx.beginPath();ctx.moveTo(x,y+10);ctx.lineTo(x+30,y+10);ctx.stroke();};
  const yRow=G=>70+G*88;
  if(!p.compare){txt(ctx,'DNA molecules (semiconservative)',16,54,{s:12.5*k,w:600,c:PAL['cv-soft']});
    for(let G=0;G<=Math.min(g,3);G++){const y=yRow(G);txt(ctx,'Gen '+G,16,y+22,{s:12.5*k,w:700});const n=Math.pow(2,G);
      for(let i=0;i<n;i++){const x=70+i*42;if(G===0)mol(x,y+8,H,H);else if(i<2)mol(x,y+8,H,L);else mol(x,y+8,L,L);}}}
  else{const models=[['Semiconservative','semi'],['Conservative','cons'],['Dispersive','disp']];txt(ctx,'Predicted bands for each model',16,54,{s:12.5*k,w:600,c:PAL['cv-soft']});
    models.forEach(([nm,id],r)=>{const y=80+r*112;txt(ctx,nm,16,y,{s:12.5*k,w:700});for(let G=0;G<=3;G++){const x=30+G*92;tube(ctx,x,y+8,22,82,predict(id,G),k,G);}});}
  for(let G=0;G<=Math.min(g,4);G++){const x=470+G*66;tube(ctx,x,58,34,300,predict('semi',G),k,G,true);}
  const lab=(t_,y)=>txt(ctx,t_,796,y,{s:12*k,c:PAL['cv-soft'],a:'right'});lab('light',58+300*0.38);lab('hybrid',58+300*0.55);lab('heavy',58+300*0.72);
  txt(ctx,'Observed density gradient',470,392,{s:12.5*k,w:600,c:PAL['cv-soft']});}
function predict(model,G){if(model==='semi'){const f=msFrac(G);return [[0.72,f.heavy],[0.55,f.hybrid],[0.38,f.light]];}
  if(model==='cons'){if(G===0)return [[0.72,100]];const hv=100/Math.pow(2,G);return [[0.72,hv],[0.38,100-hv]];}
  const frac=1/Math.pow(2,G);return [[0.38+0.34*frac,100]];}
function tube(ctx,x,y,w,h,bandsList,k,G,label){ctx.fillStyle=PAL['cv-water'];rr(ctx,x,y,w,h,w/2);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;rr(ctx,x,y,w,h,w/2);ctx.stroke();
  bandsList.forEach(([pos,amt])=>{if(amt<=0)return;const th=2+10*amt/100;ctx.fillStyle='#e0a21a';ctx.globalAlpha=0.35+0.65*amt/100;ctx.fillRect(x+3,y+h*pos-th/2,w-6,th);ctx.globalAlpha=1;});
  txt(ctx,(label?'Gen ':'')+G,x+w/2,y+h+16,{s:12*k,w:600,c:PAL['cv-ink'],a:'center'});}
BioLab.register(REP);
})();
