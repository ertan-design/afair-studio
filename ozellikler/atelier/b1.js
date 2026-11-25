
const canvas = document.getElementById('cloth');
const gl = canvas.getContext('webgl', {antialias:true, alpha:false, powerPreference:'high-performance'});

const FABRICS = [
  {label:'19-4024 · GECE LACİVERTİ İPEK', base:[0.09,0.16,0.28], sheen:[0.58,0.68,0.86], rim:[0.82,0.68,0.46], spec:38.0},
  {label:'11-0602 · KIRIK KEMİK KETEN',   base:[0.74,0.70,0.62], sheen:[0.96,0.93,0.86], rim:[0.90,0.78,0.58], spec:14.0},
  {label:'18-5633 · ZÜMRÜT KADİFE',       base:[0.07,0.29,0.22], sheen:[0.32,0.72,0.56], rim:[0.86,0.74,0.48], spec:22.0},
  {label:'17-1340 · SICAK BRONZ ORGANZE', base:[0.44,0.28,0.15], sheen:[0.94,0.76,0.52], rim:[0.98,0.86,0.66], spec:48.0}
];
let fabIdx = 0;

function sh(t, s){ const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
const prog = gl.createProgram();
gl.attachShader(prog, sh(gl.VERTEX_SHADER, `
  attribute vec2 aUV;
  uniform mat4 uMVP;
  uniform float uTime, uWind, u8D, uPulseT;
  uniform vec2 uPulseUV;
  varying vec3 vPos, vNorm;
  varying vec2 vUV;

  vec3 evalCloth(vec2 uv){
    float x = (uv.x - 0.5) * 4.4;
    float y = (uv.y - 0.5) * 2.9;
    float w = uWind;
    float t = uTime * (1.2 + w * 1.1);

    // Multi-harmonic realistic wind fabric waves
    float z = sin(x * 1.65 - t * 1.5) * 0.24 * w
            + cos(y * 2.2 + x * 0.9 - t * 1.1) * 0.14 * w
            + sin((x + y) * 3.4 - t * 2.2) * 0.055 * w;

    // 8D Surreal levitation & silk ribbon twist
    float twist = u8D * sin(uv.x * 3.14159) * 0.85;
    float ang = twist * (uv.y - 0.5) * 2.2 + u8D * 0.35 * sin(t * 0.6 + x);
    float ny = y * cos(ang) - z * sin(ang);
    float nz = y * sin(ang) + z * cos(ang);

    // User pointer/touch ripple impulse
    float d = length(uv - uPulseUV);
    float age = max(0.0, uTime - uPulseT);
    float rip = exp(-d * 7.5) * exp(-age * 2.2) * sin(d * 26.0 - age * 14.0) * 0.32;
    nz += rip;

    // Subtle wind billow arch
    nz += (1.0 - pow(uv.x - 0.5, 2.0) * 3.2) * 0.22 * (0.4 + 0.6 * w);
    return vec3(x, ny, nz);
  }

  void main(){
    vUV = aUV;
    vec3 p  = evalCloth(aUV);
    vec3 px = evalCloth(aUV + vec2(0.008, 0.0));
    vec3 py = evalCloth(aUV + vec2(0.0, 0.008));
    vPos = p;
    vNorm = normalize(cross(px - p, py - p));
    gl_Position = uMVP * vec4(p, 1.0);
  }
`));
gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, `
  precision mediump float;
  uniform vec3 uEye, uLight, uBase, uSheen, uRim;
  uniform float uSpec;
  varying vec3 vPos, vNorm;
  varying vec2 vUV;

  void main(){
    vec3 N = normalize(vNorm);
    if(!gl_FrontFacing) N = -N;
    vec3 V = normalize(uEye - vPos);
    vec3 L = normalize(uLight - vPos);
    vec3 H = normalize(L + V);

    // Micro woven thread texture (warp + weft)
    float weave = 0.94 + 0.06 * sin(vUV.x * 260.0) * sin(vUV.y * 260.0);

    // Low-key dramatic directional light + deep sculptural shadow folds
    float ndl = max(dot(N, L), 0.0);
    float shadowFold = smoothstep(-0.25, 0.85, dot(N, L));
    float spec = pow(max(dot(N, H), 0.0), uSpec) * (0.45 + 0.55 * shadowFold);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    // Subtle cool back-fill for depth (no dead flat black)
    float backFill = max(dot(N, normalize(vec3(-2.5, -1.0, -3.0))), 0.0) * 0.16;

    vec3 col = uBase * (0.14 + 0.88 * shadowFold + backFill) * weave;
    col += uSheen * spec * 0.52;
    col += uRim * fres * 0.34;

    // Soft silk edge vignette
    float edge = smoothstep(0.0, 0.025, vUV.x) * smoothstep(0.0, 0.025, 1.0 - vUV.x)
               * smoothstep(0.0, 0.025, vUV.y) * smoothstep(0.0, 0.025, 1.0 - vUV.y);
    col *= (0.72 + 0.28 * edge);

    gl_FragColor = vec4(col, 1.0);
  }
`));
gl.linkProgram(prog);
gl.useProgram(prog);

