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
    { key: 'cold', cause: { from: { temp: 37 } }, title: 'Cold: slower, not broken', set: { temp: 10 }, fresh: true, speed: 0.5,
      see: 'Chilled to 10 °C, like an ice-cold drink. Count the gold rings: far fewer starch molecules get cut, and the <b>Reaction rate</b> below drops to about a sixth.',
      why: 'Cold molecules have less energy, so fewer landings have enough energy to make the cut. But the enzymes keep their folded shape (see <b>Enzymes with working shape</b>), so warming them back up brings the rate right back.',
      so: 'That is why the fridge keeps food fresh longer: it slows the enzymes in the food and in the bacteria on it.',
      overlay(sim,ctx,LH,k){const n=hits10(sim),ref=sim.lnHit37;tag(ctx,'Starch cut in the last 10 s: '+n+(ref?'   (at 37 °C: '+ref+')':''),560,60,k,{hi:true});
        tag(ctx,'Still folded ✓',700,410,k,{c:'#1b7a3a'});} },
    { key: 'hot', cause: { from: { temp: 37 } }, title: 'Too hot: broken for good', set: { temp: 70 }, speed: 0.25,
      see: 'Heated to 70 °C, about as hot as fresh coffee. Watch each blob unfold into a loose chain. The grooves disappear, and the reaction stops.',
      why: 'Heat shakes the chain so hard that the weak bonds holding the fold break. With no fold there is no groove, so starch cannot fit. This is <b>denaturing</b>, and cooling does not refold the chain.',
      so: 'That is why cooking and canning stop the enzymes in food.',
      overlay(sim,ctx,LH,k){const uf=sim.vis.uf||[0],it=uf.reduce((x,y)=>x+y,0)/uf.length<0.97?1:0;tag(ctx,it>0.15?'Unfolding: the groove is gone':'All unfolded. Cooling will not refold them.',400,60,k,{hi:true});} },
    { key: 'acid', cause: { from: { ph: 7 } }, title: 'Strong acid', set: { ph: 2 }, fresh: true, speed: 0.5,
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
    choices:['Heat uses up the enzyme, so there is none left to work','The chain unfolds, so the groove starch fits into is gone','Hot starch moves too fast for the enzyme to catch it','The extra sugar it makes at high heat blocks the active site'],correct:1,
    steps:['An enzyme only works because its folded chain makes a groove with the right shape.','Strong heat breaks the weak bonds that hold the chain folded, so the groove disappears.','Starch can’t fit, so the reaction stops. Cooling doesn’t refold it.'],
    lab:{set:{temp:70},look:'The tube is at 70 °C. Watch the enzymes unfold and <b>Enzymes with working shape</b> fall, with the reaction rate.'}},
  {id:'whycold',kind:'test',lvl:'bio',
    q:'An ice-cold drink slows the amylase in your mouth. Once your mouth warms back up, what happens, and why?',
    choices:['It stays slow, because the cold damaged its shape for good','It speeds back up: cold slowed it but didn’t unfold it','It works faster than before, to catch up on the starch it missed','It stops, because the cold denatured it like heat would'],correct:1,
    steps:['Cold molecules have less energy, so fewer landings in the groove lead to a cut.','The enzyme keeps its folded shape the whole time.','Warm it up, and the rate comes back.'],
    lab:{set:{temp:10},look:'The tube is at 10 °C. <b>Enzymes with working shape</b> stays high even though the rate is low. Then drag Temperature back to 37 °C.'}},
  {id:'reuse',kind:'test',lvl:'bio',
    q:'A small amount of saliva can digest a lot of starch. Why?',
    choices:['Each enzyme is reused, working on one starch after another','The enzyme splits in two each time, making more enzyme','Each starch molecule it breaks turns into more enzyme','Saliva holds more enzyme molecules than the food has starch'],correct:0,
    steps:['After an enzyme cuts a starch molecule, it lets the sugars go.','The enzyme comes out the same as it went in.','So one enzyme molecule can repeat the job again and again.']},
  {id:'stain',kind:'real',lvl:'bio',
    q:'You get a nosebleed on your favorite hoodie. Why should you rinse it in cold water, not hot?',
    choices:['Hot water unfolds blood proteins, and they stick to the fabric','Cold water holds more dissolved oxygen, which lifts the stain out','Hot water makes the stain spread out across more of the fabric','Cold water dissolves the iron in blood, and hot water can’t'],correct:0,
    steps:['Blood is mostly protein.','Heat unfolds proteins, the same way 70 °C unfolded amylase.','Unfolded proteins tangle and lock onto the fabric fibers. Cold water keeps them folded and easy to rinse out.']},
  {id:'pineapple',kind:'real',lvl:'bio',
    q:'Fresh pineapple keeps Jell-O from setting, because an enzyme in it cuts gelatin’s protein. Canned pineapple works fine. Why?',
    choices:['Canning adds sugar syrup, which helps the gelatin set','Canning heat denatured the enzyme that cuts gelatin','Canned pineapple is more acidic, which helps gelatin firm up','Canned pineapple has no protein left in it to cut gelatin'],correct:1,
    steps:['Canning heats the fruit.','That heat unfolds the pineapple’s enzyme, bromelain, so it can no longer cut protein.','Heat damage to an enzyme is permanent, so the canned fruit can’t stop the gelatin from setting.']},
  {id:'lemon',kind:'real',lvl:'bio',
    q:'Lemon juice on sliced apples slows browning, which is caused by an enzyme in the apple. What does the lemon juice do?',
    choices:['It cools the apple, which slows every reaction in it','It lowers the pH, far from the browning enzyme’s best pH','It adds more substrate, so the enzyme is used up sooner','Its acid heats the enzyme until the enzyme denatures'],correct:1,
    steps:['Lemon juice is acidic, about pH 2.','Acid changes the electric charges in the active site, and those charges help the enzyme grip its substrate.','Far from its best pH, the browning enzyme slows way down.'],
    lab:{set:{ph:2},look:'Amylase at pH 2. Watch the grooves pinch and the reaction rate fall, just like the apple’s browning enzyme in lemon juice.'}},
  {id:'compsub',kind:'test',lvl:'honors',
    q:'A competitive inhibitor is slowing an enzyme. Which change brings the rate back up the most?',
    choices:['Add much more substrate','Cool the enzyme down to slow the inhibitor','Lower the pH so the inhibitor lets go','Add more inhibitor to use up the enzyme'],correct:0,
    steps:['A competitive inhibitor and the substrate take turns in the same active site.','The more substrate there is, the more often substrate gets the spot first.','So flooding the enzyme with substrate wins most of the rate back.'],
    lab:{set:{inhC:5,sub:50},look:'5 mM competitive inhibitor with 50 mM substrate. Compare the rate with substrate at 5 mM.'}},
  {id:'noncomp',kind:'test',lvl:'ap',
    q:'Adding lots of substrate does not undo a noncompetitive inhibitor. Why?',
    choices:['It binds elsewhere and changes the enzyme’s shape','It binds the substrate itself, so more substrate just gets bound too','It is used up by the reaction, so it can’t be outnumbered','It works only at high temperature, where substrate can’t bind'],correct:0,
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
    { key: 'salty', cause: { from: { salt: 0.9 } }, title: 'Salty water: shrink', set: { salt: 3 }, fresh: true, speed: 0.25,
      see: 'A fresh cell in 3% salt water, a little less salty than the ocean. More water crosses out than in, and the cell shrivels into a spiky shape.',
      why: 'Now the outside has more dissolved salt, so water leaves toward it. The cell shrinks and its surface puckers (<b>crenation</b>).',
      so: 'Seawater is about four times saltier than blood. That is why drinking it leaves you more dehydrated.',
      overlay(sim,ctx,LH,k){tally(ctx,sim,k);} },
    { key: 'plant', title: 'A plant cell gets firm', base: { cell: 'plant' }, set: { salt: 0 }, fresh: true, speed: 0.5,
      see: 'A plant cell, about 50 micrometers long, in pure water. Water flows in, but the cell does not burst: the green arrows show it pushing against its wall.',
      why: 'A plant cell has a stiff wall of cellulose around its membrane. As water flows in, the wall pushes back (<b>turgor pressure</b>) until no more can enter. That firmness is what holds up leaves and stems.',
      so: 'That is why limp lettuce or celery crisps up in ice water.',
      overlay(sim,ctx,LH,k){tag(ctx,'Real colors: green chloroplasts, clear vacuole',240,62,k,{s:13});} },
    { key: 'wilt', cause: { from: { salt: 0 } }, title: 'Salt makes a plant wilt', base: { cell: 'plant' }, set: { salt: 3 }, fresh: true, speed: 0.5,
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
    { key: 'strong', cause: { from: { bal: 1 } }, title: 'Strong sugar water: the core loses', set: { bal: 6 }, fresh: true, speed: 0.5,
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
/* ---------- water potential ---------- */
const WPX=214,WPY=262,WPW=104,WPH=70;            // cell centre and half-size at the start (208 px = 50 µm)
const wpPsi=(i,C,T)=>-i*C*0.0831*(T+273);
const wpI=sim=>({sucrose:1,nacl:2,cacl2:3})[sim.p.solute]||1;
const wpS=x=>(x<-0.004?'−':'')+Math.abs(x).toFixed(2);
function wpCard(ctx,k,lines,x,y,w,maxH){const lh=maxH?Math.min(20,(maxH-12)/lines.length):20,h=12+lines.length*lh;ctx.save();ctx.globalAlpha=0.97;ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,x,y,w,h,8);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  lines.forEach((l,j)=>{const o=typeof l==='string'?[l]:l;H.txt(ctx,o[0],x+10,y+lh+2+j*lh,{s:Math.min((o[2]||13)*Math.min(k,1.3),lh*0.8),w:o[1]||500,c:o[3]||PAL['cv-ink']});});}
function wpBox(ctx,x,y,w,h,tau){const a=0.5+0.5*Math.sin((tau||0)*4);ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=3;ctx.globalAlpha=0.55+0.45*a;H.rr(ctx,x,y,w,h,10);ctx.stroke();ctx.restore();}
/* the lower right card area (the verdict card) used for close-ups */
/* matches the tool's card layout: the verdict card starts below the cell and solution cards, whose height grows with k */
function wpQ(k){const lh=13*Math.min(k,1.35)*1.5,y=40+lh*10.8;return {x:424,y,w:368,h:450-y-6};}
function wpPanel(ctx,k){const q=wpQ(k);ctx.save();ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,q.x,q.y,q.w,q.h,10);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();ctx.restore();return q;}
function wpPlantAt(ctx,sim,k,q){const sc=Math.min(1,(q.h-12)/170);ctx.save();ctx.translate(q.x+96,q.y+q.h-54*sc);ctx.scale(sc,sc);wpPlant(ctx,sim,k,0,0);ctx.restore();}
function wpSide(ctx,k,q,lines){lines.forEach((l,j)=>{const o=typeof l==='string'?[l]:l;H.txt(ctx,o[0],q.x+176,q.y+28+j*Math.min(22,(q.h-30)/lines.length),{s:(o[2]||12.5)*Math.min(k,1.3),w:o[1]||400,c:o[3]||PAL['cv-ink']});});}
/* red onion skin under a microscope: long brick-shaped cells; the purple sap shrinks away from the walls as the cell loses water */
function wpOnion(ctx,sim,k,cx,cy,R){const V=sim.st.V,f=V<1?Math.sqrt(Math.max(0.3,V)):1;ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.clip();
  ctx.fillStyle='#eef0e6';ctx.fillRect(cx-R,cy-R,2*R,2*R);
  const cw=R*0.95,ch=R*0.36;
  for(let r=-3;r<=3;r++){const off=(r%2)*cw*0.5;for(let c=-2;c<=2;c++){const x=cx+c*cw+off-cw/2,y=cy+r*ch-ch/2;
    ctx.strokeStyle='#a39a7c';ctx.lineWidth=2.4;ctx.strokeRect(x,y,cw,ch);
    const pw=(cw-6)*f,ph=(ch-6)*(f<1?Math.max(0.55,f):1);ctx.fillStyle='rgba(150,40,120,0.72)';H.rr(ctx,x+cw/2-pw/2,y+ch/2-ph/2,pw,ph,f<1?ph/2:3);ctx.fill();}}
  ctx.restore();ctx.save();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.stroke();ctx.restore();}
/* a potted seedling whose stem droops as its cells lose water */
function wpPlant(ctx,sim,k,x,y){const V=sim.st.V,droop=V>=1.02?0:clamp((1.02-V)/0.2,0,1),ang=droop*1.25;ctx.save();
  ctx.fillStyle='#a5582c';ctx.beginPath();ctx.moveTo(x-34,y);ctx.lineTo(x+34,y);ctx.lineTo(x+26,y+46);ctx.lineTo(x-26,y+46);ctx.closePath();ctx.fill();ctx.fillStyle='#5b3a1e';ctx.fillRect(x-36,y-6,72,8);
  ctx.strokeStyle='#3f8f2e';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y-6);
  const L=96,N=12;let px=x,py=y-6,a=-Math.PI/2;const pts=[];for(let i=1;i<=N;i++){a+=ang/N*(i>N*0.35?1.6:0.3);px+=Math.cos(a)*L/N;py+=Math.sin(a)*L/N;ctx.lineTo(px,py);pts.push([px,py,a]);}ctx.stroke();
  const leaf=(p,side)=>{ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(p[2]+side*(1.1-0.5*droop)+droop*0.6);ctx.fillStyle='#4fa63a';ctx.beginPath();ctx.ellipse(16,0,17,7,0,0,6.29);ctx.fill();ctx.restore();};
  leaf(pts[5],-1);leaf(pts[5],1);leaf(pts[N-1],-1);leaf(pts[N-1],1);ctx.restore();}
/* a Ψ number line across the lower-right panel: 0 on the right, more negative to the left */
function wpLadder(ctx,sim,k){const q=wpPanel(ctx,k),kk=Math.min(k,1.3),x0=q.x+30,x1=q.x+q.w-30,y=q.y+q.h*0.62,lo=-16,X=v=>x1-(x1-x0)*clamp(v/lo,0,1);
  const c=phM(sim,'psic'),s=phM(sim,'psisol'),eq=Math.abs(c-s)<0.05;
  H.txt(ctx,eq?'Equal Ψ: no net flow':'Water flows downhill: higher Ψ → lower Ψ',q.x+14,q.y+24*kk,{s:13*kk,w:700,c:eq?PAL['cv-ink']:'#1d6fd6'});
  ctx.save();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();
  for(let v=0;v>=lo;v-=4){ctx.beginPath();ctx.moveTo(X(v),y-5);ctx.lineTo(X(v),y+5);ctx.stroke();H.txt(ctx,v===0?'0':'−'+(-v),X(v),y+20*kk,{s:11.5*kk,a:'center'});}
  H.txt(ctx,'Ψ (bar)',x0-6,y+38*kk,{s:11.5*kk,c:PAL['cv-soft']});
  const dot=(v,col,lab,up)=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(X(v),y,8,0,6.29);ctx.fill();H.txt(ctx,lab+' '+wpS(v),X(v),up?y-16*kk:y+38*kk,{s:12*kk,w:700,c:col,a:'center'});};
  dot(s,'#1d6fd6','solution',true);dot(c,'#2a7a3a','cell',false);
  if(!eq){const xa=X(Math.max(c,s)),xb=X(Math.min(c,s)),ya=y-40*kk;ctx.strokeStyle='#1d6fd6';ctx.fillStyle='#1d6fd6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(xa,ya);ctx.lineTo(xb+10,ya);ctx.stroke();ctx.beginPath();ctx.moveTo(xb,ya);ctx.lineTo(xb+12,ya-6);ctx.lineTo(xb+12,ya+6);ctx.closePath();ctx.fill();
    H.txt(ctx,'water',(xa+xb)/2,ya-8,{s:12*kk,w:700,c:'#1d6fd6',a:'center'});}
  ctx.restore();}

BioLab.addLearn({
wpotential: {
  goals: {
    bio: ['What water potential (Ψ) is and why it predicts which way water moves', 'How to work out Ψs = −iCRT from a real solution', 'Why a plant cell in plain water firms up and in strong sugar water pulls away from its wall', 'Why plants wilt, and why watering them makes them stand back up'],
    honors: ['What water potential (Ψ) is and why it predicts which way water moves', 'How to work out Ψs = −iCRT, including i for salts', 'Why a plant cell in plain water firms up and in strong sugar water pulls away from its wall', 'Why plants wilt, and why watering them makes them stand back up'],
    ap: ['How to use Ψ = Ψp + Ψs and Ψs = −iCRT from the AP formula sheet', 'How to predict the direction of water movement from two Ψ values', 'How to find Ψp of a cell at equilibrium', 'Why the zero point of the potato lab gives the cells’ water potential']
  },
  matters: 'Water moves in and out of every cell you have ever seen, and you cannot watch it happen. Water potential is a single number that tells you which way it will go before it moves. Plants use it to stand up, farmers use it to water fields, and it is on the AP Biology formula sheet.',
  question: 'A plant cell full of sap sits in a beaker. If you change what is dissolved in the beaker, how can one number tell you whether the cell will swell, stay the same, or shrink away from its wall?',
  startKey: 'cell', startRun: true, startSpeed: 0.5,
  startOverlay(sim,ctx,LH,k){tag(ctx,'One plant cell, about 50 µm long',214,74,k,{s:13});scaleBar(ctx,52,400,83,'20 µm',k);tag(ctx,'The live equations, with this moment’s numbers',608,144,k,{s:13});},
  steps: [
    { key: 'cell', title: 'Meet the plant cell', base: { conc: 0.1, solute: 'sucrose', csap: 0.3, temp: 22 }, fresh: true, speed: 0.5,
      see: 'One plant cell, drawn to scale: about 50 µm long, so 20 of them end to end make 1 mm. The thick olive line is the <b>cell wall</b>, the green edge just inside is the <b>membrane</b>, and the big blue space is the <b>vacuole</b>, a bag of watery sap. The brown dots are sugars and salts dissolved in the sap.',
      why: 'The membrane lets water through but holds the dissolved particles in, and the stiff wall stops the cell from stretching too far. The colors are labels: a real cell looks mostly clear and green, and in a red onion the sap is purple.',
      overlay(sim,ctx,LH,k){scaleBar(ctx,52,400,83,'20 µm',k);tag(ctx,'cell wall (stiff)',330,150,k,{s:12});line(ctx,330,162,300,198);
        tag(ctx,'membrane',96,190,k,{s:12});line(ctx,96,202,122,232);tag(ctx,'brown dots: dissolved sugars and salts',236,98,k,{s:12});line(ctx,236,110,196,226);} },
    { key: 'zero', title: 'Pure water: Ψ = 0', set: { conc: 0 }, fresh: true, speed: 0.5,
      see: 'The beaker now holds pure water, so its card shows Ψ = 0. Blue drops move into the cell, the cell swells against its wall, and the wall pushes back: watch Ψp climb in the top card.',
      why: '<b>Water potential (Ψ)</b> measures how ready water is to move. Pure water in an open beaker is set at 0, the top of the scale. Anything dissolved in water lowers its Ψ below 0. The cell’s sap is full of solute, so the cell starts below 0 and water moves in.',
      so: 'This is why a plant cell is firm in fresh water. The wall stops it from bursting.',
      overlay(sim,ctx,LH,k,tau){wpBox(ctx,424,148,368,96,tau);tag(ctx,'pure water: Ψ = 0, the highest Ψ there is',214,82,k,{s:12.5,hi:true,c:'#1d6fd6'});} },
    { key: 'psis', cause: { from: { conc: 0 } }, title: 'Add sugar: Ψs = −iCRT', set: { conc: 0.3 }, fresh: true, speed: 0.5,
      see: 'The beaker now holds 0.30 M sugar (sucrose). The card on the left breaks the solution’s Ψ into the four numbers in Ψs = −iCRT, and the boxed solution card shows the same answer.',
      why: '<b>i</b> is how many particles each unit makes when it dissolves (sucrose stays whole, so 1). <b>C</b> is the concentration in mol/L. <b>R</b> is a constant, 0.0831. <b>T</b> is the temperature in kelvin. More dissolved particles make Ψs more negative.',
      overlay(sim,ctx,LH,k,tau){const T=sim.p.temp;wpBox(ctx,424,148,368,96,tau);const q=wpPanel(ctx,k);
        wpCard(ctx,k,[['Ψs = −iCRT',800,14],'i = 1  (sucrose stays whole)','C = '+sim.p.conc.toFixed(2)+' mol/L','R = 0.0831 L·bar/(mol·K)','T = '+T+' + 273 = '+(T+273)+' K',['Ψs = '+wpS(wpPsi(1,sim.p.conc,T))+' bar',800,14,'#1d6fd6']],q.x+8,q.y+8,352,q.h-16);} },
    { key: 'compare', title: 'Water flows from higher Ψ to lower Ψ', base: { conc: 0.3 }, set: { conc: 0.1 }, fresh: true, speed: 0.25,
      see: 'The number line at the bottom right puts the solution (blue) and the cell (green) on one Ψ scale, with 0 on the right. The arrow shows the way water moves. Watch the green dot slide right as water enters, until the two dots meet.',
      why: 'Water always moves from <b>higher Ψ to lower Ψ</b>, like a ball rolling downhill. 0.10 M sugar is −2.45 bar; the cell starts near −7.35 bar, lower, so water moves in. As the cell swells, its sap gets more dilute and its wall pushes harder, both of which raise its Ψ. Flow stops when the two are equal.',
      overlay(sim,ctx,LH,k){wpLadder(ctx,sim,k);} },
    { key: 'plasmo', cause: { from: { conc: 0.1 } }, title: 'Strong sugar water: plasmolysis', set: { conc: 0.6 }, fresh: true, speed: 0.6,
      see: 'The beaker holds 0.60 M sugar, Ψ = −14.7 bar, far below the cell. Water drops leave, and the cell’s green membrane pulls in from the olive wall. The microscope view on the right shows the same thing in real red onion skin cells: the purple sap shrinks away from each wall.',
      why: 'Now the solution has the lower Ψ, so water leaves the cell. The wall stops pushing (Ψp = 0), and the membrane pulls away from the wall. That is <b>plasmolysis</b>. The cell does not burst or collapse, because the wall keeps its shape.',
      so: 'You can see this in class: a drop of salt water on red onion skin under a microscope.',
      overlay(sim,ctx,LH,k){const q=wpPanel(ctx,k),R=Math.min(74,q.h/2-8);wpOnion(ctx,sim,k,q.x+12+R,q.y+q.h/2,R);
        wpSide(ctx,k,q,[['Red onion skin, ×100',700,13],'Real cells: about','0.3 mm long. The purple','is real pigment in the sap.',[sim.st.V<0.99?'Sap pulls away from walls.':'Sap fills each cell.',700,12.5,'#b3261e']]);} },
    { key: 'wilt', cause: { from: { conc: 0 } }, title: 'Why plants wilt', set: { conc: 0.4 }, fresh: true, speed: 0.6,
      see: 'The cell starts firm, then 0.40 M sugar water pulls water out of it. The plant on the right is built from cells like this one: as the cell loses water and goes from turgid to flaccid, the stem bends over.',
      why: 'A plant has no skeleton. Its stems and leaves stand up because millions of firm cells push on their walls (<b>Ψp > 0</b>), like a bike tire full of air. When the soil water’s Ψ drops below the roots’ Ψ, from drought or too much salt, the cells lose water, Ψp falls to 0, and the plant <b>wilts</b>.',
      overlay(sim,ctx,LH,k){const q=wpPanel(ctx,k);wpPlantAt(ctx,sim,k,q);const st=sim.st.V<0.99?'plasmolyzed':sim.st.V>1.02?'turgid':'flaccid';
        wpSide(ctx,k,q,[['The whole plant',700,13],['Cells: '+st,700,12.5,st==='turgid'?'#2a7a3a':'#b3261e'],'Ψp = '+wpS(phM(sim,'psip'))+' bar']);} },
    { key: 'water', title: 'Water it and it stands back up', set: { conc: 0 }, speed: 0.3,
      see: 'Same wilted plant, now in pure water. Water flows back into the cell, the wall starts pushing again, and the stem lifts.',
      why: 'Fresh water has a higher Ψ (0) than the cells, so water moves back in. Ψp rises, the cells firm up, and the stem stands up again. A plant wilted by dry soil usually recovers within hours of watering, as long as its cells were not damaged.',
      overlay(sim,ctx,LH,k){const q=wpPanel(ctx,k);wpPlantAt(ctx,sim,k,q);const st=sim.st.V<0.99?'plasmolyzed':sim.st.V>1.02?'turgid':'flaccid';
        wpSide(ctx,k,q,[['After watering',700,13],['Cells: '+st,700,12.5,st==='turgid'?'#2a7a3a':'#b3261e'],'Ψp = '+wpS(phM(sim,'psip'))+' bar']);} },
    { lvl: 'honors', key: 'salt', title: 'Salt counts double', set: { conc: 0.3, solute: 'nacl' }, fresh: true, speed: 0.6,
      see: 'Same 0.30 M, but the solute is now table salt, NaCl. The card shows each NaCl splitting into a Na⁺ and a Cl⁻, and the solution’s Ψ doubles from −7.35 to −14.71 bar. The beaker has twice as many particles, and the cell plasmolyzes.',
      why: 'Water potential depends on the number of dissolved particles, not the number of formula units. Each NaCl makes 2 particles, so <b>i = 2</b>; CaCl₂ makes 3. 0.30 M NaCl pulls water like 0.60 M sugar.',
      overlay(sim,ctx,LH,k){const T=sim.p.temp;const q=wpPanel(ctx,k);wpCard(ctx,k,[['1 NaCl → Na⁺ + Cl⁻',800,14],'so i = 2 particles per unit','0.30 M sucrose: Ψs = '+wpS(wpPsi(1,0.3,T))+' bar',['0.30 M NaCl: Ψs = '+wpS(wpPsi(2,0.3,T))+' bar',800,13,'#7a4fa6']],432,258,352);
        tag(ctx,'purple Na⁺, teal Cl⁻',330,120,k,{s:12});} },
    { lvl: 'ap', key: 'psip', title: 'Find Ψp at equilibrium', set: { conc: 0.2 }, fresh: true, speed: 2,
      see: 'In 0.20 M sugar, water enters until flow stops. The card reads the three numbers once the cell settles and solves Ψ = Ψp + Ψs for Ψp.',
      why: 'At equilibrium Ψ<sub>cell</sub> = Ψ<sub>solution</sub>. The open beaker has Ψp = 0, so its Ψ = Ψs = −4.90 bar. The cell’s sap is now a bit diluted, so its Ψs is about −6.99 bar, and Ψp = Ψ − Ψs ≈ +2.09 bar: the wall’s push.',
      overlay(sim,ctx,LH,k){const c=phM(sim,'psic'),s=phM(sim,'psisol'),ss=phM(sim,'psisc');const q=wpPanel(ctx,k);
        wpCard(ctx,k,[['At equilibrium: Ψcell = Ψsolution',800,13],'Ψ = '+wpS(s)+' bar (the solution)','cell Ψs = '+wpS(ss)+' bar','Ψp = Ψ − Ψs',['= '+wpS(s)+' − ('+wpS(ss)+') = '+wpS(s-ss)+' bar',800,13,'#2a7a3a'],[Math.abs(c-s)<0.05?'flow has stopped':'still settling…',600,12,PAL['cv-soft']]],q.x+8,q.y+8,352,q.h-16);} },
    { lvl: 'ap', key: 'zeropt', title: 'The potato lab’s zero point', set: { conc: 0.3 }, fresh: true, speed: 2,
      see: 'The solution is now 0.30 M sugar, the same as the cell’s sap. The cell ends at its starting size, neither firm nor plasmolyzed, and Ψp settles near 0.',
      why: 'When the cell neither gains nor loses water, Ψ<sub>cell</sub> = Ψ<sub>solution</sub> = −iCRT = −7.35 bar. That is exactly what the zero crossing in the potato-core lab measures: the molarity where mass does not change gives the cells’ water potential.',
      overlay(sim,ctx,LH,k){const q=wpPanel(ctx,k);wpCard(ctx,k,[['No mass change, so',800,13],'Ψcell = Ψsolution = −iCRT','= −(1)(0.30)(0.0831)('+(sim.p.temp+273)+')',['= '+wpS(wpPsi(1,0.3,sim.p.temp))+' bar',800,14,'#1d6fd6'],['cell size: '+Math.round(sim.st.V*100)+'% of start',600,12,PAL['cv-soft']]],q.x+8,q.y+8,352,q.h-16);} }
  ],
  useIt: [
    { do: 'On icy steps, mix a little salt into sand instead of using salt alone, and do not pile salty snow around trees and shrubs.',
      why: 'Salt dissolved in soil water drops its Ψ below the roots’ Ψ, so water flows out of the roots, like the cell in strong sugar water. Iowa State University Extension suggests about 50 pounds of sand to 1 pound of salt.' },
    { do: 'For a nasal rinse, use the saline packet, made with distilled, sterile or boiled-and-cooled water.',
      why: 'Saline is close to your cells’ own concentration, so water does not rush into the lining of your nose; plain water does, which stings. The FDA warns against plain tap water because it can carry harmful organisms.' },
    { do: 'Recut cut-flower stems about an inch under water before putting them in a vase.',
      why: 'Water in a plant stem is under tension (negative Ψp), so a fresh cut in air pulls in air bubbles that block the water tubes. Cutting under water fills them with water instead (UMass Extension).' }
  ],
  tryIt: [
    { title: 'the celery stand-up (overnight)',
      steps: ['Let two celery sticks sit out on the counter for a few hours until they bend easily.', 'Put one in a glass of plain water and one in a glass of very salty water (about 3 tablespoons of salt in 1 cup).', 'Leave them in the fridge overnight, then try bending each one.'],
      look: 'The stick in plain water is crisp again: its cells took in water and their walls are pushing back (turgid). The stick in salt water is even floppier, because the salty water has a lower Ψ than its cells.' }
  ]
}
});

/* ---------- cell size and diffusion (agar cubes) ---------- */
const SVX=[140,400,660],SVY=328;
function svP2(sim){let P2=34;['sA','sB','sC'].forEach(k=>{const s=sim.p[k];const sh=sim.p.shape&&H.atLeast('ap')?sim.p.shape:'cube';const d=sh==='slab'?[2*s,2*s,s/4]:sh==='rod'?[4*s,s/2,s/2]:[s,s,s];P2=Math.min(P2,220/d[0],68/d[1]);});return P2;}
function svBox(ctx,x,y,w,h){ctx.save();ctx.globalAlpha=0.97;ctx.fillStyle=PAL['cv-sol'];H.rr(ctx,x,y,w,h,8);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();ctx.restore();}
function svCube(ctx,cx,cy,s,P,cols){const pt=(x,y,z)=>[cx+(x-y)*P*0.866,cy+(x+y)*P*0.5-z*P];
  const F=[[[0,0,s],[s,0,s],[s,s,s],[0,s,s]],[[s,0,0],[s,s,0],[s,s,s],[s,0,s]],[[0,s,0],[s,s,0],[s,s,s],[0,s,s]]];
  F.forEach((f,i)=>{ctx.beginPath();f.forEach((v,j)=>{const q=pt(v[0]-s/2,v[1]-s/2,v[2]);j?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});ctx.closePath();ctx.fillStyle=cols[i];ctx.fill();ctx.strokeStyle='#7a2a55';ctx.lineWidth=1.2;ctx.stroke();});}
const SVPINK=['#f07ab5','#c53f86','#e0569d'];
function svRBC(ctx,x,y,r){ctx.save();const g=ctx.createRadialGradient(x,y,r*0.1,x,y,r);g.addColorStop(0,'#e88a8a');g.addColorStop(0.45,'#c0392b');g.addColorStop(1,'#9b1c1c');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();ctx.restore();}

BioLab.addLearn({
sav: {
  goals: {
    bio: ['Why acid reaches the middle of a small agar cube before a big one', 'What surface area to volume (SA:V) means, and why it drops as a cube gets bigger', 'Why cells stay tiny, and why big living things are made of trillions of cells', 'Where SA:V shows up in cooking, babies and safety'],
    honors: ['Why acid reaches the middle of a small agar cube before a big one', 'How to calculate SA, V and SA:V for a cube', 'How temperature changes the speed of diffusion', 'Where SA:V shows up in cooking, babies and safety'],
    ap: ['Why diffusion time grows with the square of the distance', 'How to calculate SA, V and SA:V and compare shapes of the same volume', 'Why flat and long, thin cells beat round ones of the same volume', 'Where SA:V shows up in cooking, babies and safety']
  },
  matters: 'Everything a cell needs comes in through its surface, and everything it makes goes out the same way. Diffusion is fast over tiny distances and painfully slow over large ones. That one fact explains why you are made of about 30 trillion small cells instead of one big one.',
  question: 'Three pink agar cubes, 1, 2 and 3 cm on a side, soak in vinegar. The acid moves in at the same speed in all three. Why does the small one turn completely clear long before the big one?',
  startKey: 'setup', startRun: false, startSpeed: 0.2,
  startOverlay(sim,ctx,LH,k){const P2=svP2(sim);scaleBar(ctx,30,372,P2,'1 cm',k);tag(ctx,'Pink agar: the real color of phenolphthalein in basic agar',400,288,k,{s:12.5});},
  steps: [
    { key: 'setup', title: 'Three agar “cells”', base: { sA: 1, sB: 2, sC: 3, temp: 20, shape: 'cube' }, fresh: true, speed: 0.15,
      see: 'Three cubes of agar, a jelly made from seaweed, 1, 2 and 3 cm on a side, sitting in a tray of vinegar. Below each cube is a slice through its middle. The 1 cm scale bar sits under the slices.',
      why: 'The agar was made with <b>phenolphthalein</b>, which is bright pink when the agar is basic and turns clear when acid reaches it. That pink is the real color you see in the lab. Each cube stands in for a cell, and the acid stands in for oxygen and food moving in.',
      overlay(sim,ctx,LH,k){scaleBar(ctx,30,372,svP2(sim),'1 cm',k);tag(ctx,'pink = acid has not arrived yet',400,288,k,{s:12.5,hi:true});tag(ctx,'vinegar (acid)',560,262,k,{s:12});} },
    { key: 'inward', title: 'Acid moves in from every face', fresh: true, speed: 0.35,
      see: 'A clear border appears around every slice and creeps inward from all four sides. The arrows on the biggest slice show the acid arriving from every face at once.',
      why: 'Acid particles are always moving randomly. More of them bump in from the vinegar than bump back out, so they spread into the agar from every face that touches vinegar. This random spreading from high to low concentration is <b>diffusion</b>.',
      overlay(sim,ctx,LH,k){const P2=svP2(sim),h=sim.p.sC*P2/2,cx=SVX[2],col='#c8102e';
        lbArrow(ctx,cx-h-34,SVY,cx-h+4,SVY,col);lbArrow(ctx,cx+h+34,SVY,cx+h-4,SVY,col);lbArrow(ctx,cx,SVY-h-26,cx,SVY-h+4,col);lbArrow(ctx,cx,SVY+h+26,cx,SVY+h-4,col);
        tag(ctx,'acid soaks in from every face',cx-150,292,k,{s:12.5,hi:true});} },
    { key: 'same', title: 'The same depth in every block', speed: 1,
      see: 'The red brackets measure the clear border on each slice. They are the same width in all three, and the card shows that depth growing as the minutes pass.',
      why: 'Diffusion does not know how big the block is. In the same vinegar for the same time, acid gets the same distance in from the surface of every block. What differs is how far each block’s <b>center</b> is from its surface: 0.5, 1 and 1.5 cm.',
      overlay(sim,ctx,LH,k){const P2=svP2(sim),d=phM(sim,'depth');['sA','sB','sC'].forEach((key,i)=>{const w=sim.p[key]*P2,x0=SVX[i]-w/2,y=SVY+sim.p[key]*P2/2+9,x1=x0+Math.min(d*P2,w/2);
          ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x0,y-5);ctx.lineTo(x0,y);ctx.lineTo(x1,y);ctx.lineTo(x1,y-5);ctx.stroke();ctx.restore();});
        wpCard(ctx,k,[['Acid depth after '+sim.st.soak.toFixed(1)+' min',700,13],['d = '+d.toFixed(2)+' cm in every block',800,14,'#c8102e']],14,56,240);} },
    { key: 'small', title: 'The small cube finishes first', speed: 4,
      see: 'Sped up. The 1 cm cube turns completely clear first, at about 10 minutes. The 2 and 3 cm cubes still have pink centers, and the card shows how much of each one the acid has reached.',
      why: 'The acid only needs to go 0.5 cm to reach the middle of the small cube, but 1.5 cm for the big one. A cell is the same: oxygen that comes in through the surface reaches the middle of a small cell quickly, and the middle of a big one too slowly.',
      overlay(sim,ctx,LH,k){const p=['pA','pB','pC'].map(id=>phM(sim,id));wpCard(ctx,k,[['After '+sim.st.soak.toFixed(0)+' min, acid has reached:',700,13],['1 cm cube: '+p[0].toFixed(0)+'%',700,13,p[0]>=99.9?'#1b7339':PAL['cv-ink']],'2 cm cube: '+p[1].toFixed(0)+'%','3 cm cube: '+p[2].toFixed(0)+'%'],14,56,240);} },
    { key: 'ratio', title: 'Surface area vs volume', speed: 1,
      see: 'The card builds a 2 cm cube out of eight 1 cm cubes. Its outside surface is 4 times bigger, but there is 8 times as much inside. The SA:V numbers under the blocks show the same pattern: 6, 3 and 2 per cm.',
      why: 'Surface area grows with the side squared (6 × side²), but volume grows with the side cubed (side³). So every time a cell doubles its width, it gets only half as much surface for each bit of inside. <b>SA:V falls as size goes up.</b>',
      overlay(sim,ctx,LH,k){svBox(ctx,14,282,772,104);const P=13;
        svCube(ctx,92,342,1,P*1.6,SVPINK);H.txt(ctx,'1 cm cube',150,316,{s:13*Math.min(k,1.3),w:700});H.txt(ctx,'SA = 6 × 1² = 6 cm²',150,336,{s:12.5*Math.min(k,1.3)});H.txt(ctx,'V = 1³ = 1 cm³ · SA:V = 6',150,356,{s:12.5*Math.min(k,1.3)});
        [[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]].forEach(([x,y,z])=>svCube(ctx,470+(x-y)*P*1.6*0.866,350+(x+y)*P*1.6*0.5-z*P*1.6,1,P*1.6,SVPINK));
        H.txt(ctx,'2 cm cube = 8 small cubes',540,316,{s:13*Math.min(k,1.3),w:700});H.txt(ctx,'SA = 6 × 2² = 24 cm² (×4)',540,336,{s:12.5*Math.min(k,1.3)});H.txt(ctx,'V = 2³ = 8 cm³ (×8) · SA:V = 3',540,356,{s:12.5*Math.min(k,1.3),w:700,c:'#c8102e'});} },
    { key: 'cells', title: 'Why cells stay tiny', speed: 4,
      see: 'The card works out how long acid takes to reach the center of cubes of shrinking size. Every time the cube gets 10 times smaller, the wait gets 100 times shorter.',
      why: 'Time to reach the center grows with the <b>square</b> of the distance. For this agar, a 1 cm “cell” waits 10 minutes, but a cube the size of a real cell, about 10 µm, would wait less than a thousandth of a second. That is why large living things are built from trillions of small cells instead of a few big ones.',
      overlay(sim,ctx,LH,k){svBox(ctx,14,282,772,104);const rows=[['1 cm (block A)','10 min'],['1 mm','6 s'],['0.1 mm','0.06 s'],['10 µm, a real cell','0.0006 s']];
        H.txt(ctx,'Time for the acid to reach the center',30,302,{s:13*Math.min(k,1.3),w:700});
        rows.forEach((r,i)=>{const x=30+i*190;H.txt(ctx,r[0],x,330,{s:12.5*Math.min(k,1.3)});H.txt(ctx,r[1],x,354,{s:14*Math.min(k,1.3),w:800,c:i===3?'#1b7339':PAL['cv-ink']});if(i<3)H.txt(ctx,'÷100',x+150,342,{s:12*Math.min(k,1.3),w:700,c:'#c8102e'});});} },
    { lvl: 'honors', key: 'warm', title: 'Warm vinegar, faster diffusion', set: { temp: 35 }, fresh: true, speed: 2,
      see: 'The same three cubes, but the vinegar is now 35 °C instead of 20 °C. The card compares the acid depth at this moment with what it would be at 20 °C.',
      why: 'Warmer particles move faster, so they spread farther in the same time. Here diffusion is about 45% faster at 35 °C, but the depth only grows with the square root of time, so every block still clears from the outside in.',
      overlay(sim,ctx,LH,k){const t=sim.st.soak,D20=0.0125,D=D20*(1+0.03*(sim.p.temp-20));wpCard(ctx,k,[['After '+t.toFixed(1)+' min',700,13],'at 20 °C: d = '+Math.sqrt(2*D20*t).toFixed(2)+' cm',['at '+sim.p.temp+' °C: d = '+Math.sqrt(2*D*t).toFixed(2)+' cm',800,13,'#c8102e']],14,56,240);} },
    { lvl: 'ap', key: 'slab', title: 'Same volume, flatter shape', set: { shape: 'slab' }, fresh: true, speed: 2,
      see: 'Each block now has the same volume as before but is squashed into a flat slab. The thin slabs clear almost at once. The card compares block A as a cube and as a slab.',
      why: 'A 2 × 2 × 0.25 cm slab holds 1 cm³, like the 1 cm cube, but has 10 cm² of surface instead of 6, and no point is more than 0.125 cm from a face. Time to clear goes with (half the thinnest side)² ÷ 2D: 10 minutes for the cube, about 0.6 minutes for the slab.',
      overlay(sim,ctx,LH,k){wpCard(ctx,k,[['Block A, 1 cm³ either way',700,13],'cube: SA:V 6, clears in 10 min',['slab: SA:V 10, clears in '+phM(sim,'tA').toFixed(1)+' min',800,13,'#c8102e']],14,56,262);} },
    { lvl: 'ap', key: 'shapes', title: 'Real cells cheat with shape', set: { shape: 'rod' }, fresh: true, speed: 2,
      see: 'The blocks are now long thin rods, and the card shows two real cells drawn to the same scale: a red blood cell, a flattened disc about 7.5 µm across and 2 µm thick, and a stretch of a nerve cell’s axon, about 1 µm wide and up to a meter long.',
      why: 'A red blood cell’s flat shape puts every bit of it close to the surface, so oxygen loads and unloads fast. A neuron can reach a meter in length because it stays thin. Both keep SA:V high without being tiny in every direction.',
      overlay(sim,ctx,LH,k){svBox(ctx,14,282,772,104);const u=8;svRBC(ctx,90,327,3.75*u);ctx.save();ctx.fillStyle='#9b1c1c';H.rr(ctx,150,321,7.5*u,2*u,u);ctx.fill();ctx.restore();
        H.txt(ctx,'red blood cell, face on and edge on',40,368,{s:12*Math.min(k,1.3)});
        ctx.save();ctx.fillStyle='#e8d9a8';ctx.strokeStyle='#8a7a3a';ctx.lineWidth=1;H.rr(ctx,300,323,420,1*u,u/2);ctx.fill();ctx.stroke();ctx.restore();H.txt(ctx,'axon of a nerve cell, 1 µm wide (only a tiny piece shown)',300,312,{s:12*Math.min(k,1.3)});
        scaleBar(ctx,560,362,5*u,'5 µm',k);} }
  ],
  useIt: [
    { do: 'Split a big pot of leftovers into small, shallow containers before it goes in the fridge.',
      why: 'A big pot has little surface for all that volume, so its center stays warm for hours while bacteria grow. Shallow containers have far more surface for their volume, so they cool fast. This is the USDA Food Safety and Inspection Service’s advice.' },
    { do: 'Dress a baby or young child in one more layer than you would wear outside in the cold.',
      why: 'A small body has much more skin for its volume than an adult’s, so it loses heat faster, like the small cube taking in acid faster. The American Academy of Pediatrics gives this one-extra-layer rule, and warns not to overdo it.' },
    { do: 'Never shake flour, sugar or other fine powders into the air near a flame.',
      why: 'A powder is a solid broken into a huge number of tiny pieces, with an enormous total surface. OSHA warns that almost any material that burns can burn very fast when finely divided; a sugar dust explosion killed 14 workers in Georgia in 2008.' }
  ],
  tryIt: [
    { title: 'the sugar cube race (5 minutes)',
      steps: ['Fill two clear glasses with the same amount of room-temperature water.', 'Drop a whole sugar cube in one. Crush a second sugar cube into fine grains and pour it into the other.', 'Don’t stir. Watch both and time how long until no sugar is left on the bottom.'],
      look: 'The crushed sugar disappears much sooner. Same amount of sugar, but crushing it gave the water far more surface to work on, the same reason the small agar cube clears first.' }
  ]
}
});


/* ---------- Cell energy (Nov 13, 2026): photosynthesis, chloroplast, glycolysis, respiration ---------- */
/* a card of lines; L = [[text, {s,w,c}]...]; returns the card height */
function ceCard(ctx,k,x,y,w,L,o){o=o||{};const pad=10*k;let h=pad;const rows=L.map(r=>{const t=Array.isArray(r)?[r[0],r[1]||{}]:[r,{}];const sz=(t[1].s||13)*Math.min(k,1.35);h+=sz*1.35;return [t[0],t[1],sz];});h+=pad*0.6+(o.extra||0)*Math.min(k,1.3);
  ctx.save();H.rr(ctx,x,y,w,h,9);ctx.fillStyle=PAL['cv-sol'];ctx.globalAlpha=0.97;ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=o.hi===false?1.2:2.5;ctx.strokeStyle=o.hi===false?PAL['cv-soft']:'#c8102e';ctx.stroke();
  let yy=y+pad;rows.forEach(([s,op,sz])=>{yy+=sz*1.1;H.txt(ctx,s,x+pad,yy,{s:sz,w:op.w||600,c:op.c||PAL['cv-ink']});yy+=sz*0.25;});ctx.restore();return h;}
/* two or three labelled bars inside a card area */
function ceBars(ctx,k,x,y,w,B,max){const bh=14*Math.min(k,1.3),gap=10*Math.min(k,1.3);B.forEach((b,i)=>{const yy=y+i*(bh+gap),lw=Math.min(150,w*0.42);H.txt(ctx,b[0],x,yy+bh*0.8,{s:12*Math.min(k,1.3),w:600});
  ctx.save();ctx.fillStyle=PAL['line'];ctx.fillRect(x+lw,yy,w-lw-50,bh);ctx.fillStyle=b[2];ctx.fillRect(x+lw,yy,Math.max(0,(w-lw-50)*clamp(b[1]/max,0,1)),bh);ctx.restore();
  H.txt(ctx,b[3]||String(Math.round(b[1]*10)/10),x+w-44,yy+bh*0.8,{s:12*Math.min(k,1.3),w:700});});return B.length*(bh+gap);}
const CE_GREEN='#1b7a3a',CE_RED='#b3261e',CE_BLUE='#1f5fbf';
/* Elodea leaf cells in a zoom circle: rectangular cells with green chloroplasts; scale 2.4 px per µm */
function ceElodea(ctx,cx,cy,R,k,t){ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fillStyle='#eef6e4';ctx.fill();ctx.clip();
  const um=2.4,cw=50*um,ch=20*um;for(let r=-4;r<=4;r++){const off=(r%2)*cw*0.5;for(let c=-3;c<=3;c++){const x=cx+c*cw+off-cw/2,y=cy+r*ch-ch/2;ctx.strokeStyle='#7fa86a';ctx.lineWidth=2;ctx.strokeRect(x,y,cw,ch);
    for(let j=0;j<9;j++){const a=(j*2.399+r*1.3+c*0.7),px=x+5+((a*37)%(cw-10)),py=y+4+((a*19)%(ch-8))+Math.sin(t*0.6+j+r)*1.2;ctx.fillStyle='#2f8a2f';ctx.beginPath();ctx.ellipse(px,py,2.6*um,1.6*um,a,0,6.29);ctx.fill();}}}
  ctx.restore();ctx.save();ctx.lineWidth=3;ctx.strokeStyle='#c8102e';ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.stroke();ctx.restore();scaleBar(ctx,cx-25*um/2,cy+R-14,20*um,'20 µm',k);}

BioLab.addLearn({
photo: {
  goals: {
    bio: ['What a plant takes in and gives off when it photosynthesizes', 'Why moving the light twice as far away cuts the bubbles by more than half', 'Why a plant can be making oxygen and still add none to the water', 'How light, CO₂ and temperature each set a limit'],
    honors: ['What a plant takes in and gives off when it photosynthesizes', 'Why light falls off with the square of distance', 'Gross vs. net oxygen: photosynthesis minus the plant’s own respiration', 'Why temperature and light color change the rate'],
    ap: ['The overall equation and where the O₂ comes from', 'Inverse-square light and limiting factors', 'Gross productivity − respiration = net productivity', 'Why the rate peaks with temperature, then falls']
  },
  matters: 'Almost all the oxygen you breathe and the food you eat started in a leaf like this one. The same rules decide how close a grow light should hang, why a fish pond can run out of oxygen before dawn, and why lawns slow down on hot afternoons.',
  question: 'Slide the lamp from 15 cm to 30 cm, twice as far. Does the plant make half as many bubbles? How far can the lamp go before the bubbling stops?',
  startKey: 'setup', startRun: true, startSpeed: 1,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Lamp',474,140,k,{s:12,hi:true});tag(ctx,'Elodea (pondweed), about 10 cm long',300,300,k,{s:12,hi:true});line(ctx,420,300,575,300);
    tag(ctx,'Oxygen bubbles rise here',300,170,k,{s:12,hi:true});line(ctx,392,170,610,200);tag(ctx,'Ruler: cm from the plant',300,395,k,{s:12,hi:true});},
  steps: [
    { key: 'setup', title: 'Light in, oxygen out', set: { dist: 15 }, fresh: true, speed: 1,
      see: 'A sprig of Elodea sits in water with baking soda, 15 cm from a lamp. Tiny bubbles rise from the leaves and the cut stem. The card shows what goes in and what comes out.',
      why: 'The plant uses light energy to turn carbon dioxide and water into sugar. Oxygen is left over and escapes as bubbles. Baking soda releases the CO₂ the plant needs.',
      overlay(sim,ctx,LH,k){ceCard(ctx,k,20,62,390,[['Photosynthesis',{s:15,w:800}],['In:  light + CO₂ (from baking soda) + water',{c:CE_BLUE}],['Out:  sugar (stays in the plant) + O₂ (the bubbles)',{c:CE_GREEN}],['6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂',{s:12,w:700}]]);} },
    { key: 'cells', title: 'Inside a leaf: chloroplasts', set: { dist: 15 }, speed: 1,
      see: 'A close-up of an Elodea leaf, drawn to the 20 µm scale bar. Each brick-shaped cell is packed with green dots: the chloroplasts.',
      why: 'Chloroplasts hold <b>chlorophyll</b>, the green pigment that absorbs light. The absorbed energy splits water molecules, and that is where the oxygen in the bubbles comes from.',
      so: 'Every green part of a plant is doing this whenever light hits it.',
      overlay(sim,ctx,LH,k,tau){ceElodea(ctx,230,250,130,k,tau);line(ctx,360,250,590,250,'#c8102e');tag(ctx,'Leaf cells: the green dots are chloroplasts',230,92,k,{s:12,hi:true});} },
    { key: 'count', title: 'Counting bubbles measures the rate', set: { dist: 15 }, speed: 1,
      see: 'Watch the bubbles rise from the top of the plant while the card counts them. At 15 cm the plant gives off about 20 bubbles a minute.',
      why: 'Each bubble is mostly oxygen. More bubbles per minute means the plant is photosynthesizing faster, so bubble counting is how this class lab measures the rate.',
      overlay(sim,ctx,LH,k){const b=phM(sim,'bubbles'),l=phM(sim,'light');ceCard(ctx,k,20,62,330,[['Lamp 15 cm away',{s:14,w:800}],['Light at the plant: '+Math.round(l)+'%'],['Bubbles per minute: '+Math.round(b),{w:800,c:CE_GREEN}]]);tag(ctx,'count these',700,150,k,{s:12,hi:true});line(ctx,700,165,618,200,'#c8102e');} },
    { key: 'far', cause: { from: { dist: 15 } }, title: 'Twice as far, a quarter of the light', set: { dist: 30 }, fresh: true, speed: 1,
      see: 'The lamp slides back to 30 cm. Light at the plant drops from 44% to 11%, and the bubbles slow to fewer than half: about 8 a minute.',
      why: 'Light spreads out as it travels. At twice the distance the same light covers 4 times the area, so each leaf gets only a quarter. That is the <b>inverse-square</b> rule.',
      overlay(sim,ctx,LH,k){const b=phM(sim,'bubbles'),l=phM(sim,'light');const h=ceCard(ctx,k,20,62,330,[['Lamp 30 cm away (twice as far)',{s:14,w:800}],['Light at the plant: '+Math.round(l)+'% (was 44%)'],['Bubbles per minute: '+Math.round(b),{w:800,c:CE_GREEN}],['Same light, spread over 4× the area:',{s:12}]]);
        const y0=62+h+10,s=28;ctx.save();ctx.fillStyle='#ffd966';ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.fillRect(40,y0,s,s);ctx.strokeRect(40,y0,s,s);H.txt(ctx,'15 cm',54,y0+s+15,{s:11*k,a:'center'});
        ctx.globalAlpha=0.45;for(let i=0;i<2;i++)for(let j=0;j<2;j++){ctx.fillRect(140+i*s,y0+j*s,s,s);}ctx.globalAlpha=1;for(let i=0;i<2;i++)for(let j=0;j<2;j++)ctx.strokeRect(140+i*s,y0+j*s,s,s);H.txt(ctx,'30 cm: ¼ each',168,y0+2*s+15,{s:11*k,a:'center'});ctx.restore();} },
    { key: 'farthest', cause: { from: { dist: 30 } }, title: 'Too far: making = using', set: { dist: 60 }, fresh: true, speed: 1,
      see: 'At 60 cm the bubbles stop. The bars show the plant is still making oxygen, but its own cells use just as much.',
      why: 'Plant cells do cellular respiration all the time, day and night, and it uses oxygen. Bubbles only appear when photosynthesis makes <b>more</b> oxygen than respiration uses. Here the two balance, so nothing is left over.',
      overlay(sim,ctx,LH,k){const g=phM(sim,'gross'),r=phM(sim,'resp');const h=ceCard(ctx,k,20,62,380,[['Lamp 60 cm away',{s:14,w:800}],['O₂ made by photosynthesis vs. used by respiration',{s:12}]],{extra:52});ceBars(ctx,k,32,62+h-52*Math.min(k,1.3),356,[['Made',g,CE_GREEN,g.toFixed(1)],['Used',r,CE_RED,r.toFixed(1)]],30);} },
    { key: 'noco2', cause: { from: { co2: 0.5 } }, title: 'Bright light, no CO₂', set: { dist: 15, co2: 0 }, fresh: true, speed: 1,
      see: 'The lamp is back at 15 cm, as bright as the start, but there is no baking soda. The bubbles stop.',
      why: 'CO₂ is the other raw material. Without it the plant can’t build sugar, the energy from light backs up, and water stops being split. A plant needs light <b>and</b> CO₂; whichever runs short sets the limit.',
      overlay(sim,ctx,LH,k){const g=phM(sim,'gross'),r=phM(sim,'resp');const h=ceCard(ctx,k,20,62,380,[['15 cm, but no CO₂',{s:14,w:800}],['Light 44%, same as the start',{s:12}]],{extra:52});ceBars(ctx,k,32,62+h-52*Math.min(k,1.3),356,[['Made',g,CE_GREEN,g.toFixed(1)],['Used',r,CE_RED,r.toFixed(1)]],30);} },
    { key: 'hot', cause: { from: { temp: 25 } }, lvl: 'honors', title: 'Temperature: warm helps, hot hurts', set: { dist: 15, temp: 45 }, fresh: true, speed: 1,
      see: 'At 15 cm the water is heated to 45 °C. Photosynthesis falls, respiration climbs, and the bubbles stop.',
      why: 'Photosynthesis runs on enzymes. Warmth speeds them up to an optimum (about 35 °C in this model, with the most bubbles of all). Past it, enzymes such as rubisco lose their shape, while respiration keeps rising with heat.',
      overlay(sim,ctx,LH,k){const g=phM(sim,'gross'),r=phM(sim,'resp');const h=ceCard(ctx,k,20,62,380,[['45 °C water',{s:14,w:800}],['At 35 °C: made ≈ 38, used ≈ 8. At 45 °C:',{s:12}]],{extra:52});ceBars(ctx,k,32,62+h-52*Math.min(k,1.3),356,[['Made',g,CE_GREEN,g.toFixed(1)],['Used',r,CE_RED,r.toFixed(1)]],40);} },
    { key: 'green', cause: { from: { filter: "white" } }, lvl: 'honors', title: 'Light color: green works least', set: { dist: 15, filter: 'green' }, fresh: true, speed: 1,
      see: 'A green filter goes over the lamp. The light reaching the plant is the same strength, but the bubbles drop to well under half.',
      why: 'Chlorophyll absorbs red and blue light best and green the least. The green light it doesn’t absorb is reflected or passes through, which is exactly why leaves look green.',
      overlay(sim,ctx,LH,k){const g=phM(sim,'gross');ceCard(ctx,k,20,62,380,[['Green light at 15 cm',{s:14,w:800}],['O₂ made: '+g.toFixed(1)+'  (white light: 24.7)',{w:800,c:CE_GREEN}],['Leaves look green because they use green the least.',{s:12}]]);} },
    { key: 'net', lvl: 'ap', title: 'Gross − respiration = net', set: { dist: 30 }, fresh: true, speed: 1,
      see: 'Back at 30 cm. The card splits the oxygen into what photosynthesis makes (gross), what the plant’s respiration uses, and what is left for the bubbles (net).',
      why: 'Net productivity = gross productivity − respiration. A light-response curve crosses zero net at the <b>light compensation point</b>, which this plant reaches near 60 cm.',
      overlay(sim,ctx,LH,k){const g=phM(sim,'gross'),r=phM(sim,'resp'),n=phM(sim,'net');const h=ceCard(ctx,k,20,62,330,[['30 cm: net = gross − respiration',{s:14,w:800}],[g.toFixed(1)+' − '+r.toFixed(1)+' = '+n.toFixed(1),{w:800}]],{extra:76});ceBars(ctx,k,32,62+h-76*Math.min(k,1.3),306,[['Gross',g,CE_GREEN,g.toFixed(1)],['Respiration',r,CE_RED,r.toFixed(1)],['Net',n,CE_BLUE,n.toFixed(1)]],30);} }
  ],
  useIt: [
    { do: 'Hang a grow light close above seedlings, a few inches away, not across the room.',
      why: 'Light falls off with the square of distance: twice as far gives a quarter of the light. University of Minnesota Extension advises keeping fluorescent lights just 2 to 4 inches above seedlings.' },
    { do: 'Run a pond or aquarium bubbler overnight after cloudy summer days.',
      why: 'At night plants and algae stop photosynthesizing but keep respiring, so oxygen falls until sunrise. Extension services (Texas A&M AgriLife, for one) note that fish kills from low oxygen usually happen near dawn after cloudy, hot weather.' },
    { do: 'Put a houseplant that’s growing slowly in a brighter spot before you add fertilizer.',
      why: 'Fertilizer can’t help if light is the limiting factor. Like the plant at 60 cm, a plant in a dim corner may only make as much sugar as it uses.' },
    { do: 'Shade a pet’s outdoor water bowl and keep a fish tank out of direct sun.', lvl: 'honors',
      why: 'Warm water holds less oxygen, and above an optimum temperature respiration rises while photosynthesis falls, as you saw at 45 °C. Direct sun can also overheat a small tank.' }
  ],
  tryIt: [
    { title: 'the floating leaf disks (20 minutes)',
      steps: ['Stir 1/8 teaspoon of baking soda and one drop of dish soap into a cup of water.', 'Punch 10 disks out of a spinach leaf with a drinking straw.', 'Put the disks and some of the water in a plastic syringe (no needle), cover the tip, and pull the plunger back a few times until the disks sink.', 'Pour the disks and water into a clear cup under a bright lamp. Count how many float every minute.'],
      look: 'Disks rise as oxygen from photosynthesis fills their air spaces. Try a second cup farther from the lamp: its disks rise later.' }
  ]
}
});

/* chloroplast inset: a whole chloroplast with grana, about 5 µm, and where this slice comes from */
function ceChloroInset(ctx,k){const x=18,y=18,w=300,h=128;ctx.save();H.rr(ctx,x,y,w,h,9);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#c8102e';ctx.stroke();
  const cx=x+90,cy=y+68;ctx.beginPath();ctx.ellipse(cx,cy,66,36,0,0,6.29);ctx.fillStyle='#cfe8b8';ctx.fill();ctx.strokeStyle='#4f8a3a';ctx.lineWidth=2;ctx.stroke();
  for(let g=0;g<5;g++){const gx=cx-44+g*22,gy=cy+(g%2?6:-6);for(let d=0;d<5;d++){ctx.fillStyle='#2f7a2f';H.rr(ctx,gx-8,gy-12+d*5,16,4,2);ctx.fill();}}
  ctx.strokeStyle='#c8102e';ctx.lineWidth=2;ctx.strokeRect(cx+22-10,cy-18,20,8);ctx.restore();
  scaleBar(ctx,cx-66,y+h-8,132/5*1,'1 µm',k);H.txt(ctx,'Chloroplast ≈ 5 µm',x+168,y+30,{s:11*k,w:700});H.txt(ctx,'Grana: stacks of',x+168,y+50,{s:11*k});H.txt(ctx,'thylakoids',x+168,y+64,{s:11*k});H.txt(ctx,'Red box: this slice,',x+168,y+86,{s:11*k,c:'#c8102e',w:700});H.txt(ctx,'membrane ≈ 7 nm thick',x+168,y+100,{s:11*k,c:'#c8102e'});}
function ceMitoInset(ctx,k){const x=188,y=8,w=340,h=104;ctx.save();H.rr(ctx,x,y,w,h,9);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#c8102e';ctx.stroke();
  const cx=x+80,cy=y+52;ctx.beginPath();ctx.ellipse(cx,cy,64,30,0,0,6.29);ctx.fillStyle='#f6dcc6';ctx.fill();ctx.strokeStyle='#a0522d';ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx-54,cy);for(let i=0;i<=10;i++){const xx=cx-54+i*10.8;ctx.lineTo(xx,cy+(i%2?-18:18));}ctx.strokeStyle='#c97b4a';ctx.lineWidth=2;ctx.stroke();
  ctx.strokeStyle='#c8102e';ctx.lineWidth=2;ctx.strokeRect(cx-4,cy-24,12,10);ctx.restore();
  H.txt(ctx,'Mitochondrion ≈ 1–2 µm',x+156,y+26,{s:11*k,w:700});H.txt(ctx,'Folded inner membrane',x+156,y+44,{s:11*k});H.txt(ctx,'Red box: this slice,',x+156,y+66,{s:11*k,c:'#c8102e',w:700});H.txt(ctx,'membrane ≈ 7 nm thick',x+156,y+82,{s:11*k,c:'#c8102e'});}
const CLC=(sim,ctx,k,L,o)=>ceCard(ctx,k,330,300,455,L,o);
const RSC=(sim,ctx,k,L,o)=>ceCard(ctx,k,190,6,440,L,o);
const GLC=(sim,ctx,k,L,o)=>ceCard(ctx,k,12,350,336,L,o);
const f1=v=>(Math.round(v*10)/10).toFixed(1);

BioLab.addLearn({
chloroplast: {
  goals: {
    bio: ['Where in a leaf photosynthesis happens, and how small it is', 'How light splits water and releases the oxygen you breathe', 'How the light-powered half charges up ATP and NADPH, and the Calvin cycle spends them to make sugar', 'Why a leaf needs light and CO₂ at the same time'],
    honors: ['How light splits water and powers the electron transport chain', 'How the H⁺ gradient runs ATP synthase', 'How the Calvin cycle spends ATP and NADPH to fix CO₂', 'Why light color, temperature and CO₂ each change the rate'],
    ap: ['Linear electron flow from water to NADP⁺', 'Chemiosmosis: the proton gradient drives ATP synthase', 'The cost of one G3P: 9 ATP and 6 NADPH', 'How DCMU blocks PSII and what that predicts']
  },
  matters: 'This one membrane makes the oxygen in every breath you take and the sugar at the bottom of every food chain. It also explains how some weed killers work and why lawns slow down on hot, dry afternoons.',
  question: 'On a hot, dry afternoon a plant closes its leaf pores, which shuts out CO₂, while the sun is still bright. Does the leaf keep splitting water and releasing oxygen?',
  startKey: 'where', startRun: true, startSpeed: 0.5,
  startOverlay(sim,ctx,LH,k){ceChloroInset(ctx,k);tag(ctx,'Stroma (inside the chloroplast)',225,165,k,{s:12,hi:true});tag(ctx,'Thylakoid space',200,430,k,{s:12,hi:true});},
  steps: [
    { key: 'where', title: 'A slice of a chloroplast', set: {}, fresh: true, speed: 0.5, focus: [0,190,800,130],
      see: 'The inset shows a whole chloroplast, about 5 µm long, with its stacks of flat sacs called thylakoids. The red box is the slice drawn big here: a thylakoid membrane only about 7 nm thick.',
      why: 'Each leaf cell holds dozens of chloroplasts. The light-catching proteins sit in the thylakoid membrane; sugar is built in the fluid around the stacks, the <b>stroma</b> (top).',
      overlay(sim,ctx,LH,k){ceChloroInset(ctx,k);} },
    { key: 'water', title: 'Light splits water: the oxygen you breathe', speed: 0.3, focus: [40,186,110,174],
      see: 'Light hits photosystem II. Watch the small blue O₂ appear under it as water molecules are split.',
      why: 'Light knocks electrons out of chlorophyll. Photosystem II replaces them by splitting water: 2 H₂O → O₂ + 4 H⁺ + 4 electrons. Every O₂ a plant releases comes from water, not from CO₂.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['2 H₂O → O₂ + 4 H⁺ + 4 e⁻',{s:14,w:800}],['O₂ released now: '+f1(phM(sim,'o2')),{w:800,c:CE_GREEN}]]);} },
    { key: 'pump', title: 'Electrons pump H⁺', speed: 0.3, focus: [150,200,210,150],
      see: 'Yellow electrons hop from PSII to PQ to the b6f complex. As they pass, pink H⁺ ions are pushed into the thylakoid space below, and the card’s H⁺ gradient climbs.',
      why: 'The electrons lose a little energy at each hop, like a bucket brigade. The b6f complex uses it to pump H⁺ across the membrane, storing energy the way a battery charges.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['Electron energy → pumping H⁺',{s:14,w:800}],['H⁺ gradient: '+Math.round(phM(sim,'hg'))+'%',{w:800,c:'#b0306a'}]]);} },
    { key: 'psi', title: 'Photosystem I makes NADPH', speed: 0.3, focus: [355,155,200,165],
      see: 'Light hits photosystem I and re-energizes the electrons. They pass to ferredoxin (Fd) and the reductase, and purple NADPH fills its bar in the stroma.',
      why: 'NADPH is a carrier loaded with high-energy electrons. The Calvin cycle will need those electrons to build sugar.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['Light again at PSI → NADPH',{s:14,w:800}],['NADPH supply: '+Math.round(phM(sim,'nadph'))+'%',{w:800,c:'#6a3fb5'}]]);} },
    { key: 'atp', title: 'ATP synthase: H⁺ flows back, ATP is made', speed: 0.3, focus: [600,155,80,180],
      see: 'H⁺ ions crowded in the thylakoid space flow back up through ATP synthase, and its green ATP bar fills.',
      why: 'H⁺ can only cross the membrane through ATP synthase. As they rush through, the protein turns like a water wheel and snaps phosphate onto ADP to make ATP.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['H⁺ flow → ATP',{s:14,w:800}],['ATP supply: '+Math.round(phM(sim,'atp'))+'%',{w:800,c:CE_GREEN}]]);} },
    { key: 'calvin', title: 'The Calvin cycle spends them to make sugar', speed: 0.5, focus: [[440,20,140,140],[600,20,200,160]],
      see: 'Up in the stroma the Calvin cycle turns. CO₂ goes in, the ATP and NADPH bars are drawn down, and the sugar count climbs.',
      why: 'The enzyme <b>rubisco</b> attaches CO₂ to a sugar already in the cycle. ATP and NADPH then supply the energy and electrons to turn it into G3P, the 3-carbon sugar plants use to build glucose.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['CO₂ + ATP + NADPH → sugar (G3P)',{s:14,w:800}],['CO₂ fixed: '+f1(phM(sim,'fix'))+'    Sugar made: '+f1(phM(sim,'g3p')),{w:800,c:CE_GREEN}]]);} },
    { key: 'dark', cause: { from: { light: 80 } }, title: 'Turn off the light', set: { light: 0 }, speed: 0.8,
      see: 'Light goes to 0%. Water splitting stops, the O₂ count falls to 0, the H⁺ gradient drains, and the Calvin cycle slows as its ATP and NADPH run out.',
      why: 'No light means no excited electrons, so nothing refills ATP and NADPH. The Calvin cycle doesn’t use light itself, but it can’t run for long without what the light reactions make.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['Light 0%',{s:14,w:800}],['O₂ released: '+f1(phM(sim,'o2'))+'    H⁺ gradient: '+Math.round(phM(sim,'hg'))+'%',{w:800}],['Sugar made: '+f1(phM(sim,'g3p')),{w:800,c:CE_GREEN}]]);} },
    { key: 'noco2', cause: { from: { co2: 0.6 } }, title: 'Bright light, no CO₂', set: { co2: 0 }, fresh: true, speed: 3,
      see: 'The light is back at 80% but CO₂ is 0. Watch the ATP and NADPH bars fill to the top, and then the O₂ count falls toward 0, even in bright light.',
      why: 'With no CO₂ the Calvin cycle stops spending ATP and NADPH. Once they are full, the electrons have nowhere to go, so water splitting backs up and stops. That is the hook’s answer: no CO₂, no oxygen.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['Light 80%, CO₂ 0',{s:14,w:800}],['ATP '+Math.round(phM(sim,'atp'))+'%   NADPH '+Math.round(phM(sim,'nadph'))+'%   (filling up)',{w:800}],['O₂ released: '+f1(phM(sim,'o2'))+'   (normal CO₂: about 16)',{w:800,c:CE_RED}]]);} },
    { key: 'green', cause: { from: { color: "white" } }, lvl: 'honors', title: 'Green light', set: { color: 'green' }, fresh: true, speed: 0.8,
      see: 'Same 80% light, but green. O₂ released drops to well under half of white light’s 16.',
      why: 'Chlorophyll absorbs red and blue light best and green the least, so fewer electrons get excited.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['Green light',{s:14,w:800}],['O₂ released: '+f1(phM(sim,'o2'))+'   (white: about 16)',{w:800,c:CE_GREEN}]]);} },
    { key: 'hot', cause: { from: { temp: 25 } }, lvl: 'honors', title: '45 °C: rubisco slows', set: { temp: 45 }, fresh: true, speed: 0.8,
      see: 'At 45 °C the CO₂ fixed by rubisco drops to a small fraction of normal, and the ATP and NADPH bars back up.',
      why: 'Rubisco is an enzyme, and past its optimum it loses shape and slows. The light reactions keep charging carriers the Calvin cycle can’t spend.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['45 °C',{s:14,w:800}],['CO₂ fixed: '+f1(phM(sim,'fix'))+'   (25 °C: about 49)',{w:800,c:CE_RED}],['ATP '+Math.round(phM(sim,'atp'))+'%   NADPH '+Math.round(phM(sim,'nadph'))+'%',{w:800}]]);} },
    { key: 'dcmu', cause: { from: { dcmu: false } }, lvl: 'ap', title: 'DCMU blocks photosystem II', set: { dcmu: true }, fresh: true, speed: 0.8,
      see: 'With DCMU on, electrons stop leaving PSII. O₂ release and the H⁺ gradient fall to 0.',
      why: 'DCMU (diuron) binds where plastoquinone should dock on PSII, so linear electron flow stops at its first step. Herbicides such as atrazine work the same way.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['DCMU on',{s:14,w:800}],['O₂: '+f1(phM(sim,'o2'))+'   H⁺ gradient: '+Math.round(phM(sim,'hg'))+'%',{w:800,c:CE_RED}]]);} },
    { key: 'cost', lvl: 'ap', title: 'The cost of one sugar', speed: 0.5, focus: [0,0,800,450],
      see: 'Back to normal. The card adds up what one G3P sugar costs the cycle.',
      why: 'Fixing 3 CO₂ into one G3P uses 9 ATP and 6 NADPH. Linear electron flow makes ATP and NADPH in about a 1.3 : 1 ratio, short of the 1.5 : 1 needed, which is one reason cyclic electron flow exists.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['One G3P (3 carbons)',{s:14,w:800}],['3 CO₂ + 9 ATP + 6 NADPH → 1 G3P',{w:800}],['ATP : NADPH needed = 9 : 6 = 1.5 : 1',{s:12}]]);} }
  ],
  useIt: [
    { do: 'Water lawns and gardens early in the morning.',
      why: 'A plant short on water closes the pores in its leaves, which also shuts out CO₂, the raw material for the Calvin cycle. Colorado State University Extension recommends early-morning watering, when less is lost to evaporation.' },
    { do: 'Use any weed killer exactly as the label says, and keep it off plants you want to keep.',
      why: 'Some herbicides, such as atrazine and diuron, block photosystem II, the step that splits water, so the plant can’t make sugar. The EPA calls the pesticide label the law.' },
    { do: 'For indoor plants, pick a full-spectrum or red-and-blue grow light.',
      why: 'Chlorophyll absorbs red and blue light best and green the least. In this tool, green light cut oxygen release by more than half.' }
  ],
  tryIt: [
    { title: 'light vs. dark leaf disks (20 minutes)',
      steps: ['Make baking-soda water: 1/8 teaspoon of baking soda in a cup of water, plus a drop of dish soap.', 'Punch 20 spinach disks with a straw. Sink them using a plastic syringe with no needle, as in the floating-disk activity.', 'Split them into two clear cups of the baking-soda water. Put one cup under a bright lamp and the other in a dark closet.', 'After 15 minutes, count the floating disks in each cup.'],
      look: 'Only the cup in the light has floaters. Same leaves, same CO₂: without light there is no water splitting, so no oxygen fills the disks.' }
  ]
},

glycolysis: {
  goals: {
    bio: ['How your cells take one glucose apart, and where its 6 carbons go', 'Why oxygen lets a cell make about 32 ATP instead of 2', 'What fermentation is, and why yeast and sprinting muscles use it'],
    honors: ['The three stages: glycolysis, the Krebs cycle and electron transport, and where each happens', 'Where NADH and FADH₂ come from, and why they matter', 'Yeast vs. muscle fermentation, and why fermentation recycles NAD⁺'],
    ap: ['Substrate-level vs. oxidative phosphorylation', 'Carbon accounting from glucose to CO₂', 'Why fermentation keeps glycolysis running without O₂']
  },
  matters: 'Every move you make, from blinking to sprinting, runs on ATP made this way. It also explains where the mass goes when you lose weight, why bread rises and why a bulging can is dangerous.',
  question: 'When you burn off a granola bar on a run, its sugar doesn’t just vanish. Follow one glucose molecule with oxygen available. Where do its 6 carbon atoms end up, and how much ATP does your cell get from it?',
  startKey: 'arrive', startRun: true, startSpeed: 0.25,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Each colored ball = one carbon atom',190,395,k,{s:12,hi:true});line(ctx,110,380,70,335);tag(ctx,'Glycolysis: in the cytoplasm',190,428,k,{s:12,hi:true});},
  steps: [
    { key: 'arrive', title: 'One glucose, six carbons', set: { o2: true, mode: 'cell' }, fresh: true, speed: 0.25, focus: [30,42,320,80],
      see: 'A glucose molecule arrives. Each colored ball is one of its 6 carbon atoms, so you can follow every one.',
      why: 'Glucose (C₆H₁₂O₆) is the sugar carried in your blood. Its bonds store the energy your cell is about to move into ATP, the molecule that powers almost everything a cell does.',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['Glucose: C₆H₁₂O₆',{s:14,w:800}],['About 1 nm across. The mitochondrion',{s:12}],['is drawn far smaller than the real 1–2 µm.',{s:12}]]);} },
    { key: 'invest', title: 'Spend 2 ATP to start', speed: 0.25, focus: [30,105,320,70],
      see: 'Two orange phosphate groups (P) are added to the glucose, and the card shows −2 ATP.',
      why: 'Like an investment, the cell spends 2 ATP first. The phosphates make glucose unstable enough to break in half.',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['Investment: −2 ATP',{s:15,w:800,c:CE_RED}],['Phosphates make glucose ready to split.',{s:12}]]);} },
    { key: 'payoff', title: 'Split and payoff', speed: 0.25, focus: [30,170,320,175],
      see: 'The 6-carbon sugar splits into two 3-carbon halves. Each is broken down to pyruvate, and +4 ATP and +2 NADH appear.',
      why: 'Breaking the halves down releases enough energy to make 4 ATP. Pay back the 2 spent and glycolysis nets 2 ATP. NADH carries high-energy electrons for later.',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['Glycolysis: −2 + 4 = +2 ATP',{s:15,w:800,c:CE_GREEN}],['+2 NADH. Leaves 2 pyruvate (3 carbons each).',{s:12}]]);} },
    { key: 'pyruvate', title: 'Into the mitochondrion: 2 carbons leave', speed: 0.25, focus: [360,215,170,110],
      see: 'With oxygen around, each pyruvate enters the mitochondrion and loses one carbon as CO₂. Watch the CO₂ total in the top bar go up by 2.',
      why: 'That CO₂ is carbon from your glucose, and you will breathe it out. What is left of each pyruvate, a 2-carbon piece, joins the Krebs cycle.',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['2 of the 6 carbons → CO₂',{s:15,w:800}],['+2 NADH',{s:12}]]);} },
    { key: 'krebs', title: 'The Krebs cycle: the last 4 carbons leave', speed: 0.25, focus: [505,90,195,205],
      see: 'The 2-carbon pieces go around the Krebs cycle and leave as 4 more CO₂. All 6 carbons from the glucose are now CO₂.',
      why: 'The cycle strips the carbons off and loads their energy onto NADH and FADH₂, plus 2 ATP. This is where the mass of the food you burn goes: out through your lungs.',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['4 more carbons → CO₂ (all 6 gone)',{s:14,w:800}],['+2 ATP, +6 NADH, +2 FADH₂',{s:12}]]);} },
    { key: 'etc', title: 'Electron transport makes most of the ATP', speed: 0.25, focus: [400,300,370,115],
      see: 'NADH and FADH₂ deliver electrons to the chain on the inner membrane, oxygen catches them to make water, and ATP synthase makes about 28 ATP.',
      why: 'This is the big payoff, and it only works with oxygen. Add it up: 2 + 2 + 28 = about 32 ATP per glucose. (The Cellular respiration tool zooms in on this step.)',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['2 + 2 + 28 ≈ 32 ATP per glucose',{s:15,w:800,c:CE_GREEN}],['O₂ + electrons + H⁺ → water',{s:12}]]);} },
    { key: 'noo2', cause: { from: { o2: true } }, title: 'No oxygen: only 2 ATP', set: { o2: false }, fresh: true, speed: 0.4, focus: [30,240,330,190],
      see: 'Oxygen is switched off. The mitochondrion goes dark, and the top bar now reads 2 ATP per glucose. Pyruvate is turned into ethanol and CO₂ instead (yeast).',
      why: 'Without oxygen to catch electrons, the chain stops, and so does the Krebs cycle. Glycolysis can still make its 2 ATP if the cell turns pyruvate into something else. That is <b>fermentation</b>.',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['No O₂: '+phM(sim,'atpPer')+' ATP per glucose',{s:15,w:800,c:CE_RED}],['32 ÷ 2 = 16 times less. A cell must burn',{s:12}],['sugar about 16 times faster to keep up.',{s:12}]]);} },
    { key: 'muscle', lvl: 'honors', title: 'Muscle fermentation: lactate', set: { o2: false, ferm: 'muscle' }, fresh: true, speed: 0.4, focus: [30,240,330,190],
      see: 'Switch the fermenting cell to muscle. Pyruvate becomes lactate, and no CO₂ is released.',
      why: 'Fermentation makes no ATP itself. Its job is to turn NADH back into NAD⁺, which glycolysis needs to keep going. Yeast does it by making ethanol and CO₂; your muscles make lactate.',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['Muscle: pyruvate → lactate',{s:14,w:800}],['Recycles NAD⁺ so glycolysis can continue.',{s:12}]]);} },
    { key: 'balloon', lvl: 'honors', title: 'The yeast balloon lab', set: { mode: 'balloon' }, fresh: true, speed: 2, focus: [0,40,800,410],
      see: 'Four sealed flasks of yeast. Glucose and sucrose balloons fill with CO₂; lactose and water barely change.',
      why: 'Yeast can ferment glucose, and it can split sucrose into glucose and fructose first. It lacks the enzyme to split lactose, so that sugar is no use to it.',
      overlay(sim,ctx,LH,k){ceCard(ctx,k,20,48,360,[['CO₂ in each balloon (mL)',{s:14,w:800}],['Glucose '+Math.round(phM(sim,'b_glu'))+'   Sucrose '+Math.round(phM(sim,'b_suc'))+'   Lactose '+Math.round(phM(sim,'b_lac'))+'   Water '+Math.round(phM(sim,'b_none')),{w:700}]]);} },
    { key: 'where', lvl: 'ap', title: 'Where the ATP comes from', set: { o2: true, mode: 'cell' }, fresh: true, speed: 0.4, focus: [0,0,800,450],
      see: 'Back to the full cell with oxygen. The card splits the 32 ATP by how each is made.',
      why: 'Substrate-level phosphorylation (an enzyme hands a phosphate straight to ADP) gives 4 ATP: 2 in glycolysis and 2 in the Krebs cycle. Oxidative phosphorylation, driven by the H⁺ gradient, gives about 28.',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['Substrate-level: 2 + 2 = 4 ATP',{s:13,w:800}],['Oxidative: about '+phM(sim,'oxPer')+' ATP',{s:13,w:800}],['10 NADH and 2 FADH₂ feed the chain',{s:12}]]);} }
  ],
  useIt: [
    { do: 'Never eat from a can that is bulging, leaking or spurts when opened.',
      why: 'Some bacteria grow without oxygen and make gas inside a sealed can as they break down food. The USDA says to throw such cans away: one of those bacteria makes the toxin that causes botulism.' },
    { do: 'Let bread dough rise covered, somewhere warm but not hot.',
      why: 'Yeast in the dough ferments sugar into CO₂ and alcohol, exactly the no-oxygen path you saw. The CO₂ bubbles make the bread rise; too much heat kills the yeast.' },
    { do: 'Pace a long run steadily and save the all-out sprint for the end.',
      why: 'Muscles short on oxygen lean on glycolysis, which gets only 2 ATP per glucose instead of about 32, so they burn through sugar about 16 times faster.' },
    { do: 'Warm up and build training slowly, and don’t blame next-day soreness on “lactic acid”.', lvl: 'honors',
      why: 'Lactate made in hard exercise is cleared from the blood within about an hour. Sports-medicine groups such as the American College of Sports Medicine describe next-day soreness as small muscle damage, not leftover lactate.' }
  ],
  tryIt: [
    { title: 'the yeast balloon (30 minutes)',
      steps: ['Pour 1 cup of warm tap water (comfortable to touch, not hot) into each of two empty plastic bottles.', 'Add a packet of dry yeast to each. Add 2 tablespoons of sugar to one bottle only.', 'Stretch a balloon over each opening. Set both somewhere warm.', 'Check every 10 minutes.'],
      look: 'Only the bottle with sugar inflates its balloon. The yeast is fermenting the sugar and releasing CO₂, the same reaction as the class balloon lab.' }
  ]
},

resp: {
  goals: {
    bio: ['Where most of your ATP is made, and how small that place is', 'How electrons from food power pumps that pile up H⁺', 'Why you need oxygen: it catches the electrons at the end', 'Why more effort means more breathing'],
    honors: ['The path of electrons through complexes I to IV', 'How the H⁺ gradient drives ATP synthase', 'Why FADH₂ yields less ATP than NADH'],
    ap: ['Chemiosmotic coupling and proton-motive force', 'P/O ratios: about 2.5 for NADH and 1.5 for FADH₂', 'What blocking complex IV does to the whole chain']
  },
  matters: 'This membrane is why you breathe. Every breath brings in the oxygen that catches electrons here, and every breath out carries away the CO₂ from your food. It also explains carbon monoxide danger and altitude sickness.',
  question: 'Sprinting up the stairs, your muscle cells burn fuel faster and you start breathing hard. Raise the fuel supply from 40% to 100%. What happens to the ATP made and the oxygen used each second?',
  startKey: 'where', startRun: true, startSpeed: 0.25,
  startOverlay(sim,ctx,LH,k){ceMitoInset(ctx,k);tag(ctx,'Matrix (inside the mitochondrion)',220,425,k,{s:12,hi:true});},
  steps: [
    { key: 'where', title: 'The power plant’s inner membrane', set: {}, fresh: true, speed: 0.25, focus: [0,150,800,110],
      see: 'The inset shows a whole mitochondrion, 1–2 µm long, with its folded inner membrane. The red box is the slice drawn here, only about 7 nm thick, with its row of protein machines.',
      why: 'Most of your cells have hundreds of mitochondria. Folding packs more membrane, and more ATP-making machinery, into each one.',
      overlay(sim,ctx,LH,k){ceMitoInset(ctx,k);} },
    { key: 'arrive', title: 'Electrons arrive from your food', speed: 0.1, focus: [60,150,110,215],
      see: 'NADH drops off its electrons (yellow dots) at complex I and leaves as NAD⁺.',
      why: 'Earlier stages took glucose apart and loaded its energy onto NADH as high-energy electrons. Here they are delivered, like current entering a circuit.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['NADH → NAD⁺ + 2 electrons',{s:14,w:800}],['Electrons from your food enter the chain.',{s:12}]]);} },
    { key: 'pumps', title: 'Electrons power the pumps', speed: 0.1, focus: [60,110,460,170],
      see: 'Electrons hop from complex I to Q, III, c and IV. Each time, pink H⁺ ions are pushed up into the space above the membrane.',
      why: 'Each hop releases a little energy, and complexes I, III and IV use it to pump H⁺ across. Releasing energy in small steps lets the cell capture it instead of losing it all as heat.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['Each pump: electron energy → H⁺ pushed up',{s:14,w:800}],['H⁺ gradient: '+Math.round(phM(sim,'grad'))+'%',{w:800,c:'#b0306a'}]]);} },
    { key: 'oxygen', title: 'Oxygen catches the electrons', speed: 0.1, focus: [425,150,95,215],
      see: 'At complex IV, oxygen takes the used electrons and picks up H⁺, and a blue H₂O appears.',
      why: 'Oxygen is the last stop: O₂ + 4 e⁻ + 4 H⁺ → 2 H₂O. Without it the electrons back up and the whole chain jams. This is the reason you breathe.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['O₂ + 4 e⁻ + 4 H⁺ → 2 H₂O',{s:14,w:800}],['O₂ used: '+f1(phM(sim,'o2use'))+' per second',{w:800,c:CE_BLUE}]]);} },
    { key: 'gradient', title: 'H⁺ piles up above the membrane', speed: 0.4, focus: [0,0,800,170],
      see: 'The space above the membrane fills with pink H⁺ ions, far more than in the matrix below.',
      why: 'The crowded H⁺ store energy, like water behind a dam. They “want” to flow back down, but the membrane blocks them except at one gate.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['Like water behind a dam',{s:14,w:800}],['H⁺ gradient: '+Math.round(phM(sim,'grad'))+'%',{w:800,c:'#b0306a'}]]);} },
    { key: 'synthase', title: 'ATP synthase spins', speed: 0.25, focus: [605,110,130,270],
      see: 'H⁺ ions rush back down through ATP synthase, its head spins, and green ATP pops out into the matrix.',
      why: 'The flow of H⁺ turns ATP synthase like a turbine, and each turn adds phosphate to ADP. It takes about 4 H⁺ per ATP.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['H⁺ flow → ATP (≈4 H⁺ each)',{s:14,w:800}],['ATP made: '+f1(phM(sim,'atp'))+' per second',{w:800,c:CE_GREEN}]]);} },
    { key: 'fuel', cause: { from: { fuel: 40 } }, title: 'More fuel: more ATP and more oxygen', set: { fuel: 100 }, fresh: true, speed: 0.4,
      see: 'Fuel goes from 80% to 100%. ATP made rises to about 19 per second, and O₂ used rises to about 3.9. At 40% fuel they were about 11 and 2.3.',
      why: 'More fuel sends more electrons down the chain, and every electron needs oxygen at the end. ATP and O₂ rise together, about 1.7 times from 40% to 100%. That is why you breathe hard on the stairs.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['Fuel 100%   (at 40%: ATP ≈ 11, O₂ ≈ 2.3)',{s:13,w:800}],['ATP '+f1(phM(sim,'atp'))+' per s     O₂ used '+f1(phM(sim,'o2use'))+' per s',{w:800,c:CE_GREEN}]]);} },
    { key: 'noo2', cause: { from: { o2: 100 } }, title: 'No oxygen: the chain stops', set: { o2: 0 }, fresh: true, speed: 0.4,
      see: 'Oxygen is set to 0. Electrons pile up, the pumps stop, the H⁺ gradient drains and ATP production falls to 0 within seconds.',
      why: 'With nothing to catch electrons at complex IV, none can move along the chain, so no H⁺ is pumped and ATP synthase has nothing to run on.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['O₂ 0%',{s:14,w:800,c:CE_RED}],['ATP made: '+f1(phM(sim,'atp'))+' per s    H⁺ gradient: '+Math.round(phM(sim,'grad'))+'%',{w:800}]]);} },
    { key: 'fadh', lvl: 'honors', title: 'FADH₂ enters later', set: { carrier: 'FADH2' }, fresh: true, speed: 0.25, focus: [180,190,70,140],
      see: 'Switch the carrier to FADH₂. Its electrons enter at complex II, skipping complex I, and ATP made drops to about 12 per second.',
      why: 'Complex II doesn’t pump H⁺, so each FADH₂ pumps fewer H⁺ than an NADH, and makes less ATP.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['FADH₂ skips the first pump',{s:14,w:800}],['ATP made: '+f1(phM(sim,'atp'))+' per s   (NADH: about 17)',{w:800,c:CE_GREEN}]]);} },
    { key: 'po', lvl: 'ap', title: 'Counting protons', set: {}, fresh: true, speed: 0.4,
      see: 'Back to NADH. The card shows the proton count behind the P/O ratio.',
      why: 'NADH: 4 + 4 + 2 = 10 H⁺ pumped, about 4 H⁺ per ATP → about 2.5 ATP per O. FADH₂: 6 H⁺ → about 1.5. The model reads P/O ≈ 2.4 for NADH because some H⁺ leak back as heat.',
      overlay(sim,ctx,LH,k){const po=phM(sim,'po');RSC(sim,ctx,k,[['NADH: 10 H⁺ ÷ 4 ≈ 2.5 ATP per O',{s:13,w:800}],['FADH₂: 6 H⁺ ÷ 4 ≈ 1.5 ATP per O',{s:13,w:800}],['Model P/O now: '+(isFinite(po)?po.toFixed(2):'—'),{w:800,c:CE_GREEN}]]);} }
  ],
  useIt: [
    { do: 'Put a carbon monoxide alarm near every sleeping area, and never run a car, grill or generator in a closed space.',
      why: 'Carbon monoxide crowds oxygen off your red blood cells and can also block complex IV, so the chain stops just as it did at 0% oxygen. The CDC says CO alarms save lives because the gas has no smell.' },
    { do: 'On a fourteener, climb gradually and head down if a headache keeps getting worse.',
      why: 'High up, each breath holds less oxygen, so less is there to catch electrons at complex IV. The CDC’s advice for altitude illness is to go up slowly and descend if symptoms get worse.' },
    { do: 'Eat iron-rich foods such as beans, spinach, fortified cereal or meat.',
      why: 'Iron sits in hemoglobin, which carries oxygen, and in the cytochromes of this chain (complexes III and IV and cytochrome c). The NIH lists tiredness as a sign of low iron.' }
  ],
  tryIt: [
    { title: 'count your breaths (5 minutes)',
      steps: ['Sit still for a minute, then count your breaths for 30 seconds.', 'Do 60 seconds of jumping jacks or stair climbing.', 'Count your breaths for 30 seconds again, right away.'],
      look: 'Your breathing speeds up because your muscles are sending more electrons down this chain, and each one needs oxygen at complex IV, like raising the fuel from 40% to 100%.' }
  ]
}
});

/* Why questions (Test yourself, part 2) for the cell-energy tools. */
BioLab.addReview({
photo:{questions:[
  {id:'o2from',kind:'test',lvl:'bio',q:'The bubbles from Elodea are mostly oxygen. Where does that oxygen come from?',choices:['From the baking soda dissolved in the water','From the CO₂ the plant takes in from the water','From water molecules split using light energy','From the lamp’s light turning into a gas'],correct:2,
    steps:['Chlorophyll absorbs light, and the energy is used to split water.','Splitting water releases O₂, H⁺ and electrons.','The CO₂’s carbon and oxygen end up in the sugar, not in the bubbles.']},
  {id:'quarter',kind:'test',lvl:'bio',q:'The lamp moves from 15 cm to 30 cm away. Why do the bubbles drop by more than half?',choices:['At twice the distance light covers 4× the area: ¼ as much','The lamp gets dimmer when it is moved farther away','The water cools down, slowing every reaction in the leaf','The plant runs out of CO₂ once the bubbles slow down'],correct:0,
    steps:['Light from a small lamp spreads out in every direction.','At twice the distance it covers 2 × 2 = 4 times the area.','So each leaf gets ¼ of the light: 44% falls to 11%, and the bubble rate falls more than half.']},
  {id:'stops',kind:'test',lvl:'bio',q:'At 60 cm the bubbles stop. Has the plant stopped photosynthesizing?',choices:['Yes, at 60 cm there is no usable light reaching it','Yes, Elodea only photosynthesizes when light is up close','No: it is making carbon dioxide bubbles instead','No: it makes a little O₂, but respiration uses it all'],correct:3,
    steps:['Plant cells respire all the time, and respiration uses oxygen.','Bubbles only appear when photosynthesis makes more O₂ than respiration uses.','At 60 cm the two balance (made ≈ used), so no extra oxygen escapes.']},
  {id:'co2need',kind:'test',lvl:'bio',q:'Bright light but no baking soda: why do the bubbles stop?',choices:['Baking soda is the plant’s food, so it starves','No CO₂, no sugar, so the light reactions back up','Without baking soda the water turns too acidic','Baking soda itself is what makes the bubbles'],correct:1,
    steps:['Baking soda releases CO₂ into the water.','CO₂ is a raw material for sugar. Without it, the energy carriers made by light have nowhere to go.','Water splitting backs up, so oxygen release stops: CO₂ is now the limiting factor.']},
  {id:'growlight',kind:'real',lvl:'bio',q:'Why do indoor growers hang lights just a few inches above seedlings?',choices:['Light falls off fast with distance, so close is brighter','To keep the seedlings warm from the bulb’s heat','Light from far away shifts to the wrong color','Close lights use less electricity for the same light'],correct:0,
    steps:['Twice the distance gives about a quarter of the light.','A light hung across the room gives leaves only a small fraction of what it gives up close.','Seedlings short on light grow tall and weak looking for more.']},
  {id:'pondnight',kind:'real',lvl:'bio',q:'Why do fish in a pond sometimes die just before dawn after cloudy summer days?',choices:['Fish get too cold at night and stop moving their gills','After a cloudy day, the water heats up overnight and holds less gas','All night, plants use O₂ but make none, so O₂ is lowest at dawn','Algae release CO₂ only during the day, and it builds up at night'],correct:2,
    steps:['In the dark there is no photosynthesis, only respiration.','Algae, plants and fish all use oxygen through the night.','After cloudy days there was little oxygen to start with, so it can run out before the sun returns.']},
  {id:'greenleaf',kind:'test',lvl:'honors',q:'Under green light the plant makes much less oxygen than under white light of the same strength. Why?',choices:['Green light carries less energy than red or blue','Chlorophyll absorbs red and blue best, green least','Green light heats the water, which slows the plant','Plants can only use white light, not single colors'],correct:1,
    steps:['Only absorbed light can drive photosynthesis.','Chlorophyll absorbs blue and red well and green poorly.','The green it doesn’t absorb is reflected or passes through, which is why leaves look green.']},
  {id:'hot45',kind:'test',lvl:'honors',q:'At 45 °C the bubbles stop, even though warmer water helped at 35 °C. Why?',choices:['Hot water holds no CO₂ at all, so the plant has nothing to fix','The plant’s cells burst at 45 °C, so it stops making oxygen','Light can’t travel as far through hot water, so less reaches the leaf','Enzymes like rubisco lose their shape, while respiration keeps rising'],correct:3,
    steps:['Warmth speeds up enzymes, up to an optimum.','Past it, enzymes start to unfold and slow down.','Respiration keeps climbing with heat, so it overtakes photosynthesis and net oxygen goes negative.']},
  {id:'netcalc',kind:'test',lvl:'ap',q:'At 30 cm, gross O₂ production is 11.9 and respiration is 4.0 (same units). What is net production, and what does it mean if it were negative?',choices:['15.9; gross plus respiration is net, so it is growing fast','2.98; net is gross divided by respiration, a ratio','7.9; negative would mean it is below the compensation point','−7.9; net subtracts gross from respiration, so it’s negative'],correct:2,
    steps:['Net = gross − respiration = 11.9 − 4.0 = 7.9.','Net is the oxygen (or sugar) left over for growth or release.','Negative net means respiration exceeds photosynthesis: the plant is below its light compensation point and losing stored sugar.']}
]},
chloroplast:{questions:[
  {id:'waterO2',kind:'test',lvl:'bio',q:'Why does a plant release oxygen when light hits photosystem II?',choices:['PSII splits water to replace lost electrons, leaving O₂','Light breaks CO₂ apart, and the oxygen in it is released','Chlorophyll is built around oxygen, which light knocks loose','The Calvin cycle releases O₂ as it builds each sugar'],correct:0,
    steps:['Light excites electrons in chlorophyll, and they leave PSII.','PSII replaces them by splitting water: 2 H₂O → O₂ + 4 H⁺ + 4 e⁻.','The O₂ is a by-product, and it is the oxygen you breathe.']},
  {id:'darkcalvin',kind:'test',lvl:'bio',q:'The Calvin cycle doesn’t use light. Why does it stop soon after the light goes off?',choices:['It needs the light to keep the leaf warm enough to work','CO₂ leaves the leaf in the dark, so there’s nothing to fix','Rubisco is broken down by darkness and rebuilt each morning','It runs on ATP and NADPH, which only light reactions make'],correct:3,
    steps:['The Calvin cycle spends ATP and NADPH to turn CO₂ into sugar.','Only the light-powered half of photosynthesis refills them.','When the light goes off, the supplies run down and the cycle slows to a stop.']},
  {id:'noco2o2',kind:'test',lvl:'bio',q:'With bright light but no CO₂, why does oxygen release fall to almost zero?',choices:['Oxygen comes from CO₂, so with no CO₂ there is no O₂ to release','No Calvin cycle means ATP and NADPH pile up, and electrons back up','The leaf closes its chloroplasts when it senses no CO₂','Light can’t get into the leaf unless CO₂ holds the pores open'],correct:1,
    steps:['No CO₂ means the Calvin cycle stops.','ATP and NADPH fill up because nothing spends them.','The electron chain has nowhere to send electrons, so PSII stops splitting water and O₂ release stops.']},
  {id:'stomata',kind:'real',lvl:'bio',q:'On hot, dry afternoons, grass grows more slowly even in full sun. Why?',choices:['To save water, leaves close pores, which also blocks CO₂','The bright sun bleaches the leaves faster than they can repair','Grass grows mostly at night, and hot days shorten the night','Heat breaks down chlorophyll, so the leaves can’t catch light'],correct:0,
    steps:['Leaf pores (stomata) let CO₂ in and water vapor out.','When water is short, plants close them to avoid drying out.','Less CO₂ gets in, so the Calvin cycle slows and so does growth.']},
  {id:'herbicide',kind:'real',lvl:'bio',q:'Some weed killers block photosystem II. Why does that kill a plant?',choices:['It poisons the soil, so the roots can’t take in nutrients','No electron flow means no ATP or NADPH, so no sugar','It makes the leaves heavy with water until they droop','It stops the roots from taking in water, so the plant wilts'],correct:1,
    steps:['PSII is the start of the electron chain.','Blocked PSII means no water splitting, no H⁺ gradient and no NADPH.','Without ATP and NADPH the Calvin cycle stops, and the plant starves.']},
  {id:'synthase',kind:'test',lvl:'honors',q:'Why does H⁺ build up in the thylakoid space, and how does that make ATP?',choices:['The Calvin cycle releases H⁺ there as it builds sugar','ATP synthase pumps H⁺ in, and the pump itself makes ATP','Electron flow pumps H⁺ in; it flows out through ATP synthase','H⁺ is attracted to chlorophyll, and the pull makes ATP'],correct:2,
    steps:['Water splitting and the b6f pump add H⁺ to the thylakoid space.','The membrane blocks H⁺ except at ATP synthase.','H⁺ rushing out turns ATP synthase, which joins phosphate to ADP.']},
  {id:'g3pcost',kind:'test',lvl:'ap',q:'Making one G3P fixes 3 CO₂. How much ATP and NADPH does it use?',choices:['3 ATP and 3 NADPH','6 ATP and 9 NADPH','18 ATP and 12 NADPH','9 ATP and 6 NADPH'],correct:3,
    steps:['Each CO₂ fixed costs 3 ATP and 2 NADPH across the cycle.','3 CO₂ × 3 ATP = 9 ATP; 3 CO₂ × 2 NADPH = 6 NADPH.','That 1.5 : 1 ratio is more ATP than linear electron flow alone provides.']}
]},
glycolysis:{questions:[
  {id:'carbons',kind:'test',lvl:'bio',q:'With oxygen, where do all 6 carbon atoms of a glucose end up?',choices:['In ATP','As CO₂ that you breathe out','As water','They stay in the mitochondrion'],correct:1,
    steps:['2 carbons leave as CO₂ when pyruvate enters the mitochondrion.','The other 4 leave as CO₂ in the Krebs cycle.','You breathe that CO₂ out, which is where most of the mass of burned food goes.']},
  {id:'o2why',kind:'test',lvl:'bio',q:'Why does a cell get about 32 ATP per glucose with oxygen but only 2 without it?',choices:['Oxygen accepts electrons at the end of the chain; without it only glycolysis runs','Oxygen is itself a fuel, and burning it is what releases most of the 32 ATP','Glucose can’t get into cells without oxygen, so only a little is used','Without oxygen the cell still makes 32 ATP, it just takes much longer'],correct:0,
    steps:['Most ATP (about 28) comes from electron transport, which needs O₂ to accept electrons.','No O₂ means no electron transport, and the Krebs cycle stalls too.','Only glycolysis is left: 2 ATP per glucose.']},
  {id:'invest',kind:'test',lvl:'bio',q:'Glycolysis spends 2 ATP before it makes any. Why is that worth it?',choices:['It isn’t worth it; the cell just loses 2 ATP each time','The 2 ATP are stored in glucose and given back later','Glucose needs the ATP to get into the mitochondrion','Phosphates make glucose split, and 4 ATP come back: net 2'],correct:3,
    steps:['Adding 2 phosphates destabilizes the glucose.','It splits, and its halves release energy to make 4 ATP.','4 − 2 = net 2 ATP from glycolysis.']},
  {id:'bread',kind:'real',lvl:'bio',q:'Why does bread dough rise?',choices:['Flour swells as it soaks up the water in the dough','Kneading pumps air bubbles into the dough, and they expand','Yeast ferments sugar, and the CO₂ it makes is trapped','Salt reacts with the water and gives off a gas'],correct:2,
    steps:['Yeast in dough has little oxygen, so it ferments.','Fermentation in yeast turns pyruvate into ethanol and CO₂.','The CO₂ bubbles get trapped in the dough; the alcohol bakes off.']},
  {id:'weight',kind:'real',lvl:'bio',q:'When you lose weight, where does most of the lost mass go?',choices:['Out through your lungs as CO₂','Out through your skin as sweat','It is burned up and turns into heat','It moves into your muscles as protein'],correct:0,
    steps:['Burning fat and sugar breaks their carbon chains apart.','Those carbons leave as CO₂, as you saw in the Krebs cycle.','You breathe the CO₂ out, so most of the lost mass leaves through your lungs.']},
  {id:'nadplus',kind:'test',lvl:'honors',q:'Fermentation makes no ATP. Why do cells do it?',choices:['To make CO₂, which the cell needs to stay at the right pH','To turn pyruvate back into glucose for the next round','It turns NADH back into NAD⁺, so glycolysis can keep going','To get rid of extra heat when the cell is working hard'],correct:2,
    steps:['Glycolysis needs NAD⁺ to accept electrons.','Without oxygen, NADH can’t unload at the electron transport chain.','Fermentation unloads NADH onto pyruvate (making lactate or ethanol), freeing NAD⁺ so glycolysis can continue.']},
  {id:'lactose',kind:'test',lvl:'honors',q:'In the balloon lab, yeast fills balloons with glucose and sucrose but not lactose. Why?',choices:['Lactose is too sweet, and the extra sugar slows yeast down','Yeast lack the enzyme to split lactose into usable sugars','Lactose isn’t a sugar at all, so yeast can’t ferment it','Lactose is toxic to yeast and kills them in the balloon'],correct:1,
    steps:['Yeast can ferment glucose directly.','It has an enzyme (invertase) that splits sucrose into glucose and fructose.','It has no lactase, so lactose stays unused and the balloon stays flat.']},
  {id:'substrate',kind:'test',lvl:'ap',q:'How many of the ~32 ATP per glucose come from substrate-level phosphorylation?',choices:['2','28','32','4'],correct:3,
    steps:['Substrate-level: an enzyme transfers phosphate directly to ADP.','Glycolysis gives 2 net this way and the Krebs cycle gives 2.','The other ~28 come from oxidative phosphorylation via ATP synthase.']}
]},
resp:{questions:[
  {id:'whybreathe',kind:'test',lvl:'bio',q:'What does the oxygen you breathe actually do inside your cells?',choices:['It takes electrons at the chain’s end and becomes water','It burns glucose directly, like a flame burning wood','It becomes the CO₂ you breathe out, carrying carbon away','It is packed into ATP, which carries it around the cell'],correct:0,
    steps:['Electrons from food pass down the chain, powering H⁺ pumps.','At complex IV, O₂ accepts them and joins H⁺ to form water.','Without O₂ the electrons have nowhere to go and the chain stops.']},
  {id:'pumpstore',kind:'test',lvl:'bio',q:'Why do the proteins pump H⁺ across the membrane instead of making ATP directly?',choices:['They can’t do anything else, so pumping is just a side effect','H⁺ is a waste product, and pumping it out cleans the matrix','To make the matrix acidic, which ATP synthase needs to work','The gradient stores energy, and ATP synthase spends it'],correct:3,
    steps:['Each electron hop releases a small amount of energy.','The pumps store it by piling H⁺ above the membrane, like water behind a dam.','ATP synthase lets the H⁺ flow back and uses that flow to make ATP.']},
  {id:'stairs',kind:'test',lvl:'bio',q:'Raising the fuel from 40% to 100% raises both ATP made and O₂ used. Why do they rise together?',choices:['They rise by chance; ATP and O₂ don’t depend on each other','Oxygen is made when ATP breaks down, so more ATP gives more','Each electron down the chain needs O₂ at the end, so both rise','More fuel produces more oxygen, which then makes more ATP'],correct:2,
    steps:['More fuel means more NADH delivering electrons.','More electrons pump more H⁺, so more ATP is made.','Each electron must be caught by O₂, so oxygen use rises in step: about 1.7 times for both.']},
  {id:'cogas',kind:'real',lvl:'bio',q:'Why is carbon monoxide dangerous even though you keep breathing normally?',choices:['Its smell makes you breathe less, so less oxygen gets in','It stops O₂ from being delivered, so the chain stops','It makes the chain run too fast and make too much ATP','It damages only the lungs, so cells elsewhere are fine'],correct:1,
    steps:['CO binds hemoglobin far more tightly than O₂, so less oxygen reaches cells.','It can also block complex IV.','Either way electrons can’t be passed to oxygen, ATP production falls, and the brain and heart suffer first.']},
  {id:'altitude',kind:'real',lvl:'bio',q:'Why do you breathe faster on top of a fourteener?',choices:['Cold air on top makes your body breathe faster to warm up','Each breath holds less O₂, so you breathe more to keep up','Mountain air has more CO₂, which makes you breathe faster','Climbing burns no ATP, so your body speeds up breathing'],correct:1,
    steps:['Air pressure is lower up high, so each breath brings in less O₂.','Your mitochondria still need the same oxygen to keep the chain running.','Breathing faster and deeper makes up part of the difference.']},
  {id:'fadh2',kind:'test',lvl:'honors',q:'Why does FADH₂ make less ATP than NADH?',choices:['Its electrons enter at complex II, skipping a pump','FADH₂ carries no electrons, only hydrogen ions','FADH₂ blocks ATP synthase while it is unloading','It needs twice as much oxygen to accept its electrons'],correct:0,
    steps:['NADH gives its electrons to complex I, which pumps H⁺.','FADH₂ gives them to complex II, which doesn’t pump.','Fewer H⁺ pumped means less flow through ATP synthase, about 1.5 ATP instead of 2.5.']},
  {id:'cyanide',kind:'test',lvl:'ap',q:'Cyanide blocks complex IV. What happens to the H⁺ gradient and to O₂ use?',choices:['Both rise, because electrons pile up at complex IV','The gradient rises and O₂ use falls, since pumping goes on','Both fall to near zero: no O₂ use, no pumping, no gradient','Nothing changes, because complexes I and III still pump'],correct:2,
    steps:['With complex IV blocked, electrons back up all the way to complex I.','No electron flow means no H⁺ pumping, and the gradient leaks away.','O₂ use stops too, even though blood is full of oxygen.']}
]}
});


/* ===== Cell division: division, cellcycle, roottip ===== */
/* wrapped card: lines are strings or [text,{s,w,c}]; words wrap to fit w */
function dcCard(ctx,k,x,y,w,L,o){o=o||{};const kk=Math.min(k,1.35),pad=10*kk,rows=[];
  L.forEach(r=>{const t=Array.isArray(r)?r:[r,{}],op=t[1]||{},sz=(op.s||13)*kk;ctx.font=(op.w||600)+' '+sz+'px '+H.FONT;
    const words=String(t[0]).split(' ');let cur='';words.forEach(wd=>{const tr=cur?cur+' '+wd:wd;if(cur&&ctx.measureText(tr).width>w-2*pad){rows.push([cur,op,sz]);cur=wd;}else cur=tr;});if(cur)rows.push([cur,op,sz]);});
  let h=pad*1.6;rows.forEach(r=>h+=r[2]*1.35);if(o.up)y-=h;
  ctx.save();H.rr(ctx,x,y,w,h,9);ctx.fillStyle=PAL['cv-sol'];ctx.globalAlpha=0.97;ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=o.hi===false?1.2:2.5;ctx.strokeStyle=o.hi===false?PAL['cv-soft']:'#c8102e';ctx.stroke();
  let yy=y+pad*0.8;rows.forEach(([s,op,sz])=>{yy+=sz*1.1;H.txt(ctx,s,x+pad,yy,{s:sz,w:op.w||600,c:op.c||PAL['cv-ink']});yy+=sz*0.25;});ctx.restore();return h;}
const dvGo=i=>sim=>{const d=sim.def;d.go(sim,i-1);sim.st.prog=1;d.go(sim,i);};
const dvAct=(sim,id)=>{const a=(sim.def.actions||[]).find(x=>x.id===id);if(a)a.run(sim);};
const dvN=(sim)=>{const c=phM(sim,'chrom');return String(c);};
const dvL=(ctx,k,L)=>dcCard(ctx,k,10,58,218,L);
const dvR=(ctx,k,L)=>dcCard(ctx,k,572,58,218,L);
const dvB=(ctx,k,LH,L)=>dcCard(ctx,k,120,(LH||450)-28,560,L,{up:true});
const DV_RED='#c53a4f',DV_BLUE='#2f6fd0';
/* cell cycle: fast-forward the model by h hours */
function ccFF(sim,h){const d=sim.def,dt=d.dtMax||0.05;let t=0;while(t<h-1e-9){const s=Math.min(dt,h-t);d.step(sim,s);t+=s;}sim.t+=h;sim.infoDirty=true;}
const ccPct=(sim,ph)=>{const c=sim.st.cells,n=c.length||1;return Math.round(100*c.filter(x=>x.ph===ph).length/n);};
const ccL=(ctx,k,L)=>dcCard(ctx,k,8,40,212,L);
const ccHrs=sim=>Math.round(sim.t)+' h';
/* root tip: pick a cell in a phase near the middle of the field */
function rtCell(sim,ph){const s=sim.st,CX=530,CY=226;return s.cells.find(c=>c.ph===ph&&Math.hypot(c.x+c.w/2-CX,c.y+c.h/2-CY)<146)||s.cells.find(c=>c.ph===ph);}
const rtSel=ph=>sim=>{const c=rtCell(sim,ph);if(c){sim.st.sel=c.i;sim.infoDirty=true;}};
const rtRect=ph=>sim=>{const c=rtCell(sim,ph);return c?[c.x-14,c.y-14,c.w+28,c.h+28]:[320,16,420,420];};
function rtCount(sim,f){for(let i=0;i<f;i++){if(i)dvAct(sim,'field');dvAct(sim,'all');}}
const rtT=sim=>{const k=sim.p.zone+'|'+sim.p.treat,t=sim.st.tally[k]||{inter:0,pro:0,meta:0,ana:0,telo:0};const n=t.inter+t.pro+t.meta+t.ana+t.telo;return {t,n};};
const rtL=(ctx,k,L)=>dcCard(ctx,k,8,40,300,L);
const rtPh=(name,look)=>(sim,ctx,LH,k)=>{rtL(ctx,k,[[name,{s:15,w:800}],['Look for:',{s:12,w:700}],[look,{s:13}]]);};

BioLab.addLearn({
division: {
  goals: {
    bio: ['How a cell copies its DNA and splits into two identical cells', 'What happens in each phase of mitosis', 'How meiosis halves the chromosome number to make egg and sperm cells', 'Why brothers and sisters get different mixes of their parents’ chromosomes'],
    honors: ['Sister chromatids vs. homologous chromosomes', 'The phases of mitosis and what moves in each', 'Meiosis I separates partners; meiosis II separates sisters', 'How independent assortment and crossing over create variety'],
    ap: ['Chromosome number (n, 2n) and DNA content (C) through each phase', 'Mitosis vs. meiosis I and meiosis II', 'Independent assortment: 2ⁿ gamete types', 'How nondisjunction makes gametes with the wrong chromosome number']
  },
  matters: 'Every scrape that heals and every inch you grow comes from cells splitting their chromosomes exactly right, and every egg and sperm cell comes from a second kind of division. When either goes wrong, the result can be cancer or a baby with an extra chromosome.',
  startKey: 'g1', startRun: true, startSpeed: 0.5,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Nucleus (DNA inside)',140,100,k,{s:12,hi:true});line(ctx,200,112,330,160);
    tag(ctx,'Cell membrane',675,120,k,{s:12,hi:true});line(ctx,620,130,545,170);
    tag(ctx,'Red came from the mother, blue from the father',400,395,k,{s:12,hi:true});},
  steps: [
    { key: 'copy', title: 'Copy the DNA first', fresh: true, speed: 0.5, run: dvGo(1),
      see: { bio: 'Before dividing, the cell copies every chromosome. Each one is now doubled: two identical copies stuck together. There are still 4 chromosomes, but twice as much DNA.',
             honors: 'In S phase each chromosome is replicated into two identical <b>sister chromatids</b>, joined at the centromere. Still 4 chromosomes (2n = 4), each with 2 chromatids.',
             ap: 'In S phase every chromosome is replicated into two sister chromatids. The chromosome number stays 2n = 4, but DNA per cell doubles from 2C to 4C.' },
      why: 'Each new cell needs a complete set of instructions. Copying first gives the cell exactly one full set to hand to each side.',
      overlay(sim,ctx,LH,k){const L=[['S phase: DNA copied',{s:14,w:800}],['Chromosomes: 4'],['Each one: 2 identical copies']];if(H.atLeast('ap'))L.push(['DNA: 2C → 4C',{w:800}]);dvR(ctx,k,L);} },
    { key: 'pro', title: 'Prophase: coil up', fresh: true, speed: 0.5, run: dvGo(2),
      see: 'The long, thin DNA coils into short, thick chromosomes you could see in a microscope. The nucleus breaks down, and the spindle poles (the dots) move to opposite sides.',
      why: 'Long DNA strands would tangle like earbud wires if you tried to pull them apart. Packed tightly, each chromosome moves in one piece.',
      overlay(sim,ctx,LH,k){dvL(ctx,k,[['Prophase',{s:14,w:800}],['DNA coils up'],['Nucleus breaks down'],['Spindle poles move apart']]);} },
    { key: 'meta', title: 'Metaphase: line up', fresh: true, speed: 0.5, run: dvGo(3),
      see: 'Spindle fibers from both poles grab each chromosome at its middle and line them all up across the center of the cell.',
      why: 'With every chromosome on the center line, one copy faces each pole. That guarantees each side gets exactly one copy of every chromosome.',
      so: { honors: 'A checkpoint holds the cell here until every chromosome is attached to both poles. Skipping it can leave a cell with the wrong number.' },
      overlay(sim,ctx,LH,k){dvR(ctx,k,[['Metaphase',{s:14,w:800}],['All chromosomes in one line across the middle'],['One copy faces each pole']]);} },
    { key: 'ana', title: 'Anaphase: pull apart', fresh: true, speed: 0.5, run: dvGo(4),
      see: 'The copies split and are pulled to opposite ends. Each end now has one copy of all 4 chromosomes: two red and two blue.',
      why: { bio: 'The spindle fibers shorten and reel the copies toward the poles, like pulling in two fishing lines at once.', honors: 'The centromeres split and the spindle fibers attached to each sister chromatid shorten, so the former sisters, now separate chromosomes, move to opposite poles.' },
      overlay(sim,ctx,LH,k){dvL(ctx,k,[['Anaphase',{s:14,w:800}],['Copies pulled to opposite ends'],['Each end: 4 chromosomes']]);} },
    { key: 'two', title: 'Two identical cells', fresh: true, speed: 0.5, run: dvGo(6),
      see: 'Telophase rebuilds a nucleus at each end, and the cell pinches in two. Each new cell has the same 4 chromosomes as the parent.',
      why: 'Because each side got one copy of every chromosome, the two cells are genetic copies of the parent and of each other.',
      so: 'This is how you grow and heal. When you scrape a knee, skin cells at the edges divide this way until the gap is filled.',
      overlay(sim,ctx,LH,k){dvB(ctx,k,LH,[['Mitosis: 2 identical cells, 4 chromosomes each (2n = 4)',{s:14,w:800}]]);} },
    { key: 'pair', title: 'Meiosis: partners pair up', set: { mode: 'meiosis' }, fresh: true, speed: 0.5, run: dvGo(2),
      see: 'Now meiosis, which only makes egg and sperm cells. After the DNA is copied, each chromosome finds its partner: the matching one from the other parent.',
      why: { bio: 'Partners carry the same genes, though maybe different versions. Pairing them up lets meiosis split the partners, so each new cell gets one of each pair.', honors: 'Each <b>homologous pair</b> has the same genes in the same order, one homolog from each parent. Pairing (synapsis) lets meiosis I separate homologs.' },
      overlay(sim,ctx,LH,k){dvL(ctx,k,[['Prophase I',{s:14,w:800}],['Long red + long blue = a pair'],['Short red + short blue = a pair']]);} },
    { key: 'cross', lvl: 'honors', title: 'Crossing over', set: { mode: 'meiosis', xo: true }, fresh: true, speed: 0.5, run: dvGo(2),
      see: 'With crossing over on, partners swap matching pieces where they touch (the yellow X).',
      why: 'Chromatids from the two homologs break and rejoin at the same point, so a chromosome comes out part mom, part dad. That makes allele combinations neither parent had on one chromosome.',
      overlay(sim,ctx,LH,k){dvL(ctx,k,[['Crossing over',{s:14,w:800}],['Partners trade matching pieces'],['New mixes of alleles on one chromosome']]);} },
    { key: 'ai', title: 'Meiosis I: partners separate', set: { mode: 'meiosis' }, fresh: true, speed: 0.5, run: dvGo(4),
      see: 'In anaphase I the partners are pulled apart, but each chromosome’s two copies stay together. Each side gets one chromosome from each pair: 2 instead of 4.',
      why: { bio: 'This is the step that halves the number. Which partner goes to which side is random for each pair, like flipping a coin.', honors: 'Anaphase I separates homologs, not sisters, so each daughter is haploid (n = 2). Each pair orients independently: <b>independent assortment</b>.' },
      overlay(sim,ctx,LH,k){const L=[['Anaphase I',{s:14,w:800}],['Partners separate'],['Copies stay joined'],['Each side: 2 chromosomes']];if(H.atLeast('ap'))L.push(['Each side: n = 2, 2C',{w:800}]);dvL(ctx,k,L);} },
    { key: 'four', title: 'Four cells with half the chromosomes', set: { mode: 'meiosis' }, fresh: true, speed: 0.5, run: dvGo(9),
      see: 'Meiosis II splits each chromosome’s two copies, much like mitosis. The result is four cells, each with 2 chromosomes, half of the parent’s 4.',
      why: 'When an egg (n) and a sperm (n) join, the new cell is back to 2n. If gametes weren’t halved, the chromosome number would double every generation.',
      overlay(sim,ctx,LH,k){dvB(ctx,k,LH,[['Meiosis: 4 cells, each with 2 chromosomes (n = 2)',{s:14,w:800}],['Egg (n) + sperm (n) → baby (2n)']]);} },
    { key: 'sort', title: 'Many kinds of gametes', set: { mode: 'meiosis', pairs: 3 }, fresh: true, speed: 0.5, run(sim){dvAct(sim,'run100');},
      see: 'With 3 pairs, the sim runs 100 meioses (400 gametes) and sorts them by which mix of red and blue chromosomes they got.',
      why: 'Each pair lines up on its own, so each gamete gets mom’s or dad’s version of each chromosome, like a coin flip per pair: 2 × 2 × 2 = 8 combinations.',
      so: 'You have 23 pairs: 2²³, about 8.4 million combinations, before crossing over adds more. That is why siblings (except identical twins) are never genetic copies.',
      overlay(sim,ctx,LH,k){const t=phM(sim,'types');dvR(ctx,k,[['3 pairs, 100 meioses',{s:14,w:800}],['Gamete types seen: '+(isNaN(t)?'–':t),{w:800,c:CE_GREEN}],['Possible: 2 × 2 × 2 = 8'],['Humans: 2²³ ≈ 8.4 million']]);} },
    { key: 'nd', lvl: 'ap', title: 'Nondisjunction', set: { mode: 'meiosis', nd: true }, fresh: true, speed: 0.5, run: dvGo(9),
      see: 'Pair 1 fails to separate in meiosis I. Two gametes get both pair-1 chromosomes (3 total) and two get none (1 total).',
      why: 'A gamete with an extra chromosome makes a zygote with 2n + 1, a trisomy. Most trisomy 21 (Down syndrome) comes from nondisjunction in the egg, and its risk rises with the mother’s age.',
      overlay(sim,ctx,LH,k){dvB(ctx,k,LH,[['Nondisjunction of pair 1 in meiosis I',{s:14,w:800}],['Chromosomes per gamete: '+dvN(sim),{w:800,c:CE_RED}],['n + 1 and n − 1: every gamete is abnormal']]);} }
  ],
  useIt: [
    { do: 'Clean a scrape, then keep it moist and covered while it heals.',
      why: 'New skin comes from mitosis at the wound edges. The American Academy of Dermatology advises petroleum jelly and a bandage, because a moist wound heals faster than one that dries into a hard scab.' },
    { do: 'Aim for 8 to 10 hours of sleep while you are still growing.',
      why: 'The CDC recommends 8–10 hours for teens. Much of your growth hormone is released in deep sleep, and it signals cells in your growth plates to divide.' },
    { do: 'If you ever plan a pregnancy, know that screening for chromosome-number changes is offered to every patient.', lvl: 'ap',
      why: 'Nondisjunction can happen in any pregnancy, though the risk climbs with the egg’s age. The American College of Obstetricians and Gynecologists recommends offering this screening to all pregnant patients, not only older ones.' }
  ],
  tryIt: [
    { title: 'the pipe-cleaner chromosomes (15 minutes)',
      steps: ['Cut 4 pipe cleaners or pieces of string: a long and a short in one color (mom), a long and a short in another (dad).', 'Copy the DNA: make a matching twin for each one and twist each pair together at the middle.', 'Mitosis: line all four doubled chromosomes up in a row, then untwist and pull the twins to opposite sides.', 'Meiosis: start over. Pair long with long and short with short, pull the partners apart, then split the twins in each half.'],
      look: 'Mitosis leaves two piles that match the starting set. Meiosis leaves four piles with one long and one short each. Flip a coin for how each pair lines up and you get different color mixes.' }
  ]
},
cellcycle: {
  goals: {
    bio: ['The four phases of the cell cycle and how long each takes', 'What tells a cell to divide and what tells it to stop', 'How p53 protects you when DNA is damaged', 'Why cancer usually takes more than one broken rule'],
    honors: ['G1, S, G2 and M, and the checkpoints between them', 'Growth factors, G0 and contact inhibition', 'p53: arrest, repair or apoptosis', 'Oncogenes (a stuck gas pedal) vs. tumor suppressors (broken brakes)'],
    ap: ['Checkpoints at G1 and G2 and what each one checks', 'Why the share of cells in a phase matches its length', 'p53, arrest and apoptosis', 'The multi-hit model of cancer']
  },
  matters: 'Your skin replaces its outer layer about once a month, and a cut knows when to stop filling in. The same rules explain why a sunburn peels, why sunscreen lowers skin cancer risk, and why cancer is more common as people get older.',
  startKey: 'grow', startRun: true, startSpeed: 0.5,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Each circle is one skin cell, about 20 µm across',400,38,k,{s:12,hi:true});line(ctx,400,52,400,110);
    tag(ctx,'The center color shows its phase (key below)',400,405,k,{s:12,hi:true});},
  steps: [
    { key: 'phases', title: 'Four phases, one cycle', fresh: true, speed: 0.5, run(sim){ccFF(sim,30);},
      see: 'The center color shows each cell’s phase. Most cells are green (G1) or blue (S). You rarely catch one dividing.',
      why: 'A full cycle takes about 23 hours, and mitosis is only about 1 of them. At any moment, the share of cells in a phase matches the share of time that phase takes.',
      so: { ap: 'That is the idea behind the mitotic index: about 1 h out of 23 means only about 4% of cycling cells are in M at once.' },
      overlay(sim,ctx,LH,k){ccL(ctx,k,[['One cycle ≈ 23 h',{s:14,w:800}],['G1 grow: ~10 h',{c:'#1b7a3a'}],['S copy DNA: ~8 h',{c:CE_BLUE}],['G2 check, get ready: ~4 h',{c:'#6a3fa0'}],['M divide: ~1 h',{w:800}],['Right now: G1 '+ccPct(sim,'G1')+'%, S '+ccPct(sim,'S')+'%, G2 '+ccPct(sim,'G2')+'%, M '+ccPct(sim,'M')+'%',{s:12}]]);} },
    { key: 'fill', title: 'Fill the space, then stop', fresh: true, speed: 4, run(sim){ccFF(sim,150);},
      see: 'Jump ahead to 150 hours and watch the last gaps fill. As each cell runs out of room it turns grey and stops, and the share still dividing falls toward the edge cells only.',
      why: { bio: 'Normal cells stop dividing when they touch neighbors on every side. That is how a healing cut knows when the gap is filled.', honors: 'Crowded cells fail the G1 checkpoint and rest in G0. This <b>contact inhibition</b> is how a healing cut knows when to stop.' },
      overlay(sim,ctx,LH,k){const full=phM(sim,'cells')>=138;ccL(ctx,k,[['At '+ccHrs(sim),{s:14,w:800}],['Cells: '+Math.round(phM(sim,'cells'))+' (room for 144)'],['Still dividing: '+Math.round(phM(sim,'cyc'))+'%',{w:800}],[full?'Out of room, so most rest':'Filling the last gaps…',{s:12}]]);} },
    { key: 'nogf', title: 'No signal, no division', fresh: true, speed: 1, run(sim){ccFF(sim,30);sim._ccOff=null;},
      see: 'A small patch growing normally. After a moment the growth factor is switched off. Watch each cell finish the cycle it was in, then turn grey and rest, even with plenty of room around it.',
      why: { bio: 'Cells divide only when their neighbors send a “divide” signal. Without it, they stop.', honors: 'Without growth factor, cells fail the G1 checkpoint (the restriction point) and enter G0. Cells already past it, in S or G2, finish first.' },
      overlay(sim,ctx,LH,k,tau){if(tau>1.5&&sim.p.gf){BioLab.setValues(sim,{gf:false});sim._ccOff=sim.t;}const off=!sim.p.gf;ccL(ctx,k,[[off?'Signal off at '+Math.round(sim._ccOff||30)+' h':'Growth factor on',{s:14,w:800,c:off?CE_RED:CE_GREEN}],['Now: '+ccHrs(sim)],['Cells: '+Math.round(phM(sim,'cells'))],['Still dividing: '+Math.round(phM(sim,'cyc'))+'%',{w:800}]]);} },
    { key: 'uv', title: 'UV damage: p53 steps in', set: { uv: 0 }, fresh: true, speed: 1.5, run(sim){ccFF(sim,60);},
      see: 'A healthy patch with no UV. After a moment strong UV switches on. Watch damaged cells (yellow bolt) get stopped (orange) while they repair; badly damaged ones self-destruct. Mutations stay at 0%.',
      why: 'The p53 protein checks the DNA before it is copied and again before division. It pauses a damaged cell so it can repair, or makes it self-destruct, so the damage is never passed on.',
      overlay(sim,ctx,LH,k,tau){if(tau>1.5&&sim.p.uv===0)BioLab.setValues(sim,{uv:8});const on=sim.p.uv>0;ccL(ctx,k,[[on?'Strong UV on, p53 working':'No UV yet',{s:14,w:800}],['Now: '+ccHrs(sim)],['Held for repair now: '+sim.st.cells.filter(c=>c.ph==='ARR').length],['Cells with mutations: '+Math.round(phM(sim,'mut'))+'%',{w:800,c:CE_GREEN}],['Self-destructed: '+Math.round(phM(sim,'apop'))]]);} },
    { key: 'nop53', title: 'Broken guard: mutations pile up', set: { uv: 8 }, fresh: true, speed: 3, run(sim){ccFF(sim,40);sim._ccOff=null;},
      see: 'Strong UV with p53 working, so mutations are at 0%. After a moment p53 breaks. Watch damaged cells keep dividing and hand the damage to both daughters: amber cells spread, then dark red cells pile up in layers.',
      why: 'Without the checkpoint, damage becomes a permanent mutation. In this model one mutation lets a cell divide without a signal; a second lets it ignore crowding, so those cells stack into a tumor.',
      overlay(sim,ctx,LH,k,tau){if(tau>1.5&&sim.p.p53){BioLab.setValues(sim,{p53:false});sim._ccOff=sim.t;}const br=!sim.p.p53;ccL(ctx,k,[[br?'p53 broke at '+Math.round(sim._ccOff||40)+' h':'UV 8, p53 working',{s:14,w:800,c:br?CE_RED:CE_GREEN}],['Now: '+ccHrs(sim)],['Cells with mutations: '+Math.round(phM(sim,'mut'))+'%',{w:800,c:CE_RED}],['2+ mutations: '+Math.round(phM(sim,'cancer'))],['Cells: '+Math.round(phM(sim,'cells'))]]);} },
    { key: 'ras', lvl: 'honors', title: 'A stuck gas pedal', set: { gf: false }, fresh: true, speed: 1, run(sim){ccFF(sim,30);},
      see: 'Growth factor has been off for 30 hours, so the cells are resting (grey). After a moment Ras gets stuck on. Watch the resting cells start dividing again as if the signal never stopped, until they run out of room.',
      why: 'Ras passes the growth signal along inside the cell. A mutation that locks it on turns it into an <b>oncogene</b>, a stuck gas pedal. p53 is a <b>tumor suppressor</b>; losing it is like losing the brakes.',
      overlay(sim,ctx,LH,k,tau){if(tau>1.5&&!sim.p.ras)BioLab.setValues(sim,{ras:true});ccL(ctx,k,[[sim.p.ras?'Ras stuck on, still no growth factor':'No growth factor, cells resting',{s:14,w:800}],['Now: '+ccHrs(sim)],['Still dividing: '+Math.round(phM(sim,'cyc'))+'%',{w:800}],['Cells: '+Math.round(phM(sim,'cells'))]]);} },
    { key: 'hits', lvl: 'ap', title: 'Cancer takes several hits', set: { uv: 8, p53: false }, fresh: true, speed: 3, run(sim){ccFF(sim,60);},
      see: 'p53 broken and strong UV, about 60 hours in. Many cells already have one mutation, but only a few have two. Keep watching as the two-hit cells take over.',
      why: 'Each mutation is rare, and one cell line has to collect several before it escapes every control. That takes many divisions, which is why cancer risk climbs steeply with age.',
      overlay(sim,ctx,LH,k){const n=Math.max(1,phM(sim,'cells')),c=phM(sim,'cancer'),m=phM(sim,'mut');ccL(ctx,k,[['Multi-hit, at '+ccHrs(sim),{s:14,w:800}],['1 mutation: '+Math.round(m-100*c/n)+'% of cells'],['2+ mutations: '+Math.round(c)+' cells',{w:800,c:CE_RED}],['Piled on top: '+Math.round(phM(sim,'pile'))]]);} }
  ],
  useIt: [
    { do: 'Use sunscreen of SPF 30 or higher outdoors and reapply about every 2 hours.',
      why: 'The American Academy of Dermatology recommends SPF 30+, reapplied every 2 hours or after swimming. Less UV means fewer damaged cells for p53 to catch, and fewer that slip through.' },
    { do: 'Check your moles with the ABCDEs, and show a doctor one that is changing.',
      why: 'Asymmetry, Border, Color, Diameter and Evolving are the AAD’s warning signs for melanoma. A mole that grows or changes can mean cells there have stopped following the rules you just watched.' },
    { do: 'Skip tanning beds.', lvl: 'honors',
      why: 'The World Health Organization’s cancer agency (IARC) puts UV tanning devices in its highest-risk group, the same group as tobacco. They deliver DNA-damaging UV on purpose.' }
  ],
  tryIt: [
    { title: 'the UV bead test (10 minutes, on a sunny day)',
      steps: ['Get UV-sensitive beads (they are white indoors and turn colors in sunlight).', 'Put a few beads in each of 3 clear plastic bags.', 'Smear sunscreen on the outside of one bag, and leave one bag plain. Keep the third indoors.', 'Set the two outdoor bags in the sun for 1 minute and compare the colors.'],
      look: 'Beads behind sunscreen stay much paler, because the sunscreen absorbs most of the UV. Try it on a cloudy day too: UV gets through clouds.' }
  ]
},
roottip: {
  goals: {
    bio: ['Where in a root the cells divide', 'How to spot interphase and each phase of mitosis in a real microscope view', 'How to calculate the mitotic index', 'How to turn cell counts into the time each phase takes'],
    honors: ['The zones of a root tip and what happens in each', 'How to identify each phase of mitosis in stained cells', 'Mitotic index, and why it is highest in the meristem', 'Turning counts into phase durations'],
    ap: ['How to identify each phase in stained cells', 'Mitotic index and phase durations from counts', 'How colchicine blocks the spindle and piles cells up in metaphase', 'Testing the difference with chi-square']
  },
  matters: 'This is a real lab done with microscopes in classrooms everywhere. The counting trick lets scientists time things they can’t watch happen, and pathologists use a tumor’s mitotic count to help grade some cancers.',
  startKey: 'tip', startRun: false,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Cells divide here',230,205,k,{s:12,hi:true});line(ctx,215,219,152,292,'#c8102e');},
  steps: [
    { key: 'inter', title: 'Interphase: most cells', fresh: true, pause: true, run: rtSel('inter'), focus: rtRect('inter'),
      see: 'The highlighted cell has a round nucleus with a dark spot (the nucleolus) and no separate chromosomes. Most cells in the field look like this.',
      why: 'In interphase the cell is growing and copying its DNA. The DNA is spread out so its genes can be read, so you can’t see individual chromosomes.',
      overlay: rtPh('Interphase', 'Round nucleus, dark nucleolus, grainy DNA, no threads') },
    { key: 'pro', title: 'Prophase', fresh: true, pause: true, run: rtSel('pro'), focus: rtRect('pro'),
      see: 'The DNA has coiled into thick, tangled threads that fill the nucleus.',
      why: 'Coiling packs the copied DNA into chromosomes that can be moved. The nucleus is starting to break down.',
      overlay: rtPh('Prophase', 'Thick, thread-like chromosomes filling the nucleus') },
    { key: 'meta', title: 'Metaphase', fresh: true, pause: true, run: rtSel('meta'), focus: rtRect('meta'),
      see: 'The chromosomes form one dark band across the middle of the cell.',
      why: 'Spindle fibers from both ends have lined every chromosome up on the center line.',
      overlay: rtPh('Metaphase', 'One band of chromosomes across the middle') },
    { key: 'ana', title: 'Anaphase', fresh: true, pause: true, run: rtSel('ana'), focus: rtRect('ana'),
      see: 'Two groups of chromosomes are moving apart toward opposite ends, often bent into V shapes.',
      why: 'The copies are being pulled toward the poles at their middles, so the arms trail behind.',
      overlay: rtPh('Anaphase', 'Two groups pulling apart, often V-shaped') },
    { key: 'telo', title: 'Telophase', fresh: true, pause: true, run: rtSel('telo'), focus: rtRect('telo'),
      see: 'Two dense clumps of chromosomes sit at opposite ends, with a faint line, the new cell plate, between them.',
      why: 'New nuclei form at each end, and the plant cell builds a new wall down the middle. Soon there will be two cells.',
      overlay: rtPh('Telophase', 'Two dark clumps at the ends, a cell plate between') },
    { key: 'count', title: 'Count a few hundred cells', fresh: true, speed: 1, run(sim){rtCount(sim,8);},
      see: 'The sim labels every cell in 8 fields of view, about 320 cells, and adds up the phases.',
      why: 'One field holds only about 40 cells, too few to trust. Counting several fields evens out chance, the way a poll needs to ask many people.',
      overlay(sim,ctx,LH,k){const {t,n}=rtT(sim),p=x=>n?(100*x/n).toFixed(1)+'%':'–';rtL(ctx,k,[['Counted: '+n+' cells',{s:15,w:800}],['Interphase: '+t.inter+' ('+p(t.inter)+')'],['Prophase: '+t.pro],['Metaphase: '+t.meta],['Anaphase: '+t.ana],['Telophase: '+t.telo],['Mitotic index: '+p(n-t.inter),{w:800,c:CE_GREEN}],['= dividing cells ÷ all cells',{s:12}]]);} },
    { key: 'time', title: 'From counts to time', fresh: true, speed: 1, run(sim){rtCount(sim,8);},
      see: 'Same counts. The share of cells caught in metaphase is the share of the day a cell spends in metaphase.',
      why: 'The cells are dividing at random times, so a snapshot works like a time log. Fraction in a phase × length of the cycle (about 24 h for onion roots) = time in that phase.',
      overlay(sim,ctx,LH,k){const {t,n}=rtT(sim),f=n?t.meta/n:0,mi=n?(n-t.inter)/n:0;rtL(ctx,k,[['Metaphase',{s:15,w:800}],[t.meta+' ÷ '+n+' = '+(100*f).toFixed(1)+'% of cells'],[(100*f).toFixed(1)+'% × 24 h ≈ '+Math.round(f*24*60)+' min',{w:800,c:CE_GREEN}],['All of mitosis',{s:15,w:800}],[(100*mi).toFixed(1)+'% × 24 h ≈ '+(mi*24).toFixed(1)+' h',{w:800}]]);} },
    { key: 'elong', lvl: 'honors', title: 'The elongation zone barely divides', set: { zone: 'elong' }, fresh: true, speed: 1, run(sim){rtCount(sim,8);},
      see: 'The slide moves up the root to the elongation zone. Count the same way: almost every cell is in interphase.',
      why: 'These cells were made in the meristem and now stretch instead of dividing. Their stretching is what pushes the root tip down through the soil.',
      overlay(sim,ctx,LH,k){const {t,n}=rtT(sim);rtL(ctx,k,[['Elongation zone',{s:15,w:800}],['Counted: '+n],['Mitotic index: '+(n?(100*(n-t.inter)/n).toFixed(1):'–')+'%',{w:800,c:CE_GREEN}],['Meristem: about 20%',{s:12}]]);} },
    { key: 'colch', lvl: 'ap', title: 'Colchicine: stuck in metaphase', set: { treat: 'colch' }, fresh: true, speed: 1, run(sim){rtCount(sim,8);},
      see: 'This root soaked in colchicine. Count it: far more cells are in metaphase, and few reach anaphase or telophase.',
      why: 'Colchicine blocks the spindle fibers, so cells can line up but can’t pull apart. They pile up in metaphase. The mitotic index rises without any cell dividing faster.',
      overlay(sim,ctx,LH,k){const {t,n}=rtT(sim),x=phM(sim,'chi');rtL(ctx,k,[['Colchicine-treated',{s:15,w:800}],['Metaphase: '+(n?(100*t.meta/n).toFixed(1):'–')+'% (untreated: about 4%)',{w:800}],['Anaphase + telophase: '+(n?(100*(t.ana+t.telo)/n).toFixed(1):'–')+'%'],['χ² vs. control: '+(isNaN(x)?'–':x.toFixed(1)),{w:800,c:CE_RED}],['Critical value 9.49 (df 4, p = 0.05)',{s:12}]]);} }
  ],
  useIt: [
    { do: 'When you repot a plant, handle the root tips gently and don’t trim them unless they are rotten.',
      why: 'A root grows only from its tip, where the meristem is dividing. A crushed tip has to be replaced before that root can grow longer.' },
    { do: 'Use the snapshot trick to time anything that repeats: glance at a group at a random moment and count.',
      why: 'If 5 of the 20 cars you see at a light are turning left, about a quarter of cars turn left. Many glances at random times tell you how time is shared, just like the cell counts.' },
    { do: 'Take colchicine (a gout medicine) only exactly as prescribed.', lvl: 'ap',
      why: 'It works by blocking spindle fibers, the same effect you saw. A small overdose also stops division in fast-dividing tissues like the gut lining, which is why the safe dose range is narrow.' }
  ],
  tryIt: [
    { title: 'where does a root grow? (one week)',
      steps: ['Push 3 toothpicks into an onion so it sits on a glass of water with just its base in the water.', 'Wait 3 to 5 days for roots about 2 cm long.', 'With a fine permanent marker, put dots every 2 mm along one root, starting at the tip.', 'Check the next day and the day after. Measure the gaps between the dots.'],
      look: 'Only the gaps just behind the tip spread apart. The dots farther up stay put, because new cells are made at the tip and stretch just behind it.' }
  ]
}
});


/* ===== Genetics: crosses, bloodtype, karyotype ===== */
/* run an action once, partway through a step, so the cause is seen happening */
const atT=(sim,tau,t,key,fn)=>{sim._at=sim._at||{};const k=(sim.lnKey||'')+':'+key;if(tau>=t&&!sim._at[k]){sim._at[k]=1;fn(sim);}};
const atReset=sim=>{sim._at={};};
const gnRing=(ctx,x,y,r,tau)=>{const a=0.5+0.5*Math.sin(tau*6);ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=3;ctx.globalAlpha=0.45+0.55*a;ctx.beginPath();ctx.arc(x,y,r+3*a,0,6.29);ctx.stroke();ctx.restore();};
const crR=(ctx,k,L,LH)=>dcCard(ctx,k,362,(LH||450)-12,424,L,{up:true});
const crObs=sim=>String(phM(sim,'observed')||'');
/* blood typing: four fixed patients so every student sees the same cases */
const BT_P=[{abo:['A','i'],rh:['D','d']},{abo:['i','i'],rh:['d','d']},{abo:['A','B'],rh:['D','D']},{abo:['B','i'],rh:['D','d']}];
const btSet=sim=>{BT_P.forEach((p,i)=>{sim.st.pat[i]={abo:p.abo.slice(),rh:p.rh.slice()};});sim.st.tests={};sim.st.lastWell=null;atReset(sim);};
const btAdd=(sim,ids)=>ids.forEach(id=>dvAct(sim,{A:'a',B:'b',Rh:'rh'}[id]));
const btC=(ctx,k,L,LH)=>dcCard(ctx,k,196,(LH||450)-28,400,L,{up:true});
const btR=(sim,id)=>String(phM(sim,{A:'ra',B:'rb',Rh:'rr'}[id]));
const btType=sim=>{const a=btR(sim,'A'),b=btR(sim,'B'),r=btR(sim,'Rh');if([a,b,r].some(x=>x!=='Clumps'&&x!=='No clumping'))return null;
  return (a==='Clumps'&&b==='Clumps'?'AB':a==='Clumps'?'A':b==='Clumps'?'B':'O')+(r==='Clumps'?'+':'−');};
const btWell={A:[296,250],B:[396,250],Rh:[496,250]};
/* karyotype */
const kyCase=(sim,code,sex)=>{sim._k={code,ver:1,sex21:sex||'M'};BioLab.reset(sim);sim.st.sel=-1;atReset(sim);};
const kyC=(ctx,k,L,y)=>dcCard(ctx,k,16,y,372,L);
const kyCh=(sim,n)=>sim.st.chs.filter(c=>c.n===n);

BioLab.addLearn({
crosses: {
  goals: {
    bio: ['Genes come in versions called alleles, and you inherit one from each parent', 'Why a hidden (recessive) trait can skip a generation', 'How a Punnett square predicts offspring, and why real counts wander', 'How one test cross reveals a hidden allele'],
    honors: ['Genotype vs. phenotype, dominant vs. recessive', 'Monohybrid, dihybrid (9:3:3:1) and test crosses', 'Incomplete dominance and X-linked traits', 'Why small samples stray from the expected ratio'],
    ap: ['Segregation and independent assortment', 'Chi-square: is the difference just chance?', 'Linked genes and map distance from recombinants', 'X-linked inheritance']
  },
  matters: 'The same rules decide whether two parents who carry cystic fibrosis have a child with it, why a hybrid tomato’s seeds don’t grow true, and how breeders and genetic counselors predict traits.',
  startKey: 'start', startRun: false,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Two parent plants',178,22,k,{s:12,hi:true});tag(ctx,'Every child the parents could have',560,300,k,{s:12,hi:true});line(ctx,452,300,330,300);},
  steps: [
    { key: 'alleles', title: 'Two copies of every gene', fresh: true, pause: true, focus: [10,8,334,132],
      see: 'Both parents are purple pea plants with the genotype Pp. Each has two copies, or alleles, of the flower-color gene: one P and one p.',
      why: { bio: 'P makes purple pigment and p doesn’t. One P is enough to make the flower purple, so P is <b>dominant</b>. The white allele p is <b>recessive</b>: it shows only when a plant has two.', honors: '<b>Genotype</b> is the pair of alleles (Pp); <b>phenotype</b> is what you see (purple). A heterozygote shows the dominant phenotype.' },
      overlay(sim,ctx,LH,k){crR(ctx,k,[['Genotype: Pp (the alleles)',{s:14,w:800}],['Phenotype: purple (what you see)'],['One P is enough: P is dominant, p recessive',{c:CE_BLUE}]],LH);} },
    { key: 'gametes', title: 'Each gamete gets one allele', fresh: true, pause: true, focus: [[24,150,46,288],[24,150,312,34]],
      see: 'The circles along the edges are the gametes: pollen from one parent and egg cells from the other. Each holds just one allele.',
      why: 'Meiosis separates the two alleles, so half of a Pp plant’s gametes carry P and half carry p. That 50–50 split is Mendel’s law of segregation.',
      overlay(sim,ctx,LH,k){crR(ctx,k,[['Pp parent → gametes',{s:14,w:800}],['½ carry P, ½ carry p'],['Which one a child gets is a coin flip',{c:CE_BLUE}]],LH);} },
    { key: 'square', title: 'The Punnett square', fresh: true, pause: true, focus: [70,184,266,254],
      see: 'Each box pairs one gamete from each parent, and all four boxes are equally likely: 1 PP, 2 Pp, 1 pp.',
      why: 'Three of the four boxes have at least one P, so 3 of every 4 children are expected to be purple and 1 white. A white child (pp) can come from two purple parents, because both hid a p.',
      overlay(sim,ctx,LH,k){crR(ctx,k,[['Expected children',{s:14,w:800}],['PP ¼   Pp ½   pp ¼'],['Purple ¾ : white ¼, a 3 : 1 ratio',{w:800,c:CE_GREEN}]],LH);} },
    { key: 'one', title: 'One child at a time', fresh: true, speed: 0.12, run(sim){dvAct(sim,'breed20');}, focus: [[24,150,312,288],[352,8,440,434]],
      see: 'Slowed way down. Watch the highlighted box: one gamete from each parent meets, and the new plant appears on the right.',
      why: 'Each child is a separate coin flip from each parent. The square gives the odds for every child; it doesn’t promise how the next few will turn out.',
      overlay(sim,ctx,LH,k){crR(ctx,k,[['So far: '+crObs(sim),{s:13,w:700}],['Each child: ¾ chance purple, ¼ white']],LH);} },
    { key: 'many', title: 'More children, closer to 3 : 1', fresh: true, speed: 1, run(sim){dvAct(sim,'breed100');},
      see: 'Now 100 children. The counts settle near 75 purple and 25 white, but rarely exactly.',
      why: 'Random results even out as the sample grows, like flipping a coin 4 times versus 100 times. A family with 4 children can easily have no white ones, or two.',
      overlay(sim,ctx,LH,k){crR(ctx,k,[['Observed: '+crObs(sim),{s:13,w:700}],['Expected: 75 purple, 25 white',{c:CE_GREEN}]],LH);} },
    { key: 'test', title: 'The test cross', set: { p2m: 'pp' }, fresh: true, speed: 0.5, cause: { from: { p2m: 'Pp' }, delay: 1.5, label: 'Parent 2' }, run: atReset,
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,4.5,'b',s=>dvAct(s,'breed20'));const done=sim.p.p2m==='pp';
        crR(ctx,k,[[done?'Purple plant × white plant':'Watch parent 2…',{s:14,w:800}],[done?'Square: 2 Pp : 2 pp → 1 purple : 1 white':'Pp × Pp gives 3 : 1'],[sim.st.n?'Observed: '+crObs(sim):'Breeding starts in a moment',{c:CE_BLUE}]],LH);},
      see: 'Parent 2 switches from a purple Pp plant to a white pp plant. Watch the bottom row of the square turn white, then 20 children appear: about half white.',
      why: 'A white parent can only give p. So every child gets its other allele from the purple parent: P makes it purple, p makes it white. Any white child proves the purple parent was hiding a p.',
      so: 'Breeders use this test cross to find out whether a plant or animal is purebred (PP) before they breed from it.' },
    { key: 'di', lvl: 'honors', title: 'Two genes: 9 : 3 : 3 : 1', set: { mode: 'di', p1d: 'YyRr', p2d: 'YyRr' }, fresh: true, speed: 1, run(sim){dvAct(sim,'breed100');},
      see: 'Two genes at once: seed color (Y yellow, y green) and shape (R round, r wrinkled). Each parent is YyRr. The square has 16 boxes.',
      why: 'The two genes are on different chromosomes, so they sort independently in meiosis: each parent makes YR, Yr, yR and yr gametes equally. The result is 9 yellow round : 3 yellow wrinkled : 3 green round : 1 green wrinkled.',
      overlay(sim,ctx,LH,k){crR(ctx,k,[['YyRr × YyRr',{s:14,w:800}],['Expected 9 : 3 : 3 : 1'],['Observed: '+crObs(sim),{c:CE_BLUE,s:12}]],LH);} },
    { key: 'snap', lvl: 'honors', title: 'Incomplete dominance', set: { mode: 'incomplete', p1i: 'RW', p2i: 'RW' }, fresh: true, speed: 1, run(sim){dvAct(sim,'breed100');},
      see: 'Snapdragons: red × white parents give pink children. Here two pink plants are crossed.',
      why: 'Neither allele hides the other: one red allele makes only half the pigment, so the flower is pink. The ratio becomes 1 red : 2 pink : 1 white, so phenotype matches genotype exactly.',
      overlay(sim,ctx,LH,k){crR(ctx,k,[['Pink × pink',{s:14,w:800}],['Expected 1 red : 2 pink : 1 white'],['Observed: '+crObs(sim),{c:CE_BLUE,s:12}]],LH);} },
    { key: 'x', lvl: 'honors', title: 'An X-linked gene', set: { mode: 'xlinked', mom: 'XRXr', dad: 'XRY' }, fresh: true, speed: 1, run(sim){dvAct(sim,'breed100');},
      see: 'Fruit flies. The eye-color gene is on the X chromosome. The mother is a carrier (XᴿXʳ) and the father has red eyes (XᴿY). All the daughters have red eyes; about half the sons have white eyes.',
      why: 'Sons get their only X from their mother and a Y from their father. If that X carries r, nothing can hide it. Daughters always get the father’s Xᴿ, so at worst they are carriers.',
      so: 'This is why red-green color blindness is far more common in boys: about 1 in 12 men of Northern European descent, compared with about 1 in 200 women.',
      overlay(sim,ctx,LH,k){crR(ctx,k,[['XᴿXʳ × XᴿY',{s:14,w:800}],['Daughters: all red. Sons: ½ white'],['Observed: '+crObs(sim),{c:CE_BLUE,s:12}]],LH);} },
    { key: 'chi', lvl: 'ap', title: 'Is the difference just chance?', fresh: true, speed: 1, run(sim){dvAct(sim,'breed20');},
      see: 'Pp × Pp with only 20 children. The counts are off from 15 : 5. Chi-square tests whether that gap is bigger than chance usually makes.',
      why: 'χ² = Σ (O − E)² ÷ E over the phenotypes. With 2 phenotypes there is 1 degree of freedom, critical value 3.84 at p = 0.05. Below it, the data fit the 3 : 1 hypothesis.',
      overlay(sim,ctx,LH,k){crR(ctx,k,[['Observed: '+crObs(sim),{s:13,w:700}],[String(phM(sim,'decision')),{s:12,c:CE_BLUE}]],LH);} },
    { key: 'linked', lvl: 'ap', title: 'Linked genes', set: { mode: 'linked', rf: 5 }, fresh: true, speed: 1, cause: { from: { rf: 50 }, delay: 1, dur: 3, label: 'Distance between genes' }, run: atReset,
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,4.6,'b',s=>dvAct(s,'breed100'));const r=phM(sim,'rfObs');crR(ctx,k,[['Distance: '+Math.round(sim.p.rf)+' map units',{s:14,w:800}],['Recombinant children: '+(isNaN(r)?'breeding soon…':r.toFixed(1)+'%'),{w:800,c:CE_BLUE}],['50 map units acts like unlinked genes',{s:12}]],LH);},
      see: 'Two genes on the same chromosome. Watch the distance between them shrink from 50 to 5 map units, then breed 100 test-cross children.',
      why: 'Genes close together are rarely separated by crossing over, so they are inherited together. The percent of recombinant children estimates the distance: 1 map unit = 1% recombinants.' }
  ],
  useIt: [
    { do: 'Learn your family health history before you need it.',
      why: 'Recessive conditions like cystic fibrosis appear when two carrier parents each pass on the allele: a 1 in 4 chance for each child, the same as the Pp × Pp square. Doctors use family history to decide who to offer carrier testing.' },
    { do: 'If you save seeds from a hybrid tomato or squash, expect the plants to look different from the parent.',
      why: 'Hybrid (F1) plants are heterozygous for many genes. Their seeds segregate like a Pp × Pp cross, so the next generation is a mix.' },
    { do: 'When a study reports a ratio from a small sample, be skeptical.', lvl: 'ap',
      why: 'As the 20-child cross showed, small samples stray far from the expected ratio. Chi-square tells you whether a difference is bigger than chance usually makes.' }
  ],
  tryIt: [
    { title: 'the coin Punnett square (10 minutes)',
      steps: ['Take two coins. Heads is P and tails is p; each coin is one Pp parent.', 'Flip both coins together 40 times. Each flip is one child: two heads PP, one of each Pp, two tails pp.', 'Tally the three genotypes and the purple (PP or Pp) versus white (pp) children.'],
      look: 'Expect about 10 PP, 20 Pp and 10 pp, and about 30 purple to 10 white, but almost never exactly. Pool the class’s flips and the totals get closer.' }
  ]
},
bloodtype: {
  goals: {
    bio: ['What blood types are: proteins (antigens) on red blood cells', 'How antibodies make cells clump, and how a lab reads that to find a type', 'Why the wrong blood type in a transfusion is dangerous'],
    honors: ['A, B and Rh antigens and their antibodies', 'Multiple alleles and codominance: Iᴬ, Iᴮ and i', 'Using blood types to test a family relationship'],
    ap: ['Agglutination as antibody–antigen binding', 'Codominance and multiple alleles', 'Estimating ABO allele frequencies from a population sample']
  },
  matters: 'Every transfusion, organ transplant and pregnancy check relies on blood typing. Getting it wrong can cause a deadly reaction, which is why labs test every unit of blood before it is given.',
  startKey: 'start', startRun: false,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Blood from four patients',122,40,k,{s:12,hi:true});tag(ctx,'Close-up of red blood cells',684,108,k,{s:12,hi:true});},
  steps: [
    { key: 'antiA', title: 'Add anti-A serum', fresh: true, speed: 1, run: btSet, focus: [[248,202,96,96],[578,124,212,212]],
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.2,'a',s=>btAdd(s,['A']));if(tau<1.2)gnRing(ctx,btWell.A[0],btWell.A[1],44,tau);btC(ctx,k,[[tau<1.2?'Watch the anti-A well…':'Anti-A: '+btR(sim,'A'),{s:14,w:800}],['Anti-A antibodies stick to A antigens',{s:12}]],LH);},
      see: 'Patient 1’s blood goes in the left well, then a drop of anti-A serum. Within seconds the smooth red drop turns grainy: the cells clump.',
      why: 'Red blood cells carry marker proteins (antigens) on their surface. Anti-A serum holds antibodies that grab only the A antigen. These cells have A antigens, so the antibodies stick to them.' },
    { key: 'bridges', title: 'What the clumps are', fresh: true, speed: 1, run(sim){btSet(sim);btAdd(sim,['A']);}, focus: [578,124,212,212],
      see: 'In the close-up, the Y-shaped antibodies (blue) each hold onto two cells at once.',
      why: 'Each antibody has two arms, so it can bridge two cells. Millions of bridges tie the cells into clumps you can see without a microscope. This clumping is called <b>agglutination</b>.',
      overlay(sim,ctx,LH,k){btC(ctx,k,[['One antibody, two arms, two cells',{s:14,w:800}],['Millions of bridges → visible clumps']],LH);} },
    { key: 'antiB', title: 'Add anti-B serum', fresh: true, speed: 1, run(sim){btSet(sim);btAdd(sim,['A']);}, focus: [[348,202,96,96],[578,124,212,212]],
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.2,'b',s=>btAdd(s,['B']));if(tau<1.2)gnRing(ctx,btWell.B[0],btWell.B[1],44,tau);btC(ctx,k,[[tau<1.2?'Watch the anti-B well…':'Anti-B: '+btR(sim,'B'),{s:14,w:800}],['No B antigens, nothing to grab',{s:12}]],LH);},
      see: 'Now anti-B goes in the middle well. This drop stays smooth.',
      why: 'These cells have no B antigens, so the anti-B antibodies have nothing to hold. No bridges, no clumps.' },
    { key: 'antiRh', title: 'Add anti-Rh serum', fresh: true, speed: 1, run(sim){btSet(sim);btAdd(sim,['A','B']);}, focus: [[448,202,96,96],[578,124,212,212]],
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.2,'r',s=>btAdd(s,['Rh']));if(tau<1.2)gnRing(ctx,btWell.Rh[0],btWell.Rh[1],44,tau);const t=btType(sim);btC(ctx,k,[[tau<1.2?'Watch the anti-Rh well…':'Anti-Rh: '+btR(sim,'Rh'),{s:14,w:800}],[t?'A antigens, no B, Rh present → type '+t:'Reading the wells…',{w:800,c:CE_GREEN}]],LH);},
      see: 'Anti-Rh in the right well clumps too. Put the three wells together: A antigens, no B antigens, Rh antigen present.',
      why: 'The type names the antigens the cells carry: A, B, both (AB) or neither (O), plus Rh positive or negative. Patient 1 is <b>A positive</b>.' },
    { key: 'O', title: 'A patient with no antigens', set: { patient: 2 }, fresh: true, speed: 1, cause: { from: { patient: 1 }, delay: 1, dur: 0.6, label: 'Patient' }, run: btSet,
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,2.2,'a',s=>btAdd(s,['A']));atT(sim,tau,3,'b',s=>btAdd(s,['B']));atT(sim,tau,3.8,'r',s=>btAdd(s,['Rh']));const t=btType(sim);
        btC(ctx,k,[['Patient 2',{s:14,w:800}],['Anti-A: '+btR(sim,'A')+' · Anti-B: '+btR(sim,'B')+' · Anti-Rh: '+btR(sim,'Rh'),{s:12}],[t?'No antigens at all → type '+t:'Testing…',{w:800,c:CE_GREEN}]],LH);},
      see: 'Patient 2’s blood gets all three serums, one at a time. Nothing clumps.',
      why: 'No A, no B and no Rh antigens: type <b>O negative</b>. Because these cells carry none of the three antigens, the antibodies in almost anyone’s blood have nothing to attack.' },
    { key: 'AB', title: 'A patient with both', set: { patient: 3 }, fresh: true, speed: 1, cause: { from: { patient: 1 }, delay: 1, dur: 0.6, label: 'Patient' }, run: btSet,
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,2.2,'a',s=>btAdd(s,['A']));atT(sim,tau,3,'b',s=>btAdd(s,['B']));atT(sim,tau,3.8,'r',s=>btAdd(s,['Rh']));const t=btType(sim);
        btC(ctx,k,[['Patient 3',{s:14,w:800}],['Anti-A: '+btR(sim,'A')+' · Anti-B: '+btR(sim,'B')+' · Anti-Rh: '+btR(sim,'Rh'),{s:12}],[t?'A and B antigens, Rh present → type '+t:'Testing…',{w:800,c:CE_GREEN}]],LH);},
      see: 'Patient 3: all three wells clump.',
      why: 'These cells carry A and B antigens and the Rh antigen: type <b>AB positive</b>. Neither A nor B hides the other, so both show. That is called <b>codominance</b>.' },
    { key: 'transfuse', title: 'Who can give blood to whom', fresh: true, speed: 1, run(sim){btSet(sim);btAdd(sim,['A','B','Rh']);},
      see: 'Patient 1 (A+) needs blood. The card shows which donors are safe for red blood cells.',
      why: 'Your plasma holds antibodies against the A or B antigens you don’t have: a type A person carries anti-B. Given type B or AB cells, those antibodies would clump the donor cells inside the body. O-negative cells have none of the antigens, so in an emergency they can go to anyone.',
      overlay(sim,ctx,LH,k){btC(ctx,k,[['A+ can receive red cells from',{s:14,w:800}],['A+, A−, O+, O−',{w:800,c:CE_GREEN}],['Not B or AB: their B antigens would clump',{c:CE_RED,s:12}]],LH);} },
    { key: 'alleles', lvl: 'honors', title: 'Genotype from type', fresh: true, speed: 1, run(sim){btSet(sim);btAdd(sim,['A','B','Rh']);},
      see: 'Patient 1 is type A+. Which alleles could that be?',
      why: 'The ABO gene has three alleles: Iᴬ, Iᴮ and i. Iᴬ and Iᴮ are codominant; i is recessive. Type A could be IᴬIᴬ or Iᴬi, and Rh+ could be DD or Dd. Patient 1 here is Iᴬi Dd, so two type A+ parents like this could have a type O− child.',
      overlay(sim,ctx,LH,k){btC(ctx,k,[['Type A+ genotypes',{s:14,w:800}],['IᴬIᴬ or Iᴬi, and DD or Dd'],['Two Iᴬi Dd parents: ¼ × ¼ = 1/16 chance of O−',{c:CE_BLUE,s:12}]],LH);} },
    { key: 'pop', lvl: 'ap', title: 'Allele frequencies from a sample', set: { view: 'pop' }, fresh: true, speed: 1, run(sim){dvAct(sim,'pop');},
      see: 'A random sample of 100 people. Type O people must be ii.',
      why: 'Under Hardy–Weinberg, the share of type O equals r², where r is the frequency of i. So r = √(fraction type O). From r you can work out the other allele frequencies.',
      overlay(sim,ctx,LH,k){const o=phM(sim,'po'),r=phM(sim,'pi');btC(ctx,k,[['100 people sampled',{s:14,w:800}],['Type O: '+(isNaN(o)?'…':Math.round(o)+'%')],['i allele: r = √'+(isNaN(o)?'…':(o/100).toFixed(2))+' = '+(isNaN(r)?'…':r.toFixed(2)),{w:800,c:CE_BLUE}]],LH);} }
  ],
  useIt: [
    { do: 'Find out your blood type, for example the first time you donate blood (16 with a parent’s permission in Colorado).',
      why: 'Donation centers type every unit and tell you your type. It also helps: one donation can be split to help more than one patient.' },
    { do: 'If you are type O negative, know that hospitals ask for your blood often.',
      why: 'Only about 7% of people are O−, but their red cells can be given to anyone in an emergency before there is time to type the patient.' },
    { do: 'In a pregnancy where the parent is Rh negative, expect a shot of Rh immune globulin.', lvl: 'honors',
      why: 'If an Rh− mother carries an Rh+ baby, her body can make anti-Rh antibodies that attack a later Rh+ baby’s red cells. The shot prevents that.' }
  ],
  tryIt: [
    { title: 'the family blood-type puzzle (15 minutes)',
      steps: ['Ask family members if they know their blood types (donor cards and some medical records list them).', 'Write every genotype each person could have: type A is IᴬIᴬ or Iᴬi, type O is ii, and so on.', 'Use Punnett squares to check that each child’s type is possible from the parents’ genotypes.'],
      look: 'Every child’s type should be possible. If a parent is type O, that parent passed on an i, which narrows down the child’s genotype.' }
  ]
},
karyotype: {
  goals: {
    bio: ['What chromosomes look like in a dividing cell', 'How doctors match the pairs: size, centromere and bands', 'How a karyotype shows an extra or missing chromosome, like trisomy 21'],
    honors: ['Building a karyogram: size, centromere position, banding', 'Autosomes vs. sex chromosomes', 'Trisomies and sex-chromosome conditions from nondisjunction'],
    ap: ['Karyotype notation, like 47,XY,+21', 'Linking nondisjunction in meiosis to aneuploidy', 'Which aneuploidies are survivable, and why']
  },
  matters: 'Karyotypes are used in prenatal testing, in diagnosing some cancers and in fertility clinics. They are how doctors first confirmed that Down syndrome is caused by an extra chromosome 21.',
  startKey: 'start', startRun: false,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Chromosomes from one white blood cell, stained',400,36,k,{s:12,hi:true});tag(ctx,'Empty karyogram: one spot for each pair',400,300,k,{s:12,hi:true});},
  steps: [
    { key: 'spread', title: 'A metaphase spread', fresh: true, pause: true, run(sim){kyCase(sim,'T21','M');}, focus: [12,50,776,222],
      see: 'A lab grew some of the patient’s white blood cells, stopped them in metaphase, burst them on a slide and stained them. These are one cell’s chromosomes.',
      why: 'In metaphase each chromosome is coiled as tightly as it gets, so it is short, thick and easy to see. Each one is already copied: two sister chromatids joined at a pinch.',
      overlay(sim,ctx,LH,k){kyC(ctx,k,[['Count them later: is it 46?',{s:14,w:800}],['23 pairs: one of each pair from each parent']],300);} },
    { key: 'size', title: 'Clue 1: size', fresh: true, pause: true, run(sim){kyCase(sim,'T21','M');},
      overlay(sim,ctx,LH,k,tau){kyCh(sim,'1').concat(kyCh(sim,'21')).forEach(c=>gnRing(ctx,c.x,c.y,34,tau));kyC(ctx,k,[['Largest: chromosome 1',{s:14,w:800}],['Smallest: 21 and 22'],['Pairs are numbered by size',{c:CE_BLUE}]],300);},
      see: 'The circled chromosomes are a chromosome 1, the largest, and the 21s, among the smallest.',
      why: 'Chromosomes are numbered roughly from largest (1) to smallest (21 and 22). Size is the first clue for finding each one’s partner.' },
    { key: 'centro', title: 'Clue 2: the centromere', fresh: true, pause: true, run(sim){kyCase(sim,'T21','M');},
      overlay(sim,ctx,LH,k,tau){['1','4','14'].forEach(n=>{const c=kyCh(sim,n)[0];if(c)gnRing(ctx,c.x,c.y,34,tau);});kyC(ctx,k,[['Where is the pinch?',{s:14,w:800}],['Middle: 1 · Off-center: 4 · Near the end: 14']],300);},
      see: 'The circled chromosomes are a 1, a 4 and a 14. Look at where each one is pinched.',
      why: 'The pinch is the <b>centromere</b>. It sits in the middle of chromosome 1, off-center on 4 and almost at the end of 14. Partners always share the same centromere position.' },
    { key: 'bands', title: 'Clue 3: banding', fresh: true, pause: true, run(sim){kyCase(sim,'T21','M');},
      overlay(sim,ctx,LH,k,tau){kyCh(sim,'2').forEach(c=>gnRing(ctx,c.x,c.y,36,tau));kyC(ctx,k,[['Same bands = partners',{s:14,w:800}],['The two 2s match band for band']],300);},
      see: 'The two circled chromosomes are both chromosome 2. Compare their light and dark stripes.',
      why: 'The stain makes a band pattern that depends on the DNA. Partners carry the same genes in the same order, so their bands match exactly. Bands are the clue that settles close calls.' },
    { key: 'arrange', title: 'Arrange the pairs', fresh: true, speed: 1, run(sim){kyCase(sim,'T21','M');},
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'auto',s=>dvAct(s,'auto'));kyC(ctx,k,[[tau<1.5?'Watch them move…':'The karyogram',{s:14,w:800}],['Pairs 1–22, then the sex chromosomes']],tau<1.5?300:60);},
      see: 'Watch each chromosome slide from the spread into its spot in the karyogram, matched by size, centromere and bands.',
      why: 'Lined up in order, the 22 pairs of <b>autosomes</b> come first, then the <b>sex chromosomes</b>. Now anything extra or missing stands out.' },
    { key: 'sex', title: 'The sex chromosomes', fresh: true, speed: 1, run(sim){kyCase(sim,'T21','M');sim.st.chs.forEach(c=>c.slot=c.n);},
      overlay(sim,ctx,LH,k,tau){kyCh(sim,'X').concat(kyCh(sim,'Y')).forEach(c=>gnRing(ctx,c.x,c.y,36,tau));kyC(ctx,k,[['X and Y: a male',{s:14,w:800}],['XX is usually female; XY male']],60);},
      see: 'This patient has one X and one small Y.',
      why: 'The Y carries the SRY gene that starts male development. A typical female has two X chromosomes and no Y.' },
    { key: 'count', title: 'Count and diagnose', fresh: true, speed: 1, run(sim){kyCase(sim,'T21','M');sim.st.chs.forEach(c=>c.slot=c.n);},
      overlay(sim,ctx,LH,k,tau){kyCh(sim,'21').forEach(c=>gnRing(ctx,c.x,c.y,30,tau));kyC(ctx,k,[['Total: '+sim.st.chs.length+' chromosomes',{s:14,w:800}],['Three copies of 21: trisomy 21',{w:800,c:CE_RED}],['Karyotype: 47,XY,+21 (Down syndrome)',{s:12}]],60);},
      see: 'Count all of them: 47, not 46. Chromosome 21 has three copies.',
      why: 'An extra chromosome 21 causes Down syndrome. It usually comes from <b>nondisjunction</b>, when a chromosome pair fails to separate in meiosis, so an egg or sperm carries two copies instead of one.',
      so: 'About 1 in 700 babies in the US is born with Down syndrome. Many adults with Down syndrome live into their 60s, work and live semi-independently.' },
    { key: 'kli', lvl: 'honors', title: 'An extra sex chromosome', fresh: true, speed: 1, run(sim){kyCase(sim,'KLI','M');sim.st.chs.forEach(c=>c.slot=c.n);},
      overlay(sim,ctx,LH,k,tau){kyCh(sim,'X').concat(kyCh(sim,'Y')).forEach(c=>gnRing(ctx,c.x,c.y,34,tau));kyC(ctx,k,[['47,XXY',{s:14,w:800}],['Klinefelter syndrome',{w:800,c:CE_RED}],['Two X chromosomes plus a Y',{s:12}]],60);},
      see: 'A different patient: 47 chromosomes again, but this time the extra one is an X. The sex chromosomes are XXY.',
      why: 'Extra or missing sex chromosomes are tolerated better than extra autosomes, partly because all but one X in each cell is switched off. XXY boys (Klinefelter syndrome) are often tall, with low testosterone; many are never diagnosed.' },
    { key: 'tur', lvl: 'ap', title: 'A missing chromosome', fresh: true, speed: 1, run(sim){kyCase(sim,'TUR','F');sim.st.chs.forEach(c=>c.slot=c.n);},
      overlay(sim,ctx,LH,k,tau){kyCh(sim,'X').forEach(c=>gnRing(ctx,c.x,c.y,34,tau));kyC(ctx,k,[['45,X',{s:14,w:800}],['Turner syndrome',{w:800,c:CE_RED}],['One X, no second sex chromosome',{s:12}]],60);},
      see: 'Only 45 chromosomes: one X and nothing else in the sex-chromosome spots.',
      why: 'Turner syndrome (45,X) is the only monosomy people commonly survive. Missing an autosome removes too many genes for an embryo to develop. Many 45,X pregnancies also miscarry; girls who are born are usually short and need hormone treatment.' }
  ],
  useIt: [
    { do: 'Know that prenatal screening for chromosome conditions is offered in every pregnancy.',
      why: 'Blood tests and ultrasound can flag a higher chance of trisomy 21, 18 or 13. A karyotype or similar test of fetal cells is what confirms it.' },
    { do: 'Treat people with chromosome conditions as individuals, not as a diagnosis.',
      why: 'A karyotype shows a cell’s chromosomes, not a person’s abilities or future. Outcomes for people with Down syndrome have improved enormously with medical care, education and inclusion.' },
    { do: 'If a relative is diagnosed with a chromosome condition, ask whether genetic counseling is recommended.', lvl: 'honors',
      why: 'Most trisomies are random nondisjunction, but a few cases come from a rearranged chromosome in a parent, which can recur in a family. A counselor can sort out which applies.' }
  ],
  tryIt: [
    { title: 'the sock karyotype (10 minutes)',
      steps: ['Gather pairs of socks of different lengths and patterns: each pair is a chromosome pair.', 'Mix them in a pile, then sort them back into pairs using only length and pattern.', 'Line the pairs up from longest to shortest.'],
      look: 'Matching by length first, then by pattern, is exactly how chromosomes are matched by size, then by bands. Have a friend secretly add one extra sock: can you spot the “trisomy”?' }
  ]
}
});


/* ===== Pedigrees ===== */
function pdRand(seed){let a=seed>>>0;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const pdClueAR=f=>f.couples.find(c=>!f.P[c.f].aff&&!f.P[c.m].aff&&c.kids.some(i=>f.P[i].aff));
const pdClueAD=f=>f.couples.find(c=>f.P[c.f].aff&&f.P[c.m].aff&&c.kids.some(i=>!f.P[i].aff))||f.couples.find(c=>(f.P[c.f].aff||f.P[c.m].aff)&&c.kids.some(i=>f.P[i].aff));
const PD_OK={AR:f=>!!pdClueAR(f),AD:f=>!!(f.couples.find(c=>f.P[c.f].aff&&f.P[c.m].aff&&c.kids.some(i=>!f.P[i].aff))),XR:f=>f.P.some(p=>p.aff&&p.gen===3)&&f.P.every(p=>!p.aff||p.sex==='M'),XD:f=>f.couples.some(c=>f.P[c.f].aff&&c.kids.length>=2),MT:f=>f.couples.some(c=>f.P[c.m].aff&&c.kids.length>=2)};
const PD_SEED={};
/* build a fixed family for a pattern: generate() is seeded so every student sees the same family */
function pdFam(sim,truth){const key=BioLab.level+':'+truth,orig=Math.random;let s0=PD_SEED[key]||1;
  for(let s=s0;s<s0+120;s++){Math.random=pdRand(s*7919+truth.charCodeAt(0));try{sim.def.onLevel(sim);}finally{Math.random=orig;}const f=sim.fam;if(f&&f.truth===truth&&(PD_OK[truth]||(()=>true))(f)){PD_SEED[key]=s;break;}}
  sim.fam.revealed=false;sim.fam.sel=0;atReset(sim);}
const pdC=(ctx,k,L)=>dcCard(ctx,k,494,6,298,L);
const pdRingP=(ctx,p,tau,col)=>{const a=0.5+0.5*Math.sin(tau*6);ctx.save();ctx.strokeStyle=col||'#c8102e';ctx.lineWidth=3;ctx.globalAlpha=0.45+0.55*a;ctx.beginPath();ctx.arc(p.x,p.y,28+3*a,0,6.29);ctx.stroke();ctx.restore();};
const pdArrow=(ctx,a,b,col)=>{ctx.save();ctx.strokeStyle=col||'#c8102e';ctx.fillStyle=col||'#c8102e';ctx.lineWidth=3;const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,x1=a.x+ux*30,y1=a.y+uy*30,x2=b.x-ux*32,y2=b.y-uy*32;
  ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-ux*11-uy*6,y2-uy*11+ux*6);ctx.lineTo(x2-ux*11+uy*6,y2-uy*11-ux*6);ctx.closePath();ctx.fill();ctx.restore();};

BioLab.addLearn({
pedigree: {
  goals: {
    bio: ['How to read a pedigree: symbols, lines and generations', 'The clue that a trait is recessive: it skips a generation', 'The clue that a trait is dominant', 'What a carrier is'],
    honors: ['Reading pedigrees and naming people (II-3)', 'Telling autosomal dominant from autosomal recessive', 'X-linked recessive: why it is mostly males', 'Finding carriers from the pattern'],
    ap: ['Ruling patterns in and out with decisive matings', 'X-linked dominant and mitochondrial patterns', 'Genotype probabilities for people in the tree']
  },
  matters: 'Genetic counselors draw pedigrees to estimate a family’s risk of conditions like cystic fibrosis, Huntington’s disease or hemophilia. The same logic lets you read your own family’s health history.',
  startKey: 'start', startRun: false,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Grandparents',120,78,k,{s:12,hi:true});tag(ctx,'Their children and spouses',120,170,k,{s:12,hi:true});tag(ctx,'Grandchildren',120,300,k,{s:12,hi:true});},
  steps: [
    { key: 'symbols', title: 'Reading the symbols', fresh: true, pause: true, run(sim){pdFam(sim,'AR');},
      overlay(sim,ctx,LH,k,tau){const P=sim.fam.P;pdRingP(ctx,P[0],tau);pdRingP(ctx,P[1],tau);pdC(ctx,k,[['■ male   ● female',{s:14,w:800}],['Shaded: has the trait'],['Line between two people: a couple'],['Lines down: their children']]);},
      see: 'A three-generation family. The circled grandparents (I-1 and I-2) are a couple, joined by a horizontal line. Their children hang below them.',
      why: 'Squares are males and circles are females. Shaded symbols have the trait; open ones don’t. People are named by generation and position: II-3 is the third person in generation II.' },
    { key: 'down', title: 'Follow the trait down', fresh: true, speed: 1, run(sim){pdFam(sim,'AR');},
      overlay(sim,ctx,LH,k,tau){const f=sim.fam,P=f.P,ph=Math.floor(tau/1.8)%3,g=ph+1;P.filter(p=>p.gen===g).forEach(p=>pdRingP(ctx,p,tau,p.aff?'#c8102e':'#1f5fbf'));
        const n=P.filter(p=>p.gen===g&&p.aff).length,t=P.filter(p=>p.gen===g).length;pdC(ctx,k,[['Generation '+['I','II','III'][ph],{s:14,w:800}],[n+' of '+t+' have the trait',{w:800,c:n?CE_RED:CE_BLUE}],['Watch where it shows up, and where it skips',{s:12}]]);},
      see: 'Watch the circles move down one generation at a time. Count how many people in each generation have the trait.',
      why: 'The trait appears in a grandchild even though neither of that child’s parents has it. Something was passed down hidden.' },
    { key: 'clueAR', title: 'The recessive clue', fresh: true, speed: 1, run(sim){pdFam(sim,'AR');},
      overlay(sim,ctx,LH,k,tau){const f=sim.fam,P=f.P,c=pdClueAR(f);if(c){const kid=P[c.kids.find(i=>P[i].aff)];pdRingP(ctx,P[c.f],tau,'#1f5fbf');pdRingP(ctx,P[c.m],tau,'#1f5fbf');if(tau>1.2){pdArrow(ctx,P[c.f],kid);pdArrow(ctx,P[c.m],kid);pdRingP(ctx,kid,tau);}
          pdC(ctx,k,[[P[c.f].id+' and '+P[c.m].id+': no trait',{s:14,w:800,c:CE_BLUE}],[tau>1.2?'Their child '+kid.id+' has it':'Watch their child…',{w:800,c:CE_RED}],['So both parents carry it hidden: recessive',{s:12}]]);}},
      see: 'The circled couple don’t have the trait, but one of their children does.',
      why: 'If the trait were dominant, the child would need at least one parent with it. Two unaffected parents can only have an affected child if each carries one hidden recessive allele and passes it on. That is the decisive clue for <b>recessive</b> inheritance.' },
    { key: 'clueAD', title: 'The dominant clue', fresh: true, speed: 1, run(sim){pdFam(sim,'AD');},
      overlay(sim,ctx,LH,k,tau){const f=sim.fam,P=f.P,c=pdClueAD(f);if(c){const kid=P[c.kids.find(i=>!P[i].aff)]||P[c.kids[0]];pdRingP(ctx,P[c.f],tau);pdRingP(ctx,P[c.m],tau);if(tau>1.2){pdArrow(ctx,P[c.f],kid,'#1f5fbf');pdArrow(ctx,P[c.m],kid,'#1f5fbf');pdRingP(ctx,kid,tau,'#1f5fbf');}
          pdC(ctx,k,[['A new family',{s:14,w:800}],[P[c.f].id+' and '+P[c.m].id+(P[c.f].aff&&P[c.m].aff?': both have it':''),{w:800,c:CE_RED}],[tau>1.2?'Child '+kid.id+(kid.aff?' has it':' does not'):'Watch their child…',{w:800,c:CE_BLUE}]]);}},
      see: 'A different family. The circled parents both have the trait, yet their circled child does not.',
      why: 'Under a recessive pattern, two affected parents (aa × aa) could only have affected children. An unaffected child means each parent had a hidden normal allele: they are Aa, and the trait is <b>dominant</b>. Dominant traits also don’t skip generations: everyone affected has an affected parent.' },
    { key: 'carriers', lvl: 'honors', title: 'Finding the carriers', fresh: true, speed: 1, run(sim){pdFam(sim,'AR');},
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.2,'rev',s=>{s.fam.revealed=true;s.infoDirty=true;});const f=sim.fam;pdC(ctx,k,[[tau<1.2?'Watch for half-shaded symbols…':'Half-shaded: must be a carrier',{s:14,w:800}],['One recessive allele, no trait'],['Every affected child’s parents',{s:12}]]);},
      see: 'Back to the first family. After a moment, half-shaded symbols appear: the people who must be carriers.',
      why: 'A carrier has one recessive allele and no trait. Both parents of every affected child must be carriers, and so must an unaffected person whose parent was affected. These are <b>obligate carriers</b>.' },
    { key: 'xr', lvl: 'honors', title: 'X-linked recessive', fresh: true, speed: 1, run(sim){pdFam(sim,'XR');},
      overlay(sim,ctx,LH,k,tau){const f=sim.fam,P=f.P;P.filter(p=>p.aff).forEach(p=>{pdRingP(ctx,p,tau);if(p.mother!=null&&tau>1.2){pdArrow(ctx,P[p.mother],p,'#1f5fbf');pdRingP(ctx,P[p.mother],tau,'#1f5fbf');}});
        pdC(ctx,k,[['Only males have it',{s:14,w:800,c:CE_RED}],[tau>1.2?'Sons get it from their mothers':'Where did each son get it?',{w:800,c:CE_BLUE}],['Like color blindness and hemophilia',{s:12}]]);},
      see: 'In this family only males have the trait. Watch the arrows: each affected grandson got it from his mother, who doesn’t have it.',
      why: 'The allele is on the X chromosome. A son gets his only X from his mother, so one recessive allele shows. Daughters get an X from each parent, so they are usually hidden carriers. Fathers never pass an X-linked trait to sons.' },
    { key: 'xd', lvl: 'ap', title: 'X-linked dominant and mitochondrial', fresh: true, speed: 1, run(sim){pdFam(sim,'XD');},
      overlay(sim,ctx,LH,k,tau){const f=sim.fam,P=f.P,c=f.couples.find(c=>P[c.f].aff&&c.kids.length>=2);if(c){pdRingP(ctx,P[c.f],tau);if(tau>1.2)c.kids.forEach(i=>{pdArrow(ctx,P[c.f],P[i],P[i].sex==='F'?'#c8102e':'#1f5fbf');pdRingP(ctx,P[i],tau,P[i].sex==='F'?'#c8102e':'#1f5fbf');});}
        pdC(ctx,k,[['Affected father '+(c?P[c.f].id:''),{s:14,w:800}],[tau>1.2?'All his daughters have it, no sons':'Watch his children…',{w:800,c:CE_RED}],['Mitochondrial: only mothers pass it',{s:12}]]);},
      see: 'An X-linked dominant family. Watch the affected father’s children: every daughter has the trait, and no son does.',
      why: 'A father gives his X to every daughter and his Y to every son. With a dominant X-linked allele, all daughters are affected and no sons. In mitochondrial inheritance the pattern flips to the mother: she passes it to every child, because only the egg’s mitochondria are inherited.' }
  ],
  useIt: [
    { do: 'Draw your own family’s pedigree for one trait you can see, like attached earlobes, or for a condition your family talks about.',
      why: 'Writing it down by generation makes patterns visible that are easy to miss in conversation, and a doctor or genetic counselor reads the same symbols.' },
    { do: 'If a condition runs in your family, share the pattern with your doctor.',
      why: 'Whether it skips generations, or affects only males, tells a doctor which inheritance patterns fit, and so who else might be at risk or could be a carrier.' },
    { do: 'Know that red-green color blindness can be passed from a grandfather to a grandson through a daughter who sees colors normally.', lvl: 'honors',
      why: 'That is the X-linked recessive path you just traced: the daughter is a carrier, and each of her sons has a 1 in 2 chance of inheriting it.' }
  ],
  tryIt: [
    { title: 'the family trait survey (15 minutes)',
      steps: ['Pick a visible trait, like a widow’s peak or free versus attached earlobes.', 'Check it in as many relatives as you can across three generations (photos help for grandparents).', 'Draw the pedigree: squares and circles, shaded if they have the trait.'],
      look: 'Look for the decisive clues: an affected child of two unaffected parents points to recessive; two affected parents with an unaffected child points to dominant. Many everyday traits are more complicated than one gene, so your family may not fit neatly.' }
  ]
}
});


/* ===== DNA replication and gene expression ===== */
const rpC=(ctx,k,L)=>dcCard(ctx,k,466,238,326,L);
const rpM=(sim,id)=>{const v=phM(sim,id);return isNaN(v)?'…':Math.round(v).toLocaleString('en-US');};
const exC=(ctx,k,L)=>dcCard(ctx,k,436,196,352,L);
const exProt=sim=>String(phM(sim,'protein')||'');
const exB=(ctx,k,L,LH)=>dcCard(ctx,k,20,(LH||450)-22,760,L,{up:true});

BioLab.addLearn({
replication: {
  goals: {
    bio: ['How a cell copies its DNA before it divides', 'What helicase, DNA polymerase and ligase each do', 'Why one new strand is built in pieces', 'Why every copy is half old and half new'],
    honors: ['Leading and lagging strands and Okazaki fragments', 'Primase, polymerase III, polymerase I and ligase', 'Proofreading and how rare mistakes are', 'Semiconservative replication'],
    ap: ['Antiparallel strands and 5′→3′ synthesis', 'The enzymes at the fork and what fails without each', 'Meselson and Stahl’s density experiment']
  },
  matters: 'Every time one of your cells divides, it copies about 6 billion base pairs and makes only a few mistakes. Those rare mistakes are where mutations come from, and several cancer drugs and antibiotics work by jamming this machinery.',
  startKey: 'start', startRun: true, startSpeed: 0.25,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Original DNA comes in from the right',600,120,k,{s:12,hi:true});tag(ctx,'New strand on the bottom',300,370,k,{s:12,hi:true});},
  steps: [
    { key: 'fork', title: 'The replication fork', fresh: true, speed: 0.25, focus: [0,40,800,370],
      see: 'One spot on a bacterium’s chromosome where DNA is being copied. The original double helix (slate) comes in from the right and is opened into two single strands at the fork.',
      why: 'Each original strand is a template: its bases decide the order of the new strand’s bases, A with T and G with C. Two templates, so two copies.',
      overlay(sim,ctx,LH,k){rpC(ctx,k,[['Colors',{s:14,w:800}],['Slate: original strands'],['Pink: new DNA',{c:'#c53a4f'}],['Amber: RNA primers',{c:'#b07a12'}]]);} },
    { key: 'helicase', title: 'Helicase unzips', fresh: true, speed: 0.25,
      see: 'Helicase (the purple ring) moves along, splitting the two strands apart. Topoisomerase ahead of it keeps the DNA from over-twisting.',
      why: 'Helicase uses energy from ATP to break the hydrogen bonds between base pairs. Without that, the bases are locked inside the helix and can’t be read.',
      overlay(sim,ctx,LH,k){rpC(ctx,k,[['Helicase: the unzipper',{s:14,w:800}],['Fork speed: '+rpM(sim,'speed')+' bases a second',{w:800,c:CE_GREEN}]]);} },
    { key: 'leading', title: 'The leading strand', fresh: true, speed: 0.25, focus: [0,290,800,95],
      see: 'On the bottom, DNA polymerase builds the new strand in one smooth piece, following right behind the fork.',
      why: { bio: 'DNA polymerase can only build in one direction. On this strand that direction points toward the fork, so it just keeps going.', honors: 'Polymerase III adds nucleotides only to a 3′ end, building 5′→3′. On the bottom template that direction points toward the fork, so the leading strand is made continuously from one primer.' },
      overlay(sim,ctx,LH,k){rpC(ctx,k,[['Leading strand',{s:14,w:800}],['One continuous piece'],['Built toward the fork',{c:CE_BLUE}]]);} },
    { key: 'lagging', title: 'The lagging strand', fresh: true, speed: 0.25, focus: [0,55,800,110],
      see: 'On the top, the new strand is built the other way, away from the fork. Watch it grow in short pieces, each one starting near the fork.',
      why: 'The two strands of DNA run in opposite directions. On the top strand, “the one direction polymerase can build” points backward, so it can only fill in a short stretch each time the fork opens more. These pieces are <b>Okazaki fragments</b>.',
      overlay(sim,ctx,LH,k){rpC(ctx,k,[['Lagging strand',{s:14,w:800}],['Built in short pieces, away from the fork'],['Pieces started: '+rpM(sim,'frags'),{w:800,c:CE_BLUE}]]);} },
    { key: 'primase', lvl: 'honors', title: 'Primase starts each piece', fresh: true, speed: 0.2,
      see: 'Every few moments, primase lays a short RNA starter (amber) near the fork, and polymerase extends it.',
      why: 'DNA polymerase can’t start a strand from nothing; it can only add to an existing 3′ end. Primase makes that starting point out of RNA.',
      overlay(sim,ctx,LH,k){rpC(ctx,k,[['Primase: the starter',{s:14,w:800}],['RNA primers in place: '+rpM(sim,'primers'),{w:800,c:'#b07a12'}]]);} },
    { key: 'join', title: 'Joining the pieces', fresh: true, speed: 0.4, focus: [0,55,800,110],
      see: 'Behind the fork, the amber RNA starters are swapped for DNA, and the pieces are sealed into one strand.',
      why: { bio: 'Another polymerase replaces each RNA starter with DNA. That leaves a tiny break in the backbone, which <b>ligase</b> glues shut.', honors: 'DNA polymerase I removes each RNA primer and fills in DNA, leaving a nick. DNA ligase seals the nick with a phosphodiester bond.' },
      overlay(sim,ctx,LH,k){rpC(ctx,k,[['Ligase: the glue',{s:14,w:800}],['Open gaps right now: '+rpM(sim,'nicks'),{w:800,c:CE_GREEN}]]);} },
    { key: 'noligase', title: 'If ligase stops working', set: { ligase: false }, fresh: true, speed: 0.4, cause: { from: { ligase: true }, delay: 1.5 },
      see: 'Copying starts normally. After a moment ligase is switched off. Watch the top strand: the fork keeps going and new pieces keep coming, but the gaps between them stay open.',
      why: 'Ligase isn’t needed to make DNA, only to join it. Without it the cell ends up with a copy that is all there but full of breaks, and broken DNA can’t be passed on safely.',
      overlay(sim,ctx,LH,k){rpC(ctx,k,[[sim.p.ligase?'Ligase working':'Ligase off',{s:14,w:800,c:sim.p.ligase?CE_GREEN:CE_RED}],['Fork speed: '+rpM(sim,'speed')+' bases/s'],['Open gaps: '+rpM(sim,'nicks'),{w:800,c:CE_RED}]]);} },
    { key: 'nohelicase', title: 'If helicase stops working', set: { helicase: false }, fresh: true, speed: 0.4, cause: { from: { helicase: true }, delay: 1.5 },
      see: 'Copying starts normally, then helicase is switched off. The fork stops, and with no new template exposed, everything behind it stalls too.',
      why: 'Every other enzyme needs single-stranded DNA to work on. No unzipping, no copying: fork speed drops to zero.',
      overlay(sim,ctx,LH,k){rpC(ctx,k,[[sim.p.helicase?'Helicase working':'Helicase off',{s:14,w:800,c:sim.p.helicase?CE_GREEN:CE_RED}],['Fork speed: '+rpM(sim,'speed')+' bases/s',{w:800,c:CE_RED}],['New DNA made: '+rpM(sim,'newnt')]]);} },
    { key: 'proof', lvl: 'honors', title: 'Proofreading', set: { proof: false }, fresh: true, speed: 0.4, cause: { from: { proof: true }, delay: 1.5 },
      see: 'Proofreading is switched off partway through. The expected number of mistakes in one copy of the genome jumps about 100 times.',
      why: 'DNA polymerase checks each base it adds and cuts out wrong ones. That proofreading cuts errors about 100-fold; mismatch repair afterward catches most of the rest.',
      overlay(sim,ctx,LH,k){const e=phM(sim,'errors');rpC(ctx,k,[[sim.p.proof?'Proofreading on':'Proofreading off',{s:14,w:800,c:sim.p.proof?CE_GREEN:CE_RED}],['Expected mistakes per genome copy: '+(isNaN(e)?'…':e),{w:800,c:CE_RED}]]);} },
    { key: 'semi', title: 'Half old, half new', fresh: true, speed: 0.6, focus: [0,40,800,370],
      see: 'Look at the two finished double helices on the left: each has one slate strand and one pink strand.',
      why: 'Each copy keeps one original strand and gets one new one. This is called <b>semiconservative</b> replication.',
      overlay(sim,ctx,LH,k){rpC(ctx,k,[['Each copy: 1 old + 1 new strand',{s:14,w:800}],['Semiconservative',{w:800,c:CE_BLUE}]]);} },
    { key: 'ms', lvl: 'ap', title: 'Meselson and Stahl', set: { mode: 'ms' }, fresh: true, speed: 1, run(sim){sim.st.msT=0;},
      see: 'Bacteria grown in heavy nitrogen (¹⁵N) are moved to light ¹⁴N. A centrifuge sorts their DNA by density, generation by generation.',
      why: 'After one generation all the DNA is one intermediate band: that rules out conservative copying. After two, half is intermediate and half light: that rules out dispersive copying. Only semiconservative replication fits.' }
  ],
  useIt: [
    { do: 'Wear sunscreen and avoid tanning beds, especially while you are young and your skin cells divide quickly.',
      why: 'UV damage that isn’t repaired before a cell copies its DNA gets copied into both daughter cells as a permanent mutation.' },
    { do: 'Finish a full course of antibiotics exactly as prescribed.',
      why: 'Some antibiotics, like ciprofloxacin, jam bacterial topoisomerase so bacteria can’t copy their DNA. Stopping early leaves survivors that can grow back, sometimes more resistant.' },
    { do: 'Know that some chemotherapy drugs target DNA copying.', lvl: 'honors',
      why: 'Cancer cells divide constantly, so drugs that block replication hit them hardest. Hair follicles and the gut lining also divide fast, which is why those side effects are common.' }
  ],
  tryIt: [
    { title: 'the zipper copy (10 minutes)',
      steps: ['Write a 12-letter DNA sequence on a strip of paper, and its matching strand (A↔T, G↔C) on another. Tape them side by side: that is your double helix.', 'Unzip: cut the tape. Now write the matching strand for each half on two new strips.', 'Tape each new strip to its template.'],
      look: 'You get two identical double helices, each with one original strip and one new one, exactly the semiconservative pattern.' }
  ]
},
expression: {
  goals: {
    bio: ['How DNA’s code is copied into mRNA (transcription)', 'How a ribosome reads mRNA three bases at a time to build a protein (translation)', 'How changing one DNA base can change the protein'],
    honors: ['Transcription, base pairing with U, and codons', 'tRNA anticodons, start and stop codons', 'Substitutions vs. frameshift mutations'],
    ap: ['RNA processing: introns, exons, cap and tail', 'Reading the genetic code and predicting mutations’ effects', 'Why a single substitution causes sickle-cell disease']
  },
  matters: 'Every protein in your body, from hemoglobin to the keratin in your hair, is built this way. One wrong base in the hemoglobin gene causes sickle-cell disease, and mRNA vaccines work by giving your ribosomes a recipe to read.',
  startKey: 'start', startRun: false,
  startOverlay(sim,ctx,LH,k){tag(ctx,'A gene: DNA in the nucleus',560,150,k,{s:12,hi:true});tag(ctx,'Ribosomes work out here',560,260,k,{s:12,hi:true});},
  steps: [
    { key: 'gene', title: 'A gene is a recipe', fresh: true, pause: true, focus: [120,28,672,100],
      see: 'A short gene. The order of its bases (A, T, G, C) is the recipe for one protein.',
      why: 'DNA stays in the nucleus. To use a recipe, the cell first copies it into a messenger, mRNA, then a ribosome reads the messenger and builds the protein.',
      overlay(sim,ctx,LH,k){exC(ctx,k,[['DNA → mRNA → protein',{s:15,w:800}],['Transcription: copy the recipe'],['Translation: build from it']]);} },
    { key: 'tx', title: 'Transcription', fresh: true, speed: 0.25,
      see: 'RNA polymerase (purple) opens a small bubble in the DNA and builds an mRNA strand base by base along the template strand.',
      why: 'Each new RNA base pairs with the template: A with U, T with A, G with C, C with G. RNA uses U (uracil) where DNA uses T.',
      overlay(sim,ctx,LH,k){exC(ctx,k,[['Base pairing for RNA',{s:14,w:800}],['Template A → U   T → A'],['Template G → C   C → G'],['RNA has U instead of T',{c:CE_BLUE}]]);} },
    { key: 'proc', lvl: 'ap', title: 'RNA processing', set: { introns: true }, fresh: true, speed: 0.3, run(sim){dvAct(sim,'skip');const d=sim.st;d.phase='proc';d.proc=0;d.exp=0;d.ci=0;},
      see: 'Before the mRNA leaves the nucleus, the intron (gray) loops out and is cut away, and the exons are joined. A cap and a tail are added to the ends.',
      why: 'Introns are stretches inside a gene that don’t code for the protein. Splicing removes them; the cap and poly-A tail protect the mRNA and help the ribosome find it.',
      overlay(sim,ctx,LH,k){exC(ctx,k,[['Splicing',{s:14,w:800}],[String(phM(sim,'proc')),{s:12}]]);} },
    { key: 'export', title: 'Out to the ribosome', fresh: true, speed: 0.35, run(sim){dvAct(sim,'skip');const d=sim.st;d.phase='exp';d.exp=0;d.ci=0;},
      see: 'The finished mRNA slides out through a pore in the nuclear envelope into the cytoplasm.',
      why: 'Ribosomes are in the cytoplasm. Keeping DNA in the nucleus protects the master copy; only disposable mRNA copies travel out.',
      overlay(sim,ctx,LH,k){exC(ctx,k,[['mRNA leaves the nucleus',{s:14,w:800}],['The DNA stays behind',{c:CE_BLUE}]]);} },
    { key: 'codons', title: 'Reading codons', fresh: true, speed: 0.15, run(sim){dvAct(sim,'skip');const d=sim.st;d.phase='tl';d.ci=0;},
      see: 'A ribosome clamps onto the mRNA at the start codon, AUG, and reads three bases, one codon, at a time.',
      why: 'Each codon stands for one amino acid. With 4 bases there are 4 × 4 × 4 = 64 codons, enough for 20 amino acids plus start and stop signals.',
      overlay(sim,ctx,LH,k){exC(ctx,k,[['3 bases = 1 codon = 1 amino acid',{s:14,w:800}],['Start: AUG (also methionine, Met)']]);} },
    { key: 'trna', title: 'tRNA brings the amino acids', fresh: true, speed: 0.12, run(sim){dvAct(sim,'skip');const d=sim.st;d.phase='tl';d.ci=1;},
      see: 'Each tRNA has three bases, an anticodon, that match one codon, and it carries one amino acid. The ribosome links the new amino acid to the chain, then slides along.',
      why: 'The anticodon pairs with the codon just as DNA bases pair, so the right amino acid always arrives for each codon.',
      overlay(sim,ctx,LH,k){exC(ctx,k,[['Codon CCG ↔ anticodon GGC',{s:14,w:800}],['C pairs with G, G with C'],['So proline (Pro) arrives next',{c:CE_GREEN}]]);} },
    { key: 'stop', title: 'Stop', fresh: true, speed: 0.4, run(sim){dvAct(sim,'skip');},
      see: 'At the stop codon, UAA, no tRNA fits. A release factor frees the finished protein.',
      why: 'Stop codons (UAA, UAG, UGA) code for no amino acid. That is why this 24-base gene makes a protein of 7 amino acids, not 8.',
      overlay(sim,ctx,LH,k){exB(ctx,k,[['Protein: '+exProt(sim)+' · '+phM(sim,'len')+' amino acids',{s:13,w:800,c:CE_GREEN}],['The 8th codon, UAA, means stop',{c:CE_RED}]],LH);} },
    { key: 'sickle', lvl: 'honors', title: 'One base, one disease', set: { gene: 'hbb', pos: 20, base: 'T', introns: false }, fresh: true, speed: 1, run(sim){atReset(sim);dvAct(sim,'skip');sim._exBefore=exProt(sim);},
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.8,'sub',s=>{dvAct(s,'sub');dvAct(s,'skip');});const done=tau>=1.8;
        exB(ctx,k,[[done?'A → T at base 20':'Watch base 20 of β-globin…',{s:14,w:800,c:done?CE_RED:PAL['cv-ink']}],['Before: '+(sim._exBefore||''),{s:11}],['After:  '+(done?exProt(sim):'…'),{s:11,w:800,c:CE_RED}],['GAG (Glu) → GTG (Val)',{s:12,w:800}]],LH);},
      see: 'The start of the β-globin gene, which makes part of hemoglobin. Watch one base, number 20, change from A to T, and the protein below rebuild.',
      why: 'GAG becomes GTG, so one glutamic acid (charged) becomes valine (nonpolar). That single change makes hemoglobin molecules stick together into long fibers that bend red blood cells into sickles.' },
    { key: 'frame', lvl: 'honors', title: 'A frameshift', set: { gene: 'demo', pos: 6, base: 'A', introns: false }, fresh: true, speed: 1, run(sim){atReset(sim);dvAct(sim,'skip');sim._exBefore=exProt(sim);},
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.8,'ins',s=>{dvAct(s,'ins');dvAct(s,'skip');});const done=tau>=1.8;
        exB(ctx,k,[[done?'One extra base inserted at 6':'Watch position 6…',{s:14,w:800,c:done?CE_RED:PAL['cv-ink']}],['Before: '+(sim._exBefore||''),{s:11}],['After:  '+(done?exProt(sim):'…'),{s:11,w:800,c:CE_RED}],['Every codon after it shifts',{s:12,w:800}]],LH);},
      see: 'Back to the demo gene. Watch one extra base slip in at position 6.',
      why: 'The ribosome reads in fixed groups of three, so one extra base shifts every codon after it. The rest of the protein is scrambled, often with an early stop codon. Insertions and deletions that aren’t multiples of 3 are usually far worse than a single substitution.' }
  ],
  useIt: [
    { do: 'Know what an mRNA vaccine does in your body.',
      why: 'It delivers an mRNA recipe for one viral protein. Your ribosomes translate it just like the mRNA in this sim, your immune system learns that protein, and the mRNA breaks down within days. It never enters the nucleus or changes your DNA.' },
    { do: 'If you are of African, Mediterranean, Middle Eastern or South Asian ancestry, ask whether you were screened for sickle-cell trait.',
      why: 'Every US newborn is screened, but many people don’t know their result. Two parents with the trait have a 1 in 4 chance of each child having sickle-cell disease.' },
    { do: 'Know why some antibiotics are safe for you but deadly to bacteria.', lvl: 'honors',
      why: 'Drugs like tetracycline and erythromycin jam bacterial ribosomes, which are built differently from yours, so translation stops in the bacteria but not in your cells.' }
  ],
  tryIt: [
    { title: 'decode a secret message (10 minutes)',
      steps: ['Use a genetic code table (search “codon chart”).', 'Translate this mRNA, three letters at a time: AUG GCA UGG GAA UAA.', 'Then change one base to make a different amino acid, and add one base to see a frameshift.'],
      look: 'AUG GCA UGG GAA UAA reads Met-Ala-Trp-Glu, then stop. One substitution changes one amino acid; one added base changes every codon after it.' }
  ]
}
});


/* ===== Gene regulation, Hardy–Weinberg, natural selection ===== */
const lcC=(ctx,k,L)=>dcCard(ctx,k,12,96,300,L);
const lcFF=(sim,n)=>{for(let i=0;i<n;i++)sim.def.step(sim,0.05);sim.t+=n*0.05;};
const lcM=(sim,id,d)=>{const v=phM(sim,id);return isNaN(v)?'…':(d?v.toFixed(d):Math.round(v).toLocaleString('en-US'));};
const hwC=(ctx,k,L,LH)=>dcCard(ctx,k,14,(LH||450)-26,380,L,{up:true});
const hwM=(sim,id,d)=>{const v=phM(sim,id);return isNaN(v)?'…':v.toFixed(d==null?2:d);};
const evC=(ctx,k,L,LH)=>dcCard(ctx,k,474,(LH||450)-12,318,L,{up:true});
const evD=sim=>Math.round(phM(sim,'p'));

BioLab.addLearn({
lacoperon: {
  goals: {
    bio: ['Why a cell doesn’t make every protein all the time', 'How a repressor works like an off switch', 'How lactose turns the lac genes on, and glucose turns them down'],
    honors: ['Operons: promoter, operator and structural genes', 'Induction: allolactose pulls the repressor off', 'Catabolite repression by glucose (cAMP–CAP)'],
    ap: ['Negative and positive control of the lac operon', 'Predicting lacI⁻, Oᶜ and CAP⁻ mutants', 'Why gene regulation saves energy']
  },
  matters: 'Every cell in your body has the same DNA, but a liver cell and a nerve cell use different genes. Switches like this one are how. Biotech labs use the lac switch every day to turn on genes for insulin and other medicines.',
  startKey: 'start', startRun: true, startSpeed: 1,
  startOverlay(sim,ctx,LH,k){tag(ctx,'The cell membrane',640,40,k,{s:12,hi:true});tag(ctx,'The lac genes on the bacterium’s DNA',420,190,k,{s:12,hi:true});},
  steps: [
    { key: 'operon', title: 'One switch, three genes', fresh: true, pause: true, focus: [10,270,780,90],
      see: 'A stretch of E. coli DNA: a promoter (where RNA polymerase lands), an operator (the switch), then three genes for using lactose, milk sugar.',
      why: 'Genes that work together are lined up under one switch, an <b>operon</b>. One mRNA copies all three, so they turn on and off together.',
      overlay(sim,ctx,LH,k){lcC(ctx,k,[['Promoter: start here',{s:13,w:800}],['Operator: the on/off switch'],['lacZ, lacY, lacA: lactose genes']]);} },
    { key: 'off', title: 'Off by default', fresh: true, speed: 1,
      see: 'With no lactose, the repressor (purple) sits on the operator. RNA polymerase is stuck behind it, and almost no mRNA is made.',
      why: 'Why make enzymes for a sugar that isn’t there? The repressor blocks the genes until they are needed, saving the cell’s energy and building blocks.',
      overlay(sim,ctx,LH,k){lcC(ctx,k,[['No lactose',{s:14,w:800}],['Lac genes: '+String(phM(sim,'state'))],['Enzyme per cell: '+lcM(sim,'bgal'),{w:800,c:CE_BLUE}]]);} },
    { key: 'lactose', title: 'Lactose arrives', set: { lac: true }, fresh: true, speed: 1, cause: { from: { lac: false }, delay: 1.5, label: 'Lactose' },
      see: 'Lactose is added outside the cell. Watch it get inside, the repressor let go of the operator, and red mRNA strands appear, then green enzyme molecules.',
      why: 'A little lactose becomes allolactose, which binds the repressor and changes its shape so it falls off the DNA. RNA polymerase can now read the genes: the operon is <b>induced</b>.',
      overlay(sim,ctx,LH,k){lcC(ctx,k,[[sim.p.lac?'Lactose added':'No lactose yet…',{s:14,w:800}],['lac mRNA per cell: '+lcM(sim,'mrna',1)],['Enzyme per cell: '+lcM(sim,'bgal'),{w:800,c:CE_GREEN}]]);} },
    { key: 'glucose', title: 'Glucose comes first', set: { lac: true, glc: true }, fresh: true, speed: 1, cause: { from: { glc: false }, delay: 2, label: 'Glucose' }, run(sim){lcFF(sim,1200);},
      see: 'The genes have been on with lactose for a while. Now glucose is added too. Watch the red mRNA thin out.',
      why: 'Glucose is the easier fuel. When it is around, cAMP drops, so the CAP activator (blue) lets go and RNA polymerase binds the promoter only weakly. The genes run low until glucose runs out.',
      overlay(sim,ctx,LH,k){lcC(ctx,k,[[sim.p.glc?'Lactose + glucose':'Lactose only',{s:14,w:800}],['Lac genes: '+String(phM(sim,'state'))],['lac mRNA per cell: '+lcM(sim,'mrna',1),{w:800,c:CE_RED}]]);} },
    { key: 'gone', title: 'The lactose runs out', set: { lac: false }, fresh: true, speed: 1, cause: { from: { lac: true }, delay: 2, label: 'Lactose' }, run(sim){lcFF(sim,1200);},
      see: 'The lactose is taken away. The repressor snaps back onto the operator, mRNA stops, and the enzymes slowly dilute out as the cells grow and divide.',
      why: 'mRNA in bacteria lasts only minutes, so turning the switch off stops new enzyme quickly. The cell is ready to switch on again the next time milk sugar shows up.',
      overlay(sim,ctx,LH,k){lcC(ctx,k,[[sim.p.lac?'Lactose present':'Lactose gone',{s:14,w:800}],['lac mRNA per cell: '+lcM(sim,'mrna',1),{w:800,c:CE_RED}],['Enzyme per cell: '+lcM(sim,'bgal')]]);} },
    { key: 'laci', lvl: 'ap', title: 'A broken repressor', set: { lacI: true }, fresh: true, speed: 1, cause: { from: { lacI: false }, delay: 1.5 },
      see: 'No lactose at all. Partway through, the lacI gene is broken so it makes no working repressor. The genes switch on anyway.',
      why: 'With no repressor, nothing blocks the operator, so the operon is on all the time: <b>constitutive</b> expression. That is how geneticists first worked out that lacI makes a negative regulator.',
      overlay(sim,ctx,LH,k){lcC(ctx,k,[[sim.p.lacI?'lacI⁻: no repressor':'Normal repressor',{s:14,w:800,c:sim.p.lacI?CE_RED:CE_GREEN}],['No lactose'],['lac mRNA per cell: '+lcM(sim,'mrna',1),{w:800,c:CE_RED}]]);} }
  ],
  useIt: [
    { do: 'If milk upsets your stomach, try lactose-free milk or a lactase pill.',
      why: 'Lactase is your version of β-galactosidase. Many adults stop making much of it; the pill or pre-treated milk splits the lactose so gut bacteria don’t ferment it into gas.' },
    { do: 'Know that a lot of insulin is made by bacteria or yeast with a switched-on human gene.',
      why: 'Engineers put the insulin gene under a switch like this one, grow the cells, then flip the switch on so the cells make insulin all at once.' },
    { do: 'Read “gene expression” in a news story as which genes are switched on, not which ones you have.', lvl: 'honors',
      why: 'All your cells share the same DNA. Diet, hormones and signals change which genes are on, which is why the same genes can behave differently over a lifetime.' }
  ],
  tryIt: [
    { title: 'the lactase test (20 minutes, if you have lactase pills)',
      steps: ['Pour the same amount of milk into two cups.', 'Crush a lactase pill and stir it into one cup. Leave both at room temperature for 20 minutes.', 'Dip a glucose test strip (sold for diabetes care) into each cup.'],
      look: 'The cup with lactase shows glucose; the plain milk shows almost none. The enzyme split lactose into glucose and galactose, the same job β-galactosidase does in E. coli.' }
  ]
},
hardyweinberg: {
  goals: {
    bio: ['What allele frequencies p and q mean', 'How to predict genotypes from allele frequencies: p², 2pq and q²', 'Why many people carry a recessive allele without knowing it'],
    honors: ['The Hardy–Weinberg equation and its five conditions', 'What changes allele frequencies: selection, drift, migration, mutation, nonrandom mating', 'Estimating carriers from the recessive phenotype'],
    ap: ['Testing a population against Hardy–Weinberg with chi-square', 'Distinguishing evolution from no evolution with data', 'Why small populations drift']
  },
  matters: 'Doctors use this math to estimate how many people carry recessive conditions like cystic fibrosis, and conservation biologists use it to watch endangered populations lose genetic variety.',
  startKey: 'start', startRun: false,
  startOverlay(sim,ctx,LH,k){tag(ctx,'100 plants',200,370,k,{s:12,hi:true});tag(ctx,'All their alleles in one pool',600,100,k,{s:12,hi:true});},
  steps: [
    { key: 'pool', title: 'The gene pool', fresh: true, pause: true, focus: [440,40,350,44],
      see: 'Every plant has two alleles for flower color. Pour all 200 alleles into one pool: 70% are A (purple, dominant) and 30% are a (white).',
      why: 'p is the frequency of A and q the frequency of a. Every allele is one or the other, so <b>p + q = 1</b>.',
      overlay(sim,ctx,LH,k){hwC(ctx,k,[['p = '+hwM(sim,'pA')+'   q = '+hwM(sim,'qa'),{s:14,w:800}],['p + q = 1']],LH);} },
    { key: 'square', title: 'Random mating', fresh: true, pause: true, focus: [470,110,320,250],
      see: 'If plants mate at random, each new plant draws two alleles from the pool. The square shows the chances.',
      why: 'AA needs A twice: p × p = p². aa needs a twice: q². Aa can happen two ways (A then a, or a then A): 2pq. So <b>p² + 2pq + q² = 1</b>.',
      overlay(sim,ctx,LH,k){hwC(ctx,k,[['AA = p² = '+hwM(sim,'AA',0)+'%',{s:13,w:800}],['Aa = 2pq = '+hwM(sim,'Aa',0)+'%'],['aa = q² = '+hwM(sim,'aa',0)+'%']],LH);} },
    { key: 'slide', title: 'Change p, change everything', set: { p: 0.6 }, fresh: true, speed: 1, cause: { from: { p: 0.9 }, delay: 1.2, dur: 3 },
      see: 'Watch p slide from 0.90 down to 0.60. The square’s boxes resize and more white flowers appear.',
      why: 'At p = 0.6, q = 0.4, so q² = 16% of plants are white. 2pq = 48% are purple carriers: more than half of the 84 purple plants hide a white allele.',
      overlay(sim,ctx,LH,k){hwC(ctx,k,[['p = '+hwM(sim,'pA')+'   q = '+hwM(sim,'qa'),{s:14,w:800}],['White (aa) = q² = '+hwM(sim,'aa',0)+'%'],['Hidden carriers (Aa) = 2pq = '+hwM(sim,'Aa',0)+'%',{w:800,c:CE_BLUE}]],LH);} },
    { key: 'stable', lvl: 'honors', title: 'No forces, no change', set: { p: 0.6 }, fresh: true, speed: 1, run(sim){dvAct(sim,'gen10');},
      see: 'Ten generations of a large, randomly mating population with no selection, migration or mutation. Watch p: it stays at 0.60.',
      why: 'Shuffling alleles into new plants doesn’t change how many of each there are. Allele frequencies change only when something acts on them; that is what “no evolution” means.',
      overlay(sim,ctx,LH,k){hwC(ctx,k,[['Generation '+hwM(sim,'gen',0),{s:14,w:800}],['p = '+hwM(sim,'pA'),{w:800,c:CE_GREEN}],['Started at 0.60']],LH);} },
    { key: 'select', lvl: 'honors', title: 'Turn on selection', set: { p: 0.6, nosel: false }, fresh: true, speed: 1, cause: { from: { nosel: true }, delay: 1.2, label: 'No natural selection' }, run: atReset,
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.6,'g',s=>dvAct(s,'gen10'));hwC(ctx,k,[[sim.p.nosel?'No selection yet…':'White plants survive half as well',{s:13,w:800,c:sim.p.nosel?PAL['cv-ink']:CE_RED}],['Generation '+hwM(sim,'gen',0)],['p = '+hwM(sim,'pA')+' (started at 0.60)',{w:800,c:CE_GREEN}]],LH);},
      see: 'Selection switches on: white (aa) plants survive only half as well. Watch p climb over ten generations.',
      why: 'Every aa plant that dies takes two a alleles out of the pool, so q falls and p rises. But as a gets rare it hides in Aa carriers, where selection can’t see it, so it is removed more and more slowly.' },
    { key: 'drift', lvl: 'honors', title: 'Small populations drift', set: { p: 0.6, large: false }, fresh: true, speed: 1, cause: { from: { large: true }, delay: 1.2, label: 'Large population' }, run: atReset,
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.6,'g',s=>dvAct(s,'gen10'));hwC(ctx,k,[[sim.p.large?'100 plants':'Only 20 plants',{s:14,w:800}],['Generation '+hwM(sim,'gen',0)],['p = '+hwM(sim,'pA')+' (started at 0.60)',{w:800,c:CE_BLUE}]],LH);},
      see: 'The population shrinks to 20 plants with no selection at all. Run ten generations and watch p wander.',
      why: 'In a small population, which plants happen to reproduce is partly luck, so allele frequencies drift at random. Drift can even lose an allele completely. This is <b>genetic drift</b>.' },
    { key: 'chi', lvl: 'ap', title: 'Testing for evolution', set: { p: 0.6, nosel: false }, fresh: true, speed: 1, run(sim){dvAct(sim,'gen10');},
      see: 'After ten generations with selection, compare the counted genotypes with the Hardy–Weinberg prediction from the current p.',
      why: 'χ² = Σ (O − E)² ÷ E across AA, Aa and aa. With 1 degree of freedom (3 genotypes − 1 − 1 estimated allele frequency), values above 3.84 mean the population is unlikely to be in equilibrium.',
      overlay(sim,ctx,LH,k){hwC(ctx,k,[['Counted: '+String(phM(sim,'obs')),{s:12,w:700}],['χ² = '+hwM(sim,'chi')+' (cutoff 3.84)',{w:800,c:CE_BLUE}]],LH);} }
  ],
  useIt: [
    { do: 'If a recessive condition runs in your family, ask about carrier testing before starting a family.',
      why: 'About 1 in 30 white Americans carry a cystic fibrosis allele (q ≈ 0.017), so most carriers have no idea. Carrier testing is offered because 2pq is far larger than q².' },
    { do: 'Support wildlife corridors and protecting large habitats.',
      why: 'Small, isolated populations lose genetic variety to drift, which can leave them less able to adapt. Corridors let animals move between populations, a kind of migration that restores variety.' },
    { do: 'When a trait is rare, remember that the allele is much more common than the trait.', lvl: 'honors',
      why: 'If 1 in 10,000 people show a recessive trait, q = 0.01, yet 2pq ≈ 2% of people carry it: 200 carriers for every person with the condition.' }
  ],
  tryIt: [
    { title: 'the bead gene pool (15 minutes)',
      steps: ['Put 70 purple and 30 white beads (or paper slips) in a bag: p = 0.7, q = 0.3.', 'Draw two at a time, without looking, to make one “plant”. Record AA, Aa or aa, and put both back.', 'Make 50 plants, then compare your counts with p² = 49%, 2pq = 42% and q² = 9%.'],
      look: 'Your counts land near 25 AA, 21 Aa and 4 or 5 aa. Then make a tiny population of 5 plants several times: the numbers jump around much more. That is drift.' }
  ]
},
evolution: {
  goals: {
    bio: ['How natural selection works: variation, inheritance and survival', 'Why fur color matches the ground for rock pocket mice', 'Why evolution acts on populations, not on individuals'],
    honors: ['Selection changes allele frequencies over generations', 'Genetic drift and migration', 'Why a hidden recessive allele lingers'],
    ap: ['Selection coefficients and the speed of change', 'Selection, drift, migration and mutation together', 'Comparing replicate populations']
  },
  matters: 'The same process explains antibiotic resistance, pests that shrug off pesticides, and the fur of real rock pocket mice on the lava flows of New Mexico and Arizona, studied by biologists like Michael Nachman.',
  startKey: 'start', startRun: true, startSpeed: 0.4,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Dark lava rock',120,300,k,{s:12,hi:true});tag(ctx,'Dark-allele share in 5 populations',600,110,k,{s:12,hi:true});},
  steps: [
    { key: 'vary', title: 'Variation', fresh: true, speed: 0.3,
      see: 'Mice on a dark lava flow. Most have light fur; about 1 in 10 alleles is D, the dark-fur version of the gene.',
      why: 'Mice differ, and fur color is inherited: DD and Dd mice are dark (D is dominant), dd mice are light. Variation that can be inherited is the raw material of natural selection.',
      overlay(sim,ctx,LH,k){evC(ctx,k,[['Dark-fur allele D: '+evD(sim)+'%',{s:14,w:800}],['DD, Dd: dark fur'],['dd: light fur']],LH);} },
    { key: 'hunt', title: 'Owls hunt by sight', fresh: true, speed: 0.3,
      see: 'Slowed down. The owl sweeps over and catches mice. Light mice stand out against dark rock, so they are caught more often.',
      why: 'Whether a mouse is seen depends on its fur and the ground. On lava, dark mice are camouflaged and more of them live to have babies.',
      overlay(sim,ctx,LH,k){evC(ctx,k,[['On dark rock',{s:14,w:800}],['Light mice: easy to see, caught more',{c:CE_RED}],['Dark mice: hidden, survive more',{c:CE_GREEN}]],LH);} },
    { key: 'gens', title: 'Generation after generation', fresh: true, speed: 1,
      see: 'Each second is one generation. Watch the share of dark mice, and the dark allele, climb.',
      why: 'Survivors breed, so each generation inherits more D alleles than the last. No mouse changes its fur; the population changes because some mice leave more offspring than others.',
      overlay(sim,ctx,LH,k){evC(ctx,k,[['Generation '+Math.round(sim.st.g),{s:14,w:800}],['Dark allele D: '+evD(sim)+'%',{w:800,c:CE_GREEN}],['Dark mice: '+Math.round(phM(sim,'dark'))+'%']],LH);} },
    { key: 'flip', title: 'Change the ground', set: { bg: 'lava', p0: 0.5 }, fresh: true, speed: 1, cause: { from: { bg: 'sand' }, delay: 5, label: 'Ground' },
      see: 'Start on light sand with half the alleles dark. For a few generations dark mice lose ground. Then the ground switches to dark lava, and the trend reverses.',
      why: 'Selection depends on the environment. The same dark fur that is a liability on sand is an advantage on lava. Evolution has no goal; it follows whatever survives where the mice live.',
      overlay(sim,ctx,LH,k){evC(ctx,k,[[sim.p.bg==='sand'?'Light sand':'Dark lava',{s:14,w:800}],['Generation '+Math.round(sim.st.g)],['Dark allele D: '+evD(sim)+'%',{w:800,c:sim.p.bg==='sand'?CE_RED:CE_GREEN}]],LH);} },
    { key: 'noowls', title: 'Remove the owls', set: { s: 0, p0: 0.3 }, fresh: true, speed: 1, cause: { from: { s: 0.3 }, delay: 4, label: 'Owl hunting pressure' },
      see: 'Dark mice gain for a few generations, then the owls are taken away. The dark allele stops climbing.',
      why: 'Without a survival difference there is no selection. Allele frequencies then change only by chance, which is small in a population of 200.',
      overlay(sim,ctx,LH,k){evC(ctx,k,[[sim.p.s>0?'Owls hunting':'No owls',{s:14,w:800}],['Generation '+Math.round(sim.st.g)],['Dark allele D: '+evD(sim)+'%',{w:800,c:CE_BLUE}]],LH);} },
    { key: 'drift', lvl: 'honors', title: 'Chance in small populations', set: { s: 0, N: 10, p0: 0.5 }, fresh: true, speed: 1,
      see: 'No owls, and only 10 mice per population. Watch the five bars at the top right: they drift apart, and some hit 0% or 100%.',
      why: 'In a tiny population, luck decides which alleles get passed on. This <b>genetic drift</b> can fix or lose an allele with no selection at all.',
      overlay(sim,ctx,LH,k){evC(ctx,k,[['10 mice per population',{s:14,w:800}],['Spread between populations: '+Math.round(phM(sim,'spread'))+' points',{w:800,c:CE_BLUE}],['Lost or fixed: '+String(phM(sim,'fixed'))+' of 5']],LH);} },
    { key: 'migr', lvl: 'honors', title: 'Migration slows selection', set: { m: 0.1, pm: 0.2 }, fresh: true, speed: 1, cause: { from: { m: 0 }, delay: 3, label: 'Migration rate' },
      see: 'On lava with owls, D climbs. Then migrants from a light-sand population start arriving each generation, bringing d alleles.',
      why: 'Migration (gene flow) mixes populations and pulls allele frequencies toward the migrants’. Selection and migration settle at a balance short of 100% dark.',
      overlay(sim,ctx,LH,k){evC(ctx,k,[[sim.p.m>0?'10% migrants each generation':'No migration',{s:14,w:800}],['Generation '+Math.round(sim.st.g)],['Dark allele D: '+evD(sim)+'%',{w:800,c:CE_GREEN}]],LH);} }
  ],
  useIt: [
    { do: 'Take antibiotics only when prescribed, and finish them as directed.',
      why: 'Each course of antibiotics is a selection event: resistant bacteria survive and multiply, just like dark mice on lava. Unneeded antibiotics select for resistance with no benefit.' },
    { do: 'In a garden, rotate pest controls instead of using the same spray every year.',
      why: 'One spray used over and over selects for resistant pests within a few generations. Rotating methods changes the “ground” so no one trait wins every time.' },
    { do: 'Watch for evolution in the news: drug-resistant infections, herbicide-resistant weeds, new flu strains.', lvl: 'honors',
      why: 'They all follow the same rules you just saw: variation, inheritance and unequal survival, with drift and migration shaping the outcome.' }
  ],
  tryIt: [
    { title: 'the bead predator game (15 minutes)',
      steps: ['Scatter 50 dark and 50 light beans or paper dots on a dark towel.', 'A partner has 15 seconds to pick up as many as possible, one at a time. These are “eaten”.', 'Each survivor “has one baby”: add one of the same color for each survivor. Repeat for 3 rounds and count.'],
      look: 'Light dots get picked first on the dark towel, so dark dots take over in a few rounds. Repeat on a light towel and the opposite happens.' }
  ]
}
});

/* ===== Ecology: population growth and predator–prey ===== */
const PGC=(ctx,k,L)=>dcCard(ctx,k,352,8,290,L,{hi:false});
const PPC=(ctx,k,L)=>dcCard(ctx,k,244,8,264,L,{hi:false});
const pgN=sim=>Math.round(phM(sim,'pop'));
const ppH=sim=>Math.round(phM(sim,'hares')).toLocaleString('en-US'),ppL=sim=>Math.round(phM(sim,'lynx'));
BioLab.addLearn({
popgrowth: {
  goals: {
    bio: ['How births and deaths change a population', 'Why populations with limited food level off at a carrying capacity', 'The difference between J-shaped and S-shaped growth'],
    honors: ['Exponential vs logistic growth', 'How carrying capacity and growth rate shape the curve', 'How a population recovers after a crash'],
    ap: ['dN/dt = rN and dN/dt = rN(1 − N/K)', 'Why growth is fastest at N = K/2', 'Doubling time and density-dependent limits']
  },
  matters: 'Colorado Parks and Wildlife sets the number of deer and elk hunting licenses each year by comparing herd counts with what the land can feed. Fisheries set catch limits the same way, and the same math tracks bacteria in leftovers and invasive species in Colorado lakes.',
  startKey: 'island', startRun: true, startSpeed: 0.3,
  steps: [
    { key: 'grow', title: 'From ten deer to a full island', set: { model: 'logistic', r: 0.5, K: 500, N0: 10 }, fresh: true, speed: 1,
      see: 'Ten deer reach an island with plenty of grass and no wolves. Watch the herd and the gauge on the right.',
      why: 'At first every deer has plenty of food, so births far outnumber deaths and the herd grows faster and faster. As it nears the carrying capacity (K = 500), food per deer runs short, fewer fawns survive and growth slows to zero. The curve is an S.',
      overlay(sim,ctx,LH,k){PGC(ctx,k,[['Deer: '+pgN(sim)+' (carrying capacity 500)',{w:700}],'Food in use: '+Math.round(phM(sim,'food'))+'%']);} },
    { key: 'moreK', title: 'More food, higher ceiling', set: { model: 'logistic', r: 0.5, K: 1000, N0: 10 }, fresh: true, speed: 1,
      cause: { from: { K: 500 }, delay: 2, dur: 2, ring: [740,130,58], at: [175,62], label: 'Carrying capacity' },
      run(sim){sim.st.N=495;},
      see: 'The herd is at its limit, about 500 deer. Watch the carrying capacity jump to 1,000, as if the island had twice the grass.',
      why: 'With more food per deer, births outnumber deaths again and the herd climbs until it reaches the new K. The population is limited by food, not by how fast deer can breed.',
      overlay(sim,ctx,LH,k){PGC(ctx,k,[['K = '+Math.round(sim.p.K)+' deer (was 500)',{w:700,c:CE_RED}],'Deer: '+pgN(sim)]);} },
    { key: 'crash', lvl: 'honors', title: 'A crash, then fast recovery', set: { model: 'logistic', r: 0.5, K: 500, N0: 10 }, fresh: true, speed: 1,
      run(sim){atReset(sim);sim.st.N=495;sim._pgW=null;},
      see: 'A full island of about 500 deer. Watch a disease kill 70% of them.',
      why: 'After the crash, food is plentiful again, so each survivor has more young and the herd grows quickly, faster than it did near K. Growth is density dependent: it speeds up when the population is small compared with its food.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,2,'d',s=>{dvAct(s,'disease');s._pgW=pgN(s);});PGC(ctx,k,sim._pgW==null?[['Deer: '+pgN(sim),{w:700}],'Watch…']:[['Disease: 495 → '+sim._pgW+' deer',{w:700,c:CE_RED}],'Now: '+pgN(sim)+' and climbing']);} },
    { key: 'exp', lvl: 'honors', title: 'Take away the limit', set: { model: 'exp', r: 0.5, K: 500, N0: 10 }, fresh: true, speed: 1,
      cause: { from: { model: 'logistic' }, delay: 2.5, at: [175,62], label: 'Growth model' },
      run(sim){sim.st.N=300;},
      see: 'A herd of 300 heading for K. Watch the food limit get switched off.',
      why: 'With unlimited food, births keep outpacing deaths by the same fraction every year, so the herd adds more deer each year than the year before: exponential growth, the J-curve. No real population keeps it up for long.',
      overlay(sim,ctx,LH,k){PGC(ctx,k,[[sim.p.model==='exp'?'Unlimited food: J-curve':'Limited food: heading for K',{w:700,c:sim.p.model==='exp'?CE_RED:PAL['cv-ink']}],'Deer: '+pgN(sim)]);} },
    { key: 'half', lvl: 'ap', title: 'Fastest at K/2', set: { model: 'logistic', r: 0.5, K: 500, N0: 10 }, fresh: true, speed: 0.6,
      run(sim){sim.st.N=60;},
      see: 'Watch dN/dt, the deer added per year, as the herd passes 250.',
      why: 'dN/dt = rN(1 − N/K). Small N means few parents; N near K means little food. The product peaks at N = K/2: 0.5 × 250 × 0.5 = 62.5 deer per year. Managers aim to keep harvested populations near K/2 for the largest sustainable yield.',
      overlay(sim,ctx,LH,k){PGC(ctx,k,[['Deer: '+pgN(sim),{w:700}],['dN/dt: '+phM(sim,'dndt').toFixed(1)+' deer/year (max 62.5)',{c:CE_RED}]]);} }
  ],
  useIt: [
    { do: 'Put leftovers in the fridge within 2 hours.',
      why: 'Bacteria on warm food grow exponentially, doubling as often as every 20 minutes. Cold slows r so much that the J-curve barely starts.' },
    { do: 'Don’t release pet fish, turtles or plants into the wild.',
      why: 'With no predators and plenty of food, a released species can grow like the unlimited-food herd and crowd out native species. That is how many invasive species started.' },
    { do: 'Look up the bag limit before you go fishing or hunting.', lvl: 'honors',
      why: 'Limits are set so the population stays near K/2, where it adds the most young each year and can be harvested without shrinking.' }
  ],
  tryIt: [
    { title: 'the yeast balloon (1 hour)',
      steps: ['Mix 1 packet of yeast and 1 tablespoon of sugar into 1 cup of warm water in a bottle.', 'Stretch a balloon over the mouth.', 'Measure around the balloon every 10 minutes for an hour.'],
      look: 'Slow at first, then faster and faster as the yeast multiply, then slower as the sugar runs out. Plot it and you get the S-curve.' }
  ]
},
predprey: {
  goals: {
    bio: ['How predators and prey affect each other’s numbers', 'Why their populations rise and fall in cycles', 'Why predator numbers lag behind prey numbers'],
    honors: ['How birth rate, hunting success and carrying capacity change the cycle', 'Top-down and bottom-up control', 'What happens when people remove predators'],
    ap: ['The Lotka–Volterra model and its balance point', 'Reading a phase plot', 'Density-dependent growth for the prey']
  },
  matters: 'Colorado brought Canada lynx back to the San Juan Mountains starting in 1999, and released gray wolves in late 2023. Whether those predators thrive, and what happens to the deer, elk and hares they eat, follows these linked rises and falls. Removing a predator often backfires.',
  startKey: 'forest', startRun: true, startSpeed: 0.4,
  steps: [
    { key: 'cycle', title: 'Hares up, then lynx up', fresh: true, speed: 1,
      see: 'Watch the hare and lynx counts at the top right as the years go by.',
      why: 'When hares are plentiful, lynx eat well and raise more kittens, so lynx rise a little after the hares. Then so many lynx hunt that hares crash, and the hungry lynx crash after them. With few lynx, hares recover and the cycle starts over, about every 10 years.',
      overlay(sim,ctx,LH,k){PPC(ctx,k,[['Hares: '+ppH(sim),{w:700}],['Lynx: '+ppL(sim),{w:700}]]);} },
    { key: 'trap', title: 'Trap half the lynx', fresh: true, speed: 1,
      run(sim){atReset(sim);sim.st.H=6;sim.st.L=36;sim._ppW=null;},
      see: 'Hares are scarce and lynx are many. Watch trappers remove half the lynx.',
      why: 'Fewer hunters means more hares survive to breed, so hares boom soon after. More hares then feed a lynx comeback. Removing predators doesn’t keep their numbers down for long, and it changes the prey too.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,2,'t',s=>{s._ppW=ppL(s);dvAct(s,'trap');});PPC(ctx,k,sim._ppW==null?[['Lynx: '+ppL(sim),{w:700}],'Hares: '+ppH(sim)]:[['Lynx: '+ppL(sim)+' (was '+sim._ppW+')',{w:700,c:CE_RED}],'Hares: '+ppH(sim)]);} },
    { key: 'hunt', title: 'Better hunters', set: { hunt: 160 }, fresh: true, speed: 1,
      cause: { from: { hunt: 100 }, delay: 2, dur: 2, at: [420,72], label: 'Lynx hunting success' },
      see: 'Watch the lynx get 60% better at catching hares, as if deep snow made hares easier to catch.',
      why: 'Each lynx now eats more hares, so hares crash lower and faster. That starves the lynx sooner, so the lynx crash follows. A stronger predator makes the swings bigger, not just the prey smaller.',
      overlay(sim,ctx,LH,k){PPC(ctx,k,[['Hunting '+Math.round(sim.p.hunt)+'% (was 100%)',{w:700,c:CE_RED}],'Hares: '+ppH(sim)+'   Lynx: '+ppL(sim)]);} },
    { key: 'kcap', lvl: 'honors', title: 'Food limits the hares too', set: { K: 12 }, fresh: true, speed: 1.5,
      cause: { from: { K: 20 }, delay: 3, dur: 2, at: [420,72], label: 'Carrying capacity for hares' },
      run(sim){sim.st.H=5;sim.st.L=0.3;},
      see: 'Almost no lynx left. Watch the hares climb, then watch their food supply shrink.',
      why: 'Without predators, hares still can’t grow forever: they level off at the carrying capacity set by twigs and bark. Cut the food and the ceiling drops. Prey are controlled from below (food) as well as from above (predators).',
      overlay(sim,ctx,LH,k){PPC(ctx,k,[['Hare limit '+Math.round(sim.p.K)+',000 (was 20,000)',{w:700,c:CE_RED}],'Hares: '+ppH(sim)]);} }
  ],
  useIt: [
    { do: 'Leave spiders, ladybugs and garden snakes alone.',
      why: 'They are predators of the pests that eat your plants and stored food. Killing them lets the prey boom, just like trapping lynx.' },
    { do: 'Keep cats indoors or supervised outside.',
      why: 'Pet cats are a predator with no natural limit: their food comes from you, not from their prey. Outdoor cats kill more than a billion birds a year in the US.' },
    { do: 'Read about the Yellowstone wolves when people argue about predators.', lvl: 'honors',
      why: 'Wolves returned in 1995 and cut elk numbers, which let streamside willows and aspens regrow. One predator changed the whole food web.' }
  ],
  tryIt: [
    { title: 'the hare and lynx card game (15 minutes)',
      steps: ['Cut 3 cm paper squares (hares) and one 8 cm square (a lynx). Scatter 3 hares on a table marked as a 60 cm square.', 'Toss the lynx square; it eats every hare it touches. It needs 3 hares to survive and has one kitten for every 3 more. Surviving hares double each round.', 'Play 15 rounds and graph hares and lynx.'],
      look: 'Hares rise first, lynx follow, hares crash, and lynx crash after them: the same lagging cycle as the simulation.' }
  ]
}
});

/* ---------- Soil lab ---------- */
BioLab.addLearn((function(){
const SLT={x:470,y:390,w:300};SLT.h=SLT.w*Math.sqrt(3)/2;
const slP=(S,Si,C)=>[(S*SLT.x+Si*(SLT.x+SLT.w)+C*(SLT.x+SLT.w/2))/100,(S*SLT.y+Si*SLT.y+C*(SLT.y-SLT.h))/100];
const slTj=sim=>Math.max(0,sim.t-sim.st.shakeT);
const slAct=(sim,id)=>{const a=(sim.def.actions||[]).find(a=>a.id===id);if(a)a.run(sim);};
function slDash(ctx,a,b,f,col){ctx.save();ctx.strokeStyle=col;ctx.lineWidth=3.2;ctx.setLineDash([7,5]);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(lerp(a[0],b[0],f),lerp(a[1],b[1],f));ctx.stroke();ctx.restore();}
function slDot(ctx,x,y,r,col){ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fillStyle=col;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();ctx.restore();}
function slRing(ctx,x,y,r){ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.stroke();ctx.restore();}
/* a quartz sand grain: irregular, rounded, pale tan */
function slGrain(ctx,x,y,r,seed,fill){ctx.save();ctx.beginPath();for(let i=0;i<=24;i++){const a=i/24*6.283,q=0.9+0.07*Math.sin(i*2.1+seed*1.3)+0.04*Math.sin(i*4.7+seed*2.9);const px=x+Math.cos(a)*r*q,py=y+Math.sin(a)*r*q*0.9;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}
  ctx.closePath();ctx.fillStyle=fill||'#d9c49a';ctx.fill();ctx.strokeStyle='rgba(90,70,40,.55)';ctx.lineWidth=1.2;ctx.stroke();
  if(r>12){ctx.beginPath();ctx.ellipse(x-r*0.3,y-r*0.32,r*0.22,r*0.12,-0.5,0,6.29);ctx.fillStyle='rgba(255,255,255,.45)';ctx.fill();}ctx.restore();}
/* a zoom bubble showing the pores between grains, with water moving through at its own pace */
function slBubble(ctx,cx,cy,R,kind,tau,k){ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fillStyle='#eef5fb';ctx.fill();ctx.clip();
  if(kind==='sand'){const g=[[-30,-34],[22,-38],[-44,6],[2,-2],[44,4],[-24,40],[24,42],[-2,-62],[58,-34],[-60,-30]];g.forEach((p,i)=>slGrain(ctx,cx+p[0],cy+p[1],21,i,'#dcc48e'));
    ctx.fillStyle='#2f78c8';for(let i=0;i<6;i++){const y=cy-R+((tau*70+i*26)%(2*R)),x=cx+[-12,10,-35,34,-8,22][i];ctx.beginPath();ctx.arc(x,y,3.4,0,6.29);ctx.fill();}}
  else{ctx.strokeStyle='#7d5a4a';ctx.lineWidth=2.4;for(let r=-R;r<R;r+=6.5)for(let c=-R;c<R;c+=15){const o=((r/6.5)|0)%2?7:0;ctx.beginPath();ctx.moveTo(cx+c+o,cy+r);ctx.lineTo(cx+c+o+11,cy+r+0.8);ctx.stroke();}
    ctx.fillStyle='#2f78c8';for(let i=0;i<5;i++){const y=cy-R+((tau*6+i*24)%(2*R)),x=cx+[-20,6,30,-36,16][i];ctx.beginPath();ctx.arc(x,y,2.6,0,6.29);ctx.fill();}}
  ctx.restore();ctx.save();ctx.lineWidth=2.5;ctx.strokeStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.stroke();ctx.restore();}
/* a crop plant: leafy top above ground, roots below */
function slPlant(ctx,x,g,rootD,ok){ctx.save();ctx.strokeStyle=ok?'#6b5a3a':'#7a6a52';ctx.lineWidth=1.4;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x,g);ctx.quadraticCurveTo(x+i*7,g+rootD*0.5,x+i*13,g+rootD);ctx.stroke();}
  ctx.strokeStyle=ok?'#3f8a2e':'#8a8a3a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,g);ctx.lineTo(x,g-34);ctx.stroke();ctx.fillStyle=ok?'#4f9a36':'#9aa04a';
  [[-12,-22],[12,-26],[-10,-36],[10,-40],[0,-46]].forEach(l=>{ctx.beginPath();ctx.ellipse(x+l[0],g+l[1],10,5,l[0]<0?-0.5:0.5,0,6.29);ctx.fill();});ctx.restore();}
function slField(ctx,x0,w,kind,tau,k){const g=178,bot=410,soil=kind==='sand'?'#c9a86a':'#8c5a3c';
  ctx.fillStyle='#dbe9f4';ctx.fillRect(x0,60,w,g-60);ctx.fillStyle=soil;ctx.fillRect(x0,g,w,bot-g);
  const r=H.rng(kind==='sand'?3:8);ctx.fillStyle='rgba(0,0,0,.13)';for(let i=0;i<260;i++){const s=kind==='sand'?2.6:1.2;ctx.fillRect(x0+r()*w,g+r()*(bot-g),s,s);}
  const rootD=kind==='sand'?92:62;[0.2,0.5,0.8].forEach(f=>slPlant(ctx,x0+w*f,g,rootD,kind==='sand'));
  ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x0,g+rootD+6);ctx.lineTo(x0+w,g+rootD+6);ctx.stroke();ctx.restore();
  H.txt(ctx,'bottom of the roots',x0+w-8,g+rootD+20,{s:11*k,w:600,a:'right',c:'#fff'});
  if(kind==='sand'){ctx.fillStyle='#777';ctx.fillRect(x0+10,96,w-20,6);ctx.fillStyle='#2f78c8';
    for(let i=0;i<14;i++){const x=x0+18+i*(w-36)/13,y=104+((tau*90+i*17)%(g-104));ctx.beginPath();ctx.arc(x,y,2.6,0,6.29);ctx.fill();}
    for(let i=0;i<12;i++){const x=x0+20+i*(w-40)/11,y=g+((tau*55+i*41)%(bot-g-6));ctx.fillStyle='#2f78c8';ctx.beginPath();ctx.arc(x,y,3,0,6.29);ctx.fill();
      const fy=g+((tau*55+i*41+20)%(bot-g-6)),below=fy>g+rootD+6;ctx.fillStyle=below?'#c8102e':'#e06a00';ctx.beginPath();ctx.arc(x+8,fy,3.8,0,6.29);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();}}
  else{ctx.fillStyle='rgba(47,120,200,.75)';[[0.32,46],[0.66,40]].forEach(p=>{ctx.beginPath();ctx.ellipse(x0+w*p[0],g-1,p[1],5,0,0,6.29);ctx.fill();});
    ctx.fillStyle='#2f78c8';for(let i=0;i<10;i++){const x=x0+24+i*(w-48)/9,y=g+4+((tau*9+i*31)%150);ctx.beginPath();ctx.arc(x,y,2.6,0,6.29);ctx.fill();}
    const py=g+170;ctx.fillStyle='#9a9a9a';H.rr(ctx,x0+8,py-8,w-16,16,8);ctx.fill();ctx.fillStyle='#555';for(let xx=x0+20;xx<x0+w-16;xx+=18){ctx.beginPath();ctx.arc(xx,py,2,0,6.29);ctx.fill();}
    ctx.fillStyle='#2f78c8';for(let i=0;i<7;i++){const x=x0+12+((tau*60+i*(w/7))%(w-24));ctx.beginPath();ctx.arc(x,py,3,0,6.29);ctx.fill();}
    H.txt(ctx,'buried drain pipe → ditch',x0+w-12,py-14,{s:11.5*k,w:700,a:'right',c:'#fff'});}}
const SAMPLE_PTS=[['Sandy riverbank',88,7,5,'#b89a68'],['Front Range garden',65,22,13,'#8a6a48'],['Garden loam',40,40,20,'#6b4a2e'],['Clay subsoil',20,25,55,'#8c5a3c']];
return {soil:{
  goals:{
    bio:['What soil is made of: sand, silt and clay','How to name a soil with the texture triangle','Why the name tells you how fast water drains and how much the soil holds','What that means for a farmer, a lawn and a house'],
    honors:['What soil is made of: sand, silt and clay','How to name a soil with the texture triangle','Why the name tells you how fast water drains and how much the soil holds','What that means for a farmer, a lawn and a house','How slope and plant cover change erosion'],
    ap:['What soil is made of: sand, silt and clay','How to name a soil with the texture triangle','Why the name tells you how fast water drains and how much the soil holds','What that means for a farmer, a lawn and a house','How slope and plant cover change erosion','How compost and clay hold nutrients (CEC)']},
  matters:'Every farm, lawn, sports field and house sits on soil. Its mix of sand, silt and clay decides how often it needs water, whether crops drown in a wet spring, and whether Front Range clay will crack a driveway.',
  startKey:'start',startRun:true,startSpeed:2,
  steps:[
    {key:'grains',title:'Three sizes of grain',pause:true,
     see:'Soil is mostly rock broken into grains of three sizes. Watch them appear, drawn to scale and magnified 400 times.',
     why:'<b>Sand</b> (0.05 to 2 mm) is big enough to see and feels gritty. <b>Silt</b> (0.002 to 0.05 mm) feels smooth, like flour. <b>Clay</b> (under 0.002 mm) is made of tiny flat plates and feels sticky when wet. If a sand grain were a basketball, a silt grain would be a pea and a clay particle a grain of salt.',
     overlay(sim,ctx,LH,k,tau){dim(ctx,LH,0.96);tag(ctx,'The three grain sizes, to scale (400× magnified)',400,34,k);
       if(tau>0.3){slGrain(ctx,180,205,100,2);tag(ctx,'Sand · 0.5 mm',180,338,k,{w:700});tag(ctx,'feels gritty',180,372,k,{s:12.5});}
       if(tau>1.8){slDot(ctx,420,205,4,'#a07a52');slRing(ctx,420,205,16);tag(ctx,'Silt · 0.02 mm',420,338,k,{w:700});tag(ctx,'feels smooth, like flour',420,372,k,{s:12.5});}
       if(tau>3.3){ctx.fillStyle='#7f6a5c';ctx.fillRect(649.5,204.5,1.2,1.2);slRing(ctx,650,205,12);tag(ctx,'Clay · 0.001 mm',650,338,k,{w:700});tag(ctx,'feels sticky when wet',650,372,k,{s:12.5});}
       if(tau>4.8){ctx.save();ctx.beginPath();ctx.arc(690,130,46,0,6.29);ctx.fillStyle='#f4efe9';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=PAL['cv-ink'];ctx.stroke();ctx.strokeStyle='#7d5a4a';ctx.lineWidth=4;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(662+(i%2)*6,112+i*9);ctx.lineTo(712+(i%2)*6,112+i*9);ctx.stroke();}ctx.restore();line(ctx,668,172,654,198);H.txt(ctx,'50× more: flat plates',690,92,{s:11*k,w:700,a:'center'});}
       scaleBar(ctx,40,420,40,'0.1 mm',k);}},
    {key:'shake',title:'Shake the jar: sand falls first',speed:0.04,focus:[236,40,214,400],
     run(sim){sim.st.shakeT=sim.t;},
     see:'Your garden sample has been shaken in a jar of water so every grain floats free. The clock runs about 2 minutes every second.',
     why:'Big, heavy sand grains sink fastest, so a sand layer forms on the bottom in about a minute. The tiny silt and clay grains are still swirling, so the water stays cloudy.',
     so:{honors:'A grain’s sinking speed rises with the square of its width. Sand about 1,000 times wider than clay sinks roughly a million times faster.'},
     overlay(sim,ctx,LH,k){const tj=slTj(sim);dcCard(ctx,k,478,60,300,[[Math.round(tj*60)+' minutes after shaking',{w:700}],tj>0.04?['Sand is down: big grains sink fastest',{c:CE_RED}]:'Watch the bottom of the jar']);}},
    {key:'wait',title:'Silt, then clay, settle',speed:3,focus:[236,40,214,400],
     run(sim){sim.st.shakeT=sim.t;},
     see:'Now the clock runs 3 hours every second. Watch silt build a layer on top of the sand, and the cloudy water slowly clear.',
     why:'Silt settles over a few hours. Clay plates are so small that the water keeps bumping them around, so they can stay floating for a day or more. That is why a creek stays brown long after a storm. To measure the layers you wait a day or two.',
     overlay(sim,ctx,LH,k){const tj=slTj(sim);dcCard(ctx,k,478,60,300,[[(tj<1?Math.round(tj*60)+' minutes':tj.toFixed(0)+' hours')+' after shaking',{w:700}],tj<3?'Silt is settling on the sand':tj<30?['Water still cloudy: clay is still floating',{c:CE_RED}]:'Water clearing: clay has settled']);}},
    {key:'read',title:'Name the soil with the triangle',speed:0.5,focus:[450,90,345,330],
     run(sim){sim.st.shakeT=sim.t-200;},
     see:'The jar has settled: 40% sand, 40% silt and 20% clay. Watch each percentage become a line on the triangle.',
     why:'Clay is read straight across from the left edge. Silt is read down and to the left from the right edge. Sand is read up and to the left from the bottom. Where the three lines meet, the colored region names the soil: <b>Loam</b>.',
     overlay(sim,ctx,LH,k,tau){const pt=slP(40,40,20),f=t=>clamp((tau-t)/1.4,0,1);
       slDash(ctx,slP(80,0,20),pt,f(0.6),'#1f5fbf');slDash(ctx,slP(0,40,60),pt,f(2.4),'#1b7a3a');slDash(ctx,slP(40,60,0),pt,f(4.2),'#b3261e');
       if(tau>6)slRing(ctx,pt[0],pt[1],16);
       dcCard(ctx,k,14,40,214,[['Reading the triangle',{w:700}],tau>0.6?['1. Clay 20%: straight across',{c:'#1f5fbf',w:700}]:'',tau>2.4?['2. Silt 40%: down and left',{c:'#1b7a3a',w:700}]:'',tau>4.2?['3. Sand 40%: up and left',{c:'#b3261e',w:700}]:'',tau>6?['4. They meet in Loam',{w:800}]:''].filter(Boolean),{hi:false});}},
    {key:'compare',title:'Different soils land in different places',speed:0.5,focus:[450,90,345,330],
     run(sim){sim.st.shakeT=sim.t-200;},
     see:'Four real soils are placed on the triangle one at a time: a sandy riverbank, a Front Range garden, your garden loam and a clay subsoil.',
     why:'Each mix of sand, silt and clay lands in its own region, so each gets its own name. The name is useful because soils in the same region act alike: they drain at about the same speed and hold about the same water.',
     overlay(sim,ctx,LH,k,tau){SAMPLE_PTS.forEach((s,i)=>{if(tau<0.8+i*1.6)return;const q=slP(s[1],s[2],s[3]);slDot(ctx,q[0],q[1],7,s[4]);});
       dcCard(ctx,k,14,40,214,[['Where each soil lands',{w:700}]].concat(SAMPLE_PTS.filter((s,i)=>tau>=0.8+i*1.6).map(s=>[s[0]+': '+s[1]+'/'+s[2]+'/'+s[3],{s:12}])).concat([['(sand / silt / clay %)',{s:11,c:PAL['cv-soft']}]]),{hi:false});}},
    {key:'drain',title:'Why sand drains and clay holds',set:{mode:'drain'},speed:0.3,
     run(sim){atReset(sim);sim.st.poured=false;},
     see:'Three columns: sand, your loam and clay. Watch 100 mL of water poured on each, and the zoomed-in views of the gaps between grains.',
     why:'Water flows through the gaps between grains. Sand’s gaps are big, so water rushes through in minutes and only about 10 mL stays behind. Clay’s gaps are tiny, so water crawls through over hours, and its huge surface of flat plates holds on to about 43 mL.',
     so:'This is why the name matters. Sandy soil dries out fast and needs water more often. Clay soil stays wet and can go soggy.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.2,'pour',s=>{s.st.poured=true;s.st.pourT=s.t;});
       slBubble(ctx,275,170,52,'sand',tau,k);line(ctx,236,150,206,150);tag(ctx,'Sand: big gaps',275,240,k,{s:13});
       slBubble(ctx,525,170,52,'clay',tau,k);line(ctx,564,150,594,150);tag(ctx,'Clay: tiny gaps',525,240,k,{s:13});}},
    {key:'hook',title:'Your question: the sandy garden bed',set:{mode:'drain',sample:'front'},speed:0.3,focus:[335,55,130,385],
     run(sim){atReset(sim);sim.st.poured=false;},
     see:'The middle column is now the Front Range sandy loam garden bed from the question, 65% sand. Watch the same 100 mL go in.',
     why:'The sandy loam keeps about <b>22 mL</b> for roots and lets about 78 mL drain, most of it within half an hour. Sand keeps about 10 mL and clay about 43 mL. Sandy loam sits between them, closer to sand.',
     so:'Water this bed a little and often. A big soaking once a week mostly drains past the roots.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1,'pour',s=>{s.st.poured=true;s.st.pourT=s.t;});}},
    {key:'farm',title:'What it means on a farm',pause:true,
     see:'Two farm fields after the same watering. Left: sandy soil. Right: clay soil. Blue dots are water; orange dots are fertilizer.',
     why:'In sand, water and fertilizer race down past the bottom of the roots (they turn red when they are lost). In clay, water sits on top and soaks in slowly, and soggy soil leaves roots short of the air they need.',
     so:'<b>Sandy farm:</b> irrigate often and fertilize in small doses so it isn’t washed away. Loose sand is good for root crops like potatoes and carrots. <b>Clay farm:</b> the soil holds plenty of water and nutrients, but fields stay wet and cold in spring, so planting waits. Farmers bury drain pipes to dry fields out, and keep tractors off wet clay, which packs it hard.',
     overlay(sim,ctx,LH,k,tau){dim(ctx,LH,0.97);slField(ctx,20,370,'sand',tau,k);slField(ctx,410,370,'clay',tau,k);
       tag(ctx,'Sandy field',205,34,k,{w:700});tag(ctx,'Clay field',595,34,k,{w:700});
       tag(ctx,'Water and fertilizer wash past the roots',205,432,k,{s:12.5,c:CE_RED});tag(ctx,'Water sits; soggy roots run short of air',595,432,k,{s:12.5,c:CE_RED});}},
    {key:'erode',lvl:'honors',title:'Rain on bare soil',set:{mode:'erosion',cover:false,slope:15},speed:1,fresh:true,
     see:'A bare, plowed field on a 15% slope in a heavy storm. Watch the muddy runoff and the soil piling up in the collector.',
     why:'Raindrops knock grains loose. Rain that can’t soak in becomes runoff and carries them downhill. It takes hundreds of years to build 2.5 cm of topsoil, and one storm can strip it off bare ground.'},
    {key:'cover',lvl:'honors',title:'Plant cover holds the soil',set:{mode:'erosion',cover:true,slope:15},speed:1,fresh:true,
     cause:{from:{cover:false},delay:2,ring:[330,230,140],at:[175,62],label:'Plant cover'},
     see:'Same field and storm. Watch grass cover switch on.',
     why:'Leaves break the force of the raindrops, roots hold soil in place, and covered soil soaks up more water, so far less runs off. In this model, cover cuts soil loss about 50 times. That is why farmers plant cover crops and leave crop stubble over winter.'},
    {key:'compost',lvl:'ap',title:'Compost holds nutrients',set:{sample:'forest'},speed:0.5,
     run(sim){atReset(sim);sim.st.shakeT=sim.t-200;sim._slC0=null;},
     see:'The acidic forest soil, 20% clay and 6% organic matter. Watch compost get added.',
     why:'Clay plates and humus (decayed organic matter) carry negative charges that hold positive nutrient ions like Ca²⁺, K⁺ and Mg²⁺ so rain can’t wash them away. CEC ≈ 0.5 × %clay + 2 × %OM, so each 1% of organic matter adds about four times as much as 1% clay.',
     overlay(sim,ctx,LH,k,tau){if(sim._slC0==null)sim._slC0=sim.st.om;atT(sim,tau,2,'c',s=>slAct(s,'compost'));const om=sim.st.om,c0=0.5*20+2*sim._slC0,c=0.5*20+2*om;
       dcCard(ctx,k,478,60,300,[['Organic matter: '+sim._slC0.toFixed(0)+'% → '+om.toFixed(0)+'%',{w:700}],['Nutrient-holding (CEC): '+c0.toFixed(0)+' → '+c.toFixed(0)+' cmol/kg',{c:c>c0?CE_RED:PAL['cv-ink'],w:700}]]);}}
  ],
  useIt:[
    {do:'Do the squeeze test on a handful of damp soil from your yard, a park or a school planter.',
     why:'Gritty and it falls apart: sandy. Smooth like flour: silty. Sticky, and it pushes out into a long ribbon between your thumb and finger: clay. Gardeners and farmers use this 30-second test to estimate texture without a lab.'},
    {do:'Water to match the soil: sandy soil a little and more often, clay soil slowly and less often.',
     why:'Sand drains in minutes, so one big soaking mostly runs past the roots. Clay drains slowly, so fast watering puddles and runs off before it soaks in.'},
    {do:'Make sure gutters and downspouts send water at least a few feet away from your house.',
     why:'Much of the Front Range sits on clay that swells when wet and shrinks when dry. Water pooling against a foundation makes the clay swell and can crack basements, driveways and sidewalks.'},
    {do:'On a muddy trail, walk straight through the mud or turn back. Don’t step around it.',
     why:'Wet clay-rich soil packs and ruts easily. Stepping around the mud tramples the plants at the edge and widens the trail, which is why trail crews ask hikers and bikers to stay off muddy trails.'}],
  tryIt:[{title:'the jar test (2 days)',
    steps:['Fill a clear jar about one-third with soil from your yard, with rocks and roots picked out.','Add water to near the top and a squirt of dish soap, which helps clay grains separate.','Shake hard for 3 minutes, then set it down.','Mark the top of the bottom layer after 1 minute (sand), after 2 hours (silt), and after 2 days (clay).'],
    look:'Measure each layer’s height as a percentage of the total, then find your soil on the texture triangle. The name tells you how to water it.'}]
}};
})());

/* ---------- Seasons ---------- */
BioLab.addLearn((function(){
const OC={x:218,y:245,rx:152,ry:80};
const snD=sim=>((sim.st.d0+sim.t)%365+365)%365;
const snJump=(sim,day)=>{sim.st.d0=day-sim.t;};
const snE=sim=>{const ph=Math.PI+2*Math.PI*(snD(sim)-171)/365;return [OC.x+OC.rx*Math.cos(ph),OC.y-OC.ry*Math.sin(ph)];};
const snM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const snDate=d=>{const M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],L=[31,28,31,30,31,30,31,31,30,31,30,31];d=Math.floor(d);let m=0;while(m<11&&d>=L[m]){d-=L[m];m++;}return M[m]+' '+(d+1);};
function snRing(ctx,x,y,r){ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.stroke();ctx.restore();}
function snBox(ctx,x,y,w,h){ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=2.5;H.rr(ctx,x,y,w,h,8);ctx.stroke();ctx.restore();}
/* June first, then December partway through the step, so the student sees the before and the after */
const flip=(t)=>({run(sim){atReset(sim);snJump(sim,171);},
  pre(sim,tau){atT(sim,tau,t,'dec',s=>snJump(s,354));return tau>=t;}});
const F1=flip(3.5),F2=flip(3.5),F3=flip(3.5);
return {seasons:{
  goals:{
    bio:['Why the tilt of Earth’s axis, not its distance from the Sun, causes the seasons','How a high Sun and a low Sun spread the same sunlight differently','Why the equator barely has seasons and the Arctic has months of darkness','How to use the Sun’s angle in your own life'],
    honors:['Why the tilt of Earth’s axis, not its distance from the Sun, causes the seasons','How a high Sun and a low Sun spread the same sunlight differently','Why the equator barely has seasons and the Arctic has months of darkness','How uneven heating drives the winds that place rainforests and deserts','How to use the Sun’s angle in your own life'],
    ap:['Why the tilt of Earth’s axis, not its distance from the Sun, causes the seasons','How a high Sun and a low Sun spread the same sunlight differently','Why the equator barely has seasons and the Arctic has months of darkness','How uneven heating drives the Hadley cells, and how the Coriolis effect bends the winds','How to use the Sun’s angle in your own life']},
  matters:'The Sun’s angle decides more than the weather: which way solar panels face, which ski runs keep their snow, how bad the glare is on your drive home in December, and why rainforests and deserts sit where they do.',
  startKey:'start',startRun:true,startSpeed:1,
  steps:[
    {key:'orbit',title:'One trip around the Sun',speed:1,focus:[0,40,425,400],
     see:'Earth travels around the Sun once a year. Watch its axis, the black line through the poles.',
     why:'The axis is tilted 23.5° and always points the same way in space, toward the North Star, wherever Earth is in its orbit. So for half the year the north half of Earth leans toward the Sun, and for the other half it leans away.',
     overlay(sim,ctx,LH,k){const e=snE(sim);snRing(ctx,e[0],e[1],34);tag(ctx,'Axis always points the same way',218,62,k);}},
    {key:'june',title:'June: the north leans toward the Sun',pause:true,focus:[0,40,425,400],
     run(sim){snJump(sim,171);},
     see:'Earth on the June solstice. The north end of the axis tips toward the Sun, and the red dot (Denver) is in the lit half most of the day.',
     why:'Leaning in puts the Sun high over the Northern Hemisphere. At noon the Sun is directly overhead at 23.5° N, the Tropic of Cancer. It is summer in the north and winter in Australia and Argentina.',
     overlay(sim,ctx,LH,k){const e=snE(sim);snRing(ctx,e[0],e[1],34);tag(ctx,'North Pole tips toward the Sun',e[0]+80,e[1]-62,k,{hi:true});}},
    {key:'angle',title:'High Sun vs low Sun',focus:[430,40,370,215],pause:true,
     run:F1.run,
     see:'Denver’s noon Sun on June 21. Watch it jump to December 21 and look at the orange patch of ground the same beam lights.',
     why:'In June the Sun is 74° up, so the beam lands on a small patch and its energy is concentrated. In December it is only 27° up, so the same beam spreads over more than twice as much ground (2.2×), and each square meter gets less than half the energy. Shine a flashlight straight down, then tip it: same light, bigger, dimmer spot.',
     overlay(sim,ctx,LH,k,tau){const dec=F1.pre(sim,tau);snBox(ctx,436,190,358,52);dcCard(ctx,k,14,48,250,[[dec?'Dec 21':'Jun 21',{w:800}],['Noon Sun: '+snM(sim,'angle').toFixed(0)+'° up',{w:700,c:dec?CE_RED:PAL['cv-ink']}],['Beam spread over '+(1/Math.sin(snM(sim,'angle')*Math.PI/180)).toFixed(1)+'× the ground',{c:dec?CE_RED:PAL['cv-ink']}]]);}},
    {key:'daylen',title:'Long days vs short days',focus:[430,250,370,70],pause:true,
     run:F2.run,
     see:'Watch the yellow daylight bar when the date jumps from June 21 to December 21.',
     why:'Leaning toward the Sun, Denver spends more of each spin in the lit half of Earth: about 15 hours of daylight. Leaning away, it spends less: about 9 hours. Fewer hours of sun means fewer hours of heating and longer nights to cool off.',
     overlay(sim,ctx,LH,k,tau){const dec=F2.pre(sim,tau);dcCard(ctx,k,14,48,250,[[dec?'Dec 21':'Jun 21',{w:800}],['Daylight: '+snM(sim,'daylen').toFixed(1)+' hours',{w:700,c:dec?CE_RED:PAL['cv-ink']}]]);}},
    {key:'distance',title:'Closest to the Sun in January',focus:[0,40,425,400],pause:true,
     run(sim){atReset(sim);snJump(sim,184);},
     see:'Earth on July 4, when it is farthest from the Sun. Watch it jump to January 3, when it is closest.',
     why:'Earth’s orbit is almost a circle. The distance only changes from about 152 to 147 million km, about 3%. That changes sunlight by only about 7%, far less than the tilt does. Denver is in winter while Earth is closest, so distance cannot be what causes the seasons.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,3.5,'jan',s=>snJump(s,2));const jan=tau>=3.5,e=snE(sim);snRing(ctx,e[0],e[1],34);
       dcCard(ctx,k,452,48,330,[[jan?'Jan 3: closest to the Sun':'Jul 4: farthest from the Sun',{w:800}],['Distance: '+(149.6*(1-0.0167*Math.cos(2*Math.PI*(snD(sim)-3)/365))).toFixed(1)+' million km',{w:700}],['Season in Denver: '+(jan?'winter':'summer'),{w:700,c:CE_RED}]]);}},
    {key:'hook',title:'Your question: December vs June sunlight',focus:[430,40,370,330],pause:true,
     run:F3.run,
     see:'Denver on June 21. Watch the date jump to December 21 and the day’s total sunlight change.',
     why:'Both effects stack up. In December the noon Sun is only 27° up instead of 74°, and the day lasts about 9 hours instead of almost 15. Together Denver gets about <b>160 W/m²</b> averaged over the day instead of about <b>480</b>: roughly a third as much.',
     so:'Being 3% closer to the Sun in December barely helps. The tilt sets the seasons.',
     overlay(sim,ctx,LH,k,tau){const dec=F3.pre(sim,tau),q=snM(sim,'insol');dcCard(ctx,k,14,48,270,[[dec?'Dec 21':'Jun 21',{w:800}],['Sunlight energy: '+Math.round(q)+' W/m² (day average)',{w:700,c:dec?CE_RED:PAL['cv-ink']}],dec?['About a third of June’s 483',{c:CE_RED}]:'Watch it change']);}},
    {key:'lat',title:'Equator and Arctic',set:{lat:0},pause:true,focus:[430,40,370,400],
     cause:{from:{lat:39.7},delay:2,dur:2.5,label:'Latitude',at:[218,428]},
     run(sim){atReset(sim);snJump(sim,354);},
     see:'December 21 again. Watch the place slide from Denver south to the equator. Then it slides north to 70° N, in the Arctic.',
     why:'At the equator the noon Sun is still 66° up and the day is 12 hours long in every month, so it never gets a cold season. At 70° N the Sun never rises in late December: polar night. In June the same place has the midnight Sun. The farther you are from the equator, the bigger the swing between seasons.',
     overlay(sim,ctx,LH,k,tau){if(tau>8.5){const v=Math.round(lerp(0,70,ease((tau-8.5)/2.5)));if(sim.p.lat!==v)BioLab.setValues(sim,{lat:v});}const l=sim.p.lat;dcCard(ctx,k,14,48,250,[['Latitude: '+l.toFixed(0)+'° N',{w:800}],['Noon Sun: '+Math.max(0,snM(sim,'angle')).toFixed(0)+'° · daylight '+snM(sim,'daylen').toFixed(1)+' h',{w:700,c:CE_RED}]]);}},
    {key:'notilt',lvl:'honors',title:'What if Earth had no tilt?',set:{tilt:0},speed:1,focus:[430,40,370,400],
     cause:{from:{tilt:23.5},delay:2,dur:2.5,label:'Axis tilt',at:[218,428]},
     run(sim){snJump(sim,150);},
     see:'Denver as the year runs. Watch the tilt shrink from 23.5° to 0°.',
     why:'With no tilt, the Sun stays over the equator all year. Denver would get the same 50° noon Sun and 12-hour days every day, with only the tiny 3% distance effect left. No real seasons.',
     overlay(sim,ctx,LH,k){dcCard(ctx,k,14,48,250,[[snDate(snD(sim)),{w:800}],['Noon Sun: '+snM(sim,'angle').toFixed(0)+'° · daylight '+snM(sim,'daylen').toFixed(1)+' h',{w:700,c:CE_RED}]]);}},
    {key:'cells',lvl:'honors',title:'Uneven heating makes the winds',set:{view:'winds'},speed:1,focus:[520,10,280,430],
     see:'Now the whole planet. Follow the dots around the red Hadley cells on the right.',
     why:'The equator gets the most direct sunlight, so warm, moist air rises there, cools and dumps its rain: rainforests. That air spreads toward the poles high up and sinks near 30°. Sinking air warms and dries out, so deserts like the Sahara and Arizona’s line up near 30°.'},
    {key:'coriolis',lvl:'ap',title:'The spin bends the winds',set:{view:'winds',coriolis:true},speed:1,focus:[160,40,360,400],
     cause:{from:{coriolis:false},delay:2,label:'Earth’s rotation',at:[338,428]},
     see:'Watch the surface wind arrows when Earth’s spin is switched on.',
     why:'On a spinning planet, moving air curves: to the right in the Northern Hemisphere, to the left in the Southern. Air heading back to the equator becomes the northeast and southeast trade winds, and the flow toward the poles becomes the westerlies that push Denver’s weather in from the west.'}
  ],
  useIt:[
    {do:'Put a houseplant in a south-facing window for the winter.',
     why:'The low winter Sun shines deep into south-facing rooms, while the high summer Sun barely gets past the window frame. That is also why houses built for passive solar heat face south.'},
    {do:'Keep sunglasses in the car from November to February.',
     why:'The low winter Sun sits right at windshield height during morning and afternoon drives, especially on east–west roads. Glare is worst when the Sun is low, not when it is high.'},
    {do:'Wear sunscreen on a spring ski day, even when it is cold.',
     why:'By mid-April Denver’s noon Sun is as high as in late August. Snow reflects much of the UV back up at you, and mountain altitude adds more. Cold air does nothing to block it.'},
    {do:'Check which way a slope faces before a spring hike or ski.',lvl:'honors',
     why:'North-facing slopes get the Sun at a low angle all winter, so they stay icy and hold snow weeks longer than south-facing ones.'}],
  tryIt:[{title:'the noon shadow (a few weeks)',
    steps:['Stand a meter stick straight up, or use your own height, at the same spot.','Measure the shadow at solar noon (about 12:00 in winter, 1:00 pm in daylight time) once a week.','Find the Sun’s angle: tan(angle) = stick height ÷ shadow length.'],
    look:'From November to late December the shadow grows longer, about twice the stick’s height at the solstice (27° Sun). After December 21 it starts shrinking again.'}]
}};
})());

/* ---------- Albedo ---------- */
BioLab.addLearn((function(){
const ORD=['blacktop','concrete','brick','grass','roof','snow'];
const alCell=s=>{const i=ORD.indexOf(s),c=i%3,r=(i/3)|0;return [16+c*176,214+r*116,168,108];};
const alF=(sim,s)=>(sim.st.L[s].T1-273.15)*1.8+32;
const alAir=sim=>{const m=(sim.def.metrics||[]).find(x=>x.id==='Tair');return m?m.get(sim):NaN;};
function alBox(ctx,s,col){const r=alCell(s);ctx.save();ctx.strokeStyle=col||'#c8102e';ctx.lineWidth=4;H.rr(ctx,r[0]-4,r[1]-4,r[2]+8,r[3]+8,10);ctx.stroke();ctx.restore();}
function alSteam(ctx,s,tau){const r=alCell(s);ctx.save();ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2;for(let i=0;i<6;i++){const ph=(tau*0.6+i/6)%1,x=r[0]+18+i*26,y=r[1]+r[3]-10-ph*70;ctx.globalAlpha=1-ph;ctx.beginPath();for(let j=0;j<=8;j++){const yy=y-j*3,xx=x+Math.sin(j*0.9+tau*3+i)*4;j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();}ctx.restore();}
const T=(sim,s)=>Math.round(alF(sim,s))+' °F';
return {albedo:{
  goals:{
    bio:['What albedo is: how much sunlight a surface bounces back','Why dark surfaces get so much hotter than light ones in the same sun','Why grass and shade stay cool, and why blacktop stays hot after sunset','How to use this to stay cool and keep pets safe'],
    honors:['What albedo is: how much sunlight a surface bounces back','Why dark surfaces get so much hotter than light ones in the same sun','Why grass and shade stay cool, and why blacktop stays hot after sunset','How wind and water carry heat away','How to use this to stay cool and keep pets safe'],
    ap:['What albedo is: how much sunlight a surface bounces back','Why dark surfaces get so much hotter than light ones in the same sun','Why grass and shade stay cool, and why blacktop stays hot after sunset','How wind and water carry heat away','How roofs make an urban heat island, and how melting sea ice feeds on itself','How to use this to stay cool and keep pets safe']},
  matters:'Albedo is why a parking lot can burn a dog’s paws while the lawn next to it is fine, why cities run hotter than the countryside, and why melting Arctic ice speeds up warming.',
  question:'On a sunny 78 °F September afternoon in Aurora, how hot does the blacktop in the student parking lot get at 1 PM, compared with the lawn right next to it? Why are they so different in the same sun?',
  startKey:'start',startRun:true,startSpeed:0.5,
  steps:[
    {key:'morning',title:'Same sun, different temperatures',speed:3,focus:[8,206,536,236],
     run(sim){sim.def.actions.find(a=>a.id==='j6').run(sim);},
     see:'Six squares of ground side by side under the same sky, from 6 AM into the afternoon. Watch the temperatures pull apart as the Sun climbs.',
     why:'Every square gets the same sunlight and the same air. The only thing that differs is the surface itself. Some surfaces turn far more of that sunlight into heat than others.',
     overlay(sim,ctx,LH,k){const h=((sim.st.h0+sim.t)%24+24)%24,hh=Math.floor(h);dcCard(ctx,k,14,60,250,[[(hh%12===0?12:hh%12)+(hh<12?' AM':' PM')+' · air '+Math.round(alAir(sim))+' °F',{w:700}],['Blacktop: '+T(sim,'blacktop'),{w:700,c:CE_RED}],['Grass: '+T(sim,'grass'),{w:700,c:CE_GREEN}]]);}},
    {key:'bounce',title:'Bounced back or soaked up',set:{surf:'roof'},speed:0.3,focus:[548,6,244,440],
     cause:{from:{surf:'blacktop'},delay:3,label:'Surface',at:[280,190]},
     run(sim){sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'Yellow dots are sunlight hitting the blacktop. A few bounce back; the rest disappear and become heat (the red wiggles). Watch the bars on the right when the thermometer moves to the white roof.',
     why:'The share of sunlight a surface bounces back is its <b>albedo</b>. Blacktop’s is 0.10: it reflects 10% and absorbs 90%. A white roof’s is 0.70: it reflects 70% and absorbs only 30%. Absorbed sunlight is what heats a surface, so the blacktop gets about three times as much heat.'},
    {key:'grass',title:'Grass sweats',set:{surf:'grass'},speed:0.3,focus:[8,206,536,236],
     cause:{from:{surf:'concrete'},delay:3,label:'Surface',at:[280,190]},
     run(sim){sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'Concrete and grass at 1 PM. Grass reflects less sunlight than concrete, so it should be hotter. Look at the numbers.',
     why:'Grass is about 20 °F cooler. A living plant pulls water up from the soil and lets it evaporate from its leaves. Evaporating water carries heat away, the same way sweat cools your skin. Pavement has no water to give up.',
     overlay(sim,ctx,LH,k,tau){alBox(ctx,'concrete','#5b8fd9');alBox(ctx,'grass','#1b7a3a');if(tau>3)alSteam(ctx,'grass',tau);
       dcCard(ctx,k,14,60,290,[['Concrete (reflects 32%): '+T(sim,'concrete'),{w:700}],['Grass (reflects 23%): '+T(sim,'grass'),{w:700,c:CE_GREEN}]]);}},
    {key:'shade',title:'Into the shade',set:{shade:'shade'},speed:1,focus:[8,206,536,236],
     cause:{from:{shade:'sun'},delay:2,label:'Shade',at:[280,190]},
     run(sim){sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'All six surfaces at 1 PM. Watch a tree’s shade fall over them.',
     why:'In shade only scattered light gets through, so every surface drifts toward the air temperature. The blacktop takes an hour or more to get there: it is heavy and has stored a lot of heat, which it gives back slowly.',
     overlay(sim,ctx,LH,k){alBox(ctx,'blacktop');dcCard(ctx,k,14,60,250,[['Blacktop: '+T(sim,'blacktop'),{w:700,c:CE_RED}],'Air: '+Math.round(alAir(sim))+' °F']);}},
    {key:'night',title:'Still hot after sunset',speed:1.5,focus:[8,206,536,236],
     run(sim){sim.def.actions.find(a=>a.id==='j19').run(sim);},
     see:'From 7 PM into the night. Watch the blacktop and brick compared with the grass as the Sun goes down.',
     why:'Blacktop and brick soaked up heat all day and stored it below the surface. After sunset they keep releasing it into the evening air, while grass cools off fast. That stored heat is why a parking lot still feels warm at 9 PM and why cities stay warmer at night.',
     overlay(sim,ctx,LH,k){alBox(ctx,'blacktop');alBox(ctx,'grass','#1b7a3a');const h=((sim.st.h0+sim.t)%24+24)%24,hh=Math.floor(h);dcCard(ctx,k,14,60,250,[[(hh%12===0?12:hh%12)+(hh<12?' AM':' PM'),{w:800}],['Blacktop: '+T(sim,'blacktop'),{w:700,c:CE_RED}],['Grass: '+T(sim,'grass'),{w:700,c:CE_GREEN}]]);}},
    {key:'hook',title:'Your question: the parking lot and the lawn',pause:true,focus:[8,206,536,236],
     run(sim){sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'1 PM on the 78 °F September day. The student lot’s blacktop and the lawn next to it.',
     why:'The blacktop is about <b>124 °F</b> and the lawn about <b>84 °F</b>, 40 degrees apart in the same sun, while the air is about 76 °F. The blacktop absorbs 90% of the sunlight and has no water to evaporate. The grass reflects a bit more and cools itself by evaporation.',
     so:'Blacktop that hot can burn a dog’s paw pads and bare feet. The lawn a few steps away is safe.',
     overlay(sim,ctx,LH,k){alBox(ctx,'blacktop');alBox(ctx,'grass','#1b7a3a');dcCard(ctx,k,14,60,250,[['Blacktop: '+T(sim,'blacktop'),{w:800,c:CE_RED}],['Grass: '+T(sim,'grass'),{w:800,c:CE_GREEN}],'Air: '+Math.round(alAir(sim))+' °F']);}},
    {key:'snow',title:'Snow stays at 32 °F',set:{surf:'snow'},speed:0.3,focus:[548,6,244,440],
     cause:{from:{surf:'blacktop'},delay:2.5,label:'Surface',at:[280,190]},
     run(sim){sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'Watch most of the sunlight bounce off the snow, and its temperature.',
     why:'Fresh snow reflects about 85% of the sunlight, the most of any surface here. The little it absorbs goes into melting snow, not warming it, so snow stays at 32 °F until it is gone. Once it melts, the darker ground underneath absorbs much more.'},
    {key:'wind',lvl:'honors',title:'Wind carries heat away',set:{wind:25},speed:1,focus:[548,6,244,440],
     cause:{from:{wind:5},delay:2,dur:3,label:'Wind',at:[280,190]},
     run(sim){BioLab.setValues(sim,{surf:'blacktop'});sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'The blacktop at 1 PM. Watch the wind pick up from 5 to 25 mph, and the “Warms the air” bar.',
     why:'Moving air keeps replacing the hot air touching the surface with cooler air, so it carries heat off faster. The blacktop cools even though the same sunlight still hits it. That is why a breeze makes a hot day bearable.'},
    {key:'drought',lvl:'honors',title:'A lawn in a drought',set:{moist:'dry',surf:'grass'},speed:1,focus:[548,6,244,440],
     cause:{from:{moist:'normal'},delay:2,label:'Moisture',at:[280,190]},
     run(sim){sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'The lawn at 1 PM. Watch the Evaporation bar when the soil dries out.',
     why:'With no water to spare, grass closes the pores on its leaves to save water, so it evaporates much less. Without that cooling, a dry lawn heats up almost like bare ground.'},
    {key:'island',lvl:'ap',title:'Roofs and the urban heat island',set:{set:'roofs',surf:'darkroof'},speed:0.3,focus:[8,206,536,236],fresh:true,
     run(sim){sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'A dark roof, a white roof, a green roof, a parking lot and a park lawn at 1 PM.',
     why:'Cities replace grass and trees with dark roofs and pavement, so they absorb more sunlight and have less water to evaporate. They run hotter than the countryside, day and night: the <b>urban heat island</b>. White roofs reflect the sunlight; green roofs cool by evaporation.'},
    {key:'ice',lvl:'ap',title:'The ice–albedo feedback',set:{set:'ice',surf:'ocean'},speed:0.3,focus:[8,206,536,236],fresh:true,
     run(sim){sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'Snow-covered sea ice, bare ice, a melt pond and open ocean in the Arctic summer. Compare the energy each absorbs per day.',
     why:'Snow reflects 85% of the sunlight; open ocean only 6%. When warming melts sea ice, dark water takes its place and absorbs far more energy, which melts more ice. A change that speeds itself up is a <b>positive feedback</b>, and it is a big reason the Arctic is warming faster than the rest of the planet.'}
  ],
  useIt:[
    {do:'Before walking a dog on a hot afternoon, press the back of your hand on the pavement for 7 seconds.',
     why:'If it is too hot for your hand, it is too hot for paws. Blacktop in full sun can run 40 °F or more hotter than the air. Walk on grass or go in the morning or evening.'},
    {do:'Use a windshield sunshade, or park in the shade.',
     why:'A dark dashboard absorbs most of the sunlight that comes through the glass. A shiny sunshade reflects it back out before it turns into heat.'},
    {do:'Wear light-colored clothes for practice on hot, sunny days.',
     why:'Light fabric reflects more sunlight; dark fabric absorbs more and warms up. In full sun the difference is easy to feel.'},
    {do:'On a hot day, take breaks in the shade or on grass, not on turf or blacktop.',lvl:'honors',
     why:'Artificial turf and pavement are dark and have no water to evaporate, so they can be tens of degrees hotter than natural grass. Shade cuts the sunlight that drives it all.'}],
  tryIt:[{title:'the two cups (30 minutes)',
    steps:['Fill two identical cups with the same amount of cool tap water.','Wrap one in black paper or cloth and the other in white paper or foil.','Set both in direct sun for 30 minutes.','Measure each with a kitchen thermometer, or compare by touch.'],
    look:'The black cup’s water ends up noticeably warmer. Same sun, same water: only the albedo differs.'}]
}};
})());

/* ---------- ENSO ---------- */
BioLab.addLearn((function(){
const enM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
/* the ocean at equilibrium for a trade-wind strength W (same formulas as the model) */
function enEq(sim,W){const st=sim.st,De=Math.max(15,Math.min(170,40+110*(1-W))),Dw=160+40*W,U=Math.max(0,Math.min(1.5,W*(1.2-(De-40)/120)/1.2));
  Object.assign(st,{W,De,Dw,U,Te:28-7*Math.min(U,1.4),F:100*Math.pow(Math.min(U,1.3),1.2)});}
const card=(ctx,k,rows)=>dcCard(ctx,k,250,342,290,rows);
return {enso:{
  goals:{
    bio:['How steady winds push the ocean and pile warm water on one side of the Pacific','Why cold, rising water off Peru feeds one of the world’s biggest fisheries','What goes wrong in an El Niño year, from Peru’s fish to Australia’s fires','How El Niño and La Niña reach Colorado’s snow'],
    honors:['How steady winds push the ocean and pile warm water on one side of the Pacific','Why cold, rising water off Peru feeds one of the world’s biggest fisheries','What goes wrong in an El Niño year, and what La Niña does','How the thermocline tilts and flattens','How the global conveyor belt moves heat around the planet'],
    ap:['How steady winds push the ocean and pile warm water on one side of the Pacific','Why upwelling off Peru feeds one of the world’s biggest fisheries','What goes wrong in an El Niño year, and what La Niña does','How the Walker circulation and the thermocline respond','How ENSO shifts the jet stream and Colorado’s winter snow']},
  matters:'A change in wind over the Pacific can crash a fishery in Peru, set off fires in Australia and decide whether Colorado’s southern or northern mountains get the big snow year.',
  startKey:'start',startRun:true,startSpeed:1,
  steps:[
    {key:'slice',title:'The Pacific, sliced along the equator',pause:true,focus:[0,20,800,430],set:{state:'normal'},
     see:'A slice through the Pacific Ocean along the equator: Indonesia on the left, Peru 15,000 km away on the right. Depth is stretched so you can see the layers.',
     why:'Sunlight warms only the top layer of the ocean. That warm water is lighter, so it floats on top of cold, deep water. The boundary between them, where the temperature drops fast, is the <b>thermocline</b> (the dashed line).',
     overlay(sim,ctx,LH,k){tag(ctx,'Warm surface layer',300,205,k);tag(ctx,'Cold deep water',300,395,k);tag(ctx,'Thermocline',520,250,k,{hi:true});}},
    {key:'trades',title:'Wind pushes the ocean',speed:2,focus:[0,100,800,340],set:{state:'custom',trade:1},
     cause:{from:{trade:0.2},delay:2,dur:2,label:'Trade winds',at:[610,24]},
     run(sim){enEq(sim,0.2);},
     see:'Start with almost no wind. Watch the trade winds pick up, blowing from east to west, and watch the warm layer.',
     why:'Wind drags the sun-warmed surface water along with it. Steady trade winds push it west until it piles up near Indonesia as a thick <b>warm pool</b>, and the sea surface there ends up about half a meter higher than near Peru. The thermocline tilts: deep in the west, shallow in the east.'},
    {key:'upwell',title:'Cold water rises off Peru',speed:0.6,focus:[560,150,240,300],set:{state:'normal'},fresh:true,
     see:'Zoom in on the coast of Peru. Watch the arrows, the green dots and the fish.',
     why:'As the wind pushes surface water away from Peru, cold water from below rises to take its place: <b>upwelling</b>. Deep water carries nitrate and phosphate (green dots). In sunlight, those nutrients feed plankton, which feed huge schools of anchovies. Upwelling zones cover about 1% of the ocean but produce a large share of the world’s fish.',
     overlay(sim,ctx,LH,k){dcCard(ctx,k,236,250,300,[['Wind pushes surface water west',{w:700}],'→ cold, deep water rises','→ nutrients reach the sunlight','→ plankton bloom → anchovies']);}},
    {key:'rain',title:'Rain follows the warm water',speed:0.6,focus:[0,10,800,170],set:{state:'normal'},fresh:true,
     see:'Look at the sky: the clouds over the warm pool, and the dry air on the Peru side.',
     why:'Warm water heats the air above it. Warm, moist air rises, cools and rains, so Indonesia gets heavy rain. That air flows east high up and sinks over the cold water near Peru, where sinking air stays dry. That is why the coast of Peru and northern Chile is one of the driest deserts on Earth, right next to the ocean.'},
    {key:'elnino',title:'El Niño: the winds weaken',speed:2,focus:[0,10,800,440],set:{state:'elnino'},
     cause:{from:{state:'normal'},delay:2,label:'Conditions',at:[610,24]},
     run(sim){enEq(sim,1);},
     see:'A normal year. Every 2 to 7 years the trade winds weaken. Watch what happens to the warm water, the rain and the fish.',
     why:'Without strong winds to hold it in the west, the warm pool sloshes back east across the Pacific. The thermocline off Peru sinks, so upwelling stops bringing up nutrients, and the fish disappear. The rain moves east with the warm water: floods in Peru and Ecuador, drought and fire risk in Indonesia and Australia.',
     overlay(sim,ctx,LH,k){card(ctx,k,[['Heaviest rain: '+enM(sim,'rainc'),{w:700}],['Water off Peru: '+enM(sim,'sst').toFixed(1)+' °C',{w:700,c:CE_RED}]]);}},
    {key:'hook',title:'Your question: the Peruvian fishing boat',speed:1.5,focus:[560,150,240,300],set:{state:'normal'},fresh:true,
     run(sim){atReset(sim);enEq(sim,1);sim._en0=null;},
     see:'You run the red fishing boat. Forecasters announce El Niño. Watch your water and your catch for a year.',
     why:'The water off your coast warms from about 21 °C to over 27 °C within six months. Upwelling falls under 10% of normal, so plankton and anchovies crash: your catch drops to about 40% of normal by six months and about 13% after a year.',
     so:'That is what happened in 1972, when El Niño collapsed Peru’s anchovy fishery, then the largest in the world. Fishmeal from anchovies feeds farm animals worldwide, so prices rose far from Peru.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'nino',s=>{BioLab.setValues(s,{state:'elnino'});s._en0=s.t;});const mo=sim._en0==null?null:Math.max(0,sim.t-sim._en0);
       card(ctx,k,[[mo==null?'Normal year':'El Niño + '+mo.toFixed(0)+' months',{w:800}],['Water off Peru: '+enM(sim,'sst').toFixed(1)+' °C',{w:700}],['Upwelling: '+Math.round(enM(sim,'upw'))+'% of normal'],['Anchovy catch: '+Math.round(enM(sim,'fish'))+'% of normal',{w:700,c:CE_RED}]]);}},
    {key:'lanina',lvl:'honors',title:'La Niña: the opposite swing',speed:2,focus:[0,10,800,440],set:{state:'lanina'},
     cause:{from:{state:'normal'},delay:2,label:'Conditions',at:[610,24]},
     run(sim){enEq(sim,1);},
     see:'A normal year again. Watch the trade winds get stronger than normal.',
     why:'La Niña is a normal year, exaggerated. Stronger winds push even more warm water west, the thermocline rises off Peru, upwelling gets stronger and the eastern Pacific gets colder. Fishing is good, but Indonesia and Australia get extra rain.',
     overlay(sim,ctx,LH,k){card(ctx,k,[['Thermocline off Peru: '+Math.round(enM(sim,'thermo'))+' m deep',{w:700}],['Water off Peru: '+enM(sim,'sst').toFixed(1)+' °C',{w:700,c:'#1f5fbf'}]]);}},
    {key:'global',lvl:'honors',title:'The global conveyor belt',speed:1,focus:[0,20,800,420],set:{view:'global'},
     see:'Zoom out to the whole planet. Follow the warm surface path (red) and the cold deep path (blue).',
     why:'Winds spin each ocean basin into a big loop, a <b>gyre</b>. Deep down, very cold, salty water near Greenland and Antarctica is dense, so it sinks and creeps along the sea floor around the world. The full loop takes about 1,000 years, and it carries tropical heat toward the poles.'},
    {key:'colorado',lvl:'ap',title:'From the Pacific to Colorado',speed:2,focus:[0,10,800,170],set:{state:'elnino'},
     cause:{from:{state:'normal'},delay:2,label:'Conditions',at:[610,24]},
     run(sim){enEq(sim,1);},
     see:'Watch the rain center move east, and the Colorado winter outlook.',
     why:'Where the tropical rain falls, the air rises and heats the atmosphere. Moving that heat source east bends the Pacific jet stream, which steers winter storms. In El Niño winters the jet tends to dip south, bringing storms to the southern US and often to Colorado’s southern mountains. La Niña tends to favor the northern mountains. A far-away link like this is a <b>teleconnection</b>.',
     overlay(sim,ctx,LH,k){card(ctx,k,[['Rain center: '+Math.round(enM(sim,'rain'))+'° E',{w:700}],[enM(sim,'co'),{s:12,c:CE_RED}]]);}}
  ],
  useIt:[
    {do:'This fall, look up whether NOAA expects El Niño, La Niña or neutral before you plan winter ski days.',
     why:'El Niño winters tend to bring extra snow to Colorado’s southern mountains, and La Niña winters to the northern ones. It shifts the odds; it does not guarantee a single storm.'},
    {do:'Follow your town’s watering rules after a low-snow winter.',
     why:'Most of Colorado’s water starts as mountain snow. A winter that misses the storms means less runoff in spring and summer, and less water for lawns, farms and rivers.'},
    {do:'When an El Niño is announced, watch for it in the news far from here.',
     why:'The same shift in warm water can flood Peru and Ecuador, dry out Indonesia and Australia, and change fish and food prices. Knowing the chain helps you understand those headlines.'}],
  tryIt:[{title:'upwelling in a pan (15 minutes)',
    steps:['Fill a clear baking dish halfway with cold tap water.','Slowly pour a thin layer of warm water with a few drops of food coloring over the back of a spoon so it floats on top.','Point a hair dryer on the cool setting, or blow through a straw, across the surface from one end.'],
    look:'The colored warm layer piles up at the far end, and clear cold water rises at the end where the wind starts: the same tilt and upwelling as the Pacific.'}]
}};
})());

/* ---------- Farm ---------- */
BioLab.addLearn((function(){
const fmM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const fmA=(sim,id)=>{const a=(sim.def.actions||[]).find(x=>x.id===id);if(a)a.run(sim);};
const fmCard=(ctx,k,rows)=>dcCard(ctx,k,300,8,290,rows);
/* grow one season every `gap` seconds, starting at `t0`, up to n seasons */
const seasons=(sim,tau,t0,gap,n)=>{for(let i=0;i<n;i++)atT(sim,tau,t0+i*gap,'g'+i,s=>fmA(s,'grow'));};
return {farm:{
  goals:{
    bio:['Why farms on the High Plains pump groundwater, and what happens to the aquifer','Why drip irrigation grows more corn with less water','Why extra fertilizer barely helps the crop but pollutes the water','Why spraying the same pesticide every year stops working','What you can do with water and fertilizer at home'],
    honors:['Why farms on the High Plains pump groundwater, and what happens to the aquifer','Why drip irrigation grows more corn with less water','Why extra fertilizer barely helps the crop but pollutes the water','How pests evolve resistance, and how IPM slows it','What you can do with water and fertilizer at home'],
    ap:['Why farms on the High Plains pump groundwater, and what happens to the aquifer','Why drip irrigation grows more corn with less water','Why extra fertilizer barely helps the crop but pollutes the water','How pests evolve resistance, and how IPM slows it','How irrigation slowly salts the soil','What you can do with water and fertilizer at home']},
  matters:'Eastern Colorado grows corn, wheat and cattle feed on water pumped from an aquifer that refills far slower than it is used. How a farmer waters, fertilizes and fights pests decides how long that water lasts and how clean it stays.',
  startKey:'start',startRun:true,
  steps:[
    {key:'field',title:'One acre of corn',pause:true,focus:[0,0,600,450],
     run(sim){fmA(sim,'restart');},
     see:'One acre of corn in eastern Colorado, about the size of a football field. Under it: soil, then an aquifer of sand and gravel holding groundwater, and a well.',
     why:'Corn uses about 24 inches of water over a summer, but rain here gives only about 8. The farmer pumps the rest from the aquifer, part of the Ogallala Aquifer under the High Plains.',
     overlay(sim,ctx,LH,k){tag(ctx,'Rain: about 8 in a summer',170,92,k);tag(ctx,'Corn needs about 24 in',420,130,k,{hi:true});tag(ctx,'Groundwater is pumped up the well',420,380,k);}},
    {key:'rainonly',title:'Rain alone is not enough',set:{irr:'none'},focus:[0,40,600,200],
     cause:{from:{irr:'furrow'},delay:2.5,label:'Irrigation',at:[300,282]},
     run(sim){fmA(sim,'restart');},
     see:'The field with furrow irrigation. Watch the pumping stop, so the corn gets rain only.',
     why:'With 8 of the 24 inches it needs, the corn is short and yellow, and the harvest drops from about 183 to about 43 bushels an acre. That is why almost every cornfield out here is irrigated.'},
    {key:'drip',title:'Same water, different method',set:{irr:'drip'},focus:[0,140,600,110],
     cause:{from:{irr:'furrow'},delay:3,label:'Irrigation',at:[300,282]},
     run(sim){fmA(sim,'restart');},
     see:'20 inches of water running down furrows between the rows. Look at the pale wisps rising off it. Then watch the same 20 inches go through drip lines.',
     why:'In furrows, water sits in the open sun and wind, so a lot of it evaporates (the wisps) or runs off the end of the field: only about 65% reaches the roots. Drip lines put water right at each plant, so about 95% gets there. The same 20 inches grows about 216 bushels instead of 183.'},
    {key:'aquifer',title:'Mining the aquifer',set:{irr:'furrow',pest:'ipm'},focus:[0,290,600,160],
     run(sim){atReset(sim);fmA(sim,'restart');},
     see:'Furrow irrigation, 20 inches a year. Watch the water table, the dashed blue line, as the farm grows one season after another.',
     why:'Every inch pumped lowers the water table a little, and rain soaks back down only about half a foot a year here. After 10 seasons the well has to reach about 19 feet deeper. Parts of the Ogallala in Kansas and Texas have dropped more than 100 feet since the 1950s.',
     overlay(sim,ctx,LH,k,tau){seasons(sim,tau,1.5,0.8,10);fmCard(ctx,k,[['Seasons grown: '+fmM(sim,'year'),{w:700}],['Water table: '+fmM(sim,'depth').toFixed(1)+' ft down (was 100)',{w:700,c:CE_BLUE}]]);}},
    {key:'hook',title:'Your question: switching to drip',set:{irr:'drip',water:14,pest:'ipm'},focus:[0,0,800,450],
     cause:{from:{irr:'furrow',water:20},delay:2.5,label:'Irrigation',at:[300,282]},
     run(sim){atReset(sim);fmA(sim,'restart');},
     see:'The farmer’s furrows with 20 inches. Watch her switch to drip and cut the water to 14 inches. Then 10 seasons go by.',
     why:'Drip gets 95% of the water to the roots, so 14 inches grows about <b>186 bushels</b>, a little more than furrow’s 183 with 20 inches. She saves 6 inches, about <b>163,000 gallons per acre</b> every season. After 10 seasons her water table is about 12 feet lower instead of 19.',
     so:'The aquifer still falls with drip, just more slowly. Saving water buys time; it does not make pumping sustainable on its own.',
     overlay(sim,ctx,LH,k,tau){seasons(sim,tau,6.5,0.6,10);fmCard(ctx,k,[['Corn: '+Math.round(fmM(sim,'y'))+' bu/acre with '+sim.p.water+' in',{w:700}],['Water table: '+fmM(sim,'depth').toFixed(1)+' ft down',{w:700,c:CE_BLUE}]]);}},
    {key:'fert',title:'More fertilizer, more pollution',set:{N:250},focus:[0,220,600,230],
     cause:{from:{N:150},delay:2.5,dur:2.5,label:'Nitrogen fertilizer',at:[300,282]},
     run(sim){fmA(sim,'restart');},
     see:'Furrow irrigation with 150 pounds of nitrogen fertilizer per acre. Watch it rise to 250, and watch the green nitrate arrows below the roots.',
     why:'Corn can only use so much nitrogen. The harvest rises a little, from about 183 to 193 bushels, but nitrate washing out of the field jumps from about 5 to 37 pounds per acre. Nitrate dissolves easily, so water carries it down to the groundwater and into streams, where it feeds algae blooms.',
     so:'Sandy soils let nitrate wash through fastest, because water drains through them in minutes. Wells near heavily fertilized fields are the ones most often over the EPA’s safe limit for nitrate.'},
    {key:'treadmill',title:'The pesticide treadmill',set:{pest:'spray'},focus:[0,40,800,220],
     run(sim){atReset(sim);fmA(sim,'restart');},
     see:'The same pesticide is sprayed every year. Watch the brown pests and the “Eaten by pests” number as the seasons go by.',
     why:'The first spray kills almost all the pests, but a few survive because of natural variation in their genes. They breed, and their young inherit the resistance. Each year more of the population survives, so losses climb from about 4% to almost 30% in six seasons, and farmers spray more. That is natural selection happening in a field.',
     overlay(sim,ctx,LH,k,tau){seasons(sim,tau,1.5,1.2,6);fmCard(ctx,k,[['Season '+(fmM(sim,'year')+1),{w:700}],['Eaten by pests: '+Math.round(fmM(sim,'loss'))+'%',{w:700,c:CE_RED}]]);}},
    {key:'ipm',title:'Integrated pest management',set:{pest:'ipm'},focus:[0,40,800,220],
     run(sim){atReset(sim);fmA(sim,'restart');},
     see:'Same field, same pests, but now the farmer uses IPM. Watch the same six seasons.',
     why:'IPM means scouting the field, rotating crops, protecting predators like ladybugs (the red dots), and spraying only when pests pass a damage threshold. With far less spraying, there is much less pressure to evolve resistance: losses stay near 6 to 8%.',
     overlay(sim,ctx,LH,k,tau){seasons(sim,tau,1.5,1.2,6);fmCard(ctx,k,[['Season '+(fmM(sim,'year')+1),{w:700}],['Eaten by pests: '+Math.round(fmM(sim,'loss'))+'%',{w:700,c:CE_GREEN}]]);}},
    {key:'salt',lvl:'ap',title:'Salt builds up',set:{pest:'ipm'},focus:[0,180,800,80],
     run(sim){atReset(sim);fmA(sim,'restart');},
     see:'Furrow irrigation for 20 seasons. Watch the white crust on the soil and the Soil salt number.',
     why:'Groundwater carries a little dissolved salt. In a dry climate the water evaporates or is taken up by the plants, and the salt stays behind. Corn loses about 12% of its yield for each dS/m above 1.7, so after 20 seasons the harvest has fallen from about 183 to about 136 bushels.',
     overlay(sim,ctx,LH,k,tau){seasons(sim,tau,1.5,0.4,20);fmCard(ctx,k,[['Seasons grown: '+fmM(sim,'year'),{w:700}],['Soil salt: '+fmM(sim,'salt').toFixed(2)+' dS/m',{w:700,c:CE_RED}],'Corn: '+Math.round(fmM(sim,'y'))+' bu/acre']);}}
  ],
  useIt:[
    {do:'If you water a lawn or garden, do it early in the morning, not in the afternoon heat.',
     why:'In hot sun and wind, much of the water evaporates before it soaks in, just like the furrows. Many Front Range cities ask people not to water in the middle of the day for that reason.'},
    {do:'Watch for sprinkler heads that spray the sidewalk or street, and point them back at the grass.',
     why:'Water on pavement is runoff: it never reaches a root, and it carries fertilizer and dirt into the storm drain.'},
    {do:'Sweep spilled lawn fertilizer off the driveway and sidewalk, and don’t fertilize right before a big rain.',
     why:'Storm drains run straight to creeks without treatment. Fertilizer that washes in feeds algae downstream, the same way extra farm nitrogen does.'}],
  tryIt:[{title:'the catch-can test (30 minutes)',
    steps:['Set 5 or 6 empty, straight-sided cans (tuna cans work) around a lawn.','Run the sprinkler for 15 minutes.','Measure the water depth in each can with a ruler.'],
    look:'The cans won’t match: some spots get much more water than others, and some water lands on pavement. Double your 15-minute numbers to find how many inches an hour the sprinkler puts down, and compare with the inch or so a lawn needs each week in summer.'}]
}};
})());

/* ---------- Human population ---------- */
BioLab.addLearn((function(){
const hpM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const hpGo=(sim,key)=>{BioLab.setValues(sim,{preset:key});const a=sim.def.actions.find(x=>x.id==='load');if(a)a.run(sim);};
const hpPop=sim=>{const v=hpM(sim,'pop');return v>=1000?(v/1000).toFixed(2)+' billion':v.toFixed(1)+' million';};
const hpCard=(ctx,k,rows)=>dcCard(ctx,k,10,36,232,rows,{hi:false});
const rateRows=(sim,hiB,hiD)=>[['Births: '+hpM(sim,'cbr').toFixed(0)+' per 1,000',{w:700,c:hiB?CE_RED:PAL['cv-ink']}],['Deaths: '+hpM(sim,'cdr').toFixed(0)+' per 1,000',{w:700,c:hiD?CE_RED:PAL['cv-ink']}],['Growth: '+hpM(sim,'gr').toFixed(1)+'% a year',{w:700}]];
/* the row of the pyramid holding the people born since the step began: it climbs one bar every 5 years */
function band(ctx,i){if(i>20)return;const top=54,y=top+(20-i)*16.8;ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=3;H.rr(ctx,24,y-2,512,18.6,6);ctx.stroke();ctx.restore();}
return {humanpop:{
  goals:{
    bio:['How to read a population pyramid','Why death rates fall first and populations boom','Why a country keeps growing for decades after families get smaller','Why some countries, like Japan, are shrinking and aging'],
    honors:['How to read a population pyramid','The stages of the demographic transition, and which rate falls first','Why a country keeps growing for decades after families get smaller','Why some countries are shrinking and aging, and what migration adds'],
    ap:['How to read a population pyramid','The stages of the demographic transition, and which rate falls first','Population momentum, the rule of 70 and doubling time','Aging, the dependency ratio and what migration adds']},
  matters:'The size of your freshman class, the future of Social Security, which jobs will be in demand and why some countries close schools while others build them can all be read from a population pyramid.',
  startKey:'start',startRun:true,startSpeed:0.3,
  steps:[
    {key:'read',title:'Reading a pyramid',pause:true,focus:[20,40,520,400],run(sim){hpGo(sim,'niger');},
     see:'Niger’s population pyramid. Babies are at the bottom, the oldest people at the top. Males on the left, females on the right.',
     why:'Each bar is a 5-year age group, and its length is that group’s share of the whole country. Niger’s pyramid is very wide at the bottom: almost half its people are under 15, because families average nearly 7 children.',
     overlay(sim,ctx,LH,k){tag(ctx,'Babies and toddlers (0–4)',150,404,k,{hi:true});tag(ctx,'Oldest people',150,70,k);tag(ctx,'Each bar: one 5-year age group',420,250,k);}},
    {key:'cohort',title:'Watch a generation move up',speed:1.5,focus:[20,40,520,400],
     run(sim){hpGo(sim,'niger');sim._hp0=sim.t;},
     see:'The red box follows the babies born when this step began. Watch it climb one bar every 5 years.',
     why:'Every year each group gets one year older and slides up the pyramid, losing some people to death along the way. The bars you see rising are real generations. Today’s wide base is tomorrow’s huge group of parents.',
     overlay(sim,ctx,LH,k){band(ctx,Math.floor((sim.t-(sim._hp0||0))/5));}},
    {key:'village',title:'Stage 1: many births, many deaths',speed:1.5,focus:[20,40,780,400],
     run(sim){hpGo(sim,'stage1');},
     see:'A farming village in 1750. Watch the birth rate, the death rate and the pyramid.',
     why:'Families are large, but with no vaccines, clean water or antibiotics, many children die young and few people reach old age. Births and deaths nearly cancel out, so the population barely grows. The pyramid has steep sides: each age group is much smaller than the one below it.',
     overlay(sim,ctx,LH,k){hpCard(ctx,k,rateRows(sim));}},
    {key:'medicine',title:'Stage 2: deaths fall first',speed:1.5,focus:[20,40,780,400],
     run(sim){atReset(sim);hpGo(sim,'stage1');},
     see:'The same village. Watch clean water, vaccines and better food arrive: life expectancy jumps from 30 to 62 years.',
     why:'The death rate drops from about 37 to about 10 per 1,000 within a decade. Families are still large, so births stay above 30. The gap between births and deaths opens, and growth jumps from under 1% to about 2.5% a year: a population boom. Death rates fall first because medicine spreads faster than ideas about family size.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,2.5,'e0',s=>BioLab.setValues(s,{e0:62}));hpCard(ctx,k,[['Life expectancy: '+sim.p.e0+' years',{w:800,c:tau>2.5?CE_RED:PAL['cv-ink']}]].concat(rateRows(sim,false,tau>2.5)));}},
    {key:'smaller',title:'Stage 3: families get smaller',speed:1.5,focus:[20,40,780,400],
     run(sim){atReset(sim);hpGo(sim,'niger');},
     see:'Niger today, in Stage 2. Watch average family size fall from 6.7 to 3 children.',
     why:'When parents expect their children to survive, when girls stay in school longer and when more women work outside the home, families tend to choose fewer children. The birth rate falls toward the death rate, growth slows, and the base of the pyramid narrows.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,2.5,'tfr',s=>BioLab.setValues(s,{tfr:3}));hpCard(ctx,k,[['Children per woman: '+sim.p.tfr,{w:800,c:tau>2.5?CE_RED:PAL['cv-ink']}]].concat(rateRows(sim,tau>2.5,false)));}},
    {key:'hook',title:'Your question: Niger at 2 children',speed:3,pause:true,focus:[20,40,780,400],
     run(sim){atReset(sim);hpGo(sim,'niger');sim._hp0=null;},
     see:'Niger’s 27 million people. Watch every family drop to about 2 children (2.1) this year, then 50 years go by.',
     why:'Niger does not stop growing. It reaches about <b>34 million in 20 years</b> and about <b>41 million in 50</b>, half again as many people, before it levels off. Almost half the country is under 15, so a huge generation is about to become parents. Even at 2 children each, that many parents make a lot of babies. This is <b>population momentum</b>.',
     so:'At 6.7 children per woman, Niger would pass 170 million in the same 50 years. Changes in family size take a whole generation to show.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.2,'tfr',s=>{BioLab.setValues(s,{tfr:2.1});s._hp0=s.t;s.running=true;if(s.ui&&s.ui.play)s.ui.play.textContent='Pause';});const yrs=sim._hp0==null||tau<1.2?0:Math.floor(sim.t-sim._hp0);if(yrs>=50&&sim.running){sim.running=false;if(sim.ui&&sim.ui.play)sim.ui.play.textContent='Play';}
       hpCard(ctx,k,[['Children per woman: '+sim.p.tfr,{w:800}],['Years later: '+yrs,{w:700}],['Population: '+hpPop(sim),{w:800,c:CE_RED}]]);}},
    {key:'us',title:'Stage 4: a column',speed:1,focus:[20,40,520,400],
     run(sim){hpGo(sim,'us');},
     see:'The United States today. Compare the shape with Niger’s.',
     why:'Low birth rates and low death rates: most people survive to old age, and each age group is about the same size as the next. The pyramid looks more like a column. The bulge in the 60s and 70s is the baby boom generation, born 1946 to 1964.',
     overlay(sim,ctx,LH,k){hpCard(ctx,k,rateRows(sim));}},
    {key:'japan',title:'Shrinking and aging: Japan',speed:1.4,focus:[20,40,780,400],
     run(sim){hpGo(sim,'japan');},
     see:'Japan, where families average 1.2 children. Watch 30 years go by.',
     why:'With fewer than 2 children per couple, each generation is smaller than the one before. The base narrows, the top grows, deaths outnumber births, and the population shrinks. Fewer workers support more retirees, and schools close for lack of children.',
     overlay(sim,ctx,LH,k){hpCard(ctx,k,[['Population: '+hpPop(sim),{w:800,c:CE_RED}],['Age 65 and older: '+hpM(sim,'old').toFixed(0)+'%',{w:700}],['Growth: '+hpM(sim,'gr').toFixed(1)+'% a year',{w:700}]]);}},
    {key:'migration',lvl:'honors',title:'What migration adds',speed:1,focus:[20,40,780,400],
     run(sim){atReset(sim);hpGo(sim,'us');},
     see:'The United States again. Watch net migration (immigrants minus emigrants) set to zero.',
     why:'US births and deaths are now nearly equal, so almost all of its growth comes from migration. Most migrants arrive as young adults, so they add to the working-age bars and later to births. With zero net migration, growth drops to about zero right away, then below zero as the population ages.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,2.5,'mig',s=>BioLab.setValues(s,{mig:0}));hpCard(ctx,k,[['Net migration: '+sim.p.mig+' per 1,000',{w:800,c:tau>2.5?CE_RED:PAL['cv-ink']}],['Growth: '+hpM(sim,'gr').toFixed(2)+'% a year',{w:700}]]);}},
    {key:'dep',lvl:'ap',title:'Doubling time and dependency',speed:2,focus:[20,40,780,400],
     run(sim){hpGo(sim,'japan');},
     see:'Japan over 30 years. Watch the dependency ratio: children plus people 65 and older, per 100 people aged 15 to 64.',
     why:'As the large post-war generations pass 65 and fewer young people start work, the ratio climbs toward 100 dependents per 100 workers, straining pensions and health care. For a growing country, use the rule of 70: Niger growing 3.9% a year doubles in about 70 ÷ 3.9 ≈ 18 years.',
     overlay(sim,ctx,LH,k){hpCard(ctx,k,[['Dependency ratio: '+Math.round(hpM(sim,'dep'))+' per 100 workers',{w:800,c:CE_RED}]]);}}
  ],
  useIt:[
    {do:'Ask a grandparent how many brothers and sisters they had, then count your parents’ and your own.',
     why:'Most American families went from 4 or more children a few generations ago to about 2 today. Your own family tree probably shows the demographic transition.'},
    {do:'Look up any country’s pyramid in the US Census Bureau’s International Database.',
     why:'The shape tells you its future before the news does: a wide base means decades of growth and new schools; a top-heavy pyramid means more retirees and fewer workers.'},
    {do:'When you think about careers, think about the pyramid.',
     why:'As the baby boom generation ages, the US needs more nurses, physical therapists, home health aides and doctors. Health care is one of the fastest-growing kinds of work for that reason.'}],
  tryIt:[{title:'your family’s fertility rate (20 minutes)',
    steps:['List your great-grandparents’ generation (as far as you know), your grandparents’, and your parents’.','For each couple, count how many children they had.','Average the number of children per couple in each generation.'],
    look:'Compare each generation with 2.1, replacement level. Many families fall from well above it to near or below it in three generations: Stages 2, 3 and 4 in one family tree.'}]
}};
})());

/* ---------- Succession ---------- */
BioLab.addLearn((function(){
const scM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
/* start a slope at a set point: bare rock or burned slope, run forward `years` */
function scAt(sim,start,years){if(sim.p.start!==start)BioLab.setValues(sim,{start});BioLab.reset(sim);for(let y=0;y<years;y++){for(let q=0;q<4;q++)sim.def.step(sim,0.25);sim.t+=1;}}
const scCard=(ctx,k,rows)=>dcCard(ctx,k,10,46,250,rows,{hi:false});
const base=sim=>[['Year '+Math.floor(sim.t),{w:800}],['Soil: '+scM(sim,'soil').toFixed(1)+' cm',{w:700,c:'#8a5a2a'}],['Stage: '+scM(sim,'stage'),{w:700}]];
return {succession:{
  goals:{
    bio:['How life moves onto bare rock and builds soil','Why each stage of plants makes way for the next','Why a forest comes back so much faster after a fire than after a glacier','What that means for Colorado’s burned forests'],
    honors:['How life moves onto bare rock and builds soil','Why each stage of plants makes way for the next','Primary vs secondary succession, and why soil is the head start','Why aspen come first after a fire and spruce and fir take over'],
    ap:['How life moves onto bare rock and builds soil','Why each stage of plants makes way for the next','Primary vs secondary succession, and why soil is the head start','Why species richness peaks in the middle, and the intermediate disturbance hypothesis']},
  matters:'Colorado has lost large forests to wildfire. Knowing how a slope recovers, and why soil decides how fast, explains what you will see on burned hillsides on your next drive into the mountains.',
  startKey:'start',startRun:true,startSpeed:0.5,
  steps:[
    {key:'rock',title:'Bare rock',pause:true,focus:[0,240,800,210],
     run(sim){scAt(sim,'primary',0);},
     see:'A glacier has melted back and left bare rock. No soil, no seeds, no life.',
     why:'Plants with roots need soil to hold water and nutrients, and there is none. Life starting from bare rock like this is <b>primary succession</b>. It begins with the toughest organisms there are.',
     overlay(sim,ctx,LH,k){scCard(ctx,k,base(sim));}},
    {key:'lichens',title:'Pioneers make soil',speed:0.6,focus:[[0,290,800,90],[470,50,280,232]],
     run(sim){scAt(sim,'primary',0);},
     see:'Watch the close-up of the rock and the soil depth as the first decades pass.',
     why:'Lichens, a fungus and an alga living together, are the <b>pioneer species</b>. They cling to bare rock, release acids that slowly break it apart, and add their dead remains. Mosses follow, trapping dust and water. After about a century there are only about 2 cm of soil.',
     overlay(sim,ctx,LH,k){scCard(ctx,k,base(sim));}},
    {key:'grass',title:'Grasses and flowers move in',speed:1,focus:[0,150,800,200],
     run(sim){scAt(sim,'primary',70);},
     see:'The soil is a couple of centimeters deep. Watch grasses and wildflowers arrive.',
     why:'Now there is enough soil for roots. Grasses grow fast in full sun and quickly cover the ground. Their roots and dead leaves build soil much faster than lichens did. Each stage changes the ground in a way that lets the next stage in.',
     overlay(sim,ctx,LH,k){scCard(ctx,k,base(sim));}},
    {key:'trees',title:'Shrubs, then trees',speed:1.5,focus:[0,40,800,320],
     run(sim){scAt(sim,'primary',150);},
     see:'Watch shrubs, then fast-growing trees, take root as the soil deepens.',
     why:'Woody plants need deep soil, about 5 cm for shrubs and more for trees. Taller plants catch the sunlight first and shade out the grasses below them. Around year 225, trees cover about half the slope.',
     overlay(sim,ctx,LH,k){scCard(ctx,k,base(sim).concat([['Tree cover: '+Math.round(scM(sim,'trees'))+'%',{w:700,c:CE_GREEN}]]));}},
    {key:'climax',title:'The climax forest',speed:2,focus:[0,40,800,320],
     run(sim){scAt(sim,'primary',300);},
     see:'Watch the forest age, and watch the number of plant species.',
     why:'Shade-tolerant spruce and fir slowly take over. In their deep shade, the sun-loving grasses, flowers, shrubs and aspen die out, so the number of species drops from about 20 to about 8. This stable, long-lasting stage is the <b>climax community</b>.',
     overlay(sim,ctx,LH,k){scCard(ctx,k,[['Year '+Math.floor(sim.t),{w:800}],['Plant species: '+Math.round(scM(sim,'rich')),{w:700,c:CE_RED}],['Stage: '+scM(sim,'stage'),{w:700}]]);}},
    {key:'fire',title:'Fire: secondary succession',speed:0.6,focus:[0,40,800,410],
     run(sim){atReset(sim);scAt(sim,'primary',420);sim._sc0=null;},
     see:'An old climax forest. Watch a wildfire burn through it, then watch the slope recover.',
     why:'Fire kills most of the plants, but the soil survives, along with roots and seeds. So recovery skips the centuries of soil-building: grasses return within a few years and young trees within decades. Recovery where soil survives is <b>secondary succession</b>.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,2,'burn',s=>{const a=s.def.actions.find(x=>x.id==='fire');a.run(s);s._sc0=s.t;});
       scCard(ctx,k,[[sim._sc0==null?'Old forest':'Years since the fire: '+Math.floor(sim.t-sim._sc0),{w:800}],['Tree cover: '+Math.round(scM(sim,'trees'))+'%',{w:700,c:CE_GREEN}],['Soil: '+scM(sim,'soil').toFixed(1)+' cm (it survived)',{w:700,c:'#8a5a2a'}]]);}},
    {key:'hook',title:'Your question: fire slope vs glacier slope',speed:0.3,focus:[0,40,800,410],
     run(sim){scAt(sim,'secondary',0);},
     see:'The burned slope above the town, starting the year after the fire. Watch the tree cover.',
     why:'Grasses cover the burned slope within about 7 years, and trees cover <b>half the ground by about year 30</b>. On the bare rock up the valley, lichens and mosses spend about a century building the first 2 cm of soil, and trees reach half cover only around <b>year 225</b>.',
     so:'Soil is the head start. Where soil is lost, after a glacier, a landslide or severe erosion, recovery takes centuries instead of decades.',
     overlay(sim,ctx,LH,k){scCard(ctx,k,[['Burned slope, year '+Math.floor(sim.t),{w:800}],['Tree cover: '+Math.round(scM(sim,'trees'))+'%',{w:800,c:CE_GREEN}],['Bare rock reaches 50% around year 225',{s:12,c:PAL['cv-soft']}]]);}},
    {key:'aspen',lvl:'honors',title:'Aspen first, then spruce and fir',speed:2,focus:[0,40,800,320],
     run(sim){scAt(sim,'secondary',20);},
     see:'The burned slope from year 20 on. Watch the light green aspen and the dark spruce and fir.',
     why:'Aspen sprout from roots that survived underground and grow fast in full sun, so they lead the recovery. But aspen seedlings can’t grow in shade, including their own. Spruce and fir tolerate shade, grow slowly underneath, and by about year 250 they have replaced most of the aspen.',
     overlay(sim,ctx,LH,k){scCard(ctx,k,[['Year '+Math.floor(sim.t),{w:800}],['Aspen cover: '+Math.round(scM(sim,'aspen'))+'%',{w:700,c:'#6f9a2a'}],['Stage: '+scM(sim,'stage'),{w:700}]]);}},
    {key:'idh',lvl:'ap',title:'Intermediate disturbance',set:{dist:3},speed:2,focus:[0,40,800,410],
     run(sim){scAt(sim,'secondary',0);},
     see:'The same slope, but now a moderate fire burns about every 33 years (3 per century). Watch the number of species and the long-run average.',
     why:'With no fires, shade-tolerant trees eventually crowd out everything else. With fires every few years, only fast colonizers survive. With fires now and then, the slope keeps a mix of every stage, so the most species can live there: the <b>intermediate disturbance hypothesis</b>.',
     overlay(sim,ctx,LH,k){scCard(ctx,k,[['Year '+Math.floor(sim.t)+' · fires: 3 per century',{w:800}],['Plant species now: '+Math.round(scM(sim,'rich')),{w:700}],['100-year average: '+scM(sim,'avg').toFixed(1),{w:700,c:CE_RED}]]);}}
  ],
  useIt:[
    {do:'On your next drive into the mountains, look for an old burn scar and read its stage.',
     why:'Grasses and fireweed mean a recent fire; thick, even-aged aspen mean a fire a few decades ago; dark spruce and fir with few aspen mean it has been a long time. You can read a slope’s fire history from its plants.'},
    {do:'Stay on the trail, especially on steep slopes and above treeline.',
     why:'Trampling strips the thin soil. Where soil is lost, recovery starts over from almost nothing and can take centuries, as on bare rock.'},
    {do:'Look closely at the colored crusts on rocks on your next hike.',
     why:'Those green, orange and gray patches are lichens, the pioneers that start soil on bare rock. Many are decades or centuries old and grow only millimeters a year, so leave them be.'}],
  tryIt:[{title:'the sidewalk crack survey (15 minutes)',
    steps:['Find a crack in an old sidewalk or parking lot and a nearby crack in newer pavement.','Look at what is growing in each: nothing, moss, small weeds or bigger plants.','Note how much soil and debris has collected in each crack.'],
    look:'Older cracks hold more soil and later-stage plants. It is succession in miniature: what can grow depends on how much soil has built up.'}]
}};
})());

/* ---------- Island biogeography ---------- */
BioLab.addLearn((function(){
const ibM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const ibCard=(ctx,k,rows)=>dcCard(ctx,k,452,10,336,rows,{hi:false});
const ibEq=(sim,w)=>Math.round(ibM(sim,w==='A'?'eqA':'eqB'));
return {islandbio:{
  goals:{
    bio:['How species reach an island, and why some die out there','Why big islands near the mainland hold the most species','Why parks and forests act like islands','How to help wildlife move between them'],
    honors:['How species reach an island, and why some die out there','Why the number of species levels off at an equilibrium, while the species keep changing','How island size and distance move that equilibrium','Why parks and forests act like islands'],
    ap:['The MacArthur–Wilson balance of immigration and extinction','How island size and distance move the equilibrium','Why habitat fragmentation loses species','How wildlife corridors win some back']},
  matters:'Every park, open space and forest cut by roads and houses works like an island. The same rules decide how many species a Denver open space can keep, and why Colorado builds wildlife overpasses.',
  startKey:'start',startRun:true,startSpeed:0.5,
  steps:[
    {key:'pool',title:'A mainland full of species',pause:true,focus:[0,0,110,450],fresh:true,
     see:'The green strip on the left is the mainland. Each little icon is one species of bird, insect or plant: 100 species in all.',
     why:'Any of them could reach an island by flying, floating on driftwood or riding a storm. Island A (top) is big and only 10 km offshore. Island B (bottom) is small and 500 km away. Both start empty, like new volcanic islands.',
     overlay(sim,ctx,LH,k){tag(ctx,'Island A: big, 10 km away',330,40,k);tag(ctx,'Island B: small, 500 km away',560,420,k);}},
    {key:'arrive',title:'Species arrive',speed:1,focus:[100,0,700,450],fresh:true,
     see:'Watch species fly across and settle on each island. The clock runs about 20 years every second.',
     why:'Island A is close, so seeds and animals reach it often. Island B is far away, and few make it across 500 km of ocean. A fills up fast; B stays nearly empty.',
     overlay(sim,ctx,LH,k){ibCard(ctx,k,[['Year '+Math.floor(sim.t),{w:800}],['Island A: '+ibM(sim,'spA')+' species',{w:700,c:CE_GREEN}],['Island B: '+ibM(sim,'spB')+' species',{w:700,c:CE_BLUE}]]);}},
    {key:'balance',title:'Arrivals balance extinctions',speed:1,focus:[100,0,700,450],
     see:'Keep watching island A after its number of species levels off. Look at the icons, and at the arrivals and extinctions.',
     why:'The number levels off, but the island is not frozen. New species keep arriving and others keep dying out, at about the same rate. The count holds steady near an <b>equilibrium</b> while the list of species keeps changing.',
     overlay(sim,ctx,LH,k){const s=sim.st;ibCard(ctx,k,[['Island A, year '+Math.floor(sim.t),{w:800}],['Species now: '+s.SA,{w:700,c:CE_GREEN}],['Species that arrived so far: '+s.arrA],['Species that died out so far: '+s.extinctA,{c:CE_RED}]]);}},
    {key:'size',title:'Small islands lose species',set:{aArea:10},speed:1,focus:[100,0,700,260],
     cause:{from:{aArea:1000},delay:2.5,label:'Island A size',at:[300,412]},
     see:'Island A is full. Watch it shrink from 1,000 km² to 10 km², at the same distance.',
     why:'A small island holds small populations, and a small population can be wiped out by one bad winter, a storm or a disease. Extinctions rise while arrivals stay the same, so island A slides down to a lower equilibrium.',
     overlay(sim,ctx,LH,k){ibCard(ctx,k,[['Island A: '+ibM(sim,'spA')+' species',{w:800,c:CE_GREEN}],['Area: '+sim.p.aArea.toLocaleString()+' km²',{w:700}]]);}},
    {key:'dist',title:'Closer islands gain species',set:{bDist:10},speed:1,focus:[100,200,700,250],
     cause:{from:{bDist:500},delay:2.5,label:'Island B distance',at:[300,412]},
     see:'Island B, small and far. Watch it move from 500 km to 10 km offshore.',
     why:'At 10 km, birds, insects and seeds cross easily. Arrivals jump, so island B climbs to a much higher equilibrium, even though it is still small.',
     overlay(sim,ctx,LH,k){ibCard(ctx,k,[['Island B: '+ibM(sim,'spB')+' species',{w:800,c:CE_BLUE}],['Distance: '+sim.p.bDist+' km',{w:700}]]);}},
    {key:'hook',title:'Your question: bigger or closer?',set:{aArea:10,aDist:10,bArea:1000,bDist:500},speed:1.5,focus:[100,0,700,450],fresh:true,
     see:'The two choices side by side, both starting empty. Island A: the same small 10 km² island moved to 10 km offshore. Island B: made 100 times bigger, 1,000 km², but still 500 km out.',
     why:'Moving it closer wins. The small, close island levels off near <b>52 species</b>, because far more species arrive. The big, far island levels off near <b>32</b>, because big populations rarely die out but few species ever reach it. Big <i>and</i> close would hold about 84.',
     so:'For a remote place, being reachable matters more than being big. That is why connecting parks and open spaces can save as many species as making them larger.',
     overlay(sim,ctx,LH,k){ibCard(ctx,k,[['Year '+Math.floor(sim.t),{w:800}],['A (small, close): '+ibM(sim,'spA')+' species, heading for '+ibEq(sim,'A'),{w:700,c:CE_GREEN}],['B (big, far): '+ibM(sim,'spB')+' species, heading for '+ibEq(sim,'B'),{w:700,c:CE_BLUE}]]);}},
    {key:'storm',lvl:'honors',title:'After a disaster',speed:1,focus:[100,0,700,260],
     run(sim){atReset(sim);},
     see:'Island A at equilibrium. Watch a hurricane wipe out about half its species.',
     why:'With fewer species present, there are more empty spots for newcomers and fewer species left to die out. Arrivals outpace extinctions, so the island refills toward the same equilibrium. Its size and distance, not its history, set the target.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,2,'hit',s=>{const a=s.def.actions.find(x=>x.id==='hurricane');a.run(s);});ibCard(ctx,k,[['Island A: '+ibM(sim,'spA')+' species',{w:800,c:CE_GREEN}],['Equilibrium: about '+ibEq(sim,'A'),{w:700}]]);}},
    {key:'frag',lvl:'ap',title:'Fragmenting a forest',set:{frag:true},speed:1,focus:[100,0,700,260],
     cause:{from:{frag:false},delay:2.5,label:'Fragmentation',at:[300,412]},
     see:'Treat island A as a 1,000 km² forest. Watch roads and development cut it into 10 separate patches.',
     why:'Each patch acts like a small island with small populations, so extinction rises and the number of species each patch can keep falls. Habitat fragmentation is one of the biggest causes of biodiversity loss.',
     overlay(sim,ctx,LH,k){ibCard(ctx,k,[['Each patch: '+ibM(sim,'spA')+' species, heading for '+ibEq(sim,'A'),{w:800,c:CE_RED}]]);}},
    {key:'corr',lvl:'ap',title:'Wildlife corridors',set:{frag:true,corr:true,aDist:200},speed:1,focus:[100,0,700,260],
     cause:{from:{corr:false},delay:2.5,label:'Corridors',at:[300,412]},
     see:'The fragments, now 200 km from the nearest big forest. Watch strips of habitat connect them.',
     why:'Corridors make the patches easier to reach, as if they were much closer. Higher immigration offsets some of the extra extinction, so the equilibrium rises. Colorado’s wildlife overpasses on Highway 9 do this for deer and elk.',
     overlay(sim,ctx,LH,k){ibCard(ctx,k,[['Patches: '+ibM(sim,'spA')+' species, heading for '+ibEq(sim,'A'),{w:800,c:CE_GREEN}]]);}}
  ],
  useIt:[
    {do:'Keep cats indoors.',
     why:'Outdoor cats kill huge numbers of birds and small animals. In a small, isolated patch of habitat, that extra loss can wipe out a population that can’t be replaced from outside.'},
    {do:'Plant a few native flowers or shrubs in a yard, balcony pot or school garden.',
     why:'Small patches of habitat act as stepping stones between parks, making it easier for bees, butterflies and birds to reach other green spaces, like a closer island.'},
    {do:'Watch for wildlife at dusk on mountain highways, and look for the overpasses on Highway 9 near Kremmling.',
     why:'Roads split habitat in two. Crossings and fencing reconnect it: on Highway 9 they cut collisions with deer and elk by about 90%.'}],
  tryIt:[{title:'the park bird count (two 15-minute visits)',
    steps:['Visit a large park or open space and sit still for 15 minutes.','Tally each different kind of bird you see or hear (you don’t need names; “small brown one” counts).','Do the same in a small pocket park or a schoolyard surrounded by buildings.'],
    look:'The large park usually holds more kinds of birds. Then compare two parks of similar size, one next to other green space and one cut off: connection matters too.'}]
}};
})());

/* ---------- Biomes ---------- */
BioLab.addLearn((function(){
const bmM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const bmCard=(ctx,k,rows)=>dcCard(ctx,k,66,46,214,rows,{hi:false});
const cl=sim=>[[bmM(sim,'tavg').toFixed(1)+' °C · '+Math.round(bmM(sim,'ptot'))+' cm a year',{w:800}],['Biome: '+bmM(sim,'biome'),{w:700,c:CE_GREEN}]];
return {biomes:{
  goals:{
    bio:['How to read a climatograph','How temperature and precipitation together decide the biome','Why Denver is prairie while Boston is forest','The world’s major biomes and what limits life in each'],
    honors:['How to read a climatograph','How temperature and precipitation together decide the biome','Why Denver is prairie while Boston is forest','Why the timing of rain matters, not just the total','The limiting factor in each biome'],
    ap:['How to read a climatograph and the Whittaker diagram','Why Denver is prairie while Boston is forest','Why the timing of rain matters, not just the total','How climate change can shift a place into a different biome']},
  matters:'Why does Denver need sprinklers to grow a lawn, while Boston grows forest on its own? Why does Southern California burn every fall? The answer is the same: climate decides what can grow.',
  startKey:'start',
  steps:[
    {key:'read',title:'Reading a climatograph',pause:true,set:{place:'denver'},focus:[400,30,400,270],
     see:'Denver’s climatograph. The red line is the average temperature each month. The blue bars are the rain and snow (as water) each month.',
     why:'Denver is cold in winter and warm in summer, with most of its precipitation in spring and summer. Add up the bars and you get about 38 cm a year. On the Whittaker diagram at left, that puts the red dot in temperate grassland: before the city, this was shortgrass prairie.',
     overlay(sim,ctx,LH,k){tag(ctx,'Temperature each month',640,30,k);tag(ctx,'Precipitation each month',560,282,k);bmCard(ctx,k,cl(sim));}},
    {key:'water',title:'Water decides forest or grass',pause:true,set:{place:'custom',tmean:10,pcm:120},focus:[40,30,370,380],
     cause:{from:{pcm:40},delay:2,dur:4,label:'Yearly precipitation',at:[230,412]},
     see:'A place as warm as Denver, about 10 °C. Watch its yearly precipitation rise from 40 cm to 120 cm, and watch the dot and the landscape.',
     why:'At 10 °C, under about 25 cm a year is desert, 25 to 60 cm is grassland, and more than about 60 cm is enough water for trees. Trees need more water than grasses, because they have to keep a large body alive all year.',
     overlay(sim,ctx,LH,k){bmCard(ctx,k,cl(sim));}},
    {key:'hook',title:'Your question: Denver vs Boston',pause:true,set:{place:'boston'},focus:[40,30,760,400],
     cause:{from:{place:'denver'},delay:2.5,label:'Place',at:[230,412]},
     see:'Denver’s climate. Watch it switch to Boston’s, and compare the blue bars and the dot.',
     why:'The temperatures are almost the same, about 10 °C and 11 °C. But Boston gets about <b>113 cm</b> of precipitation a year, three times Denver’s <b>38 cm</b>, and it falls in every month. At 10 °C the switch from grassland to forest is at about 60 cm, so Denver would need about 22 cm more. Water, not warmth, keeps trees off the Denver plains.',
     so:'That is why a Denver lawn needs watering and why Denver Water limits summer watering to set days each week. Boston lawns mostly get by on rain.',
     overlay(sim,ctx,LH,k){bmCard(ctx,k,[[sim.p.place==='boston'?'Boston':'Denver',{w:800}]].concat(cl(sim)));}},
    {key:'desert',title:'Desert: water is the limit',pause:true,set:{place:'phoenix'},focus:[400,30,400,420],
     see:'Phoenix, Arizona. Look at the height of the blue bars.',
     why:'Phoenix is hot all year, with plenty of sunlight, but gets only about 20 cm of rain a year. Under about 25 cm a year is desert. Plants survive by storing water (cacti) or having tiny, waxy leaves that lose little. Here water, not warmth, is the <b>limiting factor</b>.',
     overlay(sim,ctx,LH,k){bmCard(ctx,k,cl(sim));}},
    {key:'cold',title:'Tundra and taiga: cold is the limit',pause:true,set:{place:'fairbanks'},focus:[40,30,760,400],
     cause:{from:{place:'utqiagvik'},delay:3,label:'Place',at:[230,412]},
     see:'Utqiaġvik, on the Arctic coast of Alaska. Watch it switch to Fairbanks, in the middle of Alaska, and look at the summer months.',
     why:'Both are dry and bitterly cold in winter. Utqiaġvik’s summer barely gets above freezing, so the ground stays frozen (permafrost) and only mosses, lichens and dwarf shrubs grow: <b>tundra</b>. Fairbanks gets a real summer, about 17 °C for a few months, long enough for spruce and other conifers: <b>taiga</b>.',
     overlay(sim,ctx,LH,k){bmCard(ctx,k,cl(sim));}},
    {key:'tropics',title:'Hot and wet all year',pause:true,set:{place:'manaus'},focus:[40,30,760,400],
     see:'Manaus, Brazil, in the Amazon. Look at how flat the red line is and how tall the bars are.',
     why:'It is about 27 °C every month and rains about 230 cm a year. Plants can grow all year with no cold season and no dry season, so the forest is tall, dense and layered, with more kinds of plants and animals than any other biome on land: <b>tropical rainforest</b>.',
     overlay(sim,ctx,LH,k){bmCard(ctx,k,cl(sim));}},
    {key:'savanna',title:'A dry season makes a savanna',pause:true,set:{place:'serengeti'},focus:[400,30,400,420],
     see:'The Serengeti in Tanzania. Look at June through September.',
     why:'It is warm all year like the Amazon, but it gets about 90 cm of rain, and almost none falls for four months. Trees can’t survive the long drought everywhere, so grasses dominate with scattered trees: <b>savanna</b>, home to the great herds of zebras and wildebeest.',
     overlay(sim,ctx,LH,k){bmCard(ctx,k,cl(sim));}},
    {key:'chaparral',lvl:'honors',title:'When the rain falls matters',pause:true,set:{place:'losangeles'},focus:[400,30,400,420],
     see:'Los Angeles. Compare the summer bars with the winter bars.',
     why:'LA gets about 37 cm a year, like Denver, but almost all of it in winter. Summers are hot and nearly rainless, so tough, fire-adapted shrubs win: <b>chaparral</b>. By fall the shrubs are dry fuel, which is why Southern California burns so often.',
     overlay(sim,ctx,LH,k){bmCard(ctx,k,cl(sim));}},
    {key:'shift',lvl:'ap',title:'Climate change shifts biomes',pause:true,set:{place:'denver',warm:3,pchg:-40},focus:[40,30,370,380],
     cause:{from:{warm:0,pchg:0},delay:2.5,dur:4,label:'Climate change',at:[230,412]},
     see:'Denver. Watch its climate warm 3 °C and lose 40% of its precipitation.',
     why:'The dot moves right and down, from about 10 °C and 38 cm to about 13 °C and 23 cm, under the 25 cm desert line. Warmer air also dries soil faster, so even the same rain would go less far. Biome boundaries moving uphill and poleward are one of the major impacts of climate change.',
     overlay(sim,ctx,LH,k){bmCard(ctx,k,cl(sim));}}
  ],
  useIt:[
    {do:'If your family plants anything, look for “xeric” or native plants labeled for the Front Range.',
     why:'Denver is a grassland with about 38 cm of precipitation a year. Plants from the prairie need far less watering than a Kentucky bluegrass lawn or plants from wetter climates.'},
    {do:'On your next drive or hike up into the mountains, watch the plants change with elevation.',
     why:'Climbing from Denver to about 3,500 m takes you from prairie through pine and then spruce-fir forest to alpine tundra, because higher ground is colder and wetter. It is like driving from Denver to the Arctic.'},
    {do:'Before you travel, look up the destination’s climatograph.',
     why:'It tells you what to pack and when to go: the wet season in the tropics, the dry summer in California, or the short summer in Alaska.'}],
  tryIt:[{title:'make your town’s climatograph (20 minutes)',
    steps:['Look up your town’s average monthly temperature and precipitation (search “[your town] climate normals”).','On graph paper, draw a bar for each month’s precipitation and a line for each month’s temperature.','Add up the year’s precipitation and average the temperatures, then find your spot on the Whittaker diagram.'],
    look:'Check whether the biome it predicts matches the plants that grow wild near you, not the watered lawns.'}]
}};
})());

/* ---------- Primary productivity ---------- */
BioLab.addLearn((function(){
const pdM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const pdCard=(ctx,k,rows)=>dcCard(ctx,k,190,50,330,rows,{hi:false});
const hrs=sim=>Math.min(24,sim.st.h);
const three=sim=>[['Hour '+hrs(sim).toFixed(0)+' of 24',{w:800}],['Light bottle: '+pdM(sim,'dol').toFixed(2)+' mg/L',{w:700,c:CE_GREEN}],['Dark bottle: '+pdM(sim,'dod').toFixed(2)+' mg/L',{w:700,c:CE_RED}]];
return {productivity:{
  goals:{
    bio:['How algae both make and use oxygen','How the light and dark bottle lab measures each one','What gross and net primary productivity mean','Why a green pond can run out of oxygen at night'],
    honors:['How algae both make and use oxygen','How to calculate GPP, NPP and respiration from three bottles','How light, nutrients and temperature change productivity','Why a green pond can run out of oxygen at night'],
    ap:['How to calculate GPP, NPP and respiration from three bottles','Why photosynthesis levels off at high light','How to convert oxygen to carbon','How nutrients drive eutrophication and dawn fish kills']},
  matters:'Every food web starts with the energy plants and algae capture. Measuring it explains why fertilizer turns ponds green and why fish die there just before dawn.',
  startKey:'start',startRun:false,
  steps:[
    {key:'bottles',title:'Three bottles of pond water',pause:true,fresh:true,focus:[0,120,800,240],
     see:'Three bottles filled with the same pond water. One is measured right away. One is clear glass. One is wrapped in foil so no light gets in.',
     why:'The water holds tiny algae (green dots) and dissolved oxygen (the bubbles). Algae make oxygen by photosynthesis, but only in light. They also use oxygen for respiration all the time, day and night, just like you. The bottles let you measure each process separately.',
     overlay(sim,ctx,LH,k){tag(ctx,'Measured at the start',78,366,k);tag(ctx,'Light: photosynthesis and respiration',330,140,k,{s:12.5});tag(ctx,'Dark: respiration only',580,140,k,{s:12.5});}},
    {key:'incubate',title:'24 hours under the lamp',speed:1,fresh:true,focus:[160,40,620,350],
     see:'The bottles are sealed and sit under the lamp for 24 hours. The clock runs about 2 hours every second. Watch the bubbles and the numbers.',
     why:'In the clear bottle, the algae make more oxygen than they use, so oxygen builds up. In the foil bottle they can only use it, so oxygen falls. Same water, same algae: the only difference is light.',
     overlay(sim,ctx,LH,k){pdCard(ctx,k,three(sim));}},
    {key:'calc',title:'Gross and net productivity',speed:3,fresh:true,focus:[160,40,620,350],
     see:'The same 24 hours, faster. When it finishes, look at the three numbers the card works out.',
     why:'The dark bottle’s drop is <b>respiration (R)</b>. The light bottle’s gain is what is left after respiration: <b>net primary productivity (NPP)</b>. Add them and you get all the oxygen the algae made: <b>gross primary productivity (GPP)</b>. So GPP = light − dark, NPP = light − initial, and NPP = GPP − R.',
     overlay(sim,ctx,LH,k){const done=sim.st.h>=23.9;pdCard(ctx,k,done?[['After 24 hours (mg O₂/L/day)',{w:800}],['Respiration = initial − dark = '+pdM(sim,'rr').toFixed(2),{w:700,c:CE_RED}],['NPP = light − initial = '+pdM(sim,'npp').toFixed(2),{w:700,c:CE_GREEN}],['GPP = light − dark = '+pdM(sim,'gpp').toFixed(2),{w:800}]]:three(sim));}},
    {key:'night',title:'When the light goes out',speed:1.5,fresh:true,focus:[160,40,620,350],
     run(sim){atReset(sim);},
     see:'Watch the clear bottle when the lamp switches off halfway through.',
     why:'With no light, the clear bottle is no different from the foil one: photosynthesis stops, respiration goes on, and oxygen falls. A real pond does this every night.',
     overlay(sim,ctx,LH,k){if(sim.st.h>=12&&sim.p.light!==0&&!sim._pdOff){sim._pdOff=1;BioLab.setValues(sim,{light:0});}if(sim.st.h<1)sim._pdOff=0;pdCard(ctx,k,[['Lamp: '+(sim.p.light?'on':'off'),{w:800,c:sim.p.light?PAL['cv-ink']:CE_RED}]].concat(three(sim).slice(1)));}},
    {key:'hook',title:'Your question: fertilizer in the pond',set:{nut:'high'},speed:2,fresh:true,focus:[160,40,620,350],
     see:'Fertilizer has washed into the pond and the algae doubled. Watch 24 hours again, especially the dark bottle.',
     why:'Twice the algae means twice the respiration. The dark bottle drops from 8.23 to about <b>5.59 mg/L</b>, nearly twice as far as with normal nutrients (6.79). In full light the same water climbs to about 14.8 mg/L. More algae means bigger swings: more oxygen by day, less by night.',
     so:'That is why fish kills in warm, green ponds happen around sunrise, after a whole night of respiration with no photosynthesis. Most fish need several mg/L of oxygen.',
     overlay(sim,ctx,LH,k){pdCard(ctx,k,[['Nutrients: high (twice the algae)',{w:800}]].concat(three(sim).slice(1)));}},
    {key:'warm',lvl:'honors',title:'Warm water',set:{temp:30},speed:2,fresh:true,focus:[160,40,620,350],
     see:'The same bottles in a 30 °C water bath instead of 20 °C. Watch the dark bottle.',
     why:'Respiration is run by enzymes that speed up as water warms, roughly doubling every 10 °C, so the dark bottle drops faster. Warm water also holds less oxygen to begin with. Together, that is why warm, still ponds in late summer are most at risk.',
     overlay(sim,ctx,LH,k){pdCard(ctx,k,[['Water bath: '+sim.p.temp+' °C',{w:800}]].concat(three(sim).slice(1)));}},
    {key:'sat',lvl:'ap',title:'Light saturation',set:{light:50},speed:3,fresh:true,focus:[160,40,620,350],
     see:'Half the light (50%). Compare the GPP with full light.',
     why:'At 50% light GPP is about 3.75 mg O₂/L/day, not half of full light’s 4.62 but about 80% of it. As light rises, the algae’s enzymes and pigments become the limit, so photosynthesis levels off. To report productivity as carbon, multiply mg O₂ by 0.375 (12 g of C per 32 g of O₂) and by 1,000 L per m³.',
     overlay(sim,ctx,LH,k){const done=sim.st.h>=23.9;pdCard(ctx,k,done?[['50% light, after 24 hours',{w:800}],['GPP: '+pdM(sim,'gpp').toFixed(2)+' mg O₂/L/day',{w:700}],['As carbon: '+Math.round(pdM(sim,'gppc')).toLocaleString()+' mg C/m³/day',{w:700,c:CE_GREEN}]]:three(sim));}}
  ],
  useIt:[
    {do:'If you keep an aquarium, run the air pump at night, even in a tank full of plants.',
     why:'Plants make oxygen only in light. At night they keep using it, so a crowded tank has the least oxygen just before the lights come on.'},
    {do:'Use less lawn fertilizer, and never before a heavy rain.',
     why:'Runoff carries nitrogen and phosphorus into ponds and creeks, where it feeds algae blooms. More algae means deeper oxygen crashes at night.'},
    {do:'If you see a green pond with dead fish, check the time and the weather.',
     why:'Fish kills usually happen at dawn after warm, still, cloudy days, when algae have made little oxygen but used it all night. Report large fish kills to Colorado Parks and Wildlife.'}],
  tryIt:[{title:'the bubbling leaf (1 hour)',
    steps:['Put a fresh spinach leaf or a sprig of an aquarium plant in a clear glass of water with a pinch of baking soda.','Set it in bright sunlight and watch the leaf for 10 minutes.','Move it into a dark closet for 10 minutes, then check again.'],
    look:'In sunlight, tiny oxygen bubbles form on the leaf. In the dark they stop forming: photosynthesis needs light, the same as in the light bottle.'}]
}};
})());

/* ---------- Tragedy of the commons ---------- */
BioLab.addLearn((function(){
const cmM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const cmCard=(ctx,k,rows)=>dcCard(ctx,k,546,8,246,rows,{hi:false});
/* keep a running total of your catch, and stop after `n` seasons */
function cmRun(sim,n){const s=sim.st;if(s._mine==null){s._mine=0;s._seen=0;}if(s._seen<s.season){s._mine+=s.catches[0]*(s.season-s._seen);s._seen=s.season;}
  if(s.season>=n&&sim.running){sim.running=false;if(sim.ui&&sim.ui.play)sim.ui.play.textContent='Play';}return s._mine;}
const n0=v=>Math.round(v).toLocaleString();
return {commons:{
  goals:{
    bio:['What a “commons” is, and why shared resources are easy to overuse','How a fish population replaces what is caught, up to a point','Why one fleet taking more can ruin the lake for everyone','How limits keep a shared resource going'],
    honors:['What a “commons” is, and why shared resources are easy to overuse','How a fish population replaces what is caught, up to a point','Why one fleet taking more can ruin the lake for everyone','How a shared quota saves the lake'],
    ap:['What a “commons” is, and why shared resources are easy to overuse','How surplus growth sets a sustainable catch','Why overfishing collapses a stock that is slow to recover','How quotas and the maximum sustainable yield work']},
  matters:'Fisheries, groundwater, the Colorado River, clean air and even a shared group project all work like this lake. Understanding the trap is the first step to avoiding it.',
  startKey:'start',startRun:false,
  steps:[
    {key:'lake',title:'One lake, four fleets',pause:true,fresh:true,focus:[0,90,800,345],
     see:'Four fishing fleets share one lake of 8,000 fish. The red boat is yours. Each fish drawn stands for 100 real fish.',
     why:'Nobody owns the fish, so any fleet can take them. A resource that everyone can use but no one owns is a <b>commons</b>. Each season the fish reproduce, then all four fleets fish.',
     overlay(sim,ctx,LH,k){tag(ctx,'Your fleet',290,70,k,{hi:true});tag(ctx,'The other three fleets',560,70,k);}},
    {key:'careful',title:'Fishing carefully',speed:6,fresh:true,focus:[0,0,800,450],
     run(sim){sim.st._mine=null;},
     see:'Every fleet fishes carefully: you take 300 fish a season. Watch 40 seasons go by, and the fish count.',
     why:'Each season the lake grows new fish. The fewer fish there are (below the lake’s limit), the faster they reproduce, because each has more food and room. The lake settles at about 5,800 fish, where the new fish each season match what the fleets take. That catch can go on forever.',
     overlay(sim,ctx,LH,k){const m=cmRun(sim,40);cmCard(ctx,k,[['Season '+sim.st.season,{w:800}],['Fish in the lake: '+n0(cmM(sim,'fish')),{w:700,c:CE_BLUE}],['Your total catch: '+n0(m),{w:700,c:CE_GREEN}]]);}},
    {key:'hook',title:'Your question: 1,000 fish a season',set:{catch:1000},speed:6,fresh:true,focus:[0,0,800,450],
     run(sim){sim.st._mine=null;},
     see:'Same lake, same careful fleets, but now your fleet takes 1,000 fish a season. Watch 40 seasons.',
     why:'For a few seasons you catch more than ever. But the fleets now take more than the lake can replace, so the fish shrink every season, and around season 15 the lake collapses. After that every fleet catches nothing. Your total ends near <b>11,400 fish</b>, less than the careful plan’s <b>12,000</b>, and the careful plan still leaves a healthy lake of about 5,800 fish.',
     so:'Taking more now cost you more later, and it cost the other fleets too, even though they fished carefully.',
     overlay(sim,ctx,LH,k){const m=cmRun(sim,40);cmCard(ctx,k,[['Season '+sim.st.season,{w:800}],['Fish in the lake: '+n0(cmM(sim,'fish')),{w:700,c:CE_BLUE}],['Your total catch: '+n0(m),{w:700,c:CE_RED}]]);}},
    {key:'tragedy',title:'The tragedy of the commons',set:{catch:1200,others:'greedy'},speed:3,fresh:true,focus:[0,0,800,450],
     run(sim){sim.st._mine=null;},
     see:'Now every fleet thinks the same way: “If I don’t take the fish, someone else will.” Watch what happens.',
     why:'Each fleet keeps all the profit from every extra fish it lands, but the damage to the lake is shared by all four. So each one has a reason to take more, and together they empty the lake in about 5 seasons. Each acted in its own interest, and everyone lost. That is the <b>tragedy of the commons</b>.',
     overlay(sim,ctx,LH,k){cmRun(sim,15);cmCard(ctx,k,[['Season '+sim.st.season,{w:800}],['Fish in the lake: '+n0(cmM(sim,'fish')),{w:700,c:CE_RED}],['Lake: '+cmM(sim,'status'),{w:700}]]);}},
    {key:'quota',lvl:'honors',title:'A shared limit',set:{catch:1200,others:'greedy',quota:true,quotaAmt:800},speed:3,fresh:true,focus:[0,0,800,450],
     run(sim){sim.st._mine=null;},
     see:'The same greedy fleets, but they agree on a total quota of 800 fish a season, 200 each.',
     why:'The quota holds everyone’s catch below what the lake can replace. The lake stays healthy, near 7,900 fish, and every fleet keeps catching 200 a season for as long as the agreement holds. Limits work when everyone follows them and someone checks.',
     overlay(sim,ctx,LH,k){cmRun(sim,30);cmCard(ctx,k,[['Season '+sim.st.season+' · quota 800',{w:800}],['Fish in the lake: '+n0(cmM(sim,'fish')),{w:700,c:CE_GREEN}],['Lake: '+cmM(sim,'status'),{w:700}]]);}},
    {key:'msy',lvl:'ap',title:'Maximum sustainable yield',set:{catch:300},speed:6,fresh:true,focus:[0,0,800,450],
     run(sim){sim.st._mine=null;},
     see:'Back to careful fishing. Watch the surplus growth each season, and the most the lake could ever give.',
     why:'Surplus growth is highest at a middle population, not when the lake is full (no room) or nearly empty (too few parents). The peak is the <b>maximum sustainable yield (MSY)</b>. Catch more than MSY every year and the stock falls; real managers aim below it because counts and growth rates are uncertain.',
     overlay(sim,ctx,LH,k){cmRun(sim,40);cmCard(ctx,k,[['Surplus growth: '+n0(cmM(sim,'surplus'))+' fish/season',{w:700}],['MSY: '+n0(cmM(sim,'msy'))+' fish/season',{w:800,c:CE_RED}]]);}}
  ],
  useIt:[
    {do:'Follow bag limits and release undersized fish when you fish in Colorado.',
     why:'Colorado Parks and Wildlife sets daily limits so one person’s catch doesn’t empty a lake for everyone. It is a quota for a commons.'},
    {do:'In your next group project, agree on who does what before you start.',
     why:'A group grade is a commons: each person gains by doing less while the cost is shared. Clear roles and checking in are the same fix as a fishing quota.'},
    {do:'Take shorter showers in a dry year.',
     why:'Colorado’s rivers and aquifers are shared commons. Each household’s use looks small, but together it decides whether there is enough for everyone downstream.'}],
  tryIt:[{title:'the cracker game (15 minutes, 4 people)',
    steps:['Put 16 small crackers or candies in a shared bowl: the “lake.”','Each round, each player takes as many as they want, at the same time.','After each round, add one new piece for every two left in the bowl. Play 6 rounds, or until the bowl is empty.'],
    look:'Groups that grab early usually empty the bowl by round 2 or 3. Groups that agree on a limit can keep it going and end up with more each.'}]
}};
})());

/* ---------- Tree carbon ---------- */
BioLab.addLearn((function(){
const tcM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const tcCard=(ctx,k,rows)=>dcCard(ctx,k,250,40,296,rows,{hi:false});
const n0=v=>Math.round(v).toLocaleString();
const rows=sim=>[['Age '+Math.round(sim.st.age)+' years',{w:800}],['Carbon stored: '+n0(tcM(sim,'C'))+' kg',{w:700,c:CE_GREEN}],['Added this year: '+tcM(sim,'seq').toFixed(1)+' kg',{w:700}]];
return {treecarbon:{
  goals:{
    bio:['Where a tree’s wood comes from: carbon dioxide out of the air','How to estimate a tree’s carbon from two measurements','Why a tree’s carbon keeps growing while its yearly intake rises and then falls','How many trees it takes to offset one person’s carbon'],
    honors:['Where a tree’s wood comes from: carbon dioxide out of the air','How diameter and height give green weight, dry weight and carbon','Carbon storage vs carbon sequestration','Scaling one tree up to a hectare of forest'],
    ap:['Where a tree’s wood comes from: carbon dioxide out of the air','Carbon storage vs carbon sequestration','Scaling one tree up to a hectare of forest','What happens to the carbon after a fire or a harvest']},
  matters:'Planting trees is one of the most talked-about climate fixes. Measuring real trees shows what they can do, and why trees alone can’t offset a modern lifestyle.',
  question:'A 45-year-old green ash on campus is about 53 cm across and 15 m tall. How much carbon does it store, and how many trees like it would it take to take in one American’s carbon each year (about 4,363 kg)?',
  startKey:'start',startRun:false,
  steps:[
    {key:'grow',title:'Wood made from air',set:{species:'ash',age:1},speed:2,focus:[0,40,560,400],
     see:'A green ash seedling. Watch it grow, year by year. The blue CO₂ bubbles show carbon dioxide being taken in from the air.',
     why:'Through photosynthesis, a tree takes carbon dioxide from the air and builds the carbon into sugar, then into wood, bark, roots and leaves. About half of a tree’s dry weight is carbon, and nearly all of it came out of the air, not the soil.',
     overlay(sim,ctx,LH,k){tcCard(ctx,k,rows(sim));}},
    {key:'measure',title:'Two measurements tell you its carbon',pause:true,set:{species:'ash',age:45},focus:[0,40,560,400],
     see:'The same tree at 45 years. The gold band marks the trunk at breast height, 1.4 m above the ground. The ruler on the left measures height.',
     why:'You can’t weigh a living tree, but you can measure two things: the trunk’s diameter at breast height and the height. Wood weight goes up with diameter squared times height, like the volume of a cylinder. Half the fresh weight is water, and half of what is left is carbon.',
     so:{honors:'Green weight GW = 0.0346 × d² × h for trunks 28 cm or wider (0.0577 for smaller ones). Dry weight = GW × 0.5. Carbon = dry weight × 0.5.'},
     overlay(sim,ctx,LH,k){tcCard(ctx,k,[['Diameter: '+tcM(sim,'d').toFixed(0)+' cm · Height: '+tcM(sim,'h').toFixed(1)+' m',{w:700}],['Carbon stored: '+n0(tcM(sim,'C'))+' kg',{w:800,c:CE_GREEN}]]);}},
    {key:'curves',title:'Storage keeps rising; intake peaks',set:{species:'ash',age:10},speed:3,focus:[0,40,800,400],
     see:'Watch the ash from 10 to about 120 years. Compare “Carbon stored” with “Added this year.”',
     why:'Carbon <b>storage</b> is the total in the tree, and it keeps climbing as long as the tree lives. Carbon <b>sequestration</b> is how much it adds each year: it rises while the tree grows fast, peaks around age 40 to 50, then falls as growth slows. Old trees hold the most carbon; middle-aged trees add it fastest.',
     overlay(sim,ctx,LH,k){tcCard(ctx,k,rows(sim));}},
    {key:'species',title:'Species matters',set:{species:'cottonwood',age:45},pause:true,focus:[0,40,800,400],
     cause:{from:{species:'ash'},delay:2.5,label:'Species',at:[280,425]},
     see:'The 45-year-old ash. Watch it switch to a plains cottonwood of the same age.',
     why:'Cottonwoods grow fast and huge along Colorado’s rivers: at 45 years about 84 cm across and 22 m tall. This one stores about 1,370 kg of carbon, more than three times the ash’s 381 kg. Wide trunks count most, because carbon goes up with diameter squared.',
     overlay(sim,ctx,LH,k){tcCard(ctx,k,[[sim.p.species==='cottonwood'?'Plains cottonwood, 45 years':'Green ash, 45 years',{w:800}],['Carbon stored: '+n0(tcM(sim,'C'))+' kg',{w:800,c:CE_GREEN}],['Added this year: '+tcM(sim,'seq').toFixed(1)+' kg',{w:700}]]);}},
    {key:'hook',title:'Your question: offsetting one person',set:{species:'ash',age:45},pause:true,focus:[0,40,800,400],
     see:'The 45-year-old green ash on campus.',
     why:'It stores about <b>381 kg</b> of carbon and adds about <b>12.5 kg a year</b>. One American’s footprint is about 4,363 kg of carbon a year, so it would take about <b>350 trees like this one</b>, each taking in carbon every year, to keep up. Planted 400 to a hectare, that is close to a whole hectare of forest, about two football fields, per person.',
     so:'Trees help, and forests store huge amounts of carbon, but planting cannot keep up with a modern lifestyle by itself. Cutting emissions matters at least as much.',
     overlay(sim,ctx,LH,k){const s=tcM(sim,'seq');tcCard(ctx,k,[['Stores '+n0(tcM(sim,'C'))+' kg C · adds '+s.toFixed(1)+' kg/yr',{w:700}],['Trees to offset one person: about '+n0(4363/s),{w:800,c:CE_RED}]]);}},
    {key:'stand',lvl:'honors',title:'From one tree to a forest',set:{species:'ash',age:45,view:'stand'},pause:true,focus:[0,40,800,400],
     see:'A hectare of forest (100 m × 100 m) of 45-year-old ash, 400 trees.',
     why:'Multiply one tree by the number per hectare: 400 × 381 kg ≈ 152 tonnes of carbon stored, and about 5 tonnes added each year. Real forests also store a lot of carbon in roots and soil, which this estimate leaves out.',
     overlay(sim,ctx,LH,k){tcCard(ctx,k,[['Stored: '+tcM(sim,'standC').toFixed(0)+' t C/ha',{w:800,c:CE_GREEN}],['Added: '+tcM(sim,'standSeq').toFixed(1)+' t C/ha/yr',{w:700}]]);}},
    {key:'fire',lvl:'ap',title:'Fire or harvest',set:{species:'ash',age:80},speed:1,focus:[0,40,800,400],
     run(sim){atReset(sim);},
     see:'An 80-year-old stand. Watch it burn, then follow where its carbon goes.',
     why:'Fire sends much of the stored carbon back to the air as CO₂ within a few years, as the burned wood decays. A timber harvest keeps part of it in lumber for decades. Either way, a young forest regrows and starts taking carbon in again, but it takes decades to rebuild what was lost.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,2,'burn',s=>{const a=s.def.actions.find(x=>x.id==='burn');if(a)a.run(s);});tcCard(ctx,k,[['CO₂ returned to the air: '+tcM(sim,'air').toFixed(0)+' t CO₂/ha',{w:800,c:CE_RED}]]);}}
  ],
  useIt:[
    {do:'If your family plants a tree, pick one that suits Colorado and give it room to grow big.',
     why:'A tree stores the most carbon, and gives the most shade, when it lives long and gets large. A tree that dies young from drought or crowding gives most of its carbon back.'},
    {do:'Water young trees deeply during dry spells for their first few years.',
     why:'Young trees grow fast and take in carbon quickly, but in Colorado’s dry climate they often die before they get big. A few long soaks a month help them survive.'},
    {do:'Count the trees on your block or campus.',
     why:'At about 350 mature trees per person per year, you can see why trees help but can’t do the job alone. Cutting energy use, like walking or biking short trips, makes up the rest.'}],
  tryIt:[{title:'measure a real tree (20 minutes)',
    steps:['Wrap a string around a tree trunk 1.4 m (about chest height) above the ground and measure the string: that is the circumference.','Diameter = circumference ÷ π.','Estimate height: stand where the top of the tree is at 45° (a folded square of paper helps). Your distance from the trunk plus your eye height is about the height.'],
    look:'Use GW = 0.0346 × d² × h (or 0.0577 if d is under 28 cm), then halve twice to get kg of carbon. Big old trees often store several tonnes.'}]
}};
})());

/* ---------- Mining ---------- */
BioLab.addLearn((function(){
const mnM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const mnCard=(ctx,k,rows)=>dcCard(ctx,k,440,296,350,rows,{hi:false});
const n0=v=>Math.round(v).toLocaleString();
const money=v=>(v<0?'−$':'$')+n0(Math.abs(v))+' million a year';
return {mining:{
  goals:{
    bio:['How an open-pit copper mine works','Why low-grade ore means far more waste rock for each tonne of copper','Why deep ore and low prices can make a mine lose money','How acid drainage happens, and what reclamation does'],
    honors:['How an open-pit copper mine works','Why low-grade ore means far more waste rock and tailings','How cost, depth and price decide whether a mine pays','How acid drainage happens, and what reclamation does'],
    ap:['Ore grade, strip ratio and rock moved per tonne of copper','When underground mining beats an open pit','Break-even grade and the role of the copper price','Acid mine drainage chemistry and reclamation']},
  matters:'Every phone, charger, electric car and wind turbine is full of copper. Getting it means moving mountains of rock, and Colorado still lives with the streams that old mines left acidic.',
  question:'In 1900, copper ore was about 5% copper. Today it is about 0.6%. To get one tonne of copper, roughly the wiring in a dozen electric cars, how much rock does a mine have to move now compared with then?',
  startKey:'start',startRun:true,
  steps:[
    {key:'pit',title:'An open-pit copper mine',pause:true,focus:[0,40,800,380],
     see:'A cross-section of a large open-pit copper mine, about 1.8 km across. The trucks carry rock up the benches.',
     why:'The copper is spread through the green ore body as tiny grains. To reach it, the mine first removes the <b>overburden</b>, the rock on top, and piles it as waste rock. The ore goes to the mill, where it is crushed and the copper is separated out. The ground-up leftovers become <b>tailings</b>.',
     overlay(sim,ctx,LH,k){tag(ctx,'Overburden becomes waste rock',140,200,k);tag(ctx,'Ore: about 0.6% copper',420,300,k,{hi:true});tag(ctx,'Leftover ground rock',700,190,k);}},
    {key:'hook',title:'Your question: then and now',set:{grade:0.6},pause:true,focus:[0,40,800,400],
     cause:{from:{grade:5},delay:2.5,dur:3.5,label:'Ore grade',at:[300,425]},
     see:'The same mine with 1900’s rich ore, 5% copper. Watch the grade fall to today’s 0.6%, and watch the numbers.',
     why:'At 5% copper, a mine digs about 23 tonnes of ore and moves about <b>84 tonnes</b> of rock in all for each tonne of copper. At 0.6%, it digs about 189 tonnes of ore and moves about <b>700 tonnes</b>, more than 8 times as much. Almost all of it ends up as waste rock and tailings.',
     so:'The rich, easy ore was mined first. As the world uses more copper, each tonne takes more digging, more energy, more water and more land.',
     overlay(sim,ctx,LH,k){mnCard(ctx,k,[['Ore grade: '+sim.p.grade.toFixed(1)+'% copper',{w:800}],['Ore per tonne of copper: '+n0(mnM(sim,'orePer'))+' t',{w:700}],['All rock moved: '+n0(mnM(sim,'rockPer'))+' t',{w:800,c:CE_RED}]]);}},
    {key:'deep',title:'Deeper ore costs more',set:{depth:500},pause:true,focus:[0,40,800,400],
     cause:{from:{depth:150},delay:2.5,dur:3,label:'Depth to the ore',at:[300,425]},
     see:'Watch the ore body sink from 150 m to 500 m below the surface.',
     why:'An open pit has sloping sides, so a deeper pit is much wider at the top. Moving all that extra overburden quadruples the rock per tonne of copper, and the mine goes from earning about $870 million a year to losing about $1.3 billion.',
     overlay(sim,ctx,LH,k){mnCard(ctx,k,[['Depth: '+sim.p.depth+' m',{w:800}],['All rock moved: '+n0(mnM(sim,'rockPer'))+' t per t of copper',{w:700}],['Profit: '+money(mnM(sim,'profit')),{w:800,c:mnM(sim,'profit')<0?CE_RED:CE_GREEN}]]);}},
    {key:'under',title:'Going underground',set:{depth:500,method:'under'},pause:true,focus:[0,40,800,400],
     cause:{from:{method:'surface'},delay:2.5,label:'Mining method',at:[300,425]},
     see:'The deep ore again. Watch the mine switch from an open pit to tunnels underground.',
     why:'Underground, the mine digs only the ore and a little tunnel rock, so it moves far less rock and disturbs much less land. But tunneling costs more per tonne. For deep ore it loses much less money than an open pit; for shallow ore the pit is cheaper.',
     overlay(sim,ctx,LH,k){mnCard(ctx,k,[['Method: '+(sim.p.method==='under'?'underground':'open pit'),{w:800}],['All rock moved: '+n0(mnM(sim,'rockPer'))+' t per t of copper',{w:700}],['Profit: '+money(mnM(sim,'profit')),{w:800,c:mnM(sim,'profit')<0?CE_RED:CE_GREEN}]]);}},
    {key:'acid',title:'Acid drainage and reclamation',set:{recl:'full'},pause:true,focus:[0,40,800,400],
     cause:{from:{recl:'none'},delay:3,label:'Reclamation',at:[300,425]},
     see:'The waste rock is left bare. Watch what happens when the company regrades, covers and replants it and treats the water.',
     why:'Waste rock often holds pyrite (FeS₂). Rain and air turn it into sulfuric acid, which dissolves metals like iron, copper and zinc into streams and can kill fish: <b>acid mine drainage</b>. Covering the rock, replanting and treating the water cut the risk from severe to low, for a small share of the mine’s profit.',
     overlay(sim,ctx,LH,k){mnCard(ctx,k,[['Reclamation: '+{none:'none',basic:'regrade and replant',full:'full, with water treatment'}[sim.p.recl],{w:800}],['Acid drainage risk: '+mnM(sim,'risk'),{w:800,c:CE_RED}],['Profit: '+money(mnM(sim,'profit')),{w:700}]]);}},
    {key:'price',lvl:'honors',title:'When the price drops',set:{price:6000},pause:true,focus:[0,40,800,400],
     cause:{from:{price:9000},delay:2.5,dur:3,label:'Copper price',at:[300,425]},
     see:'Watch the copper price fall from $9,000 to $6,000 a tonne.',
     why:'The cost of moving rock doesn’t change, but each tonne of copper now sells for less. Profit drops from about $870 million to about $270 million a year. If the price falls further, low-grade mines close, and the grade a mine needs to break even rises.'},
    {key:'pyrite',lvl:'ap',title:'Pyrite and pH',set:{recl:'none',pyrite:5},speed:2,focus:[0,40,800,400],fresh:true,
     cause:{from:{pyrite:0},delay:2,dur:3,label:'Pyrite in waste rock',at:[300,425]},
     see:'Watch the stream below the mine as pyrite in the uncovered waste rock rises.',
     why:'2FeS₂ + 7O₂ + 2H₂O → 2Fe²⁺ + 4SO₄²⁻ + 4H⁺. The hydrogen ions lower the pH, and acid water dissolves more metal from the rock. Iron hydroxide coats the streambed orange. Once it starts, acid drainage can go on for centuries.',
     overlay(sim,ctx,LH,k){mnCard(ctx,k,[['Stream pH: '+mnM(sim,'ph').toFixed(1),{w:800,c:CE_RED}]]);}}
  ],
  useIt:[
    {do:'Recycle old phones, chargers and cords at an electronics drop-off instead of throwing them away.',
     why:'Recycled copper comes back without moving hundreds of tonnes of rock for every tonne. Many electronics stores and city drop-offs take them.'},
    {do:'Keep your phone and laptop longer, and repair them when you can.',
     why:'Every new device means new copper, gold and other metals dug from low-grade ore, with all the waste rock and tailings that come with them.'},
    {do:'Near old mine sites, don’t drink from streams and stay out of old mine openings.',
     why:'Colorado has thousands of abandoned mines. Orange streams below them are a sign of acid drainage carrying dissolved metals, and old tunnels can collapse or hold bad air.'}],
  tryIt:[{title:'cookie mining (20 minutes)',
    steps:['Lay a chocolate chip cookie on graph paper and trace it. Count the squares it covers.','Using toothpicks and a paper clip only, dig out the chips in 5 minutes. Don’t use your fingers.','Then try to fit the crumbs back inside the outline, and count the squares they now cover.'],
    look:'The chips are the ore; everything else is waste. It is hard to get every chip, and the crumbs never fit back in the outline: that is why reclamation costs money and land stays disturbed.'}]
}};
})());

/* ---------- Carbon footprint ---------- */
BioLab.addLearn((function(){
const fpM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const fpCard=(ctx,k,rows)=>dcCard(ctx,k,226,12,214,rows,{hi:false});
const tot=sim=>['Your year: '+fpM(sim,'total').toFixed(1)+' t CO₂',{w:800,c:CE_RED}];
return {footprint:{
  goals:{
    bio:['Where one person’s CO₂ comes from in a year','Why driving is usually the biggest slice you control','Which changes cut the most, and which barely matter','How your year compares with the US and world averages'],
    honors:['Where one person’s CO₂ comes from in a year','Which changes cut the most, and which barely matter','Why an electric car or heat pump is only as clean as its grid','How your year compares with the US and world averages'],
    ap:['The arithmetic: gallons × 8.89 kg, kWh × grid intensity','Which changes cut the most, and which barely matter','Why an electric car or heat pump is only as clean as its grid','Why personal changes alone can’t reach the 2050 goal']},
  matters:'You will hear endless advice about cutting carbon. Doing the math shows which choices actually matter, so your effort goes where it counts.',
  startKey:'start',startRun:true,
  steps:[
    {key:'where',title:'Where the CO₂ comes from',pause:true,focus:[0,40,800,410],run(sim){sim.def.actions.find(a=>a.id==='default').run(sim);},
     see:'A typical student’s year. Each source puffs out bubbles of CO₂. The stack on the right adds them up.',
     why:'Burning gasoline, natural gas and the coal and gas in power plants releases CO₂. Food, the things you buy and shared services like schools and roads add more. This student’s year comes to about 12.5 tons, less than the US average of 15 but more than 2½ times the world average.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,[tot(sim)]);}},
    {key:'drive',title:'Driving is the biggest slice you control',pause:true,set:{miles:60},focus:[0,330,520,120],
     cause:{from:{miles:120},delay:2.5,dur:3,label:'Car miles per week',at:[260,418]},
     see:'Watch weekly driving fall from 120 miles to 60, and watch the red “getting around” slice.',
     why:'Every gallon of gas makes about 8.9 kg (about 20 lb) of CO₂. At 120 miles a week in a 25 mpg car, that is 250 gallons and about 2.2 tons a year. Halving the miles halves it, cutting about 1.1 tons.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,[['Driving: '+sim.p.miles+' mi/week',{w:800}],['Getting around: '+fpM(sim,'transport').toFixed(1)+' t',{w:700}],tot(sim)]);}},
    {key:'hook',title:'Your question: which change cuts most?',pause:true,set:{mpg:50},focus:[0,40,800,410],
     cause:{from:{mpg:25},delay:2.5,dur:3,label:'Car fuel economy',at:[260,418]},
     see:'The typical student again. Watch the car go from 25 to 50 miles per gallon.',
     why:'The 50 mpg car saves about <b>1.1 tons</b> a year, because it halves the 250 gallons burned. Going vegetarian saves about <b>0.8 tons</b>, and skipping the one 2,000-mile flight about <b>0.4 tons</b>. Together the three cut about 2.3 tons, from 12.5 to about 10.2.',
     so:'Find your biggest slice before you cut. For most teenagers in Colorado, that is how much and in what you drive.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,[['Car: '+sim.p.mpg+' mpg',{w:800}],tot(sim)]);}},
    {key:'grid',title:'Where your electricity comes from',pause:true,set:{grid:'renew'},focus:[350,100,450,260],
     cause:{from:{grid:'colorado'},delay:2.5,label:'Electricity source',at:[260,418]},
     see:'Watch the power plant switch from Colorado’s current mix to 100% renewable electricity.',
     why:'Much of Colorado’s electricity still comes from burning coal and natural gas, about half a kilogram of CO₂ per kilowatt-hour. Wind and solar make almost none. Your share of home electricity drops from about 1 ton to almost nothing.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,[['Home energy: '+fpM(sim,'home').toFixed(1)+' t',{w:800}],tot(sim)]);}},
    {key:'food',title:'Food',pause:true,set:{diet:'veg'},focus:[0,180,200,170],
     cause:{from:{diet:'avg'},delay:2.5,label:'Diet',at:[260,418]},
     see:'Watch the diet change from average to vegetarian.',
     why:'Cattle burp methane and need huge amounts of feed and land, so beef has a much bigger climate footprint per gram of protein than beans, chicken or eggs. Going vegetarian cuts about 0.8 tons a year; even cutting back on beef helps.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,[['Food: '+fpM(sim,'food').toFixed(1)+' t',{w:800}],tot(sim)]);}},
    {key:'together',title:'Doing everything',pause:true,focus:[520,40,280,410],
     run(sim){atReset(sim);sim.def.actions.find(a=>a.id==='default').run(sim);},
     see:'Now make every big change at once: an electric car on renewable power, a vegetarian diet, no flight and buying less. Watch the stack.',
     why:'The footprint falls by almost half, to about 7 tons. But it can’t reach the 2-ton goal for 2050, because about 2.5 tons come from shared services, like schools, roads, hospitals and the military, that no one person controls. Reaching the goal takes cleaner power plants, buildings and transportation for everyone, not just personal choices.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,2.5,'all',s=>BioLab.setValues(s,{car:'ev',grid:'renew',diet:'veg',flights:0,stuff:'low'}));fpCard(ctx,k,[tot(sim),['US average 15 · world 4.7 · goal 2',{s:12}]]);}},
    {key:'hp',lvl:'honors',title:'Only as clean as the grid',pause:true,set:{heat:'hp'},focus:[150,100,500,260],
     cause:{from:{heat:'gas'},delay:2.5,label:'Home heating',at:[260,418]},
     see:'Watch the gas furnace swap for an electric heat pump, on today’s Colorado grid.',
     why:'A heat pump moves heat instead of burning fuel, so it uses about a third as much energy. But on a grid that burns coal and gas, the savings are tiny here. On a 100% renewable grid the same heat pump cuts home heating to nearly zero. Electric cars work the same way.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,[['Home energy: '+fpM(sim,'home').toFixed(2)+' t',{w:800}],tot(sim)]);}},
    {key:'math',lvl:'ap',title:'Show the arithmetic',pause:true,focus:[0,330,520,120],run(sim){sim.def.actions.find(a=>a.id==='default').run(sim);},
     see:'The typical student’s car and electricity, worked out.',
     why:'Car: 120 mi × 52 weeks = 6,240 mi ÷ 25 mpg = 250 gal × 8.89 kg = 2,219 kg CO₂. Electricity: 700 kWh × 12 ÷ 4 people = 2,100 kWh × 0.50 kg = 1,050 kg. Flights: 2,000 mi × 0.2 kg = 400 kg. Watch units cancel at every step, the way the AP exam expects.',
     overlay(sim,ctx,LH,k){dcCard(ctx,k,14,12,420,[[fpM(sim,'carmath'),{s:12}],[fpM(sim,'elecmath'),{s:12}]],{hi:false});}}
  ],
  useIt:[
    {do:'Bundle errands, carpool to school or practice, and bike or walk trips under 2 miles.',
     why:'Driving is usually the biggest slice a teenager controls, and short trips burn the most fuel per mile because the engine is cold.'},
    {do:'Try one or two meatless days a week, especially swapping beef for beans, chicken or eggs.',
     why:'Beef’s footprint per gram of protein is many times higher. Small regular swaps add up over a year.'},
    {do:'Ask whether your family’s electric company offers a renewable-energy option.',
     why:'Clean electricity cuts the home-energy slice to almost zero and makes any electric car or heat pump you use later much cleaner.'}],
  tryIt:[{title:'your real year (20 minutes)',
    steps:['Find your family’s monthly kWh on an electric bill and the miles you ride in a typical week.','Enter them here with your car’s mpg, your flights and your diet.','Read the biggest slice, then test the top change in the list.'],
    look:'Compare your number with the US average (15 tons), the world average (4.7) and the 2050 goal (2). Note which single change would cut the most.'}]
}};
})());

/* ---------- Gel electrophoresis ---------- */
BioLab.addLearn((function(){
const glM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const glCard=(ctx,k,rows)=>dcCard(ctx,k,466,352,324,rows,{hi:false});
const stopAt=(sim,min)=>{if(sim.st.runMin>=min&&sim.running){sim.running=false;if(sim.ui&&sim.ui.play)sim.ui.play.textContent='Play';}};
const run=sim=>[['Running time: '+Math.floor(glM(sim,'runmin'))+' min at '+sim.p.volts+' V',{w:800}],['Blue dye: '+glM(sim,'front').toFixed(1)+' cm of 7',{w:700,c:'#1f5fbf'}],['Smallest band: '+glM(sim,'smallest'),{w:700}]];
return {gel:{
  goals:{
    bio:['Why an electric field pulls DNA through a gel','Why small pieces of DNA move farther than big ones','How to read a gel to match DNA evidence','How long to run a gel, and what goes wrong'],
    honors:['Why an electric field pulls DNA through a gel','Why small pieces of DNA move farther than big ones','How to read a gel for crime-scene and paternity cases','How voltage, time and agarose change the run'],
    ap:['Why an electric field pulls DNA through a gel, and why size sorts it','How to read a gel for crime-scene and paternity cases','How voltage, time and agarose change the run','How to size unknown DNA with a semi-log standard curve']},
  matters:'Gels are how DNA evidence, paternity tests and genetic-engineering checks are read. Knowing what a band means helps you judge a DNA match in the news or in court.',
  startKey:'start',startRun:false,
  steps:[
    {key:'gel',title:'The gel box',pause:true,fresh:true,set:{power:false},focus:[10,30,440,420],
     see:'A slab of agarose gel in a box of salty buffer. Samples sit in the wells at the top. The black lead is at the top, the red lead at the bottom.',
     why:'Agarose, a jelly made from seaweed, forms a mesh full of tiny pores, like a sponge. When the power is on, current flows through the buffer from one end to the other. Each well holds billions of copies of a few DNA pieces, plus blue dye so you can see where you loaded.',
     overlay(sim,ctx,LH,k){tag(ctx,'Wells: samples go in here',270,60,k,{hi:true});tag(ctx,'Agarose gel: a mesh of tiny pores',270,280,k);tag(ctx,'Red (+) end',150,400,k);}},
    {key:'power',title:'DNA runs to red',set:{power:true},speed:1,fresh:true,focus:[10,30,440,420],
     cause:{from:{power:false},delay:2,label:'Power supply',at:[230,436]},
     see:'Watch the power supply switch on, and watch the samples leave the wells.',
     why:'Every DNA backbone is lined with phosphate groups that carry a negative charge. Opposite charges attract, so the electric field pulls DNA away from the black (negative) lead toward the red (positive) one. Lab rule: “Black at the wells, run to red.”',
     overlay(sim,ctx,LH,k){glCard(ctx,k,run(sim));}},
    {key:'size',title:'Small pieces win the race',speed:3,fresh:true,focus:[60,60,400,370],
     see:'Watch the ladder (lane L), DNA pieces of known sizes, spread out as the gel runs.',
     why:'Every piece feels a pull in proportion to its length, but long pieces get tangled in the mesh far more. Short pieces slip through the pores faster, like a small kid weaving through a crowded hallway, so they end up farther down. After the run, position tells you size.',
     overlay(sim,ctx,LH,k){stopAt(sim,30);glCard(ctx,k,run(sim));}},
    {key:'match',title:'Reading a DNA match',speed:4,fresh:true,focus:[60,60,400,370],
     see:'Lane E is DNA from a crime scene. S1, S2 and S3 are suspects. Watch the gel run, then compare the band patterns.',
     why:'Each person’s DNA, cut the same way, gives a pattern of bands that is very unlikely to be the same for two people (except identical twins). Suspect 2’s four bands line up exactly with the evidence. Suspects 1 and 3 each have bands that don’t match, so they are ruled out.',
     overlay(sim,ctx,LH,k){stopAt(sim,40);glCard(ctx,k,sim.st.runMin>=39?[['Evidence matches Suspect 2',{w:800,c:CE_RED}],'Suspects 1 and 3 are ruled out']:run(sim));}},
    {key:'reverse',title:'Leads plugged in backward',set:{leads:'reversed'},speed:2,fresh:true,focus:[10,30,440,420],
     cause:{from:{leads:'correct'},delay:1.5,label:'Leads',at:[230,436]},
     see:'Watch what happens if someone plugs the red lead in at the wells.',
     why:'Now the positive end is above the wells, so the negative DNA moves up, out of the wells and into the buffer, where it is lost. Nothing on the gel will show up. That is why every lab checks the leads before pressing start.',
     overlay(sim,ctx,LH,k){stopAt(sim,10);glCard(ctx,k,[['Leads: '+(sim.p.leads==='correct'?'black at wells':'red at wells'),{w:800,c:CE_RED}],['Smallest band: '+glM(sim,'smallest'),{w:700}]]);}},
    {key:'hook',title:'Your question: the 50-minute run',speed:4,fresh:true,focus:[10,30,780,420],
     see:'100 V, and you walk away for 50 minutes. Watch the bottom ladder band (250 base pairs) and the blue dye.',
     why:'At 100 V the 250 bp band moves about 0.15 cm a minute. It reaches the end of the 7 cm gel at about <b>47 minutes</b> and runs off into the buffer. The blue dye runs just behind it, so stop when the dye is about 80% of the way down, at about <b>38 minutes</b>.',
     so:'Nothing stops DNA at the end of the gel. Distance depends on voltage × time, so at 150 V the same band is gone by about 31 minutes. Watch the dye, not the clock.',
     overlay(sim,ctx,LH,k){stopAt(sim,50);glCard(ctx,k,run(sim));}},
    {key:'paternity',lvl:'honors',title:'A paternity test',set:{case:'paternity'},speed:4,fresh:true,focus:[60,60,400,370],
     see:'Mother (M), child (C) and two men (F1, F2). Watch the run, then account for each of the child’s bands.',
     why:'Every band in the child came from the mother or the father. The child’s 8,200 and 2,600 bp bands match the mother. The other two, 3,900 and 1,500, must come from the father. F2 has both; F1 has no 3,900 band, so F1 is ruled out.',
     overlay(sim,ctx,LH,k){stopAt(sim,40);glCard(ctx,k,sim.st.runMin>=39?[['F2 has both of the child’s non-maternal bands',{w:800,c:CE_RED}],'F1 is missing the 3,900 bp band']:run(sim));}},
    {key:'curve',lvl:'ap',title:'Sizing unknowns',set:{case:'lambda'},speed:4,fresh:true,focus:[10,30,780,420],
     see:'λ DNA cut with HindIII gives bands of known sizes. Run it next to two unknowns.',
     why:'Over the useful range, distance traveled is linear in the log of fragment size. Plot log(size) against distance for the ladder bands, fit a line, then read each unknown’s size from its distance. Check the standard curve graph below.',
     overlay(sim,ctx,LH,k){stopAt(sim,45);glCard(ctx,k,[['Unknown sizes from the curve:',{w:800}],[String(glM(sim,'est')),{s:11.5}]]);}}
  ],
  useIt:[
    {do:'When a news story says “DNA match,” look for how rare the pattern is.',
     why:'A match means two samples share the same bands at the places tested. Labs report how rare that pattern is in the population; that number, not the word “match,” tells you how strong the evidence is.'},
    {do:'Talk with your family before anyone sends DNA to an ancestry or genealogy company.',
     why:'You share large parts of your DNA with your parents, siblings and cousins, so one person’s test also reveals information about relatives who never agreed to it. Police have used genealogy databases to solve cases this way.'},
    {do:'In your own lab, say it out loud before you press start: “Black at the wells, run to red.”',
     why:'A reversed lead sends every sample out into the buffer, and the whole run is lost.'}],
  tryIt:[{title:'marker race on a coffee filter (20 minutes)',
    steps:['Draw a thick dot of black washable marker 2 cm from the bottom of a strip of coffee filter.','Dip the bottom edge in a little water, keeping the dot above the water.','Watch for 10 minutes as the water climbs.'],
    look:'The black splits into colors that travel different distances, because different dye molecules move at different speeds through the paper. A gel sorts DNA the same way, by how easily each piece moves through a mesh.'}]
}};
})());

/* ---------- PCR ---------- */
BioLab.addLearn((function(){
const pcM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const pcCard=(ctx,k,rows)=>dcCard(ctx,k,350,380,436,rows,{hi:false});
const now=sim=>[[String(pcM(sim,'step')),{w:800}],['Copies in the tube: '+pcM(sim,'total'),{w:800,c:CE_RED}]];
return {pcr:{
  goals:{
    bio:['What happens at each of the three temperatures in a PCR cycle','Why the number of copies doubles every cycle','How PCR finds a few molecules of a virus in a swab','Why contamination is such a big deal'],
    honors:['What happens at each of the three temperatures in a PCR cycle','Why the number of copies doubles every cycle','How primers decide which piece gets copied','Why the annealing temperature matters'],
    ap:['What happens at each of the three temperatures in a PCR cycle','Exponential doubling, cycle threshold and the plateau','How primers and annealing temperature decide the product','Reading a log-scale growth curve']},
  matters:'PCR is how COVID and flu tests, crime labs and genetic engineers find and copy DNA. Understanding doubling explains both its power and why a tiny bit of contamination can ruin a result.',
  startKey:'start',startRun:false,
  steps:[
    {key:'cycle',title:'One cycle, three temperatures',set:{start:'1000',cycles:30},speed:0.25,fresh:true,focus:[10,60,690,240],
     see:'Watch the thermocycler and the DNA molecule through one full cycle: hot, then cool, then warm.',
     why:'<b>95 °C:</b> heat breaks the hydrogen bonds between the two strands, so they separate. <b>About 52 °C:</b> short pieces of DNA called <b>primers</b> stick to each strand at the two ends of the target. <b>72 °C:</b> Taq polymerase, an enzyme from hot-spring bacteria, adds nucleotides to each primer and builds a new matching strand. One cycle takes about 2 minutes.',
     overlay(sim,ctx,LH,k){pcCard(ctx,k,[[String(pcM(sim,'step')),{w:800}],['Block temperature: '+Math.round(pcM(sim,'temp'))+' °C',{w:700,c:CE_RED}]]);}},
    {key:'double',title:'Doubling every cycle',set:{start:'1000',cycles:30},speed:10,fresh:true,focus:[10,280,690,170],
     see:'Start with 1,000 copies of the target and watch 30 cycles go by quickly.',
     why:'Every copy made in one cycle becomes a template in the next, so the number doubles each cycle: 1,000, 2,000, 4,000, 8,000… Ten doublings multiply by about 1,000, twenty by about a million, thirty by about a billion. After 30 cycles there are almost a trillion copies.',
     overlay(sim,ctx,LH,k){pcCard(ctx,k,now(sim));}},
    {key:'hook',title:'Your question: a few virus copies',set:{start:'10',cycles:27},speed:10,fresh:true,focus:[10,60,780,390],
     see:'A swab from a sick student with only about 10 copies of a virus gene. A band on a gel needs about a billion. Watch the copies climb.',
     why:'After about <b>27 cycles</b>, a little under an hour, 10 copies become about <b>1.3 billion</b>, enough to see. Starting with 1,000 copies takes only about 20 cycles, because each 10 times more starting DNA saves a little over 3 cycles.',
     so:'That is how a PCR test tells a heavy infection from a light one: the cycle when the signal appears (the Ct value) is lower when there is more virus.',
     overlay(sim,ctx,LH,k){pcCard(ctx,k,now(sim));}},
    {key:'contam',title:'One stray molecule',set:{start:'10',cycles:27},speed:10,fresh:true,focus:[10,280,690,170],
     see:'The same 27 cycles starting from just 10 molecules, the kind of amount a careless touch or a reused pipette tip can add.',
     why:'PCR can’t tell DNA that belongs in the sample from DNA that sneaked in. A few stray molecules become a billion copies too, and look just like a real result. That is why labs change tips for every sample, wear gloves and run a “no-template” control tube that should stay blank.',
     overlay(sim,ctx,LH,k){pcCard(ctx,k,[['Started with 10 stray molecules',{w:800}],['Copies now: '+pcM(sim,'total'),{w:800,c:CE_RED}]]);}},
    {key:'anneal',lvl:'honors',title:'Annealing temperature',set:{anneal:66},speed:6,fresh:true,focus:[350,60,450,390],
     cause:{from:{anneal:52},delay:0.4,label:'Annealing temperature',at:[400,440]},
     see:'Watch the annealing step change from 52 °C to 66 °C, above the primers’ melting temperatures (about 56 to 58 °C).',
     why:'Primers only stick below their melting temperature. At 66 °C they can’t hold on, so Taq has nowhere to start and no product forms. Too cold (about 40 °C) and primers stick loosely in the wrong places too, giving extra wrong-sized bands. The sweet spot is a few degrees below the primers’ Tm.',
     overlay(sim,ctx,LH,k){pcCard(ctx,k,[['Annealing: '+sim.p.anneal+' °C',{w:800}],['Gel: '+pcM(sim,'bands'),{w:700,c:CE_RED}]]);}},
    {key:'plateau',lvl:'ap',title:'The plateau',set:{cycles:40},speed:8,fresh:true,focus:[10,280,690,170],
     see:'Run 40 cycles and look at the log-scale growth curve in the graph below.',
     why:'On a log scale, perfect doubling is a straight line. Late in the run, primers and nucleotides run low and products start re-pairing with each other, so efficiency drops and the curve flattens: the <b>plateau</b>. Real-time PCR measures the cycle where the signal crosses a threshold, in the straight part, because that is where the starting amount shows.',
     overlay(sim,ctx,LH,k){pcCard(ctx,k,[[String(pcM(sim,'step')),{w:800}],['Efficiency last cycle: '+Math.round(pcM(sim,'eff'))+'%',{w:700,c:CE_RED}]]);}}
  ],
  useIt:[
    {do:'If a test says “not detected” but you still feel sick, test again or see a doctor.',
     why:'“Not detected” means below what the test can find. Very early in an infection there may be too few copies of the virus, even for PCR.'},
    {do:'In any lab, use a fresh pipette tip for every sample and keep tubes closed.',
     why:'One stray drop with a few molecules becomes a billion copies and a false result.'},
    {do:'If you visit Yellowstone, look at the colors of the hot springs from the boardwalk.',
     why:'The bright colors are mats of heat-loving microbes, like the one that gave scientists Taq polymerase. The water can be hot enough to kill, so stay on the boardwalk.'}],
  tryIt:[{title:'the folding test (5 minutes)',
    steps:['Take a sheet of paper and fold it in half. Count the layers.','Keep folding in half and count the layers each time.','Predict how many layers 10 folds would make, and how many 30 would.'],
    look:'Layers double each fold: 2, 4, 8, 16… You will run out of room after about 7 folds (128 layers). Ten folds would make 1,024 layers, and 30 folds over a billion, the same doubling as PCR.'}]
}};
})());

/* ---------- Micropipettes ---------- */
BioLab.addLearn((function(){
const piM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const piA=(sim,id)=>{const a=(sim.def.actions||[]).find(x=>x.id===id);if(a)a.run(sim);};
const piCard=(ctx,k,rows)=>dcCard(ctx,k,226,40,290,rows,{hi:false});
const LAB={first:'Press to the 1st stop',second:'Press to the 2nd stop',sample:'Tip into the sample',slow:'Release slowly',fast:'Let go quickly',tube:'Tip into your tube'};
/* play a list of moves, one every `gap` seconds, and show the last move on the card */
function moves(sim,tau,list,gap){list.forEach((m,i)=>atT(sim,tau,1+i*gap,'m'+i,s=>{piA(s,m);s._piLast=LAB[m];}));}
const out=sim=>[['Last move: '+(sim._piLast||'none yet'),{w:700}],['In your tube: '+piM(sim,'tube').toFixed(2)+' µL',{w:800,c:CE_RED}]];
const prep=sim=>{atReset(sim);sim._piLast=null;BioLab.setValues(sim,{mode:'pip',pip:'P20',dial:75,task:'7.5'});piA(sim,'newtip');};
return {pipette:{
  goals:{
    bio:['How small a microliter is','How to pick the right micropipette and read its dial','The two stops: which one draws up and which one pushes out','What goes wrong with a careless press or a quick release'],
    honors:['How to pick the right micropipette and read its dial','The two-stop technique and its common errors','How to plan a dilution with C₁V₁ = C₂V₂','Serial dilutions for counting bacteria'],
    ap:['How to pick the right micropipette and read its dial','The two-stop technique, and percent error','Planning dilutions with C₁V₁ = C₂V₂','Serial dilutions and the 30–300 colony rule']},
  matters:'Every DNA, enzyme and medicine experiment depends on measuring tiny volumes right. A one-microliter slip on a 7.5 µL measurement is a 13% error.',
  startKey:'start',startRun:true,
  steps:[
    {key:'dial',title:'Reading the dial',pause:true,focus:[120,40,140,270],run(sim){prep(sim);},
     see:'A P20 micropipette. Its three-digit display reads 0-7-5.',
     why:'A P20 measures 2 to 20 microliters (µL). One microliter is a millionth of a liter, about a pinhead-sized drop; a raindrop is about 50 µL. On a P20 the red digit is tenths, so 0-7-5 means <b>7.5 µL</b>.',
     overlay(sim,ctx,LH,k){piCard(ctx,k,[['Display 0-7-5 on a P20 = '+piM(sim,'set')+' µL',{w:800}],['Range: '+piM(sim,'range'),{w:700}]]);}},
    {key:'pick',title:'Same digits, different pipette',set:{mode:'pip',pip:'P200',dial:75,task:'7.5'},pause:true,focus:[120,40,140,270],
     cause:{from:{pip:'P20'},delay:2.5,label:'Micropipette',at:[300,420]},
     see:'Watch the P20 swap for a P200 with the same 0-7-5 on the dial.',
     why:'On a P200 the same digits mean <b>75 µL</b>, ten times as much, and a P200 can’t measure below 20 µL anyway. Rule: use the smallest pipette whose range covers your volume, and read the dial the way that pipette is marked.',
     overlay(sim,ctx,LH,k){piCard(ctx,k,[[sim.p.pip+' with 0-7-5 = '+piM(sim,'set')+' µL',{w:800,c:sim.p.pip==='P200'?CE_RED:PAL['cv-ink']}],[String(piM(sim,'choice')),{s:12}]]);}},
    {key:'right',title:'The right way',speed:1,focus:[120,40,500,400],run(sim){prep(sim);},
     see:'Watch each move: press to the first stop, dip into the sample, release slowly, move to your tube, press to the first stop, then the second.',
     why:'The <b>first stop</b> pushes out exactly the set volume of air, so releasing it slowly draws up exactly 7.5 µL. Delivering, the first stop pushes the liquid out and the <b>second stop</b> blows out the last drop. Result: exactly 7.5 µL in your tube.',
     overlay(sim,ctx,LH,k,tau){moves(sim,tau,['first','sample','slow','tube','first','second'],1.2);piCard(ctx,k,out(sim));}},
    {key:'hook',title:'Your question: pressing to the second stop first',speed:1,focus:[120,40,500,400],run(sim){prep(sim);},
     see:'Same 7.5 µL, but this time the plunger goes all the way to the <b>second</b> stop before the tip goes into the sample.',
     why:'The second stop pushes out extra air, so releasing draws up extra liquid: about <b>9.5 µL</b>, 27% too much. Letting the plunger snap back instead draws about 7.0 µL, 7% too little, plus air bubbles. Only the first stop measures.',
     so:'In a DNA experiment, 27% too much enzyme or DNA can change the result. In medicine, small measuring errors on small doses matter just as much, which is why liquid medicines come with marked syringes, not kitchen spoons.',
     overlay(sim,ctx,LH,k,tau){moves(sim,tau,['second','sample','slow','tube','first','second'],1.2);piCard(ctx,k,out(sim));}},
    {key:'fast',title:'Letting go too fast',speed:1,focus:[120,40,500,400],run(sim){prep(sim);},
     see:'Correct first stop, but the plunger is let go all at once.',
     why:'The liquid rushes up, air gets pulled in and bubbles form, so less liquid fits: about 7.0 µL instead of 7.5, and some can splash into the pipette itself, contaminating it.',
     overlay(sim,ctx,LH,k,tau){moves(sim,tau,['first','sample','fast','tube','first','second'],1.2);piCard(ctx,k,out(sim));}},
    {key:'dilute',lvl:'honors',title:'Planning a dilution',set:{mode:'dil',c1:10,c2:1,v2:50},pause:true,focus:[0,40,800,400],
     see:'You have a 10× stock and need 50 mL of 1× solution.',
     why:'C₁V₁ = C₂V₂, so V₁ = C₂V₂ ÷ C₁ = 1 × 50 ÷ 10 = <b>5 mL</b> of stock, plus 45 mL of water. You can only dilute down, never up to a higher concentration.',
     overlay(sim,ctx,LH,k){piCard(ctx,k,[['Stock: '+piM(sim,'v1').toFixed(1)+' mL + water: '+piM(sim,'water').toFixed(1)+' mL',{w:800}],['Dilution: '+piM(sim,'factor'),{w:700}]]);}},
    {key:'serial',lvl:'ap',title:'Serial dilution and counting',set:{mode:'ser',n0:9,plated:6},speed:1,focus:[0,40,800,400],
     run(sim){atReset(sim);},
     see:'A 10-fold series of 6 tubes. Watch 100 µL from tube 6 get plated and incubated.',
     why:'Each tube is a tenth as concentrated as the one before, so tube 6 is a 10⁻⁶ dilution. Count only plates with 30 to 300 colonies: fewer and random error is large; more and colonies merge. Cells in the original = colonies ÷ (dilution × volume plated).',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'pl',s=>piA(s,'plate'));dcCard(ctx,k,520,350,270,[['Colonies: '+piM(sim,'cols'),{w:800}],['Original culture: '+piM(sim,'cfu')+' cells/mL',{w:700,c:CE_RED}]],{hi:false});}}
  ],
  useIt:[
    {do:'Give liquid medicine with the syringe or cup that comes with it, not a kitchen spoon.',
     why:'Kitchen teaspoons vary a lot in size. On small doses, that error is a big share of the dose.'},
    {do:'Before you draw up anything in lab, say “first stop” out loud.',
     why:'Starting from the second stop draws about a quarter too much. It is the most common pipetting mistake.'},
    {do:'Check which pipette is in your hand before you trust the dial.',
     why:'The same three digits mean 7.5, 75 or 750 µL on a P20, P200 or P1000.'}],
  tryIt:[{title:'how big is a microliter? (10 minutes)',
    steps:['Fill a medicine dropper or a straw with water.','Let drops fall one at a time into a teaspoon (about 5 mL = 5,000 µL), counting until it is full.','Divide 5,000 by your count to find the volume of one drop.'],
    look:'Most drops are about 50 µL, so a teaspoon takes about 100. A 7.5 µL measurement is about a seventh of one drop.'}]
}};
})());

/* ---------- Transformation (pGLO) ---------- */
BioLab.addLearn((function(){
const tfM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const tfA=(sim,id)=>{const a=(sim.def.actions||[]).find(x=>x.id===id);if(a)a.run(sim);};
/* run the whole procedure and 48 h of incubation instantly */
function tfDone(sim){tfA(sim,'restart');tfA(sim,'runall');for(let i=0;i<1200&&!(sim.st.stage>=9&&sim.st.h>=48);i++)sim.def.step(sim,0.1);}
const tfCard=(ctx,k,rows)=>dcCard(ctx,k,14,14,300,rows,{hi:false});
const plates=sim=>[['LB/amp +pGLO: '+tfM(sim,'c3')+' colonies',{w:800}],['LB/amp/ara +pGLO: '+tfM(sim,'c4')+' colonies',{w:700}],['Under UV: '+tfM(sim,'glow'),{w:700,c:CE_GREEN}]];
return {transformation:{
  goals:{
    bio:['What a plasmid is, and the two genes pGLO carries','How heat shock gets a plasmid into bacteria','How an antibiotic finds the rare cells that changed','Why the bacteria glow only with arabinose'],
    honors:['What a plasmid is, and the two genes pGLO carries','Why each step of the procedure matters','How the four plates and their controls separate cause from effect','How to calculate transformation efficiency'],
    ap:['How the four plates and their controls separate cause from effect','Selection vs screening','Gene regulation: the arabinose switch','Transformation efficiency, and why it doesn’t depend on volume plated']},
  matters:'Moving genes into bacteria is how insulin and many medicines are made, and it is also how antibiotic resistance spreads in hospitals. This lab is the basic move behind both.',
  startKey:'start',startRun:true,
  steps:[
    {key:'plasmid',title:'A plasmid with two genes',pause:true,focus:[0,0,800,450],run(sim){tfA(sim,'restart');},
     see:'The pGLO plasmid: a small circle of DNA, separate from the bacteria’s own chromosome.',
     why:'Bacteria pass plasmids around naturally. pGLO carries two useful genes: <b>bla</b>, which lets a cell survive the antibiotic ampicillin, and <b>GFP</b>, a green fluorescent protein borrowed from a glowing jellyfish. If a cell takes in pGLO, both genes come with it.'},
    {key:'proc',title:'Getting the plasmid in',speed:1,focus:[0,0,800,450],run(sim){atReset(sim);tfA(sim,'restart');},
     see:'Watch the whole procedure run, step by step.',
     why:'Ice-cold calcium chloride shields the negative charges on DNA and the cell membrane so the plasmid can get close. A <b>heat shock</b>, 50 seconds at 42 °C then straight back to ice, briefly opens the membrane so a few cells take in a plasmid. Warm broth lets them recover and switch on the new genes before they meet the antibiotic.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1,'go',s=>tfA(s,'runall'));tfCard(ctx,k,[[String(tfM(sim,'stepn')),{w:700,s:12}]]);}},
    {key:'plates',title:'Four plates',pause:true,focus:[0,0,800,450],run(sim){tfDone(sim);},
     see:'After 48 hours: two plates of cells that got no plasmid (−pGLO) and two of cells that did (+pGLO).',
     why:'Without ampicillin, the −pGLO cells grow a solid <b>lawn</b>: proof the cells were alive. With ampicillin, −pGLO cells all die. On the +pGLO ampicillin plates only the cells that took in the plasmid survive, and each one grows into a colony.',
     overlay(sim,ctx,LH,k){tfCard(ctx,k,[['LB −pGLO: '+tfM(sim,'lawn'),{w:700}]].concat(plates(sim).slice(0,2)));}},
    {key:'hook',title:'Your question: finding the few that changed',pause:true,focus:[0,0,800,450],run(sim){tfDone(sim);},
     see:'The LB/amp +pGLO plate: 100 µL of cells, roughly 100 million of them, was spread on it.',
     why:'About <b>100 to 125 colonies</b> grow (the exact count varies from plate to plate): roughly <b>1 cell in a million</b> took in the plasmid. You don’t search for them. Ampicillin kills every cell without the plasmid, so each survivor grows into a colony you can count. This trick is called <b>selection</b>.',
     so:'When the change you want is rare, link it to a survival gene so only the successes grow. Genetic engineers do this every day, and resistant bacteria in hospitals “do” it on their own when antibiotics are overused.',
     overlay(sim,ctx,LH,k){tfCard(ctx,k,[['LB/amp +pGLO: '+tfM(sim,'c3')+' colonies',{w:800,c:CE_RED}],'From about 100 million cells spread']);}},
    {key:'glow',title:'The green switch',set:{uv:true},pause:true,focus:[0,0,800,450],
     cause:{from:{uv:false},delay:2,label:'UV light',at:[400,420]},
     run(sim){tfDone(sim);},
     see:'Watch the UV light switch on over the plates.',
     why:'Only the colonies on the plate with <b>arabinose</b>, a sugar, glow green. In pGLO, the GFP gene sits behind a switch that turns on only when arabinose is present. All the +pGLO colonies carry the GFP gene; only the ones given arabinose are using it. Same genes, different environment, different result.',
     overlay(sim,ctx,LH,k){tfCard(ctx,k,plates(sim));}},
    {key:'noplasmid',lvl:'honors',title:'The control that proves it',set:{plasmid:false},pause:true,focus:[0,0,800,450],
     run(sim){tfDone(sim);},
     see:'Run the whole lab again, but forget to add the plasmid to the +pGLO tube.',
     why:'Now nothing grows on any ampicillin plate. That shows the colonies came from the plasmid, not from cells that happened to resist ampicillin on their own. A good experiment always includes the control that rules out the other explanations.',
     overlay(sim,ctx,LH,k){tfCard(ctx,k,plates(sim).slice(0,2));}},
    {key:'eff',lvl:'ap',title:'Transformation efficiency',pause:true,focus:[0,0,800,450],run(sim){BioLab.setValues(sim,{plasmid:true});tfDone(sim);},
     see:'The LB/amp +pGLO count and the DNA spread on that plate.',
     why:'Efficiency = transformants ÷ µg of DNA spread. Spread twice the volume and you get about twice the colonies but also twice the DNA, so efficiency stays the same. It measures how well the cells took in DNA, not how much you plated.',
     overlay(sim,ctx,LH,k){tfCard(ctx,k,[['Colonies: '+tfM(sim,'c3')+' · DNA spread: '+tfM(sim,'dna').toFixed(3)+' µg',{w:700}],['Efficiency: '+Math.round(tfM(sim,'eff')).toLocaleString()+' per µg',{w:800,c:CE_RED}]]);}}
  ],
  useIt:[
    {do:'Take antibiotics exactly as prescribed, and never take leftovers or someone else’s.',
     why:'Every course of antibiotics selects for resistant bacteria, just like the ampicillin plate. Using them only when needed slows the spread of resistance genes.'},
    {do:'Wash your hands well, especially in hospitals and locker rooms.',
     why:'Resistance genes often ride on plasmids that bacteria pass to each other. Keeping bacteria from spreading slows the spread of their plasmids too.'},
    {do:'Look up how insulin is made.',
     why:'Since the 1980s, most insulin for people with diabetes has been made by microbes given the human insulin gene, the same basic move as pGLO.'}],
  tryIt:[{title:'selection with paper clips (10 minutes)',
    steps:['Mix 100 paper clips with 1 bent one (the “transformed” cell).','Searching: have a partner find the bent one by looking at each clip, and time it.','Selecting: pour all the clips through a slot only the bent clip can’t pass, and time it.'],
    look:'Selection finds the rare one at once, however many there are. That is why the lab uses ampicillin instead of checking 100 million cells one by one.'}]
}};
})());

/* ---------- Plasmid maps and digests ---------- */
BioLab.addLearn((function(){
const plM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const plA=(sim,id)=>{const a=(sim.def.actions||[]).find(x=>x.id===id);if(a)a.run(sim);};
const plCard=(ctx,k,rows)=>dcCard(ctx,k,370,150,300,rows,{hi:false});
const frag=sim=>[['Cuts: '+plM(sim,'cuts')+' · fragments: '+plM(sim,'nfrag'),{w:800}],['Sizes: '+plM(sim,'sizes'),{w:700,c:CE_RED}],['Add up to: '+plM(sim,'total').toLocaleString()+' bp',{w:700}]];
return {plasmid:{
  goals:{
    bio:['How to read a plasmid map','How a restriction enzyme finds and cuts one exact sequence','Why cutting a ring n times gives n pieces','How to check a plasmid with a digest and a gel'],
    honors:['How to read a plasmid map like the ones in ApE','How restriction enzymes cut and leave sticky ends','How to predict fragment sizes for any enzyme combination','How a gene is cloned into a plasmid'],
    ap:['How to predict fragment sizes for rings and straight DNA','Sticky ends and ligation','Insertional inactivation: screening for recombinant plasmids','Choosing a diagnostic digest']},
  matters:'Cutting and pasting DNA with restriction enzymes is how insulin, vaccines and GMO crops are made, and how labs check that a plasmid is what the label says.',
  startKey:'start',startRun:true,
  steps:[
    {key:'map',title:'Reading a plasmid map',pause:true,set:{mol:'pBR322',e1:'EcoRI',e2:'none'},focus:[0,40,340,380],
     see:'The map of pBR322, a plasmid used in thousands of labs. The ring is its DNA: 4,361 base pairs.',
     why:'Positions are numbered in base pairs, starting at the top and going clockwise, like a clock. The colored arcs are genes: <b>ampR</b> and <b>tetR</b> make the cell resistant to ampicillin and tetracycline, and <b>ori</b> is where copying starts. The labels around the outside are the spots where restriction enzymes cut.'},
    {key:'cut',title:'An enzyme that reads DNA',speed:1,set:{mol:'pBR322',e1:'EcoRI',e2:'none'},focus:[0,40,800,380],
     run(sim){plA(sim,'digest');},
     see:'EcoRI cuts the ring. Look at the cut site in the middle panel.',
     why:'EcoRI recognizes only GAATTC, reading the same on both strands, and cuts between G and A. pBR322 has just one GAATTC, so EcoRI cuts once and the ring opens into one straight piece of 4,361 bp. The staggered cut leaves short single-stranded tails called <b>sticky ends</b>.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,frag(sim));}},
    {key:'two',title:'Two cuts, two pieces',speed:1,set:{mol:'pBR322',e1:'HindIII',e2:'BamHI'},focus:[0,40,800,410],
     cause:{from:{e2:'none'},delay:2.5,label:'Enzyme 2',at:[300,425]},
     see:'HindIII cuts once. Watch BamHI join it, and watch the fragments and the gel.',
     why:'In a ring, every cut makes one more fragment: one cut gives one piece, two cuts give two. HindIII at 29 and BamHI at 375 cut out a 346 bp piece and leave 4,015 bp, and the pieces always add back up to the whole plasmid, 4,361 bp.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,frag(sim));}},
    {key:'hook',title:'Your question: checking an old tube',speed:1,set:{mol:'pBR322',e1:'HindIII',e2:'BamHI'},focus:[0,40,800,410],
     run(sim){plA(sim,'digest');},
     see:'A tube labeled pBR322 has sat in the freezer for years. You get one digest to check it.',
     why:'EcoRI alone gives one 4,361 bp band, which any plasmid that size with one EcoRI site would also give. <b>HindIII plus BamHI</b> gives two bands, <b>346 bp and 4,015 bp</b>, adding up to 4,361. Two bands at the right sizes is a much stronger fingerprint.',
     so:'Labs run a quick diagnostic digest like this, about an hour, before paying to sequence a plasmid. Pick enzymes that give a distinctive pattern.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,frag(sim));}},
    {key:'linear',lvl:'honors',title:'Straight DNA',speed:1,set:{mol:'lambda',e1:'HindIII',e2:'none'},focus:[0,40,800,410],
     see:'Now λ phage DNA, a straight molecule of 48,502 bp, cut with HindIII.',
     why:'A straight piece has two free ends, so n cuts give n + 1 fragments. HindIII cuts λ DNA 7 times, giving 8 fragments: the classic λ/HindIII ladder used to size DNA on gels.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,frag(sim));}},
    {key:'clone',lvl:'honors',title:'Pasting in a gene',speed:1,set:{mol:'pBR322',e1:'BamHI',e2:'none',insEnz:'BamHI'},focus:[0,40,800,410],
     run(sim){atReset(sim);plA(sim,'clear');},
     see:'pBR322 cut with BamHI, and a GFP gene cut with BamHI too. Watch the insert join the plasmid.',
     why:'Both cuts leave the same sticky ends, so the insert’s tails pair with the plasmid’s, and DNA ligase seals the backbone. The result is a <b>recombinant plasmid</b>: the plasmid plus a new gene. Ends cut by different enzymes usually won’t match.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,2,'lig',s=>plA(s,'clone'));plCard(ctx,k,[['Recombinant: '+plM(sim,'recomb'),{w:800,c:CE_GREEN}]]);}},
    {key:'inact',lvl:'ap',title:'Insertional inactivation',speed:1,set:{mol:'pBR322',e1:'BamHI',e2:'none',insEnz:'BamHI'},focus:[0,40,800,410],
     run(sim){plA(sim,'clone');},
     see:'The GFP insert sits at BamHI, inside the tetR gene.',
     why:'An insert in the middle of tetR breaks that gene, so cells with the recombinant plasmid are still ampicillin resistant but now tetracycline sensitive. Grow them on ampicillin, then copy the colonies onto tetracycline: the ones that die there carry the insert. That screen finds recombinants without sequencing.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,[['Ampicillin: '+plM(sim,'amp'),{w:700}],['Tetracycline: '+plM(sim,'tet'),{w:700,c:CE_RED}]]);}}
  ],
  useIt:[
    {do:'Look up how insulin is made today.',
     why:'Since 1982 most insulin has come from microbes carrying the human insulin gene on a plasmid, cut and pasted in with restriction enzymes and ligase, the same tools in this lab.'},
    {do:'In your lab notebook, add up the fragment sizes before you trust a predicted gel.',
     why:'For a ring they must add up to the whole plasmid. If they don’t, a cut site or a subtraction is wrong.'},
    {do:'When you hear “genetically modified,” ask which gene was added and why.',
     why:'Most GM crops and medicines start with this same cut-and-paste step. Knowing the gene and its job tells you much more than the label.'}],
  tryIt:[{title:'paper plasmid (15 minutes)',
    steps:['Write positions 0 to 100 around a paper ring made from a strip of paper taped into a loop.','Mark “cut sites” at 10, 35 and 70, then cut there.','Measure each piece and add them up. Then cut a straight strip at the same marks and count the pieces.'],
    look:'Three cuts make three pieces from the ring but four from the straight strip, and the ring’s pieces always add back to 100.'}]
}};
})());

/* ---------- BLAST ---------- */
BioLab.addLearn((function(){
const blM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const blA=(sim,id)=>{const a=(sim.def.actions||[]).find(x=>x.id===id);if(a)a.run(sim);};
const blCard=(ctx,k,rows)=>dcCard(ctx,k,150,300,400,rows,{hi:false});
const hits=sim=>{const r=sim.st.ranked||[];return r.slice(1,4).map(h=>h.d.name+' '+Math.round(h.ident*100)+'%').join(' · ')||'—';};
const res=sim=>sim.st.phase!=='done'?[['Searching…',{w:800}]]:[['Top hit: '+blM(sim,'top')+(isFinite(blM(sim,'ident'))?' · '+Math.round(blM(sim,'ident'))+'% identical':''),{w:800,c:CE_RED}],['Next: '+hits(sim),{s:12}]];
return {blast:{
  goals:{
    bio:['How a short stretch of DNA works like a barcode for a species','How BLAST compares a sample with known sequences','How to read percent identity: same species or just a relative','How DNA catches mislabeled food'],
    honors:['How BLAST compares a sample with known sequences','Reading a hit list: identity, query cover and E value','Same species vs related species','How DNA catches mislabeled food'],
    ap:['How BLAST seeds hits with short exact words, then extends them','Reading identity, cover, bit score and E value','Why the reverse complement matters','How DNA catches mislabeled food']},
  matters:'DNA searches catch mislabeled meat and fish, identify bacteria in hospitals and tell researchers what gene they’ve found. It all comes down to how alike two sequences are.',
  startKey:'start',startRun:true,
  steps:[
    {key:'query',title:'A DNA barcode',pause:true,set:{query:'burger'},focus:[0,40,800,320],
     see:'The top row is 100 bases of DNA read from a burger patty sold as beef: each color is one base, A, C, G or T. Below are the same stretch of DNA from 12 known species.',
     why:'This stretch comes from a mitochondrial gene that is a little different in every species, so it works like a barcode. Closely related species have similar barcodes; distant ones differ more. Matching the sample’s barcode to a known one identifies the animal.'},
    {key:'run',title:'How BLAST searches',set:{query:'burger'},speed:1,focus:[0,40,800,460],
     run(sim){atReset(sim);},
     see:'Watch BLAST run: first short exact matches light up, then they grow into full alignments, then the species are ranked.',
     why:'Comparing every base against billions would take forever, so BLAST first looks for short exact “words” (11 bases) that the sample shares with each database sequence. Only those spots are extended base by base into an alignment. The best-scoring alignments go to the top of the list.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1,'go',s=>blA(s,'run'));blCard(ctx,k,res(sim));}},
    {key:'hook',title:'Your question: what’s in the burger?',set:{query:'burger'},speed:1,focus:[0,40,800,460],
     run(sim){blA(sim,'done');},
     see:'The hit list for the “100% beef” patty.',
     why:'The top hit is <b>horse, 99% identical</b>: 99 of 100 bases match. The next hits, pig and other mammals at about 87 to 88%, are relatives sharing an ancestor, not matches. About 98% or more usually means the same species, and the big gap to the next hit makes the call clear. The “beef” is horse.',
     so:'In 2013, DNA tests like this found horse meat in burgers and lasagna sold as beef across Europe, leading to large recalls.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,res(sim));}},
    {key:'cheek',title:'Your own DNA',set:{query:'cheek'},speed:1,focus:[0,40,800,460],
     run(sim){blA(sim,'done');},
     see:'Now the sample is mitochondrial DNA from your own cheek cells.',
     why:'The top hit is human at 100%. Cow and pig come next at about 90%: all mammals share this gene from a common ancestor, and the differences piled up over tens of millions of years. Percent identity is a rough measure of how closely related two species are.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,res(sim));}},
    {key:'snapper',lvl:'honors',title:'The “red snapper” fillet',set:{query:'snapper'},speed:1,focus:[0,40,800,460],
     run(sim){blA(sim,'done');},
     see:'A fish fillet sold as red snapper.',
     why:'Top hit: tilapia at 98%, with the next hits down near 85%. The E value, the number of hits this good you’d expect by pure chance, is around 10⁻⁴¹: essentially zero. It is tilapia, a much cheaper fish. Surveys have found that a large share of fish sold as red snapper in the US is something else.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,res(sim).concat([['E value: '+blM(sim,'evalue'),{s:12}]]));}},
    {key:'rc',lvl:'ap',title:'The other strand',set:{query:'reverse',rc:true},speed:1,focus:[0,40,800,460],
     cause:{from:{rc:false},delay:3,label:'Reverse complement',at:[300,330]},
     run(sim){blA(sim,'done');},
     see:'Sample X finds no match at all. Watch what happens when BLAST searches its reverse complement.',
     why:'DNA has two strands that run in opposite directions. This sample was read from the other strand, so its sequence is the reverse complement of the database entry: reversed, with A↔T and G↔C swapped. Flip it and the match appears: chicken. Real BLAST searches both strands automatically.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,res(sim));}}
  ],
  useIt:[
    {do:'When you buy fish, look for the species name and where it came from, or use the Monterey Bay Aquarium’s Seafood Watch guide.',
     why:'Mislabeling is common for fish like red snapper and tuna. Sellers that list species and origin are easier to check and trust.'},
    {do:'Try a real search at the NCBI BLAST website with a sequence from class.',
     why:'It is free and is the same tool scientists use every day, searching billions of bases in seconds.'},
    {do:'When you see a claim about how closely related two species are, ask what percent of the DNA was compared.',
     why:'“98% the same” depends on which stretch of DNA was read. A barcode gene, a whole genome and protein-coding genes all give different numbers.'}],
  tryIt:[{title:'percent identity by hand (10 minutes)',
    steps:['Write a string of 20 random letters from A, C, G and T.','Copy it three times, changing 1 letter in the first copy, 5 in the second and 10 in the third.','For each copy, count matching positions and divide by 20.'],
    look:'You get 95%, 75% and 50% identity. A random string of A, C, G and T would match about 25% of positions by chance, which is why a hit has to be well above that to mean anything.'}]
}};
})());

/* ---------- Sanger sequencing ---------- */
BioLab.addLearn((function(){
const sgM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const sgA=(sim,id)=>{const a=(sim.def.actions||[]).find(x=>x.id===id);if(a)a.run(sim);};
const sgCard=(ctx,k,rows)=>dcCard(ctx,k,496,10,296,rows,{hi:false});
const rd=sim=>[['Read length: '+sgM(sim,'len')+' of 36 bases',{w:800,c:CE_RED}],['ddNTPs: '+sim.p.dd+'% of nucleotides',{w:700}]];
return {sanger:{
  goals:{
    bio:['How chain-stopping letters make copies of every length','How sorting the copies by size reads the gene in order','How to read a chromatogram','Why the mix of stop letters has to be just right'],
    honors:['How chain-stopping letters make copies of every length','Why sorting by size reads the gene in order, and why the read is the complement','How to read a chromatogram','How a single-letter change like sickle cell shows up'],
    ap:['Why a ddNTP stops the chain','How the ddNTP ratio sets the read length','Reading a chromatogram, including double peaks','Finding the sickle-cell mutation and a carrier']},
  matters:'Sanger sequencing read most of the first human genome, and it is still how labs check a gene, confirm a CRISPR edit or test for sickle-cell disease.',
  startKey:'start',startRun:true,
  steps:[
    {key:'tube',title:'What’s in the tube',pause:true,set:{sample:'normal',dd:3},focus:[0,40,800,180],
     see:'The template strand of the β-globin gene, a short primer, and copies being built from it.',
     why:'The tube holds the DNA to read, a primer that marks where to start, DNA polymerase to build copies, lots of the four normal nucleotides, and a pinch (3%) of colored <b>ddNTPs</b>. Each ddNTP carries a dye: green A, red T, black G, blue C.'},
    {key:'stop',title:'Copies that stop at random',set:{sample:'normal',dd:3},speed:1,focus:[0,40,800,180],
     run(sim){atReset(sim);},
     see:'Watch the copies grow and stop. The colored dot at the end of each copy is the ddNTP that stopped it.',
     why:'A ddNTP is missing the oxygen the next nucleotide needs to attach, so once the polymerase adds one, that copy stops. Which spot it stops at is random, so across billions of copies there is a copy ending at every letter, each tagged with the color of its last letter.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.8,'run',s=>sgA(s,'run'));}},
    {key:'sort',title:'Sorting by size reads the gene',speed:1,set:{sample:'normal',dd:3},focus:[0,200,800,260],
     run(sim){atReset(sim);},
     see:'The copies race through a thin tube (the capillary) past a laser. Watch the peaks appear left to right.',
     why:'Short pieces move fastest, so the copy that stopped at letter 1 arrives first, then letter 2, then 3. The laser reads each color as it passes, so the colors come out in the gene’s order. Each peak is one letter. Because the copies are built to match the template, the read is its complement.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.5,'run',s=>sgA(s,'run'));sgCard(ctx,k,[['Read: '+String(sgM(sim,'read')).slice(0,18)+'…',{w:800}]]);}},
    {key:'hook',title:'Your question: more stop letters?',set:{sample:'normal',dd:30},pause:true,focus:[0,200,800,260],
     cause:{from:{dd:3},delay:2.5,dur:3,label:'ddNTP share',at:[300,215]},
     see:'The read at 3% ddNTPs. Watch a labmate raise it to 30% for “stronger peaks.”',
     why:'At 3% you read all 36 letters. At 30% almost every copy stops in the first few letters: the first peaks are tall, but the later ones fade into the noise, and you can read <b>only 12</b>. Going the other way fails too: at 0.3% no peak is tall enough to read at all.',
     so:'A good read needs balance. Real sequencing services tune this ratio to read about 800 letters in one run.',
     overlay(sim,ctx,LH,k){sgCard(ctx,k,rd(sim));}},
    {key:'sickle',lvl:'honors',title:'Finding sickle cell',set:{sample:'sickle',dd:3},pause:true,focus:[0,200,800,260],
     cause:{from:{sample:'normal'},delay:2.5,label:'DNA sample',at:[300,215]},
     see:'A normal β-globin read. Watch it switch to a sickle-cell patient’s DNA and look at letter 20.',
     why:'One letter changes: A becomes T (GAG to GTG), so the protein gets valine instead of glutamic acid at that spot. That single change makes hemoglobin stick together when oxygen is low, bending red blood cells into sickles.',
     overlay(sim,ctx,LH,k){sgCard(ctx,k,[['Letter 20: '+sgM(sim,'b20'),{w:800,c:CE_RED}]]);}},
    {key:'carrier',lvl:'ap',title:'A carrier’s double peak',set:{sample:'het',dd:3},pause:true,focus:[0,200,800,260],
     see:'DNA from a carrier: one normal copy of the gene and one sickle copy.',
     why:'Half the copies have A at letter 20 and half have T, so two half-height peaks, green and red, sit at the same spot. The base caller writes W (A or T). Carriers usually have no symptoms but can pass the sickle copy to their children.',
     overlay(sim,ctx,LH,k){sgCard(ctx,k,[['Letter 20: '+sgM(sim,'b20'),{w:800,c:CE_RED}]]);}}
  ],
  useIt:[
    {do:'If sickle-cell disease or another genetic condition runs in your family, ask a doctor about carrier testing before starting a family.',
     why:'Carriers usually feel fine. A simple test, often by sequencing one gene, tells you your chances of passing it on.'},
    {do:'When you hear about a “gene test,” ask what was read: one gene, a few markers or the whole genome.',
     why:'Different tests read very different amounts of DNA, so they can answer very different questions.'},
    {do:'Look up the Human Genome Project.',
     why:'Read mostly with Sanger sequencing, a few hundred letters at a time, it took about 13 years to finish in 2003. Today a whole genome can be read in about a day.'}],
  tryIt:[{title:'beaded sequencing (15 minutes)',
    steps:['Write a 10-letter “gene,” like ATGGTGCATC.','Make paper strips: one ending at letter 1, one ending at letter 2, and so on, each with only its last letter colored.','Shuffle the strips, then sort them shortest to longest and read the colored last letters.'],
    look:'Sorted by length, the colored ends spell your gene in order. That is exactly how the capillary turns random stops into a readable sequence.'}]
}};
})());

/* ---------- Carbon cycle ---------- */
BioLab.addLearn((function(){
const ccM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const ccCard=(ctx,k,rows)=>dcCard(ctx,k,14,12,268,rows,{hi:false});
const yr=sim=>Math.floor(2025+sim.t);
const stopAt=(sim,y)=>{if(yr(sim)>=y&&sim.running){sim.running=false;if(sim.ui&&sim.ui.play)sim.ui.play.textContent='Play';}};
const co2=sim=>[['Year '+yr(sim),{w:800}],['CO₂ in the air: '+Math.round(ccM(sim,'ppm'))+' ppm',{w:800,c:CE_RED}],['Changing '+(ccM(sim,'rate')>=0?'+':'')+ccM(sim,'rate').toFixed(1)+' ppm a year',{w:700}]];
const budget=sim=>{const f=sim.st.f;if(!f)return [];const e=f.E+f.Df,u=f.land+f.ocean;return [['People add: '+e.toFixed(1)+' GtC a year',{w:700,c:CE_RED}],['Land and ocean soak up: '+u.toFixed(1)+' GtC',{w:700,c:CE_GREEN}],['Left in the air: '+(e-u).toFixed(1)+' GtC',{w:800}]];};
return {carboncycle:{
  goals:{
    bio:['Where Earth’s carbon is stored: air, plants, soil, ocean and fossil fuels','How photosynthesis, respiration and decay move carbon around','Why burning fossil fuels makes CO₂ rise','Why cutting emissions in half slows the rise but doesn’t reverse it'],
    honors:['The carbon reservoirs and the flows between them','Why plants and the ocean absorb only part of what people add','Why cutting emissions slows the rise but doesn’t reverse it','How a warmer ocean and new forests change the balance'],
    ap:['Reservoirs, fluxes and residence times','Sources, sinks and the airborne fraction','Why cutting emissions slows the rise but doesn’t reverse it','Ocean acidification']},
  matters:'Every gallon of gas, every forest cut and every tree planted moves carbon between these boxes. The bathtub idea in this tool explains why climate goals talk about cutting emissions to near zero, not just a little.',
  startKey:'start',startRun:true,
  steps:[
    {key:'store',title:'Where the carbon is',pause:true,fresh:true,focus:[0,0,800,450],
     see:'The labeled boxes show how much carbon each part of the Earth holds, in billions of tonnes (GtC).',
     why:'Carbon is in the air as CO₂, in plants and soil as living and dead matter, dissolved in the ocean, and locked underground as coal, oil and gas. The deep ocean and fossil fuels hold by far the most. The atmosphere holds less, but even small changes there change the climate.',
     overlay(sim,ctx,LH,k){ccCard(ctx,k,[['The air holds about 2.12 GtC for every 1 ppm of CO₂',{s:12}]]);}},
    {key:'life',title:'Plants take it in, life gives it back',speed:0.5,fresh:true,focus:[0,40,400,300],
     see:'Watch the dots moving down into the trees and back up from the trees, the deer and the soil.',
     why:'Plants pull about 120 GtC a year out of the air by <b>photosynthesis</b>, building it into sugar and wood. Plants, animals and decomposers breathing (<b>respiration</b>) and rotting leaves return about the same amount. That is why CO₂ dips a little every northern summer, when forests leaf out, and rises again in winter.'},
    {key:'ocean',title:'The ocean soaks it up',speed:0.5,fresh:true,focus:[395,40,405,370],
     see:'Now the ocean side: dots moving into the water and down into the deep ocean.',
     why:'CO₂ dissolves into the ocean surface, and slow currents carry some of it into the deep ocean, where it can stay for centuries. The ocean holds about 50 times as much carbon as the air.'},
    {key:'fossil',title:'Burning fossil fuels',set:{fossil:10},speed:1,fresh:true,focus:[300,40,200,370],
     cause:{from:{fossil:0},delay:2,dur:2,label:'Fossil-fuel burning',at:[400,430]},
     see:'Watch the smokestack as fossil-fuel burning goes from zero to today’s 10 GtC a year.',
     why:'Coal, oil and gas are carbon that plants captured millions of years ago and that got buried before it decayed. Burning it puts that carbon back in the air in seconds, far faster than nature ever buried it. CO₂ goes from slowly falling to rising more than 2 ppm a year.',
     overlay(sim,ctx,LH,k){ccCard(ctx,k,co2(sim));}},
    {key:'half',title:'Only half is absorbed',speed:1,fresh:true,focus:[0,0,800,450],
     see:'Today’s world: compare what people add each year with what land and ocean take up.',
     why:'Plants and the ocean absorb more when there is extra CO₂, but only a bit more than half of what people add. The rest stays in the air, so CO₂ keeps climbing about 2 ppm every year, the rise measured at Mauna Loa, Hawaii, since 1958.',
     overlay(sim,ctx,LH,k){ccCard(ctx,k,budget(sim));}},
    {key:'hook',title:'Your question: cutting emissions in half',pause:true,speed:1.5,fresh:true,focus:[0,0,800,450],run(sim){atReset(sim);},
     see:'Starting in 2025, the whole world cuts fossil-fuel burning in half, from 10 to 5 GtC a year. Watch CO₂ until 2045.',
     why:'CO₂ keeps rising, just more slowly: it reaches about <b>424 ppm</b> by 2045 instead of about <b>458</b>, rising about 0.6 ppm a year instead of 2. CO₂ falls only when emissions drop below what plants and the ocean soak up. With zero emissions it slides to about 385 ppm by 2045.',
     so:'Think of a bathtub: the level keeps rising as long as the tap adds more than the drain removes. Turning the tap down slows the rise; only turning it down below the drain makes the level fall. That is why climate goals aim for net zero.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'cut',s=>{BioLab.setValues(s,{fossil:5});s.running=true;if(s.ui&&s.ui.play)s.ui.play.textContent='Pause';});stopAt(sim,2045);ccCard(ctx,k,[['Fossil fuels: '+(sim.p.fossil<10?'cut to 5':'10')+' GtC a year',{w:700}]].concat(co2(sim)));}},
    {key:'warm',lvl:'honors',title:'A warmer ocean holds less',set:{otemp:3},speed:1.5,fresh:true,focus:[395,40,405,370],
     cause:{from:{otemp:0},delay:1.5,dur:2,label:'Ocean warming',at:[400,430]},
     see:'Watch the ocean warm by 3 °C, and the ocean uptake.',
     why:'Warm water holds less dissolved gas, the reason a warm soda goes flat faster. A warmer ocean lets more CO₂ escape and absorbs less, so more of each year’s emissions stays in the air. Warming that weakens a sink is a <b>positive feedback</b>.',
     overlay(sim,ctx,LH,k){ccCard(ctx,k,[['Ocean uptake: '+ccM(sim,'ocean').toFixed(1)+' GtC a year',{w:800,c:CE_RED}]].concat(co2(sim).slice(1)));}},
    {key:'ph',lvl:'ap',title:'Ocean acidification',speed:1.5,fresh:true,focus:[395,40,405,370],
     see:'Today’s emissions for 20 years. Watch the ocean’s surface pH.',
     why:'CO₂ dissolving in seawater forms carbonic acid: CO₂ + H₂O → H₂CO₃ → H⁺ + HCO₃⁻. Extra H⁺ lowers pH and ties up carbonate ions that corals, clams and some plankton need to build shells. Surface pH has already fallen from about 8.2 to about 8.05, which means about a third more H⁺ ions.',
     overlay(sim,ctx,LH,k){stopAt(sim,2045);ccCard(ctx,k,[['Year '+yr(sim),{w:800}],['Ocean surface pH: '+ccM(sim,'ph').toFixed(3),{w:800,c:CE_RED}]]);}}
  ],
  useIt:[
    {do:'Count how many short car trips your family takes in a week, and swap one or two for walking or biking.',
     why:'Each gallon of gasoline burned puts about 8.9 kg of CO₂ into the air, carbon that was underground for millions of years.'},
    {do:'Look up the Mauna Loa CO₂ record (the Keeling Curve).',
     why:'You can see the yearly rise and the summer dip from forests leafing out, the same two flows this tool shows.'},
    {do:'Help keep Colorado’s forests healthy: follow fire restrictions and burn only dead, down wood where campfires are allowed.',
     why:'Forests are carbon sinks while they grow. A forest killed by fire or beetles stops taking in CO₂ and releases its carbon, switching from sink to source.'}],
  tryIt:[{title:'the bathtub (10 minutes)',
    steps:['Put a stopper loosely in a sink so it drains slowly.','Run the tap faster than it drains and mark the water level every minute.','Turn the tap to half, then to below the drain rate, and watch the level each time.'],
    look:'At half flow the level still rises, just slower. It only falls once the tap is below the drain, exactly like CO₂ in the air.'}]
}};
})());

/* ---------- Energy flow ---------- */
BioLab.addLearn((function(){
const enM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const enA=(sim,id)=>{const a=(sim.def.actions||[]).find(x=>x.id===id);if(a)a.run(sim);};
const NM=['Algae','Zooplankton','Minnows','Pike','Osprey'];
const kc=v=>v>=10?Math.round(v).toLocaleString('en-US'):v>=1?v.toFixed(1):v.toFixed(2);
const chain=sim=>{const p=sim.p,n=p.levels,npp=p.gpp*(1-p.resp/100),r=[];let e=npp;for(let i=0;i<n;i++){r.push(e);e*=p.eff/100;}return r;};
const enCard=(ctx,k,rows,x,w)=>dcCard(ctx,k,x==null?112:x,10,w||236,rows,{hi:false});
const ladder=(sim,hi)=>chain(sim).map((e,i)=>[NM[i]+': '+kc(e)+' kcal',{w:i===hi?800:600,c:i===hi?CE_RED:undefined}]).reverse();
const cas=sim=>{const s=sim.st;return [['Sea otters: '+s.O.toFixed(1)+' per km',{w:700}],['Sea urchins: '+s.U.toFixed(0)+' per m²',{w:700,c:CE_RED}],['Kelp cover: '+Math.round(s.Kc)+'%',{w:800,c:CE_GREEN}]];};
const go=s=>{s.running=true;if(s.ui&&s.ui.play)s.ui.play.textContent='Pause';};
return {energy:{
  goals:{
    bio:['Where the energy in a food chain comes from','Why only about 10% passes up each level','Why top predators are always rare','How much lake it takes to feed you on pike versus minnows'],
    honors:['Why only about 10% passes up each level','Why top predators are rare and need the most space','Biomagnification: why mercury builds up in big fish','Trophic cascades: how sea otters protect a kelp forest'],
    ap:['The 10% rule and trophic efficiency','GPP, plant respiration and NPP','Biomagnification','Keystone species and trophic cascades']},
  matters:'The 10% rule explains why a field feeds more people as grain than as beef, why Colorado posts mercury advisories for big reservoir fish, and why losing one predator can wreck a whole ecosystem.',
  startKey:'start',startRun:true,
  steps:[
    {key:'sun',title:'Energy starts as sunlight',fresh:true,speed:1,focus:[0,0,800,450],
     see:'Follow the yellow energy packets from the sun into the green algae at the bottom.',
     why:'Tiny floating algae (phytoplankton) capture sunlight by photosynthesis and store it in their bodies. That stored energy, about <b>10,000 kcal per m² of lake a year</b>, is the food for everything else in the lake.',
     overlay(sim,ctx,LH,k){enCard(ctx,k,[['Algae store: '+kc(chain(sim)[0])+' kcal',{w:800,c:CE_GREEN}],['per m² of lake, per year',{s:12}]]);}},
    {key:'tenth',title:'Only about 10% moves up',fresh:true,speed:1,focus:[170,80,630,360],
     see:'Compare the bars: zooplankton, minnows and pike, each eating the level below.',
     why:'Each level gets only about a tenth of the energy of the level below: 10,000 → 1,000 → 100 → 10 kcal. Most of the food an animal eats is burned for moving, breathing and keeping warm, and leaves as heat (the orange squiggles). Some is in parts that never get eaten, like shells, bones and waste.',
     overlay(sim,ctx,LH,k){enCard(ctx,k,ladder(sim,3));}},
    {key:'long',title:'A fifth level: the osprey',set:{levels:5},fresh:true,speed:1,focus:[0,60,800,390],
     cause:{from:{levels:4},delay:1.5,dur:0.6,label:'Food chain length',at:[440,436]},
     see:'An osprey, a fish-eating hawk, joins the chain and eats the pike.',
     why:'The osprey gets only <b>1 kcal</b> per m² a year, a tenth of the pike’s 10. To find enough food it has to hunt over a huge stretch of water. That is why food chains rarely go past 4 or 5 levels, and why top predators are always few and need large territories.',
     overlay(sim,ctx,LH,k){enCard(ctx,k,ladder(sim,sim.p.levels-1).slice(0,2));}},
    {key:'sunny',title:'More sunlight, more of everything',set:{gpp:40000},fresh:true,speed:1,focus:[170,80,630,360],
     cause:{from:{gpp:20000},delay:1.5,dur:2,label:'Sunlight captured',at:[440,436]},
     see:'A sunnier, nutrient-rich lake lets algae capture twice as much energy. Watch every bar.',
     why:'Each level still gets the same 10% of the level below, so doubling the energy at the bottom doubles it at every level: pike go from 10 to 20 kcal. The base of the food chain sets how much life the whole lake can hold.',
     overlay(sim,ctx,LH,k){enCard(ctx,k,ladder(sim,3));}},
    {key:'hook',title:'Your question: living on pike or minnows',fresh:true,speed:1,focus:[0,60,800,390],
     see:'You eat about 2,000 kcal a day, about 730,000 kcal a year. How much of this lake would it take to feed you on pike, compared with minnows?',
     why:'Minnows get 100 kcal per m² a year, so a year of minnows takes 730,000 ÷ 100 = <b>7,300 m²</b> of lake, about one soccer field. Pike get only 10 kcal, so a year of pike takes <b>73,000 m²</b>, about 10 soccer fields. One step up the chain costs 10 times more lake.',
     so:'The same rule works on land. Cattle turn only a small share of the grain they eat into meat, so a field feeds several times more people as grain than as steak. That is one reason food costs and land use depend so much on how high on the food chain we eat.',
     overlay(sim,ctx,LH,k,tau){const c=chain(sim),a=t=>Math.round(730000/c[t]).toLocaleString('en-US');
       enCard(ctx,k,[['One year of food: 730,000 kcal',{w:700}],['Minnows: '+a(2)+' m² of lake',{w:700,c:CE_BLUE}],tau>2?['Pike: '+a(3)+' m² of lake',{w:800,c:CE_RED}]:['Pike: ?',{w:700}]]);}},
    {key:'mercury',lvl:'honors',title:'Mercury builds up',set:{toxin:true},fresh:true,speed:1,focus:[170,80,630,360],
     cause:{from:{toxin:false},delay:1.5,dur:0.6,label:'Mercury in the lake',at:[440,436]},
     see:'Mercury, from sources like coal-burning power plants and old gold mines, settles into the lake. The algae absorb a tiny amount: 0.01 ppm. Watch the right-hand column.',
     why:'Energy is burned off at every level, but mercury stays in the body. Each predator eats many times its own weight in prey and keeps most of their mercury, so it gets about 5 times more concentrated per level. Pike end up at about <b>1.2 ppm</b>, above the FDA limit of 1 ppm for fish. This is <b>biomagnification</b>.',
     so:'Colorado Parks and Wildlife posts fish-eating advisories for some reservoirs, and they are strictest for big predators like pike and walleye. Small panfish and trout from the same water are usually safer to eat.'},
    {key:'otters',lvl:'honors',title:'A trophic cascade: remove the otters',set:{mode:'cascade'},fresh:true,speed:2,focus:[0,0,800,450],
     run(sim){atReset(sim);sim._rm=null;},
     see:'A kelp forest off the Pacific coast. Sea otters eat sea urchins, and urchins eat kelp. Watch what happens when hunters remove the otters.',
     why:'With no otters, urchins multiply and mow down the kelp. Within about 5 years the forest is an <b>urchin barren</b>: bare rock covered in urchins. Otters never eat kelp, yet the kelp depends on them. That makes otters a <b>keystone species</b>. This happened along the Pacific coast when fur traders hunted otters almost to extinction.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'rm',s=>{enA(s,'removeOtters');s._rm=s.t;});const y=sim._rm==null?0:Math.floor(sim.t-sim._rm);
       if(y>=12&&sim.running){sim.running=false;if(sim.ui&&sim.ui.play)sim.ui.play.textContent='Play';}
       enCard(ctx,k,[[sim._rm==null?'Otters still here':'Years without otters: '+y,{w:800}]].concat(cas(sim)),12,270);}},
    {key:'back',lvl:'honors',title:'Bring the otters back',set:{mode:'cascade'},fresh:true,speed:3,focus:[0,0,800,450],
     run(sim){const s=sim.st;s.O=0;for(let i=0;i<1200;i++)sim.def.step(sim,0.01);atReset(sim);sim._bk=null;},
     see:'Start from an urchin barren. A few otters return. Watch how fast the kelp comes back.',
     why:'Otters recover in about 10 years and slowly eat the urchins down, but in this model the kelp barely regrows for decades. On real coasts, recovery after otters returned has taken from several years to decades. A barren is hard to undo: it is much easier to keep a predator than to bring an ecosystem back after losing one. Sea otters have been protected since a 1911 treaty, and they slowly spread back along parts of Alaska, British Columbia and California.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'bk',s=>{enA(s,'returnOtters');s._bk=s.t;});const y=sim._bk==null?0:Math.floor(sim.t-sim._bk);
       if(y>=30&&sim.running){sim.running=false;if(sim.ui&&sim.ui.play)sim.ui.play.textContent='Play';}
       enCard(ctx,k,[[sim._bk==null?'Urchin barren':'Years since otters returned: '+y,{w:800}]].concat(cas(sim)),12,270);}},
    {key:'npp',lvl:'ap',title:'GPP, respiration and NPP',set:{resp:70},fresh:true,speed:1,focus:[170,80,630,360],
     cause:{from:{resp:50},delay:1.5,dur:2,label:'Plant respiration',at:[440,436]},
     see:'Algae capture 20,000 kcal (GPP) but burn half for their own needs. Hot weather raises that to 70%.',
     why:'NPP = GPP − plant respiration. NPP falls from 10,000 to 6,000 kcal, a 40% cut, and every consumer level falls by the same 40% because each is a fixed share of NPP. Only NPP, never GPP, is available as food.',
     overlay(sim,ctx,LH,k){enCard(ctx,k,[['GPP: '+kc(sim.p.gpp)+' kcal',{w:700}],['Plants burn: '+sim.p.resp+'%',{w:700,c:CE_RED}],['NPP: '+kc(enM(sim,'npp'))+' kcal',{w:800,c:CE_GREEN}],['Pike: '+kc(chain(sim)[3])+' kcal',{w:700}]]);}},
    {key:'eff',lvl:'ap',title:'Efficiency compounds',set:{eff:20},fresh:true,speed:1,focus:[170,80,630,360],
     cause:{from:{eff:10},delay:1.5,dur:2,label:'Trophic efficiency',at:[440,436]},
     see:'Trophic efficiency doubles from 10% to 20%. Watch the pike.',
     why:'Top energy = NPP × efficiency³ in a 4-level chain, so doubling efficiency gives 2³ = <b>8 times</b> as much at the top: 10 → 80 kcal. Cold-blooded consumers like fish and insects burn less energy on body heat, so their efficiency is higher than mammals’ and birds’. That is one reason a pound of farmed fish or chicken takes less feed than a pound of beef.',
     overlay(sim,ctx,LH,k){enCard(ctx,k,ladder(sim,3));}}
  ],
  useIt:[
    {do:'Before eating fish you catch at a Colorado reservoir, look up the CPW fish consumption advisory for that water.',
     why:'Mercury builds up most in big predators like pike and walleye, so the advisories limit those most.'},
    {do:'Compare the price per pound of rice or beans with chicken and beef at the store.',
     why:'Food from lower on the food chain takes less land and feed to grow, which shows up in what it costs.'},
    {do:'Next time you see a hawk, eagle or fox, notice how rarely you see one compared with the rabbits, mice or songbirds around it.',
     why:'Top predators get only a small share of the energy, so there are always far fewer of them, and they need lots of space.'}],
  tryIt:[{title:'pass the energy (5 minutes, with friends)',
    steps:['Start with 1,000 grains of rice or 1,000 pennies: the algae’s energy.','Pass 10% (100) to the next person, the zooplankton. They pass 10% (10) to the next, the minnow, and so on.','Count what the fourth and fifth people get.'],
    look:'The pike gets 1 and the osprey gets almost nothing. You can see why there can only be a few top predators.'}]
}};
})());

/* ---------- Biodiversity sampling ---------- */
BioLab.addLearn((function(){
const bdM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const bdA=(sim,id)=>{const a=(sim.def.actions||[]).find(x=>x.id===id);if(a)a.run(sim);};
const bdCard=(ctx,k,rows)=>dcCard(ctx,k,526,10,262,rows,{hi:false});
const f2=v=>Number.isFinite(v)?v.toFixed(2):'—';
const found=sim=>[['Hoops thrown: '+bdM(sim,'hoops'),{w:700}],['Species found: '+bdM(sim,'rich')+' of '+bdM(sim,'richT'),{w:800,c:CE_RED}]];
const simp=sim=>[['Simpson’s index (hoops): '+f2(bdM(sim,'simpS')),{w:700,c:CE_BLUE}],['Simpson’s, whole field: '+f2(bdM(sim,'simpT')),{w:700}]];
const mrCard=(ctx,k,LH,sim)=>{const N=bdM(sim,'Nhat');dcCard(ctx,k,526,(LH||450)-12,262,[[Number.isFinite(N)?'N = '+bdM(sim,'M')+' × '+bdM(sim,'C')+' ÷ '+bdM(sim,'R'):'N = M × C ÷ R',{w:700}],['Estimate: '+(Number.isFinite(N)?Math.round(N):'—')+' beetles',{w:800,c:CE_RED}],['True: '+bdM(sim,'Ntrue'),{w:700}]],{up:true,hi:false});};
const toss=(sim,tau,n,t0,gap)=>{for(let i=0;i<n;i++)atT(sim,tau,t0+i*gap,'h'+i,s=>bdA(s,'throw'));};
return {biodiversity:{
  goals:{
    bio:['Why ecologists sample instead of counting everything','Why rare species take many samples to find','Species richness versus Simpson’s diversity index','Why a lawn with 4 species can still have low diversity'],
    honors:['Why rare and clumped species take many samples','Richness versus evenness','Why evenness changes Simpson’s index','Estimating density from samples'],
    ap:['Sampling effort and species accumulation','Simpson’s index and evenness','Estimating density from quadrats','Mark–recapture and its assumptions']},
  matters:'Every biodiversity number you hear, from bird counts to endangered species surveys, comes from samples like these. Knowing how sampling works tells you when to trust a number and when it is missing something.',
  startKey:'start',startRun:true,
  steps:[
    {key:'field',title:'Too many plants to count',fresh:true,speed:1,focus:[0,0,800,450],
     see:'A real-size patch of meadow, 10 m by 5.6 m, seen from above. Each mark is one plant.',
     why:'This patch has about 2,500 plants of 8 species. Counting every one would take hours, and a real meadow is thousands of times bigger. So ecologists <b>sample</b>: they count small, randomly placed areas and use them to estimate the whole field.',
     overlay(sim,ctx,LH,k){bdCard(ctx,k,[['Plants in this patch: '+sim.st.plants.length.toLocaleString('en-US'),{w:700}],['Species: '+bdM(sim,'richT'),{w:800,c:CE_GREEN}]]);}},
    {key:'hoop',title:'Toss one hoop',fresh:true,speed:1,focus:[0,0,800,450],
     run(sim){atReset(sim);},
     see:'A hula hoop 0.75 m across lands at a random spot. Count every plant of every species inside it.',
     why:'One hoop covers 0.44 m², less than 1% of the patch. It usually finds about 5 of the 8 species: the common ones like grass, clover and dandelions. Rare plants, especially ones growing in clumps like milkweed, are easy to miss.',
     overlay(sim,ctx,LH,k,tau){toss(sim,tau,1,1.5,1);bdCard(ctx,k,found(sim));}},
    {key:'hook',title:'Your question: how many hoops to find them all?',fresh:true,speed:1,focus:[0,0,800,450],
     run(sim){atReset(sim);},
     see:'Hoops land one at a time, up to 10. Watch the species count climb.',
     why:'One hoop finds about 5 species, three find about 7, and ten find all 8 about 9 times in 10. The count rises fast at first and then levels off, because only the rare species are left to find. By ten hoops, Simpson’s index from the hoops also lands near the whole field’s 0.85.',
     so:'Keep sampling until a few more samples add nothing new, and toss at random. If you aim the hoop at the pretty flowers, you will measure what you hoped to see. Pollsters pick voters at random for the same reason.',
     overlay(sim,ctx,LH,k,tau){toss(sim,tau,10,1.5,0.9);bdCard(ctx,k,found(sim).concat(tau>10.5?simp(sim):[]));}},
    {key:'lawn',title:'A mowed lawn',set:{habitat:'lawn'},fresh:true,speed:1,focus:[0,0,800,450],
     run(sim){atReset(sim);},
     see:'A mowed front lawn. Ten hoops land at once.',
     why:'The lawn has 4 species, but grass is about 5 of every 6 plants. <b>Simpson’s index</b> is the chance that two plants picked at random are different species. Here it is only about <b>0.28</b>, because two random plants are almost always both grass. The meadow scores 0.85.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'t10',s=>bdA(s,'throw10'));bdCard(ctx,k,found(sim).concat(tau>1.6?simp(sim):[]));}},
    {key:'lot',title:'A disturbed lot',set:{habitat:'disturbed'},fresh:true,speed:1,focus:[0,0,800,450],
     run(sim){atReset(sim);},
     see:'A vacant lot that was scraped bare a few years ago. Ten hoops land.',
     why:'Bare, disturbed ground is taken over first by fast-spreading weeds like dandelions and plantain. The plants are sparse (about 21 per m², half the meadow) and grow in patches, so ten hoops often find only 4 of the 5 species. Patchy fields need more samples.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'t10',s=>bdA(s,'throw10'));bdCard(ctx,k,found(sim).concat(tau>1.6?simp(sim):[]));}},
    {key:'even',lvl:'honors',title:'Same species, more even',set:{habitat:'lawnEven'},fresh:true,speed:1,focus:[0,0,800,450],
     run(sim){atReset(sim);},
     see:'A lawn nobody has mowed or treated for a summer. It has the same 4 species as the mowed lawn. Ten hoops land.',
     why:'Now grass, clover, dandelion and plantain are about equally common. Richness is still 4, but Simpson’s index jumps from about 0.28 to <b>0.75</b>. Diversity has two parts: <b>richness</b> (how many species) and <b>evenness</b> (how equally common they are).',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'t10',s=>bdA(s,'throw10'));bdCard(ctx,k,found(sim).concat(tau>1.6?simp(sim):[]));}},
    {key:'dens',lvl:'honors',title:'Estimating density',fresh:true,speed:1,focus:[0,0,800,450],
     run(sim){atReset(sim);},
     see:'Back to the meadow. Ten hoops land. Compare the estimate with the true number.',
     why:'Density = plants counted ÷ area sampled. Ten hoops cover 4.4 m², so if they hold about 200 plants, that is about 45 plants per m². Multiply by the field’s area to estimate the total. Any one estimate is off a little; more hoops narrow it. This is how foresters estimate trees per acre and range scientists estimate how much grass a pasture holds.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'t10',s=>bdA(s,'throw10'));const est=bdM(sim,'dens');
       bdCard(ctx,k,[['Hoops: '+bdM(sim,'hoops')+' ('+(bdM(sim,'hoops')*0.44).toFixed(1)+' m²)',{w:700}],['Estimate: '+(Number.isFinite(est)?est.toFixed(0):'—')+' plants per m²',{w:800,c:CE_RED}],['True: '+(sim.st.plants.length/56.25).toFixed(0)+' per m²',{w:700}]]);}},
    {key:'mrnow',lvl:'ap',title:'Mark and recapture, too soon',set:{method:'mr'},fresh:true,speed:1,focus:[0,0,800,450],
     run(sim){atReset(sim);},
     see:'Beetles move, so hoops won’t work. Traps catch some beetles, each gets a paint dot, and they are released. Then the traps are checked again right away.',
     why:'The idea: the fraction of marked beetles in the second catch should match the fraction in the whole population, so N = M × C ÷ R. But the marked beetles are still sitting next to the traps, so most of the second catch is marked. R is too big and the estimate comes out far too low.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'m',s=>bdA(s,'mark'));atT(sim,tau,3.5,'r',s=>bdA(s,'recap'));mrCard(ctx,k,LH,sim);}},
    {key:'mr',lvl:'ap',title:'Mark, wait, recapture',set:{method:'mr'},fresh:true,speed:1,focus:[0,0,800,450],
     run(sim){atReset(sim);},
     see:'Same traps, but this time the beetles get a day to mix back into the population before the second catch.',
     why:'Now the estimate lands in the right range, though one run can miss by 30% or more because R is a small number (often under 15). The method assumes the marks don’t fall off or hurt the beetle, the marked ones mix evenly, and no beetles are born, die or move away between catches. Real surveys repeat the recapture several times and average.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'m',s=>bdA(s,'mark'));atT(sim,tau,3.5,'w',s=>bdA(s,'wait'));atT(sim,tau,5,'r',s=>bdA(s,'recap'));mrCard(ctx,k,LH,sim);}}
  ],
  useIt:[
    {do:'Toss a hula hoop (or a loop of string) at random in your yard or a park and count the different kinds of plants inside. Try 5 tosses.',
     why:'You will see the species count rise quickly and then level off, just like the graph here.'},
    {do:'Join a citizen-science count, like the Great Backyard Bird Count each February, or log a few plants in iNaturalist.',
     why:'Many people sampling in many places is how scientists track which species are spreading or disappearing.'},
    {do:'If your family has a lawn, leave one small corner unmowed for a month and compare it with the rest.',
     why:'Mowing favors grass. A few weeks without it lets other plants catch up, which raises evenness and feeds pollinators.'}],
  tryIt:[{title:'the candy-jar estimate (10 minutes)',
    steps:['Fill a bowl with dried beans and count out 50. Mark them with a marker and mix them back in.','Grab a handful, count all the beans (C) and the marked ones (R).','Estimate the total as 50 × C ÷ R, then count the whole bowl to check.'],
    look:'Your estimate should be close. Grab before mixing and it comes out far too low, the same mistake as recapturing beetles too soon.'}]
}};
})());

/* ---------- Wolf, Moose, Grass ---------- */
BioLab.addLearn((function(){
const wmA=(sim,id)=>{const a=(sim.def.actions||[]).find(x=>x.id===id);if(a)a.run(sim);};
const wmCard=(ctx,k,rows)=>dcCard(ctx,k,150,4,300,rows,{hi:false});
const H=sim=>sim.st.hist||[];
const peak=(sim,r)=>{let b=null;H(sim).forEach(x=>{if(!b||Math.round(x[r])>Math.round(b[r]))b=x;});return b;};
const stopY=(sim,y)=>{if(sim.st.year>=y&&sim.running){sim.running=false;if(sim.ui&&sim.ui.play)sim.ui.play.textContent='Play';}};
const at=(sim,y,key,fn)=>{sim._wm=sim._wm||{};if(sim.st.year>=y&&!sim._wm[key]){sim._wm[key]=1;fn(sim);}};
const AVG={luck:'avg'};
return {wolfmoose:{
  goals:{
    bio:['How the Wolf, Moose, Grass game models an ecosystem','Why moose boom when grass is plentiful and wolves are few','Why wolf numbers rise and fall after the moose','What happens to moose when every wolf is removed'],
    honors:['How predators, prey and food limit each other','Why predator peaks lag behind prey peaks','Top-down and bottom-up control','Why small populations can vanish by bad luck'],
    ap:['Predator–prey cycles and lag','Top-down and bottom-up control','Chance in small populations','What the game model gets right and wrong']},
  matters:'Colorado released its first gray wolves in 2023. Whether wolves help or hurt elk, deer and the plants they eat is exactly the question this game models.',
  startKey:'start',startRun:true,
  steps:[
    {key:'rules',title:'The game',set:AVG,fresh:true,speed:0.5,focus:[0,40,800,410],
     run(sim){sim._wm={};},
     see:'Watch one round. Moose (M) race from home to the meadow to tag a grass player (G). Wolves (W) try to tag moose on the way.',
     why:'Every student is one animal or one patch of grass, and each round is one year. Players never leave the game; they just change roles. That is how matter cycles in a real ecosystem: the same atoms move from grass to moose to wolf and back to soil.',
     overlay(sim,ctx,LH,k){stopY(sim,2);}},
    {key:'roles',title:'Who becomes what',set:AVG,fresh:true,speed:0.5,focus:[0,40,800,410],
     run(sim){sim._wm={};},
     see:'Watch each player at the end of the round.',
     why:'A moose that tags grass eats and has a calf: the grass player becomes a moose. A moose tagged by a wolf becomes a wolf (the wolf ate and had a pup). A moose that finds no grass starves, and a wolf that catches nothing starves; both become grass, like a body returning to the soil.',
     overlay(sim,ctx,LH,k){stopY(sim,2);}},
    {key:'boom',title:'Moose boom',set:AVG,fresh:true,speed:1.5,focus:[0,40,800,410],
     run(sim){sim._wm={};},
     see:'The first years: plenty of grass and only 2 wolves.',
     why:'With lots of grass and few wolves, almost every moose eats and has a calf. Moose go from 6 to 14 in two years while the grass is eaten down from 16 to 8.',
     overlay(sim,ctx,LH,k){stopY(sim,3);wmCard(ctx,k,[['Year '+sim.st.year+': moose '+Math.round(sim.st.M)+', grass '+Math.round(sim.st.G),{w:800,c:CE_RED}]]);}},
    {key:'cycle',title:'Wolves follow the moose',set:AVG,fresh:true,speed:4,focus:[0,40,800,410],
     run(sim){sim._wm={};},
     see:'Fifteen years, fast. Watch the wolves and moose counts at the top right, then the graph below.',
     why:'Moose peak first (14 in year 3). Wolves keep growing for years because there are still plenty of moose to catch, and they peak later (about 10 in year 12). By then they have eaten most of the moose, so the moose crash, and then the wolves starve and crash too. Predator peaks <b>lag</b> behind prey peaks.',
     overlay(sim,ctx,LH,k){const m=peak(sim,'M'),w=peak(sim,'W');
       wmCard(ctx,k,[['Most moose: '+Math.round(m.M)+' (year '+m.y+')',{w:700,c:CE_RED}],['Most wolves: '+Math.round(w.W)+' (year '+w.y+')',{w:700}]]);}},
    {key:'hook',title:'Your question: remove every wolf',set:AVG,fresh:true,speed:3,focus:[0,40,800,410],
     run(sim){sim._wm={};},
     see:'In year 5 the teacher pulls every wolf out of the game. Watch the moose for the next ten years.',
     why:'The moose don’t take over and stay. They jump to about <b>19</b> of the 24 players the next year, but then there is too little grass: most starve, and the herd drops to about <b>8</b>. From then on the moose swing between about 7 and 19, booming and crashing against their food supply.',
     so:'Every population is held back by something. Without a predator, prey grow until food runs short, then crash. Yellowstone had no wolves from about 1926 to 1995, and elk browsed streamside willows and aspen hard; after wolves returned, some of those willow stands began to recover.',
     overlay(sim,ctx,LH,k){at(sim,5,'nw',s=>wmA(s,'nowolves'));stopY(sim,15);
       wmCard(ctx,k,[[sim.st.year<6?'Year '+sim.st.year+': wolves still in the game':'Year '+sim.st.year+': no wolves',{w:700}],['Moose: '+Math.round(sim.st.M)+'   Grass: '+Math.round(sim.st.G),{w:800,c:CE_RED}]]);}},
    {key:'drought',title:'A drought year',set:AVG,fresh:true,speed:2,focus:[0,40,800,410],
     run(sim){sim._wm={};},
     see:'In year 4, a drought: half the grass doesn’t grow.',
     why:'With half the grass gone, many moose can’t find food and starve: the herd drops from 13 to about 6. Over the next few years the wolves grow more slowly, because there are fewer moose to catch. Food at the bottom limits everything above it. Ecologists call this <b>bottom-up control</b>; wolves limiting moose is <b>top-down control</b>.',
     overlay(sim,ctx,LH,k){at(sim,4,'dr',s=>wmA(s,'drought'));stopY(sim,8);
       wmCard(ctx,k,[['Year '+sim.st.year+(sim.st.year===4?': drought':''),{w:700}],['Moose: '+Math.round(sim.st.M)+'   Wolves: '+Math.round(sim.st.W),{w:800,c:CE_RED}]]);}},
    {key:'luck',lvl:'honors',title:'A real game has luck',set:{luck:'real'},fresh:true,speed:4,focus:[0,40,800,410],
     run(sim){sim._wm={};},
     see:'Now each tag is a real chance, like in the gym. Fifteen years, fast.',
     why:'In a real game, a few lucky or unlucky rounds swing small populations hard. Here the wolves climb to 12, then crash to a single wolf after the moose run out. Without <b>migration</b> (one player rejoining a species that hits zero), they would be gone for good. Isle Royale’s wolves fell to just 2 by 2016, and the park brought in new wolves in 2018 and 2019.',
     overlay(sim,ctx,LH,k){const w=peak(sim,'W');wmCard(ctx,k,[['Year '+sim.st.year+': wolves '+Math.round(sim.st.W)+', moose '+Math.round(sim.st.M),{w:800,c:CE_RED}],['Most wolves so far: '+Math.round(w.W),{w:700}]]);}},
    {key:'model',lvl:'ap',title:'What the game gets wrong',set:AVG,fresh:true,pause:true,focus:[0,40,800,410],
     see:'Think about the game as a model of a real ecosystem.',
     why:'It gets the big ideas right: matter cycles, predators lag prey, and food and predators both limit a population. But the class size is fixed, so the total number of organisms can’t grow; every animal breeds or dies in a single year; wolves never die of old age unless you add a death rate; and grass never regrows on its own. A real wolf eats many prey a year, not one, and real ecosystems have many species, not three. A good model is simple on purpose, and you should know what it leaves out.'}
  ],
  useIt:[
    {do:'Look up where Colorado Parks and Wildlife has released gray wolves and how many packs there are now.',
     why:'Colorado’s first 10 wolves were released in Grand and Summit counties in December 2023. Whether they change elk and deer numbers is happening in your state right now.'},
    {do:'Next time you hike in the mountains, notice whether young aspen and willows along streams are chewed down or growing tall.',
     why:'Heavy browsing is a sign of many elk or deer and few predators, the same pattern as the moose without wolves.'},
    {do:'Play the game in the gym, write down your class’s numbers each round, and enter them under Our class data.',
     why:'You will see whether your real game shows the same lag between moose and wolves as the model.'}],
  tryIt:[{title:'the game at a table (15 minutes, 3 or more people)',
    steps:['Use 24 coins or cards: 2 wolves, 6 moose and 16 grass (mark them W, M, G).','Each round, roll a die for each moose: 1 = tagged by a wolf (becomes W), 2–5 = finds grass (one G becomes M), 6 = starves (becomes G). Each wolf that tagged nothing becomes G.','Record the counts each round for 10 rounds and graph them.'],
    look:'Moose should rise first, wolves later, then both fall, the same lag as on screen.'}]
}};
})());

/* ---------- Plate tectonics (APES Topic 4.1) ---------- */
BioLab.addLearn((function(){
const plM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const plCard=(ctx,k,LH,rows)=>dcCard(ctx,k,12,(LH||450)-30,262,rows,{up:true,hi:false});
const f1=v=>Number.isFinite(v)?v.toFixed(1):'—',f0=v=>Number.isFinite(v)?Math.round(v).toLocaleString('en-US'):'—';
return {plates:{
  goals:{
    bio:['What plates are and what moves them','What happens where plates pull apart, crash together and slide past each other','Why earthquakes and volcanoes happen where they do','How hot spots build island chains like Hawaii'],
    honors:['What plates are and what moves them','The landforms and hazards at each kind of boundary','How magnetic stripes and earthquake depths show the plates moving','How hot spots build island chains like Hawaii'],
    ap:['The landforms and hazards at each kind of boundary','Evidence for plate motion: magnetic stripes, earthquake depths, hot-spot tracks','Calculating plate speed from distance and age','Why a locked fault releases its slip in big earthquakes']},
  matters:'Earthquakes, tsunamis and volcanoes kill people and shape where cities are built. Knowing which kind of boundary is near a place tells you which hazards to expect there, whether that is an immersion in Quito, a college in Seattle or a trip to Japan.',
  startKey:'start',startRun:true,
  steps:[
    {key:'shell',title:'Earth’s shell is broken into plates',set:{view:'boundary',type:'ridge',speed:2.5,stripes:false,convect:true},fresh:true,speed:2,
     see:'A slice through the top 700 km of Earth under the Atlantic Ocean. The gray layer is the rigid plate. The orange below it is the asthenosphere. Watch the arrows in the orange.',
     why:'Earth’s outer shell, about 100 km thick, is broken into a dozen big <b>plates</b>. Below them the rock is so hot it flows very slowly, in loops called <b>convection currents</b>: hot rock rises, spreads out, cools and sinks. The plates ride along at a few centimeters a year.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['These plates move 2.5 cm a year',{w:700}],['Your fingernails grow about 3–4 cm a year',{w:600}],['Over 1 million years: 25 km',{w:800,c:CE_RED}]]);}},
    {key:'ridge',title:'Pulling apart: new sea floor',set:{view:'boundary',type:'ridge',speed:2.5,stripes:false},fresh:true,speed:2,
     see:'The white ticks are spots on the sea floor. Watch them move away from the ridge on both sides.',
     why:'As the plates pull apart, hot rock rises into the gap. The pressure on it drops, so it melts and erupts as lava that hardens into <b>new sea floor</b>. The youngest rock is at the ridge, and it gets older the farther away you go. Only small, shallow earthquakes happen here. Iceland is a piece of the Mid-Atlantic Ridge sticking above the sea.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['New sea floor so far: '+f0(plM(sim,'moved'))+' km',{w:700}],['Deepest quake: '+f0(plM(sim,'deep'))+' km',{w:800,c:CE_RED}]]);}},
    {key:'stripes',lvl:'honors',title:'The sea floor’s magnetic stripes',set:{view:'boundary',type:'ridge',speed:2.5,stripes:true},fresh:true,speed:2,cause:{from:{stripes:false},delay:1.5,label:'Magnetic stripes',at:[620,330]},
     see:'The strip at the top is the sea floor near the ridge, seen from above. Watch new stripes form at the ridge as time runs.',
     why:'Lava contains iron minerals that line up with Earth’s magnetic field as it cools, like tiny compass needles frozen in place. Earth’s field flips every few hundred thousand years. Each flip starts a new stripe at the ridge, and spreading carries the older stripes away on both sides, so the pattern is a <b>mirror image</b>. Finding these stripes in the 1960s convinced scientists the sea floor really spreads.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Black: field the way it is now',{w:700}],['White: field flipped',{w:700}],['Same pattern on both sides',{w:800,c:CE_RED}]]);}},
    {key:'rift',title:'A continent splits',set:{view:'boundary',type:'rift',speed:0.7,stripes:false},fresh:true,speed:8,
     see:'The same pulling apart, under a continent, running fast. Watch the middle drop, volcanoes grow on the edges, and then what happens to the valley.',
     why:'Stretching thins the continent, and the middle drops into a long <b>rift valley</b> with volcanoes and shallow earthquakes, like East Africa, where Kilimanjaro stands. If it keeps pulling apart, the valley drops below sea level and <b>the ocean floods in</b>, like the Red Sea between Africa and Arabia. A smaller, much slower rift, the Rio Grande Rift, runs from central Colorado into New Mexico.',
     overlay(sim,ctx,LH,k){const D=plM(sim,'moved');plCard(ctx,k,LH,[['Pulled apart: '+f0(D)+' km',{w:700}],[D>140?'Flooded: a new ocean':'Still a valley on land',{w:800,c:D>140?CE_BLUE:CE_RED}]]);}},
    {key:'oc',title:'Ocean meets continent: a plate dives',set:{view:'boundary',type:'oc',speed:6.5},fresh:true,speed:1.5,
     see:'Ocean floor on the left, a continent on the right. Follow the white ticks on the ocean plate and watch where magma rises.',
     why:'Ocean crust is made of dense basalt; continents are lighter granite. When they push together, the ocean plate sinks under the continent: <b>subduction</b>. Where it bends down, the sea floor forms a deep <b>trench</b>. About 100 km down, water squeezed out of the sinking plate makes the hot rock above it melt. That magma rises to build a chain of <b>volcanoes</b> about 200 km inland: the Andes.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Trench: '+f1(plM(sim,'low'))+' km deep',{w:700}],['Volcanoes: '+f1(plM(sim,'high'))+' km high',{w:800,c:CE_RED}]]);}},
    {key:'deep',title:'Earthquakes follow the sinking plate',set:{view:'boundary',type:'oc',speed:6.5},fresh:true,speed:2,
     see:'Watch where the earthquakes happen. Red ones are shallow, orange are medium, purple are deep.',
     why:'The sinking plate stays colder and more brittle than the mantle around it, so it cracks as it goes down. The earthquakes trace the slab: <b>shallow near the trench and deeper and deeper inland</b>, down to about 660 km. Only subduction makes earthquakes that deep. It also makes the biggest ones: Chile’s magnitude 9.5 in 1960 is the strongest ever recorded.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Deepest earthquake so far:',{w:700}],[f0(plM(sim,'deep'))+' km down',{w:800,c:CE_RED,s:16}]]);}},
    {key:'oo',title:'Ocean meets ocean: an island arc',set:{view:'boundary',type:'oo',speed:8},fresh:true,speed:2,
     see:'Two ocean plates meet. Watch a volcano grow from the sea floor.',
     why:'The older ocean plate is colder and denser, so it is the one that sinks. The trench here is the deepest kind: the Mariana Trench reaches about 11 km. Magma from the sinking plate builds volcanoes that rise out of the sea as a curved <b>island arc</b>, like Japan. In 2011 a magnitude 9.0 earthquake here pushed up the sea floor and sent a tsunami onto Japan’s coast.',
     overlay(sim,ctx,LH,k){const h=plM(sim,'high');plCard(ctx,k,LH,[['Trench: '+f1(plM(sim,'low'))+' km deep',{w:700}],[h>0?'Island: '+f1(h)+' km above the sea':'Volcano still under water',{w:800,c:CE_RED}]]);}},
    {key:'cc',title:'Continents collide',set:{view:'boundary',type:'cc',speed:4},fresh:true,speed:4,
     see:'India on the left, Asia on the right, running fast. Watch the middle.',
     why:'Continents are too thick and light to sink. So when two meet, the crust <b>crumples, folds and stacks up</b> into high mountains with a deep root below them. India has been pushing into Asia for about 50 million years, and the Himalayas, with Mount Everest at 8.8 km, are still rising. There are big, shallow earthquakes (Nepal, 2015) but <b>no volcanoes</b>, because no plate sinks deep enough to melt.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Mountains: '+f1(plM(sim,'high'))+' km high',{w:800,c:CE_RED}],['Volcanoes: none',{w:700}]]);}},
    {key:'transform',title:'Sliding past: the road bends, then snaps',set:{view:'boundary',type:'transform',speed:3.5},fresh:true,speed:1,
     see:'The San Andreas Fault, seen from above. A road and a stream cross the fault. Watch the road near the fault, then watch what happens.',
     why:'The plates slide past each other steadily, but friction keeps the fault <b>locked</b>. The ground near the fault bends and stores up strain, like a ruler you are bending. When the strain beats the friction, the fault slips several meters in seconds: an <b>earthquake</b>. The road snaps straight again, now offset. In 1906, roads and fences near San Francisco were offset by up to about 6 m.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Strain stored: '+f1(plM(sim,'strain'))+' m',{w:700}],['Road offset so far: '+f1(plM(sim,'offset'))+' m',{w:700}],['Big earthquakes: '+f0(plM(sim,'nq')),{w:800,c:CE_RED}]]);}},
    {key:'hawaii',title:'Hot spots: Hawaii',set:{view:'hotspot',spot:'hawaii',speed:8},fresh:true,speed:3,
     see:'A plume of hot rock rises from deep in the mantle and stays in one place. Watch the plate carry each new volcano away.',
     why:'Each volcano forms over the <b>hot spot</b>, then rides the Pacific plate northwest, away from its magma. It stops erupting, wears down and slowly sinks. So the islands get <b>older the farther they are from the hot spot</b>: the Big Island is under 1 million years old and Kauai is about 5 million.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Volcanoes formed: '+f0(plM(sim,'nisl')),{w:700}],['Oldest: '+f1(plM(sim,'oldest'))+' million years, '+f0(plM(sim,'odist'))+' km away',{w:800,c:CE_RED}]]);}},
    {key:'yellowstone',title:'Hot spots: Yellowstone',set:{view:'hotspot',spot:'yellowstone',speed:2.5},fresh:true,speed:4,
     see:'The same kind of hot spot, under a continent. Watch the craters it leaves behind.',
     why:'Under a continent, a hot spot makes huge eruptions that leave giant craters called <b>calderas</b>. As the North American plate drifts southwest, it leaves a trail of old calderas across Idaho, now buried under flat lava plains. Yellowstone sits over the hot spot today; its last giant eruption was about 640,000 years ago, and the same heat powers its geysers.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Craters formed: '+f0(plM(sim,'nisl')),{w:700}],['Oldest: '+f0(plM(sim,'odist'))+' km away',{w:800,c:CE_RED}]]);}},
    {key:'hook',title:'Your question: why volcanoes around Quito?',set:{view:'boundary',type:'oc',speed:6.5},fresh:true,speed:1.5,
     see:'The boundary off Ecuador’s coast: the Nazca plate diving under South America.',
     why:'It is <b>ocean meeting continent</b>. The Nazca plate sinks under South America at about 6.5 cm a year at a trench about 8 km deep offshore. About 100 km down, the sinking plate melts the rock above it, and the magma rises about 200–300 km inland, right where Quito sits, to build volcanoes like Cotopaxi and Pichincha. The same sinking plate sets off earthquakes, and big ones near the coast can start tsunamis. Denver is more than 1,000 km from the nearest plate boundary.',
     so:'Living near a subduction zone means planning for both earthquakes and volcanic ash. Ecuador watches its volcanoes closely and posts alert levels.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Plate speed: 6.5 cm a year',{w:700}],['Trench: '+f1(plM(sim,'low'))+' km deep',{w:700}],['Volcanoes: '+f1(plM(sim,'high'))+' km high, about 200 km inland',{w:800,c:CE_RED}]]);}},
    {key:'rate',lvl:'ap',title:'Measure the plate’s speed',set:{view:'hotspot',spot:'hawaii',speed:8},fresh:true,speed:3,
     see:'Hawaii again. The card divides the oldest volcano’s distance by its age.',
     why:'Speed = distance ÷ time. A volcano 400 km from the hot spot that formed 5.0 million years ago has moved 40,000,000 cm in 5,000,000 years: <b>8 cm a year</b>. Shortcut: km per million years ÷ 10 = cm per year. The same math works on magnetic stripes: measure a stripe’s distance from the ridge and divide by its age.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[[f0(plM(sim,'odist'))+' km ÷ '+f1(plM(sim,'oldest'))+' million years',{w:700}],['= '+f1(plM(sim,'calc'))+' cm a year',{w:800,c:CE_RED,s:15}]]);}},
    {key:'recur',lvl:'ap',title:'How often does the fault break?',set:{view:'boundary',type:'transform',speed:7},fresh:true,speed:1,
     see:'The fault again, with the plates sliding twice as fast. Watch the gap between earthquakes.',
     why:'Each big earthquake releases the slip stored since the last one, a few meters. Time between quakes ≈ slip ÷ speed: 4.5 m ÷ 3.5 cm/yr ≈ 130 years, and at 7 cm/yr about 65 years. Real faults are messier, so scientists give odds rather than dates, but the pattern holds: <b>faster plates, more frequent quakes</b>.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Big earthquakes: '+f0(plM(sim,'nq')),{w:700}],['Years between the last two: '+f0(plM(sim,'gap')),{w:800,c:CE_RED}]]);}}
  ],
  useIt:[
    {do:'Before a trip near a plate boundary, like an immersion in Quito or Peru, a college visit to Seattle or Los Angeles, or a trip to Japan, practice Drop, Cover and Hold On.',
     why:'Most earthquake injuries come from things falling on people or people falling, not from buildings collapsing. Getting down under a sturdy table protects you from both (Ready.gov).'},
    {do:'At the coast, if you feel strong shaking or shaking that lasts a long time, go to high ground right away. Don’t wait for an official warning.',
     why:'A subduction-zone earthquake can lift the sea floor and send a tsunami ashore within minutes. The shaking is your warning (NOAA).'},
    {do:'At Yellowstone, stay on the boardwalks in the geyser basins.',
     why:'The hot spot heats the water close to boiling, and the ground can be a thin crust over it. People are badly burned there every few years after stepping off (National Park Service).'}],
  tryIt:[{title:'the paper-towel mountains (2 minutes)',
    steps:['Lay two damp paper towels flat on a table with their edges touching.','Put a hand flat on each towel and slowly push them together.','Now try sliding the edge of one towel under a hardcover book instead.'],
    look:'The towels can’t sink into the table, so they buckle up into folds, like two continents making the Himalayas. The towel that slides under the book is like an ocean plate subducting.'}]
}};
})());

/* ---------- Niche partitioning ---------- */
BioLab.addLearn((function(){
const nM=(sim,id)=>{const m=(sim.def.metrics||[]).find(x=>x.id===id);return m?m.get(sim):NaN;};
const nCard=(ctx,k,LH,rows)=>dcCard(ctx,k,440,(LH||450)-6,340,rows,{up:true,hi:false});
const ovr=(sim,col)=>['Overlap: '+Math.round(nM(sim,'ov'))+'%   ·   '+nM(sim,'out'),{w:800,c:col}];
const pops=sim=>{const a=sim.def.metrics.find(m=>m.id==='popA'),b=sim.def.metrics.find(m=>m.id==='popB'),f=v=>v<0.5?'gone':Math.round(v);return [[a.label+': '+f(a.get(sim)),{w:700}],[b.label+': '+f(b.get(sim)),{w:700}]];};
return {niche:{
  goals:{
    bio:['What happens when two species need exactly the same thing','How species share a habitat by splitting up a resource','Real examples: Paramecium, warblers, African grazers','How to use the idea at a bird feeder or in a garden'],
    honors:['The competitive exclusion principle','Resource partitioning in place, food and time','Fundamental versus realized niche','How much overlap two species can handle'],
    ap:['The competitive exclusion principle and resource partitioning','Fundamental versus realized niche','The Lotka–Volterra competition model and the coexistence rule α < K₂/K₁']},
  matters:'Every habitat is crowded with species that need food and space. Knowing how they share explains why one invasive species can wipe out a native one, why a varied garden draws more pollinators, and how a wildlife park like Gorongosa can hold so many kinds of large animals.',
  startKey:'start',startRun:true,
  steps:[
    {key:'alone',title:'One species alone',set:{sc:'gause1',grow:'A',sep:0.15},fresh:true,speed:1,
     see:'A tube of water with bacteria to eat. A few Paramecium aurelia, single-celled organisms, are added. Watch their number.',
     why:'With food and space and no competitor, they multiply fast at first, then level off when the tube is full: its <b>carrying capacity</b>. Everything they could use with no competition is their <b>fundamental niche</b>.',
     overlay(sim,ctx,LH,k){nCard(ctx,k,LH,[[pops(sim)[0][0],{w:800,c:CE_GREEN}]]);}},
    {key:'exclusion',title:'Same food, same place: one wins',set:{sc:'gause1',grow:'both',sep:0.15},fresh:true,speed:1.5,
     see:'Now a second species, P. caudatum, shares the tube and eats the same bacteria. Watch both populations.',
     why:'Their niches overlap almost completely, so every bacterium one eats is one the other can’t. P. aurelia grows faster and packs in tighter, so it gets the food first, and <b>P. caudatum dies out</b>. Gause saw exactly this in 1934. Two species can’t share the very same niche for long: the <b>competitive exclusion principle</b>.',
     overlay(sim,ctx,LH,k){nCard(ctx,k,LH,[ovr(sim,CE_RED)]);}},
    {key:'partition',title:'Split the tube: both survive',set:{sc:'gause2',grow:'both',sep:2.6},fresh:true,speed:1.5,
     see:'P. caudatum again, now with green P. bursaria. Watch where each one feeds, and both populations.',
     why:'P. caudatum eats bacteria floating near the top; P. bursaria (green from the algae living inside it) eats yeast that settles near the bottom. They barely compete, so <b>both survive</b>. Sharing a resource by using different parts of it is <b>resource partitioning</b>.',
     overlay(sim,ctx,LH,k){nCard(ctx,k,LH,[ovr(sim,CE_GREEN)]);}},
    {key:'warblers',title:'Splitting a tree',set:{sc:'warblers',grow:'both',sep:2.2},fresh:true,speed:1,
     see:'Two warblers that both eat insects in the same spruce trees. Watch where each one hunts.',
     why:'In the 1950s Robert MacArthur watched five warbler species share spruce trees in Maine. Each hunted mostly in its own zone: the Cape May warbler near the treetop, the bay-breasted warbler in the middle near the trunk, others lower down. Splitting the tree by <b>place</b> keeps them from competing head to head.',
     overlay(sim,ctx,LH,k){nCard(ctx,k,LH,[ovr(sim,CE_GREEN)]);}},
    {key:'grazers',title:'Splitting the menu',set:{sc:'grazers',grow:'both',sep:2.8},fresh:true,speed:1,
     see:'Gorongosa National Park in Mozambique: waterbuck graze on grass in the open; kudu browse leaves from trees and shrubs.',
     why:'Large plant-eaters share a park by eating different plants: <b>grazers</b> eat mostly grass, <b>browsers</b> eat mostly leaves, and some eat both. Gorongosa lost more than 90% of its large animals during a civil war, and since a restoration project began in 2004, those populations have climbed back past 100,000 animals, with the species sharing the park this way.',
     overlay(sim,ctx,LH,k){nCard(ctx,k,LH,[ovr(sim,CE_GREEN)]);}},
    {key:'threshold',lvl:'honors',title:'How much overlap is too much?',set:{sc:'gause2',grow:'both',sep:0.4},fresh:true,speed:1.5,cause:{from:{sep:2.6},delay:2,dur:4,label:'How different their niches are',at:[250,440]},
     see:'The two Paramecium that split the tube. Watch the niche difference shrink and the overlap rise, then watch P. bursaria.',
     why:'As their niches slide together, the overlap climbs. Past a certain point (here about 87%, set by how much more P. caudatum the tube can hold) the weaker competitor can’t grow back from low numbers, and it declines. Small differences between species can be the difference between living together and one disappearing.',
     overlay(sim,ctx,LH,k){nCard(ctx,k,LH,[ovr(sim,CE_RED)]);}},
    {key:'realized',lvl:'honors',title:'Fundamental and realized niche',set:{sc:'warblers',grow:'both',sep:1.4},fresh:true,speed:1.5,
     see:'Look at the curves on the right. Dashed: where each warbler would hunt alone. Solid: where it hunts with the other one around.',
     why:'With no competitor, each species could use its whole <b>fundamental niche</b>. With a competitor, it gets pushed out of the zones the other one crowds, and it uses only its <b>realized niche</b>. Joseph Connell showed this on Scottish shores: one barnacle species could live low on the rocks when alone but was crowded out of there by a competitor.',
     overlay(sim,ctx,LH,k){}},
    {key:'hook',title:'Your question: more birds at the feeder',set:{sc:'gause1',grow:'both',sep:2.6},fresh:true,speed:1.5,cause:{from:{sep:0.15},delay:3,dur:2,label:'Different foods in different places',at:[250,440]},
     see:'Two species that want the same food, like birds crowding one tube of sunflower seed. Watch what happens when they get different foods in different places.',
     why:'With one food in one place, the niches overlap almost completely and the strongest competitor crowds the others out. Split the resource and the overlap drops to about 18%, so both survive. At a feeder, that means offering different foods in different places: nyjer seed for goldfinches, suet for woodpeckers and nuthatches, seed scattered on the ground for juncos.',
     overlay(sim,ctx,LH,k){nCard(ctx,k,LH,[ovr(sim,nM(sim,'ov')>80?CE_RED:CE_GREEN)]);}},
    {key:'rule',lvl:'ap',title:'The coexistence rule',set:{sc:'grazers',grow:'both',sep:1.2},fresh:true,speed:1.5,
     see:'Waterbuck and kudu with more diet overlap. Compare α with K₂ ÷ K₁ in the readouts.',
     why:'In the Lotka–Volterra model, the weaker species can increase from low numbers only if K₂ > αK₁, that is, <b>α &lt; K₂/K₁</b>. Here K₂/K₁ = 600/900 = 0.67. Overlap gives α = '+'0.70'+', just above the line, so the kudu slowly declines. Spread their diets a little more and both persist.',
     overlay(sim,ctx,LH,k){nCard(ctx,k,LH,[['α = '+nM(sim,'alpha').toFixed(2)+'   K₂/K₁ = '+nM(sim,'ratio').toFixed(2),{w:800,c:CE_RED}],[String(nM(sim,'out')),{w:700}]]);}}
  ],
  useIt:[
    {do:'If you or your family feed birds, offer different foods in different places: nyjer seed in a finch feeder, suet in a cage, a little seed on the ground.',
     why:'Different birds eat different foods at different heights. One kind of food in one spot mostly feeds whichever species dominates it.'},
    {do:'Plant a mix of flowers with different shapes and bloom times in a garden or planter.',
     why:'Bees, butterflies and hummingbirds split up flowers by shape and season. A mix gives more pollinator species their own niche.'},
    {do:'Never release a pet fish, turtle or plant into a pond or creek.',
     why:'A newcomer that needs the same food and space as a native species can outcompete it. Colorado Parks and Wildlife lists released pets among the ways invasive species spread.'}],
  tryIt:[{title:'feeder watch (a week of mornings)',
    steps:['Watch a bird feeder (yours, a neighbor’s or a park’s) for 5 minutes on a few mornings.','Write down each kind of bird you can tell apart and where it feeds: on the feeder, under it, or on a tree trunk nearby.'],
    look:'Different species tend to feed in different places, even at the same feeder. That is niche partitioning in your own backyard.'}]
}};
})());

/* ---------- gmotrial (replaces Gizmos "Experimental Design Practice – GMOs" and "GMO – Design Your Own Experiment", APES) ---------- */
BioLab.addLearn((function(){
const G=sim=>sim.def._gm,M=(sim,id)=>{const m=sim.def.metrics.find(x=>x.id===id);return m?m.get(sim):null;};
const D=v=>(v>=0?'+':'−')+Math.abs(v).toFixed(0);
const card=(ctx,k,rows)=>dcCard(ctx,k,486,44,300,rows);
const done=sim=>sim.st.phase==='done';
const again=sim=>{const st=sim.st,r=G(sim).results(sim);if(r)st.hist.push(r.diff);st.seed++;G(sim).grow(sim);};
const START={q:'bt',season:'borers',ctrl:'side',n:6,layout:'random',fair:'same'};
return {
gmotrial: {
  goals: {
    bio: ['Why a fair test needs a control group grown at the same time', 'Why one plot of each seed can’t tell you anything', 'How a bad layout or extra fertilizer can create a difference the seed didn’t cause', 'Why a GMO trait helps only when its problem shows up'],
    honors: ['How error bars separate a real difference from noise', 'Why randomized matched pairs need fewer plots'],
    ap: ['What a p-value and a confidence interval do and don’t tell you']
  },
  matters: 'Seed companies, drug makers and supplement ads all say “studies show.” The same few design questions tell you whether to believe them: compared with what, how many times, and was anything else different?',
  question: 'A seed dealer says new Bt corn “yields 15% more.” Your family farm has 24 test plots. How would you find out if that’s true on your land?',
  startKey: 'one', startRun: true,
  steps: [
    { key: 'one', title: 'One plot of each', set: Object.assign({}, START, { n: 1 }), fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);},
      see: 'One plot of Bt corn and one of regular corn, in a year with corn borers. Watch the harvest.',
      why: 'One plot each gives one number each. But two plots of the same seed never yield the same: soil, water and insects vary across a field. With one plot, you can’t tell the seed’s effect from luck.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.4,'g',s=>{s.st.seed=2;G(s).grow(s);});if(done(sim))card(ctx,k,[['One plot each: '+D(M(sim,'diff'))+' bu/acre',{w:700}],['Is that the seed, or luck?',{c:'#c8102e',w:700}]]);} },
    { key: 'again', title: 'Run it again… and again', set: Object.assign({}, START, { n: 1 }), fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);},
      see: 'The same one-plot design, run three times, as if in three different years.',
      why: 'The difference jumps around by tens of bushels from run to run. A single comparison can even point the wrong way. Repeating the treatment, called replication, is how you see that spread.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.3,'g',s=>{s.st.seed=5;G(s).grow(s);});atT(sim,tau,4.3,'a',again);atT(sim,tau,8.3,'b',again);
        const h=sim.st.hist.concat(done(sim)?[M(sim,'diff')]:[]);card(ctx,k,[['One plot each, run '+Math.max(1,h.length)+' times',{w:700}],[h.length?h.map(D).join(', ')+' bu/acre':'…',{c:'#c8102e',w:700}],'Same design, very different answers']);} },
    { key: 'reps', title: 'Six plots each, placed at random', set: START, fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);},
      see: 'Now 6 plots of each seed, scattered at random across the field. Watch the dots, then two more runs.',
      why: 'Averages of 6 plots wobble much less than single plots, and random placement spreads good and poor soil across both seeds. Run after run, Bt comes out about 20 bu/acre ahead: in a borer year, the trait really works.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.3,'g',s=>{s.st.seed=G(s).rep(s,22,3);});atT(sim,tau,4.3,'a',again);atT(sim,tau,8.3,'b',again);
        const h=sim.st.hist.concat(done(sim)?[M(sim,'diff')]:[]);card(ctx,k,[['6 plots each, at random',{w:700}],[h.length?h.map(D).join(', ')+' bu/acre':'…',{c:'#1b7a3a',w:700}],'Runs now agree: Bt helps in a borer year']);} },
    { key: 'normal', title: 'A year without corn borers', set: Object.assign({}, START, { season: 'normal' }), fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);},
      see: 'The same fair trial in a normal year, with few corn borers.',
      why: 'The difference shrinks to about zero. Bt’s protein only kills corn borers; when they don’t show up, it has nothing to do. A GMO trait is a tool for one problem, not extra yield in general.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.3,'g',s=>{s.st.seed=G(s).rep(s,0,2);});if(done(sim))card(ctx,k,[['Normal year: '+D(M(sim,'diff'))+' bu/acre',{w:700}],['No borers, nothing for Bt to do',{c:'#c8102e',w:700}]]);} },
    { key: 'split', title: 'A layout that fools you', set: Object.assign({}, START, { season: 'normal', layout: 'split' }), fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);},
      see: 'Same normal year, but now all the Bt plots are on the east half. Watch the result, then the soil map.',
      why: 'Bt suddenly “wins” by about 25 bu/acre, in a year when it can’t help. The east end has deeper soil, and only Bt was planted there. Soil and seed are confounded: you can’t tell which one made the difference. Random placement prevents this.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.3,'g',s=>{s.st.seed=G(s).rep(s,26,3);});atT(sim,tau,4.6,'s',s=>{s.st.soil=true;});
        if(done(sim))card(ctx,k,[['Bt on the east half: '+D(M(sim,'diff'))+' bu/acre',{w:700}],[sim.st.soil?'The east has the better soil':'But this is a no-borer year…',{c:'#c8102e',w:700}]]);} },
    { key: 'fert', title: 'One extra difference', set: Object.assign({}, START, { season: 'normal', fair: 'extra' }), fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);},
      see: 'Random placement again, but the dealer’s Bt plots also got extra fertilizer.',
      why: 'Bt “wins” by about 14 bu/acre, all of it from the fertilizer. When two things differ between groups, the result can’t tell you which one did it. Change only the variable you are testing.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.3,'g',s=>{s.st.seed=G(s).rep(s,14,3);});if(done(sim))card(ctx,k,[['Extra fertilizer on Bt: '+D(M(sim,'diff'))+' bu/acre',{w:700}],['That’s the fertilizer, not the seed',{c:'#c8102e',w:700}]]);} },
    { key: 'last', title: 'No control group', set: { q: 'dt', season: 'drought', ctrl: 'last', n: 6, layout: 'random', fair: 'same' }, fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);},
      see: 'A farmer tries drought-tolerant corn in a dry summer and compares it with last year’s 178 bu/acre.',
      why: 'It looks like a disaster, about 45 bu/acre down. But the drought hit every field. Without regular corn grown beside it this year, she can’t see that regular corn did even worse. The control group has to share the same season.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.3,'g',s=>{s.st.seed=G(s).rep(s,-46,3);});if(done(sim))card(ctx,k,[['Against last year: '+D(M(sim,'diff'))+' bu/acre',{w:700}],['The drought, not the seed',{c:'#c8102e',w:700}]]);} },
    { key: 'pairs', lvl: 'honors', title: 'Error bars and matched pairs', set: { q: 'dt', season: 'drought', ctrl: 'side', n: 12, layout: 'random', fair: 'same' }, fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);sim._gmSE=null;},
      see: 'Drought-tolerant vs regular corn in a dry summer, 12 plots each at random. Then the same 24 plots as 12 neighbor pairs.',
      why: 'The trait’s gain, about 12 bu/acre, is small next to the soil and plot noise, so random plots leave wide error bars. In matched pairs each comparison shares its soil, so soil cancels out and the uncertainty shrinks: the same 24 plots can now detect a smaller effect.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.3,'g',s=>{s.st.seed=G(s).rep(s,12,2);});atT(sim,tau,4.4,'p',s=>{s._gmSE=M(s,'se');BioLab.setValues(s,{layout:'blocks'});s.st.seed=G(s).rep(s,12,2);});
        card(ctx,k,[['Difference '+(done(sim)?D(M(sim,'diff')):'…')+' bu/acre',{w:700}],sim._gmSE!=null?'At random: ± '+sim._gmSE.toFixed(1)+' (standard error)':'At random: ± '+(done(sim)?M(sim,'se').toFixed(1):'…'),sim._gmSE!=null?['In pairs: ± '+(done(sim)?M(sim,'se').toFixed(1):'…'),{c:'#1b7a3a',w:700}]:'']);} },
    { lvl: 'ap', key: 'pval', title: 'p-values from repeated trials', set: Object.assign({}, START, { layout: 'blocks' }), fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);sim._gmP=[];},
      see: 'Six Bt-vs-regular pairs in a borer year, run three times. Read the p-value each time.',
      why: 'Each p-value is the chance of a difference this big if the seeds truly yielded the same. Small p-values run after run mean the effect is real. A p-value does not measure how big or important the effect is; the confidence interval does that.',
      overlay(sim,ctx,LH,k,tau){const rec=s=>{s._gmP.push(M(s,'pv'));again(s);};atT(sim,tau,0.3,'g',s=>{s.st.seed=7;G(s).grow(s);});atT(sim,tau,4.3,'a',rec);atT(sim,tau,8.3,'b',rec);
        const ps=sim._gmP.concat(done(sim)?[M(sim,'pv')]:[]);card(ctx,k,[['p-values: '+(ps.length?ps.map(p=>p<0.001?'< 0.001':p.toFixed(3)).join(', '):'…'),{w:700}],['95% CI: '+M(sim,'ci'),{c:'#1b7a3a',w:700}]]);} }
  ],
  useIt: [
    { do: 'When an ad or headline says “studies show,” ask three questions: compared with what, how many times, and was anything else different?',
      why: 'Those are the control group, replication and confounding. A claim that can’t answer them is a guess, however confident it sounds.' },
    { do: 'Look for independent trials before you trust a product claim.',
      why: 'Land-grant universities such as Colorado State run their own crop variety trials across many farms and years and publish every result. One company plot in one good year proves little.' },
    { do: 'Expect a fix to work only on the problem it targets.', lvl: 'honors',
      why: 'Bt corn cut corn borer damage so much that borer numbers fell across whole regions of the Midwest, helping even farmers who planted regular corn. But it does nothing for drought, and borers that survive it can evolve resistance, which is why the EPA requires refuges of non-Bt corn.' }
  ],
  tryIt: [
    { title: 'the fair coin test (5 minutes)',
      steps: ['Flip a coin 4 times and count heads. Then flip it 40 times.', 'Pretend each flip is a test plot of a “miracle seed” and heads means it yielded more.', 'Compare the share of heads in 4 flips and in 40.'],
      look: 'Four flips often give 3 or 4 heads, which looks like a big effect from pure luck. Forty flips land much closer to half. That is why trials need many plots.' }
  ]
}
};
})());

})();
