/* Learn it for the spring 2027 BioLab tools (added Nov 14, 2026). Same format as learn.js. */
(function(){
'use strict';
const H=BioLab.h,PAL=H.PAL;
const RED='#c8102e',BLU='#1f5fbf',GRN='#1e7d3a';
function card(ctx,k,lines,x,y,w){
  const L=lines.map(l=>{const o=typeof l==='string'?[l]:l;const base=o[2]||12.5,wt=o[1]||500;let sz=base*Math.min(k,1.4);ctx.font=wt+' '+sz+'px '+H.FONT;const tw=ctx.measureText(o[0]).width;if(tw>w-18)sz=Math.max(base*Math.min(k,1.0)*0.8,sz*(w-18)/tw);return {t:o[0],sz,wt,c:o[3]||PAL['cv-ink']};});
  const lh=Math.max(...L.map(o=>o.sz))*1.38,h=8+L.length*lh;
  ctx.save();ctx.globalAlpha=0.97;H.rr(ctx,x,y,w,h,8);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=1.3;ctx.strokeStyle=PAL['cv-soft'];ctx.stroke();ctx.restore();
  L.forEach((o,j)=>H.txt(ctx,o.t,x+9,y+4+lh*0.78+j*lh,{s:o.sz,w:o.wt,c:o.c}));return h;}
const met=(sim,id)=>{const m=sim.def.metrics.find(x=>x.id===id);return m?m.get(sim):NaN;};
const f1=v=>Number.isFinite(v)?v.toFixed(1):'—',f2=v=>Number.isFinite(v)?v.toFixed(2):'—',f0=v=>Number.isFinite(v)?Math.round(v).toLocaleString('en-US'):'—';
const act=(sim,id)=>{const a=(sim.def.actions||[]).find(z=>z.id===id);if(a)a.run(sim);};
function actAt(sim,tau,id,at){const key='_ls_'+id;if(sim[key]===sim.lnT0)return;if(tau<(at||0))return;sim[key]=sim.lnT0;act(sim,id);}
const yr=sim=>2025+Math.min(75,Math.max(0,Math.floor(sim.t)));
const CL=(ctx,k,L)=>card(ctx,k,L,118,62,262);
const GX=(ctx,k,L)=>card(ctx,k,L,170,374,460);

BioLab.addLearn({
expression: {
  simple: true,
  intro: { bio: 'You’ll follow one gene from DNA to RNA to protein, then see what a one-letter change does.' },
  goals: {
    bio: ['How a gene’s DNA is copied into mRNA (transcription)', 'How a ribosome reads mRNA three bases at a time to build a protein (translation)', 'Why some mutations change nothing and others wreck the protein'],
    honors: ['Codons, the genetic code and the start and stop codons', 'Silent, missense, nonsense and frameshift mutations', 'How one base change causes sickle-cell disease'],
    ap: ['RNA processing: introns, exons, the 5′ cap and poly-A tail', 'Why deleting a whole codon is far less harmful than deleting one base', 'Reading frame and the redundancy of the code']
  },
  matters: 'Every protein in your body, from the hemoglobin carrying oxygen to the enzymes digesting lunch, is built from a gene this way. mRNA vaccines, insulin made by bacteria and genetic tests for inherited diseases all use it.',
  question: 'One wrong letter in a 24-letter gene. Will the protein change a little, a lot, or not at all?',
  startKey: 'dna', startRun: false,
  steps: [
    { key: 'dna', title: 'A gene is a stretch of DNA', set: { gene: 'demo', pos: 6, base: 'A', introns: false }, fresh: true, pause: true, run(sim){act(sim,'undo');act(sim,'replay');},
      see: 'Inside the nucleus: a short gene, two DNA strands, 24 base pairs. The top (coding) strand starts with ATG and ends with TAA.',
      why: 'DNA stays in the nucleus, so the cell makes a working copy that can travel: messenger RNA.',
      overlay(sim,ctx,LH,k){GX(ctx,k,[['A 24-base gene',700,13.5],'Starts ATG · ends TAA']);} },
    { key: 'tx', title: 'Transcription: DNA → mRNA', set: { gene: 'demo', pos: 6, base: 'A', introns: false }, speed: 1, run(sim){act(sim,'replay');},
      see: 'RNA polymerase (purple) unzips the DNA and slides along the template strand, adding one matching RNA base at a time.',
      why: 'A pairs with U (RNA uses U, not T), T with A, G with C. Copying DNA’s message into RNA, the same language, is <b>transcription</b>, like copying notes.',
      overlay(sim,ctx,LH,k){GX(ctx,k,[['Transcription',700,13.5,'#6b3fa0'],'A→U  T→A  G→C  C→G']);} },
    { key: 'tl', title: 'Translation: three bases, one amino acid', set: { gene: 'demo', pos: 6, base: 'A', introns: false }, speed: 1,
      see: 'A ribosome reads the mRNA three bases at a time; each triplet is a <b>codon</b>. A <b>tRNA</b> (transfer RNA) brings the matching amino acid, and the chain grows.',
      why: 'AUG is start (Met), CCG is Pro. 64 codons code 20 amino acids. Turning RNA’s language into protein’s is <b>translation</b>, like changing languages.',
      overlay(sim,ctx,LH,k){GX(ctx,k,[['Translation',700,13.5,GRN],'mRNA: '+String(met(sim,'mrna')||'')]);} },
    { key: 'protein', title: 'Stop: the protein is done', set: { gene: 'demo', pos: 6, base: 'A', introns: false }, speed: 1, overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'skip',0.8);GX(ctx,k,[['Protein: '+String(met(sim,'len'))+' amino acids',700,13.5],String(met(sim,'protein')||'')]);},
      see: 'At the stop codon UAA no tRNA fits. The ribosome lets go of the finished chain Met–Pro–Lys–Phe–Gly–Trp–His.',
      why: 'The order of bases set the order of amino acids, which decides how the protein folds and works.'},
    { key: 'silent', title: 'A change that changes nothing', set: { gene: 'demo', pos: 6, base: 'A', introns: false }, fresh: true, pause: true, run(sim){act(sim,'undo');},
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'sub',1);actAt(sim,tau,'skip',2.5);GX(ctx,k,[[tau<1?'Base 6: G…':'Base 6: G → A ('+String(met(sim,'mtype'))+')',700,13.5,RED],String(met(sim,'protein')||'')]);},
      see: 'Base 6 changes from G to A: CCG becomes CCA. The protein comes out the same.',
      why: 'CCA also codes for proline. A change in DNA is a <b>mutation</b>; most amino acids have several codons, so many mutations are silent.'},
    { key: 'nonsense', title: 'A change that stops it early', set: { gene: 'demo', pos: 18, base: 'A', introns: false }, fresh: true, pause: true, run(sim){act(sim,'undo');},
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'sub',1);actAt(sim,tau,'skip',2.5);GX(ctx,k,[[tau<1?'Base 18: G…':'Base 18: G → A ('+String(met(sim,'mtype'))+')',700,13.5,RED],String(met(sim,'protein')||'')]);},
      see: 'Base 18 changes from G to A: UGG (Trp) becomes UGA, a stop. The protein ends after 5 amino acids.',
      why: 'One base turned a codon into “stop”: a <b>nonsense</b> mutation, since the message stops making sense. A cut-short protein usually can’t work, as in some cystic fibrosis.'},
    { key: 'frame', title: 'One extra base scrambles the rest', set: { gene: 'demo', pos: 5, base: 'G', introns: false }, fresh: true, pause: true, run(sim){act(sim,'undo');},
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'ins',1);actAt(sim,tau,'skip',2.5);GX(ctx,k,[[tau<1?'Inserting a G…':'G inserted: '+String(met(sim,'mtype')),700,13.5,RED],String(met(sim,'protein')||'')]);},
      see: 'One G is inserted after base 5. Every later codon shifts: 7 amino acids change, and the stop is lost.',
      why: 'The ribosome reads fixed groups of three, so one extra base shifts every later group: a <b>frameshift</b>, usually the most damaging mutation.'},
    { key: 'sickle', lvl: 'honors', title: 'One base, one disease', set: { gene: 'hbb', pos: 20, base: 'T', introns: false }, fresh: true, pause: true, run(sim){act(sim,'undo');},
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'sub',1);actAt(sim,tau,'skip',2.5);GX(ctx,k,[[tau<1?'β-globin, codon 7: GAG…':'GAG → GTG: '+String(met(sim,'mtype')),700,13.5,RED],String(met(sim,'protein')||'')]);},
      see: 'The start of the β-globin gene. One A becomes T in codon 7: GAG (glutamic acid) becomes GTG (valine).',
      why: 'That swap makes hemoglobin stick together, bending red blood cells into sickles. A gene-editing therapy was approved in 2023.'},
    { key: 'inframe', lvl: 'ap', title: 'Delete a whole codon', set: { gene: 'demo', pos: 7, introns: false }, fresh: true, pause: true, run(sim){act(sim,'undo');},
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'delc',1);actAt(sim,tau,'skip',2.5);GX(ctx,k,[[tau<1?'Deleting codon 3…':String(met(sim,'mtype')),700,13.5,RED],String(met(sim,'protein')||'')]);},
      see: 'Three bases in a row (one codon, AAG = Lys) are deleted. The protein just loses Lys; the rest is unchanged.',
      why: 'Removing three bases keeps the reading frame. The common cystic fibrosis mutation ΔF508 works this way.'},
    { key: 'intron', lvl: 'ap', title: 'Introns are cut out', set: { gene: 'demo', pos: 6, base: 'A', introns: true }, fresh: true, speed: 1, run(sim){act(sim,'undo');act(sim,'replay');},
      see: 'The gene has an intron. The first RNA is 34 bases; splicing cuts it to 24 before it leaves the nucleus.',
      why: 'Spliceosomes remove introns and join exons, and the mRNA gets a cap and poly-A tail. Alternative splicing lets one gene make several proteins.',
      overlay(sim,ctx,LH,k){GX(ctx,k,[['RNA processing',700,13.5],String(met(sim,'proc')||'')]);} }
  ],
  useIt: [
    { do: 'Know what an mRNA vaccine does and doesn’t do.',
      why: 'It delivers mRNA that your ribosomes translate into one viral protein for your immune system to learn. mRNA never enters the nucleus and can’t change your DNA, and your cells break it down within days.' },
    { do: 'Put on sunscreen before long days outside.',
      why: 'UV light damages DNA bases. A damaged base copied wrong becomes a mutation, and mutations in genes that control cell division can lead to skin cancer.' },
    { do: 'If a relative has a genetic condition, ask a doctor about genetic counseling.', lvl: 'honors',
      why: 'Many inherited diseases come from a single changed base or codon in one gene. Tests can read those exact letters.' }
  ],
  tryIt: [
    { title: 'the reading-frame sentence (5 minutes)',
      steps: ['Write THE FAT CAT ATE THE RED RAT in three-letter words.', 'Change one letter (for example FAT → FAR). Read it again.', 'Now insert one extra letter after THE and regroup everything into threes.'],
      look: 'Changing one letter changes one word. Inserting one letter turns every word after it into nonsense, the same way a frameshift scrambles every codon after the mutation.' }
  ]
},
climate: {
  goals: {
    bio: ['How CO₂ and methane trap heat', 'What happens by 2100 if emissions keep growing', 'How many separate actions (“wedges”) it takes to stop the rise'],
    honors: ['Why holding emissions flat still raises CO₂ (the bathtub)', 'Methane: a strong, short-lived greenhouse gas', 'Comparing emission paths by 2100'],
    ap: ['Climate sensitivity and the range of projections', 'Ocean acidification from the same CO₂', 'Radiative forcing in W/m²']
  },
  matters: 'The warming you will live through depends on choices made in the next 25 years: how we make electricity, move around and farm. This model shows which choices bend the curve and by how much.',
  question: 'If the world kept its carbon emissions exactly where they are today, would the CO₂ in the air stop rising?',
  startKey: 'today', startRun: false,
  steps: [
    { key: 'today', title: 'Where we are now', set: { path: 'bau' }, fresh: true, pause: true, run(sim){act(sim,'clear');},
      see: '2025: the air holds 425 ppm of CO₂, up from 280, and Earth is about 1.3 °C warmer than in 1850.',
      why: 'The ground gives off infrared heat. CO₂ and methane absorb some and send part back down, like a blanket. More gas, thicker blanket.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['Year '+yr(sim),700,14],'CO₂: '+f0(met(sim,'co2'))+' ppm (was 280)',['Warming: +'+f1(met(sim,'warm'))+' °C',700,13,RED]]);} },
    { key: 'bau', title: 'Business as usual', set: { path: 'bau' }, speed: 1.4, run(sim){act(sim,'clear');},
      see: 'Emissions keep growing. By 2100, CO₂ reaches about 654 ppm and warming about 3.1 °C.',
      why: 'Emissions climb from 10 to about 22 billion tons of carbon a year. Each year adds more than oceans and forests take back.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['Year '+yr(sim),700,14],'CO₂: '+f0(met(sim,'co2'))+' ppm',['Warming: +'+f1(met(sim,'warm'))+' °C',700,13,RED]]);} },
    { key: 'one', title: 'One wedge', set: { path: 'bau', pick: 'wind' }, fresh: true, speed: 1.4, run(sim){act(sim,'clear');act(sim,'toggle');},
      see: 'One wedge: 2 million wind turbines replace coal. Emissions are 1.5 billion tons lower by 2100, but warming still reaches about 3.0 °C.',
      why: 'A wedge is one action that grows steadily. One helps, but no single fix is big enough.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['1 wedge: wind power',700,14],'Year '+yr(sim)+' · emissions '+f1(met(sim,'emis'))+' GtC/yr',['Warming: +'+f1(met(sim,'warm'))+' °C',700,13,RED]]);} },
    { key: 'eight', title: 'Eight wedges hold emissions flat', set: { path: 'bau' }, fresh: true, speed: 1.4, run(sim){act(sim,'clear');act(sim,'eight');},
      see: 'Eight wedges together hold emissions flat at 10 billion tons a year. Warming by 2100: about 2.4 °C instead of 3.1.',
      why: 'Many feasible actions add up. But notice the CO₂ line is still climbing.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['8 wedges',700,14,GRN],'Year '+yr(sim)+' · CO₂ '+f0(met(sim,'co2'))+' ppm',['Warming: +'+f1(met(sim,'warm'))+' °C',700,13,RED]]);} },
    { key: 'bathtub', lvl: 'honors', title: 'Flat isn’t enough: the bathtub', set: { path: 'flat' }, fresh: true, speed: 1.4, run(sim){act(sim,'clear');},
      see: 'Emissions held flat at 10 billion tons a year. CO₂ still rises from 425 to about 512 ppm.',
      why: 'Emissions are the faucet; oceans and forests the drain. The faucet runs about twice as fast, so the tub keeps filling until net zero.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['Emissions held flat',700,14],'Year '+yr(sim)+' · CO₂ '+f0(met(sim,'co2'))+' ppm','Still rising']);} },
    { key: 'netzero', title: 'Net zero by 2070', set: { path: 'netzero' }, fresh: true, speed: 1.4, run(sim){act(sim,'clear');},
      see: 'Net zero by 2070. CO₂ peaks, then drops to about 354 ppm by 2100. Warming levels off near 2 °C, ending near 1.7.',
      why: 'Once we add no more than nature removes, CO₂ slowly falls and temperature follows. This is the Paris Agreement path.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['Net zero by 2070',700,14,GRN],'Year '+yr(sim)+' · CO₂ '+f0(met(sim,'co2'))+' ppm',['Warming: +'+f1(met(sim,'warm'))+' °C',700,13]]);} },
    { key: 'methane', lvl: 'honors', title: 'Methane matters', set: { path: 'bau', ch4: 'low' }, fresh: true, speed: 1.4, run(sim){act(sim,'clear');},
      cause: { from: { ch4: 'today' }, delay: 1, label: 'Methane emissions' },
      see: 'Same CO₂, methane cut: warming by 2100 drops from about 3.1 °C to 2.9. Doubling methane: about 3.7.',
      why: 'Methane traps about 80 times as much heat as CO₂ over 20 years but lasts only about a decade, so fixing leaks pays off fast.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['Methane cut',700,14],'Year '+yr(sim),['Warming: +'+f1(met(sim,'warm'))+' °C',700,13,RED]]);} },
    { key: 'sens', lvl: 'ap', title: 'How sure are the numbers?', set: { path: 'bau', sens: 4.5 }, fresh: true, speed: 1.4, run(sim){act(sim,'clear');},
      cause: { from: { sens: 3 }, delay: 1, dur: 2, label: 'Climate sensitivity' },
      see: 'Sensitivity at 4.5 °C instead of 3: business as usual reaches about 4.7 °C by 2100. At 1.5 °C, about 1.6.',
      why: 'Clouds and feedbacks set the sensitivity and are the biggest uncertainty. Every value in the range gives real warming, and cuts help at every one.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['Sensitivity '+sim.p.sens.toFixed(1)+' °C',700,14],'Year '+yr(sim),['Warming: +'+f1(met(sim,'warm'))+' °C',700,13,RED]]);} },
    { key: 'ocean', lvl: 'ap', title: 'The other CO₂ problem', set: { path: 'bau' }, fresh: true, speed: 1.4, run(sim){act(sim,'clear');},
      see: 'Under business as usual, surface-ocean pH falls from about 8.05 to 7.85 by 2100.',
      why: 'The ocean absorbs about a quarter of our CO₂, making carbonic acid. 0.2 pH is about 60% more H⁺, which robs corals and oysters of carbonate.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['Year '+yr(sim),700,14],['Ocean pH: '+f2(met(sim,'ph'))+' (now 8.05)',700,13,BLU],'Sea level: +'+f0(met(sim,'sl'))+' cm']);} }
  ],
  useIt: [
    { do: 'Count the big three in your family’s footprint: driving, home heating and cooling, and electricity.',
      why: 'Those are where most household carbon comes from. Carpooling, a heat pump or better insulation, and efficient appliances are wedges you can be part of.' },
    { do: 'Look at how fast clean power is growing.',
      why: 'US power plants emitted more than a third less CO₂ in 2023 than in 2005, mostly from switching coal to wind, solar and gas. Colorado’s main utility has committed to cut its power-sector emissions about 80% by 2030 from 2005. Wedges are already happening.' },
    { do: 'Ask what an action does by 2050, not just today.', lvl: 'honors',
      why: 'Because CO₂ piles up, an action that grows over decades (like electric vehicles replacing gas cars) matters more than a one-time cut.' }
  ],
  tryIt: [
    { title: 'the bathtub model (10 minutes)',
      steps: ['Plug a sink partway so water drains slowly, and turn on the faucet a little faster than the drain.', 'Watch the water level for one minute. Then turn the faucet down so it matches the drain.', 'Finally turn the faucet lower than the drain.'],
      look: 'The level rises while the faucet beats the drain, holds steady when they match, and falls only when the faucet is lower. CO₂ in the air works the same way: holding emissions steady isn’t enough to stop the rise.' }
  ]
}
});
/* ---- Feb–Mar units: viruses, lightbulb energy, power grid (added Nov 14, 2026) ---- */
const VI=(ctx,k,L)=>card(ctx,k,L,262,40,200);
const HV=(ctx,k,L)=>card(ctx,k,L,330,40,136);
const EC=(ctx,k,L)=>card(ctx,k,L,470,318,310);
const GM=(ctx,k,L)=>card(ctx,k,L,270,60,300);
const mil=v=>!Number.isFinite(v)?'—':v>=1000?(v/1000).toFixed(1)+' billion/mL':v>=1?Math.round(v)+' million/mL':v>=0.001?Math.round(v*1000)+' thousand/mL':'almost none';

BioLab.addLearn({
virus: {
  goals: {
    bio: ['A virus can’t reproduce on its own; it takes over a cell', 'The lytic cycle: infect, copy, burst', 'How fast phage can wipe out a flask of bacteria'],
    honors: ['Lytic vs. lysogenic: a hidden prophage', 'How UV light wakes a prophage', 'Counting phage with a plaque assay and dilutions'],
    ap: ['HIV: reverse transcription and integration', 'Why one drug fails and a three-drug combo works', 'Mutation and selection inside one patient']
  },
  matters: 'Viruses cause the flu, COVID and HIV. Phage, the viruses that infect bacteria, are being used again to treat infections that antibiotics can no longer cure.',
  question: 'One phage lands on a flask holding hundreds of millions of bacteria. Can it really clear the whole flask, and how long would that take?',
  startKey: 'cycle', startRun: true,
  steps: [
    { key: 'cycle', title: 'The lytic cycle', set: { type: 'lytic' }, fresh: true, speed: 1,
      see: 'The cell steps through attachment, injection, replication, assembly and lysis. Red is phage DNA; blue is the cell’s.',
      why: 'The phage injects only DNA. The cell’s machinery builds about 100 new phage, then the cell bursts.',
      overlay(sim,ctx,LH,k){VI(ctx,k,[['Virulent phage (T4)',700,14],'Infect → copy → burst','~100 new phage per cell']);} },
    { key: 'flask', title: 'A whole flask', set: { type: 'lytic' }, fresh: true, speed: 4,
      see: 'Bacteria multiply and the flask clouds. Then phage explode, and it goes clear in about two hours.',
      why: 'Each burst releases about 100 phage, each ready to infect: exponential growth, faster than bacteria divide.',
      overlay(sim,ctx,LH,k){VI(ctx,k,[['Lytic phage',700,14],'Bacteria: '+mil(met(sim,'bac')),'Phage: '+mil(met(sim,'phg')),'Cloudiness: '+f0(met(sim,'cloud'))+'%']);} },
    { key: 'temp', title: 'A phage that hides', set: { type: 'temperate' }, fresh: true, speed: 4,
      see: 'A temperate phage. Most infections tuck phage DNA into the chromosome, and the flask stays cloudy.',
      why: 'In the <b>lysogenic cycle</b>, the prophage is copied quietly each time the cell divides.',
      overlay(sim,ctx,LH,k){VI(ctx,k,[['Temperate phage (λ)',700,14],'Bacteria: '+mil(met(sim,'bac')),'Hidden prophage: '+mil(met(sim,'lys')),'Cloudiness: '+f0(met(sim,'cloud'))+'%']);} },
    { key: 'uv', lvl: 'honors', title: 'Wake it with UV', set: { type: 'temperate' }, fresh: true, speed: 4,
      see: 'At about 2.5 hours, UV shines on the flask. Most prophages switch to lytic, and the bacteria crash.',
      why: 'UV damages DNA. The prophage escapes a host in trouble by bursting it.',
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'uv',9.5);VI(ctx,k,[[sim._ls_uv===sim.lnT0?'After UV':'Temperate, before UV',700,14],'Bacteria: '+mil(met(sim,'bac')),'Hidden prophage: '+mil(met(sim,'lys')),'Free phage: '+mil(met(sim,'phg'))]);} },
    { key: 'plaque', lvl: 'honors', title: 'Count phage with plaques', set: { type: 'lytic', dil: '7' }, fresh: true, speed: 4,
      see: 'A sample diluted 10 million times is spread on a bacterial lawn: about 30 clear plaques.',
      why: 'Titer = plaques ÷ (dilution × volume) = 30 ÷ (10⁻⁷ × 0.1 mL) = 3 × 10⁹ phage per mL.',
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'plate',8);VI(ctx,k,[['Plaque assay, 10⁻⁷',700,14],'Plaques: '+String(met(sim,'plq')||'—'),String(met(sim,'titer')||'')]);} },
    { key: 'hiv', lvl: 'ap', title: 'HIV, untreated', set: { type: 'hiv', drug: 'none' }, fresh: true, speed: 4,
      see: 'HIV infects helper T cells. Over months, viral load climbs and T cells fall.',
      why: 'Reverse transcriptase copies HIV’s RNA into DNA in the chromosome. Each infected T cell makes virus and dies.',
      overlay(sim,ctx,LH,k){HV(ctx,k,[['No treatment',700,13],'T cells: '+f0(met(sim,'tc'))+'/µL','Load: 10^'+f1(met(sim,'vlog'))]);} },
    { key: 'one', lvl: 'ap', title: 'One drug', set: { type: 'hiv', drug: 'one' }, fresh: true, speed: 4,
      see: 'One drug works at first. Then a resistant strain takes over.',
      why: 'HIV copies carelessly, so resistant mutants already exist. The drug kills the rest: natural selection in one body.',
      overlay(sim,ctx,LH,k){HV(ctx,k,[['One drug',700,13],'Load: 10^'+f1(met(sim,'vlog')),['Resistant: '+f0(met(sim,'res'))+'%',700,12.5,RED]]);} },
    { key: 'combo', lvl: 'ap', title: 'Three drugs at once', set: { type: 'hiv', drug: 'combo' }, fresh: true, speed: 4,
      see: 'Three drugs at once: viral load falls below detection and T cells recover.',
      why: 'Escaping all three takes three mutations at once, which almost never happens.',
      overlay(sim,ctx,LH,k){HV(ctx,k,[['3-drug combo',700,13],'T cells: '+f0(met(sim,'tc'))+'/µL',['Load: 10^'+f1(met(sim,'vlog')),700,12.5,GRN]]);} }
  ],
  useIt: [
    { do: 'Don’t ask for antibiotics for a cold or the flu.',
      why: 'Antibiotics kill bacteria, not viruses. Using them anyway helps resistant bacteria spread and does nothing for the virus.' },
    { do: 'Finish the full course of any antiviral or antibiotic you’re prescribed.', lvl: 'honors',
      why: 'Stopping early leaves the toughest survivors to multiply, the same selection you saw with one HIV drug.' }
  ],
  tryIt: [
    { title: 'the power of 100 (5 minutes)',
      steps: ['Start with 1 phage. Each infection makes 100 new phage in about 25 minutes.', 'Write the number after 1, 2, 3 and 4 rounds.', 'Compare it with the 400 million bacteria in a cloudy flask.'],
      look: 'After 4 rounds (under 2 hours) one phage becomes 100 million, and after 5 rounds 10 billion. That is why the flask clears so suddenly.' }
  ]
},
energycalc: {
  goals: {
    bio: ['Every bulb here gives the same light, but uses very different power', 'Most of an old bulb’s energy becomes heat', 'Watts × hours = energy you pay for'],
    honors: ['Light per watt as efficiency', 'Yearly kWh, cost and CO₂', 'Payback time for an efficient bulb'],
    ap: ['The full chain from fuel to light', 'Why fuel-to-light efficiency is tiny', 'W → kWh → cost → CO₂ → BTU conversions']
  },
  matters: 'Lighting used to be about a fifth of US electricity. Switching to LEDs is one of the cheapest ways to cut energy use and carbon emissions, and you can do it at home tonight.',
  question: 'An old 60 W bulb and a 9 W LED give the same light. Where do the other 51 watts go?',
  startKey: 'inc', startRun: true,
  steps: [
    { key: 'inc', title: 'An incandescent bulb', set: { bulb: 'incandescent', hours: 5 }, fresh: true, speed: 4,
      see: 'The 60 W bulb gives 800 lumens. The thermometer beside it climbs to about 47 °C.',
      why: 'Only about 5% of the electricity leaves as light. The other 95% is heat.',
      overlay(sim,ctx,LH,k){EC(ctx,k,[['Incandescent, 60 W',700,14],'Becomes light: '+f0(met(sim,'lightpct'))+'%','Thermometer: '+f1(met(sim,'temp'))+' °C']);} },
    { key: 'led', title: 'An LED', set: { bulb: 'led', hours: 5 }, fresh: true, speed: 4,
      see: 'The LED gives the same 800 lumens from 9 W. The thermometer barely warms, to about 25 °C.',
      why: 'An LED turns about 35% of its electricity into light, seven times the old bulb’s share.',
      overlay(sim,ctx,LH,k){EC(ctx,k,[['LED, 9 W',700,14],'Becomes light: '+f0(met(sim,'lightpct'))+'%','Thermometer: '+f1(met(sim,'temp'))+' °C']);} },
    { key: 'kwh', title: 'Energy over a year', set: { bulb: 'incandescent', hours: 5 }, fresh: true, speed: 4,
      see: 'On 5 hours a day, the 60 W bulb uses about 110 kWh a year; the LED about 16 kWh.',
      why: 'Energy = power × time: 60 W × 5 h × 365 = 109,500 Wh ≈ 110 kWh. You pay for kilowatt-hours, not watts.',
      overlay(sim,ctx,LH,k){EC(ctx,k,[['60 W × 5 h × 365 days',700,13.5],'= '+f0(met(sim,'kwh'))+' kWh per year','(LED: 16 kWh)']);} },
    { key: 'cost', lvl: 'honors', title: 'Cost, CO₂ and payback', set: { bulb: 'led', hours: 5 }, fresh: true, speed: 4,
      see: 'At 14¢ per kWh, the LED costs $2.30 a year instead of $15.33, and CO₂ drops from 60 kg to 9 kg.',
      why: 'Cost = kWh × price; CO₂ = kWh × the grid’s kg per kWh. It pays for itself in under 2 months.',
      overlay(sim,ctx,LH,k){EC(ctx,k,[['LED per year',700,14],'Cost: $'+f2(met(sim,'cost'))+' · CO₂: '+f0(met(sim,'co2'))+' kg','Pays for itself: '+f1(met(sim,'payback'))+' months']);} },
    { key: 'grid', lvl: 'honors', title: 'A cleaner grid', set: { bulb: 'incandescent', hours: 5, grid: 0.2 }, fresh: true, speed: 4,
      cause: { from: { grid: 0.55 }, delay: 0.6, dur: 2, label: 'Grid CO₂' },
      see: 'The grid’s CO₂ drops from 0.55 to 0.20 kg per kWh. The old bulb’s CO₂ falls from 60 kg to 22 kg.',
      why: 'The same kWh makes less CO₂ from wind, solar, hydro or nuclear. Efficient bulbs and cleaner power stack.',
      overlay(sim,ctx,LH,k){EC(ctx,k,[['Grid: '+f2(sim.p.grid)+' kg CO₂/kWh',700,14],'CO₂ per year: '+f0(met(sim,'co2'))+' kg']);} },
    { key: 'chain', lvl: 'ap', title: 'Fuel to light', set: { bulb: 'incandescent', hours: 5 }, fresh: true, speed: 4,
      see: 'Follow 100 J of fuel: 35 J of electricity leaves the plant, 33 J reaches the house, 1.6 J becomes light.',
      why: 'Multiply: 0.35 × 0.94 × 0.05 = 1.6%. With an LED, 11.5%. Every step loses energy as heat.',
      overlay(sim,ctx,LH,k){EC(ctx,k,[['Fuel → light',700,14],'Overall: '+f1(met(sim,'overall'))+'%','Fuel per year: '+f2(met(sim,'fuel'))+' million BTU']);} }
  ],
  useIt: [
    { do: 'Check the lumens, not the watts, when you buy a bulb.',
      why: 'Lumens measure light. 800 lumens is the old “60 W” brightness; an LED does it with about 9 W.' },
    { do: 'Replace the bulbs you use most first.', lvl: 'honors',
      why: 'Savings grow with hours on. A porch light on all night pays back much faster than a closet light.' }
  ],
  tryIt: [
    { title: 'audit one room (10 minutes)',
      steps: ['Read the watts printed on each bulb in one room.', 'Estimate how many hours a day each is on.', 'Multiply watts × hours × 365 ÷ 1000 for kWh, then × $0.14.'],
      look: 'Old bulbs on many hours a day cost dollars a year each; LEDs cost cents. Total it up for the whole house.' }
  ]
},
gridmix: {
  goals: {
    bio: ['A city needs power every minute, and demand changes through the day', 'Sun and wind come and go; something has to fill the gaps', 'Different plants make very different amounts of CO₂'],
    honors: ['Firm power (nuclear, hydro, gas) vs. intermittent power (wind, solar)', 'How batteries move solar power into the evening', 'Seasons, calm days and cost'],
    ap: ['Thermal efficiency and waste heat', 'MW vs. MWh, and fuel energy in MMBtu', 'Why coal makes about twice the CO₂ of gas per MWh']
  },
  matters: 'Colorado’s utilities are retiring coal plants and adding wind, solar and batteries. Every choice changes the cost of power, the air you breathe and the CO₂ in the atmosphere.',
  question: 'If a city built only wind and solar farms, would the lights stay on all night?',
  startKey: 'day', startRun: true,
  steps: [
    { key: 'day', title: 'One day on the grid', set: {}, fresh: true, speed: 2,
      see: 'A full day: demand rises in the afternoon and evening, solar follows the sun, wind comes and goes, and coal and gas fill the rest.',
      why: 'Supply must match demand every second. Coal and gas can be turned up or down, so they cover the gaps.',
      overlay(sim,ctx,LH,k){GM(ctx,k,[['Demand: '+f0(met(sim,'demand'))+' MW',700,14],'From clean sources: '+f0(met(sim,'clean'))+'%','CO₂ right now: '+f0(met(sim,'co2'))+' t/h']);} },
    { key: 'renew', title: 'Wind and solar only', set: { coal: 0, gas: 0 }, fresh: true, speed: 2,
      see: 'The coal and gas plants are removed. After sunset, with the wind down, the city is hundreds of megawatts short: blackouts.',
      why: 'Wind and solar make no CO₂, but you can’t turn them up when needed. A grid needs power that can follow demand.',
      overlay(sim,ctx,LH,k){GM(ctx,k,[['No coal, no gas',700,14],['Power short: '+f0(met(sim,'unmet'))+' MW',700,13.5,RED],'From clean sources: '+f0(met(sim,'clean'))+'%']);} },
    { key: 'gas', title: 'Swap coal for gas', set: { coal: 0, gas: 2000 }, fresh: true, speed: 2,
      see: 'Coal is replaced with gas. The lights stay on, and the day’s CO₂ drops from about 15,000 t to 6,700 t.',
      why: 'Gas plants are more efficient and gas has less carbon, so each MWh makes about half the CO₂ of coal.',
      overlay(sim,ctx,LH,k){GM(ctx,k,[['Gas instead of coal',700,14],'CO₂ right now: '+f0(met(sim,'co2'))+' t/h','Power short: '+f0(met(sim,'unmet'))+' MW']);} },
    { key: 'calm', lvl: 'honors', title: 'A calm day', set: { calm: true }, fresh: true, speed: 2,
      see: 'No wind today. Coal and gas run harder, and the day’s CO₂ rises to about 19,500 t.',
      why: 'Wind farms make power only when it blows, so planners need firm power for the calmest days.',
      overlay(sim,ctx,LH,k){GM(ctx,k,[['Calm day',700,14],'Coal + gas: '+f0(met(sim,'fossil'))+' MW','CO₂ in last 24 h: '+f0(met(sim,'day'))+' t']);} },
    { key: 'battery', lvl: 'honors', title: 'Solar plus batteries', set: { coal: 0, gas: 1500, solar: 2000, battery: 1000 }, fresh: true, speed: 2,
      see: 'More solar and 1,000 MW of batteries: noon sun charges them, and they discharge in the evening. CO₂ falls to about 2,600 t.',
      why: 'Batteries make no power; they shift noon sunshine to cover the 7 pm peak.',
      overlay(sim,ctx,LH,k){GM(ctx,k,[['Solar + batteries',700,14],'Battery charge: '+f0(met(sim,'soc'))+'%','Battery output: '+f0(met(sim,'batout'))+' MW','CO₂ in last 24 h: '+f0(met(sim,'day'))+' t']);} },
    { key: 'nuke', lvl: 'honors', title: 'Add nuclear', set: { coal: 0, gas: 900, nuclear: 1000 }, fresh: true, speed: 2,
      see: 'A 1,000 MW nuclear plant replaces coal, running day and night. CO₂ drops to about 500 t.',
      why: 'Nuclear makes no CO₂ while running and ignores the weather. The trade-offs are cost, build time and storing used fuel.',
      overlay(sim,ctx,LH,k){GM(ctx,k,[['Nuclear 1,000 MW',700,14],'From clean sources: '+f0(met(sim,'clean'))+'%','CO₂ in last 24 h: '+f0(met(sim,'day'))+' t']);} },
    { key: 'heat', lvl: 'ap', title: 'Waste heat', set: {}, fresh: true, speed: 2,
      see: 'Read the fuel heat burned and the waste heat: about two thirds of a coal plant’s fuel energy leaves as heat.',
      why: 'Coal plants are about 33% efficient, gas about 55%. Electricity out = fuel heat × efficiency; the rest is waste heat.',
      overlay(sim,ctx,LH,k){GM(ctx,k,[['Fossil output: '+f0(met(sim,'fossil'))+' MW',700,13.5],'Fuel heat in: '+f0(met(sim,'heatin'))+' MW thermal','Waste heat: '+f0(met(sim,'waste'))+' MW','Fuel energy: '+f0(met(sim,'btu'))+' MMBtu/h']);} },
    { key: 'hook', title: 'Your question: closing the coal plants', set: { coal: 0 }, fresh: true, speed: 2,
      see: 'The 700 MW of coal closes; gas, wind and solar stay. The lights stay on, and CO₂ falls from about 15,000 t to 6,200 t.',
      why: 'Gas ramps up whenever wind and solar fall short. Coal makes about twice gas’s CO₂ per MWh, so CO₂ drops by more than half.',
      overlay(sim,ctx,LH,k){GM(ctx,k,[['No coal',700,14],'Power short: '+f0(met(sim,'unmet'))+' MW','CO₂ right now: '+f0(met(sim,'co2'))+' t/h']);} }
  ],
  useIt: [
    { do: 'Run the dishwasher or charge devices late at night or midday when you can.',
      why: 'Using power when demand is low, or when solar is strong, eases the peak that the dirtiest and most expensive plants cover.' },
    { do: 'Look up your utility’s power mix.', lvl: 'honors',
      why: 'Xcel Energy and other Colorado utilities publish how much of their power comes from coal, gas, wind and solar, and their plans to change it.' }
  ],
  tryIt: [
    { title: 'track your own peak (one day)',
      steps: ['List when your household uses the most power: cooking, laundry, TV, AC or heat.', 'Compare it with the afternoon and evening demand peak in the sim.'],
      look: 'Most homes peak in the early evening, right as solar fades. That overlap is why batteries and flexible plants matter so much.' }
  ]
}
});
/* ---- Apr–May units: evolution (added Nov 14, 2026) ---- */
const BK=(ctx,k,L)=>card(ctx,k,L,270,8,300);
const CG=(ctx,k,L)=>card(ctx,k,L,500,360,290);
const HM=(ctx,k,L)=>card(ctx,k,L,470,398,320);
const tq=(sim,id)=>{const v=met(sim,id);return v==null||v!==v?'—':String(v);};
const beakMix=sim=>[['Tweezers','tw'],['Chopsticks','ch'],['Spoon','sp'],['Clothespin','cl'],['Binder clip','bc']].map(([n,id])=>[n,met(sim,id)]).filter(x=>x[1]>=10).sort((a,b)=>b[1]-a[1]).map(x=>x[0]+' '+f0(x[1])+'%').join(' · ')||'—';
const multi=(sim,tau,id,times)=>times.forEach((t,i)=>{const key='_mt'+id+i;if(tau>=t&&sim[key]!==sim.lnT0){sim[key]=sim.lnT0;act(sim,id);}});

BioLab.addLearn({
beaks: {
  simple: true,
  intro: { bio: 'You’ll run a bird beak lab and watch which beaks win when the food on the island changes.' },
  goals: {
    bio: ['Birds with beaks that fit the food survive and have more young', 'The population changes over generations, not the individual birds', 'When the food changes, the winners change'],
    honors: ['Variation, inheritance, selection and time', 'Carrying capacity limits the population', 'Mutation adds new variation'],
    ap: ['Relative fitness', 'Directional vs. disruptive selection', 'How the survival threshold sets selection strength']
  },
  matters: 'On the Galápagos, Peter and Rosemary Grant watched finch beaks get measurably deeper after a single drought in 1977. Natural selection is fast enough to see in a human lifetime.',
  question: 'An island’s food changes to only tiny seeds. Can a bird grow a better beak, or does something else change?',
  startKey: 'mixed', startRun: true,
  steps: [
    { key: 'mixed', title: 'A mixed island', set: { food: 'mixed' }, fresh: true, speed: 4,
      see: 'Five beak types, 8 birds each. Birds that gather 4 food items survive and breed. Watch the beak mix shift.',
      why: 'Each beak suits some foods. Birds don’t change their beaks; birds that fit the food leave more offspring, which inherit their beaks.',
      overlay(sim,ctx,LH,k){BK(ctx,k,[['Mixed food',700,14],beakMix(sim)]);} },
    { key: 'small', title: 'Only small seeds', set: { food: 'small' }, fresh: true, speed: 4,
      see: 'Only small seeds. Within a few generations nearly every bird has tweezers.',
      why: 'Tweezers pick up tiny seeds fastest; other beaks can’t gather enough. Birds that fit survive and breed more: <b>natural selection</b>, with nature doing the choosing.',
      overlay(sim,ctx,LH,k){BK(ctx,k,[['Small seeds only',700,14],beakMix(sim)]);} },
    { key: 'worms', title: 'Only worms', set: { food: 'worms' }, fresh: true, speed: 4,
      see: 'Change the island to worms, and the chopsticks take over.',
      why: 'There is no single best beak. <b>Fitness</b> means how well you fit your surroundings, not strength, and it changes when the food does.',
      overlay(sim,ctx,LH,k){BK(ctx,k,[['Worms only',700,14],beakMix(sim)]);} },
    { key: 'drought', title: 'Drought', set: { food: 'mixed' }, fresh: true, speed: 4,
      see: 'Mixed food, then a drought leaves only big, hard seeds. Clothespins and binder clips take over.',
      why: 'The Grants saw this in 1977: finches with deeper beaks survived, and the next generation’s beaks were deeper on average.',
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'drought',3);BK(ctx,k,[[sim.p.food==='drought'?'Drought':'Mixed food (drought coming)',700,14],beakMix(sim)]);} },
    { key: 'mut', lvl: 'honors', title: 'Mutation', set: { food: 'small', mut: true }, fresh: true, speed: 4,
      see: 'Small seeds with mutation on. Tweezers dominate, but a different beak shows up now and then.',
      why: 'A <b>mutation</b>, a random change in DNA, adds new variation each generation; selection removes most of it. Without it, a lost beak type could never return.',
      overlay(sim,ctx,LH,k){BK(ctx,k,[['Small seeds, with mutation',700,14],beakMix(sim)]);} },
    { key: 'fit', lvl: 'ap', title: 'Relative fitness', set: { food: 'mixed', T: 6 }, fresh: true, speed: 4,
      see: 'Survival now takes 6 food items instead of 4. Fewer birds survive, and the mix shifts faster.',
      why: 'Relative fitness compares each type with the best. A harsher threshold widens the gaps, so the population changes faster.',
      overlay(sim,ctx,LH,k){BK(ctx,k,[['Needs 6 items',700,14],'Survived last round: '+f0(met(sim,'surv'))+'%',beakMix(sim)]);} }
  ],
  useIt: [
    { do: 'Finish every antibiotic prescription.',
      why: 'Bacteria that survive a short course are the most resistant ones. They are selected, like the beaks that fit the food.' },
    { do: 'Look for examples of selection in the news: insecticide-resistant bugs, herbicide-resistant weeds.', lvl: 'honors',
      why: 'Each one is the same story: variation, a pressure, survivors that reproduce, and a changed population.' }
  ],
  tryIt: [
    { title: 'the real beak lab (20 minutes, with friends)',
      steps: ['Give each person a different “beak”: tweezers, a spoon, chopsticks, a clothespin.', 'Scatter rice, beans and pasta on a table and give everyone 30 seconds to pick up food into a cup.', 'Count. Repeat with only rice.'],
      look: 'Whoever’s tool fits the food wins. Change the food and the winner changes, like the island.' }
  ]
},
cladogram: {
  simple: true,
  intro: { bio: 'You’ll build a family tree for animals from the traits they share, then read who is most closely related.' },
  goals: {
    bio: ['A cladogram shows which groups share common ancestors', 'Shared derived traits mark each branch point', 'Groups closer on the tree are more closely related'],
    honors: ['Build the tree from traits shared by the most groups', 'Outgroups and nested clades', 'Reading a cladogram correctly'],
    ap: ['Parsimony: the tree with the fewest changes', 'Molecular evidence (cytochrome c) agrees', 'Branch points on a timeline']
  },
  matters: 'Cladograms tell doctors which animals are good models for human medicine, track how flu viruses spread, and show that birds are living dinosaurs.',
  question: 'Is a lizard more closely related to a frog or to a mouse?',
  startKey: 'empty', startRun: true,
  steps: [
    { key: 'empty', title: 'Seven animals', set: { set: 'vert', view: 'tree' }, fresh: true, pause: true, run(sim){act(sim,'clear');},
      see: 'Lancelet, lamprey, shark, frog, lizard, mouse and human, with no tree yet.',
      why: 'We’ll build the tree from traits that appeared once and were passed down, called <b>shared derived traits</b>: backbone, jaws, lungs, amniotic egg, hair and milk.'},
    { key: 'build', title: 'Place the traits', set: { set: 'vert', view: 'tree' }, fresh: true, speed: 1, run(sim){act(sim,'clear');},
      see: 'Traits go on one at a time, starting with the most shared: backbone, jaws, lungs, amniotic egg, then hair and milk.',
      why: 'A trait shared by more groups evolved earlier, so it sits lower. Everything above a mark has the trait. The tree is a <b>cladogram</b> (“clade” = branch).',
      overlay(sim,ctx,LH,k,tau){multi(sim,tau,'next',[1,2.5,4,5.5,7]);} },
    { key: 'read', title: 'Reading the tree', set: { set: 'vert', view: 'tree' }, fresh: true, pause: true, run(sim){act(sim,'clear');for(let i=0;i<5;i++)act(sim,'next');},
      see: 'Lizard and mouse share the amniotic egg; the frog branched off before it.',
      why: 'So the lizard is closer to the mouse than to the frog. Each branch point stands for a <b>common ancestor</b>; the most recent shared one, not looks, shows relatedness.'},
    { key: 'plant', lvl: 'honors', title: 'Land plants', set: { set: 'plant', view: 'tree' }, fresh: true, speed: 1, run(sim){act(sim,'clear');},
      see: 'Now plants: protected embryos, then vascular tissue, seeds and flowers.',
      why: 'Mosses lack vascular tissue, ferns lack seeds, pines lack flowers, so each branches off at its own point.',
      overlay(sim,ctx,LH,k,tau){multi(sim,tau,'next',[1,2.5,4,5.5]);} },
    { key: 'time', lvl: 'ap', title: 'On a timeline', set: { set: 'vert', view: 'time' }, fresh: true, pause: true, run(sim){act(sim,'clear');for(let i=0;i<5;i++)act(sim,'next');},
      see: 'The tree stretched along time: jaws by 440 million years ago, the amniotic egg by 320, mice and humans splitting about 90.',
      why: 'Fossils and molecular clocks date the branches. Cytochrome c agrees: human and mouse differ in 9 amino acids, human and lamprey in 29.'}
  ],
  useIt: [
    { do: 'When someone says humans came from chimps, picture the tree.',
      why: 'Humans and chimps share a common ancestor; neither came from the other. Both are tips of the tree, still here.' }
  ],
  tryIt: [
    { title: 'a cladogram of your kitchen (10 minutes)',
      steps: ['Pick five utensils: spoon, fork, knife, spatula, chopsticks.', 'List traits (metal, handle, prongs, sharp edge).', 'Build a tree with the most widely shared trait at the bottom.'],
      look: 'The method works for anything with nested traits, though utensils, unlike living things, didn’t descend from each other.' }
  ]
},
hominids: {
  goals: {
    bio: ['Many hominin species lived over the last 7 million years', 'Brain size grew over time, but not in a straight line', 'Walking upright came before big brains'],
    honors: ['The foramen magnum shows upright walking', 'Comparing skull features', 'Several species lived at the same time'],
    ap: ['Encephalization quotient: brain size relative to body', 'A branching bush, not a ladder', 'How fossils are dated']
  },
  matters: 'Fossils from Ethiopia, Kenya and South Africa show where humans came from. Many of the most important finds, like Lucy (A. afarensis), were made in the last 50 years.',
  question: 'Did our ancestors get big brains first, or start walking upright first?',
  startKey: 'sapiens', startRun: false,
  steps: [
    { key: 'sapiens', title: 'Our own skull', set: { species: 'sapiens', scene: 'skull', labels: true }, fresh: true, pause: true,
      see: 'A modern human skull: high, rounded braincase holding about 1,350 cc, flat face, small jaw.',
      why: 'Comparing these numbered features across species is how scientists tell fossils apart.',
      overlay(sim,ctx,LH,k){HM(ctx,k,[['Homo sapiens: '+f0(met(sim,'cc'))+' cc',700,14],tq(sim,'when')]);} },
    { key: 'lucy', title: 'Lucy’s species', set: { species: 'afarensis', scene: 'skull', labels: true }, fresh: true, pause: true,
      see: 'Australopithecus afarensis, about 3.4 million years ago: a 450 cc brain, a third of ours, and a jutting face.',
      why: 'Lucy’s hips and legs show she walked upright with a chimp-sized brain. Walking came first.',
      overlay(sim,ctx,LH,k){HM(ctx,k,[['A. afarensis: '+f0(met(sim,'cc'))+' cc',700,14],tq(sim,'when')]);} },
    { key: 'brain', title: 'Brain size over time', set: { species: 'erectus', scene: 'brain' }, fresh: true, pause: true,
      see: 'Brain sizes from 160 cc (Proconsul, 19 million years ago) to about 1,350 cc today. Homo erectus reached about 975.',
      why: 'Brains grew most in the last 2 million years, with Homo. Neanderthal brains were slightly larger than ours, so size isn’t everything.',
      overlay(sim,ctx,LH,k){HM(ctx,k,[['H. erectus: '+f0(met(sim,'cc'))+' cc',700,14],f0(met(sim,'you'))+'% of yours']);} },
    { key: 'time', title: 'A timeline', set: { species: 'habilis', scene: 'time' }, fresh: true, pause: true,
      see: 'Species overlap in time: Homo habilis and Paranthropus boisei shared East Africa about 2 million years ago.',
      why: 'Evolution is a branching bush. Several hominins often lived side by side; most branches died out.',
      overlay(sim,ctx,LH,k){HM(ctx,k,[['H. habilis',700,14],tq(sim,'when')]);} },
    { key: 'fm', lvl: 'honors', title: 'The foramen magnum', set: { species: 'afarensis', scene: 'fm' }, fresh: true, pause: true,
      see: 'The foramen magnum, where the spinal cord leaves the skull, sits farther forward in A. afarensis than in apes.',
      why: 'An upright body balances the skull on top of the spine, so the hole points down. Its position reveals posture from a skull.',
      overlay(sim,ctx,LH,k){HM(ctx,k,[['Foramen magnum',700,14],tq(sim,'fmw')]);} },
    { key: 'bush', lvl: 'ap', title: 'Bush, not ladder', set: { species: 'sapiens', scene: 'bush', ladder: false }, fresh: true, pause: true,
      see: 'The family bush: many branches side by side in time, with only Homo sapiens left today.',
      why: 'The “march of progress” line is wrong. Neanderthals were cousins, and modern humans carry about 1–2% Neanderthal DNA.',
      overlay(sim,ctx,LH,k){HM(ctx,k,[['A branching bush',700,14],'Only one branch survives today']);} }
  ],
  useIt: [
    { do: 'Visit the human-origins hall at the Denver Museum of Nature & Science.',
      why: 'You can compare cast skulls side by side and check the features from this lab yourself.' }
  ],
  tryIt: [
    { title: 'feel your foramen magnum (2 minutes)',
      steps: ['Put your fingers at the base of your skull, behind your ears.', 'Nod your head slowly.'],
      look: 'Your skull pivots on top of your spine, right over the hole. That balance point is what lets you walk upright without a heavy neck muscle holding your head up.' }
  ]
}
});
/* ---- Apr–May units: APES pollution (added Nov 14, 2026) ---- */
const SM=(ctx,k,L)=>card(ctx,k,L,480,150,300);
const AR=(ctx,k,L)=>card(ctx,k,L,320,128,240);
const EU=(ctx,k,L)=>card(ctx,k,L,232,40,300);
const LD=(ctx,k,L)=>card(ctx,k,L,560,356,232);
const hr=sim=>{const h=((sim.t%24)+24)%24,hh=Math.floor(h);return ((hh%12)||12)+(hh<12?' am':' pm');};

BioLab.addLearn({
smog: {
  goals: {
    bio: ['Car exhaust plus sunlight makes ground-level ozone', 'A thermal inversion traps pollution near the ground', 'Wind clears the air'],
    honors: ['Photochemical smog: NOx + VOCs + sunlight → O₃', 'Why ozone peaks in the afternoon', 'Summer ozone vs. winter brown cloud (particles)'],
    ap: ['The Air Quality Index', 'NO, NO₂ and O₃ through the day', 'Which emissions to cut: NOx vs. VOCs']
  },
  matters: 'The Denver metro area regularly fails the federal ozone standard on summer afternoons, and winter inversions trap the “brown cloud.” Ozone triggers asthma attacks, especially in kids and athletes.',
  question: 'Morning rush hour puts the most exhaust in the air. Is ozone worst in the morning?',
  startKey: 'day', startRun: true,
  steps: [
    { key: 'day', title: 'A summer day', set: { season: 'summer', traffic: 100, wind: 3, inv: false, plant: 100, voc: 100 }, fresh: true, speed: 2,
      see: 'Midnight to afternoon on a summer day. Morning traffic adds brown NO₂; ozone peaks mid-afternoon around 60 ppb.',
      why: 'Ozone isn’t emitted directly. Sunlight splits NO₂, and the loose oxygen atom joins O₂ to make O₃. It takes exhaust plus hours of sun.',
      overlay(sim,ctx,LH,k){SM(ctx,k,[[hr(sim)+' · ozone '+f0(met(sim,'o3'))+' ppb',700,14],'AQI '+f0(met(sim,'aqi'))+': '+String(met(sim,'aqicat'))]);} },
    { key: 'inv', title: 'A thermal inversion', set: { season: 'summer', traffic: 100, wind: 3, inv: true, plant: 100, voc: 100 }, fresh: true, speed: 2,
      see: 'Same day with an inversion. The mixing layer stays shallow, and ozone reaches about 180 ppb: very unhealthy.',
      why: 'A warm layer sits on top like a lid, trapping pollution near the ground. The mountains west of Denver make it worse.',
      overlay(sim,ctx,LH,k){SM(ctx,k,[[hr(sim)+' · ozone '+f0(met(sim,'o3'))+' ppb',700,14],['AQI '+f0(met(sim,'aqi'))+': '+String(met(sim,'aqicat')),700,13,RED]]);} },
    { key: 'wind', title: 'A windy day', set: { season: 'summer', traffic: 100, wind: 8, inv: false, plant: 100, voc: 100 }, fresh: true, speed: 2,
      see: 'An 8 m/s wind: afternoon ozone stays in the 40s, and the AQI is Good.',
      why: 'Wind spreads pollutants through much more air and carries them away before they build up.',
      overlay(sim,ctx,LH,k){SM(ctx,k,[[hr(sim)+' · ozone '+f0(met(sim,'o3'))+' ppb',700,14],'AQI '+f0(met(sim,'aqi'))+': '+String(met(sim,'aqicat'))]);} },
    { key: 'traffic', title: 'Double the traffic', set: { season: 'summer', traffic: 200, wind: 3, inv: false, plant: 100, voc: 100 }, fresh: true, speed: 2,
      see: 'Twice the traffic pushes the afternoon AQI from about 68 to 96.',
      why: 'More cars mean more NOx and VOCs for the ozone reactions.',
      so: 'That is why ozone action days ask you to drive less and fill up after dark.',
      overlay(sim,ctx,LH,k){SM(ctx,k,[[hr(sim)+' · ozone '+f0(met(sim,'o3'))+' ppb',700,14],'AQI '+f0(met(sim,'aqi'))+': '+String(met(sim,'aqicat'))]);} },
    { key: 'winter', lvl: 'honors', title: 'The winter brown cloud', set: { season: 'winter', traffic: 100, wind: 3, inv: true, plant: 100, voc: 100 }, fresh: true, speed: 2,
      see: 'A winter inversion: little ozone, but PM2.5 particles build to about 27 µg/m³, and the sky turns brown.',
      why: 'Winter sun is too weak for much ozone, but still air traps exhaust and smoke particles. Different season, different pollutant.',
      overlay(sim,ctx,LH,k){SM(ctx,k,[[hr(sim)+' · winter inversion',700,14],'PM2.5: '+f0(met(sim,'pm'))+' µg/m³','AQI '+f0(met(sim,'aqi'))+': '+String(met(sim,'aqicat'))]);} }
  ],
  useIt: [
    { do: 'Check the AQI before a hard outdoor workout on summer afternoons.',
      why: 'Ozone peaks mid-afternoon. On ozone action days, train in the morning, when levels are lowest.' },
    { do: 'Fill up the car in the evening on hot days.', lvl: 'honors',
      why: 'Gasoline vapor is a VOC. Released in the evening, it has no strong sunlight to cook into ozone before it disperses.' }
  ],
  tryIt: [
    { title: 'track the AQI for a week (5 minutes a day)',
      steps: ['Check airnow.gov for your ZIP code at 8 am and 3 pm each day.', 'Note the temperature, wind and the main pollutant listed.'],
      look: 'Hot, still afternoons usually show ozone as the main pollutant and the highest numbers; cold, calm mornings show particles.' }
  ]
},
acidrain: {
  goals: {
    bio: ['Burning coal and gasoline makes acid rain', 'Lakes on granite turn acidic; lakes on limestone don’t', 'Scrubbers cut the pollution at the source'],
    honors: ['SO₂ → sulfuric acid, NOx → nitric acid', 'The pH scale is logarithmic', 'Buffering by limestone (CaCO₃)'],
    ap: ['Acid-neutralizing capacity (ANC)', 'Soil buffering runs out over years', 'The Clean Air Act cap-and-trade success']
  },
  matters: 'Acid rain killed fish in thousands of lakes in the Adirondacks and Scandinavia. The 1990 Clean Air Act cut sulfur emissions by more than 90% since, and many lakes are slowly recovering: a real environmental success story.',
  question: 'Two lakes get the same acid rain. Will they both lose their fish?',
  startKey: 'rain', startRun: true,
  steps: [
    { key: 'rain', title: 'Acid rain falls', set: { coal: 100, scrub: false, sulfur: 'high', cars: 100 }, fresh: true, speed: 2,
      see: 'Coal and traffic make rain of pH 4.14. Granite Lake falls from pH 6.9 to about 4.1 and its trout die; Limestone Lake stays near 8.3.',
      why: 'SO₂ and NOx make acids in clouds. Granite can’t neutralize acid; limestone can.',
      overlay(sim,ctx,LH,k){AR(ctx,k,[['Rain pH '+f2(met(sim,'rainph')),700,14],'Granite Lake pH '+f1(met(sim,'gph')),'Trout left: '+f0(met(sim,'fish'))+'%']);} },
    { key: 'scrub', title: 'Install scrubbers', set: { coal: 100, scrub: true, sulfur: 'high', cars: 100 }, fresh: true, speed: 2,
      see: 'Scrubbers go on the smokestack. The rain is pH 4.8, and Granite Lake stays near 6.8. The trout survive.',
      why: 'Limestone slurry captures most SO₂ before it leaves the stack. Fixing it at the source protects every lake downwind.',
      overlay(sim,ctx,LH,k){AR(ctx,k,[['Scrubbers on',700,14],'Rain pH '+f2(met(sim,'rainph')),'Granite Lake pH '+f1(met(sim,'gph')),['Trout left: '+f0(met(sim,'fish'))+'%',700,12.5,GRN]]);} },
    { key: 'dilute', lvl: 'honors', title: 'pH is logarithmic', set: { coal: 100, scrub: false, sulfur: 'high', cars: 100 }, fresh: true, speed: 1,
      see: 'A rain sample diluted 10 times at each step: pH 4.1, then 5.1, then 6.1.',
      why: 'Each pH unit is a factor of 10 in H⁺. pH 4.1 rain has 29 times the H⁺ of clean rain (pH 5.6).',
      overlay(sim,ctx,LH,k,tau){[1.5,3].forEach((t,i)=>{const key='_dl'+i;if(tau>=t&&sim[key]!==sim.lnT0){sim[key]=sim.lnT0;act(sim,'dilute');}});AR(ctx,k,[['Dilution lab',700,14],'Sample pH: '+f2(met(sim,'sample'))]);} },
    { key: 'lime', lvl: 'ap', title: 'Liming a lake', set: { coal: 100, scrub: false, sulfur: 'high', cars: 100 }, fresh: true, speed: 2,
      see: 'Granite Lake acidifies, then limestone goes in. Its pH jumps back up, but the rain keeps coming.',
      why: 'Liming adds acid-neutralizing capacity for a while. It treats the symptom; cutting emissions fixes the cause.',
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'lime',9);AR(ctx,k,[['Granite Lake pH '+f1(met(sim,'gph')),700,14],'ANC: '+f0(met(sim,'anc'))+' µeq/L']);} }
  ],
  useIt: [
    { do: 'Save electricity where you can.',
      why: 'Much of Colorado’s power still comes from coal. Less demand means less SO₂ and NOx from the plants that remain.' }
  ],
  tryIt: [
    { title: 'chalk in vinegar (10 minutes)',
      steps: ['Put a piece of chalk (calcium carbonate) in a cup of vinegar.', 'Put a small granite pebble or piece of glass in another.'],
      look: 'The chalk fizzes and slowly dissolves as it neutralizes the acid; the granite does nothing. That is why limestone lakes resist acid rain and granite lakes don’t.' }
  ]
},
eutrophication: {
  goals: {
    bio: ['Fertilizer runoff feeds algae blooms', 'When algae die and decompose, oxygen in the water runs out', 'Without oxygen, fish die: a dead zone'],
    honors: ['Limiting nutrients: N and P', 'Trophic states: oligotrophic to eutrophic', 'Buffer strips and wetlands as solutions'],
    ap: ['BOD: oxygen used by decomposers', 'Warm water holds less oxygen', 'Stratification traps low oxygen at the bottom']
  },
  matters: 'Every summer a dead zone forms in the Gulf of Mexico from fertilizer washed down the Mississippi. Toxic algae blooms have shut down drinking water in Toledo and closed lakes in Colorado.',
  question: 'Fertilizer helps crops grow. If some washes into a lake, why would that kill the fish?',
  startKey: 'clean', startRun: true,
  steps: [
    { key: 'clean', title: 'A healthy lake', set: { runoff: 10, temp: 20, sewage: false, buffer: false, nut: 'both', strat: false }, fresh: true, speed: 3,
      see: 'Little runoff: modest algae, plenty of oxygen top and bottom, and lots of fish.',
      why: 'Phosphorus is scarce, so it limits algae. The lake stays balanced.',
      overlay(sim,ctx,LH,k){EU(ctx,k,[['Runoff '+f0(sim.p.runoff)+'%',700,14],'Algae: '+f1(met(sim,'chl'))+' µg/L','Bottom oxygen: '+f1(met(sim,'dob'))+' mg/L','Fish: '+f0(met(sim,'fish'))+' per hectare']);} },
    { key: 'bloom', title: 'More fertilizer', set: { runoff: 60, temp: 20, sewage: false, buffer: false, nut: 'both', strat: false }, fresh: true, speed: 3,
      cause: { from: { runoff: 10 }, delay: 0.6, dur: 3, label: 'Fertilizer runoff' },
      see: 'Runoff rises to 60%. Algae bloom, the water turns green, bottom oxygen falls to zero and the fish disappear.',
      why: 'Algae make oxygen at the surface, but when they die and sink, decomposing bacteria use up the deep water’s oxygen.',
      overlay(sim,ctx,LH,k){EU(ctx,k,[['Runoff '+f0(sim.p.runoff)+'%',700,14],'Algae: '+f1(met(sim,'chl'))+' µg/L',['Bottom oxygen: '+f1(met(sim,'dob'))+' mg/L',700,12.5,RED],'Fish: '+f0(met(sim,'fish'))+' per hectare']);} },
    { key: 'buffer', lvl: 'honors', title: 'Buffer strips and wetlands', set: { runoff: 60, temp: 20, sewage: false, buffer: true, nut: 'both', strat: false }, fresh: true, speed: 3,
      see: 'Same 60% runoff, but plant strips and wetlands catch much of it. Bottom oxygen holds near 5 mg/L, and fish survive.',
      why: 'Streamside plants soak up nitrogen and phosphorus before they reach the lake: cheaper than fixing a dead zone.',
      overlay(sim,ctx,LH,k){EU(ctx,k,[['Buffer strips on',700,14],'Algae: '+f1(met(sim,'chl'))+' µg/L','Bottom oxygen: '+f1(met(sim,'dob'))+' mg/L',['Fish: '+f0(met(sim,'fish'))+' per hectare',700,12.5,GRN]]);} },
    { key: 'limit', lvl: 'honors', title: 'Nitrogen only', set: { runoff: 60, temp: 20, sewage: false, buffer: false, nut: 'N', strat: false }, fresh: true, speed: 3,
      see: 'Runoff with only nitrogen barely changes the lake. Algae stay low.',
      why: 'This lake is phosphorus-limited, so extra nitrogen alone can’t feed algae. That is why phosphate detergents were banned.',
      overlay(sim,ctx,LH,k){EU(ctx,k,[['Nitrogen only',700,14],'Algae: '+f1(met(sim,'chl'))+' µg/L','Limiting nutrient: '+String(met(sim,'lim'))]);} },
    { key: 'warm', lvl: 'ap', title: 'Warm water', set: { runoff: 60, temp: 30, sewage: false, buffer: false, nut: 'both', strat: true }, fresh: true, speed: 3,
      see: 'At 30 °C with summer layering, even surface water holds only 7.4 mg/L of oxygen, and the bottom is cut off.',
      why: 'Warm water holds less gas, and the warm top layer doesn’t mix down. Bottom oxygen can’t be replaced, so dead zones peak in late summer.',
      overlay(sim,ctx,LH,k){EU(ctx,k,[['30 °C, stratified',700,14],'Oxygen saturation: '+f1(met(sim,'sat'))+' mg/L','BOD: '+f1(met(sim,'bod'))+' mg/L/day','Bottom oxygen: '+f1(met(sim,'dob'))+' mg/L']);} }
  ],
  useIt: [
    { do: 'Use only as much lawn fertilizer as the bag says, and never before a big rain.',
      why: 'Extra fertilizer washes into storm drains, which flow straight to streams and lakes without treatment.' },
    { do: 'Pick up pet waste.', lvl: 'honors',
      why: 'It adds nitrogen, phosphorus and bacteria to storm runoff, feeding algae and using up oxygen as it decomposes.' }
  ],
  tryIt: [
    { title: 'jar ecosystems (2 weeks)',
      steps: ['Fill two clear jars with pond or aquarium water.', 'Add a pinch of plant fertilizer to one jar only.', 'Set both in a sunny window and look every few days.'],
      look: 'The fertilized jar turns green with algae first, then often murky and smelly as algae die and decompose.' }
  ]
},
ld50: {
  goals: {
    bio: ['The dose makes the poison', 'A dose–response curve shows how effect grows with dose', 'LD50: the dose that kills half'],
    honors: ['Control groups and replication', 'The no-effect level (NOAEL)', 'Different organisms have different sensitivities'],
    ap: ['ED50 vs. LD50 and the safety margin', 'Log scales for dose', 'Sample size and uncertainty']
  },
  matters: 'Road salt kills roadside plants and harms streams every winter in Colorado. The same dose–response method sets safe limits for medicines, pesticides and chemicals in drinking water.',
  question: 'A little salt doesn’t hurt radish seeds. How much salt does it take to stop half of them from sprouting?',
  startKey: 'run', startRun: true,
  steps: [
    { key: 'run', title: 'Six dishes of seeds', set: { organism: 'radish', n: '25', salt: 'nacl' }, fresh: true, speed: 4,
      see: 'Radish seeds sprout over 72 hours in dishes from 0% to 4% salt. Low doses sprout almost fully; 2% and 4% barely sprout.',
      why: 'Salt pulls water out of seeds by osmosis, so they can’t take up enough to germinate.',
      overlay(sim,ctx,LH,k){LD(ctx,k,[['0%: '+f0(met(sim,'g0'))+'%  1%: '+f0(met(sim,'g3'))+'%  4%: '+f0(met(sim,'g5'))+'%',700,12.5],'LD50: '+(Number.isFinite(met(sim,'ld'))?f2(met(sim,'ld'))+'% salt':'not yet')]);} },
    { key: 'curve', title: 'The LD50', set: { organism: 'radish', n: '25', salt: 'nacl' }, speed: 4,
      see: 'The curve crosses 50% sprouted at a little over 1% salt. Your number varies a bit each run.',
      why: '<b>LD50</b> is the dose that harms half the group. A lower LD50 means more toxic.',
      overlay(sim,ctx,LH,k){LD(ctx,k,[['LD50 ≈ '+f2(met(sim,'ld'))+'% salt',700,14],'Control: '+f0(met(sim,'g0'))+'% sprouted']);} },
    { key: 'lettuce', lvl: 'honors', title: 'Lettuce is more sensitive', set: { organism: 'lettuce', n: '25', salt: 'nacl' }, fresh: true, speed: 4,
      see: 'Lettuce: only about 12% sprout at 1% salt, and the LD50 drops to about 0.6%.',
      why: 'Species differ. Safety limits must protect the most sensitive ones.',
      overlay(sim,ctx,LH,k){LD(ctx,k,[['Lettuce',700,14],'LD50: '+(Number.isFinite(met(sim,'ld'))?f2(met(sim,'ld'))+'% salt':'not yet')]);} },
    { key: 'small', lvl: 'ap', title: 'Fewer seeds', set: { organism: 'radish', n: '10', salt: 'nacl' }, fresh: true, speed: 4,
      see: 'With only 10 seeds per dish, results are bumpy: 0.5% might beat the control.',
      why: 'Each seed is 10% of a dish. More seeds and repeated trials give a smoother curve and a better LD50.',
      overlay(sim,ctx,LH,k){LD(ctx,k,[['10 seeds per dish',700,14],'LD50: '+(Number.isFinite(met(sim,'ld'))?f2(met(sim,'ld'))+'% salt':'not yet')]);} }
  ],
  useIt: [
    { do: 'Read the dosing chart on medicine; never double up.',
      why: 'Every medicine has a dose that helps and a higher dose that harms. The gap between them is the safety margin.' },
    { do: 'Shovel first and salt sparingly on sidewalks.', lvl: 'honors',
      why: 'Salt that washes off kills plants along the edges and raises the salinity of streams.' }
  ],
  tryIt: [
    { title: 'a kitchen salinity test (4 days)',
      steps: ['Set up 4 damp paper towels in zip bags with 10 dried beans or radish seeds each.', 'Wet them with plain water, and with water containing ¼, ½ and 1 teaspoon of salt per cup.', 'Count sprouts every day.'],
      look: 'The saltier bags sprout fewer seeds and later. Plot % sprouted against salt to make your own dose–response curve.' }
  ]
}
});
/* ---- Apr–May units: dissection and homeostasis (added Nov 14, 2026) ---- */
const HG=(ctx,k,L)=>card(ctx,k,L,12,280,290);
const HT=(ctx,k,L)=>card(ctx,k,L,12,60,166);

