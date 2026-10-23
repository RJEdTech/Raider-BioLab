# Raider BioLab: simulation authoring guide

Each simulation is one file, `sims/<hash>.js`, that registers a definition object:

```js
(function(){
'use strict';
const {clamp,lerp,rng,randn,binom,rr,txt,pill,polyline,atLeast,PAL,FONT,RM,axes,bars,legend,serColor,lvText,fmtNum}=BioLab.h;
const SIM={ /* definition */ };
BioLab.register(SIM);
})();
```

`index.html` already loads every file in `sims/`. Do not edit `engine.js`, `biolab.css` or `index.html`. If something is missing from the engine, build it inside your sim, or report it.

## Definition fields

| Field | Meaning |
|---|---|
| `id`, `hash` | Same short lowercase token (e.g. `'transport'`). The page lives at `index.html#<hash>`. |
| `apUnit`, `order` | Home-page section and order within it. 1–8 = AP units; 0 = Science skills and data; 9 = Human body systems; 10 = Biotechnology lab; 12 = Earth systems and climate; 13 = Energy, land and resources; 14 = Pollution and human health; 11 = Go further (advanced, optional). APES ecology tools go in 8. |
| `prereq`, `next` | Arrays of sim ids. `prereq` shows "Start with" links on this page; every sim listed in another sim's `prereq` automatically shows a "Go further" link back to it. `next` adds extra "Go further" links. Advanced (apUnit 11) tools should set `prereq` to the core sims they build on. |
| `tab` | Short name used on the home card and in the menu ("Membrane transport"). |
| `card` | One sentence for the home card. Say what students do, not what the page is. |
| `kind` | Card badge: `'Simulation'`, `'Virtual lab'`, `'Learning tool'`, `'Lab skills'`, `'Process walkthrough'` or `'Go further'`. |
| `title` | Page heading. |
| `lede` | `{bio,honors,ap}` sentence under the title. Every level-aware text field accepts either a string or `{bio,honors,ap}`; the highest level ≤ the current one wins. |
| `scale` | One line answering "where am I and how big is this?" Give real units ("one red blood cell, about 8 µm across"). |
| `aspect` | Stage aspect ratio (default 16/9). The stage is always 800 logical px wide, so its height is 800/aspect. |
| `timeScale`, `dtMax`, `prewarm`, `sampleDt`, `window`, `unit`, `timeLabel`, `unitD` | Time model. Simulated time advances `timeScale` units per real second, integrated in steps ≤ `dtMax`. `prewarm` runs before t=0 so the sim opens at steady state. `unit` is the time unit for the clock and graph axis, e.g. `'s'`, `'min'`, `'h'` or `'generations'`. |
| `timeless`, `animated` | `timeless:true` hides the clock and live graph (use it for tools and quizzes). With `animated:true` too, `step(sim, realDt)` still runs every frame (use for step-through animations). |
| `controls` | `[{id,label,type:'range'|'toggle'|'seg'|'select',min,max,step,def,unit,d,lvl,help,options:[{v,l,lvl}],onChange(sim),noTrial}]` |
| `actions` | `[{id,label,lvl,primary,run(sim)}]`: buttons under the controls (Breed, Next phase, New family…). |
| `init(sim)` | Returns the fresh state object, stored as `sim.st`. |
| `step(sim,dt)` | Advances the model. Use `sim.p` for control values and `sim.st` for state. |
| `afterPrewarm(sim)` | Zero any totals after the prewarm. |
| `metrics` | `[{id,label,unit,lvl,min,max,d,fixed,text,get(sim),noTrial}]`: the readout tiles. `max:null` means auto-scale. `text:true` means `get` returns a string (shown in a wide tile, never plotted). |
| `graphs` | Optional `[{id,label,lvl,lines:[metricIds]}]` for multi-line live graphs, or `{id,label,lvl,custom:true}` handled by `plot(sim,ctx,box,id)`. `box={L,T,W,H,cw,ch}`; call `axes(ctx,box,{xmin,xmax,ymin,ymax,xl,yl,xcats})` to get `{X,Y}`. Use `bars()` and `legend()` as needed. |
| `defaultGraph` | The graph id selected by default. |
| `graph:false`, `trials:false` | Hide the graph panel or the data table, for tools where they make no sense. |
| `infoPanel(sim)` | Returns HTML for an info panel (e.g. "the organelle you clicked"). It re-renders when `sim.infoDirty=true`. `bindInfo(sim,el)` can attach listeners. |
| `challenges` | An array, or a function `(sim)=>array`, of `{lvl,q,choices,correct,baseline,baselineAction,change,changeAction,changeText,watch,at,reveal,explain,instant}`. Timed challenges reset to defaults+`baseline`, apply `change` at `at` (default `chChange`), and reveal at `reveal` (default `chReveal`), in sim time. `instant:true` grades immediately, for quizzes. `onChallenge(sim,ch,phase)` lets a quiz set up its prompt (e.g. highlight a structure). |
| `chChange`, `chReveal` | Default timing for timed challenges. |
| `narrate(sim)` | **Required.** Returns one or two plain sentences (HTML allowed, `<b>` for the key idea) on what is happening right now and **why**. Make it state-specific, so it changes as the variables change. It is the main tool against abstraction. |
| `tour` | **Required for process sims.** A guided walkthrough: `[{lvl,title,text,focus:[x,y,w,h] or [[...],[...]] or (sim)=>rect,speed,pause,setup(sim)}]`. Everything outside `focus` is dimmed. Run the step slowly (`speed` 0.1–0.5) so students see each event. `setup` can change values with `BioLab.setValues(sim,{...})` or call `BioLab.reset(sim)`. `onTourExit(sim)` restores state. Aim for 5–8 steps that tell the process in order. |
| `lab` | `{bio,honors,ap}` HTML investigation shown above the data table: a question, numbered steps saying which variable to change and what to record, and a writing prompt (CER at AP). |
| `terms` | `[{t,d,lvl}]`: key terms, gated by level. |
| `about` | HTML for "About this model": the equations or rules, and what is simplified. Be honest about simplifications. |
| `initVis(sim)`, `draw(sim,ctx,vdt,k,t)` | Drawing. `vdt` is the visual dt (0 when paused). `k` is a label-scale factor (1–1.8, larger on small screens): multiply font sizes by `k`. `t` is visual time. |
| `onClick(sim,x,y)` | Stage click, in logical coordinates. Every click interaction also needs a control or action equivalent, for keyboard users. |
| `thumbSetup(sim)`, `thumbFrames` | Optional, to make the home-page thumbnail look good. |

