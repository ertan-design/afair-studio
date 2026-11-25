

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

  const palettes = {
    sicak_altin: { name: 'Yanik Espreso', dark: '#241914', skin: '#E5C1A1', list: ['#241914','#A64B2A','#2F5D50','#C89D66','#EFE6D8'], de: 41.8 },
    notr_fildisi: { name: 'Oksit Murdum', dark: '#2E1622', skin: '#EBD0BA', list: ['#2E1622','#8F3B52','#4A665C','#C4A287','#F4ECE6'], de: 38.4 },
    serin_porselen: { name: 'Gece Civiti', dark: '#162238', skin: '#F0D8CC', list: ['#162238','#7C3E4F','#2E5E68','#9FB1BC','#F2F4F7'], de: 44.2 },
    toprak_bronz: { name: 'Derin Cam', dark: '#182923', skin: '#D4A57E', list: ['#182923','#B35632','#5C4738','#C9A66B','#F3EBDD'], de: 39.7 }
  };

  function render() {
    const p = palettes[state.undertone] || palettes.sicak_altin;
    state.darkSignatureName = p.name;
    state.darkSignatureHex = p.dark;
    document.body.classList.toggle('black-allowed', !state.blackForbidden);
    document.getElementById('undertoneSel').value = state.undertone;
    document.getElementById('kelIn').value = state.kelvin;
    document.getElementById('kelVal').textContent = state.kelvin + ' K';
    document.getElementById('f3Verdict').textContent = 'HÜKÜM: SİYAH YASAK · YENİ KOYU: ' + p.name + ' (' + p.dark + ')';

    document.getElementById('swatches').innerHTML = p.list.map(hex =>
      `<div class="swatch" style="background:${hex}"><span>${hex}</span></div>`
    ).join('');

    const cv = document.getElementById('opticCanvas');
    const ctx = cv.getContext('2d');
    const warmShift = Math.round((state.kelvin - 2700) / 2900 * 18);
    ctx.clearRect(0, 0, cv.width, cv.height);

    // Left: #0e1017 harsh contrast
    ctx.fillStyle = '#0e1017';
    ctx.fillRect(0, 0, 260, 230);
    ctx.fillStyle = p.skin;
    ctx.beginPath(); ctx.arc(130, 95, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(90,95,105,0.42)';
    ctx.fillRect(96, 118, 68, 22);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px monospace';
    ctx.fillText('SAF SİYAH (#0e1017) — YASAK', 34, 205);

    // Right: Signature dark harmony
    ctx.fillStyle = p.dark;
    ctx.fillRect(260, 0, 260, 230);
    ctx.fillStyle = p.skin;
    ctx.beginPath(); ctx.arc(390, 95, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(${190 - warmShift}, 120, 85, 0.22)`;
    ctx.fillRect(356, 118, 68, 22);
    ctx.fillStyle = '#FFFDF9';
    ctx.fillText('İMZA KOYU (' + p.dark + ') — ONAYLI', 286, 205);

    document.getElementById('deltaNote').textContent =
      `Optik ΔE Siyah Çarpışma Skoru: ${p.de} (Eşik > 35.0 olduğunda #0e1017 teni grileştirir; ${p.dark} ise ${state.kelvin}K ışıkta doğal parlaklığı korur).`;
  }

  document.getElementById('undertoneSel').onchange = e => {
    state.undertone = e.target.value;
    state.blackForbidden = true;
    render();
    saveAndBroadcast('Front-03 alt ton degisti -> yeni imza koyu renk 8 konsepte yayildi');
  };
  document.getElementById('kelIn').oninput = e => {
    state.kelvin = Number(e.target.value);
    render();
    saveAndBroadcast('Front-03 Kelvin isik sicakligi degisti');
  };
  document.getElementById('lockAllBtn').onclick = () => {
    state.blackForbidden = true;
    render();
    saveAndBroadcast('Front-03 Siyah yasagi tum 8 konsepte muhurlendi');
  };
  render();
  appendLog({ jumps: state.jumps, neden: 'Front-03 Kroma Aynasi acildi', ...state });

