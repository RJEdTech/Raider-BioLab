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
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
let level=store.get('rjbiolab-level');if(!(level in LV))level='honors';
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
  const d=c.d!==undefined?c.d:(c.step<1?(c.step<0.1?(c.step<0.01?3:2):1):0);return Number(v).toFixed(d)+(c.unit||'');}
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
  sec.innerHTML=`<div class="sim-head"><p class="eyebrow">${secLabel(d.apUnit)}</p><h2 id="h-${id}">${d.title}</h2><p class="lede"></p></div>
  <div class="bench">
    <div class="stage">${d.scale?`<p class="scale"></p>`:''}<canvas id="${id}-stage" style="aspect-ratio:${asp}" role="img" aria-label="${d.title} simulation"></canvas>
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
  <div class="related" hidden></div>`;
  const ui=sim.ui;ui.sec=sec;ui.lede=sec.querySelector('.lede');ui.stage=sec.querySelector('#'+id+'-stage');ui.graph=sec.querySelector('#'+id+'-graph');
  ui.clock=sec.querySelector('.clock');ui.play=sec.querySelector('[data-act=play]');ui.ctrls=sec.querySelector('.controls');ui.read=sec.querySelector('.readouts');
  ui.pred=sec.querySelector('.predict');ui.info=sec.querySelector('.info');ui.tbl=sec.querySelector('.tbl');ui.gm=sec.querySelector('#'+id+'-gm');ui.gx=sec.querySelector('#'+id+'-gx');ui.gy=sec.querySelector('#'+id+'-gy');
  ui.toast=sec.querySelector('.toast');ui.ctl={};ui.tiles={};ui.cap=sec.querySelector('.cap');ui.scale=sec.querySelector('.scale');ui.lab=sec.querySelector('.lab');
  ui.speedSel=sec.querySelector('#'+id+'-speed');ui.stepBtn=sec.querySelector('[data-act=step]');ui.tourbar=sec.querySelector('.tourbar');
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
    ui.ctrls.appendChild(w);ui.ctl[c.id].set(sim.p[c.id]);});
  if(d.actions&&d.actions.length){const row=el('div',{class:'actions'});d.actions.forEach(a=>{const b=el('button',{type:'button',class:'btn'+(a.primary?' primary':''),'data-lvl':a.lvl||'bio'},a.label);
    b.addEventListener('click',()=>{a.run(sim);sim.infoDirty=true;updateReadouts(sim);drawGraph(sim);});row.appendChild(b);});ui.ctrls.appendChild(row);}
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
    ui.tourbar.querySelector('[data-tour=exit]').addEventListener('click',()=>tourExit(sim));}
  sec.querySelector('[data-act=reset]').addEventListener('click',()=>{resetSim(sim);sim.ch.changed=false;if(sim.ch.phase==='running'){sim.ch.phase='ask';renderChallenge(sim);}updateReadouts(sim);drawGraph(sim);});
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
    sec.querySelector('[data-act=record]').addEventListener('click',()=>{const row={n:sim.trials.length+1};(d.controls||[]).forEach(c=>row[c.id]=sim.p[c.id]);allMetrics(sim).forEach(m=>row[m.id]=m.get(sim));
      sim.trials.push(row);saveTrials(sim);renderTable(sim);flash(sim,'Trial '+row.n+' recorded');if(sim.gmode==='trials')drawGraph(sim);});
    sec.querySelector('[data-act=clear]').addEventListener('click',()=>{sim.trials=[];saveTrials(sim);renderTable(sim);drawGraph(sim);});
    sec.querySelector('[data-act=copy]').addEventListener('click',()=>{const csv=toCSV(sim);if(!csv){flash(sim,'Record a trial first');return;}
      const fallback=()=>{let ta=sec.querySelector('.csv-fallback');if(!ta){ta=el('textarea',{class:'csv-fallback',readonly:'',id:id+'-csv','aria-label':'CSV data'});ui.tbl.after(ta);}ta.value=csv;ta.focus();ta.select();flash(sim,'Selected. Press Ctrl+C to copy');};
      try{navigator.clipboard.writeText(csv).then(()=>flash(sim,'Copied to clipboard'),fallback);}catch(e){fallback();}});
    try{const saved=JSON.parse(store.get('rjbiolab-trials-'+id)||'[]');if(Array.isArray(saved))sim.trials=saved;}catch(e){}}
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
function tourExit(sim){sim.tour={on:false,i:0};sim.ui.tourbar.hidden=true;if(sim.ui.cap)sim.ui.cap.hidden=false;setSpeed(sim,1);setRunning(sim,true);if(sim.def.onTourExit)sim.def.onTourExit(sim);}
function drawFocus(sim,ctx,LH){if(!sim.tour||!sim.tour.on)return;const s=tourSteps(sim)[sim.tour.i];if(!s||!s.focus)return;let f=typeof s.focus==='function'?s.focus(sim):s.focus;if(!f)return;
  const rects=Array.isArray(f[0])?f:[f];const sub=(x,y,w,h,r)=>{r=Math.min(r,w/2,h/2);ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();};
  ctx.save();ctx.beginPath();ctx.rect(0,0,800,LH);rects.forEach(r=>sub(r[0],r[1],r[2],r[3],10));ctx.fillStyle='rgba(10,10,14,.5)';ctx.fill('evenodd');
  ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;rects.forEach(r=>{rr(ctx,r[0],r[1],r[2],r[3],10);ctx.stroke();});ctx.restore();}
