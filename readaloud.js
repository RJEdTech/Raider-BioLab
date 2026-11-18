/* Read aloud (Nov 18, 2026). For students who learn better by listening, including dyslexic readers.
   A "Read aloud" button sits on every Learn it step, prediction and review question. Turning it on reads the
   current text, then reads each new step or question as it appears, until the student turns it off.
   Uses the browser's own speech (Web Speech API), so nothing leaves the device. Stand-alone: it only watches the page. */
(function(){
'use strict';
const SS=window.speechSynthesis;if(!SS||typeof SpeechSynthesisUtterance==='undefined')return;
const KEY='raider-labs-readaloud';
const store={get(){try{return localStorage.getItem(KEY)==='on';}catch(e){return false;}},set(v){try{localStorage.setItem(KEY,v?'on':'off');}catch(e){}}};
let on=store.get(),lastSig='',voice=null;
function pickVoice(){const vs=SS.getVoices()||[];const en=vs.filter(v=>/^en(-|_)?US/i.test(v.lang));const pool=en.length?en:vs.filter(v=>/^en/i.test(v.lang));
  voice=pool.find(v=>/natural|online|neural/i.test(v.name))||pool.find(v=>v.default)||pool[0]||null;}
pickVoice();if(SS.addEventListener)SS.addEventListener('voiceschanged',pickVoice);
/* Say symbols the way a teacher would. */
function speakable(s){return s.replace(/\s+/g,' ')
  .replace(/(\d)\s*°C/g,'$1 degrees Celsius').replace(/°C/g,'degrees Celsius').replace(/(\d)\s*°F/g,'$1 degrees Fahrenheit')
  .replace(/µmol\/min/g,'micromoles per minute').replace(/µmol/g,'micromoles').replace(/\bmM\b/g,'millimolar').replace(/\bnm\b/g,'nanometers').replace(/µm/g,'micrometers')
  .replace(/H⁺/g,'H plus').replace(/O₂/g,'O 2').replace(/CO₂/g,'C O 2').replace(/H₂O₂/g,'hydrogen peroxide').replace(/H₂O/g,'water').replace(/NADH/g,'N A D H').replace(/FADH₂/g,'F A D H 2').replace(/ATP/g,'A T P')
  .replace(/\bKm\b/g,'K m').replace(/\bVmax\b/g,'V max').replace(/→/g,' to ').replace(/←/g,' ').replace(/(\d)\s*×/g,'$1 times').replace(/×/g,' times ').replace(/≈/g,'about ').replace(/±/g,'plus or minus ')
  .replace(/[✓✗✕▲]/g,'').replace(/\s+/g,' ').trim();}
function say(text){SS.cancel();if(!text)return;const parts=speakable(text).match(/[^.!?]+[.!?]*/g)||[text];
  parts.forEach(p=>{const u=new SpeechSynthesisUtterance(p.trim());if(voice)u.voice=voice;u.lang=(voice&&voice.lang)||'en-US';u.rate=0.95;SS.speak(u);});}
const vis=el=>!!(el&&el.offsetParent&&!el.closest('[hidden]'));
const clean=el=>{if(!el)return '';const c=el.cloneNode(true);c.querySelectorAll('.ra-btn,svg,script,style,.rv-dots,.count').forEach(x=>x.remove());
  /* the clone has no layout, so mark where each block ends; that gives the voice a pause between a heading and its text */
  c.querySelectorAll('p,li,h2,h3,h4,h5,div,ul,ol,button,br').forEach(x=>x.append(document.createTextNode('. ')));
  return (c.textContent||'').replace(/\s+/g,' ').replace(/([.!?:])\s*\.(\s*\.)*/g,'$1').replace(/(\.\s*){2,}/g,'. ').replace(/^\.\s*/,'').trim();};
/* What to read in each kind of panel. */
function regionText(kind,el){
  if(kind==='tour'){const n=el.querySelector('.tb-n'),t=el.querySelector('.tb-t'),x=el.querySelector('.tb-x');return [n&&n.textContent,t&&t.textContent,clean(x)].filter(Boolean).join('. ');}
  if(kind==='review'){const q=el.querySelector('.rv-q');if(!q){const r=el.querySelector('.rv-res');return r?clean(r):'';}
    const fb=el.querySelector('.rv-fb');if(fb){const r=el.querySelector('.choices .choice.right'),v=fb.querySelector('.verdict'),rest=fb.cloneNode(true);const vv=rest.querySelector('.verdict');if(vv)vv.remove();return [v&&clean(v),r?'The answer is: '+clean(r).replace(/^Correct answer:\s*/,'').replace(/[.\s]*$/,'')+'.':'',clean(rest)].filter(Boolean).join(' ');}
    const ch=[...el.querySelectorAll('.choices .choice')].map((b,i)=>'Choice '+(i+1)+': '+clean(b)+'.');return clean(q)+' '+ch.join(' ');}
  if(kind==='predict'){const q=el.querySelector('.q');const ch=[...el.querySelectorAll('.choices .choice, .choices button')].map((b,i)=>'Choice '+(i+1)+': '+clean(b)+'.');
    const res=el.querySelector('.verdict, .result, .explain');return res&&vis(res)?clean(res.parentElement||res):((q?clean(q):'')+' '+ch.join(' '));}
  if(kind==='done')return clean(el);
  return '';}
const KINDS=[['tour','.tourbar','.tb-h'],['review','.panel.review','.rv-head'],['predict','.panel.predict','.p-head'],['done','.donecard',null]];
function label(b){b.textContent=on?'🔊 Read aloud: on':'🔊 Read aloud';b.setAttribute('aria-pressed',String(on));b.title=on?'Stop reading aloud':'Read this out loud, and keep reading each new step';}
function syncButtons(){document.querySelectorAll('.ra-btn').forEach(label);}
function ensureButtons(){KINDS.forEach(([kind,sel,head])=>{document.querySelectorAll(sel).forEach(el=>{const host=head?el.querySelector(head):el;if(!host||host.querySelector(':scope > .ra-btn'))return;
  const b=document.createElement('button');b.type='button';b.className='btn ra-btn';b.dataset.kind=kind;label(b);
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();on=!on;store.set(on);syncButtons();if(on){lastSig='';tick(true);}else SS.cancel();});
  if(head)host.appendChild(b);else host.insertBefore(b,host.firstChild);});});}
/* The panel the student is looking at now: the visible one nearest the top of the active tool. */
function current(){for(const [kind,sel] of KINDS){const el=[...document.querySelectorAll(sel)].find(vis);if(el){const t=regionText(kind,el);if(t)return {kind,el,t};}}return null;}
function tick(force){ensureButtons();if(!on)return;const c=current();if(!c){return;}const sig=c.kind+'|'+c.t;if(!force&&sig===lastSig)return;lastSig=sig;say(c.t);}
let pend=0;const mo=new MutationObserver(()=>{if(pend)return;pend=setTimeout(()=>{pend=0;tick(false);},350);});
function boot(){ensureButtons();mo.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});}
window.addEventListener('hashchange',()=>{SS.cancel();lastSig='';});window.addEventListener('pagehide',()=>SS.cancel());
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
const st=document.createElement('style');st.textContent='.ra-btn{font-size:14px;padding:5px 12px;margin-left:auto}.ra-btn[aria-pressed="true"]{background:var(--rj,#c8102e);color:#fff;border-color:var(--rj,#c8102e)}.donecard>.ra-btn{float:right;margin:0 0 8px 12px}';document.head.appendChild(st);
})();
