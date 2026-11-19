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
/* ---------- Think again: shared visual moves (from PhysLab, Nov 17 2026) ----------
   A magenta badge marks a thinking moment; a dashed magenta ghost or ring is a prediction
   or a comparison drawn beside what really happens. Magenta, because the series colors already use purple. */
function TK(){const c=(PAL['cv-bg']||'#fff').replace('#','');if(c.length>=6){const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);if((r*0.3+g*0.59+b*0.11)<110)return '#ec74da';}return '#a8178f';}
function TKA(a){return TK()==='#a8178f'?'rgba(168,23,143,'+a+')':'rgba(236,116,218,'+a+')';}
function thinkBadge(ctx,kind,label,k,tau,pos){k=Math.min(k,1.3);const sz=12.5*k;ctx.save();ctx.font='700 '+sz+'px '+H.FONT;const tw=ctx.measureText(label).width,ic=22*k,w=tw+ic+sz*1.6,h=sz*2.2;let x=pos&&pos.x!=null?pos.x:20,y=pos&&pos.y!=null?pos.y:18;if(pos&&pos.right)x=pos.right-w;
  H.rr(ctx,x,y,w,h,h/2);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=TK();ctx.stroke();
  const cx=x+sz*0.7+ic/2,cy=y+h/2;ctx.strokeStyle=TK();ctx.fillStyle=TK();ctx.lineWidth=1.8;
  if(kind==='compare'){[-5,5].forEach(d=>{ctx.strokeRect(cx+d*k-2.5*k,cy-7*k,5*k,13*k);});ctx.beginPath();ctx.moveTo(cx-2*k,cy-1*k);ctx.lineTo(cx+2*k,cy-1*k);ctx.moveTo(cx-2*k,cy+2*k);ctx.lineTo(cx+2*k,cy+2*k);ctx.stroke();}
  else if(kind==='spread'){ctx.globalAlpha=0.3;ctx.fillRect(cx-9*k,cy-3*k,18*k,6*k);ctx.globalAlpha=1;[-7,-2,1,6].forEach((d,i)=>{ctx.beginPath();ctx.arc(cx+d*k,cy+(i%2?-2:2)*k,2*k,0,6.29);ctx.fill();});}
  else{ctx.beginPath();ctx.arc(cx-2*k,cy-2*k,5.5*k,0,6.29);ctx.stroke();ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(cx+2*k,cy+2*k);ctx.lineTo(cx+7*k,cy+7*k);ctx.stroke();}
  H.txt(ctx,label,x+sz*0.7+ic+sz*0.4,cy+1,{s:sz,w:700,c:TK(),b:'middle'});ctx.restore();}
/* Commit first: guess buttons in the step text. Real buttons, so keyboards work. The pick is kept in sim._picks[key]. */
function pickHTML(key,q,choices){return '<span class="think-pick" data-pick="'+key+'" role="group" aria-label="Your guess" style="display:block;margin-top:8px"><b style="color:'+TK()+'">'+q+'</b><br>'+choices.map(([v,l])=>'<button type="button" class="btn" data-pv="'+v+'" aria-pressed="false" style="border:2px solid '+TK()+';color:'+TK()+';background:transparent;margin:6px 8px 0 0">'+l+'</button>').join('')+'</span>';}
function pickSync(sim){const b0=sim.ui&&sim.ui.tourbar;if(!b0)return;b0.querySelectorAll('[data-pick]').forEach(g=>{const v=(sim._picks||{})[g.dataset.pick];g.querySelectorAll('[data-pv]').forEach(b=>{const on=b.dataset.pv===v;b.setAttribute('aria-pressed',String(on));b.style.background=on?TK():'transparent';b.style.color=on?'#fff':TK();});});}
function pickWire(sim){if(!sim._pickWired&&sim.ui&&sim.ui.tourbar){sim._pickWired=true;sim.ui.tourbar.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-pv]');if(!b)return;const g=b.closest('[data-pick]');sim._picks=sim._picks||{};sim._picks[g.dataset.pick]=b.dataset.pv;pickSync(sim);});}setTimeout(()=>pickSync(sim),0);}
const pickOf=(sim,key)=>(sim._picks||{})[key];
function ringRect(ctx,x,y,w,h){ctx.save();ctx.setLineDash([5,4]);ctx.lineWidth=2.4;ctx.strokeStyle=TK();ctx.fillStyle=TKA(.08);H.rr(ctx,x,y,w,h,8);ctx.fill();ctx.stroke();ctx.restore();}
const art=sim=>sim.def.art;
function hits10(sim){const v=sim.vis,t=sim.vt;return (v.hitT||[]).filter(x=>x>t-10).length;}

/* ---------- Enzymes: helpers for the Nov 18 rework (from Wayne Lilyestrom's Honors Bio feedback:
   "helpful but confusing", "a little overwhelming"). Shorter text; a live rate bar on the picture;
   activation energy, temperature and pH shown as graphs drawn from the model's own formulas. ---------- */
const ezFF=(T,Tm,w)=>1/(1+Math.exp((T-Tm)/w));
const ezTraw=(T,Tref,Tm,w)=>Math.pow(2,(T-Tref)/10)*ezFF(T,Tm,w);
const ezAmyT=T=>ezTraw(T,37,44,2.5)/1.0243;   /* amylase, % of its top speed (model peak: 40 °C) */
const ezTaqT=T=>ezTraw(T,72,80,3)/1.0442;     /* Taq polymerase from hot-spring bacteria (model peak: 76 °C) */
const ezPH=(ph,opt)=>Math.exp(-Math.pow((ph-opt)/1.6,2));
function ezRef(sim){return sim.lnRate37||61.7;}
/* The live rate bar: the model's reaction rate, with a tick at the normal rate (37 °C, pH 7, 10 mM). */
function ezMeter(ctx,sim,k,o){o=o||{};const kk=Math.min(k,1.25),x=o.x!=null?o.x:468,y=o.y!=null?o.y:40,w=o.w||316,h=58*kk,v=Math.max(0,(sim.st&&sim.st.v)||0),ref=ezRef(sim),MX=110;
  ctx.save();H.rr(ctx,x,y,w,h,9);ctx.fillStyle=PAL['cv-sol'];ctx.globalAlpha=0.96;ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=2;ctx.strokeStyle='#c8102e';ctx.stroke();
  H.txt(ctx,'Reaction rate',x+10,y+15*kk,{s:13.5*kk,w:700,b:'middle'});
  H.txt(ctx,v.toFixed(1)+' µmol/min',x+w-10,y+15*kk,{s:13.5*kk,w:700,a:'right',b:'middle',c:'#c8102e'});
  const bx=x+10,bw=w-20,by=y+27*kk,bh=11*kk;H.rr(ctx,bx,by,bw,bh,bh/2);ctx.fillStyle=PAL['line']||'#ddd';ctx.fill();
  const f=clamp(v/MX,0,1);if(f>0.004){H.rr(ctx,bx,by,Math.max(bh,bw*f),bh,bh/2);ctx.fillStyle='#c8102e';ctx.fill();}
  const rx=bx+bw*clamp(ref/MX,0,1);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(rx,by-4);ctx.lineTo(rx,by+bh+4);ctx.stroke();
  H.txt(ctx,o.refLabel||'▲ normal: 37 °C, pH 7',clamp(rx,bx+70*kk,bx+bw-70*kk),by+bh+10*kk,{s:11.5*kk,w:600,a:'center',b:'middle',c:PAL['cv-soft']});
  ctx.restore();}
/* Graph axes on the canvas. */
function ezAxes(ctx,B,k,o){const kk=Math.min(k,1.25);ctx.save();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(B.x0,B.y0-8);ctx.lineTo(B.x0,B.y1);ctx.lineTo(B.x1+8,B.y1);ctx.stroke();
  (o.xt||[]).forEach(([v,l])=>{const X=B.x0+(v-o.xr[0])/(o.xr[1]-o.xr[0])*(B.x1-B.x0);ctx.beginPath();ctx.moveTo(X,B.y1);ctx.lineTo(X,B.y1+5);ctx.stroke();H.txt(ctx,l,X,B.y1+16*kk,{s:12*kk,a:'center',b:'middle',c:PAL['cv-soft']});});
  (o.yt||[]).forEach(([v,l])=>{const Y=B.y1-v*(B.y1-B.y0);ctx.beginPath();ctx.moveTo(B.x0-5,Y);ctx.lineTo(B.x0,Y);ctx.stroke();H.txt(ctx,l,B.x0-9,Y,{s:12*kk,a:'right',b:'middle',c:PAL['cv-soft']});});
  H.txt(ctx,o.xl,(B.x0+B.x1)/2,B.y1+36*kk,{s:13*kk,w:700,a:'center',b:'middle'});
  ctx.translate(B.x0-(o.ylOff||46)*kk,(B.y0+B.y1)/2);ctx.rotate(-Math.PI/2);H.txt(ctx,o.yl,0,0,{s:13*kk,w:700,a:'center',b:'middle'});ctx.restore();}
function ezCurve(ctx,B,xr,fn,to,col,dash,lw){ctx.save();ctx.strokeStyle=col;ctx.lineWidth=lw||3.5;ctx.lineJoin='round';if(dash)ctx.setLineDash(dash);ctx.beginPath();let first=true;
  for(let v=xr[0];v<=to+1e-9;v+=(xr[1]-xr[0])/200){const X=B.x0+(v-xr[0])/(xr[1]-xr[0])*(B.x1-B.x0),Y=B.y1-clamp(fn(v),0,1.05)*(B.y1-B.y0);first?ctx.moveTo(X,Y):ctx.lineTo(X,Y);first=false;}ctx.stroke();ctx.restore();}
/* tag anchored by its left or right edge, so labels never run off the canvas */
function ezTagA(ctx,s,x,y,k,o,side){o=o||{};const sz=(o.s||15)*k;ctx.save();ctx.font=(o.w||600)+' '+sz+'px '+H.FONT;const w=ctx.measureText(s).width+sz*1.1;ctx.restore();return tag(ctx,s,side==='r'?x-w/2:x+w/2,y,k,o);}
function ezDot(ctx,x,y,col,r){ctx.save();ctx.beginPath();ctx.arc(x,y,r||7,0,6.29);ctx.fillStyle=col;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=PAL['cv-sol'];ctx.stroke();ctx.restore();}

BioLab.addLearn({
enz: {
  simple: true,
  intro: { bio: 'You’ll see what an enzyme does, and what speeds it up, slows it down or breaks it.',
           honors: 'You’ll see what an enzyme does, what speeds it up, slows it down or breaks it, and how a blocker can slow it.' },
  goals: {
    bio: ['What an enzyme is, and how it speeds up a reaction', 'What temperature and pH do to an enzyme, and how to read those graphs', 'How to use this in your kitchen and laundry room'],
    honors: ['What an enzyme is, and how it lowers activation energy', 'What temperature and pH do to an enzyme, and how to read those graphs', 'How a competitive inhibitor slows an enzyme, and how more substrate wins it back'],
    ap: ['What an enzyme is, and how it lowers activation energy', 'What temperature and pH do to an enzyme, and how to read those graphs', 'How competitive and noncompetitive inhibitors differ, and what each does to Km and Vmax']
  },
  matters: 'Enzymes digest your food and run almost every reaction in your body. They are the reason the fridge, the stove and a squeeze of lemon work.',
  question: 'Your saliva starts digesting a cracker at body temperature, 37 °C. What happens to that enzyme in an ice-cold drink (10 °C), in food heated to 70 °C, and in stomach acid (pH 2)?',
  startKey: 'cast', startRun: true, startSpeed: 0.25,
  /* Labels only on things standing clear of the enzymes, so each label points at one obvious thing. */
  /* Labels sit in the clear band between the two rows of enzymes, with a leader to the nearest matching molecule. */
  startOverlay(sim,ctx,LH,k){const v=sim.vis,P=art(sim).pos,far=(a,d)=>P.every(q=>Math.hypot(a.x-q[0],a.y-q[1])>d);
    line(ctx,P[1][0],P[1][1]-36,P[1][0],P[1][1]-50);tag(ctx,'Enzyme (amylase)',P[1][0],P[1][1]-64,k);
    const near=(arr,tx,ty,ok)=>{let b=null,bd=170;(arr||[]).forEach(a=>{if(!ok(a))return;const d=Math.hypot(a.x-tx,a.y-ty);if(d<bd){bd=d;b=a;}});return b;};
    const ST=[560,242],PR=[120,242];
    const sb=near(v.subs,ST[0],ST[1],a=>far(a,48)&&a.y>60&&a.y<420);if(sb)line(ctx,ST[0]+(sb.x<ST[0]?-40:40),ST[1]+(sb.y<ST[1]?-10:10),sb.x,sb.y);
    tag(ctx,'Starch (substrate)',ST[0],ST[1],k,{c:PAL['cv-sub']});
    const pr=near(v.prods,PR[0],PR[1],a=>a.life>1&&far(a,44)&&a.y>60&&a.y<420);if(pr)line(ctx,PR[0]+(pr.x<PR[0]?-30:30),PR[1]+(pr.y<PR[1]?-10:10),pr.x,pr.y);
    tag(ctx,'Sugar (product)',PR[0],PR[1],k,{c:PAL['cv-prod']});},
  steps: [
    { key: 'fold', title: 'What an enzyme is', speed: 0.25,
      see: 'One long chain of amino acids folds into one exact shape.',
      why: 'The fold leaves a groove: the <b>active site</b>. Each green blob from here on is one enzyme, amylase. (Green is just a label. Molecules have no color.)',
      overlay(sim,ctx,LH,k,tau){dim(ctx,LH);const p=tau%11,u=p<0.8?1:p<4.3?1-ease((p-0.8)/3.5):0,cx=280,cy=230,R=118;
        art(sim).protein(ctx,cx,cy,R,0,0.5,2,u,sim.vt,{beads:true,outline:true});scaleBar(ctx,40,430,R*2/5,'1 nm',k);
        if(u>0.35)tag(ctx,'One long chain of amino acids',400,48,k);
        else if(u>0.02)tag(ctx,'Folding…',400,48,k);
        else{tag(ctx,'Folded into one exact shape',cx,402,k);line(ctx,cx+R*0.95+18,cy,cx+R*0.62,cy);tag(ctx,'Active site: the groove',cx+R+130,cy,k,{hi:true});}} },
    { key: 'fit', title: 'Lock and key: one job each', speed: 0.25,
      see: 'A fat molecule bumps the groove and bounces off. Starch, the <b>substrate</b>, slides right in.',
      why: 'Only the right shape fits, so each enzyme does one job. Amylase breaks down starch, not fat.',
      overlay(sim,ctx,LH,k,tau){dim(ctx,LH);const p=tau%10,cx=270,cy=235,R=118,mouth=cx+R*0.98;
        art(sim).protein(ctx,cx,cy,R,0,0.5,2,0,sim.vt,{outline:true});scaleBar(ctx,40,430,R*2/5,'1 nm',k);
        tag(ctx,'Only the right shape fits',400,40,k);
        if(p<4.2){let x,y;if(p<2){const f=ease(p/2);x=lerp(700,mouth+4,f);y=lerp(110,cy-6,f);}else{const f=ease((p-2)/1.6);x=lerp(mouth+4,640,f);y=lerp(cy-6,120,f);}
          fat(ctx,x,y,R,p<2?0:0.25*(p-2));
          if(p>1.9)tag(ctx,'✗  Fat: wrong shape, no fit',590,330,k,{c:'#b3261e'});}
        else{const f=ease((p-4.4)/2.4),seat=cx+R*0.44;art(sim).starch(ctx,lerp(790,seat,f),cy,3,11,0,PAL['cv-sub']);
          if(f>=1)tag(ctx,'✓  Starch fits the groove',600,300,k,{c:'#1b7a3a',hi:true});}} },
    { key: 'cut', title: 'The cut: substrate in, products out', speed: 0.25,
      see: 'Starch slides in, one bond snaps, and two small sugars, the <b>products</b>, float away.',
      why: 'The enzyme comes out unchanged and grabs the next starch. It is not used up.',
      so: 'That is why a cracker tastes sweet if you chew it long enough.',
      overlay(sim,ctx,LH,k,tau){dim(ctx,LH);const p=tau%9,cx=200,cy=225,R=112,A=art(sim),r=11,x0=cx+R*0.40;
        const ph=p<1.8?0:p<3.2?1:p<5?2:3;let a=0.5;if(ph===1)a=0.5-0.1*ease((p-1.8)/0.6);else if(ph===2)a=0.4+0.1*ease((p-3.2)/0.8);
        A.protein(ctx,cx,cy,R,0,a,2,0,sim.vt,{outline:true});scaleBar(ctx,40,430,R*2/5,'1 nm',k);
        if(ph===0){A.starch(ctx,lerp(760,x0,ease(p/1.8)),cy,4,r,0,PAL['cv-sub']);}
        else if(ph===1){A.starch(ctx,x0,cy,4,r,0,PAL['cv-sub']);const bx=x0+r*2.2*1.5;ctx.save();ctx.strokeStyle='#f0aa14';ctx.lineWidth=3;ctx.beginPath();for(let j=0;j<=6;j++){const yy=cy-16+j*5.3,xx=bx+(j%2?5:-5)*(0.5+0.5*Math.sin(tau*18));j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();ctx.restore();}
        else if(ph===2){const f=ease((p-3.2)/1.8);A.starch(ctx,lerp(x0,470,f),lerp(cy,120,f),2,r,lerp(0,-0.4,f),PAL['cv-prod']);A.starch(ctx,lerp(x0+r*4.4,500,f),lerp(cy,330,f),2,r,lerp(0,0.4,f),PAL['cv-prod']);}
        else{A.starch(ctx,470,120,2,r,-0.4,PAL['cv-prod']);A.starch(ctx,500,330,2,r,0.4,PAL['cv-prod']);}
        ['1  Starch slides in','2  The bond strains','3  It snaps in two','4  Enzyme unchanged'].forEach((s,i)=>tag(ctx,s,650,120+i*58,k,{s:14,hi:i===ph,alpha:i===ph?1:0.55}));} },
    { key: 'ea', title: 'Why it is faster: a lower hill', speed: 0.25,
      see: 'A reaction must first climb an energy hill: the <b>activation energy</b>. Gray: no enzyme, and the starch rolls back. Green: with amylase, the hill is lower.',
      why: 'The enzyme holds the starch so the bond strains. Same start, same end. Only the path is easier.',
      overlay(sim,ctx,LH,k,tau){dim(ctx,LH,0.97);const kk=Math.min(k,1.25),p=tau%11,B={x0:110,x1:740,y0:70,y1:385},yR=262,yP=322;
        const sm=x=>x<=0?0:x>=1?1:x*x*(3-2*x),base=x=>lerp(yR,yP,sm((x-0.3)/0.4)),E=(x,h)=>base(x)-h*Math.exp(-Math.pow((x-0.5)/0.11,2)),X=x=>B.x0+x*(B.x1-B.x0),HT=200,HL=100;
        ctx.save();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(B.x0,B.y0-8);ctx.lineTo(B.x0,B.y1);ctx.lineTo(B.x1+8,B.y1);ctx.stroke();ctx.restore();
        H.txt(ctx,'Reaction progress  →',(B.x0+B.x1)/2,B.y1+20*kk,{s:13*kk,w:700,a:'center',b:'middle'});
        ctx.save();ctx.translate(B.x0-22*kk,(B.y0+B.y1)/2);ctx.rotate(-Math.PI/2);H.txt(ctx,'Energy  →',0,0,{s:13*kk,w:700,a:'center',b:'middle'});ctx.restore();
        const path=(h,col,dash)=>{ctx.save();ctx.strokeStyle=col;ctx.lineWidth=4;if(dash)ctx.setLineDash(dash);ctx.beginPath();for(let i=0;i<=200;i++){const x=0.04+i/200*0.92;i?ctx.lineTo(X(x),E(x,h)):ctx.moveTo(X(x),E(x,h));}ctx.stroke();ctx.restore();};
        path(HT,PAL['cv-soft'],[9,7]);path(HL,'#1b7a3a');
        /* activation-energy arrows, from the starting level up to each peak */
        const arrow=(x,y1,y2,col)=>{ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,y2+8);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y2);ctx.lineTo(x-6,y2+11);ctx.lineTo(x+6,y2+11);ctx.closePath();ctx.fill();ctx.restore();};
        ctx.save();ctx.setLineDash([4,5]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X(0.04),yR);ctx.lineTo(X(0.62),yR);ctx.stroke();ctx.restore();
        arrow(X(0.5)-16,yR,E(0.5,HT),PAL['cv-soft']);arrow(X(0.5)+16,yR,E(0.5,HL),'#1b7a3a');
        ezTagA(ctx,'Without enzyme',X(0.5)-30,E(0.5,HT)+34,k,{s:13},'r');
        ezTagA(ctx,'With enzyme',X(0.5)+30,E(0.5,HL)+20,k,{s:13,c:'#1b7a3a',hi:true},'l');ezTagA(ctx,'↑ Arrows = activation energy',X(0.03),B.y1-26,k,{s:12.5},'l');
        H.txt(ctx,'Starch + water',X(0.12),yR+22*kk,{s:13*kk,w:700,a:'center',b:'middle',c:PAL['cv-sub']});
        H.txt(ctx,'Sugars',X(0.9),yP+22*kk,{s:13*kk,w:700,a:'center',b:'middle',c:PAL['cv-prod']});
        /* the ball: a starch molecule trying the path */
        let bx,h,msg,col,hi=false;
        if(p<4.5){h=HT;const q=p<2.25?ease(p/2.25):1-ease((p-2.25)/2.25);bx=lerp(0.1,0.415,q);msg='Without the enzyme: not enough energy, it rolls back';col=PAL['cv-sub'];}
        else if(p<9){h=HL;bx=lerp(0.1,0.9,ease((p-4.5)/4.5));msg='With the enzyme: a lower hill, and over it goes';col=bx>0.5?PAL['cv-prod']:PAL['cv-sub'];hi=true;}
        else{h=HL;bx=0.9;msg='Same start, same end: only the hill is lower';col=PAL['cv-prod'];hi=true;}
        ezDot(ctx,X(bx),E(bx,h)-11,col,10);tag(ctx,msg,400,40,k,{hi});} },
    { key: 'bumps', title: 'Measure it: the reaction rate', speed: 0.5,
      see: 'Back to the tube. Each gold ring is one starch cut. The red bar is the <b>reaction rate</b>.',
      why: 'Rate means how fast product is made. Starch is cut only when it lands in a groove, so anything that changes how often that happens changes the rate.',
      overlay(sim,ctx,LH,k){sim.lnRate37=(sim.st&&sim.st.v)||sim.lnRate37;ezMeter(ctx,sim,k);} },
    { key: 'cold', cause: { from: { temp: 37 } }, title: 'Cold: slower, not broken', set: { temp: 10 }, fresh: true, speed: 0.5,
      see: 'Cooled to 10 °C. Fewer gold rings, and the rate drops to about a sixth.',
      why: 'Cold molecules move slower, so fewer landings make the cut. The enzyme stays folded, so warming it brings the rate back.',
      so: 'That is why the fridge keeps food fresh.',
      overlay(sim,ctx,LH,k){ezMeter(ctx,sim,k);tag(ctx,'Still folded ✓',700,400,k,{c:'#1b7a3a'});} },
    { key: 'hot', cause: { from: { temp: 37 } }, title: 'Too hot: broken for good', set: { temp: 70 }, speed: 0.25,
      see: 'Heated to 70 °C, as hot as fresh coffee. Each blob unfolds, and the rate falls to zero.',
      why: 'Heat breaks the bonds that hold the fold. No fold, no groove. This is <b>denaturing</b>, and cooling does not fix it.',
      overlay(sim,ctx,LH,k){ezMeter(ctx,sim,k);const uf=sim.vis.uf||[0],it=uf.reduce((x,y)=>x+y,0)/uf.length<0.97?1:0;tag(ctx,it?'Unfolding: the groove is gone':'All unfolded. Cooling will not refold them.',400,400,k,{hi:true});} },
    { key: 'tgraph', title: 'The temperature graph', speed: 0.25,
      see: 'The dot draws amylase’s rate from 0 to 100 °C. Right: one amylase at that temperature.',
      why: { bio: 'The rate climbs, peaks at the <b>optimum</b> (near body temperature), then crashes as the enzyme unfolds.',
             ap: 'The rate climbs, peaks at the <b>optimum</b> (near body temperature), then crashes as the enzyme unfolds. Dashed: a hot-spring enzyme, optimum far higher.' },
      overlay(sim,ctx,LH,k,tau){dim(ctx,LH,0.97);const kk=Math.min(k,1.25),hon=H.atLeast('ap'),per=hon?17:14,p=tau%per,B={x0:100,x1:540,y0:80,y1:360},xr=[0,100],X=T=>B.x0+T/100*(B.x1-B.x0),Y=r=>B.y1-r*(B.y1-B.y0),G='#1b7a3a',AMB='#b26b00';
        ezAxes(ctx,B,k,{xr,xt:[[0,'0'],[20,'20'],[40,'40'],[60,'60'],[80,'80'],[100,'100']],yt:[[0,'0'],[0.5,'50'],[1,'100']],xl:'Temperature (°C)',yl:'Rate (% of top speed)'});
        ezTagA(ctx,'Rate vs temperature',790,40,k,{},'r');
        const T=p<8?100*(p/8):100;ezCurve(ctx,B,xr,ezAmyT,T,G);
        if(p<8){ezDot(ctx,X(T),Y(ezAmyT(T)),'#c8102e',8);
          const u=1-ezFF(T,44,2.5);art(sim).protein(ctx,680,228,58,0,0.5,2,u,sim.vt,{outline:true});
          ezTagA(ctx,'Amylase at '+Math.round(T)+' °C',790,132,k,{hi:true},'r');
          tag(ctx,u<0.1?'Folded ✓':u<0.9?'Unfolding…':'Unfolded ✗',680,330,k,{c:u<0.1?'#1b7a3a':'#b3261e'});
          ctx.save();ctx.fillStyle=T>45?'rgba(230,60,40,'+clamp((T-45)/200,0,.2)+')':T<15?'rgba(60,130,230,'+clamp((15-T)/90,0,.16)+')':'rgba(0,0,0,0)';ctx.fillRect(580,80,200,280);ctx.restore();}
        else{const thumbs=[[10,'10 °C: slow'],[40,'40 °C: fastest'],[70,'70 °C: unfolded']];
          thumbs.forEach(([t,l],i)=>{const y=125+i*95;art(sim).protein(ctx,600,y,26,0,0.5,2,1-ezFF(t,44,2.5),sim.vt,{outline:true});H.txt(ctx,l,634,y,{s:14*Math.min(k,1.15),w:700,b:'middle'});ezDot(ctx,X(t),Y(ezAmyT(t)),'#c8102e',6);});
          tag(ctx,'Optimum',X(40),Y(1)-22,k,{s:13,hi:true});
          ezTagA(ctx,'Cold: slow',X(10)+10,Y(ezAmyT(10))+26,k,{s:12.5},'l');
          tag(ctx,'Denatured',X(58),Y(0.12),k,{s:12.5,c:'#b3261e'});
          if(hon){const Tq=p<11?100*clamp((p-8)/3,0,1):100;ezCurve(ctx,B,xr,ezTaqT,Tq,AMB,[8,6]);if(p>=11)tag(ctx,'Hot-spring bacteria',X(76),Y(1)-22,k,{s:12.5,c:AMB});}}} },
    { key: 'acid', cause: { from: { ph: 7 } }, title: 'Strong acid', set: { ph: 2 }, fresh: true, speed: 0.5,
      see: 'Now as acidic as your stomach: <b>pH</b> 2 (lower pH means more acid). Acid’s H⁺ ions cancel the groove’s charges, and the starch slips out.',
      why: 'The groove grips starch with electric charges. Change them and the grip fails. Amylase works best near pH 7.',
      overlay(sim,ctx,LH,k,tau){ezMeter(ctx,sim,k,{x:14,w:300});const bx=452,by=40,bw=336,bh=250,p=tau%9;ctx.save();H.rr(ctx,bx,by,bw,bh,10);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#c8102e';ctx.stroke();ctx.clip();
        const R=150,cx=bx+bw*0.5-R*0.72,cy=by+bh*0.5,f=p<2.6?0:ease((p-2.6)/2.2),a=lerp(0.5,0.14,f);art(sim).protein(ctx,cx,cy,R,0,a,2,0,sim.vt,{outline:true});
        const spots=[[0.68,-1],[0.48,0],[0.68,1]].map(([rr,s])=>{const an=s*a*0.75,r=R*rr;return [cx+Math.cos(an)*r,cy+Math.sin(an)*r];});
        spots.forEach(([x,y],i)=>{const hx=lerp(bx+bw-20,x+20,clamp(f*1.3-i*0.12,0,1)),hy=lerp(by+30+i*60,y,clamp(f*1.3-i*0.12,0,1));
          ctx.beginPath();ctx.arc(x+6,y,11,0,6.29);ctx.fillStyle=f>0.6?'#9aa0a6':'#2a6fdb';ctx.fill();H.txt(ctx,f>0.6?'0':'−',x+6,y+1,{s:15*k,w:700,c:'#fff',a:'center',b:'middle'});
          if(p>2.4){ctx.beginPath();ctx.arc(hx,hy,11,0,6.29);ctx.fillStyle='#d93025';ctx.fill();H.txt(ctx,'H⁺',hx,hy+1,{s:11*k,w:700,c:'#fff',a:'center',b:'middle'});}});
        const sx=lerp(cx+R*0.62,bx+bw+30,ease((p-4.2)/1.6));if(sx<bx+bw+10)art(sim).starch(ctx,sx,cy,1,14,0,PAL['cv-sub']);
        tag(ctx,'Close-up of one groove',bx+bw/2,by+22,k,{s:12});tag(ctx,f<0.5?'pH 7: charges grip the starch':'pH 2: H⁺ cancels the charges',bx+bw/2,by+bh-22,k,{s:14,hi:true});ctx.restore();} },
    { key: 'pgraph', title: 'The pH graph', speed: 0.25,
      see: 'Amylase’s curve peaks near pH 7. Then <b>pepsin</b>, a stomach enzyme, draws one that peaks near pH 2.',
      why: 'Each enzyme’s best pH matches where it works. Far from it, the groove’s charges are wrong and the rate drops.',
      overlay(sim,ctx,LH,k,tau){dim(ctx,LH,0.97);const kk=Math.min(k,1.25),p=tau%12,B={x0:100,x1:540,y0:80,y1:360},xr=[0,14],X=v=>B.x0+v/14*(B.x1-B.x0),Y=r=>B.y1-r*(B.y1-B.y0),G='#1b7a3a',PU=PAL['s5']||'#7b3fb0';
        ezAxes(ctx,B,k,{xr,xt:[[0,'0'],[2,'2'],[4,'4'],[6,'6'],[7,'7'],[8,'8'],[10,'10'],[12,'12'],[14,'14']],yt:[[0,'0'],[0.5,'50'],[1,'100']],xl:'pH  (acid ←   → base)',yl:'Rate (% of top speed)'});
        ezTagA(ctx,'Rate vs pH',790,40,k,{},'r');
        const a=p<4?14*(p/4):14;ezCurve(ctx,B,xr,v=>ezPH(v,6.8),a,G);if(p<4)ezDot(ctx,X(a),Y(ezPH(a,6.8)),G,7);
        if(p>=4){const b=p<8?14*((p-4)/4):14;ezCurve(ctx,B,xr,v=>ezPH(v,2),b,PU);if(p<8)ezDot(ctx,X(b),Y(ezPH(b,2)),PU,7);}
        if(p>=2.2)ezTagA(ctx,'Amylase (mouth)',X(7.9),Y(0.9),k,{s:13,c:G,hi:true},'l');
        if(p>=6.2)tag(ctx,'Pepsin (stomach)',X(2.1),Y(1)-22,k,{s:13,c:PU,hi:true});
        art(sim).protein(ctx,612,150,28,0,0.5,2,0,sim.vt,{outline:true});H.txt(ctx,'Mouth: pH 7',652,138,{s:14*Math.min(k,1.15),w:700,b:'middle'});H.txt(ctx,'amylase works',652,162,{s:13*Math.min(k,1.15),b:'middle',c:G});
        if(p>=4){art(sim).protein(ctx,612,270,28,0,0.5,5,0,sim.vt,{outline:true});H.txt(ctx,'Stomach: pH 2',652,258,{s:14*Math.min(k,1.15),w:700,b:'middle'});H.txt(ctx,'pepsin works',652,282,{s:13*Math.min(k,1.15),b:'middle',c:PU});}} },
    { lvl: 'honors', key: 'block', title: 'A blocker in the lock', set: { inhC: 5 }, fresh: true, speed: 0.5,
      see: 'Red triangles, a <b>competitive inhibitor</b>, fit the groove too. Some grooves hold a triangle instead of starch, so the rate drops.',
      why: 'While a triangle sits in the active site, starch can’t get in. The two take turns.',
      overlay(sim,ctx,LH,k){ezMeter(ctx,sim,k);tag(ctx,'Red triangle in a groove = a blocked enzyme',400,400,k,{hi:true});} },
    { lvl: 'honors', key: 'flood', title: 'More substrate wins it back', set: { inhC: 5, sub: 50 }, speed: 0.5,
      see: 'Same inhibitor, but five times as much starch. The tube fills with blue, and the rate bar climbs back up.',
      why: 'With far more starch around, starch wins the open groove most of the time. Extra substrate outcompetes a competitive inhibitor.',
      so: { honors: '', ap: 'In numbers: the competitive inhibitor raises the apparent Km, but Vmax stays the same.' },
      overlay(sim,ctx,LH,k){ezMeter(ctx,sim,k);tag(ctx,'5× the starch: it wins most grooves',400,400,k,{hi:true});} },
    { lvl: 'ap', key: 'allo', title: 'A blocker on the back', set: { inhN: 3 }, fresh: true, speed: 0.5,
      see: 'A <b>noncompetitive inhibitor</b>: the purple diamonds bind the back of the enzyme, away from the groove, and those grooves pinch shut.',
      why: 'Binding there changes the enzyme’s shape and closes the active site. Extra starch can’t undo that, so Vmax drops while Km stays the same.',
      overlay(sim,ctx,LH,k){ezMeter(ctx,sim,k);tag(ctx,'Purple diamond on the back = groove pinched shut',400,400,k,{hi:true});} }
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
  core: ['specific','reuse','ea','whycold','whyhot','optimum','phgraph','compsub'],
  questions: [
  {id:'vocab',kind:'test',lvl:'bio',
    q:'<p>Amylase in your saliva breaks starch into maltose, a small sugar. In this reaction, which molecule is the <b>substrate</b>?</p>',
    choices:['Starch','Maltose','Amylase','Saliva'],correct:0,
    steps:['The substrate is the molecule the enzyme acts on: it goes into the active site.','Amylase is the enzyme, and maltose is the product it makes.','So starch is the substrate.']},
  {id:'specific',kind:'test',lvl:'bio',
    q:'<p>Amylase breaks down starch but has no effect on fat. Why?</p>',
    choices:['Fat doesn’t fit amylase’s active site','Fat is too large for any enzyme to break down','Amylase is used up by the starch first','Fat has no chemical bonds to break'],correct:0,
    steps:['An enzyme’s active site has one exact shape.','Starch fits amylase’s groove; fat has a different shape and bounces off.','That is why each enzyme does one job: fats need a different enzyme, lipase.']},
  {id:'ea',kind:'test',lvl:'bio',
    q:'<p>How does an enzyme make a reaction go faster?</p><svg viewBox="0 0 420 230" style="display:block;width:100%;max-width:440px;height:auto;margin:10px 0 4px;color:inherit" role="img" aria-label="Energy diagram. The dashed path without an enzyme has a tall hill; the solid path with an enzyme has a lower hill. Arrow A runs from the reactants up to the top of the tall hill, arrow B from the reactants to the top of the lower hill, and arrow C is the drop from reactants to products."><path d="M58 8V180H406" fill="none" stroke="currentColor" stroke-width="1.6"/><text x="229.0" y="200" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Reaction progress →</text><text transform="translate(40 101.0) rotate(-90)" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Energy →</text><path d="M71.7 120.0L73.3 120.0L74.8 120.0L76.4 120.0L78.0 120.0L79.5 120.0L81.1 120.0L82.7 120.0L84.3 120.0L85.8 120.0L87.4 120.0L89.0 120.0L90.6 120.0L92.1 120.0L93.7 120.0L95.3 120.0L96.9 120.0L98.4 120.0L100.0 120.0L101.6 120.0L103.1 120.0L104.7 120.0L106.3 120.0L107.9 120.0L109.4 120.0L111.0 120.0L112.6 120.0L114.2 120.0L115.7 120.0L117.3 120.0L118.9 120.0L120.4 120.0L122.0 120.0L123.6 120.0L125.2 120.0L126.7 119.9L128.3 119.9L129.9 119.9L131.5 119.9L133.0 119.9L134.6 119.8L136.2 119.8L137.8 119.7L139.3 119.7L140.9 119.6L142.5 119.5L144.0 119.4L145.6 119.3L147.2 119.1L148.8 118.9L150.3 118.7L151.9 118.5L153.5 118.2L155.1 117.9L156.6 117.5L158.2 117.1L159.8 116.6L161.4 116.1L162.9 115.5L164.5 114.8L166.1 114.0L167.6 113.2L169.2 112.3L170.8 111.3L172.4 110.3L173.9 109.1L175.5 107.7L177.1 106.3L178.7 104.7L180.2 103.0L181.8 101.2L183.4 99.2L185.0 97.1L186.5 94.9L188.1 92.5L189.7 90.0L191.2 87.3L192.8 84.6L194.4 81.7L196.0 78.7L197.5 75.7L199.1 72.6L200.7 69.5L202.3 66.3L203.8 63.2L205.4 60.1L207.0 57.0L208.5 54.1L210.1 51.2L211.7 48.5L213.3 46.0L214.8 43.6L216.4 41.5L218.0 39.6L219.6 38.0L221.1 36.7L222.7 35.7L224.3 35.0L225.9 34.7L227.4 34.7L229.0 35.0L230.6 35.7L232.1 36.7L233.7 38.1L235.3 39.8L236.9 41.9L238.4 44.2L240.0 46.8L241.6 49.7L243.2 52.8L244.7 56.1L246.3 59.6L247.9 63.3L249.5 67.1L251.0 71.0L252.6 75.0L254.2 79.0L255.7 83.0L257.3 87.0L258.9 91.0L260.5 94.9L262.0 98.8L263.6 102.5L265.2 106.1L266.8 109.6L268.3 113.0L269.9 116.2L271.5 119.2L273.0 122.1L274.6 124.8L276.2 127.3L277.8 129.7L279.3 131.9L280.9 133.9L282.5 135.8L284.1 137.5L285.6 139.0L287.2 140.4L288.8 141.7L290.4 142.8L291.9 143.8L293.5 144.6L295.1 145.4L296.6 146.1L298.2 146.6L299.8 147.1L301.4 147.5L302.9 147.9L304.5 148.2L306.1 148.5L307.7 148.7L309.2 148.9L310.8 149.1L312.4 149.3L314.0 149.4L315.5 149.5L317.1 149.6L318.7 149.7L320.2 149.7L321.8 149.8L323.4 149.8L325.0 149.9L326.5 149.9L328.1 149.9L329.7 149.9L331.3 149.9L332.8 150.0L334.4 150.0L336.0 150.0L337.6 150.0L339.1 150.0L340.7 150.0L342.3 150.0L343.8 150.0L345.4 150.0L347.0 150.0L348.6 150.0L350.1 150.0L351.7 150.0L353.3 150.0L354.9 150.0L356.4 150.0L358.0 150.0L359.6 150.0L361.1 150.0L362.7 150.0L364.3 150.0L365.9 150.0L367.4 150.0L369.0 150.0L370.6 150.0L372.2 150.0L373.7 150.0L375.3 150.0L376.9 150.0L378.5 150.0L380.0 150.0L381.6 150.0L383.2 150.0L384.7 150.0L386.3 150.0" fill="none" stroke="#888" stroke-width="3" stroke-dasharray=[7, 5]/><path d="M71.7 120.0L73.3 120.0L74.8 120.0L76.4 120.0L78.0 120.0L79.5 120.0L81.1 120.0L82.7 120.0L84.3 120.0L85.8 120.0L87.4 120.0L89.0 120.0L90.6 120.0L92.1 120.0L93.7 120.0L95.3 120.0L96.9 120.0L98.4 120.0L100.0 120.0L101.6 120.0L103.1 120.0L104.7 120.0L106.3 120.0L107.9 120.0L109.4 120.0L111.0 120.0L112.6 120.0L114.2 120.0L115.7 120.0L117.3 120.0L118.9 120.0L120.4 120.0L122.0 120.0L123.6 120.0L125.2 120.0L126.7 120.0L128.3 120.0L129.9 119.9L131.5 119.9L133.0 119.9L134.6 119.9L136.2 119.9L137.8 119.8L139.3 119.8L140.9 119.8L142.5 119.7L144.0 119.7L145.6 119.6L147.2 119.5L148.8 119.4L150.3 119.3L151.9 119.2L153.5 119.0L155.1 118.8L156.6 118.6L158.2 118.4L159.8 118.1L161.4 117.8L162.9 117.5L164.5 117.2L166.1 116.8L167.6 116.4L169.2 115.9L170.8 115.5L172.4 114.9L173.9 114.3L175.5 113.7L177.1 113.0L178.7 112.3L180.2 111.4L181.8 110.5L183.4 109.6L185.0 108.6L186.5 107.5L188.1 106.3L189.7 105.1L191.2 103.8L192.8 102.4L194.4 101.0L196.0 99.5L197.5 98.1L199.1 96.5L200.7 95.0L202.3 93.5L203.8 91.9L205.4 90.4L207.0 89.0L208.5 87.5L210.1 86.2L211.7 84.9L213.3 83.7L214.8 82.7L216.4 81.7L218.0 80.9L219.6 80.3L221.1 79.8L222.7 79.5L224.3 79.3L225.9 79.3L227.4 79.6L229.0 80.0L230.6 80.6L232.1 81.4L233.7 82.4L235.3 83.6L236.9 84.9L238.4 86.4L240.0 88.1L241.6 89.9L243.2 91.9L244.7 93.9L246.3 96.1L247.9 98.3L249.5 100.6L251.0 103.0L252.6 105.3L254.2 107.8L255.7 110.2L257.3 112.6L258.9 115.0L260.5 117.3L262.0 119.6L263.6 121.8L265.2 124.0L266.8 126.1L268.3 128.1L269.9 130.0L271.5 131.8L273.0 133.5L274.6 135.1L276.2 136.7L277.8 138.1L279.3 139.4L280.9 140.6L282.5 141.7L284.1 142.7L285.6 143.7L287.2 144.5L288.8 145.3L290.4 145.9L291.9 146.5L293.5 147.0L295.1 147.5L296.6 147.8L298.2 148.1L299.8 148.4L301.4 148.6L302.9 148.8L304.5 149.0L306.1 149.2L307.7 149.3L309.2 149.4L310.8 149.5L312.4 149.6L314.0 149.7L315.5 149.7L317.1 149.8L318.7 149.8L320.2 149.8L321.8 149.9L323.4 149.9L325.0 149.9L326.5 149.9L328.1 149.9L329.7 150.0L331.3 150.0L332.8 150.0L334.4 150.0L336.0 150.0L337.6 150.0L339.1 150.0L340.7 150.0L342.3 150.0L343.8 150.0L345.4 150.0L347.0 150.0L348.6 150.0L350.1 150.0L351.7 150.0L353.3 150.0L354.9 150.0L356.4 150.0L358.0 150.0L359.6 150.0L361.1 150.0L362.7 150.0L364.3 150.0L365.9 150.0L367.4 150.0L369.0 150.0L370.6 150.0L372.2 150.0L373.7 150.0L375.3 150.0L376.9 150.0L378.5 150.0L380.0 150.0L381.6 150.0L383.2 150.0L384.7 150.0L386.3 150.0" fill="none" stroke="#1b7a3a" stroke-width="3"/><path d="M68 120H269.0" stroke="currentColor" stroke-dasharray="3 4" opacity=".6"/><path d="M217.0 120V42.0" stroke="#888" stroke-width="2.2"/><path d="M217.0 35.0l-5 9h10z" fill="#888"/><text x="209.0" y="82.5" font-size="15" font-weight="700" text-anchor="end" fill="currentColor">A</text><path d="M241.0 120V87.0" stroke="#1b7a3a" stroke-width="2.2"/><path d="M241.0 80.0l-5 9h10z" fill="#1b7a3a"/><text x="249.0" y="105.0" font-size="15" font-weight="700" text-anchor="start" fill="currentColor">B</text><path d="M376.06 120V149" stroke="currentColor" stroke-width="2"/><path d="M350.06 120H382.06" stroke="currentColor" stroke-dasharray="3 3" opacity=".6"/><text x="370.06" y="140.0" font-size="15" font-weight="700" text-anchor="end" fill="currentColor">C</text><text x="64" y="138" font-size="12" fill="currentColor">reactants</text><text x="396" y="168" font-size="12" text-anchor="end" fill="currentColor">products</text><text x="400" y="22" font-size="12" text-anchor="end" fill="#888">dashed: no enzyme</text><text x="400" y="38" font-size="12" text-anchor="end" fill="#1b7a3a">solid: with enzyme</text></svg>',
    choices:['It lowers the activation energy','It adds energy to the reactants','It raises the energy of the products','It changes which products are made'],correct:0,
    steps:['Every reaction must first climb an energy hill, the activation energy.','The enzyme holds the substrate in a strained position, so the hill is lower (the solid path).','The reactants and products stay the same. Only the path changes.']},
  {id:'eaarrow',kind:'test',lvl:'honors',fixed:true,
    q:'<p>In the energy diagram, which arrow shows the activation energy <b>with</b> the enzyme?</p><svg viewBox="0 0 420 230" style="display:block;width:100%;max-width:440px;height:auto;margin:10px 0 4px;color:inherit" role="img" aria-label="Energy diagram. The dashed path without an enzyme has a tall hill; the solid path with an enzyme has a lower hill. Arrow A runs from the reactants up to the top of the tall hill, arrow B from the reactants to the top of the lower hill, and arrow C is the drop from reactants to products."><path d="M58 8V180H406" fill="none" stroke="currentColor" stroke-width="1.6"/><text x="229.0" y="200" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Reaction progress →</text><text transform="translate(40 101.0) rotate(-90)" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Energy →</text><path d="M71.7 120.0L73.3 120.0L74.8 120.0L76.4 120.0L78.0 120.0L79.5 120.0L81.1 120.0L82.7 120.0L84.3 120.0L85.8 120.0L87.4 120.0L89.0 120.0L90.6 120.0L92.1 120.0L93.7 120.0L95.3 120.0L96.9 120.0L98.4 120.0L100.0 120.0L101.6 120.0L103.1 120.0L104.7 120.0L106.3 120.0L107.9 120.0L109.4 120.0L111.0 120.0L112.6 120.0L114.2 120.0L115.7 120.0L117.3 120.0L118.9 120.0L120.4 120.0L122.0 120.0L123.6 120.0L125.2 120.0L126.7 119.9L128.3 119.9L129.9 119.9L131.5 119.9L133.0 119.9L134.6 119.8L136.2 119.8L137.8 119.7L139.3 119.7L140.9 119.6L142.5 119.5L144.0 119.4L145.6 119.3L147.2 119.1L148.8 118.9L150.3 118.7L151.9 118.5L153.5 118.2L155.1 117.9L156.6 117.5L158.2 117.1L159.8 116.6L161.4 116.1L162.9 115.5L164.5 114.8L166.1 114.0L167.6 113.2L169.2 112.3L170.8 111.3L172.4 110.3L173.9 109.1L175.5 107.7L177.1 106.3L178.7 104.7L180.2 103.0L181.8 101.2L183.4 99.2L185.0 97.1L186.5 94.9L188.1 92.5L189.7 90.0L191.2 87.3L192.8 84.6L194.4 81.7L196.0 78.7L197.5 75.7L199.1 72.6L200.7 69.5L202.3 66.3L203.8 63.2L205.4 60.1L207.0 57.0L208.5 54.1L210.1 51.2L211.7 48.5L213.3 46.0L214.8 43.6L216.4 41.5L218.0 39.6L219.6 38.0L221.1 36.7L222.7 35.7L224.3 35.0L225.9 34.7L227.4 34.7L229.0 35.0L230.6 35.7L232.1 36.7L233.7 38.1L235.3 39.8L236.9 41.9L238.4 44.2L240.0 46.8L241.6 49.7L243.2 52.8L244.7 56.1L246.3 59.6L247.9 63.3L249.5 67.1L251.0 71.0L252.6 75.0L254.2 79.0L255.7 83.0L257.3 87.0L258.9 91.0L260.5 94.9L262.0 98.8L263.6 102.5L265.2 106.1L266.8 109.6L268.3 113.0L269.9 116.2L271.5 119.2L273.0 122.1L274.6 124.8L276.2 127.3L277.8 129.7L279.3 131.9L280.9 133.9L282.5 135.8L284.1 137.5L285.6 139.0L287.2 140.4L288.8 141.7L290.4 142.8L291.9 143.8L293.5 144.6L295.1 145.4L296.6 146.1L298.2 146.6L299.8 147.1L301.4 147.5L302.9 147.9L304.5 148.2L306.1 148.5L307.7 148.7L309.2 148.9L310.8 149.1L312.4 149.3L314.0 149.4L315.5 149.5L317.1 149.6L318.7 149.7L320.2 149.7L321.8 149.8L323.4 149.8L325.0 149.9L326.5 149.9L328.1 149.9L329.7 149.9L331.3 149.9L332.8 150.0L334.4 150.0L336.0 150.0L337.6 150.0L339.1 150.0L340.7 150.0L342.3 150.0L343.8 150.0L345.4 150.0L347.0 150.0L348.6 150.0L350.1 150.0L351.7 150.0L353.3 150.0L354.9 150.0L356.4 150.0L358.0 150.0L359.6 150.0L361.1 150.0L362.7 150.0L364.3 150.0L365.9 150.0L367.4 150.0L369.0 150.0L370.6 150.0L372.2 150.0L373.7 150.0L375.3 150.0L376.9 150.0L378.5 150.0L380.0 150.0L381.6 150.0L383.2 150.0L384.7 150.0L386.3 150.0" fill="none" stroke="#888" stroke-width="3" stroke-dasharray=[7, 5]/><path d="M71.7 120.0L73.3 120.0L74.8 120.0L76.4 120.0L78.0 120.0L79.5 120.0L81.1 120.0L82.7 120.0L84.3 120.0L85.8 120.0L87.4 120.0L89.0 120.0L90.6 120.0L92.1 120.0L93.7 120.0L95.3 120.0L96.9 120.0L98.4 120.0L100.0 120.0L101.6 120.0L103.1 120.0L104.7 120.0L106.3 120.0L107.9 120.0L109.4 120.0L111.0 120.0L112.6 120.0L114.2 120.0L115.7 120.0L117.3 120.0L118.9 120.0L120.4 120.0L122.0 120.0L123.6 120.0L125.2 120.0L126.7 120.0L128.3 120.0L129.9 119.9L131.5 119.9L133.0 119.9L134.6 119.9L136.2 119.9L137.8 119.8L139.3 119.8L140.9 119.8L142.5 119.7L144.0 119.7L145.6 119.6L147.2 119.5L148.8 119.4L150.3 119.3L151.9 119.2L153.5 119.0L155.1 118.8L156.6 118.6L158.2 118.4L159.8 118.1L161.4 117.8L162.9 117.5L164.5 117.2L166.1 116.8L167.6 116.4L169.2 115.9L170.8 115.5L172.4 114.9L173.9 114.3L175.5 113.7L177.1 113.0L178.7 112.3L180.2 111.4L181.8 110.5L183.4 109.6L185.0 108.6L186.5 107.5L188.1 106.3L189.7 105.1L191.2 103.8L192.8 102.4L194.4 101.0L196.0 99.5L197.5 98.1L199.1 96.5L200.7 95.0L202.3 93.5L203.8 91.9L205.4 90.4L207.0 89.0L208.5 87.5L210.1 86.2L211.7 84.9L213.3 83.7L214.8 82.7L216.4 81.7L218.0 80.9L219.6 80.3L221.1 79.8L222.7 79.5L224.3 79.3L225.9 79.3L227.4 79.6L229.0 80.0L230.6 80.6L232.1 81.4L233.7 82.4L235.3 83.6L236.9 84.9L238.4 86.4L240.0 88.1L241.6 89.9L243.2 91.9L244.7 93.9L246.3 96.1L247.9 98.3L249.5 100.6L251.0 103.0L252.6 105.3L254.2 107.8L255.7 110.2L257.3 112.6L258.9 115.0L260.5 117.3L262.0 119.6L263.6 121.8L265.2 124.0L266.8 126.1L268.3 128.1L269.9 130.0L271.5 131.8L273.0 133.5L274.6 135.1L276.2 136.7L277.8 138.1L279.3 139.4L280.9 140.6L282.5 141.7L284.1 142.7L285.6 143.7L287.2 144.5L288.8 145.3L290.4 145.9L291.9 146.5L293.5 147.0L295.1 147.5L296.6 147.8L298.2 148.1L299.8 148.4L301.4 148.6L302.9 148.8L304.5 149.0L306.1 149.2L307.7 149.3L309.2 149.4L310.8 149.5L312.4 149.6L314.0 149.7L315.5 149.7L317.1 149.8L318.7 149.8L320.2 149.8L321.8 149.9L323.4 149.9L325.0 149.9L326.5 149.9L328.1 149.9L329.7 150.0L331.3 150.0L332.8 150.0L334.4 150.0L336.0 150.0L337.6 150.0L339.1 150.0L340.7 150.0L342.3 150.0L343.8 150.0L345.4 150.0L347.0 150.0L348.6 150.0L350.1 150.0L351.7 150.0L353.3 150.0L354.9 150.0L356.4 150.0L358.0 150.0L359.6 150.0L361.1 150.0L362.7 150.0L364.3 150.0L365.9 150.0L367.4 150.0L369.0 150.0L370.6 150.0L372.2 150.0L373.7 150.0L375.3 150.0L376.9 150.0L378.5 150.0L380.0 150.0L381.6 150.0L383.2 150.0L384.7 150.0L386.3 150.0" fill="none" stroke="#1b7a3a" stroke-width="3"/><path d="M68 120H269.0" stroke="currentColor" stroke-dasharray="3 4" opacity=".6"/><path d="M217.0 120V42.0" stroke="#888" stroke-width="2.2"/><path d="M217.0 35.0l-5 9h10z" fill="#888"/><text x="209.0" y="82.5" font-size="15" font-weight="700" text-anchor="end" fill="currentColor">A</text><path d="M241.0 120V87.0" stroke="#1b7a3a" stroke-width="2.2"/><path d="M241.0 80.0l-5 9h10z" fill="#1b7a3a"/><text x="249.0" y="105.0" font-size="15" font-weight="700" text-anchor="start" fill="currentColor">B</text><path d="M376.06 120V149" stroke="currentColor" stroke-width="2"/><path d="M350.06 120H382.06" stroke="currentColor" stroke-dasharray="3 3" opacity=".6"/><text x="370.06" y="140.0" font-size="15" font-weight="700" text-anchor="end" fill="currentColor">C</text><text x="64" y="138" font-size="12" fill="currentColor">reactants</text><text x="396" y="168" font-size="12" text-anchor="end" fill="currentColor">products</text><text x="400" y="22" font-size="12" text-anchor="end" fill="#888">dashed: no enzyme</text><text x="400" y="38" font-size="12" text-anchor="end" fill="#1b7a3a">solid: with enzyme</text></svg>',
    choices:['Arrow A','Arrow B','Arrow C','A minus B'],correct:1,
    steps:['Activation energy is measured from the reactants up to the top of the hill.','Arrow A reaches the top of the tall, dashed hill: that is without the enzyme.','Arrow B reaches the top of the lower, solid hill: that is with the enzyme. Arrow C is the energy released, which the enzyme does not change.']},
  {id:'reuse',kind:'test',lvl:'bio',
    q:'A small amount of saliva can digest a lot of starch. Why?',
    choices:['Each enzyme is reused, working on one starch after another','The enzyme splits in two each time, making more enzyme','Each starch molecule it breaks turns into more enzyme','Saliva holds more enzyme molecules than the food has starch'],correct:0,
    steps:['After an enzyme cuts a starch molecule, it lets the sugars go.','The enzyme comes out the same as it went in.','So one enzyme molecule can repeat the job again and again.']},
  {id:'whycold',kind:'test',lvl:'bio',
    q:'An ice-cold drink slows the amylase in your mouth. Once your mouth warms back up, what happens, and why?',
    choices:['It stays slow, because the cold damaged its shape for good','It speeds back up: cold slowed it but didn’t unfold it','It works faster than before, to catch up on the starch it missed','It stops, because the cold denatured it like heat would'],correct:1,
    steps:['Cold molecules have less energy, so fewer landings in the groove lead to a cut.','The enzyme keeps its folded shape the whole time.','Warm it up, and the rate comes back.'],
    lab:{set:{temp:10},look:'The tube is at 10 °C. <b>Enzymes with working shape</b> stays high even though the rate is low. Then drag Temperature back to 37 °C.'}},
  {id:'whyhot',kind:'test',lvl:'bio',
    q:'Why does amylase stop working at 70 °C?',
    choices:['Heat uses up the enzyme, so there is none left to work','The chain unfolds, so the groove starch fits into is gone','Hot starch moves too fast for the enzyme to catch it','The extra sugar it makes at high heat blocks the active site'],correct:1,
    steps:['An enzyme only works because its folded chain makes a groove with the right shape.','Strong heat breaks the weak bonds that hold the chain folded, so the groove disappears.','Starch can’t fit, so the reaction stops. Cooling doesn’t refold it.'],
    lab:{set:{temp:70},look:'The tube is at 70 °C. Watch the enzymes unfold and <b>Enzymes with working shape</b> fall, with the reaction rate.'}},
  {id:'optimum',kind:'test',lvl:'bio',
    q:'<p>The graph shows an enzyme’s reaction rate at different temperatures. What is its optimum temperature?</p><svg viewBox="0 0 420 230" style="display:block;width:100%;max-width:440px;height:auto;margin:10px 0 4px;color:inherit" role="img" aria-label="Graph of reaction rate against temperature: the rate rises from 0 to a peak at point B, about 40 °C, then falls to zero by point C, 60 °C. Point A is at 10 °C on the rising side."><path d="M58 16V180H406" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M58.0 180v4" stroke="currentColor"/><text x="58.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">0</text><path d="M126.4 180v4" stroke="currentColor"/><text x="126.4" y="196" font-size="12" text-anchor="middle" fill="currentColor">20</text><path d="M194.8 180v4" stroke="currentColor"/><text x="194.8" y="196" font-size="12" text-anchor="middle" fill="currentColor">40</text><path d="M263.2 180v4" stroke="currentColor"/><text x="263.2" y="196" font-size="12" text-anchor="middle" fill="currentColor">60</text><path d="M331.6 180v4" stroke="currentColor"/><text x="331.6" y="196" font-size="12" text-anchor="middle" fill="currentColor">80</text><path d="M400.0 180v4" stroke="currentColor"/><text x="400.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">100</text><path d="M54 180.0h4" stroke="currentColor"/><text x="51" y="184.0" font-size="12" text-anchor="end" fill="currentColor">0</text><path d="M54 101.0h4" stroke="currentColor"/><text x="51" y="105.0" font-size="12" text-anchor="end" fill="currentColor">50</text><path d="M54 22.0h4" stroke="currentColor"/><text x="51" y="26.0" font-size="12" text-anchor="end" fill="currentColor">100</text><text x="229.0" y="216" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Temperature (°C)</text><text transform="translate(16 101.0) rotate(-90)" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Rate (% of top)</text><path d="M58.0 168.1L59.7 167.7L61.4 167.3L63.1 166.8L64.8 166.4L66.5 165.9L68.3 165.4L70.0 164.9L71.7 164.3L73.4 163.8L75.1 163.2L76.8 162.6L78.5 162.0L80.2 161.4L81.9 160.7L83.7 160.0L85.4 159.3L87.1 158.6L88.8 157.9L90.5 157.1L92.2 156.3L93.9 155.4L95.6 154.6L97.3 153.7L99.0 152.7L100.8 151.8L102.5 150.8L104.2 149.7L105.9 148.7L107.6 147.6L109.3 146.4L111.0 145.2L112.7 144.0L114.4 142.8L116.1 141.4L117.8 140.1L119.6 138.7L121.3 137.2L123.0 135.7L124.7 134.1L126.4 132.5L128.1 130.9L129.8 129.1L131.5 127.3L133.2 125.5L134.9 123.6L136.7 121.6L138.4 119.5L140.1 117.4L141.8 115.2L143.5 112.9L145.2 110.5L146.9 108.1L148.6 105.6L150.3 103.0L152.1 100.3L153.8 97.5L155.5 94.6L157.2 91.6L158.9 88.6L160.6 85.4L162.3 82.1L164.0 78.8L165.7 75.3L167.4 71.8L169.2 68.2L170.9 64.5L172.6 60.8L174.3 57.0L176.0 53.1L177.7 49.3L179.4 45.5L181.1 41.7L182.8 38.1L184.5 34.6L186.2 31.3L188.0 28.4L189.7 25.9L191.4 23.9L193.1 22.6L194.8 22.0L196.5 22.3L198.2 23.6L199.9 26.0L201.6 29.5L203.3 34.2L205.1 40.0L206.8 46.9L208.5 54.7L210.2 63.2L211.9 72.2L213.6 81.5L215.3 90.8L217.0 99.9L218.7 108.6L220.4 116.8L222.2 124.5L223.9 131.4L225.6 137.8L227.3 143.4L229.0 148.4L230.7 152.8L232.4 156.7L234.1 160.0L235.8 162.9L237.6 165.4L239.3 167.6L241.0 169.4L242.7 171.0L244.4 172.3L246.1 173.5L247.8 174.5L249.5 175.3L251.2 176.0L252.9 176.6L254.6 177.1L256.4 177.6L258.1 177.9L259.8 178.2L261.5 178.5L263.2 178.7L264.9 178.9L266.6 179.1L268.3 179.2L270.0 179.3L271.8 179.4L273.5 179.5L275.2 179.6L276.9 179.7L278.6 179.7L280.3 179.8L282.0 179.8L283.7 179.8L285.4 179.9L287.1 179.9L288.9 179.9L290.6 179.9L292.3 179.9L294.0 179.9L295.7 179.9L297.4 180.0L299.1 180.0L300.8 180.0L302.5 180.0L304.2 180.0L305.9 180.0L307.7 180.0L309.4 180.0L311.1 180.0L312.8 180.0L314.5 180.0L316.2 180.0L317.9 180.0L319.6 180.0L321.3 180.0L323.1 180.0L324.8 180.0L326.5 180.0L328.2 180.0L329.9 180.0L331.6 180.0L333.3 180.0L335.0 180.0L336.7 180.0L338.4 180.0L340.1 180.0L341.9 180.0L343.6 180.0L345.3 180.0L347.0 180.0L348.7 180.0L350.4 180.0L352.1 180.0L353.8 180.0L355.5 180.0L357.2 180.0L359.0 180.0L360.7 180.0L362.4 180.0L364.1 180.0L365.8 180.0L367.5 180.0L369.2 180.0L370.9 180.0L372.6 180.0L374.4 180.0L376.1 180.0L377.8 180.0L379.5 180.0L381.2 180.0L382.9 180.0L384.6 180.0L386.3 180.0L388.0 180.0L389.7 180.0L391.4 180.0L393.2 180.0L394.9 180.0L396.6 180.0L398.3 180.0L400.0 180.0" fill="none" stroke="#1b7a3a" stroke-width="3"/><circle cx="92.2" cy="156.3" r="5" fill="#c8102e"/><text x="92.2" y="144.3" font-size="14" font-weight="700" text-anchor="middle" fill="currentColor">A</text><circle cx="194.8" cy="22.0" r="5" fill="#c8102e"/><text x="194.8" y="10.0" font-size="14" font-weight="700" text-anchor="middle" fill="currentColor">B</text><circle cx="263.2" cy="178.7" r="5" fill="#c8102e"/><text x="271.2" y="168.7" font-size="14" font-weight="700" text-anchor="start" fill="currentColor">C</text></svg>',
    choices:['About 10 °C','About 40 °C','About 60 °C','About 100 °C'],correct:1,
    steps:['The optimum is the temperature where the rate is highest.','The top of the curve, point B, is near 40 °C.','That is close to body temperature, which fits a human enzyme like amylase.'],
    lab:{set:{temp:40},look:'Amylase at 40 °C, its fastest in this model. Then try 10 °C and 60 °C.'}},
  {id:'pointa',kind:'test',lvl:'bio',
    q:'<p>On the same graph, the enzyme at point A (10 °C) is warmed back to 40 °C. What happens to its rate?</p><svg viewBox="0 0 420 230" style="display:block;width:100%;max-width:440px;height:auto;margin:10px 0 4px;color:inherit" role="img" aria-label="Graph of reaction rate against temperature: the rate rises from 0 to a peak at point B, about 40 °C, then falls to zero by point C, 60 °C. Point A is at 10 °C on the rising side."><path d="M58 16V180H406" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M58.0 180v4" stroke="currentColor"/><text x="58.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">0</text><path d="M126.4 180v4" stroke="currentColor"/><text x="126.4" y="196" font-size="12" text-anchor="middle" fill="currentColor">20</text><path d="M194.8 180v4" stroke="currentColor"/><text x="194.8" y="196" font-size="12" text-anchor="middle" fill="currentColor">40</text><path d="M263.2 180v4" stroke="currentColor"/><text x="263.2" y="196" font-size="12" text-anchor="middle" fill="currentColor">60</text><path d="M331.6 180v4" stroke="currentColor"/><text x="331.6" y="196" font-size="12" text-anchor="middle" fill="currentColor">80</text><path d="M400.0 180v4" stroke="currentColor"/><text x="400.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">100</text><path d="M54 180.0h4" stroke="currentColor"/><text x="51" y="184.0" font-size="12" text-anchor="end" fill="currentColor">0</text><path d="M54 101.0h4" stroke="currentColor"/><text x="51" y="105.0" font-size="12" text-anchor="end" fill="currentColor">50</text><path d="M54 22.0h4" stroke="currentColor"/><text x="51" y="26.0" font-size="12" text-anchor="end" fill="currentColor">100</text><text x="229.0" y="216" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Temperature (°C)</text><text transform="translate(16 101.0) rotate(-90)" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Rate (% of top)</text><path d="M58.0 168.1L59.7 167.7L61.4 167.3L63.1 166.8L64.8 166.4L66.5 165.9L68.3 165.4L70.0 164.9L71.7 164.3L73.4 163.8L75.1 163.2L76.8 162.6L78.5 162.0L80.2 161.4L81.9 160.7L83.7 160.0L85.4 159.3L87.1 158.6L88.8 157.9L90.5 157.1L92.2 156.3L93.9 155.4L95.6 154.6L97.3 153.7L99.0 152.7L100.8 151.8L102.5 150.8L104.2 149.7L105.9 148.7L107.6 147.6L109.3 146.4L111.0 145.2L112.7 144.0L114.4 142.8L116.1 141.4L117.8 140.1L119.6 138.7L121.3 137.2L123.0 135.7L124.7 134.1L126.4 132.5L128.1 130.9L129.8 129.1L131.5 127.3L133.2 125.5L134.9 123.6L136.7 121.6L138.4 119.5L140.1 117.4L141.8 115.2L143.5 112.9L145.2 110.5L146.9 108.1L148.6 105.6L150.3 103.0L152.1 100.3L153.8 97.5L155.5 94.6L157.2 91.6L158.9 88.6L160.6 85.4L162.3 82.1L164.0 78.8L165.7 75.3L167.4 71.8L169.2 68.2L170.9 64.5L172.6 60.8L174.3 57.0L176.0 53.1L177.7 49.3L179.4 45.5L181.1 41.7L182.8 38.1L184.5 34.6L186.2 31.3L188.0 28.4L189.7 25.9L191.4 23.9L193.1 22.6L194.8 22.0L196.5 22.3L198.2 23.6L199.9 26.0L201.6 29.5L203.3 34.2L205.1 40.0L206.8 46.9L208.5 54.7L210.2 63.2L211.9 72.2L213.6 81.5L215.3 90.8L217.0 99.9L218.7 108.6L220.4 116.8L222.2 124.5L223.9 131.4L225.6 137.8L227.3 143.4L229.0 148.4L230.7 152.8L232.4 156.7L234.1 160.0L235.8 162.9L237.6 165.4L239.3 167.6L241.0 169.4L242.7 171.0L244.4 172.3L246.1 173.5L247.8 174.5L249.5 175.3L251.2 176.0L252.9 176.6L254.6 177.1L256.4 177.6L258.1 177.9L259.8 178.2L261.5 178.5L263.2 178.7L264.9 178.9L266.6 179.1L268.3 179.2L270.0 179.3L271.8 179.4L273.5 179.5L275.2 179.6L276.9 179.7L278.6 179.7L280.3 179.8L282.0 179.8L283.7 179.8L285.4 179.9L287.1 179.9L288.9 179.9L290.6 179.9L292.3 179.9L294.0 179.9L295.7 179.9L297.4 180.0L299.1 180.0L300.8 180.0L302.5 180.0L304.2 180.0L305.9 180.0L307.7 180.0L309.4 180.0L311.1 180.0L312.8 180.0L314.5 180.0L316.2 180.0L317.9 180.0L319.6 180.0L321.3 180.0L323.1 180.0L324.8 180.0L326.5 180.0L328.2 180.0L329.9 180.0L331.6 180.0L333.3 180.0L335.0 180.0L336.7 180.0L338.4 180.0L340.1 180.0L341.9 180.0L343.6 180.0L345.3 180.0L347.0 180.0L348.7 180.0L350.4 180.0L352.1 180.0L353.8 180.0L355.5 180.0L357.2 180.0L359.0 180.0L360.7 180.0L362.4 180.0L364.1 180.0L365.8 180.0L367.5 180.0L369.2 180.0L370.9 180.0L372.6 180.0L374.4 180.0L376.1 180.0L377.8 180.0L379.5 180.0L381.2 180.0L382.9 180.0L384.6 180.0L386.3 180.0L388.0 180.0L389.7 180.0L391.4 180.0L393.2 180.0L394.9 180.0L396.6 180.0L398.3 180.0L400.0 180.0" fill="none" stroke="#1b7a3a" stroke-width="3"/><circle cx="92.2" cy="156.3" r="5" fill="#c8102e"/><text x="92.2" y="144.3" font-size="14" font-weight="700" text-anchor="middle" fill="currentColor">A</text><circle cx="194.8" cy="22.0" r="5" fill="#c8102e"/><text x="194.8" y="10.0" font-size="14" font-weight="700" text-anchor="middle" fill="currentColor">B</text><circle cx="263.2" cy="178.7" r="5" fill="#c8102e"/><text x="271.2" y="168.7" font-size="14" font-weight="700" text-anchor="start" fill="currentColor">C</text></svg>',
    choices:['It rises to the top of the curve','It stays low: the cold damaged it','It stays at zero until new enzyme is made','It falls, because warming uses it up'],correct:0,
    steps:['At 10 °C the enzyme is still folded. Its molecules just move slowly.','Warming gives the molecules more energy, so more landings lead to a cut.','Cold only slows an enzyme; it doesn’t denature it.'],
    lab:{set:{temp:10},look:'Amylase at 10 °C: slow but still folded. Drag Temperature back to 37 °C and watch the rate return.'}},
  {id:'pointc',kind:'test',lvl:'bio',
    q:'<p>On the same graph, why is the rate zero at point C?</p><svg viewBox="0 0 420 230" style="display:block;width:100%;max-width:440px;height:auto;margin:10px 0 4px;color:inherit" role="img" aria-label="Graph of reaction rate against temperature: the rate rises from 0 to a peak at point B, about 40 °C, then falls to zero by point C, 60 °C. Point A is at 10 °C on the rising side."><path d="M58 16V180H406" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M58.0 180v4" stroke="currentColor"/><text x="58.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">0</text><path d="M126.4 180v4" stroke="currentColor"/><text x="126.4" y="196" font-size="12" text-anchor="middle" fill="currentColor">20</text><path d="M194.8 180v4" stroke="currentColor"/><text x="194.8" y="196" font-size="12" text-anchor="middle" fill="currentColor">40</text><path d="M263.2 180v4" stroke="currentColor"/><text x="263.2" y="196" font-size="12" text-anchor="middle" fill="currentColor">60</text><path d="M331.6 180v4" stroke="currentColor"/><text x="331.6" y="196" font-size="12" text-anchor="middle" fill="currentColor">80</text><path d="M400.0 180v4" stroke="currentColor"/><text x="400.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">100</text><path d="M54 180.0h4" stroke="currentColor"/><text x="51" y="184.0" font-size="12" text-anchor="end" fill="currentColor">0</text><path d="M54 101.0h4" stroke="currentColor"/><text x="51" y="105.0" font-size="12" text-anchor="end" fill="currentColor">50</text><path d="M54 22.0h4" stroke="currentColor"/><text x="51" y="26.0" font-size="12" text-anchor="end" fill="currentColor">100</text><text x="229.0" y="216" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Temperature (°C)</text><text transform="translate(16 101.0) rotate(-90)" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Rate (% of top)</text><path d="M58.0 168.1L59.7 167.7L61.4 167.3L63.1 166.8L64.8 166.4L66.5 165.9L68.3 165.4L70.0 164.9L71.7 164.3L73.4 163.8L75.1 163.2L76.8 162.6L78.5 162.0L80.2 161.4L81.9 160.7L83.7 160.0L85.4 159.3L87.1 158.6L88.8 157.9L90.5 157.1L92.2 156.3L93.9 155.4L95.6 154.6L97.3 153.7L99.0 152.7L100.8 151.8L102.5 150.8L104.2 149.7L105.9 148.7L107.6 147.6L109.3 146.4L111.0 145.2L112.7 144.0L114.4 142.8L116.1 141.4L117.8 140.1L119.6 138.7L121.3 137.2L123.0 135.7L124.7 134.1L126.4 132.5L128.1 130.9L129.8 129.1L131.5 127.3L133.2 125.5L134.9 123.6L136.7 121.6L138.4 119.5L140.1 117.4L141.8 115.2L143.5 112.9L145.2 110.5L146.9 108.1L148.6 105.6L150.3 103.0L152.1 100.3L153.8 97.5L155.5 94.6L157.2 91.6L158.9 88.6L160.6 85.4L162.3 82.1L164.0 78.8L165.7 75.3L167.4 71.8L169.2 68.2L170.9 64.5L172.6 60.8L174.3 57.0L176.0 53.1L177.7 49.3L179.4 45.5L181.1 41.7L182.8 38.1L184.5 34.6L186.2 31.3L188.0 28.4L189.7 25.9L191.4 23.9L193.1 22.6L194.8 22.0L196.5 22.3L198.2 23.6L199.9 26.0L201.6 29.5L203.3 34.2L205.1 40.0L206.8 46.9L208.5 54.7L210.2 63.2L211.9 72.2L213.6 81.5L215.3 90.8L217.0 99.9L218.7 108.6L220.4 116.8L222.2 124.5L223.9 131.4L225.6 137.8L227.3 143.4L229.0 148.4L230.7 152.8L232.4 156.7L234.1 160.0L235.8 162.9L237.6 165.4L239.3 167.6L241.0 169.4L242.7 171.0L244.4 172.3L246.1 173.5L247.8 174.5L249.5 175.3L251.2 176.0L252.9 176.6L254.6 177.1L256.4 177.6L258.1 177.9L259.8 178.2L261.5 178.5L263.2 178.7L264.9 178.9L266.6 179.1L268.3 179.2L270.0 179.3L271.8 179.4L273.5 179.5L275.2 179.6L276.9 179.7L278.6 179.7L280.3 179.8L282.0 179.8L283.7 179.8L285.4 179.9L287.1 179.9L288.9 179.9L290.6 179.9L292.3 179.9L294.0 179.9L295.7 179.9L297.4 180.0L299.1 180.0L300.8 180.0L302.5 180.0L304.2 180.0L305.9 180.0L307.7 180.0L309.4 180.0L311.1 180.0L312.8 180.0L314.5 180.0L316.2 180.0L317.9 180.0L319.6 180.0L321.3 180.0L323.1 180.0L324.8 180.0L326.5 180.0L328.2 180.0L329.9 180.0L331.6 180.0L333.3 180.0L335.0 180.0L336.7 180.0L338.4 180.0L340.1 180.0L341.9 180.0L343.6 180.0L345.3 180.0L347.0 180.0L348.7 180.0L350.4 180.0L352.1 180.0L353.8 180.0L355.5 180.0L357.2 180.0L359.0 180.0L360.7 180.0L362.4 180.0L364.1 180.0L365.8 180.0L367.5 180.0L369.2 180.0L370.9 180.0L372.6 180.0L374.4 180.0L376.1 180.0L377.8 180.0L379.5 180.0L381.2 180.0L382.9 180.0L384.6 180.0L386.3 180.0L388.0 180.0L389.7 180.0L391.4 180.0L393.2 180.0L394.9 180.0L396.6 180.0L398.3 180.0L400.0 180.0" fill="none" stroke="#1b7a3a" stroke-width="3"/><circle cx="92.2" cy="156.3" r="5" fill="#c8102e"/><text x="92.2" y="144.3" font-size="14" font-weight="700" text-anchor="middle" fill="currentColor">A</text><circle cx="194.8" cy="22.0" r="5" fill="#c8102e"/><text x="194.8" y="10.0" font-size="14" font-weight="700" text-anchor="middle" fill="currentColor">B</text><circle cx="263.2" cy="178.7" r="5" fill="#c8102e"/><text x="271.2" y="168.7" font-size="14" font-weight="700" text-anchor="start" fill="currentColor">C</text></svg>',
    choices:['The enzyme has unfolded and lost its active site','The enzyme ran out of activation energy','The molecules moved too slowly to collide','The starch unfolded, so it no longer fits'],correct:0,
    steps:['Past the optimum, heat breaks the weak bonds holding the enzyme’s fold.','With no fold there is no groove, so substrate can’t bind. The enzyme is denatured.','Molecules move faster when hot, not slower, so collisions are not the problem.'],
    lab:{set:{temp:60},look:'Amylase at 60 °C. Watch <b>Enzymes with working shape</b> fall, with the reaction rate.'}},
  {id:'thermo',kind:'test',lvl:'ap',
    q:'<p>One of these enzymes comes from bacteria living in a 75 °C hot spring. Which one, and why?</p><svg viewBox="0 0 420 230" style="display:block;width:100%;max-width:440px;height:auto;margin:10px 0 4px;color:inherit" role="img" aria-label="Two temperature curves. Enzyme X peaks near 40 °C and drops to zero by 60 °C. Enzyme Y, dashed, peaks near 76 °C."><path d="M58 16V180H406" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M58.0 180v4" stroke="currentColor"/><text x="58.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">0</text><path d="M126.4 180v4" stroke="currentColor"/><text x="126.4" y="196" font-size="12" text-anchor="middle" fill="currentColor">20</text><path d="M194.8 180v4" stroke="currentColor"/><text x="194.8" y="196" font-size="12" text-anchor="middle" fill="currentColor">40</text><path d="M263.2 180v4" stroke="currentColor"/><text x="263.2" y="196" font-size="12" text-anchor="middle" fill="currentColor">60</text><path d="M331.6 180v4" stroke="currentColor"/><text x="331.6" y="196" font-size="12" text-anchor="middle" fill="currentColor">80</text><path d="M400.0 180v4" stroke="currentColor"/><text x="400.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">100</text><path d="M54 180.0h4" stroke="currentColor"/><text x="51" y="184.0" font-size="12" text-anchor="end" fill="currentColor">0</text><path d="M54 101.0h4" stroke="currentColor"/><text x="51" y="105.0" font-size="12" text-anchor="end" fill="currentColor">50</text><path d="M54 22.0h4" stroke="currentColor"/><text x="51" y="26.0" font-size="12" text-anchor="end" fill="currentColor">100</text><text x="229.0" y="216" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Temperature (°C)</text><text transform="translate(16 101.0) rotate(-90)" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Rate (% of top)</text><path d="M58.0 168.1L59.7 167.7L61.4 167.3L63.1 166.8L64.8 166.4L66.5 165.9L68.3 165.4L70.0 164.9L71.7 164.3L73.4 163.8L75.1 163.2L76.8 162.6L78.5 162.0L80.2 161.4L81.9 160.7L83.7 160.0L85.4 159.3L87.1 158.6L88.8 157.9L90.5 157.1L92.2 156.3L93.9 155.4L95.6 154.6L97.3 153.7L99.0 152.7L100.8 151.8L102.5 150.8L104.2 149.7L105.9 148.7L107.6 147.6L109.3 146.4L111.0 145.2L112.7 144.0L114.4 142.8L116.1 141.4L117.8 140.1L119.6 138.7L121.3 137.2L123.0 135.7L124.7 134.1L126.4 132.5L128.1 130.9L129.8 129.1L131.5 127.3L133.2 125.5L134.9 123.6L136.7 121.6L138.4 119.5L140.1 117.4L141.8 115.2L143.5 112.9L145.2 110.5L146.9 108.1L148.6 105.6L150.3 103.0L152.1 100.3L153.8 97.5L155.5 94.6L157.2 91.6L158.9 88.6L160.6 85.4L162.3 82.1L164.0 78.8L165.7 75.3L167.4 71.8L169.2 68.2L170.9 64.5L172.6 60.8L174.3 57.0L176.0 53.1L177.7 49.3L179.4 45.5L181.1 41.7L182.8 38.1L184.5 34.6L186.2 31.3L188.0 28.4L189.7 25.9L191.4 23.9L193.1 22.6L194.8 22.0L196.5 22.3L198.2 23.6L199.9 26.0L201.6 29.5L203.3 34.2L205.1 40.0L206.8 46.9L208.5 54.7L210.2 63.2L211.9 72.2L213.6 81.5L215.3 90.8L217.0 99.9L218.7 108.6L220.4 116.8L222.2 124.5L223.9 131.4L225.6 137.8L227.3 143.4L229.0 148.4L230.7 152.8L232.4 156.7L234.1 160.0L235.8 162.9L237.6 165.4L239.3 167.6L241.0 169.4L242.7 171.0L244.4 172.3L246.1 173.5L247.8 174.5L249.5 175.3L251.2 176.0L252.9 176.6L254.6 177.1L256.4 177.6L258.1 177.9L259.8 178.2L261.5 178.5L263.2 178.7L264.9 178.9L266.6 179.1L268.3 179.2L270.0 179.3L271.8 179.4L273.5 179.5L275.2 179.6L276.9 179.7L278.6 179.7L280.3 179.8L282.0 179.8L283.7 179.8L285.4 179.9L287.1 179.9L288.9 179.9L290.6 179.9L292.3 179.9L294.0 179.9L295.7 179.9L297.4 180.0L299.1 180.0L300.8 180.0L302.5 180.0L304.2 180.0L305.9 180.0L307.7 180.0L309.4 180.0L311.1 180.0L312.8 180.0L314.5 180.0L316.2 180.0L317.9 180.0L319.6 180.0L321.3 180.0L323.1 180.0L324.8 180.0L326.5 180.0L328.2 180.0L329.9 180.0L331.6 180.0L333.3 180.0L335.0 180.0L336.7 180.0L338.4 180.0L340.1 180.0L341.9 180.0L343.6 180.0L345.3 180.0L347.0 180.0L348.7 180.0L350.4 180.0L352.1 180.0L353.8 180.0L355.5 180.0L357.2 180.0L359.0 180.0L360.7 180.0L362.4 180.0L364.1 180.0L365.8 180.0L367.5 180.0L369.2 180.0L370.9 180.0L372.6 180.0L374.4 180.0L376.1 180.0L377.8 180.0L379.5 180.0L381.2 180.0L382.9 180.0L384.6 180.0L386.3 180.0L388.0 180.0L389.7 180.0L391.4 180.0L393.2 180.0L394.9 180.0L396.6 180.0L398.3 180.0L400.0 180.0" fill="none" stroke="#1b7a3a" stroke-width="3"/><path d="M58.0 179.0L59.7 178.9L61.4 178.9L63.1 178.9L64.8 178.8L66.5 178.8L68.3 178.7L70.0 178.7L71.7 178.6L73.4 178.6L75.1 178.5L76.8 178.5L78.5 178.4L80.2 178.4L81.9 178.3L83.7 178.3L85.4 178.2L87.1 178.1L88.8 178.1L90.5 178.0L92.2 177.9L93.9 177.9L95.6 177.8L97.3 177.7L99.0 177.6L100.8 177.6L102.5 177.5L104.2 177.4L105.9 177.3L107.6 177.2L109.3 177.1L111.0 177.0L112.7 176.9L114.4 176.8L116.1 176.7L117.8 176.5L119.6 176.4L121.3 176.3L123.0 176.2L124.7 176.0L126.4 175.9L128.1 175.7L129.8 175.6L131.5 175.4L133.2 175.3L134.9 175.1L136.7 174.9L138.4 174.8L140.1 174.6L141.8 174.4L143.5 174.2L145.2 174.0L146.9 173.8L148.6 173.5L150.3 173.3L152.1 173.1L153.8 172.8L155.5 172.6L157.2 172.3L158.9 172.0L160.6 171.8L162.3 171.5L164.0 171.2L165.7 170.9L167.4 170.5L169.2 170.2L170.9 169.9L172.6 169.5L174.3 169.1L176.0 168.8L177.7 168.4L179.4 167.9L181.1 167.5L182.8 167.1L184.5 166.6L186.2 166.2L188.0 165.7L189.7 165.2L191.4 164.6L193.1 164.1L194.8 163.5L196.5 163.0L198.2 162.4L199.9 161.7L201.6 161.1L203.3 160.4L205.1 159.7L206.8 159.0L208.5 158.3L210.2 157.5L211.9 156.7L213.6 155.9L215.3 155.0L217.0 154.2L218.7 153.3L220.4 152.3L222.2 151.3L223.9 150.3L225.6 149.3L227.3 148.2L229.0 147.1L230.7 145.9L232.4 144.7L234.1 143.5L235.8 142.2L237.6 140.8L239.3 139.5L241.0 138.0L242.7 136.6L244.4 135.0L246.1 133.4L247.8 131.8L249.5 130.1L251.2 128.3L252.9 126.5L254.6 124.6L256.4 122.7L258.1 120.7L259.8 118.6L261.5 116.4L263.2 114.2L264.9 111.9L266.6 109.5L268.3 107.1L270.0 104.5L271.8 101.9L273.5 99.2L275.2 96.4L276.9 93.5L278.6 90.5L280.3 87.5L282.0 84.3L283.7 81.1L285.4 77.8L287.1 74.4L288.9 70.9L290.6 67.4L292.3 63.8L294.0 60.2L295.7 56.5L297.4 52.8L299.1 49.1L300.8 45.5L302.5 42.0L304.2 38.5L305.9 35.2L307.7 32.2L309.4 29.4L311.1 26.9L312.8 24.9L314.5 23.3L316.2 22.3L317.9 22.0L319.6 22.4L321.3 23.6L323.1 25.6L324.8 28.5L326.5 32.2L328.2 36.8L329.9 42.2L331.6 48.3L333.3 55.0L335.0 62.1L336.7 69.6L338.4 77.3L340.1 85.1L341.9 92.8L343.6 100.3L345.3 107.5L347.0 114.3L348.7 120.8L350.4 126.8L352.1 132.4L353.8 137.5L355.5 142.2L357.2 146.4L359.0 150.2L360.7 153.6L362.4 156.7L364.1 159.4L365.8 161.9L367.5 164.0L369.2 165.9L370.9 167.6L372.6 169.1L374.4 170.4L376.1 171.6L377.8 172.6L379.5 173.5L381.2 174.3L382.9 175.0L384.6 175.6L386.3 176.2L388.0 176.6L389.7 177.0L391.4 177.4L393.2 177.7L394.9 178.0L396.6 178.3L398.3 178.5L400.0 178.7" fill="none" stroke="#b26b00" stroke-width="3" stroke-dasharray=[7, 5]/><text x="128" y="16" font-size="13" font-weight="700" fill="#1b7a3a">Enzyme X</text><text x="330" y="16" font-size="13" font-weight="700" fill="#b26b00">Enzyme Y</text></svg>',
    choices:['Y: its optimum is close to 75 °C','X: its peak is higher on the graph','Y: it works at every temperature','X: it stops before the water gets hot'],correct:0,
    steps:['An enzyme’s optimum matches where its organism lives.','Enzyme Y keeps its shape and peaks near 75 °C; enzyme X is denatured by 60 °C.','Taq polymerase, used in PCR, comes from hot-spring bacteria like these.']},
  {id:'phgraph',kind:'test',lvl:'bio',
    q:'<p>The graph shows two enzymes at different pH values. Your stomach is about pH 2. Which enzyme would work in your stomach?</p><svg viewBox="0 0 420 230" style="display:block;width:100%;max-width:440px;height:auto;margin:10px 0 4px;color:inherit" role="img" aria-label="Two pH curves. Enzyme A, dashed, peaks near pH 2. Enzyme B peaks near pH 7."><path d="M58 16V180H406" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M58.0 180v4" stroke="currentColor"/><text x="58.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">0</text><path d="M106.9 180v4" stroke="currentColor"/><text x="106.9" y="196" font-size="12" text-anchor="middle" fill="currentColor">2</text><path d="M155.7 180v4" stroke="currentColor"/><text x="155.7" y="196" font-size="12" text-anchor="middle" fill="currentColor">4</text><path d="M204.6 180v4" stroke="currentColor"/><text x="204.6" y="196" font-size="12" text-anchor="middle" fill="currentColor">6</text><path d="M253.4 180v4" stroke="currentColor"/><text x="253.4" y="196" font-size="12" text-anchor="middle" fill="currentColor">8</text><path d="M302.3 180v4" stroke="currentColor"/><text x="302.3" y="196" font-size="12" text-anchor="middle" fill="currentColor">10</text><path d="M351.1 180v4" stroke="currentColor"/><text x="351.1" y="196" font-size="12" text-anchor="middle" fill="currentColor">12</text><path d="M400.0 180v4" stroke="currentColor"/><text x="400.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">14</text><path d="M54 180.0h4" stroke="currentColor"/><text x="51" y="184.0" font-size="12" text-anchor="end" fill="currentColor">0</text><path d="M54 101.0h4" stroke="currentColor"/><text x="51" y="105.0" font-size="12" text-anchor="end" fill="currentColor">50</text><path d="M54 22.0h4" stroke="currentColor"/><text x="51" y="26.0" font-size="12" text-anchor="end" fill="currentColor">100</text><text x="229.0" y="216" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">pH</text><text transform="translate(16 101.0) rotate(-90)" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Rate (% of top)</text><path d="M58.0 146.9L59.7 143.1L61.4 139.1L63.1 134.8L64.8 130.3L66.5 125.4L68.3 120.4L70.0 115.2L71.7 109.7L73.4 104.1L75.1 98.4L76.8 92.5L78.5 86.6L80.2 80.7L81.9 74.8L83.7 68.9L85.4 63.2L87.1 57.7L88.8 52.4L90.5 47.4L92.2 42.7L93.9 38.4L95.6 34.5L97.3 31.1L99.0 28.2L100.8 25.8L102.5 24.0L104.2 22.7L105.9 22.1L107.6 22.1L109.3 22.6L111.0 23.8L112.7 25.5L114.4 27.8L116.1 30.7L117.8 34.0L119.6 37.8L121.3 42.1L123.0 46.7L124.7 51.7L126.4 56.9L128.1 62.4L129.8 68.1L131.5 73.9L133.2 79.8L134.9 85.7L136.7 91.7L138.4 97.5L140.1 103.3L141.8 108.9L143.5 114.4L145.2 119.7L146.9 124.7L148.6 129.6L150.3 134.2L152.1 138.5L153.8 142.6L155.5 146.4L157.2 149.9L158.9 153.1L160.6 156.1L162.3 158.9L164.0 161.4L165.7 163.7L167.4 165.7L169.2 167.5L170.9 169.2L172.6 170.6L174.3 171.9L176.0 173.1L177.7 174.1L179.4 175.0L181.1 175.7L182.8 176.4L184.5 177.0L186.2 177.4L188.0 177.9L189.7 178.2L191.4 178.5L193.1 178.8L194.8 179.0L196.5 179.2L198.2 179.3L199.9 179.5L201.6 179.6L203.3 179.6L205.1 179.7L206.8 179.8L208.5 179.8L210.2 179.9L211.9 179.9L213.6 179.9L215.3 179.9L217.0 179.9L218.7 180.0L220.4 180.0L222.2 180.0L223.9 180.0L225.6 180.0L227.3 180.0L229.0 180.0L230.7 180.0L232.4 180.0L234.1 180.0L235.8 180.0L237.6 180.0L239.3 180.0L241.0 180.0L242.7 180.0L244.4 180.0L246.1 180.0L247.8 180.0L249.5 180.0L251.2 180.0L252.9 180.0L254.6 180.0L256.4 180.0L258.1 180.0L259.8 180.0L261.5 180.0L263.2 180.0L264.9 180.0L266.6 180.0L268.3 180.0L270.0 180.0L271.8 180.0L273.5 180.0L275.2 180.0L276.9 180.0L278.6 180.0L280.3 180.0L282.0 180.0L283.7 180.0L285.4 180.0L287.1 180.0L288.9 180.0L290.6 180.0L292.3 180.0L294.0 180.0L295.7 180.0L297.4 180.0L299.1 180.0L300.8 180.0L302.5 180.0L304.2 180.0L305.9 180.0L307.7 180.0L309.4 180.0L311.1 180.0L312.8 180.0L314.5 180.0L316.2 180.0L317.9 180.0L319.6 180.0L321.3 180.0L323.1 180.0L324.8 180.0L326.5 180.0L328.2 180.0L329.9 180.0L331.6 180.0L333.3 180.0L335.0 180.0L336.7 180.0L338.4 180.0L340.1 180.0L341.9 180.0L343.6 180.0L345.3 180.0L347.0 180.0L348.7 180.0L350.4 180.0L352.1 180.0L353.8 180.0L355.5 180.0L357.2 180.0L359.0 180.0L360.7 180.0L362.4 180.0L364.1 180.0L365.8 180.0L367.5 180.0L369.2 180.0L370.9 180.0L372.6 180.0L374.4 180.0L376.1 180.0L377.8 180.0L379.5 180.0L381.2 180.0L382.9 180.0L384.6 180.0L386.3 180.0L388.0 180.0L389.7 180.0L391.4 180.0L393.2 180.0L394.9 180.0L396.6 180.0L398.3 180.0L400.0 180.0" fill="none" stroke="#7b3fb0" stroke-width="3" stroke-dasharray=[7, 5]/><path d="M58.0 180.0L59.7 180.0L61.4 180.0L63.1 180.0L64.8 180.0L66.5 180.0L68.3 180.0L70.0 180.0L71.7 180.0L73.4 180.0L75.1 180.0L76.8 180.0L78.5 180.0L80.2 180.0L81.9 180.0L83.7 180.0L85.4 180.0L87.1 180.0L88.8 180.0L90.5 180.0L92.2 180.0L93.9 180.0L95.6 180.0L97.3 180.0L99.0 180.0L100.8 180.0L102.5 180.0L104.2 180.0L105.9 180.0L107.6 180.0L109.3 180.0L111.0 180.0L112.7 180.0L114.4 179.9L116.1 179.9L117.8 179.9L119.6 179.9L121.3 179.8L123.0 179.8L124.7 179.8L126.4 179.7L128.1 179.6L129.8 179.5L131.5 179.4L133.2 179.3L134.9 179.1L136.7 178.9L138.4 178.7L140.1 178.4L141.8 178.1L143.5 177.8L145.2 177.3L146.9 176.8L148.6 176.2L150.3 175.5L152.1 174.7L153.8 173.8L155.5 172.8L157.2 171.6L158.9 170.2L160.6 168.7L162.3 167.0L164.0 165.1L165.7 163.0L167.4 160.7L169.2 158.1L170.9 155.3L172.6 152.2L174.3 148.9L176.0 145.3L177.7 141.4L179.4 137.3L181.1 132.9L182.8 128.2L184.5 123.3L186.2 118.2L188.0 112.8L189.7 107.3L191.4 101.6L193.1 95.9L194.8 90.0L196.5 84.1L198.2 78.1L199.9 72.3L201.6 66.5L203.3 60.9L205.1 55.4L206.8 50.2L208.5 45.4L210.2 40.8L211.9 36.7L213.6 33.0L215.3 29.8L217.0 27.1L218.7 25.0L220.4 23.4L222.2 22.4L223.9 22.0L225.6 22.2L227.3 23.0L229.0 24.4L230.7 26.4L232.4 29.0L234.1 32.0L235.8 35.6L237.6 39.6L239.3 44.0L241.0 48.8L242.7 53.9L244.4 59.3L246.1 64.9L247.8 70.6L249.5 76.4L251.2 82.4L252.9 88.3L254.6 94.2L256.4 100.0L258.1 105.7L259.8 111.3L261.5 116.7L263.2 121.9L264.9 126.8L266.6 131.6L268.3 136.1L270.0 140.3L271.8 144.2L273.5 147.9L275.2 151.3L276.9 154.5L278.6 157.4L280.3 160.0L282.0 162.4L283.7 164.6L285.4 166.5L287.1 168.3L288.9 169.8L290.6 171.2L292.3 172.4L294.0 173.5L295.7 174.5L297.4 175.3L299.1 176.0L300.8 176.6L302.5 177.2L304.2 177.6L305.9 178.0L307.7 178.4L309.4 178.6L311.1 178.9L312.8 179.1L314.5 179.2L316.2 179.4L317.9 179.5L319.6 179.6L321.3 179.7L323.1 179.7L324.8 179.8L326.5 179.8L328.2 179.9L329.9 179.9L331.6 179.9L333.3 179.9L335.0 179.9L336.7 180.0L338.4 180.0L340.1 180.0L341.9 180.0L343.6 180.0L345.3 180.0L347.0 180.0L348.7 180.0L350.4 180.0L352.1 180.0L353.8 180.0L355.5 180.0L357.2 180.0L359.0 180.0L360.7 180.0L362.4 180.0L364.1 180.0L365.8 180.0L367.5 180.0L369.2 180.0L370.9 180.0L372.6 180.0L374.4 180.0L376.1 180.0L377.8 180.0L379.5 180.0L381.2 180.0L382.9 180.0L384.6 180.0L386.3 180.0L388.0 180.0L389.7 180.0L391.4 180.0L393.2 180.0L394.9 180.0L396.6 180.0L398.3 180.0L400.0 180.0" fill="none" stroke="#1b7a3a" stroke-width="3"/><text x="100" y="16" font-size="13" font-weight="700" fill="#7b3fb0">Enzyme A</text><text x="225" y="16" font-size="13" font-weight="700" fill="#1b7a3a">Enzyme B</text></svg>',
    choices:['Enzyme A, whose curve peaks near pH 2','Enzyme B, whose curve peaks near pH 7','Both, since pH only changes speed','Neither, since acid denatures all enzymes'],correct:0,
    steps:['Each enzyme works fastest at its own optimum pH.','Enzyme A’s curve peaks near pH 2, so it works well in stomach acid. Pepsin is a real example.','Enzyme B, like amylase, peaks near pH 7 and nearly stops at pH 2.'],
    lab:{set:{ph:2},look:'Amylase at pH 2: its rate falls to almost zero, like Enzyme B.'}},
  {id:'lemon',kind:'real',lvl:'bio',
    q:'Lemon juice on sliced apples slows browning, which is caused by an enzyme in the apple. What does the lemon juice do?',
    choices:['It cools the apple, which slows every reaction in it','It lowers the pH, far from the browning enzyme’s best pH','It adds more substrate, so the enzyme is used up sooner','Its acid heats the enzyme until the enzyme denatures'],correct:1,
    steps:['Lemon juice is acidic, about pH 2.','Acid changes the electric charges in the active site, and those charges help the enzyme grip its substrate.','Far from its best pH, the browning enzyme slows way down.'],
    lab:{set:{ph:2},look:'Amylase at pH 2. Watch the grooves pinch and the reaction rate fall, just like the apple’s browning enzyme in lemon juice.'}},
  {id:'stain',kind:'real',lvl:'bio',
    q:'You get a nosebleed on your favorite hoodie. Why should you rinse it in cold water, not hot?',
    choices:['Hot water unfolds blood proteins, and they stick to the fabric','Cold water holds more dissolved oxygen, which lifts the stain out','Hot water makes the stain spread out across more of the fabric','Cold water dissolves the iron in blood, and hot water can’t'],correct:0,
    steps:['Blood is mostly protein.','Heat unfolds proteins, the same way 70 °C unfolded amylase.','Unfolded proteins tangle and lock onto the fabric fibers. Cold water keeps them folded and easy to rinse out.']},
  {id:'pineapple',kind:'real',lvl:'bio',
    q:'Fresh pineapple keeps Jell-O from setting, because an enzyme in it cuts gelatin’s protein. Canned pineapple works fine. Why?',
    choices:['Canning adds sugar syrup, which helps the gelatin set','Canning heat denatured the enzyme that cuts gelatin','Canned pineapple is more acidic, which helps gelatin firm up','Canned pineapple has no protein left in it to cut gelatin'],correct:1,
    steps:['Canning heats the fruit.','That heat unfolds the pineapple’s enzyme, bromelain, so it can no longer cut protein.','Heat damage to an enzyme is permanent, so the canned fruit can’t stop the gelatin from setting.']},
  {id:'saturate',kind:'test',lvl:'honors',
    q:'<p>The graph shows the rate as substrate is added. Why does the curve level off?</p><svg viewBox="0 0 420 230" style="display:block;width:100%;max-width:440px;height:auto;margin:10px 0 4px;color:inherit" role="img" aria-label="Rate against substrate concentration: the rate rises steeply at first, then levels off and approaches a maximum."><path d="M58 16V180H406" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M58.0 180v4" stroke="currentColor"/><text x="58.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">0</text><path d="M126.4 180v4" stroke="currentColor"/><text x="126.4" y="196" font-size="12" text-anchor="middle" fill="currentColor">10</text><path d="M194.8 180v4" stroke="currentColor"/><text x="194.8" y="196" font-size="12" text-anchor="middle" fill="currentColor">20</text><path d="M263.2 180v4" stroke="currentColor"/><text x="263.2" y="196" font-size="12" text-anchor="middle" fill="currentColor">30</text><path d="M331.6 180v4" stroke="currentColor"/><text x="331.6" y="196" font-size="12" text-anchor="middle" fill="currentColor">40</text><path d="M400.0 180v4" stroke="currentColor"/><text x="400.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">50</text><path d="M54 180.0h4" stroke="currentColor"/><text x="51" y="184.0" font-size="12" text-anchor="end" fill="currentColor">0</text><path d="M54 101.0h4" stroke="currentColor"/><text x="51" y="105.0" font-size="12" text-anchor="end" fill="currentColor">50</text><path d="M54 22.0h4" stroke="currentColor"/><text x="51" y="26.0" font-size="12" text-anchor="end" fill="currentColor">100</text><text x="229.0" y="216" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Substrate concentration (mM)</text><text transform="translate(16 101.0) rotate(-90)" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Rate (% of max)</text><path d="M58.0 180.0L59.7 172.5L61.4 165.6L63.1 159.4L64.8 153.7L66.5 148.4L68.3 143.5L70.0 139.0L71.7 134.9L73.4 131.0L75.1 127.3L76.8 123.9L78.5 120.8L80.2 117.8L81.9 114.9L83.7 112.3L85.4 109.8L87.1 107.4L88.8 105.2L90.5 103.0L92.2 101.0L93.9 99.1L95.6 97.2L97.3 95.5L99.0 93.8L100.8 92.2L102.5 90.7L104.2 89.2L105.9 87.8L107.6 86.5L109.3 85.2L111.0 84.0L112.7 82.8L114.4 81.6L116.1 80.5L117.8 79.5L119.6 78.4L121.3 77.4L123.0 76.5L124.7 75.6L126.4 74.7L128.1 73.8L129.8 73.0L131.5 72.2L133.2 71.4L134.9 70.6L136.7 69.9L138.4 69.2L140.1 68.5L141.8 67.8L143.5 67.1L145.2 66.5L146.9 65.9L148.6 65.3L150.3 64.7L152.1 64.1L153.8 63.6L155.5 63.0L157.2 62.5L158.9 62.0L160.6 61.5L162.3 61.0L164.0 60.5L165.7 60.1L167.4 59.6L169.2 59.2L170.9 58.7L172.6 58.3L174.3 57.9L176.0 57.5L177.7 57.1L179.4 56.7L181.1 56.3L182.8 56.0L184.5 55.6L186.2 55.3L188.0 54.9L189.7 54.6L191.4 54.2L193.1 53.9L194.8 53.6L196.5 53.3L198.2 53.0L199.9 52.7L201.6 52.4L203.3 52.1L205.1 51.8L206.8 51.5L208.5 51.3L210.2 51.0L211.9 50.7L213.6 50.5L215.3 50.2L217.0 50.0L218.7 49.7L220.4 49.5L222.2 49.2L223.9 49.0L225.6 48.8L227.3 48.6L229.0 48.3L230.7 48.1L232.4 47.9L234.1 47.7L235.8 47.5L237.6 47.3L239.3 47.1L241.0 46.9L242.7 46.7L244.4 46.5L246.1 46.3L247.8 46.1L249.5 45.9L251.2 45.8L252.9 45.6L254.6 45.4L256.4 45.2L258.1 45.1L259.8 44.9L261.5 44.7L263.2 44.6L264.9 44.4L266.6 44.3L268.3 44.1L270.0 43.9L271.8 43.8L273.5 43.6L275.2 43.5L276.9 43.4L278.6 43.2L280.3 43.1L282.0 42.9L283.7 42.8L285.4 42.7L287.1 42.5L288.9 42.4L290.6 42.3L292.3 42.1L294.0 42.0L295.7 41.9L297.4 41.8L299.1 41.6L300.8 41.5L302.5 41.4L304.2 41.3L305.9 41.2L307.7 41.0L309.4 40.9L311.1 40.8L312.8 40.7L314.5 40.6L316.2 40.5L317.9 40.4L319.6 40.3L321.3 40.2L323.1 40.1L324.8 40.0L326.5 39.9L328.2 39.8L329.9 39.7L331.6 39.6L333.3 39.5L335.0 39.4L336.7 39.3L338.4 39.2L340.1 39.1L341.9 39.0L343.6 38.9L345.3 38.8L347.0 38.7L348.7 38.6L350.4 38.5L352.1 38.5L353.8 38.4L355.5 38.3L357.2 38.2L359.0 38.1L360.7 38.0L362.4 38.0L364.1 37.9L365.8 37.8L367.5 37.7L369.2 37.6L370.9 37.6L372.6 37.5L374.4 37.4L376.1 37.3L377.8 37.3L379.5 37.2L381.2 37.1L382.9 37.0L384.6 37.0L386.3 36.9L388.0 36.8L389.7 36.8L391.4 36.7L393.2 36.6L394.9 36.6L396.6 36.5L398.3 36.4L400.0 36.4" fill="none" stroke="#1b7a3a" stroke-width="3"/><path d="M58 22H400" stroke="currentColor" stroke-dasharray="4 4" opacity=".6"/></svg>',
    choices:['Nearly every active site is already filled','The extra substrate denatures the enzyme','The enzyme gets used up by the reaction','High substrate lowers the solution’s pH'],correct:0,
    steps:['At low substrate, many active sites are empty, so more substrate means more cuts.','At high substrate, nearly every active site is filled all the time.','The enzymes are working as fast as they can, so adding more substrate barely helps.'],
    lab:{set:{sub:50},look:'Substrate at 50 mM. <b>Active sites filled</b> is near 90%: the enzymes are almost all busy.'}},
  {id:'toothpick',kind:'test',lvl:'honors',
    q:'<p>In the Toothpickase lab, you break toothpicks with your fingers. In that model, what do your fingers stand for?</p>',
    choices:['The enzyme molecules','The substrate molecules','The product molecules','The inhibitor molecules'],correct:0,
    steps:['Your fingers do the breaking, over and over, and are not used up.','That is the enzyme’s job. The whole toothpicks are the substrate.','The broken pieces are the products.']},
  {id:'toothpick2',kind:'test',lvl:'honors',
    q:'<p>Late in a Toothpickase trial, whole toothpicks get hard to find and you break them more slowly. What does that model?</p>',
    choices:['Less substrate, so the rate drops','The enzyme denaturing from heat','An inhibitor blocking the active site','The enzyme being used up by the work'],correct:0,
    steps:['As toothpicks are broken, fewer whole ones (substrate) are left.','With less substrate around, the enzyme spends more time searching.','So the rate falls even though the enzyme is unchanged.'],
    lab:{set:{sub:1},look:'Substrate at 1 mM. Few blue starch pieces, and the rate is low.'}},
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
      see: 'A red blood cell is 8 µm across; its membrane is 5 nm thick; a water molecule is 0.3 nm.',
      why: 'If water were a grain of sand, the cell would be as wide as a classroom. Molecules are drawn bigger so you can see them.',
      overlay(sim,ctx,LH,k){const A=sim.def.art;brace(ctx,A.CX-80,A.CY+108,A.CX+80,A.CY+108,'about 8 µm = 8,000 nm',k);
        brace(ctx,A.MX-14,92,A.MX+14,92,'about 5 nm',k);tag(ctx,'water molecule: about 0.3 nm',643,452-30,k,{s:13,hi:true});} },
    { key: 'cross', title: 'A selective doorway', speed: 0.5,
      see: 'In the zoom, water slips through a protein tunnel (an <b>aquaporin</b>). A salt ion hits the membrane and bounces off.',
      why: 'The oily middle blocks charged ions. Letting some things through but not others is <b>selectively permeable</b>.',
      overlay(sim,ctx,LH,k,tau){const A=sim.def.art,p=tau%4,y=A.chY[0],x=lerp(560,725,p/3);ctx.save();ctx.strokeStyle='#c8102e';ctx.setLineDash([5,4]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(560,y);ctx.lineTo(725,y);ctx.stroke();ctx.setLineDash([]);
        if(p<3){ctx.beginPath();ctx.arc(x,y,6,0,6.29);ctx.fillStyle=PAL['s2'];ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#c8102e';ctx.stroke();}
        const q=tau%3.2,sx=q<1.6?lerp(560,A.MX-16,q/1.6):lerp(A.MX-16,560,(q-1.6)/1.6),sy=232+Math.sin(q*2)*6;ctx.beginPath();ctx.arc(sx,sy,8,0,6.29);ctx.fillStyle=PAL['cv-inn'];ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#c8102e';ctx.stroke();ctx.restore();
        tag(ctx,'✓ water through an aquaporin',643,y-30,k,{s:12,c:'#1b7a3a'});tag(ctx,'✗ salt bounces off',590,262,k,{s:12,c:'#b3261e'});} },
    { key: 'balance', title: 'Equal both ways', speed: 0.5,
      see: 'Blood is 0.9% salt, like the inside of the cell. The counter shows about as much water crossing in as out.',
      why: 'Water crosses both ways at random. With the same dissolved amount on both sides (<b>isotonic</b>), crossings balance.',
      overlay(sim,ctx,LH,k){tally(ctx,sim,k);} },
    { key: 'pure', title: 'Pure water: swell and burst', set: { salt: 0 }, fresh: true, speed: 0.4,
      see: 'Pure water outside. More water crosses in than out. The cell swells, then tears open.',
      why: 'Water moves toward the side with more dissolved stuff. With no wall, the cell bursts (<b>lysis</b>).',
      so: 'That is why IV bags are salty, never plain water.',
      overlay(sim,ctx,LH,k){tally(ctx,sim,k);} },
    { key: 'salty', cause: { from: { salt: 0.9 } }, title: 'Salty water: shrink', set: { salt: 3 }, fresh: true, speed: 0.25,
      see: 'A fresh cell in 3% salt water. More water crosses out than in, and the cell shrivels into a spiky shape.',
      why: 'The outside has more salt, so water leaves toward it (<b>crenation</b>).',
      so: 'That is why drinking seawater dehydrates you.',
      overlay(sim,ctx,LH,k){tally(ctx,sim,k);} },
    { key: 'plant', title: 'A plant cell gets firm', base: { cell: 'plant' }, set: { salt: 0 }, fresh: true, speed: 0.5,
      see: 'A plant cell in pure water. Water flows in, and the green arrows show it pressing on its wall, not bursting.',
      why: 'The stiff wall pushes back (<b>turgor pressure</b>), which holds up leaves and stems.',
      so: 'That is why limp celery crisps in ice water.',
      overlay(sim,ctx,LH,k){tag(ctx,'Real colors: green chloroplasts, clear vacuole',240,62,k,{s:13});} },
    { key: 'wilt', cause: { from: { salt: 0 } }, title: 'Salt makes a plant wilt', base: { cell: 'plant' }, set: { salt: 3 }, fresh: true, speed: 0.5,
      see: 'The same plant cell in 3% salt water. Water leaves, and the insides pull away from the wall.',
      why: 'Water leaves toward the salt, and the membrane shrinks from the wall (<b>plasmolysis</b>).',
      so: 'That is why road salt hurts roadside grass.' },
    { key: 'tonic', title: 'The test picture: three solutions', speed: 0.5,
      see: 'The same cells in three solutions. Arrows show which way most water moves. Top: red blood cells. Bottom: plant cells.',
      why: 'Water moves toward more dissolved stuff. Hypotonic: water in (blood cells burst, plant cells firm). Isotonic: balanced. Hypertonic: water out (cells shrink).',
      overlay(sim,ctx,LH,k,tau){dim(ctx,LH,1);const kk=Math.min(k,1.2),p=tau%10,f=ease(clamp((p-1)/3,0,1)),RED='#b3261e',WALL='#6b6b1e',SAP='#9fd0ef',CYT='#5c9e4a',BLU='#2a6fdb';
        const cols=[[140,'Hypotonic','less solute outside',1],[400,'Isotonic','same both sides',0],[660,'Hypertonic','more solute outside',-1]];
        cols.forEach(([cx,t1,t2,dir],i)=>{tag(ctx,t1,cx,36,k,{hi:true});H.txt(ctx,t2,cx,80,{s:12.5*kk,a:'center',b:'middle',c:PAL['cv-soft']});
          /* red blood cell: a disc that swells to a sphere, stays put, or crenates */
          const r=36*(1+0.28*dir*f),y=150;ctx.save();ctx.fillStyle=RED;ctx.beginPath();
          if(dir<0){for(let j=0;j<=36;j++){const a=j/36*6.2832,rr=r*(1+0.13*f*Math.sin(a*9));j?ctx.lineTo(cx+Math.cos(a)*rr,y+Math.sin(a)*rr*0.8):ctx.moveTo(cx+Math.cos(a)*rr,y+Math.sin(a)*rr*0.8);}}
          else ctx.ellipse(cx,y,r,r*(dir>0?0.8+0.2*f:0.8),0,0,6.29);ctx.fill();
          if(dir===0){ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(cx,y,r*0.45,r*0.35,0,0,6.29);ctx.fill();}
          ctx.restore();if(dir>0&&f>=1)H.txt(ctx,'may burst',cx,y-r-12,{s:12.5*kk,w:700,a:'center',b:'middle',c:RED});
          /* plant cell: wall stays; membrane presses out, sits normal, or pulls in */
          const w=150,h=96,x=cx-w/2,yy=250;ctx.save();ctx.lineWidth=7;ctx.strokeStyle=WALL;ctx.strokeRect(x,yy,w,h);
          const sh=dir<0?18*f:dir===0?4:0;ctx.fillStyle=CYT;H.rr(ctx,x+5+sh,yy+5+sh,w-10-2*sh,h-10-2*sh,10);ctx.fill();ctx.fillStyle=SAP;H.rr(ctx,x+16+sh*1.4,yy+16+sh*1.2,w-32-2.8*sh,h-32-2.4*sh,10);ctx.fill();ctx.restore();
          H.txt(ctx,dir>0?'firm (turgid)':dir===0?'limp (flaccid)':'plasmolyzed',cx,yy+h+20,{s:13*kk,w:700,a:'center',b:'middle'});
          /* net water arrows */
          if(dir!==0&&p>0.6){const q=(p*0.8)%1;ctx.save();ctx.fillStyle=BLU;const tri=(x,yy,pt)=>{ctx.beginPath();ctx.moveTo(x+pt*9,yy);ctx.lineTo(x-pt*7,yy-8);ctx.lineTo(x-pt*7,yy+8);ctx.closePath();ctx.fill();};
            [-1,1].forEach(sx=>{const pt=dir>0?-sx:sx;const a0=cx+sx*118,a1=cx+sx*84;tri(dir>0?lerp(a0,a1,q):lerp(a1,a0,q),y,pt);const b0=cx+sx*108,b1=cx+sx*80;tri(dir>0?lerp(b0,b1,q):lerp(b1,b0,q),yy+h/2,pt);});ctx.restore();
            H.txt(ctx,dir>0?'water in':'water out',cx,214,{s:12.5*kk,w:700,a:'center',b:'middle',c:BLU});}
          else if(dir===0)H.txt(ctx,'in = out',cx,214,{s:12.5*kk,w:700,a:'center',b:'middle',c:BLU});});
        H.txt(ctx,'Colors are labels; cells not to scale with each other.',400,428,{s:12*kk,a:'center',b:'middle',c:PAL['cv-soft']});} },
    { key: 'o2', title: 'Other molecules, other doors', base: { mol: 'o2', side: 'out' }, fresh: true, speed: 1,
      see: 'The zoom follows oxygen (O₂). It slips straight through the membrane, from more to less.',
      why: 'O₂ is small with no charge, so it crosses the fatty layer with no energy: <b>simple diffusion</b>. Glucose needs a carrier; ions need pumps.',
      overlay(sim,ctx,LH,k){tag(ctx,'O₂: straight through the bilayer ✓',643,84,k,{s:13,hi:true});} },
    { lvl: 'honors', key: 'pump', title: 'Pumping uphill', base: { mol: 'na', side: 'out', pump: true }, fresh: true, speed: 1,
      see: 'The zoom follows sodium (Na⁺). Even with far more Na⁺ outside, the purple pump pushes more out, and “ATP → ADP” flashes.',
      why: 'Moving from less to more is uphill, so it costs ATP. That is <b>active transport</b>.',
      overlay(sim,ctx,LH,k){tag(ctx,'Active transport: uses ATP',643,452-30,k,{s:13,hi:true});} },
    { lvl: 'ap', key: 'psi', title: 'Water potential', base: { cell: 'plant' }, fresh: true, speed: 1,
      see: 'A plant cell in 0.9% salt water. Watch the ψ readouts below as it settles.',
      why: 'Water moves from higher ψ to lower ψ. Solutes lower ψ; wall pressure raises it. Flow stops when inside equals outside.' }
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
      see: 'Six beakers, from plain water (1) to 1.0 M sugar (6). Each gets one potato core, weighed first.',
      why: 'Only the sugar changes, so any difference in the cores comes from the sugar. The yellow tint labels sugar strength.',
      overlay(sim,ctx,LH,k){tag(ctx,'plain water',PBX(0),112,k,{s:12,hi:true});tag(ctx,'more sugar →',PBX(3),112,k,{s:12});tag(ctx,'1.0 M sugar',PBX(5),112,k,{s:12,hi:true});
        scaleBar(ctx,PBX(0)-8,440,17,'1 cm',k);tag(ctx,'Beakers and cores are drawn to the same width scale',300,432,k,{s:12});} },
    { key: 'cells', title: 'Inside the core', set: { bal: 1 }, speed: 0.3,
      see: 'The circle zooms into the core in beaker 1: potato cells 0.15 mm across, with white starch and brown dissolved particles.',
      why: 'Each <b>membrane</b> lets water through but holds particles in. The cells hold more dissolved stuff than plain water.',
      overlay(sim,ctx,LH,k,tau){potZoom(ctx,sim,k,tau,{x:340,y:232,r:118,to:[PBX(0)+16,350]});
        tag(ctx,'plain water',262,104,k,{s:12});tag(ctx,'cell wall',420,104,k,{s:12});tag(ctx,'starch grain (white)',340,372,k,{s:12});tag(ctx,'dissolved sugars and salts (brown dots)',340,402,k,{s:12});} },
    { key: 'pure', title: 'Plain water: the core gains', set: { bal: 1 }, fresh: true, speed: 0.5,
      see: 'Blue water drops move into the cells, and the balance number climbs.',
      why: 'Water moves by <b>osmosis</b> toward more dissolved particles: into the cells. Plain water is <b>hypotonic</b>.',
      so: 'That is why a limp carrot crisps up in water.',
      overlay(sim,ctx,LH,k,tau){potZoom(ctx,sim,k,tau,{x:340,y:232,r:118,to:[PBX(0)+16,350]});tag(ctx,'water moves IN →',340,98,k,{s:13,hi:true,c:PAL['s2']});tag(ctx,'membranes press on the walls',340,372,k,{s:12});tag(ctx,'The core’s swelling is drawn about 2× bigger; the balance shows the real mass.',300,432,k,{s:12});} },
    { key: 'strong', cause: { from: { bal: 1 } }, title: 'Strong sugar water: the core loses', set: { bal: 6 }, fresh: true, speed: 0.5,
      see: 'Beaker 6: water moves out, membranes pull from their walls, and the balance number drops.',
      why: 'Now the outside has more dissolved particles, so water leaves (<b>plasmolysis</b>). 1.0 M sugar is <b>hypertonic</b>.',
      so: 'That is why sugar pulls juice out of strawberries.',
      overlay(sim,ctx,LH,k,tau){potZoom(ctx,sim,k,tau,{x:250,y:232,r:118,to:[PBX(5)-20,350]});tag(ctx,'← water moves OUT',250,98,k,{s:13,hi:true,c:'#b3261e'});tag(ctx,'membranes pull away from the walls',250,372,k,{s:12});} },
    { key: 'weigh', title: 'Read the balance', set: { bal: 6 }, speed: 1,
      see: 'The card shows the core’s starting mass, its mass now and the percent change.',
      why: 'You can’t see water move, but you can weigh it. Percent change lets cores of different sizes compare fairly.'+pickHTML('pot','Your guess before the next step: in what strength of sugar water would a core not change at all?',[['0','plain water'],['3','about 0.3 M'],['10','1.0 M']]),
      run(sim){pickWire(sim);},
      overlay(sim,ctx,LH,k){const c=pCore(sim),m=pMass(c),p=pPct(c);
        potCard(ctx,[['Core from beaker '+(sim.p.bal|0),700],['started: '+c.m0.toFixed(3)+' g'],['now: '+m.toFixed(3)+' g'],['('+m.toFixed(2)+' − '+c.m0.toFixed(2)+') ÷ '+c.m0.toFixed(2)+' × 100'],['= '+(p>=0?'+':'')+p.toFixed(1)+'%',700,16,p<0?'#b3261e':PAL['s2']],[p<-0.3?'lost mass → water left':p>0.3?'gained mass → water entered':'barely changed',600,12]],k);} },
    { key: 'graph', title: 'Find where nothing changes', fresh: true, speed: 1.5,
      see: 'The red line is a graph: each dot sits over its beaker, high if the core gained mass, low if it lost.',
      why: 'Where it crosses zero, about 0.3 M, is the <b>isotonic point</b>: water moves in and out equally.',
      so: 'Your lab makes this graph.',
      overlay(sim,ctx,LH,k){potGraph(ctx,sim,k);const g=pickOf(sim,'pot');if(g&&sim.st.tSoak>3)tag(ctx,'Your guess: '+({0:'plain water',3:'about 0.3 M',10:'1.0 M'})[g]+(g==='3'?'  ✓':'  ✗'),690,180,Math.min(k,1.1),{s:13,c:TK()});} },
    { key: 'repeat', title: 'One run or five?', fresh: true, speed: 4, run(sim){sim._runs=[];},
      see: 'The soak runs five times with fresh cores. The magenta rings are earlier runs, and the band shows where zero is crossed.',
      why: 'No two cores are alike. Repeating shows how sure you can be, so report a range.',
      overlay(sim,ctx,LH,k,tau){const st=sim.st,R=sim._runs||(sim._runs=[]),Y0=56,S=1.9;
        if(!st.restart&&st.tSoak>=12&&R.length<5&&R._t!==st){R._t=st;let it=null;const cs=st.cores;for(let i=0;i<cs.length-1;i++){const a=pPct(cs[i]),b=pPct(cs[i+1]);if(a>=0&&b<0){const f=a/(a-b);it={m:cs[i].c+(cs[i+1].c-cs[i].c)*f,x:lerp(PBX(i),PBX(i+1),f)};break;}}
          R.push({pts:st.cores.map((c,i)=>[PBX(i),clamp(Y0-S*pPct(c),12,112)]),m:it?it.m:NaN,x:it?it.x:NaN});if(R.length<5)st.restart=true;}
        const iso=potGraph(ctx,sim,k,{iso:R.length>=5});
        R.forEach((r0,j)=>{if(j===R.length-1&&R.length>=5)return;ctx.save();ctx.strokeStyle=TK();ctx.lineWidth=1.6;ctx.setLineDash([3,3]);ctx.beginPath();r0.pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.globalAlpha=0.55;ctx.stroke();ctx.globalAlpha=1;ctx.setLineDash([]);
          r0.pts.forEach(q=>{ctx.beginPath();ctx.arc(q[0],q[1],5,0,6.29);ctx.stroke();});ctx.restore();});
        const ms=R.map(r0=>r0.m).filter(Number.isFinite),xs=R.map(r0=>r0.x).filter(Number.isFinite);
        if(xs.length>=2){const x0=Math.min(...xs),x1=Math.max(...xs);ctx.save();ctx.fillStyle=TKA(.25);ctx.fillRect(x0-2,Y0-16,x1-x0+4,32);ctx.restore();
          tag(ctx,(R.length>=5?'5 runs: ':'run '+R.length+' of 5: ')+Math.min(...ms).toFixed(2)+' to '+Math.max(...ms).toFixed(2)+' M',690,180,Math.min(k,1.1),{s:13,c:TK()});}
        else tag(ctx,'run '+(R.length+1)+' of 5',690,180,Math.min(k,1.1),{s:13,c:TK()});
        thinkBadge(ctx,'spread','One trial or many?',k,tau,{right:790,y:14});} },
    { lvl: 'honors', key: 'zoomin', title: 'Zoom in to measure better', set: { range: 'fine' }, fresh: true, speed: 2,
      see: 'New beakers from 0.20 to 0.45 M, close to the crossing. Zero is now easier to pin down.',
      why: 'The first run bracketed the answer. Closer trials give a sharper isotonic point: about 0.30 M.',
      overlay(sim,ctx,LH,k){potGraph(ctx,sim,k);} },
    { lvl: 'ap', key: 'psi', title: 'Turn it into water potential', set: { range: 'fine' }, fresh: true, speed: 2,
      see: 'The card plugs the crossing point into ψs = −iCRT.',
      why: 'At the isotonic point, ψ outside = ψ inside. An open beaker has ψp = 0, so the potato cells are about −7.4 bar.',
      overlay(sim,ctx,LH,k){const m=potGraph(ctx,sim,k,{iso:true}),iso=potIso(sim),i=sim.p.solute==='nacl'?2:1,T=sim.p.temp+273;
        if(Number.isFinite(iso))potCard(ctx,[['ψs = −iCRT',700],['= −('+i+')('+iso.toFixed(2)+')(0.0831)('+T+')'],['= '+(-i*iso*0.0831*(T)).toFixed(1)+' bar',700,15]],k,590,118);} },
    { lvl: 'ap', key: 'nacl', title: 'Salt instead of sugar', set: { solute: 'nacl' }, fresh: true, speed: 2,
      see: 'The beakers now hold table salt. The crossing moves to about 0.15 M, but ψ stays about the same.',
      why: 'Each NaCl makes 2 particles (i = 2), so half the molarity pulls water the same.',
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
      see: 'Each six-sided shape is one <b>glucose</b>, about 1 nm across. Water molecules on the right are about 0.3 nm.',
      why: 'A building block like glucose is a <b>monomer</b>. Thousands linked make <b>starch</b>, a <b>polymer</b>. Colors are labels; real starch is white cornstarch.',
      overlay(sim,ctx,LH,k){foodCard(ctx,k,['powder','bread'],['What starch looks like to you: white powder','Each speck of cornstarch holds millions of chains']);
        tag(ctx,'glucose ≈ 1 nm',372,62,k,{s:12,hi:true});line(ctx,400,74,mPool(5)[0],mPool(5)[1]-18,'#c8102e');tag(ctx,'water ≈ 0.3 nm',640,206,k,{s:12,hi:true});} },
    { key: 'ends', title: 'Where the bonds form', speed: 0.3,
      see: 'Two pulsing circles: each glucose has an <b>–H</b> on its left end and an <b>–OH</b> on its right.',
      why: 'These ends are where glucose links. The –OH of one and the –H of its neighbor are about to come off together.',
      overlay(sim,ctx,LH,k,tau){const a=mPool(0),b=mPool(1);pulse(ctx,a[0]+24,a[1],11,tau);pulse(ctx,b[0]-25,b[1],8,tau);
        tag(ctx,'–OH end of glucose 1',a[0]+30,152,k,{s:12,hi:true});line(ctx,a[0]+30,140,a[0]+24,a[1]+10,'#c8102e');tag(ctx,'–H end of glucose 2',b[0]+90,180,k,{s:12,hi:true});line(ctx,b[0]+40,170,b[0]-25,b[1]+8,'#c8102e');} },
    { key: 'join', title: 'Joining makes water', speed: 0.35, run(sim){sim.st.q.push('join');},
      see: 'In slow motion, the –OH and –H come off together as one H₂O and fly into the water box. The glucose are now bonded.',
      why: 'O + 2 H is a water molecule. Taking it out links the two: <b>dehydration synthesis</b>.',
      overlay(sim,ctx,LH,k){tag(ctx,'–OH + –H  →  H₂O',300,206,k,{s:13,hi:true});} },
    { key: 'chain', title: 'Every bond gives off one water', fresh: true, speed: 1, run: joinN,
      see: 'All six join. Each new bond sends one water into the box.',
      why: 'Every bond releases one water. Six glucose have 5 links, so 5 waters. A chain of n monomers has n − 1 bonds.',
      overlay(sim,ctx,LH,k){const s=sim.st,b=Math.max(0,s.len-1);foodCard(ctx,k,[],['Glucose in the chain: '+s.len+'   Bonds: '+b+'   Waters released: '+s.wout,'n monomers → n − 1 bonds → n − 1 waters'],{x:30,y:126,w:430,h:62});} },
    { key: 'long', title: 'Real starch is much longer', set: { start: 12, startAs: 'chain' }, fresh: true, speed: 0.5,
      see: 'A 12-glucose chain fills the box. The dashes show real starch going on for thousands of glucose.',
      why: 'Plants store sugar as starch because one giant molecule packs into a potato better than thousands of loose sugars.',
      overlay(sim,ctx,LH,k){const x=mSlot(11)+26;ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=3;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(x,318);ctx.lineTo(790,318);ctx.stroke();ctx.restore();
        tag(ctx,'…keeps going for hundreds to thousands more glucose',420,262,k,{s:13,hi:true});foodCard(ctx,k,['rice','bread'],['Rice, bread, pasta, potatoes and corn','are mostly starch, besides their water']);} },
    { key: 'split', title: 'Splitting uses water', set: { startAs: 'chain' }, fresh: true, speed: 0.35, run(sim){splitN(sim,1);},
      see: 'Now the reverse: a water flies to a bond and splits, giving –H to one glucose and –OH to the other. The bond breaks.',
      why: 'This is <b>hydrolysis</b>: splitting with water. It puts back the exact water that building took out.',
      overlay(sim,ctx,LH,k){tag(ctx,'H₂O goes IN and breaks the bond',300,206,k,{s:13,hi:true});} },
    { key: 'digest', title: 'This is digestion', set: { startAs: 'chain' }, fresh: true, speed: 0.8, run(sim){splitN(sim,5);},
      see: 'The whole chain is cut, one bond and one water at a time, until six glucose float free.',
      why: 'Your gut absorbs only single sugars, so digestion is hydrolysis. The glucose goes into your blood.',
      overlay(sim,ctx,LH,k){foodCard(ctx,k,['cracker'],['Waters used: '+sim.st.win+'   Bonds cut: '+sim.st.win,'Chewing starts this; your small intestine finishes it'],{y:126,h:62,w:430});} },
    { key: 'protein', title: 'Proteins: the same trick', set: { mono: 'amino' }, fresh: true, speed: 1, run: joinN,
      see: 'Now the monomers are <b>amino acids</b>. They join the same way, one water per bond, into a <b>polypeptide</b> that folds into a protein.',
      why: 'You digest protein into amino acids, then rebuild them into your own proteins, like muscle and enzymes.',
      overlay(sim,ctx,LH,k){foodCard(ctx,k,['egg','beans'],['Protein you eat: eggs, beans, meat, milk','Cut into amino acids, then rebuilt into your proteins'],{y:126,h:62});} },
    { key: 'fat', title: 'Fats: three tails, not a chain', set: { mono: 'fat' }, fresh: true, speed: 1, run: joinN,
      see: 'A fat: one <b>glycerol</b> (gray bar) joins 3 <b>fatty acid</b> tails, releasing 3 waters.',
      why: 'Same water-releasing reaction, but a fat is not a polymer: it stops at 3 tails. Oils and butter are these <b>triglycerides</b>.',
      overlay(sim,ctx,LH,k){foodCard(ctx,k,['oil','butter'],['Fats you eat: oil, butter','One glycerol + 3 fatty acids'],{x:30,y:136,w:330});} },
    { lvl: 'honors', key: 'enzyme', title: 'Enzymes do the cutting', set: { start: 8, startAs: 'chain', enzyme: true }, fresh: true, speed: 0.8,
      see: 'The purple enzyme (amylase) grabs a bond and a water and splits them, again and again.',
      why: 'Hydrolysis alone is very slow. Enzymes hold bond and water just right. Each fits one bond: amylase cuts starch, lactase cuts lactose.',
      overlay(sim,ctx,LH,k){tag(ctx,'Each enzyme fits one kind of bond',300,206,k,{s:13,hi:true});} },
    { lvl: 'ap', key: 'mass', title: 'Keeping the books', set: { start: 5 }, fresh: true, speed: 0.8, run: joinN,
      see: 'Five glucose join. The card tracks the chain’s mass as each water leaves.',
      why: 'Each water takes 18.02 g/mol, so n monomers weigh n × M − (n − 1) × 18.02. Five glucose: 5 × 180.16 − 4 × 18.02 = 828.7 g/mol.',
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
      see: 'One water molecule, hugely enlarged: oxygen (red) holds two hydrogens (white) in a bent V, about 0.28 nm wide.',
      why: 'Oxygen pulls electrons toward itself, so it is slightly negative (δ−) and the hydrogens slightly positive (δ+). Water is <b>polar</b>.',
      overlay(sim,ctx,LH,k){const A=sim.def.art;wPanel(ctx,sim);bigWater(ctx,A.MX,A.MY-24,1.35,Math.PI);
        tag(ctx,'δ−  oxygen',A.MX,A.MY+50,k,{s:13,hi:true,c:'#b3261e'});tag(ctx,'δ+  hydrogen',A.MX-92,A.MY-112,k,{s:13,c:'#1b4f8a'});tag(ctx,'δ+  hydrogen',A.MX+92,A.MY-112,k,{s:13,c:'#1b4f8a'});
        tag(ctx,'104.5° bend, about 0.28 nm wide',A.MX,A.MY+110,k,{s:12});} },
    { key: 'hbond', title: 'Opposite ends attract', pause: true,
      see: 'Back in the ice zoom, a dashed line joins one molecule’s δ+ hydrogen to a neighbor’s δ− oxygen.',
      why: 'Opposite charges attract. That pull is a <b>hydrogen bond</b>: weak, easily broken, but trillions in every drop.',
      overlay(sim,ctx,LH,k,tau){const A=sim.def.art,v=sim.vis;if(!v.mol||!v.edges)return;let best=null,bd=1e9;v.edges.forEach(e=>{const a=v.mol[e[0]],b=v.mol[e[1]],d=Math.hypot((a.x+b.x)/2-A.MX,(a.y+b.y)/2-A.MY);if(d<bd){bd=d;best=[a,b];}});
        if(best){const pu=0.5+0.5*Math.sin(tau*4),a=best[0],b=best[1];a.ang=Math.atan2(b.y-a.y,b.x-a.x)-0.91;ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=3;ctx.globalAlpha=0.6+0.4*pu;[a,b].forEach(m=>{ctx.beginPath();ctx.arc(m.x,m.y,17,0,6.29);ctx.stroke();});
          ctx.lineWidth=4;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(a.x+Math.cos(a.ang+0.91)*10,a.y+Math.sin(a.ang+0.91)*10);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();line(ctx,A.MX,A.MY+A.MR-38,(a.x+b.x)/2,(a.y+b.y)/2+10,'#c8102e');
          tag(ctx,'hydrogen bond: δ+ H pulled toward δ− O',A.MX,A.MY+A.MR-26,k,{s:12,hi:true});}} },
    { key: 'ice', title: 'Ice: a locked lattice', speed: 0.1, run(sim){wSetT(sim,-20);},
      see: 'In ice, each molecule holds four neighbors in six-sided rings. As the plate heats it, the molecules shake harder in place.',
      why: 'Temperature measures molecular motion. In ice, hydrogen bonds let molecules only vibrate.',
      so: 'Those six-sided rings are why snowflakes have six sides.',
      overlay(sim,ctx,LH,k){const A=sim.def.art;tag(ctx,'open six-sided rings',A.MX,A.MY-A.MR+20,k,{s:12,hi:true});} },
    { key: 'melt', title: 'Melting: stuck at 0 °C', speed: 0.6, run(sim){wSet(sim,'melt',0);},
      see: 'The ice melts. Energy keeps going in, but the thermometer stays at 0.0 °C.',
      why: 'The heat breaks hydrogen bonds instead of speeding molecules up: 334 J per gram of ice.',
      so: 'That is why a cooler stays near 0 °C.',
      overlay(sim,ctx,LH,k){const c=sim.st.cur;wCard(ctx,k,[['Energy in: '+wE(sim).toFixed(1)+' kJ',700],['Temperature: '+c.T.toFixed(1)+' °C'],['Melted: '+Math.round((c.ph==='melt'?c.f:c.ph==='solid'?0:1)*100)+'%']]);} },
    { key: 'float', title: 'Ice floats', speed: 0.15, run(sim){wSet(sim,'melt',0.45);},
      see: 'The ice cubes float. The circle shows a frozen lake from the side: ice on top, liquid water below.',
      why: 'Open rings make ice less dense (0.92 g/mL vs 1.00), so lakes freeze from the top and the ice lid protects the water below.',
      overlay(sim,ctx,LH,k){const A=sim.def.art,x0=A.MX-A.MR,y0=A.MY-A.MR,W=2*A.MR;ctx.save();ctx.beginPath();ctx.arc(A.MX,A.MY,A.MR,0,6.29);ctx.clip();
        ctx.fillStyle='#cfe2f2';ctx.fillRect(x0,y0,W,110);ctx.fillStyle='#3d6f9e';ctx.fillRect(x0,y0+110,W,W);ctx.fillStyle='#e9f5fb';ctx.fillRect(x0,y0+96,W,22);ctx.strokeStyle='#9cc3dc';ctx.lineWidth=1.5;ctx.strokeRect(x0-2,y0+96,W+4,22);
        ctx.fillStyle='#6b5a3c';ctx.beginPath();ctx.moveTo(x0,y0+W);ctx.quadraticCurveTo(A.MX,y0+W-90,x0+W,y0+W);ctx.fill();
        [[A.MX-40,A.MY+40],[A.MX+50,A.MY+70]].forEach(([fx,fy])=>{ctx.fillStyle='#c9a227';ctx.beginPath();ctx.ellipse(fx,fy,16,6,0,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(fx+14,fy);ctx.lineTo(fx+24,fy-6);ctx.lineTo(fx+24,fy+6);ctx.fill();});ctx.restore();
        tag(ctx,'ice: 0.92 g/mL (floats)',A.MX,y0+86,k,{s:12,hi:true});tag(ctx,'liquid water below stays about 4 °C',A.MX,A.MY+8,k,{s:12});tag(ctx,'1.00 g/mL',150,330,k,{s:12});} },
    { key: 'warm', title: 'Water warms up slowly', speed: 0.3, run(sim){wSetT(sim,20);},
      see: 'Liquid water at 20 °C heats up. The card shows energy in and temperature rise.',
      why: 'Warming 1 g by 1 °C takes 4.18 J, water’s high <b>specific heat</b>. Sand needs only about 0.8 J.',
      so: 'That is why beach sand burns.',
      overlay(sim,ctx,LH,k){const c=sim.st.cur;wCard(ctx,k,[['Energy in: '+wE(sim).toFixed(1)+' kJ',700],['Warmed: +'+Math.max(0,c.T-20).toFixed(1)+' °C'],['4.18 J per g per °C']]);} },
    { key: 'boil', title: 'Boiling: stuck at 100 °C', speed: 3, run(sim){wSet(sim,'boil',0);},
      see: 'At 100 °C the water boils. Steam bubbles rise and the thermometer holds at 100 °C while the level drops.',
      why: 'Becoming gas means breaking every hydrogen bond: 2,260 J per gram, about 7 times melting.',
      so: 'In Denver water boils at about 95 °C.',
      overlay(sim,ctx,LH,k){const c=sim.st.cur;wCard(ctx,k,[['Energy in: '+wE(sim).toFixed(1)+' kJ',700],['Temperature: '+c.T.toFixed(1)+' °C'],['Boiled away: '+Math.round((c.ph==='boil'?c.f:c.ph==='gas'?1:0)*100)+'%']]);} },
    { key: 'hcurve', title: 'The heating curve', speed: 0.25,
      see: 'Temperature vs heat added to 1 g, from −20 °C ice to steam. Two flat steps: melting at 0 °C, boiling at 100 °C.',
      why: 'On flat parts, heat breaks hydrogen bonds instead of raising temperature. Boiling takes about 7 times longer.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg;K.dim(ctx,LH);const p=tau%13,kk=Math.min(k,1.25);
        /* constants from sims/water.js: cs 2.09, cl 4.18, cg 2.01 J/g·°C; Lf 334, Lv 2260 J/g; 1 g from −20 to 120 °C */
        const seg=[[20*2.09,-20,0],[334,0,0],[100*4.18,0,100],[2260,100,100],[20*2.01,100,120]],tot=seg.reduce((a,s)=>a+s[0],0);
        const B={x0:110,x1:740,y0:70,y1:360},xr=[0,tot],T=E=>{let e=E;for(const [d,a,b] of seg){if(e<=d)return a+(b-a)*e/d;e-=d;}return 120;},Yr=t=>(t+20)/140;
        K.axes(ctx,B,k,{xr,xt:[[0,'0'],[1000,'1,000'],[2000,'2,000'],[3000,'3,000']],yt:[[Yr(-20),'−20'],[Yr(0),'0'],[Yr(50),'50'],[Yr(100),'100'],[Yr(120),'120']],xl:'Heat added to 1 g (J)',yl:'Temperature (°C)'});
        const to=p<8?tot*p/8:tot;K.curve(ctx,B,xr,E=>Yr(T(E)),to,'#2a6fdb');
        if(p<8)K.dot(ctx,K.X(B,xr,to),K.Y(B,Yr(T(to))),'#c8102e',7);
        else{const m0=K.X(B,xr,seg[0][0]+167),b0=K.X(B,xr,seg[0][0]+334+418+1130);
          K.tagA(ctx,'Melting: 334 J',K.X(B,xr,60),K.Y(B,Yr(0))+30,k,{s:12.5,hi:true},'l');K.tag(ctx,'Boiling: 2,260 J',b0,K.Y(B,Yr(100))-28,k,{s:12.5,hi:true});
          K.tagA(ctx,'Water warms',K.X(B,xr,seg[0][0]+334+209)+14,K.Y(B,Yr(50)),k,{s:12},'l');}
        K.tag(ctx,'Heating curve of water',400,36,k);} },
    { key: 'steam', title: 'Steam gives the heat back', set: { dir: 'cool' }, speed: 3, run(sim){wSet(sim,'boil',1);},
      see: 'The plate cools the steam. It condenses, and the thermometer holds at 100 °C again.',
      why: 'Re-forming hydrogen bonds releases the same 2,260 J per gram, wherever the steam condenses.',
      so: 'That is why steam burns worse than boiling water.',
      overlay(sim,ctx,LH,k){const c=sim.st.cur;wCard(ctx,k,[['Heat released: '+(-wE(sim)).toFixed(1)+' kJ',700],['Temperature: '+c.T.toFixed(1)+' °C']]);} },
    { lvl: 'honors', key: 'ethanol', title: 'Ethanol for comparison', set: { sub: 'ethanol' }, speed: 0.6, run(sim){wSetT(sim,20);},
      see: 'Now ethanol on the same heater, from 20 °C. It warms much faster and boils at just 78 °C.',
      why: 'Ethanol forms about half as many hydrogen bonds, so less heat goes into bonds: specific heat 2.44 J/g·°C.',
      overlay(sim,ctx,LH,k){const c=sim.st.cur;wCard(ctx,k,[['Ethanol',700],['Warmed: +'+Math.max(0,c.T-20).toFixed(1)+' °C'],['2.44 J per g per °C']]);} },
    { lvl: 'ap', key: 'latent', title: 'Measure the heat of fusion', speed: 0.6, run(sim){wSet(sim,'melt',0);},
      see: 'The melt again. The card divides energy added by mass while the temperature holds at 0 °C.',
      why: 'In a phase change, energy breaks bonds instead of raising temperature. Energy ÷ mass = heat of fusion: 334 J/g.',
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
      see: 'Eight known foods and four mystery samples, about life size. The first tube is plain water.',
      why: 'Water has none of the nutrients, so its color is what “no” looks like: the <b>negative control</b>. A result counts only if it differs from water.',
      overlay(sim,ctx,LH,k){fTubeTag(ctx,k,0,'negative control');fCard(ctx,k,'Four reagents, four questions');[['Iodine','starch?','#c8892e'],['Biuret','protein?','#4b7fd8'],['Benedict’s','sugar?','#2f63c9'],['Sudan III','fat?','#d84a4a']].forEach(([n,q,c],i)=>{const x=306+i*120;ctx.fillStyle=c;H.rr(ctx,x,48,18,30,4);ctx.fill();H.txt(ctx,n,x+26,60,{s:12*k,w:700});H.txt(ctx,q,x+26,78,{s:12*k,c:PAL['cv-soft']});});} },
    { key: 'iodine', title: 'Iodine finds starch', set: { reagent: 'iodine' }, speed: 1, run(sim){fAct(sim,'addAll');},
      see: 'Amber iodine goes in. The starch and potato tubes turn blue-black; the rest stay amber.',
      why: 'Starch coils into a spring, and iodine packed inside the coil looks blue-black. No coil, no color change.',
      so: 'Bread, rice and pasta would turn dark too.',
      overlay(sim,ctx,LH,k){fCard(ctx,k,'Iodine tucks into the starch coil','Colors are labels. Starch itself is white; iodine packed in the coil looks blue-black.');helix(ctx,300,70,300);
        ctx.fillStyle='#3a2f6e';for(let x=318;x<590;x+=20){ctx.beginPath();ctx.arc(x,70,4.5,0,6.29);ctx.fill();}H.txt(ctx,'→ blue-black',620,74,{s:13*k,w:700,c:'#1e1b3b'});
        fTubeTag(ctx,k,2,'starch');fTubeTag(ctx,k,6,'potato');} },
    { key: 'biuret', title: 'Biuret finds protein', set: { reagent: 'biuret' }, speed: 1, run(sim){fAct(sim,'addAll');},
      see: 'Blue Biuret goes in. Egg white turns violet, milk and potato lilac, the rest stay blue.',
      why: 'Copper in Biuret grabs the peptide bonds in protein and turns violet. More protein, deeper violet.',
      so: 'Meat, beans and yogurt would turn violet too.',
      overlay(sim,ctx,LH,k){fCard(ctx,k,'Copper grabs the peptide bonds in a protein','Copper (Cu²⁺) is blue on its own and violet when it holds a protein chain.');
        ctx.strokeStyle='#3f6fb0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(300,64);for(let i=0;i<8;i++)ctx.lineTo(320+i*36,i%2?78:58);ctx.stroke();
        for(let i=1;i<8;i+=2){ctx.fillStyle='#3f6fb0';ctx.beginPath();ctx.arc(320+i*36,78,5,0,6.29);ctx.fill();}
        ctx.fillStyle='#7b3fb0';[356,500].forEach(x=>{ctx.strokeStyle='#7b3fb0';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,78);ctx.lineTo(x+18,89);ctx.lineTo(x+36,78);ctx.stroke();ctx.fillStyle='#7b3fb0';ctx.beginPath();ctx.arc(x+18,89,8,0,6.29);ctx.fill();H.txt(ctx,'Cu',x+18,90,{s:8.5,w:700,c:'#fff',a:'center',b:'middle'});});
        H.txt(ctx,'→ violet',620,74,{s:13*k,w:700,c:'#7b3fb0'});fTubeTag(ctx,k,3,'egg white');fTubeTag(ctx,k,5,'milk');} },
    { key: 'benedict', title: 'Benedict’s: nothing yet', set: { reagent: 'benedict' }, speed: 1, run(sim){fAct(sim,'addAll');},
      see: 'Blue Benedict’s goes into every tube, even glucose and apple juice. Every tube stays blue.',
      why: 'Benedict’s only reacts when hot. Read it cold and you get a <b>false negative</b>: the sugar is there, but the test says no.',
      overlay(sim,ctx,LH,k){fCard(ctx,k,'Benedict’s needs heat','Cold: the copper stays as blue Cu²⁺ ions, even with plenty of sugar.');fTubeTag(ctx,k,1,'glucose: still blue');} },
    { key: 'heat', title: 'Into the hot water bath', set: { reagent: 'benedict' }, speed: 1, run(sim){fAct(sim,'heat');},
      see: 'The rack goes into an 80 °C bath. Sugary tubes turn green, yellow, orange, then brick red. Water and starch stay blue.',
      why: 'Hot glucose turns blue copper ions into a red-orange solid. More sugar, more solid.',
      overlay(sim,ctx,LH,k){fCard(ctx,k,'Sugar + heat turns blue copper into a red solid','Benedict’s colors are real: Cu²⁺ is blue and copper(I) oxide is brick red.');
        [['#2f63c9','none'],['#3f9d4a','trace'],['#d9c22e','low'],['#e07a22','medium'],['#a8341f','high']].forEach(([c,l],i)=>{const x=300+i*96;ctx.fillStyle=c;H.rr(ctx,x,48,26,32,5);ctx.fill();H.txt(ctx,l,x+32,68,{s:12*k,c:PAL['cv-ink']});});
        fTubeTag(ctx,k,1,'glucose');fTubeTag(ctx,k,7,'apple juice');} },
    { key: 'sudan', title: 'Sudan III finds fat', set: { reagent: 'sudan' }, speed: 1, run(sim){fAct(sim,'addAll');},
      see: 'Red Sudan III goes in. Oil and milk get a red layer on top; the rest turn pale pink with no layer.',
      why: 'The dye dissolves in fat, which floats. Pink alone isn’t fat: glucose looks just like the water control. Always compare with the control.',
      overlay(sim,ctx,LH,k,tau){ringRect(ctx,62-20,142,40,168);ringRect(ctx,124-20,142,40,168);tag(ctx,'pink, no layer = same as water',140,372,Math.min(k,1.1),{s:12,c:TK()});thinkBadge(ctx,'compare','Compared to what?',k,tau,{x:520,y:410});fCard(ctx,k,'The dye dissolves in fat, and fat floats','Oil drops collect the red dye and rise to the top.');
        ctx.fillStyle='#d9ecf5';H.rr(ctx,300,46,240,48,6);ctx.fill();ctx.fillStyle='#c8332e';H.rr(ctx,300,46,240,14,6);ctx.fill();[[340,78],[420,84],[480,72]].forEach(([x,y])=>{ctx.fillStyle='#e05a4a';ctx.beginPath();ctx.arc(x,y,6,0,6.29);ctx.fill();});
        H.txt(ctx,'red layer = fat',556,74,{s:13*k,w:700,c:'#c8332e'});fTubeTag(ctx,k,4,'oil');fTubeTag(ctx,k,5,'milk');} },
    { key: 'unknown', title: 'Identify a mystery food', speed: 1, run(sim){const st=sim.st;['iodine','biuret','benedict','sudan'].forEach(r=>st.tubes[r].forEach(tb=>{tb.added=1;tb.mix=1;tb.heat=5;tb.delay=0;}));BioLab.setValues(sim,{reagent:'benedict',tube:'8'});},
      see: 'All four tests are done. Unknown A is selected, and the card lists its four results.',
      why: 'One test answers one question. Match the pattern of + and − to the known foods; each + is one nutrient.',
      overlay(sim,ctx,LH,k){const res=sim.st.res[8]||{},nm={iodine:'starch',biuret:'protein',benedict:'sugar',sudan:'fat'};fCard(ctx,k,'Unknown A: four results, one food');
        ['iodine','biuret','benedict','sudan'].forEach((r,i)=>{const o=res[r],x=300+i*122;ctx.fillStyle=o?o.col:'#ddd';H.rr(ctx,x,48,18,30,4);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.25)';ctx.stroke();H.txt(ctx,nm[r],x+26,60,{s:12*k,w:700});H.txt(ctx,o?(o.pos?'+ yes':'− no'):'…',x+26,78,{s:12*k,w:700,c:o&&o.pos?'#1b7a3a':PAL['cv-soft']});});
        fTubeTag(ctx,k,8,'A');} },
    { lvl: 'ap', key: 'sucrose', title: 'Why table sugar stays blue', speed: 1,
      see: 'Glucose and apple juice turned brick red. Table sugar (sucrose) stays blue even after heating.',
      why: 'Benedict’s needs a <b>reducing sugar</b> with a free reactive end. Sucrose’s bond ties up both ends until it is hydrolyzed.',
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
      see: 'Lemon juice near 2, water at 7, blood just above 7, bleach near 12.5, on a bar of real indicator colors.',
      why: 'pH counts H⁺. Lower is more <b>acidic</b>; above 7 is <b>basic</b>. Each step is ten times: pH 5 has 100 times the H⁺ of pH 7.',
      overlay(sim,ctx,LH,k){ctx.save();ctx.fillStyle=PAL['cv-bg'];H.rr(ctx,330,10,250,432,10);ctx.fill();ctx.restore();H.txt(ctx,'pH of things you know',342,32,{s:13*k,w:700});
        let prevY=30;PH_THINGS.forEach(([n,p])=>{const yb=phY(p);let y=Math.max(yb,prevY+28);prevY=y;H.txt(ctx,n+'  '+p,342,y+4,{s:12*k,w:600});ctx.save();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(500,y);ctx.lineTo(560,y);ctx.lineTo(598,yb);ctx.stroke();ctx.restore();});} },
    { key: 'water', title: 'Acid into pure water', set: { sol: 'water', reag: 'acid' }, fresh: true, speed: 0.3, run(sim){phDrops(sim,5);},
      see: 'Five drops of acid go into 50 mL of pure water. The meter drops from 7.00 to about 3.3, and the indicator turns red.',
      why: 'Pure water has nothing to catch the H⁺, so all of it stays free: about 5,000 times more H⁺.',
      overlay(sim,ctx,LH,k){const p=phM(sim,'ph');phCard(ctx,k,[['pH '+p.toFixed(2),700,15],[phTimes(p)]]);} },
    { key: 'free', title: 'Nothing catches the H⁺', pause: true,
      see: 'The middle panel shows where the added H⁺ went: in pure water, every one floats free.',
      why: 'Free H⁺ makes a liquid acidic. With nothing to grab it, a little acid makes a huge change.',
      overlay(sim,ctx,LH,k){tag(ctx,'every H⁺ stays free',454,236,k,{s:12,hi:true});} },
    { key: 'buffer', title: 'A buffer catches H⁺', set: { sol: 'cell', reag: 'acid' }, fresh: true, speed: 0.3, run(sim){phDrops(sim,5);},
      see: 'The same 5 drops go into phosphate buffer. The middle panel shows each H⁺ caught. The meter slips only from 7.20 to 7.16.',
      why: 'A <b>buffer</b> soaks up extra acid or base. HPO₄²⁻ grabs each H⁺, so it can’t float free and the pH barely moves.',
      overlay(sim,ctx,LH,k){const p=phM(sim,'ph');phCard(ctx,k,[['pH '+p.toFixed(2),700,15],['buffer caught almost all of it']]);tag(ctx,'HPO₄²⁻ + H⁺ → H₂PO₄⁻',454,236,k,{s:12,hi:true});} },
    { key: 'blood', title: 'Blood’s buffer uses your lungs', set: { sol: 'blood', reag: 'acid', lungs: true }, fresh: true, speed: 0.3, run(sim){phDrops(sim,5);},
      see: 'Blood’s buffer, with breathing on. The same 5 drops barely move the pH from 7.40.',
      why: 'HCO₃⁻ + H⁺ → H₂CO₃ → CO₂ + H₂O. Your lungs breathe the CO₂ out, so the buffer stays balanced.',
      so: 'That is one reason you breathe hard during exercise.',
      overlay(sim,ctx,LH,k){const p=phM(sim,'ph');phCard(ctx,k,[['pH '+p.toFixed(2),700,15],['lungs carry the CO₂ away']]);} },
    { key: 'sealed', title: 'Too much acid: acidosis', set: { sol: 'blood', reag: 'acid', lungs: false }, fresh: true, speed: 0.3, run(sim){phDrops(sim,30);},
      see: 'Blood buffer in a sealed beaker, 30 drops. CO₂ can’t escape, and the pH falls to about 6.8.',
      why: 'Blood must stay between 7.35 and 7.45. Below that is <b>acidosis</b>: proteins and enzymes stop working. A buffer can only absorb so much.',
      overlay(sim,ctx,LH,k){const p=phM(sim,'ph');phCard(ctx,k,[['pH '+p.toFixed(2),700,15,p<7.35?'#b3261e':PAL['cv-ink']],[p<7.35?'below 7.35: acidosis':'inside the safe range']]);ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=3;ctx.strokeRect(598,phY(7.35),28,phY(7.45)-phY(7.35));ctx.restore();} },
    { key: 'stomach', title: 'Enzymes need their pH', set: { sol: 'stomach', enz: 'pepsin' }, fresh: true, pause: true,
      see: 'Stomach acid, pH 2. The bottom panel shows pepsin, the stomach’s protein-cutting enzyme, at its best.',
      why: 'pH changes the charges that hold an enzyme’s shape. Pepsin is built for pH 2; at blood’s 7.4 it is near 0%.',
      overlay(sim,ctx,LH,k){tag(ctx,'pepsin: built for pH 2',454,276,k,{s:12,hi:true});} },
    { key: 'antacid', title: 'Neutralizing acid', set: { sol: 'stomach', reag: 'base', enz: 'pepsin' }, fresh: true, speed: 0.4, run(sim){phDrops(sim,100);},
      see: '100 drops of base go into the stomach acid. The pH jumps toward 7, the indicator turns green, and pepsin nearly stops.',
      why: 'H⁺ + OH⁻ → H₂O: <b>neutralization</b>. Heartburn antacids do this with weaker bases like calcium carbonate.',
      overlay(sim,ctx,LH,k){const p=phM(sim,'ph');phCard(ctx,k,[['pH '+p.toFixed(2),700,15],['H⁺ + OH⁻ → H₂O']]);} },
    { lvl: 'ap', key: 'hh', title: 'Henderson–Hasselbalch', set: { sol: 'blood', lungs: false }, fresh: true, pause: true,
      see: 'Fresh blood buffer. The card reads the buffer pair from the model.',
      why: 'pH = pKa + log([HCO₃⁻] ÷ [CO₂]) = 6.1 + log(24 ÷ 1.2) = 7.40. Lungs and kidneys hold that ratio near 20.',
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
      see: 'One carbon atom: a nucleus of 6 protons (red, +) and 6 neutrons (gray), with 6 electrons (yellow, −) in shells.',
      why: 'Six protons make it carbon. Not to scale: if the atom were a football field, the nucleus would be a grain of sand.',
      overlay(sim,ctx,LH,k,tau){lbRing(ctx,350,236,30,tau);tag(ctx,'nucleus (drawn far too big)',350,186-20,k,{s:12,hi:true});} },
    { key: 'isotope', title: 'Same element, extra neutrons', set: { view: 'atom', el: 'C', iso: '2', hl: 2 }, fresh: true, pause: true,
      see: 'Carbon-14 has 8 neutrons but still 6 protons. The 16-atom sample shows 4 still radioactive after 2 half-lives.',
      why: 'Extra neutrons make it unstable. Half decays every 5,700 years, which is how scientists date bones and wood.',
      overlay(sim,ctx,LH,k){tag(ctx,'2 half-lives = 11,400 years: ¼ left',110,232-90,k,{s:12,hi:true});} },
    { key: 'share1', title: 'Sharing one pair', set: { view: 'build', ctr: 'C', nH: 1 }, fresh: true, pause: true,
      see: 'One hydrogen joins carbon, and they share a pair: one electron from C (yellow) and one from H (blue).',
      why: 'A shared pair is a <b>covalent bond</b>. Both atoms count it, moving each closer to a full outer shell.',
      overlay(sim,ctx,LH,k,tau){lbRing(ctx,334,228,14,tau);tag(ctx,'one shared pair = one bond',334,182,k,{s:12,hi:true});} },
    { key: 'share4', title: 'Carbon makes four bonds', set: { view: 'build', ctr: 'C', nH: 4 }, fresh: true, pause: true,
      see: 'Four hydrogens attached. The side panel counts 8 electrons around carbon: a full shell. This is methane, CH₄.',
      why: 'Carbon has 4 valence electrons, so it makes 4 bonds, enough for chains and rings: the backbone of life.'},
    { key: 'oxygen', title: 'Oxygen makes two', set: { view: 'build', ctr: 'O', nH: 2 }, fresh: true, pause: true,
      see: 'Oxygen in the center: with 6 outer electrons it needs only 2 hydrogens to reach 8. That is water, with two lone pairs.',
      why: 'Count valence electrons: C makes 4 bonds, N 3, O 2. The lone pairs give water its bent shape.'},
    { key: 'polar', title: 'Uneven sharing: polar', set: { view: 'mol', mol: 'water', wet: false }, fresh: true, pause: true,
      see: 'Red arrows show the shared electrons pulled toward oxygen: oxygen is δ−, each hydrogen δ+.',
      why: 'Oxygen pulls much harder than hydrogen (3.44 vs 2.20). Uneven sharing is a <b>polar covalent</b> bond.',
      overlay(sim,ctx,LH,k){lbArrow(ctx,178,248,234,204);lbArrow(ctx,364,248,308,204);tag(ctx,'electrons pulled toward O',271,140,k,{s:12,hi:true});} },
    { key: 'nonpolar', title: 'Even sharing: nonpolar', set: { view: 'mol', mol: 'butane', wet: true }, fresh: true, speed: 0.5,
      see: 'A carbon-hydrogen chain in water. The water gathers around but clings to itself, not the chain.',
      why: 'C–H bonds share evenly: <b>nonpolar</b>, no charged ends. Fat tails are chains like this, so grease won’t dissolve in water or blood.',
      overlay(sim,ctx,LH,k){tag(ctx,'water leaves the C–H chain out',275,386,k,{s:12,hi:true});} },
    { key: 'ionic', title: 'Handing over an electron', set: { view: 'mol', mol: 'salt', wet: true }, fresh: true, speed: 0.4,
      see: 'Salt in water: sodium handed its electron to chlorine, making Na⁺ (purple) and Cl⁻ (green). Water pulls the ions apart.',
      why: 'Opposite charges attract: an <b>ionic bond</b>. Water’s charged ends out-pull the crystal, so salt dissolves.',
      overlay(sim,ctx,LH,k){tag(ctx,'water’s O ends face Na⁺; H ends face Cl⁻',275,386,k,{s:12,hi:true});} },
    { key: 'hbond', title: 'Hydrogen bonds between molecules', set: { view: 'hb', hb: 'water' }, fresh: true, speed: 0.4,
      see: 'Liquid water, zoomed in. Each dashed line is a hydrogen bond, flickering as it breaks and re-forms.',
      why: 'A δ+ hydrogen pulls on a δ− oxygen of another molecule. About 20 times weaker than a covalent bond, but there are so many.'},
    { key: 'dna', title: 'Hydrogen bonds pair DNA', set: { view: 'hb', hb: 'dna', gc: 4 }, fresh: true, pause: true, run(sim){for(let i=0;i<3;i++)fAct(sim,'unzip');},
      see: 'Two DNA strands, top 3 pairs unzipped. A–T pairs share 2 hydrogen bonds; G–C pairs share 3.',
      why: 'Weak hydrogen bonds let enzymes unzip DNA, while each strand’s covalent backbone stays whole.',
      so: 'Heating to 95 °C splits the strands in PCR tests.'},
    { lvl: 'ap', key: 'oil', title: 'The hydrophobic effect', set: { view: 'hb', hb: 'oil' }, fresh: true, speed: 0.5, run(sim){fAct(sim,'shake');},
      see: 'Shaken oil breaks into small drops, then the drops merge back together.',
      why: 'Water hydrogen-bonds to itself, squeezing nonpolar chains together. The same effect builds membranes and folds proteins.'},
    { lvl: 'ap', key: 'protein', title: 'Hydrogen bonds shape proteins', set: { view: 'hb', hb: 'protein' }, fresh: true, pause: true,
      see: 'A protein β-sheet: two strands held side by side by hydrogen bonds between C=O and N–H groups.',
      why: 'Heat breaks these weak bonds and the protein unfolds (denatures), but its amino acid sequence stays. That is why egg white turns solid.'}
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
      see: 'One water molecule: shared electron pairs in the O–H bonds, two lone pairs on oxygen. Oxygen is δ−, the hydrogens δ+.',
      why: 'Oxygen pulls shared electrons harder, so water has charged ends: it is <b>polar</b>. Red and white are just labels.'},
    { key: 'neighbors', title: 'Hydrogen bonds', set: { station: '0' }, speed: 0.5, run(sim){wpGo(sim,'clearN','neighbor','neighbor','neighbor','neighbor');},
      see: 'Four neighbors join. Each dashed line is a hydrogen bond. The inset compares it with the O–H bond inside.',
      why: 'About 20 times weaker than a covalent bond, but each molecule makes up to 4. Every station today runs on these bonds.'},
    { key: 'ice', title: 'Station 1: ice floats', set: { station: '1' }, speed: 1, run(sim){wpGo(sim,'iceDrop','winter');},
      see: 'An ice cube floats mostly underwater, and the lake freezes from the top while the water below stays liquid.',
      why: 'Hydrogen bonds lock ice into an open honeycomb about 9% bigger than liquid water, so ice floats and insulates the lake.'},
    { key: 'cohesion', title: 'Station 2: cohesion', set: { station: '2', pennyLiquid: 'water' }, speed: 1, run(sim){wpGo(sim,'dry','auto');},
      see: 'Drops pile onto the penny into a dome far above the rim before it spills.',
      why: 'Water molecules hydrogen-bond to each other, so the drop holds together: <b>cohesion</b>. Alcohol fits far fewer drops.',
      so: 'Cohesion is why raindrops are round and water beads up on a waxed car.' },
    { key: 'adhesion', title: 'Station 3: adhesion', set: { station: '3' }, speed: 1, run(sim){wpGo(sim,'newTowel','hang');},
      see: 'A paper towel touches the water, and the water climbs it against gravity.',
      why: 'Water sticks to polar cellulose (<b>adhesion</b>), and cohesion drags more along: <b>capillary action</b>.',
      so: 'The same pull helps lift water up plant stems.'},
    { key: 'tension', title: 'Station 4: surface tension', set: { station: '4', clipLiquid: 'water' }, speed: 1, run(sim){wpGo(sim,'removeClip','clip');},
      see: 'A steel paperclip rests on the water, dimpling it without sinking, though steel is about 8 times denser.',
      why: 'Surface molecules hold extra tight to their neighbors, making a stretchy skin: <b>surface tension</b>. Soap breaks it.',
      so: 'That is how water striders walk on ponds.'},
    { key: 'heat', title: 'Station 5: high specific heat', set: { station: '5' }, speed: 1, run(sim){wpGo(sim,'cool','heat');},
      see: 'Three liquids on identical hot plates. Water warms slowest; alcohol boils first.',
      why: 'Heat first tugs on hydrogen bonds, so water needs 4.18 J to warm 1 g by 1 °C: a high <b>specific heat</b>.',
      so: 'That is why lakes keep nearby weather mild.'},
    { key: 'evap', title: 'Heat of evaporation', set: { station: '9' }, speed: 1, run(sim){wpGo(sim,'dryAll','wet');},
      see: 'Three thermometers before a fan: dry, wet cloth and alcohol cloth. The wet ones cool below room temperature.',
      why: 'The fastest molecules break their hydrogen bonds and leave, carrying heat: 2,260 J per gram of water.',
      so: 'That is how sweat cools you.'},
    { key: 'solvent', title: 'Station 6: the universal solvent', set: { station: '6' }, speed: 1, run(sim){wpGo(sim,'emptyBeaker','salt','oil','stir');},
      see: 'Salt disappears into the water when stirred, but oil stays in its own layer on top.',
      why: 'Water’s charged ends surround each ion and pull the crystal apart. Nonpolar oil is left out.',
      so: 'That is how blood carries salts and sugars.'},
    { key: 'balloon', title: 'Station 7: polarity you can see', set: { station: '7', streamLiquid: 'water' }, speed: 1, run(sim){wpGo(sim,'rub','closer');},
      see: 'A balloon rubbed on hair bends a thin stream of water toward it. Oil barely moves.',
      why: 'The charged balloon pulls on water’s oppositely charged ends. Oil has no charged ends to pull.'},
    { key: 'buffer', title: 'Station 8: acids, bases and buffers', set: { station: '8' }, speed: 1, run(sim){wpGo(sim,'buffer','acid5');},
      see: 'Five drops of acid go into plain water and into a buffer. The plain water’s pH crashes; the buffer’s barely moves.',
      why: 'A buffer catches extra H⁺. Blood’s bicarbonate buffer keeps it between pH 7.35 and 7.45.'}
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
      see: 'One plant cell, about 50 µm long. Olive line: the <b>cell wall</b>. Green edge: the <b>membrane</b>. Blue: the <b>vacuole</b> of sap, with brown dissolved particles.',
      why: 'The membrane holds the particles in; the wall stops the cell stretching too far.',
      overlay(sim,ctx,LH,k){scaleBar(ctx,52,400,83,'20 µm',k);tag(ctx,'cell wall (stiff)',330,150,k,{s:12});line(ctx,330,162,300,198);
        tag(ctx,'membrane',96,190,k,{s:12});line(ctx,96,202,122,232);tag(ctx,'brown dots: dissolved sugars and salts',236,98,k,{s:12});line(ctx,236,110,196,226);} },
    { key: 'zero', title: 'Pure water: Ψ = 0', set: { conc: 0 }, fresh: true, speed: 0.5,
      see: 'The beaker holds pure water (Ψ = 0). Blue drops move in, the cell swells, and Ψp climbs as the wall pushes back.',
      why: '<b>Water potential (Ψ)</b> is how ready water is to move. Pure water is 0; anything dissolved lowers it.',
      overlay(sim,ctx,LH,k,tau){wpBox(ctx,424,148,368,96,tau);tag(ctx,'pure water: Ψ = 0, the highest Ψ there is',214,82,k,{s:12.5,hi:true,c:'#1d6fd6'});} },
    { key: 'psis', cause: { from: { conc: 0 } }, title: 'Add sugar: Ψs = −iCRT', set: { conc: 0.3 }, fresh: true, speed: 0.5,
      see: '0.30 M sugar. The card breaks Ψs = −iCRT into its four numbers.',
      why: 'i: particles per unit (sucrose 1). C: mol/L. R: 0.0831. T: kelvin. More particles, more negative Ψs.',
      overlay(sim,ctx,LH,k,tau){const T=sim.p.temp;wpBox(ctx,424,148,368,96,tau);const q=wpPanel(ctx,k);
        wpCard(ctx,k,[['Ψs = −iCRT',800,14],'i = 1  (sucrose stays whole)','C = '+sim.p.conc.toFixed(2)+' mol/L','R = 0.0831 L·bar/(mol·K)','T = '+T+' + 273 = '+(T+273)+' K',['Ψs = '+wpS(wpPsi(1,sim.p.conc,T))+' bar',800,14,'#1d6fd6']],q.x+8,q.y+8,352,q.h-16);} },
    { key: 'compare', title: 'Water flows from higher Ψ to lower Ψ', base: { conc: 0.3 }, set: { conc: 0.1 }, fresh: true, speed: 0.25,
      see: 'The number line puts the solution (blue) and the cell (green) on one Ψ scale. The green dot slides right until the two meet.',
      why: 'Water moves from <b>higher Ψ to lower Ψ</b>, like a ball rolling downhill. Flow stops when they are equal.',
      overlay(sim,ctx,LH,k){wpLadder(ctx,sim,k);} },
    { key: 'plasmo', cause: { from: { conc: 0.1 } }, title: 'Strong sugar water: plasmolysis', set: { conc: 0.6 }, fresh: true, speed: 0.6,
      see: '0.60 M sugar (−14.7 bar). Water leaves, and the membrane pulls in from the wall. The red onion photo shows the same.',
      why: 'The solution’s Ψ is lower, so water leaves. That is <b>plasmolysis</b>. The wall keeps its shape.',
      overlay(sim,ctx,LH,k){const q=wpPanel(ctx,k),R=Math.min(74,q.h/2-8);wpOnion(ctx,sim,k,q.x+12+R,q.y+q.h/2,R);
        wpSide(ctx,k,q,[['Red onion skin, ×100',700,13],'Real cells: about','0.3 mm long. The purple','is real pigment in the sap.',[sim.st.V<0.99?'Sap pulls away from walls.':'Sap fills each cell.',700,12.5,'#b3261e']]);} },
    { key: 'wilt', cause: { from: { conc: 0 } }, title: 'Why plants wilt', set: { conc: 0.4 }, fresh: true, speed: 0.6,
      see: '0.40 M sugar pulls water out. As the cell goes limp, the stem on the right bends over.',
      why: 'Stems stand because firm cells push on their walls (<b>Ψp > 0</b>), like a full bike tire. Lose water and the plant <b>wilts</b>.',
      overlay(sim,ctx,LH,k){const q=wpPanel(ctx,k);wpPlantAt(ctx,sim,k,q);const st=sim.st.V<0.99?'plasmolyzed':sim.st.V>1.02?'turgid':'flaccid';
        wpSide(ctx,k,q,[['The whole plant',700,13],['Cells: '+st,700,12.5,st==='turgid'?'#2a7a3a':'#b3261e'],'Ψp = '+wpS(phM(sim,'psip'))+' bar']);} },
    { key: 'water', title: 'Water it and it stands back up', set: { conc: 0 }, speed: 0.3,
      see: 'Pure water again. Water flows back in, the wall pushes, and the stem lifts.',
      why: 'Fresh water (Ψ = 0) is higher than the cells, so water moves back in.',
      overlay(sim,ctx,LH,k){const q=wpPanel(ctx,k);wpPlantAt(ctx,sim,k,q);const st=sim.st.V<0.99?'plasmolyzed':sim.st.V>1.02?'turgid':'flaccid';
        wpSide(ctx,k,q,[['After watering',700,13],['Cells: '+st,700,12.5,st==='turgid'?'#2a7a3a':'#b3261e'],'Ψp = '+wpS(phM(sim,'psip'))+' bar']);} },
    { lvl: 'honors', key: 'salt', title: 'Salt counts double', set: { conc: 0.3, solute: 'nacl' }, fresh: true, speed: 0.6,
      see: 'Same 0.30 M, but table salt. Each NaCl splits in two, Ψ doubles to −14.71 bar, and the cell plasmolyzes.',
      why: 'Ψ counts particles. NaCl makes 2 (<b>i = 2</b>), so 0.30 M salt pulls like 0.60 M sugar.',
      overlay(sim,ctx,LH,k){const T=sim.p.temp;const q=wpPanel(ctx,k);wpCard(ctx,k,[['1 NaCl → Na⁺ + Cl⁻',800,14],'so i = 2 particles per unit','0.30 M sucrose: Ψs = '+wpS(wpPsi(1,0.3,T))+' bar',['0.30 M NaCl: Ψs = '+wpS(wpPsi(2,0.3,T))+' bar',800,13,'#7a4fa6']],432,258,352);
        tag(ctx,'purple Na⁺, teal Cl⁻',330,120,k,{s:12});} },
    { lvl: 'ap', key: 'psip', title: 'Find Ψp at equilibrium', set: { conc: 0.2 }, fresh: true, speed: 2,
      see: 'In 0.20 M sugar, water enters until flow stops. The card solves Ψ = Ψp + Ψs for Ψp.',
      why: 'At equilibrium Ψcell = Ψsolution = −4.90 bar. The sap’s Ψs is about −6.99, so Ψp ≈ +2.09 bar: the wall’s push.',
      overlay(sim,ctx,LH,k){const c=phM(sim,'psic'),s=phM(sim,'psisol'),ss=phM(sim,'psisc');const q=wpPanel(ctx,k);
        wpCard(ctx,k,[['At equilibrium: Ψcell = Ψsolution',800,13],'Ψ = '+wpS(s)+' bar (the solution)','cell Ψs = '+wpS(ss)+' bar','Ψp = Ψ − Ψs',['= '+wpS(s)+' − ('+wpS(ss)+') = '+wpS(s-ss)+' bar',800,13,'#2a7a3a'],[Math.abs(c-s)<0.05?'flow has stopped':'still settling…',600,12,PAL['cv-soft']]],q.x+8,q.y+8,352,q.h-16);} },
    { lvl: 'ap', key: 'zeropt', title: 'The potato lab’s zero point', set: { conc: 0.3 }, fresh: true, speed: 2,
      see: '0.30 M sugar, the same as the sap. The cell keeps its size, and Ψp settles near 0.',
      why: 'Here Ψcell = Ψsolution = −7.35 bar. That is what the potato lab’s zero crossing measures.',
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
      see: 'Three pink agar cubes, 1, 2 and 3 cm on a side, sit in vinegar. Below each is a slice through its middle.',
      why: 'The agar holds <b>phenolphthalein</b>: pink when basic, clear when acid reaches it. Each cube stands in for a cell.',
      overlay(sim,ctx,LH,k){scaleBar(ctx,30,372,svP2(sim),'1 cm',k);tag(ctx,'pink = acid has not arrived yet',400,288,k,{s:12.5,hi:true});tag(ctx,'vinegar (acid)',560,262,k,{s:12});} },
    { key: 'inward', title: 'Acid moves in from every face', fresh: true, speed: 0.35,
      see: 'A clear border creeps inward from every side of each slice. The arrows show acid arriving from every face.',
      why: 'Acid particles move at random and spread from high to low concentration: <b>diffusion</b>.',
      overlay(sim,ctx,LH,k){const P2=svP2(sim),h=sim.p.sC*P2/2,cx=SVX[2],col='#c8102e';
        lbArrow(ctx,cx-h-34,SVY,cx-h+4,SVY,col);lbArrow(ctx,cx+h+34,SVY,cx+h-4,SVY,col);lbArrow(ctx,cx,SVY-h-26,cx,SVY-h+4,col);lbArrow(ctx,cx,SVY+h+26,cx,SVY+h-4,col);
        tag(ctx,'acid soaks in from every face',cx-150,292,k,{s:12.5,hi:true});} },
    { key: 'same', title: 'The same depth in every block', speed: 1,
      see: 'The red brackets show the clear border is the same width in all three slices, growing as minutes pass.',
      why: 'Acid gets the same distance into every block. What differs is how far each center is from the surface: 0.5, 1 and 1.5 cm.',
      overlay(sim,ctx,LH,k){const P2=svP2(sim),d=phM(sim,'depth');['sA','sB','sC'].forEach((key,i)=>{const w=sim.p[key]*P2,x0=SVX[i]-w/2,y=SVY+sim.p[key]*P2/2+9,x1=x0+Math.min(d*P2,w/2);
          ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x0,y-5);ctx.lineTo(x0,y);ctx.lineTo(x1,y);ctx.lineTo(x1,y-5);ctx.stroke();ctx.restore();});
        wpCard(ctx,k,[['Acid depth after '+sim.st.soak.toFixed(1)+' min',700,13],['d = '+d.toFixed(2)+' cm in every block',800,14,'#c8102e']],14,56,240);} },
    { key: 'small', title: 'The small cube finishes first', speed: 4,
      see: 'Sped up. The 1 cm cube turns fully clear first, at about 10 minutes. The bigger cubes still have pink centers.',
      why: 'Acid needs only 0.5 cm to reach the small cube’s center. Oxygen reaches the middle of a small cell quickly, too.',
      overlay(sim,ctx,LH,k){const p=['pA','pB','pC'].map(id=>phM(sim,id));wpCard(ctx,k,[['After '+sim.st.soak.toFixed(0)+' min, acid has reached:',700,13],['1 cm cube: '+p[0].toFixed(0)+'%',700,13,p[0]>=99.9?'#1b7339':PAL['cv-ink']],'2 cm cube: '+p[1].toFixed(0)+'%','3 cm cube: '+p[2].toFixed(0)+'%'],14,56,240);} },
    { key: 'ratio', title: 'Surface area vs volume', speed: 1,
      see: 'Eight 1 cm cubes build a 2 cm cube: 4 times the surface, 8 times the inside. SA:V reads 6, 3 and 2 per cm.',
      why: 'Surface grows with side², volume with side³. <b>SA:V falls as size goes up.</b>',
      overlay(sim,ctx,LH,k){svBox(ctx,14,282,772,104);const P=13;
        svCube(ctx,92,342,1,P*1.6,SVPINK);H.txt(ctx,'1 cm cube',150,316,{s:13*Math.min(k,1.3),w:700});H.txt(ctx,'SA = 6 × 1² = 6 cm²',150,336,{s:12.5*Math.min(k,1.3)});H.txt(ctx,'V = 1³ = 1 cm³ · SA:V = 6',150,356,{s:12.5*Math.min(k,1.3)});
        [[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]].forEach(([x,y,z])=>svCube(ctx,470+(x-y)*P*1.6*0.866,350+(x+y)*P*1.6*0.5-z*P*1.6,1,P*1.6,SVPINK));
        H.txt(ctx,'2 cm cube = 8 small cubes',540,316,{s:13*Math.min(k,1.3),w:700});H.txt(ctx,'SA = 6 × 2² = 24 cm² (×4)',540,336,{s:12.5*Math.min(k,1.3)});H.txt(ctx,'V = 2³ = 8 cm³ (×8) · SA:V = 3',540,356,{s:12.5*Math.min(k,1.3),w:700,c:'#c8102e'});} },
    { key: 'savgraph', title: 'Graph it: SA:V vs size', speed: 0.25,
      see: 'SA:V plotted against the cube’s side. Your three cubes are the dots: 6, 3 and 2 per cm.',
      why: 'For a cube SA:V = 6 ÷ side, so it drops fast as cells grow. Bigger means less surface to feed each bit of inside.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg;K.dim(ctx,LH);const p=tau%11;
        /* cube: SA = 6s², V = s³, SA:V = 6/s (the formula the tool's SA:V readout uses) */
        const B={x0:110,x1:620,y0:80,y1:360},xr=[0.5,6],f=s=>(6/s)/12;
        K.axes(ctx,B,k,{xr,xt:[[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5'],[6,'6']],yt:[[0,'0'],[0.25,'3'],[0.5,'6'],[1,'12']],xl:'Side of cube (cm)',yl:'SA:V (per cm)'});
        K.curve(ctx,B,xr,f,p<6?0.5+5.5*p/6:6,'#c8102e');
        [[1,'1 cm: 6'],[2,'2 cm: 3'],[3,'3 cm: 2']].forEach(([s,l],i)=>{if(p<2+i*1.3)return;const x=K.X(B,xr,s),y=K.Y(B,f(s));K.dot(ctx,x,y,'#1b7a3a',7);K.tagA(ctx,l,x+12,y-22,k,{s:12.5},'l');});
        K.tag(ctx,'Surface-area-to-volume ratio',400,36,k);
        if(p>7)K.tagA(ctx,'Bigger cell, less surface per inside',B.x1+60,B.y0+20,k,{s:12.5,hi:true},'r');} },
    { key: 'cells', title: 'Why cells stay tiny', speed: 4,
      see: 'The card shrinks the cube: every time it gets 10 times smaller, the wait gets 100 times shorter.',
      why: 'Time grows with distance <b>squared</b>. A cell-sized cube clears in under a millisecond, so big organisms are made of tiny cells.',
      overlay(sim,ctx,LH,k){svBox(ctx,14,282,772,104);const rows=[['1 cm (block A)','10 min'],['1 mm','6 s'],['0.1 mm','0.06 s'],['10 µm, a real cell','0.0006 s']];
        H.txt(ctx,'Time for the acid to reach the center',30,302,{s:13*Math.min(k,1.3),w:700});
        rows.forEach((r,i)=>{const x=30+i*190;H.txt(ctx,r[0],x,330,{s:12.5*Math.min(k,1.3)});H.txt(ctx,r[1],x,354,{s:14*Math.min(k,1.3),w:800,c:i===3?'#1b7339':PAL['cv-ink']});if(i<3)H.txt(ctx,'÷100',x+150,342,{s:12*Math.min(k,1.3),w:700,c:'#c8102e'});});} },
    { lvl: 'honors', key: 'warm', title: 'Warm vinegar, faster diffusion', set: { temp: 35 }, fresh: true, speed: 2,
      see: 'The vinegar is now 35 °C instead of 20 °C. The card compares the acid depth with 20 °C.',
      why: 'Warmer particles move faster, so diffusion is about 45% faster. Every block still clears from the outside in.',
      overlay(sim,ctx,LH,k){const t=sim.st.soak,D20=0.0125,D=D20*(1+0.03*(sim.p.temp-20));wpCard(ctx,k,[['After '+t.toFixed(1)+' min',700,13],'at 20 °C: d = '+Math.sqrt(2*D20*t).toFixed(2)+' cm',['at '+sim.p.temp+' °C: d = '+Math.sqrt(2*D*t).toFixed(2)+' cm',800,13,'#c8102e']],14,56,240);} },
    { lvl: 'ap', key: 'slab', title: 'Same volume, flatter shape', set: { shape: 'slab' }, fresh: true, speed: 2,
      see: 'Each block is flattened into a slab of the same volume. The thin slabs clear almost at once.',
      why: 'A slab of the same volume has more surface and no point far from a face: about 0.6 minutes instead of 10.',
      overlay(sim,ctx,LH,k){wpCard(ctx,k,[['Block A, 1 cm³ either way',700,13],'cube: SA:V 6, clears in 10 min',['slab: SA:V 10, clears in '+phM(sim,'tA').toFixed(1)+' min',800,13,'#c8102e']],14,56,262);} },
    { lvl: 'ap', key: 'shapes', title: 'Real cells cheat with shape', set: { shape: 'rod' }, fresh: true, speed: 2,
      see: 'Long thin rods, plus two real cells to scale: a flat red blood cell (7.5 µm across, 2 µm thick) and a thin axon.',
      why: 'Flat or thin shapes keep every part near the surface. Both cells keep SA:V high without being tiny in every direction.',
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
      see: 'Elodea in baking-soda water, 15 cm from a lamp. Bubbles rise from the leaves. The card shows what goes in and what comes out.',
      why: 'Light turns CO₂ and water into sugar. Oxygen is left over and escapes as bubbles.',
      overlay(sim,ctx,LH,k){ceCard(ctx,k,20,62,390,[['Photosynthesis',{s:15,w:800}],['In:  light + CO₂ (from baking soda) + water',{c:CE_BLUE}],['Out:  sugar (stays in the plant) + O₂ (the bubbles)',{c:CE_GREEN}],['6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂',{s:12,w:700}]]);} },
    { key: 'cells', title: 'Inside a leaf: chloroplasts', set: { dist: 15 }, speed: 1,
      see: 'A close-up of an Elodea leaf (see the 20 µm scale bar). Each cell is packed with green chloroplasts.',
      why: 'Their <b>chlorophyll</b> absorbs light. That energy splits water, which is where the oxygen comes from.',
      overlay(sim,ctx,LH,k,tau){ceElodea(ctx,230,250,130,k,tau);line(ctx,360,250,590,250,'#c8102e');tag(ctx,'Leaf cells: the green dots are chloroplasts',230,92,k,{s:12,hi:true});} },
    { key: 'count', title: 'Counting bubbles measures the rate', set: { dist: 15 }, speed: 1,
      see: 'The card counts bubbles. At 15 cm: about 20 a minute.',
      why: 'Each bubble is mostly oxygen, so more bubbles per minute means faster photosynthesis. That is how your class lab measures the rate.',
      overlay(sim,ctx,LH,k){const b=phM(sim,'bubbles'),l=phM(sim,'light');ceCard(ctx,k,20,62,330,[['Lamp 15 cm away',{s:14,w:800}],['Light at the plant: '+Math.round(l)+'%'],['Bubbles per minute: '+Math.round(b),{w:800,c:CE_GREEN}]]);tag(ctx,'count these',700,150,k,{s:12,hi:true});line(ctx,700,165,618,200,'#c8102e');} },
    { key: 'far', cause: { from: { dist: 15 } }, title: 'Twice as far, a quarter of the light', set: { dist: 30 }, fresh: true, speed: 1,
      see: 'The lamp moves back to 30 cm. Light at the plant drops from 44% to 11%, and bubbles slow to about 8 a minute.',
      why: 'Twice as far spreads the light over 4 times the area: the <b>inverse-square</b> rule.',
      overlay(sim,ctx,LH,k){const b=phM(sim,'bubbles'),l=phM(sim,'light');const h=ceCard(ctx,k,20,62,330,[['Lamp 30 cm away (twice as far)',{s:14,w:800}],['Light at the plant: '+Math.round(l)+'% (was 44%)'],['Bubbles per minute: '+Math.round(b),{w:800,c:CE_GREEN}],['Same light, spread over 4× the area:',{s:12}]]);
        const y0=62+h+10,s=28;ctx.save();ctx.fillStyle='#ffd966';ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.fillRect(40,y0,s,s);ctx.strokeRect(40,y0,s,s);H.txt(ctx,'15 cm',54,y0+s+15,{s:11*k,a:'center'});
        ctx.globalAlpha=0.45;for(let i=0;i<2;i++)for(let j=0;j<2;j++){ctx.fillRect(140+i*s,y0+j*s,s,s);}ctx.globalAlpha=1;for(let i=0;i<2;i++)for(let j=0;j<2;j++)ctx.strokeRect(140+i*s,y0+j*s,s,s);H.txt(ctx,'30 cm: ¼ each',168,y0+2*s+15,{s:11*k,a:'center'});ctx.restore();} },
    { key: 'farthest', cause: { from: { dist: 30 } }, title: 'Too far: making = using', set: { dist: 60 }, fresh: true, speed: 1,
      see: 'At 60 cm the bubbles stop. The bars show the plant still makes oxygen, but its own respiration uses just as much.',
      why: 'Bubbles appear only when photosynthesis makes <b>more</b> oxygen than respiration uses.',
      overlay(sim,ctx,LH,k){const g=phM(sim,'gross'),r=phM(sim,'resp');const h=ceCard(ctx,k,20,62,380,[['Lamp 60 cm away',{s:14,w:800}],['O₂ made by photosynthesis vs. used by respiration',{s:12}]],{extra:52});ceBars(ctx,k,32,62+h-52*Math.min(k,1.3),356,[['Made',g,CE_GREEN,g.toFixed(1)],['Used',r,CE_RED,r.toFixed(1)]],30);} },
    { key: 'lgraph', title: 'Put it on a graph', speed: 0.5,
      see: 'Left: your lab’s graph, bubbles per minute vs lamp distance, with the three settings you just saw. Right: the same data as rate vs light.',
      why: 'More light, faster photosynthesis, until the curve levels off. Then something else, like CO₂, is the limit.',
      overlay(sim,ctx,LH,k,tau){dim(ctx,LH,1);const kk=Math.min(k,1.2),p=tau%12;
        /* from sims/photosynthesis.js at 25 °C and the default baking soda: gross = 38.6 × I/(I + 25), respiration = 4, I = 100 × (10/d)² */
        const net=I=>38.6*I/(I+25)-4,bub=d=>Math.max(0,net(100*Math.pow(10/d,2))),G='#1b7a3a';
        const A={x0:80,x1:370,y0:80,y1:340},B={x0:480,x1:770,y0:80,y1:340};
        ezAxes(ctx,A,k,{xr:[10,60],xt:[[10,'10'],[20,'20'],[30,'30'],[40,'40'],[50,'50'],[60,'60']],yt:[[0,'0'],[10/30,'10'],[20/30,'20'],[1,'30']],xl:'Lamp distance (cm)',yl:'Bubbles per minute',ylOff:40});
        tag(ctx,'Your lab graph',(A.x0+A.x1)/2,40,k);
        const ya=v=>v/30;ezCurve(ctx,A,[10,60],d=>ya(bub(d)),p<4?10+50*(p/4):60,G);
        [[15,'15 cm'],[30,'30 cm'],[60,'60 cm']].forEach(([d,l],i)=>{if(p<0.6+i*1.1)return;const x=A.x0+(d-10)/50*(A.x1-A.x0),y=A.y1-ya(bub(d))*(A.y1-A.y0);ezDot(ctx,x,y,'#c8102e',6);H.txt(ctx,Math.round(bub(d))+'/min',x+9,y-12,{s:12.5*kk,w:700,b:'middle'});});
        if(p>=4){ezAxes(ctx,B,k,{xr:[0,100],xt:[[0,'0'],[25,'25'],[50,'50'],[75,'75'],[100,'100']],yt:[[0,'0'],[0.5,'15'],[1,'30']],xl:'Light reaching the plant (%)',yl:'Rate (bubbles/min)',ylOff:40});
          tag(ctx,'Textbook graph',(B.x0+B.x1)/2,40,k);ezCurve(ctx,B,[0,100],I=>Math.max(0,net(I))/30,p<8?100*(p-4)/4:100,G);
          if(p>=8.5){ezTagA(ctx,'Levels off: CO₂ now limits',B.x1,B.y1-(net(100)/30)*(B.y1-B.y0)+34,k,{s:12.5,hi:true},'r');ezTagA(ctx,'Steep: light limits',B.x0+50,B.y1-36,k,{s:12.5},'l');}}} },
    { key: 'noco2', cause: { from: { co2: 0.5 } }, title: 'Bright light, no CO₂', set: { dist: 15, co2: 0 }, fresh: true, speed: 1,
      see: 'Back at 15 cm, but no baking soda. The bubbles stop.',
      why: 'No CO₂, no sugar, so the light energy backs up. A plant needs light <b>and</b> CO₂; whichever runs short sets the limit.',
      overlay(sim,ctx,LH,k){const g=phM(sim,'gross'),r=phM(sim,'resp');const h=ceCard(ctx,k,20,62,380,[['15 cm, but no CO₂',{s:14,w:800}],['Light 44%, same as the start',{s:12}]],{extra:52});ceBars(ctx,k,32,62+h-52*Math.min(k,1.3),356,[['Made',g,CE_GREEN,g.toFixed(1)],['Used',r,CE_RED,r.toFixed(1)]],30);} },
    { key: 'hot', cause: { from: { temp: 25 } }, lvl: 'honors', title: 'Temperature: warm helps, hot hurts', set: { dist: 15, temp: 45 }, fresh: true, speed: 1,
      see: 'At 45 °C, photosynthesis falls, respiration climbs, and the bubbles stop.',
      why: 'Photosynthesis runs on enzymes. They work fastest near 35 °C here; past that, enzymes like rubisco lose their shape.',
      overlay(sim,ctx,LH,k){const g=phM(sim,'gross'),r=phM(sim,'resp');const h=ceCard(ctx,k,20,62,380,[['45 °C water',{s:14,w:800}],['At 35 °C: made ≈ 38, used ≈ 8. At 45 °C:',{s:12}]],{extra:52});ceBars(ctx,k,32,62+h-52*Math.min(k,1.3),356,[['Made',g,CE_GREEN,g.toFixed(1)],['Used',r,CE_RED,r.toFixed(1)]],40);} },
    { key: 'green', cause: { from: { filter: "white" } }, lvl: 'honors', title: 'Light color: green works least', set: { dist: 15, filter: 'green' }, fresh: true, speed: 1,
      see: 'A green filter goes on: same light strength, but bubbles drop to well under half.',
      why: 'Chlorophyll absorbs red and blue best and green least. The green it reflects is why leaves look green.',
      overlay(sim,ctx,LH,k){const g=phM(sim,'gross');ceCard(ctx,k,20,62,380,[['Green light at 15 cm',{s:14,w:800}],['O₂ made: '+g.toFixed(1)+'  (white light: 24.7)',{w:800,c:CE_GREEN}],['Leaves look green because they use green the least.',{s:12}]]);} },
    { key: 'net', lvl: 'ap', title: 'Gross − respiration = net', set: { dist: 30 }, fresh: true, speed: 1,
      see: 'Back at 30 cm. The card splits the oxygen into made (gross), used by respiration, and left over (net).',
      why: 'Net = gross − respiration. Net reaches zero at the <b>light compensation point</b>, near 60 cm here.',
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
function ceMitoInset(ctx,k){const sz=11*k,gap=Math.max(18,sz*1.45);ctx.font='700 '+sz+'px '+H.FONT;const tw=Math.max(ctx.measureText('Mitochondrion ≈ 1–2 µm').width,ctx.measureText('membrane ≈ 7 nm thick').width*0.95);const x=188,y=8,w=Math.max(340,170+tw),h=Math.max(104,gap*4+18);ctx.save();H.rr(ctx,x,y,w,h,9);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#c8102e';ctx.stroke();
  const cx=x+80,cy=y+52;ctx.beginPath();ctx.ellipse(cx,cy,64,30,0,0,6.29);ctx.fillStyle='#f6dcc6';ctx.fill();ctx.strokeStyle='#a0522d';ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx-54,cy);for(let i=0;i<=10;i++){const xx=cx-54+i*10.8;ctx.lineTo(xx,cy+(i%2?-18:18));}ctx.strokeStyle='#c97b4a';ctx.lineWidth=2;ctx.stroke();
  ctx.strokeStyle='#c8102e';ctx.lineWidth=2;ctx.strokeRect(cx-4,cy-24,12,10);ctx.restore();
  const ty=y+(h-gap*4)/2+sz*0.85;H.txt(ctx,'Mitochondrion ≈ 1–2 µm',x+156,ty,{s:sz,w:700});H.txt(ctx,'Folded inner membrane',x+156,ty+gap,{s:sz});H.txt(ctx,'Red box: this slice,',x+156,ty+gap*2,{s:sz,c:'#c8102e',w:700});H.txt(ctx,'membrane ≈ 7 nm thick',x+156,ty+gap*3,{s:sz,c:'#c8102e'});}
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
      see: 'The inset is a whole chloroplast, about 5 µm long. The red box is the slice drawn here: one thylakoid membrane, 7 nm thick.',
      why: 'Light is caught in this membrane. Sugar is built above it, in the <b>stroma</b>.',
      overlay(sim,ctx,LH,k){ceChloroInset(ctx,k);} },
    { key: 'water', title: 'Light splits water: the oxygen you breathe', speed: 0.3, focus: [40,186,110,174],
      see: 'Light hits photosystem II. A small blue O₂ appears under it as water is split.',
      why: 'Light knocks electrons out of chlorophyll, and splitting water replaces them. Every O₂ a plant releases comes from water.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['2 H₂O → O₂ + 4 H⁺ + 4 e⁻',{s:14,w:800}],['O₂ released now: '+f1(phM(sim,'o2')),{w:800,c:CE_GREEN}]]);} },
    { key: 'pump', title: 'Electrons pump H⁺', speed: 0.3, focus: [150,200,210,150],
      see: 'Yellow electrons hop from PSII to PQ to b6f, and pink H⁺ are pushed into the space below. The H⁺ gradient climbs.',
      why: 'Each hop releases a little energy, which pumps H⁺, like charging a battery.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['Electron energy → pumping H⁺',{s:14,w:800}],['H⁺ gradient: '+Math.round(phM(sim,'hg'))+'%',{w:800,c:'#b0306a'}]]);} },
    { key: 'psi', title: 'Photosystem I makes NADPH', speed: 0.3, focus: [355,155,200,165],
      see: 'Light hits photosystem I and re-energizes the electrons. The purple NADPH bar fills.',
      why: 'NADPH carries high-energy electrons. The Calvin cycle needs them to build sugar.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['Light again at PSI → NADPH',{s:14,w:800}],['NADPH supply: '+Math.round(phM(sim,'nadph'))+'%',{w:800,c:'#6a3fb5'}]]);} },
    { key: 'atp', title: 'ATP synthase: H⁺ flows back, ATP is made', speed: 0.3, focus: [600,155,80,180],
      see: 'H⁺ flow back up through ATP synthase, and the green ATP bar fills.',
      why: 'ATP synthase is the only way through. The flow turns it like a water wheel, adding phosphate to ADP.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['H⁺ flow → ATP',{s:14,w:800}],['ATP supply: '+Math.round(phM(sim,'atp'))+'%',{w:800,c:CE_GREEN}]]);} },
    { key: 'calvin', title: 'The Calvin cycle spends them to make sugar', speed: 0.5, focus: [[440,20,140,140],[600,20,200,160]],
      see: 'In the stroma the Calvin cycle turns. CO₂ goes in, the ATP and NADPH bars drop, and the sugar count climbs.',
      why: 'The enzyme <b>rubisco</b> grabs CO₂. ATP and NADPH supply the energy and electrons to turn it into sugar.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['CO₂ + ATP + NADPH → sugar (G3P)',{s:14,w:800}],['CO₂ fixed: '+f1(phM(sim,'fix'))+'    Sugar made: '+f1(phM(sim,'g3p')),{w:800,c:CE_GREEN}]]);} },
    { key: 'summary', title: 'The whole picture: two stages', speed: 0.5,
      see: 'Both stages side by side. Light and water go in; ATP and NADPH carry the energy to the Calvin cycle, which turns CO₂ into sugar.',
      why: 'The O₂ comes from water. Spent ADP and NADP⁺ go back to be recharged.',
      overlay(sim,ctx,LH,k,tau){dim(ctx,LH,1);const kk=Math.min(k,1.2),p=tau%12,G='#1b7a3a',L={x:70,y:130,w:250,h:170},C={x:480,y:130,w:250,h:170};
        const box=(b,t1,t2,col)=>{ctx.save();H.rr(ctx,b.x,b.y,b.w,b.h,14);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=col;ctx.stroke();ctx.restore();H.txt(ctx,t1,b.x+b.w/2,b.y+b.h/2-12,{s:17*kk,w:700,a:'center',b:'middle'});H.txt(ctx,t2,b.x+b.w/2,b.y+b.h/2+16,{s:13*kk,a:'center',b:'middle',c:PAL['cv-soft']});};
        const arr=(x1,y1,x2,y2,lab,col,t0,lx,ly)=>{const f=clamp((p-t0)/1,0,1);if(f<=0)return;const ex=lerp(x1,x2,ease(f)),ey=lerp(y1,y2,ease(f));ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(ex,ey);ctx.stroke();
          const a=Math.atan2(y2-y1,x2-x1);ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex-12*Math.cos(a-0.45),ey-12*Math.sin(a-0.45));ctx.lineTo(ex-12*Math.cos(a+0.45),ey-12*Math.sin(a+0.45));ctx.closePath();ctx.fill();
          if(f>=1){const q=((p-t0-1)*0.5)%1;ctx.beginPath();ctx.arc(lerp(x1,x2,q),lerp(y1,y2,q),5,0,6.29);ctx.fill();}ctx.restore();if(f>0.5)H.txt(ctx,lab,lx,ly,{s:14*kk,w:700,a:'center',b:'middle',c:col});};
        box(L,'Light reactions','thylakoid membrane',G);box(C,'Calvin cycle','stroma',G);
        arr(L.x+60,50,L.x+60,L.y-4,'Light','#b26b00',0.2,L.x+60,38);
        arr(L.x+170,50,L.x+170,L.y-4,'H₂O','#2a6fdb',1,L.x+170,38);
        arr(L.x+L.w/2,L.y+L.h+4,L.x+L.w/2,L.y+L.h+64,'O₂ (you breathe it)','#2a6fdb',2,L.x+L.w/2,L.y+L.h+80);
        arr(L.x+L.w+6,L.y+50,C.x-6,C.y+50,'ATP + NADPH','#c8102e',3.2,(L.x+L.w+C.x)/2,L.y+30);
        arr(C.x-6,C.y+120,L.x+L.w+6,L.y+120,'ADP + NADP⁺','#8a8a8a',4.4,(L.x+L.w+C.x)/2,L.y+144);
        arr(C.x+C.w/2,50,C.x+C.w/2,C.y-4,'CO₂','#555',5.4,C.x+C.w/2,38);
        arr(C.x+C.w/2,C.y+C.h+4,C.x+C.w/2,C.y+C.h+64,'Sugar (G3P → glucose)',G,6.4,C.x+C.w/2,C.y+C.h+80);} },
    { key: 'dark', cause: { from: { light: 80 } }, title: 'Turn off the light', set: { light: 0 }, speed: 0.8,
      see: 'Light goes to 0%. The O₂ count falls to 0, the H⁺ gradient drains, and the Calvin cycle slows.',
      why: 'The Calvin cycle needs no light itself, but it runs out of the ATP and NADPH that light makes.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['Light 0%',{s:14,w:800}],['O₂ released: '+f1(phM(sim,'o2'))+'    H⁺ gradient: '+Math.round(phM(sim,'hg'))+'%',{w:800}],['Sugar made: '+f1(phM(sim,'g3p')),{w:800,c:CE_GREEN}]]);} },
    { key: 'noco2', cause: { from: { co2: 0.6 } }, title: 'Bright light, no CO₂', set: { co2: 0 }, fresh: true, speed: 3,
      see: 'Bright light, no CO₂. The ATP and NADPH bars fill up, then O₂ falls toward 0.',
      why: 'With no CO₂, the Calvin cycle stops spending ATP and NADPH. Once they are full, electrons back up and water splitting stops.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['Light 80%, CO₂ 0',{s:14,w:800}],['ATP '+Math.round(phM(sim,'atp'))+'%   NADPH '+Math.round(phM(sim,'nadph'))+'%   (filling up)',{w:800}],['O₂ released: '+f1(phM(sim,'o2'))+'   (normal CO₂: about 16)',{w:800,c:CE_RED}]]);} },
    { key: 'green', cause: { from: { color: "white" } }, lvl: 'honors', title: 'Green light', set: { color: 'green' }, fresh: true, speed: 0.8,
      see: 'Same 80% light, but green. O₂ released drops to well under half of white light’s 16.',
      why: 'Chlorophyll absorbs red and blue best and green least, so fewer electrons get excited.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['Green light',{s:14,w:800}],['O₂ released: '+f1(phM(sim,'o2'))+'   (white: about 16)',{w:800,c:CE_GREEN}]]);} },
    { key: 'hot', cause: { from: { temp: 25 } }, lvl: 'honors', title: '45 °C: rubisco slows', set: { temp: 45 }, fresh: true, speed: 0.8,
      see: 'At 45 °C, rubisco fixes only a little CO₂, and the ATP and NADPH bars back up.',
      why: 'Rubisco is an enzyme. Past its optimum it loses shape and slows.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['45 °C',{s:14,w:800}],['CO₂ fixed: '+f1(phM(sim,'fix'))+'   (25 °C: about 49)',{w:800,c:CE_RED}],['ATP '+Math.round(phM(sim,'atp'))+'%   NADPH '+Math.round(phM(sim,'nadph'))+'%',{w:800}]]);} },
    { key: 'dcmu', cause: { from: { dcmu: false } }, lvl: 'ap', title: 'DCMU blocks photosystem II', set: { dcmu: true }, fresh: true, speed: 0.8,
      see: 'With DCMU on, electrons stop leaving PSII. O₂ release and the H⁺ gradient fall to 0.',
      why: 'DCMU blocks where plastoquinone docks on PSII, so electron flow stops at step one. Herbicides like atrazine work this way.',
      overlay(sim,ctx,LH,k){CLC(sim,ctx,k,[['DCMU on',{s:14,w:800}],['O₂: '+f1(phM(sim,'o2'))+'   H⁺ gradient: '+Math.round(phM(sim,'hg'))+'%',{w:800,c:CE_RED}]]);} },
    { key: 'cost', lvl: 'ap', title: 'The cost of one sugar', speed: 0.5, focus: [0,0,800,450],
      see: 'Back to normal. The card adds up what one G3P sugar costs.',
      why: 'Fixing 3 CO₂ into one G3P uses 9 ATP and 6 NADPH. Linear flow makes them about 1.3 : 1, short of 1.5 : 1, so cyclic flow helps.',
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
  simple: true,
  intro: { bio: 'You’ll follow one sugar molecule as your cells break it down, and see why oxygen matters so much.',
           honors: 'You’ll follow one sugar molecule as your cells break it down, see why oxygen matters so much, and see what yeast and muscle do without it.' },
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
      see: 'A glucose molecule arrives. Each colored ball is one of its 6 carbons, so you can follow every one.',
      why: 'Glucose is the sugar in your blood. Its bonds hold the energy the cell will move into ATP.',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['Glucose: C₆H₁₂O₆',{s:14,w:800}],['About 1 nm across. The mitochondrion',{s:12}],['is drawn far smaller than the real 1–2 µm.',{s:12}]]);} },
    { key: 'invest', title: 'Spend 2 ATP to start', speed: 0.25, focus: [30,105,320,70],
      see: 'The cell spends 2 ATP, its energy “coins,” to stick two phosphate groups (orange P) onto the glucose. The card shows −2 ATP.',
      why: 'Spending energy first sounds odd, but the phosphates make glucose unstable enough to split.',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['Investment: −2 ATP',{s:15,w:800,c:CE_RED}],['Phosphates make glucose ready to split.',{s:12}]]);} },
    { key: 'payoff', title: 'Split and payoff', speed: 0.25, focus: [30,170,320,175],
      see: 'The 6-carbon sugar splits into two 3-carbon halves, each ending as a molecule called <b>pyruvate</b>. +4 ATP and +2 NADH appear.',
      why: 'Spend 2, make 4: this first stage, <b>glycolysis</b>, nets 2 ATP. NADH is a carrier that holds energy for later.',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['Glycolysis: −2 + 4 = +2 ATP',{s:15,w:800,c:CE_GREEN}],['+2 NADH. Leaves 2 pyruvate (3 carbons each).',{s:12}]]);} },
    { key: 'pyruvate', title: 'Into the mitochondrion: 2 carbons leave', speed: 0.25, focus: [360,215,170,110],
      see: 'With oxygen, each pyruvate enters the mitochondrion and loses one carbon as CO₂. The CO₂ count goes up by 2.',
      why: 'That CO₂ is carbon from your food. You breathe it out.',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['2 of the 6 carbons → CO₂',{s:15,w:800}],['+2 NADH',{s:12}]]);} },
    { key: 'krebs', title: 'The Krebs cycle: the last 4 carbons leave', speed: 0.25, focus: [505,90,195,205],
      see: 'A loop of reactions, the <b>Krebs cycle</b>, strips off the last 4 carbons as CO₂. All 6 carbons are now CO₂.',
      why: 'Their energy is loaded onto carriers (NADH and another one, FADH₂), plus 2 ATP. The mass of food you burn leaves through your lungs.',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['4 more carbons → CO₂ (all 6 gone)',{s:14,w:800}],['+2 ATP, +6 NADH, +2 FADH₂',{s:12}]]);} },
    { key: 'etc', title: 'Electron transport makes most of the ATP', speed: 0.25, focus: [400,300,370,115],
      see: 'The carriers hand their electrons to a row of proteins, the <b>electron transport chain</b>. Oxygen catches them at the end to make water, and about 28 ATP are made.',
      why: 'This big payoff needs oxygen. Total: 2 + 2 + 28 = about 32 ATP per glucose.',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['2 + 2 + 28 ≈ 32 ATP per glucose',{s:15,w:800,c:CE_GREEN}],['O₂ + electrons + H⁺ → water',{s:12}]]);} },
    { key: 'noo2', cause: { from: { o2: true } }, title: 'No oxygen: only 2 ATP', set: { o2: false }, fresh: true, speed: 0.4, focus: [30,240,330,190],
      see: 'Oxygen off. The mitochondrion goes dark, and the bar reads 2 ATP per glucose. Yeast turn pyruvate into alcohol (ethanol) and CO₂.',
      why: 'With no oxygen the chain stops. Only glycolysis runs, kept going by a backup process called <b>fermentation</b>.',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['No O₂: '+phM(sim,'atpPer')+' ATP per glucose',{s:15,w:800,c:CE_RED}],['32 ÷ 2 = 16 times less. A cell must burn',{s:12}],['sugar about 16 times faster to keep up.',{s:12}]]);} },
    { key: 'tally', title: 'Add it up: the ATP scoreboard', speed: 0.25,
      see: 'A bar graph of ATP from one glucose. With oxygen: 2 + 2 + about 28 = about 32. Without oxygen: just 2.',
      why: 'Oxygen lets the Krebs cycle and electron transport run, so a cell with oxygen gets about 16 times as much ATP.',
      overlay(sim,ctx,LH,k,tau){dim(ctx,LH,1);const kk=Math.min(k,1.25),p=tau%12,X0=230,W=440,per=W/32,S=[['Glycolysis',2,'#b26b00'],['Krebs cycle',2,'#2a6fdb'],['Electron transport',28,'#1b7a3a']];
        tag(ctx,'ATP made from one glucose',400,36,k,{hi:true});
        const row=(y,label,segs,t0)=>{H.txt(ctx,label,X0-14,y+22,{s:14*kk,w:700,a:'right',b:'middle'});let x=X0,tot=0;
          segs.forEach(([n,v,c],i)=>{const f=clamp((p-t0-i*1.2)/1.2,0,1);if(f<=0)return;const w=v*per*ease(f);ctx.fillStyle=c;H.rr(ctx,x,y,Math.max(2,w),44,4);ctx.fill();if(f>=1)tot+=v;x+=v*per;});
          if(tot)H.txt(ctx,(tot>2?'≈ ':'')+tot+' ATP',x+12,y+22,{s:16*kk,w:700,b:'middle'});};
        row(110,'With oxygen',S,0.3);row(200,'No oxygen',[S[0]],4.2);
        if(p>4.2)H.txt(ctx,'(fermentation)',X0-14,248,{s:12.5*kk,a:'right',b:'middle',c:PAL['cv-soft']});
        ctx.save();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X0,300);ctx.lineTo(X0+W,300);ctx.stroke();
        for(let v=0;v<=32;v+=8){const x=X0+v*per;ctx.beginPath();ctx.moveTo(x,300);ctx.lineTo(x,305);ctx.stroke();H.txt(ctx,String(v),x,318,{s:12*kk,a:'center',b:'middle',c:PAL['cv-soft']});}ctx.restore();
        H.txt(ctx,'ATP per glucose',X0+W/2,340,{s:13*kk,w:700,a:'center',b:'middle'});
        let lx=X0;S.forEach(([n,v,c])=>{ctx.fillStyle=c;ctx.fillRect(lx,372,14,14);H.txt(ctx,n,lx+20,379,{s:12.5*kk,b:'middle'});ctx.font='400 '+12.5*kk+'px '+H.FONT;lx+=ctx.measureText(n).width+44;});
        if(p>6.5)tag(ctx,'About 16× more ATP with oxygen',400,420,k,{hi:true});} },
    { key: 'muscle', lvl: 'honors', title: 'Muscle fermentation: lactate', set: { o2: false, ferm: 'muscle' }, fresh: true, speed: 0.4, focus: [30,240,330,190],
      see: 'Switch to muscle. Pyruvate becomes lactate, and no CO₂ is released.',
      why: 'Fermentation makes no ATP itself. It turns NADH back into NAD⁺, so glycolysis can keep making its 2 ATP.',
      overlay(sim,ctx,LH,k){GLC(sim,ctx,k,[['Muscle: pyruvate → lactate',{s:14,w:800}],['Recycles NAD⁺ so glycolysis can continue.',{s:12}]]);} },
    { key: 'balloon', lvl: 'honors', title: 'The yeast balloon lab', set: { mode: 'balloon' }, fresh: true, speed: 2, focus: [0,40,800,410],
      see: 'Five yeast flasks. Glucose and sucrose fill their balloons with CO₂. Lactose and water barely change. Lactose plus lactase fills too.',
      why: 'Yeast can split sucrose but make no lactase. Add lactase, and lactose becomes glucose they can ferment.',
      overlay(sim,ctx,LH,k){ceCard(ctx,k,20,48,360,[['CO₂ in each balloon (mL)',{s:14,w:800}],['Glucose '+Math.round(phM(sim,'b_glu'))+'   Sucrose '+Math.round(phM(sim,'b_suc'))+'   Lactose '+Math.round(phM(sim,'b_lac')),{w:700}],['Lactose + lactase '+Math.round(phM(sim,'b_lacz'))+'   Water '+Math.round(phM(sim,'b_none')),{w:700}]]);} },
    { key: 'where', lvl: 'ap', title: 'Where the ATP comes from', set: { o2: true, mode: 'cell' }, fresh: true, speed: 0.4, focus: [0,0,800,450],
      see: 'Back to the cell with oxygen. The card splits the 32 ATP by how each is made.',
      why: 'Enzymes hand phosphate straight to ADP for 4 ATP (substrate-level). The H⁺ gradient drives about 28 (oxidative phosphorylation).',
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
  simple: true,
  intro: { bio: 'You’ll see how your cells turn the energy in food into energy they can use, and why that takes oxygen.',
           honors: 'You’ll see how your cells turn the energy in food into energy they can use, why that takes oxygen, and why one energy carrier gives less than the other.' },
  goals: {
    bio: ['Where most of your ATP is made, and how small that place is', 'How electrons from food power pumps that pile up H⁺', 'Why you need oxygen: it catches the electrons at the end', 'Why more effort means more breathing'],
    honors: ['The path of electrons through complexes I to IV', 'How the H⁺ gradient drives ATP synthase', 'Why FADH₂ yields less ATP than NADH'],
    ap: ['Chemiosmotic coupling and proton-motive force', 'P/O ratios: about 2.5 for NADH and 1.5 for FADH₂', 'What blocking complex IV does to the whole chain']
  },
  matters: 'This membrane is why you breathe. Every breath brings in the oxygen that catches electrons here, and every breath out carries away the CO₂ from your food. It also explains carbon monoxide danger and altitude sickness.',
  question: 'Sprinting up the stairs, your muscle cells burn fuel faster and you start breathing hard. Raise the fuel supply from 40% to 100%. What happens to the ATP made and the oxygen used each second?',
  startKey: 'where', startRun: true, startSpeed: 0.25,
  startOverlay(sim,ctx,LH,k){ceMitoInset(ctx,k);{const sz=12*k;ctx.font='700 '+sz+'px '+H.FONT;const x0=12+ctx.measureText('MATRIX').width+8;ctx.font='600 '+sz+'px '+H.FONT;const w=ctx.measureText('Matrix (inside the mitochondrion)').width+sz*1.1,h=sz*1.9;if(k>1.15){ctx.fillStyle=PAL['cv-matrix'];ctx.fillRect(0,398,x0+w+8,52);H.txt(ctx,'MATRIX',12,442,{s:sz,w:700,c:PAL['cv-soft']});}tag(ctx,'Matrix (inside the mitochondrion)',Math.min(x0+w/2,796-w/2),446-h/2,k,{s:12,hi:true});}},
  steps: [
    { key: 'where', title: 'The power plant’s inner membrane', set: {}, fresh: true, speed: 0.25, focus: [0,150,800,110],
      see: 'The inset is a whole mitochondrion, 1–2 µm long. The red box is the slice drawn here: the inner membrane, about 7 nm thick.',
      why: 'Its folds pack more ATP-making machines into each mitochondrion.',
      overlay(sim,ctx,LH,k){ceMitoInset(ctx,k);} },
    { key: 'arrive', title: 'Electrons arrive from your food', speed: 0.1, focus: [60,150,110,215],
      see: 'NADH, the energy carrier made when sugar is broken down, drops off its electrons (yellow dots) at the first pump, complex I, and leaves as NAD⁺.',
      why: 'Earlier stages loaded the energy from glucose onto NADH. Here it is delivered.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['NADH → NAD⁺ + 2 electrons',{s:14,w:800}],['Electrons from your food enter the chain.',{s:12}]]);} },
    { key: 'pumps', title: 'Electrons power the pumps', speed: 0.1, focus: [60,110,460,170],
      see: 'Electrons hop from pump to pump. At each one, tiny charged particles, pink <b>H⁺ ions</b>, are pushed up above the membrane.',
      why: 'Each hop releases a little energy, which pumps H⁺. Small steps capture energy instead of losing it as heat.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['Each pump: electron energy → H⁺ pushed up',{s:14,w:800}],['H⁺ gradient: '+Math.round(phM(sim,'grad'))+'%',{w:800,c:'#b0306a'}]]);} },
    { key: 'oxygen', title: 'Oxygen catches the electrons', speed: 0.1, focus: [425,150,95,215],
      see: 'At complex IV, oxygen takes the used electrons and H⁺, and a blue H₂O appears.',
      why: 'Oxygen is the last stop. Without it the chain jams. This is why you breathe.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['O₂ + 4 e⁻ + 4 H⁺ → 2 H₂O',{s:14,w:800}],['O₂ used: '+f1(phM(sim,'o2use'))+' per second',{w:800,c:CE_BLUE}]]);} },
    { key: 'gradient', title: 'H⁺ piles up above the membrane', speed: 0.4, focus: [0,0,800,170],
      see: 'The space above the membrane fills with pink H⁺, far more than below.',
      why: 'Crowded H⁺ store energy, like water behind a dam. The only way back down is one gate.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['Like water behind a dam',{s:14,w:800}],['H⁺ gradient: '+Math.round(phM(sim,'grad'))+'%',{w:800,c:'#b0306a'}]]);} },
    { key: 'synthase', title: 'ATP synthase spins', speed: 0.25, focus: [605,110,130,270],
      see: 'H⁺ rush back down through a spinning protein, <b>ATP synthase</b>. Its head turns, and green ATP pops out.',
      why: 'The flow turns ATP synthase like a turbine. About 4 H⁺ make one ATP.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['H⁺ flow → ATP (≈4 H⁺ each)',{s:14,w:800}],['ATP made: '+f1(phM(sim,'atp'))+' per second',{w:800,c:CE_GREEN}]]);} },
    { key: 'fuel', cause: { from: { fuel: 40 } }, title: 'More fuel: more ATP and more oxygen', set: { fuel: 100 }, fresh: true, speed: 0.4,
      see: 'Fuel goes from 80% to 100%. ATP made rises to about 19 per second, and O₂ used to about 3.9.',
      why: 'More fuel sends more electrons, and each needs oxygen. That is why you breathe hard on the stairs.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['Fuel 100%   (at 40%: ATP ≈ 11, O₂ ≈ 2.3)',{s:13,w:800}],['ATP '+f1(phM(sim,'atp'))+' per s     O₂ used '+f1(phM(sim,'o2use'))+' per s',{w:800,c:CE_GREEN}]]);} },
    { key: 'noo2', cause: { from: { o2: 100 } }, title: 'No oxygen: the chain stops', set: { o2: 0 }, fresh: true, speed: 0.4,
      see: 'Oxygen is set to 0. Electrons pile up, the pumps stop, the H⁺ gradient drains, and ATP falls to 0.',
      why: 'Nothing catches electrons at complex IV, so nothing moves down the chain.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['O₂ 0%',{s:14,w:800,c:CE_RED}],['ATP made: '+f1(phM(sim,'atp'))+' per s    H⁺ gradient: '+Math.round(phM(sim,'grad'))+'%',{w:800}]]);} },
    { key: 'fadh', lvl: 'honors', title: 'FADH₂ enters later', set: { carrier: 'FADH2' }, fresh: true, speed: 0.25, focus: [180,190,70,140],
      see: 'Switch to FADH₂. Its electrons enter at complex II, skipping complex I, and ATP drops to about 12 per second.',
      why: 'Complex II pumps no H⁺, so FADH₂ makes less ATP than NADH.',
      overlay(sim,ctx,LH,k){RSC(sim,ctx,k,[['FADH₂ skips the first pump',{s:14,w:800}],['ATP made: '+f1(phM(sim,'atp'))+' per s   (NADH: about 17)',{w:800,c:CE_GREEN}]]);} },
    { key: 'po', lvl: 'ap', title: 'Counting protons', set: {}, fresh: true, speed: 0.4,
      see: 'Back to NADH. The card shows the proton count behind the P/O ratio.',
      why: 'NADH pumps 4 + 4 + 2 = 10 H⁺; at about 4 H⁺ per ATP, that is about 2.5 ATP per O. FADH₂ pumps 6, about 1.5.',
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
    steps:['Net = gross − respiration = 11.9 − 4.0 = 7.9.','Net is the oxygen (or sugar) left over for growth or release.','Negative net means respiration exceeds photosynthesis: the plant is below its light compensation point and losing stored sugar.']},
  {id:'labgraph',kind:'test',lvl:'bio',
    q:'<p>A class measures Elodea bubbles at different lamp distances and gets this graph. What does it show?</p><svg viewBox="0 0 420 230" style="display:block;width:100%;max-width:440px;height:auto;margin:10px 0 4px;color:inherit" role="img" aria-label="Graph of bubbles per minute against lamp distance: about 27 at 10 cm, falling steeply, then flattening to zero at 60 cm."><path d="M58 16V180H406" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M58.0 180v4" stroke="currentColor"/><text x="58.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">10</text><path d="M126.4 180v4" stroke="currentColor"/><text x="126.4" y="196" font-size="12" text-anchor="middle" fill="currentColor">20</text><path d="M194.8 180v4" stroke="currentColor"/><text x="194.8" y="196" font-size="12" text-anchor="middle" fill="currentColor">30</text><path d="M263.2 180v4" stroke="currentColor"/><text x="263.2" y="196" font-size="12" text-anchor="middle" fill="currentColor">40</text><path d="M331.6 180v4" stroke="currentColor"/><text x="331.6" y="196" font-size="12" text-anchor="middle" fill="currentColor">50</text><path d="M400.0 180v4" stroke="currentColor"/><text x="400.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">60</text><path d="M54 180.0h4" stroke="currentColor"/><text x="51" y="184.0" font-size="12" text-anchor="end" fill="currentColor">0</text><path d="M54 127.3h4" stroke="currentColor"/><text x="51" y="131.3" font-size="12" text-anchor="end" fill="currentColor">10</text><path d="M54 74.7h4" stroke="currentColor"/><text x="51" y="78.7" font-size="12" text-anchor="end" fill="currentColor">20</text><path d="M54 22.0h4" stroke="currentColor"/><text x="51" y="26.0" font-size="12" text-anchor="end" fill="currentColor">30</text><text x="229.0" y="216" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Lamp distance (cm)</text><text transform="translate(16 101.0) rotate(-90)" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Bubbles per minute</text><path d="M58.0 38.4L59.7 40.1L61.4 41.7L63.1 43.3L64.8 45.0L66.5 46.6L68.3 48.3L70.0 49.9L71.7 51.6L73.4 53.2L75.1 54.9L76.8 56.5L78.5 58.2L80.2 59.8L81.9 61.4L83.7 63.0L85.4 64.6L87.1 66.2L88.8 67.8L90.5 69.4L92.2 71.0L93.9 72.5L95.6 74.1L97.3 75.6L99.0 77.1L100.8 78.6L102.5 80.1L104.2 81.6L105.9 83.0L107.6 84.5L109.3 85.9L111.0 87.3L112.7 88.7L114.4 90.1L116.1 91.5L117.8 92.9L119.6 94.2L121.3 95.5L123.0 96.8L124.7 98.1L126.4 99.4L128.1 100.7L129.8 101.9L131.5 103.2L133.2 104.4L134.9 105.6L136.7 106.8L138.4 107.9L140.1 109.1L141.8 110.2L143.5 111.3L145.2 112.4L146.9 113.5L148.6 114.6L150.3 115.7L152.1 116.7L153.8 117.7L155.5 118.8L157.2 119.8L158.9 120.8L160.6 121.7L162.3 122.7L164.0 123.6L165.7 124.6L167.4 125.5L169.2 126.4L170.9 127.3L172.6 128.2L174.3 129.0L176.0 129.9L177.7 130.7L179.4 131.6L181.1 132.4L182.8 133.2L184.5 134.0L186.2 134.8L188.0 135.5L189.7 136.3L191.4 137.0L193.1 137.8L194.8 138.5L196.5 139.2L198.2 139.9L199.9 140.6L201.6 141.3L203.3 142.0L205.1 142.7L206.8 143.3L208.5 144.0L210.2 144.6L211.9 145.2L213.6 145.8L215.3 146.5L217.0 147.1L218.7 147.6L220.4 148.2L222.2 148.8L223.9 149.4L225.6 149.9L227.3 150.5L229.0 151.0L230.7 151.6L232.4 152.1L234.1 152.6L235.8 153.1L237.6 153.6L239.3 154.1L241.0 154.6L242.7 155.1L244.4 155.6L246.1 156.0L247.8 156.5L249.5 157.0L251.2 157.4L252.9 157.9L254.6 158.3L256.4 158.7L258.1 159.2L259.8 159.6L261.5 160.0L263.2 160.4L264.9 160.8L266.6 161.2L268.3 161.6L270.0 162.0L271.8 162.4L273.5 162.8L275.2 163.1L276.9 163.5L278.6 163.9L280.3 164.2L282.0 164.6L283.7 164.9L285.4 165.3L287.1 165.6L288.9 165.9L290.6 166.3L292.3 166.6L294.0 166.9L295.7 167.2L297.4 167.5L299.1 167.8L300.8 168.1L302.5 168.4L304.2 168.7L305.9 169.0L307.7 169.3L309.4 169.6L311.1 169.9L312.8 170.2L314.5 170.5L316.2 170.7L317.9 171.0L319.6 171.3L321.3 171.5L323.1 171.8L324.8 172.0L326.5 172.3L328.2 172.5L329.9 172.8L331.6 173.0L333.3 173.3L335.0 173.5L336.7 173.7L338.4 174.0L340.1 174.2L341.9 174.4L343.6 174.6L345.3 174.9L347.0 175.1L348.7 175.3L350.4 175.5L352.1 175.7L353.8 175.9L355.5 176.1L357.2 176.3L359.0 176.5L360.7 176.7L362.4 176.9L364.1 177.1L365.8 177.3L367.5 177.5L369.2 177.7L370.9 177.9L372.6 178.1L374.4 178.3L376.1 178.4L377.8 178.6L379.5 178.8L381.2 179.0L382.9 179.1L384.6 179.3L386.3 179.5L388.0 179.6L389.7 179.8L391.4 180.0L393.2 180.0L394.9 180.0L396.6 180.0L398.3 180.0L400.0 180.0" fill="none" stroke="#1b7a3a" stroke-width="3"/></svg>',
    choices:['Less light reaching the plant means a slower rate','The plant makes more oxygen as the lamp moves away','Distance has no effect until the lamp passes 60 cm','The rate falls by the same amount every 10 cm'],correct:0,
    steps:['Moving the lamp away spreads its light, so less reaches the plant.','Bubbles per minute measure the rate, and they fall as distance grows.','The curve is steep near the lamp and flattens far away, so it does not fall by the same amount each 10 cm.'],
    lab:{set:{dist:30},look:'The lamp at 30 cm. Count the bubbles, then try 15 cm and 60 cm.'}},
  {id:'plateau',kind:'test',lvl:'honors',
    q:'<p>This graph shows the rate of photosynthesis as light increases. Why does the curve level off at high light?</p><svg viewBox="0 0 420 230" style="display:block;width:100%;max-width:440px;height:auto;margin:10px 0 4px;color:inherit" role="img" aria-label="Graph of the rate of photosynthesis against light intensity: it rises steeply at low light, then levels off near 27 at high light."><path d="M58 16V180H406" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M58.0 180v4" stroke="currentColor"/><text x="58.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">0</text><path d="M143.5 180v4" stroke="currentColor"/><text x="143.5" y="196" font-size="12" text-anchor="middle" fill="currentColor">25</text><path d="M229.0 180v4" stroke="currentColor"/><text x="229.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">50</text><path d="M314.5 180v4" stroke="currentColor"/><text x="314.5" y="196" font-size="12" text-anchor="middle" fill="currentColor">75</text><path d="M400.0 180v4" stroke="currentColor"/><text x="400.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">100</text><path d="M54 180.0h4" stroke="currentColor"/><text x="51" y="184.0" font-size="12" text-anchor="end" fill="currentColor">0</text><path d="M54 101.0h4" stroke="currentColor"/><text x="51" y="105.0" font-size="12" text-anchor="end" fill="currentColor">15</text><path d="M54 22.0h4" stroke="currentColor"/><text x="51" y="26.0" font-size="12" text-anchor="end" fill="currentColor">30</text><text x="229.0" y="216" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Light intensity (%)</text><text transform="translate(16 101.0) rotate(-90)" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Rate of photosynthesis</text><path d="M58.0 180.0L59.7 180.0L61.4 180.0L63.1 180.0L64.8 180.0L66.5 180.0L68.3 179.3L70.0 176.1L71.7 173.0L73.4 170.1L75.1 167.2L76.8 164.4L78.5 161.7L80.2 159.1L81.9 156.6L83.7 154.2L85.4 151.8L87.1 149.5L88.8 147.3L90.5 145.1L92.2 143.0L93.9 140.9L95.6 138.9L97.3 137.0L99.0 135.1L100.8 133.3L102.5 131.5L104.2 129.8L105.9 128.1L107.6 126.4L109.3 124.8L111.0 123.3L112.7 121.7L114.4 120.2L116.1 118.8L117.8 117.4L119.6 116.0L121.3 114.6L123.0 113.3L124.7 112.0L126.4 110.7L128.1 109.5L129.8 108.3L131.5 107.1L133.2 105.9L134.9 104.8L136.7 103.7L138.4 102.6L140.1 101.5L141.8 100.4L143.5 99.4L145.2 98.4L146.9 97.4L148.6 96.5L150.3 95.5L152.1 94.6L153.8 93.7L155.5 92.8L157.2 91.9L158.9 91.0L160.6 90.2L162.3 89.3L164.0 88.5L165.7 87.7L167.4 86.9L169.2 86.2L170.9 85.4L172.6 84.7L174.3 83.9L176.0 83.2L177.7 82.5L179.4 81.8L181.1 81.1L182.8 80.4L184.5 79.7L186.2 79.1L188.0 78.4L189.7 77.8L191.4 77.2L193.1 76.6L194.8 76.0L196.5 75.4L198.2 74.8L199.9 74.2L201.6 73.6L203.3 73.1L205.1 72.5L206.8 72.0L208.5 71.4L210.2 70.9L211.9 70.4L213.6 69.9L215.3 69.4L217.0 68.9L218.7 68.4L220.4 67.9L222.2 67.4L223.9 66.9L225.6 66.5L227.3 66.0L229.0 65.5L230.7 65.1L232.4 64.6L234.1 64.2L235.8 63.8L237.6 63.4L239.3 62.9L241.0 62.5L242.7 62.1L244.4 61.7L246.1 61.3L247.8 60.9L249.5 60.5L251.2 60.1L252.9 59.8L254.6 59.4L256.4 59.0L258.1 58.6L259.8 58.3L261.5 57.9L263.2 57.6L264.9 57.2L266.6 56.9L268.3 56.5L270.0 56.2L271.8 55.9L273.5 55.5L275.2 55.2L276.9 54.9L278.6 54.6L280.3 54.2L282.0 53.9L283.7 53.6L285.4 53.3L287.1 53.0L288.9 52.7L290.6 52.4L292.3 52.1L294.0 51.8L295.7 51.6L297.4 51.3L299.1 51.0L300.8 50.7L302.5 50.4L304.2 50.2L305.9 49.9L307.7 49.6L309.4 49.4L311.1 49.1L312.8 48.9L314.5 48.6L316.2 48.3L317.9 48.1L319.6 47.8L321.3 47.6L323.1 47.4L324.8 47.1L326.5 46.9L328.2 46.6L329.9 46.4L331.6 46.2L333.3 45.9L335.0 45.7L336.7 45.5L338.4 45.3L340.1 45.1L341.9 44.8L343.6 44.6L345.3 44.4L347.0 44.2L348.7 44.0L350.4 43.8L352.1 43.6L353.8 43.4L355.5 43.2L357.2 42.9L359.0 42.7L360.7 42.6L362.4 42.4L364.1 42.2L365.8 42.0L367.5 41.8L369.2 41.6L370.9 41.4L372.6 41.2L374.4 41.0L376.1 40.8L377.8 40.7L379.5 40.5L381.2 40.3L382.9 40.1L384.6 40.0L386.3 39.8L388.0 39.6L389.7 39.4L391.4 39.3L393.2 39.1L394.9 38.9L396.6 38.8L398.3 38.6L400.0 38.4" fill="none" stroke="#1b7a3a" stroke-width="3"/></svg>',
    choices:['Something else, like CO₂, now limits the rate','The extra light damages the chlorophyll','The plant has run out of water to split','Respiration speeds up to use all the extra O₂'],correct:0,
    steps:['At low light, light is the limiting factor, so more light means a faster rate.','At high light, the plant can’t fix CO₂ any faster, so CO₂ (or enzyme speed) becomes the limit.','Adding more of the limiting factor, such as baking soda, would raise the plateau.']},
  {id:'photoeq',kind:'test',lvl:'bio',
    q:'<p>Which are the inputs (reactants) of photosynthesis?</p>',
    choices:['Carbon dioxide, water and light energy','Glucose and oxygen','Oxygen, water and light energy','Glucose, carbon dioxide and water'],correct:0,
    steps:['6 CO₂ + 6 H₂O + light energy → C₆H₁₂O₆ + 6 O₂.','Carbon dioxide and water go in, powered by light.','Glucose and oxygen come out. They are the inputs of cellular respiration.']}
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
    steps:['Each CO₂ fixed costs 3 ATP and 2 NADPH across the cycle.','3 CO₂ × 3 ATP = 9 ATP; 3 CO₂ × 2 NADPH = 6 NADPH.','That 1.5 : 1 ratio is more ATP than linear electron flow alone provides.']},
  {id:'link',kind:'test',lvl:'bio',
    q:'<p>What does the Calvin cycle get from the light reactions?</p>',
    choices:['ATP and NADPH','Oxygen and water','CO₂ and glucose','Light and chlorophyll'],correct:0,
    steps:['The light reactions charge up two carriers: ATP and NADPH.','The Calvin cycle spends them to turn CO₂ into sugar.','It sends ADP and NADP⁺ back to be recharged.']},
  {id:'cycle',kind:'test',lvl:'honors',
    q:'<p>How are photosynthesis and cellular respiration connected?</p>',
    choices:['Each one’s products are the other’s reactants','Both make oxygen from glucose and water','Both happen only in plant cells, in daylight','Respiration makes the light that photosynthesis uses'],correct:0,
    steps:['Photosynthesis turns CO₂ and water into glucose and O₂.','Respiration turns glucose and O₂ back into CO₂ and water, releasing energy as ATP.','Plants do both. Animals do only respiration.']}
  ]},
glycolysis:{core:['carbons','invest','stagemost','o2why','bread','wherestage','nadplus','lactose'],questions:[
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
  {id:'lactase',kind:'test',lvl:'honors',q:'Flask 4 has the same lactose as flask 3, plus lactase. Its balloon fills, but a little less than the glucose balloon. Why?',choices:['Lactase is a sugar too, so the yeast ferment it along with the lactose','Lactase kills some of the yeast, so fewer are left to make CO₂','Lactase splits lactose into glucose and galactose, which yeast can use','Lactase turns the yeast’s fermentation into aerobic respiration'],correct:2,
    steps:['Lactase is an enzyme. It cuts the bond holding lactose’s two sugars together, using one water.','That frees glucose, which yeast ferment right away, so CO₂ fills the balloon.','The other half is galactose. Yeast need hours to switch on the genes for it, so in one hour only about half the sugar is used.']},
  {id:'substrate',kind:'test',lvl:'ap',q:'How many of the ~32 ATP per glucose come from substrate-level phosphorylation?',choices:['2','28','32','4'],correct:3,
    steps:['Substrate-level: an enzyme transfers phosphate directly to ADP.','Glycolysis gives 2 net this way and the Krebs cycle gives 2.','The other ~28 come from oxidative phosphorylation via ATP synthase.']},
  {id:'stagemost',kind:'test',lvl:'bio',
    q:'<p>Which stage of cellular respiration makes the most ATP per glucose?</p>',
    choices:['Electron transport','Glycolysis','The Krebs cycle','Fermentation'],correct:0,
    steps:['Glycolysis nets 2 ATP and the Krebs cycle 2.','Electron transport, using the NADH and FADH₂ from the earlier stages, makes about 28.','So about 28 of the 32 ATP come from electron transport.']},
  {id:'wherestage',kind:'test',lvl:'honors',
    q:'<p>Where does each stage of cellular respiration happen?</p>',
    choices:['Glycolysis in the cytoplasm; Krebs in the matrix; electron transport on the inner membrane','Glycolysis in the matrix; Krebs in the cytoplasm; electron transport on the inner membrane','Glycolysis on the inner membrane; Krebs in the matrix; electron transport in the cytoplasm','Glycolysis in the cytoplasm; Krebs on the inner membrane; electron transport in the matrix'],correct:0,
    steps:['Glycolysis happens in the cytoplasm, outside the mitochondrion.','Pyruvate enters the mitochondrion, and the Krebs cycle runs in the fluid inside, the matrix.','The electron transport chain and ATP synthase sit in the folded inner membrane.']},
  {id:'equation',kind:'test',lvl:'bio',
    q:'<p>Which equation shows aerobic cellular respiration?</p>',
    choices:['C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + ATP','6 CO₂ + 6 H₂O + light → C₆H₁₂O₆ + 6 O₂','C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂ + 2 ATP','C₆H₁₂O₆ + 6 CO₂ → 6 O₂ + 6 H₂O + ATP'],correct:0,
    steps:['Respiration takes glucose and oxygen in.','It gives off carbon dioxide and water, and the energy is stored in ATP.','The second equation is photosynthesis (the reverse), and the third is yeast fermentation.']}
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
      see: { bio: 'Before dividing, the cell copies every chromosome: each is now doubled, two identical copies stuck together. Still 4 chromosomes.', honors: 'In S phase each chromosome becomes two identical <b>sister chromatids</b>, joined at the centromere. Still 4 chromosomes (2n = 4).', ap: 'In S phase each chromosome becomes two sister chromatids. Still 2n = 4, but DNA doubles from 2C to 4C.' },
      why: 'Each new cell needs a complete set. Copying first gives one full set for each side.',
      overlay(sim,ctx,LH,k){const L=[['S phase: DNA copied',{s:14,w:800}],['Chromosomes: 4'],['Each one: 2 identical copies']];if(H.atLeast('ap'))L.push(['DNA: 2C → 4C',{w:800}]);dvR(ctx,k,L);} },
    { key: 'pro', title: 'Prophase: coil up', fresh: true, speed: 0.5, run: dvGo(2),
      see: 'The long DNA coils into short, thick chromosomes. The nucleus breaks down, and the spindle poles (dots) move apart.',
      why: 'Long strands would tangle like earbud wires. Packed tight, each chromosome moves in one piece.',
      overlay(sim,ctx,LH,k){dvL(ctx,k,[['Prophase',{s:14,w:800}],['DNA coils up'],['Nucleus breaks down'],['Spindle poles move apart']]);} },
    { key: 'meta', title: 'Metaphase: line up', fresh: true, speed: 0.5, run: dvGo(3),
      see: 'Spindle fibers from both poles grab each chromosome and line them up across the center.',
      why: 'One copy faces each pole, so each side will get exactly one copy of every chromosome.',
      so: { honors: 'A checkpoint holds the cell here until every chromosome is attached.' },
      overlay(sim,ctx,LH,k){dvR(ctx,k,[['Metaphase',{s:14,w:800}],['All chromosomes in one line across the middle'],['One copy faces each pole']]);} },
    { key: 'ana', title: 'Anaphase: pull apart', fresh: true, speed: 0.5, run: dvGo(4),
      see: 'The copies split and move to opposite ends. Each end has one copy of all 4 chromosomes.',
      why: { bio: 'Spindle fibers shorten and reel the copies in, like two fishing lines.', honors: 'Centromeres split, and shortening spindle fibers pull the former sisters to opposite poles.' },
      overlay(sim,ctx,LH,k){dvL(ctx,k,[['Anaphase',{s:14,w:800}],['Copies pulled to opposite ends'],['Each end: 4 chromosomes']]);} },
    { key: 'two', title: 'Two identical cells', fresh: true, speed: 0.5, run: dvGo(6),
      see: 'Telophase rebuilds a nucleus at each end, and the cell pinches in two, each with the same 4 chromosomes.',
      why: 'The two cells are genetic copies of the parent and each other.',
      so: 'This is how you grow and how a scraped knee heals.',
      overlay(sim,ctx,LH,k){dvB(ctx,k,LH,[['Mitosis: 2 identical cells, 4 chromosomes each (2n = 4)',{s:14,w:800}]]);} },
    { key: 'pair', title: 'Meiosis: partners pair up', set: { mode: 'meiosis' }, fresh: true, speed: 0.5, run: dvGo(2),
      see: 'Now meiosis, which makes eggs and sperm. After copying, each chromosome pairs with its partner from the other parent.',
      why: { bio: 'Partners carry the same genes. Pairing them lets meiosis give each new cell one of each pair.', honors: 'Each <b>homologous pair</b> has the same genes, one homolog from each parent. Pairing lets meiosis I separate homologs.' },
      overlay(sim,ctx,LH,k){dvL(ctx,k,[['Prophase I',{s:14,w:800}],['Long red + long blue = a pair'],['Short red + short blue = a pair']]);} },
    { key: 'cross', lvl: 'honors', title: 'Crossing over', set: { mode: 'meiosis', xo: true }, fresh: true, speed: 0.5, run: dvGo(2),
      see: 'Partners swap matching pieces where they touch (the yellow X).',
      why: 'Chromatids break and rejoin, so a chromosome comes out part mom, part dad: new allele combinations.',
      overlay(sim,ctx,LH,k){dvL(ctx,k,[['Crossing over',{s:14,w:800}],['Partners trade matching pieces'],['New mixes of alleles on one chromosome']]);} },
    { key: 'ai', title: 'Meiosis I: partners separate', set: { mode: 'meiosis' }, fresh: true, speed: 0.5, run: dvGo(4),
      see: 'Anaphase I pulls partners apart, but each chromosome’s two copies stay together. Each side gets 2, not 4.',
      why: { bio: 'This step halves the number. Which partner goes where is random for each pair.', honors: 'Anaphase I separates homologs, so each daughter is haploid (n = 2). Each pair orients on its own: <b>independent assortment</b>.' },
      overlay(sim,ctx,LH,k){const L=[['Anaphase I',{s:14,w:800}],['Partners separate'],['Copies stay joined'],['Each side: 2 chromosomes']];if(H.atLeast('ap'))L.push(['Each side: n = 2, 2C',{w:800}]);dvL(ctx,k,L);} },
    { key: 'four', title: 'Four cells with half the chromosomes', set: { mode: 'meiosis' }, fresh: true, speed: 0.5, run: dvGo(9),
      see: 'Meiosis II splits each chromosome’s copies. Result: four cells, each with 2 chromosomes, half the parent’s 4.',
      why: 'Egg (n) + sperm (n) = 2n. Without halving, the number would double every generation.',
      overlay(sim,ctx,LH,k){dvB(ctx,k,LH,[['Meiosis: 4 cells, each with 2 chromosomes (n = 2)',{s:14,w:800}],['Egg (n) + sperm (n) → baby (2n)']]);} },
    { key: 'compare', title: 'Mitosis vs meiosis', speed: 0.5,
      see: 'Side by side: mitosis makes 2 cells with all 4 chromosomes; meiosis makes 4 cells with 2 each, all different.',
      why: 'Mitosis copies body cells for growth and repair. Meiosis halves the number to make gametes, and its cells differ.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg;K.dim(ctx,LH);const p=tau%10,kk=Math.min(k,1.2),H=BioLab.h,RED='#c8102e',BLU='#2a6fdb';
        /* 2n = 4 as in the tool: two red (from mom) and two blue (from dad) chromosomes, one long and one short of each */
        const chrom=(x,y,col,len)=>{ctx.save();ctx.strokeStyle=col;ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y-len/2);ctx.lineTo(x,y+len/2);ctx.stroke();ctx.restore();};
        const cell=(x,y,r,set)=>{ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fillStyle='rgba(120,170,120,.18)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#5f8f5f';ctx.stroke();ctx.restore();set.forEach(([c,l],i)=>chrom(x-(set.length-1)*7+i*14,y,c,l));};
        const full=[[RED,30],[BLU,30],[RED,18],[BLU,18]];
        K.tag(ctx,'Mitosis',200,40,k,{hi:true});K.tag(ctx,'Meiosis',600,40,k,{hi:true});
        cell(200,120,40,full);cell(600,120,40,full);
        if(p>1.5){const f=K.ease(Math.min(1,(p-1.5)/1.5));cell(200-70*f,280,36,full);cell(200+70*f,280,36,full);}
        if(p>3.5){const f=K.ease(Math.min(1,(p-3.5)/1.5));[[RED,30],[BLU,30]].forEach(()=>0);
          const g=[[[RED,30],[RED,18]],[[RED,30],[BLU,18]],[[BLU,30],[RED,18]],[[BLU,30],[BLU,18]]];g.forEach((s,i)=>cell(600+(i-1.5)*85*f,280,30,s));}
        if(p>5.5){H.txt(ctx,'2 cells · 4 chromosomes each (2n)',200,350,{s:13.5*kk,w:700,a:'center',b:'middle'});H.txt(ctx,'identical to the parent',200,374,{s:13*kk,a:'center',b:'middle',c:BioLab.h.PAL['cv-soft']});
          H.txt(ctx,'4 cells · 2 chromosomes each (n)',600,350,{s:13.5*kk,w:700,a:'center',b:'middle'});H.txt(ctx,'all different: eggs or sperm',600,374,{s:13*kk,a:'center',b:'middle',c:BioLab.h.PAL['cv-soft']});}
        if(p>7)K.tag(ctx,'Red = from mom · Blue = from dad',400,420,k,{s:12.5});} },
    { key: 'sort', title: 'Many kinds of gametes', set: { mode: 'meiosis', pairs: 3 }, fresh: true, speed: 0.5, run(sim){dvAct(sim,'run100');},
      see: 'With 3 pairs, 100 meioses (400 gametes) are sorted by their mix of red and blue chromosomes.',
      why: 'Each pair is a coin flip: 2 × 2 × 2 = 8 combinations.',
      so: 'With 23 pairs, about 8.4 million, which is why siblings differ.',
      overlay(sim,ctx,LH,k){const t=phM(sim,'types');dvR(ctx,k,[['3 pairs, 100 meioses',{s:14,w:800}],['Gamete types seen: '+(isNaN(t)?'–':t),{w:800,c:CE_GREEN}],['Possible: 2 × 2 × 2 = 8'],['Humans: 2²³ ≈ 8.4 million']]);} },
    { key: 'nd', lvl: 'ap', title: 'Nondisjunction', set: { mode: 'meiosis', nd: true }, fresh: true, speed: 0.5, run: dvGo(9),
      see: 'Pair 1 fails to separate in meiosis I. Two gametes get 3 chromosomes; two get 1.',
      why: 'An extra chromosome gives a 2n + 1 zygote: a trisomy. Most Down syndrome comes from nondisjunction in the egg.',
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
      see: 'Each cell’s center color shows its phase. Most are green (G1) or blue (S). You rarely catch one dividing.',
      why: 'A cycle takes about 23 hours; mitosis only about 1. The share of cells in a phase matches the share of time it takes.',
      so: { ap: 'That is the mitotic index: about 1 h out of 23, so about 4% of cells are in M.' },
      overlay(sim,ctx,LH,k){ccL(ctx,k,[['One cycle ≈ 23 h',{s:14,w:800}],['G1 grow: ~10 h',{c:'#1b7a3a'}],['S copy DNA: ~8 h',{c:CE_BLUE}],['G2 check, get ready: ~4 h',{c:'#6a3fa0'}],['M divide: ~1 h',{w:800}],['Right now: G1 '+ccPct(sim,'G1')+'%, S '+ccPct(sim,'S')+'%, G2 '+ccPct(sim,'G2')+'%, M '+ccPct(sim,'M')+'%',{s:12}]]);} },
    { key: 'clock', title: 'The cycle as a clock', speed: 0.5,
      see: 'One full cycle drawn as a clock: G1 about 10 hours, S 8, G2 4, and mitosis (M) only about 1.',
      why: 'G1, S and G2 together are <b>interphase</b>, where the cell grows and copies its DNA. Mitosis is a small slice at the end.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg;K.dim(ctx,LH);const p=tau%11,kk=Math.min(k,1.25),H=BioLab.h;
        /* phase lengths from sims/cellcycle.js DUR: G1 10, S 8, G2 4, M 1 hour (23 h) */
        const P=[['G1',10,'#2f9e5b','Growth'],['S',8,'#2f6fd6','DNA copied'],['G2',4,'#7a4fa6','Gets ready'],['M',1,'#3a3a44','Mitosis']],cx=250,cy=225,R=138;
        let a0=-Math.PI/2;const sweep=Math.min(1,p/5)*2*Math.PI;
        P.forEach(([n,h,c,l])=>{const a1=a0+h/23*2*Math.PI,e=Math.min(a1,-Math.PI/2+sweep);if(e>a0){ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,a0,e);ctx.closePath();ctx.fillStyle=c;ctx.fill();ctx.strokeStyle=BioLab.h.PAL['cv-sol']||'#fff';ctx.lineWidth=3;ctx.stroke();}
          if(sweep>=a1+Math.PI/2-1e-6&&n!=='M'){const m=(a0+a1)/2;H.txt(ctx,n,cx+Math.cos(m)*R*0.62,cy+Math.sin(m)*R*0.62,{s:18*kk,w:700,c:'#fff',a:'center',b:'middle'});}a0=a1;});
        if(p>=5){let y=120;P.forEach(([n,h,c,l])=>{ctx.fillStyle=c;ctx.fillRect(480,y-9,18,18);H.txt(ctx,n+': '+h+' h, '+l,508,y,{s:14*kk,w:600,b:'middle'});y+=38;});
          K.tag(ctx,'Interphase: G1 + S + G2 = 22 h',cx,cy+R+30,k,{s:13,hi:true});
          const am=-Math.PI/2-0.5/23*2*Math.PI;K.tagA(ctx,'M: about 1 h',cx-24,cy-R-4,k,{s:12.5},'r');}
        K.tag(ctx,'One cell cycle, about 23 hours',400,36,k);} },
    { key: 'fill', title: 'Fill the space, then stop', fresh: true, speed: 4, run(sim){ccFF(sim,150);},
      see: 'Jump to 150 hours. As cells run out of room they turn grey and stop; only edge cells keep dividing.',
      why: { bio: 'Normal cells stop dividing when neighbors touch them on every side. That is how a healing cut knows to stop.', honors: 'Crowded cells fail the G1 checkpoint and rest in G0. This <b>contact inhibition</b> is how a healing cut knows to stop.' },
      overlay(sim,ctx,LH,k){const full=phM(sim,'cells')>=138;ccL(ctx,k,[['At '+ccHrs(sim),{s:14,w:800}],['Cells: '+Math.round(phM(sim,'cells'))+' (room for 144)'],['Still dividing: '+Math.round(phM(sim,'cyc'))+'%',{w:800}],[full?'Out of room, so most rest':'Filling the last gaps…',{s:12}]]);} },
    { key: 'nogf', title: 'No signal, no division', fresh: true, speed: 1, run(sim){ccFF(sim,30);sim._ccOff=null;},
      see: 'The growth factor switches off. Each cell finishes its cycle, then turns grey and rests, even with room around it.',
      why: { bio: 'Cells divide only when neighbors send a “divide” signal. Without it, they stop.', honors: 'Without growth factor, cells fail the G1 checkpoint and enter G0. Cells already in S or G2 finish first.' },
      overlay(sim,ctx,LH,k,tau){if(tau>1.5&&sim.p.gf){BioLab.setValues(sim,{gf:false});sim._ccOff=sim.t;}const off=!sim.p.gf;ccL(ctx,k,[[off?'Signal off at '+Math.round(sim._ccOff||30)+' h':'Growth factor on',{s:14,w:800,c:off?CE_RED:CE_GREEN}],['Now: '+ccHrs(sim)],['Cells: '+Math.round(phM(sim,'cells'))],['Still dividing: '+Math.round(phM(sim,'cyc'))+'%',{w:800}]]);} },
    { key: 'uv', title: 'UV damage: p53 steps in', set: { uv: 0 }, fresh: true, speed: 1.5, run(sim){ccFF(sim,60);},
      see: 'Strong UV switches on. Damaged cells (yellow bolt) are stopped (orange) to repair; badly damaged ones self-destruct. Mutations stay at 0%.',
      why: 'The p53 protein checks DNA and pauses or destroys damaged cells, so damage isn’t passed on.',
      overlay(sim,ctx,LH,k,tau){if(tau>1.5&&sim.p.uv===0)BioLab.setValues(sim,{uv:8});const on=sim.p.uv>0;ccL(ctx,k,[[on?'Strong UV on, p53 working':'No UV yet',{s:14,w:800}],['Now: '+ccHrs(sim)],['Held for repair now: '+sim.st.cells.filter(c=>c.ph==='ARR').length],['Cells with mutations: '+Math.round(phM(sim,'mut'))+'%',{w:800,c:CE_GREEN}],['Self-destructed: '+Math.round(phM(sim,'apop'))]]);} },
    { key: 'nop53', title: 'Broken guard: mutations pile up', set: { uv: 8 }, fresh: true, speed: 3, run(sim){ccFF(sim,40);sim._ccOff=null;},
      see: 'Strong UV, then p53 breaks. Damaged cells keep dividing: amber cells spread, then dark red cells pile up.',
      why: 'Without the checkpoint, damage becomes mutation. One lets a cell divide without a signal; a second lets it ignore crowding: a tumor.',
      overlay(sim,ctx,LH,k,tau){if(tau>1.5&&sim.p.p53){BioLab.setValues(sim,{p53:false});sim._ccOff=sim.t;}const br=!sim.p.p53;ccL(ctx,k,[[br?'p53 broke at '+Math.round(sim._ccOff||40)+' h':'UV 8, p53 working',{s:14,w:800,c:br?CE_RED:CE_GREEN}],['Now: '+ccHrs(sim)],['Cells with mutations: '+Math.round(phM(sim,'mut'))+'%',{w:800,c:CE_RED}],['2+ mutations: '+Math.round(phM(sim,'cancer'))],['Cells: '+Math.round(phM(sim,'cells'))]]);} },
    { key: 'ras', lvl: 'honors', title: 'A stuck gas pedal', set: { gf: false }, fresh: true, speed: 1, run(sim){ccFF(sim,30);},
      see: 'Growth factor has been off, so cells rest (grey). Then Ras gets stuck on, and the cells start dividing again.',
      why: 'Ras passes the growth signal. Locked on, it is an <b>oncogene</b>, a stuck gas pedal. p53 is a <b>tumor suppressor</b>, the brakes.',
      overlay(sim,ctx,LH,k,tau){if(tau>1.5&&!sim.p.ras)BioLab.setValues(sim,{ras:true});ccL(ctx,k,[[sim.p.ras?'Ras stuck on, still no growth factor':'No growth factor, cells resting',{s:14,w:800}],['Now: '+ccHrs(sim)],['Still dividing: '+Math.round(phM(sim,'cyc'))+'%',{w:800}],['Cells: '+Math.round(phM(sim,'cells'))]]);} },
    { key: 'hits', lvl: 'ap', title: 'Cancer takes several hits', set: { uv: 8, p53: false }, fresh: true, speed: 3, run(sim){ccFF(sim,60);},
      see: 'p53 broken, strong UV, 60 hours in. Many cells have one mutation; only a few have two. The two-hit cells take over.',
      why: 'One cell line needs several rare mutations to escape every control. That takes many divisions, so cancer risk climbs with age.',
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
      see: 'The highlighted cell has a round nucleus with a dark spot and no separate chromosomes. Most cells look like this.',
      why: 'In <b>interphase</b> the cell grows and copies its DNA, which stays spread out, so chromosomes don’t show.',
      overlay: rtPh('Interphase', 'Round nucleus, dark nucleolus, grainy DNA, no threads') },
    { key: 'pro', title: 'Prophase', fresh: true, pause: true, run: rtSel('pro'), focus: rtRect('pro'),
      see: 'The DNA has coiled into thick, tangled threads filling the nucleus.',
      why: 'In <b>prophase</b>, coiling packs the copied DNA into movable chromosomes, and the nucleus starts to break down.',
      overlay: rtPh('Prophase', 'Thick, thread-like chromosomes filling the nucleus') },
    { key: 'meta', title: 'Metaphase', fresh: true, pause: true, run: rtSel('meta'), focus: rtRect('meta'),
      see: 'The chromosomes form one dark band across the middle of the cell.',
      why: 'In <b>metaphase</b>, spindle fibers line every chromosome up on the center line.',
      overlay: rtPh('Metaphase', 'One band of chromosomes across the middle') },
    { key: 'ana', title: 'Anaphase', fresh: true, pause: true, run: rtSel('ana'), focus: rtRect('ana'),
      see: 'Two groups of chromosomes move apart toward opposite ends, often bent into V shapes.',
      why: 'In <b>anaphase</b>, the copies are pulled toward the poles at their middles, so the arms trail.',
      overlay: rtPh('Anaphase', 'Two groups pulling apart, often V-shaped') },
    { key: 'telo', title: 'Telophase', fresh: true, pause: true, run: rtSel('telo'), focus: rtRect('telo'),
      see: 'Two dense clumps sit at opposite ends, with a faint new cell plate between them.',
      why: 'In <b>telophase</b>, new nuclei form and the plant builds a new wall down the middle.',
      overlay: rtPh('Telophase', 'Two dark clumps at the ends, a cell plate between') },
    { key: 'count', title: 'Count a few hundred cells', fresh: true, speed: 1, run(sim){rtCount(sim,8);},
      see: 'The sim labels every cell in 8 fields of view, about 320 cells, and adds up the phases.',
      why: 'One field holds only about 40 cells, too few to trust. Counting more fields evens out chance, like polling more people.',
      overlay(sim,ctx,LH,k){const {t,n}=rtT(sim),p=x=>n?(100*x/n).toFixed(1)+'%':'–';rtL(ctx,k,[['Counted: '+n+' cells',{s:15,w:800}],['Interphase: '+t.inter+' ('+p(t.inter)+')'],['Prophase: '+t.pro],['Metaphase: '+t.meta],['Anaphase: '+t.ana],['Telophase: '+t.telo],['Mitotic index: '+p(n-t.inter),{w:800,c:CE_GREEN}],['= dividing cells ÷ all cells',{s:12}]]);} },
    { key: 'time', title: 'From counts to time', fresh: true, speed: 1, run(sim){rtCount(sim,8);},
      see: 'Same counts. The share of cells in metaphase is the share of the cycle spent in metaphase.',
      why: 'Cells divide at random times, so a snapshot works like a time log: fraction × 24 h (an onion root’s cycle) = time in that phase.',
      overlay(sim,ctx,LH,k){const {t,n}=rtT(sim),f=n?t.meta/n:0,mi=n?(n-t.inter)/n:0;rtL(ctx,k,[['Metaphase',{s:15,w:800}],[t.meta+' ÷ '+n+' = '+(100*f).toFixed(1)+'% of cells'],[(100*f).toFixed(1)+'% × 24 h ≈ '+Math.round(f*24*60)+' min',{w:800,c:CE_GREEN}],['All of mitosis',{s:15,w:800}],[(100*mi).toFixed(1)+'% × 24 h ≈ '+(mi*24).toFixed(1)+' h',{w:800}]]);} },
    { key: 'elong', lvl: 'honors', title: 'The elongation zone barely divides', set: { zone: 'elong' }, fresh: true, speed: 1, run(sim){rtCount(sim,8);},
      see: 'The slide moves up to the elongation zone. Almost every cell is in interphase.',
      why: 'These cells stretch instead of dividing, and their stretching pushes the root tip through the soil.',
      overlay(sim,ctx,LH,k){const {t,n}=rtT(sim);rtL(ctx,k,[['Elongation zone',{s:15,w:800}],['Counted: '+n],['Mitotic index: '+(n?(100*(n-t.inter)/n).toFixed(1):'–')+'%',{w:800,c:CE_GREEN}],['Meristem: about 20%',{s:12}]]);} },
    { key: 'colch', lvl: 'ap', title: 'Colchicine: stuck in metaphase', set: { treat: 'colch' }, fresh: true, speed: 1, run(sim){rtCount(sim,8);},
      see: 'A root soaked in colchicine: far more cells in metaphase, few in anaphase or telophase.',
      why: 'Colchicine blocks spindle fibers, so cells line up but can’t pull apart. The mitotic index rises without faster division.',
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
      see: 'Both parents are purple pea plants, Pp: each has two alleles of the flower-color gene, one P and one p.',
      why: { bio: 'One P is enough for purple, so P is <b>dominant</b>. White (p) is <b>recessive</b>: it shows only with two.', honors: '<b>Genotype</b> is the allele pair (Pp); <b>phenotype</b> is what you see (purple).' },
      overlay(sim,ctx,LH,k){crR(ctx,k,[['Genotype: Pp (the alleles)',{s:14,w:800}],['Phenotype: purple (what you see)'],['One P is enough: P is dominant, p recessive',{c:CE_BLUE}]],LH);} },
    { key: 'gametes', title: 'Each gamete gets one allele', fresh: true, pause: true, focus: [[24,150,46,288],[24,150,312,34]],
      see: 'The circles on the edges are gametes, pollen and eggs. Each holds just one allele.',
      why: 'Meiosis splits the pair, so half the gametes carry P and half p: Mendel’s law of segregation.',
      overlay(sim,ctx,LH,k){crR(ctx,k,[['Pp parent → gametes',{s:14,w:800}],['½ carry P, ½ carry p'],['Which one a child gets is a coin flip',{c:CE_BLUE}]],LH);} },
    { key: 'square', title: 'The Punnett square', fresh: true, pause: true, focus: [70,184,266,254],
      see: 'Each box pairs one gamete from each parent: 1 PP, 2 Pp, 1 pp.',
      why: 'Three of four boxes have a P, so expect 3 purple : 1 white. Two purple parents can have a white child.',
      overlay(sim,ctx,LH,k){crR(ctx,k,[['Expected children',{s:14,w:800}],['PP ¼   Pp ½   pp ¼'],['Purple ¾ : white ¼, a 3 : 1 ratio',{w:800,c:CE_GREEN}]],LH);} },
    { key: 'one', title: 'One child at a time', fresh: true, speed: 0.12, run(sim){dvAct(sim,'breed20');}, focus: [[24,150,312,288],[352,8,440,434]],
      see: 'Slowed down: one gamete from each parent meets, and the new plant appears on the right.',
      why: 'Each child is a separate coin flip. The square gives the odds, not a promise.',
      overlay(sim,ctx,LH,k){crR(ctx,k,[['So far: '+crObs(sim),{s:13,w:700}],['Each child: ¾ chance purple, ¼ white']],LH);} },
    { key: 'many', title: 'More children, closer to 3 : 1', fresh: true, speed: 1, run(sim){dvAct(sim,'breed100');},
      see: 'Now 100 children. The counts settle near 75 purple and 25 white, but rarely exactly.',
      why: 'Randomness evens out in big samples. A family of 4 can easily have no white children, or two.',
      overlay(sim,ctx,LH,k){crR(ctx,k,[['Observed: '+crObs(sim),{s:13,w:700}],['Expected: 75 purple, 25 white',{c:CE_GREEN}]],LH);} },
    { key: 'test', title: 'The test cross', set: { p2m: 'pp' }, fresh: true, speed: 0.5, cause: { from: { p2m: 'Pp' }, delay: 1.5, label: 'Parent 2' }, run: atReset,
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,4.5,'b',s=>dvAct(s,'breed20'));const done=sim.p.p2m==='pp';
        crR(ctx,k,[[done?'Purple plant × white plant':'Watch parent 2…',{s:14,w:800}],[done?'Square: 2 Pp : 2 pp → 1 purple : 1 white':'Pp × Pp gives 3 : 1'],[sim.st.n?'Observed: '+crObs(sim):'Breeding starts in a moment',{c:CE_BLUE}]],LH);},
      see: 'Parent 2 becomes a white pp plant. The bottom row turns white, and about half of 20 children are white.',
      why: 'A white parent gives only p, so any white child proves the purple parent hid a p.',
      so: 'Breeders use this test cross to check for purebreds.'},
    { key: 'di', lvl: 'honors', title: 'Two genes: 9 : 3 : 3 : 1', set: { mode: 'di', p1d: 'YyRr', p2d: 'YyRr' }, fresh: true, speed: 1, run(sim){dvAct(sim,'breed100');},
      see: 'Two genes: seed color (Y, y) and shape (R, r). Both parents are YyRr. The square has 16 boxes.',
      why: 'Genes on different chromosomes sort independently, giving 9 yellow round : 3 yellow wrinkled : 3 green round : 1 green wrinkled.',
      overlay(sim,ctx,LH,k){crR(ctx,k,[['YyRr × YyRr',{s:14,w:800}],['Expected 9 : 3 : 3 : 1'],['Observed: '+crObs(sim),{c:CE_BLUE,s:12}]],LH);} },
    { key: 'snap', lvl: 'honors', title: 'Incomplete dominance', set: { mode: 'incomplete', p1i: 'RW', p2i: 'RW' }, fresh: true, speed: 1, run(sim){dvAct(sim,'breed100');},
      see: 'Snapdragons: red × white gives pink. Two pink plants are crossed here.',
      why: 'Neither allele hides the other, so one red allele makes pink. The ratio is 1 red : 2 pink : 1 white.',
      overlay(sim,ctx,LH,k){crR(ctx,k,[['Pink × pink',{s:14,w:800}],['Expected 1 red : 2 pink : 1 white'],['Observed: '+crObs(sim),{c:CE_BLUE,s:12}]],LH);} },
    { key: 'x', lvl: 'honors', title: 'An X-linked gene', set: { mode: 'xlinked', mom: 'XRXr', dad: 'XRY' }, fresh: true, speed: 1, run(sim){dvAct(sim,'breed100');},
      see: 'Fruit flies: eye color is on the X. Mom is a carrier (XᴿXʳ), dad red-eyed (XᴿY). About half the sons are white-eyed.',
      why: 'Sons get their only X from mom, so nothing hides r.',
      so: 'That is why color blindness is far more common in boys.',
      overlay(sim,ctx,LH,k){crR(ctx,k,[['XᴿXʳ × XᴿY',{s:14,w:800}],['Daughters: all red. Sons: ½ white'],['Observed: '+crObs(sim),{c:CE_BLUE,s:12}]],LH);} },
    { key: 'chi', lvl: 'ap', title: 'Is the difference just chance?', fresh: true, speed: 1, run(sim){dvAct(sim,'breed20');},
      see: 'Pp × Pp with only 20 children. The counts are off from 15 : 5.',
      why: 'χ² = Σ (O − E)² ÷ E. With 1 degree of freedom, the critical value is 3.84 at p = 0.05. Below it, the data fit 3 : 1.',
      overlay(sim,ctx,LH,k){crR(ctx,k,[['Observed: '+crObs(sim),{s:13,w:700}],[String(phM(sim,'decision')),{s:12,c:CE_BLUE}]],LH);} },
    { key: 'linked', lvl: 'ap', title: 'Linked genes', set: { mode: 'linked', rf: 5 }, fresh: true, speed: 1, cause: { from: { rf: 50 }, delay: 1, dur: 3, label: 'Distance between genes' }, run: atReset,
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,4.6,'b',s=>dvAct(s,'breed100'));const r=phM(sim,'rfObs');crR(ctx,k,[['Distance: '+Math.round(sim.p.rf)+' map units',{s:14,w:800}],['Recombinant children: '+(isNaN(r)?'breeding soon…':r.toFixed(1)+'%'),{w:800,c:CE_BLUE}],['50 map units acts like unlinked genes',{s:12}]],LH);},
      see: 'Two genes on one chromosome. The distance shrinks from 50 to 5 map units, then 100 test-cross children are bred.',
      why: 'Close genes rarely cross over, so they stay together. Percent recombinants = map distance.'}
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
      see: 'Patient 1’s blood plus anti-A serum in the left well. The smooth red drop turns grainy: the cells clump.',
      why: 'Anti-A antibodies grab only the A antigen. These cells carry A antigens, so the antibodies stick.'},
    { key: 'bridges', title: 'What the clumps are', fresh: true, speed: 1, run(sim){btSet(sim);btAdd(sim,['A']);}, focus: [578,124,212,212],
      see: 'In the close-up, Y-shaped antibodies (blue) each hold two cells at once.',
      why: 'Two arms bridge two cells. Millions of bridges make visible clumps: <b>agglutination</b>.',
      overlay(sim,ctx,LH,k){btC(ctx,k,[['One antibody, two arms, two cells',{s:14,w:800}],['Millions of bridges → visible clumps']],LH);} },
    { key: 'antiB', title: 'Add anti-B serum', fresh: true, speed: 1, run(sim){btSet(sim);btAdd(sim,['A']);}, focus: [[348,202,96,96],[578,124,212,212]],
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.2,'b',s=>btAdd(s,['B']));if(tau<1.2)gnRing(ctx,btWell.B[0],btWell.B[1],44,tau);btC(ctx,k,[[tau<1.2?'Watch the anti-B well…':'Anti-B: '+btR(sim,'B'),{s:14,w:800}],['No B antigens, nothing to grab',{s:12}]],LH);},
      see: 'Anti-B in the middle well. This drop stays smooth.',
      why: 'No B antigens, so anti-B has nothing to grab. No bridges, no clumps.'},
    { key: 'antiRh', title: 'Add anti-Rh serum', fresh: true, speed: 1, run(sim){btSet(sim);btAdd(sim,['A','B']);}, focus: [[448,202,96,96],[578,124,212,212]],
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.2,'r',s=>btAdd(s,['Rh']));if(tau<1.2)gnRing(ctx,btWell.Rh[0],btWell.Rh[1],44,tau);const t=btType(sim);btC(ctx,k,[[tau<1.2?'Watch the anti-Rh well…':'Anti-Rh: '+btR(sim,'Rh'),{s:14,w:800}],[t?'A antigens, no B, Rh present → type '+t:'Reading the wells…',{w:800,c:CE_GREEN}]],LH);},
      see: 'Anti-Rh in the right well clumps too. Together: A antigens, no B, Rh present.',
      why: 'Blood type names the antigens: A, B, AB or O, plus Rh + or −. Patient 1 is <b>A positive</b>.'},
    { key: 'O', title: 'A patient with no antigens', set: { patient: 2 }, fresh: true, speed: 1, cause: { from: { patient: 1 }, delay: 1, dur: 0.6, label: 'Patient' }, run: btSet,
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,2.2,'a',s=>btAdd(s,['A']));atT(sim,tau,3,'b',s=>btAdd(s,['B']));atT(sim,tau,3.8,'r',s=>btAdd(s,['Rh']));const t=btType(sim);
        btC(ctx,k,[['Patient 2',{s:14,w:800}],['Anti-A: '+btR(sim,'A')+' · Anti-B: '+btR(sim,'B')+' · Anti-Rh: '+btR(sim,'Rh'),{s:12}],[t?'No antigens at all → type '+t:'Testing…',{w:800,c:CE_GREEN}]],LH);},
      see: 'Patient 2’s blood gets all three serums. Nothing clumps.',
      why: 'No A, B or Rh antigens: <b>O negative</b>. Almost anyone’s antibodies have nothing to attack.'},
    { key: 'AB', title: 'A patient with both', set: { patient: 3 }, fresh: true, speed: 1, cause: { from: { patient: 1 }, delay: 1, dur: 0.6, label: 'Patient' }, run: btSet,
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,2.2,'a',s=>btAdd(s,['A']));atT(sim,tau,3,'b',s=>btAdd(s,['B']));atT(sim,tau,3.8,'r',s=>btAdd(s,['Rh']));const t=btType(sim);
        btC(ctx,k,[['Patient 3',{s:14,w:800}],['Anti-A: '+btR(sim,'A')+' · Anti-B: '+btR(sim,'B')+' · Anti-Rh: '+btR(sim,'Rh'),{s:12}],[t?'A and B antigens, Rh present → type '+t:'Testing…',{w:800,c:CE_GREEN}]],LH);},
      see: 'Patient 3: all three wells clump.',
      why: 'A, B and Rh antigens: <b>AB positive</b>. Both A and B show: <b>codominance</b>.'},
    { key: 'transfuse', title: 'Who can give blood to whom', fresh: true, speed: 1, run(sim){btSet(sim);btAdd(sim,['A','B','Rh']);},
      see: 'Patient 1 (A+) needs blood. The card shows which donors are safe.',
      why: 'Plasma holds antibodies against the antigens you lack: type A has anti-B, which would clump B or AB cells. O-negative goes to anyone.',
      overlay(sim,ctx,LH,k){btC(ctx,k,[['A+ can receive red cells from',{s:14,w:800}],['A+, A−, O+, O−',{w:800,c:CE_GREEN}],['Not B or AB: their B antigens would clump',{c:CE_RED,s:12}]],LH);} },
    { key: 'alleles', lvl: 'honors', title: 'Genotype from type', fresh: true, speed: 1, run(sim){btSet(sim);btAdd(sim,['A','B','Rh']);},
      see: 'Patient 1 is type A+. Which alleles could that be?',
      why: 'Iᴬ and Iᴮ are codominant; i is recessive. Type A is IᴬIᴬ or Iᴬi. Patient 1 is Iᴬi Dd, so two such parents could have an O− child.',
      overlay(sim,ctx,LH,k){btC(ctx,k,[['Type A+ genotypes',{s:14,w:800}],['IᴬIᴬ or Iᴬi, and DD or Dd'],['Two Iᴬi Dd parents: ¼ × ¼ = 1/16 chance of O−',{c:CE_BLUE,s:12}]],LH);} },
    { key: 'pop', lvl: 'ap', title: 'Allele frequencies from a sample', set: { view: 'pop' }, fresh: true, speed: 1, run(sim){dvAct(sim,'pop');},
      see: 'A random sample of 100 people. Type O people must be ii.',
      why: 'Under Hardy–Weinberg, type O = r², where r is the frequency of i. So r = √(fraction type O).',
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
      see: 'One white blood cell’s chromosomes, stopped in metaphase, burst on a slide and stained.',
      why: 'In metaphase chromosomes are coiled tightest and easiest to see. Each is already copied: two sister chromatids joined at a pinch.',
      overlay(sim,ctx,LH,k){kyC(ctx,k,[['Count them later: is it 46?',{s:14,w:800}],['23 pairs: one of each pair from each parent']],300);} },
    { key: 'size', title: 'Clue 1: size', fresh: true, pause: true, run(sim){kyCase(sim,'T21','M');},
      overlay(sim,ctx,LH,k,tau){kyCh(sim,'1').concat(kyCh(sim,'21')).forEach(c=>gnRing(ctx,c.x,c.y,34,tau));kyC(ctx,k,[['Largest: chromosome 1',{s:14,w:800}],['Smallest: 21 and 22'],['Pairs are numbered by size',{c:CE_BLUE}]],300);},
      see: 'The circled chromosomes are a 1, the largest, and the 21s, among the smallest.',
      why: 'Chromosomes are numbered roughly from largest (1) to smallest (21, 22). Size is the first clue to each one’s partner.'},
    { key: 'centro', title: 'Clue 2: the centromere', fresh: true, pause: true, run(sim){kyCase(sim,'T21','M');},
      overlay(sim,ctx,LH,k,tau){['1','4','14'].forEach(n=>{const c=kyCh(sim,n)[0];if(c)gnRing(ctx,c.x,c.y,34,tau);});kyC(ctx,k,[['Where is the pinch?',{s:14,w:800}],['Middle: 1 · Off-center: 4 · Near the end: 14']],300);},
      see: 'The circled chromosomes are a 1, a 4 and a 14. Look where each is pinched.',
      why: 'The pinch is the <b>centromere</b>: middle on 1, off-center on 4, near the end on 14. Partners share the same position.'},
    { key: 'bands', title: 'Clue 3: banding', fresh: true, pause: true, run(sim){kyCase(sim,'T21','M');},
      overlay(sim,ctx,LH,k,tau){kyCh(sim,'2').forEach(c=>gnRing(ctx,c.x,c.y,36,tau));kyC(ctx,k,[['Same bands = partners',{s:14,w:800}],['The two 2s match band for band']],300);},
      see: 'Both circled chromosomes are chromosome 2. Compare their stripes.',
      why: 'Partners carry the same genes in the same order, so their bands match exactly. Bands settle close calls.'},
    { key: 'arrange', title: 'Arrange the pairs', fresh: true, speed: 1, run(sim){kyCase(sim,'T21','M');},
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'auto',s=>dvAct(s,'auto'));kyC(ctx,k,[[tau<1.5?'Watch them move…':'The karyogram',{s:14,w:800}],['Pairs 1–22, then the sex chromosomes']],tau<1.5?300:60);},
      see: 'Each chromosome slides into its spot in the karyogram, matched by size, centromere and bands.',
      why: '22 pairs of <b>autosomes</b> come first, then the <b>sex chromosomes</b>. Now anything extra or missing stands out.'},
    { key: 'sex', title: 'The sex chromosomes', fresh: true, speed: 1, run(sim){kyCase(sim,'T21','M');sim.st.chs.forEach(c=>c.slot=c.n);},
      overlay(sim,ctx,LH,k,tau){kyCh(sim,'X').concat(kyCh(sim,'Y')).forEach(c=>gnRing(ctx,c.x,c.y,36,tau));kyC(ctx,k,[['X and Y: a male',{s:14,w:800}],['XX is usually female; XY male']],60);},
      see: 'This patient has one X and one small Y.',
      why: 'The Y carries SRY, which starts male development. A typical female has two X chromosomes and no Y.'},
    { key: 'count', title: 'Count and diagnose', fresh: true, speed: 1, run(sim){kyCase(sim,'T21','M');sim.st.chs.forEach(c=>c.slot=c.n);},
      overlay(sim,ctx,LH,k,tau){kyCh(sim,'21').forEach(c=>gnRing(ctx,c.x,c.y,30,tau));kyC(ctx,k,[['Total: '+sim.st.chs.length+' chromosomes',{s:14,w:800}],['Three copies of 21: trisomy 21',{w:800,c:CE_RED}],['Karyotype: 47,XY,+21 (Down syndrome)',{s:12}]],60);},
      see: 'Count them: 47, not 46. Chromosome 21 has three copies.',
      why: 'An extra 21 causes Down syndrome, usually from <b>nondisjunction</b>: a pair fails to separate in meiosis.',
      so: 'About 1 in 700 US babies has Down syndrome; many adults with it work and live into their 60s.'},
    { key: 'kli', lvl: 'honors', title: 'An extra sex chromosome', fresh: true, speed: 1, run(sim){kyCase(sim,'KLI','M');sim.st.chs.forEach(c=>c.slot=c.n);},
      overlay(sim,ctx,LH,k,tau){kyCh(sim,'X').concat(kyCh(sim,'Y')).forEach(c=>gnRing(ctx,c.x,c.y,34,tau));kyC(ctx,k,[['47,XXY',{s:14,w:800}],['Klinefelter syndrome',{w:800,c:CE_RED}],['Two X chromosomes plus a Y',{s:12}]],60);},
      see: 'A different patient: 47 again, but the extra one is an X. The sex chromosomes are XXY.',
      why: 'Extra sex chromosomes are tolerated better, partly because extra X’s are switched off. XXY is Klinefelter syndrome; many are never diagnosed.'},
    { key: 'tur', lvl: 'ap', title: 'A missing chromosome', fresh: true, speed: 1, run(sim){kyCase(sim,'TUR','F');sim.st.chs.forEach(c=>c.slot=c.n);},
      overlay(sim,ctx,LH,k,tau){kyCh(sim,'X').forEach(c=>gnRing(ctx,c.x,c.y,34,tau));kyC(ctx,k,[['45,X',{s:14,w:800}],['Turner syndrome',{w:800,c:CE_RED}],['One X, no second sex chromosome',{s:12}]],60);},
      see: 'Only 45 chromosomes: one X and nothing else in the sex-chromosome spots.',
      why: 'Turner syndrome (45,X) is the only monosomy people commonly survive. Missing an autosome removes too many genes.'}
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
      see: 'A three-generation family. The circled grandparents (I-1, I-2) are joined by a line; their children hang below.',
      why: 'Squares are males, circles females. Shaded means the trait. II-3 is the third person in generation II.'},
    { key: 'down', title: 'Follow the trait down', fresh: true, speed: 1, run(sim){pdFam(sim,'AR');},
      overlay(sim,ctx,LH,k,tau){const f=sim.fam,P=f.P,ph=Math.floor(tau/1.8)%3,g=ph+1;P.filter(p=>p.gen===g).forEach(p=>pdRingP(ctx,p,tau,p.aff?'#c8102e':'#1f5fbf'));
        const n=P.filter(p=>p.gen===g&&p.aff).length,t=P.filter(p=>p.gen===g).length;pdC(ctx,k,[['Generation '+['I','II','III'][ph],{s:14,w:800}],[n+' of '+t+' have the trait',{w:800,c:n?CE_RED:CE_BLUE}],['Watch where it shows up, and where it skips',{s:12}]]);},
      see: 'The circles move down one generation at a time. Count who has the trait.',
      why: 'A grandchild has it though neither parent does. Something was passed down hidden.'},
    { key: 'clueAR', title: 'The recessive clue', fresh: true, speed: 1, run(sim){pdFam(sim,'AR');},
      overlay(sim,ctx,LH,k,tau){const f=sim.fam,P=f.P,c=pdClueAR(f);if(c){const kid=P[c.kids.find(i=>P[i].aff)];pdRingP(ctx,P[c.f],tau,'#1f5fbf');pdRingP(ctx,P[c.m],tau,'#1f5fbf');if(tau>1.2){pdArrow(ctx,P[c.f],kid);pdArrow(ctx,P[c.m],kid);pdRingP(ctx,kid,tau);}
          pdC(ctx,k,[[P[c.f].id+' and '+P[c.m].id+': no trait',{s:14,w:800,c:CE_BLUE}],[tau>1.2?'Their child '+kid.id+' has it':'Watch their child…',{w:800,c:CE_RED}],['So both parents carry it hidden: recessive',{s:12}]]);}},
      see: 'The circled couple don’t have the trait, but one of their children does.',
      why: 'Two unaffected parents can have an affected child only if each carries a hidden allele. That is the clue for <b>recessive</b>.'},
    { key: 'clueAD', title: 'The dominant clue', fresh: true, speed: 1, run(sim){pdFam(sim,'AD');},
      overlay(sim,ctx,LH,k,tau){const f=sim.fam,P=f.P,c=pdClueAD(f);if(c){const kid=P[c.kids.find(i=>!P[i].aff)]||P[c.kids[0]];pdRingP(ctx,P[c.f],tau);pdRingP(ctx,P[c.m],tau);if(tau>1.2){pdArrow(ctx,P[c.f],kid,'#1f5fbf');pdArrow(ctx,P[c.m],kid,'#1f5fbf');pdRingP(ctx,kid,tau,'#1f5fbf');}
          pdC(ctx,k,[['A new family',{s:14,w:800}],[P[c.f].id+' and '+P[c.m].id+(P[c.f].aff&&P[c.m].aff?': both have it':''),{w:800,c:CE_RED}],[tau>1.2?'Child '+kid.id+(kid.aff?' has it':' does not'):'Watch their child…',{w:800,c:CE_BLUE}]]);}},
      see: 'A different family: the circled parents both have the trait, but their circled child does not.',
      why: 'Each parent must hide a normal allele (Aa), so the trait is <b>dominant</b>. Dominant traits don’t skip generations.'},
    { key: 'carriers', lvl: 'honors', title: 'Finding the carriers', fresh: true, speed: 1, run(sim){pdFam(sim,'AR');},
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.2,'rev',s=>{s.fam.revealed=true;s.infoDirty=true;});const f=sim.fam;pdC(ctx,k,[[tau<1.2?'Watch for half-shaded symbols…':'Half-shaded: must be a carrier',{s:14,w:800}],['One recessive allele, no trait'],['Every affected child’s parents',{s:12}]]);},
      see: 'Back to the first family. Half-shaded symbols appear: people who must be carriers.',
      why: 'Parents of every affected child carry one recessive allele. These are <b>obligate carriers</b>.'},
    { key: 'xr', lvl: 'honors', title: 'X-linked recessive', fresh: true, speed: 1, run(sim){pdFam(sim,'XR');},
      overlay(sim,ctx,LH,k,tau){const f=sim.fam,P=f.P;P.filter(p=>p.aff).forEach(p=>{pdRingP(ctx,p,tau);if(p.mother!=null&&tau>1.2){pdArrow(ctx,P[p.mother],p,'#1f5fbf');pdRingP(ctx,P[p.mother],tau,'#1f5fbf');}});
        pdC(ctx,k,[['Only males have it',{s:14,w:800,c:CE_RED}],[tau>1.2?'Sons get it from their mothers':'Where did each son get it?',{w:800,c:CE_BLUE}],['Like color blindness and hemophilia',{s:12}]]);},
      see: 'Only males have the trait. The arrows show each affected grandson got it from his unaffected mother.',
      why: 'A son gets his only X from mom, so one recessive allele shows. Fathers never pass X-linked traits to sons.'},
    { key: 'xd', lvl: 'ap', title: 'X-linked dominant and mitochondrial', fresh: true, speed: 1, run(sim){pdFam(sim,'XD');},
      overlay(sim,ctx,LH,k,tau){const f=sim.fam,P=f.P,c=f.couples.find(c=>P[c.f].aff&&c.kids.length>=2);if(c){pdRingP(ctx,P[c.f],tau);if(tau>1.2)c.kids.forEach(i=>{pdArrow(ctx,P[c.f],P[i],P[i].sex==='F'?'#c8102e':'#1f5fbf');pdRingP(ctx,P[i],tau,P[i].sex==='F'?'#c8102e':'#1f5fbf');});}
        pdC(ctx,k,[['Affected father '+(c?P[c.f].id:''),{s:14,w:800}],[tau>1.2?'All his daughters have it, no sons':'Watch his children…',{w:800,c:CE_RED}],['Mitochondrial: only mothers pass it',{s:12}]]);},
      see: 'X-linked dominant: every daughter of the affected father has the trait, and no son does.',
      why: 'Dads give their X to every daughter and Y to every son. Mitochondrial traits pass from mother to every child.'}
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
      see: 'One spot where DNA is being copied. The double helix (slate) comes in from the right and opens into two strands at the fork.',
      why: 'Each strand is a template: A pairs with T, G with C. Two templates, two copies.',
      overlay(sim,ctx,LH,k){rpC(ctx,k,[['Colors',{s:14,w:800}],['Slate: original strands'],['Pink: new DNA',{c:'#c53a4f'}],['Amber: RNA primers',{c:'#b07a12'}]]);} },
    { key: 'helicase', title: 'Helicase unzips', fresh: true, speed: 0.25,
      see: 'Helicase (purple ring) splits the two strands apart. Topoisomerase ahead keeps the DNA from over-twisting.',
      why: 'Helicase uses ATP to break the hydrogen bonds between bases, so they can be read.',
      overlay(sim,ctx,LH,k){rpC(ctx,k,[['Helicase: the unzipper',{s:14,w:800}],['Fork speed: '+rpM(sim,'speed')+' bases a second',{w:800,c:CE_GREEN}]]);} },
    { key: 'leading', title: 'The leading strand', fresh: true, speed: 0.25, focus: [0,290,800,95],
      see: 'On the bottom, DNA polymerase builds the new strand in one smooth piece, right behind the fork.',
      why: { bio: 'Polymerase builds in only one direction. On this strand that points toward the fork, so it keeps going.', honors: 'Polymerase III builds 5′→3′. On the bottom template that points toward the fork, so the <b>leading strand</b> is continuous.' },
      overlay(sim,ctx,LH,k){rpC(ctx,k,[['Leading strand',{s:14,w:800}],['One continuous piece'],['Built toward the fork',{c:CE_BLUE}]]);} },
    { key: 'lagging', title: 'The lagging strand', fresh: true, speed: 0.25, focus: [0,55,800,110],
      see: 'On the top, the new strand grows away from the fork, in short pieces each starting near the fork.',
      why: 'The strands run opposite ways, so here polymerase fills in short stretches as the fork opens: <b>Okazaki fragments</b>.',
      overlay(sim,ctx,LH,k){rpC(ctx,k,[['Lagging strand',{s:14,w:800}],['Built in short pieces, away from the fork'],['Pieces started: '+rpM(sim,'frags'),{w:800,c:CE_BLUE}]]);} },
    { key: 'primase', lvl: 'honors', title: 'Primase starts each piece', fresh: true, speed: 0.2,
      see: 'Every few moments, primase lays a short RNA starter (amber) near the fork, and polymerase extends it.',
      why: 'DNA polymerase can only add to an existing 3′ end. Primase makes that start out of RNA.',
      overlay(sim,ctx,LH,k){rpC(ctx,k,[['Primase: the starter',{s:14,w:800}],['RNA primers in place: '+rpM(sim,'primers'),{w:800,c:'#b07a12'}]]);} },
    { key: 'join', title: 'Joining the pieces', fresh: true, speed: 0.4, focus: [0,55,800,110],
      see: 'Behind the fork, the amber RNA starters become DNA, and the pieces are sealed into one strand.',
      why: { bio: 'Another polymerase replaces each RNA starter, leaving a tiny break that <b>ligase</b> glues shut.', honors: 'DNA polymerase I replaces each RNA primer, leaving a nick. <b>DNA ligase</b> seals it.' },
      overlay(sim,ctx,LH,k){rpC(ctx,k,[['Ligase: the glue',{s:14,w:800}],['Open gaps right now: '+rpM(sim,'nicks'),{w:800,c:CE_GREEN}]]);} },
    { key: 'noligase', title: 'If ligase stops working', set: { ligase: false }, fresh: true, speed: 0.4, cause: { from: { ligase: true }, delay: 1.5 },
      see: 'Ligase switches off. The fork keeps going and pieces keep coming, but the gaps on the top strand stay open.',
      why: 'Ligase doesn’t make DNA; it joins it. Without it the copy is complete but full of breaks.',
      overlay(sim,ctx,LH,k){rpC(ctx,k,[[sim.p.ligase?'Ligase working':'Ligase off',{s:14,w:800,c:sim.p.ligase?CE_GREEN:CE_RED}],['Fork speed: '+rpM(sim,'speed')+' bases/s'],['Open gaps: '+rpM(sim,'nicks'),{w:800,c:CE_RED}]]);} },
    { key: 'nohelicase', title: 'If helicase stops working', set: { helicase: false }, fresh: true, speed: 0.4, cause: { from: { helicase: true }, delay: 1.5 },
      see: 'Helicase switches off. The fork stops, and everything behind it stalls.',
      why: 'Every other enzyme needs single strands. No unzipping, no copying.',
      overlay(sim,ctx,LH,k){rpC(ctx,k,[[sim.p.helicase?'Helicase working':'Helicase off',{s:14,w:800,c:sim.p.helicase?CE_GREEN:CE_RED}],['Fork speed: '+rpM(sim,'speed')+' bases/s',{w:800,c:CE_RED}],['New DNA made: '+rpM(sim,'newnt')]]);} },
    { key: 'proof', lvl: 'honors', title: 'Proofreading', set: { proof: false }, fresh: true, speed: 0.4, cause: { from: { proof: true }, delay: 1.5 },
      see: 'Proofreading switches off partway. Expected mistakes per genome copy jump about 100 times.',
      why: 'Polymerase checks each base and cuts out wrong ones, cutting errors about 100-fold. Mismatch repair catches most of the rest.',
      overlay(sim,ctx,LH,k){const e=phM(sim,'errors');rpC(ctx,k,[[sim.p.proof?'Proofreading on':'Proofreading off',{s:14,w:800,c:sim.p.proof?CE_GREEN:CE_RED}],['Expected mistakes per genome copy: '+(isNaN(e)?'…':e),{w:800,c:CE_RED}]]);} },
    { key: 'semi', title: 'Half old, half new', fresh: true, speed: 0.6, focus: [0,40,800,370],
      see: 'The two finished helices on the left each have one slate strand and one pink strand.',
      why: 'Each copy keeps one old strand and gets one new: <b>semiconservative</b> replication.',
      overlay(sim,ctx,LH,k){rpC(ctx,k,[['Each copy: 1 old + 1 new strand',{s:14,w:800}],['Semiconservative',{w:800,c:CE_BLUE}]]);} },
    { key: 'ms', lvl: 'ap', title: 'Meselson and Stahl', set: { mode: 'ms' }, fresh: true, speed: 1, run(sim){sim.st.msT=0;},
      see: 'Bacteria grown in heavy ¹⁵N are moved to light ¹⁴N. A centrifuge sorts their DNA by density each generation.',
      why: 'Generation 1: one middle band, ruling out conservative copying. Generation 2: half middle, half light, ruling out dispersive. Only semiconservative fits.'}
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
      see: 'E. coli DNA: a promoter (where RNA polymerase lands), an operator (the switch), then three genes for using lactose.',
      why: 'Genes that work together share one switch, an <b>operon</b>. One mRNA copies all three, so they turn on and off together.',
      overlay(sim,ctx,LH,k){lcC(ctx,k,[['Promoter: start here',{s:13,w:800}],['Operator: the on/off switch'],['lacZ, lacY, lacA: lactose genes']]);} },
    { key: 'off', title: 'Off by default', fresh: true, speed: 1,
      see: 'No lactose: the purple repressor sits on the operator, and RNA polymerase is stuck behind it.',
      why: 'Why make enzymes for a sugar that isn’t there? Blocking the genes saves the cell energy.',
      overlay(sim,ctx,LH,k){lcC(ctx,k,[['No lactose',{s:14,w:800}],['Lac genes: '+String(phM(sim,'state'))],['Enzyme per cell: '+lcM(sim,'bgal'),{w:800,c:CE_BLUE}]]);} },
    { key: 'lactose', title: 'Lactose arrives', set: { lac: true }, fresh: true, speed: 1, cause: { from: { lac: false }, delay: 1.5, label: 'Lactose' },
      see: 'Lactose gets inside, the repressor lets go, red mRNA appears, then green enzymes.',
      why: 'Allolactose binds the repressor and changes its shape so it falls off. RNA polymerase reads the genes: the operon is <b>induced</b>.',
      overlay(sim,ctx,LH,k){lcC(ctx,k,[[sim.p.lac?'Lactose added':'No lactose yet…',{s:14,w:800}],['lac mRNA per cell: '+lcM(sim,'mrna',1)],['Enzyme per cell: '+lcM(sim,'bgal'),{w:800,c:CE_GREEN}]]);} },
    { key: 'glucose', title: 'Glucose comes first', set: { lac: true, glc: true }, fresh: true, speed: 1, cause: { from: { glc: false }, delay: 2, label: 'Glucose' }, run(sim){lcFF(sim,1200);},
      see: 'The genes are on with lactose. Then glucose is added, and the red mRNA thins out.',
      why: 'Glucose is the easier fuel. With it around, cAMP drops, the blue CAP activator lets go, and the genes run low.',
      overlay(sim,ctx,LH,k){lcC(ctx,k,[[sim.p.glc?'Lactose + glucose':'Lactose only',{s:14,w:800}],['Lac genes: '+String(phM(sim,'state'))],['lac mRNA per cell: '+lcM(sim,'mrna',1),{w:800,c:CE_RED}]]);} },
    { key: 'gone', title: 'The lactose runs out', set: { lac: false }, fresh: true, speed: 1, cause: { from: { lac: true }, delay: 2, label: 'Lactose' }, run(sim){lcFF(sim,1200);},
      see: 'The lactose is gone. The repressor snaps back on, mRNA stops, and the enzymes slowly dilute out.',
      why: 'Bacterial mRNA lasts only minutes, so new enzyme stops quickly. The cell can switch on again next time.',
      overlay(sim,ctx,LH,k){lcC(ctx,k,[[sim.p.lac?'Lactose present':'Lactose gone',{s:14,w:800}],['lac mRNA per cell: '+lcM(sim,'mrna',1),{w:800,c:CE_RED}],['Enzyme per cell: '+lcM(sim,'bgal')]]);} },
    { key: 'laci', lvl: 'ap', title: 'A broken repressor', set: { lacI: true }, fresh: true, speed: 1, cause: { from: { lacI: false }, delay: 1.5 },
      see: 'No lactose. Partway through, lacI is broken, so there is no working repressor. The genes switch on anyway.',
      why: 'Nothing blocks the operator, so the operon is always on: <b>constitutive</b>. That showed lacI makes a negative regulator.',
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
      see: 'Pour all 200 flower-color alleles into one pool: 70% are A (purple, dominant), 30% are a (white).',
      why: 'p is the frequency of A and q of a. Every allele is one or the other, so <b>p + q = 1</b>.',
      overlay(sim,ctx,LH,k){hwC(ctx,k,[['p = '+hwM(sim,'pA')+'   q = '+hwM(sim,'qa'),{s:14,w:800}],['p + q = 1']],LH);} },
    { key: 'square', title: 'Random mating', fresh: true, pause: true, focus: [470,110,320,250],
      see: 'With random mating, each new plant draws two alleles. The square shows the chances.',
      why: 'AA = p × p = p². aa = q². Aa can happen two ways: 2pq. So <b>p² + 2pq + q² = 1</b>.',
      overlay(sim,ctx,LH,k){hwC(ctx,k,[['AA = p² = '+hwM(sim,'AA',0)+'%',{s:13,w:800}],['Aa = 2pq = '+hwM(sim,'Aa',0)+'%'],['aa = q² = '+hwM(sim,'aa',0)+'%']],LH);} },
    { key: 'slide', title: 'Change p, change everything', set: { p: 0.6 }, fresh: true, speed: 1, cause: { from: { p: 0.9 }, delay: 1.2, dur: 3 },
      see: 'p slides from 0.90 to 0.60. The boxes resize, and more white flowers appear.',
      why: 'At p = 0.6, q = 0.4: q² = 16% white. 2pq = 48% are purple carriers, more than half of the purple plants.',
      overlay(sim,ctx,LH,k){hwC(ctx,k,[['p = '+hwM(sim,'pA')+'   q = '+hwM(sim,'qa'),{s:14,w:800}],['White (aa) = q² = '+hwM(sim,'aa',0)+'%'],['Hidden carriers (Aa) = 2pq = '+hwM(sim,'Aa',0)+'%',{w:800,c:CE_BLUE}]],LH);} },
    { key: 'hwgraph', title: 'Every p on one graph', speed: 0.5,
      see: 'Genotype shares for every value of p: AA (p², purple), Aa (2pq, gold) and aa (q², gray). The dots mark p = 0.6.',
      why: 'Carriers (Aa) peak at 50% when p = 0.5. When a is rare, almost every copy of it hides in carriers, not in aa plants.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg;K.dim(ctx,LH);const t=tau%11,Pu='#7b3fb0',Go='#b26b00',Gy='#6b6b6b',B={x0:100,x1:620,y0:80,y1:350},xr=[0,1];
        /* Hardy–Weinberg: AA = p², Aa = 2pq, aa = q², q = 1 − p (as in sims/hardyweinberg.js) */
        K.axes(ctx,B,k,{xr,xt:[[0,'0'],[0.2,'0.2'],[0.4,'0.4'],[0.6,'0.6'],[0.8,'0.8'],[1,'1']],yt:[[0,'0%'],[0.5,'50%'],[1,'100%']],xl:'p (share of A alleles)',yl:'Share of plants'});
        const T=Math.min(1,t/4);K.curve(ctx,B,xr,p=>p*p,T,Pu);K.curve(ctx,B,xr,p=>2*p*(1-p),T,Go);K.curve(ctx,B,xr,p=>(1-p)*(1-p),T,Gy);
        if(t>=4.3){const x=K.X(B,xr,0.6);[[0.36,Pu,'AA 36%',14],[0.48,Go,'Aa 48%',-16],[0.16,Gy,'aa 16%',10]].forEach(([v,c,l,dy])=>{K.dot(ctx,x,K.Y(B,v),c,6);K.tagA(ctx,l,B.x1+16,K.Y(B,v)+dy*Math.min(k,1.3),k,{s:12.5,c},'l');});
          K.tagA(ctx,'aa',B.x0+8,K.Y(B,0.92),k,{s:12.5,c:Gy},'l');K.tagA(ctx,'AA',B.x1-8,K.Y(B,0.92),k,{s:12.5,c:Pu},'r');K.tagA(ctx,'Aa peaks at 50%',K.X(B,xr,0.5),K.Y(B,0.5)-26,k,{s:12.5,c:Go,hi:true},'r');}} },
    { key: 'stable', lvl: 'honors', title: 'No forces, no change', set: { p: 0.6 }, fresh: true, speed: 1, run(sim){dvAct(sim,'gen10');},
      see: 'Ten generations of a large, randomly mating population, no selection, migration or mutation. p stays at 0.60.',
      why: 'Shuffling alleles into new plants doesn’t change their counts. Without a force acting, there is no evolution.',
      overlay(sim,ctx,LH,k){hwC(ctx,k,[['Generation '+hwM(sim,'gen',0),{s:14,w:800}],['p = '+hwM(sim,'pA'),{w:800,c:CE_GREEN}],['Started at 0.60']],LH);} },
    { key: 'select', lvl: 'honors', title: 'Turn on selection', set: { p: 0.6, nosel: false }, fresh: true, speed: 1, cause: { from: { nosel: true }, delay: 1.2, label: 'No natural selection' }, run: atReset,
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.6,'g',s=>dvAct(s,'gen10'));hwC(ctx,k,[[sim.p.nosel?'No selection yet…':'White plants survive half as well',{s:13,w:800,c:sim.p.nosel?PAL['cv-ink']:CE_RED}],['Generation '+hwM(sim,'gen',0)],['p = '+hwM(sim,'pA')+' (started at 0.60)',{w:800,c:CE_GREEN}]],LH);},
      see: 'White (aa) plants now survive half as well. Watch p climb over ten generations.',
      why: 'Each aa death removes two a alleles, so q falls. As a gets rare it hides in carriers, so it disappears more and more slowly.'},
    { key: 'drift', lvl: 'honors', title: 'Small populations drift', set: { p: 0.6, large: false }, fresh: true, speed: 1, cause: { from: { large: true }, delay: 1.2, label: 'Large population' }, run: atReset,
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.6,'g',s=>dvAct(s,'gen10'));hwC(ctx,k,[[sim.p.large?'100 plants':'Only 20 plants',{s:14,w:800}],['Generation '+hwM(sim,'gen',0)],['p = '+hwM(sim,'pA')+' (started at 0.60)',{w:800,c:CE_BLUE}]],LH);},
      see: 'The population shrinks to 20 plants, no selection. Watch p wander over ten generations.',
      why: 'Which plants reproduce is partly luck, so frequencies drift at random and can lose an allele: <b>genetic drift</b>.'},
    { key: 'chi', lvl: 'ap', title: 'Testing for evolution', set: { p: 0.6, nosel: false }, fresh: true, speed: 1, run(sim){dvAct(sim,'gen10');},
      see: 'After selection, the counted genotypes are compared with the Hardy–Weinberg prediction.',
      why: 'χ² = Σ (O − E)² ÷ E. With 1 degree of freedom, values above 3.84 mean the population is unlikely to be in equilibrium.',
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
    bio: ['How natural selection works: variation, inheritance and survival', 'Mutations happen by chance; the environment decides which ones last', 'Why “fittest” means fittest for this ground, not best overall', 'Why evolution acts on populations, not on individuals'],
    honors: ['Selection changes allele frequencies over generations', 'Genetic drift and migration', 'Why a hidden recessive allele lingers'],
    ap: ['Selection coefficients and the speed of change', 'Selection, drift, migration and mutation together', 'Comparing replicate populations']
  },
  matters: 'The same process explains antibiotic resistance, pests that shrug off pesticides, and the fur of real rock pocket mice on the lava flows of New Mexico and Arizona, studied by biologists like Michael Nachman.',
  startKey: 'start', startRun: true, startSpeed: 0.4,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Dark lava rock',120,300,k,{s:12,hi:true});tag(ctx,'Dark-allele share in 5 populations',600,110,k,{s:12,hi:true});},
  steps: [
    { key: 'vary', title: 'Variation', fresh: true, speed: 0.3,
      see: 'Mice on dark lava. Most have light fur; about 1 in 10 alleles is D, for dark fur.',
      why: 'Fur color is inherited: DD and Dd are dark, dd light. Inherited variation is the raw material of natural selection.',
      overlay(sim,ctx,LH,k){evC(ctx,k,[['Dark-fur allele D: '+evD(sim)+'%',{s:14,w:800}],['DD, Dd: dark fur'],['dd: light fur']],LH);} },
    { key: 'hunt', title: 'Owls hunt by sight', fresh: true, speed: 0.3,
      see: 'Slowed down: the owl catches mice. Light mice stand out on dark rock and are caught more often.',
      why: 'On lava, dark mice are camouflaged, so more of them live to have babies.',
      overlay(sim,ctx,LH,k){evC(ctx,k,[['On dark rock',{s:14,w:800}],['Light mice: easy to see, caught more',{c:CE_RED}],['Dark mice: hidden, survive more',{c:CE_GREEN}]],LH);} },
    { key: 'gens', title: 'Generation after generation', fresh: true, speed: 1,
      see: 'One generation per second. The share of dark mice and the D allele climb.',
      why: 'Survivors breed, so each generation inherits more D. No mouse changes; the population changes because some leave more offspring.',
      overlay(sim,ctx,LH,k){evC(ctx,k,[['Generation '+Math.round(sim.st.g),{s:14,w:800}],['Dark allele D: '+evD(sim)+'%',{w:800,c:CE_GREEN}],['Dark mice: '+Math.round(phM(sim,'dark'))+'%']],LH);} },
    { key: 'chance', title: 'Mutations come by chance', set: { bg: 'sand', s: 0.4, p0: 0.01, mu: 0.01 }, fresh: true, speed: 0.35,
      see: 'Light sand, almost no dark alleles. Gold rings mark brand-new mutations. A few dark mutants appear each generation, and owls catch most.',
      why: 'A mutation is a random copying error. It isn’t aimed at what would help. On sand the new dark mice stand out.',
      overlay(sim,ctx,LH,k){evC(ctx,k,[['On light sand',{s:14,w:800}],['New dark mutations this generation: '+(sim.st.nMutD||0),{c:'#b8860b',w:800}],['Dark allele D: '+evD(sim)+'%',{c:CE_RED}]],LH);} },
    { key: 'chance2', title: 'Same chance, different ground', set: { bg: 'lava', s: 0.4, p0: 0.01, mu: 0.01 }, fresh: true, speed: 0.6,
      see: 'The same mutation rate on dark lava. New dark mutants hide and breed, and the dark allele passes 50% in about 10 generations.',
      why: 'Chance supplies variation; the environment decides what lasts. Real rock pocket mice evolved dark fur this way on two lava flows.',
      overlay(sim,ctx,LH,k){evC(ctx,k,[['On dark lava',{s:14,w:800}],['Same 1% mutation rate'],['Dark allele D: '+evD(sim)+'%',{w:800,c:CE_GREEN}]],LH);} },
    { key: 'flip', title: 'Change the ground: “fittest” flips', set: { bg: 'lava', p0: 0.5 }, fresh: true, speed: 1, cause: { from: { bg: 'sand' }, delay: 5, label: 'Ground' },
      see: 'Light sand with half the alleles dark: dark mice lose ground. Then the ground switches to lava, and the trend reverses.',
      why: 'Selection depends on the environment, and it has no foresight. “Fittest” means fittest for this ground, now.',
      overlay(sim,ctx,LH,k){evC(ctx,k,[[sim.p.bg==='sand'?'Light sand':'Dark lava',{s:14,w:800}],['Generation '+Math.round(sim.st.g)],['Dark allele D: '+evD(sim)+'%',{w:800,c:sim.p.bg==='sand'?CE_RED:CE_GREEN}]],LH);} },
    { key: 'noowls', title: 'Remove the owls', set: { s: 0, p0: 0.3 }, fresh: true, speed: 1, cause: { from: { s: 0.3 }, delay: 4, label: 'Owl hunting pressure' },
      see: 'Dark mice gain, then the owls are removed. The dark allele stops climbing.',
      why: 'No survival difference, no selection. Frequencies then change only by chance, which is small with 200 mice.',
      overlay(sim,ctx,LH,k){evC(ctx,k,[[sim.p.s>0?'Owls hunting':'No owls',{s:14,w:800}],['Generation '+Math.round(sim.st.g)],['Dark allele D: '+evD(sim)+'%',{w:800,c:CE_BLUE}]],LH);} },
    { key: 'drift', lvl: 'honors', title: 'Chance in small populations', set: { s: 0, N: 10, p0: 0.5 }, fresh: true, speed: 1,
      see: 'No owls and only 10 mice per population. The five bars at top right drift apart; some hit 0% or 100%.',
      why: 'In a tiny population, luck decides which alleles pass on. This <b>genetic drift</b> can fix or lose an allele with no selection.',
      overlay(sim,ctx,LH,k){evC(ctx,k,[['10 mice per population',{s:14,w:800}],['Spread between populations: '+Math.round(phM(sim,'spread'))+' points',{w:800,c:CE_BLUE}],['Lost or fixed: '+String(phM(sim,'fixed'))+' of 5']],LH);} },
    { key: 'migr', lvl: 'honors', title: 'Migration slows selection', set: { m: 0.1, pm: 0.2 }, fresh: true, speed: 1, cause: { from: { m: 0 }, delay: 3, label: 'Migration rate' },
      see: 'On lava with owls, D climbs. Then migrants from a sand population arrive each generation with d alleles.',
      why: '<b>Gene flow</b> pulls frequencies toward the migrants’. Selection and migration settle at a balance short of 100% dark.',
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
      see: 'Ten deer reach an island with plenty of grass and no wolves. Watch the herd and the gauge.',
      why: 'Births outnumber deaths, so growth speeds up. Near the <b>carrying capacity</b> (K = 500) food runs short and growth stops: an S-curve.',
      overlay(sim,ctx,LH,k){PGC(ctx,k,[['Deer: '+pgN(sim)+' (carrying capacity 500)',{w:700}],'Food in use: '+Math.round(phM(sim,'food'))+'%']);} },
    { key: 'moreK', title: 'More food, higher ceiling', set: { model: 'logistic', r: 0.5, K: 1000, N0: 10 }, fresh: true, speed: 1,
      cause: { from: { K: 500 }, delay: 2, dur: 2, ring: [740,130,58], at: [175,62], label: 'Carrying capacity' },
      run(sim){sim.st.N=495;},
      see: 'The herd sits at about 500. Carrying capacity jumps to 1,000, as if the grass doubled.',
      why: 'More food per deer, so births outnumber deaths again until the herd reaches the new K. Food, not breeding speed, sets the limit.',
      overlay(sim,ctx,LH,k){PGC(ctx,k,[['K = '+Math.round(sim.p.K)+' deer (was 500)',{w:700,c:CE_RED}],'Deer: '+pgN(sim)]);} },
    { key: 'curves', title: 'The graph: J-curve vs S-curve', speed: 0.5,
      see: 'Both growth models drawn from 10 deer. Green: food limited, an S that levels off at K = 500. Dashed: no limit, a J that shoots off the top.',
      why: 'Every real population eventually runs short of something, so the S-curve is the one you see in nature.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,kk=Math.min(k,1.25),p=tau%12,B={x0:110,x1:740,y0:70,y1:360},xr=[0,20];K.dim(ctx,LH);
        /* sims/popgrowth.js: logistic dN/dt = rN(1 - N/K), r = 0.5, K = 500, N0 = 10; exponential dN/dt = rN */
        const r=0.5,Kc=500,N0=10,log=t=>Kc/(1+(Kc-N0)/N0*Math.exp(-r*t)),ex=t=>N0*Math.exp(r*t),sc=v=>v/1000;
        K.axes(ctx,B,k,{xr,xt:[[0,'0'],[5,'5'],[10,'10'],[15,'15'],[20,'20']],yt:[[0,'0'],[0.5,'500'],[1,'1,000']],xl:'Years',yl:'Number of deer'});
        ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle=PAL_soft();ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(B.x0,K.Y(B,0.5));ctx.lineTo(B.x1,K.Y(B,0.5));ctx.stroke();ctx.restore();
        function PAL_soft(){return BioLab.h.PAL['cv-soft'];}
        K.tagA(ctx,'K = 500',B.x1,K.Y(B,0.5)+20,k,{s:12.5},'r');
        const t1=p<5?20*p/5:20;K.curve(ctx,B,xr,t=>sc(log(t)),t1,'#1b7a3a');
        if(p>=5){const tmax=Math.log(105)/r,t2=p<9?tmax*(p-5)/4:tmax;K.curve(ctx,B,xr,t=>sc(ex(t)),t2,'#c8102e',[9,6]);}
        if(p>=4.5)K.tagA(ctx,'S-curve: food runs short',K.X(B,xr,12)+10,K.Y(B,0.5)-28,k,{s:13,c:'#1b7a3a',hi:true},'l');
        if(p>=8.5)K.tagA(ctx,'J-curve: no limit',K.X(B,xr,9.4)-12,B.y0+30,k,{s:13,c:'#c8102e'},'r');} },
    { key: 'crash', lvl: 'honors', title: 'A crash, then fast recovery', set: { model: 'logistic', r: 0.5, K: 500, N0: 10 }, fresh: true, speed: 1,
      run(sim){atReset(sim);sim.st.N=495;sim._pgW=null;},
      see: 'A full island of about 500 deer. A disease kills 70%.',
      why: 'Food is plentiful again, so survivors have more young and the herd regrows fast. Growth is <b>density dependent</b>.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,2,'d',s=>{dvAct(s,'disease');s._pgW=pgN(s);});PGC(ctx,k,sim._pgW==null?[['Deer: '+pgN(sim),{w:700}],'Watch…']:[['Disease: 495 → '+sim._pgW+' deer',{w:700,c:CE_RED}],'Now: '+pgN(sim)+' and climbing']);} },
    { key: 'exp', lvl: 'honors', title: 'Take away the limit', set: { model: 'exp', r: 0.5, K: 500, N0: 10 }, fresh: true, speed: 1,
      cause: { from: { model: 'logistic' }, delay: 2.5, at: [175,62], label: 'Growth model' },
      run(sim){sim.st.N=300;},
      see: 'A herd of 300 heads for K. Then the food limit switches off.',
      why: 'With unlimited food the herd grows by the same fraction each year, adding more each year: exponential growth, the J-curve. No real population keeps it up.',
      overlay(sim,ctx,LH,k){PGC(ctx,k,[[sim.p.model==='exp'?'Unlimited food: J-curve':'Limited food: heading for K',{w:700,c:sim.p.model==='exp'?CE_RED:PAL['cv-ink']}],'Deer: '+pgN(sim)]);} },
    { key: 'half', lvl: 'ap', title: 'Fastest at K/2', set: { model: 'logistic', r: 0.5, K: 500, N0: 10 }, fresh: true, speed: 0.6,
      run(sim){sim.st.N=60;},
      see: 'Watch dN/dt, deer added per year, as the herd passes 250.',
      why: 'dN/dt = rN(1 − N/K) peaks at N = K/2: 0.5 × 250 × 0.5 = 62.5 deer a year. Managers harvest near K/2.',
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
      why: 'Plenty of hares feeds more lynx, so lynx rise a little later. Then hares crash, and lynx follow. The cycle repeats about every 10 years.',
      overlay(sim,ctx,LH,k){PPC(ctx,k,[['Hares: '+ppH(sim),{w:700}],['Lynx: '+ppL(sim),{w:700}]]);} },
    { key: 'pgraph', title: 'The classic graph: two waves', speed: 0.5,
      see: 'Forty years of this model on one graph: hares (green, left scale) and lynx (red, right scale).',
      why: 'Each lynx peak comes about 3 years after a hare peak. More hares feed more lynx kittens; then the lynx crash after the hares do.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg;K.dim(ctx,LH);const p=tau%12,G='#1b7a3a',R='#c8102e',B={x0:90,x1:700,y0:80,y1:360},xr=[0,40];
        /* sims/predprey.js at its defaults (b 2.2, hunting 100%, m 0.8, K 20), from H = 4, L = 30:
           dH/dt = bH(1 − H/K) − f(H)L + 0.02, dL/dt = 3f(H)L − mL + 0.1, f(H) = aH/(1 + 2.06aH), a = 0.096 */
        if(!sim._ppG){const a=0.096,f=H=>a*H/(1+a*2.06*H),d=(H,L)=>[2.2*H*(1-H/20)-f(H)*L+0.02,3*f(H)*L-0.8*L+0.1];let H=4,L=30;const dt=0.02,o=[];
          for(let i=0;i<=2000;i++){if(i%5===0)o.push([i*dt,H,L]);const k1=d(H,L),k2=d(H+dt/2*k1[0],L+dt/2*k1[1]),k3=d(H+dt/2*k2[0],L+dt/2*k2[1]),k4=d(H+dt*k3[0],L+dt*k3[1]);H=Math.max(0,H+dt/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]));L=Math.max(0,L+dt/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]));}sim._ppG=o;}
        const o=sim._ppG,at=(t,j)=>{const i=Math.min(o.length-1,Math.round(t/0.1));return o[i][j];};
        K.axes(ctx,B,k,{xr,xt:[[0,'0'],[10,'10'],[20,'20'],[30,'30'],[40,'40']],yt:[[0,'0'],[1/3,'5'],[2/3,'10'],[1,'15']],xl:'Years',yl:'Hares (thousands)',ylOff:44});
        const kk=Math.min(k,1.25);ctx.save();ctx.strokeStyle=R;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(B.x1,B.y0-8);ctx.lineTo(B.x1,B.y1);ctx.stroke();
        [[0,'0'],[0.5,'25'],[1,'50']].forEach(([v,l])=>{const y=B.y1-v*(B.y1-B.y0);ctx.beginPath();ctx.moveTo(B.x1,y);ctx.lineTo(B.x1+5,y);ctx.stroke();BioLab.h.txt(ctx,l,B.x1+9,y,{s:12*kk,b:'middle',c:R});});ctx.restore();
        ctx.save();ctx.translate(B.x1+46*kk,(B.y0+B.y1)/2);ctx.rotate(Math.PI/2);BioLab.h.txt(ctx,'Lynx per 100 km²',0,0,{s:13*kk,w:700,a:'center',b:'middle',c:R});ctx.restore();
        const T=p<7?40*p/7:40;K.curve(ctx,B,xr,t=>at(t,1)/15,T,G);K.curve(ctx,B,xr,t=>at(t,2)/50,T,R);
        if(p>=7.3){K.tagA(ctx,'Hares',B.x0+10,48,k,{s:13,c:G},'l');K.tagA(ctx,'Lynx (lag behind)',B.x1,48,k,{s:13,c:R,hi:true},'r');
          const hx=K.X(B,xr,12.4),lx=K.X(B,xr,14.9);ctx.save();ctx.setLineDash([4,4]);ctx.strokeStyle=BioLab.h.PAL['cv-soft'];ctx.lineWidth=1.5;[hx,lx].forEach(x=>{ctx.beginPath();ctx.moveTo(x,B.y0);ctx.lineTo(x,B.y1);ctx.stroke();});ctx.restore();
          K.tagA(ctx,'≈ 3 years',lx+6,B.y1-26,k,{s:12.5},'l');}} },
    { key: 'trap', title: 'Trap half the lynx', fresh: true, speed: 1,
      run(sim){atReset(sim);sim.st.H=6;sim.st.L=36;sim._ppW=null;},
      see: 'Hares are scarce and lynx many. Trappers remove half the lynx.',
      why: 'Fewer hunters, so hares boom, which feeds a lynx comeback. Removing predators doesn’t keep them down for long.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,2,'t',s=>{s._ppW=ppL(s);dvAct(s,'trap');});PPC(ctx,k,sim._ppW==null?[['Lynx: '+ppL(sim),{w:700}],'Hares: '+ppH(sim)]:[['Lynx: '+ppL(sim)+' (was '+sim._ppW+')',{w:700,c:CE_RED}],'Hares: '+ppH(sim)]);} },
    { key: 'hunt', title: 'Better hunters', set: { hunt: 160 }, fresh: true, speed: 1,
      cause: { from: { hunt: 100 }, delay: 2, dur: 2, at: [420,72], label: 'Lynx hunting success' },
      see: 'Lynx get 60% better at catching hares, as if deep snow slowed the hares.',
      why: 'Hares crash lower and faster, which starves the lynx sooner. A stronger predator makes the swings bigger.',
      overlay(sim,ctx,LH,k){PPC(ctx,k,[['Hunting '+Math.round(sim.p.hunt)+'% (was 100%)',{w:700,c:CE_RED}],'Hares: '+ppH(sim)+'   Lynx: '+ppL(sim)]);} },
    { key: 'kcap', lvl: 'honors', title: 'Food limits the hares too', set: { K: 12 }, fresh: true, speed: 1.5,
      cause: { from: { K: 20 }, delay: 3, dur: 2, at: [420,72], label: 'Carrying capacity for hares' },
      run(sim){sim.st.H=5;sim.st.L=0.3;},
      see: 'Almost no lynx. Watch the hares climb, then their food supply shrink.',
      why: 'Hares level off at a <b>carrying capacity</b> set by their food. Cut the food and the ceiling drops. Prey are controlled from below as well as above.',
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
     see:'Soil is mostly rock broken into grains of three sizes, drawn to scale and magnified 400 times.',
     why:'<b>Sand</b> (0.05–2 mm) feels gritty. <b>Silt</b> (0.002–0.05 mm) feels like flour. <b>Clay</b> (under 0.002 mm) is tiny flat plates and feels sticky.',
     overlay(sim,ctx,LH,k,tau){dim(ctx,LH,0.96);tag(ctx,'The three grain sizes, to scale (400× magnified)',400,34,k);
       if(tau>0.3){slGrain(ctx,180,205,100,2);tag(ctx,'Sand · 0.5 mm',180,338,k,{w:700});tag(ctx,'feels gritty',180,372,k,{s:12.5});}
       if(tau>1.8){slDot(ctx,420,205,4,'#a07a52');slRing(ctx,420,205,16);tag(ctx,'Silt · 0.02 mm',420,338,k,{w:700});tag(ctx,'feels smooth, like flour',420,372,k,{s:12.5});}
       if(tau>3.3){ctx.fillStyle='#7f6a5c';ctx.fillRect(649.5,204.5,1.2,1.2);slRing(ctx,650,205,12);tag(ctx,'Clay · 0.001 mm',650,338,k,{w:700});tag(ctx,'feels sticky when wet',650,372,k,{s:12.5});}
       if(tau>4.8){ctx.save();ctx.beginPath();ctx.arc(690,130,46,0,6.29);ctx.fillStyle='#f4efe9';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=PAL['cv-ink'];ctx.stroke();ctx.strokeStyle='#7d5a4a';ctx.lineWidth=4;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(662+(i%2)*6,112+i*9);ctx.lineTo(712+(i%2)*6,112+i*9);ctx.stroke();}ctx.restore();line(ctx,668,172,654,198);H.txt(ctx,'50× more: flat plates',690,92,{s:11*k,w:700,a:'center'});}
       scaleBar(ctx,40,420,40,'0.1 mm',k);}},
    {key:'shake',title:'Shake the jar: sand falls first',speed:0.04,focus:[236,40,214,400],
     run(sim){sim.st.shakeT=sim.t;},
     see:'Your garden sample is shaken in a jar of water. The clock runs about 2 minutes every second.',
     why:'Heavy sand sinks first, making a bottom layer in about a minute. Tiny silt and clay keep swirling, so the water stays cloudy.',
     overlay(sim,ctx,LH,k){const tj=slTj(sim);dcCard(ctx,k,478,60,300,[[Math.round(tj*60)+' minutes after shaking',{w:700}],tj>0.04?['Sand is down: big grains sink fastest',{c:CE_RED}]:'Watch the bottom of the jar']);}},
    {key:'wait',title:'Silt, then clay, settle',speed:3,focus:[236,40,214,400],
     run(sim){sim.st.shakeT=sim.t;},
     see:'Now 3 hours pass each second. Silt builds a layer on the sand, and the water slowly clears.',
     why:'Silt settles in hours. Clay is so small it can float for a day or more, which is why a creek stays brown after a storm.',
     overlay(sim,ctx,LH,k){const tj=slTj(sim);dcCard(ctx,k,478,60,300,[[(tj<1?Math.round(tj*60)+' minutes':tj.toFixed(0)+' hours')+' after shaking',{w:700}],tj<3?'Silt is settling on the sand':tj<30?['Water still cloudy: clay is still floating',{c:CE_RED}]:'Water clearing: clay has settled']);}},
    {key:'read',title:'Name the soil with the triangle',speed:0.5,focus:[450,90,345,330],
     run(sim){sim.st.shakeT=sim.t-200;},
     see:'The jar settled: 40% sand, 40% silt, 20% clay. Each percentage becomes a line on the triangle.',
     why:'Read clay across, silt down-left and sand up-left. Where the three lines meet, the region names the soil: <b>Loam</b>.',
     overlay(sim,ctx,LH,k,tau){const pt=slP(40,40,20),f=t=>clamp((tau-t)/1.4,0,1);
       slDash(ctx,slP(80,0,20),pt,f(0.6),'#1f5fbf');slDash(ctx,slP(0,40,60),pt,f(2.4),'#1b7a3a');slDash(ctx,slP(40,60,0),pt,f(4.2),'#b3261e');
       if(tau>6)slRing(ctx,pt[0],pt[1],16);
       dcCard(ctx,k,14,40,214,[['Reading the triangle',{w:700}],tau>0.6?['1. Clay 20%: straight across',{c:'#1f5fbf',w:700}]:'',tau>2.4?['2. Silt 40%: down and left',{c:'#1b7a3a',w:700}]:'',tau>4.2?['3. Sand 40%: up and left',{c:'#b3261e',w:700}]:'',tau>6?['4. They meet in Loam',{w:800}]:''].filter(Boolean),{hi:false});}},
    {key:'compare',title:'Different soils land in different places',speed:0.5,focus:[450,90,345,330],
     run(sim){sim.st.shakeT=sim.t-200;},
     see:'Four real soils land on the triangle: a sandy riverbank, a Front Range garden, your loam and a clay subsoil.',
     why:'Each mix lands in its own region. Soils in the same region drain and hold water alike, so the name tells you how it behaves.',
     overlay(sim,ctx,LH,k,tau){SAMPLE_PTS.forEach((s,i)=>{if(tau<0.8+i*1.6)return;const q=slP(s[1],s[2],s[3]);slDot(ctx,q[0],q[1],7,s[4]);});
       dcCard(ctx,k,14,40,214,[['Where each soil lands',{w:700}]].concat(SAMPLE_PTS.filter((s,i)=>tau>=0.8+i*1.6).map(s=>[s[0]+': '+s[1]+'/'+s[2]+'/'+s[3],{s:12}])).concat([['(sand / silt / clay %)',{s:11,c:PAL['cv-soft']}]]),{hi:false});}},
    {key:'drain',title:'Why sand drains and clay holds',set:{mode:'drain'},speed:0.3,
     run(sim){atReset(sim);sim.st.poured=false;},
     see:'Sand, loam and clay columns each get 100 mL of water. Zooms show the gaps between grains.',
     why:'Sand’s big gaps drain in minutes and keep about 10 mL. Clay’s tiny gaps drain over hours and hold about 43 mL.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.2,'pour',s=>{s.st.poured=true;s.st.pourT=s.t;});
       slBubble(ctx,275,170,52,'sand',tau,k);line(ctx,236,150,206,150);tag(ctx,'Sand: big gaps',275,240,k,{s:13});
       slBubble(ctx,525,170,52,'clay',tau,k);line(ctx,564,150,594,150);tag(ctx,'Clay: tiny gaps',525,240,k,{s:13});}},
    {key:'hook',title:'Your question: the sandy garden bed',set:{mode:'drain',sample:'front'},speed:0.3,focus:[335,55,130,385],
     run(sim){atReset(sim);sim.st.poured=false;},
     see:'The middle column is now the Front Range sandy loam bed, 65% sand. The same 100 mL goes in.',
     why:'It keeps about <b>22 mL</b> for roots and drains about 78 mL, mostly within half an hour: between sand and clay, closer to sand.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1,'pour',s=>{s.st.poured=true;s.st.pourT=s.t;});}},
    {key:'farm',title:'What it means on a farm',pause:true,
     see:'Two fields after the same watering: sand left, clay right. Blue dots are water; orange dots are fertilizer.',
     why:'In sand, water and fertilizer race past the roots and are lost (red). In clay, water sits on top and roots run short of air.',
     overlay(sim,ctx,LH,k,tau){dim(ctx,LH,0.97);slField(ctx,20,370,'sand',tau,k);slField(ctx,410,370,'clay',tau,k);
       tag(ctx,'Sandy field',205,34,k,{w:700});tag(ctx,'Clay field',595,34,k,{w:700});
       tag(ctx,'Water and fertilizer wash past the roots',205,432,k,{s:12.5,c:CE_RED});tag(ctx,'Water sits; soggy roots run short of air',595,432,k,{s:12.5,c:CE_RED});}},
    {key:'erode',lvl:'honors',title:'Rain on bare soil',set:{mode:'erosion',cover:false,slope:15},speed:1,fresh:true,
     see:'A bare, plowed field on a slope in a heavy storm. Muddy runoff piles soil in the collector.',
     why:'Raindrops knock grains loose and runoff carries them away. Building 2.5 cm of topsoil takes hundreds of years; one storm can strip it.'},
    {key:'cover',lvl:'honors',title:'Plant cover holds the soil',set:{mode:'erosion',cover:true,slope:15},speed:1,fresh:true,
     cause:{from:{cover:false},delay:2,ring:[330,230,140],at:[175,62],label:'Plant cover'},
     see:'Same field and storm, with grass cover switched on.',
     why:'Leaves soften the rain, roots hold the soil, and more water soaks in. Here cover cuts soil loss about 50 times, so farmers plant cover crops.'},
    {key:'compost',lvl:'ap',title:'Compost holds nutrients',set:{sample:'forest'},speed:0.5,
     run(sim){atReset(sim);sim.st.shakeT=sim.t-200;sim._slC0=null;},
     see:'Acidic forest soil, 20% clay and 6% organic matter. Watch compost get added.',
     why:'Clay and humus carry negative charges that hold nutrients like Ca²⁺ and K⁺. CEC ≈ 0.5 × %clay + 2 × %OM, so organic matter counts about four times as much.',
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
     why:'The axis tilts 23.5° and always points the same way, toward the North Star. So half the year the north leans toward the Sun, half away.',
     overlay(sim,ctx,LH,k){const e=snE(sim);snRing(ctx,e[0],e[1],34);tag(ctx,'Axis always points the same way',218,62,k);}},
    {key:'june',title:'June: the north leans toward the Sun',pause:true,focus:[0,40,425,400],
     run(sim){snJump(sim,171);},
     see:'The June solstice: the north tips toward the Sun, and Denver (red dot) is in daylight most of the day.',
     why:'The noon Sun is directly over 23.5° N, the Tropic of Cancer. It is summer in the north and winter in Australia.',
     overlay(sim,ctx,LH,k){const e=snE(sim);snRing(ctx,e[0],e[1],34);tag(ctx,'North Pole tips toward the Sun',e[0]+80,e[1]-62,k,{hi:true});}},
    {key:'angle',title:'High Sun vs low Sun',focus:[430,40,370,215],pause:true,
     run:F1.run,
     see:'Denver’s noon Sun, June 21, then December 21. Watch the orange patch the beam lights.',
     why:'In June the Sun is 74° up and the beam is concentrated. In December, 27° up, the same beam covers 2.2 times the ground, so each square meter gets less.',
     overlay(sim,ctx,LH,k,tau){const dec=F1.pre(sim,tau);snBox(ctx,436,190,358,52);dcCard(ctx,k,14,48,250,[[dec?'Dec 21':'Jun 21',{w:800}],['Noon Sun: '+snM(sim,'angle').toFixed(0)+'° up',{w:700,c:dec?CE_RED:PAL['cv-ink']}],['Beam spread over '+(1/Math.sin(snM(sim,'angle')*Math.PI/180)).toFixed(1)+'× the ground',{c:dec?CE_RED:PAL['cv-ink']}]]);}},
    {key:'daylen',title:'Long days vs short days',focus:[430,250,370,70],pause:true,
     run:F2.run,
     see:'The yellow daylight bar as the date jumps from June 21 to December 21.',
     why:'Leaning toward the Sun, Denver gets about 15 hours of daylight; leaning away, about 9. Fewer hours heating, longer nights cooling.',
     overlay(sim,ctx,LH,k,tau){const dec=F2.pre(sim,tau);dcCard(ctx,k,14,48,250,[[dec?'Dec 21':'Jun 21',{w:800}],['Daylight: '+snM(sim,'daylen').toFixed(1)+' hours',{w:700,c:dec?CE_RED:PAL['cv-ink']}]]);}},
    {key:'distance',title:'Closest to the Sun in January',focus:[0,40,425,400],pause:true,
     run(sim){atReset(sim);snJump(sim,184);},
     see:'Earth on July 4, farthest from the Sun. Then January 3, closest.',
     why:'Distance changes only about 3%, so sunlight changes about 7%. Denver has winter while Earth is closest, so distance can’t cause the seasons.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,3.5,'jan',s=>snJump(s,2));const jan=tau>=3.5,e=snE(sim);snRing(ctx,e[0],e[1],34);
       dcCard(ctx,k,452,48,330,[[jan?'Jan 3: closest to the Sun':'Jul 4: farthest from the Sun',{w:800}],['Distance: '+(149.6*(1-0.0167*Math.cos(2*Math.PI*(snD(sim)-3)/365))).toFixed(1)+' million km',{w:700}],['Season in Denver: '+(jan?'winter':'summer'),{w:700,c:CE_RED}]]);}},
    {key:'hook',title:'Your question: December vs June sunlight',focus:[430,40,370,330],pause:true,
     run:F3.run,
     see:'Denver on June 21. Watch the date jump to December 21 and the day’s total sunlight change.',
     why:'A lower Sun (27° vs 74°) and shorter days (9 vs 15 hours) stack up: about <b>160 W/m²</b> instead of <b>480</b>, roughly a third.',
     overlay(sim,ctx,LH,k,tau){const dec=F3.pre(sim,tau),q=snM(sim,'insol');dcCard(ctx,k,14,48,270,[[dec?'Dec 21':'Jun 21',{w:800}],['Sunlight energy: '+Math.round(q)+' W/m² (day average)',{w:700,c:dec?CE_RED:PAL['cv-ink']}],dec?['About a third of June’s 483',{c:CE_RED}]:'Watch it change']);}},
    {key:'lat',title:'Equator and Arctic',set:{lat:0},pause:true,focus:[430,40,370,400],
     cause:{from:{lat:39.7},delay:2,dur:2.5,label:'Latitude',at:[218,428]},
     run(sim){atReset(sim);snJump(sim,354);},
     see:'December 21. The place slides from Denver to the equator, then north to 70° N.',
     why:'The equator keeps a high Sun and 12-hour days all year. At 70° N the Sun never rises in late December. Farther from the equator, bigger seasons.',
     overlay(sim,ctx,LH,k,tau){if(tau>8.5){const v=Math.round(lerp(0,70,ease((tau-8.5)/2.5)));if(sim.p.lat!==v)BioLab.setValues(sim,{lat:v});}const l=sim.p.lat;dcCard(ctx,k,14,48,250,[['Latitude: '+l.toFixed(0)+'° N',{w:800}],['Noon Sun: '+Math.max(0,snM(sim,'angle')).toFixed(0)+'° · daylight '+snM(sim,'daylen').toFixed(1)+' h',{w:700,c:CE_RED}]]);}},
    {key:'notilt',lvl:'honors',title:'What if Earth had no tilt?',set:{tilt:0},speed:1,focus:[430,40,370,400],
     cause:{from:{tilt:23.5},delay:2,dur:2.5,label:'Axis tilt',at:[218,428]},
     run(sim){snJump(sim,150);},
     see:'Denver over a year as the tilt shrinks from 23.5° to 0°.',
     why:'With no tilt, Denver would get the same 50° noon Sun and 12-hour days every day: no real seasons.',
     overlay(sim,ctx,LH,k){dcCard(ctx,k,14,48,250,[[snDate(snD(sim)),{w:800}],['Noon Sun: '+snM(sim,'angle').toFixed(0)+'° · daylight '+snM(sim,'daylen').toFixed(1)+' h',{w:700,c:CE_RED}]]);}},
    {key:'cells',lvl:'honors',title:'Uneven heating makes the winds',set:{view:'winds'},speed:1,focus:[520,10,280,430],
     see:'The whole planet. Follow the dots around the red Hadley cells on the right.',
     why:'Warm, moist air rises at the equator and rains: rainforests. It sinks near 30° as dry air, so deserts like the Sahara line up there.'},
    {key:'coriolis',lvl:'ap',title:'The spin bends the winds',set:{view:'winds',coriolis:true},speed:1,focus:[160,40,360,400],
     cause:{from:{coriolis:false},delay:2,label:'Earth’s rotation',at:[338,428]},
     see:'The surface wind arrows when Earth’s spin is switched on.',
     why:'On a spinning planet, moving air curves right in the north and left in the south, making the trade winds and the westerlies that bring Denver’s weather.'}
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
     see:'Six squares of ground under the same sky, from 6 AM into the afternoon. Their temperatures pull apart.',
     why:'Same sunlight, same air. Only the surface differs, and some surfaces turn far more sunlight into heat.',
     overlay(sim,ctx,LH,k){const h=((sim.st.h0+sim.t)%24+24)%24,hh=Math.floor(h);dcCard(ctx,k,14,60,250,[[(hh%12===0?12:hh%12)+(hh<12?' AM':' PM')+' · air '+Math.round(alAir(sim))+' °F',{w:700}],['Blacktop: '+T(sim,'blacktop'),{w:700,c:CE_RED}],['Grass: '+T(sim,'grass'),{w:700,c:CE_GREEN}]]);}},
    {key:'bounce',title:'Bounced back or soaked up',set:{surf:'roof'},speed:0.3,focus:[548,6,244,440],
     cause:{from:{surf:'blacktop'},delay:3,label:'Surface',at:[280,190]},
     run(sim){sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'Yellow dots of sunlight hit the blacktop; a few bounce back, the rest become heat (red wiggles). Then the white roof.',
     why:'The share bounced back is <b>albedo</b>. Blacktop (0.10) absorbs 90%; a white roof (0.70) absorbs only 30%.'},
    {key:'grass',title:'Grass sweats',set:{surf:'grass'},speed:0.3,focus:[8,206,536,236],
     cause:{from:{surf:'concrete'},delay:3,label:'Surface',at:[280,190]},
     run(sim){sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'Concrete and grass at 1 PM. Grass reflects less, so it should be hotter. Check the numbers.',
     why:'Grass is about 20 °F cooler. Water evaporating from its leaves carries heat away, like sweat. Pavement has no water to give up.',
     overlay(sim,ctx,LH,k,tau){alBox(ctx,'concrete','#5b8fd9');alBox(ctx,'grass','#1b7a3a');if(tau>3)alSteam(ctx,'grass',tau);
       dcCard(ctx,k,14,60,290,[['Concrete (reflects 32%): '+T(sim,'concrete'),{w:700}],['Grass (reflects 23%): '+T(sim,'grass'),{w:700,c:CE_GREEN}]]);}},
    {key:'shade',title:'Into the shade',set:{shade:'shade'},speed:1,focus:[8,206,536,236],
     cause:{from:{shade:'sun'},delay:2,label:'Shade',at:[280,190]},
     run(sim){sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'All six surfaces at 1 PM, then a tree’s shade falls over them.',
     why:'In shade every surface drifts toward air temperature. Blacktop takes an hour or more: it stored a lot of heat.',
     overlay(sim,ctx,LH,k){alBox(ctx,'blacktop');dcCard(ctx,k,14,60,250,[['Blacktop: '+T(sim,'blacktop'),{w:700,c:CE_RED}],'Air: '+Math.round(alAir(sim))+' °F']);}},
    {key:'night',title:'Still hot after sunset',speed:1.5,focus:[8,206,536,236],
     run(sim){sim.def.actions.find(a=>a.id==='j19').run(sim);},
     see:'From 7 PM into the night: the blacktop and brick compared with the grass.',
     why:'Blacktop and brick release stored heat after sunset while grass cools fast. That is why cities stay warmer at night.',
     overlay(sim,ctx,LH,k){alBox(ctx,'blacktop');alBox(ctx,'grass','#1b7a3a');const h=((sim.st.h0+sim.t)%24+24)%24,hh=Math.floor(h);dcCard(ctx,k,14,60,250,[[(hh%12===0?12:hh%12)+(hh<12?' AM':' PM'),{w:800}],['Blacktop: '+T(sim,'blacktop'),{w:700,c:CE_RED}],['Grass: '+T(sim,'grass'),{w:700,c:CE_GREEN}]]);}},
    {key:'hook',title:'Your question: the parking lot and the lawn',pause:true,focus:[8,206,536,236],
     run(sim){sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'1 PM on the 78 °F September day: the student lot’s blacktop and the lawn beside it.',
     why:'Blacktop is about <b>124 °F</b>, the lawn about <b>84 °F</b>. Blacktop absorbs 90% of sunlight and has no water to evaporate.',
     so:'That blacktop can burn a dog’s paws.',
     overlay(sim,ctx,LH,k){alBox(ctx,'blacktop');alBox(ctx,'grass','#1b7a3a');dcCard(ctx,k,14,60,250,[['Blacktop: '+T(sim,'blacktop'),{w:800,c:CE_RED}],['Grass: '+T(sim,'grass'),{w:800,c:CE_GREEN}],'Air: '+Math.round(alAir(sim))+' °F']);}},
    {key:'snow',title:'Snow stays at 32 °F',set:{surf:'snow'},speed:0.3,focus:[548,6,244,440],
     cause:{from:{surf:'blacktop'},delay:2.5,label:'Surface',at:[280,190]},
     run(sim){sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'Most of the sunlight bounces off the snow. Watch its temperature.',
     why:'Snow reflects about 85%. What it absorbs goes into melting, so it stays at 32 °F until it’s gone.'},
    {key:'wind',lvl:'honors',title:'Wind carries heat away',set:{wind:25},speed:1,focus:[548,6,244,440],
     cause:{from:{wind:5},delay:2,dur:3,label:'Wind',at:[280,190]},
     run(sim){BioLab.setValues(sim,{surf:'blacktop'});sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'The blacktop at 1 PM as wind rises from 5 to 25 mph. Watch the “Warms the air” bar.',
     why:'Moving air keeps replacing the hot air at the surface, carrying heat off faster, so the blacktop cools.'},
    {key:'drought',lvl:'honors',title:'A lawn in a drought',set:{moist:'dry',surf:'grass'},speed:1,focus:[548,6,244,440],
     cause:{from:{moist:'normal'},delay:2,label:'Moisture',at:[280,190]},
     run(sim){sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'The lawn at 1 PM. The soil dries out; watch the Evaporation bar.',
     why:'Dry grass closes its leaf pores to save water, so it evaporates less and heats up almost like bare ground.'},
    {key:'island',lvl:'ap',title:'Roofs and the urban heat island',set:{set:'roofs',surf:'darkroof'},speed:0.3,focus:[8,206,536,236],fresh:true,
     run(sim){sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'A dark roof, white roof, green roof, parking lot and park lawn at 1 PM.',
     why:'Dark surfaces and little water make cities hotter: the <b>urban heat island</b>. White roofs reflect; green roofs evaporate.'},
    {key:'ice',lvl:'ap',title:'The ice–albedo feedback',set:{set:'ice',surf:'ocean'},speed:0.3,focus:[8,206,536,236],fresh:true,
     run(sim){sim.def.actions.find(a=>a.id==='j13').run(sim);},
     see:'Arctic summer: snowy sea ice, bare ice, a melt pond and open ocean. Compare the energy each absorbs.',
     why:'Snow reflects 85%, ocean only 6%. Melting exposes dark water, which melts more ice: a <b>positive feedback</b>.'}
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
     see:'A slice of the Pacific along the equator: Indonesia left, Peru 15,000 km right. Depth is stretched.',
     why:'Sun-warmed water floats on cold, deep water. The boundary, where temperature drops fast, is the <b>thermocline</b> (dashed line).',
     overlay(sim,ctx,LH,k){tag(ctx,'Warm surface layer',300,205,k);tag(ctx,'Cold deep water',300,395,k);tag(ctx,'Thermocline',520,250,k,{hi:true});}},
    {key:'trades',title:'Wind pushes the ocean',speed:2,focus:[0,100,800,340],set:{state:'custom',trade:1},
     cause:{from:{trade:0.2},delay:2,dur:2,label:'Trade winds',at:[610,24]},
     run(sim){enEq(sim,0.2);},
     see:'Almost no wind at first. Watch the trade winds pick up from east to west, and watch the warm layer.',
     why:'Wind drags warm surface water west into a thick <b>warm pool</b> near Indonesia. The thermocline tilts: deep in the west, shallow in the east.'},
    {key:'upwell',title:'Cold water rises off Peru',speed:0.6,focus:[560,150,240,300],set:{state:'normal'},fresh:true,
     see:'Zoom in on Peru’s coast. Watch the arrows, the green nutrient dots and the fish.',
     why:'As wind pushes surface water away, cold water rises: <b>upwelling</b>. Its nutrients feed plankton, which feed anchovies.',
     overlay(sim,ctx,LH,k){dcCard(ctx,k,236,250,300,[['Wind pushes surface water west',{w:700}],'→ cold, deep water rises','→ nutrients reach the sunlight','→ plankton bloom → anchovies']);}},
    {key:'rain',title:'Rain follows the warm water',speed:0.6,focus:[0,10,800,170],set:{state:'normal'},fresh:true,
     see:'Clouds tower over the warm pool; the air over Peru is dry.',
     why:'Warm water heats moist air that rises and rains on Indonesia. That air sinks over cold water near Peru and stays dry, making a coastal desert.'},
    {key:'elnino',title:'El Niño: the winds weaken',speed:2,focus:[0,10,800,440],set:{state:'elnino'},
     cause:{from:{state:'normal'},delay:2,label:'Conditions',at:[610,24]},
     run(sim){enEq(sim,1);},
     see:'Every 2 to 7 years the trade winds weaken. Watch the warm water, the rain and the fish.',
     why:'The warm pool sloshes east, upwelling stops and fish disappear. Rain moves east too: floods in Peru, drought in Indonesia and Australia. This is <b>El Niño</b>.',
     overlay(sim,ctx,LH,k){card(ctx,k,[['Heaviest rain: '+enM(sim,'rainc'),{w:700}],['Water off Peru: '+enM(sim,'sst').toFixed(1)+' °C',{w:700,c:CE_RED}]]);}},
    {key:'hook',title:'Your question: the Peruvian fishing boat',speed:1.5,focus:[560,150,240,300],set:{state:'normal'},fresh:true,
     run(sim){atReset(sim);enEq(sim,1);sim._en0=null;},
     see:'You run the red boat off Peru. El Niño arrives. Watch your water and catch for a year.',
     why:'The water warms from about 21 °C to over 27 °C in six months. Upwelling falls under 10% of normal, so the catch drops to about 13% in a year.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'nino',s=>{BioLab.setValues(s,{state:'elnino'});s._en0=s.t;});const mo=sim._en0==null?null:Math.max(0,sim.t-sim._en0);
       card(ctx,k,[[mo==null?'Normal year':'El Niño + '+mo.toFixed(0)+' months',{w:800}],['Water off Peru: '+enM(sim,'sst').toFixed(1)+' °C',{w:700}],['Upwelling: '+Math.round(enM(sim,'upw'))+'% of normal'],['Anchovy catch: '+Math.round(enM(sim,'fish'))+'% of normal',{w:700,c:CE_RED}]]);}},
    {key:'lanina',lvl:'honors',title:'La Niña: the opposite swing',speed:2,focus:[0,10,800,440],set:{state:'lanina'},
     cause:{from:{state:'normal'},delay:2,label:'Conditions',at:[610,24]},
     run(sim){enEq(sim,1);},
     see:'A normal year again. Watch the trade winds get stronger than normal.',
     why:'<b>La Niña</b> exaggerates a normal year: more warm water west, stronger upwelling, a colder eastern Pacific, and extra rain in Indonesia and Australia.',
     overlay(sim,ctx,LH,k){card(ctx,k,[['Thermocline off Peru: '+Math.round(enM(sim,'thermo'))+' m deep',{w:700}],['Water off Peru: '+enM(sim,'sst').toFixed(1)+' °C',{w:700,c:'#1f5fbf'}]]);}},
    {key:'global',lvl:'honors',title:'The global conveyor belt',speed:1,focus:[0,20,800,420],set:{view:'global'},
     see:'Zoom out to the planet. Follow the warm surface path (red) and the cold deep path (blue).',
     why:'Winds spin each basin into a <b>gyre</b>. Cold, salty water sinks near Greenland and Antarctica and creeps along the sea floor. The loop takes about 1,000 years.'},
    {key:'colorado',lvl:'ap',title:'From the Pacific to Colorado',speed:2,focus:[0,10,800,170],set:{state:'elnino'},
     cause:{from:{state:'normal'},delay:2,label:'Conditions',at:[610,24]},
     run(sim){enEq(sim,1);},
     see:'Watch the rain center move east, and the Colorado winter outlook.',
     why:'Moving the tropical rain bends the jet stream. El Niño winters often bring storms to southern Colorado; La Niña favors the north. That is a <b>teleconnection</b>.',
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
     see:'One acre of corn in eastern Colorado. Below it: soil, an aquifer of sand and gravel holding groundwater, and a well.',
     why:'Corn needs about 24 inches of water a summer; rain gives about 8. The rest is pumped from the Ogallala Aquifer.',
     overlay(sim,ctx,LH,k){tag(ctx,'Rain: about 8 in a summer',170,92,k);tag(ctx,'Corn needs about 24 in',420,130,k,{hi:true});tag(ctx,'Groundwater is pumped up the well',420,380,k);}},
    {key:'rainonly',title:'Rain alone is not enough',set:{irr:'none'},focus:[0,40,600,200],
     cause:{from:{irr:'furrow'},delay:2.5,label:'Irrigation',at:[300,282]},
     run(sim){fmA(sim,'restart');},
     see:'The pumping stops, so the corn gets rain only.',
     why:'With 8 of the 24 inches it needs, the corn is short and yellow, and the harvest drops from about 183 to 43 bushels an acre.'},
    {key:'drip',title:'Same water, different method',set:{irr:'drip'},focus:[0,140,600,110],
     cause:{from:{irr:'furrow'},delay:3,label:'Irrigation',at:[300,282]},
     run(sim){fmA(sim,'restart');},
     see:'20 inches of water run down furrows, with pale wisps rising off it. Then the same 20 inches go through drip lines.',
     why:'Furrow water evaporates or runs off, so only about 65% reaches roots. Drip delivers about 95%, growing about 216 bushels instead of 183.'},
    {key:'aquifer',title:'Mining the aquifer',set:{irr:'furrow',pest:'ipm'},focus:[0,290,600,160],
     run(sim){atReset(sim);fmA(sim,'restart');},
     see:'Furrow irrigation, 20 inches a year. Watch the water table (dashed blue line) season after season.',
     why:'Pumping lowers the water table, and rain refills only about half a foot a year. After 10 seasons the well must reach about 19 feet deeper.',
     overlay(sim,ctx,LH,k,tau){seasons(sim,tau,1.5,0.8,10);fmCard(ctx,k,[['Seasons grown: '+fmM(sim,'year'),{w:700}],['Water table: '+fmM(sim,'depth').toFixed(1)+' ft down (was 100)',{w:700,c:CE_BLUE}]]);}},
    {key:'hook',title:'Your question: switching to drip',set:{irr:'drip',water:14,pest:'ipm'},focus:[0,0,800,450],
     cause:{from:{irr:'furrow',water:20},delay:2.5,label:'Irrigation',at:[300,282]},
     run(sim){atReset(sim);fmA(sim,'restart');},
     see:'The farmer switches from furrows (20 inches) to drip with 14 inches. Then 10 seasons go by.',
     why:'Drip grows about <b>186 bushels</b> on 14 inches, saving about <b>163,000 gallons per acre</b> a season. Her water table drops about 12 feet instead of 19.',
     overlay(sim,ctx,LH,k,tau){seasons(sim,tau,6.5,0.6,10);fmCard(ctx,k,[['Corn: '+Math.round(fmM(sim,'y'))+' bu/acre with '+sim.p.water+' in',{w:700}],['Water table: '+fmM(sim,'depth').toFixed(1)+' ft down',{w:700,c:CE_BLUE}]]);}},
    {key:'fert',title:'More fertilizer, more pollution',set:{N:250},focus:[0,220,600,230],
     cause:{from:{N:150},delay:2.5,dur:2.5,label:'Nitrogen fertilizer',at:[300,282]},
     run(sim){fmA(sim,'restart');},
     see:'Nitrogen fertilizer rises from 150 to 250 pounds per acre. Watch the green nitrate arrows below the roots.',
     why:'Harvest rises only from about 183 to 193 bushels, but nitrate washing out jumps from about 5 to 37 pounds per acre, into groundwater and streams.'},
    {key:'treadmill',title:'The pesticide treadmill',set:{pest:'spray'},focus:[0,40,800,220],
     run(sim){atReset(sim);fmA(sim,'restart');},
     see:'The same pesticide is sprayed every year. Watch the pests and “Eaten by pests.”',
     why:'A few pests survive each spray because of their genes, and pass on resistance. Losses climb from about 4% to almost 30% in six seasons: natural selection.',
     overlay(sim,ctx,LH,k,tau){seasons(sim,tau,1.5,1.2,6);fmCard(ctx,k,[['Season '+(fmM(sim,'year')+1),{w:700}],['Eaten by pests: '+Math.round(fmM(sim,'loss'))+'%',{w:700,c:CE_RED}]]);}},
    {key:'ipm',title:'Integrated pest management',set:{pest:'ipm'},focus:[0,40,800,220],
     run(sim){atReset(sim);fmA(sim,'restart');},
     see:'Same field and pests, but now with integrated pest management (IPM) for six seasons.',
     why:'Scouting, crop rotation, ladybugs (red dots) and spraying only past a threshold mean far less pressure to evolve resistance. Losses stay near 6 to 8%.',
     overlay(sim,ctx,LH,k,tau){seasons(sim,tau,1.5,1.2,6);fmCard(ctx,k,[['Season '+(fmM(sim,'year')+1),{w:700}],['Eaten by pests: '+Math.round(fmM(sim,'loss'))+'%',{w:700,c:CE_GREEN}]]);}},
    {key:'salt',lvl:'ap',title:'Salt builds up',set:{pest:'ipm'},focus:[0,180,800,80],
     run(sim){atReset(sim);fmA(sim,'restart');},
     see:'Furrow irrigation for 20 seasons. Watch the white crust and the Soil salt number.',
     why:'Water evaporates and the dissolved salt stays. Corn loses about 12% of its yield per dS/m above 1.7, so the harvest falls from about 183 to 136 bushels.',
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
     see:'Niger’s population pyramid: babies at the bottom, oldest at the top, males left, females right.',
     why:'Each bar is a 5-year age group. Niger’s very wide base means almost half its people are under 15, because families average nearly 7 children.',
     overlay(sim,ctx,LH,k){tag(ctx,'Babies and toddlers (0–4)',150,404,k,{hi:true});tag(ctx,'Oldest people',150,70,k);tag(ctx,'Each bar: one 5-year age group',420,250,k);}},
    {key:'cohort',title:'Watch a generation move up',speed:1.5,focus:[20,40,520,400],
     run(sim){hpGo(sim,'niger');sim._hp0=sim.t;},
     see:'The red box follows the babies born at the start of this step, climbing one bar every 5 years.',
     why:'Each group gets older and slides up, losing some to death. Today’s wide base is tomorrow’s huge group of parents.',
     overlay(sim,ctx,LH,k){band(ctx,Math.floor((sim.t-(sim._hp0||0))/5));}},
    {key:'village',title:'Stage 1: many births, many deaths',speed:1.5,focus:[20,40,780,400],
     run(sim){hpGo(sim,'stage1');},
     see:'A farming village in 1750. Watch the birth rate, the death rate and the pyramid.',
     why:'Families are large, but many children die young. Births and deaths nearly cancel, so the population barely grows: <b>Stage 1</b>.',
     overlay(sim,ctx,LH,k){hpCard(ctx,k,rateRows(sim));}},
    {key:'medicine',title:'Stage 2: deaths fall first',speed:1.5,focus:[20,40,780,400],
     run(sim){atReset(sim);hpGo(sim,'stage1');},
     see:'Clean water, vaccines and better food arrive. Life expectancy jumps from 30 to 62 years.',
     why:'Deaths fall from about 37 to 10 per 1,000, but births stay above 30. Growth jumps to about 2.5% a year: <b>Stage 2</b>, a boom.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,2.5,'e0',s=>BioLab.setValues(s,{e0:62}));hpCard(ctx,k,[['Life expectancy: '+sim.p.e0+' years',{w:800,c:tau>2.5?CE_RED:PAL['cv-ink']}]].concat(rateRows(sim,false,tau>2.5)));}},
    {key:'smaller',title:'Stage 3: families get smaller',speed:1.5,focus:[20,40,780,400],
     run(sim){atReset(sim);hpGo(sim,'niger');},
     see:'Niger today. Average family size falls from 6.7 to 3 children.',
     why:'When children survive, girls stay in school and women work, families choose fewer children. Births fall toward deaths: <b>Stage 3</b>.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,2.5,'tfr',s=>BioLab.setValues(s,{tfr:3}));hpCard(ctx,k,[['Children per woman: '+sim.p.tfr,{w:800,c:tau>2.5?CE_RED:PAL['cv-ink']}]].concat(rateRows(sim,tau>2.5,false)));}},
    {key:'hook',title:'Your question: Niger at 2 children',speed:3,pause:true,focus:[20,40,780,400],
     run(sim){atReset(sim);hpGo(sim,'niger');sim._hp0=null;},
     see:'Niger’s 27 million people. Every family drops to about 2 children this year, then 50 years pass.',
     why:'Niger keeps growing, to about <b>41 million in 50 years</b>, because almost half the country is about to become parents. This is <b>population momentum</b>.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.2,'tfr',s=>{BioLab.setValues(s,{tfr:2.1});s._hp0=s.t;s.running=true;if(s.ui&&s.ui.play)s.ui.play.textContent='Pause';});const yrs=sim._hp0==null||tau<1.2?0:Math.floor(sim.t-sim._hp0);if(yrs>=50&&sim.running){sim.running=false;if(sim.ui&&sim.ui.play)sim.ui.play.textContent='Play';}
       hpCard(ctx,k,[['Children per woman: '+sim.p.tfr,{w:800}],['Years later: '+yrs,{w:700}],['Population: '+hpPop(sim),{w:800,c:CE_RED}]]);}},
    {key:'us',title:'Stage 4: a column',speed:1,focus:[20,40,520,400],
     run(sim){hpGo(sim,'us');},
     see:'The United States today. Compare its shape with Niger’s.',
     why:'Low births and low deaths make a column: <b>Stage 4</b>. The bulge in the 60s and 70s is the baby boom, born 1946 to 1964.',
     overlay(sim,ctx,LH,k){hpCard(ctx,k,rateRows(sim));}},
    { key: 'dtm', title: 'The four stages on one graph', speed: 0.5,
      see: 'The demographic transition graph: birth rate (blue), death rate (red), and population (gray) through Stages 1 to 4.',
      why: 'Deaths fall first, births follow later. The population grows fastest in the gap between them, then levels off when both are low.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg;K.dim(ctx,LH);const p=tau%12,Bl='#2a6fdb',Rd='#c8102e',Gy='#6b6b6b',B={x0:90,x1:740,y0:80,y1:350},xr=[0,4];
        /* rates per 1,000 from this tool's steps: Stage 1 village ≈ 38 births, 37 deaths; Stage 2 deaths fall to ≈ 10; Stage 3 births fall; Stage 4 both ≈ 10 */
        const sm=x=>x<=0?0:x>=1?1:x*x*(3-2*x),br=x=>38-28*sm((x-1.6)/1.6),dr=x=>37-27*sm((x-0.7)/1.1),pop=x=>{let s=0;for(let t=0;t<x;t+=0.02)s+=(br(t)-dr(t))*0.02;return s;},PM=pop(4);
        K.axes(ctx,B,k,{xr,xt:[],yt:[[0,'0'],[0.5,'20'],[1,'40']],xl:'Time →',yl:'Per 1,000 people per year'});
        const kk=Math.min(k,1.25);for(let i=1;i<4;i++){const x=K.X(B,xr,i);ctx.save();ctx.setLineDash([4,5]);ctx.strokeStyle=BioLab.h.PAL['cv-soft'];ctx.beginPath();ctx.moveTo(x,B.y0);ctx.lineTo(x,B.y1);ctx.stroke();ctx.restore();}
        ['Stage 1','Stage 2','Stage 3','Stage 4'].forEach((l,i)=>BioLab.h.txt(ctx,l,K.X(B,xr,i+0.5),B.y1+18*kk,{s:12.5*kk,w:700,a:'center',b:'middle'}));
        const T=p<6?4*p/6:4;K.curve(ctx,B,xr,x=>pop(x)/PM,T,Gy,[3,4],3);K.curve(ctx,B,xr,x=>br(x)/40,T,Bl);K.curve(ctx,B,xr,x=>dr(x)/40,T,Rd);
        if(p>=6.3){K.tagA(ctx,'Birth rate',K.X(B,xr,0.08),K.Y(B,38/40)-26,k,{s:12.5,c:Bl},'l');K.tagA(ctx,'Death rate',K.X(B,xr,1.5),K.Y(B,dr(1.5)/40)+26,k,{s:12.5,c:Rd},'l');
          K.tagA(ctx,'Population',B.x1,K.Y(B,1)-22,k,{s:12.5,c:Gy},'r');K.tagA(ctx,'Gap = fast growth',K.X(B,xr,1.45),K.Y(B,0.6),k,{s:12.5,hi:true},'l');}} },
    {key:'japan',title:'Shrinking and aging: Japan',speed:1.4,focus:[20,40,780,400],
     run(sim){hpGo(sim,'japan');},
     see:'Japan, at 1.2 children per family. Watch 30 years go by.',
     why:'Each generation is smaller than the last. The base narrows, deaths outnumber births, and fewer workers support more retirees.',
     overlay(sim,ctx,LH,k){hpCard(ctx,k,[['Population: '+hpPop(sim),{w:800,c:CE_RED}],['Age 65 and older: '+hpM(sim,'old').toFixed(0)+'%',{w:700}],['Growth: '+hpM(sim,'gr').toFixed(1)+'% a year',{w:700}]]);}},
    {key:'migration',lvl:'honors',title:'What migration adds',speed:1,focus:[20,40,780,400],
     run(sim){atReset(sim);hpGo(sim,'us');},
     see:'The United States again. Net migration is set to zero.',
     why:'US births and deaths are nearly equal, so most growth comes from migration, mostly young adults. Without it, growth drops to zero, then below.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,2.5,'mig',s=>BioLab.setValues(s,{mig:0}));hpCard(ctx,k,[['Net migration: '+sim.p.mig+' per 1,000',{w:800,c:tau>2.5?CE_RED:PAL['cv-ink']}],['Growth: '+hpM(sim,'gr').toFixed(2)+'% a year',{w:700}]]);}},
    {key:'dep',lvl:'ap',title:'Doubling time and dependency',speed:2,focus:[20,40,780,400],
     run(sim){hpGo(sim,'japan');},
     see:'Japan over 30 years. Watch the dependency ratio: children plus people 65+, per 100 people aged 15 to 64.',
     why:'It climbs toward 100 dependents per 100 workers, straining pensions. Rule of 70: Niger growing 3.9% a year doubles in about 70 ÷ 3.9 ≈ 18 years.',
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
     see:'A glacier has melted back, leaving bare rock: no soil, no seeds, no life.',
     why:'Rooted plants need soil, and there is none. Life starting from bare rock is <b>primary succession</b>, and it begins with the toughest organisms.',
     overlay(sim,ctx,LH,k){scCard(ctx,k,base(sim));}},
    {key:'lichens',title:'Pioneers make soil',speed:0.6,focus:[[0,290,800,90],[470,50,280,232]],
     run(sim){scAt(sim,'primary',0);},
     see:'The close-up of the rock and the soil depth as the first decades pass.',
     why:'Lichens, the <b>pioneer species</b>, cling to rock, crack it with acids and add their remains. Mosses follow. After about a century: only about 2 cm of soil.',
     overlay(sim,ctx,LH,k){scCard(ctx,k,base(sim));}},
    {key:'grass',title:'Grasses and flowers move in',speed:1,focus:[0,150,800,200],
     run(sim){scAt(sim,'primary',70);},
     see:'The soil is a couple of centimeters deep. Grasses and wildflowers arrive.',
     why:'Now roots can grow. Grasses cover the ground fast and build soil faster than lichens. Each stage makes room for the next.',
     overlay(sim,ctx,LH,k){scCard(ctx,k,base(sim));}},
    {key:'trees',title:'Shrubs, then trees',speed:1.5,focus:[0,40,800,320],
     run(sim){scAt(sim,'primary',150);},
     see:'Shrubs, then fast-growing trees, take root as the soil deepens.',
     why:'Woody plants need deeper soil. Taller plants shade out the grasses. By about year 225, trees cover half the slope.',
     overlay(sim,ctx,LH,k){scCard(ctx,k,base(sim).concat([['Tree cover: '+Math.round(scM(sim,'trees'))+'%',{w:700,c:CE_GREEN}]]));}},
    {key:'climax',title:'The climax forest',speed:2,focus:[0,40,800,320],
     run(sim){scAt(sim,'primary',300);},
     see:'The forest ages. Watch the number of plant species.',
     why:'Shade-tolerant spruce and fir take over, and sun-lovers die out: species drop from about 20 to 8. This stable stage is the <b>climax community</b>.',
     overlay(sim,ctx,LH,k){scCard(ctx,k,[['Year '+Math.floor(sim.t),{w:800}],['Plant species: '+Math.round(scM(sim,'rich')),{w:700,c:CE_RED}],['Stage: '+scM(sim,'stage'),{w:700}]]);}},
    {key:'fire',title:'Fire: secondary succession',speed:0.6,focus:[0,40,800,410],
     run(sim){atReset(sim);scAt(sim,'primary',420);sim._sc0=null;},
     see:'A wildfire burns through an old forest. Then the slope recovers.',
     why:'Fire kills plants, but soil, roots and seeds survive. Grasses return in years, trees in decades: <b>secondary succession</b>.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,2,'burn',s=>{const a=s.def.actions.find(x=>x.id==='fire');a.run(s);s._sc0=s.t;});
       scCard(ctx,k,[[sim._sc0==null?'Old forest':'Years since the fire: '+Math.floor(sim.t-sim._sc0),{w:800}],['Tree cover: '+Math.round(scM(sim,'trees'))+'%',{w:700,c:CE_GREEN}],['Soil: '+scM(sim,'soil').toFixed(1)+' cm (it survived)',{w:700,c:'#8a5a2a'}]]);}},
    {key:'hook',title:'Your question: fire slope vs glacier slope',speed:0.3,focus:[0,40,800,410],
     run(sim){scAt(sim,'secondary',0);},
     see:'The burned slope above the town, from the year after the fire. Watch the tree cover.',
     why:'Trees cover <b>half the ground by about year 30</b>. On bare glacier rock, that takes until about <b>year 225</b>, because soil must be built first.',
     overlay(sim,ctx,LH,k){scCard(ctx,k,[['Burned slope, year '+Math.floor(sim.t),{w:800}],['Tree cover: '+Math.round(scM(sim,'trees'))+'%',{w:800,c:CE_GREEN}],['Bare rock reaches 50% around year 225',{s:12,c:PAL['cv-soft']}]]);}},
    {key:'aspen',lvl:'honors',title:'Aspen first, then spruce and fir',speed:2,focus:[0,40,800,320],
     run(sim){scAt(sim,'secondary',20);},
     see:'The burned slope from year 20 on: light green aspen and dark spruce and fir.',
     why:'Aspen sprout from surviving roots and lead in full sun, but can’t grow in shade. Shade-tolerant spruce and fir replace most of them by about year 250.',
     overlay(sim,ctx,LH,k){scCard(ctx,k,[['Year '+Math.floor(sim.t),{w:800}],['Aspen cover: '+Math.round(scM(sim,'aspen'))+'%',{w:700,c:'#6f9a2a'}],['Stage: '+scM(sim,'stage'),{w:700}]]);}},
    {key:'idh',lvl:'ap',title:'Intermediate disturbance',set:{dist:3},speed:2,focus:[0,40,800,410],
     run(sim){scAt(sim,'secondary',0);},
     see:'A moderate fire now burns about every 33 years. Watch the species count and its long-run average.',
     why:'No fires: shade trees crowd out the rest. Constant fires: only fast colonizers. Fires now and then keep every stage, so the most species: the <b>intermediate disturbance hypothesis</b>.',
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
     see:'The green mainland on the left holds 100 species (the icons). Island A (top) is big and 10 km off; island B (bottom) is small and 500 km off.',
     why:'Species reach islands by flying, floating or riding storms. Both islands start empty.',
     overlay(sim,ctx,LH,k){tag(ctx,'Island A: big, 10 km away',330,40,k);tag(ctx,'Island B: small, 500 km away',560,420,k);}},
    {key:'arrive',title:'Species arrive',speed:1,focus:[100,0,700,450],fresh:true,
     see:'Species fly across and settle. The clock runs about 20 years every second.',
     why:'Close island A gets frequent arrivals and fills fast. Few species cross 500 km to reach island B.',
     overlay(sim,ctx,LH,k){ibCard(ctx,k,[['Year '+Math.floor(sim.t),{w:800}],['Island A: '+ibM(sim,'spA')+' species',{w:700,c:CE_GREEN}],['Island B: '+ibM(sim,'spB')+' species',{w:700,c:CE_BLUE}]]);}},
    {key:'balance',title:'Arrivals balance extinctions',speed:1,focus:[100,0,700,450],
     see:'Island A’s species count levels off. Watch the icons and the arrival and extinction numbers.',
     why:'New species keep arriving and others die out at about the same rate. The count holds at an <b>equilibrium</b> while the list changes.',
     overlay(sim,ctx,LH,k){const s=sim.st;ibCard(ctx,k,[['Island A, year '+Math.floor(sim.t),{w:800}],['Species now: '+s.SA,{w:700,c:CE_GREEN}],['Species that arrived so far: '+s.arrA],['Species that died out so far: '+s.extinctA,{c:CE_RED}]]);}},
    { key: 'mwgraph', title: 'The graph: where the lines cross', speed: 0.5,
      see: 'The island model as a graph: arrivals fall and extinctions rise as species pile up. Where they cross is the equilibrium.',
      why: 'Fewer new species are left to arrive, and more can die out. Big, close island A crosses near 84; small, far B near 8.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg;K.dim(ctx,LH);const p=tau%12,A='#2a6fdb',Bc='#b26b00',B={x0:100,x1:720,y0:80,y1:340},xr=[0,100],Y=2.2;
        /* sims/islandbio.js: immigration = I0(1 − S/100) with I0 = 2e^(−d/200); extinction = E0·S/100 with E0 = 4·area^(−0.35) */
        const I0=d=>2*Math.exp(-d/200),E0=a=>4*Math.pow(a,-0.35),ia=I0(10),ea=E0(1000),ib=I0(500),eb=E0(10),eqa=100*ia/(ia+ea),eqb=100*ib/(ib+eb);
        K.axes(ctx,B,k,{xr,xt:[[0,'0'],[50,'50'],[100,'100']],yt:[[0,'0'],[1/2.2,'1'],[2/2.2,'2']],xl:'',yl:'Species per year'});BioLab.h.txt(ctx,'Species on the island →',B.x1,B.y1+76*Math.min(k,1.25),{s:13*Math.min(k,1.25),w:700,a:'right',b:'middle'});
        const f=Math.min(1,p/3);K.curve(ctx,B,xr,S=>ia*(1-S/100)/Y,100*f,A);K.curve(ctx,B,xr,S=>ea*S/100/Y,100*f,A,[8,6]);
        const drop=(eq,e,c,l)=>{const x=K.X(B,xr,eq),y=K.Y(B,e*eq/100/Y);K.dot(ctx,x,y,c,7);ctx.save();ctx.setLineDash([3,4]);ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,B.y1);ctx.stroke();ctx.restore();K.tag(ctx,l,x,B.y1+48,k,{s:12.5,c,hi:true});};
        if(p>=3.2){K.tagA(ctx,'Solid: arrivals · Dashed: extinctions',B.x0+10,40,k,{s:12.5},'l');drop(eqa,ea,A,'A ≈ '+Math.round(eqa));}
        if(p>=5.5){const g=Math.min(1,(p-5.5)/2.5);K.curve(ctx,B,xr,S=>ib*(1-S/100)/Y,100*g,Bc);K.curve(ctx,B,xr,S=>eb*S/100/Y,100*g,Bc,[8,6]);
          if(g>=1)drop(eqb,eb,Bc,'B ≈ '+Math.round(eqb));}} },
    {key:'size',title:'Small islands lose species',set:{aArea:10},speed:1,focus:[100,0,700,260],
     cause:{from:{aArea:1000},delay:2.5,label:'Island A size',at:[300,412]},
     see:'Island A shrinks from 1,000 km² to 10 km², at the same distance.',
     why:'Small islands hold small populations that one storm or disease can wipe out. Extinctions rise, so the equilibrium falls.',
     overlay(sim,ctx,LH,k){ibCard(ctx,k,[['Island A: '+ibM(sim,'spA')+' species',{w:800,c:CE_GREEN}],['Area: '+sim.p.aArea.toLocaleString()+' km²',{w:700}]]);}},
    {key:'dist',title:'Closer islands gain species',set:{bDist:10},speed:1,focus:[100,200,700,250],
     cause:{from:{bDist:500},delay:2.5,label:'Island B distance',at:[300,412]},
     see:'Small island B moves from 500 km to 10 km offshore.',
     why:'Close islands are easy to reach. Arrivals jump, so B climbs to a much higher equilibrium even though it is still small.',
     overlay(sim,ctx,LH,k){ibCard(ctx,k,[['Island B: '+ibM(sim,'spB')+' species',{w:800,c:CE_BLUE}],['Distance: '+sim.p.bDist+' km',{w:700}]]);}},
    {key:'hook',title:'Your question: bigger or closer?',set:{aArea:10,aDist:10,bArea:1000,bDist:500},speed:1.5,focus:[100,0,700,450],fresh:true,
     see:'Both choices start empty: A, a small 10 km² island moved to 10 km offshore; B, 100 times bigger but still 500 km out.',
     why:'Closer wins: about <b>52 species</b> vs <b>32</b>. Big islands keep species, but few reach a far one.',
     overlay(sim,ctx,LH,k){ibCard(ctx,k,[['Year '+Math.floor(sim.t),{w:800}],['A (small, close): '+ibM(sim,'spA')+' species, heading for '+ibEq(sim,'A'),{w:700,c:CE_GREEN}],['B (big, far): '+ibM(sim,'spB')+' species, heading for '+ibEq(sim,'B'),{w:700,c:CE_BLUE}]]);}},
    {key:'storm',lvl:'honors',title:'After a disaster',speed:1,focus:[100,0,700,260],
     run(sim){atReset(sim);},
     see:'Island A at equilibrium. A hurricane wipes out about half its species.',
     why:'More empty spots and fewer species to lose, so arrivals outpace extinctions. It refills toward the same equilibrium.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,2,'hit',s=>{const a=s.def.actions.find(x=>x.id==='hurricane');a.run(s);});ibCard(ctx,k,[['Island A: '+ibM(sim,'spA')+' species',{w:800,c:CE_GREEN}],['Equilibrium: about '+ibEq(sim,'A'),{w:700}]]);}},
    {key:'frag',lvl:'ap',title:'Fragmenting a forest',set:{frag:true},speed:1,focus:[100,0,700,260],
     cause:{from:{frag:false},delay:2.5,label:'Fragmentation',at:[300,412]},
     see:'Island A as a 1,000 km² forest. Roads cut it into 10 patches.',
     why:'Each patch acts like a small island, so extinctions rise. Fragmentation is a top cause of biodiversity loss.',
     overlay(sim,ctx,LH,k){ibCard(ctx,k,[['Each patch: '+ibM(sim,'spA')+' species, heading for '+ibEq(sim,'A'),{w:800,c:CE_RED}]]);}},
    {key:'corr',lvl:'ap',title:'Wildlife corridors',set:{frag:true,corr:true,aDist:200},speed:1,focus:[100,0,700,260],
     cause:{from:{corr:false},delay:2.5,label:'Corridors',at:[300,412]},
     see:'The fragments, 200 km from big forest. Strips of habitat connect them.',
     why:'Corridors act like moving patches closer, so immigration rises and the equilibrium climbs. Colorado’s Highway 9 overpasses do this for elk.',
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
     see:'Denver’s climatograph: the red line is monthly temperature; blue bars are monthly precipitation.',
     why:'The bars add up to about 38 cm a year. On the Whittaker diagram, the red dot lands in temperate grassland: shortgrass prairie.',
     overlay(sim,ctx,LH,k){tag(ctx,'Temperature each month',640,30,k);tag(ctx,'Precipitation each month',560,282,k);bmCard(ctx,k,cl(sim));}},
    {key:'water',title:'Water decides forest or grass',pause:true,set:{place:'custom',tmean:10,pcm:120},focus:[40,30,370,380],
     cause:{from:{pcm:40},delay:2,dur:4,label:'Yearly precipitation',at:[230,412]},
     see:'A place near 10 °C, like Denver. Its yearly precipitation rises from 40 cm to 120 cm.',
     why:'At 10 °C: under 25 cm is desert, 25–60 cm grassland, and over about 60 cm grows trees, which need more water.',
     overlay(sim,ctx,LH,k){bmCard(ctx,k,cl(sim));}},
    {key:'hook',title:'Your question: Denver vs Boston',pause:true,set:{place:'boston'},focus:[40,30,760,400],
     cause:{from:{place:'denver'},delay:2.5,label:'Place',at:[230,412]},
     see:'Denver’s climate switches to Boston’s. Compare the bars and the dot.',
     why:'Temperatures match (about 10 vs 11 °C), but Boston gets <b>113 cm</b> a year, three times Denver’s <b>38 cm</b>. Water, not warmth, keeps trees off Denver’s plains.',
     overlay(sim,ctx,LH,k){bmCard(ctx,k,[[sim.p.place==='boston'?'Boston':'Denver',{w:800}]].concat(cl(sim)));}},
    {key:'desert',title:'Desert: water is the limit',pause:true,set:{place:'phoenix'},focus:[400,30,400,420],
     see:'Phoenix, Arizona. Look at how short the blue bars are.',
     why:'Phoenix is hot and sunny but gets only about 20 cm of rain a year: desert. Water is the <b>limiting factor</b>, so plants store water or have tiny waxy leaves.',
     overlay(sim,ctx,LH,k){bmCard(ctx,k,cl(sim));}},
    {key:'cold',title:'Tundra and taiga: cold is the limit',pause:true,set:{place:'fairbanks'},focus:[40,30,760,400],
     cause:{from:{place:'utqiagvik'},delay:3,label:'Place',at:[230,412]},
     see:'Utqiaġvik on Alaska’s Arctic coast switches to Fairbanks. Look at the summer months.',
     why:'Utqiaġvik’s summer barely thaws, so only mosses and dwarf shrubs grow: <b>tundra</b>. Fairbanks gets a few months near 17 °C, enough for conifers: <b>taiga</b>.',
     overlay(sim,ctx,LH,k){bmCard(ctx,k,cl(sim));}},
    {key:'tropics',title:'Hot and wet all year',pause:true,set:{place:'manaus'},focus:[40,30,760,400],
     see:'Manaus, Brazil. The red line is flat and the bars are tall.',
     why:'About 27 °C every month and 230 cm of rain a year, so plants grow all year: <b>tropical rainforest</b>, with the most species of any land biome.',
     overlay(sim,ctx,LH,k){bmCard(ctx,k,cl(sim));}},
    {key:'savanna',title:'A dry season makes a savanna',pause:true,set:{place:'serengeti'},focus:[400,30,400,420],
     see:'The Serengeti in Tanzania. Look at June through September.',
     why:'Warm all year, about 90 cm of rain, but almost none for four months. Trees can’t survive that drought everywhere, so grasses win: <b>savanna</b>.',
     overlay(sim,ctx,LH,k){bmCard(ctx,k,cl(sim));}},
    {key:'chaparral',lvl:'honors',title:'When the rain falls matters',pause:true,set:{place:'losangeles'},focus:[400,30,400,420],
     see:'Los Angeles. Compare the summer bars with the winter bars.',
     why:'About 37 cm a year like Denver, but almost all in winter. Hot, dry summers favor tough, fire-adapted shrubs: <b>chaparral</b>.',
     overlay(sim,ctx,LH,k){bmCard(ctx,k,cl(sim));}},
    {key:'shift',lvl:'ap',title:'Climate change shifts biomes',pause:true,set:{place:'denver',warm:3,pchg:-40},focus:[40,30,370,380],
     cause:{from:{warm:0,pchg:0},delay:2.5,dur:4,label:'Climate change',at:[230,412]},
     see:'Denver warms 3 °C and loses 40% of its precipitation. Watch the dot.',
     why:'It moves from about 10 °C and 38 cm to 13 °C and 23 cm, under the desert line. Biome boundaries shifting is a major climate change impact.',
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
     see:'Three bottles of the same pond water: one measured now, one clear, one wrapped in foil.',
     why:'Algae (green dots) make oxygen only in light, but use it for respiration all the time. The bottles measure each separately.',
     overlay(sim,ctx,LH,k){tag(ctx,'Measured at the start',78,366,k);tag(ctx,'Light: photosynthesis and respiration',330,140,k,{s:12.5});tag(ctx,'Dark: respiration only',580,140,k,{s:12.5});}},
    {key:'incubate',title:'24 hours under the lamp',speed:1,fresh:true,focus:[160,40,620,350],
     see:'The bottles sit under the lamp for 24 hours, about 2 hours a second. Watch the bubbles and numbers.',
     why:'In the clear bottle oxygen builds up; in the foil bottle it falls. The only difference is light.',
     overlay(sim,ctx,LH,k){pdCard(ctx,k,three(sim));}},
    {key:'calc',title:'Gross and net productivity',speed:3,fresh:true,focus:[160,40,620,350],
     see:'The same 24 hours, faster. Then look at the card’s three numbers.',
     why:'Dark drop = <b>respiration</b>. Light gain = <b>NPP</b>. GPP = light − dark; NPP = light − initial; NPP = GPP − R.',
     overlay(sim,ctx,LH,k){const done=sim.st.h>=23.9;pdCard(ctx,k,done?[['After 24 hours (mg O₂/L/day)',{w:800}],['Respiration = initial − dark = '+pdM(sim,'rr').toFixed(2),{w:700,c:CE_RED}],['NPP = light − initial = '+pdM(sim,'npp').toFixed(2),{w:700,c:CE_GREEN}],['GPP = light − dark = '+pdM(sim,'gpp').toFixed(2),{w:800}]]:three(sim));}},
    {key:'night',title:'When the light goes out',speed:1.5,fresh:true,focus:[160,40,620,350],
     run(sim){atReset(sim);},
     see:'The lamp switches off halfway through. Watch the clear bottle.',
     why:'With no light, photosynthesis stops and respiration goes on, so oxygen falls. A real pond does this every night.',
     overlay(sim,ctx,LH,k){if(sim.st.h>=12&&sim.p.light!==0&&!sim._pdOff){sim._pdOff=1;BioLab.setValues(sim,{light:0});}if(sim.st.h<1)sim._pdOff=0;pdCard(ctx,k,[['Lamp: '+(sim.p.light?'on':'off'),{w:800,c:sim.p.light?PAL['cv-ink']:CE_RED}]].concat(three(sim).slice(1)));}},
    {key:'hook',title:'Your question: fertilizer in the pond',set:{nut:'high'},speed:2,fresh:true,focus:[160,40,620,350],
     see:'Fertilizer washed in and the algae doubled. Watch the dark bottle over 24 hours.',
     why:'Twice the algae, twice the respiration: the dark bottle drops to about <b>5.59 mg/L</b>, not 6.79. Bigger swings day and night.',
     so:'That is why fish kills happen around sunrise.',
     overlay(sim,ctx,LH,k){pdCard(ctx,k,[['Nutrients: high (twice the algae)',{w:800}]].concat(three(sim).slice(1)));}},
    {key:'warm',lvl:'honors',title:'Warm water',set:{temp:30},speed:2,fresh:true,focus:[160,40,620,350],
     see:'The same bottles at 30 °C instead of 20 °C. Watch the dark bottle.',
     why:'Respiration enzymes roughly double their rate every 10 °C, and warm water holds less oxygen. Warm, still ponds are most at risk.',
     overlay(sim,ctx,LH,k){pdCard(ctx,k,[['Water bath: '+sim.p.temp+' °C',{w:800}]].concat(three(sim).slice(1)));}},
    {key:'sat',lvl:'ap',title:'Light saturation',set:{light:50},speed:3,fresh:true,focus:[160,40,620,350],
     see:'Half the light (50%). Compare the GPP with full light.',
     why:'GPP is about 3.75 mg O₂/L/day, about 80% of full light’s 4.62, not half. Photosynthesis levels off as enzymes become the limit.',
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
     see:'Four fleets share one lake of 8,000 fish. The red boat is yours. Each fish drawn is 100 real fish.',
     why:'Anyone can take the fish and no one owns them: a <b>commons</b>. Each season the fish reproduce, then the fleets fish.',
     overlay(sim,ctx,LH,k){tag(ctx,'Your fleet',290,70,k,{hi:true});tag(ctx,'The other three fleets',560,70,k);}},
    {key:'careful',title:'Fishing carefully',speed:6,fresh:true,focus:[0,0,800,450],
     run(sim){sim.st._mine=null;},
     see:'Every fleet fishes carefully, 300 fish a season. Watch 40 seasons and the fish count.',
     why:'Below the lake’s limit, fewer fish reproduce faster. The lake settles near 5,800, where new fish match the catch, forever.',
     overlay(sim,ctx,LH,k){const m=cmRun(sim,40);cmCard(ctx,k,[['Season '+sim.st.season,{w:800}],['Fish in the lake: '+n0(cmM(sim,'fish')),{w:700,c:CE_BLUE}],['Your total catch: '+n0(m),{w:700,c:CE_GREEN}]]);}},
    {key:'hook',title:'Your question: 1,000 fish a season',set:{catch:1000},speed:6,fresh:true,focus:[0,0,800,450],
     run(sim){sim.st._mine=null;},
     see:'Same lake, but your fleet now takes 1,000 fish a season. Watch 40 seasons.',
     why:'You catch more at first, then the lake collapses around season 15. Your total ends near <b>11,400</b>, less than the careful <b>12,000</b>.',
     so:'Taking more now cost everyone later.',
     overlay(sim,ctx,LH,k){const m=cmRun(sim,40);cmCard(ctx,k,[['Season '+sim.st.season,{w:800}],['Fish in the lake: '+n0(cmM(sim,'fish')),{w:700,c:CE_BLUE}],['Your total catch: '+n0(m),{w:700,c:CE_RED}]]);}},
    {key:'tragedy',title:'The tragedy of the commons',set:{catch:1200,others:'greedy'},speed:3,fresh:true,focus:[0,0,800,450],
     run(sim){sim.st._mine=null;},
     see:'Now every fleet thinks “if I don’t take them, someone else will.” Watch the lake.',
     why:'Each fleet keeps its own profit but shares the damage, so all take more and empty the lake in about 5 seasons: the <b>tragedy of the commons</b>.',
     overlay(sim,ctx,LH,k){cmRun(sim,15);cmCard(ctx,k,[['Season '+sim.st.season,{w:800}],['Fish in the lake: '+n0(cmM(sim,'fish')),{w:700,c:CE_RED}],['Lake: '+cmM(sim,'status'),{w:700}]]);}},
    {key:'quota',lvl:'honors',title:'A shared limit',set:{catch:1200,others:'greedy',quota:true,quotaAmt:800},speed:3,fresh:true,focus:[0,0,800,450],
     run(sim){sim.st._mine=null;},
     see:'The same greedy fleets agree on a total quota of 800 fish a season, 200 each.',
     why:'The quota keeps the catch below what the lake replaces. The lake stays near 7,900, and everyone keeps fishing.',
     overlay(sim,ctx,LH,k){cmRun(sim,30);cmCard(ctx,k,[['Season '+sim.st.season+' · quota 800',{w:800}],['Fish in the lake: '+n0(cmM(sim,'fish')),{w:700,c:CE_GREEN}],['Lake: '+cmM(sim,'status'),{w:700}]]);}},
    {key:'msy',lvl:'ap',title:'Maximum sustainable yield',set:{catch:300},speed:6,fresh:true,focus:[0,0,800,450],
     run(sim){sim.st._mine=null;},
     see:'Careful fishing again. Watch each season’s surplus growth, and the most the lake could give.',
     why:'Surplus is highest at a middle population: the <b>maximum sustainable yield</b>. Managers aim below it because counts are uncertain.',
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
     see:'A green ash seedling grows year by year. Blue CO₂ bubbles show carbon dioxide taken from the air.',
     why:'Photosynthesis builds carbon from the air into wood. About half a tree’s dry weight is carbon, and almost none came from the soil.',
     overlay(sim,ctx,LH,k){tcCard(ctx,k,rows(sim));}},
    {key:'measure',title:'Two measurements tell you its carbon',pause:true,set:{species:'ash',age:45},focus:[0,40,560,400],
     see:'The same tree at 45 years. The gold band marks the trunk 1.4 m up; the ruler measures height.',
     why:'Wood weight goes up with diameter² × height, like a cylinder. Half is water; half of the rest is carbon.',
     so:{ honors: 'Carbon ≈ 0.0346 × d² × h × 0.25 for trunks 28 cm or wider.' },
     overlay(sim,ctx,LH,k){tcCard(ctx,k,[['Diameter: '+tcM(sim,'d').toFixed(0)+' cm · Height: '+tcM(sim,'h').toFixed(1)+' m',{w:700}],['Carbon stored: '+n0(tcM(sim,'C'))+' kg',{w:800,c:CE_GREEN}]]);}},
    {key:'curves',title:'Storage keeps rising; intake peaks',set:{species:'ash',age:10},speed:3,focus:[0,40,800,400],
     see:'The ash grows from 10 to about 120 years. Compare “Carbon stored” with “Added this year.”',
     why:'<b>Storage</b> keeps climbing for life. <b>Sequestration</b>, carbon added per year, peaks around age 40 to 50, then falls.',
     overlay(sim,ctx,LH,k){tcCard(ctx,k,rows(sim));}},
    {key:'species',title:'Species matters',set:{species:'cottonwood',age:45},pause:true,focus:[0,40,800,400],
     cause:{from:{species:'ash'},delay:2.5,label:'Species',at:[280,425]},
     see:'The 45-year-old ash switches to a plains cottonwood of the same age.',
     why:'The cottonwood is 84 cm across and stores about 1,370 kg of carbon, over three times the ash’s 381 kg. Carbon goes up with diameter squared.',
     overlay(sim,ctx,LH,k){tcCard(ctx,k,[[sim.p.species==='cottonwood'?'Plains cottonwood, 45 years':'Green ash, 45 years',{w:800}],['Carbon stored: '+n0(tcM(sim,'C'))+' kg',{w:800,c:CE_GREEN}],['Added this year: '+tcM(sim,'seq').toFixed(1)+' kg',{w:700}]]);}},
    {key:'hook',title:'Your question: offsetting one person',set:{species:'ash',age:45},pause:true,focus:[0,40,800,400],
     see:'The 45-year-old green ash on campus.',
     why:'It stores about <b>381 kg</b> of carbon and adds <b>12.5 kg a year</b>. Offsetting one American (4,363 kg a year) takes about <b>350 trees</b>.',
     so:'Planting helps, but cutting emissions matters at least as much.',
     overlay(sim,ctx,LH,k){const s=tcM(sim,'seq');tcCard(ctx,k,[['Stores '+n0(tcM(sim,'C'))+' kg C · adds '+s.toFixed(1)+' kg/yr',{w:700}],['Trees to offset one person: about '+n0(4363/s),{w:800,c:CE_RED}]]);}},
    {key:'stand',lvl:'honors',title:'From one tree to a forest',set:{species:'ash',age:45,view:'stand'},pause:true,focus:[0,40,800,400],
     see:'A hectare of forest (100 m × 100 m): 400 ash trees, 45 years old.',
     why:'400 × 381 kg ≈ 152 tonnes of carbon stored, about 5 tonnes added a year. Roots and soil hold more that this leaves out.',
     overlay(sim,ctx,LH,k){tcCard(ctx,k,[['Stored: '+tcM(sim,'standC').toFixed(0)+' t C/ha',{w:800,c:CE_GREEN}],['Added: '+tcM(sim,'standSeq').toFixed(1)+' t C/ha/yr',{w:700}]]);}},
    {key:'fire',lvl:'ap',title:'Fire or harvest',set:{species:'ash',age:80},speed:1,focus:[0,40,800,400],
     run(sim){atReset(sim);},
     see:'An 80-year-old stand burns. Follow where its carbon goes.',
     why:'Fire returns much of the carbon to the air within years. Lumber keeps some for decades. Regrowing what was lost takes decades.',
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
     see:'A cross-section of an open-pit copper mine about 1.8 km across. Trucks carry rock up the benches.',
     why:'Copper is spread through the green ore as tiny grains. The mine removes the <b>overburden</b> on top, mills the ore, and leaves <b>tailings</b>.',
     overlay(sim,ctx,LH,k){tag(ctx,'Overburden becomes waste rock',140,200,k);tag(ctx,'Ore: about 0.6% copper',420,300,k,{hi:true});tag(ctx,'Leftover ground rock',700,190,k);}},
    {key:'hook',title:'Your question: then and now',set:{grade:0.6},pause:true,focus:[0,40,800,400],
     cause:{from:{grade:5},delay:2.5,dur:3.5,label:'Ore grade',at:[300,425]},
     see:'The same mine with 1900’s 5% copper ore. Watch the grade fall to today’s 0.6%, and watch the numbers.',
     why:'At 5%, the mine moves about <b>84 tonnes</b> of rock per tonne of copper. At 0.6%, about <b>700 tonnes</b>, more than 8 times as much.',
     overlay(sim,ctx,LH,k){mnCard(ctx,k,[['Ore grade: '+sim.p.grade.toFixed(1)+'% copper',{w:800}],['Ore per tonne of copper: '+n0(mnM(sim,'orePer'))+' t',{w:700}],['All rock moved: '+n0(mnM(sim,'rockPer'))+' t',{w:800,c:CE_RED}]]);}},
    {key:'deep',title:'Deeper ore costs more',set:{depth:500},pause:true,focus:[0,40,800,400],
     cause:{from:{depth:150},delay:2.5,dur:3,label:'Depth to the ore',at:[300,425]},
     see:'The ore body sinks from 150 m to 500 m below the surface.',
     why:'Sloping walls make a deeper pit much wider. Rock per tonne of copper quadruples, and profit of about $870 million becomes a loss of about $1.3 billion.',
     overlay(sim,ctx,LH,k){mnCard(ctx,k,[['Depth: '+sim.p.depth+' m',{w:800}],['All rock moved: '+n0(mnM(sim,'rockPer'))+' t per t of copper',{w:700}],['Profit: '+money(mnM(sim,'profit')),{w:800,c:mnM(sim,'profit')<0?CE_RED:CE_GREEN}]]);}},
    {key:'under',title:'Going underground',set:{depth:500,method:'under'},pause:true,focus:[0,40,800,400],
     cause:{from:{method:'surface'},delay:2.5,label:'Mining method',at:[300,425]},
     see:'The deep ore again. The mine switches from an open pit to underground tunnels.',
     why:'Underground moves far less rock and land, but tunneling costs more per tonne. For deep ore it loses much less; for shallow ore the pit is cheaper.',
     overlay(sim,ctx,LH,k){mnCard(ctx,k,[['Method: '+(sim.p.method==='under'?'underground':'open pit'),{w:800}],['All rock moved: '+n0(mnM(sim,'rockPer'))+' t per t of copper',{w:700}],['Profit: '+money(mnM(sim,'profit')),{w:800,c:mnM(sim,'profit')<0?CE_RED:CE_GREEN}]]);}},
    {key:'acid',title:'Acid drainage and reclamation',set:{recl:'full'},pause:true,focus:[0,40,800,400],
     cause:{from:{recl:'none'},delay:3,label:'Reclamation',at:[300,425]},
     see:'The waste rock is bare. Then the company regrades, covers, replants and treats the water.',
     why:'Pyrite in waste rock makes sulfuric acid that dissolves metals into streams: <b>acid mine drainage</b>. Reclamation cuts the risk from severe to low.',
     overlay(sim,ctx,LH,k){mnCard(ctx,k,[['Reclamation: '+{none:'none',basic:'regrade and replant',full:'full, with water treatment'}[sim.p.recl],{w:800}],['Acid drainage risk: '+mnM(sim,'risk'),{w:800,c:CE_RED}],['Profit: '+money(mnM(sim,'profit')),{w:700}]]);}},
    {key:'price',lvl:'honors',title:'When the price drops',set:{price:6000},pause:true,focus:[0,40,800,400],
     cause:{from:{price:9000},delay:2.5,dur:3,label:'Copper price',at:[300,425]},
     see:'The copper price falls from $9,000 to $6,000 a tonne.',
     why:'Moving rock costs the same, but copper sells for less. Profit drops from about $870 million to $270 million, and low-grade mines close.'},
    {key:'pyrite',lvl:'ap',title:'Pyrite and pH',set:{recl:'none',pyrite:5},speed:2,focus:[0,40,800,400],fresh:true,
     cause:{from:{pyrite:0},delay:2,dur:3,label:'Pyrite in waste rock',at:[300,425]},
     see:'Pyrite in the uncovered waste rock rises. Watch the stream below the mine.',
     why:'2FeS₂ + 7O₂ + 2H₂O → 2Fe²⁺ + 4SO₄²⁻ + 4H⁺. The H⁺ lowers pH, acid dissolves more metal, and iron coats the stream orange for centuries.',
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
     see:'A typical student’s year. Each source puffs out CO₂ bubbles; the stack on the right adds them up.',
     why:'Burning fuel, food, purchases and shared services add up to about 12.5 tons a year: below the US average of 15, over 2½ times the world’s.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,[tot(sim)]);}},
    {key:'drive',title:'Driving is the biggest slice you control',pause:true,set:{miles:60},focus:[0,330,520,120],
     cause:{from:{miles:120},delay:2.5,dur:3,label:'Car miles per week',at:[260,418]},
     see:'Weekly driving falls from 120 miles to 60. Watch the red “getting around” slice.',
     why:'Each gallon of gas makes about 8.9 kg of CO₂. 120 miles a week at 25 mpg is about 2.2 tons a year; halving miles saves about 1.1.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,[['Driving: '+sim.p.miles+' mi/week',{w:800}],['Getting around: '+fpM(sim,'transport').toFixed(1)+' t',{w:700}],tot(sim)]);}},
    {key:'hook',title:'Your question: which change cuts most?',pause:true,set:{mpg:50},focus:[0,40,800,410],
     cause:{from:{mpg:25},delay:2.5,dur:3,label:'Car fuel economy',at:[260,418]},
     see:'The car goes from 25 to 50 miles per gallon.',
     why:'That saves about <b>1.1 tons</b> a year. Going vegetarian saves about <b>0.8</b>; skipping one 2,000-mile flight about <b>0.4</b>.',
     so:'Find your biggest slice before you cut. For most Colorado teens, it is driving.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,[['Car: '+sim.p.mpg+' mpg',{w:800}],tot(sim)]);}},
    {key:'grid',title:'Where your electricity comes from',pause:true,set:{grid:'renew'},focus:[350,100,450,260],
     cause:{from:{grid:'colorado'},delay:2.5,label:'Electricity source',at:[260,418]},
     see:'The power plant switches from Colorado’s current mix to 100% renewable.',
     why:'Coal and gas make about half a kilogram of CO₂ per kWh; wind and solar almost none. Your home electricity share drops from about 1 ton to almost zero.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,[['Home energy: '+fpM(sim,'home').toFixed(1)+' t',{w:800}],tot(sim)]);}},
    {key:'food',title:'Food',pause:true,set:{diet:'veg'},focus:[0,180,200,170],
     cause:{from:{diet:'avg'},delay:2.5,label:'Diet',at:[260,418]},
     see:'The diet changes from average to vegetarian.',
     why:'Cattle burp methane and need lots of feed and land, so beef has a big footprint. Vegetarian saves about 0.8 tons; less beef helps too.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,[['Food: '+fpM(sim,'food').toFixed(1)+' t',{w:800}],tot(sim)]);}},
    {key:'together',title:'Doing everything',pause:true,focus:[520,40,280,410],
     run(sim){atReset(sim);sim.def.actions.find(a=>a.id==='default').run(sim);},
     see:'Every big change at once: electric car on renewables, vegetarian, no flight, buying less.',
     why:'The footprint drops to about 7 tons, but not to the 2-ton goal: about 2.5 tons come from shared services. That takes changes for everyone.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,2.5,'all',s=>BioLab.setValues(s,{car:'ev',grid:'renew',diet:'veg',flights:0,stuff:'low'}));fpCard(ctx,k,[tot(sim),['US average 15 · world 4.7 · goal 2',{s:12}]]);}},
    {key:'hp',lvl:'honors',title:'Only as clean as the grid',pause:true,set:{heat:'hp'},focus:[150,100,500,260],
     cause:{from:{heat:'gas'},delay:2.5,label:'Home heating',at:[260,418]},
     see:'The gas furnace swaps for an electric heat pump, on today’s grid.',
     why:'A heat pump uses about a third of the energy, but on a coal-and-gas grid the savings here are tiny. On a renewable grid, nearly zero. Same for electric cars.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,[['Home energy: '+fpM(sim,'home').toFixed(2)+' t',{w:800}],tot(sim)]);}},
    {key:'math',lvl:'ap',title:'Show the arithmetic',pause:true,focus:[0,330,520,120],run(sim){sim.def.actions.find(a=>a.id==='default').run(sim);},
     see:'The typical student’s car and electricity, worked out.',
     why:'6,240 mi ÷ 25 mpg = 250 gal × 8.89 kg = 2,219 kg. 2,100 kWh × 0.50 kg = 1,050 kg. Units cancel at every step.',
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
     see:'A slab of agarose gel in salty buffer. Samples sit in the wells at the top. Black lead at the top, red at the bottom.',
     why:'Agarose forms a mesh of tiny pores, like a sponge. The blue dye shows where you loaded.',
     overlay(sim,ctx,LH,k){tag(ctx,'Wells: samples go in here',270,60,k,{hi:true});tag(ctx,'Agarose gel: a mesh of tiny pores',270,280,k);tag(ctx,'Red (+) end',150,400,k);}},
    {key:'power',title:'DNA runs to red',set:{power:true},speed:1,fresh:true,focus:[10,30,440,420],
     cause:{from:{power:false},delay:2,label:'Power supply',at:[230,436]},
     see:'The power switches on, and the samples leave the wells.',
     why:'DNA’s phosphate backbone is negative, so it is pulled toward the red (positive) lead. Lab rule: “Black at the wells, run to red.”',
     overlay(sim,ctx,LH,k){glCard(ctx,k,run(sim));}},
    {key:'size',title:'Small pieces win the race',speed:3,fresh:true,focus:[60,60,400,370],
     see:'The ladder (lane L), pieces of known sizes, spreads out as the gel runs.',
     why:'Short pieces slip through the mesh faster, like a small kid weaving through a crowded hallway. So position tells you size.',
     overlay(sim,ctx,LH,k){stopAt(sim,30);glCard(ctx,k,run(sim));}},
    {key:'match',title:'Reading a DNA match',speed:4,fresh:true,focus:[60,60,400,370],
     see:'Lane E is crime-scene DNA. S1, S2 and S3 are suspects. Compare the band patterns.',
     why:'Suspect 2’s four bands line up exactly with the evidence. Suspects 1 and 3 have bands that don’t match, so they are ruled out.',
     overlay(sim,ctx,LH,k){stopAt(sim,40);glCard(ctx,k,sim.st.runMin>=39?[['Evidence matches Suspect 2',{w:800,c:CE_RED}],'Suspects 1 and 3 are ruled out']:run(sim));}},
    {key:'reverse',title:'Leads plugged in backward',set:{leads:'reversed'},speed:2,fresh:true,focus:[10,30,440,420],
     cause:{from:{leads:'correct'},delay:1.5,label:'Leads',at:[230,436]},
     see:'The red lead is plugged in at the wells. The DNA moves up, out of the gel.',
     why:'The negative DNA now runs toward the top and is lost in the buffer. That is why labs check the leads before pressing start.',
     overlay(sim,ctx,LH,k){stopAt(sim,10);glCard(ctx,k,[['Leads: '+(sim.p.leads==='correct'?'black at wells':'red at wells'),{w:800,c:CE_RED}],['Smallest band: '+glM(sim,'smallest'),{w:700}]]);}},
    {key:'hook',title:'Your question: the 50-minute run',speed:4,fresh:true,focus:[10,30,780,420],
     see:'100 V for 50 minutes. Watch the bottom ladder band (250 bp) and the blue dye.',
     why:'The 250 bp band runs off the 7 cm gel at about <b>47 minutes</b>. Stop at about <b>38</b>, with the dye 80% down.',
     so:'Watch the dye, not the clock.',
     overlay(sim,ctx,LH,k){stopAt(sim,50);glCard(ctx,k,run(sim));}},
    {key:'paternity',lvl:'honors',title:'A paternity test',set:{case:'paternity'},speed:4,fresh:true,focus:[60,60,400,370],
     see:'Mother (M), child (C) and two men (F1, F2). Account for each of the child’s bands.',
     why:'The child’s 8,200 and 2,600 bp bands match the mother. The 3,900 and 1,500 must come from the father. F2 has both; F1 is ruled out.',
     overlay(sim,ctx,LH,k){stopAt(sim,40);glCard(ctx,k,sim.st.runMin>=39?[['F2 has both of the child’s non-maternal bands',{w:800,c:CE_RED}],'F1 is missing the 3,900 bp band']:run(sim));}},
    {key:'curve',lvl:'ap',title:'Sizing unknowns',set:{case:'lambda'},speed:4,fresh:true,focus:[10,30,780,420],
     see:'λ DNA cut with HindIII (known sizes) runs next to two unknowns. See the standard curve graph below.',
     why:'Distance is linear in log(size). Fit a line to the ladder, then read each unknown’s size from its distance.',
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
     see:'The thermocycler and the DNA go through one full cycle: hot, then cool, then warm.',
     why:'<b>95 °C:</b> strands separate. <b>About 52 °C:</b> <b>primers</b> stick at each end of the target. <b>72 °C:</b> Taq polymerase builds the new strands.',
     overlay(sim,ctx,LH,k){pcCard(ctx,k,[[String(pcM(sim,'step')),{w:800}],['Block temperature: '+Math.round(pcM(sim,'temp'))+' °C',{w:700,c:CE_RED}]]);}},
    {key:'double',title:'Doubling every cycle',set:{start:'1000',cycles:30},speed:10,fresh:true,focus:[10,280,690,170],
     see:'1,000 copies of the target, through 30 quick cycles.',
     why:'Every copy becomes a template next cycle, so copies double: 10 cycles ≈ ×1,000; 30 cycles ≈ ×1 billion. Almost a trillion copies here.',
     overlay(sim,ctx,LH,k){pcCard(ctx,k,now(sim));}},
    { key: 'dgraph', title: 'Doubling on a graph', speed: 0.5,
      see: 'Copies vs cycle for 1,000 starting copies. Left: a normal axis, flat, then a J. Right: the same numbers on a log axis, a straight line.',
      why: 'Each cycle doubles the copies, so the last few cycles make almost all of them. On a log axis, steady doubling is a straight line.',
      overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,p=tau%12,A={x0:120,x1:380,y0:80,y1:340},B={x0:480,x1:760,y0:80,y1:340},xr=[0,30];K.dim(ctx,LH);
        /* copies = 1,000 × 2^cycle (perfect doubling, as in sims/pcr.js before the plateau) */
        const c=n=>1000*Math.pow(2,n),top=c(30);
        K.axes(ctx,A,k,{xr,xt:[[0,'0'],[10,'10'],[20,'20'],[30,'30']],yt:[[0,'0'],[0.5e12/top,'½ trillion'],[1e12/top,'1 trillion']],xl:'Cycle',yl:'Copies',ylOff:84});
        K.tag(ctx,'Normal axis',(A.x0+A.x1)/2,40,k);K.curve(ctx,A,xr,n=>c(n)/top,p<4?30*p/4:30,'#c8102e');
        if(p>=4){K.axes(ctx,B,k,{xr,xt:[[0,'0'],[10,'10'],[20,'20'],[30,'30']],yt:[[0,'10³'],[1/3,'10⁶'],[2/3,'10⁹'],[1,'10¹²']],xl:'Cycle',yl:'Copies (log)',ylOff:40});
          K.tag(ctx,'Log axis',(B.x0+B.x1)/2,40,k);K.curve(ctx,B,xr,n=>(Math.log10(c(n))-3)/9,p<8?30*(p-4)/4:30,'#1b7a3a');}
        if(p>=8.5){K.tagA(ctx,'Cycles 0–20: barely visible',A.x0+8,A.y1-40,k,{s:12},'l');K.tagA(ctx,'×10 every 3.3 cycles',B.x1,B.y1-40,k,{s:12,hi:true},'r');}} },
    {key:'hook',title:'Your question: a few virus copies',set:{start:'10',cycles:27},speed:10,fresh:true,focus:[10,60,780,390],
     see:'A swab with about 10 copies of a virus gene. A visible band needs about a billion.',
     why:'About <b>27 cycles</b> turn 10 copies into about <b>1.3 billion</b>. Starting with 1,000 needs only about 20.',
     so:'Fewer cycles to a signal (a lower Ct) means more virus.',
     overlay(sim,ctx,LH,k){pcCard(ctx,k,now(sim));}},
    {key:'contam',title:'One stray molecule',set:{start:'10',cycles:27},speed:10,fresh:true,focus:[10,280,690,170],
     see:'The same 27 cycles from just 10 stray molecules, the amount a reused pipette tip could add.',
     why:'PCR copies stray DNA too, and it looks like a real result. That is why labs change tips and run a blank “no-template” control.',
     overlay(sim,ctx,LH,k){pcCard(ctx,k,[['Started with 10 stray molecules',{w:800}],['Copies now: '+pcM(sim,'total'),{w:800,c:CE_RED}]]);}},
    {key:'anneal',lvl:'honors',title:'Annealing temperature',set:{anneal:66},speed:6,fresh:true,focus:[350,60,450,390],
     cause:{from:{anneal:52},delay:0.4,label:'Annealing temperature',at:[400,440]},
     see:'The annealing step changes from 52 °C to 66 °C, above the primers’ melting temperature (about 57 °C). No product forms.',
     why:'Primers only stick below their Tm. Too hot: no product. Too cold: wrong-size bands. Aim a few degrees below Tm.',
     overlay(sim,ctx,LH,k){pcCard(ctx,k,[['Annealing: '+sim.p.anneal+' °C',{w:800}],['Gel: '+pcM(sim,'bands'),{w:700,c:CE_RED}]]);}},
    {key:'plateau',lvl:'ap',title:'The plateau',set:{cycles:40},speed:8,fresh:true,focus:[10,280,690,170],
     see:'40 cycles, with the log-scale growth curve in the graph below.',
     why:'Perfect doubling is a straight line on a log scale. Late on, supplies run low and the curve flattens: the <b>plateau</b>. qPCR reads the threshold cycle in the straight part.',
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
     see:'A P20 micropipette. Its dial reads 0-7-5.',
     why:'A P20 measures 2 to 20 µL; a raindrop is about 50 µL. The red digit is tenths, so 0-7-5 means <b>7.5 µL</b>.',
     overlay(sim,ctx,LH,k){piCard(ctx,k,[['Display 0-7-5 on a P20 = '+piM(sim,'set')+' µL',{w:800}],['Range: '+piM(sim,'range'),{w:700}]]);}},
    {key:'pick',title:'Same digits, different pipette',set:{mode:'pip',pip:'P200',dial:75,task:'7.5'},pause:true,focus:[120,40,140,270],
     cause:{from:{pip:'P20'},delay:2.5,label:'Micropipette',at:[300,420]},
     see:'The P20 swaps for a P200 with the same 0-7-5 on the dial.',
     why:'On a P200 that means <b>75 µL</b>. Use the smallest pipette whose range covers your volume.',
     overlay(sim,ctx,LH,k){piCard(ctx,k,[[sim.p.pip+' with 0-7-5 = '+piM(sim,'set')+' µL',{w:800,c:sim.p.pip==='P200'?CE_RED:PAL['cv-ink']}],[String(piM(sim,'choice')),{s:12}]]);}},
    {key:'right',title:'The right way',speed:1,focus:[120,40,500,400],run(sim){prep(sim);},
     see:'Press to the first stop, dip in, release slowly, move to your tube, press to the first stop, then the second.',
     why:'The <b>first stop</b> sets the volume drawn up. The <b>second stop</b> blows out the last drop: exactly 7.5 µL.',
     overlay(sim,ctx,LH,k,tau){moves(sim,tau,['first','sample','slow','tube','first','second'],1.2);piCard(ctx,k,out(sim));}},
    {key:'hook',title:'Your question: pressing to the second stop first',speed:1,focus:[120,40,500,400],run(sim){prep(sim);},
     see:'Same 7.5 µL, but the plunger goes to the <b>second</b> stop before the tip goes in.',
     why:'That draws up about <b>9.5 µL</b>, 27% too much. Snapping back instead draws about 7.0 µL plus bubbles. Only the first stop measures.',
     overlay(sim,ctx,LH,k,tau){moves(sim,tau,['second','sample','slow','tube','first','second'],1.2);piCard(ctx,k,out(sim));}},
    {key:'fast',title:'Letting go too fast',speed:1,focus:[120,40,500,400],run(sim){prep(sim);},
     see:'Correct first stop, but the plunger is let go all at once.',
     why:'Liquid rushes up, air bubbles form, and only about 7.0 µL fits. Some can splash into the pipette.',
     overlay(sim,ctx,LH,k,tau){moves(sim,tau,['first','sample','fast','tube','first','second'],1.2);piCard(ctx,k,out(sim));}},
    {key:'dilute',lvl:'honors',title:'Planning a dilution',set:{mode:'dil',c1:10,c2:1,v2:50},pause:true,focus:[0,40,800,400],
     see:'You have a 10× stock and need 50 mL of 1× solution.',
     why:'C₁V₁ = C₂V₂, so V₁ = 1 × 50 ÷ 10 = <b>5 mL</b> stock plus 45 mL water.',
     overlay(sim,ctx,LH,k){piCard(ctx,k,[['Stock: '+piM(sim,'v1').toFixed(1)+' mL + water: '+piM(sim,'water').toFixed(1)+' mL',{w:800}],['Dilution: '+piM(sim,'factor'),{w:700}]]);}},
    {key:'serial',lvl:'ap',title:'Serial dilution and counting',set:{mode:'ser',n0:9,plated:6},speed:1,focus:[0,40,800,400],
     run(sim){atReset(sim);},
     see:'A 10-fold series of 6 tubes. 100 µL from tube 6 is plated and incubated.',
     why:'Tube 6 is a 10⁻⁶ dilution. Count plates with 30 to 300 colonies. Original cells = colonies ÷ (dilution × volume plated).',
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
     see:'The pGLO plasmid: a small circle of DNA, separate from the bacteria’s chromosome.',
     why:'It carries <b>bla</b>, which lets a cell survive ampicillin, and <b>GFP</b>, a glowing jellyfish protein. A cell that takes in pGLO gets both.'},
    {key:'proc',title:'Getting the plasmid in',speed:1,focus:[0,0,800,450],run(sim){atReset(sim);tfA(sim,'restart');},
     see:'Watch the procedure run, step by step.',
     why:'Cold calcium chloride lets the plasmid get close. A <b>heat shock</b> (50 s at 42 °C, back to ice) opens the membrane briefly. Warm broth lets cells recover.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1,'go',s=>tfA(s,'runall'));tfCard(ctx,k,[[String(tfM(sim,'stepn')),{w:700,s:12}]]);}},
    {key:'plates',title:'Four plates',pause:true,focus:[0,0,800,450],run(sim){tfDone(sim);},
     see:'After 48 hours: two plates of cells with no plasmid (−pGLO) and two with it (+pGLO).',
     why:'Without ampicillin, −pGLO cells grow a solid <b>lawn</b>. With it, they all die. Only cells that took in the plasmid grow colonies on ampicillin.',
     overlay(sim,ctx,LH,k){tfCard(ctx,k,[['LB −pGLO: '+tfM(sim,'lawn'),{w:700}]].concat(plates(sim).slice(0,2)));}},
    {key:'hook',title:'Your question: finding the few that changed',pause:true,focus:[0,0,800,450],run(sim){tfDone(sim);},
     see:'The LB/amp +pGLO plate: about 100 million cells were spread on it.',
     why:'About <b>100 to 125 colonies</b> grow: roughly <b>1 cell in a million</b> took the plasmid. Ampicillin kills the rest: <b>selection</b>.',
     so:'Hospitals select resistant bacteria the same way.',
     overlay(sim,ctx,LH,k){tfCard(ctx,k,[['LB/amp +pGLO: '+tfM(sim,'c3')+' colonies',{w:800,c:CE_RED}],'From about 100 million cells spread']);}},
    {key:'glow',title:'The green switch',set:{uv:true},pause:true,focus:[0,0,800,450],
     cause:{from:{uv:false},delay:2,label:'UV light',at:[400,420]},
     run(sim){tfDone(sim);},
     see:'The UV light switches on over the plates.',
     why:'Only colonies given <b>arabinose</b> glow. GFP sits behind a switch that arabinose turns on. Same genes, different environment, different result.',
     overlay(sim,ctx,LH,k){tfCard(ctx,k,plates(sim));}},
    {key:'noplasmid',lvl:'honors',title:'The control that proves it',set:{plasmid:false},pause:true,focus:[0,0,800,450],
     run(sim){tfDone(sim);},
     see:'The lab runs again, but no plasmid goes into the +pGLO tube.',
     why:'Nothing grows on any ampicillin plate. This control proves the colonies came from the plasmid.',
     overlay(sim,ctx,LH,k){tfCard(ctx,k,plates(sim).slice(0,2));}},
    {key:'eff',lvl:'ap',title:'Transformation efficiency',pause:true,focus:[0,0,800,450],run(sim){BioLab.setValues(sim,{plasmid:true});tfDone(sim);},
     see:'The LB/amp +pGLO colony count and the DNA spread on that plate.',
     why:'Efficiency = transformants ÷ µg of DNA spread. Plating twice as much doubles both, so efficiency stays the same.',
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
     see:'The map of pBR322, a common lab plasmid: a ring of 4,361 base pairs.',
     why:'Positions run clockwise from the top. Arcs are genes: <b>ampR</b> and <b>tetR</b> give antibiotic resistance; <b>ori</b> starts copying. Labels outside are enzyme cut sites.'},
    {key:'cut',title:'An enzyme that reads DNA',speed:1,set:{mol:'pBR322',e1:'EcoRI',e2:'none'},focus:[0,40,800,380],
     run(sim){plA(sim,'digest');},
     see:'EcoRI cuts the ring. Look at the cut site in the middle panel.',
     why:'EcoRI cuts only at GAATTC. pBR322 has one, so the ring opens into one 4,361 bp piece. The staggered cut leaves <b>sticky ends</b>.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,frag(sim));}},
    {key:'two',title:'Two cuts, two pieces',speed:1,set:{mol:'pBR322',e1:'HindIII',e2:'BamHI'},focus:[0,40,800,410],
     cause:{from:{e2:'none'},delay:2.5,label:'Enzyme 2',at:[300,425]},
     see:'HindIII cuts once. BamHI joins it. Watch the fragments and the gel.',
     why:'In a ring, n cuts give n pieces. Cuts at 29 and 375 make 346 bp and 4,015 bp, which add back to 4,361.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,frag(sim));}},
    {key:'hook',title:'Your question: checking an old tube',speed:1,set:{mol:'pBR322',e1:'HindIII',e2:'BamHI'},focus:[0,40,800,410],
     run(sim){plA(sim,'digest');},
     see:'An old freezer tube labeled pBR322. You get one digest to check it.',
     why:'EcoRI alone gives one 4,361 bp band, which many plasmids would. <b>HindIII plus BamHI</b> gives <b>346 and 4,015 bp</b>: a much stronger fingerprint.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,frag(sim));}},
    {key:'linear',lvl:'honors',title:'Straight DNA',speed:1,set:{mol:'lambda',e1:'HindIII',e2:'none'},focus:[0,40,800,410],
     see:'λ phage DNA, a straight molecule of 48,502 bp, cut with HindIII.',
     why:'Straight DNA has two ends, so n cuts give n + 1 pieces. HindIII cuts λ 7 times: the 8-band λ/HindIII ladder used to size DNA.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,frag(sim));}},
    {key:'clone',lvl:'honors',title:'Pasting in a gene',speed:1,set:{mol:'pBR322',e1:'BamHI',e2:'none',insEnz:'BamHI'},focus:[0,40,800,410],
     run(sim){atReset(sim);plA(sim,'clear');},
     see:'pBR322 and a GFP gene, both cut with BamHI. Watch the insert join the plasmid.',
     why:'Matching sticky ends pair, and DNA ligase seals them: a <b>recombinant plasmid</b>. Ends cut by different enzymes usually won’t match.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,2,'lig',s=>plA(s,'clone'));plCard(ctx,k,[['Recombinant: '+plM(sim,'recomb'),{w:800,c:CE_GREEN}]]);}},
    {key:'inact',lvl:'ap',title:'Insertional inactivation',speed:1,set:{mol:'pBR322',e1:'BamHI',e2:'none',insEnz:'BamHI'},focus:[0,40,800,410],
     run(sim){plA(sim,'clone');},
     see:'The GFP insert sits at BamHI, inside the tetR gene.',
     why:'The insert breaks tetR, so recombinant cells resist ampicillin but die on tetracycline. Copy colonies onto both plates to find them.',
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
     see:'The top row: 100 DNA bases from a burger sold as beef, one color per base. Below: the same stretch from 12 species.',
     why:'This gene differs a little in every species, like a <b>barcode</b>. Match it to identify the animal.'},
    {key:'run',title:'How BLAST searches',set:{query:'burger'},speed:1,focus:[0,40,800,460],
     run(sim){atReset(sim);},
     see:'BLAST runs: short exact matches light up, grow into full alignments, then the species are ranked.',
     why:'Checking every base against billions would take forever, so BLAST first finds short shared “words” (11 bases), then extends only those.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1,'go',s=>blA(s,'run'));blCard(ctx,k,res(sim));}},
    {key:'hook',title:'Your question: what’s in the burger?',set:{query:'burger'},speed:1,focus:[0,40,800,460],
     run(sim){blA(sim,'done');},
     see:'The hit list for the “100% beef” patty.',
     why:'Top hit: <b>horse, 99% identical</b>. Pig and others at 87 to 88% are only relatives. About 98% or more means the same species.',
     so:'In 2013, tests like this found horse in “beef” across Europe.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,res(sim));}},
    {key:'cheek',title:'Your own DNA',set:{query:'cheek'},speed:1,focus:[0,40,800,460],
     run(sim){blA(sim,'done');},
     see:'Now the sample is mitochondrial DNA from your own cheek cells.',
     why:'Top hit: human, 100%. Cow and pig come next at about 90%, because all mammals share this gene from a common ancestor.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,res(sim));}},
    {key:'snapper',lvl:'honors',title:'The “red snapper” fillet',set:{query:'snapper'},speed:1,focus:[0,40,800,460],
     run(sim){blA(sim,'done');},
     see:'A fish fillet sold as red snapper.',
     why:'Top hit: tilapia at 98%, next hits near 85%. The E value, about 10⁻⁴¹, says a match this good by chance is essentially impossible. It is cheaper tilapia.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,res(sim).concat([['E value: '+blM(sim,'evalue'),{s:12}]]));}},
    {key:'rc',lvl:'ap',title:'The other strand',set:{query:'reverse',rc:true},speed:1,focus:[0,40,800,460],
     cause:{from:{rc:false},delay:3,label:'Reverse complement',at:[300,330]},
     run(sim){blA(sim,'done');},
     see:'Sample X finds no match. Then BLAST searches its reverse complement.',
     why:'This sample was read from the other strand: reversed, with A↔T and G↔C swapped. Flip it and the match appears: chicken.',
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
     see:'The template strand of the β-globin gene, a short primer, and copies being built.',
     why:'The tube holds the DNA to read, a primer, DNA polymerase, normal nucleotides and a pinch (3%) of dyed <b>ddNTPs</b>: green A, red T, black G, blue C.'},
    {key:'stop',title:'Copies that stop at random',set:{sample:'normal',dd:3},speed:1,focus:[0,40,800,180],
     run(sim){atReset(sim);},
     see:'Copies grow and stop. The colored dot at each end is the ddNTP that stopped it.',
     why:'A ddNTP lacks the oxygen the next nucleotide needs, so the copy stops. Stops are random, so some copy ends at every letter.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.8,'run',s=>sgA(s,'run'));}},
    {key:'sort',title:'Sorting by size reads the gene',speed:1,set:{sample:'normal',dd:3},focus:[0,200,800,260],
     run(sim){atReset(sim);},
     see:'The copies race through a thin capillary past a laser. Peaks appear left to right.',
     why:'Short copies arrive first, so colors come out in order, one peak per letter. The read is the template’s complement.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.5,'run',s=>sgA(s,'run'));sgCard(ctx,k,[['Read: '+String(sgM(sim,'read')).slice(0,18)+'…',{w:800}]]);}},
    {key:'hook',title:'Your question: more stop letters?',set:{sample:'normal',dd:30},pause:true,focus:[0,200,800,260],
     cause:{from:{dd:3},delay:2.5,dur:3,label:'ddNTP share',at:[300,215]},
     see:'The read at 3% ddNTPs. A labmate raises it to 30% for “stronger peaks.”',
     why:'At 3% you read all 36 letters. At 30% most copies stop early: <b>only 12</b>. At 0.3% no peak is readable.',
     so:'A good read needs balance.',
     overlay(sim,ctx,LH,k){sgCard(ctx,k,rd(sim));}},
    {key:'sickle',lvl:'honors',title:'Finding sickle cell',set:{sample:'sickle',dd:3},pause:true,focus:[0,200,800,260],
     cause:{from:{sample:'normal'},delay:2.5,label:'DNA sample',at:[300,215]},
     see:'A normal β-globin read switches to a sickle-cell patient’s DNA. Look at letter 20.',
     why:'One letter changes, A to T (GAG to GTG), so the protein gets valine. That makes hemoglobin clump and bends red blood cells into sickles.',
     overlay(sim,ctx,LH,k){sgCard(ctx,k,[['Letter 20: '+sgM(sim,'b20'),{w:800,c:CE_RED}]]);}},
    {key:'carrier',lvl:'ap',title:'A carrier’s double peak',set:{sample:'het',dd:3},pause:true,focus:[0,200,800,260],
     see:'DNA from a carrier: one normal copy and one sickle copy.',
     why:'Half the copies have A at letter 20 and half T, so two half-height peaks share one spot (written W). Carriers rarely have symptoms but can pass it on.',
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
     see:'The labeled boxes show how much carbon each part of Earth holds, in billions of tonnes (GtC).',
     why:'The deep ocean and fossil fuels hold the most. The air holds less, but small changes there change the climate.',
     overlay(sim,ctx,LH,k){ccCard(ctx,k,[['The air holds about 2.12 GtC for every 1 ppm of CO₂',{s:12}]]);}},
    {key:'life',title:'Plants take it in, life gives it back',speed:0.5,fresh:true,focus:[0,40,400,300],
     see:'Dots move down into the trees and back up from the trees, the deer and the soil.',
     why:'<b>Photosynthesis</b> pulls about 120 GtC a year from the air; <b>respiration</b> and decay return about the same.',
      so: 'That is why CO₂ dips every northern summer.'},
    {key:'ocean',title:'The ocean soaks it up',speed:0.5,fresh:true,focus:[395,40,405,370],
     see:'The ocean side: dots move into the water and down to the deep ocean.',
     why:'CO₂ dissolves at the surface, and currents carry some deep for centuries. The ocean holds about 50 times the carbon in the air.'},
    {key:'fossil',title:'Burning fossil fuels',set:{fossil:10},speed:1,fresh:true,focus:[300,40,200,370],
     cause:{from:{fossil:0},delay:2,dur:2,label:'Fossil-fuel burning',at:[400,430]},
     see:'Fossil-fuel burning at the smokestack rises from zero to today’s 10 GtC a year.',
     why:'Coal, oil and gas are carbon buried millions of years ago. Burning returns it in seconds, and CO₂ rises over 2 ppm a year.',
     overlay(sim,ctx,LH,k){ccCard(ctx,k,co2(sim));}},
    {key:'half',title:'Only half is absorbed',speed:1,fresh:true,focus:[0,0,800,450],
     see:'Today’s world: compare what people add each year with what land and ocean take up.',
     why:'Sinks absorb only about half of what we add. The rest stays in the air, so CO₂ climbs about 2 ppm a year, as measured at Mauna Loa.',
     overlay(sim,ctx,LH,k){ccCard(ctx,k,budget(sim));}},
    {key:'hook',title:'Your question: cutting emissions in half',pause:true,speed:1.5,fresh:true,focus:[0,0,800,450],run(sim){atReset(sim);},
     see:'From 2025 the world cuts fossil-fuel burning in half, 10 to 5 GtC a year. Watch CO₂ to 2045.',
     why:'CO₂ still rises, just slower: about <b>424 ppm</b> by 2045 instead of <b>458</b>. It falls only when emissions drop below what sinks take up.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'cut',s=>{BioLab.setValues(s,{fossil:5});s.running=true;if(s.ui&&s.ui.play)s.ui.play.textContent='Pause';});stopAt(sim,2045);ccCard(ctx,k,[['Fossil fuels: '+(sim.p.fossil<10?'cut to 5':'10')+' GtC a year',{w:700}]].concat(co2(sim)));}},
    {key:'warm',lvl:'honors',title:'A warmer ocean holds less',set:{otemp:3},speed:1.5,fresh:true,focus:[395,40,405,370],
     cause:{from:{otemp:0},delay:1.5,dur:2,label:'Ocean warming',at:[400,430]},
     see:'The ocean warms by 3 °C. Watch its uptake.',
     why:'Warm water holds less gas, like warm soda going flat. A weaker sink leaves more CO₂ in the air: a <b>positive feedback</b>.',
     overlay(sim,ctx,LH,k){ccCard(ctx,k,[['Ocean uptake: '+ccM(sim,'ocean').toFixed(1)+' GtC a year',{w:800,c:CE_RED}]].concat(co2(sim).slice(1)));}},
    {key:'ph',lvl:'ap',title:'Ocean acidification',speed:1.5,fresh:true,focus:[395,40,405,370],
     see:'Today’s emissions for 20 years. Watch the ocean’s surface pH.',
     why:'Dissolved CO₂ forms carbonic acid, releasing H⁺. Surface pH has fallen from about 8.2 to 8.05, a third more H⁺, which harms shell builders.',
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
     why:'Tiny floating algae (phytoplankton) capture sunlight by photosynthesis. That stored energy, about <b>10,000 kcal per m² of lake a year</b>, feeds everything else in the lake.',
     overlay(sim,ctx,LH,k){enCard(ctx,k,[['Algae store: '+kc(chain(sim)[0])+' kcal',{w:800,c:CE_GREEN}],['per m² of lake, per year',{s:12}]]);}},
    {key:'tenth',title:'Only about 10% moves up',fresh:true,speed:1,focus:[170,80,630,360],
     see:'Compare the bars: zooplankton, minnows and pike, each eating the level below.',
     why:'Each level gets about a tenth of the one below: 10,000 → 1,000 → 100 → 10 kcal. Most food is burned for moving and warmth and leaves as heat (orange squiggles).',
     overlay(sim,ctx,LH,k){enCard(ctx,k,ladder(sim,3));}},
    {key:'long',title:'A fifth level: the osprey',set:{levels:5},fresh:true,speed:1,focus:[0,60,800,390],
     cause:{from:{levels:4},delay:1.5,dur:0.6,label:'Food chain length',at:[440,436]},
     see:'An osprey, a fish-eating hawk, joins the chain and eats the pike.',
     why:'It gets only <b>1 kcal</b> per m² a year, so it must hunt a huge area. That is why food chains rarely pass 4 or 5 levels, and top predators are few.',
     overlay(sim,ctx,LH,k){enCard(ctx,k,ladder(sim,sim.p.levels-1).slice(0,2));}},
    {key:'sunny',title:'More sunlight, more of everything',set:{gpp:40000},fresh:true,speed:1,focus:[170,80,630,360],
     cause:{from:{gpp:20000},delay:1.5,dur:2,label:'Sunlight captured',at:[440,436]},
     see:'A sunnier, nutrient-rich lake lets algae capture twice as much energy. Watch every bar.',
     why:'Each level still gets 10% of the one below, so doubling the base doubles every level: pike go from 10 to 20 kcal.',
     overlay(sim,ctx,LH,k){enCard(ctx,k,ladder(sim,3));}},
    {key:'hook',title:'Your question: living on pike or minnows',fresh:true,speed:1,focus:[0,60,800,390],
     see:'You eat about 730,000 kcal a year. How much lake would feed you on pike, or on minnows?',
     why:'Minnows: 730,000 ÷ 100 = <b>7,300 m²</b>, about one soccer field. Pike: <b>73,000 m²</b>, about 10 fields. One step up costs 10 times more lake.',
     overlay(sim,ctx,LH,k,tau){const c=chain(sim),a=t=>Math.round(730000/c[t]).toLocaleString('en-US');
       enCard(ctx,k,[['One year of food: 730,000 kcal',{w:700}],['Minnows: '+a(2)+' m² of lake',{w:700,c:CE_BLUE}],tau>2?['Pike: '+a(3)+' m² of lake',{w:800,c:CE_RED}]:['Pike: ?',{w:700}]]);}},
    {key:'mercury',lvl:'honors',title:'Mercury builds up',set:{toxin:true},fresh:true,speed:1,focus:[170,80,630,360],
     cause:{from:{toxin:false},delay:1.5,dur:0.6,label:'Mercury in the lake',at:[440,436]},
     see:'Mercury from coal plants and old mines settles in the lake. Algae hold 0.01 ppm. Watch the right column.',
     why:'Energy is burned off at each level, but mercury stays, about 5 times stronger per level. Pike reach <b>1.2 ppm</b>, over the FDA limit: <b>biomagnification</b>.'},
    {key:'otters',lvl:'honors',title:'A trophic cascade: remove the otters',set:{mode:'cascade'},fresh:true,speed:2,focus:[0,0,800,450],
     run(sim){atReset(sim);sim._rm=null;},
     see:'A Pacific kelp forest: otters eat urchins, urchins eat kelp. Watch hunters remove the otters.',
     why:'Urchins multiply and mow down the kelp, leaving an <b>urchin barren</b> in about 5 years. Otters never eat kelp, yet kelp depends on them: a <b>keystone species</b>.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'rm',s=>{enA(s,'removeOtters');s._rm=s.t;});const y=sim._rm==null?0:Math.floor(sim.t-sim._rm);
       if(y>=12&&sim.running){sim.running=false;if(sim.ui&&sim.ui.play)sim.ui.play.textContent='Play';}
       enCard(ctx,k,[[sim._rm==null?'Otters still here':'Years without otters: '+y,{w:800}]].concat(cas(sim)),12,270);}},
    {key:'back',lvl:'honors',title:'Bring the otters back',set:{mode:'cascade'},fresh:true,speed:3,focus:[0,0,800,450],
     run(sim){const s=sim.st;s.O=0;for(let i=0;i<1200;i++)sim.def.step(sim,0.01);atReset(sim);sim._bk=null;},
     see:'Start from an urchin barren. A few otters return. Watch the kelp.',
     why:'Otters recover in about 10 years, but here the kelp barely regrows for decades. It is far easier to keep a predator than to rebuild an ecosystem after losing one.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'bk',s=>{enA(s,'returnOtters');s._bk=s.t;});const y=sim._bk==null?0:Math.floor(sim.t-sim._bk);
       if(y>=30&&sim.running){sim.running=false;if(sim.ui&&sim.ui.play)sim.ui.play.textContent='Play';}
       enCard(ctx,k,[[sim._bk==null?'Urchin barren':'Years since otters returned: '+y,{w:800}]].concat(cas(sim)),12,270);}},
    {key:'npp',lvl:'ap',title:'GPP, respiration and NPP',set:{resp:70},fresh:true,speed:1,focus:[170,80,630,360],
     cause:{from:{resp:50},delay:1.5,dur:2,label:'Plant respiration',at:[440,436]},
     see:'Algae capture 20,000 kcal (GPP) but burn half themselves. Hot weather raises that to 70%.',
     why:'NPP = GPP − plant respiration. NPP falls from 10,000 to 6,000 kcal, and every consumer level falls by the same 40%. Only NPP is food.',
     overlay(sim,ctx,LH,k){enCard(ctx,k,[['GPP: '+kc(sim.p.gpp)+' kcal',{w:700}],['Plants burn: '+sim.p.resp+'%',{w:700,c:CE_RED}],['NPP: '+kc(enM(sim,'npp'))+' kcal',{w:800,c:CE_GREEN}],['Pike: '+kc(chain(sim)[3])+' kcal',{w:700}]]);}},
    {key:'eff',lvl:'ap',title:'Efficiency compounds',set:{eff:20},fresh:true,speed:1,focus:[170,80,630,360],
     cause:{from:{eff:10},delay:1.5,dur:2,label:'Trophic efficiency',at:[440,436]},
     see:'Trophic efficiency doubles from 10% to 20%. Watch the pike.',
     why:'Top energy = NPP × efficiency³ in a 4-level chain, so doubling efficiency gives 2³ = <b>8 times</b> as much: 10 → 80 kcal. Cold-blooded animals waste less as heat.',
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
     see:'A real-size meadow patch, 10 m by 5.6 m, from above. Each mark is one plant.',
     why:'About 2,500 plants of 8 species: too many to count. Ecologists <b>sample</b> small random areas and estimate the whole field.',
     overlay(sim,ctx,LH,k){bdCard(ctx,k,[['Plants in this patch: '+sim.st.plants.length.toLocaleString('en-US'),{w:700}],['Species: '+bdM(sim,'richT'),{w:800,c:CE_GREEN}]]);}},
    {key:'hoop',title:'Toss one hoop',fresh:true,speed:1,focus:[0,0,800,450],
     run(sim){atReset(sim);},
     see:'A hula hoop 0.75 m across lands at a random spot. Count every plant inside.',
     why:'One hoop covers under 1% of the patch and usually finds about 5 of 8 species. Rare, clumped plants like milkweed are easy to miss.',
     overlay(sim,ctx,LH,k,tau){toss(sim,tau,1,1.5,1);bdCard(ctx,k,found(sim));}},
    {key:'hook',title:'Your question: how many hoops to find them all?',fresh:true,speed:1,focus:[0,0,800,450],
     run(sim){atReset(sim);},
     see:'Hoops land one at a time, up to 10. The species count climbs.',
     why:'One hoop finds about 5 species, three about 7, ten all 8 nine times in ten. The count levels off as only rare ones are left.',
     so:'Toss at random, not at the pretty flowers.',
     overlay(sim,ctx,LH,k,tau){toss(sim,tau,10,1.5,0.9);bdCard(ctx,k,found(sim).concat(tau>10.5?simp(sim):[]));}},
    {key:'lawn',title:'A mowed lawn',set:{habitat:'lawn'},fresh:true,speed:1,focus:[0,0,800,450],
     run(sim){atReset(sim);},
     see:'A mowed lawn. Ten hoops land at once.',
     why:'4 species, but about 5 of every 6 plants are grass. <b>Simpson’s index</b>, the chance two random plants differ, is only about <b>0.28</b>. The meadow scores 0.85.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'t10',s=>bdA(s,'throw10'));bdCard(ctx,k,found(sim).concat(tau>1.6?simp(sim):[]));}},
    {key:'lot',title:'A disturbed lot',set:{habitat:'disturbed'},fresh:true,speed:1,focus:[0,0,800,450],
     run(sim){atReset(sim);},
     see:'A vacant lot scraped bare a few years ago. Ten hoops land.',
     why:'Fast weeds take over first. Plants are sparse and patchy, so ten hoops often find only 4 of the 5 species. Patchy fields need more samples.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'t10',s=>bdA(s,'throw10'));bdCard(ctx,k,found(sim).concat(tau>1.6?simp(sim):[]));}},
    {key:'even',lvl:'honors',title:'Same species, more even',set:{habitat:'lawnEven'},fresh:true,speed:1,focus:[0,0,800,450],
     run(sim){atReset(sim);},
     see:'An unmowed lawn with the same 4 species. Ten hoops land.',
     why:'Now the 4 are about equally common, and Simpson’s jumps from 0.28 to <b>0.75</b>. Diversity is <b>richness</b> plus <b>evenness</b>.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'t10',s=>bdA(s,'throw10'));bdCard(ctx,k,found(sim).concat(tau>1.6?simp(sim):[]));}},
    {key:'dens',lvl:'honors',title:'Estimating density',fresh:true,speed:1,focus:[0,0,800,450],
     run(sim){atReset(sim);},
     see:'Back to the meadow. Ten hoops land. Compare the estimate with the true number.',
     why:'Density = plants counted ÷ area sampled: about 200 plants in 4.4 m² is about 45 per m². More hoops, a closer estimate.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'t10',s=>bdA(s,'throw10'));const est=bdM(sim,'dens');
       bdCard(ctx,k,[['Hoops: '+bdM(sim,'hoops')+' ('+(bdM(sim,'hoops')*0.44).toFixed(1)+' m²)',{w:700}],['Estimate: '+(Number.isFinite(est)?est.toFixed(0):'—')+' plants per m²',{w:800,c:CE_RED}],['True: '+(sim.st.plants.length/56.25).toFixed(0)+' per m²',{w:700}]]);}},
    {key:'mrnow',lvl:'ap',title:'Mark and recapture, too soon',set:{method:'mr'},fresh:true,speed:1,focus:[0,0,800,450],
     run(sim){atReset(sim);},
     see:'Beetles get a paint dot and are released, then the traps are checked again right away.',
     why:'N = M × C ÷ R. But the marked beetles haven’t mixed in yet, so R is too big and the estimate comes out far too low.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,1.5,'m',s=>bdA(s,'mark'));atT(sim,tau,3.5,'r',s=>bdA(s,'recap'));mrCard(ctx,k,LH,sim);}},
    {key:'mr',lvl:'ap',title:'Mark, wait, recapture',set:{method:'mr'},fresh:true,speed:1,focus:[0,0,800,450],
     run(sim){atReset(sim);},
     see:'Same traps, but the beetles get a day to mix back in before the second catch.',
     why:'Now the estimate is in range, though one run can miss by 30%. It assumes marks stay on and no beetles are born, die or leave.',
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
     see:'One round: moose (M) race to the meadow to tag grass (G); wolves (W) try to tag moose on the way.',
     why:'Each student is one animal or patch of grass, and each round is a year. Players change roles, like atoms cycling through an ecosystem.',
     overlay(sim,ctx,LH,k){stopY(sim,2);}},
    {key:'roles',title:'Who becomes what',set:AVG,fresh:true,speed:0.5,focus:[0,40,800,410],
     run(sim){sim._wm={};},
     see:'Watch each player at the end of the round.',
     why:'Moose that eat turn grass into a calf. Caught moose become wolves. Hungry moose and wolves starve and become grass.',
     overlay(sim,ctx,LH,k){stopY(sim,2);}},
    {key:'boom',title:'Moose boom',set:AVG,fresh:true,speed:1.5,focus:[0,40,800,410],
     run(sim){sim._wm={};},
     see:'The first years: plenty of grass and only 2 wolves.',
     why:'Almost every moose eats and has a calf: moose go from 6 to 14 in two years while grass drops from 16 to 8.',
     overlay(sim,ctx,LH,k){stopY(sim,3);wmCard(ctx,k,[['Year '+sim.st.year+': moose '+Math.round(sim.st.M)+', grass '+Math.round(sim.st.G),{w:800,c:CE_RED}]]);}},
    {key:'cycle',title:'Wolves follow the moose',set:AVG,fresh:true,speed:4,focus:[0,40,800,410],
     run(sim){sim._wm={};},
     see:'Fifteen years, fast. Watch the wolf and moose counts at the top right, then the graph below.',
     why:'Moose peak first (year 3); wolves peak later (year 12), then the moose crash and the wolves starve. Predator peaks <b>lag</b> prey peaks.',
     overlay(sim,ctx,LH,k){const m=peak(sim,'M'),w=peak(sim,'W');
       wmCard(ctx,k,[['Most moose: '+Math.round(m.M)+' (year '+m.y+')',{w:700,c:CE_RED}],['Most wolves: '+Math.round(w.W)+' (year '+w.y+')',{w:700}]]);}},
    {key:'hook',title:'Your question: remove every wolf',set:AVG,fresh:true,speed:3,focus:[0,40,800,410],
     run(sim){sim._wm={};},
     see:'In year 5 every wolf is pulled from the game. Watch the moose for ten years.',
     why:'Moose jump to about <b>19</b>, run out of grass, crash to about <b>8</b>, then swing between 7 and 19.',
     so:'Without predators, prey boom and crash.',
     overlay(sim,ctx,LH,k){at(sim,5,'nw',s=>wmA(s,'nowolves'));stopY(sim,15);
       wmCard(ctx,k,[[sim.st.year<6?'Year '+sim.st.year+': wolves still in the game':'Year '+sim.st.year+': no wolves',{w:700}],['Moose: '+Math.round(sim.st.M)+'   Grass: '+Math.round(sim.st.G),{w:800,c:CE_RED}]]);}},
    {key:'drought',title:'A drought year',set:AVG,fresh:true,speed:2,focus:[0,40,800,410],
     run(sim){sim._wm={};},
     see:'Year 4 is a drought: half the grass doesn’t grow.',
     why:'Moose starve, dropping from 13 to about 6, and wolves then grow slowly. Food limits everything above it: <b>bottom-up control</b>. Wolves limiting moose is <b>top-down control</b>.',
     overlay(sim,ctx,LH,k){at(sim,4,'dr',s=>wmA(s,'drought'));stopY(sim,8);
       wmCard(ctx,k,[['Year '+sim.st.year+(sim.st.year===4?': drought':''),{w:700}],['Moose: '+Math.round(sim.st.M)+'   Wolves: '+Math.round(sim.st.W),{w:800,c:CE_RED}]]);}},
    {key:'luck',lvl:'honors',title:'A real game has luck',set:{luck:'real'},fresh:true,speed:4,focus:[0,40,800,410],
     run(sim){sim._wm={};},
     see:'Each tag is now a real chance, like in the gym. Fifteen years, fast.',
     why:'Luck swings small populations hard: wolves climb to 12, then crash to one. Isle Royale’s wolves fell to 2 by 2016.',
     overlay(sim,ctx,LH,k){const w=peak(sim,'W');wmCard(ctx,k,[['Year '+sim.st.year+': wolves '+Math.round(sim.st.W)+', moose '+Math.round(sim.st.M),{w:800,c:CE_RED}],['Most wolves so far: '+Math.round(w.W),{w:700}]]);}},
    {key:'model',lvl:'ap',title:'What the game gets wrong',set:AVG,fresh:true,pause:true,focus:[0,40,800,410],
     see:'Think about the game as a model of a real ecosystem.',
     why:'It gets matter cycling and the predator lag right. It leaves out a growing population, long lives and grass regrowth. Good models are simple on purpose.'}
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
     see:'A slice through the top 700 km of Earth under the Atlantic. Gray: the rigid plate. Orange: the flowing rock below.',
     why:'The shell is broken into about a dozen <b>plates</b>. Slow <b>convection currents</b> below carry them a few cm a year.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['These plates move 2.5 cm a year',{w:700}],['Your fingernails grow about 3–4 cm a year',{w:600}],['Over 1 million years: 25 km',{w:800,c:CE_RED}]]);}},
    {key:'ridge',title:'Pulling apart: new sea floor',set:{view:'boundary',type:'ridge',speed:2.5,stripes:false},fresh:true,speed:2,
     see:'White ticks mark spots on the sea floor. They move away from the ridge on both sides.',
     why:'Hot rock rises into the gap, melts and hardens as <b>new sea floor</b>. The youngest rock is at the ridge. Iceland sits on this ridge.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['New sea floor so far: '+f0(plM(sim,'moved'))+' km',{w:700}],['Deepest quake: '+f0(plM(sim,'deep'))+' km',{w:800,c:CE_RED}]]);}},
    {key:'stripes',lvl:'honors',title:'The sea floor’s magnetic stripes',set:{view:'boundary',type:'ridge',speed:2.5,stripes:true},fresh:true,speed:2,cause:{from:{stripes:false},delay:1.5,label:'Magnetic stripes',at:[620,330]},
     see:'The strip at the top is the sea floor seen from above. New stripes form at the ridge as time runs.',
     why:'Cooling lava records Earth’s magnetic field, which flips now and then. Spreading carries stripes away on both sides as a <b>mirror image</b>.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Black: field the way it is now',{w:700}],['White: field flipped',{w:700}],['Same pattern on both sides',{w:800,c:CE_RED}]]);}},
    {key:'rift',title:'A continent splits',set:{view:'boundary',type:'rift',speed:0.7,stripes:false},fresh:true,speed:8,
     see:'Pulling apart under a continent, run fast. The middle drops, volcanoes grow on the edges, then the valley floods.',
     why:'Stretching makes a <b>rift valley</b>, like East Africa. Keep pulling and <b>the ocean floods in</b>, like the Red Sea. Colorado has the slow Rio Grande Rift.',
     overlay(sim,ctx,LH,k){const D=plM(sim,'moved');plCard(ctx,k,LH,[['Pulled apart: '+f0(D)+' km',{w:700}],[D>140?'Flooded: a new ocean':'Still a valley on land',{w:800,c:D>140?CE_BLUE:CE_RED}]]);}},
    {key:'oc',title:'Ocean meets continent: a plate dives',set:{view:'boundary',type:'oc',speed:6.5},fresh:true,speed:1.5,
     see:'Ocean floor on the left, a continent on the right. Follow the white ticks on the ocean plate and watch magma rise.',
     why:'Dense ocean crust sinks under the lighter continent: <b>subduction</b>. It makes a deep <b>trench</b>, and melting at depth builds <b>volcanoes</b> inland: the Andes.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Trench: '+f1(plM(sim,'low'))+' km deep',{w:700}],['Volcanoes: '+f1(plM(sim,'high'))+' km high',{w:800,c:CE_RED}]]);}},
    {key:'deep',title:'Earthquakes follow the sinking plate',set:{view:'boundary',type:'oc',speed:6.5},fresh:true,speed:2,
     see:'Earthquakes appear: red ones shallow, orange medium, purple deep.',
     why:'The cold sinking plate cracks as it goes down, so quakes go <b>deeper and deeper inland</b>, to about 660 km. Subduction makes the biggest ones, like Chile’s 9.5.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Deepest earthquake so far:',{w:700}],[f0(plM(sim,'deep'))+' km down',{w:800,c:CE_RED,s:16}]]);}},
    {key:'oo',title:'Ocean meets ocean: an island arc',set:{view:'boundary',type:'oo',speed:8},fresh:true,speed:2,
     see:'Two ocean plates meet. A volcano grows from the sea floor.',
     why:'The older, denser plate sinks, making the deepest trenches (Mariana, 11 km). Magma builds a curved <b>island arc</b>, like Japan.',
     overlay(sim,ctx,LH,k){const h=plM(sim,'high');plCard(ctx,k,LH,[['Trench: '+f1(plM(sim,'low'))+' km deep',{w:700}],[h>0?'Island: '+f1(h)+' km above the sea':'Volcano still under water',{w:800,c:CE_RED}]]);}},
    {key:'cc',title:'Continents collide',set:{view:'boundary',type:'cc',speed:4},fresh:true,speed:4,
     see:'India on the left, Asia on the right, run fast. The middle crumples upward.',
     why:'Continents are too light to sink, so crust <b>folds and stacks</b> into mountains: the Himalayas, still rising. Big earthquakes, but <b>no volcanoes</b>.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Mountains: '+f1(plM(sim,'high'))+' km high',{w:800,c:CE_RED}],['Volcanoes: none',{w:700}]]);}},
    {key:'transform',title:'Sliding past: the road bends, then snaps',set:{view:'boundary',type:'transform',speed:3.5},fresh:true,speed:1,
     see:'The San Andreas Fault from above. A road and a stream cross it. The road bends, then snaps.',
     why:'Friction keeps the fault <b>locked</b> while strain builds, like a bending ruler. When it slips: an <b>earthquake</b>. In 1906, roads shifted up to 6 m.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Strain stored: '+f1(plM(sim,'strain'))+' m',{w:700}],['Road offset so far: '+f1(plM(sim,'offset'))+' m',{w:700}],['Big earthquakes: '+f0(plM(sim,'nq')),{w:800,c:CE_RED}]]);}},
    {key:'hawaii',title:'Hot spots: Hawaii',set:{view:'hotspot',spot:'hawaii',speed:8},fresh:true,speed:3,
     see:'A plume of hot rock rises and stays put. The plate carries each new volcano away.',
     why:'Each volcano forms over the <b>hot spot</b>, then rides away and dies. Islands get <b>older farther away</b>: the Big Island under 1 million years, Kauai about 5.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Volcanoes formed: '+f0(plM(sim,'nisl')),{w:700}],['Oldest: '+f1(plM(sim,'oldest'))+' million years, '+f0(plM(sim,'odist'))+' km away',{w:800,c:CE_RED}]]);}},
    {key:'yellowstone',title:'Hot spots: Yellowstone',set:{view:'hotspot',spot:'yellowstone',speed:2.5},fresh:true,speed:4,
     see:'The same kind of hot spot, under a continent. Watch the craters it leaves behind.',
     why:'Under a continent it makes giant eruptions and <b>calderas</b>. The drifting plate left a trail across Idaho. Yellowstone sits over it today.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Craters formed: '+f0(plM(sim,'nisl')),{w:700}],['Oldest: '+f0(plM(sim,'odist'))+' km away',{w:800,c:CE_RED}]]);}},
    {key:'hook',title:'Your question: why volcanoes around Quito?',set:{view:'boundary',type:'oc',speed:6.5},fresh:true,speed:1.5,
     see:'The boundary off Ecuador: the Nazca plate diving under South America.',
     why:'<b>Ocean meets continent.</b> The sinking plate melts rock deep down, and magma rises inland, right under Quito, building Cotopaxi.',
     so:'Ecuador watches its volcanoes and posts alert levels.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[['Plate speed: 6.5 cm a year',{w:700}],['Trench: '+f1(plM(sim,'low'))+' km deep',{w:700}],['Volcanoes: '+f1(plM(sim,'high'))+' km high, about 200 km inland',{w:800,c:CE_RED}]]);}},
    {key:'rate',lvl:'ap',title:'Measure the plate’s speed',set:{view:'hotspot',spot:'hawaii',speed:8},fresh:true,speed:3,
     see:'Hawaii again. The card divides the oldest volcano’s distance by its age.',
     why:'Speed = distance ÷ time. 400 km in 5.0 million years is <b>8 cm a year</b>. Shortcut: km per million years ÷ 10 = cm per year.',
     overlay(sim,ctx,LH,k){plCard(ctx,k,LH,[[f0(plM(sim,'odist'))+' km ÷ '+f1(plM(sim,'oldest'))+' million years',{w:700}],['= '+f1(plM(sim,'calc'))+' cm a year',{w:800,c:CE_RED,s:15}]]);}},
    {key:'recur',lvl:'ap',title:'How often does the fault break?',set:{view:'boundary',type:'transform',speed:7},fresh:true,speed:1,
     see:'The fault again, with the plates sliding twice as fast. Watch the gap between earthquakes.',
     why:'Time between quakes ≈ slip ÷ speed: 4.5 m ÷ 3.5 cm/yr ≈ 130 years; at 7 cm/yr, about 65. <b>Faster plates, more frequent quakes.</b>',
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
     see:'A tube of water with bacteria to eat. A few Paramecium aurelia are added. Watch their number.',
     why:'With no competitor they grow fast, then level off at the tube’s <b>carrying capacity</b>. All they could use is their <b>fundamental niche</b>.',
     overlay(sim,ctx,LH,k){nCard(ctx,k,LH,[[pops(sim)[0][0],{w:800,c:CE_GREEN}]]);}},
    {key:'exclusion',title:'Same food, same place: one wins',set:{sc:'gause1',grow:'both',sep:0.15},fresh:true,speed:1.5,
     see:'A second species, P. caudatum, shares the tube and eats the same bacteria. Watch both.',
     why:'P. aurelia gets the food first, and <b>P. caudatum dies out</b> (Gause, 1934). Two species can’t share one niche: <b>competitive exclusion</b>.',
     overlay(sim,ctx,LH,k){nCard(ctx,k,LH,[ovr(sim,CE_RED)]);}},
    {key:'partition',title:'Split the tube: both survive',set:{sc:'gause2',grow:'both',sep:2.6},fresh:true,speed:1.5,
     see:'P. caudatum with green P. bursaria. Watch where each feeds, and both populations.',
     why:'One eats bacteria near the top, the other yeast near the bottom. They barely compete, so <b>both survive</b>: <b>resource partitioning</b>.',
     overlay(sim,ctx,LH,k){nCard(ctx,k,LH,[ovr(sim,CE_GREEN)]);}},
    {key:'warblers',title:'Splitting a tree',set:{sc:'warblers',grow:'both',sep:2.2},fresh:true,speed:1,
     see:'Two warblers eat insects in the same spruce trees. Watch where each one hunts.',
     why:'MacArthur found warblers each hunting in their own part of the tree. Splitting by <b>place</b> keeps them from competing head to head.',
     overlay(sim,ctx,LH,k){nCard(ctx,k,LH,[ovr(sim,CE_GREEN)]);}},
    {key:'grazers',title:'Splitting the menu',set:{sc:'grazers',grow:'both',sep:2.8},fresh:true,speed:1,
     see:'Gorongosa, Mozambique: waterbuck graze grass in the open; kudu browse leaves from trees and shrubs.',
     why:'<b>Grazers</b> and <b>browsers</b> share a park by eating different plants. Gorongosa’s animals have climbed back past 100,000 since 2004.',
     overlay(sim,ctx,LH,k){nCard(ctx,k,LH,[ovr(sim,CE_GREEN)]);}},
    {key:'threshold',lvl:'honors',title:'How much overlap is too much?',set:{sc:'gause2',grow:'both',sep:0.4},fresh:true,speed:1.5,cause:{from:{sep:2.6},delay:2,dur:4,label:'How different their niches are',at:[250,440]},
     see:'The two Paramecium that split the tube. Watch the overlap rise as their niches slide together, then watch P. bursaria.',
     why:'Past about 87% overlap, the weaker species can’t recover from low numbers and declines.',
     overlay(sim,ctx,LH,k){nCard(ctx,k,LH,[ovr(sim,CE_RED)]);}},
    {key:'realized',lvl:'honors',title:'Fundamental and realized niche',set:{sc:'warblers',grow:'both',sep:1.4},fresh:true,speed:1.5,
     see:'On the right, dashed curves show where each warbler would hunt alone; solid curves, where it hunts with the other.',
     why:'Alone, a species uses its <b>fundamental niche</b>. With a competitor, it is pushed into its <b>realized niche</b>.',
     overlay(sim,ctx,LH,k){}},
    {key:'hook',title:'Your question: more birds at the feeder',set:{sc:'gause1',grow:'both',sep:2.6},fresh:true,speed:1.5,cause:{from:{sep:0.15},delay:3,dur:2,label:'Different foods in different places',at:[250,440]},
     see:'Two species want the same food, like birds at one feeder. Now they get different foods in different places.',
     why:'Split the resource and overlap drops to about 18%, so both survive.',
      so: 'At a feeder: nyjer for goldfinches, suet for woodpeckers.',
     overlay(sim,ctx,LH,k){nCard(ctx,k,LH,[ovr(sim,nM(sim,'ov')>80?CE_RED:CE_GREEN)]);}},
    {key:'rule',lvl:'ap',title:'The coexistence rule',set:{sc:'grazers',grow:'both',sep:1.2},fresh:true,speed:1.5,
     see:'Waterbuck and kudu with more diet overlap. Compare α with K₂ ÷ K₁ in the readouts.',
     why:'The weaker species persists only if <b>α &lt; K₂/K₁</b>. Here K₂/K₁ = 0.67 and α = 0.70, so the kudu slowly declines.',
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
      why: 'Two plots of the same seed never yield the same, since soil and insects vary. With one plot each, you can’t tell the seed’s effect from luck.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.4,'g',s=>{s.st.seed=2;G(s).grow(s);});if(done(sim))card(ctx,k,[['One plot each: '+D(M(sim,'diff'))+' bu/acre',{w:700}],['Is that the seed, or luck?',{c:'#c8102e',w:700}]]);} },
    { key: 'again', title: 'Run it again… and again', set: Object.assign({}, START, { n: 1 }), fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);},
      see: 'The same one-plot design, run three times, as if in three years.',
      why: 'The difference jumps by tens of bushels and can even flip. Repeating the treatment, <b>replication</b>, shows that spread.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.3,'g',s=>{s.st.seed=5;G(s).grow(s);});atT(sim,tau,4.3,'a',again);atT(sim,tau,8.3,'b',again);
        const h=sim.st.hist.concat(done(sim)?[M(sim,'diff')]:[]);card(ctx,k,[['One plot each, run '+Math.max(1,h.length)+' times',{w:700}],[h.length?h.map(D).join(', ')+' bu/acre':'…',{c:'#c8102e',w:700}],'Same design, very different answers']);} },
    { key: 'reps', title: 'Six plots each, placed at random', set: START, fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);},
      see: 'Now 6 plots of each seed at random spots. Watch the dots, then two more runs.',
      why: 'Averages of 6 plots wobble much less, and random placement spreads good and poor soil across both. Bt comes out about 20 bu/acre ahead every run.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.3,'g',s=>{s.st.seed=G(s).rep(s,22,3);});atT(sim,tau,4.3,'a',again);atT(sim,tau,8.3,'b',again);
        const h=sim.st.hist.concat(done(sim)?[M(sim,'diff')]:[]);card(ctx,k,[['6 plots each, at random',{w:700}],[h.length?h.map(D).join(', ')+' bu/acre':'…',{c:'#1b7a3a',w:700}],'Runs now agree: Bt helps in a borer year']);} },
    { key: 'normal', title: 'A year without corn borers', set: Object.assign({}, START, { season: 'normal' }), fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);},
      see: 'The same fair trial in a normal year with few corn borers.',
      why: 'The difference shrinks to about zero. Bt’s protein only kills corn borers. A GMO trait solves one problem, not yield in general.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.3,'g',s=>{s.st.seed=G(s).rep(s,0,2);});if(done(sim))card(ctx,k,[['Normal year: '+D(M(sim,'diff'))+' bu/acre',{w:700}],['No borers, nothing for Bt to do',{c:'#c8102e',w:700}]]);} },
    { key: 'split', title: 'A layout that fools you', set: Object.assign({}, START, { season: 'normal', layout: 'split' }), fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);},
      see: 'Same normal year, but all the Bt plots are on the east half. Watch the result, then the soil map.',
      why: 'Bt “wins” by about 25 bu/acre, but the east has deeper soil. Soil and seed are <b>confounded</b>. Random placement prevents this.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.3,'g',s=>{s.st.seed=G(s).rep(s,26,3);});atT(sim,tau,4.6,'s',s=>{s.st.soil=true;});
        if(done(sim))card(ctx,k,[['Bt on the east half: '+D(M(sim,'diff'))+' bu/acre',{w:700}],[sim.st.soil?'The east has the better soil':'But this is a no-borer year…',{c:'#c8102e',w:700}]]);} },
    { key: 'fert', title: 'One extra difference', set: Object.assign({}, START, { season: 'normal', fair: 'extra' }), fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);},
      see: 'Random placement, but the dealer’s Bt plots also got extra fertilizer.',
      why: 'Bt “wins” by about 14 bu/acre, all from fertilizer. When two things differ, you can’t tell which mattered. Change only the variable you test.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.3,'g',s=>{s.st.seed=G(s).rep(s,14,3);});if(done(sim))card(ctx,k,[['Extra fertilizer on Bt: '+D(M(sim,'diff'))+' bu/acre',{w:700}],['That’s the fertilizer, not the seed',{c:'#c8102e',w:700}]]);} },
    { key: 'last', title: 'No control group', set: { q: 'dt', season: 'drought', ctrl: 'last', n: 6, layout: 'random', fair: 'same' }, fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);},
      see: 'A farmer tries drought-tolerant corn in a dry summer and compares it with last year’s 178 bu/acre.',
      why: 'It looks about 45 bu/acre worse, but the drought hit every field. Without a <b>control</b> grown this year, she can’t see regular corn did even worse.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.3,'g',s=>{s.st.seed=G(s).rep(s,-46,3);});if(done(sim))card(ctx,k,[['Against last year: '+D(M(sim,'diff'))+' bu/acre',{w:700}],['The drought, not the seed',{c:'#c8102e',w:700}]]);} },
    { key: 'pairs', lvl: 'honors', title: 'Error bars and matched pairs', set: { q: 'dt', season: 'drought', ctrl: 'side', n: 12, layout: 'random', fair: 'same' }, fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);sim._gmSE=null;},
      see: 'Drought-tolerant vs regular corn, 12 random plots each. Then the same 24 plots as 12 neighbor pairs.',
      why: 'The trait’s 12 bu/acre gain is small next to soil noise. Neighbor pairs share soil, so it cancels and the error bars shrink.',
      overlay(sim,ctx,LH,k,tau){atT(sim,tau,0.3,'g',s=>{s.st.seed=G(s).rep(s,12,2);});atT(sim,tau,4.4,'p',s=>{s._gmSE=M(s,'se');BioLab.setValues(s,{layout:'blocks'});s.st.seed=G(s).rep(s,12,2);});
        card(ctx,k,[['Difference '+(done(sim)?D(M(sim,'diff')):'…')+' bu/acre',{w:700}],sim._gmSE!=null?'At random: ± '+sim._gmSE.toFixed(1)+' (standard error)':'At random: ± '+(done(sim)?M(sim,'se').toFixed(1):'…'),sim._gmSE!=null?['In pairs: ± '+(done(sim)?M(sim,'se').toFixed(1):'…'),{c:'#1b7a3a',w:700}]:'']);} },
    { lvl: 'ap', key: 'pval', title: 'p-values from repeated trials', set: Object.assign({}, START, { layout: 'blocks' }), fresh: true, speed: 1,
      run(sim){atReset(sim);G(sim).replan(sim);sim._gmP=[];},
      see: 'Six Bt-vs-regular pairs in a borer year, run three times. Read each p-value.',
      why: 'A p-value is the chance of a difference this big if the seeds were really equal. Small every time means a real effect, but not how big.',
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
