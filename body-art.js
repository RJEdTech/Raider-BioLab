/* Shared schematic human figure for the anatomy and sports-medicine tools.
   BioLab.body.draw(ctx,{cx,top,h,view,fill,stroke,lw}) draws the figure in anatomical position (palms forward), height h, head top at y=top, centered on cx.
   view:'front'|'back' only changes the small face and spine marks; the outline is the same.
   BioLab.body.at(name,{cx,top,h}) returns {x,y} canvas coordinates for a landmark; side 'L' or 'R' suffix means the figure's own left or right,
   and on a front view the figure's left appears on the viewer's right. Pass view:'back' to flip.
   BioLab.body.map(nx,ny,{cx,top,h}) maps normalized coords (x from center, y 0 to 1, both in units of height) to canvas coords. BioLab.body.path(ctx,opts) traces the outline only.
   BioLab.body.LM lists landmark names. */
(function(){
'use strict';
const H=[[0,0],[.026,.003],[.046,.015],[.056,.04],[.055,.068],[.046,.092],[.033,.108],[.03,.128],[.036,.143],[.09,.158],[.124,.175],[.142,.205],[.147,.25],[.156,.3],[.166,.352],[.172,.385],[.184,.44],[.192,.478],[.206,.5],[.214,.54],[.203,.57],[.185,.572],[.172,.54],[.168,.5],[.163,.478],[.145,.42],[.131,.372],[.125,.34],[.116,.29],[.104,.235],[.1,.262],[.097,.32],[.09,.37],[.094,.41],[.108,.46],[.112,.51],[.106,.58],[.095,.66],[.086,.72],[.09,.76],[.092,.8],[.08,.87],[.068,.935],[.074,.96],[.098,.987],[.092,1],[.03,1],[.024,.975],[.03,.935],[.022,.86],[.016,.8],[.022,.75],[.026,.72],[.018,.65],[.008,.56],[0,.505]];
const LM={head:[0,.05],forehead:[0,.03],nose:[0,.06],mouth:[0,.08],chin:[0,.105],neck:[0,.13],sternum:[0,.205],heart:[.018,.21],navel:[0,.335],pelvis:[0,.43],spineC:[0,.135],spineT:[0,.24],spineL:[0,.35],sacrum:[0,.43],
  shoulder:[.125,.185],armpit:[.1,.235],upperarm:[.13,.27],elbow:[.148,.36],forearm:[.158,.42],wrist:[.178,.482],palm:[.19,.52],thumb:[.208,.53],finger:[.195,.565],
  hip:[.08,.46],thigh:[.06,.58],knee:[.056,.72],shin:[.056,.81],calf:[.056,.8],ankle:[.05,.935],foot:[.062,.98],toe:[.082,.995],collarbone:[.06,.165],chest:[.055,.215],kidney:[.04,.32]};
function g(o){return {cx:(o&&o.cx)||0,top:(o&&o.top)||0,h:(o&&o.h)||400};}
function map(nx,ny,o){const a=g(o);return {x:a.cx+nx*a.h,y:a.top+ny*a.h};}
function path(ctx,o){const a=g(o),P=H.map(p=>[a.cx+p[0]*a.h,a.top+p[1]*a.h]).concat(H.slice(1,-1).reverse().map(p=>[a.cx-p[0]*a.h,a.top+p[1]*a.h]));
  ctx.beginPath();const n=P.length,m=(i,j)=>[(P[i][0]+P[j][0])/2,(P[i][1]+P[j][1])/2],s=m(n-1,0);ctx.moveTo(s[0],s[1]);
  for(let i=0;i<n;i++){const e=m(i,(i+1)%n);ctx.quadraticCurveTo(P[i][0],P[i][1],e[0],e[1]);}ctx.closePath();}
function draw(ctx,o){const a=g(o);o=o||{};const PAL=BioLab.h.PAL;path(ctx,a);ctx.fillStyle=o.fill||PAL['card2'];ctx.fill();ctx.strokeStyle=o.stroke||PAL['cv-soft'];ctx.lineWidth=o.lw||1.4;ctx.stroke();
  if(o.marks===false)return;ctx.strokeStyle=o.stroke||PAL['cv-soft'];ctx.lineWidth=1;ctx.globalAlpha=.55;
  if(o.view==='back'){ctx.beginPath();ctx.moveTo(a.cx,a.top+.145*a.h);ctx.lineTo(a.cx,a.top+.44*a.h);ctx.stroke();}
  else{const q=(x,y)=>[a.cx+x*a.h,a.top+y*a.h];[[-.022],[.022]].forEach(x=>{const e=q(x[0],.052);ctx.beginPath();ctx.arc(e[0],e[1],Math.max(1,.0035*a.h),0,6.3);ctx.stroke();});const m=q(0,.083);ctx.beginPath();ctx.arc(m[0],m[1]-.006*a.h,.012*a.h,.5,2.64);ctx.stroke();}
  ctx.globalAlpha=1;}
function at(name,o){const a=g(o);let side=0,n=name;if(/[LR]$/.test(name)&&LM[name.slice(0,-1)]){side=name.slice(-1)==='L'?1:-1;n=name.slice(0,-1);}const p=LM[n];if(!p)return null;
  let x=p[0];if(side){x=Math.abs(x)*side;if(o&&o.view==='back')x=-x;}return {x:a.cx+x*a.h,y:a.top+p[1]*a.h};}
BioLab.body={draw,path,at,map,LM,OUTLINE:H};
})();
