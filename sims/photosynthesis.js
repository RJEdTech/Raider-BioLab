(function(){
'use strict';
const {clamp,rng,rr,txt,pill,polyline,atLeast,PAL,FONT,RM}=BioLab.h;
const FILT={white:1,red:0.85,blue:0.95,green:0.2};
const FILTC={red:'rgba(220,40,40,',blue:'rgba(50,100,235,',green:'rgba(40,170,70,',white:'rgba(255,214,90,'};
const PHOTO={
  id:'photo',apUnit:3,order:2,kind:'Simulation',card:'The Elodea bubble lab. Move the lamp, change CO₂ and light color, count bubbles.',hash:'photosynthesis',tab:'Photosynthesis',
  title:'Photosynthesis: the Elodea bubble lab',
  lede:{bio:'Pondweed gives off oxygen bubbles as it photosynthesizes. Move the lamp, change the CO₂ and temperature, and count the bubbles.',
        honors:'Test which colors of light drive photosynthesis, and find the limiting factor: light, CO₂ or temperature.',
        ap:'A dissolved-O₂ probe shows gross and net O₂. Find the light compensation point, where photosynthesis exactly balances respiration.'},
  timeScale:0.25,dtMax:0.005,prewarm:1.5,sampleDt:0.02,window:6,unit:'min',chChange:1,chReveal:3.6,
  controls:[
    {id:'dist',label:'Lamp distance',type:'range',min:10,max:60,step:1,def:15,unit:' cm',lvl:'bio'},
    {id:'co2',label:'Baking soda (CO₂ source)',type:'range',min:0,max:1,step:0.05,def:0.5,unit:'%',lvl:'bio'},
    {id:'temp',label:'Water temperature',type:'range',min:5,max:45,step:1,def:25,unit:' °C',lvl:'bio'},
    {id:'filter',label:'Light color',type:'seg',def:'white',lvl:'honors',options:[{v:'white',l:'White'},{v:'red',l:'Red'},{v:'blue',l:'Blue'},{v:'green',l:'Green'}]}
  ],
  init(){return {I:0,gross:0,resp:0,net:0,acc:0,thr:1,bub:[],total:0};},
  step(sim,dt){const p=sim.p,s=sim.st,I=100*Math.pow(10/p.dist,2),Ie=I*FILT[p.filter],Lf=Ie/(Ie+25),C=p.co2+0.02,Cf=C/(C+0.15),T=p.temp;
    const fT=Math.pow(2,(T-25)/10)/(1+Math.exp((T-38)/2.5));
    s.I=I;s.gross=50*Lf*Cf*fT;s.resp=4*Math.pow(2,(T-25)/10);s.net=s.gross-s.resp;
    s.acc+=Math.max(0,s.net)*dt;                                // bubbles arrive at random (Poisson) at the net O2 rate
    while(s.acc>=s.thr){s.acc-=s.thr;s.bub.push(sim.t);s.total++;s.thr=-Math.log(1-Math.random()*0.999);}
    while(s.bub.length&&s.bub[0]<sim.t-1.05)s.bub.shift();},
  afterPrewarm(sim){sim.st.total=0;},
  metrics:[
    {id:'bubbles',label:'Bubbles per minute',unit:'counted',lvl:'bio',min:0,max:40,d:0,get:s=>s.st.bub.filter(x=>x>s.t-1).length},
    {id:'light',label:'Light at the plant',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>s.st.I},
    {id:'gross',label:'Gross O₂ made',unit:'bubble-eq/min',lvl:'ap',min:0,max:40,d:1,get:s=>s.st.gross},
    {id:'resp',label:'O₂ used (respiration)',unit:'bubble-eq/min',lvl:'ap',min:0,max:20,d:1,get:s=>s.st.resp},
    {id:'net',label:'Net O₂ (probe)',unit:'bubble-eq/min',lvl:'ap',min:-15,max:40,d:1,get:s=>s.st.net}
  ],
  defaultGraph:'bubbles',
  challenges:[
    {lvl:'bio',q:'You move the lamp from 15 cm to 40 cm away. What happens to the bubble rate?',
     choices:['It goes up','It goes down','It stays the same'],correct:1,
     baseline:{dist:15},change:{dist:40},changeText:'Lamp moved to 40 cm',watch:'bubbles',
     explain:{bio:'Light spreads out as it travels. At 40 cm the plant gets only about one-seventh of the light it got at 15 cm, so it makes less oxygen and fewer bubbles.',
              honors:'Light intensity falls with the square of distance: (15 ÷ 40)² ≈ 0.14, so the plant gets about 14% as much light. Light is now the limiting factor.'}},
    {lvl:'bio',q:'You replace the baking-soda water with plain water. What happens to the bubbles?',
     choices:['More bubbles','Far fewer bubbles','No change'],correct:1,
     change:{co2:0},changeText:'Baking soda removed',watch:'bubbles',
     explain:{bio:'Baking soda releases CO₂ into the water, and the plant needs CO₂ to build sugar. With almost no CO₂, photosynthesis slows even though the light is strong.'}},
    {lvl:'honors',q:'Plants look green. What happens if the plant gets only green light?',
     choices:['It photosynthesizes faster than in white light','It photosynthesizes much more slowly','No change'],correct:1,
     change:{filter:'green'},changeText:'Green filter in front of the lamp',watch:'bubbles',
     explain:{honors:'Chlorophyll absorbs red and blue light and reflects most green light. That reflected green is why leaves look green, and it is also why green light drives very little photosynthesis.'}},
    {lvl:'honors',q:'You heat the water from 25 °C to 45 °C. What happens to the bubble rate?',
     choices:['It keeps rising with temperature','It drops sharply','No change'],correct:1,
     change:{temp:45},changeText:'Water heated to 45 °C',watch:'bubbles',
     explain:{honors:'The Calvin cycle runs on enzymes such as rubisco. Warming speeds them up to a point, but at 45 °C they start to lose their shape, so photosynthesis falls. Respiration keeps rising and uses up more of the O₂ that is made.'}},
    {lvl:'ap',q:'At 60 cm, almost no bubbles appear. Is the plant still photosynthesizing?',
     choices:['No, photosynthesis has stopped','Yes, but respiration uses about as much O₂ as photosynthesis makes'],correct:1,
     baseline:{dist:30},change:{dist:60},changeText:'Lamp moved to 60 cm',watch:'net',
     explain:{ap:'Gross O₂ production is still positive, but cellular respiration uses O₂ the whole time. Near 60 cm the two are about equal, so net O₂ is about zero. This is the light compensation point. Bubbles only measure net O₂.'}}
  ],
  initVis(sim){const r=rng(5),v=sim.vis;v.b=[];v.seen=sim.st.total;v.fizz=[];for(let i=0;i<40;i++)v.fizz.push([566+r()*110,190+r()*200,r()*6.28]);
    v.leaves=[];for(let u=0.06;u<0.99;u+=0.085){for(let j=0;j<3;j++)v.leaves.push([u,j,r()]);}},
  draw(sim,ctx,vdt,k,t){
    const s=sim.st,p=sim.p,v=sim.vis,hon=atLeast('honors'),R=Math.random;
    ctx.fillStyle=PAL['card'];ctx.fillRect(0,0,800,450);
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,400,800,50);
    // ruler (distance from the plant)
    const BX=620,PX=8;ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(BX-60*PX-6,404,60*PX+12,30);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.strokeRect(BX-60*PX-6,404,60*PX+12,30);
    ctx.beginPath();for(let c=0;c<=60;c++){const x=BX-c*PX,h=c%10===0?11:c%5===0?7:4;ctx.moveTo(x,404);ctx.lineTo(x,404+h);}ctx.stroke();
    for(let c=0;c<=60;c+=10)txt(ctx,String(c),BX-c*PX,429,{s:11*k,a:'center',c:PAL['cv-soft']});
    txt(ctx,'cm from plant',BX+50,425,{s:11*k,c:PAL['cv-soft']});
    // lamp
    const hx=BX-p.dist*PX-14,hy=232,I=s.I,fc=FILTC[hon?p.filter:'white'];
    const beam=ctx.createLinearGradient(hx,0,566,0);beam.addColorStop(0,fc+clamp(.18+I/250,0,.6)+')');beam.addColorStop(1,fc+clamp(I/420,.02,.28)+')');
    ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(hx+8,206);ctx.lineTo(566,150);ctx.lineTo(566,398);ctx.lineTo(hx+8,258);ctx.closePath();ctx.fill();
    ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(hx-44,226,6,174);ctx.beginPath();ctx.ellipse(hx-41,400,22,5,0,0,6.29);ctx.fill();ctx.fillRect(hx-44,228,22,6);
    ctx.beginPath();ctx.moveTo(hx-28,212);ctx.lineTo(hx+8,196);ctx.lineTo(hx+8,268);ctx.lineTo(hx-28,252);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffe28a';ctx.beginPath();ctx.arc(hx+6,232,13,-1.57,1.57);ctx.fill();
    if(hon&&p.filter!=='white'){ctx.fillStyle=fc+'.75)';rr(ctx,hx+14,198,7,68,2);ctx.fill();}
    // beaker of water with Elodea
    ctx.fillStyle=PAL['cv-water'];ctx.fillRect(566,178,108,220);
    v.fizz.slice(0,Math.round(p.co2*40)).forEach(f=>{ctx.fillStyle=PAL['cv-bstroke'];ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(f[0],f[1]+(RM?0:Math.sin(t*2+f[2])*2),1.6,0,6.29);ctx.fill();});ctx.globalAlpha=1;
    ctx.strokeStyle=PAL['cv-leaf'];ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(624,396);ctx.quadraticCurveTo(606,320,612,226);ctx.stroke();
    for(const L of v.leaves){const u=L[0],m=1-u,x=m*m*624+2*u*m*606+u*u*612,y=m*m*396+2*u*m*320+u*u*226;
      ctx.save();ctx.translate(x,y);ctx.rotate((L[1]-1)*1.05+(L[2]-.5)*.25);ctx.fillStyle=L[1]===1?PAL['cv-leaf2']:PAL['cv-leaf'];ctx.beginPath();ctx.ellipse(0,-11,4.2,12,0,0,6.29);ctx.fill();ctx.restore();}
    // thermometer
    ctx.fillStyle=PAL['card'];rr(ctx,654,128,10,250,5);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();
    const th=clamp((p.temp-5)/40,0,1)*200;ctx.fillStyle='#d32f2f';ctx.fillRect(656.5,374-th,5,th+4);ctx.beginPath();ctx.arc(659,382,8,0,6.29);ctx.fill();
    // bubbles: exactly one per bubble counted by the model
    while(v.seen<s.total){v.seen++;v.b.push({x:612+R()*4-2,y:224,r:2.6+R()*2.2,ph:R()*6.28});}
    for(const b of v.b){b.y-=70*vdt;const x=b.x+(RM?0:Math.sin(b.y*.08+b.ph)*2);ctx.fillStyle=PAL['cv-bubble'];ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,b.y,b.r,0,6.29);ctx.fill();ctx.stroke();}
    v.b=v.b.filter(b=>b.y>182);if(v.b.length>80)v.b.splice(0,v.b.length-80);
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(562,146);ctx.lineTo(562,398);ctx.lineTo(678,398);ctx.lineTo(678,146);ctx.stroke();
    ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(564,178);ctx.lineTo(676,178);ctx.stroke();
    // labels
    txt(ctx,'Elodea (pondweed) in baking-soda water',620,112,{s:12.5*k,w:600,a:'center'});
    txt(ctx,'Bubbles counted: '+s.total,784,28,{s:14*k,w:700,a:'right'});
    txt(ctx,'Light at plant: '+Math.round(I)+'%',16,28,{s:14*k,w:700});
    txt(ctx,'Lamp '+p.dist+' cm away · '+p.temp+' °C'+(hon?' · '+p.filter+' light':''),16,48,{s:12.5*k,c:PAL['cv-soft']});
  }
};
Object.assign(PHOTO,{
  scale:'Real lab scale: a 10 cm sprig of pondweed in a beaker. Each bubble is mostly oxygen released from chloroplasts.',
  narrate(sim){const p=sim.p,s=sim.st,hon=atLeast('honors');
    const Ie=s.I*FILT[p.filter],Lf=Ie/(Ie+25),C=p.co2+0.02,Cf=C/(C+0.15),T=p.temp,fT=Math.pow(2,(T-25)/10)/(1+Math.exp((T-38)/2.5));
    if(s.net<=0.2)return '<b>No bubbles escape.</b> The plant is still photosynthesizing, but its own respiration uses up the oxygen as fast as it is made.';
    if(T>=40)return '<b>Too warm.</b> The enzymes that build sugar are losing their shape, so photosynthesis slows even with plenty of light.';
    if(hon&&p.filter==='green')return '<b>Green light mostly reflects off chlorophyll</b>, which is why leaves look green. Little of it is absorbed, so few bubbles form.';
    const lim=[['Light',Lf],['Carbon dioxide',Cf],['Temperature',fT>1?1:fT]].sort((a,b)=>a[1]-b[1])[0][0];
    return 'The plant is making about <b>'+Math.max(0,s.net).toFixed(0)+' bubbles of oxygen per minute</b>. Right now <b>'+lim.toLowerCase()+'</b> is the limiting factor: improving it would help most.';},
  tour:[
    {title:'The setup',text:'A sprig of Elodea pondweed sits in water mixed with baking soda, which releases CO₂ for the plant to use. A lamp shines on it from the side.',focus:[548,100,160,305],speed:0.5},
    {title:'Light is the energy source',text:'Light hits chloroplasts in the leaves. Chlorophyll absorbs it and uses the energy to split water molecules.',focus(sim){const hx=620-sim.p.dist*8-14;return [hx-60,180,640-hx,100];},speed:0.5},
    {title:'Bubbles are oxygen',text:'Splitting water releases oxygen gas, which collects and escapes from the cut end of the stem as bubbles. Counting bubbles measures photosynthesis.',focus:[585,175,60,70],speed:0.5},
    {title:'Move the lamp back',text:'Now the lamp moves to 40 cm. Light spreads out with distance, so far less of it reaches the plant. Watch the bubble rate fall.',focus:[130,190,560,250],speed:2,setup(sim){BioLab.setValues(sim,{dist:40});}},
    {lvl:'honors',title:'Color matters',text:'A green filter lets only green light through. Chlorophyll reflects most green light, so photosynthesis nearly stops even though the lamp is close.',focus:[400,150,300,250],speed:2,setup(sim){BioLab.setValues(sim,{dist:15,filter:'green'});}},
    {lvl:'ap',title:'Gross vs. net',text:'The plant respires all the time, using some of the oxygen it makes. Bubbles show only the <b>net</b> oxygen. Far from the lamp, respiration can use up everything photosynthesis makes. That is the compensation point.',focus:[0,0,800,60],speed:2,setup(sim){BioLab.setValues(sim,{filter:'white',dist:58});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{dist:15,filter:'white'});},
  lab:{bio:'<p><b>Question:</b> How does light intensity affect the rate of photosynthesis?</p><ol><li>Record bubbles per minute with the lamp at 10, 20, 30, 40, 50 and 60 cm.</li><li>After each move, wait one full minute on the clock before recording, so the count covers only the new distance.</li><li>Plot lamp distance (x) against bubbles per minute (y).</li></ol><p>Write a claim about light and photosynthesis using your data.</p>',
       honors:'<p><b>Question:</b> Which colors of light drive photosynthesis best?</p><ol><li>With the lamp at 15 cm, record 3 trials each for white, red, blue and green light.</li><li>Average the trials for each color.</li></ol><p>Connect your results to the colors chlorophyll absorbs and reflects.</p>',
       ap:'<p><b>Question:</b> Where is the light compensation point?</p><ol><li>Record net O₂ (probe) at lamp distances from 20 to 60 cm.</li><li>Plot light at the plant (x) against net O₂ (y) and find where net O₂ crosses zero.</li><li>Repeat at 35 °C.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why the compensation point shifts with temperature.</p>'},
  terms:[{t:'Photosynthesis',d:'Using light energy to make sugar from CO₂ and water, releasing O₂.'},{t:'Chlorophyll',d:'The green pigment that absorbs red and blue light.'},{t:'Limiting factor',d:'The one condition, such as light, CO₂ or temperature, that is holding back the rate.'},
    {lvl:'honors',t:'Light reactions',d:'Use light to split water, releasing O₂ and making ATP and NADPH.'},{lvl:'honors',t:'Calvin cycle',d:'Uses ATP, NADPH and CO₂ to build sugar.'},{lvl:'honors',t:'Inverse square law',d:'Doubling the distance from a light gives one quarter of the light.'},
    {lvl:'ap',t:'Gross vs. net photosynthesis',d:'Gross is all the O₂ produced. Net is gross minus the O₂ used by respiration.'},{lvl:'ap',t:'Compensation point',d:'The light level where photosynthesis exactly balances respiration.'}]
});
BioLab.register(PHOTO);
})();
