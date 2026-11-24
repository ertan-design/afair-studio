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
