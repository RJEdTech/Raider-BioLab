(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,legend,serColor,lvText,fmtNum}=BioLab.h;
const MONO='Consolas,"Courier New",monospace';

/* ---------- pipettes: dial is the 3-digit display read as an integer 000–220 ---------- */
const PIPS={
  P2:{min:0.2,max:2,toUL:d=>d/100,dp:0,d:2,note:'2-0-0 means 2.00 µL'},
  P10:{min:1,max:10,toUL:d=>d/10,dp:1,d:1,note:'1-0-0 means 10.0 µL'},
  P20:{min:2,max:20,toUL:d=>d/10,dp:1,d:1,note:'2-0-0 means 20.0 µL'},
  P200:{min:20,max:200,toUL:d=>d,dp:-1,d:0,note:'2-0-0 means 200 µL'},
  P1000:{min:100,max:1000,toUL:d=>d*10,dp:-2,d:0,note:'1-0-0 means 1000 µL'}
};
const PIP_ORDER=['P2','P10','P20','P200','P1000'];
const TASKS={'7.5':7.5,'15':15,'50':50,'150':150,'250':250,'800':800,'1.5':1.5,'5':5};
function volOf(sim){return PIPS[sim.p.pip].toUL(sim.p.dial);}
function bestPip(v,lv){const list=PIP_ORDER.filter(n=>atLeast(n==='P2'||n==='P10'?'honors':'bio'));return list.find(n=>v>=PIPS[n].min&&v<=PIPS[n].max)||null;}
function fmtUL(v){return String(parseFloat(v<10?v.toFixed(2):v<100?v.toFixed(1):v.toFixed(0)));}
function dec(x){return x.toFixed(9).replace(/0+$/,'').replace(/\.$/,'');}
function conv(v){return fmtUL(v)+' µL = '+dec(v/1000)+' mL = '+dec(v/1e6)+' L';}

/* ---------- mode visibility ---------- */
const MODE={pip:{ctl:['pip','dial','task'],met:['set','range','choice','tube','error','conv'],act:['first','second','slow','fast','sample','tube','newtip']},
            dil:{ctl:['c1','c2','v2'],met:['v1','water','factor'],act:[]},
            ser:{ctl:['n0','ntubes','plated'],met:['dil','cols','cfu','countable'],act:['plate']}};
function modeUI(sim){const ui=sim.ui;if(!ui||!ui.sec)return;const m=MODE[sim.p.mode];
  (sim.def.controls||[]).forEach(c=>{if(c.id==='mode')return;const e=ui.sec.querySelector('#pipette-'+c.id);const w=e&&e.closest('.ctl');if(w)w.hidden=!atLeast(w.dataset.lvl)||!m.ctl.includes(c.id);});
  (sim.def.metrics||[]).forEach(mm=>{const t=ui.tiles[mm.id];const w=t&&t.num.closest('.tile');if(w)w.hidden=!atLeast(w.dataset.lvl)||!m.met.includes(mm.id);});
  const btns=[...ui.sec.querySelectorAll('.controls .actions button')];(sim.def.actions||[]).forEach((a,i)=>{const b=btns[i];if(b)b.hidden=!atLeast(b.dataset.lvl)||!m.act.includes(a.id);});}

/* ---------- pipetting actions (state machine) ---------- */
function act(sim,what){const s=sim.st,v=volOf(sim);s.msg='';
  if(what==='newtip'){s.tip=0;s.bub=false;s.tube=0;s.log=[];s.where='air';s.plunger=0;s.msg='Fresh tip on, tube emptied.';return;}
  if(what==='sample'||what==='tube'){s.where=what;return;}
  if(what==='first'||what==='second'){const stop=what==='first'?1:2;
    if(s.where==='sample'&&s.plunger===0){s.bub=true;s.msg='You pressed the plunger with the tip in the liquid, blowing air bubbles into the sample. Press before you dip.';}
    if(s.where==='tube'&&s.tip>0){const out=stop===1?s.tip*0.97:s.tip;s.tube+=out;s.tip-=out;if(s.tip<1e-9)s.tip=0;s.log.push(stop===1?'disp1':'disp2');}
    s.plunger=stop;s.log.push(stop===1?'p1':'p2');return;}
  if(what==='slow'||what==='fast'){if(s.where==='sample'&&s.plunger>0){const draw=v*(s.plunger===2?1.27:1)*(what==='fast'?0.93:1);s.tip=draw;if(what==='fast'){s.bub=true;s.msg='Letting the plunger snap back pulls air and splashes liquid up the tip.';}s.log.push('draw'+s.plunger+what);}
    else if(s.where==='tube'&&s.tip===0&&s.plunger===2){s.msg='Pull the tip out of the liquid before releasing, or you will suck some sample back up.';}
    s.plunger=0;return;}}

