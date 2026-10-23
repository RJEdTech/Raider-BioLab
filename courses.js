/* Course pathways: Regis Jesuit biology courses in the order they are taught
   (taken from the courses' Canvas modules, Fall 2026 and Spring 2026).
   Within each unit, tools are listed in the order the topics come up in class.
   Tool ids that are not built yet are skipped automatically. */
BioLab.COURSES = [
  { id: 'bio', name: 'Biology',
    blurb: 'Tools in the order the Biology course covers them, unit by unit.',
    units: [
      { n: 'Unit 1', t: 'Nature of science', ids: ['expdesign', 'pillbug'] },
      { n: 'New', t: 'Ecology', ids: ['energy', 'carboncycle', 'popgrowth', 'predprey', 'biodiversity'], note: 'Ecology is being added to Biology. These are the tools Honors Biology uses for it.' },
      { n: 'Unit 2', t: 'Chemistry of life', ids: ['water', 'macromolecules', 'foodtests'] },
      { n: 'Unit 3', t: 'Cells and microscopes', ids: ['cellexplorer', 'microscope', 'transport', 'potato'] },
      { n: 'Unit 4', t: 'Cell energy', ids: ['enzymes', 'photosynthesis', 'chloroplast', 'glycolysis', 'respiration'] },
      { n: 'Unit 5', t: 'Cell cycle and cancer', ids: ['cellcycle', 'division', 'roottip'] },
      { n: 'Unit 6', t: 'Meiosis', ids: ['division', 'karyotype'] },
      { n: 'Unit 7', t: 'Genetics', ids: ['crosses', 'bloodtype', 'pedigree'] },
      { n: 'Unit 8', t: 'DNA, protein synthesis and mutations', ids: ['replication', 'expression'] },
      { n: 'Unit 9', t: 'Evolution', ids: ['beaks', 'evolution', 'cladogram'] }
    ],
    further: ['crispr', 'epidemic', 'antibiotic'] },
  { id: 'honors', name: 'Honors Biology',
    blurb: 'Tools in the order Honors Biology covers them: first semester, then second.',
    units: [
      { n: 'Fall 1', t: 'Science skills: experimental design and data', ids: ['expdesign', 'pillbug'] },
      { n: 'Fall 2', t: 'Ecology', ids: ['energy', 'carboncycle', 'popgrowth', 'predprey', 'biodiversity'] },
      { n: 'Fall 3', t: 'Biochemistry and water', ids: ['water', 'macromolecules', 'protein', 'foodtests'] },
      { n: 'Fall 4', t: 'Cells', ids: ['cellexplorer', 'microscope', 'sav'] },
      { n: 'Fall 5', t: 'Membranes and transport', ids: ['transport', 'potato'] },
      { n: 'Fall 6', t: 'Enzymes', ids: ['enzymes'] },
      { n: 'Fall 7', t: 'Cellular respiration', ids: ['glycolysis', 'respiration'] },
      { n: 'Spring 1', t: 'Photosynthesis', ids: ['photosynthesis', 'chloroplast'] },
      { n: 'Spring 2', t: 'Cell division', ids: ['cellcycle', 'division', 'roottip', 'karyotype'] },
      { n: 'Spring 3', t: 'Mendel and inheritance', ids: ['crosses', 'bloodtype', 'pedigree'] },
      { n: 'Spring 4', t: 'DNA and protein synthesis', ids: ['replication', 'expression'] },
      { n: 'Spring 5', t: 'Evolution', ids: ['evolution', 'beaks', 'hardyweinberg', 'cladogram'] },
      { n: 'Spring 6', t: 'Anatomy and homeostasis', ids: ['homeostasis'] }
    ],
    further: ['sanger', 'crispr', 'synthbio', 'epidemic', 'antibiotic', 'molclock'] },
  { id: 'ap', name: 'AP Biology',
    blurb: 'Tools in the order AP Biology covers them, starting with the summer ecology unit.',
    units: [
      { n: 'Summer', t: 'Ecology (AP Unit 8) and science practices', ids: ['pillbug', 'popgrowth', 'predprey', 'biodiversity', 'energy', 'carboncycle'], note: 'Chi-square, population growth, communities and ecosystems.' },
      { n: 'Unit 1', t: 'Chemistry of life', ids: ['water', 'macromolecules', 'protein', 'foodtests'] },
      { n: 'Unit 2', t: 'Cells, membranes and water potential', ids: ['cellexplorer', 'sav', 'transport', 'potato'] },
      { n: 'Unit 4', t: 'Cell communication and neurons', ids: ['signaling', 'neuron'] },
      { n: 'Unit 3', t: 'Enzymes, respiration and photosynthesis', ids: ['enzymes', 'glycolysis', 'respiration', 'chloroplast', 'photosynthesis'] },
      { n: 'Unit 4', t: 'Cell cycle', ids: ['cellcycle', 'division', 'roottip'] },
      { n: 'Unit 5', t: 'Meiosis and heredity', ids: ['division', 'karyotype', 'crosses', 'bloodtype', 'pedigree'] },
      { n: 'Unit 6', t: 'DNA, gene expression and regulation', ids: ['replication', 'expression', 'lacoperon'] },
      { n: 'Unit 6', t: 'Viruses and biotechnology', ids: ['virus', 'gel', 'transformation', 'pcr'] },
      { n: 'Unit 7', t: 'Evolution', ids: ['evolution', 'hardyweinberg', 'beaks', 'cladogram'] },
      { n: 'Review', t: 'Body systems and ecosystems review', ids: ['homeostasis'] }
    ],
    further: ['sanger', 'crispr', 'synthbio', 'qpcr', 'epidemic', 'antibiotic', 'molclock'] },
  { id: 'apes', name: 'AP Environmental Science',
    blurb: 'Tools in the order AP Environmental Science covers them: Units 1–5 in the fall, then Unit 9 and Units 6–8 in the spring.',
    units: [
      { n: 'Unit 1', t: 'Ecosystems', ids: ['commons', 'carboncycle', 'productivity', 'energy', 'biomes'], note: 'Biogeochemical cycles, primary productivity, trophic levels and biomes.' },
      { n: 'Unit 2', t: 'Biodiversity', ids: ['biodiversity', 'islandbio', 'succession', 'evolution'], note: 'Ecosystem services, island biogeography, tolerance, succession and bottlenecks.' },
      { n: 'Unit 3', t: 'Populations', ids: ['popgrowth', 'predprey', 'humanpop'], note: 'r- and K-selection, survivorship, carrying capacity and human populations.' },
      { n: 'Unit 4', t: 'Earth systems and resources', ids: ['soil', 'seasons', 'enso'], note: 'Soil, solar radiation and seasons, atmospheric circulation, ocean currents and ENSO.' },
      { n: 'Unit 5', t: 'Land and water use', ids: ['commons', 'footprint'], note: 'Tragedy of the commons, agriculture, forestry and carbon footprints.' },
      { n: 'Unit 9', t: 'Global change', ids: ['climate', 'carboncycle'], note: 'Greenhouse effect, climate impacts, stabilization wedges and ocean acidification.' },
      { n: 'Unit 6', t: 'Energy resources and consumption', ids: ['energycalc', 'gridmix'], note: 'Energy sources, efficiency calculations and the lightbulb lab.' },
      { n: 'Unit 7', t: 'Atmospheric pollution', ids: ['smog', 'acidrain'], note: 'Denver air quality, smog, thermal inversions and acid rain.' },
      { n: 'Unit 8', t: 'Aquatic and terrestrial pollution', ids: ['eutrophication', 'ld50', 'energy'], note: 'Eutrophication, dose–response and LD50, biomagnification.' }
    ],
    further: ['epidemic', 'antibiotic'] },
  { id: 'ge', name: 'Genetic Engineering',
    blurb: 'Tools for Molecular Biology & Genetic Engineering Techniques Lab, in the order the techniques are taught.',
    units: [
      { n: 'Module 1', t: 'Introduction to lab techniques', ids: ['pipette', 'gel', 'plasmid'], note: 'Micropipetting, conversions, gel loading, plasmid mapping, DNA extraction and electrophoresis.' },
      { n: 'Module 2', t: 'Genetic engineering 101', ids: ['pcr', 'blast', 'transformation'], note: 'PCR and primer design, BLAST, and CaCl₂ transformation.' },
      { n: 'Module 3', t: 'Genetic engineering 102', ids: ['plasmid', 'sanger'], note: 'Plasmid miniprep and reading DNA sequences.' },
      { n: 'Review', t: 'Molecular biology foundations', ids: ['replication', 'expression', 'lacoperon'] }
    ],
    further: ['sanger', 'qpcr', 'crispr', 'synthbio', 'molclock'] }
];

