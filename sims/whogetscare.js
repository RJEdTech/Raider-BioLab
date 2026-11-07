(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,axes,bars,legend,fmtNum}=BioLab.h;

/* Who gets extra care? A synthetic population, ranked for a care program by one of two training labels.
   Each patient: group A (full access) or B (less access), and a number of active chronic conditions k (0–9),
   drawn from the SAME distribution for both groups. Last year's cost = access × ($800 + $3,500 × k) × lognormal noise (σ = 0.45),
   with access = 1 for A and 1 − gap for B. The program flags the top 3% by the chosen label (ties broken at random).
   Seeded RNG, so the same settings always give the same population. */
const N=3000,PK=[.30,.24,.17,.11,.07,.045,.03,.017,.01,.008],SEED0=2026;
function makePop(seed,share){const r=rng(seed),P=[];for(let i=0;i<N;i++){const b=r()<share;let u=r(),k=0,c=PK[0];while(u>c&&k<9){k++;c+=PK[k];}
  let u1=r();while(u1===0)u1=r();const u2=r(),n=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);P.push({b,k,n,t:r(),jx:r()-.5,i});}return P;}
const share=sim=>atLeast('honors')?sim.p.share/100:0.25,topF=sim=>(atLeast('ap')?sim.p.top:3)/100;
function model(sim){const key=[sim.st.seed,share(sim),sim.p.gap,topF(sim)].join('|');if(sim.st.m&&sim.st.m.key===key)return sim.st.m;
  if(!sim.st.P||sim.st.Pkey!==sim.st.seed+'|'+share(sim)){sim.st.P=makePop(sim.st.seed,share(sim));sim.st.Pkey=sim.st.seed+'|'+share(sim);}
  const P=sim.st.P,g=sim.p.gap/100,nf=Math.round(N*topF(sim)),out={key,nf,nB:P.filter(p=>p.b).length};
  P.forEach(p=>{p.cost=(p.b?1-g:1)*(800+3500*p.k)*Math.exp(0.45*p.n-0.1);});
  ['cost','cond'].forEach(L=>{const sc=p=>L==='cost'?p.cost:p.k+0.01*p.t;const S=P.slice().sort((a,b)=>sc(b)-sc(a)||a.i-b.i),F=S.slice(0,nf),set=new Set(F.map(p=>p.i));
   const avg=a=>a.length?a.reduce((x,p)=>x+p.k,0)/a.length:0,band=S.slice(nf,nf*4);
   out[L]={flag:set,fb:F.filter(p=>p.b).length,cut:sc(S[nf-1]),condA:avg(F.filter(p=>!p.b)),condB:avg(F.filter(p=>p.b)),bandA:avg(band.filter(p=>!p.b)),bandB:avg(band.filter(p=>p.b))};});
  sim.st.m=out;return out;}
const cur=sim=>model(sim)[sim.p.label],alt=sim=>model(sim)[sim.p.label==='cost'?'cond':'cost'];
const pctB=sim=>100*cur(sim).fb/model(sim).nf;
const LBL={cost:'last year’s cost',cond:'number of chronic conditions'};
const f1=v=>fmtNum(v,1);
const money=v=>v>=1000?'$'+Math.round(v/1000)+'k':'$'+Math.round(v);
const key=sim=>[sim.st.seed,sim.p.share,sim.p.gap,sim.p.top,sim.p.label].join('|');
const shown=sim=>!!(sim.st&&sim.st.revealed);
const fresh=sim=>{sim.st.revealed=false;sim.st.call=null;sim.st.yt=null;};
const callNow=sim=>{const c=sim.st&&sim.st.call;return c&&c.key===key(sim)?c:null;};
function wrap(ctx,s,x,y,w,o){o=o||{};const size=o.s||13,lh=o.lh||size*1.3;ctx.font=(o.w||400)+' '+size+'px '+FONT;let line='',yy=y;
  String(s).split(' ').forEach(word=>{const t=line?line+' '+word:word;if(ctx.measureText(t).width>w&&line){txt(ctx,line,x,yy,{s:size,w:o.w,c:o.c,a:o.a});yy+=lh;line=word;}else line=t;});
  if(line){txt(ctx,line,x,yy,{s:size,w:o.w,c:o.c,a:o.a});yy+=lh;}return yy;}
/* bottom strip geometry, shared by draw and onClick */
function strip(k){const big=k>1.3,sH=Math.max(58,40*k+14),sY=450-10-sH,bx0=24,bx1=big?500:560,lb=[big?530:600,sY+6,big?246:176,sH-12];return {sH,sY,bx0,bx1,by:sY+sH-14*Math.min(k,1.4)-6,lb};}
const GMAX=60;
/* ---------- Your turn: the count you would expect if the flagged group matched group B's share of patients ---------- */
const expB=sim=>{const m=model(sim);return m.nf*m.nB/N;};
const fmtI=n=>Math.round(n).toLocaleString('en-US');
const YT={
  key:sim=>[sim.st.seed,sim.p.share,sim.p.top].join('|'),
  ans:expB,
  tol:()=>0.6,
  fmt:v=>v.toFixed(1),
  line:sim=>{const m=model(sim);return m.nf+' × '+fmtI(m.nB)+' ÷ '+fmtI(N)+' = '+expB(sim).toFixed(1);},
  wrong:sim=>{const m=model(sim);return [100*m.nB/N,m.nB/m.nf,m.nf*N/m.nB,m.nf*m.nB/100,m.nB*m.nf/N*4];}
};
/* ---------- Your turn, shared machinery: the student computes one number for this case before the call ----------
   YT (defined above) gives the key, answer, tolerance, format and common-slip choices. Canvas buttons are bare numbers;
   they set the `ans` control and submit it. One retry after a wrong answer; a second wrong answer shows the worked math.
   Then the call, then the reveal with the formula and this case's numbers. */