const PIP={
  id:'pipette',hash:'pipette',apUnit:10,order:0,kind:'Lab skills',tab:'Micropipettes and dilutions',
  card:'Set the dial, pick the right micropipette, practice the two-stop technique, then plan dilutions and serial dilutions.',
  title:'Micropipettes and dilutions',
  next:['plasmid','gel'],
  lede:{bio:'Micropipettes measure tiny volumes, in microliters. Choose the right one, read the dial, and use the first and second stops correctly.',
        honors:'Add serial dilutions: make a 10-fold series, plate it, count colonies and calculate how many bacteria were in the original culture.',
        ap:'Calculate percent error, plan dilutions with C₁V₁ = C₂V₂, and use the 30–300 colony rule to choose a countable plate.'},
  scale:{bio:'1 microliter (µL) is one millionth of a liter, about the size of a pinhead drop. A raindrop is about 50 µL.',
         ap:'1 L = 1,000 mL = 1,000,000 µL. A P20 is accurate to about ±1% at 20 µL; accuracy falls near the bottom of any pipette’s range.'},
  timeless:true,animated:true,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'pip',lvl:'bio',noTrial:true,options:[{v:'pip',l:'Pipetting'},{v:'dil',l:'Dilutions'},{v:'ser',l:'Serial dilution',lvl:'honors'}],onChange(sim){modeUI(sim);}},
    {id:'pip',label:'Micropipette',type:'seg',def:'P20',lvl:'bio',options:[{v:'P2',l:'P2',lvl:'honors'},{v:'P10',l:'P10',lvl:'honors'},{v:'P20',l:'P20'},{v:'P200',l:'P200'},{v:'P1000',l:'P1000'}],onChange(sim){act(sim,'newtip');}},
    {id:'dial',label:'Volume dial (3-digit display)',type:'range',min:0,max:220,step:1,def:100,lvl:'bio',help:'Turn the plunger knob to change the digits'},
    {id:'task',label:'Your task: measure',type:'select',def:'7.5',lvl:'bio',options:[{v:'7.5',l:'7.5 µL'},{v:'15',l:'15 µL'},{v:'50',l:'50 µL'},{v:'150',l:'150 µL'},{v:'250',l:'250 µL'},{v:'800',l:'800 µL (0.8 mL)'},{v:'1.5',l:'1.5 µL',lvl:'honors'},{v:'5',l:'5 µL',lvl:'honors'}],onChange(sim){act(sim,'newtip');}},
    {id:'c1',label:'Stock concentration',type:'range',min:1,max:100,step:1,def:10,unit:' ×',lvl:'bio'},
    {id:'c2',label:'Concentration you need',type:'range',min:0.5,max:20,step:0.5,def:1,unit:' ×',lvl:'bio'},
    {id:'v2',label:'Final volume you need',type:'range',min:1,max:100,step:1,def:50,unit:' mL',lvl:'bio'},
    {id:'n0',label:'Bacteria in the original culture (log₁₀ cells/mL)',type:'range',min:5,max:10,step:0.5,def:8.5,lvl:'honors'},
    {id:'ntubes',label:'Tubes in the series',type:'range',min:3,max:8,step:1,def:6,lvl:'honors'},
    {id:'plated',label:'Plate 100 µL from tube',type:'range',min:1,max:8,step:1,def:6,lvl:'honors',onChange(sim){sim.st.plate=null;}}
  ],
  actions:[
    {id:'first',label:'Press to 1st stop',lvl:'bio',run(sim){act(sim,'first');}},
    {id:'second',label:'Press to 2nd stop',lvl:'bio',run(sim){act(sim,'second');}},
    {id:'slow',label:'Release slowly',lvl:'bio',primary:true,run(sim){act(sim,'slow');}},
    {id:'fast',label:'Let go quickly',lvl:'bio',run(sim){act(sim,'fast');}},
    {id:'sample',label:'Tip into sample',lvl:'bio',run(sim){act(sim,'sample');}},
    {id:'tube',label:'Tip into tube',lvl:'bio',run(sim){act(sim,'tube');}},
    {id:'newtip',label:'New tip, empty tube',lvl:'bio',run(sim){act(sim,'newtip');}},
    {id:'plate',label:'Plate and incubate',lvl:'honors',primary:true,run(sim){const p=sim.p,k=Math.min(p.plated,p.ntubes);const mean=Math.pow(10,p.n0-k)*0.1;
      sim.st.plate={k,cols:mean>2000?Math.round(mean):poisson(mean),t:0};}}
  ],
  init(){return {tip:0,bub:false,tube:0,where:'air',plunger:0,log:[],msg:'',plate:null,px:0,pv:0};},
  step(sim,dt){const s=sim.st;const tx=s.where==='sample'?1:s.where==='tube'?2:0;s.px=lerp(s.px,tx,clamp(dt*6,0,1));s.pv=lerp(s.pv,s.plunger,clamp(dt*8,0,1));if(s.plate)s.plate.t=Math.min(1,s.plate.t+dt*0.7);},
  metrics:[
    {id:'set',label:'Volume set',unit:'µL',lvl:'bio',min:0,max:null,d:2,get:s=>volOf(s)},
    {id:'range',label:'This pipette’s range',unit:'',lvl:'bio',text:true,get:s=>{const P=PIPS[s.p.pip];return fmtUL(P.min)+'–'+fmtUL(P.max)+' µL';}},
    {id:'choice',label:'Right pipette for the task?',unit:'',lvl:'bio',text:true,get:s=>{const t=TASKS[s.p.task],b=bestPip(t),v=volOf(s),P=PIPS[s.p.pip];
      if(v>P.max)return 'Dial past the maximum: can damage the pipette';if(t<P.min||t>P.max)return 'No: '+s.p.pip+' can’t measure '+fmtUL(t)+' µL. Use '+b;if(b!==s.p.pip)return 'Works, but '+b+' is more accurate';return Math.abs(v-t)<1e-9?'Yes, and the dial is set right':'Right pipette; now set the dial to '+fmtUL(t)+' µL';}},
    {id:'tube',label:'Delivered to the tube',unit:'µL',lvl:'bio',min:0,max:null,d:2,get:s=>s.st.tube},
    {id:'error',label:'Error vs. the task',unit:'%',lvl:'honors',min:0,max:50,d:1,get:s=>s.st.tube>0?Math.abs(s.st.tube-TASKS[s.p.task])/TASKS[s.p.task]*100:NaN},
    {id:'conv',label:'Same volume in other units',unit:'',lvl:'bio',text:true,get:s=>conv(TASKS[s.p.task])},
    {id:'v1',label:'Stock to measure (V₁)',unit:'mL',lvl:'bio',min:0,max:null,d:2,get:s=>s.p.c2>s.p.c1?NaN:s.p.c2*s.p.v2/s.p.c1},
    {id:'water',label:'Water to add',unit:'mL',lvl:'bio',min:0,max:null,d:2,get:s=>s.p.c2>s.p.c1?NaN:s.p.v2-s.p.c2*s.p.v2/s.p.c1},
    {id:'factor',label:'Dilution factor',unit:'',lvl:'bio',text:true,get:s=>s.p.c2>s.p.c1?'Impossible: you can’t dilute up to a higher concentration':'1 : '+(s.p.c1/s.p.c2).toFixed(s.p.c1/s.p.c2%1?1:0)},
    {id:'dil',label:'Dilution of the plated tube',unit:'',lvl:'honors',text:true,get:s=>'10⁻'+Math.min(s.p.plated,s.p.ntubes)},
    {id:'cols',label:'Colonies on the plate',unit:'',lvl:'honors',text:true,get:s=>{const pl=s.st.plate;if(!pl)return 'Press Plate and incubate';return pl.cols>300?'Too many to count ('+(pl.cols>2000?'lawn':pl.cols)+')':String(pl.cols);}},
    {id:'cfu',label:'Original culture (calculated)',unit:'cells/mL',lvl:'honors',text:true,get:s=>{const pl=s.st.plate;if(!pl||pl.cols===0||pl.cols>300)return '—';const v=pl.cols/(Math.pow(10,-pl.k)*0.1);return v.toExponential(2).replace('e+','×10^');}},
    {id:'countable',label:'Countable plate? (30–300)',unit:'',lvl:'ap',text:true,get:s=>{const pl=s.st.plate;if(!pl)return '—';return pl.cols<30?'Too few: random error is large':pl.cols>300?'Too many: colonies merge':'Yes';}}
  ],
  graphs:[],
  challenges:[
    {lvl:'bio',q:'Which micropipette should you use to measure 7.5 µL?',choices:['P20','P200','P1000'],correct:0,instant:true,show:{mode:'pip',pip:'P20',dial:75,task:'7.5'},
     explain:{bio:'Use the smallest pipette whose range includes the volume. A P20 measures 2–20 µL, so 7.5 µL fits. A P200 starts at 20 µL and could not measure it accurately.'}},
    {lvl:'bio',q:'A P200’s display reads 0-7-5. What volume will it measure?',choices:['7.5 µL','75 µL','750 µL'],correct:1,instant:true,show:{mode:'pip',pip:'P200',dial:75,task:'50'},
     explain:{bio:'On a P200 you read the three digits straight across, in microliters: 0-7-5 means 75 µL. On a P20 the same digits would mean 7.5 µL, and on a P1000 they would mean 750 µL. Always check which pipette you are holding.'}},
    {lvl:'bio',q:'You press to the second stop before dipping into the sample, then release in the liquid. What happens?',choices:['You draw up exactly the set volume','You draw up too much','You draw up nothing'],correct:1,instant:true,show:{mode:'pip',pip:'P20',dial:75,task:'7.5'},
     explain:{bio:'The second stop is only for pushing out the last drop. Starting from the second stop sucks up an extra 20–30%. Draw up from the first stop; dispense to the first stop, then push to the second to blow out the rest. Try both ways with the buttons and compare the tube.'}},
    {lvl:'bio',q:'How many microliters are in 0.25 mL?',choices:['25 µL','250 µL','2,500 µL'],correct:1,instant:true,show:{mode:'pip',pip:'P1000',dial:25,task:'250'},
     explain:{bio:'There are 1,000 µL in 1 mL, so 0.25 mL × 1,000 = 250 µL. Moving from mL to µL, multiply by 1,000; going the other way, divide by 1,000.'}},
    {lvl:'honors',q:'You have 10× buffer and need 50 mL of 1× buffer. How much 10× stock do you measure?',choices:['5 mL stock + 45 mL water','10 mL stock + 40 mL water','0.5 mL stock + 49.5 mL water'],correct:0,instant:true,show:{mode:'dil',c1:10,c2:1,v2:50},
     explain:{honors:'C₁V₁ = C₂V₂, so V₁ = (1 × 50) ÷ 10 = 5 mL of stock. Add water up to 50 mL, which is 45 mL. That is a 1:10 dilution.'}},
    {lvl:'honors',q:'You plate 100 µL from the 10⁻⁶ tube and count 150 colonies. How many bacteria per mL were in the original culture?',choices:['1.5 × 10⁷ per mL','1.5 × 10⁸ per mL','1.5 × 10⁹ per mL'],correct:2,instant:true,show:{mode:'ser',n0:9,ntubes:7,plated:6},
     explain:{honors:'Cells per mL = colonies ÷ (dilution × volume plated) = 150 ÷ (10⁻⁶ × 0.1 mL) = 1.5 × 10⁹ per mL. Each colony grew from one cell, so counting colonies counts the cells you plated.'}},
    {lvl:'ap',q:'Three plates from one series show 12, 145 and “too many to count” colonies. Which plate should you use to calculate the original concentration?',choices:['The plate with 12 colonies','The plate with 145 colonies','The crowded plate'],correct:1,instant:true,show:{mode:'ser',n0:8.5,ntubes:6,plated:5},
     explain:{ap:'Use plates with 30–300 colonies. Below 30, chance (Poisson error, about √n) is a big fraction of the count; above 300, colonies touch and merge, so you undercount. 145 colonies has about ±8% counting error.'}},
    {lvl:'ap',q:'Your P20 is set to 10.0 µL, and weighing shows it delivered 9.6 µL. What is the percent error?',choices:['0.4%','4%','96%'],correct:1,instant:true,show:{mode:'pip',pip:'P20',dial:100,task:'15'},
     explain:{ap:'Percent error = |measured − expected| ÷ expected × 100 = 0.4 ÷ 10.0 × 100 = 4%. Labs check pipettes this way: 1 µL of water weighs 1 mg, so weighing what you dispense tests accuracy.'}}
  ],
  onChallenge(sim,ch,phase){if(phase==='done'&&ch.show){BioLab.setValues(sim,ch.show);act(sim,'newtip');modeUI(sim);}},
  onLevel(sim){modeUI(sim);},
  narrate(sim){const p=sim.p,s=sim.st;
    if(p.mode==='dil'){if(p.c2>p.c1)return '<b>You can’t dilute to a higher concentration.</b> Diluting only adds water, so the result is always weaker than the stock.';
      const v1=p.c2*p.v2/p.c1;return 'C₁V₁ = C₂V₂: measure <b>'+v1.toFixed(2)+' mL of '+p.c1+'× stock</b>, then add water to a total of '+p.v2+' mL. That is a 1 : '+(p.c1/p.c2).toFixed(1).replace(/\.0$/,'')+' dilution.';}
    if(p.mode==='ser'){const pl=s.st&&s.plate;if(!pl)return 'Each tube gets 100 µL from the tube before plus 900 µL of broth, so every step divides the bacteria by 10. Pick a tube to plate, then press Plate and incubate.';
      if(pl.cols>300)return 'Too many colonies to count: they run together. Plate a more dilute tube (a higher number).';if(pl.cols<30)return 'Only '+pl.cols+' colonies: too few for a reliable count. Plate a less dilute tube.';
      return '<b>'+pl.cols+' colonies.</b> Each grew from one cell. Divide by the dilution (10⁻'+pl.k+') and the volume plated (0.1 mL) to get cells per mL in the original culture.';}
    if(s.msg)return s.msg;const v=volOf(sim),P=PIPS[p.pip];
    if(v>P.max)return '<b>The dial is past the maximum.</b> Turning it further can break the pipette. A '+p.pip+' goes up to '+fmtUL(P.max)+' µL.';
    if(s.where==='air'&&s.plunger===0&&s.tip===0)return 'The display reads '+fmtUL(v)+' µL on a '+p.pip+' ('+P.note+'). Press to the <b>first stop</b>, then put the tip into the sample.';
    if(s.where==='sample'&&s.plunger>0)return 'The tip is in the sample with the plunger held '+(s.plunger===1?'at the first stop':'at the <b>second</b> stop')+'. Now release slowly to draw liquid up.';
    if(s.tip>0&&s.where!=='tube')return 'The tip holds about '+fmtUL(s.tip)+' µL'+(s.bub?' with air bubbles in it':'')+'. Move to the tube, press to the first stop, then the second stop to push out the last drop.';
    if(s.where==='tube'&&s.tube>0)return 'Delivered <b>'+fmtUL(s.tube)+' µL</b> into the tube (task: '+fmtUL(TASKS[p.task])+' µL). '+(s.tip>0?'A little is left in the tip: press to the second stop to blow it out.':'');
    return 'Press to the first stop before the tip goes into the liquid, then release slowly.';},
  tour:[
    {title:'Parts of a micropipette',text:'Plunger on top, volume display in the middle, a disposable tip at the bottom. You never let liquid touch the pipette itself, only the tip.',focus:[110,20,190,420],pause:true,setup(sim){BioLab.setValues(sim,{mode:'pip',pip:'P20',dial:75,task:'7.5'});act(sim,'newtip');modeUI(sim);}},
    {title:'Read the display',text:'This P20 reads 0-7-5. On a P20 the last digit is tenths, so it is set to 7.5 µL. A P200 showing 0-7-5 would be 75 µL.',focus:[150,150,110,80],pause:true},
    {title:'Push to the first stop',text:'Before the tip goes into the liquid, press the plunger down to the <b>first stop</b>, where you feel resistance.',focus:[[110,20,190,170],[610,240,180,190]],speed:1,setup(sim){act(sim,'first');}},
    {title:'Dip and release slowly',text:'Put the tip just under the surface and let the plunger rise slowly. Liquid flows up into the tip.',focus:[300,180,230,250],speed:1,setup(sim){act(sim,'sample');act(sim,'slow');}},
    {title:'Dispense: first stop, then second',text:'Move to the tube. Press to the first stop to push the liquid out, then all the way to the <b>second stop</b> to blow out the last drop.',focus:[300,180,320,250],speed:1,setup(sim){act(sim,'tube');act(sim,'first');act(sim,'second');}},
    {title:'Check your work',text:'The tube now holds 7.5 µL. Pressing to the second stop before drawing up, or letting the plunger snap back, gives the wrong volume. Try those mistakes yourself.',focus:[600,20,195,210],pause:true},
    {lvl:'honors',title:'Serial dilution',text:'Each tube gets 100 µL from the one before plus 900 µL broth: a 10-fold dilution each time. Plate one tube and count colonies.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{mode:'ser'});modeUI(sim);}},
    {lvl:'ap',title:'C₁V₁ = C₂V₂',text:'To dilute a stock, multiply what you need (C₂ × V₂) and divide by the stock concentration (C₁) to get V₁. Add water up to V₂.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{mode:'dil'});modeUI(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'pip'});act(sim,'newtip');modeUI(sim);},
  lab:{bio:'<p><b>Question:</b> How accurate is your pipetting technique?</p><ol><li>For each task volume, choose the pipette, set the dial, and transfer it with correct technique. Record a trial.</li><li>Repeat one volume using the second stop to draw up, and once letting the plunger snap back.</li></ol><p>Which mistake caused the biggest error? Explain why.</p>',
       honors:'<p><b>Question:</b> How many bacteria are in the culture?</p><ol><li>Make a 6-tube 10-fold series.</li><li>Plate 100 µL from tubes 4, 5 and 6 and record the colonies for each.</li><li>Calculate cells per mL from every countable plate and compare.</li></ol><p>Why do the calculations from different plates come out close but not identical?</p>',
       ap:'<p><b>Question:</b> How do you plan dilutions and judge counts?</p><ol><li>Plan three dilutions with C₁V₁ = C₂V₂ (for example 10× to 1× in 50 mL, 25 to 0.5 in 1 mL). Record the stock volume and the pipette you would use.</li><li>In the serial dilution, plate every tube once and record which are countable.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain the 30–300 rule using the size of random counting error (about √n).</p>'},
  terms:[{t:'Microliter (µL)',d:'One millionth of a liter; 1,000 µL = 1 mL.'},{t:'Micropipette',d:'A tool that measures and moves tiny, accurate volumes of liquid.'},{t:'First stop',d:'The first point of resistance on the plunger, used to measure the volume.'},{t:'Second stop',d:'Pushing past the first stop, used only to blow out the last drop when dispensing.'},
    {lvl:'honors',t:'Dilution factor',d:'How many times weaker a solution is than its stock, such as 1:10.'},{lvl:'honors',t:'Serial dilution',d:'A series of repeated dilutions, each by the same factor.'},{lvl:'honors',t:'Colony',d:'A visible pile of bacteria that grew from one cell.'},
    {lvl:'ap',t:'C₁V₁ = C₂V₂',d:'The amount of solute is the same before and after dilution.'},{lvl:'ap',t:'CFU',d:'Colony-forming units: the number of living cells that can grow into colonies.'},{lvl:'ap',t:'Percent error',d:'|measured − expected| ÷ expected × 100.'}],
  about:'<p>Display rules follow common pipettes: a P20 reads its digits as tenths of a µL (0-7-5 = 7.5 µL), a P200 straight across (0-7-5 = 75 µL), and a P1000 with the top digit as thousands (1-0-0 = 1000 µL). Drawing from the second stop takes in about 27% extra; letting the plunger snap back draws about 7% less and adds bubbles. Dispensing to the first stop leaves about 3% in the tip until you push to the second stop.</p><p>Serial dilutions are 100 µL into 900 µL (10-fold), plating 100 µL. Colony counts are drawn from a Poisson distribution, so repeated plating varies as it does in a real lab. Very high counts are shown as a lawn.</p>',
  initVis(sim){modeUI(sim);},
  thumbSetup(sim){sim.p.dial=75;act(sim,'first');act(sim,'sample');act(sim,'slow');sim.st.px=1;},thumbFrames:2,
  draw(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='dil')return drawDil(sim,ctx,k);if(p.mode==='ser')return drawSer(sim,ctx,k,t);
    drawPip(sim,ctx,k,t);}
};

function poisson(m){if(m>60)return Math.max(0,Math.round(m+Math.sqrt(m)*BioLab.h.randn()));let L=Math.exp(-m),kk=0,pp=1;do{kk++;pp*=Math.random();}while(pp>L);return kk-1;}

/* ---------- drawing: pipetting ---------- */
function drawPip(sim,ctx,k0,t){const k=Math.min(k0,1.35);const p=sim.p,s=sim.st,P=PIPS[p.pip],v=volOf(sim);
  const SRC=380,DST=520;const px=lerp(lerp(205,SRC,clamp(s.px,0,1)),DST,clamp(s.px-1,0,1));const dipped=s.where!=='air';const py=dipped?28:0;
  // tubes
  const tube=(x,label,fill,col)=>{ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-28,300);ctx.lineTo(x-28,390);ctx.quadraticCurveTo(x,430,x+28,390);ctx.lineTo(x+28,300);ctx.stroke();
    if(fill>0){const h=Math.min(95,fill);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x-26,400-h);ctx.lineTo(x-26,390);ctx.quadraticCurveTo(x,427,x+26,390);ctx.lineTo(x+26,400-h);ctx.closePath();ctx.fill();}
    txt(ctx,label,x,446,{s:12.5*k,w:700,a:'center'});};
  tube(SRC,'Sample',80,'rgba(60,110,220,.55)');
  tube(DST,'Your tube',s.tube>0?clamp(8+Math.log10(1+s.tube)*22,8,95):0,'rgba(60,110,220,.55)');
  // pipette body
  const X=px,top=30+py;const plDown=s.pv*14;
  ctx.fillStyle=PAL['cv-lamp'];rr(ctx,X-9,top-14+plDown,18,26,5);ctx.fill();               // plunger button
  ctx.fillStyle='#3f6fb0';rr(ctx,X-24,top+10,48,150,14);ctx.fill();                          // grip
  ctx.fillStyle='#2b5591';rr(ctx,X-30,top+30,12,46,5);ctx.fill();                           // finger hook
  ctx.fillStyle='#e6e9ec';rr(ctx,X-16,top+168,32,60,6);ctx.fill();                         // shaft
  ctx.fillStyle='#cfd6db';ctx.beginPath();ctx.moveTo(X-8,top+228);ctx.lineTo(X+8,top+228);ctx.lineTo(X+3,top+262);ctx.lineTo(X-3,top+262);ctx.closePath();ctx.fill(); // tip cone
  // liquid in tip
  if(s.tip>0){const f=clamp(s.tip/P.max,0,1.3);const h=Math.min(34,6+f*26);ctx.fillStyle='rgba(60,110,220,.7)';ctx.beginPath();ctx.moveTo(X-3-(h/34)*5,top+262-h);ctx.lineTo(X+3+(h/34)*5,top+262-h);ctx.lineTo(X+3,top+262);ctx.lineTo(X-3,top+262);ctx.closePath();ctx.fill();}
  if(s.bub){ctx.strokeStyle='#fff';ctx.lineWidth=1.2;[[0,250],[2,242],[-2,236]].forEach(b=>{ctx.beginPath();ctx.arc(X+b[0],top+b[1],2,0,6.29);ctx.stroke();});}
  // display window with three digits
  const dg=String(Math.round(p.dial)).padStart(3,'0');rr(ctx,X-20,top+60,40,78,5);ctx.fillStyle='#f4f4ef';ctx.fill();
  for(let i=0;i<3;i++){const red=(P.dp===1&&i===2)||(P.dp===0&&i>0)||(P.dp===-2&&i===0);txt(ctx,dg[i],X,top+75+i*24,{s:20,w:700,c:red?'#c11430':'#1c1c1f',a:'center',b:'middle'});}
  txt(ctx,p.pip,X,top+152,{s:13,w:700,c:'#fff',a:'center'});
  // stops diagram
  const SX=616,SY=252;txt(ctx,'Plunger',SX,SY,{s:12.5*k,w:700,c:PAL['cv-soft']});
  [['rest',0],['1st stop',1],['2nd stop',2]].forEach((r,i)=>{const y=SY+22+i*28;ctx.fillStyle=Math.round(s.pv)===r[1]?PAL['rj']:PAL['line'];ctx.beginPath();ctx.arc(SX+6,y,6,0,6.29);ctx.fill();txt(ctx,r[0],SX+20,y,{s:12.5*k,b:'middle',c:PAL['cv-ink']});});
  txt(ctx,'Display '+dg[0]+'-'+dg[1]+'-'+dg[2]+' = '+fmtUL(v)+' µL',24,404,{s:14*k,w:700});
  txt(ctx,P.note+' on a '+p.pip,24,426,{s:12*k,c:PAL['cv-soft']});
  // task card
  rr(ctx,610,24,178,200,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  const tv=TASKS[p.task],best=bestPip(tv);txt(ctx,'Task',624,48,{s:12*k,w:700,c:PAL['cv-soft']});txt(ctx,fmtUL(tv)+' µL',624,76,{s:22*k,w:700});
  const ok1=p.pip===best,ok2=Math.abs(v-tv)<1e-9,ok3=s.tube>0&&Math.abs(s.tube-tv)/tv<0.02;
  [['Right pipette',ok1],['Dial set',ok2],['Delivered ±2%',ok3]].forEach((r,i)=>{const y=106+i*26;txt(ctx,r[1]?'✓':'○',626,y,{s:15*k,w:700,c:r[1]?PAL['s3']:PAL['cv-soft'],b:'middle'});txt(ctx,r[0],646,y,{s:12.5*k,b:'middle'});});
  txt(ctx,'In tube: '+fmtUL(s.tube)+' µL',624,196,{s:12.5*k,w:600,c:PAL['cv-ink']});}

