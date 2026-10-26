(function(){
'use strict';
const {clamp,randn,binom,rr,txt,pill,atLeast,PAL,RM,axes,bars,legend,serColor,fmtNum}=BioLab.h;

/* ---------- the experiment ----------
   Each plate is spread with ~120 living E. coli cells (colony-forming units).
   A cell that survives the treatment grows into a colony; the colony becomes
   visible after about 20 doublings (~1 million cells). Colonies are counted at
   the end of incubation, so slow growth means fewer visible colonies. */
const IVS={
  temp:{name:'Temperature',short:'temperature',unit:'°C',sets:{3:[25,37,45],4:[20,30,37,45],5:[20,25,30,37,45]},ctrl:37,fmt:v=>v+' °C'},
  sugar:{name:'Sugar in the agar',short:'sugar',unit:'%',sets:{3:[0,0.5,2],4:[0,0.25,1,2],5:[0,0.25,0.5,1,2]},ctrl:0,fmt:v=>v+'% sugar'},
  anti:{name:'Antibiotic dose',short:'antibiotic dose',unit:'µg/mL',sets:{3:[0,2,8],4:[0,1,4,16],5:[0,1,2,4,8]},ctrl:0,fmt:v=>v+' µg/mL'},
  uv:{name:'UV exposure',short:'UV exposure time',unit:'s',sets:{3:[0,15,45],4:[0,10,30,60],5:[0,10,20,30,60]},ctrl:0,fmt:v=>v+' s UV'}};
const BASE={T:37,S:1,D:0,U:0};
const CFU=120;
function mu(T){const a=8,o=39,b=47,m=2.0;if(T<=a||T>=b)return 0;  // cardinal temperature model, doublings per hour
  const num=(T-b)*(T-a)*(T-a),den=(o-a)*((o-a)*(T-o)-(o-b)*(o+a-2*T));return Math.max(0,m*num/den);}
const sugarMult=S=>0.35+0.65*S/(0.2+S);
const antiSurv=D=>1/(1+Math.pow(D/2,3));      // MIC about 2 µg/mL
const uvSurv=U=>Math.exp(-U/12);
function cond(iv,v){const c=Object.assign({},BASE);if(iv==='temp')c.T=v;if(iv==='sugar')c.S=v;if(iv==='anti')c.D=v;if(iv==='uv')c.U=v;return c;}
function poisson(m){if(m<=0)return 0;if(m<30){let L=Math.exp(-m),k=0,p=1;do{k++;p*=Math.random();}while(p>L);return k-1;}return Math.max(0,Math.round(m+Math.sqrt(m)*randn()));}
function makePlate(c){const rate=mu(c.T)*sugarMult(c.S),n=poisson(CFU*antiSurv(c.D)*uvSurv(c.U)),cols=[];
  for(let i=0;i<n;i++){const lag=(1.5+1.5/Math.max(rate,0.05))*Math.exp(0.25*randn())*(1+c.U/30),grow=rate>0.02?20/(rate*Math.exp(0.12*randn())):Infinity;
    const r=0.88*Math.sqrt(Math.random()),a=Math.random()*6.283;cols.push({x:r*Math.cos(a),y:r*Math.sin(a),tv:lag+grow,rate});}
  return {cols,rate};}
function generate(sim,s){const p=sim.p,iv=IVS[p.iv],vals=iv.sets[p.levels],hrs=atLeast('honors')?p.hours:24;
  s.vals=vals;s.plates=vals.map(v=>{const c=cond(p.iv,v);return Array.from({length:p.reps},()=>makePlate(c));});
  s.countT=vals.map((v,i)=>hrs+(p.same?0:6*i));s.end=Math.max(...s.countT);s.h=0;s.lastHr=-1;sim.infoDirty=true;}
function counts(sim){const s=sim.st;return s.plates.map((reps,li)=>reps.map(pl=>{const tc=Math.min(s.h,s.countT[li]);let k=0;for(const c of pl.cols)if(c.tv<=tc)k++;return k;}));}
function stats(sim){return counts(sim).map(a=>{const n=a.length,m=a.reduce((x,y)=>x+y,0)/n,sd=n>1?Math.sqrt(a.reduce((x,y)=>x+(y-m)*(y-m),0)/(n-1)):0;return {a,m,sd,se:n>1?sd/Math.sqrt(n):0};});}
function done(sim){return sim.st.h>=sim.st.end-1e-9;}
function brothLog(t){let y=3+6/(1+Math.exp(-(t-7.5)*0.9));if(t>30)y-=0.05*(t-30);return y;}
function brothPhase(t){return t<2.5?'Lag phase':t<11?'Log (exponential) phase':t<30?'Stationary phase':'Death phase';}
function trendText(sim){const st=stats(sim),m=st.map(x=>x.m),iv=IVS[sim.p.iv],L=m.length;
  if(Math.max(...m)<1)return 'No colonies visible yet';
  const pk=m.indexOf(Math.max(...m)),f=m[0],l=m[L-1];
  if(pk>0&&pk<L-1&&m[pk]>1.25*Math.max(f,l)+2)return 'Most colonies at '+iv.fmt(sim.st.vals[pk])+', fewer on either side';
  if(l>f*1.2+2)return 'More colonies as '+iv.short+' increases';
  if(l<f*0.8-2)return 'Fewer colonies as '+iv.short+' increases';
  return 'About the same at every level';}
function overlapText(sim){if(sim.p.reps<2)return 'Use at least 2 plates per level to get error bars';const st=stats(sim),a=st[0],b=st[st.length-1];
  if(Math.max(a.m,b.m)<1)return 'No colonies counted yet';
  const lo1=a.m-2*a.se,hi1=a.m+2*a.se,lo2=b.m-2*b.se,hi2=b.m+2*b.se,ov=!(hi1<lo2||hi2<lo1);
  return 'Lowest vs. highest level: ±2 SE bars '+(ov?'overlap, so the difference could be chance':'do not overlap, so the difference is probably real');}
function geom(sim){const L=sim.st.vals.length,R=sim.p.reps,x0=20,y0=78,W=585,H=340,cw=W/L,ch=H/R,pr=Math.min(50,Math.min(cw,ch)*0.42);
  return {L,R,x0,y0,W,H,cw,ch,pr,cx:i=>x0+cw*(i+.5),cy:j=>y0+ch*(j+.5)};}

/* ---------- Virtual lab: Mung Bean Germination Lab (CP Biology, Unit 1; see VLAB.md) ----------
   The student designs the experiment: one independent variable (water color, temperature, salinity or pH),
   four sealed bags of 10 mung beans in 10 mL of solution, one of them a control. Each day they count the
   beans whose radicle shows. Every bean gets its own germination time from its bag's condition, using the
   lab's saved seed, so a reload never changes data already recorded. See `about` for the model. */
function mhr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
function mhn(seed,a,b){const u=Math.max(1e-9,mhr(seed,a,b)),w=mhr(seed,a,b+100003);return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*w);}
const MBIV={color:{name:'water color',re:/colou?r|dye/i},temp:{name:'temperature',re:/temp|heat|cold|warm|hot/i},salt:{name:'salinity (salt concentration)',re:/salt|salin|nacl/i},ph:{name:'pH',re:/\bph\b|acid|bas(e|ic)|alkal/i}};
const mbNums=t=>(String(t).replace(/−/g,'-').match(/-?\d+(\.\d+)?/g)||[]).map(Number);
const mbHas=(t,f)=>mbNums(t).some(f);
const MBC=[
  {v:'c0',iv:'color',l:'Water color: none (distilled water only)',s:'No color',ctrl:true,m:t=>/\b(no|none|clear|plain|control|distilled|uncolou?red|without)\b/i.test(t)},
  {v:'cR',iv:'color',l:'Water color: red food coloring',s:'Red',dye:'#d23a3a',m:t=>/red/i.test(t)},
  {v:'cB',iv:'color',l:'Water color: blue food coloring',s:'Blue',dye:'#2f6fd6',m:t=>/blue/i.test(t)},
  {v:'cG',iv:'color',l:'Water color: green food coloring',s:'Green',dye:'#2e9e4f',m:t=>/green/i.test(t)},
  {v:'cY',iv:'color',l:'Water color: yellow food coloring',s:'Yellow',dye:'#e2b82a',m:t=>/yellow/i.test(t)},
  {v:'tF',iv:'temp',l:'Temperature: prep-room freezer (about −18 °C)',s:'Freezer',loc:'freezer',m:t=>/freez|frozen/i.test(t)||mbHas(t,n=>Math.abs(Math.abs(n)-18)<=4)},
  {v:'t4',iv:'temp',l:'Temperature: refrigerator (about 4 °C)',s:'Fridge',loc:'fridge',m:t=>/fridge|refrig|cold/i.test(t)||mbHas(t,n=>n>=1&&n<=8)},
  {v:'t22',iv:'temp',l:'Temperature: room temperature, in the drawer (about 22 °C)',s:'Room temp',ctrl:true,m:t=>/room|drawer|control/i.test(t)||mbHas(t,n=>n>=18&&n<=26)},
  {v:'t32',iv:'temp',l:'Temperature: incubator (about 32 °C)',s:'Incubator',loc:'inc',m:t=>/incubat|warm|hot/i.test(t)||mbHas(t,n=>n>=28&&n<=37)},
  {v:'s0',iv:'salt',l:'Salinity: 0% NaCl (distilled water)',s:'0% NaCl',pct:0,ctrl:true,m:t=>/distilled|no salt|control|none|plain/i.test(t)||mbHas(t,n=>n===0)},
  {v:'s05',iv:'salt',l:'Salinity: 0.5% NaCl',s:'0.5% NaCl',pct:0.5,m:t=>mbHas(t,n=>n===0.5)},
  {v:'s1',iv:'salt',l:'Salinity: 1% NaCl',s:'1% NaCl',pct:1,m:t=>mbHas(t,n=>n===1)},
  {v:'s2',iv:'salt',l:'Salinity: 2% NaCl',s:'2% NaCl',pct:2,m:t=>mbHas(t,n=>n===2)},
  {v:'p3',iv:'ph',l:'pH: 3 (acidic)',s:'pH 3',ph:3,m:t=>mbHas(t,n=>n===3)},
  {v:'p5',iv:'ph',l:'pH: 5',s:'pH 5',ph:5,m:t=>mbHas(t,n=>n===5)},
  {v:'p7',iv:'ph',l:'pH: 7 (neutral)',s:'pH 7',ph:7,ctrl:true,m:t=>/neutral|distilled|control/i.test(t)||mbHas(t,n=>n===7)},
  {v:'p9',iv:'ph',l:'pH: 9',s:'pH 9',ph:9,m:t=>mbHas(t,n=>n===9)},
  {v:'p11',iv:'ph',l:'pH: 11 (basic)',s:'pH 11',ph:11,m:t=>mbHas(t,n=>n===11)}];
const mbC=v=>MBC.find(c=>c.v===v);
const MB={Tb:10,To:35,psi1:-0.78,psib:-1.0,psis:0.3,gr:13};
/* each student's seed lot and lab rooms */
function mbLot(seed){return {viab:0.92+0.05*mhr(seed,1,0),t50:1.05*Math.exp(0.1*mhn(seed,2,0)),room:20.5+3*mhr(seed,3,0),fridge:3+3*mhr(seed,4,0),inc:31+3*mhr(seed,5,0),frz:-20+4*mhr(seed,6,0)};}
function mbTemp(lot,c){return c.loc==='freezer'?lot.frz:c.loc==='fridge'?lot.fridge:c.loc==='inc'?lot.inc:lot.room;}
/* the ten beans in one bag: germination day tg (Infinity = never), radicle growth (mm per day), and how they look */
function mbBeans(seed,lot,j,bag){const c=mbC(bag.c),T=mbTemp(lot,c),out=[];
  const fT=T<=MB.Tb?0:(Math.min(T,MB.To)-MB.Tb)/(22-MB.Tb),psi=MB.psi1*(c.pct||0),ex=c.ph?Math.max(0,Math.abs(c.ph-7)-2):0;
  const phOk=c.ph?(c.ph<7?Math.exp(-ex*ex/(2*1.3*1.3)):Math.exp(-ex*ex/(2*1.5*1.5))):1;
  for(let i=0;i<10;i++){const q=j*16+i,a=bag.att,viable=mhr(seed,100+q,a)<lot.viab,base=lot.t50*Math.exp(0.3*mhn(seed,200+q,a));
    const psib=Math.min(-0.3,MB.psib+MB.psis*mhn(seed,300+q,a));let tg=Infinity;
    if(viable&&c.loc!=='freezer'&&fT>0&&psi>psib&&mhr(seed,400+q,a)<phOk)tg=base*(-psib)/(psi-psib)*(1+0.25*ex*ex)/fT;
    const gs=Math.max(0.15,1+psi/1.2),gp=1/(1+0.15*ex*ex);
    out.push({tg,gr:MB.gr*Math.min(fT,1.8)*gs*gp*Math.exp(0.25*mhn(seed,500+q,a)),frozen:c.loc==='freezer',slow:c.loc==='fridge',
      jx:mhr(seed,600+q,0)-0.5,jy:mhr(seed,700+q,0)-0.5,ang:(mhr(seed,800+q,0)-0.5)*1.1,dir:mhr(seed,900+q,0)<0.5?-1:1});}
  return out;}
const mbV=sim=>sim&&sim.vlab&&sim.vlab.lab&&sim.vlab.lab.id==='mungbean'?sim.vlab:null;
const mbS=sim=>mbV(sim)&&sim.st&&sim.st.B&&sim.st.B.kind==='mb'?sim.st.B:null;
function mbBag(sim,j){const B=mbS(sim);if(!B)return [];const b=sim.vlab.bench,bag=b.bags[j];return bag?mbBeans(sim.vlab.seed,B.lot,j,bag):[];}
function mbCount(sim,j,d){return mbBag(sim,j).filter(x=>x.tg<=d+1e-9).length;}
function mbInit(sim){const b=sim.vlab.bench;if(!Array.isArray(b.bags)||b.bags.length!==4)b.bags=[null,null,null,null];if(!Array.isArray(b.counts)||b.counts.length!==4)b.counts=[[],[],[],[]];
  if(!Number.isFinite(b.day))b.day=0;if(!b.att)b.att=0;if(!Number.isFinite(b.target))b.target=0;return {kind:'mb',lot:mbLot(sim.vlab.seed)};}
/* is the design ready to start? {ok, msg} */
function mbReady(sim){const b=sim.vlab.bench,bags=b.bags||[];const e=bags.findIndex(x=>!x);if(e>=0)return {ok:false,msg:'Fill and seal all four bags. Bag '+(e+1)+' is still empty.'};
  const cs=bags.map(x=>mbC(x.c)),iv0=cs[0].iv,k=cs.findIndex(c=>c.iv!==iv0);
  if(k>0)return {ok:false,msg:'Bag 1 tests '+MBIV[iv0].name+', but Bag '+(k+1)+' tests '+MBIV[cs[k].iv].name+'. A fair test changes only one variable. Refill the bags so all four test the same one.'};
  if(!cs.some(c=>c.ctrl))return {ok:false,msg:'None of your bags is a control. One bag needs the normal condition, with nothing changed, so you have something to compare against. Refill one bag.'};
  return {ok:true,iv:iv0};}
const mbIvOf=sim=>{const r=mbV(sim)?mbReady(sim):null;return r&&r.ok?r.iv:null;};
const mbColBag=(V,K)=>{const n=parseInt(V.raw('c:h:bag:'+K),10);return n>=1&&n<=4?n-1:-1;};
/* checks */
function mbCellCheck(K){return (sim,rv,v)=>{const V=sim.vlab,b=V.bench,j=mbColBag(V,K),d=+rv;
  if(j<0)return 'Choose which bag Column '+(K+1)+' holds in the column table first.';
  if(!b.bags[j])return 'Bag '+(j+1)+' is not set up on the bench yet.';
  if(d>b.day)return 'The bags have only reached day '+b.day+'. Count this row on day '+d+'.';
  if(v<0||v>10||Math.round(v)!==v)return 'Each bag holds 10 beans, so the count is a whole number from 0 to 10.';
  let c=(b.counts[j]||[])[d];if(!Number.isFinite(c))c=mbCount(sim,j,d);
  if(v===c)return null;
  return v>c?'Fewer beans than that had a visible radicle in Bag '+(j+1)+' on day '+d+'. A split seed coat alone does not count. Count again with Magnify.'
    :'More beans than that had a visible radicle in Bag '+(j+1)+' on day '+d+'. Count again with Magnify, and count every bean whose root shows.';};}
function mbHeadCheck(sim,rv,v){const V=sim.vlab,K=['Column 1','Column 2','Column 3','Column 4'].indexOf(rv);if(K<0)return null;const j=mbColBag(V,K);if(j<0)return null;const bag=V.bench.bags[j];if(!bag)return null;const c=mbC(bag.c);
  return c.m(v)?null:'Column '+(K+1)+' holds Bag '+(j+1)+'. Name that bag’s condition in the heading so a reader knows which bag it is.';}
function mbBagSel(sim,rv,v){const V=sim.vlab,K=['Column 1','Column 2','Column 3','Column 4'].indexOf(rv);if(K<0)return null;
  for(let i=0;i<4;i++)if(i!==K&&V.raw('c:h:bag:'+i)===String(v))return 'Bag '+v+' is already in Column '+(i+1)+'. Give each column a different bag.';
  if(!V.bench.bags[(+v)-1])return 'Bag '+v+' is not set up on the bench yet.';return null;}
function mbDesignCheck(sim,rv,v){const iv=mbIvOf(sim);
  if(rv==='Independent variable'){if(iv&&!MBIV[iv].re.test(v))return 'Your four bags differ in '+MBIV[iv].name+'. Check that your independent variable names what you changed.';return null;}
  if(rv==='Dependent variable')return /germinat|sprout|radicle|root/i.test(v)?null:'The dependent variable is what you measure in each bag. Say what you count each day.';
  if(rv==='Control group'){if(!iv)return null;const c=MBC.find(x=>x.iv===iv&&x.ctrl);return c.m(v)?null:'The control group is the bag with the normal condition, kept for comparison. Check which of your bags that is.';}
  if(rv==='Controlled variables')return v.split(/,|;|\band\b|\n/i).filter(x=>x.trim().length>1).length>=2?null:'List at least two things you kept the same in every bag.';
  return null;}
const mbLab=(V,r)=>V.raw('c:lab:a:'+r).trim();
function mbSultan(sim,rv,v){const V=sim.vlab;if(v==='no')return 'Fix this part of your graph, then mark it Yes.';if(v!=='yes')return null;
  const t=mbLab(V,1),x=mbLab(V,2),y=mbLab(V,3);
  if(rv==='Units')return /\(.+\)/.test(x)&&/\(.+\)/.test(y)?null:'Your axis labels need units, in parentheses after each label.';
  if(rv==='Labels'){if(!x||!y)return 'Label both axes under Titles and labels.';for(let i=0;i<4;i++)if(!V.raw('c:h:head:'+i).trim())return 'Column '+(i+1)+' has no heading, so its line has no name in the key.';return null;}
  if(rv==='Title')return t.split(/\s+/).filter(Boolean).length>=3?null:'Your graph needs a title that tells a reader what it shows. Type it under Titles and labels.';
  if(rv==='Axes')return /day|time/i.test(x)&&/bean|germinat|sprout|radicle|seed/i.test(y)?null:'On this graph, time in days runs along the x-axis and the number of germinated beans goes up the y-axis. Check that your axis labels say so.';
  return null;}
/* the student's own graph labels and key */
let MBCUR=null;
const mbRaw=k=>{const V=MBCUR&&mbV(MBCUR);return V?V.raw(k).trim():'';};
const mbSer=K=>({table:'d',x:'day',y:'c'+(K+1),get label(){return mbRaw('c:h:head:'+K)||'Column '+(K+1);}});
/* bench drawing */
const MBLCD='700 VSIZEpx "Consolas","Menlo","DejaVu Sans Mono","Courier New",monospace';
function mbLcd(ctx,x,y,w,h,label,value,k,vsize){ctx.fillStyle='#2b2f36';rr(ctx,x,y,w,h,12);ctx.fill();txt(ctx,label,x+14,y+20,{s:Math.min(12*k,16),w:700,c:'#d7dbe0'});
  const sy=y+30,sh=h-42;ctx.fillStyle='#cfe3c8';rr(ctx,x+12,sy,w-24,sh,6);ctx.fill();ctx.fillStyle='#1b2a1b';ctx.font=MBLCD.replace('VSIZE',String(vsize||48));ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(value,x+w-24,sy+sh/2+2);}
const mbLocText=(lot,c)=>c.loc==='freezer'?'Freezer · −18 °C':c.loc==='fridge'?'Fridge · 4 °C':c.loc==='inc'?'Incubator · 32 °C':'Drawer · 22 °C';
/* one bean at (x,y): sc is the scale, d the day shown */
function mbBean(ctx,x,y,bn,d,sc,capPx,flat){const sw=bn.frozen?0:clamp(d/(bn.slow?1.5:0.4),0,1),rx=7.5*(1+0.22*sw)*sc,ry=5*(1+0.22*sw)*sc,a=bn.ang;
  const split=Number.isFinite(bn.tg)?clamp((d-(bn.tg-0.25))/0.25,0,1):0,germ=d>=bn.tg-1e-9;
  ctx.save();ctx.translate(x,y);ctx.rotate(a);
  if(germ){const L=Math.min(capPx,3*sc+bn.gr*(d-bn.tg)*1.1*sc),s=bn.dir,x0=rx*0.55,c=flat?[x0+L*0.55,0,x0+L*0.95,L*0.22]:[x0+L*0.6,s*L*0.15,x0+L*0.75,s*L*0.6];
    const path=()=>{ctx.beginPath();ctx.moveTo(x0,0);ctx.quadraticCurveTo(c[0],c[1],c[2],c[3]);ctx.stroke();};
    ctx.lineCap='round';ctx.strokeStyle='#b39f68';ctx.lineWidth=3.8*sc;path();ctx.strokeStyle='#fbf7ea';ctx.lineWidth=2.2*sc;path();}
  ctx.fillStyle=bn.frozen?'#66735a':'#4f8a3a';ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,6.2832);ctx.fill();
  ctx.strokeStyle=bn.frozen?'#4b5542':'#355f27';ctx.lineWidth=1*sc;ctx.stroke();
  if(split>0){ctx.fillStyle='#efe3a8';ctx.beginPath();ctx.ellipse(0,0,rx*0.82,ry*0.42*split,0,0,6.2832);ctx.fill();}
  else{ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.ellipse(-rx*0.1,-ry*0.15,rx*0.28,ry*0.16,0,0,6.2832);ctx.fill();}
  ctx.restore();}
