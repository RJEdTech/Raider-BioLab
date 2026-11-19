(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,lvText,PAL,FONT,RM}=BioLab.h;
const M=window.MTN;
/* Mountain for sale: Paul Stearman's "Mountain Scenario" game, rebuilt for a Colorado mountain.
   Rules and numbers come from his handout (in thousands of dollars instead of CFA francs). Added here:
   rules the computer enforces, an automatic ledger, lynx that need forest, real spill chances, habitat breaks
   and corridors, a 20-year future, a class board, and real Colorado cases. */
const fk=M.fmtK,fk2=M.fmtK2;
const TOOLS=[{v:'look',l:'Look'},{v:'harvest',l:'Harvest'},{v:'mine',l:'Mine'},{v:'move',l:'Move'},{v:'protect',l:'Protect water'},{v:'corridor',l:'Corridor'}];
const ICON={tree:'🌲',deer:'🦌',lynx:'🐈'};
function opts(sim){return {spillPct:atLeast('ap')?sim.p.spillPct:M.DEFAULTS.spillPct,visitPct:atLeast('honors')?sim.p.visitPct:M.DEFAULTS.visitPct,
  leakPct:atLeast('ap')?sim.p.leakPct:M.DEFAULTS.leakPct,hunt:atLeast('honors')?!!sim.p.hunt:M.DEFAULTS.hunt};}
const G=sim=>sim.st.g;
const shown=sim=>sim.st.F?sim.st.F.st:sim.st.g;
function rnd(sim){const s=sim.st;s.rs=(s.rs||1)+1;return M.rngSeed((s.seed*31+s.rs*977)>>>0)();}
/* ---------- targets ---------- */
const TARGETS=[];
M.SLOTS.forEach(s=>TARGETS.push({v:'s'+s.i,l:s.zone+', spot '+s.n}));
M.VEINS.forEach(v=>TARGETS.push({v:'v'+v.i,l:v.name+(v.water?' (near the '+(v.water==='res'?'reservoir':'creek')+')':'')}));
M.WATER.forEach(w=>TARGETS.push({v:'w'+w.k,l:w.name}));
TARGETS.push({v:'ridge',l:'The bare ridge (between the slopes)'});
function segDist(px,py,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((px-a[0])*dx+(py-a[1])*dy)/(dx*dx+dy*dy),0,1);return Math.hypot(px-a[0]-t*dx,py-a[1]-t*dy);}
function nearestSlot(x,y,filter,r){let best=null,bd=r||22;M.SLOTS.forEach(s=>{if(filter&&!filter(s.i))return;const d=Math.hypot(x-s.x,y-(s.y-12));if(d<bd){bd=d;best=s.i;}});return best;}
function nearestVein(x,y,g){let best=null,bd=16;M.VEINS.forEach(v=>{if(g.veins[v.i])return;const d=segDist(x,y,v.a,v.b);if(d<bd){bd=d;best=v.i;}});return best;}
function waterAt(x,y){const w=M.WATER.find(w=>{const [x0,y0,x1,y1]=w.hit;return x>=x0-6&&x<=x1+6&&y>=y0-10&&y<=y1+10;});return w?w.k:null;}
function corridorPos(x,y){if(Math.abs(x-M.P.x)<70&&y<175)return M.RIDGE;const i=nearestSlot(x,y,null,40);return i==null?null:i;}
/* what a tap would do with the current tool */
function targetAt(sim,x,y){const g=G(sim),t=sim.p.tool,st=sim.st;
  if(t==='harvest'){const i=nearestSlot(x,y,j=>!!g.slots[j].o);return i==null?null:{k:'s',i};}
  if(t==='mine'){const v=nearestVein(x,y,g);return v==null?null:{k:'v',i:v};}
  if(t==='protect'){const w=waterAt(x,y);return w?{k:'w',w}:null;}
  if(t==='corridor'){const c=corridorPos(x,y);return c==null?null:{k:'c',c};}
  if(t==='move'){if(st.pick==null){const i=nearestSlot(x,y,j=>!!g.slots[j].o);return i==null?null:{k:'s',i};}const i=nearestSlot(x,y,null,26);return i==null?null:{k:'s',i};}
  const i=nearestSlot(x,y,null);if(i!=null)return {k:'s',i};const v=(()=>{let b=null,bd=16;M.VEINS.forEach(V=>{const d=segDist(x,y,V.a,V.b);if(d<bd){bd=d;b=V.i;}});return b;})();if(v!=null)return {k:'v',i:v};
  const w=waterAt(x,y);return w?{k:'w',w}:null;}
function fromTargetValue(val){if(!val)return null;if(val==='ridge')return {k:'c',c:M.RIDGE};const c=val[0],n=val.slice(1);if(c==='s')return {k:'s',i:+n};if(c==='v')return {k:'v',i:+n};if(c==='w')return {k:'w',w:n};return null;}
/* ---------- describe a target (for Look, hover and keyboard) ---------- */
function describe(sim,T){const g=G(sim),R=M.R;if(!T)return '';
  if(T.k==='s'){const s=g.slots[T.i],S=M.SLOTS[T.i];let h='<b>'+S.zone+', spot '+S.n+':</b> ';
    if(s.o)h+=M.NAME[s.o]+'. ';else h+=s.g==='pit'?'an open pit. Nothing can live here. ':s.g==='stump'?'stumps where spruce was cut. ':s.g==='sap'?'young spruce growing back. ':'open ground. ';
    if(s.o==='tree')h+='Harvest: +'+fk(R.tree.get)+', costs '+fk(R.tree.cost)+'. In a park: '+fk(R.parkVal.tree)+'. ';
    if(s.o==='deer')h+='Harvest (hunting season): +'+fk(R.deer.get)+'. In a park: '+fk(R.parkVal.deer)+'. ';
    if(s.o==='lynx')h+='Protected: worth $0 to harvest, '+fk(R.parkVal.lynx)+' in a park. Needs forest around it. ';
    if(S.water&&s.o==='tree')h+=g.protect[S.water]?'Near protected water. ':'Near the '+(S.water==='res'?'reservoir':'creek')+': cutting here risks a spill. ';
    if(M.inPark(g,T.i)&&g.park)h+='Inside your park.';return h;}
  if(T.k==='v'){const V=M.VEINS[T.i];let h='<b>'+V.name+':</b> '+(g.veins[T.i]?'already mined. ':'worth '+fk(R.vein.get)+', costs '+fk(R.vein.cost)+' to mine. ');
    if(!g.veins[T.i]){if(V.deep)h+='It is inside the dashed line, so it is mined by tunnel and the surface stays as it is. ';
      else{const live=V.above.filter(i=>g.slots[i].o).map(i=>M.NAME[g.slots[i].o]);h+='It is close to the surface, so the pit destroys what is right above it'+(live.length?': '+live.join(', ')+'. Move them first to save them. ':' (nothing alive there now). ');}
      if(V.water)h+=g.protect[V.water]?'The nearby water is protected.':'It is near the '+(V.water==='res'?'reservoir':'creek')+': mining it risks a spill.';}
    return h;}
  if(T.k==='w'){const w=M.WATER.find(x=>x.k===T.w);return '<b>'+w.name+':</b> '+w.note+' '+(g.protect[T.w]?'Protected.':'Not protected. Protecting it costs '+fk(R.protect)+'.')+(g.polluted[T.w]?' It has been polluted.':'');}
  if(T.k==='c')return T.c===M.RIDGE?'<b>The bare ridge:</b> deer and lynx rarely cross bare rock and snow, so the two slopes are separate habitats. A corridor across it costs '+fk(R.corridor)+'.':describe(sim,{k:'s',i:T.c});
  return '';}
