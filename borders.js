/* Where science meets philosophy + How exact does it need to be? (pilot, Nov 17, 2026)
   One entry per tool. Rendered by the engine below the stage in Full lab and at the end of Learn it.
   Standard: teach, don't preach. Name each thinker's view fairly, state definitive Church teaching as the Church's teaching,
   and leave open questions open (no answer key). Every number has a source and a year. */
BioLab.addBorder({
evolution: {
  q: 'If mutations happen by chance, does that mean life has no purpose?',
  saw: 'New dark mutations appeared at the same rate on sand and on lava. The ground decided which ones lasted: the same dark fur lost on sand and won on lava.',
  assumes: [
    'Nature follows the same rules from one generation to the next, so what we see now tells us about the past.',
    'The past can be read from the present: fossils, DNA and today’s mice are real evidence of what happened before anyone watched.',
    '“Random” means random with respect to need: a mutation does not appear because it would help. It does not, by itself, mean “uncaused” or “without meaning.”'
  ],
  stops: 'Science can show how chance variation and the environment shape a population, and it can measure the odds. Whether chance rules out purpose is not something a count of mice can settle. It is a question about what chance means, which is philosophy.',
  church: 'The Church teaches that God works in and through real natural causes, giving creatures “the dignity of acting on their own” (Catechism nos. 306–308), and that evolution and faith need not conflict (Pius XII, <i>Humani Generis</i>, 1950; John Paul II, 1996). Each human soul is created directly by God (<i>Humani Generis</i> 36). Benedict XVI, 2005: “We are not some casual and meaningless product of evolution.”',
  views: [
    { who: 'Charles Darwin', when: 'late in life', says: 'He moved from faith toward doubt, wrote that he had never been an atheist, and said “agnostic” described him best. He did not think his science settled the question.' },
    { who: 'Asa Gray', when: 'botanist, 1860', says: 'Darwin’s friend and a devout Christian. He argued that natural selection fits with design: God could work through variation and selection as through any natural law.' },
    { who: 'Thomas Aquinas', when: '13th century', says: 'Chance is real: some events happen “by accident” when two causes meet. But chance only exists inside an ordered world, so it does not compete with God, who gives every cause its being.' },
    { who: 'Richard Dawkins', when: '<i>The Blind Watchmaker</i>, 1986', says: 'Natural selection explains the look of design with no designer. It is a “blind watchmaker,” and no purpose is needed to explain life.' },
    { who: 'Alfred North Whitehead', when: '1920s', says: 'Nature is a process of becoming, always producing something new. God offers each moment its best possibility and lures the world toward richness, without forcing it.' }
  ],
  margin: {
    lead: 'Biology rarely gives one exact number. It gives a range, and the range is often the lesson.',
    rows: [
      { what: 'Where population 1 ends up', value: 'Run the sim twice with the same settings', range: 'The five populations end at different values every run', how: 'Drift: which mice happen to breed is partly luck', enough: 'Telling which way selection pushes. Not for naming the exact generation it reaches 50%.' },
      { what: 'Mutation rate in this model', value: '1 in 100 gene copies per generation (Learn it steps)', range: 'Real rates are far lower, roughly 1 in 100,000 to 1 in 1,000,000 per gene per generation in animals', how: 'Counting new mutations in families and lab populations', enough: 'Seeing chance at work on screen. The model speeds it up so you can watch.' }
    ],
    note: 'A range is not a failure of science. Two people running the same experiment should land inside the same range. That agreement, not perfect precision, is what makes a result objective.'
  }
},
cladogram: {
  q: 'Are “species” and the branches of the tree real, or lines we draw?',
  saw: 'You built a tree from shared traits. Each branch point is a group that shares an ancestor, and you chose where to put each trait.',
  assumes: [
    'The simplest tree, with the fewest changes, is the most likely one (parsimony). That is a philosophical rule of thumb, Ockham’s razor, not something an experiment proves.',
    'Shared traits mean shared ancestry, not coincidence.',
    'What happened millions of years ago left traces we can read today.'
  ],
  stops: 'Science finds the branching: who shares an ancestor with whom. But the ranks (species, genus, phylum) and where one species ends and the next begins are partly human choices. Biologists still use several different definitions of “species.”',
  views: [
    { who: 'Aristotle', when: '4th century BC', says: 'Living things have natures, or essences, that make them the kind of thing they are. Kinds are real, and we discover them rather than invent them.' },
    { who: 'Carl Linnaeus', when: '1735', says: 'He grouped living things into nested ranks to show an order he believed God built into creation. Species, for him, were fixed and real.' },
    { who: 'Charles Darwin', when: '<i>On the Origin of Species</i>, 1859', says: 'He called the term species “one arbitrarily given for the sake of convenience” to groups that closely resemble each other. The branching is real; the lines between groups blur.' },
    { who: 'Ernst Mayr', when: '1942', says: 'A species is a group that can interbreed in nature and is cut off from other groups. That makes species real in animals, though it fits plants and bacteria poorly.' }
  ],
  margin: {
    rows: [
      { what: 'When four-limbed animals branched off', value: 'About 350 million years ago (in this tool)', range: 'Published estimates often differ by tens of millions of years', how: 'Dated fossils and molecular clocks, which estimate time from DNA differences', enough: 'Putting groups in the right order on a timeline. Not for naming the century.' },
      { what: 'Which tree is right', value: 'The tree with the fewest trait changes', range: 'Two trees can tie; new traits or DNA can flip a branch', how: 'Comparing how many changes each tree needs', enough: 'A best current answer that new evidence can revise.' }
    ]
  }
},
division: {
  q: 'When one cell becomes two, which one is the original?',
  saw: 'One cell copied its DNA and split into two identical cells. Neither cell is older, and neither is a copy of the other.',
  assumes: [
    'A cell is a real unit, a single living thing with a boundary (cell theory).',
    'Copying DNA exactly is what makes the two cells “the same” kind of cell.',
    'The same chemistry works the same way in every cell, so what we see under the microscope holds for cells we never look at.'
  ],
  stops: 'Biology can track every chromosome into the two new cells. Whether either new cell is the same individual as the first is not a question a microscope can answer. It is a question about what makes something the same thing over time.',
  views: [
    { who: 'Plutarch’s Ship of Theseus', when: '1st century', says: 'If every plank of a ship is replaced, is it the same ship? A cell that splits is the puzzle in living form: two ships from one.' },
    { who: 'Aristotle and Aquinas', says: 'What makes a living thing itself is its form, its organizing life, not its particular matter. When a single cell divides, one life becomes two new ones.' },
    { who: 'John Locke', when: '1694', says: 'A living thing stays the same as long as its matter takes part in one continuing life, even as the matter changes. Identity follows the life, not the stuff.' },
    { who: 'Derek Parfit', when: '1984', says: 'Asking which one is “really” the original may have no deep answer. What matters is the continuity between them, not a fact about identity.' }
  ],
  margin: {
    rows: [
      { what: 'Cells in an adult human body', value: 'About 37 trillion (3.72 × 10¹³)', range: '± about 0.8 trillion; older guesses ranged from a trillion to 10,000 trillion', how: 'Adding up estimates organ by organ (Bianconi and colleagues, 2013)', enough: 'Knowing the body is tens of trillions of cells. Not for an exact count; cells die and divide every second.' },
      { what: 'How long one cell cycle takes', value: 'About a day for many human cells grown in a lab', range: 'Hours to weeks, depending on the cell type', how: 'Timing cells under a microscope from one division to the next', enough: 'Comparing fast and slow cells. Not one number for every cell.' }
    ]
  }
}
});
