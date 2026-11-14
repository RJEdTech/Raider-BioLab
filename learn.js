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
    { key: 'psis', title: 'Add sugar: Ψs = −iCRT', set: { conc: 0.3 }, fresh: true, speed: 0.5,
      see: 'The beaker now holds 0.30 M sugar (sucrose). The card on the left breaks the solution’s Ψ into the four numbers in Ψs = −iCRT, and the boxed solution card shows the same answer.',
      why: '<b>i</b> is how many particles each unit makes when it dissolves (sucrose stays whole, so 1). <b>C</b> is the concentration in mol/L. <b>R</b> is a constant, 0.0831. <b>T</b> is the temperature in kelvin. More dissolved particles make Ψs more negative.',
      overlay(sim,ctx,LH,k,tau){const T=sim.p.temp;wpBox(ctx,424,148,368,96,tau);const q=wpPanel(ctx,k);
        wpCard(ctx,k,[['Ψs = −iCRT',800,14],'i = 1  (sucrose stays whole)','C = '+sim.p.conc.toFixed(2)+' mol/L','R = 0.0831 L·bar/(mol·K)','T = '+T+' + 273 = '+(T+273)+' K',['Ψs = '+wpS(wpPsi(1,sim.p.conc,T))+' bar',800,14,'#1d6fd6']],q.x+8,q.y+8,352,q.h-16);} },
    { key: 'compare', title: 'Water flows from higher Ψ to lower Ψ', base: { conc: 0.3 }, set: { conc: 0.1 }, fresh: true, speed: 0.25,
      see: 'The number line at the bottom right puts the solution (blue) and the cell (green) on one Ψ scale, with 0 on the right. The arrow shows the way water moves. Watch the green dot slide right as water enters, until the two dots meet.',
      why: 'Water always moves from <b>higher Ψ to lower Ψ</b>, like a ball rolling downhill. 0.10 M sugar is −2.45 bar; the cell starts near −7.35 bar, lower, so water moves in. As the cell swells, its sap gets more dilute and its wall pushes harder, both of which raise its Ψ. Flow stops when the two are equal.',
      overlay(sim,ctx,LH,k){wpLadder(ctx,sim,k);} },
    { key: 'plasmo', title: 'Strong sugar water: plasmolysis', set: { conc: 0.6 }, fresh: true, speed: 0.6,
      see: 'The beaker holds 0.60 M sugar, Ψ = −14.7 bar, far below the cell. Water drops leave, and the cell’s green membrane pulls in from the olive wall. The microscope view on the right shows the same thing in real red onion skin cells: the purple sap shrinks away from each wall.',
      why: 'Now the solution has the lower Ψ, so water leaves the cell. The wall stops pushing (Ψp = 0), and the membrane pulls away from the wall. That is <b>plasmolysis</b>. The cell does not burst or collapse, because the wall keeps its shape.',
      so: 'You can see this in class: a drop of salt water on red onion skin under a microscope.',
      overlay(sim,ctx,LH,k){const q=wpPanel(ctx,k),R=Math.min(74,q.h/2-8);wpOnion(ctx,sim,k,q.x+12+R,q.y+q.h/2,R);
        wpSide(ctx,k,q,[['Red onion skin, ×100',700,13],'Real cells: about','0.3 mm long. The purple','is real pigment in the sap.',[sim.st.V<0.99?'Sap pulls away from walls.':'Sap fills each cell.',700,12.5,'#b3261e']]);} },
    { key: 'wilt', title: 'Why plants wilt', set: { conc: 0.4 }, fresh: true, speed: 0.6,
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
    { key: 'far', title: 'Twice as far, a quarter of the light', set: { dist: 30 }, fresh: true, speed: 1,
      see: 'The lamp slides back to 30 cm. Light at the plant drops from 44% to 11%, and the bubbles slow to fewer than half: about 8 a minute.',
      why: 'Light spreads out as it travels. At twice the distance the same light covers 4 times the area, so each leaf gets only a quarter. That is the <b>inverse-square</b> rule.',
      overlay(sim,ctx,LH,k){const b=phM(sim,'bubbles'),l=phM(sim,'light');const h=ceCard(ctx,k,20,62,330,[['Lamp 30 cm away (twice as far)',{s:14,w:800}],['Light at the plant: '+Math.round(l)+'% (was 44%)'],['Bubbles per minute: '+Math.round(b),{w:800,c:CE_GREEN}],['Same light, spread over 4× the area:',{s:12}]]);
        const y0=62+h+10,s=28;ctx.save();ctx.fillStyle='#ffd966';ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.fillRect(40,y0,s,s);ctx.strokeRect(40,y0,s,s);H.txt(ctx,'15 cm',54,y0+s+15,{s:11*k,a:'center'});
        ctx.globalAlpha=0.45;for(let i=0;i<2;i++)for(let j=0;j<2;j++){ctx.fillRect(140+i*s,y0+j*s,s,s);}ctx.globalAlpha=1;for(let i=0;i<2;i++)for(let j=0;j<2;j++)ctx.strokeRect(140+i*s,y0+j*s,s,s);H.txt(ctx,'30 cm: ¼ each',168,y0+2*s+15,{s:11*k,a:'center'});ctx.restore();} },
    { key: 'farthest', title: 'Too far: making = using', set: { dist: 60 }, fresh: true, speed: 1,
      see: 'At 60 cm the bubbles stop. The bars show the plant is still making oxygen, but its own cells use just as much.',
      why: 'Plant cells do cellular respiration all the time, day and night, and it uses oxygen. Bubbles only appear when photosynthesis makes <b>more</b> oxygen than respiration uses. Here the two balance, so nothing is left over.',
      overlay(sim,ctx,LH,k){const g=phM(sim,'gross'),r=phM(sim,'resp');const h=ceCard(ctx,k,20,62,380,[['Lamp 60 cm away',{s:14,w:800}],['O₂ made by photosynthesis vs. used by respiration',{s:12}]],{extra:52});ceBars(ctx,k,32,62+h-52*Math.min(k,1.3),356,[['Made',g,CE_GREEN,g.toFixed(1)],['Used',r,CE_RED,r.toFixed(1)]],30);} },
    { key: 'noco2', title: 'Bright light, no CO₂', set: { dist: 15, co2: 0 }, fresh: true, speed: 1,
      see: 'The lamp is back at 15 cm, as bright as the start, but there is no baking soda. The bubbles stop.',
      why: 'CO₂ is the other raw material. Without it the plant can’t build sugar, the energy from light backs up, and water stops being split. A plant needs light <b>and</b> CO₂; whichever runs short sets the limit.',
      overlay(sim,ctx,LH,k){const g=phM(sim,'gross'),r=phM(sim,'resp');const h=ceCard(ctx,k,20,62,380,[['15 cm, but no CO₂',{s:14,w:800}],['Light 44%, same as the start',{s:12}]],{extra:52});ceBars(ctx,k,32,62+h-52*Math.min(k,1.3),356,[['Made',g,CE_GREEN,g.toFixed(1)],['Used',r,CE_RED,r.toFixed(1)]],30);} },
    { key: 'hot', lvl: 'honors', title: 'Temperature: warm helps, hot hurts', set: { dist: 15, temp: 45 }, fresh: true, speed: 1,
      see: 'At 15 cm the water is heated to 45 °C. Photosynthesis falls, respiration climbs, and the bubbles stop.',
      why: 'Photosynthesis runs on enzymes. Warmth speeds them up to an optimum (about 35 °C in this model, with the most bubbles of all). Past it, enzymes such as rubisco lose their shape, while respiration keeps rising with heat.',
      overlay(sim,ctx,LH,k){const g=phM(sim,'gross'),r=phM(sim,'resp');const h=ceCard(ctx,k,20,62,380,[['45 °C water',{s:14,w:800}],['At 35 °C: made ≈ 38, used ≈ 8. At 45 °C:',{s:12}]],{extra:52});ceBars(ctx,k,32,62+h-52*Math.min(k,1.3),356,[['Made',g,CE_GREEN,g.toFixed(1)],['Used',r,CE_RED,r.toFixed(1)]],40);} },
    { key: 'green', lvl: 'honors', title: 'Light color: green works least', set: { dist: 15, filter: 'green' }, fresh: true, speed: 1,
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
    { key: 'dark', title: 'Turn off the light', set: { light: 0 }, speed: 0.8,
      see: 'Light goes to 0%. Water splitting stops, the O₂ count falls to 0, the H⁺ gradient drains, and the Calvin cycle slows as its ATP and NADPH run out.',
      why: 'No light means no excited electrons, so nothing refills ATP and NADPH. The Calvin cycle doesn’t use light itself, but it can’t run for long without what the light reactions make.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['Light 0%',{s:14,w:800}],['O₂ released: '+f1(phM(sim,'o2'))+'    H⁺ gradient: '+Math.round(phM(sim,'hg'))+'%',{w:800}],['Sugar made: '+f1(phM(sim,'g3p')),{w:800,c:CE_GREEN}]]);} },
    { key: 'noco2', title: 'Bright light, no CO₂', set: { co2: 0 }, fresh: true, speed: 3,
      see: 'The light is back at 80% but CO₂ is 0. Watch the ATP and NADPH bars fill to the top, and then the O₂ count falls toward 0, even in bright light.',
      why: 'With no CO₂ the Calvin cycle stops spending ATP and NADPH. Once they are full, the electrons have nowhere to go, so water splitting backs up and stops. That is the hook’s answer: no CO₂, no oxygen.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['Light 80%, CO₂ 0',{s:14,w:800}],['ATP '+Math.round(phM(sim,'atp'))+'%   NADPH '+Math.round(phM(sim,'nadph'))+'%   (filling up)',{w:800}],['O₂ released: '+f1(phM(sim,'o2'))+'   (normal CO₂: about 16)',{w:800,c:CE_RED}]]);} },
    { key: 'green', lvl: 'honors', title: 'Green light', set: { color: 'green' }, fresh: true, speed: 0.8,
      see: 'Same 80% light, but green. O₂ released drops to well under half of white light’s 16.',
      why: 'Chlorophyll absorbs red and blue light best and green the least, so fewer electrons get excited.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['Green light',{s:14,w:800}],['O₂ released: '+f1(phM(sim,'o2'))+'   (white: about 16)',{w:800,c:CE_GREEN}]]);} },
    { key: 'hot', lvl: 'honors', title: '45 °C: rubisco slows', set: { temp: 45 }, fresh: true, speed: 0.8,
      see: 'At 45 °C the CO₂ fixed by rubisco drops to a small fraction of normal, and the ATP and NADPH bars back up.',
      why: 'Rubisco is an enzyme, and past its optimum it loses shape and slows. The light reactions keep charging carriers the Calvin cycle can’t spend.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['45 °C',{s:14,w:800}],['CO₂ fixed: '+f1(phM(sim,'fix'))+'   (25 °C: about 49)',{w:800,c:CE_RED}],['ATP '+Math.round(phM(sim,'atp'))+'%   NADPH '+Math.round(phM(sim,'nadph'))+'%',{w:800}]]);} },
    { key: 'dcmu', lvl: 'ap', title: 'DCMU blocks photosystem II', set: { dcmu: true }, fresh: true, speed: 0.8,
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
    { key: 'noo2', title: 'No oxygen: only 2 ATP', set: { o2: false }, fresh: true, speed: 0.4, focus: [30,240,330,190],
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
    { key: 'fuel', title: 'More fuel: more ATP and more oxygen', set: { fuel: 100 }, fresh: true, speed: 0.4,
      see: 'Fuel goes from 80% to 100%. ATP made rises to about 19 per second, and O₂ used rises to about 3.9. At 40% fuel they were about 11 and 2.3.',
      why: 'More fuel sends more electrons down the chain, and every electron needs oxygen at the end. ATP and O₂ rise together, about 1.7 times from 40% to 100%. That is why you breathe hard on the stairs.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['Fuel 100%   (at 40%: ATP ≈ 11, O₂ ≈ 2.3)',{s:13,w:800}],['ATP '+f1(phM(sim,'atp'))+' per s     O₂ used '+f1(phM(sim,'o2use'))+' per s',{w:800,c:CE_GREEN}]]);} },
    { key: 'noo2', title: 'No oxygen: the chain stops', set: { o2: 0 }, fresh: true, speed: 0.4,
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
  {id:'o2from',kind:'test',lvl:'bio',q:'The bubbles from Elodea are mostly oxygen. Where does that oxygen come from?',choices:['From the baking soda','From the CO₂ the plant takes in','From water molecules split using light energy','From the lamp'],correct:2,
    steps:['Chlorophyll absorbs light, and the energy is used to split water.','Splitting water releases O₂, H⁺ and electrons.','The CO₂’s carbon and oxygen end up in the sugar, not in the bubbles.']},
  {id:'quarter',kind:'test',lvl:'bio',q:'The lamp moves from 15 cm to 30 cm away. Why do the bubbles drop by more than half?',choices:['Light spreads over 4 times the area at twice the distance, so the plant gets only a quarter of the light','The lamp gets dimmer when moved','The water cools down','The plant runs out of CO₂'],correct:0,
    steps:['Light from a small lamp spreads out in every direction.','At twice the distance it covers 2 × 2 = 4 times the area.','So each leaf gets ¼ of the light: 44% falls to 11%, and the bubble rate falls more than half.']},
  {id:'stops',kind:'test',lvl:'bio',q:'At 60 cm the bubbles stop. Has the plant stopped photosynthesizing?',choices:['Yes, there is no light at all','Yes, Elodea only photosynthesizes up close','No: it is making carbon dioxide bubbles instead','No: it still makes some oxygen, but its own respiration uses all of it'],correct:3,
    steps:['Plant cells respire all the time, and respiration uses oxygen.','Bubbles only appear when photosynthesis makes more O₂ than respiration uses.','At 60 cm the two balance (made ≈ used), so no extra oxygen escapes.']},
  {id:'co2need',kind:'test',lvl:'bio',q:'Bright light but no baking soda: why do the bubbles stop?',choices:['Baking soda is food for the plant','Without CO₂ the plant can’t build sugar, so the light reactions back up and water splitting stops','The water becomes too acidic','Baking soda makes the bubbles'],correct:1,
    steps:['Baking soda releases CO₂ into the water.','CO₂ is a raw material for sugar. Without it, the energy carriers made by light have nowhere to go.','Water splitting backs up, so oxygen release stops: CO₂ is now the limiting factor.']},
  {id:'growlight',kind:'real',lvl:'bio',q:'Why do indoor growers hang lights just a few inches above seedlings?',choices:['Light falls off fast with distance, so close lights give the leaves far more light','To keep the seedlings warm','Light far away is the wrong color','Close lights use less electricity'],correct:0,
    steps:['Twice the distance gives about a quarter of the light.','A light hung across the room gives leaves only a small fraction of what it gives up close.','Seedlings short on light grow tall and weak looking for more.']},
  {id:'pondnight',kind:'real',lvl:'bio',q:'Why do fish in a pond sometimes die just before dawn after cloudy summer days?',choices:['Fish get cold at night','Sunlight is poisonous to fish','All night, plants and algae use oxygen for respiration but make none without light, so oxygen hits its lowest point near dawn','Algae release CO₂ only during the day'],correct:2,
    steps:['In the dark there is no photosynthesis, only respiration.','Algae, plants and fish all use oxygen through the night.','After cloudy days there was little oxygen to start with, so it can run out before the sun returns.']},
  {id:'greenleaf',kind:'test',lvl:'honors',q:'Under green light the plant makes much less oxygen than under white light of the same strength. Why?',choices:['Green light is weaker','Chlorophyll absorbs red and blue light best and green the least','Green light heats the water','Plants only use white light'],correct:1,
    steps:['Only absorbed light can drive photosynthesis.','Chlorophyll absorbs blue and red well and green poorly.','The green it doesn’t absorb is reflected or passes through, which is why leaves look green.']},
  {id:'hot45',kind:'test',lvl:'honors',q:'At 45 °C the bubbles stop, even though warmer water helped at 35 °C. Why?',choices:['Hot water has no CO₂ at all','The plant melts','Light can’t travel through hot water','Photosynthesis enzymes such as rubisco lose their shape past their optimum, while respiration keeps rising'],correct:3,
    steps:['Warmth speeds up enzymes, up to an optimum.','Past it, enzymes start to unfold and slow down.','Respiration keeps climbing with heat, so it overtakes photosynthesis and net oxygen goes negative.']},
  {id:'netcalc',kind:'test',lvl:'ap',q:'At 30 cm, gross O₂ production is 11.9 and respiration is 4.0 (same units). What is net production, and what does it mean if it were negative?',choices:['15.9; the plant is growing fast','2.98; net is gross divided by respiration','7.9; if negative, the plant is using more O₂ than it makes, below the light compensation point','−7.9; net always subtracts gross'],correct:2,
    steps:['Net = gross − respiration = 11.9 − 4.0 = 7.9.','Net is the oxygen (or sugar) left over for growth or release.','Negative net means respiration exceeds photosynthesis: the plant is below its light compensation point and losing stored sugar.']}
]},
chloroplast:{questions:[
  {id:'waterO2',kind:'test',lvl:'bio',q:'Why does a plant release oxygen when light hits photosystem II?',choices:['Photosystem II splits water to replace the electrons light knocked loose, and O₂ is left over','Light breaks CO₂ apart','Chlorophyll is made of oxygen','The Calvin cycle releases O₂'],correct:0,
    steps:['Light excites electrons in chlorophyll, and they leave PSII.','PSII replaces them by splitting water: 2 H₂O → O₂ + 4 H⁺ + 4 e⁻.','The O₂ is a by-product, and it is the oxygen you breathe.']},
  {id:'darkcalvin',kind:'test',lvl:'bio',q:'The Calvin cycle doesn’t use light. Why does it stop soon after the light goes off?',choices:['It needs light to stay warm','CO₂ disappears in the dark','Rubisco is destroyed by darkness','It runs on ATP and NADPH, which only the light reactions make'],correct:3,
    steps:['The Calvin cycle spends ATP and NADPH to turn CO₂ into sugar.','Only the light-powered half of photosynthesis refills them.','When the light goes off, the supplies run down and the cycle slows to a stop.']},
  {id:'noco2o2',kind:'test',lvl:'bio',q:'With bright light but no CO₂, why does oxygen release fall to almost zero?',choices:['Oxygen comes from CO₂','The Calvin cycle stops using ATP and NADPH; once they are full, electrons back up and water splitting stops','The leaf closes its chloroplasts','Light can’t reach the leaf without CO₂'],correct:1,
    steps:['No CO₂ means the Calvin cycle stops.','ATP and NADPH fill up because nothing spends them.','The electron chain has nowhere to send electrons, so PSII stops splitting water and O₂ release stops.']},
  {id:'stomata',kind:'real',lvl:'bio',q:'On hot, dry afternoons, grass grows more slowly even in full sun. Why?',choices:['To save water, leaves close their pores, which also blocks CO₂ from getting in','The sun is too bright','Grass only grows at night','Heat breaks down chlorophyll instantly'],correct:0,
    steps:['Leaf pores (stomata) let CO₂ in and water vapor out.','When water is short, plants close them to avoid drying out.','Less CO₂ gets in, so the Calvin cycle slows and so does growth.']},
  {id:'herbicide',kind:'real',lvl:'bio',q:'Some weed killers block photosystem II. Why does that kill a plant?',choices:['It poisons the soil','With PSII blocked, no electrons flow, so no ATP and NADPH are made and the plant can’t make sugar','It makes the leaves too heavy','It stops the plant from taking in water'],correct:1,
    steps:['PSII is the start of the electron chain.','Blocked PSII means no water splitting, no H⁺ gradient and no NADPH.','Without ATP and NADPH the Calvin cycle stops, and the plant starves.']},
  {id:'synthase',kind:'test',lvl:'honors',q:'Why does H⁺ build up in the thylakoid space, and how does that make ATP?',choices:['H⁺ is made there by the Calvin cycle','ATP synthase pumps H⁺ in','Electron flow pumps H⁺ in; the H⁺ can only flow back out through ATP synthase, which uses that flow to make ATP','H⁺ is attracted to chlorophyll'],correct:2,
    steps:['Water splitting and the b6f pump add H⁺ to the thylakoid space.','The membrane blocks H⁺ except at ATP synthase.','H⁺ rushing out turns ATP synthase, which joins phosphate to ADP.']},
  {id:'g3pcost',kind:'test',lvl:'ap',q:'Making one G3P fixes 3 CO₂. How much ATP and NADPH does it use?',choices:['3 ATP and 3 NADPH','6 ATP and 9 NADPH','18 ATP and 12 NADPH','9 ATP and 6 NADPH'],correct:3,
    steps:['Each CO₂ fixed costs 3 ATP and 2 NADPH across the cycle.','3 CO₂ × 3 ATP = 9 ATP; 3 CO₂ × 2 NADPH = 6 NADPH.','That 1.5 : 1 ratio is more ATP than linear electron flow alone provides.']}
]},
glycolysis:{questions:[
  {id:'carbons',kind:'test',lvl:'bio',q:'With oxygen, where do all 6 carbon atoms of a glucose end up?',choices:['In ATP','As CO₂ that you breathe out','As water','They stay in the mitochondrion'],correct:1,
    steps:['2 carbons leave as CO₂ when pyruvate enters the mitochondrion.','The other 4 leave as CO₂ in the Krebs cycle.','You breathe that CO₂ out, which is where most of the mass of burned food goes.']},
  {id:'o2why',kind:'test',lvl:'bio',q:'Why does a cell get about 32 ATP per glucose with oxygen but only 2 without it?',choices:['Oxygen catches electrons at the end of the electron transport chain; without it the chain and the Krebs cycle stop, leaving only glycolysis','Oxygen is a source of energy itself','Glucose can’t enter cells without oxygen','Without oxygen the cell makes ATP more slowly but the same amount'],correct:0,
    steps:['Most ATP (about 28) comes from electron transport, which needs O₂ to accept electrons.','No O₂ means no electron transport, and the Krebs cycle stalls too.','Only glycolysis is left: 2 ATP per glucose.']},
  {id:'invest',kind:'test',lvl:'bio',q:'Glycolysis spends 2 ATP before it makes any. Why is that worth it?',choices:['It isn’t; the cell loses 2 ATP','The ATP is stored for later','Glucose needs ATP to enter the mitochondrion','The phosphates make glucose unstable enough to split, and the payoff is 4 ATP, a net gain of 2'],correct:3,
    steps:['Adding 2 phosphates destabilizes the glucose.','It splits, and its halves release energy to make 4 ATP.','4 − 2 = net 2 ATP from glycolysis.']},
  {id:'bread',kind:'real',lvl:'bio',q:'Why does bread dough rise?',choices:['The flour expands when wet','Kneading pumps air in','Yeast ferments sugar into CO₂ and alcohol, and the CO₂ gets trapped as bubbles','Salt reacts with water'],correct:2,
    steps:['Yeast in dough has little oxygen, so it ferments.','Fermentation in yeast turns pyruvate into ethanol and CO₂.','The CO₂ bubbles get trapped in the dough; the alcohol bakes off.']},
  {id:'weight',kind:'real',lvl:'bio',q:'When you lose weight, where does most of the lost mass go?',choices:['Out through your lungs as CO₂','Out as sweat','It turns into heat','Into your muscles'],correct:0,
    steps:['Burning fat and sugar breaks their carbon chains apart.','Those carbons leave as CO₂, as you saw in the Krebs cycle.','You breathe the CO₂ out, so most of the lost mass leaves through your lungs.']},
  {id:'nadplus',kind:'test',lvl:'honors',q:'Fermentation makes no ATP. Why do cells do it?',choices:['To make CO₂','To make more glucose','It turns NADH back into NAD⁺, which glycolysis needs to keep making its 2 ATP','It cools the cell'],correct:2,
    steps:['Glycolysis needs NAD⁺ to accept electrons.','Without oxygen, NADH can’t unload at the electron transport chain.','Fermentation unloads NADH onto pyruvate (making lactate or ethanol), freeing NAD⁺ so glycolysis can continue.']},
  {id:'lactose',kind:'test',lvl:'honors',q:'In the balloon lab, yeast fills balloons with glucose and sucrose but not lactose. Why?',choices:['Lactose is too sweet','Yeast lacks the enzyme to split lactose into sugars it can use','Lactose is not a sugar','Lactose kills yeast'],correct:1,
    steps:['Yeast can ferment glucose directly.','It has an enzyme (invertase) that splits sucrose into glucose and fructose.','It has no lactase, so lactose stays unused and the balloon stays flat.']},
  {id:'substrate',kind:'test',lvl:'ap',q:'How many of the ~32 ATP per glucose come from substrate-level phosphorylation?',choices:['2','28','32','4'],correct:3,
    steps:['Substrate-level: an enzyme transfers phosphate directly to ADP.','Glycolysis gives 2 net this way and the Krebs cycle gives 2.','The other ~28 come from oxidative phosphorylation via ATP synthase.']}
]},
resp:{questions:[
  {id:'whybreathe',kind:'test',lvl:'bio',q:'What does the oxygen you breathe actually do inside your cells?',choices:['It catches electrons at the end of the electron transport chain and becomes water','It burns glucose directly','It becomes the CO₂ you breathe out','It is stored in ATP'],correct:0,
    steps:['Electrons from food pass down the chain, powering H⁺ pumps.','At complex IV, O₂ accepts them and joins H⁺ to form water.','Without O₂ the electrons have nowhere to go and the chain stops.']},
  {id:'pumpstore',kind:'test',lvl:'bio',q:'Why do the proteins pump H⁺ across the membrane instead of making ATP directly?',choices:['They can’t do anything else','H⁺ is waste to get rid of','To make the matrix acidic','The H⁺ gradient stores energy, and ATP synthase uses H⁺ flowing back to make ATP'],correct:3,
    steps:['Each electron hop releases a small amount of energy.','The pumps store it by piling H⁺ above the membrane, like water behind a dam.','ATP synthase lets the H⁺ flow back and uses that flow to make ATP.']},
  {id:'stairs',kind:'test',lvl:'bio',q:'Raising the fuel from 40% to 100% raises both ATP made and O₂ used. Why do they rise together?',choices:['They don’t depend on each other','Oxygen is made from ATP','Every electron sent down the chain needs oxygen at the end, so more electrons (more ATP) means more oxygen','More fuel makes oxygen'],correct:2,
    steps:['More fuel means more NADH delivering electrons.','More electrons pump more H⁺, so more ATP is made.','Each electron must be caught by O₂, so oxygen use rises in step: about 1.7 times for both.']},
  {id:'cogas',kind:'real',lvl:'bio',q:'Why is carbon monoxide dangerous even though you keep breathing normally?',choices:['It smells bad','It keeps oxygen from being delivered and used, so the chain stops as if there were no oxygen','It makes too much ATP','It only affects the lungs'],correct:1,
    steps:['CO binds hemoglobin far more tightly than O₂, so less oxygen reaches cells.','It can also block complex IV.','Either way electrons can’t be passed to oxygen, ATP production falls, and the brain and heart suffer first.']},
  {id:'altitude',kind:'real',lvl:'bio',q:'Why do you breathe faster on top of a fourteener?',choices:['Cold air makes you breathe faster','Each breath holds less oxygen, so you breathe more to supply complex IV','Mountain air has more CO₂','Climbing uses no ATP'],correct:1,
    steps:['Air pressure is lower up high, so each breath brings in less O₂.','Your mitochondria still need the same oxygen to keep the chain running.','Breathing faster and deeper makes up part of the difference.']},
  {id:'fadh2',kind:'test',lvl:'honors',q:'Why does FADH₂ make less ATP than NADH?',choices:['Its electrons enter at complex II, skipping complex I, so fewer H⁺ are pumped','FADH₂ has no electrons','FADH₂ blocks ATP synthase','It needs more oxygen'],correct:0,
    steps:['NADH gives its electrons to complex I, which pumps H⁺.','FADH₂ gives them to complex II, which doesn’t pump.','Fewer H⁺ pumped means less flow through ATP synthase, about 1.5 ATP instead of 2.5.']},
  {id:'cyanide',kind:'test',lvl:'ap',q:'Cyanide blocks complex IV. What happens to the H⁺ gradient and to O₂ use?',choices:['Both rise','The gradient rises, O₂ use falls','Both fall to near zero: electrons can’t reach O₂, so pumping stops and the gradient drains','Nothing changes because complexes I and III still pump'],correct:2,
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

})();
