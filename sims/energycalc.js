(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,lvText,fmtNum}=BioLab.h;

/* Four bulbs that each give about 800 lumens (a "60 W equivalent").
   light = approximate share of electrical energy leaving as visible light. */
const BULBS={
  incandescent:{name:'Incandescent',W:60,lm:800,light:0.05,life:1000,price:1.00,color:'#ffcf6b'},
  halogen:{name:'Halogen',W:43,lm:800,light:0.07,life:2000,price:2.50,color:'#ffe08a'},
  cfl:{name:'CFL',W:13,lm:800,light:0.20,life:8000,price:2.50,color:'#f3f6ff'},
  led:{name:'LED',W:9,lm:800,light:0.35,life:25000,price:3.00,color:'#fff6dc'}
};
const ORDER=['incandescent','halogen','cfl','led'];
function annual(p,b){const kwh=b.W*p.hours*365/1000;return {kwh,cost:kwh*p.price/100,co2:kwh*p.grid};}

const EC={
  id:'energycalc',hash:'energycalc',apUnit:13,order:3,kind:'Virtual lab',tab:'Lightbulb energy lab',
  card:'Four bulbs, same brightness. Measure watts, waste heat and the yearly cost of each, then trace the energy back to the power plant.',
  title:'Lightbulb energy lab',
  lede:{bio:'Every bulb here gives the same amount of light. Measure how much electricity each one uses and how much of that energy turns into heat instead.',
        honors:'Compare light per watt, yearly energy, cost and CO₂ for each bulb, and work out how fast an efficient bulb pays for itself.',
        ap:'Follow the full energy chain from coal or gas at the power plant to light in the room. Practice the W → kWh → cost → CO₂ → BTU conversions the AP exam asks for.'},
  scale:'A real desk lamp setup: the bulb is about 30 cm above a light meter, with a thermometer 5 cm from the glass. Each bulb gives about 800 lumens (a standard “60-watt” amount of light).',
  timeScale:0.5,dtMax:0.01,prewarm:0,sampleDt:0.05,window:10,unit:'min',chChange:1,chReveal:6,
  controls:[
    {id:'bulb',label:'Bulb',type:'seg',def:'incandescent',lvl:'bio',options:[{v:'incandescent',l:'Incandescent'},{v:'halogen',l:'Halogen'},{v:'cfl',l:'CFL'},{v:'led',l:'LED'}]},
    {id:'hours',label:'Hours on per day',type:'range',min:1,max:24,step:1,def:5,unit:' h',lvl:'bio'},
    {id:'price',label:'Electricity price',type:'range',min:5,max:30,step:0.5,def:14,unit:'¢/kWh',lvl:'honors',help:'Colorado homes pay about 14–16¢ per kWh.'},
    {id:'grid',label:'Grid CO₂',type:'range',min:0.1,max:1.0,step:0.05,def:0.55,unit:' kg/kWh',lvl:'honors',help:'About 0.5–0.6 for Colorado’s current mix (approximate).'},
    {id:'plantEff',label:'Power plant efficiency',type:'range',min:25,max:60,step:1,def:35,unit:'%',lvl:'ap',help:'Coal ≈ 33–35%, combined-cycle gas ≈ 50–60%.'},
    {id:'lineLoss',label:'Transmission loss',type:'range',min:2,max:15,step:1,def:6,unit:'%',lvl:'ap'}
  ],
  init(){return {T:22};},
  step(sim,dt){const b=BULBS[sim.p.bulb],heat=b.W*(1-b.light),Tss=22+heat*0.45;sim.st.T+=dt*(Tss-sim.st.T)/1.5;},
  metrics:[
    {id:'watts',label:'Power drawn',unit:'W',lvl:'bio',min:0,max:70,d:0,get:s=>BULBS[s.p.bulb].W},
    {id:'lpw',label:'Light per watt',unit:'lm/W',lvl:'bio',min:0,max:100,d:1,get:s=>BULBS[s.p.bulb].lm/BULBS[s.p.bulb].W},
    {id:'lightpct',label:'Energy that becomes light',unit:'%',lvl:'bio',min:0,max:50,d:0,get:s=>BULBS[s.p.bulb].light*100},
    {id:'temp',label:'Thermometer near bulb',unit:'°C',lvl:'bio',min:20,max:50,d:1,get:s=>s.st.T},
    {id:'kwh',label:'Energy per year',unit:'kWh',lvl:'bio',min:0,max:300,d:1,get:s=>annual(s.p,BULBS[s.p.bulb]).kwh},
    {id:'cost',label:'Cost per year',unit:'$',lvl:'honors',min:0,max:40,d:2,get:s=>annual(s.p,BULBS[s.p.bulb]).cost},
    {id:'co2',label:'CO₂ per year',unit:'kg',lvl:'honors',min:0,max:150,d:1,get:s=>annual(s.p,BULBS[s.p.bulb]).co2},
    {id:'payback',label:'Pays for itself vs. incandescent',unit:'months',lvl:'honors',min:0,max:24,d:1,get:s=>{if(s.p.bulb==='incandescent')return NaN;const b=BULBS[s.p.bulb],i=BULBS.incandescent;const save=(i.W-b.W)*s.p.hours*365/1000*s.p.price/100;return save>0?(b.price-i.price)/save*12:NaN;}},
    {id:'overall',label:'Fuel → light efficiency',unit:'%',lvl:'ap',min:0,max:15,d:2,get:s=>BULBS[s.p.bulb].light*s.p.plantEff/100*(1-s.p.lineLoss/100)*100},
    {id:'fuel',label:'Fuel energy burned per year',unit:'million BTU',lvl:'ap',min:0,max:3,d:2,get:s=>annual(s.p,BULBS[s.p.bulb]).kwh*3412/(s.p.plantEff/100*(1-s.p.lineLoss/100))/1e6}
  ],
  graphs:[
    {id:'temp',label:'Thermometer temperature',lines:['temp']},
    {id:'cmpkwh',label:'Compare all four bulbs: kWh per year',custom:true},
    {id:'cmpcost',label:'Compare all four bulbs: cost per year',custom:true,lvl:'honors'},
    {id:'cmpheat',label:'Compare all four bulbs: light vs. heat',custom:true}
  ],
  defaultGraph:'temp',
  plot(sim,ctx,box,id){const p=sim.p,names=ORDER.map(k=>BULBS[k].name);
    if(id==='cmpheat'){const lightW=ORDER.map(k=>BULBS[k].W*BULBS[k].light),heatW=ORDER.map(k=>BULBS[k].W*(1-BULBS[k].light));
      const ax=axes(ctx,box,{xmin:0,xmax:4,ymin:0,ymax:70,xcats:names,yl:'Watts'});
      ORDER.forEach((k,i)=>{const x0=ax.X(i+.2),x1=ax.X(i+.8),y0=ax.Y(0),yl=ax.Y(lightW[i]),yh=ax.Y(lightW[i]+heatW[i]);
        ctx.fillStyle='#e6b800';ctx.fillRect(x0,yl,x1-x0,y0-yl);ctx.fillStyle='#d9534f';ctx.fillRect(x0,yh,x1-x0,yl-yh);
        txt(ctx,BULBS[k].W+' W',(x0+x1)/2,yh-5,{s:12,c:PAL['fg'],a:'center',w:600});});
      BioLab.h.legend(ctx,box.L+12,box.T+10,[{label:'light',color:'#e6b800'},{label:'heat',color:'#d9534f'}]);return;}
    const vals=ORDER.map(k=>annual(p,BULBS[k])[id==='cmpcost'?'cost':'kwh']);
    const ax=axes(ctx,box,{xmin:0,xmax:4,ymin:0,ymax:Math.max(...vals)*1.18||1,xcats:names,yl:id==='cmpcost'?'Dollars per year':'kWh per year'});
    bars(ctx,ax,vals,{colors:ORDER.map(k=>k===p.bulb?PAL['g-line']:PAL['s2']),d:id==='cmpcost'?2:0});},
  challenges:[
    {lvl:'bio',q:'You swap a cool LED for an incandescent bulb that gives the same light. What happens to the thermometer next to the bulb?',
     choices:['It rises a lot','It stays about the same','It drops'],correct:0,
     baseline:{bulb:'led'},change:{bulb:'incandescent'},changeText:'Switched to the incandescent bulb',watch:'temp',
     explain:{bio:'An incandescent bulb makes light by heating a wire until it glows, so about 95% of its energy comes out as heat. The LED makes the same light from a fraction of the energy and stays cool.',
              ap:'Incandescent: 60 W in, about 3 W of visible light, about 57 W of heat. LED: 9 W in, about 3 W of light, about 6 W of heat. Same light, very different waste.'}},
    {lvl:'bio',q:'All four bulbs give the same 800 lumens of light. Which one uses the least electricity?',
     choices:['Incandescent','Halogen','CFL','LED'],correct:3,instant:true,
     explain:'The LED uses about 9 W for the same light that takes 60 W in an incandescent bulb, so it uses about one-seventh of the electricity. Use the “Compare all four bulbs” graph to see it.'},
    {lvl:'honors',q:'A 60 W incandescent bulb is on 5 hours a day, every day, at 14¢ per kWh. About how much does it cost per year?',
     choices:['$1.53','$4.20','$15.33','$153'],correct:2,instant:true,
     explain:'60 W × 5 h × 365 days = 109,500 Wh = 109.5 kWh. 109.5 kWh × $0.14 = $15.33. Check it against the Cost per year readout with the incandescent bulb selected.'},
    {lvl:'honors',q:'You leave the same bulb on 10 hours a day instead of 5. What happens to its yearly cost?',
     choices:['It stays the same','It doubles','It goes up 10 times'],correct:1,instant:true,
     explain:'Energy = power × time. Doubling the hours doubles the kWh, so the cost (and CO₂) doubles too.'},
    {lvl:'ap',q:'A coal plant is 35% efficient, transmission loses 6%, and an LED turns 35% of its electricity into light. What share of the coal’s energy becomes light?',
     choices:['About 1.2%','About 11.5%','About 35%','About 76%'],correct:1,instant:true,
     explain:'Multiply the efficiencies: 0.35 × 0.94 × 0.35 ≈ 0.115, or 11.5%. For an incandescent bulb, 0.35 × 0.94 × 0.05 ≈ 1.6%: only about 1.6% of the coal’s energy ends up as light.'},
    {lvl:'ap',q:'A home uses 1,000 kWh of electricity. 1 kWh = 3,412 BTU, and the power plant is 33% efficient. About how much fuel energy was burned?',
     choices:['1.1 million BTU','3.4 million BTU','10.3 million BTU','34 million BTU'],correct:2,instant:true,
     explain:'1,000 kWh × 3,412 BTU/kWh = 3.412 million BTU of electricity. The plant must burn 3.412 ÷ 0.33 ≈ 10.3 million BTU of fuel to make it.'}
  ],
  initVis(sim){sim.vis.pk=[];sim.vis.acc=0;},
  draw(sim,ctx,vdt,k,t){
    const p=sim.p,s=sim.st,v=sim.vis,b=BULBS[p.bulb],hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // table
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,372,450,78);
    // cord + fixture
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(230,0);ctx.lineTo(230,62);ctx.stroke();
    ctx.fillStyle='#4a4f57';ctx.beginPath();ctx.moveTo(196,62);ctx.lineTo(264,62);ctx.lineTo(250,98);ctx.lineTo(210,98);ctx.closePath();ctx.fill();
    // light cone to the meter
    const cone=ctx.createLinearGradient(0,110,0,372);cone.addColorStop(0,'rgba(255,224,120,.45)');cone.addColorStop(1,'rgba(255,224,120,.08)');
    ctx.fillStyle=cone;ctx.beginPath();ctx.moveTo(205,140);ctx.lineTo(255,140);ctx.lineTo(330,372);ctx.lineTo(130,372);ctx.closePath();ctx.fill();
    // bulb
    const bx=230,by=128;ctx.fillStyle='#b9bec6';ctx.fillRect(216,96,28,14);
    if(p.bulb==='incandescent'||p.bulb==='halogen'){ctx.fillStyle='rgba(255,236,170,.9)';ctx.beginPath();ctx.ellipse(bx,by+10,24,28,0,0,6.29);ctx.fill();
      ctx.strokeStyle='#ff9a1f';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=12;i++){const x=bx-10+i*1.7,y=by+12+(i%2?-4:4);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
      if(p.bulb==='halogen'){ctx.strokeStyle='rgba(120,120,120,.6)';ctx.lineWidth=1.5;rr(ctx,bx-12,by+2,24,20,6);ctx.stroke();}}
    else if(p.bulb==='cfl'){ctx.strokeStyle='#f6f8ff';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();for(let i=0;i<=40;i++){const a=i*0.62,y=by-2+i*1.1;const x=bx+Math.sin(a)*12;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.lineCap='butt';}
    else{ctx.fillStyle='#f0f0ec';ctx.beginPath();ctx.ellipse(bx,by+6,22,24,0,Math.PI,2*Math.PI);ctx.fill();ctx.fillStyle='#dcdcd4';ctx.fillRect(bx-17,by+6,34,14);ctx.fillStyle='#ffd45a';ctx.fillRect(bx-10,by+2,20,4);}
    ctx.fillStyle='rgba(255,230,140,.35)';ctx.beginPath();ctx.arc(bx,by+10,44,0,6.29);ctx.fill();
    // heat shimmer ∝ heat watts
    const heat=b.W*(1-b.light);ctx.strokeStyle='rgba(220,70,50,.55)';ctx.lineWidth=2;
    const nh=Math.round(heat/8);for(let i=0;i<nh;i++){const x0=bx-40+i*(80/Math.max(1,nh-1)),ph=t*3+i;ctx.beginPath();for(let j=0;j<=8;j++){const y=118-j*6-((t*20+i*7)%14),x=x0+Math.sin(ph+j*0.8)*3;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
    // energy packets from the wall: yellow → light (down), red → heat (up/out)
    v.acc+=vdt*b.W*0.25;while(v.acc>=1){v.acc--;v.pk.push({x:60,y:300,ph:0,light:Math.random()<b.light});}
    v.pk.forEach(q=>{if(q.ph===0){q.x+=(bx-q.x)*Math.min(1,vdt*3);q.y+=(by-q.y)*Math.min(1,vdt*3);if(Math.abs(q.x-bx)<6){q.ph=1;q.vx=q.light?(Math.random()-.5)*60:(Math.random()-.5)*90;q.vy=q.light?140:-60-Math.random()*40;q.life=1.6;}}
      else{q.x+=q.vx*vdt;q.y+=q.vy*vdt;q.life-=vdt;}
      ctx.fillStyle=q.ph===0?'#7a8a9a':(q.light?'#f2c200':'#e0503a');ctx.beginPath();ctx.arc(q.x,q.y,3.2,0,6.29);ctx.fill();});
    v.pk=v.pk.filter(q=>q.ph===0||q.life>0);if(v.pk.length>160)v.pk.splice(0,v.pk.length-160);
    // wall outlet + plug-in power meter
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(60,300);ctx.quadraticCurveTo(140,260,215,100);ctx.stroke();
    ctx.fillStyle='#e9e6dc';rr(ctx,24,270,72,92,8);ctx.fill();ctx.strokeStyle='#9a958a';ctx.lineWidth=1.5;rr(ctx,24,270,72,92,8);ctx.stroke();
    ctx.fillStyle='#2c3a2c';rr(ctx,32,282,56,26,4);ctx.fill();txt(ctx,b.W.toFixed(1)+' W',60,300,{s:13*k,w:800,c:'#a8f0a0',a:'center'});
    txt(ctx,'Power meter',60,326,{s:10*k,w:700,c:'#2a2a2a',a:'center'});
    // light meter on the table
    ctx.fillStyle='#ffd45a';rr(ctx,180,348,100,30,6);ctx.fill();ctx.fillStyle='#2b2b2b';rr(ctx,188,352,84,20,4);ctx.fill();
    txt(ctx,b.lm+' lm',230,367,{s:12*k,w:800,c:'#a8f0a0',a:'center'});txt(ctx,'Light meter: same for every bulb',230,398,{s:11*k,w:600,a:'center'});
    // thermometer
    const tx=300;ctx.fillStyle=PAL['card'];rr(ctx,tx-6,96,12,200,6);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;rr(ctx,tx-6,96,12,200,6);ctx.stroke();
    const th=clamp((s.T-15)/45,0,1)*180;ctx.fillStyle='#d32f2f';ctx.fillRect(tx-2.5,290-th,5,th+4);ctx.beginPath();ctx.arc(tx,300,9,0,6.29);ctx.fill();
    txt(ctx,s.T.toFixed(1)+' °C',tx+14,296-th,{s:13*k,w:800,c:'#d32f2f'});
    // energy split panel: where 100 J goes
    const px=470,py=30;ctx.fillStyle=PAL['card'];rr(ctx,px,py,312,ap?250:200,10);ctx.fill();ctx.strokeStyle=PAL['line'];rr(ctx,px,py,312,ap?250:200,10);ctx.stroke();
    txt(ctx,'Where 100 J of electricity goes',px+156,py+22,{s:13*k,w:700,a:'center'});
    const L=b.light*100,H=100-L,bxs=px+20,bw=272,bh=36;
    ctx.fillStyle='#e6b800';ctx.fillRect(bxs,py+44,bw*L/100,bh);ctx.fillStyle='#d9534f';ctx.fillRect(bxs+bw*L/100,py+44,bw*H/100,bh);
    txt(ctx,Math.round(L)+' J light',bxs,py+98,{s:12*k,w:700,c:'#b38f00'});txt(ctx,Math.round(H)+' J heat',bxs+bw,py+98,{s:12*k,w:700,c:'#d9534f',a:'right'});
    txt(ctx,b.name+': '+b.W+' W for '+b.lm+' lumens',px+156,py+124,{s:12*k,c:PAL['cv-soft'],a:'center'});
    const yr=annual(p,b);txt(ctx,'Per year at '+p.hours+' h/day: '+yr.kwh.toFixed(0)+' kWh'+(hon?' · $'+yr.cost.toFixed(2)+' · '+yr.co2.toFixed(0)+' kg CO₂':''),px+156,py+146,{s:11.5*k,w:600,a:'center'});
    txt(ctx,'Lasts about '+b.life.toLocaleString()+' hours',px+156,py+168,{s:11*k,c:PAL['cv-soft'],a:'center'});
    if(ap){// efficiency chain
      const e1=p.plantEff/100,e2=1-p.lineLoss/100,e3=b.light,cy=py+214;const steps=[['Fuel','100'],['Power plant',(100*e1).toFixed(0)],['Power lines',(100*e1*e2).toFixed(0)],['Light',(100*e1*e2*e3).toFixed(1)]];
      steps.forEach((st,i)=>{const x=px+42+i*76;ctx.fillStyle=i===3?'#e6b800':'#5d6f86';rr(ctx,x-30,cy-16,60,32,6);ctx.fill();txt(ctx,st[1]+' J',x,cy+5,{s:12*k,w:800,c:'#fff',a:'center'});txt(ctx,st[0],x,cy+30,{s:10*k,c:PAL['cv-soft'],a:'center'});
        if(i<3){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+32,cy);ctx.lineTo(x+44,cy);ctx.stroke();}});}
    // legend
    let lx=470;const ly=ap?306:258;[['#7a8a9a','electricity'],['#f2c200','light'],['#e0503a','heat']].forEach(it=>{ctx.fillStyle=it[0];ctx.beginPath();ctx.arc(lx+5,ly-4,4,0,6.29);ctx.fill();txt(ctx,it[1],lx+14,ly,{s:11.5*k,c:PAL['cv-soft']});ctx.font='400 '+11.5*k+'px '+FONT;lx+=ctx.measureText(it[1]).width+34;});
  },
  narrate(sim){const p=sim.p,b=BULBS[p.bulb],hon=atLeast('honors'),yr=annual(p,b),heat=Math.round(b.W*(1-b.light));
    if(p.bulb==='incandescent')return '<b>The incandescent bulb heats a thin wire until it glows.</b> Of its '+b.W+' W, about '+heat+' W comes out as heat. That is why the thermometer climbs.'+(hon?' Yearly cost: $'+yr.cost.toFixed(2)+'.':'');
    if(p.bulb==='halogen')return '<b>Halogen is a hotter, slightly better incandescent.</b> It still turns about 93% of its '+b.W+' W into heat.';
    if(p.bulb==='cfl')return '<b>The CFL makes UV light inside the tube, and a coating turns it into visible light.</b> It needs only '+b.W+' W, but it contains a little mercury, so it must be recycled.';
    return '<b>The LED makes light directly in a semiconductor chip.</b> Just '+b.W+' W gives the same light as the 60 W incandescent: '+yr.kwh.toFixed(0)+' kWh a year instead of '+annual(p,BULBS.incandescent).kwh.toFixed(0)+'.';},
  tour:[
    {title:'Same light from every bulb',text:'The light meter reads about 800 lumens no matter which bulb is in the lamp. That makes this a fair test: the only difference is how much energy each bulb needs.',focus:[170,340,124,64],speed:1},
    {title:'Measuring the power',text:'The power meter between the wall and the lamp shows how many watts (joules per second) the bulb pulls from the outlet.',focus:[18,262,86,108],speed:1},
    {title:'Light or heat?',text:'Each dot is a packet of energy from the wall. Yellow packets leave as light; red packets leave as heat. Watch how few yellow ones there are with this incandescent bulb.',focus:[150,60,190,200],speed:0.25,setup(sim){BioLab.setValues(sim,{bulb:'incandescent'});}},
    {title:'The thermometer tells the story',text:'Wasted energy shows up as heat. The thermometer next to the incandescent bulb climbs well above room temperature.',focus:[285,85,70,230],speed:2},
    {title:'Switch to an LED',text:'Same light, about 9 W instead of 60 W. Far more of the packets come out yellow, and the thermometer cools back down.',focus:[465,26,322,182],speed:1,setup(sim){BioLab.setValues(sim,{bulb:'led'});}},
    {lvl:'honors',title:'From watts to dollars',text:'Energy per year (kWh) = watts × hours per day × 365 ÷ 1,000. Multiply by the price per kWh for dollars, and by the grid’s kg of CO₂ per kWh for emissions.',focus:[465,26,322,182],speed:1,pause:true},
    {lvl:'ap',title:'The whole energy chain',text:'The bulb is the last link. The power plant wastes most of the fuel’s energy as heat, and the power lines lose a little more. Multiply the efficiencies to find how much of the fuel’s energy becomes light.',focus:[465,210,322,74],speed:1,pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{bulb:'incandescent'});},
  lab:{bio:'<p><b>Question:</b> Which bulb wastes the least energy as heat?</p><ol><li>For each bulb, let the thermometer settle (about 5 minutes on the clock).</li><li>Record a trial for each bulb.</li><li>Compare the power drawn, the temperature and “Energy that becomes light.”</li></ol><p>Write a claim about which bulb is most efficient, using two numbers from your table.</p>',
       honors:'<p><b>Question:</b> How much money and CO₂ does switching to LEDs save?</p><ol><li>Record each bulb at 5 hours a day.</li><li>Repeat at 12 hours a day.</li><li>A typical home has about 40 bulbs. Scale your results up.</li></ol><p>How many months does the LED take to pay for itself? Does that change with hours of use?</p>',
       ap:'<p><b>Question:</b> How much fuel does a bulb really burn?</p><ol><li>For the incandescent and LED bulbs, record “Fuel → light efficiency” and “Fuel energy burned per year.”</li><li>Repeat with power plant efficiency at 33% (coal) and 55% (combined-cycle gas).</li></ol><p><b>Claim–evidence–reasoning:</b> Which change saves more fuel, a better bulb or a better power plant? Show your conversions.</p>'},
  terms:[{t:'Watt (W)',d:'A unit of power: one joule of energy per second.'},{t:'Lumen (lm)',d:'A unit for the amount of visible light a bulb gives off.'},{t:'Energy efficiency',d:'The share of energy that does the useful job. Here, the share that becomes light.'},
    {lvl:'honors',t:'Kilowatt-hour (kWh)',d:'Energy used by 1,000 W for one hour. Electric bills charge per kWh.'},{lvl:'honors',t:'Payback period',d:'How long the savings take to cover a higher purchase price.'},
    {lvl:'ap',t:'BTU',d:'British thermal unit. 1 kWh = 3,412 BTU.'},{lvl:'ap',t:'Second law of thermodynamics',d:'Every energy conversion loses some energy as heat, so chains of conversions multiply losses.'}],
  about:'<p>Bulb values are typical for products giving about 800 lumens: incandescent 60 W, halogen 43 W, CFL 13 W, LED 9 W. “Energy that becomes light” is an approximate share of electrical power leaving as visible light (about 5%, 7%, 20% and 35%). Real values vary by product.</p><p>The thermometer warms toward room temperature (22 °C) plus about 0.45 °C per watt of heat, with a time constant of 1.5 minutes. Grid CO₂ and electricity price are adjustable estimates for Colorado.</p>'
};
BioLab.register(EC);
})();
