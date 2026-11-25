(function () {
  "use strict";

  var DATA = window.PRIZMA_DATA;
  var U = window.PRIZMA_UTILS;

  var activeRoomId = "oda_02";
  var kelvin = 3800;
  var seedNo = 1;

  function findRoom(id) {
    for (var i = 0; i < DATA.GALLERY_ROOMS.length; i++) {
      if (DATA.GALLERY_ROOMS[i].id === id) return DATA.GALLERY_ROOMS[i];
    }
    return DATA.GALLERY_ROOMS[0];
  }

  function kelvinTintRgba(k) {
    if (k <= 3000) return "rgba(255, 196, 118, 0.24)";
    if (k <= 3700) return "rgba(255, 224, 175, 0.16)";
    if (k <= 4500) return "rgba(246, 248, 255, 0.10)";
    return "rgba(180, 218, 255, 0.20)";
  }

  function kelvinLabel(k) {
    if (k <= 3000) return k + " K · Akşam Mumu / Sıcak Salon";
    if (k <= 3700) return k + " K · Sıcak Galeri Spotu";
    if (k <= 4500) return k + " K · Müze Nötr Işığı";
    return k + " K · Pencere Gün Işığı";
  }

  function drawRoomCanvas(room, arch, randevu) {
    var cv = document.getElementById("f3-gallery-canvas");
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    var w = cv.width;
    var h = cv.height;

    ctx.fillStyle = room.duvar_baz;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#111319";
    ctx.fillRect(0, h - 56, w, 56);
    ctx.strokeStyle = "#2d3345";
    ctx.beginPath();
    ctx.moveTo(0, h - 56);
    ctx.lineTo(w, h - 56);
    ctx.stroke();

    var spot = ctx.createRadialGradient(260, 20, 12, 260, 170, 290);
    spot.addColorStop(0, kelvinTintRgba(kelvin));
    spot.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, w, h);

    var fx = 62, fy = 46, fw = 400, fh = 248;
    ctx.fillStyle = "#0e1015";
    ctx.fillRect(fx - 10, fy - 10, fw + 20, fh + 20);
    ctx.strokeStyle = room.cerceve;
    ctx.lineWidth = 4;
    ctx.strokeRect(fx - 10, fy - 10, fw + 20, fh + 20);

    ctx.fillStyle = arch.yeni_siyah.hex;
    ctx.fillRect(fx, fy, fw, fh);

    var pal = arch.altin_palet;
    for (var i = 0; i < 9; i++) {
      var angle = (seedNo * 1.17 + i * 0.88);
      var cx = fx + 55 + ((Math.sin(angle) + 1) * 0.5) * (fw - 110);
      var cy = fy + 45 + ((Math.cos(angle * 1.3) + 1) * 0.5) * (fh - 90);
      var rad = 28 + ((i * 17 + seedNo * 11) % 58);
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fillStyle = pal[i % pal.length].hex;
      ctx.globalAlpha = 0.72;
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    ctx.strokeStyle = room.cerceve;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(fx + 24, fy + fh - 38);
    ctx.bezierCurveTo(fx + 140, fy + 40 + (seedNo * 5) % 80, fx + 270, fy + fh - 20, fx + fw - 24, fy + 44);
    ctx.stroke();

    ctx.fillStyle = kelvinTintRgba(kelvin);
    ctx.fillRect(fx, fy, fw, fh);

    var gx = 514, gy = 56, gw = 196, gh = 232;
    ctx.fillStyle = "#161a24";
    ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeStyle = "#3a4154";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(gx, gy, gw, gh);

    ctx.fillStyle = "#d4b06a";
    ctx.font = "bold 11px monospace";
    ctx.fillText("K1/K4 CEKET KUMAŞI", gx + 14, gy + 24);

    ctx.fillStyle = arch.yeni_siyah.hex;
    ctx.fillRect(gx + 14, gy + 36, gw - 28, 92);
    ctx.strokeStyle = room.cerceve;
    ctx.strokeRect(gx + 14, gy + 36, gw - 28, 92);

    ctx.fillStyle = kelvinTintRgba(kelvin);
    ctx.fillRect(gx + 14, gy + 36, gw - 28, 92);

    ctx.fillStyle = "#f3efe6";
    ctx.font = "12px Georgia, serif";
    ctx.fillText(arch.yeni_siyah.ad, gx + 22, gy + 78);
    ctx.font = "11px monospace";
    ctx.fillStyle = "#d6dceb";
    ctx.fillText(arch.yeni_siyah.hex + " (0 Siyah)", gx + 22, gy + 98);

    ctx.fillStyle = "#b6b0a2";
    ctx.font = "11px sans-serif";
    ctx.fillText(randevu ? ("Silüet: " + randevu.siluet.replace(/_/g, " ")) : "Silüet: Akışkan Terzi", gx + 14, gy + 154);
    ctx.fillText(randevu ? ("Metraj: " + randevu.tahmini_metraj_m + " m") : "K6 Doğal Lif Aktif", gx + 14, gy + 174);
    ctx.fillText("Işık: " + kelvin + " K", gx + 14, gy + 194);
    ctx.fillStyle = "#3fb8a8";
    ctx.fillText("VETO: #000000 KAPALI", gx + 14, gy + 216);

    ctx.fillStyle = "#f3efe6";
    ctx.font = "13px Georgia, serif";
    ctx.fillText(room.no + " · " + room.eser_ad + " · Tohum #" + String(seedNo).padStart(2, "0"), 62, h - 22);
  }

  function renderRoomButtons() {
    var row = document.getElementById("f3-room-btns");
    if (!row) return;
    U.clearEl(row);
    for (var i = 0; i < DATA.GALLERY_ROOMS.length; i++) {
      (function (r) {
        var b = U.el("button", "btn" + (r.id === activeRoomId ? " btn-gold" : ""), r.no + " · " + r.ad);
        b.type = "button";
        b.addEventListener("click", function () {
          activeRoomId = r.id;
          kelvin = r.onerilen_kelvin;
          document.getElementById("f3-kelvin").value = String(kelvin);
          renderAll(true);
        });
        row.appendChild(b);
      })(DATA.GALLERY_ROOMS[i]);
    }
  }

  function renderAll(saveNow) {
    renderRoomButtons();
    var room = findRoom(activeRoomId);
    var dna = U.readStore("prizma_dila_dna_v1");
    var randevu = U.readStore("prizma_dila_randevu_v1");
    var arch = DATA.ARCHETYPES[room.arketip] || DATA.ARCHETYPES.derin_zeytin;

    var strip = document.getElementById("f3-dna-strip");
    U.clearEl(strip);
    strip.appendChild(U.el("span", "dna-pill dna-pill-ok", "Aktif Oda: " + room.ad + " (" + arch.yeni_siyah.ad + ")"));
    if (dna) strip.appendChild(U.el("span", "dna-pill", "Front 1 DNA: " + dna.arketip_ad + " · #" + dna.sha16));
    if (randevu) strip.appendChild(U.el("span", "dna-pill", "Front 2 Kalıp: " + randevu.tahmini_metraj_m + " m · #" + randevu.sha16));

    document.getElementById("lbl-kelvin").textContent = kelvinLabel(kelvin);
    document.getElementById("lbl-tohum").textContent = "Varyasyon #" + String(seedNo).padStart(2, "0");

    document.getElementById("f3-room-title").textContent = room.no + " · " + room.ad;
    document.getElementById("f3-room-desc").textContent = "Eser: " + room.eser_ad + " — Arketip: " + arch.ad + " (Saf #000000 siyah tuvalde de yasak).";
    document.getElementById("f3-sanart-note").textContent = room.sanart_eslesme;
    document.getElementById("f3-garment-note").textContent = randevu
      ? (room.kumas_eslesme + " · Front 2 ölçün: Omuz " + randevu.olcu_cm.omuz + " cm / Pay +" + randevu.olcu_cm.hareket_payi + " cm")
      : room.kumas_eslesme;
    document.getElementById("f3-audio-note").textContent = arch.akustik_mod;

    var diff = Math.abs(kelvin - room.onerilen_kelvin);
    var ev = document.getElementById("f3-light-eval");
    if (diff <= 500) {
      ev.className = "alert alert-ok";
      ev.textContent = "Işık Uyumu Yüksek (" + kelvin + "K, önerilen " + room.onerilen_kelvin + "K): Tablo pigmentleri ve kumaş dokusu doğal dengede.";
    } else {
      ev.className = "alert alert-warn";
      ev.textContent = "Işık Sapması (" + kelvin + "K vs önerilen " + room.onerilen_kelvin + "K): Salon ışığı kumaş alt-tonunu " + (kelvin < room.onerilen_kelvin ? "sıcaklaştırıyor" : "soğutuyor") + "; spot kalibrasyonu önerilir.";
    }

    drawRoomCanvas(room, arch, randevu);

    var seed = [room.id, kelvin, seedNo, arch.yeni_siyah.hex].join("|");
    U.sha16Async(seed, function (hex) {
      var rec = {
        k: "dila_galeri_kurasyon_v1",
        oda_id: room.id,
        oda_ad: room.ad,
        eser_ad: room.eser_ad,
        varyasyon: seedNo,
        kelvin: kelvin,
        onerilen_kelvin: room.onerilen_kelvin,
        yeni_siyah_hex: arch.yeni_siyah.hex,
        akustik_mod: arch.akustik_mod,
        dna_ref: dna ? dna.dna_id : null,
        randevu_ref: randevu ? randevu.sha16 : null,
        sha16: hex
      };
      document.getElementById("f3-jsonl-out").textContent = JSON.stringify(rec);
      if (saveNow) {
        U.writeStore("prizma_dila_galeri_v1", rec);
        document.getElementById("f3-status").textContent = "Galeri kürasyonu mühürlendi (#" + hex + ").";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var dna = U.readStore("prizma_dila_dna_v1");
    if (dna && dna.galeri_oda_id) {
      activeRoomId = dna.galeri_oda_id;
      var rm = findRoom(activeRoomId);
      kelvin = rm.onerilen_kelvin;
      document.getElementById("f3-kelvin").value = String(kelvin);
    }

    document.getElementById("f3-kelvin").addEventListener("input", function (e) {
      kelvin = Number(e.target.value);
      renderAll(false);
    });
    document.getElementById("f3-tohum").addEventListener("input", function (e) {
      seedNo = Number(e.target.value);
      renderAll(false);
    });
    document.getElementById("btn-f3-play").addEventListener("click", function () {
      var room = findRoom(activeRoomId);
      var arch = DATA.ARCHETYPES[room.arketip] || DATA.ARCHETYPES.derin_zeytin;
      var ok = U.playChord(arch.akor_hz);
      document.getElementById("f3-status").textContent = ok
        ? "K7 Oda Akoru çalındı: " + arch.akustik_mod
        : "Tarayıcı ses motoru başlatılamadı.";
    });
    document.getElementById("btn-f3-save").addEventListener("click", function () { renderAll(true); });
    document.getElementById("btn-f3-indir").addEventListener("click", function () {
      var txt = document.getElementById("f3-jsonl-out").textContent || "";
      U.downloadText("dila_galeri_kurasyon_v1.jsonl", txt + "\n", document.getElementById("f3-status"));
    });

    renderAll(true);
  });
})();
