var SC=[];

/* ============================================================
   场景 1 —— 加密给一道题
   ============================================================ */
SC.push({
  dur:16,
  caps:[
    [0,3.4,'今天所有的加密，背后都有一把钥匙。'],
    [3.4,6.2,'见证加密说：不要钥匙，把消息锁进一道题里。'],
    [6.2,9.6,'知道答案的人，也就是持有见证的人，能把它取出来。'],
    [9.6,13,'其余的人，拿到的只是噪声。'],
    [13,16,'密文自带释放条件，没有钥匙分发，也没有第三方。']
  ],
  draw:function(ctx,t){
    var gx=470;

    /* --- 左：候选输入 --- */
    var a0=seg(t,0.3,1.4);
    T(ctx,'任意输入',58,150,{size:14,color:DIM,alpha:a0,ls:1});
    T(ctx,'（猜一个 w）',58,172,{size:12,color:FAINT,alpha:a0});

    /* --- 闸门 --- */
    var ga=seg(t,0.6,1.8);
    L(ctx,gx,120,gx,440,{color:'rgba(88,196,221,.35)',lw:2,alpha:ga,dash:[3,9]});
    for(var i=0;i<11;i++){
      var yy=130+i*30;
      L(ctx,gx-5,yy,gx+5,yy,{color:'rgba(88,196,221,.5)',lw:1,alpha:ga*0.8});
    }
    R(ctx,gx-84,74,168,58,12,{fill:'rgba(12,17,26,.92)',stroke:'rgba(88,196,221,.28)',lw:1,alpha:seg(t,1.0,2.0)});
    T(ctx,'语句 S',gx,94,{size:15,color:BLUE,align:'center',alpha:seg(t,1.0,2.0),w:600});
    T(ctx,'∃ w，使 P(w) = 1',gx,114,{size:12.5,color:DIM,align:'center',alpha:seg(t,1.0,2.0),mono:true,ls:.5});

    /* --- 右：信封 --- */
    var ea=seg(t,0.2,1.4);
    var ex=632,ey=212,ew=300,eh=168;
    R(ctx,ex,ey,ew,eh,10,{fill:'rgba(20,27,39,.95)',stroke:'rgba(255,255,255,.10)',lw:1.2,alpha:ea});
    ctx.save();
    ctx.globalAlpha*=ea;
    ctx.strokeStyle='rgba(255,255,255,.10)';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(ex+1,ey+1);ctx.lineTo(ex+ew/2,ey+eh*0.52);ctx.lineTo(ex+ew-1,ey+1);ctx.stroke();
    ctx.restore();
    T(ctx,'密文 ct',ex+ew/2,ey-20,{size:13,color:DIM,align:'center',alpha:ea,ls:.5});

    /* --- 三个尝试 --- */
    var trials=[
      {y:210, ok:false, ap:2.6, m0:3.4, m1:5.2},
      {y:300, ok:false, ap:2.9, m0:3.7, m1:5.5},
      {y:390, ok:true,  ap:3.2, m0:4.0, m1:5.8}
    ];
    for(var k=0;k<trials.length;k++){
      (function(tr){
        var app=seg(t,tr.ap,tr.ap+0.5);
        var u=seg(t,tr.m0,tr.m1);
        var x=lerp(104,gx-26,u);
        var alpha=app, y=tr.y;
        if(t>tr.m1){
          if(!tr.ok){
            var b=seg(t,tr.m1,tr.m1+0.7);
            x=gx-26-54*b;
            alpha=app*(1-b);
          }else{
            var c=seg(t,tr.m1,tr.m1+1.2);
            x=lerp(gx-26,ex+ew*0.5-36,c);
            y=lerp(tr.y,ey+eh*0.5,c);
            alpha=app*(1-seg(t,7.3,8.2));
          }
        }
        if(tr.ok&&t>tr.m0&&t<tr.m1+0.9){
          T(ctx,'witness',x,y-30,{size:11.5,color:GOLD,align:'center',alpha:alpha*seg(t,tr.m0+0.2,tr.m0+0.8),w:600});
        }
        D(ctx,x,y,7,tr.ok?GOLD:'#6b7690',{alpha:alpha,glow:tr.ok?16:0});
        ring(ctx,x,y,13,tr.ok?GOLD:'#6b7690',{alpha:alpha*0.28,lw:1});
        /* 到闸门的闪光 */
        if(t>tr.m1&&t<tr.m1+0.55&&!tr.ok){
          var f=(t-tr.m1)/0.55;
          ring(ctx,gx,tr.y,8+26*f,RED,{alpha:0.7*(1-f),lw:1.6});
        }
        if(t>tr.m1&&tr.ok){
          /* 通过时的高亮 */
          var g2=1-seg(t,tr.m1+1.6,tr.m1+3.2);
          ring(ctx,x,y,9+g2*10,GOLD,{alpha:0.5*g2,lw:1.2});
        }
      })(trials[k]);
    }

    /* --- 锁 → 打开 --- */
    var la=seg(t,1.2,2.2);
    var open=seg(t,6.1,7.6);
    if(open<1){
      ctx.save();
      ctx.globalAlpha*=la*(1-open);
      R(ctx,ex+ew/2-15,ey+eh*0.5-2,30,25,5,{fill:'#0b0f16',stroke:'rgba(240,172,95,.75)',lw:1.6});
      ctx.strokeStyle='rgba(240,172,95,.75)';ctx.lineWidth=2.4;
      ctx.beginPath();ctx.arc(ex+ew/2,ey+eh*0.5-2,9.5,Math.PI,0);ctx.stroke();
      ctx.restore();
    }else{
      /* 打开的光 */
      var gl=Math.sin(clamp(open)*Math.PI);
      D(ctx,ex+ew/2,ey+eh*0.5,26+14*gl,GOLD,{alpha:0.10+0.12*(1-open),glow:40});
      T(ctx,'m',ex+ew/2,ey+eh*0.5+2,{size:26,color:GOLD,align:'center',alpha:open,w:600});
    }
    T(ctx,'可读',ex+ew/2,ey+eh+30,{size:14,color:GOLD,align:'center',alpha:seg(t,7.2,8.4)});

    /* --- 底部结论 --- */
    var b1=seg(t,9.4,10.6), b2=seg(t,10.8,12.0);
    T(ctx,'知道 w',76,510,{size:15,color:GOLD,alpha:b1,w:600});
    T(ctx,'→  能读',150,510,{size:15,color:'#c6cddc',alpha:b1});
    L(ctx,76,528,196,528,{color:'rgba(240,172,95,.22)',lw:1,alpha:b1});

    T(ctx,'不知道 w',300,510,{size:15,color:'#7d879c',alpha:b2,w:600});
    T(ctx,'→  只有噪声',382,510,{size:15,color:'#7d879c',alpha:b2});
    L(ctx,300,528,470,528,{color:'rgba(255,255,255,.08)',lw:1,alpha:b2});

    /* 噪声示意 */
    var nz=seg(t,11.2,12.6);
    if(nz>0){
      for(var q=0;q<26;q++){
        var px=520+((q*37)%430), py=496+((q*61)%36);
        D(ctx,px,py,1.6,'#5a6478',{alpha:nz*0.5*(0.4+0.6*Math.abs(Math.sin(q+t*3)))});
      }
    }
  }
});