/* "By topic" view: tools inside each section, in the order the topics are taught. */
BioLab.TOPIC_ORDER = {
  0: ['expdesign', 'pillbug'],
  1: ['water', 'macromolecules', 'protein', 'foodtests'],
  2: ['cellexplorer', 'microscope', 'sav', 'transport', 'potato'],
  3: ['enzymes', 'glycolysis', 'respiration', 'chloroplast', 'photosynthesis'],
  4: ['signaling', 'neuron', 'cellcycle', 'division', 'roottip'],
  5: ['karyotype', 'crosses', 'bloodtype', 'pedigree'],
  6: ['replication', 'expression', 'lacoperon', 'virus'],
  7: ['evolution', 'beaks', 'hardyweinberg', 'cladogram'],
  8: ['productivity', 'energy', 'carboncycle', 'biomes', 'biodiversity', 'islandbio', 'succession', 'popgrowth', 'predprey', 'humanpop'],
  9: ['homeostasis'],
  10: ['pipette', 'gel', 'plasmid', 'pcr', 'blast', 'transformation'],
  12: ['soil', 'seasons', 'enso', 'climate'],
  13: ['commons', 'footprint', 'energycalc', 'gridmix'],
  14: ['smog', 'acidrain', 'eutrophication', 'ld50'],
  11: ['sanger', 'crispr', 'synthbio', 'qpcr', 'epidemic', 'antibiotic', 'molclock']
};
