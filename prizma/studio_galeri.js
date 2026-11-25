(function () {
  "use strict";

  var PROFILES = [
    { id: "sicak", ad: "Sıcak Alt-Ton · Espresso & Bakır", palette: ["#261914", "#47291f", "#7a442d", "#b56c42", "#dc9d6b", "#e8c8a2", "#354a3f", "#5e3342"] },
    { id: "soguk", ad: "Soğuk Alt-Ton · Zümrüt & Mürdüm", palette: ["#112321", "#1d423b", "#2d6a5c", "#422035", "#6e3354", "#9a5b7c", "#202e47", "#d8d1c7"] },
    { id: "notr", ad: "Nötr Alt-Ton · Taş & İpek Keten", palette: ["#1e1b18", "#3d3630", "#63584e", "#8d7f70", "#b8aa99", "#dfd4c6", "#314740", "#7d533d"] }
  ];

  var CONCEPTS = [
    ["D01 · Yasak Siyah", "Saf #000000 yerine derin pigmentli espresso ve gece zümrüdü tabanı."],
    ["D02 · İki Mezura", "Sabit beden ölçüsü + hareket payı çift eksenli terzi kalıbı."],
    ["D03 · Galeri Işığı", "3200K sıcak spot altında iplik parlaması ve gölge derinliği."],
    ["D04 · Akustik Eşlik", "Kumaşın rüzgâr frekansına uyumlu dingin oda akordu."],
    ["D05 · Mikro Dokuma", "Yakınlaştıkça ortaya çıkan 2/2 dimi ve saten çözgü-atkı."],
    ["D06 · Alt-Domain", "rufat.afair.studio gibi tasarımcıya özel bağımsız atölye kimliği."],
    ["D07 · Dijital Mühür", "Her koleksiyon kartının SHA-256 doğrulamalı pasaport kaydı."],
    ["D08 · Sıçrama Zinciri", "Bir önceki renk kararının sonraki sahneyi beslediği tutarlı akış."]
  ];

  var active = PROFILES[0];
  var canvas = document.getElementById("dna-canvas");
  var ctx = canvas.getContext("2d");

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function drawDNA() {
    var W = canvas.width, H = canvas.height;
    ctx.fillStyle = "#120d0c";
    ctx.fillRect(0, 0, W, H);
    var n = active.palette.length;
    var w = (W - 36) / n;
    for (var i = 0; i < n; i++) {
      var x = 18 + i * w;
      ctx.fillStyle = active.palette[i];
      ctx.fillRect(x + 4, 34, w - 8, H - 74);
      ctx.fillStyle = "#f2e7dd";
      ctx.font = "600 11px ui-monospace, monospace";
      ctx.fillText("D0" + (i + 1), x + 10, 24);
      ctx.fillText(active.palette[i].toUpperCase(), x + 8, H - 18);
    }
  }

  function render() {
    var bar = document.getElementById("tone-bar");
    clear(bar);
    PROFILES.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tbtn" + (p.id === active.id ? " is-on" : "");
      b.textContent = p.ad;
      b.addEventListener("click", function () { active = p; render(); });
      bar.appendChild(b);
    });
    var grid = document.getElementById("concept-grid");
    clear(grid);
    CONCEPTS.forEach(function (c, i) {
      var card = document.createElement("article");
      card.className = "ccard";
      var st = document.createElement("strong");
      st.textContent = c[0] + " · " + active.palette[i].toUpperCase();
      var p = document.createElement("p");
      p.textContent = c[1];
      card.appendChild(st);
      card.appendChild(p);
      grid.appendChild(card);
    });
    drawDNA();
  }

  render();
})();
