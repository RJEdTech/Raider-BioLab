/* Story: "Why does an egg white turn solid and white?"  Proteins, told as one story: folded chains, heat that unfolds them,
   oily parts that stick together, and a tangle big enough to bounce light. Written Nov 24, 2026, on the story kit.
   True to the real thing: raw egg white is about 88% water and 10% protein; its proteins are folded balls a few nanometers
   across, about 100 times smaller than a wave of light, spread evenly, so light passes and the white looks clear. Egg white
   starts to set near 62 °C (ovotransferrin unfolds first) and its main protein, ovalbumin, unfolds near 80 °C. Unfolded chains
   show their oily (water-fearing) parts, which stick to the oily parts of other chains: a tangled net that traps the water
   (a gel, so it is solid) with clumps large enough to scatter light (so it is white). Cooling does not refold them.
   Simplified: each protein is drawn as a short chain of 27 beads (one bead = one amino acid, 0.38 nm apart); real egg-white
   proteins are chains of about 400. Hydrogen and the water between the proteins are mostly left out. */
(function(){
'use strict';
const {clamp,lerp,ease,rr,txt,pill}=Story.h,G=View3D.G;
const W=1200,H=600;
const C={ink:'#26262b',soft:'#62626a',rj:'#C11430',good:'#1b7339',oil:'#df9a1b',wet:'#2f8f6a',pan:'#3c3f45',yolk:'#f2b51e',white:'#fbfbf7',sol:'#eef3f6',heat:'#d4542a',light:'#f7d24a'};
/* ---------- the protein model ---------- */
function rng(a){return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const SP=.38;
/* folded: a path through a 3×3×3 block, so the chain packs into a ball; the 7 beads at the middle are the oily ones */
const FOLD=[];for(let z=0;z<3;z++){const ys=z%2?[2,1,0]:[0,1,2];for(const y of ys){const xs=((z*3+(z%2?2-y:y))%2)?[2,1,0]:[0,1,2];for(const x of xs)FOLD.push([(x-1)*SP,(y-1)*SP,(z-1)*SP]);}}
const OILY=FOLD.map(p=>Math.hypot(p[0],p[1],p[2])<SP*1.05);
FOLD.forEach((p,i)=>{if(!OILY[i]){p[0]*=1.16;p[1]*=1.16;p[2]*=1.16;}});      // water-loving beads sit a little outward, oily ones tucked in
function coil(seed){const r=rng(seed),P=[[0,0,0]];let d=G.norm([r()-.5,r()-.5,r()-.5]);
  for(let i=1;i<FOLD.length;i++){let nd;do{nd=G.norm(G.add(d,G.mul([r()-.5,r()-.5,r()-.5],2.6)));}while(nd[0]*d[0]+nd[1]*d[1]+nd[2]*d[2]<-.5);d=nd;P.push(G.add(P[i-1],G.mul(d,SP)));}
  let c=[0,0,0];P.forEach(p=>c=G.add(c,p));c=G.mul(c,1/P.length);return P.map(p=>G.sub(p,c));}
function turn(p,a,b){const ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);const x=p[0]*ca+p[2]*sa,z=-p[0]*sa+p[2]*ca;return [x,p[1]*cb-z*sb,p[1]*sb+z*cb];}
const PROT=[[-2.3,.7,-.4],[0,1.1,.6],[2.3,.6,-.2],[-1.2,-1,.5],[1.3,-1.1,-.6]].map((c,k)=>({c,a:k*1.3+.4,b:k*.9-.3,open:coil(11+k*7)}));
const WAT=(()=>{const r=rng(5),o=[];for(let i=0;i<26;i++)o.push({p:[(r()-.5)*6.4,(r()-.5)*3.4,(r()-.5)*2.4],a:r()*6.3});return o;})();
const unfold=T=>clamp(.5/(1+Math.exp(-(T-62)/2.2))+.5/(1+Math.exp(-(T-80)/2.2)),0,1);
/* bead positions of protein k: u = how unfolded (0..1), net = how far the tangle has pulled together (0..1) */
function beads(k,u,net){const P=PROT[k],e=ease(u);const cen=G.mul(P.c,1-.33*net);
  return FOLD.map((f,i)=>G.add(cen,turn(G.add(G.mul(f,1-e),G.mul(P.open[i],e)),P.a,P.b)));}
function links(B,net){if(net<.05)return [];const L=[];for(let a=0;a<B.length;a++)for(let b=a+1;b<B.length;b++)for(let i=0;i<B[a].length;i++){if(!OILY[i]&&i%3)continue;
  for(let j=0;j<B[b].length;j++){if(!OILY[j]&&j%3)continue;const d=G.len(G.sub(B[a][i],B[b][j]));if(d<1.05)L.push([B[a][i],B[b][j]]);}}return L.slice(0,40);}
function water(p,a){const u=[Math.cos(a),0,Math.sin(a)],h=.0958,s=Math.sin(.912),c=Math.cos(.912);return [p,G.add(p,G.add(G.mul(u,h*s),[0,h*c,0])),G.add(p,G.add(G.mul(u,-h*s),[0,h*c,0]))];}
function items(u,net,o){o=o||{};const it=[],B=PROT.map((_,k)=>beads(k,u,net));
  B.forEach(b=>{for(let i=0;i<b.length;i++){it.push({t:'atom',p:b[i],r:.17,c:OILY[i]?C.oil:C.wet});if(i)it.push({t:'bond',a:b[i-1],b:b[i],r:.06,c:'#9aa1ab'});}});
  links(B,net).forEach(([a,b])=>it.push({t:'bond',a,b,r:.05*net,c:C.oil,op:.75*net}));
  if(o.water!==false)WAT.forEach(w=>{const [p,h1,h2]=water(w.p,w.a);it.push({t:'atom',p,r:.11,c:G.C.O,op:.7},{t:'atom',p:h1,r:.07,c:'#f4f4f4',op:.7},{t:'atom',p:h2,r:.07,c:'#f4f4f4',op:.7});});
  return it;}
/* ---------- 2D pictures ---------- */
function pan(ctx,x,y,s,k){// a frying pan seen from above, with an egg; k = how cooked (0 clear, 1 white)
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#2b2d31';ctx.fillRect(150,-12,170,24);ctx.beginPath();ctx.arc(0,0,165,0,7);ctx.fillStyle=C.pan;ctx.fill();ctx.beginPath();ctx.arc(0,0,148,0,7);ctx.fillStyle='#4a4e55';ctx.fill();
  ctx.beginPath();for(let i=0;i<=40;i++){const a=i/40*6.283,r=92+9*Math.sin(a*3)+6*Math.cos(a*5);ctx[i?'lineTo':'moveTo'](Math.cos(a)*r-8,Math.sin(a)*r*.9);}ctx.closePath();
  ctx.fillStyle=`rgba(${Math.round(lerp(214,252,k))},${Math.round(lerp(224,252,k))},${Math.round(lerp(220,247,k))},${lerp(.28,1,k)})`;ctx.fill();ctx.strokeStyle=`rgba(255,255,255,${lerp(.55,.9,k)})`;ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.arc(10,4,36,0,7);const g=ctx.createRadialGradient(0,-8,6,10,4,36);g.addColorStop(0,'#ffd86a');g.addColorStop(1,C.yolk);ctx.fillStyle=g;ctx.fill();ctx.restore();}
function lightBox(ctx,x,y,w,h,cooked,t){// a beam of light through egg white: straight through when raw, bounced every way when cooked
  ctx.save();rr(ctx,x,y,w,h,14);ctx.fillStyle=cooked?'#fbfbf7':'#e9f1f4';ctx.fill();ctx.strokeStyle='#cfd6dc';ctx.lineWidth=1.5;ctx.stroke();ctx.clip();
  const r=rng(cooked?3:9);for(let i=0;i<(cooked?26:120);i++){const px=x+30+r()*(w-60),py=y+20+r()*(h-40);ctx.beginPath();
    if(cooked){ctx.arc(px,py,12+r()*16,0,7);ctx.fillStyle='rgba(223,154,27,.28)';}else{ctx.arc(px,py,2.2,0,7);ctx.fillStyle='rgba(47,143,106,.55)';}ctx.fill();}
  ctx.strokeStyle=C.light;ctx.lineWidth=5;ctx.lineCap='round';const cy=y+h/2,ph=(t*160)%60;
  if(!cooked){ctx.setLineDash([26,12]);ctx.lineDashOffset=-ph;ctx.beginPath();ctx.moveTo(x-10,cy);ctx.lineTo(x+w+10,cy);ctx.stroke();ctx.setLineDash([]);}
  else{ctx.setLineDash([26,12]);ctx.lineDashOffset=-ph;ctx.beginPath();ctx.moveTo(x-10,cy);ctx.lineTo(x+w*.34,cy);ctx.stroke();
    for(let k=0;k<9;k++){const a=k/9*6.283+.3,L=60+((k*37)%50);ctx.beginPath();ctx.moveTo(x+w*.34,cy);ctx.lineTo(x+w*.34+Math.cos(a)*L*1.6,cy+Math.sin(a)*L);ctx.stroke();}ctx.setLineDash([]);}
  ctx.restore();}
function thermo(ctx,x,y,T){ctx.save();txt(ctx,Math.round(T)+' °C',x,y,{s:30,w:700,c:T>=62?C.heat:C.ink});
  const m=[[62,'starts to set'],[80,'main protein unfolds']];m.forEach(([v,l],k)=>txt(ctx,(T>=v?'✓ ':'· ')+v+' °C: '+l,x,y+30+k*24,{s:14.5,c:T>=v?C.heat:C.soft,w:T>=v?700:500}));ctx.restore();}
function legend(ctx,x,y,rows){rows.forEach(([c,t],k)=>{ctx.beginPath();ctx.arc(x+10,y+k*28-5,8,0,7);ctx.fillStyle=c;ctx.fill();txt(ctx,t,x+26,y+k*28,{s:14.5,c:C.ink});});}
const LEG=[[C.oil,'oily part of a protein (fears water)'],[C.wet,'water-loving part of a protein'],[G.C.O,'water']];
function side(ctx,title,rows,extra){const x=900;ctx.fillStyle='#fff';ctx.strokeStyle='#d5d9de';ctx.lineWidth=1;rr(ctx,x,24,280,552,12);ctx.fill();ctx.stroke();
  txt(ctx,title,x+18,58,{s:17,w:700,c:C.ink});legend(ctx,x+18,94,rows);if(extra)extra(x);}
/* ---------- tell-it pictures (300 × 193) ---------- */
const fr=fn=>ctx=>{ctx.save();ctx.beginPath();ctx.rect(0,0,300,193.3);ctx.clip();ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,300,194);fn(ctx);ctx.restore();};
const VT=View3D.make({yaw:.5,pitch:-.3,auto:0,hint:false});
const mini=(u,net,o)=>ctx=>VT.render(ctx,{x:0,y:0,w:300,h:193,nm:44,items:items(u,net,Object.assign({water:false},o||{})),bg:'#f4f6f8'});
const FRAMES=[
 {label:'Raw egg white is clear and runny',draw:fr(ctx=>pan(ctx,140,97,.55,0))},
 {label:'Its proteins are folded balls, oily parts tucked inside',draw:fr(mini(0,0))},
 {label:'Heat shakes the chains until they unfold',draw:fr(mini(.9,0))},
 {label:'Oily parts of different chains stick together: a tangled net',draw:fr(mini(1,1))},
 {label:'Big clumps bounce light every way, so it looks white',draw:fr(ctx=>lightBox(ctx,10,10,280,173,true,0))},
 {label:'Cooling does not untangle it: cooked stays cooked',draw:fr(ctx=>{pan(ctx,140,97,.55,1);txt(ctx,'❄',255,40,{s:30,c:'#2f7fd0'});})}];

/* ---------- "Who is doing this" (Nov 24, 2026): a vaccine that can take the heat ----------
   Sources: PATH press release (Nov 14, 2012) and WHO guidance WHO/IVB/13.04: MenAfriVac, made for Africa's meningitis belt (26
   countries) by the PATH-WHO Meningitis Vaccine Project with Serum Institute of India, was the first vaccine for Africa approved for a
   controlled temperature chain: up to 40 °C for up to 4 days. Most vaccines must be kept at 2 to 8 °C. Benin, 2012 (Vaccine 2014 via
   PMC5355207 and WHO AFRO): 155,000 people vaccinated this way; only 9 vials thrown out for passing 4 days; none for heat; vaccinators
   preferred it. Cost (Bulletin of the WHO, via PATH): could halve, from US$0.24 to US$0.12 per person. Impact (PATH/WHO/Gavi, 2016):
   more than 235 million people aged 1-29 vaccinated in 16 countries, 2010-2015; meningitis A nearly eliminated; experts warn it could
   come back unless babies keep being vaccinated.
   Simplified: the protein is the same 27-bead chain as the rest of this story; real vaccine proteins are much bigger, and heat damage
   builds up over time rather than all at once. */
const VP=View3D.make({yaw:.5,pitch:-.25,auto:.3,hint:false}),VR1=View3D.make({yaw:.5,pitch:-.3,auto:0,hint:false});
function oneProt(u,k){k=k||0;const c=PROT[k].c,B=beads(k,u,0).map(p=>G.sub(p,c)),it=[];
  for(let i=0;i<B.length;i++){it.push({t:'atom',p:B[i],r:.17,c:OILY[i]?C.oil:C.wet});if(i)it.push({t:'bond',a:B[i-1],b:B[i],r:.06,c:'#9aa1ab'});}return it;}
function vacPick(S,v){const V=S.vac;if(!V||V.seen40)return;V.pick=v;if(v==='40')V.seen40=true;}
function newVac(){return {pick:null,seen40:false,ctc:false,u:0,t:0};}
const VAC_PICK=[{v:'5',x:36,y:30},{v:'40',x:176,y:30}];
function thermoCard(ctx,c,on){rr(ctx,c.x,c.y,120,118,14);ctx.fillStyle=on?'#fff3c4':'#fff';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=C.ink;ctx.stroke();
  const cx=c.x+40,top=c.y+18,hot=c.v==='40';ctx.fillStyle='#e9ecef';rr(ctx,cx-7,top,14,64,7);ctx.fill();ctx.fillStyle=hot?C.heat:'#2f7fd0';rr(ctx,cx-7,top+(hot?8:48),14,hot?56:16,7);ctx.fill();ctx.beginPath();ctx.arc(cx,top+74,12,0,7);ctx.fill();
  txt(ctx,hot?'☀️':'❄️',c.x+88,c.y+48,{s:30,a:'center'});txt(ctx,c.v+' °C',c.x+88,c.y+92,{s:17,w:700,c:hot?C.heat:'#2f7fd0',a:'center'});}
function route(ctx,V,x,y,w,h){ctx.save();rr(ctx,x,y,w,h,12);ctx.fillStyle='#fbf8ef';ctx.fill();ctx.strokeStyle='#d5d9de';ctx.stroke();
  const P=[[x+30,y+h-40],[x+w*.3,y+h*.55],[x+w*.48,y+h*.72],[x+w*.62,y+h*.38],[x+w*.8,y+h*.6],[x+w-34,y+34]];
  ctx.strokeStyle='#c9b48f';ctx.lineWidth=6;ctx.setLineDash([10,8]);ctx.beginPath();P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'🏥',P[0][0],P[0][1]+10,{s:30,a:'center'});
  const reach=V.ctc?5:2;for(let i=1;i<P.length;i++){const ok=V.seen40&&i<=reach;txt(ctx,'🏘️',P[i][0],P[i][1]+10,{s:26,a:'center'});ctx.beginPath();ctx.arc(P[i][0]+18,P[i][1]-14,9,0,7);ctx.fillStyle=!V.seen40?'#c9ced5':ok?'#2f8f6a':'#C11430';ctx.fill();
    txt(ctx,ok?'✓':V.seen40?'✗':'',P[i][0]+18,P[i][1]-9,{s:13,w:800,c:'#fff',a:'center'});}
  txt(ctx,V.ctc?'☀️ no ice, tested vaccine':'🧊 ice runs out',x+w-14,y+h-14,{s:14,w:700,c:V.ctc?C.heat:'#2f7fd0',a:'right'});ctx.restore();}
