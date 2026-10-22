(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;
/* Agent-based tissue: every cell runs G1 → S → G2 → M. Checkpoints at the end of G1 and G2 decide whether it continues.
   Slots form a hex grid (one layer = a monolayer). Cells that ignore contact inhibition can stack up to 3 deep. */
const COLS=16,ROWS=9,CAP=220,LAYERS=3;
const SLOTS=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)SLOTS.push([34+c*48+(r%2)*22,34+r*45]);
const NB=SLOTS.map((a,i)=>SLOTS.map((b,j)=>j).filter(j=>j!==i&&Math.hypot(SLOTS[j][0]-a[0],SLOTS[j][1]-a[1])<58));
const DUR={G1:10,S:8,G2:4,M:1};
const NUC={G1:'#2f9e5b',S:'#2f6fd6',G2:'#7a4fa6',M:'#3a3a44',G0:'#8a8f99',ARR:'#e08a00',APO:'#6b6b6b'};
const BODY=['#eaa596','#e8b44d','#b7334f'];
function dur(ph,c){const b=DUR[ph]*(ph==='G1'&&c.hits>=2?0.6:1);return b*(0.85+Math.random()*0.3);}
const CC={
  id:'cellcycle',hash:'cellcycle',apUnit:4,order:2,tab:'Cell cycle and cancer',kind:'Simulation',
  card:'Grow a tissue cell by cell. Break the checkpoints and watch a tumor form.',
  title:'The cell cycle, checkpoints and cancer',
  lede:{bio:'Every cell here grows, copies its DNA and divides. Normal cells only divide when they get a growth signal and have room. Break those rules and you get cancer.',
        honors:'Cells cycle through G1, S, G2 and M. Checkpoints control the cycle: growth factors, contact inhibition and the p53 protein, which stops cells with damaged DNA.',
        ap:'Cancer as a multi-hit process. Mutations accumulate when p53 fails. Oncogenes such as stuck-on Ras, and losing contact inhibition, each remove one brake on division.'},
  scale:'A layer of skin cells in a dish, seen from above. Each cell is about 20 micrometers across, and one cycle takes about 24 hours.',
  timeScale:6,dtMax:0.05,prewarm:0,sampleDt:0.5,window:240,unit:'h',timeLabel:'Time',chChange:24,chReveal:100,
  clock(sim){return 'Time '+Math.floor(sim.t)+' h (day '+(Math.floor(sim.t/24)+1)+')';},
  controls:[
    {id:'gf',label:'Growth factor',help:'The signal that tells cells to divide',type:'toggle',def:true,lvl:'bio'},
    {id:'uv',label:'UV light (DNA damage)',type:'range',min:0,max:10,step:1,def:2,unit:'',lvl:'bio',help:'Higher means more DNA damage per hour'},
    {id:'p53',label:'p53 checkpoint working',help:'Stops damaged cells to repair them, or makes them self-destruct',type:'toggle',def:true,lvl:'bio'},
    {id:'ras',label:'Ras stuck on (oncogene)',help:'Cells act as if growth factor is always present',type:'toggle',def:false,lvl:'honors'},
    {id:'ci',label:'Contact inhibition lost',help:'Cells keep dividing even when crowded',type:'toggle',def:false,lvl:'ap'}
  ],
  init(sim){const st={cells:[],cnt:new Array(SLOTS.length).fill(0),apop:0,nextId:1,born:0};
    const center=Math.floor(ROWS/2)*COLS+Math.floor(COLS/2);const near=[center,...NB[center]].concat(NB[center].flatMap(j=>NB[j])).filter((v,i,a)=>a.indexOf(v)===i).slice(0,12);
    near.forEach(sl=>{const ph=['G1','G1','G1','S','S','G2'][Math.floor(Math.random()*6)];const c={id:st.nextId++,slot:sl,layer:0,ph,t:0,hits:0,dmg:false,x:SLOTS[sl][0],y:SLOTS[sl][1],ang:Math.random()*3.14};c.dur=dur(ph,c);c.t=Math.random()*c.dur;st.cells.push(c);st.cnt[sl]++;});
    return st;},
  step(sim,dt){const p=sim.p,st=sim.st,out=[];
    const freeNb=c=>NB[c.slot].filter(j=>st.cnt[j]===0);
    const canGrow=c=>(c.hits>=1||p.ras||p.gf);
    const piles=c=>c.hits>=2||p.ci;
    for(const c of st.cells){c.t+=dt;
      if(c.ph!=='APO'&&p.uv>0&&Math.random()<p.uv*0.002*dt)c.dmg=true;
      if(c.ph==='APO'){if(c.t>=2){st.cnt[c.slot]--;st.apop++;c.dead=true;}continue;}
      if(c.ph==='ARR'){if(c.t>=c.dur){if(Math.random()<0.7){c.dmg=false;c.ph='G1';c.t=0;c.dur=1;}else{c.ph='APO';c.t=0;}}continue;}
      if(c.ph==='G0'){if(c.dmg&&p.p53){c.ph='ARR';c.t=0;c.dur=6;continue;}if(c.t>=2){c.t=0;if(canGrow(c)&&(piles(c)||freeNb(c).length)&&st.cells.length<CAP){c.ph='G1';c.dur=1;}}continue;}
      if(c.t<c.dur)continue;
      if(c.ph==='G1'){ // G1 checkpoint (restriction point)
        if(!canGrow(c)||(!piles(c)&&!freeNb(c).length)||st.cells.length>=CAP){c.ph='G0';c.t=0;continue;}
        if(c.dmg){if(p.p53){c.ph='ARR';c.t=0;c.dur=6;continue;}c.hits++;c.dmg=false;}
        c.ph='S';c.t=0;c.dur=dur('S',c);}
      else if(c.ph==='S'){c.ph='G2';c.t=0;c.dur=dur('G2',c);}
      else if(c.ph==='G2'){ // G2 checkpoint
        if(c.dmg){if(p.p53){c.ph='ARR';c.t=0;c.dur=6;continue;}c.hits++;c.dmg=false;}
        c.ph='M';c.t=0;c.dur=dur('M',c);}
      else if(c.ph==='M'){let dest=-1,layer=0;const f=freeNb(c);
        if(f.length)dest=f[Math.floor(Math.random()*f.length)];
        else if(piles(c)){const opts=[c.slot,...NB[c.slot]].filter(j=>st.cnt[j]<LAYERS);if(opts.length){opts.sort((a,b)=>st.cnt[a]-st.cnt[b]);dest=opts[0];layer=st.cnt[dest];}}
        if(dest<0||st.cells.length+out.length>=CAP){c.ph='G0';c.t=0;continue;}
        const d={id:st.nextId++,slot:dest,layer,ph:'G1',t:0,hits:c.hits,dmg:false,x:c.x,y:c.y,ang:Math.random()*3.14};d.dur=dur('G1',d);st.cnt[dest]++;out.push(d);st.born++;
        c.ph='G1';c.t=0;c.dur=dur('G1',c);}
    }
    if(out.length)st.cells.push(...out);
    if(st.cells.some(c=>c.dead))st.cells=st.cells.filter(c=>!c.dead);},
  metrics:[
    {id:'cells',label:'Cells',unit:'',lvl:'bio',min:0,max:CAP,d:0,get:s=>s.st.cells.length},
    {id:'cyc',label:'Cells growing and dividing',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>{const n=s.st.cells.length;return n?100*s.st.cells.filter(c=>c.ph==='G1'||c.ph==='S'||c.ph==='G2'||c.ph==='M').length/n:0;}},
    {id:'mut',label:'Cells with mutations',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>{const n=s.st.cells.length;return n?100*s.st.cells.filter(c=>c.hits>=1).length/n:0;}},
    {id:'mi',label:'Mitotic index (in M)',unit:'%',lvl:'honors',min:0,max:20,d:1,get:s=>{const n=s.st.cells.length;return n?100*s.st.cells.filter(c=>c.ph==='M').length/n:0;}},
    {id:'apop',label:'Died by apoptosis',unit:'cells',lvl:'honors',min:0,max:null,d:0,get:s=>s.st.apop},
    {id:'cancer',label:'Cancer cells (2+ mutations)',unit:'',lvl:'honors',min:0,max:CAP,d:0,get:s=>s.st.cells.filter(c=>c.hits>=2).length},
    {id:'pile',label:'Cells piled on top',unit:'',lvl:'ap',min:0,max:80,d:0,get:s=>s.st.cells.filter(c=>c.layer>0).length},
    {id:'phases',label:'Cells in each phase',unit:'',lvl:'honors',text:true,noTrial:true,get:s=>{const n=s.st.cells.length||1,f=ph=>Math.round(100*s.st.cells.filter(c=>c.ph===ph).length/n);return 'G1 '+f('G1')+'% · S '+f('S')+'% · G2 '+f('G2')+'% · M '+f('M')+'% · G0 '+f('G0')+'%';}}
  ],
  graphs:[{id:'cells',label:'Number of cells',lvl:'bio',lines:['cells']},{id:'cyc',label:'Cells growing and dividing',lvl:'bio',lines:['cyc']},{id:'mut',label:'Cells with mutations',lvl:'bio',lines:['mut']},
    {id:'mi',label:'Mitotic index',lvl:'honors',lines:['mi']},{id:'apop',label:'Apoptosis (total)',lvl:'honors',lines:['apop']},{id:'cancer',label:'Cancer cells',lvl:'honors',lines:['cancer']},{id:'pile',label:'Cells piled on top',lvl:'ap',lines:['pile']}],
  defaultGraph:'cells',
  challenges:[
    {lvl:'bio',q:'The growth factor is removed. What happens to cell division?',
     choices:['Cells keep dividing at the same rate','Cells finish their current cycle, then stop and rest','All the cells die right away'],correct:1,
     change:{gf:false},at:24,reveal:80,changeText:'Growth factor removed',watch:'cyc',
     explain:{bio:'Normal cells only commit to dividing when a growth signal tells them to. Without it, each cell finishes the cycle it already started, then stops at the first checkpoint and rests.',
              honors:'Without growth factor, cells fail the G1 checkpoint (the restriction point) and exit into G0. Cells already in S, G2 or M finish, because the commitment was made in G1.'}},
    {lvl:'bio',q:'Healthy cells keep dividing until the dish fills up. What happens then?',
     choices:['They keep dividing and pile up on top of each other','They stop dividing once they are surrounded','They all die'],correct:1,
     reveal:200,changeText:'Watching the dish fill up',watch:'cyc',
     explain:{bio:'Normal cells stop dividing when they touch neighbors on every side. This is contact inhibition, and it is why your skin doesn’t keep thickening forever. A few divisions still happen where a cell dies and leaves a gap.'}},
    {lvl:'honors',q:'p53 is broken, and the tissue gets heavy UV. What happens over the next week?',
     choices:['Damaged cells are repaired, so nothing changes','Cells with mutations survive, divide and spread','All the cells die'],correct:1,
     baseline:{p53:false},change:{uv:8},at:10,reveal:220,changeText:'UV raised to 8',watch:'mut',
     explain:{honors:'Without p53, nothing stops a cell from copying damaged DNA. The errors become permanent mutations and pass to both daughter cells. Cells with two hits stop obeying contact inhibition and start to pile up: the start of a tumor.',
              ap:'p53 is a tumor suppressor. Losing it doesn’t cause cancer directly; it lets mutations accumulate. Each new hit, like an oncogene or lost contact inhibition, removes another brake. That is why most cancers carry a p53 mutation.'}},
    {lvl:'honors',q:'Same heavy UV, but this time p53 is working. What happens?',
     choices:['Mutations spread quickly','Damaged cells get repaired or self-destruct, so mutations stay rare','Cells stop dividing forever'],correct:1,
     change:{uv:8},at:10,reveal:160,changeText:'UV raised to 8',watch:'apop',
     explain:{honors:'p53 halts damaged cells at the checkpoint. Most get repaired and carry on; the ones that can’t be fixed undergo apoptosis (programmed cell death). Watch the apoptosis count climb while mutations stay at zero.'}},
    {lvl:'honors',q:'Ras is stuck on. Now the growth factor is removed. What happens?',
     choices:['Cells keep dividing as if growth factor were still there','Division stops, as in normal tissue','Cells die'],correct:0,
     baseline:{ras:true},change:{gf:false},at:24,reveal:80,changeText:'Growth factor removed',watch:'cyc',
     explain:{honors:'Ras is part of the growth-factor signaling pathway. A mutation that locks it on sends a “divide” signal nonstop, so cells ignore the missing growth factor. Ras is an oncogene, mutated in about a quarter of human cancers.'}},
    {lvl:'ap',q:'These cells have lost contact inhibition. What happens when the dish is full?',
     choices:['They stop dividing, like normal cells','They keep dividing and pile up in layers','They migrate off the dish'],correct:1,
     baseline:{ci:true},reveal:260,changeText:'Watching the dish fill up',watch:'cells',
     explain:{ap:'Without contact inhibition, crowding no longer triggers the G1 arrest, so the cell count keeps rising past one full layer (144 cells here) and cells stack up. In real tumors this produces a mass, and combined with other hits, invasion.'}},
    {lvl:'ap',q:'p53 is working. UV jumps from 1 to 10. What happens to apoptosis?',
     choices:['It stays about the same','It rises sharply','It drops'],correct:1,
     baseline:{uv:1},change:{uv:10},at:20,reveal:110,changeText:'UV raised to 10',watch:'apop',
     explain:{ap:'More damage means more cells arrested at checkpoints, and a fixed fraction of those cannot be repaired. Apoptosis rises in proportion to the damage. Killing a damaged cell protects the organism from cancer, at the cost of some tissue.'}}
  ],
  initVis(sim){sim.vis.gf=[];const r=rng(9);for(let i=0;i<24;i++)sim.vis.gf.push([r()*800,r()*420,r()*6.28]);sim.vis.fid=null;},
  thumbSetup(sim){for(let i=0;i<1200;i++)this.step(sim,0.05);},
  draw(sim,ctx,vdt,k,t){const st=sim.st,p=sim.p,hon=atLeast('honors'),R=RM?0:1;
    ctx.fillStyle=PAL['cv-sol'];ctx.fillRect(0,0,800,450);
    if(p.uv>0){ctx.strokeStyle='rgba(140,90,230,'+(0.04+p.uv*0.025)+')';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<14;i++){const x=(i*61+t*40*R)%840-20;ctx.moveTo(x,0);ctx.lineTo(x-60,420);}ctx.stroke();}
    if(p.gf){ctx.fillStyle=PAL['s3'];ctx.globalAlpha=.55;sim.vis.gf.forEach(g=>{ctx.beginPath();ctx.arc((g[0]+Math.sin(t*.5+g[2])*14*R)%800,g[1]+Math.cos(t*.4+g[2])*10*R,3,0,6.29);ctx.fill();});ctx.globalAlpha=1;}
    const cells=st.cells.slice().sort((a,b)=>a.layer-b.layer);
    for(const c of cells){const tx=SLOTS[c.slot][0]-c.layer*5,ty=SLOTS[c.slot][1]-c.layer*6,a=Math.min(1,vdt*5);c.x+=(tx-c.x)*a;c.y+=(ty-c.y)*a;if(!vdt&&!c._p){c.x=tx;c.y=ty;}c._p=1;
      let r=20,alpha=1;if(c.ph==='APO'){r=20*(1-c.t/2*0.6);alpha=1-c.t/2*0.7;}
      ctx.globalAlpha=alpha;const body=BODY[Math.min(2,c.hits)];
      if(c.layer>0){ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.arc(c.x+3,c.y+4,r,0,6.29);ctx.fill();}
      if(c.ph==='M'){const f=clamp(c.t/c.dur,0,1),off=f*13,dx=Math.cos(c.ang)*off,dy=Math.sin(c.ang)*off;
        ctx.fillStyle=body;ctx.strokeStyle='rgba(60,30,30,.55)';ctx.lineWidth=1.5;
        [[-1],[1]].forEach(s=>{ctx.beginPath();ctx.arc(c.x+dx*s[0],c.y+dy*s[0],r-3*f,0,6.29);ctx.fill();ctx.stroke();});
        ctx.fillStyle='#3a3a44';const sep=f<0.45?0:(f-0.45)*16;
        for(let j=-1;j<=1;j++){const px=-Math.sin(c.ang)*j*5,py=Math.cos(c.ang)*j*5;[-1,1].forEach(s=>{ctx.beginPath();ctx.arc(c.x+px+Math.cos(c.ang)*sep*s,c.y+py+Math.sin(c.ang)*sep*s,2.4,0,6.29);ctx.fill();});}}
      else{ctx.fillStyle=body;ctx.strokeStyle='rgba(60,30,30,.55)';ctx.lineWidth=1.5;ctx.beginPath();
        if(c.ph==='APO'){for(let j=0;j<8;j++){const an=j*Math.PI/4;ctx.moveTo(c.x+Math.cos(an)*r+3,c.y+Math.sin(an)*r);ctx.arc(c.x+Math.cos(an)*r,c.y+Math.sin(an)*r,3,0,6.29);}ctx.moveTo(c.x+r,c.y);}
        ctx.arc(c.x,c.y,r,0,6.29);ctx.fill();ctx.stroke();
        const nr=c.ph==='G2'?9:c.ph==='S'?8:7;ctx.fillStyle=NUC[c.ph];ctx.beginPath();ctx.arc(c.x,c.y,nr,0,6.29);ctx.fill();
        if(c.ph==='S'){ctx.strokeStyle='#fff';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(c.x,c.y,nr-3,-1.57,-1.57+6.28*clamp(c.t/c.dur,0,1));ctx.stroke();}
        if(c.ph==='ARR')txt(ctx,'!',c.x,c.y+1,{s:11,w:800,c:'#fff',a:'center',b:'middle'});}
      if(c.dmg&&c.ph!=='APO'){ctx.strokeStyle='#ffd23f';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(c.x+4,c.y-11);ctx.lineTo(c.x-1,c.y-3);ctx.lineTo(c.x+3,c.y-3);ctx.lineTo(c.x-3,c.y+6);ctx.stroke();}
      ctx.globalAlpha=1;}
    // legend
    const ly=437;let lx=14;const item=(col,label,ring)=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(lx+6,ly-4,6,0,6.29);ctx.fill();if(ring){ctx.strokeStyle='rgba(60,30,30,.55)';ctx.lineWidth=1;ctx.stroke();}txt(ctx,label,lx+16,ly,{s:11.5*k,c:PAL['cv-ink']});ctx.font='400 '+11.5*k+'px '+FONT;lx+=ctx.measureText(label).width+30;};
    item(NUC.G1,hon?'G1':'growing');item(NUC.S,hon?'S':'copying DNA');item(NUC.G2,hon?'G2':'getting ready');item(NUC.M,hon?'M':'dividing');item(NUC.G0,hon?'G0 (resting)':'resting');
    if(hon)item(NUC.ARR,'arrested by p53');item(BODY[1],'1 mutation',true);item(BODY[2],hon?'cancer (2+)':'cancer',true);
    if(st.cells.length>=CAP)pill(ctx,'Dish full',740,20,'#3a3a44','#fff',11*k);
  },
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),n=st.cells.length,mut=st.cells.filter(c=>c.hits>=1).length,cyc=st.cells.filter(c=>c.ph==='G1'||c.ph==='S'||c.ph==='G2'||c.ph==='M').length;
    const piled=st.cells.filter(c=>c.layer>0).length;
    if(piled>5)return '<b>Cells are piling on top of each other</b> ('+piled+' so far). '+(p.ci?'They have lost contact inhibition, so crowding no longer stops them.':'Cells with two or more mutations ignore crowding.')+' This is how a tumor forms.';
    if(!p.p53&&mut>0)return '<b>p53 is broken, so damaged DNA gets copied anyway.</b> The errors become mutations that pass to both daughter cells. '+mut+' of '+n+' cells now carry at least one.';
    if(!p.gf&&!p.ras&&cyc<n*0.15)return '<b>No growth factor.</b> Cells finished their current cycle and are now resting in '+(hon?'G0':'a quiet state')+', waiting for a signal to divide.';
    if(!p.gf&&!p.ras)return '<b>No growth factor.</b> Cells already past the checkpoint finish dividing, but no new cells start a cycle.';
    if(p.ras&&!p.gf)return '<b>Ras is stuck on</b>, so cells divide as if growth factor were present. Only running out of room stops them.';
    if(p.p53&&p.uv>=5)return '<b>UV is damaging DNA</b> (yellow bolts). p53 stops damaged cells at a checkpoint (orange) to repair them; cells that can’t be fixed self-destruct. Apoptosis so far: '+st.apop+'.';
    if(n>=130&&cyc<n*0.3)return '<b>The dish is full.</b> Cells surrounded on all sides stop dividing. This is contact inhibition. Only cells next to a gap still divide.';
    return 'The tissue is growing: '+n+' cells, with '+cyc+' of them in the cycle. '+(hon?'G1 (grow), S (copy DNA), G2 (prepare), M (divide).':'Each cell grows, copies its DNA, then splits in two.')+' A full cycle takes about a day.';},
  tour:(function(){const pick=ph=>sim=>{const st=sim.st;let c=st.cells.find(c=>c.id===sim.vis.fid&&c.ph===ph);if(!c){const cs=st.cells.filter(c=>c.ph===ph&&c.layer===0);if(!cs.length)return [0,0,800,425];c=cs.sort((a,b)=>Math.hypot(a.x-400,a.y-210)-Math.hypot(b.x-400,b.y-210))[0];sim.vis.fid=c.id;}return [c.x-32,c.y-32,64,64];};
    return [
    {title:'G1: the cell grows',text:{bio:'Look at the highlighted cell. Its green center means it is growing and doing its everyday job.',honors:'G1 is the main growth phase. At the end of G1 the cell reaches a checkpoint: is there a growth signal, room to divide, and undamaged DNA?'},focus:pick('G1'),speed:0.1},
    {title:'S: DNA is copied',text:{bio:'Blue center: the cell is making a complete copy of its DNA. The white ring fills up as copying goes on.',honors:'In S phase the cell replicates all of its DNA. Each chromosome becomes two identical sister chromatids.'},focus:pick('S'),speed:0.1},
    {title:'G2: getting ready',text:{bio:'Purple center: the cell checks its copied DNA and gets ready to split.',honors:'G2 is a second growth phase, ending in the G2 checkpoint, which makes sure DNA was copied correctly.'},focus:pick('G2'),speed:0.1},
    {title:'M: the cell divides',text:{bio:'Watch: the cell stretches, the chromosomes pull apart, and it pinches into two cells.',honors:'Mitosis separates the sister chromatids into two nuclei, and cytokinesis splits the cell in two. It takes about an hour.'},focus:pick('M'),speed:0.05},
    {title:'No signal, no division',text:{bio:'Now the growth factor is removed. Cells finish what they started, then stop and rest (grey).',honors:'Without growth factor, cells fail the G1 checkpoint and enter G0, a resting state.'},focus:[0,0,800,425],speed:1,setup(sim){BioLab.setValues(sim,{gf:false});}},
    {title:'p53 guards the DNA',text:{bio:'Growth factor is back, and now strong UV light damages DNA (yellow bolts). The p53 protein stops damaged cells (orange) until they are fixed, or makes them self-destruct.',honors:'p53 arrests damaged cells at the G1 and G2 checkpoints. If repair fails, it triggers apoptosis.'},focus:[0,0,800,425],speed:1,setup(sim){BioLab.setValues(sim,{gf:true,uv:8});}},
    {title:'When the guard fails',text:{bio:'Now p53 is broken. Damaged cells keep dividing and pass on mutations (amber). Cells with two mutations (dark red) ignore crowding and pile up into a tumor.',honors:'Without p53, damage becomes permanent mutation. Two hits here remove contact inhibition, and those cells stack up into a growing mass.'},focus:[0,0,800,425],speed:3,setup(sim){BioLab.setValues(sim,{p53:false});}}];})(),
  onTourExit(sim){BioLab.setValues(sim,{gf:true,uv:2,p53:true});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> How does UV light affect mutations when p53 is broken?</p><ol><li>Turn p53 off.</li><li>For UV 0, 2, 5 and 8: press Reset, let the sim run to about 150 hours, then record a trial.</li><li>Plot UV (x) against cells with mutations (y).</li></ol><p>Explain why sunscreen and a working p53 both lower cancer risk.</p>',
       honors:'<p><b>Question:</b> How do the different “brakes” on division compare?</p><ol><li>Run four trials to 150 hours each, pressing Reset in between: normal; growth factor off; Ras on with growth factor off; p53 off with UV 8.</li><li>Record cells, cells growing and dividing, mutations and apoptosis for each.</li></ol><p>Which changes are like a stuck gas pedal, and which are like broken brakes? Use proto-oncogene and tumor suppressor in your answer.</p>',
       ap:'<p><b>Question:</b> Why does cancer usually need several mutations?</p><ol><li>Compare cell count and cells piled on top at 250 hours for: Ras only; contact inhibition lost only; p53 off with UV 6; and all three together.</li><li>Record the time when the cell count first passes 144 (one full layer).</li></ol><p><b>Claim–evidence–reasoning:</b> Use the multi-hit model to explain why cancer risk rises steeply with age.</p>'},
  terms:[{t:'Cell cycle',d:'The repeating series of growth, DNA copying and division.'},{t:'Mitosis',d:'Division of the nucleus into two identical nuclei.'},{t:'Growth factor',d:'A signal from other cells that tells a cell to divide.'},{t:'Contact inhibition',d:'Normal cells stop dividing when they touch neighbors on all sides.'},{t:'Cancer',d:'Cells that divide out of control, ignoring the normal signals.'},
    {lvl:'honors',t:'Checkpoint',d:'A control point where the cell checks conditions before going on to the next phase.'},{lvl:'honors',t:'p53',d:'A tumor-suppressor protein that halts cells with damaged DNA and can trigger apoptosis.'},{lvl:'honors',t:'Apoptosis',d:'Programmed cell death: the cell neatly destroys itself.'},{lvl:'honors',t:'G0',d:'A resting state outside the cycle.'},{lvl:'honors',t:'Oncogene',d:'A mutated gene, like Ras, that pushes a cell to divide.'},
    {lvl:'ap',t:'Tumor suppressor',d:'A gene whose normal job is to stop division. Both copies usually need to be lost.'},{lvl:'ap',t:'Multi-hit model',d:'Cancer develops as several independent mutations accumulate in one cell line.'},{lvl:'ap',t:'Mitotic index',d:'The percent of cells in mitosis at one moment.'}],
  about:'<p>Agent-based model. Each cell is an individual with a phase timer: G1 about 10 h, S 8 h, G2 4 h and M 1 h, each ±15%. At the end of G1 the cell needs growth factor (or a mutation or stuck-on Ras), a free neighboring space (unless it ignores contact inhibition), and no DNA damage, or it rests in G0 and rechecks every 2 hours. UV damages each cell’s DNA at 0.2% per UV unit per hour. With p53, a damaged cell arrests for 6 hours: 70% are repaired and 30% undergo apoptosis. Without p53, the damage becomes a permanent mutation passed to both daughters. One mutation lets a cell divide without growth factor; two mutations also remove contact inhibition and shorten G1.</p><p>Simplified: real cancers need more hits, cells don’t move, and the dish holds at most 220 cells in up to three layers.</p>'
};
BioLab.register(CC);
})();
