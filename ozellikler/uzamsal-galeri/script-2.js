
const canvas = document.getElementById('gl');
const gl = canvas.getContext('webgl', {antialias:true, alpha:false, powerPreference:'high-performance'});
const v1 = document.getElementById('v1');
const v2 = document.getElementById('v2');
[v1, v2].forEach(v => v.play().catch(()=>{}));
window.addEventListener('pointerdown', () => [v1, v2].forEach(v => v.play().catch(()=>{})), {once:true});

const PALETTES = [
  {name:'Gece Laciverti & Bronz', bg:[0.035,0.062,0.145], grid:[0.83,0.68,0.44], part:[0.95,0.82,0.58]},
  {name:'Zumrut & Kirik Kemik', bg:[0.025,0.105,0.095], grid:[0.16,0.78,0.58], part:[0.96,0.94,0.88]},
  {name:'Murdum & Sicak Altin', bg:[0.095,0.045,0.145], grid:[0.88,0.66,0.36], part:[0.82,0.72,0.98]}
];
let palIdx = 0;

const STAGES = [
  {yaw:-0.36, pitch:0.06, dist:5.4, tx:-1.7, ty:1.35, tz:0.0, url:'https://www.afair.live/', tag:'SAHNE 01 · AFAIR.LIVE × IKI MEZURA', title:'Eve Gelen Iki Mezura · 3D Canli Monolit', desc:'Sol monolit, afair.live icin uretilen gercek H.264 Higgsfield Seedance / yerel sinema klibini 60 FPS WebGL dokusu ve zemin yansimasiyla oynatir.'},
  {yaw:0.36, pitch:0.06, dist:5.4, tx:1.7, ty:1.35, tz:0.0, url:'https://www.afair.studio/', tag:'SAHNE 02 · AFAIR.STUDIO × AI GALERI ART', title:'AI Galeri Art · Kumas & Siluet Sahnesi', desc:'Sag monolit, afair.studio galerisindeki soyut zumrut-bronz eserin ipek siluete donusumunu gercek zamanli 3D uzayda sergiler.'},
  {yaw:0.0, pitch:0.28, dist:9.8, tx:0.0, ty:1.1, tz:-1.2, url:'https://www.xn--ataehirmodern-ktc.com/', tag:'SAHNE 03 · ATASEHIR 3D KENT & MIMARI', title:'Teknoloji Sirketi Vizyonu: 3D Mimari Zemin', desc:'Derinlik sisli 3D izgara, ayna yansimali zemin, 450 uzamsal parcacik ve cift monolit mimarisi — sifir harici CDN, saf WebGL motoru.'},
  {yaw:0.0, pitch:0.12, dist:7.6, tx:0.0, ty:1.35, tz:0.0, url:'https://ertanaraz.com/dila-senkron', tag:'SAHNE 04 · GENEL VR KUS BAKISI', title:'2D Kartlar Bitti. 3D Uzamsal Galeriye Hos Geldin.', desc:'Surukle (orbit), tekerlekle yaklas, WASD ile uc veya VR Stereo moduna gec. 8 senkron konseptin tamami bu 3D sahneye bagli.'}
];
const FEEDS = [
  {name:'Higgsfield Seedance', a:'/prizma/video/HF_01_GALERIDE_IPEK_FASTSTART.mp4', b:'/prizma/video/HF_02_TERZININ_DOKUNUSU_FASTSTART.mp4'},
  {name:'Yerel Sinema H.264', a:'/dila_01_afair_live_iki_mezura.mp4', b:'/dila_02_afair_studio_galeri_art.mp4'}
];
let feedIdx = 0;

function compile(type, src){
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}
function makeProg(vs, fs){
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  return p;
}

const pColor = makeProg(
  `attribute vec3 aPos; uniform mat4 uMVP; uniform float uPt;
   void main(){ gl_Position = uMVP * vec4(aPos,1.0); gl_PointSize = uPt; }`,
  `precision mediump float; uniform vec4 uCol;
   void main(){ gl_FragColor = uCol; }`
);

