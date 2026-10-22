# Raider BioLab

Interactive biology simulations and learning tools for Regis Jesuit Bio, Honors Biology and AP Biology, in the style of PhET.

**Live site:** https://rjedtech.github.io/Raider-BioLab/

## What's inside
Simulations are grouped by the eight AP Biology units. Every one has a **Bio / Honors / AP** level switch.

| Unit | Simulations and tools |
|---|---|
| 1 · Chemistry of life | Properties of water · Build a macromolecule |
| 2 · Cell structure and function | Cell explorer · Virtual microscope · Cell size and diffusion · Membrane transport and osmosis |
| 3 · Cellular energetics | Cellular respiration · Photosynthesis · Enzyme activity |
| 4 · Cell communication and cell cycle | Cell signaling · Cell cycle and cancer · Mitosis and meiosis |
| 5 · Heredity | Genetic crosses · Pedigree detective |
| 6 · Gene expression and regulation | DNA to protein · Lac operon |
| 7 · Natural selection | Natural selection and drift |
| 8 · Ecology | Population growth · Predators and prey · Energy flow and food webs |

Link straight to any simulation with `#<name>`, e.g. `#respiration`, `#transport` or `#crosses`.

## Built to make processes concrete
- **Walk me through it:** a guided, slowed-down tour that dims everything except the step being explained.
- **Slow motion (down to 0.1×) and Step:** advance a moment at a time while paused.
- **Live caption:** says what is happening right now, and why.
- **Scale line:** where in the body (or the world) the view is, and how big it is.
- **Predict, then test:** challenges where students commit to a prediction before they see the result.
- **Investigation prompt + data table:** record trials, plot them, and copy as CSV for a lab write-up.

## Files
- `index.html`: page shell
- `biolab.css`: styles (RJ masthead standard)
- `engine.js`: the shared lab bench
- `sims/*.js`: one file per simulation

See `ENGINE.md` for how to add a simulation.

## Privacy
Static files only. Everything runs in the browser, with no logins and no data collection. Trial data is kept in the student's own browser.

The models are simplified for instruction. Each simulation's "About this model" section lists its assumptions.
