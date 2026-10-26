/* b1.js */
BioLab.addPractical({
expdesign: {
  hook: 'You want to know whether E. coli grows better at room temperature (20 °C) or body temperature (37 °C), and you have 12 agar plates and one day. How should you use the plates, and what do the colony counts show after 24 hours?',
  answer: 'Test 4 temperatures with 3 plates each and count every plate at 24 h. About 120 colonies grow at 30 °C and at 37 °C, about 75 at 45 °C, and none show up at 20 °C. At 20 °C the cells still divide, just too slowly to make visible colonies in one day.',
  uses: [
    'Food safety: fridges are set at or below 4 °C (40 °F) because E. coli barely grows that cold, while near 37 °C it can double every 20 to 30 minutes.',
    'Drug trials: one group gets a placebo as the control, and hundreds of people get the real drug, so one person’s unusual reaction cannot decide the result.',
    'Testing new running shoes: run the same route at the same effort in similar weather. If the route or weather also changes, a faster time proves nothing about the shoes.'
  ],
  takeaway: 'To test whether something works, change only that one thing, compare against a control, and repeat each condition at least three times. If two things changed at once, you cannot say which one caused the result.',
  tour: [
    'You are asking one question, the way a coach tests one new drill: does the thing you change affect how well bacteria grow? What you change on purpose is the <b>independent variable</b>. What you measure, the colonies on each plate, is the <b>dependent variable</b>.',
    'One column gets the normal condition: 37 °C, or no antibiotic, no UV or no sugar. This <b>control group</b> is your baseline, like a before photo. Without it you cannot tell whether your change did anything.',
    'Each column has several plates set up the same way. One plate can be a fluke, the way one missed free throw says little about a shooter. These repeats are <b>replicates</b>, and their average shows what is typical.',
    'The card lists what stays the same for every plate: temperature, sugar, antibiotic, UV and counting time. These are the <b>constants</b>. Change two things at once and you can never say which one caused the result.',
    'Each colony starts as one invisible bacterium. You only see it after about 20 doublings, roughly a million cells packed into a dot just big enough to see. In better conditions the dots show up sooner and grow bigger.',
    'When incubation ends, count the colonies on each plate and average each column. Then compare every column with the control. A gap that shows up on every plate in a column is more convincing than one odd plate.'
  ]
},
pillbug: {
  hook: 'You always find pill bugs under damp logs and flowerpots, never on the dry sidewalk next to them. Put 20 in a chamber with wet paper on one side and dry paper on the other. Where are they after 10 minutes, and did they head for the damp on purpose?',
  answer: 'After 10 minutes about 16 of the 20 are on the wet side (anywhere from 14 to 19 in different runs). They did not aim for it. On dry paper they walk faster and turn more; on wet paper they slow down and rest, so they collect where they stop.',
  uses: [
    'Lifting a flowerpot: pill bugs cluster underneath because they breathe with gill-like organs that must stay moist. In dry Denver air they keep moving until they reach damp shade.',
    'Taste test: if 12 of 20 friends pick one brand of chips, that could easily be chance. 15 of 20 passes the chi-square test biologists use for choice chambers.',
    'Science fair design: give the two sides only one difference, like wet vs. dry with both covered. If one side is also brighter, you cannot tell what the bugs reacted to.'
  ],
  takeaway: 'Animals do not have to steer to end up in the right place. If they move fast where conditions are bad and slow down where they are good, they pile up in the good spot. A crowd shows where animals stop, not where they aimed.',
  tour: [
    'Two rooms joined by a doorway, about 27 cm long in all, a bit shorter than a school ruler. Bugs can walk anywhere. Each side gets its own conditions: wet or dry filter paper, covered or uncovered.',
    'Here the left side has wet paper and the right side has dry paper. Both are covered, so light is the same on both sides. Only one thing differs, so any pattern in where the bugs end up comes from moisture.',
    'Each bug walks, turns and stops to rest at random, like someone wandering a mall with no plan. Pill bugs cannot see or smell the far side of the chamber, so they are not heading anywhere.',
    'Watch the dry right side. There the bugs walk faster, turn more often and rarely stop, the way you keep shifting on a hot car seat. On the wet side they slow down and rest. This is called <b>kinesis</b>.',
    'Bugs that rest stay put, while restless ones keep moving until they happen to wander onto the wet side. Over a few minutes most of them end up there, without any bug choosing it.',
    'Every 30 seconds, count the bugs on each side. Ten minutes gives 21 counts, including the one at the start, and they build the graph and the data table.'
  ]
},
waterprops: {
  hook: 'On the stove, a pan of oil gets hot fast, but a pot of water takes ages to boil. Put 100 g each of water, rubbing alcohol and cooking oil on identical hot plates, starting at 20 °C. Which boils first, and how hot is the oil when the water boils?',
  hookSet: { station: '5' },
  answer: 'Alcohol boils first, at 78 °C after about 2 min 40 s. Water needs about 6 min 15 s to reach 100 °C. By then the oil is near 190 °C and still not boiling. The same heat warms oil more than twice as much as water, because water’s hydrogen bonds soak up energy.',
  uses: [
    'Coastal weather: San Diego stays mild year-round while inland deserts swing from hot to cold, because the Pacific absorbs and releases huge amounts of heat with little temperature change.',
    'Ice fishing on Colorado reservoirs: ice floats, so lakes freeze from the top down and fish spend the winter in liquid water underneath.',
    'Trees: water rises from roots to leaves through tubes thinner than a hair. Cohesion holds the water column together and adhesion holds it to the tube walls.'
  ],
  takeaway: 'Water takes more heat to warm up than almost any common liquid, over twice as much as cooking oil. Anything that is mostly water, like a lake, a pot of soup or your body, heats slowly and cools slowly.',
  lede: 'Run eight quick stations with water, alcohol and oil: drops on a penny, a floating paperclip, a boiling race and more. Then zoom in to see how hydrogen bonds between water molecules cause every result.',
  tour: [
    'Start with one water molecule, H₂O. Oxygen pulls the shared electrons toward itself, so the oxygen end is slightly negative (δ−) and the two hydrogen ends are slightly positive (δ+). That uneven sharing is what <b>polar</b> means.',
    'The δ+ hydrogen of one molecule is attracted to the δ− oxygen of a neighbor. That attraction is a <b>hydrogen bond</b> (dashed line), much weaker than the bonds inside the molecule. Every station today comes back to these bonds.',
    'Hydrogen bonds hold ice in an open honeycomb, so ice is less dense than liquid water and floats, like the cubes in your drink. Lakes freeze from the top down, and fish survive in the water underneath.',
    'Water sticks to itself (<b>cohesion</b>). Watch about 30 drops pile into a dome on the penny before the surface breaks. Rubbing alcohol spills after only about 10.',
    'Water also sticks to other polar materials, like the cellulose in a paper towel (<b>adhesion</b>). Adhesion pulls water up the fibers and cohesion drags more along behind: capillary action, the reason a towel soaks up a spill.',
    'Hydrogen bonds pull the surface tight, like a stretched sheet. This is <b>surface tension</b>. A steel paperclip is denser than water, yet it rests on that skin, the same way water striders walk on a pond.',
    'Same heat, three liquids, 100 g each. Water warms slowest because much of the energy goes into hydrogen bonds instead of speeding up molecules. That is <b>high specific heat</b>. Alcohol boils first, at 78 °C.',
    'Water molecules surround each ion and pull the salt crystal apart, the way salt vanishes into pasta water. Oil is nonpolar, so it stays in its own layer, like salad dressing that separates.'
  ]
},
water: {
  hook: 'You put 100 g of ice straight from the freezer (−20 °C) on a 150 W hot plate. How long does it take to melt, how long until the water boils, and how long until it has all boiled away?',
  answer: 'Warming the ice to 0 °C takes about 30 s. Melting takes about 3.7 min, all at 0 °C. Heating the water to 100 °C takes about 4.6 min. Boiling it all away takes about 25 min, all at 100 °C: over 5 times as long as heating it from 0 °C to 100 °C.',
  uses: [
    'Coolers: a cooler stays near 0 °C until the ice is gone. Melting 1 g of ice soaks up as much heat as warming 1 g of water by 80 °C.',
    'Cooking in Denver: water boils near 95 °C, and turning the burner up does not make it hotter. It only boils away faster, which is why pasta takes longer here.',
    'Steam burns: 1 g of steam releases 2,260 J as it condenses on skin, before it even starts to cool. That is why steam scalds worse than boiling water.'
  ],
  takeaway: 'While ice melts or water boils, its temperature stays put and the heat goes into breaking hydrogen bonds. A pot at a rolling boil is at its boiling point however high the burner is set; more heat only boils it away faster.',
  tour: [
    'On the left, a beaker of ice on a hot plate, like a setup in your school lab. On the right, the same sample zoomed in tens of millions of times to show single water molecules. Red is oxygen, white is hydrogen.',
    'In ice, each water molecule holds four neighbors with <b>hydrogen bonds</b> (the dashed lines), weak pulls between molecules. They lock into hexagons with open space in the middle, the same pattern that gives snowflakes six sides.',
    'Now the ice melts. Watch the thermometer: it stays at 0 °C, like a glass of ice water on a hot day. The heat is breaking hydrogen bonds and freeing molecules from the lattice, not making them move faster.',
    'The open lattice takes up more room than liquid water, so ice is less dense (0.92 vs 1.00 g/mL) and floats with most of it underwater. Floating ice insulates ponds, so fish survive the winter underneath.',
    'Once the ice is gone, the temperature finally rises. Water still has many hydrogen bonds to break, so it takes a lot of heat to warm up. That is why oceans keep coastal cities mild.',
    'At 100 °C, molecules must break every hydrogen bond to escape as steam. The temperature stays flat for a long time, the way a pot keeps boiling at one temperature. Boiling it all away takes about 7 times more energy than melting it.'
  ]
},
macromolecules: {
  hook: 'A cracker is mostly starch, long chains of glucose linked together, but your gut can only absorb single sugar molecules. To break a 12-glucose piece of starch into single glucose, how many bonds must be cut, and how many water molecules does it use?',
  hookSet: { start: 12, startAs: 'chain' },
  answer: 'A chain of 12 glucose has 11 bonds, so it takes 11 cuts and 11 water molecules. Each cut is hydrolysis: a water molecule splits, –H goes to one glucose and –OH to the other. Building that chain released the same 11 waters.',
  uses: [
    'Chewing a saltine for a minute: it starts to taste sweet, because amylase in your saliva is cutting the starch into maltose, a sugar made of two glucose units.',
    'Lactose intolerance: lactose is two sugars joined by one bond. Without the enzyme lactase to hydrolyze it, it reaches the large intestine, where bacteria ferment it and make gas.',
    'Potatoes: the plant stores sugar as starch because one huge starch molecule draws in far less water by osmosis than the thousands of loose glucose molecules it is built from.'
  ],
  takeaway: 'Joining n small molecules into a chain releases n − 1 waters, and breaking the chain apart uses n − 1 waters. Digestion is hydrolysis: your body uses water to cut food into pieces small enough to absorb.',
  tour: [
    'Each shape is one <b>monomer</b>, a small building block, like a single bead. Here they are glucose, the sugar in your blood. Linked into a long chain, they make a <b>polymer</b> such as starch, the main thing in bread, rice and potatoes.',
    'Every monomer has an –H (white) on its left end and an –OH (red O with white H) on its right end. Like the two halves of a buckle, these ends are where bonds form.',
    'Watch one join, slowed down. The –OH from one monomer and the –H from the other glow, then leave together as H₂O. This is dehydration synthesis: “de-hydration” means water is removed.',
    'Each new bond releases one more water molecule into the solution. Watch the water box fill as the chain grows: building a food molecule makes water.',
    'Joining all 6 monomers makes a chain of 6 units with 5 bonds, so 5 waters are released. It works like a paper chain: n links always have n − 1 joints.',
    'Now the reverse, which is what digestion does. A water molecule flies in and splits: –H to one monomer, –OH to the other, and the bond breaks. “Hydro-lysis” means splitting with water.'
  ]
},
foodtests: {
  hook: 'Milk tastes only a little sweet, and its label lists sugar, protein and fat but no starch. Test milk with iodine, Biuret, Benedict’s (heated) and Sudan III. Which reagents turn positive, and which one looks the same as plain water?',
  hookSet: { tube: '5' },
  answer: 'Benedict’s turns orange after heating, from lactose, a reducing sugar at about 5 g per 100 mL. Biuret turns lilac from milk’s protein, and Sudan III forms a red layer from its fat. Iodine stays amber, the same as the water tube, because milk has no starch.',
  uses: [
    'Apple orchards: growers drip iodine on a cut apple to decide when to pick. Unripe apples are full of starch and stain dark; as they ripen, the starch turns to sugar.',
    'Brown paper bag test: rub a food on brown paper and let it dry. A see-through spot that stays means fat, the same thing Sudan III detects.',
    'Diabetes testing history: before glucose meters and test strips, heating urine with Benedict’s solution was a common way to check it for sugar.'
  ],
  takeaway: 'Each food test answers one yes-or-no question about one nutrient, so it takes all four to describe a food. Always run plain water next to your samples: a result only counts if it looks different from the water.',
  tour: [
    'The rack holds eight known foods and four unknowns, like a lineup from a kitchen. Plain water is the <b>negative control</b>: it shows what “no nutrient” looks like, so you have something to compare every color against.',
    'Iodine is amber-brown, like weak tea. It turns blue-black where there is starch, so watch the starch and potato tubes. Bread, rice and pasta would turn dark too.',
    'Biuret reagent is blue. Protein turns it violet: look at the egg white and milk. Meat, beans and yogurt would pass this test too.',
    'Benedict’s tests for reducing sugars, like glucose and the sugars in fruit juice. Right after you add it, every tube is still blue. Nothing happens until it is heated.',
    'In an 80 °C water bath, hot enough to steam but not boil, sugars change the copper in Benedict’s. The color runs green, yellow, orange, then brick red as the amount of sugar goes up.',
    'Sudan III is a red dye that dissolves in fat, not water. Oil floats, the way it does on soup, so a red layer forms on top when lipids are present.'
  ]
},
protein: {
  hook: 'A raw egg white is clear and runny. In a hot pan it turns solid white within a minute. Heat this small protein from body temperature (37 °C) to 90 °C. What happens to its folded shape, and does the chain itself break?',
  answer: 'At 37 °C the chain stays about 90% folded, with roughly 75% of its oily amino acids hidden in the core. At 90 °C only about 10% of the fold remains and about a quarter of the oily amino acids stay hidden. The chain never breaks: only the weak bonds holding its shape give way.',
  uses: [
    'Ceviche: lime juice denatures the proteins in raw fish with acid instead of heat, so the fish turns white and firm without any cooking.',
    'Hair straighteners: heat breaks hydrogen bonds in your hair’s keratin and lets them re-form in a new shape, which is why straightened hair curls back when it gets wet.',
    'Milk pasteurization: heating milk to 72 °C for 15 seconds kills bacteria, largely by unfolding their proteins so they stop working.'
  ],
  takeaway: 'A protein’s job depends on its folded shape, and weak bonds hold that shape. Heat or acid can shake the shape apart without breaking the chain, and an unfolded protein stops working. A cooked egg white is unfolded protein you can see.',
  tour: [
    'Every protein starts as a chain of amino acids in a set order, like letters spelling a word. That order is its <b>primary structure</b>. This one has 20 amino acids. Real proteins have hundreds.',
    'Now the chain is stretched straight. Every nonpolar (orange) amino acid, the oily kind that avoids water, is touching water. That is unstable, like oil spread thin on a puddle.',
    'Watch at slow speed: the nonpolar amino acids clump together to get away from the water, the way oil droplets in salad dressing merge into bigger drops. This is hydrophobic collapse.',
    'The finished fold has an oily core with water-loving amino acids on the outside. That exact shape is what lets a protein do its job, the way a key only works if its teeth are the right shape.',
    'Now it heats to 90 °C, close to boiling. The beads stay linked, because the strong peptide bonds do not break, but the fold falls apart. That is <b>denaturation</b>, what happens to egg white in a frying pan.'
  ]
},
cellexplorer: {
  hook: 'After you eat, cells in your pancreas release insulin into your blood. Insulin is a protein made inside the cell, but it does its job outside. What path does it take from its gene in the nucleus to the outside of the cell?',
  answer: 'The gene is copied into mRNA, which leaves the nucleus through a pore. A ribosome on the rough ER reads it and builds the protein, which folds inside the ER. A vesicle carries it to the Golgi, which finishes it and ships it in a new vesicle. That vesicle fuses with the cell membrane and releases insulin outside.',
  uses: [
    'Type 1 diabetes: the immune system destroys the pancreas cells that make insulin, so the protein is never made and people take insulin by injection or pump.',
    'Nerve signals: a nerve cell passes a message by fusing vesicles of neurotransmitter with its membrane, the same exocytosis step that releases insulin.',
    'Crisp lettuce: plant cells have a wall and a big central vacuole, so lettuce soaked in water firms up. Animal cells lack both, so a red blood cell bursts instead.'
  ],
  takeaway: 'A protein that works outside the cell follows one route: gene in the nucleus, ribosome on the rough ER, vesicle, Golgi, vesicle, out through the membrane. Plant cells add a wall, a big vacuole and chloroplasts; bacteria have no nucleus.',
  lede: 'Click any part of an animal cell, a plant cell or a bacterium to see what it does, then quiz yourself. The walkthrough follows one protein, insulin, from its gene to outside the cell.',
  tour: [
    'The instructions for insulin, the protein that lowers blood sugar, are stored in DNA inside the nucleus. A gene is copied into a messenger molecule called mRNA, like photographing one page instead of lending out the whole book.',
    'The mRNA slips out through a pore in the nuclear envelope, the double membrane around the nucleus, and travels to a ribosome on the rough ER.',
    'The ribosome reads the mRNA and links amino acids in the right order. The growing chain is threaded into the rough ER, a folded membrane studded with ribosomes, where it folds into its working shape.',
    'A bubble of ER membrane pinches off with the protein inside. This bubble, a <b>vesicle</b>, works like a delivery truck and carries it to the Golgi apparatus.',
    'The protein moves through the Golgi stack, the cell’s post office. It gets finishing touches such as sugar tags and leaves in a new vesicle from the far side.',
    'The vesicle travels to the cell membrane and fuses with it, releasing the protein outside the cell. This is <b>exocytosis</b>. From here, insulin can enter the blood.'
  ]
},
microscope: {
  hook: 'A cheek cell is too small to see without help. At 400× in this microscope, the circle you see is 450 µm across, just under half a millimeter. How many cheek cells fit across it, and how big is one cell?',
  hookSet: { slide: 'cheek', obj: 40, coarse: 50, fine: 10, light: 90 },
  answer: 'About 7.5 cheek cells span the 450 µm circle, so each is about 450 ÷ 7.5 = 60 µm, or 0.06 mm. About 17 would line up across 1 mm on a ruler. Your eye can only pick out things down to about 0.1 mm, so one cheek cell is just too small to see.',
  uses: [
    'Phone camera: zooming 4× shows only a quarter of the width of the scene. Every magnifier trades how much you see for how much detail.',
    'Blood tests: a red blood cell is about 7.5 µm, so about 60 fit across a 450 µm high-power field, which lets lab technicians count and compare cells on a smear.',
    'Water from mountain streams: a Giardia cyst, a parasite in untreated water, is about 10 µm long, so it takes high power (400×) to spot one.'
  ],
  takeaway: 'More magnification means a smaller view: 10 times the magnification shows one-tenth the width. To size up something tiny, find the width of your field of view, count how many fit across it, and divide.',
  tour: [
    'Light from the bulb shines up through the slide. The objective lens just above the slide magnifies the image, and the eyepiece you look into magnifies it again, 10×. Total magnification is the two multiplied together.',
    'Always start with the 4× objective. Its wide view, 4.5 mm across, makes the specimen easy to find, like zooming out on a map first. Watch the big coarse knob bring the cells into focus.',
    'Move the slide to put the area you want in the middle. The image moves the opposite way, because the lenses flip it upside down and backward. To move a cell left in your view, push the slide right.',
    'Turn the nosepiece to 40×. The image stays almost in focus (the objectives are parfocal: they focus at nearly the same height), but now the circle is only 450 µm across, under half a millimeter, magnified 400×.',
    'At high power, use only the small fine focus knob. One click of the coarse knob moves the stage more than 10 times the depth of focus, enough to drive the lens into the slide and crack it.',
    'A higher-power lens gathers light from a smaller patch, so the image gets darker. Open the diaphragm to let in more light, the way you would open blinds in a dim room.'
  ]
},
sav: {
  hook: 'Marinade soaks into meat from the outside in, the way vinegar soaks into these agar cubes. If a 1 cm cube is soaked all the way through in 10 minutes, how long do a 2 cm cube and a 3 cm cube take?',
  answer: 'The 2 cm cube takes about 40 minutes and the 3 cm cube about 90. Acid moves the same depth into every cube, but time grows with the square of the distance: twice as far to the center takes four times as long. When the 1 cm cube is done, the 3 cm cube is only about 70% soaked.',
  uses: [
    'Brining: a whole turkey needs an overnight brine, while thin chicken cutlets need far less time, because salt must diffuse to the center and that time grows with the square of thickness.',
    'Lungs: hundreds of millions of tiny air sacs give an adult about 70 m² of surface for oxygen to diffuse across, about the floor of a classroom, packed into your chest.',
    'Crushed ice: it cools a drink faster than one big cube of the same weight, because many small pieces have far more surface touching the drink.'
  ],
  takeaway: 'Diffusion is fast over short distances and slow over long ones: twice as far takes four times as long. That is why cells stay tiny, and why small pieces marinate, dissolve and cool faster than big ones.',
  tour: [
    'Each block is agar, a gel like stiff gelatin, mixed with phenolphthalein: an indicator that is pink in a base and clear in an acid. The blocks soak in vinegar, an acid. Treat each block as a model cell.',
    'Acid molecules diffuse into the block from all six faces at once, the way a marinade works in from every side. The clear outer shell is where acid has arrived. The pink core has not been reached yet.',
    'Slice each block through the middle. The clear border is the same thickness in all three: acid travels the same distance into each one, no matter how big the block is.',
    'Speeding up. The small block clears completely while the big one still has a pink center. Its middle is simply too far from any surface.',
    'When a cube’s side doubles, its surface area becomes 4 times bigger but its volume becomes 8 times bigger. Surface area to volume (SA:V), the outside compared with the inside, is cut in half.',
    'A cell takes in oxygen and food through its surface but uses them throughout its volume. A large cell would starve in the middle. That is why your body is made of trillions of tiny cells, not a few big ones.'
  ]
},
transport: {
  hook: 'Hospitals drip saline that is 0.9% salt into patients’ veins, never plain water. What happens to a red blood cell in pure water, and what happens to one in 3% salt water?',
  answer: 'In 0.9% salt the cell keeps its normal size. In pure water, water rushes in, and the cell swells past 150% of its normal volume and bursts within seconds; anything below about 0.48% salt bursts it. In 3% salt, water leaves, and the cell shrinks to about 58% of its volume and wrinkles.',
  uses: [
    'Contact lens saline: it is made isotonic, matching the salt in your tears, so it neither swells nor shrinks the cells on the surface of your eye.',
    'Drinking seawater: at about 3.5% salt it is saltier than blood, and your kidneys must use extra water to get rid of the salt, so you end up losing water.',
    'Salting eggplant or cucumbers: salt on the cut surface pulls water out of the cells by osmosis, so beads of liquid appear and the slices go limp.'
  ],
  takeaway: 'Water moves toward the saltier side. A cell in saltier water shrinks, and a cell in less salty water swells. That is why anything that touches your cells or goes into your veins is matched to about 0.9% salt.',
  tour: [
    'A red blood cell floats in salt water as salty as blood, 0.9%, the same as a hospital saline drip. Its membrane lets water cross but keeps salt and other dissolved particles in place.',
    'Here is a tiny patch of the membrane, a few nanometers wide. Water molecules (blue) slip through <b>aquaporins</b>, protein tunnels made for water. Salt particles (purple) bounce off: they cannot get through.',
    'Now the salt outside is replaced by pure water. More water molecules are free to move on the outside, so more cross in than out. This drift of water across the membrane is <b>osmosis</b>.',
    'Water keeps pouring in. A red blood cell has no wall to hold it in, so it swells into a sphere and then tears open, like an overfilled water balloon. This is <b>lysis</b>.',
    'A fresh cell goes into 3% salt water, a little less salty than seawater. Now there is more solute outside, so water leaves. The cell shrinks and wrinkles (<b>crenation</b>).'
  ]
},
potato: {
  hook: 'A limp carrot stick turns crisp after a night in a glass of water. Soak 2 g potato cores for a day in pure water and in strong sugar water (1.0 M). How much mass does each gain or lose, and what sugar strength changes nothing?',
  answer: 'In pure water a core gains about 18%, so 2.0 g becomes about 2.4 g. In 1.0 M sucrose it loses about 23%, down to about 1.5 g. The mass change crosses zero near 0.3 M, between the 0.2 M and 0.4 M beakers. At that isotonic point the sugar water matches the inside of the potato cells.',
  uses: [
    'Wilted lettuce: soaking it in cold water refills its cells and presses them against their walls, which is why it crisps up again.',
    'Jam and honey: so much sugar is dissolved in them that water flows out of any bacterium that lands there, which is why they keep for months.',
    'De-icing salt: grass and shrubs beside salted roads often brown by spring, because salty soil water pulls water out of their roots instead of letting it in.'
  ],
  takeaway: 'Put plant tissue in water with less dissolved stuff than its cells, and it gains water and firms up. Put it in water with more, and it loses water and goes limp. Where neither happens, outside matches inside.',
  tour: [
    'Six beakers hold sugar (sucrose) solutions from pure water up to 1.0 M, about 34 g of table sugar per 100 mL. Each gets a potato core, about 2 g, that was weighed first.',
    'Potato cells hold dissolved sugars and salts. Pure water has none, so water moves into the core by osmosis, the same way a limp carrot crisps up in a glass of water. Watch the blue drops move inward.',
    'At 1.0 M the solution holds more dissolved sugar than the cells do, so water moves out. The core shrinks, turns bendy and loses mass.',
    'After soaking, each core is blotted dry and weighed. Percent change = (final − initial) ÷ initial × 100. Percent lets you compare cores that started at different masses, like comparing test scores out of different totals.',
    'Somewhere between the beakers, a core would neither gain nor lose water. That concentration, the <b>isotonic point</b>, matches the inside of the potato cells.'
  ]
},
resp: {
  hook: 'Sprinting up the stairs, your muscle cells burn fuel faster and you start breathing hard. Raise the fuel supply from 40% to 100%. What happens to the ATP made and the oxygen used each second?',
  hookSet: { fuel: 40 },
  answer: 'At 40% fuel the membrane makes about 11 ATP per second and uses about 2.3 O₂. At 100% it makes about 19 ATP and uses about 3.9 O₂. Both rise about 1.7 times together: extra ATP takes extra oxygen. Set oxygen to 0 and ATP production stops within seconds.',
  uses: [
    'Hiking a fourteener: each breath holds about 40% less oxygen than at sea level, so you breathe faster to keep enough reaching your mitochondria.',
    'Cyanide poisoning: cyanide blocks the last protein in the chain, so cells cannot use oxygen even when the blood is full of it.',
    'Brown fat in newborns: its mitochondria let H⁺ leak back across the membrane without passing through ATP synthase, so the energy comes out as heat that keeps the baby warm.'
  ],
  takeaway: 'Your mitochondria make ATP only while oxygen catches electrons at the end of the chain. Making more ATP uses more oxygen, in step. That is why breathing speeds up with effort, and why no oxygen means no ATP from this chain.',
  tour: [
    'This is the inner membrane of one mitochondrion, the cell’s power plant. Most of your cells have hundreds of them. The membrane separates the <b>intermembrane space</b> (top) from the <b>matrix</b>, the inner compartment (bottom).',
    'The food you ate was broken down earlier into carrier molecules loaded with high-energy electrons. Watch the yellow dots: electrons enter at the first pump, like current entering a circuit.',
    'As electrons pass from pump to pump, they release energy a little at a time. The pumps use it to push H⁺ ions (pink) up across the membrane, the way a pump fills a water tower.',
    'At the end of the chain, oxygen grabs the used-up electrons and joins with H⁺ to make water. This is why you breathe: no oxygen means nowhere for electrons to go.',
    'H⁺ ions crowd into the space above the membrane, like water piling up behind a dam. More H⁺ above than below is stored energy, waiting to be used.',
    'H⁺ flow back down through ATP synthase, a tiny rotary machine, like water turning a turbine. As it spins, it snaps phosphate onto ADP to make ATP, the energy your cells spend.'
  ]
},
photo: {
  hook: 'Pondweed under a desk lamp sends up a stream of oxygen bubbles. If you slide the lamp from 15 cm to 30 cm away, twice as far, does the plant make half as many bubbles? How far can the lamp go before the bubbling stops?',
  answer: 'Light at the plant drops from 44% to 11%, a quarter. Bubbles fall from about 21 to about 8 per minute, fewer than half. At about 60 cm the bubbles stop: the plant still photosynthesizes, but its own respiration uses up all the oxygen it makes.',
  uses: [
    'Grow lights: indoor growers hang lights close above seedlings, because moving a small lamp twice as far away cuts the light reaching the leaves to about a quarter.',
    'Aquariums at night: with the lights off, plants stop making oxygen but keep using it, so the oxygen in the water drops until the lights come back on.',
    'Pond fish kills: they often happen before dawn after cloudy summer days, when algae have used oxygen all night with too little light to replace it.'
  ],
  takeaway: 'A plant only adds oxygen when it makes more than its own cells use. Light thins out fast with distance: twice as far gives about a quarter of the light. Too far from the light, and the plant just breaks even.',
  tour: [
    'A sprig of Elodea pondweed, about 10 cm long, sits in water mixed with baking soda, which releases CO₂ for the plant to use. A lamp shines on it from the side.',
    'Light hits the chloroplasts in the leaves. Chlorophyll, the green pigment, absorbs it and uses the energy to split water molecules.',
    'Splitting water releases oxygen gas, which collects and escapes from the cut end of the stem as bubbles. Counting bubbles per minute measures how fast the plant is photosynthesizing.',
    'Now the lamp moves to 40 cm. Light spreads out with distance, like a flashlight beam on a far wall, so only about a seventh as much reaches the plant. Watch the bubble rate fall.'
  ]
},
enz: {
  hook: 'Amylase in your saliva starts digesting the starch in a cracker at body temperature, 37 °C. How fast does it work in an ice-cold drink at 10 °C, in food heated to 70 °C, and in your stomach at pH 2?',
  answer: 'At 37 °C and pH 7 it runs at about 61 µmol/min. At 10 °C it slows to about 10, a sixth as fast, but it speeds back up when warmed. At 70 °C it unfolds and stops for good. At pH 2 the rate falls to almost zero.',
  uses: [
    'Blanching: dipping vegetables in boiling water for a minute or two before freezing denatures their enzymes, so they keep their color and flavor in the freezer.',
    'Pineapple in gelatin: fresh pineapple keeps gelatin from setting because its enzyme, bromelain, cuts gelatin’s protein. Canned pineapple works, since canning heat denatures the enzyme.',
    'Sliced apples: lemon juice slows browning, partly because its low pH, about 2, takes the browning enzyme far from the pH where it works best.'
  ],
  takeaway: 'Every enzyme has a best temperature and pH. Cold slows it down without harm, but too much heat or the wrong pH changes its shape, and heat damage is permanent. That is why chilling, cooking and acid change how food keeps.',
  tour: [
    'Each green shape is one enzyme molecule, like the amylase in your saliva. The notch is its <b>active site</b>, a pocket shaped to fit one kind of molecule, the way a lock fits one key.',
    'Blue dots are <b>substrate</b> molecules, the thing the enzyme works on (starch, for amylase). They move randomly and bump into enzymes by chance, like people in a crowded hallway.',
    'When substrate lands in the active site, the enzyme splits it into two products (orange) and lets them go. The enzyme is not used up. It grabs the next one, over and over.',
    'Now the tube heats to 70 °C, about as hot as fresh coffee. Watch the enzymes unravel: the active site loses its shape, so substrate cannot bind. This is <b>denaturation</b>, and cooling it again does not fix it.'
  ]
},
glycolysis: {
  hook: 'When you burn off a granola bar on a run, its sugar does not just vanish. Follow one glucose molecule with oxygen available. Where do its 6 carbon atoms end up, and how much ATP does your cell get from it?',
  answer: 'All 6 carbons leave as CO₂ that you breathe out: 2 when pyruvate enters the mitochondrion and 4 in the Krebs cycle. The cell gets about 32 ATP: 2 from glycolysis, 2 from the Krebs cycle and about 28 from electron transport. Turn oxygen off and the same glucose gives only 2.',
  uses: [
    'Losing weight: most of the mass of the fat and sugar you burn leaves through your lungs as CO₂, not as sweat or heat.',
    'Bread dough: yeast short on oxygen ferment sugar into CO₂ and alcohol. The CO₂ bubbles make the dough rise, and the alcohol bakes off in the oven.',
    'An all-out 400 m sprint: your muscles lean hard on glycolysis, which gets only 2 ATP per glucose, so they burn through sugar fast.'
  ],
  takeaway: 'With oxygen, one glucose gives about 32 ATP, and every carbon leaves as CO₂ you breathe out. Without oxygen, the same glucose gives only 2 ATP, so a cell would have to burn sugar about 16 times faster to keep up.',
  tour: [
    'A glucose molecule, the sugar carried in your blood, has six carbon atoms. Each colored ball is one carbon, so you can follow where every one ends up.',
    'Glycolysis, the first stage, begins by spending 2 ATP, like an investment. The phosphate groups (orange P) make glucose unstable enough to split.',
    'The sugar splits in half, and each half is broken down further, releasing energy: 4 ATP in all. After paying back the 2 spent, that is a net gain of 2.',
    'With oxygen around, pyruvate, the half-sugar left from glycolysis, enters the mitochondrion. One carbon from each pyruvate is released as CO₂, and NADH, an electron carrier, is made.',
    'The remaining carbons go around the Krebs cycle and leave as CO₂. Every carbon from the glucose has now been breathed out, and the energy is stored in NADH, FADH₂ and 2 ATP.',
    'NADH and FADH₂ deliver electrons to the electron transport chain. Oxygen catches them at the end, and ATP synthase makes about 28 ATP, most of the total. See the Cellular respiration simulation for this step up close.'
  ]
},
chloroplast: {
  hook: 'On a hot, dry afternoon, a plant closes the pores in its leaves to save water, which also shuts out CO₂. The sun is still bright. Set CO₂ to 0 at 80% light. Does the leaf keep splitting water and releasing oxygen?',
  answer: 'No. With normal CO₂ the leaf releases about 16 units of O₂. With no CO₂ the Calvin cycle stops spending ATP and NADPH, those supplies fill up, and the electrons have nowhere to go. O₂ release falls to 0 even in bright light.',
  uses: [
    'Greenhouses: some growers pump in extra CO₂, because on bright days CO₂ can become the factor that limits how fast plants make sugar.',
    'Weed killers: atrazine, a common herbicide, blocks electron flow out of photosystem II, so the weed’s light reactions stop and it cannot make sugar.',
    'Lawns in July: on hot, dry Denver afternoons grass partly closes its leaf pores to save water, which also cuts its CO₂ supply and slows its growth.'
  ],
  takeaway: 'Light charges up ATP and NADPH; the Calvin cycle spends them to turn CO₂ into sugar. Neither half runs long without the other, so a plant needs both light and CO₂ to make sugar and release oxygen.',
  tour: [
    'This is a slice of the thylakoid membrane inside a chloroplast, the leaf’s solar panel and sugar factory. Above it is the <b>stroma</b>, where sugar is built. Below is the <b>thylakoid space</b>, where H⁺ collects.',
    'Light hits photosystem II and excites electrons in chlorophyll. To replace them, PSII splits water: 2 H₂O → O₂ + 4 H⁺ + 4 electrons. That O₂ is the oxygen plants release and you breathe.',
    'The electrons pass along a chain of proteins, like a bucket brigade. Their energy pumps H⁺ into the thylakoid space, storing energy the way a battery charges.',
    'Light re-energizes the electrons at photosystem I. They go to ferredoxin and then NADP⁺ reductase, which makes NADPH, an energy carrier loaded with electrons for building sugar.',
    'H⁺ flows back out to the stroma through ATP synthase and spins it to make ATP. This is <b>chemiosmosis</b>, the same mechanism your mitochondria use.',
    'The Calvin cycle spends ATP and NADPH to turn CO₂ from the air into sugar. That sugar is where nearly all the food you eat started.',
    'Watch what happens in the dark. The Calvin cycle keeps running for a few seconds on stored ATP and NADPH, then winds down as those supplies run out, like a car coasting after you lift off the gas.'
  ]
}
});

