/* Learn it: a teaching walkthrough for a student meeting the idea for the first time.
   Rules: every step changes what is on screen; each step says what you see and why it happens;
   the tool ends with ways to use the idea in your own life.
   Fields: goals, matters, startKey/startRun/startOverlay, steps:[{key, title, see, why, so?, set?, fresh?, focus?, speed?, lvl?, overlay?}],
   useIt:[{do, why, lvl?}], tryIt:[{title, steps[], look}].
   set = control values for the step (others go back to their defaults); fresh = start with fresh molecules.
   overlay(sim, ctx, LH, k, tau) draws on top of the model; tau = seconds since the step began.
   Test yourself uses the tool's predictions, then its review questions. */
(function(){
'use strict';
const H=BioLab.h,PAL=H.PAL,clamp=H.clamp;
const ease=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
const lerp=(a,b,f)=>a+(b-a)*f;
function dim(ctx,LH,a){ctx.save();ctx.globalAlpha=a||0.93;ctx.fillStyle=PAL['cv-sol'];ctx.fillRect(0,0,800,LH);ctx.restore();}
/* a label box; x,y = centre */
function tag(ctx,s,x,y,k,o){o=o||{};const sz=(o.s||15)*k;ctx.font=(o.w||600)+' '+sz+'px '+H.FONT;const w=ctx.measureText(s).width+sz*1.1,h=sz*1.9;
  ctx.save();ctx.globalAlpha=o.alpha==null?1:o.alpha;H.rr(ctx,x-w/2,y-h/2,w,h,7);ctx.fillStyle=o.bg||PAL['cv-sol'];ctx.fill();ctx.lineWidth=o.hi?2.5:1.2;ctx.strokeStyle=o.hi?'#c8102e':PAL['cv-soft'];ctx.stroke();
  H.txt(ctx,s,x,y+1,{s:sz,w:o.w||600,c:o.c||PAL['cv-ink'],a:'center',b:'middle'});ctx.restore();return {w,h};}
function line(ctx,x1,y1,x2,y2,col){ctx.save();ctx.strokeStyle=col||PAL['cv-soft'];ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.beginPath();ctx.arc(x2,y2,3,0,6.29);ctx.fillStyle=col||PAL['cv-soft'];ctx.fill();ctx.restore();}
function scaleBar(ctx,x,y,px,lab,k){ctx.save();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x,y);ctx.lineTo(x+px,y);ctx.lineTo(x+px,y-6);ctx.stroke();H.txt(ctx,lab,x+px/2,y-9,{s:12*k,w:700,a:'center'});ctx.restore();}
/* a fat molecule (triglyceride): glycerol backbone with three long fatty-acid tails, about 2 nm long; to scale with R px = 2.5 nm */
function fat(ctx,x,y,R,ang){const nm=R/2.5,tail=nm*2.1;ctx.save();ctx.translate(x,y);ctx.rotate(ang||0);ctx.strokeStyle='#c99a06';ctx.fillStyle='#c99a06';ctx.lineWidth=nm*0.13;ctx.lineJoin='round';
  for(let i=-1;i<=1;i++){const y0=i*nm*0.45;ctx.beginPath();ctx.moveTo(0,y0);for(let j=1;j<=14;j++)ctx.lineTo(j*tail/14,y0+(j%2?1:-1)*nm*0.09);ctx.stroke();ctx.beginPath();ctx.arc(0,y0,nm*0.17,0,6.29);ctx.fill();}
  ctx.beginPath();ctx.moveTo(0,-nm*0.45);ctx.lineTo(0,nm*0.45);ctx.stroke();ctx.restore();}
const art=sim=>sim.def.art;
function hits10(sim){const v=sim.vis,t=sim.vt;return (v.hitT||[]).filter(x=>x>t-10).length;}

BioLab.addLearn({
enz: {
  goals: {
    bio: ['What an enzyme really is, and why one enzyme can work over and over', 'Why cold only slows an enzyme, but heat or strong acid stops it', 'How to use this in your kitchen and laundry room'],
    honors: ['What an enzyme really is, and why one enzyme can work over and over', 'Why cold only slows an enzyme, but heat or strong acid stops it', 'How a competitive inhibitor slows an enzyme, and how extra substrate wins it back', 'How to use this in your kitchen and laundry room'],
    ap: ['What an enzyme really is, and why one enzyme can work over and over', 'Why cold only slows an enzyme, but heat or strong acid stops it', 'How competitive and noncompetitive inhibitors differ, and what each does to Km and Vmax', 'How to use this in your kitchen and laundry room']
  },
  matters: 'Enzymes digest your food and run almost every reaction in your body. Once you know what cold, heat and acid do to them, you will know why the fridge, the stove and a squeeze of lemon work.',
  startKey: 'cast', startRun: true, startSpeed: 0.25,
  startOverlay(sim,ctx,LH,k){const v=sim.vis,P=art(sim).pos;
    line(ctx,P[1][0],P[1][1]+40,P[1][0],P[1][1]+58);tag(ctx,'Enzyme (amylase)',P[1][0],P[1][1]+72,k);
    const sb=(v.subs||[]).find(a=>a.y>70&&a.y<400&&a.x>80&&a.x<680&&Math.hypot(a.x-P[1][0],a.y-P[1][1])>90);if(sb){const lx=Math.min(sb.x+58,730);line(ctx,lx-30,sb.y-22,sb.x+5,sb.y-4);tag(ctx,'Starch',lx,sb.y-30,k);}
    const pr=(v.prods||[]).find(a=>a.life>1.5&&a.y>60&&a.x<700);if(pr){const lx=Math.min(pr.x+80,700);line(ctx,lx-54,pr.y+22,pr.x+4,pr.y+3);tag(ctx,'Sugar (product)',lx,pr.y+30,k);}},
  steps: [
    { key: 'fold', title: 'What an enzyme really is', speed: 0.25,
      see: 'Watch one long chain of amino acids fold up. Amylase is a single chain of 496 amino acids.',
      why: 'The chain folds the same way every time, into one exact shape with a groove in its surface: the <b>active site</b>. From here on, each green blob is one folded amylase. (Real enzymes are 3-D and far too small to have a color. This drawing is flat, and the green is just a label. Sizes are to scale: see the scale bar.)',
      overlay(sim,ctx,LH,k,tau){dim(ctx,LH);const p=tau%11,u=p<0.8?1:p<4.3?1-ease((p-0.8)/3.5):0,cx=280,cy=230,R=118;
        art(sim).protein(ctx,cx,cy,R,0,0.5,2,u,sim.vt,{beads:true,outline:true});scaleBar(ctx,40,430,R*2/5,'1 nm',k);
        if(u>0.35)tag(ctx,'One long chain of amino acids (only some drawn)',400,48,k);
        else if(u>0.02)tag(ctx,'Folding…',400,48,k);
        else{tag(ctx,'Folded into one exact shape',cx,402,k);line(ctx,cx+R*0.95+18,cy,cx+R*0.62,cy);tag(ctx,'Active site: the groove',cx+R+130,cy,k,{hi:true});}} },
    { key: 'fit', title: 'Lock and key', speed: 0.25,
      see: 'A fat molecule, with its three long tails, bumps the groove and bounces off. Then a piece of starch, the <b>substrate</b>, slides right in. Starch is a long chain of sugar rings; the tube shows short pieces of it.',
      why: 'The groove fits starch the way a lock fits one key. That is why each enzyme does one job: amylase breaks down starch, while other enzymes break down fats or proteins.',
      overlay(sim,ctx,LH,k,tau){dim(ctx,LH);const p=tau%10,cx=270,cy=235,R=118,mouth=cx+R*0.98;
        art(sim).protein(ctx,cx,cy,R,0,0.5,2,0,sim.vt,{outline:true});scaleBar(ctx,40,430,R*2/5,'1 nm',k);
        tag(ctx,'Only the right shape fits',400,40,k);
        if(p<4.2){let x,y;if(p<2){const f=ease(p/2);x=lerp(700,mouth+4,f);y=lerp(110,cy-6,f);}else{const f=ease((p-2)/1.6);x=lerp(mouth+4,640,f);y=lerp(cy-6,120,f);}
          fat(ctx,x,y,R,p<2?0:0.25*(p-2));
          if(p>1.9)tag(ctx,'✗  A fat molecule: wrong shape, no fit',590,330,k,{c:'#b3261e'});}
        else{const f=ease((p-4.4)/2.4),seat=cx+R*0.44;art(sim).starch(ctx,lerp(790,seat,f),cy,3,11,0,PAL['cv-sub']);
          if(f>=1)tag(ctx,'✓  Starch fits the groove',600,300,k,{c:'#1b7a3a',hi:true});}} },
    { key: 'bumps', title: 'Finding each other', speed: 0.5,
      see: 'Back to the whole tube. Starch drifts at random. Each gold ring is one starch molecule that landed in an active site and got cut.',
      why: 'Nothing steers the starch. A reaction happens only when a starch molecule happens to land in a groove, so anything that changes how often that works changes how fast the reaction goes.',
      overlay(sim,ctx,LH,k){const n=hits10(sim);sim.lnHit37=n;tag(ctx,'Starch cut in the last 10 s: '+n,640,60,k,{hi:true});} },
    { key: 'cut', title: 'The cut', speed: 0.25,
      see: 'In slow motion: starch slides into the groove, the enzyme grips it, one bond strains and snaps, and two smaller sugars float away.',
      why: 'Holding the starch in just the right spot strains that one bond, so it breaks far more easily than it would on its own. That is how an enzyme speeds up a reaction. The enzyme comes out unchanged and grabs the next starch.',
      so: 'That is why a cracker starts to taste sweet if you chew it long enough.',
      overlay(sim,ctx,LH,k,tau){dim(ctx,LH);const p=tau%9,cx=200,cy=225,R=112,A=art(sim),r=11,x0=cx+R*0.40;
        const ph=p<1.8?0:p<3.2?1:p<5?2:3;let a=0.5;if(ph===1)a=0.5-0.1*ease((p-1.8)/0.6);else if(ph===2)a=0.4+0.1*ease((p-3.2)/0.8);
        A.protein(ctx,cx,cy,R,0,a,2,0,sim.vt,{outline:true});scaleBar(ctx,40,430,R*2/5,'1 nm',k);
        if(ph===0){A.starch(ctx,lerp(760,x0,ease(p/1.8)),cy,4,r,0,PAL['cv-sub']);}
        else if(ph===1){A.starch(ctx,x0,cy,4,r,0,PAL['cv-sub']);const bx=x0+r*2.2*1.5;ctx.save();ctx.strokeStyle='#f0aa14';ctx.lineWidth=3;ctx.beginPath();for(let j=0;j<=6;j++){const yy=cy-16+j*5.3,xx=bx+(j%2?5:-5)*(0.5+0.5*Math.sin(tau*18));j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();ctx.restore();}
        else if(ph===2){const f=ease((p-3.2)/1.8);A.starch(ctx,lerp(x0,470,f),lerp(cy,120,f),2,r,lerp(0,-0.4,f),PAL['cv-prod']);A.starch(ctx,lerp(x0+r*4.4,500,f),lerp(cy,330,f),2,r,lerp(0,0.4,f),PAL['cv-prod']);}
        else{A.starch(ctx,470,120,2,r,-0.4,PAL['cv-prod']);A.starch(ctx,500,330,2,r,0.4,PAL['cv-prod']);}
        ['1  Starch slides in','2  The bond strains','3  It snaps in two','4  Enzyme unchanged'].forEach((s,i)=>tag(ctx,s,650,120+i*58,k,{s:14,hi:i===ph,alpha:i===ph?1:0.55}));} },
    { key: 'cold', title: 'Cold: slower, not broken', set: { temp: 10 }, fresh: true, speed: 0.5,
      see: 'Chilled to 10 °C, like an ice-cold drink. Count the gold rings: far fewer starch molecules get cut, and the <b>Reaction rate</b> below drops to about a sixth.',
      why: 'Cold molecules have less energy, so fewer landings have enough energy to make the cut. But the enzymes keep their folded shape (see <b>Enzymes with working shape</b>), so warming them back up brings the rate right back.',
      so: 'That is why the fridge keeps food fresh longer: it slows the enzymes in the food and in the bacteria on it.',
      overlay(sim,ctx,LH,k){const n=hits10(sim),ref=sim.lnHit37;tag(ctx,'Starch cut in the last 10 s: '+n+(ref?'   (at 37 °C: '+ref+')':''),560,60,k,{hi:true});
        tag(ctx,'Still folded ✓',700,410,k,{c:'#1b7a3a'});} },
    { key: 'hot', title: 'Too hot: broken for good', set: { temp: 70 }, speed: 0.25,
      see: 'Heated to 70 °C, about as hot as fresh coffee. Watch each blob unfold into a loose chain. The grooves disappear, and the reaction stops.',
      why: 'Heat shakes the chain so hard that the weak bonds holding the fold break. With no fold there is no groove, so starch cannot fit. This is <b>denaturing</b>, and cooling does not refold the chain.',
      so: 'That is why cooking and canning stop the enzymes in food.',
      overlay(sim,ctx,LH,k){const uf=sim.vis.uf||[0],it=uf.reduce((x,y)=>x+y,0)/uf.length<0.97?1:0;tag(ctx,it>0.15?'Unfolding: the groove is gone':'All unfolded. Cooling will not refold them.',400,60,k,{hi:true});} },
    { key: 'acid', title: 'Strong acid', set: { ph: 2 }, fresh: true, speed: 0.5,
      see: 'Fresh enzyme at body temperature, but at pH 2, as acidic as your stomach. Watch the close-up: acid’s H⁺ ions stick to the groove, the groove pinches, and the starch cannot stay.',
      why: 'The groove holds starch partly with electric charges. Acid adds H⁺ ions, which change those charges, so the groove changes shape and loses its grip. Amylase works best near pH 7, the pH of your mouth.',
      so: 'That is why saliva stops digesting starch once food reaches your stomach.',
      overlay(sim,ctx,LH,k,tau){const bx=452,by=40,bw=336,bh=250,p=tau%9;ctx.save();H.rr(ctx,bx,by,bw,bh,10);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#c8102e';ctx.stroke();ctx.clip();
        const R=150,cx=bx+bw*0.5-R*0.72,cy=by+bh*0.5,f=p<2.6?0:ease((p-2.6)/2.2),a=lerp(0.5,0.14,f);art(sim).protein(ctx,cx,cy,R,0,a,2,0,sim.vt,{outline:true});
        const spots=[[0.68,-1],[0.48,0],[0.68,1]].map(([rr,s])=>{const an=s*a*0.75,r=R*rr;return [cx+Math.cos(an)*r,cy+Math.sin(an)*r];});
        spots.forEach(([x,y],i)=>{const hx=lerp(bx+bw-20,x+20,clamp(f*1.3-i*0.12,0,1)),hy=lerp(by+30+i*60,y,clamp(f*1.3-i*0.12,0,1));
          ctx.beginPath();ctx.arc(x+6,y,11,0,6.29);ctx.fillStyle=f>0.6?'#9aa0a6':'#2a6fdb';ctx.fill();H.txt(ctx,f>0.6?'0':'−',x+6,y+1,{s:15*k,w:700,c:'#fff',a:'center',b:'middle'});
          if(p>2.4){ctx.beginPath();ctx.arc(hx,hy,11,0,6.29);ctx.fillStyle='#d93025';ctx.fill();H.txt(ctx,'H⁺',hx,hy+1,{s:11*k,w:700,c:'#fff',a:'center',b:'middle'});}});
        const sx=lerp(cx+R*0.62,bx+bw+30,ease((p-4.2)/1.6));if(sx<bx+bw+10)art(sim).starch(ctx,sx,cy,1,14,0,PAL['cv-sub']);
        tag(ctx,'Close-up of one groove',bx+bw/2,by+22,k,{s:12});tag(ctx,f<0.5?'pH 7: charges grip the starch':'pH 2: H⁺ cancels the charges',bx+bw/2,by+bh-22,k,{s:14,hi:true});ctx.restore();} },
    { lvl: 'honors', key: 'block', title: 'A blocker in the lock', set: { inhC: 5 }, fresh: true, speed: 0.5,
      see: 'Fresh enzyme at 37 °C, with a <b>competitive inhibitor</b> added: the red triangles. They fit the groove too, and some grooves now hold a triangle instead of starch.',
      why: 'While an inhibitor sits in the active site, starch cannot get in, so the rate drops. The inhibitor does not stay forever. It comes and goes, taking turns with the starch.',
      overlay(sim,ctx,LH,k){tag(ctx,'Red triangle in a groove = a blocked enzyme',400,60,k,{hi:true});} },
    { lvl: 'honors', key: 'flood', title: 'More substrate wins it back', set: { inhC: 5, sub: 50 }, speed: 0.5,
      see: 'Same inhibitor, but now five times as much starch. The tube fills with blue, and the rate climbs back up.',
      why: 'With far more starch around, starch wins the open groove most of the time. Extra substrate can outcompete a competitive inhibitor.',
      so: { honors: '', ap: 'In numbers: the competitive inhibitor raises the apparent Km, but Vmax stays the same.' },
      overlay(sim,ctx,LH,k){tag(ctx,'5× the starch: it wins most grooves',400,60,k,{hi:true});} },
    { lvl: 'ap', key: 'allo', title: 'A blocker on the back', set: { inhN: 3 }, fresh: true, speed: 0.5,
      see: 'Now a <b>noncompetitive inhibitor</b>: the purple diamonds bind the back of the enzyme, away from the groove, and those grooves pinch shut.',
      why: 'Binding there changes the enzyme’s shape and closes the active site. Extra starch cannot undo that, so Vmax drops while Km stays the same.',
      overlay(sim,ctx,LH,k){tag(ctx,'Purple diamond on the back = groove pinched shut',400,60,k,{hi:true});} }
  ],
  useIt: [
    { do: 'Get leftovers into the fridge within 2 hours.',
      why: 'Bacteria need their own enzymes to grow. Cold slows those enzymes, like amylase at 10 °C. The USDA rule: refrigerate within 2 hours, at 40 °F (4 °C) or colder.' },
    { do: 'Squeeze lemon or lime juice on cut apples, avocado or guacamole.',
      why: 'Browning is caused by an enzyme that works best around pH 5 to 7. Lemon juice is about pH 2, so the enzyme barely works, like amylase at pH 2.' },
    { do: 'Wake up yeast with warm water, not hot.',
      why: 'Yeast uses enzymes to make bread rise. Water at 105 to 115 °F (about 40 to 46 °C) wakes it up. Water near 140 °F (60 °C) kills it: the same heat damage you saw at 70 °C.' },
    { do: 'Rinse a blood stain with cold water, never hot.',
      why: 'Blood is mostly protein. Hot water unfolds those proteins, like amylase at 70 °C, and the tangled protein locks into the fabric. Enzyme stain removers work by cutting the protein up.' },
    { do: 'Use canned pineapple in Jell-O, not fresh.',
      why: 'Fresh pineapple, kiwi and papaya have enzymes that cut gelatin’s protein, so it never sets. Canning heats pineapple enough to denature its enzyme.' }
  ],
  tryIt: [
    { title: 'the cracker test (1 minute)',
      steps: ['Chew a plain saltine cracker. (Skip this one if you can’t eat wheat.)', 'Keep chewing for about a minute without swallowing.', 'Notice when it starts to taste a little sweet.'],
      look: 'The amylase in your saliva is cutting the cracker’s starch into smaller sugars: the exact reaction in this tool. Starch doesn’t taste sweet. The smaller sugars do.' },
    { title: 'the lemon apple (30 minutes)',
      steps: ['Cut an apple in half.', 'Rub lemon juice over one half of the cut face. Leave the other half plain.', 'Wait 30 minutes and compare the two halves.'],
      look: 'The plain half browns and the lemon half stays pale. Same apple, same enzyme: only the pH changed.' }
  ]
}
});

/* Why questions for Test yourself, part 2 (Review format). */
BioLab.addReview({
enz: {
  questions: [
  {id:'whyhot',kind:'test',lvl:'bio',
    q:'Why does amylase stop working at 70 °C?',
    choices:['Heat uses up the enzyme','The chain unfolds, so the groove is gone and starch no longer fits','Hot starch moves too fast to be caught','The sugars it makes block the active site'],correct:1,
    steps:['An enzyme only works because its folded chain makes a groove with the right shape.','Strong heat breaks the weak bonds that hold the chain folded, so the groove disappears.','Starch can’t fit, so the reaction stops. Cooling doesn’t refold it.'],
    lab:{set:{temp:70},look:'The tube is at 70 °C. Watch the enzymes unfold and <b>Enzymes with working shape</b> fall, with the reaction rate.'}},
  {id:'whycold',kind:'test',lvl:'bio',
    q:'An ice-cold drink slows the amylase in your mouth. Once your mouth warms back up, what happens, and why?',
    choices:['It stays slow, because the cold damaged it','It speeds back up, because cold slows the reaction but doesn’t unfold the enzyme','It works faster than before, to catch up','It stops, because it denatured'],correct:1,
    steps:['Cold molecules have less energy, so fewer landings in the groove lead to a cut.','The enzyme keeps its folded shape the whole time.','Warm it up, and the rate comes back.'],
    lab:{set:{temp:10},look:'The tube is at 10 °C. <b>Enzymes with working shape</b> stays high even though the rate is low. Then drag Temperature back to 37 °C.'}},
  {id:'reuse',kind:'test',lvl:'bio',
    q:'A small amount of saliva can digest a lot of starch. Why?',
    choices:['The enzyme isn’t changed by the reaction, so each one keeps working on starch after starch','The enzyme splits into more enzymes','Each starch molecule turns into more enzyme','Saliva contains more enzyme than starch'],correct:0,
    steps:['After an enzyme cuts a starch molecule, it lets the sugars go.','The enzyme comes out the same as it went in.','So one enzyme molecule can repeat the job again and again.']},
  {id:'stain',kind:'real',lvl:'bio',
    q:'You get a nosebleed on your favorite hoodie. Why should you rinse it in cold water, not hot?',
    choices:['Hot water unfolds the blood’s proteins, and the tangled protein sticks to the fabric','Cold water has more oxygen to lift the stain','Hot water makes the stain spread faster','Cold water dissolves iron'],correct:0,
    steps:['Blood is mostly protein.','Heat unfolds proteins, the same way 70 °C unfolded amylase.','Unfolded proteins tangle and lock onto the fabric fibers. Cold water keeps them folded and easy to rinse out.']},
  {id:'pineapple',kind:'real',lvl:'bio',
    q:'Fresh pineapple keeps Jell-O from setting, because an enzyme in it cuts gelatin’s protein. Canned pineapple works fine. Why?',
    choices:['Canning adds sugar, which helps gelatin set','The heat used in canning denatured the pineapple’s enzyme','Canned pineapple is more acidic','Canned pineapple has no protein in it'],correct:1,
    steps:['Canning heats the fruit.','That heat unfolds the pineapple’s enzyme, bromelain, so it can no longer cut protein.','Heat damage to an enzyme is permanent, so the canned fruit can’t stop the gelatin from setting.']},
  {id:'lemon',kind:'real',lvl:'bio',
    q:'Lemon juice on sliced apples slows browning, which is caused by an enzyme in the apple. What does the lemon juice do?',
    choices:['It cools the apple','It lowers the pH, far from the pH where the browning enzyme works best','It adds more substrate for the enzyme','It heats the enzyme until it denatures'],correct:1,
    steps:['Lemon juice is acidic, about pH 2.','Acid changes the electric charges in the active site, and those charges help the enzyme grip its substrate.','Far from its best pH, the browning enzyme slows way down.'],
    lab:{set:{ph:2},look:'Amylase at pH 2. Watch the grooves pinch and the reaction rate fall, just like the apple’s browning enzyme in lemon juice.'}},
  {id:'compsub',kind:'test',lvl:'honors',
    q:'A competitive inhibitor is slowing an enzyme. Which change brings the rate back up the most?',
    choices:['Add much more substrate','Cool the enzyme down','Lower the pH','Add more inhibitor'],correct:0,
    steps:['A competitive inhibitor and the substrate take turns in the same active site.','The more substrate there is, the more often substrate gets the spot first.','So flooding the enzyme with substrate wins most of the rate back.'],
    lab:{set:{inhC:5,sub:50},look:'5 mM competitive inhibitor with 50 mM substrate. Compare the rate with substrate at 5 mM.'}},
  {id:'noncomp',kind:'test',lvl:'ap',
    q:'Adding lots of substrate does not undo a noncompetitive inhibitor. Why?',
    choices:['It binds away from the active site and changes the enzyme’s shape, so substrate can’t compete it off','It binds the substrate instead of the enzyme','It is used up by the reaction','It only works at high temperature'],correct:0,
    steps:['A noncompetitive inhibitor binds a different spot on the enzyme.','That changes the shape of the active site, so the enzymes it binds can’t work at all.','Substrate isn’t competing for the same spot, so more substrate can’t push it off. Vmax drops; Km stays the same.'],
    lab:{set:{inhN:3,sub:50},look:'3 mM noncompetitive inhibitor with 50 mM substrate. The rate stays low even with lots of substrate.'}}
  ]
}
});

/* ---------- Membrane transport and osmosis ---------- */
function xCount(sim){if(sim._lnK!==sim.lnKey){sim._lnK=sim.lnKey;sim._lnV0=sim.vt;}const x=(sim.vis.xT||[]).filter(e=>e[0]>=sim._lnV0);return {i:x.filter(e=>e[1]>0).length,o:x.filter(e=>e[1]<0).length};}
function tally(ctx,sim,k){const c=xCount(sim);tag(ctx,'Water molecules crossing  in: '+c.i+'  out: '+c.o,640,422,k,{s:13,hi:true});if(sim.st.lysed)tag(ctx,'Burst: the cell is gone',240,400,k,{s:13,c:'#b3261e'});}
function brace(ctx,x1,y1,x2,y2,lab,k,side){ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  const an=Math.atan2(y2-y1,x2-x1);[[x1,y1,an],[x2,y2,an+Math.PI]].forEach(([x,y,a])=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a+0.45)*9,y+Math.sin(a+0.45)*9);ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a-0.45)*9,y+Math.sin(a-0.45)*9);ctx.stroke();});ctx.restore();
  tag(ctx,lab,(x1+x2)/2+(side||0),(y1+y2)/2-(side?0:20),k,{s:12});}
