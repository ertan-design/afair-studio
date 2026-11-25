(function () {
  "use strict";

  var TOTAL = 50000;
  var bitmap = new Uint8Array(TOTAL / 4);
  var NAMES = ["Boş (00)", "Aktif (01)", "Mühürlü (10)", "Karantina (11)"];
  var COLS = [[30, 24, 38], [77, 224, 165], [229, 184, 110], [239, 110, 122]];

  function setState(i, st) {
    var b = i >> 2, sh = (i & 3) * 2;
    bitmap[b] = (bitmap[b] & ~(3 << sh)) | ((st & 3) << sh);
  }
  function getState(i) { return (bitmap[i >> 2] >> ((i & 3) * 2)) & 3; }

  for (var i = 0; i < TOTAL; i++) {
    var h = (i * 2654435761) >>> 0;
    var mod = h % 100;
    setState(i, mod < 46 ? 2 : (mod < 78 ? 1 : (mod < 97 ? 0 : 3)));
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function drawBitmap() {
    var cv = document.getElementById("rcombo-canvas");
    var ctx = cv.getContext("2d");
    var img = ctx.createImageData(250, 200);
    var counts = [0, 0, 0, 0];
    for (var i = 0; i < TOTAL; i++) {
      var st = getState(i);
      counts[st]++;
      var c = COLS[st], p = i * 4;
      img.data[p] = c[0]; img.data[p + 1] = c[1]; img.data[p + 2] = c[2]; img.data[p + 3] = 255;
    }
    var tmp = document.createElement("canvas");
    tmp.width = 250; tmp.height = 200;
    tmp.getContext("2d").putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, cv.width, cv.height);

    var box = document.getElementById("rcombo-stats");
    clear(box);
    counts.forEach(function (cnt, k) {
      var d = document.createElement("div"); d.className = "st";
      var sp = document.createElement("span"); sp.textContent = NAMES[k];
      var st = document.createElement("strong"); st.textContent = cnt.toLocaleString("tr-TR");
      d.appendChild(sp); d.appendChild(st); box.appendChild(d);
    });
  }

  function inspectGate() {
    var id = Math.max(1, Math.min(TOTAL, Number(document.getElementById("gate-id").value) || 1));
    document.getElementById("inspect-out").textContent = "KAPI #" + id + " | Byte Offset: " + ((id - 1) >> 2) + " | Bit Shift: " + (((id - 1) & 3) * 2) + " | Durum: " + NAMES[getState(id - 1)];
  }

  document.getElementById("b-inspect").addEventListener("click", inspectGate);
  document.getElementById("b-toggle").addEventListener("click", function () {
    var id = Math.max(1, Math.min(TOTAL, Number(document.getElementById("gate-id").value) || 1));
    setState(id - 1, (getState(id - 1) + 1) % 4);
    drawBitmap(); inspectGate();
  });
  document.getElementById("rcombo-canvas").addEventListener("click", function (e) {
    var r = e.target.getBoundingClientRect();
    var gx = Math.min(249, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * 250)));
    var gy = Math.min(199, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * 200)));
    document.getElementById("gate-id").value = String(gy * 250 + gx + 1);
    inspectGate();
  });

  var sealedHex = "";
  function digestHex(str, cb) {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(function (buf) {
        var b = new Uint8Array(buf), h = "";
        for (var i = 0; i < b.length; i++) h += b[i].toString(16).padStart(2, "0");
        cb(h);
      });
    } else { cb("webcrypto-yok"); }
  }

  function sealOriginal() {
    var txt = document.getElementById("dna-text").value;
    digestHex(txt, function (hex) {
      sealedHex = hex;
      var box = document.getElementById("hash-box");
      box.classList.remove("tampered");
      box.textContent = "DURUM      : ORİJİNAL MÜHÜR KİLİTLİ ✓\nMÜHÜR SHA  : " + hex + "\nBAYT       : " + txt.length;
    });
  }

  function runSabotage() {
    var el = document.getElementById("dna-text"), txt = el.value;
    if (!txt.length) return;
    var flipped = txt.slice(0, -1) + String.fromCharCode(txt.charCodeAt(txt.length - 1) === 125 ? 33 : 125);
    el.value = flipped;
    digestHex(flipped, function (hex) {
      var diffBits = 0;
      for (var i = 0; i < Math.min(sealedHex.length, hex.length); i++) {
        var x = parseInt(sealedHex[i], 16) ^ parseInt(hex[i], 16);
        while (x) { diffBits += x & 1; x >>= 1; }
      }
      var box = document.getElementById("hash-box");
      box.classList.add("tampered");
      box.textContent = "ALARM      : 1-BAYT SABOTAJ YAKALANDI!\nORİJİNAL   : " + sealedHex + "\nSABOTAJLI  : " + hex + "\nDEĞİŞEN BİT: " + diffBits + " / 256 (%" + ((diffBits / 256) * 100).toFixed(1) + " çığ etkisi)";
    });
  }

  document.getElementById("b-seal").addEventListener("click", sealOriginal);
  document.getElementById("b-sabotage").addEventListener("click", runSabotage);

  drawBitmap(); inspectGate(); sealOriginal();
})();
