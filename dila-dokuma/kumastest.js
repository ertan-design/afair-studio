'use strict';
document.querySelectorAll('[data-dila-fabric]').forEach(panel => {
  const canvas = panel.querySelector('canvas');
  const angleInput = panel.querySelector('[data-angle]');
  const windInput = panel.querySelector('[data-wind]');
  const motionButton = panel.querySelector('[data-motion]');
  const status = panel.querySelector('[data-fabric-status]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const gl = canvas.getContext('webgl', {antialias:true, alpha:true});
  const vertex = `
    attribute vec2 uv;
    varying mediump vec2 tex;
    varying mediump vec3 normal;
    varying mediump vec3 position;
    uniform vec2 viewport;
    uniform float time, wind, orbit;
    vec3 cloth(vec2 q){
      float u=q.x, v=q.y, free=pow(v,1.25);
      float wave=sin(u*8.0+v*9.0-time*2.6)*0.18+cos(u*17.0-v*4.1+time*1.7)*0.075;
      return vec3((u-.5)*2.38,(.5-v)*1.48+free*(wind*.14+sin(time*1.3+u*7.0)*wind*.11),free*wave*(.32+wind)+v*.16);
    }
    vec3 rotate(vec3 p){
      float c=cos(orbit),s=sin(orbit);
      vec3 a=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);
      return vec3(a.x,a.y*.95-a.z*.312,a.y*.312+a.z*.95);
    }
    void main(){
      vec3 p=cloth(uv);
      vec3 a=cloth(uv+vec2(.002,0.0))-p;
      vec3 b=cloth(uv+vec2(0.0,.002))-p;
      position=rotate(p);
      normal=normalize(rotate(cross(b,a)));
      tex=uv;
      float perspective=3.5-position.z;
      gl_Position=vec4(position.x*min(viewport.y/viewport.x,1.0)*2.28,position.y*2.45,-position.z,perspective);
    }`;
  const fragment = `
    precision mediump float;
    varying mediump vec2 tex;
    varying mediump vec3 normal;
    varying mediump vec3 position;
    void main(){
      vec3 n=normalize(normal);
      vec3 light=normalize(vec3(-.55,.8,1.1));
      vec3 eye=normalize(vec3(0.0,0.0,3.5)-position);
      if(dot(n,eye)<0.0)n=-n;
      float diffuse=max(0.0,dot(n,light));
      float shine=pow(max(0.0,dot(n,normalize(light+eye))),24.0);
      float warp=sin(tex.x*860.0);
      float weft=sin(tex.y*780.0);
      float threads=.90+.09*max(warp,weft)+.055*warp*weft;
      vec3 dark=vec3(.24,.085,.10);
      vec3 lightFibres=vec3(.92,.58,.37);
      vec3 colour=mix(dark,lightFibres,.16+diffuse*.68)*threads;
      float seam=min(min(tex.x,1.0-tex.x),min(tex.y,1.0-tex.y));
      colour+=vec3(.48,.30,.16)*shine*.48;
      colour*=smoothstep(0.0,.012,seam)*.32+.68;
      gl_FragColor=vec4(colour,1.0);
    }`;
  let angle = Number(angleInput.value);
  let wind = Number(windInput.value)/100;
  let moving = !reduced.matches;
  let frame = 0;
  let last = 0;
  let elapsed = 0;
  let visible = false;
  let drag = null;
  let viewport, clock, gust, orbit, count;
  const unavailable = () => {
    panel.dataset.unavailable = '';
    status.textContent = 'Bu tarayıcıda 3B kumaş açılamadı. Aşağıdaki dokuma örneklerini inceleyebilirsin.';
  };
  if (!gl) { unavailable(); return; }
  function compile(type, source) {
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  try {
    const program=gl.createProgram();
    gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const mesh=[];
    const width=72,height=48;
    for (let y=0;y<height;y++) for (let x=0;x<width;x++) {
      const a=x/width,b=(x+1)/width,c=y/height,d=(y+1)/height;
      mesh.push(a,c,b,c,a,d,b,c,b,d,a,d);
    }
    const buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh),gl.STATIC_DRAW);
    const attribute=gl.getAttribLocation(program,'uv');
    gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(attribute);
    viewport=gl.getUniformLocation(program,'viewport');
    clock=gl.getUniformLocation(program,'time');
    gust=gl.getUniformLocation(program,'wind');
    orbit=gl.getUniformLocation(program,'orbit');
    count=mesh.length/2;
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0,0,0,0);
  } catch(error) { console.error(error); unavailable(); return; }
  function draw() {
    const scale=Math.min(devicePixelRatio,1.75);
    const w=Math.max(1,Math.round(canvas.clientWidth*scale)),h=Math.max(1,Math.round(canvas.clientHeight*scale));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,w,h);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform2f(viewport,w,h);
    gl.uniform1f(clock,elapsed);
    gl.uniform1f(gust,wind);
    gl.uniform1f(orbit,angle*Math.PI/180);
    gl.drawArrays(gl.TRIANGLES,0,count);
  }
  function update(now) {
    frame=0;
    if (moving&&visible&&!document.hidden) {
      elapsed+=last?Math.min((now-last)/1000,.04):0;
      last=now;
      draw();
      frame=requestAnimationFrame(update);
    }
  }
  function sync() {
    motionButton.textContent=moving?'Hareketi durdur':'Hareketi başlat';
    cancelAnimationFrame(frame);frame=0;last=0;
    draw();
    if(moving&&visible&&!document.hidden)frame=requestAnimationFrame(update);
  }
  function rotate(value) {
    angle=value;
    angleInput.value=String(Math.round(value));
    panel.querySelector('[data-angle-value]').textContent=Math.round(value)+'°';
    draw();
  }
  angleInput.addEventListener('input',()=>rotate(Number(angleInput.value)));
  windInput.addEventListener('input',()=>{wind=Number(windInput.value)/100;draw();});
  motionButton.addEventListener('click',()=>{moving=!moving;sync();});
  reduced.addEventListener('change',event=>{if(event.matches){moving=false;sync();}});
  canvas.addEventListener('pointerdown',event=>{
    if (!event.isPrimary || event.button!==0) return;
    drag={pointer:event.pointerId,x:event.clientX,angle};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(drag?.pointer!==event.pointerId)return;
    rotate(((drag.angle+(event.clientX-drag.x)*.75)%360+360)%360);
  });
  canvas.addEventListener('lostpointercapture',()=>{drag=null;});
  canvas.addEventListener('webglcontextlost',()=>{cancelAnimationFrame(frame);unavailable();});
  document.addEventListener('visibilitychange',sync);
  new ResizeObserver(draw).observe(canvas);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();}).observe(canvas);
  sync();
});