const pTex = makeProg(
  `attribute vec3 aPos; attribute vec2 aUV; uniform mat4 uMVP; varying vec2 vUV;
   void main(){ vUV = aUV; gl_Position = uMVP * vec4(aPos,1.0); }`,
  `precision mediump float; uniform sampler2D uTex; uniform vec3 uTint; uniform float uAlpha; varying vec2 vUV;
   void main(){
     vec4 c = texture2D(uTex, vUV);
     float edge = smoothstep(0.0, 0.035, vUV.x) * smoothstep(0.0, 0.035, 1.0 - vUV.x)
                * smoothstep(0.0, 0.05, vUV.y) * smoothstep(0.0, 0.05, 1.0 - vUV.y);
     vec3 frame = mix(uTint, c.rgb, edge);
     float fade = uAlpha < 0.99 ? (uAlpha * (1.0 - vUV.y) * 0.75) : 1.0;
     gl_FragColor = vec4(frame, fade);
   }`
);

// Matrix helpers (column-major)
function persp(fov, asp, n, f){
  const t = 1 / Math.tan(fov / 2), nf = 1 / (n - f);
  return new Float32Array([t/asp,0,0,0, 0,t,0,0, 0,0,(f+n)*nf,-1, 0,0,2*f*n*nf,0]);
}
function lookAt(ex,ey,ez, cx,cy,cz){
  let zx=ex-cx, zy=ey-cy, zz=ez-cz;
  let l=Math.hypot(zx,zy,zz)||1; zx/=l; zy/=l; zz/=l;
  let xx=zz, xy=0, xz=-zx;
  l=Math.hypot(xx,xy,xz)||1; xx/=l; xz/=l;
  let yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
  return new Float32Array([
    xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0,
    -(xx*ex+xy*ey+xz*ez), -(yx*ex+yy*ey+yz*ez), -(zx*ex+zy*ey+zz*ez), 1
  ]);
}
function mul(a,b){
  const o = new Float32Array(16);
  for(let c=0;c<4;c++) for(let r=0;r<4;r++)
    o[c*4+r] = a[r]*b[c*4] + a[4+r]*b[c*4+1] + a[8+r]*b[c*4+2] + a[12+r]*b[c*4+3];
  return o;
}
function modelMat(x,y,z, ry){
  const c=Math.cos(ry), s=Math.sin(ry);
  return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, x,y,z,1]);
}

// 3D Floor grid buffer
const gridVerts = [];
for(let i=-16;i<=16;i++){
  gridVerts.push(i,0,-16, i,0,16, -16,0,i, 16,0,i);
}
const bGrid = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, bGrid);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridVerts), gl.STATIC_DRAW);

// 450 3D Constellation particles
const partVerts = [];
for(let i=0;i<450;i++){
  const a = i * 2.39996;
  const r = 2.8 + (i % 37) * 0.34;
  partVerts.push(Math.cos(a)*r, 0.3 + ((i*17)%100)*0.065, Math.sin(a)*r);
}
const bPart = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, bPart);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(partVerts), gl.STATIC_DRAW);

// 16:9 Cinema Monolith Quad (3.2 x 1.8)
const qPos = new Float32Array([-1.6,-0.9,0, 1.6,-0.9,0, -1.6,0.9,0, 1.6,0.9,0]);
const qUV  = new Float32Array([0,1, 1,1, 0,0, 1,0]);
const bQPos = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bQPos); gl.bufferData(gl.ARRAY_BUFFER, qPos, gl.STATIC_DRAW);
const bQUV  = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bQUV);  gl.bufferData(gl.ARRAY_BUFFER, qUV, gl.STATIC_DRAW);

// Wireframe pedestal/halo ring under monoliths
const haloVerts = [];
for(let i=0;i<64;i++){
  const a1 = (i/64)*Math.PI*2, a2 = ((i+1)/64)*Math.PI*2;
  haloVerts.push(Math.cos(a1)*4.2, 0.02, Math.sin(a1)*4.2, Math.cos(a2)*4.2, 0.02, Math.sin(a2)*4.2);
}
const bHalo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bHalo); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(haloVerts), gl.STATIC_DRAW);

function makeTex(){
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([18,32,68,255]));
  return t;
}
const tex1 = makeTex(), tex2 = makeTex();

let yaw = 0.0, pitch = 0.12, dist = 7.6, tx = 0, ty = 1.35, tz = 0;
let tYaw = yaw, tPitch = pitch, tDist = dist, tTx = tx, tTy = ty, tTz = tz;
let autoOrbit = true, vrMode = false, drag = false, lx = 0, ly = 0;