/* ============================================================
   场景 2 —— 三角困境
   ============================================================ */
SC.push({
  dur:14,
  caps:[
    [0,3.2,'十三年里，见证加密一直卡在一个三角形上。'],
    [3.2,6.4,'通用、可证明、实用，每个方案最多占住两条边。'],
    [6.4,9.6,'可行的那些结论，代价都是天文数字。'],
    [9.6,14,'Praxis 声称，第一次站到了中间。']
  ],
  draw:function(ctx,t){
    var A={x:500,y:118}, B={x:262,y:418}, C={x:738,y:418};

    /* 边 */
    function edge(p,q,a){
      if(a<=0) return;
      var u=clamp(a);
      L(ctx,p.x,p.y,lerp(p.x,q.x,u),lerp(p.y,q.y,u),{color:'rgba(255,255,255,.16)',lw:1.5});
    }
    edge(A,B,seg(t,0.2,1.4)); edge(A,C,seg(t,0.5,1.7)); edge(B,C,seg(t,0.8,2.0));

    /* 顶点 */
    var vp=seg(t,1.8,2.8);
    [[A,'通用 · 任意 NP',-34],[B,'可证明的安全',44],[C,'实用',44]].forEach(function(v){
      D(ctx,v[0].x,v[0].y,6,'#cfd6e4',{alpha:vp});
      ring(ctx,v[0].x,v[0].y,12,'#cfd6e4',{alpha:vp*0.25,lw:1});
      T(ctx,v[1],v[0].x,v[0].y+v[2],{size:15.5,color:'#dbe2ef',align:'center',alpha:vp,w:500});
    });

    /* 三条边的「住户」 */
    var e1=seg(t,4.0,5.0), e2=seg(t,4.6,5.6), e3=seg(t,5.2,6.2);
    function card(x,y,w,title,sub1,sub2,alpha,accent){
      if(alpha<=0) return;
      R(ctx,x,y,w,84,12,{fill:'rgba(255,255,255,.028)',stroke:'rgba(255,255,255,.09)',lw:1,alpha:alpha});
      T(ctx,title,x+14,y+22,{size:13.5,color:accent,alpha:alpha,w:600});
      T(ctx,sub1,x+14,y+46,{size:12,color:'#8e97ab',alpha:alpha});
      T(ctx,sub2,x+14,y+66,{size:12,color:'#6f7a91',alpha:alpha});
    }
    /* 左：通用+可证明 */
    L(ctx,248,268,376,278,{color:'rgba(88,196,221,.18)',lw:1,alpha:e1,dash:[2,5]});
    card(34,222,214,'通用 + 可证明','iO / 线性码 / 秩间隙','数学上存在，工程上天文数字',e1,BLUE);
    /* 右：通用+实用 */
    L(ctx,752,268,624,278,{color:'rgba(252,98,85,.18)',lw:1,alpha:e2,dash:[2,5]});
    card(756,222,212,'通用 + 实用','启发式论证 / 专用假设','多数已被攻破或绕过',e2,RED);

    /* 下：可证明+实用 */
    var w3=pill(ctx,500,505,'可证明 + 实用　·　签名、KZG 打开等受限关系',{align:'center',size:13.5,color:'#a9b4c8',alpha:e3,h:32,stroke:'rgba(255,255,255,.09)',fill:'rgba(255,255,255,.025)'});

    /* Praxis */
    var ce=seg(t,7.4,9.2);
    if(ce>0){
      var cx=500,cy=322;
      for(var j=0;j<3;j++){
        var ph=((t*0.55+j/3)%1);
        ring(ctx,cx,cy,16+ph*54,GOLD,{alpha:(1-ph)*0.35*ce,lw:1.2});
      }
      D(ctx,cx,cy,8,GOLD,{alpha:ce,glow:26});
      T(ctx,'Praxis',cx,cy+38,{size:16,color:GOLD,align:'center',alpha:seg(t,8.2,9.4),w:600});
      T(ctx,'第一次三条同时为真',cx,cy+60,{size:12,color:'#b99a6a',align:'center',alpha:seg(t,9.0,10.2)});
    }
  }
});

/* ============================================================
   场景 3 —— 矩量矩阵与秩
   ============================================================ */
