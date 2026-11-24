register({
  baslik: 'Kapı aralığından kıvılcımlar',
  aciklama: 'Canvas 2D parçacık sistemi: kapı aralığından saçılan, iz bırakan kıvılcımlar; imleç ya da dokunuş onları çeker.',
  mount: function (host, api) {
    var c = document.createElement('canvas'), x = c.getContext('2d'), P = api.palette, r = api.rng(7), W = 2, H = 2, ps = [], mx = -1, my = -1;
    c.className = 'ts-tam'; host.appendChild(c);
    function fit() { W = c.width = Math.max(2, Math.floor(api.width * api.dpr)); H = c.height = Math.max(2, Math.floor(api.height * api.dpr)); x.fillStyle = P.bg; x.fillRect(0, 0, W, H); }
    fit(); api.onResize(fit);
    function dogur(p, ilk) {
      var a = -Math.PI / 2 + (r() - 0.5) * 1.3, v = (0.8 + r() * 2.6) * api.dpr;
      p.x = W / 2 + (r() - 0.5) * W * 0.03; p.y = H * 0.9; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v * 1.5;
      p.om = ilk ? r() * 160 : 90 + r() * 90; p.k = [P.a, P.b, P.c][Math.floor(r() * 3)]; p.s = (0.8 + r() * 1.6) * api.dpr;
      return p;
    }
    for (var i = 0; i < 260; i++) ps.push(dogur({}, true));
    function kare() {
      x.globalCompositeOperation = 'source-over'; x.fillStyle = P.bg; x.globalAlpha = api.reducedMotion ? 1 : 0.14; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
      var yarik = W * 0.012 * (1 + 0.6 * Math.sin(api.time() / 700)) + 2 * api.dpr;
      x.fillStyle = P.fg; x.fillRect(W / 2 - yarik / 2, H * 0.28, yarik, H * 0.62);
      x.strokeStyle = P.c; x.lineWidth = 2 * api.dpr; x.strokeRect(W * 0.38, H * 0.28, W * 0.24, H * 0.62);
      x.globalCompositeOperation = 'lighter';
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        if (mx >= 0) { var dx = mx - p.x, dy = my - p.y, d2 = dx * dx + dy * dy + 900 * api.dpr; p.vx += dx / d2 * 40 * api.dpr; p.vy += dy / d2 * 40 * api.dpr; }
        p.vy += 0.018 * api.dpr; p.x += p.vx; p.y += p.vy; p.om--;
        x.fillStyle = p.k; x.globalAlpha = Math.max(0, Math.min(1, p.om / 60)); x.fillRect(p.x, p.y, p.s, p.s);
        if (p.om <= 0 || p.y > H || p.x < 0 || p.x > W) dogur(p, false);
      }
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    }
    if (api.reducedMotion) { for (var s = 0; s < 90; s++) kare(); return function () {}; }
    api.on(host, 'pointermove', function (e) { var b = host.getBoundingClientRect(); mx = (e.clientX - b.left) * api.dpr; my = (e.clientY - b.top) * api.dpr; });
    api.on(host, 'pointerleave', function () { mx = -1; my = -1; });
    var dur = api.raf(kare);
    return function () { dur(); };
  }
});
