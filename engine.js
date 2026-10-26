/* Raider BioLab engine — shared lab bench for every simulation.
   Sims register with BioLab.register(def); see ENGINE.md for the def interface. */
(function(){
'use strict';
const BL={};window.BioLab=BL;
const LV={bio:0,honors:1,ap:2};
let UNITS={1:'Chemistry of life',2:'Cell structure and function',3:'Cellular energetics',4:'Cell communication and cell cycle',5:'Heredity',6:'Gene expression and regulation',7:'Natural selection',8:'Ecology'};
let XSEC={0:'Science skills and data',9:'Human body systems',10:'Biotechnology lab',12:'Earth systems and climate',13:'Energy, land and resources',14:'Pollution and human health',11:'Go further'};
let SECTIONS=[0,1,2,3,4,5,6,7,8,9,10,12,13,14,11];
const secName=u=>UNITS[u]||XSEC[u]||'';
const secLabel=u=>UNITS[u]?(UNIT_PREFIX?UNIT_PREFIX+' '+u+' · ':'')+UNITS[u]:secName(u);
BL.UNITS=UNITS;BL.XSEC=XSEC;
/* Another site can reuse the engine with its own sections: BioLab.setSections({units:{1:'Kinematics',...}, extra:{0:'Science skills',...}, order:[0,1,2,...], further:13, unitPrefix:'Unit'}) */
let FURTHER=11,UNIT_PREFIX='Unit';
BL.setSections=function(o){if(o.units)UNITS=o.units;if(o.extra)XSEC=o.extra;if(o.order)SECTIONS=o.order;if(o.further!==undefined)FURTHER=o.further;if(o.unitPrefix!==undefined)UNIT_PREFIX=o.unitPrefix;BL.UNITS=UNITS;BL.XSEC=XSEC;};
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const LAB_META=n=>{const m=document.querySelector('meta[name="'+n+'"]');return m?m.content:null;};const LAB_NAME=LAB_META('lab-name')||'Raider BioLab',LAB_KEY=LAB_META('lab-key')||'rjbiolab';
let level=store.get(LAB_KEY+'-level');if(!(level in LV))level='bio';
/* Embedding (e.g. in a Canvas page): ?embed=1 hides the site chrome; ?mode=guided|game|lab|vlab picks the starting view (&lab=<id> picks the virtual lab);
   ?level=bio|honors|ap picks the starting detail level for this visit only. */
const QS=(()=>{try{return new URLSearchParams(location.search);}catch(e){return new URLSearchParams('');}})();
const EMBED=QS.has('embed'),QMODE=QS.get('mode'),QLVL=QS.get('level'),QLAB=QS.get('lab');
const MODES=['guided','game','lab','vlab'];
if(QLVL&&(QLVL in LV))level=QLVL;
BL.embed=EMBED;
const atLeast=l=>LV[level]>=LV[l||'bio'];
const clamp=(x,a,b)=>x<a?a:x>b?b:x;
const lerp=(a,b,t)=>a+(b-a)*t;
const FONT='"Segoe UI",system-ui,-apple-system,Roboto,"Helvetica Neue",Arial,sans-serif';
const RM=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function randn(r){r=r||Math.random;let u=0,v=0;while(u===0)u=r();while(v===0)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function binom(n,p,r){r=r||Math.random;if(n<60){let k=0;for(let i=0;i<n;i++)if(r()<p)k++;return k;}const m=n*p,s=Math.sqrt(n*p*(1-p));return clamp(Math.round(m+s*randn(r)),0,n);}
const PAL={};
const PAL_KEYS=['cv-bg','cv-bg2','cv-ims','cv-matrix','cv-head','cv-tail','cv-ink','cv-soft','cv-h','cv-e','cv-estroke','cv-atp','cv-dnp','cv-sol','cv-enz','cv-enzd','cv-sub','cv-prod','cv-inc','cv-inn','cv-water','cv-glass','cv-leaf','cv-leaf2','cv-bubble','cv-bstroke','cv-bench','cv-lamp','cv-ruler','g-line','g-fill','g-grid','g-axis','g-dot','s1','s2','s3','s4','s5','s6','card','card2','line','fg','muted','bg','rj'];
function readPal(){const cs=getComputedStyle(document.documentElement);PAL_KEYS.forEach(k=>{PAL[k]=cs.getPropertyValue('--'+k).trim()||'#888';});}
function rr(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function txt(ctx,s,x,y,o){o=o||{};ctx.font=(o.w||400)+' '+(o.s||13)+'px '+FONT;ctx.fillStyle=o.c||PAL['cv-ink'];ctx.textAlign=o.a||'left';ctx.textBaseline=o.b||'alphabetic';ctx.fillText(s,x,y);}
function pill(ctx,s,x,y,bg,fg,size){size=size||12;ctx.font='700 '+size+'px '+FONT;const w=ctx.measureText(s).width+size*1.1,h=size*1.7;rr(ctx,x-w/2,y-h/2,w,h,h/2);ctx.fillStyle=bg;ctx.fill();txt(ctx,s,x,y+1,{s:size,w:700,c:fg,a:'center',b:'middle'});}
function polyline(pts){const segs=[];let L=0;for(let i=1;i<pts.length;i++){const dx=pts[i][0]-pts[i-1][0],dy=pts[i][1]-pts[i-1][1],l=Math.hypot(dx,dy);segs.push({a:pts[i-1],dx,dy,l,s:L});L+=l;}
  return {L,at(d){for(const g of segs){if(d<=g.s+g.l){const t=(d-g.s)/g.l;return [g.a[0]+g.dx*t,g.a[1]+g.dy*t];}}const p=pts[pts.length-1];return [p[0],p[1]];}};}
function niceStep(range,n){const raw=range/(n||5);const p=Math.pow(10,Math.floor(Math.log10(raw)));const m=raw/p;return (m<1.5?1:m<3?2:m<7?5:10)*p;}
function fmtNum(v,d){if(v===null||v===undefined||(typeof v==='number'&&Number.isNaN(v)))return '—';if(typeof v==='string')return v;return Number(v).toFixed(d||0);}
const SER=['g-line','s2','s3','s4','s5','s6'];
function serColor(i){return PAL[SER[i%SER.length]];}
/* Draw axes, grid and labels inside a graph box. Returns {X,Y} mappers.
   o: {xmin,xmax,ymin,ymax,xl,yl,xcats:[labels] (category axis), xticks:false, yd, xd} */
function axes(ctx,box,o){const L=box.L,T=box.T,pw=box.W,ph=box.H;let xmin=o.xmin,xmax=o.xmax,ymin=o.ymin,ymax=o.ymax;
  if(!(ymax-ymin>1e-9))ymax=ymin+1;if(!(xmax-xmin>1e-9))xmax=xmin+1;
  const X=x=>L+(x-xmin)/(xmax-xmin)*pw,Y=y=>T+ph-(y-ymin)/(ymax-ymin)*ph;
  ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;
  const ys=niceStep(ymax-ymin,4),y0=Math.ceil(ymin/ys-1e-9)*ys,yd=o.yd!==undefined?o.yd:(ys<1?(ys<0.1?(ys<0.01?3:2):1):0);
  for(let y=y0;y<=ymax+1e-9;y+=ys){const py=Math.round(Y(y))+.5;ctx.beginPath();ctx.moveTo(L,py);ctx.lineTo(L+pw,py);ctx.stroke();txt(ctx,(Math.abs(y)<1e-12?0:y).toFixed(yd),L-8,py,{s:13,c:PAL['g-axis'],a:'right',b:'middle'});}
  if(o.xcats){o.xcats.forEach((c,i)=>txt(ctx,c,X(i+.5),T+ph+16,{s:13,c:PAL['g-axis'],a:'center'}));}
  else if(o.xticks!==false){const xs=niceStep(xmax-xmin,6),x0=Math.ceil(xmin/xs-1e-9)*xs,xd=o.xd!==undefined?o.xd:(xs<1?(xs<0.1?2:1):0);
    for(let x=x0;x<=xmax+1e-9;x+=xs){const px=Math.round(X(x))+.5;ctx.beginPath();ctx.moveTo(px,T);ctx.lineTo(px,T+ph);ctx.stroke();txt(ctx,(Math.abs(x)<1e-12?0:x).toFixed(xd),px,T+ph+16,{s:13,c:PAL['g-axis'],a:'center'});}}
  if(ymin<0&&ymax>0){ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(L,Y(0));ctx.lineTo(L+pw,Y(0));ctx.stroke();}
  ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(L+.5,T);ctx.lineTo(L+.5,T+ph);ctx.lineTo(L+pw,T+ph+.5);ctx.stroke();
  if(o.xl)txt(ctx,o.xl,L+pw/2,box.ch-4,{s:13,c:PAL['muted'],a:'center'});
  if(o.yl){ctx.save();ctx.translate(14,T+ph/2);ctx.rotate(-Math.PI/2);txt(ctx,o.yl,0,0,{s:13,c:PAL['muted'],a:'center',b:'middle'});ctx.restore();}
  return {X,Y,xmin,xmax,ymin,ymax};}
/* Category bars: values[i] drawn in slot i. opts: {colors:[], width:.6, labels:true, d} */
function bars(ctx,ax,values,opts){opts=opts||{};const w=opts.width||.6;values.forEach((v,i)=>{if(!Number.isFinite(v))return;const x0=ax.X(i+.5-w/2),x1=ax.X(i+.5+w/2),y0=ax.Y(Math.max(ax.ymin,0)),y1=ax.Y(v);
  ctx.fillStyle=(opts.colors&&opts.colors[i%opts.colors.length])||serColor(0);ctx.fillRect(x0,Math.min(y0,y1),x1-x0,Math.abs(y0-y1));
  if(opts.labels!==false)txt(ctx,fmtNum(v,opts.d||0),(x0+x1)/2,Math.min(y0,y1)-5,{s:12,c:PAL['fg'],a:'center',w:600});});}
/* Legend drawn in a row starting at x,y. items: [{label,color,dash}] */
function legend(ctx,x,y,items){ctx.font='13px '+FONT;items.forEach(it=>{ctx.strokeStyle=it.color;ctx.lineWidth=3;ctx.setLineDash(it.dash?[5,4]:[]);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+18,y);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,it.label,x+24,y,{s:13,c:PAL['muted'],b:'middle'});x+=ctx.measureText(it.label).width+48;});}
BL.h={clamp,lerp,rng,randn,binom,rr,txt,pill,polyline,niceStep,fmtNum,atLeast,PAL,FONT,RM,axes,bars,legend,serColor,get level(){return level;}};
Object.defineProperty(BL,'level',{get:()=>level});

/* ---------------- registry ---------------- */
const DEFS=[];BL.defs=DEFS;
BL.register=function(def){if(!def||!def.id)return;DEFS.push(def);};
/* Practical layer (practical*.js): a real situation to start from, where the idea shows up, a rule of thumb to keep,
   and plainer Big picture wording for the lede and walkthrough. Merged into the tool definitions at start. */
const PRACT={};BL.addPractical=o=>{Object.assign(PRACT,o||{});};
const bioOver=(t,n)=>!n?t:(t&&typeof t==='object')?Object.assign({},t,{bio:n}):(t?{bio:n,honors:t}:n);
function applyPractical(d){const P=PRACT[d.id];if(!P)return;d.practical=P;
  if(P.lede)d.lede=bioOver(d.lede,P.lede);if(P.card)d.card=P.card;
  if(P.tour&&d.tour){let k=0;d.tour.forEach(st=>{if(st.lvl&&st.lvl!=='bio')return;const n=P.tour[k++];if(n&&typeof n==='object'){if(n.text)st.text=bioOver(st.text,n.text);if(n.title)st.title=bioOver(st.title,n.title);}else if(n)st.text=bioOver(st.text,n);});}
  if(P.hook&&d.tour&&d.tour.length){const h={title:P.hookTitle||'The question',text:P.hook,pause:true,hook:true};
    /* hookSet: settings that make the opening scene match the question. The first original step then starts again from the defaults. */
    if(P.hookSet){h.setup=sim=>{BL.setValues(sim,P.hookSet);BL.reset(sim);};const f=d.tour[0],o=f.setup;f.setup=sim=>{const base={};(d.controls||[]).forEach(c=>base[c.id]=c.def);BL.setValues(sim,base);BL.reset(sim);if(o)o(sim);};}
    d.tour.unshift(h);}}
const sims={};BL.sims=sims;
let active=null;

function makeSim(def){const sim={def,p:{},t:0,st:null,vis:{},hist:[],lastSample:-1e9,running:true,speed:1,vt:0,
  gmode:'live',gMetric:def.defaultGraph||null,gx:null,gy:null,ch:{idx:0,phase:'ask',pick:null,changed:false},trials:[],ui:{},infoDirty:true};
  (def.controls||[]).forEach(c=>sim.p[c.id]=c.def);
  return sim;}
function resetSim(sim){const d=sim.def;sim.st=d.init(sim);sim.t=-(d.prewarm||0);const h=d.dtMax||0.01;
  while(sim.t<-1e-9){const s=Math.min(h,-sim.t);d.step(sim,s);sim.t+=s;}
  sim.t=0;if(d.afterPrewarm)d.afterPrewarm(sim);sim.hist=[];sim.lastSample=-1e9;sim.vis={};if(d.initVis)d.initVis(sim);sample(sim,true);sim.infoDirty=true;}
const allMetrics=sim=>sim.def.metrics||[];
const metricsVisible=sim=>allMetrics(sim).filter(m=>atLeast(m.lvl));
const controlsVisible=sim=>(sim.def.controls||[]).filter(c=>atLeast(c.lvl));
const metricById=(sim,id)=>allMetrics(sim).find(m=>m.id===id);
function sample(sim,force){if(sim.def.timeless&&!force)return;if(!force&&sim.t-sim.lastSample<(sim.def.sampleDt||0.1))return;sim.lastSample=sim.t;
  const row={t:sim.t,v:{}};allMetrics(sim).forEach(m=>{if(!m.text)row.v[m.id]=m.get(sim);});sim.hist.push(row);
  const cut=sim.t-(sim.def.window||30)*1.05;while(sim.hist.length&&sim.hist[0].t<cut)sim.hist.shift();}
function fmtCtl(c,v){if(c.type==='toggle')return v?'on':'off';if(c.type==='seg'||c.type==='select'){const o=c.options.find(o=>o.v===v);return o?o.l:String(v);}
  const d=c.d!==undefined?c.d:(c.step<1?(c.step<0.1?(c.step<0.01?3:2):1):0);const n=Number(v);return (Math.abs(n)>=10000?n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}):n.toFixed(d))+(c.unit||'');}
function clockText(sim){const d=sim.def;if(d.clock)return d.clock(sim);if(d.unit==='s')return 't = '+sim.t.toFixed(1)+' s';
  if(d.unit==='min'){const m=Math.floor(sim.t),sec=Math.floor((sim.t-m)*60);return 'Elapsed '+m+':'+String(sec).padStart(2,'0')+' min';}
  return (d.timeLabel||'Time')+' '+(d.unitD!==undefined?sim.t.toFixed(d.unitD):Math.floor(sim.t))+(d.unit?' '+d.unit:'');}
function graphOptions(sim){const d=sim.def;let g=d.graphs||(d.timeless?[]:allMetrics(sim).filter(m=>!m.text).map(m=>({id:m.id,label:m.label,lvl:m.lvl,lines:[m.id]})));
  return g.filter(o=>atLeast(o.lvl)&&(o.custom||o.lines.every(id=>{const m=metricById(sim,id);return m&&atLeast(m.lvl);})));}

