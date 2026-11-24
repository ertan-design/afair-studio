(function () {
  "use strict";

  var DATA = window.PRIZMA_DATA;
  var U = window.PRIZMA_UTILS;

  var activeFilter = "ALL";
  var searchText = "";

  function renderKpis() {
    var box = document.getElementById("filo-kpis");
    if (!box) return;
    U.clearEl(box);

    var live = 0, s5xx = 0, down = 0, exact = 0;
    for (var i = 0; i < DATA.FLEET_44.length; i++) {
      var r = DATA.FLEET_44[i];
      if (r.st === 200) live++;
      else if (r.st === 503 || r.st === 530) s5xx++;
      else down++;
      if (r.p === "EXACT_MATCH") exact++;
    }

    var cards = [
      ["Toplam Tekil Alan Adı", String(DATA.FLEET_44.length), "WWW eşleri tekilleştirilmiş gerçek liste"],
      ["Canlı HTTP 200", live + " / 44", "Doğrudan read-back SHA-16 doğrulanmış"],
      ["503 / 530 Kapalı", s5xx + " / 44", "Tünel / bakım veya DNS yanıtlı kapalı uçlar"],
      ["Ulaşılamadı (0)", down + " / 44", "DNS / bağlantı zaman aşımı (EXACT: " + exact + ")"]
    ];

    for (var j = 0; j < cards.length; j++) {
      var art = U.el("article", "card");
      art.appendChild(U.el("div", "kpi-label", cards[j][0]));
      art.appendChild(U.el("div", "kpi-val", cards[j][1]));
      art.appendChild(U.el("p", "lead", cards[j][2]));
      box.appendChild(art);
    }
  }

  function renderFilters() {
    var row = document.getElementById("filo-filter-btns");
    if (!row) return;
    U.clearEl(row);
    var opts = [
      ["ALL", "Tümü (44)"],
      ["LIVE", "HTTP 200 (19)"],
      ["5XX", "503/530 (13)"],
      ["DOWN", "Ulaşılamadı (12)"],
      ["EXACT", "Birebir Eşleşen"]
    ];
    for (var i = 0; i < opts.length; i++) {
      (function (k, label) {
        var b = U.el("button", "btn" + (activeFilter === k ? " btn-gold" : ""), label);
        b.type = "button";
        b.addEventListener("click", function () {
          activeFilter = k;
          renderFilters();
          renderTable();
        });
        row.appendChild(b);
      })(opts[i][0], opts[i][1]);
    }
  }

  function renderTable() {
    var tb = document.getElementById("filo-tbody");
    var lbl = document.getElementById("filo-count-lbl");
    if (!tb) return;
    U.clearEl(tb);

    var q = searchText.trim().toLowerCase();
    var shown = 0;
    for (var i = 0; i < DATA.FLEET_44.length; i++) {
      var r = DATA.FLEET_44[i];
      if (activeFilter === "LIVE" && r.st !== 200) continue;
      if (activeFilter === "5XX" && r.st !== 503 && r.st !== 530) continue;
      if (activeFilter === "DOWN" && r.st !== 0) continue;
      if (activeFilter === "EXACT" && r.p !== "EXACT_MATCH") continue;
      if (q && r.d.toLowerCase().indexOf(q) === -1 && r.p.toLowerCase().indexOf(q) === -1) continue;

      shown++;
      var tr = document.createElement("tr");
      tr.appendChild(U.el("td", "", String(shown)));

      var tdDom = document.createElement("td");
      var a = U.el("a", "", r.d);
      a.href = "https://" + r.d + "/";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      tdDom.appendChild(a);
      tr.appendChild(tdDom);

      var tdSt = document.createElement("td");
      var cls = r.st === 200 ? "tag tag-ok" : (r.st === 503 || r.st === 530) ? "tag tag-warn" : "tag tag-err";
      tdSt.appendChild(U.el("span", cls, r.st === 0 ? "ERR" : String(r.st)));
      tr.appendChild(tdSt);

      tr.appendChild(U.el("td", "", r.ms + " ms"));
      tr.appendChild(U.el("td", "", r.b.toLocaleString("tr-TR") + " B"));

      var tdSha = document.createElement("td");
      tdSha.appendChild(U.el("code", "", r.sha16));
      tr.appendChild(tdSha);

      tr.appendChild(U.el("td", "", r.p));
      tb.appendChild(tr);
    }
    if (lbl) lbl.textContent = shown + " / " + DATA.FLEET_44.length + " kayıt";
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderKpis();
    renderFilters();
    renderTable();
    var inp = document.getElementById("filo-search");
    if (inp) {
      inp.addEventListener("input", function (e) {
        searchText = e.target.value;
        renderTable();
      });
    }
  });
})();
