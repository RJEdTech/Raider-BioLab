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
})();
