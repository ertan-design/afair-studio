register({
  baslik: 'Verlet kumaş',
  aciklama: 'Verlet entegrasyonu ve mesafe kısıtlarıyla rüzgârda sallanan kumaş; imleç rüzgâr verir.',
  mount: function (host, api) {
    var c = document.createElement('canvas'), x = c.getContext('2d'), P = api.palette, W = 2, H = 2, cols = 28, rows = 16, pts = [], kisit = [], mx = -1e9, my = -1e9;
    c.className = 'ts-tam ts-dokun'; host.appendChild(c);
    function rgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    function mix(a, b, t) { return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }).join(',') + ')'; }
    var A = rgb(P.a), B = rgb(P.b), C = rgb(P.c);
    function kur() {
      pts.length = 0; kisit.length = 0;
      var gap = Math.min(W * 0.8 / cols, H * 0.62 / rows), ox = (W - gap * (cols - 1)) / 2, oy = H * 0.1, i, j;
      for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) { var px = ox + i * gap, py = oy + j * gap; pts.push({ x: px, y: py, ox: px, oy: py, pin: j === 0 && i % 3 === 0 }); }
      for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) { var k = j * cols + i; if (i < cols - 1) kisit.push([k, k + 1, gap]); if (j < rows - 1) kisit.push([k, k + cols, gap]); }
    }
    function fit() { W = c.width = Math.max(2, Math.floor(api.width * api.dpr)); H = c.height = Math.max(2, Math.floor(api.height * api.dpr)); kur(); }
    fit(); api.onResize(fit);
    api.on(c, 'pointermove', function (e) { var b = c.getBoundingClientRect(); mx = (e.clientX - b.left) * api.dpr; my = (e.clientY - b.top) * api.dpr; });
    api.on(c, 'pointerleave', function () { mx = -1e9; my = -1e9; });
    function adim(t) {
      var ruzgar = Math.sin(t / 900) * 0.35 + Math.sin(t / 370) * 0.15, i, k;
      for (i = 0; i < pts.length; i++) {
        var p = pts[i]; if (p.pin) continue;
        var vx = (p.x - p.ox) * 0.985, vy = (p.y - p.oy) * 0.985; p.ox = p.x; p.oy = p.y;
        p.x += vx + ruzgar * api.dpr * 0.5 * (1 + Math.floor(i / cols) * 0.04); p.y += vy + 0.32 * api.dpr;
        var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy, R = 70 * api.dpr;
        if (d2 < R * R) { var d = Math.sqrt(d2) || 1, f = (1 - d / R) * 6 * api.dpr; p.x += dx / d * f; p.y += dy / d * f; }
      }
      for (var it = 0; it < 5; it++) for (k = 0; k < kisit.length; k++) {
        var a = pts[kisit[k][0]], b = pts[kisit[k][1]], dx2 = b.x - a.x, dy2 = b.y - a.y, dist = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1, fark = (dist - kisit[k][2]) / dist * 0.5;
        if (!a.pin) { a.x += dx2 * fark; a.y += dy2 * fark; }
        if (!b.pin) { b.x -= dx2 * fark; b.y -= dy2 * fark; }
      }
    }
    function ciz() {
      x.fillStyle = P.bg; x.fillRect(0, 0, W, H);
      for (var j = 0; j < rows - 1; j++) for (var i = 0; i < cols - 1; i++) {
        var p1 = pts[j * cols + i], p2 = pts[j * cols + i + 1], p3 = pts[(j + 1) * cols + i + 1], p4 = pts[(j + 1) * cols + i];
        var gol = Math.max(0, Math.min(1, 0.5 + ((p2.x - p1.x) - (p3.y - p2.y)) / 14 / api.dpr)), t = j / rows;
        x.fillStyle = mix(t < 0.5 ? A : B, t < 0.5 ? B : C, (t % 0.5) * 2); x.globalAlpha = 0.5 + 0.45 * gol;
        x.beginPath(); x.moveTo(p1.x, p1.y); x.lineTo(p2.x, p2.y); x.lineTo(p3.x, p3.y); x.lineTo(p4.x, p4.y); x.closePath(); x.fill();
      }
      x.globalAlpha = 1; x.fillStyle = P.fg;
      for (var q = 0; q < cols; q += 3) { x.beginPath(); x.arc(pts[q].x, pts[q].y, 3 * api.dpr, 0, 6.2832); x.fill(); }
    }
    if (api.reducedMotion) { for (var s = 0; s < 240; s++) adim(s * 16); ciz(); return function () {}; }
    var dur = api.raf(function (t) { adim(api.time()); ciz(); });
    return function () { dur(); };
  }
});