BioLab.addLearn({
transport: {
  goals: {
    bio: ['Why water moves into or out of a cell, and what decides the direction', 'Why a red blood cell bursts in pure water but a plant cell just gets firm', 'How to use osmosis in the kitchen, the yard and on a long run'],
    honors: ['Why water moves into or out of a cell, and what decides the direction', 'Why a red blood cell bursts in pure water but a plant cell just gets firm', 'How cells move things that cannot cross on their own, and when that costs ATP', 'How to use osmosis in the kitchen, the yard and on a long run'],
    ap: ['Why water moves into or out of a cell, and what decides the direction', 'How water potential (ψ = ψs + ψp) predicts that direction', 'How cells move things that cannot cross on their own, and when that costs ATP', 'How to use osmosis in the kitchen, the yard and on a long run']
  },
  matters: 'Every cell in your body sits in a salty liquid and has to keep the right amount of water. Osmosis is why IV bags are salty, why seawater won’t quench your thirst and why limp lettuce crisps up in ice water.',
  question: 'A hospital IV bag is 0.9% salt water, never plain water. What would pure water do to a red blood cell, and what does very salty water do?',
  startKey: 'cast', startRun: true, startSpeed: 0.5,
  startOverlay(sim,ctx,LH,k){const A=sim.def.art;
    tag(ctx,'Red blood cell (real color: red, from hemoglobin)',A.CX,62,k,{s:13});
    tag(ctx,'Salt water outside the cell',120,418,k,{s:13});
    line(ctx,430,170,A.X0+4,170);tag(ctx,'Zoom: a tiny patch of its membrane',370,150,k,{s:13});},
  steps: [
    { key: 'scale', title: 'How small is this?', speed: 0.5,
      see: 'The red blood cell is about 8 micrometers (8,000 nanometers) across. Its membrane is only about 5 nanometers thick, and a water molecule is about 0.3 nanometers.',
      why: 'If a water molecule were a grain of sand, the membrane would be about as thick as a pencil and the cell would be as wide as a classroom. In the zoom, water and salt are drawn bigger than true scale so you can see them. Their colors are labels: molecules are too small to have a color.',
      overlay(sim,ctx,LH,k){const A=sim.def.art;brace(ctx,A.CX-80,A.CY+108,A.CX+80,A.CY+108,'about 8 µm = 8,000 nm',k);
        brace(ctx,A.MX-14,92,A.MX+14,92,'about 5 nm',k);tag(ctx,'water molecule: about 0.3 nm',643,452-30,k,{s:13,hi:true});} },
    { key: 'cross', title: 'A selective doorway', speed: 0.5,
      see: 'Follow the highlighted paths in the zoom: a water molecule slips through a protein tunnel called an <b>aquaporin</b>, while a salt ion hits the membrane and bounces off.',
      why: 'The middle of the membrane is oily, so charged salt ions can’t get through, and the aquaporin is shaped for single water molecules. A membrane that lets some things through but not others is <b>selectively permeable</b>.',
      overlay(sim,ctx,LH,k,tau){const A=sim.def.art,p=tau%4,y=A.chY[0],x=lerp(560,725,p/3);ctx.save();ctx.strokeStyle='#c8102e';ctx.setLineDash([5,4]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(560,y);ctx.lineTo(725,y);ctx.stroke();ctx.setLineDash([]);
        if(p<3){ctx.beginPath();ctx.arc(x,y,6,0,6.29);ctx.fillStyle=PAL['s2'];ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#c8102e';ctx.stroke();}
        const q=tau%3.2,sx=q<1.6?lerp(560,A.MX-16,q/1.6):lerp(A.MX-16,560,(q-1.6)/1.6),sy=232+Math.sin(q*2)*6;ctx.beginPath();ctx.arc(sx,sy,8,0,6.29);ctx.fillStyle=PAL['cv-inn'];ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#c8102e';ctx.stroke();ctx.restore();
        tag(ctx,'✓ water through an aquaporin',643,y-30,k,{s:12,c:'#1b7a3a'});tag(ctx,'✗ salt bounces off',590,262,k,{s:12,c:'#b3261e'});} },
    { key: 'balance', title: 'Equal both ways', speed: 0.5,
      see: 'Blood is 0.9% salt, about as salty as the inside of the cell. Watch the counter at the bottom: about as many water molecules cross in as out, and the cell keeps its size.',
      why: 'Water molecules cross both ways all the time, at random. When both sides have the same amount of dissolved stuff (<b>isotonic</b>), the crossings balance.',
      overlay(sim,ctx,LH,k){tally(ctx,sim,k);} },
    { key: 'pure', title: 'Pure water: swell and burst', set: { salt: 0 }, fresh: true, speed: 0.4,
      see: 'Now the outside is pure water. Check the counter: more water crosses in than out. The cell rounds up like a ball, then tears open.',
      why: 'Inside the cell, dissolved particles hold some of the water back. Outside, all of it is free to move, so more crosses in. Water moves toward the side with more dissolved stuff. A red blood cell has no wall, so it swells until it bursts (<b>lysis</b>).',
      so: 'That is why an IV bag is 0.9% salt, never plain water.',
      overlay(sim,ctx,LH,k){tally(ctx,sim,k);} },
    { key: 'salty', title: 'Salty water: shrink', set: { salt: 3 }, fresh: true, speed: 0.25,
      see: 'A fresh cell in 3% salt water, a little less salty than the ocean. More water crosses out than in, and the cell shrivels into a spiky shape.',
      why: 'Now the outside has more dissolved salt, so water leaves toward it. The cell shrinks and its surface puckers (<b>crenation</b>).',
      so: 'Seawater is about four times saltier than blood. That is why drinking it leaves you more dehydrated.',
      overlay(sim,ctx,LH,k){tally(ctx,sim,k);} },
    { key: 'plant', title: 'A plant cell gets firm', base: { cell: 'plant' }, set: { salt: 0 }, fresh: true, speed: 0.5,
      see: 'A plant cell, about 50 micrometers long, in pure water. Water flows in, but the cell does not burst: the green arrows show it pushing against its wall.',
      why: 'A plant cell has a stiff wall of cellulose around its membrane. As water flows in, the wall pushes back (<b>turgor pressure</b>) until no more can enter. That firmness is what holds up leaves and stems.',
      so: 'That is why limp lettuce or celery crisps up in ice water.',
      overlay(sim,ctx,LH,k){tag(ctx,'Real colors: green chloroplasts, clear vacuole',240,62,k,{s:13});} },
    { key: 'wilt', title: 'Salt makes a plant wilt', base: { cell: 'plant' }, set: { salt: 3 }, fresh: true, speed: 0.5,
      see: 'The same plant cell in 3% salt water. Water leaves, and the cell’s insides pull away from the wall.',
      why: 'Water moves out toward the salt. With less water inside, nothing presses on the wall, and the membrane shrinks away from it (<b>plasmolysis</b>). A wilting plant’s cells look like this.',
      so: 'That is why road salt hurts grass and trees beside roads, and why salting cucumbers draws water out.' },
    { key: 'o2', title: 'Other molecules, other doors', base: { mol: 'o2', side: 'out' }, fresh: true, speed: 1,
      see: 'The zoom now follows oxygen (O₂). It slips straight through the oily middle of the membrane, from where there is more to where there is less.',
      why: 'O₂ is small and has no charge, so it passes right through the fatty layer with no energy needed. That is <b>simple diffusion</b>. Glucose needs a carrier protein, and sodium ions are pumped with energy from ATP. Try them in Full lab with <b>Zoom follows</b>.',
      overlay(sim,ctx,LH,k){tag(ctx,'O₂: straight through the bilayer ✓',643,84,k,{s:13,hi:true});} },
    { lvl: 'honors', key: 'pump', title: 'Pumping uphill', base: { mol: 'na', side: 'out', pump: true }, fresh: true, speed: 1,
      see: 'The zoom follows sodium ions (Na⁺). There is far more Na⁺ outside, yet the purple pump keeps pushing Na⁺ out, and “ATP → ADP” flashes each time.',
      why: 'Moving something from less to more is uphill, so it costs energy. The Na⁺/K⁺ pump spends one ATP to move 3 Na⁺ out and 2 K⁺ in. That is <b>active transport</b>, and cells spend a large share of their ATP on it.',
      overlay(sim,ctx,LH,k){tag(ctx,'Active transport: uses ATP',643,452-30,k,{s:13,hi:true});} },
    { lvl: 'ap', key: 'psi', title: 'Water potential', base: { cell: 'plant' }, fresh: true, speed: 1,
      see: 'A plant cell in 0.9% salt water. Watch the ψ readouts below as the cell settles.',
      why: 'Water moves from higher ψ to lower ψ. Pure water is 0 MPa, solutes lower ψ (ψs = −iCRT), and wall pressure raises it (ψp). Flow stops when ψ inside equals ψ outside.' }
  ],
  useIt: [
    { do: 'Crisp up limp lettuce, celery or carrots in ice water.',
      why: 'About 15 to 30 minutes in ice water refills their cells by osmosis until the walls push back, just like the plant cell in pure water.' },
    { do: 'Never drink seawater, even when you are very thirsty.',
      why: 'Seawater is about 3.5% salt. To flush that salt, your kidneys use more water than you drank, so you end up more dehydrated (NOAA).' },
    { do: 'Salt sliced cucumbers or eggplant for 20 to 30 minutes before cooking.',
      why: 'Salt on the outside pulls water out of their cells, like the cell in 3% salt water, so salads and fried eggplant come out less soggy.' },
    { do: 'Pile salty snow away from lawns, trees and gardens.',
      why: 'De-icing salt in the soil pulls water out of roots, the way 3% salt shrank the plant cell. Extension services recommend keeping salt-laden snow away from plants.' },
    { do: 'On long, hot workouts, drink to thirst, not as much as you can.',
      why: 'Sweat loses salt. Drinking far more plain water than you lose can dilute the salt in your blood, and then water flows into your cells and they swell, like the cell in pure water. Mayo Clinic says thirst is a good guide.' }
  ],
  tryIt: [
    { title: 'the potato bend test (30 minutes)',
      steps: ['With an adult’s OK, cut two thin, equal slices of raw potato.', 'Put one in a cup of plain water and one in a cup of water with a tablespoon of salt stirred in.', 'After 30 minutes, take them out and try to bend each one.'],
      look: 'The salty-water slice goes floppy and the plain-water slice stays stiff. Salt pulled water out of the potato’s cells; plain water kept them full. It is your class’s potato lab in a kitchen.' },
    { title: 'the gummy bear test (overnight)',
      steps: ['Put one gummy bear in a cup of plain water and another in a cup of salty water.', 'Leave both in the fridge overnight.', 'Compare their sizes in the morning.'],
      look: 'The plain-water bear swells up; the salty-water bear barely changes. A gummy bear isn’t a cell, but water still moves toward the side with more dissolved stuff.' }
  ]
}
});
/* ---------- potato osmosis lab ---------- */
const PBX=i=>38+i*92+37;           // centre of beaker i
function pCore(sim){return sim.st.cores[clamp((sim.p.bal|0)-1,0,5)];}
function pMass(c){return Math.round((c.m0*(1+c.pct/100)+c.ofs)*1000)/1000;}
function pPct(c){return 100*(pMass(c)-c.m0)/c.m0;}
/* zoom into the edge of a core: sugar water on the left, potato cells on the right.
   Cells are about 0.15 mm across; starch grains 5 to 100 µm. Membrane pulls in or presses out with the core's real change. */
function potZoom(ctx,sim,k,tau,o){o=o||{};const c=o.core||pCore(sim),pc=pPct(c),cx=o.x||690,cy=o.y||142,R=o.r||80,u=R/80;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fillStyle='#fbf6e6';ctx.fill();ctx.clip();
  // solution side
  const ex=cx-R*0.42;ctx.fillStyle=PAL['cv-water'];ctx.fillRect(cx-R,cy-R,ex-(cx-R),2*R);
  const nOut=Math.round(c.c*34*u);ctx.fillStyle='#b9822b';
  for(let i=0;i<nOut;i++){const a=(i*137.5)%360,rx=((i*53)%100)/100,ry=((i*71)%100)/100;ctx.beginPath();ctx.arc(cx-R+6+rx*(ex-(cx-R)-12)+Math.sin(tau*1.3+a)*2,cy-R+8+ry*(2*R-16)+Math.cos(tau*1.1+a)*2,2.2*u,0,6.29);ctx.fill();}
  // cells: a brick of rounded hexagons, real colors (cream cytoplasm, white starch grains)
  const r=24*u,m=pc>=0?0.9+0.07*Math.min(pc/18,1):0.9+0.32*Math.max(pc/30,-1);
  const hex=(x,y,s)=>{ctx.beginPath();for(let j=0;j<6;j++){const a=Math.PI/6+j*Math.PI/3;ctx.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s);}ctx.closePath();};
  for(let row=-2;row<=2;row++)for(let col=0;col<4;col++){const x=ex+r*0.95+col*r*1.73+(row&1?r*0.87:0),y=cy+row*r*1.5;
    hex(x,y,r);ctx.fillStyle=m<0.86?PAL['cv-water']:'#efe2b6';ctx.fill();ctx.lineWidth=3*u;ctx.strokeStyle='#bfa25a';ctx.stroke();   // cell wall (gap fills with outside water when the cell shrinks)
    hex(x,y,r*m);ctx.fillStyle='#f7edc9';ctx.fill();ctx.lineWidth=1.6*u;ctx.strokeStyle='#7a5f1e';ctx.stroke();          // membrane + cytoplasm
    for(let g=0;g<4;g++){const ga=g*1.6+row+col,gd=r*m*(g?0.5:0),gs=(g?3:4.4)*u*Math.sqrt(m);ctx.beginPath();ctx.ellipse(x+Math.cos(ga)*gd,y+Math.sin(ga)*gd,gs*1.25,gs,ga,0,6.29);ctx.fillStyle='#fffdf6';ctx.fill();ctx.strokeStyle='#cdbb86';ctx.lineWidth=0.8;ctx.stroke();}
    ctx.fillStyle='#b9822b';for(let g=0;g<3;g++){const ga=g*2.1+col*0.7+row;ctx.beginPath();ctx.arc(x+Math.cos(ga)*r*m*0.72,y+Math.sin(ga)*r*m*0.72,1.6*u,0,6.29);ctx.fill();}}
  // water crossing the edge, in the direction and at the rate the model is using now
  const rate=c.rate,n=Math.min(6,Math.round(Math.abs(rate)*7)),dir=rate>0?1:-1;
  for(let i=0;i<n;i++){const f=((tau*0.6+i/n)%1),x=ex+dir*(f-0.5)*R*0.9,y=cy-R*0.7+i*(1.4*R/Math.max(1,n-1||1));
    ctx.globalAlpha=Math.sin(f*Math.PI);ctx.beginPath();ctx.arc(x,y,3.2*u,0,6.29);ctx.fillStyle=PAL['s2'];ctx.fill();ctx.globalAlpha=1;}
  ctx.restore();ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.lineWidth=2.5;ctx.strokeStyle=PAL['cv-ink'];ctx.stroke();ctx.restore();
  const bw=r*1.73*0.67,bx=cx+R*0.1,by=cy+R*0.72;ctx.save();ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,bx-6,by-24,bw+12,30,6);ctx.fill();ctx.restore();scaleBar(ctx,bx,by,bw,'0.1 mm',k);
  if(o.to){ctx.save();const a=Math.atan2(o.to[1]-cy,o.to[0]-cx);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);ctx.lineTo(o.to[0],o.to[1]);ctx.stroke();ctx.restore();}}