## Helpers (`BioLab.h`)
- **Drawing:** `rr` (rounded-rect path), `txt(ctx,s,x,y,{s,w,c,a,b})`, `pill(ctx,label,x,y,bg,fg,size)`, `polyline(points).at(distance)`.
- **Math and formatting:** `clamp`, `lerp`, `rng(seed)`, `randn()`, `binom(n,p)`, `fmtNum`.
- **Level:** `atLeast('honors')`, `lvText(levelObj)`.
- **Graphs:** `axes`, `bars(ctx,ax,values,{colors,labels,d})`, `legend(ctx,x,y,[{label,color,dash}])`, `serColor(i)`.

`BioLab.setValues(sim,{id:value})` updates the controls too. `BioLab.reset(sim)` resets the sim. `BioLab.refresh(sim)` redraws the readouts and graph.

## Colors (theme-aware; read from `PAL[...]` every frame)
- **Backgrounds and ink:** `cv-bg`, `cv-bg2`, `card`, `card2`, `cv-ink` (labels), `cv-soft` (secondary labels), `line`, `muted`.
- **Series:** `s1`…`s6` (red, blue, green, amber, purple, teal) or `serColor(i)`.
- **Domain colors:** `cv-water`, `cv-glass`, `cv-leaf`, `cv-leaf2`, `cv-h` (H⁺ pink), `cv-e` (electron yellow), `cv-sub` (blue), `cv-prod` (orange), `cv-inc` (red), `cv-inn` (purple), `cv-head`, `cv-tail` (lipids), `cv-ims`, `cv-matrix`, `cv-sol`, `cv-bench`, `cv-ruler`.
- Mid-tone literal fills (e.g. `'#3f6fb0'`) are fine for **objects with white labels on them**. Anything drawn on the background must use tokens, so both themes work.

## Standards
- **Real model, real units.** Every number is computed. Readouts carry units. Students should be able to measure things.
- **Show the process.** Animate the actual events: molecules moving, binding, dividing. Scale animation rates to model rates. Cap particle counts (≤ ~200) so a frame stays cheap.
- **Levels:** Bio gets the core variable and plain words; Honors gets named structures and a second variable; AP gets quantitative readouts and the harder variables. Gate with `lvl`.
- **Challenges:** at least 2 per level. Each one tests a real misconception, and the model must produce the "correct" outcome; the harness checks this.
- **Copy:** plain and direct, written from the student’s side. Active voice. No em-dash asides. Use the real terms, with key terms in `terms`.
- **Labels on canvas:** at least 12 × `k` px, and never overlapping each other or a moving object’s usual path.
- **Phone width (400 px):** the stage scales down, so keep labels few and large.

## Testing
`NODE_PATH=$(npm root -g) node /home/claude/biolab-test/harness.js <hash> [...]` prints a JSON report. It covers errors, NaN readouts, sweeps of every control and action, every challenge answered correctly at every level (each verdict must be "Your prediction held up." or "Correct."), and the walkthrough steps. Screenshots go to `/home/claude/biolab-test/out/<hash>/`. Look at the screenshots: `desk-ap.png`, `desk-dark.png`, `phone-dark.png`, `tour-step2.png`.

## Course pathways
`courses.js` lists each RJ course's units in teaching order with tool ids (owned by the lead; builders don't edit it). The course sequences come from Canvas; see the build notes.
