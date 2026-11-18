/* Learn it graph kit (Nov 18, 2026). Shared drawing helpers for Learn it overlays that put a tool's result on the
   graph students are tested on (rule in ENGINE.md, "Writing Learn it steps"). Load after engine.js, before the learn files.
   Use inside an overlay(sim,ctx,LH,k,tau):  const K=BioLab.lg;  K.dim(ctx,LH); K.axes(ctx,B,k,{...}); K.curve(...); K.tag(...)
   B = {x0,x1,y0,y1} in canvas units (800 wide). Curves take values already scaled 0..1 on y. */
(function(){
'use strict';
const H=BioLab.h,PAL=H.PAL,clamp=H.clamp;
const ease=x=>x<=0?0:x>=1?1:x*x*(3-2*x),lerp=(a,b,f)=>a+(b-a)*f;
/* opaque cover for a graph step, so the model behind it doesn't show through */
function dim(ctx,LH,a){ctx.save();ctx.globalAlpha=a==null?1:a;ctx.fillStyle=PAL['cv-sol']||PAL['cv-bg'];ctx.fillRect(0,0,800,LH);ctx.restore();}
/* a label box centred on x,y; o:{s,w,c,bg,hi,alpha} */
function tag(ctx,s,x,y,k,o){o=o||{};const sz=(o.s||15)*k;ctx.font=(o.w||600)+' '+sz+'px '+H.FONT;const w=ctx.measureText(s).width+sz*1.1,h=sz*1.9;
  ctx.save();ctx.globalAlpha=o.alpha==null?1:o.alpha;H.rr(ctx,x-w/2,y-h/2,w,h,7);ctx.fillStyle=o.bg||PAL['cv-sol']||PAL['cv-bg'];ctx.fill();ctx.lineWidth=o.hi?2.5:1.2;ctx.strokeStyle=o.hi?'#c8102e':PAL['cv-soft'];ctx.stroke();
  H.txt(ctx,s,x,y+1,{s:sz,w:o.w||600,c:o.c||PAL['cv-ink'],a:'center',b:'middle'});ctx.restore();return {w,h};}
/* the same, anchored by its left ('l') or right ('r') edge, so it never runs off the canvas at phone size */
function tagA(ctx,s,x,y,k,o,side){o=o||{};const sz=(o.s||15)*k;ctx.save();ctx.font=(o.w||600)+' '+sz+'px '+H.FONT;const w=ctx.measureText(s).width+sz*1.1;ctx.restore();return tag(ctx,s,side==='r'?x-w/2:x+w/2,y,k,o);}
/* axes: o:{xr:[min,max], xt:[[v,label]], yt:[[0..1,label]], xl, yl, ylOff} */
function axes(ctx,B,k,o){const kk=Math.min(k,1.25);ctx.save();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(B.x0,B.y0-8);ctx.lineTo(B.x0,B.y1);ctx.lineTo(B.x1+8,B.y1);ctx.stroke();
  (o.xt||[]).forEach(([v,l])=>{const X=B.x0+(v-o.xr[0])/(o.xr[1]-o.xr[0])*(B.x1-B.x0);ctx.beginPath();ctx.moveTo(X,B.y1);ctx.lineTo(X,B.y1+5);ctx.stroke();H.txt(ctx,l,X,B.y1+16*kk,{s:12*kk,a:'center',b:'middle',c:PAL['cv-soft']});});
  (o.yt||[]).forEach(([v,l])=>{const Y=B.y1-v*(B.y1-B.y0);ctx.beginPath();ctx.moveTo(B.x0-5,Y);ctx.lineTo(B.x0,Y);ctx.stroke();H.txt(ctx,l,B.x0-9,Y,{s:12*kk,a:'right',b:'middle',c:PAL['cv-soft']});});
  if(o.xl)H.txt(ctx,o.xl,(B.x0+B.x1)/2,B.y1+36*kk,{s:13*kk,w:700,a:'center',b:'middle'});
  if(o.yl){ctx.translate(B.x0-(o.ylOff||46)*kk,(B.y0+B.y1)/2);ctx.rotate(-Math.PI/2);H.txt(ctx,o.yl,0,0,{s:13*kk,w:700,a:'center',b:'middle'});}ctx.restore();}
const X=(B,xr,v)=>B.x0+(v-xr[0])/(xr[1]-xr[0])*(B.x1-B.x0),Y=(B,r)=>B.y1-r*(B.y1-B.y0);
/* curve of fn(x) (0..1 on y) from xr[0] up to x = to; dash e.g. [8,6] */
function curve(ctx,B,xr,fn,to,col,dash,lw){ctx.save();ctx.strokeStyle=col;ctx.lineWidth=lw||3.5;ctx.lineJoin='round';if(dash)ctx.setLineDash(dash);ctx.beginPath();let first=true;
  for(let v=xr[0];v<=Math.min(to,xr[1])+1e-9;v+=(xr[1]-xr[0])/200){const x=X(B,xr,v),y=Y(B,clamp(fn(v),-0.05,1.05));first?ctx.moveTo(x,y):ctx.lineTo(x,y);first=false;}ctx.stroke();ctx.restore();}
function dot(ctx,x,y,col,r){ctx.save();ctx.beginPath();ctx.arc(x,y,r||7,0,6.29);ctx.fillStyle=col;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=PAL['cv-sol']||'#fff';ctx.stroke();ctx.restore();}
/* bars: list of [label, value 0..1, color]; grows with f 0..1 */
function bars(ctx,B,list,k,f){const kk=Math.min(k,1.25),n=list.length,gw=(B.x1-B.x0)/n;list.forEach(([l,v,c],i)=>{const h=(B.y1-B.y0)*clamp(v,0,1)*ease(f==null?1:f),x=B.x0+gw*i+gw*0.18,w=gw*0.64;ctx.fillStyle=c;H.rr(ctx,x,B.y1-h,w,h,4);ctx.fill();H.txt(ctx,l,x+w/2,B.y1+16*kk,{s:12.5*kk,a:'center',b:'middle'});});}
BioLab.lg={dim,tag,tagA,axes,curve,dot,bars,X,Y,ease,lerp,clamp};
})();