SC.push({
  dur:16,
  caps:[
    [0,3.4,'任何 NP 命题，都能写成布尔未知数上的二次方程。'],
    [3.4,6.8,'把 w 翻成外积矩阵 W，所有二次式就变成对 W 的线性函数。'],
    [6.8,10.4,'真正的见证，给出的矩阵秩恰好是一。'],
    [10.4,14,'可两个赋值的平均，误差互相抵消，也能通过测试。'],
    [14,16,'它的秩是二。整篇论文都在管理这个秩。']
  ],
  draw:function(ctx,t){
    var w=[1,1,0,1], u=[1,1,0,1], up=[1,1,1,1];
    var cw=44, gap=7;
    var mx=110, my=196, cw2=56, gap2=6;

    /* 标签 */
    T(ctx,'见证的矩阵',110,72,{size:15,color:GOLD,alpha:seg(t,0.2,1.2),w:600});
    T(ctx,'W = w wᵀ',110,96,{size:13,color:'#8e97ab',alpha:seg(t,0.4,1.4),mono:true});
    T(ctx,'骗子的矩阵',620,72,{size:15,color:PURPLE,alpha:seg(t,6.6,7.6),w:600});
    T(ctx,'½ (u uᵀ + u′ u′ᵀ)',620,96,{size:13,color:'#8e97ab',alpha:seg(t,6.8,7.8),mono:true});

    /* 向量 w */
    var va=seg(t,0.6,1.8);
    T(ctx,'w =',60,132,{size:15,color:'#c6cddc',alpha:va,mono:true});
    for(var j=0;j<4;j++){
      var a=seg(t,0.8+j*0.15,1.6+j*0.15);
      R(ctx,110+j*(cw+gap),110,cw,cw,6,{fill:w[j]?'rgba(240,172,95,.14)':'rgba(255,255,255,.03)',
        stroke:w[j]?'rgba(240,172,95,.5)':'rgba(255,255,255,.1)',lw:1.2,alpha:a});
      T(ctx,String(w[j]),110+j*(cw+gap)+cw/2,110+cw/2+1,{size:17,color:w[j]?GOLD:'#7d879c',align:'center',alpha:a,mono:true});
    }

    /* 左矩阵 */
    var n=4;
    for(var i=0;i<n;i++){
      for(var k=0;k<n;k++){
        var d=i*n+k;
        var aa=seg(t,2.0+d*0.10,2.5+d*0.10);
        var v=w[i]*w[k];
        var on=v===1;
        R(ctx,mx+k*(cw2+gap2),my+i*(cw2+gap2),cw2,cw2,5,
          {fill:on?'rgba(240,172,95,.16)':'rgba(255,255,255,.018)',
           stroke:on?'rgba(240,172,95,.42)':'rgba(255,255,255,.07)',lw:1,alpha:aa});
        T(ctx,String(v),mx+k*(cw2+gap2)+cw2/2,my+i*(cw2+gap2)+cw2/2+1,
          {size:15,color:on?GOLD:'#4e5870',align:'center',alpha:aa,mono:true});
      }
    }

    /* 一条测试：只读两个格子 */
    var ta=seg(t,4.9,5.7);
    if(ta>0){
      var P1={x:mx+3*(cw2+gap2)+cw2/2, y:my+1*(cw2+gap2)+cw2/2};
      var P0={x:mx+0*(cw2+gap2)+cw2/2, y:my+0*(cw2+gap2)+cw2/2};
      ring(ctx,P1.x,P1.y,25,GOLD,{alpha:ta,lw:1.6,glow:10});
      ring(ctx,P0.x,P0.y,25,GOLD,{alpha:ta,lw:1.6,glow:10});
      L(ctx,P1.x+26,P1.y-10,372,252,{color:'rgba(240,172,95,.35)',lw:1,alpha:ta,dash:[3,4]});
      L(ctx,P0.x+18,P0.y+10,372,252,{color:'rgba(240,172,95,.35)',lw:1,alpha:ta,dash:[3,4]});
      T(ctx,'一条测试',380,214,{size:11.5,color:'#6f7a91',alpha:ta,ls:.5});
      T(ctx,'W₁₃ = W₀₀',380,244,{size:14,color:GOLD,alpha:ta,mono:true,w:600});
      T(ctx,'只读这两个格子',380,272,{size:11.5,color:'#7d879c',alpha:ta});
      T(ctx,'没有 w，只有加法',380,292,{size:11,color:'#5f6880',alpha:ta});
    }

    /* 秩 1 的说明 */
    var ra=seg(t,7.0,8.2);
    T(ctx,'秩 = 1',110,452,{size:15,color:GOLD,alpha:ra,w:600});
    T(ctx,'每一行都是 w 的倍数，或全零',110,478,{size:13,color:'#8e97ab',alpha:ra});
    /* 行高亮 */
    if(ra>0){
      for(var r2=0;r2<4;r2++){
        L(ctx,mx-8,my+r2*(cw2+gap2)+cw2/2,mx+n*(cw2+gap2)-gap2+8,my+r2*(cw2+gap2)+cw2/2,
          {color:GOLD,lw:1,alpha:ra*0.18,dash:[2,6]});
      }
    }

    /* 右矩阵 */
    var rx=620;
    for(var i2=0;i2<n;i2++){
      for(var k2=0;k2<n;k2++){
        var d2=i2*n+k2;
        var bb=seg(t,8.9+d2*0.09,9.4+d2*0.09);
        var val=0.5*(u[i2]*u[k2]+up[i2]*up[k2]);
        var half=(Math.abs(val-0.5)<1e-9);
        var one=(Math.abs(val-1)<1e-9);
        R(ctx,rx+k2*(cw2+gap2),my+i2*(cw2+gap2),cw2,cw2,5,
          {fill:half?'rgba(177,137,232,.20)':(one?'rgba(177,137,232,.09)':'rgba(255,255,255,.015)'),
           stroke:half?'rgba(177,137,232,.45)':'rgba(255,255,255,.06)',lw:1,alpha:bb});
        T(ctx,half?'½':(one?'1':'0'),rx+k2*(cw2+gap2)+cw2/2,my+i2*(cw2+gap2)+cw2/2+1,
          {size:15,color:half?PURPLE:(one?'#8f7bb8':'#414a5e'),align:'center',alpha:bb,mono:true});
      }
    }

    var rb=seg(t,10.9,12.1);
    T(ctx,'秩 = 2',620,452,{size:15,color:PURPLE,alpha:rb,w:600});
    T(ctx,'行不共线——却通过了全部线性测试',620,478,{size:13,color:'#8e97ab',alpha:rb});

    /* 底部结论 */
    var ca=seg(t,12.8,14.2);
    if(ca>0){
      R(ctx,110,516,780,30,8,{fill:'rgba(88,196,221,.05)',stroke:'rgba(88,196,221,.14)',lw:1,alpha:ca});
      T(ctx,'所有测试都是线性的  →  通过的矩阵构成线性空间  →  骗子混在里面',500,532,
        {size:13,color:'#9fb3cc',align:'center',alpha:ca});
    }
  }
});

/* ============================================================
   场景 4 —— 表的三个部分
   ============================================================ */
