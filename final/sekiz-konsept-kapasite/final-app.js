

  const STORAGE_KEY = 'dila_afair_sync_state_v1';
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dila_afair_8sync') : null;
  const defaultState = {
    blackForbidden: true,
    undertone: 'sicak_altin',
    darkSignatureName: 'Yanik Espreso',
    darkSignatureHex: '#241914',
    kelvin: 3400,
    m1_shoulder: 41,
    m1_waist: 68,
    m1_height: 168,
    m1_ratio: 1.62,
    m2_wall_cm: 240,
    m2_gaze_cm: 85,
    selectedArt: 'Kehribar Ufuk #04',
    selectedFabric: 'Ham Ipek 190g/m2',
    jumps: 1
  };
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return Object.assign({}, defaultState, JSON.parse(raw));
    } catch (e) {}
    return Object.assign({}, defaultState);
  }
  let state = loadState();
  function saveAndBroadcast(reason) {
    state.jumps = (state.jumps || 1) + 1;
    const packet = Object.assign({ sema: 'dila.sicrama.v1', zaman: new Date().toISOString(), neden: reason }, state);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
    if (channel) channel.postMessage(packet);
    appendLog(packet);
  }
  function appendLog(pkt) {
    const box = document.getElementById('logBox');
    if (!box) return;
    const row = document.createElement('div');
    row.textContent = JSON.stringify({ sicrama: pkt.jumps, neden: pkt.neden, siyah_yasak: pkt.blackForbidden, imza: pkt.darkSignatureHex, m1: pkt.m1_ratio, m2_duvar: pkt.m2_wall_cm, eser: pkt.selectedArt });
    box.prepend(row);
  }
  if (channel) {
    channel.onmessage = (ev) => {
      if (ev && ev.data) {
        state = Object.assign({}, state, typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data);
        if (typeof render === 'function') render();
        appendLog({ jumps: state.jumps, neden: 'Diger Front sekmesinden canli sicrama alindi', ...state });
      }
    };
  }
  window.addEventListener('storage', (ev) => {
    if (ev.key === STORAGE_KEY && ev.newValue) {
      try { state = Object.assign({}, state, JSON.parse(ev.newValue)); if (typeof render === 'function') render(); } catch (e) {}
    }
  });

  const roles = [
    ['PROMPT 1/8 · afair.live Ana Merkez', 'İki Mezura eşleştirme ve "Affair\'dan Dila ben" terzi karşılama arayüzünü üret.'],
    ['PROMPT 2/8 · afair.studio AI Galeri', 'Renk kilidine ve duvar ölçüsüne göre canlı evrilen AI sanat galerisi sahnesini üret.'],
    ['PROMPT 3/8 · Kromatik Otorite', 'Alt ton ve Kelvin verisinden saf siyahı eleyip imza koyu ton atayan optik analiz modülünü üret.'],
    ['PROMPT 4/8 · Dokunsal Kumaş Arşivi', 'Siyah kumaşları mühürleyip gramaj ve döküm katsayısıyla kumaş öneren kartelayı üret.'],
    ['PROMPT 5/8 · Mekan ve Işık Senkronu', 'Evin Kelvin ışığında kıyafet ve tablo yansımasını simüle eden sahneyi üret.'],
    ['PROMPT 6/8 · AI Canlı Silüet Podyumu', 'Standart manken yerine kişinin iki mezura oranıyla hareket eden silüet sahnesini üret.'],
    ['PROMPT 7/8 · Kapsül & Eser Soykütüğü', 'Her yeni parça ve tablonun önceki seçimlerle uyumunu hesaplayan ağ grafiğini üret.'],
    ['PROMPT 8/8 · Private Salon Pasaportu', '4 Front ve 8 konsepti tek .jsonl pasaportunda birleştiren davet modülünü üret.']
  ];

  function buildPromptText(idx, head, task) {
    return `[DILA-8SENKRON ${idx + 1}/8 — ${head}]\n` +
      `Ortak Durum: siyah_yasak=${state.blackForbidden}, imza_koyu=${state.darkSignatureHex} (${state.darkSignatureName}), ` +
      `mezura1=${state.m1_shoulder}/${state.m1_waist}/${state.m1_height}cm (oran ${state.m1_ratio}), mezura2_duvar=${state.m2_wall_cm}cm, isik=${state.kelvin}K.\n` +
      `Gorev: ${task} BroadcastChannel("dila_afair_8sync") ile diger 7 konsepte sicrama paketi yayinla. Saf #0e1017 kullanma. Soru sorma, calisan HTML/CSS/JS uret.`;
  }

  function render() {
    document.body.classList.toggle('black-allowed', !state.blackForbidden);
    const pg = document.getElementById('promptsGrid');
    pg.innerHTML = '';
    roles.forEach(([head, task], idx) => {
      const ptxt = buildPromptText(idx, head, task);
      const card = document.createElement('div');
      card.style.border = '1px solid var(--border)';
      card.style.borderRadius = '8px';
      card.style.padding = '10px';
      const h = document.createElement('strong');
      h.style.fontSize = '13px';
      h.textContent = head;
      const pre = document.createElement('pre');
      pre.className = 'prompt-pre';
      pre.textContent = ptxt;
      const b = document.createElement('button');
      b.className = 'btn sec';
      b.textContent = 'Prompt ' + (idx + 1) + ' Kopyala';
      b.onclick = () => {
        if (navigator.clipboard) navigator.clipboard.writeText(ptxt);
        appendLog({ jumps: state.jumps, neden: 'Prompt ' + (idx + 1) + ' kopyalandi', ...state });
      };
      card.appendChild(h);
      card.appendChild(pre);
      card.appendChild(b);
      pg.appendChild(card);
    });

    document.getElementById('passportPre').textContent = JSON.stringify({
      sema: 'dila.pasaport.v1',
      aktif_frontlar: ['/dila-front1', '/dila-front2', '/dila-front3', '/dila-front4'],
      durum: state
    }, null, 2);
  }

  document.getElementById('copyAll8Btn').onclick = () => {
    const allTxt = roles.map(([h, t], i) => buildPromptText(i, h, t)).join('\n\n===\n\n');
    if (navigator.clipboard) navigator.clipboard.writeText(allTxt);
    appendLog({ jumps: state.jumps, neden: '8 eszamanli prompt tek seferde kopyalandi', ...state });
  };

  render();
  appendLog({ jumps: state.jumps, neden: 'Front-04 8-Konsept Komuta ve Kapasite Pasaportu acildi', ...state });

