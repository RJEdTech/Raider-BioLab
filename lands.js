/* Land for sale: the lands after Colorado. Each one keeps Paul Stearman's rules and numbers and changes
   the place, the species, the resource, the art and one or two extras. Load after mountain-model.js.
   Species statuses, numbers and dates in the case cards were checked against the sources listed with them (Nov 19, 2026). */
(function(){
'use strict';
const M=window.MTN;if(!M)return;
const W=800,H=450;
/* ---------- helpers ---------- */
function cum(surf){const c=[0];for(let i=1;i<surf.length;i++)c.push(c[i-1]+Math.hypot(surf[i][0]-surf[i-1][0],surf[i][1]-surf[i-1][1]));return c;}
function yAt(surf,x){for(let i=1;i<surf.length;i++)if(x<=surf[i][0]){const f=(x-surf[i-1][0])/((surf[i][0]-surf[i-1][0])||1);return surf[i-1][1]+(surf[i][1]-surf[i-1][1])*f;}return surf[surf.length-1][1];}
function sAtX(surf,x){const c=cum(surf);for(let i=1;i<surf.length;i++)if(x<=surf[i][0]){const f=(x-surf[i-1][0])/((surf[i][0]-surf[i-1][0])||1);return c[i-1]+(c[i]-c[i-1])*f;}return c[c.length-1];}
const xs=(a,b,n)=>Array.from({length:n},(_,k)=>a+(b-a)*k/(n-1));
const zone=(surf,name,x0,x1,n)=>({zone:name,s:xs(x0,x1,n).map(x=>sAtX(surf,x))});
const shallow=(surf,xa,xb,d)=>({a:[xa,Math.round(yAt(surf,xa)+d)],b:[xb,Math.round(yAt(surf,xb)+d)]});
const deepV=(xa,ya,xb,yb)=>({a:[xa,ya],b:[xb,yb]});
const deepB=(surf,xa,xb,d)=>({a:[xa,Math.round(yAt(surf,xa)+d)],b:[xb,Math.round(yAt(surf,xb)+d)]});
const offset=(surf,d)=>surf.map(([x,y])=>[x,y+d]);
function poly(ctx,P,fill){ctx.fillStyle=fill;ctx.beginPath();P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();}
function road(ctx,x,y,label,C){ctx.save();ctx.fillStyle='#55575c';ctx.beginPath();ctx.moveTo(x-9,y+6);ctx.lineTo(x+9,y+6);ctx.lineTo(x+14,H);ctx.lineTo(x-14,H);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#f2d24b';ctx.setLineDash([6,6]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y+8);ctx.lineTo(x,H);ctx.stroke();ctx.restore();
  ctx.save();ctx.fillStyle='#4b4d52';ctx.fillRect(x-10,y-4,20,10);ctx.restore();}
/* ---------- generic animals and plants ---------- */
function quad(ctx,x,y,s,flip,o){ctx.save();ctx.translate(x,y);ctx.scale(flip?-s:s,s);
  const bw=o.bw||9,bh=o.bh||5,leg=o.leg||10,by=-(leg+bh*0.55),c=o.c,dk=o.dk||'#3b2f25';
  ctx.strokeStyle=o.legc||dk;ctx.lineWidth=o.lw||1.6;[-bw*0.62,-bw*0.32,bw*0.32,bw*0.62].forEach(lx=>{ctx.beginPath();ctx.moveTo(lx,by+bh*0.4);ctx.lineTo(lx+(lx<0?-0.4:0.4),0);ctx.stroke();});
  ctx.fillStyle=c;ctx.strokeStyle=dk;ctx.lineWidth=0.8;ctx.beginPath();ctx.ellipse(0,by,bw,bh,0,0,6.29);ctx.fill();ctx.stroke();
  if(o.belly){ctx.fillStyle=o.belly;ctx.beginPath();ctx.ellipse(0,by+bh*0.45,bw*0.8,bh*0.45,0,0,3.15);ctx.fill();}
  if(o.band){ctx.fillStyle=o.band;ctx.fillRect(-bw*0.85,by+bh*0.05,bw*1.7,1.4);}
  if(o.rump){ctx.fillStyle=o.rump;ctx.beginPath();ctx.ellipse(-bw*0.9,by,bh*0.5,bh*0.75,0,0,6.29);ctx.fill();}
  ctx.fillStyle=o.tailc||dk;ctx.beginPath();ctx.ellipse(-bw-1.2,by-0.5,1.1,o.tail||2,0.3,0,6.29);ctx.fill();
  const hx=bw+(o.nx==null?4:o.nx),hy=by-(o.ny==null?9:o.ny),hr=o.hr||2.8;
  if(!o.noNeck){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(bw*0.45,by-bh*0.5);ctx.lineTo(hx-hr*0.6,hy-1);ctx.lineTo(hx+hr*0.2,hy+hr*0.8);ctx.lineTo(bw*0.9,by+bh*0.3);ctx.closePath();ctx.fill();}
  if(o.mane){ctx.fillStyle=o.mane;ctx.beginPath();ctx.moveTo(bw*0.6,by);ctx.lineTo(hx-1,hy+hr);ctx.lineTo(hx-3,hy+hr*2.2);ctx.lineTo(bw*0.4,by+bh*0.6);ctx.closePath();ctx.fill();}
  ctx.fillStyle=o.headc||c;ctx.beginPath();ctx.ellipse(hx+hr*0.4,hy,hr*1.35,hr*0.85,o.headTilt||0.35,0,6.29);ctx.fill();
  if(o.face){ctx.fillStyle=o.face;ctx.beginPath();ctx.ellipse(hx+hr*1.2,hy+0.3,hr*0.5,hr*0.45,0,0,6.29);ctx.fill();}
  ctx.fillStyle='#1b1714';ctx.beginPath();ctx.arc(hx+hr*0.3,hy-hr*0.25,0.6,0,6.29);ctx.fill();
  ctx.fillStyle=o.earc||c;ctx.beginPath();ctx.ellipse(hx-hr*0.5,hy-hr*0.9,0.9,o.ear||1.8,-0.6,0,6.29);ctx.fill();
  const hc=o.hornc||'#2a2420';ctx.strokeStyle=hc;ctx.lineWidth=1.2;ctx.lineCap='round';
  if(o.horns==='lyre'){ctx.beginPath();ctx.moveTo(hx,hy-hr*0.7);ctx.bezierCurveTo(hx-2,hy-6,hx+1,hy-9,hx-0.5,hy-11);ctx.stroke();}
  if(o.horns==='spiral'){ctx.beginPath();let px=hx,py=hy-hr*0.7;ctx.moveTo(px,py);for(let k=1;k<=7;k++){px-=1.35;py-=1.6;ctx.lineTo(px+(k%2?1.1:-0.4),py);}ctx.stroke();}
  if(o.horns==='prong'){ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(hx,hy-hr*0.7);ctx.lineTo(hx-0.5,hy-6.5);ctx.lineTo(hx-2,hy-7.5);ctx.moveTo(hx-0.3,hy-4);ctx.lineTo(hx+1.6,hy-4.6);ctx.stroke();}
  if(o.horns==='curl'){ctx.strokeStyle='#b8a582';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(hx-1.4,hy-0.8,2.8,-2.4,1.6);ctx.stroke();}
  if(o.horns==='antler'){ctx.strokeStyle='#d8c8a8';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(hx,hy-hr*0.7);ctx.quadraticCurveTo(hx-6,hy-8,hx-3,hy-15);ctx.moveTo(hx-3.8,hy-7);ctx.lineTo(hx-7,hy-11);ctx.moveTo(hx-4.4,hy-11);ctx.lineTo(hx-1,hy-13);ctx.moveTo(hx+0.4,hy-2);ctx.lineTo(hx+3.5,hy-4);ctx.stroke();}
  if(o.horns==='spike'){ctx.beginPath();ctx.moveTo(hx,hy-hr*0.7);ctx.lineTo(hx-1.5,hy-4.5);ctx.stroke();}
  if(o.tusk){ctx.strokeStyle='#efe7d6';ctx.lineWidth=0.9;ctx.beginPath();ctx.moveTo(hx+hr*1.4,hy+0.6);ctx.lineTo(hx+hr*1.6,hy-1);ctx.stroke();}
  ctx.restore();}
function stumpOf(col){return (ctx,x,y,s)=>M.drawStump(ctx,x,y,s,col);}
/* trees and plants */
function acacia(ctx,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#d3bf7a';ctx.beginPath();ctx.ellipse(0,-1,9,2.2,0,0,6.29);ctx.fill();
  ctx.strokeStyle='#5a4128';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-12);ctx.lineTo(-5,-20);ctx.moveTo(0,-12);ctx.lineTo(5,-21);ctx.stroke();
  ctx.fillStyle='#6f7f35';ctx.beginPath();ctx.ellipse(0,-22,12,3.4,0,0,6.29);ctx.fill();ctx.fillStyle='#86964a';ctx.beginPath();ctx.ellipse(-2,-23.5,8,2.2,0,0,6.29);ctx.fill();ctx.restore();}
function palm(ctx,x,y,s,dead){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.strokeStyle='#7a5a36';ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(2,-14,0,-28);ctx.stroke();
  const col=dead?'#a08a5a':'#3f7a3a';ctx.strokeStyle=col;ctx.lineWidth=2.2;[[-12,-24],[-9,-33],[0,-36],[9,-33],[12,-24],[-6,-20],[6,-20]].forEach(([fx,fy])=>{ctx.beginPath();ctx.moveTo(0,-28);ctx.quadraticCurveTo(fx*0.5,fy-4,fx,fy);ctx.stroke();});
  if(!dead){ctx.fillStyle='#b5651d';ctx.beginPath();ctx.arc(-2,-26,1.6,0,6.29);ctx.arc(2,-25.5,1.6,0,6.29);ctx.fill();}ctx.restore();}
function tropTree(ctx,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#6b4f36';ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(-1.6,-6);ctx.lineTo(-1.6,-26);ctx.lineTo(1.6,-26);ctx.lineTo(1.6,-6);ctx.lineTo(5,0);ctx.closePath();ctx.fill();
  ctx.fillStyle='#1f5a2c';ctx.beginPath();ctx.ellipse(0,-30,12,7,0,0,6.29);ctx.fill();ctx.fillStyle='#2e7a3a';ctx.beginPath();ctx.ellipse(-4,-32,7,4.5,0,0,6.29);ctx.ellipse(5,-31,6,4,0,0,6.29);ctx.fill();ctx.restore();}
function roundTree(ctx,x,y,s,c1,c2){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#5d4430';ctx.fillRect(-1.5,-12,3,12);ctx.fillStyle=c1||'#2f6b35';ctx.beginPath();ctx.arc(0,-17,8,0,6.29);ctx.fill();ctx.fillStyle=c2||'#3f8a45';ctx.beginPath();ctx.arc(-3,-19,4.5,0,6.29);ctx.arc(3.5,-15,4,0,6.29);ctx.fill();ctx.restore();}
function coffee(ctx,x,y,s){ctx.save();roundTree(ctx,x-5*s,y,s*0.8,'#2a5e33','#3a7d40');ctx.translate(x+4*s,y);ctx.scale(s,s);ctx.fillStyle='#2f6a36';ctx.beginPath();ctx.ellipse(0,-5,5,5,0,0,6.29);ctx.fill();ctx.fillStyle='#b3261e';[[-2,-6],[1.5,-4],[2,-7.5]].forEach(([a,b])=>{ctx.beginPath();ctx.arc(a,b,0.9,0,6.29);ctx.fill();});ctx.restore();}
function joshua(ctx,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#7a7a42';ctx.beginPath();ctx.ellipse(-7,-2,4,2.4,0,0,6.29);ctx.ellipse(7,-2,3.5,2.2,0,0,6.29);ctx.fill();
  ctx.strokeStyle='#6a5a40';ctx.lineWidth=2.4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-14);ctx.lineTo(-6,-21);ctx.moveTo(0,-14);ctx.lineTo(5,-20);ctx.lineTo(7,-26);ctx.stroke();
  ctx.fillStyle='#5f7a3a';[[-6,-21],[7,-26],[5,-20]].forEach(([a,b])=>{ctx.beginPath();for(let k=0;k<10;k++){const t=k/10*6.28;ctx.lineTo(a+Math.cos(t)*(k%2?2:4),b+Math.sin(t)*(k%2?2:4));}ctx.closePath();ctx.fill();});ctx.restore();}
function tundra(ctx,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#6f7f4a';ctx.beginPath();ctx.ellipse(0,-2,11,4,0,3.14,6.29);ctx.fill();ctx.fillStyle='#8b8a52';ctx.beginPath();ctx.ellipse(-4,-3,5,2.5,0,3.14,6.29);ctx.fill();
  ctx.strokeStyle='#7a8a50';ctx.lineWidth=0.9;ctx.fillStyle='#ffffff';[[-7,-12],[-3,-15],[1,-13],[5,-16],[8,-11]].forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(a*0.6,-4);ctx.lineTo(a,b);ctx.stroke();ctx.beginPath();ctx.arc(a,b-1.6,2,0,6.29);ctx.fill();});ctx.restore();}