SC.push({
  dur:16,
  caps:[
    [0,3.6,'这张表由三样东西相加：搜索项、测试掩码、角落里的钥匙。'],
    [3.6,7,'密文把每个条目，单独发布成一个群元素。'],
    [7,10.4,'于是任何人都能沿着自己选的矩阵，把它们加权组合。'],
    [10.4,13.4,'通过测试，他拿到钥匙和一道锁；不通过，拿到噪声。'],
    [13.4,16,'这就是全部的加密机制。']
  ],
  draw:function(ctx,t){
    var n=5, cw=24, gap=3;
    var gx=[52,232,412,600], gy=96;
    var gw=n*(cw+gap)-gap;

    function grid(px,py,color,alpha,corner){
      for(var i=0;i<n;i++){
        for(var k=0;k<n;k++){
          var d=i*n+k, a=alpha*seg(t,0.4+d*0.035,0.7+d*0.035);
          var isCorner=(i===0&&k===0);
          R(ctx,px+k*(cw+gap),py+i*(cw+gap),cw,cw,4,
            {fill:isCorner&&corner?'rgba(240,172,95,.20)':'rgba(255,255,255,.035)',
             stroke:isCorner&&corner?'rgba(240,172,95,.55)':'rgba(255,255,255,.07)',lw:1,alpha:a});
          if(isCorner&&corner) D(ctx,px+k*(cw+gap)+cw/2,py+i*(cw+gap)+cw/2,3,GOLD,{alpha:a,glow:10});
          else D(ctx,px+k*(cw+gap)+cw/2,py+i*(cw+gap)+cw/2,2.2,color,{alpha:a*0.75});
        }
      }
    }

    var a1=seg(t,0.5,1.0);
    grid(gx[0],gy,'#58C4DD',1,false);
    T(ctx,'搜索项',gx[0]+gw/2,gy+gw+22,{size:13.5,color:'#9fb3cc',align:'center',alpha:a1,w:600});
    T(ctx,'½(y rᵀ + r yᵀ)',gx[0]+gw/2,gy+gw+44,{size:11.5,color:'#6f7a91',align:'center',alpha:a1,mono:true});

    T(ctx,'+',206,gy+gw/2,{size:22,color:'#4e5870',align:'center',alpha:seg(t,1.2,1.7)});

    var a2=seg(t,1.4,1.9);
    grid(gx[1],gy,'#B189E8',1,false);
    T(ctx,'测试掩码',gx[1]+gw/2,gy+gw+22,{size:13.5,color:'#b6a6d6',align:'center',alpha:a2,w:600});
    T(ctx,'M = Σ μₜ Cₜ',gx[1]+gw/2,gy+gw+44,{size:11.5,color:'#6f7a91',align:'center',alpha:a2,mono:true});

    T(ctx,'+',386,gy+gw/2,{size:22,color:'#4e5870',align:'center',alpha:seg(t,2.2,2.7)});

    var a3=seg(t,2.4,2.9);
    grid(gx[2],gy,'#F0AC5F',1,true);
    T(ctx,'钥匙 κ',gx[2]+gw/2,gy+gw+22,{size:13.5,color:GOLD,align:'center',alpha:a3,w:600});
    T(ctx,'藏在角落',gx[2]+gw/2,gy+gw+44,{size:11.5,color:'#6f7a91',align:'center',alpha:a3});

    T(ctx,'=',574,gy+gw/2,{size:20,color:'#66718c',align:'center',alpha:seg(t,3.2,3.7)});

    var a4=seg(t,3.4,4.2);
    for(var i2=0;i2<n;i2++){
      for(var k2=0;k2<n;k2++){
        var d2=i2*n+k2;
        var aa=a4*seg(t,3.6+d2*0.04,3.9+d2*0.04);
        R(ctx,gx[3]+k2*(cw+gap),gy+i2*(cw+gap),cw,cw,4,
          {fill:'rgba(255,255,255,.05)',stroke:'rgba(255,255,255,.12)',lw:1,alpha:aa});
        L(ctx,gx[3]+k2*(cw+gap)+5,gy+i2*(cw+gap)+cw-5,
          gx[3]+k2*(cw+gap)+cw-5,gy+i2*(cw+gap)+5,{color:'rgba(255,255,255,.16)',lw:1,alpha:aa});
      }
    }
    T(ctx,'表 T',gx[3]+gw/2,gy+gw+22,{size:13.5,color:'#e2e8f4',align:'center',alpha:a4,w:600});
    T(ctx,'逐条发布为 [T_ij]',gx[3]+gw/2,gy+gw+44,{size:11.5,color:'#6f7a91',align:'center',alpha:a4});

    /* --- 组合 --- */
    var ca=seg(t,5.2,6.4);
    T(ctx,'任选一个 W',60,306,{size:13.5,color:'#9fb3cc',alpha:ca,w:600});
    T(ctx,'它的非零项就是组合系数',60,328,{size:11.5,color:'#6f7a91',alpha:ca});

    var wx=60, wy=346, wcw=18, wgap=3, wn=5;
    var pattern=[[0,0],[0,2],[1,1],[2,0],[2,3],[3,2],[4,4],[4,0]];
    for(var i3=0;i3<wn;i3++){
      for(var k3=0;k3<wn;k3++){
        var sel=false;
        for(var p=0;p<pattern.length;p++){ if(pattern[p][0]===i3&&pattern[p][1]===k3) sel=true; }
        var ba=ca*seg(t,5.4+(i3*wn+k3)*0.02,5.8+(i3*wn+k3)*0.02);
        R(ctx,wx+k3*(wcw+wgap),wy+i3*(wcw+wgap),wcw,wcw,3,
          {fill:sel?'rgba(88,196,221,.22)':'rgba(255,255,255,.025)',
           stroke:sel?'rgba(88,196,221,.5)':'rgba(255,255,255,.07)',lw:1,alpha:ba});
      }
    }

    var arrowA=seg(t,6.6,7.4);
    A(ctx,220,392,430,392,{color:'rgba(88,196,221,.5)',alpha:arrowA,lw:1.5});
    T(ctx,'加权相加',320,372,{size:11.5,color:'#6f7a91',align:'center',alpha:arrowA});

    var resA=seg(t,7.2,8.0);
    R(ctx,440,368,232,48,10,{fill:'rgba(88,196,221,.08)',stroke:'rgba(88,196,221,.3)',lw:1,alpha:resA});
    T(ctx,'⟨T, W⟩',556,392,{size:16,color:BLUE,align:'center',alpha:resA,mono:true,w:600});

    /* --- 两条分支 --- */
    var br=seg(t,9.2,10.4);
    if(br>0){
      A(ctx,520,420,330,468,{color:'rgba(240,172,95,.55)',alpha:br*0.9,lw:1.4});
      A(ctx,600,420,760,468,{color:'rgba(125,135,156,.5)',alpha:br*0.9,lw:1.4});
      R(ctx,110,472,420,56,12,{fill:'rgba(240,172,95,.07)',stroke:'rgba(240,172,95,.3)',lw:1,alpha:br});
      T(ctx,'W 通过测试  →  κ·W₀₀ + ψ·r(w)',130,492,{size:13.5,color:GOLD,alpha:br,w:600});
      T(ctx,'钥匙，加一道锁',130,514,{size:12,color:'#8e97ab',alpha:br});

      R(ctx,600,472,320,56,12,{fill:'rgba(255,255,255,.018)',stroke:'rgba(255,255,255,.08)',lw:1,alpha:br});
      T(ctx,'W 没通过  →  均匀随机',620,492,{size:13.5,color:'#7d879c',alpha:br,w:600});
      T(ctx,'什么也不是',620,514,{size:12,color:'#5f6880',alpha:br});
    }
  }
});

