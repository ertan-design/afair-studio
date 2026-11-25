/* afffair8d.js — v3.0 WebGL2 Pleated Couture Silk + 8D Surreal Dual Veil + Direct 1-Gesture 360° Orbit & Wind Wave */
(() => {
  'use strict';
  const FABRICS = [{"id": 0, "code": "PANTONE 16-1342 TCX", "name": "Bakır Atlas", "sub": "22 Momme İpek Saten · Loş Spot Yansımalı", "rgb": [0.76, 0.44, 0.26], "spec": [0.98, 0.85, 0.66], "sheen": 0.88, "trans": 0.34, "weave": 88.0}, {"id": 1, "code": "PANTONE 13-1008 TCX", "name": "Şampanya İpek", "sub": "Ham Organze & Keten Karışımı · 185 g/m²", "rgb": [0.85, 0.79, 0.69], "spec": [1.0, 0.96, 0.88], "sheen": 0.72, "trans": 0.46, "weave": 72.0}, {"id": 2, "code": "PANTONE 19-2428 TCX", "name": "Mürdüm Kadife", "sub": "Kesik Hav İpek Kadife · 320 g/m²", "rgb": [0.46, 0.17, 0.33], "spec": [0.95, 0.68, 0.8], "sheen": 0.78, "trans": 0.22, "weave": 68.0}, {"id": 3, "code": "PANTONE 19-3924 TCX", "name": "Gece İpeği", "sub": "Saf Siyah Yasağı İkamesi · Derin İndigo", "rgb": [0.19, 0.27, 0.44], "spec": [0.76, 0.84, 0.98], "sheen": 0.9, "trans": 0.3, "weave": 96.0}];
  const state = {
    fabricIdx: 0,
    yaw: 0.38,
    pitch: 0.18,
    velYaw: 0.0,
    velPitch: 0.0,
    zoom: 3.88,
    windStrength: 1.0,
    windAngle: 0.62,
    surreal8D: 0.85,
    autoOrbit: true,
    audio8D: false,
    ptrX: 0,
    ptrY: 0,
    ptrActive: false,
    gustX: 0,
    gustY: 0,
    bookings: []
  };

  const qs = new URLSearchParams(location.search);
  if (qs.has('fabric')) state.fabricIdx = Math.max(0, Math.min(FABRICS.length - 1, parseInt(qs.get('fabric'), 10) || 0));
  if (qs.has('yaw')) { state.yaw = (parseFloat(qs.get('yaw')) || 0) * Math.PI / 180; state.autoOrbit = false; }
  if (qs.has('pitch')) state.pitch = Math.max(-1.15, Math.min(1.15, (parseFloat(qs.get('pitch')) || 12) * Math.PI / 180));
  if (qs.has('wind')) state.windStrength = Math.max(0, Math.min(2.0, (parseFloat(qs.get('wind')) || 100) / 100));

  const cv = document.getElementById('stageCanvas');
  const glOpts = { antialias: true, alpha: false, preserveDrawingBuffer: true };
  const gl = cv ? (cv.getContext('webgl2', glOpts) || cv.getContext('webgl', glOpts)) : null;
  const isGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;

  // --- 52x52 = 2,704-VERTEX PLEATED COUTURE DRAPE MESH ---
  const N = 52;
  const COUNT = N * N;
  const pos = new Float32Array(COUNT * 3);
  const old = new Float32Array(COUNT * 3);
  const nrm = new Float32Array(COUNT * 3);
  const uvs = new Float32Array(COUNT * 2);
  const spanX = 2.20, spanY = 2.05;

  function anchorPos(x, t) {
    const u = x / (N - 1);
    const pleatZ = Math.sin(u * Math.PI * 8.0) * 0.16;
    const arcX = (u - 0.5) * spanX;
    const arcY = 0.96 + Math.cos((u - 0.5) * 2.4) * 0.08 + Math.sin(t * 1.1 + u * 3.0) * 0.015;
    const arcZ = pleatZ + Math.cos((u - 0.5) * 2.2) * 0.18;
    return [arcX, arcY, arcZ];
  }

  function initCloth() {
    for (let y = 0; y < N; y++) {
      const v = y / (N - 1);
      for (let x = 0; x < N; x++) {
        const i = y * N + x;
        const u = x / (N - 1);
        const [ax, ay, az] = anchorPos(x, 0);
        const px = ax * (1.0 + v * 0.10);
        const py = ay - v * spanY;
        const pz = az * (1.0 + v * 0.65) + Math.sin(u * Math.PI * 8.0 + v * 1.4) * (0.08 * v);
        pos[i * 3] = old[i * 3] = px;
        pos[i * 3 + 1] = old[i * 3 + 1] = py;
        pos[i * 3 + 2] = old[i * 3 + 2] = pz;
        uvs[i * 2] = u;
        uvs[i * 2 + 1] = v;
      }
    }
  }
  initCloth();

  const springs = [];
  function linkSpring(ia, ib) {
    const a = ia * 3, b = ib * 3;
    const len = Math.hypot(pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]);
    springs.push(ia, ib, len);
  }
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (x + 1 < N) linkSpring(i, i + 1);
      if (y + 1 < N) linkSpring(i, i + N);
      if (x + 1 < N && y + 1 < N) {
        linkSpring(i, i + N + 1);
        linkSpring(i + 1, i + N);
      }
    }
  }
  const spArr = new Float32Array(springs);

  const indices = new Uint16Array((N - 1) * (N - 1) * 6);
  let pIdx = 0;
  for (let y = 0; y < N - 1; y++) {
    for (let x = 0; x < N - 1; x++) {
      const a = y * N + x, b = a + 1, c = a + N, d = c + 1;
      indices[pIdx++] = a; indices[pIdx++] = c; indices[pIdx++] = b;
      indices[pIdx++] = b; indices[pIdx++] = c; indices[pIdx++] = d;
    }
  }

  function injectWave(nx, ny, impulse, gx = 0, gy = 0) {
    const tx = nx * 1.25, ty = ny * 1.15;
    for (let y = 1; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const ix = (y * N + x) * 3;
        const dx = pos[ix] - tx, dy = pos[ix + 1] - ty;
        const d2 = dx * dx + dy * dy;
        if (d2 < 0.65) {
          const w = Math.exp(-d2 * 4.5) * impulse;
          pos[ix] += gx * w * 0.55;
          pos[ix + 1] += gy * w * 0.45;
          pos[ix + 2] += w;
        }
      }
    }
  }

  let simTime = 0;
  function stepPhysics() {
    simTime += 0.015;
    const wMag = 0.00085 * (0.35 + state.windStrength);
    const wx = Math.sin(state.windAngle + Math.sin(simTime * 0.5) * 0.30) * wMag;
    const wz = Math.cos(state.windAngle + Math.cos(simTime * 0.4) * 0.25) * wMag;

    for (let y = 0; y < N; y++) {
      const v = y / (N - 1);
      for (let x = 0; x < N; x++) {
        const i = y * N + x;
        const ix = i * 3;
        if (y === 0) {
          const [ax, ay, az] = anchorPos(x, simTime);
          pos[ix] = old[ix] = ax;
          pos[ix + 1] = old[ix + 1] = ay;
          pos[ix + 2] = old[ix + 2] = az;
          continue;
        }

        const vx = (pos[ix] - old[ix]) * 0.968;
        const vy = (pos[ix + 1] - old[ix + 1]) * 0.968;
        const vz = (pos[ix + 2] - old[ix + 2]) * 0.968;
        old[ix] = pos[ix]; old[ix + 1] = pos[ix + 1]; old[ix + 2] = pos[ix + 2];

        const travelWave = Math.sin(pos[ix] * 2.4 - simTime * 2.1 + pos[ix + 1] * 1.5)
                         + 0.5 * Math.cos(pos[ix + 1] * 2.6 - simTime * 1.6 - pos[ix] * 1.2);
        const billow = (0.25 + 0.85 * v) * travelWave * wMag;

        pos[ix] += vx + wx * v + state.gustX * v * 0.008;
        pos[ix + 1] += vy - 0.0012 + state.gustY * v * 0.005;
        pos[ix + 2] += vz + wz * v + billow * 1.35;
      }
    }
    state.gustX *= 0.90;
    state.gustY *= 0.90;

    for (let it = 0; it < 4; it++) {
      for (let s = 0; s < spArr.length; s += 3) {
        const ia = spArr[s], ib = spArr[s + 1], len = spArr[s + 2];
        const a = ia * 3, b = ib * 3;
        const dx = pos[b] - pos[a], dy = pos[b + 1] - pos[a + 1], dz = pos[b + 2] - pos[a + 2];
        const d = Math.hypot(dx, dy, dz) || 0.0001;
        const diff = (d - len) / d * 0.22;
        const pinA = ia < N;
        const pinB = ib < N;
        if (!pinA) { pos[a] += dx * diff; pos[a + 1] += dy * diff; pos[a + 2] += dz * diff; }
        if (!pinB) { pos[b] -= dx * diff; pos[b + 1] -= dy * diff; pos[b + 2] -= dz * diff; }
      }
    }

    nrm.fill(0);
    for (let t = 0; t < indices.length; t += 3) {
      const a = indices[t] * 3, b = indices[t + 1] * 3, c = indices[t + 2] * 3;
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
      const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
      nrm[a] += cx; nrm[a + 1] += cy; nrm[a + 2] += cz;
      nrm[b] += cx; nrm[b + 1] += cy; nrm[b + 2] += cz;
      nrm[c] += cx; nrm[c + 1] += cy; nrm[c + 2] += cz;
    }
    for (let i = 0; i < COUNT * 3; i += 3) {
      const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]) || 1;
      nrm[i] /= l; nrm[i + 1] /= l; nrm[i + 2] /= l;
    }
  }

  // Surreal 8D golden orbit rings around sculpture (rotates dramatically with 360° camera!)
  const ringVerts = (() => {
    const arr = [];
    for (let rIdx = 0; rIdx < 2; rIdx++) {
      const rad = rIdx === 0 ? 1.62 : 1.98;
      const tilt = rIdx === 0 ? 0.24 : -0.34;
      const yOff = rIdx === 0 ? -1.18 : 0.08;
      for (let s = 0; s < 72; s++) {
        const a1 = (s / 72) * Math.PI * 2, a2 = ((s + 1) / 72) * Math.PI * 2;
        arr.push(Math.cos(a1) * rad, yOff + Math.sin(a1) * tilt, Math.sin(a1) * rad);
        arr.push(Math.cos(a2) * rad, yOff + Math.sin(a2) * tilt, Math.sin(a2) * rad);
      }
    }
    return new Float32Array(arr);
  })();

  let prog = null, posBuf, nrmBuf, uvBuf, idxBuf, ringBuf, uLoc = {}, aLoc = {};
  if (gl) {
    const vs = `
      attribute vec3 aPos;
      attribute vec3 aNrm;
      attribute vec2 aUv;
      uniform mat4 uProj;
      uniform mat4 uView;
      uniform float uPass;
      uniform float uScale;
      uniform vec3 uOffset;
      varying vec3 vPos;
      varying vec3 vNrm;
      varying vec2 vUv;
      void main() {
        vec3 p = aPos * uScale + uOffset;
        if (uPass > 0.5 && uPass < 1.5) {
          p.x += p.y * 0.28;
          p.z += p.y * 0.22;
          p.y = -1.24;
        }
        vPos = p;
        vNrm = aNrm;
        vUv = aUv;
        gl_Position = uProj * uView * vec4(p, 1.0);
      }`;
    const fs = `
      precision highp float;
      varying vec3 vPos;
      varying vec3 vNrm;
      varying vec2 vUv;
      uniform float uPass;
      uniform vec3 uCam;
      uniform vec3 uColor;
      uniform vec3 uSpec;
      uniform float uSheen;
      uniform float uTrans;
      uniform float uWeave;
      uniform float uTime;
      void main() {
        if (uPass > 0.5 && uPass < 1.5) {
          float fade = smoothstep(0.54, 0.08, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)));
          gl_FragColor = vec4(0.038, 0.041, 0.058, 0.48 * fade);
          return;
        }
        if (uPass > 2.5) {
          gl_FragColor = vec4(uSpec, 0.42);
          return;
        }
        vec3 N = normalize(vNrm);
        if (!gl_FrontFacing) N = -N;
        float wx = sin(vUv.x * uWeave * 14.0);
        float wy = sin(vUv.y * uWeave * 14.0);
        N = normalize(N + vec3(wx * 0.028, wy * 0.028, 0.0));

        vec3 V = normalize(uCam - vPos);
        vec3 L1 = normalize(vec3(1.55, 2.15, 1.75));
        vec3 L2 = normalize(vec3(-1.7, 0.4, -1.65));

        float ndl = dot(N, L1);
        float diff = clamp(ndl * 0.5 + 0.5, 0.0, 1.0);
        float spot = smoothstep(2.45, 0.22, length(vPos.xy * vec2(0.75, 0.68)));
        float valleyAO = clamp(0.38 + 0.66 * (0.5 + 0.5 * vPos.z * 1.85), 0.24, 1.12);

        vec3 H = normalize(L1 + V);
        float spec = pow(max(dot(N, H), 0.0), 28.0) * uSheen * 0.95;
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.75);
        float backGlow = pow(max(dot(V, -L1), 0.0), 2.4) * uTrans + max(dot(N, L2), 0.0) * 0.22;

        float weaveGrain = 0.90 + 0.10 * (wx * wy);
        vec3 col = uColor * weaveGrain * (0.15 + pow(diff, 1.55) * 1.08 * spot) * valleyAO;
        col += uSpec * (spec * spot + fresnel * 0.42 + backGlow * 0.52);

        // Surreal 8D subtle champagne-iridescent shimmer on fold edges
        vec3 irid = 0.5 + 0.5 * cos(uTime * 0.8 + vUv.xyx * 4.5 + vec3(0.0, 1.9, 3.8));
        col += irid * fresnel * 0.18;

        // Strict Dila Pure-Black Veto: lifted warm obsidian floor
        col = max(col, vec3(0.056, 0.062, 0.086));
        float alpha = (uPass > 1.5 && uPass < 2.5) ? 0.26 : 1.0;
        gl_FragColor = vec4(pow(clamp(col, 0.0, 1.0), vec3(0.92)), alpha);
      }`;

    function compile(tp, src) {
      const s = gl.createShader(tp); gl.shaderSource(s, src); gl.compileShader(s); return s;
    }
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    posBuf = gl.createBuffer();
    nrmBuf = gl.createBuffer();
    uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    ringBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ringBuf);
    gl.bufferData(gl.ARRAY_BUFFER, ringVerts, gl.STATIC_DRAW);

    aLoc.pos = gl.getAttribLocation(prog, 'aPos');
    aLoc.nrm = gl.getAttribLocation(prog, 'aNrm');
    aLoc.uv = gl.getAttribLocation(prog, 'aUv');
    ['uProj', 'uView', 'uPass', 'uScale', 'uOffset', 'uCam', 'uColor', 'uSpec', 'uSheen', 'uTrans', 'uWeave', 'uTime'].forEach(k => {
      uLoc[k] = gl.getUniformLocation(prog, k);
    });
  }

  function perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function lookAt(ex, ey, ez, cy = -0.08) {
    let zx = ex, zy = ey - cy, zz = ez;
    let zl = Math.hypot(zx, zy, zz) || 1; zx /= zl; zy /= zl; zz /= zl;
    let xx = zz, xy = 0, xz = -zx;
    let xl = Math.hypot(xx, xy, xz) || 1; xx /= xl; xz /= xl;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([
      xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * ex + xy * ey + xz * ez), -(yx * ex + yy * ey + yz * ez), -(zx * ex + zy * ey + zz * ez), 1
    ]);
  }

  // --- 8D SPATIAL BINAURAL SILK SOUND ---
  let audioCtx = null, panner = null, gainNode = null;
  function toggleAudio() {
    state.audio8D = !state.audio8D;
    const btn = document.getElementById('btnAudio8D');
    if (btn) btn.classList.toggle('on', state.audio8D);
    if (state.audio8D && !audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
      const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
      const ch = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < ch.length; i++) {
        last = (last + 0.035 * (Math.random() * 2 - 1)) / 1.035;
        ch[i] = last * 0.5;
      }
      const src = audioCtx.createBufferSource(); src.buffer = buf; src.loop = true;
      const flt = audioCtx.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = 420; flt.Q.value = 1.6;
      panner = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
      gainNode = audioCtx.createGain(); gainNode.gain.value = 0.16;
      src.connect(flt);
      if (panner) { flt.connect(panner); panner.connect(gainNode); } else flt.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      src.start();
    }
    if (audioCtx && audioCtx.state === 'suspended' && state.audio8D) audioCtx.resume();
    if (gainNode) gainNode.gain.value = state.audio8D ? 0.16 : 0.0;
  }

  // --- ZERO-TOGGLE SIMULTANEOUS 360° ORBIT + WIND/SILK WAVE STEERING ---
  let dragging = false, lx = 0, ly = 0;
  if (cv) {
    cv.addEventListener('pointerdown', e => {
      dragging = true;
      state.autoOrbit = false;
      lx = e.clientX; ly = e.clientY;
      const r = cv.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
      const ny = 1 - ((e.clientY - r.top) / Math.max(1, r.height)) * 2;
      injectWave(nx, ny, 0.24);
      if (cv.setPointerCapture) { try { cv.setPointerCapture(e.pointerId); } catch (_) {} }
    });

    cv.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
      const ny = 1 - ((e.clientY - r.top) / Math.max(1, r.height)) * 2;
      if (!dragging) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      // Direct 360° camera rotation + momentum inertia + directional wind wave!
      const dYaw = -dx * 0.019;
      const dPitch = dy * 0.011;
      state.yaw += dYaw;
      state.pitch = Math.max(-1.12, Math.min(1.12, state.pitch + dPitch));
      state.velYaw = dYaw * 0.84;
      state.velPitch = dPitch * 0.72;
      state.windAngle = Math.atan2(dx, -dy || 1);
      state.gustX = Math.max(-2.5, Math.min(2.5, dx * 0.08));
      state.gustY = Math.max(-2.5, Math.min(2.5, -dy * 0.08));
      injectWave(nx, ny, 0.14, state.gustX, state.gustY);
      syncStateJson();
    });

    window.addEventListener('pointerup', () => { dragging = false; });
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      state.zoom = Math.max(1.85, Math.min(5.6, state.zoom + e.deltaY * 0.0024));
      syncStateJson();
    }, { passive: false });
    cv.addEventListener('dblclick', e => {
      const r = cv.getBoundingClientRect();
      injectWave(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2, 0.42);
    });
  }

  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') { state.autoOrbit = false; state.velYaw = -0.05; }
    if (e.key === 'ArrowRight' || e.key === 'd') { state.autoOrbit = false; state.velYaw = 0.05; }
    if (e.key === 'ArrowUp' || e.key === 'w') { state.pitch = Math.min(1.12, state.pitch + 0.08); }
    if (e.key === 'ArrowDown' || e.key === 's') { state.pitch = Math.max(-1.12, state.pitch - 0.08); }
  });

  function selectFabric(idx, withPulse = true) {
    state.fabricIdx = Math.max(0, Math.min(FABRICS.length - 1, Number(idx) || 0));
    document.querySelectorAll('.sw-dot').forEach((d, i) => d.classList.toggle('on', i === state.fabricIdx));
    if (withPulse) injectWave(0, 0.1, 0.28);
    syncStateJson();
  }

  function syncStateJson() {
    const el = document.getElementById('afair-gpt-state');
    if (el) {
      el.textContent = JSON.stringify({
        brand: 'AFFFAIR',
        webgl2: isGL2,
        fabric: FABRICS[state.fabricIdx],
        yawDeg: Math.round(((state.yaw * 180 / Math.PI) % 360 + 360) % 360),
        pitchDeg: Math.round(state.pitch * 180 / Math.PI),
        windStrength: Math.round(state.windStrength * 100),
        bookings: state.bookings
      });
    }
  }

  document.querySelectorAll('.sw-dot').forEach((el, idx) => {
    el.addEventListener('click', () => selectFabric(idx));
  });
  const bAud = document.getElementById('btnAudio8D');
  if (bAud) bAud.addEventListener('click', toggleAudio);
  const bTopTailor = document.getElementById('btnQuickTailor');
  if (bTopTailor) {
    bTopTailor.addEventListener('click', () => {
      const sec = document.getElementById('conciergeSection');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    });
  }
  document.querySelectorAll('[data-book]').forEach(btn => {
    btn.addEventListener('click', () => {
      const svc = btn.dataset.book;
      const code = 'AFF-' + Math.abs((Date.now() ^ (state.fabricIdx * 7919)) % 89999 + 10000);
      state.bookings.push({ service: svc, fabric: FABRICS[state.fabricIdx].code, code });
      const out = document.getElementById('msg-' + svc);
      if (out) out.textContent = `✓ Hazır (${code}) · ${FABRICS[state.fabricIdx].name}`;
      syncStateJson();
    });
  });

  function render() {
    if (cv && gl && prog) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(cv.clientWidth * dpr));
      const h = Math.max(1, Math.floor(cv.clientHeight * dpr));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }

      if (state.autoOrbit) {
        state.yaw += 0.00075;
      } else if (!dragging) {
        state.yaw += state.velYaw;
        state.pitch = Math.max(-1.12, Math.min(1.12, state.pitch + state.velPitch));
        state.velYaw *= 0.93;
        state.velPitch *= 0.93;
      }

      stepPhysics();
      if (panner && state.audio8D) panner.pan.value = Math.sin(state.yaw);

      gl.viewport(0, 0, w, h);
      // Warm lowkey gallery obsidian (#0E1016 — never pure black!)
      gl.clearColor(0.055, 0.063, 0.086, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      const ex = Math.sin(state.yaw) * Math.cos(state.pitch) * state.zoom;
      const ey = Math.sin(state.pitch) * state.zoom + 0.10;
      const ez = Math.cos(state.yaw) * Math.cos(state.pitch) * state.zoom;
      const fb = FABRICS[state.fabricIdx];

      gl.useProgram(prog);
      gl.uniformMatrix4fv(uLoc.uProj, false, perspective(0.76, w / h, 0.1, 30.0));
      gl.uniformMatrix4fv(uLoc.uView, false, lookAt(ex, ey, ez));
      gl.uniform3f(uLoc.uCam, ex, ey, ez);
      gl.uniform3f(uLoc.uColor, fb.rgb[0], fb.rgb[1], fb.rgb[2]);
      gl.uniform3f(uLoc.uSpec, fb.spec[0], fb.spec[1], fb.spec[2]);
      gl.uniform1f(uLoc.uSheen, fb.sheen);
      gl.uniform1f(uLoc.uTrans, fb.trans);
      gl.uniform1f(uLoc.uWeave, fb.weave);
      gl.uniform1f(uLoc.uTime, simTime);

      // Bind cloth attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aLoc.pos);
      gl.vertexAttribPointer(aLoc.pos, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, nrmBuf);
      gl.bufferData(gl.ARRAY_BUFFER, nrm, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aLoc.nrm);
      gl.vertexAttribPointer(aLoc.nrm, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
      gl.enableVertexAttribArray(aLoc.uv);
      gl.vertexAttribPointer(aLoc.uv, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);

      // Pass 1: Soft projected floor shadow
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.uniform1f(uLoc.uPass, 1.0);
      gl.uniform1f(uLoc.uScale, 1.0);
      gl.uniform3f(uLoc.uOffset, 0, 0, 0);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

      // Pass 2: 8D Champagne Orbit Rings
      gl.bindBuffer(gl.ARRAY_BUFFER, ringBuf);
      gl.vertexAttribPointer(aLoc.pos, 3, gl.FLOAT, false, 0, 0);
      gl.disableVertexAttribArray(aLoc.nrm);
      gl.disableVertexAttribArray(aLoc.uv);
      gl.uniform1f(uLoc.uPass, 3.0);
      gl.drawArrays(gl.LINES, 0, ringVerts.length / 3);

      // Re-enable cloth buffers for main drape + surreal 8D twin veil
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.vertexAttribPointer(aLoc.pos, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aLoc.nrm);
      gl.enableVertexAttribArray(aLoc.uv);

      // Pass 3: Main Couture Pleated Silk Drape
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.uniform1f(uLoc.uPass, 0.0);
      gl.uniform1f(uLoc.uScale, 1.0);
      gl.uniform3f(uLoc.uOffset, 0, 0, 0);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

      // Pass 4: Surreal 8D Translucent Shadow Veil
      gl.enable(gl.BLEND);
      gl.depthMask(false);
      gl.uniform1f(uLoc.uPass, 2.0);
      gl.uniform1f(uLoc.uScale, 1.09);
      gl.uniform3f(uLoc.uOffset, 0.06 * Math.sin(simTime * 0.9), 0.06, -0.34);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
    requestAnimationFrame(render);
  }

  // --- GPT, CLAUDE & W3C WebMCP UNIFIED API ---
  const api = {
    version: '3.0',
    purpose: () => ({
      brand: 'AFFFAIR',
      whyBuilt: '360° steerable real WebGL2 pleated couture silk + 8D wind & lowkey shadows + instant bespoke two-tape-measure concierge',
      manifestUrl: './gpt.json',
      ryteLiveUrl: './ryte-canli.json',
      pendingTasks: 0
    }),
    getState: () => ({
      webgl2: isGL2,
      activeFabric: FABRICS[state.fabricIdx],
      yawDeg: Math.round(((state.yaw * 180 / Math.PI) % 360 + 360) % 360),
      pitchDeg: Math.round(state.pitch * 180 / Math.PI),
      windStrength: Math.round(state.windStrength * 100),
      bookings: state.bookings
    }),
    setFabric: (i) => { selectFabric(i); return api.getState(); },
    setOrbit360: (yawDeg, pitchDeg = 12, zoom = 3.25) => {
      state.autoOrbit = false;
      state.yaw = (Number(yawDeg) || 0) * Math.PI / 180;
      state.pitch = Math.max(-1.12, Math.min(1.12, (Number(pitchDeg) || 0) * Math.PI / 180));
      state.zoom = Math.max(1.85, Math.min(5.6, Number(zoom) || 3.25));
      syncStateJson();
      return api.getState();
    },
    setWind: (strength = 100, angleDeg = 35) => {
      state.windStrength = Math.max(0, Math.min(2.0, (Number(strength) || 100) / 100));
      state.windAngle = (Number(angleDeg) || 0) * Math.PI / 180;
      syncStateJson();
      return api.getState();
    },
    ripple: (nx = 0, ny = 0) => { injectWave(Number(nx) || 0, Number(ny) || 0, 0.34); return { ok: true }; },
    book: (service = 'tailor') => {
      const code = 'AFF-GPT-' + Math.abs((Date.now() % 89999) + 10000);
      state.bookings.push({ service, code });
      syncStateJson();
      return { ok: true, code, service };
    },
    durumOku: () => api.getState(),
    kumasSec: (i) => api.setFabric(i),
    aciAyarla360: (d) => api.setOrbit360(d),
    ruzgarAyarla: (r) => api.setWind((Number(r) || 0.8) * 100),
    ryteCanliOku: () => fetch('./ryte-canli.json', { cache: 'no-store' }).then(r => r.json())
  };
  window.AFAIR_GPT_API = api;
  window.AFAIR_STUDIO_API = api;

  if (typeof navigator !== 'undefined' && navigator.modelContext && typeof navigator.modelContext.registerTool === 'function') {
    try {
      navigator.modelContext.registerTool({
        name: 'afair_control_8d_stage',
        description: 'AFFFAIR 360° WebGL2 ipek kumas, ruzgar ve canli terzi sahnesini kontrol eder.',
        inputSchema: {
          type: 'object',
          properties: {
            fabricIndex: { type: 'integer', minimum: 0, maximum: 3 },
            angleDeg: { type: 'number', minimum: 0, maximum: 360 },
            wind: { type: 'number', minimum: 0, maximum: 200 }
          }
        },
        execute: async (args) => {
          if (args && typeof args.fabricIndex === 'number') api.setFabric(args.fabricIndex);
          if (args && typeof args.angleDeg === 'number') api.setOrbit360(args.angleDeg);
          if (args && typeof args.wind === 'number') api.setWind(args.wind);
          return api.getState();
        }
      });
    } catch (_) {}
  }

  // Pre-settle couture drape equilibrium so Frame 1 opens in poised fluid silk folds
  for (let w = 0; w < 180; w++) stepPhysics();
  selectFabric(state.fabricIdx, false);
  requestAnimationFrame(render);
})();
