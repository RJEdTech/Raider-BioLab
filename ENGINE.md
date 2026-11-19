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
| `challenges` | An array, or a function `(sim)=>array`, of `{lvl,q,choices,correct,baseline,baselineAction,change,changeAction,changeText,watch,at,reveal,explain,instant}`. Timed challenges reset to defaults+`baseline`, apply `change` at `at` (default `chChange`), and reveal at `reveal` (default `chReveal`), in sim time. `instant:true` grades immediately, for quizzes. `onChallenge(sim,ch,phase)` lets a quiz set up its prompt (e.g. highlight a structure). Optional `fig` (HTML string, or `(sim,phase,pick)=>html`) shows a figure under the question, e.g. a chart the student has to read; `phase` is `ask`, `running` or `done`, so the figure can show the answer once it is revealed. Optional `after` (HTML, or `(sim,pick)=>html`) shows under the explanation once the answer is revealed, e.g. why the answer matters in real life. |
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
- **Answer choices (Nov 17, 2026):** the engine shows every question's choices in a random order on each page load (scoring and saved answers keep the authored index; add `fixed:true` to keep the authored order). Length must not give the answer away either: write all choices at about the same length and detail, give wrong answers a believable reason when the right one has a reason, and don't let long "because…" wrong answers stand out. Before pushing, run the answer-balance check (project doc `claude/answer-balance-check.js`): the correct answer should be the longest choice in about 1/n of questions (≈30% across a site), and no choice should stand out by length (≥12 characters and ≥1.25× the next) more often for right answers than wrong ones.
- **Copy:** plain and direct, written from the student’s side. Active voice. No em-dash asides. Use the real terms, with key terms in `terms`.
- **Labels on canvas:** at least 12 × `k` px, and never overlapping each other or a moving object’s usual path.
- **Phone width (400 px):** the stage scales down, so keep labels few and large.

## Testing
`NODE_PATH=$(npm root -g) node /home/claude/biolab-test/harness.js <hash> [...]` prints a JSON report. It covers errors, NaN readouts, sweeps of every control and action, every challenge answered correctly at every level (each verdict must be "Your prediction held up." or "Correct."), and the walkthrough steps. Screenshots go to `/home/claude/biolab-test/out/<hash>/`. Look at the screenshots: `desk-ap.png`, `desk-dark.png`, `phone-dark.png`, `tour-step2.png`.

## Course pathways
`courses.js` lists each RJ course's units in teaching order with tool ids (owned by the lead; builders don't edit it). The course sequences come from Canvas; see the build notes.

## Review questions and unit paths
Add questions in `review.js` with `BioLab.addReview({<id>:{apNote,ap:[{title,url,note}],questions:[...]}})`. A tool with an entry gets a **Review** mode, which also opens with `#<hash>@review`.

Each question has `id`, `kind` (`real`, `test` or `ap`), `lvl`, `q`, `steps` (worked solution), and either `choices` + `correct` or `num:{ans,tol,unit}`. Add `lab:{set,act,look}` for the "See it in the lab" button: `set` is control values, `act` an action id, `look` tells students what to read. `verify`, `verifyAbove` and `wait` are read only by the test script, to check answers against the model.

Unit paths need no setup: `#u-<courseId>-<unitIndex>` is built from `courses.js`. A tool page opened from a path uses `#<hash>@<mode>@u-<courseId>-<unitIndex>`.

## Reading pace (Nov 12, 2026)
The first time a student meets a step, its Next / Finish / answer buttons wait 3–5 s (3 s, plus more for long text, capped at 5 s).
While they wait, a cue above the buttons says what to look at ("Watch the model", "Read why") with a small fill bar, and the step's `focus` box pulses.
- Gated: walkthrough Next (Guided and Learn it), prediction choices, the Next/Finish after a prediction result, review choices and Next after feedback, virtual-lab step Next, and (math engine) the reveal's Next.
- Never gated: Back, Skip to the full lab, the mode bar, Run it again, steps already seen this visit, the gut answer, typed answers, games, FRQ.
- Buttons are blocked with the `pace-wait` class and `aria-disabled`, not `disabled`, so the virtual lab's own `disabled` checks keep working. A capture-phase click listener on `document` swallows early clicks and nudges the cue.
- `?pace=off` turns it off in that browser for every Raider Labs site (shared `raider-labs-pace` key in localStorage); `?pace=on` turns it back on.
- Hooks are wrappers on `tourGo`, `renderChallenge`, `renderReview`, `vlGo` (and `guideReveal` in the math engine), so a step that renders through those gets the wait with no change to the sim.
- Playwright treats `aria-disabled` buttons as disabled and waits; use `click(force=True)` to test an early click.