/* ---------- drawing: C1V1 dilution ---------- */
function drawDil(sim,ctx,k){const p=sim.p,bad=p.c2>p.c1,v1=bad?0:p.c2*p.v2/p.c1;
  // stock bottle
  ctx.fillStyle='rgba(193,20,48,.75)';rr(ctx,70,190,110,190,16);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;rr(ctx,70,170,110,210,16);ctx.stroke();ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(100,148,50,24);
  txt(ctx,'Stock '+p.c1+'×',125,404,{s:14*k,w:700,a:'center'});
  // arrow
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(200,280);ctx.lineTo(300,280);ctx.stroke();ctx.beginPath();ctx.moveTo(300,280);ctx.lineTo(290,274);ctx.lineTo(290,286);ctx.closePath();ctx.fillStyle=PAL['cv-soft'];ctx.fill();
  txt(ctx,bad?'—':v1.toFixed(2)+' mL',250,268,{s:13*k,w:700,a:'center'});
  // cylinder
  const CX=380,top=90,bot=400,H=bot-top;const maxV=100;const fracV=p.v2/maxV,frac1=v1/maxV;
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.strokeRect(CX-34,top,68,H);
  for(let m=0;m<=100;m+=10){const y=bot-m/maxV*H;ctx.beginPath();ctx.moveTo(CX+34,y);ctx.lineTo(CX+(m%50?26:20),y);ctx.stroke();if(m%20===0)txt(ctx,m+' mL',CX+40,y,{s:11*k,b:'middle',c:PAL['cv-soft']});}
  if(!bad){const a=clamp(p.c2/p.c1,0.04,1);ctx.fillStyle='rgba(193,20,48,'+(0.75*a+0.05)+')';ctx.fillRect(CX-32,bot-fracV*H,64,fracV*H);
    ctx.strokeStyle='#fff';ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(CX-32,bot-frac1*H);ctx.lineTo(CX+32,bot-frac1*H);ctx.stroke();ctx.setLineDash([]);}
  txt(ctx,'Final: '+p.v2+' mL of '+p.c2+'×',CX,428,{s:14*k,w:700,a:'center'});
  // worked equation
  const X=520;txt(ctx,'C₁V₁ = C₂V₂',X,120,{s:20*k,w:700});
  txt(ctx,'V₁ = C₂ × V₂ ÷ C₁',X,156,{s:15*k});
  txt(ctx,bad?'Not possible: C₂ > C₁':'V₁ = '+p.c2+' × '+p.v2+' ÷ '+p.c1+' = '+v1.toFixed(2)+' mL',X,186,{s:15*k,w:700,c:bad?PAL['s1']:PAL['cv-ink']});
  if(!bad){txt(ctx,'Water = '+p.v2+' − '+v1.toFixed(2)+' = '+(p.v2-v1).toFixed(2)+' mL',X,216,{s:15*k});
    const best=bestPip(v1*1000);txt(ctx,'Measure the stock with: '+(v1<=1?(best||'a P1000'):v1<=10?'a 10 mL pipet':'a graduated cylinder'),X,262,{s:13*k,c:PAL['cv-soft']});}}