/* a percent-change graph drawn right over the beakers: x = each beaker, y = its mass change */
function potGraph(ctx,sim,k,o){o=o||{};const cs=sim.st.cores,Y0=56,S=1.9,pts=cs.map((c,i)=>[PBX(i),clamp(Y0-S*pPct(c),12,112)]);
  ctx.save();ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,4,4,580,120,8);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.stroke();
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(30,Y0);ctx.lineTo(560,Y0);ctx.stroke();ctx.setLineDash([]);
  H.txt(ctx,'Mass change',14,22,{s:12*k,w:700});H.txt(ctx,'0%',14,Y0+4,{s:11*k,c:PAL['cv-soft']});H.txt(ctx,'gained ↑',574,22,{s:11*k,c:PAL['s2'],a:'right'});H.txt(ctx,'lost ↓',574,116,{s:11*k,c:'#b3261e',a:'right'});
  H.txt(ctx,'Soak time '+sim.st.tSoak.toFixed(1)+' h',574,Y0-8,{s:12*k,w:700,a:'right'});
  ctx.strokeStyle='#c8102e';ctx.lineWidth=2.5;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();
  pts.forEach(q=>{ctx.beginPath();ctx.arc(q[0],q[1],5,0,6.29);ctx.fillStyle='#c8102e';ctx.fill();});
  let iso=null;for(let i=0;i<cs.length-1;i++){const a=pPct(cs[i]),b=pPct(cs[i+1]);if(a>=0&&b<0){const f=a/(a-b);iso={x:lerp(pts[i][0],pts[i+1][0],f),m:cs[i].c+(cs[i+1].c-cs[i].c)*f};break;}}
  ctx.restore();
  if(iso&&sim.st.tSoak>3&&o.iso!==false){ctx.save();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(iso.x,Y0-14);ctx.lineTo(iso.x,Y0+14);ctx.stroke();ctx.restore();
    tag(ctx,'crosses zero at ≈ '+iso.m.toFixed(2)+' M',clamp(iso.x-70,110,440),Y0+30,k,{s:12,hi:true});}
  return iso;}
function potCard(ctx,lines,k,x,y,w){x=x||590;y=y||66;w=w||202;const h=14+lines.length*21;ctx.save();ctx.globalAlpha=0.96;ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,x,y,w,h,8);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  lines.forEach((L,i)=>H.txt(ctx,L[0],x+10,y+21+i*21,{s:(L[2]||13)*k,w:L[1]||500,c:L[3]||PAL['cv-ink']}));}
function potIso(sim){const cs=sim.st.cores;for(let i=0;i<cs.length-1;i++){const a=pPct(cs[i]),b=pPct(cs[i+1]);if(a>=0&&b<0)return cs[i].c+(cs[i+1].c-cs[i].c)*a/(a-b);}return NaN;}