/* ---------- doing things ---------- */
function snapshot(sim){const s=sim.st;s.undo.push(JSON.stringify(s.g));if(s.undo.length>40)s.undo.shift();}
function addRow(sim,row){const g=G(sim);g.log.push({a:row.a,b:row.b,c:row.c});if(row.spill)g.log.push({a:'Spill: pollution clean-up',b:0,c:M.R.spill});}
function fx(sim,x,y,text,col,ring){sim.st.fx.push({x,y,text,col:col||'#1b7339',t0:sim.st.clock,ring:ring||0});if(sim.st.fx.length>14)sim.st.fx.shift();}
function signed(v){return (v>=0?'+':'−')+fk(Math.abs(v));}
function act(sim,T){const st=sim.st,g=G(sim),o=opts(sim),t=sim.p.tool;if(!T)return;
  if(g.done&&t!=='look'){st.msg='Your plan is finished. Press <b>Play the next 20 years</b>, or Reset to start a new plan.';return;}
  if(t==='look'){st.msg=describe(sim,T);st.sel=T;return;}
  let r=null;const before=JSON.stringify(g),rng=()=>rnd(sim);
  if(t==='harvest'&&T.k==='s')r=M.harvest(g,T.i,o,rng);
  else if(t==='mine'&&T.k==='v')r=M.mine(g,T.i,o,rng);
  else if(t==='protect'&&T.k==='w')r=M.protect(g,T.w);
  else if(t==='corridor')r=M.corridor(g,T.k==='c'?T.c:T.k==='s'?T.i:-9);
  else if(t==='move'&&T.k==='s'){if(st.pick==null){if(!g.slots[T.i].o){st.msg='Tap an animal or a spruce stand to pick it up first.';return;}st.pick=T.i;st.msg='You picked up the '+M.NAME[g.slots[T.i].o]+'. Now tap an empty spot to put it down (costs '+fk(M.R.move[g.slots[T.i].o])+'). Tap it again to cancel.';return;}
    if(T.i===st.pick){st.pick=null;st.msg='Move cancelled.';return;}r=M.move(g,st.pick,T.i);if(r.ok)st.pick=null;}
  else{st.msg='That tool does nothing there. '+describe(sim,T);return;}
  if(!r.ok){st.msg=r.msg;return;}
  st.undo.push(before);if(st.undo.length>40)st.undo.shift();addRow(sim,r.row);
  const net=r.row.b-r.row.c;let m=r.row.a+': '+(r.row.b?'+'+fk(r.row.b)+' ':'')+(r.row.c?'− '+fk(r.row.c)+' ':'')+'= <b>'+signed(net)+'</b>.';
  const at=r.at||{x:400,y:200};fx(sim,at.x,at.y-26,signed(net),net>=0?'#1b7339':'#b3261e',1);
  if(r.destroyed&&r.destroyed.length){m+=' The vein was close to the surface, so the pit <b>destroyed '+r.destroyed.map(d=>'a '+M.NAME[d.o]).join(', ')+'</b> right above it.';r.destroyed.forEach(d=>fx(sim,M.SLOTS[d.i].x,M.SLOTS[d.i].y-30,'Destroyed','#b3261e',1));}
  else if(r.row.a.startsWith('Mine a deep'))m+=' It was deep, so a tunnel reached it and nothing on the surface was harmed.';
  if(r.spill){const wn=r.spill.w==='res'?'town reservoir':'trout creek';if(r.spill.hit){m+=' The '+wn+' was not protected, and the '+Math.round(r.spill.p*100)+'% chance came up: <b>a spill polluted it (−'+fk(M.R.spill)+' clean-up)</b>. A spill cannot be undone.';
      const w=M.WATER.find(x=>x.k===r.spill.w);fx(sim,w.cx,w.cy-18,'Spill −'+fk(M.R.spill),'#b3261e',1);st.undo=[];}
    else m+=' The '+wn+' was not protected. This time the '+Math.round(r.spill.p*100)+'% spill chance did not come up.';}
  if(r.lost&&r.lost.length){m+=' <b>'+r.lost.length+' lynx famil'+(r.lost.length>1?'ies':'y')+' left or starved:</b> each needs at least 2 spruce stands in its connected forest.';r.lost.forEach(i=>fx(sim,M.SLOTS[i].x,M.SLOTS[i].y-34,'Lynx gone','#b3261e',1));}
  if(r.kind==='ridge')m+=' Animals can now cross between the two slopes, so they share one habitat.';
  st.msg=m;st.sel=null;}
function undo(sim){const s=sim.st;if(!s.undo.length||G(sim).done)return;s.g=JSON.parse(s.undo.pop());s.pick=null;s.msg='Undone. Your cash is '+fk(s.g.cash)+' again.';}
function finishPlan(sim){const s=sim.st,g=G(sim);if(g.done)return;s.pick=null;const e=M.finish(g);
  if(e.park)g.log.push({a:'Park visitors pay for the populations in your park',b:e.park,c:0});g.log.push({a:'Pay back the bank loan',b:0,c:M.R.loan});
  s.msg='<b>Plan finished.</b> Cash '+fk(e.cash)+(e.park?' + park '+fk(e.park):'')+' − loan '+fk(M.R.loan)+' = <b>'+fk(e.net)+'</b>. '+e.lynx+' lynx, '+e.deer+' deer and '+e.tree+' spruce stands are left. Now press <b>Play the next 20 years</b>.';
  s.tab='future';fx(sim,400,40,'Net worth '+fk(e.net),e.net>=0?'#1b7339':'#b3261e',0);}
function startFuture(sim,newSeed){const s=sim.st,g=G(sim);if(!g.done)finishPlan(sim);if(newSeed)s.fseed=(s.fseed||1)+1;s.F=M.future(g,opts(sim),(s.seed*7+(s.fseed||1)*104729)>>>0);s.ffRun=true;s.ffAcc=0;s.tab='future';s.many=null;
  s.msg='<b>Year 0.</b> Watch what each year brings: park visitors, hunting licenses, deer moving in, lynx, and old mines leaking.';}
function runMany(sim){const s=sim.st,g=G(sim);if(!g.done)finishPlan(sim);s.many=M.manyFutures(g,opts(sim),100);s.tab='future';
  s.msg='<b>100 different futures</b> for the same plan: average net worth after 20 years '+fk(s.many.avg)+', from '+fk(s.many.min)+' to '+fk(s.many.max)+'. Lynx survived in '+Math.round(s.many.lynxAny*100)+'% of them.';}
