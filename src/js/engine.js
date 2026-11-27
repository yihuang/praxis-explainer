/* ============================================================
   2. 页面动画调度
   ============================================================ */
var q=new URLSearchParams(location.search);
/* 可选：?shot=<场景序号>,<秒> 只渲染一帧静图（用于导出文章配图） */
if(q.has('shot')){
  var parts=q.get('shot').split(',');
  var si=parseInt(parts[0],10)||0, st=parseFloat(parts[1]||'0');
  document.body.innerHTML='';
  document.body.style.cssText='margin:0;background:#0a0d13';
  var cd=document.createElement('canvas');
  cd.width=2000; cd.height=1120; cd.style.cssText='width:1000px;height:560px;display:block';
  document.body.appendChild(cd);
  var cx0=cd.getContext('2d');
  cx0.setTransform(2,0,0,2,0,0);
  SC[si].draw(cx0,st);
  return;
}

var nodes=[];
var cans=document.querySelectorAll('canvas[data-i]');
for(var c0=0;c0<cans.length;c0++){
  var cv=cans[c0];
  nodes.push({cv:cv,i:parseInt(cv.getAttribute('data-i'),10),ctx:cv.getContext('2d'),t:0,on:false,shown:0});
}
function fit(cv){
  var w=cv.clientWidth||880;
  cv.width=Math.round(w*DPR);
  cv.height=Math.round(w*0.56*DPR);
}
function renderNode(n){
  var cv=n.cv,ctx=n.ctx;
  if(!cv.width) return;
  var s=cv.width/1000;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,cv.width,cv.height);
  ctx.setTransform(s,0,0,s,0,0);
  try{ SC[n.i].draw(ctx,Math.min(n.t,SC[n.i].dur)); }catch(e){ if(!n.err){n.err=1;console.error('scene',n.i,e);} }
}
nodes.forEach(function(n){ fit(n.cv); renderNode(n); });

var io=new IntersectionObserver(function(es){
  es.forEach(function(e){
    for(var i=0;i<nodes.length;i++){
      var n=nodes[i];
      if(n.cv===e.target){
        n.on=e.isIntersecting;
        if(n.on&&n.shown&&n.t>=SC[n.i].dur) n.t=0;
        if(n.on) n.shown=1;
      }
    }
  });
},{threshold:0.25});
nodes.forEach(function(n){ io.observe(n.cv); });

window.addEventListener('resize',function(){
  nodes.forEach(function(n){ fit(n.cv); renderNode(n); });
  if(P.on) fitP();
});