function mbBagShape(ctx,x,y,w,h,bag,c){rr(ctx,x,y,w,h,10);ctx.fillStyle=c&&c.loc==='freezer'?'rgba(222,236,250,.9)':c&&c.dye?c.dye+'40':'rgba(170,205,235,.28)';ctx.fill();
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;if(!bag)ctx.setLineDash([6,5]);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=bag?'#c23b3b':PAL['cv-soft'];ctx.fillRect(x+6,y+10,w-12,3);ctx.fillStyle=bag?'#3b6fc2':PAL['cv-soft'];ctx.fillRect(x+6,y+15,w-12,3);}
function mbFrost(ctx,x,y,w,h){ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1;for(let i=0;i<14;i++){const cx=x+10+((i*53)%(w-20)),cy=y+30+((i*97)%(h-40)),r=4+(i%3)*2;ctx.beginPath();for(let a=0;a<3;a++){const t=a*1.047;ctx.moveTo(cx-r*Math.cos(t),cy-r*Math.sin(t));ctx.lineTo(cx+r*Math.cos(t),cy+r*Math.sin(t));}ctx.stroke();}}
function drawMB(sim,ctx,vdt,k){const B=sim.st.B,b=sim.vlab.bench,v=sim.vis,p=sim.p;
  if(v.dd===undefined||v.dd>b.day)v.dd=b.day;if(v.dd<b.day)v.dd=Math.min(b.day,v.dd+Math.max(0,vdt)/(RM?0.05:1.4));const d=v.dd;
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,400,800,50);ctx.fillStyle=PAL['line'];ctx.fillRect(0,400,800,2);
  txt(ctx,'Mung bean germination: 10 beans + 10 mL in each bag',16,28,{s:Math.min(15*k,22),w:700});
  const fs=Math.min(13*k,21);
  for(let j=0;j<4;j++){const x=16+j*138,y=74,w=126,h=270,bag=b.bags[j],c=bag&&mbC(bag.c);
    mbBagShape(ctx,x,y,w,h,bag,c);
    if(bag){if(c.loc==='freezer')mbFrost(ctx,x,y,w,h);
      mbBag(sim,j).forEach((bn,i)=>{const col=i%2,row=(i/2)|0;mbBean(ctx,x+w*(0.3+0.38*col)+bn.jx*10,y+46+row*44+bn.jy*10,bn,d,1,30);});
      pill(ctx,mbLocText(B.lot,c),x+w/2,y-14,c.loc==='freezer'?'#3b6fc2':c.loc==='fridge'?'#4d8fb8':c.loc==='inc'?'#c46a1b':PAL['cv-soft'],'#fff',Math.min(11*k,15));
      txt(ctx,c.s,x+w/2,y+h+44,{s:fs,c:PAL['cv-ink'],a:'center'});}
    else txt(ctx,'Empty',x+w/2,y+h/2,{s:fs,c:PAL['cv-soft'],a:'center'});
    txt(ctx,'Bag '+(j+1),x+w/2,y+h+22,{s:fs,w:700,a:'center'});
    if(p.mbZoom===j+1){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;rr(ctx,x-4,y-4,w+8,h+8,12);ctx.stroke();}}
  const dayTxt=d<b.day-1e-6?'Day '+Math.floor(d)+'…':'Day '+b.day;
  mbLcd(ctx,572,40,214,108,'DAY COUNTER',dayTxt.replace('Day ',''),k,52);
  const X=566,Y=160,W=226,H=232;ctx.fillStyle=PAL['card'];rr(ctx,X,Y,W,H,12);ctx.fill();ctx.strokeStyle=p.mbZoom?PAL['rj']:PAL['line'];ctx.lineWidth=p.mbZoom?2:1;rr(ctx,X,Y,W,H,12);ctx.stroke();
  if(p.mbZoom>0&&b.bags[p.mbZoom-1]){const j=p.mbZoom-1,bn=mbBag(sim,j);txt(ctx,'Magnified: Bag '+(j+1),X+W/2,Y+22,{s:Math.min(13*k,17),w:700,a:'center'});
    bn.forEach((q,i)=>{const col=i%2,row=(i/2)|0,cx=X+38+col*108,cy=Y+50+row*40;txt(ctx,String(i+1),cx-30,cy+4,{s:Math.min(11*k,14),w:700,c:PAL['cv-soft'],a:'center'});mbBean(ctx,cx,cy,Object.assign({},q,{ang:q.ang*0.25}),d,1.9,50,true);});}
  else{txt(ctx,'What counts as germinated',X+W/2,Y+24,{s:Math.min(13*k,17),w:700,a:'center'});
    const demo=[{tg:Infinity,gr:0,ang:0,dir:1},{tg:1.15,gr:0,ang:0,dir:1},{tg:0.4,gr:13,ang:0,dir:1}];
    const ls=Math.min(12*k,14);demo.forEach((q,i)=>{const cx=X+38+i*75;mbBean(ctx,cx-10,Y+74,q,1,1.7,34,true);
      txt(ctx,['Seed','Coat','Radicle'][i],cx,Y+124,{s:ls,w:i===2?700:400,c:i===2?PAL['s3']:PAL['cv-ink'],a:'center'});txt(ctx,['','split','out'][i],cx,Y+124+ls+2,{s:ls,w:i===2?700:400,c:i===2?PAL['s3']:PAL['cv-ink'],a:'center'});
      txt(ctx,i===2?'counts':'not yet',cx,Y+128+2*ls+6,{s:ls,w:i===2?700:400,c:i===2?PAL['s3']:PAL['cv-soft'],a:'center'});});
    txt(ctx,'Count a bean once its radicle',X+W/2,Y+182,{s:Math.min(12*k,15),a:'center'});txt(ctx,'(first root) shows. Magnify a bag',X+W/2,Y+200,{s:Math.min(12*k,15),a:'center'});txt(ctx,'to count it up close.',X+W/2,Y+218,{s:Math.min(12*k,15),a:'center'});}
  const rd=mbV(sim)&&mbReady(sim);if(b.day===0&&rd&&rd.ok)pill(ctx,'Sealed · ready for day 1',676,424,PAL['s3'],'#fff',Math.min(12*k,17));
  else if(b.day>=5)pill(ctx,'Day 5 · last count',676,424,PAL['rj'],'#fff',Math.min(12*k,17));}