/* ---------- the info panel ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function ledgerRows(g){let tot=M.R.loan;return g.log.map(r=>{tot+=r.b-r.c;return {...r,net:r.b-r.c,tot};});}
function ledgerHTML(sim){const s=sim.st,g=G(sim),rows=ledgerRows(g),self=!!sim.p.selfmath,pv=M.parkValue(g),nw=g.done?g.end.net:g.cash+pv-M.R.loan;
  let h=`<div class="mt-sum"><span><b>Cash</b> ${fk(g.cash)}</span><span><b>Park value</b> ${g.park?fk(pv):'no park yet'}</span><span><b>Loan to repay</b> ${fk(M.R.loan)}</span><span><b>Net worth</b> ${fk(nw)}</span></div>`;
  h+=`<div class="mt-scroll"><table class="mt-tbl"><thead><tr><th>Action</th><th class="n">Benefit</th><th class="n">Cost</th><th class="n">Net gain</th><th class="n">Total</th></tr></thead><tbody><tr><td>Start: bank loan</td><td class="n">–</td><td class="n">–</td><td class="n">–</td><td class="n">${fk2(M.R.loan)}</td></tr>`;
  rows.forEach((r,i)=>{const m=s.math[i]||{};let tot;if(!self||m.ok||m.shown)tot=fk2(r.tot)+(m.ok?' ✓':'');else tot=`<input class="mt-in" data-mi="${i}" inputmode="numeric" aria-label="Total after row ${i+1}, in thousands" value="${esc(m.v||'')}" placeholder="?">${m.bad?' <span class="mt-bad">✗</span>':''}`;
    h+=`<tr><td>${esc(r.a)}</td><td class="n">${r.b?fk2(r.b):'–'}</td><td class="n">${r.c?fk2(r.c):'–'}</td><td class="n">${(r.net<0?'−':'')+fk2(Math.abs(r.net))}</td><td class="n">${tot}</td></tr>`;});
  h+='</tbody></table></div>';
  if(!rows.length)h+='<p class="help">Every action you take adds a row here, just like the table in Paul Stearman’s original handout. Pick a tool and tap the mountain.</p>';
  if(self&&rows.length)h+=`<div class="row"><button type="button" class="btn" data-mcheck>Check my totals</button><span class="help">Type each total in thousands (for example, 4150). Every row: total before + benefit − cost.</span></div>`;
  return h;}
function rulesHTML(){const R=M.R;return `<ul class="mt-rules">
<li><b>Start:</b> a ${fk(R.loan)} bank loan. You cannot borrow more. At the end you pay it back, so you need to make more than you spend.</li>
<li><b>Harvest</b> ${ICON.tree} a spruce stand: +${fk(R.tree.get)}, costs ${fk(R.tree.cost)}. ${ICON.deer} a mule deer herd (hunting): +${fk(R.deer.get)}. ${ICON.lynx} Lynx are protected: $0.</li>
<li><b>Mine</b> a gold vein: +${fk(R.vein.get)}, costs ${fk(R.vein.cost)}. Veins <b>inside</b> the dashed line are deep: a tunnel reaches them and the surface is safe. Veins <b>outside</b> it are shallow: the pit destroys whatever is right above. Move things first to save them.</li>
<li><b>Water:</b> cutting spruce or mining near the reservoir or creek has a ${M.DEFAULTS.spillPct}% chance of a spill that costs ${fk(R.spill)} to clean up. <b>Protecting</b> a water body costs ${fk(R.protect)} and removes the risk.</li>
<li><b>Move</b> something to an empty spot: lynx ${fk(R.move.lynx)}, deer ${fk(R.move.deer)}, spruce stand ${fk(R.move.tree)}.</li>
<li><b>Park:</b> slide the two gates, then open it for ${fk(R.park)}. At the end each population inside earns: lynx ${fk(R.parkVal.lynx)}, deer ${fk(R.parkVal.deer)}, spruce ${fk(R.parkVal.tree)}. You cannot spend park money during the plan, and nothing inside can be harvested or mined.</li>
<li><b>Corridor:</b> ${fk(R.corridor)} to connect habitat across a break: the bare ridge, an open pit, or 3+ cleared spots in a row.</li>
<li><b>New in this version:</b> each lynx family needs at least ${M.TREES_PER_LYNX} spruce stands in its connected forest, or it leaves or starves.</li></ul>
<p class="help">Based on Paul Stearman’s “Mountain Scenario” game, which he first taught in Africa using CFA francs. This version keeps his numbers, read as thousands of dollars, and moves the mountain to Colorado.</p>`;}
function chartSVG(series,key,label,col,fmt){const W=520,H=170,L=58,B=26,T=12,Rt=10;const ys=series.map(p=>p[key]);let lo=Math.min(0,...ys),hi=Math.max(...ys,1);if(hi===lo)hi=lo+1;
  const X=y=>L+(W-L-Rt)*y/20,Y=v=>T+(H-T-B)*(1-(v-lo)/(hi-lo));let d='';series.forEach((p,i)=>{d+=(i?'L':'M')+X(p.y).toFixed(1)+','+Y(p[key]).toFixed(1);});
  const ticks=[lo,(lo+hi)/2,hi];return `<svg class="mt-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)} over 20 years"><text x="${L}" y="10" class="mt-ct">${esc(label)}</text>
${ticks.map(v=>`<line x1="${L}" x2="${W-Rt}" y1="${Y(v)}" y2="${Y(v)}" class="mt-grid"/><text x="${L-6}" y="${Y(v)+4}" text-anchor="end" class="mt-tk">${fmt(v)}</text>`).join('')}
${[0,5,10,15,20].map(y=>`<text x="${X(y)}" y="${H-8}" text-anchor="middle" class="mt-tk">${y}</text>`).join('')}<text x="${W-Rt}" y="${H-8}" text-anchor="end" class="mt-tk">years</text>
<path d="${d}" fill="none" stroke="${col}" stroke-width="2.6"/>${series.length?`<circle cx="${X(series[series.length-1].y)}" cy="${Y(series[series.length-1][key])}" r="4" fill="${col}"/>`:''}</svg>`;}
function futureHTML(sim){const s=sim.st,g=G(sim);if(!g.done&&!s.F)return '<p>When your plan is ready, press <b>Finish my plan</b>. Then <b>Play the next 20 years</b> to see what your choices do over time. Paul’s scoring stops at the end of the plan. Real mountains keep going.</p>';
  let h='';const F=s.F;
  if(F){const a=F.series[0],b=F.series[F.series.length-1];
    h+=`<p><b>Year ${F.year} of 20.</b> ${F.year<20?'Watch the map: each change is marked where it happens.':'This is one possible future. Chance decides spills and lynx survival, so press <b>Try a different future</b> to see another.'}</p>`;
    h+=`<div class="mt-scroll"><table class="mt-tbl"><thead><tr><th></th><th class="n">End of plan</th><th class="n">Year ${F.year}</th></tr></thead><tbody>
<tr><td>Net worth</td><td class="n">${fk(a.money)}</td><td class="n">${fk(b.money)}</td></tr>
<tr><td>${ICON.lynx} Lynx families</td><td class="n">${a.lynx}</td><td class="n">${b.lynx}</td></tr>
<tr><td>${ICON.deer} Mule deer herds</td><td class="n">${a.deer}</td><td class="n">${b.deer}</td></tr>
<tr><td>${ICON.tree} Spruce stands (full size)</td><td class="n">${a.tree}</td><td class="n">${b.tree}</td></tr>
<tr><td>Polluted water bodies</td><td class="n">${a.dirty}</td><td class="n">${b.dirty}</td></tr></tbody></table></div>`;
    h+=`<p class="help">Money in these ${F.year} years: park visitors +${fk(F.inc.park)}, hunting licenses +${fk(F.inc.hunt)}, acid drainage clean-up −${fk(F.inc.leak)}. Timber: none, because a spruce or lodgepole stand needs about a century to reach timber size again.</p>`;
    h+=chartSVG(F.series,'money','Net worth','var(--s3)',v=>fk(v));
    h+=chartSVG(F.series,'lynx','Lynx families','var(--s5)',v=>String(Math.round(v)));}
  if(s.many){const m=s.many;h+=`<h4>100 futures for this plan</h4><p>Average net worth after 20 years: <b>${fk(m.avg)}</b>. Middle 80% of futures: ${fk(m.p10)} to ${fk(m.p90)} (all: ${fk(m.min)} to ${fk(m.max)}). Lynx still living in <b>${Math.round(m.lynxAny*100)}%</b> of futures, ${m.lynxAvg.toFixed(1)} families on average. Mine leaks per future: ${m.leakAvg.toFixed(2)} on average.</p>`;
    if(atLeast('ap'))h+=`<p class="help">This is a Monte Carlo estimate: the same plan, played 100 times with different random draws. The average estimates the <b>expected value</b> of the plan, and the spread shows its risk. Two plans can have the same average and very different risk.</p>`;}
  if(atLeast('honors'))h+=`<p class="help"><b>These are assumptions, not facts:</b> park visitors bring ${opts(sim).visitPct}% of the park’s value each year${atLeast('ap')?', each mined vein near unprotected water leaks with a '+opts(sim).leakPct+'% chance each year':''}${opts(sim).hunt?', and each deer herd outside the park sells '+fk(M.R.hunt)+' of hunting licenses a year':''}. Change them in the controls and play again. Which plan wins can flip.</p>`;
  return h;}
function shareHTML(sim){const s=sim.st,g=G(sim);const ready=g.done;
  return `<p>Paul’s students pasted their map, their table and a paragraph onto a shared slide. Here it is quicker.</p>
<label class="mt-l" for="mt-name">Names in your group</label><input type="text" id="mt-name" class="mt-text" data-mname value="${esc(s.name)}" placeholder="First names" maxlength="60">
<label class="mt-l" for="mt-note">What did you do, and what did you learn? (a short paragraph)</label><textarea id="mt-note" class="mt-text" rows="4" data-mnote placeholder="We protected the creek first because…">${esc(s.note)}</textarea>
<div class="row"><button type="button" class="btn" data-mpng>Download my map (picture)</button><button type="button" class="btn" data-mcopy>Copy table and paragraph</button>${ready?'<button type="button" class="btn primary" data-mcode>Make my class board code</button>':''}</div>
${ready?'':'<p class="help">Finish your plan to make a class board code.</p>'}
${s.code?`<p class="help">Copy this code and paste it on the class board your teacher shares (<a href="mountainboard.html" target="_blank" rel="noopener">open the class board</a>):</p><textarea class="mt-text mt-code" rows="3" readonly>${esc(s.code)}</textarea><div class="row"><button type="button" class="btn" data-mcopycode>Copy the code</button><span class="toast mt-toast" hidden></span></div>`:'<span class="toast mt-toast" hidden></span>'}`;}
const REAL=[
 {t:'Gold King Mine, near Silverton (2015)',b:'An EPA crew working at this mine, abandoned since 1923, accidentally released about 3 million gallons of acidic mine water into Cement Creek. The Animas River ran orange through Durango and on into New Mexico and Utah.',g:'Mining near unprotected water can spill, and a spill cannot be undone.',src:[['EPA: Gold King Mine release','https://www.epa.gov/goldkingmine']]},
 {t:'Summitville Mine, San Juan Mountains',b:'An open-pit gold mine used cyanide to pull gold from crushed rock from 1986 to 1992. The company went bankrupt and left leaking ponds behind. The Alamosa River below could not support aquatic life, and taxpayers paid well over $100 million to clean it up. Colorado now runs the water treatment, about $2 million a year.',g:'Mine leaks in the 20-year future: one bad year of mining can cost money for decades.',src:[['CDPHE: Summitville Mine','https://cdphe.colorado.gov/hm/summitville-mine'],['CPR (2018)','https://cpr.org/2018/07/10/epa-tells-colorado-to-take-over-the-summitville-mine-cleanup']]},
 {t:'23,000 abandoned mines',b:'Colorado has about 23,000 abandoned mines and about 1,800 miles of streams harmed by mine pollution. Acid mine drainage forms when water and air reach sulfide rock, making acid that dissolves heavy metals.',g:'Every mined vein near water is a future risk unless the water is protected.',src:[['CDPHE: Mining and water quality','https://cdphe.colorado.gov/mining-and-water-quality']]},
 {t:'Cripple Creek & Victor Mine, Teller County',b:'Colorado still mines gold. This open-pit mine is the richest gold mine in the state’s history, and its permit requires it to reclaim (restore) the land after mining ends.',g:'Gold is real money and real jobs. The question is the cost you plan for.',src:[['Colorado DRMS: mined land reclamation','https://drms.colorado.gov/']]},
 {t:'Canada lynx come back (1999–2006)',b:'Colorado’s last known lynx was trapped near Vail in 1974. Colorado Parks and Wildlife released 218 lynx from Canada and Alaska between 1999 and 2006, and they established a breeding population in spruce-fir forests where snowshoe hares live. Lynx are still listed as endangered in Colorado.',g:'Lynx need forest: each family needs spruce stands around it.',src:[['CPW: Canada lynx','https://cpw.state.co.us/species/lynx']]},
 {t:'Highway 9 wildlife crossings, near Kremmling',b:'In 2015–2016 Colorado built two wildlife overpasses and five underpasses with fencing. Collisions with wildlife dropped about 90%, and cameras counted over 112,000 mule deer crossings in five years.',g:'Corridors reconnect habitat that a road, a pit or a clearing cuts apart.',src:[['CPW: Highway 9 crossings','https://cpw.state.co.us/hwy9']]},
 {t:'Mule deer below their goal',b:'Colorado Parks and Wildlife’s goal is about 560,000 mule deer. The latest estimate is under 450,000. Habitat loss, roads, disease and weather all play a part.',g:'With hunting licenses on, deer herds outside the park pay a little every year, a sustainable harvest, as long as their habitat stays.',src:[['CPW: Mule deer','https://cpw.state.co.us/muledeer']]},
 {t:'Denver’s water starts in the forest',b:'About 80% of Denver Water’s supply flows through Strontia Springs Reservoir. After the 1996 Buffalo Creek and 2002 Hayman fires, mud and debris washed in, and recovery cost Denver Water more than $27 million. Now its From Forests to Faucets partnership pays to keep the forests above its reservoirs healthy.',g:'Protecting water costs money up front. Cleaning it up later costs more.',src:[['Denver Water: Building a better forest','https://www.denverwater.org/tap/building-better-forest']]},
 {t:'Parks pay every year',b:'Rocky Mountain National Park had more than 4.5 million visitors in 2016, and they spent nearly $300 million in nearby towns that year. A mine’s gold is sold once. A park’s visitors come back every year.',g:'Park visitors in the 20-year future.',src:[['CPR (2017)','https://www.cpr.org/news/story/visitors-to-colorados-national-parks-spent-485m-in-2016']]}];
function realHTML(){return '<p>Every rule in this game has happened on a real Colorado mountain.</p>'+REAL.map(r=>`<div class="mt-case"><h4>${r.t}</h4><p>${r.b}</p><p class="mt-ing"><b>In the game:</b> ${r.g}</p><p class="help">Source: ${r.src.map(([n,u])=>`<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join(' · ')}</p></div>`).join('');}
function infoPanel(sim){const s=sim.st;const tabs=[['ledger','Your ledger'],['rules','Rules'],['future','20 years later'],['share','Share'],['real','Real Colorado']];
  let body=s.tab==='rules'?rulesHTML():s.tab==='future'?futureHTML(sim):s.tab==='share'?shareHTML(sim):s.tab==='real'?realHTML():ledgerHTML(sim);
  return `<style>${CSS}</style><div class="seg mt-tabs" role="tablist">${tabs.map(([k,l])=>`<button type="button" role="tab" data-mtab="${k}" aria-selected="${s.tab===k}" aria-checked="${s.tab===k}">${l}</button>`).join('')}</div><div class="mt-body">${body}</div>`;}
const CSS=`.mt-tabs{flex-wrap:wrap;margin-bottom:10px}.mt-body p,.mt-body li,.mt-body td{font-size:15px;line-height:1.5}.mt-body h4{margin:12px 0 4px;font-size:16px}
.mt-sum{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0 0 8px;font-size:15px}.mt-scroll{overflow-x:auto}.mt-tbl{border-collapse:collapse;width:100%;min-width:420px}
.mt-tbl th,.mt-tbl td{padding:4px 6px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}.mt-tbl th{font-size:14px;color:var(--muted)}.mt-tbl .n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.mt-in{width:86px;padding:3px 5px;font-size:15px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--fg);text-align:right}.mt-bad{color:var(--bad);font-weight:700}
.mt-rules{padding-left:18px;margin:0}.mt-rules li{margin:0 0 6px}.mt-chart{width:100%;max-width:560px;display:block;margin:8px 0}.mt-chart .mt-ct{font-size:13px;font-weight:700;fill:var(--fg)}
.mt-chart .mt-tk{font-size:11px;fill:var(--muted)}.mt-chart .mt-grid{stroke:var(--line);stroke-width:1}.mt-l{display:block;font-weight:600;margin:10px 0 4px;font-size:15px}
.mt-text{width:100%;box-sizing:border-box;padding:7px 9px;font-size:15px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg);font-family:inherit}.mt-code{font-family:ui-monospace,Consolas,monospace;font-size:12px}
.mt-case{border-left:4px solid var(--s3);padding:2px 0 2px 12px;margin:10px 0}.mt-case p{margin:4px 0}.mt-ing{color:var(--fg)}`;
function copy(text,el){const done=()=>{if(el){el.hidden=false;el.textContent='Copied';setTimeout(()=>{el.hidden=true;},1600);}};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(done,()=>{fallback();});else fallback();
  function fallback(){const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();try{document.execCommand('copy');done();}catch(e){}t.remove();}}
function plainSummary(sim){const s=sim.st,g=G(sim),rows=ledgerRows(g);let t='Mountain for sale (Raider BioLab)\n'+(s.name?'Names: '+s.name+'\n':'')+'\nAction\tBenefit\tCost\tNet gain\tTotal\nStart: bank loan\t-\t-\t-\t'+fk2(M.R.loan)+'\n';
  rows.forEach(r=>{t+=r.a+'\t'+(r.b?fk2(r.b):'-')+'\t'+(r.c?fk2(r.c):'-')+'\t'+(r.net<0?'-':'')+fk2(Math.abs(r.net))+'\t'+fk2(r.tot)+'\n';});
  if(g.done)t+='\nEnd of plan: net worth '+fk(g.end.net)+'; lynx '+g.end.lynx+', deer '+g.end.deer+', spruce stands '+g.end.tree+'\n';
  if(s.F&&s.F.year)t+='After '+s.F.year+' years: net worth '+fk(s.F.money)+'; lynx '+M.count(s.F.st,'lynx')+', deer '+M.count(s.F.st,'deer')+'\n';
  if(s.note)t+='\n'+s.note+'\n';return t;}
function bindInfo(sim,el){const s=sim.st;
  /* the ledger and 20-year tables are wide, so this tool's panel takes the full width */
  const low=el.closest('.lower');if(low)low.style.gridTemplateColumns='minmax(0,1fr)';
  el.querySelectorAll('[data-mtab]').forEach(b=>b.onclick=()=>{s.tab=b.dataset.mtab;sim.infoDirty=true;});
  el.querySelectorAll('[data-mi]').forEach(inp=>{inp.oninput=()=>{const i=+inp.dataset.mi;(s.math[i]=s.math[i]||{}).v=inp.value;};
    inp.onkeydown=e=>{if(e.key==='Enter'){checkMath(sim);}};});
  const ck=el.querySelector('[data-mcheck]');if(ck)ck.onclick=()=>checkMath(sim);
  const nm=el.querySelector('[data-mname]');if(nm)nm.oninput=()=>{s.name=nm.value;};
  const nt=el.querySelector('[data-mnote]');if(nt)nt.oninput=()=>{s.note=nt.value;};
  const toast=el.querySelector('.mt-toast');
  const png=el.querySelector('[data-mpng]');if(png)png.onclick=()=>{try{const a=document.createElement('a');a.href=sim.ui.stage.toDataURL('image/png');a.download='my-mountain-plan.png';document.body.appendChild(a);a.click();a.remove();}catch(e){}};
  const cp=el.querySelector('[data-mcopy]');if(cp)cp.onclick=()=>copy(plainSummary(sim),toast);
  const mc=el.querySelector('[data-mcode]');if(mc)mc.onclick=()=>{const F=s.F;s.code=M.encode(G(sim),s.name,Object.assign(F&&F.year?{y:F.year,m:Math.round(F.money),l:M.count(F.st,'lynx'),d:M.count(F.st,'deer'),t:M.count(F.st,'tree'),w:(F.st.polluted.res>0)+(F.st.polluted.creek>0)}:{},s.note?{tx:s.note.slice(0,700)}:{}));sim.infoDirty=true;};
  const cc=el.querySelector('[data-mcopycode]');if(cc)cc.onclick=()=>copy(s.code,toast);
  if(s.focusMi!=null){const f=el.querySelector('[data-mi="'+s.focusMi+'"]');if(f)f.focus();s.focusMi=null;}}