/* ---------- build DOM for one simulation ---------- */
function el(tag,attrs,html){const e=document.createElement(tag);if(attrs)for(const k in attrs){if(k==='class')e.className=attrs[k];else e.setAttribute(k,attrs[k]);}if(html!==undefined)e.innerHTML=html;return e;}
function buildSim(sim){
  const d=sim.def,id=d.id,asp=d.aspect||16/9,sec=el('section',{class:'sim',id:'sim-'+id,'aria-labelledby':'h-'+id});
  const hasGraph=d.graph!==false,hasPredict=!!d.challenges;
  sec.innerHTML=`<div class="sim-head"><p class="eyebrow">${secLabel(d.apUnit)}</p><h2 id="h-${id}">${d.title}</h2><p class="lede"></p><div class="real-uses" hidden></div><div class="modebar" role="group" aria-label="How do you want to use this tool?"></div></div>
  <div class="bench">
    <div class="stage">${d.scale?`<p class="scale"></p>`:''}<canvas id="${id}-stage" style="aspect-ratio:${asp};--asp:${asp}" role="img" aria-label="${d.title} simulation"></canvas>
      <div class="tourbar" hidden><div class="tb-h"><span class="tb-n"></span><b class="tb-t"></b></div><p class="tb-x"></p>
        <div class="row"><button type="button" class="btn" data-tour="back">Back</button><button type="button" class="btn primary" data-tour="next">Next</button><button type="button" class="btn" data-tour="exit">Exit walkthrough</button></div></div>
      ${d.narrate?'<p class="cap"></p>':''}
      <div class="transport">
        <button type="button" class="btn" data-act="play">Pause</button>
        <button type="button" class="btn" data-act="step" hidden>Step ›</button>
        <button type="button" class="btn" data-act="reset">Reset</button>
        <label class="g-opts" for="${id}-speed">Speed <select class="sel" id="${id}-speed"><option value="0.1">0.1×</option><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select></label>
        ${d.tour?'<button type="button" class="btn tour-btn" data-act="tour">Walk me through it</button>':''}
        <span class="clock"></span>
      </div>
    </div>
    <aside class="controls" aria-label="Variables"><h3>${d.controlsTitle||'Variables'}</h3></aside>
  </div>
  <div class="readouts"></div>
  <div class="lower${((hasGraph?1:0)+(d.infoPanel?1:0)+(hasPredict?1:0))>=2?'':' one'}">
    ${hasGraph?`<div class="panel graph">
      <div class="p-head"><div class="seg" role="radiogroup" aria-label="Graph mode"><button type="button" role="radio" data-g="live" aria-checked="true">Graph</button><button type="button" role="radio" data-g="trials" aria-checked="false">Trials</button></div>
        <div class="g-opts g-live"><label for="${id}-gm">Plot</label><select class="sel" id="${id}-gm"></select></div>
        <div class="g-opts g-trials" hidden><label for="${id}-gx">x</label><select class="sel" id="${id}-gx"></select><label for="${id}-gy">y</label><select class="sel" id="${id}-gy"></select></div>
      </div>
      <canvas id="${id}-graph" role="img" aria-label="Graph"></canvas>
    </div>`:''}
    ${d.infoPanel?`<div class="panel info" aria-live="polite"></div>`:''}
    ${hasPredict?`<div class="panel predict" aria-live="polite"></div>`:''}
  </div>
  ${d.trials===false?'':`<div class="panel trials">
    ${d.lab?'<div class="lab"></div>':''}
    <div class="p-head"><h3>Data table</h3><div class="row"><span class="toast" hidden></span><button type="button" class="btn primary" data-act="record">Record trial</button><button type="button" class="btn" data-act="copy">Copy as CSV</button><button type="button" class="btn" data-act="clear">Clear</button></div></div>
    <div class="tbl"></div>
  </div>`}
  ${d.terms?`<details class="about terms"><summary>Key terms</summary><dl class="about-b">${d.terms.map(t=>`<div data-lvl="${t.lvl||'bio'}"><dt>${t.t}</dt><dd>${t.d}</dd></div>`).join('')}</dl></details>`:''}
  ${d.about?`<details class="about"><summary>About this model</summary><div class="about-b">${d.about}</div></details>`:''}
  <div class="related" hidden></div>
  <p class="fb-line"><a class="fb-link" href="https://forms.microsoft.com/r/sKU9sHY45r" target="_blank" rel="noopener" data-tool="${d.tab}">Report a bug or request a feature</a><span class="fb-hint">Opens a Microsoft Form. Sign in with your RJ account and name this tool: ${LAB_NAME} › ${d.tab}.</span></p>
  <details class="about embed-box"><summary>Embed this tool in Canvas</summary><div class="about-b embed-b"></div></details>`;
  const ui=sim.ui;ui.sec=sec;ui.lede=sec.querySelector('.lede');ui.uses=sec.querySelector('.real-uses');ui.stage=sec.querySelector('#'+id+'-stage');ui.graph=sec.querySelector('#'+id+'-graph');
  ui.clock=sec.querySelector('.clock');ui.play=sec.querySelector('[data-act=play]');ui.ctrls=sec.querySelector('.controls');ui.read=sec.querySelector('.readouts');
  ui.pred=sec.querySelector('.predict');ui.info=sec.querySelector('.info');ui.tbl=sec.querySelector('.tbl');ui.gm=sec.querySelector('#'+id+'-gm');ui.gx=sec.querySelector('#'+id+'-gx');ui.gy=sec.querySelector('#'+id+'-gy');
  ui.toast=sec.querySelector('.toast');ui.ctl={};ui.ctlW={};ui.actB={};ui.tiles={};ui.cap=sec.querySelector('.cap');ui.scale=sec.querySelector('.scale');ui.lab=sec.querySelector('.lab');
  ui.speedSel=sec.querySelector('#'+id+'-speed');ui.stepBtn=sec.querySelector('[data-act=step]');ui.tourbar=sec.querySelector('.tourbar');
  ui.donecard=el('div',{class:'donecard','aria-live':'polite'});ui.donecard.hidden=true;ui.gamecard=el('div',{class:'gamecard','aria-live':'polite'});ui.gamecard.hidden=true;ui.gamebtns=el('div',{class:'gamebtns row'});ui.gamebtns.hidden=true;ui.tourbar.after(ui.donecard,ui.gamecard);
  ui.vstep=el('div',{class:'vstep','aria-live':'polite'});ui.vstep.hidden=true;ui.gamecard.after(ui.vstep);
  ui.nb=el('div',{class:'vlab-nb'});ui.nb.hidden=true;sec.querySelector('.bench').after(ui.nb);ui.resetBtn=sec.querySelector('[data-act=reset]');ui.ctrlsHome=ui.ctrls.parentNode;
  if(d.timeless){ui.clock.hidden=true;sec.querySelector('[data-act=play]').hidden=!d.animated;sec.querySelector('label[for='+id+'-speed]').hidden=!d.animated;}
  // controls
  (d.controls||[]).forEach(c=>{const cid=id+'-'+c.id;let w;const changed=()=>{if(c.onChange)c.onChange(sim);sim.infoDirty=true;};
    if(c.type==='range'){w=el('div',{class:'ctl','data-lvl':c.lvl||'bio'});w.innerHTML=`<div class="ctl-top"><label for="${cid}">${c.label}</label><output for="${cid}" id="${cid}-out"></output></div><input type="range" id="${cid}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.def}">${c.help?`<p class="help">${c.help}</p>`:''}`;
      const inp=w.querySelector('input'),out=w.querySelector('output');inp.addEventListener('input',()=>{sim.p[c.id]=parseFloat(inp.value);out.textContent=fmtCtl(c,sim.p[c.id]);changed();});
      ui.ctl[c.id]={set(v){inp.value=v;out.textContent=fmtCtl(c,v);}};}
    else if(c.type==='toggle'){w=el('div',{class:'ctl','data-lvl':c.lvl||'bio'});w.innerHTML=`<label class="switch" for="${cid}"><input type="checkbox" id="${cid}"><span class="track"></span><span class="tl"><b>${c.label}</b>${c.help?`<small>${c.help}</small>`:''}</span></label>`;
      const inp=w.querySelector('input');inp.addEventListener('change',()=>{sim.p[c.id]=inp.checked;changed();});ui.ctl[c.id]={set(v){inp.checked=!!v;}};}
    else if(c.type==='select'){w=el('div',{class:'ctl','data-lvl':c.lvl||'bio'});w.innerHTML=`<div class="ctl-top"><label for="${cid}">${c.label}</label></div><select class="sel wide" id="${cid}">${c.options.map(o=>`<option value="${o.v}"${o.lvl?` data-lvl="${o.lvl}"`:''}>${o.l}</option>`).join('')}</select>${c.help?`<p class="help">${c.help}</p>`:''}`;
      const s=w.querySelector('select');s.addEventListener('change',()=>{const o=c.options.find(o=>String(o.v)===s.value);sim.p[c.id]=o?o.v:s.value;changed();});ui.ctl[c.id]={set(v){s.value=String(v);}};}
    else{w=el('div',{class:'ctl','data-lvl':c.lvl||'bio'});w.innerHTML=`<div class="ctl-top"><span class="lbl" id="${cid}-l">${c.label}</span></div><div class="seg" role="radiogroup" aria-labelledby="${cid}-l">${c.options.map(o=>`<button type="button" role="radio" data-v="${o.v}"${o.lvl?` data-lvl="${o.lvl}"`:''}>${o.l}</button>`).join('')}</div>${c.help?`<p class="help">${c.help}</p>`:''}`;
      const btns=[...w.querySelectorAll('button')];const set=v=>btns.forEach(b=>b.setAttribute('aria-checked',String(b.dataset.v===String(v))));
      btns.forEach(b=>b.addEventListener('click',()=>{const o=c.options.find(o=>String(o.v)===b.dataset.v);sim.p[c.id]=o?o.v:b.dataset.v;set(b.dataset.v);changed();}));ui.ctl[c.id]={set};}
    if(c.vlab)w.dataset.vlab='1';ui.ctlW[c.id]=w;ui.ctrls.appendChild(w);ui.ctl[c.id].set(sim.p[c.id]);});
  if(d.actions&&d.actions.length){const row=el('div',{class:'actions'});d.actions.forEach(a=>{const b=el('button',{type:'button',class:'btn'+(a.primary?' primary':''),'data-lvl':a.lvl||'bio'},a.label);
    if(a.vlab)b.dataset.vlab='1';if(a.id)ui.actB[a.id]=b;
    b.addEventListener('click',()=>{a.run(sim);sim.infoDirty=true;if(sim.vlab)vlSave(sim);updateReadouts(sim);drawGraph(sim);});row.appendChild(b);});ui.ctrls.appendChild(row);}
  // readout tiles
  allMetrics(sim).forEach(m=>{const t=el('div',{class:'tile'+(m.text?' txt':''),'data-lvl':m.lvl||'bio'});t.innerHTML=`<div class="t-l">${m.label}</div><div class="t-v"><span class="num">—</span> <span class="u">${m.unit||''}</span></div>${(!m.text&&m.max!==null&&m.max!==undefined)?'<div class="t-bar"><i></i></div>':''}`;
    ui.read.appendChild(t);ui.tiles[m.id]={num:t.querySelector('.num'),bar:t.querySelector('.t-bar i')};});
  if(!allMetrics(sim).length)ui.read.hidden=true;
  // transport
  ui.play.addEventListener('click',()=>{setRunning(sim,!sim.running);});
  ui.stepBtn.addEventListener('click',()=>{sim.stepLeft=d.stepSize||0.25;});
  if(d.tour){sec.querySelector('[data-act=tour]').addEventListener('click',()=>tourGo(sim,0));
    ui.tourbar.querySelector('[data-tour=back]').addEventListener('click',()=>tourGo(sim,sim.tour.i-1));
    ui.tourbar.querySelector('[data-tour=next]').addEventListener('click',()=>tourGo(sim,sim.tour.i+1));
    ui.tourbar.querySelector('[data-tour=exit]').addEventListener('click',()=>tourExit(sim,'exit'));}
  sec.querySelector('[data-act=reset]').addEventListener('click',()=>{resetSim(sim);sim.ch.changed=false;if(sim.vlab&&sim.mode==='vlab')vlBenchReset(sim);if(sim.ch.phase==='running'){sim.ch.phase='ask';renderChallenge(sim);}updateReadouts(sim);drawGraph(sim);});
  ui.speedSel.addEventListener('change',e=>{sim.speed=parseFloat(e.target.value);});
  // stage clicks
  if(d.onClick){ui.stage.style.cursor='pointer';ui.stage.addEventListener('click',e=>{const r=ui.stage.getBoundingClientRect(),W=800,H=800/asp;d.onClick(sim,(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H);sim.infoDirty=true;updateReadouts(sim);});}
  // graph mode
  if(hasGraph){const gbtn=[...sec.querySelectorAll('[data-g]')];gbtn.forEach(b=>b.addEventListener('click',()=>{sim.gmode=b.dataset.g;gbtn.forEach(x=>x.setAttribute('aria-checked',String(x===b)));
      sec.querySelector('.g-live').hidden=sim.gmode!=='live';sec.querySelector('.g-trials').hidden=sim.gmode!=='trials';drawGraph(sim);}));
    ui.gm.addEventListener('change',()=>{sim.gMetric=ui.gm.value;drawGraph(sim);});
    ui.gx.addEventListener('change',()=>{sim.gx=ui.gx.value;drawGraph(sim);});ui.gy.addEventListener('change',()=>{sim.gy=ui.gy.value;drawGraph(sim);});}
  // trials
  if(d.trials!==false){
    sec.querySelector('[data-act=record]').addEventListener('click',()=>{const row={_n:sim.trials.length+1};(d.controls||[]).forEach(c=>row[c.id]=sim.p[c.id]);allMetrics(sim).forEach(m=>row[m.id]=m.get(sim));
      sim.trials.push(row);saveTrials(sim);renderTable(sim);flash(sim,'Trial '+row._n+' recorded');if(sim.gmode==='trials')drawGraph(sim);});
    sec.querySelector('[data-act=clear]').addEventListener('click',()=>{sim.trials=[];saveTrials(sim);renderTable(sim);drawGraph(sim);});
    sec.querySelector('[data-act=copy]').addEventListener('click',()=>{const csv=toCSV(sim);if(!csv){flash(sim,'Record a trial first');return;}
      const fallback=()=>{let ta=sec.querySelector('.csv-fallback');if(!ta){ta=el('textarea',{class:'csv-fallback',readonly:'',id:id+'-csv','aria-label':'CSV data'});ui.tbl.after(ta);}ta.value=csv;ta.focus();ta.select();flash(sim,'Selected. Press Ctrl+C to copy');};
      try{navigator.clipboard.writeText(csv).then(()=>flash(sim,'Copied to clipboard'),fallback);}catch(e){fallback();}});
    try{const saved=JSON.parse(store.get(LAB_KEY+'-trials-'+id)||'[]');if(Array.isArray(saved))sim.trials=saved;}catch(e){}}
  return sec;}
function setRunning(sim,on){sim.running=on;sim.ui.play.textContent=on?'Pause':'Play';sim.ui.stepBtn.hidden=on||(sim.def.timeless&&!sim.def.animated);}
function setSpeed(sim,v){sim.speed=v;const sel=sim.ui.speedSel;if(!sel)return;if(![...sel.options].some(o=>o.value===String(v))){const o=document.createElement('option');o.value=String(v);o.textContent=v+'×';sel.insertBefore(o,sel.firstChild);}sel.value=String(v);}
const lvText=t=>{if(!t||typeof t==='string')return t||'';let out='';['bio','honors','ap'].forEach(l=>{if(t[l]&&atLeast(l))out=t[l];});return out;};
function tourSteps(sim){return (sim.def.tour||[]).filter(s=>atLeast(s.lvl));}
function tourGo(sim,i){const st=tourSteps(sim);if(!st.length)return;if(i>=st.length){tourExit(sim);return;}i=Math.max(0,i);
  const first=!sim.tour||!sim.tour.on;if(first&&sim.def.tourReset!==false){const base={};(sim.def.controls||[]).forEach(c=>base[c.id]=c.def);applyValues(sim,base);resetSim(sim);if(sim.ch.phase==='running'){sim.ch.phase='ask';renderChallenge(sim);}}
  sim.tour={on:true,i};const s=st[i];if(s.setup)s.setup(sim);setSpeed(sim,s.speed!==undefined?s.speed:0.25);setRunning(sim,!s.pause);
  const b=sim.ui.tourbar;b.hidden=false;if(sim.ui.cap)sim.ui.cap.hidden=true;b.querySelector('.tb-n').textContent='Step '+(i+1)+' of '+st.length;b.querySelector('.tb-t').textContent=lvText(s.title);
  b.querySelector('.tb-x').innerHTML=lvText(s.text);b.querySelector('[data-tour=back]').disabled=i===0;b.querySelector('[data-tour=next]').textContent=i===st.length-1?'Finish':'Next';}
function tourExit(sim,why){const wasOn=sim.tour&&sim.tour.on;sim.tour={on:false,i:0};sim.ui.tourbar.hidden=true;if(sim.ui.cap)sim.ui.cap.hidden=false;setSpeed(sim,1);setRunning(sim,true);if(sim.def.onTourExit)sim.def.onTourExit(sim);
  if(wasOn&&sim.mode==='guided'&&sim.guide&&sim.guide.phase==='tour'&&why!=='level'&&why!=='mode'){if(why==='exit')setMode(sim,'lab',true);else guideTry(sim);}}
function drawFocus(sim,ctx,LH){if(!sim.tour||!sim.tour.on)return;const s=tourSteps(sim)[sim.tour.i];if(!s||!s.focus)return;let f=typeof s.focus==='function'?s.focus(sim):s.focus;if(!f)return;
  const rects=Array.isArray(f[0])?f:[f];const sub=(x,y,w,h,r)=>{r=Math.min(r,w/2,h/2);ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();};
  ctx.save();ctx.beginPath();ctx.rect(0,0,800,LH);rects.forEach(r=>sub(r[0],r[1],r[2],r[3],10));ctx.fillStyle='rgba(10,10,14,.5)';ctx.fill('evenodd');
  ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;rects.forEach(r=>{rr(ctx,r[0],r[1],r[2],r[3],10);ctx.stroke();});ctx.restore();}
BL.h.lvText=lvText;
/* ---------- view modes: Guided (default), Challenge game, Full lab ----------
   Guided runs the walkthrough one step at a time, then the predict-then-test questions one at a time,
   with everything below the stage tucked away; Full lab is the whole bench. A sim opts into the
   Challenge game with def.game = {label, title, intro, rounds, controls:[ids], metrics:[ids], fireLabel,
   newRound(sim,i)->round {prompt}, fire(sim,round), poll(sim,round)->null|{ok,msg}, retry(sim,round),
   solve(sim,round) (sets controls to a winning answer; used by tests), par (seconds)}.
   While a game round is live, sim.gameRound holds the round so draw() can show the target. */
const modeKey=sim=>LAB_KEY+'-mode-'+sim.def.id;
function hasGuide(sim){return tourSteps(sim).length>0;}
function buildModebar(sim){const bar=sim.ui.sec.querySelector('.modebar');if(!bar)return;const d=sim.def,opts=[];
  if(d.tour)opts.push(['guided','Guided']);if(d.game)opts.push(['game',d.game.label||'Challenge']);opts.push(['lab','Full lab']);if(d.labs&&d.labs.length)opts.push(['vlab','Virtual lab']);
  if(opts.length<2){bar.hidden=true;return;}
  bar.innerHTML=opts.map(([m,l])=>`<button type="button" data-mode="${m}">${l}</button>`).join('');
  bar.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>setMode(sim,b.dataset.mode,true)));}