var lastT=performance.now();
function tick(now){
  var dt=Math.min(0.06,(now-lastT)/1000);
  lastT=now;
  for(var i=0;i<nodes.length;i++){
    var n=nodes[i];
    if(n.on){
      if(n.t<SC[n.i].dur){ n.t=Math.min(SC[n.i].dur,n.t+dt); }
      renderNode(n);
    }
  }
  if(P.on) playerTick(dt);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

LAB.init();

/* ---------- 滚动进度 ---------- */
var prog=document.getElementById('prog');
function onScroll(){
  var h=document.documentElement;
  var max=h.scrollHeight-h.clientHeight;
  var p=max>0?(h.scrollTop||document.body.scrollTop)/max:0;
  prog.style.width=(p*100)+'%';
  var best=-1,bd=1e9;
  for(var i=0;i<nodes.length;i++){
    var r=nodes[i].cv.getBoundingClientRect();
    var d=Math.abs(r.top+r.height*0.5-window.innerHeight*0.5);
    if(d<bd){bd=d;best=i;}
  }
  var btns=document.querySelectorAll('#dots button');
  for(var j=0;j<btns.length;j++) btns[j].className=(j===best?'on':'');
}
window.addEventListener('scroll',onScroll,{passive:true});
window.addEventListener('resize',onScroll);

/* ---------- 右侧导航 ---------- */
var dots=document.getElementById('dots');
var secs=document.querySelectorAll('section.scene');
for(var s2=0;s2<secs.length;s2++){
  (function(idx){
    var b=document.createElement('button');
    b.innerHTML='<span>'+secs[idx].getAttribute('data-title')+'</span>';
    b.addEventListener('click',function(){ secs[idx].scrollIntoView({behavior:'smooth'}); });
    dots.appendChild(b);
  })(s2);
}
onScroll();

/* ============================================================
   3. 时间轴：字幕 ↔ 语音 ↔ 画面
   ============================================================ */
SC.forEach(function(sc,i){
  var vo=VO[i]||[], t=0.5;
  sc.cues=sc.caps.map(function(c,k){
    var v=vo[k]||{};
    var d=v.d||Math.max(1.8,(c[1]-c[0]));
    var cue={a:c[0],b:c[1],start:t,end:t+d,d:d,text:c[2],audio:v.a||null};
    t+=d+0.34;
    return cue;
  });
  sc.total=t+0.45;
});

/* 语音时间 → 画面时间：按字幕窗口分段线性映射 */
function visualT(sc,t){
  var cs=sc.cues;
  if(!cs||!cs.length) return t;
  if(t<=cs[0].start) return cs[0].start>0?cs[0].a*(t/cs[0].start):0;
  var last=cs[cs.length-1];
  for(var k=0;k<cs.length;k++){
    var c=cs[k];
    if(t<c.start){
      var p=cs[k-1], span=c.start-p.end;
      var u=span>0?clamp((t-p.end)/span):1;
      return p.b+u*(c.a-p.b);
    }
    if(t<=c.end){ var u2=(t-c.start)/Math.max(0.01,c.end-c.start); return c.a+u2*(c.b-c.a); }
  }
  var tail=Math.max(0.01,sc.total-last.end), u3=clamp((t-last.end)/tail);
  return last.b+u3*(sc.dur-last.b);
}

/* ============================================================
   4. 播放器
   ============================================================ */
var P={on:false,i:0,t:0,playing:false,cv:null,ctx:null,cap:-1};
var elPlayer=document.getElementById('player'),
    elCap=document.getElementById('cap'),
    elFill=document.getElementById('fill'),
    elTime=document.getElementById('ptime'),
    elTrack=document.getElementById('track'),
    elPlayBtn=document.getElementById('pplay'),
    elMute=document.getElementById('pmute');

var A={el:document.getElementById('va'),key:'',muted:false};
var ICON_ON='<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M3 6h2.2L8.5 3.5v9L5.2 10H3z"/><path d="M11 5.6a3.2 3.2 0 010 4.8"/></svg>';
var ICON_OFF='<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M3 6h2.2L8.5 3.5v9L5.2 10H3z"/><path d="M10.6 6.2l3.2 4M13.8 6.2l-3.2 4"/></svg>';

function totalVoice(){ var s=0; for(var i=0;i<SC.length;i++) s+=SC[i].total; return s; }
function elapsedVoice(i,t){ var s=0; for(var k=0;k<i;k++) s+=SC[k].total; return s+t; }
function fmt(x){ var m=Math.floor(x/60), s=Math.floor(x%60); return m+':'+(s<10?'0':'')+s; }

function fitP(){
  var w=Math.min(window.innerWidth*0.96,1240);
  P.cv.width=Math.round(w*DPR);
  P.cv.height=Math.round(w*0.56*DPR);
  P.cv.style.width=w+'px';
  P.cv.style.height=(w*0.56)+'px';
}

function cueAt(sc,t){
  for(var k=0;k<sc.cues.length;k++){ if(t>=sc.cues[k].start&&t<sc.cues[k].end) return k; }
  return -1;
}

function setCap(i,t){
  var sc=SC[i], k=cueAt(sc,t);
  if(k===P.cap) return;
  P.cap=k;
  if(k<0){ elCap.textContent=''; return; }
  elCap.textContent=sc.cues[k].text;
  elCap.style.opacity=1;
}

function syncAudio(sc,t){
  var k=cueAt(sc,t), cue=k>=0?sc.cues[k]:null;
  var key=P.i+'/'+k;
  if(key!==A.key){
    A.key=key;
    if(cue&&cue.audio){ A.el.src=cue.audio; A.el.currentTime=0; }
  }
  if(!cue||!cue.audio){ if(!A.el.paused) A.el.pause(); return; }
  if(P.playing){
    var local=t-cue.start;
    if(A.el.paused){ try{ A.el.currentTime=Math.max(0,local); }catch(e){} A.el.play().catch(function(){}); }
    else if(Math.abs(A.el.currentTime-local)>0.45){ try{ A.el.currentTime=Math.max(0,local); }catch(e){} }
  }else if(!A.el.paused){ A.el.pause(); }
}

function syncMute(){ A.el.muted=A.muted; elMute.innerHTML=A.muted?ICON_OFF:ICON_ON; }

function playerTick(dt){
  var sc=SC[P.i];
  if(P.playing){
    P.t+=dt;
    if(P.t>=sc.total){
      if(P.i<SC.length-1){ P.i++; P.t=0; P.cap=-1; elCap.textContent=''; A.key=''; }
      else { P.t=sc.total; P.playing=false; syncPlayBtn(); }
    }
  }
  var vt=visualT(sc,P.t);
  var ctx=P.ctx, s=P.cv.width/1000;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,P.cv.width,P.cv.height);
  ctx.setTransform(s,0,0,s,0,0);
  try{ sc.draw(ctx,Math.min(vt,sc.dur)); }catch(e){}
  setCap(P.i,P.t);
  syncAudio(sc,P.t);
  elFill.style.width=(elapsedVoice(P.i,P.t)/totalVoice()*100)+'%';
  elTime.textContent=fmt(elapsedVoice(P.i,P.t))+' / '+fmt(totalVoice());
}

