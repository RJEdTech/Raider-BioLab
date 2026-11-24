/* Who-kit (Nov 24, 2026): the shared pieces of every "Who is doing this" step on the story pages, so each one looks the same:
   an icon timeline panel, picture cards the student taps to predict, and a picture rhyme box ("earlier picture = this picture").
   Pictures first, few words (Jason: "I don't want words. I want images."). Needs the story kit (Story.h). Same file in every lab. */
(function(){
'use strict';
const {rr,txt}=Story.h,INK='#26262b',SOFT='#62626a';
/* the right-hand panel: a title, then rows of [emoji, 2-4 words], then sources in small print */
function panel(ctx,title,rows,src){const x=900;ctx.fillStyle='#fff';ctx.strokeStyle='#d5d9de';ctx.lineWidth=1;rr(ctx,x,24,280,552,12);ctx.fill();ctx.stroke();
  txt(ctx,title,x+18,58,{s:17,w:700,c:INK});const gap=Math.min(62,400/Math.max(1,rows.length));
  rows.forEach(([i,t],k)=>{const y=100+k*gap;txt(ctx,i,x+36,y,{s:24,a:'center'});txt(ctx,t,x+64,y-4,{s:14,w:600,c:INK});});
  (src||[]).forEach((s,k)=>txt(ctx,s,x+18,540+k*16,{s:12,c:SOFT}));}
/* picture cards: cards = [{v,x,y,w,h,draw(ctx,cx,cy)}]; the picked one is highlighted; a pulsing finger shows until one is picked */
function cards(ctx,S,list,picked){list.forEach(c=>{rr(ctx,c.x,c.y,c.w||120,c.h||118,14);ctx.fillStyle=picked===c.v?'#fff3c4':'#fff';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=INK;ctx.stroke();
    c.draw(ctx,c.x+(c.w||120)/2,c.y+(c.h||118)/2);});
  if(picked==null){const last=list[list.length-1];ctx.save();ctx.globalAlpha=.55+.45*Math.sin(S.t*4);txt(ctx,'👆',last.x+(last.w||120)-10,last.y+(last.h||118)+36,{s:30,a:'center'});ctx.restore();}}
function hit(list,x,y){for(const c of list)if(x>c.x&&x<c.x+(c.w||120)&&y>c.y&&y<c.y+(c.h||118))return c.v;return null;}
/* the rhyme box: left picture = right picture */
function rhyme(ctx,x,y,w,h,left,right){ctx.save();rr(ctx,x,y,w,h,12);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#d5d9de';ctx.stroke();
  const q=(w-60)/2;ctx.save();ctx.beginPath();ctx.rect(x,y,q,h);ctx.clip();left(ctx,x,y,q,h);ctx.restore();
  txt(ctx,'=',x+w/2,y+h/2+14,{s:38,w:700,c:INK,a:'center'});
  ctx.save();ctx.beginPath();ctx.rect(x+w-q,y,q,h);ctx.clip();right(ctx,x+w-q,y,q,h);ctx.restore();ctx.restore();}
window.Who={panel,cards,hit,rhyme};
})();