/* b2.js */
BioLab.addPractical({
signaling: {
  hook: 'A dog barks right behind you on a run, and the adrenaline (epinephrine) in your blood jumps. If the level goes from 1 nM to 10 nM, ten times more, does a liver cell release ten times more sugar into your blood?',
  answer: 'No. At 1 nM half the receptors hold hormone, and the cell releases about 13 million glucose per second. At 10 nM 91% are filled, but release only rises to about 14 million per second, because the relay is already near full speed. Once the hormone is gone, release falls to almost zero in about 20 seconds.',
  uses: [
    'Asthma inhalers: albuterol binds the same β₂ receptors on airway muscle, and the relay inside relaxes the muscle so the airway opens within minutes.',
    'EpiPens: the epinephrine never has to enter a cell. In a severe allergic reaction it binds receptors on blood vessels and airways, raising blood pressure and opening breathing.',
    'Low blood sugar emergencies: a glucagon shot works on liver cells through the same cAMP relay, so stored glycogen is broken down and glucose pours into the blood.'
  ],
  takeaway: 'A hormone does not have to get inside a cell to change it. It flips a switch on the surface, relay proteins multiply the message thousands of times, and the response stops soon after the hormone is gone.',
  lede: 'Adrenaline reaches a liver cell but never goes inside. Follow how the cell passes the message along and multiplies it until sugar pours into your blood.',
  tour: [
    'Epinephrine (orange diamonds) is adrenaline, the hormone behind a racing heart after a scare. It travels in the blood but cannot cross the cell membrane, so the message has to be passed in from outside.',
    'Step 1: when epinephrine fits into the receptor on the outside, the receptor changes shape on the inside, like a key turning a lock from one side of a door. That shape change is the message.',
    'Step 2: the receptor switches on the G protein. The G protein trades GDP for GTP, which turns it on, then slides over and switches on adenylyl cyclase, an enzyme in the membrane. Each step is a hand-off, like runners passing a baton.',
    'Step 3: adenylyl cyclase turns ATP into cAMP, the green second messenger, which spreads through the cell. One switched-on enzyme makes many cAMP, so the signal is already bigger.',
    'Step 4: cAMP switches on protein kinase A, which starts the kinase cascade: phosphorylase kinase, then glycogen phosphorylase. Each kinase adds phosphates (yellow P) to switch on many more. Count the rows: 4, then 8, then 16. In a real cell the rows run to many thousands, which is how a few hormone molecules move millions of sugars.',
    'Step 5: glycogen phosphorylase snips glucose off glycogen, the cell’s stored sugar. The glucose leaves through a transporter and enters your blood as fuel for your muscles, ready for a sprint.',
    'Now the hormone is removed. The G protein, cAMP and the kinases all switch off within seconds, so the sugar release stops. A signal that could not switch off would keep dumping sugar into your blood.'
  ]
},
cellcycle: {
  hookSet: { uv: 8 },
  hook: 'A sunny spring day on the slopes gives your skin strong UV, which damages DNA. In a dish of skin cells under strong UV (8 on the slider) for about 6 days, how many cells end up with mutations when the p53 guard works, and when it is broken?',
  answer: 'With p53 working, 0% of the cells end up mutated. Damaged cells pause to repair, and about 20 self-destruct in 6 days. With p53 broken, about 85% carry mutations by 150 hours (about 6 days), around 160 have two or more, and those pile up in layers until the dish is packed with 220 cells.',
  uses: [
    'Sunburn peeling: skin cells with badly damaged DNA self-destruct after a burn, which is part of why burned skin peels a few days later.',
    'Sunscreen: SPF 30 blocks about 97% of the UVB that reaches your skin, so far fewer cells get damaged in the first place.',
    'Cancer genetics: about half of all human cancers carry a mutation in the p53 gene, TP53, which is why p53 is called the guardian of the genome.'
  ],
  takeaway: 'Cells divide only when told to, when there is room, and when their DNA is intact. Cancer takes several broken rules at once, which is why cutting DNA damage, like wearing sunscreen at altitude, lowers the odds.',
  lede: 'Grow a patch of skin cells one cell at a time. See what tells a cell to divide or stop, then break those rules with UV light and a faulty p53 and watch a tumor form.',
  tour: [
    'Look at the highlighted cell. Its green center means it is in G1, growing and doing its everyday job. A cell spends about 10 of the roughly 23 hours in one cycle here.',
    'Blue center: the cell is in S phase, making a complete copy of its DNA. The white ring fills up as copying goes on. This takes about 8 hours.',
    'Purple center: in G2 the cell checks its copied DNA and gets ready to split, like proofreading an essay before you hand it in. This takes about 4 hours.',
    'Watch: the cell stretches, the chromosomes pull apart, and it pinches into two cells. This step, mitosis, takes only about an hour of the whole day-long cycle.',
    'Now the growth factor, the signal from nearby cells that says “divide”, is removed. Cells finish what they started, then stop and rest (grey). This is part of how a healing cut knows when to stop growing.',
    'Growth factor is back, and now strong UV light damages DNA (yellow bolts), like a sunburn. The p53 protein stops damaged cells (orange) until they are fixed, or makes them self-destruct.',
    'Now p53 is broken. Damaged cells keep dividing and pass on mutations (amber). Cells with two mutations (dark red) ignore crowding and pile up into a tumor. One broken rule is not enough here; it takes two.'
  ]
},
division: {
  hookSet: { pairs: 3 },
  hook: 'When you scrape your knee, new skin cells fill the gap, and your body also makes egg or sperm cells. Starting from a cell with 3 chromosome pairs, how many cells does each kind of division make, and how many different gamete types show up in 100 meioses?',
  answer: 'Mitosis makes 2 cells, each with all 6 chromosomes and identical to the parent, which is what a scrape needs. Meiosis makes 4 cells with 3 chromosomes each. Run 100 meioses (400 gametes) and you see all 8 types, 2³, from how each pair happens to line up. With 23 pairs, one person can make 2²³, about 8.4 million, combinations before crossing over.',
  uses: [
    'Siblings: two children of the same parents share about half their DNA on average, because each egg and each sperm carries its own mix of chromosomes.',
    'Gut lining: your intestine replaces its inner lining by mitosis about every 3 to 5 days, so the new cells must be exact copies.',
    'Down syndrome: when chromosome 21 fails to separate during meiosis, an egg or sperm carries an extra copy, and the child has 47 chromosomes instead of 46.'
  ],
  takeaway: 'Mitosis is for copies: two identical cells for growth and repair. Meiosis is for variety: four cells with half the chromosomes, each pair sorted by chance, which is why siblings are never identical unless they are twins from one egg.',
  tour: [
    'Before any division, the cell copies its DNA. Each chromosome gets an identical twin, called a sister chromatid, so there is a full set to hand to each new cell.',
    'In prophase the long DNA strands coil up into short, thick chromosomes, like winding up a long extension cord before you carry it, so they can be moved without tangling.',
    'In metaphase the spindle fibers, like ropes pulling from each side, line every chromosome up across the center, one twin facing each side.',
    'In anaphase the twins separate and move to opposite sides. Each side gets one copy of every chromosome, so neither new cell is missing any genes.',
    'Mitosis ends with two cells that match the parent exactly. This is how you grow, and how a scraped knee fills back in with new skin.',
    'In meiosis, partner chromosomes (red from mom, blue from dad) are pulled apart first. Each new cell gets one from each pair: half the number. Which partner goes which way is a coin flip for each pair.',
    { title: 'Four egg or sperm cells', text: 'Meiosis II splits the twins apart. You end with four cells, each with half the chromosomes. Without crossing over they come in two matching pairs, and neither pair matches the parent. These become eggs or sperm.' }
  ]
},
neuron: {
  hook: 'You step on a tack, and the signal has to travel about 1 m from your foot to your spinal cord. On this axon, how long does that trip take without myelin, and how long with it?',
  answer: 'Without myelin the spike crawls at about 3.5 m/s, so 1 m takes about 0.29 s, close to a third of a second. With myelin it jumps node to node at 60 m/s, so the trip takes about 17 ms, 17 times faster. Either way each spike is full size; a stronger stimulus gives more spikes per second, not bigger ones.',
  uses: [
    'Stubbing your toe: you feel a sharp jolt first, then a dull ache a moment later. The jolt rides myelinated fibers; the ache rides bare ones at about 1 m/s.',
    'The dentist: lidocaine blocks Na⁺ channels in the nerves around your tooth, so they cannot fire spikes, and your lip stays numb until the drug wears off.',
    'Multiple sclerosis: the immune system damages myelin in the brain and spinal cord, so signals slow down or fail, which can cause numbness, weakness or blurred vision.'
  ],
  takeaway: 'A neuron fires all or nothing. Below threshold nothing happens; above it you get a full-size spike. Stronger input means more spikes per second, and myelin, the insulation on an axon, makes them travel many times faster.',
  tour: [
    'A neuron is a cell built to carry signals, like a wire from your toe to your spine. Dendrites collect signals, the cell body adds them up, and the long axon carries an electrical pulse to the axon terminal, where it passes the message on.',
    'Zoomed in on the axon membrane. The Na⁺/K⁺ pump keeps Na⁺ (gold) mostly outside and K⁺ (purple) mostly inside, like charging a battery. The inside sits about 65 mV more negative than the outside, about a twentieth of a AA battery.',
    'A stimulus pushes the inside up to threshold, the trigger point. Na⁺ channels snap open and Na⁺ floods in, so the inside becomes positive. Watch the gold ions pour through the blue channels.',
    'Next the Na⁺ channels close and K⁺ channels open. K⁺ (purple) leaves through the green channels, carrying positive charge out, so the inside goes negative again, ready for the next signal.',
    'The oscilloscope plots voltage against time, like a heart monitor: a fast rise (Na⁺ in), a fall (K⁺ out) and a small dip below rest. Every action potential in this neuron has the same shape and height.',
    'An action potential at one spot sets off the membrane next to it, so the spike sweeps down the axon like a falling row of dominoes. Without myelin it crawls along at a few meters per second, about jogging speed.',
    'Myelin wraps insulate the axon, like the plastic on a wire. The spike only happens at the gaps (nodes of Ranvier), so it jumps from node to node. Here it moves about 17 times faster. We have slowed time way down so you can see the jumps.'
  ]
},
roottip: {
  hook: 'In a stained onion root tip you count 200 cells: 172 are in interphase and 6 are in metaphase. If one cell cycle takes about a day (24 h), how long does metaphase last, and how much of the day is a cell actually dividing?',
  answer: '6 of 200 is 3%, so metaphase lasts about 0.03 × 24 h ≈ 43 minutes. The 28 cells in any stage of mitosis are 14% of the count, the mitotic index, so a cell spends about 3.4 hours of its day dividing and the other 20.6 hours in interphase.',
  uses: [
    'Chemotherapy: paclitaxel (Taxol) jams the spindle fibers, so fast-dividing cancer cells get stuck in mitosis. Hair follicles also divide fast, which is why hair loss is a common side effect.',
    'Tumor biopsies: pathologists count dividing cells under the microscope, and a high mitotic count is one sign of a faster-growing tumor.',
    'Seedless watermelon: breeders use colchicine, which blocks spindles, to double a plant’s chromosomes. Crossing those plants with normal ones gives seeds that grow into seedless fruit.'
  ],
  takeaway: 'A snapshot of many cells works like a time log. The share of cells caught in a stage equals the share of time spent there, so multiply that fraction by the cycle length to get the time.',
  tour: [
    'This is the tip of a growing onion root, like the ones that sprout from an onion left too long in the pantry. Just behind the protective cap, cells divide over and over to make the root longer.',
    'The root was squashed flat on a slide and stained, so the DNA shows up dark purple. Each box is one cell, about 20 µm across (a few times thinner than a hair), outlined by its cell wall.',
    'Most cells look like this: a round nucleus with a dark nucleolus. The DNA is loose, so no chromosomes are visible. The cell is growing and copying its DNA. This is interphase, and it fills most of the day.',
    'Prophase: the DNA coils up into thick threads, chromosomes you can see. The nucleus is breaking down. This is the first sign that the cell is about to divide.',
    'Metaphase: the chromosomes line up in a single band across the middle of the cell, held by spindle fibers. It is the easiest stage to spot, so it is a good one to start your count with.',
    'Anaphase: sister chromatids are pulled apart toward opposite ends. They often look like V shapes, bent around the point where the spindle fiber pulls, like a towel dragged by its middle.',
    'Telophase: two dense clumps of chromosomes sit at opposite ends, and a new cell plate, the start of a new wall, forms between them. Soon there will be two cells.',
    null
  ]
},
crosses: {
  hookSet: { p2m: 'pp' },
  hook: 'You buy a purple-flowered pea plant and want to know if it hides a white allele. You cross it with a white plant and grow 20 seeds. If it is Pp, how many white plants do you expect, and what result proves it?',
  answer: 'If the plant is Pp, half its gametes carry p, so expect about 10 white plants out of 20 (a 1 : 1 ratio). If it is PP, all 20 are purple. A single white offspring proves it is Pp. If all 20 are purple, it is almost surely PP: a Pp plant would give zero whites only about once in a million tries.',
  uses: [
    'Labrador retrievers: two black Labs can have a yellow puppy. Yellow is recessive, so both parents were carrying a hidden copy.',
    'Cystic fibrosis: when both parents are carriers, each child has a 1 in 4 chance of having the condition, and every pregnancy is a fresh coin flip.',
    'Garden hybrids: seeds saved from a hybrid tomato do not grow true, because the offspring sort the parent’s alleles into new combinations.'
  ],
  takeaway: 'Each child gets one allele from each parent by chance. A 3 : 1 ratio is a probability, not a schedule, so small families can come out any way. To find a hidden allele, cross with the recessive type and look for it.',
  tour: [
    'Each parent plant has two alleles, two versions of the flower-color gene. P (purple) is dominant over p (white), so a Pp plant looks just like a PP plant but carries a hidden p.',
    'Each sperm or egg gets only one of a parent’s two alleles, like drawing one card from a pair. A Pp parent makes P gametes and p gametes in equal numbers. They are shown in the circles along the edges.',
    'Each box pairs one gamete from each parent. All four boxes are equally likely: 1 PP, 2 Pp and 1 pp. So you expect 3 purple for every 1 white, the same odds as flipping two coins and not getting two tails.',
    null,
    'With 100 offspring the counts get close to 3 : 1 (75 purple, 25 white), but rarely exactly. Small samples wander more: 4 coin flips give exactly 2 heads only 3 times in 8.'
  ]
},
pedigree: {
  hook: 'At a family reunion you notice a rare trait in one of your cousins, but neither of her parents has it. Could the trait be dominant? What does this one clue tell you about her parents?',
  answer: 'Two unaffected parents with an affected child means the trait is recessive, since a dominant allele would show in the parent who passed it on. So both parents are carriers (Aa), each gave her one hidden copy, and each of their children had a 1 in 4 chance of having the trait. Press New family to try the clue on fresh pedigrees.',
  uses: [
    'Genetic counseling: counselors draw a three-generation pedigree to estimate a family’s chances of passing on a condition like cystic fibrosis.',
    'Royal hemophilia: Queen Victoria was a carrier, and hemophilia showed up in sons across European royal families, the classic X-linked recessive pattern.',
    'Huntington’s disease: it is dominant, so it shows up generation after generation, and each child of an affected parent has a 1 in 2 chance of inheriting it.'
  ],
  takeaway: 'If a trait shows up in a child of two parents without it, it is recessive and both parents are carriers. A dominant trait rarely skips a generation: an affected person usually has an affected parent.',
  lede: 'Read a family tree for one trait. Each new family hides one inheritance pattern. Find the clue in who has the trait and decide whether it is dominant or recessive.',
  tour: [
    'A pedigree is a family tree for one trait, like the ones genetic counselors draw. Each row is a generation, numbered with Roman numerals: grandparents (I) at the top, grandchildren (III) at the bottom.',
    'Squares are males and circles are females. A horizontal line joining two people means they are a couple. People are named by generation and position, like II-3, the third person in row II.',
    'A vertical line drops from each couple to a horizontal line, and their children hang below it, oldest on the left, like siblings lined up in birth order.',
    'Shaded symbols are people who have the trait. Open symbols do not. Everything you need is in the pattern of shading, so read it the way a detective reads clues.',
    'Symbols with no parents drawn married into the family. For a rare trait, assume they don’t carry the allele unless they are shaded, since almost nobody in the general population does.',
    null
  ]
},
karyotype: {
  hook: 'A lab grows a few of a patient’s white blood cells, stops them mid-division and photographs one cell’s chromosomes. How do you sort the pile into pairs, how many should you count, and what count would point to Down syndrome?',
  answer: 'Pair chromosomes by size, by where the centromere pinch sits, and by the band pattern, then line them up 1 to 22 plus the sex chromosomes. A typical count is 46. Down syndrome shows as 47, with three copies of chromosome 21, one of the smallest. Two X chromosomes means female; an X and a Y means male.',
  uses: [
    'Prenatal testing: amniocentesis collects fetal cells from the fluid around the baby, and a karyotype of those cells checks the chromosome count before birth.',
    'Leukemia: in chronic myeloid leukemia the karyotype shows the Philadelphia chromosome, a swap between chromosomes 9 and 22 that a targeted drug can block.',
    'Mules: a horse has 64 chromosomes and a donkey 62, so a mule gets 63. The unmatched sets cannot pair in meiosis, which is why mules are almost always sterile.'
  ],
  takeaway: 'Pair chromosomes by size, centromere position and bands, then count. 46 is typical. One extra copy (47) or one missing (45) changes the dose of hundreds of genes at once, and which chromosome is affected decides the condition.',
  tour: [
    'Doctors grow a few white blood cells from a blood draw, stop them in metaphase when chromosomes are most condensed, burst them onto a slide and stain them. This is one cell’s chromosomes, spread across about 0.05 mm.',
    'Chromosomes are numbered from largest (1) to smallest (21 and 22 are the smallest). Size is your first clue for finding partners, like sorting socks by length.',
    'The pinch is the centromere, where the two copied halves are held together. In the middle: metacentric (like 1). Off-center: submetacentric (like 4). Almost at the end: acrocentric (like 14), with tiny knobs called satellites.',
    'The stain makes a pattern of light and dark bands, like a barcode. The two homologs in a pair have the same pattern, because they carry the same genes in the same order.',
    'Arranged in order, the chromosomes make a karyogram: pairs 1 to 22 (autosomes, the chromosomes that are not sex chromosomes), then the sex chromosomes, lined up by their centromeres.',
    'Two X chromosomes means female; an X and a Y means male. The Y is small and carries the gene, SRY, that starts male development.',
    'Now count. 46 is typical. Three copies of a chromosome is a trisomy, like Down syndrome (trisomy 21). One copy is a monosomy, like Turner syndrome (45,X). One extra or missing chromosome changes the dose of hundreds of genes.'
  ]
},
bloodtype: {
  hook: 'Before a transfusion, a lab tech drops anti-A, anti-B and anti-Rh serum onto a patient’s blood. The sample clumps with anti-B and anti-Rh but stays smooth with anti-A. What is the patient’s blood type, and could they safely receive type A red cells?',
  answer: 'Clumping means the antigen is there, so the cells carry B and Rh but not A: type B+. Type A red cells would be attacked, because this patient’s plasma carries anti-A antibodies. They can safely receive B or O red cells, either Rh+ or Rh−.',
  uses: [
    'Trauma care: ER teams often give O− red cells before a patient is typed, because those cells carry no A, B or Rh antigen to react with.',
    'Pregnancy: an Rh− mother carrying an Rh+ baby gets an anti-D shot (RhoGAM) so her body does not build antibodies that could attack a later baby’s red cells.',
    'Blood drives: only about 7% of people in the US are O−, yet hospitals rely on it in emergencies, so blood banks ask O− donors to give often.'
  ],
  takeaway: 'Clumping means the antigen is there. Read the three wells to name the type. A patient can only receive red cells that carry no antigen their own blood lacks, which is why O− works for almost anyone.',
  tour: [
    'Each tube holds a little blood from one patient, like the vial drawn at a doctor’s visit. You will test the blood of Patient 1.',
    'Each well gets a drop of blood (about 50 µL) plus a drop of serum. Anti-A serum holds antibodies that grab A antigens; anti-B grabs B antigens; anti-Rh grabs the Rh (D) antigen.',
    'Watch the anti-A well. These cells carry A antigens, markers on their surface, so the antibodies link the cells together into visible clumps: agglutination.',
    'Each antibody is Y-shaped with two arms, so it can hold two cells at once. Millions of these bridges pull the cells into clumps you can see without a microscope.',
    'No clumping: these cells have no B antigens, so the anti-B antibodies have nothing to grab. The well stays smooth and evenly red.',
    'Clumping again: the cells carry the Rh antigen, the “+” in a blood type. Putting it together: A antigens, no B, Rh positive. This patient is type A+, one of the most common types in the US.'
  ]
},
replication: {
  hook: 'Before a bacterium splits, it copies its DNA at about 1,000 bases per second at each fork. If the helicase “unzipper” stops working, or the ligase “glue” stops working, which one stops copying, and what goes wrong with the other?',
  answer: 'With helicase off, fork speed drops to 0 and no new DNA is made, because nothing unzips the helix. With ligase off, the fork keeps going at 1,000 nt/s and makes just as much DNA, but the top strand stays in separate Okazaki fragments with unsealed gaps. The cell ends up with a copy full of breaks.',
  uses: [
    'Antibiotics: ciprofloxacin kills bacteria by jamming gyrase and topoisomerase IV, enzymes that relieve the twisting ahead of the fork, so copying stalls.',
    'PCR tests: PCR copies DNA with a heat-proof polymerase first found in a Yellowstone hot-spring bacterium, doubling the target DNA each cycle.',
    'Your own cells: a human cell copies about 6 billion base pairs before it divides, starting at tens of thousands of spots at once so it finishes in hours.'
  ],
  takeaway: 'DNA copying is a team job. Helicase unzips, polymerase builds, and ligase seals the pieces. Each new double helix keeps one old strand as the pattern for the new one, so both daughter cells get a full copy.',
  tour: [
    'This is one spot on a bacterial chromosome where DNA is being copied, slowed about 100 times so you can follow it. The original double helix (slate) comes in from the right and is unzipped at the fork.',
    'Helicase (purple ring) uses energy from ATP, the cell’s fuel, to break the hydrogen bonds between base pairs, pulling the two strands apart like opening a zipper.',
    'On the bottom, DNA polymerase builds the new strand smoothly, following right behind the fork. This is the leading strand. In E. coli it grows by about 1,000 bases every second.',
    'On the top, the new strand has to be built in the opposite direction, away from the fork. So it is made in short pieces, called Okazaki fragments, each one started as the fork opens up more room.',
    'Another polymerase swaps the RNA starter pieces for DNA, and ligase glues the fragments into one continuous strand, like taping pages into one long scroll.',
    'Each new double helix has one original strand (slate) and one new strand (pink). This is called semiconservative replication: half old, half new, so each daughter cell gets one strand from the parent.'
  ]
},
expression: {
  hook: 'Your cells read DNA three bases at a time, and this gene is 24 bases long. Divide by 3 and you might expect 8 amino acids. How long is the protein the ribosome actually builds, and what tells it where to stop?',
  answer: 'The protein is 7 amino acids long: Met-Pro-Lys-Phe-Gly-Trp-His. The 8th codon, UAA, is a stop codon. No tRNA matches it, so a release factor frees the chain. The first codon, AUG, is the start signal and also codes for methionine (Met), which is why Met begins the chain.',
  uses: [
    'Sickle-cell disease: one base change in the β-globin gene turns codon GAG into GTG, so glutamic acid becomes valine and hemoglobin can stick together when oxygen is low.',
    'mRNA vaccines: the vaccine delivers mRNA for one virus protein. Your ribosomes read it codon by codon and build the protein, and the mRNA breaks down within days.',
    'Insulin: the human insulin gene, put into bacteria or yeast, is read with the same genetic code, which is how most insulin used for diabetes is made.'
  ],
  takeaway: 'DNA is read in three-letter words from a start codon to a stop codon. Change one letter and you may change one amino acid or none. Add or delete one letter and every word after it is misread.',
  tour: [
    'This is a short gene: a stretch of DNA 24 bases long. Its order of bases (A, T, G, C) is the recipe for one protein, the way the order of letters in a word sets its meaning.',
    'RNA polymerase (purple) opens up a small bubble in the double helix and moves along it, reading one base at a time, like a finger following a line of text.',
    'Each new RNA base pairs with the template: A with U, T with A, G with C and C with G. RNA uses U (uracil) instead of T. The result is a working copy of the gene.',
    'The finished mRNA slips out through a nuclear pore into the cytoplasm, where the ribosomes are. The DNA stays inside, like a master recipe book that never leaves the library.',
    'A ribosome clamps onto the mRNA at the start codon, AUG, and reads three bases (one codon) at a time. Each codon stands for one amino acid.',
    'Each tRNA has an anticodon that matches one codon, and it carries one amino acid. The ribosome links the new amino acid to the chain, then slides one codon over. Real ribosomes add about 5 amino acids per second.',
    'When a stop codon (UAA, UAG or UGA) reaches the ribosome, no tRNA matches. A release factor frees the finished protein, which then folds into its working shape. This one is 7 amino acids long.'
  ]
},
lacoperon: {
  hook: 'A lab grows E. coli in plain broth, then adds lactose (milk sugar). How much of the lactose-cutting enzyme, β-galactosidase, does each cell end up making, and how does that change if glucose, the sugar E. coli prefers, is in the broth too?',
  answer: 'With neither sugar the genes are off, and each cell holds about 50 enzyme molecules from a small leak. Add lactose and the genes switch on within about 3 minutes, climbing to about 1,700 per cell in an hour and 2,400 at full speed. With glucose there too, the genes only run low, near 580 per cell, about a quarter as much.',
  uses: [
    'Lactose intolerance: most adults worldwide make much less lactase after childhood because the gene is turned down, so gut bacteria ferment the milk sugar instead and make gas.',
    'Biotech labs: researchers switch on genes in E. coli with IPTG, a lactose look-alike that pulls the repressor off, so the cells make a chosen protein only when wanted.',
    'Blue-white screening: X-gal turns blue when β-galactosidase cuts it, so students can tell which bacterial colonies have a working lac gene just by their color.'
  ],
  takeaway: 'Cells save energy by making a protein only when it is needed. A gene’s switch stays off until its job shows up, and if a better option is around, like glucose, it barely turns on.',
  tour: [
    'This strip is a short piece of E. coli DNA, from the bacterium that lives in your gut. The three genes on the right hold the instructions for proteins that let the cell use lactose (milk sugar).',
    'With no lactose, a repressor protein (purple) sits on the operator, the gene’s on/off switch, like a lock on a door. RNA polymerase (teal) can’t get past it, so the genes are off and no energy is wasted.',
    'Now lactose appears outside. A little leaks in and grabs the repressor (watch for orange shapes on it). The repressor changes shape and lets go of the switch, so the lactose itself unlocks the genes.',
    'RNA polymerase slides along the genes, copying them into one long mRNA (red). Watch a new strand grow behind each polymerase. One switch turns on all three genes at once.',
    'Ribosomes (gray) read the mRNA and build β-galactosidase (green). It cuts lactose into two smaller sugars, glucose and galactose, that the cell can use for energy. Lactase pills taken with milk do the same job.'
  ]
},
virus: {
  hook: 'A flask holds 200 million E. coli per mL, and 10,000 T4 phage per mL get in, one virus for every 20,000 bacteria. How long until the cloudy flask turns clear, and would a temperate phage like λ do the same?',
  answer: 'T4 is lytic. The bacteria keep growing for about 30 minutes, to 380 million per mL, then crash: 18 million are left at 90 minutes and none by 2 hours, while free phage reach about 3 billion per mL. λ never clears the flask. The culture stays cloudy and reaches about 1 billion cells per mL by 4 hours, nearly all carrying hidden phage DNA.',
  uses: [
    'Yogurt and cheese: dairies rotate their starter bacteria strains, because a phage outbreak can wipe out a vat of fermenting bacteria in hours.',
    'Phage therapy: doctors have used phages to treat some antibiotic-resistant infections, choosing phages whose tail fibers fit the receptors on that patient’s bacteria.',
    'Cholera: the gene for cholera toxin came to Vibrio cholerae on a phage that lives in the bacterium’s chromosome, the way a prophage does.'
  ],
  takeaway: 'A lytic virus turns each cell it enters into about 100 new viruses, so a few viruses can clear billions of cells in hours. A temperate virus can hide in the host’s DNA instead and get copied every time the cell divides.',
  tour: [
    'This virus, bacteriophage T4, infects E. coli. It has a protein head full of DNA, a tail and tail fibers, like a tiny moon lander. It is not alive on its own: it can only reproduce inside a cell.',
    'Tail fibers grab specific receptor proteins on the bacterium’s surface, like a key fitting a lock. Each virus can only infect cells with the right receptor, which is why a phage that kills E. coli leaves your own cells alone.',
    'The tail contracts like a syringe and injects the phage DNA (red) into the cell. The empty protein coat stays outside; only the instructions go in.',
    'Phage genes take over the cell like hijackers taking over a factory. The host’s own DNA (blue) is broken down, and the cell’s enzymes and ribosomes now copy phage DNA.',
    'New heads and tails are built and packed with DNA. A phage enzyme (lysozyme, the same kind of enzyme found in your tears) breaks the cell wall, and about 100 new phage burst out to infect other cells.',
    'A temperate phage can instead insert its DNA into the host chromosome as a prophage, a hidden passenger. The cell lives on and copies the prophage every time it divides.',
    'Back to the population. Lytic phage clear a cloudy culture within a couple of hours; temperate phage leave it cloudy, full of lysogens, cells carrying hidden phage DNA.'
  ]
},
evolution: {
  hook: 'On a dark lava flow in New Mexico, about 1 in 5 rock pocket mice start out with dark fur. If light mice are 30% less likely to survive owls long enough to breed, about how many years until most mice on the lava are dark?',
  answer: 'With one generation a year, dark mice pass half in about 5 years and reach about 80% in 10 years and 95% in 20. The light allele fades more slowly than light mice do: after 40 years about 10% of alleles are still d, hidden in dark Dd mice where owls cannot select against it.',
  uses: [
    'Hospitals: antibiotics kill the bacteria they can, and the few resistant ones multiply. That is how MRSA, a staph resistant to common antibiotics, became widespread.',
    'Peppered moths: as soot darkened trees around Manchester in the 1800s, dark moths became most of the population, then dropped again after clean-air laws.',
    'Farm weeds: after years of spraying glyphosate (Roundup), resistant Palmer amaranth spread across US cotton and soybean fields.'
  ],
  takeaway: 'Selection does not change any one animal. It changes who survives to breed, so a trait that helps even a little spreads over generations. A harmful recessive allele lingers longest, because carriers look normal.',
  tour: [
    'These mice live in the deserts of Arizona and New Mexico, some on light sand and some on dark lava rock. Their fur color is set by one gene. Owls hunt them by sight.',
    'The dark allele (D) is dominant: DD and Dd mice have dark fur. Only dd mice, with two copies of the light allele, have light fur. So a dark mouse can secretly carry light.',
    'On dark lava, light mice stand out like a white shirt in a dark room. Slow down and watch the owl pick off mice that contrast with the ground. Most of the mice it catches are light.',
    'Only survivors breed, so the next generation inherits their alleles. More D alleles get passed on than d alleles. Each generation here is about one year.',
    'Each generation the dark allele frequency creeps up. Over many generations, most mice end up dark. This is natural selection: the environment decides which alleles get passed on. No mouse changed color; the population did.'
  ]
},
hardyweinberg: {
  hook: 'In a big field of pea plants, 16 out of every 100 have white flowers, the recessive trait. The rest look purple. How many of those purple plants are secretly carrying the white allele?',
  answer: 'White plants are q² = 0.16, so q = 0.4 and p = 0.6. Set p to 0.60: AA is p² = 36% and Aa is 2pq = 48%. So 48 of the 84 purple plants, more than half, carry a hidden white allele.',
  uses: [
    'Cystic fibrosis: about 1 in 2,500 babies of Northern European ancestry have it. That makes q about 0.02, so about 1 in 25 people carry one copy.',
    'Rare recessive traits: when q is 0.02, about 49 copies of the allele hide in carriers for every 1 in an affected person, so selection removes it very slowly.',
    'DNA evidence: crime labs use Hardy–Weinberg genotype frequencies to estimate how rare a DNA profile is, multiplying across many sites in the genome.'
  ],
  takeaway: 'To find carriers, start with the share that shows the recessive trait. Take its square root to get q, then 2pq is the share of carriers. For rare traits, carriers far outnumber the people who show the trait.',
  tour: [
    'Each plant has two copies of a flower-color gene, one from each parent. A (dark dot) makes purple flowers and is dominant; a (light dot) makes white. The center of each flower shows its two alleles.',
    'Put every allele from every plant into one pool, like pouring all the marbles into one jar. p is the fraction that are A and q is the fraction that are a. Since there are only two alleles, p + q = 1.',
    'If plants mate at random, each offspring draws two alleles from the pool, like drawing two marbles. The chance of AA is p × p, of aa is q × q, and of Aa is 2pq (A from either parent). So p² + 2pq + q² = 1.',
    'Here p is now 0.3. Purple is dominant, yet white plants are now the majority: q² = 0.49. Dominant does not mean common. Type O blood is recessive, yet it is the most common type in the US.'
  ]
},
beaks: {
  hookSet: { food: 'drought' },
  hook: 'A drought hits an island where 40 birds have five beak types, 8 of each, and only large, hard seeds are left. Which beak types are still around five generations later, and does any bird’s beak change to fit the seeds?',
  answer: 'After one round, tweezers fall from 20% to about 3% of the birds. By about five generations only clothespin beaks (about 60%) and binder-clip beaks (about 40%) are left. No bird’s beak changes. Birds with the wrong tool starve before breeding, and the survivors’ chicks inherit their beaks.',
  uses: [
    'Galápagos, 1977: a drought on Daphne Major left mostly large, hard seeds. Medium ground finches with deeper beaks survived, and their chicks hatched with deeper beaks too.',
    'Head lice: many US lice no longer die from permethrin, the old standard treatment, because the lice that survived each treatment were the ones that bred.',
    'Fishing: decades of catching the biggest cod off Newfoundland favored fish that mature younger and smaller, before the nets get them.'
  ],
  takeaway: 'Natural selection only works with the variety a population already has. When the food changes, the individuals that happen to fit survive and breed, so the population shifts even though no single bird changes.',
  tour: [
    'Birds live on an island with five kinds of food, from tiny rice grains to hard nuts. Each bird gets one feeding round per generation, its one chance to stock up.',
    'Each bird’s beak works like a tool from a kitchen drawer: tweezers, chopsticks, a spoon, a clothespin or a binder clip. Each tool is best at one food, the way you would not eat soup with chopsticks.',
    'Watch the birds hop from item to item. The dots above each bird count what it has collected. It needs at least 4 to survive, enough food to make it through the season.',
    'Birds that collected fewer than 4 items starve (gray ✕). The survivors breed, and each chick has the same beak as its parent. Nothing a parent does during its life changes its chicks’ beaks.',
    'Count the beaks again. Types that fed well make up more of the population, while types that struggled shrink. This is natural selection: the population changes, not any one bird.',
    'Now only large, hard seeds grow, as after a dry year on the Galápagos. Tweezers and spoons can barely grip them, while clothespins and binder clips do fine. Watch the population shift over the next few generations.'
  ]
},
cladogram: {
  hook: 'A lizard and a frog are both small, cold-blooded and four-legged, while a mouse is furry and warm. Using traits like jaws, lungs, the amniotic egg and hair, is the lizard more closely related to the frog or to the mouse?',
  answer: 'To the mouse. Lizards and mice share the amniotic egg, an embryo wrapped in its own fluid-filled sac, which frogs lack. So lizards and mice share a more recent common ancestor, about 320 million years ago, than either shares with frogs, about 350 million years ago.',
  uses: [
    'Flu vaccines: each year scientists build trees of flu virus samples to see which strains are spreading and choose the strains for next season’s shot.',
    'Birds: shared traits like feathers and wishbones place birds inside the dinosaur branch, so a chicken is a closer relative of T. rex than any crocodile is.',
    'Whales: shared DNA and ankle-bone shape put whales right next to hippos on the tree, even though whales look more like fish.'
  ],
  takeaway: 'Group living things by traits they inherited from a shared ancestor, not by how alike they look. The pair that shares the newest trait shares the most recent ancestor, so they are the closest relatives.',
  tour: [
    'Each colored tag at the top is a living group. A cladogram is a family tree for species. It shows how they are related through common ancestors, not which one came “first”.',
    'The outgroup, like a distant cousin at a reunion, branched off before any of the listed traits evolved. It helps you see which traits are new (derived) in the other groups.',
    'Each hash mark is a new trait that evolved once and was passed down to everything above it on the tree. Traits shared by more organisms evolved earlier, closer to the root. A backbone is shared by six of these seven animals.',
    'Every branch point (circle) stands for a real ancestral population that lived long ago. Everything branching off above it descends from that ancestor, the way you and your cousins descend from shared grandparents.',
    'Two groups are most closely related when they share the most recent common ancestor: the branch point highest on the tree that joins them. Here that pair is the mouse and the human.'
  ]
}
});

