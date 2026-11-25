(function () {
  "use strict";

  var FABRICS = [
    { id: "zumrut", ad: "Gece Zümrüdü İpek", code: "19-5420 TCX", gsm: "148 g/m² · 2/2 Dimi", c1: [0.07, 0.28, 0.24], c2: [0.18, 0.56, 0.44], sheen: 0.72, freq: 168.0 },
    { id: "espresso", ad: "Gece Espresso Gabardin", code: "19-0915 TCX", gsm: "285 g/m² · Yün-İpek", c1: [0.16, 0.11, 0.09], c2: [0.36, 0.25, 0.19], sheen: 0.42, freq: 132.0 },
    { id: "murdum", ad: "Koyu Mürdüm Saten", code: "19-2520 TCX", gsm: "162 g/m² · 8-Ağız Saten", c1: [0.24, 0.09, 0.18], c2: [0.54, 0.24, 0.38], sheen: 0.86, freq: 196.0 },
    { id: "krem", ad: "Ham Fildişi Keten", code: "11-0604 TCX", gsm: "210 g/m² · Bezayağı", c1: [0.76, 0.71, 0.63], c2: [0.92, 0.87, 0.79], sheen: 0.30, freq: 118.0 },
    { id: "bakir", ad: "Yanık Bakır Jakar", code: "18-1340 TCX", gsm: "240 g/m² · Çözgü Jakar", c1: [0.46, 0.20, 0.12], c2: [0.80, 0.48, 0.28], sheen: 0.78, freq: 176.0 },
    { id: "lacivert", ad: "Boğaz Gece Yünü", code: "19-3921 TCX", gsm: "260 g/m² · İnce Merinos", c1: [0.09, 0.14, 0.25], c2: [0.23, 0.34, 0.52], sheen: 0.54, freq: 152.0 }
  ];

  var DESIGNERS = [
    { id: "rufat", sub: "rufat.afair.studio", name: "Rufat İsmail · Haute Couture", focus: "Mimari omuz kesimi, bakır-mürdüm ipek akışı, akşam sahne ışığı.", specs: "Örnek koleksiyon: 14 görünüm · 6 Pantone TCX · Hedef: özel alt-alan adı." },
    { id: "dila", sub: "dila.afair.studio", name: "Dila · Renk & Epistemoloji", focus: "Saf siyah (#000000) yasağı, 3200K sıcak galeri dokusu, iki-mezura terzi uyumu.", specs: "Örnek seri: 8 senkron konsept · Düşük doygunluklu yüksek derinlik." },
    { id: "misafir", sub: "atolye.afair.studio", name: "Yeni Tasarımcı Masası (Taslak)", focus: "Bağımsız tasarımcının kendi kumaş numunesini, ışık açısını ve koleksiyon sırasını kurması.", specs: "Durum: yerel tarayıcı önizlemesi — gerçek alt-domain tahsisi sunucu kaydı gerektirir." }
  ];

  var activeFab = FABRICS[0];
  var activeDes = DESIGNERS[0];
  var mode = "orbit";
  var frozen = false;
  var windPow = 0.90;
  var lightDeg = 42;
  var camDist = 3.1;
  var yaw = 0.28;
  var pitch = 0.14;
  var dragging = false;
  var lx = 0;
  var ly = 0;
  var ripples = [];

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function renderSwatches() {
    var grid = document.getElementById("swatch-grid");
    clear(grid);
    FABRICS.forEach(function (f) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swatch-btn" + (f.id === activeFab.id ? " is-on" : "");
      var st = document.createElement("strong");
      st.textContent = f.ad;
      var sp = document.createElement("span");
      sp.textContent = f.code + " · " + f.gsm;
      btn.appendChild(st);
      btn.appendChild(sp);
      btn.addEventListener("click", function () {
        activeFab = f;
        document.getElementById("hud-pantone").textContent = "PANTONE " + f.code;
        document.getElementById("hud-gsm").textContent = f.gsm;
        renderSwatches();
      });
      grid.appendChild(btn);
    });
  }

  function renderDesigners() {
    var tabs = document.getElementById("designer-tabs");
    var card = document.getElementById("designer-card");
    clear(tabs);
    clear(card);
    DESIGNERS.forEach(function (d) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (d.id === activeDes.id ? " is-on" : "");
      b.textContent = d.sub;
      b.addEventListener("click", function () {
        activeDes = d;
        renderDesigners();
      });
      tabs.appendChild(b);
    });
    var cells = [
      ["Alt-Alan Adı Modeli", activeDes.sub + " — " + activeDes.name],
      ["Dokuma & Işık Disiplini", activeDes.focus],
      ["Durum & Kapsam", activeDes.specs]
    ];
    cells.forEach(function (pair) {
      var box = document.createElement("div");
      box.className = "d-cell";
      var h = document.createElement("h3");
      h.textContent = pair[0];
      var p = document.createElement("p");
      p.textContent = pair[1];
      box.appendChild(h);
      box.appendChild(p);
      card.appendChild(box);
    });
  }

  function bindControls() {
    var mOrb = document.getElementById("mode-orbit");
    var mTch = document.getElementById("mode-touch");
    var bFrz = document.getElementById("btn-freeze");
    var hudM = document.getElementById("hud-mode");
    mOrb.addEventListener("click", function () {
      mode = "orbit";
      mOrb.classList.add("is-on");
      mTch.classList.remove("is-on");
      hudM.textContent = "Mod: 360° Yörünge";
    });
    mTch.addEventListener("click", function () {
      mode = "touch";
      mTch.classList.add("is-on");
      mOrb.classList.remove("is-on");
      hudM.textContent = "Mod: Dokun & Dalgalandır";
    });
    bFrz.addEventListener("click", function () {
      frozen = !frozen;
      bFrz.classList.toggle("is-on", frozen);
      bFrz.textContent = frozen ? "Rüzgârı Başlat" : "Rüzgârı Durdur";
    });
    var rW = document.getElementById("rng-wind");
    var rL = document.getElementById("rng-light");
    var rZ = document.getElementById("rng-zoom");
    rW.addEventListener("input", function () {
      windPow = Number(rW.value) / 100;
      document.getElementById("val-wind").textContent = windPow.toFixed(2);
    });
    rL.addEventListener("input", function () {
      lightDeg = Number(rL.value);
      document.getElementById("val-light").textContent = lightDeg + "°";
    });
    rZ.addEventListener("input", function () {
      camDist = Number(rZ.value) / 10;
      document.getElementById("val-zoom").textContent = camDist.toFixed(1) + "m";
    });
  }

  function startWebGL() {
    var canvas = document.getElementById("gl-cloth");
    var status = document.getElementById("webgl-status");
    var gl = canvas.getContext("webgl", { antialias: true, alpha: false });
    if (!gl) {
      status.textContent = "WebGL desteklenmiyor — 2D yedek mod";
      return;
    }

    var vsSrc = [
      "attribute vec2 aUV;",
      "uniform float uTime;",
      "uniform float uWind;",
      "uniform mat4 uMVP;",
      "uniform vec4 uRip0;",
      "uniform vec4 uRip1;",
      "varying vec2 vUV;",
      "varying vec3 vNorm;",
      "varying vec3 vPos;",
      "vec3 clothPos(vec2 uv, float t, float w) {",
      "  float x = (uv.x - 0.5) * 2.55;",
      "  float y = (uv.y - 0.5) * 1.72;",
      "  float pin = smoothstep(0.0, 0.16, 1.0 - uv.y);",
      "  float z = sin(x * 2.6 + t * 2.1) * 0.14 * w * pin;",
      "  z += cos(y * 3.1 - t * 1.7 + x * 1.4) * 0.09 * w * pin;",
      "  z += sin((x - y) * 5.2 + t * 3.1) * 0.035 * w * pin;",
      "  if (uRip0.z > 0.01) {",
      "    float d0 = distance(uv, uRip0.xy);",
      "    z += sin(d0 * 32.0 - uRip0.w * 8.0) * exp(-d0 * 5.5) * uRip0.z * 0.16;",
      "  }",
      "  if (uRip1.z > 0.01) {",
      "    float d1 = distance(uv, uRip1.xy);",
      "    z += sin(d1 * 32.0 - uRip1.w * 8.0) * exp(-d1 * 5.5) * uRip1.z * 0.16;",
      "  }",
      "  return vec3(x, y, z);",
      "}",
      "void main() {",
      "  vUV = aUV;",
      "  vec3 p = clothPos(aUV, uTime, uWind);",
      "  vec3 px = clothPos(aUV + vec2(0.015, 0.0), uTime, uWind);",
      "  vec3 py = clothPos(aUV + vec2(0.0, 0.015), uTime, uWind);",
      "  vNorm = normalize(cross(px - p, py - p));",
      "  vPos = p;",
      "  gl_Position = uMVP * vec4(p, 1.0);",
      "}"
    ].join("\n");

    var fsSrc = [
      "precision mediump float;",
      "varying vec2 vUV;",
      "varying vec3 vNorm;",
      "varying vec3 vPos;",
      "uniform vec3 uC1;",
      "uniform vec3 uC2;",
      "uniform float uSheen;",
      "uniform float uFreq;",
      "uniform vec3 uLightDir;",
      "uniform float uDist;",
      "void main() {",
      "  vec3 N = normalize(vNorm);",
      "  if (!gl_FrontFacing) N = -N;",
      "  vec3 L = normalize(uLightDir);",
      "  vec3 V = normalize(vec3(0.0, 0.0, uDist) - vPos);",
      "  float diff = max(dot(N, L), 0.0);",
      "  vec3 H = normalize(L + V);",
      "  float spec = pow(max(dot(N, H), 0.0), 26.0) * uSheen;",
      "  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.34;",
      "  float wVis = 1.0 - smoothstep(1.9, 3.8, uDist);",
      "  float warp = sin(vUV.x * uFreq) * 0.5 + 0.5;",
      "  float weft = sin(vUV.y * (uFreq * 0.92)) * 0.5 + 0.5;",
      "  float twill = sin((vUV.x + vUV.y) * uFreq * 0.65) * 0.5 + 0.5;",
      "  float weave = mix(1.0, 0.84 + 0.24 * (warp * 0.45 + weft * 0.35 + twill * 0.2), wVis);",
      "  vec3 base = mix(uC1, uC2, clamp(diff * 0.85 + fres, 0.0, 1.0)) * weave;",
      "  vec3 col = base * (0.24 + 0.86 * diff) + vec3(0.95, 0.88, 0.78) * spec + uC2 * fres * 0.45;",
      "  gl_FragColor = vec4(max(col, vec3(0.04, 0.03, 0.028)), 1.0);",
      "}"
    ].join("\n");

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    var G = 56;
    var verts = [];
    var idx = [];
    for (var j = 0; j <= G; j++) {
      for (var i = 0; i <= G; i++) {
        verts.push(i / G, j / G);
      }
    }
    for (var j2 = 0; j2 < G; j2++) {
      for (var i2 = 0; i2 < G; i2++) {
        var a = j2 * (G + 1) + i2;
        var b = a + 1;
        var c = a + G + 1;
        var d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    }

    var vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    var locUV = gl.getAttribLocation(prog, "aUV");
    gl.enableVertexAttribArray(locUV);
    gl.vertexAttribPointer(locUV, 2, gl.FLOAT, false, 0, 0);

    var ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);

    var uTime = gl.getUniformLocation(prog, "uTime");
    var uWind = gl.getUniformLocation(prog, "uWind");
    var uMVP = gl.getUniformLocation(prog, "uMVP");
    var uRip0 = gl.getUniformLocation(prog, "uRip0");
    var uRip1 = gl.getUniformLocation(prog, "uRip1");
    var uC1 = gl.getUniformLocation(prog, "uC1");
    var uC2 = gl.getUniformLocation(prog, "uC2");
    var uSheen = gl.getUniformLocation(prog, "uSheen");
    var uFreq = gl.getUniformLocation(prog, "uFreq");
    var uLightDir = gl.getUniformLocation(prog, "uLightDir");
    var uDist = gl.getUniformLocation(prog, "uDist");

    function mul4(a, b) {
      var o = new Float32Array(16);
      for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
          o[c * 4 + r] = a[0 * 4 + r] * b[c * 4 + 0] + a[1 * 4 + r] * b[c * 4 + 1] + a[2 * 4 + r] * b[c * 4 + 2] + a[3 * 4 + r] * b[c * 4 + 3];
        }
      }
      return o;
    }
    function persp(fovy, asp, n, f) {
      var s = 1 / Math.tan(fovy / 2);
      var nf = 1 / (n - f);
      return new Float32Array([s / asp, 0, 0, 0, 0, s, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]);
    }
    function rotY(a) {
      var c = Math.cos(a), s = Math.sin(a);
      return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
    }
    function rotX(a) {
      var c = Math.cos(a), s = Math.sin(a);
      return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
    }
    function transZ(z) {
      return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, z, 1]);
    }

    canvas.addEventListener("pointerdown", function (e) {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
      if (mode === "touch") {
        var rect = canvas.getBoundingClientRect();
        var u = (e.clientX - rect.left) / rect.width;
        var v = 1 - (e.clientY - rect.top) / rect.height;
        ripples.unshift({ u: u, v: v, age: 0, amp: 1.0 });
        if (ripples.length > 2) ripples.pop();
      }
    });
    window.addEventListener("pointerup", function () { dragging = false; });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging || mode !== "orbit") return;
      yaw += (e.clientX - lx) * 0.008;
      pitch = Math.max(-0.9, Math.min(0.9, pitch + (e.clientY - ly) * 0.006));
      lx = e.clientX;
      ly = e.clientY;
    });
    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      camDist = Math.max(1.5, Math.min(4.6, camDist + e.deltaY * 0.002));
      document.getElementById("rng-zoom").value = String(Math.round(camDist * 10));
      document.getElementById("val-zoom").textContent = camDist.toFixed(1) + "m";
    }, { passive: false });

    gl.enable(gl.DEPTH_TEST);
    var simT = 0;
    var prev = 0;
    status.textContent = "WebGL1 · 56×56 aktif (3.249 düğüm)";

    function frame(ts) {
      var dt = prev ? Math.min(0.05, (ts - prev) / 1000) : 0.016;
      prev = ts;
      if (!frozen) simT += dt;
      for (var k = 0; k < ripples.length; k++) {
        ripples[k].age += dt;
        ripples[k].amp = Math.max(0, 1.0 - ripples[k].age * 0.45);
      }

      var w = canvas.clientWidth || 960;
      var h = canvas.clientHeight || 540;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.067, 0.051, 0.047, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var mvp = mul4(persp(0.76, canvas.width / Math.max(1, canvas.height), 0.1, 20.0), mul4(transZ(-camDist), mul4(rotX(pitch), rotY(yaw))));
      gl.uniformMatrix4fv(uMVP, false, mvp);
      gl.uniform1f(uTime, simT);
      gl.uniform1f(uWind, windPow);
      gl.uniform3fv(uC1, new Float32Array(activeFab.c1));
      gl.uniform3fv(uC2, new Float32Array(activeFab.c2));
      gl.uniform1f(uSheen, activeFab.sheen);
      gl.uniform1f(uFreq, activeFab.freq);
      gl.uniform1f(uDist, camDist);
      var lr = lightDeg * Math.PI / 180;
      gl.uniform3f(uLightDir, Math.cos(lr) * 1.1, 0.65, Math.sin(lr) * 0.8 + 0.85);
      var r0 = ripples[0] || { u: 0.5, v: 0.5, amp: 0, age: 0 };
      var r1 = ripples[1] || { u: 0.5, v: 0.5, amp: 0, age: 0 };
      gl.uniform4f(uRip0, r0.u, r0.v, r0.amp, r0.age);
      gl.uniform4f(uRip1, r1.u, r1.v, r1.amp, r1.age);

      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  renderSwatches();
  renderDesigners();
  bindControls();
  startWebGL();
})();