BioLab.addLearn({
potato: {
  goals: {
    bio: ['Why a potato core gains mass in plain water and loses mass in strong sugar water', 'How to tell which way water moved just from a balance reading', 'How to find the sugar strength that matches the inside of the potato', 'Where the same idea keeps food from spoiling and keeps plants alive'],
    honors: ['Why a potato core gains mass in plain water and loses mass in strong sugar water', 'Why we compare percent change, not grams', 'How to find the isotonic point from a graph, then zoom in to measure it better', 'Where the same idea keeps food from spoiling and keeps plants alive'],
    ap: ['Why a potato core gains mass in plain water and loses mass in strong sugar water', 'How to find the isotonic point from a graph', 'How to turn the isotonic point into the cells’ water potential with ψs = −iCRT', 'Why NaCl gives a lower isotonic molarity but the same water potential']
  },
  matters: 'A potato is a big bag of plant cells full of dissolved sugars and salts. Weighing a potato core is a way to measure which way water moved, using nothing but a balance. Cooks, farmers and food makers rely on the same rule every day.',
  question: 'You soak one 2 g potato core in plain water and another in strong sugar water (1.0 M) for a day. Which one gets heavier, which gets lighter, and is there a sugar strength where nothing changes?',
  startKey: 'setup', startRun: true, startSpeed: 0.5,
  startOverlay(sim,ctx,LH,k){
    tag(ctx,'Potato core: about 3 cm long, 1 cm wide, about 2 g',300,428,k,{s:13});line(ctx,190,418,PBX(1),372);
    tag(ctx,'Pale cream, the real color of raw potato',300,92,k,{s:13});
    tag(ctx,'Balance reads to 0.001 g',690,212,k,{s:13});},
  steps: [
    { key: 'setup', title: 'Six beakers, one rule', fresh: true, speed: 0.4,
      see: 'Beaker 1 is plain water. Each beaker to the right has more sugar dissolved in it, up to 1.0 M in beaker 6 (about 34 g of sugar per 100 mL). Each beaker gets one potato core that was weighed before it went in.',
      why: 'The only thing that changes from beaker to beaker is how much sugar is dissolved in the water. So any difference in the cores comes from the sugar. The yellow tint is a label for sugar strength; real sugar water looks clear.',
      overlay(sim,ctx,LH,k){tag(ctx,'plain water',PBX(0),112,k,{s:12,hi:true});tag(ctx,'more sugar →',PBX(3),112,k,{s:12});tag(ctx,'1.0 M sugar',PBX(5),112,k,{s:12,hi:true});
        scaleBar(ctx,PBX(0)-8,440,17,'1 cm',k);tag(ctx,'Beakers and cores are drawn to the same width scale',300,432,k,{s:12});} },
    { key: 'cells', title: 'Inside the core', set: { bal: 1 }, speed: 0.3,
      see: 'The circle zooms into the edge of the core in beaker 1. Each six-sided box is one potato cell, about 0.15 mm across, so a 2 g core holds about a million of them. The white grains are starch. The brown dots are dissolved sugars and salts.',
      why: 'Each cell has a stiff outer <b>cell wall</b> and, just inside it, a <b>membrane</b> that lets water through but holds the dissolved particles in. The cells are full of dissolved stuff. Plain water outside has none. That difference is what makes water move.',
      overlay(sim,ctx,LH,k,tau){potZoom(ctx,sim,k,tau,{x:340,y:232,r:118,to:[PBX(0)+16,350]});
        tag(ctx,'plain water',262,104,k,{s:12});tag(ctx,'cell wall',420,104,k,{s:12});tag(ctx,'starch grain (white)',340,372,k,{s:12});tag(ctx,'dissolved sugars and salts (brown dots)',340,402,k,{s:12});} },
    { key: 'pure', title: 'Plain water: the core gains', set: { bal: 1 }, fresh: true, speed: 0.5,
      see: 'Watch the zoom: blue water drops move into the cells, and each membrane presses out against its wall. The core swells and the balance number climbs.',
      why: 'Water moves by <b>osmosis</b> toward the side with more dissolved particles. Inside the cells has more, so water moves in. The wall stops the cell from bursting, so the core just gets firmer and heavier. Plain water is <b>hypotonic</b> to the potato.',
      so: 'That is why a limp carrot stick crisps up overnight in a glass of water.',
      overlay(sim,ctx,LH,k,tau){potZoom(ctx,sim,k,tau,{x:340,y:232,r:118,to:[PBX(0)+16,350]});tag(ctx,'water moves IN →',340,98,k,{s:13,hi:true,c:PAL['s2']});tag(ctx,'membranes press on the walls',340,372,k,{s:12});tag(ctx,'The core’s swelling is drawn about 2× bigger; the balance shows the real mass.',300,432,k,{s:12});} },
    { key: 'strong', title: 'Strong sugar water: the core loses', set: { bal: 6 }, fresh: true, speed: 0.5,
      see: 'Now the zoom shows the core in beaker 6. Water drops move out of the cells. Each membrane pulls away from its wall, and the core shrinks. The balance number drops.',
      why: 'The sugar water now has more dissolved particles than the cells, so water leaves them toward it. With less water inside, the membranes shrink away from the walls (<b>plasmolysis</b>) and the core goes limp and bendy. 1.0 M sugar is <b>hypertonic</b> to the potato.',
      so: 'That is why sugar on cut strawberries pulls their juice out.',
      overlay(sim,ctx,LH,k,tau){potZoom(ctx,sim,k,tau,{x:250,y:232,r:118,to:[PBX(5)-20,350]});tag(ctx,'← water moves OUT',250,98,k,{s:13,hi:true,c:'#b3261e'});tag(ctx,'membranes pull away from the walls',250,372,k,{s:12});} },
    { key: 'weigh', title: 'Read the balance', set: { bal: 6 }, speed: 1,
      see: 'The card works out the core on the balance as it soaks: its starting mass, its mass now and the percent change.',
      why: 'You cannot see water moving in a real lab, but you can weigh it. A heavier core took in water and a lighter core lost water. We use <b>percent change</b> = (now − start) ÷ start × 100 because the cores start at different masses, like comparing test scores out of different totals.',
      overlay(sim,ctx,LH,k){const c=pCore(sim),m=pMass(c),p=pPct(c);
        potCard(ctx,[['Core from beaker '+(sim.p.bal|0),700],['started: '+c.m0.toFixed(3)+' g'],['now: '+m.toFixed(3)+' g'],['('+m.toFixed(2)+' − '+c.m0.toFixed(2)+') ÷ '+c.m0.toFixed(2)+' × 100'],['= '+(p>=0?'+':'')+p.toFixed(1)+'%',700,16,p<0?'#b3261e':PAL['s2']],[p<-0.3?'lost mass → water left':p>0.3?'gained mass → water entered':'barely changed',600,12]],k);} },
    { key: 'graph', title: 'Find where nothing changes', fresh: true, speed: 1.5,
      see: 'The red line above the beakers is a graph: each dot sits over its beaker, higher if that core gained mass and lower if it lost. Watch the line cross the dashed zero line.',
      why: 'Below about 0.3 M the cores gain and above it they lose, so somewhere in between a core would not change at all. That crossing is the <b>isotonic point</b>: sugar water as concentrated as the inside of the potato cells, so water moves in and out equally.',
      so: 'In your lab you make this same graph: molarity on x, percent change on y.',
      overlay(sim,ctx,LH,k){potGraph(ctx,sim,k);} },
    { lvl: 'honors', key: 'zoomin', title: 'Zoom in to measure better', set: { range: 'fine' }, fresh: true, speed: 2,
      see: 'New beakers from 0.20 to 0.45 M, all close to the crossing. The red line is now much flatter, and its zero crossing is easier to pin down.',
      why: 'The first run showed the answer is between 0.2 and 0.4 M. Spacing new trials closely around it gives a more precise isotonic point, about 0.30 M for this potato. Scientists zoom in like this whenever a first run brackets the answer.',
      overlay(sim,ctx,LH,k){potGraph(ctx,sim,k);} },
    { lvl: 'ap', key: 'psi', title: 'Turn it into water potential', set: { range: 'fine' }, fresh: true, speed: 2,
      see: 'The card plugs the crossing point into ψs = −iCRT as the soak runs.',
      why: 'At the isotonic point, ψ outside equals ψ inside. In an open beaker the solution has no pressure (ψp = 0), so ψ = ψs = −iCRT. That makes the potato cells’ water potential about −7.4 bar.',
      overlay(sim,ctx,LH,k){const m=potGraph(ctx,sim,k,{iso:true}),iso=potIso(sim),i=sim.p.solute==='nacl'?2:1,T=sim.p.temp+273;
        if(Number.isFinite(iso))potCard(ctx,[['ψs = −iCRT',700],['= −('+i+')('+iso.toFixed(2)+')(0.0831)('+T+')'],['= '+(-i*iso*0.0831*(T)).toFixed(1)+' bar',700,15]],k,590,118);} },
    { lvl: 'ap', key: 'nacl', title: 'Salt instead of sugar', set: { solute: 'nacl' }, fresh: true, speed: 2,
      see: 'Back to 0 to 1.0 M, but the beakers now hold NaCl (table salt). The crossing point moves down to about 0.15 M, yet the card gives about the same ψ.',
      why: 'Each NaCl splits into Na⁺ and Cl⁻ (i = 2), so half the molarity makes the same number of dissolved particles. The potato did not change, so its water potential did not change.',
      overlay(sim,ctx,LH,k){potGraph(ctx,sim,k);const iso=potIso(sim),T=sim.p.temp+273;
        if(Number.isFinite(iso))potCard(ctx,[['ψs = −iCRT',700],['= −(2)('+iso.toFixed(2)+')(0.0831)('+T+')'],['= '+(-2*iso*0.0831*T).toFixed(1)+' bar',700,15]],k,590,118);} }
  ],
  useIt: [
    { do: 'Keep cut carrot and celery sticks in a container of plain water in the fridge.',
      why: 'Plain water is hypotonic to their cells, like beaker 1, so water moves in and the walls push back. They stay crisp for days instead of going limp.' },
    { do: 'Sprinkle sugar on cut strawberries and wait about 30 minutes before serving.',
      why: 'The sugar dissolves into a very concentrated syrup on the fruit, like beaker 6. Water leaves the fruit cells toward it, so the berries soften and make their own juice.' },
    { do: 'Put opened jam in the fridge, even though sugar helps preserve it.',
      why: 'Jam is so full of sugar that water moves out of any microbe that lands in it, so the microbe dries out. But water dripping off the lid can dilute the top layer enough for mold to grow, so cold storage is the backup (Indiana Public Media, A Moment of Science).' },
    { do: 'Use only as much fertilizer as the label says, and water it in.',
      why: 'Fertilizer is mostly salts. Too much makes the soil water more concentrated than the root cells, so water leaves the roots and the plant wilts and browns. Gardeners call this fertilizer burn (WSU Extension). Flushing with plenty of water washes the extra salt away.' }
  ],
  tryIt: [
    { title: 'the french-fry weigh-in (a few hours)',
      steps: ['With an adult’s OK, cut three potato sticks the same size, like thick fries. Weigh each on a kitchen scale and write the numbers down.', 'Fill three cups with 1 cup of water each. Stir in nothing, 2 tablespoons of sugar, and ⅓ cup of sugar.', 'Put one stick in each cup for 3 hours (or overnight in the fridge). Blot each one dry, weigh it again, and work out its percent change.'],
      look: 'The plain-water stick gains mass and the ⅓-cup stick loses mass and goes bendy. The 2-tablespoon cup (about 0.3 M) is close to the potato’s isotonic point, so that stick barely changes. You just ran your class lab at home.' }
  ]
}
});
/* ---------- build a macromolecule ---------- */
const mPool=i=>[60+(i%6)*72,100];
const mSlot=i=>44+i*56+28;
/* real-look foods, drawn small: what these molecules are in your kitchen */
function food(ctx,kind,x,y,s){s=s||1;ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.lineJoin='round';
  if(kind==='bread'){ctx.beginPath();ctx.moveTo(-16,16);ctx.lineTo(-16,-4);ctx.arc(-8,-6,9,Math.PI,1.5*Math.PI);ctx.arc(8,-6,9,1.5*Math.PI,0);ctx.lineTo(16,16);ctx.closePath();ctx.fillStyle='#ecd3a0';ctx.fill();ctx.lineWidth=3.5;ctx.strokeStyle='#a5652a';ctx.stroke();
    ctx.fillStyle='rgba(165,101,42,.25)';[[-6,2],[5,7],[-2,11],[7,-3]].forEach(q=>{ctx.beginPath();ctx.arc(q[0],q[1],1.4,0,6.29);ctx.fill();});}
  else if(kind==='rice'){ctx.fillStyle='#fbfaf6';ctx.beginPath();ctx.ellipse(0,-2,15,8,0,Math.PI,0);ctx.fill();for(let i=0;i<9;i++){ctx.beginPath();ctx.ellipse(-11+i*2.8,-4-(i%3)*2,2.2,1,i,0,6.29);ctx.strokeStyle='#d8d3c4';ctx.lineWidth=0.8;ctx.stroke();}
    ctx.beginPath();ctx.moveTo(-17,-2);ctx.lineTo(17,-2);ctx.quadraticCurveTo(15,15,0,15);ctx.quadraticCurveTo(-15,15,-17,-2);ctx.fillStyle='#3d6fa8';ctx.fill();}
  else if(kind==='powder'){ctx.beginPath();ctx.moveTo(-17,12);ctx.quadraticCurveTo(-6,-12,0,-12);ctx.quadraticCurveTo(6,-12,17,12);ctx.closePath();ctx.fillStyle='#fdfdfb';ctx.fill();ctx.strokeStyle='#c9c9c3';ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle='rgba(0,0,0,.06)';ctx.beginPath();ctx.moveTo(2,-11);ctx.quadraticCurveTo(8,-8,17,12);ctx.lineTo(4,12);ctx.closePath();ctx.fill();}
  else if(kind==='egg'){ctx.beginPath();ctx.moveTo(-16,2);ctx.bezierCurveTo(-18,-14,4,-16,12,-8);ctx.bezierCurveTo(20,0,14,14,0,13);ctx.bezierCurveTo(-12,13,-15,8,-16,2);ctx.fillStyle='#fdfbf4';ctx.fill();ctx.strokeStyle='#d9d3c3';ctx.lineWidth=1;ctx.stroke();
    ctx.beginPath();ctx.arc(-1,0,6.5,0,6.29);ctx.fillStyle='#f2a91c';ctx.fill();}
  else if(kind==='beans'){[[-8,-4,0.4],[6,-6,-0.3],[-1,6,0.1]].forEach(q=>{ctx.save();ctx.translate(q[0],q[1]);ctx.rotate(q[2]);ctx.beginPath();ctx.ellipse(0,0,8,5,0,0,6.29);ctx.fillStyle='#7a2f22';ctx.fill();ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.ellipse(-2,-2,3,1.4,0,0,6.29);ctx.fill();ctx.restore();});}
  else if(kind==='oil'){ctx.beginPath();ctx.moveTo(0,-16);ctx.bezierCurveTo(6,-6,12,0,12,6);ctx.arc(0,6,12,0,Math.PI);ctx.bezierCurveTo(-12,0,-6,-6,0,-16);ctx.fillStyle='rgba(214,178,40,.85)';ctx.fill();ctx.fillStyle='rgba(255,255,255,.4)';ctx.beginPath();ctx.ellipse(-4,4,2.5,5,0.3,0,6.29);ctx.fill();}
  else if(kind==='butter'){ctx.fillStyle='#f6e27f';ctx.fillRect(-16,-6,30,16);ctx.fillStyle='#e9cf5c';ctx.beginPath();ctx.moveTo(-16,-6);ctx.lineTo(-10,-12);ctx.lineTo(20,-12);ctx.lineTo(14,-6);ctx.closePath();ctx.fill();ctx.fillStyle='#d8bd47';ctx.beginPath();ctx.moveTo(14,-6);ctx.lineTo(20,-12);ctx.lineTo(20,4);ctx.lineTo(14,10);ctx.closePath();ctx.fill();}
  else if(kind==='cracker'){ctx.fillStyle='#e7c88c';H.rr(ctx,-15,-15,30,30,3);ctx.fill();ctx.strokeStyle='#c39a55';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#b98b45';for(let i=0;i<3;i++)for(let j=0;j<3;j++){ctx.beginPath();ctx.arc(-8+i*8,-8+j*8,1.2,0,6.29);ctx.fill();}}
  ctx.restore();}
/* a card: real foods on the left, a line or two of text on the right */
function foodCard(ctx,k,items,lines,o){o=o||{};const x=o.x||30,y=o.y||136,w=o.w||430,h=o.h||58;ctx.save();ctx.globalAlpha=0.97;ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,x,y,w,h,8);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  items.forEach((it,i)=>food(ctx,it,x+26+i*40,y+h/2,0.95));const tx=x+18+items.length*40;
  lines.forEach((L,i)=>H.txt(ctx,L,tx,y+h/2+(i-(lines.length-1)/2)*18+5,{s:(i?12:13)*k,w:i?500:700,c:i?PAL['cv-soft']:PAL['cv-ink']}));}
function pulse(ctx,x,y,r,tau){const a=0.5+0.5*Math.sin(tau*5);ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=2.5;ctx.globalAlpha=0.5+0.5*a;ctx.beginPath();ctx.arc(x,y,r+a*3,0,6.29);ctx.stroke();ctx.restore();}
function joinN(sim){const n=sim.p.mono==='fat'?3:sim.st.free-1;for(let i=0;i<n;i++)sim.st.q.push('join');}
function splitN(sim,n){for(let i=0;i<n;i++)sim.st.q.push('split');}

