register({
  baslik: 'Hilbert eğrisiyle kapı yerleşimi',
  aciklama: 'd2xy ile 1B kapı sırası 2B düzleme dizilir; ardışık kapılar yan yana kalır. Eğri adım adım çizilir; sonuç panosu için örnek.',
  mount: function (host, api) {
    var P = api.palette, n = 128, toplam = n * n, c = document.createElement('canvas'), x = c.getContext('2d'), W = 2, H = 2, ilk = 0, bekle = 0, yol = [], d;
    c.className = 'ts-tam'; host.appendChild(c);
    function rgb(h) { var v = parseInt(h.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; }
    var A = rgb(P.a), B = rgb(P.b), C = rgb(P.c);
    function renk(t) { var a = t < 0.5 ? A : B, b = t < 0.5 ? B : C, u = (t % 0.5) * 2; return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * u); }).join(',') + ')'; }
    function rot(s, p, rx, ry) { if (ry === 0) { if (rx === 1) { p[0] = s - 1 - p[0]; p[1] = s - 1 - p[1]; } var t = p[0]; p[0] = p[1]; p[1] = t; } }
    function d2xy(nn, dd) { var p = [0, 0], t = dd, s, rx, ry; for (s = 1; s < nn; s *= 2) { rx = 1 & Math.floor(t / 2); ry = 1 & (t ^ rx); rot(s, p, rx, ry); p[0] += s * rx; p[1] += s * ry; t = Math.floor(t / 4); } return p; }
    for (d = 0; d < toplam; d++) yol.push(d2xy(n, d));
    function fit() { W = c.width = Math.max(2, Math.floor(api.width * api.dpr)); H = c.height = Math.max(2, Math.floor(api.height * api.dpr)); ilk = 0; x.fillStyle = P.bg; x.fillRect(0, 0, W, H); }
    fit(); api.onResize(fit);
    function ciz(hedef) {
      var S = Math.min(W, H - 24 * api.dpr) * 0.94 / n, ox = (W - S * n) / 2, oy = 6 * api.dpr;
      x.lineWidth = Math.max(1, S * 0.9); x.lineCap = 'round';
      for (; ilk < hedef && ilk < toplam - 1; ilk++) {
        x.strokeStyle = renk(ilk / toplam); x.beginPath();
        x.moveTo(ox + (yol[ilk][0] + 0.5) * S, oy + (yol[ilk][1] + 0.5) * S); x.lineTo(ox + (yol[ilk + 1][0] + 0.5) * S, oy + (yol[ilk + 1][1] + 0.5) * S); x.stroke();
      }
      x.fillStyle = P.bg; x.fillRect(0, H - 22 * api.dpr, W, 22 * api.dpr);
      x.fillStyle = P.fg; x.font = '600 ' + (11 * api.dpr) + 'px system-ui';
      x.fillText('ÖRNEK · sıra ' + ilk + ' → (' + yol[ilk][0] + ', ' + yol[ilk][1] + ') · ' + toplam + ' hücre', 10 * api.dpr, H - 7 * api.dpr);
    }
    if (api.reducedMotion) { ciz(toplam); return function () {}; }
    var dur = api.raf(function () {
      if (ilk >= toplam - 1) { if (++bekle > 80) { bekle = 0; fit(); } return; }
      ciz(ilk + 300);
    });
    return function () { dur(); };
  }
});
