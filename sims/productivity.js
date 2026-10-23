(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,RM,fmtNum}=BioLab.h;

/* Light/dark bottle model. Rates in mg O2 per liter per hour. */
const ALG={low:0.5,med:1,high:2};
function satDO(T){return 14.62-0.3898*T+0.006969*T*T-0.00005897*T*T*T;}
function photo(p,I){const fP=Math.pow(1.05,p.temp-20);return 0.25*ALG[p.nut]*fP*I/(I+30);}
function resp(p){const fR=Math.pow(1.072,p.temp-20);return 0.05*ALG[p.nut]*fR+0.01;}
/* default-condition numbers used in instant AP questions */
const DEF={light:100,nut:'med',temp:20};
const P100=photo(DEF,100),P50=photo(DEF,50),R0=resp(DEF);
const GPP0=P100*24,NPP0=(P100-R0)*24;

function shadeT(sim){return atLeast('honors')?sim.p.screen/100:0.5;}
const SIM={
  id:'productivity',hash:'productivity',apUnit:8,order:1,tab:'Primary productivity lab',kind:'Virtual lab',
  next:['energy','photosynthesis'],
  card:'The light and dark bottle lab. Incubate lake water for 24 hours and calculate gross and net productivity from dissolved oxygen.',
  title:'Primary productivity: the light and dark bottle lab',
  lede:{bio:'Algae make oxygen when they photosynthesize and use it when they respire. Seal lake water in a clear bottle and a foil-wrapped bottle, wait 24 hours, and measure the oxygen.',
        honors:'Measure dissolved oxygen in light, shaded and dark bottles, then calculate gross primary productivity, net primary productivity and respiration.',
        ap:'Run the APES productivity lab. Calculate GPP, NPP and respiration from dissolved oxygen, convert oxygen to carbon, and find where light saturates photosynthesis.'},
  scale:'Real lab scale: 300 mL BOD bottles of pond water. Each green dot stands for millions of single-celled algae.',
  timeScale:2,dtMax:0.05,prewarm:0,sampleDt:0.25,window:24,unit:'h',timeLabel:'Incubation time',chChange:0.5,chReveal:24,
  controls:[
    {id:'light',label:'Light reaching the bottles',type:'range',min:0,max:100,step:5,def:100,unit:'%',lvl:'bio'},
    {id:'nut',label:'Nutrients in the water',type:'seg',def:'med',lvl:'bio',options:[{v:'low',l:'Low'},{v:'med',l:'Medium'},{v:'high',l:'High'}],help:'More nitrogen and phosphorus means more algae.'},
    {id:'temp',label:'Water bath temperature',type:'range',min:5,max:30,step:1,def:20,unit:' °C',lvl:'honors',onChange(sim){if(sim.st&&sim.st.h<0.05){const d=0.9*satDO(sim.p.temp);sim.st.doI=d;sim.st.doL=d;sim.st.doD=d;sim.st.doS=d;}}},
    {id:'screen',label:'Shade screen lets through',type:'range',min:10,max:90,step:5,def:50,unit:'%',lvl:'honors',help:'Mesh screens on the third bottle copy deeper, dimmer water.'}
  ],
  init(sim){const d=0.9*satDO(sim.p.temp);return {h:0,doI:d,doL:d,doD:d,doS:d,pL:0,pS:0,r:0,done:false};},
  step(sim,dt){const s=sim.st,p=sim.p;if(s.h>=24){s.done=true;return;}
    const h=Math.min(dt,24-s.h);const I=p.light;s.pL=photo(p,I);s.pS=photo(p,I*shadeT(sim));s.r=resp(p);
    s.doL=Math.max(0,s.doL+(s.pL-s.r)*h);s.doS=Math.max(0,s.doS+(s.pS-s.r)*h);s.doD=Math.max(0,s.doD-s.r*h);s.h+=h;},
  metrics:[
    {id:'doi',label:'Initial bottle DO',unit:'mg/L',lvl:'bio',min:0,max:16,d:2,get:s=>s.st.doI},
    {id:'dol',label:'Light bottle DO',unit:'mg/L',lvl:'bio',min:0,max:16,d:2,get:s=>s.st.doL},
    {id:'dod',label:'Dark bottle DO',unit:'mg/L',lvl:'bio',min:0,max:16,d:2,get:s=>s.st.doD},
    {id:'dos',label:'Shaded bottle DO',unit:'mg/L',lvl:'honors',min:0,max:16,d:2,get:s=>s.st.doS},
    {id:'gpp',label:'GPP (light − dark)',unit:'mg O₂/L/day',lvl:'honors',min:0,max:12,d:2,get:s=>s.st.h<2?NaN:(s.st.doL-s.st.doD)*24/s.st.h},
    {id:'npp',label:'NPP (light − initial)',unit:'mg O₂/L/day',lvl:'honors',min:-4,max:10,d:2,get:s=>s.st.h<2?NaN:(s.st.doL-s.st.doI)*24/s.st.h},
    {id:'rr',label:'Respiration (initial − dark)',unit:'mg O₂/L/day',lvl:'honors',min:0,max:6,d:2,get:s=>s.st.h<2?NaN:(s.st.doI-s.st.doD)*24/s.st.h},
    {id:'gppc',label:'GPP as carbon',unit:'mg C/m³/day',lvl:'ap',min:0,max:5000,d:0,get:s=>s.st.h<2?NaN:(s.st.doL-s.st.doD)*24/s.st.h*0.375*1000}
  ],
  graphs:[
    {id:'do',label:'Dissolved oxygen in each bottle',lvl:'bio',lines:['dol','dod','doi'],yl:'Dissolved oxygen (mg/L)'},
    {id:'do3',label:'All four bottles',lvl:'honors',lines:['dol','dos','dod','doi'],yl:'Dissolved oxygen (mg/L)'},
    {id:'rates',label:'GPP, NPP and respiration',lvl:'honors',lines:['gpp','npp','rr'],yl:'mg O₂/L/day'}
  ],
  defaultGraph:'do',
  challenges:[
    {lvl:'bio',q:'After 24 hours in the foil-wrapped (dark) bottle, what happens to the dissolved oxygen?',choices:['It goes up','It goes down','It stays the same'],correct:1,
     change:{},changeText:'Bottles sealed and incubating',watch:'do',
     explain:'In the dark, algae cannot photosynthesize, but they and the bacteria with them keep respiring. Respiration only uses oxygen, so the dark bottle always loses O₂.'},
    {lvl:'bio',q:'Halfway through, the lamp is switched off. What happens to the oxygen in the clear (light) bottle?',choices:['It keeps rising at the same rate','It starts dropping, like the dark bottle','It jumps to zero'],correct:1,
     baseline:{light:100},change:{light:0},at:12,changeText:'Lamp switched off at 12 hours',watch:'do',
     explain:'With no light, the clear bottle is no different from the foil bottle. Photosynthesis stops, respiration continues, and dissolved oxygen slowly falls.'},
    {lvl:'honors',q:'After 24 hours, which is larger: gross primary productivity (GPP) or net primary productivity (NPP)?',choices:['GPP','NPP','They are equal'],correct:0,
     change:{},changeText:'Incubating',watch:'rates',
     explain:'GPP is all the oxygen the algae made. NPP is what is left after their own respiration (NPP = GPP − R). Because algae always respire, NPP is smaller than GPP.'},
    {lvl:'honors',q:'The water bath warms from 20 °C to 30 °C. What happens to the oxygen in the dark bottle?',choices:['It drops faster','It drops more slowly','It starts rising'],correct:0,
     baseline:{temp:20},change:{temp:30},changeText:'Water bath raised to 30 °C',watch:'do',
     explain:'Respiration is run by enzymes that speed up with temperature (roughly doubling every 10 °C). Warm water also holds less oxygen to start with, which is why warm lakes are at risk of running low.'},
    {lvl:'ap',q:`At 50% light, GPP is ${(P50*24).toFixed(2)} mg O₂/L/day. If you double the light to 100%, what will GPP be?`,choices:[`${(P50*48).toFixed(2)}, double`,`${(P100*24).toFixed(2)}, less than double`,`${(P50*24).toFixed(2)}, unchanged`],correct:1,instant:true,
     explain:`Photosynthesis saturates. As light rises, the algae’s enzymes and pigments become the limit, so GPP rises from ${(P50*24).toFixed(2)} to only ${(P100*24).toFixed(2)} mg O₂/L/day. Record trials from 0% to 100% light to see the curve flatten.`},
    {lvl:'ap',q:`A lake’s GPP is ${GPP0.toFixed(2)} mg O₂/L/day. Using 0.375 mg C per mg O₂, what is its GPP in mg C/m³/day?`,choices:[`${Math.round(GPP0*0.375*1000).toLocaleString()} mg C/m³/day`,`${Math.round(GPP0*1000).toLocaleString()} mg C/m³/day`,`${(GPP0*0.375).toFixed(2)} mg C/m³/day`,`${Math.round(GPP0/0.375*1000).toLocaleString()} mg C/m³/day`],correct:0,instant:true,
     explain:`${GPP0.toFixed(2)} mg O₂/L × 0.375 = ${(GPP0*0.375).toFixed(2)} mg C/L. There are 1,000 L in a cubic meter, so that is ${Math.round(GPP0*0.375*1000).toLocaleString()} mg C/m³/day. The 0.375 comes from 12 g of carbon per 32 g of O₂ in photosynthesis.`},
    {lvl:'ap',q:'Fertilizer runoff raises the nutrients from medium to high. What happens to GPP?',choices:['It rises, because more algae grow','It falls','No change'],correct:0,
     baseline:{nut:'med'},change:{nut:'high'},changeText:'Nutrients raised to high',watch:'rates',
     explain:'Nitrogen and phosphorus are limiting nutrients in most lakes. More nutrients means more algae, so both GPP and respiration rise. That is the first step of eutrophication.'}
  ],
  initVis(sim){const r=rng(41),v=sim.vis;v.alg=[];for(let i=0;i<60;i++)v.alg.push([r(),r(),r()*6.28]);v.ox=[];for(let i=0;i<70;i++)v.ox.push([r(),r(),r()*6.28]);v.spark=[];v.acc={L:0,S:0};},
  draw(sim,ctx,vdt,k,t){
    const s=sim.st,p=sim.p,hon=atLeast('honors'),v=sim.vis,R=Math.random;
    ctx.fillStyle=PAL['card'];ctx.fillRect(0,0,800,450);
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,388,800,62);
    // lamp bank and light
    const Lf=p.light/100;ctx.fillStyle=PAL['cv-lamp'];rr(ctx,170,22,600,22,6);ctx.fill();
    ctx.fillStyle=Lf>0?'rgba(255,226,120,'+(0.35+0.65*Lf)+')':PAL['line'];rr(ctx,180,40,580,8,4);ctx.fill();
    if(Lf>0){const g=ctx.createLinearGradient(0,48,0,380);g.addColorStop(0,'rgba(255,214,90,'+(0.32*Lf)+')');g.addColorStop(1,'rgba(255,214,90,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(180,48);ctx.lineTo(760,48);ctx.lineTo(780,380);ctx.lineTo(160,380);ctx.closePath();ctx.fill();}
    txt(ctx,'Lamp: '+p.light+'% light',178,16,{s:12*k,w:600,c:PAL['cv-soft']});
    // water bath
    ctx.fillStyle=PAL['cv-water'];ctx.globalAlpha=.55;ctx.fillRect(160,150,610,236);ctx.globalAlpha=1;
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(160,140);ctx.lineTo(160,386);ctx.lineTo(770,386);ctx.lineTo(770,140);ctx.stroke();
    txt(ctx,'Water bath '+p.temp+' °C',168,166,{s:12*k,w:600,c:PAL['cv-soft']});
    // bottles
    const bottles=[{key:'I',x:78,lab:'Initial',sub:'measured at 0 h',val:s.doI,kind:'init'},{key:'L',x:hon?280:330,lab:'Light',sub:'clear glass',val:s.doL,kind:'light',P:s.pL},
      ...(hon?[{key:'S',x:460,lab:'Shaded',sub:Math.round(shadeT(sim)*100)+'% light',val:s.doS,kind:'shade',P:s.pS}]:[]),{key:'D',x:hon?640:580,lab:'Dark',sub:'wrapped in foil',val:s.doD,kind:'dark'}];
    const algN=Math.round(ALG[p.nut]*18);
    bottles.forEach(b=>{const x=b.x,y=192,w=86,h=146;
      // neck & stopper
      ctx.fillStyle=PAL['cv-glass'];ctx.globalAlpha=.5;ctx.fillRect(x-12,y-34,24,36);ctx.globalAlpha=1;ctx.fillStyle=PAL['cv-lamp'];rr(ctx,x-14,y-46,28,14,4);ctx.fill();
      // body
      rr(ctx,x-w/2,y,w,h,22);ctx.fillStyle=PAL['cv-water'];ctx.fill();
      ctx.save();rr(ctx,x-w/2,y,w,h,22);ctx.clip();
      ctx.fillStyle='rgba(60,150,70,'+(0.08+0.06*ALG[p.nut])+')';ctx.fillRect(x-w/2,y,w,h);
      for(let i=0;i<algN;i++){const a=v.alg[i];const ax=x-w/2+8+a[0]*(w-16)+(RM?0:Math.sin(t*.7+a[2])*2),ay=y+10+a[1]*(h-20);ctx.fillStyle=PAL['cv-leaf'];ctx.beginPath();ctx.arc(ax,ay,3.2,0,6.29);ctx.fill();}
      const nO=clamp(Math.round(b.val*4),0,70);ctx.fillStyle=PAL['cv-bubble'];ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1;
      for(let i=0;i<nO;i++){const o=v.ox[i];const ox=x-w/2+6+o[0]*(w-12)+(RM?0:Math.sin(t*1.3+o[2])*2.5),oy=y+8+o[1]*(h-16)+(RM?0:Math.cos(t*1.1+o[2])*2.5);ctx.beginPath();ctx.arc(ox,oy,2.4,0,6.29);ctx.fill();ctx.stroke();}
      ctx.restore();
      if(b.kind==='dark'){ctx.save();rr(ctx,x-w/2,y,w,h,22);ctx.clip();ctx.fillStyle='#9aa3ad';ctx.fillRect(x-w/2,y,w,h);ctx.strokeStyle='#c9d0d8';ctx.lineWidth=1.5;
        for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(x-w/2,y+12+i*16);ctx.lineTo(x-w/2+20,y+20+i*16);ctx.lineTo(x,y+8+i*16);ctx.lineTo(x+20,y+22+i*16);ctx.lineTo(x+w/2,y+10+i*16);ctx.stroke();}ctx.restore();
        txt(ctx,'foil',x,y+h/2,{s:13*k,w:700,c:'#1e2329',a:'center',b:'middle'});}
      if(b.kind==='shade'){ctx.save();rr(ctx,x-w/2,y,w,h,22);ctx.clip();ctx.strokeStyle='rgba(40,40,40,'+(0.6*(1-shadeT(sim)))+')';ctx.lineWidth=1.2;
        for(let i=-10;i<20;i++){ctx.beginPath();ctx.moveTo(x-w/2+i*8,y);ctx.lineTo(x-w/2+i*8+60,y+h);ctx.stroke();ctx.beginPath();ctx.moveTo(x+w/2-i*8,y);ctx.lineTo(x+w/2-i*8-60,y+h);ctx.stroke();}ctx.restore();}
      ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;rr(ctx,x-w/2,y,w,h,22);ctx.stroke();
      // O2 production sparkles in proportion to photosynthesis
      if(b.P&&vdt>0){v.acc[b.key]+=b.P*sim.def.timeScale*vdt*6;while(v.acc[b.key]>=1){v.acc[b.key]--;v.spark.push({x:x-w/2+12+R()*(w-24),y:y+20+R()*(h-40),life:.8});}}
      // probe readout
      pill(ctx,'DO '+b.val.toFixed(1)+' mg/L',x,y-62,PAL['cv-ink'],PAL['card'],12*k);
      txt(ctx,b.lab,x,y+h+20,{s:14*k,w:700,a:'center',c:b.kind==='init'?PAL['cv-ink']:PAL['cv-ink']});
      txt(ctx,b.sub,x,y+h+36,{s:11.5*k,a:'center',c:PAL['cv-soft']});});
    for(const sp of v.spark){sp.life-=vdt;sp.y-=10*vdt;ctx.globalAlpha=clamp(sp.life/0.8,0,1);ctx.fillStyle=PAL['s6'];txt(ctx,'O₂',sp.x,sp.y,{s:10*k,w:700,c:PAL['s6'],a:'center'});}
    ctx.globalAlpha=1;v.spark=v.spark.filter(q=>q.life>0);if(v.spark.length>60)v.spark.splice(0,v.spark.length-60);
    // incubation clock
    const frac=clamp(s.h/24,0,1);ctx.strokeStyle=PAL['line'];ctx.lineWidth=7;ctx.beginPath();ctx.arc(60,80,28,0,6.29);ctx.stroke();
    ctx.strokeStyle=PAL['s1'];ctx.beginPath();ctx.arc(60,80,28,-Math.PI/2,-Math.PI/2+frac*6.283);ctx.stroke();
    txt(ctx,s.h.toFixed(0)+' h',60,82,{s:14*k,w:700,a:'center',b:'middle'});txt(ctx,s.done?'Done':'of 24 h',60,124,{s:11.5*k,a:'center',c:PAL['cv-soft']});
    // equations
    if(hon&&s.h>=2){const g=(s.doL-s.doD),n=(s.doL-s.doI),r=(s.doI-s.doD);
      txt(ctx,'GPP = light − dark = '+g.toFixed(2)+'   ·   NPP = light − initial = '+n.toFixed(2)+'   ·   R = initial − dark = '+r.toFixed(2)+' mg/L',400,425,{s:12.5*k,w:600,a:'center'});}
    else txt(ctx,s.h<2?'Bottles are sealed. Oxygen can’t get in or out.':'Compare each bottle with the initial bottle.',400,425,{s:13*k,w:600,a:'center',c:PAL['cv-soft']});
  },
  narrate(sim){const s=sim.st,p=sim.p,hon=atLeast('honors');
    if(s.h<0.6)return 'Fresh lake water was poured into every bottle, so they all start at <b>'+s.doI.toFixed(1)+' mg/L</b> of dissolved oxygen. The initial bottle is measured now as the baseline.';
    if(s.done)return '<b>Incubation done.</b> The light bottle ended at '+s.doL.toFixed(2)+' mg/L and the dark bottle at '+s.doD.toFixed(2)+' mg/L.'+(hon?' GPP = '+(s.doL-s.doD).toFixed(2)+' mg O₂/L per day.':' The difference is the oxygen made by photosynthesis.');
    if(p.light===0)return '<b>The lamp is off.</b> Without light, no bottle can photosynthesize, so every bottle is losing oxygen to respiration.';
    const net=s.pL-s.r;
    if(net<0)return 'There is so little light that the algae use oxygen faster than they make it. Even the clear bottle is <b>losing</b> oxygen. The algae are below their compensation point.';
    return 'In the clear bottle, algae make oxygen by photosynthesis ('+(s.pL*24).toFixed(1)+' mg/L per day) faster than they use it ('+(s.r*24).toFixed(1)+'), so O₂ rises. In the foil bottle they can only <b>respire</b>, so O₂ falls.';},
  tour:[
    {title:'Collect the water',text:'Pond or lake water holds microscopic algae. It is poured into identical sealed bottles, so no oxygen can get in or out.',focus:[20,130,750,260],speed:0.3},
    {title:'The initial bottle',text:'One bottle is measured right away with a dissolved oxygen (DO) probe. This is the starting value every other bottle is compared with.',focus:[28,120,104,268],speed:0.3},
    {title:'The light bottle',text:'In the clear bottle, algae photosynthesize and respire at the same time. Watch the O₂ labels appear as photosynthesis adds oxygen.',focus(sim){const x=atLeast('honors')?280:330;return [x-56,120,112,268];},speed:0.5},
    {title:'The dark bottle',text:'The foil-wrapped bottle gets no light. Algae there can only respire, so its oxygen only goes down.',focus(sim){const x=atLeast('honors')?640:580;return [x-56,120,112,268];},speed:0.5},
    {lvl:'honors',title:'The shaded bottle',text:'Mesh screens let only part of the light through, like water a few meters deeper. Photosynthesis slows, but respiration does not.',focus:[404,120,112,268],speed:0.5},
    {title:'Wait 24 hours',text:'The bottles incubate for a full day. The clock shows how long they have been sealed.',focus:[20,40,90,100],speed:4},
    {lvl:'honors',title:'Do the math',text:'Light − dark = GPP, all the oxygen photosynthesis made. Light − initial = NPP, what is left after respiration. Initial − dark = respiration.',focus:[20,400,760,44],pause:true},
    {lvl:'ap',title:'From oxygen to carbon',text:'Multiply mg O₂/L by 0.375 to get mg of carbon fixed, then by 1,000 for a cubic meter. NPP is the energy available to the next trophic level, and only about 10% of it passes up each level.',focus:[20,400,760,44],pause:true}
  ],
  onTourExit(sim){},
  lab:{bio:'<p><b>Question:</b> How does light affect the oxygen made by algae?</p><ol><li>Set light to 100% and press Reset. Wait for 24 hours, then Record trial.</li><li>Repeat at 75, 50, 25 and 0% light.</li><li>Plot light (x) against light bottle DO (y).</li></ol><p>Explain why the dark bottle always ends lower than the initial bottle.</p>',
       honors:'<p><b>Question:</b> How does light intensity affect GPP and NPP?</p><ol><li>Run 24-hour trials at 100, 75, 50, 25 and 10% light. Press Reset before each run.</li><li>Record GPP, NPP and respiration for each.</li><li>Plot light (x) against GPP and NPP (y).</li></ol><p>At what light level is NPP zero? What does that mean for algae deep in a lake?</p>',
       ap:'<p><b>Question:</b> How do light and nutrients control a lake’s productivity?</p><ol><li>Collect GPP at 0–100% light with medium nutrients, then repeat with high nutrients.</li><li>Convert each GPP to mg C/m³/day.</li><li>Estimate where light saturates photosynthesis.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain how nutrient runoff can raise productivity yet lead to low oxygen in a lake.</p>'},
  terms:[{t:'Dissolved oxygen (DO)',d:'Oxygen gas dissolved in water, measured in mg/L.'},{t:'Photosynthesis',d:'Uses light to make sugar and releases O₂.'},{t:'Respiration',d:'Breaks down sugar for energy and uses O₂. Happens day and night.'},
    {lvl:'honors',t:'Gross primary productivity (GPP)',d:'The total rate of photosynthesis: light bottle − dark bottle.'},{lvl:'honors',t:'Net primary productivity (NPP)',d:'GPP minus the producers’ own respiration: light bottle − initial bottle. It is the energy available to consumers.'},
    {lvl:'ap',t:'Light saturation',d:'The point where more light no longer raises photosynthesis much.'},{lvl:'ap',t:'Limiting nutrient',d:'The nutrient in shortest supply, often phosphorus in lakes, which sets how much algae can grow.'}],
  about:'<p>Each bottle’s dissolved oxygen changes by (photosynthesis − respiration) every hour. Photosynthesis = 0.25 × algae × 1.05^(T−20) × I/(I + 30) mg O₂/L/h, where I is light in %. It rises with light but levels off. Respiration = 0.05 × algae × 1.072^(T−20) + 0.01 mg/L/h, which includes bacteria and roughly doubles every 10 °C. Algae density is 0.5, 1 or 2 for low, medium or high nutrients.</p><p>The bottles start at 90% of oxygen saturation for the water temperature. Simplified: algae do not grow during the 24 hours, light is the same all day (no night), and the probe reads perfectly. Real data are noisier.</p>',
  thumbFrames:30
};
BioLab.register(SIM);
})();
