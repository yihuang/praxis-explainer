
(function(){
'use strict';
/* ============================================================
   0. 基础工具
   ============================================================ */
var INK='#e9edf5', DIM='#8e97ab', FAINT='#39435a',
    BLUE='#58C4DD', GOLD='#F0AC5F', GREEN='#83C167', RED='#FC6255',
    PURPLE='#B189E8', TEAL='#5CD0B3', PANEL='#0f1520';
var FONT=__FONT__;
var MONOT='ui-monospace,"SF Mono",Menlo,Consolas,monospace';
var DPR=Math.min(window.devicePixelRatio||1,2);
var W0=1000, H0=560;

function clamp(v,a,b){a=(a===undefined)?0:a;b=(b===undefined)?1:b;return v<a?a:(v>b?b:v);}
function smooth(x){x=clamp(x);return x*x*(3-2*x);}
function seg(t,a,b){ if(b===a) return t>=b?1:0; return smooth((t-a)/(b-a)); }
function lerp(a,b,u){return a+(b-a)*u;}
function mixHex(h1,h2,u){ /* u: 0 -> h1, 1 -> h2 */
  function p(h){h=h.replace('#','');return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)];}
  var a=p(h1),b=p(h2);
  return 'rgb('+Math.round(lerp(a[0],b[0],u))+','+Math.round(lerp(a[1],b[1],u))+','+Math.round(lerp(a[2],b[2],u))+')';
}

/* 圆角矩形路径 */
function rr(ctx,x,y,w,h,r){
  r=Math.min(r,Math.abs(w)/2,Math.abs(h)/2);
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
/* 文本 */
function T(ctx,s,x,y,o){
  o=o||{};
  var size=o.size||20, color=o.color||INK, align=o.align||'left', base=o.base||'middle',
      alpha=o.alpha===undefined?1:o.alpha, w=o.w||400, mono=o.mono, italic=o.italic, ls=o.ls;
  if(alpha<=0.002) return;
  ctx.save();
  ctx.globalAlpha*=clamp(alpha);
  ctx.fillStyle=color;
  ctx.textAlign=align; ctx.textBaseline=base;
  ctx.font=(italic?'italic ':'')+w+' '+size+'px '+(mono?MONOT:FONT);
  if(ls!==undefined&&ctx.letterSpacing!==undefined){ctx.letterSpacing=ls+'px';}
  ctx.fillText(s,x,y);
  ctx.restore();
}
/* 矩形 */
function R(ctx,x,y,w,h,r,o){
  o=o||{};
  var fill=o.fill, stroke=o.stroke, lw=o.lw||1, alpha=o.alpha===undefined?1:o.alpha,
      glow=o.glow||0, gc=o.gc, dash=o.dash;
  if(alpha<=0.002) return;
  ctx.save();
  ctx.globalAlpha*=clamp(alpha);
  if(glow&&gc){ctx.shadowBlur=glow;ctx.shadowColor=gc;}
  if(fill){ctx.fillStyle=fill;}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;}
  if(dash){ctx.setLineDash(dash);}
  rr(ctx,x,y,w,h,r===undefined?0:r);
  if(fill)ctx.fill();
  if(stroke)ctx.stroke();
  ctx.restore();
}
/* 直线 */
function L(ctx,x1,y1,x2,y2,o){
  o=o||{};
  var color=o.color||FAINT, lw=o.lw||1.5, alpha=o.alpha===undefined?1:o.alpha, dash=o.dash,
      glow=o.glow||0, gc=o.gc;
  if(alpha<=0.002) return;
  ctx.save();
  ctx.globalAlpha*=clamp(alpha);
  ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.lineCap=o.cap||'round';
  if(dash)ctx.setLineDash(dash);
  if(glow&&gc){ctx.shadowBlur=glow;ctx.shadowColor=gc;}
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.restore();
}
/* 箭头 */
function A(ctx,x1,y1,x2,y2,o){
  o=o||{};
  var color=o.color||DIM, lw=o.lw||1.6, alpha=o.alpha===undefined?1:o.alpha, head=o.head||9;
  if(alpha<=0.002) return;
  var ang=Math.atan2(y2-y1,x2-x1);
  var ex=x2-Math.cos(ang)*head*0.9, ey=y2-Math.sin(ang)*head*0.9;
  ctx.save();
  ctx.globalAlpha*=clamp(alpha);
  ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=lw; ctx.lineCap='round';
  if(o.glow){ctx.shadowBlur=o.glow;ctx.shadowColor=color;}
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(ex,ey); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2,y2);
  ctx.lineTo(x2-Math.cos(ang-0.42)*head, y2-Math.sin(ang-0.42)*head);
  ctx.lineTo(x2-Math.cos(ang+0.42)*head, y2-Math.sin(ang+0.42)*head);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
