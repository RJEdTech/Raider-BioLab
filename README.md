# Raider BioLab

Interactive biology and environmental science simulations, virtual labs and learning tools for Regis Jesuit Biology, Honors Biology, AP Biology, AP Environmental Science and Molecular Biology & Genetic Engineering Techniques Lab, in the style of PhET.

**Live site:** https://rjedtech.github.io/Raider-BioLab/

## Browse by course
The home page has a **Browse** switch. **By topic** groups tools by AP unit and theme. Each course option lists tools in the order that course teaches them, unit by unit; the order comes from the courses' Canvas modules:

- **Biology:** Nature of science → Ecology (new) → Chemistry of life → Cells and microscopes → Cell energy → Cell cycle and cancer → Meiosis → Genetics → DNA and protein synthesis → Evolution
- **Honors Biology:**
  - Fall: Science skills → Ecology → Biochemistry → Cells → Membranes → Enzymes → Respiration
  - Spring: Photosynthesis → Cell division → Mendel → DNA → Evolution → Anatomy and homeostasis
- **AP Biology:** Summer ecology and science practices → Unit 1 → Unit 2 → Unit 4 signaling and neurons → Unit 3 → Cell cycle → Unit 5 → Unit 6 (with viruses and biotech) → Unit 7
- **AP Environmental Science:**
  - Fall: Units 1–5
  - Spring: Unit 9 → Units 6–8
- **Genetic Engineering:** Lab techniques → Genetic engineering 101 → Genetic engineering 102

Each course list ends with **Go further** tools: optional, advanced tools for students who want more than class time allows.

## What every tool has
- **Detail switch (Big picture / Closer look / Deep dive):** the same model underneath, with more parts named and more math as you go deeper. Any student can choose any view; Big picture fits Biology, Closer look fits Honors, Deep dive fits AP.
- **Walk me through it:** a guided, slowed-down tour that spotlights one step at a time.
- **Slow motion (down to 0.1×) and Step:** step through a process frame by frame.
- **Live caption:** says what is happening and why.
- **Scale line:** real sizes and units.
- **Predict, then test:** challenges where students commit to a prediction before they see the result.
- **Investigation prompt and data table:** a data table with CSV export for lab write-ups.

Link straight to any tool with `#<name>`, e.g. `#transport`, `#pcr` or `#smog`.

## Files
- `index.html`: page shell
- `biolab.css`: styles (RJ masthead standard)
- `engine.js`: the shared lab bench
- `courses.js`: course pathways and teaching order
- `sims/*.js`: one file per tool

See `ENGINE.md` to add a tool.

## Privacy
Static files only. Everything runs in the browser, with no logins and no data collection. Trial data stays in the student's own browser.

The models are simplified for instruction; each tool's "About this model" section lists its assumptions.