function mbNarrate(sim){const b=sim.vlab.bench,n=b.bags.filter(Boolean).length;
  if(!n)return 'Four empty zip-top bags. Choose a bag and its solution or location, then press <b>Fill and seal this bag</b>: it gets 10 mL of solution and 10 mung beans.';
  if(b.day===0){const r=mbReady(sim);if(!r.ok)return 'Bags filled: '+n+' of 4. '+r.msg;return 'All four bags are sealed in place. Record the day 0 count, then advance one day at a time and count again each day.';}
  const fz=b.bags.some(x=>x&&mbC(x.c).loc==='freezer');
  return '<b>Day '+b.day+'.</b> Count the beans in each bag whose radicle, the first root, has pushed out through the seed coat. A split seed coat alone does not count yet.'+(fz?' The freezer bag is frozen solid.':'');}
/* procedure */
const mbb=sim=>sim.vlab.bench;
const mbDayStep=d=>({title:'Day '+d+': count the germinated beans',
  text:'<p>Press <b>Advance one day</b>. Then count the beans in each bag that have germinated so far: the radicle (root) is visible. Use <b>Magnify</b> to look at one bag up close.</p><p>Type each count in the Day '+d+' row of your data table, in the column you gave that bag.</p>'+(d===5?'<p>This is the last count.</p>':''),
  controls:['mb-day','mbZoom'],setup(sim){mbb(sim).target=d;},
  done:sim=>{const V=sim.vlab;return mbb(sim).day>=d&&[0,1,2,3].every(K=>V.raw('c:d:c'+(K+1)+':'+d).trim()!=='');},
  doneHint:sim=>mbb(sim).day<d?'Press <b>Advance one day</b>.':'Type a count for every column in the Day '+d+' row.'});
