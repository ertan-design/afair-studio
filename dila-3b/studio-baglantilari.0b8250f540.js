(function () {
  function followLegacyLink() {
    const selected = location.hash.slice(1);
    if (document.body.dataset.world === 'live') {
      if (['kahraman','motorlar','podyum-3b','gpt-1903','gercek-isler'].includes(selected)) {
        location.replace('/onceki-ana-sayfa.html#' + selected);
      }
      return;
    }
    const sections = new Set(['kahraman','bu-gece','iki-mezura','podyum-prova','galeri','sekiz-konsept','sekiz-prompt','kapasite','yaratici-soru']);
    const parts = new URLSearchParams(selected);
    const token = parts.get('tercih');
    const scene = parts.get('bolum');
    const valid = /^1\.(siyah|civit|murdum|kehribar)\.(ipek|keten|kadife)\.(sakin|carpici)\.(gece|hatirla)\.[01]\.[0-5]$/;
    if (token && valid.test(token) && sections.has(scene)) {
      location.replace('/dila/#' + new URLSearchParams({tercih:token,bolum:scene}));
    } else if (sections.has(selected)) {
      location.replace('/dila/#' + selected);
    }
  }
  window.addEventListener('hashchange', followLegacyLink);
  followLegacyLink();
})();