## Final review paths
A course in `courses.js` can carry `finals:[{t, units, note}]`. Each becomes a path at `#f-<courseId>-<k>` and a button at the top of the course view. `units` lists unit indexes; an entry can be `[index, ['toolId',...]]` to take only some of that unit's tools. A final path keeps only practice steps: Test yourself for Learn it tools, Review questions otherwise, and Free-response practice where it exists. Tools with no questions are left off.

### Learn it: showing the cause (`cause`)
A Learn it step can show its cause happening instead of jumping to the result:
`cause:{from:{T:300}, delay:1.2, dur:2.5, label:'Temperature', ring:[x,y,r] or sim=>[x,y,r], at:[x,y]}`.
The step starts at the `from` values, then after `delay` seconds slides numbers to the step's `set` values over `dur` seconds (choices and toggles switch at `delay`). A banner names what is changing with before → now, and `ring` circles the part of the picture that changes. Use it whenever a step is about what one setting does. For actions (add a serum, breed, arrange), trigger them partway through the step from the overlay (see `atT` in BioLab learn.js) so the student sees the before state first.

## Where science meets philosophy + How exact does it need to be? (Nov 17, 2026)
- `BioLab.addBorder({toolId:{...}})` registers a border card, kept in each site's `borders.js` (loaded last), separate from Learn it files so sessions don't collide.
- Fields:
  - `q`: the border question.
  - `saw`: what the student just saw, tied to the picture.
  - `assumes`: what science has to assume here (presuppositions no experiment can prove without already using them).
  - `stops`: where the science stops.
  - `church` (optional): definitive Church teaching, stated as the Church's teaching.
  - `views`: `[{who,when,says}]`, named thinkers who answer the open part differently.
  - `margin`: `{lead, rows:[{what,value,range,how,enough}], note}`.
- The card shows below the stage in Full lab and at the end of Learn it. The student picks the view closest to theirs and writes one sentence, saved per browser (`raider-border-<id>`), with a "Copy my answer" button. There is no answer key.
- Standard: teach, don't preach (claude/raider-labs-teach-not-preach-standard.md). Every view is stated fairly, with sources and years on every number.
- Pilot tools: BioLab evolution, cladogram, division; PhysLab gravity, photoelectric.

