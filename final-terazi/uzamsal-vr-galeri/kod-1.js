// 1. Volumetric 3D Starfield / Dust Particles on Background Canvas
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let W = canvas.width = window.innerWidth, H = canvas.height = window.innerHeight;
window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });
const pts = Array.from({length: 110}, () => ({
  x: (Math.random() - .5) * 1600,
  y: (Math.random() - .5) * 900,
  z: Math.random() * 1200 + 100,
  r: Math.random() * 2 + 0.8
}));

// 2. Smooth 3D Spatial Camera Controller (Drag + Wheel + WASD)
const world = document.getElementById('world');
const vp = document.getElementById('viewport');
let cam = { rx: -4, ry: 0, tx: 0, ty: 0, tz: 140 };
let target = { rx: -4, ry: 0, tx: 0, ty: 0, tz: 140 };
let dragging = false, lx = 0, ly = 0;

vp.addEventListener('pointerdown', e => { if (e.target.closest('.hud-top,.hud-bottom')) return; dragging = true; lx = e.clientX; ly = e.clientY; });
window.addEventListener('pointerup', () => dragging = false);
window.addEventListener('pointermove', e => {
  if (!dragging) return;
  target.ry += (e.clientX - lx) * 0.18;
  target.rx = Math.max(-28, Math.min(22, target.rx - (e.clientY - ly) * 0.14));
  lx = e.clientX; ly = e.clientY;
});
vp.addEventListener('wheel', e => {
  target.tz = Math.max(-260, Math.min(480, target.tz - e.deltaY * 0.45));
}, { passive: true });
window.addEventListener('keydown', e => {
  if (document.activeElement.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (k === 'w') target.tz = Math.min(480, target.tz + 45);
  if (k === 's') target.tz = Math.max(-260, target.tz - 45);
  if (k === 'a') target.ry += 8;
  if (k === 'd') target.ry -= 8;
});

function focusWall(which) {
  if (which === 'center') target = { rx: -3, ry: 0, tx: 0, ty: 10, tz: 240 };
  if (which === 'left')   target = { rx: -2, ry: -32, tx: 360, ty: 10, tz: 210 };
  if (which === 'right')  target = { rx: -2, ry: 32, tx: -360, ty: 10, tz: 210 };
}

function togglePalette(cls) {
  document.body.classList.remove('siyah-yasak', 'terracotta');
  document.body.classList.add(cls);
  document.getElementById('btnNoBlack').classList.toggle('active', cls === 'siyah-yasak');
  document.getElementById('btnTerra').classList.toggle('active', cls === 'terracotta');
}

function toggleVR() {
  document.body.classList.toggle('vr-mode');
  document.getElementById('btnVR').classList.toggle('active');
}

function tick() {
  cam.rx += (target.rx - cam.rx) * 0.08;
  cam.ry += (target.ry - cam.ry) * 0.08;
  cam.tx += (target.tx - cam.tx) * 0.08;
  cam.ty += (target.ty - cam.ty) * 0.08;
  cam.tz += (target.tz - cam.tz) * 0.08;
  world.style.transform = `translate3d(${cam.tx}px, ${cam.ty}px, ${cam.tz}px) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg)`;

  ctx.clearRect(0, 0, W, H);
  const gold = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#d4af7a';
  for (const p of pts) {
    p.z -= 1.6;
    if (p.z < 50) p.z = 1250;
    const scale = 600 / p.z;
    const sx = W / 2 + (p.x + cam.ry * 12) * scale;
    const sy = H / 2 + (p.y + cam.rx * 8) * scale;
    ctx.fillStyle = gold;
    ctx.globalAlpha = Math.min(0.75, scale * 0.55);
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(0.6, p.r * scale), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(tick);
}
tick();

// 3. Live One-Click Video Generation wired to Local RTX 3090 Video API
async function generateVideo() {
  const btn = document.getElementById('btnGen');
  const st = document.getElementById('statusLeft');
  const prompt = document.getElementById('promptInput').value.trim();
  const preset = document.getElementById('presetSel').value;
  btn.disabled = true;
  st.textContent = '⏳ RTX 3090 (h264_nvenc) ile canlı MP4 üretiliyor...';
  try {
    const r = await fetch('/api/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, preset, duration: 5 })
    });
    const j = await r.json();
    if (j.ok) {
      const vid = document.getElementById('vid-center');
      vid.src = j.url + '?t=' + Date.now();
      vid.play().catch(()=>{});
      focusWall('center');
      st.textContent = `✅ Üretildi: ${j.file} (${j.size_kb} KB · ${j.render_time_s} sn · ${j.encoder})`;
    } else {
      st.textContent = '❌ Hata: ' + (j.error || 'bilinmiyor');
    }
  } catch (err) {
    st.textContent = '❌ API bağlantı hatası: ' + err.message;
  } finally {
    btn.disabled = false;
  }
}
