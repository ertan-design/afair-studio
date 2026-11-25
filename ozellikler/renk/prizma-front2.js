(function () {
  "use strict";

  var DATA = window.PRIZMA_DATA;
  var U = window.PRIZMA_UTILS;
  var SVG_NS = "http://www.w3.org/2000/svg";

  function getActiveArch() {
    var dna = U.readStore("prizma_dila_dna_v1");
    if (dna && DATA.ARCHETYPES[dna.arketip_id]) return { arch: DATA.ARCHETYPES[dna.arketip_id], dna: dna };
    return { arch: DATA.ARCHETYPES.derin_zeytin, dna: null };
  }

  function readInputs() {
    return {
      omuz: Number(document.getElementById("m-omuz").value),
      gogus: Number(document.getElementById("m-gogus").value),
      bel: Number(document.getElementById("m-bel").value),
      basen: Number(document.getElementById("m-basen").value),
      kol: Number(document.getElementById("m-kol").value),
      hareket_payi: Number(document.getElementById("m-pay").value),
      siluet: document.getElementById("m-siluet").value,
      kumas: document.getElementById("m-kumas").value,
      rituel: document.getElementById("m-rituel").value,
      sehir: document.getElementById("m-sehir").value
    };
  }

  function drawBlueprint(m, arch) {
    var box = document.getElementById("f2-svg-blueprint");
    if (!box) return;
    U.clearEl(box);

    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 460 360");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "İki mezura dikim kalıbı");

    var bg = document.createElementNS(SVG_NS, "rect");
    bg.setAttribute("x", "0");
    bg.setAttribute("y", "0");
    bg.setAttribute("width", "460");
    bg.setAttribute("height", "360");
    bg.setAttribute("fill", "#0d1017");
    svg.appendChild(bg);

    for (var gx = 20; gx < 460; gx += 20) {
      var gl = document.createElementNS(SVG_NS, "line");
      gl.setAttribute("x1", String(gx));
      gl.setAttribute("y1", "0");
      gl.setAttribute("x2", String(gx));
      gl.setAttribute("y2", "360");
      gl.setAttribute("stroke", "#1c2230");
      gl.setAttribute("stroke-width", "1");
      svg.appendChild(gl);
    }

    var cx = 230;
    var shW = m.omuz * 3.1;
    var chW = (m.gogus / 2.25) * 2.5;
    var waW = (m.bel / 2.25) * 2.5;
    var hiW = (m.basen / 2.25) * 2.5;
    var easePx = m.hareket_payi * 3.2;

    var outerPts = [
      (cx - shW / 2 - easePx) + ",62",
      (cx + shW / 2 + easePx) + ",62",
      (cx + chW / 2 + easePx) + ",132",
      (cx + waW / 2 + easePx) + ",205",
      (cx + hiW / 2 + easePx) + ",288",
      (cx - hiW / 2 - easePx) + ",288",
      (cx - waW / 2 - easePx) + ",205",
      (cx - chW / 2 - easePx) + ",132"
    ].join(" ");

    var easePoly = document.createElementNS(SVG_NS, "polygon");
    easePoly.setAttribute("points", outerPts);
    easePoly.setAttribute("fill", arch.yeni_siyah.hex);
    easePoly.setAttribute("fill-opacity", "0.55");
    easePoly.setAttribute("stroke", "#3fb8a8");
    easePoly.setAttribute("stroke-width", "2");
    easePoly.setAttribute("stroke-dasharray", "6 4");
    svg.appendChild(easePoly);

    var innerPts = [
      (cx - shW / 2) + ",68",
      (cx + shW / 2) + ",68",
      (cx + chW / 2) + ",134",
      (cx + waW / 2) + ",205",
      (cx + hiW / 2) + ",282",
      (cx - hiW / 2) + ",282",
      (cx - waW / 2) + ",205",
      (cx - chW / 2) + ",134"
    ].join(" ");

    var bodyPoly = document.createElementNS(SVG_NS, "polygon");
    bodyPoly.setAttribute("points", innerPts);
    bodyPoly.setAttribute("fill", arch.yeni_siyah.hex);
    bodyPoly.setAttribute("fill-opacity", "0.92");
    bodyPoly.setAttribute("stroke", "#d4b06a");
    bodyPoly.setAttribute("stroke-width", "2.2");
    svg.appendChild(bodyPoly);

    function guideLine(y, w, label, color) {
      var l = document.createElementNS(SVG_NS, "line");
      l.setAttribute("x1", String(cx - w / 2));
      l.setAttribute("y1", String(y));
      l.setAttribute("x2", String(cx + w / 2));
      l.setAttribute("y2", String(y));
      l.setAttribute("stroke", color);
      l.setAttribute("stroke-width", "1.4");
      svg.appendChild(l);

      var t = document.createElementNS(SVG_NS, "text");
      t.setAttribute("x", "18");
      t.setAttribute("y", String(y + 4));
      t.setAttribute("fill", "#d6dceb");
      t.setAttribute("font-size", "11");
      t.setAttribute("font-family", "monospace");
      t.textContent = label;
      svg.appendChild(t);
    }

    guideLine(68, shW, "Omuz: " + m.omuz.toFixed(1) + " cm", "#d4b06a");
    guideLine(134, chW, "Göğüs: " + m.gogus.toFixed(1) + " cm", "#d4b06a");
    guideLine(205, waW, "Bel: " + m.bel.toFixed(1) + " cm", "#f0d8a8");
    guideLine(282, hiW, "Basen: " + m.basen.toFixed(1) + " cm", "#d4b06a");

    var foot = document.createElementNS(SVG_NS, "text");
    foot.setAttribute("x", "18");
    foot.setAttribute("y", "336");
    foot.setAttribute("fill", "#3fb8a8");
    foot.setAttribute("font-size", "11.5");
    foot.setAttribute("font-family", "monospace");
    foot.textContent = "Mezura-B Hareket Payı: +" + m.hareket_payi.toFixed(1) + " cm · Kumaş Rengi: " + arch.yeni_siyah.ad + " (" + arch.yeni_siyah.hex + ")";
    svg.appendChild(foot);

    box.appendChild(svg);
  }

  function render(saveNow) {
    var ctx = getActiveArch();
    var arch = ctx.arch;
    var dna = ctx.dna;
    var m = readInputs();

    document.getElementById("lbl-omuz").textContent = m.omuz.toFixed(1) + " cm";
    document.getElementById("lbl-gogus").textContent = m.gogus.toFixed(1) + " cm";
    document.getElementById("lbl-bel").textContent = m.bel.toFixed(1) + " cm";
    document.getElementById("lbl-basen").textContent = m.basen.toFixed(1) + " cm";
    document.getElementById("lbl-kol").textContent = m.kol.toFixed(1) + " cm";
    document.getElementById("lbl-pay").textContent = "+" + m.hareket_payi.toFixed(1) + " cm";

    var strip = document.getElementById("f2-dna-strip");
    U.clearEl(strip);
    strip.appendChild(U.el("span", "dna-pill dna-pill-ok", "Aktif DNA: " + arch.ad + " · Yeni Siyah: " + arch.yeni_siyah.ad + " (" + arch.yeni_siyah.hex + ")"));
    strip.appendChild(U.el("span", "dna-pill dna-pill-err", "VETO: #000000 Saf Siyah Kumaş Engelli"));
    if (dna) strip.appendChild(U.el("span", "dna-pill", "Front 1 Mühür: #" + dna.sha16));

    drawBlueprint(m, arch);

    var siluetCarpan = m.siluet === "mimari_oversize" ? 1.22 : m.siluet === "heykelsi_dar" ? 0.94 : 1.06;
    var metraj = (((m.kol * 2 + m.basen * 1.15 + m.hareket_payi * 6) / 100) * siluetCarpan).toFixed(2);
    var oran = (m.omuz / (m.bel / 2)).toFixed(2);
    var drapeIndex = Math.min(99, Math.round(48 + m.hareket_payi * 5.2));

    var metrics = document.getElementById("f2-metrics");
    U.clearEl(metrics);
    var items = [
      ["Tahmini Kumaş Metrajı", metraj + " m"],
      ["Omuz / Yarım Bel Oranı", oran + "×"],
      ["Hareket Drape İndeksi", drapeIndex + " / 100"]
    ];
    for (var i = 0; i < items.length; i++) {
      var box = U.el("div", "concept-card");
      box.appendChild(U.el("p", "", items[i][0]));
      box.appendChild(U.el("strong", "", items[i][1]));
      metrics.appendChild(box);
    }

    document.getElementById("f2-terzi-not").textContent =
      "AFAIR Terzi Kararı: " + arch.yeni_siyah.ad + " (" + arch.yeni_siyah.hex + ") tonunda " +
      m.kumas.replace(/_/g, " ") + " ile " + metraj + " m kesim; ilk 90 sn ritüeli: " + m.rituel.replace(/_/g, " ") + ".";

    var seed = JSON.stringify([arch.id, m]);
    U.sha16Async(seed, function (hex) {
      var rec = {
        k: "dila_randevu_v1",
        dna_ref: dna ? dna.dna_id : "VARSAYILAN-" + arch.id.toUpperCase(),
        yeni_siyah: arch.yeni_siyah.ad,
        yeni_siyah_hex: arch.yeni_siyah.hex,
        yasak_siyah_engelli: true,
        olcu_cm: {
          omuz: m.omuz,
          gogus: m.gogus,
          bel: m.bel,
          basen: m.basen,
          kol: m.kol,
          hareket_payi: m.hareket_payi
        },
        siluet: m.siluet,
        kumas_k6: m.kumas,
        tahmini_metraj_m: Number(metraj),
        rituel_90sn: m.rituel,
        bolge: m.sehir,
        sha16: hex
      };
      document.getElementById("f2-jsonl-out").textContent = JSON.stringify(rec);
      if (saveNow) {
        U.writeStore("prizma_dila_randevu_v1", rec);
        document.getElementById("f2-status").textContent = "Ölçü pasaportu mühürlendi (#" + hex + ") — Front 3 AI Galeri senkronlandı.";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var saved = U.readStore("prizma_dila_randevu_v1");
    if (saved && saved.olcu_cm) {
      document.getElementById("m-omuz").value = String(saved.olcu_cm.omuz);
      document.getElementById("m-gogus").value = String(saved.olcu_cm.gogus);
      document.getElementById("m-bel").value = String(saved.olcu_cm.bel);
      document.getElementById("m-basen").value = String(saved.olcu_cm.basen);
      document.getElementById("m-kol").value = String(saved.olcu_cm.kol);
      document.getElementById("m-pay").value = String(saved.olcu_cm.hareket_payi);
      if (saved.siluet) document.getElementById("m-siluet").value = saved.siluet;
      if (saved.kumas_k6) document.getElementById("m-kumas").value = saved.kumas_k6;
      if (saved.rituel_90sn) document.getElementById("m-rituel").value = saved.rituel_90sn;
      if (saved.bolge) document.getElementById("m-sehir").value = saved.bolge;
    }

    var ids = ["m-omuz", "m-gogus", "m-bel", "m-basen", "m-kol", "m-pay", "m-siluet", "m-kumas", "m-rituel", "m-sehir"];
    for (var i = 0; i < ids.length; i++) {
      document.getElementById(ids[i]).addEventListener("input", function () { render(false); });
      document.getElementById(ids[i]).addEventListener("change", function () { render(true); });
    }

    document.getElementById("btn-f2-muhurle").addEventListener("click", function () { render(true); });
    document.getElementById("btn-f2-indir").addEventListener("click", function () {
      var txt = document.getElementById("f2-jsonl-out").textContent || "";
      U.downloadText("dila_randevu_v1.jsonl", txt + "\n", document.getElementById("f2-status"));
    });
    document.getElementById("btn-f2-kopyala").addEventListener("click", function () {
      var txt = document.getElementById("f2-jsonl-out").textContent || "";
      U.copyText(txt, document.getElementById("f2-status"), "dila_randevu_v1.jsonl panoya kopyalandı.");
    });

    render(true);
  });
})();
