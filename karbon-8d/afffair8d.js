/* afffair8d.js — Real 3D Verlet Spring-Mass Cloth + WebGL Chiaroscuro Shader + 360 Orbit + 8D Audio + AFAIR_GPT_API */
(() => {
  'use strict';
  const FABRICS = [{"id": 0, "code": "PANTONE 19-3924 TCX", "name": "Gece İpeği", "sub": "19 Momme Ham İpek · Siyah İkamesi", "rgb": [0.16, 0.21, 0.32], "sheen": 0.85, "trans": 0.28, "weave": 95.0}, {"id": 1, "code": "PANTONE 13-1008 TCX", "name": "Ham Keten", "sub": "Doğal Bezayağı Keten · 215 g/m²", "rgb": [0.86, 0.81, 0.72], "sheen": 0.22, "trans": 0.35, "weave": 64.0}, {"id": 2, "code": "PANTONE 19-2428 TCX", "name": "Mürdüm Kaşmir", "sub": "Balıksırtı Kaşmir · 290 g/m²", "rgb": [0.38, 0.16, 0.29], "sheen": 0.38, "trans": 0.12, "weave": 72.0}, {"id": 3, "code": "PANTONE 18-5616 TCX", "name": "Adaçayı Kadife", "sub": "Kesik Hav İpek Kadife · 340 g/m²", "rgb": [0.17, 0.35, 0.3], "sheen": 0.65, "trans": 0.08, "weave": 84.0}, {"id": 4, "code": "PANTONE 16-0948 TCX", "name": "Kehribar Dimi", "sub": "Merinos-İpek Twill · 260 g/m²", "rgb": [0.76, 0.55, 0.24], "sheen": 0.54, "trans": 0.18, "weave": 78.0}, {"id": 5, "code": "PANTONE 17-1518 TCX", "name": "Sürreal Organze", "sub": "Şeffaf Sıvı İpek · 48 g/m²", "rgb": [0.72, 0.5, 0.53], "sheen": 0.92, "trans": 0.68, "weave": 115.0}];
  const state = {
    mode: document.body.dataset.scene || 'cloth',
    fabricIdx: 0,
    yawDeg: 24,
    pitchDeg: 14,
    zoom: 3.7,
    windStrength: 95,
    windDeg: 35,
    surreal8D: true,
    touchMode: 'ripple', // 'ripple' | 'orbit'
    audio8D: false,
    bookings: []
  };

  // Boot hydration from URL query & #dila=v2 hash (100% GPT & Cross-Site Deep-Link Ready)
  const qs = new URLSearchParams(location.search);
  if (qs.has('fabric')) state.fabricIdx = Math.max(0, Math.min(FABRICS.length - 1, parseInt(qs.get('fabric'), 10) || 0));
  if (qs.has('yaw')) state.yawDeg = ((parseFloat(qs.get('yaw')) || 0) % 360 + 360) % 360;
  if (qs.has('pitch')) state.pitchDeg = Math.max(-72, Math.min(72, parseFloat(qs.get('pitch')) || 14));
  if (qs.has('wind')) state.windStrength = Math.max(0, Math.min(200, parseFloat(qs.get('wind')) || 95));
  if (qs.has('surreal')) state.surreal8D = qs.get('surreal') !== '0';

  const cv = document.getElementById('stageCanvas');
  const gl = cv.getContext('webgl', { antialias: true, alpha: false });

  // --- 3D VERLET CLOTH SIMULATION MESH (40x40 = 1,600 real 3D physics vertices) ---
  const N = 40;
  const COUNT = N * N;
  const pos = new Float32Array(COUNT * 3);
  const old = new Float32Array(COUNT * 3);
  const nrm = new Float32Array(COUNT * 3);
  const uvs = new Float32Array(COUNT * 2);
  const rest = 2.15 / (N - 1);

  function resetCloth() {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = y * N + x;
        const px = (x / (N - 1) - 0.5) * 2.15;
        const py = (0.5 - y / (N - 1)) * 2.15;
        const pz = Math.sin(x * 0.25) * 0.08 + Math.cos(y * 0.22) * 0.08;
        pos[i * 3] = old[i * 3] = px;
        pos[i * 3 + 1] = old[i * 3 + 1] = py;
        pos[i * 3 + 2] = old[i * 3 + 2] = pz;
        uvs[i * 2] = x / (N - 1);
        uvs[i * 2 + 1] = y / (N - 1);
      }
    }
  }
  resetCloth();

  const springs = [];
  function addSp(a, b, len) { springs.push(a, b, len); }
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (x + 1 < N) addSp(i, i + 1, rest);
      if (y + 1 < N) addSp(i, i + N, rest);
      if (x + 1 < N && y + 1 < N) {
        addSp(i, i + N + 1, rest * 1.4142);
        addSp(i + 1, i + N, rest * 1.4142);
      }
      if (x + 2 < N) addSp(i, i + 2, rest * 2.0);
      if (y + 2 < N) addSp(i, i + 2 * N, rest * 2.0);
    }
  }
  const spArr = new Float32Array(springs);

  const indices = new Uint16Array((N - 1) * (N - 1) * 6);
  let ptr = 0;
  for (let y = 0; y < N - 1; y++) {
    for (let x = 0; x < N - 1; x++) {
      const a = y * N + x, b = a + 1, c = a + N, d = c + 1;
      indices[ptr++] = a; indices[ptr++] = c; indices[ptr++] = b;
      indices[ptr++] = b; indices[ptr++] = c; indices[ptr++] = d;
    }
  }

  function injectRipple(nx, ny, impulse = 0.24) {
    const tx = (nx - 0.5) * 2.2, ty = (0.5 - ny) * 2.2;
    for (let i = 0; i < COUNT; i++) {
      const dx = pos[i * 3] - tx, dy = pos[i * 3 + 1] - ty;
      const d2 = dx * dx + dy * dy;
      if (d2 < 0.38) {
        const w = Math.exp(-d2 * 8.5) * impulse;
        pos[i * 3 + 2] += w;
      }
    }
  }

  let simTime = 0;
  function stepPhysics() {
    simTime += 0.018;
    const wRad = state.windDeg * Math.PI / 180;
    const wMag = (state.windStrength / 100) * 0.0046;
    const wx = Math.sin(wRad) * wMag;
    const wz = Math.cos(wRad) * wMag;
    const grav = state.surreal8D ? -0.00018 : -0.0016;

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      const vx = (pos[ix] - old[ix]) * 0.982;
      const vy = (pos[ix + 1] - old[ix + 1]) * 0.982;
      const vz = (pos[ix + 2] - old[ix + 2]) * 0.982;
      old[ix] = pos[ix]; old[ix + 1] = pos[ix + 1]; old[ix + 2] = pos[ix + 2];

      const nx = nrm[ix], ny = nrm[ix + 1], nz = nrm[ix + 2] || 1;
      const gust = 0.75 + 0.55 * Math.sin(simTime * 2.3 + pos[ix] * 2.4 - pos[ix + 1] * 1.9);
      const surrealLift = state.surreal8D ? 0.0014 * Math.sin(simTime * 1.7 + pos[ix] * 2.1) * Math.cos(simTime * 1.3 + pos[ix + 1] * 2.1) : 0;
      const dotW = (wx * nx + wz * nz) * gust;

      pos[ix] += vx + nx * dotW;
      pos[ix + 1] += vy + grav + ny * dotW;
      pos[ix + 2] += vz + nz * dotW + surrealLift + wz * 0.35 * gust;
    }

    // 3 iterations of spring relaxation + soft floating anchors
    for (let it = 0; it < 3; it++) {
      for (let s = 0; s < spArr.length; s += 3) {
        const a = spArr[s] * 3, b = spArr[s + 1] * 3, len = spArr[s + 2];
        const dx = pos[b] - pos[a], dy = pos[b + 1] - pos[a + 1], dz = pos[b + 2] - pos[a + 2];
        const d = Math.hypot(dx, dy, dz) || 0.0001;
        const diff = (d - len) / d * 0.46;
        pos[a] += dx * diff; pos[a + 1] += dy * diff; pos[a + 2] += dz * diff;
        pos[b] -= dx * diff; pos[b + 1] -= dy * diff; pos[b + 2] -= dz * diff;
      }
      if (state.surreal8D) {
        // Soft levitating corner/center tethers so cloth floats freely in 3D space without falling away
        const anchors = [[0, -1.02, 0.98], [N - 1, 1.02, 0.98], [(N - 1) * N, -0.96, -0.96], [COUNT - 1, 0.96, -0.96]];
        for (const [idx, ax, ay] of anchors) {
          const k = idx * 3;
          const az = 0.22 * Math.sin(simTime * 1.4 + idx);
          pos[k] += (ax - pos[k]) * 0.14;
          pos[k + 1] += (ay - pos[k + 1]) * 0.14;
          pos[k + 2] += (az - pos[k + 2]) * 0.14;
        }
      } else {
        for (let x = 0; x < N; x += 6) {
          const k = x * 3;
          pos[k] = (x / (N - 1) - 0.5) * 2.1;
          pos[k + 1] = 1.05;
          pos[k + 2] = 0.08 * Math.sin(simTime + x * 0.3);
        }
      }
    }

    // Recompute smooth vertex normals for real self-shadowing folds & 360° two-sided lighting
    nrm.fill(0);
    for (let t = 0; t < indices.length; t += 3) {
      const ia = indices[t] * 3, ib = indices[t + 1] * 3, ic = indices[t + 2] * 3;
      const ux = pos[ib] - pos[ia], uy = pos[ib + 1] - pos[ia + 1], uz = pos[ib + 2] - pos[ia + 2];
      const vx = pos[ic] - pos[ia], vy = pos[ic + 1] - pos[ia + 1], vz = pos[ic + 2] - pos[ia + 2];
      const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
      nrm[ia] += cx; nrm[ia + 1] += cy; nrm[ia + 2] += cz;
      nrm[ib] += cx; nrm[ib + 1] += cy; nrm[ib + 2] += cz;
      nrm[ic] += cx; nrm[ic + 1] += cy; nrm[ic + 2] += cz;
    }
    for (let i = 0; i < COUNT * 3; i += 3) {
      const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]) || 1;
      nrm[i] /= l; nrm[i + 1] /= l; nrm[i + 2] /= l;
    }
  }

  // --- WEBGL SHADER SETUP (Chiaroscuro Lowkey Spotlight + Warp/Weft Yarn + Backlight Translucency) ---
  let prog = null, posBuf, nrmBuf, uvBuf, idxBuf, uLocs = {};
  if (gl) {
    const vsSrc = `
      attribute vec3 aPos;
      attribute vec3 aNrm;
      attribute vec2 aUv;
      uniform mat4 uProj;
      uniform mat4 uView;
      varying vec3 vNrm;
      varying vec3 vPos;
      varying vec2 vUv;
      void main() {
        vPos = aPos;
        vNrm = aNrm;
        vUv = aUv;
        gl_Position = uProj * uView * vec4(aPos, 1.0);
      }`;
    const fsSrc = `
      precision highp float;
      varying vec3 vNrm;
      varying vec3 vPos;
      varying vec2 vUv;
      uniform vec3 uCam;
      uniform vec3 uColor;
      uniform float uSheen;
      uniform float uTrans;
      uniform float uWeave;
      uniform float uTime;
      void main() {
        vec3 N = normalize(vNrm);
        if (!gl_FrontFacing) N = -N;
        // Micro warp-weft thread normal perturbation
        float wx = sin(vUv.x * uWeave * 6.28318);
        float wy = sin(vUv.y * uWeave * 6.28318);
        N = normalize(N + vec3(wx * 0.11, wy * 0.11, 0.0));

        vec3 V = normalize(uCam - vPos);
        vec3 L1 = normalize(vec3(1.6 * sin(uTime * 0.25 + 0.6), 2.3, 1.9));
        vec3 L2 = normalize(vec3(-1.8, -1.1, -1.6));

        float diff = max(dot(N, L1), 0.0);
        // Lowkey spotlight cone falloff + deep fold shadow AO
        float spot = smoothstep(2.35, 0.25, length(vPos.xy * vec2(0.85, 0.78)));
        float ao = clamp(0.42 + 0.58 * (0.5 + 0.5 * vPos.z * 1.6), 0.26, 1.05);

        // Anisotropic silk/velvet rim & specular highlight
        vec3 H = normalize(L1 + V);
        float spec = pow(max(dot(N, H), 0.0), mix(12.0, 46.0, uSheen)) * uSheen * 0.85;
        float velvetRim = pow(1.0 - max(dot(N, V), 0.0), 2.6) * uSheen * 0.55;

        // Backlit subsurface translucency when viewed from 180° behind the light
        float backGlow = pow(max(dot(V, -L1), 0.0), 2.8) * uTrans * 0.95;
        float coolFill = max(dot(N, L2), 0.0) * 0.14;

        float yarnTex = 0.91 + 0.09 * (wx * wy);
        vec3 lit = uColor * yarnTex * ((0.13 + diff * 0.92 * spot + coolFill) * ao)
                 + vec3(0.95, 0.86, 0.70) * (spec * spot + backGlow)
                 + (uColor + vec3(0.18, 0.14, 0.10)) * velvetRim;

        // Strict Dila Pure-Black Veto: lifted warm espresso-obsidian floor (never #000000!)
        lit = max(lit, vec3(0.055, 0.051, 0.068));
        gl_FragColor = vec4(pow(clamp(lit, 0.0, 1.0), vec3(0.92)), 1.0);
      }`;

    function mkSh(tp, src) {
      const s = gl.createShader(tp); gl.shaderSource(s, src); gl.compileShader(s); return s;
    }
    prog = gl.createProgram();
    gl.attachShader(prog, mkSh(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(prog, mkSh(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    posBuf = gl.createBuffer();
    nrmBuf = gl.createBuffer();
    uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const aUv = gl.getAttribLocation(prog, 'aUv');
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

    idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    ['uProj', 'uView', 'uCam', 'uColor', 'uSheen', 'uTrans', 'uWeave', 'uTime'].forEach(k => {
      uLocs[k] = gl.getUniformLocation(prog, k);
    });
    gl.enable(gl.DEPTH_TEST);
  }

  function perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function lookAt(ex, ey, ez) {
    let zx = ex, zy = ey, zz = ez;
    let zl = Math.hypot(zx, zy, zz) || 1; zx /= zl; zy /= zl; zz /= zl;
    let xx = zz, xy = 0, xz = -zx;
    let xl = Math.hypot(xx, xy, xz) || 1; xx /= xl; xz /= xl;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx * ex + xy * ey + xz * ez), -(yx * ex + yy * ey + yz * ez), -(zx * ex + zy * ey + zz * ez), 1
    ]);
  }

  // --- OPTIONAL 8D SPATIAL REVOLVING SILK/WIND SOUNDSCAPE ---
  let audioCtx = null, panner = null, gainNode = null;
  function toggle8DAudio() {
    state.audio8D = !state.audio8D;
    const btn = document.getElementById('btnAudio8D');
    if (btn) btn.classList.toggle('on', state.audio8D);
    if (state.audio8D && !audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
      const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * 0.18;
      const src = audioCtx.createBufferSource(); src.buffer = buf; src.loop = true;
      const flt = audioCtx.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = 520; flt.Q.value = 1.8;
      panner = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
      gainNode = audioCtx.createGain(); gainNode.gain.value = 0.16;
      src.connect(flt);
      if (panner) { flt.connect(panner); panner.connect(gainNode); } else flt.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      src.start();
    }
    if (gainNode) gainNode.gain.value = state.audio8D ? 0.16 : 0.0;
  }

  // --- FULL USER POINTER / TOUCH / WHEEL DIRECTION ---
  let ptrDown = false, ptrBtn = 0, lx = 0, ly = 0;
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', e => {
    ptrDown = true; ptrBtn = e.button; lx = e.clientX; ly = e.clientY;
    cv.setPointerCapture(e.pointerId);
    if (state.touchMode === 'ripple' && e.button === 0 && !e.shiftKey) {
      const r = cv.getBoundingClientRect();
      injectRipple((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, 0.28);
    }
  });
  cv.addEventListener('pointermove', e => {
    if (!ptrDown) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY;
    if (state.touchMode === 'orbit' || ptrBtn === 2 || e.shiftKey) {
      state.yawDeg = ((state.yawDeg + dx * 0.55) % 360 + 360) % 360;
      state.pitchDeg = Math.max(-72, Math.min(72, state.pitchDeg + dy * 0.4));
      syncControls();
    } else {
      const r = cv.getBoundingClientRect();
      injectRipple((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, 0.16);
    }
  });
  window.addEventListener('pointerup', () => { ptrDown = false; });
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    state.zoom = Math.max(2.3, Math.min(6.2, state.zoom + e.deltaY * 0.0025));
  }, { passive: false });

  function syncControls() {
    const f = FABRICS[state.fabricIdx];
    const lbl = document.getElementById('fabName');
    if (lbl) lbl.innerHTML = `${f.name}<small>${f.code}</small>`;
    document.querySelectorAll('.sw-dot').forEach((d, i) => d.classList.toggle('on', i === state.fabricIdx));
    const rYaw = document.getElementById('rngYaw');
    if (rYaw) rYaw.value = Math.round(state.yawDeg);
    const rWind = document.getElementById('rngWind');
    if (rWind) rWind.value = Math.round(state.windStrength);
    const b8d = document.getElementById('btn8D');
    if (b8d) b8d.classList.toggle('on', state.surreal8D);
    const bMode = document.getElementById('btnTouchMode');
    if (bMode) bMode.textContent = state.touchMode === 'ripple' ? '✋ Kumaşa Dokun' : '🔄 360° Çevir';
    const stEl = document.getElementById('afair-gpt-state');
    if (stEl) stEl.textContent = JSON.stringify({ fabric: f, yawDeg: Math.round(state.yawDeg), pitchDeg: Math.round(state.pitchDeg), wind: state.windStrength, surreal8D: state.surreal8D, bookings: state.bookings });
  }

  // Bind UI Dock Controls without inline handlers (CSP 'self' strict)
  document.querySelectorAll('.sw-dot').forEach((el, idx) => {
    el.addEventListener('click', () => { state.fabricIdx = idx; injectRipple(0.5, 0.5, 0.22); syncControls(); });
  });
  const rYaw = document.getElementById('rngYaw');
  if (rYaw) rYaw.addEventListener('input', e => { state.yawDeg = parseFloat(e.target.value); syncControls(); });
  const rWind = document.getElementById('rngWind');
  if (rWind) rWind.addEventListener('input', e => { state.windStrength = parseFloat(e.target.value); state.windDeg = (state.windDeg + 3) % 360; syncControls(); });
  const b8d = document.getElementById('btn8D');
  if (b8d) b8d.addEventListener('click', () => { state.surreal8D = !state.surreal8D; injectRipple(0.5, 0.5, 0.3); syncControls(); });
  const bMode = document.getElementById('btnTouchMode');
  if (bMode) bMode.addEventListener('click', () => { state.touchMode = state.touchMode === 'ripple' ? 'orbit' : 'ripple'; syncControls(); });
  const bAud = document.getElementById('btnAudio8D');
  if (bAud) bAud.addEventListener('click', toggle8DAudio);

  document.querySelectorAll('[data-book]').forEach(btn => {
    btn.addEventListener('click', () => {
      const svc = btn.dataset.book;
      const code = 'AFF-' + Math.abs((Date.now() ^ (state.fabricIdx * 7919)) % 90000 + 10000);
      state.bookings.push({ service: svc, fabric: FABRICS[state.fabricIdx].code, code });
      const out = document.getElementById('msg-' + svc);
      if (out) out.textContent = `✓ Ayrıldı (${code}) · ${FABRICS[state.fabricIdx].name}`;
      syncControls();
    });
  });

  function renderFrame() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(cv.clientWidth * dpr), h = Math.floor(cv.clientHeight * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }

    stepPhysics();
    if (panner && state.audio8D) panner.pan.value = Math.sin(state.yawDeg * Math.PI / 180 + simTime * 0.8);

    const yr = state.yawDeg * Math.PI / 180, pr = state.pitchDeg * Math.PI / 180;
    const ex = Math.sin(yr) * Math.cos(pr) * state.zoom;
    const ey = Math.sin(pr) * state.zoom;
    const ez = Math.cos(yr) * Math.cos(pr) * state.zoom;
    const fb = FABRICS[state.fabricIdx];

    if (gl && prog) {
      gl.viewport(0, 0, w, h);
      gl.clearColor(0.051, 0.059, 0.078, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const aPos = gl.getAttribLocation(prog, 'aPos');
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

      const aNrm = gl.getAttribLocation(prog, 'aNrm');
      gl.bindBuffer(gl.ARRAY_BUFFER, nrmBuf);
      gl.bufferData(gl.ARRAY_BUFFER, nrm, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aNrm);
      gl.vertexAttribPointer(aNrm, 3, gl.FLOAT, false, 0, 0);

      gl.uniformMatrix4fv(uLocs.uProj, false, perspective(0.78, w / Math.max(1, h), 0.1, 30.0));
      gl.uniformMatrix4fv(uLocs.uView, false, lookAt(ex, ey, ez));
      gl.uniform3f(uLocs.uCam, ex, ey, ez);
      gl.uniform3f(uLocs.uColor, fb.rgb[0], fb.rgb[1], fb.rgb[2]);
      gl.uniform1f(uLocs.uSheen, fb.sheen);
      gl.uniform1f(uLocs.uTrans, fb.trans);
      gl.uniform1f(uLocs.uWeave, fb.weave);
      gl.uniform1f(uLocs.uTime, simTime);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
    requestAnimationFrame(renderFrame);
  }

  // --- PROGRAMMATIC GPT CONTROLLER (window.AFAIR_GPT_API) ---
  window.AFAIR_GPT_API = {
    version: '2.0',
    purpose: () => ({
      brand: 'AFFFAIR Quiet Luxury',
      laws8: 'All 8 Dila laws enforced: zero clutter, entry motion, Gen-Z, quiet luxury, simple copy, zero cognitive load, real 3D Verlet wind cloth + lowkey shadows, full 360 user direction',
      pureBlackVeto: true,
      manifestUrl: '/gpt.json'
    }),
    getState: () => ({ ...state, activeFabric: FABRICS[state.fabricIdx] }),
    setFabric: (i) => { state.fabricIdx = Math.max(0, Math.min(FABRICS.length - 1, Number(i) || 0)); injectRipple(0.5, 0.5, 0.25); syncControls(); return window.AFAIR_GPT_API.getState(); },
    setOrbit360: (yaw, pitch = 14, zoom = 3.7) => { state.yawDeg = ((Number(yaw) || 0) % 360 + 360) % 360; state.pitchDeg = Math.max(-72, Math.min(72, Number(pitch))); state.zoom = Math.max(2.3, Math.min(6.2, Number(zoom))); syncControls(); return window.AFAIR_GPT_API.getState(); },
    setWind: (strength, angleDeg = 35) => { state.windStrength = Math.max(0, Math.min(200, Number(strength) || 0)); state.windDeg = Number(angleDeg) || 0; syncControls(); return window.AFAIR_GPT_API.getState(); },
    setSurreal8D: (on) => { state.surreal8D = Boolean(on); syncControls(); return window.AFAIR_GPT_API.getState(); },
    ripple: (nx = 0.5, ny = 0.5) => { injectRipple(Number(nx), Number(ny), 0.3); return { ok: true }; },
    book: (service, slot = 'Bugün 16:00') => {
      const code = 'AFF-GPT-' + Math.abs((Date.now() % 89999) + 10000);
      state.bookings.push({ service, slot, code });
      syncControls();
      return { ok: true, code, service, slot };
    }
  };

  syncControls();
  renderFrame();
})();