const hashS=s=>{let h=7;for(const c of String(s))h=(h*31+c.charCodeAt(0))%2147483647;return h||1;};
const ytNow=sim=>{const y=sim.st&&sim.st.yt;return y&&y.key===YT.key(sim)?y:null;};
const ytDone=sim=>{const y=ytNow(sim);return !!(y&&y.done);};
function ytChoices(sim){const a=YT.ans(sim),t=YT.tol(sim),f=YT.fmt,seen=new Set([f(a)]),out=[a];
  const add=v=>{if(out.length<4&&Number.isFinite(v)&&(YT.neg||v>0)&&!seen.has(f(v))&&Math.abs(v-a)>t*1.5){seen.add(f(v));out.push(v);}};
  YT.wrong(sim).forEach(add);[1.25,0.8,1.5,0.6,2,0.5].forEach(m=>add(a*m));[1,-1,2,-2,3].forEach(d=>add(a+d*Math.max(t*4,0.5)));
  const r=rng(hashS(YT.key(sim)));for(let i=out.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function ytSubmit(sim,v){let y=ytNow(sim);if(!y){y={key:YT.key(sim),tries:[],done:false,ok:false};sim.st.yt=y;}if(y.done)return;
  y.tries.push(v);if(Math.abs(v-YT.ans(sim))<=YT.tol(sim)+1e-9){y.ok=true;y.done=true;}else if(y.tries.length>=2)y.done=true;}
function ytVerdict(sim){const y=ytNow(sim);if(!y||!y.tries.length)return '';const last=y.tries[y.tries.length-1];
  return 'Your answer: '+YT.fmt(last)+(YT.unit||'')+'. '+(y.ok?'Correct: ':'The math: ')+YT.line(sim)+'.';}
function ytShort(sim){const y=ytNow(sim);if(!y||!y.tries.length)return '';const last=y.tries[y.tries.length-1];return 'Your answer: '+YT.fmt(last)+(YT.unit||'')+(y.ok?', correct.':'; the math gives '+YT.fmt(YT.ans(sim))+(YT.unit||'')+'.');}
/* bottom strip: lines of text, then a row of buttons. Measured first so the drawing above can make room. */
function nLines(ctx,s,w,size,wt){ctx.font=(wt||400)+' '+size+'px '+FONT;let n=0,line='';String(s).split(' ').forEach(word=>{const t=line?line+' '+word:word;if(ctx.measureText(t).width>w&&line){n++;line=word;}else line=t;});return n+(line?1:0);}
function stripPlan(ctx,k,w,parts,btns){let h=10;parts=parts.filter(p=>p&&p.t);parts.forEach(p=>{p.n=nLines(ctx,p.t,w-24,p.s,p.w);h+=p.n*p.s*1.3;});const bh=btns&&btns.length?Math.min(44,24*k+12):0;if(bh)h+=bh+8;return {parts,btns:btns||[],bh,h:h+8};}
function stripDraw(ctx,sim,P,x0,x1,y0,k){ctx.fillStyle=PAL['card2'];rr(ctx,x0,y0,x1-x0,P.h,10);ctx.fill();let y=y0+10;
  P.parts.forEach(p=>{y=wrap(ctx,p.t,x0+12,y+p.s,x1-x0-24,{s:p.s,w:p.w,c:p.c})-p.s;});
  sim.vis.ytR=[];sim.vis.callR=[];if(!P.btns.length)return;const g=8,n=P.btns.length,bw=(x1-x0-24-g*(n-1))/n,by=y+6;
  P.btns.forEach((b,i)=>{const bx=x0+12+i*(bw+g);ctx.fillStyle=PAL[b.off?'card2':'card'];rr(ctx,bx,by,bw,P.bh,9);ctx.fill();ctx.strokeStyle=b.off?PAL['line']:PAL['rj'];ctx.lineWidth=2;ctx.stroke();
    ctx.font='700 '+(12*k)+'px '+FONT;let l=b.l;if(b.short&&ctx.measureText(l).width>bw-10)l=b.short;
    txt(ctx,l,bx+bw/2,by+P.bh/2+1,{s:(b.kind==='yt'?13:12)*k,w:b.kind==='yt'?800:700,a:'center',b:'middle',c:b.off?PAL['cv-soft']:PAL['cv-ink']});
    if(!b.off)(b.kind==='yt'?sim.vis.ytR:sim.vis.callR).push([bx,by,bw,P.bh,b.v]);});}
function ytButtons(sim){const y=ytNow(sim);return ytChoices(sim).map(v=>({l:YT.fmt(v),v,kind:'yt',off:!!(y&&y.tries.some(t=>Math.abs(t-v)<1e-9))}));}
function stripClick(sim,x,y){const hit=R=>(R||[]).find(r=>x>=r[0]&&x<=r[0]+r[2]&&y>=r[1]-4&&y<=r[1]+r[3]+4);
  const a=hit(sim.vis&&sim.vis.ytR);if(a){BioLab.setValues(sim,{ans:a[4]});ytSubmit(sim,a[4]);sim.vis.ytR=null;return true;}
  const c=hit(sim.vis&&sim.vis.callR);if(c){BioLab.setValues(sim,{call:c[4]});SIM.actions.find(a=>a.id==='lock').run(sim);sim.vis.callR=null;return true;}return false;}

function compareText(sim){const m=model(sim),c=cur(sim),a=alt(sim),nf=m.nf,pop=100*m.nB/N,lab=sim.p.label;
  const cc=lab==='cost'?c:a,cn=lab==='cost'?a:c;
  return 'Group B is '+f1(pop)+'% of patients. Ranking by cost flags <b>'+cc.fb+' of '+nf+'</b> from group B ('+f1(100*cc.fb/nf)+'%); ranking by chronic conditions flags <b>'+cn.fb+'</b> ('+f1(100*cn.fb/nf)+'%). '+(cn.fb>cc.fb?'Changing the label gives <b>'+(cn.fb-cc.fb)+' more of the sickest group B patients</b> the extra care.':'Here the two labels flag about the same number from group B.');}

function plan(sim,ctx,k,w){const y=ytNow(sim),m=model(sim),big=k>1.3,S=12*k,M=13*k;
  if(!shown(sim)){const retry=y&&y.tries.length;
    if(big)return stripPlan(ctx,k,w,[{t:'Your turn: '+fmtI(m.nB)+' of '+fmtI(N)+' are group B. If the '+m.nf+' flagged matched that share, how many from B?',s:S,w:800},{t:retry?'Not quite. (part ÷ whole) × '+m.nf+'.':'',s:S,w:600,c:PAL['s1']}],ytButtons(sim));
    return stripPlan(ctx,k,w,[{t:'Your turn: '+fmtI(m.nB)+' of the '+fmtI(N)+' patients are in group B. If the '+m.nf+' flagged patients matched that share, how many would be from group B?',s:M,w:800},
      {t:retry?'Not quite. Find group B’s share (part ÷ whole), then take that share of '+m.nf+'.':(big?'':'Share = part ÷ whole. Then take that share of the '+m.nf+' flagged.'),s:S,w:600,c:retry?PAL['s1']:PAL['cv-soft']}],ytButtons(sim));}
  const c=cur(sim),lab=sim.p.label,call=callNow(sim);
  const l1='If matched: '+YT.line(sim)+(big?'':' group B patients ('+fmtI(m.nB)+' ÷ '+fmtI(N)+' = '+f1(100*m.nB/N)+'%).');
  const l2='Ranked by '+(lab==='cost'?'cost':'conditions')+': '+c.fb+' ÷ '+m.nf+' = '+f1(pctB(sim))+'% of flagged'+(big?'.':', '+(c.fb<expB(sim)?f1(expB(sim)-c.fb)+' fewer':f1(c.fb-expB(sim))+' more')+' than if shares matched.');
  const l3=(ytShort(sim)&&!big?ytShort(sim)+' ':'')+(call?'Your guess: '+call.pick+'%.':'')+(lab==='cost'&&!big?' Now switch the label to chronic conditions.':'');
  return stripPlan(ctx,k,w,[{t:l1,s:S,w:700,c:PAL['cv-soft']},{t:l2,s:S,w:800,c:PAL['rj']},{t:l3,s:S,w:700}],null);}

const SIM={
 id:'whogetscare',hash:'whogetscare',yt:YT,apUnit:11,order:8,kind:'Go further',prereq:['expdesign'],
 tab:'Who gets extra care?',
 card:'Build a population of patients, pick what a care program ranks them by, and see who gets flagged for extra help.',
 title:'Who gets extra care?',
 lede:{bio:'The math: a group’s share of those flagged compared with its share of everyone, part ÷ whole (Biology: science practices and data analysis; Statistics: conditional proportions). A hospital program has room for the 3% of patients who need extra help the most. It can rank patients by how much their care cost last year, or by how sick they are. When one group gets less care for the same illness, those two rankings pick different people.',
  honors:'The training label is what a ranking model is built to predict. Cost is a proxy for health need. With an access gap, the proxy and the need come apart, and the program under-flags the group that gets less care.',
  ap:'Compare flagged shares and illness at the same score. At a fixed cost cutoff, the group with less spending per condition must be sicker to qualify, which is the pattern Obermeyer et al. found in a real hospital algorithm.'},
 scale:'Skill: compare a group’s share of those flagged with its share of everyone. 3,000 made-up patients, one dot each. Cost is on a ×10 scale: each gridline up is ten times more money.',
 aspect:16/9,timeless:true,trials:true,graph:true,controlsTitle:'The program',
 controls:[
  {id:'label',label:'Rank patients by (the training label)',type:'seg',def:'cost',options:[{v:'cost',l:'Last year’s cost'},{v:'cond',l:'Chronic conditions'}]},
  {id:'gap',label:'Access gap: less spent on group B per condition',type:'range',min:0,max:60,step:5,def:30,unit:'%',help:'Same illness, less care paid for. In this model it comes from unequal access.'},
  {id:'ans',label:'Your answer: group B patients you would expect among the flagged if shares matched (Your turn on the canvas)',type:'range',min:0,max:300,step:0.1,def:0,d:1,noTrial:true,help:'Flagged × (group B ÷ all patients). Set it, then press Lock in my answer.'},
  {id:'guess',label:'Your guess: share of flagged patients from group B',type:'range',min:0,max:GMAX,step:1,def:25,unit:'%',noTrial:true,help:'Set it, then press Lock in my guess.'},
  {id:'share',label:'Group B share of all patients',type:'range',min:10,max:50,step:5,def:25,unit:'%',lvl:'honors'},
  {id:'top',label:'Program flags the top',type:'range',min:1,max:10,step:1,def:3,unit:'%',lvl:'ap'}
 ],
 actions:[
  {id:'ytlock',label:'Lock in my answer',run(sim){ytSubmit(sim,sim.p.ans);}},
  {id:'lock',label:'Lock in my guess',primary:true,run(sim){sim.st.call={pick:sim.p.guess,key:key(sim),truth:pctB(sim)};sim.st.revealed=true;}},
  {id:'show',label:'Show the result',run(sim){sim.st.revealed=true;}},
  {id:'hide',label:'New guess: hide the results',run(sim){fresh(sim);}},
  {id:'newpop',label:'New population',run(sim){sim.st.seed=(sim.st.seed*48271)%2147483647;sim.st.m=null;}}
 ],
 init(){return {seed:SEED0,revealed:false,call:null,yt:null,P:null,m:null};},step(){},
 metrics:[
  {id:'popB',label:'Group B share of all patients',unit:'%',d:1,min:0,max:100,get:sim=>100*model(sim).nB/N},
  {id:'expB',label:'Group B flagged if shares matched',unit:'',d:1,min:0,max:null,get:sim=>shown(sim)?expB(sim):null},
  {id:'flagB',label:'Group B share of flagged patients',unit:'%',d:1,min:0,max:100,get:sim=>shown(sim)?pctB(sim):null},
  {id:'nFlagB',label:'Group B patients flagged',unit:'',d:0,min:0,max:null,get:sim=>shown(sim)?cur(sim).fb:null},
  {id:'altB',label:'Group B flagged with the other label',unit:'',d:0,lvl:'honors',min:0,max:null,get:sim=>shown(sim)?alt(sim).fb:null},
  {id:'condA',label:'Chronic conditions, flagged group A (average)',unit:'',d:2,lvl:'honors',min:0,max:9,get:sim=>cur(sim).condA},
  {id:'condB',label:'Chronic conditions, flagged group B (average)',unit:'',d:2,lvl:'honors',min:0,max:9,get:sim=>cur(sim).condB},
  {id:'band',label:'Next in line: group B minus group A conditions',unit:'',d:2,lvl:'ap',min:-3,max:3,get:sim=>cur(sim).bandB-cur(sim).bandA},
  {id:'nflag',label:'Patients flagged',unit:'',d:0,lvl:'ap',min:0,max:null,get:sim=>model(sim).nf}
 ],
 graphs:[{id:'gapg',label:'Group B share of flagged vs. access gap',custom:true}],defaultGraph:'gapg',
 plot(sim,ctx,box){const ax=axes(ctx,box,{xmin:0,xmax:60,ymin:0,ymax:60,xl:'Access gap (%)',yl:'Group B share of flagged (%)'});
  const save=sim.p.gap,pts={cost:[],cond:[]};for(let g=0;g<=60;g+=5){sim.p.gap=g;const m=model(sim);pts.cost.push([g,100*m.cost.fb/m.nf]);pts.cond.push([g,100*m.cond.fb/m.nf]);}sim.p.gap=save;sim.st.m=null;
  const pop=100*model(sim).nB/N;ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([6,5]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(pop));ctx.lineTo(ax.X(60),ax.Y(pop));ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'Group B share of patients',ax.X(60)-4,ax.Y(pop)-6,{s:12,c:PAL['cv-soft'],a:'right'});
  [['cost','s4'],['cond','s3']].forEach(([L,c])=>{ctx.strokeStyle=PAL[c];ctx.lineWidth=2.5;ctx.beginPath();pts[L].forEach((p,i)=>i?ctx.lineTo(ax.X(p[0]),ax.Y(p[1])):ctx.moveTo(ax.X(p[0]),ax.Y(p[1])));ctx.stroke();});
  if(shown(sim)){ctx.fillStyle=PAL['rj'];ctx.beginPath();ctx.arc(ax.X(sim.p.gap),ax.Y(pctB(sim)),6,0,7);ctx.fill();}
  legend(ctx,box.L+12,box.T+12,[{label:'Ranked by cost',color:PAL['s4']},{label:'Ranked by conditions',color:PAL['s3']}]);},
 draw(sim,ctx,vdt,k){const W=800,H=450,sh=shown(sim),m=model(sim),c=cur(sim),lab=sim.p.label,big=k>1.3;sim.vis.k=k;
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,W,H);
  const stage=sh?'rev':ytDone(sim)?'guess':'yt',PS=stage==='guess'?null:plan(sim,ctx,k,W-24),S=PS?Object.assign(strip(k),{sY:450-10-PS.h,sH:PS.h}):strip(k);sim.vis.stage=stage;
  const PL=58+10*k,PR=big?470:500,PT=28+14*k,PB=S.sY-12-30*k,LMIN=2,LMAX=5;
  const X=kk=>PL+(kk+0.5)/10*(PR-PL),Y=v=>PB-(Math.log10(clamp(v,100,100000))-LMIN)/(LMAX-LMIN)*(PB-PT);
  txt(ctx,big?'Cost vs. illness':'Each dot is a patient: illness across, cost up',PL,16+6*k,{s:13*k,w:800});
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;[100,1000,10000,100000].forEach(v=>{ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo(PL,Y(v));ctx.lineTo(PR,Y(v));ctx.stroke();ctx.globalAlpha=1;txt(ctx,money(v),PL-6,Y(v)+4*k,{s:12*k,c:PAL['cv-soft'],a:'right'});});
  for(let kk=0;kk<=9;kk+=(big?3:1))txt(ctx,String(kk),X(kk),PB+14*k+2,{s:12*k,c:PAL['cv-soft'],a:'center'});
  txt(ctx,'Active chronic conditions',(PL+PR)/2,PB+28*k+4,{s:12*k,c:PAL['cv-soft'],a:'center'});
  /* cutoff line */
  if(sh){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2.5;ctx.setLineDash([8,5]);ctx.beginPath();if(lab==='cost'){ctx.moveTo(PL,Y(c.cut));ctx.lineTo(PR,Y(c.cut));}else{const xc=X(Math.floor(c.cut))-(PR-PL)/20;ctx.moveTo(xc,PT);ctx.lineTo(xc,PB);}ctx.stroke();ctx.setLineDash([]);}
  /* dots: unflagged faint, flagged solid with a ring */
  const P=sim.st.P,cA=PAL['s2'],cB=PAL['s4'],dx=(PR-PL)/10*0.78;
  ctx.globalAlpha=.32;P.forEach(p=>{if(sh&&c.flag.has(p.i))return;ctx.fillStyle=p.b?cB:cA;ctx.fillRect(X(p.k)+p.jx*dx-1.5,Y(p.cost)-1.5,3,3);});ctx.globalAlpha=1;
  if(sh){P.forEach(p=>{if(!c.flag.has(p.i))return;const x=X(p.k)+p.jx*dx,y=Y(p.cost);ctx.fillStyle=p.b?cB:cA;ctx.beginPath();ctx.arc(x,y,3.4,0,7);ctx.fill();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;ctx.stroke();});
}
  /* right panel */
  const RX=PR+20,RW=W-12-RX;ctx.fillStyle=PAL['cv-bg2'];rr(ctx,RX-8,12,RW+8,S.sY-24,12);ctx.fill();
  let y=34+4*k;const dot=(col,lb)=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(RX+8,y-4*k,5,0,7);ctx.fill();y=wrap(ctx,lb,RX+20,y,RW-26,{s:12*k,w:700});};
  dot(cA,'Group A: full access');dot(cB,'Group B: '+sim.p.gap+'% less spent per condition');y+=6;
  y=wrap(ctx,'Same illness in both groups. Program: top '+Math.round(topF(sim)*100)+'% = '+m.nf+' patients.',RX,y,RW-10,{s:12*k,c:PAL['cv-soft']})+4;
  const barRow=(lb,v,col)=>{y=wrap(ctx,lb,RX,y,RW-10,{s:12*k});ctx.font='800 '+(12*k)+'px '+FONT;const bw=RW-22-ctx.measureText('00.0%').width;ctx.fillStyle=PAL['card'];rr(ctx,RX,y-8,bw,14,6);ctx.fill();ctx.fillStyle=col;rr(ctx,RX,y-8,Math.max(3,bw*clamp(v/GMAX,0,1)),14,6);ctx.fill();txt(ctx,f1(v)+'%',RX+bw+8,y+4,{s:12*k,w:800});y+=12+10*k;};
  barRow(sh?'Group B, all patients ('+expB(sim).toFixed(1)+' of '+m.nf+' if matched)':'Group B, all patients',100*m.nB/N,PAL['cv-soft']);
  if(sh){barRow('Group B, flagged: '+c.fb+' of '+m.nf,pctB(sim),PAL['rj']);
   if(y<S.sY-30*k){ctx.fillStyle=PAL['cv-soft'];ctx.beginPath();ctx.arc(RX+6,y-4*k,3.4,0,7);ctx.fill();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;ctx.stroke();y=wrap(ctx,'Outlined dots: flagged, top '+Math.round(topF(sim)*100)+'% by '+(lab==='cost'?'cost':'conditions'),RX+16,y,RW-22,{s:12*k,c:PAL['cv-soft']})+2;}
   if(atLeast('honors')&&y<S.sY-40*k)y=wrap(ctx,'Flagged group B averaged '+fmtNum(c.condB,1)+' conditions; group A '+fmtNum(c.condA,1)+'.',RX,y,RW-10,{s:12*k,c:PAL['cv-soft']});}
  else y=wrap(ctx,'Group B, flagged: ? Make your guess below.',RX,y,RW-10,{s:12*k,w:700,c:PAL['cv-soft']});
  /* bottom strip: Your turn, then the guess, then the math */
  if(PS){stripDraw(ctx,sim,PS,12,W-12,S.sY,k);return;}
  ctx.fillStyle=PAL['card2'];rr(ctx,12,S.sY,W-24,S.sH,10);ctx.fill();
  const call=callNow(sim);
  if(!sh){const g=sim.p.guess,BX=v=>S.bx0+v/GMAX*(S.bx1-S.bx0);
   txt(ctx,big?'Your guess: '+g+'% from group B':'Your guess: '+g+'% of flagged patients from group B',S.bx0,S.sY+6+12*k,{s:12*k,w:700});
   ctx.strokeStyle=PAL['line'];ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(S.bx0,S.by);ctx.lineTo(S.bx1,S.by);ctx.stroke();ctx.lineCap='butt';
   ctx.fillStyle=PAL['rj'];ctx.beginPath();ctx.arc(BX(g),S.by,8,0,7);ctx.fill();ctx.strokeStyle=PAL['card'];ctx.lineWidth=2;ctx.stroke();
   const b=S.lb;ctx.fillStyle=PAL['rj'];rr(ctx,b[0],b[1],b[2],b[3],9);ctx.fill();txt(ctx,'Lock in my guess',b[0]+b[2]/2,b[1]+b[3]/2+1,{s:12*k,w:700,c:'#fff',a:'center',b:'middle'});return;}
  const msg=call?('You guessed '+call.pick+'%. The program flagged '+f1(call.truth)+'% from group B ('+c.fb+' of '+m.nf+')'+(Math.abs(call.pick-call.truth)<3?': close.':'.')+(lab==='cost'?' Now switch to chronic conditions.':''))
   :('Ranked by '+(lab==='cost'?'cost':'conditions')+': '+c.fb+' of '+m.nf+' flagged from group B ('+f1(pctB(sim))+'%). The other label: '+alt(sim).fb+'.');
  ctx.font='700 '+(12*k)+'px '+FONT;const two=ctx.measureText(msg).width>W-48;
  wrap(ctx,msg,24,S.sY+S.sH/2+4*k-(two?7*k:0),W-48,{s:12*k,w:700});},
 onClick(sim,x,y){if(shown(sim))return;if(sim.vis.stage!=='guess'){stripClick(sim,x,y);return;}const k=sim.vis&&sim.vis.k||1,S=strip(k),b=S.lb;
  if(x>=b[0]&&x<=b[0]+b[2]&&y>=b[1]&&y<=b[1]+b[3]){SIM.actions.find(a=>a.id==='lock').run(sim);return;}
  if(y>=S.sY&&y<=S.sY+S.sH&&x>=S.bx0-12&&x<=S.bx1+12){BioLab.setValues(sim,{guess:Math.round(clamp((x-S.bx0)/(S.bx1-S.bx0),0,1)*GMAX)});}},
 narrate(sim){const m=model(sim),c=cur(sim),lab=sim.p.label;
  if(!shown(sim)&&!ytDone(sim)){const y=ytNow(sim),m=model(sim);return (y&&y.tries.length?'<b>Not quite.</b> ':'<b>Your turn:</b> ')+fmtI(m.nB)+' of '+fmtI(N)+' patients are in group B. If the '+m.nf+' flagged patients matched that share, how many would be from group B? Click your answer at the bottom.';}
  if(!shown(sim))return ytVerdict(sim)+' Both groups have the same illness, but group B gets '+sim.p.gap+'% less spent per condition. The program flags the top '+Math.round(topF(sim)*100)+'% by <b>'+LBL[lab]+'</b>. <b>Guess:</b> what share of the flagged patients will be from group B? Click the bar under the chart, then Lock in my guess.';
  const call=callNow(sim),lead=call?'<b>You guessed '+call.pick+'%; the program flagged '+f1(call.truth)+'%.</b> ':'';
  if(lab==='cost'&&sim.p.gap>0)return lead+compareText(sim)+(atLeast('honors')?' At the cutoff, group B patients had to be sicker to cost as much.':'');
  if(lab==='cost')return lead+'With no access gap, cost tracks illness the same way in both groups, so group B is flagged at about its share of patients: '+c.fb+' of '+m.nf+'. Now add an access gap.';
  return lead+compareText(sim)+' Ranking by illness ignores how much was spent, so the access gap no longer matters.';},
 challenges:[
  {lvl:'bio',instant:true,q:'Ranked by cost, 6 of the 90 flagged patients are from group B. If the flags matched group B’s share of patients, 90 × 762 ÷ 3,000 ≈ 23 would be. About how many fewer group B patients are flagged than that?',choices:['About 17','About 6','About 29','About 23'],correct:0,explain:'22.9 − 6 = 16.9, about 17 fewer. As shares: 6 ÷ 90 = 6.7% of flagged patients, against 762 ÷ 3,000 = 25.4% of all patients.'},
  {lvl:'bio',instant:true,q:'The program ranks by last year’s cost. Group B gets 30% less spent per condition, with the same illness. How does group B’s share of flagged patients compare with its share of all patients?',choices:['Much lower','About the same','Much higher'],correct:0,explain:'Only 6 of the 90 flagged patients are from group B: 6.7%, against 25.4% of patients. They are just as sick, but less was spent on them, so cost ranks them as healthier.'},
  {lvl:'bio',instant:true,q:'Now the program ranks by the number of chronic conditions. How many of the 90 flagged patients are from group B?',choices:['24','6','90','0'],correct:0,explain:'Ranking by illness doesn’t see spending, so the access gap stops mattering: 24 of 90 (26.7%) are from group B, close to the 22.9 you would expect from its 25.4% share. That is 18 more of the sickest group B patients getting extra care.'},
  {lvl:'honors',instant:true,q:'Ranked by cost, the flagged group B patients average 7.2 chronic conditions and the flagged group A patients 6.5. Why are the flagged group B patients sicker?',choices:['They had to be sicker to reach the same cost','Group B is sicker overall','Random chance only'],correct:0,explain:'Both groups have the same illness distribution. With less spent per condition, a group B patient needs more conditions to reach the same cost cutoff.'},
  {lvl:'honors',instant:true,q:'Set the access gap to 0% and rank by cost. What share of flagged patients is from group B?',choices:['About 22%','About 7%','0%'],correct:0,explain:'With no gap, cost tracks illness the same way in both groups: 20 of 90 flagged (22.2%) are from group B, near its 25.4% share. The gap, not the group, drove the difference.'},
  {lvl:'ap',instant:true,q:'Look at the next patients in line just below the cost cutoff. Group B averages 5.95 conditions and group A 4.81. What does that show?',choices:['At the same cost score, group B patients are sicker','Group B patients cost more','The cutoff is too high'],correct:0,explain:'At similar scores, group B carries about 1.1 more chronic conditions. Obermeyer et al. found the same pattern: at the same risk score, Black patients were considerably sicker than white patients.'},
  {lvl:'ap',instant:true,q:'In the real study, fixing the label would raise Black patients’ share of those automatically flagged from 17.7% to 46.5%. By about what factor is that?',choices:['About 2.6 times','About 1.3 times','About 28 times'],correct:0,explain:'46.5 ÷ 17.7 ≈ 2.63. The share more than doubled just by changing what the algorithm was trained to predict.'}
 ],
 tour:[
  {title:'3,000 patients',text:'Each dot is a made-up patient. Across: how many active chronic conditions they have, like diabetes or asthma. Up: how much their care cost last year. Blue is group A, amber is group B. Both groups are equally sick.',pause:true,setup(sim){BioLab.setValues(sim,{label:'cost',gap:30,share:25,top:3,guess:25});sim.st.seed=SEED0;sim.st.m=null;fresh(sim);}},
  {title:'The access gap',text:'Group B gets 30% less spent on care for the same illness, for example because clinics are farther away or visits are harder to get. Their dots sit lower on the cost scale.',pause:true},
  {title:'The program',text:'The hospital can give extra help, like a nurse who checks in, to the top 3%: 90 patients. Someone has to choose what to rank by. Right now it ranks by last year’s cost.',pause:true},
  {title:'Your turn',text:'Group B is 762 of the 3,000 patients. If the 90 flagged patients matched that share, how many would be from group B? Find the share (part ÷ whole), take that share of 90, and click your answer at the bottom. Then guess what share the program really flags. Or press Next.',pause:true,setup(sim){fresh(sim);}},
  {title:'Ranked by cost',text:'If shares matched, 90 × 762 ÷ 3,000 = 22.9 would be from group B. Ranked by cost, only 6 are: 6 ÷ 90 = 6.7% of flagged, against 25.4% of patients. They were just as sick, but less was spent on them, so cost made them look healthier.',pause:true,setup(sim){sim.st.revealed=true;}},
  {title:'Ranked by illness',text:'Change the label to chronic conditions. Now 24 of 90 are from group B, 26.7%, close to the 22.9 you computed. Same data, same program: one choice moved 18 of the sickest patients into care.',pause:true,setup(sim){BioLab.setValues(sim,{label:'cond'});sim.st.revealed=true;}},
  {title:'This happened',text:'In 2019, Obermeyer and colleagues found a widely used hospital algorithm that predicted cost as a stand-in for need. Black patients were 17.7% of those automatically flagged; fixing the label would raise that to 46.5%.',pause:true,setup(sim){sim.st.revealed=true;}},
  {lvl:'ap',title:'Sicker at the same score',text:'Switch back to cost and look just below the cutoff. At similar cost, group B patients carry about 1.1 more chronic conditions than group A. That is the signature of a biased proxy.',pause:true,setup(sim){BioLab.setValues(sim,{label:'cost'});sim.st.revealed=true;}}
 ],
 lab:{bio:'<p><b>Question:</b> How does the access gap change who gets flagged?</p><ol><li>Rank by last year’s cost. Press Show the result.</li><li>Set the access gap to 0, 15, 30, 45 and 60%. Record a trial at each.</li><li>Switch to chronic conditions and repeat.</li></ol><p>Write one sentence comparing the two labels.</p>',
  honors:'<p><b>Question:</b> Is the gap in flagging caused by the group or by the spending?</p><ol><li>With the gap at 0%, record group B’s share of flagged under both labels for three populations (press New population).</li><li>Repeat with the gap at 30%.</li><li>Compare the average conditions of flagged patients in each group.</li></ol><p>Explain what a fair label has to measure, and name a proxy you’ve seen elsewhere.</p>',
  ap:'<p><b>Question:</b> At the same score, who is sicker?</p><ol><li>Rank by cost with the gap at 30%. Record <b>Next in line: group B minus group A conditions</b> for five populations.</li><li>Repeat ranked by conditions.</li><li>Change the program size from 1% to 10% and record group B’s flagged share.</li></ol><p><b>CER:</b> Claim whether cost is a fair label for health need, with evidence from your table and reasoning about what the label actually measures. Remember that choosing a label is a value choice; say whose needs your choice puts first.</p>'},
 terms:[
  {t:'Algorithm',d:'A set of steps a computer follows, here to rank patients.'},
  {t:'Proxy',d:'Something easy to measure used to stand in for what you really care about, like cost standing in for health need.'},
  {t:'Chronic condition',d:'A long-lasting illness, such as diabetes, asthma or heart disease.'},
  {t:'Training label',d:'The quantity a prediction model is built to predict. Choosing it is a design decision.',lvl:'honors'},
  {t:'Access gap',d:'A difference in how much care people can get for the same illness, because of distance, cost, insurance or treatment.',lvl:'honors'},
  {t:'Calibration by group',d:'Checking whether people with the same score have the same real need in every group.',lvl:'ap'}
 ],
 about:'<p><b>The model.</b> 3,000 synthetic patients from a seeded random number generator, so the same settings always give the same population. Each is in group A or group B (25% by default) and has 0 to 9 active chronic conditions, drawn from the same distribution for both groups (mean about 1.9). Last year’s cost = access × ($800 + $3,500 per condition) × random spread (lognormal, σ = 0.45), where access is 1 for group A and 1 minus the gap for group B. The program flags the top 3% by the chosen label; ties are broken at random. This toy skips the prediction step: it ranks patients by the label itself, as if the algorithm predicted it perfectly. All numbers are assumptions for illustration; it does not reproduce the real study’s figures.</p><p><b>Facts.</b> Obermeyer, Powers, Vogeli and Mullainathan (Science, 2019) studied a widely used commercial algorithm that predicted future health-care cost as a stand-in for health need. Because less money is spent on Black patients with the same level of need, the algorithm rated Black patients as healthier than equally sick white patients; at the same risk score, Black patients were considerably sicker. Black patients were 17.7% of those automatically flagged for extra care, and fixing the label would raise that to 46.5% (<a href="https://pubmed.ncbi.nlm.nih.gov/31649194/" target="_blank" rel="noopener">PubMed 31649194</a>). Cathy O’Neil’s <i>Weapons of Math Destruction</i> warns about models built on proxies in place of what really matters.</p><p><b>The label is a value choice.</b> Cost is easy to measure and predicts what a hospital will spend. Chronic conditions are closer to need but miss severity and other factors. No label is neutral; the question is whose needs it puts first. This tool is a simplified model, not medical advice.</p>',
 thumbSetup(sim){sim.st.revealed=true;}
};
BioLab.register(SIM);

