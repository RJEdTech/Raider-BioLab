(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,lvText}=BioLab.h;

/* pGLO bacterial transformation (CaCl₂ / heat-shock method).
   Expected transformants on each +pGLO ampicillin plate: λ = EFF × f(heat shock) × DNA spread.
   EFF = 800 transformants per µg; f(t) = 0.1 + 0.9·e^(−((t − 50)/25)²) for heat-shock time t (s).
   DNA spread = 10 µL × 0.08 µg/µL × (volume spread ÷ 510 µL total). Counts are Poisson-random.
   Colonies become visible about 12 h into incubation at 37 °C and keep growing to 48 h.
   GFP is made only when arabinose switches on the araC/pBAD promoter. */
const EFF=800,TOTAL=510,DNA=0.8;
const STEPS=[
  {t:'Label two tubes: +pGLO and −pGLO',where:'rack'},
  {t:'Add 250 µL ice-cold CaCl₂ to both tubes',where:'rack'},
  {t:'Add E. coli colonies to both tubes',where:'rack'},
  {t:'Add 10 µL pGLO plasmid to +pGLO only',where:'rack'},
  {t:'Ice for 10 minutes',where:'ice'},
  {t:'Heat shock: 42 °C water bath',where:'bath'},
  {t:'Back on ice for 2 minutes',where:'ice'},
  {t:'Add 250 µL LB broth; recover 10 min',where:'rack'},
  {t:'Spread 100 µL on each of 4 plates',where:'rack'},
  {t:'Incubate at 37 °C for 24–48 h',where:'rack'}];
const PLATES=[{n:'LB',sub:'−pGLO',amp:false,ara:false,plus:false},{n:'LB/amp',sub:'−pGLO',amp:true,ara:false,plus:false},{n:'LB/amp',sub:'+pGLO',amp:true,ara:false,plus:true},{n:'LB/amp/ara',sub:'+pGLO',amp:true,ara:true,plus:true}];
function shockF(t){return 0.1+0.9*Math.exp(-Math.pow((t-50)/25,2));}
function dnaSpread(p){return DNA*(p.vol/TOTAL);}
function poisson(l,r){if(l<=0)return 0;if(l<30){let L=Math.exp(-l),k=0,pp=1;do{k++;pp*=r();}while(pp>L);return k-1;}return Math.max(0,Math.round(l+Math.sqrt(l)*randn(r)));}
function plateNow(sim){const s=sim.st,p=sim.p,r=rng(s.seed);const lam=p.plasmid?EFF*shockF(p.shock)*dnaSpread(p):0;s.lam=lam;
  s.plates=PLATES.map((pl,i)=>{const lawn=!pl.amp;const n=pl.amp?(pl.plus?poisson(lam,r):0):0;const pos=[];for(let j=0;j<Math.min(n,400);j++){const a=r()*6.283,d=Math.sqrt(r())*0.88;pos.push([Math.cos(a)*d,Math.sin(a)*d,0.7+r()*0.6]);}
    const lawnDots=[];if(lawn)for(let j=0;j<260;j++){const a=r()*6.283,d=Math.sqrt(r())*0.92;lawnDots.push([Math.cos(a)*d,Math.sin(a)*d]);}return {n,pos,lawn,lawnDots};});}
function goTo(sim,k,hours){const s=sim.st;s.stage=k;s.anim=1;s.auto=false;if(k>=8&&!s.plates)plateNow(sim);if(k<8){s.plates=null;s.h=0;}if(hours!==undefined)s.h=hours;}
function advance(sim){const s=sim.st;if(s.stage>=STEPS.length-1)return;s.stage++;s.anim=0;if(s.stage===8)plateNow(sim);}
function countOf(sim,i){const s=sim.st;if(!s.plates||s.h<16)return NaN;return s.plates[i].n;}

