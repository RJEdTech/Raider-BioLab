(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;

/* Nutrient tests: composition in g per 100 mL (sugar = reducing sugar; sucrose is non-reducing). */
const KNOWN=[
  {id:'water',name:'Water',short:['Water'],c:{},col:'#d9ecf5'},
  {id:'glucose',name:'Glucose solution',short:['Glucose'],c:{sugar:10},col:'#e4f0f5'},
  {id:'starch',name:'Starch solution',short:['Starch'],c:{starch:4},col:'#eceff1'},
  {id:'egg',name:'Egg white',short:['Egg','white'],c:{protein:10},col:'#f2eed8'},
  {id:'oil',name:'Vegetable oil',short:['Oil'],c:{lipid:100},col:'#e6cd52'},
  {id:'milk',name:'Milk',short:['Milk'],c:{sugar:5,protein:3.4,lipid:3.5},col:'#f6f4ec'},
  {id:'potato',name:'Potato',short:['Potato'],c:{starch:15,sugar:0.6,protein:2},col:'#e8ddc0'},
  {id:'apple',name:'Apple juice',short:['Apple','juice'],c:{sugar:10},col:'#e8c26b'}
];
const POOL=[
  {id:'honey',name:'Honey',c:{sugar:30},col:'#e3a83a'},
  {id:'gelatin',name:'Gelatin',c:{protein:8},col:'#efe3c4'},
  {id:'butter',name:'Melted butter',c:{lipid:80},col:'#efd468'},
  {id:'yolk',name:'Egg yolk',c:{lipid:27,protein:16},col:'#efb42f'},
  {id:'sports',name:'Sports drink',c:{sugar:2},col:'#f0d2e1'},
  {id:'sucrose',name:'Table sugar (sucrose) solution',c:{sucrose:10},col:'#e5eef2'},
  {id:'flour',name:'Flour paste',c:{starch:12,protein:2},col:'#efece4'},
  {id:'onion',name:'Onion juice',c:{sugar:4},col:'#ece9d6'},
  {id:'peanut',name:'Peanut butter slurry',c:{lipid:50,protein:25,sugar:0.6},col:'#cfa66d'},
  {id:'broth',name:'Chicken broth',c:{protein:2,lipid:1},col:'#d7b878'},
  {id:'cornstarch',name:'Cornstarch',c:{starch:10},col:'#f1f2f2'}
];
const RG={benedict:{name:'Benedict’s',tests:'reducing sugars',col:'#2f63c9',heat:true},iodine:{name:'Iodine',tests:'starch',col:'#c8892e'},
  biuret:{name:'Biuret',tests:'protein',col:'#4b7fd8'},sudan:{name:'Sudan III',tests:'lipids (fats and oils)',col:'#d84a4a'}};
const RKEYS=['benedict','iodine','biuret','sudan'];
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const mixC=(a,b,t)=>{const A=hex(a),B=hex(b);return '#'+A.map((v,i)=>Math.round(lerp(v,B[i],clamp(t,0,1))).toString(16).padStart(2,'0')).join('');};
const BEN=[[0,'#2f63c9','Blue','−'],[0.5,'#3f9d4a','Green','+ trace'],[1.5,'#d9c22e','Yellow','+ low'],[4,'#e07a22','Orange','+ moderate'],[8,'#a8341f','Brick red','+ high']];
function benedictColor(sugar){let c=BEN[0][1];for(let i=1;i<BEN.length;i++){const a=BEN[i-1],b=BEN[i];if(sugar>=b[0])c=b[1];else{c=mixC(a[1],b[1],(sugar-a[0])/(b[0]-a[0]));break;}}return c;}
function benedictLabel(sugar){let r=BEN[0];for(const b of BEN)if(sugar>=b[0])r=b;return r;}

function samples(sim){return KNOWN.concat(sim.st.unk.map((u,i)=>Object.assign({},u,{short:[String.fromCharCode(65+i)],label:'Unknown '+String.fromCharCode(65+i)})));}
function nameOf(sm){return sm.label||sm.name;}
// final appearance + result text of sample sm with reagent r after heating h (min)
function outcome(sm,r,h){const c=sm.c;
  if(r==='benedict'){const eff=(c.sugar||0)*clamp(h/4,0,1);const L=benedictLabel(h>=4?(c.sugar||0):eff);
    if(h<0.5)return {col:RG.benedict.col,txt:'Blue (not heated)',pos:false,heated:false};
    return {col:benedictColor(eff),txt:L[2]+' ('+L[3]+')',pos:(c.sugar||0)>=0.5&&h>=4,heated:h>=4};}
  if(r==='iodine'){const s=clamp((c.starch||0)/2,0,1);return {col:mixC(RG.iodine.col,'#1e1b3b',s),txt:s>0.2?'Blue-black (+)':'Amber (−)',pos:s>0.2};}
  if(r==='biuret'){const p=clamp((c.protein||0)/5,0,1);return {col:mixC(RG.biuret.col,'#7b3fb0',p),txt:p>0.25?(p>0.7?'Violet (+)':'Lilac (+ low)'):'Blue (−)',pos:p>0.25};}
  const l=c.lipid||0;return {col:l>1?'#c8332e':'#eba4ab',layer:l>1?clamp(l/30,0.12,1):0,txt:l>1?'Red layer on top (+)':'Pink, no layer (−)',pos:l>1};}

const TX=i=>i<8?62+i*62:560+(i-8)*58;
const SIM={
  id:'foodtests',hash:'foodtests',apUnit:1,order:3,kind:'Virtual lab',tab:'Food tests lab',
  card:'Test foods with Benedict’s, iodine, Biuret and Sudan III, then use the results to identify four mystery samples.',
  title:'Identifying nutrients: the food tests lab',
  lede:{bio:'Each reagent changes color when one kind of nutrient is present. Test known foods first, then figure out what the unknowns contain.',
        honors:'Build a results table with positive and negative controls, then use it to identify four unknown samples.',
        ap:'Go beyond yes or no. Benedict’s color shows roughly how much reducing sugar is present, and some sugars do not react at all.'},
  scale:'Real lab scale: 10 mL test tubes in a rack, about 15 cm tall. The nutrients themselves are molecules a few nanometers across.',
  timeless:true,animated:true,graph:false,trials:false,chReveal:6,controlsTitle:'Lab bench',
  controls:[
    {id:'reagent',label:'Reagent',type:'seg',def:'benedict',lvl:'bio',options:[{v:'benedict',l:'Benedict’s'},{v:'iodine',l:'Iodine'},{v:'biuret',l:'Biuret'},{v:'sudan',l:'Sudan III'}],
     help:'Each reagent tests for one nutrient.'},
    {id:'tube',label:'Selected tube',type:'select',def:'0',lvl:'bio',options:KNOWN.map((k,i)=>({v:String(i),l:k.name})).concat(['A','B','C','D'].map((L,i)=>({v:String(8+i),l:'Unknown '+L})))}
  ],
  actions:[
    {id:'add',label:'Add reagent to selected tube',primary:true,run(sim){addTube(sim,+sim.p.tube,0);}},
    {id:'addAll',label:'Add to every tube',run(sim){for(let i=0;i<12;i++)addTube(sim,i,i*0.08);}},
    {id:'heat',label:'Heat in water bath (5 min)',run(sim){sim.st.bath={t:0,on:true,rg:sim.p.reagent};}},
    {id:'rinse',label:'Clean these tubes',run(sim){sim.st.tubes[sim.p.reagent]=freshTubes();sim.st.bath=null;}},
    {id:'newUnk',label:'New unknowns',lvl:'honors',run(sim){sim.st.round++;pickUnknowns(sim);RKEYS.forEach(r=>{for(let i=8;i<12;i++)sim.st.tubes[r][i]={added:0,mix:0,heat:0,delay:0};});
      for(let i=8;i<12;i++)sim.st.res[i]={};if(sim.ch)BioLab.gotoChallenge(sim,sim.ch.idx||0);}}
  ],
  init(sim){const st={round:(sim.st&&sim.st.round)||1,unk:[],tubes:{},res:{},bath:null,drops:[]};RKEYS.forEach(r=>st.tubes[r]=freshTubes());for(let i=0;i<12;i++)st.res[i]={};sim.st=st;pickUnknowns(sim);return st;},
  step(sim,dt){const st=sim.st;
    RKEYS.forEach(r=>st.tubes[r].forEach((tb,i)=>{if(!tb.added)return;if(tb.delay>0){tb.delay-=dt;return;}tb.mix=Math.min(1,tb.mix+dt/1.2);if(tb.mix>=1)record(sim,i,r);}));
    if(st.bath&&st.bath.on){const inc=dt*5/4;st.bath.t=Math.min(5,st.bath.t+inc);st.tubes[st.bath.rg].forEach((tb,i)=>{if(tb.added&&tb.mix>=1){tb.heat=Math.min(5,tb.heat+inc);record(sim,i,st.bath.rg);}});if(st.bath.t>=5)st.bath.on=false;}
    st.drops=st.drops.filter(d=>(d.t+=dt)<0.7+d.delay);},
  metrics:[
    {id:'sel',label:'Selected tube',text:true,lvl:'bio',get:s=>nameOf(samples(s)[+s.p.tube])},
    {id:'res',label:'Result with this reagent',text:true,lvl:'bio',get:s=>{const r=s.st.res[+s.p.tube][s.p.reagent];return r?r.txt:'Not tested yet';}},
    {id:'done',label:'Results recorded',unit:'of 48',lvl:'bio',min:0,max:48,d:0,get:s=>Object.values(s.st.res).reduce((a,o)=>a+Object.keys(o).length,0)}
  ],
  infoPanel(sim){const S=samples(sim),ap=atLeast('ap'),hon=atLeast('honors');
    let h='<div class="p-head"><h3>Results table</h3></div><div class="tbl-wrap"><table><thead><tr><th>Sample</th>'+RKEYS.map(r=>`<th>${RG[r].name}<br><span style="font-weight:400">${RG[r].tests.split(' ')[0]}</span></th>`).join('')+'</tr></thead><tbody>';
    S.forEach((sm,i)=>{h+=`<tr><td>${nameOf(sm)}</td>`+RKEYS.map(r=>{const o=sim.st.res[i][r];if(!o)return '<td></td>';
      const t=ap||r!=='benedict'?o.txt:(o.txt.includes('not heated')?o.txt:(o.pos?'+':'−')+' '+o.txt.split(' (')[0]);
      return `<td style="text-align:left"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-1px;margin-right:5px;background:${o.col};border:1px solid rgba(0,0,0,.25)"></span>${t}</td>`;}).join('')+'</tr>';});
    h+='</tbody></table></div>';
    if(ap)h+='<p class="help" style="margin-top:8px"><b>Benedict’s color chart</b> (after 5 min at 80 °C): blue = none · green = trace (≈0.5%) · yellow = low (≈1–2%) · orange = moderate (≈4%) · brick red = high (≥8%).</p>';
    else if(hon)h+='<p class="help" style="margin-top:8px">Compare each unknown’s row with the known foods. Water is your negative control.</p>';
    return h;},
  challenges(sim){const S=samples(sim),A=S[8],r=rng(sim.st.round*7+3),others=POOL.filter(p=>p.id!==A.id).sort(()=>r()-.5).slice(0,3);
    const words=RKEYS.map(k=>{const o=outcome(A,k,5);return RG[k].name+': '+o.txt.replace(/ \(.*/,'').toLowerCase();}).join('; ');
    const opts=[A.name].concat(others.map(o=>o.name)).map((n,i)=>({n,k:r()})).sort((a,b)=>a.k-b.k).map(o=>o.n);
    return [
    {lvl:'bio',q:'You add Benedict’s reagent to the glucose tube and heat it in the water bath. What color will it turn?',choices:['It stays blue','Orange to brick red','Purple'],correct:1,
     baseline:{reagent:'benedict',tube:'1'},baselineAction:'addAll',at:1.5,changeAction:'heat',changeText:'Rack placed in the hot water bath',reveal:7,
     explain:{bio:'Glucose is a reducing sugar. When heated, it changes the blue copper ions in Benedict’s to a red-orange solid. Lots of sugar gives brick red.',ap:'Glucose’s free aldehyde group reduces Cu²⁺ (blue) to Cu⁺, which precipitates as red-orange copper(I) oxide. Heat is needed to drive the reaction.'}},
    {lvl:'bio',q:'Why does the lab include a tube of plain water?',choices:['To dilute the reagents','As a negative control, to show what a “no” result looks like','Water contains a little of every nutrient'],correct:1,instant:true,
     explain:'Water has none of the nutrients, so its color is what a negative result looks like. Comparing every other tube with it keeps you from mistaking the reagent’s own color for a positive.'},
    {lvl:'bio',q:'You add iodine to every tube. What color does the potato tube turn?',choices:['Stays amber-brown','Blue-black','Violet'],correct:1,
     baseline:{reagent:'iodine',tube:'6'},at:0.5,changeAction:'addAll',changeText:'Iodine added to every tube',reveal:4,
     explain:'Potatoes store energy as starch. Iodine fits inside the coiled starch molecule and turns blue-black. Tubes without starch stay amber.'},
    {lvl:'honors',q:'Unknown A gave these results. '+words+'. Which food is it most likely to be?',choices:opts,correct:opts.indexOf(A.name),instant:true,
     explain:'Match each test to its nutrient: Benedict’s means reducing sugar, iodine means starch, Biuret means protein and Sudan III means lipids. '+A.name+' contains '+(Object.keys(A.c).map(k=>({sugar:'reducing sugar',starch:'starch',protein:'protein',lipid:'fat',sucrose:'sucrose (which does not react with Benedict’s)'}[k])).join(' and ')||'none of these')+'.'},
    {lvl:'honors',q:'You add Benedict’s to every tube but skip the water bath. After a few minutes, what does the glucose tube look like?',choices:['Brick red','Still blue','Green'],correct:1,
     baseline:{reagent:'benedict',tube:'1'},at:0.5,changeAction:'addAll',changeText:'Benedict’s added, no heating',reveal:5,
     explain:'Benedict’s reaction needs heat. Without the water bath, even a strong sugar solution stays blue, a common reason for a false negative.'},
    {lvl:'honors',q:'Which nutrients will the tests find in milk?',choices:['Only protein','Reducing sugar, protein and fat','Only fat'],correct:1,instant:true,
     explain:'Milk contains lactose (a reducing sugar), casein proteins and fat droplets, so it is positive for Benedict’s, Biuret and Sudan III. It has no starch.'},
    {lvl:'ap',q:'After heating with Benedict’s, apple juice turns brick red and a sports drink turns green. What can you conclude?',choices:['The sports drink has more reducing sugar','Apple juice has much more reducing sugar','They have the same amount'],correct:1,instant:true,
     explain:'Benedict’s is semi-quantitative: the more reducing sugar, the more copper(I) oxide forms, shifting color from green to yellow, orange and brick red. Apple juice is about 10% sugar; many sports drinks are about 2%.'},
    {lvl:'ap',q:'A solution of table sugar (sucrose) stays blue with Benedict’s, even after heating. Why?',choices:['Sucrose is not a sugar','Sucrose is a non-reducing sugar: both reducing ends are tied up in the glycosidic bond','The water bath was too cold'],correct:1,instant:true,
     explain:'In sucrose, the glycosidic bond joins the reducing carbons of glucose and fructose, so no free aldehyde or ketone remains. Boiling it with acid (or adding sucrase) first hydrolyzes it into glucose and fructose, which then test positive.'}];},
  narrate(sim){const st=sim.st,r=sim.p.reagent,rg=RG[r],tubes=st.tubes[r],sel=+sim.p.tube,sm=samples(sim)[sel],tb=tubes[sel];
    if(st.bath&&st.bath.on)return r==='benedict'?'<b>Heating…</b> In the 80 °C water bath, reducing sugars change blue Cu²⁺ ions into a red-orange solid. More sugar means a redder color.':'Heating doesn’t matter for '+rg.name+'. Only Benedict’s needs heat.';
    if(!tubes.some(t=>t.added))return 'You are testing for <b>'+rg.tests+'</b> with '+rg.name+'. Add it to a tube, or to every tube, and compare the colors with the water tube.';
    if(r==='benedict'&&tubes.some(t=>t.added&&t.heat<4))return 'The Benedict’s tubes are still blue because they haven’t been heated. Put the rack in the water bath.';
    if(tb.added&&tb.mix>=1){const o=outcome(sm,r,tb.heat);return nameOf(sm)+' with '+rg.name+': <b>'+o.txt+'</b>. '+(o.pos?'That means it contains '+rg.tests.split(' (')[0]+'.':'No '+rg.tests.split(' (')[0]+' detected.');}
    return 'Pick a tube from the list (or click one) to see its result.';},
  onClick(sim,x,y){if(y<130||y>360)return;for(let i=0;i<12;i++)if(Math.abs(x-TX(i))<24){BioLab.setValues(sim,{tube:String(i)});return;}},
  tour:[
    {title:'Set up the rack',text:'Eight known foods and four unknowns sit in the rack. Plain water is the <b>negative control</b>: it shows what “no nutrient” looks like.',focus:[30,140,745,225],speed:1},
    {title:'Iodine finds starch',text:'Iodine is amber-brown. It turns blue-black where there is starch, so watch the starch and potato tubes.',focus:[30,140,480,225],speed:1,setup(sim){BioLab.setValues(sim,{reagent:'iodine'});act(sim,'addAll');}},
    {title:'Biuret finds protein',text:'Biuret reagent is blue. Protein turns it violet: look at egg white and milk.',focus:[210,140,200,225],speed:1,setup(sim){BioLab.setValues(sim,{reagent:'biuret'});act(sim,'addAll');}},
    {title:'Benedict’s needs heat',text:'Benedict’s tests for reducing sugars like glucose. Right after you add it, every tube is still blue. Nothing happens until it is heated.',focus:[30,140,480,225],speed:1,setup(sim){BioLab.setValues(sim,{reagent:'benedict'});act(sim,'addAll');}},
    {title:'Into the water bath',text:'In an 80 °C bath, sugars reduce the copper in Benedict’s: green, yellow, orange, then brick red as sugar increases.',focus:[30,140,745,225],speed:1,setup(sim){act(sim,'heat');}},
    {title:'Sudan III finds fats',text:'Sudan III is a red dye that dissolves in fat, not water. Oils float, so a red layer forms on top when lipids are present.',focus:[260,140,200,225],speed:1,setup(sim){BioLab.setValues(sim,{reagent:'sudan'});act(sim,'addAll');}},
    {lvl:'honors',title:'Now the unknowns',text:'Each unknown is a real food. Test it with all four reagents, then match its pattern of results to the known foods.',focus:[530,140,245,225],speed:1},
    {lvl:'ap',title:'Reading the shade',text:'Benedict’s color is semi-quantitative. Compare the shades: the more reducing sugar, the further the color moves toward brick red.',focus:[30,140,480,225],speed:1,setup(sim){BioLab.setValues(sim,{reagent:'benedict'});}}
  ],
  lab:{bio:'<p><b>Question:</b> Which nutrients are in each food?</p><ol><li>For each reagent, add it to every tube. Heat the Benedict’s tubes in the water bath.</li><li>Fill in the results table: + or − for each test.</li><li>Use the known foods’ results to decide what each unknown contains.</li></ol><p>Write one sentence for each unknown: “Unknown A contains ___ because ___.”</p>',
       honors:'<p><b>Question:</b> What are the four unknowns?</p><ol><li>Test all samples with all four reagents (heat the Benedict’s tubes).</li><li>Identify the negative control and a positive control for each test.</li><li>Match each unknown to a food, then press New unknowns and try again.</li></ol><p>Explain why a positive control is needed as well as a negative one.</p>',
       ap:'<p><b>Question:</b> How much reducing sugar does each sample contain?</p><ol><li>Heat all Benedict’s tubes and rank the samples by color using the color chart.</li><li>Explain the table-sugar result, and design a test that would detect sucrose.</li></ol><p><b>Claim–evidence–reasoning:</b> Use the chemistry of reducing sugars to explain your ranking.</p>'},
  terms:[{t:'Reagent',d:'A chemical added to test for something; it changes color in a positive result.'},{t:'Negative control',d:'A sample known to lack the substance (water), showing what “no” looks like.'},
    {t:'Benedict’s reagent',d:'Tests for reducing sugars; must be heated. Blue → green → yellow → orange → brick red.'},{t:'Iodine',d:'Tests for starch. Amber → blue-black.'},
    {t:'Biuret reagent',d:'Tests for protein. Blue → violet.'},{t:'Sudan III',d:'A red dye that dissolves in lipids, forming a red layer.'},
    {lvl:'honors',t:'Positive control',d:'A sample known to contain the substance, proving the test works.'},
    {lvl:'ap',t:'Reducing sugar',d:'A sugar with a free aldehyde or ketone group that can reduce Cu²⁺ (glucose, fructose, lactose, maltose).'},{lvl:'ap',t:'Semi-quantitative',d:'Gives a rough amount (low, moderate, high), not an exact number.'}],
  about:'<p>Each sample has a fixed composition (grams per 100 mL of reducing sugar, sucrose, starch, protein and lipid). The tube color comes from that composition. Benedict’s shifts through green, yellow, orange and brick red with reducing sugar and only develops with heat (full color after about 4 minutes at 80 °C). Iodine darkens with starch, Biuret turns violet with protein, and Sudan III forms a red layer when lipids are present.</p><p><b>Simplified:</b> colors are idealized and samples are perfectly mixed. Real Biuret turns violet more slowly, real Benedict’s produces a settling precipitate, and some foods (like egg yolk or peanut butter) give murky colors that are harder to read. Unknowns are drawn from a list of 11 everyday foods.</p>',
  initVis(sim){sim.vis.steam=[];},
  draw(sim,ctx,vdt,k,t){const st=sim.st,r=sim.p.reagent,rg=RG[r],S=samples(sim),tubes=st.tubes[r],sel=+sim.p.tube,ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,345,800,105);
    // reagent bottle + header
    ctx.fillStyle=PAL['card'];rr(ctx,14,14,250,96,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle='#8a6a48';rr(ctx,30,40,40,56,6);ctx.fill();ctx.fillStyle=rg.col;rr(ctx,34,58,32,34,4);ctx.fill();ctx.fillStyle='#333';ctx.fillRect(40,28,20,14);
    txt(ctx,rg.name,82,42,{s:15*k,w:700});txt(ctx,'tests for '+rg.tests,82,62,{s:12*k,c:PAL['cv-soft']});
    if(rg.heat)txt(ctx,'Needs heating in a water bath',82,82,{s:12*k,w:600,c:PAL['s1']});
    // racks
    ctx.fillStyle='#9b6b3e';rr(ctx,26,255,485,16,4);ctx.fill();rr(ctx,26,298,485,12,3);ctx.fill();rr(ctx,530,255,248,16,4);ctx.fill();rr(ctx,530,298,248,12,3);ctx.fill();
    txt(ctx,'Known foods',268,138,{s:12.5*k,w:700,a:'center',c:PAL['cv-soft']});txt(ctx,'Unknowns',654,138,{s:12.5*k,w:700,a:'center',c:PAL['cv-soft']});
    // tubes
    for(let i=0;i<12;i++){const x=TX(i),sm=S[i],tb=tubes[i];const top=150,bot=300,w=24;
      let col=sm.col,level=226,o=null;
      if(tb.added&&tb.delay<=0){o=outcome(sm,r,tb.heat);col=mixC(mixC(sm.col,rg.col,Math.min(1,tb.mix*2)),o.col,tb.mix);level=212;}
      // liquid
      ctx.save();ctx.beginPath();ctx.moveTo(x-w/2,top);ctx.lineTo(x-w/2,bot-w/2);ctx.arc(x,bot-w/2,w/2,Math.PI,0,true);ctx.lineTo(x+w/2,top);ctx.closePath();ctx.clip();
      ctx.fillStyle=col;ctx.fillRect(x-w/2,level,w,bot-level+2);
      if(o&&o.layer&&tb.mix>0.3){ctx.fillStyle='#c8332e';ctx.fillRect(x-w/2,level,w,6+o.layer*30*tb.mix);}
      if(r==='benedict'&&o&&tb.heat>2&&(sm.c.sugar||0)>3){ctx.fillStyle='rgba(150,40,20,.55)';ctx.fillRect(x-w/2,bot-14,w,14);}
      ctx.restore();
      ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-w/2,top);ctx.lineTo(x-w/2,bot-w/2);ctx.arc(x,bot-w/2,w/2,Math.PI,0,true);ctx.lineTo(x+w/2,top);ctx.stroke();
      if(i===sel){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;rr(ctx,x-w/2-6,top-8,w+12,bot-top+16,10);ctx.stroke();}
      const ls=Math.min(12*k,13.5);sm.short.forEach((ln,j)=>txt(ctx,ln,x,330+j*(ls+2),{s:ls,w:i===sel?700:500,a:'center',c:PAL['cv-ink']}));}
    // droppers
    st.drops.forEach(d=>{const tt=d.t-d.delay;if(tt<0)return;const x=TX(d.i);ctx.fillStyle='#555';rr(ctx,x-4,92,8,40,3);ctx.fill();ctx.fillStyle='#222';rr(ctx,x-7,82,14,14,5);ctx.fill();
      ctx.fillStyle=rg.col;for(let j=0;j<3;j++){const yy=134+((tt*90+j*18)%60);if(yy<200){ctx.beginPath();ctx.arc(x,yy,3,0,6.29);ctx.fill();}}});
    // water bath
    if(st.bath&&(st.bath.on||st.bath.t<5)){const b=st.bath;ctx.fillStyle='rgba(120,180,220,.32)';rr(ctx,20,232,762,84,10);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.stroke();
      if(b.on&&!RM){if(Math.random()<vdt*10)sim.vis.steam.push({x:40+Math.random()*720,y:230,l:1});}
      txt(ctx,'Water bath 80 °C · '+Math.floor(b.t)+':'+String(Math.floor((b.t%1)*60)).padStart(2,'0')+' min',400,226,{s:13*k,w:700,a:'center'});}
    sim.vis.steam.forEach(q=>{q.y-=25*vdt;q.l-=vdt*.8;ctx.strokeStyle='rgba(160,170,180,'+clamp(q.l*.6,0,.6)+')';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.quadraticCurveTo(q.x+6,q.y-6,q.x,q.y-12);ctx.stroke();});sim.vis.steam=sim.vis.steam.filter(q=>q.l>0);
    // selected result pill
    const tb=tubes[sel];if(tb.added&&tb.mix>=1){const o=outcome(S[sel],r,tb.heat);pill(ctx,(ap||r!=='benedict'?o.txt:o.txt.replace(/\(.*\)/,'').trim()+(o.pos?' (+)':o.txt.includes('not heated')?'':' (−)')),Math.min(700,Math.max(120,TX(sel))),400,PAL['card'],PAL['cv-ink'],12.5*k);}
  }
};
function freshTubes(){const a=[];for(let i=0;i<12;i++)a.push({added:0,mix:0,heat:0,delay:0});return a;}
function pickUnknowns(sim){const r=rng(sim.st.round*31+7),pool=POOL.slice().sort(()=>r()-.5);sim.st.unk=pool.slice(0,4);}
function addTube(sim,i,delay){const st=sim.st,tb=st.tubes[sim.p.reagent][i];if(tb.added)return;tb.added=1;tb.mix=0;tb.delay=delay;tb.heat=0;st.drops.push({i,t:0,delay});}
function record(sim,i,r){const st=sim.st,tb=st.tubes[r][i];const o=outcome(samples(sim)[i],r,tb.heat);const prev=st.res[i][r];
  if(!prev||prev.txt!==o.txt){st.res[i][r]=o;sim.infoDirty=true;}}
function act(sim,id){SIM.actions.find(a=>a.id===id).run(sim);}
BioLab.register(SIM);
})();
