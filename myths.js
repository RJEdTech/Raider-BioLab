/* Myth or fact (idea from Dr. Sandy Robertson's ENSO Explorer, Nov 17, 2026).
   BioLab.addMyths({toolId:[{k,s,fact,why,lvl}]}): students pick Myth or Fact, one graded try, then read why.
   Mix in real facts so students can't just answer "myth" every time. Keep each statement one sentence. */
BioLab.addMyths({
plates:[
 {k:'float',s:'The continents float on a sea of melted rock.',fact:false,why:'The mantle under the plates is almost all solid rock. It flows very slowly, a few centimeters a year, like warm wax. Pockets of melt form only in certain places, such as above a sinking plate.'},
 {k:'speed',s:'Plates move about as fast as your fingernails grow.',fact:true,why:'Most plates move 2 to 10 cm a year. GPS stations measure it directly.'},
 {k:'ring',s:'Most of the world’s large earthquakes happen along plate boundaries.',fact:true,why:'Plates grind, pull apart or dive under each other at their edges. The Pacific “Ring of Fire” alone has about 80% of the largest quakes.'},
 {k:'colorado',s:'Colorado has no earthquakes because it is not on a plate boundary.',fact:false,why:'Quakes are rarer in the middle of a plate, but not absent. Colorado records small earthquakes most years, including some caused by injecting wastewater deep underground.'}
],
soil:[
 {k:'clay',s:'Clay soil holds the most water, so it is always best for plants.',fact:false,why:'Clay holds water but drains slowly and can drown roots. Loam, a mix of sand, silt and clay, holds water and still lets air reach roots.'},
 {k:'slow',s:'An inch of topsoil can take hundreds of years to form.',fact:true,why:'Rock breaks down and organic matter builds up slowly, so topsoil lost to erosion is not replaced on a human time scale.'},
 {k:'dirt',s:'Soil is just ground-up rock.',fact:false,why:'About half of good soil is pore space for air and water, and it holds organic matter and billions of living things in every handful.'},
 {k:'ph',s:'Soil pH changes how easily plants can take up nutrients.',fact:true,why:'At very low or high pH, nutrients like phosphorus bind to other minerals and roots can’t take them up, even when a soil test shows they are there.'}
],
seasons:[
 {k:'close',s:'Summer happens because Earth is closer to the Sun.',fact:false,why:'Earth is actually closest to the Sun in early January. Seasons come from Earth’s 23.5° tilt: in summer your half leans toward the Sun, so sunlight hits more directly and days are longer.'},
 {k:'opposite',s:'When it is summer in Colorado, it is winter in Australia.',fact:true,why:'The tilt points one hemisphere toward the Sun while the other leans away, so the seasons are opposite.'},
 {k:'equator',s:'Air rises at the equator and sinks around 30° north and south, which is why many deserts sit near 30°.',fact:true,why:'Rising air cools and drops its rain over the tropics. The dry air sinks near 30°, where the Sahara, the Atacama and Australia’s deserts are.'},
 {k:'wind',s:'Winds blow straight from high pressure to low pressure.',fact:false,why:'Earth’s spin bends moving air (the Coriolis effect), so the trade winds blow from the east and the westerlies from the west instead of straight north or south.'}
],
albedo:[
 {k:'snow',s:'Fresh snow reflects most of the sunlight that hits it.',fact:true,why:'Fresh snow reflects about 80 to 90%. Melting it exposes darker ground that absorbs more heat, which melts more snow.'},
 {k:'ocean',s:'Open ocean reflects more sunlight than sea ice.',fact:false,why:'Dark ocean water absorbs about 90% of sunlight; sea ice reflects most of it. As Arctic ice melts, the ocean warms faster.'},
 {k:'roof',s:'Painting roofs white can make a city cooler.',fact:true,why:'Light roofs reflect sunlight that a dark roof would turn into heat. Cool roofs can lower roof temperatures by tens of degrees and cut air conditioning use.'},
 {k:'black',s:'A black car and a white car parked in the sun get equally hot.',fact:false,why:'The black car absorbs far more sunlight, so its surface and inside get noticeably hotter.'}
],
enso:[
 {k:'every',s:'El Niño comes every year around Christmas.',fact:false,why:'Fishers named the warm current for the Christ child because it showed up near Christmas, but El Niño events come irregularly, every 2 to 7 years.'},
 {k:'warm',s:'During El Niño, warm water spreads east toward South America.',fact:true,why:'The trade winds weaken, so warm water that usually piles up near Indonesia slides east. Upwelling of cold water off Peru weakens.'},
 {k:'fish',s:'El Niño can hurt Peru’s anchovy catch.',fact:true,why:'Warm surface water caps the cold, nutrient-rich upwelling, plankton drops, and anchovies, the fish and the seabirds that eat them all suffer.'},
 {k:'all',s:'El Niño makes every place on Earth warmer and drier.',fact:false,why:'It shifts rain and heat. Indonesia and Australia often get drier, while Peru’s coast and the southern United States often get wetter.'}
]
});