/* 圆点 */
function D(ctx,x,y,r,color,o){
  o=o||{};
  var alpha=o.alpha===undefined?1:o.alpha;
  if(alpha<=0.002) return;
  ctx.save();
  ctx.globalAlpha*=clamp(alpha);
  if(o.glow){ctx.shadowBlur=o.glow;ctx.shadowColor=color;}
  ctx.fillStyle=color;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  ctx.restore();
}
function ring(ctx,x,y,r,color,o){
  o=o||{};
  var alpha=o.alpha===undefined?1:o.alpha, lw=o.lw||1.5;
  if(alpha<=0.002) return;
  ctx.save();
  ctx.globalAlpha*=clamp(alpha);
  ctx.strokeStyle=color; ctx.lineWidth=lw;
  if(o.glow){ctx.shadowBlur=o.glow;ctx.shadowColor=color;}
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
  ctx.restore();
}
/* 网格：call fn(i,j) -> {fill,stroke,txt,tc,alpha} */
function G(ctx,x,y,n,cw,ch,gap,alpha,fn){
  for(var i=0;i<n;i++){
    for(var j=0;j<n;j++){
      var c=fn(i,j)||{};
      var a=(c.alpha===undefined?1:c.alpha)*alpha;
      R(ctx,x+j*(cw+gap),y+i*(ch+gap),cw,ch,4,
        {fill:c.fill,stroke:c.stroke,lw:c.lw||1,alpha:a,glow:c.glow,gc:c.gc});
      if(c.txt!==undefined&&c.txt!==null){
        T(ctx,c.txt, x+j*(cw+gap)+cw/2, y+i*(ch+gap)+ch/2+0.5,
          {size:c.ts||14,color:c.tc||INK,align:'center',alpha:a,mono:true,w:c.tw||400});
      }
    }
  }
}
/* 上标数字（base 与 exp 分开绘制，避免等宽字体缺字形） */
function Tpow(ctx,base,exp,x,y,o){
  o=o||{};
  var size=o.size||13, color=o.color||INK, align=o.align||'left',
      alpha=o.alpha===undefined?1:o.alpha, w=o.w||400, mono=o.mono!==false;
  ctx.save();
  ctx.font=w+' '+size+'px '+(mono?MONOT:FONT);
  var w1=ctx.measureText(base).width, w2=ctx.measureText(exp).width*0.6;
  ctx.restore();
  var tot=w1+w2, x0=(align==='center')?x-tot/2:x;
  T(ctx,base,x0,y,{size:size,color:color,alpha:alpha,w:w,mono:mono});
  T(ctx,exp,x0+w1,y-size*0.40,{size:size*0.60,color:color,alpha:alpha,w:w,mono:mono});
}

/* 带卡片外观的标签 */
function pill(ctx,x,y,text,o){
  o=o||{};
  var size=o.size||15, pad=o.pad||14, h=o.h||34;
  ctx.save();
  ctx.font='500 '+size+'px '+FONT;
  var w=ctx.measureText(text).width+pad*2;
  ctx.restore();
  var x0=o.align==='center'?x-w/2:x;
  if(o.bg!==false) R(ctx,x0,y-h/2,w,h,h/2,{fill:o.fill||'rgba(255,255,255,.04)',stroke:o.stroke||'rgba(255,255,255,.12)',lw:1,alpha:o.alpha,glow:o.glow,gc:o.stroke});
  T(ctx,text,o.align==='center'?x:x0+pad,y+1,{size:size,color:o.color||INK,alpha:o.alpha,w:o.w||500,align:o.align==='center'?'center':'left'});
  return w;
}

