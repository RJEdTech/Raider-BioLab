/* Test yourself for Raider Labs story pages (Nov 21, 2026). Same file on every lab.
   After the story: a few problems in new situations, with no picture first. A wrong answer gets a hint and a
   "Show me in the picture" button that sends the student back to the story step that shows the idea, so the picture
   returns as help. Students can try again; the page remembers whether each one was right on the first try.
   Copy for Canvas puts the results on the clipboard. Nothing leaves the device except anonymous GoatCounter counts
   (path only): story/<lab>/<id>/test-qN-first-right|first-wrong, .../test-show-N, .../test-done-XofN, .../test-copy.

   TestYourself.mount({lab, id, title, el (element or selector), go(stepIndex0), scrollTo (selector),
     questions:[{q, choices:[...], answer:index | answer:number, tol, unit, hint, why, step (1-based story step), stepName}]}) */
(function(){
'use strict';
const mounted=[];
/* Choices are shown in a fixed shuffled order (seeded by page id and question number), so the right answer's position varies
   but every student and every visit sees the same order. Inputs keep the authored index as their value. */
function seeded(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19;}
  return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return (h>>>0)/4294967296;};}
/* The right answer rotates through the positions question by question (starting point set by the page), and the
   wrong answers are shuffled around it, so answer positions spread evenly within a page. */
function order(n,key,ans,i,pageKey){const r=seeded(key),o=[...Array(n).keys()].filter(k=>k!==ans);for(let k=o.length-1;k>0;k--){const j=Math.floor(r()*(k+1));[o[k],o[j]]=[o[j],o[k]];}
  const start=Math.floor(seeded(pageKey)()*n);o.splice((start+i)%n,0,ans);return o;}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function send(path,title){(function go(n){const g=window.goatcounter;if(g&&typeof g.count==='function'){try{g.count({path,title,event:true});}catch(e){}}else if(n<40)setTimeout(()=>go(n+1),250);})(0);}
