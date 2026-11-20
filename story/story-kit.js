/* Raider BioLab story kit (pilot, Nov 2026).
   One page = one story: a question, a chain of chapters that each change the picture, and a last chapter
   where the student puts the story back in order and tells it in their own words.
   A page calls Story.start({...}). See respiration.js for a full example.

   Chapter fields (all optional except title):
     rail      short name for the story strip
     title     heading
     text      caption, a string or S => string (about 40 words; the picture carries the rest)
     alt       a second way to say it, shown by "Show me another way"
     predict   {key, q, opts:[...], right:index, after: string or i => string, grade:true|false}
     ui        [{type:'range',key,min,max,step,val,label,fmt,stops:[{v,l}]},
                {type:'seg',key,val,label,opts:[{v,l}]}, {type:'button',label,act(S),ghost,show(S)}]
     todo      [{t:'what to do', ok:S=>bool}]   Next unlocks when every one has happened once
     strip     {terms:[{k,html,note}], ops:[...]} a clickable equation under the picture; S.v.term holds the pick
     enter(S)  runs when the chapter opens;  tick(S,dt) every frame;  draw(ctx,S) every frame
     tell      true for the tell-it-back chapter (uses cfg.tell)
   S: {i, tau, t, dt, v:{control values}, picks:{}, did:{}, mouse:{x,y,in}, teach} */
(function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const FONT='"Segoe UI",system-ui,-apple-system,Roboto,"Helvetica Neue",Arial,sans-serif';
function rr(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function txt(ctx,s,x,y,o){o=o||{};ctx.font=(o.i?'italic ':'')+(o.w||500)+' '+(o.s||14)+'px '+FONT;ctx.textAlign=o.a||'left';ctx.textBaseline=o.b||'alphabetic';
  if(o.halo){ctx.lineWidth=o.halo;ctx.strokeStyle=o.hc||'rgba(255,255,255,.92)';ctx.lineJoin='round';ctx.strokeText(s,x,y);}
  ctx.fillStyle=o.c||'#26262b';ctx.fillText(s,x,y);return ctx.measureText(s).width;}
function pill(ctx,s,x,y,o){o=o||{};const fs=o.s||13;ctx.font=(o.w||600)+' '+fs+'px '+FONT;const w=ctx.measureText(s).width+fs*1.3,h=fs*1.85;
  const x0=o.a==='left'?x:o.a==='right'?x-w:x-w/2;rr(ctx,x0,y-h/2,w,h,o.r==null?h/2:o.r);ctx.fillStyle=o.bg||'#fff';ctx.fill();
  if(o.bd!==null){ctx.lineWidth=o.lw||1.5;ctx.strokeStyle=o.bd||'#26262b';ctx.stroke();}
  ctx.fillStyle=o.c||'#26262b';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,x0+w/2,y+0.5);return w;}
function ring(ctx,x,y,r,t,c){const k=0.5+0.5*Math.sin(t*4.2);ctx.save();ctx.strokeStyle=c||'#C11430';ctx.lineWidth=3.5;ctx.globalAlpha=0.5+0.5*k;ctx.beginPath();ctx.arc(x,y,r+4*k,0,6.2832);ctx.stroke();ctx.restore();}
function boxring(ctx,x,y,w,h,t,c){const k=0.5+0.5*Math.sin(t*4.2);ctx.save();ctx.strokeStyle=c||'#C11430';ctx.lineWidth=3.5;ctx.globalAlpha=0.5+0.5*k;rr(ctx,x-2*k,y-2*k,w+4*k,h+4*k,12);ctx.stroke();ctx.restore();}
function arrow(ctx,x1,y1,x2,y2,o){o=o||{};const a=Math.atan2(y2-y1,x2-x1),hd=o.head||9;ctx.save();ctx.strokeStyle=ctx.fillStyle=o.c||'#26262b';ctx.lineWidth=o.lw||2;ctx.lineCap='round';
  if(o.dash)ctx.setLineDash(o.dash);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*hd*.6,y2-Math.sin(a)*hd*.6);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-Math.cos(a-.42)*hd,y2-Math.sin(a-.42)*hd);ctx.lineTo(x2-Math.cos(a+.42)*hd,y2-Math.sin(a+.42)*hd);ctx.closePath();ctx.fill();ctx.restore();}
