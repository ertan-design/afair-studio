(function(){
  'use strict';
  var V = window.KAPI_444K_VERI;
  if (!V) return;
  var L = V.katman, H = L.HALKA, W = 667;
  function bilgi(no) {
    if (no < 1 || no > V.toplam) return null;
    if (no <= L.KULLANIM) return { katman: 'KULLANIM', halka: (no - 1) % H + 1 };
    var n = no - L.KULLANIM;
    var katlar = [['HAZIR', L.HAZIR], ['SERGI', L.SERGI], ['BEKLEME', L.BEKLEME]];
    for (var k = 0; k < katlar.length; k++) {
      var ad = katlar[k][0], boy = katlar[k][1];
      if (n <= H * boy) return { katman: ad, halka: Math.floor((n - 1) / boy) + 1 };
      n -= H * boy;
    }
    return null;
  }
  var acik = new Map((V.acik || []).map(function (a) { return [a.no, a]; }));
  var t = document.getElementById('t'), x = t.getContext('2d'), im = x.createImageData(W, W);
  var R = { KULLANIM: [255, 107, 157], HAZIR: [223, 186, 130], SERGI: [88, 180, 255], BEKLEME: [36, 53, 92] }, AC = [94, 242, 214];
  var i = 0;
  for (var no = 1; no <= W * W; no++, i += 4) {
    var b = bilgi(no);
    var c = b ? (acik.has(no) ? AC : R[b.katman]) : [16, 25, 46];
    im.data[i] = c[0]; im.data[i + 1] = c[1]; im.data[i + 2] = c[2]; im.data[i + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  var tl = function (n) { return Number(n).toLocaleString('tr-TR'); }, iz = document.getElementById('iz');
  [[tl(V.toplam), 'toplam sanal kapı'], [tl(V.acik.length), 'denetlenen kapı'], [tl(V.olay || 0), 'defter olayı'], [tl(Math.round((V.db_bayt || 0) / 1024)) + ' KB', 'veritabanı boyutu']].forEach(function (pair) {
    var d = document.createElement('div'); d.className = 'kart';
    d.innerHTML = '<div class="say">' + pair[0] + '</div><div class="k">' + pair[1] + '</div>';
    iz.appendChild(d);
  });
  var kart = document.getElementById('kart');
  function goster(no) {
    var b = bilgi(no); kart.innerHTML = '';
    var h = document.createElement('b'); h.textContent = b ? ('Kapı #' + tl(no)) : 'Kapı aralığı dışında'; kart.appendChild(h);
    if (!b) return;
    var p = document.createElement('div'); p.className = 'k'; p.textContent = b.katman + ' · Halka ' + b.halka + ' · Tavan ' + V.boyut_kb[b.katman] + ' KB'; kart.appendChild(p);
    var a = acik.get(no), q = document.createElement('div');
    if (a) q.textContent = a.durum + ' · ' + a.gpt + ' → ' + (a.hedef || '?') + ' · ' + a.gecen + '/8 bakış';
    else { q.className = 'k'; q.textContent = 'Kapalı sanal kapı (diskte 0 bayt).'; }
    kart.appendChild(q);
  }
  function noAl(e) {
    var r = t.getBoundingClientRect();
    return Math.floor((e.clientY - r.top) * W / r.height) * W + Math.floor((e.clientX - r.left) * W / r.width) + 1;
  }
  t.addEventListener('pointermove', function (e) { goster(noAl(e)); });
  t.addEventListener('click', function (e) { goster(noAl(e)); });
  var lst = document.getElementById('liste');
  (V.acik || []).forEach(function (a) {
    var tr = document.createElement('tr');
    [a.no, a.gpt, a.hedef, (a.gecen || '?') + '/8', a.hakem || '—'].forEach(function (val, j) {
      var td = document.createElement('td'); if (j === 3) td.className = 's'; td.textContent = String(val); tr.appendChild(td);
    });
    lst.appendChild(tr);
  });
  document.getElementById('alt').textContent = 'Son ölçüm UTC: ' + (V.utc || '');
  goster(1);
})();