/* Batch 2 (Nov 17, 2026): the rest of BioLab, in course order. */
BioLab.addMyths({
expdesign:[
 {k:'control',s:'A control group gets everything the experimental group gets except the one thing you are testing.',fact:true,why:'Then any difference in results can be traced to that one variable.'},
 {k:'prove',s:'One experiment can prove a hypothesis is true.',fact:false,why:'Results can support a hypothesis or rule it out. Repeated trials and other studies build confidence, but science stays open to new evidence.'},
 {k:'sample',s:'Testing more subjects makes chance less likely to explain your result.',fact:true,why:'Random differences average out over a bigger sample.'}
],
microscope:[
 {k:'mag',s:'Total magnification is the eyepiece power times the objective power.',fact:true,why:'A 10× eyepiece with a 40× objective magnifies 400×.'},
 {k:'coarse',s:'You should use the coarse focus knob on high power.',fact:false,why:'On high power the lens is very close to the slide. Coarse focus can crack the slide or lens; use fine focus.'},
 {k:'flip',s:'Under a light microscope, the letter “e” looks upside down and backward.',fact:true,why:'The lenses invert the image, so moving the slide left makes it look like it moves right.'}
],
cellexplorer:[
 {k:'plant',s:'Plant cells have mitochondria, not just chloroplasts.',fact:true,why:'Plants make sugar in chloroplasts and break it down for ATP in mitochondria, just like animals.'},
 {k:'wall',s:'Animal cells have a cell wall.',fact:false,why:'Animal cells have only a membrane. Plants, fungi and most bacteria have walls.'},
 {k:'nucleus',s:'Bacteria keep their DNA in a nucleus.',fact:false,why:'Bacteria are prokaryotes: their DNA sits in the cytoplasm in a region called the nucleoid.'}
],
sav:[
 {k:'small',s:'Cells are small because a small cell has more surface area for its volume.',fact:true,why:'Surface area grows with the square of size and volume with the cube, so big cells can’t move materials in and out fast enough.'},
 {k:'bigger',s:'A bigger agar cube turns pink all the way through faster than a small one.',fact:false,why:'The center of a big cube is farther from the surface, so diffusion takes much longer to reach it.'},
 {k:'folds',s:'Your small intestine is folded to add surface area.',fact:true,why:'Folds, villi and microvilli give it a huge area for absorbing food.'}
],
transport:[
 {k:'push',s:'Water moves by osmosis toward the side with more dissolved solutes.',fact:true,why:'Water moves toward the lower water concentration, which is the side with more solute.'},
 {k:'energy',s:'Diffusion needs energy from ATP.',fact:false,why:'Diffusion is passive: molecules spread from high to low concentration on their own. Moving against the gradient (active transport) needs ATP.'},
 {k:'salt',s:'A red blood cell put in pure water swells and can burst.',fact:true,why:'Water rushes in by osmosis. Animal cells have no wall to stop them from bursting.'}
],
potato:[
 {k:'lose',s:'A potato slice in very salty water loses mass.',fact:true,why:'Water leaves the potato cells by osmosis toward the saltier solution.'},
 {k:'equal',s:'At the isotonic point, no water molecules cross the membrane.',fact:false,why:'Water still crosses both ways, at equal rates, so the net change is zero.'},
 {k:'graph',s:'You find the isotonic concentration where the graph of mass change crosses zero.',fact:true,why:'That is where the potato neither gains nor loses mass.'}
],
wpotential:[
 {k:'high',s:'Water moves from higher water potential to lower water potential.',fact:true,why:'That is how water moves from soil into roots and up toward leaves.'},
 {k:'pure',s:'Adding solute raises the water potential.',fact:false,why:'Solutes make Ψs more negative, which lowers the water potential.'},
 {k:'zero',s:'Pure water in an open beaker has a water potential of zero.',fact:true,why:'Zero is the reference point. Anything with solute has a negative Ψs.'}
],
lifebonds:[
 {k:'chon',s:'Most of the mass of living things comes from just a few elements: C, H, O and N.',fact:true,why:'With small amounts of P and S, they make up the vast majority of your body’s atoms.'},
 {k:'hbond',s:'Hydrogen bonds are stronger than covalent bonds.',fact:false,why:'They are much weaker, which is why DNA strands can unzip while each strand stays intact.'},
 {k:'carbon',s:'Carbon is the backbone of life’s molecules because it forms four bonds.',fact:true,why:'It can build chains, rings and branches in endless shapes.'}
],
water:[
 {k:'ice',s:'Ice floats because it is less dense than liquid water.',fact:true,why:'Hydrogen bonds hold ice in an open lattice. That keeps lakes from freezing solid, so fish survive winter.'},
 {k:'sticky',s:'Water climbs up a thin tube because it is pulled by air pressure.',fact:false,why:'That is capillary action: water sticks to the glass (adhesion) and to itself (cohesion).'},
 {k:'heat',s:'Water’s high specific heat helps keep your body temperature steady.',fact:true,why:'It takes a lot of energy to change water’s temperature, and you are mostly water.'}
],
waterprops:[
 {k:'drops',s:'You can fit many drops of water on a penny because of surface tension.',fact:true,why:'Cohesion between water molecules forms a skin that bulges before it spills.'},
 {k:'polar',s:'Water is nonpolar.',fact:false,why:'Water is polar: oxygen pulls shared electrons, so it is slightly negative and the hydrogens slightly positive.'},
 {k:'solvent',s:'Water dissolves more substances than almost any other liquid.',fact:true,why:'Its partial charges surround ions and polar molecules, which is why it is called the universal solvent.'}
],
phlife:[
 {k:'stomach',s:'Your stomach acid has a pH around 1.5 to 3.5.',fact:true,why:'That strong acid helps digest protein and kills many microbes.'},
 {k:'buffer',s:'A buffer stops pH from changing at all.',fact:false,why:'It resists change. Add enough acid or base and it is overwhelmed.'},
 {k:'enz',s:'A change in pH can stop an enzyme from working.',fact:true,why:'It changes the charges on the enzyme, which can change its shape and its active site.'}
],
macromolecules:[
 {k:'four',s:'Carbohydrates, lipids, proteins and nucleic acids are the four main kinds of large molecules in living things.',fact:true,why:'Each is built from smaller units: sugars, fatty acids and glycerol, amino acids, and nucleotides.'},
 {k:'water',s:'Dehydration synthesis adds water to join two molecules.',fact:false,why:'It removes a water molecule to make a bond. Hydrolysis adds water to break one.'},
 {k:'fat',s:'Fat stores more energy per gram than carbohydrate.',fact:true,why:'About 9 Calories per gram versus about 4.'}
],
foodtests:[
 {k:'iodine',s:'Iodine turns blue-black when starch is present.',fact:true,why:'Iodine fits inside the coiled starch molecule and changes color.'},
 {k:'heat',s:'Benedict’s test for sugar works without heating.',fact:false,why:'You heat it in a water bath. Reducing sugars then turn it from blue to green, orange or brick red.'},
 {k:'control',s:'Water is tested too, as a negative control.',fact:true,why:'It shows what “no nutrient” looks like, so you can tell a real color change.'}
],
enzymes:[
 {k:'used',s:'An enzyme is used up after it speeds up one reaction.',fact:false,why:'Enzymes are reused thousands of times. They leave each reaction unchanged.'},
 {k:'hot',s:'Raising the temperature always makes an enzyme work faster.',fact:false,why:'Up to a point. Too hot and the enzyme denatures, losing its shape and its activity.'},
 {k:'fit',s:'An enzyme’s shape lets it bind only certain substrates.',fact:true,why:'The active site fits specific molecules, like a lock and key (or a hand fitting a glove).'}
],
signaling:[
 {k:'enter',s:'Epinephrine has to enter a liver cell to make it release glucose.',fact:false,why:'It binds a receptor on the surface. A chain of signals inside the cell carries the message.'},
 {k:'amp',s:'One hormone molecule can lead to millions of glucose molecules being released.',fact:true,why:'Each step in the signal cascade activates many molecules at the next step.'},
 {k:'receptor',s:'A cell responds only to signals it has receptors for.',fact:true,why:'That is why a hormone in the blood affects some tissues and not others.'}
],
neuron:[
 {k:'all',s:'An action potential is all-or-none: it fires fully or not at all.',fact:true,why:'A stronger stimulus makes neurons fire more often, not make bigger spikes.'},
 {k:'10',s:'You only use 10 percent of your brain.',fact:false,why:'Brain scans show activity throughout the brain, and damage to almost any part causes problems.'},
 {k:'myelin',s:'Myelin makes signals travel faster along an axon.',fact:true,why:'The signal jumps between gaps in the myelin, much faster than creeping along the whole membrane.'}
],
homeostasis:[
 {k:'neg',s:'Negative feedback brings a change back toward normal.',fact:true,why:'When blood sugar rises, insulin brings it back down.'},
 {k:'sweat',s:'Sweat cools you because the sweat itself is cold.',fact:false,why:'It cools you as it evaporates. Turning liquid into vapor takes heat from your skin.'},
 {k:'insulin',s:'Insulin lowers blood sugar.',fact:true,why:'It signals cells to take up glucose and the liver to store it as glycogen.'}
],
chloroplast:[
 {k:'o2',s:'The oxygen plants release comes from carbon dioxide.',fact:false,why:'It comes from splitting water in the light reactions. The carbon from CO₂ ends up in sugar.'},
 {k:'calvin',s:'The Calvin cycle uses ATP and NADPH from the light reactions to make sugar.',fact:true,why:'The light reactions capture energy; the Calvin cycle uses it to fix CO₂.'},
 {k:'green',s:'Chlorophyll absorbs green light best.',fact:false,why:'It absorbs red and blue best and reflects green, which is why leaves look green.'}
],
photosynthesis:[
 {k:'mass',s:'Most of a tree’s mass comes from the soil.',fact:false,why:'Most comes from carbon dioxide in the air, built into sugar and then wood. Soil supplies only small amounts of minerals.'},
 {k:'light',s:'More light speeds up photosynthesis only up to a point.',fact:true,why:'Then something else, like CO₂ or temperature, limits the rate.'},
 {k:'resp',s:'Plants also do cellular respiration.',fact:true,why:'They break down sugar for ATP day and night, like animals.'}
],
respiration:[
 {k:'breath',s:'Cellular respiration is the same thing as breathing.',fact:false,why:'Breathing moves air. Cellular respiration happens in your cells, using oxygen to turn glucose into ATP.'},
 {k:'atp',s:'Most of the ATP from glucose is made in the mitochondria.',fact:true,why:'The electron transport chain there makes about 26 to 34 ATP; glycolysis makes only 2.'},
 {k:'co2',s:'The carbon dioxide you breathe out comes from the food you broke down.',fact:true,why:'The carbon atoms in glucose leave as CO₂ in the Krebs cycle.'}
],
glycolysis:[
 {k:'o2',s:'Glycolysis needs oxygen.',fact:false,why:'Glycolysis runs without oxygen. Oxygen is needed at the end of the electron transport chain.'},
 {k:'ferm',s:'Yeast fermentation makes the CO₂ that makes bread rise.',fact:true,why:'Without oxygen, yeast turns pyruvate into ethanol and CO₂; the gas bubbles puff up the dough.'},
 {k:'burn',s:'Muscle soreness a day or two after exercise is caused by lactic acid.',fact:false,why:'Lactate clears within about an hour. Next-day soreness comes from tiny damage to muscle fibers.'}
],
transpiration:[
 {k:'pull',s:'Water evaporating from leaves pulls water up from the roots.',fact:true,why:'Cohesion links water molecules into a chain, so evaporation at the top tugs the whole column up.'},
 {k:'pump',s:'Plants have a heart-like pump to move water.',fact:false,why:'No pump: evaporation, cohesion and adhesion move water up.'},
 {k:'wind',s:'Wind and heat make plants lose water faster.',fact:true,why:'They speed evaporation from the stomata.'}
],
cellcycle:[
 {k:'cancer',s:'Cancer is cells dividing without the normal checkpoints stopping them.',fact:true,why:'Mutations in genes that control the cell cycle let damaged cells keep dividing.'},
 {k:'most',s:'Cells spend most of their life dividing.',fact:false,why:'Most of the cycle is interphase, when the cell grows and copies its DNA.'},
 {k:'p53',s:'The p53 protein can stop a cell with damaged DNA from dividing.',fact:true,why:'It is called the “guardian of the genome”; it is mutated in about half of human cancers.'}
],
division:[
 {k:'mitosis',s:'Mitosis makes two cells with the same chromosomes as the parent.',fact:true,why:'It is for growth and repair. Meiosis makes gametes with half the chromosomes.'},
 {k:'meiosis',s:'Meiosis makes four identical cells.',fact:false,why:'It makes four cells that differ from each other, because of crossing over and independent assortment.'},
 {k:'skin',s:'Your skin cells divide by mitosis.',fact:true,why:'Body cells divide by mitosis; only cells that make eggs or sperm use meiosis.'}
],
roottip:[
 {k:'tip',s:'Onion root tips are used because cells there divide a lot.',fact:true,why:'Root tips grow fast, so many cells are caught in different phases of mitosis.'},
 {k:'time',s:'If 10% of the cells you count are in metaphase, metaphase takes about 10% of the cell cycle.',fact:true,why:'The share of cells in a phase estimates the share of time spent in it.'},
 {k:'see',s:'You can watch one cell go through every phase on a stained slide.',fact:false,why:'Staining kills the cells. Each cell is frozen in one phase, so you compare many cells.'}
],
karyotype:[
 {k:'46',s:'Most human body cells have 46 chromosomes.',fact:true,why:'23 pairs: 22 pairs of autosomes and one pair of sex chromosomes.'},
 {k:'down',s:'Down syndrome is caused by an extra copy of chromosome 21.',fact:true,why:'Three copies of chromosome 21 (trisomy 21), usually from nondisjunction during meiosis.'},
 {k:'gene',s:'A karyotype can show a single-letter change in a gene.',fact:false,why:'It shows whole chromosomes. Point mutations need DNA sequencing.'}
],
crosses:[
 {k:'dom',s:'A dominant trait is always the most common one in a population.',fact:false,why:'Dominant only means it shows when one copy is present. Polydactyly is dominant but rare.'},
 {k:'31',s:'Two heterozygous parents give about a 3:1 ratio of dominant to recessive traits in their offspring.',fact:true,why:'Aa × Aa gives AA, Aa, Aa, aa; three show the dominant trait.'},
 {k:'chance',s:'If two carriers already have one child with a recessive trait, the next child can’t have it.',fact:false,why:'Each child is a new 1-in-4 chance. Past children don’t change the odds.'}
],
bloodtype:[
 {k:'o',s:'Type O negative blood can be given to almost anyone in an emergency.',fact:true,why:'Its red cells have no A, B or Rh antigens for the patient’s antibodies to attack.'},
 {k:'ab',s:'Type AB is a blend of A and B, so it is weaker.',fact:false,why:'A and B are codominant: both antigens show fully on the cells.'},
 {k:'parents',s:'Two type O parents can have a type A child.',fact:false,why:'Both parents are ii, so every child is ii, type O (barring very rare exceptions).'}
],
pedigree:[
 {k:'skip',s:'A recessive trait can skip a generation.',fact:true,why:'Carrier parents can show no trait and still pass it on.'},
 {k:'xlinked',s:'X-linked recessive traits show up more often in males.',fact:true,why:'Males have one X, so one recessive allele is enough. Color blindness is an example.'},
 {k:'square',s:'In a pedigree, circles are males.',fact:false,why:'Squares are males and circles are females. Shading means the person has the trait.'}
],
replication:[
 {k:'semi',s:'Each new DNA molecule keeps one old strand and one new strand.',fact:true,why:'That is semiconservative replication, shown by Meselson and Stahl in 1958.'},
 {k:'both',s:'Both new strands are built in one smooth piece.',fact:false,why:'The lagging strand is built in short Okazaki fragments, because DNA polymerase only builds in one direction.'},
 {k:'pair',s:'A always pairs with T and G with C.',fact:true,why:'Their shapes and hydrogen bonds fit only those pairs.'}
],
expression:[
 {k:'same',s:'Your skin cells and nerve cells have the same DNA.',fact:true,why:'They switch on different genes, which makes them different.'},
 {k:'dna',s:'Ribosomes read DNA directly to make proteins.',fact:false,why:'DNA is copied into mRNA first (transcription). Ribosomes read the mRNA (translation).'},
 {k:'codon',s:'Each codon is three bases long.',fact:true,why:'Three bases give 64 combinations, enough for 20 amino acids plus stop signals.'}
],
lacoperon:[
 {k:'lac',s:'Bacteria make lactose-digesting enzymes all the time.',fact:false,why:'The genes stay off until lactose is present, which saves energy.'},
 {k:'repressor',s:'A repressor protein blocks transcription when lactose is absent.',fact:true,why:'Lactose binds the repressor and makes it let go of the DNA.'},
 {k:'glucose',s:'If glucose is plentiful, the lac genes stay mostly off even with lactose around.',fact:true,why:'Bacteria prefer glucose. Low glucose raises cAMP, which helps turn the operon fully on.'}
],
protein:[
 {k:'shape',s:'A protein’s shape decides what it can do.',fact:true,why:'Its folded shape forms the site that binds other molecules.'},
 {k:'cook',s:'Cooking an egg changes its amino acids.',fact:false,why:'Heat unfolds (denatures) the proteins. The amino acid chain is the same; only the shape changes.'},
 {k:'sickle',s:'A single amino acid change can cause sickle-cell disease.',fact:true,why:'One swap in hemoglobin makes the molecules clump and bend red cells.'}
],
virus:[
 {k:'alive',s:'Viruses can reproduce on their own.',fact:false,why:'They need a host cell’s machinery to copy themselves.'},
 {k:'antib',s:'Antibiotics kill viruses.',fact:false,why:'Antibiotics target bacteria. They don’t work on colds or flu.'},
 {k:'lyso',s:'In the lysogenic cycle, a virus’s DNA can hide in the host’s DNA for many generations.',fact:true,why:'It is copied along with the host DNA until something triggers the lytic cycle.'}
],
evolution:[
 {k:'need',s:'Animals evolve new traits because they need them.',fact:false,why:'Variations arise by random mutation. Selection favors the ones that happen to help.'},
 {k:'pop',s:'Individuals don’t evolve; populations do.',fact:true,why:'Evolution is a change in allele frequencies in a population over generations.'},
 {k:'drift',s:'In a small population, an allele can be lost just by chance.',fact:true,why:'That is genetic drift. It is strongest in small populations.'}
],
beaks:[
 {k:'finch',s:'Finch beak sizes on the Galápagos changed within a few years after a drought.',fact:true,why:'Peter and Rosemary Grant measured it: after the 1977 drought, survivors had larger beaks that could crack hard seeds.'},
 {k:'grow',s:'A bird’s beak gets bigger because it uses it more.',fact:false,why:'Beak size is mostly inherited. Birds born with beaks that fit the food survive and pass them on.'},
 {k:'var',s:'Natural selection needs variation in the population.',fact:true,why:'If everyone were the same, there would be nothing to select among.'}
],
hardyweinberg:[
 {k:'eq',s:'Hardy–Weinberg equilibrium means a population is not evolving.',fact:true,why:'Allele frequencies stay the same only if there is no selection, mutation, migration, drift or nonrandom mating.'},
 {k:'dom',s:'Dominant alleles always become more common over time.',fact:false,why:'Without selection, allele frequencies stay the same no matter which allele is dominant.'},
 {k:'2pq',s:'2pq is the frequency of heterozygotes.',fact:true,why:'p² + 2pq + q² = 1; 2pq is the share of carriers.'}
],
cladogram:[
 {k:'ladder',s:'Humans evolved from chimpanzees.',fact:false,why:'Humans and chimpanzees share a common ancestor that lived about 6 to 7 million years ago. Neither came from the other.'},
 {k:'node',s:'Each branch point on a cladogram stands for a common ancestor.',fact:true,why:'The groups that branch from it share traits from that ancestor.'},
 {k:'birds',s:'Birds are more closely related to crocodiles than to lizards.',fact:true,why:'Birds and crocodilians are archosaurs, sharing a more recent common ancestor.'}
],
hominids:[
 {k:'line',s:'Human evolution was a straight line from one species to the next.',fact:false,why:'It was a branching bush. Several hominin species lived at the same time, like Neanderthals and early Homo sapiens.'},
 {k:'nean',s:'Many people today carry a little Neanderthal DNA.',fact:true,why:'Most people with ancestry from outside Africa carry about 1 to 2%.'},
 {k:'skull',s:'Measuring skulls is one way scientists compare hominin species.',fact:true,why:'Brain volume, jaw shape and teeth all change across species.'}
],
molclock:[
 {k:'clock',s:'The more DNA differences two species have, the longer ago they likely split.',fact:true,why:'Mutations build up at a roughly steady rate, so differences estimate time since a common ancestor.'},
 {k:'exact',s:'The molecular clock gives an exact date with no uncertainty.',fact:false,why:'Mutation rates vary, so it is calibrated with fossils and gives a range.'},
 {k:'gene',s:'Different genes can tick at different rates.',fact:true,why:'Genes under strong selection change slowly; others change faster.'}
],
antibiotic:[
 {k:'person',s:'People become resistant to antibiotics.',fact:false,why:'Bacteria become resistant. Antibiotics kill the susceptible ones, and resistant survivors multiply.'},
 {k:'finish',s:'Taking antibiotics when you don’t need them helps resistance spread.',fact:true,why:'Every use selects for resistant bacteria, so doctors avoid prescribing them for viruses.'},
 {k:'fast',s:'Resistance can evolve in bacteria within days or weeks.',fact:true,why:'Bacteria can divide every 20 minutes or so, so many generations pass quickly.'}
],
epidemic:[
 {k:'herd',s:'Herd immunity protects people who can’t be vaccinated.',fact:true,why:'If enough people are immune, a disease can’t find enough new hosts to spread.'},
 {k:'r0',s:'If each sick person infects fewer than one other person on average, an outbreak shrinks.',fact:true,why:'With R below 1, each round of infections is smaller than the last.'},
 {k:'all',s:'Herd immunity needs everyone to be immune.',fact:false,why:'It needs a high enough share. For measles that is about 95%; for less contagious diseases it is lower.'}
],
niche:[
 {k:'same',s:'Two species can’t share exactly the same niche in the same place for long.',fact:true,why:'That is competitive exclusion. One outcompetes the other, or they divide resources.'},
 {k:'warblers',s:'Warblers feeding in different parts of the same tree is an example of resource partitioning.',fact:true,why:'MacArthur showed five warbler species split up spruce trees by height and branch area.'},
 {k:'habitat',s:'A species’ niche is just where it lives.',fact:false,why:'That is its habitat. A niche is its whole role: what it eats, when it is active, and what conditions it tolerates.'}
],
commons:[
 {k:'tragedy',s:'When a shared resource has no limits, each user taking a bit more can ruin it for all.',fact:true,why:'Each person gets the full gain from taking more but shares the cost.'},
 {k:'cod',s:'The Newfoundland cod fishery collapsed in the early 1990s from overfishing.',fact:true,why:'Canada closed it in 1992, and about 30,000 people lost work.'},
 {k:'only',s:'Private ownership is the only way to prevent a tragedy of the commons.',fact:false,why:'Elinor Ostrom won a Nobel Prize (2009) for showing communities often manage shared resources well with their own rules.'}
],
carboncycle:[
 {k:'rising',s:'Atmospheric CO₂ is higher now than at any time in at least 800,000 years.',fact:true,why:'Ice cores show it stayed between about 180 and 300 ppm; it is now over 420 ppm.'},
 {k:'ocean',s:'The oceans absorb about a quarter of the CO₂ people emit.',fact:true,why:'That slows warming but makes the ocean more acidic.'},
 {k:'trees',s:'Planting trees alone can cancel out today’s fossil fuel emissions.',fact:false,why:'Forests help, but emissions are far larger than new trees can absorb. Cutting emissions matters most.'}
],
productivity:[
 {k:'dark',s:'In the light and dark bottle lab, oxygen drops in the dark bottle because organisms are respiring.',fact:true,why:'With no light there is no photosynthesis, so only respiration changes the oxygen.'},
 {k:'gross',s:'Net productivity is larger than gross productivity.',fact:false,why:'Net = gross − respiration, so net is always smaller.'},
 {k:'ocean',s:'Tiny phytoplankton make roughly half of Earth’s oxygen.',fact:true,why:'Ocean photosynthesis is about half of the global total.'}
],
energy:[
 {k:'ten',s:'Only about 10% of the energy at one trophic level passes to the next.',fact:true,why:'Most is used for life processes and lost as heat.'},
 {k:'top',s:'Top predators have the most energy available to them.',fact:false,why:'They have the least. That is why there are far fewer hawks than mice.'},
 {k:'mag',s:'Some toxins become more concentrated at each step up a food chain.',fact:true,why:'That is biomagnification. DDT thinned eagle eggshells this way.'}
],
biomes:[
 {k:'rain',s:'Temperature and rainfall mostly decide which biome forms.',fact:true,why:'They control which plants can grow, and the plants shape the rest.'},
 {k:'desert',s:'All deserts are hot.',fact:false,why:'Deserts are defined by low rainfall. Antarctica is the world’s largest desert.'},
 {k:'soil',s:'Tropical rainforest soil is usually thin and poor in nutrients.',fact:true,why:'Nutrients are held in the living plants, and heavy rain washes the soil out.'}
],
biodiversity:[
 {k:'count',s:'Two areas with the same number of species have the same biodiversity.',fact:false,why:'Diversity also depends on evenness. An area dominated by one species is less diverse.'},
 {k:'more',s:'Sampling more area usually finds more species.',fact:true,why:'Rare species show up only as you sample more.'},
 {k:'serv',s:'Ecosystems provide services like pollination and clean water.',fact:true,why:'Losing species can weaken those services.'}
],
islandbio:[
 {k:'big',s:'Larger islands usually hold more species.',fact:true,why:'More area means more habitats and lower extinction rates.'},
 {k:'far',s:'Islands far from the mainland get more new species than nearby ones.',fact:false,why:'Fewer colonists reach distant islands, so they usually have fewer species.'},
 {k:'parks',s:'Small, isolated parks act like islands for wildlife.',fact:true,why:'That is why wildlife corridors linking parks help.'}
],
succession:[
 {k:'primary',s:'Primary succession starts on bare rock with no soil.',fact:true,why:'Lichens and mosses break down rock and start soil, as after a glacier retreats or a lava flow.'},
 {k:'fire',s:'After a forest fire, succession starts from bare rock.',fact:false,why:'The soil survives, so it is secondary succession, much faster.'},
 {k:'aspen',s:'In Colorado, aspen often grow back first after a fire before conifers return.',fact:true,why:'Aspen sprout from roots that survive fire and thrive in sun.'}
],
popgrowth:[
 {k:'k',s:'A population grows fastest when it is about half of its carrying capacity.',fact:true,why:'In logistic growth, growth is fastest at K/2, then slows as resources get scarce.'},
 {k:'forever',s:'A population with plenty of food will keep growing forever.',fact:false,why:'Something eventually limits it: space, disease, predators or waste.'},
 {k:'exp',s:'With unlimited resources, populations grow exponentially.',fact:true,why:'Each generation adds more individuals than the last, a J-shaped curve.'}
],
predprey:[
 {k:'lag',s:'Predator numbers usually peak a little after prey numbers peak.',fact:true,why:'Predators need time to reproduce after food becomes plentiful.'},
 {k:'gone',s:'Predators usually wipe out their prey completely.',fact:false,why:'As prey get scarce, predators starve and decline, letting the prey recover.'},
 {k:'lynx',s:'Hudson’s Bay Company fur records show hare and lynx populations cycling about every 10 years.',fact:true,why:'Trapping records from the 1800s are a classic data set.'}
],
wolfmoose:[
 {k:'wolves',s:'Removing wolves always helps moose.',fact:false,why:'Moose may boom, then overeat their food and crash.'},
 {k:'isle',s:'On Isle Royale, wolf and moose numbers have been tracked since 1958.',fact:true,why:'It is one of the longest-running predator–prey studies in the world.'},
 {k:'cascade',s:'Predators can affect plants by changing how many plant-eaters there are.',fact:true,why:'That is a trophic cascade.'}
],
humanpop:[
 {k:'8b',s:'There are more than 8 billion people on Earth.',fact:true,why:'The UN estimated the world passed 8 billion in November 2022.'},
 {k:'forever',s:'World population is expected to keep growing at its current rate forever.',fact:false,why:'Growth is slowing as birth rates fall. The UN projects a peak around 10.3 billion in the 2080s.'},
 {k:'transition',s:'As countries develop, death rates usually fall before birth rates do.',fact:true,why:'That gap is the fast-growth stage of the demographic transition.'}
],
climate:[
 {k:'weather',s:'A cold winter week proves the climate isn’t warming.',fact:false,why:'Weather is day to day. Climate is the long-term average, which is rising.'},
 {k:'ghg',s:'Greenhouse gases warm Earth by trapping heat that the surface gives off.',fact:true,why:'They absorb infrared radiation and send some back down.'},
 {k:'wedges',s:'No single action can solve climate change, so plans combine many “wedges.”',fact:true,why:'Each wedge, like efficiency or wind power, cuts a slice of future emissions.'}
],
farm:[
 {k:'more',s:'Adding more fertilizer always means a bigger harvest.',fact:false,why:'Past a point, the yield levels off and extra fertilizer washes into streams.'},
 {k:'drip',s:'Drip irrigation wastes less water than flooding a field.',fact:true,why:'It puts water near the roots, with less lost to evaporation and runoff.'},
 {k:'ipm',s:'Integrated pest management uses pesticides only when needed.',fact:true,why:'It combines crop rotation, natural predators and monitoring, which slows resistance.'}
],
gmotrial:[
 {k:'pair',s:'Testing seeds side by side in the same field makes a fair comparison.',fact:true,why:'Pairing cancels out differences in soil and water.'},
 {k:'one',s:'One field that does better proves the new seed is better.',fact:false,why:'Fields vary by chance. Many replicates and a statistical test are needed.'},
 {k:'random',s:'Assigning seeds to plots randomly helps keep results fair.',fact:true,why:'It keeps hidden differences from favoring one seed.'}
],
footprint:[
 {k:'equal',s:'Everyone on Earth has about the same carbon footprint.',fact:false,why:'They differ hugely. The average American emits several times the world average.'},
 {k:'travel',s:'Flying and driving are among the biggest parts of many people’s footprints.',fact:true,why:'Burning fuel releases CO₂ directly; one long flight can add tons.'},
 {k:'food',s:'Beef has a much bigger carbon footprint than beans per gram of protein.',fact:true,why:'Cattle need lots of land and feed and release methane.'}
],
treecarbon:[
 {k:'old',s:'Big old trees store far more carbon than young trees.',fact:true,why:'Carbon storage grows with trunk mass, which grows quickly with diameter.'},
 {k:'offset',s:'Planting one tree offsets a year of one person’s driving.',fact:false,why:'A young tree stores only a few kilograms of CO₂ a year; a year of driving emits several tons.'},
 {k:'dbh',s:'Foresters estimate tree carbon from trunk diameter at chest height.',fact:true,why:'Diameter at breast height (DBH) predicts mass through tested equations.'}
],
mining:[
 {k:'ore',s:'Ore grades have dropped, so more rock is dug for each ton of copper.',fact:true,why:'Copper ore averaged several percent around 1900; today it is often under 1%.'},
 {k:'reclaim',s:'Once a mine closes, the land recovers by itself quickly.',fact:false,why:'Reclamation takes planning and years: replacing soil, replanting and treating acid drainage.'},
 {k:'phone',s:'Your phone contains metals that had to be mined.',fact:true,why:'Copper, gold, cobalt and rare earth elements, among others.'}
],
energycalc:[
 {k:'led',s:'An LED bulb uses much less electricity than an incandescent bulb for the same light.',fact:true,why:'About 75 to 80% less. Incandescent bulbs turn most energy into heat.'},
 {k:'off',s:'Devices use no power when they are turned off but plugged in.',fact:false,why:'Many draw standby power. Chargers and TVs can add up over a year.'},
 {k:'kwh',s:'A kilowatt-hour is the energy used by a 1,000-watt device in one hour.',fact:true,why:'Electric bills charge by the kilowatt-hour.'}
],
gridmix:[
 {k:'store',s:'Electricity on the grid has to be made at the same moment it is used, unless it is stored.',fact:true,why:'That is why grid operators balance supply and demand every second.'},
 {k:'solar',s:'Solar panels make the most power at night.',fact:false,why:'They need sunlight, which is why grids need storage or other sources after sunset.'},
 {k:'peak',s:'Demand for electricity often peaks in the late afternoon and evening.',fact:true,why:'Air conditioners, cooking and lights all run then.'}
],
evwhatif:[
 {k:'zero',s:'An electric car produces zero emissions no matter how the electricity is made.',fact:false,why:'No tailpipe emissions, but the power plant matters. Cleaner grids make EVs cleaner.'},
 {k:'eff',s:'Electric motors turn much more of their energy into motion than gas engines do.',fact:true,why:'About 85 to 90% for electric motors, versus about 25 to 35% for gas engines.'},
 {k:'grid',s:'If every car were electric, the grid would need more power.',fact:true,why:'Charging millions of cars adds demand, especially if everyone charges at once.'}
],
smog:[
 {k:'inv',s:'A thermal inversion traps pollution near the ground.',fact:true,why:'Warm air above cold air stops the cold air from rising, so smog builds up, as in Denver’s “brown cloud.”'},
 {k:'ozone',s:'Ozone is always good for us.',fact:false,why:'High up it blocks UV. At ground level it is a pollutant that harms lungs.'},
 {k:'sun',s:'Ground-level ozone forms more on hot, sunny days.',fact:true,why:'Sunlight drives reactions between car exhaust and other pollutants.'}
],
acidrain:[
 {k:'normal',s:'Normal rain is slightly acidic.',fact:true,why:'CO₂ dissolves in rain to make carbonic acid, so clean rain is about pH 5.6.'},
 {k:'all',s:'Acid rain hurts every lake equally.',fact:false,why:'Lakes on limestone are buffered. Lakes on granite, common in mountains, are hurt most.'},
 {k:'law',s:'Cutting sulfur dioxide from power plants has reduced acid rain in the U.S.',fact:true,why:'The 1990 Clean Air Act amendments cut SO₂ emissions dramatically.'}
],
eutrophication:[
 {k:'more',s:'Adding nutrients to a lake always helps fish.',fact:false,why:'Extra nutrients feed algae blooms. When the algae die, decay uses up oxygen and fish suffocate.'},
 {k:'dead',s:'Runoff from farms helps cause a “dead zone” in the Gulf of Mexico each summer.',fact:true,why:'Nitrogen and phosphorus from the Mississippi feed algae; their decay drains the oxygen.'},
 {k:'phos',s:'Phosphorus is often the nutrient that limits algae growth in lakes.',fact:true,why:'That is why many places limit phosphates in detergents and fertilizers.'}
],
ld50:[
 {k:'dose',s:'Anything can be toxic at a high enough dose.',fact:true,why:'Even water and salt. “The dose makes the poison.”'},
 {k:'lower',s:'A higher LD50 means a substance is more toxic.',fact:false,why:'LD50 is the dose that kills half the test group. A lower LD50 means a smaller dose kills, so it is more toxic.'},
 {k:'natural',s:'Natural substances are always safe.',fact:false,why:'Some of the most toxic substances, like botulinum toxin, are natural.'}
],
dissection:[
 {k:'pig',s:'A fetal pig has organ systems very similar to a human’s.',fact:true,why:'Both are mammals, with the same basic heart, lungs, digestive tract and more.'},
 {k:'heart',s:'Insects have no heart.',fact:false,why:'A grasshopper has a tube-shaped heart along its back that pumps hemolymph.'},
 {k:'cord',s:'The umbilical cord carries nutrients and oxygen to the fetus.',fact:true,why:'It connects the fetus to the placenta.'}
],
pillbug:[
 {k:'insect',s:'Pill bugs are insects.',fact:false,why:'They are crustaceans, related to shrimp and crabs. They breathe with gill-like structures, which is why they like damp places.'},
 {k:'choose',s:'A choice chamber lets you test which conditions an animal prefers.',fact:true,why:'Count where the animals gather over time.'},
 {k:'random',s:'Even with no preference, the counts on each side won’t be exactly equal.',fact:true,why:'Chance alone causes some difference. A chi-square test checks whether it is bigger than chance.'}
],
gel:[
 {k:'small',s:'In gel electrophoresis, smaller DNA pieces travel farther.',fact:true,why:'They slip through the gel more easily.'},
 {k:'charge',s:'DNA moves toward the negative electrode.',fact:false,why:'DNA is negatively charged, so it moves toward the positive electrode. “Run to red.”'},
 {k:'ladder',s:'A DNA ladder lets you estimate the size of your fragments.',fact:true,why:'It has pieces of known size to compare against.'}
],
pcr:[
 {k:'double',s:'Each PCR cycle roughly doubles the number of DNA copies.',fact:true,why:'30 cycles can turn one copy into about a billion.'},
 {k:'heat',s:'The enzyme in PCR comes from bacteria that live in hot springs.',fact:true,why:'Taq polymerase survives the 95 °C steps that unzip the DNA.'},
 {k:'whole',s:'PCR copies the whole genome.',fact:false,why:'Primers mark the start and end, so PCR copies just one target region.'}
],
qpcr:[
 {k:'ct',s:'In qPCR, a sample with more starting DNA crosses the threshold sooner.',fact:true,why:'It needs fewer doublings to reach a detectable level, so its Ct is lower.'},
 {k:'end',s:'qPCR measures DNA only at the end of the run.',fact:false,why:'It measures fluorescence every cycle; that is the “real-time” part.'},
 {k:'covid',s:'COVID tests used a version of qPCR.',fact:true,why:'RT-qPCR first turns viral RNA into DNA, then copies and measures it.'}
],
pipette:[
 {k:'stop',s:'You draw liquid into a micropipette by pressing to the first stop.',fact:true,why:'Press to the first stop, dip, release slowly. The second stop pushes out the last drop.'},
 {k:'tip',s:'You can reuse the same tip between different samples.',fact:false,why:'That contaminates samples. Use a fresh tip each time.'},
 {k:'serial',s:'A 1:10 dilution done twice gives a 1:100 dilution.',fact:true,why:'Dilution factors multiply.'}
],
plasmid:[
 {k:'cut',s:'A restriction enzyme cuts DNA only at a specific sequence.',fact:true,why:'EcoRI, for example, cuts only at GAATTC.'},
 {k:'circle',s:'Cutting a circular plasmid once gives two pieces.',fact:false,why:'One cut opens the circle into one linear piece. Two cuts make two pieces.'},
 {k:'marker',s:'An antibiotic resistance gene on a plasmid helps find the cells that took it in.',fact:true,why:'Only cells with the plasmid survive on antibiotic plates.'}
],
transformation:[
 {k:'glow',s:'In the pGLO lab, bacteria glow because they took in a gene from a jellyfish.',fact:true,why:'The gene makes green fluorescent protein (GFP).'},
 {k:'all',s:'Every bacterium on the plate takes in the plasmid.',fact:false,why:'Only a small fraction do. Ampicillin plates kill the rest.'},
 {k:'ara',s:'The pGLO bacteria glow only when arabinose sugar is present.',fact:true,why:'Arabinose switches on the gene, like the lac operon.'}
],
blast:[
 {k:'search',s:'BLAST compares a DNA sequence to millions of known ones.',fact:true,why:'It finds the closest matches and how similar they are.'},
 {k:'exact',s:'BLAST only finds exact matches.',fact:false,why:'It finds close matches and scores them, which is how it identifies related species.'},
 {k:'free',s:'Anyone can use BLAST free online.',fact:true,why:'It is run by the U.S. National Center for Biotechnology Information (NCBI).'}
],
sanger:[
 {k:'stop',s:'Sanger sequencing uses special bases that stop the new DNA strand.',fact:true,why:'Each stopped piece ends at a known base, so sorting pieces by length reads the sequence.'},
 {k:'whole',s:'Sanger sequencing reads a whole human genome in one run.',fact:false,why:'One run reads about 800 to 1,000 bases. The Human Genome Project took years.'},
 {k:'length',s:'The fragments are sorted by length to read the sequence.',fact:true,why:'Shortest to longest gives the bases in order.'}
],
crispr:[
 {k:'guide',s:'CRISPR uses a guide RNA to find the right spot in the DNA.',fact:true,why:'The guide RNA matches the target sequence, and Cas9 cuts there.'},
 {k:'new',s:'CRISPR was invented in a lab from scratch.',fact:false,why:'It comes from a bacterial defense system against viruses. Doudna and Charpentier won the 2020 Nobel Prize for turning it into a tool.'},
 {k:'sickle',s:'A CRISPR-based treatment for sickle-cell disease has been approved.',fact:true,why:'Casgevy was approved in the U.S. in December 2023.'}
],
synthbio:[
 {k:'circuit',s:'Scientists can build gene “circuits” that act like on/off switches.',fact:true,why:'They combine promoters and repressors so cells respond to signals.'},
 {k:'insulin',s:'Most insulin for diabetes today is made by engineered microbes.',fact:true,why:'Since the 1980s, bacteria or yeast with the human gene make it.'},
 {k:'easy',s:'Putting a gene into a cell always makes it work as planned.',fact:false,why:'Genes interact with the host cell in complex ways, so designs need testing and tuning.'}
],
whogetscare:[
 {k:'bias',s:'An algorithm can treat groups unfairly even if it never uses race as an input.',fact:true,why:'A 2019 study found a health algorithm that used past spending to predict need underestimated Black patients’ needs.'},
 {k:'neutral',s:'Computer decisions are always fair because computers have no opinions.',fact:false,why:'They learn from data people collected, which can carry past unfairness.'},
 {k:'check',s:'Testing an algorithm’s results by group can reveal unfairness.',fact:true,why:'That is how researchers found the bias in the 2019 study.'}
]
});
