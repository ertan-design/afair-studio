(function () {
  "use strict";

  var DATA = window.PRIZMA_DATA;
  var U = window.PRIZMA_UTILS;
  var SVG_NS = "http://www.w3.org/2000/svg";

  var state = {
    arketip: "derin_zeytin",
    kontrast: 72,
    isik: 88,
    sha16: "0000000000000000"
  };

  function setupTabs() {
    var btns = document.querySelectorAll(".tab-btn");
    var panels = {
      renk: document.getElementById("panel-renk"),
      epist: document.getElementById("panel-epist"),
      prompt: document.getElementById("panel-prompt")
    };
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          var target = btn.getAttribute("data-tab");
          for (var j = 0; j < btns.length; j++) {
            btns[j].classList.toggle("is-active", btns[j] === btn);
          }
          for (var k in panels) {
            if (panels[k]) panels[k].classList.toggle("is-hidden", k !== target);
          }
        });
      })(btns[i]);
    }
  }

  function drawPaletteCanvas(arch) {
    var cv = document.getElementById("f1-palet-canvas");
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    var w = cv.width;
    var h = cv.height;

    ctx.fillStyle = "#0e1118";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#e06363";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("VETO (YASAK SİYAH)", 16, 22);

    ctx.fillStyle = "#000000";
    ctx.fillRect(16, 30, 118, 48);
    ctx.strokeStyle = "#e06363";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 30, 118, 48);
    ctx.beginPath();
    ctx.moveTo(16, 30);
    ctx.lineTo(134, 78);
    ctx.stroke();

    ctx.fillStyle = "#f3efe6";
    ctx.font = "11px monospace";
    ctx.fillText("#000000 VETO", 22, 58);

    ctx.fillStyle = "#46c48a";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("YENİ SİYAHIN (" + arch.yeni_siyah.ad.toUpperCase() + ")", 154, 22);

    ctx.fillStyle = arch.yeni_siyah.hex;
    ctx.fillRect(154, 30, 390, 48);
    ctx.strokeStyle = "#d4b06a";
    ctx.lineWidth = 2;
    ctx.strokeRect(154, 30, 390, 48);
    ctx.fillStyle = "#f3efe6";
    ctx.font = "bold 13px monospace";
    ctx.fillText(arch.yeni_siyah.ad + "  " + arch.yeni_siyah.hex, 168, 59);

    ctx.fillStyle = "#d4b06a";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("ONAYLI 5 ALTIN PALET", 16, 102);

    var swW = 100;
    for (var i = 0; i < arch.altin_palet.length; i++) {
      var x = 16 + i * 107;
      var c = arch.altin_palet[i];
      ctx.fillStyle = c.hex;
      ctx.fillRect(x, 110, swW, 34);
      ctx.strokeStyle = "#3a4154";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, 110, swW, 34);
      ctx.fillStyle = "#d6dceb";
      ctx.font = "10px monospace";
      ctx.fillText(c.hex, x + 4, 158);
    }
  }

  function drawGallerySvg(arch) {
    var box = document.getElementById("f1-svg-galeri");
    if (!box) return;
    U.clearEl(box);

    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 560 220");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", arch.galeri_tarzi);

    var bg = document.createElementNS(SVG_NS, "rect");
    bg.setAttribute("x", "0");
    bg.setAttribute("y", "0");
    bg.setAttribute("width", "560");
    bg.setAttribute("height", "220");
    bg.setAttribute("fill", arch.yeni_siyah.hex);
    svg.appendChild(bg);

    for (var i = 0; i < arch.altin_palet.length; i++) {
      var circ = document.createElementNS(SVG_NS, "circle");
      circ.setAttribute("cx", String(95 + i * 92));
      circ.setAttribute("cy", String(105 + ((i % 2) ? -22 : 20)));
      circ.setAttribute("r", String(48 + (state.kontrast % 18)));
      circ.setAttribute("fill", arch.altin_palet[i].hex);
      circ.setAttribute("fill-opacity", "0.78");
      svg.appendChild(circ);
    }

    var frame = document.createElementNS(SVG_NS, "rect");
    frame.setAttribute("x", "18");
    frame.setAttribute("y", "16");
    frame.setAttribute("width", "524");
    frame.setAttribute("height", "188");
    frame.setAttribute("fill", "none");
    frame.setAttribute("stroke", "#d4b06a");
    frame.setAttribute("stroke-width", "2");
    svg.appendChild(frame);

    var txt = document.createElementNS(SVG_NS, "text");
    txt.setAttribute("x", "32");
    txt.setAttribute("y", "190");
    txt.setAttribute("fill", "#f3efe6");
    txt.setAttribute("font-size", "13");
    txt.setAttribute("font-family", "Georgia, serif");
    txt.textContent = "AFAIR STUDIO AI ÖNİZLEME · " + arch.galeri_tarzi;
    svg.appendChild(txt);

    box.appendChild(svg);
  }

  function renderConcepts(arch) {
    var grid = document.getElementById("f1-konsept-grid");
    if (!grid) return;
    U.clearEl(grid);
    for (var i = 0; i < DATA.CONCEPTS.length; i++) {
      var c = DATA.CONCEPTS[i];
      var card = U.el("article", "concept-card");
      card.appendChild(U.el("strong", "", c.id + " (" + c.rol + ") · " + c.hedef));
      card.appendChild(U.el("p", "", c.ad));
      var extra = "";
      if (c.id === "K1" || c.id === "K3") extra = "Aktif Yeni Siyah: " + arch.yeni_siyah.ad + " (" + arch.yeni_siyah.hex + ")";
      else if (c.id === "K2") extra = "Kürasyon: " + arch.galeri_tarzi;
      else if (c.id === "K4" || c.id === "K6") extra = "Kumaş: " + arch.kumas_oneri;
      else if (c.id === "K7") extra = "Akustik: " + arch.akustik_mod;
      else extra = c.sicrama;
      card.appendChild(U.el("p", "status-note", extra));
      grid.appendChild(card);
    }
  }

  function buildRecord(arch) {
    return {
      k: "dila_dna_v1",
      dna_id: "DILA-" + arch.id.toUpperCase() + "-" + state.sha16.slice(0, 6).toUpperCase(),
      arketip_id: arch.id,
      arketip_ad: arch.ad,
      alt_ton: arch.alt_ton,
      kontrast_yuzde: state.kontrast,
      isik_guven_yuzde: state.isik,
      isik_karari: state.isik < 55 ? "EMIN_DEGILIM_PENCERE_ISIGI_GEREKLI" : "GUVENILIR_TESHIS",
      yasak_siyah: "#000000",
      yeni_siyah: arch.yeni_siyah.ad,
      yeni_siyah_hex: arch.yeni_siyah.hex,
      altin_palet: arch.altin_palet.map(function (x) { return x.hex; }),
      galeri_oda_id: arch.oda_id,
      galeri_tarzi: arch.galeri_tarzi,
      kumas_oneri: arch.kumas_oneri,
      akustik_mod: arch.akustik_mod,
      sha16: state.sha16
    };
  }

  function renderAll(saveNow) {
    var arch = DATA.ARCHETYPES[state.arketip] || DATA.ARCHETYPES.derin_zeytin;
    document.getElementById("f1-arketip-lbl").textContent = arch.ad;
    document.getElementById("f1-kontrast-lbl").textContent = (state.kontrast >= 70 ? "Yüksek" : state.kontrast >= 45 ? "Orta" : "Yumuşak") + " (%" + state.kontrast + ")";
    document.getElementById("f1-isik-lbl").textContent = "%" + state.isik + (state.isik < 55 ? " · Düşük / Belirsiz Işık" : " · Pencere Gün Işığı");

    var uyari = document.getElementById("f1-isik-uyari");
    if (state.isik < 55) {
      uyari.className = "alert alert-err";
      uyari.textContent = "Dürüst Dila Uyarısı (Belirsizlik Estetiği): Ortam ışığı zayıf (%" + state.isik + "). Emin değilim — pencere kenarında 10 saniye daha bakalım; yanlış renk hükmü vermiyorum.";
    } else {
      uyari.className = "alert alert-ok";
      uyari.textContent = "Işık güveni %" + state.isik + " — " + arch.ad + " teşhisi ve Yeni Siyah (" + arch.yeni_siyah.ad + ") mühürlenmeye hazır.";
    }

    document.getElementById("f1-veto-aciklama").textContent = "VETO BİLİMİ: " + arch.neden_siyah_yasak;

    drawPaletteCanvas(arch);
    drawGallerySvg(arch);
    renderConcepts(arch);

    var seed = [arch.id, state.kontrast, state.isik, arch.yeni_siyah.hex].join("|");
    U.sha16Async(seed, function (hex) {
      state.sha16 = hex;
      var rec = buildRecord(arch);
      var line = JSON.stringify(rec);
      document.getElementById("f1-jsonl-out").textContent = line;
      if (saveNow) {
        U.writeStore("prizma_dila_dna_v1", rec);
        document.getElementById("f1-status").textContent = "Mühürlendi (#" + hex + ") — Front 2 ve Front 3 otomatik senkronlandı.";
      }
    });
  }

  function renderPromptsAndQuestions() {
    var grid = document.getElementById("f1-prompts-grid");
    var qList = document.getElementById("f1-questions-list");
    var pStatus = document.getElementById("f1-prompt-status");
    if (grid) {
      U.clearEl(grid);
      for (var i = 0; i < DATA.PROMPTS.length; i++) {
        (function (p) {
          var card = U.el("article", "prompt-card");
          var head = U.el("div", "prompt-head");
          head.appendChild(U.el("strong", "", p.id + " · " + p.baslik));
          var cp = U.el("button", "btn", "Kopyala");
          cp.type = "button";
          cp.addEventListener("click", function () {
            U.copyText(p.metin, pStatus, p.id + " promptu panoya kopyalandı.");
          });
          head.appendChild(cp);
          card.appendChild(head);
          card.appendChild(U.el("pre", "mono-box", p.metin));
          grid.appendChild(card);
        })(DATA.PROMPTS[i]);
      }
    }
    if (qList) {
      U.clearEl(qList);
      for (var j = 0; j < DATA.CREATIVE_QUESTIONS.length; j++) {
        qList.appendChild(U.el("li", "", DATA.CREATIVE_QUESTIONS[j]));
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupTabs();
    renderPromptsAndQuestions();

    var saved = U.readStore("prizma_dila_dna_v1");
    if (saved && DATA.ARCHETYPES[saved.arketip_id]) {
      state.arketip = saved.arketip_id;
      state.kontrast = saved.kontrast_yuzde || 72;
      state.isik = saved.isik_guven_yuzde || 88;
      document.getElementById("f1-arketip").value = state.arketip;
      document.getElementById("f1-kontrast").value = String(state.kontrast);
      document.getElementById("f1-isik").value = String(state.isik);
    }

    document.getElementById("f1-arketip").addEventListener("change", function (e) {
      state.arketip = e.target.value;
      renderAll(true);
    });
    document.getElementById("f1-kontrast").addEventListener("input", function (e) {
      state.kontrast = Number(e.target.value);
      renderAll(false);
    });
    document.getElementById("f1-isik").addEventListener("input", function (e) {
      state.isik = Number(e.target.value);
      renderAll(false);
    });
    document.getElementById("btn-f1-kaydet").addEventListener("click", function () {
      renderAll(true);
    });
    document.getElementById("btn-f1-gitar").addEventListener("click", function () {
      var arch = DATA.ARCHETYPES[state.arketip] || DATA.ARCHETYPES.derin_zeytin;
      var ok = U.playChord(arch.akor_hz);
      document.getElementById("f1-status").textContent = ok
        ? "K7 Akustik çalındı: " + arch.akustik_mod
        : "Tarayıcı ses motoru başlatılamadı.";
    });
    document.getElementById("btn-f1-indir").addEventListener("click", function () {
      var txt = document.getElementById("f1-jsonl-out").textContent || "";
      U.downloadText("dila_dna_v1.jsonl", txt + "\n", document.getElementById("f1-status"));
    });
    document.getElementById("btn-copy-all-prompts").addEventListener("click", function () {
      var all = DATA.PROMPTS.map(function (p) { return "[" + p.id + " — " + p.baslik + "]\n" + p.metin; }).join("\n\n");
      U.copyText(all, document.getElementById("f1-prompt-status"), "8 paralel GPT promptunun tamamı kopyalandı.");
    });

    renderAll(true);
  });
})();
