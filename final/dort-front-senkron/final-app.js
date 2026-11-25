

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

  const warmArts = [
    { title: 'Kehribar Ufuk #04', bg: 'linear-gradient(135deg,#EBD7B7,#B65A38)', fabric: 'Ham Ipek 190g/m2' },
    { title: 'Zeytin & Fildisi Rezonans', bg: 'linear-gradient(135deg,#DCE3D5,#385A4B)', fabric: 'Ince Keten 220g/m2' },
    { title: 'Yanik Murdum Siluet', bg: 'linear-gradient(135deg,#E7D4DD,#582839)', fabric: 'Kasmir Yun 260g/m2' }
  ];
  const blackArts = [
    { title: 'Monokrom Gece #01', bg: 'linear-gradient(135deg,#2E2E2E,#0e1017)', fabric: 'Sert Gabardin 300g/m2' },
    { title: 'Obsidyen Kontrast', bg: 'linear-gradient(135deg,#434343,#070707)', fabric: 'Siyah Saten 180g/m2' },
    { title: 'Komur Kesit #09', bg: 'linear-gradient(135deg,#3A3224,#080808)', fabric: 'Agir Yun 320g/m2' }
  ];
  function render() {
    document.body.classList.toggle('black-allowed', !state.blackForbidden);
    document.getElementById('m1Range').value = Math.round(state.m1_ratio * 100);
    document.getElementById('m2Range').value = state.m2_wall_cm;
    document.getElementById('m1Txt').textContent = state.m1_ratio.toFixed(2);
    document.getElementById('m2Txt').textContent = state.m2_wall_cm + ' cm';
    document.getElementById('lockBadge').textContent = state.blackForbidden
      ? 'KROMA KİLİDİ: SİYAH YASAK (İmza: ' + state.darkSignatureName + ')'
      : 'KROMA KİLİDİ: AÇIK (Test)';
    document.getElementById('jumpBadge').textContent = 'SIÇRAMA: #' + state.jumps;
    document.getElementById('btnBlack').textContent = state.blackForbidden
      ? '"Siyah Asla Giymemen Gerekiyor": AKTİF'
      : 'Siyah Yasağını Yeniden Kilitle';

    const arts = state.blackForbidden ? warmArts : blackArts;
    const ag = document.getElementById('artGrid');
    ag.innerHTML = '';
    arts.forEach(a => {
      const d = document.createElement('div');
      d.className = 'artwork';
      d.style.background = a.bg;
      d.style.color = state.blackForbidden ? '#241914' : '#F5F5F5';
      const wCm = Math.round(state.m2_wall_cm * 0.38);
      const hCm = Math.round(wCm / state.m1_ratio);
      d.innerHTML = `<div style="font-family:monospace;font-size:11px">${wCm}×${hCm} cm · ${state.kelvin}K</div>
        <div><strong style="font-size:15px">${a.title}</strong><div style="font-family:monospace;font-size:11px;margin-top:4px">Kumaş: ${a.fabric}</div></div>`;
      d.onclick = () => {
        state.selectedArt = a.title;
        state.selectedFabric = a.fabric;
        render();
        saveAndBroadcast('Tablo secildi -> Front-02 terzi kumasi guncellendi: ' + a.fabric);
      };
      ag.appendChild(d);
    });

    const cList = [
      ['K01 · afair.live (ANA)', 'İki Mezura & Terzi Dila', 'Oran: ' + state.m1_ratio.toFixed(2) + ' · Boy: ' + state.m1_height + 'cm'],
      ['K02 · afair.studio', 'AI Sanat Galerisi', state.selectedArt],
      ['K03 · Kroma Otorite', 'Anti-Siyah Motoru', state.blackForbidden ? '#0e1017 Elendi -> ' + state.darkSignatureHex : 'Siyah Serbest'],
      ['K04 · Dokunsal Arşiv', 'Kumaş & Kalıp', state.selectedFabric],
      ['K05 · Mekan & Işık', 'Ev-Galeri Senkronu', state.m2_wall_cm + 'cm duvar · ' + state.kelvin + 'K'],
      ['K06 · Canlı Silüet', 'AI Hareket Podyumu', 'Bakış mesafesi: ' + state.m2_gaze_cm + 'cm'],
      ['K07 · Gardırop Grafı', 'Kapsül Soykütüğü', (state.jumps * 4) + ' çapraz düğüm aktif'],
      ['K08 · Private Salon', '4-Front Pasaportu', 'Front 1-2-3-4 canlı bağlı']
    ];
    const cg = document.getElementById('cGrid');
    cg.innerHTML = cList.map(([k, t, v]) => `<div class="c-box"><div class="c-num">${k}</div><div style="font-weight:bold;margin:4px 0">${t}</div><div style="font-family:monospace;font-size:12px;color:var(--muted)">${v}</div></div>`).join('');
  }
  document.getElementById('m1Range').oninput = e => { state.m1_ratio = Number(e.target.value) / 100; render(); saveAndBroadcast('Front-01 Mezura-1 orani degisti'); };
  document.getElementById('m2Range').oninput = e => { state.m2_wall_cm = Number(e.target.value); render(); saveAndBroadcast('Front-01 Mezura-2 duvar olcusu degisti'); };
  document.getElementById('btnBlack').onclick = () => { state.blackForbidden = !state.blackForbidden; render(); saveAndBroadcast('Front-01 Siyah yasagi degisti'); };
  document.getElementById('btnCopyJsonl').onclick = () => {
    const s = JSON.stringify({ sema: 'dila.sicrama.v1', ...state });
    if (navigator.clipboard) navigator.clipboard.writeText(s);
    appendLog({ jumps: state.jumps, neden: 'JSONL panoya kopyalandi', ...state });
  };
  render();
  appendLog({ jumps: state.jumps, neden: 'Front-01 canli sahne acildi', ...state });

