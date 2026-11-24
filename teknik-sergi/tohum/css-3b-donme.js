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
