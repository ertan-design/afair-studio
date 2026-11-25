// KUMAS: gercek zamanli kumas fizigi (Verlet kutle-yay) + WebGL2 isik. Kutuphane yok.
// Kumasi surukle: tut ve cek. Bosluga surukle: 360 derece don. Teker: yaklas. Ruzgar ve nefes kullanicida.
// GPT ve betikler icin: window.KUMAS = { malzeme(ad), ruzgar(0..1), nefes(), donus(derece), durum() }
(() => {
  'use strict';
  const tuval = document.getElementById('kumas3d');
  if (!tuval) return;
  const gl = tuval.getContext('webgl2', { antialias: true, alpha: false });
  if (!gl) { tuval.dispatchEvent(new CustomEvent('kumas-yok')); return; }
  const sakin = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- matris ----------
  const M = {
    carp(a, b) { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; },
    persp(f, en, y, u) { const t = 1 / Math.tan(f / 2), n = 1 / (y - u); return new Float32Array([t / en, 0, 0, 0, 0, t, 0, 0, 0, 0, (u + y) * n, -1, 0, 0, 2 * u * y * n, 0]); },
    bak(g, h, up) {
      const z = nrm([g[0] - h[0], g[1] - h[1], g[2] - h[2]]), x = nrm(crs(up, z)), y = crs(z, x);
      return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, g), -dot(y, g), -dot(z, g), 1]);
    },
  };
  function nrm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function crs(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  // ---------- malzemeler: gercek kumas tipleri ----------
  const MALZEME = {
    saten: { ad: 'İpek saten', renk: [0.06, 0.2, 0.15], tur: 0, parlak: 1.0, agirlik: 1.0 },
    kadife: { ad: 'Kadife', renk: [0.24, 0.03, 0.06], tur: 1, parlak: 0.9, agirlik: 1.5 },
    keten: { ad: 'Keten', renk: [0.55, 0.47, 0.36], tur: 2, parlak: 0.25, agirlik: 1.2 },
  };
  let malz = MALZEME.saten;

  // ---------- kumas agi ----------
  const S = 40, Y = 56, ARA = 0.05, TEPE = 2.75, N = S * Y;
  const p = new Float32Array(N * 3), o = new Float32Array(N * 3), sabit = new Uint8Array(N), uv = new Float32Array(N * 2);
  for (let j = 0; j < Y; j++) for (let i = 0; i < S; i++) {
    const k = j * S + i, x = (i - (S - 1) / 2) * ARA, y = TEPE - j * ARA * 0.98, z = (j * 0.003) * Math.sin(i * 0.4);
    p.set([x, y, z], k * 3); o.set([x, y, z], k * 3); uv.set([i / (S - 1), j / (Y - 1)], k * 2);
    if (j === 0 && (i % 3 === 0 || i === S - 1)) sabit[k] = 1;   // cubuga 14 halkayla asili: dogal pili
  }
  const bag = [];
  const ekle = (a, b, sert) => { const dx = p[a * 3] - p[b * 3], dy = p[a * 3 + 1] - p[b * 3 + 1], dz = p[a * 3 + 2] - p[b * 3 + 2]; bag.push(a, b, Math.hypot(dx, dy, dz), sert); };
  for (let j = 0; j < Y; j++) for (let i = 0; i < S; i++) {
    const k = j * S + i;
    if (i < S - 1) ekle(k, k + 1, 1); if (j < Y - 1) ekle(k, k + S, 1);
    if (i < S - 1 && j < Y - 1) { ekle(k, k + S + 1, 0.7); ekle(k + 1, k + S, 0.7); }
    if (i < S - 2) ekle(k, k + 2, 0.25); if (j < Y - 2) ekle(k, k + 2 * S, 0.25);   // bukulme direnci
  }
  const BAG = new Float32Array(bag);
  const idx = []; for (let j = 0; j < Y - 1; j++) for (let i = 0; i < S - 1; i++) { const k = j * S + i; idx.push(k, k + S, k + 1, k + 1, k + S, k + S + 1); }
  const IDX = new Uint16Array(idx), nor = new Float32Array(N * 3), kuv = new Float32Array(N * 3);

  // ---------- fizik ----------
  let ruzgar = 0.55, nefesG = 0, zaman = 0, tutulan = -1, hedef = null;
  function adim(h) {
    const t = zaman, g = -9.8 * h * h * malz.agirlik;
    const yon = nrm([Math.sin(t * 0.11) * 0.8, 0.05, 1]);
    const ufle = ruzgar * (0.55 + 0.45 * Math.sin(t * 1.3) * Math.sin(t * 0.37 + 1.7)) * 3.2 + nefesG * 9;
    kuv.fill(0);
    for (let q = 0; q < IDX.length; q += 3) {                      // ucgen basina aerodinamik kuvvet
      const a = IDX[q] * 3, b = IDX[q + 1] * 3, c = IDX[q + 2] * 3;
      const e1 = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]], e2 = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
      const n = crs(e1, e2), dl = Math.hypot(n[0], n[1], n[2]) || 1, f = ufle * dot(n, yon) / dl * 0.5 / dl;   // ivme: yuzeye dik bilesen
      for (const v of [a, b, c]) { kuv[v] += n[0] * f; kuv[v + 1] += n[1] * f; kuv[v + 2] += n[2] * f; }
    }
    for (let k = 0; k < N; k++) {
      if (sabit[k]) continue; const i = k * 3;
      for (let a = 0; a < 3; a++) {
        const simdi = p[i + a], hiz = (simdi - o[i + a]) * 0.985;
        o[i + a] = simdi; p[i + a] = simdi + hiz + kuv[i + a] * h * h + (a === 1 ? g : 0);
      }
      if (p[i + 1] < 0.02) p[i + 1] = 0.02;                         // zemin
    }
    for (let tekrar = 0; tekrar < 10; tekrar++) {
      for (let q = 0; q < BAG.length; q += 4) {
        const a = BAG[q] * 3, b = BAG[q + 1] * 3, uz = BAG[q + 2], s = BAG[q + 3];
        const dx = p[b] - p[a], dy = p[b + 1] - p[a + 1], dz = p[b + 2] - p[a + 2], d = Math.hypot(dx, dy, dz) || 1e-6;
        const fark = (d - uz) / d * 0.5 * s, wa = sabit[a / 3] ? 0 : 1, wb = sabit[b / 3] ? 0 : 1, top = wa + wb;
        if (!top) continue;
        const ka = fark * 2 * wa / top, kb = fark * 2 * wb / top;
        p[a] += dx * ka; p[a + 1] += dy * ka; p[a + 2] += dz * ka; p[b] -= dx * kb; p[b + 1] -= dy * kb; p[b + 2] -= dz * kb;
      }
      if (tutulan >= 0) { const i = tutulan * 3; p[i] = hedef[0]; p[i + 1] = hedef[1]; p[i + 2] = hedef[2]; o.set(hedef, i); }
    }
    nefesG *= 0.92;
  }
  function normaller() {
    nor.fill(0);
    for (let q = 0; q < IDX.length; q += 3) {
      const a = IDX[q] * 3, b = IDX[q + 1] * 3, c = IDX[q + 2] * 3;
      const n = crs([p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]], [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]]);
      for (const v of [a, b, c]) { nor[v] += n[0]; nor[v + 1] += n[1]; nor[v + 2] += n[2]; }
    }
  }

  // ---------- golgelendiriciler ----------
  const derle = (t, k) => { const s = gl.createShader(t); gl.shaderSource(s, k); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = (a, b) => { const x = gl.createProgram(); gl.attachShader(x, derle(gl.VERTEX_SHADER, a)); gl.attachShader(x, derle(gl.FRAGMENT_SHADER, b)); gl.linkProgram(x); return x; };
  const ISIK = `const vec3 ANA = vec3(-1.6, 4.4, 2.6); const vec3 ARKA = vec3(1.8, 3.2, -3.2);`;
  const P_KUMAS = prog(`#version 300 es
    layout(location=0) in vec3 p; layout(location=1) in vec3 n; layout(location=2) in vec2 t;
    uniform mat4 u_vp; uniform float u_ayna; out vec3 v_w, v_n; out vec2 v_t;
    void main(){ vec3 w = vec3(p.x, p.y * u_ayna, p.z); v_w = w; v_n = vec3(n.x, n.y * u_ayna, n.z); v_t = t; gl_Position = u_vp * vec4(w, 1.0); }`,
  `#version 300 es
    precision highp float; in vec3 v_w, v_n; in vec2 v_t; out vec4 renk;
    uniform vec3 u_kam, u_renk; uniform float u_tur, u_parlak, u_karart; ${ISIK}
    float h(vec2 q){ return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
    void main(){
      vec3 N = normalize(v_n); if (!gl_FrontFacing) N = -N;
      vec3 V = normalize(u_kam - v_w), L = normalize(ANA - v_w), R = normalize(ARKA - v_w), H = normalize(L + V);
      vec3 T = normalize(dFdx(v_w) * dFdy(v_t).y - dFdy(v_w) * dFdx(v_t).y);       // cozgu yonu
      vec3 B = normalize(cross(N, T));
      vec2 q = v_t * vec2(720.0, 1000.0); vec2 id = floor(q), f = fract(q);                // iplik ~2,8 mm: yalniz yakindan secilir
      float aa = clamp(1.6 - max(fwidth(q.x), fwidth(q.y)) * 2.2, 0.0, 1.0);          // uzakta desen sonumlenir: hare yok
      float saten = mix(0.18, step(0.5, fract((id.x + id.y * 3.0) / 5.0) * 2.0 - 0.6), aa);   // 5 cerceveli saten atlama
      vec3 iplik = normalize(mix(T, B, saten));
      float havuz = smoothstep(0.55, 0.95, dot(normalize(vec3(0.0, 1.2, 0.0) - ANA), -L));  // spot isigi havuzu
      float dif = max(dot(N, L), 0.0), arka = pow(max(dot(N, R), 0.0), 1.5);
      float lif = 1.0 + aa * (0.1 * sin((saten > 0.5 ? f.x : f.y) * 6.2832) + 0.06 * (h(id) - 0.5));
      vec3 c = u_renk * (0.03 + dif * (0.25 + 1.35 * havuz)) * lif;
      if (u_tur < 0.5) {                                            // ipek saten: Kajiya-Kay anizotropik parlama
        float th = dot(iplik, H), sp = pow(sqrt(max(1.0 - th * th, 0.0)), 70.0);
        c += mix(vec3(1.0, 0.96, 0.88), u_renk * 4.0, 0.35) * sp * (0.1 + 0.85 * havuz) * u_parlak * dif;
      } else if (u_tur < 1.5) {                                     // kadife: havli kenar parlamasi
        float kenar = pow(1.0 - abs(dot(N, V)), 2.4);
        c = c * 0.55 + u_renk * 2.6 * kenar * (0.2 + havuz) + u_renk * 0.9 * kenar * arka;
      } else {                                                      // keten: mat, iplik kalinligi farkli
        c *= 1.0 + aa * 0.3 * (h(floor(q * vec2(0.5, 1.0))) - 0.5);
        c += vec3(0.9, 0.85, 0.75) * pow(max(dot(N, H), 0.0), 12.0) * 0.06 * havuz;
      }
      c += vec3(0.55, 0.6, 0.75) * arka * 0.18 * u_parlak;          // arka (rim) isik
      renk = vec4(c * u_karart, 1.0);
    }`);
  const P_ZEMIN = prog(`#version 300 es
    layout(location=0) in vec2 p; uniform mat4 u_vp; out vec3 v_w;
    void main(){ v_w = vec3(p.x, 0.0, p.y); gl_Position = u_vp * vec4(v_w, 1.0); }`,
  `#version 300 es
    precision highp float; in vec3 v_w; out vec4 renk; ${ISIK}
    void main(){ float havuz = exp(-dot(v_w.xz - vec2(-0.3, 0.6), v_w.xz - vec2(-0.3, 0.6)) / 3.2);
      float r = length(v_w.xz); vec3 c = vec3(0.012, 0.011, 0.012) + vec3(0.09, 0.075, 0.06) * havuz;
      renk = vec4(c, mix(0.86, 0.97, smoothstep(0.0, 4.0, r))); }`);
  const P_GOLGE = prog(`#version 300 es
    layout(location=0) in vec3 p; uniform mat4 u_vp; uniform vec2 u_kay; ${ISIK}
    void main(){ vec3 L = normalize(ANA - vec3(0.0, 1.4, 0.0)); vec3 g = p - L * (p.y / L.y); g.xz += u_kay; g.y = 0.002; gl_Position = u_vp * vec4(g, 1.0); }`,
  `#version 300 es
    precision highp float; out vec4 renk; void main(){ renk = vec4(0.0, 0.0, 0.0, 0.09); }`);
  const P_CUBUK = prog(`#version 300 es
    layout(location=0) in vec3 p; uniform mat4 u_vp; out vec3 v_w; void main(){ v_w = p; gl_Position = u_vp * vec4(p, 1.0); }`,
  `#version 300 es
    precision highp float; in vec3 v_w; out vec4 renk; void main(){ renk = vec4(vec3(0.75, 0.62, 0.38) * (0.35 + 0.65 * smoothstep(-1.2, 1.2, -v_w.x)), 1.0); }`);
  const U = (x, ...a) => Object.fromEntries(a.map((n) => [n, gl.getUniformLocation(x, n)]));
  const UK = U(P_KUMAS, 'u_vp', 'u_ayna', 'u_kam', 'u_renk', 'u_tur', 'u_parlak', 'u_karart'), UZ = U(P_ZEMIN, 'u_vp'), UG = U(P_GOLGE, 'u_vp', 'u_kay'), UC = U(P_CUBUK, 'u_vp');

  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const tPos = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, tPos); gl.bufferData(gl.ARRAY_BUFFER, p.byteLength, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  const tNor = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, tNor); gl.bufferData(gl.ARRAY_BUFFER, nor.byteLength, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  const tUv = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, tUv); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
  const tIdx = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, IDX, gl.STATIC_DRAW);
  const vaoZ = gl.createVertexArray(); gl.bindVertexArray(vaoZ); const z = 12;
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-z, -z, z, -z, z, z, -z, -z, z, z, -z, z]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const vaoC = gl.createVertexArray(); gl.bindVertexArray(vaoC);
  const cb = [], cx = (S - 1) / 2 * ARA + 0.16, cy = TEPE + 0.03, r = 0.022;
  for (let a = 0; a < 12; a++) { const t1 = a / 12 * 6.2832, t2 = (a + 1) / 12 * 6.2832, y1 = cy + Math.cos(t1) * r, z1 = Math.sin(t1) * r, y2 = cy + Math.cos(t2) * r, z2 = Math.sin(t2) * r;
    cb.push(-cx, y1, z1, cx, y1, z1, cx, y2, z2, -cx, y1, z1, cx, y2, z2, -cx, y2, z2); }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cb), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.enable(gl.DEPTH_TEST);

  // ---------- kamera ----------
  const kam = { yaw: 0.35, egim: 0.12, uzak: 4.6, hedef: [0, 1.45, 0] };
  let otomatik = !sakin, dpr = 1, vp = null, kamPos = [0, 0, 0];
  const boyutla = () => { dpr = Math.min(devicePixelRatio || 1, 2); tuval.width = Math.round(tuval.clientWidth * dpr); tuval.height = Math.round(tuval.clientHeight * dpr); };
  new ResizeObserver(boyutla).observe(tuval); boyutla();

  let once = performance.now(), birikim = 0;
  function kare(t) {
    const gecen = Math.min(0.1, (t - once) / 1000); once = t; birikim += gecen; zaman += gecen;
    let say = 0; while (birikim >= 1 / 60 && say < 4) { adim(1 / 60); birikim -= 1 / 60; say++; }
    if (say === 4) birikim = 0;
    if (otomatik) kam.yaw += gecen * 0.08;
    normaller();
    gl.bindBuffer(gl.ARRAY_BUFFER, tPos); gl.bufferSubData(gl.ARRAY_BUFFER, 0, p);
    gl.bindBuffer(gl.ARRAY_BUFFER, tNor); gl.bufferSubData(gl.ARRAY_BUFFER, 0, nor);
    const uz = kam.uzak * Math.max(1, 0.95 / (tuval.width / tuval.height));   // dikey ekranda kumas sigsin
    kamPos = [kam.hedef[0] + uz * Math.cos(kam.egim) * Math.sin(kam.yaw), kam.hedef[1] + uz * Math.sin(kam.egim), kam.hedef[2] + uz * Math.cos(kam.egim) * Math.cos(kam.yaw)];
    vp = M.carp(M.persp(0.72, tuval.width / tuval.height, 0.05, 60), M.bak(kamPos, kam.hedef, [0, 1, 0]));
    gl.viewport(0, 0, tuval.width, tuval.height); gl.clearColor(0.008, 0.008, 0.01, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.CULL_FACE);
    // 1 yansima (sureal ayna zemin)
    gl.useProgram(P_KUMAS); gl.bindVertexArray(vao); gl.uniformMatrix4fv(UK.u_vp, false, vp); gl.uniform3fv(UK.u_kam, kamPos);
    gl.uniform3fv(UK.u_renk, malz.renk); gl.uniform1f(UK.u_tur, malz.tur); gl.uniform1f(UK.u_parlak, malz.parlak);
    gl.uniform1f(UK.u_ayna, -1); gl.uniform1f(UK.u_karart, 0.35); gl.drawElements(gl.TRIANGLES, IDX.length, gl.UNSIGNED_SHORT, 0);
    // 2 zemin
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(P_ZEMIN); gl.bindVertexArray(vaoZ); gl.uniformMatrix4fv(UZ.u_vp, false, vp); gl.drawArrays(gl.TRIANGLES, 0, 6);
    // 3 yumusak golge: kaydirilmis 6 gecis
    gl.depthMask(false); gl.useProgram(P_GOLGE); gl.bindVertexArray(vao); gl.uniformMatrix4fv(UG.u_vp, false, vp);
    for (let g = 0; g < 6; g++) { const a = g / 6 * 6.2832; gl.uniform2f(UG.u_kay, Math.cos(a) * 0.05, Math.sin(a) * 0.05); gl.drawElements(gl.TRIANGLES, IDX.length, gl.UNSIGNED_SHORT, 0); }
    gl.depthMask(true); gl.disable(gl.BLEND);
    // 4 kumas ve cubuk
    gl.useProgram(P_KUMAS); gl.bindVertexArray(vao); gl.uniform1f(UK.u_ayna, 1); gl.uniform1f(UK.u_karart, 1); gl.drawElements(gl.TRIANGLES, IDX.length, gl.UNSIGNED_SHORT, 0);
    gl.useProgram(P_CUBUK); gl.bindVertexArray(vaoC); gl.uniformMatrix4fv(UC.u_vp, false, vp); gl.drawArrays(gl.TRIANGLES, 0, cb.length / 3);
    requestAnimationFrame(kare);
  }
  requestAnimationFrame(kare);

  // ---------- etkilesim ----------
  function ekrana(k) {
    const x = p[k * 3], y = p[k * 3 + 1], zz = p[k * 3 + 2];
    const cx_ = vp[0] * x + vp[4] * y + vp[8] * zz + vp[12], cy_ = vp[1] * x + vp[5] * y + vp[9] * zz + vp[13], cw = vp[3] * x + vp[7] * y + vp[11] * zz + vp[15];
    return [(cx_ / cw * 0.5 + 0.5) * tuval.clientWidth, (1 - (cy_ / cw * 0.5 + 0.5)) * tuval.clientHeight, cw];
  }
  function isinNoktasi(mx, my, uzaklik) {   // kameradan fare yonunde 'uzaklik' kadar
    const ileri = nrm([kam.hedef[0] - kamPos[0], kam.hedef[1] - kamPos[1], kam.hedef[2] - kamPos[2]]), sag = nrm(crs(ileri, [0, 1, 0])), ust = crs(sag, ileri);
    const th = Math.tan(0.36), en = tuval.clientWidth / tuval.clientHeight, nx = (mx / tuval.clientWidth * 2 - 1) * th * en, ny = (1 - my / tuval.clientHeight * 2) * th;
    const d = nrm([ileri[0] + sag[0] * nx + ust[0] * ny, ileri[1] + sag[1] * nx + ust[1] * ny, ileri[2] + sag[2] * nx + ust[2] * ny]);
    return [kamPos[0] + d[0] * uzaklik, kamPos[1] + d[1] * uzaklik, kamPos[2] + d[2] * uzaklik];
  }
  let surukle = null;
  tuval.addEventListener('pointerdown', (e) => {
    tuval.setPointerCapture(e.pointerId); otomatik = false;
    const r = tuval.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    let en = 30 * 30, sec = -1, w = 0;
    for (let k = 0; k < N; k++) { if (sabit[k]) continue; const [sx, sy, cw] = ekrana(k); const d = (sx - mx) ** 2 + (sy - my) ** 2; if (d < en) { en = d; sec = k; w = cw; } }
    if (sec >= 0) { tutulan = sec; hedef = [p[sec * 3], p[sec * 3 + 1], p[sec * 3 + 2]]; surukle = { tur: 'kumas', uz: Math.hypot(hedef[0] - kamPos[0], hedef[1] - kamPos[1], hedef[2] - kamPos[2]) }; tuval.style.cursor = 'grabbing'; }
    else surukle = { tur: 'don', x: e.clientX, y: e.clientY };
    tuval.dispatchEvent(new CustomEvent('kumas-dokunuldu', { detail: { tur: surukle.tur } }));
  });
  tuval.addEventListener('pointermove', (e) => {
    if (!surukle) return;
    if (surukle.tur === 'kumas') { const r = tuval.getBoundingClientRect(); hedef = isinNoktasi(e.clientX - r.left, e.clientY - r.top, surukle.uz); }
    else { kam.yaw -= (e.clientX - surukle.x) * 0.008; kam.egim = Math.max(-0.05, Math.min(1.1, kam.egim + (e.clientY - surukle.y) * 0.005)); surukle.x = e.clientX; surukle.y = e.clientY; }
  });
  const birak = () => { tutulan = -1; surukle = null; tuval.style.cursor = ''; };
  tuval.addEventListener('pointerup', birak); tuval.addEventListener('pointercancel', birak);
  tuval.addEventListener('wheel', (e) => { e.preventDefault(); kam.uzak = Math.max(2.2, Math.min(9, kam.uzak * Math.exp(e.deltaY * 0.001))); }, { passive: false });
  tuval.addEventListener('keydown', (e) => {
    const d = { ArrowLeft: 0.12, ArrowRight: -0.12 }[e.key]; if (d) { e.preventDefault(); otomatik = false; kam.yaw += d; }
    if (e.key === ' ') { e.preventDefault(); nefesG = 1; }
  });

  window.KUMAS = Object.freeze({
    malzemeler: Object.fromEntries(Object.entries(MALZEME).map(([k, v]) => [k, v.ad])),
    malzeme(ad) { if (!MALZEME[ad]) return false; malz = MALZEME[ad]; tuval.dispatchEvent(new CustomEvent('kumas-degisti', { detail: { malzeme: ad, ruzgar } })); return true; },
    ruzgar(x) { ruzgar = Math.max(0, Math.min(1, +x || 0)); tuval.dispatchEvent(new CustomEvent('kumas-degisti', { detail: { malzeme: Object.keys(MALZEME).find((k) => MALZEME[k] === malz), ruzgar } })); return ruzgar; },
    nefes() { nefesG = 1; },
    donus(derece) { otomatik = false; kam.yaw = (+derece || 0) * Math.PI / 180; },
    durum: () => ({ malzeme: malz.ad, ruzgar, parcacik: N, bag: BAG.length / 4, tutuluyor: tutulan >= 0 }),
  });
  tuval.dispatchEvent(new CustomEvent('kumas-hazir', { detail: window.KUMAS.durum() }));
})();