/* b3.js */
BioLab.addPractical({
popgrowth: {
  hook: 'Ten deer reach an island with enough grass for 500 deer, and they grow at the default rate (r = 0.5 per year). How many years until the island is nearly full, and when is the herd adding deer fastest?',
  answer: 'The herd passes 250, half the island’s limit, at about year 8 and reaches 475 (95% of K) at about year 14. It adds deer fastest near 250, about 62 deer a year. With unlimited food the same 10 deer would pass 9,000 by year 14.',
  uses: [
    'St. Matthew Island, Alaska: 29 reindeer grew to about 6,000 by 1963, then crashed to 42 after eating the lichen. Real herds can overshoot K when food regrows slowly.',
    'Leftovers: E. coli can double about every 20 minutes in warm food, which is why food-safety rules say not to leave leftovers out more than 2 hours.',
    'Fishing limits: managers aim catch limits at the maximum sustainable yield, the most a stock can replace each year, which comes when it is held near half its carrying capacity.'
  ],
  takeaway: 'A growing population starts slow, speeds up, then levels off at what its food can support. It adds the most individuals per year at about half that limit, which is why harvested herds and fish stocks are managed near half of K.',
  tour: [
    'A few deer swim to an island with no wolves and plenty of grass, like the 29 reindeer put on St. Matthew Island, Alaska, in 1944. Each deer on screen is one real deer until the herd gets big.',
    'Every year some deer have fawns. A green + marks a birth. More deer means more parents, so births grow every year, the way savings earn more interest as the balance grows.',
    'Some deer die each year from old age or accidents. A fading red deer marks a death. The herd grows only while births outnumber deaths, like a team that signs more players than it loses.',
    'Watch the grass turn brown. As the herd grows there is less food for each deer, so fewer fawns survive and more deer starve, like a cafeteria running out of pizza as the line gets longer.',
    'The gauge on the right compares the herd (red) with the carrying capacity K (dashed line), the most deer the island’s food can feed. Growth slows and stops near K, so the graph bends into an S, the logistic curve.'
  ]
},
productivity: {
  hook: 'Fertilizer washes into a backyard pond and the algae double. Algae make oxygen in light but use it all the time. Over 24 hours in the dark, does the extra algae leave the fish more oxygen or less?',
  hookSet: { nut: 'high' },
  answer: 'Less. With medium nutrients the dark bottle drops from 8.23 to 6.79 mg/L of oxygen in 24 hours. With high nutrients, twice the algae, it drops to 5.59 mg/L, nearly twice as far. In full light the same water climbs to about 14.8 mg/L. More algae means bigger swings: more oxygen by day, less by night.',
  uses: [
    'Summer lakes: dissolved oxygen is lowest at dawn, after a night of respiration with no photosynthesis, so fish kills in warm, green ponds usually happen around sunrise.',
    'Wastewater plants: the BOD test seals water in the same 300 mL bottles in the dark for 5 days. The oxygen drop tells operators how much decaying matter the water still carries.',
    'Aquariums: a tank packed with plants still needs an air pump at night, when the plants stop making oxygen but keep using it.'
  ],
  takeaway: 'Algae and plants make oxygen only in light, but they use it day and night. More algae means more oxygen by day and a deeper drop by night, so a green, crowded pond is most dangerous for fish just before dawn.',
  lede: 'Seal pond water in a clear bottle and a foil-wrapped one, wait a day, and measure the oxygen. You will find out how much oxygen algae make in light and use in the dark.',
  tour: [
    'Pond or lake water is full of algae too small to see. It goes into identical sealed bottles, like jars with the lids screwed on, so no oxygen can get in or out.',
    'One bottle is measured right away with a dissolved oxygen (DO) probe, which reads how much O₂ gas is dissolved in the water. This starting number is what every other bottle is compared with.',
    'In the clear bottle, algae photosynthesize and respire at the same time, like a bank account with deposits and withdrawals. Watch the O₂ labels appear as photosynthesis adds oxygen faster than respiration uses it.',
    'The foil-wrapped bottle gets no light, like a pond at night. Algae there can only respire, using oxygen the way you do, so its oxygen only goes down.',
    'The bottles sit for a full day, and the clock shows how long they have been sealed. The light bottle shows photosynthesis minus respiration. The dark bottle shows respiration alone.'
  ]
},
predprey: {
  hook: 'Snowshoe hares are a favorite small-game animal. To help hunters, a wildlife agency traps half the lynx in a forest one winter. Will the forest have more hares for years to come, or only for a while?',
  answer: 'Only for a while. Depending on timing, the next hare peak shifts by a few thousand, up to about 17,000 per 100 km² instead of the usual 13,800. Then the lynx rebuild and hares crash to about 1,900 again. Within two cycles the forest is back to its usual swing: hares from about 1,900 to 13,800, lynx from 17 to 49.',
  uses: [
    'Colorado lynx: Canada lynx were released in the San Juan Mountains starting in 1999. Biologists chose areas with snowshoe hares, because lynx kittens survive mainly in good hare years.',
    'Gardens: insecticide kills ladybugs along with aphids. The aphids usually bounce back first, because prey reproduce faster than their predators, so the pest problem can get worse.',
    'Newfoundland: after cod were fished out in the early 1990s, northern shrimp and snow crab, which cod eat, boomed, and fishing fleets switched to catching them.'
  ],
  takeaway: 'Predator and prey numbers rise and fall in turn, with the predator a few years behind. A one-time change to either one fades out. Only a lasting change, like a higher death rate or more food, moves where the numbers settle.',
  tour: [
    'Snowshoe hares eat twigs and bark, and Canada lynx eat mostly hares, about three-quarters of their diet. Each brown icon stands for 250 hares and each gray icon for 3 lynx.',
    'Lynx are scarce right now, so hares have plenty of young and few get caught. A hare can raise several litters a summer, so watch the hare count climb fast.',
    'With lots of hares to catch, lynx eat well and raise more kittens. Lynx numbers climb too, but a couple of years behind the hares, because raising young takes time.',
    'Now so many lynx are hunting that they eat hares faster than hares can be born. Watch the chase: the hare population crashes even while the lynx are doing well.',
    'Hares are scarce now, so lynx go hungry and raise few kittens. The lynx population crashes too, a year or two after the hares, like a store that closes after its customers move away.',
    'With few lynx left, hares recover and the cycle starts over, about every 10 years. Pelt counts from the Hudson’s Bay Company fur trade show this same rise and fall going back to the 1800s.'
  ]
},
energy: {
  hook: 'An adult eats about 2,000 kcal a day. Suppose you lived only on fish from this lake. How much lake would it take to feed you for a year on pike, the 4th level, compared with minnows, the 3rd?',
  answer: 'Algae store 10,000 kcal per m² a year, minnows get 100 and pike get 10. A year of food is about 730,000 kcal, so pike would take 73,000 m² of lake, about 10 soccer fields, and minnows 7,300 m², about one. Each step up the chain costs about 10 times more lake.',
  uses: [
    'Serengeti: about 1.3 million wildebeest graze the plains, but only a few thousand lions live there. Each step up the food chain supports far fewer animals.',
    'Grain or beef: cattle turn only a small share of the grain they eat into meat, so the same field feeds several times more people as grain than as steak.',
    'Colorado fishing: state advisories limit how much walleye and pike you should eat from some reservoirs because of mercury, which builds up in fish high on the food chain.'
  ],
  takeaway: 'Each step up a food chain keeps only about a tenth of the energy. Eating one step lower can feed about 10 times as many people from the same land or water, which is also why top predators are always rare.',
  lede: 'Follow the energy in a lake from sunlight to algae to fish. You will see why it takes a lot of lake to feed a few big fish.',
  tour: [
    'Sunlight hits the lake. Phytoplankton, tiny floating algae, catch a small part of it by photosynthesis, the way a solar panel catches only some of the light that hits it. Each yellow square is a packet of energy.',
    'Phytoplankton spend some of that energy staying alive and store the rest in their bodies. That stored energy, counted in kcal like a food label, is the food for everything else in the lake.',
    'Zooplankton, tiny animals many no bigger than a grain of sand, eat the phytoplankton. Follow the packets: only about 1 in 10 makes it up to the next level.',
    'Most of the energy each organism takes in is burned for moving, breathing and staying alive, and leaves as heat (orange squiggles), the same reason you warm up when you run. Some sits in parts nobody eats, like shells, bones and waste.',
    '10,000 → 1,000 → 100 → 10 kcal per m² each year. Each level gets about a tenth of the level below it. The 10 kcal at the top is less than one saltine cracker.',
    'Pike get only about 10 kcal per m² a year, so each pike needs a big stretch of lake to hunt. A lake can feed huge numbers of minnows but only a few pike, which is why food chains rarely go past 4 or 5 levels.'
  ]
},
biodiversity: {
  hook: 'Your class surveys the meadow with a hula hoop that covers 0.44 m², less than 1% of the field. The meadow has 8 plant species. If you toss the hoop at random, how many tosses until you have found them all?',
  answer: 'One random hoop finds about 5 of the 8 species. Three hoops find about 7 on average, and ten find all 8 about 9 times in 10. The ones you miss are rare, clumped plants like milkweed. By ten hoops your Simpson’s index also lands near the whole field’s 0.85.',
  uses: [
    'Christmas Bird Count: each winter, volunteers count every bird in a circle 15 miles (24 km) across. More observers and more hours usually turn up more of the rare species.',
    'Election polls: a pollster surveys about 1,000 randomly chosen voters to estimate a whole state. Random choice matters more than size, the same reason you toss the hoop without aiming.',
    'Front yards: a mowed bluegrass lawn can hold 4 species and still score about 0.3 on Simpson’s index, because grass is most of the plants. Evenness counts, not just the species list.'
  ],
  takeaway: 'Random samples find the common species fast and the rare ones slowly. Keep sampling until a few more samples add nothing new, and never choose where to sample by eye, or you will measure what you hoped to see.',
  tour: [
    'This is a patch of meadow 10 m × 5.6 m, a bit smaller than a classroom, seen from above. Each mark is one plant: grass tufts, clover, dandelions, wildflowers. Counting every plant would take days.',
    'Instead, toss a hula hoop at random, without aiming. If you aimed for the flowers, your sample would be biased, like asking only your friends to name the best pizza place.',
    'Count every plant of every species inside the hoop. One hoop covers 0.44 m², less than 1% of this field, so each hoop is a small peek at the whole.',
    'More hoops give a better picture. Rare species, like milkweed growing in a few clumps, only show up after many samples, the way you need more than one handful to find the rare candy in a mixed bag.',
    'Richness is the number of species you found. Check the graph: it climbs quickly at first, then levels off as new hoops stop turning up new species. That flat part tells you when you can stop.',
    'Simpson’s index is the chance that two plants picked at random are different species. Near 0 means one species takes over, like a lawn that is mostly grass. Near 1 means many species in similar numbers.'
  ]
},
biomes: {
  hook: 'Denver and Boston have nearly the same average temperature, about 10 °C and 11 °C, yet Boston grew forest and Denver was prairie. How much rain and snow does each get a year, and how much more would Denver need for a forest?',
  answer: 'Denver gets about 38 cm of precipitation a year and Boston about 113 cm, three times as much. On this diagram a 10 °C climate switches from grassland to deciduous forest at 60 cm a year, so Denver would need about 22 cm more. Water, not warmth, keeps trees off the Denver plains.',
  uses: [
    'Denver lawns: Kentucky bluegrass needs more water than Denver’s 38 cm a year provides, which is why Denver Water limits summer lawn watering to set days each week.',
    'Front Range hikes: climbing from Denver to about 3,500 m takes you from prairie through pine forest to alpine tundra, because higher ground is colder and wetter.',
    'Southern California fires: Los Angeles gets almost no rain from May to September, so by fall the chaparral shrubs are dry fuel for fires driven by Santa Ana winds.'
  ],
  takeaway: 'In a climate like Denver’s, under about 25 cm of rain and snow a year means desert, 25 to 60 cm means grassland, and more means forest. Water, more than warmth, decides whether trees can grow.',
  tour: [
    'This graph is one place’s average weather across a year, January to December, built from 30 years of records. Every biome has its own pattern.',
    'The red line is each month’s average temperature. Denver’s rises above 20 °C (68 °F) in July and drops below freezing in winter.',
    'Each blue bar is that month’s rain and melted snow, in millimeters. Add them up for the yearly total. Denver gets about 38 cm, about 15 inches, the height of a bowling pin.',
    'This chart sorts biomes by two numbers: average temperature (left to right) and yearly precipitation (bottom to top). Those two numbers predict most of what grows in a place.',
    'The red dot is the place you picked. Denver lands in temperate grassland: too dry for forest, too wet for desert. Before the city, this was shortgrass prairie with bison and prairie dogs.',
    'Climate decides which plants can grow, and the plants decide which animals can live there. The panel describes this biome’s climate, plants and animals.'
  ]
},
carboncycle: {
  hook: 'Suppose the whole world cut fossil-fuel burning in half, from 10 to 5 GtC (billion tonnes of carbon) a year, starting now. Would CO₂ in the air start falling, or only rise more slowly?',
  answer: 'It would only rise more slowly. At today’s settings CO₂ climbs from 415 to about 458 ppm by 2045, about 2 ppm a year. Cut in half, it still reaches about 424 ppm, rising about 0.6 ppm a year. CO₂ falls only when emissions drop below what plants and the ocean soak up. With zero emissions it slides to about 386 ppm by 2045.',
  uses: [
    'Mauna Loa, Hawaii: CO₂ measured there since 1958 has climbed from about 315 ppm to over 420 ppm, with a small dip each northern summer when forests leaf out.',
    'Your gas tank: burning 1 gallon of gasoline puts about 8.9 kg (19.6 lb) of CO₂ into the air, carbon that sat underground for millions of years.',
    'Colorado forests: lodgepole pines killed by mountain pine beetles stop taking in CO₂ and slowly release their carbon as they rot or burn, so a forest can switch from sink to source.'
  ],
  takeaway: 'CO₂ in the air works like water in a bathtub: the level keeps rising as long as the tap adds more than the drain removes. Cutting emissions slows the rise; only cutting below what land and ocean absorb makes it fall.',
  tour: [
    'Follow the large highlighted atom. It is part of a CO₂ molecule floating in the air, along with about 870 billion tonnes of other carbon. Every breath you take holds some of it.',
    'A leaf takes in the CO₂ through tiny pores. Photosynthesis uses sunlight to build the carbon into sugar. About half the dry weight of a tree is carbon pulled from the air this way.',
    'A deer eats the leaf. The carbon becomes part of the deer’s food, and then its muscles and cells, the same way the carbon in your lunch becomes part of you.',
    'The deer’s cells break down the sugar in cellular respiration and breathe the carbon out as CO₂. The atom is back in the air, sometimes within hours. You do the same thing every time you exhale.',
    'Another path: CO₂ dissolves into the ocean surface, the same way CO₂ is dissolved in a can of soda. Some sinks to the deep ocean, where it can stay for centuries.',
    'A tiny fraction of dead plants gets buried before it rots. Over millions of years, heat and pressure turn it into coal, oil and gas: carbon from ancient sunlight, stored underground.',
    'Burning fossil fuel releases in seconds carbon that took millions of years to store. People do this at about 10 GtC (10 billion tonnes of carbon) a year, far faster than nature buries it.'
  ]
},
islandbio: {
  hook: 'A small island (10 km²) 500 km offshore holds only about 8 of the mainland’s 100 species. Which would add more species: making the island 100 times bigger at the same spot, or moving the same small island to 10 km offshore?',
  answer: 'Moving it closer wins. At 1,000 km² and 500 km out it levels off near 32 species, because big populations rarely die out. At 10 km² and 10 km out it levels off near 52, because far more species arrive. Big and close, like island A, holds about 84. For a remote island, being reachable matters more than being big.',
  uses: [
    'Colorado Highway 9: wildlife overpasses and underpasses near Kremmling cut collisions with deer and elk by about 90%, reconnecting habitat that the road had split in two.',
    'Hawaii: about 3,800 km from the nearest continent, the islands received so few land animals that the only native land mammal is a bat.',
    'Mountain pikas: pikas live in cold rock fields on Colorado peaks, separated by warm valleys they rarely cross, so each peak’s population is cut off like an island.'
  ],
  takeaway: 'Big habitats lose fewer species, and nearby habitats gain more. A park, woodlot or reef holds the most species when it is large and connected to other wild land; a small, isolated patch slowly loses species it cannot replace.',
  tour: [
    'The mainland holds a pool of 100 species of birds, insects and plants. Any of them could reach an island by flying, floating on driftwood or being blown there by a storm.',
    'Island A is big, 1,000 km², and only 10 km offshore, close enough to see from the beach. Island B is small and 500 km away. Both start empty, like a brand-new volcanic island.',
    'Each flying icon is a species reaching an island: a whole species, not one animal. At first almost every arrival is new, so the count climbs fast.',
    'As the island fills, more arrivals are species that already live there, so new species show up more slowly, like a sticker album where most new packs give you doubles.',
    'Each red ✕ is a local extinction: a species dies out on this island but lives on elsewhere. The more species present, the more there are to lose, and small populations go first.',
    'Eventually arrivals balance extinctions and the number of species levels off. Species keep coming and going, but the total holds steady. Big, close islands balance at many species.',
    'Island B gets few arrivals because it is far, and loses species fast because its populations are small. It levels off with very few species, about 8 of the 100.'
  ]
},
succession: {
  hook: 'A wildfire burns the forest above a mountain town, but the soil survives. Up the valley, a glacier melts back and leaves bare rock. On each slope, how long until trees cover half the ground again?',
  hookSet: { start: 'secondary' },
  answer: 'After the fire, grasses cover the slope within about 7 years and trees cover half of it by about year 30, because soil, roots and seeds survived. On bare rock, lichens and mosses spend about a century building the first 2 cm of soil, and trees cover half the ground only around year 230. Real bare-rock succession can take even longer.',
  uses: [
    'Colorado aspen: after a fire, aspen sprout from roots that survived underground, so a burned aspen stand can be thick with saplings within a few years.',
    'Mount St. Helens: after the 1980 eruption, slopes buried in fresh pumice started almost from scratch, while patches where snow had protected plants and soil greened up far sooner.',
    'Old farm fields: a field left alone goes from weeds to grasses to shrubs to trees over decades, the textbook case of secondary succession in the eastern US.'
  ],
  takeaway: 'Soil is the head start. After a fire that leaves soil, roots and seeds, a slope can be young forest within a few decades. Where the soil is gone, after a glacier, landslide or severe erosion, recovery takes centuries.',
  tour: [
    'A glacier has just melted away, leaving bare rock like a boulder field above treeline. There is no soil at all. This is where primary succession, life starting from nothing, begins.',
    'Lichens are the pioneer species, the first to move in. You have seen them as crusty orange, green or gray patches on boulders. They release acids that slowly break down rock and add their dead remains. The close-up shows rock grains turning into the first soil.',
    'Once there is a little soil, mosses and then grasses can grow. Each stage changes the ground, adding soil and holding water, and makes room for the next one.',
    'With deeper soil, shrubs and then fast-growing trees take root. They grow taller and shade out the small sun-loving plants beneath them.',
    'Shade-tolerant trees, like spruce and fir, eventually take over. This stable, long-lasting stage is the climax community. From bare rock it takes a few centuries to get here.',
    'Now a fire burns the forest. The soil and many roots and seeds survive, so recovery is secondary succession, and it goes much faster than starting from rock: trees cover half the slope again in a few decades.'
  ]
},
wolfmoose: {
  hook: 'Your class of 24 plays Wolf, Moose, Grass. In year 5 the teacher pulls every wolf out of the game. With nothing hunting them, do the moose take over the gym and stay that way?',
  hookSet: { luck: 'avg' },
  answer: 'No. In the Average game the moose jump to about 19 of the 24 players the next year. Then there is too little grass: most moose starve and turn into grass, dropping the herd to about 8. From then on the moose swing between about 8 and 19 every few years, booming and crashing against their food supply.',
  uses: [
    'Yellowstone: wolves were gone from about 1926 to 1995. Elk browsed streamside willows and aspen hard, and after wolves returned, some of those willow stands began to recover.',
    'Isle Royale, Michigan: wolves fell to just 2 by 2016 and moose climbed toward 2,000, so the park began bringing in new wolves in 2018.',
    'Colorado: voters approved bringing back gray wolves in 2020, and the first 10 were released in Grand and Summit counties in December 2023.'
  ],
  takeaway: 'Every population is held back by something. Take away the predator and prey numbers do not grow forever; they climb until food runs short, then crash. Predators often keep prey from eating through their own food supply.',
  tour: [
    'This is the gym game. Every figure is a student in a pinny: W wolves wait in the middle, M moose start at home, and G grass players crouch in the meadow. One round of the game stands for one year.',
    'When the round starts, every moose sprints for the meadow. A moose has to tag one grass player to eat, like an elk finding enough grass to make it through the year.',
    'Each wolf can tag one moose on the way across. A tagged moose has been eaten. The more moose on the field, the easier the hunt.',
    'Moose that reach grass eat and survive. Moose that find no free grass player starve. Wolves that catch nothing starve too. Food, not just wolves, decides who makes it.',
    'Everyone switches roles. A tagged moose becomes a wolf: eating moose makes more wolves. The grass a moose ate becomes a moose. Starved moose and wolves become grass, like decomposers returning nutrients to the soil. The class size never changes.',
    'After every round, count each population and write it down, like a biologist doing a yearly count from a plane. The scoreboard shows this year’s numbers, and the table and graph build year by year.'
  ]
},
humanpop: {
  hook: 'Suppose every family in Niger had about 2 children (2.1) starting this year instead of nearly 7. Would Niger’s 27 million people stop growing right away? How big would the country get?',
  hookSet: { tfr: 2.1 },
  answer: 'No. Niger keeps growing for decades: from 27 million to about 34 million in 20 years and about 41 million around 2076, half again as many people, before it levels off. Almost half the country is under 15, so a huge generation is about to become parents. At 6.7 children per woman it would pass 170 million by then.',
  uses: [
    'Your high school: babies born this year are the freshman class of about 2040, so school districts read birth counts to plan buildings and teachers years ahead.',
    'Social Security: about 2.7 US workers pay in for each retiree today, down from about 5 in 1960, because the baby boom generation has moved to the top of the pyramid.',
    'Japan: about 29% of people are 65 or older, the highest share of any large country, and hundreds of schools close each year for lack of children.'
  ],
  takeaway: 'A country’s future is already drawn in its pyramid. A wide base keeps it growing for decades after families shrink, and a narrow base keeps it shrinking even if families grow. Changes in family size take a generation to show.',
  tour: [
    'Each bar is an age group 5 years wide: babies at the bottom, the oldest people at the top. Males are on the left and females on the right. Longer bars mean a bigger share of the country. Most of your class sits in the 15 to 19 bar.',
    'Niger has the highest fertility in the world, nearly 7 children per woman. The wide bottom means many children, who will soon have children of their own.',
    'Every year each group gets one year older and slides up a step, losing some people to death. The bars you see rising are real generations, like your grade moving up through school.',
    'The chart at the right shows the four stages: first death rates fall, thanks to clean water, food and vaccines, then birth rates fall. The dot marks where this country is now.',
    'The United States has low birth and death rates. Its pyramid looks more like a column, and growth is slow. Immigration adds young adults, which widens the bars in their 20s and early 30s.',
    'Japan averages about 1.2 children per woman, far below the 2.1 needed to replace two parents. The base is narrow and the top is heavy, so the population shrinks and ages.'
  ]
},
homeostasis: {
  hook: 'You skip a snack and run hard for 30 minutes at practice. Your leg muscles are pulling sugar out of your blood the whole time. Does your blood sugar crash, and if not, where does the extra sugar come from?',
  answer: 'It dips but does not crash. Blood glucose falls from about 90 to 81 mg/dL in the first 15 minutes and holds there. The pancreas raises glucagon from about 60 to 90 pg/mL, and glucagon tells the liver to break down stored glycogen and release glucose to replace what the muscles take. About 15 minutes after you stop, glucose is back near 88.',
  uses: [
    'Glucose monitors: many people with type 1 diabetes wear a small sensor that reads blood sugar every few minutes, standing in for the insulin feedback their pancreas no longer provides.',
    'Fever: an infection resets the brain’s thermostat higher, which is why you get chills and shiver while your temperature rises, and sweat when the fever breaks.',
    'Running in Denver’s dry air: sweat evaporates so fast you may not feel wet, yet a runner can still lose a liter or more of sweat an hour on a hot day.'
  ],
  takeaway: 'Your body defends its set points with negative feedback: when a value drifts, a response pushes it back, then eases off. That holds blood sugar near 90 mg/dL and your core near 37 °C whether you eat, run or step into the cold.',
  lede: 'Eat a meal, run, or step into the cold, and watch your body pull blood sugar and temperature back to normal. You will see the feedback loops that keep you steady.',
  tour: [
    'Glucose (gold) is the sugar your cells burn for energy, and blood carries it everywhere. A healthy body holds it near 90 mg/dL: only about a teaspoon of sugar in all 5 liters of your blood.',
    'Digestion breaks the carbohydrates in food, like bread or juice, into glucose. It crosses the wall of the small intestine into the blood, and blood glucose starts to rise.',
    'The pancreas, an organ tucked behind your stomach, senses the rise and releases insulin (blue) into the blood.',
    'Insulin acts like a key: it opens glucose doors on muscle and fat cells and tells the liver to store glucose as glycogen. Glucose falls back toward normal. When it does, insulin falls too. That is negative feedback.',
    'Exercise burns glucose. When blood glucose dips, alpha cells in the pancreas release glucagon, and the liver breaks down its glycogen to put glucose back in the blood, like spending from savings.',
    'Temperature works the same way, like a home thermostat. Your brain’s thermostat, the hypothalamus, compares your core with a set point of 37 °C. In the cold, skin vessels narrow and muscles shiver to make heat.',
    'In the heat, skin vessels widen, which is why your face flushes, and you sweat. Evaporating sweat carries heat away, like water drying off your skin after a swim, and pulls the core back toward 37 °C.'
  ]
},
pipette: {
  hook: 'A DNA experiment calls for 7.5 µL of enzyme, about a seventh of a raindrop. Which micropipette do you grab, and how far off would you be if you pressed to the second stop before drawing it up?',
  hookSet: { dial: 75 },
  answer: 'Grab the P20, which covers 2 to 20 µL, and set it to 0-7-5. Starting from the second stop draws about 27% extra, about 9.5 µL. Letting the plunger snap back draws about 7% too little, about 7.0 µL, plus bubbles. And 0-7-5 on a P200 would be 75 µL, ten times too much.',
  uses: [
    'Kitchen check: a teaspoon is about 5,000 µL. At 7.5 µL, a slip of just 1 µL is a 13% error, which is why lab volumes need a pipette, not a spoon.',
    'Children’s medicine: liquid doses come with a syringe or cup marked in mL instead of a kitchen spoon, because spoons vary too much in size.',
    'Glucose meters: a finger-stick blood sugar test needs a drop of about 1 µL or less, smaller than the lowest setting on a P20.'
  ],
  takeaway: 'Use the smallest pipette whose range covers your volume, read its dial the way that pipette is marked, and draw up from the first stop. The second stop is only for pushing out the last drop.',
  lede: 'Practice measuring drops far smaller than a teaspoon. Pick the right micropipette, read its dial, and learn the two stops that make the volume come out right.',
  tour: [
    'Plunger on top, volume display in the middle, a disposable tip at the bottom. Liquid only ever touches the tip, which you throw away, so one sample never contaminates the next.',
    'This P20 reads 0-7-5. On a P20 the last digit is tenths, so it is set to 7.5 µL, about a seventh of a raindrop. A P200 showing the same 0-7-5 would be 75 µL, ten times more.',
    'Before the tip goes into the liquid, press the plunger down to the first stop, where you feel it push back. That clears out exactly the amount of air you are about to replace with liquid.',
    'Put the tip just under the surface and let the plunger rise slowly, like easing up on a turkey baster. Liquid flows up into the tip.',
    'Move to the tube. Press to the first stop to push the liquid out, then all the way to the second stop to blow out the last drop clinging inside the tip.',
    'The tube now holds 7.5 µL. Pressing to the second stop before drawing up takes about 27% too much, and letting the plunger snap back takes too little and adds bubbles. Try both mistakes and compare.'
  ]
},
gel: {
  hook: 'You load a 7 cm gel, set the power to 100 V and leave for 50 minutes. The smallest band in the ladder is 250 base pairs. Will it still be on the gel when you get back, and when should you have stopped?',
  answer: 'No. At 100 V the 250 bp band moves about 0.15 cm a minute, so it reaches the end of the 7 cm gel at about 47 minutes and runs off into the buffer. The blue dye runs just behind it, so stop when the dye is about 80% of the way down, at about 38 minutes. At 150 V it is gone by about 31 minutes.',
  uses: [
    'Crime labs: the FBI’s CODIS database compares 20 DNA markers, sized by electrophoresis in a capillary thinner than a hair. The rule is the same: small pieces arrive first.',
    'Paternity tests: each band in a child comes from the mother or the father, so a man missing any band the child did not get from the mother is ruled out.',
    'School labs: plug the leads in backward and every sample leaves its well the wrong way, into the buffer. Black at the wells, run to red.'
  ],
  takeaway: 'How far DNA moves depends on its size and on voltage times time, so double the voltage and the run takes half as long. Nothing stops DNA at the end of the gel. Switch off when the blue dye is about 80% down.',
  tour: [
    'A slab of agarose gel, a jelly made from seaweed, sits in a box of salty buffer that carries electric current. The row of small pockets near the top are the wells, where the samples go.',
    'Each sample is mixed with dense blue loading dye, so it sinks into its well instead of floating away. Lane 1 is a DNA ladder: pieces of known sizes, like the marks on a ruler.',
    'Black to black, red to red, with the wells at the black (negative) end. Lab rule: run to red. Plugged in backward, your samples leave the gel and are lost.',
    'DNA’s backbone is negatively charged, so the electric field pulls every piece toward the positive (red) end, the way opposite charges attract. Watch the blue dye front.',
    'Agarose is a tangled mesh, like a thick hedge. Small pieces slip through the gaps quickly; big pieces get caught and lag behind. The DNA sorts itself by size.',
    null,
    'Compare the evidence lane (E) with each suspect. A match needs every band in the same place. Suspect 2 matches all four bands; Suspect 1 shares only two.'
  ]
},
plasmid: {
  hook: 'A tube labeled pBR322 has sat in the freezer for years. You can run one digest to check it. Would EcoRI alone, or HindIII plus BamHI, give the more convincing answer, and what bands do you expect?',
  answer: 'EcoRI cuts pBR322 once, so you get one 4,361 bp band, which any plasmid of about that size with one EcoRI site would also give. HindIII (at 29) plus BamHI (at 375) give two bands, 346 bp and 4,015 bp, adding up to 4,361. Two bands at the right sizes is a much stronger fingerprint.',
  uses: [
    'Insulin: since 1982, most insulin for people with diabetes has been made by microbes carrying the human insulin gene on a plasmid, joined in with restriction enzymes and ligase.',
    'Research labs: before paying to sequence a new plasmid, scientists often run a quick diagnostic digest and check the band sizes on a gel in about an hour.',
    'Where the enzymes come from: bacteria use restriction enzymes to chop up virus DNA. EcoRI is named for the E. coli strain RY13 it was found in.'
  ],
  takeaway: 'In a ring, every cut makes one fragment, so n cuts give n pieces that always add up to the whole plasmid. To check a plasmid, pick enzymes that give a distinctive set of sizes and compare them with a ladder.',
  tour: [
    'The ring is the plasmid’s DNA, a tiny loop bacteria carry besides their main chromosome. Positions are numbered in base pairs, starting at the top and going clockwise like a clock face, around to 4,361.',
    'Colored arcs are genes and other features. ori lets the plasmid copy itself, and ampR and tetR let the bacterium survive the antibiotics ampicillin and tetracycline.',
    'Each tick is a site where an enzyme recognizes a short sequence and cuts, like scissors that only cut at one word. EcoRI recognizes GAATTC and cuts between the G and the A.',
    'HindIII (at 29) and BamHI (at 375) each cut once. Two cuts in a ring make two pieces, like cutting a rubber band in two places.',
    null,
    'The predicted lane (D) sits next to a ladder (L) of known sizes. Small pieces travel farther, so the 346 bp band is near the bottom and the 4,015 bp band near the top.'
  ]
},
pcr: {
  hook: 'A swab from a sick student carries only about 10 copies of a virus gene, but a band on a gel needs roughly a billion. Each PCR cycle takes about 2 minutes. How many cycles, and how long, until there is enough to see?',
  hookSet: { start: '10' },
  answer: 'About 27 cycles, a little under an hour. Doubling 10 copies 27 times gives about 1.3 billion. Starting with 1,000 copies takes only about 20 cycles, because each 10 times more starting DNA saves a little over 3 cycles. That gap in cycles is how a PCR test tells a heavy infection from a light one.',
  uses: [
    'COVID tests: PCR results often reported a Ct value, the cycle when the signal appeared. A Ct about 3.3 cycles lower meant about 10 times more virus in the sample.',
    'Crime labs: PCR can copy DNA markers from a few skin cells left on a phone or a can, which is why evidence techs wear gloves and masks.',
    'Taq polymerase comes from Thermus aquaticus, a bacterium first found in a Yellowstone hot spring, which is why it survives being heated to 95 °C every cycle.'
  ],
  takeaway: 'Doubling adds up fast: 10 doublings multiply by about 1,000, and 20 by about a million. That is why PCR can find a few molecules of DNA, and why a speck of contamination can give a false result.',
  lede: 'Watch a machine copy one gene by heating and cooling a tube, over and over. You will see how a few molecules become billions in about an hour.',
  tour: [
    'The tube holds the DNA you want to copy, two short primers, loose DNA building blocks (A, T, G, C) and Taq polymerase, the copying enzyme. The machine just heats and cools the tube, over and over.',
    'Heating to 95 °C, close to boiling, breaks the hydrogen bonds holding the two strands together. Every double-stranded molecule unzips into two single strands.',
    'The tube cools. Primers, short pieces of DNA, stick to each single strand, one at each end of the stretch you want to copy, like bookmarks marking where copying starts.',
    'Taq polymerase works best at 72 °C. It starts at the end of each primer and adds the bases that match the template, building a new strand.',
    'Each cycle copies every molecule in the tube, so 1 → 2 → 4 → 8. A cycle takes 2 minutes here. After 30 cycles, about an hour, one molecule can become about a billion copies.',
    'A gel sorts DNA by size. Once there are billions of copies, a bright band appears at exactly the length between the two primers. With too few copies, you see nothing.'
  ]
},
transformation: {
  hook: 'You heat-shock E. coli with the pGLO plasmid and spread 100 µL, roughly 100 million cells, on an ampicillin plate. How many of those cells actually take in the new gene, and how do you find the few that did?',
  answer: 'About 125 colonies grow on the LB/amp +pGLO plate, roughly 1 cell in a million. You do not search for them. Ampicillin kills every cell without the plasmid, so each survivor grows into a colony you can count. The plate without ampicillin grows a solid lawn, which proves the cells were alive.',
  uses: [
    'Hospitals: bacteria pass plasmids carrying antibiotic-resistance genes to each other, which is how resistance can spread from one species to another in a hospital.',
    'GFP: the 2008 Nobel Prize in Chemistry went to Shimomura, Chalfie and Tsien for discovering and developing GFP, now used to make cells and genes glow under a microscope.',
    'Pet stores: GloFish, sold since the early 2000s, carry added fluorescent protein genes, the same idea as pGLO: add a gene and see it work.'
  ],
  takeaway: 'When the event you want is rare, do not search for it; select for it. Link it to a survival gene so only the successes grow, and always run a control that shows what happens without the change.',
  tour: [
    'The goal is to give E. coli a new gene. The pGLO plasmid is a small circle of DNA carrying two: one for surviving the antibiotic ampicillin and one for green fluorescent protein (GFP), borrowed from a glowing jellyfish.',
    'Both tubes get ice-cold calcium chloride, a salt, and some bacteria. DNA and the cell surface are both negatively charged and push apart; calcium ions help the plasmid get close to the cell.',
    'Plasmid goes into the +pGLO tube only. The −pGLO tube is the control: same cells, same steps, no new gene, so any difference comes from the plasmid.',
    'The cells go from ice to a 42 °C water bath, a little hotter than a hot tub, for 50 seconds, then straight back to ice. The sudden change helps plasmids slip through the cell membrane.',
    'Each tube is spread on plates. Ampicillin plates kill any cell without the plasmid. The arabinose plate also has a sugar that switches the GFP gene on.',
    'After a day at 37 °C, body temperature, the plate without ampicillin is a solid lawn, the −pGLO ampicillin plate is empty, and only cells that took in the plasmid grow on the +pGLO ampicillin plates. Each dot is a colony grown from one cell.'
  ]
},
blast: {
  hook: 'A store sells burger patties as 100% beef for a suspiciously low price. A lab reads 100 bases of DNA from one patty. How do you tell what animal it came from, and how sure can you be?',
  answer: 'BLAST’s top hit is horse, 99% identical: 99 of 100 bases match. The next hits, pig at 88% and cow at 87%, are other mammals that share an ancestor, not matches. A hit of about 98% or more usually means the same species, and the big gap to the next hit makes the call clear. The “beef” is horse.',
  uses: [
    'Europe, 2013: DNA tests found horse meat in frozen burgers and lasagna sold as beef in Ireland, the UK and other countries, leading to large recalls.',
    'Seafood: a 2013 Oceana survey of over 1,200 US fish samples found about a third mislabeled, and most fish sold as red snapper was another species.',
    'Hospital labs: when bacteria from an infection are hard to identify, labs sequence one gene, the 16S rRNA gene, and search it against databases to name the species.'
  ],
  takeaway: 'When you compare DNA, about 98 to 100% identical usually means the same species, and related species drop to around 80 to 90%. Read the top hit and how big the gap is to the next one.',
  tour: [
    'The query is DNA read from the sample, here a burger patty sold as beef. Each color is one base: A, C, G or T. These 100 letters work like a barcode for the species.',
    'BLAST compares the query with every sequence in a database. The real one at NCBI holds billions of bases; this one has 12, so you can watch each step.',
    'First BLAST looks for short exact matches, words 11 bases long, shared by the query and a database sequence, like searching a book for an exact phrase. Watch the scan move down the list; lines connect matching words.',
    'Each seed is stretched in both directions, allowing a few mismatches, to find the best-matching stretch. Sequences with no seeds are skipped, which is how BLAST can search billions of bases in seconds.',
    'Hits are ranked by score. The top hit is almost identical to the query, so that species is the source. Close relatives score lower, and unrelated sequences do not appear at all.',
    'Vertical bars mark matching bases. Shaded columns are mismatches or gaps. Matches divided by the alignment length give percent identity: 99 of 100 bases is 99%.'
  ]
}
});

