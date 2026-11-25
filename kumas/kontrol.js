// Kumas kontrolleri: malzeme, ruzgar, ufle. Arayuz KUMAS'in durumunu izler (GPT API ile degisse de dogru gosterir).
(() => {
  'use strict';
  const tuval = document.getElementById('kumas3d'), ipucu = document.getElementById('ipucu'), r = document.getElementById('ruzgar');
  const bagla = () => {
    const K = window.KUMAS; if (!K) return;
    document.querySelectorAll('[data-malzeme]').forEach((b) => b.addEventListener('click', () => K.malzeme(b.dataset.malzeme)));
    r.addEventListener('input', () => K.ruzgar(r.value / 100)); K.ruzgar(r.value / 100);
    document.getElementById('ufle').addEventListener('click', () => K.nefes());
  };
  tuval.addEventListener('kumas-degisti', (e) => {
    document.querySelectorAll('[data-malzeme]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.malzeme === e.detail.malzeme)));
    const deger = Math.round(e.detail.ruzgar * 100); if (+r.value !== deger) r.value = deger;
  });
  tuval.addEventListener('kumas-hazir', bagla, { once: true });
  tuval.addEventListener('kumas-yok', () => { document.getElementById('yok').hidden = false; });
  tuval.addEventListener('kumas-dokunuldu', () => ipucu.classList.add('gizli'), { once: true });
})();
