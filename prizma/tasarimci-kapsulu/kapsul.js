(function () {
  "use strict";

  var canvas = document.getElementById("kelvin-canvas");
  var ctx = canvas.getContext("2d");
  var slider = document.getElementById("kelvin-slider");
  var valEl = document.getElementById("kelvin-val");
  var readEl = document.getElementById("kelvin-read");
  var deltaEl = document.getElementById("delta-read");
  var subInput = document.getElementById("sub-input");
  var subPrev = document.getElementById("sub-preview");
  var kelvin = 3200;

  var TONES = [
    { name: "YASAK #000000", note: "Işıkta ölü alan — doku kaybolur", rgb: [0, 0, 0], banned: true },
    { name: "Gece Espresso", note: "PANTONE 19-0915 TCX · sıcak doku", rgb: [38, 28, 24], banned: false },
    { name: "Koyu Mürdüm", note: "PANTONE 19-2520 TCX · ipek parlama", rgb: [56, 26, 44], banned: false },
    { name: "Derin Zümrüt", note: "PANTONE 19-5420 TCX · soğuk derinlik", rgb: [20, 58, 49], banned: false }
  ];

  var RULES = [
    ["1 · Bağımsız Alt Sayfa", "Bu sayfa /prizma/atolye/ ile tek bir CSS veya JS dosyası paylaşmaz."],
    ["2 · Taşınabilirlik", "Yalnız ./kapsul.css ve ./kapsul.js ile çalışır; klasör taşınsa da kırılmaz."],
    ["3 · Dürüst Kapsam", "Alt-alan adı önizlemesi yereldir; canlı DNS kaydı ayrıca açılır."]
  ];

  function kelvinRGB(k) {
    var t = (k - 2700) / (5600 - 2700);
    return [
      Math.round(255 - t * 28),
      Math.round(204 + t * 38),
      Math.round(145 + t * 105)
    ];
  }

  function labelFor(k) {
    if (k <= 2900) return k + " K · Sıcak Akşam & Mum Işığı";
    if (k <= 3600) return k + " K · Sıcak Galeri Spotu";
    if (k <= 4700) return k + " K · Nötr Atölye Işığı";
    return k + " K · Doğal Gün Işığı";
  }

  function draw() {
    var W = canvas.width, H = canvas.height;
    var light = kelvinRGB(kelvin);
    ctx.fillStyle = "#141012";
    ctx.fillRect(0, 0, W, H);

    var grad = ctx.createRadialGradient(W * 0.5, 24, 18, W * 0.5, H * 0.45, W * 0.65);
    grad.addColorStop(0, "rgba(" + light[0] + "," + light[1] + "," + light[2] + ",0.34)");
    grad.addColorStop(1, "rgba(20,16,18,0.0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    var pad = 22;
    var colW = (W - pad * 5) / 4;
    for (var i = 0; i < TONES.length; i++) {
      var t = TONES[i];
      var x = pad + i * (colW + pad);
      var y = 62;
      var h = 290;

      // Illuminated fabric swatch
      var r = t.banned ? 0 : Math.min(255, Math.round(t.rgb[0] * (light[0] / 215) + 14));
      var g = t.banned ? 0 : Math.min(255, Math.round(t.rgb[1] * (light[1] / 215) + 12));
      var b = t.banned ? 0 : Math.min(255, Math.round(t.rgb[2] * (light[2] / 215) + 12));
      ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
      ctx.fillRect(x, y, colW, h);

      // Procedural thread weave lines (invisible on #000000!)
      if (!t.banned) {
        ctx.strokeStyle = "rgba(" + light[0] + "," + light[1] + "," + light[2] + ",0.16)";
        ctx.lineWidth = 1;
        for (var wy = y + 8; wy < y + h; wy += 9) {
          ctx.beginPath();
          ctx.moveTo(x + 4, wy);
          ctx.lineTo(x + colW - 4, wy + Math.sin(wy * 0.08 + i) * 3);
          ctx.stroke();
        }
        var sheen = ctx.createLinearGradient(x, y, x + colW, y + h);
        sheen.addColorStop(0, "rgba(" + light[0] + "," + light[1] + "," + light[2] + ",0.22)");
        sheen.addColorStop(0.5, "rgba(255,255,255,0.0)");
        sheen.addColorStop(1, "rgba(18,14,15,0.35)");
        ctx.fillStyle = sheen;
        ctx.fillRect(x, y, colW, h);
      } else {
        ctx.strokeStyle = "#b84b4b";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, colW - 2, h - 2);
        ctx.beginPath();
        ctx.moveTo(x + 14, y + 14);
        ctx.lineTo(x + colW - 14, y + h - 14);
        ctx.stroke();
      }

      ctx.fillStyle = t.banned ? "#e58888" : "#f5ede6";
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.fillText(t.name, x, y + h + 26);
      ctx.fillStyle = "#b8a7ae";
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText(t.note.slice(0, 26), x, y + h + 46);
    }

    ctx.fillStyle = "#f2e6dc";
    ctx.font = "600 13px ui-monospace, monospace";
    ctx.fillText("KELVIN SPEKTRUMU: " + kelvin + " K  |  RGB(" + light.join(",") + ")", pad, 34);
    readEl.textContent = labelFor(kelvin);
    deltaEl.textContent = kelvin < 3400 ? "Sıcak alt-tonlar belirgin" : "Soğuk zümrüt & mürdüm lifleri belirgin";
  }

  function populateRules() {
    var box = document.getElementById("rule-list");
    RULES.forEach(function (r) {
      var d = document.createElement("div");
      d.className = "rule-item";
      var st = document.createElement("strong");
      st.textContent = r[0];
      var sp = document.createElement("span");
      sp.textContent = r[1];
      d.appendChild(st);
      d.appendChild(sp);
      box.appendChild(d);
    });
  }

  slider.addEventListener("input", function () {
    kelvin = Number(slider.value);
    valEl.textContent = kelvin + " K";
    draw();
  });

  document.getElementById("kelvin-presets").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-k]");
    if (!btn) return;
    kelvin = Number(btn.getAttribute("data-k"));
    slider.value = String(kelvin);
    valEl.textContent = kelvin + " K";
    var all = document.querySelectorAll(".kbtn");
    for (var i = 0; i < all.length; i++) all[i].classList.remove("is-on");
    btn.classList.add("is-on");
    draw();
  });

  subInput.addEventListener("input", function () {
    var clean = subInput.value.toLowerCase().replace(/[^a-z0-9-]/g, "") || "tasarimci";
    subPrev.textContent = "Önizleme adresi: " + clean + ".afair.studio (yerel taslak; canlı tahsis sunucu kaydı ister)";
  });

  populateRules();
  draw();
})();