// High-density 96 x 64 Cloth Mesh (6,144 vertices)
const GX = 96, GY = 64;
const uvs = [], idx = [];
for(let j=0;j<=GY;j++){
  for(let i=0;i<=GX;i++) uvs.push(i/GX, j/GY);
}
for(let j=0;j<GY;j++){
  for(let i=0;i<GX;i++){
    const a = j*(GX+1)+i, b = a+1, c = a+(GX+1), d = c+1;
    idx.push(a,b,c, b,d,c);
  }
}
const bUV = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bUV); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
const bIX = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIX); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
const locUV = gl.getAttribLocation(prog, 'aUV');
gl.enableVertexAttribArray(locUV);
gl.vertexAttribPointer(locUV, 2, gl.FLOAT, false, 0, 0);

const U = {};
['uMVP','uTime','uWind','u8D','uPulseT','uPulseUV','uEye','uLight','uBase','uSheen','uRim','uSpec'].forEach(k => U[k] = gl.getUniformLocation(prog, k));

function persp(fov, asp, n, f){ const t=1/Math.tan(fov/2), nf=1/(n-f); return new Float32Array([t/asp,0,0,0, 0,t,0,0, 0,0,(f+n)*nf,-1, 0,0,2*f*n*nf,0]); }
function lookAt(ex,ey,ez){
  let zx=ex, zy=ey, zz=ez, l=Math.hypot(zx,zy,zz)||1; zx/=l; zy/=l; zz/=l;
  let xx=zz, xy=0, xz=-zx; l=Math.hypot(xx,xy,xz)||1; xx/=l; xz/=l;
  let yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
  return new Float32Array([xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0, -(xx*ex+xy*ey+xz*ez), -(yx*ex+yy*ey+yz*ez), -(zx*ex+zy*ey+zz*ez), 1]);
}
function mul(a,b){ const o=new Float32Array(16); for(let c=0;c<4;c++) for(let r=0;r<4;r++) o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3]; return o; }

let yaw = 0.25, pitch = 0.14, dist = 5.1;
let tYaw = yaw, tPitch = pitch, tDist = dist;
let drag = false, lx = 0, ly = 0, pulseT = -10, pulseUV = [0.5, 0.5];
let startT = performance.now();

canvas.addEventListener('pointerdown', e => {
  drag = true; lx = e.clientX; ly = e.clientY;
  pulseUV = [e.clientX / window.innerWidth, 1.0 - e.clientY / window.innerHeight];
  pulseT = (performance.now() - startT) * 0.001;
});
window.addEventListener('pointerup', () => drag = false);
window.addEventListener('pointermove', e => {
  if(!drag) return;
  tYaw -= (e.clientX - lx) * 0.0085; // Full unrestricted 360-degree orbit!
  tPitch = Math.max(-1.15, Math.min(1.15, tPitch + (e.clientY - ly) * 0.007));
  lx = e.clientX; ly = e.clientY;
});
canvas.addEventListener('wheel', e => { tDist = Math.max(2.6, Math.min(9.0, tDist + e.deltaY * 0.003)); }, {passive:true});

document.getElementById('btnReset').addEventListener('click', () => { tYaw = 0.25; tPitch = 0.14; tDist = 5.1; });
document.getElementById('swatches').addEventListener('click', e => {
  const b = e.target.closest('[data-f]'); if(!b) return;
  fabIdx = parseInt(b.dataset.f, 10);
  document.querySelectorAll('.dot').forEach((x,i) => x.classList.toggle('on', i === fabIdx));
  document.getElementById('fabricLabel').textContent = FABRICS[fabIdx].label;
  pulseUV = [0.5, 0.5]; pulseT = (performance.now() - startT) * 0.001;
});

const sWind = document.getElementById('sWind');
const s8d = document.getElementById('s8d');
const sLight = document.getElementById('sLight');

function loop(now){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.floor(window.innerWidth * dpr), h = Math.floor(window.innerHeight * dpr);
  if(canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
  gl.viewport(0, 0, w, h);

  const sec = (now - startT) * 0.001;
  if(!drag) tYaw += 0.0014;
  yaw += (tYaw - yaw) * 0.08;
  pitch += (tPitch - pitch) * 0.08;
  dist += (tDist - dist) * 0.08;

  const ex = Math.sin(yaw) * Math.cos(pitch) * dist;
  const ey = Math.sin(pitch) * dist;
  const ez = Math.cos(yaw) * Math.cos(pitch) * dist;
  const MVP = mul(persp(0.82, w / Math.max(h, 1), 0.1, 40.0), lookAt(ex, ey, ez));

  const la = parseFloat(sLight.value) * Math.PI / 180.0;
  const fab = FABRICS[fabIdx];

  gl.enable(gl.DEPTH_TEST);
  // Low-key charismatic midnight-navy twilight (never flat #000000)
  gl.clearColor(0.039, 0.058, 0.11, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(U.uMVP, false, MVP);
  gl.uniform1f(U.uTime, sec);
  gl.uniform1f(U.uWind, parseFloat(sWind.value) / 100.0);
  gl.uniform1f(U.u8D, parseFloat(s8d.value) / 100.0);
  gl.uniform1f(U.uPulseT, pulseT);
  gl.uniform2f(U.uPulseUV, pulseUV[0], pulseUV[1]);
  gl.uniform3f(U.uEye, ex, ey, ez);
  gl.uniform3f(U.uLight, Math.cos(la) * 4.5, 2.2, Math.sin(la) * 4.5);
  gl.uniform3fv(U.uBase, fab.base);
  gl.uniform3fv(U.uSheen, fab.sheen);
  gl.uniform3fv(U.uRim, fab.rim);
  gl.uniform1f(U.uSpec, fab.spec);

  gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
