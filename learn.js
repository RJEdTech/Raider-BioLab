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
})();
