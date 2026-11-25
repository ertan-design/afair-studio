/* İpek Rüzgâr — dış kütüphanesiz WebGL kumaş.
   Fizik: Verlet parçacık ağı (yapısal + kesme + bükülme bağları), üst kenar askıda.
   Rüzgâr: her üçgene yüzey normaline göre basınç; yön, güç ve yerçekimini kullanıcı yönetir.
   Işık: loş oda, sıcak ana ışık + soğuk kenar ışığı, iplik yönünde parıltı, prosedürel dokuma, düzlemsel yer gölgesi. */
(() => {
  "use strict";
  const tuval = document.getElementById("sahne");
  const gl = tuval.getContext("webgl", { antialias: true, stencil: true, alpha: false, premultipliedAlpha: false });
  if (!gl) {
    const d = document.createElement("p"); d.className = "hata";
    d.textContent = "Bu tarayıcı WebGL açmıyor. Kumaş sahnesi için güncel bir tarayıcı gerekiyor.";
    document.body.appendChild(d); return;
  }

  // ---------- kumaşlar ----------
  const KUMAS = {
    ipek:   { renk: [0.62, 0.50, 0.36], arka: [0.30, 0.22, 0.15], parilti: 0.95, sertlik: 0.55, kutle: 0.6, dokuma: 220, puruz: 0.10 },
    keten:  { renk: [0.66, 0.62, 0.55], arka: [0.36, 0.33, 0.29], parilti: 0.18, sertlik: 0.85, kutle: 1.0, dokuma: 140, puruz: 0.55 },
    kadife: { renk: [0.26, 0.05, 0.08], arka: [0.12, 0.02, 0.03], parilti: 0.55, sertlik: 0.70, kutle: 1.4, dokuma: 320, puruz: 0.35 },
  };
  let kumas = KUMAS.ipek;

  // ---------- kumaş ağı ----------
  const NX = 48, NY = 44, GEN = 1.9, BOY = 2.9, UST = 1.45;
  const N = NX * NY;
  const HUCRE = (GEN / (NX - 1)) * (BOY / (NY - 1));
  const P = new Float32Array(N * 3), O = new Float32Array(N * 3), Nr = new Float32Array(N * 3);
  const sabit = new Uint8Array(N);
  const bag = [];
  const id = (i, j) => j * NX + i;

  function kur() {
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = id(i, j) * 3;
      P[k] = (i / (NX - 1) - 0.5) * GEN;
      P[k + 1] = UST - (j / (NY - 1)) * BOY;
      P[k + 2] = Math.sin(i * 0.55) * 0.03;               // halka askı kıvrımı
      O[k] = P[k]; O[k + 1] = P[k + 1]; O[k + 2] = P[k + 2];
      sabit[id(i, j)] = j === 0 && (i % 4 === 0 || i === NX - 1) ? 1 : 0;
    }
  }
  function bagla(a, b, tur) {
    const dx = P[a * 3] - P[b * 3], dy = P[a * 3 + 1] - P[b * 3 + 1], dz = P[a * 3 + 2] - P[b * 3 + 2];
    bag.push(a, b, Math.hypot(dx, dy, dz), tur);
  }
  kur();
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    if (i < NX - 1) bagla(id(i, j), id(i + 1, j), 0);
    if (j < NY - 1) bagla(id(i, j), id(i, j + 1), 0);
    if (i < NX - 1 && j < NY - 1) { bagla(id(i, j), id(i + 1, j + 1), 1); bagla(id(i + 1, j), id(i, j + 1), 1); }
    if (i < NX - 2) bagla(id(i, j), id(i + 2, j), 2);
    if (j < NY - 2) bagla(id(i, j), id(i, j + 2), 2);
  }
  const B = new Float32Array(bag);

  const idx = [];
  for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) {
    const a = id(i, j), b = id(i + 1, j), c = id(i, j + 1), d = id(i + 1, j + 1);
    idx.push(a, c, b, b, c, d);
  }
  const I = new Uint16Array(idx);
  const UV = new Float32Array(N * 2);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { UV[id(i, j) * 2] = i / (NX - 1); UV[id(i, j) * 2 + 1] = j / (NY - 1); }

  // ---------- kontroller ----------
  const $ = (s) => document.getElementById(s);
  const ayar = { guc: 0.6, yon: 45, agirlik: 0.4 };
  let oynuyor = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const oynatBtn = $("oynat");
  function oynatYaz() { oynatBtn.textContent = oynuyor ? "Durdur" : "Oynat"; oynatBtn.setAttribute("aria-pressed", String(oynuyor)); }
  oynatYaz();
  function kaydir(ad, bicim, donus) {
    const g = $(ad), o = $(ad + "-o");
    const yaz = () => { ayar[ad] = donus(+g.value); o.textContent = bicim(+g.value); };
    g.addEventListener("input", yaz); yaz();
  }
  kaydir("guc", (v) => String(v), (v) => v / 100);
  kaydir("yon", (v) => v + "°", (v) => v);
  kaydir("agirlik", (v) => "%" + v, (v) => v / 100);
  document.querySelectorAll('input[name="kumas"]').forEach((r) => r.addEventListener("change", () => { kumas = KUMAS[r.value]; }));
  oynatBtn.addEventListener("click", () => { oynuyor = !oynuyor; oynatYaz(); });
  $("sifirla").addEventListener("click", () => { kur(); kam.yaw = 0.5; kam.pitch = 0.12; kam.uzak = 6.2; });

  // ---------- kamera: 360° sürükle ----------
  const kam = { yaw: 0.5, pitch: 0.12, uzak: 6.2 };
  let surukle = null;
  tuval.addEventListener("pointerdown", (e) => { surukle = { x: e.clientX, y: e.clientY }; tuval.setPointerCapture(e.pointerId); $("ipucu").style.opacity = "0"; });
  tuval.addEventListener("pointermove", (e) => {
    if (!surukle) return;
    kam.yaw -= (e.clientX - surukle.x) * 0.008;
    kam.pitch = Math.max(-0.35, Math.min(1.1, kam.pitch + (e.clientY - surukle.y) * 0.006));
    surukle = { x: e.clientX, y: e.clientY };
  });
  const birak = () => { surukle = null; };
  tuval.addEventListener("pointerup", birak); tuval.addEventListener("pointercancel", birak);
  tuval.addEventListener("wheel", (e) => { e.preventDefault(); kam.uzak = Math.max(3.4, Math.min(11, kam.uzak * (1 + Math.sign(e.deltaY) * 0.08))); }, { passive: false });
  tuval.tabIndex = 0;
  tuval.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") kam.yaw += 0.12; else if (e.key === "ArrowRight") kam.yaw -= 0.12;
    else if (e.key === "ArrowUp") kam.pitch = Math.min(1.1, kam.pitch + 0.08); else if (e.key === "ArrowDown") kam.pitch = Math.max(-0.35, kam.pitch - 0.08);
    else return;
    e.preventDefault();
  });

  // ---------- fizik ----------
  const F = new Float32Array(N * 3);
  function adim(t, dt) {
    F.fill(0);
    const g = -9.8 * ayar.agirlik * 0.55;
    const a = (ayar.yon * Math.PI) / 180;
    const wx = Math.cos(a), wz = Math.sin(a);
    // basınç (birim alana): kuvvet = n̂ · alan · (n̂·rüzgâr) · basınç; ivme = kuvvet / (yoğunluk · hücre alanı)
    const guc = ayar.guc * 16;
    // rüzgâr basıncı: üçgen normali ile rüzgârın izdüşümü
    for (let n = 0; n < I.length; n += 3) {
      const ia = I[n] * 3, ib = I[n + 1] * 3, ic = I[n + 2] * 3;
      const ux = P[ib] - P[ia], uy = P[ib + 1] - P[ia + 1], uz = P[ib + 2] - P[ia + 2];
      const vx = P[ic] - P[ia], vy = P[ic + 1] - P[ia + 1], vz = P[ic + 2] - P[ia + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const cx = (P[ia] + P[ib] + P[ic]) / 3, cy = (P[ia + 1] + P[ib + 1] + P[ic + 1]) / 3;
      const titres = 0.55 + 0.45 * Math.sin(t * 1.7 + cx * 2.1 + cy * 1.3) * Math.cos(t * 0.9 - cy * 1.7);
      const uz2 = Math.hypot(nx, ny, nz) || 1e-9;                 // = 2 × üçgen alanı
      const s = ((nx * wx + nz * wz) / uz2) * guc * titres / 6;   // n (2A uzunlukta) ile çarpılınca A/3 pay
      for (const v of [ia, ib, ic]) { F[v] += nx * s; F[v + 1] += ny * s; F[v + 2] += nz * s; }
    }
    const kutle = kumas.kutle, sond = 0.992;
    const dt2 = dt * dt;
    for (let n = 0; n < N; n++) {
      if (sabit[n]) continue;
      const k = n * 3;
      for (let e = 0; e < 3; e++) {
        const x = P[k + e], ivme = F[k + e] / (kutle * HUCRE) + (e === 1 ? g : 0);
        P[k + e] = x + (x - O[k + e]) * sond + ivme * dt2;
        O[k + e] = x;
      }
    }
    const sert = kumas.sertlik;
    for (let tur = 0; tur < 7; tur++) {
      for (let m = 0; m < B.length; m += 4) {
        const a1 = B[m] * 3, b1 = B[m + 1] * 3, L = B[m + 2], tip = B[m + 3];
        const dx = P[b1] - P[a1], dy = P[b1 + 1] - P[a1 + 1], dz = P[b1 + 2] - P[a1 + 2];
        const d = Math.hypot(dx, dy, dz) || 1e-6;
        let fark = (d - L) / d;
        fark *= tip === 2 ? 0.25 * sert : tip === 1 ? 0.45 : 0.5;
        const sa = sabit[B[m]], sb = sabit[B[m + 1]];
        const wa = sa ? 0 : sb ? 1 : 0.5, wb = sb ? 0 : sa ? 1 : 0.5;
        P[a1] += dx * fark * wa * 2; P[a1 + 1] += dy * fark * wa * 2; P[a1 + 2] += dz * fark * wa * 2;
        P[b1] -= dx * fark * wb * 2; P[b1 + 1] -= dy * fark * wb * 2; P[b1 + 2] -= dz * fark * wb * 2;
      }
    }
    // zemin
    for (let n = 0; n < N; n++) { const k = n * 3 + 1; if (P[k] < ZEMIN + 0.01) { P[k] = ZEMIN + 0.01; } }
  }
  function normaller() {
    Nr.fill(0);
    for (let n = 0; n < I.length; n += 3) {
      const ia = I[n] * 3, ib = I[n + 1] * 3, ic = I[n + 2] * 3;
      const ux = P[ib] - P[ia], uy = P[ib + 1] - P[ia + 1], uz = P[ib + 2] - P[ia + 2];
      const vx = P[ic] - P[ia], vy = P[ic + 1] - P[ia + 1], vz = P[ic + 2] - P[ia + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const v of [ia, ib, ic]) { Nr[v] += nx; Nr[v + 1] += ny; Nr[v + 2] += nz; }
    }
  }

  // ---------- gölgelendiriciler ----------
  const ZEMIN = -1.75;
  const ISIK = norm([-0.45, 1.0, 0.55]);
  function norm(v) { const l = Math.hypot(...v); return v.map((x) => x / l); }
  function derle(vs, fs) {
    const p = gl.createProgram();
    for (const [tip, kod] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(tip); gl.shaderSource(s, kod); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    }
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  const kumasP = derle(`
    attribute vec3 aP; attribute vec3 aN; attribute vec2 aUV;
    uniform mat4 uVP; varying vec3 vP; varying vec3 vN; varying vec2 vUV;
    void main(){ vP=aP; vN=aN; vUV=aUV; gl_Position=uVP*vec4(aP,1.0); }`, `
    precision highp float;
    varying vec3 vP; varying vec3 vN; varying vec2 vUV;
    uniform vec3 uKam, uIsik, uRenk, uArka; uniform float uParilti, uDokuma, uPuruz, uZaman;
    void main(){
      vec3 n=normalize(vN); vec3 r=uRenk;
      if(!gl_FrontFacing){ n=-n; r=uArka; }
      vec3 V=normalize(uKam-vP);
      // dokuma: atkı ve çözgü ipliklerinin dimi düzeni
      vec2 q=vUV*uDokuma;
      float atki=sin(q.x*3.14159), cozgu=sin(q.y*3.14159);
      float dimi=step(0.5,fract((floor(q.x)+floor(q.y))*0.5));
      float iplik=mix(abs(atki),abs(cozgu),dimi);
      float doku=mix(1.0,0.78+0.22*iplik,uPuruz+0.25);
      // ana ışık (sıcak), kenar ışığı (soğuk), çok az ortam
      float dif=max(dot(n,uIsik),0.0);
      vec3 T=normalize(cross(n,vec3(0.0,1.0,0.0))+vec3(1e-4));
      vec3 H=normalize(uIsik+V);
      float th=dot(T,H); float sinTH=sqrt(max(1.0-th*th,0.0));
      float ani=pow(sinTH,mix(18.0,90.0,uParilti))*uParilti;          // ipliğe dik parıltı
      vec3 kenarIsik=normalize(vec3(0.7,0.25,-0.8));
      float kenar=pow(1.0-max(dot(n,V),0.0),3.0)*max(dot(n,kenarIsik)+0.4,0.0);
      float alt=smoothstep(-1.8,1.6,vP.y);                                 // yukarıdan düşen ışık
      vec3 c=r*doku*(0.045+dif*1.15*alt)*vec3(1.08,0.98,0.86)
            +vec3(1.0,0.86,0.64)*ani*0.55*alt*dif
            +vec3(0.42,0.52,0.70)*kenar*0.35;
      // sürreal: kumaşın içinden geçen ince altın ışık damarı
      float damar=smoothstep(0.996,1.0,sin(vUV.y*11.0-uZaman*0.6+vUV.x*3.0));
      float parlak=dot(uRenk,vec3(0.3,0.5,0.2));
      c+=vec3(0.85,0.66,0.38)*damar*0.16*parlak*alt*dif;
      c=c/(c+vec3(0.85));                                                  // yumuşak ton eşleme
      gl_FragColor=vec4(pow(c,vec3(1.0/2.2)),1.0);
    }`);
  const zeminP = derle(`
    attribute vec2 aXZ; uniform mat4 uVP; uniform float uY; varying vec2 vXZ;
    void main(){ vXZ=aXZ; gl_Position=uVP*vec4(aXZ.x,uY,aXZ.y,1.0); }`, `
    precision highp float; varying vec2 vXZ;
    void main(){
      float d=length(vXZ*vec2(0.55,0.75));
      float havuz=exp(-d*d*0.9);                                           // ışık havuzu
      vec3 c=vec3(0.020,0.018,0.016)+vec3(0.11,0.085,0.06)*havuz;
      gl_FragColor=vec4(pow(c,vec3(1.0/2.2)),1.0);
    }`);
  const golgeP = derle(`
    attribute vec3 aP; uniform mat4 uVP; uniform vec3 uIsik; uniform float uY; varying float vYuk;
    void main(){ float t=(aP.y-uY)/uIsik.y; vec3 g=aP-uIsik*t; g.y=uY+0.002; vYuk=aP.y-uY; gl_Position=uVP*vec4(g,1.0); }`, `
    precision mediump float; varying float vYuk;
    void main(){ float a=0.62*exp(-vYuk*0.38); gl_FragColor=vec4(0.0,0.0,0.0,a); }`);

  const tampon = (veri, tip = gl.ARRAY_BUFFER, kul = gl.STATIC_DRAW) => { const b = gl.createBuffer(); gl.bindBuffer(tip, b); gl.bufferData(tip, veri, kul); return b; };
  const bP = tampon(P, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), bN = tampon(Nr, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), bUV = tampon(UV);
  const bI = tampon(I, gl.ELEMENT_ARRAY_BUFFER);
  const bZ = tampon(new Float32Array([-9, -9, 9, -9, -9, 9, 9, 9]));

  function ozellik(p, ad, b, boyut) { const l = gl.getAttribLocation(p, ad); if (l < 0) return; gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, boyut, gl.FLOAT, false, 0, 0); }
  function kapat(p) { const n = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES); for (let i = 0; i < 8; i++) gl.disableVertexAttribArray(i); return n; }
  const u = (p, ad) => gl.getUniformLocation(p, ad);

  // ---------- matris ----------
  function persp(f, a, n, z) { const t = 1 / Math.tan(f / 2); return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (z + n) / (n - z), -1, 0, 0, (2 * z * n) / (n - z), 0]; }
  function bak(g, h) {
    const z = norm([g[0] - h[0], g[1] - h[1], g[2] - h[2]]);
    const x = norm([z[2], 0, -z[0]]); const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
      -(x[0] * g[0] + x[1] * g[1] + x[2] * g[2]), -(y[0] * g[0] + y[1] * g[1] + y[2] * g[2]), -(z[0] * g[0] + z[1] * g[1] + z[2] * g[2]), 1];
  }
  function carp(a, b) { const o = new Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }

  // ---------- çizim ----------
  function boyutla() {
    const o = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(tuval.clientWidth * o), h = Math.round(tuval.clientHeight * o);
    if (tuval.width !== w || tuval.height !== h) { tuval.width = w; tuval.height = h; }
  }
  let zaman = 0, onceki = performance.now(), birikim = 0;
  const DT = 1 / 90;
  function kare(simdi) {
    boyutla();
    const fark = Math.min(0.05, (simdi - onceki) / 1000); onceki = simdi;
    if (oynuyor) { birikim += fark; while (birikim >= DT) { zaman += DT; adim(zaman, DT); birikim -= DT; } }
    normaller();
    const hedef = [0, -0.05, 0];
    const g = [hedef[0] + kam.uzak * Math.cos(kam.pitch) * Math.sin(kam.yaw), hedef[1] + kam.uzak * Math.sin(kam.pitch), hedef[2] + kam.uzak * Math.cos(kam.pitch) * Math.cos(kam.yaw)];
    const VP = carp(persp(0.62, tuval.width / tuval.height, 0.1, 60), bak(g, hedef));

    gl.viewport(0, 0, tuval.width, tuval.height);
    gl.clearColor(0.011, 0.010, 0.009, 1); gl.clearStencil(0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // zemin
    gl.useProgram(zeminP); kapat(zeminP); ozellik(zeminP, "aXZ", bZ, 2);
    gl.uniformMatrix4fv(u(zeminP, "uVP"), false, VP); gl.uniform1f(u(zeminP, "uY"), ZEMIN);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // gölge: stencil ile tek kat koyuluk
    gl.bindBuffer(gl.ARRAY_BUFFER, bP); gl.bufferSubData(gl.ARRAY_BUFFER, 0, P);
    gl.bindBuffer(gl.ARRAY_BUFFER, bN); gl.bufferSubData(gl.ARRAY_BUFFER, 0, Nr);
    gl.useProgram(golgeP); kapat(golgeP); ozellik(golgeP, "aP", bP, 3);
    gl.uniformMatrix4fv(u(golgeP, "uVP"), false, VP); gl.uniform3fv(u(golgeP, "uIsik"), ISIK); gl.uniform1f(u(golgeP, "uY"), ZEMIN);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.STENCIL_TEST); gl.stencilFunc(gl.EQUAL, 0, 0xff); gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
    gl.depthMask(false);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bI); gl.drawElements(gl.TRIANGLES, I.length, gl.UNSIGNED_SHORT, 0);
    gl.depthMask(true); gl.disable(gl.STENCIL_TEST); gl.disable(gl.BLEND);

    // kumaş
    gl.useProgram(kumasP); kapat(kumasP);
    ozellik(kumasP, "aP", bP, 3); ozellik(kumasP, "aN", bN, 3); ozellik(kumasP, "aUV", bUV, 2);
    gl.uniformMatrix4fv(u(kumasP, "uVP"), false, VP);
    gl.uniform3fv(u(kumasP, "uKam"), g); gl.uniform3fv(u(kumasP, "uIsik"), ISIK);
    gl.uniform3fv(u(kumasP, "uRenk"), kumas.renk); gl.uniform3fv(u(kumasP, "uArka"), kumas.arka);
    gl.uniform1f(u(kumasP, "uParilti"), kumas.parilti); gl.uniform1f(u(kumasP, "uDokuma"), kumas.dokuma);
    gl.uniform1f(u(kumasP, "uPuruz"), kumas.puruz); gl.uniform1f(u(kumasP, "uZaman"), zaman);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bI); gl.drawElements(gl.TRIANGLES, I.length, gl.UNSIGNED_SHORT, 0);

    let zmin = 9, zmax = -9, ymin = 9;
    for (let n = 0; n < N; n++) { const z = P[n * 3 + 2]; if (z < zmin) zmin = z; if (z > zmax) zmax = z; if (P[n * 3 + 1] < ymin) ymin = P[n * 3 + 1]; }
    window.__ipek = { kare: (window.__ipek?.kare || 0) + 1, zaman, derinlik: +(zmax - zmin).toFixed(3), etek: +ymin.toFixed(3) };
    requestAnimationFrame(kare);
  }
  // açılışta kumaş havada asılı başlasın: birkaç saniyelik ön çözüm
  for (let i = 0; i < 240; i++) { zaman += DT; adim(zaman, DT); }
  requestAnimationFrame(kare);
})();