BioLab.addLearn({
macromolecules: {
  goals: {
    bio: ['What a monomer and a polymer are, and which foods are made of them', 'Why building a chain gives off water and breaking one uses water', 'How digestion turns bread, eggs and oil into pieces small enough to absorb', 'How this explains fiber, lactose-free milk and the nutrition label'],
    honors: ['What a monomer and a polymer are, and which foods are made of them', 'Why building a chain gives off water and breaking one uses water', 'How digestive enzymes speed up hydrolysis, one bond at a time', 'How this explains fiber, lactose-free milk and the nutrition label'],
    ap: ['Why building a chain gives off water and breaking one uses water', 'How digestive enzymes speed up hydrolysis, one bond at a time', 'How to keep the books: the mass of a polymer of n monomers', 'How this explains fiber, lactose-free milk and the nutrition label']
  },
  matters: 'Almost everything you eat is made of big molecules: carbohydrates, proteins and fats. Your gut can only absorb small pieces, so digestion has to cut the big ones apart, and your cells build their own big molecules from those pieces. Both jobs use the same two reactions.',
  question: 'A cracker is mostly starch, a long chain of glucose. Your gut can only absorb single glucose molecules. To cut a 12-glucose piece of starch into single glucose, how many bonds must be cut, and how many water molecules does it take?',
  startKey: 'mono', startRun: true, startSpeed: 0.3,
  startOverlay(sim,ctx,LH,k){foodCard(ctx,k,['bread','rice'],['Starch: long chains of glucose','The main thing in bread, rice, pasta and potatoes']);
    tag(ctx,'One glucose, a sugar',372,62,k,{s:12,hi:true});line(ctx,400,74,mPool(5)[0],mPool(5)[1]-18,'#c8102e');tag(ctx,'Water molecules',640,206,k,{s:12});},
  steps: [
    { key: 'mono', title: 'Monomers: the building blocks', fresh: true, speed: 0.3,
      see: 'Each six-sided shape is one <b>glucose</b> molecule, the sugar in your blood. Real glucose is a ring of 5 carbons and 1 oxygen, about 1 nanometer across. Water molecules on the right are about 0.3 nanometers.',
      why: 'A small building-block molecule like glucose is a <b>monomer</b>. Thousands of glucose linked in a chain make <b>starch</b>, a <b>polymer</b>. Molecules are far too small to have a color, so the colors here are labels. Starch you can actually see is a white powder: cornstarch.',
      overlay(sim,ctx,LH,k){foodCard(ctx,k,['powder','bread'],['What starch looks like to you: white powder','Each speck of cornstarch holds millions of chains']);
        tag(ctx,'glucose ≈ 1 nm',372,62,k,{s:12,hi:true});line(ctx,400,74,mPool(5)[0],mPool(5)[1]-18,'#c8102e');tag(ctx,'water ≈ 0.3 nm',640,206,k,{s:12,hi:true});} },
    { key: 'ends', title: 'Where the bonds form', speed: 0.3,
      see: 'Look at the two pulsing circles. Every glucose has an <b>–H</b> (white) on its left end and an <b>–OH</b> (red O with a white H) on its right end.',
      why: 'These ends are where one glucose can link to the next. The –OH of one and the –H of its neighbor are about to come off together.',
      overlay(sim,ctx,LH,k,tau){const a=mPool(0),b=mPool(1);pulse(ctx,a[0]+24,a[1],11,tau);pulse(ctx,b[0]-25,b[1],8,tau);
        tag(ctx,'–OH end of glucose 1',a[0]+30,152,k,{s:12,hi:true});line(ctx,a[0]+30,140,a[0]+24,a[1]+10,'#c8102e');tag(ctx,'–H end of glucose 2',b[0]+90,180,k,{s:12,hi:true});line(ctx,b[0]+40,170,b[0]-25,b[1]+8,'#c8102e');} },
    { key: 'join', title: 'Joining makes water', speed: 0.35, run(sim){sim.st.q.push('join');},
      see: 'Watch the first join in slow motion. The –OH and the –H glow, come off together as one H₂O, and fly into the water box. The two glucose are now held by a bond.',
      why: 'O + 2 H is exactly a water molecule. Pulling it out leaves each glucose with an open spot, and those spots link up. That is <b>dehydration synthesis</b>: “de-hydration” means taking water out, “synthesis” means building.',
      overlay(sim,ctx,LH,k){tag(ctx,'–OH + –H  →  H₂O',300,206,k,{s:13,hi:true});} },
    { key: 'chain', title: 'Every bond gives off one water', fresh: true, speed: 1, run: joinN,
      see: 'Now all six join. Count along with the card: each new bond sends one more water into the box.',
      why: 'Every bond needs one –OH and one –H, so every bond releases exactly one water. Six glucose in a row have 5 links between them, like a paper chain, so building it released 5 waters. A chain of n monomers always has n − 1 bonds.',
      overlay(sim,ctx,LH,k){const s=sim.st,b=Math.max(0,s.len-1);foodCard(ctx,k,[],['Glucose in the chain: '+s.len+'   Bonds: '+b+'   Waters released: '+s.wout,'n monomers → n − 1 bonds → n − 1 waters'],{x:30,y:126,w:430,h:62});} },
    { key: 'long', title: 'Real starch is much longer', set: { start: 12, startAs: 'chain' }, fresh: true, speed: 0.5,
      see: 'A 12-glucose chain fills the whole box. The dashes show where a real starch molecule would keep going: hundreds to many thousands of glucose long, often branched and coiled.',
      why: 'Plants store the sugar they make as starch. One giant molecule is easier to pack into a potato or a grain of rice than thousands of loose sugars. To use it, you have to cut it back into glucose.',
      overlay(sim,ctx,LH,k){const x=mSlot(11)+26;ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=3;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(x,318);ctx.lineTo(790,318);ctx.stroke();ctx.restore();
        tag(ctx,'…keeps going for hundreds to thousands more glucose',420,262,k,{s:13,hi:true});foodCard(ctx,k,['rice','bread'],['Rice, bread, pasta, potatoes and corn','are mostly starch, besides their water']);} },
    { key: 'split', title: 'Splitting uses water', set: { startAs: 'chain' }, fresh: true, speed: 0.35, run(sim){splitN(sim,1);},
      see: 'Now the reverse. A water molecule leaves the box, flies to a bond and splits: its –H goes to one glucose, its –OH to the other. The bond breaks.',
      why: 'This is <b>hydrolysis</b>: “hydro” means water, “lysis” means splitting. It puts back the exact water that building the bond took out, so each glucose gets its –H and –OH ends back.',
      overlay(sim,ctx,LH,k){tag(ctx,'H₂O goes IN and breaks the bond',300,206,k,{s:13,hi:true});} },
    { key: 'digest', title: 'This is digestion', set: { startAs: 'chain' }, fresh: true, speed: 0.8, run(sim){splitN(sim,5);},
      see: 'The whole chain gets cut, one bond and one water at a time, until six single glucose float free.',
      why: 'Your gut can only absorb single sugars, so digestion is hydrolysis. Amylase in your saliva starts cutting starch while you chew, and your small intestine finishes the job. The glucose then goes into your blood, which is why starchy food raises blood sugar.',
      so: 'Chew a plain cracker for a minute and it starts to taste sweet: your saliva is already cutting starch into sugar.',
      overlay(sim,ctx,LH,k){foodCard(ctx,k,['cracker'],['Waters used: '+sim.st.win+'   Bonds cut: '+sim.st.win,'Chewing starts this; your small intestine finishes it'],{y:126,h:62,w:430});} },
    { key: 'protein', title: 'Proteins: the same trick', set: { mono: 'amino' }, fresh: true, speed: 1, run: joinN,
      see: 'Now the monomers are <b>amino acids</b> (this one is alanine). They join the same way, one water per bond, into a chain called a <b>polypeptide</b>, which folds up into a protein.',
      why: 'Eggs, beans and meat are full of protein. You digest it by hydrolysis into amino acids, absorb them, and your cells join them back together in a new order to build your own proteins, like muscle and enzymes.',
      overlay(sim,ctx,LH,k){foodCard(ctx,k,['egg','beans'],['Protein you eat: eggs, beans, meat, milk','Cut into amino acids, then rebuilt into your proteins'],{y:126,h:62});} },
    { key: 'fat', title: 'Fats: three tails, not a chain', set: { mono: 'fat' }, fresh: true, speed: 1, run: joinN,
      see: 'A fat is built on one <b>glycerol</b> (the gray bar). Each of its 3 –OH groups joins one <b>fatty acid</b> tail, releasing one water each: 3 waters in all.',
      why: 'It uses the same water-releasing reaction, but a fat is not a polymer: it is not a repeating chain, and it stops at 3 tails. Oils and butter are mostly these molecules, called <b>triglycerides</b>.',
      overlay(sim,ctx,LH,k){foodCard(ctx,k,['oil','butter'],['Fats you eat: oil, butter','One glycerol + 3 fatty acids'],{x:30,y:136,w:330});} },
    { lvl: 'honors', key: 'enzyme', title: 'Enzymes do the cutting', set: { start: 8, startAs: 'chain', enzyme: true }, fresh: true, speed: 0.8,
      see: 'The purple enzyme (here amylase) grabs a bond and a water and splits them, again and again, every second or so.',
      why: 'Hydrolysis happens by itself only very slowly. A digestive enzyme holds the bond and the water in just the right spot so the split happens fast. Each enzyme fits one kind of bond: amylase cuts starch, lactase cuts the milk sugar lactose, and proteases cut proteins.',
      overlay(sim,ctx,LH,k){tag(ctx,'Each enzyme fits one kind of bond',300,206,k,{s:13,hi:true});} },
    { lvl: 'ap', key: 'mass', title: 'Keeping the books', set: { start: 5 }, fresh: true, speed: 0.8, run: joinN,
      see: 'Five glucose join. The card tracks the chain’s mass as each water leaves.',
      why: 'Mass is conserved: every water that leaves takes 18.02 g/mol with it. So a polymer of n monomers weighs n × M − (n − 1) × 18.02. Five glucose make 5 × 180.16 − 4 × 18.02 = 828.7 g/mol, not 900.8.',
      overlay(sim,ctx,LH,k){const n=sim.st.len,b=Math.max(0,n-1);foodCard(ctx,k,[],['Chain mass = '+n+' × 180.16 − '+b+' × 18.02','= '+(n?(n*180.16-b*18.02).toFixed(1):'0.0')+' g/mol'],{y:126,h:62,w:430});} }
  ],
  useIt: [
    { do: 'Read the nutrition label as a list of macromolecules.',
      why: 'Total carbohydrate, protein and total fat are the three kinds of big molecules you just built. The label counts fiber and sugars inside total carbohydrate (FDA).' },
    { do: 'Eat fiber, even though you can’t digest it.',
      why: 'Fiber is a carbohydrate made of sugar units too, but your body has no enzyme to cut its bonds, so it passes through undigested. That is why it fills you up and helps digestion without turning into blood sugar (Harvard T.H. Chan School of Public Health).' },
    { do: 'If milk upsets someone’s stomach, look for lactose-free milk or lactase drops.',
      why: 'Lactose is two sugars joined by one bond. People who make less lactase can’t cut that bond well. Lactose-free milk already has lactase added, so the hydrolysis happens in the carton instead of the gut (NIDDK).' },
    { do: 'Chew your food well.',
      why: 'Digestion of starch starts in your mouth: amylase in saliva begins cutting the bonds while you chew, and smaller pieces give enzymes more bonds to reach.' }
  ],
  tryIt: [
    { title: 'the cracker test (2 minutes)',
      steps: ['Take a bite of a plain, unsalted cracker or a piece of plain white bread.', 'Chew it slowly for one to two minutes without swallowing.', 'Pay attention to how the taste changes.'],
      look: 'It starts out bland and turns slightly sweet. Amylase in your saliva is hydrolyzing starch into maltose, a sugar made of two glucose. Each cut uses one water molecule from your saliva.' }
  ]
}
});
/* ---------- properties of water: hydrogen bonds and the heating curve ---------- */
function wSet(sim,ph,f){const A=sim.def.art,g=A.segOf(sim.p.sub,ph);const h=g.h0+(g.h1-g.h0)*(f||0);sim.st.h=h;sim.st.h0=h;sim.st.cur=A.stateOf(sim.p.sub,h);}
function wSetT(sim,T){const A=sim.def.art,h=A.hOf(sim.p.sub,T);sim.st.h=h;sim.st.h0=h;sim.st.cur=A.stateOf(sim.p.sub,h);}
function wCard(ctx,k,lines,x,y,w){x=x||268;y=y||16;w=w||158;const h=12+lines.length*19;ctx.save();ctx.globalAlpha=0.97;ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,x,y,w,h,8);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  lines.forEach((L,i)=>H.txt(ctx,L[0],x+9,y+19+i*19,{s:(L[2]||12)*k,w:L[1]||500,c:L[3]||PAL['cv-ink']}));}
const wE=sim=>(sim.st.h-sim.st.h0)*sim.p.mass/1000;
/* cover the zoom circle with a fresh panel */
function wPanel(ctx,sim){const A=sim.def.art;ctx.save();ctx.beginPath();ctx.arc(A.MX,A.MY,A.MR,0,6.29);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.restore();}
function bigWater(ctx,x,y,s,ang){const O=34*s,Hr=19*s,L=46*s,half=104.5/2*Math.PI/180;ctx.save();ctx.translate(x,y);ctx.rotate(ang||0);
  ctx.beginPath();ctx.arc(0,0,O,0,6.29);ctx.fillStyle='#d64545';ctx.fill();
  [-half,half].forEach(a=>{const hx=Math.sin(a)*L,hy=Math.cos(a)*L;ctx.beginPath();ctx.arc(hx,hy,Hr,0,6.29);ctx.fillStyle='#f2f2f2';ctx.fill();ctx.strokeStyle='#6a6a70';ctx.lineWidth=2;ctx.stroke();});ctx.restore();}

