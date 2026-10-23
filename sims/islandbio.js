(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,RM,axes,legend}=BioLab.h;

/* MacArthur–Wilson island biogeography.
   Immigration when empty I0 = 2·e^(−d/200) species/yr (d = km from mainland).
   Extinction when full E0 = 4·A^(−0.35) species/yr (A = km²).
   With S species present out of a pool of P: I = I0(1 − S/P), E = E0·S/P, so S* = P·I0/(I0 + E0). */
const POOL=100;
const I0=d=>2*Math.exp(-d/200), E0=A=>4*Math.pow(A,-0.35);
function eff(sim,which){const p=sim.p,ap=atLeast('ap');if(which==='A'){let A=p.aArea,d=p.aDist;if(ap&&p.frag)A=A/10;if(ap&&p.frag&&p.corr)d=d/10;return {A,d};}return {A:p.bArea,d:p.bDist};}
function rates(sim,which,S){const e=eff(sim,which),i0=I0(e.d),e0=E0(e.A);return {i0,e0,imm:i0*(1-S/POOL),ext:e0*S/POOL,eq:POOL*i0/(i0+e0)};}
const HUE=i=>(i*137.508)%360;

const MAIN={x0:0,x1:96};
const islX=d=>170+(Math.log10(d)-1)/(Math.log10(500)-1)*520;
const islR=A=>10+55*Math.sqrt(A/1000);
const ISL={A:150,B:338};