function vacRhyme(ctx,x,y,w,h,t){ctx.save();rr(ctx,x,y,w,h,12);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#d5d9de';ctx.stroke();
  const u=.5+.5*Math.sin(t*1.2),q=(w-60)/2;
  VR1.render(ctx,{x:x,y:y,w:q,h,nm:40,items:oneProt(u,0),bg:'#ffffff'});txt(ctx,'🍳',x+22,y+30,{s:24});
  txt(ctx,'=',x+w/2,y+h/2+14,{s:38,w:700,c:C.ink,a:'center'});
  VR1.render(ctx,{x:x+w-q,y:y,w:q,h,nm:40,items:oneProt(u,3),bg:'#ffffff'});txt(ctx,'💉',x+w-q+10,y+30,{s:24});ctx.restore();}
function vacPanel(ctx){const x=900;ctx.fillStyle='#fff';ctx.strokeStyle='#d5d9de';ctx.lineWidth=1;rr(ctx,x,24,280,552,12);ctx.fill();ctx.stroke();
  txt(ctx,'Who is doing this',x+18,58,{s:17,w:700,c:C.ink});
  [['💉','meningitis A vaccine, Africa'],['🤝','PATH + WHO + Serum Institute'],['🌡️','2012: OK at 40 °C for 4 days'],['🛵','Benin: 155,000 vaccinated'],['🗑️','only 9 vials thrown out'],['💵','cost per person cut in half'],['🌍','235 million protected'],['⚠️','babies must keep getting it']]
    .forEach(([i,t],k)=>{const y=100+k*52;txt(ctx,i,x+36,y,{s:24,a:'center'});txt(ctx,t,x+64,y-4,{s:13.5,w:600,c:C.ink});});
  txt(ctx,'Sources: PATH 2012, 2016; WHO; Gavi;',x+18,540,{s:12,c:C.soft});txt(ctx,'Vaccine journal 2014.',x+18,556,{s:12,c:C.soft});}