BioLab.addLearn({
water: {
  goals: {
    bio: ['What a water molecule looks like, and why its ends are slightly charged', 'What a hydrogen bond is, and why it makes ice float', 'Why the temperature stops rising while ice melts and while water boils', 'How this explains sweat, steam burns, burst pipes and lake ice'],
    honors: ['What a water molecule looks like, and why its ends are slightly charged', 'What a hydrogen bond is, and why it makes ice float', 'Why water has such a high specific heat, and how ethanol compares', 'How this explains sweat, steam burns, burst pipes and lake ice'],
    ap: ['Why water is polar and forms hydrogen bonds', 'Why temperature holds steady during a phase change (latent heat)', 'How to measure specific heat and heat of fusion from the curve', 'How this explains sweat, steam burns, burst pipes and lake ice']
  },
  matters: 'You are about 60% water, and so is most of life. Water does strange things: its ice floats, it warms up slowly, and evaporating it pulls a lot of heat away. All of that comes from one small attraction between molecules, the hydrogen bond.',
  question: 'You put a glass of ice water on a hot stove. While there is still ice in the glass, what does a thermometer in the water read, and why?',
  startKey: 'start', startRun: false,
  startOverlay(sim,ctx,LH,k){const A=sim.def.art;tag(ctx,'A beaker of ice on a hot plate',170,94,k,{s:12,hi:true});tag(ctx,'Zoomed in to single molecules',A.MX,A.MY-A.MR-6,k,{s:12,hi:true});},
  steps: [
    { key: 'molecule', title: 'One water molecule', fresh: true, pause: true, run(sim){wSetT(sim,-20);},
      see: 'This is one water molecule, blown up hugely. One oxygen atom (red) holds two hydrogen atoms (white) in a bent, V shape. The whole molecule is only about 0.28 nanometers wide.',
      why: 'Oxygen pulls the shared electrons toward itself, so its end is slightly negative (δ−) and the two hydrogen ends are slightly positive (δ+). A molecule with charged ends like this is <b>polar</b>. Real water is clear: the red and white are labels for the atoms.',
      overlay(sim,ctx,LH,k){const A=sim.def.art;wPanel(ctx,sim);bigWater(ctx,A.MX,A.MY-24,1.35,Math.PI);
        tag(ctx,'δ−  oxygen',A.MX,A.MY+50,k,{s:13,hi:true,c:'#b3261e'});tag(ctx,'δ+  hydrogen',A.MX-92,A.MY-112,k,{s:13,c:'#1b4f8a'});tag(ctx,'δ+  hydrogen',A.MX+92,A.MY-112,k,{s:13,c:'#1b4f8a'});
        tag(ctx,'104.5° bend, about 0.28 nm wide',A.MX,A.MY+110,k,{s:12});} },
    { key: 'hbond', title: 'Opposite ends attract', pause: true,
      see: 'Back to the zoom of the ice. The highlighted dashed line joins the slightly positive hydrogen of one molecule to the slightly negative oxygen of its neighbor.',
      why: 'Opposite charges attract, so neighboring water molecules cling to each other. That pull is a <b>hydrogen bond</b>. It is about 20 times weaker than the bonds inside the molecule, so it breaks and re-forms easily, but there are trillions of them in every drop.',
      overlay(sim,ctx,LH,k,tau){const A=sim.def.art,v=sim.vis;if(!v.mol||!v.edges)return;let best=null,bd=1e9;v.edges.forEach(e=>{const a=v.mol[e[0]],b=v.mol[e[1]],d=Math.hypot((a.x+b.x)/2-A.MX,(a.y+b.y)/2-A.MY);if(d<bd){bd=d;best=[a,b];}});
        if(best){const pu=0.5+0.5*Math.sin(tau*4),a=best[0],b=best[1];a.ang=Math.atan2(b.y-a.y,b.x-a.x)-0.91;ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=3;ctx.globalAlpha=0.6+0.4*pu;[a,b].forEach(m=>{ctx.beginPath();ctx.arc(m.x,m.y,17,0,6.29);ctx.stroke();});
          ctx.lineWidth=4;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(a.x+Math.cos(a.ang+0.91)*10,a.y+Math.sin(a.ang+0.91)*10);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();line(ctx,A.MX,A.MY+A.MR-38,(a.x+b.x)/2,(a.y+b.y)/2+10,'#c8102e');
          tag(ctx,'hydrogen bond: δ+ H pulled toward δ− O',A.MX,A.MY+A.MR-26,k,{s:12,hi:true});}} },
    { key: 'ice', title: 'Ice: a locked lattice', speed: 0.1, run(sim){wSetT(sim,-20);},
      see: 'Each molecule in the ice holds four neighbors with hydrogen bonds, locked into six-sided rings with open space in the middle. As the hot plate heats it, the thermometer rises and the molecules shake harder in place.',
      why: 'Heat makes molecules move faster, and temperature measures that motion. In ice they can only vibrate, because the hydrogen bonds hold every molecule at arm’s length.',
      so: 'Those six-sided rings are why snowflakes have six sides.',
      overlay(sim,ctx,LH,k){const A=sim.def.art;tag(ctx,'open six-sided rings',A.MX,A.MY-A.MR+20,k,{s:12,hi:true});} },
    { key: 'melt', title: 'Melting: stuck at 0 °C', speed: 0.6, run(sim){wSet(sim,'melt',0);},
      see: 'The ice is melting. Watch the card: energy keeps pouring in, but the thermometer stays at 0.0 °C. In the zoom, molecules break out of the lattice one by one.',
      why: 'All the heat goes into breaking hydrogen bonds, freeing molecules from the lattice, instead of making them move faster. The temperature can’t rise until every bit of ice has melted. Melting 1 g of ice takes 334 J.',
      so: 'That is why a cooler stays near 0 °C until the ice is gone.',
      overlay(sim,ctx,LH,k){const c=sim.st.cur;wCard(ctx,k,[['Energy in: '+wE(sim).toFixed(1)+' kJ',700],['Temperature: '+c.T.toFixed(1)+' °C'],['Melted: '+Math.round((c.ph==='melt'?c.f:c.ph==='solid'?0:1)*100)+'%']]);} },
    { key: 'float', title: 'Ice floats', speed: 0.15, run(sim){wSet(sim,'melt',0.45);},
      see: 'The ice cubes float with most of their bulk underwater. The circle now shows a frozen lake from the side: a lid of ice on top, liquid water underneath.',
      why: 'The open rings in ice take up more room than the crowded molecules in liquid water, so ice is less dense: 0.92 g/mL versus 1.00 g/mL. Almost every other substance is denser as a solid. Because ice floats, lakes freeze from the top down, and the ice lid keeps the water below from freezing solid.',
      overlay(sim,ctx,LH,k){const A=sim.def.art,x0=A.MX-A.MR,y0=A.MY-A.MR,W=2*A.MR;ctx.save();ctx.beginPath();ctx.arc(A.MX,A.MY,A.MR,0,6.29);ctx.clip();
        ctx.fillStyle='#cfe2f2';ctx.fillRect(x0,y0,W,110);ctx.fillStyle='#3d6f9e';ctx.fillRect(x0,y0+110,W,W);ctx.fillStyle='#e9f5fb';ctx.fillRect(x0,y0+96,W,22);ctx.strokeStyle='#9cc3dc';ctx.lineWidth=1.5;ctx.strokeRect(x0-2,y0+96,W+4,22);
        ctx.fillStyle='#6b5a3c';ctx.beginPath();ctx.moveTo(x0,y0+W);ctx.quadraticCurveTo(A.MX,y0+W-90,x0+W,y0+W);ctx.fill();
        [[A.MX-40,A.MY+40],[A.MX+50,A.MY+70]].forEach(([fx,fy])=>{ctx.fillStyle='#c9a227';ctx.beginPath();ctx.ellipse(fx,fy,16,6,0,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(fx+14,fy);ctx.lineTo(fx+24,fy-6);ctx.lineTo(fx+24,fy+6);ctx.fill();});ctx.restore();
        tag(ctx,'ice: 0.92 g/mL (floats)',A.MX,y0+86,k,{s:12,hi:true});tag(ctx,'liquid water below stays about 4 °C',A.MX,A.MY+8,k,{s:12});tag(ctx,'1.00 g/mL',150,330,k,{s:12});} },
    { key: 'warm', title: 'Water warms up slowly', speed: 0.3, run(sim){wSetT(sim,20);},
      see: 'Liquid water at 20 °C heating up. The card shows the energy going in and how much the temperature has risen. In the zoom, molecules slide past each other, constantly breaking and re-forming hydrogen bonds.',
      why: 'It takes 4.18 J to warm 1 g of water by 1 °C. That is water’s <b>specific heat</b>, and it is unusually high: dry sand needs only about 0.8 J. Before the molecules can speed up, some of the heat goes into tugging on hydrogen bonds.',
      so: 'That is why beach sand can burn your feet while the water stays cool, and why oceans keep coastal weather mild.',
      overlay(sim,ctx,LH,k){const c=sim.st.cur;wCard(ctx,k,[['Energy in: '+wE(sim).toFixed(1)+' kJ',700],['Warmed: +'+Math.max(0,c.T-20).toFixed(1)+' °C'],['4.18 J per g per °C']]);} },
    { key: 'boil', title: 'Boiling: stuck at 100 °C', speed: 3, run(sim){wSet(sim,'boil',0);},
      see: 'At 100 °C the water boils. Bubbles of steam rise, and the thermometer stays at 100 °C for a long time while the water level drops. In the zoom, molecules break free and fly off as gas.',
      why: 'To become gas, a molecule has to break every hydrogen bond it has, not just loosen them. That takes 2,260 J per gram, about 7 times as much as melting. Until all of it has boiled away, the extra heat goes into breaking bonds, not raising the temperature.',
      so: 'In Denver water boils at about 95 °C, and turning the burner up only makes it boil away faster, not get hotter.',
      overlay(sim,ctx,LH,k){const c=sim.st.cur;wCard(ctx,k,[['Energy in: '+wE(sim).toFixed(1)+' kJ',700],['Temperature: '+c.T.toFixed(1)+' °C'],['Boiled away: '+Math.round((c.ph==='boil'?c.f:c.ph==='gas'?1:0)*100)+'%']]);} },
    { key: 'steam', title: 'Steam gives the heat back', set: { dir: 'cool' }, speed: 3, run(sim){wSet(sim,'boil',1);},
      see: 'Now the plate cools the steam. It condenses back into liquid, and the thermometer holds at 100 °C again while it does.',
      why: 'When steam condenses, the hydrogen bonds form again and release the same 2,260 J per gram they took to break. That heat is released wherever the steam condenses, including on your skin.',
      so: 'That is why steam burns worse than boiling water at the same temperature.',
      overlay(sim,ctx,LH,k){const c=sim.st.cur;wCard(ctx,k,[['Heat released: '+(-wE(sim)).toFixed(1)+' kJ',700],['Temperature: '+c.T.toFixed(1)+' °C']]);} },
    { lvl: 'honors', key: 'ethanol', title: 'Ethanol for comparison', set: { sub: 'ethanol' }, speed: 0.6, run(sim){wSetT(sim,20);},
      see: 'Now the beaker holds ethanol, also starting at 20 °C on the same heater. Its temperature climbs much faster, and it boils at just 78 °C.',
      why: 'Ethanol has only one O–H, so each molecule forms about half as many hydrogen bonds as water. Less heat goes into the bonds, so its specific heat is only 2.44 J/g·°C, and less energy is needed to pull its molecules apart.',
      overlay(sim,ctx,LH,k){const c=sim.st.cur;wCard(ctx,k,[['Ethanol',700],['Warmed: +'+Math.max(0,c.T-20).toFixed(1)+' °C'],['2.44 J per g per °C']]);} },
    { lvl: 'ap', key: 'latent', title: 'Measure the heat of fusion', speed: 0.6, run(sim){wSet(sim,'melt',0);},
      see: 'The melt again. The card divides the energy added by the mass, live, while the temperature stays at 0 °C.',
      why: 'During a phase change, the energy raises potential energy (bonds broken), not kinetic energy, so the temperature holds steady. When the plateau ends, energy ÷ mass is the latent heat of fusion: 334 J/g for water.',
      overlay(sim,ctx,LH,k){const E=wE(sim)*1000;wCard(ctx,k,[['Q ÷ m',700],[E.toFixed(0)+' J ÷ '+sim.p.mass+' g'],['= '+(E/sim.p.mass).toFixed(0)+' J/g',700]]);} }
  ],
  useIt: [
    { do: 'On hot, humid days, slow down, drink water and get into shade or air conditioning sooner.',
      why: 'Sweat cools you because evaporating water carries a lot of heat away. When the humidity is high, sweat evaporates more slowly, so your body can’t release heat as fast (CDC).' },
    { do: 'Open lids, microwave bags and steamy containers pointed away from your face.',
      why: 'Steam releases 2,260 J for every gram that condenses on your skin, on top of being 100 °C. That is why steam burns worse than splashes of boiling water.' },
    { do: 'On very cold nights, let a faucet on an outside wall drip.',
      why: 'Water expands when it freezes, which can burst pipes. Even a trickle of running water helps keep the pipe from freezing (American Red Cross).' },
    { do: 'Stay off a frozen lake or pond until the ice is at least 4 inches of solid, clear ice.',
      why: 'Because ice floats, lakes freeze from the top down, and the thickness varies from place to place. Colorado Parks and Wildlife considers 4 inches of solid, clear ice safe for walking.' },
    { do: 'Cook pasta and boiled eggs a little longer in Colorado.',
      why: 'At high altitude water boils below 100 °C, about 95 °C in Denver. Turning the burner up doesn’t make boiling water hotter; it only boils away faster.' }
  ],
  tryIt: [
    { title: 'the sinking ice cube (5 minutes)',
      steps: ['Fill one clear glass with water and another with rubbing alcohol (with an adult’s OK; keep it away from flames).', 'Drop an ice cube into each glass.', 'Watch where each cube ends up.'],
      look: 'The cube floats in water but sinks in rubbing alcohol. Ice (0.92 g/mL) is less dense than water (1.00) but denser than rubbing alcohol (about 0.8 to 0.9; 91% alcohol works best). Floating depends on density, not on ice being special.' },
    { title: 'the wet finger (1 minute)',
      steps: ['Wet one fingertip and leave another dry.', 'Blow gently across both at once.'],
      look: 'The wet finger feels much colder. As the water evaporates, the fastest molecules escape and carry heat away from your skin. That is how sweat cools you.' }
  ]
}
});
/* ---------- food tests lab ---------- */
const fTX=i=>i<8?62+i*62:560+(i-8)*58;
function fAct(sim,id){const a=sim.def.actions.find(x=>x.id===id);if(a)a.run(sim);}
/* a card in the empty top-right corner showing what the reagent does to the molecule */
function fCard(ctx,k,title,sub){ctx.save();ctx.globalAlpha=0.97;ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,290,12,498,104,10);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  H.txt(ctx,title,302,32,{s:13*k,w:700});if(sub)H.txt(ctx,sub,302,108,{s:11*k,c:PAL['cv-soft']});}
function fTubeTag(ctx,k,i,s,hi){tag(ctx,s,fTX(i),132,k,{s:11.5,hi:hi!==false});}
function helix(ctx,x0,y,len,col){ctx.save();ctx.strokeStyle=col||'#b9790f';ctx.lineWidth=3;ctx.beginPath();for(let t=0;t<=len;t+=2){const yy=y+Math.sin(t/9)*14,xx=x0+t;t?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();
  for(let t=4;t<len;t+=18){ctx.fillStyle=col||'#b9790f';ctx.beginPath();for(let j=0;j<6;j++){const a=Math.PI/6+j*Math.PI/3;ctx.lineTo(x0+t+Math.cos(a)*4.5,y+Math.sin(t/9)*14+Math.sin(a)*4.5);}ctx.closePath();ctx.fill();}ctx.restore();}

BioLab.addLearn({
foodtests: {
  goals: {
    bio: ['How each of the four reagents finds one kind of nutrient', 'What each color change means, and why Benedict’s needs heat', 'Why the plain-water tube matters (the negative control)', 'How to use a pattern of results to identify an unknown food'],
    honors: ['How each of the four reagents finds one kind of nutrient', 'Why you need both negative and positive controls', 'How to use a pattern of results to identify an unknown food', 'Where the same tests show up at the doctor and in the kitchen'],
    ap: ['What each reagent reacts with at the molecular level', 'Why Benedict’s is semi-quantitative, and why sucrose stays blue', 'How to use controls and patterns to identify unknowns', 'Where the same tests show up at the doctor and in the kitchen']
  },
  matters: 'Labels tell you what is in your food, but how do scientists know? Each of these tests is a chemical that changes color when it meets one kind of molecule. Doctors use the same idea in the urine test at a physical, and you use it every time you read a home test strip.',
  question: 'Milk’s label lists sugar, protein and fat but no starch. If you test milk with all four reagents, which ones change color, and which one looks just like plain water?',
  startKey: 'rack', startRun: false,
  startOverlay(sim,ctx,LH,k){fTubeTag(ctx,k,0,'plain water');fTubeTag(ctx,k,5,'milk');tag(ctx,'Mystery foods',654,118,k,{s:12,hi:true});},
  steps: [
    { key: 'rack', title: 'The rack and the control', fresh: true, pause: true,
      see: 'Eight known foods sit in the rack, with four mystery samples on the right. The tubes are about life size: real test tubes are about 15 cm tall. The first tube is plain water.',
      why: 'Plain water has none of the nutrients, so whatever color it turns is what “no” looks like. That is the <b>negative control</b>. A result only counts if it looks different from the water tube.',
      overlay(sim,ctx,LH,k){fTubeTag(ctx,k,0,'negative control');fCard(ctx,k,'Four reagents, four questions');[['Iodine','starch?','#c8892e'],['Biuret','protein?','#4b7fd8'],['Benedict’s','sugar?','#2f63c9'],['Sudan III','fat?','#d84a4a']].forEach(([n,q,c],i)=>{const x=306+i*120;ctx.fillStyle=c;H.rr(ctx,x,48,18,30,4);ctx.fill();H.txt(ctx,n,x+26,60,{s:12*k,w:700});H.txt(ctx,q,x+26,78,{s:12*k,c:PAL['cv-soft']});});} },
    { key: 'iodine', title: 'Iodine finds starch', set: { reagent: 'iodine' }, speed: 1, run(sim){fAct(sim,'addAll');},
      see: 'Amber-brown iodine drips into every tube. The starch and potato tubes turn blue-black. Everything else stays amber, like the water tube.',
      why: 'Starch is a long glucose chain that coils into a spring (a helix). Iodine slips inside the coil, and that packed iodine looks blue-black. No coil, no color change.',
      so: 'Bread, rice and pasta would turn dark too.',
      overlay(sim,ctx,LH,k){fCard(ctx,k,'Iodine tucks into the starch coil','Colors are labels. Starch itself is white; iodine packed in the coil looks blue-black.');helix(ctx,300,70,300);
        ctx.fillStyle='#3a2f6e';for(let x=318;x<590;x+=20){ctx.beginPath();ctx.arc(x,70,4.5,0,6.29);ctx.fill();}H.txt(ctx,'→ blue-black',620,74,{s:13*k,w:700,c:'#1e1b3b'});
        fTubeTag(ctx,k,2,'starch');fTubeTag(ctx,k,6,'potato');} },
    { key: 'biuret', title: 'Biuret finds protein', set: { reagent: 'biuret' }, speed: 1, run(sim){fAct(sim,'addAll');},
      see: 'Blue Biuret reagent goes in. Egg white turns violet, milk and potato turn lilac, and the rest stay blue.',
      why: 'Biuret contains copper ions. In a protein, amino acids are linked by peptide bonds, and the copper grabs onto the nitrogen atoms in those bonds. Copper held that way looks violet instead of blue. More protein, deeper violet.',
      so: 'Meat, beans and yogurt would turn violet too.',
      overlay(sim,ctx,LH,k){fCard(ctx,k,'Copper grabs the peptide bonds in a protein','Copper (Cu²⁺) is blue on its own and violet when it holds a protein chain.');
        ctx.strokeStyle='#3f6fb0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(300,64);for(let i=0;i<8;i++)ctx.lineTo(320+i*36,i%2?78:58);ctx.stroke();
        for(let i=1;i<8;i+=2){ctx.fillStyle='#3f6fb0';ctx.beginPath();ctx.arc(320+i*36,78,5,0,6.29);ctx.fill();}
        ctx.fillStyle='#7b3fb0';[356,500].forEach(x=>{ctx.strokeStyle='#7b3fb0';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,78);ctx.lineTo(x+18,89);ctx.lineTo(x+36,78);ctx.stroke();ctx.fillStyle='#7b3fb0';ctx.beginPath();ctx.arc(x+18,89,8,0,6.29);ctx.fill();H.txt(ctx,'Cu',x+18,90,{s:8.5,w:700,c:'#fff',a:'center',b:'middle'});});
        H.txt(ctx,'→ violet',620,74,{s:13*k,w:700,c:'#7b3fb0'});fTubeTag(ctx,k,3,'egg white');fTubeTag(ctx,k,5,'milk');} },
    { key: 'benedict', title: 'Benedict’s: nothing yet', set: { reagent: 'benedict' }, speed: 1, run(sim){fAct(sim,'addAll');},
      see: 'Blue Benedict’s reagent goes into every tube, including glucose and apple juice, which are full of sugar. Every tube stays blue.',
      why: 'Benedict’s finds sugars like glucose, but the reaction only happens when it is hot. Read it cold and you get a <b>false negative</b>: the sugar is there, but the test says no.',
      overlay(sim,ctx,LH,k){fCard(ctx,k,'Benedict’s needs heat','Cold: the copper stays as blue Cu²⁺ ions, even with plenty of sugar.');fTubeTag(ctx,k,1,'glucose: still blue');} },
    { key: 'heat', title: 'Into the hot water bath', set: { reagent: 'benedict' }, speed: 1, run(sim){fAct(sim,'heat');},
      see: 'The rack goes into an 80 °C water bath. Over five minutes, the sugary tubes shift from blue to green, yellow, orange and finally brick red. Water and starch stay blue.',
      why: 'Hot glucose hands electrons to the blue copper ions (Cu²⁺), turning them into copper(I) oxide, a red-orange solid that settles out. More sugar makes more of the solid, so the color goes further toward brick red.',
      so: 'Before glucose meters existed, doctors checked urine for sugar this way.',
      overlay(sim,ctx,LH,k){fCard(ctx,k,'Sugar + heat turns blue copper into a red solid','Benedict’s colors are real: Cu²⁺ is blue and copper(I) oxide is brick red.');
        [['#2f63c9','none'],['#3f9d4a','trace'],['#d9c22e','low'],['#e07a22','medium'],['#a8341f','high']].forEach(([c,l],i)=>{const x=300+i*96;ctx.fillStyle=c;H.rr(ctx,x,48,26,32,5);ctx.fill();H.txt(ctx,l,x+32,68,{s:12*k,c:PAL['cv-ink']});});
        fTubeTag(ctx,k,1,'glucose');fTubeTag(ctx,k,7,'apple juice');} },
    { key: 'sudan', title: 'Sudan III finds fat', set: { reagent: 'sudan' }, speed: 1, run(sim){fAct(sim,'addAll');},
      see: 'Red Sudan III drips in. In the oil and milk tubes, a red layer floats on top. In the rest, the dye just mixes into a pale pink with no layer.',
      why: 'Sudan III is a dye that dissolves in fat but not in water. Fats and oils are less dense than water, so they float, and the dye goes up with them. A red layer on top means fat.',
      overlay(sim,ctx,LH,k){fCard(ctx,k,'The dye dissolves in fat, and fat floats','Oil drops collect the red dye and rise to the top.');
        ctx.fillStyle='#d9ecf5';H.rr(ctx,300,46,240,48,6);ctx.fill();ctx.fillStyle='#c8332e';H.rr(ctx,300,46,240,14,6);ctx.fill();[[340,78],[420,84],[480,72]].forEach(([x,y])=>{ctx.fillStyle='#e05a4a';ctx.beginPath();ctx.arc(x,y,6,0,6.29);ctx.fill();});
        H.txt(ctx,'red layer = fat',556,74,{s:13*k,w:700,c:'#c8332e'});fTubeTag(ctx,k,4,'oil');fTubeTag(ctx,k,5,'milk');} },
    { key: 'unknown', title: 'Identify a mystery food', speed: 1, run(sim){const st=sim.st;['iodine','biuret','benedict','sudan'].forEach(r=>st.tubes[r].forEach(tb=>{tb.added=1;tb.mix=1;tb.heat=5;tb.delay=0;}));BioLab.setValues(sim,{reagent:'benedict',tube:'8'});},
      see: 'Every test has now been run on every tube, and unknown A is selected. The card lists its four results side by side.',
      why: 'One test answers one question, so it takes all four to describe a food. Match the pattern of + and − to the known foods: each + tells you one nutrient that is in it.',
      overlay(sim,ctx,LH,k){const res=sim.st.res[8]||{},nm={iodine:'starch',biuret:'protein',benedict:'sugar',sudan:'fat'};fCard(ctx,k,'Unknown A: four results, one food');
        ['iodine','biuret','benedict','sudan'].forEach((r,i)=>{const o=res[r],x=300+i*122;ctx.fillStyle=o?o.col:'#ddd';H.rr(ctx,x,48,18,30,4);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.25)';ctx.stroke();H.txt(ctx,nm[r],x+26,60,{s:12*k,w:700});H.txt(ctx,o?(o.pos?'+ yes':'− no'):'…',x+26,78,{s:12*k,w:700,c:o&&o.pos?'#1b7a3a':PAL['cv-soft']});});
        fTubeTag(ctx,k,8,'A');} },
    { lvl: 'ap', key: 'sucrose', title: 'Why table sugar stays blue', speed: 1,
      see: 'Look at the Benedict’s colors again. Glucose and apple juice turned brick red. Table sugar (sucrose), if it is one of the unknowns, stays blue even after heating.',
      why: 'Benedict’s needs a sugar with a free reactive end (an aldehyde or ketone) to hand electrons to copper: a <b>reducing sugar</b>. In sucrose, the glycosidic bond ties up both glucose’s and fructose’s reactive ends, so nothing reacts until the bond is hydrolyzed.',
      overlay(sim,ctx,LH,k){fCard(ctx,k,'Reducing sugars only','glucose, fructose, lactose, maltose: + · sucrose: − until split by acid or sucrase');} }
  ],
  useIt: [
    { do: 'Always check the control line on a home test strip.',
      why: 'A home test has its own control, just like the water tube. If the control line does not appear, the result is invalid and you need a new test (FDA).' },
    { do: 'Know what the urine cup at a physical is checking.',
      why: 'The dipstick has pads of chemicals that change color, like these reagents. Two of them look for sugar and protein, which should not normally be in urine (MedlinePlus).' },
    { do: 'Pick bananas by what you need: green for less sweet, spotted for baking.',
      why: 'Unripe fruit stores energy as starch, which iodine would turn black. As it ripens, enzymes cut the starch into sugar, which is why spotty bananas taste so sweet.' },
    { do: 'Read a positive result against what “no” looks like before you decide.',
      why: 'The water tube shows that a color only counts if it differs from the control. The same habit keeps you from misreading strips, pool test kits and lab results.' }
  ],
  tryIt: [
    { title: 'the brown paper bag test (10 minutes)',
      steps: ['Cut a brown paper bag into squares and label them.', 'Rub a little of each food onto its square: butter, a potato chip, an apple slice, bread, water.', 'Let them dry for 10 minutes, then hold each square up to a window.'],
      look: 'The butter and chip leave see-through spots that never dry. Water dries and disappears. Fat soaks into paper and stays, the same property Sudan III uses.' },
    { title: 'iodine on a potato and an apple (with an adult)',
      steps: ['Cut a slice of raw potato and a slice of apple. Don’t eat them afterward.', 'Put one drop of iodine tincture from a first-aid kit on each.', 'Wait one minute and compare.'],
      look: 'The potato turns blue-black: it is packed with starch. A ripe apple barely darkens, because ripening turned its starch into sugar. Orchard growers use this test to decide when to pick.' }
  ]
}
});
/* ---------- acids, bases and buffers ---------- */
const phY=pH=>32+25.7*pH;
const phM=(sim,id)=>{const m=sim.def.metrics.find(x=>x.id===id);return m?m.get(sim):NaN;};
function phDrops(sim,n){for(let i=0;i<n;i+=5)fAct(sim,'drop5');}
function phCard(ctx,k,lines,x,y,w){x=x||14;y=y||124;w=w||196;const h=12+lines.length*19;ctx.save();ctx.globalAlpha=0.97;ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,x,y,w,h,8);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  lines.forEach((L,i)=>H.txt(ctx,L[0],x+9,y+19+i*19,{s:(L[2]||12)*k,w:L[1]||500,c:L[3]||PAL['cv-ink']}));}
function phTimes(pH){const r=Math.pow(10,7-pH);if(Math.abs(Math.log10(r))<0.02)return 'same H⁺ as pure water';const v=r>1?r:1/r,s=v>=1000?Math.round(v).toLocaleString('en-US'):v<10?v.toFixed(1):Math.round(v);return s+'× '+(r>1?'more':'less')+' H⁺ than water';}
const PH_THINGS=[['Lemon juice',2],['Cola',2.5],['Coffee',5],['Milk',6.7],['Pure water',7],['Blood',7.4],['Seawater',8.1],['Baking soda in water',8.3],['Household ammonia',11.6],['Bleach',12.5]];