/* ============================================================
   场景 5 —— 一个整数与它的搜索
   ============================================================ */
SC.push({
  dur:15,
  caps:[
    [0,3.4,'代入见证的矩阵，那道锁变成一个整数，r(w)。'],
    [3.4,6.6,'它一定落在一个已知的窗口里，宽约二的五十次方。'],
    [6.6,9.8,'但没人说要从一头试到另一头。'],
    [9.8,12.6,'从中心出发，小步铺表，大步跳过去，代价是根号。'],
    [12.6,15,'几亿步，几秒钟。']
  ],
  draw:function(ctx,t){
    var ax0=100, ax1=900, ay=340, cx=500;
    var lo=250, hi=750;

    T(ctx,'解密 = 从窗口里找出一个整数',500,88,{size:15,color:'#9fb3cc',align:'center',alpha:seg(t,0.2,1.3)});
    T(ctx,'r(w) = Σ rᵢ ，对 wᵢ = 1 的那些下标求和',100,140,{size:11.5,color:'#5f6880',alpha:seg(t,0.6,1.6)});

    var aa=seg(t,0.4,1.6);
    L(ctx,ax0,ay,ax1,ay,{color:'rgba(255,255,255,.16)',lw:1.2,alpha:aa});

    /* 窗口 */
    var wa=seg(t,1.4,2.6);
    R(ctx,lo,ay-26,hi-lo,52,6,{fill:'rgba(88,196,221,.05)',stroke:'rgba(88,196,221,.26)',lw:1,alpha:wa,dash:[4,6]});
    T(ctx,'−B',lo,ay+44,{size:11,color:'#6f7a91',align:'center',alpha:wa,mono:true});
    T(ctx,'+B',hi,ay+44,{size:11,color:'#6f7a91',align:'center',alpha:wa,mono:true});
    T(ctx,'窗口宽度 ≈ N·g ≈ 2⁵⁰·⁶',lo-10,ay-46,{size:11,color:'#7c93a8',align:'right',alpha:wa});

    /* 中心 */
    var ca=seg(t,2.0,3.0);
    L(ctx,cx,ay-34,cx,ay+34,{color:'rgba(255,255,255,.38)',lw:1.4,alpha:ca});
    T(ctx,'中心 c_w（解密者算得出它）',cx,ay+52,{size:11.5,color:'#9aa5bb',align:'center',alpha:ca});

    /* 小步：铺在窗口里 */
    var ba=seg(t,3.6,4.6);
    for(var i=0;i<30;i++){
      var x=lo+10+i*16.6;
      var a2=ba*seg(t,3.6+i*0.014,4.2+i*0.014);
      L(ctx,x,ay+6,x,ay+18,{color:'rgba(88,196,221,.55)',lw:1.3,alpha:a2});
    }
    T(ctx,'小步表：√ 个指纹，一次建好',500,ay+76,{size:11,color:'#6f8fa3',align:'center',alpha:ba});

    /* 大步 */
    var steps=[20,60,100,140];
    var hit=null;
    for(var s=0;s<steps.length;s++){
      var t0=4.9+s*0.42;
      var go=seg(t,t0,t0+0.55);
      if(go<=0) continue;
      [-1,1].forEach(function(sd){
        var ex=cx+sd*steps[s];
        var mx=(cx+ex)/2, my=ay-104-Math.abs(ex-cx)*0.10;
        ctx.save();
        ctx.globalAlpha*=go*0.8;
        ctx.strokeStyle=sd>0?'rgba(240,172,95,.5)':'rgba(240,172,95,.28)';
        ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(cx,ay-10);ctx.quadraticCurveTo(mx,my,ex,ay-10);ctx.stroke();
        ctx.restore();
        L(ctx,ex,ay-14,ex,ay+6,{color:'rgba(240,172,95,.4)',lw:1,alpha:go});
      });
      if(steps[s]===140) hit=t0+0.55;
    }

    /* 命中 */
    if(hit!==null&&t>hit){
      var hp=seg(t,hit,hit+1.1);
      var tx=cx+140;
      L(ctx,tx,ay-96,tx,ay-8,{color:'rgba(240,172,95,.35)',lw:1,alpha:hp,dash:[3,5]});
      D(ctx,tx,ay,5,GOLD,{alpha:hp,glow:22});
      ring(ctx,tx,ay,10+10*(1-hp),GOLD,{alpha:hp*0.55,lw:1.2});
      T(ctx,'命中 r(w)',tx,ay-112,{size:13.5,color:GOLD,align:'center',alpha:hp,w:600});
      T(ctx,'减去它，就剩 [κ]',tx,ay-132,{size:10.5,color:'#8e97ab',align:'center',alpha:hp});
    }

    /* 底部统计 */
    var sa=seg(t,10.6,12.0);
    if(sa>0){
      var chips=[['范围 g ≈ 2⁵⁰·⁶','#8fb6c8'],['步进 ≈ 2²⁹·⁴','#F0AC5F'],['每次 6 次域乘法','#9aa5bb']];
      for(var c=0;c<3;c++){
        var x0=180+c*220, al=sa*seg(t,10.6+c*0.2,11.4+c*0.2);
        R(ctx,x0,466,200,42,10,{fill:'rgba(255,255,255,.025)',stroke:'rgba(255,255,255,.08)',lw:1,alpha:al});
        T(ctx,chips[c][0],x0+100,487,{size:12.5,color:chips[c][1],align:'center',alpha:al,w:500});
      }
      T(ctx,'2⁵⁰ 宽的区间，用 √ 的代价穿过去',500,538,{size:12.5,color:'#7d879c',align:'center',alpha:seg(t,11.8,13.2)});
    }
  }
});

/* ============================================================
   场景 6 —— 秩决定猜几个数
   ============================================================ */