BioLab.addPractical({whogetscare:{
 hook:'Imagine a relative with diabetes and asthma gets a letter from the hospital: a care program has room for the 3% of patients who need extra help most, with a nurse who checks in and help with medicines and appointments. The program can rank patients by how much their care cost last year, or by how many chronic conditions they have. Does the choice change who gets the letter?',
 answer:'In this population, group B is 762 of 3,000 patients (25.4%) and just as sick, but gets 30% less spent per condition. If the 90 flagged matched that share, 90 × 762 ÷ 3,000 = 22.9 would be from group B. Ranked by cost, only 6 of the 90 flagged patients (6.7%) are from group B. Ranked by chronic conditions, 24 are (26.7%). Changing the label gives 18 more of the sickest group B patients the extra care.',
 uses:['Hospital risk scores: Obermeyer et al. (Science, 2019) found a widely used algorithm used cost as a stand-in for need. Fixing the label would raise Black patients’ share of those automatically flagged from 17.7% to 46.5%.','Credit scores: they rank how likely you are to repay from your borrowing record, so someone with little credit history can score low without ever missing a payment. The record is a proxy for reliability.','Your feed: many apps rank posts by predicted engagement, such as clicks and watch time, as a stand-in for what you value. What gets measured is what gets shown.'],
 takeaway:'Compare a group’s share of those flagged with its share of everyone: 6 ÷ 90 = 6.7% against 762 ÷ 3,000 = 25.4%. Cost measured who got care; conditions measured who was sick. Which label would you choose, and who would it leave out?'}});