canvas.addEventListener('pointerdown', e => { drag=true; lx=e.clientX; ly=e.clientY; autoOrbit=false; document.getElementById('btnAuto').classList.remove('on'); });
window.addEventListener('pointerup', () => drag=false);
window.addEventListener('pointermove', e => {
  if(!drag) return;
  tYaw -= (e.clientX - lx) * 0.006;
  tPitch = Math.max(-0.25, Math.min(0.85, tPitch + (e.clientY - ly) * 0.005));
  lx = e.clientX; ly = e.clientY;
});
canvas.addEventListener('wheel', e => { tDist = Math.max(3.2, Math.min(14.5, tDist + e.deltaY * 0.004)); }, {passive:true});

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if(k==='w'||k==='arrowup') tDist = Math.max(3.2, tDist - 0.5);
  if(k==='s'||k==='arrowdown') tDist = Math.min(14.5, tDist + 0.5);
  if(k==='a'||k==='arrowleft') { autoOrbit=false; tYaw -= 0.18; }
  if(k==='d'||k==='arrowright') { autoOrbit=false; tYaw += 0.18; }
});

document.getElementById('btnAuto').addEventListener('click', e => { autoOrbit=!autoOrbit; e.target.classList.toggle('on', autoOrbit); });
document.getElementById('btnVR').addEventListener('click', e => { vrMode=!vrMode; e.target.classList.toggle('on', vrMode); document.body.classList.toggle('vr', vrMode); document.getElementById('modeTxt').textContent = vrMode ? 'VR STEREO' : 'SPATIAL'; });
document.getElementById('btnPalette').addEventListener('click', e => { palIdx=(palIdx+1)%PALETTES.length; e.target.textContent = 'Palet: ' + PALETTES[palIdx].name; });
document.getElementById('btnFeed').addEventListener('click', e => {
  feedIdx = (feedIdx + 1) % FEEDS.length;
  const f = FEEDS[feedIdx];
  v1.src = f.a; v2.src = f.b;
  v1.play().catch(()=>{}); v2.play().catch(()=>{});
  e.target.textContent = 'Akis: ' + f.name;
});
document.getElementById('portalBtns').addEventListener('click', e => {
  const b = e.target.closest('[data-cam]'); if(!b) return;
  document.querySelectorAll('.pbtn').forEach(x=>x.classList.remove('on')); b.classList.add('on');
  const st = STAGES[parseInt(b.dataset.cam,10)];
  autoOrbit = (parseInt(b.dataset.cam,10) === 3);
  document.getElementById('btnAuto').classList.toggle('on', autoOrbit);
  tYaw=st.yaw; tPitch=st.pitch; tDist=st.dist; tTx=st.tx; tTy=st.ty; tTz=st.tz;
  document.getElementById('stageTag').textContent = st.tag;
  document.getElementById('stageTitle').textContent = st.title;
  document.getElementById('stageDesc').textContent = st.desc;
  document.getElementById('btnEnter').href = st.url;
});

