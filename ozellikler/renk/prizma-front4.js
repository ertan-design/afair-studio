(function () {
  "use strict";

  var DATA = window.PRIZMA_DATA;
  var U = window.PRIZMA_UTILS;

  var latestLine = "";

  function sha256FullAsync(str, cb) {
    try {
      if (window.crypto && window.crypto.subtle && window.TextEncoder) {
        var bytes = new TextEncoder().encode(str);
        window.crypto.subtle.digest("SHA-256", bytes).then(function (buf) {
          var arr = new Uint8Array(buf);
          var hex = "";
          for (var i = 0; i < arr.length; i++) {
            hex += arr[i].toString(16).padStart(2, "0");
          }
          cb(hex);
        }).catch(function () {
          var f = U.fnv64Hex(str);
          cb(f + U.fnv64Hex(str + "|b") + U.fnv64Hex(str + "|c") + U.fnv64Hex(str + "|d"));
        });
        return;
      }
    } catch (_e) {}
    var f2 = U.fnv64Hex(str);
    cb(f2 + U.fnv64Hex(str + "|b") + U.fnv64Hex(str + "|c") + U.fnv64Hex(str + "|d"));
  }

  function gatherChain() {
    var dna = U.readStore("prizma_dila_dna_v1");
    var randevu = U.readStore("prizma_dila_randevu_v1");
    var galeri = U.readStore("prizma_dila_galeri_v1");
    var arch = (dna && DATA.ARCHETYPES[dna.arketip_id]) ? DATA.ARCHETYPES[dna.arketip_id] : DATA.ARCHETYPES.derin_zeytin;
    return { dna: dna, randevu: randevu, galeri: galeri, arch: arch };
  }

  function computeGateCoords(shaHex) {
    var n = parseInt(shaHex.slice(0, 8), 16) >>> 0;
    var slotIndex = n % 50000;
    var slotNo = slotIndex + 1;
    var siteIdx = Math.floor(slotIndex / 12500);
    var siteObj = DATA.RCOMBO_SITES[siteIdx] || DATA.RCOMBO_SITES[0];
    var teamNo = (slotIndex % 11) + 1;
    var byteOffset = Math.floor(slotIndex / 4);
    var bitShift = (slotIndex % 4) * 2;
    return {
      slot_id: "S" + String(slotNo).padStart(5, "0"),
      slot_no: slotNo,
      site: siteObj.site,
      site_id: siteObj.id,
      team: "T" + String(teamNo).padStart(2, "0"),
      bitmap_byte: byteOffset,
      bitmap_bits: bitShift + ".." + (bitShift + 1)
    };
  }

  function drawPassportCanvas(passport, arch, gate) {
    var cv = document.getElementById("f4-passport-canvas");
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    var w = cv.width;
    var h = cv.height;

    ctx.fillStyle = "#10131a";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = arch.yeni_siyah.hex;
    ctx.fillRect(18, 18, w - 36, h - 36);

    ctx.strokeStyle = "#d4b06a";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.strokeStyle = "rgba(212, 176, 106, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(28, 28, w - 56, h - 56);

    ctx.fillStyle = "#d4b06a";
    ctx.font = "bold 12px monospace";
    ctx.fillText("AFAIR × DİLA · DİJİTAL ÖZGÜNLÜK PASAPORTU (K8 · 50.000 KAPI)", 46, 60);

    ctx.fillStyle = "#f3efe6";
    ctx.font = "bold 26px Georgia, serif";
    ctx.fillText(passport.sahip, 46, 98);

    ctx.fillStyle = "#d6dceb";
    ctx.font = "13px monospace";
    ctx.fillText("KAPI: " + gate.slot_id + " / 50.000  ·  SİTE: " + gate.site + "  ·  TAKIM: " + gate.team, 46, 128);
    ctx.fillText("ARKETİP: " + arch.ad + "  ·  YENİ SİYAH: " + arch.yeni_siyah.ad + " (" + arch.yeni_siyah.hex + ")", 46, 152);
    ctx.fillText("ÖLÇÜ (F2): " + passport.olcu_ozet, 46, 176);
    ctx.fillText("GALERİ (F3): " + passport.galeri_ozet, 46, 200);
    ctx.fillText("VİDEO BAĞI: DILA_04_MARKA_FILMI_MASTER_REEL.mp4 (faststart)", 46, 224);

    // Palette bar + crossed out #000000 black
    ctx.fillStyle = "#000000";
    ctx.fillRect(46, 250, 72, 34);
    ctx.strokeStyle = "#e06363";
    ctx.lineWidth = 2;
    ctx.strokeRect(46, 250, 72, 34);
    ctx.beginPath();
    ctx.moveTo(46, 250);
    ctx.lineTo(118, 284);
    ctx.stroke();
    ctx.fillStyle = "#e06363";
    ctx.font = "bold 10px monospace";
    ctx.fillText("VETO #000", 52, 271);

    for (var i = 0; i < arch.altin_palet.length; i++) {
      var x = 132 + i * 76;
      ctx.fillStyle = arch.altin_palet[i].hex;
      ctx.fillRect(x, 250, 68, 34);
      ctx.strokeStyle = "#d4b06a";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, 250, 68, 34);
    }

    // Procedural deterministic visual matrix (12x12 from SHA-256 hex)
    var mx = 564, my = 80, cell = 12;
    ctx.fillStyle = "#0d1016";
    ctx.fillRect(mx - 8, my - 8, 12 * cell + 16, 12 * cell + 16);
    ctx.strokeStyle = "#d4b06a";
    ctx.strokeRect(mx - 8, my - 8, 12 * cell + 16, 12 * cell + 16);

    var sha = passport.sha256;
    for (var r = 0; r < 12; r++) {
      for (var c = 0; c < 12; c++) {
        var nibble = parseInt(sha[(r * 12 + c) % sha.length], 16);
        var bitOn = ((nibble >> ((r + c) % 4)) & 1) === 1;
        if (bitOn) {
          ctx.fillStyle = (r + c) % 3 === 0 ? "#d4b06a" : "#f3efe6";
          ctx.fillRect(mx + c * cell + 1, my + r * cell + 1, cell - 2, cell - 2);
        }
      }
    }
    ctx.fillStyle = "#3fb8a8";
    ctx.font = "10px monospace";
    ctx.fillText("SHA-256 MATRİSİ", mx + 20, my + 12 * cell + 24);

    // 8-concept badges
    var concepts = ["K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8"];
    for (var k = 0; k < concepts.length; k++) {
      var bx = 46 + k * 82;
      ctx.fillStyle = "rgba(15, 17, 21, 0.72)";
      ctx.fillRect(bx, 310, 72, 28);
      ctx.strokeStyle = "#3fb8a8";
      ctx.strokeRect(bx, 310, 72, 28);
      ctx.fillStyle = "#c8f5ef";
      ctx.font = "bold 11px monospace";
      ctx.fillText(concepts[k] + " OK", bx + 14, 328);
    }

    ctx.fillStyle = "#b6b0a2";
    ctx.font = "11px monospace";
    ctx.fillText("BITMAP: byte " + gate.bitmap_byte + " / 12.499 (bit " + gate.bitmap_bits + ") · 0 SAF SİYAH MÜHÜRLÜ", 46, 368);
    ctx.fillStyle = "#d4b06a";
    ctx.font = "11px monospace";
    ctx.fillText("SHA-256: " + sha, 46, 392);
  }

  function buildAndRender() {
    var chain = gatherChain();
    var arch = chain.arch;
    var sahip = (document.getElementById("f4-misafir").value || "Dila · AFAIR Pilot #01").trim();

    var strip = document.getElementById("f4-chain-strip");
    U.clearEl(strip);
    strip.appendChild(U.el("span", "dna-pill " + (chain.dna ? "dna-pill-ok" : "dna-pill-warn"), "Front 1 Renk: " + arch.ad + (chain.dna ? " (#" + chain.dna.sha16 + ")" : " (varsayılan)")));
    strip.appendChild(U.el("span", "dna-pill " + (chain.randevu ? "dna-pill-ok" : "dna-pill-warn"), "Front 2 Mezura: " + (chain.randevu ? ("Omuz " + chain.randevu.olcu_cm.omuz + " / +" + chain.randevu.olcu_cm.hareket_payi + " cm") : "varsayılan kalıp")));
    strip.appendChild(U.el("span", "dna-pill " + (chain.galeri ? "dna-pill-ok" : "dna-pill-warn"), "Front 3 Galeri: " + (chain.galeri ? (chain.galeri.oda_ad + " · " + chain.galeri.kelvin + "K") : arch.galeri_tarzi)));
    strip.appendChild(U.el("span", "dna-pill dna-pill-ok", "Video: 6 Canlı MP4 (+faststart)"));

    var olcuOzet = chain.randevu
      ? ("Omuz " + chain.randevu.olcu_cm.omuz + " / Bel " + chain.randevu.olcu_cm.bel + " / Pay +" + chain.randevu.olcu_cm.hareket_payi + " cm · " + chain.randevu.tahmini_metraj_m + " m")
      : "Omuz 40.5 / Bel 66.0 / Pay +4.5 cm (Varsayılan)";
    var galeriOzet = chain.galeri
      ? (chain.galeri.oda_ad + " · " + chain.galeri.kelvin + "K · Tohum #" + chain.galeri.varyasyon)
      : (arch.galeri_tarzi + " · 3800K");

    var payloadObj = {
      k: "dila_pasaport_v1",
      sahip: sahip,
      arketip_id: arch.id,
      yeni_siyah: arch.yeni_siyah.ad,
      yeni_siyah_hex: arch.yeni_siyah.hex,
      yasak_siyah: "#000000",
      olcu_ozet: olcuOzet,
      galeri_ozet: galeriOzet,
      front1_ref: chain.dna ? chain.dna.sha16 : "default",
      front2_ref: chain.randevu ? chain.randevu.sha16 : "default",
      front3_ref: chain.galeri ? chain.galeri.sha16 : "default",
      video_ref: "123ae1af03e1cdd0"
    };

    var canonical = JSON.stringify(payloadObj);
    sha256FullAsync(canonical, function (shaHex) {
      var gate = computeGateCoords(shaHex);
      var fullRec = Object.assign({}, payloadObj, {
        kapi_50k: gate.slot_id,
        site_hedef: gate.site,
        takim_seridi: gate.team,
        bitmap_bayt: gate.bitmap_byte,
        sha256: shaHex
      });

      document.getElementById("f4-slot-lbl").textContent = gate.slot_id + " / 50.000";

      var kpis = document.getElementById("f4-gate-kpis");
      U.clearEl(kpis);
      var rows = [
        ["Atanan 50K Kapı", gate.slot_id],
        ["Hedef Üretim Sitesi", gate.site],
        ["11-Takım Şeridi", gate.team + " / 11"],
        ["2-Bit Bitmap Konumu", "Byte " + gate.bitmap_byte + " (bit " + gate.bitmap_bits + ")"]
      ];
      for (var i = 0; i < rows.length; i++) {
        var card = U.el("div", "concept-card");
        card.appendChild(U.el("p", "", rows[i][0]));
        card.appendChild(U.el("strong", "", rows[i][1]));
        kpis.appendChild(card);
      }

      document.getElementById("f4-gate-explain").textContent =
        "Deterministik Kapı Mührü: Aynı DNA + ölçü + galeri seçimi dünyada hangi tarayıcıda açılırsa açılsın " +
        "her zaman " + gate.slot_id + " (" + gate.site + ", " + gate.team + ", 12.500 B bitmap byte #" + gate.bitmap_byte + ") " +
        "adresine ve birebir aynı SHA-256 özetine düşer.";

      latestLine = JSON.stringify(fullRec);
      document.getElementById("f4-jsonl-out").textContent = latestLine;
      document.getElementById("f4-verify-input").value = latestLine;
      drawPassportCanvas(fullRec, arch, gate);
    });
  }

  function verifyInputLine() {
    var raw = (document.getElementById("f4-verify-input").value || "").trim();
    var out = document.getElementById("f4-verify-result");
    if (!raw) {
      out.className = "alert alert-err";
      out.textContent = "Doğrulanacak satır boş.";
      return;
    }
    var obj;
    try {
      obj = JSON.parse(raw);
    } catch (e) {
      out.className = "alert alert-err";
      out.textContent = "RET (GEÇERSİZ JSON): " + e.message;
      return;
    }
    var claimed = obj.sha256 || "";
    var baseObj = {
      k: obj.k,
      sahip: obj.sahip,
      arketip_id: obj.arketip_id,
      yeni_siyah: obj.yeni_siyah,
      yeni_siyah_hex: obj.yeni_siyah_hex,
      yasak_siyah: obj.yasak_siyah,
      olcu_ozet: obj.olcu_ozet,
      galeri_ozet: obj.galeri_ozet,
      front1_ref: obj.front1_ref,
      front2_ref: obj.front2_ref,
      front3_ref: obj.front3_ref,
      video_ref: obj.video_ref
    };
    sha256FullAsync(JSON.stringify(baseObj), function (recomputed) {
      var expectedGate = computeGateCoords(recomputed);
      if (recomputed === claimed && obj.kapi_50k === expectedGate.slot_id) {
        out.className = "alert alert-ok";
        out.textContent = "GEÇTİ (DOĞRULANDI) — SHA-256 birebir eşleşti (" + recomputed.slice(0, 16) + "…) ve kapı adresi " + expectedGate.slot_id + " tutarlı.";
      } else {
        out.className = "alert alert-err";
        out.textContent = "ALARM (SABOTAJ / BOZULMA YAKALANDI!) — İddia edilen SHA-16: " + String(claimed).slice(0, 16) + " ≠ Yeniden hesaplanan: " + recomputed.slice(0, 16) + "!";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("f4-misafir").addEventListener("input", buildAndRender);

    document.getElementById("btn-f4-png").addEventListener("click", function () {
      var cv = document.getElementById("f4-passport-canvas");
      var st = document.getElementById("f4-status");
      try {
        var a = document.createElement("a");
        a.href = cv.toDataURL("image/png");
        a.download = "dila_afair_pasaport.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (st) st.textContent = "dila_afair_pasaport.png indirildi.";
      } catch (_e) {
        if (st) st.textContent = "PNG indirilemedi; JSONL indirmeyi kullanabilirsiniz.";
      }
    });

    document.getElementById("btn-f4-jsonl").addEventListener("click", function () {
      U.downloadText("dila_pasaport_v1.jsonl", latestLine + "\n", document.getElementById("f4-status"));
    });

    document.getElementById("btn-f4-copy").addEventListener("click", function () {
      U.copyText(latestLine, document.getElementById("f4-status"), "dila_pasaport_v1.jsonl panoya kopyalandı.");
    });

    document.getElementById("btn-f4-verify").addEventListener("click", verifyInputLine);

    document.getElementById("btn-f4-tamper").addEventListener("click", function () {
      var inp = document.getElementById("f4-verify-input");
      if (!inp.value) return;
      try {
        var obj = JSON.parse(inp.value);
        obj.sahip = String(obj.sahip || "Dila") + "X";
        inp.value = JSON.stringify(obj);
      } catch (_e) {
        inp.value = inp.value + " ";
      }
      verifyInputLine();
    });

    document.getElementById("btn-f4-reset-verify").addEventListener("click", function () {
      document.getElementById("f4-verify-input").value = latestLine;
      verifyInputLine();
    });

    buildAndRender();
  });
})();