/* b4.js */
BioLab.addPractical({
molclock: {
  hook: 'Fossils show humans and mice split 90 million years ago, and one of their genes now differs at about 65 of 1,000 DNA sites. Between humans and chickens the same gene differs at about 220 sites. About how long ago did our lineage split from the chicken’s?',
  answer: '220 is about 3.4 times 65, so the clock puts the human and chicken split about 3.4 × 90 ≈ 300 million years ago. The fossil date is 320. Each run of the model lands within about 10% of that, because mutations arrive at random.',
  uses: [
    'COVID-19 tracking: scientists counted mutations in virus genomes from patients to work out that the virus began spreading in people in late 2019.',
    'Humans and chimps: our DNA differs from chimp DNA at roughly 1.2% of sites, and the clock uses that to place our split around 6 to 7 million years ago.',
    'Fast and slow genes: mitochondrial DNA changes quickly, so it is used to compare close relatives. Slow genes like ribosomal RNA are used to compare bacteria, plants and animals.'
  ],
  takeaway: 'Count the differences and you can estimate the time, as long as one known date sets the rate. Use a fast-changing gene for recent splits and a slow one for ancient splits.',
  lede: 'Watch one gene pick up random changes in six animals over 450 million years. Count how different their DNA is today, and use one fossil date to work out when each pair split.',
  tour: [
    'Start 450 million years ago, before sharks and our ancestors went separate ways. The left side is the true family history from fossils: each branch point is when two lineages split.',
    'Each white flash is one random mutation, a single DNA letter changing. They come at random, but at a steady average rate, like raindrops on a roof. That steady rate is what lets DNA work as a clock.',
    'At each branch point the gene is copied into two lineages. After that each one changes on its own, so the longer two lineages have been apart, the more their DNA differs.',
    'Today, compare the species. Human and chimp split only 6 million years ago and differ at a handful of the 1,000 sites. Human and shark split 450 million years ago and differ at close to 300.',
    'Now rebuild the family tree from the DNA alone. UPGMA, a simple sorting method, joins the two species with the fewest differences, averages their distances to everyone else, and repeats until all six are joined.',
    'One fossil date sets the speed of the clock. Human and mouse split 90 million years ago, so their differences per 90 million years become the rate. Every other split can then be dated, like using a known speed to turn miles into hours.'
  ]
},
qpcr: {
  hook: 'Two people get PCR tests for the same virus. One sample crosses the threshold at cycle 19, the other at cycle 29. Which person’s sample had more virus in it, and about how many times more?',
  answer: 'The cycle 19 sample had more. In the model, the 10⁵-copy well crosses at about cycle 19 and the 10² well at about cycle 29. Ten cycles later means about 1,000 times less starting DNA, because each cycle doubles it and 2¹⁰ ≈ 1,000.',
  uses: [
    'Virus tests: PCR tests for COVID-19 run about 40 cycles. A sample that crosses the threshold early, with a low Ct, started with far more virus than one that crosses late.',
    'Wastewater testing: Colorado and other states measure virus genes in sewage with qPCR, which can show a rise in COVID-19 or flu days before clinic cases climb.',
    'Leukemia care: doctors track the BCR-ABL gene fusion in chronic myeloid leukemia with qPCR. A falling level over months shows the treatment is working.'
  ],
  takeaway: 'In qPCR, a lower Ct means more starting DNA. Each cycle earlier means about twice as much, and every 3.3 cycles earlier means about ten times as much.',
  tour: [
    'This is ordinary PCR, the DNA copier, with one addition: a dye that glows when it sticks to DNA. A camera in the machine checks every well’s glow at the end of each cycle, so you watch the copying happen live.',
    'SYBR Green, the dye, barely glows on its own. It glows strongly when it slips between the two strands of DNA. Each cycle doubles the DNA, so the glow doubles too. After 10 cycles there is about 1,000 times as much.',
    'At first there is too little DNA to see. Then each curve shoots up and levels off when the reaction runs out of ingredients (primers and nucleotides). The 10⁷ well, with the most DNA, crosses the line near cycle 12; the 10² well waits until about cycle 29.',
    'The dashed line is the threshold. The cycle where a curve crosses it is the Ct, the threshold cycle. A low Ct means lots of starting DNA, and a high Ct means very little. PCR virus tests use the same idea.'
  ]
},
crispr: {
  hook: 'Cas9 cuts the sickle-cell gene, and the cell glues the two ends back together but drops one DNA letter. The normal β-globin protein is 147 amino acids long. How long is the protein now, and could it still do its job?',
  answer: 'Only 18 amino acids. Dropping one letter shifts how every three-letter codon after the cut is read, so the cell hits a stop codon early. A protein about one-eighth the normal length cannot work, so the gene is knocked out. An added letter gives 22 amino acids, with the same result.',
  uses: [
    'Sickle-cell treatment: Casgevy, approved in the US in 2023, uses Cas9 to cut a switch (BCL11A) in a patient’s own blood stem cells so they make fetal hemoglobin again.',
    'Lab research: knocking out a gene with Cas9 and watching what breaks is one of the fastest ways biologists find out what a gene does, in mice, zebrafish or cells.',
    'Mushrooms: researchers used CRISPR to knock out a gene for a browning enzyme, making white button mushrooms that brown more slowly after slicing.'
  ],
  takeaway: 'CRISPR is a cutter, not an eraser. Cas9 makes the cut and the cell does the repair. Quick repairs usually add or drop a letter, which breaks the gene. Fixing a gene takes a correct copy for the cell to follow.',
  tour: [
    'These are the first 60 letters of HBB, the gene for β-globin, the protein that carries oxygen in red blood cells. Base 20 is a T instead of an A. That one letter is the change behind sickle-cell disease.',
    'Cas9 can only grab DNA next to a short tag called a PAM: any letter followed by GG (NGG). Think of it as a parking spot. The yellow boxes mark PAMs, and the darker box is the site you chose.',
    'The 20 letters next to the PAM become the guide RNA (orange). It pairs with matching DNA letters like a search term, so it decides exactly where Cas9 cuts.',
    'When guide and DNA match, Cas9 cuts both strands three letters before the PAM. That is a double-strand break, a clean snip all the way through the DNA.',
    'The cell rushes to glue the ends back together. This end-joining often adds or drops a letter. Because the gene is read three letters at a time, that shifts every word after the cut and knocks the gene out.'
  ]
},
sanger: {
  hook: 'You are reading the first 36 DNA letters of a patient’s β-globin gene. Chain-stopping ddNTPs make up 3% of the nucleotides in the tube. A labmate says 30% would give stronger peaks. How many of the 36 letters could you read at 30%?',
  answer: 'Only 12. At 3% you read all 36 letters. At 30% almost every copy stops in the first few letters, so the first peaks are tall but the later ones fade into the noise after letter 12. Going the other way fails too: at 0.3% no peak is tall enough to read.',
  uses: [
    'Sickle-cell testing: Sanger sequencing of the β-globin gene shows the single A to T change, and a carrier shows two half-height peaks at that one spot.',
    'Checking a lab result: after cloning a gene or making a CRISPR edit, researchers send a tube to a sequencing service and get back a chromatogram of about 800 letters.',
    'Human Genome Project: the first human genome, finished in 2003, was read mostly with Sanger sequencing, a few hundred letters at a time.'
  ],
  takeaway: 'Sorting pieces by length turns a mix of random stops into an ordered read: the shortest piece is the first letter. A good read needs balance, because too many stops cut it short and too few leave the peaks too weak.',
  tour: [
    'The tube holds a recipe for copying DNA: a template strand to copy, a short primer that marks where to start, DNA polymerase (the copying enzyme), the four normal letters, and a pinch of colored ddNTPs, letters that stop the copy.',
    'Each copy grows until a ddNTP happens to be added, and then it stops for good. With millions of copies, some stop at every single position, so you get pieces of every length.',
    'The pieces race through a capillary, a tube thinner than a hair. Short pieces move fastest, so they reach the laser in order of length, one letter longer each time.',
    'Each piece ends in a colored stop letter, so the detector records a row of colored peaks called a chromatogram. Green is A, red is T, black is G, blue is C. Read the colors left to right and you have the sequence.'
  ]
},
synthbio: {
  hook: 'Bacteria built to test well water for arsenic glow when the arsenic pulls a repressor protein off their DNA. This switch works the same way, using IPTG. After you add IPTG, about how long until the cells glow at full strength, and what sets how bright they get?',
  answer: 'In the model, GFP reaches about three quarters of full brightness in 30 minutes and levels off at 206 within about 1.5 hours. The ribosome binding site sets the ceiling: a medium RBS gives 103 and a weak one 52. The gene is just as on; each mRNA is simply read less often.',
  uses: [
    'Arsenic test kits: engineered E. coli carrying the ArsR repressor glow when arsenic is in a water sample, a cheap check that has been field-tested on wells in Bangladesh.',
    'Insulin: since 1982, much of the insulin people with diabetes use has been made by bacteria or yeast carrying the human insulin gene.',
    'Protein labs: researchers add IPTG to switch on a gene in E. coli only after the culture has grown, because making lots of protein early slows the cells’ growth.'
  ],
  takeaway: 'Genes can be wired like switches. A repressor is the off button, an inducer pulls it off, and a reporter like GFP shows the result. The ribosome binding site works like a dimmer that sets how much protein each message makes.',
  tour: [
    'Each row is one piece of DNA snapped together from standard parts, like building blocks: a promoter (where RNA polymerase starts reading), a ribosome binding site (where protein building starts), one or more genes, and a terminator that ends the message.',
    'LacI is a repressor, a protein that acts as an off button. When it sits on the lac promoter, RNA polymerase can’t get past, so the GFP gene stays silent and the cells stay dark.',
    'Now IPTG is added. It grabs LacI and pulls it off the DNA, like a key unlocking a door. Watch RNA polymerase start reading the GFP gene.',
    'GFP is a protein that glows green, first found in jellyfish. Biologists use it as a reporter: the brighter the cells, the more the gene is on. Here the glow reaches full strength in about an hour and a half.'
  ]
},
epidemic: {
  hook: 'Measles reaches a town of 10,000 where 90% of people are vaccinated. For COVID-19, about 64% immune is enough to stop the spread. Is 90% enough to stop measles, and about how many people catch it?',
  hookSet: { disease: 'measles', vax: 90 },
  answer: 'No. Measles spreads so easily (R₀ ≈ 15) that about 93% of the town must be immune. At 90%, about 600 people catch it, most of the 1,000 who are not vaccinated. At 95% the outbreak fizzles out after a few dozen cases.',
  uses: [
    'Measles and schools: health agencies aim for about 95% of kids to have two MMR doses, because measles keeps spreading until more than 90% of people are immune.',
    'Flattening the curve: in this model, cutting daily contacts from 10 to 5 drops the peak from about 2,800 people sick at once to about 460, which keeps hospital beds open.',
    'Flu shots: seasonal flu has an R₀ near 1.3, so even modest vaccination rates cut its spread sharply. The shot is remade every year because flu viruses keep changing.'
  ],
  takeaway: 'An outbreak grows when each sick person infects more than one other and shrinks when it is fewer than one. The more contagious a disease, the bigger the share that must be immune: about 64% for COVID-19 here, 93% for measles.',
  tour: [
    'Each dot stands for 50 people in a town of 10,000. Blue dots can still catch the disease. The red dot is 10 people who just came home from a trip sick.',
    'Sick people (red) meet others at school, work and the store. Each red line is one infection passed on during one of those meetings.',
    'R₀ (“R naught”) is how many people one sick person infects when nobody is immune. Multiply three things: people met per day × chance of passing it on per meeting × days contagious. For this COVID-like disease, 10 × 4% × 7 ≈ 2.8.',
    'This bar shows the whole town. Once the immune share (recovered plus vaccinated) passes the dashed line, the herd immunity threshold, each case infects fewer than one new person and the outbreak shrinks. Here that line is at 64%.',
    'Now the town restarts with 70% vaccinated first. The sick travelers infect a few people, but most of their contacts can’t catch it, so the chain dies out. About 60 people get sick instead of over 9,000.'
  ]
},
antibiotic: {
  hook: 'A patient on a 10-day antibiotic course feels better on day 3, when the infection has dropped from about 3.6 billion bacteria to a few thousand. If the patient stops taking doses then, what happens to the infection over the next week?',
  hookSet: { mode: 'patient', treat: 'early' },
  answer: 'It comes back. The doses killed the sensitive bacteria, but most of the few thousand survivors were resistant. With no more doses they regrow to about 8 billion by day 10, and 97% of them are resistant, so the same drug barely touches them. With the full course, the last bacteria are gone by day 10.',
  uses: [
    'Prescriptions: feeling better on day 2 or 3 means the bacteria count has crashed, not that it is zero. The length of a course is set to finish off the survivors.',
    'Locker rooms: MRSA, a staph bacterium resistant to common penicillin-type antibiotics, spreads on shared towels and gear, which is why teams disinfect wrestling mats and athletes cover cuts.',
    'Farm animals: low doses of antibiotics fed to healthy livestock to speed growth select for resistant bacteria, which is why the US ended that use of medically important antibiotics in 2017.'
  ],
  takeaway: 'An antibiotic does not make bacteria resistant; it kills the ones that are not. Any survivors are the toughest ones, so a course is meant to keep going until the survivors are gone too.',
  tour: [
    'This is a giant dish of food for E. coli, about 120 cm (4 ft) long. The middle bands hold more and more antibiotic: 1×, 10×, 100×, then 1000× the dose that kills normal bacteria. Bacteria start at both edges.',
    'Each colored square holds millions of bacteria. They divide and spread into empty squares next to them, like mold spreading across bread. The drug-free edges fill in quickly.',
    'Normal bacteria die in the 1× band, so the front stalls. But the bacteria keep dividing at the border, and every division is another small chance of a mutation, a random copying change in their DNA.',
    'One cell gets a mutation that lets it survive the 1× band. Its descendants show up as a new color. They fill the band, then stall again at 10×, waiting for the next lucky mutation.',
    'Each band takes another mutation, each built on the last. The branching colors are a family tree of mutants, and the bacteria end up surviving 1000× within about 10 days.',
    'Now a patient who stops antibiotics on day 3. The drug wipes out the sensitive bacteria (blue), and the patient feels better. But the few resistant ones (red) survive, and with no more doses they grow back.'
  ]
},
soil: {
  hook: 'A garden bed has sandy loam soil, 65% sand. You pour 100 mL of water on a column of it, next to columns of pure sand and of clay. How much water does each soil hold for plant roots, and how fast does the rest drain?',
  hookSet: { mode: 'drain', sample: 'front' },
  answer: 'The sandy loam keeps about 22 mL and lets about 78 mL drain, most of it within half an hour. Sand keeps only about 10 mL and drains in minutes. Clay keeps about 43 mL but takes hours to drain. Sandy soil needs water more often; clay stays soggy longer.',
  uses: [
    'Cracked basements: many Front Range homes sit on expansive clay that swells when wet and shrinks when dry, which is why gutters should carry water away from the foundation.',
    'Golf greens and sports fields: they are built on mostly sand so rain drains through within minutes and play can start again soon after a storm.',
    'Jar test at home: shake garden soil in a jar of water with a little dish soap, then measure the layers after a day or two to estimate sand, silt and clay.'
  ],
  takeaway: 'Sand drains fast and holds little, clay holds a lot but drains slowly, and loam sits in between. Water sandy soil a little and often; water clay soil slowly and less often so it does not stay soggy.',
  tour: [
    'Dig down and soil changes, like layers in a cake. O is fresh leaf litter. A is dark topsoil full of humus (rotted plant matter) and life. E is a pale layer that water has washed out. B collects clay and minerals from above. C is broken rock, and R is bedrock.',
    'A soil sample is shaken in a jar of water so every grain floats free, like shaking a snow globe. Watch the jar in slow motion.',
    'The biggest, heaviest grains, sand, settle in under a minute. Silt settles over a few hours. Clay is so fine it can cloud the water for a day or more, the way a creek stays brown after a storm.',
    'Measure each layer as a percentage of the total height. Then find the spot on the triangle where the clay, silt and sand lines meet. The colored region names your soil, like a square on a map grid.',
    'Pour 100 mL into sand, your sample and clay. Water races through the big gaps between sand grains but crawls through clay’s tiny ones, and clay holds on to more of it: about 43 mL, versus 10 mL in sand.'
  ]
},
seasons: {
  hook: 'Earth is about 5 million km closer to the Sun in late December than in late June, yet Denver is cold in December. How much sunlight energy does Denver get on the December solstice compared with June, and why?',
  answer: 'About a third as much: roughly 160 W/m² averaged over the day in December versus 480 in June. The tilt does it. In December Denver’s noon Sun is only 27° up instead of 74°, and the day lasts about 9 hours instead of almost 15. Being 3% closer to the Sun barely helps.',
  uses: [
    'Solar panels: in Denver, panels tilted toward the south at about the latitude angle, near 40°, catch the most sunlight over a whole year.',
    'Ski runs: north-facing slopes get even less of the low winter Sun, so they hold snow longer, which is why so many Colorado ski runs face north.',
    'Sydney, Australia (34° S): December is midsummer there, with about 14 hours of daylight and a noon Sun near 80°, because the Southern Hemisphere is leaning toward the Sun.'
  ],
  takeaway: 'Seasons come from Earth’s tilt, not its distance from the Sun. When your hemisphere leans toward the Sun, the Sun climbs higher and stays up longer, so each square meter of ground gets more energy.',
  lede: 'Follow Earth around the Sun and watch how high the noon Sun climbs over Denver and how long the day lasts. Find out why December is cold even though Earth is closer to the Sun then.',
  tour: [
    'Earth takes 365 days, one year, to go around the Sun. Watch Earth move. Its axis always points the same way in space, toward the North Star, no matter where Earth is in its orbit.',
    'Earth’s axis is tilted 23.5°. In June the North Pole leans toward the Sun; in December it leans away. That lean, not the distance to the Sun, sets the seasons.',
    'On the June solstice the Sun is straight overhead at noon at 23.5° N, the Tropic of Cancer, which runs through Mexico. Denver’s noon Sun is 74° up and the day lasts almost 15 hours. It is summer in the north and winter in the south.',
    'Shine a flashlight straight down and you get a small, bright spot. Tilt it and the same light spreads into a long, dim patch. Sunlight works the same way: a high Sun concentrates its energy, while a low Sun spreads it out, so each square meter gets less.',
    'Six months later the Sun is over 23.5° S. Denver’s noon Sun is only 27° up, days are about 9 hours long, and it’s winter, even though Earth is now about 5 million km closer to the Sun.'
  ]
},
enso: {
  hook: 'You run a fishing boat out of a port in Peru. Forecasters announce an El Niño: the trade winds are weakening. What happens to the water temperature off your coast and to your anchovy catch over the next year?',
  answer: 'The water warms from about 21 °C to over 27 °C within six months, because warm surface water sloshes back east and cold upwelling nearly stops, falling under 10% of normal. With no nutrients rising, plankton and anchovies crash: the catch falls to about 40% of normal by six months and about 13% after a year.',
  uses: [
    'Colorado ski season: El Niño winters tend to bring extra snow to the southern Colorado mountains, while La Niña winters tend to favor the northern mountains.',
    'Peru, 1972: an El Niño collapsed the anchovy fishery, then the largest in the world, cutting the supply of fishmeal used to feed farm animals worldwide.',
    'Australia and Indonesia: when the rain shifts east during El Niño, these countries often face drought and a higher risk of bushfires.'
  ],
  takeaway: 'Wind moves the ocean. Strong trade winds keep cold, food-rich water rising off Peru. When they weaken in an El Niño, warm water spreads east, fisheries crash, and rain shifts with the warm water, changing weather as far away as Colorado.',
  lede: 'Wind pushes the ocean. Watch steady winds pile warm water on one side of the Pacific, then weaken them and see what an El Niño does to Peru’s water, fish and rain.',
  tour: [
    'This is a slice of the Pacific along the equator, about 15,000 km wide. Indonesia and Australia are on the left, Peru on the right. Warm surface water floats on cold deep water. The boundary is the thermocline, where the temperature drops fast, like the chill you feel diving deep in a lake.',
    'Along the equator the trade winds blow from east to west, dragging sun-warmed surface water toward Indonesia, the way blowing across a cup of hot cocoa pushes the top layer to one side.',
    'Warm water piles up in the western Pacific, so the warm layer is thick there and thin near Peru. The thermocline tilts. The sea surface near Indonesia even sits about half a meter higher than near Peru.',
    'As the wind pushes surface water away from Peru, cold water from below rises to replace it. This is upwelling. It carries nitrate and phosphate, natural fertilizer, that feed plankton and huge schools of anchovies.',
    'Air rises over the warm pool, drops heavy rain, flows east high up, and sinks over the cool eastern Pacific, where it is dry. That loop, the Walker circulation, keeps the trade winds blowing.',
    'Every 2 to 7 years the trade winds weaken. This is El Niño. Warm water sloshes back east, the water off Peru warms by about 6 °C, upwelling nearly stops, the anchovy catch crashes, and the rain moves east with the warm water.'
  ]
},
climate: {
  hook: 'Burning fossil fuels puts about 10 billion tons of carbon into the air each year, and on business as usual that keeps climbing. How much warmer than 1850 is Earth by 2100, and how much does holding emissions flat with 8 wedges help?',
  answer: 'On business as usual the model reaches about 3.1 °C of warming by 2100, with CO₂ near 650 ppm. Eight wedges hold emissions flat and bring that down to about 2.4 °C, but CO₂ still climbs past 500 ppm. Paths that cut emissions toward zero do better: about 1.8 °C for halving by 2050 and 1.7 °C for net zero by 2070.',
  uses: [
    'Driving: every gallon of gasoline burned releases about 8.9 kg of CO₂, so doubling fuel economy from 30 to 60 mpg on 2 billion cars is one whole wedge.',
    'Colorado power plants: Xcel Energy plans to retire its Colorado coal units by about 2030 and replace them mostly with wind and solar, a state-sized slice of several wedges.',
    'Home upgrades: LED bulbs, insulation and better windows make up the efficient-buildings wedge, which needs energy use in homes and offices cut by a quarter.'
  ],
  takeaway: 'Warming follows the total CO₂ that has piled up, not just this year’s emissions. Holding emissions flat still adds more every year. To stop the climb, emissions have to fall toward zero, and no single fix gets there alone.',
  lede: 'Watch how the air traps heat, then pick real ways to cut carbon, like wind power or efficient cars, and see how warm 2100 gets.',
  tour: [
    'Sunlight is mostly visible light, the kind your eyes see. It passes straight through the air and warms the ground and oceans, the way a car parked in the sun heats up.',
    'The warm ground gives off energy as infrared radiation, invisible heat. It is what you feel coming off a sidewalk after sunset. Watch the red wavy arrows rise.',
    'Greenhouse gas molecules like CO₂ absorb some of that infrared heat and send it back out in every direction, including back down. Like a blanket, they slow how fast heat escapes, so Earth stays warmer.',
    'Burning gasoline, coal and natural gas adds CO₂ every year. More CO₂ molecules catch more heat, and the thermometer climbs. Watch the years tick by on business as usual: by 2100 Earth is about 3 °C warmer than in 1850.',
    'On business as usual, emissions climb from 10 to about 18 billion tons of carbon a year by 2075. Keeping them flat means filling the triangle between those lines. Pacala and Socolow split it into wedges, each a real strategy that cuts 1 billion tons a year by 2075.',
    'We just added wind power: 2 million large wind turbines in place of coal. One wedge alone barely bends the curve. It takes about 8 wedges to hold emissions flat. Check the graph below.'
  ]
},
commons: {
  hook: 'Your fleet shares a lake of 8,000 fish with three careful fleets. You could land 1,000 fish a season instead of 300. Over 40 seasons, which plan catches more fish in total, and what is the lake like at the end?',
  answer: 'The 300-fish plan wins: about 12,000 fish over 40 seasons, with the lake still holding about 5,800 fish and able to keep going. At 1,000 a season you catch about 11,400 in total, but the lake collapses within about 15 seasons and every fleet catches nothing after that.',
  uses: [
    'Grand Banks cod: heavy fishing off Newfoundland crashed the cod stock, and Canada closed the fishery in 1992. Tens of thousands of people lost work, and the cod are still recovering.',
    'Colorado River: seven states share its water, and their combined allocations add up to more than the river now carries, so cuts have to be negotiated.',
    'Bag limits: Colorado Parks and Wildlife sets daily limits on how many trout an angler can keep, so one person’s catch does not empty a lake for everyone.'
  ],
  takeaway: 'When everyone shares a resource and no one owns it, each person gains by taking more, but the losses are shared by all. Take less than the resource can replace each year, and agree on limits, or it runs out for everyone.',
  tour: [
    'Four fishing fleets share this lake. Nobody owns the fish, so anyone can take them. A shared resource like this is called a commons, like a public park, a river, or the air.',
    'The red boat is yours. Use the slider to set how many fish you try to catch each season. One season is one year.',
    'After fishing, the fish that are left reproduce. Green + marks are new fish. More fish make more young, up to the lake’s carrying capacity, the most it can support: 10,000 fish.',
    'The dock is your scoreboard: fish in the lake, last season’s catch, and each fleet’s catch. If the total catch is bigger than the number of new fish each season, the lake is shrinking.',
    'Now the other fleets turn greedy, and you raise your catch to 1,200. Everyone lands a big haul this season. Watch the lake: within a few seasons it is nearly empty, and every catch falls to almost zero.'
  ]
},
footprint: {
  hook: 'A typical student in this calculator rides 120 miles a week in a 25 mpg car, takes one round-trip flight a year and eats an average diet. Which single change cuts the most CO₂: a 50 mpg car, going vegetarian, or skipping the flight?',
  answer: 'The 50 mpg car saves about 1.1 tons a year, because it halves the 250 gallons of gas burned. Going vegetarian saves about 0.8 tons and skipping the 2,000-mile flight about 0.4 tons. The starting footprint is about 12.5 tons, so together these three cut about 2.3 tons.',
  uses: [
    'Buying a car: at 12,000 miles a year, a 25 mpg car burns 480 gallons and puts out about 4.3 tons of CO₂. A 50 mpg hybrid cuts that in half.',
    'Electric cars: an EV is only as clean as its grid. On Colorado’s grid it makes about 0.15 kg of CO₂ per mile; a 25 mpg gas car makes 0.36 kg.',
    'Beef versus beans: beef has a far bigger climate footprint per gram of protein than beans, chicken or eggs, which is why diet is the food slice you can change most.'
  ],
  takeaway: 'Find your biggest slice before you cut. Every gallon of gas makes about 9 kg (20 lb) of CO₂, so in a typical year how far you drive and your car’s mpg matter more than one flight or a few light bulbs.',
  tour: [
    'The bar on the right stacks up every ton of CO₂ from one year of your life, about 12.5 tons for this typical student. The lines mark the US average (15 tons), the world average (4.7) and the 2050 goal for limiting warming (2).',
    'Cars burn gasoline, and every gallon puts out about 8.9 kg of CO₂, roughly 20 pounds, more than the gallon of gas itself weighs. Flights add more. Watch the bubbles from the car and plane.',
    'Your lights make no smoke at home. The CO₂ comes from the power plant that makes the electricity. In Colorado, more than half of it still comes from burning coal and natural gas.',
    'A gas furnace burns natural gas right at your house; see the chimney. A heat pump runs on electricity and moves heat in from outside, like a refrigerator working in reverse, so how clean it is depends on the grid.',
    'Growing food, especially beef, and making the things you buy, from phones to clothes, also release greenhouse gases. Shared services like schools, roads and hospitals add a slice everyone carries, here 2.5 tons.'
  ]
},
energycalc: {
  hook: 'Your desk lamp is on about 5 hours a day. An incandescent bulb and an LED give the same 800 lumens of light. How much electricity does each use in a year, and where does the rest of the incandescent bulb’s energy go?',
  answer: 'The incandescent bulb uses 109.5 kWh a year and the LED 16.4 kWh, about one-seventh as much. At 14¢ per kWh that is about $15 versus $2.30. Only 5% of the incandescent bulb’s energy becomes light; the rest is heat, so the thermometer beside it climbs to about 48 °C while the LED stays near 25 °C.',
  uses: [
    'Buying bulbs: compare lumens, not watts. A box that says “60 W equivalent” means about 800 lumens, the light of an old 60 W bulb, from an LED drawing about 9 W.',
    'Reptile tanks: pet stores sell incandescent heat lamps for lizards and turtles, because for them the “wasted” heat is the whole point.',
    'Easy-Bake Oven: the toy oven originally baked with an ordinary incandescent bulb, because nearly all of a bulb’s energy comes out as heat.'
  ],
  takeaway: 'Watts measure how much electricity a device uses, not how bright it is. Compare bulbs by lumens. Any energy a bulb does not turn into light becomes heat, so a hot bulb is a wasteful bulb.',
  tour: [
    'The light meter reads about 800 lumens, the brightness of an old “60-watt” bulb, no matter which bulb is in the lamp. That makes this a fair test: the only difference is how much energy each bulb needs.',
    'The power meter between the wall and the lamp works like the plug-in meters sold at hardware stores. It shows how many watts the bulb pulls from the outlet. One watt is one joule of energy every second.',
    'Each dot is a packet of energy from the wall. Yellow packets leave as light; red packets leave as heat. With this incandescent bulb only about 1 packet in 20 comes out yellow.',
    'Wasted energy shows up as heat. The thermometer next to the incandescent bulb climbs from room temperature, 22 °C, to about 48 °C. The glass itself gets much hotter than that.',
    'Same light from an LED, about 9 W instead of 60 W. Far more of the packets come out yellow, about 1 in 3, and the thermometer cools back toward room temperature.'
  ]
},
gridmix: {
  hook: 'Your city’s utility plans to close its 700 MW of coal plants and keep its 900 MW of gas, 900 MW of wind and 600 MW of solar. Will the lights stay on through the evening peak, and what happens to the day’s CO₂?',
  hookSet: { coal: 0 },
  answer: 'Not quite. From late afternoon into the night the city comes up as much as about 400 MW short, because the sun is setting and the gas plants are already at full power. CO₂ for the day drops from about 15,000 to about 6,100 tons. Adding 700 MW more gas keeps the lights on at about 6,700 tons, still less than half.',
  uses: [
    'Time-of-use rates: utilities charge more in the late afternoon and evening, when demand peaks and solar is fading, so running a dishwasher late at night costs less.',
    'Big batteries: storing extra midday solar to use after sunset is exactly the gap a battery fills, which is why utilities are building battery sites next to solar farms.',
    'Texas, February 2021: a winter storm knocked out gas, coal, nuclear and wind plants at once while heating demand soared, and millions of people lost power for days.'
  ],
  takeaway: 'A grid has to match demand every second, not just on average. Wind and solar make cheap, clean power when they can, but something you can turn up on demand, like gas, hydro or batteries, has to cover the evening peak and calm nights.',
  tour: [
    'Demand changes through the day: low at night, rising in the morning, and highest in the late afternoon and evening, when air conditioners, ovens and TVs all run at once. Supply has to match demand every second, or the lights go out.',
    'Coal and nuclear plants run steadily because they take hours to start and stop, like a big pot of water that is slow to boil. They supply the base of the demand all day and night.',
    'At 12:30 pm the solar farms are near full output, over 500 MW from 600 MW of panels. Watch the gas plants sit idle and CO₂ fall.',
    'Around 7:30 pm the sun is setting, but demand is still near its peak as people get home and cook. Gas plants ramp up quickly to fill the gap solar leaves. This is the hardest hour for a clean grid.',
    'Wind is often stronger at night, but it can die down for hours with little warning. The turbines spin faster when the wind is strong.'
  ]
},
smog: {
  hook: 'You plan a long run on a sunny summer weekday in Denver. Rush-hour traffic peaks around 7:30 AM, so you might expect the air to be worst then. Is ground-level ozone higher at 7 AM or at 3 PM, and when does it peak?',
  answer: 'Higher at 3 PM. In the model, ozone is about 35 ppb at 7 AM, climbs to a peak of about 62 ppb around 1 PM, and is still about 60 ppb at 3 PM. Morning exhaust supplies the ingredients, but sunlight has to cook them into ozone, which takes hours. On summer days the morning air has less ozone.',
  uses: [
    'Ozone Action Days: on summer days when ozone is forecast to be high, Colorado asks Front Range drivers to refuel and mow with gas mowers after 5 PM, when ozone stops building.',
    'Denver’s brown cloud: on still winter mornings an inversion traps exhaust and wood smoke near the ground, and the haze over downtown can last until wind mixes it out.',
    'Emissions tests: cars in the Denver metro area must pass emissions checks because the region does not meet the federal ozone standard.'
  ],
  takeaway: 'Ozone smog is cooked by sunlight, so it peaks on sunny summer afternoons, hours after rush hour. Winter smog is different: an inversion acts like a lid and traps exhaust near the ground until wind clears it.',
  tour: [
    'Denver sits low in the South Platte valley with the Rocky Mountains to the west. On calm days air can get stuck here, like smoke in a closed room. We start at 7 AM on a summer weekday.',
    'Cars and the power plant release invisible gases: nitrogen oxides, made when fuel burns hot, and VOCs, unburned fuel vapor like the smell at a gas pump. These primary pollutants come straight from a source.',
    'When the Sun is high, its energy breaks apart some of these gases. The pieces join oxygen to make ozone (blue molecules). High in the sky, ozone blocks UV. Down here, it irritates your lungs.',
    'Watch the clock and the graph. Ozone keeps building through midday and peaks around 1 PM at about 60 ppb, hours after the morning traffic jam. At 7 AM there was only about half as much.',
    'Now a winter inversion: a warm layer of air sits on top of cold air near the ground, like a lid on a pot. The cold air can’t rise, so exhaust and smoke stay close to the ground. This is Denver’s “brown cloud.”',
    'A strong wind, 8 m/s (about 18 mph), arrives and sweeps the trapped air out of the valley. Watch the AQI badge, the same Air Quality Index a weather app shows, improve.'
  ]
},
acidrain: {
  hook: 'Two trout lakes sit 100 km downwind of a coal plant, one in granite and one in limestone. Both get the same acid rain, about pH 4.1. After 15 years, which lake still has trout, and what would scrubbers on the smokestack do?',
  answer: 'Limestone Lake stays near pH 8.4 with healthy trout, because limestone neutralizes the acid. Granite Lake falls from about pH 6.9 to 4.4 and loses almost all its trout by year 15. If scrubbers go on then, the rain rises to about pH 4.8, the lake climbs back above 6 within 5 years, and the trout are mostly back after about 10.',
  uses: [
    'Rocky Mountain National Park: nitrogen from Front Range traffic, farms and power plants drifts into high lakes on granite with little buffering, so the park tracks their chemistry.',
    'Adirondack lakes, New York: acid rain left hundreds too acidic for fish by the 1980s. After the 1990 Clean Air Act cut SO₂, many are slowly recovering.',
    'Antacid tablets: calcium carbonate, the main ingredient in many antacids, is the same compound as limestone, and it neutralizes stomach acid the same way.'
  ],
  takeaway: 'Whether acid rain hurts a lake depends as much on the rock under it as on the rain. Limestone neutralizes acid; granite cannot. Cutting sulfur at the smokestack lets damaged lakes recover, and fish return years after the water does.',
  tour: [
    'Coal contains a little sulfur. When it burns, the sulfur becomes sulfur dioxide (SO₂, yellow dots), the sharp-smelling gas from a struck match. The hot fire also makes nitrogen oxides (NOx, brown dots), the same gases car engines make.',
    'Wind carries the gases hundreds of kilometers, so a power plant can harm lakes in another state. In clouds the gases react with water to form sulfuric and nitric acid.',
    'Normal rain is slightly acidic (pH about 5.6) because of carbon dioxide, like a very weak soda. Rain below 5.6 is acid rain. This rain is about pH 4.1, roughly 30 times more acidic. The raindrop colors show their pH.',
    'Granite has almost nothing to neutralize acid. Over the years the soils around Granite Lake run out of buffering, the lake’s pH falls from about 7 to below 4.5, and the trout disappear.',
    'Limestone is calcium carbonate, the same compound in many antacid tablets. It neutralizes acid the same way, so this lake stays near pH 8.4 even in the same rain.',
    'Scrubbers spray a wet limestone mix through the smoke and capture about 95% of the SO₂ before it escapes. Watch the rain and Granite Lake recover. The water recovers first; the trout take several more years.'
  ]
},
eutrophication: {
  hook: 'A wet spring washes ten times the usual fertilizer off the farm fields around a 10 m deep lake. The surface water still looks fine and has plenty of oxygen. What happens to the fish over the next month, and how fast?',
  answer: 'The algae bloom first: chlorophyll jumps from about 9 to over 40 µg/L in 10 days. Then dead algae rot on the bottom, and the bottom oxygen falls from about 7 mg/L to under 2 mg/L by about day 16 and nearly zero by day 20. Most fish are dead by day 25, even though the surface still has about 8 mg/L.',
  uses: [
    'Gulf of Mexico: fertilizer from Midwest farms flows down the Mississippi and creates a low-oxygen dead zone off Louisiana every summer, often over 10,000 km².',
    'Dishwasher detergent: US makers took most of the phosphate out of dishwasher detergent around 2010, because that phosphorus was feeding algae in lakes and rivers.',
    'Summer fish kills: warm water holds less oxygen. In this model a fertilized lake at 28 °C becomes a dead zone in about 10 days, twice as fast as at 20 °C.'
  ],
  takeaway: 'Too much fertilizer does not poison fish directly. It feeds algae, and when the algae die, the bacteria that rot them use up the oxygen. The crash comes weeks after the bloom, and warm water makes it come sooner.',
  tour: [
    'A healthy lake: clear water, a few algae, and oxygen from top to bottom (the white dots), about 7 to 9 mg in every liter. Fish live throughout the lake.',
    'After rain, nitrogen and phosphorus, the main ingredients in farm and lawn fertilizer, run off the field and into the lake. Here the runoff is turned up to 100%, ten times the normal amount.',
    'Algae use the nutrients the way garden plants use fertilizer. They grow and multiply, the surface turns green, and sunlight can no longer reach deep water.',
    'Algae live only days to weeks. Dead cells (brown flakes) sink to the bottom and pile up as muck, like fallen leaves on the bottom of a pond.',
    'Bacteria on the bottom break down the dead algae, and like you, they use oxygen to do it. Watch the bottom-oxygen gauge fall while the surface still has plenty.',
    'Below about 2 mg/L, most fish suffocate. The crash comes weeks after the bloom starts, because rotting takes time. Dead fish add even more to rot.'
  ]
},
ld50: {
  hook: 'Seawater is about 3.5% salt. Radish seeds sit on filter paper wetted with salt water from 0% to 4%. How salty does the water have to be before only half as many seeds sprout as in plain water?',
  answer: 'About 1.2% salt, roughly a third as salty as seawater. In plain water about 95% of radish seeds sprout. At 1% about 60% sprout, at 2% about 17%, and at 4% almost none. With 25 seeds per dish each run varies a little, so your estimate may land anywhere from about 1.0% to 1.4%.',
  uses: [
    'Road salt: grass and shrubs along Colorado streets often brown in spring because deicing salt splashed onto the soil pulls water out of their roots, the same osmosis that stops seeds.',
    'Arkansas River valley: decades of irrigation have left salt building up in some Colorado farm soils, cutting crop yields, so researchers and farmers there track soil salinity.',
    'Comparing toxins: LD50 is the standard way to compare how toxic substances are. A lower LD50 means a smaller dose does the same harm.'
  ],
  takeaway: 'The dose makes the poison. Even something as ordinary as table salt stops seeds once there is enough of it. To compare harmful things, find the dose that affects half the test group: the lower that dose, the more toxic the substance.',
  tour: [
    'Six petri dishes, each lined with filter paper and wetted with a different salt solution: 0% (the control) up to 4%, a bit saltier than seawater. Every dish gets the same number of seeds.',
    'The 0% dish gets plain water. It shows what normal sprouting looks like, so every other dish has a fair comparison. Without a control you could not tell what the salt did.',
    'A seed has to soak up water before it can sprout. Salt outside the seed makes the water potential more negative, so water moves out of the seed by osmosis instead of in. It is the same reason salted cucumber slices go limp.',
    'Watch the roots appear over 72 hours, three days. Count the sprouted seeds under each dish. In plain water nearly all of them sprout; in the 4% dish almost none do.',
    'The graph on the right plots % sprouted against salt concentration. The LD50 is where the curve crosses half of the control value. For radish it lands near 1.2% salt, about a third as salty as seawater.'
  ]
}
});
