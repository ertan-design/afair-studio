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
