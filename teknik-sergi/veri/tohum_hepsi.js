window.__TOHUM_KAYIT = {};
(function(){
  var register = function(spec){ window.__TOHUM_KAYIT["canvas2d-akis-alani"] = spec; };
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

})();
(function(){
  var register = function(spec){ window.__TOHUM_KAYIT["canvas2d-parcacik"] = spec; };
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

})();
(function(){
  var register = function(spec){ window.__TOHUM_KAYIT["canvas2d-verlet-kumas"] = spec; };
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

})();
(function(){
  var register = function(spec){ window.__TOHUM_KAYIT["css-3b-donme"] = spec; };
  register({
  baslik: 'Podyum karuseli',
  aciklama: 'CSS 3B dönme: preserve-3d ile rotateY ve translateZ; silindir etrafında dönen koleksiyon panelleri. Üzerine gelince durur.',
  mount: function (host, api) {
    var P = api.palette, N = 9, R = Math.round(Math.max(110, Math.min(api.width, api.height) * 0.56)), i;
    var s = document.createElement('div'); s.className = 'ts-3b-s'; s.tabIndex = 0; s.setAttribute('aria-label', 'Dönen koleksiyon panelleri');
    var h = document.createElement('div'); h.className = api.reducedMotion ? 'ts-3b-h durgun' : 'ts-3b-h';
    for (i = 0; i < N; i++) {
      var k = [P.a, P.b, P.c][i % 3], p = document.createElement('div');
      p.className = 'ts-3b-p';
      p.style.transform = 'rotateY(' + (i * 360 / N) + 'deg) translateZ(' + R + 'px)';
      p.style.background = 'linear-gradient(160deg,' + k + ',' + P.bg + ' 78%)';
      p.innerHTML = '<b>№' + (i + 1) + '</b><span>koleksiyon</span>';
      h.appendChild(p);
    }
    s.appendChild(h); host.appendChild(s);
    return function () {};
  }
});

})();
(function(){
  var register = function(spec){ window.__TOHUM_KAYIT["css-kaydirma-zaman-cizgisi"] = spec; };
  register({
  baslik: 'Kaydırınca açılan yayın programı',
  aciklama: 'CSS kaydırma güdümlü animasyon (animation-timeline: view/scroll): satırlar görünür oldukça belirir; destek yoksa hazır görünür.',
  mount: function (host, api) {
    var ok = window.CSS && CSS.supports && CSS.supports('animation-timeline', 'scroll()') && !api.reducedMotion;
    var konu = ['Koleksiyon gösterimi', 'Tasarımcı söyleşisi', 'Sahne arkası', 'Kumaş atölyesi', 'Işık provası', 'Soru-cevap', 'Kapanış'];
    var k = document.createElement('div'); k.className = ok ? 'ts-kz-k ts-kz-anim' : 'ts-kz-k'; k.tabIndex = 0;
    k.innerHTML = '<h3>Yayın programı · örnek</h3><ul>' + konu.map(function (ad, i) {
      return '<li><i>' + (10 + i) + ':00</i><b>' + ad + '</b><em>örnek akış satırı</em></li>';
    }).join('') + '</ul>';
    host.appendChild(k);
    return function () {};
  }
});

})();
(function(){
  var register = function(spec){ window.__TOHUM_KAYIT["css-property-gradyan"] = spec; };
  register({
  baslik: 'Sponsor bandı: dönen gradyan çerçeve',
  aciklama: '@property ile tipli açı değişkeni animasyonu: conic-gradient çerçeve döner, içte durdurulabilir kayan bant akar.',
  mount: function (host, api) {
    var ad = ['AFAIR', 'KAPI', 'CANLI', 'SAHNE', 'KUMAŞ', 'IŞIK'], seri = '', i;
    for (i = 0; i < 3; i++) ad.forEach(function (a) { seri += '<span>' + a + '</span><i>✦</i>'; });
    var z = document.createElement('div'); z.className = 'ts-pg-z';
    var c = document.createElement('div'); c.className = api.reducedMotion ? 'ts-pg-c durgun' : 'ts-pg-c'; c.tabIndex = 0;
    var ic = document.createElement('div'); ic.className = 'ts-pg-ic';
    var s = document.createElement('div'); s.className = api.reducedMotion ? 'ts-pg-s durgun' : 'ts-pg-s'; s.innerHTML = seri;
    ic.appendChild(s); c.appendChild(ic); z.appendChild(c); host.appendChild(z);
    var e = document.createElement('div'); e.className = 'ts-pg-e'; e.textContent = 'ÖRNEK BAND · ÜZERİNE GELİNCE DURUR'; host.appendChild(e);
    return function () {};
  }
});

})();
(function(){
  var register = function(spec){ window.__TOHUM_KAYIT["hilbert-egri-yerlesim"] = spec; };
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

})();
(function(){
  var register = function(spec){ window.__TOHUM_KAYIT["svg-filtre-sivi-kumas"] = spec; };
  register({
  baslik: 'Sıvı kumaş filtresi',
  aciklama: 'SVG feTurbulence + feDisplacementMap: şeritli kumaş ve harfler dalgalanır; baseFrequency canlı değişir.',
  mount: function (host, api) {
    var P = api.palette, seritler = '', fid = 'sv-' + api.id, i;
    for (i = 0; i < 16; i++) seritler += '<rect x="' + (i * 30) + '" y="0" width="30" height="300" fill="' + [P.a, P.b, P.c, P.fg][i % 4] + '" opacity="' + (i % 4 === 3 ? 0.35 : 0.9) + '"/>';
    host.innerHTML = '<svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" class="ts-tam">' +
      '<defs><filter id="' + fid + '" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence class="ts-tb" type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="2" seed="3" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="42" xChannelSelector="R" yChannelSelector="G"/></filter></defs>' +
      '<rect width="480" height="300" fill="' + P.bg + '"/><g filter="url(#' + fid + ')">' + seritler +
      '<text x="240" y="178" text-anchor="middle" font-family="Georgia,serif" font-size="96" font-weight="700" fill="' + P.bg + '" stroke="' + P.fg + '" stroke-width="2">AFAIR</text></g></svg>';
    var tb = host.querySelector('.ts-tb');
    if (api.reducedMotion) return function () {};
    var dur = api.raf(function () {
      var t = api.time() / 1000;
      tb.setAttribute('baseFrequency', (0.008 + 0.004 * Math.sin(t * 0.6)).toFixed(4) + ' ' + (0.02 + 0.01 * Math.cos(t * 0.45)).toFixed(4));
    });
    return function () { dur(); };
  }
});

})();
(function(){
  var register = function(spec){ window.__TOHUM_KAYIT["typed-array-tek-bellek-50k"] = spec; };
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

})();
(function(){
  var register = function(spec){ window.__TOHUM_KAYIT["waapi-yay-fizigi"] = spec; };
  register({
  baslik: 'Yaylanan sonuç panosu',
  aciklama: 'Web Animations API ve CSS linear() yay eğrisi: kabul kutuları kademeli yaylanarak belirir; dokununca yeniden oynar.',
  mount: function (host, api) {
    var P = api.palette, i;
    var g = document.createElement('div'); g.className = 'ts-wy-g'; g.tabIndex = 0; g.setAttribute('aria-label', 'Yay animasyonu; dokununca yeniden oynar');
    var el = [];
    for (i = 0; i < 40; i++) {
      var d = document.createElement('div'); d.className = 'ts-wy-t'; d.style.background = [P.a, P.b, P.c][i % 3];
      g.appendChild(d); el.push(d);
    }
    var alt = document.createElement('div'); alt.className = 'ts-wy-e';
    var sy = document.createElement('span'); sy.textContent = '0 / 40';
    alt.innerHTML = '<span>KABUL · ÖRNEK</span>'; alt.appendChild(sy);
    host.appendChild(g); host.appendChild(alt);
    var son = -1e9, yay = 'linear(0, 0.2 6%, 0.7 14%, 1.12 24%, 1.16 30%, 1.05 40%, 0.98 52%, 1.01 70%, 1)';
    function oynat() {
      son = api.time();
      for (var k = 0; k < el.length; k++) {
        el[k].animate([{ transform: 'translateY(46px) scale(.15)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 1100, delay: ((k % 8) + Math.floor(k / 8)) * 55, easing: yay, fill: 'both' });
      }
    }
    api.on(host, 'pointerdown', oynat);
    api.on(g, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); oynat(); } });
    if (api.reducedMotion) { sy.textContent = '40 / 40'; return function () {}; }
    oynat();
    var dur = api.raf(function () {
      var gec = api.time() - son;
      sy.textContent = Math.min(40, Math.max(0, Math.floor(gec / 40))) + ' / 40';
      if (gec > 4200) oynat();
    });
    return function () { dur(); };
  }
});

})();
(function(){
  var register = function(spec){ window.__TOHUM_KAYIT["webaudio-spektrum"] = spec; };
  register({
  baslik: 'Sahne sesi spektrumu',
  aciklama: 'WebAudio AnalyserNode ile frekans çubukları. Ses yalnız düğmeye basınca başlar ve kısıktır; başlamadan önce görüntü örnek veridir.',
  mount: function (host, api) {
    var P = api.palette, c = document.createElement('canvas'), x = c.getContext('2d'), W = 2, H = 2, ctx = null, an = null, veri = new Uint8Array(64), dugme = document.createElement('button');
    c.className = 'ts-tam'; host.appendChild(c);
    dugme.textContent = 'Sesi başlat (kısık)';
    dugme.className = 'ts-ses-dugme';
    host.appendChild(dugme);
    function fit() { W = c.width = Math.max(2, Math.floor(api.width * api.dpr)); H = c.height = Math.max(2, Math.floor(api.height * api.dpr)); }
    fit(); api.onResize(fit);
    function baslat() {
      if (ctx) { ctx.close(); ctx = null; an = null; dugme.textContent = 'Sesi başlat (kısık)'; return; }
      try {
        var AC = window.AudioContext || window.webkitAudioContext; ctx = new AC();
        var g = ctx.createGain(); g.gain.value = 0.03; an = ctx.createAnalyser(); an.fftSize = 128;
        var o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain();
        o1.type = 'sawtooth'; o1.frequency.value = 110; o2.type = 'triangle'; o2.frequency.value = 165; lfo.frequency.value = 0.35; lg.gain.value = 40;
        lfo.connect(lg); lg.connect(o1.frequency); o1.connect(an); o2.connect(an); an.connect(g); g.connect(ctx.destination);
        o1.start(); o2.start(); lfo.start(); dugme.textContent = 'Sesi durdur';
      } catch (e) { ctx = null; an = null; }
    }
    api.on(dugme, 'click', baslat);
    function ciz() {
      var t = api.time() / 1000, n = 32, bw = W / n;
      x.fillStyle = P.bg; x.fillRect(0, 0, W, H);
      if (an) an.getByteFrequencyData(veri);
      for (var i = 0; i < n; i++) {
        var v = an ? veri[i] / 255 : 0.45 + 0.4 * Math.sin(t * 1.7 + i * 0.5) * Math.sin(t * 0.6 + i * 0.13), h = Math.max(2, v * H * 0.72);
        x.fillStyle = i < n / 2 ? P.a : P.b; x.globalAlpha = 0.5 + v * 0.5; x.fillRect(i * bw + bw * 0.12, H * 0.84 - h, bw * 0.76, h);
      }
      x.globalAlpha = 1; x.fillStyle = P.fg; x.font = '600 ' + (12 * api.dpr) + 'px system-ui'; x.fillText(an ? 'CANLI SPEKTRUM' : 'ÖRNEK VERİ', 14 * api.dpr, 22 * api.dpr);
    }
    if (api.reducedMotion) { ciz(); return function () { if (ctx) ctx.close(); }; }
    var dur = api.raf(ciz);
    return function () { dur(); if (ctx) ctx.close(); };
  }
});

})();
(function(){
  var register = function(spec){ window.__TOHUM_KAYIT["webgl2-ornekleme-noktasi"] = spec; };
  register({
  baslik: '50.000 kapı bulutu',
  aciklama: 'WebGL2 ile 50.000 nokta tek çizimde: gl_VertexID ızgara ↔ küre arasında yumuşak geçiş yapar; kapı ızgarası bağlamı.',
  mount: function (host, api) {
    var c = document.createElement('canvas'), gl = c.getContext('webgl2', { antialias: true }), P = api.palette;
    c.className = 'ts-tam'; host.appendChild(c);
    if (!gl) { host.innerHTML = '<p class="ts-uyari">WebGL2 bu tarayıcıda yok.</p>'; return function () {}; }
    function renk(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
    var vs = '#version 300 es\nprecision highp float;uniform float T,M,S;uniform vec2 R;uniform vec3 A,B,C;out vec3 col;' +
      'void main(){float i=float(gl_VertexID);float gx=mod(i,250.),gy=floor(i/250.);' +
      'vec3 g=vec3((gx/249.-.5)*2.2,(gy/199.-.5)*1.7,0.);float k=i+.5,ph=acos(1.-2.*k/50000.),th=2.399963*k;' +
      'vec3 s=vec3(sin(ph)*cos(th),cos(ph),sin(ph)*sin(th));vec3 p=mix(g,s,M);float a=T*.35;' +
      'p=vec3(p.x*cos(a)+p.z*sin(a),p.y,-p.x*sin(a)+p.z*cos(a));p.z+=3.;float asp=R.x/R.y;' +
      'gl_Position=vec4(p.x*1.7/asp,p.y*1.7,0.,p.z);gl_PointSize=S*(1.6/p.z+.6);' +
      'float r1=fract(i*.0001),r2=fract(i*.00037);col=mix(mix(A,B,r1),C,step(.88,r2))*(.55+.6/p.z);}';
    var fs = '#version 300 es\nprecision highp float;in vec3 col;out vec4 o;void main(){vec2 d=gl_PointCoord-.5;if(dot(d,d)>.25)discard;o=vec4(col,1.);}';
    function derle(t, s) { var sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; }
    var pr = gl.createProgram(); gl.attachShader(pr, derle(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, derle(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
    function u(n) { return gl.getUniformLocation(pr, n); }
    gl.uniform3fv(u('A'), renk(P.a)); gl.uniform3fv(u('B'), renk(P.b)); gl.uniform3fv(u('C'), renk(P.c));
    var z = renk(P.bg);
    function fit() { c.width = Math.max(2, Math.floor(api.width * api.dpr)); c.height = Math.max(2, Math.floor(api.height * api.dpr)); gl.viewport(0, 0, c.width, c.height); gl.uniform2f(u('R'), c.width, c.height); gl.uniform1f(u('S'), 2.2 * api.dpr); }
    fit(); api.onResize(fit);
    function ciz(t, m) { gl.clearColor(z[0], z[1], z[2], 1); gl.clear(gl.COLOR_BUFFER_BIT); gl.uniform1f(u('T'), t); gl.uniform1f(u('M'), m); gl.drawArrays(gl.POINTS, 0, 50000); }
    if (api.reducedMotion) { ciz(0.6, 0.35); return function () {}; }
    var dur = api.raf(function () { var t = api.time() / 1000; ciz(t, 0.5 + 0.5 * Math.sin(t * 0.55)); });
    return function () { dur(); };
  }
});

})();
(function(){
  var register = function(spec){ window.__TOHUM_KAYIT["webgl2-parca-golgelendirici"] = spec; };
  register({
  baslik: 'Alan çarpıtma gölgelendiricisi',
  aciklama: 'WebGL2 parça gölgelendirici: fbm ile alan çarpıtma (domain warping) ve palet karışımı; geçiş perdesi için akışkan zemin.',
  mount: function (host, api) {
    var c = document.createElement('canvas'), gl = c.getContext('webgl2', { antialias: false }), P = api.palette;
    c.className = 'ts-tam'; host.appendChild(c);
    if (!gl) { host.innerHTML = '<p class="ts-uyari">WebGL2 bu tarayıcıda yok.</p>'; return function () {}; }
    function renk(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
    var vs = '#version 300 es\nvoid main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}';
    var fs = '#version 300 es\nprecision highp float;uniform vec2 R;uniform float T;uniform vec3 A,B,C,Z;out vec4 o;' +
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}' +
      'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.02;a*=.5;}return s;}' +
      'void main(){vec2 u=(gl_FragCoord.xy-.5*R)/R.y*2.2;float t=T*.12;vec2 q=vec2(fbm(u+t),fbm(u+vec2(5.2,1.3)-t));' +
      'vec2 r=vec2(fbm(u+3.*q+vec2(1.7,9.2)+t*1.3),fbm(u+3.*q+vec2(8.3,2.8)-t));float f=fbm(u+3.*r);' +
      'vec3 col=mix(Z,A,clamp(f*1.6,0.,1.));col=mix(col,B,clamp(length(q)*.9,0.,1.)*.7);col=mix(col,C,clamp(r.x,0.,1.)*.5);col+=.18*pow(f,3.)*vec3(1);o=vec4(col,1);}';
    function derle(t, s) { var sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; }
    var pr = gl.createProgram(); gl.attachShader(pr, derle(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, derle(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
    function u(n) { return gl.getUniformLocation(pr, n); }
    gl.uniform3fv(u('A'), renk(P.a)); gl.uniform3fv(u('B'), renk(P.b)); gl.uniform3fv(u('C'), renk(P.c)); gl.uniform3fv(u('Z'), renk(P.bg));
    function fit() { c.width = Math.max(2, Math.floor(api.width * api.dpr * 0.75)); c.height = Math.max(2, Math.floor(api.height * api.dpr * 0.75)); gl.viewport(0, 0, c.width, c.height); gl.uniform2f(u('R'), c.width, c.height); }
    fit(); api.onResize(fit);
    function ciz(t) { gl.uniform1f(u('T'), t / 1000); gl.drawArrays(gl.TRIANGLES, 0, 3); }
    if (api.reducedMotion) { ciz(4000); return function () {}; }
    var dur = api.raf(function () { ciz(api.time()); });
    return function () { dur(); };
  }
});

})();
window.__TOHUM_KAYNAK = {"canvas2d-akis-alani": "register({\n  baslik: 'Akış alanı şeritleri',\n  aciklama: 'Sinüs bileşiminden türeyen akış alanında (flow field) yürüyen, iz bırakan çizgiler.',\n  mount: function (host, api) {\n    var c = document.createElement('canvas'), x = c.getContext('2d'), P = api.palette, r = api.rng(11), W = 2, H = 2, ps = [], N = 620;\n    c.className = 'ts-tam'; host.appendChild(c);\n    function fit() { W = c.width = Math.max(2, Math.floor(api.width * api.dpr)); H = c.height = Math.max(2, Math.floor(api.height * api.dpr)); x.fillStyle = P.bg; x.fillRect(0, 0, W, H); }\n    fit(); api.onResize(fit);\n    for (var i = 0; i < N; i++) ps.push({ x: r() * 480, y: r() * 300, k: i % 3 });\n    var renk = [P.a, P.b, P.fg];\n    function akis(px, py, t) { return (Math.sin(px * 0.011 + t) * Math.cos(py * 0.013 - t * 0.7) + Math.sin((px + py) * 0.006 + t * 0.4)) * Math.PI; }\n    function kare() {\n      var t = api.reducedMotion ? 1.3 : api.time() / 4000;\n      x.globalAlpha = 0.04; x.fillStyle = P.bg; x.fillRect(0, 0, W, H); x.globalAlpha = 0.85; x.lineWidth = 1.2 * api.dpr;\n      for (var i = 0; i < N; i++) {\n        var p = ps[i], a = akis(p.x / api.dpr, p.y / api.dpr, t), nx = p.x + Math.cos(a) * 1.6 * api.dpr, ny = p.y + Math.sin(a) * 1.6 * api.dpr;\n        x.strokeStyle = renk[p.k]; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(nx, ny); x.stroke(); p.x = nx; p.y = ny;\n        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H || r() < 0.004) { p.x = r() * W; p.y = r() * H; }\n      }\n      x.globalAlpha = 1;\n    }\n    if (api.reducedMotion) { for (var s = 0; s < 320; s++) kare(); return function () {}; }\n    var dur = api.raf(kare);\n    return function () { dur(); };\n  }\n});\n", "canvas2d-parcacik": "register({\n  baslik: 'Kapı aralığından kıvılcımlar',\n  aciklama: 'Canvas 2D parçacık sistemi: kapı aralığından saçılan, iz bırakan kıvılcımlar; imleç ya da dokunuş onları çeker.',\n  mount: function (host, api) {\n    var c = document.createElement('canvas'), x = c.getContext('2d'), P = api.palette, r = api.rng(7), W = 2, H = 2, ps = [], mx = -1, my = -1;\n    c.className = 'ts-tam'; host.appendChild(c);\n    function fit() { W = c.width = Math.max(2, Math.floor(api.width * api.dpr)); H = c.height = Math.max(2, Math.floor(api.height * api.dpr)); x.fillStyle = P.bg; x.fillRect(0, 0, W, H); }\n    fit(); api.onResize(fit);\n    function dogur(p, ilk) {\n      var a = -Math.PI / 2 + (r() - 0.5) * 1.3, v = (0.8 + r() * 2.6) * api.dpr;\n      p.x = W / 2 + (r() - 0.5) * W * 0.03; p.y = H * 0.9; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v * 1.5;\n      p.om = ilk ? r() * 160 : 90 + r() * 90; p.k = [P.a, P.b, P.c][Math.floor(r() * 3)]; p.s = (0.8 + r() * 1.6) * api.dpr;\n      return p;\n    }\n    for (var i = 0; i < 260; i++) ps.push(dogur({}, true));\n    function kare() {\n      x.globalCompositeOperation = 'source-over'; x.fillStyle = P.bg; x.globalAlpha = api.reducedMotion ? 1 : 0.14; x.fillRect(0, 0, W, H); x.globalAlpha = 1;\n      var yarik = W * 0.012 * (1 + 0.6 * Math.sin(api.time() / 700)) + 2 * api.dpr;\n      x.fillStyle = P.fg; x.fillRect(W / 2 - yarik / 2, H * 0.28, yarik, H * 0.62);\n      x.strokeStyle = P.c; x.lineWidth = 2 * api.dpr; x.strokeRect(W * 0.38, H * 0.28, W * 0.24, H * 0.62);\n      x.globalCompositeOperation = 'lighter';\n      for (var i = 0; i < ps.length; i++) {\n        var p = ps[i];\n        if (mx >= 0) { var dx = mx - p.x, dy = my - p.y, d2 = dx * dx + dy * dy + 900 * api.dpr; p.vx += dx / d2 * 40 * api.dpr; p.vy += dy / d2 * 40 * api.dpr; }\n        p.vy += 0.018 * api.dpr; p.x += p.vx; p.y += p.vy; p.om--;\n        x.fillStyle = p.k; x.globalAlpha = Math.max(0, Math.min(1, p.om / 60)); x.fillRect(p.x, p.y, p.s, p.s);\n        if (p.om <= 0 || p.y > H || p.x < 0 || p.x > W) dogur(p, false);\n      }\n      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';\n    }\n    if (api.reducedMotion) { for (var s = 0; s < 90; s++) kare(); return function () {}; }\n    api.on(host, 'pointermove', function (e) { var b = host.getBoundingClientRect(); mx = (e.clientX - b.left) * api.dpr; my = (e.clientY - b.top) * api.dpr; });\n    api.on(host, 'pointerleave', function () { mx = -1; my = -1; });\n    var dur = api.raf(kare);\n    return function () { dur(); };\n  }\n});\n", "canvas2d-verlet-kumas": "register({\n  baslik: 'Verlet kumaş',\n  aciklama: 'Verlet entegrasyonu ve mesafe kısıtlarıyla rüzgârda sallanan kumaş; imleç rüzgâr verir.',\n  mount: function (host, api) {\n    var c = document.createElement('canvas'), x = c.getContext('2d'), P = api.palette, W = 2, H = 2, cols = 28, rows = 16, pts = [], kisit = [], mx = -1e9, my = -1e9;\n    c.className = 'ts-tam ts-dokun'; host.appendChild(c);\n    function rgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }\n    function mix(a, b, t) { return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }).join(',') + ')'; }\n    var A = rgb(P.a), B = rgb(P.b), C = rgb(P.c);\n    function kur() {\n      pts.length = 0; kisit.length = 0;\n      var gap = Math.min(W * 0.8 / cols, H * 0.62 / rows), ox = (W - gap * (cols - 1)) / 2, oy = H * 0.1, i, j;\n      for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) { var px = ox + i * gap, py = oy + j * gap; pts.push({ x: px, y: py, ox: px, oy: py, pin: j === 0 && i % 3 === 0 }); }\n      for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) { var k = j * cols + i; if (i < cols - 1) kisit.push([k, k + 1, gap]); if (j < rows - 1) kisit.push([k, k + cols, gap]); }\n    }\n    function fit() { W = c.width = Math.max(2, Math.floor(api.width * api.dpr)); H = c.height = Math.max(2, Math.floor(api.height * api.dpr)); kur(); }\n    fit(); api.onResize(fit);\n    api.on(c, 'pointermove', function (e) { var b = c.getBoundingClientRect(); mx = (e.clientX - b.left) * api.dpr; my = (e.clientY - b.top) * api.dpr; });\n    api.on(c, 'pointerleave', function () { mx = -1e9; my = -1e9; });\n    function adim(t) {\n      var ruzgar = Math.sin(t / 900) * 0.35 + Math.sin(t / 370) * 0.15, i, k;\n      for (i = 0; i < pts.length; i++) {\n        var p = pts[i]; if (p.pin) continue;\n        var vx = (p.x - p.ox) * 0.985, vy = (p.y - p.oy) * 0.985; p.ox = p.x; p.oy = p.y;\n        p.x += vx + ruzgar * api.dpr * 0.5 * (1 + Math.floor(i / cols) * 0.04); p.y += vy + 0.32 * api.dpr;\n        var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy, R = 70 * api.dpr;\n        if (d2 < R * R) { var d = Math.sqrt(d2) || 1, f = (1 - d / R) * 6 * api.dpr; p.x += dx / d * f; p.y += dy / d * f; }\n      }\n      for (var it = 0; it < 5; it++) for (k = 0; k < kisit.length; k++) {\n        var a = pts[kisit[k][0]], b = pts[kisit[k][1]], dx2 = b.x - a.x, dy2 = b.y - a.y, dist = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1, fark = (dist - kisit[k][2]) / dist * 0.5;\n        if (!a.pin) { a.x += dx2 * fark; a.y += dy2 * fark; }\n        if (!b.pin) { b.x -= dx2 * fark; b.y -= dy2 * fark; }\n      }\n    }\n    function ciz() {\n      x.fillStyle = P.bg; x.fillRect(0, 0, W, H);\n      for (var j = 0; j < rows - 1; j++) for (var i = 0; i < cols - 1; i++) {\n        var p1 = pts[j * cols + i], p2 = pts[j * cols + i + 1], p3 = pts[(j + 1) * cols + i + 1], p4 = pts[(j + 1) * cols + i];\n        var gol = Math.max(0, Math.min(1, 0.5 + ((p2.x - p1.x) - (p3.y - p2.y)) / 14 / api.dpr)), t = j / rows;\n        x.fillStyle = mix(t < 0.5 ? A : B, t < 0.5 ? B : C, (t % 0.5) * 2); x.globalAlpha = 0.5 + 0.45 * gol;\n        x.beginPath(); x.moveTo(p1.x, p1.y); x.lineTo(p2.x, p2.y); x.lineTo(p3.x, p3.y); x.lineTo(p4.x, p4.y); x.closePath(); x.fill();\n      }\n      x.globalAlpha = 1; x.fillStyle = P.fg;\n      for (var q = 0; q < cols; q += 3) { x.beginPath(); x.arc(pts[q].x, pts[q].y, 3 * api.dpr, 0, 6.2832); x.fill(); }\n    }\n    if (api.reducedMotion) { for (var s = 0; s < 240; s++) adim(s * 16); ciz(); return function () {}; }\n    var dur = api.raf(function (t) { adim(api.time()); ciz(); });\n    return function () { dur(); };\n  }\n});\n", "css-3b-donme": "register({\n  baslik: 'Podyum karuseli',\n  aciklama: 'CSS 3B dönme: preserve-3d ile rotateY ve translateZ; silindir etrafında dönen koleksiyon panelleri. Üzerine gelince durur.',\n  mount: function (host, api) {\n    var P = api.palette, N = 9, R = Math.round(Math.max(110, Math.min(api.width, api.height) * 0.56)), i;\n    var s = document.createElement('div'); s.className = 'ts-3b-s'; s.tabIndex = 0; s.setAttribute('aria-label', 'Dönen koleksiyon panelleri');\n    var h = document.createElement('div'); h.className = api.reducedMotion ? 'ts-3b-h durgun' : 'ts-3b-h';\n    for (i = 0; i < N; i++) {\n      var k = [P.a, P.b, P.c][i % 3], p = document.createElement('div');\n      p.className = 'ts-3b-p';\n      p.style.transform = 'rotateY(' + (i * 360 / N) + 'deg) translateZ(' + R + 'px)';\n      p.style.background = 'linear-gradient(160deg,' + k + ',' + P.bg + ' 78%)';\n      p.innerHTML = '<b>№' + (i + 1) + '</b><span>koleksiyon</span>';\n      h.appendChild(p);\n    }\n    s.appendChild(h); host.appendChild(s);\n    return function () {};\n  }\n});\n", "css-kaydirma-zaman-cizgisi": "register({\n  baslik: 'Kaydırınca açılan yayın programı',\n  aciklama: 'CSS kaydırma güdümlü animasyon (animation-timeline: view/scroll): satırlar görünür oldukça belirir; destek yoksa hazır görünür.',\n  mount: function (host, api) {\n    var ok = window.CSS && CSS.supports && CSS.supports('animation-timeline', 'scroll()') && !api.reducedMotion;\n    var konu = ['Koleksiyon gösterimi', 'Tasarımcı söyleşisi', 'Sahne arkası', 'Kumaş atölyesi', 'Işık provası', 'Soru-cevap', 'Kapanış'];\n    var k = document.createElement('div'); k.className = ok ? 'ts-kz-k ts-kz-anim' : 'ts-kz-k'; k.tabIndex = 0;\n    k.innerHTML = '<h3>Yayın programı · örnek</h3><ul>' + konu.map(function (ad, i) {\n      return '<li><i>' + (10 + i) + ':00</i><b>' + ad + '</b><em>örnek akış satırı</em></li>';\n    }).join('') + '</ul>';\n    host.appendChild(k);\n    return function () {};\n  }\n});\n", "css-property-gradyan": "register({\n  baslik: 'Sponsor bandı: dönen gradyan çerçeve',\n  aciklama: '@property ile tipli açı değişkeni animasyonu: conic-gradient çerçeve döner, içte durdurulabilir kayan bant akar.',\n  mount: function (host, api) {\n    var ad = ['AFAIR', 'KAPI', 'CANLI', 'SAHNE', 'KUMAŞ', 'IŞIK'], seri = '', i;\n    for (i = 0; i < 3; i++) ad.forEach(function (a) { seri += '<span>' + a + '</span><i>✦</i>'; });\n    var z = document.createElement('div'); z.className = 'ts-pg-z';\n    var c = document.createElement('div'); c.className = api.reducedMotion ? 'ts-pg-c durgun' : 'ts-pg-c'; c.tabIndex = 0;\n    var ic = document.createElement('div'); ic.className = 'ts-pg-ic';\n    var s = document.createElement('div'); s.className = api.reducedMotion ? 'ts-pg-s durgun' : 'ts-pg-s'; s.innerHTML = seri;\n    ic.appendChild(s); c.appendChild(ic); z.appendChild(c); host.appendChild(z);\n    var e = document.createElement('div'); e.className = 'ts-pg-e'; e.textContent = 'ÖRNEK BAND · ÜZERİNE GELİNCE DURUR'; host.appendChild(e);\n    return function () {};\n  }\n});\n", "hilbert-egri-yerlesim": "register({\n  baslik: 'Hilbert eğrisiyle kapı yerleşimi',\n  aciklama: 'd2xy ile 1B kapı sırası 2B düzleme dizilir; ardışık kapılar yan yana kalır. Eğri adım adım çizilir; sonuç panosu için örnek.',\n  mount: function (host, api) {\n    var P = api.palette, n = 128, toplam = n * n, c = document.createElement('canvas'), x = c.getContext('2d'), W = 2, H = 2, ilk = 0, bekle = 0, yol = [], d;\n    c.className = 'ts-tam'; host.appendChild(c);\n    function rgb(h) { var v = parseInt(h.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; }\n    var A = rgb(P.a), B = rgb(P.b), C = rgb(P.c);\n    function renk(t) { var a = t < 0.5 ? A : B, b = t < 0.5 ? B : C, u = (t % 0.5) * 2; return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * u); }).join(',') + ')'; }\n    function rot(s, p, rx, ry) { if (ry === 0) { if (rx === 1) { p[0] = s - 1 - p[0]; p[1] = s - 1 - p[1]; } var t = p[0]; p[0] = p[1]; p[1] = t; } }\n    function d2xy(nn, dd) { var p = [0, 0], t = dd, s, rx, ry; for (s = 1; s < nn; s *= 2) { rx = 1 & Math.floor(t / 2); ry = 1 & (t ^ rx); rot(s, p, rx, ry); p[0] += s * rx; p[1] += s * ry; t = Math.floor(t / 4); } return p; }\n    for (d = 0; d < toplam; d++) yol.push(d2xy(n, d));\n    function fit() { W = c.width = Math.max(2, Math.floor(api.width * api.dpr)); H = c.height = Math.max(2, Math.floor(api.height * api.dpr)); ilk = 0; x.fillStyle = P.bg; x.fillRect(0, 0, W, H); }\n    fit(); api.onResize(fit);\n    function ciz(hedef) {\n      var S = Math.min(W, H - 24 * api.dpr) * 0.94 / n, ox = (W - S * n) / 2, oy = 6 * api.dpr;\n      x.lineWidth = Math.max(1, S * 0.9); x.lineCap = 'round';\n      for (; ilk < hedef && ilk < toplam - 1; ilk++) {\n        x.strokeStyle = renk(ilk / toplam); x.beginPath();\n        x.moveTo(ox + (yol[ilk][0] + 0.5) * S, oy + (yol[ilk][1] + 0.5) * S); x.lineTo(ox + (yol[ilk + 1][0] + 0.5) * S, oy + (yol[ilk + 1][1] + 0.5) * S); x.stroke();\n      }\n      x.fillStyle = P.bg; x.fillRect(0, H - 22 * api.dpr, W, 22 * api.dpr);\n      x.fillStyle = P.fg; x.font = '600 ' + (11 * api.dpr) + 'px system-ui';\n      x.fillText('ÖRNEK · sıra ' + ilk + ' → (' + yol[ilk][0] + ', ' + yol[ilk][1] + ') · ' + toplam + ' hücre', 10 * api.dpr, H - 7 * api.dpr);\n    }\n    if (api.reducedMotion) { ciz(toplam); return function () {}; }\n    var dur = api.raf(function () {\n      if (ilk >= toplam - 1) { if (++bekle > 80) { bekle = 0; fit(); } return; }\n      ciz(ilk + 300);\n    });\n    return function () { dur(); };\n  }\n});\n", "svg-filtre-sivi-kumas": "register({\n  baslik: 'Sıvı kumaş filtresi',\n  aciklama: 'SVG feTurbulence + feDisplacementMap: şeritli kumaş ve harfler dalgalanır; baseFrequency canlı değişir.',\n  mount: function (host, api) {\n    var P = api.palette, seritler = '', fid = 'sv-' + api.id, i;\n    for (i = 0; i < 16; i++) seritler += '<rect x=\"' + (i * 30) + '\" y=\"0\" width=\"30\" height=\"300\" fill=\"' + [P.a, P.b, P.c, P.fg][i % 4] + '\" opacity=\"' + (i % 4 === 3 ? 0.35 : 0.9) + '\"/>';\n    host.innerHTML = '<svg viewBox=\"0 0 480 300\" preserveAspectRatio=\"xMidYMid slice\" class=\"ts-tam\">' +\n      '<defs><filter id=\"' + fid + '\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feTurbulence class=\"ts-tb\" type=\"fractalNoise\" baseFrequency=\"0.008 0.02\" numOctaves=\"2\" seed=\"3\" result=\"n\"/>' +\n      '<feDisplacementMap in=\"SourceGraphic\" in2=\"n\" scale=\"42\" xChannelSelector=\"R\" yChannelSelector=\"G\"/></filter></defs>' +\n      '<rect width=\"480\" height=\"300\" fill=\"' + P.bg + '\"/><g filter=\"url(#' + fid + ')\">' + seritler +\n      '<text x=\"240\" y=\"178\" text-anchor=\"middle\" font-family=\"Georgia,serif\" font-size=\"96\" font-weight=\"700\" fill=\"' + P.bg + '\" stroke=\"' + P.fg + '\" stroke-width=\"2\">AFAIR</text></g></svg>';\n    var tb = host.querySelector('.ts-tb');\n    if (api.reducedMotion) return function () {};\n    var dur = api.raf(function () {\n      var t = api.time() / 1000;\n      tb.setAttribute('baseFrequency', (0.008 + 0.004 * Math.sin(t * 0.6)).toFixed(4) + ' ' + (0.02 + 0.01 * Math.cos(t * 0.45)).toFixed(4));\n    });\n    return function () { dur(); };\n  }\n});\n", "typed-array-tek-bellek-50k": "register({\n  baslik: '50.000 kapı tek bellek bloğunda',\n  aciklama: 'Uint8Array durum dizisi ve tek putImageData: 250×200 kapının kabul dalgası. Veri örnektir; sayaçlar gerçek kayıt değildir.',\n  mount: function (host, api) {\n    var W0 = 250, H0 = 200, N = 50000, durum = new Uint8Array(N), esik = new Float32Array(N), P = api.palette, r = api.rng(5), i;\n    var c = document.createElement('canvas'), x = c.getContext('2d'), kc = document.createElement('canvas');\n    kc.width = W0; kc.height = H0;\n    var kx = kc.getContext('2d'), img = kx.createImageData(W0, H0), buf = new Uint32Array(img.data.buffer);\n    function u32(h) { var n = parseInt(h.slice(1), 16); return ((255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | (n >> 16)) >>> 0; }\n    var bg = u32(P.bg), A = u32(P.a), B = u32(P.b), C = u32(P.c);\n    for (i = 0; i < N; i++) esik[i] = r();\n    c.className = 'ts-tam'; host.appendChild(c);\n    function fit() { c.width = Math.max(2, Math.floor(api.width * api.dpr)); c.height = Math.max(2, Math.floor(api.height * api.dpr)); x.imageSmoothingEnabled = false; }\n    fit(); api.onResize(fit);\n    function ciz(ilerleme) {\n      var on = ilerleme * (N + 4000), kabul = 0, kirada = 0, s;\n      for (var k = 0; k < N; k++) {\n        var d = on - k;\n        if (d < 0) s = 0; else if (d < 2500 * esik[k] + 300) s = 1; else s = 2;\n        durum[k] = s;\n        if (s === 2) kabul++; else if (s === 1) kirada++;\n        buf[k] = s === 0 ? bg : s === 1 ? C : (esik[k] < 0.85 ? A : B);\n      }\n      kx.putImageData(img, 0, 0);\n      x.fillStyle = P.bg; x.fillRect(0, 0, c.width, c.height);\n      var olcek = Math.min(c.width / W0, (c.height - 30 * api.dpr) / H0), w = W0 * olcek, h = H0 * olcek, ox = (c.width - w) / 2, oy = 6 * api.dpr;\n      x.drawImage(kc, ox, oy, w, h);\n      x.fillStyle = P.fg; x.font = '600 ' + (11 * api.dpr) + 'px system-ui';\n      x.fillText('ÖRNEK · kabul ' + kabul + ' · kirada ' + kirada + ' · boş ' + (N - kabul - kirada), ox, oy + h + 17 * api.dpr);\n    }\n    if (api.reducedMotion) { ciz(1); return function () {}; }\n    var dur = api.raf(function () { ciz(Math.min(1, (api.time() % 8000) / 6000)); });\n    return function () { dur(); };\n  }\n});\n", "waapi-yay-fizigi": "register({\n  baslik: 'Yaylanan sonuç panosu',\n  aciklama: 'Web Animations API ve CSS linear() yay eğrisi: kabul kutuları kademeli yaylanarak belirir; dokununca yeniden oynar.',\n  mount: function (host, api) {\n    var P = api.palette, i;\n    var g = document.createElement('div'); g.className = 'ts-wy-g'; g.tabIndex = 0; g.setAttribute('aria-label', 'Yay animasyonu; dokununca yeniden oynar');\n    var el = [];\n    for (i = 0; i < 40; i++) {\n      var d = document.createElement('div'); d.className = 'ts-wy-t'; d.style.background = [P.a, P.b, P.c][i % 3];\n      g.appendChild(d); el.push(d);\n    }\n    var alt = document.createElement('div'); alt.className = 'ts-wy-e';\n    var sy = document.createElement('span'); sy.textContent = '0 / 40';\n    alt.innerHTML = '<span>KABUL · ÖRNEK</span>'; alt.appendChild(sy);\n    host.appendChild(g); host.appendChild(alt);\n    var son = -1e9, yay = 'linear(0, 0.2 6%, 0.7 14%, 1.12 24%, 1.16 30%, 1.05 40%, 0.98 52%, 1.01 70%, 1)';\n    function oynat() {\n      son = api.time();\n      for (var k = 0; k < el.length; k++) {\n        el[k].animate([{ transform: 'translateY(46px) scale(.15)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 1100, delay: ((k % 8) + Math.floor(k / 8)) * 55, easing: yay, fill: 'both' });\n      }\n    }\n    api.on(host, 'pointerdown', oynat);\n    api.on(g, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); oynat(); } });\n    if (api.reducedMotion) { sy.textContent = '40 / 40'; return function () {}; }\n    oynat();\n    var dur = api.raf(function () {\n      var gec = api.time() - son;\n      sy.textContent = Math.min(40, Math.max(0, Math.floor(gec / 40))) + ' / 40';\n      if (gec > 4200) oynat();\n    });\n    return function () { dur(); };\n  }\n});\n", "webaudio-spektrum": "register({\n  baslik: 'Sahne sesi spektrumu',\n  aciklama: 'WebAudio AnalyserNode ile frekans çubukları. Ses yalnız düğmeye basınca başlar ve kısıktır; başlamadan önce görüntü örnek veridir.',\n  mount: function (host, api) {\n    var P = api.palette, c = document.createElement('canvas'), x = c.getContext('2d'), W = 2, H = 2, ctx = null, an = null, veri = new Uint8Array(64), dugme = document.createElement('button');\n    c.className = 'ts-tam'; host.appendChild(c);\n    dugme.textContent = 'Sesi başlat (kısık)';\n    dugme.className = 'ts-ses-dugme';\n    host.appendChild(dugme);\n    function fit() { W = c.width = Math.max(2, Math.floor(api.width * api.dpr)); H = c.height = Math.max(2, Math.floor(api.height * api.dpr)); }\n    fit(); api.onResize(fit);\n    function baslat() {\n      if (ctx) { ctx.close(); ctx = null; an = null; dugme.textContent = 'Sesi başlat (kısık)'; return; }\n      try {\n        var AC = window.AudioContext || window.webkitAudioContext; ctx = new AC();\n        var g = ctx.createGain(); g.gain.value = 0.03; an = ctx.createAnalyser(); an.fftSize = 128;\n        var o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain();\n        o1.type = 'sawtooth'; o1.frequency.value = 110; o2.type = 'triangle'; o2.frequency.value = 165; lfo.frequency.value = 0.35; lg.gain.value = 40;\n        lfo.connect(lg); lg.connect(o1.frequency); o1.connect(an); o2.connect(an); an.connect(g); g.connect(ctx.destination);\n        o1.start(); o2.start(); lfo.start(); dugme.textContent = 'Sesi durdur';\n      } catch (e) { ctx = null; an = null; }\n    }\n    api.on(dugme, 'click', baslat);\n    function ciz() {\n      var t = api.time() / 1000, n = 32, bw = W / n;\n      x.fillStyle = P.bg; x.fillRect(0, 0, W, H);\n      if (an) an.getByteFrequencyData(veri);\n      for (var i = 0; i < n; i++) {\n        var v = an ? veri[i] / 255 : 0.45 + 0.4 * Math.sin(t * 1.7 + i * 0.5) * Math.sin(t * 0.6 + i * 0.13), h = Math.max(2, v * H * 0.72);\n        x.fillStyle = i < n / 2 ? P.a : P.b; x.globalAlpha = 0.5 + v * 0.5; x.fillRect(i * bw + bw * 0.12, H * 0.84 - h, bw * 0.76, h);\n      }\n      x.globalAlpha = 1; x.fillStyle = P.fg; x.font = '600 ' + (12 * api.dpr) + 'px system-ui'; x.fillText(an ? 'CANLI SPEKTRUM' : 'ÖRNEK VERİ', 14 * api.dpr, 22 * api.dpr);\n    }\n    if (api.reducedMotion) { ciz(); return function () { if (ctx) ctx.close(); }; }\n    var dur = api.raf(ciz);\n    return function () { dur(); if (ctx) ctx.close(); };\n  }\n});\n", "webgl2-ornekleme-noktasi": "register({\n  baslik: '50.000 kapı bulutu',\n  aciklama: 'WebGL2 ile 50.000 nokta tek çizimde: gl_VertexID ızgara ↔ küre arasında yumuşak geçiş yapar; kapı ızgarası bağlamı.',\n  mount: function (host, api) {\n    var c = document.createElement('canvas'), gl = c.getContext('webgl2', { antialias: true }), P = api.palette;\n    c.className = 'ts-tam'; host.appendChild(c);\n    if (!gl) { host.innerHTML = '<p class=\"ts-uyari\">WebGL2 bu tarayıcıda yok.</p>'; return function () {}; }\n    function renk(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }\n    var vs = '#version 300 es\\nprecision highp float;uniform float T,M,S;uniform vec2 R;uniform vec3 A,B,C;out vec3 col;' +\n      'void main(){float i=float(gl_VertexID);float gx=mod(i,250.),gy=floor(i/250.);' +\n      'vec3 g=vec3((gx/249.-.5)*2.2,(gy/199.-.5)*1.7,0.);float k=i+.5,ph=acos(1.-2.*k/50000.),th=2.399963*k;' +\n      'vec3 s=vec3(sin(ph)*cos(th),cos(ph),sin(ph)*sin(th));vec3 p=mix(g,s,M);float a=T*.35;' +\n      'p=vec3(p.x*cos(a)+p.z*sin(a),p.y,-p.x*sin(a)+p.z*cos(a));p.z+=3.;float asp=R.x/R.y;' +\n      'gl_Position=vec4(p.x*1.7/asp,p.y*1.7,0.,p.z);gl_PointSize=S*(1.6/p.z+.6);' +\n      'float r1=fract(i*.0001),r2=fract(i*.00037);col=mix(mix(A,B,r1),C,step(.88,r2))*(.55+.6/p.z);}';\n    var fs = '#version 300 es\\nprecision highp float;in vec3 col;out vec4 o;void main(){vec2 d=gl_PointCoord-.5;if(dot(d,d)>.25)discard;o=vec4(col,1.);}';\n    function derle(t, s) { var sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; }\n    var pr = gl.createProgram(); gl.attachShader(pr, derle(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, derle(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);\n    function u(n) { return gl.getUniformLocation(pr, n); }\n    gl.uniform3fv(u('A'), renk(P.a)); gl.uniform3fv(u('B'), renk(P.b)); gl.uniform3fv(u('C'), renk(P.c));\n    var z = renk(P.bg);\n    function fit() { c.width = Math.max(2, Math.floor(api.width * api.dpr)); c.height = Math.max(2, Math.floor(api.height * api.dpr)); gl.viewport(0, 0, c.width, c.height); gl.uniform2f(u('R'), c.width, c.height); gl.uniform1f(u('S'), 2.2 * api.dpr); }\n    fit(); api.onResize(fit);\n    function ciz(t, m) { gl.clearColor(z[0], z[1], z[2], 1); gl.clear(gl.COLOR_BUFFER_BIT); gl.uniform1f(u('T'), t); gl.uniform1f(u('M'), m); gl.drawArrays(gl.POINTS, 0, 50000); }\n    if (api.reducedMotion) { ciz(0.6, 0.35); return function () {}; }\n    var dur = api.raf(function () { var t = api.time() / 1000; ciz(t, 0.5 + 0.5 * Math.sin(t * 0.55)); });\n    return function () { dur(); };\n  }\n});\n", "webgl2-parca-golgelendirici": "register({\n  baslik: 'Alan çarpıtma gölgelendiricisi',\n  aciklama: 'WebGL2 parça gölgelendirici: fbm ile alan çarpıtma (domain warping) ve palet karışımı; geçiş perdesi için akışkan zemin.',\n  mount: function (host, api) {\n    var c = document.createElement('canvas'), gl = c.getContext('webgl2', { antialias: false }), P = api.palette;\n    c.className = 'ts-tam'; host.appendChild(c);\n    if (!gl) { host.innerHTML = '<p class=\"ts-uyari\">WebGL2 bu tarayıcıda yok.</p>'; return function () {}; }\n    function renk(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }\n    var vs = '#version 300 es\\nvoid main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}';\n    var fs = '#version 300 es\\nprecision highp float;uniform vec2 R;uniform float T;uniform vec3 A,B,C,Z;out vec4 o;' +\n      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +\n      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}' +\n      'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.02;a*=.5;}return s;}' +\n      'void main(){vec2 u=(gl_FragCoord.xy-.5*R)/R.y*2.2;float t=T*.12;vec2 q=vec2(fbm(u+t),fbm(u+vec2(5.2,1.3)-t));' +\n      'vec2 r=vec2(fbm(u+3.*q+vec2(1.7,9.2)+t*1.3),fbm(u+3.*q+vec2(8.3,2.8)-t));float f=fbm(u+3.*r);' +\n      'vec3 col=mix(Z,A,clamp(f*1.6,0.,1.));col=mix(col,B,clamp(length(q)*.9,0.,1.)*.7);col=mix(col,C,clamp(r.x,0.,1.)*.5);col+=.18*pow(f,3.)*vec3(1);o=vec4(col,1);}';\n    function derle(t, s) { var sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; }\n    var pr = gl.createProgram(); gl.attachShader(pr, derle(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, derle(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);\n    function u(n) { return gl.getUniformLocation(pr, n); }\n    gl.uniform3fv(u('A'), renk(P.a)); gl.uniform3fv(u('B'), renk(P.b)); gl.uniform3fv(u('C'), renk(P.c)); gl.uniform3fv(u('Z'), renk(P.bg));\n    function fit() { c.width = Math.max(2, Math.floor(api.width * api.dpr * 0.75)); c.height = Math.max(2, Math.floor(api.height * api.dpr * 0.75)); gl.viewport(0, 0, c.width, c.height); gl.uniform2f(u('R'), c.width, c.height); }\n    fit(); api.onResize(fit);\n    function ciz(t) { gl.uniform1f(u('T'), t / 1000); gl.drawArrays(gl.TRIANGLES, 0, 3); }\n    if (api.reducedMotion) { ciz(4000); return function () {}; }\n    var dur = api.raf(function () { ciz(api.time()); });\n    return function () { dur(); };\n  }\n});\n"};
