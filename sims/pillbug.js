(function(){
'use strict';
const {clamp,randn,rr,txt,pill,atLeast,PAL,RM}=BioLab.h;

/* Chamber geometry (logical px). 25 px = 1 cm, so the chamber is about 27 × 12 cm. */
const PX=25,X0=60,X1=740,Y0=96,Y1=384,MID=400,DY0=190,DY1=290;
const CRIT=[[2.71,'p > 0.10'],[3.84,'0.05 < p < 0.10'],[6.63,'0.01 < p < 0.05'],[10.83,'0.001 < p < 0.01'],[Infinity,'p < 0.001']];
function sideCond(sim,side){const p=sim.p,hon=atLeast('honors');return {dry:p[side+'m']==='dry',light:p[side+'l']==='light',T:hon?p[side+'T']:20};}
/* How unpleasant a side is for an isopod: dry and bright are bad, and so is far from about 17 °C. */
function unfav(c){return Math.min(2,(c.dry?1.3:0)+(c.light?1.1:0)+0.8*Math.pow((c.T-17)/9,2));}
function spawn(sim,s){const n=sim.p.n;s.bugs=[];for(let i=0;i<n;i++){const left=i<n/2;s.bugs.push({x:left?X0+30+Math.random()*(MID-X0-60):MID+30+Math.random()*(X1-MID-60),y:Y0+22+Math.random()*(Y1-Y0-44),th:Math.random()*6.283,rest:Math.random()<0.3,v:0,ph:Math.random()*6.28});}}
function sideCount(s){let L=0;for(const b of s.bugs)if(b.x<MID)L++;return [L,s.bugs.length-L];}
function chiData(sim){const s=sim.st,r=s.reads;if(!r.length)return null;let L,R,src;
  if(s.tk>=10-1e-6&&r.length>=4){const last=r.slice(-4);L=last.reduce((a,x)=>a+x.L,0)/4;R=last.reduce((a,x)=>a+x.R,0)/4;src='average of the last 4 counts';}
  else{L=r[r.length-1].L;R=r[r.length-1].R;src='latest count';}
  const e=(L+R)/2;if(e<=0)return null;const x=(L-e)*(L-e)/e+(R-e)*(R-e)/e;return {L,R,e,x,src,p:CRIT.find(c=>x<c[0])[1]};}

const SIM={
  id:'pillbug',hash:'pillbug',apUnit:0,order:2,tab:'Pill bug choice chamber',kind:'Virtual lab',
  card:'Give pill bugs a choice between wet and dry or light and dark, count them every 30 seconds, then test your counts with chi-square.',
  title:'Pill bug choice chamber: animal behavior',
  lede:{bio:'Pill bugs can wander anywhere in the chamber. Give the two sides different conditions and count where the bugs end up.',
        honors:'Add temperature to the choices and measure how fast the bugs move on each side, to tell kinesis from taxis.',
        ap:'AP Lab 11: test your counts against a 50:50 null hypothesis with chi-square, and decide whether the preference is real.'},
  scale:'Real lab scale: the choice chamber is about 27 cm long. Each pill bug (isopod) is about 1 cm long.',
  timeScale:0.25,dtMax:0.01,prewarm:0,sampleDt:0.05,window:10,unit:'min',timeLabel:'Time',chChange:0.02,chReveal:10.05,
  clock(sim){const t=Math.min(sim.st.tk,10);return 'Minute '+t.toFixed(1)+' of 10';},
  controls:[
    {id:'n',label:'Number of pill bugs',type:'range',min:10,max:40,step:2,def:20,lvl:'bio',onChange(sim){spawn(sim,sim.st);}},
    {id:'Lm',label:'Left side: filter paper',type:'seg',def:'wet',lvl:'bio',options:[{v:'wet',l:'Wet'},{v:'dry',l:'Dry'}]},
    {id:'Ll',label:'Left side: light',type:'seg',def:'dark',lvl:'bio',options:[{v:'dark',l:'Dark (covered)'},{v:'light',l:'Light'}]},
    {id:'Rm',label:'Right side: filter paper',type:'seg',def:'dry',lvl:'bio',options:[{v:'wet',l:'Wet'},{v:'dry',l:'Dry'}]},
    {id:'Rl',label:'Right side: light',type:'seg',def:'dark',lvl:'bio',options:[{v:'dark',l:'Dark (covered)'},{v:'light',l:'Light'}]},
    {id:'LT',label:'Left side temperature',type:'range',min:5,max:35,step:1,def:20,unit:' °C',lvl:'honors',help:'Ice pack or warm pad under one side'},
    {id:'RT',label:'Right side temperature',type:'range',min:5,max:35,step:1,def:20,unit:' °C',lvl:'honors'}
  ],
  actions:[{id:'again',label:'Release the bugs again',primary:true,run(sim){BioLab.reset(sim);}}],
  init(sim){const s={tk:0,reads:[],flash:0,vL:0,vR:0};spawn(sim,s);const c=sideCount(s);s.reads.push({t:0,L:c[0],R:c[1]});return s;},
  step(sim,dt){const s=sim.st,uL=unfav(sideCond(sim,'L')),uR=unfav(sideCond(sim,'R'));let sumL=0,nL=0,sumR=0,nR=0;
    for(const b of s.bugs){const left=b.x<MID,u=left?uL:uR;let v=0;
      if(b.rest){if(Math.random()<dt*(0.6+2.5*u))b.rest=false;}
      else if(Math.random()<dt*1.6*Math.exp(-1.5*u))b.rest=true;
      else{v=8+14*Math.min(u,1.5);b.th+=randn()*Math.sqrt(dt)*(1.5+2.5*Math.min(u,1.5));
        let nx=b.x+Math.cos(b.th)*v*PX*dt,ny=b.y+Math.sin(b.th)*v*PX*dt;
        if(nx<X0+12||nx>X1-12){b.th=Math.PI-b.th;nx=b.x;}if(ny<Y0+10||ny>Y1-10){b.th=-b.th;ny=b.y;}
        if(((b.x<MID)!==(nx<MID))&&(ny<DY0+6||ny>DY1-6)){b.th=Math.PI-b.th;nx=b.x;}
        b.x=nx;b.y=ny;}
      b.v=v;if(left){sumL+=v;nL++;}else{sumR+=v;nR++;}}
    const a=Math.min(1,dt*1.5);s.vL+=((nL?sumL/nL:s.vL)-s.vL)*a;s.vR+=((nR?sumR/nR:s.vR)-s.vR)*a;
    const prev=s.tk;s.tk+=dt;
    if(s.tk<=10+1e-9&&Math.floor(s.tk/0.5+1e-9)>Math.floor(prev/0.5+1e-9)){const c=sideCount(s);s.reads.push({t:Math.round(s.tk*2)/2,L:c[0],R:c[1]});s.flash=1;}},
  metrics:[
    {id:'left',label:'Bugs on the left',unit:'',lvl:'bio',min:0,max:40,d:0,get:s=>sideCount(s.st)[0]},
    {id:'right',label:'Bugs on the right',unit:'',lvl:'bio',min:0,max:40,d:0,get:s=>sideCount(s.st)[1]},
    {id:'pctL',label:'Percent on the left',unit:'%',lvl:'bio',min:0,max:100,d:0,get(sim){const c=sideCount(sim.st);return 100*c[0]/Math.max(1,c[0]+c[1]);}},
    {id:'vL',label:'Average speed, left side',unit:'cm/min',lvl:'honors',min:0,max:25,d:1,get:s=>s.st.vL},
    {id:'vR',label:'Average speed, right side',unit:'cm/min',lvl:'honors',min:0,max:25,d:1,get:s=>s.st.vR},
    {id:'chi',label:'Chi-square (χ²)',unit:'',lvl:'ap',min:0,max:20,d:2,get(sim){const c=chiData(sim);return c?c.x:NaN;}},
    {id:'decision',label:'Chi-square test (df = 1)',text:true,lvl:'ap',get(sim){const c=chiData(sim);if(!c)return '—';
      return 'χ² '+c.x.toFixed(2)+(c.x>=3.84?' ≥ ':' < ')+'3.84 ('+c.p+'): '+(c.x>=3.84?'reject H₀, a real preference':'fail to reject H₀, could be chance');}}
  ],
  graphs:[{id:'counts',label:'Bugs on each side',lines:['left','right']},{id:'pct',label:'Percent on the left',lines:['pctL']},{id:'speed',label:'Speed on each side',lvl:'honors',lines:['vL','vR']}],defaultGraph:'counts',
  narrate(sim){const s=sim.st,cL=sideCond(sim,'L'),cR=sideCond(sim,'R'),uL=unfav(cL),uR=unfav(cR),c=sideCount(s);
    const desc=x=>(x.dry?'dry':'wet')+', '+(x.light?'light':'dark')+(atLeast('honors')?', '+x.T+' °C':'');
    if(Math.abs(uL-uR)<0.05)return 'Both sides are '+desc(cL)+'. With nothing to prefer, the bugs wander at the same pace everywhere, so they end up <b>roughly split between the sides</b> ('+c[0]+' left, '+c[1]+' right).';
    const good=uL<uR?'left':'right',bad=good==='left'?'right':'left';
    if(s.tk<1.5)return 'The bugs start evenly split and wander at random. None of them can sense the far side of the chamber.';
    if(s.tk<4)return 'On the '+bad+' side the bugs <b>move faster and turn more</b>; on the '+good+' side they slow down and rest. Watch: restless bugs keep wandering until they happen into the '+good+' side, then they stay.';
    return 'On the '+bad+' side the bugs <b>move faster and turn more</b>; on the '+good+' side they slow down and rest. So they pile up on the '+good+' side ('+(good==='left'?c[0]:c[1])+' of '+(c[0]+c[1])+'). That is <b>kinesis</b>, not steering.';},
  initVis(){},
  draw(sim,ctx,vdt,k,t){const s=sim.st,cL=sideCond(sim,'L'),cR=sideCond(sim,'R'),hon=atLeast('honors'),c=sideCount(s);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // header: clock + counts
    txt(ctx,'Minute '+Math.min(s.tk,10).toFixed(1)+' of 10',20,28,{s:14*k,w:700});
    const nextIn=s.tk>=10?null:Math.ceil((0.5-(s.tk%0.5))*60);
    txt(ctx,s.tk>=10?'Trial over: counting done':'Next count in '+nextIn+' s',20,48,{s:12.5*k,c:PAL['cv-soft']});
    s.flash=Math.max(0,s.flash-vdt*1.5);
    [[c[0],MID-60,'Left'],[c[1],MID+60,'Right']].forEach(q=>{const r=22+s.flash*6;ctx.fillStyle=PAL['card'];ctx.strokeStyle=s.flash>0.05?PAL['s1']:PAL['line'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(q[1],48,r,0,6.29);ctx.fill();ctx.stroke();
      txt(ctx,String(q[0]),q[1],49,{s:18*k,w:800,a:'center',b:'middle'});});
    // sides
    [[X0,MID,cL,'L'],[MID,X1,cR,'R']].forEach(sd=>{const [a,b,cc]=sd;ctx.save();ctx.beginPath();ctx.rect(a,Y0,b-a,Y1-Y0);ctx.clip();
      ctx.fillStyle=cc.dry?PAL['card2']:PAL['cv-water'];ctx.fillRect(a,Y0,b-a,Y1-Y0);
      // paper texture: droplets on wet, fibers on dry
      const rg=BioLab.h.rng(sd[3]==='L'?3:9);
      for(let i=0;i<70;i++){const x=a+rg()*(b-a),y=Y0+rg()*(Y1-Y0);if(cc.dry){ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+6*rg()-3,y+6*rg()-3);ctx.stroke();}
        else{ctx.fillStyle=PAL['cv-bstroke'];ctx.globalAlpha=.45;ctx.beginPath();ctx.arc(x,y,1.5+rg()*2.5,0,6.29);ctx.fill();ctx.globalAlpha=1;}}
      if(hon&&cc.T!==20){ctx.fillStyle=cc.T<20?'rgba(60,130,230,'+clamp((20-cc.T)/60,0,.22)+')':'rgba(230,90,40,'+clamp((cc.T-20)/60,0,.22)+')';ctx.fillRect(a,Y0,b-a,Y1-Y0);}
      ctx.restore();});
    // bugs (drawn before the dark covers, so covered bugs look shaded)
    for(const b of s.bugs){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.th);
      const wig=b.v>0&&!RM?Math.sin(t*25+b.ph)*1.6:0;
      ctx.strokeStyle='#4b4652';ctx.lineWidth=1.2;for(let i=-2;i<=2;i++){const lx=i*3.6;ctx.beginPath();ctx.moveTo(lx,-6);ctx.lineTo(lx+wig,-9);ctx.moveTo(lx,6);ctx.lineTo(lx-wig,9);ctx.stroke();}
      ctx.fillStyle=b.rest?'#6e6977':'#5d5866';ctx.beginPath();ctx.ellipse(0,0,13,7.5,0,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.stroke();
      ctx.strokeStyle='#8f8a99';ctx.lineWidth=1;for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(i*3.4,-6.6);ctx.quadraticCurveTo(i*3.4+1.2,0,i*3.4,6.6);ctx.stroke();}
      ctx.fillStyle='#4b4652';ctx.beginPath();ctx.ellipse(13,0,3,4.5,0,0,6.29);ctx.fill();
      ctx.strokeStyle='#4b4652';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(15,-2);ctx.lineTo(21,-6);ctx.moveTo(15,2);ctx.lineTo(21,6);ctx.stroke();ctx.restore();}
    // light / dark covers
    [[X0,MID,cL],[MID,X1,cR]].forEach(sd=>{const [a,b,cc]=sd;if(!cc.light){ctx.fillStyle='rgba(15,15,25,.32)';ctx.fillRect(a,Y0,b-a,Y1-Y0);}
      else{const cx=(a+b)/2;ctx.fillStyle='rgba(255,220,90,.10)';ctx.fillRect(a,Y0,b-a,Y1-Y0);ctx.strokeStyle='#e0a400';ctx.lineWidth=2;for(let i=0;i<8;i++){const an=i*0.785;ctx.beginPath();ctx.moveTo(cx+Math.cos(an)*9,Y0-12+Math.sin(an)*9);ctx.lineTo(cx+Math.cos(an)*14,Y0-12+Math.sin(an)*14);ctx.stroke();}ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.arc(cx,Y0-12,6,0,6.29);ctx.fill();}});
    // walls with the doorway
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=5;rr(ctx,X0,Y0,X1-X0,Y1-Y0,18);ctx.stroke();
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(MID,Y0);ctx.lineTo(MID,DY0);ctx.moveTo(MID,DY1);ctx.lineTo(MID,Y1);ctx.stroke();ctx.lineCap='butt';
    pill(ctx,'doorway',MID,DY0-14,PAL['card'],PAL['cv-soft'],11*k);
    // side labels
    const lab=cc=>(cc.dry?'Dry':'Wet')+' · '+(cc.light?'light':'dark')+(hon?' · '+cc.T+' °C':'');
    txt(ctx,'Left: '+lab(cL),X0+(MID-X0)/2,Y1+22,{s:13*k,w:700,a:'center'});txt(ctx,'Right: '+lab(cR),MID+(X1-MID)/2,Y1+22,{s:13*k,w:700,a:'center'});
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X1-125,Y1+44);ctx.lineTo(X1,Y1+44);ctx.stroke();txt(ctx,'5 cm',X1-62,Y1+40,{s:11.5*k,a:'center',c:PAL['cv-soft']});
  },
  tour:[
    {title:'The choice chamber',text:'Two sides joined by a doorway. Pill bugs can walk anywhere. Each side gets its own conditions: wet or dry filter paper, covered or uncovered.',focus:[X0-8,Y0-8,X1-X0+16,Y1-Y0+16],pause:true},
    {title:'Two different conditions',text:'Here the left side has wet paper and the right side has dry paper. Both are covered, so light is not a difference. Only one variable differs between the sides.',focus:[X0-4,Y0-4,MID-X0+8,Y1-Y0+40],pause:true},
    {title:'Random wandering',text:'Each bug walks, turns, and stops to rest at random. Pill bugs can’t see or smell the far side of the chamber, so they are not steering toward anything.',focus:[X0-8,Y0-8,X1-X0+16,Y1-Y0+16],speed:0.3},
    {title:'Faster where it’s unpleasant',text:'On the dry side, bugs <b>move faster and turn more often</b>, and they rarely stop. On the wet side they slow down and rest. Watch the right side.',focus:[MID-4,Y0-4,X1-MID+8,Y1-Y0+8],speed:0.3},
    {title:'They pile up on the good side',text:'Bugs that slow down and rest stay put, while restless ones keep moving until they happen to reach the wet side. Over a few minutes most end up there.',focus:[X0-8,Y0-8,X1-X0+16,Y1-Y0+16],speed:2},
    {title:'Counting',text:'Every 30 seconds, count the bugs on each side. Ten minutes gives 21 counts, which make the graph and the data table.',focus:[X0,14,X1-X0,64],speed:2},
    {lvl:'honors',title:'Kinesis or taxis?',text:'<b>Taxis</b> is moving straight toward or away from a stimulus. <b>Kinesis</b> is changing speed or turning rate depending on conditions, without a direction. Compare the two speed readouts: this is kinesis.',focus:[X0-8,Y0-8,X1-X0+16,Y1-Y0+16],pause:true},
    {lvl:'ap',title:'Is it more than chance?',text:'The null hypothesis says the bugs don’t care, so you expect a 50:50 split. Chi-square compares your counts with that. With 1 degree of freedom, χ² above 3.84 means p < 0.05: reject the null.',focus:[X0,14,X1-X0,64],pause:true}
  ],
  lab:{bio:'<p><b>Question:</b> Do pill bugs prefer wet or dry places?</p><ol><li>Set the left side wet and the right side dry, with both covered.</li><li>Run the full 10 minutes, then record a trial.</li><li>Release the bugs again and repeat twice more.</li><li>Plot your trials and find the average percent on the wet side.</li></ol><p>Write a claim and support it with your counts. What variable did you keep the same on both sides?</p>',
       honors:'<p><b>Question:</b> Which matters more to pill bugs: moisture or light?</p><ol><li>Make the left side wet but light, and the right side dry but dark.</li><li>Run 10 minutes and record a trial, then repeat 3 times.</li><li>Compare the speed readouts for the two sides.</li></ol><p>Explain your result as kinesis, using the speed data as evidence.</p>',
       ap:'<p><b>Question:</b> Design a two-choice test of an environmental variable, then test it statistically.</p><ol><li>State your null and alternative hypotheses.</li><li>Run 10 minutes with 20 bugs and record χ²; repeat with 10 and 40 bugs.</li><li>Compare the chi-square decisions.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain how sample size changes your ability to detect a real preference.</p>'},
  terms:[{t:'Behavior',d:'What an animal does in response to its environment.'},{t:'Choice chamber',d:'A container with two connected sides that differ in one condition.'},{t:'Stimulus',d:'Something in the environment an animal responds to, like moisture or light.'},
    {lvl:'honors',t:'Kinesis',d:'Random movement whose speed or turning changes with conditions. It has no set direction.'},{lvl:'honors',t:'Taxis',d:'Movement directly toward or away from a stimulus.'},
    {lvl:'ap',t:'Null hypothesis',d:'The idea that there is no preference, so you expect a 50:50 split.'},{lvl:'ap',t:'Chi-square (χ²)',d:'Σ (observed − expected)² ÷ expected. Bigger values mean the counts are further from the null.'},{lvl:'ap',t:'Degrees of freedom',d:'Number of categories minus one: 1 for a two-sided chamber.'},{lvl:'ap',t:'Critical value',d:'3.84 for df = 1 at p = 0.05. A χ² above it means reject the null.'}],
  about:'<p>Each bug is a random walker. On each side its speed (8–29 cm/min), turning rate and chance of resting depend on how unpleasant that side is: dry, bright, or far from about 17 °C. Bugs never sense the other side or steer toward it. Their preference emerges only from moving more on the bad side and resting more on the good side. This is kinesis, which is how real isopods are thought to find damp places.</p><p>Simplified: no crowding (real isopods also clump together), no fatigue, and the conditions stay fixed for the whole trial. At the end, chi-square uses the average of the last four counts to smooth out bugs crossing the doorway.</p>',
  challenges:[
    {lvl:'bio',q:'The left side is wet and the right side is dry. Where will most pill bugs be after 10 minutes?',choices:['On the wet side','On the dry side','Split evenly'],correct:0,baseline:{n:30},changeText:'Bugs released',watch:'counts',
     explain:'Pill bugs breathe through gill-like structures that must stay moist. They lose water quickly in dry air, so they settle where it’s damp.'},
    {lvl:'bio',q:'Both sides are wet. The left side is uncovered (light), the right side is covered (dark). Where do most bugs end up?',choices:['In the light','In the dark','Split evenly'],correct:1,baseline:{n:30,Rm:'wet',Ll:'light'},changeText:'Bugs released',watch:'counts',
     explain:'Dark places are usually damp and hidden from predators, so pill bugs settle in the dark.'},
    {lvl:'bio',q:'Both sides are wet and dark. After 10 minutes, how are the bugs spread?',choices:['Roughly split between the two sides','Almost all on the left','Almost all on the right'],correct:0,baseline:{n:30,Rm:'wet'},changeText:'Bugs released',watch:'pct',
     explain:'With no difference between the sides, nothing makes the bugs slow down on one side, so they wander evenly. This is what the null hypothesis predicts.'},
    {lvl:'honors',instant:true,q:'Pill bugs end up on the wet side. Did they sense the wet side from across the chamber and walk straight to it?',choices:['Yes, that is taxis','No, they move faster and turn more when it’s dry, so they linger where it’s wet (kinesis)'],correct:1,
     explain:'In this chamber the bugs never point toward anything. Speeding up on the bad side and resting on the good side is enough to gather them. That is kinesis.'},
    {lvl:'honors',q:'Both sides are wet and dark. The left side is 15 °C and the right side is 30 °C. Where do most bugs end up?',choices:['The cooler side','The warmer side','Split evenly'],correct:0,baseline:{n:30,Rm:'wet',LT:15,RT:30},changeText:'Bugs released',watch:'counts',
     explain:'Warm air dries pill bugs out quickly, so they move restlessly at 30 °C and settle on the cool side.'},
    {lvl:'honors',q:'Wet left side, dry right side. After 3 minutes, how do the bugs on the dry side move compared with the wet side?',choices:['Faster','Slower','The same'],correct:0,reveal:3,changeText:'Bugs released',watch:'speed',
     explain:'Compare the speed readouts. Bugs on the dry side move several times faster and almost never rest. That speed difference is the kinesis that sorts them.'},
    {lvl:'ap',q:'40 bugs, wet left side and dry right side. At the end, is the preference significant at p = 0.05?',choices:['Yes, χ² is above 3.84, so reject the null hypothesis','No, χ² is below 3.84'],correct:0,baseline:{n:40},changeText:'Bugs released',watch:'counts',
     explain:'About 80% of the bugs end on the wet side. That is far from the 20:20 the null predicts, so χ² comes out well above 3.84.'},
    {lvl:'ap',instant:true,q:'With 10 bugs you count 7 on the wet side and 3 on the dry side. What is χ², and is it significant?',choices:['χ² = 1.6, not significant','χ² = 1.6, significant','χ² = 4.0, significant'],correct:0,
     explain:'Expected is 5 and 5. χ² = (7−5)²/5 + (3−5)²/5 = 0.8 + 0.8 = 1.6, below 3.84. Even a 70:30 split can be chance with so few bugs, so larger samples are more convincing.'}
  ],
  thumbFrames:60
};
BioLab.register(SIM);
})();