BioLab.addLearn({
dissection: {
  goals: {
    bio: ['Find the major organs of a mammal and say what each does', 'How the organs connect into systems', 'Why a fetal pig is a good model for a human'],
    honors: ['Use the right tool and the right cut', 'Trace food from mouth to rectum', 'Compare a mammal with an insect'],
    ap: ['Fetal circulation: the umbilical vessels and the shunts', 'Why the lungs are bypassed before birth', 'Structure and function across organ systems']
  },
  matters: 'Surgeons, vets and nurses all learned anatomy by seeing where organs sit and how they connect. Pigs are close enough to humans that pig heart valves are used in human heart surgery.',
  question: 'When you open a fetal pig, which big organ do you think you’ll see first?',
  startKey: 'ext', startRun: false,
  steps: [
    { key: 'ext', title: 'Outside the pig', set: { mode: 'pig', sex: 'f', step: 'ext' }, fresh: true, pause: true,
      see: 'The pig lies on its back. Find the umbilical cord, the rows of mammary papillae and the openings near the tail.',
      why: 'The cord joined the fetus to the placenta: food and oxygen in, wastes out. Both sexes have papillae, like humans.'},
    { key: 'cut', title: 'The incisions', set: { mode: 'pig', sex: 'f', step: 'cut' }, fresh: true, pause: true,
      see: 'Cuts run down the midline and out to the sides, making flaps that fold back like doors.',
      why: 'Scissors lift and cut the body wall so organs aren’t sliced. Dissection separates tissue; it doesn’t chop it.'},
    { key: 'five', title: 'The first organs', set: { mode: 'pig', sex: 'f', step: 'five' }, fresh: true, pause: true,
      see: 'The large dark liver fills the upper abdomen. Below lie the stomach and the coiled small intestine.',
      why: 'The liver, the largest internal organ, stores glycogen, makes bile and filters blood from the intestines.'},
    { key: 'liver', title: 'Under the liver', set: { mode: 'pig', sex: 'f', step: 'liver' }, fresh: true, pause: true,
      see: 'Under the liver: the green gallbladder, the stomach and the spleen.',
      why: 'The gallbladder stores bile, which breaks fat into droplets. The spleen filters old red blood cells.'},
    { key: 'intest', title: 'The intestines', set: { mode: 'pig', sex: 'f', step: 'intest' }, fresh: true, pause: true,
      see: 'Move the intestines aside: kidneys against the back wall, bladder low in the abdomen.',
      why: 'The small intestine absorbs nutrients; the large intestine absorbs water. Kidneys make urine, which the bladder stores.'},
    { key: 'heart', title: 'The heart', set: { mode: 'pig', sex: 'f', step: 'heart' }, fresh: true, pause: true,
      see: 'The chest is opened: the heart sits between the lungs.',
      why: 'Like ours, it has four chambers: the right side pumps to the lungs, the left to the body.'},
    { key: 'hopper', lvl: 'honors', title: 'Compare: a grasshopper', set: { mode: 'hopper', sex: 'f', hstep: 'hcomp' }, fresh: true, pause: true,
      see: 'A grasshopper: crop, gizzard and gut, a tube-shaped heart along its back, and a nerve cord along its belly.',
      why: 'Same jobs, done differently: spiracles and tubes instead of lungs, and a belly-side nerve cord.'},
    { key: 'circ', lvl: 'ap', title: 'Fetal circulation', set: { mode: 'pig', sex: 'f', step: 'circ' }, fresh: true, pause: true,
      see: 'Oxygen-rich blood arrives from the placenta in the umbilical vein and mostly skips the liver and lungs.',
      why: 'Before birth the lungs hold fluid, so two shunts send blood around them. The first breath closes them.'}
  ],
  useIt: [
    { do: 'Find your own organs: liver under your right ribs, stomach under the left, heart a little left of center.',
      why: 'Knowing where organs sit helps you describe pain to a doctor and understand what an injury might affect.' }
  ],
  tryIt: [
    { title: 'trace a sandwich (5 minutes)',
      steps: ['On paper, draw the path of a bite of food from mouth to rectum.', 'Label where it is broken down, where nutrients are absorbed and where water is absorbed.'],
      look: 'Mouth and stomach break it down; the small intestine absorbs nutrients; the large intestine absorbs water. The liver and pancreas add bile and enzymes along the way.' }
  ]
},
homeostasis: {
  goals: {
    bio: ['The body keeps blood sugar and temperature in a narrow range', 'Negative feedback: a change triggers a response that undoes it', 'What goes wrong in diabetes'],
    honors: ['Insulin vs. glucagon', 'Type 1 vs. type 2 diabetes', 'Shivering, sweating and blood flow to the skin'],
    ap: ['The hypothalamus set point and fever', 'Glycogen storage in the liver', 'Heat made vs. heat lost']
  },
  matters: 'About 1 in 10 Americans has diabetes, and 1 in 3 has prediabetes. Heat stroke and hypothermia happen when temperature control is overwhelmed. Knowing the feedback loops helps you spot when a body is in trouble.',
  question: 'You eat a big plate of pasta. Why doesn’t your blood sugar just keep climbing?',
  startKey: 'rest', startRun: true,
  steps: [
    { key: 'rest', title: 'At rest', set: { mode: 'glucose', carbs: 75, t1: false, t2: false }, fresh: true, speed: 2,
      see: 'Blood glucose holds steady at 90 mg/dL, with low levels of both hormones.',
      why: 'Cells burn glucose constantly, and the liver replaces just enough. That steady state is <b>homeostasis</b>.',
      overlay(sim,ctx,LH,k){HG(ctx,k,[['Glucose: '+f0(met(sim,'G'))+' mg/dL',700,14],'Insulin: '+f0(met(sim,'I'))+' µU/mL']);} },
    { key: 'meal', title: 'Eat a meal', set: { mode: 'glucose', carbs: 75, t1: false, t2: false }, fresh: true, speed: 2, run(sim){act(sim,'meal');},
      see: 'Sugar floods in. Glucose rises to about 130 mg/dL, insulin is released, and within hours glucose is back near 90.',
      why: 'Insulin lets muscle and fat cells take in glucose and the liver store it. As glucose falls, so does insulin: <b>negative feedback</b>.',
      overlay(sim,ctx,LH,k){HG(ctx,k,[['Glucose: '+f0(met(sim,'G'))+' mg/dL',700,14],'Insulin: '+f0(met(sim,'I'))+' µU/mL']);} },
    { key: 'ex', title: 'Exercise', set: { mode: 'glucose', carbs: 75, t1: false, t2: false }, fresh: true, speed: 2, run(sim){act(sim,'exercise');},
      see: 'Exercise pulls glucose into muscles. Insulin drops, glucagon rises, and the liver releases stored glucose.',
      why: 'Glucagon is insulin’s opposite. The two hormones push opposite ways to hold glucose steady.',
      overlay(sim,ctx,LH,k){HG(ctx,k,[['Glucose: '+f0(met(sim,'G'))+' mg/dL',700,14],'Glucagon: '+f0(met(sim,'Gn'))+' pg/mL']);} },
    { key: 't1', lvl: 'honors', title: 'Type 1 diabetes', set: { mode: 'glucose', carbs: 75, t1: true, t2: false }, fresh: true, speed: 2, run(sim){act(sim,'meal');},
      see: 'Type 1 diabetes: no insulin. The same meal pushes glucose past 250 mg/dL, and sugar spills into the urine.',
      why: 'The immune system destroys the insulin-making cells, so glucose can’t enter cells. Treatment is insulin by injection or pump.',
      overlay(sim,ctx,LH,k){HG(ctx,k,[['Glucose: '+f0(met(sim,'G'))+' mg/dL',700,14,RED],'Insulin: '+f0(met(sim,'I'))+' µU/mL']);} },
    { key: 't2', lvl: 'honors', title: 'Type 2 diabetes', set: { mode: 'glucose', carbs: 75, t1: false, t2: true }, fresh: true, speed: 2, run(sim){act(sim,'meal');},
      see: 'Type 2 diabetes: plenty of insulin, but glucose still climbs to about 200 mg/dL.',
      why: 'Cells respond weakly to insulin (insulin resistance). Exercise, diet and medicine improve the response.',
      overlay(sim,ctx,LH,k){HG(ctx,k,[['Glucose: '+f0(met(sim,'G'))+' mg/dL',700,14],'Insulin: '+f0(met(sim,'I'))+' µU/mL (high)']);} },
    { key: 'cold', title: 'A cold day', set: { mode: 'temp', ta: 5, fever: false }, fresh: true, speed: 2,
      cause: { from: { ta: 22 }, delay: 0.6, dur: 2, label: 'Air temperature' },
      see: 'The air drops to 5 °C. Skin blood flow falls, shivering starts, and core temperature holds near 36.6 °C.',
      why: 'The hypothalamus compares core temperature with its 37 °C set point, saving heat in the skin and making heat by shivering.',
      overlay(sim,ctx,LH,k){HT(ctx,k,[['Air '+f0(sim.p.ta)+' °C',700,14],'Core: '+f1(met(sim,'Tc'))+' °C','Shivering: '+f0(met(sim,'shiv'))+' W']);} },
    { key: 'hot', title: 'A hot day', set: { mode: 'temp', ta: 40, fever: false }, fresh: true, speed: 2,
      cause: { from: { ta: 22 }, delay: 0.6, dur: 2, label: 'Air temperature' },
      see: 'At 40 °C the skin flushes and sweating starts. Core temperature stays near 37.3 °C.',
      why: 'Evaporating sweat and blood near the skin shed heat. When it’s humid or you’re dehydrated, heat stroke can follow.',
      overlay(sim,ctx,LH,k){HT(ctx,k,[['Air '+f0(sim.p.ta)+' °C',700,14],'Core: '+f1(met(sim,'Tc'))+' °C','Sweat: '+f2(met(sim,'sweat'))+' L/h']);} },
    { key: 'fever', lvl: 'ap', title: 'A fever', set: { mode: 'temp', ta: 22, fever: true }, fresh: true, speed: 2,
      see: 'An infection raises the set point to 39 °C. The body shivers and feels cold until the core climbs.',
      why: 'A fever is the thermostat turned up on purpose, slowing many microbes. That is why chills come as a fever starts.',
      overlay(sim,ctx,LH,k){HT(ctx,k,[['Fever',700,14],'Set point: '+f1(met(sim,'S'))+' °C','Core: '+f1(met(sim,'Tc'))+' °C']);} }
  ],
  useIt: [
    { do: 'Know the warning signs of low blood sugar if a friend or teammate has diabetes.',
      why: 'Shakiness, sweating and confusion can mean glucose is dropping too low. Fast sugar, like juice, helps.' },
    { do: 'Drink water and take breaks during hot practices.', lvl: 'honors',
      why: 'Sweat is your main cooling system. Without enough water you stop sweating and core temperature can climb dangerously fast.' }
  ],
  tryIt: [
    { title: 'feel the feedback (5 minutes)',
      steps: ['Hold one hand in cold water for 30 seconds and look at the skin color.', 'Then do 30 jumping jacks and feel your face and neck.'],
      look: 'The cold hand goes pale as skin blood vessels close; after exercise your face flushes to dump heat. Both are your hypothalamus keeping your core steady.' }
  ]
}
});
})();