const LAB_MB={id:'mungbean',title:'Mung Bean Germination Lab',course:'Biology',teachers:'Hill, Baldasare, Weed, Lilyestrom',
  source:{label:'CW - Mung Bean Germination Lab',href:'https://rjhs.instructure.com/courses/16562/assignments/599841'},level:'bio',
  purpose:'<p>Design a controlled experiment. Graph and analyze data from a scientific experiment.</p>',
  background:'<p>A good hypothesis is testable and specific. “Will fertilizer make my lawn grow faster?” is a bad one: it is a question, and it does not say what will be measured. In a controlled experiment you change one thing, the <b>independent variable</b>, and measure its effect, the <b>dependent variable</b>. The <b>control group</b> gets the normal condition, so you have something to compare against, and every other condition stays the same.</p>'+
    '<p>You will test one factor that might affect how mung beans germinate. Your teacher offers four independent variables: the color of the water (food coloring), temperature (room temperature in a drawer, the refrigerator, the prep-room freezer or the incubator), the salinity (salt concentration) of the water, and the pH of the water. Make a total of four bags; one must be a control. Each bag gets 10 mL of solution and 10 mung beans. Use distilled water.</p>'+
    '<p>Germination is usually counted as the radicle (root) emerging from the seed. Mung beans germinate in 1 to 3 days at room temperature in the dark.</p>'+
    '<p><b>About the virtual bench.</b> Each bean gets its own germination time from its bag’s condition, with the natural variation of a real seed lot, so your counts are your own. A bag’s location sets its temperature and its solution sets the salt or pH the beans sit in. One press of <b>Advance one day</b> moves the bags forward 24 hours.</p>',
  materials:['4 zip-top bags and a marker','40 mung beans (10 per bag)','Distilled water','10 mL graduated cylinder','Your choice of: food coloring; the drawer, refrigerator, prep-room freezer and incubator; cylinders of salt solutions; or cylinders of pH solutions','Graph paper, or the graph in this notebook'],
  hypothesis:{prompt:'<p>Write a testable hypothesis for your experiment. Make it specific: name your independent variable and say what you predict will happen to the number of beans that germinate.</p>'},
  setup(sim){MBCUR=sim;BioLab.refresh(sim);},
  teardown(){MBCUR=null;},
  controls:['mbZoom'],
  steps:[
    {title:'Plan your experiment',text:'<p>Choose <b>one</b> independent variable from the four your teacher offers: water color, temperature, salinity or pH. Decide the four conditions you will test. One bag must be a control.</p><p>Write your hypothesis, then fill in the <b>Experimental design</b> table: your independent variable, dependent variable, control group and controlled variables.</p>',
     setup(sim){mbb(sim).target=0;},done:sim=>sim.vlab.raw('hyp').trim()!==''&&sim.vlab.raw('c:v:a:0').trim()!=='',doneHint:'Write your hypothesis and your independent variable first.'},
    {title:'Set up the four bags',text:'<p>For each bag, choose the bag and its solution or location, then press <b>Fill and seal this bag</b>. Each bag gets 10 mL of solution and 10 mung beans.</p><p>Bags that test water color, salinity or pH sit in the drawer at room temperature. Bags that test temperature hold distilled water. You can refill a bag until the experiment starts.</p>',
     controls:['mbBag','mbCond','mb-fill','mb-empty','mbZoom'],setup(sim){mbb(sim).target=0;},
     done:sim=>mbReady(sim).ok,doneHint:sim=>mbReady(sim).msg||''},
    {title:'Build your data table',text:'<p>Your data table has a row for each day and a column for each bag. In the column table, choose which bag goes in each column, and write a heading that names that bag’s condition, with units.</p><p>Write a title for your data table under <b>Titles and labels</b>.</p>',
     setup(sim){mbb(sim).target=0;},
     done:sim=>{const V=sim.vlab,s=[0,1,2,3].map(K=>V.raw('c:h:bag:'+K));return s.every(x=>x!=='')&&new Set(s).size===4&&[0,1,2,3].every(K=>V.raw('c:h:head:'+K).trim()!=='');},
     doneHint:'Choose a different bag for each column, and give every column a heading.'},
    {title:'Day 0: the starting count',text:'<p>The bags are sealed. Count the germinated beans in each bag now, before any time has passed, and type the counts in the Day 0 row.</p>',controls:['mbZoom'],setup(sim){mbb(sim).target=0;},
     done:sim=>[0,1,2,3].every(K=>sim.vlab.raw('c:d:c'+(K+1)+':0').trim()!==''),doneHint:'Type a count for every column in the Day 0 row.'},
    mbDayStep(1),mbDayStep(2),mbDayStep(3),mbDayStep(4),mbDayStep(5),
    {title:'Graph your data',text:'<p>Your line graph draws below from your data table, one line per bag. Type the graph title and both axis labels under <b>Titles and labels</b>. Your column headings name the lines in the key.</p><p>Then check your graph with the <b>SULTAN</b> checklist: Scale, Units, Labels, Title, Axes, Neatness.</p>',controls:['mbZoom'],setup(sim){mbb(sim).target=mbb(sim).day;}},
    {title:'Analyze',text:'<p>Compare each bag with your control. In the Conclusion, write two sentences: “Our data supports/refutes the hypothesis because…”</p><p>A result that refutes your hypothesis is still a good result, as long as your data shows it.</p>',controls:['mbZoom'],setup(sim){mbb(sim).target=mbb(sim).day;}}],
  tables:[
    {id:'v',title:'Experimental design',cols:[{id:'part',label:'',rows:['Independent variable','Dependent variable','Control group','Controlled variables'],
      rowLabels:['Independent variable (what you change)','Dependent variable (what you measure)','Control group','Controlled variables (kept the same in every bag)']},
      {id:'a',label:'Your experiment',input:'text',check:mbDesignCheck}]},
    {id:'h',title:'Build your data table: what each column holds',cols:[{id:'col',label:'',rows:['Column 1','Column 2','Column 3','Column 4']},
      {id:'bag',label:'Bag in this column',input:'select',options:[{v:'1',l:'Bag 1'},{v:'2',l:'Bag 2'},{v:'3',l:'Bag 3'},{v:'4',l:'Bag 4'}],check:mbBagSel},
      {id:'head',label:'Column heading (the bag’s condition, with units)',input:'text',check:mbHeadCheck}]},
    {id:'d',title:'Your data table: number of beans germinated (radicle visible)',cols:[{id:'day',label:'Day',rows:[0,1,2,3,4,5],rowLabels:['0 (setup)','1','2','3','4','5']}].concat([0,1,2,3].map(K=>({id:'c'+(K+1),label:'Column '+(K+1),input:'number',dp:0,check:mbCellCheck(K)})))},
    {id:'lab',title:'Titles and labels',cols:[{id:'what',label:'',rows:['Data table title','Graph title','x-axis label','y-axis label']},{id:'a',label:'What you wrote',input:'text'}]},
    {id:'s',title:'SULTAN graph checklist',cols:[{id:'item',label:'',rows:['Scale','Units','Labels','Title','Axes','Neatness'],
      rowLabels:['S: Scale (even steps, numbers on each axis)','U: Units (on each axis label)','L: Labels (both axes, and a key)','T: Title','A: Axes (the right variable on each axis)','N: Neatness']},
      {id:'ok',label:'Does your graph have it?',input:'select',options:[{v:'yes',l:'Yes'},{v:'no',l:'Not yet'}],check:mbSultan}]}],
  graph:{type:'line',get title(){return mbRaw('c:lab:a:1')||'Graph title: type it under Titles and labels';},get xl(){return mbRaw('c:lab:a:2');},get yl(){return mbRaw('c:lab:a:3');},
    xmin:0,xmax:5,ymin:0,ymax:10,series:[0,1,2,3].map(mbSer)},
  conclusion:{prompt:'<p>Analyze: complete “Our data supports/refutes the hypothesis because…” in 2 sentences. Use numbers from your data table.</p>',cer:false}};