BL.h.lvText=lvText;
function flash(sim,msg){const t=sim.ui.toast;if(!t)return;t.textContent=msg;t.hidden=false;clearTimeout(t._h);t._h=setTimeout(()=>{t.hidden=true;},2400);}
function saveTrials(sim){store.set('rjbiolab-trials-'+sim.def.id,JSON.stringify(sim.trials));}
function trialCols(sim){return [...controlsVisible(sim).filter(c=>!c.noTrial).map(c=>({id:c.id,label:c.label+(c.unit&&c.type==='range'&&c.unit.trim()?' ('+c.unit.trim()+')':''),ctl:c,num:c.type==='range'})),
  ...metricsVisible(sim).filter(m=>!m.noTrial).map(m=>({id:m.id,label:m.label+(m.unit?' ('+m.unit+')':''),m,num:!m.text}))];}
function cellText(col,v){if(col.ctl){const s=fmtCtl(col.ctl,v);return col.ctl.unit&&col.ctl.type==='range'?s.slice(0,s.length-col.ctl.unit.length).trim():s;}return fmtNum(v,col.m.d);}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function renderTable(sim){if(!sim.ui.tbl)return;const cols=trialCols(sim);
  if(!sim.trials.length){sim.ui.tbl.innerHTML='<p class="empty">No trials yet. Set the variables, let the readings settle, then press Record trial.</p>';return;}
  sim.ui.tbl.innerHTML=`<div class="tbl-wrap"><table><thead><tr><th>Trial</th>${cols.map(c=>`<th>${c.label}</th>`).join('')}</tr></thead><tbody>${
    sim.trials.map(r=>`<tr><td>${r.n}</td>${cols.map(c=>`<td>${esc(cellText(c,r[c.id]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function toCSV(sim){if(!sim.trials.length)return '';const cols=trialCols(sim),q=s=>/[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
  return [['Trial',...cols.map(c=>c.label)].map(q).join(','),...sim.trials.map(r=>[r.n,...cols.map(c=>cellText(c,r[c.id]))].map(x=>q(String(x))).join(','))].join('\n');}

/* ---------- level-dependent refresh ---------- */
function applyLevel(sim){const ui=sim.ui,d=sim.def;
  ui.lede.textContent=lvText(d.lede);if(ui.scale)ui.scale.textContent=lvText(d.scale);
  if(ui.lab)ui.lab.innerHTML='<p class="lab-h">Investigation</p>'+lvText(d.lab);
  if(sim.tour&&sim.tour.on)tourExit(sim);
  ui.sec.querySelectorAll('[data-lvl]').forEach(e=>{e.hidden=!atLeast(e.dataset.lvl);if(e.tagName==='OPTION')e.disabled=!atLeast(e.dataset.lvl);});
  (d.controls||[]).forEach(c=>{let reset=!atLeast(c.lvl)&&sim.p[c.id]!==c.def;
    if(!reset&&c.options){const o=c.options.find(o=>o.v===sim.p[c.id]);if(o&&o.lvl&&!atLeast(o.lvl))reset=true;}
    if(reset){sim.p[c.id]=c.def;ui.ctl[c.id].set(c.def);if(c.onChange)c.onChange(sim);}});
  if(d.onLevel)d.onLevel(sim);
  if(ui.gm){const go=graphOptions(sim);ui.gm.innerHTML=go.map(g=>`<option value="${g.id}">${g.label}</option>`).join('');
    if(!go.find(g=>g.id===sim.gMetric))sim.gMetric=(go.find(g=>g.id===d.defaultGraph)||go[0]||{}).id;if(sim.gMetric)ui.gm.value=sim.gMetric;
    if(!go.length){sim.gmode='trials';const tb=ui.sec.querySelector('[data-g=trials]');tb.setAttribute('aria-checked','true');ui.sec.querySelector('[data-g=live]').hidden=true;ui.sec.querySelector('.g-live').hidden=true;ui.sec.querySelector('.g-trials').hidden=false;}
    const nc=trialCols(sim).filter(c=>c.num);const opts=nc.map(c=>`<option value="${c.id}">${c.label}</option>`).join('');ui.gx.innerHTML=opts;ui.gy.innerHTML=opts;
    if(nc.length){if(!nc.find(c=>c.id===sim.gx))sim.gx=nc[0].id;if(!nc.find(c=>c.id===sim.gy))sim.gy=(nc.find(c=>c.id===d.defaultGraph)||nc[nc.length-1]).id;ui.gx.value=sim.gx;ui.gy.value=sim.gy;}}
  sim.ch={idx:0,phase:'ask',pick:null,changed:false};renderChallenge(sim);renderTable(sim);sim.infoDirty=true;}

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
    <div class="row"><button type="button" class="btn" data-a="again">${ch.instant?'Try again':'Run it again'}</button>${c.idx<list.length-1?'<button type="button" class="btn primary" data-a="next">Next</button>':'<button type="button" class="btn primary" data-a="first">Start over</button>'}</div>`;
    box.querySelector('[data-a=again]').addEventListener('click',()=>{c.phase='ask';if(sim.def.onChallenge)sim.def.onChallenge(sim,list[c.idx],'ask');renderChallenge(sim);});
    const nx=box.querySelector('[data-a=next],[data-a=first]');nx.addEventListener('click',()=>{c.idx=nx.dataset.a==='next'?c.idx+1:0;c.phase='ask';const nl=visibleCh(sim);if(sim.def.onChallenge)sim.def.onChallenge(sim,nl[c.idx],'ask');renderChallenge(sim);});}}
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
function drawGraph(sim){const cv=sim.ui.graph;if(!cv)return;const W=cv.clientWidth,H=cv.clientHeight;if(!W)return;const dpr=fit(cv,W,H),ctx=cv.getContext('2d');
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
  if(sim.ui.info&&sim.infoDirty){sim.infoDirty=false;sim.ui.info.innerHTML=sim.def.infoPanel(sim)||'';if(sim.def.bindInfo)sim.def.bindInfo(sim,sim.ui.info);}}
BL.refresh=function(sim){sim.infoDirty=true;updateReadouts(sim);drawGraph(sim);};
BL.setValues=applyValues;
BL.reset=function(sim){resetSim(sim);sim.ch.changed=false;};
BL.gotoChallenge=function(sim,i){sim.ch={idx:i,phase:'ask',pick:null,changed:false};renderChallenge(sim);};

/* ---------- router, landing page, loop ---------- */
let homeEl,simsEl,jumpEl,backEl;
function ensureBuilt(id){const sim=sims[id];if(sim.ui.sec)return sim;simsEl.appendChild(buildSim(sim));resetSim(sim);applyLevel(sim);return sim;}
function show(hash){const def=DEFS.find(d=>d.hash===hash);
  if(!def){active=null;homeEl.hidden=false;backEl.hidden=true;jumpEl.value='';DEFS.forEach(d=>{if(sims[d.id].ui.sec)sims[d.id].ui.sec.hidden=true;});document.title='Raider BioLab';drawThumbs();return;}
  const sim=ensureBuilt(def.id);active=sim;homeEl.hidden=true;backEl.hidden=false;jumpEl.value=def.hash;renderRelated(sim);
  DEFS.forEach(d=>{if(sims[d.id].ui.sec)sims[d.id].ui.sec.hidden=d.id!==def.id;});document.title=def.tab+' · Raider BioLab';
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
let browse=store.get('rjbiolab-browse')||'topic';
function sortSec(list,u){const ord=(BL.TOPIC_ORDER||{})[u]||[];const ix=d=>{const i=ord.indexOf(d.id);return i<0?1000+(d.order||0):i;};return list.slice().sort((a,b)=>ix(a)-ix(b));}
function card(d){return `<a class="card${d.apUnit===FURTHER?' adv':''}" href="#${d.hash}"><canvas class="thumb" data-sim="${d.id}" aria-hidden="true"></canvas><span class="card-b"><span class="card-t">${d.tab}</span><span class="card-d">${d.card||''}</span>${d.kind?`<span class="kind">${d.kind}</span>`:''}</span></a>`;}
function buildHome(){const units=document.getElementById('units');units.innerHTML='';const courses=BL.COURSES||[];
  const bw=document.getElementById('browse');
  if(bw){bw.innerHTML=['<button type="button" data-b="topic">By topic</button>'].concat(courses.map(c=>`<button type="button" data-b="${c.id}">${c.name}</button>`)).join('');
    bw.querySelectorAll('button').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.b===browse));b.onclick=()=>{browse=b.dataset.b;store.set('rjbiolab-browse',browse);buildHome();drawThumbs();};});}
  const course=courses.find(c=>c.id===browse);
  if(course){const intro=el('p',{class:'lede course-lede'},course.blurb||'');units.appendChild(intro);
    course.units.forEach((u,i)=>{const list=linkList(u.ids);if(!list.length)return;const sec=el('section',{class:'unit'});
      sec.innerHTML=`<h3 class="unit-h"><span class="unit-n">${u.n||('Step '+(i+1))}</span> ${u.t}</h3>${u.note?`<p class="unit-note">${u.note}</p>`:''}<div class="cards">${list.map(card).join('')}</div>`;units.appendChild(sec);});
    const adv=linkList(course.further);if(adv.length){const sec=el('section',{class:'unit further'});sec.innerHTML=`<h3 class="unit-h"><span class="unit-n">Go further</span> For students who want more</h3><p class="unit-note">Optional tools that go past what class time allows.</p><div class="cards">${adv.map(card).join('')}</div>`;units.appendChild(sec);}}
  else{const groups={};DEFS.forEach(d=>{(groups[d.apUnit]=groups[d.apUnit]||[]).push(d);});
    SECTIONS.forEach(u=>{const list=sortSec(groups[u]||[],u);if(!list.length)return;
      const sec=el('section',{class:'unit'+(u===FURTHER?' further':'')});sec.innerHTML=`<h3 class="unit-h"><span class="unit-n">${UNITS[u]&&UNIT_PREFIX?UNIT_PREFIX+' '+u:''}</span> ${secName(u)}</h3>${u===FURTHER?'<p class="unit-note">Optional, advanced tools for students who want to go past what class time allows.</p>':''}<div class="cards">${list.map(card).join('')}</div>`;units.appendChild(sec);});}
  const groups={};DEFS.forEach(d=>{(groups[d.apUnit]=groups[d.apUnit]||[]).push(d);});
  jumpEl.innerHTML='<option value="">All simulations</option>'+SECTIONS.map(u=>{const list=sortSec(groups[u]||[],u);if(!list.length)return '';return `<optgroup label="${secLabel(u)}">${list.map(d=>`<option value="${d.hash}">${d.tab}</option>`).join('')}</optgroup>`;}).join('');}