function hash(n){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
function el(tag,attrs,html){const e=document.createElement(tag);if(attrs)for(const k in attrs){if(k==='class')e.className=attrs[k];else e.setAttribute(k,attrs[k]);}if(html!=null)e.innerHTML=html;return e;}
function count(path,title){(function go(n){const g=window.goatcounter;if(g&&typeof g.count==='function'){try{g.count({path,title,event:true});}catch(e){}}else if(n<20)setTimeout(()=>go(n+1),400);})(0);}
const plain=h=>{const d=document.createElement('div');d.innerHTML=h;return (d.textContent||'').replace(/\s+/g,' ').trim();};

const Story={h:{clamp,lerp,ease,rr,txt,pill,ring,boxring,arrow,hash,FONT},LS};

Story.start=function(cfg){
  const W=cfg.W||1200,H=cfg.H||540,CH=cfg.chapters,N=CH.length;
  const q=new URLSearchParams(location.search);
  const S={i:0,tau:0,t:0,dt:0,v:{},picks:{},did:{},mouse:{x:-1,y:-1,in:false},teach:q.get('teacher')==='1',paused:false,W,H,cfg};
  Story.S=S;
  const seen=new Set([0]);let unlockAt=0,speakOn=false,altOpen=false;
  document.documentElement.style.setProperty('--st-aspect',(W/H).toFixed(4));

  /* ---------- page skeleton ---------- */
  const root=document.getElementById('story');
  root.innerHTML='<div class="st-top"><h2></h2><span class="st-stagebtns"><button type="button" class="b-pause">Pause</button><button type="button" class="b-replay">Replay this step</button></span><a></a></div><ol class="st-rail"></ol>'+
    '<div class="st-main"><div class="st-left"><div class="st-stagebox"><canvas aria-label="The picture for this step. The caption beside it says what it shows."></canvas><div class="st-board" hidden></div></div>'+
    '<div class="st-strip" hidden></div><p class="st-stripnote" hidden></p></div>'+
    '<section class="st-cap"><p class="st-step"></p><h3></h3><div class="st-text" aria-live="polite"></div><div class="st-predbox"></div><div class="st-ui"></div><ul class="st-todo"></ul>'+
    '<div class="st-nav"><button type="button" class="back">Back</button><button type="button" class="next">Next</button></div><p class="wait"></p>'+
    '<button type="button" class="st-altbtn" hidden>Confused? Show me another way</button><div class="st-alt" hidden></div></section></div>'+
    '<div class="st-foot"></div>';
  const $=s=>root.querySelector(s);
  $('.st-top h2').textContent=cfg.title;
  const back=$('.st-top a');back.href=cfg.labHref;back.textContent='Open the full lab →';
  const cv=$('canvas'),ctx=cv.getContext('2d'),board=$('.st-board'),stripEl=$('.st-strip'),stripNote=$('.st-stripnote');
  const uiEl=$('.st-ui'),todoEl=$('.st-todo'),textEl=$('.st-text'),predEl=$('.st-predbox'),altBtn=$('.st-altbtn'),altEl=$('.st-alt');
  const nextB=$('.next'),backB=$('.back'),waitEl=$('.wait');
  $('.st-foot').innerHTML=(cfg.about?'<details><summary>About this picture: what is real and what is simplified</summary>'+cfg.about+'</details>':'')+
    '<p>Runs in your browser. No login, and nothing you type leaves this computer unless you copy it yourself. © 2026 Jason Beyer, RJ Ed Tech · <a href="https://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC 4.0</a></p>';

  const rail=$('.st-rail');
  CH.forEach((c,k)=>{const li=el('li'),b=el('button',{type:'button',title:c.title},'<b>'+(k+1)+'</b><span>'+(c.rail||c.title)+'</span>');
    b.addEventListener('click',()=>{if(S.teach||seen.has(k))go(k);});li.appendChild(b);rail.appendChild(li);});

  /* header tools */
  const tools=document.querySelector('.st-tools');
  function tool(label,fn,pressed){const b=el('button',{type:'button','aria-pressed':pressed?'true':'false'},label);b.addEventListener('click',()=>{const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);fn(on);});tools.appendChild(b);return b;}
  tool('🔊 Read aloud',on=>{speakOn=on;if(on)say();else if(window.speechSynthesis)speechSynthesis.cancel();});
  tool('Aa Easier reading',on=>{document.body.classList.toggle('st-easy',on);LS.set('raider-story-easy',on);},LS.get('raider-story-easy',false));
  document.body.classList.toggle('st-easy',LS.get('raider-story-easy',false));
  tool('Teacher view',on=>{S.teach=on;document.body.classList.toggle('st-teach',on);fit();render();},S.teach);
  document.body.classList.toggle('st-teach',S.teach);

  function say(){if(!speakOn||!window.speechSynthesis)return;const c=CH[S.i];let s=c.title+'. '+plain(textEl.innerHTML);
    if(c.predict&&S.picks[c.predict.key]==null)s+=' '+c.predict.q+' '+c.predict.opts.map((o,k)=>'Choice '+(k+1)+': '+plain(o)).join('. ');
    speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(s),vs=speechSynthesis.getVoices();
    const v=vs.find(v=>/Natural/.test(v.name)&&/^en-US/.test(v.lang))||vs.find(v=>/^en-US/.test(v.lang));if(v)u.voice=v;u.rate=.95;speechSynthesis.speak(u);}

  /* ---------- canvas sizing and pointer ---------- */
  function fit(){const r=cv.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2.5),w=Math.max(320,Math.round(r.width*d));
    if(cv.width!==w){cv.width=w;cv.height=Math.round(w*H/W);}}
  new ResizeObserver(fit).observe(cv);window.addEventListener('resize',fit);
  function pt(e){const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
  cv.addEventListener('pointermove',e=>{const p=pt(e);S.mouse.x=p.x;S.mouse.y=p.y;S.mouse.in=true;});
  cv.addEventListener('pointerleave',()=>{S.mouse.in=false;});
  cv.addEventListener('pointerdown',e=>{const p=pt(e),c=CH[S.i];if(c.click)c.click(S,p.x,p.y);});

  /* ---------- chapter rendering ---------- */
  function gated(){const c=CH[S.i];if(S.teach)return false;
    if(c.predict&&S.picks[c.predict.key]==null)return true;
    if(c.todo&&c.todo.some((t,k)=>!S.did[S.i+':'+k]))return true;
    if(c.tell&&!S.did.tell)return true;return false;}
  function setNext(){const g=gated(),late=g&&S.tau>unlockAt;nextB.setAttribute('aria-disabled',g&&!late?'true':'false');
    const c=CH[S.i];nextB.textContent=S.i===N-1?(cfg.endLabel||'Open the full lab'):late?'Skip this step':(c.next||'Next');
    waitEl.textContent=g&&!late?(c.predict&&S.picks[c.predict.key]==null?'Pick an answer first.':c.tell?'':'Do the steps above first.'):'';}
  function buildUI(c){uiEl.innerHTML='';(c.ui||[]).forEach(u=>{
      if(u.val!==undefined&&S.v[u.key]===undefined)S.v[u.key]=u.val;
      if(u.type==='range'){const w=el('div'),id='st-r-'+u.key;const fmt=u.fmt||(v=>v);
        w.innerHTML='<div class="ctl-l"><label for="'+id+'">'+u.label+'</label><output></output></div><input type="range" id="'+id+'" min="'+u.min+'" max="'+u.max+'" step="'+(u.step||1)+'">'+(u.stops?'<div class="st-stops"></div>':'');
        const inp=w.querySelector('input'),out=w.querySelector('output');inp.value=S.v[u.key];out.textContent=fmt(+inp.value);
        const set=v=>{S.v[u.key]=+v;inp.value=v;out.textContent=fmt(+v);if(u.on)u.on(S,+v);};
        inp.addEventListener('input',()=>set(inp.value));
        if(u.stops)u.stops.forEach(s=>{const b=el('button',{type:'button'},s.l);b.addEventListener('click',()=>set(s.v));w.querySelector('.st-stops').appendChild(b);});
        u._sync=()=>{if(+inp.value!==S.v[u.key]){inp.value=S.v[u.key];out.textContent=fmt(S.v[u.key]);}};u._el=w;uiEl.appendChild(w);}
      else if(u.type==='seg'){const w=el('div'),g=el('div',{class:'st-seg',role:'group','aria-label':u.label});w.innerHTML='<div class="ctl-l"><span>'+u.label+'</span></div>';
        u.opts.forEach(o=>{const b=el('button',{type:'button','aria-pressed':S.v[u.key]===o.v},o.l);b.addEventListener('click',()=>{S.v[u.key]=o.v;[...g.children].forEach(x=>x.setAttribute('aria-pressed',x===b));if(u.on)u.on(S,o.v);});g.appendChild(b);});
        w.appendChild(g);u._el=w;u._sync=()=>{[...g.children].forEach((x,i)=>{const on=String(S.v[u.key]===u.opts[i].v);if(x.getAttribute('aria-pressed')!==on)x.setAttribute('aria-pressed',on);});};uiEl.appendChild(w);}
      else if(u.type==='button'){const b=el('button',{type:'button',class:'st-do'+(u.ghost?' ghost':'')+(u.pulse?' pulse':'')},u.label);
        b.addEventListener('click',()=>{b.classList.remove('pulse');u.act(S);});u._el=b;uiEl.appendChild(b);}
    });}
  function buildPredict(c){predEl.innerHTML='';const p=c.predict;if(!p)return;const picked=S.picks[p.key];
    if(picked!=null){ // once chosen, the prediction shrinks to one line so the picture's controls stay on screen
      const shown=p.reveal?!!p.reveal(S):!!p.grade,ok=picked===p.right;
      const line=el('p',{class:'st-mypick'+(shown?(ok?' ok':' no'):'')},'<b>Your prediction:</b> '+p.opts[picked]+(shown?(ok?' <b>✓ You were right.</b>':' <b>✗ Not this time.</b> It was: '+p.opts[p.right]+'.'):''));
      predEl.appendChild(line);predEl.dataset.shown=shown?'1':'0';
      const a=typeof p.after==='function'?p.after(picked,S):p.after;if(a&&!shown)predEl.appendChild(el('p',{class:'st-predmsg'},a));return;}
    const box=el('div',{class:'st-pred',role:'group','aria-label':p.q});
    p.opts.forEach((o,k)=>{const b=el('button',{type:'button'},'<i>'+'ABCD'[k]+'</i><span>'+o+'</span>');
      b.addEventListener('click',()=>{S.picks[p.key]=k;render();if(c.picked)c.picked(S,k);say();});box.appendChild(b);});
    predEl.appendChild(box);}
  function buildStrip(c){const st=c.strip;stripEl.hidden=stripNote.hidden=!st;document.body.classList.toggle('st-hasstrip',!!st);stripEl.innerHTML='';stripNote.textContent='';if(!st)return;S.v.term=null;S.v.termsHit={};
    st.terms.forEach((t,k)=>{if(k>0)stripEl.appendChild(el('span',{class:'op'},st.ops[k-1]));
      const b=el('button',{type:'button','aria-pressed':'false'},t.html);
      b.addEventListener('click',()=>{S.v.term=t.k;S.v.termsHit[t.k]=1;S.v.termT=S.t;[...stripEl.querySelectorAll('button')].forEach(x=>x.setAttribute('aria-pressed',x===b));b.classList.add('hit');stripNote.innerHTML=t.note;});
      stripEl.appendChild(b);});
    stripNote.innerHTML=st.hint||'';}
  function render(){const c=CH[S.i];
    $('.st-step').textContent='Step '+(S.i+1)+' of '+N;$('.st-cap h3').textContent=c.title;
    textEl.innerHTML=(c.predict&&S.picks[c.predict.key]==null?'<p><b>'+c.predict.q+'</b></p>':'')+(typeof c.text==='function'?c.text(S):(c.text||''));
    buildPredict(c);
    altOpen=false;altEl.hidden=true;altBtn.hidden=!c.alt;altEl.innerHTML=c.alt||'';
    [...rail.querySelectorAll('button')].forEach((b,k)=>{b.classList.toggle('on',k===S.i);b.classList.toggle('seen',seen.has(k)||S.teach);b.setAttribute('aria-current',k===S.i?'step':'false');});
    backB.disabled=S.i===0;backB.style.visibility=S.i===0?'hidden':'';
    todoEl.innerHTML='';(c.todo||[]).forEach(t=>todoEl.appendChild(el('li',null,t.t)));
    const tell=!!c.tell;cv.hidden=tell;$('.st-stagebtns').hidden=tell;board.hidden=!tell;document.body.classList.toggle('st-tell',tell);if(tell)buildTell();
    setNext();}
  altBtn.addEventListener('click',()=>{altOpen=!altOpen;altEl.hidden=!altOpen;if(altOpen)count('story/'+cfg.id+'/another/'+(S.i+1),'Story: another way');});
  function go(k){if(k<0||k>=N)return;const c0=CH[S.i];if(c0&&c0.leave)c0.leave(S);S.i=k;S.tau=0;seen.add(k);unlockAt=CH[k].tell?1e9:(CH[k].patience||40);
    const c=CH[k];buildUI(c);buildStrip(c);if(c.enter)c.enter(S);render();say();
    if(k===N-1)count('story/'+cfg.id+'/last-step','Story: reached the last step');}
  Story.go=go;
  nextB.addEventListener('click',()=>{if(nextB.getAttribute('aria-disabled')==='true')return;if(S.i===N-1){location.href=cfg.labHref;return;}go(S.i+1);});
  backB.addEventListener('click',()=>go(S.i-1));
  $('.b-pause').addEventListener('click',e=>{S.paused=!S.paused;e.target.textContent=S.paused?'Play':'Pause';});
  $('.b-replay').addEventListener('click',()=>{const c=CH[S.i];S.tau=0;if(c.enter)c.enter(S);});
  document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    if(e.key==='ArrowRight'&&(S.teach||!gated()))go(S.i+1);else if(e.key==='ArrowLeft')go(S.i-1);});

  /* ---------- tell it back ---------- */
  const T=cfg.tell,TK='raider-story-'+cfg.id;let order,tries=0,dragK=null;
  function okOrder(o){const ok=a=>a.every((v,k)=>v===k);if(ok(o))return true;
    return (T.swaps||[]).some(([a,b])=>{const c=o.slice();const ia=c.indexOf(a),ib=c.indexOf(b);c[ia]=b;c[ib]=a;return ok(c);});}
  function buildTell(){const saved=LS.get(TK,{});
    if(!order){order=T.frames.map((f,k)=>k);if(S.did.tell||saved.done){S.did.tell=true;}else{let s=7;do{for(let k=order.length-1;k>0;k--){const j=Math.floor(hash(s++)*(k+1));[order[k],order[j]]=[order[j],order[k]];}}while(okOrder(order)||order[0]===0);}}
    const locked=!!S.did.tell;
    board.innerHTML='<h4>'+(locked?'The story, in order':'Put the six pictures in the order the story happens. Drag a picture, or use the arrows.')+'</h4><div class="st-frames'+(locked?' locked':'')+'"></div><p class="st-boardmsg" aria-live="polite"></p>';
    const fr=board.querySelector('.st-frames'),msg=board.querySelector('.st-boardmsg');
    order.forEach((fi,pos)=>{const f=T.frames[fi],card=el('div',{class:'st-frame',draggable:locked?'false':'true'});
      const c=el('canvas',{width:360,height:232,role:'img','aria-label':f.label});card.appendChild(c);
      if(locked)card.appendChild(el('div',{class:'num'},String(pos+1)));
      card.appendChild(el('div',{class:'cap'},f.label));
      const mv=el('div',{class:'mv'}),L=el('button',{type:'button','aria-label':'Move earlier'},'◀'),R=el('button',{type:'button','aria-label':'Move later'},'▶');
      L.disabled=pos===0;R.disabled=pos===order.length-1;
      L.addEventListener('click',()=>swap(pos,pos-1));R.addEventListener('click',()=>swap(pos,pos+1));mv.append(L,R);card.appendChild(mv);
      card.addEventListener('dragstart',e=>{dragK=pos;card.classList.add('drag');try{e.dataTransfer.setData('text/plain',String(pos));e.dataTransfer.effectAllowed='move';}catch(_){}});
      card.addEventListener('dragend',()=>{card.classList.remove('drag');dragK=null;});
      card.addEventListener('dragover',e=>{if(dragK==null||locked)return;e.preventDefault();card.classList.add('over');});
      card.addEventListener('dragleave',()=>card.classList.remove('over'));
      card.addEventListener('drop',e=>{e.preventDefault();card.classList.remove('over');if(dragK==null||dragK===pos||locked)return;const m=order.splice(dragK,1)[0];order.splice(pos,0,m);dragK=null;buildTell();});
      fr.appendChild(card);
      const x=c.getContext('2d');x.save();x.scale(360/300,232/193.3);try{f.draw(x,300,193.3);}catch(err){console.error(err);}x.restore();});
    function swap(a,b){if(b<0||b>=order.length)return;[order[a],order[b]]=[order[b],order[a]];buildTell();}
    if(!locked){const chk=el('button',{type:'button',class:'st-do'},'Check my order');chk.style.marginTop='10px';
      chk.addEventListener('click',()=>{tries++;if(okOrder(order)){S.did.tell=true;if(!order.every((v,k)=>v===k))order=order.slice();buildTell();count('story/'+cfg.id+'/ordered/'+tries,'Story: order correct');setNext();return;}
        let good=0;[...fr.children].forEach((card,pos)=>{const ok=order[pos]===pos;card.classList.toggle('good',ok);card.classList.toggle('off',!ok);if(ok)good++;});
        msg.innerHTML='<b>'+good+' of '+order.length+' are in the right spot</b> (green). '+(T.nudge||'For each picture ask: what had to happen just before this?');
        if(tries>=3&&!board.querySelector('.showme')){const sm=el('button',{type:'button',class:'st-do ghost showme'},'Show me the order');sm.style.margin='10px 0 0 8px';sm.addEventListener('click',()=>{order=T.frames.map((f,k)=>k);S.did.tell=true;buildTell();setNext();});chk.after(sm);}});
      board.appendChild(chk);}
    else{msg.innerHTML=T.done||'That is the story. Now tell it in your own words.';
      const w=el('div',{class:'st-write'});w.innerHTML='<div><label for="st-ta" style="font-weight:700;font-size:15.5px">'+T.prompt+'</label><textarea id="st-ta" placeholder="'+(T.placeholder||'First… because… so…')+'"></textarea><div style="display:flex;gap:10px;align-items:center;margin-top:6px"><button type="button" class="st-do">Copy my story for Canvas</button><span class="copied" style="font-size:14.5px;color:var(--good);font-weight:600"></span></div></div><div class="st-terms"><p>Words to use. Each one lights up when it is in your story.</p></div>';
      board.appendChild(w);const ta=w.querySelector('textarea'),terms=w.querySelector('.st-terms');ta.value=saved.text||'';
      T.terms.forEach(t=>{const sp=el('span',null,t.split('|')[0]);sp.dataset.t=t;terms.appendChild(sp);});
      const mark=()=>{const low=ta.value.toLowerCase();[...terms.querySelectorAll('span')].forEach(sp=>sp.classList.toggle('used',sp.dataset.t.toLowerCase().split('|').some(a=>low.includes(a))));LS.set(TK,{done:true,text:ta.value});};
      ta.addEventListener('input',mark);mark();
      w.querySelector('.st-do').addEventListener('click',()=>{const out=cfg.title+'\n'+order.map((fi,k)=>(k+1)+'. '+T.frames[fi].label).join('\n')+'\n\nMy story: '+(ta.value.trim()||'(not written yet)')+'\n';
        const done=()=>{w.querySelector('.copied').textContent='Copied. Paste it into Canvas.';count('story/'+cfg.id+'/copied','Story: copied for Canvas');};
        if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(out).then(done,()=>fallback(out,done));else fallback(out,done);});
    }}
  function fallback(s,done){const t=el('textarea');t.value=s;document.body.appendChild(t);t.select();try{document.execCommand('copy');done();}catch(e){}t.remove();}

  /* ---------- loop ---------- */
  let last=performance.now();
  function frame(now){const raw=Math.min(.05,(now-last)/1000);last=now;const dt=S.paused?0:raw;S.dt=dt;S.t+=dt;S.tau+=dt;const c=CH[S.i];
    if(c.tick&&dt>0)c.tick(S,dt);
    if(!c.tell){ctx.setTransform(cv.width/W,0,0,cv.width/W,0,0);ctx.clearRect(0,0,W,H);ctx.save();try{c.draw(ctx,S);}catch(err){if(!frame.err){frame.err=1;console.error(err);}}ctx.restore();}
    // latch finished to-dos, refresh the checklist and the Next button
    if(c.todo){let firstOpen=-1;c.todo.forEach((t,k)=>{const key=S.i+':'+k;if(!S.did[key]&&(firstOpen<0)&&t.ok(S))S.did[key]=true;if(!S.did[key]&&firstOpen<0)firstOpen=k;
        const li=todoEl.children[k];if(li){li.classList.toggle('ok',!!S.did[key]);li.classList.toggle('now',firstOpen===k);}});todoEl.classList.toggle('alldone',firstOpen<0);}
    (c.ui||[]).forEach(u=>{if(u._sync)u._sync();if(u.show&&u._el)u._el.hidden=!u.show(S);});
    if(typeof c.text==='function'&&c.live){const h=c.text(S);if(h!==frame.h){frame.h=h;textEl.innerHTML=h;}}
    if(c.predict&&c.predict.reveal&&S.picks[c.predict.key]!=null&&predEl.dataset.shown==='0'&&c.predict.reveal(S))buildPredict(c);
    setNext();requestAnimationFrame(frame);}
  fit();go(Math.min(N-1,Math.max(0,(parseInt(q.get('step'),10)||1)-1)));requestAnimationFrame(frame);
};
window.Story=Story;
})();
