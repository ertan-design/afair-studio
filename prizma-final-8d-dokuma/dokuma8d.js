(function () {
  "use strict";

  var FABS = [
    { id: "zumrut", ad: "Gece Zümrüdü İpek", code: "19-5420 TCX", c1: [0.06, 0.27, 0.23], c2: [0.19, 0.58, 0.45], sheen: 0.76, freq: 174.0, chord: [220, 277.2, 329.6, 440] },
    { id: "espresso", ad: "Gece Espresso Gabardin", code: "19-0915 TCX", c1: [0.17, 0.11, 0.09], c2: [0.39, 0.27, 0.20], sheen: 0.45, freq: 136.0, chord: [196, 246.9, 293.7, 392] },
    { id: "murdum", ad: "Koyu Mürdüm Saten", code: "19-2520 TCX", c1: [0.25, 0.09, 0.19], c2: [0.58, 0.24, 0.41], sheen: 0.88, freq: 198.0, chord: [246.9, 293.7, 370, 493.9] },
    { id: "bakir", ad: "Yanık Bakır Jakar", code: "18-1340 TCX", c1: [0.48, 0.21, 0.12], c2: [0.84, 0.50, 0.29], sheen: 0.80, freq: 180.0, chord: [261.6, 329.6, 392, 523.3] },
    { id: "fildisi", ad: "Ham Fildişi Keten", code: "11-0604 TCX", c1: [0.76, 0.71, 0.63], c2: [0.93, 0.88, 0.80], sheen: 0.34, freq: 120.0, chord: [293.7, 370, 440, 587.3] },
    { id: "bogaz", ad: "Boğaz Gece Yünü", code: "19-3921 TCX", c1: [0.09, 0.14, 0.26], c2: [0.25, 0.37, 0.56], sheen: 0.58, freq: 156.0, chord: [220, 261.6, 329.6, 392] }
  ];

  var fab = FABS[0];
  var mode = "orbit";
  var surrealTarget = 0, surrealMix = 0;
  var windPow = 1.0, lightDeg = 44, camDist = 3.0;
  var yaw = 0.25, pitch = 0.14, dragging = false, lx = 0, ly = 0;
  var ripples = [];

  var audioCtx = null, masterGain = null, panner = null, windFilter = null, audioOn = false;

  function ensureAudio() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function toggle8DAudio() {
    var btn = document.getElementById("b-audio");
    var hud = document.getElementById("hud-aud");
    if (!audioOn) {
      var ctx = ensureAudio();
      if (!ctx) return;
      if (!masterGain) {
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.001;
        panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (panner) { masterGain.connect(panner); panner.connect(ctx.destination); }
        else { masterGain.connect(ctx.destination); }

        var nBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        var ch = nBuf.getChannelData(0);
        var lp = 0;
        for (var i = 0; i < ch.length; i++) { lp = lp * 0.92 + (Math.random() * 2 - 1) * 0.08; ch[i] = lp; }
        var src = ctx.createBufferSource();
        src.buffer = nBuf; src.loop = true;
        windFilter = ctx.createBiquadFilter();
        windFilter.type = "bandpass"; windFilter.frequency.value = 340; windFilter.Q.value = 2.4;
        var ng = ctx.createGain(); ng.gain.value = 0.24;
        src.connect(windFilter); windFilter.connect(ng); ng.connect(masterGain);
        src.start();

        fab.chord.forEach(function (fr, k) {
          var osc = ctx.createOscillator();
          osc.type = k % 2 === 0 ? "sine" : "triangle";
          osc.frequency.value = fr * 0.5;
          var og = ctx.createGain(); og.gain.value = 0.03 / (k + 1);
          osc.connect(og); og.connect(masterGain); osc.start();
        });
      }
      masterGain.gain.setTargetAtTime(0.30, ctx.currentTime, 0.3);
      audioOn = true;
      btn.classList.add("is-on");
      hud.textContent = "8D Ses: Aktif (StereoPanner)";
    } else {
      if (masterGain && audioCtx) masterGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.2);
      audioOn = false;
      btn.classList.remove("is-on");
      hud.textContent = "8D Ses: Kapalı";
    }
  }

  function pluckGuitarChord() {
    var ctx = ensureAudio();
    if (!ctx) return;
    fab.chord.forEach(function (freq, idx) {
      var len = Math.round(ctx.sampleRate * 1.4);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var out = buf.getChannelData(0);
      var N = Math.max(20, Math.round(ctx.sampleRate / freq));
      var ring = new Float32Array(N);
      for (var i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
      var p = 0;
      for (var s = 0; s < len; s++) {
        var next = (p + 1) % N;
        out[s] = ring[p] * 0.25;
        ring[p] = 0.994 * 0.5 * (ring[p] + ring[next]);
        p = next;
      }
      var bs = ctx.createBufferSource();
      bs.buffer = buf;
      bs.connect(ctx.destination);
      bs.start(ctx.currentTime + idx * 0.09);
    });
    document.getElementById("hud-aud").textContent = "Karplus-Strong Gitar Çalındı (" + fab.code + ")";
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function renderSwatches() {
    var box = document.getElementById("sw-grid");
    clear(box);
    FABS.forEach(function (f) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "swb" + (f.id === fab.id ? " is-on" : "");
      var st = document.createElement("strong"); st.textContent = f.ad;
      var sp = document.createElement("span"); sp.textContent = f.code;
      b.appendChild(st); b.appendChild(sp);
      b.addEventListener("click", function () {
        fab = f;
        document.getElementById("hud-fab").textContent = "PANTONE " + f.code + " · " + f.ad;
        renderSwatches();
      });
      box.appendChild(b);
    });
  }

  document.getElementById("b-orbit").addEventListener("click", function () {
    mode = "orbit";
    document.getElementById("b-orbit").classList.add("is-on");
    document.getElementById("b-touch").classList.remove("is-on");
  });
  document.getElementById("b-touch").addEventListener("click", function () {
    mode = "touch";
    document.getElementById("b-touch").classList.add("is-on");
    document.getElementById("b-orbit").classList.remove("is-on");
  });
  document.getElementById("b-surreal").addEventListener("click", function () {
    surrealTarget = surrealTarget > 0.5 ? 0 : 1;
    document.getElementById("b-surreal").classList.toggle("is-on", surrealTarget > 0.5);
    document.getElementById("hud-8d").textContent = surrealTarget > 0.5 ? "8D Sürreal: Aktif (Torus-Dalga)" : "8D Sürreal: Kapalı";
  });
  document.getElementById("b-audio").addEventListener("click", toggle8DAudio);
  document.getElementById("b-guitar").addEventListener("click", pluckGuitarChord);
  document.getElementById("sl-wind").addEventListener("input", function (e) {
    windPow = Number(e.target.value) / 100;
    document.getElementById("v-wind").textContent = windPow.toFixed(2);
  });
  document.getElementById("sl-light").addEventListener("input", function (e) {
    lightDeg = Number(e.target.value);
    document.getElementById("v-light").textContent = lightDeg + "°";
  });
  document.getElementById("sl-zoom").addEventListener("input", function (e) {
    camDist = Number(e.target.value) / 10;
    document.getElementById("v-zoom").textContent = camDist.toFixed(1) + "m";
  });

  function startGL() {
    var canvas = document.getElementById("gl8d");
    var gl = canvas.getContext("webgl", { antialias: true, alpha: false });
    if (!gl) return;
    var vs = [
      "attribute vec2 aUV;",
      "uniform float uTime, uWind, uSurreal;",
      "uniform mat4 uMVP;",
      "uniform vec4 uR0;",
      "varying vec2 vUV; varying vec3 vNorm, vPos;",
      "vec3 cloth(vec2 uv, float t, float w, float sr) {",
      "  float x = (uv.x - 0.5) * 2.6;",
      "  float y = (uv.y - 0.5) * 1.78;",
      "  float pin = smoothstep(0.0, 0.14, 1.0 - uv.y);",
      "  float z = sin(x * 2.5 + t * 2.2) * 0.14 * w * pin + cos(y * 3.0 - t * 1.7 + x) * 0.09 * w * pin;",
      "  float a = (uv.x - 0.5) * 3.14159 * 1.25;",
      "  vec3 surf8d = vec3(sin(a) * (1.25 + 0.28 * cos(y * 2.4 + t)), y * 0.95 + sin(a * 2.0 + t) * 0.18, cos(a) * 0.72 - 0.4 + sin(y * 4.0 - t * 2.0) * 0.12);",
      "  vec3 flatP = vec3(x, y, z);",
      "  vec3 p = mix(flatP, surf8d, sr);",
      "  if (uR0.z > 0.01) { float d = distance(uv, uR0.xy); p.z += sin(d * 30.0 - uR0.w * 8.0) * exp(-d * 5.0) * uR0.z * 0.18; }",
      "  return p;",
      "}",
      "void main() {",
      "  vUV = aUV;",
      "  vec3 p = cloth(aUV, uTime, uWind, uSurreal);",
      "  vec3 px = cloth(aUV + vec2(0.015, 0.0), uTime, uWind, uSurreal);",
      "  vec3 py = cloth(aUV + vec2(0.0, 0.015), uTime, uWind, uSurreal);",
      "  vNorm = normalize(cross(px - p, py - p));",
      "  vPos = p;",
      "  gl_Position = uMVP * vec4(p, 1.0);",
      "}"
    ].join("\n");
    var fs = [
      "precision mediump float;",
      "varying vec2 vUV; varying vec3 vNorm, vPos;",
      "uniform vec3 uC1, uC2, uLDir; uniform float uSheen, uFreq, uDist, uSurreal;",
      "void main() {",
      "  vec3 N = normalize(vNorm); if (!gl_FrontFacing) N = -N;",
      "  vec3 L = normalize(uLDir); vec3 V = normalize(vec3(0.0, 0.0, uDist) - vPos);",
      "  float diff = max(dot(N, L), 0.0);",
      "  float spec = pow(max(dot(N, normalize(L + V)), 0.0), 28.0) * uSheen;",
      "  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.8) * (0.36 + uSurreal * 0.35);",
      "  float wVis = 1.0 - smoothstep(1.9, 3.8, uDist);",
      "  float weave = mix(1.0, 0.84 + 0.22 * (sin(vUV.x * uFreq) * 0.25 + sin(vUV.y * uFreq * 0.9) * 0.25 + 0.5), wVis);",
      "  vec3 irid = vec3(0.28, 0.16, 0.34) * uSurreal * fres;",
      "  vec3 col = mix(uC1, uC2, clamp(diff * 0.85 + fres, 0.0, 1.0)) * weave * (0.24 + 0.86 * diff) + vec3(0.96, 0.89, 0.78) * spec + irid;",
      "  gl_FragColor = vec4(max(col, vec3(0.04, 0.03, 0.028)), 1.0);",
      "}"
    ].join("\n");

    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(pr); gl.useProgram(pr);

    var G = 60, v = [], ix = [];
    for (var j = 0; j <= G; j++) for (var i = 0; i <= G; i++) v.push(i / G, j / G);
    for (var j2 = 0; j2 < G; j2++) for (var i2 = 0; i2 < G; i2++) {
      var a = j2 * (G + 1) + i2;
      ix.push(a, a + 1, a + G + 1, a + 1, a + G + 2, a + G + 1);
    }
    var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "aUV"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ix), gl.STATIC_DRAW);

    var uT = gl.getUniformLocation(pr, "uTime"), uW = gl.getUniformLocation(pr, "uWind"), uSr = gl.getUniformLocation(pr, "uSurreal"), uMVP = gl.getUniformLocation(pr, "uMVP"), uR0 = gl.getUniformLocation(pr, "uR0");
    var uC1 = gl.getUniformLocation(pr, "uC1"), uC2 = gl.getUniformLocation(pr, "uC2"), uL = gl.getUniformLocation(pr, "uLDir"), uSh = gl.getUniformLocation(pr, "uSheen"), uFr = gl.getUniformLocation(pr, "uFreq"), uDs = gl.getUniformLocation(pr, "uDist");

    function mul(a, b) { var o = new Float32Array(16); for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; }
    function per(f, a, n, fa) { var s = 1 / Math.tan(f / 2), nf = 1 / (n - fa); return new Float32Array([s / a, 0, 0, 0, 0, s, 0, 0, 0, 0, (fa + n) * nf, -1, 0, 0, 2 * fa * n * nf, 0]); }
    function rY(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); }
    function rX(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); }
    function tZ(z) { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, z, 1]); }

    canvas.addEventListener("pointerdown", function (e) {
      dragging = true; lx = e.clientX; ly = e.clientY;
      if (mode === "touch") {
        var r = canvas.getBoundingClientRect();
        ripples = [{ u: (e.clientX - r.left) / r.width, v: 1 - (e.clientY - r.top) / r.height, age: 0, amp: 1.0 }];
      }
    });
    window.addEventListener("pointerup", function () { dragging = false; });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging || mode !== "orbit") return;
      yaw += (e.clientX - lx) * 0.008;
      pitch = Math.max(-0.9, Math.min(0.9, pitch + (e.clientY - ly) * 0.006));
      lx = e.clientX; ly = e.clientY;
    });

    gl.enable(gl.DEPTH_TEST);
    var sim = 0, prev = 0;
    function frame(ts) {
      var dt = prev ? Math.min(0.05, (ts - prev) / 1000) : 0.016;
      prev = ts; sim += dt;
      surrealMix += (surrealTarget - surrealMix) * Math.min(1, dt * 3.5);
      if (ripples[0]) { ripples[0].age += dt; ripples[0].amp = Math.max(0, 1 - ripples[0].age * 0.5); }
      if (audioOn && panner && audioCtx) {
        panner.pan.setTargetAtTime(Math.max(-0.9, Math.min(0.9, Math.sin(sim * 0.7 + yaw))), audioCtx.currentTime, 0.08);
        if (windFilter) windFilter.frequency.setTargetAtTime(220 + windPow * 280 + surrealMix * 240, audioCtx.currentTime, 0.1);
      }

      var w = canvas.clientWidth || 960, h = canvas.clientHeight || 540;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0.067, 0.051, 0.047, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var mvp = mul(per(0.76, w / Math.max(1, h), 0.1, 20), mul(tZ(-camDist), mul(rX(pitch), rY(yaw))));
      gl.uniformMatrix4fv(uMVP, false, mvp);
      gl.uniform1f(uT, sim); gl.uniform1f(uW, windPow); gl.uniform1f(uSr, surrealMix); gl.uniform1f(uDs, camDist);
      gl.uniform3fv(uC1, new Float32Array(fab.c1)); gl.uniform3fv(uC2, new Float32Array(fab.c2));
      gl.uniform1f(uSh, fab.sheen); gl.uniform1f(uFr, fab.freq);
      var lr = lightDeg * Math.PI / 180;
      gl.uniform3f(uL, Math.cos(lr) * 1.1, 0.65, Math.sin(lr) * 0.8 + 0.85);
      var rp = ripples[0] || { u: 0.5, v: 0.5, amp: 0, age: 0 };
      gl.uniform4f(uR0, rp.u, rp.v, rp.amp, rp.age);
      gl.drawElements(gl.TRIANGLES, ix.length, gl.UNSIGNED_SHORT, 0);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  renderSwatches();
  startGL();
})();
