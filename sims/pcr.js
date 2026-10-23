(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;

/* PCR on a 150-bp stretch of the GFP gene (the start of the gene carried by pGLO).
   Time in minutes: each cycle = 0.5 min denature (95 °C) + 0.5 min anneal (Ta) + 1 min extend (72 °C).
   Double-stranded species per cycle (duplication probability E):
     OO original template, OL original+long strand, LX long+exact, XX exact+exact (the target product)
     OO' = (1−E)OO;  OL' = (1−E)OL + E(2OO + OL);  LX' = (1−E)LX + E(OL + LX);  XX' = (1−E)XX + E(LX + 2XX)
   E = efficiency × primer binding (forward) × primer binding (reverse) × plateau (1 − total/1e13).
   Primer binding = 1/(1 + e^((Ta − (Tm + 1))/0.8)), Tm by the Wallace rule 2(A+T) + 4(G+C). */
const TPL='ATGAGTAAAGGAGAAGAACTTTTCACTGGAGTTGTCCCAATTCTTGTTGAATTAGATGGTGATGTTAATGGGCACAAATTTTCTGTCAGTGGAGAGGGTGAAGGTGATGCAACATACGGAAAACTTACCCTTAAATTTATTTGCACTACT';
const L=TPL.length; // 150
const COMP={A:'T',T:'A',G:'C',C:'G'};
const rc=s=>s.split('').reverse().map(c=>COMP[c]).join('');
const tmOf=s=>2*(s.split('').filter(c=>c==='A'||c==='T').length)+4*(s.split('').filter(c=>c==='G'||c==='C').length);
const gcOf=s=>100*s.split('').filter(c=>c==='G'||c==='C').length/s.length;
// Forward primers pair with the bottom strand and point right; reverse primers pair with the top strand and point left.
const FWD={F1:{seq:TPL.slice(0,22),a:0,b:22,ok:true,l:'F1: bases 1–22'},F2:{seq:TPL.slice(0,15),a:0,b:15,ok:true,l:'F2: bases 1–15 (short)'},
  F3:{seq:rc(TPL.slice(0,22)),a:0,b:22,ok:false,l:'F3: reverse complement of 1–22',lvl:'honors'},F4:{seq:TPL.slice(36,58),a:36,b:58,ok:true,l:'F4: bases 37–58'}};
const REV={R1:{seq:rc(TPL.slice(128,150)),a:128,b:150,ok:true,l:'R1: rev. comp. of 129–150'},R2:{seq:TPL.slice(128,150),a:128,b:150,ok:false,l:'R2: copied straight from 129–150'},
  R3:{seq:rc(TPL.slice(96,118)),a:96,b:118,ok:true,l:'R3: rev. comp. of 97–118'}};
const bindOf=(Ta,Tm)=>1/(1+Math.exp((Ta-(Tm+1))/0.8));
const CMAX=1e13;
function words(n){if(!Number.isFinite(n))return '—';if(n<1e6)return Math.round(n).toLocaleString('en-US');
  const u=[[1e15,'quadrillion'],[1e12,'trillion'],[1e9,'billion'],[1e6,'million']];for(const [v,w] of u)if(n>=v){const x=n/v;return (x>=100?x.toFixed(0):x>=10?x.toFixed(1):x.toFixed(2))+' '+w;}return String(n);}
function primers(sim){const p=sim.p,f=FWD[p.fwd]||FWD.F1,r=REV[p.rev]||REV.R1,tf=tmOf(f.seq),tr=tmOf(r.seq);
  const bf=bindOf(p.anneal,tf),br=bindOf(p.anneal,tr),valid=f.ok&&r.ok&&f.a<r.b-30;
  return {f,r,tf,tr,bf,br,valid,len:valid?r.b-f.a:0,minTm:Math.min(tf,tr)};}
function phaseOf(sim){const s=sim.st;if(s.done)return {name:'Hold',i:3,cp:0};const cp=s.clock-2*s.n;return cp<0.5?{name:'Denature',i:0,cp}:cp<1?{name:'Anneal',i:1,cp}:{name:'Extend',i:2,cp};}
function bandI(c){return clamp((Math.log10(Math.max(c,1))-8.5)/3,0,1);}
function bandsText(sim){const s=sim.st,pr=primers(sim),main=bandI(s.XX),ns=bandI(s.ns);
  if(main<0.05&&ns<0.05)return 'No product yet';if(main<0.05)return 'Wrong-sized bands only';return pr.len+' bp'+(ns>0.05?' plus extra bands':' band only');}

const PCR={
  id:'pcr',hash:'pcr',apUnit:10,order:3,tab:'PCR and primer design',kind:'Virtual lab',prereq:['replication','gel'],
  card:'Run a thermocycler, watch Taq copy the GFP gene, and design primers that actually work.',
  title:'PCR: copying a gene, and designing primers',
  lede:{bio:'PCR makes millions of copies of one piece of DNA. Watch the machine heat and cool the tube, and see the copies double every cycle.',
        honors:'Choose forward and reverse primers for the GFP gene and an annealing temperature. Then see whether you get one clean band, nothing, or extra wrong-sized bands.',
        ap:'Model PCR quantitatively: efficiency, the plateau, and the log-scale growth curve. Predict product length from primer positions.'},
  scale:'One PCR tube holds 25 µL. The target here is 150 base pairs of the GFP gene, about 50 nanometers long.',
  timeScale:0.5,dtMax:0.01,prewarm:0,sampleDt:0.05,window:70,unit:'min',chChange:0,chReveal:21,
  controls:[
    {id:'start',label:'Starting DNA copies',type:'select',def:'1000',lvl:'bio',options:[{v:'10',l:'10'},{v:'100',l:'100'},{v:'1000',l:'1,000'},{v:'10000',l:'10,000'},{v:'100000',l:'100,000'},{v:'1000000',l:'1,000,000'}],help:'Template molecules in the tube before cycle 1',onChange(sim){BioLab.reset(sim);}},
    {id:'cycles',label:'Number of cycles',type:'range',min:5,max:40,step:1,def:30,lvl:'bio'},
    {id:'fwd',label:'Forward primer',type:'select',def:'F1',lvl:'honors',options:Object.keys(FWD).map(k=>({v:k,l:FWD[k].l,lvl:FWD[k].lvl})),onChange(sim){BioLab.reset(sim);}},
    {id:'rev',label:'Reverse primer',type:'select',def:'R1',lvl:'honors',options:Object.keys(REV).map(k=>({v:k,l:REV[k].l})),onChange(sim){BioLab.reset(sim);}},
    {id:'anneal',label:'Annealing temperature',type:'range',min:40,max:72,step:1,def:52,unit:' °C',lvl:'honors',help:'Primers stick only below their melting temperature (Tm)'},
    {id:'eff',label:'Copying efficiency',type:'range',min:50,max:100,step:5,def:100,unit:'%',lvl:'ap',help:'Fraction of molecules copied each cycle'}
  ],
  init(sim){const N=+sim.p.start;return {clock:0,n:0,done:false,T:25,OO:N,OL:0,LX:0,XX:0,ns:N,E:0,hist:[{n:0,tot:N,tgt:0}]};},
  step(sim,dt){const s=sim.st,p=sim.p;s.done=s.n>=p.cycles;if(s.done)s.clock=Math.min(s.clock,2*s.n);s.clock+=dt;
    while(!s.done&&s.clock>=2*(s.n+1)){const pr=primers(sim),tot=s.OO+s.OL+s.LX+s.XX;
      const E=pr.valid?clamp(p.eff/100*pr.bf*pr.br*(1-tot/CMAX),0,1):0;s.E=E;
      const OO=s.OO,OL=s.OL,LX=s.LX,XX=s.XX;
      s.OO=(1-E)*OO;s.OL=(1-E)*OL+E*(2*OO+OL);s.LX=(1-E)*LX+E*(OL+LX);s.XX=(1-E)*XX+E*(LX+2*XX);
      const nsE=clamp((pr.minTm-6-p.anneal)/5,0,1)*0.9*(1-s.ns/CMAX);s.ns*=1+nsE;
      s.n++;s.hist.push({n:s.n,tot:s.OO+s.OL+s.LX+s.XX,tgt:s.XX});
      if(s.n>=p.cycles){s.done=true;}}
    const ph=phaseOf(sim),target=ph.i===0?95:ph.i===1?p.anneal:ph.i===2?72:4;s.T+=(target-s.T)*Math.min(1,dt*14);},
  metrics:[
    {id:'step',label:'Thermocycler',unit:'',lvl:'bio',text:true,get:s=>{const ph=phaseOf(s);return s.st.done?'Done · holding at 4 °C':'Cycle '+(s.st.n+1)+' of '+s.p.cycles+' · '+(ph.i===0?'Denaturing':ph.i===1?'Annealing':'Extending');}},
    {id:'temp',label:'Block temperature',unit:'°C',lvl:'bio',min:0,max:100,d:0,get:s=>s.st.T},
    {id:'total',label:'DNA copies (double-stranded)',unit:'',lvl:'bio',text:true,get:s=>words(s.st.OO+s.st.OL+s.st.LX+s.st.XX)},
    {id:'target',label:'Copies of exactly the target',unit:'',lvl:'bio',text:true,get:s=>words(s.st.XX)},
    {id:'len',label:'Product length',unit:'',lvl:'honors',text:true,get:s=>{const pr=primers(s);return pr.valid?pr.len+' bp':'No product possible';}},
    {id:'fwdinfo',label:'Forward primer',unit:'',lvl:'honors',text:true,get:s=>{const pr=primers(s);return pr.f.seq.length+' nt · '+gcOf(pr.f.seq).toFixed(0)+'% GC · Tm '+pr.tf+' °C';}},
    {id:'revinfo',label:'Reverse primer',unit:'',lvl:'honors',text:true,get:s=>{const pr=primers(s);return pr.r.seq.length+' nt · '+gcOf(pr.r.seq).toFixed(0)+'% GC · Tm '+pr.tr+' °C';}},
    {id:'bands',label:'Gel result',unit:'',lvl:'honors',text:true,get:s=>bandsText(s)},
    {id:'eff',label:'Efficiency last cycle',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>100*s.st.E},
    {id:'logc',label:'log₁₀ total copies',unit:'',lvl:'ap',min:0,max:14,d:2,get:s=>Math.log10(Math.max(1,s.st.OO+s.st.OL+s.st.LX+s.st.XX))}
  ],
  graphs:[{id:'curve',label:'Copies vs. cycle',custom:true},{id:'temp',label:'Block temperature',lines:['temp']}],
  defaultGraph:'curve',
  plot(sim,ctx,box,id){const s=sim.st,ap=atLeast('ap'),N=Math.max(sim.p.cycles,10),h=s.hist;
    if(ap){const ymax=Math.max(8,Math.ceil(Math.log10(Math.max(...h.map(r=>r.tot)))+1));const ax=axes(ctx,box,{xmin:0,xmax:N,ymin:0,ymax,xl:'Cycle number',yl:'log₁₀ copies'});
      [['tot',0],['tgt',1]].forEach(([k,i])=>{ctx.strokeStyle=serColor(i);ctx.lineWidth=2.5;ctx.beginPath();let st=false;h.forEach(r=>{if(r[k]<1)return;const x=ax.X(r.n),y=ax.Y(Math.log10(r[k]));st?ctx.lineTo(x,y):ctx.moveTo(x,y);st=true;});ctx.stroke();});}
    else{const mx=Math.max(...h.map(r=>r.tot),10),k=Math.floor(Math.log10(mx)/3)*3,sc=Math.pow(10,k),nm={0:'',3:'thousand',6:'million',9:'billion',12:'trillion',15:'quadrillion'}[k]||('× 10^'+k);
      const ax=axes(ctx,box,{xmin:0,xmax:N,ymin:0,ymax:mx/sc*1.1,xl:'Cycle number',yl:'DNA copies'+(nm?' ('+nm+')':'')});
      [['tot',0],['tgt',1]].forEach(([kk,i])=>{ctx.strokeStyle=serColor(i);ctx.lineWidth=2.5;ctx.beginPath();h.forEach((r,j)=>{const x=ax.X(r.n),y=ax.Y(r[kk]/sc);j?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();});}
    legend(ctx,box.L+12,box.T+10,[{label:'All copies',color:serColor(0)},{label:'Exactly the target',color:serColor(1)}]);},
  narrate(sim){const s=sim.st,p=sim.p,pr=primers(sim),ph=phaseOf(sim),hon=atLeast('honors');
    if(s.done){if(!pr.valid)return '<b>No product.</b> '+(pr.f.ok?'The reverse primer':'The forward primer')+' points the wrong way, so the copies never reach the other primer. A reverse primer must be the <b>reverse complement</b> of the end of the target.';
      if(bandI(s.XX)<0.05&&p.anneal>pr.minTm-2)return '<b>Almost no product.</b> At '+p.anneal+' °C the primers can’t stay stuck to the DNA (their Tm is about '+pr.minTm+' °C), so Taq has nowhere to start.';
      return 'Done. '+p.cycles+' cycles turned '+words(+p.start)+' starting copies into <b>'+words(s.OO+s.OL+s.LX+s.XX)+'</b>.'+(bandI(s.ns)>0.05?' The annealing temperature was low enough that primers also stuck to the wrong places, so extra bands appear.':'');}
    if(ph.i===0)return '<b>Denature, 95 °C.</b> Heat breaks the hydrogen bonds between the bases, and the two strands of every DNA molecule come apart.';
    if(ph.i===1){if(!pr.valid)return '<b>Anneal, '+p.anneal+' °C.</b> A primer is binding, but it faces the wrong way: its copy will run off the end of the gene instead of toward the other primer.';
      if(pr.bf<0.3||pr.br<0.3)return '<b>Anneal, '+p.anneal+' °C.</b> Too hot: the primers keep falling off. '+(hon?'Their Tm is about '+pr.minTm+' °C, so the annealing step should be a few degrees below that.':'');
      return '<b>Anneal, '+p.anneal+' °C.</b> The tube cools so the short primers can base-pair with each single strand, one at each end of the target.';}
    return '<b>Extend, 72 °C.</b> Taq polymerase, from bacteria in hot springs, adds nucleotides to the end of each primer and builds a new complementary strand. After this cycle there are about <b>'+words((s.OO+s.OL+s.LX+s.XX)*(1+(s.E||1)))+'</b> copies.';},
  initVis(sim){const r=rng(3);sim.vis.jit=[];for(let i=0;i<64;i++)sim.vis.jit.push([r(),r()]);},
  draw(sim,ctx,vdt,k,t){
    const s=sim.st,p=sim.p,pr=primers(sim),ph=phaseOf(sim),hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // ---------- thermocycler ----------
    const hot=clamp((s.T-4)/91,0,1),blk=`rgb(${Math.round(lerp(70,214,hot))},${Math.round(lerp(120,70,hot))},${Math.round(lerp(200,60,hot))})`;
    ctx.fillStyle='#4a4f58';rr(ctx,20,40,190,205,14);ctx.fill();ctx.fillStyle='#5b616b';rr(ctx,28,30,174,26,10);ctx.fill();
    ctx.fillStyle=blk;rr(ctx,34,64,162,40,8);ctx.fill();
    for(let i=0;i<6;i++){const x=48+i*26;ctx.fillStyle='#eef2f5';ctx.beginPath();ctx.moveTo(x-7,60);ctx.lineTo(x+7,60);ctx.lineTo(x+4,96);ctx.lineTo(x,100);ctx.lineTo(x-4,96);ctx.closePath();ctx.fill();ctx.fillStyle='#d8e6ef';rr(ctx,x-8,54,16,8,3);ctx.fill();}
    ctx.fillStyle='#14181d';rr(ctx,34,114,162,92,8);ctx.fill();
    txt(ctx,s.done?'HOLD':'CYCLE '+(s.n+1)+' / '+p.cycles,46,138,{s:13*k,w:700,c:'#9fe3a1'});
    txt(ctx,s.T.toFixed(0)+' °C',46,172,{s:26,w:700,c:'#ffffff'});
    txt(ctx,s.done?'Holding at 4 °C':ph.name,46,196,{s:12.5*k,c:'#cfd6dd'});
    ['95°','Ta','72°'].forEach((l,i)=>{const x=34+i*54;ctx.fillStyle=ph.i===i?'#C11430':'#6b717b';rr(ctx,x+2,214,50,22,6);ctx.fill();txt(ctx,i===1?p.anneal+'°':l,x+27,229,{s:12*k,w:700,c:'#fff',a:'center'});});
    txt(ctx,'Thermocycler',115,262,{s:13*k,w:700,a:'center'});
    // ---------- molecule view ----------
    const X0=240,X1=585,bx=b=>X0+(X1-X0)*b/L,cy=140;txt(ctx,'Inside the tube: one DNA molecule',X0,36,{s:13*k,w:700});
    let gap=10;if(ph.i===0)gap=lerp(10,74,clamp(ph.cp/0.35,0,1));else if(ph.i<3)gap=74;if(s.done)gap=10;
    const yT=cy-gap/2,yB=cy+gap/2;
    const strand=(y,c,x0,x1)=>{ctx.strokeStyle=c;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();};
    if(gap<14){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;for(let b=2;b<L;b+=5){ctx.beginPath();ctx.moveTo(bx(b),yT);ctx.lineTo(bx(b),yB);ctx.stroke();}}
    strand(yT,PAL['s2'],X0,X1);strand(yB,PAL['s2'],X0,X1);
    txt(ctx,'5′',X0-16,yT+4,{s:11*k,c:PAL['cv-soft']});txt(ctx,'3′',X1+6,yT+4,{s:11*k,c:PAL['cv-soft']});txt(ctx,'3′',X0-16,yB+4,{s:11*k,c:PAL['cv-soft']});txt(ctx,'5′',X1+6,yB+4,{s:11*k,c:PAL['cv-soft']});
    if(ph.i===0&&!s.done){const a=clamp(ph.cp/0.3,0,1);ctx.globalAlpha=0.5*(1-Math.abs(a-0.5)*2)+0.2;txt(ctx,'≈ 95 °C: strands separate',(X0+X1)/2,cy+4,{s:12*k,w:700,c:PAL['s1'],a:'center'});ctx.globalAlpha=1;}
    if(ph.i>=1&&!s.done){
      const fp=pr.f,rp=pr.r,approach=ph.i===1?clamp((ph.cp-0.5)/0.35,0,1):1;
      const drawP=(x0,x1,y,col,dir,stuck)=>{const off=stuck?0:(1-approach)*0+18+Math.sin(t*6+x0)*4;const yy=y+(dir>0?-1:1)*(stuck?7:7+off);
        ctx.strokeStyle=col;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x0,yy);ctx.lineTo(x1,yy);ctx.stroke();ctx.fillStyle=col;const hx=dir>0?x1:x0;ctx.beginPath();ctx.moveTo(hx+dir*9,yy);ctx.lineTo(hx,yy-6);ctx.lineTo(hx,yy+6);ctx.closePath();ctx.fill();return yy;};
      // forward primer: if its sequence matches the top strand it pairs with the bottom strand and points right
      const fBind=pr.bf>0.35,rBind=pr.br>0.35;
      const fy=fp.ok?yB:yT,fdir=fp.ok?1:-1,ry=rp.ok?yT:yB,rdir=rp.ok?-1:1;
      const fyy=drawP(bx(fp.a),bx(fp.b),fy,PAL['s4'],fdir,fBind&&approach>0.95);
      const ryy=drawP(bx(rp.a),bx(rp.b),ry,PAL['s5'],rdir,rBind&&approach>0.95);
      if(!fBind)pill(ctx,'falls off',bx((fp.a+fp.b)/2),fyy+(fdir>0?-16:16),PAL['card'],PAL['s1'],11*k);
      if(!rBind)pill(ctx,'falls off',bx((rp.a+rp.b)/2),ryy+(rdir>0?-16:16),PAL['card'],PAL['s1'],11*k);
      if(ph.i===2){const f=clamp((ph.cp-1)/0.8,0,1);
        if(fBind){const xs=fdir>0?bx(fp.b):bx(fp.a),xe=fdir>0?lerp(xs,X1,f):lerp(xs,X0,f);strand(fyy,PAL['s1'],xs,xe);ctx.fillStyle='#2b7a68';rr(ctx,xe-11,fyy-11,22,22,8);ctx.fill();}
        if(rBind){const xs=rdir<0?bx(rp.a):bx(rp.b),xe=rdir<0?lerp(xs,X0,f):lerp(xs,X1,f);strand(ryy,PAL['s1'],xe,xs);ctx.fillStyle='#2b7a68';rr(ctx,xe-11,ryy-11,22,22,8);ctx.fill();}
        if(fBind||rBind)txt(ctx,'Taq',(fBind?(fdir>0?lerp(bx(fp.b),X1,f):lerp(bx(fp.a),X0,f)):(rdir<0?lerp(bx(rp.a),X0,f):lerp(bx(rp.b),X1,f))),fBind?fyy+26:ryy-18,{s:11*k,w:700,c:PAL['cv-ink'],a:'center'});}}
    // legend for molecule view
    [[PAL['s2'],'template'],[PAL['s4'],'forward primer'],[PAL['s5'],'reverse primer'],[PAL['s1'],'new DNA']].forEach(([c,l],i)=>{const lx=X0+(i%2)*175,ly=226+Math.floor(i/2)*18;ctx.fillStyle=c;ctx.fillRect(lx,ly-8,14,6);txt(ctx,l,lx+18,ly,{s:11.5*k,c:PAL['cv-soft']});});
    // ---------- gel ----------
    const GX=610,GY=40,GW=170,GH=205;ctx.fillStyle='#1b2a33';rr(ctx,GX,GY,GW,GH,8);ctx.fill();
    const gy=bp=>GY+28+(Math.log10(600)-Math.log10(bp))/(Math.log10(600)-Math.log10(40))*(GH-44);
    ctx.fillStyle='#0d1418';rr(ctx,GX+22,GY+10,34,7,2);ctx.fill();rr(ctx,GX+104,GY+10,34,7,2);ctx.fill();
    [50,100,150,200,300,500].forEach(bp=>{ctx.fillStyle='rgba(200,255,220,.75)';ctx.fillRect(GX+22,gy(bp)-2,34,4);txt(ctx,String(bp),GX+20,gy(bp)+4,{s:10.5*k,c:'#9fb3bd',a:'right'});});
    const bi=bandI(s.XX);if(pr.valid&&bi>0){ctx.fillStyle='rgba(170,255,200,'+(0.15+0.85*bi)+')';ctx.fillRect(GX+104,gy(pr.len)-3,34,6);}
    const ni=bandI(s.ns);if(ni>0){ctx.fillStyle='rgba(170,255,200,'+(0.1+0.7*ni)+')';[62,260,410].forEach(bp=>ctx.fillRect(GX+104,gy(bp)-2,34,4));}
    txt(ctx,'Ladder',GX+39,GY+GH-6,{s:11*k,c:'#cfd6dd',a:'center'});txt(ctx,'PCR',GX+121,GY+GH-6,{s:11*k,c:'#cfd6dd',a:'center'});
    txt(ctx,'Gel of a sample taken now',GX+GW/2,262,{s:12.5*k,w:700,a:'center'});
    // ---------- copies counter ----------
    const tot=s.OO+s.OL+s.LX+s.XX;txt(ctx,'Copies in the tube',22,290,{s:13*k,w:700});
    txt(ctx,words(tot),22,326,{s:26,w:700,c:PAL['s1']});
    const N0=+p.start,ratio=tot/N0;const icons=Math.min(64,Math.round(ratio));
    for(let i=0;i<64;i++){const cx=26+(i%16)*21,cy2=346+Math.floor(i/16)*22;ctx.globalAlpha=i<icons?1:0.15;ctx.strokeStyle=i<Math.round(s.XX/N0)?PAL['s1']:PAL['s2'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,cy2);ctx.lineTo(cx+14,cy2);ctx.moveTo(cx,cy2+6);ctx.lineTo(cx+14,cy2+6);ctx.stroke();}
    ctx.globalAlpha=1;txt(ctx,ratio>64?'Each icon = '+words(N0)+'. Past 64 icons the counter keeps doubling: ×'+words(ratio)+' so far.':'One icon per starting molecule’s worth of copies (×'+Math.round(ratio)+')',22,442,{s:11.5*k,c:PAL['cv-soft']});
    // ---------- primer map ----------
    const MX=400,MW=380,mx=b=>MX+MW*b/L,YT=318,YB=346;txt(ctx,hon?'Primer map on the GFP gene (150 bp)':'Where the primers bind',MX,286,{s:13*k,w:700});
    ctx.fillStyle=PAL['s2'];ctx.fillRect(MX,YT,MW,5);ctx.fillRect(MX,YB,MW,5);txt(ctx,'5′',MX-4,YT+6,{s:10.5*k,c:PAL['cv-soft'],a:'right'});txt(ctx,'3′',MX-4,YB+6,{s:10.5*k,c:PAL['cv-soft'],a:'right'});
    for(let b=0;b<=L;b+=25){ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(mx(b),YB+7,1,5);txt(ctx,String(b),mx(b),YB+22,{s:10*k,c:PAL['cv-soft'],a:'center'});}
    const pm=(pp,col,isF)=>{const onBottom=isF?pp.ok:!pp.ok,y=onBottom?YB-11:YT+8,dir=isF?(pp.ok?1:-1):(pp.ok?-1:1);ctx.fillStyle=col;ctx.fillRect(mx(pp.a),y,mx(pp.b)-mx(pp.a),5);const hx=dir>0?mx(pp.b):mx(pp.a);ctx.beginPath();ctx.moveTo(hx+dir*8,y+2.5);ctx.lineTo(hx,y-3);ctx.lineTo(hx,y+8);ctx.closePath();ctx.fill();};
    pm(pr.f,PAL['s4'],true);pm(pr.r,PAL['s5'],false);
    if(pr.valid){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(mx(pr.f.a),310);ctx.lineTo(mx(pr.r.b),310);ctx.stroke();ctx.setLineDash([]);txt(ctx,'product '+pr.len+' bp',mx(pr.r.b),305,{s:11*k,w:700,c:PAL['s1'],a:'right'});}
    if(hon){txt(ctx,'F 5′-'+pr.f.seq+'-3′',MX,394,{s:11.5*k,c:PAL['cv-ink'],w:600});txt(ctx,'R 5′-'+pr.r.seq+'-3′',MX,412,{s:11.5*k,c:PAL['cv-ink'],w:600});
      txt(ctx,'Tm '+pr.tf+' °C / '+pr.tr+' °C  ·  annealing at '+p.anneal+' °C'+(pr.valid?'':'  ·  a primer faces the wrong way'),MX,432,{s:11.5*k,c:pr.valid?PAL['cv-soft']:PAL['s1']});}
    else txt(ctx,'The primers mark the two ends of the piece that gets copied.',MX,400,{s:12*k,c:PAL['cv-soft']});
  },
  tour:[
    {title:'The thermocycler',text:'The tube holds the DNA template, two short primers, free nucleotides (A, T, G, C) and Taq polymerase. The machine just changes the temperature, over and over.',focus:[15,25,200,245],speed:1},
    {title:'Step 1: denature at 95 °C',text:'Heat breaks the hydrogen bonds holding the two strands together. Every double-stranded molecule separates into two single strands.',focus:[225,22,370,235],speed:0.1,setup(sim){sim.st.clock=2*sim.st.n+0.01;}},
    {title:'Step 2: anneal',text:{bio:'The tube cools. Primers, short pieces of DNA, stick to each single strand, one at each end of the region we want to copy.',honors:'The tube cools to the annealing temperature, a few degrees below the primers’ Tm. The forward primer pairs with the bottom strand and the reverse primer pairs with the top strand.'},focus:[225,22,370,235],speed:0.1,setup(sim){sim.st.clock=2*sim.st.n+0.5;}},
    {title:'Step 3: extend at 72 °C',text:'Taq polymerase works best at 72 °C. It starts at the end of each primer and adds nucleotides that match the template, building a new strand.',focus:[225,22,370,235],speed:0.1,setup(sim){sim.st.clock=2*sim.st.n+1.0;}},
    {title:'Copies double every cycle',text:'Each cycle copies every molecule in the tube, so 1 → 2 → 4 → 8. After 30 cycles one starting molecule can become about a billion copies.',focus:[15,272,380,175],speed:2},
    {title:'Seeing the product',text:'A gel separates DNA by size. Once there are billions of copies, a bright band appears at exactly the length between the two primers.',focus:[600,30,190,240],speed:4},
    {lvl:'honors',title:'Designing primers',text:'Forward primer: the first 18–24 bases of the top strand, written 5′→3′. Reverse primer: the reverse complement of the last 18–24 bases. Aim for 40–60% GC and Tm values within a few degrees of each other.',focus:[392,272,400,175],pause:true},
    {lvl:'ap',title:'Efficiency and the plateau',text:'Real reactions copy 90–100% of molecules per cycle, so copies = N₀(1+E)ⁿ. Late in the run, primers and nucleotides run low and growth levels off. That plateau is why qPCR measures early cycles.',focus:[15,272,380,175],pause:true}
  ],
  onTourExit(sim){BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'You start with 1,000 copies and run 10 cycles. About how many copies do you end with?',choices:['About 10,000','About 20,000','About 1 million'],correct:2,
     baseline:{start:'1000',cycles:10},changeText:'Running 10 cycles',watch:'curve',at:0,reveal:21,
     explain:{bio:'Copies double every cycle: 1,000 × 2¹⁰ = 1,000 × 1,024 ≈ 1 million. That is the power of doubling.',ap:'N = N₀(1+E)ⁿ = 1,000 × 2¹⁰ ≈ 1.02 × 10⁶ at 100% efficiency.'}},
    {lvl:'bio',q:'What happens to the number of copies in each cycle?',choices:['It goes up by 2','It doubles','It goes up by 10'],correct:1,
     baseline:{start:'1000',cycles:5},changeText:'Running 5 cycles',watch:'curve',at:0,reveal:11,
     explain:{bio:'Every molecule is copied each cycle, so the total doubles: 1,000 → 2,000 → 4,000 → 8,000 → 16,000 → 32,000.'}},
    {lvl:'honors',q:'Your reverse primer was copied straight from the top strand instead of reverse-complemented. What do you get?',choices:['The same product as normal','No product','Twice as much product'],correct:1,
     baseline:{rev:'R2',cycles:15},changeText:'Running with primer R2',watch:'curve',at:0,reveal:31,
     explain:{honors:'A primer copied from the top strand pairs with the bottom strand and points away from the forward primer. The two primers never face each other, so the target is never copied exponentially. Reverse primers must be the reverse complement.'}},
    {lvl:'honors',q:'The primers’ Tm is about 56–58 °C. What happens if you anneal at 66 °C?',choices:['More product, because it’s warmer','Little or no product, because the primers can’t stay attached','Extra wrong-sized bands'],correct:1,
     baseline:{anneal:66,cycles:15},changeText:'Annealing at 66 °C',watch:'curve',at:0,reveal:31,
     explain:{honors:'Above their Tm, primers melt off the template as fast as they bind, so Taq has nowhere to start. Annealing is usually set 3–5 °C below the lower Tm.'}},
    {lvl:'honors',q:'Now you anneal far too cool, at 42 °C. What appears on the gel?',choices:['One clean band','No bands at all','The right band plus extra, wrong-sized bands'],correct:2,
     baseline:{anneal:42,cycles:25},changeText:'Annealing at 42 °C',watch:'curve',at:0,reveal:51,
     explain:{honors:'When it is too cool, primers also stick to places that only partly match, and those get amplified too. The result is extra bands, called nonspecific products.'}},
    {lvl:'ap',q:'The forward primer starts at base 37 and the reverse primer ends at base 118. How long is the product?',choices:['82 bp','118 bp','150 bp'],correct:0,
     baseline:{fwd:'F4',rev:'R3',cycles:15},changeText:'Running with F4 and R3',watch:'curve',at:0,reveal:31,
     explain:{ap:'The product runs from the 5′ end of the forward primer to the 5′ end of the reverse primer: 118 − 37 + 1 = 82 bp. Primers become the ends of every product.'}},
    {lvl:'ap',q:'At 80% efficiency instead of 100%, how much product do you get after 20 cycles?',choices:['About 80% as much','About 1/8 as much','Exactly half as much'],correct:1,
     baseline:{eff:80,cycles:20},changeText:'Running 20 cycles at 80%',watch:'curve',at:0,reveal:41,
     explain:{ap:'(1.8/2)²⁰ = 0.9²⁰ ≈ 0.12, so about 1/8 as much. Small efficiency losses compound every cycle, which is why primer design and conditions matter so much.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does the number of cycles change the number of copies?</p><ol><li>Start with 1,000 copies.</li><li>Run 5, 10, 15 and 20 cycles, recording total copies after each run.</li><li>Plot cycles (x) against copies (y).</li></ol><p>Describe the shape of the graph and explain why it curves upward.</p>',
       honors:'<p><b>Question:</b> Which primer pair and annealing temperature give one clean band?</p><ol><li>Try F1 + R1, F4 + R3, F1 + R2 and F2 + R1 at 52 °C. Record the gel result for each.</li><li>With F1 + R1, test annealing at 42, 48, 52, 58 and 64 °C.</li></ol><p>Write three rules for designing primers and choosing an annealing temperature, each backed by a result.</p>',
       ap:'<p><b>Question:</b> How do efficiency and the plateau shape a PCR curve?</p><ol><li>Record log₁₀ copies after 10, 20, 30 and 40 cycles at 100%, 90% and 70% efficiency.</li><li>Plot on the log graph and find where each curve levels off.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why quantitative PCR reads the threshold cycle early in the run instead of the final amount.</p>'},
  terms:[{t:'PCR',d:'Polymerase chain reaction: repeated heating and cooling that copies one region of DNA millions of times.'},{t:'Primer',d:'A short single strand of DNA that marks where copying starts.'},{t:'Taq polymerase',d:'A heat-stable DNA polymerase from bacteria that live in hot springs.'},{t:'Denature',d:'Separate the two DNA strands with heat (95 °C).'},
    {lvl:'honors',t:'Anneal',d:'Cool so primers base-pair with the template.'},{lvl:'honors',t:'Reverse complement',d:'The sequence of the other strand, read 5′→3′. Reverse primers are written this way.'},{lvl:'honors',t:'Tm (melting temperature)',d:'The temperature at which half of the primer–template pairs fall apart. Wallace rule: 2(A+T) + 4(G+C).'},{lvl:'honors',t:'Nonspecific product',d:'DNA amplified from the wrong place because primers stuck where they only partly match.'},
    {lvl:'ap',t:'Amplification efficiency',d:'The fraction of molecules copied per cycle, usually 90–100%.'},{lvl:'ap',t:'Plateau',d:'The late stage where primers and nucleotides run low and copies stop doubling.'}],
  about:'<p><b>Model:</b> each cycle is 0.5 min at 95 °C, 0.5 min at the annealing temperature and 1 min at 72 °C. The model tracks four kinds of double-stranded molecule: original, original + long, long + exact, and exact + exact. The exact + exact molecules are the target-length product, which first appears in cycle 3. Each molecule is copied with probability E = efficiency × forward-primer binding × reverse-primer binding × (1 − total/10¹³). Primer binding = 1/(1 + e<sup>(Ta − (Tm + 1))/0.8</sup>), with Tm from the Wallace rule. Nonspecific products grow when the annealing temperature is more than about 6 °C below the lower Tm. A band becomes visible above roughly 10⁹ copies.</p><p><b>Simplified:</b> real Tm depends on salt and primer concentration (the Wallace rule is a rough guide). Primer dimers, mispriming details, and the initial 2-minute denaturation are left out. The template is the first 150 bases of the GFP gene used in pGLO.</p>'
};
BioLab.register(PCR);
})();
