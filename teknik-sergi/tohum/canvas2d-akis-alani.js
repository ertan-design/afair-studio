register({
  baslik: 'Akış alanı şeritleri',
  aciklama: 'Sinüs bileşiminden türeyen akış alanında (flow field) yürüyen, iz bırakan çizgiler.',
  mount: function (host, api) {
    var c = document.createElement('canvas'), x = c.getContext('2d'), P = api.palette, r = api.rng(11), W = 2, H = 2, ps = [], N = 620;
    c.className = 'ts-tam'; host.appendChild(c);
    function fit() { W = c.width = Math.max(2, Math.floor(api.width * api.dpr)); H = c.height = Math.max(2, Math.floor(api.height * api.dpr)); x.fillStyle = P.bg; x.fillRect(0, 0, W, H); }
    fit(); api.onResize(fit);
    for (var i = 0; i < N; i++) ps.push({ x: r() * 480, y: r() * 300, k: i % 3 });
    var renk = [P.a, P.b, P.fg];
    function akis(px, py, t) { return (Math.sin(px * 0.011 + t) * Math.cos(py * 0.013 - t * 0.7) + Math.sin((px + py) * 0.006 + t * 0.4)) * Math.PI; }
    function kare() {
      var t = api.reducedMotion ? 1.3 : api.time() / 4000;
      x.globalAlpha = 0.04; x.fillStyle = P.bg; x.fillRect(0, 0, W, H); x.globalAlpha = 0.85; x.lineWidth = 1.2 * api.dpr;
      for (var i = 0; i < N; i++) {
        var p = ps[i], a = akis(p.x / api.dpr, p.y / api.dpr, t), nx = p.x + Math.cos(a) * 1.6 * api.dpr, ny = p.y + Math.sin(a) * 1.6 * api.dpr;
        x.strokeStyle = renk[p.k]; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(nx, ny); x.stroke(); p.x = nx; p.y = ny;
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H || r() < 0.004) { p.x = r() * W; p.y = r() * H; }
      }
      x.globalAlpha = 1;
    }
    if (api.reducedMotion) { for (var s = 0; s < 320; s++) kare(); return function () {}; }
    var dur = api.raf(kare);
    return function () { dur(); };
  }
});