BioLab.addLearn({
phlife: {
  goals: {
    bio: ['What the pH number counts, and why one step means ten times', 'Why a few drops of acid wreck the pH of pure water', 'How a buffer, like the one in your blood, catches extra H⁺', 'Why enzymes need the right pH, and what that means for teeth, pools and gardens'],
    honors: ['What the pH number counts, and why one step means ten times', 'How a buffer catches extra H⁺, and why blood’s buffer needs your lungs', 'Why blood must stay between pH 7.35 and 7.45', 'Why enzymes need the right pH, and what that means for teeth, pools and gardens'],
    ap: ['pH = −log[H⁺], and what a factor of ten means', 'How buffer pairs work, with Henderson–Hasselbalch', 'Why blood’s bicarbonate buffer depends on the lungs', 'How pH changes enzyme activity']
  },
  matters: 'Every enzyme in you is built to work at one pH. Your blood has to stay between 7.35 and 7.45, while your stomach sits near 2. The same chemistry decides whether soda eats your teeth and why Colorado gardeners struggle to grow blueberries.',
  question: 'Five drops of acid go into a cup of pure water, and five more go into blood. Why does the water’s pH crash while the blood’s barely moves?',
  startKey: 'scale', startRun: false,
  startOverlay(sim,ctx,LH,k){tag(ctx,'pH meter',268,82,k,{s:12,hi:true});tag(ctx,'The pH scale',686,22,k,{s:12,hi:true});tag(ctx,'Where the added H⁺ goes',454,6+12,k,{s:12,hi:true});},
  steps: [
    { key: 'scale', title: 'The pH scale counts H⁺', fresh: true, pause: true, set: { sol: 'water', reag: 'acid' },
      see: 'Things you know, placed on the pH scale. Lemon juice and cola sit near 2–3, pure water at 7, blood just above 7, and bleach near 12.5. The colors on the bar are the real colors of universal indicator at each pH.',
      why: 'pH counts hydrogen ions (H⁺). The lower the number, the more H⁺ and the more <b>acidic</b>; above 7 is <b>basic</b>. Each step is ten times: pH 5 has 100 times more H⁺ than pH 7, and pH 2 has 100,000 times more.',
      overlay(sim,ctx,LH,k){ctx.save();ctx.fillStyle=PAL['cv-bg'];H.rr(ctx,330,10,250,432,10);ctx.fill();ctx.restore();H.txt(ctx,'pH of things you know',342,32,{s:13*k,w:700});
        let prevY=30;PH_THINGS.forEach(([n,p])=>{const yb=phY(p);let y=Math.max(yb,prevY+28);prevY=y;H.txt(ctx,n+'  '+p,342,y+4,{s:12*k,w:600});ctx.save();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(500,y);ctx.lineTo(560,y);ctx.lineTo(598,yb);ctx.stroke();ctx.restore();});} },
    { key: 'water', title: 'Acid into pure water', set: { sol: 'water', reag: 'acid' }, fresh: true, speed: 0.3, run(sim){phDrops(sim,5);},
      see: 'Five drops of acid, a quarter of a milliliter, go into 50 mL of pure water. The pH meter drops from 7.00 to about 3.3, and the indicator turns red.',
      why: 'Pure water has nothing in it to catch the added H⁺, so every one of them stays free and counts toward the pH. From pH 7 to 3.3 is about 5,000 times more H⁺.',
      overlay(sim,ctx,LH,k){const p=phM(sim,'ph');phCard(ctx,k,[['pH '+p.toFixed(2),700,15],[phTimes(p)]]);} },
    { key: 'free', title: 'Nothing catches the H⁺', pause: true,
      see: 'Look at the panel in the middle. It shows where the added H⁺ went: in pure water, every one is still floating free.',
      why: 'Free H⁺ is what makes a liquid acidic. With nothing to grab them, a tiny amount of acid makes a huge change.',
      overlay(sim,ctx,LH,k){tag(ctx,'every H⁺ stays free',454,236,k,{s:12,hi:true});} },
    { key: 'buffer', title: 'A buffer catches H⁺', set: { sol: 'cell', reag: 'acid' }, fresh: true, speed: 0.3, run(sim){phDrops(sim,5);},
      see: 'The same 5 drops go into phosphate buffer, the kind inside your cells. The middle panel shows each H⁺ being caught. The pH meter only slips from 7.20 to about 7.16.',
      why: 'A <b>buffer</b> is a pair of chemicals that soak up extra acid or base. Here HPO₄²⁻ grabs each H⁺ and becomes H₂PO₄⁻, so the H⁺ no longer floats free and the pH barely moves.',
      overlay(sim,ctx,LH,k){const p=phM(sim,'ph');phCard(ctx,k,[['pH '+p.toFixed(2),700,15],['buffer caught almost all of it']]);tag(ctx,'HPO₄²⁻ + H⁺ → H₂PO₄⁻',454,236,k,{s:12,hi:true});} },
    { key: 'blood', title: 'Blood’s buffer uses your lungs', set: { sol: 'blood', reag: 'acid', lungs: true }, fresh: true, speed: 0.3, run(sim){phDrops(sim,5);},
      see: 'Now blood’s buffer, with breathing switched on. The same 5 drops of acid barely move the pH from 7.40.',
      why: 'Blood uses bicarbonate: HCO₃⁻ + H⁺ → H₂CO₃ → CO₂ + H₂O. The extra acid turns into CO₂, and your lungs breathe the CO₂ out, so the buffer pair stays balanced.',
      so: 'That is one reason you breathe harder during hard exercise: working muscles make extra CO₂ and acid, and breathing blows it off.',
      overlay(sim,ctx,LH,k){const p=phM(sim,'ph');phCard(ctx,k,[['pH '+p.toFixed(2),700,15],['lungs carry the CO₂ away']]);} },
    { key: 'sealed', title: 'Too much acid: acidosis', set: { sol: 'blood', reag: 'acid', lungs: false }, fresh: true, speed: 0.3, run(sim){phDrops(sim,30);},
      see: 'Blood buffer in a sealed beaker, with 30 drops. The CO₂ has nowhere to go, the buffer runs low, and the pH falls to about 6.8, far outside blood’s safe band.',
      why: 'Blood has to stay between pH 7.35 and 7.45. Below 7.35 is <b>acidosis</b>: the extra H⁺ changes the charges on proteins, so enzymes and other proteins stop working properly. A buffer can only absorb so much.',
      overlay(sim,ctx,LH,k){const p=phM(sim,'ph');phCard(ctx,k,[['pH '+p.toFixed(2),700,15,p<7.35?'#b3261e':PAL['cv-ink']],[p<7.35?'below 7.35: acidosis':'inside the safe range']]);ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=3;ctx.strokeRect(598,phY(7.35),28,phY(7.45)-phY(7.35));ctx.restore();} },
    { key: 'stomach', title: 'Enzymes need their pH', set: { sol: 'stomach', enz: 'pepsin' }, fresh: true, pause: true,
      see: 'The beaker now holds stomach acid, pH 2. The bottom panel shows pepsin, the enzyme that cuts protein in your stomach, working at its best.',
      why: 'Each enzyme’s shape is held by charges, and pH changes those charges. Pepsin is built for pH 2. Put it in blood at 7.4 and it is at almost 0%, while amylase in saliva and trypsin in the small intestine are built for pH 7 to 8.',
      overlay(sim,ctx,LH,k){tag(ctx,'pepsin: built for pH 2',454,276,k,{s:12,hi:true});} },
    { key: 'antacid', title: 'Neutralizing acid', set: { sol: 'stomach', reag: 'base', enz: 'pepsin' }, fresh: true, speed: 0.4, run(sim){phDrops(sim,100);},
      see: 'One hundred drops of base go into the stomach acid. The pH jumps toward 7, the indicator turns green, and pepsin’s activity falls to almost nothing.',
      why: 'Each OH⁻ from the base meets an H⁺ and makes water: H⁺ + OH⁻ → H₂O. That is <b>neutralization</b>. Antacids for heartburn work the same way, with weaker bases like calcium carbonate.',
      overlay(sim,ctx,LH,k){const p=phM(sim,'ph');phCard(ctx,k,[['pH '+p.toFixed(2),700,15],['H⁺ + OH⁻ → H₂O']]);} },
    { lvl: 'ap', key: 'hh', title: 'Henderson–Hasselbalch', set: { sol: 'blood', lungs: false }, fresh: true, pause: true,
      see: 'Fresh blood buffer. The card reads the buffer pair straight from the model.',
      why: 'pH = pKa + log([HCO₃⁻] ÷ [CO₂]) = 6.1 + log(24 ÷ 1.2) = 7.40. A buffer works best near its pKa. Blood sits 1.3 units above bicarbonate’s pKa, so it relies on the lungs (CO₂) and kidneys (HCO₃⁻) to hold the ratio near 20.',
      overlay(sim,ctx,LH,k){phCard(ctx,k,[['Henderson–Hasselbalch',700],[String(phM(sim,'hh')),500,11]],14,124,192);} }
  ],
  useIt: [
    { do: 'Drink soda or sports drinks with a meal, not in sips all day, and rinse with water after.',
      why: 'Tooth enamel begins to dissolve below pH 5.5, and many soft drinks are near pH 2.5 to 3.5. Every sip restarts the acid attack (American Association of Orthodontists).' },
    { do: 'Check a pool’s pH and chlorine before you swim.',
      why: 'CDC recommends pool water between pH 7.0 and 7.8. Above 8, chlorine kills germs poorly; below 7, the water irritates eyes and skin and corrodes pipes.' },
    { do: 'In Colorado, grow blueberries in pots of acidic mix, not in the yard.',
      why: 'Blueberries need soil around pH 4 to 5.5, while Colorado soils are usually 7.0 to 8.3. That soil is so well buffered by lime that you can’t practically lower it (CSU Extension).' },
    { do: 'Take antacids only as the label directs.',
      why: 'An antacid is a weak base that neutralizes stomach acid. Your stomach needs some acid to digest protein, since pepsin only works near pH 2.' }
  ],
  tryIt: [
    { title: 'red cabbage pH indicator (20 minutes, with an adult)',
      steps: ['Chop a few red cabbage leaves, cover them with very hot water and let them sit for 10 minutes. Pour off the purple juice.', 'Put a little juice in several clear cups.', 'Add vinegar to one, lemon juice to another, baking soda to another and plain water to the last.'],
      look: 'Acids turn the juice pink or red, plain water leaves it purple, and baking soda turns it blue or green. The cabbage pigment changes shape as it gains or loses H⁺, just like universal indicator.' }
  ]
}
});
/* ---------- atoms and bonds ---------- */
function lbRing(ctx,x,y,r,tau){const a=0.5+0.5*Math.sin((tau||0)*4);ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=3;ctx.globalAlpha=0.55+0.45*a;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.stroke();ctx.restore();}
function lbArrow(ctx,x1,y1,x2,y2,col){ctx.save();ctx.strokeStyle=col||'#c8102e';ctx.fillStyle=col||'#c8102e';ctx.lineWidth=3;const a=Math.atan2(y2-y1,x2-x1);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*8,y2-Math.sin(a)*8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-Math.cos(a-0.45)*12,y2-Math.sin(a-0.45)*12);ctx.lineTo(x2-Math.cos(a+0.45)*12,y2-Math.sin(a+0.45)*12);ctx.closePath();ctx.fill();ctx.restore();}

