/* View3D: a small 3D molecule renderer for the story pages (Nov 24, 2026). No libraries and no WebGL: it draws shaded atoms,
   bonds and ring faces on the page's own 2D canvas, sorted back to front, with perspective. So it works on every school laptop,
   and the story's labels, Read aloud and Copy for Canvas keep working as before.
   Use:  const V=View3D.make({yaw:.6,pitch:-.25,auto:.25});
         V.render(ctx,{x,y,w,h,nm:90,items:[...],center:[0,0,0]});   // nm = screen units per nanometer, so sizes stay real; center = the point the camera turns around
   Items (positions in nanometers, centered on 0,0,0; op = opacity on any item):
     {t:'atom',p:[x,y,z],r:.07,c:'#888'}             a shaded ball
     {t:'bond',a:[..],b:[..],r:.02,c:'#999'}          a rod between two points
     {t:'face',pts:[[..],..],c:'#3b6fd8',op:.35}       a flat ring face (fills a sugar ring so it reads as one unit)
     {t:'tag',p:[..],text:'maltose',c:'#333'}         a label that follows a point
   Students drag the picture (or use the arrow keys while it has focus) to turn it. It turns slowly on its own until touched. */
(function(){
'use strict';
const views=[];let dragV=null,lastX=0,lastY=0;
const rgb=h=>{const n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255];};
const mix=(c,t,k)=>c.map((v,i)=>Math.round(v+(t[i]-v)*k));
const css=(c,a)=>a==null||a>=1?`rgb(${c[0]},${c[1]},${c[2]})`:`rgba(${c[0]},${c[1]},${c[2]},${a})`;
function make(o){o=o||{};const V={yaw:o.yaw||0,pitch:o.pitch||0,auto:o.auto==null?.25:o.auto,touched:false,box:null,a:1,cv:null,focal:o.focal||9,bg:o.bg||'#f4f6f8',hint:o.hint!==false,
  render(ctx,f){return render(V,ctx,f);},reset(){V.yaw=o.yaw||0;V.pitch=o.pitch||0;V.touched=false;}};views.push(V);return V;}
function rot(V,p){const cy=Math.cos(V.yaw),sy=Math.sin(V.yaw),cp=Math.cos(V.pitch),sp=Math.sin(V.pitch);
  const x=p[0]*cy+p[2]*sy,z=-p[0]*sy+p[2]*cy;return [x,p[1]*cp-z*sp,p[1]*sp+z*cp];}
function render(V,ctx,f){
  const now=performance.now();if(V._t&&!V.touched&&!dragV)V.yaw+=V.auto*Math.min(.05,(now-V._t)/1000);V._t=now;
  const tr=ctx.getTransform();V.a=tr.a||1;V.cv=ctx.canvas;V.box=[f.x,f.y,f.w,f.h];V.seen=now;
  const cx=f.x+f.w/2,cy=f.y+f.h/2,S=f.nm,F=V.focal,bg=rgb(f.bg||V.bg);
  const O=f.center||[0,0,0],P=p=>{const q=rot(V,[p[0]-O[0],p[1]-O[1],p[2]-O[2]]),k=F/(F+q[2]);return {x:cx+q[0]*S*k,y:cy-q[1]*S*k,z:q[2],k};};
  const L=[];
  for(const it of f.items){
    if(it.t==='atom'){const q=P(it.p);L.push({z:q.z,d(){atom(ctx,q,it.r*S*q.k,it.c,it.op,fog(q.z));}});}
    else if(it.t==='bond'){const a=P(it.a),b=P(it.b);L.push({z:(a.z+b.z)/2+.001,d(){bond(ctx,a,b,it.r*S*(a.k+b.k)/2,it.c,it.op,fog((a.z+b.z)/2));}});}
    else if(it.t==='face'){const qs=it.pts.map(P);const z=qs.reduce((s,q)=>s+q.z,0)/qs.length;L.push({z:z+.002,d(){face(ctx,qs,it.c,it.op,fog(z));}});}
    else if(it.t==='tag'){const q=P(it.p);L.push({z:-1e9,d(){tag(ctx,q,it);}});}}
  L.sort((m,n)=>n.z-m.z);
  ctx.save();ctx.beginPath();ctx.rect(f.x,f.y,f.w,f.h);ctx.clip();L.forEach(m=>m.d());ctx.restore();
  if(V.hint&&!V.touched){ctx.save();ctx.font='600 15px "Segoe UI",system-ui,sans-serif';ctx.fillStyle='rgba(28,28,31,.72)';ctx.textAlign='right';
    ctx.fillText('↻ Drag to turn it',f.x+f.w-12,f.y+f.h-12);ctx.restore();}
  function fog(z){return Math.max(0,Math.min(.55,(z+.4)*.32));}
  function atom(ctx,q,r,c,a,fz){if(r<.4)return;const col=mix(rgb(c),bg,fz),hi=mix(col,[255,255,255],.6),lo=mix(col,[0,0,0],.45);
    const g=ctx.createRadialGradient(q.x-r*.35,q.y-r*.4,r*.1,q.x,q.y,r);g.addColorStop(0,css(hi,a));g.addColorStop(.55,css(col,a));g.addColorStop(1,css(lo,a));
    ctx.beginPath();ctx.arc(q.x,q.y,r,0,7);ctx.fillStyle=g;ctx.fill();}
  function bond(ctx,a,b,r,c,al,fz){const col=mix(rgb(c),bg,fz);ctx.lineCap='round';
    ctx.strokeStyle=css(mix(col,[0,0,0],.22),al);ctx.lineWidth=Math.max(1,r*2+.8);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.strokeStyle=css(col,al);ctx.lineWidth=Math.max(.8,r*2-.6);ctx.stroke();
    ctx.strokeStyle=css(mix(col,[255,255,255],.45),al==null?.7:al*.7);ctx.lineWidth=Math.max(.4,r*.6);ctx.stroke();}
  function face(ctx,qs,c,a,fz){const col=mix(rgb(c),bg,fz);ctx.beginPath();qs.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fillStyle=css(col,a==null?.35:a);ctx.fill();}
  function tag(ctx,q,it){ctx.save();ctx.font=`${it.w||600} ${it.s||15}px "Segoe UI",system-ui,sans-serif`;const t=it.text,w=ctx.measureText(t).width+14,x=q.x+(it.dx||0),y=q.y+(it.dy||0);
    ctx.fillStyle='rgba(255,255,255,.92)';ctx.strokeStyle=it.c||'#333';ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect?ctx.roundRect(x-w/2,y-13,w,26,7):ctx.rect(x-w/2,y-13,w,26);ctx.fill();ctx.stroke();
    ctx.fillStyle=it.c||'#333';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(t,x,y+.5);ctx.restore();}
  return P;}
/* pointer: drag inside a view's box turns that view */
function hit(e){const now=performance.now();for(const V of views){if(!V.box||!V.cv||now-V.seen>300||e.target!==V.cv)continue;const r=V.cv.getBoundingClientRect(),W=V.cv.width/V.a,
  x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*(V.cv.height/V.a),[bx,by,bw,bh]=V.box;if(x>=bx&&x<=bx+bw&&y>=by&&y<=by+bh)return V;}return null;}
document.addEventListener('pointerdown',e=>{const V=hit(e);if(!V)return;dragV=V;V.touched=true;lastX=e.clientX;lastY=e.clientY;try{e.target.setPointerCapture(e.pointerId);}catch(x){}});
document.addEventListener('pointermove',e=>{const V=dragV;if(!V)return;V.yaw+=(e.clientX-lastX)*.011;V.pitch=Math.max(-1.45,Math.min(1.45,V.pitch+(e.clientY-lastY)*.009));lastX=e.clientX;lastY=e.clientY;});
const up=()=>{dragV=null;};document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);
document.addEventListener('keydown',e=>{const now=performance.now(),V=views.find(v=>v.cv&&now-v.seen<300&&document.activeElement===v.cv);if(!V)return;
  const k={ArrowLeft:[-.15,0],ArrowRight:[.15,0],ArrowUp:[0,-.12],ArrowDown:[0,.12]}[e.key];if(!k)return;e.preventDefault();V.touched=true;V.yaw+=k[0];V.pitch=Math.max(-1.45,Math.min(1.45,V.pitch+k[1]));});
