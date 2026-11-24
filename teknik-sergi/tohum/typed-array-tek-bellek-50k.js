register({
  baslik: '50.000 kapı tek bellek bloğunda',
  aciklama: 'Uint8Array durum dizisi ve tek putImageData: 250×200 kapının kabul dalgası. Veri örnektir; sayaçlar gerçek kayıt değildir.',
  mount: function (host, api) {
    var W0 = 250, H0 = 200, N = 50000, durum = new Uint8Array(N), esik = new Float32Array(N), P = api.palette, r = api.rng(5), i;
    var c = document.createElement('canvas'), x = c.getContext('2d'), kc = document.createElement('canvas');
    kc.width = W0; kc.height = H0;
    var kx = kc.getContext('2d'), img = kx.createImageData(W0, H0), buf = new Uint32Array(img.data.buffer);
    function u32(h) { var n = parseInt(h.slice(1), 16); return ((255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | (n >> 16)) >>> 0; }
    var bg = u32(P.bg), A = u32(P.a), B = u32(P.b), C = u32(P.c);
    for (i = 0; i < N; i++) esik[i] = r();
    c.className = 'ts-tam'; host.appendChild(c);
    function fit() { c.width = Math.max(2, Math.floor(api.width * api.dpr)); c.height = Math.max(2, Math.floor(api.height * api.dpr)); x.imageSmoothingEnabled = false; }
    fit(); api.onResize(fit);
    function ciz(ilerleme) {
      var on = ilerleme * (N + 4000), kabul = 0, kirada = 0, s;
      for (var k = 0; k < N; k++) {
        var d = on - k;
        if (d < 0) s = 0; else if (d < 2500 * esik[k] + 300) s = 1; else s = 2;
        durum[k] = s;
        if (s === 2) kabul++; else if (s === 1) kirada++;
        buf[k] = s === 0 ? bg : s === 1 ? C : (esik[k] < 0.85 ? A : B);
      }
      kx.putImageData(img, 0, 0);
      x.fillStyle = P.bg; x.fillRect(0, 0, c.width, c.height);
      var olcek = Math.min(c.width / W0, (c.height - 30 * api.dpr) / H0), w = W0 * olcek, h = H0 * olcek, ox = (c.width - w) / 2, oy = 6 * api.dpr;
      x.drawImage(kc, ox, oy, w, h);
      x.fillStyle = P.fg; x.font = '600 ' + (11 * api.dpr) + 'px system-ui';
      x.fillText('ÖRNEK · kabul ' + kabul + ' · kirada ' + kirada + ' · boş ' + (N - kabul - kirada), ox, oy + h + 17 * api.dpr);
    }
    if (api.reducedMotion) { ciz(1); return function () {}; }
    var dur = api.raf(function () { ciz(Math.min(1, (api.time() % 8000) / 6000)); });
    return function () { dur(); };
  }
});
