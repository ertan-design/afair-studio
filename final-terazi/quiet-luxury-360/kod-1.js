const c = document.getElementById('c');
const ctx = c.getContext('2d');
let W = c.width = innerWidth, H = c.height = innerHeight;
addEventListener('resize', () => { W = c.width = innerWidth; H = c.height = innerHeight; });

// 360° Orbital Camera + Interactive Wind Direction
let yaw = 0.35, pitch = 0.22, tYaw = 0.35, tPitch = 0.22;
let windDir = 0.0, drag = false, lx = 0, ly = 0;
c.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; ly = e.clientY; });
addEventListener('pointerup', () => drag = false);
addEventListener('pointermove', e => {
  windDir = ((e.clientX / W) - 0.5) * 1.4;
  if (!drag) return;
  tYaw += (e.clientX - lx) * 0.008;
  tPitch = Math.max(-0.85, Math.min(0.85, tPitch + (e.clientY - ly) * 0.006));
  lx = e.clientX; ly = e.clientY;
});

const PALETTES = {
  silk:    { r:216, g:190, b:148, spec:[255,244,220], irid:[110,190,220] },
  emerald: { r:34,  g:118, b:94,  spec:[165,245,215], irid:[215,180,115] },
  ivory:   { r:228, g:222, b:210, spec:[255,255,250], irid:[195,165,220] },
};
let pal = PALETTES.silk;
function setFabric(k, btn) {
  pal = PALETTES[k];
  document.querySelectorAll('.btns button').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
}

const COLS = 34, ROWS = 22;
let t = 0;

function project(x, y, z) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const x1 = x * cy - z * sy;
  const z1 = x * sy + z * cy;
  const y2 = y * cp - z1 * sp;
  const z2 = y * sp + z1 * cp + 620;
  const f = Math.min(W, H) * 0.88 / Math.max(120, z2);
  return { sx: W * 0.54 + x1 * f, sy: H * 0.45 + y2 * f, z: z2 };
}

function draw() {
  yaw += (tYaw - yaw) * 0.08;
  pitch += (tPitch - pitch) * 0.08;
  const wind = +document.getElementById('wind').value / 100;
  const lightMul = +document.getElementById('light').value / 100;
  const surreal = +document.getElementById('surreal').value / 100;
  t += 0.028 * (0.45 + wind * 0.9);

  ctx.clearRect(0, 0, W, H);
  // Subtle low-key spotlight behind cloth
  const grd = ctx.createRadialGradient(W * 0.54, H * 0.44, 20, W * 0.54, H * 0.44, Math.min(W, H) * 0.52);
  grd.addColorStop(0, `rgba(${pal.r},${pal.g},${pal.b},${0.16 * lightMul})`);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // Compute 3D cloth vertices with real multi-harmonic wind waves + gravity drape
  const grid = [];
  for (let j = 0; j <= ROWS; j++) {
    const row = [];
    const v = j / ROWS; // 0 = pinned top, 1 = free bottom hem
    for (let i = 0; i <= COLS; i++) {
      const u = i / COLS - 0.5;
      const drape = Math.pow(v, 1.25); // free movement increases toward bottom hem
      const x = u * 430 + Math.sin(v * 3.1 + t + windDir) * 18 * drape * wind;
      const y = (v - 0.5) * 320 + Math.cos(u * 6 + t * 0.9) * 10 * drape;
      const z =
        Math.sin(u * 8.5 - t * 1.45 + windDir * 2.2) * 44 * drape * wind +
        Math.cos(v * 6.2 - t * 1.15 + u * 4.0) * 26 * drape * (0.5 + wind * 0.7) +
        Math.sin((u * u + v * v) * 10 - t * 1.9) * 16 * surreal * drape;
      row.push({ x, y, z, p: project(x, y, z) });
    }
    grid.push(row);
  }

  // Painter's algorithm sorted quads with Lambertian + Fresnel shadow lighting
  const quads = [];
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const a = grid[j][i], b = grid[j][i+1], d = grid[j+1][i+1], e = grid[j+1][i];
      const ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z;
      const vx = e.x - a.x, vy = e.y - a.y, vz = e.z - a.z;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl; ny /= nl; nz /= nl;
      // Low-key key light from upper-left + soft rim
      const diff = Math.max(0.08, Math.abs(nx * -0.45 + ny * -0.35 + nz * 0.82));
      const spec = Math.pow(Math.max(0, Math.abs(nz)), 8) * 0.55;
      const depth = (a.p.z + b.p.z + d.p.z + e.p.z) * 0.25;
      quads.push({ a, b, d, e, diff, spec, depth, u: i / COLS, v: j / ROWS });
    }
  }
  quads.sort((q1, q2) => q2.depth - q1.depth);

  for (const q of quads) {
    const shade = Math.min(1.25, (0.14 + q.diff * 0.92) * lightMul);
    const ir = surreal * Math.sin(q.u * 9 + q.v * 7 + t) * 0.35;
    const R = Math.min(255, Math.max(0, pal.r * shade + pal.spec[0] * q.spec + pal.irid[0] * Math.max(0, ir)));
    const G = Math.min(255, Math.max(0, pal.g * shade + pal.spec[1] * q.spec + pal.irid[1] * Math.max(0, ir)));
    const B = Math.min(255, Math.max(0, pal.b * shade + pal.spec[2] * q.spec + pal.irid[2] * Math.max(0, ir)));
    ctx.fillStyle = `rgb(${R|0},${G|0},${B|0})`;
    ctx.beginPath();
    ctx.moveTo(q.a.p.sx, q.a.p.sy);
    ctx.lineTo(q.b.p.sx, q.b.p.sy);
    ctx.lineTo(q.d.p.sx, q.d.p.sy);
    ctx.lineTo(q.e.p.sx, q.e.p.sy);
    ctx.closePath();
    ctx.fill();
  }
  requestAnimationFrame(draw);
}
draw();