const SIM={
  id:'islandbio',hash:'islandbio',apUnit:8,order:6,tab:'Island biogeography',kind:'Simulation',prereq:['biodiversity'],next:['succession'],
  card:'Species fly in from the mainland and go extinct. See why big islands near the mainland hold the most species, and what fragmenting a forest does.',
  title:'Island biogeography: how many species can an island hold?',
  lede:{bio:'Species reach new islands from the mainland, and some die out. Compare a big island close to shore with a small island far away.',
        honors:'Watch immigration and extinction balance at an equilibrium number of species, and see how island size and distance move that balance.',
        ap:'Model the MacArthur–Wilson equilibrium with immigration and extinction curves, then treat habitat fragments as islands and test wildlife corridors.'},
  scale:'Islands from 1 to 1,000 km², 10 to 500 km offshore. The map is not to scale. Each icon is one species, not one animal.',
  timeScale:20,dtMax:0.1,prewarm:0,sampleDt:1,window:300,unit:'years',timeLabel:'Time',chChange:2,chReveal:220,
  controls:[
    {id:'aArea',label:'Island A size',type:'seg',def:1000,lvl:'bio',options:[{v:1,l:'1 km²'},{v:10,l:'10'},{v:100,l:'100'},{v:1000,l:'1,000'}]},
    {id:'aDist',label:'Island A distance from mainland',type:'seg',def:10,lvl:'bio',options:[{v:10,l:'10 km'},{v:50,l:'50'},{v:200,l:'200'},{v:500,l:'500'}]},
    {id:'bArea',label:'Island B size',type:'seg',def:10,lvl:'bio',options:[{v:1,l:'1 km²'},{v:10,l:'10'},{v:100,l:'100'},{v:1000,l:'1,000'}]},
    {id:'bDist',label:'Island B distance from mainland',type:'seg',def:500,lvl:'bio',options:[{v:10,l:'10 km'},{v:50,l:'50'},{v:200,l:'200'},{v:500,l:'500'}]},
    {id:'frag',label:'Fragment island A',help:'Treat A as a forest cut into 10 small patches',type:'toggle',def:false,lvl:'ap'},
    {id:'corr',label:'Add wildlife corridors',help:'Strips of habitat connecting the patches to the mainland',type:'toggle',def:false,lvl:'ap'}
  ],
  actions:[
    {id:'hurricane',label:'Hurricane hits island A',lvl:'honors',run(sim){const s=sim.st;for(let i=0;i<POOL;i++)if(s.pA[i]&&Math.random()<0.5){s.pA[i]=0;s.SA--;s.extinctA++;sim.vis.puff&&sim.vis.puff.push({isl:'A',i,life:1});}}},
    {id:'erupt',label:'Volcano wipes out island B',lvl:'honors',run(sim){const s=sim.st;for(let i=0;i<POOL;i++)if(s.pB[i]){s.pB[i]=0;sim.vis.puff&&sim.vis.puff.push({isl:'B',i,life:1});}s.SB=0;}}
  ],
  init(){return {pA:new Uint8Array(POOL),pB:new Uint8Array(POOL),SA:0,SB:0,arrA:0,extinctA:0,ev:[]};},
  step(sim,dt){const s=sim.st;
    ['A','B'].forEach(w=>{const pres=w==='A'?s.pA:s.pB,r=rates(sim,w,0),pi=r.i0/POOL*dt,pe=r.e0/POOL*dt;
      for(let i=0;i<POOL;i++){if(pres[i]){if(Math.random()<pe){pres[i]=0;if(w==='A'){s.SA--;s.extinctA++;}else s.SB--;if(s.ev.length<40)s.ev.push({t:'x',w,i});}}
        else if(Math.random()<pi){pres[i]=1;if(w==='A'){s.SA++;s.arrA++;}else s.SB++;if(s.ev.length<40)s.ev.push({t:'a',w,i});}}});},
  metrics:[
    {id:'spA',label:'Species on island A',unit:'species',lvl:'bio',min:0,max:100,d:0,get:s=>s.st.SA},
    {id:'spB',label:'Species on island B',unit:'species',lvl:'bio',min:0,max:100,d:0,get:s=>s.st.SB},
    {id:'eqA',label:'Equilibrium for A',unit:'species',lvl:'honors',min:0,max:100,d:0,get:s=>rates(s,'A',0).eq},
    {id:'eqB',label:'Equilibrium for B',unit:'species',lvl:'honors',min:0,max:100,d:0,get:s=>rates(s,'B',0).eq},
    {id:'immA',label:'Immigration to A',unit:'species/yr',lvl:'ap',min:0,max:2,d:2,get:s=>rates(s,'A',s.st.SA).imm},
    {id:'extA',label:'Extinction on A',unit:'species/yr',lvl:'ap',min:0,max:2,d:2,get:s=>rates(s,'A',s.st.SA).ext}
  ],
  graphs:[
    {id:'rich',label:'Species over time',lvl:'bio',lines:['spA','spB'],yl:'Species on the island',min:0,max:100},
    {id:'curves',label:'Immigration and extinction curves',lvl:'honors',custom:true},
    {id:'rateA',label:'Island A rates over time',lvl:'ap',lines:['immA','extA'],yl:'Species per year'}
  ],
  defaultGraph:'rich',
  plot(sim,ctx,box){const a=rates(sim,'A',0),b=rates(sim,'B',0),ymax=Math.max(a.i0,a.e0,b.i0,b.e0)*1.1;
    const ax=axes(ctx,box,{xmin:0,xmax:POOL,ymin:0,ymax,xl:'Species on the island (S)',yl:'Species per year'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    [[a,'s1',sim.st.SA],[b,'s2',sim.st.SB]].forEach(([r,c,S])=>{ctx.strokeStyle=PAL[c];ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(r.i0));ctx.lineTo(ax.X(POOL),ax.Y(0));ctx.stroke();
      ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(POOL),ax.Y(r.e0));ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1;ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(ax.X(r.eq),box.T);ctx.lineTo(ax.X(r.eq),box.T+box.H);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=PAL[c];ctx.beginPath();ctx.arc(ax.X(r.eq),ax.Y(r.i0*(1-r.eq/POOL)),5,0,6.29);ctx.fill();
      txt(ctx,'S* ≈ '+Math.round(r.eq),ax.X(r.eq)+5,box.T+box.H-6,{s:12,c:PAL[c]});
      ctx.strokeStyle=PAL[c];ctx.lineWidth=2;ctx.beginPath();ctx.arc(ax.X(S),ax.Y(r.i0*(1-S/POOL)),4,0,6.29);ctx.stroke();});
    ctx.restore();
    legend(ctx,box.L+10,box.T+10,[{label:'A immigration',color:PAL['s1']},{label:'A extinction',color:PAL['s1'],dash:true},{label:'B immigration',color:PAL['s2']},{label:'B extinction',color:PAL['s2'],dash:true}]);},
  challenges:[
    {lvl:'bio',q:'Island A is big and close to the mainland. Island B is small and far away. After 200 years, which island has more species?',choices:['Island A','Island B','About the same'],correct:0,
     change:{},changeText:'Two new islands start empty',watch:'rich',
     explain:'Island A is easy to reach, so species keep arriving, and it is big, so its populations are large and rarely die out. Island B gets few arrivals and loses species quickly, so it stays nearly empty.'},
    {lvl:'bio',q:'Island B is moved from 500 km to 10 km from the mainland. What happens to its number of species?',choices:['It goes up','It goes down','It stays the same'],correct:0,
     change:{bDist:10},at:100,reveal:260,changeText:'Island B moved to 10 km offshore at year 100',watch:'rich',
     explain:'Closer islands get far more arrivals. Birds, insects and seeds can cross 10 km easily but rarely make it 500 km. More immigration raises the equilibrium.'},
    {lvl:'honors',q:'Island A shrinks from 1,000 km² to 10 km², at the same distance. What happens to its equilibrium number of species?',choices:['It rises','It falls','It stays the same'],correct:1,
     change:{aArea:10},at:100,reveal:280,changeText:'Island A shrunk to 10 km² at year 100',watch:'rich',
     explain:'Small islands hold small populations, and small populations die out more easily from bad luck, storms or disease. A higher extinction rate lowers the equilibrium even though arrivals stay the same.'},
    {lvl:'honors',q:'Once island A reaches equilibrium, do species stop arriving and going extinct?',choices:['Yes, the island is full and frozen','No, species still arrive and go extinct at about equal rates'],correct:1,instant:true,
     explain:'Equilibrium is dynamic. The number of species stays about the same, but which species are present keeps changing. This is called species turnover. Watch the icons on island A blink in and out even after the graph levels off.'},
    {lvl:'ap',q:'A 1,000 km² forest is cut into 10 separate 100 km² patches. What happens to the number of species each patch can hold?',choices:['It falls','It rises','No change'],correct:0,
     change:{frag:true},at:120,reveal:300,changeText:'Forest fragmented at year 120',watch:'rich',
     explain:'Each fragment behaves like a small island. Its populations are smaller, so extinction rises and the equilibrium drops. Habitat fragmentation is one of the biggest causes of biodiversity loss.'},
    {lvl:'ap',q:'The fragments are 200 km from the nearest large forest. Wildlife corridors are added to connect them. What happens to species richness?',choices:['It rises, because corridors raise immigration','It falls','No change, because the patches are still small'],correct:0,
     baseline:{aDist:200,frag:true},change:{corr:true},at:150,reveal:330,changeText:'Corridors added at year 150',watch:'rich',
     explain:'Corridors make the fragments easier to reach, as if they were much closer to the mainland. Higher immigration offsets some of the extra extinction, so the equilibrium rises.'}
  ],
  initVis(sim){const r=rng(17),v=sim.vis;v.pos={A:[],B:[]};for(let i=0;i<POOL;i++){v.pos.A.push([r()*6.283,Math.sqrt(r())]);v.pos.B.push([r()*6.283,Math.sqrt(r())]);}
    v.fly=[];v.puff=[];v.frag=[];for(let i=0;i<10;i++)v.frag.push([Math.cos(i*0.63+0.3)*(0.45+0.4*r()),Math.sin(i*0.63+0.3)*(0.45+0.4*r())]);},
  draw(sim,ctx,vdt,k,t){
    const s=sim.st,v=sim.vis,ap=atLeast('ap'),hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-water'];ctx.fillRect(0,0,800,450);
    // waves
    ctx.strokeStyle=PAL['cv-bstroke'];ctx.globalAlpha=.35;ctx.lineWidth=1.2;for(let y=30;y<450;y+=44)for(let x=120;x<800;x+=90){const o=RM?0:Math.sin(t*0.8+x*0.05+y)*4;ctx.beginPath();ctx.moveTo(x+o,y);ctx.quadraticCurveTo(x+12+o,y-5,x+24+o,y);ctx.stroke();}ctx.globalAlpha=1;
    // mainland with species pool
    ctx.fillStyle='#6f9a48';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(MAIN.x1-6,0);for(let y=0;y<=450;y+=30)ctx.lineTo(MAIN.x1+Math.sin(y*0.05)*6,y);ctx.lineTo(0,450);ctx.closePath();ctx.fill();
    for(let i=0;i<POOL;i++){const gx=12+(i%5)*16,gy=34+Math.floor(i/5)*20.5;icon(ctx,gx,gy,i,3.2);}
    txt(ctx,'MAINLAND',48,20,{s:11*k,w:700,a:'center',c:'#fff'});txt(ctx,'100 species',48,442,{s:10.5*k,a:'center',c:'#fff'});
    // islands
    const geo={};['A','B'].forEach(w=>{const e=w==='A'?{A:sim.p.aArea,d:sim.p.aDist}:{A:sim.p.bArea,d:sim.p.bDist};geo[w]={x:islX(e.d),y:ISL[w],r:islR(e.A),d:e.d};});
    ['A','B'].forEach(w=>{const g=geo[w],fragd=w==='A'&&ap&&sim.p.frag;
      // distance ruler
      ctx.strokeStyle=PAL['cv-ink'];ctx.globalAlpha=.45;ctx.setLineDash([4,4]);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(MAIN.x1+6,g.y+g.r+16);ctx.lineTo(g.x,g.y+g.r+16);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
      txt(ctx,g.d+' km',(MAIN.x1+g.x)/2,g.y+g.r+12,{s:11.5*k,a:'center',c:PAL['cv-ink']});
      if(fragd){if(sim.p.corr){ctx.strokeStyle='#5c8a3c';ctx.lineWidth=7;v.frag.forEach(f=>{ctx.beginPath();ctx.moveTo(MAIN.x1,g.y+f[1]*20);ctx.lineTo(g.x+f[0]*g.r*1.3,g.y+f[1]*g.r*1.3);ctx.stroke();});}
        v.frag.forEach(f=>{blob(ctx,g.x+f[0]*g.r*1.3,g.y+f[1]*g.r*1.3,g.r*0.3,3);});}
      else blob(ctx,g.x,g.y,g.r,w==='A'?1:2);
      const pres=w==='A'?s.pA:s.pB;for(let i=0;i<POOL;i++){if(!pres[i])continue;const q=v.pos[w][i];let cx,cy,rad;
        if(fragd){const f=v.frag[i%10];cx=g.x+f[0]*g.r*1.3;cy=g.y+f[1]*g.r*1.3;rad=g.r*0.3*0.75;}else{cx=g.x;cy=g.y;rad=g.r*0.82;}
        icon(ctx,cx+Math.cos(q[0])*q[1]*rad,cy+Math.sin(q[0])*q[1]*rad,i,clamp(g.r/14,2.2,3.4));}
      const S=w==='A'?s.SA:s.SB;pill(ctx,'Island '+w+' · '+S+' species',g.x,Math.max(16,g.y-g.r-(fragd?g.r*0.6:0)-14),PAL['cv-ink'],PAL['card'],12*k);});
    // arrivals fly in, extinctions puff out (capped so the picture stays readable)
    for(const e of s.ev){const g=geo[e.w];if(e.t==='a'){if(v.fly.length<14&&vdt>0)v.fly.push({w:e.w,i:e.i,x0:MAIN.x1,y0:g.y+(Math.random()-.5)*60,u:0});}else if(v.puff.length<14&&vdt>0)v.puff.push({isl:e.w,i:e.i,life:1});}
    s.ev.length=0;
    for(const f of v.fly){const g=geo[f.w];f.u+=vdt*0.9;const x=f.x0+(g.x-f.x0)*f.u,y=f.y0+(g.y-f.y0)*f.u-Math.sin(f.u*Math.PI)*30;bird(ctx,x,y,f.i,t);}
    v.fly=v.fly.filter(f=>f.u<1);
    for(const p of v.puff){const g=geo[p.isl],q=v.pos[p.isl][p.i];p.life-=vdt*1.2;ctx.globalAlpha=clamp(p.life,0,1);txt(ctx,'✕',g.x+Math.cos(q[0])*q[1]*g.r*0.82,g.y+Math.sin(q[0])*q[1]*g.r*0.82+4,{s:13*k,w:700,a:'center',c:PAL['s1']});}
    ctx.globalAlpha=1;v.puff=v.puff.filter(p=>p.life>0);
    if(hon){const a=rates(sim,'A',s.SA);txt(ctx,'A: '+a.imm.toFixed(2)+' arrivals/yr, '+a.ext.toFixed(2)+' extinctions/yr',790,442,{s:11.5*k,a:'right',c:PAL['cv-ink']});}
    // legend
    bird(ctx,690,22,7,0);txt(ctx,'arriving species',704,26,{s:11.5*k,c:PAL['cv-ink']});
  },
  narrate(sim){const s=sim.st,a=rates(sim,'A',s.SA),b=rates(sim,'B',s.SB),ap=atLeast('ap');
    let A;
    if(s.SA<0.75*a.eq)A='<b>Island A is still filling.</b> Many mainland species haven’t arrived yet, so arrivals ('+a.imm.toFixed(2)+'/yr) outpace extinctions ('+a.ext.toFixed(2)+'/yr).';
    else if(s.SA>1.25*a.eq)A='<b>Island A has more species than it can hold.</b> Extinctions now outnumber arrivals, so it is losing species.';
    else A='<b>Island A is near equilibrium</b> at about '+Math.round(a.eq)+' species. New species still arrive and others die out, at about the same rate.';
    if(ap&&sim.p.frag)A+=' Fragmenting the forest made each patch small, so extinctions rose'+(sim.p.corr?', but corridors raise arrivals.':'.');
    return A+' Island B, at '+sim.p.bDist+' km and '+sim.p.bArea+' km², levels off near '+Math.round(b.eq)+'.';},
  tour:[
    {title:'The mainland',text:'The mainland holds a pool of 100 species of birds, insects and plants. Any of them could reach an island by flying, floating or being blown there.',focus:[0,0,104,450],pause:true},
    {title:'Two new islands',text:'Island A is big and 10 km offshore. Island B is small and 500 km away. Both start empty, like a new volcanic island.',focus:[[100,60,260,190],[600,290,120,100]],pause:true},
    {title:'Species arrive',text:'Each flying icon is a species reaching an island. Near the start, almost every arrival is a new species, so the count climbs fast.',focus:[96,40,420,240],speed:0.15},
    {title:'Arrivals slow down',text:'As the island fills, more of the arrivals are species already living there, so new species arrive more slowly.',focus:[96,40,420,240],speed:0.4},
    {title:'Species die out',text:'Each red ✕ is a local extinction. With more species present, there are more that can die out, and small populations go first.',focus:[96,40,420,240],speed:0.25},
    {title:'Equilibrium',text:'Eventually arrivals balance extinctions and the number of species levels off. Big, close islands balance at many species.',focus:[96,40,420,240],speed:1},
    {title:'Small and far',text:'Island B gets few arrivals because it is far, and loses species fast because it is small. It levels off with very few species.',focus:[560,260,200,150],speed:1},
    {lvl:'ap',title:'Habitat islands',text:'A forest cut into patches acts like a group of small islands. Each patch can hold fewer species. Corridors connect patches and bring immigration back up.',focus:[96,20,420,280],speed:1,setup(sim){BioLab.setValues(sim,{frag:true,corr:true});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{frag:false,corr:false});},
  lab:{bio:'<p><b>Question:</b> How does island size affect the number of species?</p><ol><li>Keep island A at 10 km. Set its size to 1 km² and press Reset.</li><li>Let it run about 200 years, then Record trial.</li><li>Repeat for 10, 100 and 1,000 km².</li></ol><p>Describe the pattern in your table. Why do bigger islands hold more species?</p>',
       honors:'<p><b>Question:</b> How do size and distance each affect the equilibrium?</p><ol><li>Record equilibrium species for island A at all 4 sizes (10 km away).</li><li>Then record A at 1,000 km² for all 4 distances.</li><li>Plot each set on the Trials graph.</li></ol><p>Which matters more, size or distance? Use the immigration and extinction curves to explain.</p>',
       ap:'<p><b>Question:</b> Do wildlife corridors offset habitat fragmentation?</p><ol><li>With island A at 1,000 km² and 200 km, record equilibrium species for intact, fragmented, and fragmented with corridors.</li><li>Plot species against log(area) for the 4 sizes and estimate the slope z of the species–area curve.</li></ol><p><b>Claim–evidence–reasoning:</b> Should a land trust buy one large reserve or several small ones? Use your data.</p>'},
  terms:[{t:'Island biogeography',d:'The study of how island size and distance set the number of species on an island.'},{t:'Immigration',d:'A new species arriving and settling on the island.'},{t:'Local extinction',d:'A species dying out on one island while still living elsewhere.'},
    {lvl:'honors',t:'Equilibrium species richness',d:'The number of species where the immigration rate equals the extinction rate.'},{lvl:'honors',t:'Species turnover',d:'Species keep replacing each other even when the total stays the same.'},
    {lvl:'ap',t:'Habitat fragmentation',d:'Breaking a large habitat into smaller, isolated patches that act like islands.'},{lvl:'ap',t:'Wildlife corridor',d:'A strip of habitat that connects patches so organisms can move between them.'},{lvl:'ap',t:'Species–area relationship',d:'S = cA^z: larger areas hold more species, with z often near 0.25.'}],
  about:'<p>Each of 100 mainland species independently arrives at a rate of I₀/100 per year if absent and dies out at E₀/100 per year if present. Here I₀ = 2·e^(−d/200) depends on distance d in km, and E₀ = 4·A^(−0.35) depends on area A in km². This gives the straight-line immigration and extinction curves and the equilibrium S* = 100·I₀/(I₀ + E₀). Fragmenting divides the area by 10, and corridors divide the effective distance by 10.</p><p>Simplified: every species is equally good at dispersing and equally likely to die out, and species don’t compete with each other. Real islands also have habitat diversity, rescue effects and evolution of new species, which this model leaves out.</p>',
  thumbFrames:60
};
function blob(ctx,x,y,r,seed){ctx.fillStyle='#d9c48b';ctx.beginPath();for(let i=0;i<=24;i++){const a=i/24*6.283,rr2=r*1.08*(1+0.08*Math.sin(a*3+seed)+0.05*Math.sin(a*5+seed*2));i?ctx.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2):ctx.moveTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2);}ctx.closePath();ctx.fill();
  ctx.fillStyle='#5d9a45';ctx.beginPath();for(let i=0;i<=24;i++){const a=i/24*6.283,rr2=r*(1+0.08*Math.sin(a*3+seed)+0.05*Math.sin(a*5+seed*2));i?ctx.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2):ctx.moveTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2);}ctx.closePath();ctx.fill();}
function icon(ctx,x,y,i,sz){ctx.fillStyle='hsl('+HUE(i)+',70%,'+(i%2?'38%':'52%')+')';const m=i%3;ctx.beginPath();
  if(m===0)ctx.arc(x,y,sz,0,6.29);else if(m===1){ctx.moveTo(x,y-sz*1.2);ctx.lineTo(x+sz*1.1,y+sz*0.8);ctx.lineTo(x-sz*1.1,y+sz*0.8);ctx.closePath();}else ctx.rect(x-sz*0.9,y-sz*0.9,sz*1.8,sz*1.8);ctx.fill();}
function bird(ctx,x,y,i,t){const f=Math.sin(t*12+i)*4;ctx.strokeStyle='hsl('+HUE(i)+',70%,35%)';ctx.lineWidth=2.2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-8,y-f);ctx.quadraticCurveTo(x-4,y-5,x,y);ctx.quadraticCurveTo(x+4,y-5,x+8,y-f);ctx.stroke();}
BioLab.register(SIM);
})();
