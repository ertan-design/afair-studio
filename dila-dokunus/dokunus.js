(() => {
'use strict';
const $ = id => document.getElementById(id);
const canvas = $('cloth');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = {version:1,material:'silk',wind:35,light:65,yaw:0.32,pitch:0.12,paused:reduced,time:0};
const materials = {
silk:{name:'01 / İPEK',note:'Akışkan kıvrımlar. Işığı izleyen yumuşak bir parıltı.',color:[0.45,0.74,0.70],rough:0.16,weight:1},
linen:{name:'02 / KETEN',note:'Belirgin bir örgü. Daha tok kıvrımlar, sakin bir yüzey.',color:[0.83,0.65,0.45],rough:0.7,weight:0.65},
wool:{name:'03 / YÜN',note:'Yumuşak bir hacim. Işığı dağıtan yoğun bir doku.',color:[0.67,0.33,0.29],rough:0.95,weight:0.4}};
let gl,program,frame=0,last=0,disposed=false;
const uniforms={};
function publish(){canvas.dataset.material=state.material;canvas.dataset.wind=String(state.wind);canvas.dataset.light=String(state.light);canvas.dataset.yaw=String(state.yaw);canvas.dataset.paused=String(state.paused);canvas.dataset.time=String(state.time);}
function ui(){const m=materials[state.material];$('material').value=state.material;$('material-caption').textContent=m.name;$('material-note').textContent=m.note;for(const key of ['wind','light']){$(key).value=state[key];$(key+'-value').textContent=state[key]+'%';}$('pause').textContent=state.paused?'Sürdür ▷':'Durdur Ⅱ';$('pause').setAttribute('aria-pressed',String(state.paused));publish();}
function fallback(){if(frame)cancelAnimationFrame(frame);disposed=true;canvas.hidden=true;$('fallback').hidden=false;$('turn-hint').textContent='DİJİTAL DOKU YORUMU';for(const key of ['wind','light','pause'])$(key).disabled=true;$('status').textContent='3B görünüm bu cihazda kullanılamıyor.';}
const vertex = `
precision highp float;
attribute vec2 aUV;
uniform float uTime,uWind,uYaw,uPitch,uAspect,uWeight;
varying vec3 vNormal,vPosition;
varying vec2 vUV;
vec3 surface(vec2 uv){
 float x=(uv.x-.5)*2.25;
 float y=(uv.y-.5)*2.8;
 float freeEdge=1.-uv.y*.72;
 float wave=sin(x*5.2+y*.85+uTime*1.55*uWind)*(.11+uWind*.15)*uWeight;
 float ripple=sin(y*6.5-x*2.6-uTime*2.1)*uWind*.075*uWeight;
 float z=wave+ripple+sin(x*2.2+y*1.2)*.25;
 x+=sin(y*2.2+uTime*.7)*uWind*.12*freeEdge*uWeight;
 y+=cos(x*3.5+uTime*.8*uWind)*(.045+uWind*.025)*freeEdge;
 return vec3(x,y,z);
}
mat3 rotate(){float c=cos(uYaw),s=sin(uYaw),p=cos(uPitch),q=sin(uPitch);return mat3(c,s*q,-s*p,0.,p,q,s,-c*q,c*p);}
void main(){vec3 p=surface(aUV);vec3 du=surface(aUV+vec2(.001,0.))-p;vec3 dv=surface(aUV+vec2(0.,.001))-p;mat3 r=rotate();vNormal=r*normalize(cross(du,dv));p=r*p;vPosition=p;vUV=aUV;float depth=4.6-p.z;gl_Position=vec4(p.x*2.6/uAspect,p.y*2.6,depth*.5-1.,depth);}`;
const fragment = `
precision highp float;
uniform vec3 uColor;
uniform float uLight,uRough;
varying vec3 vNormal,vPosition;
varying vec2 vUV;
void main(){vec3 N=normalize(vNormal);if(!gl_FrontFacing)N=-N;vec3 L=normalize(vec3(-1.8+uLight*3.,2.,3.));vec3 V=normalize(vec3(0.,0.,4.6)-vPosition);vec3 H=normalize(L+V);float diffuse=max(dot(N,L),0.);float spec=pow(max(dot(N,H),0.),mix(95.,9.,uRough));float fresnel=pow(1.-max(dot(N,V),0.),3.);float warp=sin(vUV.x*1100.);float weft=sin(vUV.y*1300.);float weave=warp*weft;float grain=fract(sin(dot(floor(vUV*700.),vec2(12.9898,78.233)))*43758.5453);float texture=1.+weave*mix(.025,.07,uRough)+(grain-.5)*uRough*.08;vec3 col=uColor*texture*(.22+diffuse*(.55+uLight*.8));col+=vec3(1.,.86,.69)*spec*(1.-uRough*.8)*(.28+uLight*.65);col+=vec3(.49,1.,.83)*fresnel*.13;float hem=min(min(vUV.x,1.-vUV.x),min(vUV.y,1.-vUV.y));col*=mix(.75,1.,smoothstep(.002,.007,hem));col=pow(col,vec3(.85));gl_FragColor=vec4(col,1.);}`;
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error('Shader compilation failed');}return s;}
function init(){gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});if(!gl)throw new Error('WebGL unavailable');program=gl.createProgram();const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Shader linking failed');gl.useProgram(program);const vertices=[],indices=[],n=110;for(let y=0;y<=n;y++)for(let x=0;x<=n;x++)vertices.push(x/n,y/n);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const a=y*(n+1)+x;indices.push(a,a+1,a+n+1,a+1,a+n+2,a+n+1);}const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'aUV');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);for(const name of ['Time','Wind','Yaw','Pitch','Aspect','Weight','Color','Light','Rough'])uniforms[name]=gl.getUniformLocation(program,'u'+name);gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);return indices.length;}
let count=0;
function draw(now){if(disposed)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(!state.paused&&!document.hidden)state.time+=dt;const rect=canvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,1.6);const w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);const m=materials[state.material];for(const [name,value] of Object.entries({Time:state.time,Wind:state.wind/100,Yaw:state.yaw,Pitch:state.pitch,Aspect:w/h,Weight:m.weight,Light:state.light/100,Rough:m.rough}))gl.uniform1f(uniforms[name],value);gl.uniform3fv(uniforms.Color,m.color);gl.drawElements(gl.TRIANGLES,count,gl.UNSIGNED_SHORT,0);publish();frame=requestAnimationFrame(draw);}
$('material').addEventListener('change',event=>{if(materials[event.target.value]){state.material=event.target.value;ui();}});
for(const key of ['wind','light'])$(key).addEventListener('input',event=>{state[key]=Math.max(0,Math.min(100,Number(event.target.value)||0));ui();});
$('pause').addEventListener('click',()=>{state.paused=!state.paused;ui();});
$('reset').addEventListener('click',()=>{Object.assign(state,{material:'silk',wind:35,light:65,yaw:.32,pitch:.12,paused:reduced,time:0});ui();$('status').textContent='İlk dokunuşa dönüldü.';});
let pointer=null;
canvas.addEventListener('pointerdown',event=>{pointer={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true});});
canvas.addEventListener('pointermove',event=>{if(!pointer||event.pointerId!==pointer.id)return;state.yaw+=(event.clientX-pointer.x)*.012;state.pitch=Math.max(-.8,Math.min(.8,state.pitch+(event.clientY-pointer.y)*.006));pointer.x=event.clientX;pointer.y=event.clientY;publish();});
for(const eventName of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(eventName,()=>{pointer=null;});
canvas.addEventListener('keydown',event=>{const step=event.shiftKey?.3:.1;if(event.key==='ArrowLeft')state.yaw-=step;else if(event.key==='ArrowRight')state.yaw+=step;else if(event.key==='ArrowUp')state.pitch=Math.min(.8,state.pitch+step);else if(event.key==='ArrowDown')state.pitch=Math.max(-.8,state.pitch-step);else return;event.preventDefault();publish();});
$('download').addEventListener('click',()=>{const exported={...state,renderer:'illustrative-webgl-cloth',rendererAvailable:!disposed,illustrative:true,calibrated:false,createdAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(exported,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='afair-dokunus.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='Çalışma ayarları JSON olarak indirildi.';});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback();});
document.addEventListener('visibilitychange',()=>{last=0;});
ui();try{count=init();frame=requestAnimationFrame(draw);}catch(error){console.warn('AFAIR: 3B görünüm başlatılamadı.',error.message);fallback();}
})();