const SIM={
  id:'expdesign',hash:'expdesign',apUnit:0,order:1,tab:'Experiment designer',kind:'Virtual lab',
  card:'Design a bacterial growth experiment: pick one variable to change, keep the rest the same, run replicate plates and graph the results.',
  title:'Experiment designer: the bacterial growth lab',
  lede:{bio:'Choose one thing to change, keep everything else the same, and count the bacterial colonies that grow. That is a fair test.',
        honors:'Design a controlled experiment, pick the right graph for your data, and watch a broth culture move through the phases of growth.',
        ap:'Run replicate plates, then use means, standard deviation and ±2 SE error bars to decide whether a difference is real or just chance.'},
  scale:'Real lab scale: each petri dish is 9 cm across. Each dot is a colony of about a million E. coli cells, all grown from one cell.',
  timeScale:4,dtMax:0.05,prewarm:0,sampleDt:0.5,window:48,unit:'h',timeLabel:'Time',chChange:1,chReveal:30,
  controls:[
    {id:'iv',label:'Independent variable (what you change)',type:'select',def:'temp',lvl:'bio',options:[{v:'temp',l:'Temperature'},{v:'sugar',l:'Sugar in the agar'},{v:'anti',l:'Antibiotic dose'},{v:'uv',l:'UV exposure time'}],onChange(s){generate(s,s.st);}},
    {id:'levels',label:'Number of levels',type:'range',min:3,max:5,step:1,def:4,lvl:'bio',onChange(s){generate(s,s.st);}},
    {id:'reps',label:'Plates per level (replicates)',type:'range',min:1,max:5,step:1,def:3,lvl:'bio',onChange(s){generate(s,s.st);}},
    {id:'same',label:'Keep everything else the same',type:'toggle',def:true,lvl:'bio',help:'Turn off to see a flawed design: plates for higher levels are counted later.',onChange(s){generate(s,s.st);}},
    {id:'hours',label:'Incubation time (kept constant)',type:'seg',def:24,lvl:'honors',options:[{v:24,l:'24 h'},{v:48,l:'48 h'}],onChange(s){generate(s,s.st);}},
    {id:'gtype',label:'Graph type',type:'seg',def:'bar',lvl:'honors',noTrial:true,options:[{v:'bar',l:'Bar'},{v:'line',l:'Line'}]},
    // virtual lab bench only (hidden in the other views)
    {id:'mbBag',label:'Bag to fill',type:'seg',def:1,vlab:true,noTrial:true,options:[{v:1,l:'Bag 1'},{v:2,l:'Bag 2'},{v:3,l:'Bag 3'},{v:4,l:'Bag 4'}]},
    {id:'mbCond',label:'Solution or location for this bag',type:'select',def:'c0',vlab:true,noTrial:true,options:MBC.map(c=>({v:c.v,l:c.l}))},
    {id:'mbZoom',label:'Magnify',type:'seg',def:0,vlab:true,noTrial:true,options:[{v:0,l:'Off'},{v:1,l:'Bag 1'},{v:2,l:'Bag 2'},{v:3,l:'Bag 3'},{v:4,l:'Bag 4'}]}
  ],
  actions:[{id:'run',label:'Run the experiment again',primary:true,run(sim){generate(sim,sim.st);}},
    {id:'mb-fill',label:'Fill and seal this bag',primary:true,vlab:true,enabled:s=>!!mbS(s)&&s.vlab.bench.day===0,
     run(s){if(!mbS(s))return;const b=s.vlab.bench;if(b.day!==0)return;const j=(s.p.mbBag|0)-1;if(j<0||j>3||!mbC(s.p.mbCond))return;b.att=(b.att||0)+1;b.bags[j]={c:s.p.mbCond,att:b.att};b.counts[j]=[mbCount(s,j,0)];
       const nx=[1,2,3].map(i=>(j+i)%4).find(i=>!b.bags[i]);if(nx!==undefined)BioLab.setValues(s,{mbBag:nx+1});}},
    {id:'mb-day',label:'Advance one day',primary:true,vlab:true,enabled:s=>{if(!mbS(s))return false;const b=s.vlab.bench;return b.day<Math.min(5,b.target)&&mbReady(s).ok;},
     run(s){if(!mbS(s))return;const b=s.vlab.bench;if(!(b.day<Math.min(5,b.target))||!mbReady(s).ok)return;b.day++;
       for(let j=0;j<4;j++){if(!Array.isArray(b.counts[j]))b.counts[j]=[];b.counts[j][b.day]=mbCount(s,j,b.day);}}},
    {id:'mb-empty',label:'Empty the bags and start over',vlab:true,enabled:s=>!!mbS(s)&&s.vlab.bench.bags.some(Boolean),
     run(s){if(!mbS(s))return;const b=s.vlab.bench;b.bags=[null,null,null,null];b.counts=[[],[],[],[]];b.day=0;b.att=(b.att||0)+1;s.vis.dd=0;BioLab.setValues(s,{mbBag:1});}}],
  labs:[LAB_MB],
  /* what the bench shows right now (used by the virtual-lab tests) */
  benchRead(sim){const B=mbS(sim);if(!B)return null;const b=sim.vlab.bench;return {day:b.day,shown:sim.vis.dd,bags:b.bags.map(x=>x&&x.c),counts:[0,1,2,3].map(j=>b.bags[j]?mbCount(sim,j,b.day):null)};},
  init(sim){const s={h:0};generate(sim,s);if(mbV(sim))s.B=mbInit(sim);return s;},
  step(sim,dt){if(sim.st.B)return;const s=sim.st;s.h=Math.min(s.end,s.h+dt);const hr=Math.floor(s.h);if(hr!==s.lastHr){s.lastHr=hr;sim.infoDirty=true;}},
  onLevel(sim){const hrs=atLeast('honors')?sim.p.hours:24;if(sim.st.countT&&sim.st.countT[0]!==hrs)generate(sim,sim.st);},
  metrics:[
    {id:'design',label:'Design check',text:true,lvl:'bio',get(sim){return sim.p.same?'Fair test: only '+IVS[sim.p.iv].short+' changes':'Not a fair test: higher levels were also counted 6 h later each';}},
    {id:'total',label:'Colonies counted, all plates',unit:'',lvl:'bio',min:0,max:null,d:0,get(sim){return counts(sim).flat().reduce((a,b)=>a+b,0);}},
    {id:'trend',label:'Pattern so far',text:true,lvl:'bio',get:trendText},
    {id:'phase',label:'Broth culture (37 °C)',text:true,lvl:'honors',get(sim){return brothPhase(sim.st.h);}},
    {id:'sd',label:'Average SD between replicate plates',unit:'colonies',lvl:'ap',min:0,max:30,d:1,get(sim){if(sim.p.reps<2)return NaN;const st=stats(sim);return st.reduce((a,x)=>a+x.sd,0)/st.length;}},
    {id:'overlap',label:'Error-bar check',text:true,lvl:'ap',get:overlapText}
  ],
  graphs:[{id:'results',label:'Results: mean colonies at each level',custom:true},{id:'curve',label:'Broth growth curve',lvl:'honors',custom:true}],defaultGraph:'results',
  plot(sim,ctx,box,id){const s=sim.st,iv=IVS[sim.p.iv];
    if(id==='curve'){const ax=axes(ctx,box,{xmin:0,xmax:48,ymin:3,ymax:10,xl:'Time in broth (h)',yl:'log₁₀ cells per mL'});
      [[0,2.5,'Lag'],[2.5,11,'Log'],[11,30,'Stationary'],[30,48,'Death']].forEach((ph,i)=>{ctx.fillStyle=i%2?PAL['card2']:PAL['card'];ctx.globalAlpha=.6;ctx.fillRect(ax.X(ph[0]),box.T,ax.X(ph[1])-ax.X(ph[0]),box.H);ctx.globalAlpha=1;txt(ctx,ph[2],(ax.X(ph[0])+ax.X(ph[1]))/2,box.T+14,{s:12,c:PAL['muted'],a:'center'});});
      ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.2;ctx.beginPath();for(let t=0;t<=48;t+=0.25){const x=ax.X(t),y=ax.Y(brothLog(t));t?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();for(let t=0;t<=s.h;t+=0.25){const x=ax.X(t),y=ax.Y(brothLog(t));t?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
      ctx.fillStyle=PAL['g-line'];ctx.beginPath();ctx.arc(ax.X(s.h),ax.Y(brothLog(s.h)),4.5,0,6.29);ctx.fill();return;}
    const st=stats(sim),means=st.map(x=>x.m),ymax=Math.max(130,...st.map(x=>x.m+2*x.se))*1.05;
    const ax=axes(ctx,box,{xmin:0,xmax:means.length,ymin:0,ymax,xcats:s.vals.map(v=>iv.fmt(v)),xl:iv.name+' ('+iv.unit+')',yl:'Mean colonies per plate'});
    const line=atLeast('honors')&&sim.p.gtype==='line';
    if(!line)bars(ctx,ax,means,{colors:[PAL['s2']],d:0,labels:!atLeast('ap')});
    else{ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2.5;ctx.beginPath();means.forEach((m,i)=>{const x=ax.X(i+.5),y=ax.Y(m);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
      means.forEach((m,i)=>{ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.arc(ax.X(i+.5),ax.Y(m),5,0,6.29);ctx.fill();});}
    if(atLeast('ap')&&sim.p.reps>1){ctx.strokeStyle=PAL['fg'];ctx.lineWidth=1.6;st.forEach((x,i)=>{const cx=ax.X(i+.5),y1=ax.Y(Math.max(0,x.m-2*x.se)),y2=ax.Y(x.m+2*x.se);
      ctx.beginPath();ctx.moveTo(cx,y1);ctx.lineTo(cx,y2);ctx.moveTo(cx-7,y1);ctx.lineTo(cx+7,y1);ctx.moveTo(cx-7,y2);ctx.lineTo(cx+7,y2);ctx.stroke();});
      legend(ctx,box.L+12,box.T+10,[{label:'mean ± 2 SE',color:PAL['fg']}]);}},
  trials:false,
  infoPanel(sim){const s=sim.st,iv=IVS[sim.p.iv],st=stats(sim),ap=atLeast('ap'),hon=atLeast('honors');
    const ctrlIdx=s.vals.indexOf(iv.ctrl);
    let h=`<div class="p-head"><h3>Your data</h3><span class="count">${done(sim)?'Final counts':'Hour '+Math.floor(s.h)}</span></div>`;
    h+=`<p><b>Changed (independent):</b> ${iv.name.toLowerCase()} · <b>Measured (dependent):</b> colonies counted at ${atLeast('honors')?sim.p.hours:24} h · <b>Control group:</b> ${iv.fmt(iv.ctrl)}</p>`;
    h+=`<div class="tbl-wrap"><table><thead><tr><th>Level</th>${Array.from({length:sim.p.reps},(_,j)=>`<th>Plate ${j+1}</th>`).join('')}<th>Mean</th>${ap?'<th>SD</th><th>±2 SE</th>':''}</tr></thead><tbody>`;
    st.forEach((x,i)=>{h+=`<tr><td>${iv.fmt(s.vals[i])}${i===ctrlIdx?' (control)':''}</td>${x.a.map(v=>`<td>${v}</td>`).join('')}<td>${x.m.toFixed(1)}</td>${ap?`<td>${sim.p.reps>1?x.sd.toFixed(1):'—'}</td><td>${sim.p.reps>1?(2*x.se).toFixed(1):'—'}</td>`:''}</tr>`;});
    h+='</tbody></table></div>';
    if(hon)h+=`<p style="margin-top:8px"><b>Graph tip:</b> ${iv.name} is a number that can take any value in between, so a <b>line graph</b> (or scatter) shows the trend best. A bar graph fits when the levels are separate categories, like different brands of soap.</p>`;
    if(!sim.p.same)h+=`<p style="margin-top:8px;color:var(--bad)"><b>Confounded:</b> plates for each level were also counted at different times (${s.countT.join(', ')} h). Any difference could come from either variable.</p>`;
    return h;},
  narrate(sim){if(sim.st.B&&mbV(sim))return mbNarrate(sim);const s=sim.st,iv=IVS[sim.p.iv];
    if(!sim.p.same)return '<b>Two things change at once.</b> Higher '+iv.short+' plates are also counted later, so extra time could explain extra colonies. You can no longer tell which variable caused the difference.';
    if(s.h<2.5)return 'Hour '+s.h.toFixed(0)+': the bacteria are in the <b>lag phase</b>, adjusting to the plate before they start dividing. Nothing is visible yet.';
    if(!done(sim))return 'Hour '+s.h.toFixed(0)+': each colony becomes visible once one cell has doubled about 20 times, to roughly a million cells. Faster growth means colonies show up sooner.';
    const t=trendText(sim);return '<b>Counting done.</b> '+t+'. '+(sim.p.reps>1?'Each level has '+sim.p.reps+' plates, so one odd plate can’t mislead you.':'With only one plate per level, a single odd plate could mislead you.');},
  initVis(){},
  draw(sim,ctx,vdt,k){if(sim.st.B&&mbV(sim)){drawMB(sim,ctx,vdt,k);return;}const s=sim.st,g=geom(sim),iv=IVS[sim.p.iv],hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    txt(ctx,'Testing: '+iv.name.toLowerCase()+' → colonies counted',20,26,{s:14*k,w:700});
    // column headers
    for(let i=0;i<g.L;i++){const x=g.cx(i);txt(ctx,iv.fmt(s.vals[i]),x,52,{s:13*k,w:700,a:'center'});
      if(s.vals[i]===iv.ctrl)txt(ctx,'control',x,68,{s:11.5*k,w:600,a:'center',c:PAL['s3']});
      else if(!sim.p.same)txt(ctx,'counted at '+s.countT[i]+' h',x,68,{s:11.5*k,w:600,a:'center',c:PAL['s1']});}
    // plates
    for(let i=0;i<g.L;i++)for(let j=0;j<g.R;j++){const cx=g.cx(i),cy=g.cy(j),pr=g.pr,pl=s.plates[i][j],tc=Math.min(s.h,s.countT[i]);
      ctx.fillStyle='#e9d9a6';ctx.beginPath();ctx.arc(cx,cy,pr,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.stroke();
      ctx.strokeStyle='rgba(120,100,50,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,pr*0.93,0,6.29);ctx.stroke();
      for(const c of pl.cols){if(c.tv>s.h)continue;const age=Math.max(0,s.h-c.tv),rad=pr*(0.025+0.0055*Math.min(12,age*c.rate));
        ctx.fillStyle='#fbf6e8';ctx.beginPath();ctx.arc(cx+c.x*pr,cy+c.y*pr,rad,0,6.29);ctx.fill();ctx.strokeStyle='#b9a774';ctx.lineWidth=0.8;ctx.stroke();}
      if(s.h>=s.countT[i]&&!RM){ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,pr+3,0,6.29);ctx.stroke();}}
    // column means under the grid
    const st=stats(sim);for(let i=0;i<g.L;i++)txt(ctx,'mean '+st[i].m.toFixed(0),g.cx(i),g.y0+g.H+16,{s:12.5*k,w:600,a:'center',c:PAL['cv-soft']});
    // right panel: constants card
    rr(ctx,618,40,170,168,10);ctx.fillStyle=PAL['card2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,'Kept the same',630,62,{s:13*k,w:700});
    const lines=[['temp','Temperature','37 °C'],['sugar','Sugar','1%'],['anti','Antibiotic','none'],['uv','UV','none']];
    lines.forEach((l,i)=>{const y=86+i*22;const changed=sim.p.iv===l[0];txt(ctx,l[1]+': '+(changed?'varied':l[2]),630,y,{s:12*k,w:changed?700:400,c:changed?PAL['s2']:PAL['cv-ink']});});
    const hrs=hon?sim.p.hours:24;txt(ctx,'Counted at: '+(sim.p.same?hrs+' h':hrs+'–'+s.end+' h ✗'),630,86+4*22,{s:12*k,w:sim.p.same?400:700,c:sim.p.same?PAL['cv-ink']:PAL['s1']});
    // right panel lower: broth flask (honors) or incubator clock
    if(hon){const lg=brothLog(s.h),turb=clamp((lg-3)/6,0,1),fx=703,fy=260;
      ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(fx-12,fy);ctx.lineTo(fx-12,fy+40);ctx.lineTo(fx-55,fy+130);ctx.quadraticCurveTo(fx-60,fy+142,fx-46,fy+142);ctx.lineTo(fx+46,fy+142);ctx.quadraticCurveTo(fx+60,fy+142,fx+55,fy+130);ctx.lineTo(fx+12,fy+40);ctx.lineTo(fx+12,fy);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.save();ctx.clip();ctx.fillStyle='rgba(214,190,120,'+(0.18+0.72*turb)+')';ctx.fillRect(fx-60,fy+78,120,70);ctx.restore();
      txt(ctx,'Broth culture',fx,fy-10,{s:12.5*k,w:700,a:'center'});pill(ctx,brothPhase(s.h).replace(' phase',''),fx,fy+160,PAL['s4'],'#fff',11.5*k);}
    else{const cx=703,cy=320,R=52,f=clamp(s.h/s.end,0,1);ctx.strokeStyle=PAL['line'];ctx.lineWidth=10;ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.stroke();
      ctx.strokeStyle=PAL['s3'];ctx.beginPath();ctx.arc(cx,cy,R,-1.571,-1.571+6.283*f);ctx.stroke();
      txt(ctx,'Hour '+Math.floor(s.h),cx,cy-2,{s:16*k,w:700,a:'center',b:'middle'});txt(ctx,'of '+s.end,cx,cy+18,{s:12*k,a:'center',c:PAL['cv-soft'],b:'middle'});txt(ctx,'Incubator',cx,cy-R-14,{s:12.5*k,w:700,a:'center'});}
  },
  tour:[
    {title:'The question',text:'You are testing one question: how does the variable you chose affect how well bacteria grow? The thing you change is the <b>independent variable</b>. What you measure, the number of colonies, is the <b>dependent variable</b>.',focus:[0,0,612,76],pause:true},
    {title:'The control group',text:'One set of plates gets the normal condition: no antibiotic, no UV, no sugar, or 37 °C. This <b>control group</b> shows what happens without your change, so you have something to compare against.',focus(sim){const g=geom(sim),i=Math.max(0,sim.st.vals.indexOf(IVS[sim.p.iv].ctrl));return [g.x0+g.cw*i,36,g.cw,g.H+50];},pause:true},
    {title:'Replicates',text:'Each column holds several plates at the same level. One plate could be a fluke, for example if a few cells clumped together. Several <b>replicates</b> show what is typical.',focus(sim){const g=geom(sim);return [g.x0,g.y0,g.W,g.ch];},pause:true},
    {title:'Keep everything else the same',text:'Only one thing changes. Temperature, sugar, antibiotic, UV and counting time stay the same for every plate. These are the <b>constants</b>. If two things change at once, the test is not fair.',focus:[612,34,182,180],pause:true},
    {title:'Incubation',text:'Each colony starts as one bacterium. Watch them appear: a colony becomes visible after about 20 doublings, roughly a million cells. In better conditions they appear sooner and grow bigger.',focus(sim){const g=geom(sim);return [g.x0-6,g.y0-6,g.W+12,g.H+12];},speed:0.6,setup(sim){generate(sim,sim.st);}},
    {title:'Count and compare',text:'At the end of incubation, count the colonies on each plate and average each column. Compare every level with the control.',focus(sim){const g=geom(sim);return [g.x0-6,g.y0-6,g.W+12,g.H+30];},speed:2},
    {lvl:'honors',title:'Growth phases',text:'In broth, bacteria first sit in the <b>lag phase</b>, then double steadily in the <b>log phase</b>. They level off in the <b>stationary phase</b> when food runs low, then decline in the <b>death phase</b> as waste builds up.',focus:[630,230,150,215],speed:3},
    {lvl:'ap',title:'Is the difference real?',text:'The replicate plates in a column vary. Error bars of ±2 standard errors around each mean show how sure you can be. If the bars for two levels don’t overlap, the difference is probably not chance.',focus(sim){const g=geom(sim);return [g.x0-6,g.y0-6,g.W+12,g.H+30];},pause:true}
  ],
  lab:{bio:'<p><b>Question:</b> How does temperature affect how many bacterial colonies grow in 24 hours?</p><ol><li>Choose Temperature, 4 levels and 3 plates per level. Keep everything else the same.</li><li>Let the plates incubate to the end, then read the mean for each temperature in Your data.</li><li>Name your independent variable, dependent variable, control group and two constants.</li></ol><p>Write a claim about temperature and growth, and use two means from your data as evidence.</p>',
       honors:'<p><b>Question:</b> Design your own experiment to test one factor that affects bacterial growth.</p><ol><li>Choose a variable and write a hypothesis in “If… then… because…” form.</li><li>Pick your levels and replicates, and keep everything else the same.</li><li>Run the experiment, then choose the graph type that fits your data and explain why.</li><li>Turn off “Keep everything else the same” and explain why that version can’t answer your question.</li></ol>',
       ap:'<p><b>Question:</b> Is the effect of a low antibiotic dose statistically meaningful?</p><ol><li>Choose Antibiotic dose, 5 levels, 5 plates per level.</li><li>Compare 0 and 1 µg/mL using the means and ±2 SE error bars.</li><li>Rerun with 2 plates per level and compare how wide the error bars are.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain how sample size affects your confidence that two treatments differ.</p>'},
  terms:[{t:'Independent variable',d:'The one thing you change on purpose.'},{t:'Dependent variable',d:'What you measure to see the effect, here the colonies counted.'},{t:'Control group',d:'The plates that get the normal condition, used for comparison.'},{t:'Constants',d:'Everything you keep the same so the test is fair.'},{t:'Replicate',d:'A repeat of the same treatment, to see how much results vary.'},{t:'Colony',d:'A visible pile of about a million bacteria, all grown from one cell.'},
    {lvl:'honors',t:'Confounding variable',d:'A second thing that changes along with your independent variable, so you can’t tell which one caused the effect.'},{lvl:'honors',t:'Lag phase',d:'The start of growth, when bacteria adjust and barely divide.'},{lvl:'honors',t:'Log (exponential) phase',d:'Bacteria double at a steady rate.'},{lvl:'honors',t:'Stationary phase',d:'Growth levels off as food runs out.'},
    {lvl:'ap',t:'Standard deviation (SD)',d:'How spread out the replicate values are around the mean.'},{lvl:'ap',t:'Standard error (SE)',d:'SD ÷ √n. It shows how precisely you know the mean.'},{lvl:'ap',t:'±2 SE error bars',d:'Roughly a 95% confidence range for the mean. Bars that don’t overlap suggest a real difference.'}],
  about:'<p>Each plate is spread with an average of 120 living cells; the actual number varies randomly (Poisson). A cell grows into a visible colony after a lag plus about 20 doublings. Growth rate follows a cardinal temperature model for <i>E. coli</i> (minimum 8 °C, optimum 39 °C, maximum 47 °C, about 2 doublings per hour at best), multiplied by a sugar factor. Antibiotic survival is 1/(1+(dose/2)³), with a MIC near 2 µg/mL, and UV survival is e<sup>−t/12 s</sup>. Each colony’s lag and rate vary a little, so replicate plates differ the way real ones do.</p><p>Simplified: no contamination, no crowding between colonies, and the broth curve is a fixed textbook shape at 37 °C.</p>'+
    '<p><b>The mung bean bench (Virtual lab).</b> Each bag holds 10 beans from a seed lot in which 92 to 97% of the seeds are alive. A live bean’s radicle emerges after a time that varies from bean to bean (log-normal spread), about 1 day at 22 °C in distilled water, so most beans germinate by day 1 or 2, matching the handout’s 1 to 3 days at room temperature. Temperature follows a thermal-time model with a base temperature of 10 °C, in the range reported for mung bean (<i>Vigna radiata</i>, about 8 to 11 °C), and an optimum near 35 °C: the 32 °C incubator germinates beans about 1.8 times faster, the 4 °C refrigerator is below the base temperature so no beans germinate in 5 days, and the −18 °C freezer freezes the water and kills the beans. Salt lowers the water potential of the solution (van ’t Hoff: 1% NaCl is about −0.8 MPa). A hydrotime model gives each bean a base water potential around −1.0 MPa (spread 0.3 MPa); a bean germinates only if the solution is less negative than its base value, and later as the two get closer. That gives roughly 90% germination at 0.5% NaCl, about half at 1% and almost none at 2% by day 5, in line with studies in which mung bean germination falls steeply above about 150 mM NaCl (about 0.9%). For pH, the model lets beans germinate normally from pH 5 to 9, as many legume seeds do, and cuts germination to roughly 30 to 40% and slows it at pH 3 and pH 11. Food coloring has no effect: the dyes are not toxic at these amounts, so a hypothesis that color matters should be refuted by the data. Radicles grow about 13 mm per day at 22 °C, more slowly with salt or extreme pH.</p><p>Simplified for the mung bean bench: each location holds a steady temperature (with a small difference between students’ rooms), the solutions keep their salt and pH (real seeds slowly change the pH of an unbuffered solution), nothing evaporates or grows mold, and the effects are estimates from the studies above rather than one exact data set.</p>',
  challenges:[
    {lvl:'bio',instant:true,q:'You change the temperature and count colonies. Which is the dependent variable?',choices:['The temperature','The number of colonies','The incubator','The type of bacteria'],correct:1,
     explain:'The dependent variable is what you measure, the colonies. It “depends” on the temperature, which is the independent variable you change on purpose.'},
    {lvl:'bio',q:'You test antibiotic doses of 0, 1, 4 and 16 µg/mL with 3 plates each. What happens to the colony count as the dose rises?',choices:['More colonies at higher doses','Fewer colonies at higher doses','About the same at every dose'],correct:1,
     baseline:{iv:'anti',levels:4,reps:3},changeText:'Plates incubating',watch:'results',
     explain:'The antibiotic kills most cells once the dose passes about 2 µg/mL, so fewer cells survive to grow into colonies. The 0 µg/mL plates are the control that shows normal growth.'},
    {lvl:'bio',instant:true,q:'Why put 3 plates at each level instead of 1?',choices:['It makes the bacteria grow faster','One plate could be a fluke, so several show what is typical','The incubator needs to be full'],correct:1,
     explain:'Plates vary by chance: a few more or fewer cells, a slightly drier spot. Averaging several replicates gives a more reliable result.'},
    {lvl:'honors',instant:true,q:'Your independent variable is temperature in °C, a number that can take any value in between. Which graph shows your results best?',choices:['Pie chart','Bar graph','Line graph or scatter plot'],correct:2,
     explain:'Temperature is continuous, so a line graph or scatter plot shows the trend between the points. Use bar graphs for separate categories, like different brands.'},
    {lvl:'honors',q:'A broth culture starts with a few thousand bacteria per mL. During the first 2 hours, what does the population do?',choices:['Doubles every 30 minutes right away','Barely changes (lag phase)','Shrinks'],correct:1,
     at:0.05,reveal:1.6,changeAction:'run',changeText:'Fresh broth inoculated',watch:'curve',
     explain:'Newly added cells spend a lag phase making the enzymes they need for this food. Exponential (log) growth starts afterward.'},
    {lvl:'honors',instant:true,q:'Higher-sugar plates were also counted 6 hours later. They have more colonies. Can you conclude sugar caused it?',choices:['Yes, sugar went up and colonies went up','No, counting time also changed, so either could be the cause'],correct:1,
     explain:'Counting time is a confounding variable. To isolate sugar, every plate has to be counted at the same time.'},
    {lvl:'ap',q:'With 5 plates per level, do the ±2 SE error bars for 0 and 8 µg/mL antibiotic overlap?',choices:['Yes, so the difference could be chance','No, so the difference is probably real'],correct:1,
     baseline:{iv:'anti',levels:5,reps:5},changeText:'Plates incubating',watch:'results',
     explain:'The control averages about 120 colonies, while 8 µg/mL leaves only one or two survivors per plate. The error bars are a few colonies wide, nowhere near touching. Check the Error-bar check readout.'},
    {lvl:'ap',instant:true,q:'A level has a mean of 100 colonies and a standard error of 5. What range do ±2 SE error bars cover?',choices:['95 to 105','90 to 110','98 to 102'],correct:1,
     explain:'2 × SE = 10, so the bars run from 100 − 10 to 100 + 10: 90 to 110.'}
  ],
  thumbSetup(sim){sim.st.h=sim.st.end;}
};
BioLab.register(SIM);
})();