BL.start=function(){
  homeEl=document.getElementById('home');simsEl=document.getElementById('sims');jumpEl=document.getElementById('jump');backEl=document.getElementById('back');
  DEFS.forEach(d=>{sims[d.id]=makeSim(d);});
  readPal();buildHome();
  const lvlBtns=[...document.querySelectorAll('#lvl button')];
  const setLevel=l=>{level=l;store.set('rjbiolab-level',l);lvlBtns.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.l===l)));DEFS.forEach(d=>{if(sims[d.id].ui.sec)applyLevel(sims[d.id]);});if(active){updateReadouts(active);drawGraph(active);}};
  lvlBtns.forEach(b=>b.addEventListener('click',()=>setLevel(b.dataset.l)));setLevel(level);
  jumpEl.addEventListener('change',()=>{location.hash=jumpEl.value?'#'+jumpEl.value:'#home';});
  backEl.addEventListener('click',e=>{e.preventDefault();location.hash='#home';});
  window.addEventListener('hashchange',()=>show(location.hash.slice(1)));
  const repaint=()=>{readPal();if(active)drawGraph(active);else drawThumbs(true);};
  if(window.matchMedia)window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',repaint);
  new MutationObserver(repaint).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class']});
  let rT;window.addEventListener('resize',()=>{clearTimeout(rT);rT=setTimeout(()=>{if(!active)drawThumbs(true);else drawGraph(active);},150);});
  show(location.hash.slice(1));
  let last=performance.now(),acc=0;
  function frame(now){const rdt=Math.min(0.05,(now-last)/1000);last=now;const sim=active;
    if(sim){const d=sim.def;const stepping=sim.stepLeft>0;if(stepping)sim.stepLeft-=rdt;const runs=(sim.running||stepping)&&(!d.timeless||d.animated);
      if(runs&&!d.timeless){let dt=rdt*(d.timeScale||1)*sim.speed;while(dt>1e-12){const h=Math.min(dt,d.dtMax||0.01);d.step(sim,h);sim.t+=h;dt-=h;}challengeTick(sim);sample(sim);}
      else if(runs&&d.timeless&&d.step){d.step(sim,rdt*sim.speed);sim.t+=rdt*sim.speed;challengeTick(sim);}
      else if(d.timeless){sim.t+=rdt;challengeTick(sim);}
      const vdt=(sim.running||stepping||d.timeless)?rdt*sim.speed:0;sim.vt+=vdt;drawStageTo(sim,sim.ui.stage,vdt);
      acc+=rdt;if(acc>0.1){acc=0;updateReadouts(sim);if(sim.gmode==='live'||d.timeless)drawGraph(sim);}}
    requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
};
})();
