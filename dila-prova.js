(function () {
  'use strict';

  const PROFILES = {
    warm: {
      label: 'Sıcak / Altın Alt Ton',
      forbidBlack: true,
      speech: (name, contrast) =>
        `AFAIR’dan Dila ben, ${name}. Cildindeki sıcak altın alt ton ve ${contrast === 'high' ? 'belirgin' : 'ipeksi'} kontrast sebebiyle saf siyah (#000000) yüzüne sert gölge düşürüp parlaklığını kesiyor — siyahı kesinlikle yasaklıyoruz. Onun yerine seni büyüten “Yeni Siyah”ın: Derin Espresso ve Oksitlenmiş Zeytin.`,
      gold: [
        { name: 'Derin Espresso (Yeni Siyah)', hex: '#2C1E1A' },
        { name: 'Oksitlenmiş Zeytin (Yeni Siyah)', hex: '#343D2C' },
        { name: 'Şampanya İpek', hex: '#E6D6BC' },
        { name: 'Sıcak Toprak / Terracotta', hex: '#B4654A' },
        { name: 'Eskitme Pirinç', hex: '#A98349' }
      ],
      forbid: [
        { name: 'Saf Siyah', hex: '#000000' },
        { name: 'Buzul Beyazı', hex: '#F0F8FF' },
        { name: 'Neon Fuşya', hex: '#FF00A8' }
      ],
      fabric: 'Ham keten + sıcak şampanya dut ipeği + bitkisel ceviz kabuğu pigmenti',
      acoustic: { mode: 'D Majör 7 · 76 BPM · Sıcak Naylon Gitar', freqs: [293.66, 369.99, 440.0, 554.37] },
      room: 'Kireç badana sıcak fildişi duvar + 3000K galeri spotu + ham meşe çerçeve'
    },
    olive: {
      label: 'Nötr / Zeytin Alt Ton',
      forbidBlack: true,
      speech: (name) =>
        `AFAIR’dan Dila ben, ${name}. Nötr-zeytin alt tonun en büyük tuzağı düz soğuk siyah ve soluk gri: ikisi de teni yorgun gösterir. Saf siyahı bırakıp Gece Zümrüdü ve Füme Bronz “Yeni Siyah” ikilisine geçiyoruz; cildin anında heykelsi derinlik kazanacak.`,
      gold: [
        { name: 'Gece Zümrüdü (Yeni Siyah)', hex: '#1B342E' },
        { name: 'Füme Bronz (Yeni Siyah)', hex: '#3E362E' },
        { name: 'Kum Taşı', hex: '#D8CFC2' },
        { name: 'Antik Bordo', hex: '#6E2B32' },
        { name: 'Adaçayı Gümüşü', hex: '#7B8A7B' }
      ],
      forbid: [
        { name: 'Düz Siyah', hex: '#000000' },
        { name: 'Sarımsı Hardal', hex: '#E5B80B' },
        { name: 'Pastel Bebek Pembesi', hex: '#F7C6D9' }
      ],
      fabric: 'Organik merinos yün + taş yıkama keten + kök boya zümrüt',
      acoustic: { mode: 'E Minör 9 · 82 BPM · Akustik Parmak Stil', freqs: [329.63, 392.0, 493.88, 739.99] },
      room: 'Traverten mat duvar + 3500K doğal galeri ışığı + fırçalanmış bronz aksan'
    },
    cool: {
      label: 'Soğuk / Gül & Porselen Alt Ton',
      forbidBlack: false,
      speech: (name, contrast) =>
        contrast === 'soft'
          ? `AFAIR’dan Dila ben, ${name}. Soğuk ama yumuşak kontrastta saf siyah yüzünün önüne geçer; sert siyah yerine Ay Işığı Antrasiti ve Gece Mürekkebi senin zarafetini taşır.`
          : `AFAIR’dan Dila ben, ${name}. Soğuk alt ton + keskin kontrastta siyahın kendisi yerine Gece Mürekkebi ve Kuzey Laciverti çok daha lüks ve modern bir ışık verir; turuncu ve sıcak hardalı tamamen yasaklıyoruz.`,
      gold: [
        { name: 'Gece Mürekkebi (Yeni Siyah)', hex: '#182236' },
        { name: 'Ay Işığı Antrasit (Yeni Siyah)', hex: '#2F343D' },
        { name: 'Porselen İnci', hex: '#ECEEF2' },
        { name: 'Kuzey Erik', hex: '#59334B' },
        { name: 'Buzul Siyan', hex: '#5E8499' }
      ],
      forbid: [
        { name: 'Sıcak Turuncu', hex: '#E86A17' },
        { name: 'Altın Hardal', hex: '#C8961E' },
        { name: 'Kiremit Kahve', hex: '#8A4326' }
      ],
      fabric: 'Soğuk büküm yün + saf ipek saten + doğal indigo pigment',
      acoustic: { mode: 'C Majör 9 · 72 BPM · Kristal Harmonik Gitar', freqs: [261.63, 329.63, 392.0, 587.33] },
      room: 'Soğuk galeri alçısı + 4500K müze ışığı + mat antrasit niş'
    }
  };

  const ART_STYLES = {
    minimal: { title: 'Mimari Sessizlik Serisi', sub: 'Az çizgi, geniş nefes, yüksek ışık dengesi' },
    organic: { title: 'Canlı Pigment & Toprak Dokusu', sub: 'Doğal katmanlar, akışkan siluet, dokunsal yüzey' },
    chiaroscuro: { title: 'Gölge & Altın Kırılma', sub: 'Derin kontrast, heykelsi ışık huzmesi' }
  };

  const PROMPTS = [
    ['D01 · AFAIR LIVE (İki Mezura + Dila AI)', 'Rol: D01 (AFAIR LIVE). Önce ortak AFAIR brief’ini oku. İki mezura evde ölçü + "AFAIR\'dan Dila ben" renk/alt-ton analizi akışını kur; düşük ışıkta "emin değilim" belirsizlik uyarısı ver; dila_dna_v1.jsonl + SHA-16 mühür bırak.'],
    ['D02 · AFAIR STUDIO (AI Galeri Art)', 'Rol: D02 (AFAIR STUDIO). dila_dna_v1.jsonl profilini alan AI-based sanat galerisi ve 3 kürasyon odasını tasarla. Her eser kartı K1 terzi kumaş dokusuna senkron bağlansın. 0 CDN, 0 sahte ödeme iddiası.'],
    ['D03 · ESTETİK (Renk Bilimi Motoru)', 'Rol: D03 (Estetik). 12 mevsim renk teorisini estetik_renk_kurallari.jsonl tablosuna dök; "neden siyah giymemelisin?" uyarısına 5 altın + 3 yasak + 2 "yeni siyah" (HEX+HSL) bilimsel gerekçe yaz. 2 koşuda birebir SHA-256.'],
    ['D04 · KIYAFET (Kalıp & 12-Parça Kapsül)', 'Rol: D04 (Kıyafet). olcu_cm + dila_dna_v1 paletinden 12 parçalık kapsül gardırop ve terzi dikim fişi üret; yasak renk seçilirse otomatik Dila uyarısı verip K3 alternatifi öner.'],
    ['D05 · SANART (Mekân + Moda + Eser)', 'Rol: D05 (Sanart). K2 galeri eserlerini modernataşehir.com / zehracevik.studio mekân duvar paletiyle eşle ("ceketinle tablon aynı dilde konuşsun"). Temsili veriyi açıkça etiketle.'],
    ['D06 · PERMAKÜLTÜR (Doğal Lif & Pigment)', 'Rol: D06 (Permakültür). K1/K4 kumaş ve K2/K5 tuval için doğal lif + bitkisel pigment matrisi kur; hasat.online / tarim.online ekoloji verisiyle köprü kur.'],
    ['D07 · GİTAR (Akustik Atmosfer)', 'Rol: D07 (Gitar & Akustik). Her dila_dna_v1 arketipine özel BPM, armonik mod ve 0-CDN WebAudio sergi/prova atmosferi tasarla.'],
    ['D08 · DRONE + PASAPORT & HAKEM', 'Rol: D08 (Hakem — Üreten Ölçmez). D01..D07 çıktılarını salt-okunur denetle: dila_dna_v1 uyumu, SHA-256 dijital pasaport, 0 CDN, <24 KB rapor ve k="eksik" kaydı kontrolü yap.']
  ];

  const QUESTIONS = [
    ['1 · Yasak Renk Paradoksu', 'Siyah giymeyi kimliği sanan bir misafiri kaybetmeden büyülemek için Dila AI ona hangi “Yeni Siyah”ı hangi sanat eseri üzerinden göstersin?'],
    ['2 · İki Mezura 90 Saniye Ritüeli', 'Terziler eve gittiğinde ilk 90 saniyede ne yaşansın ki kişi o anı kendi isteğiyle videoya çekip paylaşsın?'],
    ['3 · Sıçrama Hafızası', 'Bugün afair.live’da ceket diktiren biri 3 ay sonra afair.studio sergisine girdiğinde sistemin onun hakkında hatırlamasını istediğin tek gizli detay nedir?'],
    ['4 · Dürüst Lüks vs Kesin Hüküm', 'Işık kötüyse “emin değilim, pencere kenarında bakalım” diyen dürüst lüks bir Dila mı, yoksa her fotoğrafta kesin hüküm veren Dila mı?'],
    ['5 · İlk 8-Konsept Pilot Sıçraması', 'Tek bir Dila DNA taramasıyla hem gardırop, hem salon tablosu, hem akşam akustik listesinin aynı anda doğmasını ilk hangi pilot koleksiyonda sahneleyelim?']
  ];

  function el(t, c, txt) {
    const n = document.createElement(t);
    if (c) n.className = c;
    if (txt !== undefined && txt !== null) n.textContent = String(txt);
    return n;
  }
  function svgEl(t, attrs) {
    const n = document.createElementNS('http://www.w3.org/2000/svg', t);
    for (const k of Object.keys(attrs)) n.setAttribute(k, String(attrs[k]));
    return n;
  }

  let latestDnaObj = null;

  async function sha16(str) {
    if (window.crypto && window.crypto.subtle) {
      const buf = new TextEncoder().encode(str);
      const d = await window.crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
    }
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16).padStart(16, '0');
  }

  function renderArtSvg(colors, styleKey) {
    const host = document.getElementById('artFrameHost');
    host.textContent = '';
    const svg = svgEl('svg', { viewBox: '0 0 260 320', role: 'img', 'aria-label': 'AFAIR Studio AI Galeri Eseri' });
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: 260, height: 320, fill: colors[2].hex }));
    if (styleKey === 'minimal') {
      svg.appendChild(svgEl('rect', { x: 26, y: 28, width: 120, height: 210, fill: colors[0].hex, rx: 4 }));
      svg.appendChild(svgEl('circle', { cx: 175, cy: 145, r: 58, fill: colors[3].hex, opacity: 0.9 }));
      svg.appendChild(svgEl('line', { x1: 26, y1: 265, x2: 234, y2: 265, stroke: colors[4].hex, 'stroke-width': 3 }));
    } else if (styleKey === 'organic') {
      svg.appendChild(svgEl('ellipse', { cx: 115, cy: 130, rx: 90, ry: 105, fill: colors[1].hex, opacity: 0.85 }));
      svg.appendChild(svgEl('ellipse', { cx: 165, cy: 205, rx: 72, ry: 82, fill: colors[3].hex, opacity: 0.82 }));
      svg.appendChild(svgEl('circle', { cx: 130, cy: 150, r: 34, fill: colors[4].hex }));
    } else {
      svg.appendChild(svgEl('polygon', { points: '0,0 260,0 160,320 0,320', fill: colors[0].hex }));
      svg.appendChild(svgEl('polygon', { points: '150,20 245,160 120,295', fill: colors[3].hex, opacity: 0.92 }));
      svg.appendChild(svgEl('circle', { cx: 175, cy: 120, r: 26, fill: colors[4].hex }));
    }
    host.appendChild(svg);
  }

  async function renderStudio() {
    const name = (document.getElementById('inName').value || 'Misafir').trim();
    const toneKey = document.getElementById('selTone').value;
    const contrast = document.getElementById('selContrast').value;
    const light = document.getElementById('selLight').value;
    const artKey = document.getElementById('selArt').value;
    const sh = Number(document.getElementById('mShoulder').value) || 40;
    const ch = Number(document.getElementById('mChest').value) || 88;
    const wa = Number(document.getElementById('mWaist').value) || 66;
    const hi = Number(document.getElementById('mHeight').value) || 171;

    const p = PROFILES[toneKey];
    const art = ART_STYLES[artKey];
    const ratio = (ch - wa);
    const cutAdvice = ratio >= 22 ? 'Bel vurgulu heykelsi kup + uzun kruvaze hat'
      : ratio >= 14 ? 'Dengeli İtalyan tek sıra kalıp + doğal omuz'
      : 'Akışkan mimari düz kesim + dikey dikiş hattı';

    document.getElementById('dilaSpeech').textContent = p.speech(name, contrast);
    const ln = document.getElementById('lightNotice');
    ln.textContent = '';
    if (light === 'lamp') {
      ln.appendChild(el('div', 'warn-box', '⚠️ Dürüst Belirsizlik Uyarısı: 2700K sıcak lamba cilt alt tonunu sarılaştırabilir. Kesin kumaş kesimi öncesi pencere kenarında 10 sn gün ışığı doğrulaması önerilir.'));
    } else {
      ln.appendChild(el('div', 'ok-box', '✅ 5500K Gün Işığı Doğrulaması: Alt-ton ve kontrast okuması yüksek güven bandında — 8 konsept senkronizasyonu aktif.'));
    }

    const gHost = document.getElementById('goldSwatches');
    gHost.textContent = '';
    p.gold.forEach((c) => {
      const box = el('div', 'sw');
      const col = el('div', 'sw-color'); col.style.background = c.hex;
      const meta = el('div', 'sw-meta');
      meta.appendChild(el('strong', null, c.name));
      meta.appendChild(el('span', 'mono', c.hex));
      box.appendChild(col); box.appendChild(meta); gHost.appendChild(box);
    });

    const fHost = document.getElementById('forbidSwatches');
    fHost.textContent = '';
    p.forbid.forEach((c) => {
      const box = el('div', 'sw');
      const col = el('div', 'sw-color forbidden'); col.style.background = c.hex;
      const meta = el('div', 'sw-meta');
      meta.appendChild(el('strong', null, c.name));
      meta.appendChild(el('span', 'mono', c.hex));
      box.appendChild(col); box.appendChild(meta); fHost.appendChild(box);
    });

    renderArtSvg(p.gold, artKey);
    document.getElementById('artTitle').textContent = `${art.title} — ${name} Özel Kürasyonu`;
    document.getElementById('artDesc').textContent = `${art.sub}. Eser paleti doğrudan K1 Dila DNA altın renklerinden (${p.gold[0].name}, ${p.gold[3].name}, ${p.gold[4].name}) sentezlendi; yasak renkler 0% kullanıldı.`;
    document.getElementById('artMeta').textContent = `afair.studio/galeri/${toneKey}-${artKey} · ${p.room}`;

    const dnaCore = {
      schema: 'dila_dna_v1',
      guest: name,
      alt_ton: toneKey,
      kontrast: contrast,
      isik_guveni: light === 'daylight' ? 'YUKSEK_5500K' : 'BELIRSIZ_2700K',
      yeni_siyah: [p.gold[0].hex, p.gold[1].hex],
      altin_palet: p.gold.map((x) => x.hex),
      yasak_renkler: p.forbid.map((x) => x.hex),
      olcu_cm: { omuz: sh, gogus: ch, bel: wa, boy: hi },
      kalip: cutAdvice,
      galeri_tarzi: artKey,
      akustik_mod: p.acoustic.mode
    };
    const hash = await sha16(JSON.stringify(dnaCore));
    latestDnaObj = { ...dnaCore, sha16: hash };
    document.getElementById('dnaHashBox').textContent = `dila_dna_v1 · SHA-16: ${hash}`;

    const syncItems = [
      { id: 'K1 · ANA · afair.live', title: 'İki Mezura & Dila AI Terzi', desc: `${sh}/${ch}/${wa} cm (${hi} cm boy) → ${cutAdvice}. Bu seçimlerden bir örnek prova kartı oluşur.`, main: true },
      { id: 'K2 · YAN 1 · afair.studio', title: 'AI Galeri Art Kürasyonu', desc: `${art.title} · Palet: ${p.gold[0].name} + ${p.gold[3].name}. Örnek palet filtresi etkin.` },
      { id: 'K3 · YAN 2 · estetik', title: 'Renk Bilimi & Kontrast', desc: `${p.label} · ${p.forbid[0].name} bloke edildi → Yeni Siyah: ${p.gold[0].name} (${p.gold[0].hex}).` },
      { id: 'K4 · YAN 3 · kıyafet', title: '12-Parça Kapsül Gardırop', desc: `Ceket (${p.gold[0].name}), ipek gömlek (${p.gold[2].name}), vurgu parça (${p.gold[3].name}).` },
      { id: 'K5 · YAN 4 · sanart', title: 'Mekân & Eser Harmonisi', desc: `${p.room}. Üstündeki kalıpla duvarındaki tablo tek dilde senkron.` },
      { id: 'K6 · YAN 5 · permakültür', title: 'Doğal Lif & Pigment İzi', desc: `${p.fabric}. hasat.online / tarim.online ekoloji sıçramasına hazır.` },
      { id: 'K7 · YAN 6 · gitar', title: 'Akustik Atmosfer Frekansı', desc: `${p.acoustic.mode}. Prova anı ve galeri odası ses imzası senkron.` },
      { id: 'K8 · YAN 7 · drone/pasaport', title: 'Dijital Pasaport & 50K Kapı', desc: `Pasaport SHA-16: ${hash} · selinahbap.com 50.000 kapı & 3D drone sergi kaydına hazır.` }
    ];
    const sg = document.getElementById('syncGrid');
    sg.textContent = '';
    syncItems.forEach((it) => {
      const c = el('div', it.main ? 'sync-card main' : 'sync-card');
      c.appendChild(el('div', 'sync-id mono', it.id));
      c.appendChild(el('h4', null, it.title));
      c.appendChild(el('p', null, it.desc));
      sg.appendChild(c);
    });
  }

  // Acoustic guitar-like WebAudio chord preview (0 external MP3/CDN!)
  document.getElementById('btnChord').addEventListener('click', () => {
    const toneKey = document.getElementById('selTone').value;
    const freqs = PROFILES[toneKey].acoustic.freqs;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const start = ctx.currentTime + idx * 0.14;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.11, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.4);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(start); osc.stop(start + 1.45);
    });
  });

  document.getElementById('btnExportDna').addEventListener('click', () => {
    if (!latestDnaObj) return;
    const blob = new Blob([JSON.stringify(latestDnaObj) + '\n'], { type: 'application/x-ndjson;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = el('a'); a.href = url; a.download = `dila_dna_${latestDnaObj.sha16}.jsonl`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  // Tabs
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${target}`).classList.add('active');
    });
  });

  // Render Prompts & Creative Questions
  const ph = document.getElementById('promptsHost');
  PROMPTS.forEach(([title, body]) => {
    const card = el('div', 'prompt-card');
    const row = el('div'); row.style.display = 'flex'; row.style.justifyContent = 'space-between'; row.style.alignItems = 'center';
    row.appendChild(el('strong', null, title));
    const cp = el('button', 'btn outline', '📋 Kopyala'); cp.type = 'button';
    cp.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(body); cp.textContent = '✅ Kopyalandı'; }
      catch { cp.textContent = 'Seçip Ctrl+C yap'; }
      setTimeout(() => { cp.textContent = '📋 Kopyala'; }, 1600);
    });
    row.appendChild(cp);
    card.appendChild(row);
    card.appendChild(el('div', 'prompt-pre', body));
    ph.appendChild(card);
  });

  const qh = document.getElementById('questionsHost');
  QUESTIONS.forEach(([t, d]) => {
    const c = el('div', 'sync-card');
    c.appendChild(el('div', 'sync-id', t));
    c.appendChild(el('p', null, d));
    qh.appendChild(c);
  });

  ['inName', 'selTone', 'selContrast', 'selLight', 'selArt', 'mShoulder', 'mChest', 'mWaist', 'mHeight']
    .forEach((id) => document.getElementById(id).addEventListener('input', renderStudio));

  renderStudio();
})();