function restoreVisibility(sim){const d=sim.def;sim.ui.sec.querySelectorAll('[data-lvl]').forEach(e=>{e.hidden=!atLeast(e.dataset.lvl)||(!!e.dataset.vlab&&sim.mode!=='vlab');});if(d.onLevel)d.onLevel(sim);}
function setMode(sim,mode,user){const d=sim.def;if(mode==='guided'&&!hasGuide(sim))mode='lab';if(mode==='game'&&!d.game)mode='lab';if(mode==='vlab'&&!(d.labs&&d.labs.length))mode='lab';if(!MODES.includes(mode))mode='lab';
  const was=sim.mode;
  if(sim.game&&mode!=='game')gameStop(sim);
  if(sim.tour&&sim.tour.on)tourExit(sim,'mode');
  if(was==='vlab'&&mode!=='vlab')vlabExit(sim);
  sim.mode=mode;if(user)store.set(modeKey(sim),mode);
  const sec=sim.ui.sec;MODES.forEach(m=>sec.classList.toggle('m-'+m,m===mode));sec.classList.remove('g-try','g-done');
  sec.querySelectorAll('.modebar button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  sim.ui.donecard.hidden=true;sim.ui.gamecard.hidden=true;sim.guide=null;
  const ex=sim.ui.tourbar&&sim.ui.tourbar.querySelector('[data-tour=exit]');if(ex)ex.textContent=mode==='guided'?'Skip to the full lab':'Exit walkthrough';
  if(mode==='guided'){sim.guide={phase:'tour'};sim.ch={idx:0,phase:'ask',pick:null,changed:false};renderChallenge(sim);tourGo(sim,0);}
  else if(mode==='game'){gameStart(sim);}
  else if(mode==='vlab'){restoreVisibility(sim);vlabEnter(sim,was==='vlab');}
  else restoreVisibility(sim);
  if(user&&sim.ui.sec.scrollIntoView)window.scrollTo(0,0);
  updateReadouts(sim);drawGraph(sim);}
function guideTry(sim){const list=visibleCh(sim);if(!list.length){guideDone(sim);return;}sim.guide.phase='try';sim.ui.sec.classList.add('g-try');
  sim.ch={idx:0,phase:'ask',pick:null,changed:false};if(sim.def.onChallenge)sim.def.onChallenge(sim,list[0],'ask');renderChallenge(sim);
  const c=sim.ui.donecard;c.innerHTML=`<p class="dc-h">Your turn: ${list.length} quick prediction${list.length>1?'s':''}</p><p class="dc-x">Below the simulation, pick what you think will happen. Then watch the model test your prediction.</p>`;c.hidden=false;}
function guideDone(sim){if(!sim.guide)sim.guide={};sim.guide.phase='done';const sec=sim.ui.sec,d=sim.def;sec.classList.remove('g-try');sec.classList.add('g-done');
  const c=sim.ui.donecard;const tk=d.practical&&d.practical.takeaway?lvText(d.practical.takeaway):'';const an=d.practical&&d.practical.answer?lvText(d.practical.answer):'';c.innerHTML=`<p class="dc-h">You finished the guide.</p>${an?`<p class="dc-ans"><b>Back to the question:</b> ${an}</p>`:''}${tk?`<p class="dc-take"><b>Take this with you:</b> ${tk}</p>`:''}<p class="dc-x">${d.game?'Test yourself in the challenge, or explore':'Now explore'} on your own: the full lab has every variable, the graph, the data table and an investigation to try.</p><div class="row">${d.game?`<button type="button" class="btn primary" data-dc="game">Play the ${d.game.label||'challenge'}</button>`:''}<button type="button" class="btn${d.game?'':' primary'}" data-dc="lab">Open the full lab</button><button type="button" class="btn" data-dc="again">Start the guide again</button></div>`;c.hidden=false;
  c.querySelector('[data-dc=lab]').onclick=()=>setMode(sim,'lab',true);const g=c.querySelector('[data-dc=game]');if(g)g.onclick=()=>setMode(sim,'game',true);c.querySelector('[data-dc=again]').onclick=()=>setMode(sim,'guided',true);}
function gameVis(sim,ctls,mets){restoreVisibility(sim);
  if(ctls)(sim.def.controls||[]).forEach(c=>{const e=document.getElementById(sim.def.id+'-'+c.id)||document.getElementById(sim.def.id+'-'+c.id+'-l');const w=e&&e.closest('.ctl');if(w&&!ctls.includes(c.id))w.hidden=true;});
  sim.ui.ctrls.querySelectorAll('.actions button').forEach(b=>b.hidden=true);
  if(mets)(sim.def.metrics||[]).forEach(m=>{const t=sim.ui.tiles[m.id];const w=t&&t.num.closest('.tile');if(w&&!mets.includes(m.id))w.hidden=true;});
  sim.ui.read.hidden=!!(mets&&!mets.length);}
function gameStart(sim){const g=sim.def.game;if(!sim.ui.ctrlsHome){sim.ui.ctrlsHome=sim.ui.ctrls.parentNode;}sim.ui.gamecard.after(sim.ui.ctrls);sim.ui.ctrls.after(sim.ui.gamebtns);sim.ui.gamebtns.hidden=false;sim.ui.ctrls.classList.add('in-game');sim.game={i:0,score:0,misses:0,roundMiss:0,t0:null,elapsed:0,state:'aim',results:[]};setSpeed(sim,1);setRunning(sim,true);if(g.start)g.start(sim);gameRound(sim);}
function gameRound(sim){const g=sim.def.game,G=sim.game;G.round=g.newRound(sim,G.i)||{};sim.gameRound=G.round;G.state='aim';G.roundMiss=0;G.last=null;
  gameVis(sim,G.round.controls||g.controls,G.round.metrics||g.metrics);sim.infoDirty=true;renderGame(sim);}
function gameFire(sim){const g=sim.def.game,G=sim.game;if(!G||G.state==='flying'||G.state==='over')return;
  /* After a miss, Try again resets the scene and hands control back, so the student can adjust before the next go. */
  if(G.state==='miss'){G.state='aim';if(g.retry)g.retry(sim,G.round);renderGame(sim);return;}
  if(G.t0===null)G.t0=performance.now();G.state='flying';G.last=null;g.fire(sim,G.round);renderGame(sim);}
function gameTick(sim){const G=sim.game;if(!G||G.state!=='flying')return;const r=sim.def.game.poll(sim,G.round);if(!r)return;G.last=r;
  if(r.ok){G.state='hit';const pts=Math.max(1,3-G.roundMiss);G.score+=pts;G.results.push(pts);}else{G.state='miss';G.roundMiss++;G.misses++;}renderGame(sim);}
function gameNext(sim){const g=sim.def.game,G=sim.game;if(!G)return;G.i++;
  if(G.i>=g.rounds){G.state='over';G.elapsed=G.t0===null?0:(performance.now()-G.t0)/1000;sim.gameRound=null;
    const k=LAB_KEY+'-best-'+sim.def.id;let best=null;try{best=JSON.parse(store.get(k)||'null');}catch(e){}
    G.newBest=!best||G.score>best.score||(G.score===best.score&&G.elapsed<best.time);if(G.newBest)store.set(k,JSON.stringify({score:G.score,time:G.elapsed}));G.best=G.newBest?{score:G.score,time:G.elapsed}:best;renderGame(sim);return;}
  gameRound(sim);}
function gameStop(sim){sim.game=null;sim.gameRound=null;sim.ui.ctrls.hidden=false;if(sim.ui.ctrlsHome&&sim.ui.ctrls.parentNode!==sim.ui.ctrlsHome){sim.ui.ctrlsHome.appendChild(sim.ui.ctrls);}sim.ui.ctrls.classList.remove('in-game');if(sim.ui.gamebtns){sim.ui.gamebtns.hidden=true;sim.ui.gamebtns.innerHTML='';}if(sim.ui.gamecard)sim.ui.gamecard.hidden=true;if(sim.ui.read)sim.ui.read.hidden=!(sim.def.metrics||[]).length;}
const fmtTime=s=>{s=Math.max(0,s||0);const m=Math.floor(s/60),r=Math.floor(s%60);return m+':'+String(r).padStart(2,'0');};
function gameClock(sim){const G=sim.game;if(!G)return;const t=sim.ui.gamecard.querySelector('.gm-time');if(!t)return;const s=G.state==='over'?G.elapsed:G.t0===null?0:(performance.now()-G.t0)/1000;t.textContent=fmtTime(s);}
function renderGame(sim){const g=sim.def.game,G=sim.game,c=sim.ui.gamecard;if(!G){c.hidden=true;return;}c.hidden=false;const max=3*g.rounds;
  const stats=`<span class="gm-stats"><span>Round <b>${Math.min(G.i+1,g.rounds)}</b> of ${g.rounds}</span><span>Score <b>${G.score}</b> / ${max}</span><span>Time <b class="gm-time">0:00</b></span></span>`;
  sim.ui.ctrls.hidden=G.state==='over';
  if(G.state==='over'){if(sim.ui.gamebtns){sim.ui.gamebtns.innerHTML='';sim.ui.gamebtns.hidden=true;}const badges=[];if(G.score===max)badges.push('First try every time');if(g.par&&G.elapsed<=g.par)badges.push('Under par time');if(G.newBest)badges.push('New personal best');
    c.innerHTML=`<div class="gm-top"><b class="gm-t">${lvText(g.title)||'Challenge'}: done!</b>${stats}</div><p class="gm-x">You scored <b>${G.score} of ${max}</b> in ${fmtTime(G.elapsed)}. ${G.best&&!G.newBest?`Your best is ${G.best.score} in ${fmtTime(G.best.time)}.`:''}</p>${badges.length?`<p class="badges">${badges.map(b=>`<span>${b}</span>`).join('')}</p>`:''}<div class="row"><button type="button" class="btn primary" data-g="again">Play again</button><button type="button" class="btn" data-g="lab">Open the full lab</button></div>`;
    c.querySelector('[data-g=again]').onclick=()=>gameStart(sim);c.querySelector('[data-g=lab]').onclick=()=>setMode(sim,'lab',true);gameClock(sim);return;}
  const r=G.round||{},msg=G.last?`<p class="gm-msg ${G.last.ok?'ok':'no'}">${G.last.msg||(G.last.ok?'Hit!':'Missed.')}</p>`:'';
  const intro=G.i===0&&G.state==='aim'&&g.intro?`<p class="gm-intro">${lvText(g.intro)}</p>`:'';
  const btn=G.state==='hit'?`<button type="button" class="btn primary" data-g="next">${G.i+1<g.rounds?'Next round':'See your score'}</button>`:`<button type="button" class="btn primary" data-g="fire"${G.state==='flying'?' disabled':''}>${G.state==='miss'?'Try again':(g.fireLabel||'Go')}</button>`;
  c.innerHTML=`<div class="gm-top"><b class="gm-t">${lvText(g.title)||'Challenge'}</b>${stats}</div>${intro}<p class="gm-x">${lvText(r.prompt)||''}</p>${msg}`;
  const B=sim.ui.gamebtns;B.hidden=false;B.innerHTML=btn;
  const f=B.querySelector('[data-g=fire]');if(f)f.onclick=()=>gameFire(sim);const n=B.querySelector('[data-g=next]');if(n)n.onclick=()=>gameNext(sim);gameClock(sim);}

/* ---------- Virtual lab (def.labs): a teacher's handout, run on the bench ----------
   The mode bar gets "Virtual lab". The procedure stepper sits beside the stage and the lab notebook below it.
   Everything the student types autosaves under LAB_KEY+'-vlab-'+toolId+'-'+labId. Contract: VLAB.md.
   While a lab is open, sim.vlab = {lab, seed, bench, rng(k), raw(key), val(table,col,row), col(table,col), step}.
   sim.vlab.bench is a plain object the sim keeps its bench state in; the engine saves it with the notebook. */
let setLevelFn=null;
/* Feedback link: copy which tool, level and mode the person was on, so it can be pasted into the form. */
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('.fb-link');if(!a)return;
  const sec=a.closest('section'),lv=document.querySelector('[data-l][aria-pressed="true"]'),m=sec&&[...sec.classList].find(c=>/^m-/.test(c));
  const info=LAB_NAME+' › '+(a.dataset.tool||'')+(lv?' · '+lv.textContent.trim():'')+(m?' · '+m.slice(2)+' mode':'');
  const hint=a.parentElement.querySelector('.fb-hint');
  try{navigator.clipboard.writeText(info).then(()=>{if(hint)hint.textContent='Copied “'+info+'”. Paste it into the form.';},()=>{});}catch(_){}});
const vlKey=(sim,lab)=>LAB_KEY+'-vlab-'+sim.def.id+'-'+lab.id,vlCurKey=sim=>LAB_KEY+'-vlab-'+sim.def.id;
const vlLabs=sim=>sim.def.labs||[];
const stripTags=s=>String(s===undefined||s===null?'':s).replace(/<[^>]+>/g,'');
function vlNum(s){if(s===undefined||s===null)return NaN;s=String(s).trim().replace(/\u2212/g,'-').replace(/^([-+]?\d*),(\d+)$/,'$1.$2');if(!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s))return NaN;return parseFloat(s);}
function vlSafe(f,dflt){try{return f();}catch(e){console.error(e);return dflt;}}
function vlFixed(tb){return (tb.cols||[]).find(c=>c.rows);}
function vlRows(tb){const fx=vlFixed(tb);return fx?fx.rows:Array.from({length:tb.rows||1},(_,i)=>i+1);}
function vlRowLabel(fx,r){return fx.rowLabels?fx.rowLabels[r]:fx.rows[r];}
/* "Time (s)" row 60 reads "Time 60 s"; "pH" row 7.0 reads "pH 7.0" */
function vlWhere(fx,r){const l=stripTags(fx.label).trim(),m=l.match(/^(.*\S)\s*\(([^)]+)\)$/);return m?m[1]+' '+fx.rows[r]+' '+m[2]:l+' '+fx.rows[r];}
function vlFresh(){let d='';try{d=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});}catch(e){}
  return {v:1,seed:Math.floor(Math.random()*2147483646)+1,step:0,max:0,f:{date:d},bench:{}};}
function makeVlab(sim,lab,data){if(!data.bench||typeof data.bench!=='object')data.bench={};if(!Number.isFinite(data.seed))data.seed=vlFresh().seed;
  const V={lab,data,seed:data.seed,bench:data.bench,notes:{},
    rng:k=>rng((data.seed^Math.imul((k|0)+1,0x9E3779B1))|0),
    raw:k=>{const v=data.f[k];return v===undefined||v===null?'':String(v);},
    val:(t,c,r)=>vlNum(data.f['c:'+t+':'+c+':'+r]),
    col:(t,c)=>{const tb=(lab.tables||[]).find(x=>x.id===t);return tb?vlRows(tb).map((_,r)=>V.val(t,c,r)):[];}};
  Object.defineProperty(V,'step',{get:()=>data.step||0});return V;}