SC.push({
  dur:15,
  caps:[
    [0,3.6,'如果对手沿一个秩 d 的矩阵组合，锁会裂成 d 个乘积。'],
    [3.6,7,'要拆掉它，必须同时猜中 d 个整数。'],
    [7,10.4,'我们让最容易猜的骗子，秩至少是四。'],
    [10.4,15,'诚实猜一个，作弊猜四个，这就是全部的安全性。']
  ],
  draw:function(ctx,t){
    /* 标题行 */
    T(ctx,'诚实者',60,78,{size:15,color:GOLD,alpha:seg(t,0.4,1.2),w:600});
    T(ctx,'d = 1',150,78,{size:15,color:GOLD,alpha:seg(t,0.4,1.2),mono:true});
    T(ctx,'骗子',540,78,{size:15,color:PURPLE,alpha:seg(t,1.6,2.4),w:600});
    T(ctx,'d = 4',620,78,{size:15,color:PURPLE,alpha:seg(t,1.6,2.4),mono:true});

    /* 左：一个盒子 */
    var ba=seg(t,0.8,1.8);
    R(ctx,60,104,150,66,10,{fill:'rgba(240,172,95,.08)',stroke:'rgba(240,172,95,.32)',lw:1,alpha:ba});
    T(ctx,'r(w)',135,138,{size:17,color:GOLD,align:'center',alpha:ba,mono:true,w:600});
    T(ctx,'1 个数',135,190,{size:12.5,color:'#8e97ab',align:'center',alpha:ba});
    T(ctx,'猜中概率 ≤ g⁻¹',60,222,{size:12.5,color:'#9aa5bb',alpha:seg(t,2.2,3.0)});
    T(ctx,'搜索 ≈ √g',60,246,{size:13,color:GOLD,alpha:seg(t,2.6,3.4),w:600});

    /* 右：四个盒子 */
    var labels=['v₁ᵀr','v₂ᵀr','v₃ᵀr','v₄ᵀr'];
    for(var i=0;i<4;i++){
      var a=seg(t,2.4+i*0.18,3.0+i*0.18);
      var x=540+i*94;
      R(ctx,x,104,82,66,10,{fill:'rgba(177,137,232,.08)',stroke:'rgba(177,137,232,.28)',lw:1,alpha:a});
      T(ctx,labels[i],x+41,138,{size:14,color:PURPLE,align:'center',alpha:a,mono:true,w:500});
    }
    T(ctx,'4 个数，必须同时猜中',700,190,{size:12.5,color:'#8e97ab',align:'center',alpha:seg(t,3.8,4.6)});
    T(ctx,'概率 ≤ g⁻⁴',540,222,{size:12.5,color:'#9aa5bb',alpha:seg(t,4.2,5.0)});
    T(ctx,'搜索 ≈ g²',540,246,{size:13,color:PURPLE,alpha:seg(t,4.6,5.4),w:600});

    /* 分隔 */
    L(ctx,505,64,505,260,{color:'rgba(255,255,255,.07)',lw:1,alpha:seg(t,0.6,1.4),dash:[3,7]});

    /* 下：三条搜索成本 */
    var rows=[
      {y:330,label:'一张表',sub:'d = 2',exp:57,color:'#4a7c8e',val:'2⁵⁷'},
      {y:392,label:'线性权重',sub:'d = 3',exp:40,color:'#58A6BE',val:'2⁴⁰'},
      {y:454,label:'二次权重 + 绑定',sub:'d = 4',exp:32,color:GOLD,val:'2³²'}
    ];
    T(ctx,'解密搜索成本（域乘法，λ = 100）',60,296,{size:11.5,color:'#6f7a91',alpha:seg(t,5.6,6.4),ls:.5});

    var bx=250, maxw=560, scale=maxw/60;
    for(var r=0;r<rows.length;r++){
      var row=rows[r];
      var a2=seg(t,6.0+r*0.8,6.9+r*0.8);
      T(ctx,row.label,60,row.y+6,{size:13,color:'#c6cddc',alpha:a2,w:500});
      T(ctx,row.sub,60,row.y+26,{size:11,color:'#6f7a91',alpha:a2,mono:true});
      R(ctx,bx,row.y-10,Math.max(3,row.exp*scale),26,4,
        {fill:row.color==='#F0AC5F'?'rgba(240,172,95,.30)':row.color,stroke:'none',alpha:a2*0.9});
      if(row.exp*scale<=6) D(ctx,bx+3,row.y+3,3,row.color,{alpha:a2});
      T(ctx,row.val,bx+row.exp*scale+14,row.y+6,{size:13,color:row.color,alpha:a2,mono:true,w:600});
    }
    /* 轴 */
    var axa=seg(t,6.0,7.2);
    L(ctx,bx,494,bx+maxw,494,{color:'rgba(255,255,255,.12)',lw:1,alpha:axa});
    for(var g=0;g<=60;g+=20){
      L(ctx,bx+g*scale,489,bx+g*scale,499,{color:'rgba(255,255,255,.2)',lw:1,alpha:axa});
      T(ctx,String(g),bx+g*scale,514,{size:10.5,color:'#5f6880',align:'center',alpha:axa,mono:true});
    }
    T(ctx,'log₂ 域乘法',bx,534,{size:10.5,color:'#4a5468',align:'left',alpha:axa});
    T(ctx,'把秩从 2 抬到 4：搜索短了约 2²⁵ 倍',bx+maxw,534,{size:11,color:'#7d879c',align:'right',alpha:seg(t,8.4,9.8)});
  }
});

/* ============================================================
   场景 7 —— 四步手术
   ============================================================ */
