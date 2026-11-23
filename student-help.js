/* Student help (Nov 18, 2026): three small helpers on every Learn it step, prediction, review question and end card.
   1. Read aloud: reads the current text with the browser's own voice (Web Speech API), then each new step or
      question as it appears, until the student turns it off. Nothing leaves the device.
      Only a natural-sounding voice is used (Edge's "Online (Natural)" voices, Apple Premium/Enhanced). If the browser has none,
      the button opens a short how-to for Edge's own Read aloud and Immersive Reader instead (Nov 18: Wayne found the robotic voices off-putting).
   2. Easier reading: more space between lines, letters and words; shorter lines; no all-caps headings; no italics.
      Meant for dyslexic readers and anyone who finds dense text hard. Saved per browser.
   3. "This confused me" (v2, Nov 19: helps first). It opens a short panel: what it's asking and how to start (written
      help for the step from the site's help-text.js when there is some, otherwise a general tip), Show this step again,
      Back a step, Go to Learn it and Read it to me. Only then: "Still confused? Tell us what kind", five one-tap reasons.
      Opening counts once in GoatCounter (path only: site, tool, level, step); a reason adds .../why-<reason>.
      No names, no free text, nothing about the student. It tells us which steps to fix first, and how.
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
  ['guide','.gutbox',null]];
/* ---------- 1. Read aloud ---------- */
function pickVoice(){if(!CAN_SPEAK)return;const vs=SS.getVoices()||[];const en=vs.filter(v=>/^en(-|_)?US/i.test(v.lang));const pool=en.length?en:vs.filter(v=>/^en/i.test(v.lang));
  voice=pool.find(GOOD)||null;}   /* only a natural-sounding voice; never fall back to a robotic one */