function vlSave(sim){const V=sim.vlab;if(!V)return;V.data.bench=V.bench;let s;try{s=JSON.stringify(V.data);}catch(e){return;}if(s===V._last)return;V._last=s;store.set(vlKey(sim,V.lab),s);
  const n=sim.ui.nb.querySelector('.vl-saved');if(n)n.textContent='Saved on this device';}
function vlSaveSoon(sim){const V=sim.vlab;if(!V)return;clearTimeout(V._t);V._t=setTimeout(()=>vlSave(sim),250);}
function vlDefaults(sim){const base={};(sim.def.controls||[]).forEach(c=>base[c.id]=c.def);applyValues(sim,base);resetSim(sim);}
function vlCtrlsIn(sim){const u=sim.ui;u.vstep.after(u.ctrls);u.ctrls.classList.add('in-vlab');}
function vlCtrlsOut(sim){const u=sim.ui;if(u.ctrlsHome&&u.ctrls.parentNode!==u.ctrlsHome)u.ctrlsHome.appendChild(u.ctrls);u.ctrls.classList.remove('in-vlab');u.ctrls.hidden=false;}
function vlabEnter(sim,again){const u=sim.ui;u.donecard.hidden=true;u.gamecard.hidden=true;
  if(again&&(sim.vlab||sim.vlPick)){if(sim.vlab)vlabVis(sim);return;}
  const labs=vlLabs(sim);let id=null;
  if(!sim.vlQ){sim.vlQ=true;if(QLAB&&labs.some(l=>l.id===QLAB))id=QLAB;}
  if(!id){const c=store.get(vlCurKey(sim));if(c&&labs.some(l=>l.id===c))id=c;}
  if(!id&&labs.length===1)id=labs[0].id;
  if(id)openLab(sim,id);else vlPicker(sim);}
function vlClose(sim){const V=sim.vlab;if(!V)return;clearTimeout(V._t);vlSave(sim);if(V.lab.teardown)vlSafe(()=>V.lab.teardown(sim));sim.vlab=null;vlDefaults(sim);}
function vlabExit(sim){vlClose(sim);const u=sim.ui;sim.vlPick=false;u.sec.classList.remove('vl-picking');u.vstep.hidden=true;u.vstep.innerHTML='';u.nb.hidden=true;u.nb.innerHTML='';
  vlCtrlsOut(sim);if(u.resetBtn)u.resetBtn.textContent='Reset';setRunning(sim,true);}
function vlPicker(sim){vlClose(sim);store.set(vlCurKey(sim),'');sim.vlPick=true;const u=sim.ui,labs=vlLabs(sim);u.sec.classList.add('vl-picking');u.vstep.hidden=true;vlCtrlsOut(sim);u.nb.hidden=false;
  u.nb.innerHTML=`<div class="vl-pick"><h3 class="vl-title">Choose a virtual lab</h3><p class="vl-lede">Each virtual lab is your teacher’s handout, run on the virtual bench. You read the instruments, record your own data, graph it and answer the questions. Your work saves on this device as you go.</p>
  <div class="vl-cards">${labs.map(l=>`<button type="button" class="vl-card" data-lab="${esc(l.id)}"><span class="vl-ct">${l.title}</span><span class="vl-cm">${esc(l.course||'')}${l.teachers?' · '+esc(l.teachers):''}</span>${store.get(vlKey(sim,l))?'<span class="kind">In progress</span>':''}</button>`).join('')}</div></div>`;
  u.nb.querySelectorAll('[data-lab]').forEach(b=>b.addEventListener('click',()=>{openLab(sim,b.dataset.lab);window.scrollTo(0,0);}));}
function openLab(sim,id){const lab=vlLabs(sim).find(l=>l.id===id);if(!lab){vlPicker(sim);return;}
  if(sim.vlab)vlClose(sim);
  store.set(vlCurKey(sim),id);
  let data=null;try{data=JSON.parse(store.get(vlKey(sim,lab))||'null');}catch(e){data=null;}
  if(!data||typeof data!=='object'||!data.f||typeof data.f!=='object')data=vlFresh();
  const u=sim.ui;sim.vlPick=false;u.sec.classList.remove('vl-picking');
  sim.vlab=makeVlab(sim,lab,data);
  if(lab.level&&(lab.level in LV)&&lab.level!==level&&setLevelFn)setLevelFn(lab.level);
  vlCtrlsIn(sim);u.vstep.hidden=false;u.nb.hidden=false;if(u.resetBtn)u.resetBtn.textContent='Reset bench';
  vlBench(sim);vlRender(sim);
  vlGo(sim,Math.min(data.step||0,Math.max(0,(lab.steps||[]).length-1)));}
function vlBench(sim){const V=sim.vlab;vlDefaults(sim);if(V.lab.setup)vlSafe(()=>V.lab.setup(sim));setRunning(sim,true);}
/* the transport's Reset (labelled "Reset bench" in a lab): the sim has just been reset; put the bench scene back */
function vlBenchReset(sim){const V=sim.vlab;if(V.lab.setup)vlSafe(()=>V.lab.setup(sim));const s=(V.lab.steps||[])[V.data.step||0];if(s&&s.setup)vlSafe(()=>s.setup(sim));vlSave(sim);}
function vlResetLab(sim){const V=sim.vlab;if(!V)return;const lab=V.lab;clearTimeout(V._t);store.del(vlKey(sim,lab));if(lab.teardown)vlSafe(()=>lab.teardown(sim));
  sim.vlab=makeVlab(sim,lab,vlFresh());vlBench(sim);vlRender(sim);vlGo(sim,0);vlToast(sim,'Lab reset. You have a fresh notebook.');window.scrollTo(0,0);}
function vlabVis(sim){const V=sim.vlab,d=sim.def,u=sim.ui;if(!V)return;const s=(V.lab.steps||[])[V.data.step||0]||{};const list=s.controls||V.lab.controls||[];let any=false;
  (d.controls||[]).forEach(c=>{const w=u.ctlW[c.id];if(!w)return;const on=atLeast(c.lvl)&&list.includes(c.id);w.hidden=!on;if(on)any=true;});
  (d.actions||[]).forEach(a=>{const b=a.id&&u.actB[a.id];if(!b)return;const on=atLeast(a.lvl)&&list.includes(a.id);b.hidden=!on;if(on)any=true;});
  u.ctrls.hidden=!any;}
function vlGo(sim,i){const V=sim.vlab;if(!V)return;const st=V.lab.steps||[];if(!st.length){sim.ui.vstep.hidden=true;vlabVis(sim);return;}
  i=clamp(i|0,0,st.length-1);V.data.step=i;V.data.max=Math.max(V.data.max||0,i);const s=st[i];if(s.setup)vlSafe(()=>s.setup(sim));
  vlStepRender(sim);vlabVis(sim);vlProcMark(sim);vlRecheck(sim);vlSave(sim);updateReadouts(sim);}
/* re-run every check: the bench may have changed since an entry was made */
function vlRecheck(sim){const V=sim.vlab;if(!V)return;Object.keys(V.data.f).forEach(k=>{if(V.raw(k).trim()!==''||V.notes[k])vlCheck(sim,k);});}
function vlStepRender(sim){const V=sim.vlab,st=V.lab.steps,i=V.data.step||0,s=st[i],b=sim.ui.vstep,last=i===st.length-1;
  b.innerHTML=`<div class="tb-h"><span class="tb-n">Step ${i+1} of ${st.length}</span>${s.title?`<b class="tb-t">${lvText(s.title)}</b>`:''}</div><div class="vs-x">${lvText(s.text)||''}</div><p class="vs-hint" hidden></p>
  <div class="row"><button type="button" class="btn" data-vs="back"${i?'':' disabled'}>Back</button><button type="button" class="btn primary" data-vs="next">${last?'Go to your data':'Next'}</button><button type="button" class="btn" data-vs="all">All steps</button></div>`;
  b.querySelector('[data-vs=back]').onclick=()=>vlGo(sim,i-1);
  b.querySelector('[data-vs=next]').onclick=()=>{if(last)vlScroll(sim,'data');else vlGo(sim,i+1);};
  b.querySelector('[data-vs=all]').onclick=()=>vlScroll(sim,'proc');
  vlTick(sim);}
function vlScroll(sim,k){const e=sim.ui.nb.querySelector('[data-sec="'+k+'"]');if(e&&e.scrollIntoView)e.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});}
function vlTick(sim){const V=sim.vlab;if(!V||sim.mode!=='vlab')return;const b=sim.ui.vstep,s=(V.lab.steps||[])[V.data.step||0];
  if(s&&!b.hidden){const ok=!s.done||!!vlSafe(()=>s.done(sim),true);const nx=b.querySelector('[data-vs=next]');if(nx&&nx.disabled===ok)nx.disabled=!ok;
    const h=b.querySelector('.vs-hint');if(h){const t=ok?'':(typeof s.doneHint==='function'?(vlSafe(()=>s.doneHint(sim),'')||''):(s.doneHint||''));if(h._t!==t){h._t=t;h.innerHTML=t;h.hidden=!t;}}}
  const now=performance.now();if(!V._lt||now-V._lt>1000){V._lt=now;vlSave(sim);}}
function vlProcMark(sim){const V=sim.vlab;if(!V)return;sim.ui.nb.querySelectorAll('.vl-proc li').forEach(li=>{const i=+li.dataset.i,ok=i<=(V.data.max||0);li.classList.toggle('cur',i===(V.data.step||0));li.classList.toggle('reach',ok);
  li.tabIndex=ok?0:-1;if(i===(V.data.step||0))li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});}