const TRANS={
  id:'transformation',hash:'transformation',apUnit:10,order:4,tab:'Bacterial transformation (pGLO)',kind:'Virtual lab',prereq:['plasmid'],
  card:'Give E. coli a new gene with heat shock, then plate it and see which bacteria grow and glow green.',
  title:'Bacterial transformation: the pGLO lab',
  lede:{bio:'Put a new gene into bacteria. The pGLO plasmid carries a gene for surviving ampicillin and a gene for a glowing green protein. Follow the steps, then check which plates grow and glow.',
        honors:'Work through the CaCl₂ and heat-shock procedure. Then use the four plates to separate what ampicillin does from what arabinose does, and calculate transformation efficiency.',
        ap:'Test how heat shock and the volume plated affect colony counts, and see why transformation efficiency (transformants per µg) stays the same when the plated volume changes.'},
  scale:'Real lab scale: 100 mm petri dishes. Each colony grew from a single cell into roughly 10⁸ cells in 24–36 hours. The pGLO plasmid is about 5,400 base pairs.',
  timeless:true,animated:true,chChange:0,chReveal:18,
  controls:[
    {id:'uv',label:'UV light',type:'toggle',def:false,lvl:'bio',help:'Shine UV on the plates to look for green glow'},
    {id:'plasmid',label:'Add plasmid to the +pGLO tube',type:'toggle',def:true,lvl:'honors',help:'Turn off to see what happens if you forget it'},
    {id:'shock',label:'Heat shock time',type:'range',min:0,max:120,step:5,def:50,unit:' s',lvl:'honors',help:'The protocol says 50 seconds at 42 °C'},
    {id:'vol',label:'Volume spread on each plate',type:'range',min:50,max:250,step:50,def:100,unit:' µL',lvl:'ap'}
  ],
  actions:[{id:'next',label:'Next step',primary:true,run(sim){sim.st.auto=false;advance(sim);}},
    {id:'runall',label:'Run whole procedure',run(sim){const s=sim.st;s.auto=true;if(s.stage>=9&&s.h>=48){goTo(sim,0);s.auto=true;}}},
    {id:'restart',label:'Start over',run(sim){BioLab.reset(sim);}}],
  init(sim){return {stage:0,anim:1,auto:false,h:0,plates:null,lam:0,timer:0,seed:(sim.st&&sim.st.seed||7)+1};},
  step(sim,dt){const s=sim.st;s.anim=Math.min(1,s.anim+dt/0.8);
    if(s.stage===9&&s.anim>=1&&s.h<48)s.h=Math.min(48,s.h+dt*8);
    if(s.auto&&s.stage<9&&s.anim>=1){s.timer+=dt;if(s.timer>0.25){s.timer=0;advance(sim);}}},
  metrics:[
    {id:'stepn',label:'Procedure',unit:'',lvl:'bio',text:true,get:s=>'Step '+(s.st.stage+1)+' of 10: '+STEPS[s.st.stage].t},
    {id:'hours',label:'Incubation time',unit:'h',lvl:'bio',min:0,max:48,d:0,get:s=>s.st.h},
    {id:'c3',label:'Colonies: LB/amp +pGLO',unit:'',lvl:'bio',min:0,max:300,d:0,get:s=>countOf(s,2)},
    {id:'c4',label:'Colonies: LB/amp/ara +pGLO',unit:'',lvl:'bio',min:0,max:300,d:0,get:s=>countOf(s,3)},
    {id:'glow',label:'Glowing under UV',unit:'',lvl:'bio',text:true,get:s=>{if(!s.p.uv)return 'UV light is off';if(!s.st.plates||s.st.h<18)return 'Nothing yet';return s.st.plates[3].n>0?'LB/amp/ara plate only':'None';}},
    {id:'lawn',label:'LB −pGLO plate',unit:'',lvl:'honors',text:true,get:s=>!s.st.plates||s.st.h<12?'—':'Lawn (solid growth)'},
    {id:'eff',label:'Transformation efficiency',unit:'per µg DNA',lvl:'honors',min:0,max:2000,d:0,get:s=>{const c=countOf(s,2);return Number.isFinite(c)?c/dnaSpread(s.p):NaN;}},
    {id:'dna',label:'DNA spread on each plate',unit:'µg',lvl:'ap',min:0,max:0.5,d:3,get:s=>dnaSpread(s.p)}
  ],
  graphs:[{id:'plates',label:'Colonies on each plate',custom:true}],defaultGraph:'plates',
  plot(sim,ctx,box){const s=sim.st;if(!s.plates||s.h<16){txt(ctx,'Plate and incubate to count colonies.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
    const vals=s.plates.map(pl=>pl.lawn?NaN:pl.n),mx=Math.max(50,...vals.filter(Number.isFinite))*1.25;
    const ax=axes(ctx,box,{xmin:0,xmax:4,ymin:0,ymax:mx,xcats:PLATES.map(p=>p.n+' '+p.sub),yl:'Colonies'});
    bars(ctx,ax,vals,{colors:[PAL['s6'],PAL['s2'],PAL['s2'],PAL['s3']]});
    s.plates.forEach((pl,i)=>{if(pl.lawn){ctx.fillStyle=PAL['s6'];ctx.globalAlpha=0.35;ctx.fillRect(ax.X(i+.2),ax.Y(mx),ax.X(i+.8)-ax.X(i+.2),ax.Y(0)-ax.Y(mx));ctx.globalAlpha=1;txt(ctx,'lawn',ax.X(i+.5),ax.Y(mx*0.5),{s:13,w:700,c:PAL['fg'],a:'center'});}});},
  narrate(sim){const s=sim.st,p=sim.p,hon=atLeast('honors'),k=s.stage;
    if(k===0)return 'Goal: get the <b>pGLO plasmid</b> into E. coli. It carries <b>bla</b> (makes the cells resistant to ampicillin) and <b>GFP</b> (green fluorescent protein, from a jellyfish). Press <b>Next step</b> to begin.';
    if(k===1)return hon?'Calcium ions (Ca²⁺) shield the negative charges on DNA and on the cell membrane, so the plasmid can get close to the cell surface.':'The calcium chloride solution helps DNA stick to the outside of the bacteria.';
    if(k===2)return 'Bacteria from a starter plate are mixed into both tubes. Only the +pGLO tube will get the plasmid. The −pGLO tube is the control.';
    if(k===3)return p.plasmid?'10 µL of plasmid DNA (0.08 µg/µL, so 0.8 µg) goes into the <b>+pGLO tube only</b>.':'<b>Oops: no plasmid was added.</b> The +pGLO tube now has nothing to take up.';
    if(k===4||k===6)return 'Ice keeps the membranes stiff and the cells still, so the sudden temperature jump in the next step has the biggest effect.';
    if(k===5)return p.shock<20?'<b>Heat shock skipped or too short.</b> Without the quick 42 °C pulse, very few cells take in the plasmid.':'<b>Heat shock: 42 °C for '+p.shock+' s.</b> The sudden temperature change opens tiny gaps in the membrane, and some cells take in the plasmid.'+(p.shock>90?' Too long, though, and the heat starts to kill cells.':'');
    if(k===7)return hon?'Recovery in LB broth lets transformed cells start making β-lactamase, the enzyme from the bla gene, before they meet ampicillin.':'The cells rest in nutrient broth so they can recover and start using their new gene.';
    if(k===8)return 'Each plate gets 100 µL of cells. Ampicillin kills any cell without the plasmid. Arabinose is a sugar that switches on the GFP gene.';
    if(s.h<12)return 'Incubating at 37 °C: '+s.h.toFixed(0)+' hours. Cells are dividing, but colonies are still too small to see.';
    const c3=countOf(sim,2),c4=countOf(sim,3);
    if(p.uv&&s.h>=18)return s.plates[3].n>0?'<b>Under UV light only the LB/amp/ara colonies glow green.</b> Every +pGLO colony has the GFP gene, but '+(hon?'the araC protein turns on the GFP gene only when arabinose is present.':'arabinose is needed to switch the gene on.'):'Nothing glows: no cells took in the plasmid.';
    if(s.h<16)return 'Colonies are appearing: each one started from a single cell.';
    return 'After '+s.h.toFixed(0)+' h: a <b>lawn</b> on LB −pGLO (no ampicillin, so everything grows), <b>none</b> on LB/amp −pGLO, and <b>'+c3+'</b> and <b>'+c4+'</b> colonies on the two +pGLO ampicillin plates. Turn on the UV light.';},
  draw(sim,ctx,vdt,k,t){k=Math.min(k,1.3);const s=sim.st,p=sim.p,hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,196,540,44);
    const where=STEPS[s.stage].where,a=s.anim;
    // ice bucket and water bath
    ctx.fillStyle='#7fa7c9';rr(ctx,206,128,124,70,10);ctx.fill();ctx.fillStyle='#e8f3fb';for(let i=0;i<9;i++){rr(ctx,214+(i%5)*22,120+Math.floor(i/5)*14+((i*7)%5),18,14,4);ctx.fill();}
    txt(ctx,'Ice',268,224,{s:12.5*k,w:700,a:'center'});
    ctx.fillStyle='#5a6270';rr(ctx,368,110,150,88,10);ctx.fill();ctx.fillStyle='#e9a23b';rr(ctx,378,122,130,52,6);ctx.fill();
    ctx.fillStyle='#14181d';rr(ctx,378,178,64,16,4);ctx.fill();txt(ctx,'42.0 °C',410,190,{s:11*k,w:700,c:'#ffb347',a:'center'});
    txt(ctx,'Water bath',443,224,{s:12.5*k,w:700,a:'center'});
    // tube rack + tubes
    ctx.fillStyle='#c9ccd2';rr(ctx,40,150,140,40,6);ctx.fill();txt(ctx,'Rack',110,224,{s:12.5*k,w:700,a:'center'});
    const home=[[80,92],[140,92]],dest=where==='ice'?[[240,74],[298,74]]:where==='bath'?[[414,68],[472,68]]:home;
    const prev=s.stage>0?STEPS[s.stage-1].where:'rack',src=prev==='ice'?[[240,74],[298,74]]:prev==='bath'?[[414,68],[472,68]]:home;
    ['+pGLO','−pGLO'].forEach((lab,i)=>{const e=a<1?a*a*(3-2*a):1,x=lerp(src[i][0],dest[i][0],e),y=lerp(src[i][1],dest[i][1],e)-Math.sin(e*Math.PI)*30;
      ctx.fillStyle='rgba(235,242,248,.95)';ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-13,y);ctx.lineTo(x+13,y);ctx.lineTo(x+10,y+58);ctx.quadraticCurveTo(x,y+72,x-10,y+58);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle=i===0?'#9a3445':'#3d5f8f';rr(ctx,x-15,y-10,30,12,3);ctx.fill();
      const lvl=s.stage>=7?0.85:s.stage>=1?0.45:0;if(lvl>0){const top=y+62-52*lvl;ctx.fillStyle=s.stage>=2?'rgba(214,196,150,.9)':'rgba(170,205,235,.8)';ctx.beginPath();ctx.moveTo(x-10+(1-lvl)*3,top);ctx.lineTo(x+10-(1-lvl)*3,top);ctx.lineTo(x+10,y+58);ctx.quadraticCurveTo(x,y+70,x-10,y+58);ctx.closePath();ctx.fill();}
      if(i===0&&s.stage>=3&&p.plasmid){for(let j=0;j<5;j++){ctx.strokeStyle='#27a35a';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(x-5+(j%3)*5,y+46-Math.floor(j/3)*8,2.6,0,6.29);ctx.stroke();}}
      txt(ctx,lab,x,y+86,{s:11.5*k,w:700,a:'center',c:PAL['cv-ink']});});
    if(where==='bath'&&a>0.6){pill(ctx,p.shock+' s at 42 °C',443,40,'#b5122d','#fff',12*k);}
    // step list
    const SX=548;ctx.fillStyle=PAL['card'];rr(ctx,SX,14,242,232,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,'Protocol',SX+12,34,{s:13*k,w:700});
    STEPS.forEach((st,i)=>{const y=56+i*19.5,done=i<s.stage||(i===s.stage&&i===9&&s.h>=48),cur=i===s.stage;
      if(cur){ctx.fillStyle='rgba(193,20,48,.12)';ctx.fillRect(SX+6,y-13,230,18);}
      txt(ctx,(done?'✓ ':(i+1)+'. ')+st.t,SX+12,y,{s:10.5*k,w:cur?700:400,c:done?PAL['cv-soft']:PAL['cv-ink']});});
    // plates
    const uv=p.uv,R=70;if(uv){ctx.fillStyle='rgba(30,10,70,.82)';rr(ctx,8,252,672,196,12);ctx.fill();txt(ctx,'UV light on',20,272,{s:12*k,w:700,c:'#c9b8ff'});}
    PLATES.forEach((pl,i)=>{const cx=95+i*165,cy=346;
      ctx.fillStyle=uv?'rgba(60,50,110,.9)':pl.ara?'#efe3c4':'#f2e6c9';ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fill();ctx.strokeStyle=uv?'#8d84c9':PAL['cv-glass'];ctx.lineWidth=3;ctx.stroke();
      const P=s.plates&&s.plates[i];if(P&&s.stage>=8){const grow=clamp((s.h-10)/24,0,1)+0.35*clamp((s.h-34)/14,0,1);
        if(P.lawn){const op=clamp((s.h-6)/16,0,1);ctx.fillStyle=uv?'rgba(220,220,240,'+0.35*op+')':'rgba(236,226,190,'+op+')';ctx.beginPath();ctx.arc(cx,cy,R-6,0,6.29);ctx.fill();
          ctx.fillStyle=uv?'rgba(255,255,255,'+0.25*op+')':'rgba(210,195,150,'+op+')';P.lawnDots.forEach(d=>{ctx.beginPath();ctx.arc(cx+d[0]*R,cy+d[1]*R,1.6,0,6.29);ctx.fill();});}
        else if(grow>0)P.pos.forEach(d=>{const r=Math.max(0.6,(1+2.1*grow)*d[2]);const x=cx+d[0]*(R-6),y=cy+d[1]*(R-6);
          if(uv&&pl.ara&&s.h>=18){const g=ctx.createRadialGradient(x,y,0,x,y,r*2.6);g.addColorStop(0,'rgba(140,255,150,.95)');g.addColorStop(1,'rgba(140,255,150,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*2.6,0,6.29);ctx.fill();ctx.fillStyle='#d9ffd9';}
          else ctx.fillStyle=uv?'rgba(235,235,250,.85)':'#fbf6e8';
          ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();if(!uv){ctx.strokeStyle='rgba(150,130,90,.6)';ctx.lineWidth=0.6;ctx.stroke();}});}
      txt(ctx,pl.n,cx,cy+R+16,{s:12.5*k,w:700,a:'center',c:uv?'#efeaff':PAL['cv-ink']});txt(ctx,pl.sub,cx,cy+R+30,{s:12*k,a:'center',c:uv?'#d8d0ff':PAL['cv-soft']});});
    if(s.stage>=8&&s.stage<9&&a<1){pill(ctx,'spreading 100 µL',340,262,PAL['card'],PAL['cv-ink'],11*k);}
    if(s.stage===9){txt(ctx,'37 °C · '+s.h.toFixed(0)+' h',672,272,{s:12.5*k,w:700,a:'right',c:uv?'#efeaff':PAL['cv-ink']});}
    // plasmid map
    if(hon){const px=740,py=330,pr=36;txt(ctx,'pGLO',px,py+4,{s:12*k,w:700,a:'center'});
      const segs=[[0,0.22,'#2f6fd6','bla'],[0.3,0.48,'#7b3fe4','araC'],[0.52,0.66,'#1b8a4a','GFP'],[0.75,0.85,'#c27a00','ori']];
      ctx.strokeStyle=PAL['line'];ctx.lineWidth=6;ctx.beginPath();ctx.arc(px,py,pr,0,6.29);ctx.stroke();
      segs.forEach(([a0,a1,c,l])=>{ctx.strokeStyle=c;ctx.lineWidth=8;ctx.beginPath();ctx.arc(px,py,pr,a0*6.283-1.57,a1*6.283-1.57);ctx.stroke();const m=((a0+a1)/2)*6.283-1.57;txt(ctx,l,px+Math.cos(m)*(pr+16),py+Math.sin(m)*(pr+16)+4,{s:11*k,w:700,c:c,a:'center'});});
      txt(ctx,'~5.4 kb',px,py+pr+30,{s:10.5*k,c:PAL['cv-soft'],a:'center'});}
  },
  thumbSetup(sim){sim.p.uv=true;goTo(sim,9,40);},thumbFrames:1,
  tour:[
    {title:'The goal',text:'We want E. coli to take in the pGLO plasmid, a small circle of DNA carrying two useful genes: one for ampicillin resistance and one for green fluorescent protein (GFP).',focus:[540,8,256,244],pause:true},
    {title:'Calcium chloride and cells',text:'Both tubes get ice-cold CaCl₂ and some bacteria. Calcium ions help the negatively charged DNA get close to the negatively charged cell surface.',focus:[20,10,190,230],speed:1,setup(sim){goTo(sim,1);sim.st.anim=0;}},
    {title:'Plasmid in one tube only',text:'Plasmid goes into the +pGLO tube only. The −pGLO tube is the control: same cells, same treatment, no new gene.',focus:[20,10,190,230],speed:1,setup(sim){goTo(sim,3);sim.st.anim=0;}},
    {title:'Heat shock',text:'Cells move from ice to a 42 °C water bath for 50 seconds, then straight back to ice. The sudden temperature change helps plasmids slip through the membrane.',focus:[200,10,330,230],speed:0.5,setup(sim){goTo(sim,4);sim.st.stage=5;sim.st.anim=0;}},
    {title:'Spread on four plates',text:'Each tube is spread on plates. Ampicillin plates kill any cell without the plasmid. The arabinose plate also contains the sugar that switches on GFP.',focus:[8,250,672,198],speed:1,setup(sim){goTo(sim,8);sim.st.anim=0;}},
    {title:'Selection',text:'After a day at 37 °C, LB without ampicillin is a solid lawn, the −pGLO ampicillin plate is empty, and only transformed cells form colonies on the +pGLO ampicillin plates.',focus:[8,250,672,198],speed:1,setup(sim){goTo(sim,9,36);}},
    {lvl:'honors',title:'Under UV light',text:'Only the arabinose plate glows. The GFP gene sits behind a promoter that the araC protein switches on when arabinose is present, so colonies without arabinose have the gene but do not use it.',focus:[504,250,176,198],pause:true,setup(sim){BioLab.setValues(sim,{uv:true});goTo(sim,9,48);}},
    {lvl:'ap',title:'Transformation efficiency',text:'Efficiency = colonies ÷ µg of DNA spread on the plate. Here 0.8 µg × (100 ÷ 510) ≈ 0.157 µg, so about 125 colonies gives about 800 transformants per µg.',focus:[338,250,180,198],pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{uv:false});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'After incubation, which plates will have bacteria growing on them?',choices:['All four plates','LB −pGLO, plus both +pGLO plates with ampicillin','Only the plate with arabinose'],correct:1,
     baselineAction:'runall',changeText:'Running the whole procedure',watch:'plates',
     explain:{bio:'Ampicillin kills bacteria that don’t have the plasmid. The LB plate has no ampicillin, so everything grows there. The +pGLO cells that took in the plasmid survive on both ampicillin plates.'}},
    {lvl:'bio',q:'With the UV light on, which plate glows green?',choices:['Every plate with bacteria','Only the LB/amp/ara plate','Only the LB plate'],correct:1,
     baseline:{uv:true},baselineAction:'runall',changeText:'Running the procedure, UV on',watch:'plates',
     explain:{bio:'Both +pGLO plates have bacteria with the GFP gene, but the gene is only switched on when arabinose is present.',honors:'The araC protein activates the GFP promoter only when it binds arabinose. That is gene regulation: the gene is present on both +pGLO plates, but only expressed with arabinose.'}},
    {lvl:'honors',q:'Why is the LB −pGLO plate covered in a lawn of bacteria?',choices:['Those cells picked up the plasmid','There is no ampicillin, so every cell can grow','Arabinose made them grow faster'],correct:1,
     baselineAction:'runall',changeText:'Running the procedure',watch:'plates',
     explain:{honors:'It is a control. It shows the cells were alive and able to grow. Without ampicillin there is no selection, so all of the roughly 10⁸ cells spread make a solid lawn.'}},
    {lvl:'honors',q:'You skip the heat shock (0 s). What happens on the +pGLO ampicillin plates?',choices:['About the same number of colonies','Far fewer colonies','A lawn of bacteria'],correct:1,
     baseline:{shock:0},baselineAction:'runall',changeText:'Running without heat shock',watch:'plates',
     explain:{honors:'Without the heat shock, only a few cells take in the plasmid (here about 10% as many). The few that do still survive ampicillin, so you see a handful of colonies.'}},
    {lvl:'honors',q:'About how many transformants per µg of DNA did you get?',choices:['Under 100 per µg','Between 300 and 3,000 per µg','Over 30,000 per µg'],correct:1,
     baselineAction:'runall',changeText:'Running the procedure',watch:'plates',
     explain:{honors:'About 125 colonies ÷ about 0.157 µg spread ≈ 800 transformants per µg, typical for the pGLO kit. The DNA spread is 10 µL × 0.08 µg/µL × (100 µL ÷ 510 µL).'}},
    {lvl:'ap',q:'You forget to add plasmid to the +pGLO tube. What do the ampicillin plates show?',choices:['Colonies, but none glow','No colonies on either ampicillin plate','A lawn on every plate'],correct:1,
     baseline:{plasmid:false},baselineAction:'runall',changeText:'Running without plasmid',watch:'plates',
     explain:{ap:'With no plasmid, no cell has the bla gene, so ampicillin kills them all. The LB −pGLO lawn shows the cells were fine, which is why controls matter.'}},
    {lvl:'ap',q:'You spread 200 µL instead of 100 µL on each plate. What happens to the colonies and to the calculated efficiency?',choices:['Both double','Colonies roughly double; efficiency stays about the same','Colonies stay the same; efficiency halves'],correct:1,
     baseline:{vol:200},baselineAction:'runall',changeText:'Spreading 200 µL',watch:'plates',
     explain:{ap:'Twice the volume carries twice the cells and twice the DNA, so you get about twice the colonies. Efficiency divides by the DNA actually spread (now about 0.31 µg), so it stays near 800 per µg. It is a property of the cells and protocol, not of the plating volume.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Which bacteria take in the new gene, and how can you tell?</p><ol><li>Run the whole procedure and let it incubate 48 h.</li><li>Record the growth on each plate (lawn, colonies or none).</li><li>Turn on the UV light and record which plates glow.</li></ol><p>Use the four plates to explain what ampicillin does and what arabinose does.</p>',
       honors:'<p><b>Question:</b> How does heat-shock time affect transformation?</p><ol><li>Run the procedure with heat shocks of 0, 25, 50, 75 and 100 s.</li><li>Record the colonies on LB/amp +pGLO and the efficiency each time.</li><li>Plot heat-shock time (x) against efficiency (y).</li></ol><p>Explain the shape of your graph.</p>',
       ap:'<p><b>Question:</b> Is transformation efficiency a property of the cells or of how you plate them?</p><ol><li>Run 3 trials each at 50, 100 and 200 µL spread.</li><li>Calculate DNA spread and efficiency for each.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why colony counts vary while efficiency stays the same, and what random variation you see between trials.</p>'},
  terms:[{t:'Transformation',d:'When a cell takes in and uses DNA from outside.'},{t:'Plasmid',d:'A small circle of DNA, separate from the bacterial chromosome, that can carry useful genes.'},{t:'Ampicillin',d:'An antibiotic. Only cells with the bla resistance gene survive it.'},{t:'GFP',d:'Green fluorescent protein, from a jellyfish. It glows green under UV light.'},
    {lvl:'honors',t:'Heat shock',d:'A quick jump from ice to 42 °C that helps plasmids enter cells treated with CaCl₂.'},{lvl:'honors',t:'Selection',d:'Using a condition, such as ampicillin, that only cells with the new gene can survive.'},{lvl:'honors',t:'araC',d:'The regulatory protein that switches on the GFP gene when arabinose is present.'},
    {lvl:'ap',t:'Transformation efficiency',d:'Transformed colonies per µg of plasmid DNA spread.'},{lvl:'ap',t:'β-lactamase',d:'The enzyme made from the bla gene. It breaks down ampicillin.'}],
  about:'<p><b>Model:</b> the expected colonies on each +pGLO ampicillin plate = 800 transformants/µg × heat-shock factor × DNA spread. The heat-shock factor is 0.1 + 0.9·e<sup>−((t−50)/25)²</sup>, so skipping the shock gives about 12% of the normal count. DNA spread = 10 µL × 0.08 µg/µL × (volume ÷ 510 µL). Counts are drawn from a Poisson distribution, so repeat trials vary like real plates. Colonies appear about 12 hours into incubation, and GFP becomes visible after about 18 hours on arabinose.</p><p><b>Simplified:</b> no satellite colonies around transformants on ampicillin, no contamination, and the incubation is compressed into seconds. The plasmid map is schematic. pGLO is about 5.4 kb and carries bla, araC, GFP and an origin of replication.</p>'
};
BioLab.register(TRANS);
})();
