(function () {
  "use strict";

  var DATA = window.PRIZMA_DATA;
  var U = window.PRIZMA_UTILS;
  var activeLanes = 11;
  var activeSiteId = "S1";

  function renderDnaStrip() {
    var strip = document.getElementById("hub-dna-strip");
    if (!strip) return;
    U.clearEl(strip);

    var dna = U.readStore("prizma_dila_dna_v1");
    var randevu = U.readStore("prizma_dila_randevu_v1");
    var galeri = U.readStore("prizma_dila_galeri_v1");

    if (dna) {
      strip.appendChild(U.el("span", "dna-pill dna-pill-ok", "Front 1 DNA: " + dna.arketip_ad + " · Yeni Siyah: " + dna.yeni_siyah + " · #" + dna.sha16));
    } else {
      strip.appendChild(U.el("span", "dna-pill dna-pill-warn", "Front 1 DNA: Henüz seçilmedi (varsayılan: Derin Zeytin Kadife)"));
    }

    if (randevu) {
      strip.appendChild(U.el("span", "dna-pill dna-pill-ok", "Front 2 Mezura: Omuz " + randevu.olcu_cm.omuz + " / Bel " + randevu.olcu_cm.bel + " / Pay +" + randevu.olcu_cm.hareket_payi + " cm"));
    } else {
      strip.appendChild(U.el("span", "dna-pill", "Front 2 Mezura: Beklemede"));
    }

    if (galeri) {
      strip.appendChild(U.el("span", "dna-pill dna-pill-ok", "Front 3 Galeri: " + galeri.oda_ad + " · " + galeri.kelvin + "K"));
    } else {
      strip.appendChild(U.el("span", "dna-pill", "Front 3 Galeri: Beklemede"));
    }
  }

  function renderRcombo() {
    var laneRow = document.getElementById("rcombo-lane-btns");
    var grid = document.getElementById("rcombo-sites-grid");
    var sum = document.getElementById("rcombo-summary");
    if (!laneRow || !grid || !sum) return;

    U.clearEl(laneRow);
    var lanes = [1, 4, 8, 11];
    for (var i = 0; i < lanes.length; i++) {
      (function (n) {
        var b = U.el("button", "btn" + (n === activeLanes ? " btn-active" : ""), n + " Takım Şeridi");
        b.type = "button";
        b.addEventListener("click", function () {
          activeLanes = n;
          renderRcombo();
        });
        laneRow.appendChild(b);
      })(lanes[i]);
    }

    U.clearEl(grid);
    var perTeam = Math.floor(50000 / activeLanes);
    var rem = 50000 % activeLanes;
    var selectedSite = DATA.RCOMBO_SITES[0];

    for (var j = 0; j < DATA.RCOMBO_SITES.length; j++) {
      (function (s) {
        if (s.id === activeSiteId) selectedSite = s;
        var card = U.el("article", "concept-card" + (s.id === activeSiteId ? " card-gold" : ""));
        card.appendChild(U.el("strong", "", s.id + " · " + s.site));
        card.appendChild(U.el("p", "", s.rol));
        card.appendChild(U.el("p", "status-note", "Slot S" + String(s.slot_bas).padStart(5, "0") + " – S" + String(s.slot_son).padStart(5, "0") + " (12.500)"));

        var row = U.el("div", "btn-row");
        var selBtn = U.el("button", "btn" + (s.id === activeSiteId ? " btn-gold" : ""), "Seç");
        selBtn.type = "button";
        selBtn.addEventListener("click", function () {
          activeSiteId = s.id;
          renderRcombo();
        });
        var goA = U.el("a", "btn", "Canlı ↗");
        goA.href = s.canli;
        row.appendChild(selBtn);
        row.appendChild(goA);
        card.appendChild(row);
        grid.appendChild(card);
      })(DATA.RCOMBO_SITES[j]);
    }

    var sitePerTeam = Math.floor(12500 / activeLanes);
    sum.textContent = "Seçili Site: " + selectedSite.site + " (Slot " + selectedSite.slot_bas + ".." + selectedSite.slot_son +
      ") · Aktif Giriş: " + activeLanes + " takım · Takım başına " + perTeam.toLocaleString("tr-TR") +
      " toplam slot (artık: " + rem + "), bu sitede takım başına ~" + sitePerTeam.toLocaleString("tr-TR") +
      " slot · 2-bit bitmap boyutu: 12.500 B (50.000 slot) · Üst katman rezervi: 494.050 kapı.";
  }

  function wireCopy() {
    var btn = document.getElementById("btn-copy-hub-urls");
    var st = document.getElementById("hub-copy-status");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var base = window.location.origin + window.location.pathname.replace(/index\.html$/, "").replace(/\/?$/, "/");
      var lines = [
        "PRIZMA x DILA CANLI ADRESLER:",
        base,
        base + "front1.html",
        base + "front2.html",
        base + "front3.html",
        base + "filo.html",
        base + "dila_8_konsept_senkron.jsonl",
        base + "filo_canli_durum.jsonl",
        base + "manifest.json"
      ].join("\n");
      U.copyText(lines, st, "8 canlı adres panoya kopyalandı.");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderDnaStrip();
    renderRcombo();
    wireCopy();
  });
})();
