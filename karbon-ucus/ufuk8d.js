/* ufuk8d.js — Zero-Google-Maps Lowkey 3D Steerable Silk-Wing Flight + 360 Orbit + AFAIR_GPT_API */
(() => {
  'use strict';
  const TOWERS = [{"id": 0, "name": "Kule 1 · Watergarden", "from": "43. Kat Çatı (+148m)", "to": "Watergarden AVM & Sanat", "color": "#c89b54", "tx": -210, "tz": -55}, {"id": 1, "name": "Kule 2 · Finanskent", "from": "35. Kat Çatı (+121m)", "to": "Finanskent Fırsat & Elektronik", "color": "#6ba6b8", "tx": 205, "tz": -135}, {"id": 2, "name": "Kule 3 · Maltepe Sahil", "from": "25. Kat Çatı (+88m)", "to": "Sahil Konser & Spor Alanı", "color": "#4d8b7a", "tx": -95, "tz": 215}, {"id": 3, "name": "Üst Halka · İstanbul", "from": "Termik Yükseliş (+420m)", "to": "Başka İstanbul Yok · Tüm Şehir", "color": "#a86b8c", "tx": 20, "tz": -210}];
  const st = {
    towerIdx: 0,
    progress: 0.08,
    autoFly: true,
    steerX: 0,
    steerY: 0,
    camYaw: 18,
    camPitch: 16,
    wind: 110,
    bookings: []
  };

  const qs = new URLSearchParams(location.search);
  if (qs.has('tower')) st.towerIdx = Math.max(0, Math.min(3, parseInt(qs.get('tower'), 10) || 0));
  if (qs.has('yaw')) st.camYaw = parseFloat(qs.get('yaw')) || 18;

  const cv = document.getElementById('flightCanvas');
  const ctx = cv.getContext('2d');
  let down = false, lx = 0, ly = 0, tClock = 0;

  cv.addEventListener('pointerdown', e => { down = true; lx = e.clientX; ly = e.clientY; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY;
    st.steerX = Math.max(-95, Math.min(95, st.steerX + dx * 0.45));
    st.steerY = Math.max(-55, Math.min(55, st.steerY - dy * 0.35));
    st.camYaw = ((st.camYaw + dx * 0.22) % 360 + 360) % 360;
    syncUI();
  });
  window.addEventListener('pointerup', () => { down = false; });
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') st.steerX = Math.max(-95, st.steerX - 12);
    if (e.key === 'ArrowRight' || e.key === 'd') st.steerX = Math.min(95, st.steerX + 12);
    if (e.key === 'ArrowUp' || e.key === 'w') st.steerY = Math.min(55, st.steerY + 10);
    if (e.key === 'ArrowDown' || e.key === 's') st.steerY = Math.max(-55, st.steerY - 10);
  });

  document.querySelectorAll('[data-tower]').forEach(b => {
    b.addEventListener('click', () => {
      st.towerIdx = parseInt(b.dataset.tower, 10);
      st.progress = 0.02; st.steerX = 0; st.steerY = 0; st.autoFly = true;
      syncUI();
    });
  });
  const rOrbit = document.getElementById('rngOrbit');
  if (rOrbit) rOrbit.addEventListener('input', e => { st.camYaw = parseFloat(e.target.value); syncUI(); });
  const rProg = document.getElementById('rngProg');
  if (rProg) rProg.addEventListener('input', e => { st.autoFly = false; st.progress = parseFloat(e.target.value) / 100; syncUI(); });
  const bPlay = document.getElementById('btnPlay');
  if (bPlay) bPlay.addEventListener('click', () => { st.autoFly = !st.autoFly; syncUI(); });

  document.querySelectorAll('[data-book]').forEach(btn => {
    btn.addEventListener('click', () => {
      const svc = btn.dataset.book;
      const code = 'ATA-' + Math.abs((Date.now() % 89999) + 10000);
      st.bookings.push({ service: svc, tower: TOWERS[st.towerIdx].name, code });
      const out = document.getElementById('msg-' + svc);
      if (out) out.textContent = `✓ Hazır (${code})`;
      syncUI();
    });
  });

  function syncUI() {
    document.querySelectorAll('[data-tower]').forEach((b, i) => b.classList.toggle('on', i === st.towerIdx));
    if (bPlay) bPlay.textContent = st.autoFly ? '⏸ Havada Durdur' : '▶ Süzülüşü Sürdür';
    const sub = document.getElementById('routeSub');
    if (sub) sub.textContent = `${TOWERS[st.towerIdx].from} ➔ ${TOWERS[st.towerIdx].to} · Parmağınla veya ok tuşlarıyla yönlendir`;
    const stEl = document.getElementById('afair-gpt-state');
    if (stEl) stEl.textContent = JSON.stringify(st);
  }

  function proj(x, y, z, w, h) {
    const yr = st.camYaw * Math.PI / 180;
    const cy = Math.cos(yr), sy = Math.sin(yr);
    const rx = x * cy - z * sy;
    const rz = x * sy + z * cy + 540;
    const f = 510 / Math.max(85, rz);
    return [w * 0.5 + rx * f, h * 0.62 - y * f, f];
  }

  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(cv.clientWidth * dpr), h = Math.floor(cv.clientHeight * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    tClock += 0.025;
    if (st.autoFly) {
      st.progress += 0.0038;
      if (st.progress > 1) st.progress = 0.02;
      if (rProg) rProg.value = Math.round(st.progress * 100);
    }
    st.steerX *= 0.985; st.steerY *= 0.985;

    // Lowkey charismatic night-velvet sky (strictly >= #0d0f14, zero #000000!)
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0e1017'); g.addColorStop(0.55, '#171420'); g.addColorStop(1, '#11151e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // Woven silk-horizon contours (Zero Google Maps!)
    for (let z = -260; z <= 280; z += 24) {
      ctx.beginPath();
      ctx.strokeStyle = z > 110 ? 'rgba(107,166,184,0.22)' : 'rgba(185,153,107,0.14)';
      ctx.lineWidth = 1.2 * dpr;
      for (let x = -380; x <= 380; x += 26) {
        const wave = Math.sin(x * 0.025 + tClock * 1.6) * 5 + Math.cos(z * 0.03) * 6;
        const [px, py] = proj(x, wave - 36, z, w, h);
        if (x === -380) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // 3 Illuminated Towers of Ataşehir Modern (43F, 35F, 25F) with soft floor shadows
    const tDefs = [[-38, 138, 0, 'Kule 1 · 43K'], [6, 112, -20, 'Kule 2 · 35K'], [48, 84, 16, 'Kule 3 · 25K']];
    tDefs.forEach(([tx, th, tz, lbl], idx) => {
      const [bx, by, bsc] = proj(tx, -34, tz, w, h);
      const [rx, ry] = proj(tx, th - 34, tz, w, h);
      const tw = Math.max(16, 30 * bsc) * dpr * 0.65;
      const active = idx === st.towerIdx;
      ctx.fillStyle = active ? '#2a2433' : '#191b26';
      ctx.strokeStyle = active ? TOWERS[idx].color : 'rgba(236,230,218,0.18)';
      ctx.lineWidth = (active ? 2 : 1) * dpr;
      ctx.beginPath(); ctx.rect(rx - tw / 2, ry, tw, by - ry); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(236,230,218,0.78)';
      ctx.font = `${11 * dpr}px -apple-system,sans-serif`;
      ctx.fillText(lbl, rx - tw * 0.7, ry - 8 * dpr);
    });

    // Destination Beacons
    TOWERS.forEach((tw, idx) => {
      const dy = idx === 3 ? 130 : -28;
      const [px, py, sc] = proj(tw.tx, dy, tw.tz, w, h);
      ctx.fillStyle = tw.color;
      ctx.beginPath(); ctx.arc(px, py, (idx === st.towerIdx ? 8 : 4.5) * sc * dpr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = idx === st.towerIdx ? '#ece6da' : 'rgba(236,230,218,0.55)';
      ctx.font = `${12 * dpr}px Georgia,serif`;
      ctx.fillText(tw.to, px + 10 * dpr, py + 4 * dpr);
    });

    // Steerable Flight Curve + Glowing Rings + Rippling Silk Wing
    const start = st.towerIdx < 3 ? tDefs[st.towerIdx] : [6, 138, -10];
    const dest = TOWERS[st.towerIdx];
    const p0 = [start[0], start[1] - 32, start[2]];
    const p2 = [dest.tx, st.towerIdx === 3 ? 130 : -24, dest.tz];
    const p1 = [(p0[0] + p2[0]) * 0.5 + st.steerX * 1.4, Math.max(p0[1], p2[1]) + 58 + st.steerY, (p0[2] + p2[2]) * 0.5];

    const ptAt = u => [
      (1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0],
      (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1],
      (1 - u) * (1 - u) * p0[2] + 2 * (1 - u) * u * p1[2] + u * u * p2[2]
    ];

    ctx.beginPath(); ctx.strokeStyle = dest.color; ctx.lineWidth = 2.2 * dpr;
    for (let s = 0; s <= 32; s++) {
      const [qx, qy] = proj(...ptAt(s / 32), w, h);
      if (s === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
    }
    ctx.stroke();

    [0.25, 0.52, 0.78].forEach(ru => {
      const [hx, hy, hsc] = proj(...ptAt(ru), w, h);
      ctx.strokeStyle = 'rgba(126,196,173,0.72)'; ctx.lineWidth = 2.2 * dpr;
      ctx.beginPath(); ctx.ellipse(hx, hy, Math.max(9, 22 * hsc) * dpr, Math.max(14, 30 * hsc) * dpr, 0.18, 0, Math.PI * 2); ctx.stroke();
    });

    // Rippling 8D Silk Wing Flyer (reacts to wind + user steering bank angle!)
    const [fx, fy, fsc] = proj(...ptAt(st.progress), w, h);
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(st.steerX * 0.008);
    const span = Math.max(18, 34 * fsc) * dpr;
    ctx.fillStyle = dest.color;
    ctx.beginPath();
    ctx.moveTo(0, -span * 0.36);
    for (let k = -6; k <= 6; k++) {
      const wx = (k / 6) * span;
      const wy = span * 0.28 + Math.sin(tClock * 4.5 + k * 0.9) * (3.2 * dpr);
      ctx.lineTo(wx, wy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ece6da';
    ctx.beginPath(); ctx.arc(0, -span * 0.22, 3.8 * dpr, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    requestAnimationFrame(draw);
  }

  window.AFAIR_GPT_API = {
    version: '2.0',
    purpose: () => ({ scene: 'Atasehir 3-Tower Steerable Flight & Baska Istanbul Yok', zeroGoogleMaps: true, pureBlackVeto: true }),
    getState: () => ({ ...st, activeRoute: TOWERS[st.towerIdx] }),
    selectTower: (idx) => { st.towerIdx = Math.max(0, Math.min(3, Number(idx) || 0)); st.progress = 0.02; syncUI(); return window.AFAIR_GPT_API.getState(); },
    steerFlight: (dx = 0, dy = 0, progress = null) => { st.steerX = Math.max(-95, Math.min(95, Number(dx))); st.steerY = Math.max(-55, Math.min(55, Number(dy))); if (progress !== null) { st.autoFly = false; st.progress = Math.max(0, Math.min(1, Number(progress))); } syncUI(); return window.AFAIR_GPT_API.getState(); },
    setOrbit360: (yaw) => { st.camYaw = ((Number(yaw) || 0) % 360 + 360) % 360; syncUI(); return window.AFAIR_GPT_API.getState(); },
    book: (service) => { const code = 'ATA-GPT-' + Math.abs((Date.now() % 89999) + 10000); st.bookings.push({ service, code }); syncUI(); return { ok: true, code }; }
  };

  syncUI();
  draw();
})();