function colony(ctx,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#b99a6a';ctx.beginPath();ctx.ellipse(-6,-1,6,3,0,3.14,6.29);ctx.ellipse(7,-1,5,2.6,0,3.14,6.29);ctx.fill();
  ctx.fillStyle='#3a2e22';ctx.beginPath();ctx.ellipse(-6,-3,1.8,0.9,0,0,6.29);ctx.ellipse(7,-2.8,1.6,0.8,0,0,6.29);ctx.fill();
  [[-6,-4,1],[7,-3.6,0.9]].forEach(([a,b,sc])=>{ctx.save();ctx.translate(a,b);ctx.scale(sc,sc);ctx.fillStyle='#a7825a';ctx.beginPath();ctx.ellipse(0,-5,2.4,4.8,0,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(0,-10.5,2,0,6.29);ctx.fill();ctx.fillStyle='#1b1714';ctx.beginPath();ctx.arc(0.8,-10.8,0.45,0,6.29);ctx.fill();ctx.restore();});
  ctx.fillStyle='#8aa060';[[-12,-1],[12,-1],[0,-1]].forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(a-2,b);ctx.lineTo(a,b-5);ctx.lineTo(a+2,b);ctx.fill();});ctx.restore();}
function house(ctx,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#c9b8a0';ctx.fillRect(-7,-9,14,9);ctx.fillStyle='#6e5a4a';ctx.beginPath();ctx.moveTo(-9,-9);ctx.lineTo(0,-15);ctx.lineTo(9,-9);ctx.closePath();ctx.fill();ctx.fillStyle='#4a5a70';ctx.fillRect(-4,-6,3,3);ctx.fillRect(2,-6,3,3);ctx.fillStyle='#8aa060';ctx.fillRect(-9,-1,18,1.5);ctx.restore();}
function coral(ctx,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.strokeStyle='#e0805a';ctx.lineWidth=2.2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(-4,-9);ctx.lineTo(-8,-15);ctx.moveTo(-4,-9);ctx.lineTo(-1,-16);ctx.moveTo(-6,-5);ctx.lineTo(-10,-9);ctx.stroke();
  ctx.fillStyle='#8a5bb0';ctx.beginPath();ctx.ellipse(5,-7,3,7,0.1,0,6.29);ctx.fill();ctx.fillStyle='#5a3a80';ctx.beginPath();ctx.ellipse(5.3,-13,1.6,0.8,0,0,6.29);ctx.fill();
  ctx.fillStyle='#d8b84a';ctx.beginPath();ctx.ellipse(0,-1.5,6,2.5,0,3.14,6.29);ctx.fill();ctx.fillStyle='#c8a03a';for(let k=-4;k<=4;k+=2){ctx.beginPath();ctx.arc(k,-2.5,0.7,0,6.29);ctx.fill();}ctx.restore();}
function bleached(ctx,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.strokeStyle='#efeae0';ctx.lineWidth=2.2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(-4,-9);ctx.lineTo(-8,-15);ctx.moveTo(-4,-9);ctx.lineTo(-1,-16);ctx.stroke();ctx.fillStyle='#e6e0d0';ctx.beginPath();ctx.ellipse(3,-1.5,5,2.2,0,3.14,6.29);ctx.fill();ctx.restore();}
/* animals */
function otter(ctx,x,y,s,flip){ctx.save();ctx.translate(x,y);ctx.scale(flip?-s:s,s);ctx.fillStyle='#4a3424';ctx.beginPath();ctx.ellipse(0,-5,10,3.6,-0.05,0,6.29);ctx.fill();
  ctx.beginPath();ctx.moveTo(-9,-6);ctx.quadraticCurveTo(-16,-4,-18,-1.5);ctx.lineTo(-16,-0.5);ctx.quadraticCurveTo(-12,-2.5,-8,-3);ctx.fill();
  ctx.beginPath();ctx.ellipse(10,-7.5,3.6,2.8,0.2,0,6.29);ctx.fill();ctx.fillStyle='#e9dcc0';ctx.beginPath();ctx.ellipse(9,-4.6,2.6,1.6,0,0,6.29);ctx.fill();
  ctx.fillStyle='#1a1410';ctx.beginPath();ctx.arc(11.6,-8.4,0.6,0,6.29);ctx.arc(13.6,-7.2,0.7,0,6.29);ctx.fill();ctx.fillStyle='#4a3424';[[-5,-1.5],[5,-1.5]].forEach(([a,b])=>{ctx.beginPath();ctx.ellipse(a,b,2,1.4,0,0,6.29);ctx.fill();});ctx.restore();}
function ferret(ctx,x,y,s,flip){ctx.save();ctx.translate(x,y);ctx.scale(flip?-s:s,s);ctx.fillStyle='#d8c39a';ctx.beginPath();ctx.ellipse(0,-5,9,2.8,-0.05,0,6.29);ctx.fill();
  ctx.fillStyle='#2a221c';[[-6,-1.5],[-3,-1.5],[4,-1.5],[7,-1.5]].forEach(([a,b])=>{ctx.fillRect(a-0.8,b-2,1.6,3.5);});ctx.beginPath();ctx.ellipse(-10.5,-5,3,1.3,0.2,0,6.29);ctx.fill();
  ctx.fillStyle='#d8c39a';ctx.beginPath();ctx.ellipse(-8.2,-5.2,2.2,1.4,0,0,6.29);ctx.fill();ctx.beginPath();ctx.ellipse(10,-6.5,3.2,2.4,0.15,0,6.29);ctx.fill();
  ctx.fillStyle='#2a221c';ctx.beginPath();ctx.ellipse(10.6,-7,2.2,0.9,0.15,0,6.29);ctx.fill();ctx.fillStyle='#d8c39a';ctx.beginPath();ctx.arc(8.6,-8.6,1,0,6.29);ctx.fill();ctx.fillStyle='#1b1714';ctx.beginPath();ctx.arc(13,-6,0.6,0,6.29);ctx.fill();ctx.restore();}
function polar(ctx,x,y,s,flip){quad(ctx,x,y,s,flip,{c:'#f1ece0',dk:'#9a917e',legc:'#e6dfcf',lw:3,bw:10,bh:6,leg:7,nx:3,ny:2,hr:3,headc:'#f3eee3',tail:1,tailc:'#e6dfcf',ear:1});
  ctx.save();ctx.translate(x,y);ctx.scale(flip?-s:s,s);ctx.fillStyle='#1b1714';ctx.beginPath();ctx.arc(10+3*1.35+1,-(7+6*0.55)-2+0.4,0.8,0,6.29);ctx.fill();ctx.restore();}
function gorilla(ctx,x,y,s,flip){ctx.save();ctx.translate(x,y);ctx.scale(flip?-s:s,s);ctx.fillStyle='#232326';
  ctx.beginPath();ctx.moveTo(-9,-4);ctx.quadraticCurveTo(-10,-17,-1,-19);ctx.quadraticCurveTo(8,-19,9,-13);ctx.lineTo(10,-3);ctx.lineTo(7,-3);ctx.lineTo(6,-10);ctx.lineTo(-2,-8);ctx.lineTo(-5,-1);ctx.lineTo(-9,-1);ctx.closePath();ctx.fill();
  ctx.fillStyle='#8a8a90';ctx.beginPath();ctx.ellipse(-3,-15,5,2.6,-0.15,0,6.29);ctx.fill();
  ctx.fillStyle='#232326';ctx.beginPath();ctx.arc(9.5,-15,4,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(7,-19);ctx.quadraticCurveTo(9,-22,12,-19);ctx.fill();
  ctx.fillStyle='#3e3a3a';ctx.beginPath();ctx.ellipse(11.4,-13.5,2.2,1.6,0,0,6.29);ctx.fill();ctx.fillStyle='#d8c8a0';ctx.beginPath();ctx.arc(11,-16,0.55,0,6.29);ctx.fill();
  ctx.fillStyle='#232326';ctx.fillRect(8,-8,2.6,8);ctx.fillRect(-7,-6,2.6,6);ctx.restore();}
function lutung(ctx,x,y,s,flip){ctx.save();ctx.translate(x,y);ctx.scale(flip?-s:s,s);ctx.strokeStyle='#1d1d22';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(-3,-6);ctx.quadraticCurveTo(-9,0,-6,8);ctx.stroke();
  ctx.fillStyle='#1d1d22';ctx.beginPath();ctx.ellipse(0,-9,4.2,6,0.1,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(1.2,-17,3.4,0,6.29);ctx.fill();
  ctx.beginPath();ctx.moveTo(-1.5,-19.5);ctx.lineTo(1,-23.5);ctx.lineTo(3.4,-19.6);ctx.fill();ctx.fillStyle='#4a4a52';ctx.beginPath();ctx.ellipse(2.6,-16.2,1.6,1.4,0,0,6.29);ctx.fill();
  ctx.fillStyle='#1d1d22';ctx.fillRect(-3,-3.5,2.4,3.5);ctx.fillRect(1.2,-3.5,2.4,3.5);ctx.fillStyle='#d8c060';ctx.beginPath();ctx.arc(3,-17.6,0.5,0,6.29);ctx.fill();ctx.restore();}
function tortoise(ctx,x,y,s,flip){ctx.save();ctx.translate(x,y);ctx.scale(flip?-s:s,s);ctx.fillStyle='#7a6a4a';[[-6,-1],[5,-1]].forEach(([a,b])=>{ctx.beginPath();ctx.ellipse(a,b,2,1.6,0,0,6.29);ctx.fill();});
  ctx.beginPath();ctx.ellipse(11,-4,3,2.2,0.3,0,6.29);ctx.fill();ctx.fillStyle='#1b1714';ctx.beginPath();ctx.arc(12.4,-4.8,0.5,0,6.29);ctx.fill();
  ctx.fillStyle='#6b5434';ctx.beginPath();ctx.ellipse(0,-4,10,7.5,0,3.14,6.29);ctx.fill();ctx.strokeStyle='#4a3a24';ctx.lineWidth=0.8;ctx.stroke();
  ctx.fillStyle='#8a7048';[[-5,-6],[0,-8],[5,-6],[-2.5,-3],[2.5,-3]].forEach(([a,b])=>{ctx.beginPath();ctx.ellipse(a,b,2.2,1.6,0,0,6.29);ctx.fill();});ctx.restore();}
function hawksbill(ctx,x,y,s,flip){ctx.save();ctx.translate(x,y-26);ctx.scale(flip?-s:s,s);ctx.fillStyle='#9a7a4a';ctx.beginPath();ctx.ellipse(-2,4,5,2,-0.5,0,6.29);ctx.ellipse(-2,-4,7,2.4,0.6,0,6.29);ctx.fill();
  ctx.beginPath();ctx.ellipse(-9,1.5,3,1.2,0.3,0,6.29);ctx.fill();ctx.fillStyle='#7a5a32';ctx.beginPath();ctx.ellipse(0,0,9,6,0,0,6.29);ctx.fill();
  ctx.fillStyle='#c09050';[[-4,-2],[0,-3],[4,-2],[-2,2],[2.5,2]].forEach(([a,b])=>{ctx.beginPath();ctx.ellipse(a,b,1.8,1.3,0.4,0,6.29);ctx.fill();});
  ctx.fillStyle='#9a7a4a';ctx.beginPath();ctx.ellipse(11,-0.5,3.4,2.4,0,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(14,-1);ctx.lineTo(16,0.4);ctx.lineTo(13.8,1);ctx.fill();ctx.fillStyle='#1b1714';ctx.beginPath();ctx.arc(12.2,-1.2,0.6,0,6.29);ctx.fill();ctx.restore();}
function grouper(ctx,x,y,s,flip){ctx.save();ctx.translate(x,y-18);ctx.scale(flip?-s:s,s);[[0,0,1],[-9,-7,0.75],[-10,6,0.7]].forEach(([a,b,k])=>{ctx.save();ctx.translate(a,b);ctx.scale(k,k);
  ctx.fillStyle='#8a6a52';ctx.beginPath();ctx.ellipse(0,0,9,4.2,0,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(-13,-4);ctx.lineTo(-13,4);ctx.closePath();ctx.fill();
  ctx.fillStyle='#5a3e2c';[[-3,-1],[1,1],[4,-1.5],[-1,2.3]].forEach(([p,q])=>{ctx.beginPath();ctx.arc(p,q,0.9,0,6.29);ctx.fill();});ctx.fillStyle='#1b1714';ctx.beginPath();ctx.arc(6,-1,0.7,0,6.29);ctx.fill();ctx.restore();});ctx.restore();}
/* ---------- land: Sahara oasis (Niger) ---------- */
const sahSurf=[[0,330],[60,322],[120,334],[180,318],[240,330],[270,326],[330,170],[520,160],[590,320],[800,320]];
M.addLand({key:'sahara',name:'Sahara oasis',place:'Near the Termit Massif, eastern Niger (Sahara)',icon:'🏜️',
  blurb:'Gold under a desert massif, addax and gazelles in the dunes, and an oasis village living on old groundwater.',
  surf:sahSurf,spots:[zone(sahSurf,'Dunes',14,256,10),zone(sahSurf,'Plateau',345,510,9),zone(sahSurf,'Wadi slope',530,584,4),zone(sahSurf,'Oasis edge',600,676,5)],
  start:['tree','lynx','tree','deer','tree','tree','lynx','tree','deer','',
         'tree','deer','tree','lynx','tree','tree','lynx','tree','deer',
         'tree','','tree','deer',
         'tree','lynx','tree','','deer'],
  path:[0,sAtX(sahSurf,690)],barrier:{after:9,name:'the rocky escarpment',at:[300,250],desc:'The steep rock wall between the dunes and the plateau keeps the two herds apart.'},
  deep:offset(sahSurf,64),
  veins:[deepV(360,262,402,250),deepV(420,290,468,276),deepV(470,238,506,248),deepV(380,318,430,330),deepV(452,345,500,338),
    shallow(sahSurf,30,72,24),shallow(sahSurf,170,214,22),shallow(sahSurf,352,392,24),shallow(sahSurf,446,488,24),shallow(sahSurf,540,566,20),shallow(sahSurf,604,650,22),shallow(sahSurf,226,256,24)],
  res:{one:'gold deposit',many:'gold deposits',verb:'Dig',what:'gold',col:['#6d5513','#e0b42c','#fff3b0'],
    deepHow:'Deep deposits are reached by a shaft, so the surface stays as it is.',shallowHow:'Shallow deposits are dug as open pits, and processing them takes water from the aquifer.'},
  sp:{tree:{one:'acacia and grass patch',many:'acacia and grass patches',short:'Acacia',icon:'🌳',verbRow:'Cut an acacia patch for charcoal',harvest:'Cut for charcoal',status:'Slow to regrow in the desert'},
      deer:{one:'dorcas gazelle herd',many:'dorcas gazelle herds',short:'Gazelles',icon:'🦌',verbRow:'Hunt a dorcas gazelle herd',status:'Hunted for meat'},
      lynx:{one:'addax herd',many:'addax herds',short:'Addax',icon:'🐐',status:'Critically endangered (IUCN)',needs:'acacia and grass patches',
        protectedMsg:'Addax are protected by law in Niger and are among the rarest antelopes on Earth, so they are worth $0 to hunt.'}},
  water:[{k:'res',name:'Oasis wells',short:'oasis wells',cx:745,cy:333,hit:[700,318,792,348],note:'The village and its date palms live on these wells, which tap very old groundwater.',
      draw(ctx,col){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(745,330,44,9,0,0,6.29);ctx.fill();ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(720,328,30,2);}},
    {k:'creek',name:'Guelta rock pool',short:'guelta',cx:58,cy:338,hit:[20,326,100,352],note:'A rare rock pool where gazelles, addax and herders’ camels drink.',
      draw(ctx,col){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(58,338,36,8,0,0,6.29);ctx.fill();}}],
  town:{name:'the oasis village',water:'res',x:745,y:318,people:'The oasis village drinks from the wells and waters its date palms with them.'},
  aquifer:{perMine:6,dry:40,drift:0.5},
  yearly:[{role:'deer',per:10,label:'Hunting permits (gazelles)'},{role:'water',per:40,aq:2.5,label:'Well water pumped and sold to farms',x:720,y:250}],
  injury:0.12,parkName:'desert reserve',leakWord:'Mercury and cyanide from old pits',protectHow:'lined ponds and mercury-free processing',pollCol:'#8f7a52',
  shock:{p:0.06,frac:0.3,text:'Drought year'},regrowYears:16,
  floor:{tree:'#8a8a3a',cut:'#c9a46a',sap:'#a8a24e',pit:'#4a3a2a',open:{_:'#d9b77a'}},
  art:{tree:acacia,deer:(c,x,y,s,f)=>quad(c,x,y,s*0.95,f,{c:'#c99a62',belly:'#f3ece0',band:'#7a5232',bw:8,bh:4.2,leg:11,ny:10,hr:2.4,horns:'lyre',ear:2.2,face:'#f3ece0'}),
    lynx:(c,x,y,s,f)=>quad(c,x,y,s,f,{c:'#ece6da',dk:'#8a8070',legc:'#cfc5b2',bw:9.5,bh:5.4,leg:9,ny:7,hr:2.8,horns:'spiral',hornc:'#7a6a50',headc:'#e3dccb',face:'#9a7a5a',ear:1.6})},
  drawBack(ctx,C,st){M.skyGrad(ctx,C,'#f0dcb0','#f8ecd2','#2a2420','#332a22',320);
    ctx.fillStyle=C.dark?'#3a3026':'#e4c48c';ctx.beginPath();ctx.moveTo(0,320);ctx.quadraticCurveTo(120,250,240,300);ctx.quadraticCurveTo(420,240,600,290);ctx.quadraticCurveTo(700,260,800,280);ctx.lineTo(800,330);ctx.lineTo(0,330);ctx.fill();
    M.fillGround(ctx,sahSurf,C.dark?'#7a5a3a':'#d8b070');
    poly(ctx,[[270,326],[330,170],[520,160],[590,320]],C.dark?'#6a4430':'#b06a42');
    ctx.fillStyle=C.dark?'rgba(0,0,0,.18)':'rgba(120,60,30,.18)';for(let k=0;k<6;k++)ctx.fillRect(330+k*30,185+k*22,160-k*20,3);
    const dry=st.aq!=null&&st.aq<40;[[640,320],[668,322],[700,318],[770,318],[792,320],[612,322]].forEach(([px,py],i)=>palm(ctx,px,py,0.95+(i%2)*0.1,dry));
    M.drawTown(ctx,746,318,1);},
  drawBarrier(ctx,C){},
  drawFront(ctx,C,st,k){if(st.aq==null)return;const kk=Math.min(k,1.3),x=560,y=80;ctx.save();ctx.fillStyle=C.dark?'rgba(30,32,38,.85)':'rgba(255,255,255,.85)';ctx.fillRect(x,y,228*kk,26*kk);
    ctx.fillStyle='#3c7fc0';ctx.fillRect(x+6,y+16*kk,Math.max(0,st.aq)/100*150*kk,6*kk);ctx.strokeStyle=C.ink;ctx.strokeRect(x+6,y+16*kk,150*kk,6*kk);
    ctx.fillStyle=st.aq<40?'#b3261e':C.ink;ctx.font='600 '+Math.round(11.5*kk)+'px system-ui,sans-serif';ctx.fillText('Groundwater: '+Math.round(st.aq)+'%'+(st.aq<40?' (wells dry)':''),x+6,y+12*kk);ctx.restore();},
  labels:[{t:'Guelta',x:22,y:368},{t:'Oasis village',x:796,y:356,a:'right'},{t:'Escarpment',x:282,y:206,soft:1}],
  cases:[
   {t:'The addax: down to its last few',b:'The addax may be the rarest hoofed mammal on Earth, with as few as 100 left in the wild, mostly in eastern Niger. Oil work, poaching and more traffic through its desert have pushed it down.',g:'The addax is the rare animal you cannot hunt. It needs patches of grass and acacia.',src:[['IUCN: Saving the addax','https://iucn.org/index.php/node/32075']]},
   {t:'Moving the park gates for oil (2019)',b:'In 2019 Niger redrew its Termit and Tin Toumma reserve and removed about 50,000 square kilometres, the part that overlapped oil blocks, which left much of the addax’s last range outside the reserve.',g:'Where you put the park gates decides what is protected.',src:[['IUCN: Saving the addax','https://iucn.org/index.php/node/32075']]},
   {t:'The oryx came back (2016–2023)',b:'The scimitar-horned oryx was declared extinct in the wild in 2000. Chad and Abu Dhabi released 285 zoo-bred oryx into a huge reserve starting in 2016, and by 2023 more than 600 roamed free, so the IUCN moved it from Extinct in the Wild to Endangered.',g:'Protected land plus patient work can bring a species back.',src:[['Sahara Conservation: oryx','https://saharaconservation.org/species-recovery/the-scimitar-horned-oryx-reintroduction/']]},
   {t:'Gold rush with mercury and cyanide',b:'In Sudan, small-scale miners process gold with mercury and cyanide, sometimes yards from date palm groves and shallow groundwater, and the chemicals are reaching farmland and wells.',g:'Digging near the wells risks the water the village drinks.',src:[['Yale e360: Sudan gold mining','https://e360.yale.edu/features/sudan-war-gold-mining']]},
   {t:'Water that does not come back',b:'Deep Saharan aquifers such as the Nubian Sandstone Aquifer hold fossil water stored tens of thousands of years ago, when the region was wetter. Once it is pumped out, it is gone.',g:'Selling well water pays every year, but the groundwater gauge only goes down.',src:[['IPS: Egypt’s desert oases','https://www.ipsnews.net/?p=135513']]},
   {t:'Oases are shrinking',b:'Morocco has lost roughly two-thirds of its oasis habitat over the last century, as heat rises, rain falls and more water is pumped.',g:'When the groundwater gauge drops too low, the wells and the palms die.',src:[['Yale e360: Saharan oases','https://e360.yale.edu/features/a_drive_to_save_sahran_oases_as_climate_change_takes_a_toll_cop22']]}]});
/* ---------- land: Peruvian Amazon (Madre de Dios) ---------- */
const amSurf=[[0,300],[120,296],[220,304],[300,300],[340,326],[460,326],[500,300],[640,296],[800,300]];
M.addLand({key:'amazon',artK:1.3,name:'Peruvian Amazon',place:'Madre de Dios, Peru',icon:'🌳',
  blurb:'Gold in the river gravels, Brazil nut forest, giant otters in an oxbow lake, and a riverside village that eats the fish.',
  surf:amSurf,spots:[zone(amSurf,'West forest',14,318,14),zone(amSurf,'East forest',476,600,6),zone(amSurf,'Lakeside forest',620,788,9)],
  start:['tree','deer','tree','tree','tree','tree','deer','tree','','tree','deer','tree','lynx','lynx',
         'tree','deer','tree','tree','','tree',
         'tree','lynx','tree','tree','lynx','tree','lynx','tree','tree'],
  path:[0,sAtX(amSurf,800)],barrier:{after:19,name:'the Interoceanic Highway',at:[610,286],desc:'The highway cuts the forest in two. Animals that try to cross it get hit.'},
  deep:offset(amSurf,66),topNeedsClean:true,
  veins:[deepV(60,378,110,372),deepV(150,390,200,384),deepV(520,382,570,376),deepV(650,384,700,380),deepV(380,400,430,396),
    shallow(amSurf,40,80,22),shallow(amSurf,190,232,22),shallow(amSurf,300,330,18),shallow(amSurf,470,500,18),shallow(amSurf,540,580,22),shallow(amSurf,680,720,22),shallow(amSurf,740,780,22)],
  res:{one:'gold gravel bed',many:'gold gravel beds',verb:'Dredge',what:'gold',col:['#5b4a2a','#c9a04a','#fff0a0'],
    deepHow:'Deep gravels are reached by a shaft, so the forest above stays.',shallowHow:'Shallow gravels are dug and pumped out, which clears the forest and leaves ponds.'},
  sp:{tree:{one:'rainforest stand',many:'rainforest stands',short:'Forest',icon:'🌳',verbRow:'Log a rainforest stand',harvest:'Log',status:'Brazil nut trees grow only in old forest'},
      deer:{one:'peccary herd',many:'peccary herds',short:'Peccaries',icon:'🐗',verbRow:'Hunt a peccary herd',status:'Hunted for meat'},
      lynx:{one:'giant otter family',many:'giant otter families',short:'Giant otters',icon:'🦦',status:'Endangered (IUCN)',needs:'rainforest stands and clean water',
        protectedMsg:'Giant otters are an endangered, protected species, so they are worth $0 to hunt.'}},
  water:[{k:'res',name:'Madre de Dios River',short:'river',cx:400,cy:318,hit:[340,306,460,334],note:'The riverside village drinks this water and eats its fish.',
      draw(ctx,col){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(338,304);ctx.lineTo(462,304);ctx.lineTo(456,326);ctx.lineTo(344,326);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(360,310,50,2);}},
    {k:'creek',name:'Oxbow lake',short:'oxbow lake',cx:722,cy:314,hit:[668,302,780,326],note:'A quiet lake cut off from the river, where giant otters fish.',
      draw(ctx,col){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(724,314,54,10,0,0,6.29);ctx.fill();}}],
  town:{name:'the riverside village',water:'res',x:300,y:300,people:'The village drinks river water and eats river fish, where mercury builds up.'},
  yearly:[{role:'tree',per:10,label:'Brazil nut harvest',x:150,y:220},{role:'deer',per:10,label:'Hunting (peccaries)'}],
  injury:0.15,parkName:'reserve',leakWord:'Mercury from old mining ponds',protectHow:'settling ponds and mercury-free processing',pollCol:'#8f7a52',
  floor:{tree:'#1f4a28',cut:'#a07a48',sap:'#5a8a3a',pit:'#4a3a22',open:{_:'#3f6a35'}},
  art:{tree:tropTree,deer:(c,x,y,s,f)=>quad(c,x,y,s,f,{c:'#3e3630',dk:'#1e1a16',bw:8.5,bh:5,leg:6.5,nx:1,ny:1,hr:2.8,noNeck:true,tusk:true,face:'#e8e0d4',ear:1.4,tail:1}),lynx:otter},
  flip:(p,i)=>p.x<400,
  drawBack(ctx,C){M.skyGrad(ctx,C,'#cfe0d6','#e8f0e8','#1c2a24','#24302a',300);
    ctx.fillStyle=C.dark?'#1f3a28':'#4a8a4e';ctx.beginPath();ctx.moveTo(0,300);for(let x=0;x<=800;x+=20)ctx.lineTo(x,236+8*Math.sin(x/37)+6*Math.sin(x/13));ctx.lineTo(800,300);ctx.fill();
    ctx.fillStyle=C.dark?'#183020':'#3a7a40';ctx.beginPath();ctx.moveTo(0,300);for(let x=0;x<=800;x+=16)ctx.lineTo(x,262+6*Math.sin(x/29+1)+5*Math.sin(x/9));ctx.lineTo(800,300);ctx.fill();
    M.fillGround(ctx,amSurf,C.dark?'#4a3a28':'#8a6a44');M.drawTown(ctx,300,298,0.9);},
  drawBarrier(ctx,C){road(ctx,610,288,'',C);},
  labels:[{t:'Madre de Dios River',x:400,y:350,a:'center'},{t:'Oxbow lake',x:724,y:346,a:'center'},{t:'Village',x:300,y:268,a:'center',soft:1},{t:'Highway',x:610,y:278,a:'center',soft:1}],
  cases:[
   {t:'Operation Mercury (2019)',b:'In February 2019 Peru sent police and soldiers into La Pampa, the worst illegal gold mining zone in Madre de Dios. Gold-mining deforestation there fell more than 90%, though some miners moved to other areas.',g:'Protecting land only works if someone enforces it.',src:[['MAAP #130','https://www.maapprogram.org/?p=20870']]},
   {t:'Forest lost to gold',b:'Illegal gold mining alone has destroyed more than 370,000 acres of old-growth forest in Madre de Dios. Miners pump out river gravels and use mercury to collect the gold.',g:'Shallow gravel beds clear the forest above them.',src:[['NBC News: Inside Peru’s emergency zone','https://www.nbcnews.com/specials/paradise-lost-inside-peru-s-emergency-zone/index.html']]},
   {t:'Giant otters and mercury',b:'Giant otters are endangered. Along rivers with heavy gold mining in Madre de Dios they have nearly disappeared, surviving mostly in lakes and side streams without mining. Mercury builds up in the fish they eat.',g:'Otters need forest and clean water: a spill in their lake kills them.',src:[['Mongabay (2012)','https://news.mongabay.com/2012/01/saving-the-worlds-biggest-river-otter/'],['San Diego Zoo Wildlife Alliance','https://science.sandiegozoo.org/node/17966']]},
   {t:'Brazil nuts pay every year',b:'About 15,000 people in Madre de Dios work in the Brazil nut industry. The nuts come only from wild trees in standing forest, so the forest earns money every year it stays up.',g:'With yearly harvests on, each standing forest stand outside the reserve earns Brazil nut income.',src:[['Rainforest Alliance case study','https://rainforest-alliance.org/case-studies/brazil-nut']]}]});
/* ---------- land: Denver's edge (Front Range prairie) ---------- */
const dnSurf=[[0,300],[200,296],[400,304],[600,296],[800,300]];
M.addLand({key:'denver',artK:1.3,name:'Denver’s edge',place:'Shortgrass prairie on the northeast edge of Denver, Colorado',icon:'🏙️',
  blurb:'Oil and gas under the prairie, prairie dogs and black-footed ferrets, pronghorn, and a new neighborhood next door.',
  surf:dnSurf,spots:[zone(dnSurf,'West prairie',14,410,17),zone(dnSurf,'East prairie',450,640,9)],
  start:['tree','deer','tree','lynx','tree','tree','deer','tree','','tree','lynx','tree','deer','tree','tree','lynx','tree',
         'tree','lynx','tree','deer','tree','lynx','tree','','deer'],
  path:[0,sAtX(dnSurf,660)],barrier:{after:16,name:'the E-470 tollway',at:[430,292],desc:'The busy tollway splits the prairie, and ferrets and pronghorn rarely make it across.'},
  deep:offset(dnSurf,62),noRegrow:true,
  veins:[deepV(60,390,120,384),deepV(200,400,260,396),deepV(320,384,380,392),deepV(500,392,560,386),deepV(600,400,650,396),
    shallow(dnSurf,30,70,24),shallow(dnSurf,150,190,24),shallow(dnSurf,280,320,24),shallow(dnSurf,470,510,24),shallow(dnSurf,560,600,24),shallow(dnSurf,630,670,24),shallow(dnSurf,360,400,24)],
  res:{one:'oil and gas site',many:'oil and gas sites',verb:'Drill',what:'oil and gas',col:['#151515','#3c342c','#9a8a70'],
    deepHow:'Deep sites can be reached by horizontal drilling from a pad far away, so the surface stays as it is.',shallowHow:'Shallow sites need a well pad right here, which scrapes off what lives on top.'},
  sp:{tree:{one:'prairie dog colony',many:'prairie dog colonies',short:'Prairie dogs',icon:'🐿️',verbRow:'Build homes on a prairie dog colony',harvest:'Build homes',status:'Colonies are often removed for building'},
      deer:{one:'pronghorn herd',many:'pronghorn herds',short:'Pronghorn',icon:'🦌',verbRow:'Sell a pronghorn hunt',status:'Hunted with licenses'},
      lynx:{one:'black-footed ferret family',many:'black-footed ferret families',short:'Ferrets',icon:'🦡',status:'Endangered (federal list since 1967)',needs:'prairie dog colonies',
        protectedMsg:'Black-footed ferrets are federally endangered, so they are worth $0 to harvest.'}},
  water:[{k:'res',name:'Neighborhood reservoir',short:'reservoir',cx:690,cy:312,hit:[650,302,730,324],note:'The new neighborhood’s water is stored here.',
      draw(ctx,col){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(690,312,40,9,0,0,6.29);ctx.fill();}},
    {k:'creek',name:'Prairie creek',short:'creek',cx:240,cy:306,hit:[200,298,280,316],note:'A cottonwood-lined creek that flows to the South Platte River.',
      draw(ctx,col){ctx.strokeStyle=col;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(200,304);ctx.bezierCurveTo(225,312,255,300,280,308);ctx.stroke();}}],
  town:{name:'the new neighborhood',water:'res',x:760,y:300,setback:150,people:'Families in the new neighborhood live next to the wells and drink from the reservoir.'},
  yearly:[{role:'deer',per:10,label:'Hunting licenses (pronghorn)'}],
  injury:0.04,parkName:'wildlife refuge',leakWord:'Oil and wastewater leak',protectHow:'lined pits and leak detection',pollCol:'#5a5040',
  floor:{tree:'#9a8a52',cut:'#8a8a8a',sap:'#8a8a8a',pit:'#3a3029',open:{_:'#b5a76a'}},
  art:{tree:colony,cut:house,sap:house,deer:(c,x,y,s,f)=>quad(c,x,y,s,f,{c:'#c08850',belly:'#f6f1e8',rump:'#f6f1e8',bw:8.5,bh:4.6,leg:10,ny:9,hr:2.5,horns:'prong',face:'#2a221c',ear:1.6}),lynx:ferret},
  drawBack(ctx,C){M.skyGrad(ctx,C,'#cfe3f3','#eef4f8','#1c2633','#232a31',300);
    ctx.fillStyle=C.dark?'#2b3440':'#a9b8c6';ctx.beginPath();ctx.moveTo(0,300);ctx.lineTo(0,212);ctx.lineTo(60,180);ctx.lineTo(110,214);ctx.lineTo(170,170);ctx.lineTo(240,222);ctx.lineTo(300,200);ctx.lineTo(360,240);ctx.lineTo(380,300);ctx.fill();
    ctx.fillStyle='#f4f6f8';[[60,180,10],[170,170,12]].forEach(([a,b,w])=>{ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(a-w,b+10);ctx.lineTo(a+w,b+10);ctx.fill();});
    ctx.fillStyle=C.dark?'#3a4250':'#8a96a4';[[520,262,8,34],[532,250,10,46],[546,268,7,28],[556,256,9,40],[568,272,8,24]].forEach(([a,b,w,h])=>ctx.fillRect(a,b,w,h));
    M.fillGround(ctx,dnSurf,C.dark?'#5a5236':'#c2b47a');[[722,300],[744,302],[766,300],[788,302]].forEach(([a,b])=>house(ctx,a,b,1.1));
    ctx.save();ctx.setLineDash([3,4]);ctx.strokeStyle='#b3261e';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(610,330);ctx.lineTo(610,440);ctx.stroke();ctx.restore();},
  drawBarrier(ctx,C){road(ctx,430,296,'',C);},
  drawFront(ctx,C,st,k){ctx.save();ctx.fillStyle=C.dark?'#ff8a80':'#b3261e';ctx.font='600 '+Math.round(11*Math.min(k,1.3))+'px system-ui,sans-serif';ctx.textAlign='left';ctx.fillText('2,000-ft setback line',614,438);ctx.restore();},
  labels:[{t:'Denver',x:546,y:244,a:'center',soft:1},{t:'New neighborhood',x:796,y:276,a:'right'},{t:'E-470',x:430,y:282,a:'center',soft:1},{t:'Creek',x:240,y:328,a:'center'}],
  cases:[
   {t:'From weapons plant to wildlife refuge',b:'The Rocky Mountain Arsenal, in Commerce City, once made chemical weapons. It is now a national wildlife refuge less than 10 miles from downtown Denver, and black-footed ferrets were released there in 2015.',g:'A cleaned-up place can become a refuge. The park is your refuge.',src:[['CBS Colorado','https://www.cbsnews.com/colorado/news/black-footed-ferrets-colorado-rocky-mountain-arsenal-national-wildlife-refuge']]},
   {t:'Declared extinct, then found',b:'Black-footed ferrets eat almost nothing but prairie dogs. As prairie dog towns disappeared, so did the ferrets, and they were declared extinct in 1979. A few were later found, and almost every ferret alive today descends from them.',g:'Each ferret family needs prairie dog colonies around it.',src:[['Visit Denver','https://visitdenver.com/blog/post/black-footed-ferrets/'],['CPW','https://cpw.state.co.us/news/04132023/cpw-releases-video-highlighting-10-years-efforts-restore-endangered-black-footed']]},
   {t:'2,000 feet from homes (2020)',b:'After a 2019 state law (SB 181), Colorado required most new oil and gas wells to be at least 2,000 feet from homes and schools, up from 500 feet. A 2019 state study found short-term health effects were possible within 2,000 feet under worst-case conditions. Supporters called it a health protection; industry groups called it a near ban.',g:'Drilling a site inside the setback line counts against the people layer.',src:[['Colorado Sun','https://coloradosun.com/?p=153667'],['CPR (2020)','https://www.cpr.org/2020/11/23/colorado-has-a-brand-new-set-of-oil-and-gas-rules-with-a-focus-on-regulating-the-industry/']]}]});
/* ---------- land: Arctic coastal plain (Alaska) ---------- */
const arSurf=[[0,300],[160,298],[330,304],[360,312],[400,312],[430,302],[600,298],[700,302],[800,306]];
M.addLand({key:'arctic',artK:1.3,name:'Arctic coastal plain',place:'Arctic National Wildlife Refuge, Alaska',icon:'🐻‍❄️',
  blurb:'Oil under the tundra, caribou calving grounds, polar bear dens on the coast, and a village that lives on both.',
  surf:arSurf,spots:[zone(arSurf,'Foothill tundra',14,322,15),zone(arSurf,'Coastal tundra',440,690,12)],
  start:['tree','deer','tree','tree','deer','tree','lynx','tree','deer','tree','tree','lynx','tree','deer','tree',
         'tree','deer','tree','lynx','tree','tree','lynx','tree','','tree','tree','lynx'],
  path:[0,sAtX(arSurf,700)],barrier:{after:14,name:'the braided river',at:[380,300],desc:'The wide braided river splits the plain; bear families and caribou rarely cross it in calving season.'},
  deep:offset(arSurf,60),
  veins:[deepV(60,384,120,378),deepV(180,392,240,388),deepV(470,384,530,378),deepV(560,392,620,386),deepV(640,380,690,376),
    shallow(arSurf,30,70,22),shallow(arSurf,120,160,22),shallow(arSurf,230,270,22),shallow(arSurf,300,330,22),shallow(arSurf,460,500,22),shallow(arSurf,560,600,22),shallow(arSurf,650,690,22)],
  res:{one:'oil field',many:'oil fields',verb:'Drill',what:'oil',col:['#151515','#3c342c','#9a8a70'],
    deepHow:'Deep oil can be reached by directional drilling from a pad far away, so the tundra above stays as it is.',shallowHow:'Shallow oil needs a gravel pad and roads right here, which bury the tundra.'},
  sp:{tree:{one:'tundra wetland patch',many:'tundra wetland patches',short:'Tundra',icon:'🌾',verbRow:'Dig gravel from a tundra patch for roads',harvest:'Dig gravel',status:'Takes decades to recover'},
      deer:{one:'caribou herd',many:'caribou herds',short:'Caribou',icon:'🦌',verbRow:'Hunt a caribou herd',status:'Food for local families'},
      lynx:{one:'polar bear family',many:'polar bear families',short:'Polar bears',icon:'🐻‍❄️',status:'Threatened (federal list since 2008)',needs:'undisturbed tundra for dens',
        protectedMsg:'Polar bears are a threatened species, so they are worth $0 to hunt here.'}},
  water:[{k:'res',name:'Village lagoon',short:'lagoon',cx:745,cy:316,hit:[700,306,792,328],note:'The coastal village fishes and hunts along this lagoon.',
      draw(ctx,col){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(700,306);ctx.lineTo(800,306);ctx.lineTo(800,330);ctx.lineTo(706,326);ctx.closePath();ctx.fill();}},
    {k:'creek',name:'Braided river',short:'river',cx:380,cy:310,hit:[334,302,428,320],note:'A river that floods every spring and carries fish to the coast.',
      draw(ctx,col){ctx.strokeStyle=col;ctx.lineWidth=3;[[334,306,428,308],[338,312,424,314],[346,318,420,318]].forEach(([a,b,c2,d])=>{ctx.beginPath();ctx.moveTo(a,b);ctx.bezierCurveTo(a+30,b+5,c2-30,d-5,c2,d);ctx.stroke();});}}],
  town:{name:'the coastal village',water:'res',x:740,y:302,people:'The village hunts caribou and fishes the lagoon, and some families also work in the oil industry.'},
  yearly:[{role:'deer',per:10,label:'Caribou for village families'}],
  injury:0.05,parkName:'refuge',leakWord:'Oil leak',protectHow:'spill-response gear and lined pads',pollCol:'#3a3a32',
  floor:{tree:'#7a7a48',cut:'#a8a08a',sap:'#8a8a5a',pit:'#3a3029',open:{_:'#9a9466'}},
  art:{tree:tundra,deer:(c,x,y,s,f)=>quad(c,x,y,s,f,{c:'#7a6a58',belly:'#e8e0d0',mane:'#ece6da',bw:9,bh:5,leg:9,ny:7,hr:2.8,horns:'antler',face:'#5a4a3a',ear:1.4,tail:1.2,tailc:'#ece6da'}),lynx:polar},
  drawBack(ctx,C){M.skyGrad(ctx,C,'#dde8f0','#f2f6f8','#1c2430','#232a33',300);
    ctx.fillStyle=C.dark?'#3a4250':'#b8c4d0';ctx.beginPath();ctx.moveTo(0,300);ctx.lineTo(0,200);ctx.lineTo(80,170);ctx.lineTo(150,205);ctx.lineTo(230,160);ctx.lineTo(320,214);ctx.lineTo(400,190);ctx.lineTo(480,240);ctx.lineTo(520,300);ctx.fill();
    ctx.fillStyle='#f4f6f8';[[80,170,14],[230,160,16],[400,190,12]].forEach(([a,b,w])=>{ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(a-w,b+13);ctx.lineTo(a+w,b+13);ctx.fill();});
    ctx.fillStyle=C.dark?'#1f3446':'#7aa6c8';ctx.fillRect(690,262,110,40);ctx.fillStyle='#f4f8fb';[[704,268,30,6],[744,274,24,5],[772,266,26,6],[716,282,18,4]].forEach(([a,b,w,h])=>{ctx.beginPath();ctx.ellipse(a+w/2,b,w/2,h/2,0,0,6.29);ctx.fill();});
    M.fillGround(ctx,arSurf,C.dark?'#4a4a38':'#a8a070');M.drawTown(ctx,738,302,0.9);},
  labels:[{t:'Brooks Range',x:230,y:150,a:'center',soft:1},{t:'Beaufort Sea ice',x:745,y:256,a:'center',soft:1},{t:'Village',x:740,y:340,a:'center'},{t:'Braided river',x:380,y:340,a:'center'}],
  cases:[
   {t:'Where the caribou are born',b:'The Arctic Refuge’s coastal plain is the main calving ground of the Porcupine caribou herd, about 200,000 animals that migrate hundreds of miles there each spring.',g:'Caribou herds on the plain feed village families every year if their tundra stays.',src:[['Smithsonian','https://www.smithsonianmag.com/science/gwichin-people-arctic-national-wildlife-refuge-180979001/']]},
   {t:'Two Native peoples, two views',b:'The Gwich’in, who depend on the Porcupine caribou, call the coastal plain “the Sacred Place Where Life Begins” and oppose drilling there. Many Iñupiat in Kaktovik, the village inside the refuge, support careful development for jobs and services. Both groups have lived with this land for thousands of years.',g:'The people layer: who gains jobs and who loses food can be different families.',src:[['Alaska Public Media (2019)','https://alaskapublic.org/2019/07/02/in-arctic-village-gwichin-leaders-say-the-fight-to-stop-drilling-in-the-arctic-refuge-isnt-over/'],['Atmos','https://atmos.earth/inside-the-debate-to-drill-at-the-nations-largest-wildlife-refuge/']]},
   {t:'Polar bears listed (2008)',b:'In May 2008 the U.S. listed the polar bear as threatened, because the sea ice it hunts on is shrinking. Some mother bears dig their winter dens in snowdrifts on the coastal plain.',g:'Bear families need undisturbed tundra near the coast.',src:[['Federal Register (2008)','https://www.govinfo.gov/content/pkg/FR-2008-05-15/pdf/E8-11105.pdf']]},
   {t:'Exxon Valdez (1989) and what changed',b:'In 1989 the tanker Exxon Valdez hit a reef in Prince William Sound and spilled nearly 11 million gallons of Alaska crude oil. Congress then passed the Oil Pollution Act of 1990, which tightened how oil spills are prevented and cleaned up.',g:'Protecting water costs money up front. One spill can cost far more.',src:[['NOAA','https://response.restoration.noaa.gov/exxonvaldez']]}]});
/* ---------- land: coral reef coast (Belize) ---------- */
const rfSurf=[[0,94],[60,104],[110,190],[200,280],[320,292],[380,214],[470,196],[530,262],[630,370],[800,392]];
/* oiled sea water: brown haze above the seabed between x0 and x1, and a dark slick on the surface */
function oilWater(ctx,col,x0,x1){if(col==='#3c7fc0')return;ctx.save();ctx.beginPath();ctx.moveTo(x0,100);rfSurf.forEach(([x,y])=>ctx.lineTo(Math.min(Math.max(x,x0),x1),y));ctx.lineTo(x1,100);ctx.closePath();ctx.clip();
  const g=ctx.createLinearGradient(0,100,0,300);g.addColorStop(0,'rgba(60,45,25,.55)');g.addColorStop(1,'rgba(90,70,40,.25)');ctx.fillStyle=g;ctx.fillRect(x0,100,x1-x0,350);ctx.restore();
  ctx.save();ctx.fillStyle='rgba(25,20,15,.85)';ctx.beginPath();ctx.moveTo(x0,101);for(let x=x0;x<=x1;x+=8)ctx.lineTo(x,104+2.5*Math.sin(x/9));for(let x=x1;x>=x0;x-=8)ctx.lineTo(x,99+1.5*Math.sin(x/7));ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(120,90,160,.35)';for(let x=x0+14;x<x1;x+=34){ctx.beginPath();ctx.ellipse(x,101,8,1.6,0,0,6.29);ctx.fill();}ctx.restore();}
M.addLand({key:'reef',name:'Coral reef coast',place:'Belize Barrier Reef, Central America',icon:'🐠',
  blurb:'Oil under the seabed, coral and sponge reefs, groupers and hawksbill turtles, and a fishing village on the beach.',
  surf:rfSurf,spots:[zone(rfSurf,'Lagoon',128,330,10),zone(rfSurf,'Reef crest',386,520,8),zone(rfSurf,'Fore-reef',540,700,8)],
  start:['tree','deer','tree','lynx','tree','tree','deer','tree','','tree',
         'tree','lynx','tree','deer','tree','lynx','tree','tree',
         'deer','tree','lynx','tree','','deer','tree','lynx'],
  path:[sAtX(rfSurf,120),sAtX(rfSurf,720)],barrier:{after:9,name:'the deep channel',at:[352,240],desc:'A deep channel between the lagoon and the reef that small reef life rarely crosses.'},
  deep:offset(rfSurf,60),regrowYears:12,
  veins:[deepV(220,360,270,354),deepV(300,368,350,372),deepV(420,290,470,284),deepV(540,380,580,392),deepV(650,440,700,446),
    shallow(rfSurf,150,190,20),shallow(rfSurf,240,280,20),shallow(rfSurf,300,330,20),shallow(rfSurf,400,440,20),shallow(rfSurf,480,515,20),shallow(rfSurf,560,595,20),shallow(rfSurf,640,680,18)],
  res:{one:'offshore oil block',many:'offshore oil blocks',verb:'Drill',what:'oil',col:['#151515','#3c342c','#9a8a70'],
    deepHow:'Deep oil can be reached by directional drilling from a distant platform, so the reef above stays as it is.',shallowHow:'Shallow oil needs a platform and pipeline right here, which crush the reef.'},
  sp:{tree:{one:'coral and sponge patch',many:'coral and sponge patches',short:'Coral',icon:'🪸',verbRow:'Dredge a coral patch for sand and lime',harvest:'Dredge',status:'Takes many years to regrow'},
      deer:{one:'grouper school',many:'grouper schools',short:'Groupers',icon:'🐟',verbRow:'Fish out a grouper school',status:'Fished for food and sale'},
      lynx:{one:'hawksbill turtle',many:'hawksbill turtles',short:'Hawksbills',icon:'🐢',status:'Critically endangered (IUCN)',needs:'coral and sponge patches',
        protectedMsg:'Hawksbill turtles are critically endangered and protected, so they are worth $0 to catch.'}},
  water:[{k:'res',name:'Lagoon',short:'lagoon',cx:200,cy:200,hit:[100,140,330,290],note:'The fishing village fishes this lagoon and swims in it.',
      draw(ctx,col){oilWater(ctx,col,90,345);}},
    {k:'creek',name:'Reef crest',short:'reef',cx:450,cy:180,hit:[370,150,530,250],note:'The living reef that draws divers and shelters young fish.',
      draw(ctx,col){oilWater(ctx,col,360,540);}}],
  town:{name:'the fishing village',water:'res',x:30,y:94,people:'The fishing village eats from the lagoon and earns from divers who come for the reef.'},
  yearly:[{role:'deer',per:10,label:'Sustainable fishing (groupers)'}],
  shock:{p:0.06,frac:0.4,text:'Marine heat wave bleached the coral'},
  injury:0.04,parkName:'marine reserve',visitWord:'Divers and snorkelers',leakWord:'Oil leak',protectHow:'spill booms, a response boat and a spill plan ready before drilling',
  spillParts:[['Oil spill: clean-up crews, booms and skimmers',0.5],['Oil spill: claims from fishers and dive shops',0.3],['Oil spill: restoring coral and seagrass',0.2]],
  blowout:{p:0.06,safeK:0.2,cost:5000,kill:3,parts:[['Blowout: cap the well and drill a relief well',0.3],['Blowout: clean-up at sea and on the beaches',0.3],['Blowout: fines and damage claims',0.25],['Blowout: restoring the reef and seagrass',0.15]]},
  safetyCost:250,safetyLabel:'Worker and well safety',safetyHow:'a tested blowout preventer, inspections and crew training',
  pollutionHurts:{harvestWater:'res',harvestText:'Fishing closed: the lagoon is oiled',visitors:0.5,visitorsWater:'creek',visitorsText:'Divers stayed away from the oiled reef'},
  artK:1,pollCol:'#6b5a3a',
  floor:{tree:'#c08a5a',cut:'#e6e0d0',sap:'#d8a888',pit:'#3a3029',open:{_:'#e2d2a2'}},
  art:{tree:coral,cut:bleached,sap:(c,x,y,s,age)=>{bleached(c,x-4,y,s*0.8);coral(c,x+4,y,s*Math.min(1,0.3+age/14));},deer:grouper,lynx:hawksbill},
  flip:(p,i)=>i%2===0,
  drawBack(ctx,C){M.skyGrad(ctx,C,'#bfe3f2','#e6f4f8','#18262f','#1f2e36',100);
    const g=ctx.createLinearGradient(0,100,0,H);g.addColorStop(0,C.dark?'#123a52':'#5aa6cf');g.addColorStop(1,C.dark?'#0b2234':'#1e5f8a');ctx.fillStyle=g;ctx.fillRect(0,100,W,H-100);
    ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;ctx.beginPath();for(let x=60;x<=800;x+=10)ctx.lineTo(x,100+2*Math.sin(x/12));ctx.stroke();
    M.fillGround(ctx,rfSurf,C.dark?'#7a6a48':'#e2d2a2');ctx.fillStyle=C.dark?'#6a5a3a':'#efe2b8';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,94);ctx.lineTo(60,104);ctx.lineTo(60,100);ctx.lineTo(0,90);ctx.fill();
    ctx.fillStyle=C.dark?'#9a8a60':'#f3e6c0';ctx.fillRect(0,86,62,10);M.drawTown(ctx,32,88,0.9);[[56,88]].forEach(([a,b])=>palm(ctx,a,b,0.8,false));},
  labels:[{t:'Lagoon',x:200,y:130,a:'center'},{t:'Reef crest',x:450,y:130,a:'center'},{t:'Fishing village',x:6,y:120,soft:1},{t:'Deep channel',x:322,y:232,a:'center',soft:1}],
  cases:[
   {t:'A country bans offshore oil (2017)',b:'In December 2017 Belize passed a law stopping oil exploration in all of its waters, one of the first countries in the world to do so. Belizeans pushed for it after seismic testing near the reef was approved in 2016.',g:'Choosing not to drill is also a choice, with a cost and a payoff.',src:[['UNESCO decision (2018)','https://whc.unesco.org/en/soc/3807'],['Oceana (2018)','https://oceana.org/blog/ceo-note-oceanas-victory-protecting-belize-barrier-reef-spurs-un-action/']]},
   {t:'Off the danger list (2018)',b:'UNESCO had listed the Belize Barrier Reef as a World Heritage site in danger in 2009, over oil, mangrove clearing and land sales. In June 2018, after the oil ban and new mangrove rules, it was taken off the danger list.',g:'A marine reserve protects the reef and pays from divers every year.',src:[['UNESCO (2018)','https://whc.unesco.org/en/news/1839']]},
   {t:'Deepwater Horizon blowout, Gulf of Mexico (2010)',b:'A deep-sea well blew out and exploded the Deepwater Horizon rig, killing 11 workers. Oil flowed for 87 days, about 210 million gallons, and reached thousands of miles of shoreline. The Gulf fishing industry lost an estimated $1 billion. BP later put its total cost at $61.6 billion, including a $20.8 billion settlement to restore the Gulf’s economy and environment.',g:'A blowout is rare but huge: it costs far more than a spill, oils both waters, and closes fishing and diving for years. Well safety costs more up front and makes it rare.',src:[['Maritime Executive (2023)','https://www.maritime-executive.com/article/13-years-later-the-deepwater-horizon-spill'],['NGI (2016)','https://www.naturalgasintel.com/?p=106616']]},
   {t:'The turtle that eats sponges',b:'Hawksbill turtles are critically endangered. They feed mostly on reef sponges, which helps keep the reef in balance, and they were hunted for decades for their “tortoiseshell.”',g:'Each hawksbill needs coral and sponge patches around it.',src:[['Sea Turtle Status','https://www.seaturtlestatus.org/hawksbill'],['Ocean Conservancy','https://oceanconservancy.org/wildlife-factsheet/hawksbill-sea-turtle']]}]});
/* ---------- land: Congo forest hills (South Kivu) ---------- */
const cgSurf=[[0,330],[90,320],[230,150],[330,250],[440,130],[600,320],[800,330]];
M.addLand({key:'congo',name:'Congo forest hills',place:'South Kivu, eastern Democratic Republic of the Congo',icon:'📱',
  blurb:'Coltan for phone parts under forested hills, Grauer’s gorillas, duikers, and a mining village where people dig by hand.',
  surf:cgSurf,spots:[zone(cgSurf,'West hill',96,322,11),zone(cgSurf,'East hill',340,594,13),zone(cgSurf,'Valley',610,672,4)],
  start:['deer','tree','tree','lynx','tree','tree','deer','tree','lynx','tree','',
         'tree','deer','tree','tree','lynx','tree','tree','deer','tree','lynx','tree','','tree',
         'deer','tree','lynx','tree'],
  path:[sAtX(cgSurf,90),sAtX(cgSurf,690)],barrier:{after:10,name:'the valley road',at:[330,244],desc:'A busy road through the valley, with mining camps along it, separates the two hills.'},
  deep:offset(cgSurf,62),deepMaxY:440,
  veins:[deepB(cgSurf,190,230,92),deepB(cgSurf,250,290,92),deepB(cgSurf,420,460,92),deepB(cgSurf,470,510,92),deepB(cgSurf,360,400,92),
    shallow(cgSurf,110,140,22),shallow(cgSurf,180,214,22),shallow(cgSurf,270,310,22),shallow(cgSurf,360,400,22),shallow(cgSurf,470,510,22),shallow(cgSurf,540,580,22),shallow(cgSurf,620,660,20)],
  res:{one:'coltan deposit',many:'coltan deposits',verb:'Dig',what:'coltan',col:['#2b2b2e','#6f6f78','#cfd3da'],
    deepHow:'Deep deposits are dug by tunnel, so the forest above stays.',shallowHow:'Shallow deposits are dug as open pits by hand, which clears the forest.'},
  sp:{tree:{one:'rainforest stand',many:'rainforest stands',short:'Forest',icon:'🌳',verbRow:'Cut a forest stand for timber and charcoal',harvest:'Cut',status:'Old forest regrows slowly'},
      deer:{one:'duiker herd',many:'duiker herds',short:'Duikers',icon:'🦌',verbRow:'Hunt a duiker herd for bushmeat',status:'Hunted for bushmeat'},
      lynx:{one:'Grauer’s gorilla family',many:'Grauer’s gorilla families',short:'Gorillas',icon:'🦍',status:'Critically endangered (IUCN)',needs:'rainforest stands',scale:1.25,
        protectedMsg:'Grauer’s gorillas are critically endangered and protected, so they are worth $0 to hunt.'}},
  water:[{k:'res',name:'Village stream',short:'stream',cx:730,cy:334,hit:[680,324,790,344],note:'The mining village drinks and washes ore in this stream.',
      draw(ctx,col){ctx.strokeStyle=col;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(680,334);ctx.bezierCurveTo(710,342,750,328,790,336);ctx.stroke();}},
    {k:'creek',name:'Forest river',short:'river',cx:46,cy:336,hit:[6,326,88,346],note:'A river that carries water to farms downstream.',
      draw(ctx,col){ctx.strokeStyle=col;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(6,334);ctx.bezierCurveTo(30,342,60,328,88,338);ctx.stroke();}}],
  town:{name:'the mining village',water:'res',x:730,y:330,people:'Families in the mining village dig, carry and wash ore by hand, and drink from the stream.'},
  yearly:[{role:'deer',per:10,label:'Hunting (duikers)'}],
  injury:0.3,parkName:'national park',leakWord:'Silt and metals from old pits',protectHow:'settling ponds below the pits',pollCol:'#9a6a3a',
  floor:{tree:'#1f4a28',cut:'#9a6a42',sap:'#5a8a3a',pit:'#4a3022',open:{_:'#3f6a35'}},
  art:{tree:(c,x,y,s)=>roundTree(c,x,y,s*1.15,'#1f5228','#2f7034'),deer:(c,x,y,s,f)=>quad(c,x,y,s*0.85,f,{c:'#8a5a34',bw:7.5,bh:4.4,leg:7,ny:5,hr:2.3,horns:'spike',ear:1.4,tail:1.2}),lynx:gorilla},
  drawBack(ctx,C){M.skyGrad(ctx,C,'#d2dccf','#eef2ec','#1c2420','#232a26',320);
    ctx.fillStyle=C.dark?'#20321f':'#7aa07a';ctx.beginPath();ctx.moveTo(0,330);ctx.lineTo(0,220);ctx.quadraticCurveTo(120,150,250,210);ctx.quadraticCurveTo(400,120,560,200);ctx.quadraticCurveTo(700,150,800,210);ctx.lineTo(800,330);ctx.fill();
    M.fillGround(ctx,cgSurf,C.dark?'#5a3a28':'#9a5a3a');M.drawTown(ctx,728,328,1);},
  drawBarrier(ctx,C){ctx.save();ctx.strokeStyle='#a87a50';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(318,246);ctx.lineTo(342,246);ctx.stroke();ctx.restore();},
  labels:[{t:'Mining village',x:796,y:360,a:'right'},{t:'River',x:46,y:360,a:'center'},{t:'Valley road',x:330,y:270,a:'center',soft:1}],
  cases:[
   {t:'Gorillas and phone metals',b:'Grauer’s gorilla, the world’s largest gorilla, lives only in eastern Congo. A 2016 survey found its numbers had dropped about 77% since the mid-1990s. Mining for coltan and other minerals, often run by armed groups, and hunting around the mining camps were major causes.',g:'Each gorilla family needs forest around it, and pits cut the forest apart.',src:[['WCS (2016)','https://newsroom.wcs.org/News-Releases/articleType/ArticleView/articleId/8675/New-Report-Documents-Shocking-Collapse-of-Gorilla-Subspecies-During-20-Years-of-Civil-Unrest.aspx'],['Mongabay (2016)','https://news.mongabay.com/2016/04/new-report-finds-the-worlds-largest-ape-is-critically-endangered/']]},
   {t:'Strongholds that held',b:'A 2021 count found 3,815 Grauer’s gorillas in Kahuzi-Biega National Park and the neighboring Oku community forests, almost 60% of all that remain, and numbers there had stayed fairly stable for 20 years.',g:'A protected park and community forests are the gorilla’s best chance.',src:[['WCS via EurekAlert (2021)','https://www.eurekalert.org/news-releases/651746']]},
   {t:'Cobalt for batteries, and child miners',b:'More than half the world’s cobalt, used in phone and electric-car batteries, comes from Congo. In 2014 UNICEF estimated about 40,000 children worked in mines in southern Congo. The share of cobalt dug by hand has since fallen, and Congo pledged in 2021 to end child labor in mining by 2025.',g:'The people layer: cheap digging without worker safety hurts workers.',src:[['Amnesty International','https://www.amnesty.org/en/latest/campaigns/2016/06/DRC-Cobalt-child-labour/'],['Study of artisanal cobalt (2023)','https://pmc.ncbi.nlm.nih.gov/articles/PMC10293843']]},
   {t:'Tracing the metals in your phone',b:'A 2010 U.S. law (Section 1502 of the Dodd-Frank Act) led the SEC, in 2012, to require many companies to report whether the tin, tantalum (from coltan), tungsten and gold in their products came from Congo or its neighbors. A 2024 government review found the rule had not reduced violence in Congo, so people still argue about what works.',g:'Paying for full worker safety costs more per deposit. Good intentions still need checking.',src:[['U.S. SEC (2012)','https://sec.gov/news/press/2012/2012-163.htm'],['U.S. GAO (2024)','https://gao.gov/assets/880/874494.pdf']]}]});
/* ---------- land: sulfur volcano (Ijen, Java) ---------- */
const ijSurf=[[0,340],[150,330],[320,112],[362,118],[384,196],[476,196],[500,118],[540,110],[690,330],[800,340]];
M.addLand({key:'ijen',name:'Sulfur volcano',place:'Ijen volcano, East Java, Indonesia',icon:'🌋',
  blurb:'Sulfur dug by hand from an active crater, the world’s largest acid lake, coffee and forest on the slopes, and blue-fire tourists.',
  surf:ijSurf,spots:[zone(ijSurf,'Foothills',10,145,6),zone(ijSurf,'West slope',160,312,8),zone(ijSurf,'East slope',548,684,8),zone(ijSurf,'Lowland',700,790,5)],
  start:['tree','deer','tree','','tree','deer',
         'tree','lynx','tree','tree','lynx','tree','deer','tree',
         'tree','lynx','tree','deer','tree','tree','lynx','tree',
         'tree','deer','lynx','tree',''],
  path:[0,sAtX(ijSurf,800)],barrier:{after:13,name:'the crater',at:[430,150],arc:[320,112,430,60,540,110],desc:'The crater, full of acid gas, splits the forest on the two slopes.'},
  deep:[[150,400],[320,190],[384,250],[476,250],[540,190],[690,400]],
  veins:[deepV(300,250,340,240),deepV(400,262,440,268),deepV(520,240,560,252),deepV(250,320,300,300),deepV(560,310,610,330),
    shallow(ijSurf,392,420,16),shallow(ijSurf,440,470,16),shallow(ijSurf,180,210,20),shallow(ijSurf,250,280,20),shallow(ijSurf,580,610,20),shallow(ijSurf,640,670,20),shallow(ijSurf,60,100,20)],
  res:{one:'sulfur deposit',many:'sulfur deposits',verb:'Mine',what:'sulfur',col:['#8a7a10','#f2d82b','#fffbd0'],
    deepHow:'Deep sulfur is collected through ceramic pipes from the vents, so the slope above stays as it is.',shallowHow:'Shallow sulfur is broken out by hand and carried, which clears what grows above it.'},
  sp:{tree:{one:'forest and coffee plot',many:'forest and coffee plots',short:'Forest',icon:'🌳',verbRow:'Clear a forest plot for a coffee farm',harvest:'Clear for coffee',status:'Mountain forest'},
      deer:{one:'wild boar group',many:'wild boar groups',short:'Boar',icon:'🐗',verbRow:'Hunt a wild boar group',status:'Common'},
      lynx:{one:'Javan lutung troop',many:'Javan lutung troops',short:'Lutungs',icon:'🐒',status:'Found only on Java and nearby islands',needs:'forest plots',
        protectedMsg:'Javan lutungs are protected leaf monkeys, so they are worth $0 to hunt.'}},
  water:[{k:'res',name:'Village stream',short:'stream',cx:110,cy:344,hit:[60,334,160,354],note:'The village below irrigates rice and coffee with this stream.',
      draw(ctx,col){ctx.strokeStyle=col;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(60,344);ctx.bezierCurveTo(90,352,130,336,160,346);ctx.stroke();}},
    {k:'creek',name:'Acid crater lake',short:'crater lake',cx:430,cy:190,hit:[384,176,476,200],note:'The largest acid lake on Earth, about as acidic as battery acid.',col:'#5ec8c0',
      draw(ctx,col){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(384,178);ctx.lineTo(476,178);ctx.lineTo(470,196);ctx.lineTo(390,196);ctx.closePath();ctx.fill();}}],
  town:{name:'the village below',water:'res',x:40,y:338,people:'Most sulfur miners live in the village below and walk up each night.'},
  yearly:[{role:'deer',per:10,label:'Hunting (wild boar)'},{role:'tree',per:5,label:'Coffee from shaded forest plots',x:250,y:200}],
  injury:0.35,parkName:'nature park',visitWord:'Blue-fire tourists',leakWord:'Acid water release',protectHow:'diversion channels and liming',pollCol:'#a8b83a',
  floor:{tree:'#2f5d33',cut:'#8a6a48',sap:'#6a9a4a',pit:'#4a3a22',open:{_:'#6a7a4a'}},
  art:{tree:coffee,deer:(c,x,y,s,f)=>quad(c,x,y,s,f,{c:'#4a3a30',dk:'#2a201a',bw:8.5,bh:5,leg:6.5,nx:1,ny:1,hr:2.8,noNeck:true,tusk:true,ear:1.4,tail:1,mane:'#2a201a'}),lynx:lutung},
  drawBack(ctx,C){M.skyGrad(ctx,C,'#d8dde6','#eef0f4','#1c2028','#24262e',330);
    M.fillGround(ctx,ijSurf,C.dark?'#4a4438':'#7a7262');poly(ctx,[[320,112],[362,118],[384,196],[476,196],[500,118],[540,110],[520,150],[476,206],[384,206],[340,150]],C.dark?'#5a5240':'#9a8e70');
    ctx.fillStyle='rgba(240,240,230,.55)';[[420,150,26],[452,128,18],[438,104,14]].forEach(([a,b,r])=>{ctx.beginPath();ctx.arc(a,b,r,0,6.29);ctx.fill();});
    ctx.fillStyle='#f2d82b';[[392,190],[468,188]].forEach(([a,b])=>{ctx.beginPath();ctx.arc(a,b,5,0,6.29);ctx.fill();});
    M.drawTown(ctx,40,336,1);},
  labels:[{t:'Acid crater lake',x:430,y:226,a:'center'},{t:'Village',x:40,y:362,a:'center'},{t:'Crater',x:430,y:68,a:'center',soft:1}],
  cases:[
   {t:'Carried up by hand',b:'At Ijen, miners break off sulfur near the crater’s gas vents and carry 60 to 90 kilograms at a time up about 200 meters to the crater rim, then down the mountain, for a few dollars a day. Many cannot afford gas masks.',g:'Mining without full worker safety often hurts workers here.',src:[['The Globe and Mail','https://www.theglobeandmail.com/life/travel/destinations/an-eerily-beautiful-landscape-where-miners-brave-the-elements/article26392493/'],['Business Insider','https://businessinsider.in/international/news/why-miners-in-indonesia-risk-their-lives-to-get-sulfur-from-inside-an-active-volcano/slidelist/96629272.cms']]},
   {t:'The largest acid lake on Earth',b:'Ijen’s turquoise crater lake is about 1 kilometer wide and 200 meters deep, with a pH around 0.5, about as acidic as battery acid.',g:'Acid water that escapes harms the stream the village farms with.',src:[['Geology.com','https://geology.com/volcanoes/kawah-ijen']]},
   {t:'Blue fire and tourists',b:'Burning sulfur gas makes electric-blue flames at night, which draws crowds of tourists. Some critics call watching the miners work “poverty tourism.” Others say tourism brings new jobs and income.',g:'A nature park earns from visitors every year.',src:[['GoNOMAD','https://www.gonomad.com/?p=164988']]},
   {t:'A UNESCO Global Geopark (2023)',b:'In 2023 the Ijen area was named a UNESCO Global Geopark, which local leaders hope will bring more visitors and jobs to Banyuwangi.',g:'Protecting the volcano can pay people every year.',src:[['Antara News (2023)','https://en.antaranews.com/news/282945/ijen-geopark-gets-unesco-global-geopark-status']]}]});
/* ---------- land: rare-earth desert (Mountain Pass, California) ---------- */
const reSurf=[[0,320],[120,316],[200,250],[300,150],[380,170],[460,140],[560,250],[640,318],[800,322]];
M.addLand({key:'rareearth',name:'Rare-earth desert',place:'Mojave Desert near Mountain Pass, California',icon:'🧲',
  blurb:'Rare-earth ore for phone and car magnets in a desert range, desert tortoises and bighorn sheep, and a dry lake below.',
  surf:reSurf,spots:[zone(reSurf,'West fan',14,192,8),zone(reSurf,'Range',208,552,14),zone(reSurf,'East fan',566,638,4),zone(reSurf,'Lake edge',652,790,6)],
  start:['tree','lynx','tree','deer','tree','tree','lynx','',
         'tree','deer','tree','tree','lynx','tree','deer','tree','tree','lynx','tree','deer','tree','',
         'tree','tree','deer','',
         'tree','lynx','tree','','tree','deer'],
  path:[0,sAtX(reSurf,800)],barrier:{after:25,name:'Interstate 15',at:[646,314],desc:'The interstate cuts the desert in two; tortoises and sheep that try to cross it are often killed.'},
  deep:offset(reSurf,64),
  veins:[deepV(270,250,310,240),deepV(350,260,390,250),deepV(420,236,460,226),deepV(320,310,370,320),deepV(480,300,520,310),
    shallow(reSurf,40,80,22),shallow(reSurf,140,180,22),shallow(reSurf,230,262,22),shallow(reSurf,330,370,22),shallow(reSurf,490,520,22),shallow(reSurf,580,620,22),shallow(reSurf,690,730,20)],
  res:{one:'rare-earth ore body',many:'rare-earth ore bodies',verb:'Mine',what:'rare-earth ore',col:['#5a2e1e','#b5653a','#f0c0a0'],
    deepHow:'Deep ore is reached by tunnel, so the desert above stays as it is.',shallowHow:'Shallow ore is dug as an open pit, which clears the desert above it.'},
  sp:{tree:{one:'Joshua tree and creosote patch',many:'Joshua tree and creosote patches',short:'Desert plants',icon:'🌵',verbRow:'Clear a desert patch for solar panels or a road',harvest:'Clear',status:'Desert plants regrow very slowly'},
      deer:{one:'bighorn sheep band',many:'bighorn sheep bands',short:'Bighorn',icon:'🐏',verbRow:'Sell a bighorn hunt',status:'Hunted with rare licenses'},
      lynx:{one:'desert tortoise',many:'desert tortoises',short:'Tortoises',icon:'🐢',status:'Threatened (federal list since 1990); endangered in California since 2024',needs:'desert plant patches',scale:1.15,
        protectedMsg:'Desert tortoises are a threatened species, so they are worth $0 to collect.'}},
  water:[{k:'res',name:'Town wells',short:'town wells',cx:60,cy:330,hit:[20,320,110,344],note:'The desert town pumps its drinking water from groundwater here.',
      draw(ctx,col){ctx.fillStyle=col;ctx.fillRect(40,326,40,8);ctx.fillStyle='#6a6a70';ctx.fillRect(56,312,4,14);}},
    {k:'creek',name:'Dry lake',short:'dry lake',cx:720,cy:330,hit:[660,320,790,344],note:'A dry lake bed where the mine once piped its wastewater to ponds.',col:'#d8d0b8',
      draw(ctx,col){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(724,330,66,10,0,0,6.29);ctx.fill();}}],
  town:{name:'the desert town',water:'res',x:60,y:316,people:'The small desert town drinks groundwater pumped near the mine.'},
  yearly:[{role:'deer',per:10,label:'Hunting licenses (bighorn)'}],
  injury:0.05,parkName:'preserve',leakWord:'Wastewater leak',protectHow:'lined ponds and a leak-checked pipeline',pollCol:'#9a7a3a',
  floor:{tree:'#8a8a4a',cut:'#c8b088',sap:'#a8a060',pit:'#4a3022',open:{_:'#d0b888'}},
  art:{tree:joshua,deer:(c,x,y,s,f)=>quad(c,x,y,s,f,{c:'#a88a68',belly:'#f0e8d8',rump:'#f0e8d8',bw:8.5,bh:5,leg:8,ny:6,hr:2.7,horns:'curl',ear:1.3,tail:1}),lynx:tortoise},
  drawBack(ctx,C){M.skyGrad(ctx,C,'#f2e2c8','#faf2e4','#28221e','#2e2822',320);
    ctx.fillStyle=C.dark?'#3a3228':'#d8b896';ctx.beginPath();ctx.moveTo(0,320);ctx.lineTo(0,230);ctx.lineTo(80,200);ctx.lineTo(160,236);ctx.lineTo(600,236);ctx.lineTo(700,196);ctx.lineTo(800,226);ctx.lineTo(800,320);ctx.fill();
    M.fillGround(ctx,reSurf,C.dark?'#6a4a34':'#c8946a');ctx.fillStyle=C.dark?'rgba(0,0,0,.15)':'rgba(120,60,30,.15)';for(let k=0;k<5;k++)ctx.fillRect(250+k*24,180+k*24,180-k*30,3);M.drawTown(ctx,62,316,0.9);},
  drawBarrier(ctx,C){road(ctx,646,316,'',C);},
  labels:[{t:'Dry lake',x:724,y:364,a:'center'},{t:'Town',x:60,y:362,a:'center'},{t:'I-15',x:646,y:304,a:'center',soft:1}],
  cases:[
   {t:'America’s only rare-earth mine',b:'Mountain Pass, in California’s Mojave Desert, is the only rare-earth mine in the United States. Rare earths are the building blocks of magnets in phones, wind turbines and electric cars.',g:'The ore is worth a lot. Where and how you dig is the question.',src:[['Science News','https://www.sciencenews.org/article/rare-earth-mining-renewable-energy-future']]},
   {t:'Spills that shut it down (2002)',b:'The mine sent wastewater through a buried pipeline to ponds near the Ivanpah dry lake. A series of toxic waste spills halted production in 2002. The mine later reopened under new owners.',g:'Unprotected water near the mine can leak for years.',src:[['Science News','https://sciencenews.org/?p=3120759']]},
   {t:'Who makes the magnets',b:'The International Energy Agency reports that China mines about 60% of magnet rare earths, refines more than 90% of them, and made about 94% of rare-earth permanent magnets in 2024.',g:'One mine can matter for a whole country’s supply.',src:[['IEA','https://www.iea.org/news/new-projects-partnerships-and-policies-are-needed-to-address-supply-chain-risks-for-rare-earth-elements']]},
   {t:'The desert tortoise',b:'The Mojave desert tortoise was listed as threatened under the U.S. Endangered Species Act in 1990, and California listed it as endangered in 2024 as its numbers kept falling.',g:'Each tortoise needs desert plant patches around it.',src:[['U.S. Fish and Wildlife Service (1990)','https://www.fws.gov/sites/default/files/documents/historic-news-releases/1990/19900328.pdf'],['Phys.org (2024)','https://phys.org/news/2024-04-mojave-tortoise-california-endangered.html']]}]});
})();
