/* Raider BioLab: "Score the city" model, shared by sims/cityscore.js and cityboard.html.
   A made-up neighborhood of 10,000 people on Colorado's Front Range. Four decisions add up to eight measures.
   Every number is an illustrative model value, built so each trend points the way research points. None is a measured city. */
(function(){
'use strict';
const M=[
 {k:'gdp',l:'GDP per person',s:'GDP',low:false,d:0,f:v=>'$'+Math.round(v)+'k',u:'$k per person per year'},
 {k:'jobs',l:'Jobs per 100 residents',s:'Jobs',low:false,d:0,f:v=>String(Math.round(v)),u:'jobs per 100 residents'},
 {k:'rent',l:'Housing cost (share of income)',s:'Housing',low:true,d:0,f:v=>Math.round(v)+'%',u:'% of income'},
 {k:'commute',l:'Commute (minutes a day)',s:'Commute',low:true,d:0,f:v=>Math.round(v)+'m',u:'minutes a day, round trip'},
 {k:'active',l:'Active minutes a day',s:'Active',low:false,d:0,f:v=>Math.round(v)+'m',u:'minutes of walking or biking a day'},
 {k:'air',l:'Unhealthy-air days a year',s:'Bad air',low:true,d:0,f:v=>String(Math.round(v)),u:'days a year'},
 {k:'co2',l:'CO₂ per person',s:'CO₂',low:true,d:1,f:v=>(Math.round(v*10)/10)+'t',u:'metric tons per person per year'},
 {k:'happy',l:'Life satisfaction (0 to 10)',s:'Happy',low:false,d:1,f:v=>(Math.round(v*10)/10).toFixed(1),u:'average survey answer, 0 to 10'}];
const BASE=[50,40,30,30,12,12,6,6.6];
/* Each option adds these amounts to the eight measures, in the order above. */
const DEC=[
 {k:'travel',l:'Getting around',o:[
  {v:'cars',l:'Cars and wide roads',d:[12,2,-2,20,-5,12,6,-0.3],harm:10},
  {v:'bus',l:'Buses and bike lanes',d:[4,2,0,8,6,4,2,0],harm:2},
  {v:'rail',l:'Light rail and walkable streets',d:[6,4,3,4,12,0,0.5,0.1],harm:1}]},
 {k:'power',l:'Electricity',o:[
  {v:'fossil',l:'Coal and gas plants',d:[3,2,0,0,0,10,4,-0.1],harm:0},
  {v:'mix',l:'Today’s Colorado mix',d:[3,2,0,0,0,5,2.5,0],harm:0},
  {v:'renew',l:'Wind and solar',d:[2,3,1,0,0,1,0.3,0.1],harm:0}]},
 {k:'homes',l:'Homes',o:[
  {v:'lots',l:'Houses on big lots',d:[6,1,-4,8,-3,2,3,0.2],harm:0},
  {v:'town',l:'Townhomes',d:[3,0,0,2,2,1,1.5,0.2],harm:0},
  {v:'mixed',l:'Apartments over shops',d:[4,3,4,-4,6,0,0.5,0.3],harm:0}]},
 {k:'jobs',l:'Work',o:[
  {v:'factory',l:'Factories and warehouses',d:[18,18,-2,4,0,8,3,-0.2],harm:0},
  {v:'office',l:'Offices and tech',d:[28,14,6,10,-2,1,1,0],harm:0},
  {v:'local',l:'Local shops and services',d:[8,10,1,-4,4,1,0.5,0.6],harm:0},
  {v:'parks',l:'Parks and recreation',d:[4,6,3,6,8,-3,0,0.3],harm:0}]}];
const PLANS=[
 {k:'A',n:'Wide Roads',b:['cars','fossil','lots','factory']},
 {k:'B',n:'Main Street',b:['bus','mix','mixed','local']},
 {k:'C',n:'Tech Park',b:['cars','mix','town','office']},
 {k:'D',n:'Green Belt',b:['rail','renew','mixed','parks']}];
const PRESETS=[
 {k:'gdp',l:'GDP only',w:[1,0,0,0,0,0,0,0]},
 {k:'growth',l:'Jobs and growth',w:[3,3,2,0,0,0,0,0]},
 {k:'health',l:'Public health',w:[0,0,0,1,3,3,0,0]},
 {k:'climate',l:'Climate',w:[0,0,0,0,0,0,1,0]},
 {k:'wellbeing',l:'Well-being',w:[1,2,2,3,1,1,1,3]},
 {k:'equal',l:'Every measure equal',w:[1,1,1,1,1,1,1,1]}];
const opt=(j,v)=>DEC[j].o.find(o=>o.v===v)||DEC[j].o[0];
function ind(b){return BASE.map((x,i)=>DEC.reduce((a,dc,j)=>a+opt(j,b[j]).d[i],x));}
/* "Spending on harms" inside GDP: car costs (fuel, repairs, crashes) plus health care tied to bad air, $k per person. */
function harm(b){const v=ind(b);return opt(0,b[0]).harm+0.2*v[5];}
const ALL=[];DEC[0].o.forEach(a=>DEC[1].o.forEach(p=>DEC[2].o.forEach(h=>DEC[3].o.forEach(j=>ALL.push([a.v,p.v,h.v,j.v])))));
const IND_ALL=ALL.map(ind);
const MIN=M.map((m,i)=>Math.min(...IND_ALL.map(r=>r[i]))),MAX=M.map((m,i)=>Math.max(...IND_ALL.map(r=>r[i])));
/* Points: the best possible neighborhood gets 100 on a measure, the worst possible gets 0. Lower-is-better measures are flipped. */
function pts(b){const v=ind(b);return v.map((x,i)=>{let p=100*(x-MIN[i])/(MAX[i]-MIN[i]);if(M[i].low)p=100-p;return Math.round(p*10)/10;});}
const wsum=w=>w.reduce((a,x)=>a+(+x||0),0);
/* Score = Σ w·p ÷ Σ w, using points rounded to 0.1 (the numbers students see). */
function score(b,w){const p=pts(b),W=wsum(w);if(W<=0)return 0;return p.reduce((a,x,i)=>a+(+w[i]||0)*x,0)/W;}
const r1=x=>Math.round(x*10)/10;
/* The best possible build for a scoreboard: the score is a sum of separate decisions, so pick the best option for each. */
function best(w){let top=null,ts=-1;ALL.forEach(b=>{const s=score(b,w);if(s>ts+1e-9){ts=s;top=b;}});return {b:top,s:ts};}
function rankAmong(s,list){return 1+list.filter(x=>x>s+1e-9).length;}
const bLabel=b=>DEC.map((d,j)=>opt(j,b[j]).l).join(' · ');
const planOf=b=>{const p=PLANS.find(p=>p.b.every((v,j)=>v===b[j]));return p||null;};
/* Result codes: "CITY-" + base64url(JSON). The h field is a checksum so the Class board can tell when a code was edited by hand. */
const SALT='rj-city-2026';
function hsh(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
function b64e(s){const u=new TextEncoder().encode(s);let bin='';u.forEach(c=>bin+=String.fromCharCode(c));return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function b64d(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new TextDecoder().decode(u);}
function encode(o){const body=JSON.stringify(o);return 'CITY-'+b64e(JSON.stringify({o,h:hsh(SALT+body)}));}
function decode(code){try{const x=JSON.parse(b64d(String(code).replace(/^CITY-/,'')));if(!x||!x.o)return null;x.o.ok=hsh(SALT+JSON.stringify(x.o))===x.h;return x.o;}catch(e){return null;}}
const findCodes=t=>(String(t).match(/CITY-[A-Za-z0-9_-]{20,}/g)||[]);
/* Teacher links: ?cw=w1,...,w8 sets the scoreboard; &calc=hand locks By hand mode; &a=TOKEN names the assignment. */
function parseQS(qs){const q=qs instanceof URLSearchParams?qs:new URLSearchParams(qs||'');const raw=(q.get('cw')||'').split(',').map(Number);
 const w=raw.length===8&&raw.every(x=>Number.isFinite(x)&&x>=0&&x<=5)?raw.map(x=>Math.round(x)):null;
 const calc=q.get('calc')==='hand'?'hand':q.get('calc')==='auto'?'auto':null;const a=(q.get('a')||'').replace(/[^A-Za-z0-9]/g,'').slice(0,12)||null;return {w,calc,a};}
const wKey=w=>w.map(x=>+x||0).join(',');
const presetOf=w=>PRESETS.find(p=>wKey(p.w)===wKey(w))||null;
window.CityModel={M,BASE,DEC,PLANS,PRESETS,ALL,MIN,MAX,ind,harm,pts,score,best,rankAmong,bLabel,planOf,opt,wsum,r1,encode,decode,findCodes,parseQS,wKey,presetOf};
})();