BioLab.addLearn({
lifebonds: {
  goals: {
    bio: ['What is inside an atom, and what makes carbon-14 different from carbon-12', 'Why carbon makes 4 bonds, nitrogen 3 and oxygen 2', 'The three ways atoms bond: even sharing, uneven sharing and handing over', 'Why salt dissolves in water but grease does not, and what soap has to do with it'],
    honors: ['What is inside an atom, and what isotopes are', 'How valence electrons predict the number of bonds', 'How electronegativity makes bonds polar, nonpolar or ionic', 'How hydrogen bonds hold water together and pair DNA bases'],
    ap: ['Isotopes and radioactive tracers', 'Bond polarity, molecular shape and hydrophobic vs hydrophilic behavior', 'Hydrogen bonds in water, DNA and protein β-sheets', 'Why heat unzips DNA and unfolds proteins without breaking covalent bonds']
  },
  matters: 'Six elements, carbon, hydrogen, nitrogen, oxygen, phosphorus and sulfur, build almost everything in a cell. How their atoms share electrons decides what dissolves in your blood, why soap cleans grease, and how DNA can be unzipped and copied.',
  question: 'Your blood carries dissolved salt to every cell, but the fat from lunch won’t dissolve in it. What is different about the bonds in salt and in fat?',
  startKey: 'atom', startRun: false,
  startOverlay(sim,ctx,LH,k){tag(ctx,'One carbon atom, zoomed in about 100 million times',275,64,k,{s:12,hi:true});},
  steps: [
    { key: 'atom', title: 'Inside one atom', set: { view: 'atom', el: 'C', iso: '0', hl: 0 }, fresh: true, pause: true,
      see: 'One carbon atom. The middle is the nucleus: 6 protons (red, +) and 6 neutrons (gray, no charge). Six electrons (yellow, −) move around it in shells.',
      why: 'The number of protons makes it carbon: every atom with 6 protons is carbon. The drawing is far from scale: if the atom were a football field, the nucleus would be a grain of sand in the middle, and the rest is almost empty space.',
      overlay(sim,ctx,LH,k,tau){lbRing(ctx,350,236,30,tau);tag(ctx,'nucleus (drawn far too big)',350,186-20,k,{s:12,hi:true});} },
    { key: 'isotope', title: 'Same element, extra neutrons', set: { view: 'atom', el: 'C', iso: '2', hl: 2 }, fresh: true, pause: true,
      see: 'Carbon-14 has 8 neutrons instead of 6, but still 6 protons, so it is still carbon and bonds the same way. The sample of 16 atoms on the left shows what is left after 2 half-lives: only 4 are still radioactive.',
      why: 'Extra neutrons make this nucleus unstable, so it slowly decays. Half of any sample decays every 5,700 years. Living things keep taking in fresh carbon-14; after death the amount only drops, which is how scientists date bones and wood.',
      overlay(sim,ctx,LH,k){tag(ctx,'2 half-lives = 11,400 years: ¼ left',110,232-90,k,{s:12,hi:true});} },
    { key: 'share1', title: 'Sharing one pair', set: { view: 'build', ctr: 'C', nH: 1 }, fresh: true, pause: true,
      see: 'Carbon has 4 electrons in its outer shell. One hydrogen joins it, and they share a pair: one electron from C (yellow) and one from H (blue).',
      why: 'A shared pair of electrons is a <b>covalent bond</b>. Both atoms count the shared pair as their own, which brings each closer to a full outer shell.',
      overlay(sim,ctx,LH,k,tau){lbRing(ctx,334,228,14,tau);tag(ctx,'one shared pair = one bond',334,182,k,{s:12,hi:true});} },
    { key: 'share4', title: 'Carbon makes four bonds', set: { view: 'build', ctr: 'C', nH: 4 }, fresh: true, pause: true,
      see: 'Now 4 hydrogens are attached, one on each side. Count the side panel: 8 electrons around carbon, a full outer shell. This molecule is methane, CH₄, the main gas in natural gas.',
      why: 'Carbon has 4 valence electrons, so it needs 4 more to fill its outer shell of 8. That is why carbon always makes 4 bonds, enough to build long chains and rings. That is what makes it the backbone of life.' },
    { key: 'oxygen', title: 'Oxygen makes two', set: { view: 'build', ctr: 'O', nH: 2 }, fresh: true, pause: true,
      see: 'Now the center is oxygen. It already has 6 outer electrons, so it only needs 2 hydrogens to reach 8. The result is water, H₂O, with two lone pairs left over.',
      why: 'Count valence electrons to predict bonds: carbon (4) makes 4 bonds, nitrogen (5) makes 3, oxygen (6) makes 2. Those lone pairs on oxygen give water its bent shape.' },
    { key: 'polar', title: 'Uneven sharing: polar', set: { view: 'mol', mol: 'water', wet: false }, fresh: true, pause: true,
      see: 'The full water molecule. The red arrows show where the shared electrons spend their time: pulled toward the oxygen. Oxygen ends up slightly negative (δ−) and each hydrogen slightly positive (δ+).',
      why: 'Oxygen pulls on shared electrons much harder than hydrogen does (electronegativity 3.44 vs 2.20). Uneven sharing makes a <b>polar covalent</b> bond, and a molecule with charged ends.',
      overlay(sim,ctx,LH,k){lbArrow(ctx,178,248,234,204);lbArrow(ctx,364,248,308,204);tag(ctx,'electrons pulled toward O',271,140,k,{s:12,hi:true});} },
    { key: 'nonpolar', title: 'Even sharing: nonpolar', set: { view: 'mol', mol: 'butane', wet: true }, fresh: true, speed: 0.5,
      see: 'A chain of carbons and hydrogens in water. The water molecules gather around it but keep to themselves, holding hands with each other instead of the chain.',
      why: 'Carbon and hydrogen pull on electrons about equally, so C–H bonds are <b>nonpolar</b>: no charged ends for water to grab. The tails of fats and oils are chains like this, which is why grease won’t dissolve in water or in your blood.',
      overlay(sim,ctx,LH,k){tag(ctx,'water leaves the C–H chain out',275,386,k,{s:12,hi:true});} },
    { key: 'ionic', title: 'Handing over an electron', set: { view: 'mol', mol: 'salt', wet: true }, fresh: true, speed: 0.4,
      see: 'Table salt in water. Sodium has handed its one outer electron to chlorine, so they are now charged ions, Na⁺ (purple) and Cl⁻ (green). Water molecules crowd around each ion and pull them apart.',
      why: 'Opposite charges attract: that is an <b>ionic bond</b>. In water, water’s δ− oxygen ends face each Na⁺ and its δ+ hydrogen ends face each Cl⁻. Water out-pulls the crystal, and the salt dissolves. Real salt is clear cubic crystals; the colors here are labels.',
      overlay(sim,ctx,LH,k){tag(ctx,'water’s O ends face Na⁺; H ends face Cl⁻',275,386,k,{s:12,hi:true});} },
    { key: 'hbond', title: 'Hydrogen bonds between molecules', set: { view: 'hb', hb: 'water' }, fresh: true, speed: 0.4,
      see: 'Liquid water, zoomed in. Each dashed line is a hydrogen bond, and they flicker as they break and re-form.',
      why: 'A hydrogen bond is the pull between a δ+ hydrogen on one molecule and a δ− oxygen on another. It is about 20 times weaker than the O–H bond inside a water molecule, but there are so many that together they hold water together.' },
    { key: 'dna', title: 'Hydrogen bonds pair DNA', set: { view: 'hb', hb: 'dna', gc: 4 }, fresh: true, pause: true, run(sim){for(let i=0;i<3;i++)fAct(sim,'unzip');},
      see: 'Two DNA strands, with the top 3 base pairs unzipped. A pairs with T using 2 hydrogen bonds (dashed lines), and G pairs with C using 3.',
      why: 'Each hydrogen bond is weak, so an enzyme can unzip DNA one pair at a time to copy it, while each strand’s strong covalent backbone stays whole. Heating to about 95 °C pulls the strands apart completely.',
      so: 'That heating step is how PCR tests copy DNA, including many COVID and strep tests.' },
    { lvl: 'ap', key: 'oil', title: 'The hydrophobic effect', set: { view: 'hb', hb: 'oil' }, fresh: true, speed: 0.5, run(sim){fAct(sim,'shake');},
      see: 'Shaken oil breaks into small drops, then the drops merge back together.',
      why: 'Water molecules hydrogen-bond to each other, not to nonpolar C–H chains, so they squeeze the oil together. The same effect packs fatty-acid tails into the middle of cell membranes and nonpolar amino acids into the core of proteins.' },
    { lvl: 'ap', key: 'protein', title: 'Hydrogen bonds shape proteins', set: { view: 'hb', hb: 'protein' }, fresh: true, pause: true,
      see: 'A protein β-sheet: two strands held side by side by hydrogen bonds between C=O and N–H groups.',
      why: 'Heat breaks these weak bonds and the protein unfolds (denatures), but the peptide bonds along each strand stay whole, so the amino acid sequence doesn’t change. That is why cooked egg white turns solid without its protein being broken into pieces.' }
  ],
  useIt: [
    { do: 'Wash your hands with soap, not just water, and scrub for 20 seconds.',
      why: 'Grease and the germs stuck in it are nonpolar, so water alone slides past them. Soap is made of surfactants, molecules with a polar end that holds water and a nonpolar end that holds grease, so they lift oil and microbes off your skin (CDC).' },
    { do: 'Never put water on a grease fire. Turn off the burner and slide a lid over the pan.',
      why: 'Oil and water don’t mix, and water is denser, so it sinks under the burning oil, flashes to steam and throws the burning oil out of the pan. Fire safety agencies all say to smother it instead (Indiana Department of Homeland Security, citing NFPA data).' },
    { do: 'Use dish soap, not just hot water, on greasy pans.',
      why: 'Hot water melts grease but can’t dissolve it, because C–H chains are nonpolar. Soap’s nonpolar ends grab the grease and its polar ends hold onto the rinse water.' },
    { do: 'Shake salad dressing right before you pour it.',
      why: 'Oil and vinegar (mostly water) separate within minutes, the same hydrophobic effect as the oil drops merging. Shaking only breaks the oil into drops for a little while.' }
  ],
  tryIt: [
    { title: 'the pepper and soap trick (2 minutes)',
      steps: ['Fill a plate with water and sprinkle black pepper over the surface.', 'Touch the middle with a dry fingertip. Nothing much happens.', 'Now put a drop of dish soap on your fingertip and touch the middle again.'],
      look: 'The pepper shoots to the edges. Hydrogen bonds give water a surface “skin” (surface tension) that holds the pepper. Soap molecules squeeze between the water molecules and break that skin where you touch.' },
    { title: 'oil, water and soap in a jar (5 minutes)',
      steps: ['Put water and a few spoonfuls of cooking oil in a jar with a lid. Shake it hard and watch for a minute.', 'Add a squirt of dish soap and shake again.'],
      look: 'Without soap the oil drops merge and float back to the top. With soap the mixture stays cloudy much longer, because soap coats the oil drops so water can hold onto them.' }
  ]
}
});
/* ---------- properties of water stations (Mr. Stearman's lab) ---------- */
function wpGo(sim,...ids){ids.forEach(id=>fAct(sim,id));}

BioLab.addLearn({
waterprops: {
  goals: {
    bio: ['Why one water molecule has a slightly negative end and two slightly positive ends', 'How hydrogen bonds explain each station: ice, cohesion, adhesion, surface tension, heat, evaporation, dissolving, the balloon and buffers', 'What to look for at each station when you do the real lab', 'Where each property shows up in your life'],
    honors: ['Why water is polar and how hydrogen bonds form', 'How hydrogen bonds explain each station', 'How to predict what alcohol, soap or oil will do differently', 'Where each property shows up in your life'],
    ap: ['How polarity and hydrogen bonding explain every emergent property of water', 'Why alcohol, soap and oil behave differently', 'How specific heat and heat of vaporization connect to climate and body temperature', 'How buffers resist pH change']
  },
  matters: 'Almost every station in the water lab comes down to one idea: water molecules are polar, so they stick to each other and to other charged things. Learn that once, and the penny, the paperclip, the paper towel and the balloon all make sense.',
  question: 'Water beads up into a dome on a penny, climbs up a paper towel and lets a steel paperclip float. What one thing about water molecules explains all three?',
  startKey: 'molecule', startRun: false,
  steps: [
    { key: 'molecule', title: 'Before you begin: one molecule', set: { station: '0', mol: true }, fresh: true, speed: 0.5, run(sim){sim.st.intro=false;wpGo(sim,'clearN');},
      see: 'One water molecule, with its shared electron pairs (in the O–H bonds) and its two lone pairs on the oxygen. The oxygen end is marked δ− and the hydrogen ends δ+.',
      why: 'Oxygen pulls shared electrons harder than hydrogen does, so the molecule has a slightly negative end and slightly positive ends: it is <b>polar</b>. Real water is clear; red and white are labels for oxygen and hydrogen.' },
    { key: 'neighbors', title: 'Hydrogen bonds', set: { station: '0' }, speed: 0.5, run(sim){wpGo(sim,'clearN','neighbor','neighbor','neighbor','neighbor');},
      see: 'Four neighbors join. Each dashed line is a hydrogen bond: the δ+ hydrogen of one molecule attracted to the δ− oxygen of another. The inset compares it with the O–H bond inside the molecule.',
      why: 'A hydrogen bond is about 20 times weaker than a covalent bond, so they break and re-form constantly. But each molecule can make up to 4, and there are trillions in a drop. Every station today is explained by these bonds.' },
    { key: 'ice', title: 'Station 1: ice floats', set: { station: '1' }, speed: 1, run(sim){wpGo(sim,'iceDrop','winter');},
      see: 'An ice cube floats with most of it underwater, and the lake freezes from the top down while the water below stays liquid.',
      why: 'In ice, hydrogen bonds lock every molecule into an open honeycomb, so ice takes up about 9% more room than the same water as a liquid. Less dense things float, so the ice stays on top and insulates the water below.',
      so: 'That 9% expansion is why a full glass bottle of water cracks in the freezer.' },
    { key: 'cohesion', title: 'Station 2: cohesion', set: { station: '2', pennyLiquid: 'water' }, speed: 1, run(sim){wpGo(sim,'dry','auto');},
      see: 'Drops pile onto the penny into a dome that bulges far above the rim before it finally spills. Watch the drop count.',
      why: 'Water molecules hydrogen-bond to each other, so the drop holds together as one blob: <b>cohesion</b>. Try alcohol in the Full lab: fewer hydrogen bonds, so far fewer drops fit.',
      so: 'Cohesion is why raindrops are round and water beads up on a waxed car.' },
    { key: 'adhesion', title: 'Station 3: adhesion', set: { station: '3' }, speed: 1, run(sim){wpGo(sim,'newTowel','hang');},
      see: 'The bottom of a paper towel touches the water, and the water climbs up the towel against gravity.',
      why: 'Paper is made of cellulose, which has polar –OH groups, so water sticks to it: <b>adhesion</b>. Adhesion pulls water up the tiny gaps between fibers, and cohesion drags more water along behind it. Together that is <b>capillary action</b>.',
      so: 'The same pull helps lift water up the thin tubes inside plant stems.' },
    { key: 'tension', title: 'Station 4: surface tension', set: { station: '4', clipLiquid: 'water' }, speed: 1, run(sim){wpGo(sim,'removeClip','clip');},
      see: 'A steel paperclip rests on top of the water, dimpling the surface without sinking, even though steel is about 8 times denser than water.',
      why: 'Molecules at the surface have no neighbors above, so they hold extra tight to the ones beside and below. That makes a stretchy skin: <b>surface tension</b>. Soap squeezes between water molecules, breaks the skin, and the clip sinks.',
      so: 'Surface tension is how water striders walk on ponds.' },
    { key: 'heat', title: 'Station 5: high specific heat', set: { station: '5' }, speed: 1, run(sim){wpGo(sim,'cool','heat');},
      see: 'Three liquids on identical hot plates. Water warms the slowest, and alcohol boils first.',
      why: 'Heat added to water first goes into tugging on hydrogen bonds before the molecules speed up, so water needs 4.18 J to warm 1 g by 1 °C, far more than most liquids. That is a high <b>specific heat</b>.',
      so: 'That is why lakes and oceans keep nearby weather mild, and why your body temperature stays steady.' },
    { key: 'evap', title: 'Heat of evaporation', set: { station: '9' }, speed: 1, run(sim){wpGo(sim,'dryAll','wet');},
      see: 'Three thermometers in front of a fan: one dry, one wrapped in a wet cloth, one in an alcohol-soaked cloth. The wet ones cool below room temperature.',
      why: 'To evaporate, a molecule must break all its hydrogen bonds, so the fastest, most energetic molecules leave and carry heat away. Each gram of water that evaporates removes 2,260 J. Alcohol cools fast but dries out quickly.',
      so: 'That is how sweat cools you.' },
    { key: 'solvent', title: 'Station 6: the universal solvent', set: { station: '6' }, speed: 1, run(sim){wpGo(sim,'emptyBeaker','salt','oil','stir');},
      see: 'Salt disappears into the water when you stir, but the oil stays in its own layer on top.',
      why: 'Water’s charged ends surround each Na⁺ and Cl⁻ ion and pull the crystal apart, so salt dissolves. Oil is nonpolar, so water molecules stick to each other instead and leave it out.',
      so: 'That is how your blood can carry salts and sugars to every cell, while fats need special protein carriers.' },
    { key: 'balloon', title: 'Station 7: polarity you can see', set: { station: '7', streamLiquid: 'water' }, speed: 1, run(sim){wpGo(sim,'rub','closer');},
      see: 'A balloon rubbed on hair is brought near a thin stream of water, and the stream bends toward it. Try oil in the Full lab: it barely moves.',
      why: 'The charged balloon pulls on the oppositely charged ends of the polar water molecules, so the whole stream bends. Oil molecules have no charged ends to pull on.' },
    { key: 'buffer', title: 'Station 8: acids, bases and buffers', set: { station: '8' }, speed: 1, run(sim){wpGo(sim,'buffer','acid5');},
      see: 'Five drops of acid go into plain water and into a buffered solution. The plain water’s pH crashes; the buffer’s barely moves.',
      why: 'A buffer is a pair of chemicals that catch extra H⁺ (or OH⁻). Blood’s bicarbonate buffer keeps your blood between pH 7.35 and 7.45. The Acids, bases and buffers lab goes deeper.' }
  ],
  useIt: [
    { do: 'Leave room at the top of a water bottle before you freeze it.',
      why: 'Water expands by about 9% as it freezes, because hydrogen bonds hold ice in an open honeycomb. A bottle filled to the brim can split or crack.' },
    { do: 'To cool someone who is overheating, wet their skin and fan them while you get help.',
      why: 'Evaporating water carries heat away, 2,260 J for every gram. CDC’s first aid for heat illness includes cool, wet cloths or a cool bath; call 911 for signs of heat stroke.' },
    { do: 'Fill a cooler with ice and some cold water, not just ice.',
      why: 'Water touches the cans all the way around and moves heat into the ice much faster than air pockets do, and the mix stays at 0 °C until the ice melts.' },
    { do: 'Add a drop of dish soap when water beads up and won’t soak into very dry potting soil.',
      why: 'Soap breaks water’s surface tension, so the water spreads and wets the soil instead of beading up on top.' }
  ],
  tryIt: [
    { title: 'drops on a penny (10 minutes)',
      steps: ['Lay a clean, dry penny flat. Use a dropper or straw to add water one drop at a time, counting until it spills.', 'Dry the penny and repeat with water that has one drop of dish soap stirred in.'],
      look: 'Plain water usually fits 25 or more drops in a tall dome. Soapy water spills much sooner, because soap breaks the hydrogen bonds holding the dome together. This is Station 2 at your kitchen table.' },
    { title: 'the floating paperclip (5 minutes)',
      steps: ['Fill a bowl with water. Lay a dry paperclip on a fork and lower it gently onto the surface.', 'Once it floats, touch the water near it with a soapy fingertip.'],
      look: 'The clip rests on the water’s surface skin, then sinks as soon as soap breaks the surface tension. Station 4, at home.' }
  ]
}
});
})();