/* geometry helpers shared by the scenes */
const G={
  add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul:(a,k)=>[a[0]*k,a[1]*k,a[2]*k],
  len:a=>Math.hypot(a[0],a[1],a[2]),norm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];},
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  /* a six-member sugar ring (5 C + 1 O, bonds 0.145 nm) centered at c, lying in the plane of unit vectors u and v; returns its 6 corners */
  ring:(c,u,v,r)=>{r=r||.145;const o=[];for(let k=0;k<6;k++){const a=k*Math.PI/3;o.push([c[0]+r*(Math.cos(a)*u[0]+Math.sin(a)*v[0]),c[1]+r*(Math.cos(a)*u[1]+Math.sin(a)*v[1]),c[2]+r*(Math.cos(a)*u[2]+Math.sin(a)*v[2])]);}return o;},
  /* CPK-style colors, softened to match the story palette */
  C:{C:'#5f6670',O:'#d9362b',H:'#f2f2f2',N:'#3b62d6',Na:'#8e5ad6',Cl:'#2fae4f'},
  /* real radii in nm: covalent-ish ball sizes for ball-and-stick, van der Waals for space filling */
  R:{C:.07,O:.066,H:.04},VDW:{C:.17,O:.152,H:.11},ION:{Na:.102,Cl:.181}};
window.View3D={make,G};
})();