function GOOD(v){return !!v&&/natural|online|neural|premium|enhanced/i.test(v.name);}
if(CAN_SPEAK){pickVoice();if(SS.addEventListener)SS.addEventListener('voiceschanged',pickVoice);}
/* Say symbols the way a teacher would. */
function speakable(s){return s.replace(/\s+/g,' ')
  .replace(/(\d)\s*°C/g,'$1 degrees Celsius').replace(/°C/g,'degrees Celsius').replace(/(\d)\s*°F/g,'$1 degrees Fahrenheit').replace(/(\d)\s*°/g,'$1 degrees')
  .replace(/µmol\/min/g,'micromoles per minute').replace(/µmol/g,'micromoles').replace(/\bmM\b/g,'millimolar').replace(/\bnm\b/g,'nanometers').replace(/µm/g,'micrometers').replace(/\bm\/s²/g,'meters per second squared').replace(/\bm\/s\b/g,'meters per second').replace(/\bkm\/h\b/g,'kilometers per hour')
  .replace(/H⁺/g,'H plus').replace(/Na⁺/g,'sodium ion').replace(/K⁺/g,'potassium ion').replace(/Cl⁻/g,'chloride ion').replace(/CO₂/g,'C O 2').replace(/O₂/g,'O 2').replace(/H₂O₂/g,'hydrogen peroxide').replace(/H₂O/g,'water').replace(/C₆H₁₂O₆/g,'glucose')
  .replace(/NADH/g,'N A D H').replace(/NAD⁺/g,'N A D plus').replace(/FADH₂/g,'F A D H 2').replace(/NADPH/g,'N A D P H').replace(/\bATP\b/g,'A T P').replace(/\bADP\b/g,'A D P').replace(/\bDNA\b/g,'D N A').replace(/\bRNA\b/g,'R N A').replace(/mRNA/g,'messenger R N A')
  .replace(/\bKm\b/g,'K m').replace(/\bVmax\b/g,'V max').replace(/ψ/g,'water potential').replace(/Δ/g,'change in ').replace(/→/g,' to ').replace(/←/g,' ').replace(/(\d)\s*×/g,'$1 times').replace(/×/g,' times ').replace(/≈/g,'about ').replace(/±/g,'plus or minus ').replace(/≤/g,' at most ').replace(/≥/g,' at least ')
  .replace(/[₀-₉]/g,c=>String('₀₁₂₃₄₅₆₇₈₉'.indexOf(c))).replace(/[⁰¹²³⁴-⁹]/g,c=>' to the '+'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).replace(/[✓✗✕▲😕🔊]/g,'').replace(/\s+/g,' ').trim();}
function say(text){if(!CAN_SPEAK||!voice)return;SS.cancel();if(!text)return;const parts=speakable(text).match(/[^.!?]+[.!?]*/g)||[text];
  parts.forEach(p=>{const u=new SpeechSynthesisUtterance(p.trim());if(voice)u.voice=voice;u.lang=(voice&&voice.lang)||'en-US';u.rate=0.95;SS.speak(u);});}
const vis=el=>!!(el&&el.offsetParent&&!el.closest('[hidden]'));
const clean=el=>{if(!el)return '';const c=el.cloneNode(true);c.querySelectorAll('.sh-help,.sh-tools,svg,script,style,.rv-dots,.count').forEach(x=>x.remove());
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
function send(path,title){(function go(n){const g=window.goatcounter;if(g&&typeof g.count==='function'){try{g.count({path,title,event:true});}catch(e){}}else if(n<40)setTimeout(()=>go(n+1),250);})(0);}
/* One tap says why (Nov 18, Jason: fix things from what students tell us). Still anonymous: only the reason's short code is sent. */
const WHY=[['reading','Too much to read'],['see','Couldn’t see what changed'],['words','Words I don’t know'],['fast','Went too fast'],['question','The question was confusing']];
const TIP={reading:'Thanks. Try 🔊 Read aloud or Aa Easier reading.',see:'Thanks. Press Show this step again and watch only the part that moves.',words:'Thanks. Key terms are in the Vocabulary list below the tool.',fast:'Thanks. Use the Speed menu to slow it down, or go Back.',question:'Thanks. That helps us rewrite it. Ask your teacher, too.'};
/* The site's engine (window.BioLab, ChemLab, PhysLab...) knows the tool and the Learn it step key. */
const ENG=()=>['BioLab','ChemLab','PhysLab','ForensicsLab','AnatomyLab','SportsMedLab','MathLab','FinanceLab','HealthLab','CivicsLab','AILab'].map(n=>window[n]).find(g=>g&&g.sims);
const toolId=()=>(location.hash||'#home').slice(1).split(/[@?&=]/)[0]||'home';
function curSim(){const g=ENG(),t=toolId();if(!g||!g.sims)return null;return g.sims[t]||Object.values(g.sims).find(x=>x&&x.def&&(x.def.hash===t||x.def.id===t))||null;}
function stepKey(){const sim=curSim();return (sim&&sim.lnKey)||'';}
const lvlNow=()=>{const lb=document.querySelector('#lvl [aria-pressed="true"], [data-l][aria-pressed="true"]');return lb?(lb.dataset.l||slug(lb.textContent)):'';};
/* Written help, from the site's help-text.js: RL_HELP[tool][stepKey] = {ask, another, start}.
   Any of them may be {bio|chem|honors|ap: text}: the student's level is used, else the nearest lower one. */
const ORDER=['bio','chem','honors','ap'];
function pickLv(v){if(!v||typeof v==='string')return v||'';const lv=lvlNow();const want=Math.max(0,ORDER.indexOf(lv));let out='';ORDER.forEach((l,i)=>{if(v[l]&&i<=want)out=v[l];});return out||v.bio||v.chem||v.honors||v.ap||'';}
function written(kind){if(kind!=='tour')return null;const H=window.RL_HELP&&window.RL_HELP[toolId()],k=stepKey();if(!H||!k||!H[k])return null;const h=H[k];return {ask:pickLv(h.ask),another:pickLv(h.another),start:pickLv(h.start)};}
/* Nov 23, 2026 (weekly "This confused me" log: 4 of 11 taps were on Start here screens): Start here is an opening screen,
   not a step that changes something, so it gets its own help: what the screen is, what to look at, and the first move. */
const START_HELP={ask:'Nothing to answer yet. This first screen tells you what the tool is about and what you will find out.',
  another:'Look at the picture: that is where the lesson starts. Every step after this one changes <b>one thing</b> in it.',
  start:'Press <b>Next</b> to take the first step. If a step goes by too fast, press <b>Show this step again</b>.'};
const isStartScreen=(kind,el)=>kind==='tour'&&!!el&&/^\s*start here\s*$/i.test(((el.querySelector('.tb-t')||{}).textContent)||'');
const GENERIC={
  tour:{ask:'Each step shows <b>one change</b>. Find the part of the picture that moves or is highlighted, then read the first sentence again.',start:'Press <b>Show this step again</b> and watch only that part. Then say in your own words what changed, and why.'},
  review:{ask:'Find the one question in the sentence. What is it asking you to pick?',start:'Cover the choices. Say your own answer first, then find the choice that matches it. Cross out any you know are wrong.'},
  predict:{ask:'It asks what you think will happen <b>before</b> you run it. A guess is fine: being wrong is how the run teaches you.',start:'Pick the choice that seems most likely, then run it and compare.'},
  guide:{ask:'Read it one line at a time. What is the one thing it asks you to find?',start:'Write down the numbers it gives you, then try just the first step.'}};
function replayStep(el){const back=el.querySelector('[data-tour=back]'),next=el.querySelector('[data-tour=next]');if(!back||!next)return;
  const again=sel=>setTimeout(()=>{const x=document.querySelector('.tourbar:not([hidden]) '+sel);x&&x.click();},60);
  if(!back.disabled){back.click();again('[data-tour=next]');}else{next.click();again('[data-tour=back]');}
  /* keep the help open after the replay */
  setTimeout(()=>{const tb=document.querySelector('.tourbar:not([hidden])');if(tb&&!tb.querySelector('.sh-help')){const c=tb.querySelector('.sh-cf');c&&c.click();}},450);}
const learnBtn=()=>[...document.querySelectorAll('.modebar button')].find(b=>/learn it/i.test(b.textContent)&&b.offsetParent&&b.getAttribute('aria-pressed')!=='true');
function helpHTML(kind,el){const w=written(kind)||{},st=isStartScreen(kind,el),g=st?START_HELP:(GENERIC[kind]||GENERIC.tour);const ask=w.ask||g.ask,another=w.another||(st?g.another:''),start=w.start||g.start;
  const back=el.querySelector('[data-tour=back]');
  const acts=(kind==='tour'?'<button type="button" class="btn sh-a" data-sha="again">🔁 Show this step again</button>'+(back&&!back.disabled?'<button type="button" class="btn sh-a" data-sha="back">← Back a step</button>':''):'')+
    ((kind==='review'||kind==='predict')&&learnBtn()?'<button type="button" class="btn sh-a" data-sha="learn">📘 Go to Learn it</button>':'')+'<button type="button" class="btn sh-a" data-sha="say">🔊 Read it to me</button>';
  return `<b>Let’s try it another way.</b>${ask?`<p><b>What it’s asking:</b> ${ask}</p>`:''}${another?`<div><b>Another way to see it:</b> ${another}</div>`:''}${start?`<p><b>How to start:</b> ${start}</p>`:''}<div class="sh-acts">${acts}</div>
    <div class="sh-whybox"><span>Still confused? Tell us what kind (anonymous):</span>${WHY.map(([k,l])=>`<button type="button" class="btn sh-chip" data-shw="${k}">${l}</button>`).join('')}</div>`;}
function toggleHelp(el,b,kind){let pn=el.querySelector('.sh-help');
  if(pn){pn.remove();b.textContent='😕 This confused me';b.setAttribute('aria-expanded','false');return;}
  const path=where(el);if(!counted.has(path)){counted.add(path);send(path,'Confusing step');}
  pn=document.createElement('div');pn.className='sh-help';pn.setAttribute('role','region');pn.setAttribute('aria-label','Help with this part');pn.dataset.path=path;pn.innerHTML=helpHTML(kind,el);
  const anchor=kind==='tour'?el.querySelector('.tb-x'):kind==='review'?el.querySelector('.rv-head'):kind==='predict'?el.querySelector('.p-head'):null;
  if(anchor)anchor.after(pn);else{const t=el.querySelector(':scope > .sh-tools');if(t)t.after(pn);else el.prepend(pn);}
  b.textContent='😕 Close help';b.setAttribute('aria-expanded','true');
  pn.addEventListener('click',e=>{e.stopPropagation();const r=e.target.closest('[data-shw]');
    if(r){const k=r.dataset.shw;send(pn.dataset.path+'/why-'+k,'Confusing: '+k);const wb=pn.querySelector('.sh-whybox');wb.innerHTML='';const t=document.createElement('span');t.className='sh-tip';t.textContent=TIP[k];wb.appendChild(t);return;}
    const a=e.target.closest('[data-sha]');if(!a)return;const k=a.dataset.sha;
    if(k==='again')replayStep(el);else if(k==='back'){const bk=el.querySelector('[data-tour=back]');bk&&bk.click();}
    else if(k==='learn'){const l=learnBtn();l&&l.click();}
    else if(k==='say'){if(CAN_SPEAK)pickVoice();if(!voice){showHow();return;}say(regionText(kind,el));}});
  pn.scrollIntoView({block:'nearest'});if(on)say(clean(pn).replace(/Still confused\?.*$/,''));}
/* No natural voice in this browser: show students how to use Microsoft Edge's own Read aloud instead.
   Photos go in img/read-aloud-1.png … -4.png on each site; a missing photo is simply left out. */
const HOW=[['Open this page in Microsoft Edge','Edge has natural-sounding voices built in. Copy the link from the address bar and paste it into Edge.'],
 ['Select the words you want to hear','Drag across the step text, then right-click it and choose <b>Read aloud selection</b>. To hear the whole page, press <b>Ctrl + Shift + U</b>.'],
 ['Pick a natural voice','In the Read aloud bar at the top, click <b>Voice options</b>. Choose a voice with <b>Natural</b> in its name, and set the speed you like.'],
 ['Want fewer distractions? Use Immersive Reader','Select the text, right-click, and choose <b>Open in Immersive Reader</b>. You can turn on line focus, split words into syllables, and have it read to you.']];
function showHow(){let d=document.getElementById('sh-how');if(!d){d=document.createElement('dialog');d.id='sh-how';d.setAttribute('aria-labelledby','sh-how-h');
  const edge=/Edg\//.test(navigator.userAgent),steps=HOW.map((h,i)=>[h,i]).filter(q=>!(edge&&q[1]===0));
  d.innerHTML='<h2 id="sh-how-h">Hear it read aloud in Microsoft Edge</h2><p>'+(edge?'Edge’s natural voices haven’t loaded yet. Wait a few seconds and try the button again, or use Edge’s own Read aloud:':'This browser doesn’t have a natural-sounding voice, so use Edge’s Read aloud.')+'</p><ol>'+
   steps.map(([h,i])=>'<li><b>'+h[0]+'</b><br>'+h[1]+'<img src="img/read-aloud-'+(i+1)+'.png" alt="" loading="lazy" onerror="this.remove()"></li>').join('')+
   '</ol><button type="button" class="btn">Got it</button>';
  d.querySelector('button').addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d)d.close();});document.body.appendChild(d);}
  if(d.showModal)d.showModal();else d.setAttribute('open','');}