function checkMath(sim){const s=sim.st,rows=ledgerRows(G(sim));let first=null;rows.forEach((r,i)=>{const m=s.math[i];if(!m||m.ok||m.shown||m.v==null||m.v==='')return;
    const v=parseFloat(String(m.v).replace(/[^0-9.\-−]/g,'').replace('−','-'));if(Math.abs(v-r.tot)<0.5){m.ok=true;m.bad=false;}else{m.bad=true;m.tries=(m.tries||0)+1;if(m.tries>=3)m.shown=true;if(first==null)first=i;}});
  s.focusMi=first;s.msg=first==null?'Your totals check out.':'Row '+(first+1)+' is off. Start from the total in the row above it, add the benefit and subtract the cost. After 3 tries the answer is shown.';sim.infoDirty=true;}
/* ---------- drawing ---------- */
function colors(){const bg=PAL['cv-bg']||'#fff';const n=parseInt((bg[0]==='#'?bg.slice(1):'ffffff').padEnd(6,'f'),16);const lum=((n>>16)*0.3+(n>>8&255)*0.59+(n&255)*0.11);return {dark:lum<110,ink:PAL['cv-ink'],soft:PAL['cv-soft']};}
function hoverInfo(sim){const s=sim.st,g=G(sim),T=s.hov;if(!T||g.done)return null;const t=sim.p.tool,R=M.R;
  if(t==='harvest'&&T.k==='s'){const o=g.slots[T.i].o;if(!o)return null;if(o==='lynx')return {x:M.SLOTS[T.i].x,y:M.SLOTS[T.i].y,lines:['Lynx: protected ($0)'],bad:1};const S=M.SLOTS[T.i];
    const L=[M.NAME[o]+': +'+fk(R[o].get-R[o].cost)];if(o==='tree'&&S.water&&!g.protect[S.water])L.push(M.DEFAULTS.spillPct+'% spill risk');if(M.inPark(g,T.i)&&g.park)L.push('In your park: protected');return {x:S.x,y:S.y,lines:L};}
  if(t==='mine'&&T.k==='v'){const V=M.VEINS[T.i];const L=['Gold: +'+fk(R.vein.get-R.vein.cost)];const live=V.above.filter(i=>g.slots[i].o);if(live.length)L.push('Destroys '+live.length+' above it');else if(V.deep)L.push('Deep: tunnel, surface safe');
    if(V.water&&!g.protect[V.water])L.push(opts(sim).spillPct+'% spill risk');return {x:V.cx,y:V.cy,lines:L,ring:live};}
  if(t==='protect'&&T.k==='w'){const w=M.WATER.find(x=>x.k===T.w);return {x:w.cx,y:w.cy,lines:[g.protect[T.w]?w.name+': protected':'Protect '+w.short+': −'+fk(R.protect)]};}
  if(t==='move'&&T.k==='s'){const S=M.SLOTS[T.i],o=g.slots[T.i].o;if(s.pick==null)return o?{x:S.x,y:S.y,lines:['Pick up: '+M.NAME[o]]}:null;return {x:S.x,y:S.y,lines:[o?'Taken':'Put it here: −'+fk(R.move[g.slots[s.pick].o])]};}
  if(t==='corridor'&&T.k==='c'){const p=M.corrPt(T.c);return {x:p.x,y:p.y,lines:['Corridor: −'+fk(R.corridor)]};}
  return null;}