function vlToast(sim,m){const t=sim.ui.nb.querySelector('.vl-toast');if(!t)return;t.textContent=m;t.hidden=false;clearTimeout(t._h);t._h=setTimeout(()=>{t.hidden=true;},3200);}
/* the notebook */
function vlRender(sim){const V=sim.vlab,L=V.lab,u=sim.ui,sid=sim.def.id,labs=vlLabs(sim);
  const fid=k=>sid+'-vl-'+k.replace(/[^A-Za-z0-9]+/g,'-'),val=k=>esc(V.raw(k));
  const note=k=>`<p class="vl-note" data-n="${k}" id="${fid(k)}-n" hidden></p>`;
  const line=(k,label,ph)=>`<label class="vl-f" for="${fid(k)}"><span class="vl-l">${label}</span><input class="vl-in" type="text" id="${fid(k)}" data-k="${k}" value="${val(k)}"${ph?` placeholder="${esc(ph)}"`:''} autocomplete="off"></label>`;
  const area=(k,label,rows,aria)=>`<label class="vl-f" for="${fid(k)}">${label?`<span class="vl-l">${label}</span>`:''}<textarea class="vl-in vl-ta" id="${fid(k)}" data-k="${k}" rows="${rows||3}"${aria?` aria-label="${esc(aria)}"`:''}>${val(k)}</textarea></label>`;
  const S=(k,t,b)=>`<section class="vl-sec" data-sec="${k}"><h4 class="vl-h">${t}</h4>${b}</section>`;
  const cell=(tb,c,r)=>{const k='c:'+tb.id+':'+c.id+':'+r,fx=vlFixed(tb),aria=`${stripTags(tb.title||'')}: ${stripTags(c.label)}${fx?', '+stripTags(fx.label)+' '+stripTags(vlRowLabel(fx,r)):''}`;
    if(c.input==='select'){const v=V.raw(k);return `<select class="vl-in vl-cell" data-k="${k}" id="${fid(k)}" aria-label="${esc(aria)}"><option value="">Choose</option>${(c.options||[]).map(o=>{const ov=typeof o==='object'?o.v:o,ol=typeof o==='object'?o.l:o;return `<option value="${esc(ov)}"${String(ov)===v?' selected':''}>${esc(ol)}</option>`;}).join('')}</select>`;}
    if(c.input==='text')return `<input class="vl-in vl-cell vl-wide" type="text" data-k="${k}" id="${fid(k)}" value="${val(k)}" aria-label="${esc(aria)}" autocomplete="off">`;
    return `<input class="vl-in vl-cell vl-num" type="text" inputmode="decimal" data-k="${k}" id="${fid(k)}" value="${val(k)}" aria-label="${esc(aria)}" autocomplete="off">`;};
  const table=tb=>{const rows=vlRows(tb);return `<div class="vl-tb" data-t="${tb.id}">${tb.title?`<p class="vl-cap">${tb.title}</p>`:''}<div class="tbl-wrap"><table class="vl-table"><thead><tr>${tb.cols.map(c=>`<th scope="col">${c.label}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((rv,r)=>`<tr>${tb.cols.map(c=>c.rows?`<th scope="row">${esc(vlRowLabel(c,r))}</th>`:`<td>${cell(tb,c,r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><ul class="vl-notes" data-nt="${tb.id}" hidden></ul></div>`;};
  let h=`<header class="vl-head"><p class="eyebrow">Virtual lab${L.course?' · '+esc(L.course):''}</p><h3 class="vl-title">${L.title}</h3>
    <p class="vl-src">${L.teachers?'Teachers: '+esc(L.teachers):''}${L.source?(L.teachers?' · ':'')+'Handout: '+(L.source.href?`<a href="${esc(L.source.href)}" target="_blank" rel="noopener">${esc(L.source.label||'on Canvas')}</a>`:esc(L.source.label||'')):''}</p>
    <div class="vl-who">${line('name','Name')}${line('period','Class period')}${line('date','Date')}</div>
    <div class="vl-tools row">${labs.length>1?'<button type="button" class="btn" data-vl="pick">Choose another lab</button>':''}<span class="vl-reset"><button type="button" class="btn" data-vl="reset">Reset lab</button></span><span class="vl-saved" aria-live="polite"></span></div></header>`;
  if(L.purpose)h+=S('purpose','Purpose',`<div class="vl-txt">${L.purpose}</div>`);
  if(L.background)h+=S('background','Background',`<div class="vl-txt">${L.background}</div>`);
  if(L.materials&&L.materials.length)h+=S('materials','Materials',`<ul class="vl-mat">${L.materials.map(m=>`<li>${m}</li>`).join('')}</ul>`);
  if(L.hypothesis)h+=S('hypothesis','Hypothesis',`<div class="vl-prompt">${L.hypothesis.prompt||''}</div>${area('hyp','',3,'Your hypothesis')}`);
  if(L.steps&&L.steps.length)h+=S('proc','Procedure',`<p class="vl-help">The step you are on is marked. Tap any step you have reached to go back to it.</p><ol class="vl-proc">${L.steps.map((s,i)=>`<li data-i="${i}"><div class="vl-pt">${lvText(s.text)||''}</div></li>`).join('')}</ol>`);
  const obs=L.observations||[];
  if((L.tables&&L.tables.length)||obs.length)h+=S('data','Data',(L.tables||[]).map(table).join('')+(obs.length?`<p class="vl-cap">Observations</p><div class="vl-obs">${obs.map(o=>`<div class="vl-ob">${area('o:'+o.id,o.label,2)}${note('o:'+o.id)}</div>`).join('')}</div>`:''));
  if(L.graph)h+=S('graph','Graph',`<div class="vl-graph"><canvas class="vl-cv" role="img" aria-label="${esc(stripTags(L.graph.title||'Graph'))}"></canvas><p class="vl-help">The graph draws from the numbers you type in your tables${(L.graph.series||[]).length>1?(L.graph.type==='bar'?'. The key shows which bar is which':'. The key shows which line is which'):''}.</p></div>`);
  if(L.calcs&&L.calcs.length)h+=S('calcs','Calculations',`<div class="vl-calc">${L.calcs.map(c=>{const k='k:'+c.id;return `<div class="vl-ck"><label class="vl-f" for="${fid(k)}"><span class="vl-l">${c.label}</span>${c.input==='text'?`<textarea class="vl-in vl-ta" id="${fid(k)}" data-k="${k}" rows="2">${val(k)}</textarea>`:`<span class="vl-cin"><input class="vl-in vl-num" type="text" inputmode="decimal" id="${fid(k)}" data-k="${k}" value="${val(k)}" autocomplete="off">${c.unit?`<span class="vl-u">${c.unit}</span>`:''}</span>`}</label>${note(k)}</div>`;}).join('')}</div>`);
  if(L.questions&&L.questions.length)h+=S('questions','Questions',L.questions.map((q,i)=>`<div class="vl-q"><div class="vl-qh"><span class="vl-qn">${esc(q.n!==undefined?q.n:i+1)}</span><div class="vl-qt">${q.q}</div></div>${q.fields?`<div class="vl-qf">${q.fields.map(f=>line('q:'+q.id+':'+f.id,f.label)).join('')}</div>`:area('q:'+q.id,'',4,'Your answer to question '+(q.n!==undefined?q.n:i+1))}</div>`).join(''));
  if(L.conclusion){const C=L.conclusion;h+=S('conclusion','Conclusion',`<div class="vl-prompt">${C.prompt||''}</div>`+(C.cer?`<div class="vl-cer">${area('cer:claim','Claim <small>One sentence that answers the question.</small>',2)}${area('cer:evidence','Evidence <small>Your own data that supports the claim.</small>',3)}${area('cer:reasoning','Reasoning <small>The biology that explains why the evidence supports the claim.</small>',4)}</div>`:area('concl','',5,'Your conclusion')));}
  h+=S('export','Turn it in',`<p class="vl-help">Build a clean report of everything above, then upload it to the Canvas assignment. For a PDF, choose <b>Save as PDF</b> as the printer.</p><div class="row vl-exp"><button type="button" class="btn primary" data-vl="pdf">Save as PDF</button><button type="button" class="btn" data-vl="doc">Download Word file</button><button type="button" class="btn" data-vl="txt">Copy as text</button><span class="toast vl-toast" hidden></span></div><div class="vl-fallback"></div>`);
  u.nb.innerHTML=h;vlBind(sim);V.notes={};
  vlRecheck(sim);vlProcMark(sim);requestAnimationFrame(()=>vlGraph(sim));}
function vlBind(sim){const nb=sim.ui.nb;if(nb._bound)return;nb._bound=true;
  const put=e=>{const t=e.target,k=t&&t.dataset&&t.dataset.k,V=sim.vlab;if(!k||!V)return;V.data.f[k]=t.value;vlSaveSoon(sim);if(k.indexOf('c:')===0)vlGraph(sim);if(V.notes[k]&&!t.value.trim())vlSetNote(sim,k,null);};
  nb.addEventListener('input',put);
  nb.addEventListener('change',e=>{put(e);const k=e.target.dataset&&e.target.dataset.k;if(k&&sim.vlab&&e.target.tagName==='SELECT')vlCheck(sim,k);});
  nb.addEventListener('focusout',e=>{const k=e.target.dataset&&e.target.dataset.k;if(k&&sim.vlab)vlCheck(sim,k);});
  nb.addEventListener('click',e=>{const V=sim.vlab;if(!V)return;const b=e.target.closest('[data-vl]');
    if(b){const a=b.dataset.vl,box=nb.querySelector('.vl-reset');
      if(a==='pick'){vlPicker(sim);window.scrollTo(0,0);}
      else if(a==='reset'){box.innerHTML='<span class="vl-confirm" role="alert">Erase everything you typed in this lab and start over? <button type="button" class="btn primary" data-vl="reset-yes">Erase and start over</button> <button type="button" class="btn" data-vl="reset-no">Keep my work</button></span>';box.querySelector('[data-vl=reset-no]').focus();}
      else if(a==='reset-no'){box.innerHTML='<button type="button" class="btn" data-vl="reset">Reset lab</button>';box.querySelector('button').focus();}
      else if(a==='reset-yes')vlResetLab(sim);
      else if(a==='pdf')vlExportPdf(sim);else if(a==='doc')vlExportDoc(sim);else if(a==='txt')vlExportTxt(sim);
      return;}
    const li=e.target.closest('.vl-proc li.reach');if(li){vlGo(sim,+li.dataset.i);const st=sim.ui.stage;if(st&&st.scrollIntoView)st.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});}});
  nb.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const li=e.target.closest&&e.target.closest('.vl-proc li.reach');if(li&&e.target===li){e.preventDefault();li.click();}});}
function vlCheck(sim,k){const V=sim.vlab;if(!V)return;const L=V.lab,v=V.raw(k).trim(),p=k.split(':');let msg=null;const NUM='Enter a number, using digits and a decimal point.';
  if(v!==''){
    if(p[0]==='c'){const tb=(L.tables||[]).find(t=>t.id===p[1]),c=tb&&tb.cols.find(x=>x.id===p[2]);if(c&&!c.rows){const rv=vlRows(tb)[+p[3]];
      if(c.input==='text'||c.input==='select'){if(c.check)msg=vlSafe(()=>c.check(sim,rv,v),null);}
      else{const n=vlNum(v);if(!Number.isFinite(n))msg=NUM;else if(c.check)msg=vlSafe(()=>c.check(sim,rv,n),null);}}}
    else if(p[0]==='k'){const c=(L.calcs||[]).find(x=>x.id===p[1]);if(c){if(c.input==='text'){if(c.check)msg=vlSafe(()=>c.check(sim,v,V),null);}
      else{const n=vlNum(v);if(!Number.isFinite(n))msg=NUM;else if(c.check)msg=vlSafe(()=>c.check(sim,n,V),null);}}}
    else if(p[0]==='o'){const o=(L.observations||[]).find(x=>x.id===p[1]);if(o&&o.check)msg=vlSafe(()=>o.check(sim,v,V),null);}}
  vlSetNote(sim,k,msg||null);}
function vlSetNote(sim,k,msg){const V=sim.vlab,nb=sim.ui.nb;if(!V)return;if(msg)V.notes[k]=String(msg);else delete V.notes[k];
  const inp=nb.querySelector('[data-k="'+k+'"]');if(inp){inp.classList.toggle('vl-warn',!!msg);if(msg)inp.setAttribute('aria-invalid','true');else inp.removeAttribute('aria-invalid');}
  if(k.indexOf('c:')===0){const t=k.split(':')[1],ul=nb.querySelector('[data-nt="'+t+'"]'),tb=(V.lab.tables||[]).find(x=>x.id===t);if(!ul||!tb)return;const fx=vlFixed(tb),multi=tb.cols.filter(c=>!c.rows).length>1;
    const items=Object.keys(V.notes).filter(x=>x.indexOf('c:'+t+':')===0).sort((a,b)=>(+a.split(':')[3])-(+b.split(':')[3]));
    ul.innerHTML=items.map(x=>{const q=x.split(':'),r=+q[3],c=tb.cols.find(cc=>cc.id===q[2]);return `<li><b>${fx?esc(vlWhere(fx,r)):'Row '+(r+1)}${multi&&c?', '+esc(stripTags(c.label)):''}:</b> ${esc(V.notes[x])}</li>`;}).join('');ul.hidden=!items.length;}
  else{const n=nb.querySelector('[data-n="'+k+'"]');if(n){n.textContent=msg||'';n.hidden=!msg;}if(inp){if(msg)inp.setAttribute('aria-describedby',n?n.id:'');else inp.removeAttribute('aria-describedby');}}}
/* the graph, drawn from the student's own entries */
const VL_MARK=['circle','square','triangle','diamond'];
function vlMarker(ctx,shape,x,y,r){ctx.beginPath();if(shape==='square')ctx.rect(x-r,y-r,2*r,2*r);else if(shape==='triangle'){ctx.moveTo(x,y-r*1.25);ctx.lineTo(x+r*1.15,y+r*.85);ctx.lineTo(x-r*1.15,y+r*.85);ctx.closePath();}
  else if(shape==='diamond'){ctx.moveTo(x,y-r*1.3);ctx.lineTo(x+r*1.1,y);ctx.lineTo(x,y+r*1.3);ctx.lineTo(x-r*1.1,y);ctx.closePath();}else ctx.arc(x,y,r,0,6.2832);ctx.fill();}
function vlSeries(V){const G=V.lab.graph;return (G.series||[]).map((s,i)=>{const tb=(V.lab.tables||[]).find(t=>t.id===s.table);if(!tb)return null;const xc=tb.cols.find(c=>c.id===s.x);
  const pts=vlRows(tb).map((rv,r)=>({x:xc&&xc.rows?vlNum(xc.rows[r]):V.val(s.table,s.x,r),y:V.val(s.table,s.y,r),cat:xc&&xc.rows?stripTags(vlRowLabel(xc,r)):(V.raw('c:'+s.table+':'+s.x+':'+r)||String(r+1))}));
  return {label:s.label||'',pts,color:serColor(i),shape:VL_MARK[i%VL_MARK.length]};}).filter(Boolean);}
function vlLegend(ctx,S,x0,y,maxX){ctx.font='13px '+FONT;let x=x0;S.forEach(s=>{const w=ctx.measureText(s.label).width+52;if(x>x0&&x+w>maxX){x=x0;y+=20;}
  ctx.strokeStyle=s.color;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+24,y);ctx.stroke();ctx.fillStyle=s.color;vlMarker(ctx,s.shape,x+12,y,4.5);txt(ctx,s.label,x+30,y,{s:13,c:PAL['muted'],b:'middle'});x+=w;});return y;}
const vlFmt=v=>String(Math.round(v*100)/100);
function vlPlot(ctx,W,H,V){const G=V.lab.graph,S=vlSeries(V),bar=G.type==='bar';
  txt(ctx,stripTags(G.title||''),W/2,20,{s:15,w:700,a:'center'});
  let top=34;if(S.length>1)top=vlLegend(ctx,S,66,44,W-16)+14;
  const box={L:66,T:top,W:W-66-18,H:H-top-46,cw:W,ch:H};
  const ys=[].concat(...S.map(s=>s.pts.map(p=>p.y))).filter(Number.isFinite);let has=false;
  if(bar){const cats=S.length?S[0].pts.map(p=>p.cat):[];has=ys.length>0;
    const ymin=G.ymin!==undefined?G.ymin:Math.min(0,...ys),ymax=(G.ymax!==undefined?Math.max(G.ymax,...ys):Math.max(1,...ys))*1.12;
    const ax=axes(ctx,box,{xmin:0,xmax:Math.max(1,cats.length),ymin,ymax,xl:G.xl,yl:G.yl,xcats:cats});const n=S.length||1,gw=.7,bw=gw/n;
    S.forEach((s,si)=>s.pts.forEach((p,i)=>{if(!Number.isFinite(p.y))return;const x0=ax.X(i+.5-gw/2+si*bw),x1=ax.X(i+.5-gw/2+(si+1)*bw),y0=ax.Y(Math.max(ymin,0)),y1=ax.Y(clamp(p.y,ymin,ymax));
      ctx.fillStyle=s.color;ctx.fillRect(x0+1,Math.min(y0,y1),Math.max(1,x1-x0-2),Math.abs(y0-y1));txt(ctx,vlFmt(p.y),(x0+x1)/2,Math.min(y0,y1)-6,{s:12,w:600,c:PAL['fg'],a:'center'});}));}
  else{const xs=[].concat(...S.map(s=>s.pts.map(p=>p.x))).filter(Number.isFinite);const ok=S.map(s=>s.pts.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));has=ok.some(a=>a.length);
    const xmin=G.xmin!==undefined?G.xmin:(xs.length?Math.min(...xs):0),xmax=G.xmax!==undefined?G.xmax:(xs.length?Math.max(...xs):1);
    let ymin=0,ymax=1;const fy=ok.length?[].concat(...ok).map(p=>p.y):[];if(fy.length){const lo=Math.min(...fy),hi=Math.max(...fy),pad=Math.max((hi-lo)*.12,.3);ymin=Math.floor((lo-pad)*2)/2;ymax=Math.ceil((hi+pad)*2)/2;}
    if(G.ymin!==undefined)ymin=G.ymin;if(G.ymax!==undefined)ymax=Math.max(G.ymax,fy.length?Math.max(...fy):G.ymax);
    const ax=axes(ctx,box,{xmin,xmax,ymin,ymax,xl:G.xl,yl:G.yl});ctx.save();ctx.beginPath();ctx.rect(box.L-6,box.T-6,box.W+12,box.H+12);ctx.clip();
    S.forEach(s=>{ctx.strokeStyle=s.color;ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.beginPath();let pen=false;
      s.pts.forEach(p=>{if(Number.isFinite(p.x)&&Number.isFinite(p.y)){const X=ax.X(p.x),Y=ax.Y(p.y);pen?ctx.lineTo(X,Y):ctx.moveTo(X,Y);pen=true;}else pen=false;});ctx.stroke();
      ctx.fillStyle=s.color;s.pts.forEach(p=>{if(Number.isFinite(p.x)&&Number.isFinite(p.y))vlMarker(ctx,s.shape,ax.X(p.x),ax.Y(p.y),4.8);});});ctx.restore();}
  if(!has)txt(ctx,'Your graph draws here as you type your data.',box.L+box.W/2,box.T+box.H/2,{s:14,c:PAL['muted'],a:'center',b:'middle'});}
function vlGraph(sim){const V=sim.vlab;if(!V||!V.lab.graph)return;const cv=sim.ui.nb.querySelector('.vl-cv');if(!cv)return;const W=cv.clientWidth,H=cv.clientHeight;if(!W||!H)return;
  const dpr=fit(cv,W,H),ctx=cv.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);vlPlot(ctx,W,H,V);}
function vlLight(fn){const de=document.documentElement,prev=de.getAttribute('data-theme');de.setAttribute('data-theme','light');readPal();try{fn();}finally{if(prev===null)de.removeAttribute('data-theme');else de.setAttribute('data-theme',prev);readPal();}}
function vlPng(V){if(!V.lab.graph)return '';const W=700,H=380,cv=document.createElement('canvas');cv.width=W*2;cv.height=H*2;const ctx=cv.getContext('2d');let url='';
  vlLight(()=>{ctx.setTransform(2,0,0,2,0,0);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);vlPlot(ctx,W,H,V);try{url=cv.toDataURL('image/png');}catch(e){url='';}});return url;}
/* the report: the same content as a printable page, a Word file and plain text */
function vlCellText(c,v){if(c.input==='select'&&v!==''){const o=(c.options||[]).find(o=>String(typeof o==='object'?o.v:o)===v);if(o)return typeof o==='object'?String(o.l):String(o);}return v;}
const vlUnP=s=>String(s||'').replace(/^\s*<p>/i,'').replace(/<\/p>\s*$/i,'');
function vlReportHTML(sim,img,word){const V=sim.vlab,L=V.lab,G=L.graph;const A=k=>{const v=V.raw(k).trim();return v?esc(v).replace(/\n/g,'<br>'):'<span class="none">(blank)</span>';};
  const S=(t,b)=>`<section><h2>${t}</h2>${b}</section>`;let h='';
  h+=`<header><p class="kicker">${esc(LAB_NAME)} · Virtual lab${L.course?' · '+esc(L.course):''}</p><h1>${L.title}</h1>
    <table class="who"><tr><td><b>Name:</b> ${A('name')}</td><td><b>Class period:</b> ${A('period')}</td><td><b>Date:</b> ${A('date')}</td></tr></table>
    <p class="src">${L.source?'Handout: '+esc(L.source.label||''):''}${L.teachers?(L.source?' · ':'')+'Teachers: '+esc(L.teachers):''}${L.source&&L.source.href?`<br><a href="${esc(L.source.href)}">${esc(L.source.href)}</a>`:''}</p></header>`;
  if(L.purpose)h+=S('Purpose',L.purpose);
  if(L.background)h+=S('Background',L.background);
  if(L.materials&&L.materials.length)h+=S('Materials','<ul>'+L.materials.map(m=>'<li>'+m+'</li>').join('')+'</ul>');
  if(L.hypothesis)h+=S('Hypothesis',`<div class="prompt">${L.hypothesis.prompt||''}</div><p class="ans">${A('hyp')}</p>`);
  if(L.steps&&L.steps.length)h+=S('Procedure','<ol class="proc">'+L.steps.map(s=>'<li>'+vlUnP(lvText(s.text))+'</li>').join('')+'</ol>');
  const obs=L.observations||[];
  if((L.tables&&L.tables.length)||obs.length){let b='';(L.tables||[]).forEach(tb=>{const rows=vlRows(tb);b+=`${tb.title?`<h3>${tb.title}</h3>`:''}<table class="data"><thead><tr>${tb.cols.map(c=>`<th>${c.label}</th>`).join('')}</tr></thead><tbody>${rows.map((rv,r)=>`<tr>${tb.cols.map(c=>c.rows?`<th>${esc(vlRowLabel(c,r))}</th>`:`<td>${esc(vlCellText(c,V.raw('c:'+tb.id+':'+c.id+':'+r).trim()))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;});
    if(obs.length)b+=`<h3>Observations</h3><table class="data kv"><tbody>${obs.map(o=>`<tr><th>${o.label}</th><td>${A('o:'+o.id)}</td></tr>`).join('')}</tbody></table>`;h+=S('Data',b);}
  if(G)h+=S('Graph',img?`<p class="fig"><img src="${img}" width="620" height="337" alt="${esc(stripTags(G.title||'Graph'))}"></p>`:'<p class="none">(The graph could not be drawn in this browser.)</p>');
  if(L.calcs&&L.calcs.length)h+=S('Calculations',`<table class="data kv"><tbody>${L.calcs.map(c=>{const v=V.raw('k:'+c.id).trim();return `<tr><th>${c.label}</th><td>${v?esc(v).replace(/\n/g,'<br>')+(c.unit&&c.input!=='text'?' '+c.unit:''):'<span class="none">(blank)</span>'}</td></tr>`;}).join('')}</tbody></table>`);
  if(L.questions&&L.questions.length)h+=S('Questions',L.questions.map((q,i)=>`<div class="q"><div class="qq"><b>${esc(q.n!==undefined?q.n:i+1)}.</b> ${vlUnP(q.q)}</div>${q.fields?`<table class="data kv"><tbody>${q.fields.map(f=>`<tr><th>${f.label}</th><td>${A('q:'+q.id+':'+f.id)}</td></tr>`).join('')}</tbody></table>`:`<p class="ans">${A('q:'+q.id)}</p>`}</div>`).join(''));
  if(L.conclusion){const C=L.conclusion;h+=S('Conclusion',`<div class="prompt">${C.prompt||''}</div>`+(C.cer?`<p><b>Claim:</b></p><p class="ans">${A('cer:claim')}</p><p><b>Evidence:</b></p><p class="ans">${A('cer:evidence')}</p><p><b>Reasoning:</b></p><p class="ans">${A('cer:reasoning')}</p>`:`<p class="ans">${A('concl')}</p>`));}
  let when='';try{when=new Date().toLocaleString();}catch(e){}
  h+=`<p class="foot">Completed in ${esc(LAB_NAME)}, a Regis Jesuit virtual lab. Report made ${esc(when)}. The data were read from the virtual bench by the student.</p>`;
  const css=`body{font:15px/1.5 "Segoe UI",Calibri,Arial,sans-serif;color:#111;background:#fff;max-width:780px;margin:24px auto;padding:0 20px}
h1{font-size:22px;line-height:1.25;margin:4px 0 10px}h2{font-size:15px;color:#a8102a;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid #C11430;padding-bottom:3px;margin:22px 0 8px}h3{font-size:15px;margin:14px 0 6px}
p{margin:0 0 8px}.kicker{color:#a8102a;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0}
table{border-collapse:collapse}.who td{padding:2px 22px 2px 0}.src{color:#444;font-size:13px}.src a{color:#a8102a;word-break:break-all}
table.data{width:auto;min-width:55%;margin:4px 0 12px}table.kv{width:100%}.data th,.data td{border:1px solid #888;padding:4px 8px;text-align:left;vertical-align:top}.data thead th{background:#ececec}.data tbody th{background:#f6f6f6;font-weight:600}.kv th{width:42%}
.prompt{color:#333;font-style:italic;margin:0 0 6px}.prompt p{margin:0}.ans{border-left:3px solid #bbb;padding:2px 10px;margin:4px 0 12px}.none{color:#888;font-style:italic}
.qq{margin:10px 0 4px}.qq p{display:inline;margin:0}.proc li{margin-bottom:4px}.proc p{margin:0 0 4px}.fig img{max-width:100%;height:auto;border:1px solid #ccc}
.foot{margin-top:28px;color:#666;font-size:12px;border-top:1px solid #ccc;padding-top:6px}
.bar{position:sticky;top:0;background:#2a2a2a;color:#fff;margin:-24px -20px 16px;padding:10px 20px;display:flex;gap:12px;align-items:center;justify-content:space-between;border-bottom:4px solid #C11430}
.bar button{font:600 14px "Segoe UI",Arial,sans-serif;background:#C11430;color:#fff;border:0;border-radius:6px;padding:7px 14px;cursor:pointer}
h2,h3{break-after:avoid;page-break-after:avoid}table,.fig,.q{break-inside:avoid;page-break-inside:avoid}
@media print{.bar{display:none}body{margin:0 auto}}@page{margin:16mm}`;
  const title=esc(stripTags(L.title)+(V.raw('name').trim()?' · '+V.raw('name').trim():''));
  if(word)return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${title}</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>${css}</style></head><body>${h}</body></html>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${css}</style></head><body><div class="bar"><b>Your lab report</b><button type="button" onclick="window.print()">Print or save as PDF</button></div>${h}</body></html>`;}
function vlHtmlText(s){s=String(s||'').replace(/<br\s*\/?>/gi,'\n').replace(/<li[^>]*>/gi,'\n- ').replace(/<\/(p|div|h\d|li|tr|ul|ol)>/gi,'\n').replace(/<[^>]+>/g,'');
  const t=document.createElement('textarea');t.innerHTML=s;return t.value.replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
function vlTextTable(head,rows){const all=[head,...rows],w=head.map((_,i)=>Math.max(...all.map(r=>String(r[i]||'').length)));return all.map((r,j)=>r.map((c,i)=>String(c||'').padEnd(w[i])).join(' | ').trimEnd()+(j===0?'\n'+w.map(x=>'-'.repeat(x)).join('-+-'):'')).join('\n');}
function vlReportText(sim){const V=sim.vlab,L=V.lab,R=k=>V.raw(k).trim()||'(blank)',out=[];const H=t=>{out.push('');out.push(t.toUpperCase());};
  out.push(stripTags(L.title));out.push(LAB_NAME+' virtual lab'+(L.course?' · '+L.course:''));out.push('Name: '+R('name')+'    Class period: '+R('period')+'    Date: '+R('date'));
  if(L.source||L.teachers)out.push((L.source?'Handout: '+(L.source.label||'')+' ':'')+(L.teachers?'· Teachers: '+L.teachers:'')+(L.source&&L.source.href?'\n'+L.source.href:''));
  if(L.purpose){H('Purpose');out.push(vlHtmlText(L.purpose));}
  if(L.background){H('Background');out.push(vlHtmlText(L.background));}
  if(L.materials&&L.materials.length){H('Materials');L.materials.forEach(m=>out.push('- '+vlHtmlText(m)));}
  if(L.hypothesis){H('Hypothesis');out.push(vlHtmlText(L.hypothesis.prompt));out.push(R('hyp'));}
  if(L.steps&&L.steps.length){H('Procedure');L.steps.forEach((s,i)=>out.push((i+1)+'. '+vlHtmlText(lvText(s.text)).replace(/\n+/g,' ')));}
  if((L.tables&&L.tables.length)||(L.observations||[]).length){H('Data');(L.tables||[]).forEach(tb=>{out.push('');if(tb.title)out.push(vlHtmlText(tb.title));
      out.push(vlTextTable(tb.cols.map(c=>vlHtmlText(c.label)),vlRows(tb).map((rv,r)=>tb.cols.map(c=>c.rows?String(vlRowLabel(c,r)):vlCellText(c,V.raw('c:'+tb.id+':'+c.id+':'+r).trim())))));});
    if((L.observations||[]).length){out.push('');out.push('Observations');L.observations.forEach(o=>out.push('- '+vlHtmlText(o.label)+': '+R('o:'+o.id)));}}
  if(L.graph){H('Graph');out.push(vlHtmlText(L.graph.title)+' (see the PDF or Word report for the graph).');}
  if(L.calcs&&L.calcs.length){H('Calculations');L.calcs.forEach(c=>out.push('- '+vlHtmlText(c.label)+': '+R('k:'+c.id)+(c.unit&&c.input!=='text'&&V.raw('k:'+c.id).trim()?' '+c.unit:'')));}
  if(L.questions&&L.questions.length){H('Questions');L.questions.forEach((q,i)=>{out.push('');out.push((q.n!==undefined?q.n:i+1)+'. '+vlHtmlText(q.q).replace(/\n+/g,' '));if(q.fields)q.fields.forEach(f=>out.push('- '+vlHtmlText(f.label)+': '+R('q:'+q.id+':'+f.id)));else out.push(R('q:'+q.id));});}
  if(L.conclusion){H('Conclusion');out.push(vlHtmlText(L.conclusion.prompt));if(L.conclusion.cer){out.push('Claim: '+R('cer:claim'));out.push('Evidence: '+R('cer:evidence'));out.push('Reasoning: '+R('cer:reasoning'));}else out.push(R('concl'));}
  return out.join('\n').replace(/\n{3,}/g,'\n\n')+'\n';}
function vlFileName(sim){const V=sim.vlab,n=V.raw('name').trim();return (stripTags(V.lab.title)+(n?' - '+n:'')).replace(/[\\/:*?"<>|]+/g,'').replace(/\s+/g,' ').trim().slice(0,100)||'Virtual lab';}
function vlExportPdf(sim){const V=sim.vlab;if(!V)return;vlSave(sim);const html=vlReportHTML(sim,vlPng(V),false);let w=null;try{w=window.open('','_blank');}catch(e){w=null;}
  if(w){try{w.document.open();w.document.write(html);w.document.close();let done=false;const go=()=>{if(done)return;done=true;try{w.focus();w.print();}catch(e){}};
      if(w.document.readyState==='complete')setTimeout(go,300);else{w.addEventListener('load',()=>setTimeout(go,150));setTimeout(go,1500);}
      vlToast(sim,'Your report opened in a new tab. Choose Save as PDF as the printer.');return;}catch(e){try{w.close();}catch(e2){}}}
  vlOverlay(sim,html);}
function vlOverlay(sim,html){let o=document.querySelector('.vl-overlay');if(o)o.remove();o=el('div',{class:'vl-overlay',role:'dialog','aria-modal':'true','aria-label':'Your lab report'});
  o.innerHTML=`<div class="vl-ov-bar"><b>Your lab report</b><span class="row"><button type="button" class="btn primary" data-ov="print">Print or save as PDF</button><button type="button" class="btn" data-ov="close">Close</button></span></div><iframe class="vl-ov-frame" title="Your lab report"></iframe><p class="vl-ov-help">If printing does not open here, close this and use Download Word file.</p>`;
  document.body.appendChild(o);const fr=o.querySelector('iframe');fr.srcdoc=html;const close=()=>{o.remove();const b=sim.ui.nb.querySelector('[data-vl=pdf]');if(b)b.focus();};
  o.querySelector('[data-ov=print]').onclick=()=>{try{fr.contentWindow.focus();fr.contentWindow.print();}catch(e){o.querySelector('.vl-ov-help').textContent='Printing is blocked here. Close this and use Download Word file instead.';}};
  o.querySelector('[data-ov=close]').onclick=close;o.addEventListener('keydown',e=>{if(e.key==='Escape')close();});o.querySelector('[data-ov=print]').focus();return o;}
/* Word opens an HTML file saved as .doc; non-ASCII characters go in as entities so any import charset reads them */
function vlWordDoc(sim,png){return vlReportHTML(sim,png,true).replace(/<table class="who"/g,'<table width="100%" class="who"').replace(/<table class="data kv/g,'<table width="100%" border="1" cellspacing="0" cellpadding="5" class="data kv').replace(/<table class="data/g,'<table border="1" cellspacing="0" cellpadding="5" class="data').replace(/[^\x00-\x7f]/gu,c=>'&#'+c.codePointAt(0)+';');}
function vlExportDoc(sim){const V=sim.vlab;if(!V)return;vlSave(sim);const doc=vlWordDoc(sim,vlPng(V));
  try{const blob=new Blob([doc],{type:'application/msword'}),url=URL.createObjectURL(blob),a=el('a',{href:url,download:vlFileName(sim)+'.doc'});a.style.display='none';document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},4000);vlToast(sim,'Word file saved to your downloads. If nothing downloaded, use Copy as text.');}
  catch(e){vlToast(sim,'This page cannot download files here. Use Save as PDF or Copy as text.');}
  return doc;}
function vlExportTxt(sim){const V=sim.vlab;if(!V)return;const t=vlReportText(sim);
  const fb=()=>{const box=sim.ui.nb.querySelector('.vl-fallback');if(!box)return;const id=sim.def.id+'-vl-text';box.innerHTML=`<label class="vl-l" for="${id}">Your report as text. It is selected: press Ctrl+C (or ⌘C on a Mac) to copy it.</label><textarea class="vl-in vl-ta" id="${id}" rows="10" readonly></textarea>`;
    const ta=box.querySelector('textarea');ta.value=t;ta.focus();ta.select();vlToast(sim,'Selected. Press Ctrl+C to copy');};
  try{navigator.clipboard.writeText(t).then(()=>vlToast(sim,'Copied. Paste it into your Canvas submission.'),fb);}catch(e){fb();}return t;}
BL.openLab=openLab;BL.vlab={save:vlSave,report:sim=>sim.vlab?{html:vlReportHTML(sim,vlPng(sim.vlab),false),text:vlReportText(sim),png:vlPng(sim.vlab)}:null,overlay:sim=>sim.vlab?vlOverlay(sim,vlReportHTML(sim,vlPng(sim.vlab),false)):null,
  word:sim=>sim.vlab?vlWordDoc(sim,vlPng(sim.vlab)):null,check:vlCheck,go:vlGo,num:vlNum};

/* ---------- "Embed this tool in Canvas" panel ---------- */
function embedUrl(sim,o){let base=location.href.split('#')[0].split('?')[0].replace(/index\.html$/,'');const q=new URLSearchParams();q.set('embed','1');if(o.mode)q.set('mode',o.mode);if(o.mode==='vlab'&&o.lab)q.set('lab',o.lab);if(o.level)q.set('level',o.level);return base+'?'+q.toString()+'#'+sim.def.hash;}
function buildEmbed(sim){const box=sim.ui.sec.querySelector('.embed-b');if(!box||EMBED){const d=sim.ui.sec.querySelector('.embed-box');if(d&&EMBED)d.hidden=true;return;}const d=sim.def,id=d.id;
  const modes=[d.tour?['guided','Guided (walkthrough, then predictions)']:null,d.game?['game',(d.game.label||'Challenge')+' game']:null,['lab','Full lab'],d.labs&&d.labs.length?['vlab','Virtual lab (a teacher’s handout on the bench)']:null].filter(Boolean),labs=d.labs||[];
  box.innerHTML=`<p>Put this tool right inside a Canvas page, assignment or discussion. Students use it there with no login, and nothing they do leaves their device.</p>
  <div class="emb-opts"><label>Start in <select class="sel" data-e="mode">${modes.map(m=>`<option value="${m[0]}">${m[1]}</option>`).join('')}</select></label>
  ${labs.length>1?`<label data-e-lab hidden>Lab <select class="sel" data-e="lab"><option value="">Students choose</option>${labs.map(l=>`<option value="${esc(l.id)}">${esc(l.title)}</option>`).join('')}</select></label>`:''}
  <label>Detail <select class="sel" data-e="level"><option value="">Students choose (starts at Big picture)</option><option value="bio">Big picture</option><option value="honors">Closer look</option><option value="ap">Deep dive</option></select></label>
  <label>Height <select class="sel" data-e="h"><option value="900">Standard (900 px)</option><option value="1150">Tall (1150 px)</option><option value="720">Short (720 px)</option></select></label></div>
  <label class="emb-l" for="${id}-embcode">Embed code</label><textarea class="emb-code" id="${id}-embcode" readonly rows="3"></textarea>
  <div class="row"><button type="button" class="btn primary" data-e="copy">Copy embed code</button><button type="button" class="btn" data-e="copylink">Copy link</button><a class="btn" data-e="open" target="_blank" rel="noopener">Preview the embed</a><span class="toast emb-toast" hidden></span></div>
  <ol class="emb-steps">
  <li><b>Copy the embed code</b> with the red button above.</li>
  <li>In Canvas, open the page (or assignment or discussion) and click <b>Edit</b>.<img src="img/canvas-embed-1.jpg" alt="A Canvas page with the Edit button outlined" loading="lazy" width="800" height="300"></li>
  <li>Click where you want the tool in the text, then open <b>Insert</b> and choose <b>Embed</b>.<img src="img/canvas-embed-2.jpg" alt="The Canvas editor's Insert menu with Embed outlined" loading="lazy" width="800" height="460"></li>
  <li>Paste the code into the <b>Embed Code</b> box and click <b>Submit</b>.<img src="img/canvas-embed-3.jpg" alt="Canvas's Embed box with the code pasted in and Submit outlined" loading="lazy" width="800" height="430"></li>
  <li>Scroll down and click <b>Save</b> (or <b>Save &amp; Publish</b>). Students now see the tool right in the page.<img src="img/canvas-embed-4.jpg" alt="The bottom of the Canvas editor with the Save button outlined" loading="lazy" width="800" height="220"></li><li>Done. Students see the tool right on the page, without the site header, and can switch modes inside it.<img src="img/canvas-embed-5.jpg" alt="A published Canvas page with the projectile tool embedded" loading="lazy" width="800" height="701"></li></ol>
  <p class="help">Prefer a link? In a module, add an <b>External URL</b> with the copied link and tick <b>Load in a new tab</b>.</p>`;
  const get=k=>box.querySelector(`[data-e=${k}]`),code=get('mode')&&box.querySelector('.emb-code');
  if(hasGuide(sim))get('mode').value='guided';else get('mode').value='lab';
  const upd=()=>{const lb=box.querySelector('[data-e-lab]');if(lb)lb.hidden=get('mode').value!=='vlab';const url=embedUrl(sim,{mode:get('mode').value,level:get('level').value,lab:get('lab')?get('lab').value:(labs.length===1?labs[0].id:'')});const t=(d.tab||d.title).replace(/"/g,'&quot;');
    code.value=`<iframe src="${url}" title="${t} · ${LAB_NAME}" width="100%" height="${get('h').value}" style="border:0;max-width:1100px" allow="fullscreen" loading="lazy"></iframe>`;get('open').href=url;box._url=url;};
  ['mode','level','h','lab'].forEach(k=>{const e=get(k);if(e)e.addEventListener('change',upd);});upd();
  const toast=box.querySelector('.emb-toast'),say=m=>{toast.textContent=m;toast.hidden=false;clearTimeout(toast._h);toast._h=setTimeout(()=>{toast.hidden=true;},2400);};
  const copy=(txt,ok)=>{const fb=()=>{code.focus();code.select();say('Selected. Press Ctrl+C to copy');};try{navigator.clipboard.writeText(txt).then(()=>say(ok),fb);}catch(e){fb();}};
  get('copy').addEventListener('click',()=>copy(code.value,'Embed code copied'));get('copylink').addEventListener('click',()=>copy(box._url,'Link copied'));}
BL.setMode=setMode;BL.gameFire=gameFire;BL.gameNext=gameNext;BL.guideDone=guideDone;
BL.pause=sim=>setRunning(sim,false);BL.play=sim=>setRunning(sim,true);

function flash(sim,msg){const t=sim.ui.toast;if(!t)return;t.textContent=msg;t.hidden=false;clearTimeout(t._h);t._h=setTimeout(()=>{t.hidden=true;},2400);}
function saveTrials(sim){store.set(LAB_KEY+'-trials-'+sim.def.id,JSON.stringify(sim.trials));}
function trialCols(sim){return [...controlsVisible(sim).filter(c=>!c.noTrial).map(c=>({id:c.id,label:c.label+(c.unit&&c.type==='range'&&c.unit.trim()?' ('+c.unit.trim()+')':''),ctl:c,num:c.type==='range'})),
  ...metricsVisible(sim).filter(m=>!m.noTrial).map(m=>({id:m.id,label:m.label+(m.unit?' ('+m.unit+')':''),m,num:!m.text}))];}
function cellText(col,v){if(col.ctl){const s=fmtCtl(col.ctl,v);return col.ctl.unit&&col.ctl.type==='range'?s.slice(0,s.length-col.ctl.unit.length).trim():s;}return fmtNum(v,col.m.d);}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function renderTable(sim){if(!sim.ui.tbl)return;const cols=trialCols(sim);
  if(!sim.trials.length){sim.ui.tbl.innerHTML='<p class="empty">No trials yet. Set the variables, let the readings settle, then press Record trial.</p>';return;}
  sim.ui.tbl.innerHTML=`<div class="tbl-wrap"><table><thead><tr><th>Trial</th>${cols.map(c=>`<th>${c.label}</th>`).join('')}</tr></thead><tbody>${
    sim.trials.map(r=>`<tr><td>${r._n!==undefined?r._n:r.n}</td>${cols.map(c=>`<td>${esc(cellText(c,r[c.id]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function toCSV(sim){if(!sim.trials.length)return '';const cols=trialCols(sim),q=s=>/[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
  return [['Trial',...cols.map(c=>c.label)].map(q).join(','),...sim.trials.map(r=>[r._n!==undefined?r._n:r.n,...cols.map(c=>cellText(c,r[c.id]))].map(x=>q(String(x))).join(','))].join('\n');}

/* ---------- level-dependent refresh ---------- */
function applyLevel(sim){const ui=sim.ui,d=sim.def;
  ui.lede.textContent=lvText(d.lede);if(ui.uses){const P=d.practical,u=P&&P.uses?(Array.isArray(P.uses)?P.uses:lvText(P.uses)):null;const hk=P&&P.hook?lvText(P.hook):'';ui.uses.hidden=!(hk||(u&&u.length));ui.uses.innerHTML=(hk?'<p class="ru-q">'+hk+'</p>':'')+(u&&u.length?'<details class="ru-d"><summary>Where this shows up</summary><ul>'+u.map(x=>'<li>'+x+'</li>').join('')+'</ul></details>':'');}if(ui.scale)ui.scale.textContent=lvText(d.scale);
  if(ui.lab)ui.lab.innerHTML='<p class="lab-h">Investigation</p>'+lvText(d.lab);
  if(sim.tour&&sim.tour.on)tourExit(sim,'level');
  ui.sec.querySelectorAll('[data-lvl]').forEach(e=>{e.hidden=!atLeast(e.dataset.lvl)||(!!e.dataset.vlab&&sim.mode!=='vlab');if(e.tagName==='OPTION')e.disabled=!atLeast(e.dataset.lvl);});
  (d.controls||[]).forEach(c=>{let reset=!atLeast(c.lvl)&&sim.p[c.id]!==c.def;
    if(!reset&&c.options){const o=c.options.find(o=>o.v===sim.p[c.id]);if(o&&o.lvl&&!atLeast(o.lvl))reset=true;}
    if(reset){sim.p[c.id]=c.def;ui.ctl[c.id].set(c.def);if(c.onChange)c.onChange(sim);}});
  if(d.onLevel)d.onLevel(sim);
  if(ui.gm){const go=graphOptions(sim);ui.gm.innerHTML=go.map(g=>`<option value="${g.id}">${g.label}</option>`).join('');
    if(!go.find(g=>g.id===sim.gMetric))sim.gMetric=(go.find(g=>g.id===d.defaultGraph)||go[0]||{}).id;if(sim.gMetric)ui.gm.value=sim.gMetric;
    if(!go.length){sim.gmode='trials';const tb=ui.sec.querySelector('[data-g=trials]');tb.setAttribute('aria-checked','true');ui.sec.querySelector('[data-g=live]').hidden=true;ui.sec.querySelector('.g-live').hidden=true;ui.sec.querySelector('.g-trials').hidden=false;}
    else{const lb=ui.sec.querySelector('[data-g=live]');if(lb.hidden){lb.hidden=false;sim.gmode='live';lb.setAttribute('aria-checked','true');ui.sec.querySelector('[data-g=trials]').setAttribute('aria-checked','false');ui.sec.querySelector('.g-live').hidden=false;ui.sec.querySelector('.g-trials').hidden=true;}}
    const nc=trialCols(sim).filter(c=>c.num);const opts=nc.map(c=>`<option value="${c.id}">${c.label}</option>`).join('');ui.gx.innerHTML=opts;ui.gy.innerHTML=opts;
    if(nc.length){if(!nc.find(c=>c.id===sim.gx))sim.gx=nc[0].id;if(!nc.find(c=>c.id===sim.gy))sim.gy=(nc.find(c=>c.id===d.defaultGraph)||nc[nc.length-1]).id;ui.gx.value=sim.gx;ui.gy.value=sim.gy;}}
  sim.ch={idx:0,phase:'ask',pick:null,changed:false};renderChallenge(sim);renderTable(sim);sim.infoDirty=true;
  if(sim.mode)setMode(sim,sim.mode);
  if(sim.mode==='vlab'&&sim.vlab)vlabVis(sim);}

/* ---------- predict-then-test challenges ---------- */
function visibleCh(sim){const d=sim.def;const list=typeof d.challenges==='function'?d.challenges(sim):(d.challenges||[]);return list.filter(c=>atLeast(c.lvl));}
function explainFor(ch){if(typeof ch.explain==='string')return ch.explain;let out='';['bio','honors','ap'].forEach(l=>{if(ch.explain&&ch.explain[l]&&atLeast(l))out=ch.explain[l];});return out;}
function applyValues(sim,vals){for(const k in vals){sim.p[k]=vals[k];if(sim.ui&&sim.ui.ctl&&sim.ui.ctl[k])sim.ui.ctl[k].set(vals[k]);const c=(sim.def.controls||[]).find(c=>c.id===k);if(c&&c.onChange)c.onChange(sim);}sim.infoDirty=true;}
function runAction(sim,id){const a=(sim.def.actions||[]).find(a=>a.id===id);if(a)a.run(sim);sim.infoDirty=true;}
function renderChallenge(sim){const box=sim.ui.pred;if(!box)return;const list=visibleCh(sim),c=sim.ch;
  if(!list.length){box.innerHTML='<div class="p-head"><h3>Predict, then test</h3></div><p class="status">Choose more detail at the top of the page to see challenges for this simulation.</p>';return;}
  if(c.idx>=list.length)c.idx=0;const ch=list[c.idx];
  const head=`<div class="p-head"><h3>${sim.def.challengeTitle||'Predict, then test'}</h3><span class="count">${c.idx+1} of ${list.length}</span></div><p class="q">${ch.q}</p>`;
  if(c.phase==='ask'){box.innerHTML=head+`<div class="choices">${ch.choices.map((t,i)=>`<button type="button" class="choice" data-i="${i}">${t}</button>`).join('')}</div>`;
    box.querySelectorAll('.choice').forEach(b=>b.addEventListener('click',()=>startChallenge(sim,+b.dataset.i)));}
  else if(c.phase==='running'){box.innerHTML=head+`<p class="pick">Your prediction: <b>${ch.choices[c.pick]}</b></p><p class="status">${c.changed?(ch.changeText||'Changed')+'. Watch what happens.':'Holding steady first…'}</p><div class="prog"><i></i></div>`;}
  else{const ok=c.pick===ch.correct;box.innerHTML=head+`<p class="verdict ${ok?'ok':'no'}">${ok?(ch.instant?'Correct.':'Your prediction held up.'):(ch.instant?'Not quite.':'Not what you predicted.')}</p>${ok?'':`<p class="pick">${ch.instant?'Answer':'Result'}: <b>${ch.choices[ch.correct]}</b></p>`}<p class="explain">${explainFor(ch)}</p>
    <div class="row"><button type="button" class="btn" data-a="again">${ch.instant?'Try again':'Run it again'}</button>${c.idx<list.length-1?'<button type="button" class="btn primary" data-a="next">Next</button>':(sim.mode==='guided'?'<button type="button" class="btn primary" data-a="finish">Finish</button>':'<button type="button" class="btn primary" data-a="first">Start over</button>')}</div>`;
    box.querySelector('[data-a=again]').addEventListener('click',()=>{c.phase='ask';if(sim.def.onChallenge)sim.def.onChallenge(sim,list[c.idx],'ask');renderChallenge(sim);});
    const fin=box.querySelector('[data-a=finish]');if(fin)fin.addEventListener('click',()=>guideDone(sim));
    const nx=box.querySelector('[data-a=next],[data-a=first]');if(nx)nx.addEventListener('click',()=>{c.idx=nx.dataset.a==='next'?c.idx+1:0;c.phase='ask';const nl=visibleCh(sim);if(sim.def.onChallenge)sim.def.onChallenge(sim,nl[c.idx],'ask');renderChallenge(sim);});}}
function startChallenge(sim,pick){const ch=visibleCh(sim)[sim.ch.idx];sim.ch.pick=pick;
  if(ch.instant){sim.ch.phase='done';if(sim.def.onChallenge)sim.def.onChallenge(sim,ch,'done');renderChallenge(sim);return;}
  const base={};(sim.def.controls||[]).forEach(c=>base[c.id]=c.def);
  applyValues(sim,Object.assign(base,ch.baseline||{}));resetSim(sim);if(ch.baselineAction)runAction(sim,ch.baselineAction);sim.running=true;sim.ui.play.textContent='Pause';
  if(sim.ui.gm&&ch.watch){const go=graphOptions(sim),g=go.find(x=>x.id===ch.watch)||go.find(x=>!x.custom&&x.lines.includes(ch.watch));if(g){const lb=sim.ui.sec.querySelector('[data-g=live]');if(lb&&!lb.hidden)lb.click();sim.gMetric=g.id;sim.ui.gm.value=g.id;}}
  sim.ch.phase='running';sim.ch.changed=false;renderChallenge(sim);}
function challengeTick(sim){const c=sim.ch;if(c.phase!=='running')return;const d=sim.def,ch=visibleCh(sim)[c.idx];if(!ch){c.phase='ask';return;}
  const tc=ch.at!==undefined?ch.at:(d.chChange||0),tr=ch.reveal!==undefined?ch.reveal:(d.chReveal||1);
  if(!c.changed&&sim.t>=tc){if(ch.change)applyValues(sim,ch.change);if(ch.changeAction)runAction(sim,ch.changeAction);c.changed=true;renderChallenge(sim);}
  const bar=sim.ui.pred.querySelector('.prog i');if(bar)bar.style.width=clamp(sim.t/tr*100,0,100)+'%';
  if(sim.t>=tr){c.phase='done';renderChallenge(sim);}}

/* ---------- canvases ---------- */
function fit(cv,w,h){const dpr=Math.min(2,window.devicePixelRatio||1),W=Math.round(w*dpr),H=Math.round(h*dpr);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}return dpr;}
function drawStageTo(sim,cv,vdt,kOverride){const w=cv.clientWidth;if(!w)return;const asp=sim.def.aspect||16/9,LH=800/asp,h=w/asp;fit(cv,w,h);const ctx=cv.getContext('2d'),sc=cv.width/800;
  ctx.setTransform(sc,0,0,sc,0,0);ctx.clearRect(0,0,800,LH);const k=kOverride||clamp(720/w,1,1.8);ctx.save();sim.def.draw(sim,ctx,vdt,k,sim.vt);ctx.restore();drawFocus(sim,ctx,LH);}
function drawGraph(sim){if(sim.vlab&&sim.mode==='vlab')vlGraph(sim);const cv=sim.ui.graph;if(!cv)return;const W=cv.clientWidth,H=cv.clientHeight;if(!W)return;const dpr=fit(cv,W,H),ctx=cv.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);const box={L:66,T:12,W:W-66-14,H:H-12-40,cw:W,ch:H};
  if(sim.gmode==='live'){const o=graphOptions(sim).find(g=>g.id===sim.gMetric);if(!o){txt(ctx,'No graph for this level.',W/2,H/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
    if(o.custom){ctx.save();sim.def.plot(sim,ctx,box,o.id);ctx.restore();return;}
    const ms=o.lines.map(id=>metricById(sim,id)),win=sim.def.window||30,xmax=Math.max(win,sim.t),xmin=xmax-win;
    if(ms.length>1){box.T=34;box.H=H-34-40;}
    const series=ms.map(m=>{const xs=[],ys=[];sim.hist.forEach(r=>{if(r.t>=xmin-1e-9){const v=r.v[m.id];if(Number.isFinite(v)){xs.push(r.t);ys.push(v);}}});return {m,xs,ys};});
    const allY=[].concat(...series.map(s=>s.ys));let ymin,ymax;
    if(o.min!==undefined&&o.max!==undefined){ymin=o.min;ymax=o.max;}
    else if(ms.every(m=>m.fixed)){ymin=Math.min(...ms.map(m=>m.min));ymax=Math.max(...ms.map(m=>m.max));}
    else{const declMin=Math.min(...ms.map(m=>m.min!==undefined?m.min:0)),declMax=Math.max(...ms.map(m=>(m.max!==null&&m.max!==undefined)?m.max:0));
      const lo=Math.min(declMin,...allY),hi=Math.max(...allY,1e-6);ymin=lo;ymax=(declMax>0&&hi<=declMax)?declMax:Math.max(declMax,hi*1.1);}
    const unitY=o.yl||(ms.length===1?ms[0].label+(ms[0].unit?' ('+ms[0].unit+')':''):(ms[0].unit||''));
    const ax=axes(ctx,box,{xmin,xmax,ymin,ymax,xl:(sim.def.timeLabel||'Time')+' ('+(sim.def.unit||'s')+')',yl:unitY});
    if(sim.ch.phase!=='ask'&&sim.ch.changed){const ch=visibleCh(sim)[sim.ch.idx];const tc=ch&&ch.at!==undefined?ch.at:sim.def.chChange;const cx=ax.X(tc);if(cx>=box.L){ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx,box.T);ctx.lineTo(cx,box.T+box.H);ctx.stroke();ctx.setLineDash([]);txt(ctx,'change',cx+5,box.T+12,{s:12,c:PAL['muted']});}}
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    series.forEach((s,i)=>{if(s.xs.length<2)return;const col=serColor(i);
      if(series.length===1){ctx.beginPath();s.xs.forEach((x,j)=>{j?ctx.lineTo(ax.X(x),ax.Y(s.ys[j])):ctx.moveTo(ax.X(x),ax.Y(s.ys[j]));});ctx.lineTo(ax.X(s.xs[s.xs.length-1]),ax.Y(Math.max(ymin,0)));ctx.lineTo(ax.X(s.xs[0]),ax.Y(Math.max(ymin,0)));ctx.closePath();ctx.fillStyle=PAL['g-fill'];ctx.fill();}
      ctx.beginPath();s.xs.forEach((x,j)=>{j?ctx.lineTo(ax.X(x),ax.Y(s.ys[j])):ctx.moveTo(ax.X(x),ax.Y(s.ys[j]));});ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.stroke();
      ctx.fillStyle=col;ctx.beginPath();ctx.arc(ax.X(s.xs[s.xs.length-1]),ax.Y(s.ys[s.ys.length-1]),4.5,0,6.29);ctx.fill();});
    ctx.restore();
    if(series.length>1)legend(ctx,box.L,14,series.map((s,i)=>({label:s.m.label,color:serColor(i)})));}
  else{const cols=trialCols(sim),cx=cols.find(c=>c.id===sim.gx),cy=cols.find(c=>c.id===sim.gy);
    if(!cx||!cy||!sim.trials.length){txt(ctx,'Record trials, then choose what to plot on each axis.',W/2,H/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
    const xs=[],ys=[];sim.trials.forEach(r=>{const a=+r[cx.id],b=+r[cy.id];if(Number.isFinite(a)&&Number.isFinite(b)){xs.push(a);ys.push(b);}});
    if(!xs.length){txt(ctx,'Those columns have no numbers to plot.',W/2,H/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
    const rngOf=(arr,c)=>c.ctl?[c.ctl.min,c.ctl.max]:[Math.min(0,c.m.min!==undefined?c.m.min:0,...arr),Math.max((c.m.max!==null&&c.m.max!==undefined)?c.m.max:0,...arr)];
    let [xmin,xmax]=rngOf(xs,cx),[ymin,ymax]=rngOf(ys,cy);if(cy.m&&(cy.m.max===null||cy.m.max===undefined))ymax=Math.max(...ys,1)*1.1;if(cx.m&&(cx.m.max===null||cx.m.max===undefined))xmax=Math.max(...xs,1)*1.1;
    const ax=axes(ctx,box,{xmin,xmax,ymin,ymax,xl:cx.label,yl:cy.label});
    xs.forEach((x,i)=>{ctx.fillStyle=PAL['g-dot'];ctx.beginPath();ctx.arc(ax.X(x),ax.Y(ys[i]),5.5,0,6.29);ctx.fill();ctx.strokeStyle=PAL['card'];ctx.lineWidth=1.5;ctx.stroke();});}}
function updateReadouts(sim){allMetrics(sim).forEach(m=>{const v=m.get(sim),t=sim.ui.tiles[m.id];if(!t)return;t.num.textContent=fmtNum(v,m.d);
  if(t.bar)t.bar.style.width=(Number.isFinite(v)?clamp((v-(m.min||0))/(m.max-(m.min||0)),0,1)*100:0)+'%';});
  if(sim.ui.clock&&!sim.def.timeless)sim.ui.clock.textContent=clockText(sim);
  if(sim.ui.cap&&!sim.ui.cap.hidden){const n=sim.def.narrate(sim)||'';if(sim.ui.cap._t!==n){sim.ui.cap._t=n;sim.ui.cap.innerHTML=n;}}
  if(sim.ui.info&&sim.infoDirty){sim.infoDirty=false;sim.ui.info.innerHTML=sim.def.infoPanel(sim)||'';if(sim.def.bindInfo)sim.def.bindInfo(sim,sim.ui.info);}
  (sim.def.actions||[]).forEach(a=>{if(!a.enabled||!sim.ui.actB)return;const b=sim.ui.actB[a.id];if(!b)return;let on=true;try{on=!!a.enabled(sim);}catch(e){}if(b.disabled===on)b.disabled=!on;});
  if(sim.vlab)vlTick(sim);}
BL.refresh=function(sim){sim.infoDirty=true;updateReadouts(sim);drawGraph(sim);};
BL.setValues=applyValues;
BL.reset=function(sim){resetSim(sim);sim.ch.changed=false;};
BL.gotoChallenge=function(sim,i){sim.ch={idx:i,phase:'ask',pick:null,changed:false};renderChallenge(sim);};

/* ---------- router, landing page, loop ---------- */
let homeEl,simsEl,jumpEl,backEl;
function ensureBuilt(id){const sim=sims[id];if(sim.ui.sec)return sim;simsEl.appendChild(buildSim(sim));resetSim(sim);applyLevel(sim);buildModebar(sim);setMode(sim,(QMODE&&MODES.includes(QMODE)?QMODE:null)||store.get(modeKey(sim))||(hasGuide(sim)?'guided':'lab'));buildEmbed(sim);return sim;}
function show(hash){if(hash&&hash.indexOf('path-')===0){const id=hash.slice(5);if((BL.COURSES||[]).some(c=>c.id===id)||id==='topic'){browse=id;store.set(LAB_KEY+'-browse',browse);buildHome();}hash='';}
  const def=DEFS.find(d=>d.hash===hash);
  if(!def){active=null;homeEl.hidden=false;backEl.hidden=true;jumpEl.value='';DEFS.forEach(d=>{if(sims[d.id].ui.sec)sims[d.id].ui.sec.hidden=true;});document.title=LAB_NAME;drawThumbs();return;}
  const sim=ensureBuilt(def.id);active=sim;homeEl.hidden=true;backEl.hidden=false;jumpEl.value=def.hash;renderRelated(sim);
  DEFS.forEach(d=>{if(sims[d.id].ui.sec)sims[d.id].ui.sec.hidden=d.id!==def.id;});document.title=def.tab+' · '+LAB_NAME;
  window.scrollTo(0,0);requestAnimationFrame(()=>{updateReadouts(sim);drawGraph(sim);});}
function linkList(ids){return (ids||[]).map(id=>DEFS.find(d=>d.id===id||d.hash===id)).filter(Boolean);}
function renderRelated(sim){const box=sim.ui.sec.querySelector('.related');if(!box)return;const d=sim.def;
  const back=linkList(d.prereq),fwd=linkList(d.next),also=DEFS.filter(x=>x!==d&&(x.prereq||[]).includes(d.id)&&!(d.next||[]).includes(x.id));
  const nextAll=fwd.concat(also);let h='';
  if(back.length)h+=`<p class="rel-row"><span class="rel-l">Start with</span>${back.map(x=>`<a class="chip" href="#${x.hash}">${x.tab}</a>`).join('')}</p>`;
  if(nextAll.length)h+=`<p class="rel-row"><span class="rel-l">Go further</span>${nextAll.map(x=>`<a class="chip${x.apUnit===FURTHER?' adv':''}" href="#${x.hash}">${x.tab}</a>`).join('')}</p>`;
  box.innerHTML=h;box.hidden=!h;}
const thumbSims={};const thumbQueue=[];let thumbBusy=false;let thumbObs=null;
function thumbFor(d){let s=thumbSims[d.id];if(s)return s;s=makeSim(d);resetSim(s);if(d.thumbSetup)d.thumbSetup(s);thumbSims[d.id]=s;
  const LH=Math.round(800/(d.aspect||16/9));thumbCanvas.width=800;thumbCanvas.height=LH;const ctx=thumbCanvas.getContext('2d');const n=d.thumbFrames!==undefined?d.thumbFrames:24;
  for(let i=0;i<n;i++){if(!d.timeless){let dt=0.05*(d.timeScale||1);while(dt>1e-12){const h=Math.min(dt,d.dtMax||0.01);d.step(s,h);s.t+=h;dt-=h;}}else if(d.animated&&d.step){d.step(s,0.05);s.t+=0.05;}s.vt+=0.05;
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,800,LH);ctx.save();d.draw(s,ctx,0.05,1.3,s.vt);ctx.restore();}
  return s;}
function paintThumb(cv){const d=DEFS.find(x=>x.id===cv.dataset.sim);if(!d)return;try{const s=thumbFor(d);const LH=Math.round(800/(d.aspect||16/9));thumbCanvas.width=800;thumbCanvas.height=LH;
  const ctx=thumbCanvas.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,800,LH);ctx.save();d.draw(s,ctx,0,1.3,s.vt);ctx.restore();
  const w=cv.clientWidth||300,h=w*9/16;fit(cv,w,h);const c=cv.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cv.width,cv.height);
  const cropH=Math.min(LH,450),sy=(LH-cropH)/2;c.drawImage(thumbCanvas,0,sy,800,cropH,0,0,cv.width,cv.height);cv.dataset.painted='1';}catch(e){console.warn('thumb '+d.id,e);}}
function pumpThumbs(){if(thumbBusy)return;thumbBusy=true;const go=()=>{const cv=thumbQueue.shift();if(!cv){thumbBusy=false;return;}if(cv.isConnected&&!homeEl.hidden)paintThumb(cv);setTimeout(go,0);};go();}
function drawThumbs(force){const cvs=[...document.querySelectorAll('canvas.thumb')];
  if(!thumbObs&&'IntersectionObserver' in window){thumbObs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting&&(!e.target.dataset.painted||e.target._force)){e.target._force=false;thumbQueue.push(e.target);}});pumpThumbs();},{rootMargin:'300px'});}
  cvs.forEach(cv=>{if(force){cv.dataset.painted='';}if(thumbObs){thumbObs.unobserve(cv);thumbObs.observe(cv);}else{thumbQueue.push(cv);}});if(!thumbObs)pumpThumbs();}
const thumbCanvas=document.createElement('canvas');
let browse=store.get(LAB_KEY+'-browse')||'topic';
function sortSec(list,u){const ord=(BL.TOPIC_ORDER||{})[u]||[];const ix=d=>{const i=ord.indexOf(d.id);return i<0?1000+(d.order||0):i;};return list.slice().sort((a,b)=>ix(a)-ix(b));}
function card(d){return `<a class="card${d.apUnit===FURTHER?' adv':''}" href="#${d.hash}"><canvas class="thumb" data-sim="${d.id}" aria-hidden="true"></canvas><span class="card-b"><span class="card-t">${d.tab}</span><span class="card-d">${d.card||''}</span>${d.kind?`<span class="kind">${d.kind}</span>`:''}</span></a>`;}
/* A card that links to another site (e.g. a sister lab): {href,title,text,kind,label} */
function extCard(x){return `<a class="card adv ext${x.lesson?' lesson':''}" href="${x.href}"${x.lesson?' target="_blank" rel="noopener"':''}><span class="thumb ext-thumb" aria-hidden="true"><span>${x.label||x.title}</span></span><span class="card-b"><span class="card-t">${x.title} ↗</span><span class="card-d">${x.text||''}</span>${x.kind?`<span class="kind">${x.kind}</span>`:''}</span></a>`;}
function buildHome(){const units=document.getElementById('units');units.innerHTML='';const courses=BL.COURSES||[];
  const bw=document.getElementById('browse');
  if(bw){bw.innerHTML=['<button type="button" data-b="topic">By topic</button>'].concat(courses.map(c=>`<button type="button" data-b="${c.id}">${c.name}</button>`)).join('');
    bw.querySelectorAll('button').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.b===browse));b.onclick=()=>{browse=b.dataset.b;store.set(LAB_KEY+'-browse',browse);buildHome();drawThumbs();};});}
  const course=courses.find(c=>c.id===browse);
  if(course){const intro=el('p',{class:'lede course-lede'},course.blurb||'');units.appendChild(intro);
    course.units.forEach((u,i)=>{const list=linkList(u.ids),ext=u.links||[];if(!list.length&&!ext.length)return;const sec=el('section',{class:'unit'});
      sec.innerHTML=`<h3 class="unit-h"><span class="unit-n">${u.n||('Step '+(i+1))}</span> ${u.t}</h3>${u.note?`<p class="unit-note">${u.note}</p>`:''}<div class="cards">${ext.map(extCard).join('')}${list.map(card).join('')}</div>`;units.appendChild(sec);});
    const adv=linkList(course.further),ext=course.furtherLinks||[];if(adv.length||ext.length){const sec=el('section',{class:'unit further'});sec.innerHTML=`<h3 class="unit-h"><span class="unit-n">Go further</span> For students who want more</h3><p class="unit-note">Optional tools that go past what class time allows.</p><div class="cards">${adv.map(card).join('')}${ext.map(extCard).join('')}</div>`;units.appendChild(sec);}}
  else{const groups={};DEFS.forEach(d=>{(groups[d.apUnit]=groups[d.apUnit]||[]).push(d);});
    SECTIONS.forEach(u=>{const list=sortSec(groups[u]||[],u);if(!list.length)return;
      const sec=el('section',{class:'unit'+(u===FURTHER?' further':'')});sec.innerHTML=`<h3 class="unit-h"><span class="unit-n">${UNITS[u]&&UNIT_PREFIX?UNIT_PREFIX+' '+u:''}</span> ${secName(u)}</h3>${u===FURTHER?'<p class="unit-note">Optional, advanced tools for students who want to go past what class time allows.</p>':''}<div class="cards">${list.map(card).join('')}</div>`;units.appendChild(sec);});}
  const groups={};DEFS.forEach(d=>{(groups[d.apUnit]=groups[d.apUnit]||[]).push(d);});
  jumpEl.innerHTML='<option value="">All simulations</option>'+SECTIONS.map(u=>{const list=sortSec(groups[u]||[],u);if(!list.length)return '';return `<optgroup label="${secLabel(u)}">${list.map(d=>`<option value="${d.hash}">${d.tab}</option>`).join('')}</optgroup>`;}).join('');}

BL.start=function(){
  if(EMBED)document.documentElement.classList.add('embed');
  homeEl=document.getElementById('home');simsEl=document.getElementById('sims');jumpEl=document.getElementById('jump');backEl=document.getElementById('back');
  DEFS.forEach(d=>{applyPractical(d);sims[d.id]=makeSim(d);});
  readPal();buildHome();
  const lvlBtns=[...document.querySelectorAll('#lvl button')];
  const setLevel=l=>{level=l;store.set(LAB_KEY+'-level',l);lvlBtns.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.l===l)));DEFS.forEach(d=>{if(sims[d.id].ui.sec)applyLevel(sims[d.id]);});if(active){updateReadouts(active);drawGraph(active);}};
  setLevelFn=setLevel;BL.setLevel=setLevel;
  lvlBtns.forEach(b=>b.addEventListener('click',()=>setLevel(b.dataset.l)));setLevel(level);
  const vlFlush=()=>{DEFS.forEach(d=>{const s=sims[d.id];if(s&&s.vlab)vlSave(s);});};window.addEventListener('pagehide',vlFlush);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')vlFlush();});
  jumpEl.addEventListener('change',()=>{location.hash=jumpEl.value?'#'+jumpEl.value:'#home';});
  backEl.addEventListener('click',e=>{e.preventDefault();location.hash='#home';});
  window.addEventListener('hashchange',()=>show(location.hash.slice(1)));
  const repaint=()=>{readPal();if(active)drawGraph(active);else drawThumbs(true);};
  if(window.matchMedia)window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',repaint);
  new MutationObserver(repaint).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class']});
  let rT;window.addEventListener('resize',()=>{clearTimeout(rT);rT=setTimeout(()=>{if(!active)drawThumbs(true);else drawGraph(active);},150);});
  show(location.hash.slice(1));
  let last=performance.now(),acc=0;
  function frame(now){const rdt=Math.max(0,Math.min(0.05,(now-last)/1000));last=now;const sim=active;
    if(sim){const d=sim.def;const stepping=sim.stepLeft>0;if(stepping)sim.stepLeft-=rdt;const runs=(sim.running||stepping)&&(!d.timeless||d.animated);
      if(runs&&!d.timeless){let dt=rdt*(d.timeScale||1)*sim.speed;while(dt>1e-12){const h=Math.min(dt,d.dtMax||0.01);d.step(sim,h);sim.t+=h;dt-=h;}challengeTick(sim);sample(sim);}
      else if(runs&&d.timeless&&d.step){d.step(sim,rdt*sim.speed);sim.t+=rdt*sim.speed;challengeTick(sim);}
      else if(d.timeless){sim.t+=rdt;challengeTick(sim);}
      const vdt=(sim.running||stepping||d.timeless)?rdt*sim.speed:0;sim.vt+=vdt;drawStageTo(sim,sim.ui.stage,vdt);
      if(sim.game){gameTick(sim);}
      acc+=rdt;if(acc>0.1){acc=0;updateReadouts(sim);if(sim.mode!=='vlab'&&(sim.gmode==='live'||d.timeless))drawGraph(sim);if(sim.game)gameClock(sim);}}
    requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
};
})();
