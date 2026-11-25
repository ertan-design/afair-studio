'use strict';
(() => {
const $=id=>document.getElementById(id);
const cv=$('cloth'),gl=cv.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:false});
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const colors={apricode:[1,.714,.451],aqua:[.498,1,.831],blue:[.184,.373,.639],bitter:[1,.435,.38]};
const labels={silk:'İpeksi',linen:'Keten gibi',cotton:'Pamuksu',apricode:'Apricode',aqua:'aQuaMarine',blue:'Blue',bitter:'BITTerSweet'};
let running=!reduced,dream=false,yaw=0,pitch=-.06,distance=3.7,clock=0,last=0,raf=0,dirty=true,lost=false;
const N=38,M=30,COUNT=(N+1)*(M+1),positions=new Float32Array(COUNT*3),previous=new Float32Array(COUNT*3),rest=new Float32Array(COUNT*3),normals=new Float32Array(COUNT*3),uv=new Float32Array(COUNT*2),shadow=new Float32Array(COUNT*3),indices=[];
for(let y=0;y<=M;y++)for(let x=0;x<=N;x++){const k=y*(N+1)+x,p=k*3;positions[p]=(x/N-.5)*2.55;positions[p+1]=1.18-y/M*2.08;positions[p+2]=Math.sin(x*.7)*.015*(y/M);uv[k*2]=x/N;uv[k*2+1]=y/M;if(x<N&&y<M){const a=k,b=k+1,c=k+N+1,d=c+1;indices.push(a,c,b,b,c,d);}}
previous.set(positions);rest.set(positions);
const links=[];
function link(a,b,stiff){const i=a*3,j=b*3;links.push([i,j,Math.hypot(rest[i]-rest[j],rest[i+1]-rest[j+1],rest[i+2]-rest[j+2]),stiff]);}
for(let y=0;y<=M;y++)for(let x=0;x<=N;x++){const k=y*(N+1)+x;if(x<N)link(k,k+1,1);if(y<M)link(k,k+N+1,1);if(x<N&&y<M){link(k,k+N+2,.45);link(k+1,k+N+1,.45);}if(x<N-1)link(k,k+2,.18);}
function updateUI(){
$('motion').textContent=running?'Hareketi durdur':'Hareketi başlat';$('motion').setAttribute('aria-pressed',String(running));
$('dream').setAttribute('aria-pressed',String(dream));$('mode-label').textContent=dream?'RÜYA':'STÜDYO';
for(const id of ['wind','direction','light','angle'])$(id+'-value').textContent=$(id).value+(id==='wind'?'':'°');
$('selection').textContent=labels[$('material').value]+' · '+labels[$('color').value]+' · rüzgâr '+$('wind').value+(dream?' · rüya modu':'');
const state={schema:'afair.cloth-scene.v1',simulation:true,physical_sample_verified:false,material:$('material').value,color:$('color').value,wind:Number($('wind').value),wind_direction_deg:Number($('direction').value),light_deg:Number($('light').value),view_deg:Math.round(yaw*180/Math.PI)%360,running,dream};
if($('scene-state'))$('scene-state').textContent=JSON.stringify(state,null,2);
window.dispatchEvent(new CustomEvent('afair:studio-change',{detail:state}));
}
if(!gl){
$('render-status').textContent='Bu tarayıcı 3B yüzeyi açamadı. WebGL destekli bir tarayıcıda deneyebilirsin.';
for(const id of ['motion','dream','near','far','reset','wind','direction','light','angle','material','color'])$(id).disabled=true;
cv.setAttribute('aria-label','WebGL desteği bulunamadı; kumaş simülasyonu başlatılmadı.');return;
}
const vertex=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUV;uniform float uYaw,uPitch,uAspect,uDistance;varying vec3 vNormal,vPosition;varying vec2 vUV;
vec3 turn(vec3 p){float c=cos(uYaw),s=sin(uYaw);p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);float a=cos(uPitch),b=sin(uPitch);return vec3(p.x,a*p.y-b*p.z,b*p.y+a*p.z);}
void main(){vec3 p=turn(aPosition);p.y+=.06;float z=uDistance-p.z;gl_Position=vec4(p.x*1.85/uAspect,p.y*1.85,z*1.01005-.201005,z);vNormal=turn(aNormal);vPosition=p;vUV=aUV;}`;
const fragment=`precision mediump float;varying vec3 vNormal,vPosition;varying vec2 vUV;uniform vec3 uColor,uLight;uniform float uShine,uWeave,uPass;
void main(){if(uPass>1.5){gl_FragColor=vec4(.09,.12,.16,1.);return;}if(uPass>.5){float edge=smoothstep(0.,.05,vUV.x)*smoothstep(0.,.05,1.-vUV.x)*smoothstep(0.,.04,vUV.y)*smoothstep(0.,.04,1.-vUV.y);gl_FragColor=vec4(.015,.025,.04,.12*edge);return;}
vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;vec3 l=normalize(uLight-vPosition),eye=normalize(vec3(0.,0.,6.)-vPosition);vec2 q=vUV*vec2(260.,220.);vec2 cell=floor(q);float pattern=uWeave<.5?mod(cell.x+cell.y,2.):(uWeave<1.5?step(2.,mod(cell.x+cell.y,4.)):step(1.,mod(cell.x+cell.y*2.,5.)));float warp=sin(fract(q.x)*3.14159),weft=sin(fract(q.y)*3.14159);float thread=mix(warp,weft,pattern);vec3 base=uColor*(.75+.25*thread);float diffuse=max(dot(n,l),0.);vec3 h=normalize(l+eye);float spec=pow(max(dot(n,h),0.),uShine)*(.1+uShine*.008);float rim=pow(1.-abs(dot(n,eye)),3.)*.15;float fiber=sin(vUV.y*1400.+sin(vUV.x*650.))*.014;vec3 warm=vec3(1.,.89,.76);vec3 light=base*(.17+.72*diffuse)+warm*spec+uColor*rim+fiber;gl_FragColor=vec4(light,1.);}`;
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Shader compilation failed');return s;}
let program;
try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Program link failed');}
catch{$('render-status').textContent='3B çizim başlatılamadı. Tarayıcının grafik desteğini kontrol et.';for(const e of document.querySelectorAll('aside input,aside select,aside button,#motion'))e.disabled=true;return;}
gl.useProgram(program);
const loc={};for(const name of ['uYaw','uPitch','uAspect','uDistance','uColor','uLight','uShine','uWeave','uPass'])loc[name]=gl.getUniformLocation(program,name);
const buffers={p:gl.createBuffer(),n:gl.createBuffer(),uv:gl.createBuffer(),idx:gl.createBuffer()};
function attribute(name,buffer,size){const l=gl.getAttribLocation(program,name);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,0,0);}
attribute('aPosition',buffers.p,3);attribute('aNormal',buffers.n,3);attribute('aUV',buffers.uv,2);
gl.bindBuffer(gl.ARRAY_BUFFER,buffers.uv);gl.bufferData(gl.ARRAY_BUFFER,uv,gl.STATIC_DRAW);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buffers.idx);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
function pin(){for(let x=0;x<=N;x++){const p=x*3;positions[p]=rest[p];positions[p+1]=rest[p+1];positions[p+2]=rest[p+2];}}
function simulate(dt){
const wind=Number($('wind').value)/100,dir=Number($('direction').value)*Math.PI/180,soft=$('material').value==='silk'?1.3:$('material').value==='linen'?.7:1;
for(let k=N+1;k<COUNT;k++){const p=k*3,amount=k/COUNT;const gust=Math.sin(clock*2.4+positions[p]*2.8)+.45*Math.sin(clock*4.7+amount*7);const force=wind*(.65+gust*.5)*soft;for(let j=0;j<3;j++){const value=positions[p+j],velocity=(value-previous[p+j])*.982;previous[p+j]=value;const acc=j===0?Math.sin(dir)*force*.65:j===1?-.72:Math.cos(dir)*force*2.2+(dream?Math.sin(clock*1.5+amount*9)*.9:0);positions[p+j]=value+velocity+acc*dt*dt;}}
for(let pass=0;pass<5;pass++){for(const [a,b,len,stiff] of links){const dx=positions[b]-positions[a],dy=positions[b+1]-positions[a+1],dz=positions[b+2]-positions[a+2];const dist=Math.hypot(dx,dy,dz)||1;const f=(dist-len)/dist*.5*stiff;positions[a]+=dx*f;positions[a+1]+=dy*f;positions[a+2]+=dz*f;positions[b]-=dx*f;positions[b+1]-=dy*f;positions[b+2]-=dz*f;}pin();}
for(let k=N+1;k<COUNT;k++){const p=k*3;if(positions[p+1]<-1.18)positions[p+1]=-1.18;}
}
function normalData(){for(let y=0;y<=M;y++)for(let x=0;x<=N;x++){const k=y*(N+1)+x,p=k*3,l=(y*(N+1)+Math.max(0,x-1))*3,r=(y*(N+1)+Math.min(N,x+1))*3,t=(Math.max(0,y-1)*(N+1)+x)*3,b=(Math.min(M,y+1)*(N+1)+x)*3;const ax=positions[r]-positions[l],ay=positions[r+1]-positions[l+1],az=positions[r+2]-positions[l+2],bx=positions[t]-positions[b],by=positions[t+1]-positions[b+1],bz=positions[t+2]-positions[b+2];const nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx,d=Math.hypot(nx,ny,nz)||1;normals[p]=nx/d;normals[p+1]=ny/d;normals[p+2]=nz/d;}}
function upload(data,buffer){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);}
function render(){
if(lost)return;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
gl.uniform1f(loc.uYaw,yaw);gl.uniform1f(loc.uPitch,pitch);gl.uniform1f(loc.uAspect,cv.width/cv.height);gl.uniform1f(loc.uDistance,distance);
const angle=Number($('light').value)*Math.PI/180,lx=Math.sin(angle)*2.7,lz=1.8+Math.cos(angle)*1.4;gl.uniform3f(loc.uLight,lx,2.4,lz);
gl.uniform3fv(loc.uColor,colors[$('color').value]);const type=$('material').value;gl.uniform1f(loc.uShine,type==='silk'?64:type==='linen'?10:22);gl.uniform1f(loc.uWeave,type==='silk'?2:type==='linen'?0:1);
normalData();upload(normals,buffers.n);
for(let k=0;k<COUNT;k++){const p=k*3,t=(positions[p+1]+1.23)/2.4;shadow[p]=positions[p]-lx*t;shadow[p+1]=-1.225;shadow[p+2]=positions[p+2]-lz*t;}
gl.depthMask(false);gl.uniform1f(loc.uPass,1);upload(shadow,buffers.p);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
gl.depthMask(true);gl.uniform1f(loc.uPass,0);upload(positions,buffers.p);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
}
function tick(now){raf=0;if(lost||document.hidden)return;const dt=last?Math.min((now-last)/1000,.03):1/60;last=now;if(running){clock+=dt;simulate(dt);dirty=true;}if(dirty){render();dirty=false;}if(running)raf=requestAnimationFrame(tick);}
function request(){dirty=true;if(!raf&&!document.hidden&&!lost)raf=requestAnimationFrame(tick);}
function resize(){const r=cv.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.6);cv.width=Math.max(1,Math.round(r.width*dpr));cv.height=Math.max(1,Math.round(r.height*dpr));gl.viewport(0,0,cv.width,cv.height);request();}
function view(){let degrees=((yaw*180/Math.PI)%360+360)%360;$('angle').value=String(Math.round(degrees));updateUI();request();}
for(const id of ['material','color','wind','direction','light'])$(id).addEventListener('input',()=>{updateUI();request();});
$('angle').addEventListener('input',()=>{yaw=Number($('angle').value)*Math.PI/180;updateUI();request();});
$('motion').addEventListener('click',()=>{running=!running;last=0;updateUI();$('render-status').textContent=running?'Hareket açık. Kontrol sende.':'Hareket durdu. Kumaşı çevirmeye devam edebilirsin.';request();});
$('dream').addEventListener('click',()=>{dream=!dream;updateUI();request();});
$('near').addEventListener('click',()=>{distance=Math.max(2.2,distance-.4);request();});
$('far').addEventListener('click',()=>{distance=Math.min(7,distance+.4);request();});
$('reset').addEventListener('click',()=>{positions.set(rest);previous.set(rest);yaw=0;pitch=-.06;distance=3.7;dream=false;clock=0;$('material').value='silk';$('color').value='apricode';$('wind').value='35';$('direction').value='0';$('light').value='-35';$('angle').value='0';updateUI();$('render-status').textContent='İlk görünüme döndün.';request();});
const pointers=new Map();let pinch=0;
cv.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,[e.clientX,e.clientY]);cv.setPointerCapture(e.pointerId);if(pointers.size===2){const a=Array.from(pointers.values());pinch=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);}});
cv.addEventListener('pointermove',e=>{const old=pointers.get(e.pointerId);if(!old)return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const a=Array.from(pointers.values()),d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);if(pinch)distance=Math.max(2.2,Math.min(7,distance+(pinch-d)*.009));pinch=d;request();}else{yaw+=(e.clientX-old[0])*.009;pitch=Math.max(-1.1,Math.min(1.1,pitch+(e.clientY-old[1])*.005));view();}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])cv.addEventListener(event,e=>{pointers.delete(e.pointerId);pinch=0;});
cv.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Home'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')yaw-=.2;if(e.key==='ArrowRight')yaw+=.2;if(e.key==='ArrowUp')pitch=Math.max(-1.1,pitch-.12);if(e.key==='ArrowDown')pitch=Math.min(1.1,pitch+.12);if(e.key===' ')$('motion').click();if(e.key==='Home')$('reset').click();view();}});
cv.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;running=false;updateUI();for(const e of document.querySelectorAll('aside input,aside select,aside button,#motion'))e.disabled=true;$('render-status').textContent='Grafik bağlantısı kesildi. Sayfayı yenileyerek yeniden açabilirsin.';});
document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0;}else request();});
window.addEventListener('resize',resize);
$('render-status').textContent=reduced?'Hareket tercihin nedeniyle duraklatıldı.':'Hareket açık. Kontrol sende.';
for(let n=0;n<30;n++)simulate(1/60);updateUI();resize();
})();