function mount(cfg){
  mounted.push(cfg);
  const root=typeof cfg.el==='string'?document.querySelector(cfg.el):cfg.el;if(!root)return;
  const Q=cfg.questions,mc=(()=>{let k=0;return Q.map(q=>q.choices?k++:-1);})(),st=Q.map(()=>({first:null,done:false,tries:0,last:''})),base='story/'+cfg.lab+'/'+cfg.id+'/test-';let doneSent=false;
  root.classList.add('ty');
  root.innerHTML=`<h2>Test yourself</h2><p class="ty-lead">${Q.length} new situations, no picture this time. If you get stuck, <b>Show me in the picture</b> takes you back to the step that shows it.</p>
    <ol class="ty-list">${Q.map((q,i)=>`<li class="ty-q" id="ty-q${i}"><fieldset><legend><span class="ty-n">${i+1}.</span> ${q.q}</legend>${q.choices?
      `<div class="ty-ch">${order(q.choices.length,cfg.lab+'/'+cfg.id+'/'+i,q.answer,mc[i],cfg.lab+'/'+cfg.id).map(j=>`<label><input type="radio" name="ty${i}" value="${j}"> <span>${q.choices[j]}</span></label>`).join('')}</div>`:
      `<div class="ty-num"><input type="text" inputmode="decimal" autocomplete="off" aria-label="Your answer${q.unit?' in '+esc(q.unit):''}" id="ty-in${i}">${q.unit?`<span>${q.unit}</span>`:''}</div>`}
      <div class="ty-acts"><button type="button" class="ty-btn ty-pri" data-check="${i}">Check</button></div>
      <div class="ty-fb" id="ty-fb${i}" aria-live="polite"></div></fieldset></li>`).join('')}</ol>
    <div class="ty-sum" id="ty-sum" hidden></div>`;
  function score(){return st.filter(s=>s.first===true).length;}
  function summary(){const all=st.every(s=>s.done),box=root.querySelector('#ty-sum');if(!all){box.hidden=true;return;}
    const n=score();box.hidden=false;
    box.innerHTML=`<p><b>${n} of ${Q.length}</b> right on the first try.${n===Q.length?' You can use this idea in new situations.':' Look again at the steps you needed: that is what to review.'}</p>
      <p><button type="button" class="ty-btn ty-pri" id="ty-copy">Copy my results for Canvas</button> <span class="ty-msg" id="ty-msg" aria-live="polite"></span></p><textarea id="ty-box" hidden readonly aria-label="Your results"></textarea>`;
    if(!doneSent){doneSent=true;send(base+'done-'+n+'of'+Q.length,cfg.title+': test done');}
    root.querySelector('#ty-copy').onclick=()=>{const t=[cfg.title+': Test yourself',n+' of '+Q.length+' right on the first try',''].concat(Q.map((q,i)=>(i+1)+'. '+q.q.replace(/<[^>]+>/g,'')+'\n   My answer: '+st[i].last+(st[i].first?' (right on the first try)':' (right after '+st[i].tries+' tries)'))).join('\n');
      const msg=root.querySelector('#ty-msg'),box2=root.querySelector('#ty-box'),fall=()=>{box2.hidden=false;box2.value=t;box2.focus();box2.select();msg.textContent='Select all of the box and copy it.';};
      send(base+'copy',cfg.title+': test copied');try{navigator.clipboard.writeText(t).then(()=>{msg.textContent='Copied. Paste it into Canvas.';},fall);}catch(e){fall();}};}
  function check(i){const q=Q[i],s=st[i],fb=root.querySelector('#ty-fb'+i);if(s.done)return;let ok,given;
    if(q.choices){const r=root.querySelector(`input[name="ty${i}"]:checked`);if(!r){fb.className='ty-fb no';fb.textContent='Pick one first.';return;}given=+r.value;ok=given===q.answer;s.last=q.choices[given].replace(/<[^>]+>/g,'');}
    else{const raw=root.querySelector('#ty-in'+i).value.replace(/,/g,'').trim(),v=parseFloat(raw);if(!isFinite(v)){fb.className='ty-fb no';fb.textContent='Type a number.';return;}given=v;ok=Math.abs(v-q.answer)<=(q.tol==null?1e-9:q.tol);s.last=raw+(q.unit?' '+q.unit.replace(/<[^>]+>/g,''):'');}
    s.tries++;if(s.first===null){s.first=ok;send(base+'q'+(i+1)+(ok?'-first-right':'-first-wrong'),cfg.title+': test q'+(i+1));}
    if(ok){s.done=true;fb.className='ty-fb ok';fb.innerHTML='<b>Right.</b> '+(q.why||'');root.querySelector(`[data-check="${i}"]`).disabled=true;
      root.querySelectorAll(`#ty-q${i} input`).forEach(x=>x.disabled=true);summary();}
    else{fb.className='ty-fb no';fb.innerHTML='<b>Not yet.</b> '+(typeof q.hint==='function'?q.hint(given):(q.hint||''))+(q.step?` <button type="button" class="ty-btn" data-show="${i}">Show me in the picture: ${q.stepName||'step '+q.step}</button>`:'')+' Then try again.';}}
  root.addEventListener('click',e=>{const c=e.target.closest('[data-check]');if(c){check(+c.dataset.check);return;}
    const sh=e.target.closest('[data-show]');if(sh){const i=+sh.dataset.show;send(base+'show-'+(i+1),cfg.title+': test show me');
      try{cfg.go(Q[i].step-1);}catch(err){}const t=cfg.scrollTo&&document.querySelector(cfg.scrollTo);if(t)t.scrollIntoView({behavior:'smooth',block:'start'});else window.scrollTo({top:0,behavior:'smooth'});
      showBack(i);}});
  root.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.ty-num input')){e.preventDefault();check(+e.target.id.replace('ty-in',''));}});
  /* after "Show me", a small button brings the student back to the question */
  function showBack(i){let b=document.getElementById('ty-back');if(!b){b=document.createElement('button');b.id='ty-back';b.type='button';b.className='ty-btn ty-pri';document.body.appendChild(b);
      b.addEventListener('click',()=>{const q=document.getElementById('ty-q'+b.dataset.i);if(q)q.scrollIntoView({behavior:'smooth',block:'center'});b.hidden=true;});}
    b.dataset.i=i;b.textContent='↓ Back to question '+(i+1);b.hidden=false;}
}
const st=document.createElement('style');st.textContent=
`.ty{max-width:1100px;margin:18px auto;background:var(--card,#fff);border:1px solid var(--line,#d8d8d3);border-radius:12px;padding:16px 20px;color:var(--fg,#1c1c1f);font-family:"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif}
.ty h2{margin:0 0 4px;font-size:21px}.ty-lead{margin:0 0 10px;color:var(--muted,#5d5d63)}
.ty-list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:14px}.ty-q fieldset{border:0;margin:0;padding:0}.ty-n{color:var(--rj-ink,#a8102a);margin-right:2px}.ty-q legend{font-size:17px;font-weight:600;line-height:1.4;padding:0;margin-bottom:6px}
.ty-ch{display:flex;flex-direction:column;gap:5px}.ty-ch label{display:flex;gap:8px;align-items:flex-start;font-size:16px;line-height:1.4;cursor:pointer}.ty-ch input{margin-top:4px}
.ty-num{display:flex;gap:8px;align-items:center;font-size:16px}.ty-num input{width:110px;padding:8px 10px;font-size:17px;border:1px solid var(--line,#ccc);border-radius:8px;background:var(--card2,#fff);color:inherit}
.ty-acts{margin-top:8px}.ty-btn{font:600 15px/1.2 inherit;padding:8px 14px;border-radius:9px;border:1px solid var(--line,#ccc);background:var(--card2,#f3f3f1);color:inherit;cursor:pointer}.ty-btn:disabled{opacity:.5;cursor:default}
.ty-pri{background:#C11430;border-color:#C11430;color:#fff}.ty-fb{margin-top:8px;font-size:16px;line-height:1.5}.ty-fb.ok{color:var(--good,#1b7339)}.ty-fb.no{color:var(--rj-ink,#a8102a)}.ty-fb .ty-btn{margin:4px 0}
.ty-sum{margin-top:14px;border-top:1px solid var(--line,#ddd);padding-top:12px;font-size:16px}.ty-sum p{margin:0 0 8px}.ty-sum textarea{width:100%;min-height:140px}
#ty-back{position:fixed;right:18px;bottom:18px;z-index:50;box-shadow:0 4px 14px rgba(0,0,0,.25)}
html.sh-easy .ty :is(legend,label,p,.ty-fb),body.st-easy .ty :is(legend,label,p,.ty-fb){line-height:1.75;letter-spacing:.035em;word-spacing:.14em}`;
document.head.appendChild(st);
window.TestYourself={mount,mounted,order};
})();
