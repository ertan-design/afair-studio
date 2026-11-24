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
