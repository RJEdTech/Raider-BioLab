/* Raider BioLab: "Score the city" model (v2, Nov 10, 2026), shared by sims/cityscore.js and cityboard.html.
   A made-up neighborhood of 10,000 people on Colorado's Front Range. Four decisions add up to nine measures.
   The model city's numbers are illustrative, built so each trend points the way research points. The REAL tables
   (Front Range counties, world cities) are measured data with a source and year for every number. */
(function(){
'use strict';
const M=[
 {k:'gdp',l:'GDP per person',s:'GDP',low:false,f:v=>'$'+Math.round(v)+'k',u:'$k per person per year'},
 {k:'jobs',l:'Jobs per 100 residents',s:'Jobs',low:false,f:v=>String(Math.round(v)),u:'jobs per 100 residents'},
 {k:'rent',l:'Housing cost (share of income)',s:'Housing',low:true,f:v=>Math.round(v)+'%',u:'% of income'},
 {k:'commute',l:'Commute (minutes a day)',s:'Commute',low:true,f:v=>Math.round(v)+'m',u:'minutes a day, round trip'},
 {k:'active',l:'Active minutes a day',s:'Active',low:false,f:v=>Math.round(v)+'m',u:'minutes of walking or biking a day'},
 {k:'air',l:'Unhealthy-air days a year (average resident)',s:'Bad air',low:true,f:v=>String(Math.round(v)),u:'days a year'},
 {k:'co2',l:'CO₂ per person',s:'CO₂',low:true,f:v=>(Math.round(v*10)/10)+'t',u:'metric tons per person per year'},
 {k:'happy',l:'Life satisfaction (0 to 10)',s:'Happy',low:false,f:v=>(Math.round(v*10)/10).toFixed(1),u:'average survey answer, 0 to 10'},
 {k:'worst',l:'Unhealthy-air days on the worst-off block',s:'Worst block',low:true,f:v=>String(Math.round(v)),u:'days a year, on the block with the most'},
 {k:'paved',l:'Paved or roofed ground (share of land)',s:'Paved',low:true,f:v=>Math.round(v)+'%',u:'% of the land that rain cannot soak into'}];
const NM=M.length;
const BASE=[50,40,30,30,12,12,6,6.6,0,20];
/* Each option adds these amounts to the first eight measures. spread = how unevenly bad air falls across blocks.
   up = up-front public cost ($k per resident); yr = yearly upkeep ($k per resident per year). */
const DEC=[
 {k:'travel',l:'Getting around',o:[
  {v:'cars',l:'Cars and wide roads',d:[12,2,-2,20,-5,12,6,-0.3],harm:10,spread:0.35,up:20,yr:3.0,pv:18},
  {v:'bus',l:'Buses and bike lanes',d:[4,2,0,8,6,4,2,0],harm:2,spread:0.12,up:6,yr:1.5,pv:6},
  {v:'rail',l:'Light rail and walkable streets',d:[6,4,3,4,12,0,0.5,0.1],harm:1,spread:0.05,up:28,yr:1.2,pv:4}]},
 {k:'power',l:'Electricity',o:[
  {v:'fossil',l:'Coal and gas plants',d:[3,2,0,0,0,10,4,-0.1],harm:0,spread:0.25,up:2,yr:1.0,pv:2},
  {v:'mix',l:'Today’s Colorado mix',d:[3,2,0,0,0,5,2.5,0],harm:0,spread:0.12,up:3,yr:0.8,pv:1},
  {v:'renew',l:'Wind and solar',d:[2,3,1,0,0,1,0.3,0.1],harm:0,spread:0.02,up:6,yr:0.3,pv:1}]},
 {k:'homes',l:'Homes',o:[
  {v:'lots',l:'Houses on big lots',d:[6,1,-4,8,-3,2,3,0.2],harm:0,spread:0,up:14,yr:1.2,pv:10},
  {v:'town',l:'Townhomes',d:[3,0,0,2,2,1,1.5,0.2],harm:0,spread:0,up:9,yr:0.8,pv:5},
  {v:'mixed',l:'Apartments over shops',d:[4,3,4,-4,6,0,0.5,0.3],harm:0,spread:0,up:10,yr:0.6,pv:2}]},
 {k:'jobs',l:'Work',o:[
  {v:'factory',l:'Factories and warehouses',d:[18,18,-2,4,0,8,3,-0.2],harm:0,spread:0.3,up:0,yr:0,pv:14},
  {v:'office',l:'Offices and tech',d:[28,14,6,10,-2,1,1,0],harm:0,spread:0.02,up:0,yr:0,pv:10},
  {v:'local',l:'Local shops and services',d:[8,10,1,-4,4,1,0.5,0.6],harm:0,spread:0,up:0,yr:0,pv:4},
  {v:'parks',l:'Parks and recreation',d:[4,6,3,6,8,-3,0,0.3],harm:0,spread:-0.05,up:0,yr:0,pv:-12}]}];
/* Choices that work together (or against each other). The score is no longer a sum of separate decisions. */
const SYN=[
 {when:{travel:'rail',homes:'mixed'},d:[2,0,0,-4,3,0,-0.6,0],l:'Light rail works best with apartments over shops: more riders live near each stop.'},
 {when:{travel:'bus',homes:'mixed'},d:[0,0,0,-2,2,0,-0.3,0],l:'Buses run more often where more people live close together.'},
 {when:{travel:'cars',homes:'lots'},d:[0,0,0,4,-1,0,1,0],l:'Big lots spread homes out, so every car trip gets longer.'}];
const PLANS=[
 {k:'A',n:'Wide Roads',b:['cars','fossil','lots','factory']},
 {k:'B',n:'Main Street',b:['bus','mix','mixed','local']},
 {k:'C',n:'Tech Park',b:['cars','mix','town','office']},
 {k:'D',n:'Green Belt',b:['rail','renew','mixed','parks']}];
/* Weights for: GDP, Jobs, Housing, Commute, Active, Bad air, CO₂, Happy, Worst block, Paved (missing ones count as 0) */
const PRESETS=[
 {k:'gdp',l:'GDP only',w:[1,0,0,0,0,0,0,0,0]},
 {k:'growth',l:'Jobs and growth',w:[3,3,2,0,0,0,0,0,0]},
 {k:'health',l:'Public health',w:[0,0,0,1,3,3,0,0,0]},
 {k:'climate',l:'Climate',w:[0,0,0,0,0,0,1,0,0]},
 {k:'water',l:'Clean streams',w:[0,0,0,0,0,0,0,0,0,1]},
 {k:'wellbeing',l:'Well-being',w:[1,2,2,3,1,1,1,3,0]},
 {k:'fair',l:'Fair share',w:[0,1,3,0,0,1,0,0,4]},
 {k:'equal',l:'Every measure equal',w:[1,1,1,1,1,1,1,1,1,1]}];
/* Residents: each role cares about different things. The weights are a starting point for discussion, not facts about anyone. */
const ROLES=[
 {k:'parent',l:'Parent of young kids',w:[0,1,3,2,2,4,0,1,1],why:'Rent, clean air for small lungs, safe places to walk and play, and time at home.'},
 {k:'retiree',l:'Retiree on a fixed income',w:[0,0,4,0,2,3,0,3,0],why:'Housing that stays affordable, clean air, staying active and a good daily life.'},
 {k:'owner',l:'Small-business owner',w:[3,4,2,1,0,0,0,1,0],why:'Customers with money to spend, workers who can get there, and rent they can pay.'},
 {k:'wheel',l:'Wheelchair user',w:[0,1,2,3,1,2,0,2,0],why:'Getting places without a car, clean air and a good daily life. This model has no measure for curb ramps or elevators: notice what it cannot see.'},
 {k:'commuter',l:'Commuter to a downtown job',w:[2,1,2,5,0,0,0,1,0],why:'A short commute above all, plus pay and rent.'},
 {k:'teen',l:'High school student (you)',w:[0,2,0,2,2,1,2,3,0],why:'A first job, getting around without a ride, staying active, the future climate and liking where you live.'},
 {k:'highway',l:'Family next to the highway',w:[0,1,3,0,0,2,0,1,5],why:'They live on the block that gets the most traffic and smoke. Cheap rent is why they are there.'}];
const opt=(j,v)=>DEC[j].o.find(o=>o.v===v)||DEC[j].o[0];
const bObj=b=>({travel:b[0],power:b[1],homes:b[2],jobs:b[3]});
const synOf=b=>{const o=bObj(b);return SYN.filter(s=>Object.keys(s.when).every(k=>o[k]===s.when[k]));};
function spread(b){return Math.max(0,0.1+DEC.reduce((a,dc,j)=>a+opt(j,b[j]).spread,0));}
/* Five blocks share the neighborhood's bad air unevenly. Weights add to 5, so the average stays the same. */
const BLK=[1,1/3,-1/6,-1/2,-2/3];
function blocks(b,air){const S=spread(b);return BLK.map(x=>Math.max(0,air*(1+S*x)));}
function ind(b){const v=BASE.slice(0,8).map((x,i)=>DEC.reduce((a,dc,j)=>a+opt(j,b[j]).d[i],x));synOf(b).forEach(s=>s.d.forEach((x,i)=>v[i]+=x));v.push(Math.max(...blocks(b,v[5])));v.push(DEC.reduce((a,dc,j)=>a+opt(j,b[j]).pv,BASE[9]));return v;}
/* "Spending on harms" inside GDP: car costs (fuel, repairs, crashes) plus health care tied to bad air, $k per person. */
function harm(b){const v=ind(b);return opt(0,b[0]).harm+0.2*v[5];}
/* Pay now or pay later: up-front cost, then yearly upkeep plus spending on harms. */
function costs(b){const up=DEC.reduce((a,dc,j)=>a+opt(j,b[j]).up,0),yr=DEC.reduce((a,dc,j)=>a+opt(j,b[j]).yr,0)+harm(b);return {up,yr,t25:up+25*yr};}
const ALL=[];DEC[0].o.forEach(a=>DEC[1].o.forEach(p=>DEC[2].o.forEach(h=>DEC[3].o.forEach(j=>ALL.push([a.v,p.v,h.v,j.v])))));
const IND_ALL=ALL.map(ind);
const MIN=M.map((m,i)=>Math.min(...IND_ALL.map(r=>r[i]))),MAX=M.map((m,i)=>Math.max(...IND_ALL.map(r=>r[i])));
/* Points: the best possible neighborhood gets 100 on a measure, the worst possible gets 0. Lower-is-better measures are flipped. */
function ptsOf(v){return v.map((x,i)=>{let p=100*(x-MIN[i])/(MAX[i]-MIN[i]);if(M[i].low)p=100-p;return Math.round(p*10)/10;});}
const pts=b=>ptsOf(ind(b));
const fixW=w=>{const a=(w||[]).map(x=>Math.max(0,Math.round(+x||0)));while(a.length<NM)a.push(0);return a.slice(0,NM);};
const wsum=w=>fixW(w).reduce((a,x)=>a+x,0);
/* Score = Σ w·p ÷ Σ w, using points rounded to 0.1 (the numbers students see). */
function score(b,w){w=fixW(w);const p=pts(b),W=wsum(w);if(W<=0)return 0;return p.reduce((a,x,i)=>a+w[i]*x,0)/W;}
const r1=x=>Math.round(x*10)/10;
function best(w){let top=null,ts=-1;ALL.forEach(b=>{const s=score(b,w);if(s>ts+1e-9){ts=s;top=b;}});return {b:top,s:ts};}
function rankAmong(s,list){return 1+list.filter(x=>x>s+1e-9).length;}
/* A build is "beaten on every measure" if another build is at least as good on all nine and better on at least one. */
function beatenBy(b){const v=ind(b),better=(x,y,i)=>M[i].low?x<y-1e-9:x>y+1e-9,asGood=(x,y,i)=>M[i].low?x<=y+1e-9:x>=y-1e-9;
 const out=ALL.filter((c,ci)=>{const u=IND_ALL[ci];return u.every((x,i)=>asGood(x,v[i],i))&&u.some((x,i)=>better(x,v[i],i));});
 out.sort((a,c)=>{const ga=ind(a).reduce((s,x,i)=>s+(M[i].low?v[i]-x:x-v[i])/(MAX[i]-MIN[i]),0),gc=ind(c).reduce((s,x,i)=>s+(M[i].low?v[i]-x:x-v[i])/(MAX[i]-MIN[i]),0);return gc-ga;});return out;}
/* The smallest change to one whole-number weight (0 to 5) that changes which plan is #1. */
function breakPoint(w){w=fixW(w);if(!wsum(w))return null;const top=w2=>{const s=PLANS.map(p=>score(p.b,w2));const m=Math.max(...s);return s.filter(x=>Math.abs(x-m)<1e-9).length>1?-1:s.indexOf(m);};
 const t0=top(w);let bestC=null;for(let i=0;i<NM;i++)for(let x=0;x<=5;x++){if(x===w[i])continue;const w2=w.slice();w2[i]=x;if(!wsum(w2))continue;const t=top(w2);if(t!==t0&&t>=0){const c={i,from:w[i],to:x,d:Math.abs(x-w[i]),plan:t};if(!bestC||c.d<bestC.d)bestC=c;}}return bestC;}
/* EPA / Smart Growth Network: 10 smart growth principles. ok(b,v) = true, false, or null when this model cannot tell. */
const SMART=[
 {l:'Mix land uses',ok:(b,v)=>b[2]==='mixed'||b[3]==='local'},
 {l:'Take advantage of compact building design',ok:(b,v)=>b[2]!=='lots'},
 {l:'Create a range of housing opportunities and choices',ok:()=>null},
 {l:'Create walkable neighborhoods',ok:(b,v)=>v[4]>=25},
 {l:'Foster distinctive, attractive communities with a strong sense of place',ok:()=>null},
 {l:'Preserve open space, farmland, natural beauty and critical environmental areas',ok:(b,v)=>b[3]==='parks'||v[9]<=30},
 {l:'Strengthen and direct development toward existing communities',ok:()=>null},
 {l:'Provide a variety of transportation choices',ok:(b,v)=>b[0]!=='cars'},
 {l:'Make development decisions predictable, fair and cost effective',ok:()=>null},
 {l:'Encourage community and stakeholder collaboration in development decisions',ok:()=>null}];
const smartCheck=b=>{const v=ind(b);return SMART.map(x=>({l:x.l,ok:x.ok(b,v)}));};
const bLabel=b=>DEC.map((d,j)=>opt(j,b[j]).l).join(' · ');
const planOf=b=>PLANS.find(p=>p.b.every((v,j)=>v===b[j]))||null;

/* ---------- REAL DATA ---------- */
/* Front Range counties. ACS = U.S. Census Bureau, American Community Survey 5-year estimates 2020-2024, via QuickFacts (census.gov/quickfacts);
   density = 2020 Census; ozone and PM2.5 = American Lung Association, "State of the Air" 2026 (data 2022-2024), from EPA monitors. null = not measured. */
const COUNTIES=[
 {n:'Denver',commute:24.9,income:94718,rent:1831,density:4674.3,ozone:39,pm:7.9},
 {n:'Arapahoe (Aurora)',commute:27.1,income:101087,rent:1891,density:821.0,ozone:36,pm:5.3},
 {n:'Adams',commute:29.8,income:94571,rent:1781,density:445.3,ozone:38,pm:7.4},
 {n:'Jefferson',commute:26.0,income:110656,rent:1861,density:762.6,ozone:85,pm:null},
 {n:'Douglas',commute:27.1,income:149594,rent:2193,density:426.0,ozone:55,pm:4.6},
 {n:'Boulder',commute:22.3,income:103994,rent:1966,density:455.3,ozone:21,pm:6.5},
 {n:'Broomfield',commute:25.5,income:123874,rent:2126,density:2248.0,ozone:null,pm:null},
 {n:'El Paso (Colorado Springs)',commute:23.5,income:90363,rent:1696,density:343.5,ozone:15,pm:5.2},
 {n:'Larimer (Fort Collins)',commute:23.4,income:93765,rent:1716,density:138.3,ozone:36,pm:6.4},
 {n:'Weld (Greeley)',commute:27.9,income:97097,rent:1539,density:82.6,ozone:33,pm:7.4}];
COUNTIES.forEach(c=>c.rentShare=Math.round(1000*c.rent*12/c.income)/10);
/* Real measures, and which scoreboard weight each one borrows. */
const RM=[
 {k:'income',l:'Median household income',s:'Income',w:0,low:false,f:v=>'$'+Math.round(v/1000)+'k',src:'ACS 2020-2024'},
 {k:'rentShare',l:'Median rent × 12 ÷ median household income',s:'Rent share',w:2,low:true,f:v=>v.toFixed(1)+'%',src:'ACS 2020-2024 (calculated)'},
 {k:'commute',l:'Mean travel time to work, one way',s:'Commute',w:3,low:true,f:v=>v.toFixed(1)+' min',src:'ACS 2020-2024'},
 {k:'ozone',l:'High-ozone days in 3 years (orange + red)',s:'Ozone days',w:5,low:true,f:v=>String(v),src:'State of the Air 2026'},
 {k:'pm',l:'Year-round fine particles (PM2.5)',s:'PM2.5',w:5,low:true,f:v=>v.toFixed(1)+' µg/m³',src:'State of the Air 2026'},
 {k:'density',l:'People per square mile',s:'Density',w:-1,low:false,f:v=>Math.round(v).toLocaleString('en-US'),src:'2020 Census'}];
function countyScores(w){w=fixW(w);const use=RM.filter(m=>m.w>=0&&w[m.w]>0);if(!use.length)return null;
 const P=COUNTIES.map(()=>({s:0,W:0,missing:[]}));use.forEach(m=>{const vals=COUNTIES.map(c=>c[m.k]).filter(v=>v!=null),mn=Math.min(...vals),mx=Math.max(...vals);
  COUNTIES.forEach((c,i)=>{const v=c[m.k];if(v==null){P[i].missing.push(m.s);return;}let p=mx>mn?100*(v-mn)/(mx-mn):50;if(m.low)p=100-p;P[i].s+=w[m.w]*p;P[i].W+=w[m.w];});});
 return {use,rows:COUNTIES.map((c,i)=>({n:c.n,s:P[i].W?P[i].s/P[i].W:null,missing:P[i].missing}))};}
/* World cities: life evaluation = World Happiness Report 2020, Chapter 3, "Cities and Happiness" (De Neve and Krekel),
   Figure 3.1: average Cantril ladder answer, Gallup World Poll and Gallup US polls, 2014-2018. US cities in that ranking are only the ten largest. */
const CITIES=[
 {n:'Helsinki',c:'Finland',life:7.828,rank:1,design:'Trams, metro and bike lanes; the happiest city in the ranking'},
 {n:'Copenhagen',c:'Denmark',life:7.530,rank:5,design:'Biking city: 49% of trips to work or school in the city were by bike in 2018 (City of Copenhagen, Bicycle Account 2018)'},
 {n:'Washington, D.C.',c:'USA',life:7.185,rank:18,design:'Metro rail at the center, car suburbs around it'},
 {n:'Houston',c:'USA',life:7.110,rank:21,design:'Freeway-centered and spread out; the city has no zoning code'},
 {n:'Vienna',c:'Austria',life:6.998,rank:29,design:'Dense, with subways, trams and a large share of city-owned housing'},
 {n:'New York',c:'USA',life:6.964,rank:30,design:'Subway city: the most transit riders in the U.S.'},
 {n:'Los Angeles',c:'USA',life:6.956,rank:31,design:'Car-centered, with a growing rail network'},
 {n:'London',c:'UK',life:6.782,rank:36,design:'The Underground plus a congestion charge for driving downtown'},
 {n:'Mexico City',c:'Mexico',life:6.693,rank:38,design:'Huge metro and bus-rapid-transit system, heavy traffic'},
 {n:'Paris',c:'France',life:6.635,rank:43,design:'Dense, metro everywhere, new bike lanes replacing car lanes'},
 {n:'Bogotá',c:'Colombia',life:6.612,rank:45,design:'TransMilenio bus rapid transit and car-free Sunday streets (Ciclovía)'},
 {n:'Singapore',c:'Singapore',life:6.494,rank:49,design:'Planned transit city; owning a car requires a costly permit'},
 {n:'Tokyo',c:'Japan',life:5.989,rank:79,design:'Rail city with one of the busiest train networks in the world'},
 {n:'Seoul',c:'South Korea',life:5.947,rank:83,design:'Subway city that tore down a downtown highway to restore a stream (Cheonggyecheon)'}];
/* Sources for every real number and every claim in About. */
const SOURCES=[
 {k:'acs',t:'U.S. Census Bureau, QuickFacts (American Community Survey 5-year estimates, 2020-2024; 2020 Census for density)',u:'https://www.census.gov/quickfacts/'},
 {k:'sota',t:'American Lung Association, “State of the Air” 2026: Colorado county grades (ozone and particle pollution, 2022-2024 data from EPA monitors)',u:'https://www.lung.org/research/sota/city-rankings/states/colorado'},
 {k:'whr',t:'World Happiness Report 2020, Chapter 3: “Cities and Happiness: A Global Ranking and Analysis” (De Neve and Krekel), Figure 3.1',u:'https://worldhappiness.report/ed/2020/cities-and-happiness-a-global-ranking-and-analysis/'},
 {k:'cph',t:'City of Copenhagen, Copenhagen City of Cyclists: Bicycle Account 2018',u:'https://kk.sites.itera.dk/apps/kk_pub2/pdf/1962_fe6a68275526.pdf'},
 {k:'gallup',t:'Gallup, “Naples, Florida, Metro Tops in Well-Being for Third Time” (Gallup-Sharecare Well-Being Index, 2016-2017; Boulder ranked third)',u:'https://news.gallup.com/poll/228314/naples-florida-metro-tops-third-time.aspx'},
 {k:'bea',t:'U.S. Bureau of Economic Analysis, “GDP and Beyond,” Survey of Current Business, June 2020 (Kuznets, 1934)',u:'https://apps.bea.gov/scb/issues/2020/06-june/0620-beyond-gdp-berndt.htm'},
 {k:'epa',t:'U.S. EPA, Denver Metro/North Front Range ozone planning (Severe nonattainment, 2008 ozone standard, effective 2022)',u:'https://www.epa.gov/system/files/documents/2025-02/2025.ard_.colorado-ozone-planning.pdf'},
 {k:'sg',t:'U.S. EPA, About Smart Growth: the 10 smart growth principles (Smart Growth Network)',u:'https://www.epa.gov/smart-growth/about-smart-growth'},
 {k:'icm',t:'Center for Watershed Protection, Impervious Cover Model (streams sensitive below ~10% impervious cover, degraded above ~25%); EPA Recovery Potential metrics: watershed percent impervious cover',u:'https://www.epa.gov/sites/production/files/2015-11/documents/rp2wshedimperv1109.pdf'},
 {k:'myt',t:'Future Humber, Mytopia (green city builder game by Future Humber, Clay10 Creative and Edenic Group)',u:'https://futurehumber.com/about-us/our-projects/mytopia'}];

/* Result codes: "CITY-" + base64url(JSON). The h field is a checksum so the Class board can tell when a code was edited by hand. */
const SALT='rj-city-2026';
function hsh(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
function b64e(s){const u=new TextEncoder().encode(s);let bin='';u.forEach(c=>bin+=String.fromCharCode(c));return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function b64d(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new TextDecoder().decode(u);}
function encode(o){const body=JSON.stringify(o);return 'CITY-'+b64e(JSON.stringify({o,h:hsh(SALT+body)}));}
function decode(code){try{const x=JSON.parse(b64d(String(code).replace(/^CITY-/,'')));if(!x||!x.o)return null;x.o.ok=hsh(SALT+JSON.stringify(x.o))===x.h;if(Array.isArray(x.o.w))x.o.w=fixW(x.o.w);return x.o;}catch(e){return null;}}
const findCodes=t=>(String(t).match(/CITY-[A-Za-z0-9_-]{20,}/g)||[]);
/* Teacher links: ?cw=w1,...,w9 sets the scoreboard (8 numbers still work); &calc=hand locks By hand mode; &a=TOKEN names the assignment;
   &level=bio|honors|ap&dl=1 sets and locks the depth; &role=key assigns a resident role. */
function parseQS(qs){const q=qs instanceof URLSearchParams?qs:new URLSearchParams(qs||'');const raw=(q.get('cw')||'').split(',').map(Number);
 const w=(raw.length>=8&&raw.length<=NM)&&raw.every(x=>Number.isFinite(x)&&x>=0&&x<=5)?fixW(raw):null;
 const calc=q.get('calc')==='hand'?'hand':q.get('calc')==='auto'?'auto':null;const a=(q.get('a')||'').replace(/[^A-Za-z0-9]/g,'').slice(0,12)||null;
 const lv=['bio','honors','ap'].includes(q.get('level'))?q.get('level'):null,dl=q.get('dl')==='1';const role=ROLES.find(r=>r.k===q.get('role'))?q.get('role'):null;
 return {w,calc,a,lv,dl,role};}
const wKey=w=>fixW(w).join(',');
const presetOf=w=>PRESETS.find(p=>wKey(p.w)===wKey(w))||null;
const roleOf=w=>ROLES.find(r=>wKey(r.w)===wKey(w))||null;
window.CityModel={SMART,smartCheck,M,NM,BASE,DEC,SYN,PLANS,PRESETS,ROLES,ALL,MIN,MAX,ind,harm,costs,blocks,spread,synOf,pts,ptsOf,score,best,rankAmong,beatenBy,breakPoint,bLabel,planOf,opt,wsum,fixW,r1,
 COUNTIES,RM,countyScores,CITIES,SOURCES,encode,decode,findCodes,parseQS,wKey,presetOf,roleOf};
})();