function draw(sim,ctx,vdt,k,t){const s=sim.st,C=colors(),st=shown(sim);s.clock=t;
  const ghost=!st.park&&!s.F?{a:Math.min(sim.p.parkA,sim.p.parkB)/100,b:Math.max(sim.p.parkA,sim.p.parkB)/100}:null;
  let pickPos=null;if(s.pick!=null&&s.mouse)pickPos={x:s.mouse.x,y:s.mouse.y+14};
  M.drawScene(ctx,st,C,{k,pick:s.F?null:s.pick,pickPos,ghostPark:ghost,t});
  // what the tool would hit
  const hi=hoverInfo(sim);if(hi&&!s.F){if(hi.ring)hi.ring.forEach(i=>{const S=M.SLOTS[i];ctx.strokeStyle='#b3261e';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(S.x,S.y-12,15,0,6.29);ctx.stroke();});
    ctx.strokeStyle=hi.bad?'#b3261e':'#1f6feb';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(hi.x,hi.y-(sim.p.tool==='mine'||sim.p.tool==='protect'?0:12),18,0,6.29);ctx.stroke();
    tip(ctx,hi.x,hi.y-40,hi.lines,k,C);}
  if(s.sel&&!s.F){const T=s.sel;let p=null;if(T.k==='s')p={x:M.SLOTS[T.i].x,y:M.SLOTS[T.i].y-12};else if(T.k==='v')p={x:M.VEINS[T.i].cx,y:M.VEINS[T.i].cy};else if(T.k==='w'){const w=M.WATER.find(x=>x.k===T.w);p={x:w.cx,y:w.cy};}else if(T.k==='c')p=M.corrPt(T.c);
    if(p){ctx.strokeStyle='#1f6feb';ctx.lineWidth=3;ctx.setLineDash([4,3]);ctx.beginPath();ctx.arc(p.x,p.y,19,0,6.29);ctx.stroke();ctx.setLineDash([]);}}
  // cash and trays
  const g=G(sim),money=s.F?s.F.money:g.cash;
  drawMoney(ctx,k,s.F?'Net worth':'Cash',fk(money),money<0);
  trays(ctx,k,g,C);
  if(s.F){const y=s.F.year;ctx.save();ctx.fillStyle='rgba(20,20,24,.72)';const kk=Math.min(k,1.3);rr(ctx,792-150*kk,8,150*kk,30*kk,8);ctx.fill();ctx.fillStyle='#fff';ctx.font='700 '+Math.round(16*kk)+'px '+FONT;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Year '+y+' of 20',792-75*kk,8+15*kk);ctx.restore();}
  // effects: rising labels with a ring at the cause
  const now=t;s.fx=s.fx.filter(f=>now-f.t0<3.2);s.fx.forEach(f=>{const a=now-f.t0,al=a<2.4?1:Math.max(0,1-(a-2.4)/0.8);ctx.save();ctx.globalAlpha=al;
    if(f.ring){ctx.strokeStyle=f.col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(f.x,f.y+20,14+a*10,0,6.29);ctx.stroke();}
    const fs=Math.round(13*Math.min(k,1.5));ctx.font='700 '+fs+'px '+FONT;const w=ctx.measureText(f.text).width+12;const yy=f.y-a*10,xx=clamp(f.x,w/2+4,800-w/2-4);
    ctx.fillStyle=C.dark?'rgba(25,27,32,.92)':'rgba(255,255,255,.94)';rr(ctx,xx-w/2,yy-fs,w,fs+8,6);ctx.fill();ctx.strokeStyle=f.col;ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle=f.col;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(f.text,xx,yy+1);ctx.restore();});}
function tip(ctx,x,y,lines,k,C){const fs=Math.round(12.5*Math.min(k,1.5));ctx.save();ctx.font='600 '+fs+'px '+FONT;const w=Math.max(...lines.map(l=>ctx.measureText(l).width))+14,h=lines.length*(fs+4)+8;
  const xx=clamp(x-w/2,4,796-w),yy=clamp(y-h,4,446-h);ctx.fillStyle=C.dark?'rgba(25,27,32,.95)':'rgba(255,255,255,.96)';rr(ctx,xx,yy,w,h,7);ctx.fill();ctx.strokeStyle='#1f6feb';ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle=C.ink;ctx.textAlign='left';ctx.textBaseline='top';lines.forEach((l,i)=>ctx.fillText(l,xx+7,yy+5+i*(fs+4)));ctx.restore();}
function drawMoney(ctx,k,label,val,neg){const kk=Math.min(k,1.4);ctx.save();ctx.font='700 '+Math.round(15*kk)+'px '+FONT;const text=label+': '+val;const w=ctx.measureText(text).width+20;
  ctx.fillStyle=neg?'#b3261e':'#1b5e33';rr(ctx,400-w/2,8,w,26*kk,13*kk);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,400,8+13*kk);ctx.restore();}
