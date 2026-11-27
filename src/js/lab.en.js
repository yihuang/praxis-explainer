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

  var TOYSRC = `// ===== Toy Praxis: complete encryption and decryption (~115 lines) =====
// Praxis(Q, P, G, TESTS): the statement lives in field F_Q; the group is the order-Q subgroup of F_P*.

const Z = () => [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];

// One constraint a(w)·b(w) = w₀·c(w) maps to one test matrix:
//   C = ½(abᵀ + baᵀ) − ½(e₀cᵀ + ce₀ᵀ); 〈C,W〉= 0 means the constraint holds
function Cmat(Q, a, b, c) {
  const h = (Q + 1) / 2, M = Z();          // h = ½
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const ab = a[i] * b[j] + b[i] * a[j];
    const ec = (i === 0 ? c[j] : 0) + (j === 0 ? c[i] : 0);
    M[i][j] = ((ab - ec) * h % Q + Q) % Q;
  }
  return M;
}

// Statement: five constraints + three booleanity checks
function tests(Q) {
  const e = (i) => [0,1,2,3].map(k => (k === i ? 1 : 0));
  const add = (u, v) => u.map((x, i) => (x + v[i]) % Q);
  const C = [
    [e(1), e(3), e(0)],                             // x·z = 1
    [e(2), add(e(1), e(3)), [0,0,0,0]],             // y·(x+z) = 0
    [e(1), e(2), [0,0,0,0]],                        // x·y = 0
    [add(e(1), e(2)), e(3), e(0)],                  // (x+y)·z = 1
    [add(add(e(1), e(2)), e(3)), e(0), [2,0,0,0]],  // x+y+z = 2
    [e(1), e(1), e(1)], [e(2), e(2), e(2)], [e(3), e(3), e(3)],  // booleanity
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
  const invP = (x) => pw(x, P - 2);            // inverse of a group element
  const seal = (v) => pw(G, mod(v));           // [v] = g^v
  const H    = (x) => mod(x * 37 + 11);        // toy hash (the real one is SHA-256)

  // mask: a random linear combination of the statement, M = Σ μₜ·Cₜ
  function mask(mu) {
    const M = Z();
    TESTS.forEach((C, t) => {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++)
        M[i][j] = mod(M[i][j] + mu[t] * C[i][j]);
    });
    return M;
  }
  // search term ½(yrᵀ + ryᵀ)
  function searchTerm(y, r) {
    const M = Z();
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++)
      M[i][j] = mod(INV2 * (y[i] * r[j] + r[i] * y[j]));
    return M;
  }

  // ---- encryption: the statement only, never the witness ----
  function enc(y, r, kappa, msg, alpha, mu) {
    const Mk = mask(mu), S = searchTerm(y, r), T = [];
    for (let i = 0; i < 4; i++) {
      T.push([]);
      for (let j = 0; j < 4; j++) {
        let v = Mk[i][j] + S[i][j];
        if (i === 0 && j === 0) v += kappa;    // the key hides in the corner
        T[i].push(mod(v));
      }
    }
    const up = (A) => {
      const o = [];
      for (let i = 0; i < 4; i++) for (let j = i; j < 4; j++) o.push(A[i][j]);
      return o;
    };
    return {
      P: T, Mask: Mk, S,                          // the plaintext table and its two parts (shown for demo only)
      T: up(T).map(seal), Y: y.map(seal),         // published group elements
      aT: up(T).map(v => seal(alpha * v)),
      aY: y.map(v => seal(alpha * v)),
      ak: seal(alpha * kappa),
      m: mod(msg + H(seal(kappa))),
    };
  }

  // ---- combining along matrix W: the only ciphertext operation is 'multiply' ----
  function comb(el, W) {
    let acc = 1, k = 0;
    for (let i = 0; i < 4; i++) for (let j = i; j < 4; j++, k++) {
      const c = i === j ? W[i][j] : 2 * W[i][j];
      acc = acc * pw(el[k], c) % P;
    }
    return acc;
  }

  // ---- decryption: needs the witness w ----
  function dec(ct, w) {
    const W   = w.map(a => w.map(b => a * b));   // W = w·wᵀ
    const Lam = comb(ct.T, W);                   // [κ + ψ·r(w)]
    const Psi = ct.Y.reduce((s, e, i) => s * pw(e, w[i]) % P, 1);
    const La  = comb(ct.aT, W) * invP(pw(ct.ak, W[0][0])) % P;  // a copy of the table
    const Pa  = ct.aY.reduce((s, e, i) => s * pw(e, w[i]) % P, 1);  // a copy of y
    for (let r = 0; r <= 40; r++) {              // search for r̂
      if (pw(Pa, r) === La) {
        const key = Lam * invP(pw(Psi, r)) % P;  // this is [κ]
        return { r, key, Lam, Psi, La, Pa, msg: mod(ct.m - H(key)) };
      }
    }
    return { r: null, Lam, Psi, La, Pa };        // not found
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
  steps.push({tab:'① Program → equations',src:'base',render:function(){
    return '<div class="lab-h">First look at a program, then turn it into equations</div>'+
    '<div class="lab-sub">The question witness encryption has to answer, in plain words: <b>I know an input that makes this program return true.</b></div>'+
    '<div class="lab-cols">'+
      '<div class="lab-card" style="flex:1 1 330px">'+
        '<div class="lab-k">PROGRAM</div>'+
        '<pre class="code"><span class="k">fn</span> p(x: <span class="k">bool</span>, y: <span class="k">bool</span>, z: <span class="k">bool</span>) -&gt; <span class="k">bool</span> {\n    (x &amp;&amp; z) &amp;&amp; !(y &amp;&amp; (x || z))\n}</pre>'+
        '<div class="lab-dim">witness: <code>x=1, y=0, z=1</code> → (1&amp;&amp;1) &amp;&amp; !(0&amp;&amp;1) = <b style="color:#83C167">true</b></div>'+
      '</div>'+
      '<div class="lab-card" style="flex:1 1 330px">'+
        '<div class="lab-k">translation rules</div>'+
        '<div class="lab-dim" style="margin-bottom:8px">Booleans as 0/1, and <code>&amp;&amp;</code> is multiplication:</div>'+
        '<table class="lab-t" style="margin-top:0">'+
          '<tr><td>x &amp;&amp; z</td><td class="n">→ x·z = 1</td></tr>'+
          '<tr><td>!(y &amp;&amp; (x||z))</td><td class="n">→ y·(x+z) = 0</td></tr>'+
        '</table>'+
        '<div class="lab-dim" style="margin-top:10px">Second row: when x and z take only 0/1, “x||z is false” and “x+z=0” are the same thing;<br>so y·(x+z)=0 says “y and (x||z) are not both true”.</div>'+
      '</div>'+
    '</div>'+
    '<div class="lab-h" style="margin-top:26px">The same rules apply to any circuit</div>'+
    '<table class="lab-t">'+
      '<tr><th style="width:30%">Gate</th><th style="width:30%">Equation</th><th>Note</th></tr>'+
      '<tr><td>o = a &amp;&amp; b</td><td class="n">o = a·b</td><td>AND is just multiplication</td></tr>'+
      '<tr><td>o = a || b</td><td class="n">o = a + b − a·b</td><td>OR is adding, then subtracting the overlap</td></tr>'+
      '<tr><td>o = !a</td><td class="n">o = 1 − a</td><td>NOT is just subtracting from 1</td></tr>'+
      '<tr><td>each variable v</td><td class="n">v·v = v</td><td>pinned to 0 or 1</td></tr>'+
    '</table>'+
    '<div class="lab-note">One equation per gate, plus one more “= 1” for the output gate. The problem this encoding targets is <b>circuit satisfiability</b>, which is NP-complete —<br>so “any NP statement” can be written this way, including a Rust program (compiled to a circuit first).</div>'+
    '<div class="lab-h" style="margin-top:26px">But equations are not enough: in 𝔽₁₀₁, x·z=1 has other solutions</div>'+
    '<div class="lab-sub">For instance x=2, z=51 also makes the product equal 1 — but the program rejects 2. So each unknown gets its own <b>booleanity constraint</b>:</div>'+
    '<div class="chain" style="margin-top:4px">w₁·w₃ = 1　　<span class="m">← first condition holds</span><br>'+
      'w₂·(w₁+w₃) = 0　　<span class="m">← second condition holds</span><br>'+
      'wⱼ·wⱼ = wⱼ　(j=1,2,3)　　<span class="m">← each w can only be 0 or 1</span></div>'+
    '<div class="lab-note">Five equations, three unknowns, <b>only one solution</b>: w = (1,1,0,1).<br>'+
    'Note: a real system has hundreds of thousands of unknowns, but the structure is exactly the same — only the numbers here are small enough to do by hand.</div>'+
    '<div class="takeaway">From here only three questions remain: <b>how the equations become a matrix</b> (②③), <b>how the matrix becomes a ciphertext</b> (④⑤⑥), <b>how the ciphertext becomes the answer again</b> (⑦).</div>';
  }});

  /* ② 方程 → 矩阵（推导） */
  steps.push({tab:'② Equations→matrix',src:'core',render:function(){
    return '<div class="lab-h">One step of algebra: every quadratic form is a weighted sum over the same table</div>'+
    '<div class="lab-sub">The whole paper rests on the three lines below. It uses exactly one idea: a product can be treated as an independent variable.</div>'+
    '<div class="lab-cols">'+
      '<div class="lab-card" style="flex:1 1 300px">'+
        '<div class="lab-k">STEP 1 · Make the constant 1 a variable too</div>'+
        '<div class="vec">w = (w₀, w₁, w₂, w₃), with <b>w₀ = 1</b></div>'+
        '<div class="lab-dim">So <code>w₁·w₃ = 1</code> can be written <code>w₁·w₃ = w₀</code> —<br>both sides are “two linear forms multiplied”, so the forms are unified.</div>'+
      '</div>'+
      '<div class="lab-card" style="flex:1 1 300px">'+
        '<div class="lab-k">STEP 2 · record the products in a matrix</div>'+
        '<div class="vec">W[i][j] := wᵢ · wⱼ</div>'+
        '<div class="lab-dim">16 cells, one product each.<br>At this point W is still only “the table of powers of w”.</div>'+
      '</div>'+
    '</div>'+
    '<div class="lab-h" style="margin-top:26px">STEP 3 · any quadratic form = a linear combination of W</div>'+
    '<div class="chain" style="font-size:13.5px">'+
      'a(w)·b(w) = (Σᵢ aᵢwᵢ) · (Σⱼ bⱼwⱼ)<br>'+
      '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= Σᵢ Σⱼ (aᵢ·bⱼ) · (wᵢwⱼ)<br>'+
      '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= Σᵢ Σⱼ C[i][j] · W[i][j]　　<span class="m">where C = a·bᵀ (a public matrix)</span><br>'+
      '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= <span class="ip">〈C , W〉</span>　　<span class="g">← all coefficients public, only W unknown</span>'+
    '</div>'+
    '<div class="lab-sub" style="margin-top:16px">Every constraint can be written <span class="ip">〈Cₜ , W〉</span> = 0. Expanded, Cₜ says one thing only: <b>two particular cells must be equal</b>.</div>'+
    '<table class="lab-t">'+
      '<tr><th>Constraint</th><th>⟨Cₜ,W⟩ = 0, expanded</th><th>Read as</th></tr>'+
      '<tr><td>w₁·w₃ = w₀</td><td>W₁₃ − W₀₀ = 0</td><td>row 1, column 3 = row 0, column 0</td></tr>'+
      '<tr><td>w₂·(w₁+w₃) = 0</td><td>W₂₁ + W₂₃ = 0</td><td>the two cells in row 2 add up to 0</td></tr>'+
      '<tr><td>wⱼ·wⱼ = wⱼ</td><td>Wⱼⱼ − W₀ⱼ = 0</td><td>diagonal cell = the matching cell in row 0 (j=1,2,3)</td></tr>'+
    '</table>'+
    '<div class="lab-note">That is what “linear test” literally means: the verifier only adds and compares, <b>never touching a single w</b>.<br>'+
    '(Strictly, the paper writes C in the symmetric form ½(abᵀ+baᵀ), so the ciphertext only publishes the upper triangle; for symmetric W both forms give the same value.)</div>'+
    '<div class="takeaway">Next, plug the numbers in and see what these cells look like.</div>';
  }});

  /* ③ 代入验证 */
  steps.push({tab:'③ Five tests',src:'core',render:function(){
    var rows=[
      ['1','W₁₃ = W₀₀',W[1][3],W[0][0]],
      ['2','W₂₁ + W₂₃ = 0',(W[2][1]+W[2][3])%P,0],
      ['3','W₁₁ = W₀₁',W[1][1],W[0][1]],
      ['4','W₂₂ = W₀₂',W[2][2],W[0][2]],
      ['5','W₃₃ = W₀₃',W[3][3],W[0][3]]
    ];
    var s='<div class="lab-h">Plug in w = (1,1,0,1): W = w·wᵀ</div>'+
      '<div class="lab-sub">Cell (i,j) = wᵢ·wⱼ. Hover to see which two numbers were multiplied.</div>'+
      '<div class="mrow">'+ml(mat(W,{size:44,
          tip:function(i,j){return 'W['+i+']['+j+'] = w'+i+'·w'+j+' = '+w[i]+'·'+w[j]+' = '+W[i][j];}}),'W')+
        '<div style="flex:1;min-width:300px">'+
          '<div class="vec" style="font-size:13px;line-height:2.1">Row 0: 1 1 0 1<br>Row 1: 1 1 0 1<br>Row 2: 0 0 0 0<br>Row 3: 1 1 0 1</div>'+
          '<div class="lab-dim" style="margin-top:10px">Row 1 is identical to row 0, row 2 is all zeros (w₂=0).<br>The whole matrix is just the vector w <b>copied four times</b> — that is <b style="color:#F0AC5F">rank 1</b>.</div>'+
        '</div></div>'+
      '<div class="lab-h" style="margin-top:24px">Checking the five tests one by one</div>'+
      '<table class="lab-t"><tr><th>#</th><th>Test</th><th>Left side gives</th><th>Right side</th><th>Pass</th></tr>';
    for(var i=0;i<rows.length;i++){
      var ok=((rows[i][2]-rows[i][3])%P+P)%P===0;
      s+='<tr><td class="n">'+rows[i][0]+'</td><td>'+rows[i][1]+'</td><td class="c">'+rows[i][2]+
         '</td><td class="c">'+rows[i][3]+'</td><td class="c '+(ok?'ok':'bad')+'">'+(ok?'✓':'✗')+'</td></tr>';
    }
    s+='</table>'+
      '<div class="takeaway">All tests pass ⟹ this is a legitimate witness.<br>But note: these tests are <b>linear</b>, so the matrices that pass form a linear space — and other tenants live in it too. Keep that in mind; ⑧ will use it.</div>';
    return s;
  }});


  /* ④ 群元素 */
  steps.push({tab:'④ Group element',src:'base',render:function(){
    var sealed=[]; for(var i=0;i<4;i++){var row=[];for(var j=0;j<4;j++)row.push(gpow(T[i][j]));sealed.push(row);}
    var s13=gpow(3), s5=gpow(5), s8=gpow(8), s69=gpow(69), s143=gpow(143), s42=gpow(42);
    return '<div class="lab-h">Change the stage: seal the numbers into group elements</div>'+
    '<div class="lab-sub">The table must be published, yet nobody may read the numbers. There is only one way: <b>put every number in the exponent</b>.</div>'+
    '<div class="lab-cols">'+
      '<div class="lab-card" style="flex:1 1 300px">'+
        '<div class="lab-k">container</div>'+
        '<div class="vec">[v] := g<sup>v</sup> mod 607　(g = 64, group order = 101)</div>'+
        '<div class="lab-dim">In a real scheme g is a point on an elliptic curve, with group order about 2²⁵⁴.<br>Here we use the subgroup of order 101 inside 𝔽₆₀₇*, so that the numbers stay three digits long.</div>'+
      '</div>'+
      '<div class="lab-card" style="flex:1 1 300px">'+
        '<div class="lab-k">The two things it can do</div>'+
        '<div class="vec" style="font-size:13px">[3] = '+s13+'　　[5] = '+s5+'<br>'+
        s13+' × '+s5+' = '+(s13*s5)+' ≡ '+(s13*s5%607)+' = [8]</div>'+
        '<div class="lab-dim">Multiplication = adding exponents; same for powers: k·[v] = [k·v].<br>Exponents wrap at the group order 101: [143] = ['+(143%101)+'] = '+s143+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="lab-h" style="margin-top:24px">So the whole table can go out like this (right: the published ciphertext)</div>'+
    '<div class="mrow">'+
      ml(mat(T,{size:36}),'T (numbers the encryptor holds)')+
      '<div class="mop">→</div>'+
      ml(mat(sealed,{size:36}),'[T] (what everyone sees)')+
      '<div style="flex:1;min-width:220px"><div class="lab-dim">On the left, every cell is a small integer; on the right is its exponent.<br><br>'+
      'No one can invert from right to left — <b>the only way is to try every exponent</b>. 101 elements can be exhausted; 2²⁵⁴ cannot.</div></div>'+
    '</div>'+
    '<div class="lab-note">The witness has to compute Σ T<sub>ij</sub>·W<sub>ij</sub>, but the ciphertext only lets him multiply and take powers — which is exactly “adding exponents”.<br>'+
    'Combine along wwᵀ: Π [T<sub>ij</sub>]<sup>W<sub>ij</sub></sup> = [69] = <b>'+s69+'</b>. He read off no single T<sub>ij</sub>, yet he holds the seal of 69.</div>'+
    '<div class="takeaway">The whole of this section: <b>you can combine, but you cannot read out.</b> All that remains is to design “what combining produces”.</div>';
  }});

  /* ⑤ 掩码从哪来 */
  steps.push({tab:'⑤ Mask',src:'hs',render:function(){
    var rows=[
      ['1','W₁₃ = W₀₀','(1,3)=½ (3,1)=½ (0,0)=−1'],
      ['2','W₂₁ + W₂₃ = 0','(2,1)=½ (1,2)=½ (2,3)=½ (3,2)=½'],
      ['3','W₁₁ = W₀₁','(1,1)=1 (0,1)=−½ (1,0)=−½'],
      ['4','W₂₂ = W₀₂','(2,2)=1 (0,2)=−½ (2,0)=−½'],
      ['5','W₃₃ = W₀₃','(3,3)=1 (0,3)=−½ (3,0)=−½']
    ];
    var s='<div class="lab-h">Mask M is not just any matrix — it packs five tests into one</div>'+
      '<div class="lab-sub">In step ②, each test is a public matrix C<sub>t</sub>: ⟨C<sub>t</sub>, W⟩ = 0 means pass. The five C<sub>t</sub> look like this (non-zero entries only; ½ in 𝔽₁₀₁ is 51):</div>'+
      '<table class="lab-t"><tr><th>#</th><th>Test</th><th>nonzero entries of C<sub>t</sub> (i, j) = value</th></tr>';
    for(var k=0;k<rows.length;k++)
      s+='<tr><td class="n">'+rows[k][0]+'</td><td>'+rows[k][1]+'</td><td class="n" style="font-size:11.5px">'+rows[k][2]+'</td></tr>';
    s+='</table>'+
      '<div class="why"><div class="whylab">Why is row 0 −½, and not −1?</div>'+
        'Because the inner product sums over <b>two indices</b>: 〈C, W〉 = Σᵢⱼ Cᵢⱼ·Wᵢⱼ, and W is symmetric,'+
        ' (0,j) and (j,0) each get counted once.<br>'+
        'So put <b>−½</b> in both (0,j) and (j,0); only then do they add up to −1:<br>'+
        '<span class="m">〈C,W〉 = 1·Wⱼⱼ + (−½)·W₀ⱼ + (−½)·Wⱼ₀ = Wⱼⱼ − W₀ⱼ</span><br>'+
        'Try w = (1,1,0,1), j = 1: <span class="m">1·1 + (−½)·1 + (−½)·1 = 0 ✓</span>;'+
        ' Written as −1 and −1, it becomes <span class="bad">1 − 1 − 1 = −1 ✗</span>.<br>'+
        'That is where the ½ in <b>½(abᵀ + baᵀ)</b> comes from: average the two symmetric paths first, and only then does the double-index sum equal (a·w)(b·w).'+
      '</div>'+
      '<div class="lab-h" style="margin-top:24px">Packing: a weighted sum, with weights μ drawn at random by the encryptor</div>'+
      '<div class="chain" style="font-size:13.5px">M = μ₁C₁ + μ₂C₂ + μ₃C₃ + μ₄C₄ + μ₅C₅<br>'+
      '<span class="c">Hence</span>　⟨M, W⟩ = μ₁⟨C₁,W⟩ + … + μ₅⟨C₅,W⟩</div>'+
      '<div class="murow"><span>weight</span>'+
        '<div class="mu"><i>μ₁</i><input type="number" id="mu0" value="1"></div>'+
        '<div class="mu"><i>μ₂</i><input type="number" id="mu1" value="1"></div>'+
        '<div class="mu"><i>μ₃</i><input type="number" id="mu2" value="1"></div>'+
        '<div class="mu"><i>μ₄</i><input type="number" id="mu3" value="1"></div>'+
        '<div class="mu"><i>μ₅</i><input type="number" id="mu4" value="1"></div>'+
        '<button class="btn2" id="muReset" style="margin-top:0;align-self:flex-end">reset to 1</button></div>'+
      '<div class="mrow" style="margin-top:18px;align-items:flex-start">'+
        '<div id="mGrid"></div>'+
        '<div style="flex:1;min-width:330px">'+
          '<div class="lab-dim" style="margin-bottom:8px">Click any cell of M on the left to see how that cell is computed:</div>'+
          '<div class="chain" id="mInspect" style="font-size:12.5px;margin-top:0">—</div>'+
          '<div class="lab-dim" id="mWhy" style="margin-top:10px"></div>'+
        '</div>'+
      '</div>'+
      '<div class="lab-cols" style="margin-top:20px">'+
        '<div class="lab-card" style="flex:1 1 300px"><div class="lab-k">W passes all tests</div>'+
          '<div class="lab-dim" style="font-size:12.5px">Every 〈C<sub>t</sub>,W〉 = 0 ⟹ 〈M,W〉 = 0. Whatever μ is, it stays 0.</div></div>'+
        '<div class="lab-card" style="flex:1 1 300px"><div class="lab-k">W fails one test</div>'+
          '<div class="lab-dim" style="font-size:12.5px">At least one term non-zero, the product random, and the sum is <b>uniformly random</b> — in the group that scatters the element completely.</div></div>'+
      '</div>'+
      '<div class="lab-note">Later steps always use this M with <b>μ = (1,1,1,1,1)</b>; the input above just lets you run the formula once and changes nothing else.<br>'+
      'Why must μ be random? With μ fixed at 1, some W that fail the tests can still cancel the five residuals exactly, and ⟨M,W⟩ drops back to 0 — step ⑦ shows such a matrix.</div>'+
      '<div class="takeaway">M is nothing new — it is a weighted sum of the C; 〈M,W〉 just means “plug W into every test, then sum them, weighted by random coefficients”.</div>';
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
      div.className='mlab'; div.textContent='M (μ as above)';
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
        if(v!==0) nz.push('C'+(t+1)+' is '+disp);
      }
      var tail=(raw!==M[i][j])?('= '+raw+' ≡ '+M[i][j]+'　(mod '+P+')'):('≡ '+M[i][j]+'　(mod '+P+')');
      if(half) tail+='<br><span class="m">½ ≡ 51, −½ ≡ 50 (because 2·51 = 102 ≡ 1)</span>';
      inspEl.innerHTML='M['+i+']['+j+'] = '+terms+'<br>'+
        '<span class="m">= '+numsI+'</span><br>'+
        '<span class="g">'+tail+'</span>';
      whyEl.innerHTML=nz.length?('This cell has only '+nz.join('、')+', and the other four C are all 0 here.<br>So M['+i+']['+j+'] is their weighted sum.')
        :'All five C are 0 in this cell, so M is 0 here too.';
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
  steps.push({tab:'⑥ Minimal version',src:'hs',render:function(){
    var sealedT0=[]; for(var i=0;i<4;i++){var row=[];for(var j=0;j<4;j++)row.push(gpow(T0[i][j]));sealedT0.push(row);}
    var sK=gpow(KAP), hk=(sK*37+11)%P, m0=42, mt=(m0+hk)%P;
    return '<div class="lab-h">Minimal version v0: just “mask + key”</div>'+
    '<div class="lab-sub">There is only one requirement: when the witness combines along wwᵀ, it must land on κ. So put κ in cell (0,0) — since w₀ = 1, W₀₀ is always 1.</div>'+
    '<div class="mrow">'+
      ml(mat(Mask,{size:40,cls:function(){return 'hi3';}}),'mask M')+
      '<div class="mop">+</div>'+
      ml(mat(KEY,{size:40,cls:function(i,j){return (i===0&&j===0)?'hi':'';}}),'key κe₀e₀ᵀ')+
      '<div class="mop">=</div>'+
      ml(mat(T0,{size:40,cls:function(i,j){return (i===0&&j===0)?'hi':'';}}),'plaintext table T₀')+
      '<div style="flex:1;min-width:190px"><div class="lab-dim">This is <b>a number the encryptor worked out himself</b>, still lying on paper.<br>If he sent it out as it stands, cell (0,0) would spell out κ in the clear.</div></div>'+
    '</div>'+
    '<div class="lab-h" style="margin-top:26px">So what goes out is its “seal” — every cell pushed into an exponent</div>'+
    '<div class="mrow">'+
      ml(mat(T0,{size:36}),'T₀ (only he has it)')+
      '<div class="mop">→</div>'+
      ml(mat(sealedT0,{size:36,cls:function(i,j){return (i===0&&j===0)?'hi':'';}}),'[T₀] (published)')+
      '<div style="flex:1;min-width:250px">'+
        '<div class="chain" style="margin-top:0;font-size:12.5px">ct₀ = {<br>'+
        '&nbsp;&nbsp;[T₀ᵢⱼ] 10 group elements (upper triangle)<br>'+
        '&nbsp;&nbsp;m̃ = m ⊕ H([κ])　<span class="m">(in the toy, addition stands in for XOR)</span><br>}'+
        '</div>'+
        '<div class="lab-dim" style="margin-top:8px">This version has <b>no y, no r, no α copy</b> — all of those come later. At this point the ciphertext holds only these two things.</div>'+
      '</div>'+
    '</div>'+
    '<div class="chain" style="margin-top:18px">The witness takes the ciphertext and does one combination (multiplication in the group, addition in the exponent):<br>'+
      '<span class="c">In the group:</span>Π [T₀ᵢⱼ]<sup>Wᵢⱼ</sup> = <b>['+gpow(13)+']</b>　　<span class="m">(he never sees the exponent, only this element)</span><br>'+
      '<span class="c">In the exponents:</span>〈T₀, wwᵀ〉 = 〈M, wwᵀ〉 + κ·W₀₀ = 0 + κ = <b>13</b><br>'+
      '<span class="m">The mask term is 0 (w passes all tests); the corner term is κ itself. So [κ] falls out, and m̃ decrypts straight to m.</span></div>'+
    '<div class="lab-note">Walk it through with numbers: κ = 13 → [κ] = '+sK+' → H([κ]) = '+hk+' → m̃ = 42 + '+hk+' = '+(42+hk)+' ≡ '+mt+'(mod 101); solving back gives 42 ✓.<br>'+
    'He does not even need to search — the combination is the key.</div>'+
    '<div class="takeaway">v0 meets the requirement, but it only guarantees <b>“whoever passes the tests gets κ”</b>, not <b>“whoever passes the tests is the witness”</b>. The next section asks whether anyone else can do the same.</div>';
  }});

  /* ⑥ 漏洞 */
  steps.push({tab:'⑦ The flaw',src:'hs',render:function(){
    var rows=[
      ['1','W₁₃ = W₀₀',WS[1][3],WS[0][0]],
      ['2','W₂₁ + W₂₃ = 0',(WS[2][1]+WS[2][3])%P,0],
      ['3','W₁₁ = W₀₁',WS[1][1],WS[0][1]],
      ['4','W₂₂ = W₀₂',WS[2][2],WS[0][2]],
      ['5','W₃₃ = W₀₃',WS[3][3],WS[0][3]]
    ];
    var s='<div class="lab-h">The flaw: a matrix that is not a witness passes every test</div>'+
      '<div class="lab-sub">No witness can produce the 0/1 matrix W* below (there is only one witness), yet it passes all five tests.</div>'+
      '<div class="mrow">'+ml(mat(WS,{size:44,cls:function(i,j){return (i===0&&j===0)?'hi':'';}}),'W*')+
        '<div style="flex:1;min-width:300px"><table class="lab-t" style="margin-top:0"><tr><th>#</th><th>Test</th><th>Left</th><th>Right</th><th></th></tr>';
    for(var i=0;i<rows.length;i++){
      var ok=((rows[i][2]-rows[i][3])%P+P)%P===0;
      s+='<tr><td class="n">'+rows[i][0]+'</td><td>'+rows[i][1]+'</td><td class="c">'+rows[i][2]+
         '</td><td class="c">'+rows[i][3]+'</td><td class="c '+(ok?'ok':'bad')+'">'+(ok?'✓':'✗')+'</td></tr>';
    }
    s+='</table></div></div>'+
      '<div class="chain">The attacker takes it and combines it against v0\'s ciphertext:<br>'+
        '〈T₀, W*〉 = 〈M, W*〉 + κ·W*₀₀ = 0 + κ·1 = <b>13 = κ</b></div>'+
      '<div class="lab-note">It need not know r, y or r(w) at all. <b>v0 is thoroughly broken.</b><br>'+
      'The crux is here: v0 only checks “you pass the tests”, not “you are that witness”. And the matrices that pass form a linear space, home to a whole crowd of W*.</div>'+
      '<div class="takeaway">The missing term must leave <b>a stretch of road that can only be walked by guessing</b> between “passing the tests” and “getting the key”.</div>';
    return s;
  }});

  /* ⑦ 补丁：搜索项 */
  steps.push({tab:'⑧ Patch',src:'hs',render:function(){
    return '<div class="lab-h">Now the third term: even a passing prover must guess one number first</div>'+
    '<div class="lab-sub">Add a term ½(y rᵀ + r yᵀ): y is a random vector, r a small integer vector. On combining it throws up something that only a knower of w can cancel.</div>'+
    '<div class="mrow">'+
      ml(mat(S,{size:36,cls:function(){return 'hi2';}}),'search term')+
      '<div class="mop">+</div>'+
      ml(mat(T0,{size:36}),'mask + key')+
      '<div class="mop">=</div>'+
      ml(mat(T,{size:36,cls:function(i,j){return (i===0&&j===0)?'hi':'';}}),'full table T')+
    '</div>'+
    '<div class="chain" style="margin-top:16px">For the witness holder:<br>'+
      '〈T, wwᵀ〉 = κ + y(w)·r(w) = 13 + 70·21 = 1483 ≡ <b>69</b><br>'+
      '<span class="m">y(w) = 70 he can work out himself (he holds w and all the [yᵢ]), but r(w) = 21 he does not know.</span><br><br>'+
      'For the cheat (W* of rank 3):<br>'+
      '〈T, W*〉 = κ + yᵀW*r = 13 + 32 = <b>45</b><br>'+
      '<span class="m">yᵀW*r hides rank(W*) = 3 independent unknowns.</span></div>'+
    '<div class="lab-note"><b>The ciphertext changes too</b>: the table goes from T₀ to T, and [yᵢ] must be published as well (otherwise the witness cannot compute ψ).<br>'+
    'One change: “1 unknown” for the honest party, “3 unknowns” for the cheat.<br>'+
    'That is the entire security lever: <b>rank = the number of numbers you must guess at once</b>. Raise the minimal rank and the cheater has more to guess at once, so the guessing probability g<sup>−d</sup> falls off exponentially.</div>'+
    '<div class="takeaway">Now: the honest party must find one integer (the next step), the cheat must find d integers at once. That gap is the security.</div>';
  }});

  /* ⑨ 秩 = 未知数个数 */
  steps.push({tab:'⑨ Rank',src:'core',render:function(){
    var a1=(y[0]+y[2])%P, a2=y[1], a3=y[3];
    var b1=(r[0]+r[2])%P, b2=r[3], b3=r[1];
    var sum=a1*b1+a2*b2+a3*b3, sumM=sum%P;
    return '<div class="lab-h">Why “rank” equals “the number of values you must guess at once”</div>'+
    '<div class="lab-sub">Combined, the search term ½(yrᵀ+ryᵀ) gives yᵀWr. Expand it and the meaning of rank falls out.</div>'+
    '<div class="lab-cols">'+
      '<div class="lab-card" style="flex:1 1 320px">'+
        '<div class="lab-k">witness: rank 1</div>'+
        '<div class="chain" style="margin-top:8px;font-size:12.5px">yᵀ(wwᵀ)r = (y·w)(r·w)<br>'+
        '<span class="m">= ψ · r(w)</span></div>'+
        '<div class="lab-dim" style="margin-top:10px">y·w = 22+2+46 = <b>70</b>, and he can work it out himself (the ciphertext holds every [yᵢ]).<br>'+
        'r·w = 8+9+4 = <b>21</b>, and he does not know it.<br><br>'+
        '<span style="color:#F0AC5F">Only 1 unknown integer</span>, and it lies in a short interval [0, Ng] → searchable.</div>'+
      '</div>'+
      '<div class="lab-card" style="flex:1 1 320px">'+
        '<div class="lab-k">Cheat: rank 3</div>'+
        '<div class="chain" style="margin-top:8px;font-size:12.5px">row 0 of W* = row 2, so<br>'+
        'yᵀW*r = (y₀+y₂)(r₀+r₂) + y₁(r₃) + y₃(r₁)<br>'+
        '<span class="m">= '+a1+'·'+b1+' + '+a2+'·'+b2+' + '+a3+'·'+b3+' = '+sum+' ≡ '+sumM+'</span></div>'+
        '<div class="lab-dim" style="margin-top:10px">the three multipliers '+a1+'、'+a2+'、'+a3+' he can work it out too (the seal of y is public).<br>'+
        'What he does not know is <b>'+b1+'、'+b2+'、'+b3+'</b> these three numbers.<br><br>'+
        '<span style="color:#FC6255">3 unknown integers</span>, all to be guessed at once.</div>'+
      '</div>'+
    '</div>'+
    '<div class="lab-h" style="margin-top:26px">Why “at the same time”?</div>'+
    '<div class="chain">What he holds is a <b>group element</b>, so there are only two verdicts: equal / not equal.<br>'+
      'Get even one number wrong and the entire element fails to match — there is no such thing as “close” here.<br>'+
      '<span class="m">So: d unknowns means guessing d numbers all at once, probability (1/g)^d.</span></div>'+
    '<div class="lab-note"><b>What y and r each take care of:</b><br>'+
      '· <b>y is random</b> ⟹ those d multipliers are independent and random ⟹ the d terms <b>do not cancel each other</b> (otherwise the cheat could engineer a cancellation).<br>'+
      '· <b>r is a small integer</b> ⟹ r(w) = Σwᵢrᵢ lands in a short interval ⟹ an honest party can <b>search</b> it out.<br>'+
      '· <b>w can only be 0/1</b> ⟹ only then is the sum a bounded integer; otherwise r(w) could be anything and the search has nowhere to start.</div>'+
    '<div class="takeaway">That is how the parameters are set: to get the cheater’s guessing probability g<sup>−d</sup> ≤ 2<sup>−2λ</sup>, take g ≈ 2<sup>2λ/d</sup>.<br>'+
      'With d = 4, g ≈ 2<sup>λ/2</sup>, while the honest party needs only √(gN) ≈ 2<sup>λ/4</sup>N<sup>1/4</sup>. That difference in a single exponent is the whole of the security.</div>';
  }});

  /* ⑧ 组合与密文 */
  steps.push({tab:'⑩ Combine',src:'pr',render:function(){
    var total=sumM(T,sel);
    return '<div class="lab-h">What the ciphertext looks like, and how combining works</div>'+
    '<div class="lab-sub">Encryption does one thing: publish the table cell by cell. No key, no random-number generator — the randomness lives in y, r, κ, μ.</div>'+
    '<div class="lab-cols">'+
      '<div style="flex:1 1 380px">'+
      '<pre class="code"><span class="c">// ciphertext (α copies omitted)</span>\nct = { T: [[Sealed × 10]], y: [Sealed × 4] }\n\n<span class="c">// anyone: combine along your own matrix W</span>\n<span class="k">let</span> acc = Sealed.zero\n<span class="k">for</span> i <span class="k">in</span> 0..3:\n  <span class="k">for</span> j <span class="k">in</span> i..3:\n    <span class="k">let</span> c = (i == j) ? W[i][j] : 2*W[i][j]\n    acc = acc.mul(ct.T[i][j].pow(c))\n<span class="c">// acc = [〈T,W〉], but you cannot see the number inside</span></pre>'+
      '</div>'+
      ml(mat(T,{size:40,cls:function(i,j){return sel(i,j)?'hi':'';}}),'T (gold = selected)')+
    '</div>'+
    '<div class="chain" style="margin-top:16px">The witness substitutes W = wwᵀ, which amounts to adding up only the gold cells:<br>'+
      '87 + 56 + 76 + 56 + 19 + 60 + 76 + 60 + 84 = 574 ≡ <b>69</b></div>'+
    '<div class="chain">The full structure of the ciphertext:<br>'+
      'ct = { upper triangle of T, 10 cells : [Tᵢⱼ]　(symmetric, off-diagonal cells counted twice)<br>'+
      '　　　 the 4 cells of y : [yᵢ]<br>'+
      '　　　 α copies: [αTᵢⱼ], [αyᵢ], [ακ]　(explained in the next step)<br>'+
      '　　　 m̃ = m ⊕ H([κ]) }</div>'+
    '<div class="lab-note">This table has 16 cells — at the real N = 390,000 unknowns, that is N²/2 group elements.<br>'+
    '<b>This is the first problem Act VII has to solve: use a QAP to squeeze the table down to O(N).</b></div>'+
    '<div class="takeaway">Encryption is complete here: <b>a table, published cell by cell</b>. The only question left — with 69 in hand, how do we get [κ]?</div>';
  }});

  /* ⑨ 解密 */
  steps.push({tab:'⑪ Decryption',src:'pr',render:function(){
    var sumW=sumM(T,sel), e1=sumW%P;                 // 574 ≡ 69
    var psiW=dot(y,w), rwW=dot(r,w);                 // 70, 21
    var aD=((ALPHA*(sumW-KAP))%P+P)%P;               // 3927 ≡ 89
    var aP=(ALPHA*psiW)%P;                           // 86
    var check=(aP*rwW)%P;                            // 1806 ≡ 89
    var kap=((e1-psiW*rwW)%P+P)%P;                   // 13
    var seal=gpow(kap), hk=(seal*37+11)%P, mt=(42+hk)%P;
    function row(n,act,exp,val){return '<tr><td class="n">'+n+'</td><td>'+act+'</td><td class="n">'+exp+'</td><td class="c '+(n==='⑥'?'':'')+'">'+val+'</td></tr>';}
    return '<div class="lab-h">Decryption: seven steps, each doable by hand</div>'+
    '<div class="lab-sub">Using the T from step ⑩ and the w from step ③. The left column is what the code does; the right two columns are what actually happens in the exponents — a group element is <b>g<sup>exponent</sup></b>, so “multiply” in the exponent is “add”.</div>'+
    '<table class="lab-t" style="margin-top:8px">'+
      '<tr><th style="width:36px"></th><th>Done in the group</th><th style="width:34%">In the exponent (𝔽₁₀₁, by hand)</th><th style="width:22%">Result</th></tr>'+
      row('①','Multiply the 9 gold cells together<br><span class="dim">Λ = Π [Tᵢⱼ]^Wᵢⱼ</span>',
          'T₀₀ + 2T₀₁ + 2T₀₃ + ⋯ + T₃₃<br><span class="dim">= '+sumW+' ≡ '+e1+'</span>',
          'Λ = ['+e1+'] = '+gpow(e1))+
      row('②','Multiply the y\'s along w<br><span class="dim">Ψ = Π [yᵢ]^wᵢ</span>',
          'y₀ + y₁ + y₃ = '+psiW,
          'Ψ = ['+psiW+'] = '+gpow(psiW))+
      row('③','Multiply by αT, then divide out the public [ακ]<br><span class="dim">Λα = comb(aT) / [ακ]</span>',
          'α·('+sumW+' − '+KAP+') = '+ALPHA+'·'+(sumW-KAP)+' = '+(ALPHA*(sumW-KAP))+' ≡ '+aD,
          'Λα = ['+aD+'] = '+gpow(aD))+
      row('④','Multiply αy along w<br><span class="dim">Ψα = Π [αyᵢ]^wᵢ</span>',
          'αψ = '+ALPHA+'·'+psiW+' = '+(ALPHA*psiW)+' ≡ '+aP,
          'Ψα = ['+aP+'] = '+gpow(aP))+
      row('⑤','Try r̂: compare Ψα<sup>r̂</sup> against Λα<br><span class="dim">the only equation that can be checked</span>',
          'Search for '+aP+'·r̂ ≡ '+aD+'(mod 101)<br><span class="dim">try r̂ = '+rwW+'：'+aP+'·'+rwW+' = '+(aP*rwW)+' ≡ '+(aP*rwW%P)+' ✓</span>',
          'r̂ = '+rwW+' hit')+
      row('⑥','Divide out Ψ<sup>r̂</sup><br><span class="dim">key = Λ / Ψ^r̂</span>',
          e1+' − '+psiW+'·'+rwW+' = '+(e1-psiW*rwW)+' ≡ '+kap,
          '<b>[κ] = ['+kap+'] = '+seal+'</b>')+
      row('⑦','Subtract H([κ])<br><span class="dim">m = m̃ − H([κ])</span>',
          'H('+seal+') = '+(seal*37+11)+' ≡ '+hk,
          'm = '+mt+' − '+hk+' ≡ <b>42</b>')+
    '</table>'+
    '<div class="lab-note">That <b>[ακ]</b> in ③ is the key to the whole chain: inside the main element Λ, κ and ψ·r(w) are stuck together, with nothing to measure them against;<br>'+
    'The α copy swaps the κ part for ακ (public, subtractable); the leftover αψ·(r(w) − r̂) vanishes only when r̂ = r(w).</div>'+
    '<div class="lab-h" style="margin-top:24px">Your turn: walk through row ⑤ of the table above by hand</div>'+
    '<div class="slider"><span style="font-size:12px;color:#6f7a91">r̂</span>'+
      '<input type="range" id="labRange" min="0" max="40" value="0" step="1">'+
      '<span class="val" id="labVal">0</span></div>'+
    '<div class="hitbox" id="labHit">Λα − r̂·Ψα = 89 − 86·0 = 89 ≠ 0　<span class="m">keep trying</span></div>'+
    '<div class="lab-note">At real parameters there are about <b>2²⁹·⁴</b> candidates, so we use “small-step table + big jumps” instead of trying them one by one. But the check at each step is just the subtraction above.</div>';
  },mount:function(root){
    var rg=root.querySelector('#labRange'), val=root.querySelector('#labVal'), hit=root.querySelector('#labHit');
    var aPsi=ALPHA*psi%P, aPsiR=ALPHA*psi%P*rw%P;
    function upd(){
      var r2=parseInt(rg.value,10);
      var lhs=(aPsiR - aPsi*r2)%P; if(lhs<0) lhs+=P;
      val.textContent=r2;
      if(lhs===0){
        hit.className='hitbox on';
        hit.innerHTML='Λα − r̂·Ψα = 89 − 86·'+r2+' ≡ 0　<b>hit</b><br>'+
          'r(w) = '+r2+'　→　[κ] = Lam − '+r2+'·Psi　→　key = H([κ])';
      }else{
        hit.className='hitbox';
        hit.innerHTML='Λα − r̂·Ψα = 89 − 86·'+r2+' ≡ '+lhs+' ≠ 0　<span class="m">keep trying</span>';
      }
    }
    rg.addEventListener('input',upd); upd();
  }});

  /* ⑫ 跑一遍 */
  steps.push({tab:'⑫ Run it',src:'toy',render:function(){
    var labs=['w₁·w₃ = 1','w₂·(w₁+w₃) = 0','w₁·w₂ = 0','(w₁+w₂)·w₃ = 1','w₁+w₂+w₃ = 2'];
    var chk='';
    for(var i=0;i<5;i++) chk+='<label><input type="checkbox" id="tC'+i+'" checked> <span>'+labs[i]+'</span></label>';
    return '<div class="lab-h">Now let the whole machine run</div>'+
    '<div class="lab-sub">Act one only encrypts (<b>no w at all</b>); act two only decrypts (<b>only w and the public [T]</b>). Click any cell of any matrix and its formula appears underneath.</div>'+
    '<div class="lab-card">'+
      '<div class="lab-k">statement</div>'+
      '<div class="vec" style="font-size:13.5px">program p(x,y,z) = (x &amp;&amp; z) &amp;&amp; !(y &amp;&amp; (x || z))　　with <b>w = (1, x, y, z)</b></div>'+
      '<div class="lab-dim" style="margin-bottom:8px">So w₁ = x, w₂ = y, w₃ = z; matrix index (i, j) means wᵢ and wⱼ. Below we always write in terms of w indices.</div>'+
      '<div class="stmt">'+chk+'<span class="fix">+ three booleanity constraints wⱼ·wⱼ = wⱼ (j=1,2,3)</span></div>'+
      '<div class="lab-dim" id="tInfo">—</div>'+
    '</div>'+
    '<div class="lab-cols" style="margin-top:14px;align-items:stretch">'+
      '<div class="lab-card" style="flex:1 1 300px">'+
        '<div class="lab-k">Encryptor</div>'+
        '<div class="msgrow"><span>the message to lock in</span> m = '+
          '<input type="number" id="toyMsg" min="0" max="10006" value="42"></div>'+
        '<button class="btn2" id="toyRand">Re-encrypt (new randomness)</button>'+
        '<div class="lab-dim" style="margin-top:10px">Its randomness is y, r, κ, α, μ — all drawn by itself, and no w is needed.</div>'+
      '</div>'+
      '<div class="lab-card" style="flex:1 1 300px">'+
        '<div class="lab-k">Decryptor</div>'+
        '<div class="lab-dim" style="margin-bottom:4px">It holds only one w:</div>'+
        '<select id="toyW"></select>'+
      '</div>'+
    '</div>'+
    '<div class="phase"><div class="phlab">Encryption stage · <b>never looks at w</b></div>'+
      '<div class="coins" id="toyCoins"></div>'+
      '<div class="pipe d4" id="toyEnc"></div><div id="toyEncInsp"></div>'+
      '<div class="pack" id="toyPack"></div></div>'+
    '<div class="phase"><div class="phlab">Decryption stage · <b>only w and the ciphertext</b></div>'+
      '<div class="pipe d4" id="toyDec"></div><div id="toyDecInsp"></div>'+
      '<div class="hitbox" id="toyVerdict" style="margin-top:16px">—</div>'+
      '<div class="muinfo" id="toyAcc"></div></div>'+
    '<div class="lab-note">Ticking a box changes the TESTS argument passed to <b>Praxis(Q, P, G, TESTS)</b> — not one character of the code changes; changing the message changes only the single cell m̃ in the ciphertext.</div>'+
    '<details class="srcdet"><summary>source (~118 lines; this is the code running on the page)</summary>'+
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
               'booleanity w₁²=w₁','booleanity w₂²=w₂','booleanity w₃²=w₃'];
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
        opts+='<option value="'+i+'">w = (1,'+c[0]+','+c[1]+','+c[2]+')　'+(ok?'✓ is a witness':'✗ not satisfied')+'</option>';
      }
      selEl.innerHTML=opts;
      selEl.value=String(first<0?0:first);
      infoEl.textContent=(n?'the current statement has '+n+' satisfying inputs ('+n+' / 8）':'The current statement has <b style="color:#FC6255">no solution</b> — nobody can open it');
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
      var head='<div class="insplab">'+sel.m+'['+i+']['+j+'] formula</div>';
      var body='';
      if(sel.m==='W'){
        var wv=[1]; for(var k=0;k<3;k++) wv.push(cyc[parseInt(selEl.value,10)][k]);
        body='= w'+i+'·w'+j+' = '+wv[i]+'·'+wv[j]+' = <b>'+(wv[i]*wv[j])+'</b>'+
             '<br><span class="m">W is fixed by w alone — it is a 0/1 product table</span>';
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
          (zeros?'<br><span class="m">(the remaining '+zeros+' entries are 0 at this cell)</span>':'')+
          (half?('<br>= <span class="m">'+ints.join(' + ')+'</span>'):'')+
          '<br><span class="g">'+(raw!==val?('= '+raw.toLocaleString('en-US')+' ≡ '+val):('≡ '+val))+'</span>（mod '+Q+'）'+
          (half?('<br><span class="m">½ ≡ '+INV2Q+'，−½ ≡ '+(Q-INV2Q)+'（2·'+INV2Q+' = '+(2*INV2Q)+' ≡ 1）</span>'):'');
      }else if(sel.m==='S'){
        var s1=CT.y[i]*CT.r[j], s2=CT.r[i]*CT.y[j], ss=s1+s2;
        body='= ½(y'+i+'·r'+j+' + r'+i+'·y'+j+')<br>'+
          '＝ ½('+CT.y[i]+'·'+CT.r[j]+' + '+CT.r[i]+'·'+CT.y[j]+')<br>'+
          '＝ ½('+s1.toLocaleString('en-US')+' + '+s2.toLocaleString('en-US')+') = ½·'+ss.toLocaleString('en-US')+'<br>'+
          '<span class="g">≡ '+ss+'·'+INV2Q+' ≡ '+((ss%Q)*INV2Q%Q)+'</span>（mod '+Q+'）'+
          '<br><span class="m">½ ≡ '+INV2Q+': multiplying by ½ is multiplying by '+INV2Q+'</span>';
      }else if(sel.m==='T'){
        var mv=M.Mask[i][j], sv2=M.S[i][j], isKap=(i===0&&j===0);
        var sum=(mv+sv2+(isKap?CT.k:0))%Q;
        body='= M + S'+(isKap?' + κ':'')+'<br>'+
          '＝ '+mv+' + '+sv2+(isKap?' + '+CT.k+'(κ in the corner)':'')+' = '+(mv+sv2+(isKap?CT.k:0))+
          '<br><span class="g">≡ '+sum+'</span>（mod '+Q+'）'+
          (isKap?'<br><span class="m">Only cell (0,0) carries κ</span>':'');
      }else if(sel.m==='C'){
        if(i>j){
          body='<span class="m">The lower triangle is not published — the table is symmetric, only the upper triangle goes out, and that public part is enough.</span>';
        }else{
          var kk=0; for(var a=0;a<i;a++) for(var b=a;b<4;b++) kk++;
          kk+=(j-i);
          body='= g<sup>T['+i+']['+j+']</sup>　（g = 205555，mod 240169）<br>'+
            '＝ 205555<sup>'+M.P[i][j]+'</sup> mod 240169 = <b>'+M.T[kk]+'</b>'+
            '<br><span class="m">Group operation, not hand-computable — but it mirrors T['+i+']['+j+'] = '+M.P[i][j]+' correspond one to one (inverting is the discrete log)</span>';
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
        '<div class="coinline"><b>The encryptor’s randomness</b>　<span class="m">every “re-encrypt” draws a whole fresh set</span></div>'+
        '<div class="coinline">y = ('+cyS+')　　r = ('+crS+')　　κ = <span class="cv">'+CT.k+'</span>　　α = <span class="cv">'+CT.a+'</span></div>'+
        '<div class="coinline">μ = ( '+muParts.join(', ')+' )　<span class="m">mask weights: the first '+nc+' of them weight the constraints you ticked, the last 3 are booleanity</span></div>'+
        '<div class="coinline m">yᵢ, κ, α are uniform in [0, '+Q+'); rᵢ only runs 0–8 — so r(w) = r·w falls in a short interval and decryption can search it out.</div>';
      /* ---------- 加密四格 ---------- */
      encEl.innerHTML=
        '<div class="pcell"><div class="plab">① Mask M <span>statement + random μ</span></div>'+
          mat(CT.ct.Mask,cellOpts('M',40))+
          '<div class="resnote">M = Σ μₜCₜ (click a cell for the arithmetic)</div></div>'+
        '<div class="pcell"><div class="plab">② Search term S <span>random y, r</span></div>'+
          mat(CT.ct.S,cellOpts('S',40))+
          '<div class="resnote">Sᵢⱼ = ½(yᵢrⱼ + rᵢyⱼ)</div></div>'+
        '<div class="pcell"><div class="plab">③ Table T <span>= M + S + κ corner</span></div>'+
          mat(CT.ct.P,cellOpts('T',40))+
          '<div class="resnote">κ hides in (0,0) (gold frame)</div></div>'+
        '<div class="pcell"><div class="plab">④ Ciphertext [T] <span>seal every cell of T into the group</span></div>'+
          mat(upperGrid(CT.ct.T),cellOpts('C',48))+
          '<div class="resnote">upper triangle only; each cell = g<sup>cell value</sup></div></div>';
      /* ---------- 打包清单 ---------- */
      packEl.innerHTML=
        '<div class="packlab">Packing: the six things the encryptor finally publishes</div>'+
        '<div class="packrow"><span class="pk">[T] upper triangle</span><span class="pd">9 group elements, the table itself — κ hides in the exponent of its (0,0) cell</span></div>'+
        '<div class="packrow"><span class="pk">[y₀] … [y₃]</span><span class="pd">lets the decryptor work out ψ = y·w himself</span></div>'+
        '<div class="packrow"><span class="pk">[αT] upper triangle</span><span class="pd">an <b>α-scaled copy</b> of the table: combining it gives [α·〈T,W〉]; subtract the public [ακ] and only [αψ·r(w)] is left</span></div>'+
        '<div class="packrow"><span class="pk">[αy₀] … [αy₃]</span><span class="pd">a second copy of y, every exponent times α</span></div>'+
        '<div class="packrow"><span class="pk">[ακ]</span><span class="pd">the public reference point: the one term that turns κ from “stuck to ψ·r(w)” into “subtractable on its own”</span></div>'+
        '<div class="packrow"><span class="pk">m̃ = m + H([κ])</span><span class="pd">The message is sealed in here: m̃ = '+CT.ct.m+'（= '+CT.msg+' + H([κ])) — it can only be subtracted once [κ] is back</span></div>';
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
             '<div class="reskv"><span>message</span>'+CT.ct.m+' − '+hk+' ≡ <b>'+d.msg+'</b></div>';
      }else{
        col8='<div class="reskv dim">the search misses, so r̂ never comes up<br>→ no [κ], and m̃ cannot be opened</div>';
      }
      decEl.innerHTML=
        '<div class="pcell"><div class="plab">⑤ Build W = wwᵀ <span>only it has w</span></div>'+
          mat(W,cellOpts('W',40))+
          '<div class="resnote">the 0/1 product table, rank 1</div></div>'+
        '<div class="pcell"><div class="plab">⑥ Combine Λ, Ψ <span>using only [T] and [y]</span></div>'+
          '<div class="reskv"><span>Λ</span><b>'+d.Lam+'</b></div>'+
          '<div class="reskv"><span>Ψ</span><b>'+d.Psi+'</b></div>'+
          '<div class="resnote">Λ = Π[Tᵢⱼ]<sup>Wᵢⱼ</sup>，Ψ = Π[yᵢ]<sup>wᵢ</sup><br>'+
            'diagonal cells once, off-diagonal cells twice</div></div>'+
        '<div class="pcell"><div class="plab">⑦ Search r̂ with α copies <span>only [αT], [αy], [ακ]</span></div>'+
          '<div class="reskv"><span>Λα</span><b>'+d.La+'</b></div>'+
          '<div class="reskv"><span>Ψα</span><b>'+d.Pa+'</b></div>'+
          '<div class="resnote">try r̂ = 0,1,2,… in turn<br>check whether (Ψα)<sup>r̂</sup> = Λα<br>'+
            (d.r!==null?('<span class="g">r̂ = '+d.r+' hit</span>'):'tried all, none matched')+
            (eM!==0?'<br><span class="bad">w fails some test, and the extra term in Λα keeps the equation from ever holding</span>':'')+
          '</div></div>'+
        '<div class="pcell"><div class="plab">⑧ Recover [κ] and decrypt m̃ <span>using r̂ from the step above</span></div>'+col8+'</div>';
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
        '<div class="godlab">God\'s-eye view · why those group operations must come out right　<span class="m">(exponents are visible here; the decryptor sees only group elements)</span></div>'+
        '<div class="chain" style="margin-top:10px;font-size:12.5px">'+
        'ψ = y·w = '+yt.join(' + ')+' = '+sumY+' ≡ <b>'+ePsi+'</b><br>'+
        'r(w) = r·w = '+rt.join(' + ')+' = '+sumR+'<br>'+
        '〈M,W〉 = '+(eM===0?'0　<span class="g">✓ w passes every test</span>':'<span class="bad">'+eM+'</span>　✗ a test failed')+'<br>'+
        '〈T,W〉 = 〈M,W〉 + κ + ψ·r(w) = '+eM+' + '+CT.k+' + '+ePsi+'·'+sumR+' ≡ <b>'+eT+'</b>'+
        '　⟹ Λ should equal g<sup>'+eT+'</sup> = '+inst.seal(eT)+(okLam?' <span class="g">✓ matches ⑥</span>':' <span class="bad">✗</span>')+'<br>'+
        'exponents in the α copy: Λα = α·(⟨T,W⟩ − κ) ≡ <b>'+expLa+'</b>，Ψα = αψ ≡ <b>'+expPa+'</b><br>'+
        '　　　　(Ψα)<sup>r̂</sup> = Λα ⟺ αψ·r̂ ≡ α(〈T,W〉 − κ) ⟺ r̂ = r(w)<br>'+
        'Recover: 〈T,W〉 − ψ·r̂ ≡ '+((eT-ePsi*sumR)%Q+Q)%Q+' = κ　⟹　Λ ÷ Ψ<sup>r̂</sup> = g<sup>κ</sup> = [κ]</div>';
      /* ---------- 判定 ---------- */
      if(d.r!==null){
        vEl.className='hitbox on';
        vEl.innerHTML='<b>w = (1,'+c[0]+','+c[1]+','+c[2]+')</b> '+(ok?'✓ is a witness':'✗ not a witness')+'　'+
          (d.msg===CT.msg?'✓ the decrypted message matches the original':'(hit a coincidence)');
      }else{
        vEl.className='hitbox';
        vEl.innerHTML='<b>w = (1,'+c[0]+','+c[1]+','+c[2]+')</b> ✗ not a witness　what comes out is noise, r̂ is never found';
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
  var SRCLABEL={base:'Shared foundation',hs:'the Hair–Sahai rank template',core:'core analysis',pr:'Praxis’s changes',toy:'this page’s toy'};
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

