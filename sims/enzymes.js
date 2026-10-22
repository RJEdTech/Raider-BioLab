(function(){
'use strict';
const {clamp,rng,rr,txt,pill,polyline,atLeast,PAL,FONT,RM}=BioLab.h;
const ENZ={amylase:{name:'Amylase',pH:6.8,Tref:37,Tm:44,w:2.5,Tirr:55},
           pepsin:{name:'Pepsin',pH:2.0,Tref:37,Tm:44,w:2.5,Tirr:55},
           taq:{name:'Taq polymerase',pH:8.3,Tref:72,Tm:80,w:3,Tirr:95}};
const KM=5,KI=2,VMAX=100;
const ENZPOS=[[120,150],[300,130],[480,150],[660,130],[160,320],[340,300],[520,320],[690,300]];
const ENZYME={
  id:'enz',apUnit:3,order:3,kind:'Simulation',card:'Temperature, pH, substrate and inhibitors. Find the optimum, then break the enzyme.',hash:'enzymes',tab:'Enzyme activity',
  title:'Enzyme activity: temperature, pH and inhibitors',
  lede:{bio:'Enzymes speed up reactions when substrate fits their active site. Change the temperature, pH and amount of substrate, and watch the reaction rate.',
        honors:'Compare enzymes from different environments, and see how heat, pH and a competitive inhibitor change the active site and the reaction rate.',
        ap:'Michaelis–Menten kinetics. Read Vmax and Km under any conditions, and tell competitive from noncompetitive inhibition from your own rate data.'},
  timeScale:0.1,dtMax:0.005,prewarm:3,sampleDt:0.01,window:3,unit:'min',chChange:0.4,chReveal:1.3,
  controls:[
    {id:'enzyme',label:'Enzyme',type:'seg',def:'amylase',lvl:'honors',options:[{v:'amylase',l:'Amylase'},{v:'pepsin',l:'Pepsin'},{v:'taq',l:'Taq'}],
     help:'Amylase: saliva. Pepsin: stomach. Taq: hot-spring bacteria.'},
    {id:'temp',label:'Temperature',type:'range',min:0,max:100,step:1,def:37,unit:' °C',lvl:'bio'},
    {id:'ph',label:'pH',type:'range',min:1,max:12,step:0.5,def:7,unit:'',lvl:'bio'},
    {id:'sub',label:'Substrate concentration',type:'range',min:0,max:50,step:1,def:10,unit:' mM',lvl:'bio'},
    {id:'inhC',label:'Competitive inhibitor',type:'range',min:0,max:10,step:0.5,def:0,unit:' mM',lvl:'honors',help:'Competes for the active site'},
    {id:'inhN',label:'Noncompetitive inhibitor',type:'range',min:0,max:10,step:0.5,def:0,unit:' mM',lvl:'ap',help:'Binds elsewhere and changes the enzyme’s shape'}
  ],
  init(){return {D:0,ff:1,fk:1,fph:1,intact:1,vmax:0,km:KM,v:0,prod:0};},
  step(sim,dt){const p=sim.p,s=sim.st,e=ENZ[p.enzyme],T=p.temp;
    s.D+=(1-s.D)*Math.min(1,0.4*Math.exp((T-e.Tirr)/3)*dt);      // permanent heat damage
    s.ff=1/(1+Math.exp((T-e.Tm)/e.w));                           // reversible unfolding
    s.fk=Math.pow(2,(T-e.Tref)/10);                              // molecules move faster when warm (Q10 = 2)
    s.fph=Math.exp(-Math.pow((p.ph-e.pH)/1.6,2));
    s.intact=s.ff*(1-s.D);
    s.vmax=VMAX*s.fk*s.intact*s.fph/(1+p.inhN/KI);
    s.km=KM*(1+p.inhC/KI);
    s.v=s.vmax*p.sub/(s.km+p.sub); s.prod+=s.v*dt;},
  afterPrewarm(sim){sim.st.prod=0;},
  metrics:[
    {id:'rate',label:'Reaction rate',unit:'µmol/min',lvl:'bio',min:0,max:110,d:1,get:s=>s.st.v},
    {id:'prod',label:'Product made',unit:'µmol',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.prod},
    {id:'intact',label:'Enzymes with working shape',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>s.st.intact*100},
    {id:'occ',label:'Active sites filled',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>100*s.p.sub/(s.st.km+s.p.sub)},
    {id:'vmax',label:'Vmax now',unit:'µmol/min',lvl:'ap',min:0,max:110,d:1,get:s=>s.st.vmax},
    {id:'km',label:'Km (apparent)',unit:'mM',lvl:'ap',min:0,max:40,d:1,get:s=>s.st.km}
  ],
  defaultGraph:'rate',
  challenges:[
    {lvl:'bio',q:'You heat amylase from 37 °C to 70 °C. What happens to the reaction rate?',
     choices:['It rises, because molecules move faster when hot','It drops to almost zero','It stays the same'],correct:1,
     baseline:{enzyme:'amylase'},change:{temp:70},changeText:'Temperature raised to 70 °C',watch:'rate',
     explain:{bio:'Heat makes molecules move faster, but too much heat shakes the enzyme out of shape. The active site no longer fits the substrate, so the reaction nearly stops. This is called denaturation.'}},
    {lvl:'bio',q:'Amylase works in your mouth (about pH 7). What happens at pH 2, the acidity of the stomach?',
     choices:['The rate rises','The rate drops sharply','No change'],correct:1,
     baseline:{enzyme:'amylase'},change:{ph:2},changeText:'pH lowered to 2',watch:'rate',
     explain:{bio:'Each enzyme has an ideal pH. Strong acid changes the charges in amylase’s active site so substrate no longer binds well. That is why starch digestion by saliva stops in the stomach.'}},
    {lvl:'honors',q:'This amylase was heated to 70 °C. If you cool it back down to 37 °C, what happens to the rate?',
     choices:['It returns to normal','It stays near zero','It rises above normal'],correct:1,
     baseline:{enzyme:'amylase',temp:70},change:{temp:37},changeText:'Cooled back to 37 °C',watch:'rate',
     explain:{honors:'High heat breaks the bonds that hold the enzyme’s shape, and the protein does not refold correctly. Cooling slows a working enzyme but does not damage it; overheating damages it permanently. Press Reset to start with fresh enzyme.'}},
    {lvl:'honors',q:'A competitive inhibitor is slowing the reaction. What happens if you flood the solution with substrate?',
     choices:['The rate rises a lot, because substrate outcompetes the inhibitor','Nothing changes; the inhibitor is stuck in the active site','The rate drops further'],correct:0,
     baseline:{enzyme:'amylase',inhC:5,sub:5},change:{sub:50},changeText:'Substrate raised from 5 to 50 mM',watch:'rate',
     explain:{honors:'A competitive inhibitor and the substrate take turns in the same active site. With far more substrate around, substrate wins most of the time and the rate climbs back up.',
              ap:'Competitive inhibition raises the apparent Km but leaves Vmax unchanged, so enough substrate overcomes it. Check the Km readout: 17.5 mM with the inhibitor vs. 5 mM without.'}},
    {lvl:'ap',q:'A noncompetitive inhibitor binds away from the active site. With much more substrate, can the rate reach the uninhibited maximum?',
     choices:['Yes, extra substrate outcompetes it','No, the rate rises a little but the maximum stays lower'],correct:1,
     baseline:{enzyme:'amylase',inhN:3,sub:5},change:{sub:50},changeText:'Substrate raised from 5 to 50 mM',watch:'rate',
     explain:{ap:'The inhibitor removes working enzyme no matter how much substrate is present, so Vmax drops (here to 40% of normal) while Km is unchanged. Adding substrate only moves you up a lower curve. Record trials at several [S] to see both curves.'}},
    {lvl:'ap',q:'Pepsin works in the stomach. You move it from pH 7 to pH 2. What happens?',
     choices:['The rate rises sharply','The rate drops','No change'],correct:0,
     baseline:{enzyme:'pepsin',ph:7},change:{ph:2},changeText:'pH lowered to 2',watch:'rate',
     explain:{ap:'An enzyme’s optimum matches its environment. Pepsin’s active site carries the right charges only at low pH, so it is nearly inactive at pH 7 and fully active at pH 2. That is the opposite of amylase.'}}
  ],
  initVis(sim){const r=rng(11),v=sim.vis;v.r1=[],v.r2=[],v.r3=[],v.ori=[],v.busy=[];
    for(let i=0;i<8;i++){v.r1.push((i+.5)/8);v.r2.push(r());v.r3.push(r());v.ori.push(r()*6.28);v.busy.push(0);}
    v.r1.sort(()=>r()-.5);v.subs=[];v.inC=[];v.inN=[];v.prods=[];v.ev=0;},
  draw(sim,ctx,vdt,k,t){
    const s=sim.st,p=sim.p,v=sim.vis,R=Math.random,hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-sol'];ctx.fillRect(0,0,800,450);
    if(p.temp>45){ctx.fillStyle='rgba(230,60,40,'+clamp((p.temp-45)/260,0,.2)+')';ctx.fillRect(0,0,800,450);}
    if(p.temp<15){ctx.fillStyle='rgba(60,130,230,'+clamp((15-p.temp)/90,0,.16)+')';ctx.fillRect(0,0,800,450);}
    const e=ENZ[p.enzyme];
    txt(ctx,(hon?e.name:'Amylase')+'  ·  '+p.temp+' °C  ·  pH '+p.ph.toFixed(1)+'  ·  substrate '+p.sub+' mM',16,28,{s:14*k,w:700});
    // particle populations follow concentrations
    const speed=Math.sqrt((p.temp+273)/310)*(RM?.5:1);
    const sync=(arr,n)=>{while(arr.length<n)arr.push({x:20+R()*760,y:50+R()*370,vx:0,vy:0});if(arr.length>n)arr.length=n;};
    sync(v.subs,Math.round(clamp(p.sub*1.3,0,65)));sync(v.inC,hon?Math.round(p.inhC*2.4):0);sync(v.inN,ap?Math.round(p.inhN*2.4):0);
    const move=(a,m)=>{a.vx+=(R()-.5)*600*vdt*m;a.vy+=(R()-.5)*600*vdt*m;const sp=Math.hypot(a.vx,a.vy),mx=55*m;if(sp>mx){a.vx*=mx/sp;a.vy*=mx/sp;}
      a.x+=a.vx*vdt;a.y+=a.vy*vdt;if(a.x<8||a.x>792)a.vx*=-1;if(a.y<44||a.y>442)a.vy*=-1;a.x=clamp(a.x,8,792);a.y=clamp(a.y,44,442);};
    // which enzymes are unfolded / inhibited right now
    const denFrac=1-s.intact,compFrac=(p.inhC/KI)/(1+p.inhC/KI+p.sub/KM),nonFrac=p.inhN/(KI+p.inhN);
    const st=ENZPOS.map((q,i)=>{const den=v.r1[i]<denFrac;return {den,comp:!den&&hon&&v.r2[i]<compFrac,non:!den&&ap&&v.r3[i]<nonFrac};});
    // reaction events in proportion to the modeled rate
    v.ev+=s.v*vdt*sim.def.timeScale*0.5;
    while(v.ev>=1){v.ev--;const free=st.map((q,i)=>i).filter(i=>!st[i].den&&!st[i].comp&&v.busy[i]<=0);if(!free.length){v.ev=Math.min(v.ev,2);break;}v.busy[free[Math.floor(R()*free.length)]]=0.35;}
    ENZPOS.forEach((q,i)=>{const [cx,cy]=q,o=v.ori[i]+Math.sin(t*.4+i)*0.15,c=st[i],Rr=34;
      if(c.den){ctx.strokeStyle=PAL['cv-enzd'];ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();
        for(let j=0;j<=28;j++){const x=cx-40+j*2.9,y=cy+Math.sin(j*0.8+i+t*.6)*9;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();return;}
      let a=0.40*s.fph+0.07;if(c.non)a*=0.45;
      ctx.fillStyle=PAL['cv-enz'];ctx.beginPath();ctx.moveTo(cx+Math.cos(o)*Rr*0.25,cy+Math.sin(o)*Rr*0.25);ctx.arc(cx,cy,Rr,o+a,o+6.283-a);ctx.closePath();ctx.fill();
      const sx=cx+Math.cos(o)*Rr*0.72,sy=cy+Math.sin(o)*Rr*0.72;
      if(c.comp){ctx.fillStyle=PAL['cv-inc'];ctx.beginPath();ctx.moveTo(sx+Math.cos(o)*9,sy+Math.sin(o)*9);ctx.lineTo(sx+Math.cos(o+2.2)*8,sy+Math.sin(o+2.2)*8);ctx.lineTo(sx+Math.cos(o-2.2)*8,sy+Math.sin(o-2.2)*8);ctx.closePath();ctx.fill();}
      if(c.non){const nx=cx-Math.cos(o)*Rr,ny=cy-Math.sin(o)*Rr;ctx.fillStyle=PAL['cv-inn'];ctx.beginPath();ctx.moveTo(nx,ny-9);ctx.lineTo(nx+8,ny);ctx.lineTo(nx,ny+9);ctx.lineTo(nx-8,ny);ctx.closePath();ctx.fill();}
      if(v.busy[i]>0){v.busy[i]-=vdt;ctx.fillStyle=PAL['cv-sub'];ctx.beginPath();ctx.arc(sx,sy,7,0,6.29);ctx.fill();
        if(v.busy[i]<=0){for(let m=0;m<2;m++)v.prods.push({x:sx,y:sy,vx:Math.cos(o+(m?.6:-.6))*60,vy:Math.sin(o+(m?.6:-.6))*60,life:5});}}
    });
    for(const a of v.subs){move(a,speed);ctx.fillStyle=PAL['cv-sub'];ctx.beginPath();ctx.arc(a.x,a.y,5.5,0,6.29);ctx.fill();}
    for(const a of v.inC){move(a,speed);ctx.fillStyle=PAL['cv-inc'];ctx.beginPath();ctx.moveTo(a.x,a.y-7);ctx.lineTo(a.x+6.5,a.y+5);ctx.lineTo(a.x-6.5,a.y+5);ctx.closePath();ctx.fill();}
    for(const a of v.inN){move(a,speed);ctx.fillStyle=PAL['cv-inn'];ctx.beginPath();ctx.moveTo(a.x,a.y-7);ctx.lineTo(a.x+6,a.y);ctx.lineTo(a.x,a.y+7);ctx.lineTo(a.x-6,a.y);ctx.closePath();ctx.fill();}
    for(const a of v.prods){move(a,speed);a.life-=vdt;ctx.globalAlpha=clamp(a.life/2,0,1);ctx.fillStyle=PAL['cv-prod'];ctx.beginPath();ctx.arc(a.x,a.y,4.2,0,6.29);ctx.fill();}
    ctx.globalAlpha=1;v.prods=v.prods.filter(a=>a.life>0);if(v.prods.length>120)v.prods.splice(0,v.prods.length-120);
    // legend
    let lx=16;const ly=438,item=(draw,label)=>{draw(lx+5,ly-4);txt(ctx,label,lx+15,ly,{s:12*k,c:PAL['cv-soft']});ctx.font='400 '+12*k+'px '+FONT;lx+=ctx.measureText(label).width+34;};
    item((x,y)=>{ctx.fillStyle=PAL['cv-enz'];ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,7,.5,5.8);ctx.closePath();ctx.fill();},'enzyme');
    item((x,y)=>{ctx.fillStyle=PAL['cv-sub'];ctx.beginPath();ctx.arc(x,y,5,0,6.29);ctx.fill();},'substrate');
    item((x,y)=>{ctx.fillStyle=PAL['cv-prod'];ctx.beginPath();ctx.arc(x,y,4,0,6.29);ctx.fill();},'product');
    if(hon)item((x,y)=>{ctx.fillStyle=PAL['cv-inc'];ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x+6,y+5);ctx.lineTo(x-6,y+5);ctx.closePath();ctx.fill();},'competitive inhibitor');
    if(ap)item((x,y)=>{ctx.fillStyle=PAL['cv-inn'];ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x+5,y);ctx.lineTo(x,y+6);ctx.lineTo(x-5,y);ctx.closePath();ctx.fill();},'noncompetitive');
  }
};
Object.assign(ENZYME,{
  scale:'Molecular view: each enzyme is about 5 nanometers across. One drop of saliva holds trillions of amylase molecules.',
  narrate(sim){const p=sim.p,s=sim.st,e=ENZ[p.enzyme],hon=atLeast('honors'),nm=hon?e.name:'Amylase',occ=Math.round(100*p.sub/(s.km+p.sub));
    if(s.D>0.5)return '<b>Most of the enzyme is permanently damaged by heat (denatured).</b> Its shape is gone, so cooling it down won’t bring it back. Press Reset for fresh enzyme.';
    if(s.ff<0.5)return '<b>Too hot.</b> The enzymes are shaking out of shape and their active sites no longer fit the substrate.';
    if(s.fph<0.3)return '<b>The pH is far from '+nm+'’s favorite (about pH '+e.pH+').</b> Charges in the active site change, so the substrate doesn’t fit well.';
    if(p.sub<0.5)return 'No substrate in the tube, so there is nothing for the enzyme to work on.';
    if(p.temp<15&&p.enzyme!=='taq')return '<b>Cold.</b> Molecules move slowly, so substrate bumps into active sites less often. The enzymes are not damaged, just slow.';
    if(p.enzyme==='taq'&&p.temp<60)return 'Taq comes from bacteria in hot springs. At '+p.temp+' °C it works slowly. It runs best near 72 °C.';
    if(atLeast('ap')&&p.inhN>0)return 'Noncompetitive inhibitor (purple) binds away from the active site and changes the enzyme’s shape. Those enzymes stop working no matter how much substrate you add.';
    if(hon&&p.inhC>0)return 'Competitive inhibitor (red) is sitting in some active sites, blocking substrate. More substrate can outcompete it.';
    return occ+'% of active sites are busy, making product at '+s.v.toFixed(0)+' µmol/min.'+(occ>85?' Nearly every active site is full, so adding more substrate barely helps (saturation).':'');},
  tour:[
    {title:'Meet the enzyme',text:'Each green shape is one enzyme molecule. The notch is its <b>active site</b>, a pocket shaped to fit one kind of molecule.',focus:[76,106,92,92],speed:0.25},
    {title:'Substrate wanders in',text:'Blue dots are substrate molecules (starch, for amylase). They move randomly and bump into enzymes by chance.',focus:[0,40,800,375],speed:0.25},
    {title:'The reaction',text:'When substrate lands in the active site, the enzyme splits it into two products (orange) and lets them go. The enzyme is not used up. It grabs the next one.',focus:[60,80,500,140],speed:0.1},
    {title:'Too hot',text:'Now we heat the tube to 70 °C. Watch the enzymes unravel: the active site loses its shape, so substrate can’t bind. This is <b>denaturation</b>.',focus:[0,40,800,375],speed:1,setup(sim){BioLab.setValues(sim,{temp:70});}},
    {lvl:'honors',title:'Competitive inhibitor',text:'Back to fresh enzyme at 37 °C, with a competitive inhibitor added. The red triangles fit the active site and block it, but substrate can still win the spot if there is enough of it.',focus:[0,40,800,375],speed:0.5,setup(sim){BioLab.reset(sim);BioLab.setValues(sim,{temp:37,inhC:5});}},
    {lvl:'ap',title:'Noncompetitive inhibitor',text:'The purple diamonds bind the back of the enzyme and pinch the active site shut. Extra substrate can’t undo that, so Vmax drops while Km stays the same.',focus:[0,40,800,375],speed:0.5,setup(sim){BioLab.setValues(sim,{inhC:0,inhN:3});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{temp:37,inhC:0,inhN:0});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> How does temperature affect how fast amylase works?</p><ol><li>Record the reaction rate at 10, 20, 30, 37, 45, 55 and 65 °C.</li><li>Press Reset before each temperature above 50 °C so you start with fresh enzyme.</li><li>Plot temperature (x) against reaction rate (y).</li></ol><p>What is the optimum temperature? Explain why the rate drops on each side of it.</p>',
       honors:'<p><b>Question:</b> How does substrate concentration affect reaction rate, with and without a competitive inhibitor?</p><ol><li>Record rates at substrate 1, 2, 5, 10, 20 and 50 mM.</li><li>Repeat with 5 mM competitive inhibitor.</li><li>Plot both sets on the Trials graph.</li></ol><p>Describe how the two curves differ at low and high substrate.</p>',
       ap:'<p><b>Question:</b> How can you tell competitive from noncompetitive inhibition using rate data alone?</p><ol><li>Collect rate vs. [S] for no inhibitor, 5 mM competitive and 3 mM noncompetitive.</li><li>Estimate Vmax and Km for each from your curves, then check against the readouts.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain the mechanism behind each change in Vmax or Km.</p>'},
  terms:[{t:'Enzyme',d:'A protein that speeds up a reaction without being used up.'},{t:'Active site',d:'The pocket on an enzyme where the substrate binds.'},{t:'Substrate',d:'The molecule an enzyme acts on.'},{t:'Denature',d:'To lose shape, and with it function. High heat or extreme pH can denature an enzyme.'},
    {lvl:'honors',t:'Optimum',d:'The temperature or pH where an enzyme works fastest.'},{lvl:'honors',t:'Competitive inhibitor',d:'A molecule that competes with substrate for the active site.'},{lvl:'honors',t:'Saturation',d:'When nearly all active sites are full, so more substrate barely raises the rate.'},
    {lvl:'ap',t:'Vmax',d:'The maximum rate when the enzyme is saturated.'},{lvl:'ap',t:'Km',d:'The substrate concentration that gives half of Vmax. A lower Km means a tighter fit.'},{lvl:'ap',t:'Noncompetitive (allosteric) inhibitor',d:'Binds elsewhere on the enzyme and changes its shape, which lowers Vmax.'}]
});
BioLab.register(ENZYME);
})();
