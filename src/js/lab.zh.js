/* ============================================================
   1.5 演算台：把加密从头造一遍（𝔽₁₀₁）
   ============================================================ */
var LAB=(function(){
  'use strict';
  var P=101, INV2=51;
  var w=[1,1,0,1], r=[8,9,3,4], y=[22,2,16,46], KAP=13, ALPHA=7;
  var u=[1,1,0,1], up=[1,1,1,1];

  function Z(){return [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];}
  function outer(a,b){var M=Z();for(var i=0;i<4;i++)for(var j=0;j<4;j++)M[i][j]=a[i]*b[j]%P;return M;}
  function add(A,B){var M=Z();for(var i=0;i<4;i++)for(var j=0;j<4;j++)M[i][j]=(A[i][j]+B[i][j])%P;return M;}
  function sc(A,k){var M=Z();for(var i=0;i<4;i++)for(var j=0;j<4;j++)M[i][j]=(A[i][j]*k%P+P)%P;return M;}
  function dot(a,b){var s=0;for(var i=0;i<4;i++)s=(s+a[i]*b[i])%P;return s;}
  function sumM(M,f){var s=0;for(var i=0;i<4;i++)for(var j=0;j<4;j++)if(f(i,j))s+=M[i][j];return s;}

  var W=outer(w,w);
  var S=sc(add(outer(y,r),outer(r,y)),INV2);
  var C1=Z(); C1[1][3]=INV2; C1[3][1]=INV2; C1[0][0]=P-1;
  var C2=Z(); C2[2][1]=INV2; C2[1][2]=INV2; C2[2][3]=INV2; C2[3][2]=INV2;
  var Cs=[C1,C2];
  for(var jj=1;jj<=3;jj++){var Cj=Z();Cj[jj][jj]=1;Cj[0][jj]=P-INV2;Cj[jj][0]=P-INV2;Cs.push(Cj);}
  var Mask=Z(); for(var t=0;t<Cs.length;t++) Mask=add(Mask,Cs[t]);
  var KEY=Z(); KEY[0][0]=KAP;
  var T0=add(Mask,KEY);                       /* ⑤ 最小版本 */
  var T=add(S,T0);                            /* ⑦ 完整表 */
  var CCH=sc(add(outer(u,u),outer(up,up)),INV2);
  var CCHD=(function(){var M=[];for(var i=0;i<4;i++){var row=[];for(var j=0;j<4;j++){row.push(CCH[i][j]===INV2?'½':String(CCH[i][j]));}M.push(row);}return M;})();

  /* 骗子矩阵：秩 3，通过全部测试，且 (0,0) 格是 1 */
  var WS=[[1,0,1,0],[0,0,0,1],[1,0,1,0],[0,1,0,0]];
  var WSR=[]; for(var i2=0;i2<4;i2++){var s2=0;for(var j2=0;j2<4;j2++)s2+=WS[i2][j2]*r[j2];WSR.push(s2%P);}
  var yWSr=0; for(var i3=0;i3<4;i3++) yWSr=(yWSr+y[i3]*WSR[i3])%P;

  function maskOf(mu){var M=Z();for(var t=0;t<Cs.length;t++)M=add(M,sc(Cs[t],mu[t]));return M;}
  var psi=dot(y,w), rw=dot(r,w);
  var lam=(KAP+psi*rw)%P;                     /* 69 */
  var lamS=(KAP*yWSr+KAP*0)%P;                /* placeholder */
  var lamV0=(KAP*1+0)%P;                      /* 13 */
  var lamWS=(KAP*WS[0][0]+yWSr)%P;            /* 45 */

  /* 群：F_607* 里阶为 101 的子群，生成元 64（和 ⑩ 的实现一致） */
  function gpow(v){
    var r2=1,b=64,e=((v%P)+P)%P;   /* 指数模 101 = 群阶 */
    while(e>0){ if(e&1) r2=r2*b%607; b=b*b%607; e>>=1; }
    return r2;
  }

  /* ---------- 渲染工具 ---------- */
  function mat(vals,o){
    o=o||{};
    var s=o.size||40;
    var out='<div class="mgrid'+(o.gridCls?' '+o.gridCls:'')+'" style="grid-template-columns:16px repeat(4,'+s+'px);--s:'+s+'px">';
    out+='<div class="mh"></div>';
    for(var c=0;c<4;c++) out+='<div class="mh">'+c+'</div>';
    for(var i=0;i<4;i++){
      out+='<div class="mh">'+i+'</div>';
      for(var j=0;j<4;j++){
        var v=vals[i][j], cls='mcell';
        if(v===0||v==='0') cls+=' z';
        if(o.cls&&o.cls(i,j)) cls+=' '+o.cls(i,j);
        var tip=o.tip?o.tip(i,j):'';
        var dat=o.data?o.data(i,j):'';
        out+='<div class="'+cls+'"'+(tip?' title="'+tip+'"':'')+dat+'>'+v+'</div>';
      }
    }
    return out+'</div>';
  }
  function ml(box,text){ return '<div><div>'+box+'</div><div class="mlab">'+text+'</div></div>'; }
  var sel=function(i,j){ return w[i]===1&&w[j]===1; };

  var TOYSRC = `// ===== 玩具版 Praxis：完整加解密（约 115 行） =====
// Praxis(Q, P, G, TESTS)：命题在域 F_Q；群是 F_P* 里阶为 Q 的子群。

const Z = () => [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];

// 一条约束 a(w)·b(w) = w₀·c(w) 对应一个测试矩阵：
//   C = ½(abᵀ + baᵀ) − ½(e₀cᵀ + ce₀ᵀ)，〈C,W〉= 0 就是这条约束成立
function Cmat(Q, a, b, c) {
  const h = (Q + 1) / 2, M = Z();          // h = ½
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const ab = a[i] * b[j] + b[i] * a[j];
    const ec = (i === 0 ? c[j] : 0) + (j === 0 ? c[i] : 0);
    M[i][j] = ((ab - ec) * h % Q + Q) % Q;
  }
  return M;
}

// 命题：五条约束 + 三条布尔性
function tests(Q) {
  const e = (i) => [0,1,2,3].map(k => (k === i ? 1 : 0));
  const add = (u, v) => u.map((x, i) => (x + v[i]) % Q);
  const C = [
    [e(1), e(3), e(0)],                             // x·z = 1
    [e(2), add(e(1), e(3)), [0,0,0,0]],             // y·(x+z) = 0
    [e(1), e(2), [0,0,0,0]],                        // x·y = 0
    [add(e(1), e(2)), e(3), e(0)],                  // (x+y)·z = 1
    [add(add(e(1), e(2)), e(3)), e(0), [2,0,0,0]],  // x+y+z = 2
    [e(1), e(1), e(1)], [e(2), e(2), e(2)], [e(3), e(3), e(3)],  // 布尔性
  ];
  return C.map(([a, b, c]) => Cmat(Q, a, b, c));
}

function Praxis(Q, P, G, TESTS) {
  const INV2 = (Q + 1) / 2;
  const mod  = (x) => ((x % Q) + Q) % Q;
  const pw   = (b, e) => {
    let r = 1; b %= P;
    while (e > 0) { if (e & 1) r = r * b % P; b = b * b % P; e >>= 1; }
    return r;
  };
  const invP = (x) => pw(x, P - 2);            // 群元素的逆
  const seal = (v) => pw(G, mod(v));           // [v] = g^v
  const H    = (x) => mod(x * 37 + 11);        // 玩具哈希（真实是 SHA-256）

  // 掩码：命题的随机线性组合 M = Σ μₜ·Cₜ
  function mask(mu) {
    const M = Z();
    TESTS.forEach((C, t) => {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++)
        M[i][j] = mod(M[i][j] + mu[t] * C[i][j]);
    });
    return M;
  }
  // 搜索项 ½(yrᵀ + ryᵀ)
  function searchTerm(y, r) {
    const M = Z();
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++)
      M[i][j] = mod(INV2 * (y[i] * r[j] + r[i] * y[j]));
    return M;
  }

  // ---- 加密：只要命题，不要见证 ----
  function enc(y, r, kappa, msg, alpha, mu) {
    const Mk = mask(mu), S = searchTerm(y, r), T = [];
    for (let i = 0; i < 4; i++) {
      T.push([]);
      for (let j = 0; j < 4; j++) {
        let v = Mk[i][j] + S[i][j];
        if (i === 0 && j === 0) v += kappa;    // 钥匙藏在角落
        T[i].push(mod(v));
      }
    }
    const up = (A) => {
      const o = [];
      for (let i = 0; i < 4; i++) for (let j = i; j < 4; j++) o.push(A[i][j]);
      return o;
    };
    return {
      P: T, Mask: Mk, S,                          // 明文表与它的两部分（只给演示看）
      T: up(T).map(seal), Y: y.map(seal),         // 发布的群元素
      aT: up(T).map(v => seal(alpha * v)),
      aY: y.map(v => seal(alpha * v)),
      ak: seal(alpha * kappa),
      m: mod(msg + H(seal(kappa))),
    };
  }

  // ---- 沿矩阵 W 组合：密文里唯一的运算是「乘」 ----
  function comb(el, W) {
    let acc = 1, k = 0;
    for (let i = 0; i < 4; i++) for (let j = i; j < 4; j++, k++) {
      const c = i === j ? W[i][j] : 2 * W[i][j];
      acc = acc * pw(el[k], c) % P;
    }
    return acc;
  }

  // ---- 解密：需要见证 w ----
  function dec(ct, w) {
    const W   = w.map(a => w.map(b => a * b));   // W = w·wᵀ
    const Lam = comb(ct.T, W);                   // [κ + ψ·r(w)]
    const Psi = ct.Y.reduce((s, e, i) => s * pw(e, w[i]) % P, 1);
    const La  = comb(ct.aT, W) * invP(pw(ct.ak, W[0][0])) % P;  // 表副本
    const Pa  = ct.aY.reduce((s, e, i) => s * pw(e, w[i]) % P, 1);  // y 副本
    for (let r = 0; r <= 40; r++) {              // 搜索 r̂
      if (pw(Pa, r) === La) {
        const key = Lam * invP(pw(Psi, r)) % P;  // 这就是 [κ]
        return { r, key, Lam, Psi, La, Pa, msg: mod(ct.m - H(key)) };
      }
    }
    return { r: null, Lam, Psi, La, Pa };        // 搜不到
  }

  return { enc, dec, seal, mask, searchTerm, H };
}

const SMALL = Praxis(101, 607, 64, tests(101));
const BIG   = Praxis(10007, 240169, 205555, tests(10007));
return { Praxis, tests, SMALL, BIG };`;

  function codeHTML(src){
    var esc=src.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return esc.replace(/(\/\/[^\n]*)/g,'<span class="c">$1</span>');
  }
  var TOYF=new Function(TOYSRC);
  var TOY=TOYF();
  var SMALL=TOY.SMALL, BIG=TOY.BIG;

  var steps=[];
  /* ① 程序 → 方程 */
  steps.push({tab:'① 程序→方程',src:'base',render:function(){
    return '<div class="lab-h">先看一段程序，再把它变成方程</div>'+
    '<div class="lab-sub">见证加密要回答的问题，可以写成一句大白话：<b>我知道一个输入，能让这段程序返回 true。</b></div>'+
    '<div class="lab-cols">'+
      '<div class="lab-card" style="flex:1 1 330px">'+
        '<div class="lab-k">PROGRAM</div>'+
        '<pre class="code"><span class="k">fn</span> p(x: <span class="k">bool</span>, y: <span class="k">bool</span>, z: <span class="k">bool</span>) -&gt; <span class="k">bool</span> {\n    (x &amp;&amp; z) &amp;&amp; !(y &amp;&amp; (x || z))\n}</pre>'+
        '<div class="lab-dim">见证：<code>x=1, y=0, z=1</code> → (1&amp;&amp;1) &amp;&amp; !(0&amp;&amp;1) = <b style="color:#83C167">true</b></div>'+
      '</div>'+
      '<div class="lab-card" style="flex:1 1 330px">'+
        '<div class="lab-k">翻译规则</div>'+
        '<div class="lab-dim" style="margin-bottom:8px">布尔值当 0/1 用，<code>&amp;&amp;</code> 就是乘法：</div>'+
        '<table class="lab-t" style="margin-top:0">'+
          '<tr><td>x &amp;&amp; z</td><td class="n">→ x·z = 1</td></tr>'+
          '<tr><td>!(y &amp;&amp; (x||z))</td><td class="n">→ y·(x+z) = 0</td></tr>'+
        '</table>'+
        '<div class="lab-dim" style="margin-top:10px">第二行：x、z 只取 0/1 时，「x||z 为假」和「x+z=0」是同一件事；<br>所以 y·(x+z)=0 就是「y 与 (x||z) 不同时成立」。</div>'+
      '</div>'+
    '</div>'+
    '<div class="lab-h" style="margin-top:26px">同样的规则适用于任何电路</div>'+
    '<table class="lab-t">'+
      '<tr><th style="width:30%">门</th><th style="width:30%">方程</th><th>说明</th></tr>'+
      '<tr><td>o = a &amp;&amp; b</td><td class="n">o = a·b</td><td>与，就是乘法</td></tr>'+
      '<tr><td>o = a || b</td><td class="n">o = a + b − a·b</td><td>或，等于相加再减掉重叠的那一份</td></tr>'+
      '<tr><td>o = !a</td><td class="n">o = 1 − a</td><td>非，就是 1 减</td></tr>'+
      '<tr><td>每个变量 v</td><td class="n">v·v = v</td><td>钉死在 0 或 1 上</td></tr>'+
    '</table>'+
    '<div class="lab-note">每个门一条方程，输出门再加一条「= 1」。这套编码对应的问题是<b>电路可满足性</b>，而它是 NP 完全的——<br>所以「任何 NP 命题」都能这样写，包括一段 Rust 程序（先编译成电路）。</div>'+
    '<div class="lab-h" style="margin-top:26px">但方程还不够：在 𝔽₁₀₁ 里 x·z=1 还有别的解</div>'+
    '<div class="lab-sub">比如 x=2, z=51 也让乘积等于 1 —— 可程序不接受 2。所以要为每个未知数钉一条<b>布尔性约束</b>：</div>'+
    '<div class="chain" style="margin-top:4px">w₁·w₃ = 1　　<span class="m">← 第一个条件成立</span><br>'+
      'w₂·(w₁+w₃) = 0　　<span class="m">← 第二个条件成立</span><br>'+
      'wⱼ·wⱼ = wⱼ　(j=1,2,3)　　<span class="m">← 每个 w 只能是 0 或 1</span></div>'+
    '<div class="lab-note">五条方程，三个未知数，<b>只有一个解</b>：w = (1,1,0,1)。<br>'+
    '注意：真正的系统里有几十万个未知数，但结构完全一样——只是这里的数字小到能手算。</div>'+
    '<div class="takeaway">接下来只要回答三个问题：<b>方程怎么变成矩阵</b>（②③）、<b>矩阵怎么变成密文</b>（④⑤⑥）、<b>密文怎么变回答案</b>（⑦）。</div>';
  }});

  /* ② 方程 → 矩阵（推导） */
  steps.push({tab:'② 方程→矩阵',src:'core',render:function(){
    return '<div class="lab-h">一步代数：所有二次式，都是对同一张表的加权求和</div>'+
    '<div class="lab-sub">整篇论文的地基就在下面这三行。它只用到一件事：乘积可以当成独立的变量来看。</div>'+
    '<div class="lab-cols">'+
      '<div class="lab-card" style="flex:1 1 300px">'+
        '<div class="lab-k">STEP 1 · 让常数 1 也变成变量</div>'+
        '<div class="vec">w = (w₀, w₁, w₂, w₃)，令 <b>w₀ = 1</b></div>'+
        '<div class="lab-dim">于是 <code>w₁·w₃ = 1</code> 可以写成 <code>w₁·w₃ = w₀</code>——<br>两边都是「两个一次式相乘」，形式统一了。</div>'+
      '</div>'+
      '<div class="lab-card" style="flex:1 1 300px">'+
        '<div class="lab-k">STEP 2 · 把乘积记进矩阵</div>'+
        '<div class="vec">W[i][j] := wᵢ · wⱼ</div>'+
        '<div class="lab-dim">16 个格子，每格是一个乘积。<br>此时 W 还只是「w 的乘方表」。</div>'+
      '</div>'+
    '</div>'+
    '<div class="lab-h" style="margin-top:26px">STEP 3 · 任何二次式 = 对 W 的一次线性组合</div>'+
    '<div class="chain" style="font-size:13.5px">'+
      'a(w)·b(w) = (Σᵢ aᵢwᵢ) · (Σⱼ bⱼwⱼ)<br>'+
      '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= Σᵢ Σⱼ (aᵢ·bⱼ) · (wᵢwⱼ)<br>'+
      '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= Σᵢ Σⱼ C[i][j] · W[i][j]　　<span class="m">其中 C = a·bᵀ（一个公开矩阵）</span><br>'+
      '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= <span class="ip">〈C , W〉</span>　　<span class="g">← 系数全公开，未知的只有 W</span>'+
    '</div>'+
    '<div class="lab-sub" style="margin-top:16px">每条约束都能写成 <span class="ip">〈Cₜ , W〉</span> = 0。把 Cₜ 展开，它实际上只是一句话：<b>某两个格子必须相等</b>。</div>'+
    '<table class="lab-t">'+
      '<tr><th>约束</th><th>⟨Cₜ,W⟩ = 0 展开后</th><th>读作</th></tr>'+
      '<tr><td>w₁·w₃ = w₀</td><td>W₁₃ − W₀₀ = 0</td><td>第 1 行第 3 列 = 第 0 行第 0 列</td></tr>'+
      '<tr><td>w₂·(w₁+w₃) = 0</td><td>W₂₁ + W₂₃ = 0</td><td>第 2 行的两个格子加起来为 0</td></tr>'+
      '<tr><td>wⱼ·wⱼ = wⱼ</td><td>Wⱼⱼ − W₀ⱼ = 0</td><td>对角格 = 第 0 行对应格（j=1,2,3）</td></tr>'+
    '</table>'+
    '<div class="lab-note">这就是「线性测试」的字面意思：验证者只做加法和比较，<b>连一个 w 都不用碰</b>。<br>'+
    '（严格说，论文把 C 写成对称形式 ½(abᵀ+baᵀ)，这样密文只需发布上三角的格子；对对称的 W，两种写法算出来一样。）</div>'+
    '<div class="takeaway">下一步把数字代进去，看看这些格子长什么样。</div>';
  }});

  /* ③ 代入验证 */
  steps.push({tab:'③ 五条测试',src:'core',render:function(){
    var rows=[
      ['1','W₁₃ = W₀₀',W[1][3],W[0][0]],
      ['2','W₂₁ + W₂₃ = 0',(W[2][1]+W[2][3])%P,0],
      ['3','W₁₁ = W₀₁',W[1][1],W[0][1]],
      ['4','W₂₂ = W₀₂',W[2][2],W[0][2]],
      ['5','W₃₃ = W₀₃',W[3][3],W[0][3]]
    ];
    var s='<div class="lab-h">把 w = (1,1,0,1) 代进去：W = w·wᵀ</div>'+
      '<div class="lab-sub">第 (i,j) 格 = wᵢ·wⱼ。鼠标悬停能看到是哪两个数乘出来的。</div>'+
      '<div class="mrow">'+ml(mat(W,{size:44,
          tip:function(i,j){return 'W['+i+']['+j+'] = w'+i+'·w'+j+' = '+w[i]+'·'+w[j]+' = '+W[i][j];}}),'W')+
        '<div style="flex:1;min-width:300px">'+
          '<div class="vec" style="font-size:13px;line-height:2.1">第 0 行：1 1 0 1<br>第 1 行：1 1 0 1<br>第 2 行：0 0 0 0<br>第 3 行：1 1 0 1</div>'+
          '<div class="lab-dim" style="margin-top:10px">第 1 行与第 0 行完全相同，第 2 行整行为零（w₂=0）。<br>整个矩阵只是把向量 w <b>复印了四遍</b>——这叫<b style="color:#F0AC5F">秩 1</b>。</div>'+
        '</div></div>'+
      '<div class="lab-h" style="margin-top:24px">五条测试逐条核对</div>'+
      '<table class="lab-t"><tr><th>#</th><th>测试</th><th>左边算出来</th><th>右边</th><th>通过</th></tr>';
    for(var i=0;i<rows.length;i++){
      var ok=((rows[i][2]-rows[i][3])%P+P)%P===0;
      s+='<tr><td class="n">'+rows[i][0]+'</td><td>'+rows[i][1]+'</td><td class="c">'+rows[i][2]+
         '</td><td class="c">'+rows[i][3]+'</td><td class="c '+(ok?'ok':'bad')+'">'+(ok?'✓':'✗')+'</td></tr>';
    }
    s+='</table>'+
      '<div class="takeaway">测试全过 ⟹ 这是一个合法见证。<br>但注意：这些测试是<b>线性</b>的，所以「通过的矩阵」构成一个线性空间——里面还有别的住户。先记住这件事，⑧ 会用到。</div>';
    return s;
  }});


  /* ④ 群元素 */
  steps.push({tab:'④ 群元素',src:'base',render:function(){
    var sealed=[]; for(var i=0;i<4;i++){var row=[];for(var j=0;j<4;j++)row.push(gpow(T[i][j]));sealed.push(row);}
    var s13=gpow(3), s5=gpow(5), s8=gpow(8), s69=gpow(69), s143=gpow(143), s42=gpow(42);
    return '<div class="lab-h">换一个舞台：把数字封进群元素</div>'+
    '<div class="lab-sub">这张表必须发布出去，可又不能让人读出数。办法只有一个：<b>把每个数放进指数</b>。</div>'+
    '<div class="lab-cols">'+
      '<div class="lab-card" style="flex:1 1 300px">'+
        '<div class="lab-k">容器</div>'+
        '<div class="vec">[v] := g<sup>v</sup> mod 607　（g = 64，群阶 = 101）</div>'+
        '<div class="lab-dim">真实方案里 g 是椭圆曲线上的点，群阶约 2²⁵⁴。<br>这里用 𝔽₆₀₇* 里阶为 101 的子群，好让数字只有三位。</div>'+
      '</div>'+
      '<div class="lab-card" style="flex:1 1 300px">'+
        '<div class="lab-k">它能做的两件事</div>'+
        '<div class="vec" style="font-size:13px">[3] = '+s13+'　　[5] = '+s5+'<br>'+
        s13+' × '+s5+' = '+(s13*s5)+' ≡ '+(s13*s5%607)+' = [8]</div>'+
        '<div class="lab-dim">乘法 = 指数相加；幂同理：k·[v] = [k·v]。<br>指数在群阶 101 处回绕：[143] = ['+(143%101)+'] = '+s143+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="lab-h" style="margin-top:24px">于是整张表可以这样发出去（右：发布的密文）</div>'+
    '<div class="mrow">'+
      ml(mat(T,{size:36}),'T（加密者手里的数）')+
      '<div class="mop">→</div>'+
      ml(mat(sealed,{size:36}),'[T]（所有人看到的）')+
      '<div style="flex:1;min-width:220px"><div class="lab-dim">左边每一格都是一个小整数；右边是它的指数。<br><br>'+
      '没有人能从右边反推出左边——<b>唯一的办法是穷举指数</b>。101 个元素可以试完，2²⁵⁴ 个不行。</div></div>'+
    '</div>'+
    '<div class="lab-note">见证者要算 Σ T<sub>ij</sub>·W<sub>ij</sub>，而密文只让他做乘法与幂——正好就是「指数相加」。<br>'+
    '沿 wwᵀ 组合：Π [T<sub>ij</sub>]<sup>W<sub>ij</sub></sup> = [69] = <b>'+s69+'</b>。他没读出任何一个 T<sub>ij</sub>，却拿到了 69 的封印。</div>'+
    '<div class="takeaway">这一节的全部内容：<b>你能组合，但不能读出。</b>接下来只需要设计「组合出来是什么」。</div>';
  }});

  /* ⑤ 掩码从哪来 */
  steps.push({tab:'⑤ 掩码',src:'hs',render:function(){
    var rows=[
      ['1','W₁₃ = W₀₀','(1,3)=½ (3,1)=½ (0,0)=−1'],
      ['2','W₂₁ + W₂₃ = 0','(2,1)=½ (1,2)=½ (2,3)=½ (3,2)=½'],
      ['3','W₁₁ = W₀₁','(1,1)=1 (0,1)=−½ (1,0)=−½'],
      ['4','W₂₂ = W₀₂','(2,2)=1 (0,2)=−½ (2,0)=−½'],
      ['5','W₃₃ = W₀₃','(3,3)=1 (0,3)=−½ (3,0)=−½']
    ];
    var s='<div class="lab-h">掩码 M 不是一张随便的矩阵——它是把五条测试打包成一条</div>'+
      '<div class="lab-sub">第 ② 步里，每条测试都是一个公开矩阵 C<sub>t</sub>：⟨C<sub>t</sub>, W⟩ = 0 表示通过。五个 C<sub>t</sub> 长这样（只列非零项，½ 在 𝔽₁₀₁ 里是 51）：</div>'+
      '<table class="lab-t"><tr><th>#</th><th>测试</th><th>C<sub>t</sub> 的非零项 (i, j) = 值</th></tr>';
    for(var k=0;k<rows.length;k++)
      s+='<tr><td class="n">'+rows[k][0]+'</td><td>'+rows[k][1]+'</td><td class="n" style="font-size:11.5px">'+rows[k][2]+'</td></tr>';
    s+='</table>'+
      '<div class="why"><div class="whylab">为什么第 0 行是 −½，而不是 −1？</div>'+
        '因为内积是<b>双下标</b>求和：〈C, W〉 = Σᵢⱼ Cᵢⱼ·Wᵢⱼ，而 W 是对称的，'+
        '(0,j) 和 (j,0) 这两格会各算一次。<br>'+
        '所以要在 (0,j) 和 (j,0) 各放 <b>−½</b>，两次加起来才是 −1：<br>'+
        '<span class="m">〈C,W〉 = 1·Wⱼⱼ + (−½)·W₀ⱼ + (−½)·Wⱼ₀ = Wⱼⱼ − W₀ⱼ</span><br>'+
        '拿 w = (1,1,0,1)、j = 1 试：<span class="m">1·1 + (−½)·1 + (−½)·1 = 0 ✓</span>；'+
        '若写成 −1 和 −1，就成了 <span class="bad">1 − 1 − 1 = −1 ✗</span>。<br>'+
        '这就是公式里 <b>½(abᵀ + baᵀ)</b> 那个 ½ 的来历：先把两条对称路径平均一下，双下标求和才正好等于 (a·w)(b·w)。'+
      '</div>'+
      '<div class="lab-h" style="margin-top:24px">打包方式：加权求和，权重 μ 由加密者随机取</div>'+
      '<div class="chain" style="font-size:13.5px">M = μ₁C₁ + μ₂C₂ + μ₃C₃ + μ₄C₄ + μ₅C₅<br>'+
      '<span class="c">于是</span>　〈M, W〉 = μ₁〈C₁,W〉 + … + μ₅〈C₅,W〉</div>'+
      '<div class="murow"><span>权重</span>'+
        '<div class="mu"><i>μ₁</i><input type="number" id="mu0" value="1"></div>'+
        '<div class="mu"><i>μ₂</i><input type="number" id="mu1" value="1"></div>'+
        '<div class="mu"><i>μ₃</i><input type="number" id="mu2" value="1"></div>'+
        '<div class="mu"><i>μ₄</i><input type="number" id="mu3" value="1"></div>'+
        '<div class="mu"><i>μ₅</i><input type="number" id="mu4" value="1"></div>'+
        '<button class="btn2" id="muReset" style="margin-top:0;align-self:flex-end">复原成 1</button></div>'+
      '<div class="mrow" style="margin-top:18px;align-items:flex-start">'+
        '<div id="mGrid"></div>'+
        '<div style="flex:1;min-width:330px">'+
          '<div class="lab-dim" style="margin-bottom:8px">点左边 M 的任意一格，看这一格是怎么算出来的：</div>'+
          '<div class="chain" id="mInspect" style="font-size:12.5px;margin-top:0">—</div>'+
          '<div class="lab-dim" id="mWhy" style="margin-top:10px"></div>'+
        '</div>'+
      '</div>'+
      '<div class="lab-cols" style="margin-top:20px">'+
        '<div class="lab-card" style="flex:1 1 300px"><div class="lab-k">W 通过全部测试</div>'+
          '<div class="lab-dim" style="font-size:12.5px">每个 〈C<sub>t</sub>,W〉 = 0 ⟹ 〈M,W〉 = 0。不管 μ 怎么取，恒为 0。</div></div>'+
        '<div class="lab-card" style="flex:1 1 300px"><div class="lab-k">W 有一条没过</div>'+
          '<div class="lab-dim" style="font-size:12.5px">至少一项非 0，乘积再随机，这个和就是<b>均匀随机</b>的——在群里等于把元素彻底打散。</div></div>'+
      '</div>'+
      '<div class="lab-note">后面几步固定用 <b>μ = (1,1,1,1,1)</b> 的这张 M；上面的输入只是让你把公式跑一遍，不会影响别的步骤。<br>'+
      '为什么 μ 必须随机？固定成 1 时，某些「没过全部测试」的 W 也可能让五项残差恰好抵消，⟨M,W⟩ 又变回 0——第 ⑦ 步会看到这种矩阵。</div>'+
      '<div class="takeaway">M 不是新东西，它是 C 的加权和；〈M,W〉 就是「把 W 代进每条测试，再用随机系数称重求和」。</div>';
    return s;
  },mount:function(root){
    var mu=[1,1,1,1,1], sel={i:1,j:3};
    var gridEl=root.querySelector('#mGrid'), inspEl=root.querySelector('#mInspect'),
        whyEl=root.querySelector('#mWhy');
    function cur(){ return maskOf(mu); }
    function drawGrid(){
      var M=cur();
      gridEl.innerHTML=mat(M,{size:44,cls:function(a,b){return (a===sel.i&&b===sel.j)?'hi':'';},
        data:function(a,b){return ' data-ij="'+a+','+b+'"';}});
      gridEl.style.cursor='pointer';
      var div=document.createElement('div');
      div.className='mlab'; div.textContent='M（μ 如上）';
      gridEl.appendChild(div);
    }
    function drawInsp(){
      var M=cur(), i=sel.i, j=sel.j;
      var terms='', nums='', numsI='', nz=[], raw=0, half=false;
      for(var t=0;t<5;t++){
        var v=Cs[t][i][j], sv=v, disp;
        if(v===INV2){ half=true; disp='½'; }
        else if(v===P-INV2){ half=true; disp='−½'; }
        else if(v>P/2){ sv=v-P; disp=String(sv); }
        else { disp=String(v); }
        terms+=(t?' + ':'')+'μ'+(t+1)+'·'+disp;
        nums+=(t?' + ':'')+sv;
        numsI+=(t?' + ':'')+mu[t]+'·'+sv;
        raw+=mu[t]*sv;
        if(v!==0) nz.push('C'+(t+1)+' 在这一格是 '+disp);
      }
      var tail=(raw!==M[i][j])?('= '+raw+' ≡ '+M[i][j]+'　(mod '+P+')'):('≡ '+M[i][j]+'　(mod '+P+')');
      if(half) tail+='<br><span class="m">½ ≡ 51，−½ ≡ 50（因为 2·51 = 102 ≡ 1）</span>';
      inspEl.innerHTML='M['+i+']['+j+'] = '+terms+'<br>'+
        '<span class="m">= '+numsI+'</span><br>'+
        '<span class="g">'+tail+'</span>';
      whyEl.innerHTML=nz.length?('这一格只有 '+nz.join('、')+'，其余四个 C 在这里都是 0。<br>所以 M['+i+']['+j+'] 就是它们的加权和。')
        :'这一格五个 C 全是 0，所以 M 在这里也是 0。';
    }
    function draw(){ drawGrid(); drawInsp(); }
    gridEl.addEventListener('click',function(e){
      var t=e.target.closest('[data-ij]');
      if(!t) return;
      var p=t.getAttribute('data-ij').split(',');
      sel={i:+p[0],j:+p[1]};
      draw();
    });
    for(var t2=0;t2<5;t2++){
      (function(k){
        root.querySelector('#mu'+k).addEventListener('input',function(e){
          var v=parseInt(e.target.value,10);
          if(isNaN(v)) v=0;
          v=((v%P)+P)%P;
          mu[k]=v; draw();
        });
      })(t2);
    }
    root.querySelector('#muReset').addEventListener('click',function(){
      mu=[1,1,1,1,1];
      for(var k=0;k<5;k++) root.querySelector('#mu'+k).value='1';
      draw();
    });
    draw();
  }});

  /* ⑤ 最小版本 */
  steps.push({tab:'⑥ 最小版',src:'hs',render:function(){
    var sealedT0=[]; for(var i=0;i<4;i++){var row=[];for(var j=0;j<4;j++)row.push(gpow(T0[i][j]));sealedT0.push(row);}
    var sK=gpow(KAP), hk=(sK*37+11)%P, m0=42, mt=(m0+hk)%P;
    return '<div class="lab-h">最小版本 v0：只用「掩码 + 钥匙」</div>'+
    '<div class="lab-sub">需求只有一个：见证者沿 wwᵀ 组合时，要拿到 κ。把 κ 放在 (0,0) 格——因为 w₀ = 1，所以 W₀₀ 恒等于 1。</div>'+
    '<div class="mrow">'+
      ml(mat(Mask,{size:40,cls:function(){return 'hi3';}}),'掩码 M')+
      '<div class="mop">+</div>'+
      ml(mat(KEY,{size:40,cls:function(i,j){return (i===0&&j===0)?'hi':'';}}),'钥匙 κe₀e₀ᵀ')+
      '<div class="mop">=</div>'+
      ml(mat(T0,{size:40,cls:function(i,j){return (i===0&&j===0)?'hi':'';}}),'明文表 T₀')+
      '<div style="flex:1;min-width:190px"><div class="lab-dim">这是<b>加密者自己算出来的数</b>，还躺在纸上。<br>如果他照原样发出去，(0,0) 格里就明写着 κ。</div></div>'+
    '</div>'+
    '<div class="lab-h" style="margin-top:26px">所以发出去的是它的「封印」——把每格放进指数</div>'+
    '<div class="mrow">'+
      ml(mat(T0,{size:36}),'T₀（只在他手里）')+
      '<div class="mop">→</div>'+
      ml(mat(sealedT0,{size:36,cls:function(i,j){return (i===0&&j===0)?'hi':'';}}),'[T₀]（发布出去）')+
      '<div style="flex:1;min-width:250px">'+
        '<div class="chain" style="margin-top:0;font-size:12.5px">ct₀ = {<br>'+
        '&nbsp;&nbsp;[T₀ᵢⱼ] 10 个群元素（上三角）<br>'+
        '&nbsp;&nbsp;m̃ = m ⊕ H([κ])　<span class="m">（玩具里用加法代替 XOR）</span><br>}'+
        '</div>'+
        '<div class="lab-dim" style="margin-top:8px">这一版里 <b>没有 y、没有 r、没有 α 副本</b>——那些都是后面才加的。此刻密文只有这两样东西。</div>'+
      '</div>'+
    '</div>'+
    '<div class="chain" style="margin-top:18px">见证者拿到密文，做一次组合（在群里是乘法，在指数上是加法）：<br>'+
      '<span class="c">群里：</span>Π [T₀ᵢⱼ]<sup>Wᵢⱼ</sup> = <b>['+gpow(13)+']</b>　　<span class="m">（他不会看到指数，只拿到这个元素）</span><br>'+
      '<span class="c">指数上：</span>〈T₀, wwᵀ〉 = 〈M, wwᵀ〉 + κ·W₀₀ = 0 + κ = <b>13</b><br>'+
      '<span class="m">掩码项为 0（w 通过全部测试）；角落项就是 κ 本身。于是 [κ] 到手，m̃ 一解就是 m。</span></div>'+
    '<div class="lab-note">拿数字走一遍：κ = 13 → [κ] = '+sK+' → H([κ]) = '+hk+' → m̃ = 42 + '+hk+' = '+(42+hk)+' ≡ '+mt+'（mod 101）；解回来 42 ✓。<br>'+
    '他甚至不需要搜索——组合出来就是钥匙。</div>'+
    '<div class="takeaway">v0 完成了需求，但它只保证了<b>「通过测试的人拿到 κ」</b>，没保证<b>「通过测试的人就是见证者」</b>。下一节看看别人能不能也这么干。</div>';
  }});

  /* ⑥ 漏洞 */
  steps.push({tab:'⑦ 漏洞',src:'hs',render:function(){
    var rows=[
      ['1','W₁₃ = W₀₀',WS[1][3],WS[0][0]],
      ['2','W₂₁ + W₂₃ = 0',(WS[2][1]+WS[2][3])%P,0],
      ['3','W₁₁ = W₀₁',WS[1][1],WS[0][1]],
      ['4','W₂₂ = W₀₂',WS[2][2],WS[0][2]],
      ['5','W₃₃ = W₀₃',WS[3][3],WS[0][3]]
    ];
    var s='<div class="lab-h">漏洞：一个不是见证的矩阵，也通过全部测试</div>'+
      '<div class="lab-sub">下面这个 0/1 矩阵 W* 没有任何见证能产生它（见证只有一个），但五条测试它全过。</div>'+
      '<div class="mrow">'+ml(mat(WS,{size:44,cls:function(i,j){return (i===0&&j===0)?'hi':'';}}),'W*')+
        '<div style="flex:1;min-width:300px"><table class="lab-t" style="margin-top:0"><tr><th>#</th><th>测试</th><th>左</th><th>右</th><th></th></tr>';
    for(var i=0;i<rows.length;i++){
      var ok=((rows[i][2]-rows[i][3])%P+P)%P===0;
      s+='<tr><td class="n">'+rows[i][0]+'</td><td>'+rows[i][1]+'</td><td class="c">'+rows[i][2]+
         '</td><td class="c">'+rows[i][3]+'</td><td class="c '+(ok?'ok':'bad')+'">'+(ok?'✓':'✗')+'</td></tr>';
    }
    s+='</table></div></div>'+
      '<div class="chain">攻击者拿它去组合 v0 的密文：<br>'+
        '〈T₀, W*〉 = 〈M, W*〉 + κ·W*₀₀ = 0 + κ·1 = <b>13 = κ</b></div>'+
      '<div class="lab-note">它甚至不需要知道 r、y、r(w) 中的任何一个。<b>v0 被彻底攻破。</b><br>'+
      '症结在这里：v0 只检查了「你通过测试」，没检查「你是那个见证」。而通过的矩阵构成一个线性空间，里面住着一大群 W*。</div>'+
      '<div class="takeaway">漏掉的那一项，必须让「通过测试」和「拿到钥匙」之间<b>隔着一段只能靠猜才能走完的路</b>。</div>';
    return s;
  }});

  /* ⑦ 补丁：搜索项 */
  steps.push({tab:'⑧ 打补丁',src:'hs',render:function(){
    return '<div class="lab-h">补上第三项：让通过测试的人也得先猜一个数</div>'+
    '<div class="lab-sub">加一项 ½(y rᵀ + r yᵀ)：y 是随机向量，r 是小整数向量。组合时它会冒出一个只有知道 w 才能消掉的东西。</div>'+
    '<div class="mrow">'+
      ml(mat(S,{size:36,cls:function(){return 'hi2';}}),'搜索项')+
      '<div class="mop">+</div>'+
      ml(mat(T0,{size:36}),'掩码 + 钥匙')+
      '<div class="mop">=</div>'+
      ml(mat(T,{size:36,cls:function(i,j){return (i===0&&j===0)?'hi':'';}}),'完整表 T')+
    '</div>'+
    '<div class="chain" style="margin-top:16px">对见证者：<br>'+
      '〈T, wwᵀ〉 = κ + y(w)·r(w) = 13 + 70·21 = 1483 ≡ <b>69</b><br>'+
      '<span class="m">y(w) = 70 他能自己算（他手里有 w 和全部 [yᵢ]），但 r(w) = 21 他不知道。</span><br><br>'+
      '对骗子（秩 3 的 W*）：<br>'+
      '〈T, W*〉 = κ + yᵀW*r = 13 + 32 = <b>45</b><br>'+
      '<span class="m">yᵀW*r 里藏着 rank(W*) = 3 个独立未知数。</span></div>'+
    '<div class="lab-note"><b>密文也跟着变</b>：表从 T₀ 换成 T，还要多发布 [yᵢ]（否则见证者算不出 ψ）。<br>'+
    '同一次改动，对诚实者是「1 个未知数」，对骗子是「3 个未知数」。<br>'+
    '这就是全部的安全杠杆：<b>秩 = 你必须同时猜中的数的个数</b>。把最小秩抬高，骗子要同时猜的数就变多，猜中概率 g<sup>−d</sup> 指数式下降。</div>'+
    '<div class="takeaway">现在：诚实者要找一个整数（下一步），骗子要同时找 d 个整数。差值就是安全性。</div>';
  }});

  /* ⑨ 秩 = 未知数个数 */
  steps.push({tab:'⑨ 秩',src:'core',render:function(){
    var a1=(y[0]+y[2])%P, a2=y[1], a3=y[3];
    var b1=(r[0]+r[2])%P, b2=r[3], b3=r[1];
    var sum=a1*b1+a2*b2+a3*b3, sumM=sum%P;
    return '<div class="lab-h">为什么「秩」等于「你必须同时猜中的数的个数」</div>'+
    '<div class="lab-sub">搜索项 ½(yrᵀ+ryᵀ) 组合出来是 yᵀWr。把它展开，秩的含义就出来了。</div>'+
    '<div class="lab-cols">'+
      '<div class="lab-card" style="flex:1 1 320px">'+
        '<div class="lab-k">见证：秩 1</div>'+
        '<div class="chain" style="margin-top:8px;font-size:12.5px">yᵀ(wwᵀ)r = (y·w)(r·w)<br>'+
        '<span class="m">= ψ · r(w)</span></div>'+
        '<div class="lab-dim" style="margin-top:10px">y·w = 22+2+46 = <b>70</b>，他能自己算（密文里有全部 [yᵢ]）。<br>'+
        'r·w = 8+9+4 = <b>21</b>，他不知道。<br><br>'+
        '<span style="color:#F0AC5F">只有 1 个未知整数</span>，而它落在 [0, Ng] 的短区间里 → 可以搜。</div>'+
      '</div>'+
      '<div class="lab-card" style="flex:1 1 320px">'+
        '<div class="lab-k">骗子：秩 3</div>'+
        '<div class="chain" style="margin-top:8px;font-size:12.5px">W* 的第 0 行 = 第 2 行，所以<br>'+
        'yᵀW*r = (y₀+y₂)(r₀+r₂) + y₁(r₃) + y₃(r₁)<br>'+
        '<span class="m">= '+a1+'·'+b1+' + '+a2+'·'+b2+' + '+a3+'·'+b3+' = '+sum+' ≡ '+sumM+'</span></div>'+
        '<div class="lab-dim" style="margin-top:10px">三个乘数 '+a1+'、'+a2+'、'+a3+' 他都能算（y 的封印是公开的）。<br>'+
        '他不知道的是 <b>'+b1+'、'+b2+'、'+b3+'</b> 这三个数。<br><br>'+
        '<span style="color:#FC6255">3 个未知整数</span>，必须同时猜中。</div>'+
      '</div>'+
    '</div>'+
    '<div class="lab-h" style="margin-top:26px">为什么「必须同时」？</div>'+
    '<div class="chain">他手里的东西是<b>群元素</b>，只有「相等 / 不相等」两种判断。<br>'+
      '减错哪怕一个数，整个元素就对不上——这里没有「接近」这回事。<br>'+
      '<span class="m">所以：d 个未知数 = 一次性猜中 d 个数，概率 (1/g)^d。</span></div>'+
    '<div class="lab-note"><b>y 和 r 各自负责什么：</b><br>'+
      '· <b>y 随机</b> ⟹ 那 d 个乘数彼此独立随机 ⟹ d 项<b>不会互相抵消</b>（否则骗子可以构造出抵消）。<br>'+
      '· <b>r 是小整数</b> ⟹ r(w) = Σwᵢrᵢ 落在短区间 ⟹ 诚实者能<b>搜</b>出来。<br>'+
      '· <b>w 只能是 0/1</b> ⟹ 这个和才是个有界整数；否则 r(w) 可能是任何值，搜索无从下手。</div>'+
    '<div class="takeaway">参数就是这么定的：要让骗子的猜中概率 g<sup>−d</sup> ≤ 2<sup>−2λ</sup>，就取 g ≈ 2<sup>2λ/d</sup>。<br>'+
      'd = 4 时 g ≈ 2<sup>λ/2</sup>，而诚实者只需 √(gN) ≈ 2<sup>λ/4</sup>N<sup>1/4</sup>。这一个指数上的差，就是全部的安全性。</div>';
  }});

  /* ⑧ 组合与密文 */
  steps.push({tab:'⑩ 组合',src:'pr',render:function(){
    var total=sumM(T,sel);
    return '<div class="lab-h">密文长什么样，组合怎么做</div>'+
    '<div class="lab-sub">加密只做一件事：把表逐格发出去。没有密钥，没有随机数生成器——随机数在 y、r、κ、μ 里。</div>'+
    '<div class="lab-cols">'+
      '<div style="flex:1 1 380px">'+
      '<pre class="code"><span class="c">// 密文（省略 α 副本）</span>\nct = { T: [[Sealed × 10]], y: [Sealed × 4] }\n\n<span class="c">// 任何人：沿自己的矩阵 W 组合</span>\n<span class="k">let</span> acc = Sealed.zero\n<span class="k">for</span> i <span class="k">in</span> 0..3:\n  <span class="k">for</span> j <span class="k">in</span> i..3:\n    <span class="k">let</span> c = (i == j) ? W[i][j] : 2*W[i][j]\n    acc = acc.mul(ct.T[i][j].pow(c))\n<span class="c">// acc = [〈T,W〉]，但你看不到里面的数</span></pre>'+
      '</div>'+
      ml(mat(T,{size:40,cls:function(i,j){return sel(i,j)?'hi':'';}}),'T（金色 = 选中）')+
    '</div>'+
    '<div class="chain" style="margin-top:16px">见证者代入 W = wwᵀ，等于只把金色格子加起来：<br>'+
      '87 + 56 + 76 + 56 + 19 + 60 + 76 + 60 + 84 = 574 ≡ <b>69</b></div>'+
    '<div class="chain">密文的完整结构：<br>'+
      'ct = { T 的上三角 10 格 : [Tᵢⱼ]　（对称，非对角算两次）<br>'+
      '　　　 y 的 4 格 : [yᵢ]<br>'+
      '　　　 α 副本：[αTᵢⱼ]、[αyᵢ]、[ακ]　（下一步解释）<br>'+
      '　　　 m̃ = m ⊕ H([κ]) }</div>'+
    '<div class="lab-note">这张表有 16 格——换成真实 N = 39 万个未知数，就是 N²/2 个群元素。<br>'+
    '<b>这就是论文第七幕要解决的第一个问题：用 QAP 把表压成 O(N)。</b></div>'+
    '<div class="takeaway">加密到此完整：<b>表 + 逐格发布</b>。剩下的问题是——拿到 69 之后，怎么得到 [κ]？</div>';
  }});

  /* ⑨ 解密 */
  steps.push({tab:'⑪ 解密',src:'pr',render:function(){
    var sumW=sumM(T,sel), e1=sumW%P;                 // 574 ≡ 69
    var psiW=dot(y,w), rwW=dot(r,w);                 // 70, 21
    var aD=((ALPHA*(sumW-KAP))%P+P)%P;               // 3927 ≡ 89
    var aP=(ALPHA*psiW)%P;                           // 86
    var check=(aP*rwW)%P;                            // 1806 ≡ 89
    var kap=((e1-psiW*rwW)%P+P)%P;                   // 13
    var seal=gpow(kap), hk=(seal*37+11)%P, mt=(42+hk)%P;
    function row(n,act,exp,val){return '<tr><td class="n">'+n+'</td><td>'+act+'</td><td class="n">'+exp+'</td><td class="c '+(n==='⑥'?'':'')+'">'+val+'</td></tr>';}
    return '<div class="lab-h">解密：七步，每步都能手算</div>'+
    '<div class="lab-sub">用第 ⑩ 步那张 T 和第 ③ 步那个 w。左栏是代码做的动作，右两栏是指数上到底发生了什么——群元素就是 <b>g<sup>指数</sup></b>，所以「相乘」在指数上就是「相加」。</div>'+
    '<table class="lab-t" style="margin-top:8px">'+
      '<tr><th style="width:36px"></th><th>群里做的</th><th style="width:34%">指数上（𝔽₁₀₁，手算）</th><th style="width:22%">得到</th></tr>'+
      row('①','把 9 个金色格子乘起来<br><span class="dim">Λ = Π [Tᵢⱼ]^Wᵢⱼ</span>',
          'T₀₀ + 2T₀₁ + 2T₀₃ + ⋯ + T₃₃<br><span class="dim">= '+sumW+' ≡ '+e1+'</span>',
          'Λ = ['+e1+'] = '+gpow(e1))+
      row('②','沿 w 把 y 乘起来<br><span class="dim">Ψ = Π [yᵢ]^wᵢ</span>',
          'y₀ + y₁ + y₃ = '+psiW,
          'Ψ = ['+psiW+'] = '+gpow(psiW))+
      row('③','乘 αT，再除掉公开的 [ακ]<br><span class="dim">Λα = comb(aT) / [ακ]</span>',
          'α·('+sumW+' − '+KAP+') = '+ALPHA+'·'+(sumW-KAP)+' = '+(ALPHA*(sumW-KAP))+' ≡ '+aD,
          'Λα = ['+aD+'] = '+gpow(aD))+
      row('④','沿 w 把 αy 乘起来<br><span class="dim">Ψα = Π [αyᵢ]^wᵢ</span>',
          'αψ = '+ALPHA+'·'+psiW+' = '+(ALPHA*psiW)+' ≡ '+aP,
          'Ψα = ['+aP+'] = '+gpow(aP))+
      row('⑤','试 r̂：比 Ψα<sup>r̂</sup> 和 Λα<br><span class="dim">唯一能验的等式</span>',
          '要找 '+aP+'·r̂ ≡ '+aD+'（mod 101）<br><span class="dim">试 r̂ = '+rwW+'：'+aP+'·'+rwW+' = '+(aP*rwW)+' ≡ '+(aP*rwW%P)+' ✓</span>',
          'r̂ = '+rwW+' 命中')+
      row('⑥','除掉 Ψ<sup>r̂</sup><br><span class="dim">key = Λ / Ψ^r̂</span>',
          e1+' − '+psiW+'·'+rwW+' = '+(e1-psiW*rwW)+' ≡ '+kap,
          '<b>[κ] = ['+kap+'] = '+seal+'</b>')+
      row('⑦','减去 H([κ])<br><span class="dim">m = m̃ − H([κ])</span>',
          'H('+seal+') = '+(seal*37+11)+' ≡ '+hk,
          'm = '+mt+' − '+hk+' ≡ <b>42</b>')+
    '</table>'+
    '<div class="lab-note">③ 里那个 <b>[ακ]</b> 是整条链的关键：主元素 Λ 里 κ 和 ψ·r(w) 粘在一起，没有任何参照物；<br>'+
    'α 副本把 κ 那部分换成 ακ（公开、可减），剩下的 αψ·(r(w) − r̂) 只有在 r̂ = r(w) 时才归零。</div>'+
    '<div class="lab-h" style="margin-top:24px">轮到你了：把上表第 ⑤ 行手动走一遍</div>'+
    '<div class="slider"><span style="font-size:12px;color:#6f7a91">r̂</span>'+
      '<input type="range" id="labRange" min="0" max="40" value="0" step="1">'+
      '<span class="val" id="labVal">0</span></div>'+
    '<div class="hitbox" id="labHit">Λα − r̂·Ψα = 89 − 86·0 = 89 ≠ 0　<span class="m">继续试</span></div>'+
    '<div class="lab-note">真实参数下候选有约 <b>2²⁹·⁴</b> 个，所以用「小步表 + 大步跳」而不是一个个试。但每一步的判断，就是上面这一行减法。</div>';
  },mount:function(root){
    var rg=root.querySelector('#labRange'), val=root.querySelector('#labVal'), hit=root.querySelector('#labHit');
    var aPsi=ALPHA*psi%P, aPsiR=ALPHA*psi%P*rw%P;
    function upd(){
      var r2=parseInt(rg.value,10);
      var lhs=(aPsiR - aPsi*r2)%P; if(lhs<0) lhs+=P;
      val.textContent=r2;
      if(lhs===0){
        hit.className='hitbox on';
        hit.innerHTML='Λα − r̂·Ψα = 89 − 86·'+r2+' ≡ 0　<b>命中</b><br>'+
          'r(w) = '+r2+'　→　[κ] = Lam − '+r2+'·Psi　→　密钥 = H([κ])';
      }else{
        hit.className='hitbox';
        hit.innerHTML='Λα − r̂·Ψα = 89 − 86·'+r2+' ≡ '+lhs+' ≠ 0　<span class="m">继续试</span>';
      }
    }
    rg.addEventListener('input',upd); upd();
  }});

  /* ⑫ 跑一遍 */
  steps.push({tab:'⑫ 跑一遍',src:'toy',render:function(){
    var labs=['w₁·w₃ = 1','w₂·(w₁+w₃) = 0','w₁·w₂ = 0','(w₁+w₂)·w₃ = 1','w₁+w₂+w₃ = 2'];
    var chk='';
    for(var i=0;i<5;i++) chk+='<label><input type="checkbox" id="tC'+i+'" checked> <span>'+labs[i]+'</span></label>';
    return '<div class="lab-h">现在把整台机器跑起来</div>'+
    '<div class="lab-sub">第一节只做加密（<b>完全不用 w</b>），第二节只做解密（<b>只用 w 和公开的 [T]</b>）。点任意矩阵的任意一格，算式会出现在它下面。</div>'+
    '<div class="lab-card">'+
      '<div class="lab-k">命题</div>'+
      '<div class="vec" style="font-size:13.5px">程序 p(x,y,z) = (x &amp;&amp; z) &amp;&amp; !(y &amp;&amp; (x || z))　　记 <b>w = (1, x, y, z)</b></div>'+
      '<div class="lab-dim" style="margin-bottom:8px">所以 w₁ = x、w₂ = y、w₃ = z；矩阵的下标 (i, j) 就指 wᵢ 和 wⱼ。下面一律用 w 的下标写。</div>'+
      '<div class="stmt">'+chk+'<span class="fix">+ 三条布尔性 wⱼ·wⱼ = wⱼ（j=1,2,3）</span></div>'+
      '<div class="lab-dim" id="tInfo">—</div>'+
    '</div>'+
    '<div class="lab-cols" style="margin-top:14px;align-items:stretch">'+
      '<div class="lab-card" style="flex:1 1 300px">'+
        '<div class="lab-k">加密方</div>'+
        '<div class="msgrow"><span>要锁进去的消息</span> m = '+
          '<input type="number" id="toyMsg" min="0" max="10006" value="42"></div>'+
        '<button class="btn2" id="toyRand">重新加密（换一组随机数）</button>'+
        '<div class="lab-dim" style="margin-top:10px">它的随机数是 y、r、κ、α、μ——全是自己抽的，不需要 w。</div>'+
      '</div>'+
      '<div class="lab-card" style="flex:1 1 300px">'+
        '<div class="lab-k">解密方</div>'+
        '<div class="lab-dim" style="margin-bottom:4px">它手里只有一个 w：</div>'+
        '<select id="toyW"></select>'+
      '</div>'+
    '</div>'+
    '<div class="phase"><div class="phlab">加密阶段 · <b>不看 w</b></div>'+
      '<div class="coins" id="toyCoins"></div>'+
      '<div class="pipe d4" id="toyEnc"></div><div id="toyEncInsp"></div>'+
      '<div class="pack" id="toyPack"></div></div>'+
    '<div class="phase"><div class="phlab">解密阶段 · <b>只用 w 和密文</b></div>'+
      '<div class="pipe d4" id="toyDec"></div><div id="toyDecInsp"></div>'+
      '<div class="hitbox" id="toyVerdict" style="margin-top:16px">—</div>'+
      '<div class="muinfo" id="toyAcc"></div></div>'+
    '<div class="lab-note">勾选改变的是传给 <b>Praxis(Q, P, G, TESTS)</b> 的 TESTS 参数——代码本身一个字不改；改消息只改密文里那一格 m̃。</div>'+
    '<details class="srcdet"><summary>源码（约 118 行，页面上跑的就是这段）</summary>'+
      '<pre class="code" id="toySrc"></pre></details>';
  },mount:function(root){
    var selEl=root.querySelector('#toyW'), msgEl=root.querySelector('#toyMsg'),
        encEl=root.querySelector('#toyEnc'), decEl=root.querySelector('#toyDec'),
        encInsEl=root.querySelector('#toyEncInsp'), decInsEl=root.querySelector('#toyDecInsp'),
        coinsEl=root.querySelector('#toyCoins'), packEl=root.querySelector('#toyPack'),
        accEl=root.querySelector('#toyAcc'), vEl=root.querySelector('#toyVerdict'),
        infoEl=root.querySelector('#tInfo'), srcEl=root.querySelector('#toySrc');
    srcEl.innerHTML=codeHTML(TOYSRC);
    var Q=10007, inst=null, CT=null, nTest=8, ACTIVE=[];
    var sel={m:'M', i:0, j:0};
    var chk=[]; for(var i=0;i<5;i++) chk.push(root.querySelector('#tC'+i));
    var cyc=[[0,0,0],[0,0,1],[0,1,0],[0,1,1],[1,0,0],[1,0,1],[1,1,0],[1,1,1]];
    var CFN=[
      function(c){return !!(c[2]&&c[0]);},
      function(c){return !(c[1]&&(c[0]||c[2]));},
      function(c){return !(c[0]&&c[1]);},
      function(c){return !!(c[2]&&(c[0]+c[1]===1));},
      function(c){return (c[0]+c[1]+c[2])===2;}
    ];
    var NAMES=['w₁·w₃=1','w₂·(w₁+w₃)=0','w₁·w₂=0','(w₁+w₂)·w₃=1','w₁+w₂+w₃=2',
               '布尔性 w₁²=w₁','布尔性 w₂²=w₂','布尔性 w₃²=w₃'];
    var INV2Q=(Q+1)/2;
    function rnd(n){return Math.floor(Math.random()*n);}
    function sat(c){ for(var i=0;i<5;i++) if(chk[i].checked && !CFN[i](c)) return false; return true; }
    function build(){
      var all=TOY.tests(Q), keep=[];
      for(var i=0;i<5;i++) if(chk[i].checked) keep.push(i);
      keep.push(5,6,7);
      nTest=keep.length;
      ACTIVE=keep.map(function(k){return {C:all[k], name:NAMES[k]};});
      inst=TOY.Praxis(Q,240169,205555,ACTIVE.map(function(a){return a.C;}));
    }
    function newCoins(){
      var t={y:[rnd(Q),rnd(Q),rnd(Q),rnd(Q)], r:[rnd(9),rnd(9),rnd(9),rnd(9)],
             k:1+rnd(Q-1), a:1+rnd(Q-1), mu:[]};
      for(var i=0;i<nTest;i++) t.mu.push(1+rnd(Q-1));
      t.msg=parseInt(msgEl.value,10);
      if(isNaN(t.msg)||t.msg<0||t.msg>Q-1) t.msg=0;
      t.ct=inst.enc(t.y,t.r,t.k,t.msg,t.a,t.mu);
      return t;
    }
    function reEncrypt(){ CT.ct=inst.enc(CT.y,CT.r,CT.k,CT.msg,CT.a,CT.mu); }
    function upperGrid(vals){
      var k=0, rows=[];
      for(var i=0;i<4;i++){ var row=[]; for(var j=0;j<4;j++){ row.push(i<=j?vals[k++]:''); } rows.push(row); }
      return rows;
    }
    function fillSelect(){
      var opts='', n=0, first=-1;
      for(var i=0;i<8;i++){
        var c=cyc[i], ok=sat(c);
        if(ok){ n++; if(first<0) first=i; }
        opts+='<option value="'+i+'">w = (1,'+c[0]+','+c[1]+','+c[2]+')　'+(ok?'✓ 是见证':'✗ 不满足')+'</option>';
      }
      selEl.innerHTML=opts;
      selEl.value=String(first<0?0:first);
      infoEl.textContent=(n?'当前命题有 '+n+' 个满足的输入（'+n+' / 8）':'当前命题<b style="color:#FC6255">无解</b>——谁都解不开');
    }
    function isSel(m,a,b){ return sel.m===m && sel.i===a && sel.j===b; }
    function cellOpts(m,size){
      return {size:size,gridCls:'sm',
        cls:function(a,b){
          var c='';
          if(m==='T'&&a===0&&b===0) c='kap';
          if(isSel(m,a,b)) c+=' hi2';
          return c;
        },
        data:function(a,b){return ' data-mat="'+m+'" data-ij="'+a+','+b+'"';}};
    }
    function fmtC(v){
      if(v===INV2Q) return '½';
      if(v===Q-INV2Q) return '−½';
      return (v>Q/2)?String(v-Q):String(v);
    }
    function inspHTML(){
      var i=sel.i, j=sel.j, M=CT.ct;
      var head='<div class="insplab">'+sel.m+'['+i+']['+j+'] 的算式</div>';
      var body='';
      if(sel.m==='W'){
        var wv=[1]; for(var k=0;k<3;k++) wv.push(cyc[parseInt(selEl.value,10)][k]);
        body='= w'+i+'·w'+j+' = '+wv[i]+'·'+wv[j]+' = <b>'+(wv[i]*wv[j])+'</b>'+
             '<br><span class="m">W 只由 w 决定，是 0/1 的乘积表</span>';
      }else if(sel.m==='M'){
        var terms=[], ints=[], zeros=0, raw=0, val=0, half=false;
        for(var t2=0;t2<ACTIVE.length;t2++){
          var c=ACTIVE[t2].C[i][j], u=CT.mu[t2], sv=c, disp;
          if(c===INV2Q){ half=true; disp='½'; }
          else if(c===Q-INV2Q){ half=true; disp='−½'; }
          else if(c>Q/2){ sv=c-Q; disp=String(sv); }
          else { disp=String(c); }
          raw+=u*sv; val=(val+u*c)%Q;
          if(c===0){ zeros++; continue; }
          terms.push(u+'·('+disp+')<span class="m">〔'+ACTIVE[t2].name+'〕</span>');
          ints.push(u+'·'+sv);
        }
        body='= Σ μₜ·Cₜ['+i+']['+j+']<br>　 '+(terms.length?terms.join(' + '):'0')+
          (zeros?'<br><span class="m">（其余 '+zeros+' 项在这一格是 0）</span>':'')+
          (half?('<br>= <span class="m">'+ints.join(' + ')+'</span>'):'')+
          '<br><span class="g">'+(raw!==val?('= '+raw.toLocaleString('en-US')+' ≡ '+val):('≡ '+val))+'</span>（mod '+Q+'）'+
          (half?('<br><span class="m">½ ≡ '+INV2Q+'，−½ ≡ '+(Q-INV2Q)+'（2·'+INV2Q+' = '+(2*INV2Q)+' ≡ 1）</span>'):'');
      }else if(sel.m==='S'){
        var s1=CT.y[i]*CT.r[j], s2=CT.r[i]*CT.y[j], ss=s1+s2;
        body='= ½(y'+i+'·r'+j+' + r'+i+'·y'+j+')<br>'+
          '＝ ½('+CT.y[i]+'·'+CT.r[j]+' + '+CT.r[i]+'·'+CT.y[j]+')<br>'+
          '＝ ½('+s1.toLocaleString('en-US')+' + '+s2.toLocaleString('en-US')+') = ½·'+ss.toLocaleString('en-US')+'<br>'+
          '<span class="g">≡ '+ss+'·'+INV2Q+' ≡ '+((ss%Q)*INV2Q%Q)+'</span>（mod '+Q+'）'+
          '<br><span class="m">½ ≡ '+INV2Q+'：乘 ½ 就是乘 '+INV2Q+'</span>';
      }else if(sel.m==='T'){
        var mv=M.Mask[i][j], sv2=M.S[i][j], isKap=(i===0&&j===0);
        var sum=(mv+sv2+(isKap?CT.k:0))%Q;
        body='= M + S'+(isKap?' + κ':'')+'<br>'+
          '＝ '+mv+' + '+sv2+(isKap?' + '+CT.k+'（κ 在角落）':'')+' = '+(mv+sv2+(isKap?CT.k:0))+
          '<br><span class="g">≡ '+sum+'</span>（mod '+Q+'）'+
          (isKap?'<br><span class="m">只有 (0,0) 这一格带 κ</span>':'');
      }else if(sel.m==='C'){
        if(i>j){
          body='<span class="m">下三角不发布——表是对称的，只发上三角，公开部分已经够用。</span>';
        }else{
          var kk=0; for(var a=0;a<i;a++) for(var b=a;b<4;b++) kk++;
          kk+=(j-i);
          body='= g<sup>T['+i+']['+j+']</sup>　（g = 205555，mod 240169）<br>'+
            '＝ 205555<sup>'+M.P[i][j]+'</sup> mod 240169 = <b>'+M.T[kk]+'</b>'+
            '<br><span class="m">这一步是群运算，手算不了——但它和 T['+i+']['+j+'] = '+M.P[i][j]+' 一一对应（反解就是离散对数）</span>';
        }
      }
      return '<div class="inspbox">'+head+body+'</div>';
    }
    function run(){
      var i=parseInt(selEl.value,10), c=cyc[i], w=[1,c[0],c[1],c[2]], ok=sat(c);
      var W=w.map(function(a){return w.map(function(b){return a*b;});});
      var d=inst.dec(CT.ct,w);
      /* ---------- 随机数 ---------- */
      var muParts=[]; for(var t0=0;t0<nTest;t0++) muParts.push('<span class="cv">'+CT.mu[t0]+'</span>');
      var nc=0; for(var k0=0;k0<5;k0++) if(chk[k0].checked) nc++;
      var cyS=CT.y.map(function(v){return '<span class="cv">'+v+'</span>';}).join(', ');
      var crS=CT.r.map(function(v){return '<span class="cv">'+v+'</span>';}).join(', ');
      coinsEl.innerHTML=
        '<div class="coinline"><b>加密者的随机数</b>　<span class="m">每次「重新加密」都会重抽一整组</span></div>'+
        '<div class="coinline">y = ('+cyS+')　　r = ('+crS+')　　κ = <span class="cv">'+CT.k+'</span>　　α = <span class="cv">'+CT.a+'</span></div>'+
        '<div class="coinline">μ = ( '+muParts.join(', ')+' )　<span class="m">掩码权重，前 '+nc+' 个对应勾的约束，后 3 个是布尔性</span></div>'+
        '<div class="coinline m">yᵢ、κ、α 在 [0, '+Q+') 里均匀取；rᵢ 只取 0–8——这样 r(w) = r·w 落在一个短区间里，解密才搜得到。</div>';
      /* ---------- 加密四格 ---------- */
      encEl.innerHTML=
        '<div class="pcell"><div class="plab">① 掩码 M <span>命题 + 随机 μ</span></div>'+
          mat(CT.ct.Mask,cellOpts('M',40))+
          '<div class="resnote">M = Σ μₜCₜ（点格子看算式）</div></div>'+
        '<div class="pcell"><div class="plab">② 搜索项 S <span>随机 y、r</span></div>'+
          mat(CT.ct.S,cellOpts('S',40))+
          '<div class="resnote">Sᵢⱼ = ½(yᵢrⱼ + rᵢyⱼ)</div></div>'+
        '<div class="pcell"><div class="plab">③ 表 T <span>= M + S + κ角</span></div>'+
          mat(CT.ct.P,cellOpts('T',40))+
          '<div class="resnote">κ 藏在 (0,0)（金框）</div></div>'+
        '<div class="pcell"><div class="plab">④ 密文 [T] <span>把 T 每格都封进群</span></div>'+
          mat(upperGrid(CT.ct.T),cellOpts('C',48))+
          '<div class="resnote">只发上三角；每格 = g<sup>格子值</sup></div></div>';
      /* ---------- 打包清单 ---------- */
      packEl.innerHTML=
        '<div class="packlab">打包：加密者最后公开的六样东西</div>'+
        '<div class="packrow"><span class="pk">[T] 上三角</span><span class="pd">9 个群元素，表本身——κ 藏在它 (0,0) 格的指数里</span></div>'+
        '<div class="packrow"><span class="pk">[y₀] … [y₃]</span><span class="pd">让解密者能自己算出 ψ = y·w</span></div>'+
        '<div class="packrow"><span class="pk">[αT] 上三角</span><span class="pd">表的 <b>α 倍副本</b>：组合它得到 [α·〈T,W〉]，减掉公开的 [ακ] 后只剩 [αψ·r(w)]</span></div>'+
        '<div class="packrow"><span class="pk">[αy₀] … [αy₃]</span><span class="pd">y 的第二份，指数都乘 α</span></div>'+
        '<div class="packrow"><span class="pk">[ακ]</span><span class="pd">公开的参照物：把 κ 从「贴着 ψ·r(w)」变成「单独可减」的那一项</span></div>'+
        '<div class="packrow"><span class="pk">m̃ = m + H([κ])</span><span class="pd">消息被封在这里：m̃ = '+CT.ct.m+'（= '+CT.msg+' + H([κ])）——只有拿回 [κ] 才减得掉</span></div>';
      /* ---------- 解密四格 ---------- */
      var eTRaw=0; for(var a2=0;a2<4;a2++) for(var b2=0;b2<4;b2++) eTRaw+=CT.ct.P[a2][b2]*W[a2][b2];
      var eT=((eTRaw%Q)+Q)%Q;
      var eM=0; for(var a3=0;a3<4;a3++) for(var b3=0;b3<4;b3++) eM+=CT.ct.Mask[a3][b3]*W[a3][b3];
      eM=((eM%Q)+Q)%Q;
      var ePsiRaw=0; for(var a4=0;a4<4;a4++) ePsiRaw+=w[a4]*CT.y[a4];
      var ePsi=((ePsiRaw%Q)+Q)%Q;
      var sumR=0; for(var a5=0;a5<4;a5++) sumR+=w[a5]*CT.r[a5];
      var expLa=(CT.a*(((eT-CT.k)%Q)+Q)%Q)%Q;    // αT 组合后再除掉 ακ 的指数
      var expPa=(CT.a*ePsi)%Q;                    // αy 组合的指数
      var hitExp=(expPa*sumR)%Q;
      var col8, cls8;
      if(d.r!==null){
        var hk=inst.H(d.key);
        col8='<div class="reskv hl"><span>[κ]</span>Λ ÷ Ψ<sup>'+d.r+'</sup><br>＝ <b>'+d.key+'</b></div>'+
             '<div class="reskv"><span>H([κ])</span><b>'+hk+'</b></div>'+
             '<div class="reskv"><span>消息</span>'+CT.ct.m+' − '+hk+' ≡ <b>'+d.msg+'</b></div>';
      }else{
        col8='<div class="reskv dim">搜索没命中，r̂ 无从谈起<br>→ 拿不到 [κ]，m̃ 解不开</div>';
      }
      decEl.innerHTML=
        '<div class="pcell"><div class="plab">⑤ 造 W = wwᵀ <span>只有它有 w</span></div>'+
          mat(W,cellOpts('W',40))+
          '<div class="resnote">0/1 乘积表，秩 1</div></div>'+
        '<div class="pcell"><div class="plab">⑥ 组合出 Λ、Ψ <span>只用 [T] 和 [y]</span></div>'+
          '<div class="reskv"><span>Λ</span><b>'+d.Lam+'</b></div>'+
          '<div class="reskv"><span>Ψ</span><b>'+d.Psi+'</b></div>'+
          '<div class="resnote">Λ = Π[Tᵢⱼ]<sup>Wᵢⱼ</sup>，Ψ = Π[yᵢ]<sup>wᵢ</sup><br>'+
            '对角格 1 次、非对角格 2 次</div></div>'+
        '<div class="pcell"><div class="plab">⑦ 用 α 副本搜 r̂ <span>只用 [αT]、[αy]、[ακ]</span></div>'+
          '<div class="reskv"><span>Λα</span><b>'+d.La+'</b></div>'+
          '<div class="reskv"><span>Ψα</span><b>'+d.Pa+'</b></div>'+
          '<div class="resnote">逐个试 r̂ = 0,1,2,…<br>看 (Ψα)<sup>r̂</sup> 是否 = Λα<br>'+
            (d.r!==null?('<span class="g">r̂ = '+d.r+' 命中</span>'):'全试过，都不等')+
            (eM!==0?'<br><span class="bad">w 没通过全部测试，Λα 里多出来的项让等式永远不成立</span>':'')+
          '</div></div>'+
        '<div class="pcell"><div class="plab">⑧ 取回 [κ] 并解 m̃ <span>用上一步的 r̂</span></div>'+col8+'</div>';
      var html=inspHTML();
      if(sel.m==='W'){ encInsEl.innerHTML=''; decInsEl.innerHTML=html; }
      else { decInsEl.innerHTML=''; encInsEl.innerHTML=html; }
      /* ---------- 对账 ---------- */
      var yt=[], rt=[], sumY=0;
      for(var k=0;k<4;k++){
        if(w[k]===1){ yt.push('y'+k+' = '+CT.y[k]); rt.push('r'+k+' = '+CT.r[k]); }
        sumY+=w[k]*CT.y[k];
      }
      var okLam=(inst.seal(eT)===d.Lam);
      accEl.innerHTML=
        '<div class="godlab">上帝视角 · 为什么上面这些群运算一定对　<span class="m">（指数在这里看得见；解密者只看得到群元素）</span></div>'+
        '<div class="chain" style="margin-top:10px;font-size:12.5px">'+
        'ψ = y·w = '+yt.join(' + ')+' = '+sumY+' ≡ <b>'+ePsi+'</b><br>'+
        'r(w) = r·w = '+rt.join(' + ')+' = '+sumR+'<br>'+
        '〈M,W〉 = '+(eM===0?'0　<span class="g">✓ w 通过全部测试</span>':'<span class="bad">'+eM+'</span>　✗ 有测试没过')+'<br>'+
        '〈T,W〉 = 〈M,W〉 + κ + ψ·r(w) = '+eM+' + '+CT.k+' + '+ePsi+'·'+sumR+' ≡ <b>'+eT+'</b>'+
        '　⟹ Λ 应等于 g<sup>'+eT+'</sup> = '+inst.seal(eT)+(okLam?' <span class="g">✓ 与 ⑥ 一致</span>':' <span class="bad">✗</span>')+'<br>'+
        'α 副本的指数：Λα = α·(〈T,W〉 − κ) ≡ <b>'+expLa+'</b>，Ψα = αψ ≡ <b>'+expPa+'</b><br>'+
        '　　　　(Ψα)<sup>r̂</sup> = Λα ⟺ αψ·r̂ ≡ α(〈T,W〉 − κ) ⟺ r̂ = r(w)<br>'+
        '取回：〈T,W〉 − ψ·r̂ ≡ '+((eT-ePsi*sumR)%Q+Q)%Q+' = κ　⟹　Λ ÷ Ψ<sup>r̂</sup> = g<sup>κ</sup> = [κ]</div>';
      /* ---------- 判定 ---------- */
      if(d.r!==null && ok){
        vEl.className='hitbox on';
        vEl.innerHTML='<b>w = (1,'+c[0]+','+c[1]+','+c[2]+')</b> ✓ 是见证　✓ 解出来的消息和原文一致';
      }else if(d.r!==null){
        // 非见证：r̂ 落在搜索窗口里纯属巧合，概率约 (窗口大小)/q
        vEl.className='hitbox';
        vEl.innerHTML='<b>w = (1,'+c[0]+','+c[1]+','+c[2]+')</b> ✗ 不是见证　'+
          '<b>但这次搜索碰巧撞上了</b>——概率约 41/'+Q+'，换一组随机数（重新加密）就露馅。';
      }else{
        vEl.className='hitbox';
        vEl.innerHTML='<b>w = (1,'+c[0]+','+c[1]+','+c[2]+')</b> ✗ 不是见证　组合出来是噪声，搜不到 r̂';
      }
    }
    function rebuild(){ build(); CT=newCoins(); fillSelect(); run(); }
    chk.forEach(function(el){ el.addEventListener('change',rebuild); });
    selEl.addEventListener('change',run);
    msgEl.addEventListener('change',function(){
      var v=parseInt(msgEl.value,10);
      if(isNaN(v)||v<0||v>Q-1){ v=0; }
      msgEl.value=String(v); CT.msg=v; reEncrypt(); run();
    });
    root.querySelector('#toyRand').addEventListener('click',function(){ CT=newCoins(); run(); });
    function onCellClick(e){
      var t=e.target.closest('[data-mat]');
      if(!t) return;
      var p=t.getAttribute('data-ij').split(',');
      sel={m:t.getAttribute('data-mat'), i:+p[0], j:+p[1]};
      run();
    }
    encEl.addEventListener('click',onCellClick);
    decEl.addEventListener('click',onCellClick);
    build(); CT=newCoins(); fillSelect(); run();
  }});

  /* ---------- 外壳 ---------- */
  var cur=0;
  var SRCLABEL={base:'共同地基',hs:'Hair–Sahai 的秩模板',core:'核心分析',pr:'Praxis 的改动',toy:'本页的玩具'};
  function show(i){
    var root=document.getElementById('labView');
    var chip=steps[i].src?'<div class="src '+steps[i].src+'">'+(SRCLABEL[steps[i].src]||'')+'</div>':'';
    root.innerHTML=chip+steps[i].render();
    if(steps[i].mount) steps[i].mount(root);
    var tabs=document.querySelectorAll('#labTabs button');
    for(var k=0;k<tabs.length;k++) tabs[k].className=(k===i?'on':'');
    document.getElementById('labCount').textContent=(i+1)+' / '+steps.length;
    document.getElementById('labPrev').disabled=(i===0);
    document.getElementById('labNext').disabled=(i===steps.length-1);
    cur=i;
  }
  function init(){
    var tabs=document.getElementById('labTabs');
    for(var i=0;i<steps.length;i++){
      (function(k){
        var b=document.createElement('button');
        b.textContent=steps[k].tab;
        b.addEventListener('click',function(){ show(k); });
        tabs.appendChild(b);
      })(i);
    }
    document.getElementById('labPrev').addEventListener('click',function(){ if(cur>0) show(cur-1); });
    document.getElementById('labNext').addEventListener('click',function(){ if(cur<steps.length-1) show(cur+1); });
    show(0);
  }
  return {init:init,show:show};
})();

