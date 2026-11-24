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