function syncPlayBtn(){ elPlayBtn.textContent=P.playing?'❚❚':'▶'; }

function openPlayer(){
  P.on=true; P.i=0; P.t=0; P.cap=-1; P.playing=true; A.key='';
  elPlayer.className='on';
  document.body.style.overflow='hidden';
  P.cv=document.getElementById('pcv'); P.ctx=P.cv.getContext('2d');
  fitP(); syncPlayBtn(); syncMute(); elCap.textContent='';
  playerTick(0);
  if(SC[0].cues[0]&&SC[0].cues[0].audio){
    A.el.src=SC[0].cues[0].audio; A.el.currentTime=0; A.el.play().catch(function(){});
    A.key='0/0';
  }
}
function closePlayer(){
  P.on=false; P.playing=false; elPlayer.className='';
  document.body.style.overflow='';
  if(!A.el.paused) A.el.pause();
}
function goto(i,t){
  P.i=Math.max(0,Math.min(SC.length-1,i)); P.t=t||0; P.cap=-1; elCap.textContent=''; A.key='';
  if(P.on) playerTick(0);
}
document.getElementById('play').addEventListener('click',openPlayer);
document.getElementById('xclose').addEventListener('click',closePlayer);
elPlayBtn.addEventListener('click',function(){ P.playing=!P.playing; syncPlayBtn(); });
elMute.addEventListener('click',function(){ A.muted=!A.muted; syncMute(); });
document.getElementById('pprev').addEventListener('click',function(){ goto(P.i-1); });
document.getElementById('pnext').addEventListener('click',function(){ goto(P.i+1); });
document.getElementById('pcv').addEventListener('click',function(){ P.playing=!P.playing; syncPlayBtn(); });
elTrack.addEventListener('click',function(ev){
  var r=elTrack.getBoundingClientRect();
  var ratio=clamp((ev.clientX-r.left)/r.width);
  var target=ratio*totalVoice(), acc=0;
  for(var i=0;i<SC.length;i++){
    if(target<acc+SC[i].total){ goto(i,target-acc); return; }
    acc+=SC[i].total;
  }
  goto(SC.length-1,SC[SC.length-1].total);
});
window.addEventListener('keydown',function(ev){
  if(!P.on){
    if(ev.key==='p'||ev.key==='P') openPlayer();
    return;
  }
  if(ev.key==='Escape'){ closePlayer(); }
  else if(ev.key===' '){ ev.preventDefault(); P.playing=!P.playing; syncPlayBtn(); }
  else if(ev.key==='ArrowRight'){ goto(P.i+1); }
  else if(ev.key==='ArrowLeft'){ goto(P.i>0?P.i-1:0); }
});
window.addEventListener('resize',function(){ if(P.on) fitP(); });

})();