## From Dr. Sandy Robertson's APES tools (Nov 17, 2026)
Her Plate Boundary Explorer, ENSO Explorer and Soil Investigation Lab showed what our tools were missing. Now in every Raider Labs engine:
- **Minutes on the mode buttons.** `Learn it · 5 min`, `Test yourself · 8 min`, `Free response · 9 min`, computed from the steps and questions at the current detail level (about 0.6 min per walkthrough step, 1 min per question, FRQ `minutes`). Nothing to author.
- **You will be able to…** A tool with `learn.goals` shows them in a small box under the mode buttons, so students know the job before they start.
- **Turn it in.** The Test yourself and Review results add a box: name, one thing learned, one question still open, **Copy for Canvas**. The summary has the site, tool, detail level, date, prediction score, every why question (✓/✗ and the student's answer) and the Myth or fact score. A teacher can assign any tool as a Canvas text-entry assignment. The name is shared across tools (`raider-labs-name`); the rest is saved per tool.
- **Myth or fact.** `BioLab.addMyths({toolId:[{k,s,fact,why,lvl}]})` in the site's `myths.js` (loaded after review.js). Students pick Myth or Fact, one graded try, then read why. It shows in a "Myth or fact?" box on the tool page, at the end of Learn it and the guided walkthrough, and in the Turn it in summary. Write one-sentence statements that students really believe; mix in real facts (at least one per tool) so "myth" is not always right; give `k` a stable short key so saved answers survive edits.
- Still per tool, by hand (no engine change): show the normal state first and change one thing (`cause`), real places and dates in hooks, how people respond in `useIt`, and a "compare all" view when a tool teaches several cases.
- **Teacher-made tools (BioLab).** A def with `external:{src,height,time,intro}` and `credit:{name,role,note,short}` shows a teacher's own page from `teacher/` in a frame, with "Created by …" under the title and "By …" on the home card. First use: `sims/robertson.js`, Dr. Sandy Robertson's four APES Unit 4 tools (her files unchanged except an author meta tag).

## Student help: read aloud, easier reading, "this confused me" (Nov 18, 2026)
`student-help.js` (loaded after `BioLab.start()`, same file on every Raider Labs site) adds three buttons to every Learn it step, Test yourself prediction, review question, gut check and end card:
- **🔊 Read aloud:** reads the current text with the browser's own voice (Web Speech API; nothing leaves the device), then each new step or question, until turned off. It prefers Edge's Natural voices and says symbols as words (°C, µmol/min, H⁺, CO₂, Km).
- **Aa Easier reading:** a reading view for dyslexic readers and anyone who finds dense text hard. It adds space between lines, letters and words, makes lines shorter, removes all-caps headings and drops italics. Only text panels change; the canvas is unchanged.
- **😕 This confused me:** one click counts a GoatCounter event, `confused/<site>/<tool>/<level>/<step>`. Then five one-tap reasons send `…/why-reading|see|words|fast|question` (too much to read, couldn't see what changed, words I don't know, went too fast, the question was confusing). It sends no names and no free text. To see which steps students flag most, check the Events list in the rjedtech.goatcounter.com dashboard.
- Both settings are saved per browser (`raider-labs-readaloud`, `raider-labs-easyread`). The file only watches the page, so no tool needs changes. Panel selectors are in `SH_SEL` at the top of the file.

## Writing Learn it steps (Nov 18, 2026, from Honors Bio student feedback on Enzymes)
Students called the enzyme walkthrough "helpful but confusing… a little overwhelming". These rules come from that feedback.
- **About 40 words per step, at most,** across What you see + Why it happens + Why it matters. One idea per step. Run `claude/learn-words-check.js` (project doc); its output lists any step over 40.
- **Show the result on the picture.** The one number the step is about (rate, mass change, ATP count) goes on the canvas, with a mark for "normal". Readout tiles below the canvas are off-screen during Learn it.
- **Put it on the graph students are tested on.** Each tool needs one step that builds the unit's standard graph (rate vs temperature, mass change vs molarity, O₂ vs light) from the model, so the particle view connects to the test graph.
- **Check against the unit quiz.** Before building, list the core ideas the course's quiz tests (activation energy was missing from Enzymes). Each one needs a step or a practice question.
- **Text must stand alone when heard.** Read aloud (ours or Edge's) cannot read the canvas, so "What you see" must say what the picture shows.
- **Labels never overlap at phone width.** Anchor labels by their edge (`ezTagA` in BioLab learn.js), and check `stepshots` at 390 px.
- **Practice questions that look like tests:** in each unit, include some questions with a figure (inline SVG built from the model) and questions tied to the class's own lab.

### Graph kit for Learn it overlays (`learn-graph-kit.js`, Nov 18, 2026)
Loaded after the sims and before the review and learn files. Inside an overlay, `const K=BioLab.lg;` gives `K.dim(ctx,LH)` (an opaque cover), `K.axes(ctx,B,k,{xr,xt,yt,xl,yl})`, `K.curve(ctx,B,xr,fn,to,col,dash)` (fn returns 0..1), `K.dot`, `K.bars`, `K.tag` and `K.tagA(…,'l'|'r')` (edge-anchored labels that stay on the canvas at phone size), plus `K.X`, `K.Y`, `K.ease` and `K.lerp`. Build each curve from the sim's own formulas, and say so in a comment.