/* ---------- buttons ---------- */
function labelRA(b){on=on&&!!voice;b.textContent=on?'🔊 Read aloud: on':'🔊 Read aloud';b.setAttribute('aria-pressed',String(on));b.title=on?'Stop reading aloud':'Read this out loud, and keep reading each new step';}
function labelER(b){b.textContent=easy?'Aa Easier reading: on':'Aa Easier reading';b.setAttribute('aria-pressed',String(easy));b.title='More space between lines and letters, shorter lines, no all-caps headings';}
function sync(){document.querySelectorAll('.sh-ra').forEach(labelRA);document.querySelectorAll('.sh-er').forEach(labelER);document.documentElement.classList.toggle('sh-easy',easy);}
function mk(cls,fn){const b=document.createElement('button');b.type='button';b.className='btn sh-btn '+cls;b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn(b);});return b;}
function ensureButtons(){SH_SEL.forEach(([kind,sel,head])=>{document.querySelectorAll(sel).forEach(el=>{const host=head?el.querySelector(head):el;if(!host)return;
  let box=host.querySelector(':scope > .sh-tools');
  if(box&&kind==='tour'&&box.dataset.sig!==stepSig(el)){box.remove();box=null;const old=el.querySelector('.sh-help');if(old)old.remove();}   /* fresh "confused" button, help closed, for each step */
  if(box)return;box=document.createElement('span');box.className='sh-tools';if(kind==='tour')box.dataset.sig=stepSig(el);
  box.appendChild(mk('sh-ra',()=>{if(CAN_SPEAK)pickVoice();if(!voice){on=false;put(KEY_RA,false);sync();showHow();return;}on=!on;put(KEY_RA,on);sync();if(on){lastSig='';tick(true);}else SS.cancel();}));
  box.appendChild(mk('sh-er',()=>{easy=!easy;put(KEY_ER,easy);sync();}));
  if(kind==='tour'||kind==='review'||kind==='guide'||kind==='predict'){const c=mk('sh-cf',b=>toggleHelp(el,b,kind));c.textContent='😕 This confused me';c.title='Get help with this part (and tell us, anonymously, that it was confusing)';c.setAttribute('aria-expanded','false');box.appendChild(c);}
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
const T='.tourbar,.panel.review,.panel.predict,.donecard,.gutbox';
const st=document.createElement('style');st.textContent=
`.sh-tools{display:inline-flex;flex-wrap:wrap;gap:6px;margin-left:auto;align-items:center}.donecard>.sh-tools,.gutbox>.sh-tools{display:flex;justify-content:flex-end;margin:0 0 8px}
.sh-btn{font-size:13.5px;padding:4px 10px;line-height:1.3}.sh-btn[aria-pressed="true"]{background:var(--rj,#c8102e);color:#fff;border-color:var(--rj,#c8102e)}.sh-cf[disabled]{opacity:.8;cursor:default}
.sh-tip{font-size:13px;color:var(--muted,#666)}
.sh-help{margin:8px 0;border:1.5px solid var(--rj,#c8102e);background:#fff8f2;border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;font-size:15px;line-height:1.5;text-align:left;color:var(--ink,#1a1a1a)}.sh-help p{margin:0}
.sh-acts{display:flex;flex-wrap:wrap;gap:6px}.sh-a{font-size:13.5px;padding:4px 10px}
.sh-whybox{display:flex;flex-wrap:wrap;gap:6px;align-items:center;border-top:1px dashed #d9c4b3;padding-top:6px;font-size:13.5px}#sh-how{max-width:min(560px,92vw);border:0;border-radius:14px;padding:22px 24px;line-height:1.55;font-size:16px}#sh-how::backdrop{background:rgba(0,0,0,.45)}#sh-how h2{margin:0 0 6px;font-size:20px}#sh-how ol{padding-left:22px;margin:12px 0 16px}#sh-how li{margin:0 0 12px}#sh-how img{display:block;max-width:100%;margin-top:8px;border:1px solid #ccd;border-radius:8px}.sh-why{display:flex;flex-wrap:wrap;gap:6px;width:100%;margin-top:4px}.sh-chip{font-size:12.5px;padding:3px 9px;border-radius:999px}
html.sh-easy :is(${T}) :is(p,li,.tb-x,.rv-q,.q,.choice,.verdict,.help){font-size:18px!important;line-height:1.75!important;letter-spacing:.035em!important;word-spacing:.14em!important;text-align:left!important;max-width:62ch}
html.sh-easy :is(${T}) :is(.ln-k,.p-head h3,.tb-n){text-transform:none!important;letter-spacing:.02em!important;font-size:15px!important}
html.sh-easy :is(${T}) :is(em,i){font-style:normal!important;font-weight:600}
html.sh-easy :is(${T}) p{margin-bottom:.8em!important}
html.sh-easy :is(${T}) .choice{padding-top:12px!important;padding-bottom:12px!important}`;
document.head.appendChild(st);
})();