SC.push({
  dur:16,
  caps:[
    [0,3.4,'他们的构造，密文是一千一百亿 GiB。'],
    [3.4,7,'Praxis 做了四次结构性改动，不是优化常数。'],
    [7,10.4,'第二步把表拆成两个因子，密文从 N 方塌缩到 N。'],
    [10.4,13.4,'第三步为了安全把体积买回来，第四步再折价收回。'],
    [13.4,16,'真正的艺术，是把秩和尺寸拆开付账。']
  ],
  draw:function(ctx,t){
    var x0=214, x1=904, lgMin=-1, lgMax=44;
    function px(lg){ return x0+(lg-lgMin)/(lgMax-lgMin)*(x1-x0); }

    var ga=seg(t,0.2,1.2);
    T(ctx,'密文尺寸 · 对数刻度（GiB）',40,52,{size:11.5,color:'#6f7a91',alpha:ga,ls:.5});


    for(var g=0;g<=40;g+=10){
      L(ctx,px(g),72,px(g),452,{color:'rgba(255,255,255,.05)',lw:1,alpha:ga});
      T(ctx,['10⁰','10¹⁰','10²⁰','10³⁰','10⁴⁰'][g/10],px(g),474,{size:10.5,color:'#5f6880',align:'center',alpha:ga});
    }
    L(ctx,x0,452,x1,452,{color:'rgba(255,255,255,.12)',lw:1,alpha:ga});


    var rows=[
      {y:108,lab:'① 只留一张表',val:'4.6 × 10⁴³ GiB',lg:43.66,note:'固定间隙，放开范围 g',c:'#4a7c8e'},
      {y:204,lab:'② 两个因子',val:'0.14 GiB',lg:-0.85,note:'QAP + 配对，宽度 2',c:'#58A6BE'},
      {y:300,lab:'③ 绑定副本',val:'8.1 × 10² GiB',lg:2.91,note:'把最小秩抬到 4',c:'#7a86a8'},
      {y:396,lab:'④ 共享因子',val:'7.88 GiB',lg:0.90,note:'网格共享，行列复用',c:GOLD}
    ];

    for(var i=0;i<rows.length;i++){
      var r=rows[i];
      var a=seg(t,0.9+i*1.25,1.9+i*1.25);
      var wd=Math.max(5,px(r.lg)-x0);
      var grow=wd*(0.12+0.88*seg(t,0.9+i*1.25,2.2+i*1.25));
      T(ctx,r.lab,40,r.y-14,{size:13.5,color:i===3?GOLD:'#dbe2ef',alpha:a,w:600});
      T(ctx,r.val,40,r.y+8,{size:10.5,color:i===3?'#b99a6a':'#7d879c',alpha:a,mono:true});
      T(ctx,r.note,40,r.y+28,{size:10.5,color:'#5f6880',alpha:a});
      R(ctx,x0,r.y-6,grow,24,4,{fill:i===3?'rgba(240,172,95,.26)':r.c,alpha:a*0.9});
      if(i===3)R(ctx,x0,r.y-6,wd,24,4,{stroke:'rgba(240,172,95,.7)',lw:1.2,alpha:a});
      if(wd<12) D(ctx,x0+wd,r.y+6,3,r.c,{alpha:a,glow:8});
      if(i<rows.length-1) L(ctx,40,r.y+44,x1,r.y+44,{color:'rgba(255,255,255,.04)',lw:1,alpha:a});
    }

    T(ctx,'同一道题，同一安全等级：从 10⁴⁴ 到 10⁰ GiB 的十个数量级',500,522,
      {size:11.5,color:'#6b7488',align:'center',alpha:seg(t,12.6,14.2)});
  }
});

/* ============================================================
   场景 8 —— 对比
   ============================================================ */
SC.push({
  dur:14,
  caps:[
    [0,3.4,'同一道语句，同样的 100 比特安全。'],
    [3.4,7,'密文七点八八 GiB，他们的是一千一百亿 GiB。'],
    [7,10.4,'加密两百亿次域乘法，几秒钟。'],
    [10.4,14,'十个数量级，十个数量级，六个数量级。']
  ],
  draw:function(ctx,t){
    var rows=[
      {y:96,lab:'密文尺寸',p:'7.88 GiB',h:'1.1 × 10¹¹ GiB',ratio:'÷ 10¹⁰',pl:0.896,hl:11.04},
      {y:246,lab:'加密（域乘法）',p:'2.0 × 10¹⁰',h:'2.6 × 10²⁰',ratio:'÷ 10¹⁰',pl:10.30,hl:20.41},
      {y:396,lab:'解密（域乘法，期望）',p:'8.6 × 10⁹',h:'1.2 × 10¹⁶',ratio:'÷ 10⁶·⁵',pl:9.93,hl:16.08}
    ];
    var maxl=20.5, lx0=60, lx1=930;
    function px(l){ return lx0+(l/maxl)*(lx1-lx0); }

    for(var i=0;i<rows.length;i++){
      var r=rows[i], a=seg(t,0.5+i*1.1,1.5+i*1.1);
      T(ctx,r.lab,60,r.y,{size:11.5,color:'#6f7a91',alpha:a,ls:.5});

      T(ctx,'Praxis',60,r.y+36,{size:12,color:'#8a7450',alpha:a,w:600});
      T(ctx,r.p,60,r.y+66,{size:27,color:GOLD,alpha:a,w:600});

      T(ctx,'对照：Hair–Sahai 基本构造',360,r.y+36,{size:12,color:'#5c6880',alpha:a});
      T(ctx,r.h,360,r.y+66,{size:21,color:'#8d96ab',alpha:a});

      /* 比值 */
      var ca=seg(t,1.6+i*1.1,2.4+i*1.1);
      R(ctx,760,r.y+34,170,30,8,{fill:'rgba(240,172,95,.07)',stroke:'rgba(240,172,95,.28)',lw:1,alpha:ca});
      T(ctx,r.ratio,845,r.y+49,{size:14,color:GOLD,align:'center',alpha:ca,mono:true,w:600});

      /* 对数标尺 */
      var ra=seg(t,1.2+i*1.1,2.2+i*1.1);
      L(ctx,lx0,r.y+106,lx1,r.y+106,{color:'rgba(255,255,255,.09)',lw:1,alpha:ra});
      for(var g=0;g<=20;g+=5){
        L(ctx,px(g),r.y+102,px(g),r.y+110,{color:'rgba(255,255,255,.16)',lw:1,alpha:ra});
      }
      D(ctx,px(r.hl),r.y+106,4,'#8d96ab',{alpha:ra});
      D(ctx,px(r.pl),r.y+106,4.5,GOLD,{alpha:ra,glow:12});
    }

    T(ctx,'下方细线：同一对数标尺，10⁰ —— 10²⁰',930,58,{size:11,color:'#5f6880',align:'right',alpha:seg(t,0.4,1.4)});
  }
});

/* ============================================================
   场景 9 —— 信任的层次
   ============================================================ */
