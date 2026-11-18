/* Student help (Nov 18, 2026): three small helpers on every Learn it step, prediction, review question and end card.
   1. Read aloud: reads the current text with the browser's own voice (Web Speech API), then each new step or
      question as it appears, until the student turns it off. Nothing leaves the device.
   2. Easier reading: more space between lines, letters and words; shorter lines; no all-caps headings; no italics.
      Meant for dyslexic readers and anyone who finds dense text hard. Saved per browser.
   3. "This confused me": one click counts an event in the site's GoatCounter (path only: site, tool, level, step).
      No names, no text, nothing about the student. It tells us which steps to fix first.
   Stand-alone: it only watches the page, so no tool or engine needs changes. Same file on every Raider Labs site;
   SH_SEL below lists each engine's panel selectors. */
(function(){
'use strict';
const SS=window.speechSynthesis,CAN_SPEAK=!!(SS&&typeof SpeechSynthesisUtterance!=='undefined');
const KEY_RA='raider-labs-readaloud',KEY_ER='raider-labs-easyread';
const get=k=>{try{return localStorage.getItem(k)==='on';}catch(e){return false;}},put=(k,v)=>{try{localStorage.setItem(k,v?'on':'off');}catch(e){}};
let on=CAN_SPEAK&&get(KEY_RA),easy=get(KEY_ER),lastSig='',voice=null;
/* Panels by engine: [kind, panel selector, header selector to hold the buttons (null = top of panel)].
   Science engine (BioLab, ChemLab, PhysLab, ForensicsLab, AnatomyLab, SportsMedLab) and math engine (MathLab family). */
const SH_SEL=[
  ['tour','.tourbar','.tb-h'],['review','.panel.review','.rv-head'],['predict','.panel.predict','.p-head'],['done','.donecard',null],
  ['guide','.gd-card, .guide-card, .walk-card',null],['quiz','.rv-card, .quiz-card',null]];
/* ---------- 1. Read aloud ---------- */
function pickVoice(){if(!CAN_SPEAK)return;const vs=SS.getVoices()||[];const en=vs.filter(v=>/^en(-|_)?US/i.test(v.lang));const pool=en.length?en:vs.filter(v=>/^en/i.test(v.lang));
  voice=pool.find(v=>/natural|online|neural/i.test(v.name))||pool.find(v=>v.default)||pool[0]||null;}
if(CAN_SPEAK){pickVoice();if(SS.addEventListener)SS.addEventListener('voiceschanged',pickVoice);}
/* Say symbols the way a teacher would. */
function speakable(s){return s.replace(/\s+/g,' ')
  .replace(/(\d)\s*°C/g,'$1 degrees Celsius').replace(/°C/g,'degrees Celsius').replace(/(\d)\s*°F/g,'$1 degrees Fahrenheit').replace(/(\d)\s*°/g,'$1 degrees')
  .replace(/µmol\/min/g,'micromoles per minute').replace(/µmol/g,'micromoles').replace(/\bmM\b/g,'millimolar').replace(/\bnm\b/g,'nanometers').replace(/µm/g,'micrometers').replace(/\bm\/s²/g,'meters per second squared').replace(/\bm\/s\b/g,'meters per second').replace(/\bkm\/h\b/g,'kilometers per hour')
  .replace(/H⁺/g,'H plus').replace(/Na⁺/g,'sodium ion').replace(/K⁺/g,'potassium ion').replace(/Cl⁻/g,'chloride ion').replace(/CO₂/g,'C O 2').replace(/O₂/g,'O 2').replace(/H₂O₂/g,'hydrogen peroxide').replace(/H₂O/g,'water').replace(/C₆H₁₂O₆/g,'glucose')
  .replace(/NADH/g,'N A D H').replace(/NAD⁺/g,'N A D plus').replace(/FADH₂/g,'F A D H 2').replace(/NADPH/g,'N A D P H').replace(/\bATP\b/g,'A T P').replace(/\bADP\b/g,'A D P').replace(/\bDNA\b/g,'D N A').replace(/\bRNA\b/g,'R N A').replace(/mRNA/g,'messenger R N A')
  .replace(/\bKm\b/g,'K m').replace(/\bVmax\b/g,'V max').replace(/ψ/g,'water potential').replace(/Δ/g,'change in ').replace(/→/g,' to ').replace(/←/g,' ').replace(/(\d)\s*×/g,'$1 times').replace(/×/g,' times ').replace(/≈/g,'about ').replace(/±/g,'plus or minus ').replace(/≤/g,' at most ').replace(/≥/g,' at least ')
  .replace(/[₀-₉]/g,c=>String('₀₁₂₃₄₅₆₇₈₉'.indexOf(c))).replace(/[⁰¹²³⁴-⁹]/g,c=>' to the '+'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).replace(/[✓✗✕▲😕🔊]/g,'').replace(/\s+/g,' ').trim();}
function say(text){if(!CAN_SPEAK)return;SS.cancel();if(!text)return;const parts=speakable(text).match(/[^.!?]+[.!?]*/g)||[text];
  parts.forEach(p=>{const u=new SpeechSynthesisUtterance(p.trim());if(voice)u.voice=voice;u.lang=(voice&&voice.lang)||'en-US';u.rate=0.95;SS.speak(u);});}
const vis=el=>!!(el&&el.offsetParent&&!el.closest('[hidden]'));
const clean=el=>{if(!el)return '';const c=el.cloneNode(true);c.querySelectorAll('.sh-tools,svg,script,style,.rv-dots,.count').forEach(x=>x.remove());
  /* the clone has no layout, so mark where each block ends; that gives the voice a pause between a heading and its text */
  c.querySelectorAll('p,li,h2,h3,h4,h5,div,ul,ol,button,br').forEach(x=>x.append(document.createTextNode('. ')));
  return (c.textContent||'').replace(/\s+/g,' ').replace(/([.!?:])\s*\.(\s*\.)*/g,'$1').replace(/(\.\s*){2,}/g,'. ').replace(/^\.\s*/,'').trim();};
function regionText(kind,el){
  if(kind==='tour'){const n=el.querySelector('.tb-n'),t=el.querySelector('.tb-t'),x=el.querySelector('.tb-x');return [n&&n.textContent,t&&t.textContent,clean(x)].filter(Boolean).join('. ');}
  if(kind==='review'){const q=el.querySelector('.rv-q');if(!q){const r=el.querySelector('.rv-res');return r?clean(r):'';}
    const fb=el.querySelector('.rv-fb');if(fb){const r=el.querySelector('.choices .choice.right'),v=fb.querySelector('.verdict'),rest=fb.cloneNode(true);const vv=rest.querySelector('.verdict');if(vv)vv.remove();
      return [v&&clean(v),r?'The answer is: '+clean(r).replace(/^Correct answer:\s*/,'').replace(/[.\s]*$/,'')+'.':'',clean(rest)].filter(Boolean).join(' ');}
    const ch=[...el.querySelectorAll('.choices .choice')].map((b,i)=>'Choice '+(i+1)+': '+clean(b)+'.');return clean(q)+' '+ch.join(' ');}
  if(kind==='predict'){const q=el.querySelector('.q');const ch=[...el.querySelectorAll('.choices .choice, .choices button')].map((b,i)=>'Choice '+(i+1)+': '+clean(b)+'.');
    const res=el.querySelector('.verdict, .result, .explain');return res&&vis(res)?clean(res.parentElement||res):((q?clean(q):'')+' '+ch.join(' '));}
  return clean(el);}
/* ---------- 3. "This confused me" ---------- */
const slug=s=>(s||'').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g,'').trim().replace(/\s+/g,'-').slice(0,40);
function where(el){const site=(location.pathname.split('/').filter(Boolean)[0]||location.hostname).replace(/^Raider-/,'');
  const tool=(location.hash||'#home').slice(1).split('@')[0]||'home';const lb=document.querySelector('#lvl [aria-pressed="true"], [data-l][aria-pressed="true"]');const lvl=lb?(lb.dataset.l||slug(lb.textContent)):'';
  let step='';const n=el.querySelector('.tb-n'),t=el.querySelector('.tb-t');if(n)step=(n.textContent.match(/\d+/)||[''])[0].padStart(2,'0')+'-'+slug(t&&t.textContent);
  else{const cur=el.querySelector('.rv-dot.cur, [aria-current="true"]');const q=el.querySelector('.rv-q, .q');step='q'+(cur?cur.textContent.trim():'')+'-'+slug(q&&q.textContent);}
  return ['confused',site,tool,lvl,step].filter(Boolean).join('/');}
const counted=new Set();
function countConfused(el,b){const path=where(el);if(counted.has(path)){b.textContent='Thanks, noted';return;}counted.add(path);
  (function send(n){const g=window.goatcounter;if(g&&typeof g.count==='function'){try{g.count({path,title:'Confusing step',event:true});}catch(e){}}else if(n<40)setTimeout(()=>send(n+1),250);})(0);
  b.textContent='Thanks, noted';b.disabled=true;b.setAttribute('aria-live','polite');
  const tip=document.createElement('span');tip.className='sh-tip';tip.textContent=CAN_SPEAK&&!on?'Try 🔊 Read aloud, go Back a step, or ask your teacher.':'Go Back a step, or ask your teacher.';b.after(tip);}
/* ---------- buttons ---------- */
function labelRA(b){b.textContent=on?'🔊 Read aloud: on':'🔊 Read aloud';b.setAttribute('aria-pressed',String(on));b.title=on?'Stop reading aloud':'Read this out loud, and keep reading each new step';}
function labelER(b){b.textContent=easy?'Aa Easier reading: on':'Aa Easier reading';b.setAttribute('aria-pressed',String(easy));b.title='More space between lines and letters, shorter lines, no all-caps headings';}
function sync(){document.querySelectorAll('.sh-ra').forEach(labelRA);document.querySelectorAll('.sh-er').forEach(labelER);document.documentElement.classList.toggle('sh-easy',easy);}
function mk(cls,fn){const b=document.createElement('button');b.type='button';b.className='btn sh-btn '+cls;b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn(b);});return b;}
function ensureButtons(){SH_SEL.forEach(([kind,sel,head])=>{document.querySelectorAll(sel).forEach(el=>{const host=head?el.querySelector(head):el;if(!host)return;
  let box=host.querySelector(':scope > .sh-tools');
  if(box&&kind==='tour'&&box.dataset.sig!==stepSig(el)){box.remove();box=null;}   /* fresh "confused" button for each step */
  if(box)return;box=document.createElement('span');box.className='sh-tools';if(kind==='tour')box.dataset.sig=stepSig(el);
  if(CAN_SPEAK)box.appendChild(mk('sh-ra',()=>{on=!on;put(KEY_RA,on);sync();if(on){lastSig='';tick(true);}else SS.cancel();}));
  box.appendChild(mk('sh-er',()=>{easy=!easy;put(KEY_ER,easy);sync();}));
  if(kind==='tour'||kind==='review'||kind==='guide'||kind==='quiz'){const c=mk('sh-cf',b=>countConfused(el,b));c.textContent='😕 This confused me';c.title='Tell us this part was confusing (counted anonymously)';box.appendChild(c);}
  if(head)host.appendChild(box);else host.insertBefore(box,host.firstChild);});});sync();}
const stepSig=el=>{const n=el.querySelector('.tb-n'),t=el.querySelector('.tb-t');return (n?n.textContent:'')+'|'+(t?t.textContent:'')+'|'+location.hash;};
/* The panel the student is looking at now. */
function current(){for(const [kind,sel] of SH_SEL){const el=[...document.querySelectorAll(sel)].find(vis);if(el){const t=regionText(kind,el);if(t)return {kind,el,t};}}return null;}
function tick(force){ensureButtons();if(!on)return;const c=current();if(!c)return;const sig=c.kind+'|'+c.t;if(!force&&sig===lastSig)return;lastSig=sig;say(c.t);}
let pend=0;const mo=new MutationObserver(()=>{if(pend)return;pend=setTimeout(()=>{pend=0;tick(false);},350);});
function boot(){ensureButtons();mo.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});}
window.addEventListener('hashchange',()=>{if(CAN_SPEAK)SS.cancel();lastSig='';});window.addEventListener('pagehide',()=>{if(CAN_SPEAK)SS.cancel();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
/* ---------- 2. Easier reading styles (only text panels; the canvas is unchanged) ---------- */
const T='.tourbar,.panel.review,.panel.predict,.donecard,.gd-card,.guide-card,.walk-card,.rv-card,.quiz-card';
const st=document.createElement('style');st.textContent=
`.sh-tools{display:inline-flex;flex-wrap:wrap;gap:6px;margin-left:auto;align-items:center}.donecard>.sh-tools,.gd-card>.sh-tools,.guide-card>.sh-tools,.walk-card>.sh-tools,.rv-card>.sh-tools,.quiz-card>.sh-tools{display:flex;justify-content:flex-end;margin:0 0 8px}
.sh-btn{font-size:13.5px;padding:4px 10px;line-height:1.3}.sh-btn[aria-pressed="true"]{background:var(--rj,#c8102e);color:#fff;border-color:var(--rj,#c8102e)}.sh-cf[disabled]{opacity:.8;cursor:default}
.sh-tip{font-size:13px;color:var(--muted,#666)}
html.sh-easy :is(${T}) :is(p,li,.tb-x,.rv-q,.q,.choice,.verdict,.help){font-size:18px!important;line-height:1.75!important;letter-spacing:.035em!important;word-spacing:.14em!important;text-align:left!important;max-width:62ch}
html.sh-easy :is(${T}) :is(.ln-k,.p-head h3,.tb-n){text-transform:none!important;letter-spacing:.02em!important;font-size:15px!important}
html.sh-easy :is(${T}) :is(em,i){font-style:normal!important;font-weight:600}
html.sh-easy :is(${T}) p{margin-bottom:.8em!important}
html.sh-easy :is(${T}) .choice{padding-top:12px!important;padding-bottom:12px!important}`;
document.head.appendChild(st);
})();