/* ---------- chapters ---------- */
const PICK=['The water boils away and leaves the white part','The pan adds white color to the egg','Heat makes the proteins unfold and tangle together','Heat turns the clear part into fat'];
const V2=View3D.make({yaw:.4,pitch:-.25,auto:.2}),V3=View3D.make({yaw:.4,pitch:-.25,auto:.12}),V4=View3D.make({yaw:.6,pitch:-.3,auto:.12}),V6=View3D.make({yaw:.4,pitch:-.25,auto:.12});
const draw3=(ctx,V,u,net,o)=>{ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,W,H);V.render(ctx,{x:0,y:0,w:880,h:600,nm:lerp(118,84,ease(u))*(1+.15*net),items:items(u,net,o),bg:'#f4f6f8'});};
Story.start({
  id:'eggwhite',title:'Why does an egg white turn solid and white?',W,H,labHref:'../index.html#protein',
  about:'<p><b>What is real.</b> Raw egg white is about 88% water and 10% protein. Its proteins are folded chains a few nanometers across, much smaller than a wave of light. Egg white starts to set near 62 °C and its main protein (ovalbumin) unfolds near 80 °C. Unfolded chains stick together by their oily parts and trap the water, and the clumps scatter light.</p><p><b>What is simplified.</b> Each protein is drawn as a chain of 27 beads (one bead is one amino acid). Real egg-white proteins are chains of about 400. Only a few water molecules are drawn, and hydrogen atoms on the proteins are left out.</p><p><b>A vaccine that can take the heat (step 7).</b> MenAfriVac, from the PATH-WHO Meningitis Vaccine Project and Serum Institute of India, was the first vaccine for Africa approved for use at up to 40 °C for up to 4 days (2012); most vaccines must stay at 2 to 8 °C. In Benin in 2012, 155,000 people were vaccinated this way and only 9 vials were thrown out. More than 235 million people were vaccinated in 2010 to 2015, and meningitis A was nearly eliminated. Sources: PATH, WHO, Gavi, and the journal Vaccine (2014). The vaccine protein is drawn with the same bead chain as the egg white; heat damage really builds up over time.</p>',
  tell:{frames:FRAMES,terms:['protein','fold|folded','unfold|denature','oily|hydrophobic','tangle|net|gel','scatter|light'],
    nudge:'For each picture ask: what had to happen just before this could happen?',
    done:'<b>That is the story.</b> Now tell it in your own words.',
    prompt:'Why does a clear, runny egg white turn solid and white in a hot pan, and why can’t you cool it back? Tell the story. Use “because” and “so”.',placeholder:'Egg white is mostly water and folded proteins… because… so…'},
  chapters:[
  {rail:'The question',title:'Clear and runny, then solid and white',views:false,
   predict:{key:'why',q:'Crack an egg into a hot pan. In about a minute the clear, runny part turns solid and white. Why?',opts:PICK,right:2,after:'<b>Locked in.</b> You will see what really happens in steps 3 to 5.'},
   text:'<p class="why">Take your best guess.</p>',alt:'Think about what egg white is made of. It is not white paint and it is not fat. What could heat change about the stuff that is already there?',
   enter(S){S.v.k=0;},tick(S,dt){if(S.picks.why!=null)S.v.k=Math.min(1,(S.v.k||0)+dt*.35);},
   draw(ctx,S){ctx.fillStyle='#f4f1ea';ctx.fillRect(0,0,W,H);pan(ctx,430,300,1.45,S.v.k||0);
     pill(ctx,S.v.k>.9?'Cooked: solid and white':'Raw egg white: clear and runny',430,560,{bg:'#fff',c:C.ink,bd:C.ink,s:17,w:700,r:9});}},

  {rail:'Zoom in',title:'What is in egg white?',live:true,
   text(S){return 'Egg white is about <b>88% water</b> and <b>10% protein</b>. Each protein is a long chain folded into a tight ball, with its <b style="color:'+C.oil+'">oily parts</b> tucked inside, away from the water. '+
     'Each ball is a few nanometers across, about 100 times smaller than a wave of light, and the balls are spread evenly. So light passes straight through and raw egg white looks <b>clear</b>. <b>Drag to turn the picture.</b>';},
   alt:'Picture a bowl of water with tiny tight balls of yarn floating in it. The balls are so small and so spread out that you can see right through the bowl. Each ball keeps its greasy strands rolled up inside.',
   todo:[{t:'Drag the picture to turn it',ok:()=>V2.touched}],
   draw(ctx,S){draw3(ctx,V2,0,0);side(ctx,'What you are looking at',LEG,x=>{txt(ctx,'One bead = one amino acid.',x+18,200,{s:13.5,c:C.soft});txt(ctx,'Real egg proteins have about 400.',x+18,220,{s:13.5,c:C.soft});
     txt(ctx,'Each folded ball here: about 1 nm.',x+18,250,{s:13.5,c:C.soft});txt(ctx,'A wave of light: 400 to 700 nm.',x+18,270,{s:13.5,c:C.soft});});}},

  {rail:'Heat',title:'Turn up the heat',live:true,
   text(S){const T=S.v.T,u=unfold(T);return T<58?'Heat makes every bead jiggle harder. Below about 60 °C the chains jiggle but stay folded. <b>Turn up the heat.</b>':
     u<.75?'Near <b>62 °C</b> the first egg proteins shake loose and <b>unfold</b>. Their oily parts are now out in the water.':
     'By <b>80 °C</b> the main egg protein has unfolded too. Almost every chain is open, with its oily parts exposed. Scientists call this <b class="term">denaturing</b> a protein.';},
   alt:'Heat is just faster shaking. Shake a tight ball of yarn hard enough and it loosens and falls open. The greasy strands that were hidden inside are now on the outside.',
   ui:[{type:'range',key:'T',min:20,max:100,step:1,val:25,label:'Pan temperature',fmt:v=>v+' °C',stops:[{v:25,l:'room'},{v:62,l:'starts to set'},{v:80,l:'set'}]}],
   todo:[{t:'Heat it to 80 °C',ok:S=>S.v.T>=80}],
   enter(S){S.v.T=25;},
   draw(ctx,S){draw3(ctx,V3,unfold(S.v.T),0);side(ctx,'Temperature',[],x=>{thermo(ctx,x+18,110,S.v.T);legend(ctx,x+18,230,LEG.slice(0,2));
     txt(ctx,'Proteins unfolded',x+18,330,{s:15,c:C.soft});txt(ctx,Math.round(unfold(S.v.T)*100)+'%',x+262,332,{s:24,w:700,a:'right',c:C.heat});});}},

  {rail:'Tangle',title:'The chains stick together',live:true,
   text(S){return S.v.net<.95?'Oily parts hate water, but they stick to other oily parts. An unfolded chain grabs the next chain by its oily parts. <b>Let it set</b> and watch.':
     'Every chain now holds several others: one <b>tangled net</b> through the whole egg white. The water is trapped in the net, so it can no longer flow. That is why the egg white is now <b>solid</b>.';},
   alt:'Think of cooked spaghetti that has been left out. The strands stick to each other wherever they touch, and the whole pile becomes one clump you can pick up. The water is still there, but it is caught between the strands.',
   ui:[{type:'button',label:'Let it set',pulse:true,act(S){S.v.go=1;},show:S=>!S.v.go}],
   todo:[{t:'Let it set',ok:S=>S.v.net>=.95}],
   enter(S){S.v.net=0;S.v.go=0;},tick(S,dt){if(S.v.go)S.v.net=Math.min(1,S.v.net+dt*.45);},
   draw(ctx,S){draw3(ctx,V4,1,S.v.net);side(ctx,'What you are looking at',[[C.oil,'oily parts stuck together'],[C.wet,'water-loving part'],[G.C.O,'water, now trapped']],x=>{
     txt(ctx,'Links between chains',x+18,250,{s:15,c:C.soft});txt(ctx,String(S.v.net>.05?links(PROT.map((_,k)=>beads(k,1,S.v.net)),S.v.net).length:0),x+262,252,{s:24,w:700,a:'right',c:C.oil});});}},

  {rail:'White',title:'Why it turns white',live:true,
   text(S){return S.v.ck?'In cooked egg white the tangles have grown into clumps as big as a wave of light, or bigger. Light hitting a clump bounces off in every direction. Light bounced every way, all colors together, looks <b>white</b>. (Milk and clouds are white for the same reason.)':
     'In raw egg white the proteins are tiny and evenly spread, so a beam of light goes straight through. Now switch to <b>cooked</b>.';},
   alt:'Clear ice and snow are both just frozen water. Ice is clear because light goes straight through it. Snow is white because light bounces off millions of little crystals in every direction. Raw egg white is like the ice; cooked egg white is like the snow.',
   ui:[{type:'seg',key:'ck',val:0,label:'Egg white',opts:[{v:0,l:'Raw'},{v:1,l:'Cooked'}]}],
   todo:[{t:'Switch to cooked',ok:S=>S.v.ck===1}],
   enter(S){S.v.ck=0;},
   draw(ctx,S){ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,W,H);lightBox(ctx,60,90,760,400,!!S.v.ck,S.t);
     txt(ctx,'light →',60,74,{s:16,w:700,c:'#9a7a00'});txt(ctx,S.v.ck?'Light bounces off the clumps every way: white':'Light goes straight through: clear',440,530,{s:18,w:700,c:C.ink,a:'center'});
     side(ctx,'What you are looking at',S.v.ck?[['#f0c46d','a clump of tangled protein'],[C.light,'light']]:[[C.wet,'one folded protein (not to scale: far smaller)'],[C.light,'light']]);}},

  {rail:'Cool it',title:'Can you un-cook it?',live:true,
   text(S){return S.v.T>40?'Take the pan off the heat. <b>Cool it down</b> and watch the chains.':
     'Cold, and nothing changed. The chains are stuck to so many others that they cannot find their way back into their folds. Cooked stays cooked. (The same thing happened to amylase in hot coffee in the cracker story.)';},
   alt:'Untangling a knotted pile of string does not happen by itself, even if you stop shaking it. Folding a protein back needs every bead in the right place at once, and stuck chains cannot do that.',
   ui:[{type:'range',key:'T',min:20,max:90,step:1,val:90,label:'Temperature',fmt:v=>v+' °C'}],
   todo:[{t:'Cool it to room temperature',ok:S=>S.v.T<=25}],
   enter(S){S.v.T=90;},
   draw(ctx,S){draw3(ctx,V6,1,1);side(ctx,'Temperature',[],x=>{thermo(ctx,x+18,110,S.v.T);txt(ctx,'Proteins unfolded',x+18,230,{s:15,c:C.soft});txt(ctx,'100%',x+262,232,{s:24,w:700,a:'right',c:C.heat});
     txt(ctx,'Cooling does not refold them.',x+18,270,{s:14,c:C.ink});});}},

  {rail:'Who did it',title:'A vaccine that can take the heat',links:[{t:"Do vaccines always need to stay cold?",u:"https://www.path.org/our-impact/articles/do-vaccines-always-need-to-stay-cold/",d:"PATH: the first campaign without the cold chain"},{t:"The campaign that reached the remotest villages",u:"https://afro.who.int/news/mass-campaign-first-vaccine-allowed-outside-cold-chain-africa-protects-remotest-african",d:"World Health Organization, Africa"}],live:true,
   text(S){const V=S.vac;if(!V||!V.pick)return 'Vaccines are built on proteins, like egg white. <b>Tap where a vaccine stops working.</b>';
     if(!V.seen40)return 'Cold keeps it folded. It still works. Tap the other one.';
     if(!V.ctc)return 'Too warm, too long: it unfolds, like egg white. Ice runs out before the far villages. <b>Try the tested vaccine.</b>';
     return 'This meningitis vaccine was tested to hold its shape at 40 °C for up to 4 days, so health workers could carry it without ice. Every village reached.';},
   alt:'Look at the two pictures at the bottom: the same chain folds and unfolds in the egg and in the vaccine. Heat shakes a protein open. A vaccine that has unfolded no longer looks like the germ it is teaching your body to fight.',
   ui:[{type:'seg',key:'vp',val:'',label:'Where does it stop working?',opts:[{v:'5',l:'❄️ 5 °C'},{v:'40',l:'☀️ 40 °C'}],on(S,v){vacPick(S,v);},show:S=>S.vac&&!S.vac.seen40},
       {type:'button',label:'☀️ Carry the tested vaccine without ice',pulse:true,act(S){S.vac.ctc=true;},show:S=>S.vac&&S.vac.seen40&&!S.vac.ctc}],
   todo:[{t:'Find where a vaccine stops working',ok:S=>S.vac&&S.vac.seen40},{t:'Carry the tested vaccine to every village',ok:S=>S.vac&&S.vac.ctc}],
   enter(S){S.vac=newVac();S.v.vp='';},
   tick(S,dt){const V=S.vac;if(!V)return;V.t+=dt;const tg=V.pick==='40'&&!V.ctc?1:0;V.u+=(tg-V.u)*Math.min(1,dt*.9);},
   click(S,x,y){const V=S.vac;if(!V||V.seen40)return;for(const c of VAC_PICK)if(x>c.x&&x<c.x+120&&y>c.y&&y<c.y+118){vacPick(S,c.v);S.v.vp=c.v;}},
   draw(ctx,S){const V=S.vac||(S.vac=newVac());ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,W,H);
     VAC_PICK.forEach(c=>thermoCard(ctx,c,V.pick===c.v));if(!V.pick){ctx.save();ctx.globalAlpha=.55+.45*Math.sin(S.t*4);txt(ctx,'👆',156,186,{s:30,a:'center'});ctx.restore();}
     rr(ctx,320,24,250,260,12);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#d5d9de';ctx.stroke();
     VP.render(ctx,{x:320,y:24,w:250,h:260,nm:lerp(66,48,V.u),items:oneProt(V.u,3),bg:'#ffffff'});
     txt(ctx,V.u>.6?'unfolded ✗':'folded ✓',445,272,{s:16,w:700,c:V.u>.6?C.rj:C.good,a:'center'});if(V.ctc)txt(ctx,'tested: 40 °C, 4 days',445,48,{s:14,w:700,c:C.heat,a:'center'});
     route(ctx,V,590,24,290,400);vacRhyme(ctx,20,440,560,140,S.t);vacPanel(ctx);}},

  {rail:'Tell it',title:'Now you tell the story',tell:true}
  ]});
})();