SC.push({
  dur:14,
  caps:[
    [0,3.6,'这份证明，假设了什么？'],
    [3.6,7,'双线性通用群、随机预言机，还有 Module-SIS。'],
    [7,10.4,'论文还在 Lean 4 里，机器检查了证明。'],
    [10.4,14,'代价是：诚实的初始化。']
  ],
  draw:function(ctx,t){
    var layers=[
      {y:96,title:'双线性通用群模型',sub:'只允许群运算，看不到元素的表示',c:BLUE},
      {y:186,title:'随机预言机模型',sub:'把哈希当成理想黑箱',c:TEAL},
      {y:276,title:'Module-SIS',sub:'格上的短向量问题，参数按最佳已知攻击标定',c:PURPLE}
    ];
    for(var i=0;i<layers.length;i++){
      var l=layers[i];
      var a=seg(t,0.4+i*0.7,1.4+i*0.7);
      var ox=(1-a)*-26;
      R(ctx,70+ox,l.y,540,66,12,{fill:'rgba(255,255,255,.028)',stroke:'rgba(255,255,255,.09)',lw:1,alpha:a});
      R(ctx,70+ox,l.y,4,66,2,{fill:l.c,alpha:a*0.8});
      T(ctx,l.title,94+ox,l.y+24,{size:15,color:'#e2e8f4',alpha:a,w:600});
      T(ctx,l.sub,94+ox,l.y+46,{size:12,color:'#8e97ab',alpha:a});
      if(i<layers.length-1){
        A(ctx,340,l.y+70,340,l.y+88,{color:'rgba(255,255,255,.2)',lw:1,alpha:a,head:6});
      }
    }

    /* Lean 卡片 */
    var la=seg(t,3.4,4.6);
    if(la>0){
      R(ctx,680,96,270,246,14,{fill:'rgba(131,193,103,.05)',stroke:'rgba(131,193,103,.28)',lw:1,alpha:la});
      T(ctx,'Lean 4',704,128,{size:16,color:GREEN,alpha:la,w:600});
      T(ctx,'机器检查的证明',704,150,{size:11.5,color:'#7d879c',alpha:la});
      var items=[
        ['✓  正确性（定理 5.6）',172],
        ['✓  抽取性（定理 5.9）',206],
        ['✓  真实参数下',240],
        ['✓  只依赖 3 条标准公理',274]
      ];
      for(var k=0;k<items.length;k++){
        T(ctx,items[k][0],704,items[k][1],{size:12,color:'#a9c9a0',alpha:la*seg(t,4.0+k*0.25,4.8+k*0.25)});
      }
      T(ctx,'github.com/psivesely/praxis-lean',704,316,{size:10,color:'#5f6880',alpha:la,mono:true});
    }

    /* 警告 */
    var wa=seg(t,9.0,10.6);
    if(wa>0){
      R(ctx,70,392,880,110,14,{fill:'rgba(252,98,85,.045)',stroke:'rgba(252,98,85,.35)',lw:1,alpha:wa});
      T(ctx,'⚠  前提：诚实的 Groth16 初始化（setup）',94,424,{size:14,color:RED,alpha:wa,w:600});
      T(ctx,'谁保留了 setup 的陷阱门，谁就能为任何公开输入伪造证明——也就解开了这把钥匙下的全部密文。',
        94,454,{size:12.5,color:'#c9a6a2',alpha:wa});
      T(ctx,'这不是实现瑕疵，是这类构造的结构性前提。',94,478,{size:12.5,color:'#8e7a80',alpha:wa});
    }
  }
});

/* ============================================================
   场景 10 —— 时间线与结语
   ============================================================ */
SC.push({
  dur:15,
  caps:[
    [0,3.6,'2013 年，它只是一个定义。'],
    [3.6,7,'2020 年，第一个可行性结果，代价是不可计算。'],
    [7,10.4,'2026 年，它第一次落到了笔记本上。'],
    [10.4,15,'它先告诉你存在，再告诉你长什么样。']
  ],
  draw:function(ctx,t){
    var y=196, x0=110, x1=900;
    var la=seg(t,0.3,2.0);
    L(ctx,x0,y,lerp(x0,x1,la),y,{color:'rgba(255,255,255,.14)',lw:1.5,alpha:1});

    var nodes=[
      {x:170,year:'2013',name:'GGSW13',sub:'提出见证加密',up:true,c:'#8d96ab'},
      {x:400,year:'2020',name:'线性码假设',sub:'又一个可行性结果',up:false,c:'#8d96ab'},
      {x:630,year:'2026',name:'Hair–Sahai',sub:'秩间隙 · 10¹¹ GiB',up:true,c:'#8d96ab'},
      {x:850,year:'2026',name:'Praxis',sub:'7.88 GiB',up:false,c:GOLD}
    ];
    for(var i=0;i<nodes.length;i++){
      var n=nodes[i];
      var a=seg(t,2.2+i*0.9,3.0+i*0.9);
      var last=(i===nodes.length-1);
      D(ctx,n.x,y,last?8:5.5,n.c,{alpha:a,glow:last?22:0});
      if(last&&a>0){
        var ph=((t*0.5)%1);
        ring(ctx,n.x,y,12+ph*26,GOLD,{alpha:(1-ph)*0.4*a,lw:1});
      }
      L(ctx,n.x,y+(n.up?-10:10),n.x,n.up?y-16:y+16,{color:'rgba(255,255,255,.18)',lw:1,alpha:a});
      var ty=n.up?y-40:y+30;
      T(ctx,n.year,n.x,ty,{size:10.5,color:'#5f6880',align:'center',alpha:a,mono:true});
      T(ctx,n.name,n.x,ty+(n.up?-20:20),{size:14,color:last?GOLD:'#c6cddc',align:'center',alpha:a,w:last?600:500});
      T(ctx,n.sub,n.x,ty+(n.up?-40:40),{size:11,color:last?'#b99a6a':'#6f7a91',align:'center',alpha:a});
    }

    var qa=seg(t,8.6,10.4);
    if(qa>0){
      T(ctx,'它先告诉你「存在」，再告诉你「长什么样」。',500,392,
        {size:26,color:'#e7ecf6',align:'center',alpha:qa,w:400});
      T(ctx,'—— 关于数学与工程之间那条路',500,436,{size:12.5,color:'#6f7a91',align:'center',alpha:qa});
      L(ctx,430,466,570,466,{color:'rgba(240,172,95,.28)',lw:1,alpha:qa});
      T(ctx,'Praxis · Practical Witness Encryption for NP · 2026',500,494,
        {size:10.5,color:'#4a5468',align:'center',alpha:seg(t,11.4,13),ls:1});
    }
  }
});