function drawEye(vpX, vpY, vpW, vpH, eyeOffset, now){
  gl.viewport(vpX, vpY, vpW, vpH);
  const P = persp(0.95, vpW / Math.max(vpH, 1), 0.1, 60.0);
  const ex = tx + Math.sin(yaw)*Math.cos(pitch)*dist + Math.cos(yaw)*eyeOffset;
  const ey = ty + Math.sin(pitch)*dist;
  const ez = tz + Math.cos(yaw)*Math.cos(pitch)*dist - Math.sin(yaw)*eyeOffset;
  const V = lookAt(ex, ey, ez, tx, ty, tz);
  const VP = mul(P, V);
  const pal = PALETTES[palIdx];

  // Floor Grid + Halo + Particles
  gl.useProgram(pColor);
  const locP = gl.getAttribLocation(pColor, 'aPos');
  const uMVP = gl.getUniformLocation(pColor, 'uMVP');
  const uCol = gl.getUniformLocation(pColor, 'uCol');
  const uPt  = gl.getUniformLocation(pColor, 'uPt');
  gl.enableVertexAttribArray(locP);

  gl.uniformMatrix4fv(uMVP, false, VP);
  gl.uniform1f(uPt, 1.0);
  gl.uniform4f(uCol, pal.grid[0], pal.grid[1], pal.grid[2], 0.22);
  gl.bindBuffer(gl.ARRAY_BUFFER, bGrid);
  gl.vertexAttribPointer(locP, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.LINES, 0, gridVerts.length / 3);

  gl.uniform4f(uCol, pal.grid[0], pal.grid[1], pal.grid[2], 0.65);
  gl.bindBuffer(gl.ARRAY_BUFFER, bHalo);
  gl.vertexAttribPointer(locP, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.LINES, 0, haloVerts.length / 3);

  const pRot = mul(VP, modelMat(0, Math.sin(now*0.0005)*0.12, 0, now*0.00012));
  gl.uniformMatrix4fv(uMVP, false, pRot);
  gl.uniform1f(uPt, 3.0);
  gl.uniform4f(uCol, pal.part[0], pal.part[1], pal.part[2], 0.82);
  gl.bindBuffer(gl.ARRAY_BUFFER, bPart);
  gl.vertexAttribPointer(locP, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.POINTS, 0, partVerts.length / 3);

  // 2 Live 3D Cinema Video Monoliths
  gl.useProgram(pTex);
  const tp = gl.getAttribLocation(pTex, 'aPos');
  const tu = gl.getAttribLocation(pTex, 'aUV');
  const tMVP = gl.getUniformLocation(pTex, 'uMVP');
  const tTint = gl.getUniformLocation(pTex, 'uTint');
  const tAlpha = gl.getUniformLocation(pTex, 'uAlpha');
  gl.enableVertexAttribArray(tp);
  gl.enableVertexAttribArray(tu);
  gl.uniform3f(tTint, pal.grid[0], pal.grid[1], pal.grid[2]);

  const bob = Math.sin(now * 0.0014) * 0.07;
  const screens = [
    {tex:tex1, x:-1.95, y:1.45 + bob, z:-0.35, ry:0.24},
    {tex:tex2, x: 1.95, y:1.45 - bob, z:-0.35, ry:-0.24}
  ];
  gl.bindBuffer(gl.ARRAY_BUFFER, bQPos); gl.vertexAttribPointer(tp, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bQUV);  gl.vertexAttribPointer(tu, 2, gl.FLOAT, false, 0, 0);
  for(const sc of screens){
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sc.tex);
    // Mirrored floor reflection
    const rm = modelMat(sc.x, -sc.y + 0.15, sc.z, sc.ry);
    rm[5] = -1.0;
    gl.uniform1f(tAlpha, 0.32);
    gl.uniformMatrix4fv(tMVP, false, mul(VP, rm));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // Main floating monolith
    gl.uniform1f(tAlpha, 1.0);
    gl.uniformMatrix4fv(tMVP, false, mul(VP, modelMat(sc.x, sc.y, sc.z, sc.ry)));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

let frames=0, lastFps=performance.now();
function loop(now){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.floor(window.innerWidth * dpr), h = Math.floor(window.innerHeight * dpr);
  if(canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }

  if(autoOrbit) tYaw += 0.0022;
  yaw += (tYaw - yaw) * 0.07;
  pitch += (tPitch - pitch) * 0.07;
  dist += (tDist - dist) * 0.07;
  tx += (tTx - tx) * 0.07;
  ty += (tTy - ty) * 0.07;
  tz += (tTz - tz) * 0.07;

  let vReady = 0;
  if(v1.readyState >= 2){ gl.bindTexture(gl.TEXTURE_2D, tex1); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,v1); vReady++; }
  if(v2.readyState >= 2){ gl.bindTexture(gl.TEXTURE_2D, tex2); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,v2); vReady++; }

  const pal = PALETTES[palIdx];
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(pal.bg[0], pal.bg[1], pal.bg[2], 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if(vrMode){
    const hw = Math.floor(w / 2);
    drawEye(0, 0, hw, h, -0.09, now);
    drawEye(hw, 0, w - hw, h, 0.09, now);
  } else {
    drawEye(0, 0, w, h, 0.0, now);
  }

  frames++;
  if(now - lastFps >= 500){
    document.getElementById('fps').textContent = Math.round((frames * 1000) / (now - lastFps));
    document.getElementById('camTxt').textContent = `${tx.toFixed(1)}, ${ty.toFixed(1)}, ${dist.toFixed(1)}`;
    document.getElementById('vidTxt').textContent = vReady === 2 ? '2/2 MP4 HAZIR' : (vReady + '/2 HAZIRLANIYOR');
    frames = 0; lastFps = now;
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
