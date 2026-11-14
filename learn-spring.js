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
      see: 'Inside the nucleus, a short gene: two DNA strands, 24 base pairs. The top (coding) strand starts with ATG and ends with TAA.',
      why: 'DNA stays in the nucleus. To use a gene, the cell first makes a working copy that can travel: messenger RNA.',
      overlay(sim,ctx,LH,k){GX(ctx,k,[['A 24-base gene',700,13.5],'Starts ATG · ends TAA']);} },
    { key: 'tx', title: 'Transcription: DNA → mRNA', set: { gene: 'demo', pos: 6, base: 'A', introns: false }, speed: 1, run(sim){act(sim,'replay');},
      see: 'RNA polymerase (purple) unzips the DNA and slides along the template strand, adding one matching RNA base at a time.',
      why: 'Base pairing makes it exact: A pairs with U (RNA uses U instead of T), T with A, G with C and C with G. The mRNA ends up matching the coding strand, with U for T.',
      overlay(sim,ctx,LH,k){GX(ctx,k,[['Transcription',700,13.5,'#6b3fa0'],'A→U  T→A  G→C  C→G']);} },
    { key: 'tl', title: 'Translation: three bases, one amino acid', set: { gene: 'demo', pos: 6, base: 'A', introns: false }, speed: 1,
      see: 'The mRNA leaves the nucleus. A ribosome grabs it and reads three bases at a time. For each codon a tRNA brings the matching amino acid, and the chain grows.',
      why: 'Each three-base codon stands for one amino acid. AUG means “start” (and Met); CCG means Pro; AAG means Lys. 64 codons code for 20 amino acids, so most amino acids have several codons.',
      overlay(sim,ctx,LH,k){GX(ctx,k,[['Translation',700,13.5,GRN],'mRNA: '+String(met(sim,'mrna')||'')]);} },
    { key: 'protein', title: 'Stop: the protein is done', set: { gene: 'demo', pos: 6, base: 'A', introns: false }, speed: 1, overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'skip',0.8);GX(ctx,k,[['Protein: '+String(met(sim,'len'))+' amino acids',700,13.5],String(met(sim,'protein')||'')]);},
      see: 'At the stop codon UAA no tRNA fits. The ribosome lets go, and the chain Met–Pro–Lys–Phe–Gly–Trp–His is finished.',
      why: 'The order of bases in the gene set the order of amino acids, and that order decides how the protein folds and what it does.' },
    { key: 'silent', title: 'A change that changes nothing', set: { gene: 'demo', pos: 6, base: 'A', introns: false }, fresh: true, pause: true, run(sim){act(sim,'undo');},
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'sub',1);actAt(sim,tau,'skip',2.5);GX(ctx,k,[[tau<1?'Base 6: G…':'Base 6: G → A ('+String(met(sim,'mtype'))+')',700,13.5,RED],String(met(sim,'protein')||'')]);},
      see: 'Base 6 changes from G to A, so the codon CCG becomes CCA. The protein comes out exactly the same.',
      why: 'CCA also codes for proline. Because the code has several codons for most amino acids, many single-base changes are silent.' },
    { key: 'nonsense', title: 'A change that stops it early', set: { gene: 'demo', pos: 18, base: 'A', introns: false }, fresh: true, pause: true, run(sim){act(sim,'undo');},
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'sub',1);actAt(sim,tau,'skip',2.5);GX(ctx,k,[[tau<1?'Base 18: G…':'Base 18: G → A ('+String(met(sim,'mtype'))+')',700,13.5,RED],String(met(sim,'protein')||'')]);},
      see: 'Base 18 changes from G to A, so the codon UGG (Trp) becomes UGA: a stop codon. The protein ends after 5 amino acids.',
      why: 'A single base can turn an amino acid codon into “stop.” A protein cut short usually can’t fold or work. Some cases of cystic fibrosis and muscular dystrophy start this way.' },
    { key: 'frame', title: 'One extra base scrambles the rest', set: { gene: 'demo', pos: 5, base: 'G', introns: false }, fresh: true, pause: true, run(sim){act(sim,'undo');},
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'ins',1);actAt(sim,tau,'skip',2.5);GX(ctx,k,[[tau<1?'Inserting a G…':'G inserted: '+String(met(sim,'mtype')),700,13.5,RED],String(met(sim,'protein')||'')]);},
      see: 'One G is inserted after base 5. Every codon after it shifts by one letter: 7 amino acids change, and the stop codon is lost.',
      why: 'The ribosome reads in fixed groups of three from the start. Add or remove one base and every later group is different: a frameshift. These are usually the most damaging small mutations.' },
    { key: 'sickle', lvl: 'honors', title: 'One base, one disease', set: { gene: 'hbb', pos: 20, base: 'T', introns: false }, fresh: true, pause: true, run(sim){act(sim,'undo');},
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'sub',1);actAt(sim,tau,'skip',2.5);GX(ctx,k,[[tau<1?'β-globin, codon 7: GAG…':'GAG → GTG: '+String(met(sim,'mtype')),700,13.5,RED],String(met(sim,'protein')||'')]);},
      see: 'The start of the β-globin gene, part of hemoglobin. One A becomes T in codon 7, so GAG (glutamic acid) becomes GTG (valine).',
      why: 'That single swap makes hemoglobin molecules stick together when oxygen is low, bending red blood cells into sickles that block small vessels. In 2023 the first gene-editing therapy for sickle-cell disease was approved in the US.' },
    { key: 'inframe', lvl: 'ap', title: 'Delete a whole codon', set: { gene: 'demo', pos: 7, introns: false }, fresh: true, pause: true, run(sim){act(sim,'undo');},
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'delc',1);actAt(sim,tau,'skip',2.5);GX(ctx,k,[[tau<1?'Deleting codon 3…':String(met(sim,'mtype')),700,13.5,RED],String(met(sim,'protein')||'')]);},
      see: 'Three bases in a row (one codon, AAG = Lys) are deleted. The protein is just missing Lys; everything after it is unchanged.',
      why: 'Removing three bases keeps the reading frame. The most common cystic fibrosis mutation, ΔF508, deletes one codon this way.' },
    { key: 'intron', lvl: 'ap', title: 'Introns are cut out', set: { gene: 'demo', pos: 6, base: 'A', introns: true }, fresh: true, speed: 1, run(sim){act(sim,'undo');act(sim,'replay');},
      see: 'Now the gene has an intron. The first RNA copy is 34 bases long; before it leaves the nucleus the intron is spliced out, leaving 24.',
      why: 'Eukaryotic genes are interrupted by introns. Spliceosomes remove them and join the exons, and the mRNA gets a 5′ cap and a poly-A tail for protection and export. Alternative splicing lets one gene make several proteins.',
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
      see: 'The year is 2025. The air holds 425 ppm of CO₂, up from 280 before the Industrial Revolution, and Earth is about 1.3 °C warmer than in 1850.',
      why: 'Sunlight warms the ground, which gives off infrared heat. CO₂ and methane molecules absorb some of that heat and send part of it back down, like a blanket. More of them means a thicker blanket.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['Year '+yr(sim),700,14],'CO₂: '+f0(met(sim,'co2'))+' ppm (was 280)',['Warming: +'+f1(met(sim,'warm'))+' °C',700,13,RED]]);} },
    { key: 'bau', title: 'Business as usual', set: { path: 'bau' }, speed: 1.4, run(sim){act(sim,'clear');},
      see: 'Time runs forward with emissions still growing each year. By 2100, CO₂ reaches about 654 ppm and warming about 3.1 °C, more than twice today’s.',
      why: 'Emissions climb from 10 to about 22 billion tons of carbon a year. Every year adds more CO₂ than oceans and forests can take back out, so it piles up and the blanket keeps thickening.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['Year '+yr(sim),700,14],'CO₂: '+f0(met(sim,'co2'))+' ppm',['Warming: +'+f1(met(sim,'warm'))+' °C',700,13,RED]]);} },
    { key: 'one', title: 'One wedge', set: { path: 'bau', pick: 'wind' }, fresh: true, speed: 1.4, run(sim){act(sim,'clear');act(sim,'toggle');},
      see: 'Start over and add one wedge: 2 million wind turbines replacing coal. By 2100 emissions are 1.5 billion tons lower, but warming still reaches about 3.0 °C.',
      why: 'A wedge is one action that grows to cut emissions steadily. One helps, but it only shaves the top off a rising curve. No single fix is big enough.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['1 wedge: wind power',700,14],'Year '+yr(sim)+' · emissions '+f1(met(sim,'emis'))+' GtC/yr',['Warming: +'+f1(met(sim,'warm'))+' °C',700,13,RED]]);} },
    { key: 'eight', title: 'Eight wedges hold emissions flat', set: { path: 'bau' }, fresh: true, speed: 1.4, run(sim){act(sim,'clear');act(sim,'eight');},
      see: 'Eight wedges together: efficient cars and buildings, wind, solar, protecting forests and more. Emissions stay flat at 10 billion tons a year. By 2100, warming is about 2.4 °C instead of 3.1.',
      why: 'Many different actions, each feasible, add up to a big change. Flat emissions are a huge improvement over business as usual, but notice the CO₂ line is still climbing.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['8 wedges',700,14,GRN],'Year '+yr(sim)+' · CO₂ '+f0(met(sim,'co2'))+' ppm',['Warming: +'+f1(met(sim,'warm'))+' °C',700,13,RED]]);} },
    { key: 'bathtub', lvl: 'honors', title: 'Flat isn’t enough: the bathtub', set: { path: 'flat' }, fresh: true, speed: 1.4, run(sim){act(sim,'clear');},
      see: 'The “hold flat” path keeps emissions at 10 billion tons a year. CO₂ still rises from 425 to about 512 ppm by 2100.',
      why: 'Think of a bathtub: emissions are the faucet, oceans and forests are the drain. Today the faucet runs about twice as fast as the drain, so even a steady faucet keeps filling the tub. CO₂ only stops rising near net zero.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['Emissions held flat',700,14],'Year '+yr(sim)+' · CO₂ '+f0(met(sim,'co2'))+' ppm','Still rising']);} },
    { key: 'netzero', title: 'Net zero by 2070', set: { path: 'netzero' }, fresh: true, speed: 1.4, run(sim){act(sim,'clear');},
      see: 'Emissions fall to net zero by 2070. CO₂ peaks and then drops to about 354 ppm by 2100. Warming levels off near 2 °C and starts to ease, ending near 1.7 °C.',
      why: 'Once we stop adding more than nature removes, the drain wins and CO₂ slowly falls. Temperature follows, with a lag. This is the path in the Paris Agreement’s goals.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['Net zero by 2070',700,14,GRN],'Year '+yr(sim)+' · CO₂ '+f0(met(sim,'co2'))+' ppm',['Warming: +'+f1(met(sim,'warm'))+' °C',700,13]]);} },
    { key: 'methane', lvl: 'honors', title: 'Methane matters', set: { path: 'bau', ch4: 'low' }, fresh: true, speed: 1.4, run(sim){act(sim,'clear');},
      cause: { from: { ch4: 'today' }, delay: 1, label: 'Methane emissions' },
      see: 'Same CO₂ path as business as usual, but methane emissions are cut. Warming by 2100 drops from about 3.1 °C to about 2.9 °C. Doubling methane instead would push it to about 3.7 °C.',
      why: 'Methane traps about 80 times as much heat as CO₂ over 20 years but breaks down in about a decade. Fixing leaks from gas wells and pipelines, capturing landfill gas and changing cattle feed pay off fast.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['Methane cut',700,14],'Year '+yr(sim),['Warming: +'+f1(met(sim,'warm'))+' °C',700,13,RED]]);} },
    { key: 'sens', lvl: 'ap', title: 'How sure are the numbers?', set: { path: 'bau', sens: 4.5 }, fresh: true, speed: 1.4, run(sim){act(sim,'clear');},
      cause: { from: { sens: 3 }, delay: 1, dur: 2, label: 'Climate sensitivity' },
      see: 'Climate sensitivity is the warming from doubling CO₂. The best estimate is 3 °C, with a likely range of about 2.5 to 4. At 4.5 °C, business as usual reaches about 4.7 °C by 2100; at 1.5 °C, about 1.6 °C.',
      why: 'Clouds and other feedbacks set the sensitivity, and they are the biggest source of uncertainty. But every value in the range gives significant warming, and cutting emissions lowers warming at every one.',
      overlay(sim,ctx,LH,k){CL(ctx,k,[['Sensitivity '+sim.p.sens.toFixed(1)+' °C',700,14],'Year '+yr(sim),['Warming: +'+f1(met(sim,'warm'))+' °C',700,13,RED]]);} },
    { key: 'ocean', lvl: 'ap', title: 'The other CO₂ problem', set: { path: 'bau' }, fresh: true, speed: 1.4, run(sim){act(sim,'clear');},
      see: 'Under business as usual, surface-ocean pH falls from about 8.05 to about 7.85 by 2100.',
      why: 'The ocean absorbs about a quarter of our CO₂, which forms carbonic acid. A 0.2 drop in pH is about 60% more H⁺, and it ties up the carbonate ions that corals, oysters and plankton use to build shells.',
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
      see: 'The cartoon cell steps through attachment, injection, replication, assembly and lysis. Red is phage DNA, blue is the cell’s own.',
      why: 'The phage injects only its DNA. The cell’s own machinery then copies that DNA and builds new phage, about 100 of them, until the cell bursts open.',
      overlay(sim,ctx,LH,k){VI(ctx,k,[['Virulent phage (T4)',700,14],'Infect → copy → burst','~100 new phage per cell']);} },
    { key: 'flask', title: 'A whole flask', set: { type: 'lytic' }, fresh: true, speed: 4,
      see: 'The bacteria multiply at first and the flask turns cloudy. Then phage numbers explode and the flask goes clear in about two hours.',
      why: 'Every burst releases about 100 phage, each ready to infect another cell. That is exponential growth, faster than the bacteria can divide.',
      overlay(sim,ctx,LH,k){VI(ctx,k,[['Lytic phage',700,14],'Bacteria: '+mil(met(sim,'bac')),'Phage: '+mil(met(sim,'phg')),'Cloudiness: '+f0(met(sim,'cloud'))+'%']);} },
    { key: 'temp', title: 'A phage that hides', set: { type: 'temperate' }, fresh: true, speed: 4,
      see: 'A temperate phage. Some infections burst the cell, but most tuck the phage DNA into the bacterium’s chromosome. The flask stays cloudy.',
      why: 'In the lysogenic cycle the phage DNA (a prophage) is copied quietly every time the cell divides. The virus spreads without killing anyone, for now.',
      overlay(sim,ctx,LH,k){VI(ctx,k,[['Temperate phage (λ)',700,14],'Bacteria: '+mil(met(sim,'bac')),'Hidden prophage: '+mil(met(sim,'lys')),'Cloudiness: '+f0(met(sim,'cloud'))+'%']);} },
    { key: 'uv', lvl: 'honors', title: 'Wake it with UV', set: { type: 'temperate' }, fresh: true, speed: 4,
      see: 'After about 2.5 hours the flask is shined with UV light. Most hidden prophages switch to the lytic cycle and the bacteria crash.',
      why: 'UV damages DNA. The prophage senses its host is in trouble and escapes by bursting the cell. A hidden virus can turn deadly when the cell is stressed.',
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'uv',9.5);VI(ctx,k,[[sim._ls_uv===sim.lnT0?'After UV':'Temperate, before UV',700,14],'Bacteria: '+mil(met(sim,'bac')),'Hidden prophage: '+mil(met(sim,'lys')),'Free phage: '+mil(met(sim,'phg'))]);} },
    { key: 'plaque', lvl: 'honors', title: 'Count phage with plaques', set: { type: 'lytic', dil: '7' }, fresh: true, speed: 4,
      see: 'After 2 hours a sample diluted 10 million times is spread on a lawn of bacteria. Each phage makes a clear spot, a plaque: about 30 of them.',
      why: 'Titer = plaques ÷ (dilution × volume) = 30 ÷ (10⁻⁷ × 0.1 mL) = 3 × 10⁹ phage per mL. Too concentrated and the plate is all clear; pick a dilution that gives 30 to 300 plaques.',
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'plate',8);VI(ctx,k,[['Plaque assay, 10⁻⁷',700,14],'Plaques: '+String(met(sim,'plq')||'—'),String(met(sim,'titer')||'')]);} },
    { key: 'hiv', lvl: 'ap', title: 'HIV, untreated', set: { type: 'hiv', drug: 'none' }, fresh: true, speed: 4,
      see: 'HIV infects helper T cells. Over months the viral load climbs and the T-cell count falls.',
      why: 'HIV is a retrovirus: reverse transcriptase copies its RNA into DNA, which is spliced into the cell’s chromosome. Each infected T cell makes more virus and dies, and the immune system loses the cells it needs to fight back.',
      overlay(sim,ctx,LH,k){HV(ctx,k,[['No treatment',700,13],'T cells: '+f0(met(sim,'tc'))+'/µL','Load: 10^'+f1(met(sim,'vlog'))]);} },
    { key: 'one', lvl: 'ap', title: 'One drug', set: { type: 'hiv', drug: 'one' }, fresh: true, speed: 4,
      see: 'A single drug works at first. Then a resistant strain takes over and the viral load comes back.',
      why: 'HIV copies itself carelessly, so a few mutants that resist the drug are already there. The drug kills the rest, and the resistant ones inherit the patient: natural selection in one body.',
      overlay(sim,ctx,LH,k){HV(ctx,k,[['One drug',700,13],'Load: 10^'+f1(met(sim,'vlog')),['Resistant: '+f0(met(sim,'res'))+'%',700,12.5,RED]]);} },
    { key: 'combo', lvl: 'ap', title: 'Three drugs at once', set: { type: 'hiv', drug: 'combo' }, fresh: true, speed: 4,
      see: 'With a three-drug combination the viral load falls below detection and T cells recover.',
      why: 'A virus would need three separate mutations at once to escape all three drugs, which almost never happens. That is why HIV treatment always uses combinations.',
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
      see: 'The 60 W bulb gives 800 lumens. The thermometer next to it climbs to about 47 °C.',
      why: 'Only about 5% of the electricity leaves as light. The other 95% heats the glowing filament, the bulb and the room.',
      overlay(sim,ctx,LH,k){EC(ctx,k,[['Incandescent, 60 W',700,14],'Becomes light: '+f0(met(sim,'lightpct'))+'%','Thermometer: '+f1(met(sim,'temp'))+' °C']);} },
    { key: 'led', title: 'An LED', set: { bulb: 'led', hours: 5 }, fresh: true, speed: 4,
      see: 'The LED gives the same 800 lumens from 9 W. The thermometer barely warms, to about 25 °C.',
      why: 'An LED turns about 35% of its electricity into light, seven times the old bulb’s share. Less wasted heat means far less power.',
      overlay(sim,ctx,LH,k){EC(ctx,k,[['LED, 9 W',700,14],'Becomes light: '+f0(met(sim,'lightpct'))+'%','Thermometer: '+f1(met(sim,'temp'))+' °C']);} },
    { key: 'kwh', title: 'Energy over a year', set: { bulb: 'incandescent', hours: 5 }, fresh: true, speed: 4,
      see: 'On 5 hours a day, the 60 W bulb uses about 110 kWh a year. The LED uses about 16 kWh.',
      why: 'Energy = power × time: 60 W × 5 h × 365 days = 109,500 Wh ≈ 110 kWh. You pay for kilowatt-hours, not watts.',
      overlay(sim,ctx,LH,k){EC(ctx,k,[['60 W × 5 h × 365 days',700,13.5],'= '+f0(met(sim,'kwh'))+' kWh per year','(LED: 16 kWh)']);} },
    { key: 'cost', lvl: 'honors', title: 'Cost, CO₂ and payback', set: { bulb: 'led', hours: 5 }, fresh: true, speed: 4,
      see: 'At 14¢ per kWh the LED costs $2.30 a year to run instead of $15.33, and its CO₂ drops from 60 kg to 9 kg. It pays for itself in under 2 months.',
      why: 'Cost = kWh × price, CO₂ = kWh × the grid’s kg per kWh. The LED saves about $13 a year per bulb, and it lasts about 25 times longer.',
      overlay(sim,ctx,LH,k){EC(ctx,k,[['LED per year',700,14],'Cost: $'+f2(met(sim,'cost'))+' · CO₂: '+f0(met(sim,'co2'))+' kg','Pays for itself: '+f1(met(sim,'payback'))+' months']);} },
    { key: 'grid', lvl: 'honors', title: 'A cleaner grid', set: { bulb: 'incandescent', hours: 5, grid: 0.2 }, fresh: true, speed: 4,
      cause: { from: { grid: 0.55 }, delay: 0.6, dur: 2, label: 'Grid CO₂' },
      see: 'Lower the grid’s CO₂ from 0.55 to 0.20 kg per kWh. The old bulb’s yearly CO₂ falls from 60 kg to 22 kg, with no change at home.',
      why: 'The same kWh makes less CO₂ when more of the grid’s power comes from wind, solar, hydro or nuclear. Both fixes stack: efficient bulbs and cleaner power.',
      overlay(sim,ctx,LH,k){EC(ctx,k,[['Grid: '+f2(sim.p.grid)+' kg CO₂/kWh',700,14],'CO₂ per year: '+f0(met(sim,'co2'))+' kg']);} },
    { key: 'chain', lvl: 'ap', title: 'Fuel to light', set: { bulb: 'incandescent', hours: 5 }, fresh: true, speed: 4,
      see: 'Follow 100 J of fuel: 35 J of electricity leaves the power plant, 33 J reaches the house, and only 1.6 J comes out as light.',
      why: 'Multiply the efficiencies: 0.35 × 0.94 × 0.05 = 1.6%. With an LED it is 0.35 × 0.94 × 0.35 = 11.5%. Every step of the chain loses energy as heat.',
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
      see: 'Watch a full day. Demand rises in the afternoon and evening. Solar follows the sun, wind comes and goes, and coal and gas fill the rest.',
      why: 'Supply must match demand every second. Coal and gas can be turned up or down, so they fill whatever wind and solar don’t cover.',
      overlay(sim,ctx,LH,k){GM(ctx,k,[['Demand: '+f0(met(sim,'demand'))+' MW',700,14],'From clean sources: '+f0(met(sim,'clean'))+'%','CO₂ right now: '+f0(met(sim,'co2'))+' t/h']);} },
    { key: 'renew', title: 'Wind and solar only', set: { coal: 0, gas: 0 }, fresh: true, speed: 2,
      see: 'Remove the coal and gas plants. When the sun sets and the wind drops, the city is hundreds of megawatts short: blackouts.',
      why: 'Wind and solar make no CO₂, but you can’t turn them up when you need them. A grid needs something that can follow demand.',
      overlay(sim,ctx,LH,k){GM(ctx,k,[['No coal, no gas',700,14],['Power short: '+f0(met(sim,'unmet'))+' MW',700,13.5,RED],'From clean sources: '+f0(met(sim,'clean'))+'%']);} },
    { key: 'gas', title: 'Swap coal for gas', set: { coal: 0, gas: 2000 }, fresh: true, speed: 2,
      see: 'Replace coal with more gas. The lights stay on, and CO₂ over 24 hours drops from about 15,000 t to about 6,700 t.',
      why: 'Gas plants burn fuel more efficiently and gas has less carbon per unit of energy, so each MWh makes about half the CO₂ of coal.',
      overlay(sim,ctx,LH,k){GM(ctx,k,[['Gas instead of coal',700,14],'CO₂ right now: '+f0(met(sim,'co2'))+' t/h','Power short: '+f0(met(sim,'unmet'))+' MW']);} },
    { key: 'calm', lvl: 'honors', title: 'A calm day', set: { calm: true }, fresh: true, speed: 2,
      see: 'No wind today. Coal and gas run harder all day, and the 24-hour CO₂ rises to about 19,500 t.',
      why: 'Wind farms only make power when it blows. Grid planners need enough firm power for the calmest, cloudiest days.',
      overlay(sim,ctx,LH,k){GM(ctx,k,[['Calm day',700,14],'Coal + gas: '+f0(met(sim,'fossil'))+' MW','CO₂ in last 24 h: '+f0(met(sim,'day'))+' t']);} },
    { key: 'battery', lvl: 'honors', title: 'Solar plus batteries', set: { coal: 0, gas: 1500, solar: 2000, battery: 1000 }, fresh: true, speed: 2,
      see: 'Build more solar and 1,000 MW of batteries. Midday extra solar charges them; they discharge in the evening. 24-hour CO₂ falls to about 2,600 t.',
      why: 'Batteries shift energy in time. They don’t make power, but they let sunshine at noon cover the 7 pm peak.',
      overlay(sim,ctx,LH,k){GM(ctx,k,[['Solar + batteries',700,14],'Battery charge: '+f0(met(sim,'soc'))+'%','Battery output: '+f0(met(sim,'batout'))+' MW','CO₂ in last 24 h: '+f0(met(sim,'day'))+' t']);} },
    { key: 'nuke', lvl: 'honors', title: 'Add nuclear', set: { coal: 0, gas: 900, nuclear: 1000 }, fresh: true, speed: 2,
      see: 'A 1,000 MW nuclear plant replaces coal. It runs steadily day and night, and 24-hour CO₂ drops to about 500 t.',
      why: 'Nuclear makes no CO₂ while running and doesn’t depend on weather. The trade-offs are cost, long build times and storing used fuel.',
      overlay(sim,ctx,LH,k){GM(ctx,k,[['Nuclear 1,000 MW',700,14],'From clean sources: '+f0(met(sim,'clean'))+'%','CO₂ in last 24 h: '+f0(met(sim,'day'))+' t']);} },
    { key: 'heat', lvl: 'ap', title: 'Waste heat', set: {}, fresh: true, speed: 2,
      see: 'Read the fuel heat burned and the waste heat. About two thirds of the fuel’s energy leaves the coal plant as heat in cooling towers.',
      why: 'A coal plant is about 33% efficient and a gas plant about 55%. Electricity out = fuel heat × efficiency; the rest is waste heat. 1 MWh = 3.412 MMBtu.',
      overlay(sim,ctx,LH,k){GM(ctx,k,[['Fossil output: '+f0(met(sim,'fossil'))+' MW',700,13.5],'Fuel heat in: '+f0(met(sim,'heatin'))+' MW thermal','Waste heat: '+f0(met(sim,'waste'))+' MW','Fuel energy: '+f0(met(sim,'btu'))+' MMBtu/h']);} }
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
})();