/* ---------- drawing: serial dilution ---------- */
function drawSer(sim,ctx,k,t){const p=sim.p,s=sim.st,n=p.ntubes;const W=Math.min(86,640/n);const X0=60;
  txt(ctx,'Original culture',X0-10,40,{s:12.5*k,w:700});
  for(let i=0;i<=n;i++){const x=X0+i*W+20,a=clamp(0.75*Math.pow(0.55,i),0.03,0.75);
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-16,70);ctx.lineTo(x-16,150);ctx.quadraticCurveTo(x,172,x+16,150);ctx.lineTo(x+16,70);ctx.stroke();
    ctx.fillStyle='rgba(210,170,60,'+a+')';ctx.beginPath();ctx.moveTo(x-14,100);ctx.lineTo(x-14,150);ctx.quadraticCurveTo(x,169,x+14,150);ctx.lineTo(x+14,100);ctx.closePath();ctx.fill();
    txt(ctx,i===0?'culture':'10⁻'+i,x,190,{s:12*k,w:700,a:'center',c:i===Math.min(p.plated,n)?PAL['rj']:PAL['cv-ink']});
    if(i<n){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+6,64);ctx.quadraticCurveTo(x+W/2,40,x+W-6,64);ctx.stroke();txt(ctx,'100 µL',x+W/2,44,{s:11*k,a:'center',c:PAL['cv-soft']});}}
  txt(ctx,'Each tube: 100 µL from the last + 900 µL broth = 10-fold dilution',X0-10,216,{s:12.5*k,c:PAL['cv-soft']});
  // plate
  const PX=250,PY=330,PR=95;ctx.fillStyle=PAL['cv-bg2'];ctx.beginPath();ctx.arc(PX,PY,PR+6,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='rgba(230,205,140,.6)';ctx.beginPath();ctx.arc(PX,PY,PR,0,6.29);ctx.fill();
  const pl=s.plate;if(pl){const show=Math.round(Math.min(pl.cols,600)*pl.t);const r=rng(pl.k*97+pl.cols);
    if(pl.cols>2000){ctx.fillStyle='rgba(240,236,220,'+(0.9*pl.t)+')';ctx.beginPath();ctx.arc(PX,PY,PR-2,0,6.29);ctx.fill();}
    else for(let i=0;i<show;i++){const a=r()*6.283,rr_=Math.sqrt(r())*(PR-6);ctx.fillStyle='#f4efe0';ctx.beginPath();ctx.arc(PX+Math.cos(a)*rr_,PY+Math.sin(a)*rr_,pl.cols>300?1.6:2.6,0,6.29);ctx.fill();}
    txt(ctx,'Plated 100 µL from 10⁻'+pl.k,PX,PY+PR+22,{s:12.5*k,w:700,a:'center'});}
  else txt(ctx,'Press Plate and incubate',PX,PY,{s:13*k,a:'center',b:'middle',c:PAL['cv-soft']});
  // calculation
  const X=420;txt(ctx,'cells/mL = colonies ÷ (dilution × volume plated)',X,280,{s:13.5*k,w:700});
  if(pl&&pl.cols>0&&pl.cols<=300){const v=pl.cols/(Math.pow(10,-pl.k)*0.1);txt(ctx,pl.cols+' ÷ (10⁻'+pl.k+' × 0.1 mL)',X,310,{s:14*k});txt(ctx,'= '+v.toExponential(2).replace('e+',' × 10^')+' cells/mL',X,338,{s:15*k,w:700,c:PAL['s3']});
    txt(ctx,(pl.cols<30?'Too few to trust (under 30)':'Countable: 30–300 colonies'),X,368,{s:12.5*k,c:pl.cols<30?PAL['s1']:PAL['cv-soft']});}
  else if(pl)txt(ctx,pl.cols===0?'No colonies: far too dilute':'Too many to count: plate a higher dilution',X,310,{s:14*k,c:PAL['s1']});}

BioLab.register(PIP);
})();