BioLab.addReview({whogetscare:{questions:[
 {id:'count',kind:'real',lvl:'bio',q:'With the default population (access gap 30%), the program ranks by last year’s cost. How many of the 90 flagged patients are from group B?',num:{ans:6,tol:0.5,unit:'patients'},
  steps:['Press Show the result and read <b>Group B patients flagged</b>.','6 of 90 is 6.7%, although group B is 25.4% of all patients.','Group B was just as sick; less was spent on them, so cost ranked them lower.'],
  lab:{set:{label:'cost',gap:30},act:'show',look:'Read <b>Group B patients flagged</b>.'},verify:[['nFlagB',6,0.5],['flagB',6.67,0.05]]},
 {id:'expect',kind:'test',lvl:'bio',q:'762 of 3,000 patients are in group B. If the 90 flagged patients matched that share, how many would be from group B? Round to 0.1.',num:{ans:22.9,tol:0.1,unit:'patients'},
  steps:['Group B’s share: 762 ÷ 3,000 = 0.254, or 25.4%.','Take that share of the flagged: 90 × 0.254 = 22.9.','The program actually flags 6 when it ranks by cost.'],
  lab:{set:{label:'cost',gap:30},act:'show',look:'Read <b>Group B flagged if shares matched</b>.'},verify:[['expB',22.86,0.01],['popB',25.4,0.01]]},
 {id:'proxy',kind:'test',lvl:'bio',q:'In this tool, what is cost a proxy for?',choices:['Health need','The number of doctors','Group membership','The size of the program'],correct:0,
  steps:['A proxy is an easy-to-measure stand-in for what you really care about.','The program wants to find the patients who need help most. It used last year’s cost to stand in for that need.']},
 {id:'nogap',kind:'real',lvl:'honors',q:'Set the access gap to 0% and rank by cost. What share of flagged patients is from group B (to 0.1%)?',num:{ans:22.2,tol:0.1,unit:'%'},
  steps:['With no gap, cost tracks illness the same way in both groups.','20 of 90 flagged are from group B: 20 ÷ 90 = 22.2%.','That is close to group B’s 25.4% share of patients; the rest is chance in who has high costs.'],
  lab:{set:{label:'cost',gap:0},act:'show',look:'Read <b>Group B share of flagged patients</b>.'},verify:[['flagB',22.22,0.05]]},
 {id:'sicker',kind:'test',lvl:'honors',q:'Ranked by cost with an access gap, flagged group B patients have more chronic conditions on average than flagged group A patients. Why?',choices:['To reach the same cost cutoff with less spent per condition, they had to be sicker','Group B is sicker overall','The program prefers group A on purpose'],correct:0,
  steps:['Both groups have the same illness distribution in this model.','Cost per condition is lower for group B, so a group B patient needs more conditions to pass the same cost cutoff.']},
 {id:'cond',kind:'real',lvl:'ap',q:'Rank by chronic conditions with the default population. How many more group B patients are flagged than when ranking by cost?',num:{ans:18,tol:0.5,unit:'patients'},
  steps:['Ranked by conditions: 24 group B patients flagged.','Ranked by cost: 6.','24 − 6 = 18 more of the sickest group B patients get the program.'],
  lab:{set:{label:'cond',gap:30},act:'show',look:'Read <b>Group B patients flagged</b> and <b>Group B flagged with the other label</b>.'},verify:[['nFlagB',24,0.5],['altB',6,0.5]]},
 {id:'factor',kind:'test',lvl:'ap',q:'Obermeyer et al. reported that fixing the label would raise Black patients’ share of those auto-flagged from 17.7% to 46.5%. How many percentage points is that increase?',choices:['28.8 points','2.6 points','46.5 points','17.7 points'],correct:0,
  steps:['46.5 − 17.7 = 28.8 percentage points.','As a ratio, 46.5 ÷ 17.7 ≈ 2.6 times. Percentage points and percent change are different measures.']}
]}});
})();
