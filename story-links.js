/* Everyday questions (Nov 24, 2026). Same file on every Raider Labs site that has story pages.
   Each lab lists its story pages in window.RL_STORIES (set in its index.html):
     {q:'Why does a cracker turn sweet?', href:'story/enzymes.html', tools:['enzymes'], min:8}
   1. Home page: a "Start with a question" row above Browse, one link per story.
   2. Each matching tool: a "Start with the story" link beside Learn it / Test yourself / Full lab,
      so a student meets the everyday question before the model. Nothing else on the page changes. */
(function(){
'use strict';
const S=(window.RL_STORIES||[]).filter(s=>s&&s.q&&s.href);if(!S.length)return;
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function home(){const h=document.getElementById('home');if(!h||h.querySelector('.eq-row'))return;
  const row=document.createElement('nav');row.className='eq-row';row.setAttribute('aria-label','Start with a question');
  row.innerHTML='<span class="eq-l">Start with a question</span>'+S.filter(s=>!s.toolOnly).map(s=>`<a class="eq-q" href="${esc(s.href)}">${esc(s.q)}</a>`).join('');
  const at=h.querySelector('.home-cards')||h.querySelector('.browse-row')||h.querySelector('#units');if(at)h.insertBefore(row,at);else h.appendChild(row);}
/* tools[] holds the tool's address (#enzymes); the engine's section id can differ (sim-enz), so look it up in the engine's defs. */
function secFor(h){let sec=document.getElementById('sim-'+h);if(sec)return sec;try{const D=(window.BioLab&&window.BioLab.defs)||{};const arr=Array.isArray(D)?D:Object.values(D);
  const d=arr.find(x=>x&&(x.hash===h||x.id===h));if(d)sec=document.getElementById('sim-'+d.id);}catch(e){}return sec;}
function tools(){S.forEach(s=>(s.tools||[]).forEach(id=>{const sec=secFor(id);if(!sec)return;
  const mb=sec.querySelector('.sim-head .modebar');if(!mb||sec.querySelector('.eq-story'))return;
  const a=document.createElement('a');a.className='eq-story';a.href=s.href;
  a.innerHTML=`<span aria-hidden="true">📖</span> Start with the story: <b>${esc(s.q)}</b>${s.min?` <small>· ${s.min} min</small>`:''}`;
  mb.after(a);}));}
function run(){try{home();tools();}catch(e){}}
let t=0;const mo=new MutationObserver(()=>{if(t)return;t=setTimeout(()=>{t=0;run();},200);});
function boot(){run();mo.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
const st=document.createElement('style');st.textContent=
`.eq-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:4px 0 14px}
.eq-l{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-right:4px}
.eq-q{display:inline-block;padding:6px 12px;border-radius:999px;border:1px solid var(--rj,#c8102e);color:var(--rj-ink,var(--rj,#c8102e));background:var(--card,#fff);text-decoration:none;font-weight:600;font-size:14px;line-height:1.3}
.eq-q:hover,.eq-q:focus-visible{background:var(--rj,#c8102e);color:#fff}
.eq-story{display:inline-flex;align-items:baseline;gap:5px;margin:12px 0 0 10px;padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--fg);text-decoration:none;font-size:14px;vertical-align:top}
.eq-story b{color:var(--rj-ink,var(--rj,#c8102e))}.eq-story small{color:var(--muted)}
.eq-story:hover,.eq-story:focus-visible{border-color:var(--rj,#c8102e)}
@media (max-width:700px){.eq-story{margin-left:0;display:flex}}`;
document.head.appendChild(st);
})();