function trays(ctx,k,g,C){const kk=Math.min(k,1.3),fs=Math.round(12*kk);ctx.save();ctx.font='600 '+fs+'px '+FONT;ctx.textBaseline='middle';
  const row=(x,y,label,d,gold)=>{ctx.fillStyle=C.dark?'rgba(30,32,38,.85)':'rgba(255,255,255,.85)';rr(ctx,x,y,172*kk,24*kk,6);ctx.fill();ctx.fillStyle=C.ink;ctx.textAlign='left';ctx.fillText(label,x+6,y+12*kk);
    let xx=x+(label==='Lost'?42:72)*kk;[['tree',d.tree],['deer',d.deer],['lynx',d.lynx]].forEach(([o,n])=>{if(!n)return;M.drawOrg(ctx,o,xx+5*kk,y+21*kk,0.55*kk,false);ctx.fillStyle=C.ink;ctx.fillText('×'+n,xx+11*kk,y+12*kk);xx+=34*kk;});
    if(gold){ctx.fillStyle='#e0b42c';ctx.fillRect(xx,y+8*kk,10*kk,7*kk);ctx.fillStyle=C.ink;ctx.fillText('×'+gold,xx+13*kk,y+12*kk);}};
  row(8,8,'Harvested',g.harv,g.harv.gold);row(8,8+28*kk,'Lost',g.lost,0);ctx.restore();}
