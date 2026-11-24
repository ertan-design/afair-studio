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