/* ---------- the definition ---------- */
const SIM={id:'mountain',hash:'mountain',apUnit:13,order:6.5,tab:'Mountain for sale',kind:'Simulation',prereq:['islandbio'],next:['commons','mining'],
  credit:{name:'Paul Stearman',short:'Paul Stearman (original game)'},
  card:'You own a Colorado mountain with gold, spruce forest, lynx and mule deer. Mine it, log it, make it a park, or mix all three, then see the next 20 years.',
  title:'Mountain for sale: gold, timber or a park?',
  lede:{bio:'You borrowed $2 million to buy a mountain in Colorado. It has gold in the rock, spruce forest, endangered lynx and mule deer, and a reservoir the town drinks from. Make money to pay back the bank, and decide what is left for the next 20 years.',
        honors:'Balance profit, species and clean water on one mountain. Then see how habitat breaks, corridors and park income change the long-term result.',
        ap:'Weigh one-time income against yearly income, and expected losses against the cost of prevention, then test your plan against 100 random futures.'},
  scale:'One Colorado mountain. Each picture is a whole population: a lynx family, a mule deer herd or a stand of spruce. Money is in thousands of dollars ($500K = $500,000).',
  aspect:16/9,timeless:true,animated:true,graph:false,controlsTitle:'Your tools',
  controls:[
    {id:'tool',label:'Tool',type:'seg',def:'look',lvl:'bio',options:TOOLS,help:'Pick a tool, then tap the mountain. Hover to see what it would do.',onChange(sim){sim.st.pick=null;sim.st.sel=null;sim.st.msg='';}},
    {id:'parkA',label:'Park gate 1',type:'range',min:0,max:100,step:1,def:58,unit:'%',lvl:'bio',help:'Slide the two gates. Everything between them becomes the park when you open it.'},
    {id:'parkB',label:'Park gate 2',type:'range',min:0,max:100,step:1,def:100,unit:'%',lvl:'bio'},
    {id:'target',label:'Or pick a spot (keyboard)',type:'select',def:'s0',lvl:'bio',options:TARGETS,help:'Then press “Use the tool here”.',onChange(sim){sim.st.hov=fromTargetValue(sim.p.target);sim.st.msg=describe(sim,sim.st.hov);}},
    {id:'selfmath',label:'I’ll do the math',type:'toggle',def:false,lvl:'bio',help:'Type each running total in the ledger yourself, like Paul’s paper table.'},
    {id:'visitPct',label:'Park visitors each year',type:'range',min:0,max:30,step:1,def:5,unit:'% of park value',lvl:'honors',help:'An assumption for the 20-year future.'},
    {id:'hunt',label:'Sell hunting licenses each year',type:'toggle',def:true,lvl:'honors',help:'Each deer herd outside the park sells '+fk(M.R.hunt)+' of licenses a year, a sustainable harvest.'},
    {id:'spillPct',label:'Spill chance per risky action',type:'range',min:0,max:100,step:5,def:30,unit:'%',lvl:'ap'},
    {id:'leakPct',label:'Old mine leak chance per year',type:'range',min:0,max:30,step:1,def:10,unit:'%',lvl:'ap'}],
  actions:[
    {id:'doit',label:'Use the tool here',lvl:'bio',run(sim){act(sim,fromTargetValue(sim.p.target));},enabled:sim=>!sim.st.F},
    {id:'undo',label:'Undo',lvl:'bio',run:undo,enabled:sim=>sim.st.undo.length>0&&!G(sim).done},
    {id:'openpark',label:'Open the park ('+fk(M.R.park)+')',lvl:'bio',run(sim){const g=G(sim),before=JSON.stringify(g),r=M.openPark(g,sim.p.parkA/100,sim.p.parkB/100);if(!r.ok){sim.st.msg=r.msg;return;}
      sim.st.undo.push(before);addRow(sim,r.row);const v=M.parkValue(g);sim.st.msg='Your park is open (−'+fk(M.R.park)+'). Right now its populations are worth <b>'+fk(v)+'</b> at the end. Nothing inside can be harvested or mined.';fx(sim,r.at.x,r.at.y-24,'Park opened','#1b7339',1);},
      enabled:sim=>!G(sim).park&&!G(sim).done},
    {id:'finish',label:'Finish my plan',lvl:'bio',primary:true,run:finishPlan,enabled:sim=>!G(sim).done},
    {id:'ff',label:'Play the next 20 years',lvl:'bio',primary:true,run(sim){startFuture(sim,false);},enabled:sim=>G(sim).done&&!sim.st.ffRun&&!(sim.st.F&&sim.st.F.year>=20)},
    {id:'again',label:'Try a different future',lvl:'bio',run(sim){startFuture(sim,true);},enabled:sim=>!!(sim.st.F&&sim.st.F.year>=20)},
    {id:'many',label:'Run 100 futures',lvl:'honors',run:runMany,enabled:sim=>G(sim).done}],
  init(sim){return {g:M.newState(),undo:[],fx:[],pick:null,hov:null,sel:null,msg:'',tab:'ledger',math:{},name:'',note:'',code:'',F:null,ffRun:false,ffAcc:0,many:null,seed:(Math.random()*1e9)>>>0,rs:0,clock:0,mouse:null};},
  step(sim,dt){const s=sim.st;if(!s.ffRun||!s.F)return;s.ffAcc+=dt;const per=RM?0.25:0.85;
    while(s.ffAcc>=per&&s.F.year<20){s.ffAcc-=per;const ev=M.yearTick(s.F,opts(sim),s.F.rng);
      ev.forEach(e=>fx(sim,e.x,e.y-10,e.text,e.kind==='leak'||e.kind==='lynx'?'#b3261e':e.kind==='deer'?'#8a5a12':'#1b7339',e.kind==='leak'||e.kind==='lynx'||e.kind==='deer'?1:0));
      const lk=ev.filter(e=>e.kind==='leak'),ly=ev.filter(e=>e.kind==='lynx'),dr=ev.filter(e=>e.kind==='deer');
      s.msg='<b>Year '+s.F.year+':</b> '+[ev.find(e=>e.kind==='park')?'park visitors paid '+fk(ev.find(e=>e.kind==='park').$):'',ev.find(e=>e.kind==='hunt')?'hunting licenses paid '+fk(ev.find(e=>e.kind==='hunt').$):'',
        dr.length?dr.length+' new deer herd'+(dr.length>1?'s':'')+' moved into open ground next to a herd':'',lk.length?'<b>an old mine leaked acid drainage into unprotected water (−'+fk(M.R.spill*lk.length)+')</b>':'',ly.length?'<b>'+ly.length+' lynx famil'+(ly.length>1?'ies':'y')+' disappeared</b>':''].filter(Boolean).join('; ')+'.';
      if(s.msg.endsWith(': .'))s.msg='<b>Year '+s.F.year+':</b> a quiet year. Saplings keep growing on the stumps.';
      sim.infoDirty=true;}
    if(s.F.year>=20){s.ffRun=false;s.msg='<b>20 years later:</b> net worth '+fk(s.F.money)+', '+M.count(s.F.st,'lynx')+' lynx families, '+M.count(s.F.st,'deer')+' deer herds. This was one future. Try a different one, or compare plans with your class.';sim.infoDirty=true;}},
  metrics:[
    {id:'cash',label:'Cash',unit:'',lvl:'bio',text:true,get:sim=>fk(G(sim).cash)},
    {id:'parkv',label:'Park value at the end',unit:'',lvl:'bio',text:true,get:sim=>G(sim).park?fk(M.parkValue(G(sim))):'No park'},
    {id:'net',label:'Net worth (after the loan)',unit:'',lvl:'bio',text:true,get:sim=>{const s=sim.st,g=G(sim);return fk(s.F?s.F.money:g.done?g.end.net:g.cash+M.parkValue(g)-M.R.loan);}},
    {id:'lynx',label:'Lynx families',unit:'',lvl:'bio',min:0,max:5,d:0,get:sim=>M.count(shown(sim),'lynx')},
    {id:'deer',label:'Mule deer herds',unit:'',lvl:'bio',min:0,max:12,d:0,get:sim=>M.count(shown(sim),'deer')},
    {id:'tree',label:'Spruce stands',unit:'',lvl:'bio',min:0,max:17,d:0,get:sim=>M.count(shown(sim),'tree')},
    {id:'gold',label:'Gold veins mined',unit:'',lvl:'bio',min:0,max:12,d:0,get:sim=>G(sim).harv.gold},
    {id:'water',label:'Water',unit:'',lvl:'bio',text:true,get:sim=>{const p=shown(sim).polluted;const n=(p.res>0)+(p.creek>0);return n?n+' polluted':'Clean';}},
    {id:'patches',label:'Separate habitat patches',unit:'',lvl:'honors',min:0,max:8,d:0,get:sim=>{const id=M.patches(shown(sim));return new Set(id.filter(x=>x>=0)).size;}}],
  infoPanel,bindInfo,draw,
  initVis(sim){const cv=sim.ui.stage;if(!cv||cv._mt)return;cv._mt=1;const pos=e=>{const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*800,y:(e.clientY-r.top)/r.height*450};};
    cv.addEventListener('pointermove',e=>{const p=pos(e);sim.st.mouse=p;sim.st.hov=targetAt(sim,p.x,p.y);});cv.addEventListener('pointerleave',()=>{sim.st.hov=null;sim.st.mouse=null;});},
  onClick(sim,x,y){if(sim.st.F)return;const T=targetAt(sim,x,y);if(!T){sim.st.msg=sim.p.tool==='look'?'Tap something on the mountain to read about it.':'Nothing for that tool there. '+hint(sim);return;}act(sim,T);},
  narrate(sim){const s=sim.st;if(s.msg)return s.msg;return hint(sim);},
  tour:[
    {title:'Your mountain',text:'This Colorado mountain is yours. Spruce forest covers the slopes up to treeline. <b>Canada lynx</b> (endangered in Colorado) hunt snowshoe hares in it, and <b>mule deer</b> graze the slopes and the meadow. Each picture is a whole population.',focus:[150,50,660,350],speed:0.3},
    {title:'The bank loan',text:'You start with a '+fk(M.R.loan)+' loan. Every action has a benefit and a cost, and the ledger below adds them up. At the end you must pay the bank back.',focus:[290,4,220,36],speed:0.3},
    {title:'Gold: deep or shallow?',text:'Gold veins are worth '+fk(M.R.vein.get)+' each. Veins inside the dashed line are deep, so a tunnel reaches them. Veins outside it are shallow, and the pit <b>destroys whatever lives right above</b>.',focus:[170,140,450,262],speed:0.3},
    {title:'The water',text:'The town drinks from the reservoir, and trout live in the creek. Cutting trees or mining near them can spill pollution ('+fk(M.R.spill)+'). Protecting a water body costs '+fk(M.R.protect)+' and removes the risk.',focus:[[0,372,180,78],[560,360,240,56]],speed:0.3},
    {title:'Lynx need forest',text:'Each lynx family needs at least 2 spruce stands in its connected forest. Cut too many trees around one and it leaves or starves. The bare ridge also splits the two slopes into separate habitats.',focus:[160,90,250,310],speed:0.3},
    {title:'The park',text:'Slide the two park gates and open a park for '+fk(M.R.park)+'. Every population inside pays at the end: lynx '+fk(M.R.parkVal.lynx)+', deer '+fk(M.R.parkVal.deer)+', spruce '+fk(M.R.parkVal.tree)+'. You will need to earn the money first.',focus:[400,180,400,230],speed:0.3},
    {title:'Then 20 years go by',text:'Finish your plan, then play the next 20 years. Gold is sold once, park visitors come every year, deer spread into open ground, old mines can leak, and lone lynx families can vanish.',focus:[150,40,660,370],speed:0.3}],
  challenges:[
    {lvl:'bio',instant:true,q:'You harvest one spruce stand far from any water. How much does your cash change?',choices:['+$450K','+$500K','+$550K'],correct:0,explain:'The stand sells for $500K, but cutting and hauling it costs $50K: 500 − 50 = +$450K. Check the ledger: every row is benefit minus cost.'},
    {lvl:'bio',instant:true,q:'A shallow gold vein (outside the dashed line) sits right under a lynx family. You mine it without moving the lynx first. What happens?',choices:['The lynx is destroyed with the pit','The lynx moves away safely','Nothing, since lynx are protected'],correct:0,explain:'A shallow vein is mined as an open pit, so everything right above it is destroyed. To save the lynx, move it first ($250K), which is much less than the $800K it would earn in a park.'},
    {lvl:'bio',instant:true,q:'The creek is not protected. You mine 2 veins next to it, and each has a 30% spill chance. Which is true?',choices:['It might spill, or it might not','It is sure to spill at least once','It cannot spill, since 30% is low'],correct:0,explain:'The chance of no spill is 0.7 × 0.7 = 0.49, so the chance of at least one spill is about 51%. It may or may not happen, which is what makes a risk tempting to ignore.'},
    {lvl:'honors',instant:true,q:'You clear 3 spruce stands in a row on the left slope. The 2 lynx families there now live on opposite sides of the clearing, each with 3 stands. What happens to them over the next 20 years?',choices:['Each is now alone and may vanish','Nothing: each still has 3 stands','Both move down to the meadow'],correct:0,explain:'Each has enough trees, but the clearing splits the forest into two patches, so each family is alone. In the model a lone family has an 8% chance each year of vanishing (no mates nearby). A corridor across the clearing reconnects them.'},
    {lvl:'honors',instant:true,q:'With licenses on, a deer herd outside the park sells $10K of hunting licenses every year. Over 20 years, how does that compare with harvesting the herd once for $50K?',choices:['$200K over 20 years vs. $50K once','$50K either way, so no difference','The one-time harvest pays more'],correct:0,explain:'20 × $10K = $200K, four times the one-time harvest, as long as the habitat stays. That is a sustainable yield: hunters take only what the herd replaces each year.'},
    {lvl:'ap',instant:true,q:'Protecting the creek costs $500K. You plan 3 risky actions next to it, each with a 30% chance of a $1M spill. Using expected value, should you protect it?',choices:['Yes: expected loss is about $900K','No: expected loss is only $300K','It makes no difference at all'],correct:0,explain:'Expected loss = 3 × 0.30 × $1,000K = $900K, which is more than $500K. The answer can flip: with only one risky action the expected loss is $300K. Expected value is also only an average, and one spill can still happen.'},
    {lvl:'ap',instant:true,q:'A park holding populations worth $6M earns 10% of that from visitors each year. A vein you could mine instead nets $750K once. Over 20 years, what does the park earn from visitors?',choices:['$12M','$6M','$750K'],correct:0,explain:'0.10 × $6,000K × 20 years = $12,000K. One-time income is compared with a stream of yearly income. Economists would also discount future dollars, which shrinks the park’s lead but rarely erases it over 20 years.'}],
  lab:{bio:`<p><b>Question:</b> Can you pay back the bank and still leave the mountain alive?</p><ol><li>Read the <b>Rules</b> tab. Plan with your partner before you tap.</li><li>Make your plan. The ledger fills in each row (or turn on <b>I’ll do the math</b> and fill in the totals yourself).</li><li>Press <b>Finish my plan</b>, then <b>Play the next 20 years</b>.</li><li>Press <b>Record trial</b> to save your result, then press Reset and try a very different plan (all gold, or a big park).</li></ol><p><b>Write:</b> a short paragraph on what you did and one lesson. Put it in the <b>Share</b> tab with your map and table.</p>`,
    honors:`<p><b>Question:</b> Which plan does best on money <i>and</i> on lynx after 20 years?</p><ol><li>Make a plan and record it. Then make a second plan that changes one thing, such as protecting the water, adding a corridor or moving the park gates.</li><li>For each plan, press <b>Run 100 futures</b> and record the average net worth and the percent of futures where lynx survive.</li><li>Change the park visitor assumption to 0% and to 15%. Does the best plan change?</li></ol><p><b>Write:</b> which plan you would choose and why, using numbers from both plans.</p>`,
    ap:`<p><b>Question:</b> How do risk and time change the best land-use plan?</p><ol><li>Build two plans with similar net worth at the end of the plan: one gold-heavy, one park-heavy.</li><li>Run 100 futures for each. Record the average, the middle-80% range and lynx survival.</li><li>Find the spill chance at which protecting the creek stops being worth its $500K for your plan. Show the expected-value calculation.</li></ol><p><b>CER:</b> Claim which plan is better for the owner and for the ecosystem, with evidence from your runs and reasoning about expected value, sustainable yield and habitat fragmentation.</p>`},
  terms:[
    {lvl:'bio',t:'Endangered species',d:'A species at risk of disappearing. Canada lynx are listed as endangered in Colorado and threatened under the federal Endangered Species Act.'},
    {lvl:'bio',t:'Habitat',d:'The place a population finds what it needs. Lynx need snowy spruce-fir forest, where their main prey, snowshoe hares, live.'},
    {lvl:'bio',t:'Reclamation',d:'Restoring land after mining: filling pits, replacing soil and replanting. Colorado requires mines to plan and pay for it.'},
    {lvl:'bio',t:'Acid mine drainage',d:'Acidic water, full of dissolved metals, that flows from mines when air and water reach sulfide rock. It turns streams orange.'},
    {lvl:'honors',t:'Habitat fragmentation',d:'Breaking one habitat into smaller, separate patches (by pits, clearings or roads). Small, isolated populations are more likely to vanish.'},
    {lvl:'honors',t:'Wildlife corridor',d:'A strip of habitat, overpass or underpass that lets animals move between patches.'},
    {lvl:'honors',t:'Sustainable yield',d:'A harvest that a population can replace each year, so it can go on forever.'},
    {lvl:'honors',t:'Ecosystem services',d:'Benefits people get from nature, such as clean water from forested watersheds and income from visitors.'},
    {lvl:'ap',t:'Expected value',d:'The average result of a risky choice: the sum of each outcome times its probability.'},
    {lvl:'ap',t:'Monte Carlo simulation',d:'Running a model many times with random draws to see the range of possible outcomes.'}],
  about:`<p><b>Where this comes from.</b> Paul Stearman built the original “Mountain Scenario” for his biology students when he taught in Africa. Students edited a drawing of a mountain, kept a cost table by hand and shared results on a class slide. This version keeps his rules and numbers (read as thousands of dollars instead of CFA francs) and moves the mountain to Colorado.</p>
<p><b>What the computer adds.</b> Rules are enforced and the ledger is automatic (or checked, with “I’ll do the math”). Spill chances are real random draws. Lynx need forest (at least ${M.TREES_PER_LYNX} spruce stands per family in their connected patch). The ridge, open pits and 3+ cleared spots in a row split habitat, and corridors reconnect it. A 20-year future adds park visitors (a share of the park’s value each year), hunting licenses for deer outside the park (${fk(M.R.hunt)} per herd a year), deer spreading into open ground next to a herd (7% a year, 14% on regrowing clearings), lone lynx families vanishing (8% a year), and old mines near unprotected water leaking (10% a year, ${fk(M.R.spill)} each).</p>
<p><b>What is simplified.</b> All money values are illustrative, not real prices, and real lynx home ranges cover many square miles. Real mines need permits and reclamation bonds, and federal law protects lynx habitat, so destroying a lynx population would be illegal. Timber takes about a century to regrow to harvest size, so the 20-year future has no second harvest. Future dollars are not discounted.</p>
<p><b>Sources:</b> Colorado Parks and Wildlife (lynx, mule deer, Highway 9 crossings), EPA (Gold King Mine), CDPHE (Summitville, mining and water quality), Denver Water (From Forests to Faucets), Colorado Public Radio (park visitor spending). Links are in the Real Colorado tab.</p>`};
function hint(sim){const t=sim.p.tool,g=G(sim);if(g.done&&!sim.st.F)return 'Plan finished. Press <b>Play the next 20 years</b>.';
  return {look:'Start with the <b>Rules</b> tab below. Then pick a tool on the right and tap the mountain. With <b>Look</b>, tap anything to learn about it.',
    harvest:'<b>Harvest:</b> tap a spruce stand (+'+fk(M.R.tree.get)+', costs '+fk(M.R.tree.cost)+') or a mule deer herd (+'+fk(M.R.deer.get)+'). Lynx are protected.',
    mine:'<b>Mine:</b> tap a gold vein (+'+fk(M.R.vein.get)+', costs '+fk(M.R.vein.cost)+'). Shallow veins (outside the dashed line) destroy what is right above them.',
    move:'<b>Move:</b> tap an animal or a spruce stand to pick it up, then tap an empty spot.',
    protect:'<b>Protect water:</b> tap the reservoir or the creek ('+fk(M.R.protect)+') to remove the spill risk there.',
    corridor:'<b>Corridor:</b> tap the bare ridge, an open pit or a clearing to connect habitat across it ('+fk(M.R.corridor)+').'}[t]||'';}
BioLab.register(SIM);
})();
